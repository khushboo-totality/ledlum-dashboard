import { NextResponse } from 'next/server'
import { getProductTaxonomy } from '@/lib/services/products'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(await getProductTaxonomy())
}
