import React from 'react'
import { Package } from 'lucide-react'
import type { Product } from '../../db'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { formatPHP } from '../../lib/utils'
import { color } from '../../lib/theme'
import { deleteProduct, toggleAvailableToday } from '../../hooks/useProducts'

interface ProductListItemProps {
  product: Product
  onEdit: () => void
}

export function ProductListItem({ product, onEdit }: ProductListItemProps) {
  const thumb = product.photos[0]
  const stockVariant = product.stock === 0 ? 'red' : product.stock < 5 ? 'gold' : 'green'
  const stockLabel = product.stock === 0 ? 'Out of stock' : `${product.stock} left`

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)', boxShadow: '0 1px 3px rgba(var(--shadow-tint),0.07), 0 1px 2px rgba(var(--shadow-tint),0.04)' }}>
      {thumb
        ? <img src={thumb} alt="" style={{ width: '56px', height: '56px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
        : <div style={{ width: '56px', height: '56px', borderRadius: '8px', background: color.surface2, display: 'grid', placeItems: 'center', color: color.muted, flexShrink: 0 }}><Package size={22} strokeWidth={1.6} /></div>
      }
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 600, color: 'var(--color-ink)', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{product.name}</p>
        <p style={{ fontSize: '12px', color: 'var(--color-muted)', margin: '2px 0 0' }}>{product.category}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-accent)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>{formatPHP(product.sellPrice)}</span>
          <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>cost {formatPHP(product.costPrice)}</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
        <Badge variant={stockVariant}>{stockLabel}</Badge>
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
