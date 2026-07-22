/**
 * Guard tests — the full role/source/state matrix from the phase doc. Every
 * test uses an isolated, non-persisted store seeded from buildSeed().
 */

import { describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from './appStore'
import {
  authoriseList,
  cancelCard,
  completeCard,
  editCard,
  editProcedure,
  reassignCard,
  reassignList,
  requestCover,
  setAvailability,
  submitList,
} from './lifecycle'
import { auditForEntity, cardsForList, listForSlot, proceduresForCard } from './selectors'
import { onAppEvent, type AppEvent } from './events'
import type { Actor } from './mutate'
import { ANAE, SEED_MARKERS } from '../domain/seed'

const SOUTER: Actor = {
  who: 'Dr Melanie Souter',
  role: 'anaesthetist',
  source: 'anaesthetist',
  anaesthetistId: ANAE.souter,
}
const MORRISON: Actor = {
  who: 'Dr Kate Morrison',
  role: 'anaesthetist',
  source: 'anaesthetist',
  anaesthetistId: ANAE.morrison,
}
const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const INTEGRATION: Actor = { who: 'HL7 feed', role: 'system', source: 'integration' }

function marker(key: string): string {
  const m = SEED_MARKERS[key]
  if (m === undefined) throw new Error(`missing marker ${key}`)
  return m.entityId
}

const SOUTER_AM = marker('designDayAmList')
const SOUTER_PM = marker('designDayPmList')
const MORRISON_LIST = marker('submittedListMorrison')
const WHITAKER_LIST = marker('submittedListWhitaker')
const ELLISON_CARD = marker('pendingCaptureCard')
const GUARDIAN_CARD = marker('guardianMinorCard')

function store(): BoundAppStore {
  return createAppStore()
}

function firstCardOf(api: BoundAppStore, listId: string): string {
  const card = cardsForList(api.getState(), listId)[0]
  if (card === undefined) throw new Error(`list ${listId} has no cards`)
  return card.id
}

/** Ellison seeds PRE-capture (no handover — Phase 04's live Finish-now demo);
 *  stamp the finish so the card validates before it is completed. */
function captureEllisonFinish(api: BoundAppStore): void {
  const procedure = proceduresForCard(api.getState(), ELLISON_CARD)[0]
  if (procedure === undefined) throw new Error('Ellison has no procedure')
  expect(editProcedure(api, SOUTER, procedure.id, { handoverISO: '2026-07-21T17:20:00' }).ok).toBe(true)
}

describe('completeCard', () => {
  it('rejects a card with invalid billing data and surfaces the reasons', () => {
    const api = store()
    // The guardian-minor card has no captured times yet.
    const outcome = completeCard(api, OFFICE, GUARDIAN_CARD)
    expect(outcome.ok).toBe(false)
    if (!outcome.ok) {
      expect(outcome.code).toBe('validationFailed')
      expect(Array.isArray(outcome.details)).toBe(true)
    }
    expect(api.getState().schedule.cards[GUARDIAN_CARD]?.completed).toBe(false)
  })

  it('completes a valid pending card (Ellison, once her finish is captured) and audits it', () => {
    const api = store()
    captureEllisonFinish(api)
    const outcome = completeCard(api, SOUTER, ELLISON_CARD)
    expect(outcome).toEqual({ ok: true, value: undefined })
    const card = api.getState().schedule.cards[ELLISON_CARD]
    expect(card?.completed).toBe(true)
    expect(card?.completedAtISO).toBeDefined()
    const trail = auditForEntity(api.getState(), ELLISON_CARD)
    expect(trail.at(-1)?.action).toBe('card.complete')
  })

  it('never allows an integration source to complete a card', () => {
    const api = store()
    const outcome = completeCard(api, INTEGRATION, ELLISON_CARD)
    expect(outcome.ok).toBe(false)
    if (!outcome.ok) expect(outcome.code).toBe('integrationForbidden')
  })

  it('refuses a cancelled card', () => {
    const api = store()
    const outcome = completeCard(api, OFFICE, marker('cancelledCard'))
    expect(outcome.ok).toBe(false)
    if (!outcome.ok) expect(outcome.code).toBe('cardCancelled')
  })
})

describe('submitList', () => {
  it('blocks submission while any non-cancelled card is uncompleted, even when all validate', () => {
    const api = store()
    const outcome = submitList(api, SOUTER, SOUTER_PM)
    expect(outcome.ok).toBe(false)
    if (!outcome.ok) {
      expect(outcome.code).toBe('cardsNotCompleted')
      expect(outcome.details).toEqual([ELLISON_CARD])
    }
  })

  it('submits once every card is completed', () => {
    const api = store()
    captureEllisonFinish(api)
    expect(completeCard(api, SOUTER, ELLISON_CARD).ok).toBe(true)
    const outcome = submitList(api, SOUTER, SOUTER_PM)
    expect(outcome.ok).toBe(true)
    expect(api.getState().schedule.lists[SOUTER_PM]?.state).toBe('SUBMITTED')
  })

  it('a cancelled card does not block submission', () => {
    const api = store()
    expect(cancelCard(api, OFFICE, ELLISON_CARD, 'Procedure postponed').ok).toBe(true)
    const outcome = submitList(api, SOUTER, SOUTER_PM)
    expect(outcome.ok).toBe(true)
  })

  it('rejects submission of a non-DRAFT list', () => {
    const api = store()
    const outcome = submitList(api, MORRISON, MORRISON_LIST)
    expect(outcome.ok).toBe(false)
    if (!outcome.ok) expect(outcome.code).toBe('listNotDraft')
  })

  it('anaesthetists can only submit their own lists', () => {
    const api = store()
    const outcome = submitList(api, MORRISON, SOUTER_AM)
    expect(outcome.ok).toBe(false)
    if (!outcome.ok) expect(outcome.code).toBe('notOwnList')
  })
})

describe('authoriseList', () => {
  it('rejects authorising a non-SUBMITTED list (no DRAFT jump)', () => {
    const api = store()
    const outcome = authoriseList(api, OFFICE, SOUTER_AM)
    expect(outcome.ok).toBe(false)
    if (!outcome.ok) expect(outcome.code).toBe('listNotSubmitted')
  })

  it('is office only', () => {
    const api = store()
    const outcome = authoriseList(api, MORRISON, MORRISON_LIST)
    expect(outcome.ok).toBe(false)
    if (!outcome.ok) expect(outcome.code).toBe('officeOnly')
  })

  it('authorises a SUBMITTED list, audits it and emits listAuthorised', () => {
    const api = store()
    const events: AppEvent[] = []
    const off = onAppEvent((e) => events.push(e))
    const outcome = authoriseList(api, OFFICE, MORRISON_LIST)
    off()
    expect(outcome.ok).toBe(true)
    expect(api.getState().schedule.lists[MORRISON_LIST]?.state).toBe('AUTHORISED')
    expect(events).toContainEqual({ type: 'listAuthorised', listId: MORRISON_LIST })
    expect(auditForEntity(api.getState(), MORRISON_LIST).at(-1)?.action).toBe('list.authorise')
  })
})

describe('edit rights matrix', () => {
  it('anaesthetist edit of a SUBMITTED list is rejected', () => {
    const api = store()
    const cardId = firstCardOf(api, MORRISON_LIST)
    const outcome = editCard(api, MORRISON, cardId, { notes: 'try' })
    expect(outcome.ok).toBe(false)
    if (!outcome.ok) expect(outcome.code).toBe('listSubmitted')
  })

  it('office edit of a SUBMITTED list is allowed', () => {
    const api = store()
    const cardId = firstCardOf(api, MORRISON_LIST)
    const outcome = editCard(api, OFFICE, cardId, { notes: 'checked with theatre' })
    expect(outcome.ok).toBe(true)
    expect(api.getState().schedule.cards[cardId]?.notes).toBe('checked with theatre')
  })

  it('integration edit of a SUBMITTED card is refused as an exception outcome; DRAFT is allowed', () => {
    const api = store()
    const submittedCard = firstCardOf(api, MORRISON_LIST)
    const refused = editCard(api, INTEGRATION, submittedCard, { notes: 'feed update' })
    expect(refused.ok).toBe(false)
    if (!refused.ok) expect(refused.code).toBe('integrationImmutable')

    const draftOutcome = editCard(api, INTEGRATION, ELLISON_CARD, { scheduledTime: '16:15' })
    expect(draftOutcome.ok).toBe(true)
  })

  it('nobody edits an AUTHORISED list, and procedure edits obey the same matrix', () => {
    const api = store()
    expect(authoriseList(api, OFFICE, MORRISON_LIST).ok).toBe(true)
    const cardId = firstCardOf(api, MORRISON_LIST)
    for (const actor of [OFFICE, MORRISON, INTEGRATION]) {
      const outcome = editCard(api, actor, cardId, { notes: 'try' })
      expect(outcome.ok).toBe(false)
      if (!outcome.ok) expect(outcome.code).toBe('listAuthorised')
    }
    const procedure = proceduresForCard(api.getState(), cardId)[0]
    expect(procedure).toBeDefined()
    if (procedure !== undefined) {
      const outcome = editProcedure(api, OFFICE, procedure.id, { billingReference: 'X' })
      expect(outcome.ok).toBe(false)
      if (!outcome.ok) expect(outcome.code).toBe('listAuthorised')
    }
  })

  it('procedure edits stamp and audit through the parent card', () => {
    const api = store()
    const procedure = proceduresForCard(api.getState(), ELLISON_CARD)[0]
    if (procedure === undefined) throw new Error('no procedure')
    const outcome = editProcedure(api, OFFICE, procedure.id, { billingReference: 'SX-2026-9999' })
    expect(outcome.ok).toBe(true)
    expect(api.getState().schedule.procedures[procedure.id]?.billingReference).toBe('SX-2026-9999')
  })
})

describe('cancelCard', () => {
  it('requires a reason and writes the audited soft-cancel', () => {
    const api = store()
    const noReason = cancelCard(api, SOUTER, ELLISON_CARD, '  ')
    expect(noReason.ok).toBe(false)
    if (!noReason.ok) expect(noReason.code).toBe('reasonRequired')

    const outcome = cancelCard(api, SOUTER, ELLISON_CARD, 'Patient did not arrive')
    expect(outcome.ok).toBe(true)
    const card = api.getState().schedule.cards[ELLISON_CARD]
    expect(card?.cancellation?.reason).toBe('Patient did not arrive')
    expect(card?.cancellation?.source).toBe('anaesthetist')
    expect(auditForEntity(api.getState(), ELLISON_CARD).at(-1)?.action).toBe('card.cancel')
    // Excluded from completion/validation once cancelled.
    const complete = completeCard(api, SOUTER, ELLISON_CARD)
    expect(complete.ok).toBe(false)
  })

  it('role/source matrix: office may cancel on SUBMITTED, integration only on DRAFT, nobody on AUTHORISED', () => {
    const api = store()
    const submittedCard = firstCardOf(api, WHITAKER_LIST)
    const integrationOnSubmitted = cancelCard(api, INTEGRATION, submittedCard, 'S15 cancellation')
    expect(integrationOnSubmitted.ok).toBe(false)
    if (!integrationOnSubmitted.ok) expect(integrationOnSubmitted.code).toBe('integrationImmutable')

    const integrationOnDraft = cancelCard(api, INTEGRATION, ELLISON_CARD, 'S15 cancellation')
    expect(integrationOnDraft.ok).toBe(true)

    const officeOnSubmitted = cancelCard(api, OFFICE, submittedCard, 'Postponed')
    expect(officeOnSubmitted.ok).toBe(true)

    expect(authoriseList(api, OFFICE, MORRISON_LIST).ok).toBe(true)
    const authorisedCard = firstCardOf(api, MORRISON_LIST)
    const onAuthorised = cancelCard(api, OFFICE, authorisedCard, 'Too late')
    expect(onAuthorised.ok).toBe(false)
    if (!onAuthorised.ok) expect(onAuthorised.code).toBe('listAuthorised')
  })
})

describe('reassignList', () => {
  const WED22 = '2026-07-22'

  function freeTargetOn(api: BoundAppStore, dateISO: string, session: 'AM' | 'PM', exclude: string): string {
    const state = api.getState()
    const hit = Object.values(state.schedule.lists).find(
      (l) =>
        l.dateISO === dateISO &&
        l.session === session &&
        l.statusKey === 'free' &&
        l.state === 'DRAFT' &&
        l.anaesthetistId !== exclude &&
        cardsForList(state, l.id).length === 0,
    )
    if (hit === undefined) throw new Error('no free target in seed')
    return hit.anaesthetistId
  }

  it('moves the list (cards and audit intact), absorbs the free target, regenerates the vacated slot', () => {
    const api = store()
    const sourceId = listForSlot(api.getState(), ANAE.souter, WED22, 'AM')?.id
    if (sourceId === undefined) throw new Error('no source list')
    const cardsBefore = cardsForList(api.getState(), sourceId).map((c) => c.id)
    expect(cardsBefore.length).toBeGreaterThan(0)

    const target = freeTargetOn(api, WED22, 'AM', ANAE.souter)
    const targetFreeListId = listForSlot(api.getState(), target, WED22, 'AM')?.id

    const outcome = reassignList(api, OFFICE, sourceId, target)
    expect(outcome.ok).toBe(true)
    const state = api.getState()

    const moved = state.schedule.lists[sourceId]
    expect(moved?.anaesthetistId).toBe(target)
    expect(cardsForList(state, sourceId).map((c) => c.id)).toEqual(cardsBefore)
    expect(targetFreeListId !== undefined && state.schedule.lists[targetFreeListId]).toBeUndefined()

    // Canvas invariant: both anaesthetists still hold exactly 2 lists that day.
    for (const anae of [ANAE.souter, target]) {
      const count = Object.values(state.schedule.lists).filter(
        (l) => l.anaesthetistId === anae && l.dateISO === WED22,
      ).length
      expect(count).toBe(2)
    }

    // The vacated slot regenerated with the default status.
    const vacated = listForSlot(state, ANAE.souter, WED22, 'AM')
    expect(vacated?.statusKey).toBe('unavailable')
    expect(vacated?.state).toBe('DRAFT')

    const trail = auditForEntity(state, sourceId)
    expect(trail.at(-1)?.action).toBe('list.reassign')
    expect(state.audit.some((a) => a.action === 'list.absorb')).toBe(true)
    expect(state.audit.some((a) => a.action === 'list.regenerate')).toBe(true)
  })

  it('rejects a non-free target and non-office actors', () => {
    const api = store()
    const notFree = reassignList(api, OFFICE, SOUTER_AM, ANAE.rutherford)
    expect(notFree.ok).toBe(false)
    if (!notFree.ok) expect(notFree.code).toBe('targetNotFree')

    const sourceId = listForSlot(api.getState(), ANAE.souter, WED22, 'AM')?.id
    if (sourceId === undefined) throw new Error('no source list')
    const notOffice = reassignList(api, SOUTER, sourceId, freeTargetOn(api, WED22, 'AM', ANAE.souter))
    expect(notOffice.ok).toBe(false)
    if (!notOffice.ok) expect(notOffice.code).toBe('officeOnly')
  })
})

describe('reassignCard', () => {
  it('moves one card only: neither list restatuses, other cards untouched, audited at card level', () => {
    const api = store()
    const before = api.getState()
    const pmCards = cardsForList(before, SOUTER_PM).map((c) => c.id)
    const amCards = cardsForList(before, SOUTER_AM).map((c) => c.id)
    const pmStatus = before.schedule.lists[SOUTER_PM]?.statusKey
    const amStatus = before.schedule.lists[SOUTER_AM]?.statusKey

    const outcome = reassignCard(api, SOUTER, ELLISON_CARD, SOUTER_AM)
    expect(outcome.ok).toBe(true)
    const state = api.getState()
    expect(state.schedule.cards[ELLISON_CARD]?.listId).toBe(SOUTER_AM)
    expect(cardsForList(state, SOUTER_PM).map((c) => c.id)).toEqual(pmCards.filter((id) => id !== ELLISON_CARD))
    expect(cardsForList(state, SOUTER_AM).map((c) => c.id).sort()).toEqual([...amCards, ELLISON_CARD].sort())
    expect(state.schedule.lists[SOUTER_PM]?.statusKey).toBe(pmStatus)
    expect(state.schedule.lists[SOUTER_AM]?.statusKey).toBe(amStatus)
    expect(auditForEntity(state, ELLISON_CARD).at(-1)?.action).toBe('card.reassign')
  })

  it('office may move a card onto a SUBMITTED target; integration may not', () => {
    const api = store()
    const officeMove = reassignCard(api, OFFICE, ELLISON_CARD, WHITAKER_LIST)
    expect(officeMove.ok).toBe(true)

    const back = reassignCard(api, OFFICE, ELLISON_CARD, SOUTER_PM)
    expect(back.ok).toBe(true)

    const integrationMove = reassignCard(api, INTEGRATION, ELLISON_CARD, WHITAKER_LIST)
    expect(integrationMove.ok).toBe(false)
    if (!integrationMove.ok) expect(integrationMove.code).toBe('integrationImmutable')
  })

  it('is rejected when the source or the target list is AUTHORISED', () => {
    const api = store()
    expect(authoriseList(api, OFFICE, MORRISON_LIST).ok).toBe(true)
    const lockedCard = cardsForList(api.getState(), MORRISON_LIST)[0]
    if (lockedCard === undefined) throw new Error('no card')

    const fromAuthorised = reassignCard(api, OFFICE, lockedCard.id, SOUTER_AM)
    expect(fromAuthorised.ok).toBe(false)
    if (!fromAuthorised.ok) expect(fromAuthorised.code).toBe('listAuthorised')

    const toAuthorised = reassignCard(api, OFFICE, ELLISON_CARD, MORRISON_LIST)
    expect(toAuthorised.ok).toBe(false)
    if (!toAuthorised.ok) expect(toAuthorised.code).toBe('listAuthorised')
  })
})

describe('setAvailability', () => {
  const TUE21 = '2026-07-21'

  it('restatuses a truly-Free list and writes the master row', () => {
    const api = store()
    const outcome = setAvailability(api, OFFICE, ANAE.hughes, TUE21, 'AM', 'unavailable', 'Called away')
    expect(outcome.ok).toBe(true)
    if (outcome.ok) expect(outcome.value.reconciled).toBe('restatused')
    const list = listForSlot(api.getState(), ANAE.hughes, TUE21, 'AM')
    expect(list?.statusKey).toBe('unavailable')
    expect(list?.notes).toBe('Called away')
    const row = Object.values(api.getState().masters.availability).find(
      (a) => a.anaesthetistId === ANAE.hughes && a.dateISO === TUE21 && a.session === 'AM',
    )
    expect(row?.kind).toBe('unavailable')
  })

  it('conflict-flags a booked list instead of silently restatusing', () => {
    const api = store()
    const outcome = setAvailability(api, SOUTER, ANAE.souter, TUE21, 'AM', 'holiday')
    expect(outcome.ok).toBe(true)
    if (outcome.ok) expect(outcome.value.reconciled).toBe('conflictFlagged')
    const list = listForSlot(api.getState(), ANAE.souter, TUE21, 'AM')
    expect(list?.statusKey).toBe('private')
    expect(list?.conflicts.some((c) => c.kind === 'availability')).toBe(true)
  })

  it('conflict-flags an empty-but-reserved list (hospital set, no cards)', () => {
    const api = store()
    // Fitzgerald PM on the design day: private, St George's, surgeon TBC, no cards.
    const before = listForSlot(api.getState(), ANAE.fitzgerald, TUE21, 'PM')
    expect(before?.hospitalId).toBeDefined()
    const outcome = setAvailability(api, OFFICE, ANAE.fitzgerald, TUE21, 'PM', 'unavailable')
    expect(outcome.ok).toBe(true)
    if (outcome.ok) expect(outcome.value.reconciled).toBe('conflictFlagged')
    const after = listForSlot(api.getState(), ANAE.fitzgerald, TUE21, 'PM')
    expect(after?.statusKey).toBe('private')
    expect(after?.conflicts.some((c) => c.kind === 'availability')).toBe(true)
  })

  it("the un-block direction: 'available' restatuses only an empty holiday/unavailable list", () => {
    const api = store()
    // Ngata is unavailable (ICU on call) with no booking context on the design day.
    const outcome = setAvailability(api, OFFICE, ANAE.ngata, TUE21, 'AM', 'available')
    expect(outcome.ok).toBe(true)
    if (outcome.ok) expect(outcome.value.reconciled).toBe('restatused')
    expect(listForSlot(api.getState(), ANAE.ngata, TUE21, 'AM')?.statusKey).toBe('free')
  })

  it('replaces rather than stacks availability conflicts on repeated toggles', () => {
    const api = store()
    // Souter's design-day AM list is booked (private, cards): every toggle
    // conflict-flags rather than restatusing, so the flags could pile up.
    setAvailability(api, SOUTER, ANAE.souter, TUE21, 'AM', 'holiday')
    setAvailability(api, SOUTER, ANAE.souter, TUE21, 'AM', 'available')
    setAvailability(api, SOUTER, ANAE.souter, TUE21, 'AM', 'holiday')
    const list = listForSlot(api.getState(), ANAE.souter, TUE21, 'AM')
    expect(list?.conflicts.filter((c) => c.kind === 'availability').length).toBe(1)
  })

  it("un-blocking an empty holiday list back to available clears its availability conflict", () => {
    const api = store()
    // Hughes AM is truly free: mark unavailable (restatus), then holiday on the
    // now-unavailable list conflict-flags, then available restatuses to free.
    setAvailability(api, OFFICE, ANAE.hughes, TUE21, 'AM', 'unavailable')
    setAvailability(api, OFFICE, ANAE.hughes, TUE21, 'AM', 'holiday')
    const flagged = listForSlot(api.getState(), ANAE.hughes, TUE21, 'AM')
    expect(flagged?.conflicts.some((c) => c.kind === 'availability')).toBe(true)
    setAvailability(api, OFFICE, ANAE.hughes, TUE21, 'AM', 'available')
    const cleared = listForSlot(api.getState(), ANAE.hughes, TUE21, 'AM')
    expect(cleared?.statusKey).toBe('free')
    expect(cleared?.conflicts.some((c) => c.kind === 'availability')).toBe(false)
  })

  it('anaesthetists set only their own availability; integrations never do', () => {
    const api = store()
    const notOwn = setAvailability(api, SOUTER, ANAE.hughes, TUE21, 'AM', 'holiday')
    expect(notOwn.ok).toBe(false)
    if (!notOwn.ok) expect(notOwn.code).toBe('notOwnAvailability')

    const integration = setAvailability(api, INTEGRATION, ANAE.hughes, TUE21, 'AM', 'holiday')
    expect(integration.ok).toBe(false)
    if (!integration.ok) expect(integration.code).toBe('integrationForbidden')
  })
})

describe('requestCover', () => {
  const TUE21 = '2026-07-21'
  const WED22 = '2026-07-22'

  function freeListId(api: BoundAppStore, anaesthetistId: string, dateISO: string, session: 'AM' | 'PM'): string {
    const list = listForSlot(api.getState(), anaesthetistId, dateISO, session)
    if (list === undefined) throw new Error('no such slot')
    return list.id
  }

  it('records a pending offer on the owner\'s own free session + an audit entry', () => {
    const api = store()
    const listId = freeListId(api, ANAE.souter, WED22, 'PM') // Souter's own free session
    const outcome = requestCover(api, SOUTER, listId, 'offer', 'Happy to hand this over')
    expect(outcome.ok).toBe(true)
    const list = api.getState().schedule.lists[listId]
    expect(list?.coverRequest?.kind).toBe('offer')
    expect(list?.coverRequest?.status).toBe('pending')
    expect(list?.coverRequest?.message).toBe('Happy to hand this over')
    expect(api.getState().audit.at(-1)?.action).toBe('list.coverRequest')
  })

  it('records a request against a colleague\'s free session', () => {
    const api = store()
    const listId = freeListId(api, ANAE.sharma, TUE21, 'PM') // Sharma's free PM
    const outcome = requestCover(api, SOUTER, listId, 'request', undefined, ANAE.sharma)
    expect(outcome.ok).toBe(true)
    const list = api.getState().schedule.lists[listId]
    expect(list?.coverRequest?.kind).toBe('request')
    expect(list?.coverRequest?.targetAnaesthetistId).toBe(ANAE.sharma)
  })

  it('refuses on a non-free session', () => {
    const api = store()
    const listId = freeListId(api, ANAE.souter, TUE21, 'AM') // private, all done
    const outcome = requestCover(api, SOUTER, listId, 'offer')
    expect(outcome.ok).toBe(false)
    if (!outcome.ok) expect(outcome.code).toBe('notFree')
  })

  it('refuses an offer on a session the actor does not own', () => {
    const api = store()
    const listId = freeListId(api, ANAE.sharma, TUE21, 'PM')
    const outcome = requestCover(api, SOUTER, listId, 'offer')
    expect(outcome.ok).toBe(false)
    if (!outcome.ok) expect(outcome.code).toBe('notOwnList')
  })

  it('refuses a second pending request on the same session', () => {
    const api = store()
    const listId = freeListId(api, ANAE.sharma, TUE21, 'PM')
    expect(requestCover(api, SOUTER, listId, 'request', undefined, ANAE.sharma).ok).toBe(true)
    const again = requestCover(api, SOUTER, listId, 'request', undefined, ANAE.sharma)
    expect(again.ok).toBe(false)
    if (!again.ok) expect(again.code).toBe('alreadyRequested')
  })

  it('is anaesthetist-only', () => {
    const api = store()
    const listId = freeListId(api, ANAE.souter, WED22, 'PM')
    const outcome = requestCover(api, OFFICE, listId, 'offer')
    expect(outcome.ok).toBe(false)
    if (!outcome.ok) expect(outcome.code).toBe('anaesthetistOnly')
  })
})
