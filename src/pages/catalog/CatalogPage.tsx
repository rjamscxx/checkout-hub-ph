import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db'
import { CatalogCard } from './CatalogCard'
import { ScreenshotMode } from './ScreenshotMode'
import { Button } from '../../components/ui/Button'
import { toggleAvailableToday } from '../../hooks/useProducts'

export function CatalogPage() {
  const [screenshotMode, setScreenshotMode] = useState(false)
  const allProducts = useLiveQuery(() => db.products.orderBy('name').toArray()) ?? []
  const availableProducts = allProducts.filter(p => p.availableToday && p.stock > 0)

  return (
    <>
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
          <div>
            <h1 style={{ fontWeight: 700, color: '#1A1917', fontSize: '22px', margin: 0, fontFamily: 'Inter, system-ui, sans-serif' }}>Today's Catalog</h1>
            <p style={{ fontSize: '13px', color: '#6B6760', margin: '2px 0 0', fontFamily: 'Inter, system-ui, sans-serif' }}>
              {availableProducts.length} item{availableProducts.length !== 1 ? 's' : ''} available
            </p>
          </div>
          <Button onClick={() => setScreenshotMode(true)} disabled={availableProducts.length === 0}>
            📸 Share View
          </Button>
        </div>

        {allProducts.length === 0 && (
          <div style={{ textAlign: 'center', color: '#6B6760', fontSize: '14px', padding: '64px 16px', fontFamily: 'Inter, system-ui, sans-serif' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📸</div>
            No products yet. Go to Products tab to add items.
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {allProducts.map(p => (
            <div key={p.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <CatalogCard product={p} mode="edit" />
              <button
                onClick={() => p.id != null && toggleAvailableToday(p.id, p.availableToday)}
                style={{
                  fontSize: '12px', fontWeight: 600, borderRadius: '8px', padding: '6px',
                  border: 'none', cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'Inter, system-ui, sans-serif',
                  background: p.availableToday ? 'rgba(26,158,92,0.10)' : '#F5F4F0',
                  color: p.availableToday ? '#1A9E5C' : '#6B6760',
                }}
              >
                {p.availableToday ? '✓ Available Today' : '+ Set Available'}
              </button>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {screenshotMode && (
          <ScreenshotMode
            products={availableProducts}
            storeName="Checkout Hub"
            onExit={() => setScreenshotMode(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
