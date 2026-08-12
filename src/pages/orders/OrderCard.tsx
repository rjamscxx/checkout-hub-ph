import type { Order } from '../../db'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { formatPHP, formatDate } from '../../lib/utils'
import { updateOrderStatus, deleteOrder } from '../../hooks/useOrders'

type BadgeVariant = 'gold' | 'green' | 'muted'
const STATUS_VARIANT: Record<Order['status'], BadgeVariant> = {
  pending: 'gold',
  paid: 'green',
  done: 'muted',
}

export function OrderCard({ order }: { order: Order }) {
  return (
    <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E8E5DF', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
        <div>
          <p style={{ fontWeight: 600, color: '#1A1917', fontSize: '15px', margin: 0, fontFamily: 'Inter, system-ui, sans-serif' }}>{order.customerName}</p>
          <p style={{ fontSize: '12px', color: '#6B6760', margin: '2px 0 0', fontFamily: 'Inter, system-ui, sans-serif' }}>{order.ref} · {formatDate(order.createdAt)}</p>
        </div>
        <Badge variant={STATUS_VARIANT[order.status]}>{order.status}</Badge>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {order.items.map((item, i) => (
          <p key={i} style={{ fontSize: '12px', color: '#6B6760', margin: 0, fontFamily: 'Inter, system-ui, sans-serif' }}>
            {item.name} × {item.qty} = {formatPHP(item.price * item.qty)}
          </p>
        ))}
        {order.notes && (
          <p style={{ fontSize: '12px', color: '#6B6760', margin: '4px 0 0', fontStyle: 'italic', fontFamily: 'Inter, system-ui, sans-serif' }}>{order.notes}</p>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #E8E5DF' }}>
        <span style={{ fontWeight: 700, color: '#E01C24', fontSize: '16px', fontFamily: 'Inter, system-ui, sans-serif' }}>{formatPHP(order.total)}</span>
        <div style={{ display: 'flex', gap: '4px' }}>
          {order.status === 'pending' && (
            <Button size="sm" onClick={() => order.id != null && updateOrderStatus(order.id, 'paid')}>
              Mark Paid
            </Button>
          )}
          {order.status === 'paid' && (
            <Button size="sm" variant="outline" onClick={() => order.id != null && updateOrderStatus(order.id, 'done')}>
              Mark Done
            </Button>
          )}
          <Button size="sm" variant="danger" onClick={() => order.id != null && deleteOrder(order.id)}>
            Del
          </Button>
        </div>
      </div>
    </div>
  )
}
