import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Invoice } from '../db'
import { genInvoiceNo } from '../lib/utils'

export function useInvoices() {
  return useLiveQuery(() => db.invoices.orderBy('createdAt').reverse().toArray())
}

export async function addInvoice(data: Omit<Invoice, 'id' | 'invoiceNo' | 'createdAt'>, prefix = 'INV'): Promise<void> {
  await db.invoices.add({
    ...data,
    invoiceNo: genInvoiceNo(prefix),
    createdAt: new Date().toISOString(),
  })
}
