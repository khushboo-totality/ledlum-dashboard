'use client'

import { Suspense } from 'react'
import { useParams } from 'next/navigation'
import CatalogPage from '@/components/CatalogPage'
import { getZoneByPath } from '@/lib/zones'

function ZonePageInner() {
  const params      = useParams()
  const pathSegment = params.zoneId as string
  const zone        = getZoneByPath(pathSegment)

  return <CatalogPage zoneId={zone?.id ?? pathSegment} />
}

export default function ZonePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ZonePageInner />
    </Suspense>
  )
}
