import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ImageOff, MessageCircle, Share2, FileText, ImageDown, X, Loader2 } from 'lucide-react'
import type { Product } from '../../db'
import { formatPHP } from '../../lib/utils'
import { color, font, numeric, shadow } from '../../lib/theme'
import { downloadJpegPages, downloadPdfPages, shareCatalogPages } from '../../lib/catalogExport'

interface ScreenshotModeProps {
  products: Product[]
  storeName: string
  tagline?: string
  orderContact?: string
  onExit: () => void
}

type Busy = 'jpeg' | 'pdf' | 'share' | null

/** Full-HD landscape, the size customers actually receive. */
const PAGE_W = 1920
const PAGE_H = 1080
/** Beyond this, products get too small to read at 1920px wide. */
const PER_PAGE = 8

type Entry = { p: Product; cat: string }

/**
 * Split a page's items into rows that each fill the full width, so a page is
 * never left with holes in its last row. Cards flex, so a 3-item row and a
 * 2-item row both run edge to edge.
 */
function rowsFor(n: number): number[] {
  if (n <= 4) return [n]
  return [Math.ceil(n / 2), Math.floor(n / 2)]
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

/**
 * Customer-facing storefront board — an elevated catalog in the store's own
 * brand, laid out as 1920x1080 landscape pages. What's on screen is exactly
 * what exports: the same nodes are captured, just scaled down to fit here.
 */
export function ScreenshotMode({ products, storeName, tagline, orderContact, onExit }: ScreenshotModeProps) {
  const pageRefs = useRef<(HTMLDivElement | null)[]>([])
  const [busy, setBusy] = useState<Busy>(null)
  const [scale, setScale] = useState(0.5)

  const now = new Date()
  const dateLong = now.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })
  const dateShort = now.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }).toUpperCase()
  const slug = (storeName || 'store').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'store'
  const fileBase = `${slug}-catalog-${now.toISOString().slice(0, 10)}`

  // Group only to order the run — the flyer itself flows continuously and tags
  // each card with its category, so a one-item category can't punch a hole in
  // the grid the way a per-category sub-grid did.
  const grouped = products.reduce<Record<string, Product[]>>((acc, p) => {
    const cat = p.category?.trim() || 'Uncategorized'
    ;(acc[cat] ??= []).push(p)
    return acc
  }, {})
  const categories = Object.keys(grouped).sort((a, b) =>
    a === 'Uncategorized' ? 1 : b === 'Uncategorized' ? -1 : a.localeCompare(b)
  )
  const ordered: Entry[] = categories.flatMap(cat => grouped[cat].map(p => ({ p, cat })))
  const pages = chunk(ordered, PER_PAGE)

  // Fit a full-HD page into whatever viewport is previewing it.
  useEffect(() => {
    const fit = () => setScale(Math.min(1, (window.innerWidth - 32) / PAGE_W))
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])

  async function run(kind: Busy, fn: (nodes: HTMLDivElement[]) => Promise<unknown>) {
    if (busy) return
    const nodes = pageRefs.current.slice(0, pages.length).filter((n): n is HTMLDivElement => !!n)
    if (!nodes.length) return
    setBusy(kind)
    try { await fn(nodes) }
    catch (e) { alert('Sorry, that export failed. Please try again.\n\n' + (e instanceof Error ? e.message : '')) }
    finally { setBusy(null) }
  }

  const doJpeg  = () => run('jpeg',  nodes => downloadJpegPages(nodes, fileBase))
  const doPdf   = () => run('pdf',   nodes => downloadPdfPages(nodes, `${fileBase}.pdf`))
  const doShare = () => run('share', nodes => shareCatalogPages(nodes, fileBase, storeName))

  return (
    <motion.div
      data-theme="light"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      style={{ position: 'fixed', inset: 0, zIndex: 100, background: color.bg, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '16px', paddingBottom: 'calc(96px + env(safe-area-inset-bottom, 0px))' }}>
        {pages.map((items, i) => (
          // Outer box reserves the scaled footprint; the scale sits on a middle
          // layer so the captured page node itself stays a clean, untransformed
          // 1920x1080.
          <div key={i} style={{ width: PAGE_W * scale, height: PAGE_H * scale, flexShrink: 0 }}>
            <div style={{ width: PAGE_W, height: PAGE_H, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
              <div ref={el => { pageRefs.current[i] = el }}>
                <FlyerPage
                  items={items}
                  storeName={storeName}
                  tagline={tagline}
                  orderContact={orderContact}
                  dateShort={dateShort}
                  dateLong={dateLong}
                  pageNo={i + 1}
                  pageCount={pages.length}
                  totalItems={products.length}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar — outside the captured pages */}
      <div style={{ position: 'fixed', left: 0, right: 0, bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))', display: 'flex', justifyContent: 'center', pointerEvents: 'none', zIndex: 110 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px', background: 'var(--color-glass)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: `1px solid ${color.border}`, borderRadius: '999px', boxShadow: shadow.lg, pointerEvents: 'auto' }}>
          <ToolBtn primary busy={busy === 'share'} disabled={!!busy} onClick={doShare} icon={Share2} label="Share" />
          <ToolBtn busy={busy === 'jpeg'} disabled={!!busy} onClick={doJpeg} icon={ImageDown} label={pages.length > 1 ? `JPEG ×${pages.length}` : 'JPEG'} />
          <ToolBtn busy={busy === 'pdf'} disabled={!!busy} onClick={doPdf} icon={FileText} label="PDF" />
          <button onClick={onExit} aria-label="Close catalog" style={{ display: 'grid', placeItems: 'center', width: '38px', height: '38px', borderRadius: '999px', border: 'none', background: 'transparent', color: color.muted, cursor: 'pointer', flexShrink: 0 }}>
            <X size={18} strokeWidth={2} />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function FlyerPage({ items, storeName, tagline, orderContact, dateShort, dateLong, pageNo, pageCount, totalItems }: {
  items: Entry[]; storeName: string; tagline?: string; orderContact?: string
  dateShort: string; dateLong: string; pageNo: number; pageCount: number; totalItems: number
}) {
  let cursor = 0
  const rows = rowsFor(items.length).map(n => items.slice(cursor, (cursor += n)))

  return (
    <div style={{
      width: PAGE_W, height: PAGE_H, boxSizing: 'border-box', padding: '44px 48px',
      background: color.bg, fontFamily: font, display: 'flex', flexDirection: 'column',
    }}>
      {/* Masthead — horizontal, to leave the height for products */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
          <img src="/logo-mark.png" alt="" style={{ height: '58px', width: 'auto', flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontSize: '38px', fontWeight: 800, color: color.ink, margin: 0, letterSpacing: '-0.025em', lineHeight: 1.05 }}>{storeName}</h1>
            {tagline && <p style={{ fontSize: '16px', color: color.muted, margin: '4px 0 0', lineHeight: 1.2 }}>{tagline}</p>}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.14em', color: color.muted, margin: 0 }}>CATALOG · {dateShort}</p>
          <p style={{ fontSize: '15px', color: color.muted, margin: '5px 0 0', ...numeric }}>
            {totalItems} item{totalItems !== 1 ? 's' : ''}{pageCount > 1 ? ` · Page ${pageNo} of ${pageCount}` : ''}
          </p>
        </div>
      </header>

      <div style={{ height: '1px', background: color.border, margin: '20px 0 22px', flexShrink: 0 }} />

      {/* Products — rows flex to fill the page edge to edge, no dead cells */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: '22px' }}>
        {rows.map((row, i) => (
          <div key={i} style={{ flex: 1, minHeight: 0, display: 'flex', gap: '22px' }}>
            {row.map(({ p, cat }) => <FlyerCard key={p.id} p={p} cat={cat} />)}
          </div>
        ))}
      </div>

      {/* Order CTA */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '22px', marginTop: '22px', padding: '16px 22px', borderRadius: '18px', background: color.accentDim, border: `1px solid ${color.border}`, flexShrink: 0 }}>
        <div style={{ display: 'grid', placeItems: 'center', width: '48px', height: '48px', borderRadius: '50%', background: color.accent, color: 'var(--color-surface)', flexShrink: 0 }}>
          <MessageCircle size={24} strokeWidth={2} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{ fontSize: '20px', fontWeight: 700, color: color.ink, margin: 0 }}>Message us to order</p>
          <p style={{ fontSize: '15px', color: color.muted, margin: '3px 0 0' }}>
            {orderContact
              ? <>Order via <span style={{ color: color.ink, fontWeight: 600 }}>{orderContact}</span></>
              : <>Send the item name and quantity — we'll confirm your total.</>}
          </p>
        </div>
        <p style={{ fontSize: '13px', color: color.muted, margin: 0, textAlign: 'right', flexShrink: 0, ...numeric }}>
          Prices as of {dateLong}<br />while supplies last
        </p>
      </div>
    </div>
  )
}

function FlyerCard({ p, cat }: { p: Product; cat: string }) {
  const photo = p.photos[0]
  return (
    <article style={{
      flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column',
      background: color.surface, borderRadius: '20px', overflow: 'hidden',
      border: `1px solid ${color.border}`, boxShadow: shadow.sm,
    }}>
      {/* The photo box is sized by flex, so its height is indefinite and a
          percentage height on the img won't resolve — it would render at its
          intrinsic size and spill over the text below. Pin it instead. */}
      <div style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden', background: color.surface2, display: 'grid', placeItems: 'center', color: color.border2 }}>
        {photo
          ? <img src={photo} alt={p.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          : <ImageOff size={44} strokeWidth={1.4} />}
      </div>
      {/* Fixed height so every card in a row has an identically sized photo,
          whether or not it carries a description. */}
      <div style={{ height: '152px', boxSizing: 'border-box', overflow: 'hidden', padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: '5px', flexShrink: 0 }}>
        {cat !== 'Uncategorized' && (
          <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: color.muted, lineHeight: 1 }}>{cat}</span>
        )}
        <p style={{ fontSize: '20px', fontWeight: 600, color: color.ink, margin: 0, lineHeight: 1.25, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.name}</p>
        {p.description && (
          <p style={{ fontSize: '14px', color: color.muted, margin: 0, lineHeight: 1.3, whiteSpace: 'pre-line', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.description}</p>
        )}
        <span style={{ fontSize: '28px', fontWeight: 800, color: color.accent, lineHeight: 1.15, marginTop: 'auto', paddingTop: '4px', ...numeric }}>{formatPHP(p.sellPrice)}</span>
      </div>
    </article>
  )
}

function ToolBtn({ icon: Icon, label, onClick, primary, busy, disabled }: {
  icon: typeof Share2; label: string; onClick: () => void; primary?: boolean; busy?: boolean; disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px', height: '38px', padding: '0 14px',
        borderRadius: '999px', border: primary ? 'none' : `1px solid ${color.border}`,
        background: primary ? color.accent : color.surface, color: primary ? 'var(--color-surface)' : color.ink,
        fontSize: '13px', fontWeight: 600, fontFamily: font, cursor: disabled ? 'default' : 'pointer',
        opacity: disabled && !busy ? 0.5 : 1, whiteSpace: 'nowrap',
      }}
    >
      {busy ? <Loader2 size={15} strokeWidth={2.2} className="animate-spin" /> : <Icon size={15} strokeWidth={1.9} />}
      {label}
    </button>
  )
}
