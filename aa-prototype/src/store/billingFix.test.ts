/**
 * The Billing tab's fixes for a failed Booking (Phase 60; US-13.3.1,
 * US-13.3.2, D116): Mark resolved by hand, who Fix the payer edits, and Fix
 * the payer then retry for a holder Party, the patient and another payer.
 */

import { describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from './appStore'
import { authoriseList } from './lifecycle'
import { runBillingForList } from './billingRun'
import { fixBookingPayer, markBillingExceptionResolved, payerFixTarget, retryBillingFailure } from './billingFix'
import { openBillingExceptions, pairsForBooking } from './ledgerSelectors'
import { partyForCounterparty } from '../domain/billing/whoIsBilled'
import { PAYER_NO_ADDRESS_CODE } from '../domain/billing/billingStatus'
import { EMAIL_PROBLEM } from '../domain/billing/payer'
import type { Actor } from './mutate'
import type { BillingException, Invoice } from '../domain/types'
import { SEED_LIST_IDS, SEED_MARKERS } from '../domain/seed'

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
function exceptionFor(api: BoundAppStore, bookingId: string): BillingException {
  const found = openBillingExceptions(api.getState()).find((x) => x.bookingId === bookingId)
  if (found === undefined) throw new Error(`no open exception for ${bookingId}`)
  return found
}

const LIST = SEED_LIST_IDS.billingFailure
const LOSA = () => marker('billingFailureBooking')

/** Authorise the S4 List, then drop Losa's lock before the run: her Booking fails `lockMissing`. */
function failForMissingLock(): { api: BoundAppStore; exceptionId: string } {
  const api = createAppStore()
  expect(authoriseList(api, OFFICE, LIST).ok).toBe(true)
  const { [LOSA()]: _dropped, ...rest } = api.getState().billing.locks
  api.setState({ billing: { ...api.getState().billing, locks: rest } })
  expect(runBillingForList(api, LIST).ok).toBe(true)
  return { api, exceptionId: exceptionFor(api, LOSA()).id }
}

/** Authorise the S4 List with Losa's holder Party stripped of its billing email and postal address, then run it. */
function failForPartyWithNoAddress(): { api: BoundAppStore; exceptionId: string; partyId: string } {
  const api = createAppStore()
  expect(authoriseList(api, OFFICE, LIST).ok).toBe(true)
  const ref = api.getState().billing.locks[LOSA()]!.parties[0]!.ref
  const party = partyForCounterparty(ref, api.getState().masters.parties)!
  const { email: _e, postalAddress: _a, ...bare } = party
  api.setState({ masters: { ...api.getState().masters, parties: { ...api.getState().masters.parties, [party.id]: bare } } })
  expect(runBillingForList(api, LIST).ok).toBe(true)
  return { api, exceptionId: exceptionFor(api, LOSA()).id, partyId: party.id }
}

describe('markBillingExceptionResolved', () => {
  it('stamps who and why with no pair ids, audited; refuses a blank note, the anaesthetist, an unknown id and a second press', () => {
    const { api, exceptionId } = failForMissingLock()
    expect(markBillingExceptionResolved(api, SOUTER, exceptionId, 'Billed by hand')).toMatchObject({ ok: false, code: 'officeOnly' })
    expect(markBillingExceptionResolved(api, OFFICE, exceptionId, '   ')).toMatchObject({ ok: false, code: 'noteRequired' })
    expect(markBillingExceptionResolved(api, OFFICE, 'BX-nope', 'Billed by hand')).toMatchObject({ ok: false, code: 'notFound' })
    expect(api.getState().billing.exceptions[exceptionId]!.resolvedAtISO).toBeUndefined()

    expect(markBillingExceptionResolved(api, OFFICE, exceptionId, '  Billed by hand in Xero  ').ok).toBe(true)
    const resolved = api.getState().billing.exceptions[exceptionId]!
    expect(resolved.resolvedAtISO).toBeDefined()
    expect(resolved.resolvedBy).toBe('Kirsty W.')
    expect(resolved.resolvedNote).toBe('Billed by hand in Xero')
    expect(resolved.resolvedPairIds).toBeUndefined()
    expect(invoicesForBooking(api, LOSA())).toHaveLength(0)
    const entry = api.getState().audit.at(-1)!
    expect(entry).toMatchObject({ action: 'billing.exceptionResolvedByHand', entityId: exceptionId })

    expect(markBillingExceptionResolved(api, OFFICE, exceptionId, 'Again')).toMatchObject({ ok: false, code: 'alreadyResolved' })
    expect(retryBillingFailure(api, OFFICE, exceptionId)).toMatchObject({ ok: false, code: 'alreadyResolved' })
  })
})

describe('Fix the payer: a holder Party', () => {
  it('a Party with no billing email or postal address fails the Booking; payerFixTarget names the Party', () => {
    const { api, exceptionId, partyId } = failForPartyWithNoAddress()
    expect(api.getState().billing.exceptions[exceptionId]!.code).toBe(PAYER_NO_ADDRESS_CODE)
    expect(invoicesForBooking(api, LOSA())).toHaveLength(0)
    const target = payerFixTarget(api.getState(), exceptionId)
    expect(target).toMatchObject({ kind: 'party', partyId, name: api.getState().masters.parties[partyId]!.name })
    expect(target).not.toHaveProperty('email')
    expect(payerFixTarget(api.getState(), 'BX-nope')).toBeUndefined()
  })

  it('refuses a bad email, no contact at all and the anaesthetist, leaving the Party as it is', () => {
    const { api, exceptionId, partyId } = failForPartyWithNoAddress()
    const before = api.getState().masters.parties[partyId]
    expect(fixBookingPayer(api, OFFICE, exceptionId, { email: 'not an email' })).toMatchObject({ ok: false, code: 'emailInvalid', message: EMAIL_PROBLEM })
    expect(fixBookingPayer(api, OFFICE, exceptionId, { email: ' ', postalAddress: '' })).toMatchObject({ ok: false, code: 'contactRequired' })
    expect(fixBookingPayer(api, SOUTER, exceptionId, { email: 'accounts@cos.example' })).toMatchObject({ ok: false, code: 'officeOnly' })
    expect(fixBookingPayer(api, OFFICE, 'BX-nope', { email: 'accounts@cos.example' })).toMatchObject({ ok: false, code: 'notFound' })
    expect(api.getState().masters.parties[partyId]).toBe(before)
    expect(api.getState().billing.exceptions[exceptionId]!.resolvedAtISO).toBeUndefined()
  })

  it('Save and retry edits the Party, raises and emails the invoice, resolves the failure with its pair and hands it to Xero', () => {
    const { api, exceptionId, partyId } = failForPartyWithNoAddress()
    const fixed = fixBookingPayer(api, OFFICE, exceptionId, { email: 'accounts@cos.example' })
    expect(fixed.ok).toBe(true)
    expect(api.getState().masters.parties[partyId]).toMatchObject({ email: 'accounts@cos.example', deliveryMethod: 'email' })
    const [invoice] = invoicesForBooking(api, LOSA())
    expect(invoice!.delivery).toMatchObject({ method: 'email', status: 'sent', sends: [{ to: 'accounts@cos.example' }] })
    const [pair] = pairsForBooking(api.getState(), LOSA())
    const resolved = api.getState().billing.exceptions[exceptionId]!
    expect(resolved.resolvedPairIds).toEqual([pair!.id])
    expect(resolved.resolvedBy).toBeUndefined()
    if (fixed.ok) expect(fixed.value.pairIds).toEqual([pair!.id])
    expect(api.getState().billing.ledger[pair!.id]!.receivable.xeroAccRecId).toBeDefined()
    const actions = api.getState().audit.map((a) => a.action)
    expect(actions.lastIndexOf('party.update')).toBeLessThan(actions.lastIndexOf('billing.exceptionResolved'))
    expect(fixBookingPayer(api, OFFICE, exceptionId, { email: 'accounts@cos.example' })).toMatchObject({ ok: false, code: 'alreadyResolved' })
  })
})

describe('Fix the payer: a person', () => {
  /** Authorise the payer review List and run it; the Booking given must fail for its payer. */
  function runPayerReview(bookingId: string, prepare?: (api: BoundAppStore) => void): { api: BoundAppStore; exceptionId: string } | undefined {
    const api = createAppStore()
    if (!authoriseList(api, OFFICE, SEED_LIST_IDS.payerReview).ok) return undefined
    prepare?.(api)
    expect(runBillingForList(api, SEED_LIST_IDS.payerReview).ok).toBe(true)
    const found = openBillingExceptions(api.getState()).find((x) => x.bookingId === bookingId)
    return found !== undefined ? { api, exceptionId: found.id } : undefined
  }

  it('the patient with no contact: the record is edited and the retry posts the invoice', () => {
    const bookingId = marker('payerContactMissing')
    const run = runPayerReview(bookingId)
    expect(run).toBeDefined()
    const { api, exceptionId } = run!
    expect(api.getState().billing.exceptions[exceptionId]!.code).toBe(PAYER_NO_ADDRESS_CODE)
    const target = payerFixTarget(api.getState(), exceptionId)
    expect(target).toMatchObject({ kind: 'patient', patientId: api.getState().schedule.bookings[bookingId]!.patientId })

    expect(fixBookingPayer(api, OFFICE, exceptionId, { email: '', postalAddress: { line1: '12 Oak St', city: 'Christchurch', postcode: '80' } })).toMatchObject({ ok: false, code: 'postalAddressInvalid' })
    const fixed = fixBookingPayer(api, OFFICE, exceptionId, { email: '', postalAddress: { line1: '12 Oak St', city: 'Christchurch', postcode: '8014' } })
    expect(fixed.ok).toBe(true)
    if (target?.kind === 'patient') expect(api.getState().masters.patients[target.patientId]!.postalAddress).toMatchObject({ line1: '12 Oak St', postcode: '8014' })
    const invoices = invoicesForBooking(api, bookingId)
    expect(invoices.length).toBeGreaterThan(0)
    for (const inv of invoices) expect(inv.delivery).toMatchObject({ method: 'post', status: 'toPost' })
    expect(api.getState().billing.exceptions[exceptionId]!.resolvedPairIds).toHaveLength(invoices.length)
  })

  it('another payer: the contact is written on the Procedures that hold them, then the retry emails the invoice', () => {
    const bookingId = marker('familyTrustPayer')
    const run = runPayerReview(bookingId, (api) => {
      // Strip the trust's contact on its Procedures before the run (the lock holds it; the run reads it live).
      const s = api.getState()
      const procedures = Object.fromEntries(
        Object.values(s.schedule.procedures)
          .filter((p) => p.bookingId === bookingId && p.payer.kind === 'other')
          .map((p) => {
            const { email: _e, postalAddress: _a, ...payer } = p.payer as Extract<typeof p.payer, { kind: 'other' }>
            return [p.id, { ...p, payer }]
          }),
      )
      api.setState({ schedule: { ...s.schedule, procedures: { ...s.schedule.procedures, ...procedures } } })
    })
    expect(run).toBeDefined()
    const { api, exceptionId } = run!
    const target = payerFixTarget(api.getState(), exceptionId)
    expect(target).toMatchObject({ kind: 'payer', locked: false })
    if (target?.kind !== 'payer') return
    expect(target.procedureIds.length).toBeGreaterThan(0)

    const fixed = fixBookingPayer(api, OFFICE, exceptionId, { email: 'trustee@whitcombe.example' })
    expect(fixed.ok).toBe(true)
    for (const id of target.procedureIds) {
      const payer = api.getState().schedule.procedures[id]!.payer
      expect(payer).toMatchObject({ kind: 'other', id: target.payerId, name: target.name, email: 'trustee@whitcombe.example' })
    }
    expect(api.getState().audit.filter((a) => a.action === 'procedure.payerContact')).toHaveLength(target.procedureIds.length)
    for (const inv of invoicesForBooking(api, bookingId)) expect(inv.delivery).toMatchObject({ method: 'email', sends: [{ to: 'trustee@whitcombe.example' }] })
    expect(api.getState().billing.exceptions[exceptionId]!.resolvedAtISO).toBeDefined()
  })
})
