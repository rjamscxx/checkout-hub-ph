import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db'
import { Badge } from '../../components/ui/Badge'
import { updateProduct, toggleAvailableToday } from '../../hooks/useProducts'

export function InventoryPage() {
  const products = useLiveQuery(() => db.products.orderBy('name').toArray()) ?? []
  const [restocking, setRestocking] = useState<number | null>(null)
  const [restockQty, setRestockQty] = useState('')

  const outOfStock = products.filter(p => p.stock === 0)
  const lowStock = products.filter(p => p.stock > 0 && p.stock < 5)
  const expiringSoon = products.filter(p => {
    if (!p.expiryDate) return false
    const diff = (new Date(p.expiryDate).getTime() - Date.now()) / 86400000
    return diff >= 0 && diff <= 7
  })

  async function handleRestock(id: number) {
    const qty = parseInt(restockQty, 10)
    if (!qty || qty < 1) return
    const product = products.find(p => p.id === id)
    if (!product) return
    await updateProduct(id, { stock: product.stock + qty })
    setRestocking(null)
    setRestockQty('')
  }

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h1 style={{ fontWeight: 700, color: '#1A1917', fontSize: '22px', margin: 0, fontFamily: 'Inter, system-ui, sans-serif' }}>Inventory</h1>

      {/* Alert summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '12px', textAlign: 'center', border: '1px solid rgba(224,28,36,0.13)' }}>
          <p style={{ fontSize: '24px', fontWeight: 700, color: '#E01C24', margin: 0, fontFamily: 'Inter, system-ui, sans-serif' }}>{outOfStock.length}</p>
          <p style={{ fontSize: '11px', color: '#6B6760', margin: '2px 0 0', fontFamily: 'Inter, system-ui, sans-serif' }}>Out of Stock</p>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '12px', textAlign: 'center', border: '1px solid rgba(184,134,11,0.13)' }}>
          <p style={{ fontSize: '24px', fontWeight: 700, color: '#B8860B', margin: 0, fontFamily: 'Inter, system-ui, sans-serif' }}>{lowStock.length}</p>
          <p style={{ fontSize: '11px', color: '#6B6760', margin: '2px 0 0', fontFamily: 'Inter, system-ui, sans-serif' }}>Low Stock</p>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '12px', textAlign: 'center', border: '1px solid #E8E5DF' }}>
          <p style={{ fontSize: '24px', fontWeight: 700, color: '#1A1917', margin: 0, fontFamily: 'Inter, system-ui, sans-serif' }}>{expiringSoon.length}</p>
          <p style={{ fontSize: '11px', color: '#6B6760', margin: '2px 0 0', fontFamily: 'Inter, system-ui, sans-serif' }}>Expiring Soon</p>
        </div>
      </div>

      {/* Full inventory list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {!products.length && (
          <p style={{ color: '#6B6760', fontSize: '14px', textAlign: 'center', padding: '48px 16px', fontFamily: 'Inter, system-ui, sans-serif' }}>
            No products yet. Add some in the Products tab.
          </p>
        )}
        {products.map(p => (
          <div
            key={p.id}
            style={{
              background: '#fff',
              borderRadius: '12px',
              border: '1px solid #E8E5DF',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 600, color: '#1A1917', fontSize: '14px', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'Inter, system-ui, sans-serif' }}>
                {p.name}
              </p>
              <p style={{ fontSize: '12px', color: '#6B6760', margin: '2px 0 0', fontFamily: 'Inter, system-ui, sans-serif' }}>{p.category}</p>
              {p.expiryDate && (
                <p style={{ fontSize: '11px', color: '#B8860B', margin: '2px 0 0', fontFamily: 'Inter, system-ui, sans-serif' }}>Exp: {p.expiryDate}</p>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              <Badge variant={p.stock === 0 ? 'red' : p.stock < 5 ? 'gold' : 'green'}>
                {p.stock} left
              </Badge>

              <button
                onClick={() => p.id != null && toggleAvailableToday(p.id, p.availableToday)}
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  background: p.availableToday ? 'rgba(26,158,92,0.10)' : '#F5F4F0',
                  color: p.availableToday ? '#1A9E5C' : '#6B6760',
                  transition: 'all 0.15s',
                }}
              >
                {p.availableToday ? '✓' : 'Off'}
              </button>

              {restocking === p.id ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input
                    type="number"
                    min="1"
                    value={restockQty}
                    onChange={e => setRestockQty(e.target.value)}
                    style={{
                      width: '52px',
                      fontSize: '13px',
                      border: '1px solid #E8E5DF',
                      borderRadius: '6px',
                      padding: '4px 6px',
                      background: '#F5F4F0',
                      outline: 'none',
                      fontFamily: 'Inter, system-ui, sans-serif',
                    }}
                    autoFocus
                    onKeyDown={e => e.key === 'Enter' && p.id != null && handleRestock(p.id)}
                  />
                  <button
                    onClick={() => p.id != null && handleRestock(p.id)}
                    style={{
                      fontSize: '11px',
                      background: '#E01C24',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '5px 8px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontFamily: 'Inter, system-ui, sans-serif',
                    }}
                  >
                    +
                  </button>
                  <button
                    onClick={() => setRestocking(null)}
                    style={{ fontSize: '14px', color: '#6B6760', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setRestocking(p.id ?? null); setRestockQty('') }}
                  style={{
                    fontSize: '11px',
                    color: '#6B6760',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '2px 4px',
                    fontFamily: 'Inter, system-ui, sans-serif',
                  }}
                >
                  Restock
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
