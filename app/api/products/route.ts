import { NextRequest, NextResponse } from 'next/server'
import { listProducts, createProduct } from '@/lib/services/products'

export async function GET(req: NextRequest) {
  const url = req.url || 'http://localhost:3000/api/products'
  const { searchParams } = new URL(url)

  const zone        = searchParams.get('zone') || undefined
  const search      = searchParams.get('search') || undefined
  const category    = searchParams.get('category') || undefined
  const source      = searchParams.get('source') || undefined
  const collection  = searchParams.get('collection') || undefined
  const groupName   = searchParams.get('groupName') || undefined
  const productType = searchParams.get('productType') || undefined
  const limitParam  = searchParams.get('limit')
  const offsetParam = searchParams.get('offset')
  const limit  = limitParam  ? Number(limitParam)  : undefined
  const offset = offsetParam ? Number(offsetParam) : undefined

  const { items, hasMore } = await listProducts({
    zone, search, category, source, collection, groupName, productType, limit, offset,
  })
  return NextResponse.json({ data: items, hasMore })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const product = await createProduct(body)
  return NextResponse.json(product)
}
