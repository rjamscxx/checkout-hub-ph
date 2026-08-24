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
import { color, card, numeric, space } from '../../lib/theme'

const ALL = 'All'

interface PosGridProps {
  products: Product[]
  onAdd: (product: Product) => void
  /** True until the catalog query has answered. */
  loading?: boolean
}

/* ---- stock badge -------------------------------------------------------- */

function stockLabel(stock: number): { text: string; tone: string; bg: string } {
  if (stock > 5) return { text: `${stock} left`, tone: color.muted, bg: color.surface2 }
  if (stock > 0) return { text: `${stock} left`, tone: color.gold, bg: color.goldDim }
  if (stock === 0) return { text: 'None left', tone: color.muted, bg: color.surface2 }
  // Negative is not an error — it is what you owe the shelf after selling
  // goods that were never counted in.
  return { text: `${stock} owed`, tone: color.accent, bg: color.accentDim }
}

/* ---- card --------------------------------------------------------------- */

const PosCard = memo(function PosCard({ product, onAdd }: { product: Product; onAdd: (p: Product) => void }) {
  const photo = product.photos[0]
  const badge = stockLabel(product.stock ?? 0)

  return (
    <button
      className="pos-card"
      onClick={() => onAdd(product)}
      style={{
        ...card, overflow: 'hidden', padding: 0, textAlign: 'left', cursor: 'pointer',
        display: 'flex', flexDirection: 'column', height: '100%', fontFamily: 'inherit',
      }}
    >
      <div style={{ position: 'relative', aspectRatio: '1 / 1', background: color.surface2, display: 'grid', placeItems: 'center' }}>
        {photo
          ? <img src={photo} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          : <ImageOff size={24} strokeWidth={1.5} color={color.border2} />}
        <span style={{
          position: 'absolute', top: '6px', right: '6px', padding: '2px 7px',
          borderRadius: '999px', fontSize: '10.5px', fontWeight: 700,
          color: badge.tone, background: badge.bg, ...numeric,
        }}>
          {badge.text}
        </span>
      </div>

      <div style={{ padding: '9px 10px 10px', display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, minWidth: 0 }}>
        <span style={{
          fontSize: '12.5px', fontWeight: 600, color: color.ink, lineHeight: 1.3,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {product.name}
        </span>
        <span style={{ fontSize: '15px', fontWeight: 700, color: color.accent, marginTop: 'auto', paddingTop: '6px', ...numeric }}>
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
