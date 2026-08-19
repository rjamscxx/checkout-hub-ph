import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useLiveQuery } from 'dexie-react-hooks'
import { Camera, Check, ClipboardCopy, Share2 } from 'lucide-react'
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

/** Stable DOM id for a category section, so the jump bar can scroll to it. */
const catId = (cat: string) => `cat-${cat.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`

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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              {/* Jump bar — 86 items across a dozen categories is a lot of
                  scrolling otherwise. Sticky so it stays reachable mid-browse. */}
              {categories.length > 1 && (
                <nav
                  aria-label="Jump to category"
                  style={{
                    position: 'sticky', top: 0, zIndex: 2, display: 'flex', flexWrap: 'wrap', gap: '6px',
                    padding: '10px 0', background: color.bg,
                    borderBottom: `1px solid ${color.border}`, marginBottom: '-8px',
                  }}
                >
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => document.getElementById(catId(cat))?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        fontSize: '12px', fontWeight: 600, fontFamily: 'inherit',
                        padding: '5px 11px', borderRadius: '999px', cursor: 'pointer',
                        border: `1px solid ${color.border}`, background: color.surface, color: color.ink,
                        transition: 'border-color 0.15s ease-out, color 0.15s ease-out',
                      }}
                    >
                      {cat}
                      <span style={{ color: color.muted, fontWeight: 500, ...numeric }}>{grouped[cat].length}</span>
                    </button>
                  ))}
                </nav>
              )}

              {categories.map(cat => (
                <div key={cat} id={catId(cat)} style={{ scrollMarginTop: '58px' }}>
                  {/* Category header: name, count, then a rule to the edge so
                      each group reads as its own shelf rather than a caption. */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '13px' }}>
                    <p style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', color: color.ink, textTransform: 'uppercase', margin: 0, flexShrink: 0 }}>
                      {cat}
                    </p>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: color.muted, flexShrink: 0, ...numeric }}>
                      {grouped[cat].length}
                    </span>
                    <div style={{ flex: 1, height: '1px', background: color.border, minWidth: '12px' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(224px, 1fr))', gap: '14px', alignItems: 'stretch' }}>
                    {grouped[cat].map(p => (
                      <CatalogCard
                        key={p.id}
                        product={p}
                        mode="edit"
                        onToggleAvailable={() => p.id != null && toggleAvailableToday(p.id, p.availableToday)}
                      />
                    ))}
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
