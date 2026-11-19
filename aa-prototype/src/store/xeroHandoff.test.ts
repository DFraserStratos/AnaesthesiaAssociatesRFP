/**
 * Xero handoff tests (Phase 10; WI2, X2/X3, D-handoff).
 *
 * The atomic ACCREC + DRAFT ACCPAY pair is created from a ledger pair, linked
 * back via the legs' Xero ids; contacts resolve by ContactNumber (never the
 * NHI) and dedupe across episodes; a handoff FAULT is data (no Xero pair, the
 * ledger pair stands "Not yet in Xero", flag cleared) and its retry creates
 * exactly one Xero pair; an already mirrored pair is a no-op.
 */

import { describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from './appStore'
import { authoriseList, submitList } from './lifecycle'
import { runBillingForList } from './billingRun'
import { handoffListPairs, handoffPair, payerContactSpec } from './xeroHandoff'
import { approveAllPrepayments } from '../test/approvePrepayments'
import { armHandoffFault } from './demoSettingsActions'
import { handoffQueuedFor, pairsForList, pairsForBooking } from './ledgerSelectors'
import { pairStatusOf } from './ledgerSelectors'
import { processXeroQueue } from './xeroQueue'
import { pairStatusLabel } from '../domain/billing/ledger'
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
  handoffListPairs(api, listId)
}

describe('Xero handoff — the atomic pair', () => {
  it('creates one ACCREC + one DRAFT ACCPAY per invoice, linked via the ledger pair', () => {
    const api = store()
    const listId = SEED_LIST_IDS.morrisonMon20
    billAndHandoff(api, listId)

    const cases = pairsForList(api.getState(), listId)
    expect(cases.length).toBeGreaterThan(0)
    const { accRecs, accPays } = api.getState().xero
    for (const c of cases) {
      expect(pairStatusLabel(c)).toBe('handedOff')
      expect(c.receivable.xeroAccRecId).toBeDefined()
      expect(c.payable?.xeroAccPayId).toBeDefined()
      const accRec = accRecs[c.receivable.xeroAccRecId!]!
      const accPay = accPays[c.payable!.xeroAccPayId!]!
      const invoice = api.getState().billing.invoices[c.invoiceId]!
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
        'contactId', 'id', 'invoiceNumber', 'issuedAtISO', 'reference', 'status', 'taxInvoice',
      ])
      expect(accPay.amountAuthorised).toBe(0)
      expect(accPay.amountDisbursed).toBe(0)
      // US-09.1.4 (provisional, OQ-29): the ACCPAY stands as the buyer-created tax invoice for its receivable.
      expect(accPay.taxInvoice).toMatchObject({
        kind: 'buyerCreated',
        documentName: 'Buyer-created tax invoice',
        supplierName: 'Dr Kate Morrison',
        supplierGstNumber: '104254901',
        agentName: 'Anaesthesia Associates Limited',
        relatesToInvoiceNumber: invoice.invoiceNumber,
        provisional: true,
      })
      expect(accPay.taxInvoice?.wording).toContain(`for services invoiced on ${invoice.invoiceNumber}.`)
      const paired = api.getState().audit.filter((a) => a.entityId === c.id && a.action === 'xero.pairCreated').at(-1)
      expect(paired?.after).toMatchObject({ accPayId: accPay.id, taxInvoiceProvisional: true })
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
    // Approve and send the self funded prepayment invoice (patient payer) → patient contact.
    const rileyBooking = marker('prepaymentBooking')
    expect(approveAllPrepayments(api, rileyBooking, OFFICE)).toHaveLength(1)

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
    expect(approveAllPrepayments(api, marker('prepaymentBooking'), OFFICE)).toHaveLength(1)
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
    const cases = pairsForList(api.getState(), listId)
    expect(cases.length).toBe(1)
    return cases[0]!.id
  }

  it('a fault queues one failed attempt, creates no Xero pair, keeps the ledger pair "Not yet in Xero", clears the flag', () => {
    const api = store()
    const listId = listOf(api, marker('cosAccContractBooking'))
    expect(submitList(api, OFFICE, listId).ok).toBe(true)
    expect(authoriseList(api, OFFICE, listId).ok).toBe(true)
    expect(runBillingForList(api, listId).ok).toBe(true)
    // Arm the fault, then hand off.
    expect(armHandoffFault(api, OFFICE).ok).toBe(true)
    handoffListPairs(api, listId)

    const c = api.getState().billing.ledger[cosCaseId(api)]!
    // Catch-up Phase 37: the fault is one failed attempt in the Xero sync queue.
    expect(handoffQueuedFor(api.getState(), c.id)).toMatchObject({ kind: 'handoff', attempts: 1, status: 'waiting' })
    expect(c.receivable.xeroAccRecId).toBeUndefined() // no Xero pair created for this ledger pair
    expect(pairStatusOf(api.getState(), c)).toBe('waitingForXero')
    expect(pairStatusLabel(c)).toBe('invoiced')
    // Flag cleared so the next handoff succeeds.
    expect(api.getState().settings.failNextHandoff).toBe(false)
  })

  it('the queue retrying a faulted handoff creates exactly one pair and clears the item', () => {
    const api = store()
    const listId = listOf(api, marker('cosAccContractBooking'))
    expect(submitList(api, OFFICE, listId).ok).toBe(true)
    expect(authoriseList(api, OFFICE, listId).ok).toBe(true)
    expect(runBillingForList(api, listId).ok).toBe(true)
    expect(armHandoffFault(api, OFFICE).ok).toBe(true)
    handoffListPairs(api, listId)

    const caseId = cosCaseId(api)
    // A fresh hand-off while queued does not skip the queue.
    expect(handoffPair(api, caseId)).toMatchObject({ ok: true, value: { queued: true } })
    expect(processXeroQueue(api, { force: true }).sent).toBe(1)
    const c = api.getState().billing.ledger[caseId]!
    expect(handoffQueuedFor(api.getState(), caseId)).toBeUndefined()
    expect(c.receivable.xeroAccRecId).toBeDefined() // exactly one pair now
    expect(c.kind !== 'aaFee' ? c.payable?.xeroAccPayId : undefined).toBeDefined()
    expect(pairStatusLabel(c)).toBe('handedOff')
  })

  it('is idempotent — a second handoff of an already-paired case is a no-op', () => {
    const api = store()
    const listId = listOf(api, marker('cosAccContractBooking'))
    billAndHandoff(api, listId)
    const caseId = cosCaseId(api)
    const before = api.getState().billing.ledger[caseId]!.receivable.xeroAccRecId
    const recsBefore = Object.keys(api.getState().xero.accRecs).length

    expect(handoffPair(api, caseId).ok).toBe(true)
    expect(api.getState().billing.ledger[caseId]!.receivable.xeroAccRecId).toBe(before)
    expect(Object.keys(api.getState().xero.accRecs).length).toBe(recsBefore)
  })
})

describe('Xero handoff — pre-payment pre-invoice gets a full pair (D-pre-invoice-pair)', () => {
  it('approving a prepayment hands its case off to a full ACCREC + ACCPAY pair, the payable to the AA Holding account', () => {
    const api = store()
    const rileyBooking = marker('prepaymentBooking')
    expect(approveAllPrepayments(api, rileyBooking, OFFICE)).toHaveLength(1)
    const cases = pairsForBooking(api.getState(), rileyBooking)
    expect(cases.length).toBe(1)
    const c = cases[0]!
    expect(c.kind).toBe('prePayment')
    expect(c.payable?.payee).toEqual({ kind: 'holding' })
    expect(c.receivable.xeroAccRecId).toBeDefined()
    expect(c.payable?.xeroAccPayId).toBeDefined()
    expect(pairStatusLabel(c)).toBe('handedOff')
    // Catch-up Phase 27 (FT-06.3, D38): a DRAFT payable crediting the AA Holding account, never the anaesthetist.
    const accPay = api.getState().xero.accPays[c.payable!.xeroAccPayId!]!
    expect(accPay).toMatchObject({ payeeAccount: 'aaHoldingAccount', status: 'draft', amountPayable: 1380 })
    expect(api.getState().xero.contacts[accPay.contactId]).toMatchObject({ name: 'AA Holding account', contactNumber: 'AA-HOLDING' })
  })
})
