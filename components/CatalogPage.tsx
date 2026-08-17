'use client'

import { useState, useMemo, useCallback, useRef, useEffect, type ReactNode } from 'react'
import type { Product, ProductFormData, BrowseMode } from '@/types'
import type { CollectionNode, ProductTypeNode } from '@/lib/services/products'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { useCart } from '@/context/CartContext'
import { useProducts } from '@/lib/useProducts'
import { useZones } from '@/context/ZonesContext'
import { getProductDetail } from '@/lib/productDetails'
import { toCartProductSpecs } from '@/lib/cartSpecs'
import { getZonePath } from '@/lib/zones'
import Header from '@/components/Header'
import ZoneNav from '@/components/ZoneNav'
import Toolbar from '@/components/Toolbar'
import ProductCard from '@/components/ProductCard'
import ProductRow from '@/components/ProductRow'
import ProductDetail from '@/components/ProductDetail'
import CrudModal from '@/components/CrudModal'
import CartDrawer from '@/components/CartDrawer'
import ToastContainer from '@/components/ToastContainer'
import { usePathname, useRouter } from 'next/navigation'

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

// ── Filter row: sticky label + carousel of pills ────────────────────────
// Used for all three ProductTypePanel levels (Category/Subcategory/Product
// Type). The label stays pinned to the left edge while the pills scroll as
// a horizontal carousel, with prev/next arrows that fade in once there's
// more to scroll in that direction.
function FilterRow({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }, [])

  useEffect(() => {
    updateScrollState()
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', updateScrollState, { passive: true })
    const ro = new ResizeObserver(updateScrollState)
    ro.observe(el)
    return () => { el.removeEventListener('scroll', updateScrollState); ro.disconnect() }
  }, [updateScrollState, children])

  const scrollByAmount = (dir: 1 | -1) => scrollRef.current?.scrollBy({ left: dir * 220, behavior: 'smooth' })

  return (
    <div className={`flex items-center gap-1.5 px-4 sm:px-6 lg:px-8 ${className}`}>
      <span className="sticky left-0 z-10 flex-shrink-0 whitespace-nowrap bg-white/90 py-1 pr-2 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-dark font-pop backdrop-blur-sm">
        {label}
      </span>

      <button
        onClick={() => scrollByAmount(-1)}
        aria-label={`Scroll ${label} left`}
        className={`flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full border border-gray-mid bg-white text-gray-dark shadow-sm transition-opacity hover:text-primary hover:border-primary ${
          canScrollLeft ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
      </button>

      <div ref={scrollRef} className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto scroll-smooth scrollbar-hide">
        {children}
      </div>

      <button
        onClick={() => scrollByAmount(1)}
        aria-label={`Scroll ${label} right`}
        className={`flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full border border-gray-mid bg-white text-gray-dark shadow-sm transition-opacity hover:text-primary hover:border-primary ${
          canScrollRight ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    </div>
  )
}

// ── Product Type Filter Panel ──────────────────────────────────────────
// Fully data-driven from the live Supabase catalogue via /api/product-taxonomy
// (no hardcoded/fictional taxonomy — however many collections, group_names,
// or product types actually exist in ledlum_products is however many render):
//   Level 1 — Collection   (ledlum_products.collection, e.g. indoor/outdoor)
//   Level 2 — Category     (ledlum_products.group_name, real values, per collection)
//   Level 3 — Product Type (ledlum_products.category, per group — only when present)
function ProductTypePanel({
  collections,
  activeCollection,
  onCollection,
  activeGroup,
  onGroup,
  activeProductType,
  onProductType,
  loading,
}: {
  collections: CollectionNode[]
  activeCollection: string
  onCollection: (c: string) => void
  activeGroup: string | null
  onGroup: (g: string | null) => void
  activeProductType: string | null
  onProductType: (t: string | null) => void
  loading: boolean
}) {
  const activeCollectionNode = collections.find(c => c.name === activeCollection) ?? null
  const groupNames = activeCollectionNode?.groupNames ?? []
  const activeGroupNode = groupNames.find(g => g.name === activeGroup) ?? null
  const productTypes = activeGroupNode?.productTypes ?? []

  if (loading && collections.length === 0) {
    return (
      <div className="border-b border-white/80 bg-white/75 backdrop-blur px-4 pb-4 pt-4 sm:px-6 lg:px-8">
        <div className="flex gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-7 w-28 animate-pulse rounded-full bg-gray" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="border-b border-white/80 bg-white/75 backdrop-blur">
      {/* ── Level 1: Collection row ── */}
      <FilterRow label="Category" className="pb-2 pt-4">
        {collections.map(c => (
          <button
            key={c.name}
            onClick={() => { onCollection(c.name); onGroup(null); onProductType(null) }}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold font-bai whitespace-nowrap transition-all ${
              activeCollection === c.name
                ? 'bg-primary text-white shadow-sm ring-2 ring-primary/20'
                : 'bg-gray border border-gray-mid text-gray-text hover:border-primary hover:text-primary'
            }`}
          >
            {c.label}
            <span className={`text-[9px] font-pop px-1 py-0.5 rounded ${
              activeCollection === c.name ? 'bg-white/25' : 'bg-white text-gray-dark'
            }`}>
              {c.count}
            </span>
          </button>
        ))}
      </FilterRow>

      {/* ── Level 2: Category row (real group_name values) ── */}
      {groupNames.length > 0 && (
        <FilterRow label="Subcategory" className="pb-2">
          {/* "All" chip to reset category */}
          <button
            onClick={() => { onGroup(null); onProductType(null) }}
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold font-bai transition-all ${
              !activeGroup
                ? 'bg-foreground text-white shadow-sm'
                : 'bg-gray border border-gray-mid text-gray-text hover:border-foreground hover:text-foreground'
            }`}
          >
            All
          </button>
          {groupNames.map(({ name, count }) => (
            <button
              key={name}
              onClick={() => { onGroup(activeGroup === name ? null : name); onProductType(null) }}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold font-bai whitespace-nowrap transition-all ${
                activeGroup === name
                  ? 'bg-primary text-white shadow-sm ring-2 ring-primary/20'
                  : 'bg-gray border border-gray-mid text-gray-text hover:border-primary hover:text-primary'
              }`}
            >
              {name}
              <span className={`text-[9px] font-pop px-1 py-0.5 rounded ${
                activeGroup === name ? 'bg-white/25' : 'bg-white text-gray-dark'
              }`}>
                {count}
              </span>
            </button>
          ))}
        </FilterRow>
      )}

      {/* ── Level 3: Product type row (only when the active group has one) ── */}
      {activeGroup && productTypes.length > 0 && (
        <FilterRow label="Product Type" className="pb-3">
          <button
            onClick={() => onProductType(null)}
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold font-bai transition-all ${
              !activeProductType
                ? 'bg-primary/15 text-primary border border-primary/30 ring-1 ring-primary/20'
                : 'bg-gray border border-gray-mid text-gray-text hover:border-primary hover:text-primary'
            }`}
          >
            All types
          </button>
          {productTypes.map(({ name, count }: ProductTypeNode) => (
            <button
              key={name}
              onClick={() => onProductType(activeProductType === name ? null : name)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold font-bai whitespace-nowrap transition-all ${
                activeProductType === name
                  ? 'bg-primary text-white shadow-sm ring-2 ring-primary/20'
                  : 'bg-gray border border-gray-mid text-gray-text hover:border-primary hover:text-primary'
              }`}
            >
              {name}
              <span className={`text-[9px] font-pop px-1 py-0.5 rounded ${
                activeProductType === name ? 'bg-white/25' : 'bg-white text-gray-dark'
              }`}>
                {count}
              </span>
            </button>
          ))}
        </FilterRow>
      )}

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
  const { getZoneById } = useZones()
  const activeZone     = zoneIdProp ?? ''
  const zone           = getZoneById(activeZone)

  const [zoneFilter,setZoneFilter] = useState('')
  const [browseMode, setBrowseMode] = useState<BrowseMode>(initialMode)
  const [viewLayout, setViewLayout] = useState<ViewLayout>('grid')
  const pathname = usePathname()
  const router = useRouter()

  // Zone mode's "Category" filter is a real zone switch (same as ZoneNav's
  // pill row) — not a client-side filter — so the URL, header, and pill
  // highlighting all stay in sync with whichever zone's products are shown.
  const handleZoneSelect = useCallback((zoneId: string) => {
    router.push(zoneId ? `/zone/${getZonePath(zoneId)}` : '/zone')
  }, [router])

  // ── Sticky toolbar offset ──────────────────────────────────────────
  // Measured (not hardcoded) so it stays correct across breakpoints where
  // Header/ZoneNav wrap taller. Only counts children that are actually
  // `position: sticky` — ZoneNav renders its logo header (sticky) AND its
  // zone-tabs row (NOT sticky, scrolls away normally), so summing every
  // child's height would overcount and leave Toolbar sticking too far down,
  // opening a gap once the zone-tabs row scrolls out of view.
  // NOTE: headerRef's wrapper div renders with `display: contents` (see JSX
  // below) so it never becomes an actual box in the layout. A normal div
  // here would be exactly as tall as Header/ZoneNav and nothing else — and
  // position:sticky elements can only stay stuck within their containing
  // block's box, so a tightly-fit wrapper silently caps them to a few
  // pixels of scroll before they get shoved off along with it. `contents`
  // makes Header/ZoneNav's containing block the full-height page div
  // instead, so they can stay stuck for the whole scroll like they should.
  const headerRef = useRef<HTMLDivElement>(null)
  const [headerHeight, setHeaderHeight] = useState(0)
  useEffect(() => {
    const container = headerRef.current
    if (!container) return
    const children = Array.from(container.children) as HTMLElement[]
    const update = () => {
      setHeaderHeight(children.reduce((sum, child) => (
        getComputedStyle(child).position === 'sticky' ? sum + child.getBoundingClientRect().height : sum
      ), 0))
    }
    update()
    const ro = new ResizeObserver(update)
    children.forEach(child => ro.observe(child))
    window.addEventListener('resize', update)
    return () => { ro.disconnect(); window.removeEventListener('resize', update) }
  }, [browseMode])

  // ── Scroll-to-top floating button ─────────────────────────────────
  const [showScrollTop, setShowScrollTop] = useState(false)
  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 480)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // ── Zone mode state ─────────────────────────────────────────────
  const {
    products, loading: zoneLoading, loadingMore, hasMore, loadMore,
    categories, fetchProducts, createProduct, updateProduct, deleteProduct,
  } = useProducts(activeZone || undefined)
  const [search, setSearch]         = useState('')
  const [category, setCategory]     = useState('')
  const [source, setSource]         = useState('')

  // Re-fetch (from page 1) whenever a zone-mode filter changes — server-side
  // filtering + pagination, replacing the old client-only useMemo filter.
  // Switching zones is a real navigation (see handleZoneSelect below), not a
  // filter here — activeZone changing already gives useProducts a new `zone`
  // binding, which re-triggers this effect via the changed `fetchProducts`
  // identity.
  useEffect(() => {
    if (browseMode !== 'zone') return
    const handle = setTimeout(() => {
      fetchProducts({
        search: search || undefined,
        category: category || undefined,
        source: source || undefined,
      })
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, search ? 300 : 0) // debounce free-text search only
    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [browseMode, search, category, source, fetchProducts])

  // ── Product type mode state ───────────────────────────────────────
  // Fully data-driven from ledlum_products via /api/product-taxonomy — however
  // many collections/group_names/product types actually exist in the DB is
  // however many render, nothing here is a fixed/hardcoded list.
  const [taxonomy, setTaxonomy]                 = useState<CollectionNode[]>([])
  const [taxonomyLoading, setTaxonomyLoading]   = useState(true)
  const [activeCollection, setActiveCollection] = useState<string>('')
  const [activeGroup, setActiveGroup]           = useState<string | null>(null)
  const [activeProductType, setActiveProductType] = useState<string | null>(null)
  const [ptSearch, setPtSearch]                 = useState('')

  // Fetch the taxonomy once; pick the largest collection as the default tab.
  useEffect(() => {
    let cancelled = false
    fetch('/api/product-taxonomy')
      .then(res => res.json())
      .then((data: CollectionNode[]) => {
        if (cancelled) return
        setTaxonomy(data)
        setActiveCollection(prev => (prev && data.some(c => c.name === prev)) ? prev : (data[0]?.name ?? ''))
      })
      .catch(err => console.error('[CatalogPage] taxonomy fetch error:', err))
      .finally(() => { if (!cancelled) setTaxonomyLoading(false) })
    return () => { cancelled = true }
  }, [])

  // Second, independent product feed for product-type mode — server-side
  // filtered by collection/groupName/productType + paginated (never the same
  // `products` list zone mode uses, which is scoped/paginated differently).
  const {
    products: ptProducts, loading: ptLoading, loadingMore: ptLoadingMore,
    hasMore: ptHasMore, loadMore: ptLoadMore, fetchProducts: fetchPtProducts,
  } = useProducts(undefined, { skipCategories: true })

  useEffect(() => {
    if (browseMode !== 'product' || !activeCollection) return
    const handle = setTimeout(() => {
      fetchPtProducts({
        collection: activeCollection,
        groupName: activeGroup || undefined,
        productType: activeProductType || undefined,
        search: ptSearch || undefined,
        source: source || undefined,
      })
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, ptSearch ? 300 : 0)
    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [browseMode, activeCollection, activeGroup, activeProductType, ptSearch, source, fetchPtProducts])

  // ── Shared ──────────────────────────────────────────────────────
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [modalMode, setModalMode]             = useState<'create' | 'edit' | null>(null)
  const [editingProduct, setEditingProduct]   = useState<Product | null>(null)

  useEffect(() => {
    if (!initialProductId || products.length === 0) return
    const p = products.find(p => p.id === initialProductId || p.Codes === initialProductId)
    if (p) setSelectedProduct(p)
  }, [initialProductId, products])

  // Zone mode filter
  const zoneProducts = useMemo(() => {
    let list = [...products]
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(p =>
        p.Codes.toLowerCase().includes(q) || p.Category.toLowerCase().includes(q)
      )
    }
    if (category) list = list.filter(p => p.Category === category)
    if (source)   list = list.filter(p => p.source === source)
    return list
  }, [products, search, category, source])

  const displayedProducts = browseMode === 'zone' ? zoneProducts : ptProducts
  const productCount       = displayedProducts.length
  const displayedLoading   = browseMode === 'zone' ? zoneLoading : ptLoading
  const displayedLoadingMore = browseMode === 'zone' ? loadingMore : ptLoadingMore
  const displayedHasMore   = browseMode === 'zone' ? hasMore : ptHasMore
  const displayedLoadMore  = browseMode === 'zone' ? loadMore : ptLoadMore

  // ── Infinite scroll (20 at a time, both modes) ─────────────────────
  // The observer is created ONCE and left alone — it must NOT be recreated
  // on every load. A freshly-created IntersectionObserver fires immediately
  // for a target that's already intersecting, so recreating it whenever
  // `displayedLoadMore` or `displayedProducts.length` changed (both change
  // on every successful load) turned this into a runaway loop: load 20 →
  // observer recreated → fires immediately (sentinel still in view) → load
  // 20 more → repeat — silently pulling in the ENTIRE result set (up to
  // ~1700 rows) instead of 20 at a time, which is what was blowing up the
  // browser once real product images were involved (ERR_INSUFFICIENT_RESOURCES
  // / out-of-memory from hundreds of concurrent image requests).
  const loadMoreSentinelRef = useRef<HTMLDivElement>(null)
  const loadMoreRef = useRef(displayedLoadMore)
  useEffect(() => { loadMoreRef.current = displayedLoadMore }, [displayedLoadMore])

  console.log("productCount",displayedProducts)

  useEffect(() => {
    const el = loadMoreSentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      entries => { if (entries[0]?.isIntersecting) loadMoreRef.current() },
      { rootMargin: '400px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // IntersectionObserver only fires on enter/exit *transitions* — if the
  // sentinel stays continuously inside the 400px trigger zone across a load
  // (e.g. a wide grid where a 20-item page doesn't add enough height to push
  // the sentinel back out), it never re-enters and loadMore silently stalls
  // after one page. After every product-list change, re-check the sentinel's
  // position directly and fire loadMore again if it's still in range.
  useEffect(() => {
    if (displayedLoadingMore || !displayedHasMore) return
    const el = loadMoreSentinelRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    if (rect.top <= window.innerHeight + 400) loadMoreRef.current()
  }, [displayedProducts.length, displayedLoadingMore, displayedHasMore])

  // ── Handlers ────────────────────────────────────────────────────
  const handleModeChange = (m: BrowseMode) => {
    setBrowseMode(m)
    onModeChange?.(m)
  }

  // Product-mode taxonomy pickers — shared by ProductTypePanel's pill row
  // and the Toolbar filter drawer's Category/Subcategory selects, so both
  // reset the lower taxonomy levels the same way when a higher one changes.
  const handleTaxonomyCollection = useCallback((c: string) => {
    setActiveCollection(c); setActiveGroup(null); setActiveProductType(null)
  }, [])
  const handleTaxonomyGroup = useCallback((g: string | null) => {
    setActiveGroup(g); setActiveProductType(null)
  }, [])

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

  const activeCollectionNode = useMemo(
    () => taxonomy.find(c => c.name === activeCollection) ?? null,
    [taxonomy, activeCollection]
  )

  const handleQuickAdd = useCallback((product: Product) => {
    if (!can('cart')) return
    addItem({
      productCode:        product.Codes,
      productName:        product.Codes,
      productImage:       product.imageUrl ?? product.ImageLink ?? '',
      zone:               product.zone ?? activeZone ?? '',
      browseMode,
      productCategory:    browseMode === 'product' ? (activeCollectionNode?.label ?? activeCollection) : undefined,
      productSubcategory: browseMode === 'product' ? activeGroup ?? undefined : undefined,
      productTypeName:    browseMode === 'product' ? activeProductType ?? undefined : undefined,
      productSpecs:       toCartProductSpecs(product),
      selection: {},
      quantity: 1,
    })
    toast(`${product.Codes} added to quote`, 'success')
  }, [can, addItem, browseMode, activeCollectionNode, activeCollection, activeGroup, activeProductType, activeZone, toast])

  const isVendorOrGuest = user?.role === 'vendor' || user?.role === 'guest'  // kept for cart banner only

  return (
    <div className="min-h-screen app-shell">
      {/* Header — only in product mode; zone mode has its own header inside
          ZoneNav. `contents` so this wrapper never becomes a box that caps
          how far its sticky children (Header/ZoneNav's bars) can stick. */}
      <div ref={headerRef} className="contents">
        {browseMode === 'product' && <Header productCount={productCount} />}

        {/* ── Zone tabs + header (zone mode) ── */}
        {browseMode === 'zone' && <ZoneNav productCount={productCount} />}
      </div>

      <div className="flex flex-col gap-3 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">

  {/* ✅ Show ONLY on /zone, product mode (hidden for zone dashboard) */}
  {pathname.startsWith('/zone') && browseMode !== 'zone' && (
    <ModeSwitcher mode={browseMode} onChange={handleModeChange} />
  )}

  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-gray-dark font-pop">
    {/* {browseMode === 'product' && (
      <span className="rounded-full border border-white/80 bg-white/80 px-3 py-1.5 shadow-sm">
        {productCount} product{productCount !== 1 ? 's' : ''}
      </span>
    )} */}

    {can('cart') && (
      <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-amber-700 shadow-sm">
        Vendor quote mode
      </span>
    )}
  </div>

</div>

      {/* ── Product type filter panel (product mode) — scrolls away normally;
          only Toolbar below it stays sticky. ── */}
      {browseMode === 'product' && (
        <ProductTypePanel
          collections={taxonomy}
          activeCollection={activeCollection}
          onCollection={setActiveCollection}
          activeGroup={activeGroup}
          onGroup={setActiveGroup}
          activeProductType={activeProductType}
          onProductType={setActiveProductType}
          loading={taxonomyLoading}
        />
      )}

        <Toolbar
          stickyTop={headerHeight}
          search={browseMode === 'zone' ? search : ptSearch}
          onSearch={browseMode === 'zone' ? setSearch : setPtSearch}
          category={category} onCategory={setCategory}
          source={source}     onSource={setSource}
          categories={categories}
          view={viewLayout}   onView={setViewLayout}
          onAdd={() => setModalMode('create')}
          zoneFilter={zoneFilter}
          onZoneFilter={setZoneFilter}
          showZoneFilter={browseMode === 'zone' && !activeZone && user?.role === 'admin'}
          showCategoryFilter={browseMode === 'zone'}
          productTaxonomy={browseMode === 'product' ? {
            collections: taxonomy,
            activeCollection,
            onCollection: handleTaxonomyCollection,
            activeGroup,
            onGroup: handleTaxonomyGroup,
          } : undefined}
        />

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
              {productCount}{hasMore ? '+' : ''} products
            </span>
          </div>
        )}

        {/* Initial loading state */}
        {displayedLoading && displayedProducts.length === 0 && (
          <div className="grid gap-4 sm:gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 220px), 1fr))' }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[4/3] animate-pulse rounded-2xl bg-gray" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!displayedLoading && displayedProducts.length === 0 && (
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

        {/* Infinite-scroll sentinel — always mounted (not conditional on
            hasMore/loadingMore) so its DOM node — and the IntersectionObserver
            watching it — persist across loads instead of being torn down and
            recreated on every batch. loadMore() itself already no-ops once
            hasMore is false, so an always-present sentinel is safe. */}
        <div ref={loadMoreSentinelRef} className="h-px" />
        {displayedLoadingMore && (
          <div className="flex justify-center py-8">
            <div className="flex items-center gap-2 text-xs text-gray-dark font-pop">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-mid border-t-primary" />
              Loading more…
            </div>
          </div>
        )}
      </main>

      <ProductDetail
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onEdit={() => selectedProduct && openEdit(selectedProduct)}
        onDelete={() => selectedProduct && handleDelete(selectedProduct)}
        browseMode={browseMode}
        productCategory={browseMode === 'product' ? (activeCollectionNode?.label ?? activeCollection) : undefined}
        productSubcategory={browseMode === 'product' ? activeGroup ?? undefined : undefined}
        productTypeName={browseMode === 'product' ? activeProductType ?? undefined : undefined}
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

      {/* ── Scroll to top ── */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Scroll to top"
        className={`tap-target fixed bottom-6 right-6 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-all duration-300 hover:bg-primary-dark ${
          showScrollTop ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
        }`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="19" x2="12" y2="5"/>
          <polyline points="5 12 12 5 19 12"/>
        </svg>
      </button>
    </div>
  )
}
