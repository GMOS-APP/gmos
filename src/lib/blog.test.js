import { describe, it, expect } from 'vitest'
import { readingMinutes, readingLabel, categoryAccent } from './blog'

describe('blog helpers', () => {
  it('estimates read time at ~200 wpm with a 1 minute floor', () => {
    expect(readingMinutes('')).toBe(1)
    expect(readingMinutes('word '.repeat(1000))).toBe(5)
  })
  it('returns an empty label for empty bodies', () => {
    expect(readingLabel('   ')).toBe('')
    expect(readingLabel('hello world')).toBe('1 min read')
  })
  it('gives unknown categories a stable accent', () => {
    expect(categoryAccent('Some New Series')).toEqual(categoryAccent('Some New Series'))
    expect(categoryAccent(undefined).text).toBeTruthy()
  })
})
