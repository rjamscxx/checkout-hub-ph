/**
 * Receipt for a counter sale.
 *
 * A paid sale is shaped almost exactly like an invoice, so rather than write
 * a second printer this maps the order onto the invoice shape the existing
 * one already knows how to lay out. The payment QR codes are deliberately
 * left off: the money is already in hand, and "Scan to pay" on a settled
 * sale only invites a second payment.
 */
import { getSetting, type Invoice, type Order } from '../../db'
import { printInvoice } from '../invoice/InvoicePrint'

export async function printSaleReceipt(order: Order): Promise<void> {
  const [storeName, storePhone] = await Promise.all([
    getSetting('store_name', 'Checkout Hub'),
    getSetting('order_contact', ''),
  ])

  const receipt: Invoice = {
    invoiceNo: order.ref,
    customerName: order.customerName,
    items: order.items.map(i => ({ description: i.name, qty: i.qty, price: i.price })),
    subtotal: order.items.reduce((s, i) => s + i.price * i.qty, 0),
    discount: order.discount ?? 0,
    total: order.total,
    paidVia: 'Paid at counter',
    notes: order.notes,
    createdAt: order.createdAt,
  }

  printInvoice({ invoice: receipt, storeName, storePhone })
}
