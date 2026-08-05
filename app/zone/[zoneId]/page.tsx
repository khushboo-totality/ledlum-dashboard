'use client'

import { Suspense } from 'react'
import { useParams } from 'next/navigation'
import CatalogPage from '@/components/CatalogPage'
import { useZones } from '@/context/ZonesContext'

const spinner = (
  <div className="min-h-screen flex items-center justify-center bg-white">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
)

function ZonePageInner() {
  const params      = useParams()
  const pathSegment = params.zoneId as string
  const { loading, getZoneByPath } = useZones()

  if (loading) return spinner

  const zone = getZoneByPath(pathSegment)
  return <CatalogPage zoneId={zone?.id ?? pathSegment} />
}

export default function ZonePage() {
  return (
    <Suspense fallback={spinner}>
      <ZonePageInner />
    </Suspense>
  )
}
