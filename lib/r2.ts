// Server-only. Cloudflare R2 (S3-compatible) uploads — same bucket and key
// layout as the LEDLUM website (see ledlum/lib/r2.ts), where all existing
// product photos already live. Never import from a 'use client' component.
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

let client: S3Client | null = null

function getR2Client(): S3Client {
  if (client) return client
  const accountId       = process.env.CLOUDFLARE_ACCOUNT_ID
  const accessKeyId     = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('Missing Cloudflare R2 credentials. Set CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY.')
  }
  client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  })
  return client
}

function getBucketName(): string {
  const bucket = process.env.R2_BUCKET_NAME
  if (!bucket) throw new Error('Missing R2_BUCKET_NAME env var.')
  return bucket
}

export function getPublicUrl(key: string): string {
  const base = process.env.NEXT_PUBLIC_R2_PUBLIC_URL
  if (!base) throw new Error('Missing NEXT_PUBLIC_R2_PUBLIC_URL env var.')
  return `${base.replace(/\/$/, '')}/${key}`
}

export function slugify(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

/** product/<collection>/<model-slug>/<filename> — the website's catalog layout. */
export function buildProductKey(collection: string, model: string, filename: string): string {
  return `product/${slugify(collection) || 'uncategorized'}/${slugify(model) || 'unnamed'}/${filename}`
}

export async function uploadFile(params: { key: string; body: Buffer; contentType: string }): Promise<{ key: string; url: string }> {
  await getR2Client().send(new PutObjectCommand({
    Bucket: getBucketName(),
    Key: params.key,
    Body: params.body,
    ContentType: params.contentType,
  }))
  return { key: params.key, url: getPublicUrl(params.key) }
}
