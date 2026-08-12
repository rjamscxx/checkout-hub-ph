export type TabId =
  | 'catalog' | 'orders' | 'products' | 'inventory' | 'invoice'
  | 'profits' | 'expenses' | 'reports' | 'settings'

interface NavItem {
  id: TabId
  label: string
  icon: string
}

const PRIMARY_TABS: NavItem[] = [
  { id: 'catalog',   label: 'Catalog',   icon: '📸' },
  { id: 'orders',    label: 'Orders',    icon: '📋' },
  { id: 'products',  label: 'Products',  icon: '📦' },
  { id: 'inventory', label: 'Inventory', icon: '📊' },
  { id: 'invoice',   label: 'Invoice',   icon: '🧾' },
]

const MORE_TABS: NavItem[] = [
  { id: 'profits',  label: 'Profits',  icon: '💰' },
  { id: 'expenses', label: 'Expenses', icon: '💸' },
  { id: 'reports',  label: 'Reports',  icon: '📈' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
]

interface BottomNavProps {
  active: TabId
  onChange: (tab: TabId) => void
}

export function BottomNav({ active, onChange }: BottomNavProps) {
  const isMoreActive = MORE_TABS.some(t => t.id === active)
  const activeMoreTab = MORE_TABS.find(t => t.id === active)

  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    padding: '8px 0',
    fontSize: '11px',
    fontWeight: 500,
    color: isActive ? '#E01C24' : '#6B6760',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    transition: 'color 0.15s',
    fontFamily: 'Inter, system-ui, sans-serif',
  })

  return (
    <nav
      style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 30,
        background: '#fff', borderTop: '1px solid #E8E5DF',
        display: 'flex',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {PRIMARY_TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          style={tabStyle(active === tab.id)}
        >
          <span style={{ fontSize: '20px', lineHeight: 1 }}>{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
      <button
        onClick={() => {
          const currentMoreIdx = MORE_TABS.findIndex(t => t.id === active)
          const next = MORE_TABS[(currentMoreIdx + 1) % MORE_TABS.length]
          onChange(next.id)
        }}
        style={tabStyle(isMoreActive)}
      >
        <span style={{ fontSize: '20px', lineHeight: 1 }}>
          {isMoreActive ? (activeMoreTab?.icon ?? '⋯') : '⋯'}
        </span>
        <span>{isMoreActive ? (activeMoreTab?.label ?? 'More') : 'More'}</span>
      </button>
    </nav>
  )
}
