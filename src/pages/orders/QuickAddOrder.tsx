import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type OrderItem, type Product } from '../../db'
import { Sheet } from '../../components/ui/Sheet'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { addOrder, useMarginFloor } from '../../hooks/useOrders'
import { formatPHP } from '../../lib/utils'
import { color, numeric } from '../../lib/theme'

interface QuickAddOrderProps {
  open: boolean
  onClose: () => void
}

export function QuickAddOrder({ open, onClose }: QuickAddOrderProps) {
  const products = useLiveQuery(() => db.products.orderBy('name').toArray()) ?? []
  const [customerName, setCustomerName] = useState('')
  const [items, setItems] = useState<OrderItem[]>([])
  const [notes, setNotes] = useState('')
  const floor = useMarginFloor()

  const total = items.reduce((s, i) => s + i.price * i.qty, 0)
  const cost = items.reduce((s, i) => s + (i.cost ?? 0) * i.qty, 0)
  const profit = total - cost
  const margin = total > 0 ? Math.round((profit / total) * 100) : 0
  const profitColor = profit <= 0 ? color.accent : margin < floor ? color.gold : color.green

  function toggleProduct(p: Product) {
    setItems(prev => {
      const exists = prev.find(i => i.productId === p.id)
      if (exists) return prev.filter(i => i.productId !== p.id)
      return [...prev, { productId: p.id!, name: p.name, qty: 1, price: p.sellPrice, cost: p.costPrice }]
    })
  }

  function setQty(productId: number, qty: number) {
    if (qty < 1) return
    setItems(prev => prev.map(i => i.productId === productId ? { ...i, qty } : i))
  }

  async function handleSave() {
    if (!customerName.trim() || !items.length) return
    await addOrder(customerName.trim(), items, notes)
    setCustomerName(''); setItems([]); setNotes('')
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose}>
      <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h2 style={{ fontWeight: 700, color: color.ink, fontSize: '18px', margin: 0, letterSpacing: '-0.02em' }}>New Order</h2>

        <Input
          label="Customer Name"
          value={customerName}
          onChange={e => setCustomerName(e.target.value)}
          placeholder="e.g. Maria Santos"
          autoFocus
        />

        <div>
          <p style={{ fontSize: '12px', fontWeight: 500, color: color.muted, marginBottom: '8px' }}>
            Items — tap to add
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '220px', overflowY: 'auto' }}>
            {products.map(p => {
              const item = items.find(i => i.productId === p.id!)
              const selected = !!item
              return (
                <div
                  key={p.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px',
                    borderRadius: '10px', border: `1px solid ${selected ? 'var(--color-accent)' : 'var(--color-border)'}`,
                    background: selected ? 'var(--color-accent-dim)' : 'var(--color-surface)',
                    transition: 'all 0.15s',
                  }}
                >
                  <button
                    style={{ flex: 1, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    onClick={() => toggleProduct(p)}
                  >
                    <p style={{ fontWeight: 500, color: color.ink, fontSize: '14px', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                    <p style={{ fontSize: '12px', margin: '2px 0 0', ...numeric }}>
                      <span style={{ color: color.accent }}>{formatPHP(p.sellPrice)}</span>
                    </p>
                  </button>
                  {item && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      <button onClick={() => setQty(p.id!, item.qty - 1)}
                        style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                      <span style={{ fontSize: '14px', fontWeight: 700, minWidth: '20px', textAlign: 'center', ...numeric }}>{item.qty}</span>
                      <button
                        onClick={() => setQty(p.id!, item.qty + 1)}
                        style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                    </div>
                  )}
                </div>
              )
            })}
            {!products.length && (
              <p style={{ color: color.muted, fontSize: '13px', textAlign: 'center', padding: '16px' }}>No products found. Add some in the Products tab.</p>
            )}
          </div>
        </div>

        <Input label="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Delivery instructions, etc." />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: `1px solid ${color.border}` }}>
          <div>
            <div>
              <span style={{ fontSize: '14px', color: color.muted }}>Total: </span>
              <span style={{ fontSize: '18px', fontWeight: 700, color: color.accent, ...numeric }}>{formatPHP(total)}</span>
            </div>
            {items.length > 0 && (
              <div style={{ fontSize: '12px', color: profitColor, fontWeight: 600, marginTop: '1px', ...numeric }}>
                {profit < 0 ? 'Loss ' : 'Profit '}{formatPHP(profit)} · {margin}% margin
                {profit > 0 && margin < floor ? ` · below ${floor}%` : ''}
              </div>
            )}
          </div>
          <Button onClick={handleSave} disabled={!customerName.trim() || !items.length}>
            Save Order
          </Button>
        </div>
      </div>
    </Sheet>
  )
}
