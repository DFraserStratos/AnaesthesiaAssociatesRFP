/**
 * Billing failure isolation + resolve-and-retry tests (Phase 09; A5).
 *
 * The seeded multi-booking failure list bills its clean hospital-route booking while
 * Losa Tuilagi's Booking fails: it was pointed at COS ACC fixed fees, which has no
 * price for her procedure ("No price in force"; catch-up Phase 18, RV-32, no
 * dates and no Contract edited). The office chooses her Contract
 * (`chooseContractForFailedBooking`, the one edit allowed on an authorised List)
 * and `retryBillingCase` recovers the booking without duplicating the list's
 * other invoices, idempotently, refused on a non-failed case and to non-office actors.
 */

import { describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from './appStore'
import { authoriseList, editProcedure, submitList } from './lifecycle'
import { chooseContractForFailedBooking, runBillingForList, retryBillingCase } from './billingRun'
import { handoffCase } from './xeroHandoff'
import { addContractPrice, disableContract } from './contractActions'
import { failedCases, invoicesForList, proceduresForBooking } from './selectors'
import type { Actor } from './mutate'
import type { Invoice } from '../domain/types'
import { CONTRACT, SEED_LIST_IDS, SEED_MARKERS } from '../domain/seed'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const SOUTER: Actor = { who: 'Dr Melanie Souter', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: '34821' }

function store(): BoundAppStore {
  return createAppStore()
}
function marker(key: string): string {
  const m = SEED_MARKERS[key]
  if (m === undefined) throw new Error(`missing marker ${key}`)
  return m.entityId
}
function invoicesForBooking(api: BoundAppStore, bookingId: string): Invoice[] {
  return Object.values(api.getState().billing.invoices).filter((i) => i.bookingId === bookingId)
}

function losaProcedureId(api: BoundAppStore): string {
  return proceduresForBooking(api.getState(), marker('billingFailureBooking'))[0]!.id
}

/** The demo trigger's path: as the office, point Losa Tuilagi's Procedure at COS ACC fixed fees, then authorise and run. */
function triggerFailure(api: BoundAppStore): void {
  const listId = SEED_LIST_IDS.billingFailure
  const list = api.getState().schedule.lists[listId]!
  if (list.state === 'ACTIVE') expect(submitList(api, OFFICE, listId).ok).toBe(true)
  expect(editProcedure(api, OFFICE, losaProcedureId(api), { governingContractId: CONTRACT.cosFixed }).ok).toBe(true)
  expect(authoriseList(api, OFFICE, listId).ok).toBe(true)
  const run = runBillingForList(api, listId)
  expect(run.ok).toBe(true)
}

describe('failure isolation', () => {
  it('the COS booking fails while the clean sibling still invoices', () => {
    const api = store()
    triggerFailure(api)
    const listId = SEED_LIST_IDS.billingFailure
    const failureBooking = marker('billingFailureBooking')

    // Only the sibling billed; the COS booking produced no invoice.
    expect(invoicesForList(api.getState(), listId)).toHaveLength(1)
    expect(invoicesForBooking(api, failureBooking)).toHaveLength(0)

    const failed = failedCases(api.getState())
    expect(failed).toHaveLength(1)
    expect(failed[0]!.bookingId).toBe(failureBooking)
    expect(failed[0]!.failure).toMatchObject({ code: 'contractIneffective', message: 'No price in force for this procedure under COS ACC fixed fees.' })
    // The list still completed its run (the settled billedAt reading).
    expect(api.getState().schedule.lists[listId]!.billedAtISO).toBeDefined()
  })
})

describe('retryBillingCase', () => {
  it('recovers the fixed booking without duplicating the list other invoices; idempotent; guarded', () => {
    const api = store()
    triggerFailure(api)
    const listId = SEED_LIST_IDS.billingFailure
    const failureBooking = marker('billingFailureBooking')
    const failedCaseId = failedCases(api.getState())[0]!.id

    // Office-only.
    expect(retryBillingCase(api, SOUTER, failedCaseId)).toMatchObject({ ok: false, code: 'officeOnly' })

    // Retrying before the data is fixed still fails (case stays failed).
    expect(retryBillingCase(api, OFFICE, failedCaseId)).toMatchObject({ ok: false, code: 'contractIneffective' })
    expect(api.getState().billing.cases[failedCaseId]!.status).toBe('failed')

    // The office chooses the right Contract (no Contract is edited), then retries.
    expect(chooseContractForFailedBooking(api, OFFICE, failedCaseId, losaProcedureId(api), CONTRACT.cosAcc).ok).toBe(true)
    expect(api.getState().masters.contracts[CONTRACT.cosFixed]?.status).toBe('active')
    const retried = retryBillingCase(api, OFFICE, failedCaseId)
    expect(retried.ok).toBe(true)

    expect(invoicesForBooking(api, failureBooking)).toHaveLength(1)
    // Billed to COS as the same organisation counterparty as before, at the $24 rate.
    expect(invoicesForBooking(api, failureBooking)[0]!.counterparty).toEqual({ kind: 'organisation', id: 'O-COS' })
    // The reused case is now invoiced with the new invoice.
    const reused = api.getState().billing.cases[failedCaseId]!
    expect(reused.status).toBe('invoiced')
    expect(reused.invoiceId).toBeDefined()
    expect(reused.failure).toBeUndefined()
    // The sibling's invoice was NOT duplicated: 1 sibling + 1 recovered = 2.
    expect(invoicesForList(api.getState(), listId)).toHaveLength(2)
    expect(failedCases(api.getState())).toHaveLength(0)

    // A second retry is a no-op (the case is no longer failed).
    expect(retryBillingCase(api, OFFICE, failedCaseId)).toMatchObject({ ok: false, code: 'caseNotFailed' })
    expect(invoicesForList(api.getState(), listId)).toHaveLength(2)
  })

  it('a recovered case is then handed off to Xero (the monitor resolve-and-retry flow)', () => {
    const api = store()
    triggerFailure(api)
    const failedCaseId = failedCases(api.getState())[0]!.id
    expect(chooseContractForFailedBooking(api, OFFICE, failedCaseId, losaProcedureId(api), CONTRACT.cosAcc).ok).toBe(true)
    expect(retryBillingCase(api, OFFICE, failedCaseId).ok).toBe(true)

    // The monitor hands the rebuilt invoice off so it becomes payable.
    expect(api.getState().billing.cases[failedCaseId]!.accRecId).toBeUndefined()
    expect(handoffCase(api, failedCaseId).ok).toBe(true)
    const c = api.getState().billing.cases[failedCaseId]!
    expect(c.status).toBe('handedOff')
    expect(c.accRecId).toBeDefined()
    expect(c.accPayId).toBeDefined()
  })

  it('refuses a retry on a case that never failed', () => {
    const api = store()
    triggerFailure(api)
    const listId = SEED_LIST_IDS.billingFailure
    // The clean sibling's case is 'invoiced' — retrying it is refused.
    const siblingInvoice = invoicesForList(api.getState(), listId)[0]!
    const invoicedCase = Object.values(api.getState().billing.cases).find((c) => c.invoiceId === siblingInvoice.id)!
    expect(retryBillingCase(api, OFFICE, invoicedCase.id)).toMatchObject({ ok: false, code: 'caseNotFailed' })
    // And a genuinely unknown case id.
    expect(retryBillingCase(api, OFFICE, 'BC-nope')).toMatchObject({ ok: false, code: 'notFound' })
  })
})

describe('chooseContractForFailedBooking (the one edit on an authorised List)', () => {
  it('is office only, on a failed Booking with no invoice, for an Active Contract, and audited', () => {
    const api = store()
    triggerFailure(api)
    const failedCaseId = failedCases(api.getState())[0]!.id
    const procId = losaProcedureId(api)
    expect(chooseContractForFailedBooking(api, SOUTER, failedCaseId, procId, CONTRACT.cosAcc)).toMatchObject({ ok: false, code: 'officeOnly' })
    // The ordinary office edit stays locked on the authorised List.
    expect(editProcedure(api, OFFICE, procId, { governingContractId: CONTRACT.cosAcc })).toMatchObject({ ok: false, code: 'listAuthorised' })
    expect(disableContract(api, OFFICE, CONTRACT.stgAcc).ok).toBe(true)
    expect(chooseContractForFailedBooking(api, OFFICE, failedCaseId, procId, CONTRACT.stgAcc)).toMatchObject({ ok: false, code: 'contractDisabled' })
    expect(chooseContractForFailedBooking(api, OFFICE, failedCaseId, procId, CONTRACT.cosAcc).ok).toBe(true)
    expect(api.getState().audit.at(-1)).toMatchObject({
      action: 'procedure.update',
      entityId: procId,
      before: { governingContractId: CONTRACT.cosFixed },
      after: { governingContractId: CONTRACT.cosAcc },
    })
  })

  it("refuses a Booking that billed, and a procedure from another Booking", () => {
    const api = store()
    triggerFailure(api)
    const listId = SEED_LIST_IDS.billingFailure
    const siblingInvoice = invoicesForList(api.getState(), listId)[0]!
    const invoicedCase = Object.values(api.getState().billing.cases).find((c) => c.invoiceId === siblingInvoice.id)!
    const siblingProc = proceduresForBooking(api.getState(), siblingInvoice.bookingId)[0]!.id
    expect(chooseContractForFailedBooking(api, OFFICE, invoicedCase.id, siblingProc, CONTRACT.cosAcc)).toMatchObject({ ok: false, code: 'caseNotFailed' })
    const failedCaseId = failedCases(api.getState())[0]!.id
    expect(chooseContractForFailedBooking(api, OFFICE, failedCaseId, siblingProc, CONTRACT.cosAcc)).toMatchObject({ ok: false, code: 'notFound' })
  })
})

describe('Resolve & retry after the review pass', () => {
  it('keeps the current Contract once its missing price is added, then retries', () => {
    const api = store()
    triggerFailure(api)
    const failedCaseId = failedCases(api.getState())[0]!.id
    const proc = api.getState().schedule.procedures[losaProcedureId(api)]!
    expect(addContractPrice(api, OFFICE, { contractId: CONTRACT.cosFixed, rvgGroupId: proc.rvgGroupId!, price: 1100 }).ok).toBe(true)
    expect(chooseContractForFailedBooking(api, OFFICE, failedCaseId, proc.id, CONTRACT.cosFixed).ok).toBe(true)
    expect(retryBillingCase(api, OFFICE, failedCaseId).ok).toBe(true)
    expect(invoicesForBooking(api, marker('billingFailureBooking'))[0]!.total).toBe(1265)
  })

  it('refuses a Contract whose holder cannot be billed on the hospital route', () => {
    const api = store()
    triggerFailure(api)
    const failedCaseId = failedCases(api.getState())[0]!.id
    expect(chooseContractForFailedBooking(api, OFFICE, failedCaseId, losaProcedureId(api), CONTRACT.noContractRvg)).toMatchObject({ ok: false, code: 'noRouteCounterparty' })
  })
})
