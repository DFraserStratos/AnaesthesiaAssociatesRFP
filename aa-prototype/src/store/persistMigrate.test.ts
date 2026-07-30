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

  it('defaults to the full fee display and updates through the typed shell action', () => {
    const store = createAppStore()
    expect(store.getState().shell.cardCalculationMode).toBe('fee')
    store.getState().setCardCalculationMode('units')
    expect(store.getState().shell.cardCalculationMode).toBe('units')
  })

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
    expect(s.shell.cardCalculationMode).toBe('fee')
    // ... while the persisted (live) value that WAS present still wins.
    expect(s.settings.contactArchiveInactivityDays).toBe(42)
  })

  it('preserves a persisted store at the current version (round-trips)', () => {
    const a = createAppStore({ persisted: true })
    a.setState({ settings: { ...a.getState().settings, contactArchiveInactivityDays: 42 } })
    a.getState().setCardCalculationMode('units')
    // A second store at the same version rehydrates the persisted value.
    const b = createAppStore({ persisted: true })
    expect(b.getState().settings.contactArchiveInactivityDays).toBe(42)
    expect(b.getState().shell.cardCalculationMode).toBe('units')
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
