import React, { useRef } from 'react'
import { X, ImagePlus } from 'lucide-react'
import { color, font } from '../../lib/theme'

interface PhotoUploaderProps {
  photos: string[]
  onChange: (photos: string[]) => void
  max?: number
}

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function PhotoUploader({ photos, onChange, max = 15 }: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(files: FileList | null) {
    if (!files) return
    const newPhotos: string[] = []
    for (const file of Array.from(files)) {
      if (photos.length + newPhotos.length >= max) break
      newPhotos.push(await toBase64(file))
    }
    onChange([...photos, ...newPhotos])
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {photos.map((src, i) => (
          <div key={i} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--color-border)', flexShrink: 0 }}>
            <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <button
              onClick={() => onChange(photos.filter((_, j) => j !== i))}
              aria-label={`Remove photo ${i + 1}`}
              style={{ position: 'absolute', top: '2px', right: '2px', width: '20px', height: '20px', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'grid', placeItems: 'center', lineHeight: 1 }}
            ><X size={12} strokeWidth={2.4} /></button>
          </div>
        ))}
        {photos.length < max && (
          <button
            onClick={() => inputRef.current?.click()}
            aria-label="Add photo"
            style={{ width: '80px', height: '80px', border: `2px dashed ${color.border}`, borderRadius: '8px', background: 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: color.muted, fontSize: '11px', fontFamily: font, gap: '5px', cursor: 'pointer' }}
          >
            <ImagePlus size={22} strokeWidth={1.7} />
            <span>Photo</span>
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />
      <p style={{ fontSize: '11px', color: 'var(--color-muted)', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", margin: 0 }}>{photos.length}/{max} photos</p>
    </div>
  )
}
