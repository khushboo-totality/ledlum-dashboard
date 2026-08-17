'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '@/context/AuthContext'
import { useZones } from '@/context/ZonesContext'
import type { CollectionNode } from '@/lib/services/products'
import VendorManager from './VendorManager'

type View = 'grid' | 'list'

/** Product mode's own Collection ("Category") / Group ("Subcategory")
 * taxonomy, mirrored into the filter drawer alongside the always-visible
 * pill row on the main page — two ways to set the same filters. */
interface ProductTaxonomyFilter {
  collections: CollectionNode[]
  activeCollection: string
  onCollection: (c: string) => void
  activeGroup: string | null
  onGroup: (g: string | null) => void
}

interface ToolbarProps {
  stickyTop: number
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
  zoneFilter?: string
  onZoneFilter?: (v: string) => void
  showZoneFilter?: boolean
  /** Category filter only applies in zone mode — product mode uses
   * `productTaxonomy` instead (its options come from a different,
   * zone-scoped list and don't apply there). Defaults to true. */
  showCategoryFilter?: boolean
  /** Product mode only: Collection/Group selects for the drawer, mirroring
   * ProductTypePanel's Category/Subcategory pill rows. */
  productTaxonomy?: ProductTaxonomyFilter
}

export default function Toolbar({
  stickyTop,
  search, onSearch, category, onCategory, source, onSource,
  categories, view, onView, onAdd,
  zoneFilter, onZoneFilter, showZoneFilter,
  showCategoryFilter = true,
  productTaxonomy,
}: ToolbarProps) {
  const { can, user } = useAuth()
  const { zones } = useZones()

  const [vendorOpen, setVendorOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const activeFilterCount = productTaxonomy
    ? [productTaxonomy.activeGroup, source].filter(Boolean).length
    : [zoneFilter, showCategoryFilter ? category : '', source].filter(Boolean).length

  const activeTaxonomyCollection = productTaxonomy?.collections.find(c => c.name === productTaxonomy.activeCollection) ?? null
  const taxonomyGroupOptions = activeTaxonomyCollection?.groupNames ?? []

  // Lock scroll + Escape-to-close while the filter drawer is open, matching
  // the ProductDetail slide-in panel's behaviour.
  useEffect(() => {
    if (!filtersOpen) return
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setFiltersOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey) }
  }, [filtersOpen])

  const inputCls = 'h-11 rounded-xl border border-gray-mid bg-white px-3 text-sm font-bai text-foreground outline-none transition-all placeholder:text-gray-dark focus:border-primary focus:ring-4 focus:ring-primary/10'
  const selectCls = `${inputCls} w-full appearance-none cursor-pointer pr-9`

  const clearFilters = () => {
    onSource('')
    if (productTaxonomy) {
      productTaxonomy.onGroup(null) // collection isn't clearable — it's a required single-select, same as the pill row
    } else {
      onCategory('')
      onZoneFilter?.('')
    }
  }

  return (
    <>
    <div className="sticky z-20 border-b border-white/80 bg-white/70 px-4 py-4 backdrop-blur sm:px-6 lg:px-8" style={{ top: stickyTop }}>
      <div className="flex items-center gap-2">
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

        {/* Filter icon — opens the right-side drawer holding Category/Source/Zone.
            aria-label since the "Filters" text is hidden below sm, and an
            icon-only button otherwise has no accessible name. */}
        <button
          onClick={() => setFiltersOpen(true)}
          title="Filters"
          aria-label="Filters"
          className={`tap-target relative flex h-11 flex-shrink-0 items-center gap-1.5 rounded-xl border px-3.5 text-sm font-semibold font-bai transition-colors ${
            activeFilterCount > 0
              ? 'border-primary bg-primary/8 text-primary'
              : 'border-gray-mid bg-white text-gray-text hover:border-primary hover:text-primary'
          }`}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
          </svg>
          <span className="hidden sm:inline">Filters</span>
          {activeFilterCount > 0 && (
            <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>

        {can('create') && (
          <button onClick={onAdd}
            className="tap-target flex h-11 flex-shrink-0 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-bold font-bai text-white shadow-sm transition-colors hover:bg-primary-dark">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span className="hidden sm:inline">Add Product</span>
          </button>
        )}

        {user?.role === 'admin' && (
          <button
            onClick={() => setVendorOpen(true)}
            className="tap-target flex h-11 flex-shrink-0 items-center gap-1.5 rounded-xl border border-gray-mid bg-white/80 px-3.5 text-sm font-semibold text-gray-text transition-colors hover:border-primary hover:text-primary"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <span className="hidden sm:inline">Vendors</span>
          </button>
        )}

        {user?.role === 'admin' && (
          <VendorManager isOpen={vendorOpen} onClose={() => setVendorOpen(false)} />
        )}
      </div>
    </div>

    {/* ── Filter drawer — e-commerce-style slide-in from the right.
        Portaled to <body>: Toolbar's own wrapper has `backdrop-blur`
        (backdrop-filter), which — like `filter`/`transform` — establishes a
        new containing block for `position: fixed` descendants. Left inline,
        the drawer would render "fixed" relative to that ~70px sticky bar
        instead of the viewport, squashing it into a tiny box. Portaling
        (same fix VendorManager uses below) escapes that entirely. ── */}
    {filtersOpen && createPortal(
      <>
        <div
          className="fixed inset-0 z-[70] bg-black/40"
          onClick={() => setFiltersOpen(false)}
        />
        <div className="fixed inset-y-0 right-0 z-[71] flex w-full max-w-sm flex-col bg-white shadow-2xl animate-slide-in">
          <div className="flex items-center justify-between border-b border-gray px-5 py-4 flex-shrink-0">
            <h3 className="text-base font-bold font-bai text-foreground">Filters</h3>
            <button onClick={() => setFiltersOpen(false)}
              className="w-9 h-9 border border-gray rounded-full flex items-center justify-center text-gray-dark hover:bg-primary hover:text-white hover:border-primary transition-all text-sm">
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold text-gray-dark uppercase tracking-widest font-pop">View</label>
              <div className="flex h-11 w-full overflow-hidden rounded-xl border border-gray-mid bg-white">
                <button onClick={() => onView('grid')}
                  className={`flex flex-1 items-center justify-center gap-2 text-sm font-semibold font-bai transition-colors ${view === 'grid' ? 'bg-primary text-white' : 'text-gray-dark hover:bg-gray hover:text-foreground'}`}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                  Grid
                </button>
                <button onClick={() => onView('list')}
                  className={`flex flex-1 items-center justify-center gap-2 border-l border-gray-mid text-sm font-semibold font-bai transition-colors ${view === 'list' ? 'bg-primary text-white' : 'text-gray-dark hover:bg-gray hover:text-foreground'}`}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                  List
                </button>
              </div>
            </div>

            {/* Zone mode (admin, all-zones view): "Category" = Zone, e.g. Zone A. */}
            {showZoneFilter && onZoneFilter && (
              <FilterField label="Category">
                <select value={zoneFilter ?? ''} onChange={e => onZoneFilter(e.target.value)} className={selectCls}>
                  <option value="">All Zones</option>
                  {zones.map(z => (
                    <option key={z.id} value={z.id}>{z.label}</option>
                  ))}
                </select>
              </FilterField>
            )}

            {/* Product mode: Collection/Group selects mirroring ProductTypePanel's
                pill row above — same filters, second way to reach them. */}
            {productTaxonomy && (
              <>
                <FilterField label="Category">
                  <select
                    value={productTaxonomy.activeCollection}
                    onChange={e => productTaxonomy.onCollection(e.target.value)}
                    className={selectCls}
                  >
                    {productTaxonomy.collections.map(c => (
                      <option key={c.name} value={c.name}>{c.label} ({c.count})</option>
                    ))}
                  </select>
                </FilterField>

                {taxonomyGroupOptions.length > 0 && (
                  <FilterField label="Subcategory">
                    <select
                      value={productTaxonomy.activeGroup ?? ''}
                      onChange={e => productTaxonomy.onGroup(e.target.value || null)}
                      className={selectCls}
                    >
                      <option value="">All</option>
                      {taxonomyGroupOptions.map(g => (
                        <option key={g.name} value={g.name}>{g.name} ({g.count})</option>
                      ))}
                    </select>
                  </FilterField>
                )}
              </>
            )}

            {/* Zone mode: "Subcategory" = the product's category, e.g. E-27 Bollards. */}
            {!productTaxonomy && showCategoryFilter && (
              <FilterField label="Subcategory">
                <select value={category} onChange={e => onCategory(e.target.value)} className={selectCls}>
                  <option value="">All Categories</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </FilterField>
            )}

            <FilterField label="Source">
              <select value={source} onChange={e => onSource(e.target.value)} className={selectCls}>
                <option value="">All Sources</option>
                <option value="internal">Internal</option>
                <option value="external">External</option>
              </select>
            </FilterField>
          </div>

          <div className="flex gap-3 border-t border-gray px-5 py-4 flex-shrink-0">
            <button onClick={clearFilters}
              disabled={activeFilterCount === 0}
              className="px-4 py-2.5 border border-gray-mid rounded-lg text-sm font-semibold font-bai text-gray-text hover:border-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              Clear all
            </button>
            <button onClick={() => setFiltersOpen(false)}
              className="flex-1 py-2.5 bg-primary hover:bg-secondary text-white rounded-lg text-sm font-bold font-bai transition-colors">
              Show results
            </button>
          </div>
        </div>
      </>,
      document.body
    )}
    </>
  )
}

function FilterField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-semibold text-gray-dark uppercase tracking-widest font-pop">{label}</label>
      <div className="relative">
        {children}
        <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-dark" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>
    </div>
  )
}
