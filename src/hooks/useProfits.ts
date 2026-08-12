import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { todayISO } from '../lib/utils'

type ProfitFilter = 'today' | 'week' | 'month' | 'all'

export function useProfits(filter: ProfitFilter = 'all') {
  return useLiveQuery(async () => {
    const all = await db.profits.orderBy('date').reverse().toArray()
    if (filter === 'today') {
      const today = todayISO()
      return all.filter(p => p.date === today)
    }
    if (filter === 'week') {
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
      return all.filter(p => p.date >= weekAgo)
    }
    if (filter === 'month') {
      const now = new Date()
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
      return all.filter(p => p.date >= monthStart)
    }
    return all
  }, [filter])
}
