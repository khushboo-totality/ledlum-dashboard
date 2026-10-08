import { NextRequest, NextResponse } from 'next/server'
import { getCaller } from '@/lib/serverAuth'
import { getPermissions } from '@/lib/auth'
import { buildProductKey, slugify, uploadFile } from '@/lib/r2'

export const runtime = 'nodejs'

// Vercel caps request bodies at 4.5 MB; the browser downsizes photos before
// sending (lib/resizeImage.ts), so real uploads stay well under this.
const MAX_BYTES = 4.5 * 1024 * 1024
const ALLOWED_TYPES: Record<string, string> = {
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
  'image/png':  'png',
  'image/gif':  'gif',
  'image/svg+xml': 'svg',
}

// POST multipart { file, collection?, model?, kind? ('hero' | 'gallery') }
// — uploads a product image to R2 and returns its public URL.
export async function POST(req: NextRequest) {
  const caller = await getCaller(req)
  if (!caller) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  const perms = getPermissions(caller.role)
  if (!perms.create && !perms.edit) {
    return NextResponse.json({ error: 'You do not have permission to upload images' }, { status: 403 })
  }

  const form = await req.formData().catch(() => null)
  const file = form?.get('file')
  if (!(file instanceof File)) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'Image is too large (max 4.5 MB)' }, { status: 413 })
  const ext = ALLOWED_TYPES[file.type]
  if (!ext) return NextResponse.json({ error: 'Only JPG, PNG, WebP, GIF or SVG images can be uploaded' }, { status: 415 })

  const collection = String(form?.get('collection') ?? '') || 'uncategorized'
  const model      = String(form?.get('model') ?? '') || 'unnamed'
  const kind       = form?.get('kind') === 'gallery' ? 'gallery' : 'hero'
  const base       = slugify(file.name.replace(/\.[^.]+$/, '')).slice(0, 50) || kind
  const key        = buildProductKey(collection, model, `${kind}-${Date.now()}-${base}.${ext}`)

  try {
    const { url } = await uploadFile({ key, body: Buffer.from(await file.arrayBuffer()), contentType: file.type })
    return NextResponse.json({ url })
  } catch (err) {
    console.error('[upload] R2 upload failed:', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Upload failed' }, { status: 500 })
  }
}
