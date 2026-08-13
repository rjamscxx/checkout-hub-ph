import { useLiveQuery } from 'dexie-react-hooks'
import { db, getSetting, type Order, type OrderItem } from '../db'
import { genOrderRef, todayISO } from '../lib/utils'

export const DEFAULT_MARGIN_FLOOR = 20

export function useOrders() {
  return useLiveQuery(() => db.orders.orderBy('createdAt').reverse().toArray())
}

/** The owner's minimum acceptable margin (%), from Settings. */
export function useMarginFloor(): number {
  return useLiveQuery(
    async () => Number(await getSetting('margin_floor', String(DEFAULT_MARGIN_FLOOR))) || 0,
    [],
    DEFAULT_MARGIN_FLOOR,
  ) ?? DEFAULT_MARGIN_FLOOR
}

// --- profit math (shared by cards + the paid handler) ---------------------

/** Cost of goods for an order, from the per-item cost snapshot. */
export function orderCost(order: Pick<Order, 'items'>): number {
  return order.items.reduce((s, i) => s + (i.cost ?? 0) * i.qty, 0)
}

/** Profit = revenue − cost of goods. */
export function orderProfit(order: Pick<Order, 'items' | 'total'>): number {
  return order.total - orderCost(order)
}

/** Margin as a whole-number percent (0 when revenue is 0). */
export function orderMargin(order: Pick<Order, 'items' | 'total'>): number {
  return order.total > 0 ? Math.round((orderProfit(order) / order.total) * 100) : 0
}

export async function addOrder(customerName: string, items: OrderItem[], notes = ''): Promise<void> {
  const total = items.reduce((s, i) => s + i.price * i.qty, 0)
  await db.orders.add({
    ref: genOrderRef(),
    customerName,
    items,
    total,
    status: 'pending',
    notes,
    createdAt: new Date().toISOString(),
  })
}

export async function updateOrderStatus(id: number, status: Order['status']): Promise<void> {
  await db.orders.update(id, { status })
}

/**
 * Mark an order paid and log its realized profit — the money loop.
 * Idempotent: never writes a second profit entry for the same order ref.
 */
export async function markOrderPaid(order: Order): Promise<void> {
  if (order.id == null) return
  await db.transaction('rw', db.orders, db.profits, async () => {
    await db.orders.update(order.id!, { status: 'paid' })
    const already = await db.profits.where('source').equals('order').and(p => p.ref === order.ref).count()
    if (already > 0) return
    const cost = orderCost(order)
    await db.profits.add({
      source: 'order',
      ref: order.ref,
      revenue: order.total,
      cost,
      profit: order.total - cost,
      date: todayISO(),
    })
  })
}

/** Delete an order and remove its linked profit entry (keeps books honest). */
export async function deleteOrder(id: number): Promise<void> {
  await db.transaction('rw', db.orders, db.profits, async () => {
    const order = await db.orders.get(id)
    await db.orders.delete(id)
    if (order) {
      const linked = await db.profits.where('source').equals('order').and(p => p.ref === order.ref).primaryKeys()
      if (linked.length) await db.profits.bulkDelete(linked)
    }
  })
}
