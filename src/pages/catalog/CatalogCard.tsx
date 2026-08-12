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
    <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', border: '1px solid #E8E5DF', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <PhotoGallery photos={product.photos} />
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <p style={{ fontWeight: 600, color: '#1A1917', fontSize: '13px', margin: 0, lineHeight: 1.3, fontFamily: 'Inter, system-ui, sans-serif' }}>{product.name}</p>
        {product.description && (
          <p style={{ fontSize: '11px', color: '#6B6760', margin: 0, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {product.description}
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
          <span style={{ fontWeight: 700, color: '#E01C24', fontSize: '15px', fontFamily: 'Inter, system-ui, sans-serif' }}>{formatPHP(product.sellPrice)}</span>
          <span style={{
            fontSize: '10px', fontWeight: 600, padding: '2px 7px', borderRadius: '999px',
            background: available ? 'rgba(26,158,92,0.10)' : 'rgba(224,28,36,0.10)',
            color: available ? '#1A9E5C' : '#E01C24',
          }}>
            {available ? 'Available' : 'Unavail.'}
          </span>
        </div>
      </div>
    </div>
  )
}
