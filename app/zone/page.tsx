'use client'

import { Suspense, useEffect, useState } from 'react'
import CatalogPage from '@/components/CatalogPage'
import PageSpinner from '@/components/PageSpinner'
import { useZones } from '@/context/ZonesContext'

function ZoneIndexInner() {
  const [hydrated, setHydrated] = useState(false)
  const { loading: zonesLoading } = useZones()

  useEffect(() => { setHydrated(true) }, [])

  if (!hydrated || zonesLoading) return <PageSpinner />

  return <CatalogPage initialMode="zone" />
}

export default function ZoneIndexPage() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <ZoneIndexInner />
    </Suspense>
  )
}
