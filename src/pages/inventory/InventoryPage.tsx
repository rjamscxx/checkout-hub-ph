import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Check, X, Boxes, Plus } from 'lucide-react'
import { db } from '../../db'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/shared/EmptyState'
import { updateProduct, toggleAvailableToday, toggleOnhand } from '../../hooks/useProducts'
import { Page, PageHeader, StatGrid, StatCard, ContentFrame } from '../../components/layout/Page'
import { color, card, numeric, clamp2 } from '../../lib/theme'

/**
 * A state pill on an inventory row.
 *
 * Two of them sit side by side saying different things, so they are told
 * apart by colour rather than by reading: green is "customers can see it",
 * brand red is "it's on the front shelf". Grey is off, for both.
 */
function TogglePill({ on, tone, label, onClick }: {
  on: boolean
  tone: 'green' | 'accent'
  label: string
  onClick: () => void
}) {
  const lit = tone === 'green' ? color.green : color.accent
  const litBg = tone === 'green' ? color.greenDim : color.accentDim
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        fontSize: '12px', fontWeight: 600, fontFamily: 'inherit',
        padding: '5px 10px', borderRadius: '8px',
        border: 'none', cursor: 'pointer',
        background: on ? litBg : color.surface2,
        color: on ? lit : color.muted,
        transition: 'background 0.15s, color 0.15s',
      }}
    >
      {on && <Check size={12} strokeWidth={2.6} />}
      {label}
    </button>
  )
}

export function InventoryPage() {
  const products = useLiveQuery(() => db.products.orderBy('name').toArray()) ?? []
  const [restocking, setRestocking] = useState<number | null>(null)
  const [restockQty, setRestockQty] = useState('')

  const outOfStock = products.filter(p => p.stock === 0)
  const lowStock = products.filter(p => p.stock > 0 && p.stock < 5)
  const onhand = products.filter(p => p.onhand)
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
      <PageHeader
        title="Inventory"
        subtitle={`${products.length} product${products.length !== 1 ? 's' : ''} tracked`}
      />

      {/* Alert summary — left-aligned metric tiles */}
      <StatGrid min={130}>
        <StatCard label="Onhand" value={onhand.length} tone="green" />
        <StatCard label="Out of Stock" value={outOfStock.length} tone="accent" />
        <StatCard label="Low Stock" value={lowStock.length} tone="gold" />
        <StatCard label="Expiring Soon" value={expiringSoon.length} tone="ink" />
      </StatGrid>

      {/* Full inventory list */}
      <ContentFrame padding={products.length ? 12 : 0}>
        {!products.length && (
          <EmptyState icon={Boxes} title="Nothing to track yet" message="Add products in the Products tab and their stock levels show up here." />
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '8px', alignItems: 'start' }}>
        {products.map(p => (
          /* Name above, controls below. Four controls beside the name would
             leave it a sliver of the card and truncate it to initials. */
          <div key={p.id} style={{ ...card, padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontWeight: 600, color: color.ink, fontSize: '14px', margin: 0, lineHeight: 1.3, ...clamp2 }}>
                {p.name}
              </p>
              <p style={{ fontSize: '12px', color: color.muted, margin: '2px 0 0' }}>{p.category}</p>
              {p.expiryDate && (
                <p style={{ fontSize: '11px', color: color.gold, margin: '2px 0 0', ...numeric }}>Exp: {p.expiryDate}</p>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <Badge variant={p.stock === 0 ? 'red' : p.stock < 5 ? 'gold' : 'green'}>
                {p.stock} left
              </Badge>

              <TogglePill
                on={!!p.onhand}
                tone="accent"
                label="Onhand"
                onClick={() => p.id != null && toggleOnhand(p.id, p.onhand)}
              />

              <TogglePill
                on={p.availableToday}
                tone="green"
                label={p.availableToday ? 'Live' : 'Off'}
                onClick={() => p.id != null && toggleAvailableToday(p.id, p.availableToday)}
              />

              {restocking === p.id ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input
                    type="number"
                    min="1"
                    value={restockQty}
                    onChange={e => setRestockQty(e.target.value)}
                    style={{
                      width: '56px', fontSize: '13px', ...numeric,
                      border: `1px solid ${color.accent}`,
                      borderRadius: '8px', padding: '5px 8px',
                      background: color.surface, outline: 'none',
                      color: color.ink,
                    }}
                    autoFocus
                    onKeyDown={e => e.key === 'Enter' && p.id != null && handleRestock(p.id)}
                  />
                  <Button size="sm" onClick={() => p.id != null && handleRestock(p.id)} aria-label="Apply restock">
                    <Check size={13} strokeWidth={2.4} />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setRestocking(null)} aria-label="Cancel">
                    <X size={13} strokeWidth={2} />
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => { setRestocking(p.id ?? null); setRestockQty('') }}
                >
                  <Plus size={13} strokeWidth={2} /> Restock
                </Button>
              )}
            </div>
          </div>
        ))}
        </div>
      </ContentFrame>
    </Page>
  )
}
