/**
 * The printed document — receipt, order slip, or invoice.
 *
 * This runs in a window of its own, which is why every value below is a
 * literal. The old version styled it with `var(--color-accent)` and friends,
 * but those custom properties live on the app's `<html>` and do not exist
 * here, so every one of them resolved to nothing: the brand red never
 * printed, the rules under the headings never drew, and the whole thing came
 * out as plain black Arial with no borders.
 *
 * The palette is deliberately the light one whatever theme the app is in.
 * Paper is white; a receipt printed from dark mode should not come out in
 * dark-mode ink.
 */
import type { Invoice } from '../../db'
import { formatPHP, formatDate } from '../../lib/utils'

/* Brand tokens, mirrored from index.css as literals. Keep them in step by
   hand — this document cannot read the app's stylesheet. */
const BRAND = {
  ink: '#18171A',
  ink2: '#3D3B42',
  muted: '#79767F',
  rule: '#E6E3DC',
  rule2: '#D8D4CC',
  accent: '#D91A22',
  paper: '#FFFFFF',
  tint: '#F7F6F3',
} as const

export interface PrintInvoiceOptions {
  invoice: Invoice
  storeName: string
  storePhone?: string
  storeAddress?: string
  gcashQr?: string
  mayaQr?: string
  /** Heading on the document — "Receipt", "Order", "Invoice". */
  docLabel?: string
}

/** Values going into markup we assemble by hand. */
function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function printInvoice({
  invoice,
  storeName,
  storePhone = '',
  storeAddress = '',
  gcashQr = '',
  mayaQr = '',
  docLabel = 'Invoice',
}: PrintInvoiceOptions): void {
  const rows = invoice.items
    .map(
      i => `<tr>
        <td class="item">${esc(i.description)}</td>
        <td class="qty num">${i.qty}</td>
        <td class="num">${formatPHP(i.price)}</td>
        <td class="num amount">${formatPHP(i.price * i.qty)}</td>
      </tr>`,
    )
    .join('')

  const meta = [storePhone, storeAddress].filter(Boolean).map(esc).join(' · ')

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${esc(invoice.invoiceNo)}</title>
<!-- The window is opened blank, so it has no document URL to resolve
     relative paths against and /logo-full.png silently resolved to nothing.
     A base gives the whole document the app's origin to work from. -->
<base href="${window.location.origin}/">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }

  @page { size: auto; margin: 12mm; }

  html {
    /* without this the browser drops the red to save ink */
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  body {
    /* the brand face if the machine has it, then the closest humanist sans
       Windows and macOS already ship */
    font-family: 'Plus Jakarta Sans', 'Segoe UI', Roboto, system-ui, -apple-system, sans-serif;
    font-size: 12.5px;
    line-height: 1.45;
    color: ${BRAND.ink};
    background: ${BRAND.paper};
    max-width: 420px;
    margin: 0 auto;
    padding: 22px 20px 26px;
    -webkit-font-smoothing: antialiased;
  }

  .num { font-variant-numeric: tabular-nums; font-feature-settings: 'tnum'; }

  .mast { text-align: center; padding-bottom: 14px; }
  /* the mark, not the full lockup: that one carries its own wordmark and
     would print "Checkout Hub" twice, and it would go stale the moment the
     store is renamed. The mark sits above the name and the name is type. */
  .mast img { width: 54px; height: auto; display: block; margin: 0 auto 8px; }
  .store { font-size: 17px; font-weight: 800; letter-spacing: -0.02em; }
  .meta { font-size: 10.5px; color: ${BRAND.muted}; margin-top: 2px; }

  /* the one mark that carries the brand across every document */
  .brandrule { height: 2px; background: ${BRAND.accent}; border-radius: 2px; }

  .doc { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; margin-top: 14px; }
  .doclabel { font-size: 11px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: ${BRAND.accent}; }
  .docref { font-size: 12px; font-weight: 700; }
  .docdate { font-size: 10.5px; color: ${BRAND.muted}; margin-top: 1px; }

  .party { margin-top: 12px; font-size: 12px; }
  .party dt { font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; color: ${BRAND.muted}; }
  .party dd { font-weight: 700; margin-top: 1px; }

  table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  thead th {
    font-size: 9.5px; letter-spacing: 0.08em; text-transform: uppercase;
    color: ${BRAND.muted}; font-weight: 700; text-align: right;
    padding-bottom: 6px; border-bottom: 1px solid ${BRAND.rule2};
  }
  thead th:first-child { text-align: left; }
  tbody td { padding: 7px 0; border-bottom: 1px solid ${BRAND.rule}; text-align: right; vertical-align: top; }
  tbody td.item { text-align: left; padding-right: 10px; color: ${BRAND.ink2}; }
  tbody td.qty { width: 34px; color: ${BRAND.muted}; }
  tbody td.amount { font-weight: 700; width: 88px; }
  tbody tr:last-child td { border-bottom: 0; }

  .totals { margin-top: 4px; border-top: 1px solid ${BRAND.rule2}; padding-top: 10px; }
  .line { display: flex; justify-content: space-between; gap: 16px; font-size: 12px; color: ${BRAND.ink2}; margin-bottom: 4px; }
  .line .num { font-weight: 600; }
  .grand {
    display: flex; justify-content: space-between; align-items: baseline; gap: 16px;
    margin-top: 8px; padding-top: 9px; border-top: 2px solid ${BRAND.ink};
  }
  .grand .label { font-size: 12px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; }
  .grand .value { font-size: 20px; font-weight: 800; color: ${BRAND.accent}; letter-spacing: -0.02em; }

  .paid { margin-top: 10px; font-size: 11px; color: ${BRAND.muted}; }
  .paid b { color: ${BRAND.ink2}; font-weight: 700; }

  .pay { margin-top: 16px; padding: 12px; background: ${BRAND.tint}; border-radius: 10px; text-align: center; }
  .pay p { font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; color: ${BRAND.muted}; font-weight: 700; margin-bottom: 8px; }
  .qrs { display: flex; justify-content: center; gap: 18px; }
  .qr img { width: 88px; height: 88px; object-fit: contain; display: block; }
  .qr span { display: block; font-size: 9.5px; font-weight: 700; color: ${BRAND.ink2}; margin-top: 3px; }

  .note { margin-top: 14px; font-size: 11px; color: ${BRAND.ink2}; font-style: italic; }
  .thanks { margin-top: 16px; padding-top: 12px; border-top: 1px solid ${BRAND.rule}; text-align: center; font-size: 10.5px; color: ${BRAND.muted}; }
</style>
</head>
<body>
  <div class="mast">
    <img src="/logo-mark.png" alt="">
    <div class="store">${esc(storeName)}</div>
    ${meta ? `<div class="meta">${meta}</div>` : ''}
  </div>
  <div class="brandrule"></div>

  <div class="doc">
    <div>
      <div class="doclabel">${esc(docLabel)}</div>
      <div class="docdate">${formatDate(invoice.createdAt)}</div>
    </div>
    <div class="docref num">${esc(invoice.invoiceNo)}</div>
  </div>

  <dl class="party">
    <dt>Billed to</dt>
    <dd>${esc(invoice.customerName)}</dd>
  </dl>

  <table>
    <thead>
      <tr><th>Item</th><th>Qty</th><th>Price</th><th>Amount</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="totals">
    <div class="line"><span>Subtotal</span><span class="num">${formatPHP(invoice.subtotal)}</span></div>
    ${invoice.discount > 0 ? `<div class="line"><span>Discount</span><span class="num">−${formatPHP(invoice.discount)}</span></div>` : ''}
    <div class="grand">
      <span class="label">Total</span>
      <span class="value num">${formatPHP(invoice.total)}</span>
    </div>
    ${invoice.paidVia ? `<div class="paid">Payment · <b>${esc(invoice.paidVia)}</b></div>` : ''}
  </div>

  ${gcashQr || mayaQr ? `
  <div class="pay">
    <p>Scan to pay</p>
    <div class="qrs">
      ${gcashQr ? `<div class="qr"><img src="${esc(gcashQr)}" alt=""><span>GCash</span></div>` : ''}
      ${mayaQr ? `<div class="qr"><img src="${esc(mayaQr)}" alt=""><span>Maya</span></div>` : ''}
    </div>
  </div>` : ''}

  ${invoice.notes ? `<p class="note">${esc(invoice.notes)}</p>` : ''}

  <div class="thanks">Thank you for your business</div>
</body>
</html>`

  const win = window.open('', '_blank')
  if (!win) {
    alert('Please allow pop-ups to print.')
    return
  }
  win.document.write(html)
  win.document.close()

  // Print once the artwork is actually there. A bare timer raced the logo and
  // the QR codes, and a document that prints mid-load comes out with holes
  // where they should have been.
  let fired = false
  const print = () => {
    if (fired) return
    fired = true
    win.focus()
    win.print()
  }
  const pending = Array.from(win.document.images).filter(img => !img.complete)
  if (!pending.length) {
    win.setTimeout(print, 120)
  } else {
    let left = pending.length
    const tick = () => { if (--left <= 0) win.setTimeout(print, 60) }
    pending.forEach(img => {
      img.addEventListener('load', tick)
      img.addEventListener('error', tick)
    })
    // never leave the window hanging on an image that will not resolve
    win.setTimeout(print, 2500)
  }
}
