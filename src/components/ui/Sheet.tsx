import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '../../lib/utils'

interface SheetProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
}

export function Sheet({ open, onClose, children, className }: SheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/40 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className={cn(
              'fixed bottom-0 left-0 right-0 rounded-t-2xl z-50 max-h-[85dvh] overflow-y-auto shadow-xl',
              className
            )}
            style={{ background: 'var(--color-surface)' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
          >
            <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-4" style={{ background: 'var(--color-border2)' }} />
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
