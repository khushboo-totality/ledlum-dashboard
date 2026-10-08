'use client'

import { useCallback, useEffect, useState } from 'react'
import { authFetch } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { useToast } from '@/context/ToastContext'
import { formatInr, linePricing } from '@/lib/cartSpecs'
import { downloadBoq } from '@/lib/boq'
import type { QuoteDetail, QuoteSummary } from '@/lib/quotes'
import { getImageUrl } from '@/lib/auth'

const fmtDate = (d: string) =>
  new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

const STATUS_STYLES: Record<string, string> = {
  sent: 'bg-blue-50 text-blue-700 border-blue-200',
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide font-pop ${STATUS_STYLES[status] ?? 'bg-gray text-gray-text border-gray-mid'}`}>
      {status}
    </span>
  )
}

/** My Account → My Quotes: history of sent quote requests, details,
 * copy to cart (at today's prices) and BOQ re-download. */
export default function MyQuotes() {
  const { user } = useAuth()
  const { addItem, openCart } = useCart()
  const { toast } = useToast()

  const [quotes, setQuotes]   = useState<QuoteSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [search, setSearch]   = useState('')

  const [openId, setOpenId]           = useState<number | null>(null)
  const [detail, setDetail]           = useState<QuoteDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res  = await authFetch('/api/my/quotes')
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data.error ?? 'Could not load your quotes'); return }
      setQuotes(data)
    } catch {
      setError('Could not load your quotes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const openQuote = async (id: number) => {
    setOpenId(id); setDetail(null); setDetailLoading(true); setError('')
    try {
      const res  = await authFetch(`/api/my/quotes/${id}`)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data.error ?? 'Could not load this quote'); setOpenId(null); return }
      setDetail(data)
    } finally {
      setDetailLoading(false)
    }
  }

  const copyToCart = () => {
    if (!detail) return
    let changed = 0
    for (const line of detail.items) {
      const price = line.currentUnitPrice ?? null
      if (price !== line.unitPrice) changed++
      addItem({
        productCode: line.productCode,
        productName: line.productName,
        productImage: line.productImage ?? '',
        zone: '',
        browseMode: 'product',
        productSpecs: line.productSpecs,
        selection: line.selection ?? {},
        quantity: line.quantity,
        unitPrice: price,          // today's D.P.
        discount: line.discount ?? 0,
      })
    }
    toast(
      `${detail.items.length} item${detail.items.length === 1 ? '' : 's'} copied to your quote cart` +
        (changed ? ` — ${changed} price${changed === 1 ? '' : 's'} updated to today's D.P.` : ''),
      'success',
    )
    openCart()
  }

  const redownload = async () => {
    if (!detail || downloading) return
    setDownloading(true)
    try {
      await downloadBoq({
        lines: detail.items,
        details: {
          projectName: detail.projectName ?? '',
          location: detail.location ?? '',
          architectName: detail.architectName ?? '',
          architectPan: detail.architectPan ?? '',
        },
        preparedBy: detail.partnerName ?? user?.name ?? '',
        dealerName: detail.company ?? detail.partnerName ?? '',
        date: new Date(detail.createdAt),
        filename: `LEDLUM-BOQ-${detail.quoteNo}.pdf`,
      })
    } catch (err) {
      console.error('[MyQuotes] BOQ download failed:', err)
      toast('Failed to generate the BOQ PDF', 'error')
    } finally {
      setDownloading(false)
    }
  }

  const q = search.trim().toLowerCase()
  const visible = q
    ? quotes.filter(x => x.quoteNo.toLowerCase().includes(q) || (x.projectName ?? '').toLowerCase().includes(q) || (x.location ?? '').toLowerCase().includes(q))
    : quotes

  // ── Detail view ──
  if (openId !== null) {
    return (
      <div className="space-y-4">
        <button onClick={() => { setOpenId(null); setDetail(null) }} className="text-sm font-semibold font-bai text-gray-text hover:text-primary">
          ← All quotes
        </button>

        {detailLoading || !detail ? (
          <div className="flex justify-center py-20">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="rounded-2xl border border-gray-mid bg-white p-5 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-extrabold font-bai text-foreground">{detail.quoteNo}</h2>
                    <StatusBadge status={detail.status} />
                  </div>
                  <p className="mt-0.5 text-xs text-gray-dark font-pop">Sent {fmtDate(detail.createdAt)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={redownload} disabled={downloading}
                    className="flex items-center gap-1.5 rounded-lg border border-primary/30 px-4 py-2 text-sm font-semibold font-bai text-primary hover:bg-primary/5 disabled:opacity-60">
                    {downloading
                      ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>}
                    {downloading ? 'Generating…' : 'Download BOQ'}
                  </button>
                  <button onClick={copyToCart}
                    className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-bold font-bai text-white hover:bg-primary-dark">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    Copy to cart
                  </button>
                </div>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm font-pop sm:grid-cols-4">
                {([
                  ['Project', detail.projectName],
                  ['Location', detail.location],
                  ['Architect', detail.architectName],
                  ['Architect PAN', detail.architectPan],
                ] as const).map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-[11px] uppercase tracking-wide text-gray-dark">{k}</dt>
                    <dd className="font-semibold text-foreground">{v || '—'}</dd>
                  </div>
                ))}
              </dl>
              {detail.note && (
                <p className="mt-4 whitespace-pre-wrap rounded-lg bg-[#f6f4ef] px-4 py-3 text-sm text-gray-text font-pop">
                  <span className="font-semibold text-foreground">Note: </span>{detail.note}
                </p>
              )}
            </div>

            {/* Items */}
            <div className="overflow-hidden rounded-2xl border border-gray-mid bg-white shadow-card">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm font-pop">
                  <thead>
                    <tr className="bg-[#f6f4ef] text-left text-[11px] uppercase tracking-wide text-gray-dark">
                      <th className="px-4 py-3">Product</th>
                      <th className="px-3 py-3 text-right">Qty</th>
                      <th className="px-3 py-3 text-right">D.P.</th>
                      <th className="px-3 py-3 text-right">Disc</th>
                      <th className="px-4 py-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray">
                    {detail.items.map((line, i) => {
                      const p = linePricing(line)
                      const img = getImageUrl(line.productImage ?? '')
                      const specs = Object.values(line.selection ?? {}).filter(Boolean)
                      return (
                        <tr key={i} className="align-top">
                          <td className="px-4 py-3">
                            <div className="flex gap-3">
                              <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border border-gray bg-white">
                                {img && (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={img} alt="" className="h-full w-full object-contain" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold font-bai text-foreground">{line.productName}</p>
                                {specs.length > 0 && <p className="text-xs text-gray-dark">{specs.join(' · ')}</p>}
                                {line.currentUnitPrice != null && line.unitPrice != null && line.currentUnitPrice !== line.unitPrice && (
                                  <p className="mt-0.5 text-[11px] text-amber-700">Today&apos;s D.P.: {formatInr(line.currentUnitPrice)}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-right font-semibold">{line.quantity}</td>
                          <td className="px-3 py-3 text-right whitespace-nowrap">{p.unit === null ? <span className="text-gray-dark">on request</span> : formatInr(p.unit)}</td>
                          <td className="px-3 py-3 text-right">{p.disc ? `${p.disc}%` : '—'}</td>
                          <td className="px-4 py-3 text-right font-bold whitespace-nowrap">{p.total === null ? '—' : formatInr(p.total)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              {detail.total !== null && (
                <div className="space-y-1 border-t border-gray px-4 py-4 text-sm font-pop">
                  <div className="flex justify-end gap-8"><span className="text-gray-text">Subtotal (D.P.)</span><span className="w-28 text-right font-semibold">{formatInr(detail.subtotal ?? 0)}</span></div>
                  {(detail.discount ?? 0) > 0 && (
                    <div className="flex justify-end gap-8"><span className="text-gray-text">Discount</span><span className="w-28 text-right font-semibold text-green-700">− {formatInr(detail.discount!)}</span></div>
                  )}
                  <div className="flex justify-end gap-8"><span className="font-semibold">Total <span className="text-xs font-normal text-gray-dark">(excl. GST)</span></span><span className="w-28 text-right text-base font-extrabold text-primary">{formatInr(detail.total)}</span></div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    )
  }

  // ── List view ──
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by quote no., project or location…"
          className="h-10 min-w-0 flex-1 rounded-lg border border-gray-mid bg-white px-3 text-sm font-bai outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
        />
        <button onClick={load} disabled={loading} title="Refresh"
          className="flex h-10 items-center gap-1.5 rounded-lg border border-gray-mid bg-white px-3 text-sm font-semibold font-bai text-gray-text hover:border-primary hover:text-primary disabled:opacity-60">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className={loading ? 'animate-spin' : ''}>
            <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {error && <p className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-primary font-pop">{error}</p>}

      {loading && quotes.length === 0 ? (
        <div className="flex justify-center py-20">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-gray-mid bg-white py-16 text-center shadow-card">
          <p className="text-sm font-bai text-gray-dark">
            {q ? 'No quotes match your search' : "You haven't sent any quote requests yet"}
          </p>
          {!q && <p className="mt-1 text-xs text-gray-dark font-pop">Add products to your quote cart and click “Send Quote Request”.</p>}
        </div>
      ) : (
        <ul className="divide-y divide-gray overflow-hidden rounded-2xl border border-gray-mid bg-white shadow-card">
          {visible.map(x => (
            <li key={x.id}>
              <button onClick={() => openQuote(x.id)} className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 px-5 py-4 text-left transition-colors hover:bg-gray/40">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold font-bai text-foreground">{x.quoteNo}</span>
                    <StatusBadge status={x.status} />
                  </div>
                  <p className="truncate text-sm text-gray-text font-pop">
                    {x.projectName || <span className="text-gray-dark">No project name</span>}
                    {x.location ? ` · ${x.location}` : ''}
                  </p>
                  <p className="text-[11px] text-gray-dark font-pop">
                    {fmtDate(x.createdAt)} · {x.itemCount} product{x.itemCount === 1 ? '' : 's'} · {x.totalQty} units
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-base font-extrabold font-bai text-foreground">{x.total !== null ? formatInr(x.total) : '—'}</p>
                  {x.total !== null && <p className="text-[10px] text-gray-dark font-pop">excl. GST</p>}
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="text-gray-dark"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
