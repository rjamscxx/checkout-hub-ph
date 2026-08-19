import { Copy, Package } from 'lucide-react'
import type { Product } from '../../db'
import { Button } from '../../components/ui/Button'
import { formatPHP } from '../../lib/utils'
import { color, card, numeric } from '../../lib/theme'
import { toggleAvailableToday } from '../../hooks/useProducts'

interface ProductListItemProps {
  product: Product
  onEdit: () => void
  /** This name appears more than once in the catalog. */
  duplicate?: boolean
}

export function ProductListItem({ product, onEdit, duplicate = false }: ProductListItemProps) {
  const thumb = product.photos[0]

  return (
    <div style={{
      ...card,
      display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
      ...(duplicate ? { borderColor: color.gold } : null),
    }}>
      {thumb
        ? <img src={thumb} alt="" style={{ width: '56px', height: '56px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
        : <div style={{ width: '56px', height: '56px', borderRadius: '8px', background: color.surface2, display: 'grid', placeItems: 'center', color: color.muted, flexShrink: 0 }}><Package size={22} strokeWidth={1.6} /></div>
      }
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Own row — the name column is narrow, and an inline badge would
            squeeze it down to an ellipsis. */}
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
        <p style={{ fontWeight: 600, color: color.ink, fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{product.name}</p>
        <p style={{ fontSize: '12px', color: color.muted, margin: '2px 0 0' }}>
          {[product.category, product.supplier].filter(Boolean).join(' · ')}
        </p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
          <span style={{ fontSize: '14px', fontWeight: 700, color: color.accent, ...numeric }}>{formatPHP(product.sellPrice)}</span>
          <span style={{ fontSize: '11px', color: color.muted, ...numeric }}>cost {formatPHP(product.costPrice)}</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          <Button size="sm" variant="ghost" onClick={onEdit}>Edit</Button>
          <Button
            size="sm"
            variant={product.availableToday ? 'primary' : 'outline'}
            onClick={() => product.id != null && toggleAvailableToday(product.id, product.availableToday)}
          >
            {product.availableToday ? 'Available today' : 'Set available'}
          </Button>
        </div>
      </div>
    </div>
  )
}
