'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { CartItem } from '@/types'

interface CartContextType {
  items: CartItem[]
  isOpen: boolean
  isPulsing: boolean          // ← triggers bounce animation on cart icon
  addItem: (item: Omit<CartItem, 'id' | 'addedAt'>) => void
  removeItem: (id: string) => void
  updateQty: (id: string, qty: number) => void
  clearCart: () => void
  openCart: () => void
  closeCart: () => void
  total: number
}

const CartContext = createContext<CartContextType | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems]       = useState<CartItem[]>([])
  const [isOpen, setIsOpen]     = useState(false)
  const [isPulsing, setIsPulsing] = useState(false)

  const triggerPulse = useCallback(() => {
    setIsPulsing(true)
    setTimeout(() => setIsPulsing(false), 700)
  }, [])

  const addItem = useCallback((item: Omit<CartItem, 'id' | 'addedAt'>) => {
    setItems(prev => {
      const selStr   = JSON.stringify(item.selection)
      const existing = prev.find(
        i => i.productCode === item.productCode && JSON.stringify(i.selection) === selStr
      )
      if (existing) {
        return prev.map(i => i.id === existing.id ? { ...i, quantity: i.quantity + item.quantity } : i)
      }
      return [...prev, { ...item, id: uuidv4(), addedAt: new Date().toISOString() }]
    })
    // Pulse the icon — do NOT open the drawer
    triggerPulse()
  }, [triggerPulse])

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id))
  }, [])

  const updateQty = useCallback((id: string, qty: number) => {
    if (qty <= 0) { setItems(prev => prev.filter(i => i.id !== id)); return }
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i))
  }, [])

  const clearCart = useCallback(() => setItems([]), [])
  const openCart  = useCallback(() => setIsOpen(true),  [])
  const closeCart = useCallback(() => setIsOpen(false), [])

  const total = items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <CartContext.Provider value={{ items, isOpen, isPulsing, addItem, removeItem, updateQty, clearCart, openCart, closeCart, total }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be inside CartProvider')
  return ctx
}
