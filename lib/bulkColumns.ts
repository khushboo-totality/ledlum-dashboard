// Shared by the bulk-upload UI and the server planner — client-safe, no server deps.
//
// Uploads are "dynamic": any workbook works. Every sheet that has a model
// column is read, its heading row is found automatically, and each heading is
// mapped to a product field (auto-suggested below, changeable in the UI). The
// rules follow the original Excel importers (ledlum/scripts/import-*.ts):
//   - sheet name = the product's category (for new products)
//   - "Category" column = ledlum_products.category (the sub-category level)
//   - a Family column holding only "F" marks is ignored (families are set in the dashboard)
//   - any mark in Website = shown on the site ("W"); Product Type "New" → "new"
//   - "D.P." = dealer price; "D.P. (2 Mtr)", RF+BLE, Phasecut, DT6, DT8 = extra price keys
//   - anything else becomes an extra spec under its heading
// A blank cell, or a placeholder like "-" / "N/A", never changes a value.
// CLEAR_TOKEN in a cell clears that field.

import { DRIVER_OPTIONS, canonicalPriceKey } from '@/lib/productOptions'

export const CLEAR_TOKEN = '#CLEAR'
export const SPEC_PREFIX = 'spec:'
export const PRICE_PREFIX = 'price:'

export type FieldKind = 'text' | 'list' | 'price' | 'zones' | 'group' | 'flag'

export interface FieldDef {
  /** Row data key — the ledlum_products column name where there is one. */
  key: string
  label: string
  kind: FieldKind
  /** Lower-case headings that auto-map to this field. */
  synonyms: string[]
  /** Export: how a list is joined. */
  sep?: string
  /** Export heading (defaults to label). */
  header?: string
}

export const FIELDS: FieldDef[] = [
  { key: 'model',            label: 'Model / Item number', header: 'Model', kind: 'text',
    synonyms: ['model', 'models', 'item number', 'item no', 'item no.', 'model no', 'model no.', 'model number', 'item code', 'code', 'codes', 'product code'] },
  { key: 'group_name',       label: 'Category (dashboard)', header: 'Dashboard Category', kind: 'group',
    synonyms: ['dashboard category', 'group name', 'group'] },
  { key: 'category',         label: 'Sub-category', header: 'Sub-category', kind: 'text',
    synonyms: ['category', 'sub-category', 'sub category', 'subcategory'] },
  { key: 'zones',            label: 'Zones', kind: 'zones', sep: ', ', synonyms: ['zones', 'zone'] },
  { key: 'family',           label: 'Family', kind: 'text', synonyms: ['family'] },
  { key: 'product_type',     label: 'Product type (New / S.P.O)', header: 'Product Type', kind: 'text', synonyms: ['product type'] },
  { key: 'website',          label: 'Show on website', header: 'Website', kind: 'text', synonyms: ['website', 'websiite', 'web'] },
  { key: 'is_track',         label: 'Track product', header: 'Track', kind: 'flag', synonyms: ['track', 'tracks'] },
  { key: 'dp',               label: 'D.P. (dealer price)', header: 'D.P.', kind: 'price', synonyms: ['d.p.', 'd.p', 'dp', 'dealer price', 'price'] },
  { key: 'watts',            label: 'Watts', kind: 'text', synonyms: ['watts', 'watt', 'wattage', 'wattage/mtr', 'power'] },
  { key: 'dimensions',       label: 'Dimensions', kind: 'text', synonyms: ['dimension', 'dimensions', 'size'] },
  { key: 'cutout_size',      label: 'Cutout size', header: 'Cutout Size', kind: 'text', synonyms: ['cutout size', 'cut out size', 'cutout', 'cut-out'] },
  { key: 'body_colors',      label: 'Body colors', header: 'Body Color', kind: 'list', sep: '/', synonyms: ['body color', 'body colour', 'body colors', 'body colours', 'finish'] },
  { key: 'cct',              label: 'CCT', header: 'CCT (K)', kind: 'list', sep: '/', synonyms: ['cct (k)', 'cct', 'colour temperature', 'color temperature'] },
  { key: 'beam_angle',       label: 'Beam angle', header: 'Beam Angle', kind: 'text', synonyms: ['beam angle', 'beam'] },
  { key: 'ip_rating',        label: 'IP rating', header: 'IP Rating', kind: 'text', synonyms: ['ip rating', 'ip'] },
  { key: 'led_chip',         label: 'LED chip (Powered by)', header: 'Powered by', kind: 'text', synonyms: ['powered by', 'led chip', 'chip'] },
  { key: 'luminous',         label: 'Luminous', kind: 'text', synonyms: ['luminous', 'lumens', 'lumen', 'luminous flux'] },
  { key: 'cri',              label: 'CRI', kind: 'text', synonyms: ['cri'] },
  { key: 'hero_image',       label: 'Main image URL', header: 'Hero Image', kind: 'text', synonyms: ['hero image', 'image', 'image link', 'image url', 'photo'] },
  { key: 'gallery_images',   label: 'Gallery image URLs', header: 'Gallery Images', kind: 'list', sep: ' | ', synonyms: ['gallery images', 'gallery'] },
  { key: 'hero_description', label: 'Description (Product overview)', header: 'Product Overview', kind: 'text', synonyms: ['product overview', 'hero description', 'description', 'overview'] },
]
export const FIELD_BY_KEY = new Map(FIELDS.map(f => [f.key, f]))

/** What a sheet heading is mapped to in the UI. */
export type ColumnTarget =
  | { type: 'ignore' }
  | { type: 'id' }
  | { type: 'action' }
  | { type: 'field'; key: string }
  | { type: 'spec' }   // extra spec, named after the heading
  | { type: 'price' }  // extra price key, named after the heading

export const normHeading = (h: string) => h.trim().replace(/\s+/g, ' ').toLowerCase()

/** Best guess for a heading — used to pre-fill the mapping. */
export function suggestTarget(heading: string): ColumnTarget {
  const h = normHeading(heading)
  if (!h || h.startsWith('__empty')) return { type: 'ignore' }
  if (h.startsWith(SPEC_PREFIX)) return { type: 'spec' }
  if (h === 'id') return { type: 'id' }
  if (h === 'action') return { type: 'action' }
  if (/^(s\.? ?no\.?|sr\.? ?no\.?|sl\.? ?no\.?|#|no\.?|serial( no\.?)?)$/.test(h)) return { type: 'ignore' }
  const field = FIELDS.find(f => f.synonyms.includes(h))
  if (field) return { type: 'field', key: field.key }
  if (/^d\.?p\.?\s*\(/.test(h)) return { type: 'price' }
  // Driver option prices (RF+BLE, Phasecut, DT6, DT8).
  if ((DRIVER_OPTIONS as readonly string[]).includes(canonicalPriceKey(heading))) return { type: 'price' }
  return { type: 'spec' }
}

/** Heading text → spec/price name ("spec: Material" → "Material"). */
export const specName = (heading: string) => heading.trim().replace(/^spec\s*:\s*/i, '')

/** Placeholder cells that mean "nothing here" — treated as blank. */
export function isPlaceholder(v: string): boolean {
  const s = v.trim().toLowerCase()
  return s === '' || s === '-' || s === '—' || s === '–' || s === 'n/a' || s === 'na'
}

export const isClear = (v: string) => v.trim().toUpperCase() === CLEAR_TOKEN

/** Splits a list cell. Colours / CCT also split on "/" ("White/Black", "3000K/4000K"). */
export function splitFieldList(key: string, v: string): string[] {
  const re = key === 'gallery_images' ? /\s*\|\s*|\n/ : key === 'zones' ? /[,|;\n]/ : /[\/,|;\n]/
  return v.split(re).map(s => s.trim()).filter(Boolean)
}

/** One product row sent to the server: data key → cell text. Keys are field
 * keys, "id", "action", SPEC_PREFIX + name or PRICE_PREFIX + name. */
export type BulkRow = Record<string, string>

export interface BulkInputRow {
  /** Unique within one upload (also the React key). */
  row: number
  sheet: string
  /** Row number inside its sheet, for messages. */
  line: number
  data: BulkRow
}

export interface BulkOptions {
  /** Create categories (from sheet names / the category column) that don't exist yet. */
  createCategories: boolean
  /** Main category (collection) given to categories created by the upload. */
  newCategoryCollection: string | null
  /** Also move existing products to the category in the file (else only new products get it). */
  categoryForExisting: boolean
}

export type BulkStatus = 'create' | 'update' | 'unchanged' | 'delete' | 'error'

export interface BulkChange {
  field: string
  from: string
  to: string
}

export interface BulkPlanItem {
  row: number
  sheet: string
  line: number
  status: BulkStatus
  model: string
  productId?: string
  changes?: BulkChange[]
  errors?: string[]
  warnings?: string[]
}

export const MAX_BULK_ROWS = 5000
/** Rows per apply request — keeps each request well inside function time limits. */
export const BULK_APPLY_CHUNK = 20
