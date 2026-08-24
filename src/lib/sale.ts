/**
 * Sale math — the POS money loop.
 *
 * Kept pure and storage-free so every number the cart shows can be tested
 * without a database or a rendered component. The POS, the cart footer and
 * the receipt all read from here, so they can never disagree about what a
 * sale is worth.
 *
 * The one rule worth remembering: a discount comes out of profit, never out
 * of cost. Cost is what the goods actually cost you and no counter decision
 * changes it.
 */
import type { OrderItem } from '../db'

export interface SaleTotals {
  /** Sum of every line before any discount. */
  subtotal: number
  /** Discount actually applied — never negative, never more than subtotal. */
  discount: number
  /** What the customer pays. Stored as `Order.total`. */
  total: number
  /** Cost of goods, from the per-item snapshot taken when the line was added. */
  cost: number
  /** Revenue after discount, minus cost. */
  profit: number
  /** Whole-number percent of revenue kept as profit; 0 when revenue is 0. */
  margin: number
  /** Total units in the cart, not line count. */
  itemCount: number
}

/** A discount can't be negative and can't exceed what's being discounted. */
export function clampDiscount(discount: number, subtotal: number): number {
  if (!Number.isFinite(discount) || discount <= 0) return 0
  return Math.min(discount, Math.max(0, subtotal))
}

/** Every figure the cart footer shows, derived in one pass. */
export function saleTotals(items: OrderItem[], discount = 0): SaleTotals {
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0)
  const applied = clampDiscount(discount, subtotal)
  const total = subtotal - applied
  const cost = items.reduce((s, i) => s + (i.cost ?? 0) * i.qty, 0)
  const profit = total - cost
  return {
    subtotal,
    discount: applied,
    total,
    cost,
    profit,
    margin: total > 0 ? Math.round((profit / total) * 100) : 0,
    itemCount: items.reduce((s, i) => s + i.qty, 0),
  }
}

/**
 * How a profit figure should read against the owner's margin floor.
 * Returned as a name rather than a color so this file stays theme-free.
 */
export type ProfitTone = 'loss' | 'below' | 'ok'

export function profitTone(totals: Pick<SaleTotals, 'profit' | 'margin'>, floor: number): ProfitTone {
  if (totals.profit <= 0) return 'loss'
  return totals.margin < floor ? 'below' : 'ok'
}

/**
 * Merge a product into a cart. Adding something already in the cart bumps its
 * quantity instead of opening a second line — punching the same item twice in
 * a row is a two-of, not a mistake.
 */
export function addLine(items: OrderItem[], line: OrderItem): OrderItem[] {
  const at = items.findIndex(i => i.productId === line.productId)
  if (at === -1) return [...items, line]
  return items.map((i, ix) => (ix === at ? { ...i, qty: i.qty + line.qty } : i))
}

/** Set a line's quantity. Dropping to zero removes the line. */
export function setLineQty(items: OrderItem[], productId: number, qty: number): OrderItem[] {
  if (qty <= 0) return items.filter(i => i.productId !== productId)
  return items.map(i => (i.productId === productId ? { ...i, qty } : i))
}

/**
 * Override a line's unit price — haggling, a bundle deal, a rounded-down
 * total. The cost snapshot is deliberately untouched, so the profit readout
 * tells the truth about what the discount just cost you. A price that isn't a
 * usable number leaves the line alone.
 */
export function setLinePrice(items: OrderItem[], productId: number, price: number): OrderItem[] {
  if (!Number.isFinite(price) || price < 0) return items
  return items.map(i => (i.productId === productId ? { ...i, price } : i))
}
