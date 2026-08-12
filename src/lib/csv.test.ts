import { describe, it, expect } from 'vitest'
import { ordersToCSV, profitsToCSV } from './csv'
import type { Order, ProfitEntry } from '../db'

const sampleOrder: Order = {
  id: 1,
  ref: 'ORD-0001',
  customerName: 'Maria',
  items: [{ productId: 1, name: 'Shampoo', qty: 2, price: 80 }],
  total: 160,
  status: 'paid',
  notes: '',
  createdAt: '2026-08-12T10:00:00.000Z',
}

describe('ordersToCSV', () => {
  it('includes header row', () => {
    const csv = ordersToCSV([sampleOrder])
    expect(csv.split('\n')[0]).toBe('Ref,Customer,Items,Total,Status,Date')
  })
  it('outputs correct data row', () => {
    const csv = ordersToCSV([sampleOrder])
    const lines = csv.split('\n')
    expect(lines[1]).toContain('ORD-0001')
    expect(lines[1]).toContain('Maria')
    expect(lines[1]).toContain('160')
  })
})

const sampleProfit: ProfitEntry = {
  id: 1,
  source: 'order',
  ref: 'ORD-0001',
  revenue: 160,
  cost: 100,
  profit: 60,
  date: '2026-08-12',
}

describe('profitsToCSV', () => {
  it('outputs profit rows correctly', () => {
    const csv = profitsToCSV([sampleProfit])
    expect(csv).toContain('Revenue,Cost,Profit')
    expect(csv).toContain('160')
    expect(csv).toContain('60')
  })
})
