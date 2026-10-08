'use client'

import { useCallback, useEffect, useState } from 'react'
import { authFetch } from '@/lib/supabaseClient'

interface Category { id: number; name: string; collection: string | null; productCount: number }

const UNASSIGNED = '__none__'
const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** Admin page: product categories grouped by main category (ledlum_categories).
 * Renaming or moving a category updates every product in it automatically. */
export default function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([])
  const [mainNames, setMainNames]   = useState<string[]>([])   // from the live catalogue
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [search, setSearch]         = useState('')
  const [tab, setTab]               = useState<string>('')     // '' = all, UNASSIGNED, or a main category

  const [newName, setNewName]       = useState('')
  const [newMain, setNewMain]       = useState('')
  const [adding, setAdding]         = useState(false)

  const [editingId, setEditingId]   = useState<number | null>(null)
  const [editName, setEditName]     = useState('')
  const [savingId, setSavingId]     = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const [res, taxRes] = await Promise.all([
        fetch('/api/product-categories', { cache: 'no-store' }),
        fetch('/api/product-taxonomy', { cache: 'no-store' }),
      ])
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to load categories'); return }
      setCategories(data)
      const tax = await taxRes.json().catch(() => [])
      if (Array.isArray(tax)) {
        setMainNames(tax.map((t: { name: string }) => t.name).filter((n: string) => n && n !== 'Uncategorized'))
      }
    } catch {
      setError('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleAdd = async () => {
    const name = newName.trim()
    if (!name) return
    setAdding(true); setError('')
    try {
      const res  = await authFetch('/api/product-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, collection: newMain || null }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data.error ?? 'Could not add category'); return }
      setCategories(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      setNewName('')
    } finally {
      setAdding(false)
    }
  }

  const startEdit = (c: Category) => { setEditingId(c.id); setEditName(c.name); setError('') }
  const cancelEdit = () => { setEditingId(null); setEditName('') }

  const handleRename = async (c: Category) => {
    const name = editName.trim()
    if (!name || name === c.name) { cancelEdit(); return }
    if (c.productCount > 0 && !confirm(`Rename "${c.name}" to "${name}"? This updates ${c.productCount} product${c.productCount === 1 ? '' : 's'}.`)) return
    setSavingId(c.id); setError('')
    try {
      const res  = await authFetch(`/api/product-categories/${c.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data.error ?? 'Could not rename category'); return }
      setCategories(prev => prev.map(x => x.id === c.id ? data : x).sort((a, b) => a.name.localeCompare(b.name)))
      cancelEdit()
    } finally {
      setSavingId(null)
    }
  }

  // Move a category to another main category (its products follow).
  const handleMove = async (c: Category, value: string) => {
    const collection = value === UNASSIGNED ? null : value
    if (collection === c.collection) return
    const target = collection ? titleCase(collection) : 'no main category'
    if (c.productCount > 0 && !confirm(`Move "${c.name}" to ${target}? Its ${c.productCount} product${c.productCount === 1 ? '' : 's'} will move too.`)) return
    setSavingId(c.id); setError('')
    try {
      const res  = await authFetch(`/api/product-categories/${c.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collection }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data.error ?? 'Could not move category'); return }
      setCategories(prev => prev.map(x => x.id === c.id ? data : x))
    } finally {
      setSavingId(null)
    }
  }

  const handleDelete = async (c: Category) => {
    if (!confirm(`Delete category "${c.name}"?`)) return
    setSavingId(c.id); setError('')
    try {
      const res  = await authFetch(`/api/product-categories/${c.id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data.error ?? 'Could not delete category'); return }
      setCategories(prev => prev.filter(x => x.id !== c.id))
    } finally {
      setSavingId(null)
    }
  }

  // Main categories = those in the catalogue + any only set on a category.
  const mains = Array.from(new Set([
    ...mainNames,
    ...categories.map(c => c.collection).filter((v): v is string => !!v),
  ]))
  const unassignedCount = categories.filter(c => !c.collection).length

  const q = search.trim().toLowerCase()
  const visible = categories.filter(c =>
    (!q || c.name.toLowerCase().includes(q)) &&
    (tab === '' || (tab === UNASSIGNED ? !c.collection : c.collection === tab))
  )
  const totalProducts = categories.reduce((s, c) => s + c.productCount, 0)

  const selectCls =
    'appearance-none cursor-pointer border border-gray-mid rounded-lg pl-3 pr-7 py-2 text-xs font-semibold font-bai text-foreground bg-white outline-none focus:border-primary'
  const chevron = <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-dark" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>

  const inputCls =
    'w-full border border-gray-mid rounded-lg px-3 py-2 text-sm font-bai text-foreground placeholder:text-gray-dark outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all bg-white'

  return (
    <div className="bg-white rounded-2xl w-full shadow-card border border-white/80 flex flex-col overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-primary to-primary-dark flex-shrink-0" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-5 border-b border-gray sm:px-7">
        <div>
          <h2 className="text-xl font-bold font-bai text-foreground">Product Categories</h2>
          <p className="text-xs text-gray-text font-pop mt-0.5">
            {categories.length} categor{categories.length === 1 ? 'y' : 'ies'} · {totalProducts} products ·
            renaming a category updates all its products
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          title="Refresh"
          className="flex items-center gap-1.5 px-3 py-2 border border-gray-mid rounded-lg text-sm font-semibold font-bai text-gray-text hover:border-primary hover:text-primary disabled:opacity-60 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className={loading ? 'animate-spin' : ''}>
            <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      <div className="px-6 py-5 space-y-4 sm:px-7">
        {/* Main category tabs */}
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: '', label: 'All', count: categories.length },
            ...mains.map(m => ({ id: m, label: titleCase(m), count: categories.filter(c => c.collection === m).length })),
            ...(unassignedCount ? [{ id: UNASSIGNED, label: 'Unassigned', count: unassignedCount }] : []),
          ].map(t => (
            <button
              key={t.id || 'all'}
              onClick={() => { setTab(t.id); if (t.id && t.id !== UNASSIGNED) setNewMain(t.id) }}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold font-bai transition-colors ${
                tab === t.id
                  ? 'border-primary bg-primary text-white'
                  : 'border-gray-mid bg-white text-gray-text hover:border-primary hover:text-primary'
              }`}
            >
              {t.label} <span className={tab === t.id ? 'text-white/70' : 'text-gray-dark'}>{t.count}</span>
            </button>
          ))}
        </div>

        {/* Add */}
        <div className="flex flex-wrap gap-2 sm:flex-nowrap">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
            placeholder="New category name, e.g. Pole Light Fixtures"
            className={inputCls}
          />
          <div className="relative flex-shrink-0">
            <select value={newMain} onChange={e => setNewMain(e.target.value)} className={`${selectCls} h-full py-2.5`} title="Main category">
              <option value="">No main category</option>
              {mains.map(m => <option key={m} value={m}>{titleCase(m)}</option>)}
            </select>
            {chevron}
          </div>
          <button
            onClick={handleAdd}
            disabled={!newName.trim() || adding}
            className="flex-shrink-0 flex items-center gap-1.5 px-4 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white rounded-lg text-sm font-bold font-bai transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            {adding ? 'Adding…' : 'Add'}
          </button>
        </div>

        {/* Search */}
        {categories.length > 8 && (
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search categories…"
            className={inputCls}
          />
        )}

        {error && (
          <p className="text-sm text-primary font-pop bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">{error}</p>
        )}

        {/* List */}
        {loading && categories.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : visible.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-dark font-bai">
            {q ? 'No categories match your search' : tab ? 'No categories here yet — add one above' : 'No categories yet — add one above'}
          </p>
        ) : (
          <ul className="divide-y divide-gray rounded-xl border border-gray-mid">
            {visible.map(c => (
              <li key={c.id} className="flex items-center gap-3 px-4 py-3 group">
                {editingId === c.id ? (
                  <>
                    <input
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleRename(c); if (e.key === 'Escape') cancelEdit() }}
                      autoFocus
                      className={inputCls}
                    />
                    <button
                      onClick={() => handleRename(c)}
                      disabled={savingId === c.id || !editName.trim()}
                      className="flex-shrink-0 px-3 py-2 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white rounded-lg text-xs font-bold font-bai"
                    >
                      {savingId === c.id ? 'Saving…' : 'Save'}
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="flex-shrink-0 px-3 py-2 border border-gray-mid rounded-lg text-xs font-semibold font-bai text-gray-text hover:border-foreground"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold font-bai text-foreground">{c.name}</p>
                      <p className="text-[11px] text-gray-dark font-pop">
                        {c.productCount} product{c.productCount === 1 ? '' : 's'}
                      </p>
                    </div>
                    <div className="relative flex-shrink-0">
                      <select
                        value={c.collection ?? UNASSIGNED}
                        onChange={e => handleMove(c, e.target.value)}
                        disabled={savingId === c.id}
                        title="Main category"
                        className={`${selectCls} ${c.collection ? '' : 'border-amber-300 text-amber-700'}`}
                      >
                        <option value={UNASSIGNED}>— None —</option>
                        {mains.map(m => <option key={m} value={m}>{titleCase(m)}</option>)}
                      </select>
                      {chevron}
                    </div>
                    <button
                      onClick={() => startEdit(c)}
                      title="Rename"
                      className="w-8 h-8 flex-shrink-0 rounded-full border border-gray-mid flex items-center justify-center text-gray-text hover:bg-primary hover:text-white hover:border-primary transition-colors"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(c)}
                      disabled={savingId === c.id || c.productCount > 0}
                      title={c.productCount > 0 ? 'Move its products to another category before deleting' : 'Delete'}
                      className="w-8 h-8 flex-shrink-0 rounded-full border border-primary/20 flex items-center justify-center text-primary hover:bg-primary hover:text-white hover:border-primary disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-primary transition-colors"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                      </svg>
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
