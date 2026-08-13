import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Check, X, Boxes } from 'lucide-react'
import { db } from '../../db'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/shared/EmptyState'
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
      <h1 style={{ fontWeight: 700, color: 'var(--color-ink)', fontSize: '20px', margin: 0, fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", letterSpacing: '-0.02em' }}>Inventory</h1>

      {/* Alert summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
        <div style={{ background: 'var(--color-surface)', borderRadius: '12px', padding: '12px', textAlign: 'center', border: '1px solid var(--color-border)', boxShadow: '0 1px 3px rgba(var(--shadow-tint),0.07), 0 1px 2px rgba(var(--shadow-tint),0.04)' }}>
          <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-accent)', margin: 0, fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>{outOfStock.length}</p>
          <p style={{ fontSize: '11px', color: 'var(--color-muted)', margin: '2px 0 0', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>Out of Stock</p>
        </div>
        <div style={{ background: 'var(--color-surface)', borderRadius: '12px', padding: '12px', textAlign: 'center', border: '1px solid var(--color-border)', boxShadow: '0 1px 3px rgba(var(--shadow-tint),0.07), 0 1px 2px rgba(var(--shadow-tint),0.04)' }}>
          <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-gold)', margin: 0, fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>{lowStock.length}</p>
          <p style={{ fontSize: '11px', color: 'var(--color-muted)', margin: '2px 0 0', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>Low Stock</p>
        </div>
        <div style={{ background: 'var(--color-surface)', borderRadius: '12px', padding: '12px', textAlign: 'center', border: '1px solid var(--color-border)', boxShadow: '0 1px 3px rgba(var(--shadow-tint),0.07), 0 1px 2px rgba(var(--shadow-tint),0.04)' }}>
          <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-ink)', margin: 0, fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>{expiringSoon.length}</p>
          <p style={{ fontSize: '11px', color: 'var(--color-muted)', margin: '2px 0 0', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>Expiring Soon</p>
        </div>
      </div>

      {/* Full inventory list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {!products.length && (
          <EmptyState icon={Boxes} title="Nothing to track yet" message="Add products in the Products tab and their stock levels show up here." />
        )}
        {products.map(p => (
          <div
            key={p.id}
            style={{
              background: 'var(--color-surface)',
              borderRadius: '12px',
              border: '1px solid var(--color-border)',
              boxShadow: '0 1px 3px rgba(var(--shadow-tint),0.07), 0 1px 2px rgba(var(--shadow-tint),0.04)',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 600, color: 'var(--color-ink)', fontSize: '14px', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
                {p.name}
              </p>
              <p style={{ fontSize: '12px', color: 'var(--color-muted)', margin: '2px 0 0', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>{p.category}</p>
              {p.expiryDate && (
                <p style={{ fontSize: '11px', color: 'var(--color-gold)', margin: '2px 0 0', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>Exp: {p.expiryDate}</p>
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
                  fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                  background: p.availableToday ? 'var(--color-green-dim)' : 'var(--color-surface2)',
                  color: p.availableToday ? 'var(--color-green)' : 'var(--color-muted)',
                  transition: 'all 0.15s',
                }}
              >
                {p.availableToday ? 'On' : 'Off'}
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
                      border: '1px solid var(--color-border)',
                      borderRadius: '6px',
                      padding: '4px 6px',
                      background: 'var(--color-surface2)',
                      outline: 'none',
                      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                    }}
                    autoFocus
                    onKeyDown={e => e.key === 'Enter' && p.id != null && handleRestock(p.id)}
                  />
                  <button
                    onClick={() => p.id != null && handleRestock(p.id)}
                    aria-label="Apply restock"
                    style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      background: 'var(--color-accent)',
                      color: 'var(--color-on-accent)',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '5px 7px',
                      cursor: 'pointer',
                    }}
                  >
                    <Check size={15} strokeWidth={2.2} />
                  </button>
                  <button
                    onClick={() => setRestocking(null)}
                    aria-label="Cancel restock"
                    style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--color-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                  >
                    <X size={15} strokeWidth={2} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setRestocking(p.id ?? null); setRestockQty('') }}
                  style={{
                    fontSize: '11px',
                    color: 'var(--color-muted)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '2px 4px',
                    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
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
