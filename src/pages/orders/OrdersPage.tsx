import { useState } from 'react'
import { useOrders } from '../../hooks/useOrders'
import { OrderCard } from './OrderCard'
import { QuickAddOrder } from './QuickAddOrder'
import { Button } from '../../components/ui/Button'

export function OrdersPage() {
  const orders = useOrders()
  const [adding, setAdding] = useState(false)

  const pending = orders?.filter(o => o.status === 'pending') ?? []
  const rest = orders?.filter(o => o.status !== 'pending') ?? []

  const sectionLabel: React.CSSProperties = {
    fontSize: '11px', fontWeight: 600, color: '#6B6760',
    textTransform: 'uppercase', letterSpacing: '0.5px',
    fontFamily: 'Inter, system-ui, sans-serif', margin: '0 0 8px',
  }

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontWeight: 700, color: '#1A1917', fontSize: '22px', margin: 0, fontFamily: 'Inter, system-ui, sans-serif' }}>Orders</h1>
        <Button size="sm" onClick={() => setAdding(true)}>+ New Order</Button>
      </div>

      {!orders?.length && (
        <div style={{ textAlign: 'center', color: '#6B6760', fontSize: '14px', padding: '64px 16px', fontFamily: 'Inter, system-ui, sans-serif' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📋</div>
          No orders yet. Tap + New Order to log one.
        </div>
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
