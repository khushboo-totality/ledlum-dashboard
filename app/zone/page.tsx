'use client'

import { Suspense, useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import AuthScreen from '@/components/AuthScreen'
import CatalogPage from '@/components/CatalogPage'

function ZoneIndexInner() {
  const { user } = useAuth()
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => { setHydrated(true) }, [])

  if (!hydrated) return null
  if (!user) return <AuthScreen />

  return <CatalogPage initialMode="zone" />
}

export default function ZoneIndexPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ZoneIndexInner />
    </Suspense>
  )
}
