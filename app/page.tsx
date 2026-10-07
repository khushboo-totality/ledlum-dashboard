'use client'

import { Suspense, useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import AuthScreen from '@/components/AuthScreen'
import CatalogPage from '@/components/CatalogPage'
import PageSpinner from '@/components/PageSpinner'

function PageInner() {
  const { user, loading: authLoading } = useAuth()
  const [hydrated, setHydrated] = useState(false)

  // Mark hydrated after mount to avoid SSR/client mismatch
  useEffect(() => {
    setHydrated(true)
  }, [])

  // Before hydration, or before we know if a session was restored — show a
  // spinner instead of a blank flash (and instead of flashing AuthScreen).
  if (!hydrated || authLoading) return <PageSpinner />

  if (!user) return <AuthScreen />

  // Go straight to the catalogue after login (no browse chooser step)
  return <CatalogPage initialMode="product" />
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
