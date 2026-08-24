import Dexie, { type EntityTable } from 'dexie'

export interface Product {
  id?: number
  name: string
  description: string
  category: string
  supplier?: string
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
  /** What the customer pays — already net of `discount`. */
  total: number
  /** Knocked off at the counter. Absent on orders taken before the POS existed. */
  discount?: number
  status: 'pending' | 'paid' | 'done'
  notes: string
  createdAt: string
}

/**
 * A sale being punched in at the POS.
 *
 * The sale being worked on and the ones parked to be finished later are the
 * same thing — a row in this table — so parking is only a question of which
 * id the POS is pointed at, and a refresh mid-sale loses nothing.
 */
export interface Cart {
  id?: number
  /** Shown on the parked-sale chips, e.g. "Sale 2". */
  label: string
  items: OrderItem[]
  discount: number
  createdAt: string
  updatedAt: string
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
  carts!: EntityTable<Cart, 'id'>

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
    // v2 adds the POS cart table. Dexie carries every unlisted store forward,
    // so only the new one is named here.
    this.version(2).stores({
      carts: '++id, updatedAt',
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
