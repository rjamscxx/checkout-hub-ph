import { useState, type CSSProperties } from 'react'
import { ClipboardList } from 'lucide-react'
import { useOrders } from '../../hooks/useOrders'
import { OrderCard } from './OrderCard'
import { QuickAddOrder } from './QuickAddOrder'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/shared/EmptyState'
import { Page, PageHeader, SectionLabel, ContentFrame } from '../../components/layout/Page'

const GRID: CSSProperties = {
  display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
  gap: '10px', alignItems: 'start',
}

export function OrdersPage() {
  const orders = useOrders()
  const [adding, setAdding] = useState(false)

  const pending = orders?.filter(o => o.status === 'pending') ?? []
  const rest = orders?.filter(o => o.status !== 'pending') ?? []

  return (
    <Page>
      <PageHeader
        title="Orders"
        action={<Button size="sm" onClick={() => setAdding(true)}>New Order</Button>}
      />

      <ContentFrame>
        {!orders?.length && (
          <EmptyState
            icon={ClipboardList}
            title="No orders yet"
            message="Log your first sale to start tracking profit."
            action={{ label: 'New Order', onClick: () => setAdding(true) }}
          />
        )}

        {pending.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <SectionLabel>Pending ({pending.length})</SectionLabel>
            <div style={GRID}>
              {pending.map(o => <OrderCard key={o.id} order={o} />)}
            </div>
          </div>
        )}

        {rest.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <SectionLabel>History</SectionLabel>
            <div style={GRID}>
              {rest.map(o => <OrderCard key={o.id} order={o} />)}
            </div>
          </div>
        )}
      </ContentFrame>

      <QuickAddOrder open={adding} onClose={() => setAdding(false)} />
    </Page>
  )
}
