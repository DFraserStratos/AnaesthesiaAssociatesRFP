/**
 * Post-op addendum tests (Phase 09; B8).
 *
 * The addendum requires an AUTHORISED (locked) original, lands on the original
 * anaesthetist's empty/free DRAFT session for today, leaves the original Card
 * byte-for-byte unchanged, and runs its OWN capture -> submit -> authorise ->
 * bill cycle to a separate invoice. Refused `noOpenSession` when no free, empty
 * session is available.
 */

import { describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from './appStore'
import { authoriseList, completeCard, editProcedure, submitList } from './lifecycle'
import { addPostOpAddendum } from './cardActions'
import { runBillingForList } from './billingRun'
import { prepaymentStatusFor, proceduresForCard } from './selectors'
import type { Actor } from './mutate'
import type { Invoice } from '../domain/types'
import { ANAE, listIdForSlot } from '../domain/seed'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }

function store(): BoundAppStore {
  return createAppStore()
}

const SHARMA_TUE14 = listIdForSlot(ANAE.sharma, '2026-07-14', 'AM')
const SHARMA_TUE21_PM = listIdForSlot(ANAE.sharma, '2026-07-21', 'PM')

function originalOn(api: BoundAppStore, listId: string): string {
  const card = Object.values(api.getState().schedule.cards).find((c) => c.listId === listId)
  if (card === undefined) throw new Error(`no card on ${listId}`)
  return card.id
}

/** Authorise Sharma's Tue 14 list (the original episode). Returns the card id. */
function authoriseOriginal(api: BoundAppStore): string {
  const original = originalOn(api, SHARMA_TUE14)
  expect(submitList(api, OFFICE, SHARMA_TUE14).ok).toBe(true)
  expect(authoriseList(api, OFFICE, SHARMA_TUE14).ok).toBe(true)
  return original
}

describe('addPostOpAddendum', () => {
  it('requires an authorised original', () => {
    const api = store()
    const original = originalOn(api, SHARMA_TUE14) // still DRAFT
    expect(addPostOpAddendum(api, OFFICE, original)).toMatchObject({ ok: false, code: 'notAuthorised' })
  })

  it('lands a linked DRAFT addendum on the anaesthetist free session today; original unchanged', () => {
    const api = store()
    const original = authoriseOriginal(api)
    const before = JSON.parse(JSON.stringify(api.getState().schedule.cards[original])) as unknown

    const outcome = addPostOpAddendum(api, OFFICE, original)
    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return
    const { cardId, listId } = outcome.value

    const addendum = api.getState().schedule.cards[cardId]!
    expect(addendum.cardType).toBe('postOpAddendum')
    expect(addendum.addendumOfCardId).toBe(original)
    expect(addendum.patientId).toBe(api.getState().schedule.cards[original]!.patientId)
    expect(addendum.completed).toBe(false)
    // AM is booked (private, has a hospital); the addendum lands on the free PM.
    expect(listId).toBe(SHARMA_TUE21_PM)
    expect(api.getState().schedule.lists[listId]!.dateISO).toBe('2026-07-21')

    // The original Card is byte-for-byte unchanged (immutability answer).
    expect(api.getState().schedule.cards[original]).toEqual(before)
  })

  it('runs its own cycle to an invoice while the original invoice is untouched', () => {
    const api = store()
    const original = authoriseOriginal(api)
    // Bill the original episode first.
    expect(runBillingForList(api, SHARMA_TUE14).ok).toBe(true)
    const originalInvoicesBefore = Object.values(api.getState().billing.invoices).filter((i) => i.cardId === original)
    expect(originalInvoicesBefore).toHaveLength(1)

    const added = addPostOpAddendum(api, OFFICE, original)
    expect(added.ok).toBe(true)
    if (!added.ok) return
    const { cardId, listId } = added.value

    // Capture the addendum (a post-op pain consult), then run its own cycle.
    const proc = proceduresForCard(api.getState(), cardId)[0]!
    expect(
      editProcedure(api, OFFICE, proc.id, {
        description: 'Acute pain service review, post-op',
        rvgBaseCode: '36561',
        anaestheticStartISO: '2026-07-21T14:00:00',
        handoverISO: '2026-07-21T14:40:00',
        asaClass: 'AS1',
        billingReference: 'PO-2026-0001',
      }).ok,
    ).toBe(true)
    expect(completeCard(api, OFFICE, cardId).ok).toBe(true)
    expect(submitList(api, OFFICE, listId).ok).toBe(true)
    expect(authoriseList(api, OFFICE, listId).ok).toBe(true)
    expect(runBillingForList(api, listId).ok).toBe(true)

    const addendumInvoices = Object.values(api.getState().billing.invoices).filter((i) => i.cardId === cardId)
    expect(addendumInvoices).toHaveLength(1)
    // The original's invoice is untouched.
    const originalInvoicesAfter = Object.values(api.getState().billing.invoices).filter((i) => i.cardId === original)
    expect(originalInvoicesAfter).toHaveLength(1)
    expect(originalInvoicesAfter[0]).toEqual(originalInvoicesBefore[0] as Invoice)
  })

  it('downgrades an inherited selfFundedPrepayment so the addendum is not spuriously gated', () => {
    const api = store()
    // Make the original episode a self-funded PRE-payment procedure, then lock it.
    const original = originalOn(api, SHARMA_TUE14)
    const proc = proceduresForCard(api.getState(), original)[0]!
    expect(
      editProcedure(api, OFFICE, proc.id, {
        billingRoute: 'billableParty',
        patientPaymentCategory: 'selfFundedPrepayment',
        prepaymentDetail: { type: 'full' },
      }).ok,
    ).toBe(true)
    expect(submitList(api, OFFICE, SHARMA_TUE14).ok).toBe(true)
    expect(authoriseList(api, OFFICE, SHARMA_TUE14).ok).toBe(true)

    const added = addPostOpAddendum(api, OFFICE, original)
    expect(added.ok).toBe(true)
    if (!added.ok) return
    const addendumProc = proceduresForCard(api.getState(), added.value.cardId)[0]!
    // Inherited the payer/route, but the category downgraded (a post-op event is
    // never itself pre-paid) and no prepaymentDetail carried over.
    expect(addendumProc.billingRoute).toBe('billableParty')
    expect(addendumProc.patientPaymentCategory).toBe('selfFundedPostProcedure')
    expect(addendumProc.prepaymentDetail).toBeUndefined()
    expect(prepaymentStatusFor(api.getState(), added.value.cardId)).toBe('none')
  })

  it('refuses noOpenSession when no free, empty session is available today', () => {
    const api = store()
    const original = authoriseOriginal(api)
    // First addendum takes the only free session (Sharma Tue 21 PM).
    expect(addPostOpAddendum(api, OFFICE, original).ok).toBe(true)
    // A second has nowhere to land (AM is booked, PM now holds the first addendum).
    expect(addPostOpAddendum(api, OFFICE, original)).toMatchObject({ ok: false, code: 'noOpenSession' })
  })
})
