'use client'

import type { ReactNode } from 'react'
import { useAuth } from '@/context/AuthContext'
import { ZONES } from '@/lib/zones'

type View = 'grid' | 'list'

interface ToolbarProps {
  search: string
  onSearch: (v: string) => void
  category: string
  onCategory: (v: string) => void
  source: string
  onSource: (v: string) => void
  categories: string[]
  view: View
  onView: (v: View) => void
  onAdd: () => void
  onSync: (url: string) => void
  zoneFilter?: string
  onZoneFilter?: (v: string) => void
  showZoneFilter?: boolean
}

export default function Toolbar({
  search, onSearch, category, onCategory, source, onSource,
  categories, view, onView, onAdd, onSync,
  zoneFilter, onZoneFilter, showZoneFilter,
}: ToolbarProps) {
  const { can } = useAuth()

  const handleSync = () => {
    const url = prompt('Enter external API URL to sync:')
    if (url?.trim()) onSync(url.trim())
  }

  const inputCls = 'h-11 rounded-xl border border-gray-mid bg-white px-3 text-sm font-bai text-foreground outline-none transition-all placeholder:text-gray-dark focus:border-primary focus:ring-4 focus:ring-primary/10'
  const selectCls = `${inputCls} appearance-none cursor-pointer pr-9`

  return (
    <div className="border-b border-white/80 bg-white/70 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <svg className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-dark" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => onSearch(e.target.value)}
            placeholder="Search by code or category..."
            className={`${inputCls} w-full pl-10`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {showZoneFilter && onZoneFilter && (
            <SelectShell>
              <select
                value={zoneFilter ?? ''}
                onChange={e => onZoneFilter(e.target.value)}
                className={`${selectCls} min-w-[9rem]`}
              >
                <option value="">All Zones</option>
                {ZONES.map(z => (
                  <option key={z.id} value={z.id}>{z.label}</option>
                ))}
              </select>
            </SelectShell>
          )}

          <SelectShell>
            <select value={category} onChange={e => onCategory(e.target.value)} className={`${selectCls} min-w-[10rem]`}>
              <option value="">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </SelectShell>

          <SelectShell>
            <select value={source} onChange={e => onSource(e.target.value)} className={`${selectCls} min-w-[8.5rem]`}>
              <option value="">All Sources</option>
              <option value="internal">Internal</option>
              <option value="external">External</option>
            </select>
          </SelectShell>

          <div className="flex h-11 overflow-hidden rounded-xl border border-gray-mid bg-white">
            <button onClick={() => onView('grid')} title="Grid view"
              className={`tap-target flex items-center px-3 transition-colors ${view === 'grid' ? 'bg-primary text-white' : 'text-gray-dark hover:bg-gray hover:text-foreground'}`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
            </button>
            <button onClick={() => onView('list')} title="List view"
              className={`tap-target flex items-center border-l border-gray-mid px-3 transition-colors ${view === 'list' ? 'bg-primary text-white' : 'text-gray-dark hover:bg-gray hover:text-foreground'}`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            </button>
          </div>

          <button onClick={handleSync}
            className="tap-target flex items-center gap-1.5 rounded-xl border border-gray-mid bg-white px-4 py-2 text-sm font-semibold font-bai text-gray-text transition-all hover:border-primary hover:text-primary">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            <span className="hidden sm:inline">Sync</span>
          </button>

          {can('create') && (
            <button onClick={onAdd}
              className="tap-target flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-bold font-bai text-white shadow-sm transition-colors hover:bg-primary-dark">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              <span className="hidden sm:inline">Add Product</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function SelectShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative">
      {children}
      <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-dark" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    </div>
  )
}
