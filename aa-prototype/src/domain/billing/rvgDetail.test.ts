import { describe, expect, it } from 'vitest'
import { mkContract } from './fixtures'
import { asksRvgDetail, rvgCodeToFill, rvgDetailFor } from './rvgDetail'

const ASKS = { rvgCode: 'required', times: 'required', modifiers: 'required' }
const COLLAPSED = { rvgCode: 'reference', times: 'hidden', modifiers: 'hidden' }

describe('the pricing-kind predicate, one place (catch-up Phase 21a; US-03.3.9, D9)', () => {
  it('asks for the RVG detail on the three RVG kinds and collapses on a fixed or open price', () => {
    const kinds = {
      rvgAnaesthetistRate: mkContract({ pricing: { kind: 'rvgAnaesthetistRate' } }),
      rvgContractRate: mkContract({ pricing: { kind: 'rvgContractRate', unitRate: 30 } }),
      rvgDiscount: mkContract({ pricing: { kind: 'rvgDiscount', discountPct: 10 } }),
      fixed: mkContract({ pricing: { kind: 'fixed', ranges: [{ startISO: '2026-01-01', price: 400 }] } }),
      open: mkContract({ pricing: { kind: 'open' } }),
    }
    expect(rvgDetailFor(kinds.rvgAnaesthetistRate)).toEqual(ASKS)
    expect(rvgDetailFor(kinds.rvgContractRate)).toEqual(ASKS)
    expect(rvgDetailFor(kinds.rvgDiscount)).toEqual(ASKS)
    expect(rvgDetailFor(kinds.fixed)).toEqual(COLLAPSED)
    expect(rvgDetailFor(kinds.open)).toEqual(COLLAPSED)
    expect(asksRvgDetail(kinds.fixed)).toBe(false)
  })

  it('No contract · RVG asks; a Disabled Contract still asks by its kind', () => {
    expect(asksRvgDetail(mkContract({ systemRole: 'noContractRvg', billsTo: 'payer' }))).toBe(true)
    expect(asksRvgDetail(mkContract({ status: 'disabled' }))).toBe(true)
  })

  it('with no Contract yet nothing is required and nothing is hidden (our reading)', () => {
    expect(rvgDetailFor(undefined)).toEqual({ rvgCode: 'optional', times: 'shown', modifiers: 'shown' })
    expect(asksRvgDetail(undefined)).toBe(false)
  })

  it('rvgCodeToFill reads the same predicate: an RVG kind with no code only', () => {
    const contracts = { rvg: mkContract({ id: 'rvg' }), fix: mkContract({ id: 'fix', pricing: { kind: 'fixed', ranges: [] } }) }
    expect(rvgCodeToFill({ contracts }, { governingContractId: 'rvg' })).toBe(true)
    expect(rvgCodeToFill({ contracts }, { governingContractId: 'rvg', rvgGroupId: 'RG1' })).toBe(false)
    expect(rvgCodeToFill({ contracts }, { governingContractId: 'fix' })).toBe(false)
    expect(rvgCodeToFill({ contracts }, {})).toBe(false)
  })
})
