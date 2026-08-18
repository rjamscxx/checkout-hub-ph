import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useLiveQuery } from 'dexie-react-hooks'
import { Camera, Check, ClipboardCopy, Plus, Share2 } from 'lucide-react'
import { db, getSetting } from '../../db'
import { CatalogCard } from './CatalogCard'
import { ScreenshotMode } from './ScreenshotMode'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/shared/EmptyState'
import { Page, PageHeader, ContentFrame } from '../../components/layout/Page'
import { toggleAvailableToday } from '../../hooks/useProducts'
import { color, numeric } from '../../lib/theme'
import { formatPHP } from '../../lib/utils'

function buildPricelist(storeName: string, tagline: string, orderContact: string, categories: string[], grouped: Record<string, { name: string; sellPrice: number }[]>): string {
  const date = new Date().toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })
  const lines: string[] = []
  lines.push(`📦 ${storeName}`)
  if (tagline) lines.push(tagline)
  lines.push(`✅ Available Today — ${date}`)
  lines.push('')
  for (const cat of categories) {
    if (categories.length > 1 || cat !== 'Uncategorized') lines.push(`${cat}:`)
    for (const p of grouped[cat]) {
      lines.push(`• ${p.name} — ${formatPHP(p.sellPrice)}`)
    }
    lines.push('')
  }
  lines.push('📩 Message us to order!')
  if (orderContact) lines.push(orderContact)
  return lines.join('\n').trim()
}

export function CatalogPage() {
  const [screenshotMode, setScreenshotMode] = useState(false)
  const [copied, setCopied] = useState(false)

  async function copyPricelist() {
    const text = buildPricelist(storeName, tagline, orderContact, categories.filter(c => grouped[c]?.length), grouped)
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  const allProducts = useLiveQuery(() => db.products.orderBy('name').toArray()) ?? []
  const storeName = useLiveQuery(() => getSetting('store_name', 'Checkout Hub')) ?? 'Checkout Hub'
  const tagline = useLiveQuery(() => getSetting('store_tagline', '')) ?? ''
  const orderContact = useLiveQuery(() => getSetting('order_contact', '')) ?? ''
  const availableProducts = allProducts.filter(p => p.availableToday)

  const grouped = allProducts.reduce<Record<string, typeof allProducts>>((acc, p) => {
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
          title="Today's Catalog"
          subtitle={
            <><span style={numeric}>{availableProducts.length}</span> of <span style={numeric}>{allProducts.length}</span> item{allProducts.length !== 1 ? 's' : ''} live today</>
          }
          action={
            <div style={{ display: 'flex', gap: '6px' }}>
              <Button variant="outline" onClick={copyPricelist} disabled={availableProducts.length === 0}>
                {copied ? <Check size={14} strokeWidth={2.4} /> : <ClipboardCopy size={14} strokeWidth={1.9} />}
                {copied ? 'Copied!' : 'Copy Text'}
              </Button>
              <Button onClick={() => setScreenshotMode(true)} disabled={availableProducts.length === 0}>
                <Share2 size={15} strokeWidth={1.9} /> Share View
              </Button>
            </div>
          }
        />

        <ContentFrame>
          {allProducts.length === 0 ? (
            <EmptyState
              icon={Camera}
              title="Your catalog is empty"
              message="Add products in the Products tab, mark them available, then share the view with customers."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {categories.map(cat => (
                <div key={cat}>
                  <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: color.muted, textTransform: 'uppercase', marginBottom: '10px' }}>
                    {cat}
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(168px, 1fr))', gap: '12px' }}>
                    {grouped[cat].map(p => {
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
                              background: on ? color.greenDim : color.surface,
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
                </div>
              ))}
            </div>
          )}
        </ContentFrame>
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
