// Server-only. CRUD for ledlum_categories (see migrations 005 + 006).
// Products reference a category by ledlum_products.category_id; DB triggers keep
// ledlum_products.group_name (category name) and .collection (main category)
// in sync with the category, including on rename / move.
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { invalidateAggregateCaches } from '@/lib/services/products'

const TABLE = 'ledlum_categories'
const SELECT = 'id, name, collection, product_count:ledlum_products(count)'

export interface Category {
  id: number
  name: string
  /** Main category (indoor / outdoor / artizan …); null = not assigned yet. */
  collection: string | null
  productCount: number
}

interface CategoryRow {
  id: number
  name: string
  collection: string | null
  product_count: { count: number }[] | null
}

const toCategory = (r: CategoryRow): Category => ({
  id: r.id,
  name: r.name,
  collection: r.collection,
  productCount: r.product_count?.[0]?.count ?? 0,
})

const cleanName = (name: unknown) => String(name ?? '').trim().replace(/\s+/g, ' ').slice(0, 120)
/** Main categories are stored lowercase, matching ledlum_products.collection. */
const cleanCollection = (v: unknown) => {
  const s = String(v ?? '').trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 60)
  return s || null
}

export class CategoryError extends Error {
  constructor(message: string, public status: number) { super(message) }
}

export async function listCategories(): Promise<Category[]> {
  const { data, error } = await supabaseAdmin.from(TABLE).select(SELECT).order('name', { ascending: true })
  if (error) throw new Error(`Failed to load categories: ${error.message}`)
  return ((data ?? []) as unknown as CategoryRow[]).map(toCategory)
}

export async function createCategory(rawName: unknown, rawCollection?: unknown): Promise<Category> {
  const name = cleanName(rawName)
  if (!name) throw new CategoryError('Category name is required', 400)

  const { data, error } = await supabaseAdmin
    .from(TABLE).insert({ name, collection: cleanCollection(rawCollection) }).select(SELECT).single()
  if (error) {
    if (error.code === '23505') throw new CategoryError(`A category named "${name}" already exists`, 409)
    throw new Error(`Failed to create category: ${error.message}`)
  }
  return toCategory(data as unknown as CategoryRow)
}

/** Renames a category and/or moves it to another main category — DB
 * triggers apply the change to all its products too. */
export async function updateCategory(id: number, changes: { name?: unknown; collection?: unknown }): Promise<Category> {
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (changes.name !== undefined) {
    const name = cleanName(changes.name)
    if (!name) throw new CategoryError('Category name is required', 400)
    update.name = name
  }
  if (changes.collection !== undefined) update.collection = cleanCollection(changes.collection)

  const { data, error } = await supabaseAdmin.from(TABLE).update(update).eq('id', id).select(SELECT).maybeSingle()
  if (error) {
    if (error.code === '23505') throw new CategoryError(`A category named "${update.name}" already exists`, 409)
    throw new Error(`Failed to update category: ${error.message}`)
  }
  if (!data) throw new CategoryError('Category not found', 404)
  invalidateAggregateCaches()
  return toCategory(data as unknown as CategoryRow)
}

/** Deletes an unused category. Categories that still have products are refused. */
export async function deleteCategory(id: number): Promise<void> {
  const { count, error: countErr } = await supabaseAdmin
    .from('ledlum_products').select('id', { count: 'exact', head: true }).eq('category_id', id)
  if (countErr) throw new Error(`Failed to check category: ${countErr.message}`)
  if ((count ?? 0) > 0) {
    throw new CategoryError(`This category has ${count} product${count === 1 ? '' : 's'} — move them to another category first`, 409)
  }

  const { error, count: deleted } = await supabaseAdmin.from(TABLE).delete({ count: 'exact' }).eq('id', id)
  if (error) throw new Error(`Failed to delete category: ${error.message}`)
  if (!deleted) throw new CategoryError('Category not found', 404)
  invalidateAggregateCaches()
}
