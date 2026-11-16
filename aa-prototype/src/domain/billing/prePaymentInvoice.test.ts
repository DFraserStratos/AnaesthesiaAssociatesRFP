/**
 * Pure pre-payment invoice tests (Phase 09; B7): the pre-procedure invoice
 * covers only Procedures on a prepaid Contract billed to a person (catch-up
 * Phase 20, INTERIM until 27; a mixed booking's hospital-billed procedures
 * are untouched); split raises the agreed deposit, full raises the fee on the
 * prepaid Contract; the later balance run nets the
 * deposit off as a visible deduction line so deposit + balance reconciles to
 * the patient-funded portion's full fee (GST included), and a full
 * pre-payment leaves NO balance invoice.
 */

import { describe, expect, it } from 'vitest'
import { DEFAULT_RVG_TIME_RULE } from './timeUnits'
import {
  buildInvoicesForBooking,
  buildPrePaymentInvoiceForBooking,
  PREPAID_SPLIT_MESSAGE,
  type InvoiceBuildContext,
} from './invoiceBuild'
import { toCents } from './money'
import {
  BASE_SINGLE_10,
  HANDOVER_1030,
  START_0800,
  mkAnaesthetist,
  mkBooking,
  mkContract,
  mkParty,
  mkProcedure,
  RVG_MODIFIER_MASTER,
} from './fixtures'

const PARTY = mkParty()
/** The anaesthetist's own Party, holding their prepaid price list. */
const ANAES_PARTY = mkParty({ id: 'party-anaes', kind: 'anaesthetist', name: 'Dr Test', codePrefix: 'DRT', hospitalId: undefined })

const LIST_DATE = '2026-07-21'

/** The hospital's plain RVG Contract, so the mixed booking's hospital-route procedure resolves. */
const HOSPITAL_DEFAULT = mkContract({ id: 'con-def', name: "Test hospital RVG" })

/** B10 + T11 (2h30m) + M0 = 21 units at $30 = $630 (the patient-funded fee). */
const FULL_FEE = 630

/** The anaesthetist's prepaid price list item at the full fee, billing the payer (catch-up Phase 20). */
const PREPAID = mkContract({
  id: 'con-pre',
  aaCode: 'DRT-001',
  name: 'Prepaid item',
  holderId: ANAES_PARTY.id,
  billsTo: 'payer',
  prepaid: true,
  pricing: { kind: 'fixed', ranges: [{ startISO: '2026-01-01', price: FULL_FEE }] },
})

function mkCtx(overrides: Partial<InvoiceBuildContext> = {}): InvoiceBuildContext {
  return {
    // No patient date of birth: no age modifier (catch-up Phase 19b).
    patientDobISO: undefined,
    modifiers: RVG_MODIFIER_MASTER,
    anaesthetist: mkAnaesthetist(), // unitValue 30
    rvgGroups: { [BASE_SINGLE_10.id]: BASE_SINGLE_10 },
    contracts: { [HOSPITAL_DEFAULT.id]: HOSPITAL_DEFAULT, [PREPAID.id]: PREPAID },
    parties: { [PARTY.id]: PARTY, [ANAES_PARTY.id]: ANAES_PARTY },
    billingLines: [],
    listDateISO: LIST_DATE,
    timeRule: DEFAULT_RVG_TIME_RULE,
    listHospitalId: 'hosp-1',
    patientId: 'pat-1',
    ...overrides,
  }
}

const PATIENT = { kind: 'patient' as const, id: 'pat-1' }
/** The prePaidByProcedure ctx entry for proc-pp (default: raised to the patient). */
const pp = (amount: number, counterparty: { kind: 'patient' | 'payer'; id: string } = PATIENT) => ({
  'proc-pp': { amount, counterparty },
})

function prepaymentProc(overrides: Partial<ReturnType<typeof mkProcedure>> = {}) {
  return mkProcedure({
    id: 'proc-pp',
    rvgGroupId: BASE_SINGLE_10.id,
    anaestheticStartISO: START_0800,
    handoverISO: HANDOVER_1030,
    governingContractId: PREPAID.id,
    prepaymentDetail: { type: 'full' },
    ...overrides,
  })
}

describe('buildPrePaymentInvoiceForBooking', () => {
  it('covers only Procedures on a prepaid Contract billed to a person (hospital procedures excluded)', () => {
    const hospitalProc = mkProcedure({
      id: 'proc-h',
      rvgGroupId: BASE_SINGLE_10.id,
      anaestheticStartISO: START_0800,
      handoverISO: HANDOVER_1030,
      governingContractId: 'con-def',
    })
    const result = buildPrePaymentInvoiceForBooking(mkBooking(), [hospitalProc, prepaymentProc()], mkCtx())
    if (result.kind !== 'invoices') throw new Error('expected invoices')
    expect(result.invoices).toHaveLength(1)
    const invoice = result.invoices[0]!
    expect(invoice.counterparty).toEqual({ kind: 'patient', id: 'pat-1' })
    expect(invoice.layout).toBe('patient')
    // Only the prepayment procedure appears — the hospital one is untouched.
    expect(invoice.lines.every((l) => l.procedureId === 'proc-pp')).toBe(true)
  })

  it('split raises the agreed deposit as an ex-GST subtotal ($800 -> 800/120/920)', () => {
    const proc = prepaymentProc({ prepaymentDetail: { type: 'split', depositAmount: 800 } })
    const result = buildPrePaymentInvoiceForBooking(mkBooking(), [proc], mkCtx())
    if (result.kind !== 'invoices') throw new Error('expected invoices')
    const invoice = result.invoices[0]!
    expect(invoice.lines).toHaveLength(1)
    expect(invoice.lines[0]!.description).toBe('Pre-payment deposit')
    expect(invoice.lines[0]!.amount).toBe(800)
    expect(invoice.subtotal).toBe(800)
    expect(invoice.gst).toBe(120)
    expect(invoice.total).toBe(920)
  })

  it('full raises the full fee on the prepaid Contract via the calculator', () => {
    const result = buildPrePaymentInvoiceForBooking(mkBooking(), [prepaymentProc()], mkCtx())
    if (result.kind !== 'invoices') throw new Error('expected invoices')
    const invoice = result.invoices[0]!
    expect(invoice.subtotal).toBe(FULL_FEE)
    expect(invoice.lines[0]!.amount).toBe(FULL_FEE)
    expect(invoice.lines[0]!.units).toBe(21)
  })

  it('addresses the pre-invoice to another payer on the Booking (a guardian pays; catch-up Phase 21)', () => {
    const proc = prepaymentProc({ prepaymentDetail: { type: 'split', depositAmount: 300 } })
    const booking = mkBooking({ payer: { kind: 'other', id: 'BP0007', name: 'Angela Park', relationship: 'Mother', email: 'angela@example.net' } })
    const result = buildPrePaymentInvoiceForBooking(booking, [proc], mkCtx())
    if (result.kind !== 'invoices') throw new Error('expected invoices')
    expect(result.invoices[0]!.counterparty).toEqual({ kind: 'payer', id: 'BP0007' })
    expect(result.invoices[0]!.billedTo).toEqual({ name: 'Angela Park', email: 'angela@example.net' })
  })
})

describe('deposit + balance reconciliation', () => {
  it('split: deposit + balance = the full fee (ex-GST, GST and total all reconcile)', () => {
    const proc = prepaymentProc({ prepaymentDetail: { type: 'split', depositAmount: 300 } })
    const pre = buildPrePaymentInvoiceForBooking(mkBooking(), [proc], mkCtx())
    if (pre.kind !== 'invoices') throw new Error('expected invoices')
    const deposit = pre.invoices[0]!

    // The balance run threads the ex-GST deposit in as prePaidByProcedure.
    const balance = buildInvoicesForBooking(mkBooking(), [proc], mkCtx({ prePaidByProcedure: pp(300) }))
    if (balance.kind !== 'invoices') throw new Error('expected invoices')
    expect(balance.invoices).toHaveLength(1)
    const bal = balance.invoices[0]!

    // The deduction is a VISIBLE line, not a fee-line mutation.
    expect(bal.lines.map((l) => l.description)).toContain('Less pre-payment deposit already invoiced')
    expect(bal.lines.find((l) => l.amount < 0)!.amount).toBe(-300)

    expect(deposit.subtotal + bal.subtotal).toBe(FULL_FEE)
    expect(deposit.gst + bal.gst).toBe(FULL_FEE * 0.15)
    expect(deposit.total + bal.total).toBe(FULL_FEE * 1.15)
  })

  it('full: the balance nets to $0, so no balance invoice is raised', () => {
    const pre = buildPrePaymentInvoiceForBooking(mkBooking(), [prepaymentProc()], mkCtx())
    if (pre.kind !== 'invoices') throw new Error('expected invoices')
    expect(pre.invoices[0]!.subtotal).toBe(FULL_FEE)

    const balance = buildInvoicesForBooking(mkBooking(), [prepaymentProc()], mkCtx({ prePaidByProcedure: pp(FULL_FEE) }))
    if (balance.kind !== 'invoices') throw new Error('expected invoices')
    expect(balance.invoices).toHaveLength(0)
  })

  it('mixed booking: the contract-holder procedure bills in full while the full pre-payment nets away', () => {
    const hospitalProc = mkProcedure({
      id: 'proc-h',
      rvgGroupId: BASE_SINGLE_10.id,
      anaestheticStartISO: START_0800,
      handoverISO: HANDOVER_1030,
      governingContractId: 'con-def',
    })
    const balance = buildInvoicesForBooking(
      mkBooking(),
      [hospitalProc, prepaymentProc()],
      mkCtx({ prePaidByProcedure: pp(FULL_FEE) }),
    )
    if (balance.kind !== 'invoices') throw new Error('expected invoices')
    // Only the hospital invoice survives; the patient balance nets to $0.
    expect(balance.invoices).toHaveLength(1)
    const invoice = balance.invoices[0]!
    expect(invoice.counterparty).toEqual({ kind: 'hospital', id: 'hosp-1' })
    expect(invoice.subtotal).toBe(FULL_FEE)
  })

  it('a deposit larger than the fee is a negativeTotal exception (the belt guard)', () => {
    const proc = prepaymentProc({ prepaymentDetail: { type: 'split', depositAmount: 800 } })
    const balance = buildInvoicesForBooking(mkBooking(), [proc], mkCtx({ prePaidByProcedure: pp(800) }))
    expect(balance.kind).toBe('exception')
    if (balance.kind === 'exception') expect(balance.code).toBe('negativeTotal')
  })

  it('a prepaid procedure that also carries a fee split fails for review', () => {
    const proc = prepaymentProc({
      split: {
        shares: [
          { party: { kind: 'insurer', id: 'ins-1' }, basis: { kind: 'amount', amountExGst: 330 } },
          { party: PATIENT, basis: { kind: 'rest' } },
        ],
      },
    })
    const balance = buildInvoicesForBooking(mkBooking(), [proc], mkCtx({ prePaidByProcedure: pp(FULL_FEE) }))
    expect(balance.kind).toBe('exception')
    if (balance.kind === 'exception') {
      expect(balance.code).toBe('prepaidSplit')
      expect(balance.procedureId).toBe(proc.id)
      expect(balance.message).toBe(PREPAID_SPLIT_MESSAGE)
    }
  })

  it('fails for review when the payer changed since the deposit was raised', () => {
    // Deposit raised to a billable party, but the procedure now bills the patient.
    const proc = prepaymentProc({ prepaymentDetail: { type: 'split', depositAmount: 300 } })
    const balance = buildInvoicesForBooking(
      mkBooking(),
      [proc],
      mkCtx({ prePaidByProcedure: pp(300, { kind: 'payer', id: 'BP0009' }) }),
    )
    expect(balance.kind).toBe('exception')
    if (balance.kind === 'exception') expect(balance.code).toBe('prepaidCounterpartyChanged')
  })

  it('the deposit is measured to the cent (toCents sanity)', () => {
    expect(toCents(300) + toCents(330)).toBe(toCents(FULL_FEE))
  })
})
