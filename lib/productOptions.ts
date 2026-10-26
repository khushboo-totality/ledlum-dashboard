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
import type { Product, CartItem, CartItemOptions, CartPriceOption, CartSelection, CartSpecChoice, ProductVariant } from '@/types'

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

// ── Variants (a model the price list repeats on several rows) ──────────
//
// The partner picks the columns that tell the rows apart (Accessory, finish,
// Product Type, Feature …); the picks select one variant and its price.
// Columns that merely follow from the variant (dimensions, cut-out) are not
// asked — they're filled in from the matched variant.

const NONE = 'None'
/** Variant columns that follow from the pick rather than being picked. */
const FOLLOWS = new Set(['dimensions', 'cutout_size'])
/** Variant columns only shown on the variant's own card, never picked or put on a quote. */
const DISPLAY_ONLY = new Set(['hero_description'])
/** Cart selection key naming the variant of a catalogue card that shows one variant. */
export const VARIANT_KEY = 'variant'
/** Variant attribute → cart selection key (lib/cartSpecs.ts maps these onto BOQ columns). */
const ATTR_SELECTION_KEY: Record<string, string> = {
  body_colors: 'bodyColor', cct: 'cct', beam_angle: 'beamAngles', watts: 'watts', ip_rating: 'ipRating',
  cri: 'cri', cutout_size: 'cutoutSizes', dimensions: 'dimensions', led_chip: 'ledChip', luminous: 'luminous',
  product_type: 'productType',
}
const ATTR_LABEL: Record<string, string> = {
  body_colors: 'Finish', product_type: 'Type', cct: 'Colour temperature (CCT)', beam_angle: 'Beam angle',
  watts: 'Wattage', ip_rating: 'IP rating', cri: 'CRI', led_chip: 'LED chip', luminous: 'Luminous',
}
const VERSION_KEY = 'version'
const attrSelectionKey = (attr: string) => ATTR_SELECTION_KEY[attr] ?? attr.replace(/^spec:/, '')
const attrValue = (raw: string | undefined) => (raw && !isPlaceholder(raw) ? raw.trim() : NONE)
const versionName = (i: number) => `Version ${i + 1}`

/** The choices that select a variant: one per column that differs between them
 * (a single "Version" choice when only the price differs). */
export function variantChoices(variants: ProductVariant[]): CartSpecChoice[] {
  const attrs = Array.from(new Set(variants.flatMap(v => Object.keys(v.attributes))))
    .filter(a => !FOLLOWS.has(a) && !DISPLAY_ONLY.has(a) && new Set(variants.map(v => attrValue(v.attributes[a]))).size > 1)
  if (attrs.length === 0) {
    return [{ key: VERSION_KEY, label: 'Version', values: variants.map((_, i) => versionName(i)), variantAttr: '' }]
  }
  return attrs.map(a => ({
    key: attrSelectionKey(a),
    label: ATTR_LABEL[a] ?? a.replace(/^spec:/, ''),
    values: Array.from(new Set(variants.map(v => attrValue(v.attributes[a])))),
    variantAttr: a,
  }))
}

const variantHas = (v: ProductVariant, i: number, c: CartSpecChoice, value: string) =>
  c.variantAttr ? attrValue(v.attributes[c.variantAttr]) === value : versionName(i) === value

/** Variants consistent with the picks made so far (ignoring `skipKey`). */
function candidates(variants: ProductVariant[], choices: CartSpecChoice[], selection: CartSelection, skipKey?: string) {
  return variants
    .map((v, i) => ({ v, i }))
    .filter(({ v, i }) => choices.every(c =>
      c.variantAttr === undefined || c.key === skipKey || !selection[c.key] || variantHas(v, i, c, selection[c.key])))
}

/** The variant the picks point to — only once every variant choice is made. */
export function matchVariant(variants: ProductVariant[], choices: CartSpecChoice[], selection: CartSelection): ProductVariant | null {
  const vc = choices.filter(c => c.variantAttr !== undefined)
  if (vc.some(c => !selection[c.key])) return null
  const found = candidates(variants, vc, selection)
  return found.length === 1 ? found[0].v : null
}

/** Values of a variant choice still possible given the other picks (others are greyed out). */
export function availableValues(variants: ProductVariant[], choices: CartSpecChoice[], selection: CartSelection, choice: CartSpecChoice): Set<string> {
  const out = new Set<string>()
  for (const { v, i } of candidates(variants, choices, selection, choice.key)) {
    for (const value of choice.values) if (variantHas(v, i, choice, value)) out.add(value)
  }
  return out
}

/** Short name of a variant from its distinguishing values, e.g. "Honeycomb Louvre · Black Chrome / Chrome / Bronze". */
export function variantLabel(variants: ProductVariant[], v: ProductVariant): string {
  const i = variants.indexOf(v)
  // "None" parts (e.g. no accessory) are left out; "Standard" if nothing is left.
  return variantChoices(variants)
    .map(c => (c.variantAttr ? attrValue(v.attributes[c.variantAttr]) : versionName(i)))
    .filter(part => part !== NONE)
    .join(' · ') || 'Standard'
}

/**
 * After a pick: the selection with the matched variant's follow-on values
 * (dimensions, cut-out) filled in — or cleared while no variant matches —
 * and the line's unit price (null until the variant and price option are known).
 */
export function resolveVariantSelection(options: CartItemOptions, selection: CartSelection): { selection: CartSelection; unitPrice: number | null } {
  const variants = options.variants ?? []
  const out = { ...selection }
  for (const v of variants) for (const a of Object.keys(v.attributes)) if (FOLLOWS.has(a)) delete out[attrSelectionKey(a)]
  const v = matchVariant(variants, options.specs, out)
  if (!v) return { selection: out, unitPrice: null }
  for (const [a, raw] of Object.entries(v.attributes)) {
    if (FOLLOWS.has(a) && !isPlaceholder(raw)) out[attrSelectionKey(a)] = raw.trim()
  }
  return { selection: out, unitPrice: priceFrom(v.prices, out) }
}

/** A price from one price map: the picked option, else its only price, else D.P. */
function priceFrom(prices: Record<string, number>, selection: CartSelection): number | null {
  const chosen = selection[OPTION_KEY]
  if (chosen) return prices[chosen] ?? null
  const keys = Object.keys(prices)
  return keys.length === 1 ? prices[keys[0]] : prices[DP_KEY] ?? null
}

const hasVariants = (p: Pick<Product, 'variants'>) => (p.variants?.length ?? 0) > 1

/**
 * The catalogue shows every row of a repeated model as its own product card:
 * one Product per variant, carrying that row's finish, accessory, dimensions,
 * description and prices. Cards point back to the real product (variantOf)
 * and name their variant in variantSelection, so the quote is priced at it.
 * Products without variants come back unchanged.
 */
export function expandVariants(product: Product): Product[] {
  if (!hasVariants(product)) return [product]
  const vs = product.variants!
  return vs.map((v, i) => {
    const name = variantLabel(vs, v)
    const out: Product = {
      ...product,
      id: `${product.id}~${i + 1}`,
      variantOf: product.id,
      variantName: name,
      variantSelection: { [VARIANT_KEY]: name },
      variants: null,
      prices: Object.keys(v.prices).length ? v.prices : product.prices,
      attributes: product.attributes ? { ...product.attributes } : undefined,
      extra_specs: { ...(product.extra_specs ?? {}) },
    }
    const fields = out as unknown as Record<string, unknown>
    for (const [a, raw] of Object.entries(v.attributes)) {
      const val = isPlaceholder(raw) ? '' : raw.trim()
      if (a.startsWith('spec:')) {
        const k = a.slice(5)
        if (val) out.extra_specs![k] = val
        else delete out.extra_specs![k]
        continue
      }
      if (a === 'body_colors' || a === 'cct') fields[a] = val ? val.split(/\s*\/\s*/) : []
      else if (a === 'dimensions') out.Dimensions = val || undefined
      else if (a === 'hero_description') { out.hero_description = val || null; out.Description = val || undefined }
      else if (a !== 'category') fields[a] = val || null
      if (a === 'body_colors') out.Finish = val || undefined
      // BOQ / data-sheet columns (hero_description isn't one).
      if (out.attributes && a !== 'hero_description') {
        if (val) out.attributes[a] = val
        else delete out.attributes[a]
      }
    }
    return out
  })
}

/** The choices to snapshot onto a new cart line; undefined when there's nothing to pick. */
export function cartOptions(product: Product): CartItemOptions | undefined {
  const variants = hasVariants(product) ? product.variants! : undefined
  const vChoices = variants ? variantChoices(variants) : []
  const taken = new Set(vChoices.map(c => c.key))
  const specs = [...vChoices, ...specChoices(product).filter(c => !taken.has(c.key))]
  // With variants, the price options are every price key any variant has
  // (shown "from" the lowest until the variant is known).
  const prices: PriceOption[] = variants
    ? sortPriceKeys(variants.flatMap(v => Object.keys(v.prices))).flatMap(key => {
        const ps = variants.map(v => v.prices[key]).filter((n): n is number => typeof n === 'number')
        return ps.length ? [{ key, price: Math.min(...ps) }] : []
      })
    : priceOptions(product)
  if (prices.length <= 1 && specs.length === 0) return undefined
  return { prices: prices.length > 1 ? prices : [], specs, ...(variants ? { variants } : {}) }
}

/** Labels of the choices still missing on a cart line ([] = ready to quote). */
export function missingChoices(item: Pick<CartItem, 'options' | 'selection'>): string[] {
  if (!item.options) return []
  return [
    ...(item.options.prices.length > 1 && !item.selection[OPTION_KEY] ? ['Option'] : []),
    ...item.options.specs.filter(c => !item.selection[c.key]).map(c => c.label),
  ]
}

/** Price for a new cart line: unknown (null) until the variant / price option is picked, when there are several. */
export function initialUnitPrice(product: Product): number | null {
  return hasVariants(product) || priceOptions(product).length > 1 ? null : selectedUnitPrice(product, {})
}

/** Unit price for a selection — the matched variant's price when the product
 * has variants, else the chosen option's price, else the only/D.P. price.
 * Used by the server to price quote lines, so it never trusts the client. */
export function selectedUnitPrice(product: Pick<Product, 'prices' | 'variants'>, selection: CartSelection): number | null {
  if (hasVariants(product)) {
    const vs = product.variants!
    // Added from a variant's own catalogue card: the selection names the variant.
    const v = selection[VARIANT_KEY]
      ? vs.find(x => variantLabel(vs, x) === selection[VARIANT_KEY]) ?? null
      : matchVariant(vs, variantChoices(vs), selection)
    return v ? priceFrom(v.prices, selection) : null
  }
  return priceFrom(product.prices ?? {}, selection)
}
