/**
 * Pure invoice-building tests (Phase 08; flat Contracts since catch-up Phase
 * 18): the Contract-resolution truth table (the stored Contract governs,
 * Disabled included; "Needs a price"; the route's plain RVG Contract when
 * nothing is stored), counterparty-by-holder Party,
 * layout mapping, line building (override adjustment, stored funder
 * allocation, time-only additional procedures), same-counterparty grouping
 * and the GST demo assumption's maths.
 */

import { describe, expect, it } from 'vitest'
import { DEFAULT_RVG_TIME_RULE } from './timeUnits'
import {
  GST_RATE,
  buildInvoicesForBooking,
  counterpartyForProcedure,
  layoutFor,
  resolveContractForProcedure,
  type InvoiceBuildContext,
} from './invoiceBuild'
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
import type { BillingLine, Contract, Party } from '../types'

/** The holder Parties these tests use (catch-up Phase 18): each bills today's counterparty. */
const PARTIES: Record<string, Party> = Object.fromEntries(
  [
    mkParty(),
    mkParty({ id: 'party-ins-1', kind: 'insurer', name: 'Insurer', codePrefix: 'INS', hospitalId: undefined, legacyCounterparty: { kind: 'insurer', id: 'ins-1' } }),
    mkParty({ id: 'party-surgeon', kind: 'surgeon', name: 'Surgeon', codePrefix: 'SUR', hospitalId: undefined, legacyCounterparty: { kind: 'surgeon', id: 'surg-9' } }),
    mkParty({ id: 'party-org', kind: 'surgeonGroup', name: 'Group', codePrefix: 'ORG', hospitalId: undefined, legacyCounterparty: { kind: 'organisation', id: 'org-cos' } }),
    mkParty({ id: 'party-bp', kind: 'surgeonGroup', name: 'Clinic', codePrefix: 'CLN', hospitalId: undefined, legacyCounterparty: { kind: 'billableParty', id: 'bp-1' } }),
  ].map((p) => [p.id, p]),
)

const LIST_DATE = '2026-07-21'

/** The hospital Party's plain RVG Contract. */
const HOSPITAL_DEFAULT = mkContract({ id: 'con-def', name: 'Test hospital RVG' })

function mkCtx(overrides: Partial<InvoiceBuildContext> = {}): InvoiceBuildContext {
  return {
    // No patient date of birth: no age modifier (catch-up Phase 19b).
    patientDobISO: undefined,
    modifiers: RVG_MODIFIER_MASTER,
    anaesthetist: mkAnaesthetist(),
    rvgGroups: { [BASE_SINGLE_10.id]: BASE_SINGLE_10 },
    contracts: { [HOSPITAL_DEFAULT.id]: HOSPITAL_DEFAULT },
    parties: PARTIES,
    billableParties: {},
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
    expect(resolveContractForProcedure({ ...primary, isAdditional: true }, ctx)).toEqual(needs)
    // On or after the first start it resolves; an office fixed fee is a typed price.
    expect(resolveContractForProcedure(primary, { ...ctx, listDateISO: '2026-08-01' }).kind).toBe('resolved')
    const typed = { ...primary, priceOverride: { kind: 'fixedFee' as const, amount: 900, reason: 'Office price' } }
    expect(resolveContractForProcedure(typed, ctx).kind).toBe('resolved')
  })

  it("nothing stored on the hospital route bills under the LIST hospital's plain RVG Contract, never a rate Contract", () => {
    const result = resolveContractForProcedure(mkProcedure(), withContracts(rateContract, HOSPITAL_DEFAULT))
    expect(result).toEqual({ kind: 'resolved', contract: HOSPITAL_DEFAULT })
  })

  it('an informational insurer on the hospital route still bills the hospital (03.4)', () => {
    const result = resolveContractForProcedure(mkProcedure({ insurerId: 'ins-1' }), mkCtx())
    expect(result).toEqual({ kind: 'resolved', contract: HOSPITAL_DEFAULT })
  })

  it('nothing stored on the hospital route with no list hospital is an exception', () => {
    const ctx = mkCtx()
    delete ctx.listHospitalId
    const result = resolveContractForProcedure(mkProcedure(), ctx)
    expect(result.kind).toBe('exception')
  })

  it("nothing stored on the insurer route bills under the insurer Party's plain RVG Contract", () => {
    const insurerRvg = mkContract({ id: 'con-ins', aaCode: 'INS-001', holderId: 'party-ins-1' })
    const ctx = withContracts(insurerRvg)
    const procedure = mkProcedure({ billingRoute: 'insurer', insurerId: 'ins-1' })
    expect(resolveContractForProcedure(procedure, ctx)).toEqual({ kind: 'resolved', contract: insurerRvg })
  })

  it('a Party with no plain RVG Contract is a plain billing exception, never a throw', () => {
    const result = resolveContractForProcedure(mkProcedure(), withContracts(rateContract))
    expect(result.kind).toBe('exception')
    if (result.kind === 'exception') expect(result.code).toBe('noContract')
  })

  it('the billable party route needs no contract at all (standard rates)', () => {
    const procedure = mkProcedure({ billingRoute: 'billableParty', patientPaymentCategory: 'selfFundedPostProcedure' })
    expect(resolveContractForProcedure(procedure, mkCtx())).toEqual({ kind: 'resolved' })
  })

  it('a dangling governingContractId is an exception, never "nothing stored" (8th review)', () => {
    const result = resolveContractForProcedure(mkProcedure({ governingContractId: 'con-deleted' }), mkCtx())
    expect(result.kind).toBe('exception')
    if (result.kind === 'exception') expect(result.code).toBe('contractMissing')
  })

  it('no billing route and nothing stored is an exception, never a throw (8th review)', () => {
    const bare = mkProcedure()
    delete (bare as { billingRoute?: string }).billingRoute
    const result = resolveContractForProcedure(bare, mkCtx())
    expect(result.kind).toBe('exception')
    if (result.kind === 'exception') expect(result.code).toBe('noBillingRoute')
  })
})

describe('counterpartyForProcedure + layoutFor', () => {
  it('the contract-holder route bills the HOLDER: hospital, surgeon or organisation', () => {
    const surgeonHeld = mkContract({ id: 'c', holderId: 'party-surgeon' })
    const orgHeld = mkContract({ id: 'c', holderId: 'party-org' })
    expect(counterpartyForProcedure(mkProcedure(), HOSPITAL_DEFAULT, 'pat-1', PARTIES)).toEqual({ kind: 'hospital', id: 'hosp-1' })
    expect(counterpartyForProcedure(mkProcedure(), surgeonHeld, 'pat-1', PARTIES)).toEqual({ kind: 'surgeon', id: 'surg-9' })
    expect(counterpartyForProcedure(mkProcedure(), orgHeld, 'pat-1', PARTIES)).toEqual({ kind: 'organisation', id: 'org-cos' })
  })

  it('the insurer route bills the insurer; billable party defaults to the patient', () => {
    expect(
      counterpartyForProcedure(mkProcedure({ billingRoute: 'insurer', insurerId: 'ins-1' }), HOSPITAL_DEFAULT, 'pat-1', PARTIES),
    ).toEqual({ kind: 'insurer', id: 'ins-1' })
    expect(
      counterpartyForProcedure(mkProcedure({ billingRoute: 'billableParty' }), undefined, 'pat-1', PARTIES),
    ).toEqual({ kind: 'patient', id: 'pat-1' })
    expect(
      counterpartyForProcedure(mkProcedure({ billingRoute: 'billableParty', billablePartyId: 'bp-7' }), undefined, 'pat-1', PARTIES),
    ).toEqual({ kind: 'billableParty', id: 'bp-7' })
  })

  it('an informational insurer on the hospital route never becomes the counterparty (03.4)', () => {
    expect(
      counterpartyForProcedure(mkProcedure({ insurerId: 'ins-1' }), HOSPITAL_DEFAULT, 'pat-1', PARTIES),
    ).toEqual({ kind: 'hospital', id: 'hosp-1' })
  })

  it('layout: contract-holder kinds vs patient kinds', () => {
    expect(layoutFor({ kind: 'hospital', id: 'x' })).toBe('contractHolder')
    expect(layoutFor({ kind: 'insurer', id: 'x' })).toBe('contractHolder')
    expect(layoutFor({ kind: 'surgeon', id: 'x' })).toBe('contractHolder')
    expect(layoutFor({ kind: 'organisation', id: 'x' })).toBe('contractHolder')
    expect(layoutFor({ kind: 'patient', id: 'x' })).toBe('patient')
    expect(layoutFor({ kind: 'billableParty', id: 'x' })).toBe('patient')
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
  /** isAdditional: time only — T11 at $30 = $330. */
  const additional = mkProcedure({
    id: 'proc-2',
    rvgGroupId: BASE_SINGLE_10.id,
    anaestheticStartISO: START_0800,
    handoverISO: HANDOVER_1030,
    governingContractId: 'con-def',
    isAdditional: true,
  })

  it('same-counterparty procedures share ONE invoice; the additional line is time-only', () => {
    const result = buildInvoicesForBooking(mkBooking(), [primary, additional], mkCtx())
    expect(result.kind).toBe('invoices')
    if (result.kind !== 'invoices') return
    expect(result.invoices).toHaveLength(1)
    const invoice = result.invoices[0]!
    expect(invoice.counterparty).toEqual({ kind: 'hospital', id: 'hosp-1' })
    expect(invoice.layout).toBe('contractHolder')
    expect(invoice.lines).toHaveLength(2)
    expect(invoice.lines[0]!.amount).toBe(630)
    expect(invoice.lines[0]!.description).toContain('21 units at $30.00 per unit')
    expect(invoice.lines[1]!.amount).toBe(330)
    expect(invoice.lines[1]!.units).toBe(11)
    expect(invoice.lines[1]!.description).toContain('time units only')
    expect(invoice.subtotal).toBe(960)
    expect(invoice.gst).toBe(144)
    expect(invoice.total).toBe(1104)
  })

  it('procedures with DIFFERENT funders split into separate invoices (the §11 reading)', () => {
    const elective = { ...additional, billingRoute: 'billableParty' as const }
    delete (elective as { governingContractId?: string }).governingContractId
    const result = buildInvoicesForBooking(mkBooking(), [primary, elective], mkCtx())
    expect(result.kind).toBe('invoices')
    if (result.kind !== 'invoices') return
    expect(result.invoices).toHaveLength(2)
    const [hospital, patient] = result.invoices
    expect(hospital!.counterparty.kind).toBe('hospital')
    expect(patient!.counterparty).toEqual({ kind: 'patient', id: 'pat-1' })
    expect(patient!.layout).toBe('patient')
    expect(patient!.lines).toHaveLength(1)
    expect(patient!.lines[0]!.description).toContain('time units only')
    expect(patient!.subtotal).toBe(330)
  })

  it('a price override lands as an adjustment line carrying its reason, so lines sum to the fee', () => {
    const overridden = {
      ...primary,
      priceOverride: { kind: 'dollarAdjustment' as const, amount: -50, reason: 'Family discount' },
    }
    const result = buildInvoicesForBooking(mkBooking(), [overridden], mkCtx())
    if (result.kind !== 'invoices') throw new Error('expected invoices')
    const invoice = result.invoices[0]!
    expect(invoice.lines).toHaveLength(2)
    expect(invoice.lines[1]!.description).toBe('Price override, Family discount')
    expect(invoice.lines[1]!.amount).toBe(-50)
    expect(invoice.subtotal).toBe(580)
  })

  it('stored funder-override lines ARE the allocation: overridden line to its funder, plain line to the procedure counterparty', () => {
    const lines: BillingLine[] = [
      {
        id: 'bl-1',
        procedureId: 'proc-1',
        chargeBasis: 'rvg',
        amount: 400,
        description: 'Insurer portion',
        funderOverride: { kind: 'insurer', id: 'ins-1' },
      },
      { id: 'bl-2', procedureId: 'proc-1', chargeBasis: 'rvg', amount: 230, description: 'Patient portion' },
    ]
    const result = buildInvoicesForBooking(mkBooking(), [primary], mkCtx({ billingLines: lines }))
    if (result.kind !== 'invoices') throw new Error('expected invoices')
    expect(result.invoices).toHaveLength(2)
    const insurer = result.invoices.find((i) => i.counterparty.kind === 'insurer')
    const hospital = result.invoices.find((i) => i.counterparty.kind === 'hospital')
    expect(insurer?.subtotal).toBe(400)
    expect(insurer?.lines[0]!.description).toBe('Insurer portion')
    expect(hospital?.subtotal).toBe(230)
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

  it('RVG less a discount rounds the derived rate to cents, so amount and description agree (8th review)', () => {
    const discounted = mkContract({
      id: 'con-disc',
      pricing: { kind: 'rvgDiscount', discountPct: 7 },
    })
    const ctx = withContracts(HOSPITAL_DEFAULT, discounted)
    ctx.anaesthetist = mkAnaesthetist({ unitValue: 27.5 })
    const result = buildInvoicesForBooking(mkBooking(), [{ ...primary, governingContractId: 'con-disc' }], ctx)
    if (result.kind !== 'invoices') throw new Error('expected invoices')
    const line = result.invoices[0]!.lines[0]!
    // 27.50 less 7% = 25.575 → rounds to $25.58 BEFORE charging: 21 x 25.58.
    expect(line.description).toContain('at $25.58 per unit')
    expect(line.amount).toBe(537.18)
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

  it('a stale funder allocation is an exception at billing time (8th review)', () => {
    const lines: BillingLine[] = [
      {
        id: 'bl-1',
        procedureId: 'proc-1',
        chargeBasis: 'rvg',
        amount: 400,
        description: 'Insurer portion',
        funderOverride: { kind: 'insurer', id: 'ins-1' },
      },
      // 400 + 100 = 500, but the fee under the resolved contract is 630.
      { id: 'bl-2', procedureId: 'proc-1', chargeBasis: 'rvg', amount: 100, description: 'Balance' },
    ]
    const result = buildInvoicesForBooking(mkBooking(), [primary], mkCtx({ billingLines: lines }))
    expect(result.kind).toBe('exception')
    if (result.kind === 'exception') expect(result.code).toBe('allocationStale')
  })

  it('a negative counterparty total is an exception, never a negative invoice (8th review)', () => {
    const gouged = {
      ...primary,
      priceOverride: { kind: 'dollarAdjustment' as const, amount: -1000, reason: 'Stress test' },
    }
    const result = buildInvoicesForBooking(mkBooking(), [gouged], mkCtx())
    expect(result.kind).toBe('exception')
    if (result.kind === 'exception') expect(result.code).toBe('negativeTotal')
  })

  it('GST maths: 15% on the GST-exclusive subtotal, rounded to cents', () => {
    expect(GST_RATE).toBe(0.15)
    const feeOnly = mkProcedure({ id: 'proc-1', billingRoute: 'billableParty' })
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
