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
      <h1 style={{ fontWeight: 700, color: '#1A1917', fontSize: '22px', margin: 0, fontFamily: 'Inter, system-ui, sans-serif' }}>Expenses</h1>

      {/* Add form */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E8E5DF', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <p style={{ fontSize: '12px', fontWeight: 600, color: '#6B6760', margin: 0, fontFamily: 'Inter, system-ui, sans-serif' }}>Add Expense</p>
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
        <p style={{ fontWeight: 600, color: '#1A1917', fontSize: '14px', margin: 0, fontFamily: 'Inter, system-ui, sans-serif' }}>Total Expenses</p>
        <p style={{ fontWeight: 700, color: '#E01C24', fontSize: '18px', margin: 0, fontFamily: 'Inter, system-ui, sans-serif' }}>{formatPHP(total)}</p>
      </div>

      {/* Expense list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {!expenses.length && (
          <p style={{ color: '#6B6760', fontSize: '14px', textAlign: 'center', padding: '48px 16px', fontFamily: 'Inter, system-ui, sans-serif' }}>
            No expenses recorded yet.
          </p>
        )}
        {expenses.map(e => (
          <div key={e.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', borderRadius: '10px', border: '1px solid #E8E5DF', padding: '10px 12px' }}>
            <div>
              <p style={{ fontWeight: 500, color: '#1A1917', fontSize: '14px', margin: 0, fontFamily: 'Inter, system-ui, sans-serif' }}>{e.description}</p>
              <p style={{ fontSize: '11px', color: '#6B6760', margin: '2px 0 0', fontFamily: 'Inter, system-ui, sans-serif' }}>
                {e.category ? `${e.category} · ` : ''}{e.date}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 700, color: '#1A1917', fontSize: '15px', fontFamily: 'Inter, system-ui, sans-serif' }}>{formatPHP(e.amount)}</span>
              <button
                onClick={() => e.id != null && deleteExpense(e.id)}
                style={{ background: 'none', border: 'none', color: '#6B6760', cursor: 'pointer', fontSize: '18px', padding: '0 2px', lineHeight: 1 }}
              >×</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
