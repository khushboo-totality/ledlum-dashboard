export interface Zone {
  id: string        // zone slug, e.g. 'zone-a' — used in routing and as the join-table key
  label: string     // display name
  slug: string       // same as id, kept for backward compat with existing call sites
}

/** "zone-a" → "a",  "artizan" → "artizan" — pure string transform, no data dependency */
export function getZonePath(zoneId: string): string {
  return zoneId.startsWith('zone-') ? zoneId.slice(5) : zoneId
}
