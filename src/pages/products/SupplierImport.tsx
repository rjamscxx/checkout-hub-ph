import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useLiveQuery } from 'dexie-react-hooks'
import { AlertTriangle, FileJson, ImagePlus, Inbox, PackagePlus, RefreshCw, X } from 'lucide-react'
import { db, getSetting } from '../../db'
import { DEFAULT_MARGIN_FLOOR } from '../../hooks/useOrders'
import {
  applyImportPlan, parseDropFile, planImport,
  type DropFile, type ImportPlan, type ImportResult, type SupplierItem,
} from '../../lib/supplierImport'
import { compressImageFile, dataUrlBytes, formatBytes } from '../../lib/imageCompress'
import { Button } from '../../components/ui/Button'
import { color, font, numeric, shadow } from '../../lib/theme'
import { formatPHP } from '../../lib/utils'

type Stage = 'pick' | 'building' | 'review' | 'applying' | 'done'

interface SupplierImportProps {
  onClose: () => void
}

/** Filename without any directory part, lowercased — how photos get matched. */
function baseKey(path: string): string {
  return path.split(/[\\/]/).pop()!.toLowerCase()
}

export function SupplierImport({ onClose }: SupplierImportProps) {
  const marginFloor =
    useLiveQuery(
      async () => Number(await getSetting('margin_floor', String(DEFAULT_MARGIN_FLOOR))) || 0,
      [],
      DEFAULT_MARGIN_FLOOR,
    ) ?? DEFAULT_MARGIN_FLOOR

  const [drop, setDrop] = useState<DropFile | null>(null)
  const [photos, setPhotos] = useState<Map<string, File>>(new Map())
  const [defaultStock, setDefaultStock] = useState(50)
  const [stage, setStage] = useState<Stage>('pick')
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [plan, setPlan] = useState<ImportPlan | null>(null)
  const [missingPhotos, setMissingPhotos] = useState(0)
  const [photoBytes, setPhotoBytes] = useState(0)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState('')

  const jsonRef = useRef<HTMLInputElement>(null)
  const photoRef = useRef<HTMLInputElement>(null)

  async function pickDropFile(file: File | undefined) {
    if (!file) return
    setError('')
    try {
      setDrop(parseDropFile(JSON.parse(await file.text())))
    } catch (e) {
      setDrop(null)
      setError(e instanceof Error ? e.message : 'Could not read that file.')
    }
  }

  function pickPhotos(files: FileList | null) {
    if (!files?.length) return
    const map = new Map(photos)
    for (const f of Array.from(files)) {
      if (f.type.startsWith('image/')) map.set(baseKey(f.name), f)
    }
    setPhotos(map)
  }

  async function buildPlan() {
    if (!drop) return
    setStage('building')
    setError('')

    const total = drop.items.reduce((n, i) => n + (i.photoFiles?.length ?? 0), 0)
    setProgress({ done: 0, total })

    let done = 0
    let missing = 0
    let bytes = 0
    const items: SupplierItem[] = []

    try {
      for (const it of drop.items) {
        const dataUrls: string[] = []
        for (const ref of it.photoFiles ?? []) {
          const file = photos.get(baseKey(ref))
          if (!file) {
            missing++
          } else {
            try {
              const url = await compressImageFile(file)
              dataUrls.push(url)
              bytes += dataUrlBytes(url)
            } catch {
              missing++
            }
          }
          setProgress({ done: ++done, total })
        }
        items.push({
          name: it.name,
          description: it.description,
          category: it.category,
          supplier: it.supplier,
          costPrice: it.costPrice,
          expiryDate: it.expiryDate,
          photos: dataUrls,
          postedAt: it.postedAt,
        })
      }

      const existing = await db.products.toArray()
      setPlan(planImport(items, existing, { marginFloor, defaultStock }))
      setMissingPhotos(missing)
      setPhotoBytes(bytes)
      setStage('review')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong preparing the import.')
      setStage('pick')
    }
  }

  async function apply() {
    if (!plan) return
    setStage('applying')
    try {
      setResult(await applyImportPlan(plan))
      setStage('done')
      setTimeout(onClose, 1800)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The import failed — nothing was changed.')
      setStage('review')
    }
  }

  const ready = !!drop && photos.size > 0
  const changeCount = plan ? plan.creates.length + plan.updates.length : 0

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
    >
      <div style={{
        maxWidth: '680px', margin: '0 auto',
        padding: 'clamp(16px, 2.5vw, 28px)', paddingBottom: '110px',
        display: 'flex', flexDirection: 'column', gap: '16px',
      }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: color.accentDim, display: 'grid', placeItems: 'center' }}>
              <Inbox size={18} strokeWidth={1.8} color={color.accent} />
            </div>
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: 700, color: color.ink, margin: 0, letterSpacing: '-0.02em' }}>
                Import from Supplier Chat
              </h1>
              <p style={{ fontSize: '12px', color: color.muted, margin: 0 }}>
                Review every change before anything is saved
              </p>
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

        {error && (
          <div style={{
            display: 'flex', gap: '9px', alignItems: 'flex-start',
            background: color.goldDim, border: `1px solid ${color.gold}`,
            borderRadius: '12px', padding: '11px 13px',
          }}>
            <AlertTriangle size={15} strokeWidth={2} color={color.gold} style={{ flexShrink: 0, marginTop: '1px' }} />
            <p style={{ margin: 0, fontSize: '13px', color: color.ink, fontFamily: font }}>{error}</p>
          </div>
        )}

        {(stage === 'pick' || stage === 'building') && (
          <>
            <PickRow
              step={1}
              icon={<FileJson size={20} strokeWidth={1.6} color={color.accent} />}
              title={drop ? `${drop.items.length} products found` : 'Choose the drop file'}
              detail={
                drop
                  ? `${drop.thread ?? 'supplier chat'}${drop.generatedAt ? ` · ${drop.generatedAt.slice(0, 10)}` : ''}`
                  : 'The products.json produced from your chat export'
              }
              done={!!drop}
              onClick={() => jsonRef.current?.click()}
            />

            <PickRow
              step={2}
              icon={<ImagePlus size={20} strokeWidth={1.6} color={color.accent} />}
              title={photos.size ? `${photos.size} photos loaded` : 'Choose the photos'}
              detail={
                photos.size
                  ? 'Resized and compressed as they import'
                  : 'Select every image from the export photos folder'
              }
              done={photos.size > 0}
              onClick={() => photoRef.current?.click()}
            />

            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: color.surface, border: `1px solid ${color.border}`,
              borderRadius: '14px', padding: '12px 14px',
            }}>
              <div>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: color.ink }}>Stock for new products</p>
                <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: color.muted }}>
                  Existing products keep the stock they already have
                </p>
              </div>
              <input
                type="number" min="0" step="1"
                value={defaultStock}
                onChange={e => setDefaultStock(Math.max(0, Number(e.target.value)))}
                style={{
                  width: '72px', border: `1px solid ${color.border}`, borderRadius: '8px',
                  background: color.surface2, padding: '8px 10px', fontSize: '14px', fontWeight: 600,
                  color: color.ink, outline: 'none', textAlign: 'center', fontFamily: font, ...numeric,
                }}
              />
            </div>

            {stage === 'building' && (
              <p style={{ fontSize: '13px', color: color.muted, margin: 0, textAlign: 'center' }}>
                Compressing photos… <span style={numeric}>{progress.done}</span> / <span style={numeric}>{progress.total}</span>
              </p>
            )}
          </>
        )}

        {stage !== 'pick' && stage !== 'building' && plan && (
          <ReviewList plan={plan} missingPhotos={missingPhotos} photoBytes={photoBytes} />
        )}
      </div>

      <input
        ref={jsonRef} type="file" accept="application/json,.json" style={{ display: 'none' }}
        onChange={e => { void pickDropFile(e.target.files?.[0]); e.target.value = '' }}
      />
      <input
        ref={photoRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
        onChange={e => { pickPhotos(e.target.files); e.target.value = '' }}
      />

      <div style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 110,
        background: color.bg, borderTop: `1px solid ${color.border}`,
        padding: '12px 16px', paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
        display: 'flex', gap: '12px', alignItems: 'center',
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {stage === 'done' && result ? (
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: color.green }}>
              ✓ {result.created} added · {result.updated} updated
            </p>
          ) : plan ? (
            <p style={{ margin: 0, fontSize: '13px', color: color.muted }}>
              Nothing is saved until you confirm
            </p>
          ) : (
            <p style={{ margin: 0, fontSize: '13px', color: color.muted }}>
              {ready ? 'Ready to preview changes' : 'Choose the drop file and photos'}
            </p>
          )}
        </div>

        {stage === 'review' && plan ? (
          <Button
            size="lg"
            onClick={() => void apply()}
            disabled={changeCount === 0}
            style={{ minWidth: '150px', flexShrink: 0 }}
          >
            Apply {changeCount} change{changeCount !== 1 ? 's' : ''}
          </Button>
        ) : (
          <Button
            size="lg"
            onClick={() => void buildPlan()}
            disabled={!ready || stage === 'building' || stage === 'applying' || stage === 'done'}
            style={{ minWidth: '150px', flexShrink: 0 }}
          >
            {stage === 'building' ? 'Preparing…'
              : stage === 'applying' ? 'Saving…'
              : stage === 'done' ? 'Done!'
              : 'Preview changes'}
          </Button>
        )}
      </div>
    </motion.div>
  )
}

/* ---------------------------------------------------------------- */

function PickRow({ step, icon, title, detail, done, onClick }: {
  step: number
  icon: React.ReactNode
  title: string
  detail: string
  done: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '13px', width: '100%', textAlign: 'left',
        background: color.surface,
        border: `1.5px solid ${done ? color.green : color.border}`,
        borderRadius: '14px', padding: '14px', cursor: 'pointer', boxShadow: shadow.xs,
      }}
    >
      <div style={{
        width: '40px', height: '40px', borderRadius: '11px', flexShrink: 0,
        background: done ? color.greenDim : color.accentDim, display: 'grid', placeItems: 'center',
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: '10px', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: color.muted }}>
          Step {step}
        </p>
        <p style={{ margin: '2px 0 0', fontSize: '14px', fontWeight: 700, color: color.ink, fontFamily: font }}>{title}</p>
        <p style={{ margin: '1px 0 0', fontSize: '12px', color: color.muted, fontFamily: font }}>{detail}</p>
      </div>
    </button>
  )
}

function ReviewList({ plan, missingPhotos, photoBytes }: {
  plan: ImportPlan
  missingPhotos: number
  photoBytes: number
}) {
  const manualKept = plan.updates.filter(u => u.keptManualSellPrice).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
        <Stat label="New" value={plan.creates.length} tint={color.green} />
        <Stat label="Updated" value={plan.updates.length} tint={color.accent} />
        <Stat label="Unchanged" value={plan.skips.length} tint={color.muted} />
      </div>

      <p style={{ margin: 0, fontSize: '12px', color: color.muted, fontFamily: font }}>
        Photos add about <strong style={{ color: color.ink }}>{formatBytes(photoBytes)}</strong> to the catalog.
        Stock and today&rsquo;s availability are never changed by an import.
      </p>

      {(missingPhotos > 0 || manualKept > 0) && (
        <div style={{
          background: color.goldDim, border: `1px solid ${color.gold}`,
          borderRadius: '12px', padding: '11px 13px', display: 'flex', flexDirection: 'column', gap: '4px',
        }}>
          {missingPhotos > 0 && (
            <p style={{ margin: 0, fontSize: '12.5px', color: color.ink, fontFamily: font }}>
              {missingPhotos} photo{missingPhotos !== 1 ? 's' : ''} could not be found in your selection — those products import without them.
            </p>
          )}
          {manualKept > 0 && (
            <p style={{ margin: 0, fontSize: '12.5px', color: color.ink, fontFamily: font }}>
              {manualKept} product{manualKept !== 1 ? 's' : ''} kept the sell price you set by hand, even though cost changed.
            </p>
          )}
        </div>
      )}

      {plan.creates.length > 0 && (
        <Section title="New products">
          {plan.creates.map((c, i) => (
            <Row
              key={`c${i}`}
              icon={<PackagePlus size={14} strokeWidth={1.9} color={color.green} />}
              name={c.product.name}
              detail={`Cost ${formatPHP(c.product.costPrice)} → sell ${formatPHP(c.product.sellPrice)}`}
              photos={c.product.photos.length}
            />
          ))}
        </Section>
      )}

      {plan.updates.length > 0 && (
        <Section title="Updated products">
          {plan.updates.map(u => (
            <Row
              key={`u${u.id}`}
              icon={<RefreshCw size={14} strokeWidth={1.9} color={color.accent} />}
              name={u.existing.name}
              detail={describeUpdate(u.changed, u.existing.costPrice, u.patch.costPrice)}
              photos={u.patch.photos ? u.patch.photos.length - (u.existing.photos?.length ?? 0) : 0}
            />
          ))}
        </Section>
      )}

      {plan.skips.length > 0 && (
        <Section title="Not imported">
          {plan.skips.slice(0, 30).map((s, i) => (
            <Row key={`s${i}`} icon={null} name={s.item.name || '(no name)'} detail={s.reason} photos={0} muted />
          ))}
          {plan.skips.length > 30 && (
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: color.muted }}>
              …and {plan.skips.length - 30} more
            </p>
          )}
        </Section>
      )}
    </div>
  )
}

function describeUpdate(changed: string[], oldCost: number, newCost?: number): string {
  const parts: string[] = []
  if (newCost != null) parts.push(`cost ${formatPHP(oldCost)} → ${formatPHP(newCost)}`)
  for (const f of changed) {
    if (f === 'costPrice' || f === 'photos') continue
    parts.push(f === 'sellPrice' ? 'sell price re-derived' : f)
  }
  return parts.join(' · ') || 'updated'
}

function Stat({ label, value, tint }: { label: string; value: number; tint: string }) {
  return (
    <div style={{
      background: color.surface, border: `1px solid ${color.border}`,
      borderRadius: '12px', padding: '10px 12px', textAlign: 'center',
    }}>
      <p style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: tint, ...numeric }}>{value}</p>
      <p style={{ margin: '1px 0 0', fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: color.muted }}>
        {label}
      </p>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: color.muted, textTransform: 'uppercase', margin: '0 0 8px' }}>
        {title}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>{children}</div>
    </div>
  )
}

function Row({ icon, name, detail, photos, muted }: {
  icon: React.ReactNode
  name: string
  detail: string
  photos: number
  muted?: boolean
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      background: color.surface, border: `1px solid ${color.border}`,
      borderRadius: '11px', padding: '9px 12px', opacity: muted ? 0.65 : 1,
    }}>
      {icon && <span style={{ display: 'grid', placeItems: 'center', flexShrink: 0 }}>{icon}</span>}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin: 0, fontSize: '13.5px', fontWeight: 600, color: color.ink, fontFamily: font,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {name}
        </p>
        <p style={{ margin: '1px 0 0', fontSize: '11.5px', color: color.muted, fontFamily: font }}>{detail}</p>
      </div>
      {photos > 0 && (
        <span style={{ fontSize: '11px', color: color.muted, flexShrink: 0, ...numeric }}>
          +{photos} photo{photos !== 1 ? 's' : ''}
        </span>
      )}
    </div>
  )
}
