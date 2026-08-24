import { useLiveQuery } from 'dexie-react-hooks'
import { ClipboardList, Coins, Banknote } from 'lucide-react'
import { db } from '../../db'
import { Button } from '../../components/ui/Button'
import { Page, PageHeader, Section } from '../../components/layout/Page'
import { formatPHP } from '../../lib/utils'
import { color, numeric, column, clamp2 } from '../../lib/theme'
import { ordersToCSV, profitsToCSV, expensesToCSV, downloadCSV } from '../../lib/csv'

interface ProductStat { name: string; units: number; revenue: number; profit: number }

export function ReportsPage() {
  const orders   = useLiveQuery(() => db.orders.toArray()) ?? []
  const profits  = useLiveQuery(() => db.profits.toArray()) ?? []
  const expenses = useLiveQuery(() => db.expenses.toArray()) ?? []

  const topProducts: ProductStat[] = (() => {
    const map = new Map<string, ProductStat>()
    for (const o of orders) {
      if (o.status !== 'paid' && o.status !== 'done') continue
      for (const item of o.items) {
        const prev = map.get(item.name) ?? { name: item.name, units: 0, revenue: 0, profit: 0 }
        const itemRevenue = item.price * item.qty
        const itemProfit  = (item.price - (item.cost ?? 0)) * item.qty
        map.set(item.name, {
          name: item.name,
          units:   prev.units   + item.qty,
          revenue: prev.revenue + itemRevenue,
          profit:  prev.profit  + itemProfit,
        })
      }
    }
    return [...map.values()].sort((a, b) => b.units - a.units).slice(0, 15)
  })()

  const totalRevenue  = profits.reduce((s, p) => s + p.revenue, 0)
  const totalProfit   = profits.reduce((s, p) => s + p.profit, 0)
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
  const netProfit     = totalProfit - totalExpenses

  const statRow = (label: string, value: string, tone: string) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '14px', padding: '6px 0' }}>
      <span style={{ color: color.muted }}>{label}</span>
      <span style={{ fontWeight: 600, color: tone, ...numeric }}>{value}</span>
    </div>
  )

  const today = new Date().toISOString().slice(0, 10)

  return (
    <Page maxWidth={column.form}>
      <PageHeader title="Reports" />

      {/* All-time summary */}
      <Section title="All-Time Summary" style={{ gap: 0 }}>
        {statRow('Total Orders', String(orders.length), color.ink)}
        {statRow('Revenue', formatPHP(totalRevenue), color.ink)}
        {statRow('Gross Profit', formatPHP(totalProfit), color.green)}
        {statRow('Expenses', formatPHP(totalExpenses), color.accent)}
        <div style={{ borderTop: `1px solid ${color.border}`, marginTop: '8px', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontWeight: 700, fontSize: '15px', color: color.ink }}>Net Profit</span>
          <span style={{ fontWeight: 700, fontSize: '15px', color: netProfit >= 0 ? color.green : color.accent, ...numeric }}>{formatPHP(netProfit)}</span>
        </div>
      </Section>

      {/* Top Products */}
      {topProducts.length > 0 && (
        <Section title="Top Products by Units Sold">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            {topProducts.map((p, i) => (
              <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: `1px solid ${color.border}` }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: color.muted, minWidth: '18px', ...numeric }}>
                  {i + 1}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: color.ink, lineHeight: 1.3, ...clamp2 }}>{p.name}</p>
                  <p style={{ margin: '1px 0 0', fontSize: '11px', color: color.muted, ...numeric }}>
                    {formatPHP(p.revenue)} revenue · {formatPHP(p.profit)} profit
                  </p>
                </div>
                <span style={{ fontSize: '14px', fontWeight: 700, color: color.ink, ...numeric, flexShrink: 0 }}>
                  {p.units} <span style={{ fontSize: '11px', fontWeight: 500, color: color.muted }}>sold</span>
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* CSV exports */}
      <Section title="Export CSV">
        <Button variant="outline" style={{ width: '100%', justifyContent: 'flex-start' }}
          onClick={() => downloadCSV(`orders-${today}.csv`, ordersToCSV(orders))}>
          <ClipboardList size={15} strokeWidth={1.8} /> Export Orders <span style={numeric}>({orders.length} rows)</span>
        </Button>
        <Button variant="outline" style={{ width: '100%', justifyContent: 'flex-start' }}
          onClick={() => downloadCSV(`profits-${today}.csv`, profitsToCSV(profits))}>
          <Coins size={15} strokeWidth={1.8} /> Export Profits <span style={numeric}>({profits.length} rows)</span>
        </Button>
        <Button variant="outline" style={{ width: '100%', justifyContent: 'flex-start' }}
          onClick={() => downloadCSV(`expenses-${today}.csv`, expensesToCSV(expenses))}>
          <Banknote size={15} strokeWidth={1.8} /> Export Expenses <span style={numeric}>({expenses.length} rows)</span>
        </Button>
      </Section>

      <p style={{ fontSize: '12px', color: color.muted, margin: 0, textWrap: 'pretty' }}>
        All data is stored locally on your device. Export regularly as your personal backup.
      </p>
    </Page>
  )
}
