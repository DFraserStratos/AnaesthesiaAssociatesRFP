import { describe, expect, it } from 'vitest'
import type { Invoice, LedgerPair, LedgerTransfer, UnmatchedReceipt } from '../types'
import { anaesthetistPayee, anaesthetistPosition, applyCredit, applyCreditToTransfer, applyReceipt, HOLDING_PAYEE, newAaFeePair, newBookingPair, newPrepayTransfer } from './ledger'
import { anaesthetistLedgerRows, ledgerSentence, receiptsToPlace } from './ledgerLists'
import type { AgedItem, ReconciliationStatus } from './reconciliation'

const AT = '2026-11-20T09:00:00.000Z'

function pair(id: string, kind: 'procedure' | 'prePayment', total: number, payee: ReturnType<typeof anaesthetistPayee> | typeof HOLDING_PAYEE) {
  return newBookingPair({
    id,
    kind,
    invoice: { id: `INV-${id}`, invoiceNumber: `AA-${id}`, counterparty: { kind: 'patient', id: 'PT1' } as Invoice['counterparty'], total, procedureIds: [] },
    lines: [],
    bookingId: `B-${id}`,
    listId: `L-${id}`,
    payee,
    patientId: 'PT1',
    atISO: AT,
  })
}

function plan(total: number, paid: number) {
  return { receivableCredited: total, negativeInvoiceTotal: total, offsetAgainstPayable: total, releaseCancelled: paid, heldForPayer: paid, recoveryDue: 0 }
}

/** A, with a plain pair part paid, a credited pair and an AA fee; B, with a transferred prepayment and a credited transferred one; C, nothing. */
function fixture(): { pairs: LedgerPair[]; transfers: Record<string, LedgerTransfer>; unmatched: UnmatchedReceipt[] } {
  const plain = applyReceipt(pair('P1', 'procedure', 1000, anaesthetistPayee('A')), 400, AT).pair
  const toCredit = applyReceipt(pair('P2', 'procedure', 600, anaesthetistPayee('A')), 250, AT).pair
  const credited = applyCredit(toCredit, plan(600, 250), { creditNoteId: 'CN1', atISO: AT })
  if (!credited.ok) throw new Error('credit refused')
  const fee = newAaFeePair({ id: 'F1', aaFeeInvoice: { id: 'FI1', invoiceNumber: 'AAF-1', anaesthetistId: 'A', total: 80 }, atISO: AT })

  const pre = applyReceipt(pair('P3', 'prePayment', 500, HOLDING_PAYEE), 500, AT).pair
  const t1 = newPrepayTransfer({ id: 'T1', collectPair: pre, listId: 'L-P3', payeeAnaesthetistId: 'B', atISO: AT, transfers: {} })
  if (!t1.ok) throw new Error('transfer refused')

  const pre2 = applyReceipt(pair('P4', 'prePayment', 300, HOLDING_PAYEE), 100, AT).pair
  const t2 = newPrepayTransfer({ id: 'T2', collectPair: pre2, listId: 'L-P4', payeeAnaesthetistId: 'B', atISO: AT, transfers: {} })
  if (!t2.ok) throw new Error('transfer refused')
  const pre2Credited = applyCredit(pre2, plan(300, 100), { creditNoteId: 'CN2', atISO: AT, reversedOn: 'transfer' })
  if (!pre2Credited.ok) throw new Error('credit refused')
  const t2Credited = applyCreditToTransfer(t2.transfer, plan(300, 100))

  const unmatched: UnmatchedReceipt[] = [
    { id: 'U1', amount: 120, reference: 'x', atISO: '2026-11-21T09:00:00.000Z', idempotencyKey: 'k1', source: 'webhook', anaesthetistId: 'A', status: 'held' },
    { id: 'U0', amount: 30.5, reference: 'y', atISO: '2026-11-19T09:00:00.000Z', idempotencyKey: 'k0', source: 'webhook', status: 'held' },
    { id: 'U2', amount: 99, reference: 'z', atISO: '2026-11-18T09:00:00.000Z', idempotencyKey: 'k2', source: 'webhook', status: 'refunded' },
  ]
  return { pairs: [plain, credited.pair, fee, pre, pre2Credited.pair], transfers: { T1: t1.transfer, T2: t2Credited }, unmatched }
}

describe('anaesthetistLedgerRows', () => {
  const { pairs, transfers, unmatched } = fixture()
  const rows = anaesthetistLedgerRows(pairs, transfers, unmatched, ['C', 'A', 'B'])

  it('one row per id in the order given, a zero row for someone with nothing', () => {
    expect(rows.map((r) => r.anaesthetistId)).toEqual(['C', 'A', 'B'])
    expect(rows[0]).toEqual({ anaesthetistId: 'C', billed: 0, paidIntoAa: 0, disbursed: 0, aaOwesThem: 0, theyOweAa: 0, inBalance: true, imbalance: 0, checks: [] })
  })

  it('equals anaesthetistPosition field for field on credits, transfers, fees and a held receipt', () => {
    for (const row of rows) {
      const p = anaesthetistPosition(pairs, transfers, unmatched, row.anaesthetistId)
      expect({ paidIntoAa: row.paidIntoAa, disbursed: row.disbursed, aaOwesThem: row.aaOwesThem, theyOweAa: row.theyOweAa, inBalance: row.inBalance, imbalance: row.imbalance, checks: row.checks }).toEqual({
        paidIntoAa: p.collected,
        disbursed: p.paidOut,
        aaOwesThem: p.owedToThem,
        theyOweAa: p.theyOweAa,
        inBalance: p.inBalance,
        imbalance: p.imbalance,
        checks: p.checks,
      })
    }
    expect(rows[1]).toMatchObject({ theyOweAa: 80, imbalance: 120, inBalance: false })
  })

  it('billed: a credited pair counts $0.00, net of its reversal', () => {
    // A's plain $1,000.00 pair only; the $600.00 credited pair adds nothing.
    expect(rows[1]!.billed).toBe(1000)
  })

  it('billed: a transferred prepayment counts once, for whoever its transfer pays, never on the holding payable', () => {
    // B: T1's $500.00; T2 was credited on the transfer, so it adds nothing.
    expect(rows[2]!.billed).toBe(500)
    expect(rows[0]!.billed).toBe(0)
  })

  it('an id passed twice gets one row; an id not passed gets none', () => {
    expect(anaesthetistLedgerRows(pairs, transfers, unmatched, ['A', 'A']).map((r) => r.anaesthetistId)).toEqual(['A'])
    expect(anaesthetistLedgerRows(pairs, transfers, unmatched, ['C'])).toHaveLength(1)
  })
})

describe('receiptsToPlace', () => {
  it('the held receipts only, oldest first, with count and total to the cent', () => {
    const out = receiptsToPlace(fixture().unmatched)
    expect(out.receipts.map((r) => r.id)).toEqual(['U0', 'U1'])
    expect(out).toMatchObject({ count: 2, total: 150.5 })
  })
  it('none held: empty', () => {
    expect(receiptsToPlace([])).toEqual({ receipts: [], total: 0, count: 0 })
  })
})

const item = (id: string, source: AgedItem['source'], amount: number): AgedItem => ({ id, label: id, amount, sinceISO: AT, source, ageDays: 0, checkId: 'x' })
const status = (items: AgedItem[]): ReconciliationStatus => ({ status: items.length === 0 ? 'square' : 'outOfBalance', failing: [], items })
const DASHES = /[–—]/

describe('ledgerSentence', () => {
  it('square: success, "The books are square", every account square', () => {
    const s = ledgerSentence(status([]), { ledgerImbalance: 0, anaesthetistsOutOfBalance: 0 })
    expect(s).toMatchObject({ tone: 'success', square: true, title: 'The books are square', detail: ['Every account is square'] })
  })

  it('square status reads square whatever else; an account out of balance only adds its line and a warning', () => {
    const s = ledgerSentence(status([]), { ledgerImbalance: 0, anaesthetistsOutOfBalance: 2 })
    expect(s).toMatchObject({ tone: 'warning', square: true, title: 'The books are square', detail: ['2 accounts are out of balance'] })
  })

  it('a held receipt: out by its amount, warning, named with its count', () => {
    const s = ledgerSentence(status([item('U1', 'unmatchedReceipt', 120)]), { ledgerImbalance: 120, anaesthetistsOutOfBalance: 1 })
    expect(s).toMatchObject({ tone: 'warning', square: false, title: 'The books are out by $120.00', detail: ['1 receipt that matches no invoice', '1 account is out of balance'] })
  })

  it('Xero items only: not square, each kind named by what it is', () => {
    const kinds = new Map([
      ['Q1', 'handoff' as const],
      ['Q2', 'handoff' as const],
      ['Q3', 'paymentSync' as const],
      ['Q4', 'journal' as const],
      ['Q5', 'correction' as const],
    ])
    const s = ledgerSentence(
      status([item('Q1', 'xeroQueue', 10), item('Q2', 'xeroQueue', 20), item('Q3', 'xeroQueue', 5), item('Q4', 'xeroQueue', 1), item('Q5', 'xeroQueue', 2), item('Q9', 'xeroQueue', 3), item('D1', 'xeroDivergence', 7), item('D2', 'xeroDivergence', 8), item('BL1', 'bankLine', 9)]),
      { ledgerImbalance: 0, anaesthetistsOutOfBalance: 0, xeroQueueKinds: kinds },
    )
    expect(s.tone).toBe('warning')
    expect(s.title).toBe('The books are not square')
    expect(s.detail).toEqual([
      '2 pairs not yet in Xero',
      '1 credit not yet in Xero',
      '1 transfer not yet in Xero',
      '1 payment not yet recorded in Xero',
      '1 item waiting for Xero',
      '2 changes made in Xero',
      '1 bank line Xero could not match',
      'Every account is square',
    ])
    expect(s.parts.find((p) => p.kind === 'pairNotInXero')).toMatchObject({ count: 2, amount: 30 })
  })

  it('a ledger difference no held receipt explains: error', () => {
    const s = ledgerSentence(status([item('Q1', 'xeroQueue', 10)]), { ledgerImbalance: -42.5, anaesthetistsOutOfBalance: 3 })
    expect(s).toMatchObject({ tone: 'error', title: 'The books are out by $42.50' })
    expect(s.detail).toContain('3 accounts are out of balance')
  })

  it('plain copy: no en or em dashes, no build words', () => {
    const s = ledgerSentence(status([item('U1', 'unmatchedReceipt', 1), item('U2', 'unmatchedReceipt', 2), item('B', 'bankLine', 1), item('B2', 'bankLine', 1)]), { ledgerImbalance: 3, anaesthetistsOutOfBalance: 1 })
    expect(s.detail).toContain('2 receipts that match no invoice')
    expect(s.detail).toContain('2 bank lines Xero could not match')
    for (const line of [s.title, ...s.detail]) {
      expect(line).not.toMatch(DASHES)
      expect(line).not.toMatch(/slot|swap|timesheet/i)
    }
  })
})
