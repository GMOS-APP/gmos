import { describe, it, expect } from 'vitest'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { planDeploy } from './deploy-functions.mjs'
import { lintMigrations, parsePending, comparePending } from './check-migrations.mjs'
import { validateFile, mergeEntries, friendlyDate } from './changelog.mjs'

const map = {
  functions: { 'player-view': 'functions/playerView.ts', stripeWebhook: 'functions/stripeWebhook.ts', 'new-fn': 'functions/newFn.ts' },
  skip: ['functions/invoke-llm.ts'],
  allowCreate: [],
}
const remote = [{ slug: 'player-view', verify_jwt: false }, { slug: 'stripeWebhook', verify_jwt: false }]

describe('planDeploy', () => {
  it('deploys only changed functions and copies verify_jwt from the live project', () => {
    const { deploy, errors } = planDeploy({ map, remote, changedFiles: ['functions/playerView.ts', 'src/App.jsx'] })
    expect(errors).toEqual([])
    expect(deploy).toEqual([{ slug: 'player-view', file: 'functions/playerView.ts', verifyJwt: false }])
  })
  it('refuses to create a slug that does not exist remotely', () => {
    const { errors } = planDeploy({ map, remote, changedFiles: ['functions/newFn.ts'] })
    expect(errors[0]).toMatch(/new-fn does not exist/)
  })
  it('allows creation when listed in allowCreate', () => {
    const { deploy, errors } = planDeploy({ map: { ...map, allowCreate: ['new-fn'] }, remote, changedFiles: ['functions/newFn.ts'] })
    expect(errors).toEqual([])
    expect(deploy[0]).toMatchObject({ slug: 'new-fn', create: true, verifyJwt: true })
  })
  it('fails on a changed function file with no mapping, but ignores skipped ones', () => {
    expect(planDeploy({ map, remote, changedFiles: ['functions/mystery.ts'] }).errors[0]).toMatch(/no slug/)
    expect(planDeploy({ map, remote, changedFiles: ['functions/invoke-llm.ts'] }).errors).toEqual([])
  })
})

describe('migration guard', () => {
  it('enforces names and unique versions', () => {
    expect(lintMigrations(['20261126120000_add_x.sql', '.gitkeep'])).toEqual([])
    expect(lintMigrations(['20260618_blog.sql'])[0]).toMatch(/must be named/)
    expect(lintMigrations(['20261126120000_a.sql', '20261126120000_b.sql'])[0]).toMatch(/already used/)
  })
  it('fails closed when the remote would apply more than this push added', () => {
    const pending = parsePending('Would push these migrations:\n • 20261126120000_a.sql\n • 20261101000000_old.sql\n')
    expect(pending).toEqual(['20261101000000_old.sql', '20261126120000_a.sql'])
    expect(comparePending(pending, ['20261126120000_a.sql'])[0]).toMatch(/history drift/)
    expect(comparePending(['20261126120000_a.sql'], ['20261126120000_a.sql'])).toEqual([])
  })

  it('accepts baseline stubs that are already applied, but not other non-pending files', () => {
    const added = ['20260313024143_security_hardening.sql', '20261126120000_a.sql']
    expect(comparePending(['20261126120000_a.sql'], added, ['20260313024143_security_hardening.sql'])).toEqual([])
    expect(comparePending([], added, ['20260313024143_security_hardening.sql'])[0]).toMatch(/20261126120000_a\.sql/)
  })

  it('every applied migration in supabase/migrations is a baseline stub or a real file', () => {
    const files = readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql'))
    expect(lintMigrations(files)).toEqual([])
  })
})

describe('functions.map.json', () => {
  it('maps every app-facing name in src/api/entities.js to a mapped slug', () => {
    const real = JSON.parse(readFileSync('scripts/functions.map.json', 'utf8'))
    const src = readFileSync('src/api/entities.js', 'utf8')
    const slugs = [...src.matchAll(/^\s+\w+: '([a-z-]+)',$/gm)].map((m) => m[1])
    expect(slugs.length).toBeGreaterThan(5)
    for (const s of slugs) expect(Object.keys(real.functions)).toContain(s)
    for (const file of Object.values(real.functions)) expect(existsSync(file)).toBe(true)
  })
})

describe('changelog files', () => {
  it('validates name and entries', () => {
    expect(validateFile('2026-11-26-tooltips.json', { entries: [{ type: 'new', text: 'Tooltips' }] })).toEqual([])
    expect(validateFile('tooltips.json', { entries: [] }).length).toBe(2)
    expect(validateFile('2026-11-26-x.json', { entries: [{ type: 'added', text: 'x' }] })[0]).toMatch(/type/)
  })
  it('merges into an existing release without duplicates', () => {
    const merged = mergeEntries([{ type: 'new', text: 'A' }], [{ type: 'fixed', text: 'a ' }, { type: 'fixed', text: 'B' }])
    expect(merged.map((e) => e.text)).toEqual(['A', 'B'])
  })
  it('formats the friendly date label', () => {
    expect(friendlyDate('2026-06-27')).toBe('Jun 27, 2026')
  })
})

import { countTscErrors, countDenoErrors } from './typecheck-ratchet.mjs'

describe('typecheck ratchet parsing', () => {
  it('counts tsc errors outside node_modules', () => {
    const out = 'src/a.jsx(1,1): error TS2322: x\nnode_modules/b.js(1,1): error TS2304: y\nsrc/c.js(2,2): error TS2339: z\n'
    expect(countTscErrors(out)).toBe(2)
  })
  it('reads the deno summary and fails loudly on non-type failures', () => {
    expect(countDenoErrors('...\nFound 13 errors.\n', 1)).toBe(13)
    expect(countDenoErrors('Found 1 error.', 1)).toBe(1)
    expect(countDenoErrors('', 0)).toBe(0)
    expect(() => countDenoErrors('error: Module not found', 1)).toThrow(/without a type-error summary/)
  })
})

import { classify } from './risk-check.mjs'

describe('risk-check', () => {
  it('lets ordinary UI changes through', () => {
    expect(classify({ files: ['src/components/session/Foo.jsx', 'changelog/2026-11-26-foo.json', 'CLAUDE.md'] })).toEqual([])
  })
  it('flags migrations, billing, auth, CI and gate edits', () => {
    for (const f of ['supabase/migrations/20261126000000_x.sql', 'functions/stripeWebhook.ts', 'src/lib/AuthContext.jsx',
      '.github/workflows/ci.yml', 'scripts/risk-check.mjs', 'vercel.json', '.typecheck-baseline',
      'supabase/schema/prod-schema.sql', '.claude/settings.json']) {
      expect(classify({ files: [f] }).length, f).toBe(1)
    }
  })
  it('lets a lowered typecheck baseline through, but not a raised, deleted or odd one', () => {
    const tc = (base, head) => classify({ files: ['.typecheck-baseline'], baselines: { '.typecheck-baseline': { base, head } } })
    expect(tc('729\n', '698\n')).toEqual([])
    expect(tc('729', '729')).toEqual([])
    expect(tc('698', '729')[0]).toMatch(/baseline raised/)
    expect(tc('729', undefined)).toHaveLength(1)
    expect(tc('729', '700 # ok')).toHaveLength(1)
    expect(classify({ files: ['.deno-check-baseline'], baselines: { '.deno-check-baseline': { base: '13', head: '9' } } })).toEqual([])
    expect(classify({ files: ['.deno-check-baseline'] })).toHaveLength(1)
  })
  it('flags dependency and script changes but not a version bump', () => {
    const base = { version: '0.0.0', dependencies: { a: '1' }, scripts: { t: 'x' } }
    expect(classify({ files: ['package.json'], basePkg: base, headPkg: { ...base, version: '0.0.1' } })).toEqual([])
    expect(classify({ files: ['package.json'], basePkg: base, headPkg: { ...base, dependencies: { a: '2' } } })[0]).toMatch(/dependencies/)
    expect(classify({ files: ['package.json'], basePkg: base, headPkg: { ...base, scripts: {} } })[0]).toMatch(/scripts/)
  })
})
