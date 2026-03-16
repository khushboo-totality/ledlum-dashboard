const fs = require('fs')
const path = require('path')

console.log('🔄 Restoring API routes for full functionality...')

// Create API directory structure
const apiDir = path.join(process.cwd(), 'app/api')
if (!fs.existsSync(apiDir)) {
  fs.mkdirSync(apiDir, { recursive: true })
}

// Create products API
const productsDir = path.join(apiDir, 'products')
if (!fs.existsSync(productsDir)) {
  fs.mkdirSync(productsDir, { recursive: true })
}

// Create products/[id] directory
const productIdDir = path.join(productsDir, '[id]')
if (!fs.existsSync(productIdDir)) {
  fs.mkdirSync(productIdDir, { recursive: true })
}

// API Routes content
const productsRoute = `import { NextRequest, NextResponse } from 'next/server'
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
}`

const productIdRoute = `import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const product = db.getById(params.id)
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(product)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const updated = db.update(params.id, body)
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const ok = db.delete(params.id)
  if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ success: true })
}`

const syncRoute = `import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  return NextResponse.json(db.getAll())
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { records, zone } = body
  
  const result = db.syncExternal(records, zone)
  return NextResponse.json(result)
}`

const categoriesRoute = `import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const url = req.url || 'http://localhost:3000/api/categories'
  const { searchParams } = new URL(url)
  const zone = searchParams.get('zone') || undefined
  return NextResponse.json(db.getCategories(zone))
}`

const statsRoute = `import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const url = req.url || 'http://localhost:3000/api/stats'
  const { searchParams } = new URL(url)
  const zone = searchParams.get('zone') || undefined
  return NextResponse.json(db.getStats(zone))
}`

const vendorsRoute = `import { NextRequest, NextResponse } from 'next/server'
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
}`

// Write API route files
fs.writeFileSync(path.join(productsDir, 'route.ts'), productsRoute)
fs.writeFileSync(path.join(productIdDir, 'route.ts'), productIdRoute)

// Create sync directory
const syncDir = path.join(productsDir, 'sync')
fs.mkdirSync(syncDir, { recursive: true })
fs.writeFileSync(path.join(syncDir, 'route.ts'), syncRoute)

// Create other API routes
fs.mkdirSync(path.join(apiDir, 'categories'), { recursive: true })
fs.writeFileSync(path.join(apiDir, 'categories', 'route.ts'), categoriesRoute)

fs.mkdirSync(path.join(apiDir, 'stats'), { recursive: true })
fs.writeFileSync(path.join(apiDir, 'stats', 'route.ts'), statsRoute)

fs.mkdirSync(path.join(apiDir, 'vendors'), { recursive: true })
fs.writeFileSync(path.join(apiDir, 'vendors', 'route.ts'), vendorsRoute)

// Modify next.config.js to remove output: 'export'
const configPath = path.join(process.cwd(), 'next.config.js')
const configContent = `/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'drive.google.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
}

module.exports = nextConfig`

fs.writeFileSync(configPath, configContent)

console.log('✅ API routes restored for full functionality')
console.log('🔧 Next.js config updated for server mode')
console.log('🚀 Ready for development with API support')
