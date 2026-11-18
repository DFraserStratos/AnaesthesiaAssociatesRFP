/**
 * The internal ledger's pure rules (catch-up Phase 36, work item 3): the
 * constructors, both legs moving together, the equation exact to the cent, the
 * partition into anaesthetist scopes, the out-of-balance list, the patient
 * position across payers, the transfer, and the BCTI records read from the
 * payable legs.
 */

import { describe, expect, it } from 'vitest'
import type { AaFeeLedgerPair, BookingLedgerPair, CounterpartyRef, LedgerPair, LedgerTransfer, UnmatchedReceipt } from '../types'
import {
  anaesthetistPayee,
  anaesthetistPosition,
  anaesthetistsOutOfBalance,
  applyDisbursement,
  applyReceipt,
  bctiRecordsOf,
  HOLDING_PAYEE,
  ledgerChecks,
  ledgerPosition,
  newAaFeePair,
  newBookingPair,
  newPrepayTransfer,
  pairStatusLabel,
  patientPosition,
  procedureSharesFrom,
} from './ledger'

const AT = '2026-07-21T10:00:00'
const SOUTER = '34821'
const RUTHERFORD = '29104'

function pair(id: string, total: number, opts: { payee?: string; holding?: boolean; patientId?: string; kind?: 'procedure' | 'prePayment'; counterparty?: CounterpartyRef; mirrored?: boolean } = {}): BookingLedgerPair {
  const p = newBookingPair({
    id,
    kind: opts.kind ?? (opts.holding === true ? 'prePayment' : 'procedure'),
    invoice: { id: `INV-${id}`, invoiceNumber: `AA-${id}`, counterparty: opts.counterparty ?? { kind: 'patient', id: opts.patientId ?? 'PT1' }, total, procedureIds: ['P1'] },
    lines: [{ procedureId: 'P1', amount: Math.round((total / 1.15) * 100) / 100, units: 6 }],
    bookingId: `BK-${id}`,
    listId: 'L1',
    payee: opts.holding === true ? HOLDING_PAYEE : anaesthetistPayee(opts.payee ?? SOUTER),
    patientId: opts.patientId ?? 'PT1',
    atISO: AT,
  })
  if (opts.mirrored === false) return p
  return { ...p, receivable: { ...p.receivable, xeroAccRecId: `XR-${id}` }, ...(p.payable !== undefined ? { payable: { ...p.payable, xeroAccPayId: `XP-${id}` } } : {}) }
}

function receive<P extends LedgerPair>(p: P, amount: number): P {
  return applyReceipt(p, amount, AT).pair
}

function disburse(p: BookingLedgerPair, amount: number): BookingLedgerPair {
  const out = applyDisbursement(p.payable!, amount, AT)
  if (!out.ok) throw new Error(out.code)
  return { ...p, payable: out.leg }
}

const held = (amount: number, anaesthetistId?: string): UnmatchedReceipt => ({
  id: 'UR0001',
  amount,
  reference: 'Bank deposit · SOUTER JULY',
  atISO: AT,
  idempotencyKey: 'K1',
  source: 'webhook',
  status: 'held',
  ...(anaesthetistId !== undefined ? { anaesthetistId } : {}),
})

describe('the constructors', () => {
  it('a Booking pair has both legs, the payable equal to the receivable, the -P number and the stamped payee', () => {
    const p = pair('BC1', 230)
    expect(p.receivable).toMatchObject({ number: 'AA-BC1', amount: 230, receivedAmount: 0 })
    expect(p.payable).toMatchObject({ number: 'AA-BC1-P', amount: 230, releasedAmount: 0, disbursedAmount: 0, payee: { kind: 'anaesthetist', anaesthetistId: SOUTER } })
    expect(p.anaesthetistId).toBe(SOUTER)
  })

  it('a three-Procedure invoice still has one payable leg; its shares sum to the subtotal', () => {
    const lines = [
      { procedureId: 'P1', amount: 100 },
      { procedureId: 'P2', amount: 50.25 },
      { procedureId: 'P3', amount: 49.75 },
      { procedureId: 'P1', amount: -10 },
    ]
    const p = newBookingPair({ id: 'BC2', kind: 'procedure', invoice: { id: 'I', invoiceNumber: 'AA-2', counterparty: { kind: 'hospital', id: 'H' }, total: 218.5, procedureIds: ['P1', 'P2', 'P3'] }, lines, bookingId: 'B', listId: 'L', payee: anaesthetistPayee(SOUTER), patientId: 'PT', atISO: AT })
    expect(Object.keys(p).filter((k) => k === 'payable')).toHaveLength(1)
    expect(p.procedureShares.map((s) => s.amountExGst)).toEqual([90, 50.25, 49.75])
    expect(Math.round(p.procedureShares.reduce((n, s) => n + s.amountExGst, 0) * 100)).toBe(19000)
    expect(procedureSharesFrom([])).toEqual([])
  })

  it('a prepayment pair pays the AA Holding account and is in no anaesthetist scope', () => {
    const p = pair('BC3', 1380, { holding: true })
    expect(p.kind).toBe('prePayment')
    expect(p.payable?.payee).toEqual({ kind: 'holding' })
    expect(p.anaesthetistId).toBeUndefined()
  })

  it('a no-charge invoice has a $0.00 receivable, nothing owed, and no payable', () => {
    const p = newBookingPair({ id: 'BC4', kind: 'procedure', invoice: { id: 'I', invoiceNumber: 'AA-4', counterparty: { kind: 'patient', id: 'PT' }, total: 0, procedureIds: [], noCharge: true }, lines: [], bookingId: 'B', listId: 'L', payee: anaesthetistPayee(SOUTER), patientId: 'PT', atISO: AT })
    expect(p.payable).toBeUndefined()
    expect(p.receivable).toMatchObject({ amount: 0, paidInAtISO: AT })
  })

  it('an AA fee pair has a receivable from the anaesthetist and no payable', () => {
    const fee = newAaFeePair({ id: 'BCF1', aaFeeInvoice: { id: 'AF1', invoiceNumber: 'AA-FEE-1', anaesthetistId: RUTHERFORD, total: 805 }, atISO: AT })
    expect(fee).toMatchObject({ kind: 'aaFee', anaesthetistId: RUTHERFORD, receivable: { amount: 805, counterparty: { kind: 'anaesthetist', id: RUTHERFORD } } })
    expect('payable' in fee).toBe(false)
  })
})

describe('both legs move together', () => {
  it('a half receipt releases exactly half (16 rule); the rest releases the rest and stamps paid once', () => {
    const half = receive(pair('BC1', 230), 115)
    expect([half.receivable.receivedAmount, half.payable!.releasedAmount, half.receivable.paidInAtISO]).toEqual([115, 115, undefined])
    const full = applyReceipt(half, 500, '2026-07-22T09:00:00').pair
    expect([full.receivable.receivedAmount, full.payable!.releasedAmount, full.receivable.paidInAtISO]).toEqual([230, 230, '2026-07-22T09:00:00'])
    // A replay on a fully received receivable changes nothing (the paid date never moves).
    expect(applyReceipt(full, 50, '2026-08-01T09:00:00')).toMatchObject({ added: 0, pair: full })
  })

  it('a disbursement above what is released is refused; the AA Holding account is never paid out', () => {
    const p = receive(pair('BC1', 230), 100)
    expect(applyDisbursement(p.payable!, 100.01, AT)).toEqual({ ok: false, code: 'aboveReleased' })
    expect(applyDisbursement(p.payable!, 100, AT)).toMatchObject({ ok: true, leg: { disbursedAmount: 100 } })
    const h = receive(pair('BC3', 1380, { holding: true }), 1380)
    expect(applyDisbursement(h.payable!, 10, AT)).toEqual({ ok: false, code: 'holdingSystemOnly' })
  })

  it('the status label follows the legs', () => {
    expect(pairStatusLabel(pair('A', 100, { mirrored: false }))).toBe('invoiced')
    expect(pairStatusLabel({ ...pair('A', 100, { mirrored: false }), handoffFailure: { code: 'x', message: 'y' } })).toBe('handoffFailed')
    expect(pairStatusLabel(pair('A', 100))).toBe('handedOff')
    const half = receive(pair('A', 100), 50)
    expect(pairStatusLabel(half)).toBe('partPaid')
    expect(pairStatusLabel(disburse(half, 50))).toBe('partPaidOut')
    expect(pairStatusLabel(disburse(receive(pair('A', 100), 100), 100))).toBe('disbursed')
  })
})

describe('the equation', () => {
  it('a paid, part-paid and disbursed mix is in balance, exact to the cent', () => {
    const pairs: LedgerPair[] = [disburse(receive(pair('A', 230.1), 230.1), 230.1), receive(pair('B', 99.99), 33.33), pair('C', 1000.01), disburse(receive(pair('D', 0.05), 0.05), 0.02)]
    const pos = ledgerPosition(pairs, {}, [])
    expect(pos).toMatchObject({ receivablesOutstanding: 1066.67, received: 263.48, disbursed: 230.12, receiptsHeld: 33.36, payablesDue: 33.36, holdingBalance: 0, imbalance: 0, inBalance: true })
    expect(pos.awaitingCollection).toBe(1066.67)
    expect(pos.checks).toEqual([])
  })

  it('a $120.00 unmatched receipt gives imbalance $120.00 and one check; allocating it or refunding it returns to balance', () => {
    const pairs = [receive(pair('A', 230), 100)]
    const out = ledgerPosition(pairs, {}, [held(120)])
    expect([out.imbalance, out.inBalance, out.checks.map((c) => [c.code, c.amount])]).toEqual([120, false, [['unmatchedReceiptHeld', 120]]])
    const allocated = ledgerPosition([receive(pairs[0]!, 120)], {}, [{ ...held(120), status: 'allocated' }])
    expect([allocated.imbalance, allocated.inBalance]).toEqual([0, true])
    const refunded = ledgerPosition(pairs, {}, [{ ...held(120), status: 'refunded' }])
    expect([refunded.imbalance, refunded.inBalance]).toEqual([0, true])
  })

  it('an AA fee pair, paid or unpaid, never moves the imbalance', () => {
    const fee: AaFeeLedgerPair = newAaFeePair({ id: 'F', aaFeeInvoice: { id: 'AF', invoiceNumber: 'AA-FEE-1', anaesthetistId: SOUTER, total: 805 }, atISO: AT })
    const base = [receive(pair('A', 230), 230)]
    const unpaid = ledgerPosition([...base, fee], {}, [])
    const paid = ledgerPosition([...base, receive(fee, 805)], {}, [])
    expect([unpaid.imbalance, paid.imbalance, unpaid.receiptsHeld, paid.receiptsHeld]).toEqual([0, 0, 230, 230])
    expect(unpaid.aaFees).toEqual({ invoiced: 805, received: 0, outstanding: 805 })
    expect(paid.aaFees).toEqual({ invoiced: 805, received: 805, outstanding: 0 })
    expect(anaesthetistPosition([...base, fee], {}, [], SOUTER).theyOweAa).toBe(805)
  })

  it('a prepayment adds to receivables outstanding and, once paid, to the holding balance, never to payables due; it gives no BCTI', () => {
    const pp = pair('PP', 1380, { holding: true })
    expect(ledgerPosition([pp], {}, [])).toMatchObject({ receivablesOutstanding: 1380, holdingBalance: 0, payablesDue: 0, inBalance: true })
    const paid = receive(pp, 690)
    expect(ledgerPosition([paid], {}, [])).toMatchObject({ received: 690, holdingBalance: 690, payablesDue: 0, imbalance: 0, inBalance: true })
    expect(bctiRecordsOf([paid])).toEqual([])
  })
})

describe('the transfer (27a, promoted)', () => {
  const collect = receive(pair('PP', 1380, { holding: true }), 690)
  const made = newPrepayTransfer({ id: 'PXT0001', collectPair: collect, listId: 'L1', payeeAnaesthetistId: SOUTER, atISO: AT, transfers: {} })
  const transfer = (made as { ok: true; transfer: LedgerTransfer }).transfer
  const transfers = { [transfer.id]: transfer }

  it('is two payable legs and no receivable: the held amount out, the invoice total in, released as paid', () => {
    expect(made.ok).toBe(true)
    expect(transfer.out).toEqual({ amount: 690 })
    expect(transfer.in).toMatchObject({ payee: { kind: 'anaesthetist', anaesthetistId: SOUTER }, amount: 1380, releasedAmount: 690, disbursedAmount: 0 })
    expect('receivable' in transfer).toBe(false)
  })

  it('moves the held amount: the holding balance falls by it, payables due rise by it, received and disbursed unchanged, in balance', () => {
    const before = ledgerPosition([collect], {}, [])
    const after = ledgerPosition([collect], transfers, [])
    expect(after.holdingBalance).toBe(before.holdingBalance - 690)
    expect(after.payablesDue).toBe(before.payablesDue + 690)
    expect([after.received, after.disbursed, after.imbalance, after.inBalance]).toEqual([before.received, before.disbursed, 0, true])
  })

  it('money arriving after the transfer releases on its in leg; the account stays at what it held', () => {
    const rest = applyReceipt(collect, 690, AT, transfer)
    expect(rest.pair.payable!.releasedAmount).toBe(690)
    expect(rest.transfer!.in.releasedAmount).toBe(1380)
    const pos = ledgerPosition([rest.pair], { [transfer.id]: rest.transfer! }, [])
    expect(pos).toMatchObject({ holdingBalance: 0, payablesDue: 1380, imbalance: 0, inBalance: true })
  })

  it('refuses a prepayment already transferred, and a pair that is not one', () => {
    expect(newPrepayTransfer({ id: 'PXT0002', collectPair: collect, listId: 'L1', payeeAnaesthetistId: SOUTER, atISO: AT, transfers })).toEqual({ ok: false, code: 'alreadyTransferred' })
    expect(newPrepayTransfer({ id: 'PXT0002', collectPair: pair('A', 10), listId: 'L1', payeeAnaesthetistId: SOUTER, atISO: AT, transfers: {} })).toEqual({ ok: false, code: 'notPrepayment' })
  })
})

describe('the two scopes and the out-of-balance list', () => {
  const pairs: LedgerPair[] = [disburse(receive(pair('A', 300), 300), 200), receive(pair('B', 150, { payee: RUTHERFORD }), 75), receive(pair('PP', 1380, { holding: true }), 1380)]

  it('the anaesthetist positions plus the unattributed held receipts and the holding balance partition the whole ledger', () => {
    const unmatched = [held(120), { ...held(40, SOUTER), id: 'UR0002', idempotencyKey: 'K2' }]
    const whole = ledgerPosition(pairs, {}, unmatched)
    const s = anaesthetistPosition(pairs, {}, unmatched, SOUTER)
    const r = anaesthetistPosition(pairs, {}, unmatched, RUTHERFORD)
    expect(Math.round((s.imbalance + r.imbalance + 120) * 100)).toBe(Math.round(whole.imbalance * 100))
    expect(Math.round((s.dueNow + r.dueNow) * 100)).toBe(Math.round(whole.payablesDue * 100))
    expect(s).toMatchObject({ dueNow: 100, awaitingCollection: 0, owedToThem: 100, collected: 300, paidOut: 200, unmatchedHeld: 40, imbalance: 40, inBalance: false })
    expect(r).toMatchObject({ dueNow: 75, awaitingCollection: 75, collected: 75, imbalance: 0, inBalance: true })
  })

  it('an attributed held receipt puts exactly that anaesthetist on the list with its amount; an unattributed one puts no one there', () => {
    const ids = [SOUTER, RUTHERFORD]
    expect(anaesthetistsOutOfBalance(pairs, {}, [], ids)).toEqual([])
    const named = anaesthetistsOutOfBalance(pairs, {}, [held(120, SOUTER)], ids)
    expect(named.map((r) => [r.anaesthetistId, r.imbalance, r.checks.map((c) => c.code)])).toEqual([[SOUTER, 120, ['unmatchedReceiptHeld']]])
    expect(anaesthetistsOutOfBalance(pairs, {}, [held(120)], ids)).toEqual([])
    expect(anaesthetistsOutOfBalance(pairs, {}, [{ ...held(120, SOUTER), status: 'allocated' }], ids)).toEqual([])
  })

  it('checks explain a broken pair (released not received, disbursed above released)', () => {
    const broken = { ...pair('X', 100), payable: { ...pair('X', 100).payable!, releasedAmount: 30, disbursedAmount: 40 } }
    expect(ledgerChecks([broken], {}, []).map((c) => [c.code, c.amount])).toEqual([
      ['releasedNotReceived', 30],
      ['disbursedAboveReleased', 10],
    ])
  })
})

describe('the patient position (DM-23, Phase 40 builds on it)', () => {
  it('reaches every invoice of the patient, across anaesthetists and payers, each with its billable party', () => {
    const pairs = [
      receive(pair('A', 300, { patientId: 'PT9' }), 300),
      receive(pair('B', 200, { patientId: 'PT9', payee: RUTHERFORD, counterparty: { kind: 'payer', id: 'BP1' } }), 50),
      pair('C', 500, { patientId: 'PT9', counterparty: { kind: 'insurer', id: 'nib' } }),
      pair('D', 999, { patientId: 'PT1' }),
    ]
    const pos = patientPosition(pairs, 'PT9')
    expect(pos.rows.map((r) => [r.invoiceNumber, r.anaesthetistId, r.billedTo.kind, r.status, r.outstanding])).toEqual([
      ['AA-A', SOUTER, 'patient', 'paid', 0],
      ['AA-B', RUTHERFORD, 'payer', 'partPaid', 150],
      ['AA-C', SOUTER, 'insurer', 'unpaid', 500],
    ])
    expect([pos.outstandingTotal, pos.oldestUnpaidRaisedAtISO]).toEqual([650, AT])
  })
})

describe('the BCTI records (16 count, read from the payable legs)', () => {
  it('one record per procedure payable leg, none for a fee, a prepayment or a transfer; paid date only once fully received', () => {
    const fee = newAaFeePair({ id: 'F', aaFeeInvoice: { id: 'AF', invoiceNumber: 'AA-FEE-1', anaesthetistId: SOUTER, total: 805 }, atISO: AT })
    const records = bctiRecordsOf([receive(pair('A', 100), 100), receive(pair('B', 100, { mirrored: false }), 50), pair('PP', 1380, { holding: true }), fee])
    // Keyed on the pair id, never the mirror id, so a record counted before the hand-off is the same one after.
    expect(records.map((r) => [r.accPayId, r.billNumber, r.anaesthetistId, r.receivablePaidAtISO ?? null])).toEqual([
      ['A', 'AA-A-P', SOUTER, AT],
      ['B', 'AA-B-P', SOUTER, null],
    ])
    const mirrored = receive(pair('B', 100), 50)
    expect(bctiRecordsOf([mirrored])[0]!.accPayId).toBe(bctiRecordsOf([receive(pair('B', 100, { mirrored: false }), 50)])[0]!.accPayId)
  })

  it('same input gives deep-equal output', () => {
    const build = () => ledgerPosition([receive(pair('A', 230), 115), pair('PP', 1380, { holding: true })], {}, [held(120, SOUTER)])
    expect(build()).toEqual(build())
  })
})
