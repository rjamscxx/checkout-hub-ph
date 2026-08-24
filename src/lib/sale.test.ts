import { describe, it, expect } from 'vitest'
import {
  clampDiscount, saleTotals, profitTone, addLine, setLineQty, setLinePrice,
} from './sale'
import type { OrderItem } from '../db'

function line(over: Partial<OrderItem> = {}): OrderItem {
  return { productId: 1, name: 'Cooking Oil 1L', qty: 1, price: 120, cost: 100, ...over }
}

describe('clampDiscount', () => {
  it('passes a discount inside the subtotal through untouched', () => {
    expect(clampDiscount(50, 500)).toBe(50)
  })

  it('never exceeds the subtotal, so a sale cannot go negative', () => {
    expect(clampDiscount(900, 500)).toBe(500)
  })

  it('treats a negative discount as none', () => {
    expect(clampDiscount(-50, 500)).toBe(0)
  })

  it('treats a blank or unparseable discount as none', () => {
    expect(clampDiscount(NaN, 500)).toBe(0)
  })

  it('cannot discount an empty cart into credit', () => {
    expect(clampDiscount(50, 0)).toBe(0)
  })
})

describe('saleTotals', () => {
  it('is all zeroes for an empty cart, with no divide-by-zero margin', () => {
    expect(saleTotals([])).toEqual({
      subtotal: 0, discount: 0, total: 0, cost: 0, profit: 0, margin: 0, itemCount: 0,
    })
  })

  it('multiplies each line by its quantity', () => {
    const t = saleTotals([line({ qty: 3 }), line({ productId: 2, qty: 2, price: 50, cost: 30 })])
    expect(t.subtotal).toBe(460)
    expect(t.cost).toBe(360)
    expect(t.profit).toBe(100)
    expect(t.itemCount).toBe(5)
  })

  it('takes the discount out of profit and leaves cost alone', () => {
    const undiscounted = saleTotals([line({ qty: 10 })])
    const discounted = saleTotals([line({ qty: 10 })], 100)
    expect(discounted.cost).toBe(undiscounted.cost)
    expect(discounted.total).toBe(undiscounted.total - 100)
    expect(discounted.profit).toBe(undiscounted.profit - 100)
  })

  it('reports margin as a whole percent of revenue', () => {
    expect(saleTotals([line({ price: 200, cost: 150 })]).margin).toBe(25)
  })

  it('reports a loss when the discount cuts below cost', () => {
    const t = saleTotals([line({ price: 120, cost: 100 })], 50)
    expect(t.total).toBe(70)
    expect(t.profit).toBe(-30)
  })

  it('counts a line with no cost snapshot as free goods rather than crashing', () => {
    const t = saleTotals([line({ cost: undefined })])
    expect(t.cost).toBe(0)
    expect(t.profit).toBe(120)
  })

  it('clamps an over-large discount so the total floors at zero', () => {
    const t = saleTotals([line()], 5000)
    expect(t.total).toBe(0)
    expect(t.margin).toBe(0)
  })
})

describe('profitTone', () => {
  const floor = 20

  it('flags a healthy margin', () => {
    expect(profitTone({ profit: 100, margin: 40 }, floor)).toBe('ok')
  })

  it('flags a margin under the floor without calling it a loss', () => {
    expect(profitTone({ profit: 10, margin: 8 }, floor)).toBe('below')
  })

  it('flags a loss', () => {
    expect(profitTone({ profit: -30, margin: -42 }, floor)).toBe('loss')
  })

  it('treats breaking exactly even as a loss, not a win', () => {
    expect(profitTone({ profit: 0, margin: 0 }, floor)).toBe('loss')
  })

  it('reads a margin exactly on the floor as acceptable', () => {
    expect(profitTone({ profit: 20, margin: 20 }, floor)).toBe('ok')
  })
})

describe('addLine', () => {
  it('appends a product the cart has not seen', () => {
    expect(addLine([line()], line({ productId: 2 }))).toHaveLength(2)
  })

  it('bumps quantity instead of opening a second line for the same product', () => {
    const items = addLine([line({ qty: 2 })], line({ qty: 1 }))
    expect(items).toHaveLength(1)
    expect(items[0].qty).toBe(3)
  })

  it('keeps the price already on the line when quantity is bumped', () => {
    const items = addLine([line({ price: 99 })], line({ price: 120 }))
    expect(items[0].price).toBe(99)
  })
})

describe('setLineQty', () => {
  it('sets the quantity', () => {
    expect(setLineQty([line()], 1, 7)[0].qty).toBe(7)
  })

  it('removes the line at zero', () => {
    expect(setLineQty([line()], 1, 0)).toEqual([])
  })

  it('removes the line rather than going negative', () => {
    expect(setLineQty([line()], 1, -3)).toEqual([])
  })

  it('leaves other lines untouched', () => {
    const items = setLineQty([line(), line({ productId: 2 })], 1, 5)
    expect(items[1].qty).toBe(1)
  })
})

describe('setLinePrice', () => {
  it('overrides the unit price', () => {
    expect(setLinePrice([line()], 1, 99)[0].price).toBe(99)
  })

  it('leaves the cost snapshot alone so profit stays honest', () => {
    expect(setLinePrice([line()], 1, 99)[0].cost).toBe(100)
  })

  it('allows marking something down to free', () => {
    expect(setLinePrice([line()], 1, 0)[0].price).toBe(0)
  })

  it('ignores a blank or unparseable price', () => {
    expect(setLinePrice([line()], 1, NaN)[0].price).toBe(120)
  })

  it('ignores a negative price', () => {
    expect(setLinePrice([line()], 1, -5)[0].price).toBe(120)
  })
})
