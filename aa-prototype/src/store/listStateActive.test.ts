/**
 * DRAFT becomes ACTIVE (catch-up Phase 15b; RV-36, EP-07, FT-07.1): a rename
 * with no behaviour change. The seed's Lists carry only the three states, an
 * assigned List runs ACTIVE → SUBMITTED → AUTHORISED exactly as before, the
 * refusal code is `listNotActive`, and the screens print the state from one
 * label map. Since Phase 28 an empty session is a Slot with no List, so it
 * carries no state at all.
 */

import { describe, expect, it } from 'vitest'
import { createAppStore } from './appStore'
import { authoriseList, editBooking, submitList } from './lifecycle'
import { bookingsForList } from './selectors'
import { OFFICE_ACTOR, SOUTER_ACTOR } from './demoActors'
import { buildSeed, SEED_LIST_IDS } from '../domain/seed'
import { LIST_STATE_LABELS } from '../shared/format'
import type { ListState } from '../domain/types'

const STATES: readonly ListState[] = ['ACTIVE', 'SUBMITTED', 'AUTHORISED']

describe('the seed', () => {
  it('stamps every List with an anaesthetist ACTIVE, SUBMITTED or AUTHORISED, and only a Draft List DRAFT (catch-up Phase 31)', () => {
    const lists = Object.values(buildSeed().schedule.lists)
    expect(lists.length).toBeGreaterThan(1000)
    for (const l of lists) {
      if (l.anaesthetistId === undefined) expect(l.state, l.id).toBe('DRAFT')
      else expect(STATES, l.id).toContain(l.state)
    }
  })
})

describe('the lifecycle under its new name', () => {
  it('an assigned List is ACTIVE: the anaesthetist edits and submits it, the office authorises it', () => {
    const api = createAppStore()
    const listId = SEED_LIST_IDS.souterAm21
    expect(api.getState().schedule.lists[listId]?.state).toBe('ACTIVE')

    const booking = bookingsForList(api.getState(), listId)[0]!
    expect(editBooking(api, SOUTER_ACTOR, booking.id, { notes: 'Checked before submit.' }).ok).toBe(true)
    expect(submitList(api, SOUTER_ACTOR, listId).ok).toBe(true)
    expect(api.getState().schedule.lists[listId]?.state).toBe('SUBMITTED')
    const submit = api.getState().audit.filter((a) => a.entityId === listId && a.action === 'list.submit').at(-1)
    expect(submit?.before).toMatchObject({ state: 'ACTIVE' })

    // Submitting strips the anaesthetist's edit rights, as before.
    expect(editBooking(api, SOUTER_ACTOR, booking.id, { notes: 'Too late.' }).ok).toBe(false)

    const again = submitList(api, SOUTER_ACTOR, listId)
    expect(again.ok).toBe(false)
    if (!again.ok) {
      expect(again.code).toBe('listNotActive')
      expect(again.message).toBe('Only an active List can be submitted.')
    }

    expect(authoriseList(api, OFFICE_ACTOR, listId).ok).toBe(true)
    expect(api.getState().schedule.lists[listId]?.state).toBe('AUTHORISED')
  })
})

describe('the List state label', () => {
  it('prints the catalogue names, one per state in the union', () => {
    expect(LIST_STATE_LABELS).toEqual({ DRAFT: 'DRAFT', ACTIVE: 'ACTIVE', SUBMITTED: 'SUBMITTED', AUTHORISED: 'AUTHORISED' })
  })
})

describe('an empty session carries no state (catch-up Phase 28)', () => {
  it('a free session is a Slot with no List, so it has no state to print', () => {
    const api = createAppStore()
    const state = api.getState()
    const occupied = new Set(Object.values(state.schedule.lists).map((l) => l.slotId))
    const empty = Object.values(state.schedule.slots).filter((s) => !occupied.has(s.id))
    expect(empty.length).toBeGreaterThan(0)
    for (const slot of empty.slice(0, 50)) expect('state' in slot).toBe(false)
  })
})
