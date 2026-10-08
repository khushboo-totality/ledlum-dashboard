// Client-side: downsize a photo in the browser, then upload it via /api/upload.
// Raw product photos are often 2–5 MB; shrinking to ≤2400px WebP/JPEG first
// keeps uploads fast and under the 4.5 MB request limit.
import { authFetch } from '@/lib/supabaseClient'

const MAX_DIMENSION = 2400

async function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise(resolve => canvas.toBlob(resolve, type, quality))
}

/** Returns a resized WebP (or JPEG fallback) — GIF/SVG are passed through untouched. */
export async function resizeImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif' || file.type === 'image/svg+xml') return file

  const bitmap = await createImageBitmap(file).catch(() => null)
  if (!bitmap) return file
  const scale  = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width  = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()

  // WebP where the browser can encode it, JPEG otherwise.
  let blob = await canvasToBlob(canvas, 'image/webp', 0.85)
  if (!blob || blob.type !== 'image/webp') blob = await canvasToBlob(canvas, 'image/jpeg', 0.88)
  if (!blob) return file
  // Keep the original if re-encoding made it bigger (already-small PNG/WebP).
  if (blob.size >= file.size && scale === 1 && file.size < 4 * 1024 * 1024) return file

  const ext = blob.type === 'image/webp' ? 'webp' : 'jpg'
  return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.' + ext, { type: blob.type })
}

/** Resizes + uploads one product image; returns its public URL. Throws with a readable message. */
export async function uploadProductImage(
  file: File,
  opts: { collection?: string; model?: string; kind: 'hero' | 'gallery' },
): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error(`${file.name} is not an image`)
  const resized = await resizeImage(file)
  const form = new FormData()
  form.append('file', resized)
  form.append('kind', opts.kind)
  if (opts.collection) form.append('collection', opts.collection)
  if (opts.model) form.append('model', opts.model)

  const res  = await authFetch('/api/upload', { method: 'POST', body: form })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.url) throw new Error(data.error ?? `Upload failed (${res.status})`)
  return data.url as string
}
