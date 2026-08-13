import { useLiveQuery } from 'dexie-react-hooks'
import { ClipboardList, Coins, Banknote } from 'lucide-react'
import { db } from '../../db'
import { Button } from '../../components/ui/Button'
import { formatPHP } from '../../lib/utils'
import { numeric } from '../../lib/theme'
import { ordersToCSV, profitsToCSV, expensesToCSV, downloadCSV } from '../../lib/csv'

export function ReportsPage() {
  const orders   = useLiveQuery(() => db.orders.toArray()) ?? []
  const profits  = useLiveQuery(() => db.profits.toArray()) ?? []
  const expenses = useLiveQuery(() => db.expenses.toArray()) ?? []

  const totalRevenue  = profits.reduce((s, p) => s + p.revenue, 0)
  const totalProfit   = profits.reduce((s, p) => s + p.profit, 0)
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
  const netProfit     = totalProfit - totalExpenses

  const statRow = (label: string, value: string, color: string) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", padding: '6px 0' }}>
      <span style={{ color: 'var(--color-muted)' }}>{label}</span>
      <span style={{ fontWeight: 600, color }}>{value}</span>
    </div>
  )

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h1 style={{ fontWeight: 700, color: 'var(--color-ink)', fontSize: '22px', margin: 0, fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>Reports</h1>

      {/* All-time summary */}
      <div style={{ background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)', padding: '16px' }}>
        <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 12px', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
          All-Time Summary
        </p>
        {statRow('Total Orders', String(orders.length), 'var(--color-ink)')}
        {statRow('Revenue', formatPHP(totalRevenue), 'var(--color-ink)')}
        {statRow('Gross Profit', formatPHP(totalProfit), 'var(--color-green)')}
        {statRow('Expenses', formatPHP(totalExpenses), 'var(--color-accent)')}
        <div style={{ borderTop: '1px solid var(--color-border)', marginTop: '8px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
          <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-ink)' }}>Net Profit</span>
          <span style={{ fontWeight: 700, fontSize: '15px', color: netProfit >= 0 ? 'var(--color-green)' : 'var(--color-accent)' }}>{formatPHP(netProfit)}</span>
        </div>
      </div>

      {/* CSV exports */}
      <div style={{ background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0, fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
          Export CSV
        </p>
        <Button
          variant="outline"
          style={{ width: '100%', justifyContent: 'flex-start' }}
          onClick={() => downloadCSV(`orders-${new Date().toISOString().slice(0,10)}.csv`, ordersToCSV(orders))}
        >
          <ClipboardList size={15} strokeWidth={1.8} /> Export Orders <span style={numeric}>({orders.length} rows)</span>
        </Button>
        <Button
          variant="outline"
          style={{ width: '100%', justifyContent: 'flex-start' }}
          onClick={() => downloadCSV(`profits-${new Date().toISOString().slice(0,10)}.csv`, profitsToCSV(profits))}
        >
          <Coins size={15} strokeWidth={1.8} /> Export Profits <span style={numeric}>({profits.length} rows)</span>
        </Button>
        <Button
          variant="outline"
          style={{ width: '100%', justifyContent: 'flex-start' }}
          onClick={() => downloadCSV(`expenses-${new Date().toISOString().slice(0,10)}.csv`, expensesToCSV(expenses))}
        >
          <Banknote size={15} strokeWidth={1.8} /> Export Expenses <span style={numeric}>({expenses.length} rows)</span>
        </Button>
      </div>

      <p style={{ fontSize: '12px', color: 'var(--color-muted)', textAlign: 'center', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
        All data is stored locally on your device. Export regularly as your personal backup.
      </p>
    </div>
  )
}
