// Creates a dashboard login (Supabase Auth user + ledlum_profiles row).
// Use it to bootstrap the first admin — after that, admins create partner
// accounts from the dashboard's "Partners" section.
//
// Run after supabase/migrations/003 and 004 have been applied:
//
//   node --env-file=.env.local scripts/create-user.mjs <username> <email> <password> <role> "<Full Name>" ["<Company>"]
//
//   e.g. node --env-file=.env.local scripts/create-user.mjs admin admin@ledlum.com 'S3cure!pass' admin "Admin"
//
// role: admin | editor | viewer | partner

import { randomBytes, scryptSync } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

// Same format as lib/password.ts hashPassword().
const hashPassword = (pw) => {
  const salt = randomBytes(16).toString('hex')
  return `scrypt$${salt}$${scryptSync(pw, salt, 64).toString('hex')}`
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY env vars.')
  process.exit(1)
}

const [username, email, password, role, name, company] = process.argv.slice(2)
const ROLES = ['admin', 'editor', 'viewer', 'partner']
if (!username || !email || !password || !role || !name) {
  console.error('Usage: create-user.mjs <username> <email> <password> <role> "<Full Name>" ["<Company>"]')
  process.exit(1)
}
if (!ROLES.includes(role)) {
  console.error(`role must be one of: ${ROLES.join(', ')}`)
  process.exit(1)
}

const supabase = createClient(url, key, { auth: { persistSession: false } })

const { data: created, error: authErr } = await supabase.auth.admin.createUser({
  email, password, email_confirm: true,
})
if (authErr) {
  console.error('Failed to create auth user:', authErr.message)
  process.exit(1)
}

const initials = name.split(/\s+/).filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2)
const { error: profileErr } = await supabase.from('ledlum_profiles').insert({
  id: created.user.id,
  username: username.toLowerCase(),
  email, role, name, company: company ?? null, initials,
  password_hash: hashPassword(password),
  password_changed_at: new Date().toISOString(),
  created_by: 'script',
})
if (profileErr) {
  await supabase.auth.admin.deleteUser(created.user.id)
  console.error('Failed to create profile:', profileErr.message)
  process.exit(1)
}

console.log(`Created ${role} "${username}" (${email}).`)
