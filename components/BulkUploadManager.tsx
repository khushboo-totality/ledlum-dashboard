'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { Product } from '@/types'
import { authFetch } from '@/lib/supabaseClient'
import {
  BULK_APPLY_CHUNK, CLEAR_TOKEN, FIELDS, normHeading,
  type BulkInputRow, type BulkOptions, type BulkPlanItem, type BulkStatus, type ColumnTarget,
} from '@/lib/bulkColumns'
import type { CategorySource, HeadingInfo, ParsedWorkbook } from '@/lib/bulkSheet'

type Phase = 'idle' | 'reading' | 'mapping' | 'checking' | 'previewed' | 'applying' | 'done'
type Filter = BulkStatus | 'all'

const STATUS: Record<BulkStatus, { label: string; badge: string }> = {
  create:    { label: 'New',       badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  update:    { label: 'Updated',   badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  unchanged: { label: 'Unchanged', badge: 'bg-gray text-gray-dark border-gray-mid' },
  delete:    { label: 'Delete',    badge: 'bg-primary/5 text-primary border-primary/20' },
  error:     { label: 'Error',     badge: 'bg-red-50 text-red-700 border-red-200' },
}
const ORDER: BulkStatus[] = ['create', 'update', 'delete', 'error', 'unchanged']
const ACTIONABLE = new Set<BulkStatus>(['create', 'update', 'delete'])
const PAGE = 100

// Mapping dropdown: target ↔ option value.
const targetValue = (t: ColumnTarget) => (t.type === 'field' ? `field:${t.key}` : t.type)
const valueTarget = (v: string): ColumnTarget =>
  v.startsWith('field:') ? { type: 'field', key: v.slice(6) } : { type: v as 'ignore' | 'id' | 'action' | 'spec' | 'price' }
const TARGET_OPTIONS: { value: string; label: string }[] = [
  { value: 'ignore', label: '— Ignore —' },
  { value: 'spec', label: 'Extra spec (uses the heading as its name)' },
  { value: 'price', label: 'Extra price (uses the heading as its name)' },
  ...FIELDS.map(f => ({ value: `field:${f.key}`, label: f.label })),
  { value: 'id', label: 'Product id' },
  { value: 'action', label: 'Action (delete)' },
]

const count = (items: BulkPlanItem[], s: BulkStatus) => items.filter(i => i.status === s).length
const empty = (v: string) => v || <span className="italic text-gray-dark">empty</span>
const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** Admin page: upload any product workbook, map its columns, preview exactly
 * what would change, then apply it (see lib/services/bulkProducts.ts). */
export default function BulkUploadManager() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [phase, setPhase]       = useState<Phase>('idle')
  const [error, setError]       = useState('')
  const [exporting, setExporting] = useState<'' | 'all' | 'template'>('')

  // Step 2 — the uploaded workbook and how to read it
  const [workbook, setWorkbook] = useState<ParsedWorkbook | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [headings, setHeadings] = useState<HeadingInfo[]>([])
  const [mapping, setMapping]   = useState<Record<string, ColumnTarget>>({})
  const [categorySource, setCategorySource] = useState<CategorySource>('none')
  const [categoryForExisting, setCategoryForExisting] = useState(false)
  const [createCategories, setCreateCategories] = useState(true)
  const [collection, setCollection] = useState('')
  const [collections, setCollections] = useState<string[]>([])

  // Step 3 — preview / results
  const [rows, setRows]         = useState<BulkInputRow[]>([])
  const [skippedRows, setSkippedRows] = useState(0)
  const [plan, setPlan]         = useState<BulkPlanItem[]>([])
  const [results, setResults]   = useState<BulkPlanItem[]>([])
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [filter, setFilter]     = useState<Filter>('all')
  const [shown, setShown]       = useState(PAGE)

  // Main categories (collections) for categories the upload creates.
  useEffect(() => {
    fetch('/api/product-taxonomy')
      .then(res => res.json())
      .then((tax: { name: string }[]) => {
        if (Array.isArray(tax)) setCollections(tax.map(t => t.name).filter(n => n && n !== 'Uncategorized'))
      })
      .catch(() => {})
  }, [])

  const options: BulkOptions = {
    createCategories,
    newCategoryCollection: collection || null,
    categoryForExisting: categorySource !== 'none' && categoryForExisting,
  }

  const reset = () => {
    setPhase('idle'); setError(''); setWorkbook(null); setSelected(new Set()); setHeadings([]); setMapping({})
    setRows([]); setSkippedRows(0); setPlan([]); setResults([]); setFilter('all'); setShown(PAGE)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleExport = async (kind: 'all' | 'template') => {
    setExporting(kind); setError('')
    try {
      let products: Product[] = []
      if (kind === 'all') {
        const res = await fetch('/api/products', { cache: 'no-store' })
        if (!res.ok) throw new Error('Could not load products')
        products = (await res.json()).data ?? []
      }
      const { exportProductsXlsx } = await import('@/lib/bulkSheet')
      const date = new Date().toISOString().slice(0, 10)
      await exportProductsXlsx(products, kind === 'all' ? `LEDLUM-products-${date}.xlsx` : 'LEDLUM-products-template.xlsx')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setExporting('')
    }
  }

  // ── Step 2a: read the file and pre-fill the mapping ──
  const handleFile = async (file: File | undefined) => {
    if (!file) return
    reset()
    setPhase('reading')
    try {
      const { readWorkbook, listHeadings, suggestMapping } = await import('@/lib/bulkSheet')
      const wb = await readWorkbook(file)
      const hs = listHeadings(wb.sheets)
      const map = suggestMapping(hs)
      const hasCategoryColumn = Object.values(map).some(t => t.type === 'field' && t.key === 'group_name')
      const source: CategorySource = hasCategoryColumn ? 'column' : wb.sheets.length > 1 ? 'sheet' : 'none'

      setWorkbook(wb)
      setSelected(new Set(wb.sheets.map(s => s.name)))
      setHeadings(hs)
      setMapping(map)
      setCategorySource(source)
      setCategoryForExisting(source === 'column')
      setCollection(collections.find(c => file.name.toLowerCase().includes(c.toLowerCase())) ?? '')
      setPhase('mapping')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read the file')
      setPhase('idle')
    }
  }

  const selectedSheets = useMemo(
    () => workbook?.sheets.filter(s => selected.has(s.name)) ?? [],
    [workbook, selected],
  )
  const visibleHeadings = useMemo(() => {
    const keys = new Set(selectedSheets.flatMap(s => s.headings.map(normHeading)))
    return headings.filter(h => keys.has(h.key))
  }, [headings, selectedSheets])
  const mappedTo = (key: string) => visibleHeadings.filter(h => {
    const t = mapping[h.key]
    return t?.type === 'field' && t.key === key
  })
  const hasModel = mappedTo('model').length > 0 || visibleHeadings.some(h => mapping[h.key]?.type === 'id')
  const hasCategoryColumn = mappedTo('group_name').length > 0

  // ── Step 2b: build rows and ask the server what would change ──
  const handleCheck = async () => {
    if (!workbook) return
    setPhase('checking'); setError('')
    try {
      const { buildRows } = await import('@/lib/bulkSheet')
      const built = buildRows(selectedSheets, mapping, categorySource === 'column' && !hasCategoryColumn ? 'none' : categorySource)
      if (built.rows.length === 0) throw new Error('No product rows to check — is the model column mapped correctly?')
      const res = await authFetch('/api/products/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'preview', rows: built.rows, options }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'Could not check the file')
      setRows(built.rows); setSkippedRows(built.skippedRows); setPlan(data.items)
      setFilter('all'); setShown(PAGE); setPhase('previewed')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not check the file')
      setPhase('mapping')
    }
  }

  // ── Step 3: apply in chunks ──
  const handleApply = async () => {
    const toApply = new Set(plan.filter(i => ACTIONABLE.has(i.status)).map(i => i.row))
    const batchRows = rows.filter(r => toApply.has(r.row))
    const deletes = count(plan, 'delete')
    const newCats = Array.from(new Set(plan.flatMap(i => (i.warnings ?? []).filter(w => w.startsWith('New category')))))
    if (batchRows.length === 0) return
    if (!confirm(
      `Apply ${batchRows.length} change${batchRows.length === 1 ? '' : 's'}?` +
      (newCats.length ? `\n\n${newCats.length} new categor${newCats.length === 1 ? 'y' : 'ies'} will be created.` : '') +
      (deletes ? `\n\n${deletes} product${deletes === 1 ? '' : 's'} will be permanently deleted.` : '')
    )) return

    setPhase('applying'); setError(''); setProgress({ done: 0, total: batchRows.length })
    const out: BulkPlanItem[] = []
    for (let i = 0; i < batchRows.length; i += BULK_APPLY_CHUNK) {
      const batch = batchRows.slice(i, i + BULK_APPLY_CHUNK)
      try {
        const res = await authFetch('/api/products/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: 'apply', rows: batch, options }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`)
        out.push(...data.items)
      } catch (err) {
        // Keep going with the next batch; report these rows as failed.
        const msg = err instanceof Error ? err.message : 'Request failed'
        out.push(...batch.map(r => ({
          row: r.row, sheet: r.sheet, line: r.line, status: 'error' as const, model: r.data.model ?? '', errors: [msg],
        })))
      }
      setProgress({ done: Math.min(i + batch.length, batchRows.length), total: batchRows.length })
    }
    setResults(out); setFilter('all'); setShown(PAGE); setPhase('done')
  }

  const list = phase === 'done' ? results : plan
  const visible = (filter === 'all' ? list : list.filter(i => i.status === filter))
    .slice().sort((a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status) || a.row - b.row)
  const actionable = plan.filter(i => ACTIONABLE.has(i.status)).length
  const multiSheet = new Set(rows.map(r => r.sheet)).size > 1

  const btn = 'flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-bold font-bai transition-colors disabled:opacity-50'
  const btnGhost = `${btn} border border-gray-mid text-gray-text hover:border-primary hover:text-primary`
  const selectCls = 'w-full appearance-none cursor-pointer border border-gray-mid rounded-lg pl-3 pr-7 py-2 text-xs font-semibold font-bai text-foreground bg-white outline-none focus:border-primary'
  const chevron = <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-dark" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
  const card = 'bg-white rounded-2xl shadow-card border border-white/80 overflow-hidden'
  const h2 = 'text-xl font-bold font-bai text-foreground'
  const busy = phase === 'reading' || phase === 'checking' || phase === 'applying'

  return (
    <div className="space-y-5">
      {/* Step 1 — upload */}
      <section className={card}>
        <div className="h-1 bg-gradient-to-r from-primary to-primary-dark" />
        <div className="px-6 py-5 sm:px-7 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className={h2}>1. Upload a product sheet</h2>
              <p className="text-xs text-gray-text font-pop mt-1 max-w-2xl">
                Any Excel layout works — your price-list workbooks (one sheet per series) or the export below.
                Every sheet with an Item Number / Model column is read. Nothing is saved until you press Apply.
              </p>
            </div>
            {workbook && !busy && <button onClick={reset} className={btnGhost}>Upload another file</button>}
          </div>

          <input ref={fileRef} type="file" accept=".xlsx,.csv" className="hidden" onChange={e => handleFile(e.target.files?.[0])} />
          {!workbook && (
            <button
              onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]) }}
              disabled={phase === 'reading'}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-mid px-6 py-10 text-center transition-colors hover:border-primary hover:bg-primary/5 disabled:opacity-70"
            >
              {phase === 'reading' ? (
                <>
                  <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <span className="text-sm font-semibold font-bai text-foreground">Reading the workbook…</span>
                </>
              ) : (
                <>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-primary"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  <span className="text-sm font-semibold font-bai text-foreground">Choose an .xlsx / .csv file or drop it here</span>
                </>
              )}
            </button>
          )}

          {!workbook && (
            <div className="flex flex-wrap items-center gap-2 border-t border-gray pt-4">
              <span className="text-xs font-pop text-gray-dark">To edit the current catalogue in Excel:</span>
              <button onClick={() => handleExport('all')} disabled={!!exporting} className={btnGhost}>
                {exporting === 'all' ? 'Preparing…' : 'Download all products (.xlsx)'}
              </button>
              <button onClick={() => handleExport('template')} disabled={!!exporting} className={btnGhost}>
                {exporting === 'template' ? 'Preparing…' : 'Blank sheet'}
              </button>
            </div>
          )}

          {error && <p className="text-sm text-primary font-pop bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">{error}</p>}
        </div>
      </section>

      {/* Step 2 — sheets & columns */}
      {workbook && (
        <section className={card}>
          <div className="px-6 py-5 sm:px-7 space-y-5">
            <div>
              <h2 className={h2}>2. Check how the file is read</h2>
              <p className="text-xs text-gray-text font-pop mt-1">
                <strong className="text-foreground">{workbook.fileName}</strong> · {workbook.sheets.length} product sheet{workbook.sheets.length === 1 ? '' : 's'} ·{' '}
                {workbook.sheets.reduce((s, x) => s + x.rows.length, 0)} rows
                {workbook.skipped.length > 0 && <> · skipped (no model column): {workbook.skipped.join(', ')}</>}
              </p>
            </div>

            {/* Sheets */}
            {workbook.sheets.length > 1 && (
              <div>
                <div className="mb-2 flex items-center gap-3">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-gray-dark font-pop">Sheets</p>
                  <button disabled={phase !== 'mapping'} onClick={() => setSelected(new Set(workbook.sheets.map(s => s.name)))} className="text-[11px] font-semibold text-primary font-pop">All</button>
                  <button disabled={phase !== 'mapping'} onClick={() => setSelected(new Set())} className="text-[11px] font-semibold text-primary font-pop">None</button>
                </div>
                <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
                  {workbook.sheets.map(s => {
                    const on = selected.has(s.name)
                    return (
                      <button
                        key={s.name}
                        disabled={phase !== 'mapping'}
                        onClick={() => setSelected(prev => { const n = new Set(prev); if (on) n.delete(s.name); else n.add(s.name); return n })}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold font-bai transition-colors ${
                          on ? 'border-primary bg-primary/10 text-primary' : 'border-gray-mid bg-white text-gray-dark line-through'
                        }`}
                        title={`Headings on row ${s.headerLine}`}
                      >
                        {s.name} <span className="text-gray-dark">{s.rows.length}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Columns */}
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-gray-dark font-pop">Columns</p>
              <div className="overflow-hidden rounded-xl border border-gray-mid">
                <div className="hidden grid-cols-[1fr_1fr_1.3fr] gap-3 bg-gray/50 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-dark font-pop sm:grid">
                  <span>Heading in file</span><span>Example</span><span>Saved as</span>
                </div>
                <ul className="max-h-[420px] divide-y divide-gray overflow-y-auto">
                  {visibleHeadings.map(h => {
                    const t = mapping[h.key] ?? { type: 'ignore' }
                    const dup = t.type === 'field' && mappedTo(t.key).length > 1
                    return (
                      <li key={h.key} className="grid gap-1.5 px-4 py-2.5 sm:grid-cols-[1fr_1fr_1.3fr] sm:items-center sm:gap-3">
                        <span className="text-sm font-semibold font-bai text-foreground">
                          {h.heading}
                          {workbook.sheets.length > 1 && <span className="ml-1.5 text-[10px] font-pop font-normal text-gray-dark">{h.sheets} sheet{h.sheets === 1 ? '' : 's'}</span>}
                        </span>
                        <span className="truncate text-xs font-pop text-gray-text" title={h.sample}>{h.sample || '—'}</span>
                        <div>
                          <div className="relative">
                            <select
                              value={targetValue(t)}
                              disabled={phase !== 'mapping'}
                              onChange={e => setMapping(m => ({ ...m, [h.key]: valueTarget(e.target.value) }))}
                              className={`${selectCls} ${t.type === 'ignore' ? 'text-gray-dark' : ''}`}
                            >
                              {TARGET_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                            {chevron}
                          </div>
                          {dup && <p className="mt-1 text-[10.5px] font-pop text-amber-700">Several columns → this field; the first filled one is used</p>}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
              {!hasModel && <p className="mt-2 text-xs font-pop text-red-700">Map one column to “Model / Item number” — it&apos;s how products are matched.</p>}
            </div>

            {/* Category */}
            <div className="space-y-2.5 rounded-xl border border-gray-mid px-4 py-3.5">
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-dark font-pop">Category (dashboard)</p>
              {([
                ['sheet', 'Use each sheet’s name', workbook.sheets.length > 1 ? 'e.g. “' + workbook.sheets[0].name + '”' : ''],
                ['column', 'Use the column mapped to “Category (dashboard)”', hasCategoryColumn ? mappedTo('group_name').map(h => h.heading).join(', ') : 'no column mapped'],
                ['none', 'Don’t set a category', 'new products are saved as Uncategorized'],
              ] as [CategorySource, string, string][]).map(([value, label, hint]) => (
                <label key={value} className={`flex items-start gap-2.5 text-sm font-pop ${value === 'column' && !hasCategoryColumn ? 'opacity-50' : ''}`}>
                  <input
                    type="radio" name="catsrc" className="mt-1 accent-[#9a8c66]"
                    checked={categorySource === value}
                    disabled={phase !== 'mapping' || (value === 'column' && !hasCategoryColumn)}
                    onChange={() => { setCategorySource(value); setCategoryForExisting(value === 'column') }}
                  />
                  <span>{label}{hint && <span className="block text-[11px] text-gray-dark">{hint}</span>}</span>
                </label>
              ))}
              {categorySource !== 'none' && (
                <div className="space-y-2 border-t border-gray pt-2.5">
                  <label className="flex items-start gap-2.5 text-sm font-pop">
                    <input type="checkbox" className="mt-1 accent-[#9a8c66]" checked={categoryForExisting} disabled={phase !== 'mapping'} onChange={e => setCategoryForExisting(e.target.checked)} />
                    <span>Also move existing products to this category
                      <span className="block text-[11px] text-gray-dark">Off = only new products get it; existing products keep their current category</span>
                    </span>
                  </label>
                  <label className="flex items-start gap-2.5 text-sm font-pop">
                    <input type="checkbox" className="mt-1 accent-[#9a8c66]" checked={createCategories} disabled={phase !== 'mapping'} onChange={e => setCreateCategories(e.target.checked)} />
                    <span>Create categories that don’t exist yet
                      <span className="block text-[11px] text-gray-dark">Off = those rows are reported as errors instead</span>
                    </span>
                  </label>
                  {createCategories && (
                    <div className="flex flex-wrap items-center gap-2 pl-6">
                      <span className="text-xs font-pop text-gray-text">Main category for new categories:</span>
                      <div className="relative w-44">
                        <select value={collection} disabled={phase !== 'mapping'} onChange={e => setCollection(e.target.value)} className={selectCls}>
                          <option value="">None</option>
                          {collections.map(c => <option key={c} value={c}>{titleCase(c)}</option>)}
                        </select>
                        {chevron}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <p className="text-[11px] font-pop text-gray-dark">
              Blank cells and “-” / “N/A” never change a value · type {CLEAR_TOKEN} to clear a field ·
              a Family column with only “F” marks is ignored · any mark in Website shows the product on the site
            </p>

            {(phase === 'mapping' || phase === 'checking') && (
              <button onClick={handleCheck} disabled={phase === 'checking' || !hasModel || selectedSheets.length === 0} className={`${btn} bg-primary hover:bg-primary-dark text-white`}>
                {phase === 'checking' ? 'Checking against the catalogue…' : 'Check changes'}
              </button>
            )}
            {phase === 'previewed' && (
              <button onClick={() => setPhase('mapping')} className={btnGhost}>Change how the file is read</button>
            )}
          </div>
        </section>
      )}

      {/* Step 3 — preview & apply */}
      {(phase === 'previewed' || phase === 'applying' || phase === 'done') && (
        <section className={card}>
          <div className="px-6 py-5 sm:px-7 space-y-4">
            <div>
              <h2 className={h2}>3. Review &amp; apply</h2>
              <p className="text-xs text-gray-text font-pop mt-1">
                {rows.length} product rows checked{skippedRows > 0 && <> · {skippedRows} rows without a model skipped</>}
              </p>
            </div>

            {phase === 'done' && (
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-pop text-emerald-800">
                Done — {count(results, 'create')} created, {count(results, 'update')} updated, {count(results, 'delete')} deleted
                {count(results, 'error') ? <span className="text-red-700">, {count(results, 'error')} failed (see below)</span> : null}.
              </p>
            )}

            {/* Status filter chips */}
            <div className="flex flex-wrap gap-1.5">
              {(['all', ...ORDER] as Filter[]).map(f => {
                const n = f === 'all' ? list.length : count(list, f)
                if (f !== 'all' && n === 0) return null
                return (
                  <button
                    key={f}
                    onClick={() => { setFilter(f); setShown(PAGE) }}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold font-bai transition-colors ${
                      filter === f ? 'border-primary bg-primary text-white' : 'border-gray-mid bg-white text-gray-text hover:border-primary hover:text-primary'
                    }`}
                  >
                    {f === 'all' ? 'All' : STATUS[f].label} <span className={filter === f ? 'text-white/70' : 'text-gray-dark'}>{n}</span>
                  </button>
                )
              })}
            </div>

            {phase === 'previewed' && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-mid bg-gray/40 px-4 py-3">
                <p className="text-xs font-pop text-gray-text">
                  {actionable === 0
                    ? 'Nothing to change — every product in the file already matches the catalogue.'
                    : <>{actionable} row{actionable === 1 ? '' : 's'} will be saved.</>}
                  {count(plan, 'error') > 0 && <span className="text-red-700"> {count(plan, 'error')} row{count(plan, 'error') === 1 ? '' : 's'} with errors will be skipped — fix them and re-upload to include them.</span>}
                </p>
                <button onClick={handleApply} disabled={actionable === 0} className={`${btn} bg-primary hover:bg-primary-dark text-white`}>
                  Apply {actionable} change{actionable === 1 ? '' : 's'}
                </button>
              </div>
            )}

            {phase === 'applying' && (
              <div className="rounded-xl border border-gray-mid px-4 py-3">
                <p className="text-xs font-semibold font-bai text-foreground">Saving {progress.done} / {progress.total}…</p>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray">
                  <div className="h-full bg-primary transition-all" style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }} />
                </div>
              </div>
            )}

            {visible.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-dark font-bai">No rows here</p>
            ) : (
              <ul className="divide-y divide-gray rounded-xl border border-gray-mid">
                {visible.slice(0, shown).map(item => (
                  <li key={item.row} className="flex gap-3 px-4 py-3">
                    <span className="w-24 flex-shrink-0 pt-0.5 text-[11px] font-pop text-gray-dark">
                      {multiSheet && <span className="block truncate" title={item.sheet}>{item.sheet}</span>}
                      Row {item.line}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-semibold font-bai text-foreground">{item.model || '—'}</span>
                        {item.productId && <span className="text-[10px] font-pop text-gray-dark">id {item.productId}</span>}
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide font-pop ${STATUS[item.status].badge}`}>
                          {phase === 'done' && item.status === 'create' ? 'Created' : STATUS[item.status].label}
                        </span>
                      </div>
                      {item.changes && item.changes.length > 0 && item.status !== 'error' && (
                        <ul className="mt-1.5 space-y-0.5">
                          {item.changes.map(c => (
                            <li key={c.field} className="text-[11.5px] font-pop text-gray-text break-words">
                              <span className="font-semibold text-foreground">{c.field}:</span>{' '}
                              {item.status === 'create' ? empty(c.to) : <><span className="line-through decoration-red-300">{empty(c.from)}</span> → {empty(c.to)}</>}
                            </li>
                          ))}
                        </ul>
                      )}
                      {item.errors?.map(e => <p key={e} className="mt-1 text-[11.5px] font-pop text-red-700">{e}</p>)}
                      {item.warnings?.map(w => <p key={w} className="mt-1 text-[11.5px] font-pop text-amber-700">{w}</p>)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {visible.length > shown && (
              <button onClick={() => setShown(s => s + PAGE)} className={`${btnGhost} w-full`}>
                Show more ({visible.length - shown} left)
              </button>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
