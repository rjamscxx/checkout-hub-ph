import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ImageOff } from 'lucide-react'
import { color } from '../../lib/theme'

interface PhotoGalleryProps {
  photos: string[]
  /** 'portrait' (4:5) suits phone-shot product photos, which are usually tall. */
  aspectRatio?: 'square' | 'video' | 'portrait'
  /**
   * 'contain' shows the whole product with a little space at the edges;
   * 'cover' fills the frame and crops. Supplier photos arrive at every aspect
   * ratio, so the catalog uses 'contain' — a tin of luncheon meat with its
   * label sliced off is worse than a bit of breathing room beside it.
   */
  fit?: 'cover' | 'contain'
}

export function PhotoGallery({ photos, aspectRatio = 'square', fit = 'cover' }: PhotoGalleryProps) {
  const [idx, setIdx] = useState(0)

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: '8px 8px 0 0',
    aspectRatio: aspectRatio === 'video' ? '16 / 9' : aspectRatio === 'portrait' ? '4 / 5' : '1 / 1',
    background: 'var(--color-surface2)',
  }

  if (!photos.length) {
    return (
      <div style={{ ...containerStyle, display: 'grid', placeItems: 'center', color: color.border2 }}>
        <ImageOff size={28} strokeWidth={1.5} />
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      <AnimatePresence mode="wait">
        <motion.img
          key={idx}
          src={photos[idx]}
          alt=""
          style={{
            position: 'absolute',
            inset: fit === 'contain' ? '6px' : 0,
            width: fit === 'contain' ? 'calc(100% - 12px)' : '100%',
            height: fit === 'contain' ? 'calc(100% - 12px)' : '100%',
            objectFit: fit,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          drag={photos.length > 1 ? 'x' : false}
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={(_, info) => {
            if (info.offset.x < -40) setIdx(i => Math.min(i + 1, photos.length - 1))
            if (info.offset.x > 40) setIdx(i => Math.max(i - 1, 0))
          }}
        />
      </AnimatePresence>
      {photos.length > 1 && (
        <div style={{ position: 'absolute', bottom: '6px', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '4px' }}>
          {photos.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              style={{ width: '6px', height: '6px', borderRadius: '50%', border: 'none', cursor: 'pointer', padding: 0, background: i === idx ? 'var(--color-surface)' : 'rgba(255,255,255,0.5)', transition: 'background 0.15s' }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
