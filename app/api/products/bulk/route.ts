import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/serverAuth'
import { logActivity } from '@/lib/activity'
import { applyBulk, planBulk } from '@/lib/services/bulkProducts'
import { BULK_APPLY_CHUNK, MAX_BULK_ROWS, type BulkInputRow, type BulkOptions } from '@/lib/bulkColumns'

export const dynamic = 'force-dynamic'

/** Untrusted JSON → sheet rows (string cells only, sizes capped). */
function parseRows(raw: unknown, max: number): BulkInputRow[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > max) return null
  const rows: BulkInputRow[] = []
  for (const r of raw) {
    if (!r || typeof r !== 'object') return null
    const { row, sheet, line, data } = r as Record<string, unknown>
    if (typeof row !== 'number' || !data || typeof data !== 'object' || Array.isArray(data)) return null
    const cells: Record<string, string> = {}
    for (const [k, v] of Object.entries(data as Record<string, unknown>).slice(0, 200)) {
      if (typeof v === 'string' || typeof v === 'number') cells[String(k).slice(0, 120)] = String(v).slice(0, 5000)
    }
    rows.push({
      row,
      sheet: typeof sheet === 'string' ? sheet.slice(0, 120) : '',
      line: typeof line === 'number' ? line : row,
      data: cells,
    })
  }
  return rows
}

function parseOptions(raw: unknown): BulkOptions {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const collection = typeof o.newCategoryCollection === 'string' ? o.newCategoryCollection.trim().toLowerCase().slice(0, 60) : ''
  return {
    createCategories: o.createCategories === true,
    newCategoryCollection: collection || null,
    categoryForExisting: o.categoryForExisting === true,
  }
}

// POST { mode: 'preview' | 'apply', rows: [{ row, sheet, line, data }], options } — admin only.
//   preview: dry run for the whole upload, nothing is written.
//   apply:   writes one chunk of rows (the client sends the upload in chunks).
export async function POST(req: NextRequest) {
  const caller = await requireAdmin(req)
  if (caller instanceof NextResponse) return caller

  const body = await req.json().catch(() => ({}))
  const mode = body.mode === 'apply' ? 'apply' : 'preview'
  const max = mode === 'apply' ? BULK_APPLY_CHUNK * 2 : MAX_BULK_ROWS
  const rows = parseRows(body.rows, max)
  if (!rows) {
    return NextResponse.json({ error: `Send between 1 and ${max} rows` }, { status: 400 })
  }
  const options = parseOptions(body.options)

  try {
    if (mode === 'preview') {
      const plan = await planBulk(rows, options)
      return NextResponse.json({ items: plan.map(p => p.item) })
    }

    const items = await applyBulk(rows, options)
    const count = (s: string) => items.filter(i => i.status === s).length
    await logActivity({
      userId: caller.id, username: caller.username, role: caller.role, req,
      event: 'products_bulk_updated',
      details: {
        created: count('create'), updated: count('update'), deleted: count('delete'), failed: count('error'),
        models: items.filter(i => i.status !== 'unchanged').map(i => `${i.status}:${i.model}`).slice(0, 100),
      },
    })
    return NextResponse.json({ items })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Bulk upload failed' }, { status: 500 })
  }
}
