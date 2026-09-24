import type { Product, CartProductSpecs } from '@/types'
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
