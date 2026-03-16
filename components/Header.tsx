'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import LedlumLogo from './LedlumLogo'
import VendorManager from './VendorManager'
import { getZoneById } from '@/lib/zones'

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
  const searchParams                   = useSearchParams()
  const activeZone                     = searchParams.get('zone') || ''
  const zone                           = getZoneById(activeZone)
  const [vendorOpen, setVendorOpen]    = useState(false)

  if (!user) return null

  return (
    <>
      <header className="bg-white border-b border-gray h-16 flex items-center justify-between px-8 sticky top-0 z-40">

        {/* Left: Logo + zone breadcrumb */}
        <div className="flex items-center gap-3">
          <LedlumLogo className="h-8 w-auto" />
          {zone && (
            <>
              <span className="text-gray-mid font-bai text-lg select-none">/</span>
              <span className="text-sm font-semibold font-bai text-foreground">{zone.label}</span>
            </>
          )}
        </div>

        {/* Right: actions + user */}
        <div className="flex items-center gap-3">

          <span className="text-xs text-gray-dark font-pop hidden sm:block">{productCount} products</span>

          {/* Vendor Management — admin only */}
          {user.role === 'admin' && (
            <button
              onClick={() => setVendorOpen(true)}
              className="flex items-center gap-1.5 border border-gray rounded-lg px-3.5 py-2 text-sm font-semibold font-bai text-gray-text hover:border-primary hover:text-primary transition-colors"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <span className="hidden sm:inline">Vendors</span>
            </button>
          )}

          {/* Cart / Quote button — vendor only */}
          {can('cart') && (
            <button
              onClick={openCart}
              className={`relative flex items-center gap-2 border rounded-lg px-3.5 py-2 group ${
                isPulsing
                  ? 'border-primary bg-primary/5 scale-110 shadow-md'
                  : 'border-gray hover:border-primary'
              }`}
              style={{ transition: isPulsing ? 'all 0.15s ease' : 'all 0.3s ease' }}
            >
              <svg
                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                className={`transition-colors ${isPulsing ? 'text-primary' : 'text-gray-text group-hover:text-primary'}`}
              >
                <circle cx="9" cy="21" r="1"/>
                <circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              <span className={`text-sm font-semibold font-bai hidden sm:inline transition-colors ${
                isPulsing ? 'text-primary' : 'text-gray-text group-hover:text-primary'
              }`}>
                Quote
              </span>
              {total > 0 && (
                <span className={`absolute -top-1.5 -right-1.5 w-5 h-5 text-white text-[10px] font-bold font-bai rounded-full flex items-center justify-center transition-all ${
                  isPulsing ? 'bg-primary scale-125' : 'bg-primary'
                }`}>
                  {total > 99 ? '99+' : total}
                </span>
              )}
            </button>
          )}

          {/* User chip */}
          <div className="flex items-center gap-2 border border-gray rounded-full px-3 py-1.5">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold font-bai ${AVATAR_STYLES[user.role] ?? 'bg-primary text-white'}`}>
              {user.initials}
            </div>
            <div className="hidden sm:block">
              <span className="text-sm font-semibold font-bai text-foreground">{user.name}</span>
              {user.company && (
                <span className="text-[10px] text-gray-dark font-pop ml-1.5">· {user.company}</span>
              )}
            </div>
            <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide font-pop ${ROLE_STYLES[user.role] ?? ROLE_STYLES.viewer}`}>
              {user.role}
            </span>
          </div>

          {/* Sign out */}
          <button
            onClick={logout}
            title="Sign out"
            className="text-sm font-semibold text-gray-text hover:text-primary font-pop transition-colors flex items-center gap-1.5 border border-gray rounded-lg px-3 py-1.5"
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

      <VendorManager isOpen={vendorOpen} onClose={() => setVendorOpen(false)} />
    </>
  )
}
