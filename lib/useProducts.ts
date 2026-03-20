'use client'

import { useState, useCallback, useEffect } from 'react'
import type { Product, ProductFormData } from '@/types'

export function useProducts(zone?: string) {
  const [products, setProducts]     = useState<Product[]>([])
  const [loading, setLoading]       = useState(false)
  const [categories, setCategories] = useState<string[]>([])

  const fetchProducts = useCallback(async (filters?: { search?: string; category?: string; source?: string }) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (zone)              params.set('zone',     zone)
      if (filters?.search)   params.set('search',   filters.search)
      if (filters?.category) params.set('category', filters.category)
      if (filters?.source)   params.set('source',   filters.source)
      const res = await fetch(`/api/products?${params}`)
      if (!res.ok) throw new Error('Failed to fetch products')
      const json = await res.json()
      setProducts(json.data ?? [])
    } catch (err) {
      console.error('[useProducts] fetchProducts error:', err)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [zone])

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
    await fetchProducts()
    return result
  }, [zone, fetchProducts])

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [fetchProducts, fetchCategories])

  return { products, loading, categories, fetchProducts, createProduct, updateProduct, deleteProduct, syncExternal }
}