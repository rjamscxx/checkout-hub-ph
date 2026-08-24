/**
 * The punch grid — everything sellable, one tap away.
 *
 * Deliberately knows nothing about the cart. With a couple of hundred
 * products, re-rendering this on every quantity tap or keystroke in the
 * discount field is the difference between a POS that keeps up with you and
 * one that doesn't, so the cart state stops at the boundary and this
 * component is memoized against it.
 */
import { memo, useMemo, useState } from 'react'
import { ImageOff, PackageSearch } from 'lucide-react'
import type { Product } from '../../db'
import { searchProducts } from '../../lib/catalog'
import { SearchInput } from '../../components/ui/SearchInput'
import { EmptyState } from '../../components/shared/EmptyState'
import { formatPHP } from '../../lib/utils'
import { color, card, numeric, space, shadow, clamp2 } from '../../lib/theme'

const ALL = 'All'

interface PosGridProps {
  products: Product[]
  onAdd: (product: Product) => void
  /** True until the catalog query has answered. */
  loading?: boolean
}

/* ---- stock badge -------------------------------------------------------- */

/** Below this, a count is worth interrupting you about. */
const LOW = 5

interface Badge { text: string; fg: string }

/**
 * What the tile should say about stock, or nothing at all.
 *
 * Zero is deliberately silent. Products import at zero and this POS sells
 * regardless, so zero means "never counted", not "sold out" — stamping
 * "None left" on all 102 tiles was both noise and a lie. A healthy count is
 * silent too: no news is good news, and the exact figure lives in Inventory.
 * That leaves the two states worth a glance — what is nearly gone, and what
 * has been sold past what you had.
 */
function stockBadge(stock: number): Badge | null {
  if (stock < 0) return { text: `${Math.abs(stock)} owed`, fg: color.accent }
  if (stock > 0 && stock <= LOW) return { text: `${stock} left`, fg: color.gold }
  return null
}

/* ---- card --------------------------------------------------------------- */

const PosCard = memo(function PosCard({ product, onAdd }: { product: Product; onAdd: (p: Product) => void }) {
  const photo = product.photos[0]
  const badge = stockBadge(product.stock ?? 0)

  return (
    <button
      className="pos-card"
      onClick={() => onAdd(product)}
      style={{
        ...card, overflow: 'hidden', padding: 0, textAlign: 'left', cursor: 'pointer',
        display: 'flex', flexDirection: 'column', fontFamily: 'inherit',
      }}
    >
      {/*
        The image is positioned, not in flow. Left in flow it reports its own
        intrinsic height, which overrides `aspect-ratio` and lets every tile
        take the shape of whatever photo the supplier happened to send — rows
        of different-height frames with the names floating at different
        depths. Out of flow, the square frame always wins.
      */}
      <div style={{ position: 'relative', aspectRatio: '1 / 1', background: color.surface2, overflow: 'hidden', flexShrink: 0 }}>
        {photo ? (
          <img
            src={photo}
            alt=""
            loading="lazy"
            decoding="async"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: color.border2 }}>
            <ImageOff size={24} strokeWidth={1.5} />
          </div>
        )}

        {badge && (
          <span
            style={{
              position: 'absolute', top: '6px', right: '6px',
              padding: '2px 7px', borderRadius: '999px',
              fontSize: '10.5px', fontWeight: 700, lineHeight: 1.5,
              color: badge.fg,
              // Solid, not a tint: these sit on top of a photograph, and a
              // translucent chip is unreadable over half of them.
              background: color.surface,
              border: `1px solid ${badge.fg}`,
              boxShadow: shadow.xs,
              ...numeric,
            }}
          >
            {badge.text}
          </span>
        )}
      </div>

      {/*
        Two lines are reserved for the name whether it needs them or not, so
        every tile is the same height and the prices line up across the row
        without a pocket of dead space above them.
      */}
      <div style={{ padding: '9px 10px 10px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
        <span style={{ fontSize: '12.5px', fontWeight: 600, color: color.ink, lineHeight: 1.3, minHeight: '2.6em', ...clamp2 }}>
          {product.name}
        </span>
        <span style={{ fontSize: '15px', fontWeight: 700, color: color.accent, ...numeric }}>
          {formatPHP(product.sellPrice)}
        </span>
      </div>
    </button>
  )
})

/* ---- skeleton ----------------------------------------------------------- */

/**
 * Structural placeholders while the catalog loads. Without them an empty
 * array reads as "no products yet" and the real empty state flashes on every
 * visit before the data lands.
 */
function GridSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(136px, 1fr))', gap: space[2] }} aria-hidden="true">
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} style={{ ...card, overflow: 'hidden' }}>
          <div style={{ aspectRatio: '1 / 1', background: color.surface2 }} />
          <div style={{ padding: '9px 10px 10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ height: '9px', width: '82%', borderRadius: '3px', background: color.surface2 }} />
            <div style={{ height: '9px', width: '46%', borderRadius: '3px', background: color.surface2 }} />
          </div>
        </div>
      ))}
    </div>
  )
}

/* ---- grid --------------------------------------------------------------- */

export const PosGrid = memo(function PosGrid({ products, onAdd, loading = false }: PosGridProps) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState(ALL)

  const categories = useMemo(() => {
    const counts = new Map<string, number>()
    for (const p of products) {
      const c = p.category?.trim()
      if (c) counts.set(c, (counts.get(c) ?? 0) + 1)
    }
    return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [products])

  const shown = useMemo(() => {
    const byCategory = category === ALL ? products : products.filter(p => p.category?.trim() === category)
    return searchProducts(byCategory, query)
  }, [products, category, query])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: space[3], minWidth: 0 }}>
      <div style={{ maxWidth: '340px' }}>
        <SearchInput value={query} onChange={setQuery} label="Search products to sell" placeholder="Search products…" />
      </div>

      {categories.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
          {[[ALL, products.length] as const, ...categories].map(([name, count]) => {
            const on = category === name
            return (
              <button
                key={name}
                onClick={() => setCategory(name)}
                aria-pressed={on}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px', flexShrink: 0,
                  padding: '6px 11px', borderRadius: '999px', cursor: 'pointer',
                  fontSize: '12.5px', fontWeight: on ? 700 : 500, fontFamily: 'inherit',
                  color: on ? color.onAccent : color.ink2,
                  background: on ? color.accent : color.surface,
                  border: `1px solid ${on ? color.accent : color.border}`,
                }}
              >
                {name}
                <span style={{ fontSize: '11px', opacity: 0.7, ...numeric }}>{count}</span>
              </button>
            )
          })}
        </div>
      )}

      {loading ? (
        <GridSkeleton />
      ) : shown.length ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(136px, 1fr))', gap: space[2] }}>
          {shown.map(p => <PosCard key={p.id} product={p} onAdd={onAdd} />)}
        </div>
      ) : (
        <EmptyState
          icon={PackageSearch}
          title={query ? `Nothing matches “${query}”` : 'No products here yet'}
          message={query ? 'Try fewer words, or clear the search.' : 'Add products in the Products tab and they show up here.'}
          action={query ? { label: 'Clear search', onClick: () => setQuery('') } : undefined}
        />
      )}
    </div>
  )
})
