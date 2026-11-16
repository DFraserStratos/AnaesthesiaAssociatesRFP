/**
 * Billing-run orchestration tests (Phase 08): wiring + idempotence, guards,
 * grouping, every seeded charge-basis exemplar (each pricing kind, rate x time,
 * two-funder, split pair, insured reimbursement, the COS surgeon-group holder),
 * a Disabled Contract still billing and the "Needs a price" exception,
 * override + snapshot immunity, unique invoice numbers, the design-day live
 * path, system-sourced audit, the billedAt view effect and identity
 * separation (no NHI in billing data).
 */

import { describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from './appStore'
import { handoffListCases, markInvoiceEmailed, runBillingForList, wireBillingRun, type BillingRunResult } from './billingRun'
import { authoriseList, completeBooking, editProcedure, reassignBooking, submitList } from './lifecycle'
import { setProcedureContract } from './contractSelectionActions'
import { DEMO_TRIGGER_ACTOR } from './demoActors'
import { addPriceRange, disableContract, editContract } from './contractActions'
import { needsPriceMessage } from '../domain/billing/priceRanges'
import { editAnaesthetist } from './mastersActions'
import { setBillingLineAllocation } from './billingLineActions'
import { advanceClockMinutes } from './clockActions'
import { clockISO, type Actor } from './mutate'
import { accpayInvoicesFor, invoicesForList, isListBilled, proceduresForBooking, submittedLists } from './selectors'
import { ANAE, BP, HOSP, INS, ORG, PAT, SEED_LIST_IDS, SEED_MARKERS, CONTRACT } from '../domain/seed'
import { roundToCents } from '../domain/billing/money'
import type { Invoice, InvoiceLine } from '../domain/types'

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
    expect(linesOf(api, accInvoice!.id)[0]!.description).toContain('at $25.00 per unit')
    const missingRefBookingId = api.getState().schedule.procedures[marker('missingBillingRef1')]!.bookingId
    const standardInvoice = invoicesForBooking(api, missingRefBookingId)[0]
    expect(standardInvoice).toBeDefined()
    expect(linesOf(api, standardInvoice!.id)[0]!.description).toContain('at $35.00 per unit')
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
      expect(linesOf(api, inv.id)[0]!.description).toContain('at $23.00 per unit')
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
    expect(linesOf(api, inv.id)[1]!.description).toContain('time units only')
    // The payer's details are snapshotted with the debt.
    expect(inv.billedTo?.name).toBe('Gareth Mills')
  })

  it('the rate x time booking bills hours x the agreed rate under the billableParty-held contract', () => {
    const api = store()
    const bookingId = marker('rateTimeBooking')
    stageAndBill(api, listOf(api, bookingId))
    const invoice = invoicesForBooking(api, bookingId)[0]
    expect(invoice).toBeDefined()
    expect(invoice!.counterparty).toEqual({ kind: 'billableParty', id: BP.ariaClinic })
    expect(invoice!.layout).toBe('patient')
    const lines = linesOf(api, invoice!.id)
    expect(lines).toHaveLength(1)
    expect(lines[0]!.amount).toBe(1440)
    expect(lines[0]!.description).toContain('hours')
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
    expect(linesOf(api, invoice!.id)[0]!.description).toContain('at $32.00 per unit')
  })

  it("the COS booking bills the surgeon group's organisation counterparty at its Contract's rate ($24/unit)", () => {
    const api = store()
    const bookingId = marker('cosAccContractBooking')
    stageAndBill(api, listOf(api, bookingId))
    const invoice = invoicesForBooking(api, bookingId)[0]
    expect(invoice).toBeDefined()
    expect(invoice!.counterparty).toEqual({ kind: 'organisation', id: ORG.cos })
    expect(linesOf(api, invoice!.id)[0]!.description).toContain('at $24.00 per unit')
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
    // 30 minutes = 2 time units at Souter's $26.50.
    expect(lines[1]!.description).toContain('time units only')
    expect(lines[1]!.units).toBe(2)
    expect(lines[1]!.amount).toBe(53)
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
    expect(linesOf(api, patientInvoice!.id)[0]!.description).toContain('time units only')
  })

  it('two funders, as seeded: the un-overridden line bills the procedure counterparty (St George)', () => {
    const api = store()
    const bookingId = marker('twoFunderBooking')
    stageAndBill(api, listOf(api, bookingId))
    const invoices = invoicesForBooking(api, bookingId)
    expect(invoices).toHaveLength(2)
    const nib = invoices.find((i) => i.counterparty.kind === 'insurer')
    const hospital = invoices.find((i) => i.counterparty.kind === 'hospital')
    expect(nib?.counterparty).toEqual({ kind: 'insurer', id: INS.nib })
    expect(nib?.subtotal).toBe(132.5)
    expect(hospital?.counterparty).toEqual({ kind: 'hospital', id: HOSP.stg })
    expect(hospital?.subtotal).toBe(79.5)
  })

  it('two funders, office-allocated to the patient: nib and patient invoices ($132.50 + $79.50)', () => {
    const api = store()
    const bookingId = marker('twoFunderBooking')
    const patientId = api.getState().schedule.bookings[bookingId]!.patientId
    const proc = proceduresForBooking(api.getState(), bookingId)[0]!
    const plainLine = Object.values(api.getState().schedule.billingLines).find(
      (l) => l.procedureId === proc.id && l.funderOverride === undefined,
    )
    expect(plainLine).toBeDefined()
    const allocated = setBillingLineAllocation(api, OFFICE, plainLine!.id, {
      funderOverride: { kind: 'patient', id: patientId },
    })
    expect(allocated.ok).toBe(true)
    stageAndBill(api, listOf(api, bookingId))
    const invoices = invoicesForBooking(api, bookingId)
    expect(invoices).toHaveLength(2)
    const patientInvoice = invoices.find((i) => i.counterparty.kind === 'patient')
    expect(patientInvoice?.counterparty).toEqual({ kind: 'patient', id: patientId })
    expect(patientInvoice?.subtotal).toBe(79.5)
    expect(patientInvoice?.layout).toBe('patient')
    expect(invoices.find((i) => i.counterparty.kind === 'insurer')?.subtotal).toBe(132.5)
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
      expect(linesOf(api, inv.id)[0]!.description).toContain('at $23.00 per unit')
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

  it('markInvoiceEmailed: office stamps + audits once; anaesthetist refused; insurer invoices go via the portal', () => {
    const api = store()
    stageAndBill(api, MORRISON_LIST)
    const hospitalInvoice = invoicesForList(api.getState(), MORRISON_LIST)[0]!
    expect(markInvoiceEmailed(api, SOUTER, hospitalInvoice.id)).toMatchObject({ ok: false, code: 'officeOnly' })
    expect(markInvoiceEmailed(api, OFFICE, hospitalInvoice.id).ok).toBe(true)
    const stamped = api.getState().billing.invoices[hospitalInvoice.id]!
    expect(stamped.emailedAtISO).toBe(clockISO(api.getState().clock))
    expect(api.getState().audit.filter((a) => a.action === 'invoice.email' && a.entityId === hospitalInvoice.id)).toHaveLength(1)
    expect(markInvoiceEmailed(api, OFFICE, hospitalInvoice.id)).toMatchObject({ ok: false, code: 'alreadyEmailed' })

    const twoFunderBooking = marker('twoFunderBooking')
    stageAndBill(api, listOf(api, twoFunderBooking))
    const nibInvoice = invoicesForBooking(api, twoFunderBooking).find((i) => i.counterparty.kind === 'insurer')!
    expect(markInvoiceEmailed(api, OFFICE, nibInvoice.id)).toMatchObject({ ok: false, code: 'uploadPortal' })
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

  it('a stale funder allocation fails the booking for review instead of billing silently short', () => {
    const api = store()
    const bookingId = marker('twoFunderBooking')
    // The $132.50/$79.50 split conserved against 8 units at $26.50; a rate
    // change after completion makes it stale.
    expect(editAnaesthetist(api, OFFICE, ANAE.souter, { unitValue: 30 }).ok).toBe(true)
    const result = stageAndBill(api, listOf(api, bookingId))
    const exception = result.exceptions.find((e) => e.bookingId === bookingId)
    expect(exception).toMatchObject({ code: 'allocationStale' })
    expect(invoicesForBooking(api, bookingId)).toHaveLength(0)
    const failed = Object.values(api.getState().billing.cases).find((c) => c.bookingId === bookingId)
    expect(failed?.failure?.message).toContain('$212.00')
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

  it('insurer invoices refuse email on the intrinsic fact before the role check', () => {
    const api = store()
    const bookingId = marker('twoFunderBooking')
    stageAndBill(api, listOf(api, bookingId))
    const nib = invoicesForBooking(api, bookingId).find((i) => i.counterparty.kind === 'insurer')!
    expect(markInvoiceEmailed(api, SOUTER, nib.id)).toMatchObject({ ok: false, code: 'uploadPortal' })
  })
})

describe('the design-day live path', () => {
  it('finish Ellison → complete → submit → authorise → 4 invoices: SX x2, nib direct, patient layout', () => {
    const api = store()
    advanceClockMinutes(api, 9 * 60 + 20) // presenter advances to 17:20
    const ellison = marker('pendingCaptureBooking')
    const ellisonProc = proceduresForBooking(api.getState(), ellison)[0]!
    expect(editProcedure(api, SOUTER, ellisonProc.id, { handoverISO: clockISO(api.getState().clock) }).ok).toBe(true)
    expect(completeBooking(api, SOUTER, ellison).ok).toBe(true)
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
