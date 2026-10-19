'use client'

// Browser side of bulk upload: reads any .xlsx / .csv workbook into sheets,
// turns them into product rows using the heading → field mapping, and exports
// the catalogue to .xlsx (which maps straight back on upload).
// exceljs is loaded on demand — it's large and only admins ever need it.
import type { Product } from '@/types'
import { canonicalPriceKey } from '@/lib/productOptions'
import {
  CLEAR_TOKEN, FIELDS, FIELD_BY_KEY, PRICE_PREFIX, SPEC_PREFIX,
  isPlaceholder, normHeading, specName, suggestTarget,
  type BulkInputRow, type BulkRow, type ColumnTarget,
} from '@/lib/bulkColumns'

export interface SheetData {
  name: string
  /** 1-based row number of the heading row. */
  headerLine: number
  headings: string[]
  rows: { line: number; cells: string[] }[]
}

export interface ParsedWorkbook {
  fileName: string
  sheets: SheetData[]
  /** Sheets with no model column (e.g. an INDEX tab) — not imported. */
  skipped: string[]
}

/** A distinct heading across the selected sheets, for the mapping table. */
export interface HeadingInfo {
  key: string          // normHeading
  heading: string      // as written in the first sheet that has it
  sheets: number
  sample: string
}

/** Where a new product's category comes from. */
export type CategorySource = 'sheet' | 'column' | 'none'

const MODEL_HEADINGS = new Set(FIELD_BY_KEY.get('model')!.synonyms)
const HEADER_SCAN_ROWS = 15

// ── Reading ────────────────────────────────────────────────────────────

/** Minimal RFC 4180 CSV reader (quoted fields, "" escapes, CRLF). */
function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = [], field = '', quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++ }
      else if (c === '"') quoted = false
      else field += c
    } else if (c === '"') quoted = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field); rows.push(row); row = []; field = ''
    } else field += c
  }
  if (field || row.length) { row.push(field); rows.push(row) }
  return rows
}

/** A heading row has a model heading — or an id heading next to another known field. */
function isHeaderRow(cells: string[]): boolean {
  const hs = cells.map(c => normHeading(c ?? ''))
  if (hs.some(h => MODEL_HEADINGS.has(h))) return true
  return hs.includes('id') && hs.some(h => h !== 'id' && suggestTarget(h).type === 'field')
}

/** Grid → sheet, or null when no row near the top looks like a heading row. */
function toSheet(name: string, grid: string[][]): SheetData | null {
  const headerIdx = grid.slice(0, HEADER_SCAN_ROWS).findIndex(r => isHeaderRow(r ?? []))
  if (headerIdx < 0) return null
  const headings = (grid[headerIdx] ?? []).map(h => (h ?? '').trim())
  const rows: SheetData['rows'] = []
  for (let i = headerIdx + 1; i < grid.length; i++) {
    const cells = (grid[i] ?? []).map(c => (c ?? '').trim())
    if (cells.some(c => c)) rows.push({ line: i + 1, cells })
  }
  return { name, headerLine: headerIdx + 1, headings, rows }
}

export async function readWorkbook(file: File): Promise<ParsedWorkbook> {
  const base = file.name.replace(/\.[^.]+$/, '')
  const out: ParsedWorkbook = { fileName: file.name, sheets: [], skipped: [] }

  if (/\.csv$/i.test(file.name)) {
    const sheet = toSheet(base, parseCsv((await file.text()).replace(/^﻿/, '')))
    if (sheet) out.sheets.push(sheet)
    else out.skipped.push(base)
  } else if (/\.xlsx$/i.test(file.name)) {
    const ExcelJS = (await import('exceljs')).default
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.load(await file.arrayBuffer())
    for (const ws of wb.worksheets) {
      const grid: string[][] = []
      ws.eachRow({ includeEmpty: true }, (r, rowNo) => {
        const cells: string[] = []
        r.eachCell({ includeEmpty: true }, (cell, colNo) => { cells[colNo - 1] = cell.text ?? '' })
        grid[rowNo - 1] = Array.from(cells, c => c ?? '')
      })
      const sheet = toSheet(ws.name, Array.from(grid, r => r ?? []))
      if (sheet && sheet.rows.length) out.sheets.push(sheet)
      else out.skipped.push(ws.name)
    }
  } else {
    throw new Error('Please upload an .xlsx or .csv file (in Excel: File → Save As → Excel Workbook)')
  }

  if (out.sheets.length === 0) {
    throw new Error('No product rows found — a sheet needs a heading row with "Item Number", "Model No", "Item Code" or "Model"')
  }
  return out
}

// ── Mapping ────────────────────────────────────────────────────────────

export function listHeadings(sheets: SheetData[]): HeadingInfo[] {
  const map = new Map<string, HeadingInfo>()
  for (const s of sheets) {
    s.headings.forEach((heading, col) => {
      const key = normHeading(heading)
      if (!key) return
      let info = map.get(key)
      if (!info) { info = { key, heading, sheets: 0, sample: '' }; map.set(key, info) }
      info.sheets++
      if (!info.sample) info.sample = s.rows.map(r => r.cells[col] ?? '').find(v => !isPlaceholder(v)) ?? ''
    })
  }
  return Array.from(map.values())
}

export function suggestMapping(headings: HeadingInfo[]): Record<string, ColumnTarget> {
  const out: Record<string, ColumnTarget> = {}
  for (const h of headings) out[h.key] = suggestTarget(h.heading)
  return out
}

/** Data key a heading writes to, or null when ignored. */
function dataKey(heading: string, target: ColumnTarget): string | null {
  switch (target.type) {
    case 'id': return 'id'
    case 'action': return 'action'
    case 'field': return target.key
    case 'spec': return SPEC_PREFIX + specName(heading)
    case 'price': return PRICE_PREFIX + canonicalPriceKey(heading)
    default: return null
  }
}

/** Sheets + mapping → rows for the server. Rows with no model and no id
 * (blank lines, section titles, "(AS PRINTED)" notes) are left out. */
export function buildRows(
  sheets: SheetData[], mapping: Record<string, ColumnTarget>, categorySource: CategorySource,
): { rows: BulkInputRow[]; skippedRows: number } {
  const rows: BulkInputRow[] = []
  let skippedRows = 0

  for (const sheet of sheets) {
    const keys = sheet.headings.map(h => dataKey(h, mapping[normHeading(h)] ?? { type: 'ignore' }))
    const familyCol = keys.indexOf('family')
    // Price-list Family columns only hold "F" marks (nowadays on nearly every
    // row), not family names — families are managed in the dashboard, so such
    // a column is ignored rather than turning every product into its own family.
    const familyMarkers = familyCol >= 0 &&
      sheet.rows.every(r => { const v = r.cells[familyCol] ?? ''; return isPlaceholder(v) || /^f$/i.test(v) })

    for (const r of sheet.rows) {
      const data: BulkRow = {}
      keys.forEach((k, col) => {
        if (!k) return
        const v = r.cells[col] ?? ''
        // First non-blank column wins when several map to the same field.
        if (!isPlaceholder(v) && !data[k]) data[k] = v
      })
      const model = data.model ?? ''
      if ((!model && !data.id) || /\(as printed\)/i.test(model)) { skippedRows++; continue }

      if (familyMarkers) delete data.family
      if (categorySource === 'sheet') data.group_name = sheet.name
      else if (categorySource === 'none') delete data.group_name

      rows.push({ row: rows.length + 1, sheet: sheet.name, line: r.line, data })
    }
  }
  return { rows, skippedRows }
}

// ── Export ─────────────────────────────────────────────────────────────

/** Export columns that are always present, in order. */
const EXPORT_FIELDS = FIELDS.filter(f => f.key !== 'is_track')

function productCells(p: Product): Record<string, string | number> {
  const join = (v: string[] | null | undefined, key: string) => (v ?? []).join(FIELD_BY_KEY.get(key)!.sep ?? ', ')
  const cells: Record<string, string | number> = {
    id: p.id,
    action: '',
    model: p.model ?? p.Codes,
    group_name: p.group_name ?? '',
    category: p.attributes?.category ?? '',
    zones: join(p.zones, 'zones'),
    family: p.family ?? '',
    product_type: p.product_type ?? '',
    website: p.website ?? '',
    dp: p.prices?.['D.P.'] ?? '',
    watts: p.watts ?? '',
    dimensions: p.Dimensions ?? '',
    cutout_size: p.cutout_size ?? '',
    body_colors: join(p.body_colors, 'body_colors'),
    cct: join(p.cct, 'cct'),
    beam_angle: p.beam_angle ?? '',
    ip_rating: p.ip_rating ?? '',
    led_chip: p.led_chip ?? '',
    luminous: p.luminous ?? '',
    cri: p.cri ?? '',
    hero_image: p.hero_image ?? '',
    gallery_images: join(p.gallery_images, 'gallery_images'),
    hero_description: p.hero_description ?? '',
  }
  for (const [k, v] of Object.entries(p.prices ?? {})) if (k !== 'D.P.') cells[PRICE_PREFIX + k] = v
  for (const [k, v] of Object.entries(p.extra_specs ?? {})) cells[SPEC_PREFIX + k] = v
  return cells
}

const HELP: [string, string][] = [
  ['Any layout works', 'Upload this file or your own price-list workbooks. Every sheet with an Item Number / Model column is read; you confirm which column is which before anything is checked.'],
  ['Preview first', 'You see every new product, every changed field (old → new) and every unchanged product before anything is saved.'],
  ['id', 'Keep it to update that exact product (lets you rename its model). New rows don\'t need one — they are matched by Model.'],
  ['action', 'Blank = create the product if the model is new, otherwise update it. Type "delete" to delete the product.'],
  ['Blank cells', 'A blank cell (or "-" / "N/A") leaves that field unchanged.'],
  ['Clearing a value', `Type ${CLEAR_TOKEN} in a cell to clear that field.`],
  ['Category', 'Dashboard Category = the category in the admin. In your own price lists the sheet name is used instead.'],
  ['Prices', 'D.P. is the dealer price. Columns like "D.P. (2 Mtr)" are saved as extra prices.'],
  ['Extra specs', `Any other column (or "${SPEC_PREFIX} <Label>") is saved as an extra specification.`],
  ['Not in the file', 'Products missing from the file are left alone — only "delete" deletes.'],
]

/** Downloads the given products (none = an empty template) as an .xlsx file. */
export async function exportProductsXlsx(products: Product[], filename: string): Promise<void> {
  const ExcelJS = (await import('exceljs')).default
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Products', { views: [{ state: 'frozen', ySplit: 1, xSplit: 3 }] })

  const rows = products.map(productCells)
  const extraKeys = (prefix: string) => Array.from(new Set(rows.flatMap(r => Object.keys(r).filter(k => k.startsWith(prefix)))))
    .sort((a, b) => a.localeCompare(b))
  const columns = [
    { header: 'id', key: 'id', width: 8 },
    { header: 'action', key: 'action', width: 9 },
    ...EXPORT_FIELDS.map(f => ({ header: f.header ?? f.label, key: f.key, width: f.key === 'hero_description' || f.key === 'gallery_images' ? 40 : 16 })),
    ...extraKeys(PRICE_PREFIX).map(k => ({ header: k.slice(PRICE_PREFIX.length), key: k, width: 14 })),
    ...extraKeys(SPEC_PREFIX).map(k => ({ header: `${SPEC_PREFIX} ${k.slice(SPEC_PREFIX.length)}`, key: k, width: 16 })),
  ]
  ws.columns = columns
  for (const r of rows) ws.addRow(r)

  const header = ws.getRow(1)
  header.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF171717' } }
  ws.getColumn('id').font = { color: { argb: 'FF8A8478' } }
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } }

  const help = wb.addWorksheet('How to use')
  help.columns = [{ width: 20 }, { width: 110 }]
  for (const [k, v] of HELP) help.addRow([k, v]).getCell(1).font = { bold: true }

  const buf = await wb.xlsx.writeBuffer()
  const url = URL.createObjectURL(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
