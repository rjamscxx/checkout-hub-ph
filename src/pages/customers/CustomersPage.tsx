import { useLiveQuery } from 'dexie-react-hooks'
import { Users } from 'lucide-react'
import { db } from '../../db'
import { Page, PageHeader, ContentFrame } from '../../components/layout/Page'
import { EmptyState } from '../../components/shared/EmptyState'
import { formatPHP } from '../../lib/utils'
import { color, card, numeric } from '../../lib/theme'

interface CustomerStat {
  name: string
  orderCount: number
  totalSpent: number
  lastOrderDate: string
  isRepeat: boolean
}

export function CustomersPage() {
  const orders = useLiveQuery(() => db.orders.toArray()) ?? []

  const customers: CustomerStat[] = (() => {
    const map = new Map<string, CustomerStat>()
    for (const o of orders) {
      const key = o.customerName.trim().toLowerCase()
      const prev = map.get(key)
      const spent = (o.status === 'paid' || o.status === 'done') ? o.total : 0
      if (!prev) {
        map.set(key, {
          name: o.customerName.trim(),
          orderCount: 1,
          totalSpent: spent,
          lastOrderDate: o.createdAt,
          isRepeat: false,
        })
      } else {
        const updated: CustomerStat = {
          name: prev.name,
          orderCount: prev.orderCount + 1,
          totalSpent: prev.totalSpent + spent,
          lastOrderDate: o.createdAt > prev.lastOrderDate ? o.createdAt : prev.lastOrderDate,
          isRepeat: false,
        }
        updated.isRepeat = updated.orderCount >= 2
        map.set(key, updated)
      }
    }
    return [...map.values()]
      .map(c => ({ ...c, isRepeat: c.orderCount >= 2 }))
      .sort((a, b) => b.totalSpent - a.totalSpent || b.orderCount - a.orderCount)
  })()

  const repeatCount = customers.filter(c => c.isRepeat).length

  function relativeDate(iso: string): string {
    const ms = Date.now() - new Date(iso).getTime()
    const d = Math.floor(ms / 86400000)
    if (d === 0) return 'today'
    if (d === 1) return 'yesterday'
    if (d < 7) return `${d} days ago`
    if (d < 30) return `${Math.floor(d / 7)}w ago`
    return `${Math.floor(d / 30)}mo ago`
  }

  return (
    <Page>
      <PageHeader
        title="Customers"
        subtitle={
          customers.length > 0
            ? <><span style={numeric}>{customers.length}</span> customers · <span style={numeric}>{repeatCount}</span> repeat buyers</>
            : undefined
        }
      />

      <ContentFrame>
        {customers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No customers yet"
            message="Customers appear here automatically once you start adding orders."
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px', alignItems: 'start' }}>
            {customers.map(c => (
              <div key={c.name} style={{ ...card, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                  <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: color.ink, lineHeight: 1.2 }}>
                    {c.name}
                  </p>
                  {c.isRepeat && (
                    <span style={{
                      flexShrink: 0, fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em',
                      padding: '3px 8px', borderRadius: '99px',
                      background: color.greenDim, color: color.green,
                    }}>
                      REPEAT
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '11px', fontWeight: 600, color: color.muted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Orders</p>
                    <p style={{ margin: '2px 0 0', fontSize: '18px', fontWeight: 800, color: color.ink, ...numeric }}>{c.orderCount}</p>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '11px', fontWeight: 600, color: color.muted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Total Paid</p>
                    <p style={{ margin: '2px 0 0', fontSize: '18px', fontWeight: 800, color: color.accent, ...numeric }}>{formatPHP(c.totalSpent)}</p>
                  </div>
                </div>

                <p style={{ margin: 0, fontSize: '12px', color: color.muted }}>
                  Last order <span style={{ color: color.ink2, fontWeight: 500 }}>{relativeDate(c.lastOrderDate)}</span>
                </p>
              </div>
            ))}
          </div>
        )}
      </ContentFrame>
    </Page>
  )
}
