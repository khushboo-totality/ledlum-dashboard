'use client'

import { useCallback, useEffect, useState } from 'react'
import { authFetch } from '@/lib/supabaseClient'
import { useZones } from '@/context/ZonesContext'
import { getZonePath } from '@/lib/zones'

interface ZoneRow { id: string; slug: string; label: string; sortOrder: number; productCount: number }

const toSlug = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)

/** Admin page: add, rename, reorder and delete zones (ledlum_zone). */
export default function ZoneManager() {
  const { refreshZones } = useZones()
  const [zones, setZones]     = useState<ZoneRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  const [newLabel, setNewLabel] = useState('')
  const [adding, setAdding]     = useState(false)

  const [editingSlug, setEditingSlug] = useState<string | null>(null)
  const [editLabel, setEditLabel]     = useState('')
  const [busySlug, setBusySlug]       = useState<string | null>(null)
  const [orderDirty, setOrderDirty]   = useState(false)
  const [savingOrder, setSavingOrder] = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res  = await fetch('/api/zones?counts=1', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to load zones'); return }
      setZones(data); setOrderDirty(false)
    } catch {
      setError('Failed to load zones')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const afterChange = async () => { await Promise.all([load(), refreshZones()]) }

  const handleAdd = async () => {
    const label = newLabel.trim()
    if (!label) return
    setAdding(true); setError('')
    try {
      const res  = await authFetch('/api/zones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data.error ?? 'Could not add zone'); return }
      setNewLabel('')
      await afterChange()
    } finally {
      setAdding(false)
    }
  }

  const handleRename = async (z: ZoneRow) => {
    const label = editLabel.trim()
    if (!label || label === z.label) { setEditingSlug(null); return }
    setBusySlug(z.slug); setError('')
    try {
      const res  = await authFetch(`/api/zones/${encodeURIComponent(z.slug)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data.error ?? 'Could not rename zone'); return }
      setEditingSlug(null)
      await afterChange()
    } finally {
      setBusySlug(null)
    }
  }

  const handleDelete = async (z: ZoneRow) => {
    if (!confirm(`Delete zone "${z.label}"?`)) return
    setBusySlug(z.slug); setError('')
    try {
      const res  = await authFetch(`/api/zones/${encodeURIComponent(z.slug)}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data.error ?? 'Could not delete zone'); return }
      await afterChange()
    } finally {
      setBusySlug(null)
    }
  }

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= zones.length) return
    setZones(prev => { const next = [...prev]; [next[i], next[j]] = [next[j], next[i]]; return next })
    setOrderDirty(true)
  }

  const saveOrder = async () => {
    setSavingOrder(true); setError('')
    try {
      const res  = await authFetch('/api/zones', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: zones.map(z => z.slug) }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data.error ?? 'Could not save order'); return }
      await afterChange()
    } finally {
      setSavingOrder(false)
    }
  }

  const totalLinks = zones.reduce((s, z) => s + z.productCount, 0)
  const previewSlug = toSlug(newLabel)
  const inputCls =
    'w-full border border-gray-mid rounded-lg px-3 py-2 text-sm font-bai text-foreground placeholder:text-gray-dark outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all bg-white'

  return (
    <div className="bg-white rounded-2xl w-full shadow-card border border-white/80 flex flex-col overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-primary to-primary-dark flex-shrink-0" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-5 border-b border-gray sm:px-7">
        <div>
          <h2 className="text-xl font-bold font-bai text-foreground">Zones</h2>
          <p className="text-xs text-gray-text font-pop mt-0.5">
            {zones.length} zone{zones.length === 1 ? '' : 's'} · {totalLinks} product links
          </p>
        </div>
        <div className="flex items-center gap-2">
          {orderDirty && (
            <>
              <button onClick={load} disabled={savingOrder}
                className="px-3 py-2 border border-gray-mid rounded-lg text-sm font-semibold font-bai text-gray-text hover:border-foreground">
                Undo
              </button>
              <button onClick={saveOrder} disabled={savingOrder}
                className="px-4 py-2 bg-primary hover:bg-primary-dark disabled:opacity-60 text-white rounded-lg text-sm font-bold font-bai">
                {savingOrder ? 'Saving…' : 'Save order'}
              </button>
            </>
          )}
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
      </div>

      <div className="px-6 py-5 space-y-4 sm:px-7">
        {/* Add */}
        <div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
              placeholder="New zone name, e.g. Zone H or Lobby"
              className={inputCls}
            />
            <button
              onClick={handleAdd}
              disabled={!newLabel.trim() || adding}
              className="flex-shrink-0 flex items-center gap-1.5 px-4 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white rounded-lg text-sm font-bold font-bai transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              {adding ? 'Adding…' : 'Add zone'}
            </button>
          </div>
          {previewSlug && (
            <p className="mt-1.5 text-[11px] text-gray-dark font-pop">
              Page address: <span className="font-mono text-foreground">/zone/{getZonePath(previewSlug)}</span> (can&apos;t be changed later)
            </p>
          )}
        </div>

        {error && (
          <p className="text-sm text-primary font-pop bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">{error}</p>
        )}

        {/* List */}
        {loading && zones.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : zones.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-dark font-bai">No zones yet — add one above</p>
        ) : (
          <ul className="divide-y divide-gray rounded-xl border border-gray-mid">
            {zones.map((z, i) => (
              <li key={z.slug} className="flex items-center gap-3 px-4 py-3">
                {/* Order */}
                <div className="flex flex-col">
                  <button onClick={() => move(i, -1)} disabled={i === 0 || editingSlug !== null} title="Move up"
                    className="h-4 w-6 text-[10px] leading-none text-gray-dark hover:text-primary disabled:opacity-25">▲</button>
                  <button onClick={() => move(i, 1)} disabled={i === zones.length - 1 || editingSlug !== null} title="Move down"
                    className="h-4 w-6 text-[10px] leading-none text-gray-dark hover:text-primary disabled:opacity-25">▼</button>
                </div>

                {editingSlug === z.slug ? (
                  <>
                    <input
                      type="text"
                      value={editLabel}
                      onChange={e => setEditLabel(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleRename(z); if (e.key === 'Escape') setEditingSlug(null) }}
                      autoFocus
                      className={inputCls}
                    />
                    <button
                      onClick={() => handleRename(z)}
                      disabled={busySlug === z.slug || !editLabel.trim()}
                      className="flex-shrink-0 px-3 py-2 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white rounded-lg text-xs font-bold font-bai"
                    >
                      {busySlug === z.slug ? 'Saving…' : 'Save'}
                    </button>
                    <button
                      onClick={() => setEditingSlug(null)}
                      className="flex-shrink-0 px-3 py-2 border border-gray-mid rounded-lg text-xs font-semibold font-bai text-gray-text hover:border-foreground"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold font-bai text-foreground">{z.label}</p>
                      <p className="text-[11px] text-gray-dark font-pop">
                        {z.productCount} product{z.productCount === 1 ? '' : 's'} ·{' '}
                        <a href={`/zone/${getZonePath(z.slug)}`} target="_blank" rel="noreferrer"
                          className="font-mono hover:text-primary hover:underline">/zone/{getZonePath(z.slug)}</a>
                      </p>
                    </div>
                    <button
                      onClick={() => { setEditingSlug(z.slug); setEditLabel(z.label); setError('') }}
                      title="Rename"
                      className="w-8 h-8 flex-shrink-0 rounded-full border border-gray-mid flex items-center justify-center text-gray-text hover:bg-primary hover:text-white hover:border-primary transition-colors"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(z)}
                      disabled={busySlug === z.slug || z.productCount > 0}
                      title={z.productCount > 0 ? 'Remove its products from this zone before deleting' : 'Delete'}
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
