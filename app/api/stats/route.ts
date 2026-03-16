import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const url = req.url || 'http://localhost:3000/api/stats'
  const { searchParams } = new URL(url)
  const zone = searchParams.get('zone') || undefined
  return NextResponse.json(db.getStats(zone))
}