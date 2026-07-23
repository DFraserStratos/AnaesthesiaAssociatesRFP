/**
 * Pure invoice-building tests (Phase 08): the contract-resolution truth table
 * (stored-effective wins; the RFP's exactly-scoped default-Type-1 fallback;
 * surgeon/organisation holders yield exceptions), counterparty-by-holder,
 * layout mapping, line building (override adjustment, stored funder
 * allocation, time-only additional procedures), same-counterparty grouping
 * and the GST demo assumption's maths.
 */

import { describe, expect, it } from 'vitest'
import {
  GST_RATE,
  buildInvoicesForCard,
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
  mkCard,
  mkContract,
  mkProcedure,
} from './fixtures'
import type { BillingLine, Contract } from '../types'

const LIST_DATE = '2026-07-21'

const HOSPITAL_DEFAULT = mkContract({
  id: 'con-def',
  name: 'Default',
  type: 1,
  isDefault: true,
  effectiveFromISO: '2020-01-01',
})

function mkCtx(overrides: Partial<InvoiceBuildContext> = {}): InvoiceBuildContext {
  return {
    anaesthetist: mkAnaesthetist(),
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

function withContracts(...contracts: Contract[]): InvoiceBuildContext {
  const record: Record<string, Contract> = {}
  for (const c of contracts) record[c.id] = c
  return mkCtx({ contracts: record })
}

describe('resolveContractForProcedure', () => {
  const type2 = mkContract({
    id: 'con-t2',
    name: 'Negotiated Type 2',
    type: 2,
    type2Detail: { basis: 'agreedUnitRate', unitRate: 25 },
  })

  it('the stored contract governs while it is effective on the list date', () => {
    const ctx = withContracts(HOSPITAL_DEFAULT, type2)
    const result = resolveContractForProcedure(mkProcedure({ governingContractId: 'con-t2' }), ctx)
    expect(result).toEqual({ kind: 'resolved', contract: type2 })
  })

  it('a hospital-held stored contract dated out falls back to that hospital default Type 1', () => {
    const dated = { ...type2, effectiveToISO: '2026-06-30' }
    const ctx = withContracts(HOSPITAL_DEFAULT, dated)
    const result = resolveContractForProcedure(mkProcedure({ governingContractId: 'con-t2' }), ctx)
    expect(result.kind).toBe('resolved')
    if (result.kind === 'resolved') expect(result.contract?.id).toBe('con-def')
  })

  it('the fallback target is the DEFAULT, never another surviving negotiated contract', () => {
    const dated = { ...type2, effectiveToISO: '2026-06-30' }
    const other = mkContract({
      id: 'con-other',
      name: 'Other negotiated',
      type: 2,
      type2Detail: { basis: 'percentDiscount', percent: 10 },
    })
    const ctx = withContracts(HOSPITAL_DEFAULT, dated, other)
    const result = resolveContractForProcedure(mkProcedure({ governingContractId: 'con-t2' }), ctx)
    expect(result.kind).toBe('resolved')
    if (result.kind === 'resolved') expect(result.contract?.id).toBe('con-def')
  })

  it('an insurer-held stored contract dated out falls back to that insurer default', () => {
    const insurerDefault = mkContract({ id: 'con-ins-def', holderType: 'insurer', holderId: 'ins-1', isDefault: true })
    const dated = mkContract({
      id: 'con-ins-t2',
      holderType: 'insurer',
      holderId: 'ins-1',
      type: 2,
      type2Detail: { basis: 'agreedUnitRate', unitRate: 24 },
      effectiveToISO: '2026-06-30',
    })
    const ctx = withContracts(insurerDefault, dated)
    const procedure = mkProcedure({ billingRoute: 'insurer', insurerId: 'ins-1', governingContractId: 'con-ins-t2' })
    const result = resolveContractForProcedure(procedure, ctx)
    expect(result.kind).toBe('resolved')
    if (result.kind === 'resolved') expect(result.contract?.id).toBe('con-ins-def')
  })

  it.each(['surgeon', 'organisation', 'billableParty'] as const)(
    'a %s-held stored contract dated out is a billing exception (no mandated default)',
    (holderType) => {
      const dated = mkContract({
        id: 'con-held',
        holderType,
        holderId: 'holder-1',
        type: 2,
        type2Detail: { basis: 'agreedUnitRate', unitRate: 24 },
        effectiveToISO: '2026-06-30',
      })
      const ctx = withContracts(HOSPITAL_DEFAULT, dated)
      const result = resolveContractForProcedure(mkProcedure({ governingContractId: 'con-held' }), ctx)
      expect(result.kind).toBe('exception')
      if (result.kind === 'exception') {
        expect(result.code).toBe('contractIneffective')
        expect(result.message).toContain('no default fallback')
      }
    },
  )

  it('nothing stored on the hospital route resolves the LIST hospital default', () => {
    const result = resolveContractForProcedure(mkProcedure(), mkCtx())
    expect(result).toEqual({ kind: 'resolved', contract: HOSPITAL_DEFAULT })
  })

  it('nothing stored on the hospital route with no list hospital is an exception', () => {
    const ctx = mkCtx()
    delete ctx.listHospitalId
    const result = resolveContractForProcedure(mkProcedure(), ctx)
    expect(result.kind).toBe('exception')
  })

  it('nothing stored on the insurer route resolves the insurer default', () => {
    const insurerDefault = mkContract({ id: 'con-ins-def', holderType: 'insurer', holderId: 'ins-1', isDefault: true })
    const ctx = withContracts(insurerDefault)
    const procedure = mkProcedure({ billingRoute: 'insurer', insurerId: 'ins-1' })
    expect(resolveContractForProcedure(procedure, ctx)).toEqual({ kind: 'resolved', contract: insurerDefault })
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
    const surgeonHeld = mkContract({ id: 'c', holderType: 'surgeon', holderId: 'surg-9' })
    const orgHeld = mkContract({ id: 'c', holderType: 'organisation', holderId: 'org-cos' })
    expect(counterpartyForProcedure(mkProcedure(), HOSPITAL_DEFAULT, 'pat-1')).toEqual({ kind: 'hospital', id: 'hosp-1' })
    expect(counterpartyForProcedure(mkProcedure(), surgeonHeld, 'pat-1')).toEqual({ kind: 'surgeon', id: 'surg-9' })
    expect(counterpartyForProcedure(mkProcedure(), orgHeld, 'pat-1')).toEqual({ kind: 'organisation', id: 'org-cos' })
  })

  it('the insurer route bills the insurer; billable party defaults to the patient', () => {
    expect(
      counterpartyForProcedure(mkProcedure({ billingRoute: 'insurer', insurerId: 'ins-1' }), HOSPITAL_DEFAULT, 'pat-1'),
    ).toEqual({ kind: 'insurer', id: 'ins-1' })
    expect(
      counterpartyForProcedure(mkProcedure({ billingRoute: 'billableParty' }), undefined, 'pat-1'),
    ).toEqual({ kind: 'patient', id: 'pat-1' })
    expect(
      counterpartyForProcedure(mkProcedure({ billingRoute: 'billableParty', billablePartyId: 'bp-7' }), undefined, 'pat-1'),
    ).toEqual({ kind: 'billableParty', id: 'bp-7' })
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

describe('buildInvoicesForCard', () => {
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
    const result = buildInvoicesForCard(mkCard(), [primary, additional], mkCtx())
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
    const result = buildInvoicesForCard(mkCard(), [primary, elective], mkCtx())
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
    const result = buildInvoicesForCard(mkCard(), [overridden], mkCtx())
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
    const result = buildInvoicesForCard(mkCard(), [primary], mkCtx({ billingLines: lines }))
    if (result.kind !== 'invoices') throw new Error('expected invoices')
    expect(result.invoices).toHaveLength(2)
    const insurer = result.invoices.find((i) => i.counterparty.kind === 'insurer')
    const hospital = result.invoices.find((i) => i.counterparty.kind === 'hospital')
    expect(insurer?.subtotal).toBe(400)
    expect(insurer?.lines[0]!.description).toBe('Insurer portion')
    expect(hospital?.subtotal).toBe(230)
  })

  it('a resolution exception on any procedure fails the whole Card with its procedure id', () => {
    const dated = mkContract({
      id: 'con-surg',
      holderType: 'surgeon',
      holderId: 'surg-1',
      type: 2,
      type2Detail: { basis: 'agreedUnitRate', unitRate: 20 },
      effectiveToISO: '2026-06-30',
    })
    const broken = { ...additional, governingContractId: 'con-surg' }
    const result = buildInvoicesForCard(mkCard(), [primary, broken], withContracts(HOSPITAL_DEFAULT, dated))
    expect(result.kind).toBe('exception')
    if (result.kind === 'exception') expect(result.procedureId).toBe('proc-2')
  })

  it('a cancelled Card yields no invoices', () => {
    const cancelled = mkCard({
      cancellation: { reason: 'Patient unwell', by: 'Kirsty W.', role: 'office', source: 'office', atISO: '2026-07-20T09:00:00' },
    })
    const result = buildInvoicesForCard(cancelled, [primary], mkCtx())
    expect(result).toEqual({ kind: 'invoices', invoices: [] })
  })

  it('a Type 2 percent discount rounds the derived rate to cents, so amount and description agree (8th review)', () => {
    const discounted = mkContract({
      id: 'con-disc',
      type: 2,
      type2Detail: { basis: 'percentDiscount', percent: 7 },
    })
    const ctx = withContracts(HOSPITAL_DEFAULT, discounted)
    ctx.anaesthetist = mkAnaesthetist({ unitValue: 27.5 })
    const result = buildInvoicesForCard(mkCard(), [{ ...primary, governingContractId: 'con-disc' }], ctx)
    if (result.kind !== 'invoices') throw new Error('expected invoices')
    const line = result.invoices[0]!.lines[0]!
    // 27.50 less 7% = 25.575 → rounds to $25.58 BEFORE charging: 21 x 25.58.
    expect(line.description).toContain('at $25.58 per unit')
    expect(line.amount).toBe(537.18)
  })

  it('an additional procedure takes a Type 3 fixed price only from an ordinal-keyed row (8th review)', () => {
    const type3 = mkContract({ id: 'con-t3', type: 3 })
    const ctx = withContracts(HOSPITAL_DEFAULT, type3)
    const addOn = { ...additional, governingContractId: 'con-t3' }
    // A row with NO ordinal priced the code as a primary: the add-on must not
    // bill it in full — it falls to the BTM path, time-only.
    const standaloneOnly = buildInvoicesForCard(mkCard(), [addOn], {
      ...ctx,
      contractPrices: [{ id: 'cp-1', contractId: 'con-t3', rvgBaseCode: BASE_SINGLE_10.code, price: 2400 }],
    })
    if (standaloneOnly.kind !== 'invoices') throw new Error('expected invoices')
    expect(standaloneOnly.invoices[0]!.lines[0]!.description).toContain('time units only')
    expect(standaloneOnly.invoices[0]!.subtotal).toBe(330)
    // An ordinal-keyed row IS the contract's own second-procedure price.
    const ordinalKeyed = buildInvoicesForCard(mkCard(), [{ ...primary, governingContractId: 'con-t3' }, addOn], {
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
    const result = buildInvoicesForCard(mkCard(), [primary], mkCtx({ billingLines: lines }))
    expect(result.kind).toBe('exception')
    if (result.kind === 'exception') expect(result.code).toBe('allocationStale')
  })

  it('a negative counterparty total is an exception, never a negative invoice (8th review)', () => {
    const gouged = {
      ...primary,
      priceOverride: { kind: 'dollarAdjustment' as const, amount: -1000, reason: 'Stress test' },
    }
    const result = buildInvoicesForCard(mkCard(), [gouged], mkCtx())
    expect(result.kind).toBe('exception')
    if (result.kind === 'exception') expect(result.code).toBe('negativeTotal')
  })

  it('GST maths: 15% on the GST-exclusive subtotal, rounded to cents', () => {
    expect(GST_RATE).toBe(0.15)
    const feeOnly = mkProcedure({ id: 'proc-1', billingRoute: 'billableParty' })
    const lines: BillingLine[] = [
      { id: 'bl-1', procedureId: 'proc-1', chargeBasis: 'fixed', amount: 100.33, description: 'Consumables' },
    ]
    const result = buildInvoicesForCard(mkCard(), [feeOnly], mkCtx({ billingLines: lines }))
    if (result.kind !== 'invoices') throw new Error('expected invoices')
    const invoice = result.invoices[0]!
    expect(invoice.subtotal).toBe(100.33)
    expect(invoice.gst).toBe(15.05)
    expect(invoice.total).toBe(115.38)
  })
})
