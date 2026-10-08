import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getCaller } from '@/lib/serverAuth'
import { getPricesForModels, DP_KEY } from '@/lib/services/products'
import type { QuoteDetail, QuoteLine } from '@/lib/quotes'
import { toQuoteSummary, type QuoteRow } from '@/lib/quotesServer'

export const dynamic = 'force-dynamic'

interface QuoteDetailRow extends QuoteRow {
  user_id: string | null
  note: string | null
  architect_name: string | null
  architect_pan: string | null
  partner_name: string
  company: string | null
  email_sent: boolean
  items: QuoteLine[]
}

// GET — one quote in full (own quotes only; admins can open any).
// Each line also carries today's D.P. (currentUnitPrice) for "Copy to cart".
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const caller = await getCaller(req)
  if (!caller) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  const id = Number(params.id)
  if (!Number.isFinite(id)) return NextResponse.json({ error: 'Invalid quote' }, { status: 400 })

  const { data, error } = await supabaseAdmin.from('ledlum_quotes').select('*').eq('id', id).maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const row = data as QuoteDetailRow | null
  if (!row || (row.user_id !== caller.id && caller.role !== 'admin')) {
    return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
  }

  const items = Array.isArray(row.items) ? row.items : []
  let current = new Map<string, Record<string, number>>()
  try {
    current = await getPricesForModels(items.map(i => i.productCode))
  } catch (err) {
    console.error('[my/quotes] current price lookup failed:', err)
  }

  const detail: QuoteDetail = {
    ...toQuoteSummary(row),
    note: row.note,
    architectName: row.architect_name,
    architectPan: row.architect_pan,
    partnerName: row.partner_name,
    company: row.company,
    emailSent: row.email_sent,
    items: items.map(i => ({ ...i, currentUnitPrice: current.get(i.productCode)?.[DP_KEY] ?? null })),
  }
  return NextResponse.json(detail)
}
