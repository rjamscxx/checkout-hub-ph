import { useState } from 'react'
import { Header } from './components/layout/Header'
import { BottomNav, type TabId } from './components/layout/BottomNav'
import { CatalogPage }   from './pages/catalog/CatalogPage'
import { OrdersPage }    from './pages/orders/OrdersPage'
import { ProductsPage }  from './pages/products/ProductsPage'
import { InventoryPage } from './pages/inventory/InventoryPage'
import { InvoicePage }   from './pages/invoice/InvoicePage'
import { ProfitsPage }   from './pages/profits/ProfitsPage'
import { ExpensesPage }  from './pages/expenses/ExpensesPage'
import { ReportsPage }   from './pages/reports/ReportsPage'
import { SettingsPage }  from './pages/settings/SettingsPage'

const PAGE_MAP: Record<TabId, React.ComponentType> = {
  catalog:   CatalogPage,
  orders:    OrdersPage,
  products:  ProductsPage,
  inventory: InventoryPage,
  invoice:   InvoicePage,
  profits:   ProfitsPage,
  expenses:  ExpensesPage,
  reports:   ReportsPage,
  settings:  SettingsPage,
}

export default function App() {
  const [tab, setTab] = useState<TabId>('catalog')
  const Page = PAGE_MAP[tab]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: '#FAFAF8' }}>
      <Header />
      <main style={{ flex: 1, overflowY: 'auto', paddingBottom: '80px' }}>
        <Page />
      </main>
      <BottomNav active={tab} onChange={setTab} />
    </div>
  )
}
