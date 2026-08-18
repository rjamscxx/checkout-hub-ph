import React, { useRef, useState } from 'react'
import { X, ImagePlus, GripVertical } from 'lucide-react'
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

function isFileDrag(e: React.DragEvent) {
  return Array.from(e.dataTransfer.types).includes('Files')
}

export function PhotoUploader({ photos, onChange, max = 15 }: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)
  const [fileOver, setFileOver] = useState(false)

  async function handleFiles(files: FileList | null) {
    if (!files) return
    const newPhotos: string[] = []
    for (const file of Array.from(files)) {
      if (photos.length + newPhotos.length >= max) break
      newPhotos.push(await toBase64(file))
    }
    onChange([...photos, ...newPhotos])
  }

  function handleDrop(dropIndex: number) {
    if (dragIndex === null || dragIndex === dropIndex) return
    const next = [...photos]
    const [moved] = next.splice(dragIndex, 1)
    next.splice(dropIndex, 0, moved)
    onChange(next)
    setDragIndex(null)
    setOverIndex(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div
        onDragOver={e => { if (isFileDrag(e)) { e.preventDefault(); setFileOver(true) } }}
        onDragLeave={e => { if (isFileDrag(e)) setFileOver(false) }}
        onDrop={e => {
          if (isFileDrag(e)) {
            e.preventDefault()
            setFileOver(false)
            handleFiles(e.dataTransfer.files)
          }
        }}
        style={{
          display: 'flex', flexWrap: 'wrap', gap: '8px', padding: fileOver ? '8px' : 0,
          borderRadius: '10px', border: `2px dashed ${fileOver ? color.accent : 'transparent'}`,
          background: fileOver ? 'var(--color-accent-dim)' : 'transparent', transition: 'border-color 0.15s, background 0.15s',
        }}
      >
        {photos.map((src, i) => (
          <div
            key={i}
            draggable
            onDragStart={() => setDragIndex(i)}
            onDragOver={e => { e.preventDefault(); if (overIndex !== i) setOverIndex(i) }}
            onDragLeave={() => setOverIndex(prev => (prev === i ? null : prev))}
            onDrop={e => { e.preventDefault(); handleDrop(i) }}
            onDragEnd={() => { setDragIndex(null); setOverIndex(null) }}
            style={{
              position: 'relative', width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden',
              border: `1px solid ${overIndex === i && dragIndex !== null && dragIndex !== i ? color.accent : 'var(--color-border)'}`,
              flexShrink: 0, cursor: 'grab', opacity: dragIndex === i ? 0.4 : 1, transition: 'opacity 0.15s, border-color 0.15s',
            }}
          >
            <img src={src} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', top: '2px', left: '2px', width: '18px', height: '18px', background: 'rgba(0,0,0,0.55)', color: '#fff', borderRadius: '5px', display: 'grid', placeItems: 'center' }}>
              <GripVertical size={12} strokeWidth={2.4} />
            </div>
            <button
              onClick={() => onChange(photos.filter((_, j) => j !== i))}
              aria-label={`Remove photo ${i + 1}`}
              style={{ position: 'absolute', top: '2px', right: '2px', width: '20px', height: '20px', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'grid', placeItems: 'center', lineHeight: 1 }}
            ><X size={12} strokeWidth={2.4} /></button>
            {i === 0 && (
              <span style={{ position: 'absolute', bottom: '2px', left: '2px', fontSize: '9px', fontWeight: 700, color: '#fff', background: 'rgba(0,0,0,0.55)', borderRadius: '4px', padding: '1px 5px' }}>
                Cover
              </span>
            )}
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
      <p style={{ fontSize: '11px', color: 'var(--color-muted)', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", margin: 0 }}>
        {photos.length}/{max} photos · drag files here to upload{photos.length > 1 ? ' · drag thumbnails to reorder' : ''}
      </p>
    </div>
  )
}
