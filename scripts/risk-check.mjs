#!/usr/bin/env node
// Classify a pull request as safe to auto-merge or needing the owner's approval.
//
//   node scripts/risk-check.mjs < pr.json
//     pr.json: { "files": ["path", ...], "basePkg": {...}, "headPkg": {...} }
//     Prints a JSON array of reasons. An empty array means safe.
//
// automerge.yml runs this from the BASE branch (pull_request_target), so a PR
// can't weaken its own gate. Changes to this file are themselves risky.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

export const RISKY = [
  { pattern: /^supabase\/migrations\//, reason: 'database migration' },
  { pattern: /^supabase\/config\.toml$/, reason: 'Supabase project config' },
  { pattern: /^functions\/(stripeWebhook|createCheckout|createBillingPortal)\.ts$/, reason: 'billing edge function' },
  { pattern: /^functions\/(deleteAccount|exportAccount|adminApi)\.ts$/, reason: 'account-data / admin edge function' },
  { pattern: /^scripts\/functions\.map\.json$/, reason: 'edge-function deploy map' },
  { pattern: /^src\/lib\/(AuthContext\.jsx|plans\.js)$/, reason: 'auth or plan entitlement' },
  { pattern: /^src\/api\/(supabaseClient|base44Client)\.js$/, reason: 'Supabase client / auth wiring' },
  { pattern: /^src\/components\/layout\/AuthPanel\.jsx$/, reason: 'sign-in UI' },
  { pattern: /^src\/pages\/(Upgrade|AccountSettings)\.jsx$/, reason: 'billing / account page' },
  { pattern: /^vercel\.json$/, reason: 'hosting config / CSP' },
  { pattern: /^\.github\//, reason: 'CI/CD workflow' },
  { pattern: /^\.claude\//, reason: 'agent permissions' },
  { pattern: /^scripts\/(risk-check|deploy-functions|check-migrations|changelog|typecheck-ratchet)\.mjs$/, reason: 'pipeline script' },
  { pattern: /^\.(typecheck|deno-check)-baseline$/, reason: 'typecheck baseline' },
  { pattern: /^package-lock\.json$/, reason: 'dependency lockfile' },
]

const DEP_FIELDS = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies', 'overrides']

export function classify({ files = [], basePkg = {}, headPkg = {} }) {
  const reasons = new Set()
  for (const f of files) {
    for (const r of RISKY) if (r.pattern.test(f)) reasons.add(`${r.reason} (${f})`)
  }
  if (files.includes('package.json')) {
    for (const field of DEP_FIELDS) {
      if (JSON.stringify(basePkg[field] ?? null) !== JSON.stringify(headPkg[field] ?? null)) reasons.add(`package.json ${field} changed`)
    }
    if (JSON.stringify(basePkg.scripts ?? null) !== JSON.stringify(headPkg.scripts ?? null)) reasons.add('package.json scripts changed')
  }
  return [...reasons]
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  console.log(JSON.stringify(classify(JSON.parse(readFileSync(0, 'utf8')))))
}
