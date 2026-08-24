/**
 * Turning an order into something you can hand across a counter.
 *
 * A sale and an invoice are the same document with different words on it, so
 * rather than keep a second printer this maps the order onto the invoice
 * shape the existing one already knows how to lay out. Both the POS and the
 * order history print through here, which is what keeps them identical.
 */
import { getSetting, type Invoice, type Order } from '../db'
import { printInvoice } from '../pages/invoice/InvoicePrint'

/** What the document calls itself, and what it says about the money. */
function wording(status: Order['status']): { label: string; paidVia: string } {
  if (status === 'pending') return { label: 'Order', paidVia: 'Unpaid — payment on collection' }
  return { label: 'Receipt', paidVia: 'Paid' }
}

/** The order as an invoice, for the printer. */
export function orderToInvoice(order: Order): Invoice {
  return {
    invoiceNo: order.ref,
    customerName: order.customerName,
    items: order.items.map(i => ({ description: i.name, qty: i.qty, price: i.price })),
    subtotal: order.items.reduce((s, i) => s + i.price * i.qty, 0),
    discount: order.discount ?? 0,
    total: order.total,
    paidVia: wording(order.status).paidVia,
    notes: order.notes,
    createdAt: order.createdAt,
  }
}

/**
 * Print an order.
 *
 * A settled sale gets no payment QR codes: the money is already in hand, and
 * "Scan to pay" on a paid receipt only invites paying twice. An order still
 * waiting on payment gets them, because that is exactly when they are useful.
 */
export async function printOrderReceipt(order: Order): Promise<void> {
  const unpaid = order.status === 'pending'
  const [storeName, storePhone, gcashQr, mayaQr] = await Promise.all([
    getSetting('store_name', 'Checkout Hub'),
    getSetting('order_contact', ''),
    unpaid ? getSetting('gcash_qr', '') : Promise.resolve(''),
    unpaid ? getSetting('maya_qr', '') : Promise.resolve(''),
  ])

  printInvoice({
    invoice: orderToInvoice(order),
    storeName,
    storePhone,
    gcashQr,
    mayaQr,
    docLabel: wording(order.status).label,
  })
}
