import { describe, expect, it } from 'vitest'
import type { PayeeRef } from '../types'
import { applyHolds, buildWeekRun, netNegatives, paymentSchedule, remittanceAdvice, runExclusionFor, type OpenNegative, type RunLegInput } from './payablesRun'

const sharma: PayeeRef = { kind: 'anaesthetist', anaesthetistId: 'SHARMA' }
const souter: PayeeRef = { kind: 'anaesthetist', anaesthetistId: 'SOUTER' }

function leg(n: number, amount: number, payee: PayeeRef = sharma, extra: Partial<RunLegInput> = {}): RunLegInput {
  return {
    pairId: `BC${String(n).padStart(4, '0')}`,
    kind: 'pair',
    payee,
    billNumber: `AA-2026-${String(n).padStart(4, '0')}-P`,
    receivableInvoiceNumber: `AA-2026-${String(n).padStart(4, '0')}`,
    serviceDateISO: `2026-11-${String(1 + (n % 20)).padStart(2, '0')}`,
    payerName: 'Payer',
    available: amount,
    nettable: true,
    ...extra,
  }
}
const neg = (id: string, open: number, issuedAtISO = '2026-11-13T09:00:00', anaesthetistId = 'SHARMA'): OpenNegative => ({ id, anaesthetistId, issuedAtISO, open })

describe('runExclusionFor (the one standing exclusion point)', () => {
  it("keeps a collect payable to the AA Holding account out of every run (27a)", () => {
    expect(runExclusionFor({ payee: { kind: 'holding' } })).toBe('heldInHoldingAccount')
    expect(runExclusionFor({ payee: sharma })).toBeNull()
  })
  it('reports an excluded leg with its amount and keeps it off the lines', () => {
    const run = buildWeekRun({ legs: [leg(1, 100), leg(2, 250, { kind: 'holding' })], negatives: [] })
    expect(run.lines.map((l) => l.pairId)).toEqual(['BC0001'])
    expect(run.excluded).toEqual([{ pairId: 'BC0002', reason: 'heldInHoldingAccount', amount: 250 }])
  })
})

describe('US-10.2.5: netting a negative in the payment run', () => {
  const nineteen = Array.from({ length: 19 }, (_, i) => leg(i + 1, 152.38))
  it('19 positives and one negative pay the net total', () => {
    const run = buildWeekRun({ legs: nineteen, negatives: [neg('NEG0001', 365.7)] })
    expect(run.byAnaesthetist).toEqual([{ anaesthetistId: 'SHARMA', bctiCount: 19, positives: 2895.22, netted: 365.7, net: 2529.52, remainingToNet: 0 }])
    // Allocated to bills oldest first, exact cents.
    expect(run.nettings).toEqual([{ negativeInvoiceId: 'NEG0001', anaesthetistId: 'SHARMA', amount: 365.7, allocations: [{ pairId: run.lines[0]!.pairId, amount: 152.38 }, { pairId: run.lines[1]!.pairId, amount: 152.38 }, { pairId: run.lines[2]!.pairId, amount: 60.94 }] }])
  })
  it('the remittance advice lists all twenty with the negative netted', () => {
    const run = buildWeekRun({ legs: nineteen, negatives: [neg('NEG0001', 365.7)] })
    const advice = remittanceAdvice(run, 'SHARMA', () => ({ state: 'paid', atISO: '2026-11-24T10:00:00' }))!
    expect(advice.lines).toHaveLength(19)
    expect(advice.netted).toEqual([{ negativeInvoiceId: 'NEG0001', amount: 365.7 }])
    expect([advice.positives, advice.nettedTotal, advice.net, advice.remainingToNet, advice.status]).toEqual([2895.22, 365.7, 2529.52, 0, 'paid'])
  })
  it('a negative larger than the positives nets to $0.00 and leaves the rest to net', () => {
    const t = netNegatives(buildWeekRun({ legs: [leg(1, 100)], negatives: [] }).lines, [neg('N1', 130)]).byAnaesthetist[0]!
    expect([t.positives, t.netted, t.net, t.remainingToNet]).toEqual([100, 100, 0, 30])
  })
  it('a negative exactly equal to the positives nets to zero with nothing left', () => {
    const t = buildWeekRun({ legs: [leg(1, 100)], negatives: [neg('N1', 100)] }).byAnaesthetist[0]!
    expect([t.net, t.remainingToNet]).toEqual([0, 0])
  })
  it('nets two negatives oldest first', () => {
    const run = buildWeekRun({ legs: [leg(1, 100)], negatives: [neg('N2', 80, '2026-11-15T09:00:00'), neg('N1', 50, '2026-11-14T09:00:00')] })
    expect(run.nettings.map((n) => [n.negativeInvoiceId, n.amount])).toEqual([['N1', 50], ['N2', 50]])
    expect(run.byAnaesthetist[0]!.remainingToNet).toBe(30)
  })
  it('an anaesthetist with an open negative and no positives is not in the run (OQ-71)', () => {
    const run = buildWeekRun({ legs: [leg(1, 100, souter)], negatives: [neg('N1', 40)] })
    expect(run.byAnaesthetist.map((t) => t.anaesthetistId)).toEqual(['SOUTER'])
    expect(run.nettings).toEqual([])
  })
  it('splits odd cents across allocations exactly', () => {
    const run = buildWeekRun({ legs: [leg(1, 0.01), leg(2, 0.02), leg(3, 10)], negatives: [neg('N1', 0.05)] })
    expect(run.nettings[0]!.allocations).toEqual([{ pairId: 'BC0001', amount: 0.01 }, { pairId: 'BC0002', amount: 0.02 }, { pairId: 'BC0003', amount: 0.02 }])
    expect(run.byAnaesthetist[0]!.net).toBe(9.98)
  })
  it('never nets against a bill it cannot allocate to (a transfer)', () => {
    const run = buildWeekRun({ legs: [leg(1, 100, sharma, { kind: 'transfer', nettable: false })], negatives: [neg('N1', 40)] })
    expect(run.byAnaesthetist[0]).toMatchObject({ positives: 100, netted: 0, net: 100, remainingToNet: 40 })
  })
})

describe('US-10.2.7: holds roll forward', () => {
  const hold = { reason: 'Receipt not on the bank download', atISO: '2026-11-24T10:00:00', by: 'Kirsty W.' }
  it('a held line is out of the totals and the schedule, and rolls into the next run tagged', () => {
    const run = buildWeekRun({ legs: [leg(1, 100), leg(2, 60)], negatives: [] })
    const held = applyHolds(run.lines, new Map([['BC0002', hold]]), [])
    expect(held.byAnaesthetist[0]).toMatchObject({ bctiCount: 1, positives: 100, net: 100 })
    expect(paymentSchedule(held, () => '12-****-****567-00').total).toBe(100)
    const next = buildWeekRun({ legs: [leg(2, 60)], negatives: [], heldEarlier: new Map([['BC0002', 'PR0001']]) })
    expect(next.lines[0]!.rolledFromRunId).toBe('PR0001')
    // Returning it to the run clears the hold.
    expect(applyHolds(held.lines, new Map(), []).lines.every((l) => l.heldOut === undefined)).toBe(true)
  })
  it('holding every positive leaves the negative open', () => {
    const run = buildWeekRun({ legs: [leg(1, 100)], negatives: [neg('N1', 40)] })
    const held = applyHolds(run.lines, new Map([['BC0001', hold]]), [neg('N1', 40)])
    expect(held.nettings).toEqual([])
    expect(held.byAnaesthetist).toEqual([])
  })
})

describe('the documents', () => {
  it('an anaesthetist with no bank account is in the schedule with a null destination', () => {
    const run = buildWeekRun({ legs: [leg(1, 100), leg(2, 50, souter)], negatives: [] })
    const s = paymentSchedule(run, (id) => (id === 'SOUTER' ? null : '12-****-****567-00'))
    expect(s.rows.map((r) => [r.anaesthetistId, r.net, r.destinationMasked])).toEqual([['SHARMA', 100, '12-****-****567-00'], ['SOUTER', 50, null]])
    expect([s.bctiCount, s.total]).toEqual([2, 150])
  })
  it('a part-released leg takes exactly its released remainder, and a leg already in an unsettled run is not taken twice', () => {
    const run = buildWeekRun({ legs: [leg(1, 76.19), leg(2, 0)], negatives: [] })
    expect(run.lines.map((l) => [l.pairId, l.amount])).toEqual([['BC0001', 76.19]])
  })
  it('the advice is awaiting Xero until every line is detected', () => {
    const run = buildWeekRun({ legs: [leg(1, 100), leg(2, 50)], negatives: [] })
    expect(remittanceAdvice(run, 'SHARMA', (id) => (id === 'BC0001' ? { state: 'paid', atISO: 'x' } : { state: 'awaitingXero' }))!.status).toBe('awaitingXero')
    expect(remittanceAdvice(run, 'SOUTER', () => ({ state: 'awaitingXero' }))).toBeNull()
  })
  it('is deterministic', () => {
    const input = { legs: [leg(3, 10), leg(1, 20), leg(2, 30, souter)], negatives: [neg('N1', 5)] }
    expect(buildWeekRun(input)).toEqual(buildWeekRun(input))
  })
})
