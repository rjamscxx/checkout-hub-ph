import Dexie, { type EntityTable } from 'dexie'

export interface Product {
  id?: number
  name: string
  description: string
  category: string
  costPrice: number
  sellPrice: number
  stock: number
  availableToday: boolean
  photos: string[]
  expiryDate?: string
  createdAt: string
  updatedAt: string
}

export interface OrderItem {
  productId: number
  name: string
  qty: number
  price: number
  /** Unit cost snapshotted at sell time — the basis for profit. Optional for
   *  legacy orders created before cost tracking. */
  cost?: number
}

export interface Order {
  id?: number
  ref: string
  customerName: string
  items: OrderItem[]
  total: number
  status: 'pending' | 'paid' | 'done'
  notes: string
  createdAt: string
}

export interface InvoiceItem {
  description: string
  qty: number
  price: number
}

export interface Invoice {
  id?: number
  invoiceNo: string
  customerName: string
  items: InvoiceItem[]
  subtotal: number
  discount: number
  total: number
  paidVia: string
  notes: string
  createdAt: string
}

export interface ProfitEntry {
  id?: number
  source: 'order' | 'invoice' | 'manual'
  ref: string
  revenue: number
  cost: number
  profit: number
  date: string
}

export interface Expense {
  id?: number
  description: string
  amount: number
  category: string
  date: string
}

export interface Settings {
  key: string
  value: string
}

class CheckoutHubDB extends Dexie {
  products!: EntityTable<Product, 'id'>
  orders!: EntityTable<Order, 'id'>
  invoices!: EntityTable<Invoice, 'id'>
  profits!: EntityTable<ProfitEntry, 'id'>
  expenses!: EntityTable<Expense, 'id'>
  settings!: EntityTable<Settings, 'key'>

  constructor() {
    super('checkout_hub_v2')
    this.version(1).stores({
      products: '++id, name, category, availableToday, createdAt',
      orders: '++id, ref, status, createdAt',
      invoices: '++id, invoiceNo, createdAt',
      profits: '++id, source, date',
      expenses: '++id, category, date',
      settings: 'key',
    })
  }
}

export const db = new CheckoutHubDB()

export async function getSetting(key: string, fallback = ''): Promise<string> {
  const row = await db.settings.get(key)
  return row?.value ?? fallback
}

export async function setSetting(key: string, value: string): Promise<void> {
  await db.settings.put({ key, value })
}
