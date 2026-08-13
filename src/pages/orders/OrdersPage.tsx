import { useState } from 'react'
import { ClipboardList } from 'lucide-react'
import { useOrders } from '../../hooks/useOrders'
import { OrderCard } from './OrderCard'
import { QuickAddOrder } from './QuickAddOrder'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/shared/EmptyState'

export function OrdersPage() {
  const orders = useOrders()
  const [adding, setAdding] = useState(false)

  const pending = orders?.filter(o => o.status === 'pending') ?? []
  const rest = orders?.filter(o => o.status !== 'pending') ?? []

  const sectionLabel: React.CSSProperties = {
    fontSize: '11px', fontWeight: 600, color: 'var(--color-muted)',
    textTransform: 'uppercase', letterSpacing: '0.5px',
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", margin: '0 0 8px',
  }

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontWeight: 700, color: 'var(--color-ink)', fontSize: '20px', margin: 0, fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", letterSpacing: '-0.02em' }}>Orders</h1>
        <Button size="sm" onClick={() => setAdding(true)}>New Order</Button>
      </div>

      {!orders?.length && (
        <EmptyState
          icon={ClipboardList}
          title="No orders yet"
          message="Log your first sale to start tracking profit."
          action={{ label: 'New Order', onClick: () => setAdding(true) }}
        />
      )}

      {pending.length > 0 && (
        <div>
          <p style={sectionLabel}>Pending ({pending.length})</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {pending.map(o => <OrderCard key={o.id} order={o} />)}
          </div>
        </div>
      )}

      {rest.length > 0 && (
        <div>
          <p style={sectionLabel}>History</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {rest.map(o => <OrderCard key={o.id} order={o} />)}
          </div>
        </div>
      )}

      <QuickAddOrder open={adding} onClose={() => setAdding(false)} />
    </div>
  )
}
