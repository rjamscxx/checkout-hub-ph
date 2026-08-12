import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type OrderItem } from '../../db'
import { Sheet } from '../../components/ui/Sheet'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { addOrder } from '../../hooks/useOrders'
import { formatPHP } from '../../lib/utils'

interface QuickAddOrderProps {
  open: boolean
  onClose: () => void
}

export function QuickAddOrder({ open, onClose }: QuickAddOrderProps) {
  const products = useLiveQuery(() => db.products.orderBy('name').toArray()) ?? []
  const [customerName, setCustomerName] = useState('')
  const [items, setItems] = useState<OrderItem[]>([])
  const [notes, setNotes] = useState('')

  const total = items.reduce((s, i) => s + i.price * i.qty, 0)

  function toggleProduct(productId: number, name: string, price: number) {
    setItems(prev => {
      const exists = prev.find(i => i.productId === productId)
      if (exists) return prev.filter(i => i.productId !== productId)
      return [...prev, { productId, name, qty: 1, price }]
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
        <h2 style={{ fontWeight: 700, color: '#1A1917', fontSize: '18px', margin: 0, fontFamily: 'Inter, system-ui, sans-serif' }}>New Order</h2>

        <Input
          label="Customer Name"
          value={customerName}
          onChange={e => setCustomerName(e.target.value)}
          placeholder="e.g. Maria Santos"
          autoFocus
        />

        <div>
          <p style={{ fontSize: '12px', fontWeight: 500, color: '#6B6760', marginBottom: '8px', fontFamily: 'Inter, system-ui, sans-serif' }}>
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
                    borderRadius: '10px', border: `1px solid ${selected ? '#E01C24' : '#E8E5DF'}`,
                    background: selected ? 'rgba(224,28,36,0.05)' : '#fff',
                    transition: 'all 0.15s',
                  }}
                >
                  <button
                    style={{ flex: 1, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    onClick={() => toggleProduct(p.id!, p.name, p.sellPrice)}
                  >
                    <p style={{ fontWeight: 500, color: '#1A1917', fontSize: '14px', margin: 0, fontFamily: 'Inter, system-ui, sans-serif' }}>{p.name}</p>
                    <p style={{ fontSize: '12px', color: '#E01C24', margin: '2px 0 0', fontFamily: 'Inter, system-ui, sans-serif' }}>{formatPHP(p.sellPrice)}</p>
                  </button>
                  {item && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      <button onClick={() => setQty(p.id!, item.qty - 1)}
                        style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #E8E5DF', background: '#fff', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                      <span style={{ fontSize: '14px', fontWeight: 700, minWidth: '20px', textAlign: 'center', fontFamily: 'Inter, system-ui, sans-serif' }}>{item.qty}</span>
                      <button onClick={() => setQty(p.id!, item.qty + 1)}
                        style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #E8E5DF', background: '#fff', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                    </div>
                  )}
                </div>
              )
            })}
            {!products.length && (
              <p style={{ color: '#6B6760', fontSize: '13px', textAlign: 'center', padding: '16px', fontFamily: 'Inter, system-ui, sans-serif' }}>No products found. Add some in the Products tab.</p>
            )}
          </div>
        </div>

        <Input label="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Delivery instructions, etc." />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #E8E5DF' }}>
          <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
            <span style={{ fontSize: '14px', color: '#6B6760' }}>Total: </span>
            <span style={{ fontSize: '18px', fontWeight: 700, color: '#E01C24' }}>{formatPHP(total)}</span>
          </div>
          <Button onClick={handleSave} disabled={!customerName.trim() || !items.length}>
            Save Order
          </Button>
        </div>
      </div>
    </Sheet>
  )
}
