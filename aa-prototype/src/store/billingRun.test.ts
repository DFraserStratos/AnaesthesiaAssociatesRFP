/**
 * Billing-run orchestration tests (Phase 08): wiring + idempotence, guards,
 * grouping, every seeded charge-basis exemplar (Type 1/2/3, rate x time,
 * two-funder, split pair, insured reimbursement, COS organisation holder),
 * the scoped default-Type-1 fallback vs the surgeon/organisation exception,
 * override + snapshot immunity, unique invoice numbers, the design-day live
 * path, system-sourced audit, the billedAt view effect and identity
 * separation (no NHI in billing data).
 */

import { describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from './appStore'
import { markInvoiceEmailed, runBillingForList, wireBillingRun, type BillingRunResult } from './billingRun'
import { authoriseList, completeCard, editProcedure, reassignCard, submitList } from './lifecycle'
import { deleteContract, editContract, editContractPrice } from './contractActions'
import { editAnaesthetist } from './mastersActions'
import { setBillingLineAllocation } from './billingLineActions'
import { advanceClockMinutes } from './clockActions'
import { clockISO, type Actor } from './mutate'
import { invoicesForList, isListBilled, proceduresForCard, submittedLists } from './selectors'
import { ANAE, BP, HOSP, INS, ORG, PAT, SEED_LIST_IDS, SEED_MARKERS, SURG, CONTRACT } from '../domain/seed'
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

function listOf(api: BoundAppStore, cardId: string): string {
  const card = api.getState().schedule.cards[cardId]
  if (card === undefined) throw new Error(`missing card ${cardId}`)
  return card.listId
}

/** DRAFT → submit (office) → authorise → run. Every step must succeed. */
function stageAndBill(api: BoundAppStore, listId: string): BillingRunResult {
  const list = api.getState().schedule.lists[listId]
  if (list === undefined) throw new Error(`missing list ${listId}`)
  if (list.state === 'DRAFT') {
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

function invoicesForCard(api: BoundAppStore, cardId: string): Invoice[] {
  return Object.values(api.getState().billing.invoices)
    .filter((i) => i.cardId === cardId)
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

  it('6 completed hospital-route cards yield 6 St George invoices; the cancelled card yields none', () => {
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
    expect(invoicesForCard(api, marker('cancelledCard'))).toHaveLength(0)
  })

  it('Type 2 rates on the ACC card ($25/unit via stgAcc), Type 1 standard elsewhere ($35/unit)', () => {
    const api = store()
    billMorrison(api)
    const accInvoice = invoicesForCard(api, marker('accRelatedCard'))[0]
    expect(accInvoice).toBeDefined()
    expect(linesOf(api, accInvoice!.id)[0]!.description).toContain('at $25.00 per unit')
    const missingRefCardId = api.getState().schedule.procedures[marker('missingBillingRef1')]!.cardId
    const standardInvoice = invoicesForCard(api, missingRefCardId)[0]
    expect(standardInvoice).toBeDefined()
    expect(linesOf(api, standardInvoice!.id)[0]!.description).toContain('at $35.00 per unit')
  })

  it('the missing-billing-reference card bills anyway (an advisory, never a billing blocker)', () => {
    const api = store()
    billMorrison(api)
    const cardId = api.getState().schedule.procedures[marker('missingBillingRef1')]!.cardId
    expect(invoicesForCard(api, cardId)).toHaveLength(1)
  })

  it('audits the whole run source=system and never stamps a locked card', () => {
    const api = store()
    const before = Object.fromEntries(
      Object.values(api.getState().schedule.cards)
        .filter((c) => c.listId === MORRISON_LIST)
        .map((c) => [c.id, c.lastModifiedAtISO]),
    )
    billMorrison(api)
    const state = api.getState()
    const runAudit = state.audit.filter((a) => a.source === 'system' && a.who === 'Billing run')
    expect(runAudit.filter((a) => a.action === 'invoice.create')).toHaveLength(6)
    expect(runAudit.filter((a) => a.action === 'card.billed')).toHaveLength(6)
    expect(runAudit.filter((a) => a.action === 'list.billed')).toHaveLength(1)
    expect(runAudit.filter((a) => a.action === 'list.billed')[0]!.entityId).toBe(MORRISON_LIST)
    for (const [cardId, atISO] of Object.entries(before)) {
      expect(state.schedule.cards[cardId]!.lastModifiedAtISO).toBe(atISO)
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
  it('Whitaker bills entirely at the Health NZ Type 2 agreed rate ($23/unit)', () => {
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

  it('the surgeon-held bariatric Type 3 resolves BY HOLDER and bills its fixed prices on one invoice', () => {
    const api = store()
    const cardId = marker('bariatricType3Card')
    stageAndBill(api, listOf(api, cardId))
    const invoices = invoicesForCard(api, cardId)
    expect(invoices).toHaveLength(1)
    const invoice = invoices[0]!
    expect(invoice.counterparty).toEqual({ kind: 'surgeon', id: SURG.doyle })
    expect(invoice.layout).toBe('contractHolder')
    // The ordinal-2 hernia is isAdditional AND matches the CP-BAR-3 fixed price:
    // the Type 3 branch precedes the time-only rule, so the FULL $950 bills.
    expect(linesOf(api, invoice.id).map((l) => l.amount)).toEqual([2800, 950])
    expect(invoice.subtotal).toBe(3750)
    expect(invoice.gst).toBe(562.5)
    expect(invoice.total).toBe(4312.5)
  })

  it('the rate x time card bills hours x the agreed rate under the billableParty-held contract', () => {
    const api = store()
    const cardId = marker('rateTimeCard')
    stageAndBill(api, listOf(api, cardId))
    const invoice = invoicesForCard(api, cardId)[0]
    expect(invoice).toBeDefined()
    expect(invoice!.counterparty).toEqual({ kind: 'billableParty', id: BP.ariaClinic })
    expect(invoice!.layout).toBe('patient')
    const lines = linesOf(api, invoice!.id)
    expect(lines).toHaveLength(1)
    expect(lines[0]!.amount).toBe(1440)
    expect(lines[0]!.description).toContain('hours')
  })

  it('the insured-reimbursement card bills the PATIENT at standard rates (not the insurer)', () => {
    const api = store()
    const cardId = marker('insuredReimbursementCard')
    stageAndBill(api, listOf(api, cardId))
    const invoice = invoicesForCard(api, cardId)[0]
    expect(invoice).toBeDefined()
    const patientId = api.getState().schedule.cards[cardId]!.patientId
    expect(invoice!.counterparty).toEqual({ kind: 'patient', id: patientId })
    expect(invoice!.layout).toBe('patient')
    expect(linesOf(api, invoice!.id)[0]!.description).toContain('at $32.00 per unit')
  })

  it('the COS card bills the ORGANISATION holder at its Type 2 rate ($24/unit)', () => {
    const api = store()
    const cardId = marker('cosAccContractCard')
    stageAndBill(api, listOf(api, cardId))
    const invoice = invoicesForCard(api, cardId)[0]
    expect(invoice).toBeDefined()
    expect(invoice!.counterparty).toEqual({ kind: 'organisation', id: ORG.cos })
    expect(linesOf(api, invoice!.id)[0]!.description).toContain('at $24.00 per unit')
  })
})

describe('split billing', () => {
  it('same funder: the split pair shares ONE invoice and the additional procedure is time-only', () => {
    const api = store()
    const cardId = marker('splitBillingCard')
    stageAndBill(api, listOf(api, cardId))
    const invoices = invoicesForCard(api, cardId)
    expect(invoices).toHaveLength(1)
    expect(invoices[0]!.counterparty).toEqual({ kind: 'hospital', id: HOSP.forte })
    const lines = linesOf(api, invoices[0]!.id)
    expect(lines).toHaveLength(2)
    // 30 minutes = 2 time units at Souter's $26.50.
    expect(lines[1]!.description).toContain('time units only')
    expect(lines[1]!.units).toBe(2)
    expect(lines[1]!.amount).toBe(53)
  })

  it('different funders: rerouting the additional procedure to the patient yields TWO invoices (the §11 reading)', () => {
    const api = store()
    const cardId = marker('splitBillingCard')
    const proc2 = proceduresForCard(api.getState(), cardId)[1]!
    const edited = editProcedure(api, OFFICE, proc2.id, {
      billingRoute: 'billableParty',
      patientPaymentCategory: 'selfFundedPostProcedure',
    })
    expect(edited.ok).toBe(true)
    stageAndBill(api, listOf(api, cardId))
    const invoices = invoicesForCard(api, cardId)
    expect(invoices).toHaveLength(2)
    const patientInvoice = invoices.find((i) => i.counterparty.kind === 'patient')
    expect(patientInvoice).toBeDefined()
    expect(patientInvoice!.layout).toBe('patient')
    expect(patientInvoice!.subtotal).toBe(53)
    expect(linesOf(api, patientInvoice!.id)[0]!.description).toContain('time units only')
  })

  it('two funders, as seeded: the un-overridden line bills the procedure counterparty (St George)', () => {
    const api = store()
    const cardId = marker('twoFunderCard')
    stageAndBill(api, listOf(api, cardId))
    const invoices = invoicesForCard(api, cardId)
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
    const cardId = marker('twoFunderCard')
    const patientId = api.getState().schedule.cards[cardId]!.patientId
    const proc = proceduresForCard(api.getState(), cardId)[0]!
    const plainLine = Object.values(api.getState().schedule.billingLines).find(
      (l) => l.procedureId === proc.id && l.funderOverride === undefined,
    )
    expect(plainLine).toBeDefined()
    const allocated = setBillingLineAllocation(api, OFFICE, plainLine!.id, {
      funderOverride: { kind: 'patient', id: patientId },
    })
    expect(allocated.ok).toBe(true)
    stageAndBill(api, listOf(api, cardId))
    const invoices = invoicesForCard(api, cardId)
    expect(invoices).toHaveLength(2)
    const patientInvoice = invoices.find((i) => i.counterparty.kind === 'patient')
    expect(patientInvoice?.counterparty).toEqual({ kind: 'patient', id: patientId })
    expect(patientInvoice?.subtotal).toBe(79.5)
    expect(patientInvoice?.layout).toBe('patient')
    expect(invoices.find((i) => i.counterparty.kind === 'insurer')?.subtotal).toBe(132.5)
  })
})

describe('contract lifecycle at billing time', () => {
  it('a hospital Type 2 effective-dated out falls back to the default Type 1 at standard rates, no failure', () => {
    const api = store()
    // Whitaker's list is 2026-07-17; date the Health NZ Type 2 out before it.
    expect(editContract(api, OFFICE, CONTRACT.healthNz, { effectiveToISO: '2026-07-16' }).ok).toBe(true)
    const result = stageAndBill(api, WHITAKER_LIST)
    expect(result.exceptions).toEqual([])
    const invoices = invoicesForList(api.getState(), WHITAKER_LIST)
    expect(invoices).toHaveLength(5)
    for (const inv of invoices) {
      // Whitaker's own unit value, NOT the dated-out $23 agreed rate.
      expect(linesOf(api, inv.id)[0]!.description).toContain('at $28.50 per unit')
    }
  })

  it('an organisation-held contract dated out is a per-card exception; the list still completes its run', () => {
    const api = store()
    const cardId = marker('cosAccContractCard')
    // The COS list is 2026-07-09; date the organisation-held ACC contract out.
    expect(editContract(api, OFFICE, CONTRACT.cosAcc, { effectiveToISO: '2026-07-08' }).ok).toBe(true)
    const result = stageAndBill(api, listOf(api, cardId))
    expect(result.exceptions).toHaveLength(1)
    expect(result.exceptions[0]).toMatchObject({ cardId, code: 'contractIneffective' })
    expect(invoicesForCard(api, cardId)).toHaveLength(0)
    const state = api.getState()
    const failed = Object.values(state.billing.cases).filter((c) => c.status === 'failed')
    expect(failed).toHaveLength(1)
    expect(failed[0]!.cardId).toBe(cardId)
    const exceptionAudit = state.audit.filter((a) => a.action === 'card.billingException')
    expect(exceptionAudit).toHaveLength(1)
    expect(exceptionAudit[0]!.source).toBe('system')
    // A per-card failure does NOT hold the list on screen (the settled billedAt reading).
    expect(isListBilled(state.schedule.lists[listOf(api, cardId)]!)).toBe(true)
  })

  it('a discretionary override is snapshotted onto the invoice with its reason', () => {
    const api = store()
    const cardId = marker('accRelatedCard')
    const proc = proceduresForCard(api.getState(), cardId)[0]!
    const edited = editProcedure(api, OFFICE, proc.id, {
      priceOverride: { kind: 'dollarAdjustment', amount: -50, reason: 'Quoted package discount' },
    })
    expect(edited.ok).toBe(true)
    stageAndBill(api, MORRISON_LIST)
    const invoice = invoicesForCard(api, cardId)[0]!
    const overrideLine = linesOf(api, invoice.id).find((l) => l.description.startsWith('Price override'))
    expect(overrideLine).toBeDefined()
    expect(overrideLine!.description).toBe('Price override, Quoted package discount')
    expect(overrideLine!.amount).toBe(-50)
  })

  it('snapshot immunity: mutating the contract or its price list after billing leaves the invoice unchanged', () => {
    const api = store()
    const cardId = marker('bariatricType3Card')
    stageAndBill(api, listOf(api, cardId))
    const before = JSON.parse(JSON.stringify(api.getState().billing)) as unknown
    expect(editContractPrice(api, OFFICE, 'CP-BAR-1', { price: 9999 }).ok).toBe(true)
    expect(editContract(api, OFFICE, CONTRACT.doyleBariatric, { effectiveToISO: '2026-07-31' }).ok).toBe(true)
    expect(api.getState().billing).toEqual(before)
  })
})

describe('invoice identity and delivery', () => {
  it('invoice numbers are unique across runs and follow the AA-2026-#### sequence', () => {
    const api = store()
    stageAndBill(api, MORRISON_LIST)
    stageAndBill(api, WHITAKER_LIST)
    const numbers = Object.values(api.getState().billing.invoices).map((i) => i.invoiceNumber)
    expect(numbers).toHaveLength(11)
    for (const n of numbers) expect(n).toMatch(/^AA-2026-\d{4}$/)
    expect(new Set(numbers).size).toBe(numbers.length)
    // Every invoice carries a BillingCase as its internal case reference.
    for (const inv of Object.values(api.getState().billing.invoices)) {
      expect(api.getState().billing.cases[inv.caseReference]).toMatchObject({ invoiceId: inv.id, status: 'invoiced' })
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

    const twoFunderCard = marker('twoFunderCard')
    stageAndBill(api, listOf(api, twoFunderCard))
    const nibInvoice = invoicesForCard(api, twoFunderCard).find((i) => i.counterparty.kind === 'insurer')!
    expect(markInvoiceEmailed(api, OFFICE, nibInvoice.id)).toMatchObject({ ok: false, code: 'uploadPortal' })
  })
})

describe('review-pass hardening (8th review)', () => {
  it('a route-less card moved onto a submitted list fails as a BillingCase, never a throw; authorise stays committed', () => {
    const api = store()
    const unwire = wireBillingRun(api)
    try {
      // The seeded provisional PDF-referral card has no billing route and no
      // contract; the office may move it onto a SUBMITTED list (3rd review #7).
      const provisional = Object.values(api.getState().schedule.cards).find((c) => c.patientId === PAT.provisional)
      expect(provisional).toBeDefined()
      expect(reassignCard(api, OFFICE, provisional!.id, MORRISON_LIST).ok).toBe(true)
      const outcome = authoriseList(api, OFFICE, MORRISON_LIST)
      expect(outcome.ok).toBe(true)
      const state = api.getState()
      expect(isListBilled(state.schedule.lists[MORRISON_LIST]!)).toBe(true)
      expect(invoicesForList(state, MORRISON_LIST)).toHaveLength(6)
      const failed = Object.values(state.billing.cases).filter((c) => c.status === 'failed')
      expect(failed).toHaveLength(1)
      expect(failed[0]!.cardId).toBe(provisional!.id)
      expect(failed[0]!.failure).toMatchObject({
        code: 'noBillingRoute',
        procedureId: proceduresForCard(state, provisional!.id)[0]!.id,
      })
    } finally {
      unwire()
    }
  })

  it('a protected default cannot be forward-dated away (the fallback date-filters on it)', () => {
    const api = store()
    const defaults = Object.values(api.getState().masters.contracts).filter(
      (c) => c.isDefault && c.holderType === 'hospital' && c.holderId === HOSP.stg,
    )
    expect(defaults).toHaveLength(1)
    const outcome = editContract(api, OFFICE, defaults[0]!.id, { effectiveFromISO: '2027-01-01' })
    expect(outcome).toMatchObject({ ok: false, code: 'defaultContractProtected' })
  })

  it('a stale funder allocation fails the card for review instead of billing silently short', () => {
    const api = store()
    const cardId = marker('twoFunderCard')
    // The $132.50/$79.50 split conserved against 8 units at $26.50; a rate
    // change after completion makes it stale.
    expect(editAnaesthetist(api, OFFICE, ANAE.souter, { unitValue: 30 }).ok).toBe(true)
    const result = stageAndBill(api, listOf(api, cardId))
    const exception = result.exceptions.find((e) => e.cardId === cardId)
    expect(exception).toMatchObject({ code: 'allocationStale' })
    expect(invoicesForCard(api, cardId)).toHaveLength(0)
    const failed = Object.values(api.getState().billing.cases).find((c) => c.cardId === cardId)
    expect(failed?.failure?.message).toContain('$212.00')
  })

  it('a contract governing booked procedures cannot be deleted (no dangling references at billing time)', () => {
    const api = store()
    expect(deleteContract(api, OFFICE, CONTRACT.doyleBariatric)).toMatchObject({ ok: false, code: 'contractInUse' })
  })

  it('a negative override total fails the card as an exception, never a negative invoice', () => {
    const api = store()
    const cardId = marker('accRelatedCard')
    const proc = proceduresForCard(api.getState(), cardId)[0]!
    expect(
      editProcedure(api, OFFICE, proc.id, {
        priceOverride: { kind: 'dollarAdjustment', amount: -10000, reason: 'Stress test' },
      }).ok,
    ).toBe(true)
    const result = stageAndBill(api, MORRISON_LIST)
    expect(result.exceptions.find((e) => e.cardId === cardId)).toMatchObject({ code: 'negativeTotal' })
    expect(invoicesForCard(api, cardId)).toHaveLength(0)
    // The other five cards billed normally; per-card isolation holds.
    expect(invoicesForList(api.getState(), MORRISON_LIST)).toHaveLength(5)
  })

  it('insurer invoices refuse email on the intrinsic fact before the role check', () => {
    const api = store()
    const cardId = marker('twoFunderCard')
    stageAndBill(api, listOf(api, cardId))
    const nib = invoicesForCard(api, cardId).find((i) => i.counterparty.kind === 'insurer')!
    expect(markInvoiceEmailed(api, SOUTER, nib.id)).toMatchObject({ ok: false, code: 'uploadPortal' })
  })
})

describe('the design-day live path', () => {
  it('finish Ellison → complete → submit → authorise → 4 invoices: SX x2, nib direct, patient layout', () => {
    const api = store()
    advanceClockMinutes(api, 9 * 60 + 20) // presenter advances to 17:20
    const ellison = marker('pendingCaptureCard')
    const ellisonProc = proceduresForCard(api.getState(), ellison)[0]!
    expect(editProcedure(api, SOUTER, ellisonProc.id, { handoverISO: clockISO(api.getState().clock) }).ok).toBe(true)
    expect(completeCard(api, SOUTER, ellison).ok).toBe(true)
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
    // The billed list vanishes from the anaesthetist's forward views.
    expect(isListBilled(api.getState().schedule.lists[SOUTER_PM]!)).toBe(true)
  })

  it('identity separation (D9): no billed patient NHI ever appears in billing data', () => {
    const api = store()
    stageAndBill(api, MORRISON_LIST)
    stageAndBill(api, WHITAKER_LIST)
    const state = api.getState()
    const billedCardIds = new Set(Object.values(state.billing.invoices).map((i) => i.cardId))
    const nhis = [...billedCardIds]
      .map((id) => state.schedule.cards[id]?.patientId)
      .map((pid) => (pid !== undefined ? state.masters.patients[pid]?.nhi : undefined))
      .filter((nhi): nhi is string => nhi !== undefined)
    expect(nhis.length).toBeGreaterThan(0)
    const serialised = JSON.stringify(state.billing)
    for (const nhi of nhis) expect(serialised).not.toContain(nhi)
  })
})
