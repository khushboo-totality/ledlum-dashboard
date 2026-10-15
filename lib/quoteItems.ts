// Server-side: parsing + email rendering of partner quote lines — shared by
// /api/quote-request (Send quote) and /api/boq-download (BOQ download alert).
import { EMAIL, escapeHtml } from '@/lib/email'
import { getPricesForModels, DP_KEY } from '@/lib/services/products'

export const MAX_ITEMS = 200

export interface QuoteItem {
  productCode: string
  productName: string
  context: string
  quantity: number
  selection: Record<string, string>
  /** Partner's discount on this line, percent 0–100. */
  discount: number
  /** D.P. per unit — looked up server-side from ledlum_product_prices (never trusted from the client). */
  unitPrice: number | null
  /** Display-only snapshot for re-downloading the BOQ later. */
  productImage?: string
  productSpecs?: { attributes: Record<string, string>; extraSpecs: Record<string, string> }
}

/** Flat string map, capped — for the product spec snapshot. */
function stringMap(raw: unknown, maxKeys = 80): Record<string, string> {
  const out: Record<string, string> = {}
  if (!raw || typeof raw !== 'object') return out
  for (const [k, v] of Object.entries(raw as Record<string, unknown>).slice(0, maxKeys)) {
    if (typeof v === 'string' || typeof v === 'number') out[String(k).slice(0, 100)] = String(v).slice(0, 500)
  }
  return out
}

const cleanText = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

export function parseProject(raw: unknown) {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  return {
    projectName:   cleanText(o.projectName, 200),
    location:      cleanText(o.location, 200),
    architectName: cleanText(o.architectName, 200),
    architectPan:  cleanText(o.architectPan, 20).toUpperCase(),
  }
}

const round2 = (n: number) => Math.round(n * 100) / 100
export const inr = (n: number) =>
  `₹${n.toLocaleString('en-IN', { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })}`

function linePricing(item: QuoteItem) {
  if (item.unitPrice === null) return null
  const net = round2(item.unitPrice * (1 - item.discount / 100))
  return { net, gross: round2(item.unitPrice * item.quantity), total: round2(net * item.quantity) }
}

export function parseItems(raw: unknown): QuoteItem[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_ITEMS) return null
  const items: QuoteItem[] = []
  for (const r of raw) {
    if (!r || typeof r !== 'object') return null
    const o = r as Record<string, unknown>
    const quantity = Number(o.quantity)
    if (typeof o.productCode !== 'string' || !Number.isFinite(quantity) || quantity < 1) return null
    const selection: Record<string, string> = {}
    if (o.selection && typeof o.selection === 'object') {
      for (const [k, v] of Object.entries(o.selection as Record<string, unknown>)) {
        if (typeof v === 'string' && v) selection[k] = v
      }
    }
    const discount = Number(o.discount)
    items.push({
      productCode: o.productCode.slice(0, 200),
      productName: (typeof o.productName === 'string' ? o.productName : o.productCode).slice(0, 200),
      context:     typeof o.context === 'string' ? o.context.slice(0, 300) : '',
      quantity:    Math.min(Math.floor(quantity), 1_000_000),
      selection,
      discount:    Number.isFinite(discount) ? Math.min(100, Math.max(0, discount)) : 0,
      unitPrice:   null, // filled from the price table by applyPrices
      productImage: typeof o.productImage === 'string' && /^https?:\/\//i.test(o.productImage) ? o.productImage.slice(0, 1000) : undefined,
      productSpecs: o.productSpecs && typeof o.productSpecs === 'object'
        ? {
            attributes: stringMap((o.productSpecs as Record<string, unknown>).attributes),
            extraSpecs: stringMap((o.productSpecs as Record<string, unknown>).extraSpecs),
          }
        : undefined,
    })
  }
  return items
}

/** Fills each line's authoritative D.P. from ledlum_product_prices (by model).
 * On lookup failure the lines stay unpriced rather than failing the request. */
export async function applyPrices(items: QuoteItem[], tag: string): Promise<void> {
  try {
    const prices = await getPricesForModels(items.map(i => i.productCode))
    for (const item of items) item.unitPrice = prices.get(item.productCode)?.[DP_KEY] ?? null
  } catch (err) {
    console.error(`[${tag}] price lookup failed:`, err)
  }
}

// Spec keys for display — short ones are acronyms (cct → CCT, cri → CRI).
const cap = (s: string) => (s.length <= 3 ? s.toUpperCase() : s.charAt(0).toUpperCase() + s.slice(1))

export function quoteTotals(items: QuoteItem[]) {
  let gross = 0, net = 0, unpriced = 0
  for (const item of items) {
    const p = linePricing(item)
    if (!p) { unpriced++; continue }
    gross += p.gross; net += p.total
  }
  return { gross: round2(gross), net: round2(net), discount: round2(gross - net), unpriced, hasPrices: gross > 0 }
}

// ── Email blocks (inline styles only — email clients drop <style>) ──

const F = `font-family:${EMAIL.font};`

/** Small uppercase section heading. */
export const sectionTitle = (label: string) =>
  `<div style="${F}margin:28px 0 10px;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${EMAIL.gold};">${escapeHtml(label)}</div>`

/** Products / Units / Value tiles. */
export function summaryStats(items: QuoteItem[]): string {
  const t = quoteTotals(items)
  const units = items.reduce((s, i) => s + i.quantity, 0)
  const tile = (label: string, value: string, sub = '') => `
    <td width="33%" valign="top" style="padding:16px 18px;background:${EMAIL.soft};border:1px solid ${EMAIL.line};border-radius:10px;">
      <div style="${F}font-size:11px;letter-spacing:1px;text-transform:uppercase;color:${EMAIL.muted};">${label}</div>
      <div style="${F}margin-top:6px;font-size:20px;font-weight:700;color:${EMAIL.ink};white-space:nowrap;">${value}</div>
      ${sub ? `<div style="${F}margin-top:2px;font-size:11px;color:${EMAIL.faint};">${sub}</div>` : ''}
    </td>`
  const gap = '<td width="10" style="font-size:0;">&nbsp;</td>'
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;"><tr>
    ${tile('Products', String(items.length))}${gap}
    ${tile('Units', units.toLocaleString('en-IN'))}${gap}
    ${tile('Value', t.hasPrices ? inr(t.net) : 'On request', t.hasPrices ? 'excl. GST' : '')}
  </tr></table>`
}

/** Label/value row — goes inside detailsTable(). */
export const detailRow = (label: string, value: string) =>
  `<tr>
    <td valign="top" style="${F}padding:10px 16px;width:130px;font-size:13px;color:${EMAIL.muted};border-bottom:1px solid ${EMAIL.line};">${label}</td>
    <td valign="top" style="${F}padding:10px 16px;font-size:14px;font-weight:600;color:${EMAIL.ink};border-bottom:1px solid ${EMAIL.line};">${value}</td>
  </tr>`

/** Bordered card around detailRow()s. */
export const detailsTable = (rows: string) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${EMAIL.line};border-radius:10px;border-collapse:separate;overflow:hidden;">${rows}</table>`

/** Project / location / architect rows — only the ones filled in. */
export function projectRows(project: ReturnType<typeof parseProject>): string {
  return (project.projectName ? detailRow('Project', escapeHtml(project.projectName)) : '') +
    (project.location ? detailRow('Location', escapeHtml(project.location)) : '') +
    (project.architectName ? detailRow('Architect', escapeHtml(project.architectName)) : '') +
    (project.architectPan ? detailRow('Architect PAN', escapeHtml(project.architectPan)) : '')
}

/** Highlighted note (partner's message). */
export const noteBox = (label: string, text: string) =>
  `<div style="${F}margin-top:20px;padding:14px 16px;background:${EMAIL.soft};border-left:3px solid ${EMAIL.gold};border-radius:4px;font-size:14px;line-height:1.6;color:${EMAIL.ink};white-space:pre-wrap;"><strong style="display:block;margin-bottom:4px;font-size:12px;color:${EMAIL.muted};">${escapeHtml(label)}</strong>${escapeHtml(text)}</div>`

export function itemsTable(items: QuoteItem[]): string {
  const td = `${F}padding:14px 10px;border-bottom:1px solid ${EMAIL.line};vertical-align:top;font-size:13px;color:${EMAIL.ink};`
  const num = `${td}text-align:right;white-space:nowrap;`
  const chip = `display:inline-block;margin:6px 4px 0 0;padding:3px 8px;background:${EMAIL.page};border-radius:4px;font-size:11px;color:#555555;`

  const rows = items.map((item, i) => {
    const specs = Object.entries(item.selection)
      .map(([k, v]) => `<span style="${chip}">${escapeHtml(cap(k))}: <strong>${escapeHtml(v)}</strong></span>`)
      .join('')
    const p = linePricing(item)
    return `<tr>
      <td style="${td}color:${EMAIL.faint};width:18px;">${i + 1}</td>
      <td style="${td}">
        <div style="font-size:14px;font-weight:700;">${escapeHtml(item.productName)}</div>
        ${item.productName !== item.productCode ? `<div style="margin-top:2px;font-size:12px;color:${EMAIL.muted};">${escapeHtml(item.productCode)}</div>` : ''}
        ${item.context ? `<div style="margin-top:2px;font-size:12px;color:${EMAIL.faint};">${escapeHtml(item.context)}</div>` : ''}
        ${specs ? `<div>${specs}</div>` : ''}
      </td>
      <td style="${num}font-weight:700;">${item.quantity}</td>
      <td style="${num}">${item.unitPrice === null ? `<span style="color:${EMAIL.faint};">On request</span>` : inr(item.unitPrice)}</td>
      <td style="${num}">${item.discount ? `${item.discount}%` : `<span style="color:${EMAIL.faint};">—</span>`}</td>
      <td style="${num}font-weight:700;">${p ? inr(p.total) : `<span style="color:${EMAIL.faint};">—</span>`}</td>
    </tr>`
  }).join('')

  const th = `${F}padding:10px;background:${EMAIL.soft};border-bottom:1px solid ${EMAIL.line};text-align:left;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${EMAIL.muted};`
  const thR = `${th}text-align:right;`
  const table = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
    <tr><th style="${th}">#</th><th style="${th}">Product</th><th style="${thR}">Qty</th><th style="${thR}">D.P.</th><th style="${thR}">Disc</th><th style="${thR}">Total</th></tr>
    ${rows}
  </table>`

  const t = quoteTotals(items)
  if (!t.hasPrices) return table
  const line = (label: string, value: string) =>
    `<tr><td style="${F}padding:4px 10px;text-align:right;font-size:13px;color:${EMAIL.muted};">${label}</td>
      <td style="${F}padding:4px 10px;text-align:right;font-size:13px;color:${EMAIL.ink};white-space:nowrap;width:120px;">${value}</td></tr>`
  return `${table}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:10px;">
    ${line('Subtotal (D.P.)', inr(t.gross))}
    ${t.discount > 0 ? line('Discount', `− ${inr(t.discount)}`) : ''}
    <tr><td style="${F}padding:12px 10px 4px;text-align:right;font-size:14px;font-weight:700;color:${EMAIL.ink};border-top:2px solid ${EMAIL.ink};">Total <span style="font-weight:400;color:${EMAIL.muted};">(excl. GST)</span></td>
      <td style="${F}padding:12px 10px 4px;text-align:right;font-size:18px;font-weight:700;color:${EMAIL.gold};white-space:nowrap;border-top:2px solid ${EMAIL.ink};">${inr(t.net)}</td></tr>
    ${t.unpriced ? `<tr><td colspan="2" style="${F}padding:6px 10px 0;text-align:right;font-size:12px;color:${EMAIL.faint};">${t.unpriced} item${t.unpriced === 1 ? '' : 's'} without a price not included</td></tr>` : ''}
  </table>`
}

