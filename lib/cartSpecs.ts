import type { Product, CartProductSpecs } from '@/types'

// Flattens a product's free-form extra_specs (e.g. { Material: 'Aluminium',
// Protocol: 'DALI' }) into a single "Key: Value; Key: Value" string for the
// BOQ's Specifications column — the keys vary too much per product family to
// justify their own fixed table columns.
export function formatExtraSpecs(specs?: Record<string, string> | null): string | undefined {
  if (!specs) return undefined
  const parts = Object.entries(specs)
    .filter(([, v]) => v && v !== 'N/A')
    .map(([k, v]) => `${k}: ${v}`)
  return parts.length ? parts.join('; ') : undefined
}

// Snapshots a product's real Supabase spec fields for the cart/BOQ export —
// called at add-to-cart time so later edits to the catalog don't change a
// quote that's already been built.
export function toCartProductSpecs(product: Product): CartProductSpecs {
  return {
    watts: product.watts ?? undefined,
    beamAngle: product.beam_angle ?? undefined,
    cct: product.cct?.length ? product.cct.join('/') : undefined,
    bodyColors: product.body_colors?.length ? product.body_colors.join('/') : undefined,
    ipRating: product.ip_rating ?? undefined,
    ledChip: product.led_chip ?? undefined,
    luminous: product.luminous ?? undefined,
    cri: product.cri ?? undefined,
    family: product.family ?? undefined,
    collection: product.collection,
    website: product.website ?? undefined,
    extraSpecs: product.extra_specs ?? undefined,
  }
}
