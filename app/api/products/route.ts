import { NextRequest, NextResponse } from 'next/server'
import { listProducts, createProduct } from '@/lib/services/products'

export async function GET(req: NextRequest) {
  const url = req.url || 'http://localhost:3000/api/products'
  const { searchParams } = new URL(url)

  const zone     = searchParams.get('zone') || undefined
  const search   = searchParams.get('search') || undefined
  const category = searchParams.get('category') || undefined
  const source   = searchParams.get('source') || undefined

  const products = await listProducts({ zone, search, category, source })
  return NextResponse.json({ data: products })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const product = await createProduct(body)
  return NextResponse.json(product)
}
