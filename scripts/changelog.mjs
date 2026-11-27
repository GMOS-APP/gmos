#!/usr/bin/env node
// Changelog entries as files, applied to the `changelog` table on deploy.
//
// Each user-facing change adds changelog/<YYYY-MM-DD>-<slug>.json:
//   { "entries": [{ "type": "new" | "improved" | "fixed", "text": "..." }] }
// The release version is the date in the file name. All files for the same day
// merge into one release row, matching the rule in CLAUDE.md.
//
//   node scripts/changelog.mjs check
//     Validates every file. Runs in CI.
//   node scripts/changelog.mjs apply --changed-from <sha>
//     Upserts the releases this push touched. Needs SUPABASE_URL and
//     SUPABASE_SERVICE_ROLE_KEY.
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DIR = join(ROOT, 'changelog')
const FILE = /^(\d{4}-\d{2}-\d{2})-[a-z0-9-]+\.json$/
const TYPES = ['new', 'improved', 'fixed']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export const friendlyDate = (iso) => {
  const [y, m, d] = iso.split('-').map(Number)
  return `${MONTHS[m - 1]} ${d}, ${y}`
}

export function validateFile(name, data) {
  const errors = []
  const m = name.match(FILE)
  if (!m) errors.push(`${name}: must be named YYYY-MM-DD-slug.json`)
  if (!data || !Array.isArray(data.entries) || !data.entries.length) errors.push(`${name}: needs a non-empty "entries" array`)
  for (const e of data?.entries || []) {
    if (!TYPES.includes(e?.type)) errors.push(`${name}: entry type must be one of ${TYPES.join('|')}`)
    if (!e?.text || typeof e.text !== 'string' || e.text.length > 500) errors.push(`${name}: entry text must be 1–500 characters`)
  }
  return errors
}

/** Merge new entries into an existing release, skipping duplicate text. */
export function mergeEntries(existing = [], incoming = []) {
  const seen = new Set(existing.map((e) => e.text.trim().toLowerCase()))
  return [...existing, ...incoming.filter((e) => !seen.has(e.text.trim().toLowerCase()))]
}

const files = () => (existsSync(DIR) ? readdirSync(DIR).filter((f) => f.endsWith('.json')) : [])
const load = (f) => JSON.parse(readFileSync(join(DIR, f), 'utf8'))

async function apply(from) {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required')
  const changed = execFileSync('git', ['diff', '--name-only', from, 'HEAD', '--', 'changelog'], { cwd: ROOT, encoding: 'utf8' })
    .split('\n').map((f) => f.split('/').pop()).filter((f) => FILE.test(f) && existsSync(join(DIR, f)))
  if (!changed.length) return console.log('No changelog entries in this push.')

  const byVersion = new Map()
  for (const f of changed) {
    const version = f.match(FILE)[1]
    byVersion.set(version, [...(byVersion.get(version) || []), ...load(f).entries])
  }

  // A legacy service_role key is a JWT and also goes in Authorization; a new `sb_secret_…` key is not a JWT
  // and must be sent as `apikey` only.
  const headers = { apikey: key, 'Content-Type': 'application/json', Prefer: 'return=representation' }
  if (key.startsWith('eyJ')) headers.Authorization = `Bearer ${key}`
  for (const [version, incoming] of byVersion) {
    const res = await fetch(`${url}/rest/v1/changelog?version=eq.${version}&select=id,entries`, { headers })
    if (!res.ok) throw new Error(`read ${version}: ${res.status} ${await res.text()}`)
    const [row] = await res.json()
    const body = row
      ? { entries: mergeEntries(row.entries, incoming), updated_date: new Date().toISOString() }
      : { version, date: friendlyDate(version), entries: mergeEntries([], incoming), published: true }
    const write = await fetch(`${url}/rest/v1/changelog${row ? `?id=eq.${row.id}` : ''}`, {
      method: row ? 'PATCH' : 'POST', headers, body: JSON.stringify(body),
    })
    if (!write.ok) throw new Error(`write ${version}: ${write.status} ${await write.text()}`)
    console.log(`changelog ${version}: ${row ? 'updated' : 'created'} (${incoming.length} entries)`)
  }
}

async function main(argv) {
  if (argv[0] === 'check') {
    const errors = files().flatMap((f) => {
      try { return validateFile(f, load(f)) } catch (e) { return [`${f}: invalid JSON (${e.message})`] }
    })
    errors.forEach((e) => console.error(`✗ ${e}`))
    if (errors.length) process.exit(1)
    return console.log(`changelog: ${files().length} file(s) ok`)
  }
  if (argv[0] === 'apply') return apply(argv[argv.indexOf('--changed-from') + 1])
  throw new Error('usage: changelog.mjs check | apply --changed-from <sha>')
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main(process.argv.slice(2)).catch((e) => { console.error(e.message); process.exit(1) })
}
