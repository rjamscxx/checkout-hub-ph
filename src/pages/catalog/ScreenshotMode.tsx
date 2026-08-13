import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { ImageOff, MessageCircle } from 'lucide-react'
import type { Product } from '../../db'
import { formatPHP } from '../../lib/utils'
import { color, font, numeric, shadow } from '../../lib/theme'

interface ScreenshotModeProps {
  products: Product[]
  storeName: string
  tagline?: string
  onExit: () => void
}

/**
 * The customer-facing view — a clean storefront board with no app chrome,
 * designed to be screenshotted and sent to customers on Messenger.
 * Tap anywhere to exit. Motion is minimal so a screenshot captures it settled.
 */
export function ScreenshotMode({ products, storeName, tagline, onExit }: ScreenshotModeProps) {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  const today = new Date().toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <motion.div
      onClick={onExit}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      style={{ position: 'fixed', inset: 0, zIndex: 100, background: color.bg, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}
    >
      <div style={{ maxWidth: '540px', margin: '0 auto', padding: '28px 16px 40px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Masthead */}
        <header style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', textAlign: 'center' }}>
          <img src="/logo-mark.png" alt="" style={{ height: '46px', width: 'auto' }} />
          <div>
            <h1 style={{ fontSize: '23px', fontWeight: 800, color: color.ink, margin: 0, fontFamily: font, letterSpacing: '-0.02em', textWrap: 'balance' }}>{storeName}</h1>
            {tagline && <p style={{ fontSize: '13px', color: color.muted, margin: '3px 0 0', fontFamily: font, textWrap: 'pretty' }}>{tagline}</p>}
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginTop: '2px', fontSize: '12px', color: color.muted, fontFamily: font }}>
            <span style={{ fontWeight: 600, color: color.accent }}>Available today</span>
            <span aria-hidden style={{ width: '3px', height: '3px', borderRadius: '50%', background: color.border2 }} />
            <span style={numeric}>{today}</span>
          </div>
        </header>

        {/* Product board */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {products.map(p => {
            const photo = p.photos[0]
            return (
              <article key={p.id} style={{ background: color.surface, borderRadius: '16px', overflow: 'hidden', border: `1px solid ${color.border}`, boxShadow: shadow.sm }}>
                <div style={{ aspectRatio: '1 / 1', background: color.surface2, display: 'grid', placeItems: 'center', color: color.border2 }}>
                  {photo
                    ? <img src={photo} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <ImageOff size={26} strokeWidth={1.5} />}
                </div>
                <div style={{ padding: '10px 12px 12px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: color.ink, margin: 0, lineHeight: 1.3, fontFamily: font, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.name}</p>
                  <span style={{ fontSize: '16px', fontWeight: 800, color: color.accent, fontFamily: font, ...numeric }}>{formatPHP(p.sellPrice)}</span>
                </div>
              </article>
            )
          })}
        </div>

        {/* Order CTA — how customers actually order */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '11px', padding: '14px 16px', borderRadius: '14px', background: color.accentDim, border: `1px solid ${color.border}` }}>
          <div style={{ display: 'grid', placeItems: 'center', width: '38px', height: '38px', borderRadius: '50%', background: color.accent, color: '#fff', flexShrink: 0 }}>
            <MessageCircle size={19} strokeWidth={2} />
          </div>
          <div>
            <p style={{ fontSize: '14px', fontWeight: 700, color: color.ink, margin: 0, fontFamily: font }}>Message us to order</p>
            <p style={{ fontSize: '12px', color: color.muted, margin: '1px 0 0', fontFamily: font, textWrap: 'pretty' }}>Send the item name and quantity — we'll confirm your total.</p>
          </div>
        </div>
      </div>

      {/* Exit hint — fades so it never lands in a screenshot */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ delay: 2.2, duration: 0.8 }}
        style={{ position: 'fixed', bottom: 'calc(20px + env(safe-area-inset-bottom, 0px))', left: 0, right: 0, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}
      >
        <span style={{ background: 'rgba(24,23,26,0.82)', color: '#fff', fontSize: '12px', fontWeight: 600, padding: '7px 15px', borderRadius: '999px', fontFamily: font }}>
          Tap anywhere to exit
        </span>
      </motion.div>
    </motion.div>
  )
}
