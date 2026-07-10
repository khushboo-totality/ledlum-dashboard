'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import LedlumLogo from './LedlumLogo'
import VendorManager from './VendorManager'

const ROLE_STYLES: Record<string, string> = {
  admin:  'bg-primary/10 text-primary border border-primary/20',
  editor: 'bg-blue-50 text-blue-700 border border-blue-200',
  viewer: 'bg-gray/80 text-gray-text border border-gray-mid',
  guest:  'bg-gray/80 text-gray-text border border-gray-mid',
  vendor: 'bg-amber-50 text-amber-700 border border-amber-200',
}

const AVATAR_STYLES: Record<string, string> = {
  admin:  'bg-primary text-white',
  editor: 'bg-blue-600 text-white',
  viewer: 'bg-gray-dark text-white',
  guest:  'bg-gray-dark text-white',
  vendor: 'bg-amber-500 text-white',
}

export default function Header({ productCount }: { productCount: number }) {
  const { user, logout, can }          = useAuth()
  const { total, openCart, isPulsing } = useCart()
  // const [vendorOpen, setVendorOpen]    = useState(false)

  if (!user) return null

  return (
    <>
      <header className="glass-panel sticky top-0 z-40 flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-white/80 px-4 py-3 shadow-header sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <LedlumLogo className="h-8 w-auto" />
          <div className="hidden h-8 w-px bg-gray-mid sm:block" />
          <div className="hidden sm:block">
            <p className="text-sm font-extrabold text-foreground">Product dashboard</p>
            <p className="text-[11px] font-pop text-gray-dark">{productCount} products available</p>
          </div>
        </div>

        <div className="flex min-w-0 flex-wrap items-center justify-end gap-2 sm:gap-3">
          {/* {user.role === 'admin' && (
            <button
              onClick={() => setVendorOpen(true)}
              className="tap-target flex items-center gap-1.5 rounded-xl border border-gray-mid bg-white/80 px-3.5 py-2 text-sm font-semibold text-gray-text transition-colors hover:border-primary hover:text-primary"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <span className="hidden sm:inline">Vendors</span>
            </button>
          )} */}

          {can('cart') && (
            <button
              onClick={openCart}
              className={`tap-target relative flex items-center gap-2 rounded-xl border bg-white/80 px-3.5 py-2 group ${
                isPulsing
                  ? 'border-primary bg-primary/5 scale-110 shadow-md'
                  : 'border-gray-mid hover:border-primary hover:bg-primary/5'
              }`}
              style={{ transition: isPulsing ? 'all 0.15s ease' : 'all 0.3s ease' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                className={`transition-colors ${isPulsing ? 'text-primary' : 'text-gray-text group-hover:text-primary'}`}>
                <circle cx="9" cy="21" r="1"/>
                <circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              <span className={`hidden text-sm font-semibold font-bai transition-colors sm:inline ${
                isPulsing ? 'text-primary' : 'text-gray-text group-hover:text-primary'
              }`}>
                Quote
              </span>
              {total > 0 && (
                <span className={`absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white transition-all ${
                  isPulsing ? 'scale-125' : ''
                }`}>
                  {total > 99 ? '99+' : total}
                </span>
              )}
            </button>
          )}

          <div className="flex min-w-0 items-center gap-2 rounded-full border border-gray-mid bg-white/80 px-2.5 py-1.5 sm:px-3">
            <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold font-bai ${AVATAR_STYLES[user.role] ?? 'bg-primary text-white'}`}>
              {user.initials}
            </div>
            <div className="hidden sm:block">
              <span className="block max-w-[9rem] truncate text-sm font-semibold font-bai text-foreground">{user.name}</span>
              {user.company && (
                <span className="block max-w-[10rem] truncate text-[10px] text-gray-dark font-pop">{user.company}</span>
              )}
            </div>
            <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full uppercase font-pop ${ROLE_STYLES[user.role] ?? ROLE_STYLES.viewer}`}>
              {user.role}
            </span>
          </div>

          <button
            onClick={logout}
            title="Sign out"
            className="tap-target flex items-center gap-1.5 rounded-xl border border-gray-mid bg-white/80 px-3 py-2 text-sm font-semibold text-gray-text transition-colors hover:border-primary hover:text-primary"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>

      {/* <VendorManager isOpen={vendorOpen} onClose={() => setVendorOpen(false)} /> */}
    </>
  )
}
