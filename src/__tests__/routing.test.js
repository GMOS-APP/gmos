// Static guards for the routing gotchas documented in CLAUDE.md: every
// campaign nav item must be a registered page and must get the sidebar layout.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { CAMPAIGN_NAV_ITEMS } from '@/lib/navItems'

const src = (p) => readFileSync(resolve(process.cwd(), 'src', p), 'utf8')
const pagesBlock = src('pages.config.js').match(/export const PAGES = \{([\s\S]*?)\n\}/)[1]
const registered = [...pagesBlock.matchAll(/"(\w+)":/g)].map((m) => m[1])
const campaignPages = JSON.parse(
  src('Layout.jsx').match(/const CAMPAIGN_PAGES = (\[[^\]]*\])/)[1].replace(/'/g, '"'),
)

describe('routing registry', () => {
  it('registers every campaign nav page', () => {
    for (const item of CAMPAIGN_NAV_ITEMS) expect(registered).toContain(item.page)
  })
  it('gives every campaign nav page the sidebar layout', () => {
    for (const item of CAMPAIGN_NAV_ITEMS) expect(campaignPages).toContain(item.page)
  })
  it('only lists registered pages in CAMPAIGN_PAGES', () => {
    for (const p of campaignPages) expect(registered).toContain(p)
  })
})
