import { useState } from 'react'
import { useExpenses, addExpense, deleteExpense } from '../../hooks/useExpenses'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { formatPHP, todayISO } from '../../lib/utils'

export function ExpensesPage() {
  const expenses = useExpenses() ?? []
  const [desc, setDesc] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [date, setDate] = useState(todayISO())

  const total = expenses.reduce((s, e) => s + e.amount, 0)

  async function handleAdd() {
    if (!desc.trim() || !amount) return
    await addExpense({ description: desc.trim(), amount: Number(amount), category, date })
    setDesc(''); setAmount(''); setCategory('')
  }

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h1 style={{ fontWeight: 700, color: 'var(--color-ink)', fontSize: '20px', margin: 0, fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", letterSpacing: '-0.02em' }}>Expenses</h1>

      {/* Add form */}
      <div style={{ background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)', boxShadow: '0 1px 3px rgba(var(--shadow-tint),0.07), 0 1px 2px rgba(var(--shadow-tint),0.04)', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-muted)', margin: 0, fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>Add Expense</p>
        <Input placeholder="Description (e.g. Supplier payment)" value={desc} onChange={e => setDesc(e.target.value)} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <Input type="number" placeholder="Amount ₱" value={amount} onChange={e => setAmount(e.target.value)} />
          <Input placeholder="Category" value={category} onChange={e => setCategory(e.target.value)} />
        </div>
        <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
        <Button onClick={handleAdd} disabled={!desc.trim() || !amount}>Add Expense</Button>
      </div>

      {/* Total */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontWeight: 600, color: 'var(--color-ink)', fontSize: '14px', margin: 0, fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>Total Expenses</p>
        <p style={{ fontWeight: 700, color: 'var(--color-accent)', fontSize: '18px', margin: 0, fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>{formatPHP(total)}</p>
      </div>

      {/* Expense list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {!expenses.length && (
          <p style={{ color: 'var(--color-muted)', fontSize: '14px', textAlign: 'center', padding: '48px 16px', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
            No expenses recorded yet.
          </p>
        )}
        {expenses.map(e => (
          <div key={e.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--color-surface)', borderRadius: '10px', border: '1px solid var(--color-border)', boxShadow: '0 1px 3px rgba(var(--shadow-tint),0.07), 0 1px 2px rgba(var(--shadow-tint),0.04)', padding: '10px 12px' }}>
            <div>
              <p style={{ fontWeight: 500, color: 'var(--color-ink)', fontSize: '14px', margin: 0, fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>{e.description}</p>
              <p style={{ fontSize: '11px', color: 'var(--color-muted)', margin: '2px 0 0', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
                {e.category ? `${e.category} · ` : ''}{e.date}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 700, color: 'var(--color-ink)', fontSize: '15px', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>{formatPHP(e.amount)}</span>
              <button
                onClick={() => e.id != null && deleteExpense(e.id)}
                style={{ background: 'none', border: 'none', color: 'var(--color-muted)', cursor: 'pointer', fontSize: '18px', padding: '0 2px', lineHeight: 1 }}
              >×</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
