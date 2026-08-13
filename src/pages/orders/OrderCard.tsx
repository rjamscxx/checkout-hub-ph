import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import type { Order } from '../../db'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { formatPHP, formatDate } from '../../lib/utils'
import { markOrderPaid, updateOrderStatus, deleteOrder, orderProfit, orderMargin, useMarginFloor } from '../../hooks/useOrders'
import { color, numeric, shadow } from '../../lib/theme'

type BadgeVariant = 'gold' | 'green' | 'muted'
const STATUS_VARIANT: Record<Order['status'], BadgeVariant> = {
  pending: 'gold',
  paid: 'green',
  done: 'muted',
}

const F = "'Plus Jakarta Sans', system-ui, sans-serif"

export function OrderCard({ order }: { order: Order }) {
  const [confirmDel, setConfirmDel] = useState(false)
  const floor = useMarginFloor()
  const profit = orderProfit(order)
  const margin = orderMargin(order)
  const hasCost = order.items.some(i => i.cost != null)
  const profitColor = profit <= 0 ? color.accent : margin < floor ? color.gold : color.green
  const realized = order.status !== 'pending'

  return (
    <div style={{ background: color.surface, borderRadius: '12px', border: `1px solid ${color.border}`, boxShadow: shadow.sm, padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontWeight: 600, color: color.ink, fontSize: '15px', margin: 0, fontFamily: F }}>{order.customerName}</p>
          <p style={{ fontSize: '12px', color: color.muted, margin: '2px 0 0', fontFamily: F, ...numeric }}>{order.ref} · {formatDate(order.createdAt)}</p>
        </div>
        <Badge variant={STATUS_VARIANT[order.status]}>{order.status}</Badge>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {order.items.map((item, i) => (
          <p key={i} style={{ fontSize: '12px', color: color.muted, margin: 0, fontFamily: F }}>
            {item.name} × {item.qty} = <span style={numeric}>{formatPHP(item.price * item.qty)}</span>
          </p>
        ))}
        {order.notes && (
          <p style={{ fontSize: '12px', color: color.muted, margin: '4px 0 0', fontStyle: 'italic', fontFamily: F }}>{order.notes}</p>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px', paddingTop: '8px', borderTop: `1px solid ${color.border}` }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, color: color.accent, fontSize: '16px', fontFamily: F, ...numeric }}>{formatPHP(order.total)}</div>
          {hasCost && (
            <div style={{ fontSize: '11px', color: profitColor, fontWeight: 600, marginTop: '1px', fontFamily: F, ...numeric }}>
              {realized ? '' : '~'}{profit < 0 ? 'loss ' : 'profit '}{formatPHP(profit)} · {margin}%
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
          {order.status === 'pending' && (
            <Button size="sm" onClick={() => markOrderPaid(order)}>Mark Paid</Button>
          )}
          {order.status === 'paid' && (
            <Button size="sm" variant="outline" onClick={() => order.id != null && updateOrderStatus(order.id, 'done')}>Mark Done</Button>
          )}
          {confirmDel ? (
            <Button size="sm" variant="danger" onClick={() => order.id != null && deleteOrder(order.id)}>Confirm?</Button>
          ) : (
            <Button size="sm" variant="ghost" aria-label="Delete order" onClick={() => { setConfirmDel(true); setTimeout(() => setConfirmDel(false), 3000) }}>
              <Trash2 size={15} strokeWidth={1.8} />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
