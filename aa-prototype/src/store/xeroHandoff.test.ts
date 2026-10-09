/**
 * Xero handoff tests (Phase 10; WI2, X2/X3, D-handoff).
 *
 * The atomic ACCREC + DRAFT ACCPAY pair is created from an invoiced case,
 * linked back via the case GUIDs; contacts resolve by ContactNumber (never the
 * NHI) and dedupe across episodes; a handoff FAULT is data (no pair, case stays
 * invoiced, flag cleared) and its retry creates exactly one pair; an already
 * paired case is a no-op.
 */

import { describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from './appStore'
import { authoriseList, submitList } from './lifecycle'
import { runBillingForList, handoffListCases } from './billingRun'
import { handoffCase, payerContactSpec } from './xeroHandoff'
import { raisePreProcedureInvoice } from './prepaymentActions'
import { armHandoffFault } from './demoSettingsActions'
import { casesForList, casesForBooking } from './selectors'
import { clockISO, type Actor } from './mutate'
import { SEED_LIST_IDS, SEED_MARKERS, PAT, BP } from '../domain/seed'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }

function store(): BoundAppStore {
  return createAppStore()
}
function marker(key: string): string {
  const m = SEED_MARKERS[key]
  if (m === undefined) throw new Error(`missing marker ${key}`)
  return m.entityId
}
function listOf(api: BoundAppStore, bookingId: string): string {
  const booking = api.getState().schedule.bookings[bookingId]
  if (booking === undefined) throw new Error(`missing booking ${bookingId}`)
  return booking.listId
}
/** Submit → authorise → run → hand off (no wired emitter). */
function billAndHandoff(api: BoundAppStore, listId: string): void {
  const list = api.getState().schedule.lists[listId]
  if (list?.state === 'ACTIVE') expect(submitList(api, OFFICE, listId).ok).toBe(true)
  expect(authoriseList(api, OFFICE, listId).ok).toBe(true)
  expect(runBillingForList(api, listId).ok).toBe(true)
  handoffListCases(api, listId)
}

describe('Xero handoff — the atomic pair', () => {
  it('creates one ACCREC + one DRAFT ACCPAY per invoice, linked via the case', () => {
    const api = store()
    const listId = SEED_LIST_IDS.morrisonMon20
    billAndHandoff(api, listId)

    const cases = casesForList(api.getState(), listId).filter((c) => c.status !== 'failed')
    expect(cases.length).toBeGreaterThan(0)
    const { accRecs, accPays } = api.getState().xero
    for (const c of cases) {
      expect(c.status).toBe('handedOff')
      expect(c.accRecId).toBeDefined()
      expect(c.accPayId).toBeDefined()
      const accRec = accRecs[c.accRecId!]!
      const accPay = accPays[c.accPayId!]!
      const invoice = api.getState().billing.invoices[c.invoiceId!]!
      expect(accRec.invoiceId).toBe(invoice.id)
      expect(accRec.kind).toBe('procedure')
      expect(accRec.amountDue).toBe(invoice.total)
      // US-09.1.1: identifiers stored on both records, not derived; -P on the payable (US-08.4.3).
      expect(accRec.invoiceNumber).toBe(invoice.invoiceNumber)
      expect(accPay.invoiceNumber).toBe(`${invoice.invoiceNumber}-P`)
      expect(accRec.reference).toBe(invoice.caseReference)
      expect(accPay.reference).toBe(invoice.caseReference)
      expect(accRec.issuedAtISO).toBe(clockISO(api.getState().clock))
      expect(accPay.issuedAtISO).toBe(accRec.issuedAtISO)
      expect(accRec.paidAtISO).toBeUndefined()
      expect(accPay.anaesthetistId).toBe(api.getState().schedule.lists[listId]!.anaesthetistId)
      expect(accRec.amountReceived).toBe(0)
      expect(accRec.status).toBe('awaitingPayment')
      // ACCPAY DRAFT, paired to the ACCREC, nothing authorised yet.
      expect(accPay.accRecId).toBe(accRec.id)
      expect(accPay.status).toBe('draft')
      // FT-10.3: the payable is the gross amount, never net of a fee.
      expect(accPay.amountPayable).toBe(accRec.amountDue)
      expect(Object.keys(accPay).sort()).toEqual([
        'accRecId', 'amountAuthorised', 'amountDisbursed', 'amountPayable', 'anaesthetistId',
        'contactId', 'id', 'invoiceNumber', 'issuedAtISO', 'reference', 'status',
      ])
      expect(accPay.amountAuthorised).toBe(0)
      expect(accPay.amountDisbursed).toBe(0)
    }
    // One ACCREC per case on this list (scoped — the seed pre-populates Xero).
    const listInvoiceIds = new Set(cases.map((c) => c.invoiceId))
    const listAccRecs = Object.values(accRecs).filter((r) => listInvoiceIds.has(r.invoiceId))
    expect(listAccRecs.length).toBe(cases.length)
  })

  it('dedupes the payer + payee contacts across every episode on the list', () => {
    const api = store()
    billAndHandoff(api, SEED_LIST_IDS.morrisonMon20)
    // Morrison's list is all St George's hospital route, 6 bookings → still ONE
    // St George's payer contact and ONE Morrison payee contact (deduped, and the
    // seeded St George's org contact is reused via the cache).
    const contacts = Object.values(api.getState().xero.contacts)
    const stg = contacts.filter((c) => c.contactNumber === 'H-STG')
    const morrisonPayee = contacts.filter((c) => c.contactNumber === 'ANAE-25490')
    expect(stg.length).toBe(1)
    expect(morrisonPayee.length).toBe(1)
  })

  it('keys the patient contact on the hidden internal id, never the NHI (convention 8)', () => {
    const api = store()
    // Raise the self-funded pre-payment pre-invoice (patient payer) → patient contact.
    const rileyBooking = marker('prepaymentBooking')
    expect(raisePreProcedureInvoice(api, OFFICE, rileyBooking).ok).toBe(true)

    const contacts = Object.values(api.getState().xero.contacts)
    const patientContact = contacts.find((c) => c.type === 'patient')
    expect(patientContact).toBeDefined()
    // ContactNumber is the hidden internal id (PT…), and the patient's NHI is nowhere.
    expect(patientContact!.contactNumber).toBe(PAT.riley)
    const riley = api.getState().masters.patients[PAT.riley]!
    expect(riley.nhi).toBeDefined()
    expect(JSON.stringify(api.getState().xero)).not.toContain(riley.nhi!)
  })
})

describe('Xero handoff — no personal information in Xero (US-09.3.1)', () => {
  it('names a patient payer contact only by the neutral label, reusing the archived contact', () => {
    const api = store()
    const before = Object.keys(api.getState().xero.contacts).length
    expect(raisePreProcedureInvoice(api, OFFICE, marker('prepaymentBooking')).ok).toBe(true)
    const contact = Object.values(api.getState().xero.contacts).find((c) => c.contactNumber === PAT.riley)!
    expect(contact.name).toBe(`Patient ${PAT.riley}`)
    expect(contact.archived).toBe(false)
    // The seeded (archived) contact is reused, not duplicated.
    expect(Object.keys(api.getState().xero.contacts).length).toBe(before)
    expect(JSON.stringify(api.getState().xero)).not.toContain(api.getState().masters.patients[PAT.riley]!.name)
  })

  it('builds every individual payer contact from the hidden id, never a name', () => {
    const masters = store().getState().masters
    expect(payerContactSpec({ kind: 'patient', id: PAT.riley }, masters)).toMatchObject({
      contactNumber: PAT.riley,
      name: `Patient ${PAT.riley}`,
      type: 'patient',
    })
    expect(payerContactSpec({ kind: 'billableParty', id: BP.guardian }, masters)).toMatchObject({
      contactNumber: BP.guardian,
      name: `Billable party ${BP.guardian}`,
      type: 'billableParty',
    })
    // The seeded guardian contact carries the same label (history and handoff agree).
    const seeded = Object.values(store().getState().xero.contacts).find((c) => c.contactNumber === BP.guardian)!
    expect(seeded.name).toBe(`Billable party ${BP.guardian}`)
  })

  it('keeps an organisation payer and the anaesthetist payee named', () => {
    const api = store()
    billAndHandoff(api, SEED_LIST_IDS.morrisonMon20)
    const contacts = Object.values(api.getState().xero.contacts)
    const stg = contacts.find((c) => c.contactNumber === 'H-STG')!
    const payee = contacts.find((c) => c.contactNumber === 'ANAE-25490')!
    expect(stg.name).toBe(api.getState().masters.hospitals[stg.contactNumber]?.name ?? stg.name)
    expect(stg.name).not.toMatch(/^Patient |^Billable party /)
    expect(payee.name).toBe(api.getState().masters.anaesthetists['25490']!.name)
  })
})

describe('Xero handoff — fault, retry, idempotency (D-handoff)', () => {
  function cosCaseId(api: BoundAppStore): string {
    const listId = listOf(api, marker('cosAccContractBooking'))
    const cases = casesForList(api.getState(), listId).filter((c) => c.status !== 'failed')
    expect(cases.length).toBe(1)
    return cases[0]!.id
  }

  it('a fault records handoffFailure, creates no pair, keeps status invoiced, clears the flag', () => {
    const api = store()
    const listId = listOf(api, marker('cosAccContractBooking'))
    expect(submitList(api, OFFICE, listId).ok).toBe(true)
    expect(authoriseList(api, OFFICE, listId).ok).toBe(true)
    expect(runBillingForList(api, listId).ok).toBe(true)
    // Arm the fault, then hand off.
    expect(armHandoffFault(api, OFFICE).ok).toBe(true)
    handoffListCases(api, listId)

    const c = api.getState().billing.cases[cosCaseId(api)]!
    expect(c.handoffFailure).toBeDefined()
    expect(c.accRecId).toBeUndefined() // no pair created for this case
    expect(c.status).toBe('invoiced')
    // Flag cleared so the next handoff succeeds.
    expect(api.getState().settings.failNextHandoff).toBe(false)
  })

  it('retrying a faulted handoff creates exactly one pair and clears the fault', () => {
    const api = store()
    const listId = listOf(api, marker('cosAccContractBooking'))
    expect(submitList(api, OFFICE, listId).ok).toBe(true)
    expect(authoriseList(api, OFFICE, listId).ok).toBe(true)
    expect(runBillingForList(api, listId).ok).toBe(true)
    expect(armHandoffFault(api, OFFICE).ok).toBe(true)
    handoffListCases(api, listId)

    const caseId = cosCaseId(api)
    expect(handoffCase(api, caseId).ok).toBe(true)
    const c = api.getState().billing.cases[caseId]!
    expect(c.handoffFailure).toBeUndefined()
    expect(c.accRecId).toBeDefined() // exactly one pair now
    expect(c.accPayId).toBeDefined()
    expect(c.status).toBe('handedOff')
  })

  it('is idempotent — a second handoff of an already-paired case is a no-op', () => {
    const api = store()
    const listId = listOf(api, marker('cosAccContractBooking'))
    billAndHandoff(api, listId)
    const caseId = cosCaseId(api)
    const before = api.getState().billing.cases[caseId]!.accRecId
    const recsBefore = Object.keys(api.getState().xero.accRecs).length

    expect(handoffCase(api, caseId).ok).toBe(true)
    expect(api.getState().billing.cases[caseId]!.accRecId).toBe(before)
    expect(Object.keys(api.getState().xero.accRecs).length).toBe(recsBefore)
  })
})

describe('Xero handoff — pre-payment pre-invoice gets a full pair (D-pre-invoice-pair)', () => {
  it('raising a pre-invoice hands its case off to a full ACCREC + ACCPAY pair', () => {
    const api = store()
    const rileyBooking = marker('prepaymentBooking')
    expect(raisePreProcedureInvoice(api, OFFICE, rileyBooking).ok).toBe(true)
    const cases = casesForBooking(api.getState(), rileyBooking)
    expect(cases.length).toBe(1)
    const c = cases[0]!
    expect(c.accRecId).toBeDefined()
    expect(c.accPayId).toBeDefined()
    expect(c.status).toBe('handedOff')
  })
})
