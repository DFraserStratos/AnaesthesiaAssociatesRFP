/**
 * Billing failure isolation and retry under the lock (Phase 09; catch-up
 * Phase 25, OQ-05, US-08.5.1, US-08.5.2, US-13.3.2).
 *
 * The run prices only from each Booking's lock, so a Contract edit can no
 * longer break it. A Booking with no lock (or a rejected one) fails whole and
 * is held back while its siblings bill; the List never fails. `retryBillingCase`
 * rebuilds from the lock only: it never edits a master or a Procedure, refuses a
 * case that is not failed, leaves a still-failing case untouched and never
 * duplicates an invoice. The S4 beat's cause is outside the lock: the Xero
 * hand-off of Losa Tuilagi's Booking (`stageBillingFailure`).
 */

import { describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from './appStore'
import { authoriseList } from './lifecycle'
import { handoffListCases, runBillingForList, retryBillingCase } from './billingRun'
import { handoffCase } from './xeroHandoff'
import { addPriceRange, disableContract, editContract } from './contractActions'
import { editAnaesthetist } from './mastersActions'
import { stageBillingFailure } from './demoStaging'
import { failedCases, invoicesForList, proceduresForBooking } from './selectors'
import type { Actor } from './mutate'
import type { Invoice } from '../domain/types'
import { CONTRACT, SEED_LIST_IDS, SEED_MARKERS } from '../domain/seed'
import { LOCK_MISSING_MESSAGE } from '../domain/billing/lock'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const SOUTER: Actor = { who: 'Dr Melanie Souter', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: '34821' }

function marker(key: string): string {
  const m = SEED_MARKERS[key]
  if (m === undefined) throw new Error(`missing marker ${key}`)
  return m.entityId
}
function invoicesForBooking(api: BoundAppStore, bookingId: string): Invoice[] {
  return Object.values(api.getState().billing.invoices).filter((i) => i.bookingId === bookingId)
}

const LIST = SEED_LIST_IDS.billingFailure
const LOSA = () => marker('billingFailureBooking')

/** Authorise the S4 List, then drop Losa's lock before the run (a Booking with no locked record). */
function failForMissingLock(api: BoundAppStore): void {
  expect(authoriseList(api, OFFICE, LIST).ok).toBe(true)
  const { [LOSA()]: _dropped, ...rest } = api.getState().billing.locks
  api.setState({ billing: { ...api.getState().billing, locks: rest } })
  expect(runBillingForList(api, LIST).ok).toBe(true)
}

describe('failure isolation under the lock (OQ-05)', () => {
  it('a Booking with no lock fails whole while its sibling bills; the List completes its run', () => {
    const api = createAppStore()
    failForMissingLock(api)
    expect(invoicesForBooking(api, LOSA())).toHaveLength(0)
    expect(invoicesForList(api.getState(), LIST)).toHaveLength(1)
    const failed = failedCases(api.getState())
    expect(failed).toHaveLength(1)
    expect(failed[0]!.failure).toMatchObject({ code: 'lockMissing', message: LOCK_MISSING_MESSAGE })
    expect(api.getState().schedule.lists[LIST]!.billedAtISO).toBeDefined()
  })

  it('a rejected lock fails with its reason and bills its sibling', () => {
    const api = createAppStore()
    expect(authoriseList(api, OFFICE, LIST).ok).toBe(true)
    const lock = api.getState().billing.locks[LOSA()]!
    api.setState({ billing: { ...api.getState().billing, locks: { ...api.getState().billing.locks, [LOSA()]: { ...lock, state: 'rejected', rejections: [{ code: 'needsPrice', message: 'Needs a price: forced.' }], procedures: [], parties: [] } } } })
    expect(runBillingForList(api, LIST).ok).toBe(true)
    expect(failedCases(api.getState())[0]!.failure).toMatchObject({ code: 'needsPrice', message: 'Needs a price: forced.' })
    expect(invoicesForList(api.getState(), LIST)).toHaveLength(1)
  })
})

describe('retryBillingCase rebuilds from the lock only', () => {
  it('a still-failing retry leaves the case untouched; once the lock is there it bills once, never duplicating; guarded', () => {
    const api = createAppStore()
    expect(authoriseList(api, OFFICE, LIST).ok).toBe(true)
    const lock = api.getState().billing.locks[LOSA()]!
    const { [LOSA()]: _dropped, ...rest } = api.getState().billing.locks
    api.setState({ billing: { ...api.getState().billing, locks: rest } })
    expect(runBillingForList(api, LIST).ok).toBe(true)
    const failedCaseId = failedCases(api.getState())[0]!.id

    expect(retryBillingCase(api, SOUTER, failedCaseId)).toMatchObject({ ok: false, code: 'officeOnly' })
    expect(retryBillingCase(api, OFFICE, failedCaseId)).toMatchObject({ ok: false, code: 'lockMissing' })
    expect(api.getState().billing.cases[failedCaseId]!.status).toBe('failed')

    // The record returns (test-only): the retry bills exactly it, after a Contract edit and Disable.
    api.setState({ billing: { ...api.getState().billing, locks: { ...api.getState().billing.locks, [LOSA()]: lock } } })
    expect(editContract(api, OFFICE, CONTRACT.cosAcc, { name: 'COS ACC (renamed)' }).ok).toBe(true)
    expect(disableContract(api, OFFICE, CONTRACT.cosAcc).ok).toBe(true)
    expect(retryBillingCase(api, OFFICE, failedCaseId).ok).toBe(true)
    const [invoice] = invoicesForBooking(api, LOSA())
    expect(invoice!.counterparty).toEqual({ kind: 'organisation', id: 'O-COS' })
    expect(invoice!.total).toBe(lock.expected.total)
    const reused = api.getState().billing.cases[failedCaseId]!
    expect(reused).toMatchObject({ status: 'invoiced', payeeAnaesthetistId: lock.payee.anaesthetistId })
    expect(reused.failure).toBeUndefined()
    expect(invoicesForList(api.getState(), LIST)).toHaveLength(2)

    // A second retry is refused; the invoice count does not change.
    expect(retryBillingCase(api, OFFICE, failedCaseId)).toMatchObject({ ok: false, code: 'caseNotFailed' })
    expect(invoicesForList(api.getState(), LIST)).toHaveLength(2)
    expect(retryBillingCase(api, OFFICE, 'BC-nope')).toMatchObject({ ok: false, code: 'notFound' })
  })

  it('no master is edited by a run or a retry', () => {
    const api = createAppStore()
    const masters = api.getState().masters
    failForMissingLock(api)
    retryBillingCase(api, OFFICE, failedCases(api.getState())[0]!.id)
    expect(api.getState().masters).toBe(masters)
  })
})

describe('the S4 billing failure, re-based on the Xero hand-off (stageBillingFailure)', () => {
  function staged(): BoundAppStore {
    const api = createAppStore()
    expect(stageBillingFailure(api).ok).toBe(true)
    expect(runBillingForList(api, LIST).ok).toBe(true)
    handoffListCases(api, LIST)
    return api
  }

  it("Losa Tuilagi's Booking is held back at the hand-off, Hemi Walker's bills and hands off, and the List is not failed", () => {
    const api = staged()
    const cases = Object.values(api.getState().billing.cases).filter((c) => proceduresForBooking(api.getState(), c.bookingId).length > 0 && api.getState().schedule.bookings[c.bookingId]?.listId === LIST)
    const losa = cases.find((c) => c.bookingId === LOSA())!
    const sibling = cases.find((c) => c.bookingId !== LOSA())!
    expect(losa.handoffFailure).toBeDefined()
    expect(losa.accRecId).toBeUndefined()
    expect(sibling.accRecId).toBeDefined()
    expect(sibling.handoffFailure).toBeUndefined()
    expect(failedCases(api.getState())).toHaveLength(0)
    expect(api.getState().settings.failNextHandoff).toBe(false)
    expect(api.getState().settings.failHandoffBookingId).toBeUndefined()
  })

  it('Resolve & retry hands hers off once; a second press creates nothing more; no Contract changed', () => {
    const api = staged()
    const contracts = api.getState().masters.contracts
    const losa = Object.values(api.getState().billing.cases).find((c) => c.bookingId === LOSA())!
    expect(handoffCase(api, losa.id).ok).toBe(true)
    const after = api.getState().billing.cases[losa.id]!
    expect(after.accRecId).toBeDefined()
    expect(after.handoffFailure).toBeUndefined()
    const accRecs = Object.keys(api.getState().xero.accRecs).length
    expect(handoffCase(api, losa.id).ok).toBe(true)
    expect(Object.keys(api.getState().xero.accRecs)).toHaveLength(accRecs)
    expect(api.getState().masters.contracts).toBe(contracts)
  })

  it('a second press says Already triggered', () => {
    const api = staged()
    expect(stageBillingFailure(api)).toMatchObject({ ok: false, code: 'alreadyTriggered', message: 'Already triggered' })
  })
})

describe('the run reads the lock, not the masters (US-08.1.1)', () => {
  it('a backdated range, a Contract edit and a unit-value change after authorise move nothing the run raises', () => {
    const plain = createAppStore()
    expect(authoriseList(plain, OFFICE, LIST).ok).toBe(true)
    expect(runBillingForList(plain, LIST).ok).toBe(true)
    const before = invoicesForList(plain.getState(), LIST).map((i) => ({ counterparty: i.counterparty, total: i.total }))

    const api = createAppStore()
    expect(authoriseList(api, OFFICE, LIST).ok).toBe(true)
    expect(addPriceRange(api, OFFICE, CONTRACT.cosFixed, { startISO: '2026-07-01', price: 1100 }).ok).toBe(true)
    expect(editContract(api, OFFICE, CONTRACT.stgAcc, { name: 'St George ACC renamed' }).ok).toBe(true)
    const ropata = api.getState().schedule.lists[LIST]!.anaesthetistId!
    expect(editAnaesthetist(api, OFFICE, ropata, { unitValue: 99 }).ok).toBe(true)
    expect(runBillingForList(api, LIST).ok).toBe(true)
    expect(invoicesForList(api.getState(), LIST).map((i) => ({ counterparty: i.counterparty, total: i.total }))).toEqual(before)
  })
})
