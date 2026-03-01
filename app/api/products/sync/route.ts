import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  const body = await req.json()
  if (!Array.isArray(body.records)) return NextResponse.json({ error: 'records must be an array' }, { status: 400 })
  const result = db.syncExternal(body.records)
  return NextResponse.json({ success: true, ...result, total: db.getAll().length })
}
