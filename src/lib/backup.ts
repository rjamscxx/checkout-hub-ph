import { db } from '../db'

export async function exportBackup(): Promise<void> {
  const data = {
    version: 2,
    exportedAt: new Date().toISOString(),
    products: await db.products.toArray(),
    orders: await db.orders.toArray(),
    invoices: await db.invoices.toArray(),
    profits: await db.profits.toArray(),
    expenses: await db.expenses.toArray(),
    settings: await db.settings.toArray(),
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `checkout-hub-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export async function importBackup(file: File): Promise<void> {
  const text = await file.text()
  const data = JSON.parse(text) as Record<string, unknown>
  if (!data['version'] || !data['products']) throw new Error('Invalid backup file')

  await db.transaction('rw', [db.products, db.orders, db.invoices, db.profits, db.expenses, db.settings], async () => {
    await db.products.clear()
    await db.orders.clear()
    await db.invoices.clear()
    await db.profits.clear()
    await db.expenses.clear()
    await db.settings.clear()

    const products = data['products'] as Parameters<typeof db.products.bulkAdd>[0]
    const orders = data['orders'] as Parameters<typeof db.orders.bulkAdd>[0]
    const invoices = data['invoices'] as Parameters<typeof db.invoices.bulkAdd>[0]
    const profits = data['profits'] as Parameters<typeof db.profits.bulkAdd>[0]
    const expenses = data['expenses'] as Parameters<typeof db.expenses.bulkAdd>[0]
    const settings = data['settings'] as Parameters<typeof db.settings.bulkPut>[0]

    if (products?.length) await db.products.bulkAdd(products)
    if (orders?.length) await db.orders.bulkAdd(orders)
    if (invoices?.length) await db.invoices.bulkAdd(invoices)
    if (profits?.length) await db.profits.bulkAdd(profits)
    if (expenses?.length) await db.expenses.bulkAdd(expenses)
    if (settings?.length) await db.settings.bulkPut(settings)
  })
}
