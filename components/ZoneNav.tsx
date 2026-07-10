'use client'

import { useRouter, usePathname } from 'next/navigation'
import { ZONES, getZoneByPath, getZonePath } from '@/lib/zones'
import LedlumLogo from './LedlumLogo'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { AVATAR_STYLES, ROLE_STYLES } from './ZoneChooser'

export default function ZoneNav() {
  const router   = useRouter()
  const pathname = usePathname()
  const { user, logout, can } = useAuth()
  const { total, openCart, isPulsing } = useCart()

  const segments   = pathname.split('/').filter(Boolean)
  const activeZone = segments[0] === 'zone' && segments[1]
    ? (getZoneByPath(segments[1])?.id ?? '')
    : ''

  const navigate = (zoneId: string) => {
    router.push(zoneId ? `/zone/${getZonePath(zoneId)}` : '/zone')
  }

  return (
    <>
      <header className="glass-panel sticky top-0 z-40 flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-white/80 px-4 py-3 shadow-header sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <LedlumLogo className="h-8 w-auto" />
          <div className="hidden h-8 w-px bg-gray-mid sm:block" />
          <div className="hidden sm:block">
            <p className="text-sm font-extrabold text-foreground">Zone dashboard</p>
            <p className="text-[11px] font-pop text-gray-dark">{activeZone ? 'Focused zone view' : 'All zones'}</p>
          </div>
        </div>

        <div className="flex min-w-0 flex-wrap items-center justify-end gap-2 sm:gap-3">
          {user ? (
            <>
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
              {/* <button
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
              </button> */}
            </>
          ) : (
            <button
              onClick={() => router.push('/')}
              className="tap-target flex items-center gap-1.5 rounded-xl border border-primary/30 bg-white/80 px-3 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
            >
              Sign in
            </button>
          )}
        </div>
      </header>

      <div className="sticky top-[88px] z-30 border-b border-white/80 bg-white/85 px-4 backdrop-blur sm:top-16 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 overflow-x-auto py-3 scrollbar-hide">
          <button
            onClick={() => navigate('')}
            className={`flex-shrink-0 rounded-full border px-4 py-2 text-sm font-semibold font-bai transition-all whitespace-nowrap ${
              !activeZone
                ? 'border-primary bg-primary text-white shadow-sm'
                : 'border-gray-mid bg-white text-gray-text hover:border-primary hover:text-primary'
            }`}
          >
            All Zones
          </button>

          {ZONES.map(zone => (
            <button
              key={zone.id}
              onClick={() => navigate(zone.id)}
              className={`flex-shrink-0 rounded-full border px-4 py-2 text-sm font-semibold font-bai transition-all whitespace-nowrap ${
                activeZone === zone.id
                  ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/10'
                  : 'border-gray-mid bg-white text-gray-text hover:border-primary hover:text-primary'
              }`}
            >
              {zone.label}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
