import { useState } from 'react'
import { TrendingUp } from 'lucide-react'
import { useProfits } from '../../hooks/useProfits'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/shared/EmptyState'
import { Page, PageHeader, StatGrid, StatCard } from '../../components/layout/Page'
import { color, card, numeric } from '../../lib/theme'
import { formatPHP, formatDateShort } from '../../lib/utils'

type Filter = 'today' | 'week' | 'month' | 'all'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'week',  label: 'Week'  },
  { id: 'month', label: 'Month' },
  { id: 'all',   label: 'All'   },
]

export function ProfitsPage() {
  const [filter, setFilter] = useState<Filter>('month')
  const profits = useProfits(filter) ?? []

  const totalRevenue = profits.reduce((s, p) => s + p.revenue, 0)
  const totalCost    = profits.reduce((s, p) => s + p.cost, 0)
  const totalProfit  = profits.reduce((s, p) => s + p.profit, 0)
  const margin = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0

  type BadgeVariant = 'green' | 'gold' | 'muted'
  const sourceBadge: Record<string, BadgeVariant> = { order: 'green', invoice: 'gold', manual: 'muted' }

  return (
    <Page>
      <PageHeader title="Profits" />

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: '6px' }}>
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            aria-pressed={filter === f.id}
            style={{
              flex: 1, fontSize: '13px', fontWeight: 600, padding: '7px', borderRadius: '8px',
              border: 'none', cursor: 'pointer',
              background: filter === f.id ? color.accent : color.surface2,
              color: filter === f.id ? color.onAccent : color.muted,
              transition: 'background 0.15s, color 0.15s',
            }}
          >{f.label}</button>
        ))}
      </div>

      {/* Stat tiles */}
      <StatGrid>
        <StatCard label="Revenue" value={formatPHP(totalRevenue)} tone="ink" />
        <StatCard label="Profit" value={formatPHP(totalProfit)} tone="green" />
        <StatCard label="Cost" value={formatPHP(totalCost)} tone="muted" />
        <StatCard label="Margin" value={`${margin}%`} tone="gold" />
      </StatGrid>

      {/* Profit log */}
      {!profits.length ? (
        <EmptyState icon={TrendingUp} title="No profit yet for this period" message="Paid orders and invoices land here. Switch the filter or log a sale to see profit build up." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '8px', alignItems: 'start' }}>
          {profits.map(p => (
            <div key={p.id} style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '10px' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Badge variant={sourceBadge[p.source] ?? 'muted'}>{p.source}</Badge>
                  <span style={{ fontSize: '12px', color: color.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.ref}</span>
                </div>
                <p style={{ fontSize: '11px', color: color.muted, margin: '3px 0 0' }}>{formatDateShort(p.date)}</p>
              </div>
              <span style={{ fontWeight: 700, color: color.green, fontSize: '15px', flexShrink: 0, ...numeric }}>{formatPHP(p.profit)}</span>
            </div>
          ))}
        </div>
      )}
    </Page>
  )
}
