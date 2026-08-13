import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, Sun, Moon } from 'lucide-react'
import { Sidebar, type TabId } from './components/layout/Sidebar'
import { CatalogPage }   from './pages/catalog/CatalogPage'
import { OrdersPage }    from './pages/orders/OrdersPage'
import { ProductsPage }  from './pages/products/ProductsPage'
import { InventoryPage } from './pages/inventory/InventoryPage'
import { InvoicePage }   from './pages/invoice/InvoicePage'
import { ProfitsPage }   from './pages/profits/ProfitsPage'
import { ExpensesPage }  from './pages/expenses/ExpensesPage'
import { ReportsPage }   from './pages/reports/ReportsPage'
import { SettingsPage }  from './pages/settings/SettingsPage'
import { getSetting } from './db'
import { useTheme } from './hooks/useTheme'
import { useMediaQuery } from './hooks/useMediaQuery'
import { color, font } from './lib/theme'

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
  const { theme, toggle } = useTheme()
  const isDesktop = useMediaQuery('(min-width: 900px)')
  const [tab, setTab] = useState<TabId>('catalog')
  const [drawer, setDrawer] = useState(false)
  const [storeName, setStoreName] = useState('Checkout Hub')
  const Page = PAGE_MAP[tab]

  useEffect(() => {
    getSetting('store_name', 'Checkout Hub').then(setStoreName)
    const handler = () => getSetting('store_name', 'Checkout Hub').then(setStoreName)
    window.addEventListener('settings-updated', handler)
    return () => window.removeEventListener('settings-updated', handler)
  }, [])

  useEffect(() => { if (isDesktop) setDrawer(false) }, [isDesktop])

  function go(t: TabId) { setTab(t); setDrawer(false) }

  return (
    <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden', background: color.bg }}>
      {isDesktop && (
        <Sidebar active={tab} onChange={go} storeName={storeName} theme={theme} onToggleTheme={toggle} />
      )}

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {!isDesktop && (
          <header style={{
            display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0,
            height: '54px', padding: '0 8px 0 6px', paddingTop: 'env(safe-area-inset-top, 0px)',
            background: color.glass, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            borderBottom: `1px solid ${color.border}`, position: 'sticky', top: 0, zIndex: 20,
          }}>
            <button onClick={() => setDrawer(true)} aria-label="Open menu" style={{ display: 'grid', placeItems: 'center', width: '40px', height: '40px', borderRadius: '10px', border: 'none', background: 'transparent', color: color.ink, cursor: 'pointer' }}>
              <Menu size={21} strokeWidth={1.9} />
            </button>
            <img src="/logo-mark.png" alt="" style={{ height: '26px', width: 'auto' }} />
            <span style={{ flex: 1, fontWeight: 700, fontSize: '15px', color: color.ink, fontFamily: font, letterSpacing: '-0.015em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{storeName}</span>
            <button onClick={toggle} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} style={{ display: 'grid', placeItems: 'center', width: '40px', height: '40px', borderRadius: '10px', border: 'none', background: 'transparent', color: color.ink2, cursor: 'pointer' }}>
              {theme === 'dark' ? <Sun size={19} strokeWidth={1.9} /> : <Moon size={19} strokeWidth={1.9} />}
            </button>
          </header>
        )}

        <main style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <div style={{ maxWidth: '820px', margin: '0 auto', width: '100%' }}>
            <Page />
          </div>
        </main>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {!isDesktop && drawer && (
          <>
            <motion.div
              onClick={() => setDrawer(false)}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.45)' }}
            />
            <motion.div
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.22, ease: 'easeOut' }}
              style={{ position: 'fixed', top: 0, left: 0, zIndex: 50, height: '100dvh' }}
            >
              <Sidebar active={tab} onChange={go} storeName={storeName} theme={theme} onToggleTheme={toggle} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
