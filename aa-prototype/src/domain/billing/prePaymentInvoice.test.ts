/**
 * Pure pre-payment invoice tests (Phase 09; B7): the pre-procedure invoice
 * covers only BillableParty-route `selfFundedPrepayment` procedures (a mixed
 * card's contract-holder procedures are untouched); split raises the agreed
 * deposit, full raises the estimated fee; the later balance run nets the
 * deposit off as a visible deduction line so deposit + balance reconciles to
 * the patient-funded portion's full fee (GST included), and a full
 * pre-payment leaves NO balance invoice.
 */

import { describe, expect, it } from 'vitest'
import {
  buildInvoicesForCard,
  buildPrePaymentInvoiceForCard,
  type InvoiceBuildContext,
} from './invoiceBuild'
import { toCents } from './money'
import {
  BASE_SINGLE_10,
  HANDOVER_1030,
  START_0800,
  mkAnaesthetist,
  mkCard,
  mkContract,
  mkProcedure,
} from './fixtures'

const LIST_DATE = '2026-07-21'

/** A hospital default so the mixed card's contract-holder procedure resolves. */
const HOSPITAL_DEFAULT = mkContract({
  id: 'con-def',
  name: 'Default',
  type: 1,
  isDefault: true,
  effectiveFromISO: '2020-01-01',
})

function mkCtx(overrides: Partial<InvoiceBuildContext> = {}): InvoiceBuildContext {
  return {
    anaesthetist: mkAnaesthetist(), // unitValue 30
    rvgCodes: { [BASE_SINGLE_10.code]: BASE_SINGLE_10 },
    contracts: { [HOSPITAL_DEFAULT.id]: HOSPITAL_DEFAULT },
    contractPrices: [],
    insurers: {},
    billableParties: {},
    billingLines: [],
    listDateISO: LIST_DATE,
    listHospitalId: 'hosp-1',
    patientId: 'pat-1',
    ...overrides,
  }
}

/** B10 + T11 (2h30m) + M0 = 21 units at $30 = $630 (the patient-funded fee). */
const FULL_FEE = 630

const PATIENT = { kind: 'patient' as const, id: 'pat-1' }
/** The prePaidByProcedure ctx entry for proc-pp (default: raised to the patient). */
const pp = (amount: number, counterparty: { kind: 'patient' | 'billableParty'; id: string } = PATIENT) => ({
  'proc-pp': { amount, counterparty },
})

function prepaymentProc(overrides: Partial<ReturnType<typeof mkProcedure>> = {}) {
  return mkProcedure({
    id: 'proc-pp',
    rvgBaseCode: BASE_SINGLE_10.code,
    anaestheticStartISO: START_0800,
    handoverISO: HANDOVER_1030,
    billingRoute: 'billableParty',
    patientPaymentCategory: 'selfFundedPrepayment',
    prepaymentDetail: { type: 'full' },
    ...overrides,
  })
}

describe('buildPrePaymentInvoiceForCard', () => {
  it('covers only BillableParty selfFundedPrepayment procedures (hospital procedures excluded)', () => {
    const hospitalProc = mkProcedure({
      id: 'proc-h',
      rvgBaseCode: BASE_SINGLE_10.code,
      anaestheticStartISO: START_0800,
      handoverISO: HANDOVER_1030,
      governingContractId: 'con-def',
    })
    const result = buildPrePaymentInvoiceForCard(mkCard(), [hospitalProc, prepaymentProc()], mkCtx())
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
    const result = buildPrePaymentInvoiceForCard(mkCard(), [proc], mkCtx())
    if (result.kind !== 'invoices') throw new Error('expected invoices')
    const invoice = result.invoices[0]!
    expect(invoice.lines).toHaveLength(1)
    expect(invoice.lines[0]!.description).toBe('Pre-payment deposit')
    expect(invoice.lines[0]!.amount).toBe(800)
    expect(invoice.subtotal).toBe(800)
    expect(invoice.gst).toBe(120)
    expect(invoice.total).toBe(920)
  })

  it('full raises the estimated full fee via the calculator', () => {
    const result = buildPrePaymentInvoiceForCard(mkCard(), [prepaymentProc()], mkCtx())
    if (result.kind !== 'invoices') throw new Error('expected invoices')
    const invoice = result.invoices[0]!
    expect(invoice.subtotal).toBe(FULL_FEE)
    expect(invoice.lines[0]!.amount).toBe(FULL_FEE)
    expect(invoice.lines[0]!.units).toBe(21)
  })

  it('routes the pre-invoice to a typed BillableParty when set (guardian pays)', () => {
    const proc = prepaymentProc({
      prepaymentDetail: { type: 'split', depositAmount: 300 },
      billablePartyId: 'bp-7',
    })
    const result = buildPrePaymentInvoiceForCard(mkCard(), [proc], mkCtx())
    if (result.kind !== 'invoices') throw new Error('expected invoices')
    expect(result.invoices[0]!.counterparty).toEqual({ kind: 'billableParty', id: 'bp-7' })
  })
})

describe('deposit + balance reconciliation', () => {
  it('split: deposit + balance = the full fee (ex-GST, GST and total all reconcile)', () => {
    const proc = prepaymentProc({ prepaymentDetail: { type: 'split', depositAmount: 300 } })
    const pre = buildPrePaymentInvoiceForCard(mkCard(), [proc], mkCtx())
    if (pre.kind !== 'invoices') throw new Error('expected invoices')
    const deposit = pre.invoices[0]!

    // The balance run threads the ex-GST deposit in as prePaidByProcedure.
    const balance = buildInvoicesForCard(mkCard(), [proc], mkCtx({ prePaidByProcedure: pp(300) }))
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
    const pre = buildPrePaymentInvoiceForCard(mkCard(), [prepaymentProc()], mkCtx())
    if (pre.kind !== 'invoices') throw new Error('expected invoices')
    expect(pre.invoices[0]!.subtotal).toBe(FULL_FEE)

    const balance = buildInvoicesForCard(mkCard(), [prepaymentProc()], mkCtx({ prePaidByProcedure: pp(FULL_FEE) }))
    if (balance.kind !== 'invoices') throw new Error('expected invoices')
    expect(balance.invoices).toHaveLength(0)
  })

  it('mixed card: the contract-holder procedure bills in full while the full pre-payment nets away', () => {
    const hospitalProc = mkProcedure({
      id: 'proc-h',
      rvgBaseCode: BASE_SINGLE_10.code,
      anaestheticStartISO: START_0800,
      handoverISO: HANDOVER_1030,
      governingContractId: 'con-def',
    })
    const balance = buildInvoicesForCard(
      mkCard(),
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
    const balance = buildInvoicesForCard(mkCard(), [proc], mkCtx({ prePaidByProcedure: pp(800) }))
    expect(balance.kind).toBe('exception')
    if (balance.kind === 'exception') expect(balance.code).toBe('negativeTotal')
  })

  it('a prepaid procedure that also carries a funder split fails for review', () => {
    const proc = prepaymentProc()
    const balance = buildInvoicesForCard(mkCard(), [proc], mkCtx({
      prePaidByProcedure: pp(FULL_FEE),
      billingLines: [
        { id: 'bl-1', procedureId: 'proc-pp', chargeBasis: 'rvg', amount: 630, description: 'Split', funderOverride: { kind: 'insurer', id: 'ins-1' } },
      ],
    }))
    expect(balance.kind).toBe('exception')
    if (balance.kind === 'exception') expect(balance.code).toBe('prepaidFunderOverride')
  })

  it('fails for review when the payer changed since the deposit was raised', () => {
    // Deposit raised to a billable party, but the procedure now bills the patient.
    const proc = prepaymentProc({ prepaymentDetail: { type: 'split', depositAmount: 300 } })
    const balance = buildInvoicesForCard(
      mkCard(),
      [proc],
      mkCtx({ prePaidByProcedure: pp(300, { kind: 'billableParty', id: 'bp-9' }) }),
    )
    expect(balance.kind).toBe('exception')
    if (balance.kind === 'exception') expect(balance.code).toBe('prepaidCounterpartyChanged')
  })

  it('the deposit is measured to the cent (toCents sanity)', () => {
    expect(toCents(300) + toCents(330)).toBe(toCents(FULL_FEE))
  })
})
