// One-time script: extracts {Codes, zone} pairs from the old lib/db.ts
// mock SEED data and links matching ledlum_products rows (by model) to the
// corresponding ledlum_zone row, via ledlum_product_zone.
//
// Run once, after the SQL migration (supabase/migrations/001_create_zone_tables.sql)
// has been applied:
//
//   node --env-file=.env.local scripts/backfill-product-zones.mjs
//
// Safe to re-run — uses upsert with ignoreDuplicates against the
// (product_id, zone_id) unique constraint.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY env vars.')
  process.exit(1)
}
const supabase = createClient(url, key)

function chunk(arr, size) {
  const out = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

async function main() {
  const dbFile = fs.readFileSync(path.join(repoRoot, 'lib/db.ts'), 'utf8')
  const seedStart = dbFile.indexOf('const SEED')
  const seedEnd = dbFile.indexOf('\nconst globalStore')
  if (seedStart === -1 || seedEnd === -1) {
    console.error('Could not locate SEED array in lib/db.ts — has it already been deleted?')
    process.exit(1)
  }
  const seedSection = dbFile.slice(seedStart, seedEnd)

  const re = /\{\s*"Codes":\s*"([^"]*)"[\s\S]*?"zone":\s*"([^"]*)"\s*\}/g
  const pairs = []
  let m
  while ((m = re.exec(seedSection))) pairs.push({ codes: m[1], zoneSlug: m[2] })
  console.log(`Extracted ${pairs.length} Codes/zone pairs from lib/db.ts SEED`)

  const { data: zoneRows, error: zoneErr } = await supabase.from('ledlum_zone').select('id, slug')
  if (zoneErr) throw zoneErr
  if (!zoneRows || zoneRows.length === 0) {
    console.error('ledlum_zone is empty — run the SQL migration first.')
    process.exit(1)
  }
  const zoneBySlug = new Map(zoneRows.map(z => [z.slug, z.id]))

  const uniqueCodes = Array.from(new Set(pairs.map(p => p.codes)))
  const productByModel = new Map()
  for (const batch of chunk(uniqueCodes, 200)) {
    const { data, error } = await supabase.from('ledlum_products').select('id, model').in('model', batch)
    if (error) throw error
    for (const row of data) if (!productByModel.has(row.model)) productByModel.set(row.model, row.id)
  }

  const toInsert = []
  const seen = new Set()
  let zoneMissing = 0, productMissing = 0

  for (const { codes, zoneSlug } of pairs) {
    const zoneId = zoneBySlug.get(zoneSlug)
    const productId = productByModel.get(codes)
    if (!zoneId) { zoneMissing++; continue }
    if (!productId) { productMissing++; continue }
    const dedupeKey = `${productId}:${zoneId}`
    if (seen.has(dedupeKey)) continue
    seen.add(dedupeKey)
    toInsert.push({ product_id: productId, zone_id: zoneId })
  }
  console.log(`Resolved ${toInsert.length} unique product<->zone links (zoneMissing=${zoneMissing}, modelNotFoundInSupabase=${productMissing})`)

  let inserted = 0
  for (const batch of chunk(toInsert, 500)) {
    const { error, count } = await supabase
      .from('ledlum_product_zone')
      .upsert(batch, { onConflict: 'product_id,zone_id', ignoreDuplicates: true, count: 'exact' })
    if (error) { console.error('Batch insert failed:', error.message); continue }
    inserted += count ?? 0
  }

  console.log(`Backfill complete. Inserted ${inserted} new product<->zone links (duplicates skipped).`)
  console.log(`${productMissing} SEED codes had no matching model in ledlum_products — those products still need manual zone assignment via the UI.`)
}

main().catch(err => { console.error(err); process.exit(1) })
