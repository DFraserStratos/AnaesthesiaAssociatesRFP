/**
 * Office-simulation tests (the PWA's stand-in office).
 *
 * Idiom follows `store/billingRun.test.ts`: a fresh unpersisted `createAppStore()`
 * per test, the seeded design-day path staged by hand, and the job wired
 * explicitly and torn down in a `finally`. The only addition is fake timers,
 * because the delay is the whole mechanism: `vi.advanceTimersByTime` is what
 * "the office got to it" looks like from a test.
 *
 * Covered: the trigger fires when enabled and not when disabled; the toggle is
 * read at fire time; the resulting List reaches AUTHORISED + billed with its
 * invoices, cases and Xero mirror; the run is idempotent; teardown cancels a
 * pending run; and every illegitimate state (reset, already authorised, seeded
 * review queue) is a silent no-op.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createAppStore, type BoundAppStore } from '../store/appStore'
import { authoriseList, completeCard, editProcedure, submitList } from '../store/lifecycle'
import { wireBillingRun } from '../store/billingRun'
import { advanceClockMinutes, resetDemo } from '../store/clockActions'
import { clockISO, type Actor } from '../store/mutate'
import { casesForList, invoicesForList, isListBilled, proceduresForCard } from '../store/selectors'
import { ANAE, SEED_LIST_IDS, SEED_MARKERS } from '../domain/seed'
import {
  isOfficeSimulationEnabled,
  setOfficeSimulationEnabled,
  wireOfficeSimulation,
  OFFICE_SIM_COPY,
  OFFICE_SIM_DELAY_MS,
  OFFICE_SIM_STORAGE_KEY,
} from './officeSimulation'

const SOUTER: Actor = {
  who: 'Dr Melanie Souter',
  role: 'anaesthetist',
  source: 'anaesthetist',
  anaesthetistId: ANAE.souter,
}
const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }

/** The office simulation's own audit identity — asserted, so a rename breaks here first. */
const SIMULATED_OFFICE = 'AA office (simulated)'

/** Souter's Tue-21 PM List: DRAFT, one card left to capture (the design-day path). */
const SOUTER_PM = SEED_LIST_IDS.souterPm21
/** A List the SEED ships already SUBMITTED for the Admin review queue. */
const SEEDED_QUEUE_LIST = SEED_LIST_IDS.morrisonMon20

function marker(key: string): string {
  const m = SEED_MARKERS[key]
  if (m === undefined) throw new Error(`missing marker ${key}`)
  return m.entityId
}

function store(): BoundAppStore {
  return createAppStore()
}

/**
 * Do on the phone exactly what the anaesthetist does: advance to 17:20, finish
 * the outstanding Ellison capture, then submit. Every step must succeed, so a
 * seed change surfaces here rather than as a mystery assertion failure below.
 */
function submitAsSouter(api: BoundAppStore): void {
  advanceClockMinutes(api, 9 * 60 + 20)
  const ellison = marker('pendingCaptureCard')
  const procedure = proceduresForCard(api.getState(), ellison)[0]
  if (procedure === undefined) throw new Error('the Ellison card has no procedure')
  const handover = editProcedure(api, SOUTER, procedure.id, { handoverISO: clockISO(api.getState().clock) })
  if (!handover.ok) throw new Error(`handover refused: ${handover.message}`)
  const completed = completeCard(api, SOUTER, ellison)
  if (!completed.ok) throw new Error(`complete refused: ${completed.message}`)
  const submitted = submitList(api, SOUTER, SOUTER_PM)
  if (!submitted.ok) throw new Error(`submit refused: ${submitted.message}`)
}

function authorisersOf(api: BoundAppStore, listId: string): string[] {
  return api
    .getState()
    .audit.filter((a) => a.action === 'list.authorise' && a.entityId === listId)
    .map((a) => a.who)
}

function listState(api: BoundAppStore, listId: string): string | undefined {
  return api.getState().schedule.lists[listId]?.state
}

beforeEach(() => {
  vi.useFakeTimers()
  window.localStorage.clear()
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  window.localStorage.clear()
})

describe('the toggle', () => {
  it('defaults to on when nothing is stored, and round-trips the setting', () => {
    expect(window.localStorage.getItem(OFFICE_SIM_STORAGE_KEY)).toBeNull()
    expect(isOfficeSimulationEnabled()).toBe(true)

    setOfficeSimulationEnabled(false)
    expect(isOfficeSimulationEnabled()).toBe(false)
    setOfficeSimulationEnabled(true)
    expect(isOfficeSimulationEnabled()).toBe(true)
  })

  it('falls back to on when storage is unavailable, and a write never throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage denied (private mode)')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage denied (private mode)')
    })
    expect(isOfficeSimulationEnabled()).toBe(true)
    expect(() => setOfficeSimulationEnabled(false)).not.toThrow()
  })

  it('exports the panel copy, free of en and em dashes', () => {
    expect(OFFICE_SIM_COPY).toBe('Submitted lists are authorised and billed automatically, as the office would.')
    expect(OFFICE_SIM_COPY).not.toMatch(/[–—]/)
  })
})

describe('the trigger', () => {
  it('authorises and bills a live-submitted List once the office delay elapses', () => {
    const api = store()
    const unwireBilling = wireBillingRun(api)
    const unwire = wireOfficeSimulation(api)
    try {
      submitAsSouter(api)
      // Nothing yet: the List is with the office, exactly as it would really be.
      expect(listState(api, SOUTER_PM)).toBe('SUBMITTED')
      expect(invoicesForList(api.getState(), SOUTER_PM)).toHaveLength(0)

      // Not a millisecond early.
      vi.advanceTimersByTime(OFFICE_SIM_DELAY_MS - 1)
      expect(listState(api, SOUTER_PM)).toBe('SUBMITTED')

      vi.advanceTimersByTime(1)
      const state = api.getState()
      expect(listState(api, SOUTER_PM)).toBe('AUTHORISED')
      expect(isListBilled(state.schedule.lists[SOUTER_PM]!)).toBe(true)
      expect(invoicesForList(state, SOUTER_PM)).toHaveLength(4)
      expect(casesForList(state, SOUTER_PM)).toHaveLength(4)
    } finally {
      unwire()
      unwireBilling()
    }
  })

  it('audits the authorise as the simulated office, never as a real person', () => {
    const api = store()
    const unwireBilling = wireBillingRun(api)
    const unwire = wireOfficeSimulation(api)
    try {
      submitAsSouter(api)
      vi.advanceTimersByTime(OFFICE_SIM_DELAY_MS)
      expect(authorisersOf(api, SOUTER_PM)).toEqual([SIMULATED_OFFICE])
      const entry = api.getState().audit.find((a) => a.action === 'list.authorise' && a.entityId === SOUTER_PM)
      expect(entry).toMatchObject({ role: 'office', source: 'office' })
      // The billing run keeps its own system identity; the office only authorised.
      expect(api.getState().audit.filter((a) => a.action === 'list.billed' && a.entityId === SOUTER_PM)).toHaveLength(1)
    } finally {
      unwire()
      unwireBilling()
    }
  })

  it('completes the chain to invoices and the Xero mirror even with no billing run wired', () => {
    const api = store()
    const accRecsBefore = Object.keys(api.getState().xero.accRecs).length
    const unwire = wireOfficeSimulation(api)
    try {
      submitAsSouter(api)
      vi.advanceTimersByTime(OFFICE_SIM_DELAY_MS)
      const state = api.getState()
      expect(isListBilled(state.schedule.lists[SOUTER_PM]!)).toBe(true)
      expect(invoicesForList(state, SOUTER_PM)).toHaveLength(4)
      // handoffListCases ran: every case of the run carries its Xero receivable.
      const cases = casesForList(state, SOUTER_PM)
      expect(cases).toHaveLength(4)
      for (const c of cases) expect(c.accRecId).toBeDefined()
      expect(Object.keys(state.xero.accRecs).length).toBe(accRecsBefore + 4)
    } finally {
      unwire()
    }
  })

  it('leaves the seeded SUBMITTED review queue alone: only a live submit is the office to pick up', () => {
    const api = store()
    const unwireBilling = wireBillingRun(api)
    const unwire = wireOfficeSimulation(api)
    try {
      expect(listState(api, SEEDED_QUEUE_LIST)).toBe('SUBMITTED')
      submitAsSouter(api)
      vi.advanceTimersByTime(OFFICE_SIM_DELAY_MS)
      // The live submit went through; the pre-seeded queue did not move.
      expect(listState(api, SOUTER_PM)).toBe('AUTHORISED')
      expect(listState(api, SEEDED_QUEUE_LIST)).toBe('SUBMITTED')
      expect(isListBilled(api.getState().schedule.lists[SEEDED_QUEUE_LIST]!)).toBe(false)
      expect(invoicesForList(api.getState(), SEEDED_QUEUE_LIST)).toHaveLength(0)
    } finally {
      unwire()
      unwireBilling()
    }
  })
})

describe('the toggle governs the run', () => {
  it('does not fire while the toggle is off: the submitted List simply waits', () => {
    const api = store()
    setOfficeSimulationEnabled(false)
    const unwireBilling = wireBillingRun(api)
    const unwire = wireOfficeSimulation(api)
    try {
      submitAsSouter(api)
      vi.advanceTimersByTime(OFFICE_SIM_DELAY_MS * 5)
      expect(listState(api, SOUTER_PM)).toBe('SUBMITTED')
      expect(isListBilled(api.getState().schedule.lists[SOUTER_PM]!)).toBe(false)
      expect(invoicesForList(api.getState(), SOUTER_PM)).toHaveLength(0)
      expect(authorisersOf(api, SOUTER_PM)).toEqual([])
    } finally {
      unwire()
      unwireBilling()
    }
  })

  it('reads the toggle when the timer fires, not when the job is wired (on, then off)', () => {
    const api = store()
    const unwireBilling = wireBillingRun(api)
    const unwire = wireOfficeSimulation(api)
    try {
      submitAsSouter(api)
      // Wired and submitted while ON; switched off before the office got to it.
      setOfficeSimulationEnabled(false)
      vi.advanceTimersByTime(OFFICE_SIM_DELAY_MS)
      expect(listState(api, SOUTER_PM)).toBe('SUBMITTED')
    } finally {
      unwire()
      unwireBilling()
    }
  })

  it('reads the toggle when the timer fires, not when the job is wired (off, then on)', () => {
    const api = store()
    setOfficeSimulationEnabled(false)
    const unwireBilling = wireBillingRun(api)
    const unwire = wireOfficeSimulation(api)
    try {
      submitAsSouter(api)
      // Switched on after wiring AND after the submit: no reload, still fires.
      setOfficeSimulationEnabled(true)
      vi.advanceTimersByTime(OFFICE_SIM_DELAY_MS)
      expect(listState(api, SOUTER_PM)).toBe('AUTHORISED')
      expect(isListBilled(api.getState().schedule.lists[SOUTER_PM]!)).toBe(true)
    } finally {
      unwire()
      unwireBilling()
    }
  })
})

describe('idempotence and teardown', () => {
  it('wiring twice installs one job: the List is authorised and billed exactly once', () => {
    const api = store()
    const unwireBilling = wireBillingRun(api)
    const first = wireOfficeSimulation(api)
    const second = wireOfficeSimulation(api)
    try {
      expect(second).toBe(first)
      submitAsSouter(api)
      vi.advanceTimersByTime(OFFICE_SIM_DELAY_MS * 3)
      expect(authorisersOf(api, SOUTER_PM)).toEqual([SIMULATED_OFFICE])
      expect(invoicesForList(api.getState(), SOUTER_PM)).toHaveLength(4)
      expect(casesForList(api.getState(), SOUTER_PM)).toHaveLength(4)
      expect(api.getState().audit.filter((a) => a.action === 'list.billed' && a.entityId === SOUTER_PM)).toHaveLength(1)
    } finally {
      first()
      unwireBilling()
    }
  })

  it('re-running the elapsed timers never authorises or bills a second time', () => {
    const api = store()
    const unwireBilling = wireBillingRun(api)
    const unwire = wireOfficeSimulation(api)
    try {
      submitAsSouter(api)
      vi.advanceTimersByTime(OFFICE_SIM_DELAY_MS)
      const invoicesAfterRun = invoicesForList(api.getState(), SOUTER_PM).length
      const auditAfterRun = api.getState().audit.length
      // The billing run itself commits (and so re-notifies every subscriber);
      // nothing it writes may look like a fresh submission.
      vi.advanceTimersByTime(OFFICE_SIM_DELAY_MS * 10)
      expect(invoicesForList(api.getState(), SOUTER_PM)).toHaveLength(invoicesAfterRun)
      expect(api.getState().audit).toHaveLength(auditAfterRun)
      expect(authorisersOf(api, SOUTER_PM)).toEqual([SIMULATED_OFFICE])
    } finally {
      unwire()
      unwireBilling()
    }
  })

  it('unsubscribing cancels a run that has not fired yet', () => {
    const api = store()
    const unwireBilling = wireBillingRun(api)
    const unwire = wireOfficeSimulation(api)
    try {
      submitAsSouter(api)
      unwire()
      vi.advanceTimersByTime(OFFICE_SIM_DELAY_MS * 5)
      expect(listState(api, SOUTER_PM)).toBe('SUBMITTED')
      expect(invoicesForList(api.getState(), SOUTER_PM)).toHaveLength(0)
      expect(authorisersOf(api, SOUTER_PM)).toEqual([])
    } finally {
      unwireBilling()
    }
  })

  it('a store unwired and wired again picks up the next submit', () => {
    const api = store()
    const unwireBilling = wireBillingRun(api)
    wireOfficeSimulation(api)()
    const unwire = wireOfficeSimulation(api)
    try {
      submitAsSouter(api)
      vi.advanceTimersByTime(OFFICE_SIM_DELAY_MS)
      expect(authorisersOf(api, SOUTER_PM)).toEqual([SIMULATED_OFFICE])
    } finally {
      unwire()
      unwireBilling()
    }
  })
})

describe('silent no-ops', () => {
  it('a demo reset before the timer fires leaves the reseeded List alone', () => {
    const api = store()
    const unwireBilling = wireBillingRun(api)
    const unwire = wireOfficeSimulation(api)
    try {
      submitAsSouter(api)
      resetDemo(api)
      expect(() => vi.advanceTimersByTime(OFFICE_SIM_DELAY_MS)).not.toThrow()
      // Back to the pristine seed: DRAFT, mid-capture, nothing billed.
      expect(listState(api, SOUTER_PM)).toBe('DRAFT')
      expect(invoicesForList(api.getState(), SOUTER_PM)).toHaveLength(0)
      expect(authorisersOf(api, SOUTER_PM)).toEqual([])
    } finally {
      unwire()
      unwireBilling()
    }
  })

  it('a List the office already authorised elsewhere is not touched again', () => {
    const api = store()
    const unwireBilling = wireBillingRun(api)
    const unwire = wireOfficeSimulation(api)
    try {
      submitAsSouter(api)
      // Someone in an Admin session got there first, before the timer.
      expect(authoriseList(api, OFFICE, SOUTER_PM).ok).toBe(true)
      expect(() => vi.advanceTimersByTime(OFFICE_SIM_DELAY_MS)).not.toThrow()
      expect(authorisersOf(api, SOUTER_PM)).toEqual(['Kirsty W.'])
      expect(invoicesForList(api.getState(), SOUTER_PM)).toHaveLength(4)
    } finally {
      unwire()
      unwireBilling()
    }
  })
})
