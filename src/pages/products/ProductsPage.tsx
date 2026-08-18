import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Package, Truck } from 'lucide-react'
import { useProducts } from '../../hooks/useProducts'
import { ProductListItem } from './ProductListItem'
import { ProductForm } from './ProductForm'
import { SupplierDrop } from './SupplierDrop'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/shared/EmptyState'
import { Page, PageHeader, ContentFrame } from '../../components/layout/Page'
import { color } from '../../lib/theme'
import type { Product } from '../../db'

export function ProductsPage() {
  const products = useProducts()
  const [editing, setEditing] = useState<Product | null>(null)
  const [adding, setAdding] = useState(false)
  const [dropping, setDropping] = useState(false)

  const grouped = (products ?? []).reduce<Record<string, Product[]>>((acc, p) => {
    const cat = p.category?.trim() || 'Uncategorized'
    ;(acc[cat] ??= []).push(p)
    return acc
  }, {})
  const categories = Object.keys(grouped).sort((a, b) =>
    a === 'Uncategorized' ? 1 : b === 'Uncategorized' ? -1 : a.localeCompare(b)
  )

  return (
    <>
    <Page>
      <PageHeader
        title="Products"
        action={
          <div style={{ display: 'flex', gap: '6px' }}>
            <Button size="sm" variant="outline" onClick={() => setDropping(true)}>
              <Truck size={13} strokeWidth={1.9} /> Supplier Drop
            </Button>
            <Button size="sm" onClick={() => setAdding(true)}>Add Product</Button>
          </div>
        }
      />

      <ContentFrame>
        {!products?.length && (
          <EmptyState
            icon={Package}
            title="No products yet"
            message="Add your items with cost and sell price so profit tracking works from the first sale."
            action={{ label: 'Add Product', onClick: () => setAdding(true) }}
          />
        )}

        {products && products.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {categories.map(cat => (
              <div key={cat}>
                <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: color.muted, textTransform: 'uppercase', marginBottom: '10px' }}>
                  {cat} <span style={{ fontWeight: 500 }}>({grouped[cat].length})</span>
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '10px', alignItems: 'start' }}>
                  {grouped[cat].map(p => (
                    <ProductListItem key={p.id} product={p} onEdit={() => setEditing(p)} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </ContentFrame>

      {adding && (
        <ProductForm open={true} onClose={() => setAdding(false)} />
      )}
      {editing && (
        <ProductForm product={editing} open={true} onClose={() => setEditing(null)} />
      )}
    </Page>

    <AnimatePresence>
      {dropping && <SupplierDrop onClose={() => setDropping(false)} />}
    </AnimatePresence>
    </>
  )
}
