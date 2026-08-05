import { NextRequest, NextResponse } from 'next/server'
import { listProducts, syncExternal } from '@/lib/services/products'

export async function GET() {
  return NextResponse.json(await listProducts())
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { records, zone } = body

  const result = await syncExternal(records, zone)
  return NextResponse.json(result)
}
