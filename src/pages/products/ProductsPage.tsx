import { useState } from 'react'
import { Package } from 'lucide-react'
import { useProducts } from '../../hooks/useProducts'
import { ProductListItem } from './ProductListItem'
import { ProductForm } from './ProductForm'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/shared/EmptyState'
import { Page, PageHeader } from '../../components/layout/Page'
import type { Product } from '../../db'

export function ProductsPage() {
  const products = useProducts()
  const [editing, setEditing] = useState<Product | null>(null)
  const [adding, setAdding] = useState(false)

  return (
    <Page>
      <PageHeader
        title="Products"
        action={<Button size="sm" onClick={() => setAdding(true)}>Add Product</Button>}
      />

      {!products?.length && (
        <EmptyState
          icon={Package}
          title="No products yet"
          message="Add your items with cost and sell price so profit tracking works from the first sale."
          action={{ label: 'Add Product', onClick: () => setAdding(true) }}
        />
      )}

      {products && products.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '10px', alignItems: 'start' }}>
          {products.map(p => (
            <ProductListItem key={p.id} product={p} onEdit={() => setEditing(p)} />
          ))}
        </div>
      )}

      <ProductForm open={adding} onClose={() => setAdding(false)} />
      {editing && (
        <ProductForm product={editing} open={true} onClose={() => setEditing(null)} />
      )}
    </Page>
  )
}
