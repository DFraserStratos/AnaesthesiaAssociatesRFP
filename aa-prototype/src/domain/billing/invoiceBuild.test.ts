/**
 * Pure invoice-building tests (Phase 08; flat Contracts since catch-up Phase
 * 18): the Contract-resolution truth table (the stored Contract governs,
 * Disabled included; "No price in force"; the route's plain RVG Contract when
 * nothing is stored), counterparty-by-holder Party,
 * layout mapping, line building (override adjustment, stored funder
 * allocation, time-only additional procedures), same-counterparty grouping
 * and the GST demo assumption's maths.
 */

import { describe, expect, it } from 'vitest'
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
    anaesthetist: mkAnaesthetist(),
    rvgCodes: { [BASE_SINGLE_10.code]: BASE_SINGLE_10 },
    contracts: { [HOSPITAL_DEFAULT.id]: HOSPITAL_DEFAULT },
    contractPrices: [],
    parties: PARTIES,
    billableParties: {},
    billingLines: [],
    listDateISO: LIST_DATE,
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

  it('a primary procedure on a fixed-price Contract with no price for it is "No price in force"', () => {
    const fixed = mkContract({ id: 'con-fix', name: 'COS ACC fixed fees', holderId: 'party-org', linkedSurgeonIds: ['surg-9'], pricing: { kind: 'fixed' } })
    const ctx = withContracts(HOSPITAL_DEFAULT, fixed)
    const primary = mkProcedure({ rvgBaseCode: 'GA10', governingContractId: 'con-fix' })
    expect(resolveContractForProcedure(primary, ctx)).toEqual({
      kind: 'exception',
      code: 'contractIneffective',
      message: 'No price in force for this procedure under COS ACC fixed fees.',
    })
    // A row for it resolves; an additional procedure keeps the time-only fallback.
    const priced = { ...ctx, contractPrices: [{ id: 'p', contractId: 'con-fix', rvgBaseCode: 'GA10', price: 500 }] }
    expect(resolveContractForProcedure(primary, priced).kind).toBe('resolved')
    expect(resolveContractForProcedure({ ...primary, isAdditional: true }, ctx, 2).kind).toBe('resolved')
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
    rvgBaseCode: BASE_SINGLE_10.code,
    anaestheticStartISO: START_0800,
    handoverISO: HANDOVER_1030,
    governingContractId: 'con-def',
  })
  /** isAdditional: time only — T11 at $30 = $330. */
  const additional = mkProcedure({
    id: 'proc-2',
    rvgBaseCode: BASE_SINGLE_10.code,
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

  it('an additional procedure takes a fixed price only from an ordinal-keyed row (8th review)', () => {
    const type3 = mkContract({ id: 'con-t3', pricing: { kind: 'fixed' } })
    const ctx = withContracts(HOSPITAL_DEFAULT, type3)
    const addOn = { ...additional, governingContractId: 'con-t3' }
    // A row with NO ordinal priced the code as a primary: the add-on must not
    // bill it in full — it falls to the BTM path, time-only.
    const standaloneOnly = buildInvoicesForBooking(mkBooking(), [addOn], {
      ...ctx,
      contractPrices: [{ id: 'cp-1', contractId: 'con-t3', rvgBaseCode: BASE_SINGLE_10.code, price: 2400 }],
    })
    if (standaloneOnly.kind !== 'invoices') throw new Error('expected invoices')
    expect(standaloneOnly.invoices[0]!.lines[0]!.description).toContain('time units only')
    expect(standaloneOnly.invoices[0]!.subtotal).toBe(330)
    // An ordinal-keyed row IS the contract's own second-procedure price.
    const ordinalKeyed = buildInvoicesForBooking(mkBooking(), [{ ...primary, governingContractId: 'con-t3' }, addOn], {
      ...ctx,
      contractPrices: [
        { id: 'cp-1', contractId: 'con-t3', rvgBaseCode: BASE_SINGLE_10.code, price: 2400 },
        { id: 'cp-2', contractId: 'con-t3', rvgBaseCode: BASE_SINGLE_10.code, procedureOrdinal: 2, price: 950 },
      ],
    })
    if (ordinalKeyed.kind !== 'invoices') throw new Error('expected invoices')
    expect(ordinalKeyed.invoices[0]!.lines.map((l) => l.amount)).toEqual([2400, 950])
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
