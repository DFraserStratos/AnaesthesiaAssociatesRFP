import { describe, expect, it } from 'vitest'
import { aaServiceFeeFor, AA_SERVICE_FEE_RATE } from './agencyFee'

describe('illustrative AA service fee', () => {
  it('deducts five percent from the gross collection and rounds both values to cents', () => {
    expect(AA_SERVICE_FEE_RATE).toBe(0.05)
    expect(aaServiceFeeFor(152.38)).toEqual({
      grossAmount: 152.38,
      serviceFeeRate: 0.05,
      serviceFeeAmount: 7.62,
      amountPayable: 144.76,
    })
  })
})
