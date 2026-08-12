import { NextRequest, NextResponse } from 'next/server'
import { listProducts, syncExternal } from '@/lib/services/products'

export async function GET() {
  const { items } = await listProducts()
  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { records, zone } = body

  const result = await syncExternal(records, zone)
  return NextResponse.json(result)
}
