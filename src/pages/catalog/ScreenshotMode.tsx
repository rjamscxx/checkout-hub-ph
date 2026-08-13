import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ImageOff, MessageCircle, Share2, FileText, ImageDown, X, Loader2 } from 'lucide-react'
import type { Product } from '../../db'
import { formatPHP } from '../../lib/utils'
import { color, font, numeric, shadow } from '../../lib/theme'
import { downloadJpeg, downloadPdf, shareCatalog } from '../../lib/catalogExport'

interface ScreenshotModeProps {
  products: Product[]
  storeName: string
  tagline?: string
  orderContact?: string
  onExit: () => void
}

type Busy = 'jpeg' | 'pdf' | 'share' | null

/**
 * Customer-facing storefront board — an elevated catalog in the store's own
 * brand. Shareable via the native share sheet and downloadable as JPEG or PDF.
 * The board node is captured for export; the toolbar sits outside it.
 */
export function ScreenshotMode({ products, storeName, tagline, orderContact, onExit }: ScreenshotModeProps) {
  const boardRef = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState<Busy>(null)

  const now = new Date()
  const dateLong = now.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })
  const dateShort = now.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }).toUpperCase()
  const slug = (storeName || 'store').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'store'
  const fileBase = `${slug}-catalog-${now.toISOString().slice(0, 10)}`

  async function run(kind: Busy, fn: () => Promise<unknown>) {
    if (busy) return
    setBusy(kind)
    try { await fn() }
    catch (e) { alert('Sorry, that export failed. Please try again.\n\n' + (e instanceof Error ? e.message : '')) }
    finally { setBusy(null) }
  }

  const doJpeg  = () => run('jpeg',  () => downloadJpeg(boardRef.current!, `${fileBase}.jpg`))
  const doPdf   = () => run('pdf',   () => downloadPdf(boardRef.current!, `${fileBase}.pdf`))
  const doShare = () => run('share', () => shareCatalog(boardRef.current!, `${fileBase}.jpg`, storeName))

  return (
    <motion.div
      data-theme="light"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      style={{ position: 'fixed', inset: 0, zIndex: 100, background: color.bg, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}
    >
      <div style={{ paddingBottom: 'calc(96px + env(safe-area-inset-bottom, 0px))' }}>
        {/* Captured board */}
        <div ref={boardRef} style={{ maxWidth: '560px', margin: '0 auto', background: color.bg, padding: '32px 18px 26px' }}>
          {/* Masthead */}
          <header style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '9px', textAlign: 'center' }}>
            <img src="/logo-mark.png" alt="" style={{ height: '48px', width: 'auto' }} />
            <div>
              <h1 style={{ fontSize: '26px', fontWeight: 800, color: color.ink, margin: 0, fontFamily: font, letterSpacing: '-0.025em', lineHeight: 1.05, textWrap: 'balance' }}>{storeName}</h1>
              {tagline && <p style={{ fontSize: '13px', color: color.muted, margin: '4px 0 0', fontFamily: font, textWrap: 'pretty' }}>{tagline}</p>}
            </div>
          </header>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '18px 0 16px' }}>
            <span style={{ flex: 1, height: '1px', background: color.border }} />
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.14em', color: color.muted, fontFamily: font, whiteSpace: 'nowrap' }}>
              CATALOG · {dateShort} · <span style={numeric}>{products.length}</span> ITEM{products.length !== 1 ? 'S' : ''}
            </span>
            <span style={{ flex: 1, height: '1px', background: color.border }} />
          </div>

          {/* Product grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '13px' }}>
            {products.map(p => {
              const photo = p.photos[0]
              return (
                <article key={p.id} style={{ background: color.surface, borderRadius: '16px', overflow: 'hidden', border: `1px solid ${color.border}`, boxShadow: shadow.sm }}>
                  <div style={{ aspectRatio: '1 / 1', background: color.surface2, display: 'grid', placeItems: 'center', color: color.border2 }}>
                    {photo
                      ? <img src={photo} alt={p.name} crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <ImageOff size={26} strokeWidth={1.5} />}
                  </div>
                  <div style={{ padding: '11px 12px 13px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: color.ink, margin: 0, lineHeight: 1.3, fontFamily: font, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.name}</p>
                    <span style={{ fontSize: '17px', fontWeight: 800, color: color.accent, fontFamily: font, ...numeric }}>{formatPHP(p.sellPrice)}</span>
                  </div>
                </article>
              )
            })}
          </div>

          {/* Order CTA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '18px', padding: '15px 16px', borderRadius: '15px', background: color.accentDim, border: `1px solid ${color.border}` }}>
            <div style={{ display: 'grid', placeItems: 'center', width: '40px', height: '40px', borderRadius: '50%', background: color.accent, color: 'var(--color-surface)', flexShrink: 0 }}>
              <MessageCircle size={20} strokeWidth={2} />
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: '14px', fontWeight: 700, color: color.ink, margin: 0, fontFamily: font }}>Message us to order</p>
              <p style={{ fontSize: '12px', color: color.muted, margin: '2px 0 0', fontFamily: font, textWrap: 'pretty' }}>
                {orderContact
                  ? <>Order via <span style={{ color: color.ink, fontWeight: 600 }}>{orderContact}</span></>
                  : <>Send the item name and quantity — we'll confirm your total.</>}
              </p>
            </div>
          </div>

          <p style={{ textAlign: 'center', fontSize: '11px', color: color.muted, margin: '16px 0 0', fontFamily: font, ...numeric }}>Prices as of {dateLong} · while supplies last</p>
        </div>
      </div>

      {/* Toolbar — outside the captured board */}
      <div style={{ position: 'fixed', left: 0, right: 0, bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))', display: 'flex', justifyContent: 'center', pointerEvents: 'none', zIndex: 110 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px', background: 'var(--color-glass)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: `1px solid ${color.border}`, borderRadius: '999px', boxShadow: shadow.lg, pointerEvents: 'auto' }}>
          <ToolBtn primary busy={busy === 'share'} disabled={!!busy} onClick={doShare} icon={Share2} label="Share" />
          <ToolBtn busy={busy === 'jpeg'} disabled={!!busy} onClick={doJpeg} icon={ImageDown} label="JPEG" />
          <ToolBtn busy={busy === 'pdf'} disabled={!!busy} onClick={doPdf} icon={FileText} label="PDF" />
          <button onClick={onExit} aria-label="Close catalog" style={{ display: 'grid', placeItems: 'center', width: '38px', height: '38px', borderRadius: '999px', border: 'none', background: 'transparent', color: color.muted, cursor: 'pointer', flexShrink: 0 }}>
            <X size={18} strokeWidth={2} />
          </button>
        </div>
      </div>
    </motion.div>
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
