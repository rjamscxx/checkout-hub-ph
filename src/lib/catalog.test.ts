import { describe, it, expect } from 'vitest'
import { searchProducts, findDuplicateGroups, duplicateIds, findNameCollision } from './catalog'
import type { Product } from '../db'

let nextId = 1

function makeProduct(over: Partial<Product> = {}): Product {
  return {
    id: nextId++,
    name: 'Shampoo Rejoice 140ml',
    description: '',
    category: 'Personal Care',
    costPrice: 100,
    sellPrice: 143,
    stock: 5,
    availableToday: true,
    photos: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...over,
  }
}

describe('searchProducts', () => {
  it('returns everything for an empty or blank query', () => {
    const all = [makeProduct(), makeProduct({ name: 'Ube Halaya' })]
    expect(searchProducts(all, '')).toHaveLength(2)
    expect(searchProducts(all, '   ')).toHaveLength(2)
  })

  it('matches part of a name, ignoring case and punctuation', () => {
    const all = [makeProduct({ name: 'Shampoo Rejoice 140ml' }), makeProduct({ name: 'Ube Halaya' })]
    expect(searchProducts(all, 'REJOICE').map(p => p.name)).toEqual(['Shampoo Rejoice 140ml'])
    expect(searchProducts(all, 'rejoice!!')).toHaveLength(1)
  })

  it('matches words in any order and any field', () => {
    const all = [
      makeProduct({ name: 'Shampoo Rejoice 140ml', supplier: 'Ate Rose' }),
      makeProduct({ name: 'Soap Safeguard', supplier: 'Kuya Ben' }),
    ]
    expect(searchProducts(all, 'rejoice shampoo')).toHaveLength(1)
    expect(searchProducts(all, 'ate rose')).toHaveLength(1)
    expect(searchProducts(all, 'personal care')).toHaveLength(2)
  })

  it('requires every word to match, not just one', () => {
    const all = [makeProduct({ name: 'Shampoo Rejoice' }), makeProduct({ name: 'Soap Safeguard' })]
    expect(searchProducts(all, 'shampoo safeguard')).toHaveLength(0)
  })

  it('ignores accents so Piña finds Pina', () => {
    const all = [makeProduct({ name: 'Piña Cloth' })]
    expect(searchProducts(all, 'pina')).toHaveLength(1)
  })

  it('returns nothing when there is no match', () => {
    expect(searchProducts([makeProduct()], 'lipstick')).toEqual([])
  })
})

describe('findDuplicateGroups', () => {
  it('finds nothing in a clean catalog', () => {
    const all = [makeProduct({ name: 'Shampoo' }), makeProduct({ name: 'Soap' })]
    expect(findDuplicateGroups(all)).toEqual([])
  })

  it('groups names that differ only by case, punctuation or spacing', () => {
    const all = [
      makeProduct({ name: 'Ube Halaya 250g' }),
      makeProduct({ name: 'ube-halaya (250G)' }),
      makeProduct({ name: 'Soap' }),
    ]
    const groups = findDuplicateGroups(all)
    expect(groups).toHaveLength(1)
    expect(groups[0].products).toHaveLength(2)
  })

  it('keeps a group of three together rather than splitting it', () => {
    const all = ['Soap', 'soap', 'SOAP!'].map(name => makeProduct({ name }))
    expect(findDuplicateGroups(all)[0].products).toHaveLength(3)
  })

  it('orders each group oldest first', () => {
    const all = [
      makeProduct({ name: 'Soap', createdAt: '2026-03-01T00:00:00.000Z' }),
      makeProduct({ name: 'soap', createdAt: '2026-01-01T00:00:00.000Z' }),
    ]
    const [group] = findDuplicateGroups(all)
    expect(group.products.map(p => p.createdAt)).toEqual([
      '2026-01-01T00:00:00.000Z',
      '2026-03-01T00:00:00.000Z',
    ])
  })

  it('does not treat unnamed products as duplicates of each other', () => {
    const all = [makeProduct({ name: '' }), makeProduct({ name: '  ' })]
    expect(findDuplicateGroups(all)).toEqual([])
  })
})

describe('duplicateIds', () => {
  it('collects every id caught in a group', () => {
    const a = makeProduct({ name: 'Soap' })
    const b = makeProduct({ name: 'soap' })
    const ids = duplicateIds(findDuplicateGroups([a, b, makeProduct({ name: 'Shampoo' })]))
    expect(ids).toEqual(new Set([a.id, b.id]))
  })
})

describe('findNameCollision', () => {
  it('finds an existing product with the same name', () => {
    const existing = makeProduct({ name: 'Ube Halaya' })
    expect(findNameCollision([existing], 'ube halaya')?.id).toBe(existing.id)
  })

  it('does not flag a product against itself while editing', () => {
    const existing = makeProduct({ name: 'Ube Halaya' })
    expect(findNameCollision([existing], 'Ube Halaya', existing.id)).toBeUndefined()
  })

  it('returns nothing for a blank or unique name', () => {
    const all = [makeProduct({ name: 'Ube Halaya' })]
    expect(findNameCollision(all, '')).toBeUndefined()
    expect(findNameCollision(all, 'Lipstick')).toBeUndefined()
  })
})
