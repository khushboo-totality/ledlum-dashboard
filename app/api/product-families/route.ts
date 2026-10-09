import { NextResponse } from 'next/server'
import { listFamilies } from '@/lib/services/products'

export const dynamic = 'force-dynamic'

// GET — all product families with product counts (for the product form's Family dropdown).
export async function GET() {
  try {
    return NextResponse.json(await listFamilies())
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 })
  }
}
