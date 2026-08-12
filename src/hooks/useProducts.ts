import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Product } from '../db'

export function useProducts() {
  return useLiveQuery(() => db.products.orderBy('name').toArray())
}

export function useAvailableProducts() {
  return useLiveQuery(() =>
    db.products.filter(p => p.availableToday && p.stock > 0).toArray()
  )
}

export async function addProduct(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
  const now = new Date().toISOString()
  await db.products.add({ ...data, createdAt: now, updatedAt: now })
}

export async function updateProduct(id: number, data: Partial<Omit<Product, 'id'>>): Promise<void> {
  await db.products.update(id, { ...data, updatedAt: new Date().toISOString() })
}

export async function deleteProduct(id: number): Promise<void> {
  await db.products.delete(id)
}

export async function toggleAvailableToday(id: number, current: boolean): Promise<void> {
  await db.products.update(id, { availableToday: !current, updatedAt: new Date().toISOString() })
}
