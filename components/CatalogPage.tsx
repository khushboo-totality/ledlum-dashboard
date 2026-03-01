'use client'

import { useState, useMemo, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import type { Product, ProductFormData } from '@/types'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { useProducts } from '@/lib/useProducts'
import { getZoneById } from '@/lib/zones'
import { getProductDetail } from '@/lib/productDetails'
import Header from '@/components/Header'
import ZoneNav from '@/components/ZoneNav'
import Toolbar from '@/components/Toolbar'
import ProductCard from '@/components/ProductCard'
import ProductRow from '@/components/ProductRow'
import ProductDetail from '@/components/ProductDetail'
import CrudModal from '@/components/CrudModal'
import CartDrawer from '@/components/CartDrawer'
import ToastContainer from '@/components/ToastContainer'
import VendorManager from './VendorManager'

type View = 'grid' | 'list'

export default function CatalogPage() {
  const { can, user }  = useAuth()
  const { toast }      = useToast()
  const searchParams   = useSearchParams()
  const activeZone     = searchParams.get('zone') || ''
  const zone           = getZoneById(activeZone)

  const { products, categories, createProduct, updateProduct, deleteProduct, syncExternal } =
    useProducts(activeZone || undefined)

  const [search, setSearch]     = useState('')
  const [category, setCategory] = useState('')
  const [source, setSource]     = useState('')
  const [view, setView]         = useState<View>('grid')

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [modalMode, setModalMode]             = useState<'create' | 'edit' | null>(null)
  const [editingProduct, setEditingProduct]   = useState<Product | null>(null)
  const [vendorOpen, setVendorOpen] = useState(false)

  const filtered = useMemo(() => {
    let list = [...products]
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(p => p.Codes.toLowerCase().includes(q) || p.Category.toLowerCase().includes(q))
    }
    if (category) list = list.filter(p => p.Category === category)
    if (source)   list = list.filter(p => p.source === source)
    return list
  }, [products, search, category, source])

  const openEdit = useCallback((product: Product) => {
    if (!can('edit')) { toast('Permission denied', 'error'); return }
    setEditingProduct(product)
    setModalMode('edit')
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
    } catch {
      toast('Sync failed — check the URL', 'error')
    }
  }, [syncExternal, toast])

  return (
    <>
      <Header productCount={filtered.length} />
      <ZoneNav />
      {/* <StatsStrip /> — disabled, re-enable by importing StatsStrip */}

      <Toolbar
        search={search}     onSearch={setSearch}
        category={category} onCategory={setCategory}
        source={source}     onSource={setSource}
        categories={categories}
        view={view}         onView={setView}
        onAdd={() => setModalMode('create')}
        onSync={handleSync}
        onVendorOpen={() => setVendorOpen(true)}
      />

      {/* Role banners */}
      {can('cart') && (
        <div className="mx-8 mt-5 flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-600 flex-shrink-0">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
          <p className="text-sm text-amber-700 font-pop">
            Welcome, <strong className="font-semibold">{user?.company ?? user?.name}</strong>. Click any product to configure and add to your quote.
          </p>
        </div>
      )}

      {!can('create') && !can('edit') && !can('delete') && !can('cart') && (
        <div className="mx-8 mt-5 flex items-center gap-2.5 bg-gray border border-gray-mid rounded-lg px-4 py-3 text-sm text-gray-text font-pop">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
            <rect x="3" y="11" width="18" height="11" rx="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          You have <strong className="mx-1 font-semibold">view-only</strong> access. Contact an admin to make changes.
        </div>
      )}

      <main className="px-8 py-6 pb-24">
        {zone && (
          <div className="mb-5 flex items-center gap-3">
            <div className="w-1 h-6 bg-primary rounded-full" />
            <h2 className="text-lg font-bold font-bai text-foreground">{zone.label}</h2>
            <span className="text-xs text-gray-dark font-pop bg-gray px-2.5 py-1 rounded-full border border-gray-mid">
              {filtered.length} products
            </span>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="text-center py-24">
            <svg className="opacity-10 mx-auto mb-4" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <p className="text-gray-dark font-bai">
              {activeZone ? `No products in ${zone?.label ?? activeZone}` : 'No products found'}
            </p>
          </div>
        ) : view === 'grid' ? (
          <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
            {filtered.map((p, i) => (
              <ProductCard
                key={p.id}
                product={p}
                index={i}
                onClick={() => setSelectedProduct(p)}
                onEdit={() => openEdit(p)}
                onDelete={() => handleDelete(p)}
                hasDetail={!!getProductDetail(p.Codes)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((p, i) => (
              <ProductRow
                key={p.id}
                product={p}
                index={i}
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
      />

      <CrudModal
        mode={modalMode}
        product={editingProduct}
        onSubmit={handleSubmit}
        onClose={() => { setModalMode(null); setEditingProduct(null) }}
        currentZone={activeZone}
      />

      <CartDrawer />
      <ToastContainer />

      <VendorManager
        isOpen={vendorOpen}
        onClose={() => setVendorOpen(false)}
      />
    </>
  )
}
