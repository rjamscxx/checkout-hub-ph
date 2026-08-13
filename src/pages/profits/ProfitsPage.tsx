import { useState } from 'react'
import { useProfits } from '../../hooks/useProfits'
import { Badge } from '../../components/ui/Badge'
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
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h1 style={{ fontWeight: 700, color: '#18171A', fontSize: '20px', margin: 0, fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", letterSpacing: '-0.02em' }}>Profits</h1>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: '6px' }}>
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            style={{
              flex: 1, fontSize: '13px', fontWeight: 600, padding: '7px', borderRadius: '8px',
              border: 'none', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
              background: filter === f.id ? '#D91A22' : '#F2F1EE',
              color: filter === f.id ? '#fff' : '#79767F',
              transition: 'all 0.15s',
            }}
          >{f.label}</button>
        ))}
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {[
          { label: 'Revenue', value: formatPHP(totalRevenue), color: '#18171A' },
          { label: 'Profit',  value: formatPHP(totalProfit),  color: '#167A46' },
          { label: 'Cost',    value: formatPHP(totalCost),    color: '#79767F' },
          { label: 'Margin',  value: `${margin}%`,            color: '#9A6F0A' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: '#fff', borderRadius: '12px', border: '1px solid rgba(230,227,220,0.6)', boxShadow: '0 1px 3px rgba(24,23,26,0.07), 0 1px 2px rgba(24,23,26,0.04)', padding: '12px' }}>
            <p style={{ fontSize: '12px', color: '#79767F', margin: 0, fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>{label}</p>
            <p style={{ fontSize: '20px', fontWeight: 700, color, margin: '4px 0 0', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Profit log */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {!profits.length && (
          <p style={{ color: '#79767F', fontSize: '14px', textAlign: 'center', padding: '48px 16px', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
            No profit entries for this period.
          </p>
        )}
        {profits.map(p => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', borderRadius: '10px', border: '1px solid rgba(230,227,220,0.6)', boxShadow: '0 1px 3px rgba(24,23,26,0.07), 0 1px 2px rgba(24,23,26,0.04)', padding: '10px 12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Badge variant={sourceBadge[p.source] ?? 'muted'}>{p.source}</Badge>
                <span style={{ fontSize: '12px', color: '#79767F', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>{p.ref}</span>
              </div>
              <p style={{ fontSize: '11px', color: '#79767F', margin: '3px 0 0', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>{formatDateShort(p.date)}</p>
            </div>
            <span style={{ fontWeight: 700, color: '#167A46', fontSize: '15px', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>{formatPHP(p.profit)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
