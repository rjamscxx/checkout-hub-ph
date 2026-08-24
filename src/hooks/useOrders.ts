import { useLiveQuery } from 'dexie-react-hooks'
import { db, getSetting, type Order, type OrderItem } from '../db'
import { genOrderRef, todayISO } from '../lib/utils'
import { saleTotals } from '../lib/sale'

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

// --- shared writes --------------------------------------------------------

/**
 * Move stock by `delta` for every line. Deliberately unclamped: selling goods
 * you haven't counted in yet is normal in reselling, and a negative figure is
 * the useful one — it says what you owe the shelf. Clamping at zero threw that
 * number away and made the Inventory tab quietly lie.
 *
 * Call inside a transaction that already holds `db.products`.
 */
async function moveStock(items: OrderItem[], delta: 1 | -1): Promise<void> {
  const now = new Date().toISOString()
  for (const item of items) {
    const p = await db.products.get(item.productId)
    if (p?.id != null) {
      await db.products.update(p.id, { stock: (p.stock ?? 0) + delta * item.qty, updatedAt: now })
    }
  }
}

/**
 * An order ref no existing order is using.
 *
 * `genOrderRef` mixes the clock with a counter that resets on reload, so two
 * sessions can land on the same ref. That matters more than it looks: profit
 * entries are keyed by ref, so a collision would tangle two sales' money.
 * Call inside a transaction that already holds `db.orders`.
 */
async function uniqueOrderRef(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const ref = genOrderRef()
    if ((await db.orders.where('ref').equals(ref).count()) === 0) return ref
  }
  return `${genOrderRef()}-${Math.random().toString(36).slice(2, 6)}`
}

export async function addOrder(customerName: string, items: OrderItem[], notes = ''): Promise<void> {
  const total = items.reduce((s, i) => s + i.price * i.qty, 0)
  await db.transaction('rw', db.orders, db.products, async () => {
    await db.orders.add({
      ref: await uniqueOrderRef(),
      customerName,
      items,
      total,
      status: 'pending',
      notes,
      createdAt: new Date().toISOString(),
    })
    await moveStock(items, -1)
  })
}

export interface PaidSaleInput {
  items: OrderItem[]
  discount?: number
  customerName?: string
  notes?: string
}

/**
 * Punch a counter sale through in one shot — the POS Charge button.
 *
 * Unlike `addOrder`, the money has already changed hands, so the order lands
 * `paid` and its profit is booked in the same transaction rather than waiting
 * for someone to mark it later. Order, profit entry and stock all move
 * together or none of them do.
 *
 * Returns the saved order so the caller can offer a receipt and an undo.
 */
export async function addPaidSale({
  items,
  discount = 0,
  customerName = 'Walk-in',
  notes = '',
}: PaidSaleInput): Promise<Order> {
  if (!items.length) throw new Error('Cannot charge an empty sale')
  const totals = saleTotals(items, discount)

  return db.transaction('rw', db.orders, db.profits, db.products, async () => {
    const order: Order = {
      ref: await uniqueOrderRef(),
      customerName: customerName.trim() || 'Walk-in',
      items,
      total: totals.total,
      discount: totals.discount,
      status: 'paid',
      notes,
      createdAt: new Date().toISOString(),
    }
    const id = await db.orders.add(order)
    await db.profits.add({
      source: 'order',
      ref: order.ref,
      revenue: totals.total,
      cost: totals.cost,
      profit: totals.profit,
      date: todayISO(),
    })
    await moveStock(items, -1)
    return { ...order, id: id as number }
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

/** Delete an order, remove its linked profit entry, and put its stock back. */
export async function deleteOrder(id: number): Promise<void> {
  await db.transaction('rw', db.orders, db.profits, db.products, async () => {
    const order = await db.orders.get(id)
    await db.orders.delete(id)
    if (order) {
      const linked = await db.profits.where('source').equals('order').and(p => p.ref === order.ref).primaryKeys()
      if (linked.length) await db.profits.bulkDelete(linked)
      // Stock came off when the order was created, whatever it has since been
      // marked. Restoring only pending orders silently ate the stock of every
      // voided counter sale.
      await moveStock(order.items, 1)
    }
  })
}
