// Server-side row mapping for ledlum_quotes (used by /api/my/quotes*).
import { formatQuoteNo, type QuoteSummary } from '@/lib/quotes'

export interface QuoteRow {
  id: number
  created_at: string
  status: string
  project_name: string | null
  location: string | null
  item_count: number
  total_qty: number
  // numeric columns come back from PostgREST as strings
  subtotal: string | number | null
  discount: string | number | null
  total: string | number | null
}

export const QUOTE_SUMMARY_COLUMNS =
  'id, created_at, status, project_name, location, item_count, total_qty, subtotal, discount, total'

const num = (v: string | number | null) => (v === null || v === undefined ? null : Number(v))

export const toQuoteSummary = (r: QuoteRow): QuoteSummary => ({
  id: r.id,
  quoteNo: formatQuoteNo(r.id),
  createdAt: r.created_at,
  status: r.status,
  projectName: r.project_name,
  location: r.location,
  itemCount: r.item_count,
  totalQty: r.total_qty,
  subtotal: num(r.subtotal),
  discount: num(r.discount),
  total: num(r.total),
})
