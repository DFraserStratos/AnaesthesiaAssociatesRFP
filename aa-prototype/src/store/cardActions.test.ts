/**
 * Card-creation guard tests (Phase 03) — createCard dedupe + refusal matrix,
 * copyCard linkage + additional-procedure flagging + refusal matrix. Every test
 * uses an isolated, non-persisted store seeded from buildSeed().
 */

import { describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from './appStore'
import { createCard, copyCard } from './cardActions'
import { authoriseList, submitList } from './lifecycle'
import { cardsForList, proceduresForCard } from './selectors'
import type { Actor } from './mutate'
import { ANAE, PAT, SEED_MARKERS } from '../domain/seed'

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

function marker(key: string): string {
  const m = SEED_MARKERS[key]
  if (m === undefined) throw new Error(`missing marker ${key}`)
  return m.entityId
}

const SOUTER_PM = marker('designDayPmList')
const MORRISON_LIST = marker('submittedListMorrison')
const ELLISON_CARD = marker('pendingCaptureCard')

function store(): BoundAppStore {
  return createAppStore()
}

describe('createCard', () => {
  it('creates a Card + first Procedure on a DRAFT list, provisionally for a no-NHI patient', () => {
    const api = store()
    const patientsBefore = Object.keys(api.getState().masters.patients).length
    const cardsBefore = cardsForList(api.getState(), SOUTER_PM).length

    const outcome = createCard(api, SOUTER, SOUTER_PM, {
      patient: { name: 'Ad Hoc Patient', dobISO: '1990-05-05' },
      operation: 'Diagnostic laparoscopy',
      rvgBaseCode: '20941',
      billingRoute: 'hospital',
      scheduledTime: '17:00',
    })

    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return
    const state = api.getState()
    // A new provisional patient row was created (no NHI to match).
    expect(Object.keys(state.masters.patients).length).toBe(patientsBefore + 1)
    expect(cardsForList(state, SOUTER_PM).length).toBe(cardsBefore + 1)

    const card = state.schedule.cards[outcome.value.cardId]
    expect(card?.patientId).toBe(outcome.value.patientId)
    expect(card?.completed).toBe(false)
    const procs = proceduresForCard(state, outcome.value.cardId)
    expect(procs).toHaveLength(1)
    expect(procs[0]?.isAdditional).toBe(false)
    expect(procs[0]?.billingRoute).toBe('hospital')

    const actions = state.audit.map((a) => a.action)
    expect(actions).toContain('card.create')
    expect(actions).toContain('procedure.create')
  })

  it('reuses an existing patient by NHI (dedupe) rather than creating a duplicate', () => {
    const api = store()
    const patientsBefore = Object.keys(api.getState().masters.patients).length

    const outcome = createCard(api, SOUTER, SOUTER_PM, {
      patient: { nhi: 'cqy9304', name: 'Sarah Mitchell', dobISO: '1988-04-12' },
      operation: 'Laparoscopic cholecystectomy',
      rvgBaseCode: '20941',
      billingRoute: 'hospital',
    })

    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return
    // No new patient row — the seeded Sarah Mitchell (PT0005) is reused.
    expect(Object.keys(api.getState().masters.patients).length).toBe(patientsBefore)
    expect(outcome.value.patientId).toBe(PAT.mitchell)
  })

  it('surfaces an invalid NHI verbatim and creates nothing', () => {
    const api = store()
    const cardsBefore = Object.keys(api.getState().schedule.cards).length
    const outcome = createCard(api, SOUTER, SOUTER_PM, {
      patient: { nhi: 'AAA9999', name: 'Bad NHI', dobISO: '1990-01-01' },
      operation: 'Test',
      billingRoute: 'hospital',
    })
    expect(outcome.ok).toBe(false)
    if (!outcome.ok) expect(outcome.code).toBe('invalidNhi')
    expect(Object.keys(api.getState().schedule.cards).length).toBe(cardsBefore)
  })

  it('refuses on a SUBMITTED list for the anaesthetist', () => {
    const api = store()
    const outcome = createCard(api, MORRISON, MORRISON_LIST, {
      patient: { name: 'X', dobISO: '1990-01-01' },
      operation: 'Test',
      billingRoute: 'hospital',
    })
    expect(outcome.ok).toBe(false)
    if (!outcome.ok) expect(outcome.code).toBe('listSubmitted')
  })

  it('refuses a non-owned list', () => {
    const api = store()
    const outcome = createCard(api, SOUTER, MORRISON_LIST, {
      patient: { name: 'X', dobISO: '1990-01-01' },
      operation: 'Test',
      billingRoute: 'hospital',
    })
    expect(outcome.ok).toBe(false)
    if (!outcome.ok) expect(outcome.code).toBe('notOwnList')
  })

  it('refuses on an AUTHORISED list', () => {
    const api = store()
    // Authorise the Morrison SUBMITTED list first.
    expect(authoriseList(api, OFFICE, MORRISON_LIST).ok).toBe(true)
    const outcome = createCard(api, OFFICE, MORRISON_LIST, {
      patient: { name: 'X', dobISO: '1990-01-01' },
      operation: 'Test',
      billingRoute: 'hospital',
    })
    expect(outcome.ok).toBe(false)
    if (!outcome.ok) expect(outcome.code).toBe('listAuthorised')
  })
})

describe('copyCard', () => {
  it('lands a linked skeleton card in the same list with an additional procedure', () => {
    const api = store()
    const outcome = copyCard(api, SOUTER, ELLISON_CARD)
    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return

    const state = api.getState()
    const source = state.schedule.cards[ELLISON_CARD]
    const copy = state.schedule.cards[outcome.value.cardId]
    expect(copy?.copiedFromCardId).toBe(ELLISON_CARD)
    expect(copy?.listId).toBe(source?.listId)
    expect(copy?.patientId).toBe(source?.patientId)
    expect(copy?.completed).toBe(false)
    expect(copy?.attachments).toHaveLength(0)

    const procs = proceduresForCard(state, outcome.value.cardId)
    expect(procs).toHaveLength(1)
    expect(procs[0]?.isAdditional).toBe(true)
    // Funding context inherited from the source's first procedure (hospital).
    expect(procs[0]?.billingRoute).toBe('hospital')

    const actions = state.audit.map((a) => a.action)
    expect(actions).toContain('card.copy')
  })

  it('refuses copying a card on a SUBMITTED list for the anaesthetist', () => {
    const api = store()
    const morrisonCard = cardsForList(api.getState(), MORRISON_LIST)[0]
    expect(morrisonCard).toBeDefined()
    const outcome = copyCard(api, MORRISON, morrisonCard!.id)
    expect(outcome.ok).toBe(false)
    if (!outcome.ok) expect(outcome.code).toBe('listSubmitted')
  })

  it('the office can copy a card on a SUBMITTED list', () => {
    const api = store()
    const morrisonCard = cardsForList(api.getState(), MORRISON_LIST).find((c) => c.cancellation === undefined)
    expect(morrisonCard).toBeDefined()
    const outcome = copyCard(api, OFFICE, morrisonCard!.id)
    expect(outcome.ok).toBe(true)
  })

  it('submitting the copy list is blocked until the new additional card is completed', () => {
    // Copy adds an incomplete card; the completion-gated submit must refuse.
    const api = store()
    // Souter AM list is all-complete DRAFT — copy one card there.
    const amList = marker('designDayAmList')
    const src = cardsForList(api.getState(), amList)[0]
    expect(src).toBeDefined()
    expect(copyCard(api, SOUTER, src!.id).ok).toBe(true)
    const outcome = submitList(api, SOUTER, amList)
    expect(outcome.ok).toBe(false)
    if (!outcome.ok) expect(outcome.code).toBe('cardsNotCompleted')
  })
})
