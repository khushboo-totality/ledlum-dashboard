import { NextRequest, NextResponse } from 'next/server'
import { vendorStore } from '@/lib/vendorStore'

export async function GET() {
  return NextResponse.json(vendorStore.getAll().map(v => ({ ...v, password: '••••••••' })))
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { username, password, name, company, email } = body
  if (!username || !password || !name || !company || !email) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
  }
  const result = vendorStore.create({ username, password, name, company, email })
  if ('error' in result) return NextResponse.json(result, { status: 409 })
  return NextResponse.json({ ...result, password: '••••••••' }, { status: 201 })
}
