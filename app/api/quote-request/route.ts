import { NextRequest, NextResponse } from 'next/server'
import { getCaller } from '@/lib/serverAuth'
import { getPermissions } from '@/lib/auth'
import { escapeHtml, sendEmail } from '@/lib/email'
import { logActivity } from '@/lib/activity'
import { getPricesForModels, DP_KEY } from '@/lib/services/products'

// Where partner quote requests go — same inbox as the LEDLUM website's quote form.
const QUOTE_TO = process.env.QUOTE_TO_EMAIL || 'projects@ledlumlighting.com'
const MAX_ITEMS = 200

interface QuoteItem {
  productCode: string
  productName: string
  context: string
  quantity: number
  selection: Record<string, string>
  /** Partner's discount on this line, percent 0–100. */
  discount: number
  /** D.P. per unit — looked up server-side from ledlum_product_prices (never trusted from the client). */
  unitPrice: number | null
}

const round2 = (n: number) => Math.round(n * 100) / 100
const inr = (n: number) =>
  `₹${n.toLocaleString('en-IN', { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })}`

function linePricing(item: QuoteItem) {
  if (item.unitPrice === null) return null
  const net = round2(item.unitPrice * (1 - item.discount / 100))
  return { net, gross: round2(item.unitPrice * item.quantity), total: round2(net * item.quantity) }
}

function parseItems(raw: unknown): QuoteItem[] | null {
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
      unitPrice:   null, // filled from the price table below
    })
  }
  return items
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

function quoteTotals(items: QuoteItem[]) {
  let gross = 0, net = 0, unpriced = 0
  for (const item of items) {
    const p = linePricing(item)
    if (!p) { unpriced++; continue }
    gross += p.gross; net += p.total
  }
  return { gross: round2(gross), net: round2(net), discount: round2(gross - net), unpriced, hasPrices: gross > 0 }
}

function itemsTable(items: QuoteItem[]): string {
  const cell = 'padding:10px 12px;border-bottom:1px solid #eee;vertical-align:top;'
  const right = `${cell}text-align:right;white-space:nowrap;`
  const rows = items.map((item, i) => {
    const specs = Object.entries(item.selection)
      .map(([k, v]) => `${escapeHtml(cap(k))}: ${escapeHtml(v)}`)
      .join('<br/>')
    const p = linePricing(item)
    return `<tr>
      <td style="${cell}color:#888;">${i + 1}</td>
      <td style="${cell}"><strong>${escapeHtml(item.productName)}</strong>${
        item.context ? `<br/><span style="color:#888;font-size:12px;">${escapeHtml(item.context)}</span>` : ''}${
        specs ? `<br/><span style="font-size:12px;">${specs}</span>` : ''}</td>
      <td style="${right}font-weight:600;">${item.quantity}</td>
      <td style="${right}">${item.unitPrice === null ? '<span style="color:#aaa;">on request</span>' : inr(item.unitPrice)}</td>
      <td style="${right}">${item.discount ? `${item.discount}%` : '—'}</td>
      <td style="${right}font-weight:600;">${p ? inr(p.total) : '—'}</td>
    </tr>`
  }).join('')
  const t = quoteTotals(items)
  const totalRow = (label: string, value: string, bold = false) =>
    `<tr><td colspan="5" style="padding:6px 12px;text-align:right;${bold ? 'font-weight:700;' : 'color:#666;'}">${label}</td>
      <td style="padding:6px 12px;text-align:right;white-space:nowrap;${bold ? 'font-weight:700;color:#9a8c66;' : ''}">${value}</td></tr>`
  const totals = t.hasPrices
    ? totalRow('Subtotal (D.P.)', inr(t.gross)) +
      (t.discount > 0 ? totalRow('Discount', `− ${inr(t.discount)}`) : '') +
      totalRow('Total (excl. GST)', inr(t.net), true) +
      (t.unpriced ? `<tr><td colspan="6" style="padding:4px 12px;text-align:right;font-size:12px;color:#888;">${t.unpriced} item${t.unpriced === 1 ? '' : 's'} without a price not included</td></tr>` : '')
    : ''
  const th = 'padding:10px 12px;background:#f6f4ef;text-align:left;font-size:12px;text-transform:uppercase;color:#666;'
  const thR = `${th}text-align:right;`
  return `<table style="font-family:sans-serif;font-size:14px;border-collapse:collapse;width:100%;max-width:720px;">
    <tr><th style="${th}">#</th><th style="${th}">Product</th><th style="${thR}">Qty</th><th style="${thR}">D.P.</th><th style="${thR}">Disc</th><th style="${thR}">Total</th></tr>
    ${rows}
    ${totals}
  </table>`
}

// POST { items, note? } — a signed-in partner sends their quote list to LEDLUM.
// Emails the sales inbox (reply-to = the partner) and a confirmation copy to the partner.
export async function POST(req: NextRequest) {
  const caller = await getCaller(req)
  if (!caller) return NextResponse.json({ error: 'Please sign in to send a quote request' }, { status: 401 })
  if (!getPermissions(caller.role).cart) {
    return NextResponse.json({ error: 'Your account cannot send quote requests' }, { status: 403 })
  }

  const body  = await req.json().catch(() => ({}))
  const items = parseItems(body.items)
  if (!items) return NextResponse.json({ error: 'Your quote list is empty or invalid' }, { status: 400 })

  // Authoritative D.P. per product from ledlum_product_prices (by model).
  try {
    const prices = await getPricesForModels(items.map(i => i.productCode))
    for (const item of items) item.unitPrice = prices.get(item.productCode)?.[DP_KEY] ?? null
  } catch (err) {
    console.error('[quote-request] price lookup failed:', err)   // send without prices rather than fail
  }
  const totals = quoteTotals(items)

  const note     = typeof body.note === 'string' ? body.note.trim().slice(0, 2000) : ''
  const totalQty = items.reduce((s, i) => s + i.quantity, 0)
  const date     = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })
  const who      = caller.company || caller.name

  const detailRow = (label: string, value: string) =>
    `<tr><td style="padding:8px 14px;background:#f8f9fa;font-weight:600;width:130px;">${label}</td><td style="padding:8px 14px;">${value}</td></tr>`

  const salesHtml = `
    <div style="font-family:sans-serif;color:#1a1a1a;max-width:640px;">
      <h2>New Partner Quote Request</h2>
      <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse;width:100%;margin-bottom:20px;">
        ${detailRow('Partner', escapeHtml(caller.name))}
        ${detailRow('Company', escapeHtml(caller.company || '—'))}
        ${detailRow('Email', `<a href="mailto:${escapeHtml(caller.email)}">${escapeHtml(caller.email)}</a>`)}
        ${detailRow('Username', `@${escapeHtml(caller.username)}`)}
        ${detailRow('Date', escapeHtml(date))}
        ${detailRow('Total items', `${items.length} product${items.length !== 1 ? 's' : ''} · ${totalQty} units`)}
        ${totals.hasPrices ? detailRow('Quote value', `${inr(totals.net)} <span style="color:#888;">(excl. GST${totals.discount > 0 ? `, after ${inr(totals.discount)} discount` : ''})</span>`) : ''}
      </table>
      ${note ? `<p style="background:#f6f4ef;border-radius:8px;padding:12px 14px;white-space:pre-wrap;"><strong>Note from partner:</strong><br/>${escapeHtml(note)}</p>` : ''}
      ${itemsTable(items)}
      <p style="font-size:13px;color:#666;margin-top:20px;">Reply to this email to respond to ${escapeHtml(caller.name)} directly.</p>
    </div>`

  const salesError = await sendEmail({
    to: QUOTE_TO,
    subject: `Quote Request — ${who} — ${items.length} product${items.length !== 1 ? 's' : ''}`,
    html: salesHtml,
    replyTo: caller.email,
  })

  const base = { userId: caller.id, username: caller.username, role: caller.role, req }
  const summary = items.map(i => ({
    productCode: i.productCode, quantity: i.quantity, selection: i.selection,
    unitPrice: i.unitPrice, discount: i.discount || undefined,
  }))

  if (salesError) {
    await logActivity({ ...base, event: 'quote_failed', details: { items: summary, totalQty, error: salesError } })
    return NextResponse.json({ error: 'Could not send your quote request. Please try again.' }, { status: 502 })
  }
  await logActivity({ ...base, event: 'quote_sent', details: {
    items: summary, totalQty, note: note || undefined, to: QUOTE_TO,
    ...(totals.hasPrices ? { subtotal: totals.gross, discount: totals.discount, total: totals.net } : {}),
  } })

  // Confirmation to the partner — failure here doesn't fail the request.
  const confirmHtml = `
    <div style="font-family:sans-serif;color:#1a1a1a;max-width:640px;">
      <h2>We've received your quote request</h2>
      <p>Hi ${escapeHtml(caller.name)},</p>
      <p>Thanks — your request for ${items.length} product${items.length !== 1 ? 's' : ''} has been sent to the LEDLUM team. We'll get back to you with pricing shortly.</p>
      ${note ? `<p style="background:#f6f4ef;border-radius:8px;padding:12px 14px;white-space:pre-wrap;"><strong>Your note:</strong><br/>${escapeHtml(note)}</p>` : ''}
      ${itemsTable(items)}
      <p style="font-size:13px;color:#666;margin-top:20px;">Sent ${escapeHtml(date)}.</p>
    </div>`
  const confirmError = await sendEmail({
    to: caller.email,
    subject: 'Your LEDLUM quote request',
    html: confirmHtml,
    replyTo: QUOTE_TO,
  })
  if (confirmError) console.error('[quote-request] confirmation email failed:', confirmError)

  return NextResponse.json({ ok: true, confirmationSent: !confirmError })
}
