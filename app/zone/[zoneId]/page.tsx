'use client'

import { Suspense } from 'react'
import { useParams } from 'next/navigation'
import CatalogPage from '@/components/CatalogPage'
import PageSpinner from '@/components/PageSpinner'
import { useZones } from '@/context/ZonesContext'

function ZonePageInner() {
  const params      = useParams()
  const pathSegment = params.zoneId as string
  const { loading, getZoneByPath } = useZones()

  if (loading) return <PageSpinner />

  const zone = getZoneByPath(pathSegment)
  return <CatalogPage zoneId={zone?.id ?? pathSegment} />
}

export default function ZonePage() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <ZonePageInner />
    </Suspense>
  )
}
