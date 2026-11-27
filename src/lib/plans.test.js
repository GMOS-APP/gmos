import { describe, it, expect } from 'vitest'
import { isCampaignLimitError, PAID_TIERS, FREE_CAMPAIGN_LIMIT } from './plans'
import { PRICING_BLURB } from './seoPages'

describe('isCampaignLimitError', () => {
  it('detects the trigger hint', () => {
    expect(isCampaignLimitError({ hint: 'CAMPAIGN_LIMIT_REACHED' })).toBe(true)
  })
  it('detects the message forms', () => {
    expect(isCampaignLimitError({ message: 'ERROR: CAMPAIGN_LIMIT_REACHED' })).toBe(true)
    expect(isCampaignLimitError({ error: 'Free plan is limited to 1 campaign' })).toBe(true)
    expect(isCampaignLimitError('CAMPAIGN_LIMIT_REACHED')).toBe(true)
  })
  it('ignores unrelated errors and empty input', () => {
    expect(isCampaignLimitError(null)).toBe(false)
    expect(isCampaignLimitError({ message: 'network error' })).toBe(false)
  })
})

describe('pricing consistency', () => {
  it('offers monthly, yearly and lifetime tiers', () => {
    expect(PAID_TIERS.map((t) => t.id)).toEqual(['monthly', 'yearly', 'lifetime'])
    expect(FREE_CAMPAIGN_LIMIT).toBe(1)
  })
  it('SEO pricing copy matches the checkout tiers', () => {
    for (const tier of PAID_TIERS) expect(PRICING_BLURB).toContain(tier.price)
  })
})
