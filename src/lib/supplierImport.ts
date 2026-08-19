/**
 * Supplier drop import — merge, never replace.
 *
 * Takes products parsed out of a supplier's chat posts and works out what
 * would change in the catalog *before* anything is written. The plan is
 * shown for review, then applied.
 *
 * The rules exist to protect data you own that the supplier can't know about:
 *   - stock and availableToday are never touched (that's your real inventory)
 *   - a sell price you set by hand is never overwritten
 *   - your category/supplier labels are filled only when blank
 *   - photos are appended, never swapped out
 */
import { db, type Product } from '../db'

/** One product parsed out of a supplier's chat post. */
export interface SupplierItem {
  name: string
  description?: string
  category?: string
  supplier?: string
  /** What the supplier charges — becomes costPrice, not sellPrice. */
  costPrice: number
  /** Data URLs, already compressed by the importer. */
  photos?: string[]
  /** YYYY-MM-DD, as the product form's date input stores it. */
  expiryDate?: string
  /** ISO timestamp of the chat message, for ordering and audit. */
  postedAt?: string
}

export interface ImportOptions {
  /** Percent margin used to derive sell price from cost. */
  marginFloor: number
  /** Stock assigned to newly created products. */
  defaultStock: number
  /** Cap on stored photos per product. */
  maxPhotosPerProduct?: number
}

export type ChangedField =
  | 'costPrice' | 'sellPrice' | 'description'
  | 'category' | 'supplier' | 'photos' | 'expiryDate'

export interface CreatePlanEntry {
  kind: 'create'
  item: SupplierItem
  product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
}

export interface UpdatePlanEntry {
  kind: 'update'
  item: SupplierItem
  id: number
  existing: Product
  patch: Partial<Product>
  changed: ChangedField[]
  /** True when cost moved but the sell price looked hand-set, so we left it. */
  keptManualSellPrice: boolean
}

export interface SkipPlanEntry {
  kind: 'skip'
  item: SupplierItem
  reason: string
}

export interface ImportPlan {
  creates: CreatePlanEntry[]
  updates: UpdatePlanEntry[]
  skips: SkipPlanEntry[]
}

export const DEFAULT_MAX_PHOTOS = 6

/**
 * Match key for "same product". Case, punctuation, accents and stray spacing
 * all vary between posts, so none of them should create a duplicate.
 */
export function normalizeName(name: string): string {
  return (name ?? '')
    .normalize('NFKD')
    // combining marks must vanish, not become spaces (pina, not pin a)
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** Sell price derived from cost at the configured margin floor. */
export function computeSellPrice(cost: number, marginFloor: number): number {
  if (cost <= 0) return 0
  if (marginFloor <= 0 || marginFloor >= 100) return cost
  return Math.ceil(cost / (1 - marginFloor / 100))
}

/**
 * Work out what an import would do. Pure — touches no storage.
 * `incoming` is expected in chronological order; when the supplier posts the
 * same product twice, the later post wins.
 */
export function planImport(
  incoming: SupplierItem[],
  existing: Product[],
  opts: ImportOptions,
): ImportPlan {
  const maxPhotos = opts.maxPhotosPerProduct ?? DEFAULT_MAX_PHOTOS
  const skips: SkipPlanEntry[] = []

  // Collapse repeat posts of the same product — most recent wins.
  const deduped = new Map<string, SupplierItem>()
  for (const item of incoming) {
    const key = normalizeName(item.name)
    if (!key) {
      skips.push({ kind: 'skip', item, reason: 'No product name' })
      continue
    }
    if (!(item.costPrice > 0)) {
      skips.push({ kind: 'skip', item, reason: 'No price found in the post' })
      continue
    }
    deduped.set(key, item)
  }

  const existingByKey = new Map<string, Product>()
  for (const p of existing) {
    const key = normalizeName(p.name)
    if (key && !existingByKey.has(key)) existingByKey.set(key, p)
  }

  const creates: CreatePlanEntry[] = []
  const updates: UpdatePlanEntry[] = []

  for (const [key, item] of deduped) {
    const match = existingByKey.get(key)

    if (!match) {
      creates.push({
        kind: 'create',
        item,
        product: {
          name: item.name.trim(),
          description: item.description?.trim() ?? '',
          category: item.category?.trim() ?? '',
          supplier: item.supplier?.trim() || undefined,
          costPrice: item.costPrice,
          sellPrice: computeSellPrice(item.costPrice, opts.marginFloor),
          stock: opts.defaultStock,
          availableToday: true,
          photos: (item.photos ?? []).slice(0, maxPhotos),
          expiryDate: item.expiryDate,
        },
      })
      continue
    }

    const patch: Partial<Product> = {}
    const changed: ChangedField[] = []
    let keptManualSellPrice = false

    if (item.costPrice !== match.costPrice) {
      patch.costPrice = item.costPrice
      changed.push('costPrice')

      // Only re-derive the sell price if the current one still matches what
      // the formula produced from the OLD cost — i.e. it was never hand-edited.
      const autoFromOldCost = computeSellPrice(match.costPrice, opts.marginFloor)
      if (match.sellPrice === autoFromOldCost) {
        const nextSell = computeSellPrice(item.costPrice, opts.marginFloor)
        if (nextSell !== match.sellPrice) {
          patch.sellPrice = nextSell
          changed.push('sellPrice')
        }
      } else {
        keptManualSellPrice = true
      }
    }

    const desc = item.description?.trim()
    if (desc && desc !== match.description) {
      patch.description = desc
      changed.push('description')
    }

    // Your own labels win — only fill what's blank.
    const cat = item.category?.trim()
    if (cat && !match.category?.trim()) {
      patch.category = cat
      changed.push('category')
    }

    const sup = item.supplier?.trim()
    if (sup && !match.supplier?.trim()) {
      patch.supplier = sup
      changed.push('supplier')
    }

    // A date you already recorded wins — batches differ and yours is the
    // one you physically checked.
    const exp = item.expiryDate?.trim()
    if (exp && !match.expiryDate?.trim()) {
      patch.expiryDate = exp
      changed.push('expiryDate')
    }

    // Append genuinely new photos; existing ones stay put.
    const existingPhotos = match.photos ?? []
    const merged = [...existingPhotos]
    for (const p of item.photos ?? []) {
      if (!merged.includes(p)) merged.push(p)
    }
    const capped = merged.slice(0, maxPhotos)
    if (capped.length !== existingPhotos.length) {
      patch.photos = capped
      changed.push('photos')
    }

    // stock and availableToday are deliberately absent — a supplier post
    // says nothing about what's actually on your shelf.

    if (changed.length === 0) {
      skips.push({ kind: 'skip', item, reason: 'Already up to date' })
    } else {
      updates.push({ kind: 'update', item, id: match.id!, existing: match, patch, changed, keptManualSellPrice })
    }
  }

  return { creates, updates, skips }
}

export interface ImportResult {
  created: number
  updated: number
}

/** Write an approved plan. Additive and in one transaction — nothing is cleared. */
export async function applyImportPlan(plan: ImportPlan): Promise<ImportResult> {
  const now = new Date().toISOString()

  await db.transaction('rw', db.products, async () => {
    for (const entry of plan.creates) {
      await db.products.add({ ...entry.product, createdAt: now, updatedAt: now })
    }
    for (const entry of plan.updates) {
      await db.products.update(entry.id, { ...entry.patch, updatedAt: now })
    }
  })

  return { created: plan.creates.length, updated: plan.updates.length }
}

/* ------------------------------------------------------------------ *
 * Drop file — what the messenger-export parser writes out.
 *
 * Photos are referenced by filename rather than embedded, so the file
 * stays small and reviewable. The importer pairs them with the actual
 * image files you select and compresses them on the way in.
 * ------------------------------------------------------------------ */

export interface DropFileItem {
  name: string
  description?: string
  category?: string
  supplier?: string
  costPrice: number
  expiryDate?: string
  photoFiles?: string[]
  postedAt?: string
  /** Original message text, kept so a mis-parse can be traced back. */
  sourceText?: string
}

export interface DropFile {
  version: number
  source?: string
  thread?: string
  generatedAt?: string
  items: DropFileItem[]
}

export const DROP_FILE_VERSION = 1

function asString(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v : undefined
}

/** Validate an untrusted drop file, throwing a message worth showing a human. */
export function parseDropFile(raw: unknown): DropFile {
  if (!raw || typeof raw !== 'object') throw new Error('That file is not a supplier drop file.')
  const obj = raw as Record<string, unknown>

  if (!Array.isArray(obj['items'])) {
    throw new Error('That file has no "items" list — is it a Checkout Hub backup by mistake?')
  }
  const version = Number(obj['version'] ?? 0)
  if (version > DROP_FILE_VERSION) {
    throw new Error(`This drop file is version ${version}, newer than this app understands.`)
  }

  const items: DropFileItem[] = []
  for (const entry of obj['items'] as unknown[]) {
    if (!entry || typeof entry !== 'object') continue
    const it = entry as Record<string, unknown>
    const name = asString(it['name'])
    if (!name) continue

    items.push({
      name,
      description: asString(it['description']),
      category: asString(it['category']),
      supplier: asString(it['supplier']),
      costPrice: Number(it['costPrice'] ?? 0) || 0,
      expiryDate: asString(it['expiryDate']),
      photoFiles: Array.isArray(it['photoFiles'])
        ? (it['photoFiles'] as unknown[]).filter((f): f is string => typeof f === 'string')
        : [],
      postedAt: asString(it['postedAt']),
      sourceText: asString(it['sourceText']),
    })
  }

  if (!items.length) throw new Error('No usable products found in that file.')

  return {
    version,
    source: asString(obj['source']),
    thread: asString(obj['thread']),
    generatedAt: asString(obj['generatedAt']),
    items,
  }
}
