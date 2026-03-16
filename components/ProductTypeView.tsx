'use client'

import { useState, useMemo } from 'react'
import { TAXONOMY, type TaxonomyCategory, type Subcategory } from '@/lib/productTaxonomy'
import { getProductsByType } from '@/lib/productTaxonomyData'
import { getProductDetail } from '@/lib/productDetails'
import { getImageUrl } from '@/lib/auth'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { useToast } from '@/context/ToastContext'
import type { Product } from '@/types'
import ProductDetail from './ProductDetail'
import Header from './Header'
import CartDrawer from './CartDrawer'
import ToastContainer from './ToastContainer'

interface Props {
  onSwitchToZone: () => void
}

export default function ProductTypeView({ onSwitchToZone }: Props) {
  const { can } = useAuth()
  const { toast } = useToast()

  // ── Three-level selection state ───────────────────────────────────
  const [activeCategory, setActiveCategory]     = useState<TaxonomyCategory>(TAXONOMY[0])
  const [activeSubcategory, setActiveSubcategory] = useState<Subcategory | null>(null)
  const [activeTypeId, setActiveTypeId]         = useState<string | null>(null)

  // ── Product detail panel ──────────────────────────────────────────
  const [selectedProduct, setSelectedProduct]   = useState<Product | null>(null)

  // Sidebar collapsed on mobile
  const [sidebarOpen, setSidebarOpen]           = useState(false)

  const products = useMemo(() => {
    if (!activeTypeId) return []
    return getProductsByType(activeTypeId)
  }, [activeTypeId])

  const handleCategoryClick = (cat: TaxonomyCategory) => {
    setActiveCategory(cat)
    setActiveSubcategory(null)
    setActiveTypeId(null)
  }

  const handleSubcategoryClick = (sub: Subcategory) => {
    setActiveSubcategory(sub)
    setActiveTypeId(null)
  }

  const handleTypeClick = (typeId: string) => {
    setActiveTypeId(typeId)
    setSidebarOpen(false)
  }

  // ── Breadcrumb label ──────────────────────────────────────────────
  const breadcrumb = useMemo(() => {
    const parts = [activeCategory.label]
    if (activeSubcategory) parts.push(activeSubcategory.label)
    if (activeTypeId) {
      const type = activeSubcategory?.types.find(t => t.id === activeTypeId)
      if (type) parts.push(type.label)
    }
    return parts
  }, [activeCategory, activeSubcategory, activeTypeId])

  return (
    <>
      <Header productCount={products.length} />

      {/* Sub-header: mode switcher + breadcrumb */}
      <div className="border-b border-gray bg-white px-6 py-0 flex items-center justify-between gap-4">

        {/* View toggle pills */}
        <div className="flex items-center bg-gray border border-gray-mid rounded-xl p-1 gap-1 my-3 flex-shrink-0">
          <button
            onClick={onSwitchToZone}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-bai text-gray-text hover:text-foreground transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            Zone
          </button>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg shadow-sm text-xs font-bold font-bai text-primary border border-primary/20">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="7" height="7" rx="1"/><rect x="15" y="3" width="7" height="7" rx="1"/>
              <rect x="2" y="14" width="7" height="7" rx="1"/><rect x="15" y="14" width="7" height="7" rx="1"/>
            </svg>
            Product Type
          </div>
        </div>

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-xs font-pop text-gray-dark overflow-x-auto py-3 flex-1 min-w-0">
          {breadcrumb.map((part, i) => (
            <span key={i} className="flex items-center gap-1 whitespace-nowrap">
              {i > 0 && <span className="text-gray-mid select-none">/</span>}
              <span className={i === breadcrumb.length - 1 ? 'text-foreground font-semibold' : 'text-gray-text'}>
                {part}
              </span>
            </span>
          ))}
        </nav>

        {/* Mobile sidebar toggle */}
        <button
          className="sm:hidden flex items-center gap-1.5 text-xs font-semibold font-bai text-primary border border-primary/30 rounded-lg px-3 py-1.5 ml-3"
          onClick={() => setSidebarOpen(v => !v)}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
          Categories
        </button>
      </div>

      <div className="flex min-h-[calc(100vh-8.5rem)] relative">

        {/* ── Sidebar overlay for mobile ── */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/30 sm:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── 3-Level Sidebar ── */}
        <aside className={`
          fixed sm:relative top-0 left-0 h-full z-40 sm:z-auto
          w-72 bg-white border-r border-gray flex flex-col
          transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full sm:translate-x-0'}
          sm:h-auto sm:min-h-full sm:shadow-none
        `}>
          {/* Mobile header */}
          <div className="sm:hidden flex items-center justify-between px-4 py-3 border-b border-gray">
            <span className="text-sm font-bold font-bai text-foreground">Categories</span>
            <button onClick={() => setSidebarOpen(false)} className="w-7 h-7 flex items-center justify-center text-gray-text hover:text-primary">✕</button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* ── Level 1: Categories ── */}
            <div className="p-3 border-b border-gray">
              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-gray-dark font-pop px-2 mb-2">Category</p>
              {TAXONOMY.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold font-bai text-left transition-all ${
                    activeCategory.id === cat.id
                      ? 'bg-primary text-white'
                      : 'text-gray-text hover:bg-gray hover:text-foreground'
                  }`}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="flex-shrink-0">
                    {cat.icon.split(' M').map((d, i) => (
                      <path key={i} d={i === 0 ? d : 'M' + d} />
                    ))}
                  </svg>
                  <span className="flex-1 leading-tight">{cat.label}</span>
                  {activeCategory.id === cat.id && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="flex-shrink-0 opacity-80">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  )}
                </button>
              ))}
            </div>

            {/* ── Level 2: Subcategories ── */}
            {activeCategory.subcategories.length > 0 && (
              <div className="p-3 border-b border-gray">
                <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-gray-dark font-pop px-2 mb-2">{activeCategory.label}</p>
                {activeCategory.subcategories.map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => handleSubcategoryClick(sub)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-bai text-left transition-all ${
                      activeSubcategory?.id === sub.id
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-gray-text hover:bg-gray hover:text-foreground'
                    }`}
                  >
                    <span>{sub.label}</span>
                    <span className={`text-[10px] font-pop px-1.5 py-0.5 rounded-full ${
                      activeSubcategory?.id === sub.id
                        ? 'bg-primary/15 text-primary'
                        : 'bg-gray text-gray-dark'
                    }`}>
                      {sub.types.length}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* ── Level 3: Product Types ── */}
            {activeSubcategory && (
              <div className="p-3">
                <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-gray-dark font-pop px-2 mb-2">{activeSubcategory.label}</p>
                {activeSubcategory.types.map(type => {
                  const count = getProductsByType(type.id).length
                  return (
                    <button
                      key={type.id}
                      onClick={() => handleTypeClick(type.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-bai text-left transition-all ${
                        activeTypeId === type.id
                          ? 'bg-primary text-white font-semibold'
                          : 'text-gray-text hover:bg-gray hover:text-foreground'
                      }`}
                    >
                      <span className="leading-tight">{type.label}</span>
                      <span className={`text-[10px] font-pop px-1.5 py-0.5 rounded-full flex-shrink-0 ml-2 ${
                        activeTypeId === type.id
                          ? 'bg-white/20 text-white'
                          : count > 0 ? 'bg-primary/10 text-primary' : 'bg-gray text-gray-dark'
                      }`}>
                        {count}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main className="flex-1 overflow-y-auto">

          {/* No selection state */}
          {!activeTypeId && (
            <div className="flex flex-col items-center justify-center h-full py-24 px-6 text-center">
              <div className="w-20 h-20 rounded-2xl bg-primary/8 flex items-center justify-center mb-6">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary">
                  {activeSubcategory ? (
                    <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>
                  ) : (
                    <><rect x="2" y="3" width="7" height="7" rx="1"/><rect x="15" y="3" width="7" height="7" rx="1"/><rect x="2" y="14" width="7" height="7" rx="1"/><rect x="15" y="14" width="7" height="7" rx="1"/></>
                  )}
                </svg>
              </div>
              <h3 className="text-lg font-bold font-bai text-foreground mb-2">
                {!activeSubcategory
                  ? `Select a subcategory from ${activeCategory.label}`
                  : `Select a product type from ${activeSubcategory.label}`
                }
              </h3>
              <p className="text-sm text-gray-text font-pop max-w-xs">
                {!activeSubcategory
                  ? 'Choose a subcategory on the left to drill down into product types.'
                  : 'Pick a specific product type on the left to view available products.'
                }
              </p>

              {/* Subcategory quick-select when category chosen but no subcat */}
              {!activeSubcategory && (
                <div className="mt-8 flex flex-wrap gap-2 justify-center max-w-lg">
                  {activeCategory.subcategories.map(sub => (
                    <button
                      key={sub.id}
                      onClick={() => handleSubcategoryClick(sub)}
                      className="px-4 py-2 border border-gray-mid rounded-full text-sm font-semibold font-bai text-gray-text hover:border-primary hover:text-primary transition-colors"
                    >
                      {sub.label}
                      <span className="ml-1.5 text-[10px] opacity-60">{sub.types.length}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Type quick-select when subcat chosen */}
              {activeSubcategory && (
                <div className="mt-8 flex flex-wrap gap-2 justify-center max-w-lg">
                  {activeSubcategory.types.map(type => {
                    const count = getProductsByType(type.id).length
                    return (
                      <button
                        key={type.id}
                        onClick={() => handleTypeClick(type.id)}
                        className="px-4 py-2 border border-gray-mid rounded-full text-sm font-semibold font-bai text-gray-text hover:border-primary hover:text-primary transition-colors"
                      >
                        {type.label}
                        {count > 0 && <span className="ml-1.5 text-[10px] text-primary opacity-80">{count}</span>}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Products grid */}
          {activeTypeId && (
            <div className="p-6">

              {/* Section header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-6 bg-primary rounded-full" />
                <div>
                  <h2 className="text-lg font-bold font-bai text-foreground">
                    {activeSubcategory?.types.find(t => t.id === activeTypeId)?.label}
                  </h2>
                  <p className="text-xs text-gray-text font-pop">{activeSubcategory?.label} · {activeCategory.label}</p>
                </div>
                <span className="ml-auto text-xs font-pop text-gray-dark bg-gray border border-gray-mid px-2.5 py-1 rounded-full">
                  {products.length} product{products.length !== 1 ? 's' : ''}
                </span>
              </div>

              {can('cart') && (
                <div className="mb-5 flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-600 flex-shrink-0">
                    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                  </svg>
                  <p className="text-sm text-amber-700 font-pop">Click any product to configure and add to your quote.</p>
                </div>
              )}

              {products.length === 0 ? (
                <div className="text-center py-20">
                  <svg className="opacity-10 mx-auto mb-3" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  <p className="text-gray-dark font-bai text-sm">No products listed for this type yet</p>
                  <p className="text-gray-dark text-xs font-pop mt-1">Contact your LEDLUM rep for availability</p>
                </div>
              ) : (
                <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
                  {products.map(product => (
                    <ProductTypeCard
                      key={product.id}
                      product={product}
                      productCategory={activeCategory.label}
                      productSubcategory={activeSubcategory?.label}
                      productTypeName={activeTypeId}
                      onClick={() => setSelectedProduct(product)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <ProductDetail
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onEdit={() => {}}
        onDelete={() => {}}
      />

      <CartDrawer />
      <ToastContainer />
    </>
  )
}

// ── Inline product card ───────────────────────────────────────────────
function ProductTypeCard({ product, productCategory, productSubcategory, productTypeName, onClick }: { 
  product: Product; 
  productCategory?: string;
  productSubcategory?: string;
  productTypeName?: string;
  onClick: () => void 
}) {
  const { can, user } = useAuth()
  const { addItem } = useCart()
  const { toast } = useToast()
  const hasDetail = !!getProductDetail(product.Codes)

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!can('cart')) return
    addItem({
      productCode: product.Codes,
      productName: product.Codes,
      productImage: getImageUrl(product.ImageLink ?? '') || '',
      zone: product.zone ?? '',
      browseMode: 'product',
      productCategory: productCategory,
      productSubcategory: productSubcategory,
      productTypeName: productTypeName ?? '',
      selection: {},
      quantity: 1,
    })
    toast(`${product.Codes} added to quote`, 'success')
  }

  return (
    <button
      onClick={onClick}
      className="group bg-white border border-gray hover:border-primary rounded-xl overflow-hidden text-left transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 flex flex-col"
    >
      {/* Image area */}
      <div className="aspect-square bg-gray flex items-center justify-center relative overflow-hidden">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.Codes} className="w-full h-full object-cover" />
        ) : (
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-gray-mid opacity-30">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
        )}
        {hasDetail && (
          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary/90 flex items-center justify-center pointer-events-none">
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-1 flex-1">
        <p className="text-xs font-bold font-bai text-foreground leading-tight group-hover:text-primary transition-colors">{product.Codes}</p>
        <p className="text-[10px] text-gray-text font-pop">{product.Category}</p>
        <div className="flex flex-wrap gap-1 mt-1">
          {product.Wattage && <span className="text-[9px] font-pop px-1.5 py-0.5 bg-gray border border-gray-mid rounded text-gray-text">{product.Wattage}</span>}
          {product.ColourTemp && <span className="text-[9px] font-pop px-1.5 py-0.5 bg-gray border border-gray-mid rounded text-gray-text">{product.ColourTemp}</span>}
          {product.Finish && <span className="text-[9px] font-pop px-1.5 py-0.5 bg-gray border border-gray-mid rounded text-gray-text">{product.Finish}</span>}
        </div>
        {product.Description && (
          <p className="text-[10px] text-gray-dark font-pop mt-1 leading-snug line-clamp-2">{product.Description}</p>
        )}
      </div>

      {/* Quick-add */}
      {can('cart') && (
        <div className="px-3 pb-3">
          <div
            role="button"
            tabIndex={0}
            onClick={handleQuickAdd}
            onKeyDown={e => e.key === 'Enter' && handleQuickAdd(e as unknown as React.MouseEvent)}
            className="w-full py-1.5 bg-primary/8 hover:bg-primary text-primary hover:text-white rounded-lg text-xs font-bold font-bai transition-all text-center"
          >
            + Add to Quote
          </div>
        </div>
      )}
    </button>
  )
}
