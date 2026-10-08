// Client-side: builds and downloads the BOQ PDF from quote lines — shared by
// the quote cart and My Account → My Quotes (re-download), so both produce
// the identical document.
import type { CartItem } from '@/types'
import { type BoqRow, blankMeta } from '@/boq/BOQDocument'
import { applySelection, linePricing } from '@/lib/cartSpecs'

/** Project details printed on the BOQ header (all optional — blank if empty). */
export interface BoqProjectDetails {
  projectName: string
  location: string
  architectName: string
  architectPan: string
}
export const EMPTY_BOQ_DETAILS: BoqProjectDetails = { projectName: '', location: '', architectName: '', architectPan: '' }

/** What a line needs for the BOQ — a cart item or a saved quote line. */
export type BoqLine = Pick<CartItem, 'productCode' | 'productSpecs' | 'selection' | 'quantity' | 'unitPrice' | 'discount'> & {
  productImage?: string
}

export function buildBoqRows(lines: BoqLine[]): BoqRow[] {
  return lines.map((item, i) => {
    const p = linePricing(item)
    return {
      slNo: i + 1,
      image: item.productImage,
      // Columns come from the product table (attributes) + extra_specs keys;
      // anything picked in the Configure tab overrides the catalog value.
      attributes: applySelection(item.productSpecs?.attributes ?? { model: item.productCode }, item.selection ?? {}),
      specs: item.productSpecs?.extraSpecs ?? {},
      qty: item.quantity,
      unit: "NO'S",
      // D.P. per unit, line discount %, price after discount, line total
      // (0 for items without a price — the PDF hides price columns only if every row is 0).
      mrp: p.unit ?? 0,
      disc: p.disc,
      net: p.net ?? 0,
      total: p.total ?? 0,
    }
  })
}

const todayIn = (d: Date) => d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })

export async function downloadBoq(params: {
  lines: BoqLine[]
  details: BoqProjectDetails
  preparedBy: string
  dealerName: string
  /** Defaults to today; pass the quote's date when re-downloading. */
  date?: Date
  filename?: string
}): Promise<void> {
  const { lines, details, preparedBy, dealerName } = params
  const date = params.date ?? new Date()
  const meta = blankMeta({
    date: todayIn(date),
    preparedBy,
    dealerName,
    project: details.projectName.trim(),
    projectName: details.projectName.trim(),
    location: details.location.trim(),
    architectName: details.architectName.trim(),
    architectPan: details.architectPan.trim().toUpperCase(),
  })
  // Loaded on demand — jsPDF + html2canvas are ~200 KB we don't want in the page bundle.
  const { downloadBoqPdf } = await import('@/lib/exportBoqPdf')
  await downloadBoqPdf(meta, buildBoqRows(lines), params.filename ?? `LEDLUM-BOQ-${date.toISOString().slice(0, 10)}.pdf`)
}
