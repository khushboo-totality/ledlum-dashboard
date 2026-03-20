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
  const [browseMode, setBrowseMode] = useState<BrowseMode | null>(null)
  const [hydrated, setHydrated] = useState(false)

  // Step 1: mark hydrated after mount (no SSR sessionStorage access)
  useEffect(() => {
    setHydrated(true)
  }, [])

  // Step 2: once hydrated, check sessionStorage for existing choice
  useEffect(() => {
    if (!hydrated) return
    if (!user) {
      setBrowseMode(null)
      return
    }
    // Safe to access sessionStorage now (client only)
    try {
      const saved = sessionStorage.getItem(CHOOSER_KEY) as BrowseMode | null
      if (saved === 'zone' || saved === 'product') {
        setBrowseMode(saved)
      } else {
        setBrowseMode(null) // show chooser
      }
    } catch {
      setBrowseMode(null)
    }
  }, [user, hydrated])

  // Before hydration — render nothing (avoid SSR mismatch)
  if (!hydrated) return null

  if (!user) return <AuthScreen />

  if (browseMode === null) {
    return (
      <BrowseChooser
        onChooseZone={() => {
          // try { sessionStorage.setItem(CHOOSER_KEY, 'zone') } catch {}
          setBrowseMode('zone')
        }}
        onChooseProduct={() => {
          // try { sessionStorage.setItem(CHOOSER_KEY, 'product') } catch {}
          setBrowseMode('product')
        }}
      />
    )
  }

  return (
    <CatalogPage
      initialMode={browseMode}
      onModeChange={(m) => {
        // try { sessionStorage.setItem(CHOOSER_KEY, m) } catch {}
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