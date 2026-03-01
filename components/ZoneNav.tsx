'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { ZONES } from '@/lib/zones'

export default function ZoneNav() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const activeZone   = searchParams.get('zone') || ''

  const navigate = (zoneId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (zoneId) {
      params.set('zone', zoneId)
    } else {
      params.delete('zone')
    }
    // Reset category/search when changing zones
    params.delete('category')
    params.delete('search')
    router.push(`/?${params.toString()}`)
  }

  return (
    <div className="bg-white border-b border-gray sticky top-16 z-30">
      <div className="flex items-center overflow-x-auto scrollbar-hide">
        {/* All Zones pill */}
        <button
          onClick={() => navigate('')}
          className={`flex-shrink-0 px-5 py-3.5 text-sm font-semibold font-bai border-b-2 transition-all whitespace-nowrap ${
            !activeZone
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-text hover:text-foreground hover:border-gray-mid'
          }`}
        >
          All Zones
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-gray-mid flex-shrink-0 mx-1" />

        {ZONES.map(zone => (
          <button
            key={zone.id}
            onClick={() => navigate(zone.id)}
            className={`flex-shrink-0 px-5 py-3.5 text-sm font-semibold font-bai border-b-2 transition-all whitespace-nowrap group relative ${
              activeZone === zone.id
                ? 'border-primary text-primary bg-primary/3'
                : 'border-transparent text-gray-text hover:text-foreground hover:border-gray-mid'
            }`}
          >
            {zone.label}
          </button>
        ))}
      </div>
    </div>
  )
}
