import { useState } from 'react'
import { X, Wallet } from 'lucide-react'
import { useExpenses, addExpense, deleteExpense } from '../../hooks/useExpenses'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { EmptyState } from '../../components/shared/EmptyState'
import { Page, PageHeader, Section, StatGrid, StatCard, ContentFrame } from '../../components/layout/Page'
import { color, numeric, card, column } from '../../lib/theme'
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
    <Page maxWidth={column.form}>
      <PageHeader title="Expenses" />

      {/* Add form */}
      <Section title="Add Expense">
        <Input placeholder="Description (e.g. Supplier payment)" value={desc} onChange={e => setDesc(e.target.value)} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <Input type="number" placeholder="Amount ₱" value={amount} onChange={e => setAmount(e.target.value)} />
          <Input placeholder="Category" value={category} onChange={e => setCategory(e.target.value)} />
        </div>
        <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
        <Button onClick={handleAdd} disabled={!desc.trim() || !amount} style={{ alignSelf: 'flex-start' }}>Add Expense</Button>
      </Section>

      {/* Total */}
      <StatGrid min={200}>
        <StatCard label="Total Expenses" value={formatPHP(total)} tone="accent" />
      </StatGrid>

      {/* Expense list */}
      <ContentFrame>
        {!expenses.length ? (
          <EmptyState icon={Wallet} title="No expenses recorded yet" message="Log supplier payments, load, and fees here so your net profit stays honest." />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '8px', alignItems: 'start' }}>
            {expenses.map(e => (
              <div key={e.id} style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px' }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontWeight: 500, color: color.ink, fontSize: '14px', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.description}</p>
                  <p style={{ fontSize: '11px', color: color.muted, margin: '2px 0 0' }}>
                    {e.category ? `${e.category} · ` : ''}{e.date}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <span style={{ fontWeight: 700, color: color.ink, fontSize: '15px', ...numeric }}>{formatPHP(e.amount)}</span>
                  <button
                    onClick={() => e.id != null && deleteExpense(e.id)}
                    aria-label={`Delete expense ${e.description}`}
                    style={{ display: 'grid', placeItems: 'center', background: 'none', border: 'none', color: color.muted, cursor: 'pointer', padding: '2px' }}
                  ><X size={16} strokeWidth={2} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ContentFrame>
    </Page>
  )
}
