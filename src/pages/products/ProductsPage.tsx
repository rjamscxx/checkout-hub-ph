import { useMemo, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Inbox, Package, SearchX, Truck } from 'lucide-react'
import { useProducts } from '../../hooks/useProducts'
import { ProductListItem } from './ProductListItem'
import { ProductForm } from './ProductForm'
import { SupplierDrop } from './SupplierDrop'
import { SupplierImport } from './SupplierImport'
import { DuplicateAlert } from './DuplicateAlert'
import { Button } from '../../components/ui/Button'
import { SearchInput } from '../../components/ui/SearchInput'
import { EmptyState } from '../../components/shared/EmptyState'
import { Page, PageHeader, ContentFrame } from '../../components/layout/Page'
import { searchProducts, findDuplicateGroups, duplicateIds } from '../../lib/catalog'
import { color } from '../../lib/theme'
import type { Product } from '../../db'

export function ProductsPage() {
  const products = useProducts()
  const [editing, setEditing] = useState<Product | null>(null)
  const [adding, setAdding] = useState(false)
  const [dropping, setDropping] = useState(false)
  const [importing, setImporting] = useState(false)
  const [query, setQuery] = useState('')
  const [reviewingDupes, setReviewingDupes] = useState(false)

  const all = useMemo(() => products ?? [], [products])
  const dupeGroups = useMemo(() => findDuplicateGroups(all), [all])
  const dupeIds = useMemo(() => duplicateIds(dupeGroups), [dupeGroups])

  // Search first, then narrow to duplicates — so you can search *within* a review.
  const visible = useMemo(() => {
    const found = searchProducts(all, query)
    return reviewingDupes ? found.filter(p => p.id != null && dupeIds.has(p.id)) : found
  }, [all, query, reviewingDupes, dupeIds])

  const grouped = visible.reduce<Record<string, Product[]>>((acc, p) => {
    const cat = p.category?.trim() || 'Uncategorized'
    ;(acc[cat] ??= []).push(p)
    return acc
  }, {})
  const categories = Object.keys(grouped).sort((a, b) =>
    a === 'Uncategorized' ? 1 : b === 'Uncategorized' ? -1 : a.localeCompare(b)
  )

  const filtering = query.trim().length > 0 || reviewingDupes

  function clearFilters() {
    setQuery('')
    setReviewingDupes(false)
  }

  return (
    <>
    <Page>
      <PageHeader
        title="Products"
        subtitle={
          all.length > 0
            ? filtering
              ? `${visible.length} of ${all.length} ${all.length === 1 ? 'item' : 'items'}`
              : `${all.length} ${all.length === 1 ? 'item' : 'items'}`
            : undefined
        }
        action={
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <Button size="sm" variant="outline" onClick={() => setImporting(true)}>
              <Inbox size={13} strokeWidth={1.9} /> Import Chat
            </Button>
            <Button size="sm" variant="outline" onClick={() => setDropping(true)}>
              <Truck size={13} strokeWidth={1.9} /> Supplier Drop
            </Button>
            <Button size="sm" onClick={() => setAdding(true)}>Add Product</Button>
          </div>
        }
      />

      {all.length > 0 && (
        <DuplicateAlert
          groups={dupeGroups}
          reviewing={reviewingDupes}
          onToggleReview={() => setReviewingDupes(v => !v)}
        />
      )}

      <ContentFrame>
        {all.length > 0 && (
          <SearchInput
            label="Search products"
            placeholder="Search by name, category or supplier…"
            value={query}
            onChange={setQuery}
          />
        )}

        {!all.length && (
          <EmptyState
            icon={Package}
            title="No products yet"
            message="Add your items with cost and sell price so profit tracking works from the first sale."
            action={{ label: 'Add Product', onClick: () => setAdding(true) }}
          />
        )}

        {all.length > 0 && visible.length === 0 && (
          <EmptyState
            icon={SearchX}
            title="No items match"
            message={
              reviewingDupes && query.trim()
                ? 'Nothing in the duplicates matches that search.'
                : 'Try a shorter search — part of a name, a category, or a supplier.'
            }
            action={{ label: 'Clear filters', onClick: clearFilters }}
          />
        )}

        {visible.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {categories.map(cat => (
              <div key={cat}>
                <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: color.muted, textTransform: 'uppercase', marginBottom: '10px' }}>
                  {cat} <span style={{ fontWeight: 500 }}>({grouped[cat].length})</span>
                </p>
                {/* stretch, not start: cards in a row then share a height and
                    their action rows land on one line */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(258px, 1fr))', gap: '10px', alignItems: 'stretch' }}>
                  {grouped[cat].map(p => (
                    <ProductListItem
                      key={p.id}
                      product={p}
                      duplicate={p.id != null && dupeIds.has(p.id)}
                      onEdit={() => setEditing(p)}
                    />
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
      {importing && <SupplierImport onClose={() => setImporting(false)} />}
    </AnimatePresence>
    </>
  )
}
