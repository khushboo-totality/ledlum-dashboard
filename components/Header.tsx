'use client'

import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import LedlumLogo from './LedlumLogo'
import { getZoneById } from '@/lib/zones'

const ROLE_STYLES: Record<string, string> = {
  admin:  'bg-primary/10 text-primary border border-primary/20',
  editor: 'bg-blue-50 text-blue-700 border border-blue-200',
  viewer: 'bg-gray/80 text-gray-text border border-gray-mid',
  guest:  'bg-gray/80 text-gray-text border border-gray-mid',
}

const AVATAR_STYLES: Record<string, string> = {
  admin:  'bg-primary text-white',
  editor: 'bg-blue-600 text-white',
  viewer: 'bg-gray-dark text-white',
  guest:  'bg-gray-dark text-white',
}

export default function Header({ productCount }: { productCount: number }) {
  const { user, logout, can } = useAuth()
  const { total, openCart, isPulsing } = useCart()
  const searchParams = useSearchParams()
  const activeZone = searchParams.get('zone') || ''
  const zone = getZoneById(activeZone)

  if (!user) return null

  return (
    <header className="bg-white border-b border-gray h-16 flex items-center justify-between px-8 sticky top-0 z-40">

      {/* Left */}
      <div className="flex items-center gap-3">
        <LedlumLogo className="h-8 w-auto" />
        {zone && (
          <>
            <span className="text-gray-mid font-bai text-lg select-none">/</span>
            <span className="text-sm font-semibold font-bai text-foreground">{zone.label}</span>
          </>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">

        <span className="text-xs text-gray-dark font-pop hidden sm:block">
          {productCount} products
        </span>

        {/* Cart */}
        {can('cart') && (
          <button
            onClick={openCart}
            className={`relative flex items-center gap-2 border rounded-lg px-3.5 py-2 group ${
              isPulsing
                ? 'border-primary bg-primary/5 scale-110 shadow-md'
                : 'border-gray hover:border-primary'
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              className={`transition-colors ${isPulsing ? 'text-primary' : 'text-gray-text group-hover:text-primary'}`}>
              <circle cx="9" cy="21" r="1"/>
              <circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>

            {total > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 text-white text-[10px] font-bold font-bai rounded-full flex items-center justify-center bg-primary">
                {total > 99 ? '99+' : total}
              </span>
            )}
          </button>
        )}

        {/* User */}
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

        {/* Sign Out */}
        <button
          onClick={logout}
          className="text-sm font-semibold text-gray-text hover:text-primary font-pop transition-colors flex items-center gap-1.5 border border-gray rounded-lg px-3 py-1.5"
        >
          Sign out
        </button>

      </div>
    </header>
  )
}