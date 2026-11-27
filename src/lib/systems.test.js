import { describe, it, expect } from 'vitest'
import { getSystem, SYSTEMS, DEFAULT_SYSTEM_ID } from './systems'

describe('getSystem', () => {
  it('falls back to 5e for legacy and unknown campaigns', () => {
    expect(getSystem(undefined)).toBe(SYSTEMS[DEFAULT_SYSTEM_ID])
    expect(getSystem({})).toBe(SYSTEMS[DEFAULT_SYSTEM_ID])
    expect(getSystem({ system: 'nope' })).toBe(SYSTEMS[DEFAULT_SYSTEM_ID])
  })
  it('resolves by id string or campaign object', () => {
    expect(getSystem('custom')).toBe(SYSTEMS.custom)
    expect(getSystem({ system: 'custom' })).toBe(SYSTEMS.custom)
  })
})
