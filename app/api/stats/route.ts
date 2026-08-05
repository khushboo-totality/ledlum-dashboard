import { NextRequest, NextResponse } from 'next/server'
import { getStats } from '@/lib/services/products'

export async function GET(req: NextRequest) {
  const url = req.url || 'http://localhost:3000/api/stats'
  const { searchParams } = new URL(url)
  const zone = searchParams.get('zone') || undefined
  return NextResponse.json(await getStats(zone))
}
