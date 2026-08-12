import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Expense } from '../db'

export function useExpenses() {
  return useLiveQuery(() => db.expenses.orderBy('date').reverse().toArray())
}

export async function addExpense(data: Omit<Expense, 'id'>): Promise<void> {
  await db.expenses.add(data)
}

export async function deleteExpense(id: number): Promise<void> {
  await db.expenses.delete(id)
}
