import { describe, expect, it } from 'vitest'
import { payableReleasedFor } from './payableRelease'
import { roundToCents } from './money'

describe('payableReleasedFor (US-10.2.1)', () => {
  it('releases the whole payable on full payment', () => {
    expect(payableReleasedFor(152.38, 152.38)).toBe(152.38)
  })

  it('releases exactly the amount received on a half payment', () => {
    expect(payableReleasedFor(76.19, 152.38)).toBe(76.19)
  })

  it('releases exactly each partial, cumulatively', () => {
    let received = 0
    const released: number[] = []
    for (const part of [50, 50, 52.38]) {
      received = roundToCents(received + part)
      released.push(payableReleasedFor(received, 152.38))
    }
    expect(released).toEqual([50, 100, 152.38])
  })

  it('clamps an over-receipt at the payable', () => {
    expect(payableReleasedFor(200, 152.38)).toBe(152.38)
  })

  it('releases nothing for zero or negative input', () => {
    expect(payableReleasedFor(0, 152.38)).toBe(0)
    expect(payableReleasedFor(-5, 152.38)).toBe(0)
    expect(payableReleasedFor(10, 0)).toBe(0)
  })
})
