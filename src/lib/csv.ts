import type { Order, ProfitEntry, Expense } from '../db'

function escape(val: unknown): string {
  const s = String(val ?? '')
  return s.includes(',') || s.includes('"') || s.includes('\n')
    ? `"${s.replace(/"/g, '""')}"`
    : s
}

function toCSV(rows: string[][]): string {
  return rows.map(r => r.map(escape).join(',')).join('\n')
}

export function ordersToCSV(orders: Order[]): string {
  const header = ['Ref', 'Customer', 'Items', 'Total', 'Status', 'Date']
  const rows = orders.map(o => [
    o.ref,
    o.customerName,
    o.items.map(i => `${i.name}x${i.qty}`).join(' | '),
    String(o.total),
    o.status,
    o.createdAt.slice(0, 10),
  ])
  return toCSV([header, ...rows])
}

export function profitsToCSV(entries: ProfitEntry[]): string {
  const header = ['Date', 'Source', 'Ref', 'Revenue', 'Cost', 'Profit']
  const rows = entries.map(e => [e.date, e.source, e.ref, String(e.revenue), String(e.cost), String(e.profit)])
  return toCSV([header, ...rows])
}

export function expensesToCSV(expenses: Expense[]): string {
  const header = ['Date', 'Description', 'Category', 'Amount']
  const rows = expenses.map(e => [e.date, e.description, e.category, String(e.amount)])
  return toCSV([header, ...rows])
}

export function downloadCSV(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
