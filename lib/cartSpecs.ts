import type { Product, CartProductSpecs } from '@/types'

// Snapshots a product's real Supabase spec fields for the cart/BOQ export —
// called at add-to-cart time so later edits to the catalog don't change a
// quote that's already been built.
export function toCartProductSpecs(product: Product): CartProductSpecs {
  return {
    watts: product.watts ?? undefined,
    beamAngle: product.beam_angle ?? undefined,
    cct: product.cct?.length ? product.cct.join('/') : undefined,
    bodyColors: product.body_colors?.length ? product.body_colors.join('/') : undefined,
  }
}
