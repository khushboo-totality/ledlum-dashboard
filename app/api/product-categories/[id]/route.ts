import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/serverAuth'
import { updateCategory, deleteCategory, CategoryError } from '@/lib/services/categories'

function fail(err: unknown) {
  if (err instanceof CategoryError) return NextResponse.json({ error: err.message }, { status: err.status })
  return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 })
}

// PATCH { name?, collection? } — admin renames a category and/or moves it to
// another main category (updates every product using it).
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(req)
  if (admin instanceof NextResponse) return admin
  const id = Number(params.id)
  if (!Number.isFinite(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const body = await req.json().catch(() => ({}))
  try {
    return NextResponse.json(await updateCategory(id, { name: body.name, collection: body.collection }))
  } catch (err) {
    return fail(err)
  }
}

// DELETE — admin removes a category with no products.
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(req)
  if (admin instanceof NextResponse) return admin
  const id = Number(params.id)
  if (!Number.isFinite(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  try {
    await deleteCategory(id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return fail(err)
  }
}
