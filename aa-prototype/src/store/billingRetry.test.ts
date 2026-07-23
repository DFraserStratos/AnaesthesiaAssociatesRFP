/**
 * Billing failure isolation + resolve-and-retry tests (Phase 09; A5).
 *
 * The seeded multi-card failure list bills its clean hospital-route card while
 * the COS-held card fails (its organisation contract dated out has no default
 * fallback) — per-card isolation. `retryBillingCase` recovers the fixed card
 * without duplicating the list's other invoices, is idempotent, and is refused
 * on a non-failed case and to non-office actors.
 */

import { describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from './appStore'
import { authoriseList, submitList } from './lifecycle'
import { runBillingForList, retryBillingCase } from './billingRun'
import { editContract } from './contractActions'
import { failedCases, invoicesForList } from './selectors'
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
function invoicesForCard(api: BoundAppStore, cardId: string): Invoice[] {
  return Object.values(api.getState().billing.invoices).filter((i) => i.cardId === cardId)
}

/** Date the COS ACC contract out (before the failure list's Thu 16 date), then run. */
function triggerFailure(api: BoundAppStore): void {
  expect(editContract(api, OFFICE, CONTRACT.cosAcc, { effectiveToISO: '2026-07-15' }).ok).toBe(true)
  const listId = SEED_LIST_IDS.billingFailure
  const list = api.getState().schedule.lists[listId]!
  if (list.state === 'DRAFT') expect(submitList(api, OFFICE, listId).ok).toBe(true)
  expect(authoriseList(api, OFFICE, listId).ok).toBe(true)
  const run = runBillingForList(api, listId)
  expect(run.ok).toBe(true)
}

describe('failure isolation', () => {
  it('the COS card fails while the clean sibling still invoices', () => {
    const api = store()
    triggerFailure(api)
    const listId = SEED_LIST_IDS.billingFailure
    const failureCard = marker('billingFailureCard')

    // Only the sibling billed; the COS card produced no invoice.
    expect(invoicesForList(api.getState(), listId)).toHaveLength(1)
    expect(invoicesForCard(api, failureCard)).toHaveLength(0)

    const failed = failedCases(api.getState())
    expect(failed).toHaveLength(1)
    expect(failed[0]!.cardId).toBe(failureCard)
    expect(failed[0]!.failure?.code).toBe('contractIneffective')
    // The list still completed its run (the settled billedAt reading).
    expect(api.getState().schedule.lists[listId]!.billedAtISO).toBeDefined()
  })
})

describe('retryBillingCase', () => {
  it('recovers the fixed card without duplicating the list other invoices; idempotent; guarded', () => {
    const api = store()
    triggerFailure(api)
    const listId = SEED_LIST_IDS.billingFailure
    const failureCard = marker('billingFailureCard')
    const failedCaseId = failedCases(api.getState())[0]!.id

    // Office-only.
    expect(retryBillingCase(api, SOUTER, failedCaseId)).toMatchObject({ ok: false, code: 'officeOnly' })

    // Retrying before the data is fixed still fails (case stays failed).
    expect(retryBillingCase(api, OFFICE, failedCaseId)).toMatchObject({ ok: false, code: 'contractIneffective' })
    expect(api.getState().billing.cases[failedCaseId]!.status).toBe('failed')

    // Fix the data (restore the contract), then retry.
    expect(editContract(api, OFFICE, CONTRACT.cosAcc, { effectiveToISO: '2027-01-01' }).ok).toBe(true)
    const retried = retryBillingCase(api, OFFICE, failedCaseId)
    expect(retried.ok).toBe(true)

    expect(invoicesForCard(api, failureCard)).toHaveLength(1)
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
