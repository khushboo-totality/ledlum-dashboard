import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const url = req.url || 'http://localhost:3000/api/products'
  const { searchParams } = new URL(url)
  
  const zone = searchParams.get('zone') || undefined
  const search = searchParams.get('search') || undefined
  const category = searchParams.get('category') || undefined
  const source = searchParams.get('source') || undefined

  let products = db.getAll()
  
  if (zone) products = products.filter(p => p.zone === zone)
  if (search) products = products.filter(p => 
    p.Codes.toLowerCase().includes(search.toLowerCase()) ||
    p.Category.toLowerCase().includes(search.toLowerCase())
  )
  if (category) products = products.filter(p => p.Category === category)
  if (source) products = products.filter(p => p.source === source)

  return NextResponse.json({ data: products })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const product = db.create(body)
  return NextResponse.json(product)
}