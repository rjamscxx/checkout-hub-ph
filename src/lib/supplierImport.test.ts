import { describe, it, expect } from 'vitest'
import { planImport, parseDropFile, normalizeName, computeSellPrice, type SupplierItem } from './supplierImport'
import type { Product } from '../db'

const opts = { marginFloor: 30, defaultStock: 50 }

function makeProduct(over: Partial<Product> = {}): Product {
  return {
    id: 1,
    name: 'Shampoo',
    description: 'old description',
    category: '',
    costPrice: 100,
    sellPrice: computeSellPrice(100, opts.marginFloor), // 143 — auto-priced
    stock: 7,
    availableToday: false,
    photos: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...over,
  }
}

function item(over: Partial<SupplierItem> = {}): SupplierItem {
  return { name: 'Shampoo', costPrice: 120, ...over }
}

describe('normalizeName', () => {
  it('matches across case, punctuation and spacing', () => {
    expect(normalizeName('Sunsilk  Shampoo!')).toBe(normalizeName('sunsilk shampoo'))
    expect(normalizeName('Ube-Halaya (250g)')).toBe(normalizeName('UBE HALAYA 250G'))
  })

  it('strips accents rather than treating them as different products', () => {
    expect(normalizeName('Piña Cloth')).toBe(normalizeName('Pina Cloth'))
  })
})

describe('computeSellPrice', () => {
  it('marks cost up to the margin floor', () => {
    expect(computeSellPrice(100, 30)).toBe(143)
  })

  it('returns cost when the margin is not usable', () => {
    expect(computeSellPrice(100, 0)).toBe(100)
    expect(computeSellPrice(100, 100)).toBe(100)
    expect(computeSellPrice(0, 30)).toBe(0)
  })
})

describe('planImport — new products', () => {
  it('creates products that are not in the catalog yet', () => {
    const plan = planImport([item({ name: 'Body Wash', costPrice: 200 })], [], opts)
    expect(plan.creates).toHaveLength(1)
    expect(plan.updates).toHaveLength(0)

    const p = plan.creates[0].product
    expect(p.name).toBe('Body Wash')
    expect(p.costPrice).toBe(200)
    expect(p.sellPrice).toBe(computeSellPrice(200, 30))
    expect(p.stock).toBe(50)
    expect(p.availableToday).toBe(true)
  })

  it('treats the supplier price as cost, never as sell price', () => {
    const plan = planImport([item({ costPrice: 120 })], [], opts)
    const p = plan.creates[0].product
    expect(p.costPrice).toBe(120)
    expect(p.sellPrice).toBeGreaterThan(120)
  })
})

describe('planImport — protecting your data', () => {
  it('never changes stock or availableToday', () => {
    const existing = makeProduct({ stock: 7, availableToday: false })
    const plan = planImport([item({ costPrice: 120 })], [existing], opts)

    expect(plan.updates).toHaveLength(1)
    expect(plan.updates[0].patch).not.toHaveProperty('stock')
    expect(plan.updates[0].patch).not.toHaveProperty('availableToday')
  })

  it('keeps a sell price that was set by hand', () => {
    const existing = makeProduct({ costPrice: 100, sellPrice: 999 }) // hand-tuned
    const plan = planImport([item({ costPrice: 120 })], [existing], opts)

    const update = plan.updates[0]
    expect(update.patch.costPrice).toBe(120)
    expect(update.patch).not.toHaveProperty('sellPrice')
    expect(update.keptManualSellPrice).toBe(true)
  })

  it('re-derives a sell price that was still auto-generated', () => {
    const existing = makeProduct({ costPrice: 100, sellPrice: computeSellPrice(100, 30) })
    const plan = planImport([item({ costPrice: 120 })], [existing], opts)

    const update = plan.updates[0]
    expect(update.patch.sellPrice).toBe(computeSellPrice(120, 30))
    expect(update.keptManualSellPrice).toBe(false)
  })

  it('does not overwrite category and supplier labels you already set', () => {
    const existing = makeProduct({ category: 'My Category', supplier: 'My Supplier' })
    const plan = planImport(
      [item({ costPrice: 120, category: 'Their Category', supplier: 'Their Supplier' })],
      [existing],
      opts,
    )
    expect(plan.updates[0].patch).not.toHaveProperty('category')
    expect(plan.updates[0].patch).not.toHaveProperty('supplier')
  })

  it('fills category and supplier when they are blank', () => {
    const existing = makeProduct({ category: '', supplier: undefined })
    const plan = planImport(
      [item({ costPrice: 120, category: 'Personal Care', supplier: 'Ate Rose' })],
      [existing],
      opts,
    )
    expect(plan.updates[0].patch.category).toBe('Personal Care')
    expect(plan.updates[0].patch.supplier).toBe('Ate Rose')
  })

  it('records an expiry date when the product has none', () => {
    const existing = makeProduct({ expiryDate: undefined })
    const plan = planImport([item({ costPrice: 120, expiryDate: '2027-12-31' })], [existing], opts)

    expect(plan.updates[0].patch.expiryDate).toBe('2027-12-31')
  })

  it('does not overwrite an expiry date you checked yourself', () => {
    const existing = makeProduct({ expiryDate: '2026-06-30' })
    const plan = planImport([item({ costPrice: 120, expiryDate: '2027-12-31' })], [existing], opts)

    expect(plan.updates[0].patch).not.toHaveProperty('expiryDate')
  })

  it('carries expiry onto brand new products', () => {
    const plan = planImport([item({ name: 'Fiesta pasta', costPrice: 120, expiryDate: '2027-12-31' })], [], opts)
    expect(plan.creates[0].product.expiryDate).toBe('2027-12-31')
  })

  it('appends new photos instead of replacing existing ones', () => {
    const existing = makeProduct({ photos: ['data:mine'] })
    const plan = planImport([item({ costPrice: 120, photos: ['data:theirs'] })], [existing], opts)

    expect(plan.updates[0].patch.photos).toEqual(['data:mine', 'data:theirs'])
  })

  it('does not re-add a photo that is already stored', () => {
    const existing = makeProduct({ photos: ['data:same'] })
    const plan = planImport([item({ costPrice: 100, photos: ['data:same'] })], [existing], opts)

    expect(plan.updates).toHaveLength(0)
    expect(plan.skips[0].reason).toBe('Already up to date')
  })

  it('caps stored photos per product', () => {
    const existing = makeProduct({ photos: ['a', 'b', 'c', 'd', 'e'] })
    const plan = planImport(
      [item({ costPrice: 100, photos: ['f', 'g', 'h'] })],
      [existing],
      { ...opts, maxPhotosPerProduct: 6 },
    )
    expect(plan.updates[0].patch.photos).toHaveLength(6)
  })
})

describe('planImport — messy input', () => {
  it('matches an existing product despite different casing and punctuation', () => {
    const existing = makeProduct({ name: 'Sunsilk Shampoo' })
    const plan = planImport([item({ name: 'sunsilk  shampoo!', costPrice: 120 })], [existing], opts)

    expect(plan.creates).toHaveLength(0)
    expect(plan.updates).toHaveLength(1)
  })

  it('collapses repeat posts of the same product, keeping the latest price', () => {
    const plan = planImport(
      [
        item({ name: 'Lotion', costPrice: 100, postedAt: '2026-08-01T00:00:00.000Z' }),
        item({ name: 'Lotion', costPrice: 150, postedAt: '2026-08-19T00:00:00.000Z' }),
      ],
      [],
      opts,
    )
    expect(plan.creates).toHaveLength(1)
    expect(plan.creates[0].product.costPrice).toBe(150)
  })

  it('skips posts with no usable name or price', () => {
    const plan = planImport(
      [item({ name: '   ' }), item({ name: 'Mystery Item', costPrice: 0 })],
      [],
      opts,
    )
    expect(plan.creates).toHaveLength(0)
    expect(plan.skips.map(s => s.reason)).toEqual(['No product name', 'No price found in the post'])
  })

  it('skips products that would not change', () => {
    const existing = makeProduct({ costPrice: 120, description: 'same', photos: [] })
    const plan = planImport([item({ costPrice: 120, description: 'same' })], [existing], opts)

    expect(plan.updates).toHaveLength(0)
    expect(plan.skips[0].reason).toBe('Already up to date')
  })
})

describe('parseDropFile + planImport, end to end', () => {
  // Shaped exactly like scripts/parse-messenger-export.mjs writes it.
  const dropFile = {
    version: 1,
    source: 'messenger-export',
    thread: 'Supplier Group Chat',
    generatedAt: '2026-08-19T16:30:58.169Z',
    items: [
      {
        name: 'Ube Halaya 250g', description: 'Ube Halaya 250g', category: 'Grocery',
        supplier: 'Ate Rose', costPrice: 250, photoFiles: ['ube_01.jpg'],
        postedAt: '2026-08-18T02:00:00.000Z',
      },
      {
        name: 'Ube Halaya 250g', description: 'Ube Halaya 250g', category: 'Grocery',
        supplier: 'Ate Rose', costPrice: 275, photoFiles: ['ube_02.jpg'],
        postedAt: '2026-08-18T07:00:00.000Z',
      },
    ],
  }

  it('collapses a re-posted product to the most recent price', () => {
    const parsed = parseDropFile(dropFile)
    expect(parsed.items).toHaveLength(2)

    const plan = planImport(parsed.items.map(i => ({ ...i, photos: [] })), [], opts)

    expect(plan.creates).toHaveLength(1)
    expect(plan.creates[0].product.costPrice).toBe(275)
    expect(plan.creates[0].product.category).toBe('Grocery')
    expect(plan.creates[0].product.supplier).toBe('Ate Rose')
  })

  it('refuses a Checkout Hub backup file instead of silently mangling it', () => {
    expect(() => parseDropFile({ version: 2, products: [], orders: [] }))
      .toThrow(/no "items" list/)
  })

  it('refuses junk', () => {
    expect(() => parseDropFile(null)).toThrow(/not a supplier drop file/)
  })
})
