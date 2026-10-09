'use client'

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'

export interface FamilyOption { name: string; count: number }

interface FamilyPickerProps {
  value: string
  onChange: (family: string) => void
  families: FamilyOption[]
  loading?: boolean
  /** Current model code — offered as "use as family" (starts a new family). */
  modelCode?: string
  className?: string
}

/** Searchable dropdown of every product family (with counts). Shows the full
 * list when opened; typing filters it; an unknown value can be added as a
 * new family. */
export default function FamilyPicker({ value, onChange, families, loading, modelCode, className = '' }: FamilyPickerProps) {
  const [open, setOpen]   = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const wrapRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  // Close on outside click.
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => { if (!wrapRef.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const q = query.trim().toLowerCase()
  const filtered = useMemo(
    () => (q ? families.filter(f => f.name.toLowerCase().includes(q)) : families),
    [families, q],
  )
  const exact = families.find(f => f.name.toLowerCase() === q)
  const canCreate = q !== '' && !exact
  const current = families.find(f => f.name === value)

  const pick = (name: string) => { onChange(name); setOpen(false); setQuery('') }

  // Keep the highlighted row in view while using the arrow keys.
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [active])

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) { setOpen(true); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i => Math.min(i + 1, filtered.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(i => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered[active]) pick(filtered[active].name)
      else if (canCreate) pick(query.trim())
    } else if (e.key === 'Escape' && open) {
      // Close just the list — don't let the modal's window-level Esc handler see it.
      e.stopPropagation(); e.nativeEvent.stopPropagation(); setOpen(false)
    }
  }

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={open ? query : value}
          onChange={e => { setQuery(e.target.value); setActive(0); setOpen(true) }}
          onFocus={() => { setOpen(true); setQuery(''); setActive(0) }}
          onKeyDown={onKey}
          placeholder={loading ? 'Loading families…' : value ? value : `Search ${families.length} families…`}
          className={`${className} pr-16`}
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
        />
        <div className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
          {!open && current && <span className="text-[10px] text-gray-dark font-pop">{current.count}</span>}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-dark"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      </div>

      {open && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-gray-mid bg-white shadow-xl">
          {/* Quick actions */}
          <div className="flex flex-wrap gap-1.5 border-b border-gray px-3 py-2">
            {canCreate && (
              <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => pick(query.trim())}
                className="rounded-full bg-primary px-2.5 py-1 text-[11px] font-bold text-white hover:bg-primary-dark">
                + New family “{query.trim()}”
              </button>
            )}
            {modelCode && !families.some(f => f.name === modelCode) && (
              <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => pick(modelCode)}
                className="rounded-full border border-primary/30 px-2.5 py-1 text-[11px] font-semibold text-primary hover:bg-primary/5">
                Use model code “{modelCode}” as new family
              </button>
            )}
            {value && (
              <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => pick('')}
                className="rounded-full border border-gray-mid px-2.5 py-1 text-[11px] font-semibold text-gray-text hover:border-red-400 hover:text-red-500">
                No family
              </button>
            )}
            <span className="ml-auto self-center text-[10px] text-gray-dark font-pop">
              {filtered.length} of {families.length}
            </span>
          </div>

          <ul ref={listRef} role="listbox" className="max-h-64 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-3 text-center text-xs text-gray-dark font-pop">
                {loading ? 'Loading…' : 'No family matches — add it as a new family above'}
              </li>
            ) : filtered.map((f, i) => (
              <li key={f.name} data-idx={i} role="option" aria-selected={f.name === value}>
                <button
                  type="button"
                  onMouseDown={e => e.preventDefault()}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => pick(f.name)}
                  className={`flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-sm font-bai ${
                    i === active ? 'bg-primary/8' : ''
                  } ${f.name === value ? 'font-bold text-primary' : 'text-foreground'}`}
                >
                  <span className="truncate">{f.name}</span>
                  <span className="flex-shrink-0 text-[10px] text-gray-dark font-pop">
                    {f.count} product{f.count === 1 ? '' : 's'}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
