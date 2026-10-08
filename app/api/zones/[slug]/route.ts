import { NextRequest, NextResponse } from 'next/server'
import { renameZone, deleteZone, ZoneError } from '@/lib/services/zones'
import { requireAdmin } from '@/lib/serverAuth'

function fail(err: unknown) {
  if (err instanceof ZoneError) return NextResponse.json({ error: err.message }, { status: err.status })
  return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 })
}

// PATCH { label } — admin renames a zone (its URL code stays the same).
export async function PATCH(req: NextRequest, { params }: { params: { slug: string } }) {
  const admin = await requireAdmin(req)
  if (admin instanceof NextResponse) return admin
  const body = await req.json().catch(() => ({}))
  try {
    await renameZone(params.slug, body.label)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return fail(err)
  }
}

// DELETE — admin removes a zone with no products.
export async function DELETE(req: NextRequest, { params }: { params: { slug: string } }) {
  const admin = await requireAdmin(req)
  if (admin instanceof NextResponse) return admin
  try {
    await deleteZone(params.slug)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return fail(err)
  }
}
