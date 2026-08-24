import { describe, it, expect, beforeEach } from 'vitest'
import { db, type OrderItem, type Product } from '../db'
import { addOrder, addPaidSale, deleteOrder, markOrderPaid } from './useOrders'

beforeEach(async () => {
  await Promise.all([db.products.clear(), db.orders.clear(), db.profits.clear()])
})

async function seedProduct(over: Partial<Product> = {}): Promise<number> {
  const id = await db.products.add({
    name: 'Cooking Oil 1L',
    description: '',
    category: 'Grocery',
    costPrice: 100,
    sellPrice: 120,
    stock: 10,
    availableToday: true,
    photos: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...over,
  })
  return id as number
}

function line(productId: number, over: Partial<OrderItem> = {}): OrderItem {
  return { productId, name: 'Cooking Oil 1L', qty: 1, price: 120, cost: 100, ...over }
}

async function stockOf(id: number): Promise<number> {
  return (await db.products.get(id))!.stock
}

describe('addPaidSale', () => {
  it('saves the sale already paid, so nothing has to be marked later', async () => {
    const pid = await seedProduct()
    const order = await addPaidSale({ items: [line(pid)] })

    expect(order.status).toBe('paid')
    expect(await db.orders.count()).toBe(1)
  })

  it('books the profit in the same breath', async () => {
    const pid = await seedProduct()
    await addPaidSale({ items: [line(pid, { qty: 2 })] })

    const entries = await db.profits.toArray()
    expect(entries).toHaveLength(1)
    expect(entries[0]).toMatchObject({ source: 'order', revenue: 240, cost: 200, profit: 40 })
  })

  it('stores the total net of the discount and takes it out of profit', async () => {
    const pid = await seedProduct()
    const order = await addPaidSale({ items: [line(pid, { qty: 2 })], discount: 40 })

    expect(order.total).toBe(200)
    expect(order.discount).toBe(40)
    expect((await db.profits.toArray())[0]).toMatchObject({ revenue: 200, cost: 200, profit: 0 })
  })

  it('takes the goods off the shelf', async () => {
    const pid = await seedProduct({ stock: 10 })
    await addPaidSale({ items: [line(pid, { qty: 3 })] })

    expect(await stockOf(pid)).toBe(7)
  })

  it('lets stock go negative rather than hiding what is owed to the shelf', async () => {
    const pid = await seedProduct({ stock: 0 })
    await addPaidSale({ items: [line(pid, { qty: 4 })] })

    expect(await stockOf(pid)).toBe(-4)
  })

  it('defaults an unnamed buyer to Walk-in', async () => {
    const pid = await seedProduct()
    expect((await addPaidSale({ items: [line(pid)] })).customerName).toBe('Walk-in')
    expect((await addPaidSale({ items: [line(pid)], customerName: '   ' })).customerName).toBe('Walk-in')
  })

  it('keeps a name when one is given', async () => {
    const pid = await seedProduct()
    const order = await addPaidSale({ items: [line(pid)], customerName: 'Maria Santos' })
    expect(order.customerName).toBe('Maria Santos')
  })

  it('refuses to charge an empty sale', async () => {
    await expect(addPaidSale({ items: [] })).rejects.toThrow()
    expect(await db.orders.count()).toBe(0)
  })

  it('gives every sale its own ref, so no two sales share a profit entry', async () => {
    const pid = await seedProduct({ stock: 500 })
    for (let i = 0; i < 40; i++) await addPaidSale({ items: [line(pid)] })

    const refs = (await db.orders.toArray()).map(o => o.ref)
    expect(new Set(refs).size).toBe(40)
    expect(await db.profits.count()).toBe(40)
  })

  it('survives a product deleted between the punch and the charge', async () => {
    const pid = await seedProduct()
    await db.products.delete(pid)

    const order = await addPaidSale({ items: [line(pid)] })
    expect(order.total).toBe(120)
    expect((await db.profits.toArray())[0].profit).toBe(20)
  })
})

describe('deleteOrder', () => {
  it('puts the stock back when a paid counter sale is voided', async () => {
    const pid = await seedProduct({ stock: 10 })
    const order = await addPaidSale({ items: [line(pid, { qty: 3 })] })
    expect(await stockOf(pid)).toBe(7)

    await deleteOrder(order.id!)

    expect(await stockOf(pid)).toBe(10)
  })

  it('unbooks the profit along with the sale', async () => {
    const pid = await seedProduct()
    const order = await addPaidSale({ items: [line(pid)] })

    await deleteOrder(order.id!)

    expect(await db.profits.count()).toBe(0)
    expect(await db.orders.count()).toBe(0)
  })

  it('still restores stock for a pending order', async () => {
    const pid = await seedProduct({ stock: 10 })
    await addOrder('Maria', [line(pid, { qty: 2 })])
    const order = (await db.orders.toArray())[0]

    await deleteOrder(order.id!)

    expect(await stockOf(pid)).toBe(10)
  })

  it('restores stock for an order that was marked paid the old way', async () => {
    const pid = await seedProduct({ stock: 10 })
    await addOrder('Maria', [line(pid, { qty: 2 })])
    const order = (await db.orders.toArray())[0]
    await markOrderPaid(order)

    await deleteOrder(order.id!)

    expect(await stockOf(pid)).toBe(10)
  })
})

describe('addOrder', () => {
  it('also stops clamping stock at zero, so both paths agree', async () => {
    const pid = await seedProduct({ stock: 1 })
    await addOrder('Maria', [line(pid, { qty: 5 })])

    expect(await stockOf(pid)).toBe(-4)
  })
})
