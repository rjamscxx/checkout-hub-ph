import type { Invoice } from '../../db'
import { formatPHP, formatDate } from '../../lib/utils'

interface PrintInvoiceOptions {
  invoice: Invoice
  storeName: string
  storePhone?: string
  storeAddress?: string
}

export function printInvoice({ invoice, storeName, storePhone = '', storeAddress = '' }: PrintInvoiceOptions): void {
  const itemRows = invoice.items
    .map(i => `<tr>
      <td style="padding:5px 0;border-bottom:1px solid #F2F1EE;font-size:12px">${i.description}</td>
      <td style="padding:5px 0;border-bottom:1px solid #F2F1EE;font-size:12px;text-align:center">${i.qty}</td>
      <td style="padding:5px 0;border-bottom:1px solid #F2F1EE;font-size:12px;text-align:right">${formatPHP(i.price)}</td>
      <td style="padding:5px 0;border-bottom:1px solid #F2F1EE;font-size:12px;text-align:right">${formatPHP(i.price * i.qty)}</td>
    </tr>`)
    .join('')

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${invoice.invoiceNo}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 13px; max-width: 400px; margin: 0 auto; padding: 20px; color: #18171A; }
    .header { text-align: center; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 2px solid #D91A22; }
    .store-name { font-size: 20px; font-weight: bold; }
    .store-info { font-size: 11px; color: #79767F; margin-top: 2px; }
    .inv-no { color: #D91A22; font-weight: bold; font-size: 14px; margin: 8px 0 4px; }
    .inv-date { font-size: 11px; color: #79767F; }
    .customer { margin: 12px 0; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; }
    th { text-align: left; font-size: 11px; color: #79767F; padding: 4px 0; border-bottom: 1px solid #E6E3DC; }
    th:not(:first-child) { text-align: right; }
    .total-section { margin-top: 8px; padding-top: 8px; border-top: 1px solid #E6E3DC; }
    .total-row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px; }
    .grand-total { font-weight: bold; font-size: 16px; color: #D91A22; }
    .paid-via { font-size: 12px; color: #79767F; margin-top: 8px; }
    .footer { margin-top: 16px; text-align: center; font-size: 11px; color: #79767F; border-top: 1px solid #E6E3DC; padding-top: 12px; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="store-name">${storeName}</div>
    ${storePhone || storeAddress ? `<div class="store-info">${[storePhone, storeAddress].filter(Boolean).join(' · ')}</div>` : ''}
    <div class="inv-no">${invoice.invoiceNo}</div>
    <div class="inv-date">${formatDate(invoice.createdAt)}</div>
  </div>
  <div class="customer"><strong>Customer:</strong> ${invoice.customerName}</div>
  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th style="text-align:center">Qty</th>
        <th style="text-align:right">Price</th>
        <th style="text-align:right">Amount</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>
  <div class="total-section">
    <div class="total-row"><span>Subtotal</span><span>${formatPHP(invoice.subtotal)}</span></div>
    ${invoice.discount > 0 ? `<div class="total-row"><span>Discount</span><span>-${formatPHP(invoice.discount)}</span></div>` : ''}
    <div class="total-row grand-total"><span>Total</span><span>${formatPHP(invoice.total)}</span></div>
  </div>
  ${invoice.paidVia ? `<div class="paid-via">Paid via: ${invoice.paidVia}</div>` : ''}
  ${invoice.notes ? `<div class="footer">${invoice.notes}</div>` : ''}
  <div class="footer">Thank you for your business!</div>
</body>
</html>`

  const win = window.open('', '_blank')
  if (!win) { alert('Please allow pop-ups to print invoices.'); return }
  win.document.write(html)
  win.document.close()
  setTimeout(() => win.print(), 300)
}
