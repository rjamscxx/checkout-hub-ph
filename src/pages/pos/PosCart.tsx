/**
 * The cart panel — what's being sold, what it's worth, and what you keep.
 *
 * The cost and profit line is the point of the whole screen, so it sits with
 * the total rather than behind a tap. It can still be blanked with the eye
 * when there's a customer on the other side of the counter, the same rule
 * that keeps wholesale figures off the catalog flyer.
 *
 * Two things here are load-bearing and easy to undo by accident. The header
 * states the unit count in words, and the list fades at whichever edge it
 * continues past, because a total that does not match the lines you can see
 * reads as a bug in the arithmetic. And every figure in the money footer
 * shares one right edge, including the discount you can type into, so the
 * column can be read down.
 */
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Eye, EyeOff, Minus, Plus, ShoppingCart, Trash2, PauseCircle, X } from 'lucide-react'
import { getSetting, setSetting, type OrderItem } from '../../db'
import type { UseCart } from '../../hooks/useCart'
import { saleTotals, profitTone } from '../../lib/sale'
import { Button } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'
import { formatPHP } from '../../lib/utils'
import { color, numeric, radius, space } from '../../lib/theme'

const HIDDEN = '•••'

/** Height every inline control in a row shares, so rows line up. */
const CONTROL = 28

/* ---- cost visibility ---------------------------------------------------- */

function useShowCost(): [boolean, () => void] {
  const raw = useLiveQuery(() => getSetting('pos_show_cost', '1'), [], '1') ?? '1'
  const show = raw !== '0'
  return [show, () => { void setSetting('pos_show_cost', show ? '0' : '1') }]
}

/* ---- confirm ------------------------------------------------------------ */

/** Losing a punched sale to a mis-tap is worth one question first. */
function Confirm({
  open, title, body, confirmLabel, onConfirm, onCancel,
}: {
  open: boolean; title: string; body: string; confirmLabel: string
  onConfirm: () => void; onCancel: () => void
}) {
  return (
    <Dialog open={open} onClose={onCancel} title={title} maxWidth={380}>
      <p style={{ margin: `0 0 ${space[4]}px`, fontSize: '13.5px', color: color.ink2, lineHeight: 1.5, textWrap: 'pretty' }}>
        {body}
      </p>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: space[2] }}>
        <Button variant="outline" onClick={onCancel}>Keep it</Button>
        <Button variant="danger" onClick={() => { onConfirm(); onCancel() }}>{confirmLabel}</Button>
      </div>
    </Dialog>
  )
}

/* ---- money field -------------------------------------------------------- */

/**
 * A number you can type over.
 *
 * The draft only exists while the field is focused, so there is no state to
 * keep in step with the prop and no effect doing the syncing — not editing
 * means the stored value is what renders. A half-typed "1" therefore never
 * reprices the line at one peso, and anything unparseable is simply dropped
 * on blur.
 */
function MoneyInput({
  value, onCommit, label, width = 68,
}: { value: number; onCommit: (n: number) => void; label: string; width?: number }) {
  const [draft, setDraft] = useState<string | null>(null)

  function commit() {
    const typed = draft
    setDraft(null)
    if (typed === null) return
    const n = Number(typed)
    if (typed.trim() !== '' && Number.isFinite(n) && n >= 0 && n !== value) onCommit(n)
  }

  return (
    <input
      aria-label={label}
      inputMode="decimal"
      value={draft ?? String(value)}
      onFocus={e => { setDraft(String(value)); e.target.select() }}
      onChange={e => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={e => {
        if (e.key === 'Enter') e.currentTarget.blur()
        if (e.key === 'Escape') { setDraft(null); e.currentTarget.blur() }
      }}
      style={{
        width, height: CONTROL, boxSizing: 'border-box',
        padding: `0 ${space[2]}px`, textAlign: 'right',
        background: color.surface2, border: `1px solid ${color.border}`,
        borderRadius: radius.sm - 1, color: color.ink,
        fontSize: '13px', fontWeight: 600, fontFamily: 'inherit',
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
        display: 'grid', placeItems: 'center', width: CONTROL, height: CONTROL, flexShrink: 0,
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
    <div style={{ padding: `${space[3]}px 0`, borderBottom: `1px solid ${color.border}` }}>
      {/* name and line total share a baseline, whether the name runs to one line or two */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: space[3] }}>
        <p style={{
          margin: 0, fontSize: '13px', fontWeight: 600, color: color.ink, lineHeight: 1.35, minWidth: 0,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {item.name}
        </p>
        <span style={{ fontSize: '13.5px', fontWeight: 700, color: color.ink, flexShrink: 0, ...numeric }}>
          {formatPHP(item.price * item.qty)}
        </span>
      </div>

      {/* one fixed-height control row, so every line has the same rhythm */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: space[3], height: CONTROL, marginTop: space[2] }}>
        <label style={{
          display: 'inline-flex', alignItems: 'center', gap: '5px',
          fontSize: '11.5px', color: color.muted, cursor: 'text',
        }}>
          <MoneyInput value={item.price} onCommit={n => onPrice(item.productId, n)} label={`Unit price for ${item.name}`} />
          each
        </label>

        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
          <QtyButton label={`One less ${item.name}`} onClick={() => onQty(item.productId, item.qty - 1)}>
            <Minus size={13} strokeWidth={2.4} />
          </QtyButton>
          <span style={{ minWidth: '22px', textAlign: 'center', fontSize: '13px', fontWeight: 700, color: color.ink, ...numeric }}>
            {item.qty}
          </span>
          <QtyButton label={`One more ${item.name}`} onClick={() => onQty(item.productId, item.qty + 1)}>
            <Plus size={13} strokeWidth={2.4} />
          </QtyButton>
        </div>
      </div>
    </div>
  )
}

/* ---- money footer ------------------------------------------------------- */

/**
 * Values sit in a box with the same metrics as the discount input — same
 * padding, same transparent border — so every figure in the column, typed or
 * not, shares one right edge.
 */
const VALUE_BOX: CSSProperties = {
  padding: `0 ${space[2]}px`,
  border: '1px solid transparent',
  textAlign: 'right',
  ...numeric,
}

function MoneyRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: space[2], minHeight: CONTROL }}>
      <span style={{ fontSize: strong ? '13px' : '12.5px', fontWeight: strong ? 700 : 400, color: strong ? color.ink : color.muted }}>
        {label}
      </span>
      <span style={{
        ...VALUE_BOX,
        fontSize: strong ? '20px' : '13px',
        fontWeight: strong ? 800 : 600,
        color: strong ? color.accent : color.ink2,
      }}>
        {value}
      </span>
    </div>
  )
}

/* ---- the panel ---------------------------------------------------------- */

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
  const [clearing, setClearing] = useState(false)
  const [discarding, setDiscarding] = useState<{ id: number; label: string } | null>(null)

  const totals = saleTotals(items, discount)
  const empty = !items.length
  const tone = profitTone(totals, floor)
  // Nothing punched yet is not a loss — red on a zero reads as an alarm.
  const toneColor = empty ? color.muted : TONE_COLOR[tone]

  // Fade whichever edge the list continues past. A total that does not match
  // the lines on screen looks like broken arithmetic, so the panel has to say
  // out loud that there is more.
  const listRef = useRef<HTMLDivElement>(null)
  const [edge, setEdge] = useState({ top: false, bottom: false })

  function measureEdges() {
    const el = listRef.current
    if (!el) return
    const scrollable = el.scrollHeight > el.clientHeight + 1
    setEdge({
      top: scrollable && el.scrollTop > 1,
      bottom: scrollable && el.scrollTop + el.clientHeight < el.scrollHeight - 1,
    })
  }

  useEffect(measureEdges, [items.length, parked.length])

  const fade = [
    `transparent 0`,
    `#000 ${edge.top ? '18px' : '0px'}`,
    `#000 calc(100% - ${edge.bottom ? '22px' : '0px'})`,
    `transparent 100%`,
  ].join(', ')
  const mask = edge.top || edge.bottom ? `linear-gradient(to bottom, ${fade})` : undefined

  return (
    <div className="pos-cart" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* head */}
      <div style={{ display: 'flex', alignItems: 'center', gap: space[2], paddingBottom: space[3], borderBottom: `1px solid ${color.border}`, flexShrink: 0 }}>
        <ShoppingCart size={17} strokeWidth={2} color={color.accent} />
        <span style={{ fontSize: '14px', fontWeight: 700, color: color.ink }}>Sale</span>
        <span style={{ fontSize: '12.5px', color: color.muted, ...numeric }}>
          {totals.itemCount === 0 ? 'empty' : `${totals.itemCount} item${totals.itemCount === 1 ? '' : 's'}`}
        </span>
        <div style={{ flex: 1 }} />
        {!empty && (
          <>
            <button
              onClick={cart.park}
              title="Set this sale aside"
              aria-label="Park this sale"
              style={{ display: 'grid', placeItems: 'center', width: CONTROL, height: CONTROL, border: 'none', background: 'transparent', color: color.muted, cursor: 'pointer', borderRadius: radius.sm }}
            >
              <PauseCircle size={16} strokeWidth={1.9} />
            </button>
            <button
              onClick={() => setClearing(true)}
              title="Clear this sale"
              aria-label="Clear this sale"
              style={{ display: 'grid', placeItems: 'center', width: CONTROL, height: CONTROL, border: 'none', background: 'transparent', color: color.muted, cursor: 'pointer', borderRadius: radius.sm }}
            >
              <Trash2 size={15} strokeWidth={1.9} />
            </button>
          </>
        )}
      </div>

      {/* parked sales */}
      {parked.length > 0 && (
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', paddingTop: space[3], flexShrink: 0 }}>
          {parked.map(p => (
            <span
              key={p.id}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '2px', padding: '2px 3px 2px 9px',
                borderRadius: '999px', background: color.surface2, border: `1px solid ${color.border}`,
              }}
            >
              <button
                onClick={() => cart.resume(p.id!)}
                title={`Resume ${p.label}`}
                style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', color: color.ink2, fontWeight: 600, fontFamily: 'inherit', fontSize: '11.5px' }}
              >
                {p.label}
                <span style={{ color: color.muted, fontWeight: 500, ...numeric }}> · {p.items.reduce((s, i) => s + i.qty, 0)}</span>
              </button>
              <button
                onClick={() => setDiscarding({ id: p.id!, label: p.label })}
                aria-label={`Discard ${p.label}`}
                style={{ display: 'grid', placeItems: 'center', width: '18px', height: '18px', border: 'none', background: 'none', color: color.muted, cursor: 'pointer', borderRadius: '999px' }}
              >
                <X size={11} strokeWidth={2.4} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* lines */}
      <div
        ref={listRef}
        onScroll={measureEdges}
        style={{
          flex: 1, overflowY: 'auto', minHeight: 0, paddingRight: '2px',
          maskImage: mask, WebkitMaskImage: mask,
        }}
      >
        {empty ? (
          <div style={{ height: '100%', display: 'grid', placeItems: 'center', padding: `${space[6]}px ${space[3]}px` }}>
            <p style={{ fontSize: '12.5px', color: color.muted, textAlign: 'center', margin: 0, textWrap: 'pretty' }}>
              Tap a product to start a sale.
            </p>
          </div>
        ) : (
          items.map(i => <CartRow key={i.productId} item={i} onQty={cart.setQty} onPrice={cart.setPrice} />)
        )}
      </div>

      {/* money */}
      <div style={{ paddingTop: space[3], display: 'flex', flexDirection: 'column', gap: '2px', flexShrink: 0 }}>
        <MoneyRow label="Subtotal" value={formatPHP(totals.subtotal)} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: space[2], minHeight: CONTROL }}>
          <span style={{ fontSize: '12.5px', color: color.muted }}>Discount</span>
          <MoneyInput value={discount} onCommit={cart.setDiscount} label="Discount in pesos" width={86} />
        </div>

        <div style={{ paddingTop: space[2], marginTop: '2px', borderTop: `1px solid ${color.border}` }}>
          <MoneyRow label="Total" value={formatPHP(totals.total)} strong />
        </div>

        {/* the number you actually came for */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: space[2], marginTop: space[2],
            background: color.surface2, border: `1px solid ${color.border}`,
            borderRadius: radius.sm + 1, padding: `6px 6px 6px ${space[3]}px`, minHeight: CONTROL + 12,
          }}
        >
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexWrap: 'wrap', gap: '2px 12px', fontSize: '12px' }}>
            <span style={{ color: color.muted }}>
              Cost <b style={{ color: color.ink2, fontWeight: 700, ...numeric }}>{showCost ? formatPHP(totals.cost) : HIDDEN}</b>
            </span>
            <span style={{ color: color.muted }}>
              {totals.profit < 0 ? 'Loss ' : 'Profit '}
              <b style={{ color: toneColor, fontWeight: 700, ...numeric }}>{showCost ? formatPHP(totals.profit) : HIDDEN}</b>
              {showCost && !empty && (
                <span style={{ color: toneColor, ...numeric }}>
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
            style={{ display: 'grid', placeItems: 'center', width: CONTROL, height: CONTROL, flexShrink: 0, border: 'none', background: 'transparent', color: color.muted, cursor: 'pointer', borderRadius: radius.sm }}
          >
            {showCost ? <Eye size={15} strokeWidth={1.9} /> : <EyeOff size={15} strokeWidth={1.9} />}
          </button>
        </div>

        <Button size="lg" onClick={onCharge} disabled={empty || charging} style={{ width: '100%', marginTop: space[2] }}>
          {charging ? 'Charging…' : `Charge ${formatPHP(totals.total)}`}
        </Button>
      </div>

      <Confirm
        open={clearing}
        title="Clear this sale?"
        body={`${totals.itemCount} item${totals.itemCount === 1 ? '' : 's'} worth ${formatPHP(totals.total)} will be taken off. Nothing has been charged, so no money or stock moves.`}
        confirmLabel="Clear it"
        onConfirm={cart.clear}
        onCancel={() => setClearing(false)}
      />

      <Confirm
        open={discarding !== null}
        title={`Discard ${discarding?.label ?? 'this sale'}?`}
        body="This parked sale will be thrown away. Nothing has been charged, so no money or stock moves."
        confirmLabel="Discard it"
        onConfirm={() => discarding && cart.discard(discarding.id)}
        onCancel={() => setDiscarding(null)}
      />
    </div>
  )
}
