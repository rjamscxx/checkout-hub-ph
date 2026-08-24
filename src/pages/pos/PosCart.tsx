/**
 * The cart panel — what's being sold, what it's worth, and what you keep.
 *
 * The cost and profit line is the point of the whole screen, so it sits with
 * the total rather than behind a tap. It can still be blanked with the eye
 * when there's a customer on the other side of the counter, the same rule
 * that keeps wholesale figures off the catalog flyer.
 */
import { useEffect, useState, type ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Eye, EyeOff, Minus, Plus, ShoppingCart, Trash2, PauseCircle, X } from 'lucide-react'
import { getSetting, setSetting, type OrderItem } from '../../db'
import type { UseCart } from '../../hooks/useCart'
import { saleTotals, profitTone } from '../../lib/sale'
import { Button } from '../../components/ui/Button'
import { formatPHP } from '../../lib/utils'
import { color, numeric, radius, space } from '../../lib/theme'

const HIDDEN = '•••'

/* ---- cost visibility ---------------------------------------------------- */

function useShowCost(): [boolean, () => void] {
  const raw = useLiveQuery(() => getSetting('pos_show_cost', '1'), [], '1') ?? '1'
  const show = raw !== '0'
  return [show, () => { void setSetting('pos_show_cost', show ? '0' : '1') }]
}

/* ---- money field -------------------------------------------------------- */

/**
 * A number you can type over. Held locally while focused so a half-typed "1"
 * doesn't briefly reprice the line at one peso, and committed on blur or
 * Enter. Anything unparseable snaps back to the stored value.
 */
function MoneyInput({
  value, onCommit, label, width = 62,
}: { value: number; onCommit: (n: number) => void; label: string; width?: number }) {
  const [draft, setDraft] = useState(String(value))
  const [editing, setEditing] = useState(false)

  useEffect(() => { if (!editing) setDraft(String(value)) }, [value, editing])

  function commit() {
    setEditing(false)
    const n = Number(draft)
    if (draft.trim() !== '' && Number.isFinite(n) && n >= 0) onCommit(n)
    else setDraft(String(value))
  }

  return (
    <input
      aria-label={label}
      inputMode="decimal"
      value={draft}
      onFocus={e => { setEditing(true); e.target.select() }}
      onChange={e => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
      style={{
        width, padding: '4px 7px', textAlign: 'right',
        background: color.surface2, border: `1px solid ${color.border}`,
        borderRadius: radius.sm - 1, color: color.ink,
        fontSize: '12.5px', fontWeight: 500, fontFamily: 'inherit',
        outline: 'none', ...numeric,
      }}
    />
  )
}

/* ---- one line ----------------------------------------------------------- */

function QtyButton({ children, onClick, label }: { children: ReactNode; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      style={{
        display: 'grid', placeItems: 'center', width: '26px', height: '26px',
        borderRadius: radius.sm - 1, border: `1px solid ${color.border}`,
        background: color.surface, color: color.ink2, cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

function CartRow({ item, onQty, onPrice }: {
  item: OrderItem
  onQty: (productId: number, qty: number) => void
  onPrice: (productId: number, price: number) => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: space[2], padding: `${space[2]}px 0`, borderBottom: `1px solid ${color.border}` }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin: 0, fontSize: '13px', fontWeight: 600, color: color.ink, lineHeight: 1.3,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {item.name}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px' }}>
          <span style={{ fontSize: '11.5px', color: color.muted }}>₱</span>
          <MoneyInput value={item.price} onCommit={n => onPrice(item.productId, n)} label={`Unit price for ${item.name}`} width={58} />
          <span style={{ fontSize: '11.5px', color: color.muted }}>each</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px', flexShrink: 0 }}>
        <span style={{ fontSize: '13.5px', fontWeight: 700, color: color.ink, ...numeric }}>
          {formatPHP(item.price * item.qty)}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <QtyButton label={`One less ${item.name}`} onClick={() => onQty(item.productId, item.qty - 1)}>
            <Minus size={13} strokeWidth={2.4} />
          </QtyButton>
          <span style={{ minWidth: '20px', textAlign: 'center', fontSize: '13px', fontWeight: 700, color: color.ink, ...numeric }}>{item.qty}</span>
          <QtyButton label={`One more ${item.name}`} onClick={() => onQty(item.productId, item.qty + 1)}>
            <Plus size={13} strokeWidth={2.4} />
          </QtyButton>
        </div>
      </div>
    </div>
  )
}

/* ---- the panel ---------------------------------------------------------- */

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: space[2] }}>
      <span style={{ fontSize: '12.5px', color: color.muted }}>{label}</span>
      <span style={{ fontSize: '13px', fontWeight: 600, color: color.ink2, ...numeric }}>{value}</span>
    </div>
  )
}

interface PosCartProps {
  cart: UseCart
  floor: number
  charging: boolean
  onCharge: () => void
}

const TONE_COLOR = { loss: color.accent, below: color.gold, ok: color.green } as const

export function PosCart({ cart, floor, charging, onCharge }: PosCartProps) {
  const { items, discount, parked } = cart
  const [showCost, toggleCost] = useShowCost()
  const totals = saleTotals(items, discount)
  const tone = profitTone(totals, floor)
  const toneColor = TONE_COLOR[tone]
  const empty = !items.length

  return (
    <div className="pos-cart" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* head */}
      <div style={{ display: 'flex', alignItems: 'center', gap: space[2], paddingBottom: space[2], borderBottom: `1px solid ${color.border}`, flexShrink: 0 }}>
        <ShoppingCart size={17} strokeWidth={2} color={color.accent} />
        <span style={{ fontSize: '14px', fontWeight: 700, color: color.ink }}>Sale</span>
        {totals.itemCount > 0 && (
          <span style={{ fontSize: '11px', fontWeight: 700, color: color.accent, background: color.accentDim, padding: '2px 7px', borderRadius: '999px', ...numeric }}>
            {totals.itemCount}
          </span>
        )}
        <div style={{ flex: 1 }} />
        {!empty && (
          <>
            <button
              onClick={cart.park}
              title="Set this sale aside"
              aria-label="Park this sale"
              style={{ display: 'grid', placeItems: 'center', width: '28px', height: '28px', border: 'none', background: 'transparent', color: color.muted, cursor: 'pointer', borderRadius: radius.sm }}
            >
              <PauseCircle size={16} strokeWidth={1.9} />
            </button>
            <button
              onClick={cart.clear}
              title="Clear this sale"
              aria-label="Clear this sale"
              style={{ display: 'grid', placeItems: 'center', width: '28px', height: '28px', border: 'none', background: 'transparent', color: color.muted, cursor: 'pointer', borderRadius: radius.sm }}
            >
              <Trash2 size={15} strokeWidth={1.9} />
            </button>
          </>
        )}
      </div>

      {/* parked sales */}
      {parked.length > 0 && (
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', paddingTop: space[2], flexShrink: 0 }}>
          {parked.map(p => (
            <span
              key={p.id}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '3px 4px 3px 9px',
                borderRadius: '999px', background: color.surface2, border: `1px solid ${color.border}`,
              }}
            >
              <button
                onClick={() => cart.resume(p.id!)}
                title={`Resume ${p.label}`}
                style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', color: color.ink2, fontWeight: 600, fontFamily: 'inherit', fontSize: '11.5px' }}
              >
                {p.label}
                <span style={{ color: color.muted, fontWeight: 500 }}> · {p.items.reduce((s, i) => s + i.qty, 0)}</span>
              </button>
              <button
                onClick={() => cart.discard(p.id!)}
                aria-label={`Discard ${p.label}`}
                style={{ display: 'grid', placeItems: 'center', width: '16px', height: '16px', border: 'none', background: 'none', color: color.muted, cursor: 'pointer' }}
              >
                <X size={11} strokeWidth={2.4} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* lines */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, paddingRight: '2px' }}>
        {empty ? (
          <p style={{ fontSize: '12.5px', color: color.muted, textAlign: 'center', padding: '32px 12px', margin: 0, textWrap: 'pretty' }}>
            Tap a product to start a sale.
          </p>
        ) : (
          items.map(i => <CartRow key={i.productId} item={i} onQty={cart.setQty} onPrice={cart.setPrice} />)
        )}
      </div>

      {/* money */}
      <div style={{ paddingTop: space[3], display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
        <Row label="Subtotal" value={formatPHP(totals.subtotal)} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: space[2] }}>
          <span style={{ fontSize: '12.5px', color: color.muted }}>Discount</span>
          <MoneyInput value={discount} onCommit={cart.setDiscount} label="Discount in pesos" width={72} />
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: space[2], paddingTop: '6px', borderTop: `1px solid ${color.border}` }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: color.ink }}>Total</span>
          <span style={{ fontSize: '20px', fontWeight: 800, color: color.accent, ...numeric }}>{formatPHP(totals.total)}</span>
        </div>

        {/* the number you actually came for */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: space[2],
            background: color.surface2, border: `1px solid ${color.border}`,
            borderRadius: radius.sm + 1, padding: '7px 8px 7px 10px',
          }}
        >
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexWrap: 'wrap', gap: '2px 10px', fontSize: '12px' }}>
            <span style={{ color: color.muted }}>
              Cost <b style={{ color: color.ink2, fontWeight: 700, ...numeric }}>{showCost ? formatPHP(totals.cost) : HIDDEN}</b>
            </span>
            <span style={{ color: color.muted }}>
              {totals.profit < 0 ? 'Loss ' : 'Profit '}
              <b style={{ color: toneColor, fontWeight: 700, ...numeric }}>{showCost ? formatPHP(totals.profit) : HIDDEN}</b>
              {showCost && !empty && (
                <span style={{ color: toneColor }}>
                  {' · '}{totals.margin}%{tone === 'below' ? ` · under ${floor}%` : ''}
                </span>
              )}
            </span>
          </div>
          <button
            onClick={toggleCost}
            aria-pressed={!showCost}
            aria-label={showCost ? 'Hide cost and profit' : 'Show cost and profit'}
            title={showCost ? 'Hide cost and profit' : 'Show cost and profit'}
            style={{ display: 'grid', placeItems: 'center', width: '26px', height: '26px', flexShrink: 0, border: 'none', background: 'transparent', color: color.muted, cursor: 'pointer', borderRadius: radius.sm }}
          >
            {showCost ? <Eye size={15} strokeWidth={1.9} /> : <EyeOff size={15} strokeWidth={1.9} />}
          </button>
        </div>

        <Button size="lg" onClick={onCharge} disabled={empty || charging} style={{ width: '100%', marginTop: '2px' }}>
          {charging ? 'Charging…' : `Charge ${formatPHP(totals.total)}`}
        </Button>
      </div>
    </div>
  )
}
