import type { Product, CartProductSpecs, CartItem } from '@/types'

/** D.P. (₹) to snapshot onto a cart item; null when the product has none. */
export function productDp(product: Product): number | null {
  return product.prices?.['D.P.'] ?? null
}

const round2 = (n: number) => Math.round(n * 100) / 100

/** Per-line pricing: unit D.P., discount %, net unit price after discount, line total. */
export function linePricing(item: Pick<CartItem, 'unitPrice' | 'discount' | 'quantity'>) {
  const unit = item.unitPrice ?? null
  const disc = Math.min(100, Math.max(0, item.discount ?? 0))
  const net  = unit === null ? null : round2(unit * (1 - disc / 100))
  return { unit, disc, net, total: net === null ? null : round2(net * item.quantity) }
}

/** Rupees, Indian grouping, no trailing .00 for whole amounts. */
export const formatInr = (n: number) =>
  `₹${n.toLocaleString('en-IN', { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })}`
import { toDisplaySpecs } from '@/lib/productColumns'

// Snapshots a product's DB columns + extra_specs for the cart/BOQ export —
// called at add-to-cart time so later edits to the catalog don't change a
// quote that's already been built. Legacy (unlinked) products have no
// attributes, so fall back to the little they do have.
export function toCartProductSpecs(product: Product): CartProductSpecs {
  return {
    attributes: product.attributes ?? { model: product.Codes, category: product.Category },
    extraSpecs: toDisplaySpecs(product.extra_specs),
  }
}

// Config-tab selection keys (productDetails.ts permutations) → the DB column
// they override in the BOQ. A deliberate pick beats the catalog default.
const SELECTION_TO_COLUMN: Record<string, string> = {
  watts: 'watts',
  beamAngles: 'beam_angle',
  bodyColor: 'body_colors',
  cct: 'cct',
  ipRating: 'ip_rating',
  cutoutSizes: 'cutout_size',
  ledChip: 'led_chip',
  luminous: 'luminous',
  cri: 'cri',
  dimensions: 'dimensions',
  voltage: 'voltage',
  models: 'model',
}

export function applySelection(attributes: Record<string, string>, selection: Record<string, string>): Record<string, string> {
  const out = { ...attributes }
  for (const [k, v] of Object.entries(selection)) {
    if (v) out[SELECTION_TO_COLUMN[k] ?? k] = v
  }
  return out
}
