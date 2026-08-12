'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import type { Product, ProductFormData } from '@/types'

const PAGE_SIZE = 20

export interface ProductQueryFilters {
  search?: string
  category?: string
  source?: string
  zone?: string // overrides the hook's own `zone` arg for a single fetch (used by the "All Zones" zone-filter dropdown)
  collection?: string
  groupName?: string
  productType?: string
}

export function useProducts(zone?: string) {
  const [products, setProducts]       = useState<Product[]>([])
  const [loading, setLoading]         = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore]         = useState(false)
  const [categories, setCategories]   = useState<string[]>([])

  const offsetRef  = useRef(0)
  const filtersRef = useRef<ProductQueryFilters>({})

  const buildParams = useCallback((filters: ProductQueryFilters | undefined, offset: number) => {
    const params = new URLSearchParams()
    const effectiveZone = filters?.zone ?? zone
    if (effectiveZone)        params.set('zone',        effectiveZone)
    if (filters?.search)      params.set('search',      filters.search)
    if (filters?.category)    params.set('category',    filters.category)
    if (filters?.source)      params.set('source',      filters.source)
    if (filters?.collection)  params.set('collection',  filters.collection)
    if (filters?.groupName)   params.set('groupName',   filters.groupName)
    if (filters?.productType) params.set('productType', filters.productType)
    params.set('limit', String(PAGE_SIZE))
    params.set('offset', String(offset))
    return params
  }, [zone])

  const fetchProducts = useCallback(async (filters?: ProductQueryFilters) => {
    setLoading(true)
    filtersRef.current = filters ?? {}
    try {
      const res = await fetch(`/api/products?${buildParams(filters, 0)}`)
      if (!res.ok) throw new Error('Failed to fetch products')
      const json = await res.json()
      const items: Product[] = json.data ?? []
      setProducts(items)
      setHasMore(!!json.hasMore)
      offsetRef.current = items.length
    } catch (err) {
      console.error('[useProducts] fetchProducts error:', err)
      setProducts([])
      setHasMore(false)
      offsetRef.current = 0
    } finally {
      setLoading(false)
    }
  }, [buildParams])

  const loadMore = useCallback(() => {
    if (loading || loadingMore || !hasMore) return
    setLoadingMore(true)
    fetch(`/api/products?${buildParams(filtersRef.current, offsetRef.current)}`)
      .then(res => { if (!res.ok) throw new Error('Failed to fetch products'); return res.json() })
      .then(json => {
        const items: Product[] = json.data ?? []
        setProducts(prev => [...prev, ...items])
        setHasMore(!!json.hasMore)
        offsetRef.current += items.length
      })
      .catch(err => console.error('[useProducts] loadMore error:', err))
      .finally(() => setLoadingMore(false))
  }, [buildParams, loading, loadingMore, hasMore])

  const fetchCategories = useCallback(async () => {
    try {
      const url = zone ? `/api/categories?zone=${zone}` : '/api/categories'
      const res = await fetch(url)
      if (!res.ok) return
      const cats = await res.json()
      setCategories(Array.isArray(cats) ? cats : [])
    } catch (err) {
      console.error('[useProducts] fetchCategories error:', err)
    }
  }, [zone])

  const createProduct = useCallback(async (data: ProductFormData): Promise<Product> => {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Use zone from data (set by CrudModal) — NOT the hook's zone param
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error(await res.text())
    const product = await res.json()
    setProducts(prev => [product, ...prev])
    offsetRef.current += 1
    setCategories(prev => prev.includes(product.Category) ? prev : [...prev, product.Category])
    return product
  }, [])

  const updateProduct = useCallback(async (id: string, data: Partial<ProductFormData>): Promise<Product> => {
    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error(await res.text())
    const updated = await res.json()
    setProducts(prev => prev.map(p => p.id === id ? updated : p))
    return updated
  }, [])

  const deleteProduct = useCallback(async (id: string) => {
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error(await res.text())
    setProducts(prev => prev.filter(p => p.id !== id))
    offsetRef.current = Math.max(0, offsetRef.current - 1)
  }, [])

  const syncExternal = useCallback(async (url: string) => {
    const res = await fetch(url)
    const json = await res.json()
    const records = Array.isArray(json) ? json : json.data || json.products || []
    const syncRes = await fetch('/api/products/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ records, zone }),
    })
    if (!syncRes.ok) throw new Error('Sync failed')
    const result = await syncRes.json()
    await fetchProducts(filtersRef.current)
    return result
  }, [zone, fetchProducts])

  // Product fetching (incl. the initial load) is driven by the caller via
  // fetchProducts(filters) — CatalogPage's filter-effect covers mount too.
  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  return {
    products, loading, loadingMore, hasMore, loadMore,
    categories, fetchProducts, createProduct, updateProduct, deleteProduct, syncExternal,
  }
}
