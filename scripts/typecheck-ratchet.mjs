#!/usr/bin/env node
// Typecheck ratchet. Both codebases have a backlog of errors from before
// typechecking was enforced. CI fails only when a count rises above its
// committed baseline.
//
//   node scripts/typecheck-ratchet.mjs [--target app|functions] [--update]
//
//   app        tsc -p jsconfig.json (JSDoc app code; node_modules excluded)
//              baseline in .typecheck-baseline
//   functions  deno check on the edge functions (needs `deno` on PATH)
//              baseline in .deno-check-baseline
import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

export const countTscErrors = (output) =>
  output.split('\n').filter((l) => /error TS\d+/.test(l) && !l.startsWith('node_modules')).length
// Deno prints "Found N errors." (or "Found 1 error."), or nothing on success.
export const countDenoErrors = (output, status) => {
  const m = output.match(/Found (\d+) errors?\./)
  if (m) return Number(m[1])
  if (status !== 0) throw new Error(`deno check failed without a type-error summary:\n${output.slice(-2000)}`)
  return 0
}

const TARGETS = {
  app: {
    baseline: '.typecheck-baseline',
    fix: 'npm run typecheck:baseline',
    run() {
      const tsc = createRequire(import.meta.url).resolve('typescript/bin/tsc')
      const r = spawnSync(process.execPath, [tsc, '-p', 'jsconfig.json', '--pretty', 'false'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 << 20 })
      const out = r.stdout || ''
      return { count: countTscErrors(out), detail: out.split('\n').filter((l) => /error TS/.test(l) && !l.startsWith('node_modules')).slice(-40).join('\n') }
    },
  },
  functions: {
    baseline: '.deno-check-baseline',
    fix: 'node scripts/typecheck-ratchet.mjs --target functions --update',
    run() {
      const files = [
        ...readdirSync(join(ROOT, 'functions')).filter((f) => f.endsWith('.ts')).map((f) => `functions/${f}`),
        ...readdirSync(join(ROOT, 'supabase/functions'), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => `supabase/functions/${d.name}/index.ts`),
      ]
      const r = spawnSync('deno', ['check', '--node-modules-dir=none', ...files], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 << 20, env: { ...process.env, NO_COLOR: '1' }, shell: process.platform === 'win32' })
      const out = `${r.stdout || ''}${r.stderr || ''}`
      return { count: countDenoErrors(out, r.status), detail: out.slice(-6000) }
    },
  },
}

function main(argv) {
  const name = argv.includes('--target') ? argv[argv.indexOf('--target') + 1] : 'app'
  const t = TARGETS[name]
  if (!t) throw new Error(`unknown target ${name}`)
  const file = join(ROOT, t.baseline)
  const { count, detail } = t.run()
  const baseline = existsSync(file) ? Number(readFileSync(file, 'utf8').trim()) : Infinity
  if (argv.includes('--update')) {
    writeFileSync(file, `${count}\n`)
    return console.log(`${name} typecheck baseline set to ${count}`)
  }
  if (count > baseline) {
    console.error(detail)
    console.error(`\n✗ ${name} typecheck: ${count} errors, baseline is ${baseline}. Fix the new errors above.`)
    process.exit(1)
  }
  console.log(`${name} typecheck: ${count} errors (baseline ${baseline})${count < baseline ? ` — improved! run \`${t.fix}\` to lock it in` : ''}`)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try { main(process.argv.slice(2)) } catch (e) { console.error(e.message); process.exit(1) }
}
