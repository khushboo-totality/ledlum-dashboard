// What a partner has to choose for a product on a quote — client-safe. The
// choices are snapshotted onto the cart line when it's added (cartOptions)
// and picked in the quote cart.
//
//  - Price option: every price the product has in ledlum_product_prices —
//    "D.P." plus driver variants (RF+BLE, Phasecut, DT6, DT8) and any other
//    price columns ("D.P. (2 Mtr)" …). With more than one, one must be picked;
//    the quote line is priced at that option.
//  - Spec choices: spec columns holding several values ("3000K/4000K",
//    "15°/24°/36°", "White/Black") — one value must be picked from each.
import type { Product, CartItem, CartItemOptions, CartPriceOption, CartSelection, CartSpecChoice } from '@/types'

export const DP_KEY = 'D.P.'
/** Driver / control price columns, in display order (after D.P.). */
export const DRIVER_OPTIONS = ['RF+BLE', 'Phasecut', 'DT6', 'DT8'] as const
/** Cart selection key holding the chosen price option. */
export const OPTION_KEY = 'option'

const squash = (s: string) => s.replace(/[\s_-]+/g, '').toLowerCase()

/** "Phase Cut" / "rf + ble" → the canonical driver name; anything else trimmed as is. */
export function canonicalPriceKey(name: string): string {
  return DRIVER_OPTIONS.find(o => squash(o) === squash(name)) ?? name.trim()
}

export type PriceOption = CartPriceOption

/** Display order of price keys: D.P. first, then drivers, then the rest. */
function priceRank(k: string) {
  return k === DP_KEY ? 0 : (DRIVER_OPTIONS as readonly string[]).includes(k) ? 1 + DRIVER_OPTIONS.indexOf(k as typeof DRIVER_OPTIONS[number]) : 99
}
const byPriceRank = (a: string, b: string) => priceRank(a) - priceRank(b) || a.localeCompare(b, undefined, { numeric: true })

/** The product's prices as options: D.P. first, then drivers, then the rest. */
export function priceOptions(product: Pick<Product, 'prices'>): PriceOption[] {
  return Object.entries(product.prices ?? {})
    .map(([key, price]) => ({ key, price }))
    .sort((a, b) => byPriceRank(a.key, b.key))
}

/** Which price a quote line is priced at — its picked option, else D.P. */
export const priceKeyOf = (selection: CartSelection | undefined) => selection?.[OPTION_KEY] || DP_KEY

/** The distinct price keys of some quote lines, in display order — one price
 * column each in the BOQ / emails, so every line's rate sits under its option. */
export function priceColumns(selections: (CartSelection | undefined)[]): string[] {
  return sortPriceKeys(selections.map(priceKeyOf))
}

/** Distinct price keys in display order; [D.P.] when there are none. */
export function sortPriceKeys(keys: string[]): string[] {
  const out = Array.from(new Set(keys)).sort(byPriceRank)
  return out.length ? out : [DP_KEY]
}

/** key = cart selection key — matches lib/cartSpecs.ts SELECTION_TO_COLUMN so the BOQ shows the pick. */
export type SpecChoice = CartSpecChoice

const isPlaceholder = (v: string) => /^(-|—|–|n\/?a)?$/i.test(v.trim())

/**
 * "15°/24°/36°" → 3 values. A value stays whole when splitting would give
 * something that isn't a choice: "10°V/65°H" (one asymmetric beam), and for
 * numeric specs any part without a digit ("150W/m", "15W P/M" are per metre).
 */
function splitValues(raw: string | string[] | null | undefined, numeric: boolean): string[] {
  const parts = (Array.isArray(raw) ? raw : raw ? [raw] : []).flatMap(v => {
    if (isPlaceholder(v)) return []
    if (/°\s*[VH]\b/i.test(v)) return [v]
    const split = v.split(/\s*\/\s*/).map(p => p.trim())
    return split.some(p => isPlaceholder(p) || (numeric && !/\d/.test(p))) ? [v.trim()] : split
  })
  return Array.from(new Set(parts.filter(p => !isPlaceholder(p))))
}

const extraSpec = (p: Product, name: string) =>
  Object.entries(p.extra_specs ?? {}).find(([k]) => k.toLowerCase() === name.toLowerCase())?.[1]

const CHOICE_FIELDS: { key: string; label: string; numeric: boolean; get: (p: Product) => string | string[] | null | undefined }[] = [
  { key: 'watts',          label: 'Wattage',                  numeric: true,  get: p => p.watts },
  { key: 'cct',            label: 'Colour temperature (CCT)', numeric: true,  get: p => p.cct },
  { key: 'beamAngles',     label: 'Beam angle',               numeric: true,  get: p => p.beam_angle },
  { key: 'bodyColor',      label: 'Body colour',              numeric: false, get: p => p.body_colors },
  { key: 'reflectorColor', label: 'Reflector colour',         numeric: false, get: p => extraSpec(p, 'Reflector Color') },
  { key: 'cri',            label: 'CRI',                      numeric: true,  get: p => p.cri },
  { key: 'ipRating',       label: 'IP rating',                numeric: true,  get: p => p.ip_rating },
]

/** Spec columns with more than one value to choose from. */
export function specChoices(product: Product): SpecChoice[] {
  return CHOICE_FIELDS
    .map(f => ({ key: f.key, label: f.label, values: splitValues(f.get(product), f.numeric) }))
    .filter(c => c.values.length > 1)
}

/** The choices to snapshot onto a new cart line; undefined when there's nothing to pick. */
export function cartOptions(product: Product): CartItemOptions | undefined {
  const prices = priceOptions(product)
  const specs = specChoices(product)
  if (prices.length <= 1 && specs.length === 0) return undefined
  return { prices: prices.length > 1 ? prices : [], specs }
}

/** Labels of the choices still missing on a cart line ([] = ready to quote). */
export function missingChoices(item: Pick<CartItem, 'options' | 'selection'>): string[] {
  if (!item.options) return []
  return [
    ...(item.options.prices.length > 1 && !item.selection[OPTION_KEY] ? ['Option'] : []),
    ...item.options.specs.filter(c => !item.selection[c.key]).map(c => c.label),
  ]
}

/** Price for a new cart line: unknown (null) until a price option is picked, when there are several. */
export function initialUnitPrice(product: Product): number | null {
  return priceOptions(product).length > 1 ? null : selectedUnitPrice(product, {})
}

/** Unit price for a selection: the chosen option's price, else the only/D.P. price. */
export function selectedUnitPrice(product: Pick<Product, 'prices'>, selection: CartSelection): number | null {
  const opts = priceOptions(product)
  const chosen = selection[OPTION_KEY]
  if (chosen) return opts.find(o => o.key === chosen)?.price ?? null
  return opts.length === 1 ? opts[0].price : product.prices?.[DP_KEY] ?? null
}
