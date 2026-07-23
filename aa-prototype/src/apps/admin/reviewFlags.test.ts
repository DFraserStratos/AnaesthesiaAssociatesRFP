/**
 * The authorisation-review FLAGS helper — pure unit tests for the four
 * RFP-grounded flags (a: not completed, b: missing hospital reference, c: ACC
 * on the billable-party route, d: manual B/T/M override with its delta) plus a
 * seeded integration check against the real calculator (Chen's overridden T on
 * the design-day PM list). The mockup's duration-outlier flag is deliberately
 * NOT built (Decisions log 2026-07-23) and has no test.
 */

import { describe, expect, it } from 'vitest'
import { reviewFlagsForCard, reviewFlagsForList } from './reviewFlags'
import type { Card, Procedure } from '../../domain/types'
import { type BtmBreakdown, type FeeResult } from '../../domain/billing/fee'
import { cardsForList, createAppStore, proceduresForCard } from '../../store'
import { procedureFee } from '../../shared/capture/feeContext'
import { SEED_MARKERS } from '../../domain/seed'

const ZERO_BTM: BtmBreakdown = {
  base: { units: 0, source: 'seeded' },
  time: { units: 0, source: 'seeded' },
  modifiers: { units: 0, source: 'seeded' },
  refusedModifiers: [],
  totalUnits: 0,
}

function stubFee(btm: BtmBreakdown = ZERO_BTM): FeeResult {
  return { btm, billableUnits: btm.totalUnits, chargeBasis: 'rvg', unitRate: 30, lines: [], subtotal: 0, override: null, total: 0 }
}

function proc(over: Partial<Procedure> = {}): Procedure {
  return { id: 'P1', cardId: 'C1', description: 'Test op', accRelated: false, isAdditional: false, selectedModifierCodes: [], ...over }
}

function card(over: Partial<Card> = {}): Card {
  return { id: 'C1', completed: true, ...over } as unknown as Card
}

describe('reviewFlags (pure)', () => {
  it('(a) flags a card not marked completed', () => {
    const flags = reviewFlagsForCard({ card: card({ completed: false }), procedures: [] })
    expect(flags.some((f) => f.text === 'Not marked completed' && f.tone === 'neutral')).toBe(true)
  })

  it('(b) flags a missing billing reference on the hospital route only', () => {
    const hospitalNoRef = reviewFlagsForCard({ card: card(), procedures: [{ procedure: proc({ billingRoute: 'hospital' }), fee: stubFee() }] })
    expect(hospitalNoRef.some((f) => f.text === 'No billing reference')).toBe(true)

    const hospitalWithRef = reviewFlagsForCard({ card: card(), procedures: [{ procedure: proc({ billingRoute: 'hospital', billingReference: 'REF-1' }), fee: stubFee() }] })
    expect(hospitalWithRef.some((f) => f.text === 'No billing reference')).toBe(false)

    const insurerRoute = reviewFlagsForCard({ card: card(), procedures: [{ procedure: proc({ billingRoute: 'insurer' }), fee: stubFee() }] })
    expect(insurerRoute.some((f) => f.text === 'No billing reference')).toBe(false)
  })

  it('(c) raises an amber ACC advisory only on the billable-party route', () => {
    const bp = reviewFlagsForCard({ card: card(), procedures: [{ procedure: proc({ accRelated: true, billingRoute: 'billableParty' }), fee: stubFee() }] })
    expect(bp.find((f) => f.text === 'ACC should not bill the patient directly')?.tone).toBe('warn')

    const hospitalAcc = reviewFlagsForCard({ card: card(), procedures: [{ procedure: proc({ accRelated: true, billingRoute: 'hospital', billingReference: 'R' }), fee: stubFee() }] })
    expect(hospitalAcc.some((f) => f.text.startsWith('ACC'))).toBe(false)
  })

  it('(d) flags a manual override with its signed delta vs the natural computation', () => {
    // proc() carries no times/codes, so the natural B/T/M is all zero.
    const overriddenTime: BtmBreakdown = { ...ZERO_BTM, time: { units: 5, source: 'overridden' }, totalUnits: 5 }
    const flags = reviewFlagsForCard({ card: card(), procedures: [{ procedure: proc(), fee: stubFee(overriddenTime) }] })
    expect(flags).toEqual([{ tone: 'neutral', text: 'T adjusted +5 manually', cardId: 'C1', procedureId: 'P1' }])
  })

  it('(d) an override landing on the natural value reads "set manually"', () => {
    const overriddenBase: BtmBreakdown = { ...ZERO_BTM, base: { units: 0, source: 'overridden' } }
    const flags = reviewFlagsForCard({ card: card(), procedures: [{ procedure: proc(), fee: stubFee(overriddenBase) }] })
    expect(flags.some((f) => f.text === 'B set manually')).toBe(true)
  })

  it('yields no flags for a cancelled card', () => {
    const cancelled = card({
      completed: false,
      cancellation: { reason: 'Postponed', by: 'Kirsty W.', role: 'office', source: 'office', atISO: '2026-07-21T09:00:00' },
    })
    expect(reviewFlagsForCard({ card: cancelled, procedures: [] })).toEqual([])
  })

  it('reviewFlagsForList totals flags across cards and excludes cancelled ones', () => {
    const cards = [
      { card: card({ id: 'C1', completed: false }), procedures: [] },
      { card: card({ id: 'C2', completed: false, cancellation: { reason: 'x', by: 'y', role: 'office' as const, source: 'office' as const, atISO: '2026-07-21T09:00:00' } }), procedures: [] },
    ]
    expect(reviewFlagsForList(cards).length).toBe(1)
  })
})

describe('reviewFlags over seeded data (real calculator)', () => {
  it('surfaces Chen\'s seeded manual T override on the design-day PM list', () => {
    const api = createAppStore()
    const marker = SEED_MARKERS.designDayPmList
    if (marker === undefined) throw new Error('missing designDayPmList marker')
    const listId = marker.entityId
    const s = api.getState()
    const list = s.schedule.lists[listId]
    if (list === undefined) throw new Error('no design-day PM list')

    const cards = cardsForList(s, listId).map((c) => ({
      card: c,
      procedures: proceduresForCard(s, c.id).map((p, i) => {
        const view = procedureFee({ procedure: p, list, ordinal: i + 1, masters: s.masters, billingLines: s.schedule.billingLines })
        return { procedure: p, fee: view.fee, baseCode: view.baseCode }
      }),
    }))
    const flags = reviewFlagsForList(cards)
    expect(flags.some((f) => /^T (adjusted|set)/.test(f.text))).toBe(true)
  })
})
