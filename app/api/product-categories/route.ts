import { NextRequest, NextResponse } from 'next/server'
import { getCaller } from '@/lib/serverAuth'
import { getPermissions } from '@/lib/auth'
import { listCategories, createCategory, CategoryError } from '@/lib/services/categories'

export const dynamic = 'force-dynamic'

// GET — all categories with product counts (for the product form dropdown).
export async function GET() {
  try {
    return NextResponse.json(await listCategories())
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 })
  }
}

// POST { name, collection? } — anyone who can create products can add a category.
export async function POST(req: NextRequest) {
  const caller = await getCaller(req)
  if (!caller) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  if (!getPermissions(caller.role).create) {
    return NextResponse.json({ error: 'You do not have permission to add categories' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  try {
    return NextResponse.json(await createCategory(body.name, body.collection), { status: 201 })
  } catch (err) {
    if (err instanceof CategoryError) return NextResponse.json({ error: err.message }, { status: err.status })
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 })
  }
}
