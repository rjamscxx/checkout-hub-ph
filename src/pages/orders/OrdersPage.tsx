import { useState, type CSSProperties } from 'react'
import { ClipboardList } from 'lucide-react'
import { useOrders } from '../../hooks/useOrders'
import { OrderCard } from './OrderCard'
import { QuickAddOrder } from './QuickAddOrder'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/shared/EmptyState'
import { Page, PageHeader } from '../../components/layout/Page'
import { color } from '../../lib/theme'

export function OrdersPage() {
  const orders = useOrders()
  const [adding, setAdding] = useState(false)

  const pending = orders?.filter(o => o.status === 'pending') ?? []
  const rest = orders?.filter(o => o.status !== 'pending') ?? []

  const sectionLabel: CSSProperties = {
    fontSize: '11px', fontWeight: 600, color: color.muted,
    textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px',
  }
  const grid: CSSProperties = {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '10px', alignItems: 'start',
  }

  return (
    <Page>
      <PageHeader
        title="Orders"
        action={<Button size="sm" onClick={() => setAdding(true)}>New Order</Button>}
      />

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
          <div style={grid}>
            {pending.map(o => <OrderCard key={o.id} order={o} />)}
          </div>
        </div>
      )}

      {rest.length > 0 && (
        <div>
          <p style={sectionLabel}>History</p>
          <div style={grid}>
            {rest.map(o => <OrderCard key={o.id} order={o} />)}
          </div>
        </div>
      )}

      <QuickAddOrder open={adding} onClose={() => setAdding(false)} />
    </Page>
  )
}
