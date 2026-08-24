import {
  Home, ScanLine, LayoutGrid, ShoppingBag, Users, Package, Boxes, FileText,
  TrendingUp, Wallet, BarChart3, Settings2, Sun, Moon,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { color, font, shadow } from '../../lib/theme'
import type { Theme } from '../../hooks/useTheme'

export type TabId =
  | 'home' | 'pos' | 'catalog' | 'orders' | 'customers' | 'products' | 'inventory' | 'invoice'
  | 'profits' | 'expenses' | 'reports' | 'settings'

interface NavItem { id: TabId; label: string; Icon: LucideIcon }

export const NAV: NavItem[] = [
  { id: 'home',      label: 'Home',      Icon: Home        },
  { id: 'pos',       label: 'POS',       Icon: ScanLine    },
  { id: 'catalog',   label: 'Catalog',   Icon: LayoutGrid  },
  { id: 'orders',    label: 'Orders',    Icon: ShoppingBag },
  { id: 'customers', label: 'Customers', Icon: Users       },
  { id: 'products',  label: 'Products',  Icon: Package     },
  { id: 'inventory', label: 'Inventory', Icon: Boxes       },
  { id: 'invoice',   label: 'Invoice',   Icon: FileText    },
  { id: 'profits',   label: 'Profits',   Icon: TrendingUp  },
  { id: 'expenses',  label: 'Expenses',  Icon: Wallet      },
  { id: 'reports',   label: 'Reports',   Icon: BarChart3   },
  { id: 'settings',  label: 'Settings',  Icon: Settings2   },
]

interface SidebarProps {
  active: TabId
  onChange: (tab: TabId) => void
  storeName: string
  theme: Theme
  onToggleTheme: () => void
}

export function Sidebar({ active, onChange, storeName, theme, onToggleTheme }: SidebarProps) {
  return (
    <aside style={{
      width: '244px', flexShrink: 0, height: '100dvh',
      background: color.surface, borderRight: `1px solid ${color.border}`,
      display: 'flex', flexDirection: 'column', fontFamily: font,
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '18px 18px 14px' }}>
        <img src="/logo-mark.png" alt="" style={{ height: '30px', width: 'auto' }} />
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: '15px', fontWeight: 800, color: color.ink, margin: 0, letterSpacing: '-0.015em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{storeName}</p>
          <p style={{ fontSize: '11px', color: color.muted, margin: 0, fontWeight: 600, letterSpacing: '0.04em' }}>BUSINESS TOOL</p>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '6px 12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {NAV.map(({ id, label, Icon }) => {
          const on = active === id
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              aria-current={on ? 'page' : undefined}
              style={{
                display: 'flex', alignItems: 'center', gap: '11px', width: '100%',
                padding: '9px 12px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                textAlign: 'left', fontFamily: font, fontSize: '14px',
                fontWeight: on ? 700 : 500,
                color: on ? color.accent : color.ink2,
                background: on ? color.accentDim : 'transparent',
                transition: 'background 0.12s, color 0.12s',
              }}
            >
              <Icon size={19} strokeWidth={on ? 2.3 : 1.8} />
              {label}
            </button>
          )
        })}
      </nav>

      {/* Theme toggle */}
      <div style={{ padding: '12px', borderTop: `1px solid ${color.border}` }}>
        <button
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
            padding: '9px 12px', borderRadius: '10px', cursor: 'pointer', fontFamily: font,
            background: color.surface2, border: `1px solid ${color.border}`,
            color: color.ink2, fontSize: '13px', fontWeight: 600, boxShadow: shadow.xs,
          }}
        >
          {theme === 'dark' ? <Sun size={17} strokeWidth={1.9} /> : <Moon size={17} strokeWidth={1.9} />}
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
      </div>
    </aside>
  )
}
