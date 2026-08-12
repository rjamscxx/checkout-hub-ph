import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Order, type OrderItem } from '../db'
import { genOrderRef } from '../lib/utils'

export function useOrders() {
  return useLiveQuery(() => db.orders.orderBy('createdAt').reverse().toArray())
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

export async function deleteOrder(id: number): Promise<void> {
  await db.orders.delete(id)
}
