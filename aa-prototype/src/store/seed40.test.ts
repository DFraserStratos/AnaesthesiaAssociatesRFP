/**
 * Catch-up Phase 40's seed (work item 9): the mandatory NHI on every seeded
 * patient, Dr Sharma's patient-billed history (`HS`) with Heather Sinclair's
 * credit in full (D24), and the balance warning cases it feeds. Souter's
 * pinned figures (S3, web Accounts, the dashboard) are proved unchanged by
 * their own tests (`accountsViews.test.ts`, `AccountsScreen.test.tsx`,
 * `demoScenarios.test.ts`), which this phase leaves as they were.
 */

import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { freshAppState } from './appStore'
import { warningsForBooking } from './warnings'
import { patientBalanceRows } from './patientLedger'
import { isBackdropInvoice } from './selectors'
import { invoiceStanding } from './creditActions'
import { validateNhi } from '../domain/nhi'
import { buildNhiIndex, invoiceAgeDays, patientBalanceStrength, patientBalanceSummary, patientCentricBalance } from '../domain/patients'
import { dueOn, ledgerChecks, pairStatusLabel } from '../domain/billing/ledger'
import { PATIENT_BALANCE_DEFAULT_THRESHOLD_DAYS } from '../domain/warnings/rules/patientBalance'
import { PAT } from '../domain/seed/patients'
import { SEED_WARNING_SAMPLE_BOOKINGS } from '../domain/seed'
import { MULTI_WARNING_PATIENT_ID } from '../domain/seed/history'
import { ANAE, HOSP } from '../domain/seed/cast'
import { CONTRACT } from '../domain/seed/contracts'
import { DEMO_TODAY } from '../domain/clock'
import type { BookingLedgerPair } from '../domain/types'

const state = freshAppState()

/** The Sinclair credit's records (`HS` namespace, account 05). */
const SINCLAIR = {
  list: 'L-HIST-HS-05',
  booking: 'HSBK05',
  procedure: 'HSP05',
  invoice: 'HSINV05',
  invoiceNumber: 'AA-2026-HS05',
  pair: 'HSBC05',
  creditNote: 'HSCRN05',
  creditNoteNumber: 'CN-2026-HS05',
  negativeInvoice: 'HSNEG05',
  creditEvent: 'HSEV05',
  accRec: 'XRHS05',
  accPay: 'XPHS05',
}

/**
 * PT0001 to PT0151 as they stood before Phase 40, Noah Prescott's NHI left
 * out (sha-256 of their JSON, in id order). Verified once against the seed at
 * 6b296726 (the commit before Phase 40) when this was pinned; re-pinned when the
 * seed moved 18 weeks (every birth date 126 days later; moved back, the old pin
 * 6a7319263328… matched exactly).
 */
const PATIENTS_BEFORE_40 = '36fc9547cbc831b05ba9545558a028ea424d976c6242ff664ce79f5a713c6b6c'

describe('Phase 40 seed', () => {
  it('two fresh seeds deep-equal', () => {
    expect(freshAppState()).toEqual(freshAppState())
  })

  it('PT0001 to PT0151 are unchanged except Noah Prescott, who now has an NHI', () => {
    const ids = Array.from({ length: 151 }, (_, i) => `PT${String(i + 1).padStart(4, '0')}`)
    const pinned = ids.map((id) => {
      const p = state.masters.patients[id]
      expect(p, id).toBeDefined()
      if (id !== PAT.provisional) return p
      const { nhi: _nhi, ...rest } = p!
      return rest
    })
    expect(createHash('sha256').update(JSON.stringify(pinned)).digest('hex')).toBe(PATIENTS_BEFORE_40)
    expect(state.masters.patients[PAT.provisional]).toMatchObject({ name: 'Noah Prescott', nhi: 'ZAP3016' })
  })

  it('every patient has a valid NHI, and no NHI is held twice', () => {
    for (const p of Object.values(state.masters.patients)) expect(validateNhi(p.nhi).valid, `${p.hiddenInternalId} ${p.nhi}`).toBe(true)
    expect(buildNhiIndex(Object.values(state.masters.patients)).duplicates).toEqual([])
  })

  it('no seeded Booking carries a balance check stamp or raises a patientBalance warning', () => {
    for (const b of Object.values(state.schedule.bookings)) {
      expect(b.balanceCheck, b.id).toBeUndefined()
      expect(warningsForBooking(state, b.id).filter((w) => w.ruleId === 'patientBalance'), b.id).toEqual([])
    }
  })

  it('the ledger checks stay clean', () => {
    expect(ledgerChecks(Object.values(state.billing.ledger), state.billing.transfers, Object.values(state.billing.unmatchedReceipts))).toEqual([])
  })

  it("Souter's oa07 stays billed to St George's; Sarah Mitchell's 98-day $610.00 patient-billed invoice is Dr Sharma's HS01", () => {
    // Recorded deviation (PROGRESS, Phase 40 session 1): re-pointing oa07 would move Souter's figures and Xero contact ids.
    expect(state.billing.invoices['HINV07']?.counterparty).toEqual({ kind: 'hospital', id: HOSP.stg })
    const hs01 = state.billing.invoices['HSINV01']!
    expect(hs01.counterparty).toEqual({ kind: 'patient', id: PAT.mitchell })
    expect(hs01.total).toBe(610)
    expect(invoiceAgeDays(hs01.raisedAtISO!, DEMO_TODAY)).toBe(98)
  })

  it("Losa Tuilagi's invoice is exactly 30 days old at DEMO_TODAY", () => {
    const inv = state.billing.invoices['HSINV03']!
    expect(inv.counterparty).toEqual({ kind: 'patient', id: PAT.tuilagi })
    expect(invoiceAgeDays(inv.raisedAtISO!, DEMO_TODAY)).toBe(30)
  })

  it("Mere Walsh is the multiWarning Booking's patient", () => {
    expect(state.schedule.bookings[SEED_WARNING_SAMPLE_BOOKINGS.multiWarning]?.patientId).toBe(MULTI_WARNING_PATIENT_ID)
  })
})

describe("Heather Sinclair's credit in full (D24)", () => {
  const pair = state.billing.ledger[SINCLAIR.pair] as BookingLedgerPair

  it('is a backdrop account billed to her under No contract, RVG, kept off the office lists', () => {
    expect(state.schedule.lists[SINCLAIR.list]).toMatchObject({ dateISO: '2026-09-11', anaesthetistId: ANAE.sharma, state: 'AUTHORISED' })
    expect(state.schedule.bookings[SINCLAIR.booking]).toMatchObject({ patientId: PAT.sinclair, listId: SINCLAIR.list })
    expect(state.schedule.procedures[SINCLAIR.procedure]).toMatchObject({ payer: { kind: 'patient' }, governingContractId: CONTRACT.noContractRvg })
    const inv = state.billing.invoices[SINCLAIR.invoice]!
    expect(inv).toMatchObject({ invoiceNumber: SINCLAIR.invoiceNumber, counterparty: { kind: 'patient', id: PAT.sinclair }, total: 260, raisedAtISO: '2026-09-15T09:00:00' })
    expect(isBackdropInvoice(inv)).toBe(true)
    expect(invoiceStanding(state, SINCLAIR.invoice)).toBe('credited')
  })

  it('was paid on 22 Sep, never paid out, and is credited with $260.00 held for her', () => {
    expect(pair.receivable).toMatchObject({ amount: 260, receivedAmount: 260, creditedAmount: 260, paidInAtISO: '2026-09-22T10:00:00' })
    expect(pair.payable).toMatchObject({ amount: 260, disbursedAmount: 0, releasedAmount: 0, reversedAmount: 260 })
    expect(pair.payable?.paidOutAtISO).toBeUndefined()
    expect(pair.credit).toEqual({ creditNoteId: SINCLAIR.creditNote, negativeInvoiceId: SINCLAIR.negativeInvoice, atISO: '2026-10-06T11:00:00', heldForPayer: 260, recoveryDue: 0 })
    expect(pairStatusLabel(pair)).toBe('credited')
    // Nothing is due, so no payment run picks it up, and no seeded run holds it.
    expect(dueOn(pair.payable!)).toBe(0)
    expect(Object.values(state.billing.disbursements).some((d) => d.pairId === SINCLAIR.pair)).toBe(false)
    expect(JSON.stringify(state.billing.payablesRuns)).not.toContain(SINCLAIR.pair)
  })

  it("carries the credit note, the offset negative invoice, the issued credit event and Xero's correction", () => {
    expect(state.billing.creditNotes[SINCLAIR.creditNote]).toMatchObject({
      creditNoteNumber: SINCLAIR.creditNoteNumber,
      originalInvoiceId: SINCLAIR.invoice,
      pairId: SINCLAIR.pair,
      creditEventId: SINCLAIR.creditEvent,
      counterparty: { kind: 'patient', id: PAT.sinclair },
      total: 260,
      cause: 'correction',
      replacementInvoiceIds: [],
      reversal: { receivableCredited: 260, negativeInvoiceTotal: 260, offsetAgainstPayable: 260, releaseCancelled: 260, heldForPayer: 260, recoveryDue: 0 },
      xero: { accRecCreditNoteId: 'XCNHS05', accPayCreditNoteId: 'XCNHS05P', accPayVoided: false },
    })
    expect(state.billing.negativeInvoices[SINCLAIR.negativeInvoice]).toMatchObject({ number: `${SINCLAIR.creditNoteNumber}-P`, amount: 260, offsetAmount: 260, recoveryDue: 0, status: 'offset' })
    expect(state.schedule.procedureEvents[SINCLAIR.creditEvent]).toMatchObject({ kind: 'credit', procedureId: SINCLAIR.procedure, review: { state: 'approved' } })
    expect(state.xero.accRecs[SINCLAIR.accRec]).toMatchObject({ status: 'credited', amountReceived: 260 })
    expect(state.xero.accPays[SINCLAIR.accPay]).toMatchObject({ status: 'credited', amountDisbursed: 0 })
    // The ACCRECCREDIT is unallocated (held for her); the ACCPAYCREDIT is allocated against the unpaid bill.
    expect(state.xero.creditNotes['XCNHS05']).toMatchObject({ type: 'ACCRECCREDIT', againstId: SINCLAIR.accRec, total: 260, allocated: 0 })
    expect(state.xero.creditNotes['XCNHS05P']).toMatchObject({ type: 'ACCPAYCREDIT', againstId: SINCLAIR.accPay, total: 260, allocated: 260 })
  })

  it('reads "in credit" by $260.00 on her record, a mild balance warning', () => {
    const rows = patientBalanceRows(state, PAT.sinclair)
    const balance = patientCentricBalance(rows, PAT.sinclair)
    expect(balance.outstandingTotal).toBe(-260)
    expect(balance.billedToPatient).toEqual({ outstanding: 0, creditHeld: 260 })
    const summary = patientBalanceSummary(rows, { patientId: PAT.sinclair, todayISO: DEMO_TODAY })
    expect(summary.owing).toEqual([])
    expect(summary.creditTotal).toBe(260)
    expect(patientBalanceStrength(summary, PATIENT_BALANCE_DEFAULT_THRESHOLD_DAYS)).toBe('mild')
  })
})
