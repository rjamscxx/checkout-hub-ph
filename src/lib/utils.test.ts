import { describe, it, expect } from 'vitest'
import { formatPHP, todayISO, genOrderRef, formatDate } from './utils'

describe('formatPHP', () => {
  it('formats zero', () => expect(formatPHP(0)).toBe('₱0.00'))
  it('formats thousands', () => expect(formatPHP(1500)).toBe('₱1,500.00'))
  it('formats decimals', () => expect(formatPHP(99.5)).toBe('₱99.50'))
})

describe('todayISO', () => {
  it('returns YYYY-MM-DD format', () => {
    expect(todayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('genOrderRef', () => {
  it('starts with ORD-', () => expect(genOrderRef()).toMatch(/^ORD-/))
  it('generates unique refs', () => {
    const a = genOrderRef()
    const b = genOrderRef()
    expect(a).not.toBe(b)
  })
})

describe('formatDate', () => {
  it('parses ISO string to readable date', () => {
    const result = formatDate('2026-08-12T00:00:00.000Z')
    expect(result).toContain('Aug')
    expect(result).toContain('2026')
  })
})
