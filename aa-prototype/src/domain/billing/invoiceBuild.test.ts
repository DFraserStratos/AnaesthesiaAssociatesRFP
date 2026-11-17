/**
 * Pure invoice-building tests (Phase 08; flat Contracts since catch-up Phase
 * 18): the Contract-resolution truth table (the stored Contract governs,
 * Disabled included; "Needs a price"; none is "Needs an invoice
 * destination", never resolved from the List, catch-up Phase 20), who is
 * billed from the Contract (`billablePartyForProcedure`),
 * the layout from the Contract (`invoiceLayoutFor`, catch-up Phase 22), line
 * building (the invoice description, override adjustment, a discount as its
 * own line, additional procedures under the multi-procedure rule), the fee split on the Booking
 * (US-08.2.3), same-party grouping and the GST demo assumption's maths.
 */

import { describe, expect, it } from 'vitest'
import { DEFAULT_RVG_TIME_RULE } from './timeUnits'
import {
  buildInvoicesForBooking,
  counterpartyForProcedure,
  resolveContractForProcedure,
  type InvoiceBuildContext,
} from './invoiceBuild'
import { GST_RATE, invoiceLayoutFor } from './invoicePresentation'
import { splitDoesNotFitMessage } from './splitShare'
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
import type { BillingLine, Contract, FeeSplit, Party } from '../types'

/** The holder Parties these tests use (catch-up Phase 18): each bills today's counterparty. */
const PARTIES: Record<string, Party> = Object.fromEntries(
  [
    mkParty(),
    mkParty({ id: 'party-ins-1', kind: 'insurer', name: 'Insurer', codePrefix: 'INS', hospitalId: undefined, billingIdentity: { kind: 'insurer', id: 'ins-1' } }),
    mkParty({ id: 'party-surgeon', kind: 'surgeon', name: 'Surgeon', codePrefix: 'SUR', hospitalId: undefined, billingIdentity: { kind: 'surgeon', id: 'surg-9' } }),
    mkParty({ id: 'party-org', kind: 'surgeonGroup', name: 'Group', codePrefix: 'ORG', hospitalId: undefined, billingIdentity: { kind: 'organisation', id: 'org-cos' } }),
    mkParty({ id: 'party-bp', kind: 'surgeonGroup', name: 'Clinic', codePrefix: 'CLN', hospitalId: undefined, billingIdentity: { kind: 'billableParty', id: 'bp-1' } }),
    mkParty({ id: 'party-aa', kind: 'aa', name: 'Anaesthesia Associates', codePrefix: 'AA', hospitalId: undefined }),
  ].map((p) => [p.id, p]),
)

const LIST_DATE = '2026-07-21'

/** The hospital Party's plain RVG Contract. */
const HOSPITAL_DEFAULT = mkContract({ id: 'con-def', name: 'Test hospital RVG' })
/** AA's No contract · RVG, billing the payer (catch-up Phase 20). */
const NO_CONTRACT = mkContract({ id: 'con-ncr', aaCode: 'AA-RVG', name: 'No contract · RVG', holderId: 'party-aa', billsTo: 'payer', systemRole: 'noContractRvg' })

function mkCtx(overrides: Partial<InvoiceBuildContext> = {}): InvoiceBuildContext {
  return {
    // No patient date of birth: no age modifier (catch-up Phase 19b).
    patientDobISO: undefined,
    modifiers: RVG_MODIFIER_MASTER,
    anaesthetist: mkAnaesthetist(),
    rvgGroups: { [BASE_SINGLE_10.id]: BASE_SINGLE_10 },
    contracts: { [HOSPITAL_DEFAULT.id]: HOSPITAL_DEFAULT, [NO_CONTRACT.id]: NO_CONTRACT },
    parties: PARTIES,
    billingLines: [],
    listDateISO: LIST_DATE,
    timeRule: DEFAULT_RVG_TIME_RULE,
    listHospitalId: 'hosp-1',
    patientId: 'pat-1',
    ...overrides,
  }
}

function withContracts(...contracts: Contract[]): InvoiceBuildContext {
  const record: Record<string, Contract> = {}
  for (const c of contracts) record[c.id] = c
  return mkCtx({ contracts: record })
}

describe('resolveContractForProcedure', () => {
  const rateContract = mkContract({
    id: 'con-t2',
    aaCode: 'TST-002',
    name: 'Negotiated rate',
    pricing: { kind: 'rvgContractRate', unitRate: 25 },
  })

  it('the stored Contract governs', () => {
    const ctx = withContracts(HOSPITAL_DEFAULT, rateContract)
    const result = resolveContractForProcedure(mkProcedure({ governingContractId: 'con-t2' }), ctx)
    expect(result).toEqual({ kind: 'resolved', contract: rateContract })
  })

  it('a Disabled stored Contract still resolves: a Procedure already on it bills as normal (D81)', () => {
    const disabled = { ...rateContract, status: 'disabled' as const }
    const result = resolveContractForProcedure(mkProcedure({ governingContractId: 'con-t2' }), withContracts(HOSPITAL_DEFAULT, disabled))
    expect(result).toEqual({ kind: 'resolved', contract: disabled })
  })

  it('a Procedure on a fixed-price Contract with no range in force on the List\'s date "Needs a price" (catch-up Phase 19a)', () => {
    const fixed = mkContract({
      id: 'con-fix',
      name: 'COS ACC fixed fees',
      holderId: 'party-org',
      linkedSurgeonIds: ['surg-9'],
      pricing: { kind: 'fixed', ranges: [{ startISO: '2026-08-01', price: 1250 }] },
    })
    const ctx = withContracts(HOSPITAL_DEFAULT, fixed)
    const primary = mkProcedure({ rvgGroupId: 'RG-T-GA10', governingContractId: 'con-fix' })
    const needs = {
      kind: 'exception',
      code: 'contractIneffective',
      message: 'Needs a price: no price range in force on 21 Jul 2026 under COS ACC fixed fees.',
    }
    expect(resolveContractForProcedure(primary, ctx)).toEqual(needs)
    // An additional Procedure is no exception: a fixed price is the whole price on any Procedure.
    expect(resolveContractForProcedure({ ...primary, isPrimary: false }, ctx)).toEqual(needs)
    // On or after the first start it resolves; a typed price is a price (catch-up Phase 24).
    expect(resolveContractForProcedure(primary, { ...ctx, listDateISO: '2026-08-01' }).kind).toBe('resolved')
    const typed = { ...primary, enteredPrice: 900 }
    expect(resolveContractForProcedure(typed, ctx).kind).toBe('resolved')
  })

  it('no Contract is "Needs an invoice destination": an exception, never resolved from the List (catch-up Phase 20)', () => {
    const result = resolveContractForProcedure(mkProcedure(), withContracts(rateContract, HOSPITAL_DEFAULT))
    expect(result).toEqual({ kind: 'exception', code: 'noContract', message: 'This procedure needs an invoice destination.' })
  })

  it('an open-price fallback resolves once its amount is typed, and "Needs a price" without one', () => {
    const open = mkContract({ id: 'con-open', holderId: 'party-aa', billsTo: 'payer', pricing: { kind: 'open' }, systemRole: 'openPriceFallback' })
    const ctx = withContracts(open)
    expect(resolveContractForProcedure(mkProcedure({ governingContractId: 'con-open' }), ctx).kind).toBe('exception')
    expect(resolveContractForProcedure(mkProcedure({ governingContractId: 'con-open', enteredPrice: 2000 }), ctx)).toEqual({ kind: 'resolved', contract: open })
  })

  it('a dangling governingContractId is an exception, never "nothing stored" (8th review)', () => {
    const result = resolveContractForProcedure(mkProcedure({ governingContractId: 'con-deleted' }), mkCtx())
    expect(result.kind).toBe('exception')
    if (result.kind === 'exception') expect(result.code).toBe('contractMissing')
  })
})

describe('counterpartyForProcedure + invoiceLayoutFor', () => {
  // The Procedure's own payer (catch-up Phase 22a): the patient, or a guardian.
  const booking = mkProcedure()
  const guardianBooking = mkProcedure({ payer: { kind: 'other', id: 'BP0007', name: 'Angela Park', relationship: 'Mother' } })

  it('a Contract that bills its holder bills the HOLDER: hospital, surgeon or organisation', () => {
    const surgeonHeld = mkContract({ id: 'c', holderId: 'party-surgeon' })
    const orgHeld = mkContract({ id: 'c', holderId: 'party-org' })
    expect(counterpartyForProcedure(HOSPITAL_DEFAULT, booking, 'pat-1', PARTIES)).toEqual({ kind: 'hospital', id: 'hosp-1' })
    expect(counterpartyForProcedure(surgeonHeld, booking, 'pat-1', PARTIES)).toEqual({ kind: 'surgeon', id: 'surg-9' })
    expect(counterpartyForProcedure(orgHeld, booking, 'pat-1', PARTIES)).toEqual({ kind: 'organisation', id: 'org-cos' })
  })

  it("an insurer-held Contract bills the insurer; a Contract billing the payer bills the Procedure's payer (catch-up Phases 21, 22a)", () => {
    const insurerHeld = mkContract({ id: 'c', holderId: 'party-ins-1' })
    expect(counterpartyForProcedure(insurerHeld, booking, 'pat-1', PARTIES)).toEqual({ kind: 'insurer', id: 'ins-1' })
    expect(counterpartyForProcedure(NO_CONTRACT, booking, 'pat-1', PARTIES)).toEqual({ kind: 'patient', id: 'pat-1' })
    expect(counterpartyForProcedure(NO_CONTRACT, guardianBooking, 'pat-1', PARTIES)).toEqual({ kind: 'payer', id: 'BP0007' })
  })

  it('another payer on the Procedure never moves a holder-billed Procedure', () => {
    expect(counterpartyForProcedure(HOSPITAL_DEFAULT, guardianBooking, 'pat-1', PARTIES)).toEqual({ kind: 'hospital', id: 'hosp-1' })
  })

  it("layout from the Contract: the holder's when it bills its holder, the patient's when it bills the payer (catch-up Phase 22)", () => {
    const insurerHeld = mkContract({ id: 'c', holderId: 'party-ins-1' })
    expect(invoiceLayoutFor(HOSPITAL_DEFAULT, { kind: 'hospital', id: 'hosp-1' }, true)).toBe('contractHolder')
    expect(invoiceLayoutFor(insurerHeld, { kind: 'insurer', id: 'ins-1' }, true)).toBe('contractHolder')
    expect(invoiceLayoutFor(NO_CONTRACT, { kind: 'patient', id: 'pat-1' }, true)).toBe('patient')
    expect(invoiceLayoutFor(NO_CONTRACT, { kind: 'payer', id: 'BP0007' }, true)).toBe('patient')
  })

  it("an added split party takes its layout by class: a person the patient's, an organisation the holder's", () => {
    for (const contract of [HOSPITAL_DEFAULT, NO_CONTRACT, undefined]) {
      expect(invoiceLayoutFor(contract, { kind: 'patient', id: 'x' }, false)).toBe('patient')
      expect(invoiceLayoutFor(contract, { kind: 'payer', id: 'x' }, false)).toBe('patient')
      expect(invoiceLayoutFor(contract, { kind: 'insurer', id: 'x' }, false)).toBe('contractHolder')
      expect(invoiceLayoutFor(contract, { kind: 'hospital', id: 'x' }, false)).toBe('contractHolder')
      expect(invoiceLayoutFor(contract, { kind: 'surgeon', id: 'x' }, false)).toBe('contractHolder')
      expect(invoiceLayoutFor(contract, { kind: 'organisation', id: 'x' }, false)).toBe('contractHolder')
      expect(invoiceLayoutFor(contract, { kind: 'party', id: 'x' }, false)).toBe('contractHolder')
    }
  })
})

describe('buildInvoicesForBooking', () => {
  /** B10 + T11 (2h30m) + M0 = 21 units at $30 = $630. */
  const primary = mkProcedure({
    id: 'proc-1',
    rvgGroupId: BASE_SINGLE_10.id,
    anaestheticStartISO: START_0800,
    handoverISO: HANDOVER_1030,
    governingContractId: 'con-def',
  })
  /** Additional (catch-up Phase 23): no base, T 11 and no modifier share, at $30 = $330. */
  const additional = mkProcedure({
    id: 'proc-2',
    rvgGroupId: BASE_SINGLE_10.id,
    anaestheticStartISO: START_0800,
    handoverISO: HANDOVER_1030,
    governingContractId: 'con-def',
    isPrimary: false,
  })

  it('same-counterparty procedures share ONE invoice; the additional line bills its own time units', () => {
    const result = buildInvoicesForBooking(mkBooking(), [primary, additional], mkCtx())
    expect(result.kind).toBe('invoices')
    if (result.kind !== 'invoices') return
    expect(result.invoices).toHaveLength(1)
    const invoice = result.invoices[0]!
    expect(invoice.counterparty).toEqual({ kind: 'hospital', id: 'hosp-1' })
    expect(invoice.layout).toBe('contractHolder')
    expect(invoice.lines).toHaveLength(2)
    expect(invoice.lines[0]!.amount).toBe(630)
    // The fee's own text with no invoice description; the units stay in `units`, and the holder's layout carries the BTM.
    expect(invoice.lines[0]!).toMatchObject({ kind: 'fee', description: 'Anaesthesia, primary procedure (B 10 + T 11 + M 0 units)', units: 21, btm: { base: 10, time: 11, modifiers: 0, unitValue: 30 } })
    expect(invoice.lines[0]!.description).not.toContain('per unit')
    expect(invoice.lines[1]!.amount).toBe(330)
    expect(invoice.lines[1]!.units).toBe(11)
    expect(invoice.lines[1]!.description).toBe('Anaesthesia, additional procedure (T 11 units)')
    expect(invoice.procedureIds).toEqual(['proc-1', 'proc-2'])
    expect(invoice.contractId).toBe('con-def')
    expect(invoice.subtotal).toBe(960)
    expect(invoice.gst).toBe(144)
    expect(invoice.total).toBe(1104)
  })

  it('procedures with DIFFERENT funders split into separate invoices (the §11 reading)', () => {
    const elective = { ...additional, governingContractId: NO_CONTRACT.id }
    const result = buildInvoicesForBooking(mkBooking(), [primary, elective], mkCtx())
    expect(result.kind).toBe('invoices')
    if (result.kind !== 'invoices') return
    expect(result.invoices).toHaveLength(2)
    const [hospital, patient] = result.invoices
    expect(hospital!.counterparty.kind).toBe('hospital')
    expect(patient!.counterparty).toEqual({ kind: 'patient', id: 'pat-1' })
    expect(patient!.layout).toBe('patient')
    expect(patient!.lines).toHaveLength(1)
    expect(patient!.lines[0]!.description).toBe('Anaesthesia, additional procedure (T 11 units)')
    // The patient's layout carries no BTM breakdown and no cross-match.
    expect(patient!.lines[0]!.btm).toBeUndefined()
    expect(patient!.crossMatch).toBeUndefined()
    expect(patient!.subtotal).toBe(330)
  })

  it("each fee line prints the Procedure's invoice description; the holder's layout adds the cross-match and the holder reference", () => {
    const worded = { ...primary, invoiceDescription: { text: 'Anaesthesia for knee arthroscopy', origin: 'hospital' as const }, billingReference: 'SG-4471' }
    const referenced = { ...HOSPITAL_DEFAULT, holderReference: 'SGANAES01' }
    const result = buildInvoicesForBooking(mkBooking(), [worded], { ...mkCtx({ contracts: { [referenced.id]: referenced } }), surgeonName: 'Mr Test Surgeon' })
    if (result.kind !== 'invoices') throw new Error('expected invoices')
    const invoice = result.invoices[0]!
    expect(invoice.lines[0]!.description).toBe('Anaesthesia for knee arthroscopy')
    expect(invoice.holderReference).toBe('SGANAES01')
    expect(invoice.crossMatch).toEqual({ procedureDateISO: LIST_DATE, surgeon: 'Mr Test Surgeon', hospitalRef: 'SG-4471' })
  })

  it('a typed price prints as one fee line at the price: no adjustment line, no reason (catch-up Phase 24)', () => {
    const typed = { ...primary, enteredPrice: 580 }
    const result = buildInvoicesForBooking(mkBooking(), [typed], mkCtx())
    if (result.kind !== 'invoices') throw new Error('expected invoices')
    const invoice = result.invoices[0]!
    expect(invoice.lines.map((l) => [l.kind, l.amount])).toEqual([['fee', 580]])
    expect(invoice.subtotal).toBe(580)
  })

  it("a split bills each share to its own party, an invoice each, linked as siblings (catch-up Phase 22, US-08.2.3)", () => {
    const split: FeeSplit = {
      shares: [
        { party: { kind: 'insurer', id: 'ins-1' }, basis: { kind: 'amount', amountExGst: 400 } },
        { party: { kind: 'patient', id: 'pat-1' }, basis: { kind: 'rest' } },
      ],
    }
    const result = buildInvoicesForBooking(mkBooking(), [{ ...primary, split }], mkCtx())
    if (result.kind !== 'invoices') throw new Error('expected invoices')
    expect(result.invoices).toHaveLength(2)
    const [insurer, patient] = result.invoices
    expect(insurer).toMatchObject({ counterparty: { kind: 'insurer', id: 'ins-1' }, layout: 'contractHolder', subtotal: 400, gst: 60, total: 460, procedureIds: ['proc-1'] })
    expect(insurer!.lines).toEqual([
      { procedureId: 'proc-1', kind: 'fee', description: 'Anaesthesia (B + T + M units): share of the fee of $630.00 ($400.00)', amount: 400, btm: { base: 10, time: 11, modifiers: 0, units: 21, unitValue: 30 } },
    ])
    expect(insurer!.split).toEqual({ procedureId: 'proc-1', feeExGst: 630, shareLabel: '$400.00', isRest: false })
    expect(patient).toMatchObject({ counterparty: { kind: 'patient', id: 'pat-1' }, layout: 'patient', subtotal: 230, gst: 34.5, total: 264.5 })
    expect(patient!.lines).toEqual([
      { procedureId: 'proc-1', kind: 'fee', description: 'Anaesthesia (B + T + M units): share of the fee of $630.00 (the rest)', amount: 230 },
    ])
    expect(patient!.split).toEqual({ procedureId: 'proc-1', feeExGst: 630, shareLabel: 'the rest', isRest: true })
    expect(insurer!.splitSiblings).toEqual([1])
    expect(patient!.splitSiblings).toEqual([0])
    // The shares total the fee to the cent.
    expect(insurer!.subtotal + patient!.subtotal).toBe(630)
  })

  it('a split on an additional Procedure divides its own allocated fee, keyed by Procedure, and Make primary does not move the share (catch-up Phase 23)', () => {
    const split: FeeSplit = {
      shares: [
        { party: { kind: 'insurer', id: 'ins-1' }, basis: { kind: 'amount', amountExGst: 100 } },
        { party: { kind: 'patient', id: 'pat-1' }, basis: { kind: 'rest' } },
      ],
    }
    // The additional's fee: T 11 x $30 = $330 (no base, no modifier share).
    const before = buildInvoicesForBooking(mkBooking(), [primary, { ...additional, split }], mkCtx())
    if (before.kind !== 'invoices') throw new Error('expected invoices')
    const shareLines = (r: typeof before) => r.invoices.flatMap((i) => i.lines).filter((l) => l.procedureId === 'proc-2')
    expect(shareLines(before).map((l) => l.amount)).toEqual([100, 230])
    // Make the split Procedure primary: its fee becomes B 10 + T 11 = $630, the split stays on it.
    const after = buildInvoicesForBooking(mkBooking(), [{ ...primary, isPrimary: false }, { ...additional, isPrimary: true, split }], mkCtx())
    if (after.kind !== 'invoices') throw new Error('expected invoices')
    expect(shareLines(after).map((l) => l.amount)).toEqual([100, 530])
    expect(after.invoices.flatMap((i) => i.lines).filter((l) => l.procedureId === 'proc-1').map((l) => l.amount)).toEqual([330])
  })

  it("a split party who is also another Procedure's party gets one invoice holding both", () => {
    const split: FeeSplit = {
      shares: [
        { party: { kind: 'hospital', id: 'hosp-1' }, basis: { kind: 'percent', percent: 50 } },
        { party: { kind: 'insurer', id: 'ins-1' }, basis: { kind: 'rest' } },
      ],
    }
    const result = buildInvoicesForBooking(mkBooking(), [{ ...primary, split }, additional], mkCtx())
    if (result.kind !== 'invoices') throw new Error('expected invoices')
    expect(result.invoices.map((i) => [i.counterparty.kind, i.subtotal])).toEqual([
      ['hospital', 315 + 330],
      ['insurer', 315],
    ])
    expect(result.invoices[0]!.procedureIds).toEqual(['proc-1', 'proc-2'])
  })
  it('a resolution exception on any procedure fails the whole Booking with its procedure id', () => {
    // A Contract that cannot be found on the second procedure fails the Booking.
    const broken = { ...additional, governingContractId: 'con-gone' }
    const result = buildInvoicesForBooking(mkBooking(), [primary, broken], withContracts(HOSPITAL_DEFAULT))
    expect(result.kind).toBe('exception')
    if (result.kind === 'exception') expect(result.procedureId).toBe('proc-2')
  })

  it('a cancelled Booking yields no invoices', () => {
    const cancelled = mkBooking({
      cancellation: { reason: 'Patient unwell', by: 'Kirsty W.', role: 'office', source: 'office', atISO: '2026-07-20T09:00:00' },
    })
    const result = buildInvoicesForBooking(cancelled, [primary], mkCtx())
    expect(result).toEqual({ kind: 'invoices', invoices: [] })
  })

  it('RVG less a discount rounds the derived rate to cents and prints the discount as its own line (8th review; catch-up Phase 22)', () => {
    const discounted = mkContract({
      id: 'con-disc',
      pricing: { kind: 'rvgDiscount', discountPct: 7 },
    })
    const ctx = withContracts(HOSPITAL_DEFAULT, discounted)
    ctx.anaesthetist = mkAnaesthetist({ unitValue: 27.5 })
    const result = buildInvoicesForBooking(mkBooking(), [{ ...primary, governingContractId: 'con-disc' }], ctx)
    if (result.kind !== 'invoices') throw new Error('expected invoices')
    const [fee, discount] = result.invoices[0]!.lines
    // Each figure rounded once (catch-up Phase 24, W11): the gross 21 x $27.50 = $577.50, the
    // discount 7% of it = $40.425, rounded to $40.42, its own line; $537.08, reconciling to the cent.
    expect(fee).toMatchObject({ kind: 'fee', amount: 577.5, units: 21, btm: { unitValue: 27.5 } })
    expect(discount).toMatchObject({ kind: 'discount', description: 'Discount 7%', amount: -40.42 })
    expect(result.invoices[0]!.subtotal).toBe(537.08)
  })

  it('a fixed price is the whole price on an additional Procedure too; no Contract prices a second procedure (RV-07)', () => {
    const fixed = mkContract({ id: 'con-fx', pricing: { kind: 'fixed', ranges: [{ startISO: '2026-01-01', price: 2400 }] } })
    const ctx = withContracts(HOSPITAL_DEFAULT, fixed)
    const both = buildInvoicesForBooking(
      mkBooking(),
      [{ ...primary, governingContractId: 'con-fx' }, { ...additional, governingContractId: 'con-fx' }],
      ctx,
    )
    if (both.kind !== 'invoices') throw new Error('expected invoices')
    expect(both.invoices[0]!.lines.map((l) => l.amount)).toEqual([2400, 2400])
  })

  it('a backdated range re-prices an un-billed Procedure (catch-up Phase 19a; an issued invoice is pinned in billingRun.test.ts)', () => {
    const before = mkContract({ id: 'con-fx', name: 'Face lift', pricing: { kind: 'fixed', ranges: [{ startISO: '2026-06-01', price: 3100 }] } })
    const issued = buildInvoicesForBooking(mkBooking(), [{ ...primary, governingContractId: 'con-fx' }], withContracts(HOSPITAL_DEFAULT, before))
    if (issued.kind !== 'invoices') throw new Error('expected invoices')
    // GST at the foot: $3,100 ex GST + 15%.
    expect(issued.invoices[0]!).toMatchObject({ subtotal: 3100, gst: 465, total: 3565 })
    const after = { ...before, pricing: { kind: 'fixed' as const, ranges: [{ startISO: '2026-06-01', price: 3100 }, { startISO: '2026-07-01', price: 3200 }] } }
    const rebuilt = buildInvoicesForBooking(mkBooking(), [{ ...primary, governingContractId: 'con-fx' }], withContracts(HOSPITAL_DEFAULT, after))
    if (rebuilt.kind !== 'invoices') throw new Error('expected invoices')
    expect(rebuilt.invoices[0]!.subtotal).toBe(3200)
  })

  it('a split that no longer fits the fee is an exception at billing time, never a guess (catch-up Phase 22)', () => {
    // $400 + $100 = $500, but the fee under the resolved Contract is $630.
    const split: FeeSplit = {
      shares: [
        { party: { kind: 'insurer', id: 'ins-1' }, basis: { kind: 'amount', amountExGst: 400 } },
        { party: { kind: 'patient', id: 'pat-1' }, basis: { kind: 'amount', amountExGst: 100 } },
      ],
    }
    const result = buildInvoicesForBooking(mkBooking(), [{ ...primary, split }], mkCtx())
    expect(result.kind).toBe('exception')
    if (result.kind === 'exception') {
      expect(result.code).toBe('splitDoesNotFit')
      expect(result.procedureId).toBe('proc-1')
      expect(result.message).toBe(splitDoesNotFitMessage(630, 'The shares come to $500.00 but the fee is $630.00. Make them total the fee, or let one party take the rest.'))
    }
  })

  it('a negative counterparty total is an exception, never a negative invoice (8th review)', () => {
    // A price is never below $0 (catch-up Phase 24), so only an over-deducted prepayment can drive a total negative.
    const first = buildInvoicesForBooking(mkBooking(), [primary], mkCtx())
    if (first.kind !== 'invoices') throw new Error('expected invoices')
    const counterparty = first.invoices[0]!.counterparty
    const result = buildInvoicesForBooking(mkBooking(), [primary], mkCtx({ prePaidByProcedure: { [primary.id]: { amount: 5000, counterparty } } }))
    expect(result.kind).toBe('exception')
    if (result.kind === 'exception') expect(result.code).toBe('negativeTotal')
  })

  it('GST maths: 15% on the GST-exclusive subtotal, rounded to cents', () => {
    expect(GST_RATE).toBe(0.15)
    const feeOnly = mkProcedure({ id: 'proc-1', governingContractId: NO_CONTRACT.id })
    const lines: BillingLine[] = [
      { id: 'bl-1', procedureId: 'proc-1', chargeBasis: 'fixed', amount: 100.33, description: 'Consumables' },
    ]
    const result = buildInvoicesForBooking(mkBooking(), [feeOnly], mkCtx({ billingLines: lines }))
    if (result.kind !== 'invoices') throw new Error('expected invoices')
    const invoice = result.invoices[0]!
    expect(invoice.subtotal).toBe(100.33)
    expect(invoice.gst).toBe(15.05)
    expect(invoice.total).toBe(115.38)
  })
})
