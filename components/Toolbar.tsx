'use client'

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
  // Zone filter for admin (all-zones view)
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

  const inputCls = "bg-white border border-gray-mid rounded-lg px-3 py-2 text-sm font-bai text-foreground placeholder:text-gray-dark outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
  const selectCls = `${inputCls} appearance-none pr-8 cursor-pointer`

  return (
    <div className="bg-white border-b border-gray px-8 py-3 flex items-center gap-3 flex-wrap">

      {/* Search */}
      <div className="relative flex-1 min-w-[180px]">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-dark pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text" value={search} onChange={e => onSearch(e.target.value)}
          placeholder="Search by code or category…"
          className={`${inputCls} pl-9 w-full`}
        />
      </div>

      {/* Zone filter — only when viewing "All Zones" (admin) */}
      {showZoneFilter && onZoneFilter && (
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-dark pointer-events-none" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <select
            value={zoneFilter ?? ''}
            onChange={e => onZoneFilter(e.target.value)}
            className={`${selectCls} pl-8`}
          >
            <option value="">All Zones</option>
            {ZONES.map(z => (
              <option key={z.id} value={z.id}>{z.label}</option>
            ))}
          </select>
          <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-dark" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      )}

      {/* Category */}
      <div className="relative">
        <select value={category} onChange={e => onCategory(e.target.value)} className={selectCls}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-dark" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>

      {/* Source */}
      <div className="relative">
        <select value={source} onChange={e => onSource(e.target.value)} className={selectCls}>
          <option value="">All Sources</option>
          <option value="internal">Internal</option>
          <option value="external">External</option>
        </select>
        <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-dark" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>

      {/* View toggle */}
      <div className="flex border border-gray-mid rounded-lg overflow-hidden">
        <button onClick={() => onView('grid')} title="Grid view"
          className={`px-3 py-2 flex items-center transition-colors ${view === 'grid' ? 'bg-primary text-white' : 'bg-white text-gray-dark hover:text-foreground'}`}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
        </button>
        <button onClick={() => onView('list')} title="List view"
          className={`px-3 py-2 flex items-center border-l border-gray-mid transition-colors ${view === 'list' ? 'bg-primary text-white' : 'bg-white text-gray-dark hover:text-foreground'}`}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
        </button>
      </div>

      {/* Sync */}
      <button onClick={handleSync}
        className="flex items-center gap-1.5 px-4 py-2 border border-gray-mid rounded-lg text-sm font-semibold font-bai text-gray-text hover:border-primary hover:text-primary transition-all">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
        Sync
      </button>

      {/* Add Product */}
      {can('create') && (
        <button onClick={onAdd}
          className="flex items-center gap-1.5 px-5 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-bold font-bai transition-colors">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Product
        </button>
      )}
    </div>
  )
}
