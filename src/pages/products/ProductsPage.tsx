import React, { useState } from 'react'
import { Package } from 'lucide-react'
import { useProducts } from '../../hooks/useProducts'
import { ProductListItem } from './ProductListItem'
import { ProductForm } from './ProductForm'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/shared/EmptyState'
import { color, font } from '../../lib/theme'
import type { Product } from '../../db'

export function ProductsPage() {
  const products = useProducts()
  const [editing, setEditing] = useState<Product | null>(null)
  const [adding, setAdding] = useState(false)

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontWeight: 700, color: color.ink, fontSize: '20px', margin: 0, fontFamily: font, letterSpacing: '-0.02em' }}>Products</h1>
        <Button size="sm" onClick={() => setAdding(true)}>Add Product</Button>
      </div>

      {!products?.length && (
        <EmptyState
          icon={Package}
          title="No products yet"
          message="Add your items with cost and sell price so profit tracking works from the first sale."
          action={{ label: 'Add Product', onClick: () => setAdding(true) }}
        />
      )}

      {products?.map(p => (
        <ProductListItem key={p.id} product={p} onEdit={() => setEditing(p)} />
      ))}

      <ProductForm open={adding} onClose={() => setAdding(false)} />
      {editing && (
        <ProductForm product={editing} open={true} onClose={() => setEditing(null)} />
      )}
    </div>
  )
}
