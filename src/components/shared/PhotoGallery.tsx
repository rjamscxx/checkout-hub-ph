import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ImageOff } from 'lucide-react'
import { color } from '../../lib/theme'

interface PhotoGalleryProps {
  photos: string[]
  aspectRatio?: 'square' | 'video'
}

export function PhotoGallery({ photos, aspectRatio = 'square' }: PhotoGalleryProps) {
  const [idx, setIdx] = useState(0)

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: '8px 8px 0 0',
    aspectRatio: aspectRatio === 'square' ? '1 / 1' : '16 / 9',
    background: '#F2F1EE',
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
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
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
              style={{ width: '6px', height: '6px', borderRadius: '50%', border: 'none', cursor: 'pointer', padding: 0, background: i === idx ? '#fff' : 'rgba(255,255,255,0.5)', transition: 'background 0.15s' }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
