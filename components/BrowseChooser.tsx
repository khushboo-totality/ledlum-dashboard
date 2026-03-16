'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import LedlumLogo from './LedlumLogo'

interface Props {
  onChooseZone: () => void
  onChooseProduct: () => void
}

export default function BrowseChooser({ onChooseZone, onChooseProduct }: Props) {
  const { user, logout } = useAuth()
  const zoneRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    zoneRef.current?.focus()
  }, [])

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-gray">
        <LedlumLogo className="h-8 w-auto" />
        <div className="flex items-center gap-3">
          {user && (
            <div className="flex items-center gap-2 border border-gray rounded-full px-3 py-1.5">
              <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-[10px] font-bold font-bai text-white">
                {user.initials}
              </div>
              <span className="text-sm font-semibold font-bai text-foreground hidden sm:block">{user.name}</span>
              {user.company && (
                <span className="text-[10px] text-gray-dark font-pop hidden sm:block">· {user.company}</span>
              )}
            </div>
          )}
          <button
            onClick={logout}
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
      </div>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16">

        {/* Welcome text */}
        <div className="text-center mb-14">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-primary font-pop mb-3">
            Welcome{user?.company ? `, ${user.company}` : ''}
          </p>
          <h1 className="text-4xl font-bold font-bai text-foreground mb-3">
            How would you like to browse?
          </h1>
          <p className="text-base text-gray-text font-pop max-w-md mx-auto">
            Choose to explore by project zone or by product category — you can switch at any time.
          </p>
        </div>

        {/* Two cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">

          {/* Zone card */}
          <button
            ref={zoneRef}
            onClick={onChooseZone}
            className="group relative bg-white border-2 border-gray hover:border-primary rounded-2xl p-8 text-left transition-all duration-200 hover:shadow-lg hover:-translate-y-1 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
          >
            {/* Gold accent top line on hover */}
            <div className="absolute top-0 left-6 right-6 h-0.5 bg-primary rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center" />

            <div className="w-14 h-14 rounded-xl bg-primary/8 group-hover:bg-primary/15 flex items-center justify-center mb-6 transition-colors">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-primary">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>

            <h2 className="text-xl font-bold font-bai text-foreground mb-2 group-hover:text-primary transition-colors">
              Browse by Zone
            </h2>
            <p className="text-sm text-gray-text font-pop leading-relaxed">
              Explore products assigned to specific project zones — ideal when you know which space you're specifying for.
            </p>

            <div className="mt-6 flex items-center gap-2 text-sm font-semibold font-bai text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              Select zone
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </div>

            {/* Zone pill badges preview */}
            <div className="mt-4 flex flex-wrap gap-1.5">
              {['Zone A', 'Zone B', 'Zone C', 'Artizan', '+9 more'].map(z => (
                <span key={z} className="text-[10px] font-semibold font-pop px-2 py-0.5 rounded-full bg-gray border border-gray-mid text-gray-text">
                  {z}
                </span>
              ))}
            </div>
          </button>

          {/* Product Type card */}
          <button
            onClick={onChooseProduct}
            className="group relative bg-white border-2 border-gray hover:border-primary rounded-2xl p-8 text-left transition-all duration-200 hover:shadow-lg hover:-translate-y-1 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
          >
            <div className="absolute top-0 left-6 right-6 h-0.5 bg-primary rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center" />

            <div className="w-14 h-14 rounded-xl bg-primary/8 group-hover:bg-primary/15 flex items-center justify-center mb-6 transition-colors">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-primary">
                <rect x="2" y="3" width="7" height="7" rx="1"/>
                <rect x="15" y="3" width="7" height="7" rx="1"/>
                <rect x="2" y="14" width="7" height="7" rx="1"/>
                <rect x="15" y="14" width="7" height="7" rx="1"/>
              </svg>
            </div>

            <h2 className="text-xl font-bold font-bai text-foreground mb-2 group-hover:text-primary transition-colors">
              Browse by Product Type
            </h2>
            <p className="text-sm text-gray-text font-pop leading-relaxed">
              Navigate the full product catalogue by category — Indoor, Outdoor, Architectural and more.
            </p>

            <div className="mt-6 flex items-center gap-2 text-sm font-semibold font-bai text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              Explore catalogue
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </div>

            {/* Category badge previews */}
            <div className="mt-4 flex flex-wrap gap-1.5">
              {['Indoor', 'Outdoor', 'Architectural', 'Smart', '+4 more'].map(c => (
                <span key={c} className="text-[10px] font-semibold font-pop px-2 py-0.5 rounded-full bg-gray border border-gray-mid text-gray-text">
                  {c}
                </span>
              ))}
            </div>
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pb-8">
        <p className="text-xs text-gray-dark font-pop">LEDLUM Product Catalogue · Admin portal available to staff</p>
      </div>
    </div>
  )
}
