import React, { useState } from 'react'
import { useProducts } from '../../hooks/useProducts'
import { ProductListItem } from './ProductListItem'
import { ProductForm } from './ProductForm'
import { Button } from '../../components/ui/Button'
import type { Product } from '../../db'

export function ProductsPage() {
  const products = useProducts()
  const [editing, setEditing] = useState<Product | null>(null)
  const [adding, setAdding] = useState(false)

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontWeight: 700, color: '#1A1917', fontSize: '22px', margin: 0, fontFamily: 'Inter, system-ui, sans-serif' }}>Products</h1>
        <Button size="sm" onClick={() => setAdding(true)}>+ Add Product</Button>
      </div>

      {!products?.length && (
        <div style={{ textAlign: 'center', color: '#6B6760', fontSize: '14px', padding: '64px 16px', fontFamily: 'Inter, system-ui, sans-serif' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📦</div>
          No products yet. Tap + Add Product to get started.
        </div>
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
