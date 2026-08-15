import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { PlusCircle, ShoppingBag, AlertTriangle } from 'lucide-react'
import { db } from '../../db'
import { Page, PageHeader, StatGrid, StatCard, ContentFrame, Section } from '../../components/layout/Page'
import { OrderCard } from '../orders/OrderCard'
import { QuickAddOrder } from '../orders/QuickAddOrder'
import { EmptyState } from '../../components/shared/EmptyState'
import { Button } from '../../components/ui/Button'
import { formatPHP, todayISO } from '../../lib/utils'
import { color, numeric } from '../../lib/theme'

const LOW_STOCK_THRESHOLD = 5

export function HomePage() {
  const [addingOrder, setAddingOrder] = useState(false)

  const todayProfits = useLiveQuery(async () => {
    const today = todayISO()
    return db.profits.where('date').equals(today).toArray()
  }, []) ?? []

  const pendingOrders = useLiveQuery(() =>
    db.orders.where('status').equals('pending').reverse().toArray()
  ) ?? []

  const lowStock = useLiveQuery(() =>
    db.products.filter(p => p.stock <= LOW_STOCK_THRESHOLD).toArray()
  ) ?? []

  const todayRevenue = todayProfits.reduce((s, p) => s + p.revenue, 0)
  const todayProfit  = todayProfits.reduce((s, p) => s + p.profit, 0)

  const today = new Date().toLocaleDateString('en-PH', {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  return (
    <Page>
      <PageHeader
        title="Home"
        subtitle={today}
        action={
          <Button onClick={() => setAddingOrder(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <PlusCircle size={16} strokeWidth={2.1} />
            New Order
          </Button>
        }
      />

      {/* Today's headline numbers */}
      <StatGrid>
        <StatCard label="Revenue Today"   value={formatPHP(todayRevenue)}           tone="ink"  />
        <StatCard label="Profit Today"    value={formatPHP(todayProfit)}            tone="green" />
        <StatCard label="Pending Orders"  value={String(pendingOrders.length)}      tone={pendingOrders.length > 0 ? 'gold'   : 'muted'} />
        <StatCard label="Low Stock Items" value={String(lowStock.length)}           tone={lowStock.length   > 0 ? 'accent' : 'muted'} />
      </StatGrid>

      {/* All pending orders */}
      <ContentFrame minHeight={0}>
        <p style={{
          fontSize: '11px', fontWeight: 700, color: color.muted,
          textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0,
        }}>
          Pending Orders{pendingOrders.length > 0 ? ` · ${pendingOrders.length}` : ''}
        </p>

        {!pendingOrders.length ? (
          <EmptyState
            icon={ShoppingBag}
            title="No pending orders"
            message="All clear — nothing waiting on payment."
          />
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '8px',
          }}>
            {pendingOrders.map(order => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </ContentFrame>

      {/* Low-stock warnings — only shown when there's something to flag */}
      {lowStock.length > 0 && (
        <Section title={`Low Stock · ${lowStock.length} item${lowStock.length !== 1 ? 's' : ''}`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {lowStock
              .sort((a, b) => a.stock - b.stock)
              .map(p => {
                const out = p.stock === 0
                return (
                  <div
                    key={p.id}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 12px', borderRadius: '10px',
                      background: out ? color.accentDim : color.goldDim,
                      border: `1px solid ${out ? color.accent : color.gold}`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                      <AlertTriangle
                        size={15} strokeWidth={2}
                        style={{ flexShrink: 0, color: out ? color.accent : color.gold }}
                      />
                      <span style={{
                        fontSize: '14px', fontWeight: 500, color: color.ink,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {p.name}
                      </span>
                    </div>
                    <span style={{
                      fontSize: '13px', fontWeight: 700, flexShrink: 0, marginLeft: '12px',
                      color: out ? color.accent : color.gold, ...numeric,
                    }}>
                      {out ? 'Out of stock' : `${p.stock} left`}
                    </span>
                  </div>
                )
              })}
          </div>
        </Section>
      )}

      <QuickAddOrder open={addingOrder} onClose={() => setAddingOrder(false)} />
    </Page>
  )
}
