'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import LedlumLogo from './LedlumLogo'
import CartDrawer from './CartDrawer'

interface Props {
  onChooseZone: () => void
  onChooseProduct: () => void
}

export default function BrowseChooser({ onChooseZone, onChooseProduct }: Props) {
  const { user, logout, can } = useAuth()
  const { total, openCart, isPulsing } = useCart()
  const zoneRef = useRef<HTMLButtonElement>(null)

  useEffect(() => { zoneRef.current?.focus() }, [])

  return (
    <div className="min-h-screen app-shell font-bai">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <div className="glass-panel sticky top-4 z-40 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/80 px-4 py-3 shadow-card sm:px-5">
          <LedlumLogo className="h-8 w-auto" />

          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            {can('cart') && (
              <button
                onClick={openCart}
                className={`tap-target relative flex items-center gap-2 rounded-xl border bg-white/80 px-3.5 py-2 group ${
                  isPulsing
                    ? 'border-primary scale-110 shadow-md'
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
                <span className={`hidden text-sm font-bold transition-colors sm:inline ${
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

            {user && (
              <div className="flex min-w-0 items-center gap-2 rounded-full border border-gray-mid bg-white/80 px-2.5 py-1.5 sm:px-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-extrabold text-white shadow-sm">
                  {user.initials}
                </div>
                <span className="hidden max-w-[8rem] truncate text-sm font-bold text-foreground sm:block">{user.name}</span>
                {user.company && (
                  <span className="hidden max-w-[10rem] truncate text-[10px] text-gray-dark font-pop md:block">{user.company}</span>
                )}
              </div>
            )}

            <button
              onClick={logout}
              title="Sign out"
              className="tap-target flex items-center gap-1.5 rounded-xl border border-gray-mid bg-white/80 px-3 py-2 text-sm font-bold text-gray-text transition-colors hover:border-primary hover:text-primary sm:px-4"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>

        <main className="items-center gap-8 py-8 lg:grid-cols-[0.9fr_1.1fr] lg:py-12 space-y-8">
          <section className="w-full flex justify-end ">
            <div className="w-full ">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/70 px-3 py-1.5 text-xs font-bold uppercase text-primary">
              {user?.role ?? 'catalog'} workspace
            </div>
            <h1 className="text-3xl font-extrabold leading-tight text-foreground sm:text-4xl lg:text-5xl">
              Welcome{user?.company ? `, ${user.company}` : ''}
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-6 text-gray-text font-pop sm:text-base">
              Browse the LEDLUM catalogue by project zone or product type, then configure products and build quotes from one workspace.
            </p>
            </div>
            <div className="w-full flex justify-end">
            <div className="grid grid-cols-1 gap-3 w-full max-w-xs">
              {[
                ['15+', 'Zones'],
                ['8', 'Categories'],
                [can('cart') ? String(total) : 'Live', can('cart') ? 'Quote items' : 'Catalog'],
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl flex items-center justify-between border border-white/80 bg-white/70 px-4 py-3 shadow-card">
                  <div className="text-lg font-extrabold text-foreground">{value}</div>
                  <div className="text-[11px] font-semibold uppercase text-primary">{label}</div>
                </div>
              ))}
            </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* <button
              ref={zoneRef}
              onClick={onChooseZone}
              className="group relative min-h-[22rem] overflow-hidden rounded-2xl border border-white/80 bg-white p-6 text-left shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-card-hover focus:outline-none focus:ring-4 focus:ring-primary/15 sm:p-7"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-primary transition-transform duration-300 group-hover:scale-x-100" />
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 transition-transform duration-500 group-hover:scale-125" />
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 p-3 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </div>
              <h2 className="mb-2 flex items-center justify-between text-xl font-extrabold text-foreground transition-colors group-hover:text-primary">
                <span>Browse by Zone</span>
                <span>
                  <svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="2"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M4 12H20M20 12L16 8M20 12L16 16" stroke="#9a8c66" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>
                </span>
              </h2>
              <p className="mb-6 text-sm leading-relaxed text-gray-text font-pop">
                Explore products assigned to project areas and room contexts.
              </p>
              <div className="mb-5 flex items-center gap-1.5 text-sm font-extrabold text-primary">
                Select zone
                <svg width="13" height="13" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {['Zone A', 'Zone B', 'Zone C', 'Artizan', '+9 more'].map(z => (
                  <span key={z} className="rounded-full border border-gray-mid bg-gray px-2.5 py-1 text-[10px] font-bold text-gray-text font-pop">
                    {z}
                  </span>
                ))}
              </div>
            </button> */}

            <button
              onClick={onChooseProduct}
              className="group relative min-h-[22rem] overflow-hidden rounded-2xl border border-white/80 bg-foreground p-6 text-left text-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-card-hover focus:outline-none focus:ring-4 focus:ring-primary/15 sm:p-7"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-primary transition-transform duration-300 group-hover:scale-x-100" />
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 transition-transform duration-500 group-hover:scale-125" />
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 p-3 text-secondary transition-colors group-hover:bg-primary group-hover:text-white">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="2" y="3" width="7" height="7" rx="1"/>
                  <rect x="15" y="3" width="7" height="7" rx="1"/>
                  <rect x="2" y="14" width="7" height="7" rx="1"/>
                  <rect x="15" y="14" width="7" height="7" rx="1"/>
                </svg>
              </div>
              <h2 className="mb-2 flex justify-between items-center gap-2 text-xl font-extrabold text-white transition-colors group-hover:text-secondary">
                <span>Browse by Product Type</span>
                <svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M4 12H20M20 12L16 8M20 12L16 16" stroke="#9a8c66" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>
              </h2>
              <p className="mb-6 text-sm leading-relaxed text-white/70 font-pop">
                Navigate the catalogue by category, subcategory and configuration type.
              </p>
              <div className="mb-5 flex items-center gap-1.5 text-sm font-extrabold text-secondary">
                Explore catalogue
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {['Indoor', 'Outdoor', 'Architectural', 'Smart', '+4 more'].map(c => (
                  <span key={c} className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-bold text-white/70 font-pop">
                    {c}
                  </span>
                ))}
              </div>
            </button>
          </section>
        </main>
      </div>
      <CartDrawer />
    </div>
  )
}
