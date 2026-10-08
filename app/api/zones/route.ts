import { NextRequest, NextResponse } from 'next/server'
import { listZones, listZonesWithCounts, createZone, reorderZones, ZoneError } from '@/lib/services/zones'
import { requireAdmin } from '@/lib/serverAuth'

export const dynamic = 'force-dynamic'

function fail(err: unknown) {
  if (err instanceof ZoneError) return NextResponse.json({ error: err.message }, { status: err.status })
  return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 })
}

// GET — zone list (public). ?counts=1 adds sortOrder + productCount (admin page).
export async function GET(req: NextRequest) {
  try {
    if (req.nextUrl.searchParams.get('counts') === '1') return NextResponse.json(await listZonesWithCounts())
    return NextResponse.json(await listZones())
  } catch (err) {
    return fail(err)
  }
}

// POST { label, slug? } — admin adds a zone.
export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (admin instanceof NextResponse) return admin
  const body = await req.json().catch(() => ({}))
  try {
    return NextResponse.json(await createZone(body.label, body.slug), { status: 201 })
  } catch (err) {
    return fail(err)
  }
}

// PUT { order: string[] } — admin saves the zone order (slugs, top to bottom).
export async function PUT(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (admin instanceof NextResponse) return admin
  const body = await req.json().catch(() => ({}))
  if (!Array.isArray(body.order) || !body.order.every((s: unknown) => typeof s === 'string')) {
    return NextResponse.json({ error: 'order must be a list of zone codes' }, { status: 400 })
  }
  try {
    await reorderZones(body.order)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return fail(err)
  }
}
