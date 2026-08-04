'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import type { Zone } from '@/lib/zones'

interface ZonesContextType {
  zones: Zone[]
  loading: boolean
  getZoneById: (id: string) => Zone | undefined
  getZoneByPath: (path: string) => Zone | undefined
}

const ZonesContext = createContext<ZonesContextType | null>(null)

export function ZonesProvider({ children }: { children: ReactNode }) {
  const [zones, setZones]     = useState<Zone[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch('/api/zones')
      .then(res => res.ok ? res.json() : [])
      .then((data: Zone[]) => { if (!cancelled) setZones(Array.isArray(data) ? data : []) })
      .catch(() => { if (!cancelled) setZones([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const getZoneById = useCallback((id: string) => zones.find(z => z.id === id), [zones])

  // "zone-a" -> "a" style URL segment lookup, mirrors the old getZonePath/getZoneByPath pairing
  const getZoneByPath = useCallback((path: string) => {
    return zones.find(z => (z.id.startsWith('zone-') ? z.id.slice(5) : z.id) === path)
  }, [zones])

  return (
    <ZonesContext.Provider value={{ zones, loading, getZoneById, getZoneByPath }}>
      {children}
    </ZonesContext.Provider>
  )
}

export function useZones() {
  const ctx = useContext(ZonesContext)
  if (!ctx) throw new Error('useZones must be inside ZonesProvider')
  return ctx
}
