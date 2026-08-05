// Server-only. Reads/writes the `ledlum_zone` table.
// The app-facing `id` is always the slug string (e.g. 'zone-a') — the
// numeric Supabase primary key never leaves this module except via
// getZoneRowIdBySlug, used internally by lib/services/products.ts.
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import type { Zone } from '@/lib/zones'

interface ZoneRow {
  id: number
  slug: string
  label: string
  sort_order: number
}

let cache: { zones: Zone[]; rows: ZoneRow[]; expiresAt: number } | null = null
const CACHE_TTL_MS = 60_000

async function loadZones(): Promise<{ zones: Zone[]; rows: ZoneRow[] }> {
  if (cache && cache.expiresAt > Date.now()) return cache
  const { data, error } = await supabaseAdmin
    .from('ledlum_zone')
    .select('id, slug, label, sort_order')
    .order('sort_order', { ascending: true })
  if (error) throw new Error(`Failed to load zones: ${error.message}`)

  const rows = (data ?? []) as ZoneRow[]
  const zones = rows.map(r => ({ id: r.slug, label: r.label, slug: r.slug }))
  cache = { zones, rows, expiresAt: Date.now() + CACHE_TTL_MS }
  return cache
}

export async function listZones(): Promise<Zone[]> {
  return (await loadZones()).zones
}

export async function getZoneBySlug(slug: string): Promise<Zone | null> {
  const { zones } = await loadZones()
  return zones.find(z => z.slug === slug) ?? null
}

/** Internal: resolve a zone slug to its numeric Supabase row id (for FK use). */
export async function getZoneRowIdBySlug(slug: string): Promise<number | null> {
  const { rows } = await loadZones()
  return rows.find(r => r.slug === slug)?.id ?? null
}

/** Internal: resolve numeric Supabase row ids back to zone slugs. */
export async function getZoneSlugsByRowIds(rowIds: number[]): Promise<Map<number, string>> {
  const { rows } = await loadZones()
  const map = new Map<number, string>()
  for (const id of rowIds) {
    const row = rows.find(r => r.id === id)
    if (row) map.set(id, row.slug)
  }
  return map
}
