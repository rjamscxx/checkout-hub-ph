import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Check, X, Boxes } from 'lucide-react'
import { db } from '../../db'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/shared/EmptyState'
import { updateProduct, toggleAvailableToday } from '../../hooks/useProducts'
import { Page, PageHeader, StatGrid, StatCard } from '../../components/layout/Page'
import { color, card } from '../../lib/theme'

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
    <Page>
      <PageHeader title="Inventory" />

      {/* Alert summary — left-aligned metric tiles */}
      <StatGrid min={130}>
        <StatCard label="Out of Stock" value={outOfStock.length} tone="accent" />
        <StatCard label="Low Stock" value={lowStock.length} tone="gold" />
        <StatCard label="Expiring Soon" value={expiringSoon.length} tone="ink" />
      </StatGrid>

      {/* Full inventory list */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '8px', alignItems: 'start' }}>
        {!products.length && (
          <EmptyState icon={Boxes} title="Nothing to track yet" message="Add products in the Products tab and their stock levels show up here." />
        )}
        {products.map(p => (
          <div key={p.id} style={{ ...card, padding: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 600, color: color.ink, fontSize: '14px', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.name}
              </p>
              <p style={{ fontSize: '12px', color: color.muted, margin: '2px 0 0' }}>{p.category}</p>
              {p.expiryDate && (
                <p style={{ fontSize: '11px', color: color.gold, margin: '2px 0 0' }}>Exp: {p.expiryDate}</p>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              <Badge variant={p.stock === 0 ? 'red' : p.stock < 5 ? 'gold' : 'green'}>
                {p.stock} left
              </Badge>

              <button
                onClick={() => p.id != null && toggleAvailableToday(p.id, p.availableToday)}
                aria-pressed={p.availableToday}
                style={{
                  fontSize: '11px', fontWeight: 600, padding: '4px 8px', borderRadius: '6px',
                  border: 'none', cursor: 'pointer',
                  background: p.availableToday ? color.greenDim : color.surface2,
                  color: p.availableToday ? color.green : color.muted,
                  transition: 'background 0.15s, color 0.15s',
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
                      width: '52px', fontSize: '13px', border: `1px solid ${color.border}`,
                      borderRadius: '6px', padding: '4px 6px', background: color.surface2, outline: 'none',
                    }}
                    autoFocus
                    onKeyDown={e => e.key === 'Enter' && p.id != null && handleRestock(p.id)}
                  />
                  <button
                    onClick={() => p.id != null && handleRestock(p.id)}
                    aria-label="Apply restock"
                    style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      background: color.accent, color: color.onAccent, border: 'none',
                      borderRadius: '6px', padding: '5px 7px', cursor: 'pointer',
                    }}
                  >
                    <Check size={15} strokeWidth={2.2} />
                  </button>
                  <button
                    onClick={() => setRestocking(null)}
                    aria-label="Cancel restock"
                    style={{ display: 'inline-flex', alignItems: 'center', color: color.muted, background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                  >
                    <X size={15} strokeWidth={2} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setRestocking(p.id ?? null); setRestockQty('') }}
                  style={{
                    fontSize: '11px', color: color.muted, background: 'none', border: 'none',
                    cursor: 'pointer', padding: '2px 4px',
                  }}
                >
                  Restock
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </Page>
  )
}
