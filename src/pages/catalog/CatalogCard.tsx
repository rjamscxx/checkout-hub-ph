import type { Product } from '../../db'
import { Check, Plus } from 'lucide-react'
import { PhotoGallery } from '../../components/shared/PhotoGallery'
import { formatPHP } from '../../lib/utils'
import { color, card, numeric } from '../../lib/theme'

interface CatalogCardProps {
  product: Product
  mode: 'edit' | 'screenshot'
  /** Owner-side availability toggle. Omit for the customer-facing render. */
  onToggleAvailable?: () => void
}

export function CatalogCard({ product, mode, onToggleAvailable }: CatalogCardProps) {
  const available = product.availableToday
  const interactive = mode === 'edit' && !!onToggleAvailable

  return (
    // height:100% + column flex is what makes a row tidy: cards carrying a
    // description no longer stand taller than the ones without, so the price
    // and the toggle land on one baseline right across the row.
    <div style={{ ...card, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PhotoGallery photos={product.photos} fit="contain" aspectRatio="portrait" />

      <div style={{ padding: '11px 13px 12px', display: 'flex', flexDirection: 'column', gap: '3px', flex: 1, minHeight: 0 }}>
        <p style={{
          fontWeight: 600, color: color.ink, fontSize: '14px', margin: 0, lineHeight: 1.3,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {product.name}
        </p>

        {product.description && (
          <p style={{
            fontSize: '11.5px', color: color.muted, margin: 0, lineHeight: 1.4, whiteSpace: 'pre-line',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {product.description}
          </p>
        )}

        {/* marginTop:auto pins the price to the bottom of every card */}
        <span style={{ fontWeight: 700, color: color.accent, fontSize: '18px', marginTop: 'auto', paddingTop: '8px', lineHeight: 1.1, ...numeric }}>
          {formatPHP(product.sellPrice)}
        </span>
      </div>

      {/* The toggle lives inside the card, so one product reads as one object
          rather than a card with a detached button underneath it. It also
          replaces the old status pill, which said the same thing twice. */}
      {interactive ? (
        <button
          onClick={onToggleAvailable}
          aria-pressed={available}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            width: '100%', padding: '9px', flexShrink: 0,
            fontSize: '12px', fontWeight: 600, fontFamily: 'inherit',
            border: 'none', borderTop: `1px solid ${color.border}`, cursor: 'pointer',
            background: available ? color.greenDim : 'transparent',
            color: available ? color.green : color.muted,
            transition: 'background 0.15s ease-out, color 0.15s ease-out',
          }}
        >
          {available ? <Check size={14} strokeWidth={2.4} /> : <Plus size={14} strokeWidth={2.2} />}
          {available ? 'Available today' : 'Set available'}
        </button>
      ) : (
        !available && (
          <div style={{
            padding: '7px', textAlign: 'center', flexShrink: 0,
            fontSize: '11px', fontWeight: 600, color: color.muted,
            borderTop: `1px solid ${color.border}`,
          }}>
            Unavailable
          </div>
        )
      )}
    </div>
  )
}
