'use client'

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import type { Product, ProductFormData, BrowseMode } from '@/types'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { useCart } from '@/context/CartContext'
import { useProducts } from '@/lib/useProducts'
import { getZoneById } from '@/lib/zones'
import { getProductDetail } from '@/lib/productDetails'
import {
  TAXONOMY,
  type TaxonomyCategory,
  type Subcategory,
} from '@/lib/productTaxonomy'
import {
  getProductsByType,
  getProductsByCategory,
  getProductsBySubcategory,
} from '@/lib/productTaxonomyData'
import Header from '@/components/Header'
import ZoneNav from '@/components/ZoneNav'
import Toolbar from '@/components/Toolbar'
import ProductCard from '@/components/ProductCard'
import ProductRow from '@/components/ProductRow'
import ProductDetail from '@/components/ProductDetail'
import CrudModal from '@/components/CrudModal'
import CartDrawer from '@/components/CartDrawer'
import ToastContainer from '@/components/ToastContainer'
import { usePathname } from 'next/navigation'

type ViewLayout = 'grid' | 'list'

// ── Mode Switcher Dropdown ─────────────────────────────────────────────


function ModeSwitcher({
  mode, onChange,
}: {
  mode: BrowseMode
  onChange: (m: BrowseMode) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const options = [
    {
      value: 'zone' as BrowseMode,
      label: 'Browse by Zone',
      desc: 'Products grouped by project zone',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      ),
    },
    {
      value: 'product' as BrowseMode,
      label: 'Browse by Product Type',
      desc: 'Filter by category & product type',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="3" width="7" height="7" rx="1"/>
          <rect x="15" y="3" width="7" height="7" rx="1"/>
          <rect x="2" y="14" width="7" height="7" rx="1"/>
          <rect x="15" y="14" width="7" height="7" rx="1"/>
        </svg>
      ),
    },
  ]
  const current = options.find(o => o.value === mode)!

  return (
    <div ref={ref} className="relative w-full sm:w-auto">
      <button
        onClick={() => setOpen(v => !v)}
        className={`flex h-11 w-full items-center justify-between gap-2.5 rounded-xl border bg-white/80 px-4 text-sm font-bold font-bai shadow-sm transition-all sm:w-auto ${
          open ? 'border-primary bg-primary/5 text-primary' : 'border-gray hover:border-primary text-foreground'
        }`}
      >
        <span className="flex items-center gap-2.5">
          <span className="text-primary">{current.icon}</span>
          <span>{current.label}</span>
        </span>
        <svg
          width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          className={`text-gray-dark ml-0.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-2 w-full overflow-hidden rounded-2xl border border-gray bg-white shadow-xl sm:w-72">
          <div className="p-1.5">
            {options.map(opt => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false) }}
                className={`w-full flex items-start gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                  mode === opt.value
                    ? 'bg-primary/8 text-primary'
                    : 'hover:bg-gray text-gray-text'
                }`}
              >
                <span className={`mt-0.5 flex-shrink-0 ${mode === opt.value ? 'text-primary' : 'text-gray-dark'}`}>
                  {opt.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold font-bai ${mode === opt.value ? 'text-primary' : 'text-foreground'}`}>
                    {opt.label}
                  </p>
                  <p className="text-[11px] text-gray-dark font-pop mt-0.5">{opt.desc}</p>
                </div>
                {mode === opt.value && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-primary flex-shrink-0 mt-0.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Product Type Filter Panel ──────────────────────────────────────────
// Behaviour: category only → show ALL products in that category
//            category + subcategory → show ALL products in that subcategory
//            category + subcategory + type → show products of that specific type
function ProductTypePanel({
  activeCategory,
  activeSubcategory,
  activeTypeId,
  onCategory,
  onSubcategory,
  onType,
  productCount,
  search,
  onSearch,
  viewLayout,
  onViewLayout,
}: {
  activeCategory: TaxonomyCategory
  activeSubcategory: Subcategory | null
  activeTypeId: string | null
  onCategory: (c: TaxonomyCategory) => void
  onSubcategory: (s: Subcategory | null) => void
  onType: (t: string | null) => void
  productCount: number
  search: string
  onSearch: (s: string) => void
  viewLayout: ViewLayout
  onViewLayout: (v: ViewLayout) => void
}) {
  return (
    <div className="border-b border-white/80 bg-white/75 backdrop-blur">
      {/* ── Level 1: Category row ── */}
      <div className="flex items-center gap-2 overflow-x-auto px-4 pb-2 pt-4 scrollbar-hide sm:px-6 lg:px-8">
        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-dark font-pop flex-shrink-0 mr-1">
          Category
        </span>
        {TAXONOMY.map(cat => (
          <button
            key={cat.id}
            onClick={() => {
              onCategory(cat)
              onSubcategory(null)
              onType(null)
            }}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold font-bai whitespace-nowrap transition-all ${
              activeCategory.id === cat.id
                ? 'bg-primary text-white shadow-sm ring-2 ring-primary/20'
                : 'bg-gray border border-gray-mid text-gray-text hover:border-primary hover:text-primary'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* ── Level 2: Subcategory row ── */}
      {activeCategory.subcategories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto px-4 pb-2 scrollbar-hide sm:px-6 lg:px-8">
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-dark font-pop flex-shrink-0 mr-1">
            Subcategory
          </span>
          {/* "All" chip to reset subcategory */}
          <button
            onClick={() => { onSubcategory(null); onType(null) }}
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold font-bai transition-all ${
              !activeSubcategory
                ? 'bg-foreground text-white shadow-sm'
                : 'bg-gray border border-gray-mid text-gray-text hover:border-foreground hover:text-foreground'
            }`}
          >
            All
          </button>
          {activeCategory.subcategories.map(sub => (
            <button
              key={sub.id}
              onClick={() => {
                onSubcategory(sub)
                onType(null)
              }}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold font-bai whitespace-nowrap transition-all ${
                activeSubcategory?.id === sub.id
                  ? 'bg-foreground text-white shadow-sm'
                  : 'bg-gray border border-gray-mid text-gray-text hover:border-foreground hover:text-foreground'
              }`}
            >
              {sub.label}
              <span className="ml-1.5 opacity-50 font-pop">{sub.types.length}</span>
            </button>
          ))}
        </div>
      )}

      {/* ── Level 3: Product type row (only when subcategory selected) ── */}
      {activeSubcategory && (
        <div className="flex items-center gap-2 overflow-x-auto px-4 pb-3 scrollbar-hide sm:px-6 lg:px-8">
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-dark font-pop flex-shrink-0 mr-1">
            Product Type
          </span>
          {/* "All types" chip */}
          <button
            onClick={() => onType(null)}
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold font-bai transition-all ${
              !activeTypeId
                ? 'bg-primary/15 text-primary border border-primary/30 ring-1 ring-primary/20'
                : 'bg-gray border border-gray-mid text-gray-text hover:border-primary hover:text-primary'
            }`}
          >
            All types
          </button>
          {activeSubcategory.types.map(type => {
            const count = getProductsByType(type.id).length
            return (
              <button
                key={type.id}
                onClick={() => onType(activeTypeId === type.id ? null : type.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold font-bai whitespace-nowrap transition-all ${
                  activeTypeId === type.id
                    ? 'bg-primary text-white shadow-sm ring-2 ring-primary/20'
                    : 'bg-gray border border-gray-mid text-gray-text hover:border-primary hover:text-primary'
                }`}
              >
                {type.label}
                <span className={`text-[9px] font-pop px-1 py-0.5 rounded ${
                  activeTypeId === type.id ? 'bg-white/25' : 'bg-white text-gray-dark'
                }`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* ── Search + view controls ── */}
      <div className="flex flex-col gap-3 border-t border-white/80 px-4 pb-4 pt-3 sm:px-6 md:flex-row md:items-center lg:px-8">
        {/* <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <div className="w-1 h-4 bg-primary rounded-full flex-shrink-0" />
          <span className="text-xs font-semibold font-bai text-foreground truncate">
            {activeCategory.label}
            {activeSubcategory && <span className="text-gray-dark font-normal"> › {activeSubcategory.label}</span>}
            {activeTypeId && activeSubcategory && (
              <span className="text-gray-dark font-normal">
                {' › '}{activeSubcategory.types.find(t => t.id === activeTypeId)?.label}
              </span>
            )}
          </span>
          <span className="text-[10px] font-pop text-gray-dark bg-gray border border-gray-mid px-2 py-0.5 rounded-full flex-shrink-0 ml-1">
            {productCount} product{productCount !== 1 ? 's' : ''}
          </span>
        </div> */}

        {/* Search */}
        {/* <div className="relative w-full flex-shrink-0 md:w-56">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-dark pointer-events-none">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => onSearch(e.target.value)}
            placeholder="Search products…"
            className="h-10 w-full rounded-xl border border-gray-mid bg-white pl-9 pr-3 text-xs font-bai text-foreground outline-none transition-all placeholder:text-gray-dark focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
        </div> */}

        {/* View toggle */}
        {/* <div className="flex h-10 flex-shrink-0 items-center overflow-hidden rounded-xl border border-gray-mid bg-white">
          {(['grid', 'list'] as ViewLayout[]).map(v => (
            <button
              key={v}
              onClick={() => onViewLayout(v)}
              title={v === 'grid' ? 'Grid view' : 'List view'}
              className={`px-2.5 py-1.5 transition-colors ${viewLayout === v ? 'bg-primary text-white' : 'text-gray-dark hover:bg-gray'}`}
            >
              {v === 'grid'
                ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              }
            </button>
          ))}
        </div> */}
      </div>
    </div>
  )
}

// ── Main CatalogPage ───────────────────────────────────────────────────
interface CatalogPageProps {
  initialMode?: BrowseMode
  onModeChange?: (m: BrowseMode) => void
  zoneId?: string
  initialProductId?: string
}

export default function CatalogPage({ initialMode = 'zone', onModeChange, zoneId: zoneIdProp, initialProductId }: CatalogPageProps) {
  const { can, user }  = useAuth()
  const { toast }      = useToast()
  const { addItem }    = useCart()
  const activeZone     = zoneIdProp ?? ''
  const zone           = getZoneById(activeZone)

  const [browseMode, setBrowseMode] = useState<BrowseMode>(initialMode)
  const [viewLayout, setViewLayout] = useState<ViewLayout>('grid')
  const pathname = usePathname()

  // ── Zone mode state ─────────────────────────────────────────────
  const { products, categories, createProduct, updateProduct, deleteProduct, syncExternal } =
    useProducts(activeZone || undefined)
  const [search, setSearch]         = useState('')
  const [category, setCategory]     = useState('')
  const [source, setSource]         = useState('')
  const [zoneFilter, setZoneFilter] = useState('')  // admin zone filter for all-zones view

  // ── Product type mode state ─────────────────────────────────────
  const [activeCat, setActiveCat]   = useState<TaxonomyCategory>(TAXONOMY[0])
  const [activeSub, setActiveSub]   = useState<Subcategory | null>(null)
  const [activeTypeId, setActiveTypeId] = useState<string | null>(null)
  const [ptSearch, setPtSearch]     = useState('')

  // ── Shared ──────────────────────────────────────────────────────
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [modalMode, setModalMode]             = useState<'create' | 'edit' | null>(null)
  const [editingProduct, setEditingProduct]   = useState<Product | null>(null)

  useEffect(() => {
    if (!initialProductId || products.length === 0) return
    const p = products.find(p => p.id === initialProductId || p.Codes === initialProductId)
    if (p) setSelectedProduct(p)
  }, [initialProductId, products])

  // ── Smart product filter for product mode ────────────────────────
  // Category selected only → ALL products in that category
  // Category + Subcategory → ALL products in that subcategory
  // Category + Subcategory + Type → products of that specific type
  const ptProducts = useMemo(() => {
    let list: Product[]
    if (activeTypeId) {
      list = getProductsByType(activeTypeId)
    } else if (activeSub) {
      list = getProductsBySubcategory(activeSub.id)
    } else {
      list = getProductsByCategory(activeCat.id)
    }
    if (ptSearch) {
      const q = ptSearch.toLowerCase()
      list = list.filter(p =>
        p.Codes.toLowerCase().includes(q) ||
        p.Category.toLowerCase().includes(q) ||
        (p.Description ?? '').toLowerCase().includes(q)
      )
    }
    return list
  }, [activeCat, activeSub, activeTypeId, ptSearch])

  // Zone mode filter
  const zoneProducts = useMemo(() => {
    let list = [...products]
    // Admin viewing all zones can filter by zone
    if (zoneFilter) list = list.filter(p => p.zone === zoneFilter)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(p =>
        p.Codes.toLowerCase().includes(q) || p.Category.toLowerCase().includes(q)
      )
    }
    if (category) list = list.filter(p => p.Category === category)
    if (source)   list = list.filter(p => p.source === source)
    return list
  }, [products, search, category, source, zoneFilter])

  const displayedProducts = browseMode === 'zone' ? zoneProducts : ptProducts
  const productCount       = displayedProducts.length

  // ── Handlers ────────────────────────────────────────────────────
  const handleModeChange = (m: BrowseMode) => {
    setBrowseMode(m)
    onModeChange?.(m)
  }

  const openEdit = useCallback((product: Product) => {
    if (!can('edit')) { toast('Permission denied', 'error'); return }
    setEditingProduct(product); setModalMode('edit')
  }, [can, toast])

  const handleDelete = useCallback(async (product: Product) => {
    if (!can('delete')) { toast('Permission denied', 'error'); return }
    if (!confirm(`Delete "${product.Codes}"? This cannot be undone.`)) return
    try   { await deleteProduct(product.id); toast('Product deleted', 'success') }
    catch { toast('Failed to delete', 'error') }
  }, [can, deleteProduct, toast])

  const handleSubmit = useCallback(async (data: ProductFormData) => {
    try {
      if (modalMode === 'create') {
        await createProduct({ ...data, zone: activeZone || 'zone-a' })
        toast('Product created', 'success')
      } else if (modalMode === 'edit' && editingProduct) {
        await updateProduct(editingProduct.id, data)
        toast('Product updated', 'success')
      }
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Operation failed', 'error')
      throw e
    }
  }, [modalMode, editingProduct, createProduct, updateProduct, toast, activeZone])

  const handleSync = useCallback(async (url: string) => {
    try {
      toast('Syncing…', 'info')
      const r = await syncExternal(url)
      toast(`Synced: +${r.added} added, ${r.updated} updated`, 'success')
    } catch { toast('Sync failed — check the URL', 'error') }
  }, [syncExternal, toast])

  const handleQuickAdd = useCallback((product: Product) => {
    if (!can('cart')) return
    addItem({
      productCode:        product.Codes,
      productName:        product.Codes,
      productImage:       product.imageUrl ?? product.ImageLink ?? '',
      zone:               product.zone ?? activeZone ?? '',
      browseMode,
      productCategory:    browseMode === 'product' ? activeCat.label : undefined,
      productSubcategory: browseMode === 'product' ? activeSub?.label : undefined,
      productTypeName:    browseMode === 'product'
        ? activeSub?.types.find(t => t.id === activeTypeId)?.label
        : undefined,
      selection: {},
      quantity: 1,
    })
    toast(`${product.Codes} added to quote`, 'success')
  }, [can, addItem, browseMode, activeCat, activeSub, activeTypeId, activeZone, toast])

  const isVendorOrGuest = user?.role === 'vendor' || user?.role === 'guest'  // kept for cart banner only

  return (
    <div className="min-h-screen app-shell">
      {/* Header — only in product mode; zone mode has its own header inside ZoneNav */}
      {browseMode === 'product' && <Header productCount={productCount} />}

      {/* ── Zone tabs + header (zone mode) ── */}
      {browseMode === 'zone' && <ZoneNav />}

      <div className="flex flex-col gap-3 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
  
  {/* ✅ Show ONLY on /zone */}
  {pathname.startsWith('/zone') && (
    <ModeSwitcher mode={browseMode} onChange={handleModeChange} />
  )}

  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-gray-dark font-pop">
    <span className="rounded-full border border-white/80 bg-white/80 px-3 py-1.5 shadow-sm">
      {productCount} product{productCount !== 1 ? 's' : ''}
    </span>

    {can('cart') && (
      <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-amber-700 shadow-sm">
        Vendor quote mode
      </span>
    )}
  </div>

</div>

      {/* ── Product type filter panel (product mode) ── */}
      {browseMode === 'product' && (
        <ProductTypePanel
          activeCategory={activeCat}
          activeSubcategory={activeSub}
          activeTypeId={activeTypeId}
          onCategory={setActiveCat}
          onSubcategory={setActiveSub}
          onType={setActiveTypeId}
          productCount={ptProducts.length}
          search={ptSearch}
          onSearch={setPtSearch}
          viewLayout={viewLayout}
          onViewLayout={setViewLayout}
        />
      )}

      {/* ── Zone mode toolbar ── */}
      {/* {browseMode === 'zone' && ( */}
        <Toolbar
          search={search}     onSearch={setSearch}
          category={category} onCategory={setCategory}
          source={source}     onSource={setSource}
          categories={categories}
          view={viewLayout}   onView={setViewLayout}
          onAdd={() => setModalMode('create')}
          onSync={handleSync}
          zoneFilter={zoneFilter}
          onZoneFilter={setZoneFilter}
          showZoneFilter={!activeZone && user?.role === 'admin'}
        />
      {/* )} */}

      {/* ── Welcome banner for vendors ── */}
      {can('cart') && (
        <div className="mx-4 mt-4 flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-sm sm:mx-6 lg:mx-8">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-600 flex-shrink-0">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
          <p className="text-xs text-amber-700 font-pop">
            <strong className="font-semibold">{user?.company ?? user?.name}</strong>
            {' — '}click any product to configure and add to your quote.
          </p>
        </div>
      )}

      {/* ── Main content ── */}
      <main className="px-4 py-5 pb-24 sm:px-6 lg:px-8">
        {/* Zone heading */}
        {browseMode === 'zone' && zone && (
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <div className="w-1 h-6 bg-primary rounded-full" />
            <h2 className="text-lg font-bold font-bai text-foreground">{zone.label}</h2>
            <span className="text-xs text-gray-dark font-pop bg-gray px-2.5 py-1 rounded-full border border-gray-mid">
              {zoneProducts.length} products
            </span>
          </div>
        )}

        {/* Empty state */}
        {displayedProducts.length === 0 && (
          <div className="text-center py-24">
            <svg className="opacity-10 mx-auto mb-4" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <p className="text-gray-dark font-bai text-sm">
              {browseMode === 'zone'
                ? (activeZone ? `No products in ${zone?.label ?? activeZone}` : 'No products found')
                : 'No products found for this selection'
              }
            </p>
            {browseMode === 'product' && ptSearch && (
              <button onClick={() => setPtSearch('')} className="mt-3 text-xs text-primary font-semibold font-bai underline">
                Clear search
              </button>
            )}
          </div>
        )}

        {/* Grid */}
        {displayedProducts.length > 0 && viewLayout === 'grid' && (
          <div className="grid gap-4 sm:gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 220px), 1fr))' }}>
            {displayedProducts.map((p, i) => (
              <ProductCard
                key={p.id} product={p} index={i}
                onClick={() => setSelectedProduct(p)}
                onEdit={() => openEdit(p)}
                onDelete={() => handleDelete(p)}
                hasDetail={!!getProductDetail(p.Codes)}
                onQuickAdd={can('cart') ? () => handleQuickAdd(p) : undefined}
              />
            ))}
          </div>
        )}

        {/* List */}
        {displayedProducts.length > 0 && viewLayout === 'list' && (
          <div className="flex flex-col gap-2">
            {displayedProducts.map((p, i) => (
              <ProductRow
                key={p.id} product={p} index={i}
                onClick={() => setSelectedProduct(p)}
                onEdit={() => openEdit(p)}
                onDelete={() => handleDelete(p)}
                hasDetail={!!getProductDetail(p.Codes)}
              />
            ))}
          </div>
        )}
      </main>

      <ProductDetail
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onEdit={() => selectedProduct && openEdit(selectedProduct)}
        onDelete={() => selectedProduct && handleDelete(selectedProduct)}
        browseMode={browseMode}
        productCategory={browseMode === 'product' ? activeCat.label : undefined}
        productSubcategory={browseMode === 'product' ? activeSub?.label : undefined}
        productTypeName={browseMode === 'product'
          ? activeSub?.types.find(t => t.id === activeTypeId)?.label
          : undefined}
        activeZone={activeZone}
      />

      <CrudModal
        mode={modalMode} product={editingProduct}
        onSubmit={handleSubmit}
        onClose={() => { setModalMode(null); setEditingProduct(null) }}
        currentZone={activeZone}
      />

      <CartDrawer />
      <ToastContainer />
    </div>
  )
}
