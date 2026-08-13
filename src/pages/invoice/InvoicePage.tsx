import { useState } from 'react'
import type { InvoiceItem } from '../../db'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { addInvoice } from '../../hooks/useInvoices'
import { printInvoice } from './InvoicePrint'
import { formatPHP, genInvoiceNo } from '../../lib/utils'

const EMPTY_ITEM: InvoiceItem = { description: '', qty: 1, price: 0 }

export function InvoicePage() {
  const [customerName, setCustomerName] = useState('')
  const [items, setItems] = useState<InvoiceItem[]>([{ ...EMPTY_ITEM }])
  const [discount, setDiscount] = useState(0)
  const [paidVia, setPaidVia] = useState('')
  const [notes, setNotes] = useState('')

  const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0)
  const total = Math.max(0, subtotal - discount)

  function setItem(idx: number, field: keyof InvoiceItem, value: string | number) {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }

  function addItem() { setItems(prev => [...prev, { ...EMPTY_ITEM }]) }
  function removeItem(idx: number) { if (items.length > 1) setItems(prev => prev.filter((_, i) => i !== idx)) }

  async function handleSave() {
    if (!customerName.trim() || !items.some(i => i.description.trim())) return
    const validItems = items.filter(i => i.description.trim())
    const invoice = {
      customerName: customerName.trim(),
      items: validItems,
      subtotal,
      discount,
      total,
      paidVia,
      notes,
    }
    await addInvoice(invoice)
    // Print immediately after save
    printInvoice({
      invoice: { ...invoice, id: 0, invoiceNo: genInvoiceNo('INV'), createdAt: new Date().toISOString() },
      storeName: 'Checkout Hub PH',
    })
    // Reset form
    setCustomerName(''); setItems([{ ...EMPTY_ITEM }]); setDiscount(0); setPaidVia(''); setNotes('')
  }

  const itemRowStyle: React.CSSProperties = {
    display: 'grid', gridTemplateColumns: '1fr 52px 80px 28px', gap: '6px', alignItems: 'end', marginBottom: '8px',
  }

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h1 style={{ fontWeight: 700, color: 'var(--color-ink)', fontSize: '20px', margin: 0, fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", letterSpacing: '-0.02em' }}>Invoice</h1>

      <Input label="Customer Name *" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Customer name" />

      {/* Line items */}
      <div>
        <p style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-muted)', margin: '0 0 8px', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>Line Items</p>
        {items.map((item, idx) => (
          <div key={idx} style={itemRowStyle}>
            <Input placeholder="Description" value={item.description} onChange={e => setItem(idx, 'description', e.target.value)} />
            <Input type="number" min="1" placeholder="Qty" value={item.qty} onChange={e => setItem(idx, 'qty', Number(e.target.value))} />
            <Input type="number" min="0" placeholder="Price" value={item.price} onChange={e => setItem(idx, 'price', Number(e.target.value))} />
            <button
              onClick={() => removeItem(idx)}
              style={{ height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', color: 'var(--color-muted)', cursor: 'pointer', fontSize: '18px' }}
            >×</button>
          </div>
        ))}
        <Button size="sm" variant="ghost" onClick={addItem}>Add Line</Button>
      </div>

      {/* Totals */}
      <div style={{ background: 'var(--color-surface2)', borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
          <span style={{ color: 'var(--color-muted)' }}>Subtotal</span>
          <span style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>{formatPHP(subtotal)}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '14px', gap: '8px' }}>
          <span style={{ color: 'var(--color-muted)', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>Discount ₱</span>
          <input
            type="number" min="0" value={discount} onChange={e => setDiscount(Number(e.target.value))}
            style={{ width: '90px', textAlign: 'right', background: 'transparent', border: 'none', borderBottom: '1px solid var(--color-border)', fontSize: '14px', outline: 'none', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", color: 'var(--color-ink)', padding: '2px 0', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '16px', paddingTop: '8px', borderTop: '1px solid var(--color-border)', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
          <span>Total</span>
          <span style={{ color: 'var(--color-accent)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>{formatPHP(total)}</span>
        </div>
      </div>

      <Input label="Paid Via" value={paidVia} onChange={e => setPaidVia(e.target.value)} placeholder="GCash, Cash, Maya, etc." />
      <Input label="Notes / Footer" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional note on the invoice" />

      <Button
        size="lg"
        style={{ width: '100%' }}
        onClick={handleSave}
        disabled={!customerName.trim() || !items.some(i => i.description.trim())}
      >
        Save & Print
      </Button>
    </div>
  )
}
