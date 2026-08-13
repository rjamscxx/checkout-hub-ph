import { useState } from 'react'
import {
  LayoutGrid, ShoppingBag, Package, Boxes, FileText,
  TrendingUp, Wallet, BarChart3, Settings2, MoreHorizontal, X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Sheet } from '../ui/Sheet'

export type TabId =
  | 'catalog' | 'orders' | 'products' | 'inventory' | 'invoice'
  | 'profits' | 'expenses' | 'reports' | 'settings'

interface NavItem {
  id: TabId
  label: string
  Icon: LucideIcon
}

const PRIMARY_TABS: NavItem[] = [
  { id: 'catalog',   label: 'Catalog',  Icon: LayoutGrid  },
  { id: 'orders',    label: 'Orders',   Icon: ShoppingBag },
  { id: 'products',  label: 'Products', Icon: Package     },
  { id: 'inventory', label: 'Stock',    Icon: Boxes       },
  { id: 'invoice',   label: 'Invoice',  Icon: FileText    },
]

const MORE_TABS: NavItem[] = [
  { id: 'profits',  label: 'Profits',  Icon: TrendingUp },
  { id: 'expenses', label: 'Expenses', Icon: Wallet     },
  { id: 'reports',  label: 'Reports',  Icon: BarChart3  },
  { id: 'settings', label: 'Settings', Icon: Settings2  },
]

interface BottomNavProps {
  active: TabId
  onChange: (tab: TabId) => void
}

const F = "'Plus Jakarta Sans', system-ui, sans-serif"

export function BottomNav({ active, onChange }: BottomNavProps) {
  const [moreOpen, setMoreOpen] = useState(false)
  const isMoreActive = MORE_TABS.some(t => t.id === active)
  const activeMoreTab = MORE_TABS.find(t => t.id === active)

  function pickMore(id: TabId) { onChange(id); setMoreOpen(false) }

  return (
    <>
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 30,
        background: '#fff', borderTop: '1px solid #E6E3DC',
        display: 'flex', paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        boxShadow: '0 -2px 12px rgba(24,23,26,0.06)',
      }}>
        {PRIMARY_TABS.map(({ id, label, Icon }) => {
          const on = active === id
          return (
            <button key={id} onClick={() => onChange(id)} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
              padding: '10px 0 9px', fontSize: '10px', fontWeight: on ? 700 : 500,
              color: on ? '#D91A22' : '#79767F', background: 'none', border: 'none',
              cursor: 'pointer', transition: 'color 0.12s', fontFamily: F, letterSpacing: '0.01em',
            }}>
              <Icon size={20} strokeWidth={on ? 2.2 : 1.7} />
              {label}
            </button>
          )
        })}
        <button onClick={() => setMoreOpen(true)} style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
          padding: '10px 0 9px', fontSize: '10px', fontWeight: isMoreActive ? 700 : 500,
          color: isMoreActive ? '#D91A22' : '#79767F', background: 'none', border: 'none',
          cursor: 'pointer', transition: 'color 0.12s', fontFamily: F, letterSpacing: '0.01em',
        }}>
          {isMoreActive && activeMoreTab
            ? <activeMoreTab.Icon size={20} strokeWidth={2.2} />
            : <MoreHorizontal size={20} strokeWidth={1.7} />}
          {isMoreActive && activeMoreTab ? activeMoreTab.label : 'More'}
        </button>
      </nav>

      <Sheet open={moreOpen} onClose={() => setMoreOpen(false)}>
        <div style={{ padding: '0 16px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#79767F', letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: F }}>More</p>
            <button onClick={() => setMoreOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#79767F', display: 'flex', padding: '4px' }}>
              <X size={16} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {MORE_TABS.map(({ id, label, Icon }) => {
              const on = active === id
              return (
                <button key={id} onClick={() => pickMore(id)} style={{
                  display: 'flex', alignItems: 'center', gap: '13px',
                  padding: '12px 14px', borderRadius: '12px',
                  background: on ? 'rgba(217,26,34,0.07)' : 'transparent',
                  border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left',
                  transition: 'background 0.12s',
                }}>
                  <Icon size={19} strokeWidth={on ? 2.2 : 1.7} color={on ? '#D91A22' : '#3D3B42'} />
                  <span style={{ fontSize: '15px', fontWeight: on ? 700 : 500, color: on ? '#D91A22' : '#18171A', fontFamily: F, flex: 1 }}>
                    {label}
                  </span>
                  {on && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#D91A22', flexShrink: 0 }} />}
                </button>
              )
            })}
          </div>
        </div>
      </Sheet>
    </>
  )
}
