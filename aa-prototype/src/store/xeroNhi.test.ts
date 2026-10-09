/**
 * Convention 8 proof (Phase 10; D9): the NHI NEVER crosses to Xero. After
 * exercising the whole money chain (billing run → handoff → payment → payables),
 * the serialised Xero slice contains none of the seeded NHIs, in either format.
 * The Xero slice keys patients on the hidden internal id (ContactNumber), never
 * the NHI (RFP Appendix 2, the prototype's implemented reading).
 *
 * Catch-up Phase 16 widens it into the Xero privacy scan (US-09.3.1, OQ-30
 * answered: no personal information in Xero): no patient or billable-party
 * name, phone, email or address either, seeded or live.
 */

import { describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from './appStore'
import { authoriseList } from './lifecycle'
import { runBillingForList, handoffListCases } from './billingRun'
import { raisePreProcedureInvoice } from './prepaymentActions'
import { receivePayment } from './paymentActions'
import { runPayables } from './payablesActions'
import { openAccRecs } from './selectors'
import { validateNhi } from '../domain/nhi'
import type { Actor } from './mutate'
import { SEED_LIST_IDS, SEED_MARKERS } from '../domain/seed'
import type { AppState } from './appStore'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }

function store(): BoundAppStore {
  return createAppStore()
}

describe('no NHI in the Xero slice (convention 8 / Appendix 2)', () => {
  it('the serialised Xero slice contains no seeded NHI (either format)', () => {
    const api = store()

    // Exercise the whole chain so the Xero slice is well populated with
    // organisation, patient and payee contacts + ACCREC/ACCPAY pairs.
    const morrison = SEED_MARKERS.submittedListMorrison!.entityId
    expect(authoriseList(api, OFFICE, morrison).ok).toBe(true)
    expect(runBillingForList(api, morrison).ok).toBe(true)
    handoffListCases(api, morrison)
    // A patient-payer pair (self-funded pre-payment).
    expect(raisePreProcedureInvoice(api, OFFICE, SEED_MARKERS.prepaymentBooking!.entityId).ok).toBe(true)
    // Pay everything, then disburse.
    let i = 0
    for (const cand of openAccRecs(api.getState())) {
      receivePayment(api, { accRecId: cand.accRecId, amount: cand.remaining, idempotencyKey: `K${i++}`, source: 'webhook' })
    }
    expect(runPayables(api, OFFICE).ok).toBe(true)

    const serialised = JSON.stringify(api.getState().xero)
    const nhis = Object.values(api.getState().masters.patients)
      .map((p) => p.nhi)
      .filter((n): n is string => n !== undefined && n.trim() !== '')

    // The probe set covers a large, mixed-format population.
    expect(nhis.length).toBeGreaterThan(100)
    const formats = new Set(nhis.map((n) => validateNhi(n).format))
    expect(formats.has('current')).toBe(true)
    expect(formats.has('new')).toBe(true)

    // The Xero slice IS populated (contacts + a pair), and holds no NHI.
    expect(Object.keys(api.getState().xero.contacts).length).toBeGreaterThan(0)
    expect(Object.keys(api.getState().xero.accRecs).length).toBeGreaterThan(0)
    for (const nhi of nhis) {
      expect(serialised, `NHI ${nhi} must not appear in the Xero slice`).not.toContain(nhi)
    }
  })
})

/** Every personal value a patient or billable party holds (never in Xero). */
function personalValues(state: AppState): string[] {
  const people = [...Object.values(state.masters.patients), ...Object.values(state.masters.billableParties)]
  const values = people.flatMap((p) => [p.name, p.phone, p.email, p.address])
  return values.filter((v): v is string => v !== undefined && v.trim() !== '')
}

function expectNoPersonalInformation(state: AppState): void {
  const serialised = JSON.stringify(state.xero)
  const values = personalValues(state)
  expect(values.length).toBeGreaterThan(100)
  for (const value of values) {
    expect(serialised, `"${value}" must not appear in the Xero slice`).not.toContain(value)
  }
}

describe('Xero privacy scan (US-09.3.1: no personal information in Xero)', () => {
  it('the seeded Xero slice holds no patient or billable-party name, phone, email or address', () => {
    const api = store()
    // The seed ships patient and billable-party contacts (history + pre-payment pair).
    const individual = Object.values(api.getState().xero.contacts).filter((c) => c.type !== 'organisation')
    expect(individual.length).toBeGreaterThan(0)
    for (const c of individual) expect(c.name).toMatch(/^(Patient|Billable party) [A-Z]+\d+$/)
    expectNoPersonalInformation(api.getState())
  })

  it('stays clean after the S3 billing run, a pre-payment invoice and payments', () => {
    const api = store()
    for (const listId of [SEED_LIST_IDS.souterMon20Am, SEED_LIST_IDS.souterMon20Pm]) {
      expect(authoriseList(api, OFFICE, listId).ok).toBe(true)
      expect(runBillingForList(api, listId).ok).toBe(true)
      handoffListCases(api, listId)
    }
    expect(raisePreProcedureInvoice(api, OFFICE, SEED_MARKERS.prepaymentBooking!.entityId).ok).toBe(true)
    let i = 0
    for (const cand of openAccRecs(api.getState())) {
      receivePayment(api, { accRecId: cand.accRecId, amount: cand.remaining, idempotencyKey: `P${i++}`, source: 'webhook' })
    }
    expect(runPayables(api, OFFICE).ok).toBe(true)
    expectNoPersonalInformation(api.getState())
  })
})
