import React from 'react'
import type { Product } from '../../db'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { formatPHP } from '../../lib/utils'
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
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#fff', borderRadius: '12px', border: '1px solid #E8E5DF' }}>
      {thumb
        ? <img src={thumb} alt="" style={{ width: '56px', height: '56px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
        : <div style={{ width: '56px', height: '56px', borderRadius: '8px', background: '#F5F4F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>📦</div>
      }
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 600, color: '#1A1917', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{product.name}</p>
        <p style={{ fontSize: '12px', color: '#6B6760', margin: '2px 0 0' }}>{product.category}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#E01C24' }}>{formatPHP(product.sellPrice)}</span>
          <span style={{ fontSize: '11px', color: '#6B6760' }}>cost {formatPHP(product.costPrice)}</span>
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
            {product.availableToday ? '✓ Today' : 'Set Today'}
          </Button>
        </div>
      </div>
    </div>
  )
}
