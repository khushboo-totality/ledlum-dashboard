// Turns a raw ledlum_products row into display columns for the PDFs — the
// column set and titles come from the table itself, so a new DB column shows
// up in the BOQ/data sheet without code changes. Client-safe (no server deps).

// Never shown as a PDF column. hero_image is the image column, extra_specs is
// expanded into one column per key instead, id is internal.
export const EXCLUDED_COLUMNS = new Set([
  'id',
  'family',
  'group_name',
  'hero_description',
  'gallery_images',
  'website',
  'created_at',
  'hero_image',
  'extra_specs',
])

const ACRONYMS = new Set(['ip', 'cct', 'cri', 'led', 'id', 'mrp', 'ugr', 'dali', 'rgb', 'rgbw'])

/** `beam_angle` → "Beam Angle", `ip_rating` → "IP Rating", "Material" → "Material". */
export function formatColumnTitle(key: string): string {
  return key
    .split(/[_\s]+/)
    .filter(Boolean)
    .map(w => ACRONYMS.has(w.toLowerCase()) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

/** Display string for a cell, or undefined when there's nothing worth showing. */
export function formatColumnValue(v: unknown): string | undefined {
  if (v === null || v === undefined) return undefined
  if (Array.isArray(v)) {
    const parts = v.map(formatColumnValue).filter((p): p is string => !!p)
    return parts.length ? parts.join(', ') : undefined
  }
  if (typeof v === 'object') return undefined
  const s = String(v).trim()
  if (!s || s === '-' || s === '—' || s.toUpperCase() === 'N/A') return undefined
  return s
}

/** Raw DB row → { column_name: display value }, in table column order. */
export function toDisplayAttributes(row: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(row)) {
    if (EXCLUDED_COLUMNS.has(key)) continue
    const v = formatColumnValue(value)
    if (v) out[key] = v
  }
  return out
}

/** extra_specs JSON → { key: value } with empty/N/A values dropped. */
export function toDisplaySpecs(specs?: Record<string, unknown> | null): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(specs ?? {})) {
    const v = formatColumnValue(value)
    if (v) out[key] = v
  }
  return out
}
