'use client'

import { useState, useCallback, useEffect } from 'react'
import type { Product, ProductFormData } from '@/types'
import { dataStore } from './data'

export function useProducts(zone?: string) {
  const [products, setProducts]     = useState<Product[]>([])
  const [loading, setLoading]       = useState(false)
  const [categories, setCategories] = useState<string[]>([])

  const fetchProducts = useCallback(async (filters?: { search?: string; category?: string; source?: string }) => {
    setLoading(true)
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 100))
      const data = dataStore.getProducts(zone, filters)
      setProducts(data)
    } finally {
      setLoading(false)
    }
  }, [zone])

  const fetchCategories = useCallback(async () => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 50))
    const cats = dataStore.getCategories(zone)
    setCategories(cats)
  }, [zone])

  const createProduct = useCallback(async (data: ProductFormData): Promise<Product> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200))
    const product = dataStore.createProduct({ ...data, source: 'internal', zone: zone || 'zone-a' })
    setProducts(prev => [product, ...prev])
    setCategories(prev => prev.includes(product.Category) ? prev : [...prev, product.Category])
    return product
  }, [zone])

  const updateProduct = useCallback(async (id: string, data: Partial<ProductFormData>): Promise<Product> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200))
    const updated = dataStore.updateProduct(id, data)
    setProducts(prev => prev.map(p => p.id === id ? updated : p))
    return updated
  }, [])

  const deleteProduct = useCallback(async (id: string) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200))
    dataStore.deleteProduct(id)
    setProducts(prev => prev.filter(p => p.id !== id))
  }, [])

  const syncExternal = useCallback(async (url: string) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    const res = await fetch(url)
    const json = await res.json()
    const records = Array.isArray(json) ? json : json.data || json.products || []
    
    // For now, just log the sync request
    console.log('Sync request received:', { records, zone })
    await fetchProducts()
    return { success: true, imported: records.length, added: records.length, updated: 0 }
  }, [zone, fetchProducts])

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [fetchProducts, fetchCategories])

  return { products, loading, categories, fetchProducts, createProduct, updateProduct, deleteProduct, syncExternal }
}
