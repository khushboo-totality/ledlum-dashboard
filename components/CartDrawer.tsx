'use client'

import Image from 'next/image'
import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { skipImageOptimization } from '@/lib/auth'
import { useCart } from '@/context/CartContext'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { useZones } from '@/context/ZonesContext'
import { linePricing, formatInr } from '@/lib/cartSpecs'
import { authFetch, trackActivity } from '@/lib/supabaseClient'
import { downloadBoq, EMPTY_BOQ_DETAILS, type BoqProjectDetails as BoqDetails } from '@/lib/boq'
import { OPTION_KEY, missingChoices } from '@/lib/productOptions'
import type { CartItem } from '@/types'

const PAN_PATTERN = /^[A-Z]{5}[0-9]{4}[A-Z]$/

const lineId = (id: string) => `cart-line-${id}`

/** One quote line: product, its choices (driver option / CCT / beam …), qty, discount, total. */
function CartLine({ item, context }: { item: CartItem; context: string }) {
  const { removeItem, updateQty, updateDiscount, updateSelection } = useCart()
  const missing = missingChoices(item)
  const hasOptions = !!item.options && (item.options.prices.length > 1 || item.options.specs.length > 0)
  // Options panel: open while something is missing; folds into a summary once complete.
  const [open, setOpen] = useState(missing.length > 0)
  const wasMissing = useRef(missing.length)
  useEffect(() => {
    if (wasMissing.current > 0 && missing.length === 0) setOpen(false)
    if (missing.length > 0) setOpen(true)
    wasMissing.current = missing.length
  }, [missing.length])

  const isOptionKey = (key: string) =>
    !!item.options && (key === OPTION_KEY ? item.options.prices.length > 1 : item.options.specs.some(c => c.key === key))
  const picks = [
    ...(item.options && item.options.prices.length > 1 && item.selection[OPTION_KEY] ? [item.selection[OPTION_KEY]] : []),
    ...(item.options?.specs ?? []).map(c => item.selection[c.key]).filter(Boolean),
  ]
  const otherPicks = Object.entries(item.selection).filter(([k, v]) => v && !isOptionKey(k))
  const p = linePricing(item)
  const needsPrice = (item.options?.prices.length ?? 0) > 1 && !item.selection[OPTION_KEY]

  const tile = (sel: boolean) =>
    `rounded-lg border transition-all ${sel
      ? 'border-primary bg-primary/10 text-foreground ring-1 ring-primary'
      : 'border-gray-mid bg-white text-foreground hover:border-primary'}`

  return (
    <div id={lineId(item.id)} className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-colors ${missing.length ? 'border-amber-300' : 'border-gray-mid'}`}>
      {/* Product */}
      <div className="flex gap-3 p-4">
        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border border-gray bg-white">
          {item.productImage ? (
            <Image src={item.productImage} alt={item.productCode} fill sizes="64px" className="object-contain p-1" unoptimized={skipImageOptimization(item.productImage)} />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <svg className="opacity-20" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
              </svg>
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold font-bai text-foreground">{item.productName}</p>
              {item.productName !== item.productCode && <p className="text-[11px] font-pop text-gray-dark">{item.productCode}</p>}
              {context && <p className="truncate text-[11px] font-pop text-gray-dark">{context}</p>}
            </div>
            <button onClick={() => removeItem(item.id)} title="Remove" aria-label={`Remove ${item.productName}`}
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-gray-dark transition-colors hover:bg-red-50 hover:text-red-500">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </button>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {hasOptions && (
              missing.length ? (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800 font-pop">Needs options</span>
              ) : (
                <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 font-pop">
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>
                  Ready
                </span>
              )
            )}
            {otherPicks.map(([k, v]) => (
              <span key={k} className="rounded-full border border-gray-mid bg-gray px-2 py-0.5 text-[10px] font-pop text-gray-text">{v}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Options — expanded picker, or a one-line summary once complete */}
      {hasOptions && item.options && (
        open ? (
          <div className="space-y-3 border-t border-gray bg-[#faf9f6] px-4 py-3.5">
            {item.options.prices.length > 1 && (
              <div>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-dark font-pop">
                  Option {!item.selection[OPTION_KEY] && <span className="text-amber-700">· required</span>}
                </p>
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                  {item.options.prices.map(o => {
                    const sel = item.selection[OPTION_KEY] === o.key
                    return (
                      <button key={o.key} onClick={() => updateSelection(item.id, OPTION_KEY, o.key)}
                        className={`${tile(sel)} relative px-3 py-2 text-left`}>
                        <span className="block text-xs font-bold font-bai">{o.key}</span>
                        <span className="block text-[11px] font-pop text-gray-text">{formatInr(o.price)}</span>
                        {sel && (
                          <svg className="absolute right-2 top-2 text-primary" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
            {item.options.specs.map(c => (
              <div key={c.key} className="sm:flex sm:items-start sm:gap-3">
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-dark font-pop sm:mb-0 sm:w-28 sm:flex-shrink-0 sm:pt-2">
                  {c.label} {!item.selection[c.key] && <span className="text-amber-700">*</span>}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {c.values.map(v => (
                    <button key={v} onClick={() => updateSelection(item.id, c.key, v)}
                      className={`${tile(item.selection[c.key] === v)} px-2.5 py-1.5 text-xs font-semibold font-bai`}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {missing.length === 0 && (
              <button onClick={() => setOpen(false)} className="text-xs font-semibold text-primary font-bai hover:underline">Done</button>
            )}
          </div>
        ) : (
          <button onClick={() => setOpen(true)}
            className="flex w-full items-center justify-between gap-3 border-t border-gray bg-[#faf9f6] px-4 py-2.5 text-left hover:bg-primary/5">
            <span className="truncate text-xs font-semibold font-bai text-foreground">{picks.join(' · ')}</span>
            <span className="flex-shrink-0 text-[11px] font-semibold text-primary font-pop">Change</span>
          </button>
        )
      )}

      {/* Qty · discount · price */}
      <div className="flex flex-wrap items-center gap-2 border-t border-gray px-4 py-3">
        <div className="flex items-center overflow-hidden rounded-lg border border-gray-mid">
          <button onClick={() => updateQty(item.id, item.quantity - 1)} aria-label="Decrease quantity" className="px-2.5 py-1 text-sm font-bold text-gray-dark hover:bg-gray">−</button>
          <span className="min-w-[34px] px-2 py-1 text-center text-sm font-bold font-bai text-foreground">{item.quantity}</span>
          <button onClick={() => updateQty(item.id, item.quantity + 1)} aria-label="Increase quantity" className="px-2.5 py-1 text-sm font-bold text-gray-dark hover:bg-gray">+</button>
        </div>
        <label className="flex items-center rounded-lg border border-gray-mid focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10" title="Discount %">
          <span className="pl-2 text-[10px] font-semibold uppercase text-gray-dark font-pop">Disc</span>
          <input
            type="number" inputMode="decimal" min={0} max={100} step="0.5"
            value={item.discount ? item.discount : ''}
            onChange={e => updateDiscount(item.id, e.target.value === '' ? 0 : Number(e.target.value))}
            placeholder="0"
            aria-label={`Discount % for ${item.productName}`}
            className="w-12 bg-transparent px-1.5 py-1 text-right text-sm font-bold font-bai text-foreground outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <span className="pr-2 text-xs font-semibold text-gray-dark">%</span>
        </label>
        <div className="ml-auto text-right">
          {p.total !== null ? (
            <>
              <p className="text-[10px] font-pop text-gray-dark">
                {item.selection[OPTION_KEY] && <span className="font-semibold text-gray-text">{item.selection[OPTION_KEY]} · </span>}
                {formatInr(p.unit!)} × {item.quantity}
                {p.disc > 0 && <span className="ml-1 line-through">{formatInr(p.unit! * item.quantity)}</span>}
              </p>
              <p className="text-base font-extrabold font-bai text-foreground">{formatInr(p.total)}</p>
            </>
          ) : needsPrice ? (
            <p className="text-[11px] font-pop text-amber-700">Pick an option<br/>to see the price</p>
          ) : (
            <p className="text-[11px] font-pop text-gray-dark">Price on request</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function CartDrawer() {
  const { items, isOpen, closeCart, clearCart } = useCart()
  const { user, can } = useAuth()
  const { toast } = useToast()
  const { getZoneById } = useZones()
  const [sending, setSending] = useState(false)
  const [sent, setSent]       = useState(false)
  const [note, setNote]       = useState('')
  const [noteOpen, setNoteOpen] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  // BOQ details form — values are kept while the page is open, so a second
  // download for the same project doesn't need retyping.
  const [boqFormOpen, setBoqFormOpen] = useState(false)
  const [boqDetails, setBoqDetails]   = useState<BoqDetails>(EMPTY_BOQ_DETAILS)
  const setBoqField = (k: keyof BoqDetails) => (e: ChangeEvent<HTMLInputElement>) =>
    setBoqDetails(d => ({ ...d, [k]: e.target.value }))
  const panValue   = boqDetails.architectPan.trim().toUpperCase()
  const panInvalid = panValue !== '' && !PAN_PATTERN.test(panValue)

  const totalQty = items.reduce((s, i) => s + i.quantity, 0)
  // Lines whose options (driver / CCT / beam …) aren't all picked yet — they
  // block sending the quote and the BOQ.
  const incompleteItems = items.filter(i => missingChoices(i).length > 0)
  const incomplete = incompleteItems.length
  const withOptions = items.filter(i => i.options && (i.options.prices.length > 1 || i.options.specs.length > 0)).length
  const goToNextIncomplete = () =>
    document.getElementById(lineId(incompleteItems[0]?.id ?? ''))?.scrollIntoView({ behavior: 'smooth', block: 'center' })

  // Quote totals from each line's D.P. × qty less its discount (excl. GST).
  const quoteTotals = items.reduce((t, item) => {
    const p = linePricing(item)
    if (p.unit === null || p.total === null) return { ...t, unpriced: t.unpriced + 1 }
    const gross = p.unit * item.quantity
    return { ...t, hasPrices: true, gross: t.gross + gross, net: t.net + p.total, discount: t.discount + (gross - p.total) }
  }, { hasPrices: false, gross: 0, net: 0, discount: 0, unpriced: 0 })

  // Build readable context line per item
  const itemContext = (item: ReturnType<typeof useCart>['items'][0]) => {
    if (item.browseMode === 'product') {
      const parts = [item.productCategory, item.productSubcategory, item.productTypeName].filter(Boolean)
      return parts.join(' › ')
    }
    return getZoneById(item.zone)?.label ?? item.zone ?? '—'
  }

  // Compact item list for the activity log.
  const quoteSummary = () => items.map(i => ({ productCode: i.productCode, quantity: i.quantity, selection: i.selection }))

  // Cart lines as sent to /api/quote-request and /api/boq-download.
  const requestItems = () => items.map(i => ({
    productCode:  i.productCode,
    productName:  i.productName,
    productImage: i.productImage,
    productSpecs: i.productSpecs,   // snapshot, so the BOQ can be re-downloaded from My Quotes
    context:      itemContext(i),
    quantity:     i.quantity,
    selection:    i.selection,
    discount:     i.discount ?? 0,   // price itself is re-read on the server
  }))

  const buildEmailBody = () => {
    const header =
      `LEDLUM — Quote Request\n${'='.repeat(50)}\n\n` +
      `Partner : ${user?.name ?? 'Unknown'}\n` +
      `Company: ${user?.company ?? '—'}\n` +
      `Email  : ${user?.email ?? '—'}\n` +
      `Date   : ${new Date().toLocaleString('en-IN')}\n\n` +
      `${'─'.repeat(50)}\nITEMS\n${'─'.repeat(50)}\n`

    const rows = items.map((item, i) => {
      const context = item.browseMode === 'product'
        ? `Category: ${itemContext(item)}`
        : `Zone    : ${getZoneById(item.zone)?.label ?? item.zone}`
      const specs = Object.entries(item.selection)
        .filter(([, v]) => v)
        .map(([k, v]) => `  • ${k.charAt(0).toUpperCase() + k.slice(1)}: ${v}`)
        .join('\n')
      const p = linePricing(item)
      const price = p.unit === null
        ? '   Price   : on request'
        : `   D.P.    : ${formatInr(p.unit)}${p.disc ? `  · Disc ${p.disc}% → ${formatInr(p.net!)}` : ''}\n   Total   : ${formatInr(p.total!)}`
      return `\n${i + 1}. ${item.productName}\n   ${context}\n   Quantity: ${item.quantity}\n${price}\n${specs || '   (No configuration selected)'}`
    }).join('\n')

    const totalsText = quoteTotals.hasPrices
      ? `Subtotal (D.P.): ${formatInr(quoteTotals.gross)}\n` +
        (quoteTotals.discount > 0 ? `Discount      : − ${formatInr(quoteTotals.discount)}\n` : '') +
        `Total         : ${formatInr(quoteTotals.net)} (excl. GST)\n\n`
      : ''

    const footer =
      `\n\n${'─'.repeat(50)}\n` +
      `Total items: ${totalQty}\n` +
      totalsText +
      `\nPlease review and confirm pricing before processing.\n\n` +
      `Generated by LEDLUM Catalog System`

    return header + rows + footer
  }

  const handleDownloadPDF = async () => {
    if (items.length === 0 || downloadingPdf || panInvalid || incomplete) return
    setBoqFormOpen(false)
    setDownloadingPdf(true)
    try {
      // Project details from the BOQ form; empty fields print as blank space.
      await downloadBoq({
        lines: items,
        details: boqDetails,
        preparedBy: user?.name ?? '',
        dealerName: user?.company ?? user?.name ?? '',
      })
      // Logs 'boq_downloaded' and emails the sales team — fire-and-forget,
      // the PDF is already downloaded.
      authFetch('/api/boq-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: boqDetails, items: requestItems() }),
      }).catch(() => {})
    } catch (err) {
      console.error('[CartDrawer] PDF export failed:', err)
      toast('Failed to generate PDF', 'error')
    } finally {
      setDownloadingPdf(false)
    }
  }

  // Emails the quote to LEDLUM (projects@ledlumlighting.com) via /api/quote-request;
  // the partner gets a confirmation copy. Logged server-side as 'quote_sent'.
  const handleSendQuote = async () => {
    if (items.length === 0 || sending || incomplete) return
    setSending(true)
    try {
      const res = await authFetch('/api/quote-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          note,
          project: boqDetails,   // same project details as the BOQ form — saved with the quote
          items: requestItems(),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { toast(data.error ?? 'Could not send your quote request', 'error'); return }
      setSent(true); setNote('')
      toast(
        `Quote ${data.quoteNo ? `${data.quoteNo} ` : ''}sent to LEDLUM${data.confirmationSent ? ' — a copy has been emailed to you' : ''}. See it in My Account.`,
        'success',
      )
      setTimeout(() => setSent(false), 4000)
    } catch {
      toast('Network error — quote request not sent', 'error')
    } finally {
      setSending(false)
    }
  }

  const handleCopyQuote = () => {
    navigator.clipboard.writeText(buildEmailBody())
    trackActivity('quote_copied', { items: quoteSummary(), totalQty })
    toast('Quote copied to clipboard', 'success')
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={closeCart}
      />

      <div className={`fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-1 bg-gradient-to-r from-primary to-primary-dark flex-shrink-0" />

        {/* Header */}
        <div className="flex-shrink-0 border-b border-gray px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="flex items-center gap-2 text-lg font-bold font-bai text-foreground">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                </svg>
                Quote Cart
              </h2>
              <p className="mt-0.5 truncate text-xs text-gray-text font-pop">
                {user?.company ?? user?.name} · {items.length} product{items.length !== 1 ? 's' : ''} · {totalQty} unit{totalQty !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex flex-shrink-0 items-center gap-1">
              {items.length > 0 && (
                <button onClick={() => { if (confirm('Clear all items from quote?')) clearCart() }}
                  className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-dark font-pop hover:bg-red-50 hover:text-red-500">
                  Clear all
                </button>
              )}
              <button
                onClick={closeCart}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-gray text-sm text-gray-dark transition-all hover:border-primary hover:bg-primary hover:text-white"
              >✕</button>
            </div>
          </div>

          {/* Options progress */}
          {withOptions > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-[11px] font-pop">
                <span className={incomplete ? 'text-amber-800' : 'text-emerald-700'}>
                  {incomplete ? `${items.length - incomplete} of ${items.length} items ready` : 'All options chosen'}
                </span>
                {incomplete > 0 && (
                  <button onClick={goToNextIncomplete} className="font-semibold text-primary hover:underline">Go to next item →</button>
                )}
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray">
                <div className={`h-full rounded-full transition-all ${incomplete ? 'bg-amber-400' : 'bg-emerald-500'}`}
                  style={{ width: `${items.length ? ((items.length - incomplete) / items.length) * 100 : 0}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto bg-[#f5f4f0]">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-8 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
                <svg className="text-primary" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                </svg>
              </div>
              <p className="text-sm font-bold font-bai text-foreground">Your quote cart is empty</p>
              <p className="mt-1 max-w-xs text-xs font-pop text-gray-dark">Add products from the catalogue — you&apos;ll choose their driver option, CCT and other options here.</p>
              <button onClick={closeCart} className="mt-4 rounded-lg border border-primary/40 px-4 py-2 text-sm font-semibold font-bai text-primary hover:bg-primary/5">
                Browse products
              </button>
            </div>
          ) : (
            <div className="space-y-3 p-4 sm:p-5">
              {items.map(item => <CartLine key={item.id} item={item} context={itemContext(item)} />)}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="flex-shrink-0 space-y-3 border-t border-gray bg-white px-5 py-4 shadow-[0_-4px_16px_rgba(0,0,0,0.04)] sm:px-6">
            {/* Totals */}
            <div className="space-y-1 text-sm">
              {quoteTotals.hasPrices ? (
                <>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-text font-pop">Subtotal · {totalQty} unit{totalQty !== 1 ? 's' : ''}</span>
                    <span className="font-semibold font-bai text-foreground">{formatInr(quoteTotals.gross)}</span>
                  </div>
                  {quoteTotals.discount > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-text font-pop">Discount</span>
                      <span className="font-semibold font-bai text-green-700">− {formatInr(quoteTotals.discount)}</span>
                    </div>
                  )}
                  <div className="flex items-end justify-between pt-1">
                    <span className="font-semibold text-foreground font-pop">Total <span className="text-[11px] font-normal text-gray-dark">excl. GST</span></span>
                    <span className="text-xl font-extrabold font-bai text-primary">{formatInr(quoteTotals.net)}</span>
                  </div>
                  {quoteTotals.unpriced > 0 && (
                    <p className="text-[11px] text-gray-dark font-pop">
                      {quoteTotals.unpriced} item{quoteTotals.unpriced === 1 ? '' : 's'} not priced yet{incomplete ? ' (pick an option)' : ''} — not included.
                    </p>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-gray-text font-pop">{totalQty} unit{totalQty !== 1 ? 's' : ''}</span>
                  <span className="text-xs font-pop text-gray-dark">{incomplete ? 'Pick options to see prices' : 'Prices on request'}</span>
                </div>
              )}
            </div>

            {/* Note */}
            {noteOpen || note ? (
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                maxLength={2000}
                rows={2}
                autoFocus={noteOpen && !note}
                placeholder="Note for LEDLUM — project name, delivery date…"
                className="w-full resize-none rounded-xl border border-gray-mid bg-white px-3 py-2 text-sm font-pop text-foreground placeholder:text-gray-dark outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            ) : (
              <button onClick={() => setNoteOpen(true)} className="text-xs font-semibold text-primary font-pop hover:underline">+ Add a note for LEDLUM</button>
            )}

            {incomplete > 0 && (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                <p className="text-xs font-pop text-amber-800">
                  Choose options for {incomplete} item{incomplete === 1 ? '' : 's'} to send the quote or download the BOQ.
                </p>
                <button onClick={goToNextIncomplete} className="flex-shrink-0 text-xs font-bold text-amber-900 font-bai hover:underline">Show</button>
              </div>
            )}

            <button onClick={handleSendQuote} disabled={sending || incomplete > 0}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold font-bai text-white transition-colors hover:bg-primary-dark disabled:opacity-50">
              {sending ? (
                <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Sending…</>
              ) : sent ? (
                <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> Sent!</>
              ) : (
                <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> Send Quote Request</>
              )}
            </button>
            <div className="flex gap-2">
              {can('download') && (
                <button onClick={() => setBoqFormOpen(true)} disabled={downloadingPdf || incomplete > 0}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-primary/30 py-2 text-sm font-semibold font-bai text-primary transition-colors hover:bg-primary/5 disabled:opacity-50">
                  {downloadingPdf ? (
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  ) : (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                  )}
                  {downloadingPdf ? 'Generating…' : 'Download BOQ'}
                </button>
              )}
              <button onClick={handleCopyQuote}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-mid py-2 text-sm font-semibold font-bai text-gray-text transition-colors hover:border-foreground hover:text-foreground">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                Copy as text
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── BOQ project details form (opens from "Download BOQ") ── */}
      {boqFormOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-5"
          onClick={() => setBoqFormOpen(false)}
          onKeyDown={e => { if (e.key === 'Escape') setBoqFormOpen(false) }}
        >
          <form
            onClick={e => e.stopPropagation()}
            onSubmit={e => { e.preventDefault(); handleDownloadPDF() }}
            className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl animate-fade-in"
          >
            <div className="h-1 bg-gradient-to-r from-primary to-primary-dark" />
            <div className="flex items-start justify-between border-b border-gray px-6 py-4">
              <div>
                <h3 className="text-lg font-bold font-bai text-foreground">BOQ details</h3>
                <p className="mt-0.5 text-xs text-gray-text font-pop">
                  Printed on the BOQ header. Leave any field empty to keep it blank.
                </p>
              </div>
              <button type="button" onClick={() => setBoqFormOpen(false)} aria-label="Close"
                className="w-8 h-8 rounded-full border border-gray flex items-center justify-center text-gray-dark hover:bg-primary hover:text-white hover:border-primary transition-all text-sm">
                ✕
              </button>
            </div>

            <div className="space-y-3 px-6 py-5">
              {([
                ['projectName',   'Project Name',   'e.g. R.K. Salai Experience Centre'],
                ['location',      'Location',       'e.g. Chennai'],
                ['architectName', 'Architect Name', 'e.g. Studio XYZ'],
              ] as [keyof BoqDetails, string, string][]).map(([key, label, ph], i) => (
                <div key={key}>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-dark font-pop">{label}</label>
                  <input
                    type="text"
                    value={boqDetails[key]}
                    onChange={setBoqField(key)}
                    placeholder={ph}
                    autoFocus={i === 0}
                    className="w-full rounded-lg border border-gray-mid bg-white px-3 py-2.5 text-sm font-bai text-foreground outline-none placeholder:text-gray-dark focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </div>
              ))}
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-dark font-pop">Architect PAN</label>
                <input
                  type="text"
                  value={boqDetails.architectPan}
                  onChange={setBoqField('architectPan')}
                  placeholder="e.g. ABCDE1234F"
                  maxLength={10}
                  className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm font-bai uppercase text-foreground outline-none placeholder:normal-case placeholder:text-gray-dark focus:ring-2 ${
                    panInvalid ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : 'border-gray-mid focus:border-primary focus:ring-primary/10'
                  }`}
                />
                {panInvalid && (
                  <p className="mt-1 text-[11px] text-red-500 font-pop">PAN should be 10 characters, like ABCDE1234F</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-gray bg-gray px-6 py-4">
              <button type="button" onClick={() => setBoqDetails(EMPTY_BOQ_DETAILS)}
                className="text-xs font-semibold text-gray-dark hover:text-primary font-pop">
                Clear fields
              </button>
              <div className="flex gap-2">
                <button type="button" onClick={() => setBoqFormOpen(false)}
                  className="rounded-lg border border-gray-mid bg-white px-4 py-2.5 text-sm font-semibold font-bai text-gray-text hover:border-foreground">
                  Cancel
                </button>
                <button type="submit" disabled={panInvalid || downloadingPdf}
                  className="flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold font-bai text-white hover:bg-primary-dark disabled:opacity-50">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Download BOQ
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
