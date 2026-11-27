#!/usr/bin/env node
// Deploy changed Supabase edge functions.
//
//   node scripts/deploy-functions.mjs --changed-from <sha> [--dry-run]
//   node scripts/deploy-functions.mjs --all [--dry-run]
//
// Needs SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_REF, plus the `supabase` CLI.
// Safety rules:
//  - verify_jwt is copied from the live function, so a redeploy can't flip it.
//  - A slug that doesn't exist remotely is refused unless it's in allowCreate.
//  - A changed function file with no slug mapping fails the run.
// Most sources live in functions/*.ts, not supabase/functions/<slug>/index.ts.
// In CI (an ephemeral checkout) the file is staged into that layout before
// deploying; locally that needs --stage.
import { execFileSync } from 'node:child_process'
import { readFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const isFunctionSource = (f) => /^functions\/[^/]+\.ts$/.test(f) || /^supabase\/functions\/[^/]+\/index\.ts$/.test(f)

/** Pure planner, exported for tests. */
export function planDeploy({ map, changedFiles = [], remote = [], all = false }) {
  const errors = []
  const entries = Object.entries(map.functions)
  const mappedFiles = new Set(entries.map(([, file]) => file))
  const skip = new Set(map.skip || [])
  const allowCreate = new Set(map.allowCreate || [])
  const remoteBySlug = new Map(remote.map((r) => [r.slug, r]))

  if (!all) {
    for (const f of changedFiles) {
      if (isFunctionSource(f) && !mappedFiles.has(f) && !skip.has(f)) {
        errors.push(`${f} changed but has no slug in scripts/functions.map.json`)
      }
    }
  }

  const deploy = []
  for (const [slug, file] of entries) {
    if (!all && !changedFiles.includes(file)) continue
    const live = remoteBySlug.get(slug)
    if (live) {
      deploy.push({ slug, file, verifyJwt: Boolean(live.verify_jwt ?? live.verifyJwt ?? true) })
    } else if (allowCreate.has(slug)) {
      deploy.push({ slug, file, verifyJwt: true, create: true })
    } else {
      errors.push(`${slug} does not exist in the project; add it to allowCreate to create it deliberately`)
    }
  }
  return { deploy, errors }
}

function sh(cmd, args, opts = {}) {
  return execFileSync(cmd, args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'], ...opts })
}

function main(argv) {
  const all = argv.includes('--all')
  const dryRun = argv.includes('--dry-run')
  const stage = argv.includes('--stage') || process.env.CI === 'true'
  const fromIdx = argv.indexOf('--changed-from')
  const ref = process.env.SUPABASE_PROJECT_REF
  if (!ref) throw new Error('SUPABASE_PROJECT_REF is not set')
  if (!all && fromIdx === -1) throw new Error('pass --changed-from <sha> or --all')

  const map = JSON.parse(readFileSync(join(ROOT, 'scripts/functions.map.json'), 'utf8'))
  const changedFiles = all ? [] : sh('git', ['diff', '--name-only', argv[fromIdx + 1], 'HEAD']).split('\n').filter(Boolean)
  const remote = JSON.parse(sh('supabase', ['functions', 'list', '--project-ref', ref, '--output', 'json']))

  const { deploy, errors } = planDeploy({ map, changedFiles, remote, all })
  if (errors.length) {
    for (const e of errors) console.error(`✗ ${e}`)
    process.exit(1)
  }
  if (!deploy.length) return console.log('No edge functions changed.')

  for (const d of deploy) {
    const target = `supabase/functions/${d.slug}/index.ts`
    console.log(`→ ${d.slug} ← ${d.file} (verify_jwt=${d.verifyJwt}${d.create ? ', NEW' : ''})`)
    if (dryRun) continue
    if (d.file !== target) {
      if (!stage) throw new Error(`${d.file} needs staging to ${target}; rerun with --stage`)
      if (existsSync(join(ROOT, target))) throw new Error(`${target} already exists; refusing to overwrite`)
      mkdirSync(join(ROOT, dirname(target)), { recursive: true })
      copyFileSync(join(ROOT, d.file), join(ROOT, target))
    }
    const args = ['functions', 'deploy', d.slug, '--project-ref', ref, '--use-api']
    if (!d.verifyJwt) args.push('--no-verify-jwt')
    sh('supabase', args, { stdio: 'inherit' })
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    main(process.argv.slice(2))
  } catch (e) {
    console.error(e.message)
    process.exit(1)
  }
}
