import { describe, it, expect, beforeEach } from 'vitest'
import { db, getSetting, setSetting } from './index'

beforeEach(async () => {
  await db.products.clear()
  await db.orders.clear()
  await db.settings.clear()
})

describe('products', () => {
  it('adds and retrieves a product', async () => {
    const id = await db.products.add({
      name: 'Shampoo',
      description: '',
      category: 'Personal Care',
      costPrice: 50,
      sellPrice: 80,
      stock: 10,
      availableToday: true,
      photos: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    const product = await db.products.get(id)
    expect(product?.name).toBe('Shampoo')
    expect(product?.sellPrice).toBe(80)
  })
})

describe('orders', () => {
  it('adds an order with items', async () => {
    const id = await db.orders.add({
      ref: 'ORD-0001',
      customerName: 'Maria',
      items: [{ productId: 1, name: 'Shampoo', qty: 2, price: 80 }],
      total: 160,
      status: 'pending',
      notes: '',
      createdAt: new Date().toISOString(),
    })
    const order = await db.orders.get(id)
    expect(order?.ref).toBe('ORD-0001')
    expect(order?.items).toHaveLength(1)
  })
})

describe('getSetting / setSetting', () => {
  it('returns fallback for missing key', async () => {
    const val = await getSetting('store_name', 'My Store')
    expect(val).toBe('My Store')
  })

  it('stores and retrieves a setting', async () => {
    await setSetting('store_name', 'RJ Merchandise')
    const val = await getSetting('store_name')
    expect(val).toBe('RJ Merchandise')
  })
})
