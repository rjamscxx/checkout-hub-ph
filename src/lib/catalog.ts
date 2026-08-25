/**
 * Catalog lookups — free-text search, duplicate detection and shelving.
 *
 * Both go through `normalizeName`, the same match key the supplier importer
 * uses, so "the same product" means one thing everywhere in the app: case,
 * punctuation, accents and stray spacing never make two things look different.
 *
 * Pure functions — they read a product array and touch no storage.
 */
import { normalizeName } from './supplierImport'
import type { Product } from '../db'

/* ---- search ------------------------------------------------------------ */

/** The text a search query is matched against, normalized once per product. */
function haystack(p: Product): string {
  return normalizeName([p.name, p.category, p.supplier, p.description].filter(Boolean).join(' '))
}

/**
 * Products matching every word in the query, in any field and any order —
 * "rejoice sham" finds "Shampoo Rejoice 140ml". An empty query matches all.
 */
export function searchProducts(products: Product[], query: string): Product[] {
  const words = normalizeName(query).split(' ').filter(Boolean)
  if (!words.length) return products
  return products.filter(p => {
    const hay = haystack(p)
    return words.every(w => hay.includes(w))
  })
}

/* ---- duplicates -------------------------------------------------------- */

export interface DuplicateGroup {
  /** Normalized match key shared by every product in the group. */
  key: string
  /** The first product's name, for display. */
  name: string
  /** The two or more products that collided, oldest first. */
  products: Product[]
}

/**
 * Groups of products that are really the same item entered twice. Only groups
 * of 2+ are returned, so an empty result means the catalog is clean.
 */
export function findDuplicateGroups(products: Product[]): DuplicateGroup[] {
  const byKey = new Map<string, Product[]>()
  for (const p of products) {
    const key = normalizeName(p.name)
    if (!key) continue // an unnamed product can't be judged a duplicate
    const group = byKey.get(key)
    if (group) group.push(p)
    else byKey.set(key, [p])
  }

  return [...byKey.entries()]
    .filter(([, group]) => group.length > 1)
    .map(([key, group]) => ({
      key,
      name: group[0].name,
      products: [...group].sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

/** Ids of every product caught in a duplicate group — for badging list rows. */
export function duplicateIds(groups: DuplicateGroup[]): Set<number> {
  const ids = new Set<number>()
  for (const g of groups) {
    for (const p of g.products) if (p.id != null) ids.add(p.id)
  }
  return ids
}

/**
 * The existing product a name would collide with, so the form can warn before
 * a second copy is saved. `excludeId` keeps a product from matching itself
 * while being edited.
 */
export function findNameCollision(
  products: Product[],
  name: string,
  excludeId?: number,
): Product | undefined {
  const key = normalizeName(name)
  if (!key) return undefined
  return products.find(p => p.id !== excludeId && normalizeName(p.name) === key)
}

/* ---- shelving ---------------------------------------------------------- */

/**
 * The shelf physically-held stock is filed under.
 *
 * Deliberately shouted: on the flyer it is the first thing a customer reads,
 * and it is the one heading that promises "you can have this today".
 */
export const ONHAND_SHELF = 'ONHAND'

/** Where products with no category of their own end up. */
export const UNCATEGORIZED_SHELF = 'Uncategorized'

export interface Shelf {
  /** The heading — `ONHAND_SHELF`, a category name, or `UNCATEGORIZED_SHELF`. */
  name: string
  /** True only for the onhand shelf, so callers can style it as the headline. */
  onhand: boolean
  products: Product[]
}

/**
 * Products split into the shelves they are shown on, in the order they appear.
 *
 * Onhand stock leaves its category and moves to a single shelf pinned at the
 * top, so every item appears exactly once and the flyer opens with what is
 * ready to hand over. Everything else falls under its category, A-Z, with the
 * uncategorized remainder last. Empty shelves are dropped.
 *
 * The owner catalog, the customer flyer, the image and PDF exports and the
 * copied pricelist all shelve through here. One function means the flyer can
 * never disagree with the screen it was built from.
 */
export function groupForDisplay(products: Product[]): Shelf[] {
  const onhand: Product[] = []
  const byCategory = new Map<string, Product[]>()

  for (const p of products) {
    if (p.onhand) { onhand.push(p); continue }
    const cat = p.category?.trim() || UNCATEGORIZED_SHELF
    const shelf = byCategory.get(cat)
    if (shelf) shelf.push(p)
    else byCategory.set(cat, [p])
  }

  const categories = [...byCategory.keys()].sort((a, b) =>
    a === UNCATEGORIZED_SHELF ? 1 : b === UNCATEGORIZED_SHELF ? -1 : a.localeCompare(b)
  )

  const shelves: Shelf[] = []
  if (onhand.length) shelves.push({ name: ONHAND_SHELF, onhand: true, products: onhand })
  for (const name of categories) {
    shelves.push({ name, onhand: false, products: byCategory.get(name)! })
  }
  return shelves
}
