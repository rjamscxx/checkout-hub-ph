import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'

interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  /** Max panel width in px. Defaults to a comfortable 460. */
  maxWidth?: number
}

export function Dialog({ open, onClose, title, children, maxWidth = 460 }: DialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          style={{
            position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px', overflowY: 'auto',
          }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog" aria-modal="true" aria-label={title}
            onClick={e => e.stopPropagation()}
            style={{
              width: `min(100%, ${maxWidth}px)`, maxHeight: 'calc(100dvh - 40px)',
              display: 'flex', flexDirection: 'column',
              background: 'var(--color-surface)', borderRadius: '16px', overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.22)',
            }}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.15 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, padding: '16px', borderBottom: '1px solid var(--color-border)' }}>
              <h2 style={{ fontWeight: 600, color: 'var(--color-ink)', fontSize: '16px', margin: 0, fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>{title}</h2>
              <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', fontSize: '22px', color: 'var(--color-muted)', cursor: 'pointer', lineHeight: 1, padding: '0 4px' }}>×</button>
            </div>
            <div style={{ padding: '16px', overflowY: 'auto' }}>{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
