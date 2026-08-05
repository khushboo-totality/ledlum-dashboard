// Server-only. Reads/writes `ledlum_products` + the `ledlum_product_zone`
// join table. Depends on lib/services/zones.ts only for slug <-> row-id
// resolution — never queries `ledlum_zone` directly itself.
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getZoneRowIdBySlug, getZoneSlugsByRowIds } from '@/lib/services/zones'
import type { Product, ProductFormData, Stats } from '@/types'

const TABLE = 'ledlum_products'
const JOIN_TABLE = 'ledlum_product_zone'

// Supabase/PostgREST caps unpaginated responses at 1000 rows — this table
// has 1600+ products, so every query that isn't already bounded by a small
// .in() id list must page through with .range() or it silently truncates.
const PAGE_SIZE = 1000
const ID_CHUNK_SIZE = 300

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

async function selectAllPages<T>(
  buildQuery: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>
): Promise<T[]> {
  const all: T[] = []
  let from = 0
  for (;;) {
    const { data, error } = await buildQuery(from, from + PAGE_SIZE - 1)
    if (error) throw new Error(error.message)
    const rows = data ?? []
    all.push(...rows)
    if (rows.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }
  return all
}

interface ProductRow {
  id: number
  model: string | null
  family: string | null
  category: string | null
  group_name: string | null
  collection: string | null
  hero_image: string | null
  hero_description: string | null
  gallery_images: string[] | null
  watts: string | null
  dimensions: string | null
  cutout_size: string | null
  body_colors: string[] | null
  cct: string[] | null
  beam_angle: string | null
  ip_rating: string | null
  led_chip: string | null
  luminous: string | null
  cri: string | null
  website: string | null
  product_type: string | null
  created_at: string
}

function mapRowToProduct(row: ProductRow, zoneSlugs: string[]): Product {
  return {
    id: String(row.id),
    // Legacy fields — keep the old UI/product-taxonomy contract working.
    // `group_name` is the well-populated, human-meaningful grouping (e.g.
    // "POLE LIGHT FIXTURES") — the raw `category` column is a sparse legacy
    // duplicate of it on ~58% of rows, so it's only a fallback here.
    Codes: row.model ?? '',
    Category: row.group_name ?? row.category ?? 'Uncategorized',
    ImageLink: row.hero_image ?? row.gallery_images?.[0] ?? '',
    imageUrl: row.hero_image ?? row.gallery_images?.[0] ?? '',
    Wattage: row.watts ?? undefined,
    ColourTemp: row.cct?.length ? row.cct.join('/') : undefined,
    BeamAngle: row.beam_angle ?? undefined,
    Finish: row.body_colors?.length ? row.body_colors.join('/') : undefined,
    Dimensions: row.dimensions ?? undefined,
    Description: row.hero_description ?? undefined,
    source: 'internal',
    zone: zoneSlugs[0] ?? '',
    createdAt: row.created_at,
    updatedAt: null,

    // Real schema fields.
    zones: zoneSlugs,
    model: row.model ?? undefined,
    family: row.family,
    group_name: row.group_name ?? undefined,
    collection: row.collection ?? undefined,
    hero_image: row.hero_image,
    hero_description: row.hero_description,
    gallery_images: row.gallery_images ?? [],
    watts: row.watts,
    cutout_size: row.cutout_size,
    body_colors: row.body_colors ?? [],
    cct: row.cct ?? [],
    beam_angle: row.beam_angle,
    ip_rating: row.ip_rating,
    led_chip: row.led_chip,
    luminous: row.luminous,
    cri: row.cri,
    website: row.website,
    product_type: row.product_type,
  }
}

async function getZoneSlugsForProductIds(productIds: number[]): Promise<Map<number, string[]>> {
  const result = new Map<number, string[]>()
  if (productIds.length === 0) return result

  const allRows: { product_id: number; zone_id: number }[] = []
  for (const idBatch of chunk(productIds, ID_CHUNK_SIZE)) {
    const rows = await selectAllPages<{ product_id: number; zone_id: number }>((from, to) =>
      supabaseAdmin.from(JOIN_TABLE).select('product_id, zone_id').in('product_id', idBatch).range(from, to)
    )
    allRows.push(...rows)
  }

  const zoneIdToSlug = await getZoneSlugsByRowIds(Array.from(new Set(allRows.map(r => r.zone_id))))
  for (const row of allRows) {
    const slug = zoneIdToSlug.get(row.zone_id)
    if (!slug) continue
    const list = result.get(row.product_id) ?? []
    list.push(slug)
    result.set(row.product_id, list)
  }
  return result
}

async function getProductIdsForZone(zoneSlug: string): Promise<number[] | null> {
  const zoneRowId = await getZoneRowIdBySlug(zoneSlug)
  if (!zoneRowId) return null
  const rows = await selectAllPages<{ product_id: number }>((from, to) =>
    supabaseAdmin.from(JOIN_TABLE).select('product_id').eq('zone_id', zoneRowId).range(from, to)
  )
  return rows.map(r => r.product_id)
}

async function setProductZones(productId: number, zoneSlugs: string[]): Promise<void> {
  const { error: delError } = await supabaseAdmin.from(JOIN_TABLE).delete().eq('product_id', productId)
  if (delError) throw new Error(`Failed to clear product zones: ${delError.message}`)
  if (zoneSlugs.length === 0) return

  const rowIds: number[] = []
  for (const slug of zoneSlugs) {
    const rowId = await getZoneRowIdBySlug(slug)
    if (rowId) rowIds.push(rowId)
  }
  if (rowIds.length === 0) return

  const { error } = await supabaseAdmin
    .from(JOIN_TABLE)
    .insert(rowIds.map(zone_id => ({ product_id: productId, zone_id })))
  if (error) throw new Error(`Failed to set product zones: ${error.message}`)
}

export interface ProductFilters {
  zone?: string
  search?: string
  category?: string
  source?: string
}

export async function listProducts(filters?: ProductFilters): Promise<Product[]> {
  if (filters?.source === 'external') return [] // no external-sourced products in Supabase

  let productIdFilter: number[] | null = null
  if (filters?.zone) {
    productIdFilter = await getProductIdsForZone(filters.zone)
    if (productIdFilter === null || productIdFilter.length === 0) return []
  }

  // Bounded by an .in() id list (<=1000 rows possible per id) → chunk it.
  // Unbounded (no zone filter) → a single "chunk" that still needs .range() paging.
  const idChunks = productIdFilter ? chunk(productIdFilter, ID_CHUNK_SIZE) : [null]
  const rows: ProductRow[] = []
  for (const idBatch of idChunks) {
    const pageRows = await selectAllPages<ProductRow>((from, to) => {
      let q = supabaseAdmin.from(TABLE).select('*').order('id', { ascending: false })
      if (idBatch) q = q.in('id', idBatch)
      if (filters?.category) q = q.eq('group_name', filters.category)
      if (filters?.search) {
        const s = filters.search.replace(/[%_,]/g, ' ').trim()
        if (s) q = q.or(`model.ilike.%${s}%,group_name.ilike.%${s}%`)
      }
      return q.range(from, to)
    })
    rows.push(...pageRows)
  }

  const zoneMap = await getZoneSlugsForProductIds(rows.map(r => r.id))
  return rows.map(r => mapRowToProduct(r, zoneMap.get(r.id) ?? []))
}

export async function getProductById(id: string): Promise<Product | null> {
  const numId = Number(id)
  if (!Number.isFinite(numId)) return null
  const { data, error } = await supabaseAdmin.from(TABLE).select('*').eq('id', numId).maybeSingle()
  if (error) throw new Error(`Failed to get product: ${error.message}`)
  if (!data) return null
  const zoneMap = await getZoneSlugsForProductIds([numId])
  return mapRowToProduct(data as ProductRow, zoneMap.get(numId) ?? [])
}

function formToInsertRow(data: Partial<ProductFormData>) {
  return {
    model: data.Codes,
    group_name: data.Category || 'Uncategorized',
    hero_image: data.ImageLink || null,
    family: data.family || null,
    collection: data.collection || null,
    hero_description: data.hero_description || null,
    gallery_images: data.gallery_images ?? [],
    watts: data.watts || null,
    dimensions: data.dimensions || null,
    cutout_size: data.cutout_size || null,
    body_colors: data.body_colors ?? [],
    cct: data.cct ?? [],
    beam_angle: data.beam_angle || null,
    ip_rating: data.ip_rating || null,
    led_chip: data.led_chip || null,
    luminous: data.luminous || null,
    cri: data.cri || null,
    website: data.website || null,
    product_type: data.product_type || null,
  }
}

export async function createProduct(data: ProductFormData): Promise<Product> {
  const { data: row, error } = await supabaseAdmin
    .from(TABLE)
    .insert(formToInsertRow(data))
    .select('*')
    .single()
  if (error) throw new Error(`Failed to create product: ${error.message}`)

  const zoneSlugs = data.zones?.length ? data.zones : data.zone ? [data.zone] : []
  await setProductZones(row.id, zoneSlugs)

  const zoneMap = await getZoneSlugsForProductIds([row.id])
  return mapRowToProduct(row as ProductRow, zoneMap.get(row.id) ?? [])
}

export async function updateProduct(id: string, data: Partial<ProductFormData>): Promise<Product | null> {
  const numId = Number(id)
  if (!Number.isFinite(numId)) return null

  const updateRow: Record<string, unknown> = {}
  if (data.Codes !== undefined) updateRow.model = data.Codes
  if (data.Category !== undefined) updateRow.group_name = data.Category || 'Uncategorized'
  if (data.ImageLink !== undefined) updateRow.hero_image = data.ImageLink || null
  if (data.family !== undefined) updateRow.family = data.family || null
  if (data.collection !== undefined) updateRow.collection = data.collection || null
  if (data.hero_description !== undefined) updateRow.hero_description = data.hero_description || null
  if (data.gallery_images !== undefined) updateRow.gallery_images = data.gallery_images
  if (data.watts !== undefined) updateRow.watts = data.watts || null
  if (data.dimensions !== undefined) updateRow.dimensions = data.dimensions || null
  if (data.cutout_size !== undefined) updateRow.cutout_size = data.cutout_size || null
  if (data.body_colors !== undefined) updateRow.body_colors = data.body_colors
  if (data.cct !== undefined) updateRow.cct = data.cct
  if (data.beam_angle !== undefined) updateRow.beam_angle = data.beam_angle || null
  if (data.ip_rating !== undefined) updateRow.ip_rating = data.ip_rating || null
  if (data.led_chip !== undefined) updateRow.led_chip = data.led_chip || null
  if (data.luminous !== undefined) updateRow.luminous = data.luminous || null
  if (data.cri !== undefined) updateRow.cri = data.cri || null
  if (data.website !== undefined) updateRow.website = data.website || null
  if (data.product_type !== undefined) updateRow.product_type = data.product_type || null

  let row: ProductRow | null
  if (Object.keys(updateRow).length > 0) {
    const { data: updated, error } = await supabaseAdmin
      .from(TABLE).update(updateRow).eq('id', numId).select('*').maybeSingle()
    if (error) throw new Error(`Failed to update product: ${error.message}`)
    row = updated as ProductRow | null
  } else {
    const { data: existing, error } = await supabaseAdmin.from(TABLE).select('*').eq('id', numId).maybeSingle()
    if (error) throw new Error(`Failed to load product: ${error.message}`)
    row = existing as ProductRow | null
  }
  if (!row) return null

  if (data.zones !== undefined) await setProductZones(numId, data.zones)
  else if (data.zone !== undefined) await setProductZones(numId, data.zone ? [data.zone] : [])

  const zoneMap = await getZoneSlugsForProductIds([numId])
  return mapRowToProduct(row, zoneMap.get(numId) ?? [])
}

export async function deleteProduct(id: string): Promise<boolean> {
  const numId = Number(id)
  if (!Number.isFinite(numId)) return false
  const { error, count } = await supabaseAdmin.from(TABLE).delete({ count: 'exact' }).eq('id', numId)
  if (error) throw new Error(`Failed to delete product: ${error.message}`)
  return (count ?? 0) > 0
}

export async function getCategories(zone?: string): Promise<string[]> {
  let productIdFilter: number[] | null = null
  if (zone) {
    productIdFilter = await getProductIdsForZone(zone)
    if (productIdFilter === null || productIdFilter.length === 0) return []
  }

  const idChunks = productIdFilter ? chunk(productIdFilter, ID_CHUNK_SIZE) : [null]
  const cats = new Set<string>()
  for (const idBatch of idChunks) {
    const rows = await selectAllPages<{ group_name: string | null }>((from, to) => {
      let q = supabaseAdmin.from(TABLE).select('group_name')
      if (idBatch) q = q.in('id', idBatch)
      return q.range(from, to)
    })
    for (const row of rows) if (row.group_name) cats.add(row.group_name)
  }
  return Array.from(cats)
}

export async function getStats(zone?: string): Promise<Stats> {
  const products = await listProducts(zone ? { zone } : undefined)
  return {
    total: products.length,
    withImage: products.filter(p => p.ImageLink && p.ImageLink.length > 2).length,
    withoutImage: products.filter(p => !p.ImageLink || p.ImageLink.length <= 2).length,
    byCategory: products.reduce((acc, p) => { acc[p.Category] = (acc[p.Category] || 0) + 1; return acc }, {} as Record<string, number>),
    bySource: products.reduce((acc, p) => { acc[p.source] = (acc[p.source] || 0) + 1; return acc }, {} as Record<string, number>),
  }
}

/** Kept for API-contract compatibility (see app/api/products/sync/route.ts) — no UI trigger anymore. */
export async function syncExternal(records: Partial<ProductFormData>[], zone?: string): Promise<{ added: number; updated: number }> {
  let added = 0, updated = 0
  for (const raw of records) {
    const code = raw.Codes || ''
    if (!code) continue
    const targetZone = zone || raw.zone

    const { data: existingRows, error } = await supabaseAdmin.from(TABLE).select('id').eq('model', code).limit(1)
    if (error) throw new Error(`Sync lookup failed: ${error.message}`)

    if (existingRows && existingRows.length > 0) {
      await updateProduct(String(existingRows[0].id), { ...raw, zone: targetZone })
      updated++
    } else {
      await createProduct({
        Codes: code,
        Category: raw.Category || 'Uncategorized',
        ImageLink: raw.ImageLink || '',
        zone: targetZone,
      })
      added++
    }
  }
  return { added, updated }
}
