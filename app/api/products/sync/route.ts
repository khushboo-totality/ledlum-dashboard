import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  return NextResponse.json(db.getAll())
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { records, zone } = body
  
  const result = db.syncExternal(records, zone)
  return NextResponse.json(result)
}