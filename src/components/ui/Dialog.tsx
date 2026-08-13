import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'

interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function Dialog({ open, onClose, title, children }: DialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            style={{
              position: 'fixed', left: '16px', right: '16px', top: '50%', transform: 'translateY(-50%)',
              background: '#fff', borderRadius: '16px', zIndex: 51,
              maxHeight: '90dvh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderBottom: '1px solid #E6E3DC' }}>
              <h2 style={{ fontWeight: 600, color: '#18171A', fontSize: '16px', margin: 0, fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>{title}</h2>
              <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '22px', color: '#79767F', cursor: 'pointer', lineHeight: 1, padding: '0 4px' }}>×</button>
            </div>
            <div style={{ padding: '16px' }}>{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
