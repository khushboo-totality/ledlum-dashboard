import { NextResponse } from 'next/server'
import { listZones } from '@/lib/services/zones'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(await listZones())
}
