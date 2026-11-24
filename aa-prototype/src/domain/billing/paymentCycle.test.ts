import { describe, expect, it } from 'vitest'
import { DEMO_TODAY } from '../clock'
import { defaultPaymentCycleSettings } from '../warnings/settings'
import { cycleFor, cycleLabel, cycleOfId, cycleRangeLabel, isoWeekOf, nextCycleId, plannedDayLabel, reconcileWeek, weekAnomalies, weekdayName } from './paymentCycle'

const S = defaultPaymentCycleSettings()
const fmt = (n: number) => `$${n.toFixed(2)}`

describe('ISO weeks (US-10.2.7)', () => {
  it('names the demo day Week 48 of 2026', () => {
    expect(isoWeekOf(DEMO_TODAY)).toEqual({ isoYear: 2026, isoWeek: 48 })
    expect(cycleFor(DEMO_TODAY, S).cycleId).toBe('2026-W48')
  })
  it('is right at the year ends: 2026 has 53 weeks', () => {
    expect(isoWeekOf('2026-01-01')).toEqual({ isoYear: 2026, isoWeek: 1 })
    expect(isoWeekOf('2026-12-31')).toEqual({ isoYear: 2026, isoWeek: 53 })
    expect(isoWeekOf('2027-01-01')).toEqual({ isoYear: 2026, isoWeek: 53 })
    expect(isoWeekOf('2027-01-04')).toEqual({ isoYear: 2027, isoWeek: 1 })
    expect(nextCycleId('2026-W53', S)).toBe('2027-W01')
    expect(cycleOfId('2026-W53', S).weekStartISO).toBe('2026-12-28')
  })
  it('reads a timestamp by its date', () => {
    expect(isoWeekOf('2026-11-29T23:59:00')).toEqual({ isoYear: 2026, isoWeek: 48 })
    expect(isoWeekOf('2026-11-30T00:00:00')).toEqual({ isoYear: 2026, isoWeek: 49 })
  })
})

describe('cycleFor', () => {
  it("gives Week 48's range and planned close, check and schedule days", () => {
    const c = cycleFor(DEMO_TODAY, S)
    expect(c).toMatchObject({ weekStartISO: '2026-11-23', weekEndISO: '2026-11-29', closeDateISO: '2026-11-27', checkDateISO: '2026-11-30', scheduleDateISO: '2026-12-01' })
    expect(cycleLabel(c)).toBe('Week 48')
    expect(cycleRangeLabel(c)).toBe('23 Nov to 29 Nov 2026')
    expect(plannedDayLabel(c.closeDateISO)).toBe('Friday 27 Nov')
  })
  it('follows a changed setting (the accountant moves the days)', () => {
    const c = cycleFor(DEMO_TODAY, { weekIdentity: 'isoWeek', closeWeekday: 7, checkWeekday: 1, scheduleWeekday: 4 })
    expect(c).toMatchObject({ closeDateISO: '2026-11-29', checkDateISO: '2026-11-30', scheduleDateISO: '2026-12-03' })
  })
  it('round-trips a cycle id and steps a week', () => {
    expect(cycleOfId('2026-W48', S).weekStartISO).toBe('2026-11-23')
    expect(nextCycleId('2026-W48', S)).toBe('2026-W49')
  })
  it('names weekdays from the setting', () => {
    expect(weekdayName(S.closeWeekday)).toBe('Friday')
    expect(weekdayName(S.checkWeekday)).toBe('Monday')
    expect(weekdayName(S.scheduleWeekday)).toBe('Tuesday')
  })
})

describe('reconcileWeek and weekAnomalies', () => {
  const receipts = [
    { receiptId: 'R1', pairId: 'P1', reference: 'AA-1', amount: 100, atISO: '2026-11-24T09:00:00' },
    { receiptId: 'R2', pairId: 'P2', reference: 'AA-2', amount: 50, atISO: '2026-11-24T09:00:00' },
  ]
  const lines = [
    { pairId: 'P1', anaesthetistId: 'A1', billNumber: 'AA-1-P' },
    { pairId: 'P2', anaesthetistId: 'A1', billNumber: 'AA-2-P' },
  ]
  it('raises nothing for a matched week', () => {
    const found = reconcileWeek({ receipts, bankLines: [{ id: 'B1', reference: 'AA-1', amount: 100 }, { id: 'B2', reference: 'AA-2', amount: 50 }] })
    expect(found).toEqual([])
    expect(weekAnomalies({ runId: 'PR1', lines, reconciliation: found, missingBank: new Set(), formatAmount: fmt })).toEqual([])
  })
  it('raises one anomaly each for a missing line and a different amount, naming its pair', () => {
    const found = reconcileWeek({ receipts, bankLines: [{ id: 'B1', reference: 'AA-1', amount: 100, removedByDemo: true }, { id: 'B2', reference: 'AA-2', amount: 45 }] })
    expect(found.map((f) => [f.kind, f.pairId])).toEqual([['receiptNotOnBank', 'P1'], ['bankAmountDiffers', 'P2']])
    const anomalies = weekAnomalies({ runId: 'PR1', lines, reconciliation: found, missingBank: new Set(), formatAmount: fmt })
    expect(anomalies.map((a) => [a.id, a.kind, a.pairIds, a.status])).toEqual([
      ['PR1-A1', 'receiptNotOnBank', ['P1'], 'open'],
      ['PR1-A2', 'bankAmountDiffers', ['P2'], 'open'],
    ])
    expect(anomalies[1]!.detail).toBe('The receipt of $50.00 for AA-2 shows as $45.00 on the bank download.')
  })
  it('raises one noBankAccount per anaesthetist with no account on file, deterministically', () => {
    const run = () => weekAnomalies({ runId: 'PR2', lines: [...lines, { pairId: 'P3', anaesthetistId: 'A2', billNumber: 'AA-3-P' }], reconciliation: [], missingBank: new Set(['A1']), formatAmount: fmt })
    expect(run()).toEqual([{ id: 'PR2-A1', kind: 'noBankAccount', pairIds: ['P1', 'P2'], anaesthetistId: 'A1', detail: 'No bank account on file.', status: 'open' }])
    expect(run()).toEqual(run())
  })
})
