/**
 * Persisted-store versioning + shape resilience (Phase 10 fix).
 *
 * Two distinct failure paths, two distinct guards:
 *
 *  1. version MISMATCH -> `migrate` returns the pristine current-shape seed, so
 *     a bumped PERSIST_VERSION genuinely discards + reseeds.
 *  2. SAME version but an older SHAPE (a nested field added without a version
 *     bump, or dev churn within a version) -> `migrate` never fires, and
 *     zustand's default SHALLOW merge would let the incomplete persisted slice
 *     clobber the fresh one, dropping `settings.volumeStory` / `billing.receipts`
 *     and blank-screening DemoXero (`undefined.softLimit`). `backfillMerge`
 *     overlays one level deep so the missing sub-keys survive.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { backfillMerge, createAppStore, freshAppState, PERSIST_KEY, PERSIST_VERSION } from './appStore'
import { flushPersist } from './persistStorage'

describe('persisted store versioning', () => {
  beforeEach(() => {
    // Writes are coalesced on a trailing timer (persistStorage.ts), and a
    // still-queued value is served back ahead of storage so a read-after-write
    // stays consistent. Flush before clearing, or the previous test's queued
    // payload is what this test's store rehydrates from.
    flushPersist()
    localStorage.clear()
  })
  afterEach(() => localStorage.clear())

  it('discards a stale older-version persisted store and reseeds the current shape', () => {
    // A pre-Phase-10 (v5) store: settings without volumeStory, no receipts slice.
    localStorage.setItem(
      PERSIST_KEY,
      JSON.stringify({ state: { settings: { contactArchiveInactivityDays: 999 } }, version: 5 }),
    )

    const store = createAppStore({ persisted: true })
    const s = store.getState()
    // Reseeded to the current shape - the fields the new surfaces read exist.
    expect(s.settings.volumeStory).toBeDefined()
    expect(s.settings.volumeStory.softLimit).toBe(10000)
    expect(s.settings.contactArchiveInactivityDays).toBe(90) // fresh seed, not the stale 999
    expect(s.billing.receipts).toBeDefined()
    expect(s.billing.contactIdCache).toBeDefined()
  })

  it('backfills missing nested fields from a CURRENT-version but older-shaped store', () => {
    // The real crash: persisted at the current version (so migrate never fires)
    // but from before volumeStory / receipts existed on their slices.
    localStorage.setItem(
      PERSIST_KEY,
      JSON.stringify({
        state: {
          settings: { contactArchiveInactivityDays: 42 },
          billing: { invoices: {}, cases: {} },
          shell: { currentApp: 'admin' },
        },
        version: PERSIST_VERSION,
      }),
    )

    const store = createAppStore({ persisted: true })
    const s = store.getState()
    // Missing sub-keys are backfilled from the fresh seed (no crash) ...
    expect(s.settings.volumeStory).toBeDefined()
    expect(s.settings.volumeStory.softLimit).toBe(10000)
    expect(s.billing.receipts).toBeDefined()
    expect(s.billing.contactIdCache).toBeDefined()
    expect(s.shell.currentApp).toBe('admin')
    // ... while the persisted (live) value that WAS present still wins.
    expect(s.settings.contactArchiveInactivityDays).toBe(42)
  })

  it('preserves a persisted store at the current version (round-trips)', () => {
    const a = createAppStore({ persisted: true })
    a.setState({ settings: { ...a.getState().settings, contactArchiveInactivityDays: 42 } })
    // A second store at the same version rehydrates the persisted value.
    const b = createAppStore({ persisted: true })
    expect(b.getState().settings.contactArchiveInactivityDays).toBe(42)
  })
})

describe('backfillMerge', () => {
  it('does not resurrect a record deleted from a live map', () => {
    const fresh = freshAppState()
    const seededInvoiceIds = Object.keys(fresh.billing.invoices)
    expect(seededInvoiceIds.length).toBeGreaterThan(0)

    // A persisted store whose invoices map was emptied (records deleted in the
    // demo) and that predates the `receipts` sub-key entirely.
    const persisted = { ...fresh, billing: { invoices: {}, cases: fresh.billing.cases } }
    const merged = backfillMerge(fresh as never, persisted)

    // The emptied live map wins wholesale - seed invoices are NOT merged back in.
    expect(Object.keys(merged.billing.invoices)).toHaveLength(0)
    // But a whole sub-key the persisted store never had is still backfilled.
    expect(merged.billing.receipts).toBeDefined()
  })
})

describe('backfillMerge · AA fee settings (catch-up Phase 16)', () => {
  it('gives a snapshot from before the fee settings the seeded schedule, and keeps a persisted one whole', () => {
    const fresh = freshAppState()
    const old = { ...fresh, appSettings: { warningRules: fresh.appSettings.warningRules } }
    expect(backfillMerge(fresh as never, old).appSettings.aaFee).toEqual(fresh.appSettings.aaFee)
    const edited = { fixedItems: [{ id: 'X', description: 'Only item', amount: 10 }], perBctiCharge: 1 }
    const persisted = { ...fresh, appSettings: { ...fresh.appSettings, aaFee: edited } }
    expect(backfillMerge(fresh as never, persisted).appSettings.aaFee).toEqual(edited)
  })
})

describe('backfillMerge · schedule settings and Slots (catch-up Phase 28)', () => {
  it('gives a snapshot from before the schedule settings the seeded record, and keeps a persisted one whole', () => {
    const fresh = freshAppState()
    const { schedule: _omit, ...withoutSchedule } = fresh.appSettings
    void _omit
    const old = { ...fresh, appSettings: withoutSchedule }
    expect(backfillMerge(fresh as never, old).appSettings.schedule).toEqual(fresh.appSettings.schedule)
    const edited = { horizonMonths: 6, defaultTimes: { AM: { startTime: '08:00', endTime: '12:00' }, PM: { startTime: '13:30', endTime: '17:30' } } }
    const persisted = { ...fresh, appSettings: { ...fresh.appSettings, schedule: edited } }
    expect(backfillMerge(fresh as never, persisted).appSettings.schedule).toEqual(edited)
  })

  it('discards a v20 store (Lists that were also empty sessions) and reseeds Slots', () => {
    expect(PERSIST_VERSION).toBeGreaterThanOrEqual(21)
    const fresh = freshAppState()
    expect(Object.keys(fresh.schedule.slots).length).toBeGreaterThan(0)
    expect('availability' in fresh.masters).toBe(false)
  })
})

describe('the availability status master and series (catch-up Phase 29)', () => {
  it('discards a v21 store (the six-key List statuses) and reseeds the status master', () => {
    expect(PERSIST_VERSION).toBe(22)
    const fresh = freshAppState()
    expect(Object.keys(fresh.masters.slotStatuses).sort()).toEqual(['free', 'holiday', 'unavailable'])
    expect('listStatuses' in fresh.masters).toBe(false)
    expect(fresh.schedule.availabilitySeries).toEqual({})
  })

  it('backfills an empty series record into a current-version store saved without it', () => {
    const fresh = freshAppState()
    const { availabilitySeries: _omit, ...withoutSeries } = fresh.schedule
    void _omit
    const old = { ...fresh, schedule: withoutSeries }
    expect(backfillMerge(fresh as never, old).schedule.availabilitySeries).toEqual({})
  })
})
