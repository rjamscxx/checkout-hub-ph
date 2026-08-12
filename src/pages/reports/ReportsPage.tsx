import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db'
import { Button } from '../../components/ui/Button'
import { formatPHP } from '../../lib/utils'
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
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontFamily: 'Inter, system-ui, sans-serif', padding: '6px 0' }}>
      <span style={{ color: '#6B6760' }}>{label}</span>
      <span style={{ fontWeight: 600, color }}>{value}</span>
    </div>
  )

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h1 style={{ fontWeight: 700, color: '#1A1917', fontSize: '22px', margin: 0, fontFamily: 'Inter, system-ui, sans-serif' }}>Reports</h1>

      {/* All-time summary */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E8E5DF', padding: '16px' }}>
        <p style={{ fontSize: '11px', fontWeight: 600, color: '#6B6760', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 12px', fontFamily: 'Inter, system-ui, sans-serif' }}>
          All-Time Summary
        </p>
        {statRow('Total Orders', String(orders.length), '#1A1917')}
        {statRow('Revenue', formatPHP(totalRevenue), '#1A1917')}
        {statRow('Gross Profit', formatPHP(totalProfit), '#1A9E5C')}
        {statRow('Expenses', formatPHP(totalExpenses), '#E01C24')}
        <div style={{ borderTop: '1px solid #E8E5DF', marginTop: '8px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontFamily: 'Inter, system-ui, sans-serif' }}>
          <span style={{ fontWeight: 700, fontSize: '15px', color: '#1A1917' }}>Net Profit</span>
          <span style={{ fontWeight: 700, fontSize: '15px', color: netProfit >= 0 ? '#1A9E5C' : '#E01C24' }}>{formatPHP(netProfit)}</span>
        </div>
      </div>

      {/* CSV exports */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E8E5DF', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <p style={{ fontSize: '11px', fontWeight: 600, color: '#6B6760', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0, fontFamily: 'Inter, system-ui, sans-serif' }}>
          Export CSV
        </p>
        <Button
          variant="outline"
          style={{ width: '100%', justifyContent: 'flex-start' }}
          onClick={() => downloadCSV(`orders-${new Date().toISOString().slice(0,10)}.csv`, ordersToCSV(orders))}
        >
          📋 Export Orders ({orders.length} rows)
        </Button>
        <Button
          variant="outline"
          style={{ width: '100%', justifyContent: 'flex-start' }}
          onClick={() => downloadCSV(`profits-${new Date().toISOString().slice(0,10)}.csv`, profitsToCSV(profits))}
        >
          💰 Export Profits ({profits.length} rows)
        </Button>
        <Button
          variant="outline"
          style={{ width: '100%', justifyContent: 'flex-start' }}
          onClick={() => downloadCSV(`expenses-${new Date().toISOString().slice(0,10)}.csv`, expensesToCSV(expenses))}
        >
          💸 Export Expenses ({expenses.length} rows)
        </Button>
      </div>

      <p style={{ fontSize: '12px', color: '#6B6760', textAlign: 'center', fontFamily: 'Inter, system-ui, sans-serif' }}>
        All data is stored locally on your device. Export regularly as your personal backup.
      </p>
    </div>
  )
}
