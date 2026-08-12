import { useEffect } from 'react'
import type { Product } from '../../db'
import { CatalogCard } from './CatalogCard'
import { motion } from 'framer-motion'

interface ScreenshotModeProps {
  products: Product[]
  storeName: string
  onExit: () => void
}

export function ScreenshotMode({ products, storeName, onExit }: ScreenshotModeProps) {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  const today = new Date().toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <motion.div
      style={{ position: 'fixed', inset: 0, zIndex: 100, background: '#FAFAF8', overflowY: 'auto' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onExit}
    >
      {/* Clean header — NO app chrome, NO buttons, designed to be screenshotted */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #E8E5DF' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="/logo.png" alt="" style={{ height: '28px', width: 'auto' }} />
          <span style={{ fontWeight: 700, color: '#1A1917', fontSize: '15px', fontFamily: 'Inter, system-ui, sans-serif' }}>{storeName}</span>
        </div>
        <span style={{ fontSize: '12px', color: '#6B6760', fontFamily: 'Inter, system-ui, sans-serif' }}>{today}</span>
      </div>

      {/* Full-bleed product grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', padding: '12px' }}
        onClick={e => e.stopPropagation()}
      >
        {products.map(p => (
          <CatalogCard key={p.id} product={p} mode="screenshot" />
        ))}
      </div>

      {/* Tap-to-exit hint — fades out after 2s */}
      <motion.div
        style={{ position: 'fixed', bottom: '24px', left: 0, right: 0, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ delay: 2, duration: 1 }}
      >
        <span style={{ background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '12px', padding: '6px 14px', borderRadius: '999px', fontFamily: 'Inter, system-ui, sans-serif' }}>
          Tap anywhere to exit
        </span>
      </motion.div>
    </motion.div>
  )
}
