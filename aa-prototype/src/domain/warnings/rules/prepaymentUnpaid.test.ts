import { describe, expect, it } from 'vitest'
import type { Booking, List } from '../../types'
import type { WarningFacts } from '../types'
import { PREPAYMENT_REQUIRED_TEXT, PREPAYMENT_UNPAID_TEXT, prepaymentUnpaidRule } from './prepaymentUnpaid'

function facts(prepaymentStatus: WarningFacts['prepaymentStatus']): WarningFacts {
  return {
    booking: { id: 'BK1' } as Booking,
    list: { id: 'L1' } as List,
    procedures: [],
    prepaymentStatus,
    todayISO: '2026-07-21',
  }
}

describe('prepaymentUnpaid rule (US-06.3.2, D5)', () => {
  it('required: a strong before-procedure warning that no invoice is raised yet', () => {
    expect(prepaymentUnpaidRule.evaluate(facts('required'), {})).toEqual([
      { kind: 'beforeProcedure', strength: 'strong', text: PREPAYMENT_REQUIRED_TEXT },
    ])
  })

  it('outstanding: a strong before-procedure warning that the invoice is unpaid', () => {
    expect(prepaymentUnpaidRule.evaluate(facts('outstanding'), {})).toEqual([
      { kind: 'beforeProcedure', strength: 'strong', text: PREPAYMENT_UNPAID_TEXT },
    ])
  })

  it('paid and none raise nothing', () => {
    expect(prepaymentUnpaidRule.evaluate(facts('paid'), {})).toEqual([])
    expect(prepaymentUnpaidRule.evaluate(facts('none'), {})).toEqual([])
  })

  it('its texts carry no en or em dash', () => {
    expect(`${PREPAYMENT_REQUIRED_TEXT}${PREPAYMENT_UNPAID_TEXT}`).not.toMatch(/[–—]/)
  })
})
