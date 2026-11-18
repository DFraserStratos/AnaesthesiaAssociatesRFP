/**
 * The prepayment rules, pure (catch-up Phase 27; US-06.2.2, US-06.2.6,
 * US-06.3.1, US-08.2.2, FT-06.2; AR-58 2.2, A2, A16): which Procedures are
 * prepaid, the payer groups, the amount, the status, the invoice draft, and
 * the final invoice that leaves a raised prepayment off with nothing deducted.
 */

import { describe, expect, it } from 'vitest'
import { DEFAULT_RVG_TIME_RULE } from './timeUnits'
import { buildInvoicesForBooking, type InvoiceBuildContext } from './invoiceBuild'
import { buildBookingLock } from './lock'
import {
  AA_HOLDING_ACCOUNT,
  isOutstanding,
  isPrepaidContract,
  leastSettled,
  PREPAYMENT_NAMES_ANAESTHETIST,
  prepaidAmountFor,
  prepaidProceduresFor,
  prepaymentGroupsFor,
  prepaymentInvoiceDraftFor,
  prepaymentLineDescription,
  prepaymentPartyFor,
  prepaymentStatusOf,
  type IssuedPrepayment,
} from './prepayment'
import { BASE_SINGLE_10, HANDOVER_1030, START_0800, mkAnaesthetist, mkBooking, mkContract, mkParty, mkProcedure, RVG_MODIFIER_MASTER } from './fixtures'
import type { Contract, Procedure } from '../types'

const HOSPITAL = mkParty()
const SOUTER_PARTY = mkParty({ id: 'party-souter', kind: 'anaesthetist', name: 'Dr M. Souter', codePrefix: 'SOU', hospitalId: undefined })
const SURGEON_PARTY = mkParty({ id: 'party-surgeon', kind: 'surgeon', name: 'Mr Okafor', codePrefix: 'OKA', hospitalId: undefined })

const HOSPITAL_RVG = mkContract({ id: 'con-hosp' })
const RHINO = mkContract({ id: 'con-rhino', aaCode: 'SOU-001', name: 'Rhinoplasty', holderId: SOUTER_PARTY.id, billsTo: 'payer', prepaid: true, pricing: { kind: 'fixed', ranges: [{ startISO: '2026-01-01', price: 1200 }, { startISO: '2026-09-01', price: 1300 }] } })
const BLEPH = mkContract({ id: 'con-bleph', aaCode: 'SOU-002', name: 'Blepharoplasty, upper lids', holderId: SOUTER_PARTY.id, billsTo: 'payer', prepaid: true, pricing: { kind: 'fixed', ranges: [{ startISO: '2026-01-01', price: 900 }] } })
const SURGEON_PREPAID = mkContract({ id: 'con-surg', aaCode: 'OKA-001', name: 'Septorhinoplasty', holderId: SURGEON_PARTY.id, billsTo: 'payer', prepaid: true, pricing: { kind: 'fixed', ranges: [{ startISO: '2026-01-01', price: 1500 }] } })
const NOT_PREPAID_FIXED = mkContract({ id: 'con-fixed', aaCode: 'SOU-003', name: 'Face lift', holderId: SOUTER_PARTY.id, billsTo: 'payer', prepaid: false, pricing: { kind: 'fixed', ranges: [{ startISO: '2026-01-01', price: 2950 }] } })
const PREPAID_FIXED_BACKSTOP = mkContract({ id: 'con-pfp', aaCode: 'AA-PFP', name: 'Prepaid · Fixed price', holderId: 'party-aa', billsTo: 'payer', prepaid: true, systemRole: 'openPriceFallback', pricing: { kind: 'open' } })

const CONTRACTS: Record<string, Contract> = Object.fromEntries([HOSPITAL_RVG, RHINO, BLEPH, SURGEON_PREPAID, NOT_PREPAID_FIXED, PREPAID_FIXED_BACKSTOP].map((c) => [c.id, c]))

const BOOKING = mkBooking({ patientId: 'pat-1' })
const PATIENT_EMAIL = { name: 'Annette Riley', email: 'annette@example.com' }

function proc(id: string, contractId: string, over: Partial<Procedure> = {}): Procedure {
  return mkProcedure({ id, governingContractId: contractId, isPrimary: id === 'p1', ...over })
}

/** 24's price now, as the store hands it in: a fixed Contract's range on 24 Jul, else the typed price. */
function priceOf(p: Procedure): number | null {
  if (p.enteredPrice !== undefined) return p.enteredPrice
  const c = p.governingContractId !== undefined ? CONTRACTS[p.governingContractId] : undefined
  if (c?.pricing.kind === 'fixed') return c.pricing.ranges.filter((r) => r.startISO <= '2026-07-24').at(-1)?.price ?? null
  return null
}

const groupsOf = (procedures: Procedure[], issued: IssuedPrepayment[] = []) =>
  prepaymentGroupsFor({ booking: BOOKING, procedures, contracts: CONTRACTS, issued, priceOf, patient: PATIENT_EMAIL })

describe('detection (FT-06.2)', () => {
  it("Dr Souter's prepaid Contracts and a surgeon's are prepaid; a Contract not flagged prepaid is not", () => {
    expect(isPrepaidContract(RHINO)).toBe(true)
    expect(isPrepaidContract(SURGEON_PREPAID)).toBe(true)
    expect(isPrepaidContract(PREPAID_FIXED_BACKSTOP)).toBe(true)
    expect(isPrepaidContract(NOT_PREPAID_FIXED)).toBe(false)
    expect(isPrepaidContract(HOSPITAL_RVG)).toBe(false)
    expect(isPrepaidContract(undefined)).toBe(false)
  })

  it('per Procedure: a mixed Booking gives exactly its prepaid one; a cancelled Booking gives none', () => {
    const procs = [proc('p1', HOSPITAL_RVG.id), proc('p2', RHINO.id)]
    expect(prepaidProceduresFor(BOOKING, procs, CONTRACTS).map((p) => p.id)).toEqual(['p2'])
    expect(prepaidProceduresFor({ cancellation: { reason: 'x', by: 'y', role: 'office', atISO: '2026-07-21T09:00:00' } } as never, procs, CONTRACTS)).toEqual([])
  })

  it("the Procedure's payer is addressed, a guardian too, never a holder (OQ-73)", () => {
    expect(prepaymentPartyFor(proc('p1', RHINO.id), 'pat-1')).toEqual({ kind: 'patient', id: 'pat-1' })
    const guardian = proc('p1', RHINO.id, { payer: { kind: 'other', id: 'BP0001', name: 'Hana Park', relationship: 'Parent' } as Procedure['payer'] })
    expect(prepaymentPartyFor(guardian, 'pat-1')).toEqual({ kind: 'payer', id: 'BP0001' })
  })
})

describe('the amount (US-06.2.2, US-06.2.6, D27)', () => {
  it('the range in force on the procedure date, or the typed amount; nothing or 0 is noPrice', () => {
    expect(prepaidAmountFor(proc('p1', RHINO.id), 1200)).toEqual({ kind: 'priced', contractId: RHINO.id, amount: 1200, source: 'range' })
    expect(prepaidAmountFor(proc('p1', PREPAID_FIXED_BACKSTOP.id, { enteredPrice: 2000 }), 2000)).toEqual({ kind: 'priced', contractId: PREPAID_FIXED_BACKSTOP.id, amount: 2000, source: 'typed' })
    expect(prepaidAmountFor(proc('p1', PREPAID_FIXED_BACKSTOP.id), null)).toEqual({ kind: 'noPrice' })
    expect(prepaidAmountFor(proc('p1', PREPAID_FIXED_BACKSTOP.id, { enteredPrice: 0 }), 0)).toEqual({ kind: 'noPrice' })
  })

  it("once issued the amount is the invoice line's, whatever the price now (D47)", () => {
    expect(prepaidAmountFor(proc('p1', RHINO.id), 1300, { contractId: RHINO.id, amount: 1200 })).toEqual({ kind: 'priced', contractId: RHINO.id, amount: 1200, source: 'invoiced' })
  })

  it('a typed $2,000 on Prepaid · Fixed price drafts $2,000.00 ex GST and $2,300.00 with GST', () => {
    const typed = proc('p1', PREPAID_FIXED_BACKSTOP.id, { enteredPrice: 2000 })
    const [group] = groupsOf([typed])
    const draft = prepaymentInvoiceDraftFor(group!, [typed], { contracts: CONTRACTS, patientId: 'pat-1', patient: PATIENT_EMAIL })
    expect(draft).toMatchObject({ subtotal: 2000, gst: 300, total: 2300, layout: 'patient', counterparty: { kind: 'patient', id: 'pat-1' } })
  })
})

describe('payer groups (US-06.3.1 "One per payer", D85)', () => {
  const hana = { kind: 'other', id: 'BP0004', name: 'Erik Halvorsen', email: 'erik@example.com', relationship: 'Parent' } as Procedure['payer']
  const hanaAgain = { kind: 'other', id: 'BP0005', name: 'Erik Halvorsen', email: 'erik@example.com', relationship: 'Parent' } as Procedure['payer']

  it('two prepaid Procedures sharing one payer give one group; two separately typed payers (same name and email) give two', () => {
    expect(groupsOf([proc('p1', RHINO.id), proc('p2', BLEPH.id)]).map((g) => g.procedureIds)).toEqual([['p1', 'p2']])
    const two = groupsOf([proc('p1', RHINO.id, { payer: hana }), proc('p2', BLEPH.id, { payer: hanaAgain })])
    expect(two.map((g) => g.payerKey)).toEqual(['payer:BP0004', 'payer:BP0005'])
    expect(two.every((g) => g.state === 'awaitingApproval' && g.ready)).toBe(true)
  })

  it("a Procedure added after its payer's invoice is raised forms a second, pending group; the issued one never grows", () => {
    const issued: IssuedPrepayment = { invoiceId: 'INV1', invoiceNumber: 'AA-1', payer: { kind: 'patient', id: 'pat-1' }, lines: [{ procedureId: 'p1', contractId: RHINO.id, amount: 1200 }] }
    const groups = groupsOf([proc('p1', RHINO.id), proc('p2', BLEPH.id)], [issued])
    expect(groups.map((g) => [g.key, g.state, g.procedureIds])).toEqual([
      ['INV1', 'issued', ['p1']],
      ['pending:patient:pat-1', 'awaitingApproval', ['p2']],
    ])
  })

  it('a noPrice Procedure leaves its group awaiting, not ready, with no amount; a payer with no contact is not ready', () => {
    const [g] = groupsOf([proc('p1', PREPAID_FIXED_BACKSTOP.id)])
    expect(g).toMatchObject({ state: 'awaitingApproval', ready: false, amount: null })
    const noContact = prepaymentGroupsFor({ booking: BOOKING, procedures: [proc('p1', RHINO.id)], contracts: CONTRACTS, issued: [], priceOf, patient: { name: 'No Contact' } })
    expect(noContact[0]).toMatchObject({ amount: 1200, ready: false })
    expect(prepaymentInvoiceDraftFor(g!, [proc('p1', PREPAID_FIXED_BACKSTOP.id)], { contracts: CONTRACTS, patientId: 'pat-1' })).toBeNull()
  })

  it('an issued invoice reads notNeeded when no Procedure on it is still prepaid, changedAfterSending when one changed Contract', () => {
    const issued: IssuedPrepayment = { invoiceId: 'INV1', invoiceNumber: 'AA-1', payer: { kind: 'patient', id: 'pat-1' }, lines: [{ procedureId: 'p1', contractId: RHINO.id, amount: 1200 }, { procedureId: 'p2', contractId: BLEPH.id, amount: 900 }] }
    expect(groupsOf([proc('p1', HOSPITAL_RVG.id), proc('p2', NOT_PREPAID_FIXED.id)], [issued])[0]!.state).toBe('notNeeded')
    expect(groupsOf([proc('p1', RHINO.id), proc('p2', NOT_PREPAID_FIXED.id)], [issued])[0]!.state).toBe('changedAfterSending')
    expect(groupsOf([proc('p1', RHINO.id), proc('p2', SURGEON_PREPAID.id)], [issued])[0]!.state).toBe('changedAfterSending')
    expect(groupsOf([proc('p1', RHINO.id), proc('p2', BLEPH.id)], [issued])[0]!.state).toBe('issued')
  })

  it('a split prepaid Procedure leaves its group not ready (the office removes the split first)', () => {
    const split = proc('p1', RHINO.id, { split: { shares: [] } as unknown as Procedure['split'] })
    expect(groupsOf([split])[0]).toMatchObject({ amount: 1200, ready: false })
  })

  it('a Booking with no prepaid Procedure and nothing issued has no groups', () => {
    expect(groupsOf([proc('p1', HOSPITAL_RVG.id)])).toEqual([])
  })
})

describe('status (US-06.3.2, US-06.3.4)', () => {
  it('from mirror money: unpaid, part paid, paid; pending and the interim states pass through', () => {
    expect(prepaymentStatusOf('issued', { total: 1380, received: 0 })).toBe('unpaid')
    expect(prepaymentStatusOf('issued', { total: 1380, received: 690 })).toBe('partPaid')
    expect(prepaymentStatusOf('issued', { total: 1380, received: 1380 })).toBe('paid')
    expect(prepaymentStatusOf('awaitingApproval')).toBe('awaitingApproval')
    expect(prepaymentStatusOf('notNeeded', { total: 1380, received: 1380 })).toBe('notNeeded')
    expect(prepaymentStatusOf('changedAfterSending', { total: 1380, received: 0 })).toBe('changedAfterSending')
  })

  it("the Booking reads its least settled group's status; outstanding is awaiting, unpaid or part paid", () => {
    expect(leastSettled([])).toBe('none')
    expect(leastSettled(['paid', 'awaitingApproval'])).toBe('awaitingApproval')
    expect(leastSettled(['paid', 'partPaid'])).toBe('partPaid')
    expect(['awaitingApproval', 'unpaid', 'partPaid'].every((s) => isOutstanding(s as never))).toBe(true)
    expect(['paid', 'notNeeded', 'changedAfterSending', 'none'].some((s) => isOutstanding(s as never))).toBe(false)
  })
})

describe('the invoice (D37, D68, FT-06.3)', () => {
  it("the line prints the Procedure's invoice description: an admin's edit shows, a blank Contract description falls through", () => {
    const edited = proc('p1', RHINO.id, { invoiceDescription: { text: 'Rhinoplasty, cosmetic', origin: 'edited' } as Procedure['invoiceDescription'] })
    expect(prepaymentLineDescription(edited, CONTRACTS)).toBe('Rhinoplasty, cosmetic')
    const roomsText = proc('p1', RHINO.id, { procedureText: { text: 'Rhinoplasty from the rooms', source: 'rooms' } as unknown as Procedure['procedureText'] })
    expect(prepaymentLineDescription(roomsText, CONTRACTS)).toBe('Rhinoplasty from the rooms')
  })

  it('one line per Procedure with its Contract, the patient layout; the anaesthetist named by one constant; the payee the AA Holding account', () => {
    const procs = [proc('p1', RHINO.id), proc('p2', BLEPH.id)]
    const draft = prepaymentInvoiceDraftFor(groupsOf(procs)[0]!, procs, { contracts: CONTRACTS, patientId: 'pat-1', patient: PATIENT_EMAIL })!
    expect(draft.lines.map((l) => [l.procedureId, l.amount, l.contractId])).toEqual([['p1', 1200, RHINO.id], ['p2', 900, BLEPH.id]])
    expect(draft).toMatchObject({ subtotal: 2100, gst: 315, total: 2415, layout: 'patient', procedureIds: ['p1', 'p2'] })
    expect(PREPAYMENT_NAMES_ANAESTHETIST).toBe(true)
    expect(AA_HOLDING_ACCOUNT.name).toBe('AA Holding account')
  })
})

describe('left off the final invoice (US-08.2.2, D57, US-05.3.1)', () => {
  const ctx = (over: Partial<InvoiceBuildContext> = {}): InvoiceBuildContext => ({
    patientDobISO: undefined,
    modifiers: RVG_MODIFIER_MASTER,
    anaesthetist: mkAnaesthetist(),
    rvgGroups: { [BASE_SINGLE_10.id]: BASE_SINGLE_10 },
    contracts: CONTRACTS,
    parties: { [HOSPITAL.id]: HOSPITAL, [SOUTER_PARTY.id]: SOUTER_PARTY, [SURGEON_PARTY.id]: SURGEON_PARTY },
    billingLines: [],
    listDateISO: '2026-07-24',
    timeRule: DEFAULT_RVG_TIME_RULE,
    listHospitalId: 'hosp-1',
    patientId: 'pat-1',
    ...over,
  })
  const hospital = (isPrimary: boolean) => proc('ph', HOSPITAL_RVG.id, { isPrimary, rvgGroupId: BASE_SINGLE_10.id, anaestheticStartISO: START_0800, handoverISO: HANDOVER_1030 })
  const rhino = (isPrimary: boolean) => proc('pr', RHINO.id, { isPrimary })
  const leftOff = { pr: { amount: 1200, prepaymentInvoiceId: 'INV0001' } }
  const held = { pr: { prepaid: 1200 } }

  it('mixed: only the not-prepaid Procedure is invoiced, nothing deducted, and the lock records what was left off', () => {
    const procs = [hospital(true), rhino(false)]
    const built = buildInvoicesForBooking(BOOKING, procs, ctx({ prepaidLeftOff: leftOff, held }))
    if (built.kind !== 'invoices') throw new Error(built.message)
    expect(built.invoices).toHaveLength(1)
    expect(built.invoices[0]!.counterparty.kind).toBe('hospital')
    expect(built.invoices[0]!.lines.every((l) => l.procedureId === 'ph' && l.amount > 0)).toBe(true)
    const lock = buildBookingLock({ booking: BOOKING, procedures: procs, ctx: ctx({ prepaidLeftOff: leftOff, held }), takenAtISO: '', takenBy: '', partyName: (r) => r.id })
    expect(lock.settledByPrepayment).toEqual(leftOff)
    expect(lock.procedures.find((p) => p.procedureId === 'pr')?.price).toBe(1200)
  })

  it('a prepaid primary left off leaves the additional at the price it had with the primary invoiced', () => {
    const procs = [rhino(true), hospital(false)]
    const invoiced = buildInvoicesForBooking(BOOKING, procs, ctx())
    const left = buildInvoicesForBooking(BOOKING, procs, ctx({ prepaidLeftOff: leftOff, held }))
    if (invoiced.kind !== 'invoices' || left.kind !== 'invoices') throw new Error('expected invoices')
    const hospitalOf = (r: typeof invoiced) => (r.kind === 'invoices' ? r.invoices.find((i) => i.counterparty.kind === 'hospital')?.subtotal : undefined)
    expect(hospitalOf(left)).toBe(hospitalOf(invoiced))
    expect(left.invoices.some((i) => i.lines.some((l) => l.procedureId === 'pr'))).toBe(false)
  })

  it('all prepaid: no final invoice', () => {
    const built = buildInvoicesForBooking(BOOKING, [rhino(true)], ctx({ prepaidLeftOff: leftOff, held }))
    expect(built).toEqual({ kind: 'invoices', invoices: [] })
  })

  it('unapproved at authorise: billed on the final invoice at the Procedure price', () => {
    const built = buildInvoicesForBooking(BOOKING, [rhino(true)], ctx())
    if (built.kind !== 'invoices') throw new Error(built.message)
    expect(built.invoices).toHaveLength(1)
    expect(built.invoices[0]!.subtotal).toBe(1200)
  })
})
