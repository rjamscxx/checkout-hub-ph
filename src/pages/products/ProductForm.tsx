import React, { useState } from 'react'
import type { Product } from '../../db'
import { Dialog } from '../../components/ui/Dialog'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Button } from '../../components/ui/Button'
import { PhotoUploader } from '../../components/shared/PhotoUploader'
import { addProduct, updateProduct, useProducts } from '../../hooks/useProducts'

interface ProductFormProps {
  product?: Product
  open: boolean
  onClose: () => void
}

type FormState = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>

const EMPTY: FormState = {
  name: '', description: '', category: '', costPrice: 0, sellPrice: 0,
  stock: 0, availableToday: true, photos: [],
}

export function ProductForm({ product, open, onClose }: ProductFormProps) {
  const products = useProducts()
  const categories = Array.from(new Set((products ?? []).map(p => p.category?.trim()).filter(Boolean))).sort()

  const [form, setForm] = useState<FormState>(
    product
      ? { name: product.name, description: product.description, category: product.category,
          costPrice: product.costPrice, sellPrice: product.sellPrice, stock: product.stock,
          availableToday: product.availableToday, photos: [...product.photos],
          expiryDate: product.expiryDate }
      : { ...EMPTY }
  )

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm(prev => ({ ...prev, [k]: v }))
  }

  async function handleSave() {
    if (!form.name.trim()) return
    if (product?.id != null) {
      await updateProduct(product.id, form)
    } else {
      await addProduct(form)
    }
    onClose()
  }

  const fieldGap: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '12px' }
  const gridTwo: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }

  return (
    <Dialog open={open} onClose={onClose} title={product ? 'Edit Product' : 'Add Product'}>
      <div style={fieldGap}>
        <PhotoUploader photos={form.photos} onChange={p => set('photos', p)} />
        <Input label="Product Name *" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Shampoo Rejoice 140ml" />
        <Textarea label="Description" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Variant info, size, etc." />
        <Input label="Category" value={form.category} onChange={e => set('category', e.target.value)} placeholder="e.g. Personal Care" list="category-options" />
        <datalist id="category-options">
          {categories.map(cat => <option key={cat} value={cat} />)}
        </datalist>
        <Input label="Supplier" value={form.supplier ?? ''} onChange={e => set('supplier', e.target.value)} placeholder="e.g. Supplier A · Ate Nena" />
        <div style={gridTwo}>
          <Input label="Cost Price ₱" type="number" min="0" step="0.01" value={form.costPrice || ''} onChange={e => set('costPrice', Number(e.target.value) || 0)} />
          <Input label="Sell Price ₱" type="number" min="0" step="0.01" value={form.sellPrice || ''} onChange={e => set('sellPrice', Number(e.target.value) || 0)} />
        </div>
        <Input label="Stock Qty" type="number" min="0" value={form.stock || ''} onChange={e => set('stock', Number(e.target.value) || 0)} />
        <Input label="Expiry Date (optional)" type="date" value={form.expiryDate ?? ''} onChange={e => set('expiryDate', e.target.value || undefined)} />
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--color-ink)', cursor: 'pointer' }}>
          <input type="checkbox" checked={form.availableToday} onChange={e => set('availableToday', e.target.checked)}
            style={{ accentColor: 'var(--color-accent)', width: '16px', height: '16px' }} />
          Available Today
        </label>
        <div style={{ display: 'flex', gap: '8px', paddingTop: '8px' }}>
          <Button style={{ flex: 1 }} onClick={handleSave} disabled={!form.name.trim()}>
            {product ? 'Save Changes' : 'Add Product'}
          </Button>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </Dialog>
  )
}
