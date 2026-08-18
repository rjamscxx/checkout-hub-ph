import type { Product } from '../../db'
import { PhotoGallery } from '../../components/shared/PhotoGallery'
import { formatPHP } from '../../lib/utils'
import { color, card, numeric } from '../../lib/theme'

interface CatalogCardProps {
  product: Product
  mode: 'edit' | 'screenshot'
}

export function CatalogCard({ product, mode: _ }: CatalogCardProps) {
  const available = product.availableToday

  return (
    <div style={{ ...card, overflow: 'hidden' }}>
      <PhotoGallery photos={product.photos} />
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <p style={{ fontWeight: 600, color: color.ink, fontSize: '13px', margin: 0, lineHeight: 1.3 }}>{product.name}</p>
        {product.description && (
          <p style={{ fontSize: '11px', color: color.muted, margin: 0, lineHeight: 1.4, whiteSpace: 'pre-line', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {product.description}
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
          <span style={{ fontWeight: 700, color: color.accent, fontSize: '15px', ...numeric }}>{formatPHP(product.sellPrice)}</span>
          <span style={{
            fontSize: '10px', fontWeight: 600, padding: '2px 7px', borderRadius: '999px',
            background: available ? color.greenDim : color.accentDim,
            color: available ? color.green : color.accent,
          }}>
            {available ? 'Available' : 'Unavail.'}
          </span>
        </div>
      </div>
    </div>
  )
}
