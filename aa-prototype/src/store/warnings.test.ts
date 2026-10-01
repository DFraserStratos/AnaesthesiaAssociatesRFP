/**
 * Warnings in the store (catch-up Phase 15a): clearances, selectors, the seed
 * and persistence. Clearances are office only, audited, keyed by warning,
 * re-open at a higher strength, never touch the Booking, and reset empties them.
 */

import { describe, expect, it } from 'vitest'
import { backfillMerge, createAppStore, freshAppState, type BoundAppStore } from './appStore'
import { authoriseList, completeBooking, submitList } from './lifecycle'
import { resetDomainState, type Actor } from './mutate'
import { bookingsForList } from './selectors'
import {
  clearWarning,
  openWarnings,
  warningsForBooking,
  warningsForList,
  warningSummaryByList,
} from './warnings'
import { buildSeed, SEED_MARKERS } from '../domain/seed'
import { WARNING_RULES, warningKey, type WarningRule, type WarningStrength } from '../domain/warnings'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const SOUTER: Actor = { who: 'Dr Melanie Souter', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: '34821' }

const RILEY = SEED_MARKERS['prepaymentBooking']!.entityId
const RILEY_KEY = warningKey(RILEY, 'prepaymentUnpaid')

function store(): BoundAppStore {
  return createAppStore()
}

describe('the seed', () => {
  it('two builds deep-equal; app settings hold every rule; clearances are empty', () => {
    expect(buildSeed()).toEqual(buildSeed())
    const s = freshAppState()
    for (const rule of WARNING_RULES) expect(s.appSettings.warningRules[rule.id]?.active).toBe(true)
    expect(s.schedule.warningClearances).toEqual({})
  })

  it('Annette Riley raises exactly one warning on the pristine seed', () => {
    const api = store()
    expect(warningsForBooking(api.getState(), RILEY)).toHaveLength(1)
    expect(openWarnings(api.getState()).filter((r) => r.bookingId === RILEY)).toHaveLength(1)
  })

  it('every open warning on the pristine seed is a known scenario', () => {
    const rows = openWarnings(freshAppState())
    expect(rows.map((r) => r.bookingId)).toEqual([RILEY])
  })
})

describe('selectors', () => {
  it('warningsForList and warningSummaryByList agree on Riley’s List', () => {
    const api = store()
    const state = api.getState()
    const list = state.schedule.lists[state.schedule.bookings[RILEY]!.listId]!
    expect(warningsForList(state, list.id).map((w) => w.key)).toEqual([RILEY_KEY])
    expect(warningSummaryByList(state, list.dateISO).get(list.id)).toEqual({ open: 1, strongest: 'strong' })
    expect(warningSummaryByList(state, '2026-07-21').has(list.id)).toBe(false)
  })
})

describe('clearWarning', () => {
  it('the office clears: the warning leaves the to-do list, stays visible as cleared, and is audited', () => {
    const api = store()
    const auditBefore = api.getState().audit.length
    expect(clearWarning(api, OFFICE, RILEY, RILEY_KEY)).toMatchObject({ ok: true })
    const state = api.getState()
    expect(openWarnings(state).some((r) => r.bookingId === RILEY)).toBe(false)
    const [w] = warningsForBooking(state, RILEY)
    expect(w?.clearance).toMatchObject({ by: 'Kirsty W.', role: 'office', strength: 'strong' })
    expect(state.audit).toHaveLength(auditBefore + 1)
    expect(state.audit.at(-1)).toMatchObject({ action: 'booking.warningCleared', entityType: 'booking', entityId: RILEY })
  })

  it('refuses the anaesthetist, a re-clear, and an unknown key', () => {
    const api = store()
    expect(clearWarning(api, SOUTER, RILEY, RILEY_KEY)).toMatchObject({ ok: false, code: 'officeOnly' })
    expect(clearWarning(api, OFFICE, RILEY, `${RILEY}:nope`)).toMatchObject({ ok: false, code: 'notFound' })
    expect(clearWarning(api, OFFICE, RILEY, RILEY_KEY).ok).toBe(true)
    expect(clearWarning(api, OFFICE, RILEY, RILEY_KEY)).toMatchObject({ ok: false, code: 'alreadyCleared' })
  })

  it('a clearance re-opens when the warning strengthens', () => {
    let strength: WarningStrength = 'mild'
    const escalating: WarningRule = {
      id: 'prepaymentUnpaid',
      label: 'test',
      defaultParams: {},
      evaluate: (f) => (f.booking.id === RILEY ? [{ kind: 'beforeProcedure', strength, text: 'Escalating.' }] : []),
    }
    const rules = [escalating]
    const api = store()
    expect(clearWarning(api, OFFICE, RILEY, RILEY_KEY, rules).ok).toBe(true)
    expect(openWarnings(api.getState(), rules)).toEqual([])
    strength = 'strong'
    expect(openWarnings(api.getState(), rules).map((r) => r.warning.key)).toEqual([RILEY_KEY])
    expect(clearWarning(api, OFFICE, RILEY, RILEY_KEY, rules).ok).toBe(true)
    expect(openWarnings(api.getState(), rules)).toEqual([])
  })

  it('works on an AUTHORISED List and leaves the Booking record untouched', () => {
    const api = store()
    const listId = api.getState().schedule.bookings[RILEY]!.listId
    for (const b of bookingsForList(api.getState(), listId)) {
      if (!b.completed && b.cancellation === undefined) expect(completeBooking(api, SOUTER, b.id).ok).toBe(true)
    }
    expect(submitList(api, SOUTER, listId).ok).toBe(true)
    expect(authoriseList(api, OFFICE, listId).ok).toBe(true)
    const before = api.getState().schedule.bookings[RILEY]
    expect(clearWarning(api, OFFICE, RILEY, RILEY_KEY).ok).toBe(true)
    const after = api.getState().schedule.bookings[RILEY]
    expect(after).toBe(before)
    expect(after?.lastModifiedBy).toBe(before?.lastModifiedBy)
  })

  it('reset empties the clearances', () => {
    const api = store()
    expect(clearWarning(api, OFFICE, RILEY, RILEY_KEY).ok).toBe(true)
    resetDomainState(api)
    expect(api.getState().schedule.warningClearances).toEqual({})
    expect(openWarnings(api.getState()).some((r) => r.bookingId === RILEY)).toBe(true)
  })
})

describe('persistence', () => {
  it('backfills a rule entry missing from a persisted app-settings record, keeping persisted entries', () => {
    const current = createAppStore().getState()
    const merged = backfillMerge(current, { appSettings: { warningRules: {} } })
    expect(merged.appSettings.warningRules.prepaymentUnpaid).toEqual({ active: true, params: {} })
    const kept = backfillMerge(current, { appSettings: { warningRules: { prepaymentUnpaid: { active: false, params: {} } } } })
    expect(kept.appSettings.warningRules.prepaymentUnpaid?.active).toBe(false)
  })
})
