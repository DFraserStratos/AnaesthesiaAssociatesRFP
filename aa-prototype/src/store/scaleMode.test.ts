/**
 * Installing and leaving full scale (catch-up Phase 43; US-15.0.4): the load,
 * paused saving, Reset back to the pristine seed, a reload, the clock at scale
 * and a runtime Booking after the load.
 */

import { afterEach, describe, expect, it, vi } from 'vitest'
import { createAppStore, freshAppState, PERSIST_KEY, type BoundAppStore } from './appStore'
import { loadFullScaleData, loadFullScaleRefusal, FULL_SCALE_LOADED_MESSAGE, FULL_SCALE_GENERATING_MESSAGE } from './fullScaleActions'
import { clearScaleMode, scaleMode } from './scaleMode'
import { resetDomainState } from './mutate'
import { flushPersist, persistStatus, resumePersist } from './persistStorage'
import { advanceClockDays } from './clockActions'
import { createBooking } from './bookingActions'
import { proceduresForBooking } from './selectors'
import { contractCandidatesFor } from '../domain/billing/contractRail'
import { RVG_GROUP, SEED_MARKERS } from '../domain/seed'
import type { Actor } from './mutate'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const SYNC = (cb: () => void) => cb()

async function loadInto(api: BoundAppStore): Promise<void> {
  await new Promise<void>((resolve) => {
    const res = loadFullScaleData(api, { frame: SYNC, onDone: resolve })
    expect(res.ok).toBe(true)
  })
}

afterEach(() => {
  clearScaleMode()
  resumePersist()
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('loading full-scale data', () => {
  it('loads, pauses saving and drops the saved payload; Reset returns the pristine seed with saving resumed and one write', async () => {
    const api = createAppStore({ persisted: true })
    api.getState().nextSuggestionSeq()
    flushPersist()
    expect(localStorage.getItem(PERSIST_KEY)).not.toBeNull()

    await loadInto(api)
    const loaded = scaleMode()
    expect(loaded.mode).toBe('fullScale')
    expect(loaded.counts?.anaesthetists).toBe(85)
    expect(Object.keys(api.getState().masters.anaesthetists)).toHaveLength(85)
    expect(persistStatus().paused).toBe(true)
    expect(localStorage.getItem(PERSIST_KEY)).toBeNull()
    expect(api.getState().audit.at(-1)?.action).toBe('demo.fullScaleLoaded')
    expect(loadFullScaleRefusal()).toBe(FULL_SCALE_LOADED_MESSAGE)

    const write = vi.spyOn(Storage.prototype, 'setItem')
    resetDomainState(api)
    flushPersist()
    expect(scaleMode().mode).toBe('demo')
    expect(scaleMode().counts).toBeNull()
    expect(persistStatus().paused).toBe(false)
    expect(write.mock.calls.filter(([key]) => key === PERSIST_KEY)).toHaveLength(1)
    const pristine = freshAppState()
    const state = api.getState()
    expect(Object.keys(state.masters.anaesthetists)).toEqual(Object.keys(pristine.masters.anaesthetists))
    expect(Object.keys(state.billing.invoices).length).toBe(Object.keys(pristine.billing.invoices).length)
    expect(Object.keys(state.schedule.slots).length).toBe(Object.keys(pristine.schedule.slots).length)
  }, 120_000)

  it('a reload after a load hydrates the pristine seed', async () => {
    const api = createAppStore({ persisted: true })
    await loadInto(api)
    flushPersist()
    // A reload: a fresh store over the same storage.
    resumePersist()
    const reloaded = createAppStore({ persisted: true })
    expect(Object.keys(reloaded.getState().masters.anaesthetists)).toHaveLength(14)
  }, 120_000)

  it('a Reset while generating wins: the pending load never installs (review fix)', async () => {
    const api = createAppStore()
    const done = new Promise<void>((resolve) => {
      loadFullScaleData(api, { frame: SYNC, onDone: resolve })
    })
    // The load has reset and set "generating", and waits on the dynamic import: Reset now.
    resetDomainState(api)
    await done
    expect(scaleMode().mode).toBe('demo')
    expect(Object.keys(api.getState().masters.anaesthetists)).toHaveLength(14)
    expect(persistStatus().paused).toBe(false)
  }, 120_000)

  it('refuses a second load while generating', () => {
    const api = createAppStore()
    const res = loadFullScaleData(api, { frame: () => {} })
    expect(res.ok).toBe(true)
    expect(scaleMode().mode).toBe('generating')
    expect(loadFullScaleRefusal()).toBe(FULL_SCALE_GENERATING_MESSAGE)
    const again = loadFullScaleData(api, { frame: () => {} })
    expect(again.ok).toBe(false)
  })

  it('the clock keeps working at scale: Next day adds a session pair per anaesthetist', async () => {
    const api = createAppStore()
    await loadInto(api)
    const before = Object.keys(api.getState().schedule.slots).length
    advanceClockDays(api, 1)
    // 84 active of the 85: Dr Reeves left on 20 Nov (Phase 52), so the new day has no session of his.
    expect(Object.keys(api.getState().schedule.slots).length - before).toBe(168)
  }, 120_000)

  it('a Booking created after the load gets an unused id and the same Contract candidates as at demo scale', async () => {
    const listId = SEED_MARKERS['designDayPmList']!.entityId
    const input = { patient: { name: 'Scale Check', dobISO: '1990-09-08', nhi: 'ZZZ0016' }, sourceText: { text: 'Diagnostic laparoscopy', source: 'phone' as const }, rvgGroupId: RVG_GROUP.a3!, scheduledTime: '17:00' }
    const demo = createAppStore()
    const demoOut = createBooking(demo, OFFICE, listId, input)
    expect(demoOut.ok).toBe(true)

    const api = createAppStore()
    await loadInto(api)
    const existing = new Set(Object.keys(api.getState().schedule.bookings))
    const out = createBooking(api, OFFICE, listId, input)
    expect(out.ok).toBe(true)
    if (!out.ok || !demoOut.ok) return
    expect(existing.has(out.value.bookingId)).toBe(false)
    const candidates = (store: BoundAppStore) => {
      const s = store.getState()
      const list = s.schedule.lists[listId]!
      return contractCandidatesFor(
        { contracts: s.masters.contracts, parties: s.masters.parties, fundingTags: s.masters.fundingTags, rvgGroups: s.masters.rvgGroups, surgeons: s.masters.surgeons },
        { listDateISO: list.dateISO, hospitalId: list.hospitalId, surgeonId: list.surgeonId, ...(list.anaesthetistId !== undefined ? { anaesthetistId: list.anaesthetistId } : {}) },
      ).map((c) => c.id)
    }
    // The generated Contracts are linked to generated surgeons and Parties, so a cast List sees no new candidate
    // except an unlinked insurer's, which fits everywhere.
    const demoIds = candidates(demo)
    const fullIds = candidates(api).filter((id) => !id.startsWith('CT-FS-'))
    expect(fullIds).toEqual(demoIds)
    expect(proceduresForBooking(api.getState(), out.value.bookingId).length).toBe(1)
  }, 120_000)
})
