'use client'

import { Suspense, useEffect, useState } from 'react'
import CatalogPage from '@/components/CatalogPage'

function ZoneIndexInner() {
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => { setHydrated(true) }, [])

  if (!hydrated) return null

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
