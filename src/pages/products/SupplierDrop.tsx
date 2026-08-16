import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useLiveQuery } from 'dexie-react-hooks'
import { ImagePlus, Trash2, Truck, X } from 'lucide-react'
import { getSetting } from '../../db'
import { addProduct } from '../../hooks/useProducts'
import { DEFAULT_MARGIN_FLOOR } from '../../hooks/useOrders'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { color, font, numeric, shadow } from '../../lib/theme'
import { formatPHP } from '../../lib/utils'

interface DropItem {
  id: string
  photo: string
  name: string
  category: string
  costPrice: number
  sellPrice: number
  stock: number
}

interface SupplierDropProps {
  onClose: () => void
}

function computeSell(cost: number, floor: number): number {
  if (cost <= 0) return 0
  if (floor <= 0) return cost
  if (floor >= 100) return cost
  return Math.ceil(cost / (1 - floor / 100))
}

export function SupplierDrop({ onClose }: SupplierDropProps) {
  const marginFloor =
    useLiveQuery(
      async () => Number(await getSetting('margin_floor', String(DEFAULT_MARGIN_FLOOR))) || 0,
      [],
      DEFAULT_MARGIN_FLOOR,
    ) ?? DEFAULT_MARGIN_FLOOR

  const [items, setItems] = useState<DropItem[]>([])
  const [globalCategory, setGlobalCategory] = useState('')
  const [defaultStock, setDefaultStock] = useState(50)
  const [dragging, setDragging] = useState(false)
  const [importing, setImporting] = useState(false)
  const [doneCount, setDoneCount] = useState<number | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function readFiles(files: FileList | null) {
    if (!files?.length) return
    const arr = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (!arr.length) return
    let loaded = 0
    const batch: DropItem[] = []
    arr.forEach(file => {
      const reader = new FileReader()
      reader.onload = ev => {
        const rawName = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ')
        batch.push({
          id: `${Date.now()}-${Math.random()}`,
          photo: ev.target?.result as string,
          name: rawName,
          category: globalCategory,
          costPrice: 0,
          sellPrice: 0,
          stock: defaultStock,
        })
        loaded++
        if (loaded === arr.length) setItems(prev => [...prev, ...batch])
      }
      reader.readAsDataURL(file)
    })
  }

  function updateItem(id: string, field: keyof DropItem, value: string | number) {
    setItems(prev =>
      prev.map(item => {
        if (item.id !== id) return item
        const next = { ...item, [field]: value }
        if (field === 'costPrice') next.sellPrice = computeSell(Number(value), marginFloor)
        return next
      }),
    )
  }

  function removeItem(id: string) {
    setItems(prev => prev.filter(i => i.id !== id))
  }

  function applyGlobalCategory(cat: string) {
    setGlobalCategory(cat)
    setItems(prev => prev.map(i => ({ ...i, category: cat })))
  }

  function applyDefaultStock(qty: number) {
    setDefaultStock(qty)
    setItems(prev => prev.map(i => ({ ...i, stock: qty })))
  }

  async function handleImport() {
    const valid = items.filter(i => i.name.trim())
    if (!valid.length || importing) return
    setImporting(true)
    for (const item of valid) {
      await addProduct({
        name: item.name.trim(),
        description: '',
        category: item.category.trim(),
        costPrice: item.costPrice,
        sellPrice: item.sellPrice,
        stock: item.stock,
        availableToday: true,
        photos: [item.photo],
      })
    }
    setImporting(false)
    setDoneCount(valid.length)
    setTimeout(() => {
      setItems([])
      setDoneCount(null)
      onClose()
    }, 1400)
  }

  const validCount = items.filter(i => i.name.trim()).length
  const fieldLine: React.CSSProperties = {
    width: '100%', border: 'none', background: 'transparent',
    outline: 'none', fontFamily: font, padding: '3px 0',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 18 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: color.bg, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
      }}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false) }}
      onDrop={e => { e.preventDefault(); setDragging(false); readFiles(e.dataTransfer.files) }}
    >
      {/* Drag-over overlay */}
      {dragging && (
        <div style={{
          position: 'fixed', inset: 4, zIndex: 200, borderRadius: '20px',
          border: `3px dashed ${color.accent}`, background: color.accentDim,
          display: 'grid', placeItems: 'center', pointerEvents: 'none',
        }}>
          <p style={{ fontSize: '22px', fontWeight: 800, color: color.accent, fontFamily: font, letterSpacing: '-0.02em' }}>
            Drop images here
          </p>
        </div>
      )}

      <div style={{
        maxWidth: '680px', margin: '0 auto',
        padding: 'clamp(16px, 2.5vw, 28px)',
        paddingBottom: items.length ? '100px' : 'clamp(16px, 2.5vw, 28px)',
        display: 'flex', flexDirection: 'column', gap: '16px',
      }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: color.accentDim, display: 'grid', placeItems: 'center' }}>
              <Truck size={18} strokeWidth={1.8} color={color.accent} />
            </div>
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: 700, color: color.ink, margin: 0, letterSpacing: '-0.02em' }}>Supplier Drop</h1>
              <p style={{ fontSize: '12px', color: color.muted, margin: 0 }}>Bulk import → auto-price → share catalog</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              display: 'grid', placeItems: 'center', width: '34px', height: '34px',
              borderRadius: '50%', border: 'none', background: color.surface2, color: color.muted, cursor: 'pointer',
            }}
          >
            <X size={15} strokeWidth={2.2} />
          </button>
        </div>

        {/* Global settings */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px', alignItems: 'end' }}>
          <Input
            label="Category for all items"
            value={globalCategory}
            onChange={e => applyGlobalCategory(e.target.value)}
            placeholder="e.g. Personal Care · Food · Clothes"
          />
          <div>
            <p style={{ fontSize: '12px', fontWeight: 600, color: color.muted, margin: '0 0 4px' }}>Default stock</p>
            <input
              type="number" min="0" step="1"
              value={defaultStock}
              onChange={e => applyDefaultStock(Math.max(0, Number(e.target.value)))}
              style={{
                width: '70px', border: `1px solid ${color.border}`, borderRadius: '8px',
                background: color.surface, padding: '8px 10px', fontSize: '14px', fontWeight: 600,
                color: color.ink, outline: 'none', textAlign: 'center', fontFamily: font, ...numeric,
              }}
            />
          </div>
        </div>

        {/* Margin floor badge */}
        {items.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontSize: '13px', color: color.muted, margin: 0 }}>
              <span style={numeric}>{items.length}</span> image{items.length !== 1 ? 's' : ''} loaded
              {' · '}sell price auto-set at <span style={{ color: color.accent, fontWeight: 600 }}>{marginFloor}% margin</span>
            </p>
            <Button size="sm" variant="ghost" onClick={() => fileRef.current?.click()}>
              <ImagePlus size={13} strokeWidth={1.8} /> Add more
            </Button>
          </div>
        )}

        {/* Drop zone — only when empty */}
        {items.length === 0 && (
          <button
            onClick={() => fileRef.current?.click()}
            style={{
              border: `2px dashed ${color.border}`, borderRadius: '16px',
              background: color.surface2, padding: '52px 24px', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px',
              width: '100%', transition: 'border-color 0.15s',
            }}
          >
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: color.accentDim, display: 'grid', placeItems: 'center',
            }}>
              <ImagePlus size={26} strokeWidth={1.5} color={color.accent} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontWeight: 700, color: color.ink, margin: 0, fontSize: '15px', fontFamily: font }}>
                Drop supplier images here
              </p>
              <p style={{ color: color.muted, margin: '5px 0 0', fontSize: '13px', fontFamily: font }}>
                or tap to select · multiple images at once
              </p>
            </div>
          </button>
        )}

        {/* Item cards */}
        {items.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {items.map(item => (
              <div
                key={item.id}
                style={{
                  background: color.surface, border: `1px solid ${color.border}`,
                  borderRadius: '14px', padding: '12px',
                  display: 'flex', gap: '12px', alignItems: 'flex-start',
                  boxShadow: shadow.xs,
                }}
              >
                {/* Thumbnail */}
                <img
                  src={item.photo}
                  alt=""
                  style={{
                    width: '72px', height: '72px', objectFit: 'cover',
                    borderRadius: '10px', flexShrink: 0, background: color.surface2,
                  }}
                />

                {/* Fields */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
                  {/* Name */}
                  <input
                    value={item.name}
                    onChange={e => updateItem(item.id, 'name', e.target.value)}
                    placeholder="Product name *"
                    style={{
                      ...fieldLine,
                      fontSize: '14px', fontWeight: 600, color: color.ink,
                      borderBottom: `1.5px solid ${color.border}`,
                    }}
                  />

                  {/* Category */}
                  <input
                    value={item.category}
                    onChange={e => updateItem(item.id, 'category', e.target.value)}
                    placeholder="Category"
                    style={{
                      ...fieldLine,
                      fontSize: '12px', color: color.muted,
                      borderBottom: `1px solid ${color.border}`,
                    }}
                  />

                  {/* Cost → Sell */}
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '10px', fontWeight: 700, color: color.muted, margin: '4px 0 3px', textTransform: 'uppercase', letterSpacing: '0.09em' }}>
                        Cost ₱
                      </p>
                      <input
                        type="number" min="0" step="1"
                        value={item.costPrice || ''}
                        onChange={e => updateItem(item.id, 'costPrice', Number(e.target.value))}
                        placeholder="0"
                        style={{
                          ...fieldLine, ...numeric,
                          fontSize: '15px', fontWeight: 600, color: color.ink,
                          borderBottom: `1.5px solid ${color.border}`,
                        }}
                      />
                    </div>

                    <span style={{ color: color.muted, fontSize: '16px', paddingBottom: '4px', flexShrink: 0 }}>→</span>

                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '10px', fontWeight: 700, color: color.accent, margin: '4px 0 3px', textTransform: 'uppercase', letterSpacing: '0.09em' }}>
                        Sell ₱ {item.costPrice > 0 && item.sellPrice > item.costPrice
                          ? `(+${formatPHP(item.sellPrice - item.costPrice)})`
                          : ''}
                      </p>
                      <input
                        type="number" min="0" step="1"
                        value={item.sellPrice || ''}
                        onChange={e => updateItem(item.id, 'sellPrice', Number(e.target.value))}
                        placeholder="auto"
                        style={{
                          ...fieldLine, ...numeric,
                          fontSize: '15px', fontWeight: 700, color: color.accent,
                          borderBottom: `1.5px solid ${color.accent}`,
                        }}
                      />
                    </div>

                    {/* Per-item stock */}
                    <div style={{ width: '46px', flexShrink: 0 }}>
                      <p style={{ fontSize: '10px', fontWeight: 700, color: color.muted, margin: '4px 0 3px', textTransform: 'uppercase', letterSpacing: '0.09em' }}>
                        Stock
                      </p>
                      <input
                        type="number" min="0" step="1"
                        value={item.stock}
                        onChange={e => updateItem(item.id, 'stock', Math.max(0, Number(e.target.value)))}
                        style={{
                          ...fieldLine, ...numeric,
                          fontSize: '14px', fontWeight: 600, color: color.ink, textAlign: 'center',
                          borderBottom: `1.5px solid ${color.border}`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Remove */}
                <button
                  onClick={() => removeItem(item.id)}
                  aria-label="Remove item"
                  style={{
                    display: 'grid', placeItems: 'center', width: '28px', height: '28px',
                    borderRadius: '8px', border: 'none', background: 'transparent',
                    color: color.muted, cursor: 'pointer', flexShrink: 0, marginTop: '2px',
                  }}
                >
                  <Trash2 size={14} strokeWidth={1.8} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hidden multi-file input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={e => { readFiles(e.target.files); e.target.value = '' }}
      />

      {/* Fixed bottom bar */}
      {items.length > 0 && (
        <div style={{
          position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 110,
          background: color.bg, borderTop: `1px solid ${color.border}`,
          padding: '12px 16px',
          paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
          display: 'flex', gap: '12px', alignItems: 'center',
          boxShadow: '0 -4px 16px rgba(0,0,0,0.06)',
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {doneCount != null ? (
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: color.green }}>
                ✓ {doneCount} product{doneCount !== 1 ? 's' : ''} added to catalog
              </p>
            ) : (
              <>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: color.ink }}>
                  {validCount} product{validCount !== 1 ? 's' : ''} ready to import
                </p>
                <p style={{ margin: '1px 0 0', fontSize: '11px', color: color.muted }}>
                  All marked available today · stock set to {defaultStock}
                </p>
              </>
            )}
          </div>
          <Button
            size="lg"
            onClick={handleImport}
            disabled={validCount === 0 || importing || doneCount != null}
            style={{ minWidth: '130px', flexShrink: 0 }}
          >
            {doneCount != null ? 'Done!' : importing ? 'Importing…' : `Import ${validCount}`}
          </Button>
        </div>
      )}
    </motion.div>
  )
}
