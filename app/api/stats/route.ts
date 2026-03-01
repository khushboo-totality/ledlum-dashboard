import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const zone = searchParams.get('zone') || undefined
  return NextResponse.json(db.getStats(zone))
}
