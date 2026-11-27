#!/usr/bin/env node
// Migration guard.
//
//   node scripts/check-migrations.mjs lint
//     Checks names in supabase/migrations/: they must be
//     YYYYMMDDHHMMSS_snake.sql, with unique versions.
//
//   node scripts/check-migrations.mjs pending --changed-from <sha> < dry-run.txt
//     Reads `supabase db push --dry-run` output on stdin and fails unless the
//     pending migrations are exactly the ones this push added. Remote history
//     drift fails closed and is never "fixed" by pushing.
import { readdirSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const NAME = /^(\d{14})_[a-z0-9_]+\.sql$/

export function lintMigrations(files) {
  const errors = []
  const seen = new Map()
  for (const f of files.filter((f) => f.endsWith('.sql'))) {
    const m = f.match(NAME)
    if (!m) { errors.push(`${f}: must be named YYYYMMDDHHMMSS_snake_case.sql`); continue }
    if (seen.has(m[1])) errors.push(`${f}: version ${m[1]} already used by ${seen.get(m[1])}`)
    seen.set(m[1], f)
  }
  return errors
}

export function parsePending(dryRunOutput) {
  return [...new Set(dryRunOutput.match(/\d{14}_[a-z0-9_]+\.sql/g) || [])].sort()
}

/** A baseline stub marks a version applied before the pipeline; it is expected to be already applied. */
export const BASELINE = /^-- baseline:/

export function comparePending(pending, added, baseline = []) {
  const a = [...added].sort()
  const extra = pending.filter((p) => !a.includes(p))
  const missing = a.filter((p) => !pending.includes(p) && !baseline.includes(p))
  const errors = []
  if (extra.length) errors.push(`would apply migrations not added by this push (history drift): ${extra.join(', ')}`)
  if (missing.length) errors.push(`added migrations not pending remotely (already applied by hand?): ${missing.join(', ')}`)
  return errors
}

function main(argv) {
  const dir = join(ROOT, 'supabase/migrations')
  if (argv[0] === 'lint') {
    const errors = lintMigrations(readdirSync(dir))
    errors.forEach((e) => console.error(`✗ ${e}`))
    if (errors.length) process.exit(1)
    return console.log('migrations: ok')
  }
  if (argv[0] === 'pending') {
    const from = argv[argv.indexOf('--changed-from') + 1]
    const added = execFileSync('git', ['diff', '--name-only', '--diff-filter=A', from, 'HEAD', '--', 'supabase/migrations'], { cwd: ROOT, encoding: 'utf8' })
      .split('\n').filter((f) => f.endsWith('.sql')).map((f) => f.split('/').pop())
    const pending = parsePending(readFileSync(0, 'utf8'))
    const baseline = added.filter((f) => BASELINE.test(readFileSync(join(dir, f), 'utf8')))
    const errors = comparePending(pending, added, baseline)
    errors.forEach((e) => console.error(`✗ ${e}`))
    if (errors.length) process.exit(1)
    return console.log(pending.length ? `pending ok: ${pending.join(', ')}` : 'no migrations pending')
  }
  throw new Error('usage: check-migrations.mjs lint | pending --changed-from <sha>')
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main(process.argv.slice(2))
