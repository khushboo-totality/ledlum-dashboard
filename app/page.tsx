'use client'

import { Suspense, useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import AuthScreen from '@/components/AuthScreen'
import CatalogPage from '@/components/CatalogPage'
import BrowseChooser from '@/components/BrowseChooser'
import type { BrowseMode } from '@/types'

const CHOOSER_KEY = 'ledlum_browse_chosen'

function PageInner() {
  const { user } = useAuth()
  // null = not yet decided (show chooser), string = decided
  const [browseMode, setBrowseMode] = useState<BrowseMode | null>(null)

  useEffect(() => {
    if (!user) {
      // Reset on logout so chooser shows again next login
      setBrowseMode(null)
      return
    }
    // Check if already chose this session
    const saved = sessionStorage.getItem(CHOOSER_KEY) as BrowseMode | null
    if (saved === 'zone' || saved === 'product') {
      setBrowseMode(saved)
    }
    // else null → show chooser for ALL roles
  }, [user])

  if (!user) return <AuthScreen />

  // Show chooser once per session for ALL roles
  if (browseMode === null) {
    return (
      <BrowseChooser
        onChooseZone={() => {
          sessionStorage.setItem(CHOOSER_KEY, 'zone')
          setBrowseMode('zone')
        }}
        onChooseProduct={() => {
          sessionStorage.setItem(CHOOSER_KEY, 'product')
          setBrowseMode('product')
        }}
      />
    )
  }

  return (
    <CatalogPage
      initialMode={browseMode}
      onModeChange={(m) => {
        sessionStorage.setItem(CHOOSER_KEY, m)
        setBrowseMode(m)
      }}
    />
  )
}

export default function Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-dark font-bai">Loading…</span>
        </div>
      </div>
    }>
      <PageInner />
    </Suspense>
  )
}
