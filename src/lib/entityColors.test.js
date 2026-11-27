import { describe, it, expect, afterEach } from 'vitest'
import { getEntityColors, getEntityTypeLabel, setCustomTypeRegistry, ENTITY_TYPE_META } from './entityColors'

afterEach(() => setCustomTypeRegistry({}))

describe('entity colors', () => {
  it('falls back to npc for unknown types', () => {
    expect(getEntityColors('definitely_not_a_type')).toBe(ENTITY_TYPE_META.npc)
  })
  it('resolves custom types from the registry', () => {
    const meta = { ...ENTITY_TYPE_META.npc, labelSingular: 'Starship' }
    setCustomTypeRegistry({ starship: meta })
    expect(getEntityColors('starship')).toBe(meta)
    expect(getEntityTypeLabel('starship')).toBe('Starship')
  })
  it('humanizes unregistered keys', () => {
    expect(getEntityTypeLabel('coc_investigator')).toBe('Coc Investigator')
  })
})
