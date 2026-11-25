/**
 * The Ledger tab's reads (Phase 64): the one-pass rows hold parity with
 * `anaesthetistPosition` at the core seed and at practice scale, the
 * out-of-balance count matches Greg's list, and the sentence and the receipts
 * to place follow the store's own actions.
 */

import { beforeAll, describe, expect, it } from 'vitest'
import { createAppStore, freshAppState, practiceAppState, type AppState } from './appStore'
import { anaesthetistLedgerPosition, anaesthetistsOutOfBalanceOf, ledgerPositionOf } from './ledgerSelectors'
import { reconciliationStatusOf } from './reconciliationSelectors'
import { anaesthetistLedgerRowsOf, ledgerSentenceOf, receiptsToPlaceOf } from './ledgerListSelectors'
import { injectUnmatchedReceipt, UNMATCHED_RECEIPT_DEMO } from './ledgerDemo'
import { allocateUnmatchedReceipt, markUnmatchedRefunded } from './ledgerActions'
import { TEST_OFFICE } from '../test/approvePrepayments'
import { isBookingPair } from '../domain/billing/ledger'
import { formatMoney } from '../domain/billing/money'
import { surnameOf } from '../shared/format'
import { ANAE } from '../domain/seed'
import type { XeroQueueItem } from '../domain/types'

function expectParity(state: AppState): void {
  const rows = anaesthetistLedgerRowsOf(state)
  expect(rows).toHaveLength(Object.keys(state.masters.anaesthetists).length)
  for (const row of rows) {
    const p = anaesthetistLedgerPosition(state, row.anaesthetistId)
    expect({ paidIntoAa: row.paidIntoAa, disbursed: row.disbursed, aaOwesThem: row.aaOwesThem, theyOweAa: row.theyOweAa, inBalance: row.inBalance, imbalance: row.imbalance }, row.anaesthetistId).toEqual({
      paidIntoAa: p.collected,
      disbursed: p.paidOut,
      aaOwesThem: p.owedToThem,
      theyOweAa: p.theyOweAa,
      inBalance: p.inBalance,
      imbalance: p.imbalance,
    })
  }
  const out = anaesthetistsOutOfBalanceOf(state).map((r) => r.anaesthetistId).sort()
  expect(rows.filter((r) => !r.inBalance).map((r) => r.anaesthetistId).sort()).toEqual(out)
}

describe('anaesthetistLedgerRowsOf at the core seed', () => {
  const seed = freshAppState()

  it('holds parity with anaesthetistPosition for every anaesthetist', () => {
    expectParity(seed)
  })

  it('sorted by surname, each named', () => {
    const rows = anaesthetistLedgerRowsOf(seed)
    const surnames = rows.map((r) => surnameOf(seed.masters.anaesthetists[r.anaesthetistId]!.name))
    expect(surnames).toEqual([...surnames].sort((a, b) => a.localeCompare(b)))
    expect(rows.find((r) => r.anaesthetistId === ANAE.souter)?.name).toBe('Dr Souter')
  })

  it('billed sums the payables of their procedure pairs and transfers, net of credits', () => {
    const pairs = Object.values(seed.billing.ledger)
    for (const row of anaesthetistLedgerRowsOf(seed)) {
      let cents = 0
      for (const p of pairs) {
        if (!isBookingPair(p) || p.kind !== 'procedure' || p.payable?.payee.kind !== 'anaesthetist' || p.payable.payee.anaesthetistId !== row.anaesthetistId) continue
        cents += Math.round((p.payable.amount - (p.payable.reversedAmount ?? 0)) * 100)
      }
      for (const t of Object.values(seed.billing.transfers)) {
        if (t.in.payee.kind === 'anaesthetist' && t.in.payee.anaesthetistId === row.anaesthetistId) cents += Math.round((t.in.amount - (t.in.reversedAmount ?? 0)) * 100)
      }
      expect(row.billed, row.anaesthetistId).toBe(cents / 100)
    }
  })

  it('memoised on the records it reads', () => {
    expect(anaesthetistLedgerRowsOf(seed)).toBe(anaesthetistLedgerRowsOf(seed))
  })
})

describe('anaesthetistLedgerRowsOf at practice scale', () => {
  let practice: AppState
  beforeAll(() => {
    practice = practiceAppState()
  }, 120_000)

  it('holds parity with anaesthetistPosition for all 85', () => {
    expect(Object.keys(practice.masters.anaesthetists)).toHaveLength(85)
    expectParity(practice)
  })
})

describe('ledgerSentenceOf', () => {
  it('the seed is square, as the Day view reads it', () => {
    const seed = freshAppState()
    expect(reconciliationStatusOf(seed).status).toBe('square')
    expect(ledgerSentenceOf(seed)).toMatchObject({ tone: 'success', square: true, title: 'The books are square', detail: ['Every account is square'] })
  })

  it('an injected receipt naming Dr Souter: out by $120.00, the receipt and her account named', () => {
    const api = createAppStore()
    const before = ledgerSentenceOf(api.getState())
    expect(injectUnmatchedReceipt(api, UNMATCHED_RECEIPT_DEMO.namesSouter.id).ok).toBe(true)
    const s = ledgerSentenceOf(api.getState())
    expect(s.square).toBe(false)
    expect(s.tone).toBe('warning')
    expect(s.title).toBe(`The books are out by ${formatMoney(Math.abs(ledgerPositionOf(api.getState()).imbalance))}`)
    expect(before.square).toBe(true)
    expect(s.title).toBe('The books are out by $120.00')
    expect(s.detail).toEqual(['1 receipt that matches no invoice', '1 account is out of balance'])
  })

  it('an injected receipt naming no one: the ledger is out, no account more', () => {
    const api = createAppStore()
    const before = ledgerSentenceOf(api.getState())
    injectUnmatchedReceipt(api, UNMATCHED_RECEIPT_DEMO.namesNoOne.id)
    const s = ledgerSentenceOf(api.getState())
    expect(s.detail).toContain('1 receipt that matches no invoice')
    expect(s.parts.at(-1)).toEqual(before.parts.at(-1))
  })

  it('a Xero item only: a pair waiting in the queue is named as not yet in Xero, the ledger itself balanced', () => {
    const api = createAppStore()
    const pair = Object.values(api.getState().billing.ledger).find(isBookingPair)!
    const q: XeroQueueItem = { id: 'XQ9999', kind: 'handoff', idempotencyKey: `HANDOFF-${pair.id}`, target: { pairId: pair.id }, enqueuedAtISO: '2026-11-20T09:00:00.000Z', attempts: 1, nextAttemptAtISO: '2026-11-24T09:00:00.000Z', status: 'waiting' }
    api.setState((s) => ({ billing: { ...s.billing, xeroQueue: { ...s.billing.xeroQueue, [q.id]: q } } }))
    const s = ledgerSentenceOf(api.getState())
    expect(s.square).toBe(false)
    expect(s.detail).toContain('1 pair not yet in Xero')
    expect(ledgerPositionOf(api.getState()).imbalance).toBe(0)
    expect(s).toMatchObject({ tone: 'warning', title: 'The books are not square', detail: ['1 pair not yet in Xero', 'Every account is square'] })
  })
})

describe('receiptsToPlaceOf', () => {
  function withHeld() {
    const api = createAppStore()
    const out = injectUnmatchedReceipt(api, UNMATCHED_RECEIPT_DEMO.namesSouter.id)
    if (!out.ok) throw new Error('inject refused')
    expect(receiptsToPlaceOf(api.getState())).toMatchObject({ count: 1, total: 120 })
    expect(receiptsToPlaceOf(api.getState()).receipts[0]!.id).toBe(out.value.id)
    return { api, id: out.value.id }
  }

  it('empties once the receipt is allocated to an invoice', () => {
    const { api, id } = withHeld()
    const target = Object.values(api.getState().billing.ledger).find(
      (p) => isBookingPair(p) && p.credit === undefined && p.receivable.xeroAccRecId !== undefined && p.receivable.amount - p.receivable.receivedAmount >= 120,
    )!
    expect(allocateUnmatchedReceipt(api, TEST_OFFICE, id, target.id).ok).toBe(true)
    expect(receiptsToPlaceOf(api.getState())).toEqual({ receipts: [], total: 0, count: 0 })
  })

  it('empties once the receipt is marked refunded', () => {
    const { api, id } = withHeld()
    expect(markUnmatchedRefunded(api, TEST_OFFICE, id, 'Returned to the payer').ok).toBe(true)
    expect(receiptsToPlaceOf(api.getState())).toEqual({ receipts: [], total: 0, count: 0 })
  })
})
