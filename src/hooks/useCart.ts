/**
 * The POS cart.
 *
 * The sale being punched and the sales parked for later are the same kind of
 * thing — rows in `db.carts` — so "park" is just a matter of pointing the POS
 * at a different row, and nothing is lost to a refresh or a closed tab. The
 * id of the row being worked on is the only thing kept outside the database.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Cart, type OrderItem, type Product } from '../db'
import { addLine, setLineQty, setLinePrice } from '../lib/sale'

const ACTIVE_KEY = 'ch_pos_active_cart'

function readActiveId(): number | null {
  try {
    const n = Number(localStorage.getItem(ACTIVE_KEY))
    return Number.isInteger(n) && n > 0 ? n : null
  } catch {
    return null
  }
}

function writeActiveId(id: number | null): void {
  try {
    if (id == null) localStorage.removeItem(ACTIVE_KEY)
    else localStorage.setItem(ACTIVE_KEY, String(id))
  } catch {
    /* private mode — the cart still lives in Dexie, it just won't be re-found */
  }
}

/** "Sale 3" — one past the highest number already in use. */
function nextLabel(carts: Cart[]): string {
  const highest = carts.reduce((max, c) => {
    const n = Number(/^Sale (\d+)$/.exec(c.label)?.[1])
    return Number.isInteger(n) && n > max ? n : max
  }, 0)
  return `Sale ${highest + 1}`
}

function blankCart(label: string): Cart {
  const now = new Date().toISOString()
  return { label, items: [], discount: 0, createdAt: now, updatedAt: now }
}

export interface UseCart {
  /** The sale being punched. Null only for the instant before the first one exists. */
  cart: Cart | null
  items: OrderItem[]
  discount: number
  /** Other sales set aside, most recently touched last. */
  parked: Cart[]
  addProduct: (product: Product) => void
  setQty: (productId: number, qty: number) => void
  setPrice: (productId: number, price: number) => void
  setDiscount: (amount: number) => void
  clear: () => void
  /** Set the current sale aside and start a fresh one. No-op on an empty cart. */
  park: () => void
  resume: (id: number) => void
  discard: (id: number) => void
  /** Drop the current cart after it has been charged, leaving a clean one. */
  finish: () => void
  /** Put a sale's contents back in the cart — undoing a mis-punched charge. */
  restore: (items: OrderItem[], discount: number) => void
}

export function useCart(): UseCart {
  const [activeId, setActiveId] = useState<number | null>(readActiveId)
  const carts = useLiveQuery(() => db.carts.orderBy('updatedAt').toArray())
  const creating = useRef(false)

  const active = carts?.find(c => c.id === activeId) ?? null
  const parked = (carts ?? []).filter(c => c.id !== activeId)

  const point = useCallback((id: number | null) => {
    writeActiveId(id)
    setActiveId(id)
  }, [])

  // Always leave exactly one cart to punch into. If the pointer is stale —
  // first run, cleared storage, a discarded row — adopt the most recently
  // touched sale rather than stranding it behind a brand new empty one.
  useEffect(() => {
    if (carts === undefined || active || creating.current) return
    if (carts.length) {
      point(carts[carts.length - 1].id!)
      return
    }
    creating.current = true
    db.carts
      .add(blankCart('Sale 1'))
      .then(id => point(Number(id)))
      .finally(() => { creating.current = false })
  }, [carts, active, point])

  // The mutations below must keep a stable identity: they are handed to the
  // memoized product grid, and a new `addProduct` on every cart change would
  // re-render a couple of hundred cards on every tap. So the id travels in a
  // ref, and the row is re-read inside the transaction rather than closed
  // over — which also stops a fast double-tap from losing an increment.
  const activeIdRef = useRef<number | null>(null)
  activeIdRef.current = active?.id ?? null

  const patch = useCallback(async (change: (cart: Cart) => Partial<Cart>) => {
    const id = activeIdRef.current
    if (id == null) return
    await db.transaction('rw', db.carts, async () => {
      const current = await db.carts.get(id)
      if (!current) return
      await db.carts.update(id, { ...change(current), updatedAt: new Date().toISOString() })
    })
  }, [])

  const addProduct = useCallback((product: Product) => {
    if (product.id == null) return
    const line: OrderItem = {
      productId: product.id,
      name: product.name,
      qty: 1,
      price: product.sellPrice,
      // Snapshot — a later change to the product's cost must not rewrite the
      // profit on a sale that already happened.
      cost: product.costPrice,
    }
    void patch(c => ({ items: addLine(c.items, line) }))
  }, [patch])

  const setQty = useCallback((productId: number, qty: number) => {
    void patch(c => ({ items: setLineQty(c.items, productId, qty) }))
  }, [patch])

  const setPrice = useCallback((productId: number, price: number) => {
    void patch(c => ({ items: setLinePrice(c.items, productId, price) }))
  }, [patch])

  const setDiscount = useCallback((amount: number) => {
    void patch(() => ({ discount: Number.isFinite(amount) && amount > 0 ? amount : 0 }))
  }, [patch])

  const clear = useCallback(() => {
    void patch(() => ({ items: [], discount: 0 }))
  }, [patch])

  const park = useCallback(() => {
    if (!active?.items.length) return // an empty cart is not worth a chip
    void db.carts.add(blankCart(nextLabel(carts ?? []))).then(id => point(Number(id)))
  }, [active, carts, point])

  const resume = useCallback((id: number) => {
    // Switching away from an untouched cart would leave a stray empty chip.
    const stale = active?.id != null && !active.items.length ? active.id : null
    point(id)
    if (stale != null) void db.carts.delete(stale)
  }, [active, point])

  /**
   * Retire the current cart and open an empty one.
   *
   * Deliberately explicit rather than deleting the row and letting the effect
   * above pick up the pieces: that rule adopts the most recent cart, which
   * after a sale would quietly drop you into a *parked* order instead of a
   * clean slate. `creating` holds the effect off until the new cart exists.
   */
  const startFresh = useCallback((retiring: number | null) => {
    creating.current = true
    void (async () => {
      try {
        if (retiring != null) await db.carts.delete(retiring)
        const remaining = await db.carts.toArray()
        const id = await db.carts.add(blankCart(nextLabel(remaining)))
        point(Number(id))
      } finally {
        creating.current = false
      }
    })()
  }, [point])

  const discard = useCallback((id: number) => {
    if (id === activeIdRef.current) startFresh(id)
    else void db.carts.delete(id)
  }, [startFresh])

  const finish = useCallback(() => {
    startFresh(activeIdRef.current)
  }, [startFresh])

  const restore = useCallback((items: OrderItem[], discount: number) => {
    void patch(() => ({ items, discount }))
  }, [patch])

  return {
    cart: active,
    items: active?.items ?? [],
    discount: active?.discount ?? 0,
    parked,
    addProduct, setQty, setPrice, setDiscount, clear, park, resume, discard, finish, restore,
  }
}
