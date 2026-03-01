import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const products = db.getAll({
    search:   searchParams.get('search')   || undefined,
    category: searchParams.get('category') || undefined,
    source:   searchParams.get('source')   || undefined,
    zone:     searchParams.get('zone')     || undefined,
  })
  return NextResponse.json({ data: products, meta: { total: products.length } })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  if (!body.Codes) return NextResponse.json({ error: 'Codes is required' }, { status: 400 })
  const product = db.create({
    Codes:     body.Codes,
    Category:  body.Category || 'Uncategorized',
    ImageLink: body.ImageLink || '',
    source:    'internal',
    zone:      body.zone || 'zone-a',
  })
  return NextResponse.json(product, { status: 201 })
}
