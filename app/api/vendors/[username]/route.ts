import { NextRequest, NextResponse } from 'next/server'
import { vendorStore } from '@/lib/vendorStore'

export async function DELETE(_req: NextRequest, { params }: { params: { username: string } }) {
  const ok = vendorStore.delete(params.username)
  if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ success: true })
}
