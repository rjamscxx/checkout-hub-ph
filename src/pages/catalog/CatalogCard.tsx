import type { Product } from '../../db'
import { PhotoGallery } from '../../components/shared/PhotoGallery'
import { formatPHP } from '../../lib/utils'

interface CatalogCardProps {
  product: Product
  mode: 'edit' | 'screenshot'
}

export function CatalogCard({ product, mode: _ }: CatalogCardProps) {
  const available = product.availableToday && product.stock > 0

  return (
    <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(230,227,220,0.6)', boxShadow: '0 1px 3px rgba(24,23,26,0.07), 0 1px 2px rgba(24,23,26,0.04)' }}>
      <PhotoGallery photos={product.photos} />
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <p style={{ fontWeight: 600, color: '#18171A', fontSize: '13px', margin: 0, lineHeight: 1.3, fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>{product.name}</p>
        {product.description && (
          <p style={{ fontSize: '11px', color: '#79767F', margin: 0, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {product.description}
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
          <span style={{ fontWeight: 700, color: '#D91A22', fontSize: '15px', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>{formatPHP(product.sellPrice)}</span>
          <span style={{
            fontSize: '10px', fontWeight: 600, padding: '2px 7px', borderRadius: '999px',
            background: available ? 'rgba(22,122,70,0.09)' : 'rgba(217,26,34,0.09)',
            color: available ? '#167A46' : '#D91A22',
          }}>
            {available ? 'Available' : 'Unavail.'}
          </span>
        </div>
      </div>
    </div>
  )
}
