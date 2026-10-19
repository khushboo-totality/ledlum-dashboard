'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { CartItem } from '@/types'
import { trackActivity } from '@/lib/supabaseClient'
import { OPTION_KEY } from '@/lib/productOptions'

/** Selection identity regardless of key order. */
const selectionKey = (s: Record<string, string>) =>
  JSON.stringify(Object.entries(s).filter(([, v]) => v).sort(([a], [b]) => a.localeCompare(b)))

interface CartContextType {
  items: CartItem[]
  isOpen: boolean
  isPulsing: boolean
  addItem: (item: Omit<CartItem, 'id' | 'addedAt'>) => void
  removeItem: (id: string) => void
  updateQty: (id: string, qty: number) => void
  /** Sets a line's discount in percent (clamped to 0–100). */
  updateDiscount: (id: string, percent: number) => void
  /** Picks (or, with '', clears) one choice on a line — the price option also sets its price. */
  updateSelection: (id: string, key: string, value: string) => void
  clearCart: () => void
  openCart: () => void
  closeCart: () => void
  total: number
}

const CartContext = createContext<CartContextType | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems]           = useState<CartItem[]>([])
  const [isOpen, setIsOpen]         = useState(false)
  const [isPulsing, setIsPulsing]   = useState(false)

  const triggerPulse = useCallback(() => {
    setIsPulsing(true)
    setTimeout(() => setIsPulsing(false), 700)
  }, [])

  const addItem = useCallback((item: Omit<CartItem, 'id' | 'addedAt'>) => {
    setItems(prev => {
      const selStr   = selectionKey(item.selection)
      const existing = prev.find(
        i => i.productCode === item.productCode && selectionKey(i.selection) === selStr
      )
      if (existing) {
        return prev.map(i =>
          i.id === existing.id ? { ...i, quantity: i.quantity + item.quantity } : i
        )
      }
      return [...prev, { ...item, id: uuidv4(), addedAt: new Date().toISOString() }]
    })
    triggerPulse()
    trackActivity('quote_item_added', {
      productCode: item.productCode, quantity: item.quantity, selection: item.selection,
    })
  }, [triggerPulse])

  const removeItem = useCallback((id: string) => {
    const removed = items.find(i => i.id === id)
    if (removed) trackActivity('quote_item_removed', { productCode: removed.productCode, quantity: removed.quantity })
    setItems(prev => prev.filter(i => i.id !== id))
  }, [items])

  const updateQty = useCallback((id: string, qty: number) => {
    if (qty <= 0) { setItems(prev => prev.filter(i => i.id !== id)); return }
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i))
  }, [])

  const updateDiscount = useCallback((id: string, percent: number) => {
    const pct = Number.isFinite(percent) ? Math.min(100, Math.max(0, percent)) : 0
    setItems(prev => prev.map(i => i.id === id ? { ...i, discount: pct } : i))
  }, [])

  const updateSelection = useCallback((id: string, key: string, value: string) => {
    setItems(prev => {
      const item = prev.find(i => i.id === id)
      if (!item) return prev
      const selection = { ...item.selection, [key]: value }
      if (!value) delete selection[key]
      const updated = {
        ...item,
        selection,
        ...(key === OPTION_KEY && item.options
          ? { unitPrice: item.options.prices.find(o => o.key === value)?.price ?? null }
          : {}),
      }
      // Now identical to another line (same product + same picks)? Merge into that one.
      const twin = prev.find(i => i.id !== id && i.productCode === item.productCode && selectionKey(i.selection) === selectionKey(selection))
      if (twin) {
        return prev
          .filter(i => i.id !== id)
          .map(i => (i.id === twin.id ? { ...i, quantity: i.quantity + item.quantity } : i))
      }
      return prev.map(i => (i.id === id ? updated : i))
    })
  }, [])

  const clearCart = useCallback(() => setItems([]), [])
  const openCart  = useCallback(() => setIsOpen(true),  [])
  const closeCart = useCallback(() => setIsOpen(false), [])

  const total = items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <CartContext.Provider value={{ items, isOpen, isPulsing, addItem, removeItem, updateQty, updateDiscount, updateSelection, clearCart, openCart, closeCart, total }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be inside CartProvider')
  return ctx
}
