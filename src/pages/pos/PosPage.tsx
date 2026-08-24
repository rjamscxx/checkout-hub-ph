/**
 * The POS — punch a sale, see what you keep, charge it.
 *
 * Two panes on a desktop so the grid and the money sit side by side; on a
 * phone the cart folds down to a bar you can tap open, because a product grid
 * and a cart cannot both be useful in one column.
 */
import { useCallback, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Receipt, RotateCcw, ShoppingCart, X } from 'lucide-react'
import { db, type Order, type Product } from '../../db'
import { useCart } from '../../hooks/useCart'
import { addPaidSale, deleteOrder, useMarginFloor } from '../../hooks/useOrders'
import { saleTotals } from '../../lib/sale'
import { Page, PageHeader } from '../../components/layout/Page'
import { Sheet } from '../../components/ui/Sheet'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { formatPHP } from '../../lib/utils'
import { color, card, numeric, radius, space, shadow } from '../../lib/theme'
import { PosGrid } from './PosGrid'
import { PosCart } from './PosCart'
import { printSaleReceipt } from './Receipt'

/** How long the "sold" bar sticks around before it gets out of the way. */
const CONFIRM_MS = 12000

/**
 * One shared empty list for the moment before the query resolves. A fresh
 * `[]` on every render is a new prop identity, which defeats the grid's memo
 * and re-renders every card for nothing.
 */
const NO_PRODUCTS: Product[] = []

export function PosPage() {
  const products = useLiveQuery(() => db.products.orderBy('name').toArray()) ?? NO_PRODUCTS
  const floor = useMarginFloor()
  const cart = useCart()

  const [charging, setCharging] = useState(false)
  const [error, setError] = useState('')
  const [sold, setSold] = useState<Order | null>(null)
  const [drawer, setDrawer] = useState(false)
  const isDesktop = useMediaQuery('(min-width: 900px)')

  const totals = saleTotals(cart.items, cart.discount)

  const charge = useCallback(async () => {
    if (!cart.items.length || charging) return
    setCharging(true)
    setError('')
    try {
      const order = await addPaidSale({ items: cart.items, discount: cart.discount })
      cart.finish()
      setDrawer(false)
      setSold(order)
      window.setTimeout(() => setSold(current => (current?.id === order.id ? null : current)), CONFIRM_MS)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That sale did not save. Nothing was charged.')
    } finally {
      setCharging(false)
    }
  }, [cart, charging])

  /** Void the sale just made and hand its contents back to the cart to re-punch. */
  const undo = useCallback(async () => {
    if (!sold?.id) return
    const { items, discount = 0 } = sold
    setSold(null)
    await deleteOrder(sold.id)
    cart.restore(items, discount)
  }, [sold, cart])

  return (
    <Page>
      <PageHeader
        title="POS"
        subtitle={products.length ? `${products.length} products · tap to add` : 'No products yet'}
      />

      {sold && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: space[3], flexWrap: 'wrap',
          background: color.greenDim, border: `1px solid ${color.green}33`,
          borderRadius: radius.lg - 2, padding: `${space[3]}px ${space[4]}px`,
        }}>
          <CheckCircle2 size={18} strokeWidth={2} color={color.green} />
          <span style={{ fontSize: '13px', color: color.ink, fontWeight: 600 }}>
            Sold {formatPHP(sold.total)} · {sold.ref}
          </span>
          <div style={{ flex: 1 }} />
          <BarAction icon={Receipt} label="Receipt" onClick={() => { void printSaleReceipt(sold) }} />
          <BarAction icon={RotateCcw} label="Undo" onClick={() => { void undo() }} />
          <BarAction icon={X} label="Dismiss" onClick={() => setSold(null)} iconOnly />
        </div>
      )}

      {error && (
        <p style={{ margin: 0, fontSize: '13px', color: color.accent, background: color.accentDim, padding: `${space[2]}px ${space[3]}px`, borderRadius: radius.sm + 1 }}>
          {error}
        </p>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: space[4], minWidth: 0 }}>
        <div style={{ flex: 1, minWidth: 0, paddingBottom: isDesktop ? 0 : '76px' }}>
          <PosGrid products={products} onAdd={cart.addProduct} />
        </div>

        {isDesktop && (
          <aside style={{
            ...card, width: '340px', flexShrink: 0, padding: space[4],
            position: 'sticky', top: space[4], maxHeight: 'calc(100dvh - 56px)',
            display: 'flex', flexDirection: 'column',
          }}>
            <PosCart cart={cart} floor={floor} charging={charging} onCharge={charge} />
          </aside>
        )}
      </div>

      {/* Phone: the cart lives behind a bar rather than below a few hundred cards. */}
      {!isDesktop && (
        <>
          <AnimatePresence>
            {totals.itemCount > 0 && !drawer && (
              <motion.button
                initial={{ y: 70 }} animate={{ y: 0 }} exit={{ y: 70 }}
                transition={{ type: 'tween', duration: 0.18, ease: 'easeOut' }}
                onClick={() => setDrawer(true)}
                style={{
                  position: 'fixed', left: '12px', right: '12px', zIndex: 30,
                  bottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
                  display: 'flex', alignItems: 'center', gap: space[2],
                  height: '52px', padding: `0 ${space[4]}px`, borderRadius: radius.lg,
                  border: 'none', cursor: 'pointer', boxShadow: shadow.lg,
                  background: color.accent, color: color.onAccent,
                  fontFamily: 'inherit', fontSize: '14px', fontWeight: 700,
                }}
              >
                <ShoppingCart size={18} strokeWidth={2.2} />
                {totals.itemCount} item{totals.itemCount === 1 ? '' : 's'}
                <span style={{ flex: 1 }} />
                <span style={{ fontSize: '16px', fontWeight: 800, ...numeric }}>{formatPHP(totals.total)}</span>
              </motion.button>
            )}
          </AnimatePresence>

          <Sheet open={drawer} onClose={() => setDrawer(false)}>
            {/* Sized to content up to a cap, so a one-line sale doesn't open a
                half-empty screen while a long one still scrolls internally. */}
            <div style={{ padding: `0 ${space[4]}px ${space[4]}px`, maxHeight: '68dvh', display: 'flex', flexDirection: 'column' }}>
              <PosCart cart={cart} floor={floor} charging={charging} onCharge={charge} />
            </div>
          </Sheet>
        </>
      )}
    </Page>
  )
}

function BarAction({
  icon: Icon, label, onClick, iconOnly = false,
}: { icon: typeof Receipt; label: string; onClick: () => void; iconOnly?: boolean }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '5px',
        padding: iconOnly ? '5px' : '5px 10px', borderRadius: radius.sm + 1,
        border: `1px solid ${color.border}`, background: color.surface,
        color: color.ink2, cursor: 'pointer', fontFamily: 'inherit',
        fontSize: '12.5px', fontWeight: 600,
      }}
    >
      <Icon size={14} strokeWidth={2} />
      {!iconOnly && label}
    </button>
  )
}
