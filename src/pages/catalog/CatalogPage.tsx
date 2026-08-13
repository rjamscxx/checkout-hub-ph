import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useLiveQuery } from 'dexie-react-hooks'
import { Camera, Check, Plus, Share2 } from 'lucide-react'
import { db, getSetting } from '../../db'
import { CatalogCard } from './CatalogCard'
import { ScreenshotMode } from './ScreenshotMode'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/shared/EmptyState'
import { Page, PageHeader } from '../../components/layout/Page'
import { toggleAvailableToday } from '../../hooks/useProducts'
import { color, numeric } from '../../lib/theme'

export function CatalogPage() {
  const [screenshotMode, setScreenshotMode] = useState(false)
  const allProducts = useLiveQuery(() => db.products.orderBy('name').toArray()) ?? []
  const storeName = useLiveQuery(() => getSetting('store_name', 'Checkout Hub')) ?? 'Checkout Hub'
  const tagline = useLiveQuery(() => getSetting('store_tagline', '')) ?? ''
  const orderContact = useLiveQuery(() => getSetting('order_contact', '')) ?? ''
  const availableProducts = allProducts.filter(p => p.availableToday && p.stock > 0)

  return (
    <>
      <Page>
        <PageHeader
          title="Today's Catalog"
          subtitle={
            <><span style={numeric}>{availableProducts.length}</span> of <span style={numeric}>{allProducts.length}</span> item{allProducts.length !== 1 ? 's' : ''} live today</>
          }
          action={
            <Button onClick={() => setScreenshotMode(true)} disabled={availableProducts.length === 0}>
              <Share2 size={15} strokeWidth={1.9} /> Share View
            </Button>
          }
        />

        {allProducts.length === 0 ? (
          <EmptyState
            icon={Camera}
            title="Your catalog is empty"
            message="Add products in the Products tab, mark them available, then share the view with customers."
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(168px, 1fr))', gap: '12px' }}>
            {allProducts.map(p => {
              const on = p.availableToday
              return (
                <div key={p.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <CatalogCard product={p} mode="edit" />
                  <button
                    onClick={() => p.id != null && toggleAvailableToday(p.id, p.availableToday)}
                    aria-pressed={on}
                    style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                      fontSize: '12px', fontWeight: 600, borderRadius: '8px', padding: '7px',
                      border: 'none', cursor: 'pointer', transition: 'background 0.15s, color 0.15s',
                      background: on ? color.greenDim : color.surface2,
                      color: on ? color.green : color.muted,
                    }}
                  >
                    {on ? <Check size={14} strokeWidth={2.4} /> : <Plus size={14} strokeWidth={2.2} />}
                    {on ? 'Available today' : 'Set available'}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </Page>

      <AnimatePresence>
        {screenshotMode && (
          <ScreenshotMode
            products={availableProducts}
            storeName={storeName}
            tagline={tagline}
            orderContact={orderContact}
            onExit={() => setScreenshotMode(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
