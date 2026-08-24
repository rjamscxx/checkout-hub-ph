/**
 * One product in the catalog list.
 *
 * The card carries exactly one piece of brand red — the price. Availability
 * used to be a filled accent button, which put a second red on every card and
 * turned a hundred-product catalog into a wall of it, all shouting louder
 * than the money. It is a state, not a call to action, so it reads as a quiet
 * green mark instead — the same treatment the catalog card already uses.
 */
import { Check, Copy, Package, Pencil } from 'lucide-react'
import type { Product } from '../../db'
import { formatPHP } from '../../lib/utils'
import { color, card, numeric, radius, space, clamp2 } from '../../lib/theme'
import { toggleAvailableToday } from '../../hooks/useProducts'

interface ProductListItemProps {
  product: Product
  onEdit: () => void
  /** This name appears more than once in the catalog. */
  duplicate?: boolean
}

const THUMB = 60

export function ProductListItem({ product, onEdit, duplicate = false }: ProductListItemProps) {
  const thumb = product.photos[0]
  const available = product.availableToday

  return (
    <div style={{
      ...card,
      display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%',
      ...(duplicate ? { borderColor: color.gold } : null),
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: space[3], padding: space[3], flex: 1, minWidth: 0 }}>
        {/* Fixed square frame with the image positioned inside it, so a tall
            supplier photo cannot stretch the row. */}
        <div style={{
          position: 'relative', width: THUMB, height: THUMB, flexShrink: 0,
          borderRadius: radius.sm + 1, overflow: 'hidden', background: color.surface2,
        }}>
          {thumb ? (
            <img src={thumb} alt="" loading="lazy" decoding="async"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: color.border2 }}>
              <Package size={22} strokeWidth={1.6} />
            </div>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Own row — an inline badge would squeeze the name to an ellipsis. */}
          {duplicate && (
            <span
              title="Another product has this same name"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '3px',
                background: color.goldDim, color: color.gold,
                fontSize: '10px', fontWeight: 700, letterSpacing: '0.04em',
                textTransform: 'uppercase', padding: '2px 6px', borderRadius: '5px',
                marginBottom: '3px',
              }}
            >
              <Copy size={10} strokeWidth={2.2} aria-hidden="true" /> Duplicate
            </span>
          )}

          <p style={{ fontWeight: 600, color: color.ink, fontSize: '14px', lineHeight: 1.3, margin: 0, ...clamp2 }}>
            {product.name}
          </p>

          {(product.category || product.supplier) && (
            <p style={{ fontSize: '11.5px', color: color.muted, margin: '3px 0 0', lineHeight: 1.3, ...clamp2 }}>
              {[product.category, product.supplier].filter(Boolean).join(' · ')}
            </p>
          )}

          <div style={{ display: 'flex', alignItems: 'baseline', gap: space[2], marginTop: '5px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '15px', fontWeight: 700, color: color.accent, ...numeric }}>
              {formatPHP(product.sellPrice)}
            </span>
            <span style={{ fontSize: '11px', color: color.muted, ...numeric }}>
              cost {formatPHP(product.costPrice)}
            </span>
          </div>
        </div>
      </div>

      {/* A deliberate action row rather than buttons that happen to wrap. */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: space[2],
        padding: `${space[2]}px ${space[3]}px`, borderTop: `1px solid ${color.border}`,
        background: color.surface2,
      }}>
        <button
          onClick={() => product.id != null && toggleAvailableToday(product.id, available)}
          aria-pressed={available}
          title={available ? 'Showing on the catalog today' : 'Not on the catalog today'}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            padding: '4px 9px 4px 7px', borderRadius: '999px', cursor: 'pointer',
            fontFamily: 'inherit', fontSize: '11.5px', fontWeight: 600,
            color: available ? color.green : color.muted,
            background: available ? color.greenDim : 'transparent',
            border: `1px solid ${available ? 'transparent' : color.border2}`,
          }}
        >
          <Check size={12} strokeWidth={available ? 2.6 : 2} aria-hidden="true" style={{ opacity: available ? 1 : 0.45 }} />
          {available ? 'Available today' : 'Not today'}
        </button>

        <button
          onClick={onEdit}
          aria-label={`Edit ${product.name}`}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            padding: '4px 9px', borderRadius: radius.sm, cursor: 'pointer',
            fontFamily: 'inherit', fontSize: '11.5px', fontWeight: 600,
            color: color.ink2, background: 'transparent', border: `1px solid ${color.border}`,
          }}
        >
          <Pencil size={12} strokeWidth={2} aria-hidden="true" />
          Edit
        </button>
      </div>
    </div>
  )
}
