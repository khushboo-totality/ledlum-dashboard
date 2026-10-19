// Server-only. Bulk upload of products from a spreadsheet (see lib/bulkColumns.ts
// for how sheets are read and mapped). planBulk() is a dry run — it matches
// every row to an existing product and works out exactly which fields would
// change; applyBulk() re-plans the same rows against the live DB (never
// trusting a client preview) and writes only rows that create, update or delete.
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import {
  chunk, createProduct, updateProduct, deleteProduct, getPricesForModels, getZoneSlugsForProductIds,
  DP_KEY, type ProductRow,
} from '@/lib/services/products'
import { listCategories, createCategory, CategoryError, type Category } from '@/lib/services/categories'
import { listZones } from '@/lib/services/zones'
import {
  FIELDS, PRICE_PREFIX, SPEC_PREFIX, isClear, isPlaceholder, splitFieldList,
  type BulkChange, type BulkInputRow, type BulkOptions, type BulkPlanItem,
} from '@/lib/bulkColumns'
import type { ProductFormData } from '@/types'

const TABLE = 'ledlum_products'
const ID_CHUNK = 300
const APPLY_CONCURRENCY = 5

interface Existing {
  row: ProductRow
  zones: string[]
  prices: Record<string, number>
}

interface PlannedRow {
  item: BulkPlanItem
  /** Fields to write (create/update only). */
  patch?: Partial<ProductFormData>
  /** Category this row needs that doesn't exist yet (created on apply). */
  newCategory?: string
}

// Row field key → ProductFormData key, where they differ.
const FORM_KEY: Record<string, string> = {
  model: 'Codes', hero_image: 'ImageLink', category: 'sub_category',
}

// ── Value normalisation ────────────────────────────────────────────────

/** Existing DB text → comparable string; placeholder values count as empty. */
const normText = (v: unknown) => (v === null || v === undefined || isPlaceholder(String(v)) ? '' : String(v).trim())
const normList = (v: unknown) => (Array.isArray(v) ? v.map(normText).filter(Boolean) : [])
const sameList = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i])
const sameSet = (a: string[], b: string[]) => sameList([...a].sort(), [...b].sort())
const show = (v: string[] | number | boolean | null) =>
  v === null ? '' : Array.isArray(v) ? v.join(', ') : typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v)

/** "Rs.1,565.00" / "R s.10850.00" / "₹ 1565/-" → 1565; null when the cell has
 * no number at all (e.g. "Price on Request"). */
function parsePrice(v: string): number | null {
  const m = v.replace(/,/g, '').match(/\d+(\.\d+)?/)
  return m ? Number(m[0]) : null
}

/** Cell → what's stored, for fields with sheet conventions. */
function cellValue(key: string, raw: string): string {
  if (key === 'website') return 'W'                                    // any mark = shown on site
  if (key === 'product_type' && raw.toLowerCase() === 'new') return 'new' // New Launch badge
  return raw
}

// ── Loading the products the sheet refers to ───────────────────────────

async function loadExisting(rows: BulkInputRow[]): Promise<{ byId: Map<number, Existing>; byModel: Map<string, Existing[]> }> {
  const ids = new Set<number>()
  const models = new Set<string>()
  for (const { data } of rows) {
    const id = Number(data.id?.trim())
    if (data.id?.trim() && Number.isInteger(id)) ids.add(id)
    if (data.model?.trim()) models.add(data.model.trim())
  }

  const found = new Map<number, ProductRow>()
  for (const batch of chunk(Array.from(ids), ID_CHUNK)) {
    const { data, error } = await supabaseAdmin.from(TABLE).select('*').in('id', batch)
    if (error) throw new Error(`Failed to load products: ${error.message}`)
    for (const r of (data ?? []) as ProductRow[]) found.set(r.id, r)
  }
  for (const batch of chunk(Array.from(models), ID_CHUNK)) {
    const { data, error } = await supabaseAdmin.from(TABLE).select('*').in('model', batch)
    if (error) throw new Error(`Failed to load products: ${error.message}`)
    for (const r of (data ?? []) as ProductRow[]) found.set(r.id, r)
  }

  const productRows = Array.from(found.values())
  const [zoneMap, priceMap] = await Promise.all([
    getZoneSlugsForProductIds(productRows.map(r => r.id)),
    getPricesForModels(productRows.map(r => r.model ?? '')),
  ])

  const byId = new Map<number, Existing>()
  const byModel = new Map<string, Existing[]>()
  for (const r of productRows) {
    const e: Existing = { row: r, zones: zoneMap.get(r.id) ?? [], prices: priceMap.get(r.model ?? '') ?? {} }
    byId.set(r.id, e)
    const m = r.model?.trim()
    if (m) byModel.set(m, [...(byModel.get(m) ?? []), e])
  }
  return { byId, byModel }
}

// ── Planning ───────────────────────────────────────────────────────────

interface Lookups {
  categories: Map<string, Category>          // lower-case name → category
  zones: Map<string, string>                 // lower-case slug or label → slug
}

async function loadLookups(): Promise<Lookups> {
  const [cats, zones] = await Promise.all([listCategories(), listZones()])
  const zoneMap = new Map<string, string>()
  for (const z of zones) {
    zoneMap.set(z.slug.toLowerCase(), z.slug)
    zoneMap.set(z.label.toLowerCase(), z.slug)
  }
  return { categories: new Map(cats.map(c => [c.name.toLowerCase(), c])), zones: zoneMap }
}

/** Finds a key in `obj` ignoring case — keeps the existing spelling. */
const findKey = (obj: Record<string, unknown>, name: string) =>
  Object.keys(obj).find(k => k.toLowerCase() === name.toLowerCase()) ?? name

/**
 * Works out what one sheet row would do. Blank / placeholder cells leave the
 * field alone; CLEAR_TOKEN clears it.
 */
function planRow(input: BulkInputRow, existing: Existing | null, lookups: Lookups, options: BulkOptions): PlannedRow {
  const { data } = input
  const model = data.model?.trim() || existing?.row.model || ''
  const item: BulkPlanItem = {
    row: input.row, sheet: input.sheet, line: input.line, status: 'unchanged', model,
    productId: existing ? String(existing.row.id) : undefined,
  }
  const errors: string[] = []
  const warnings: string[] = []
  const changes: BulkChange[] = []
  const patch: Partial<ProductFormData> & Record<string, unknown> = {}
  let newCategory: string | undefined
  const before = existing?.row as unknown as Record<string, unknown> | undefined

  const note = (field: string, from: string, to: string) => changes.push({ field, from, to })

  for (const f of FIELDS) {
    const raw = data[f.key]?.trim() ?? ''
    if (isPlaceholder(raw)) continue
    const clear = isClear(raw)

    switch (f.kind) {
      case 'text': {
        if (f.key === 'model' && clear) { errors.push('Model cannot be cleared'); break }
        const next = clear ? '' : cellValue(f.key, raw)
        const prev = normText(before?.[f.key])
        if (next === prev) break
        note(f.label, prev, next)
        patch[FORM_KEY[f.key] ?? f.key] = next
        break
      }
      case 'list': {
        const next = clear ? [] : splitFieldList(f.key, raw)
        const prev = normList(before?.[f.key])
        // Same items split differently (stored "White/Black" vs White, Black) count as unchanged.
        if (sameList(prev, next) || sameList(prev.flatMap(v => splitFieldList(f.key, v)), next)) break
        note(f.label, show(prev), show(next))
        patch[f.key] = next
        break
      }
      case 'flag': {
        const next = !clear && !/^(no|false|0)$/i.test(raw)
        const prev = before?.[f.key] === true
        if (next === prev) break
        note(f.label, show(prev), show(next))
        patch[f.key] = next
        break
      }
      case 'price': {
        const next = clear ? null : parsePrice(raw)
        if (!clear && next === null) { warnings.push(`D.P. "${raw}" has no number — price left unchanged`); break }
        const prev = existing?.prices[DP_KEY] ?? null
        if (prev === next) break
        note(f.label, show(prev), show(next))
        patch.prices = { ...patch.prices, [DP_KEY]: next }
        break
      }
      case 'zones': {
        const next: string[] = []
        if (!clear) {
          for (const z of splitFieldList('zones', raw)) {
            const slug = lookups.zones.get(z.toLowerCase())
            if (slug) { if (!next.includes(slug)) next.push(slug) }
            else errors.push(`Unknown zone "${z}" — add it under Zones first`)
          }
        }
        const prev = existing?.zones ?? []
        if (sameSet(prev, next)) break
        note(f.label, show(prev), show(next))
        patch.zones = next
        break
      }
      case 'group': {
        if (existing && !options.categoryForExisting) break
        const name = clear ? '' : raw.replace(/\s+/g, ' ')
        const cat = name ? lookups.categories.get(name.toLowerCase()) : null
        const prevName = normText(before?.group_name)
        const prevId = (before?.category_id as number | null | undefined) ?? null
        // Same category if linked by id, or (older rows) not linked yet but named the same.
        const same = cat
          ? prevId === cat.id || (!prevId && prevName.toLowerCase() === cat.name.toLowerCase())
          : !name && !prevId && (prevName === '' || prevName === 'Uncategorized')
        if (same) break
        if (name && !cat) {
          if (!options.createCategories) { errors.push(`Unknown category "${name}" — add it under Categories first`); break }
          newCategory = name
          warnings.push(`New category "${name}" will be created`)
        }
        note(f.label, prevName, cat?.name ?? name)
        patch.category_id = cat?.id ?? null
        patch.Category = cat?.name ?? name
        break
      }
    }
  }

  // Extra prices ("D.P. (2 Mtr)" …) and extra specs, merged key by key.
  const prevSpecs = (existing?.row.extra_specs ?? {}) as Record<string, string>
  const nextSpecs = { ...prevSpecs }
  let specsChanged = false
  for (const [key, rawValue] of Object.entries(data)) {
    const raw = rawValue?.trim() ?? ''
    if (isPlaceholder(raw)) continue
    if (key.startsWith(PRICE_PREFIX)) {
      const priceKey = findKey(existing?.prices ?? {}, key.slice(PRICE_PREFIX.length))
      const next = isClear(raw) ? null : parsePrice(raw)
      if (!isClear(raw) && next === null) { warnings.push(`${priceKey} "${raw}" has no number — price left unchanged`); continue }
      const prev = existing?.prices[priceKey] ?? null
      if (prev === next) continue
      note(priceKey, show(prev), show(next))
      patch.prices = { ...patch.prices, [priceKey]: next }
    } else if (key.startsWith(SPEC_PREFIX)) {
      const specKey = findKey(prevSpecs, key.slice(SPEC_PREFIX.length))
      const prev = normText(prevSpecs[specKey])
      const next = isClear(raw) ? '' : raw
      if (prev === next) continue
      note(specKey, prev, next)
      if (next) nextSpecs[specKey] = next
      else delete nextSpecs[specKey]
      specsChanged = true
    }
  }
  if (specsChanged) patch.extra_specs = nextSpecs

  const withNotes = (extra: Partial<BulkPlanItem>): BulkPlanItem =>
    ({ ...item, ...extra, warnings: warnings.length ? warnings : undefined })

  if (errors.length) return { item: withNotes({ status: 'error', errors }) }

  if (!existing) {
    if (!patch.Category) warnings.push('No category — will be saved as Uncategorized')
    return {
      item: withNotes({ status: 'create', changes }),
      patch: { Category: '', ImageLink: '', ...patch, Codes: model } as ProductFormData,
      newCategory,
    }
  }
  if (changes.length === 0) return { item: withNotes({}) }
  return { item: withNotes({ status: 'update', changes }), patch, newCategory }
}

export async function planBulk(rows: BulkInputRow[], options: BulkOptions): Promise<PlannedRow[]> {
  const [{ byId, byModel }, lookups] = await Promise.all([loadExisting(rows), loadLookups()])
  // Which row already claimed a product (or a new model) — catches the same
  // product listed twice in one upload.
  const claimed = new Map<string, BulkInputRow>()

  // Products listed more than once with different values: every copy is an
  // error (not just the later ones), so neither version is written until the
  // sheet keeps just one.
  const rowKey = (r: BulkInputRow) => {
    const id = Number(r.data.id?.trim())
    if (r.data.id?.trim()) return byId.has(id) ? `id:${id}` : null
    const m = r.data.model?.trim() ?? ''
    const matches = byModel.get(m) ?? []
    return matches.length === 1 ? `id:${matches[0].row.id}` : m ? `new:${m.toLowerCase()}` : null
  }
  const versions = new Map<string, Set<string>>()
  for (const r of rows) {
    const k = rowKey(r)
    if (k) versions.set(k, (versions.get(k) ?? new Set()).add(JSON.stringify(r.data)))
  }
  const conflicting = new Set(Array.from(versions).filter(([, v]) => v.size > 1).map(([k]) => k))

  return rows.map(input => {
    const { data } = input
    const action = (data.action ?? '').trim().toLowerCase()
    const idText = data.id?.trim() ?? ''
    const model = data.model?.trim() ?? ''
    const base: BulkPlanItem = { row: input.row, sheet: input.sheet, line: input.line, status: 'error', model }
    const fail = (msg: string): PlannedRow => ({ item: { ...base, errors: [msg] } })

    if (action && !['delete', 'update', 'create', 'upsert'].includes(action)) {
      return fail(`Unknown action "${data.action}" — leave it blank, or use "delete"`)
    }

    // Find the product this row is about.
    let existing: Existing | null = null
    if (idText) {
      const id = Number(idText)
      existing = Number.isInteger(id) ? byId.get(id) ?? null : null
      if (!existing) return fail(`No product with id ${idText}`)
    } else if (model) {
      const matches = byModel.get(model) ?? []
      if (matches.length > 1) {
        return fail(`${matches.length} products share model "${model}" (ids ${matches.map(m => m.row.id).join(', ')}) — add an id column to pick one`)
      }
      existing = matches[0] ?? null
    } else {
      return fail('Model is required')
    }
    if (existing) {
      base.model = existing.row.model ?? model
      base.productId = String(existing.row.id)
    }

    const key = existing ? `id:${existing.row.id}` : `new:${model.toLowerCase()}`
    const where = (r: BulkInputRow) => `${r.sheet === input.sheet ? '' : `sheet "${r.sheet}", `}row ${r.line}`
    if (conflicting.has(key)) {
      const others = rows.filter(r => r !== input && rowKey(r) === key)
      const differs = Array.from(new Set(others.flatMap(o => Object.keys({ ...o.data, ...data })
        .filter(k => (o.data[k] ?? '') !== (data[k] ?? '')))))
        .map(k => FIELDS.find(f => f.key === k)?.label ?? k.replace(/^(spec|price):/, ''))
      return fail(`Also listed in ${others.map(where).join(', ')} with a different ${differs.join(', ')} — keep one row, then re-upload`)
    }
    const seen = claimed.get(key)
    // Price lists repeat some products verbatim — harmless, just skip the copy.
    if (seen) return { item: { ...base, status: 'unchanged', warnings: [`Repeat of ${where(seen)} — skipped`] } }
    claimed.set(key, input)

    if (action === 'delete') {
      if (!existing) return fail(`Can't delete "${model}" — no such product`)
      return { item: { ...base, status: 'delete' } }
    }
    if (action === 'create' && existing) return fail(`"${model}" already exists (id ${existing.row.id}) — clear the action column to update it`)
    if (action === 'update' && !existing) return fail(`Can't update "${model}" — no such product`)

    const planned = planRow(input, existing, lookups, options)
    // A renamed model clashing with another product is allowed (models aren't
    // unique in the DB) but almost always a mistake.
    const newModel = planned.patch?.Codes
    if (existing && newModel && newModel !== existing.row.model && (byModel.get(newModel) ?? []).some(e => e.row.id !== existing!.row.id)) {
      planned.item.warnings = [...(planned.item.warnings ?? []), `Another product already uses model "${newModel}"`]
    }
    return planned
  })
}

// ── Applying ───────────────────────────────────────────────────────────

async function runLimited<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out = new Array<R>(items.length)
  let next = 0
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++
      out[i] = await fn(items[i])
    }
  }))
  return out
}

/** Creates the categories the rows need; returns lower-case name → id. */
async function ensureCategories(names: string[], collection: string | null): Promise<Map<string, number>> {
  const ids = new Map<string, number>()
  for (const name of Array.from(new Set(names))) {
    try {
      ids.set(name.toLowerCase(), (await createCategory(name, collection)).id)
    } catch (err) {
      if (!(err instanceof CategoryError && err.status === 409)) throw err
      // Created meanwhile (e.g. by an earlier chunk) — look it up instead.
      const found = (await listCategories()).find(c => c.name.toLowerCase() === name.toLowerCase())
      if (found) ids.set(name.toLowerCase(), found.id)
    }
  }
  return ids
}

/** Re-plans the rows against the live DB and writes the changes. Returns one
 * result per row: its final status, or 'error' with the reason it failed. */
export async function applyBulk(rows: BulkInputRow[], options: BulkOptions): Promise<BulkPlanItem[]> {
  const plan = await planBulk(rows, options)

  const needed = plan.filter(p => p.newCategory && p.item.status !== 'error').map(p => p.newCategory!)
  const created = needed.length ? await ensureCategories(needed, options.newCategoryCollection) : new Map<string, number>()
  for (const p of plan) {
    if (p.newCategory && p.patch) p.patch.category_id = created.get(p.newCategory.toLowerCase()) ?? null
  }

  return runLimited(plan, APPLY_CONCURRENCY, async ({ item, patch }) => {
    try {
      if (item.status === 'create' && patch) {
        const product = await createProduct(patch as ProductFormData)
        return { ...item, productId: product.id }
      }
      if (item.status === 'update' && patch && item.productId) {
        const updated = await updateProduct(item.productId, patch)
        return updated ? item : { ...item, status: 'error', errors: ['Product no longer exists'] }
      }
      if (item.status === 'delete' && item.productId) {
        const ok = await deleteProduct(item.productId)
        return ok ? item : { ...item, status: 'error', errors: ['Product no longer exists'] }
      }
      return item
    } catch (err) {
      return { ...item, status: 'error', errors: [err instanceof Error ? err.message : 'Failed'] }
    }
  })
}
