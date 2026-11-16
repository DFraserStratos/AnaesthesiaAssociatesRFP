/**
 * Billing-run orchestration tests (Phase 08): wiring + idempotence, guards,
 * grouping, every seeded charge-basis exemplar (each pricing kind, rate x time,
 * the fee split on the Booking, split pair, insured reimbursement, the COS
 * surgeon-group holder), delivery stamped by the run and the office's Resend
 * (catch-up Phase 22),
 * a Disabled Contract still billing and the "Needs a price" exception,
 * override + snapshot immunity, unique invoice numbers, the design-day live
 * path, system-sourced audit, the billedAt view effect and identity
 * separation (no NHI in billing data).
 */

import { completeAnswered } from '../test/completeAnswered'
import { splitLineText } from '../domain/billing/splitShare'
import { describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from './appStore'
import { handoffListCases, resendInvoice, retryBillingCase, runBillingForList, wireBillingRun, type BillingRunResult } from './billingRun'
import { authoriseList, editProcedure, reassignBooking, submitList } from './lifecycle'
import { setProcedureContract } from './contractSelectionActions'
import { DEMO_TRIGGER_ACTOR } from './demoActors'
import { addPriceRange, disableContract, editContract } from './contractActions'
import { needsPriceMessage } from '../domain/billing/priceRanges'
import { editAnaesthetist } from './mastersActions'
import { setProcedureSplit } from './splitActions'
import { advanceClockMinutes } from './clockActions'
import { clockISO, type Actor } from './mutate'
import { accpayInvoicesFor, invoicesForList, isListBilled, proceduresForBooking, submittedLists } from './selectors'
import { ANAE, BP, HOSP, INS, ORG, PAT, SEED_LIST_IDS, SEED_MARKERS, CONTRACT } from '../domain/seed'
import { roundToCents } from '../domain/billing/money'
import type { Invoice, InvoiceLine, Party } from '../domain/types'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const SOUTER: Actor = {
  who: 'Dr Melanie Souter',
  role: 'anaesthetist',
  source: 'anaesthetist',
  anaesthetistId: ANAE.souter,
}

function marker(key: string): string {
  const m = SEED_MARKERS[key]
  if (m === undefined) throw new Error(`missing marker ${key}`)
  return m.entityId
}

const MORRISON_LIST = SEED_LIST_IDS.morrisonMon20
const WHITAKER_LIST = SEED_LIST_IDS.whitakerFri17
const SOUTER_PM = SEED_LIST_IDS.souterPm21

function store(): BoundAppStore {
  return createAppStore()
}

function listOf(api: BoundAppStore, bookingId: string): string {
  const booking = api.getState().schedule.bookings[bookingId]
  if (booking === undefined) throw new Error(`missing booking ${bookingId}`)
  return booking.listId
}

/** ACTIVE → submit (office) → authorise → run. Every step must succeed. */
function stageAndBill(api: BoundAppStore, listId: string): BillingRunResult {
  const list = api.getState().schedule.lists[listId]
  if (list === undefined) throw new Error(`missing list ${listId}`)
  if (list.state === 'ACTIVE') {
    const submitted = submitList(api, OFFICE, listId)
    if (!submitted.ok) throw new Error(`submit refused: ${submitted.message}`)
  }
  const authorised = authoriseList(api, OFFICE, listId)
  if (!authorised.ok) throw new Error(`authorise refused: ${authorised.message}`)
  const run = runBillingForList(api, listId)
  if (!run.ok) throw new Error(`run refused: ${run.message}`)
  return run.value
}

function linesOf(api: BoundAppStore, invoiceId: string): InvoiceLine[] {
  return Object.values(api.getState().billing.invoiceLines)
    .filter((l) => l.invoiceId === invoiceId)
    .sort((a, b) => a.id.localeCompare(b.id))
}

function invoicesForBooking(api: BoundAppStore, bookingId: string): Invoice[] {
  return Object.values(api.getState().billing.invoices)
    .filter((i) => i.bookingId === bookingId)
    .sort((a, b) => a.id.localeCompare(b.id))
}

/** The Procedure's invoice description: what its fee line prints (catch-up Phase 22). */
function wordingOf(api: BoundAppStore, procedureId: string | undefined): string | undefined {
  return procedureId !== undefined ? api.getState().schedule.procedures[procedureId]?.invoiceDescription?.text : undefined
}

/** Edit one holder Party in place (a direct state edit, as the Master data sheet would save it). */
function patchParty(api: BoundAppStore, partyId: string, patch: (party: Party) => Party): void {
  api.setState((s) => {
    const party = s.masters.parties[partyId]
    if (party === undefined) throw new Error(`missing party ${partyId}`)
    return { masters: { ...s.masters, parties: { ...s.masters.parties, [partyId]: patch(party) } } }
  })
}

function listBilledAudit(api: BoundAppStore, listId: string) {
  return api.getState().audit.filter((a) => a.action === 'list.billed' && a.entityId === listId).at(-1)
}

describe('wiring and guards', () => {
  it('wireBillingRun makes authorise raise invoices; a second run is refused (idempotence)', () => {
    const api = store()
    const unwire = wireBillingRun(api)
    try {
      expect(authoriseList(api, OFFICE, MORRISON_LIST).ok).toBe(true)
      expect(invoicesForList(api.getState(), MORRISON_LIST)).toHaveLength(6)
      expect(isListBilled(api.getState().schedule.lists[MORRISON_LIST]!)).toBe(true)
      const rerun = runBillingForList(api, MORRISON_LIST)
      expect(rerun).toMatchObject({ ok: false, code: 'alreadyBilled' })
    } finally {
      unwire()
    }
  })

  it('refuses a list that is not AUTHORISED, and an unknown list', () => {
    const api = store()
    expect(runBillingForList(api, WHITAKER_LIST)).toMatchObject({ ok: false, code: 'listNotAuthorised' })
    expect(runBillingForList(api, 'L-nope')).toMatchObject({ ok: false, code: 'notFound' })
  })
})

describe('the Morrison run (same-counterparty grouping, audit, view effects)', () => {
  function billMorrison(api: BoundAppStore): BillingRunResult {
    return stageAndBill(api, MORRISON_LIST)
  }

  it('6 completed hospital-route bookings yield 6 St George invoices; the cancelled booking yields none', () => {
    const api = store()
    const result = billMorrison(api)
    expect(result.exceptions).toEqual([])
    expect(result.invoiceIds).toHaveLength(6)
    const invoices = invoicesForList(api.getState(), MORRISON_LIST)
    expect(invoices).toHaveLength(6)
    for (const inv of invoices) {
      expect(inv.counterparty).toEqual({ kind: 'hospital', id: HOSP.stg })
      expect(inv.layout).toBe('contractHolder')
      expect(inv.kind).toBe('standard')
      expect(inv.gst).toBe(roundToCents(inv.subtotal * 0.15))
      expect(inv.total).toBe(roundToCents(inv.subtotal + inv.gst))
    }
    expect(invoicesForBooking(api, marker('cancelledBooking'))).toHaveLength(0)
  })

  it("the ACC booking at its Contract's rate ($25/unit via stgAcc), the anaesthetist's rate elsewhere ($35/unit)", () => {
    const api = store()
    billMorrison(api)
    const accInvoice = invoicesForBooking(api, marker('accRelatedBooking'))[0]
    expect(accInvoice).toBeDefined()
    // The holder's layout carries the BTM breakdown at the unit value charged; the line prints the invoice description.
    const accLine = linesOf(api, accInvoice!.id)[0]!
    expect(accLine.btm?.unitValue).toBe(25)
    expect(accLine.amount).toBe(roundToCents(accLine.units! * 25))
    expect(accLine.description).toBe(wordingOf(api, accLine.procedureId))
    const missingRefBookingId = api.getState().schedule.procedures[marker('missingBillingRef1')]!.bookingId
    const standardInvoice = invoicesForBooking(api, missingRefBookingId)[0]
    expect(standardInvoice).toBeDefined()
    const standardLine = linesOf(api, standardInvoice!.id)[0]!
    expect(standardLine.btm?.unitValue).toBe(35)
    expect(standardLine.amount).toBe(roundToCents(standardLine.units! * 35))
  })

  it("once billed and handed to Xero, the ACC booking reads ACC from its Contract's tag, and only it (catch-up Phase 18a)", () => {
    const api = store()
    billMorrison(api)
    handoffListCases(api, MORRISON_LIST)
    const rows = accpayInvoicesFor(api.getState(), ANAE.morrison, '2026-07-21')
    const morrison = rows.filter((r) => invoicesForList(api.getState(), MORRISON_LIST).some((i) => i.id === r.invoiceId))
    expect(morrison).toHaveLength(6)
    const acc = morrison.filter((r) => r.accFunded)
    expect(acc.map((r) => api.getState().billing.cases[r.caseId]?.bookingId)).toEqual([marker('accRelatedBooking')])
  })

  it('the missing-billing-reference booking bills anyway (an advisory, never a billing blocker)', () => {
    const api = store()
    billMorrison(api)
    const bookingId = api.getState().schedule.procedures[marker('missingBillingRef1')]!.bookingId
    expect(invoicesForBooking(api, bookingId)).toHaveLength(1)
  })

  it('audits the whole run source=system and never stamps a locked booking', () => {
    const api = store()
    const before = Object.fromEntries(
      Object.values(api.getState().schedule.bookings)
        .filter((c) => c.listId === MORRISON_LIST)
        .map((c) => [c.id, c.lastModifiedAtISO]),
    )
    billMorrison(api)
    const state = api.getState()
    const runAudit = state.audit.filter((a) => a.source === 'system' && a.who === 'Billing run')
    expect(runAudit.filter((a) => a.action === 'invoice.create')).toHaveLength(6)
    expect(runAudit.filter((a) => a.action === 'booking.billed')).toHaveLength(6)
    expect(runAudit.filter((a) => a.action === 'list.billed')).toHaveLength(1)
    expect(runAudit.filter((a) => a.action === 'list.billed')[0]!.entityId).toBe(MORRISON_LIST)
    for (const [bookingId, atISO] of Object.entries(before)) {
      expect(state.schedule.bookings[bookingId]!.lastModifiedAtISO).toBe(atISO)
    }
  })

  it('stamps billedAtISO at run completion: the list leaves the queue while SUBMITTED lists remain', () => {
    const api = store()
    billMorrison(api)
    const state = api.getState()
    const morrison = state.schedule.lists[MORRISON_LIST]!
    expect(morrison.billedAtISO).toBe(clockISO(state.clock))
    expect(isListBilled(morrison)).toBe(true)
    const queue = submittedLists(state).map((l) => l.id)
    expect(queue).not.toContain(MORRISON_LIST)
    expect(queue).toContain(WHITAKER_LIST)
    expect(isListBilled(state.schedule.lists[WHITAKER_LIST]!)).toBe(false)
  })
})

describe('charge bases and holders', () => {
  it('Whitaker bills entirely at the Health NZ agreed rate ($23/unit)', () => {
    const api = store()
    const result = stageAndBill(api, WHITAKER_LIST)
    expect(result.exceptions).toEqual([])
    const invoices = invoicesForList(api.getState(), WHITAKER_LIST)
    expect(invoices).toHaveLength(5)
    for (const inv of invoices) {
      expect(inv.counterparty).toEqual({ kind: 'hospital', id: HOSP.cph })
      const line = linesOf(api, inv.id)[0]!
      expect(line.btm?.unitValue).toBe(23)
      expect(line.amount).toBe(roundToCents(line.units! * 23))
      expect(line.description).toBe(wordingOf(api, line.procedureId))
    }
  })

  it("the surgeon's fixed price bills the payer on the Booking, one invoice with the hernia (catch-up Phase 21, US-11.2.1; 19a, RV-07)", () => {
    const api = store()
    const bookingId = marker('bariatricType3Booking')
    stageAndBill(api, listOf(api, bookingId))
    const invoices = invoicesForBooking(api, bookingId)
    // Doyle's price list bills the payer: both Procedures go to the patient, Gareth Mills, on one invoice.
    expect(invoices).toHaveLength(1)
    const inv = invoices[0]!
    expect(inv.counterparty).toEqual({ kind: 'patient', id: 'PT0015' })
    expect(inv.layout).toBe('patient')
    // The gastric bypass at the range in force on Tue 14 Jul, then the hernia at RVG time units only.
    expect(linesOf(api, inv.id).map((l) => l.amount)).toEqual([2800, 61])
    expect(inv.subtotal).toBe(2861)
    expect(inv.total).toBe(3290.15)
    // The hernia: 2 time units at Dr Fitzgerald's $30.50, printed with its own invoice description.
    const hernia = linesOf(api, inv.id)[1]!
    expect(hernia.units).toBe(2)
    expect(hernia.description).toBe(wordingOf(api, hernia.procedureId))
    // The patient's layout carries no BTM breakdown.
    expect(linesOf(api, inv.id).every((l) => l.btm === undefined)).toBe(true)
    // The payer's details are snapshotted with the debt.
    expect(inv.billedTo?.name).toBe('Gareth Mills')
  })

  it("the rate x time booking bills hours x the agreed rate under the billableParty-held contract, on the holder's layout", () => {
    const api = store()
    const bookingId = marker('rateTimeBooking')
    stageAndBill(api, listOf(api, bookingId))
    const invoice = invoicesForBooking(api, bookingId)[0]
    expect(invoice).toBeDefined()
    expect(invoice!.counterparty).toEqual({ kind: 'billableParty', id: BP.ariaClinic })
    // Catch-up Phase 22: the layout comes from the Contract, which bills its holder (it was the patient's by counterparty kind).
    expect(invoice!.layout).toBe('contractHolder')
    const lines = linesOf(api, invoice!.id)
    expect(lines).toHaveLength(1)
    // 3 hours at the agreed $480 an hour; the line prints the invoice description, and no BTM (not an RVG fee).
    expect(lines[0]!.amount).toBe(1440)
    expect(lines[0]!.description).toBe(wordingOf(api, lines[0]!.procedureId))
    expect(lines[0]!.btm).toBeUndefined()
  })

  it('the AIA claim booking is on No contract · RVG and bills the PATIENT at her anaesthetist rate (not the insurer)', () => {
    const api = store()
    const bookingId = marker('aiaClaimBooking')
    stageAndBill(api, listOf(api, bookingId))
    const invoice = invoicesForBooking(api, bookingId)[0]
    expect(invoice).toBeDefined()
    const patientId = api.getState().schedule.bookings[bookingId]!.patientId
    expect(invoice!.counterparty).toEqual({ kind: 'patient', id: patientId })
    expect(invoice!.layout).toBe('patient')
    const line = linesOf(api, invoice!.id)[0]!
    expect(line.amount).toBe(roundToCents(line.units! * 32))
    expect(line.btm).toBeUndefined()
    expect(line.description).toBe(wordingOf(api, line.procedureId))
  })

  it("the COS booking bills the surgeon group's organisation counterparty at its Contract's rate ($24/unit)", () => {
    const api = store()
    const bookingId = marker('cosAccContractBooking')
    stageAndBill(api, listOf(api, bookingId))
    const invoice = invoicesForBooking(api, bookingId)[0]
    expect(invoice).toBeDefined()
    expect(invoice!.counterparty).toEqual({ kind: 'organisation', id: ORG.cos })
    const line = linesOf(api, invoice!.id)[0]!
    expect(line.btm?.unitValue).toBe(24)
    expect(line.amount).toBe(roundToCents(line.units! * 24))
  })
})

describe('split billing', () => {
  it('same funder: the split pair shares ONE invoice and the additional procedure is time-only', () => {
    const api = store()
    const bookingId = marker('splitBillingBooking')
    stageAndBill(api, listOf(api, bookingId))
    const invoices = invoicesForBooking(api, bookingId)
    expect(invoices).toHaveLength(1)
    expect(invoices[0]!.counterparty).toEqual({ kind: 'hospital', id: HOSP.forte })
    const lines = linesOf(api, invoices[0]!.id)
    expect(lines).toHaveLength(2)
    // 30 minutes = 2 time units at Souter's $26.50: time only.
    expect(lines[1]!.description).toBe(wordingOf(api, lines[1]!.procedureId))
    expect(lines[1]!.units).toBe(2)
    expect(lines[1]!.amount).toBe(53)
    expect(lines[1]!.btm).toMatchObject({ time: 2, unitValue: 26.5 })
  })

  it('different funders: moving the additional procedure to No contract · RVG bills the patient, TWO invoices (the §11 reading)', () => {
    const api = store()
    const bookingId = marker('splitBillingBooking')
    const proc2 = proceduresForBooking(api.getState(), bookingId)[1]!
    const edited = setProcedureContract(api, OFFICE, proc2.id, CONTRACT.noContractRvg)
    expect(edited.ok).toBe(true)
    stageAndBill(api, listOf(api, bookingId))
    const invoices = invoicesForBooking(api, bookingId)
    expect(invoices).toHaveLength(2)
    const patientInvoice = invoices.find((i) => i.counterparty.kind === 'patient')
    expect(patientInvoice).toBeDefined()
    expect(patientInvoice!.layout).toBe('patient')
    expect(patientInvoice!.subtotal).toBe(53)
    expect(linesOf(api, patientInvoice!.id)[0]!).toMatchObject({ units: 2, amount: 53 })
  })

  it('the fee split as seeded: nib $132.50 on the holder layout, Alan Prentice the rest on the patient layout, linked (catch-up Phase 22)', () => {
    const api = store()
    const bookingId = marker('feeSplitBooking')
    const proc = proceduresForBooking(api.getState(), bookingId)[0]!
    expect(proc.governingContractId).toBe(CONTRACT.noContractRvg)
    stageAndBill(api, listOf(api, bookingId))
    const invoices = invoicesForBooking(api, bookingId)
    expect(invoices).toHaveLength(2)
    const nib = invoices.find((i) => i.counterparty.kind === 'insurer')!
    const alan = invoices.find((i) => i.counterparty.kind === 'patient')!
    expect(nib).toMatchObject({ counterparty: { kind: 'insurer', id: INS.nib }, layout: 'contractHolder', subtotal: 132.5, total: 152.38, procedureIds: [proc.id] })
    expect(alan).toMatchObject({ counterparty: { kind: 'patient', id: PAT.prentice }, layout: 'patient', subtotal: 79.5, total: 91.43, billedTo: { name: 'Alan Prentice' } })
    expect(nib.split).toEqual({ procedureId: proc.id, feeExGst: 212, shareLabel: '$132.50', isRest: false })
    expect(alan.split).toEqual({ procedureId: proc.id, feeExGst: 212, shareLabel: 'the rest', isRest: true })
    const wording = wordingOf(api, proc.id)!
    expect(linesOf(api, nib.id).map((l) => [l.description, l.amount])).toEqual([
      [splitLineText(wording, 212, { kind: 'amount', amountExGst: 132.5 }), 132.5],
    ])
    expect(linesOf(api, alan.id).map((l) => [l.description, l.amount])).toEqual([[splitLineText(wording, 212, { kind: 'rest' }), 79.5]])
    // Split lineage ids resolve to the real stored invoices.
    const stored = api.getState().billing.invoices
    expect(nib.lineage).toEqual([{ role: 'otherShareOfSplit', invoiceId: alan.id }])
    expect(alan.lineage).toEqual([{ role: 'otherShareOfSplit', invoiceId: nib.id }])
    for (const inv of [nib, alan]) {
      for (const link of inv.lineage ?? []) expect(stored[link.invoiceId]?.bookingId).toBe(bookingId)
    }
  })

  it('the office re-splits by percent before authorising: 50% to nib, the rest to Alan ($106 + $106)', () => {
    const api = store()
    const bookingId = marker('feeSplitBooking')
    const proc = proceduresForBooking(api.getState(), bookingId)[0]!
    const resplit = setProcedureSplit(api, OFFICE, bookingId, proc.id, {
      shares: [
        { party: { kind: 'insurer', id: INS.nib }, basis: { kind: 'percent', percent: 50 } },
        { party: { kind: 'patient', id: PAT.prentice }, basis: { kind: 'rest' } },
      ],
    })
    expect(resplit.ok).toBe(true)
    stageAndBill(api, listOf(api, bookingId))
    const invoices = invoicesForBooking(api, bookingId)
    expect(invoices.map((i) => [i.counterparty.kind, i.subtotal])).toEqual([
      ['insurer', 106],
      ['patient', 106],
    ])
    expect(invoices[0]!.split?.shareLabel).toBe('50%')
  })

  it("removing the split bills the whole fee to the Contract's party: one invoice to Alan Prentice for $212", () => {
    const api = store()
    const bookingId = marker('feeSplitBooking')
    const proc = proceduresForBooking(api.getState(), bookingId)[0]!
    expect(setProcedureSplit(api, OFFICE, bookingId, proc.id, null).ok).toBe(true)
    stageAndBill(api, listOf(api, bookingId))
    const invoices = invoicesForBooking(api, bookingId)
    expect(invoices).toHaveLength(1)
    expect(invoices[0]).toMatchObject({ counterparty: { kind: 'patient', id: PAT.prentice }, layout: 'patient', subtotal: 212 })
    expect(invoices[0]!.split).toBeUndefined()
    expect(invoices[0]!.lineage).toBeUndefined()
  })
})

describe('contract lifecycle at billing time', () => {
  it('a Disabled Contract still prices and bills a Procedure already on it (D81)', () => {
    const api = store()
    expect(disableContract(api, OFFICE, CONTRACT.healthNz).ok).toBe(true)
    const result = stageAndBill(api, WHITAKER_LIST)
    expect(result.exceptions).toEqual([])
    const invoices = invoicesForList(api.getState(), WHITAKER_LIST)
    expect(invoices).toHaveLength(5)
    for (const inv of invoices) {
      // Still the Health NZ $23 rate, billed to Christchurch Public.
      expect(linesOf(api, inv.id)[0]!.btm?.unitValue).toBe(23)
      expect(inv.counterparty).toEqual({ kind: 'hospital', id: HOSP.cph })
    }
  })

  it('a fixed-price Contract with no range in force on the List\'s date is a per-booking exception; the list still completes its run', () => {
    const api = store()
    const bookingId = marker('cosAccContractBooking')
    const proc = proceduresForBooking(api.getState(), bookingId)[0]!
    // No range in force, so never a rail candidate: staged as the demo actions do (catch-up Phase 20).
    expect(setProcedureContract(api, DEMO_TRIGGER_ACTOR, proc.id, CONTRACT.cosFixed, { demoStage: true }).ok).toBe(true)
    const result = stageAndBill(api, listOf(api, bookingId))
    expect(result.exceptions).toHaveLength(1)
    expect(result.exceptions[0]).toMatchObject({ bookingId, code: 'contractIneffective', message: needsPriceMessage(api.getState().masters.contracts[CONTRACT.cosFixed]!, api.getState().schedule.lists[listOf(api, bookingId)]!.dateISO, { named: true }) })
    expect(invoicesForBooking(api, bookingId)).toHaveLength(0)
    const state = api.getState()
    const failed = Object.values(state.billing.cases).filter((c) => c.status === 'failed')
    expect(failed).toHaveLength(1)
    expect(failed[0]!.bookingId).toBe(bookingId)
    const exceptionAudit = state.audit.filter((a) => a.action === 'booking.billingException')
    expect(exceptionAudit).toHaveLength(1)
    expect(exceptionAudit[0]!.source).toBe('system')
    // A per-booking failure does NOT hold the list on screen (the settled billedAt reading).
    expect(isListBilled(state.schedule.lists[listOf(api, bookingId)]!)).toBe(true)
  })

  it('a discretionary override is snapshotted onto the invoice with its reason', () => {
    const api = store()
    const bookingId = marker('accRelatedBooking')
    const proc = proceduresForBooking(api.getState(), bookingId)[0]!
    const edited = editProcedure(api, OFFICE, proc.id, {
      priceOverride: { kind: 'dollarAdjustment', amount: -50, reason: 'Quoted package discount' },
    })
    expect(edited.ok).toBe(true)
    stageAndBill(api, MORRISON_LIST)
    const invoice = invoicesForBooking(api, bookingId)[0]!
    const overrideLine = linesOf(api, invoice.id).find((l) => l.description.startsWith('Price override'))
    expect(overrideLine).toBeDefined()
    expect(overrideLine!.description).toBe('Price override, Quoted package discount')
    expect(overrideLine!.amount).toBe(-50)
  })

  it('snapshot immunity: editing a Contract in place, adding a backdated range, or disabling it after billing leaves the invoice unchanged', () => {
    const api = store()
    const bookingId = marker('bariatricType3Booking')
    stageAndBill(api, listOf(api, bookingId))
    stageAndBill(api, WHITAKER_LIST)
    const before = JSON.parse(JSON.stringify(api.getState().billing)) as unknown
    // Health NZ's rate edited in place after its invoices were issued.
    expect(editContract(api, OFFICE, CONTRACT.healthNz, { pricing: { kind: 'rvgContractRate', unitRate: 30 } }).ok).toBe(true)
    expect(addPriceRange(api, OFFICE, CONTRACT.doyleBariatric, { startISO: '2026-07-01', price: 9999 }).ok).toBe(true)
    expect(disableContract(api, OFFICE, CONTRACT.doyleBariatric).ok).toBe(true)
    expect(api.getState().billing).toEqual(before)
  })
})

describe('invoice identity and delivery', () => {
  it('invoice numbers are unique across runs and follow the AA-2026-#### sequence', () => {
    const api = store()
    stageAndBill(api, MORRISON_LIST)
    stageAndBill(api, WHITAKER_LIST)
    // Scope to the AA-2026-#### series (runtime + the seeded pre-payment); the
    // seeded historical mirror uses a disjoint AA-2026-H## series (Phase 10).
    const series = Object.values(api.getState().billing.invoices).filter((i) => /^AA-2026-\d{4}$/.test(i.invoiceNumber))
    const numbers = series.map((i) => i.invoiceNumber)
    // 6 (Morrison) + 5 (Whitaker) runtime + the seeded PAID pre-payment = 12, all unique.
    expect(numbers).toHaveLength(12)
    expect(new Set(numbers).size).toBe(numbers.length)
    // Every such invoice carries a BillingCase as its internal case reference. The
    // seeded pre-payment invoice's case is fully paid (disbursed); runtime = 'invoiced'.
    for (const inv of series) {
      const c = api.getState().billing.cases[inv.caseReference]
      expect(c?.invoiceId).toBe(inv.id)
      if (inv.kind === 'prePayment') expect(['paid', 'disbursed']).toContain(c?.status)
      else expect(c?.status).toBe('invoiced')
    }
  })

  it('every invoice of an authorised List carries its delivery, stamped at the clock time by the run', () => {
    const api = store()
    stageAndBill(api, MORRISON_LIST)
    const atISO = clockISO(api.getState().clock)
    const invoices = invoicesForList(api.getState(), MORRISON_LIST)
    expect(invoices).toHaveLength(6)
    for (const inv of invoices) {
      expect(inv.delivery).toEqual({ method: 'email', status: 'sent', sends: [{ atISO, to: 'accounts@stgeorges.example', by: 'Billing run' }] })
      expect(api.getState().audit.filter((a) => a.action === 'invoice.sent' && a.entityId === inv.id)).toHaveLength(1)
    }
    expect(listBilledAudit(api, MORRISON_LIST)?.after).toMatchObject({ invoiceCount: 6, exceptionCount: 0, sentCount: 6, toPostCount: 0, notSentCount: 0 })
  })

  it('a postal-only payer is marked to post: the Whitcombe Family Trust on the payer review List', () => {
    const api = store()
    const listId = SEED_LIST_IDS.payerReview
    expect(api.getState().schedule.lists[listId]?.state).toBe('SUBMITTED')
    expect(api.getState().schedule.bookings['BK0172']?.listId).toBe(listId)
    stageAndBill(api, listId)
    const atISO = clockISO(api.getState().clock)
    const trust = invoicesForBooking(api, 'BK0172')
    expect(trust).toHaveLength(1)
    expect(trust[0]).toMatchObject({ counterparty: { kind: 'payer' }, billedTo: { name: 'Whitcombe Family Trust' } })
    expect(trust[0]!.delivery).toEqual({ method: 'post', status: 'toPost', address: ['PO Box 13245', 'Christchurch 8141'], markedAtISO: atISO })
    expect(api.getState().audit.filter((a) => a.action === 'invoice.toPost' && a.entityId === trust[0]!.id)).toHaveLength(1)
    const after = listBilledAudit(api, listId)?.after as { invoiceCount: number; sentCount: number; toPostCount: number; notSentCount: number }
    expect(after.toPostCount).toBe(1)
    expect(after.sentCount + after.toPostCount + after.notSentCount).toBe(after.invoiceCount)
  })

  it("a holder Party set to post has its invoices marked to post at its postal address", () => {
    const api = store()
    patchParty(api, 'PY-STG', (p) => ({ ...p, deliveryMethod: 'post', postalAddress: 'PO Box 4321, Christchurch 8140' }))
    stageAndBill(api, MORRISON_LIST)
    const atISO = clockISO(api.getState().clock)
    for (const inv of invoicesForList(api.getState(), MORRISON_LIST)) {
      expect(inv.delivery).toEqual({ method: 'post', status: 'toPost', address: ['PO Box 4321, Christchurch 8140'], markedAtISO: atISO })
    }
    expect(listBilledAudit(api, MORRISON_LIST)?.after).toMatchObject({ sentCount: 0, toPostCount: 6, notSentCount: 0 })
  })

  it("a Party with no email raises its invoices with no address, never failing the Booking", () => {
    const api = store()
    patchParty(api, 'PY-STG', (p) => {
      const { email: _email, ...rest } = p
      return rest
    })
    const result = stageAndBill(api, MORRISON_LIST)
    expect(result.exceptions).toEqual([])
    const invoices = invoicesForList(api.getState(), MORRISON_LIST)
    expect(invoices).toHaveLength(6)
    for (const inv of invoices) {
      expect(inv.delivery).toEqual({ method: 'email', status: 'noAddress' })
      expect(api.getState().billing.cases[inv.caseReference]?.status).toBe('invoiced')
      expect(api.getState().audit.filter((a) => a.action === 'invoice.notSent' && a.entityId === inv.id)).toHaveLength(1)
    }
    expect(listBilledAudit(api, MORRISON_LIST)?.after).toMatchObject({ sentCount: 0, toPostCount: 0, notSentCount: 6 })
  })

  it("another payer on the Booking is emailed at the payer's address: Grace Park's Booking to Hana Park", () => {
    const api = store()
    const bookingId = 'BK0033'
    const booking = api.getState().schedule.bookings[bookingId]!
    expect(booking.payer).toMatchObject({ kind: 'other', name: 'Hana Park', email: 'hana.park@example.net' })
    const proc = proceduresForBooking(api.getState(), bookingId)[0]!
    expect(editProcedure(api, OFFICE, proc.id, { anaestheticStartISO: '2026-07-24T08:00:00', handoverISO: '2026-07-24T09:00:00' }).ok).toBe(true)
    expect(completeAnswered(api, OFFICE, bookingId).ok).toBe(true)
    stageAndBill(api, booking.listId)
    const invoices = invoicesForBooking(api, bookingId)
    expect(invoices).toHaveLength(1)
    expect(invoices[0]).toMatchObject({ counterparty: { kind: 'payer' }, billedTo: { name: 'Hana Park', email: 'hana.park@example.net' }, layout: 'patient' })
    expect(invoices[0]!.delivery).toMatchObject({ method: 'email', status: 'sent', sends: [{ to: 'hana.park@example.net', by: 'Billing run' }] })
  })

  it('resendInvoice: office only; a second send is appended to the history, audited invoice.resend', () => {
    const api = store()
    stageAndBill(api, MORRISON_LIST)
    const invoice = invoicesForList(api.getState(), MORRISON_LIST)[0]!
    const runAt = clockISO(api.getState().clock)
    expect(resendInvoice(api, SOUTER, invoice.id)).toMatchObject({ ok: false, code: 'officeOnly' })
    advanceClockMinutes(api, 30)
    const resendAt = clockISO(api.getState().clock)
    expect(resendInvoice(api, OFFICE, invoice.id).ok).toBe(true)
    expect(resendInvoice(api, OFFICE, invoice.id, { to: 'payables@stgeorges.example' }).ok).toBe(true)
    expect(api.getState().billing.invoices[invoice.id]!.delivery).toEqual({
      method: 'email',
      status: 'sent',
      sends: [
        { atISO: runAt, to: 'accounts@stgeorges.example', by: 'Billing run' },
        { atISO: resendAt, to: 'accounts@stgeorges.example', by: 'Kirsty W.' },
        { atISO: resendAt, to: 'payables@stgeorges.example', by: 'Kirsty W.' },
      ],
    })
    const audit = api.getState().audit.filter((a) => a.action === 'invoice.resend' && a.entityId === invoice.id)
    expect(audit).toHaveLength(2)
    expect(audit[1]).toMatchObject({ who: 'Kirsty W.', before: { delivery: 'sent' }, after: { to: 'payables@stgeorges.example', atISO: resendAt } })
    // A malformed address is refused and nothing is appended.
    expect(resendInvoice(api, OFFICE, invoice.id, { to: 'not an email' })).toMatchObject({ ok: false, code: 'emailInvalid' })
    expect(api.getState().billing.invoices[invoice.id]!.delivery).toMatchObject({ sends: { length: 3 } })
  })

  it('resendInvoice recovers an invoice raised with no address, and one marked to post, once an address is typed', () => {
    const api = store()
    patchParty(api, 'PY-STG', (p) => {
      const { email: _email, ...rest } = p
      return rest
    })
    stageAndBill(api, MORRISON_LIST)
    const [first, second] = invoicesForList(api.getState(), MORRISON_LIST)
    expect(first!.delivery?.status).toBe('noAddress')
    // No address to resend to until one is typed.
    expect(resendInvoice(api, OFFICE, first!.id)).toMatchObject({ ok: false, code: 'noAddress' })
    expect(resendInvoice(api, OFFICE, first!.id, { to: 'accounts@stgeorges.example' }).ok).toBe(true)
    expect(api.getState().billing.invoices[first!.id]!.delivery).toEqual({
      method: 'email',
      status: 'sent',
      sends: [{ atISO: clockISO(api.getState().clock), to: 'accounts@stgeorges.example', by: 'Kirsty W.' }],
    })
    expect(api.getState().audit.filter((a) => a.action === 'invoice.resend' && a.entityId === first!.id)[0]?.before).toEqual({ delivery: 'noAddress' })
    // The others stay as raised.
    expect(api.getState().billing.invoices[second!.id]!.delivery?.status).toBe('noAddress')

    const post = store()
    stageAndBill(post, SEED_LIST_IDS.payerReview)
    const trust = invoicesForBooking(post, 'BK0172')[0]!
    expect(trust.delivery?.status).toBe('toPost')
    expect(resendInvoice(post, OFFICE, trust.id)).toMatchObject({ ok: false, code: 'noAddress' })
    expect(resendInvoice(post, OFFICE, trust.id, { to: 'trustees@whitcombe.example' }).ok).toBe(true)
    expect(post.getState().billing.invoices[trust.id]!.delivery).toMatchObject({ method: 'email', status: 'sent', sends: [{ to: 'trustees@whitcombe.example' }] })
  })
})

describe('review-pass hardening (8th review)', () => {
  it('a booking with no Contract moved onto a submitted list fails as a BillingCase, never a throw; authorise stays committed', () => {
    const api = store()
    const unwire = wireBillingRun(api)
    try {
      // The seeded provisional PDF-referral booking has no Contract ("Needs an
      // invoice destination"); the office may move it onto a SUBMITTED list (3rd review #7).
      const provisional = Object.values(api.getState().schedule.bookings).find((c) => c.patientId === PAT.provisional)
      expect(provisional).toBeDefined()
      expect(reassignBooking(api, OFFICE, provisional!.id, MORRISON_LIST).ok).toBe(true)
      // Since catch-up Phase 38a authorise is completion-gated: the incomplete
      // Booking blocks it first.
      const gated = authoriseList(api, OFFICE, MORRISON_LIST)
      expect(gated.ok).toBe(false)
      if (!gated.ok) expect(gated.code).toBe('bookingsNotCompleted')
      // A Booking marked complete with no Contract (the state this hardening covers)
      // still fails as a BillingCase, never a throw.
      api.setState((s) => ({
        schedule: { ...s.schedule, bookings: { ...s.schedule.bookings, [provisional!.id]: { ...s.schedule.bookings[provisional!.id]!, completed: true } } },
      }))
      const outcome = authoriseList(api, OFFICE, MORRISON_LIST)
      expect(outcome.ok).toBe(true)
      const state = api.getState()
      expect(isListBilled(state.schedule.lists[MORRISON_LIST]!)).toBe(true)
      expect(invoicesForList(state, MORRISON_LIST)).toHaveLength(6)
      const failed = Object.values(state.billing.cases).filter((c) => c.status === 'failed')
      expect(failed).toHaveLength(1)
      expect(failed[0]!.bookingId).toBe(provisional!.id)
      expect(failed[0]!.failure).toMatchObject({
        code: 'noContract',
        procedureId: proceduresForBooking(state, provisional!.id)[0]!.id,
      })
    } finally {
      unwire()
    }
  })

  it('a split that no longer fits the fee fails the booking for review instead of billing a guess; the retry stamps delivery', () => {
    const api = store()
    const bookingId = marker('feeSplitBooking')
    // nib's typed $132.50 fitted 8 units at $26.50 ($212); at $15 the fee is $120, leaving nothing for the rest.
    expect(editAnaesthetist(api, OFFICE, ANAE.souter, { unitValue: 15 }).ok).toBe(true)
    const result = stageAndBill(api, listOf(api, bookingId))
    const exception = result.exceptions.find((e) => e.bookingId === bookingId)
    expect(exception).toMatchObject({ code: 'splitDoesNotFit' })
    expect(invoicesForBooking(api, bookingId)).toHaveLength(0)
    const failed = Object.values(api.getState().billing.cases).find((c) => c.bookingId === bookingId)
    expect(failed?.failure?.message).toContain('$120.00')

    // The rate is put back; the office retries and both shares are raised and sent at the clock time.
    expect(editAnaesthetist(api, OFFICE, ANAE.souter, { unitValue: 26.5 }).ok).toBe(true)
    advanceClockMinutes(api, 15)
    const retried = retryBillingCase(api, OFFICE, failed!.id)
    expect(retried.ok).toBe(true)
    const atISO = clockISO(api.getState().clock)
    const invoices = invoicesForBooking(api, bookingId)
    expect(invoices.map((i) => [i.counterparty.kind, i.total])).toEqual([
      ['insurer', 152.38],
      ['patient', 91.43],
    ])
    for (const inv of invoices) {
      expect(inv.raisedAtISO).toBe(atISO)
      expect(inv.delivery).toMatchObject({ method: 'email', status: 'sent', sends: [{ atISO, by: 'Billing run' }] })
    }
    expect(invoices[0]!.lineage).toEqual([{ role: 'otherShareOfSplit', invoiceId: invoices[1]!.id }])
  })

  it('a Contract governing booked procedures is never deleted: it is disabled and still there at billing time', () => {
    const api = store()
    expect(disableContract(api, OFFICE, CONTRACT.doyleBariatric).ok).toBe(true)
    expect(api.getState().masters.contracts[CONTRACT.doyleBariatric]?.status).toBe('disabled')
  })

  it('a negative override total fails the booking as an exception, never a negative invoice', () => {
    const api = store()
    const bookingId = marker('accRelatedBooking')
    const proc = proceduresForBooking(api.getState(), bookingId)[0]!
    expect(
      editProcedure(api, OFFICE, proc.id, {
        priceOverride: { kind: 'dollarAdjustment', amount: -10000, reason: 'Stress test' },
      }).ok,
    ).toBe(true)
    const result = stageAndBill(api, MORRISON_LIST)
    expect(result.exceptions.find((e) => e.bookingId === bookingId)).toMatchObject({ code: 'negativeTotal' })
    expect(invoicesForBooking(api, bookingId)).toHaveLength(0)
    // The other five bookings billed normally; per-booking isolation holds.
    expect(invoicesForList(api.getState(), MORRISON_LIST)).toHaveLength(5)
  })

  it('resend checks the invoice before the role: an unknown invoice is notFound for anyone', () => {
    const api = store()
    expect(resendInvoice(api, SOUTER, 'INV-nope')).toMatchObject({ ok: false, code: 'notFound' })
    expect(resendInvoice(api, OFFICE, 'INV-nope')).toMatchObject({ ok: false, code: 'notFound' })
  })
})

describe('the design-day live path', () => {
  it('finish Ellison → complete → submit → authorise → 4 invoices: SX x2, nib direct, patient layout', () => {
    const api = store()
    advanceClockMinutes(api, 9 * 60 + 20) // presenter advances to 17:20
    const ellison = marker('pendingCaptureBooking')
    const ellisonProc = proceduresForBooking(api.getState(), ellison)[0]!
    expect(editProcedure(api, SOUTER, ellisonProc.id, { handoverISO: clockISO(api.getState().clock) }).ok).toBe(true)
    expect(completeAnswered(api, SOUTER, ellison).ok).toBe(true)
    expect(submitList(api, SOUTER, SOUTER_PM).ok).toBe(true)
    expect(authoriseList(api, OFFICE, SOUTER_PM).ok).toBe(true)
    const run = runBillingForList(api, SOUTER_PM)
    expect(run.ok).toBe(true)
    const invoices = invoicesForList(api.getState(), SOUTER_PM)
    expect(invoices).toHaveLength(4)
    expect(invoices.filter((i) => i.counterparty.kind === 'hospital' && i.counterparty.id === HOSP.sx)).toHaveLength(2)
    const nib = invoices.find((i) => i.counterparty.kind === 'insurer')
    expect(nib?.counterparty.id).toBe(INS.nib)
    const patient = invoices.find((i) => i.counterparty.kind === 'patient')
    expect(patient?.layout).toBe('patient')
    // The billing run stamps the List (the office reads it; the main view exit is AUTHORISED).
    expect(isListBilled(api.getState().schedule.lists[SOUTER_PM]!)).toBe(true)
  })

  it('identity separation (D9): no billed patient NHI ever appears in billing data', () => {
    const api = store()
    stageAndBill(api, MORRISON_LIST)
    stageAndBill(api, WHITAKER_LIST)
    const state = api.getState()
    const billedBookingIds = new Set(Object.values(state.billing.invoices).map((i) => i.bookingId))
    const nhis = [...billedBookingIds]
      .map((id) => state.schedule.bookings[id]?.patientId)
      .map((pid) => (pid !== undefined ? state.masters.patients[pid]?.nhi : undefined))
      .filter((nhi): nhi is string => nhi !== undefined)
    expect(nhis.length).toBeGreaterThan(0)
    const serialised = JSON.stringify(state.billing)
    for (const nhi of nhis) expect(serialised).not.toContain(nhi)
  })
})
