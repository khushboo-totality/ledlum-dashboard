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

// ── Admin management ───────────────────────────────────────────────────

export interface ZoneWithCount extends Zone {
  sortOrder: number
  productCount: number
}

export class ZoneError extends Error {
  constructor(message: string, public status: number) { super(message) }
}

function invalidate() { cache = null }

const cleanLabel = (v: unknown) => String(v ?? '').trim().replace(/\s+/g, ' ').slice(0, 80)
const toSlug = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)

/** All zones with how many products are linked to each (admin page). */
export async function listZonesWithCounts(): Promise<ZoneWithCount[]> {
  const { data, error } = await supabaseAdmin
    .from('ledlum_zone')
    .select('slug, label, sort_order, product_count:ledlum_product_zone(count)')
    .order('sort_order', { ascending: true })
  if (error) throw new Error(`Failed to load zones: ${error.message}`)
  const legacy = await legacyCountsByZone()
  return ((data ?? []) as unknown as { slug: string; label: string; sort_order: number; product_count: { count: number }[] | null }[])
    .map(r => ({
      id: r.slug, slug: r.slug, label: r.label, sortOrder: r.sort_order,
      // Real links + legacy ledlum_zone_products rows (still what most zone pages show).
      productCount: (r.product_count?.[0]?.count ?? 0) + (legacy.get(r.slug) ?? 0),
    }))
}

/** Rows per zone in the legacy ledlum_zone_products table (zone = slug text). */
async function legacyCountsByZone(): Promise<Map<string, number>> {
  const counts = new Map<string, number>()
  const { data, error } = await supabaseAdmin.from('ledlum_zone_products').select('zone')
  if (error) throw new Error(`Failed to count zone products: ${error.message}`)
  for (const r of (data ?? []) as { zone: string }[]) counts.set(r.zone, (counts.get(r.zone) ?? 0) + 1)
  return counts
}

/** Creates a zone; the URL slug is derived from the name (or given) and never changes afterwards. */
export async function createZone(rawLabel: unknown, rawSlug?: unknown): Promise<ZoneWithCount> {
  const label = cleanLabel(rawLabel)
  if (!label) throw new ZoneError('Zone name is required', 400)
  const slug = toSlug(String(rawSlug ?? '') || label)
  if (!slug) throw new ZoneError('Zone name must contain letters or numbers', 400)

  const { zones } = await loadZones()
  const clash = zones.find(z => z.slug === slug || z.label.toLowerCase() === label.toLowerCase())
  if (clash) throw new ZoneError(`A zone "${clash.label}" already exists`, 409)

  const { data: last } = await supabaseAdmin
    .from('ledlum_zone').select('sort_order').order('sort_order', { ascending: false }).limit(1)
  const sortOrder = (last?.[0]?.sort_order ?? 0) + 1

  const { data, error } = await supabaseAdmin
    .from('ledlum_zone').insert({ slug, label, sort_order: sortOrder }).select('slug, label, sort_order').single()
  if (error) {
    if (error.code === '23505') throw new ZoneError(`A zone with the code "${slug}" already exists`, 409)
    throw new Error(`Failed to create zone: ${error.message}`)
  }
  invalidate()
  return { id: data.slug, slug: data.slug, label: data.label, sortOrder: data.sort_order, productCount: 0 }
}

export async function renameZone(slug: string, rawLabel: unknown): Promise<void> {
  const label = cleanLabel(rawLabel)
  if (!label) throw new ZoneError('Zone name is required', 400)
  const { data, error } = await supabaseAdmin
    .from('ledlum_zone').update({ label }).eq('slug', slug).select('slug').maybeSingle()
  if (error) throw new Error(`Failed to rename zone: ${error.message}`)
  if (!data) throw new ZoneError('Zone not found', 404)
  invalidate()
}

/** Saves a new display order (slugs listed top to bottom). */
export async function reorderZones(slugs: string[]): Promise<void> {
  for (let i = 0; i < slugs.length; i++) {
    const { error } = await supabaseAdmin.from('ledlum_zone').update({ sort_order: i + 1 }).eq('slug', slugs[i])
    if (error) throw new Error(`Failed to reorder zones: ${error.message}`)
  }
  invalidate()
}

/** Deletes a zone that has no products linked to it. */
export async function deleteZone(slug: string): Promise<void> {
  const rowId = await getZoneRowIdBySlug(slug)
  if (!rowId) throw new ZoneError('Zone not found', 404)
  const { count, error: countErr } = await supabaseAdmin
    .from('ledlum_product_zone').select('id', { count: 'exact', head: true }).eq('zone_id', rowId)
  if (countErr) throw new Error(`Failed to check zone: ${countErr.message}`)
  const { count: legacyCount, error: legacyErr } = await supabaseAdmin
    .from('ledlum_zone_products').select('id', { count: 'exact', head: true }).eq('zone', slug)
  if (legacyErr) throw new Error(`Failed to check zone: ${legacyErr.message}`)
  const total = (count ?? 0) + (legacyCount ?? 0)
  if (total > 0) {
    throw new ZoneError(`This zone has ${total} product${total === 1 ? '' : 's'} — remove them from the zone first`, 409)
  }
  const { error } = await supabaseAdmin.from('ledlum_zone').delete().eq('id', rowId)
  if (error) throw new Error(`Failed to delete zone: ${error.message}`)
  invalidate()
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
