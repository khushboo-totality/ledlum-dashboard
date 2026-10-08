// Client-safe quote helpers/types shared by the quote API and My Account.
import type { CartProductSpecs, CartSelection } from '@/types'

/** Display number for a ledlum_quotes row, e.g. 42 -> "LQ-00042". */
export const formatQuoteNo = (id: number) => `LQ-${String(id).padStart(5, '0')}`

/** One saved quote line (ledlum_quotes.items[]). */
export interface QuoteLine {
  productCode: string
  productName: string
  productImage?: string
  productSpecs?: CartProductSpecs
  context?: string
  quantity: number
  selection: CartSelection
  /** D.P. per unit when the quote was sent (server-looked-up); null = on request. */
  unitPrice: number | null
  discount: number
  /** Today's D.P. — only on the detail endpoint, used by "Copy to cart". */
  currentUnitPrice?: number | null
}

export interface QuoteSummary {
  id: number
  quoteNo: string
  createdAt: string
  status: string
  projectName: string | null
  location: string | null
  itemCount: number
  totalQty: number
  subtotal: number | null
  discount: number | null
  total: number | null
}

export interface QuoteDetail extends QuoteSummary {
  note: string | null
  architectName: string | null
  architectPan: string | null
  partnerName: string
  company: string | null
  emailSent: boolean
  items: QuoteLine[]
}
