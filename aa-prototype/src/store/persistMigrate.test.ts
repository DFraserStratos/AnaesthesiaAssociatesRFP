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
import { openOutOfHoursSession } from './outOfHoursActions'
import { OFFICE_ACTOR } from './demoActors'
import { ANAE, SEED_LIST_IDS } from '../domain/seed'

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
    expect(PERSIST_VERSION).toBeGreaterThanOrEqual(22)
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

describe('conflicts from facts and recurring bookings (catch-up Phase 30)', () => {
  it('discards a v22 store (message conflicts, the old recurring-booking master) and reseeds', () => {
    expect(PERSIST_VERSION).toBeGreaterThanOrEqual(23)
    const fresh = freshAppState()
    expect(Object.keys(fresh.masters.recurringBookings).every((id) => id.startsWith('RCB'))).toBe(true)
    const flagged = Object.values(fresh.schedule.lists).flatMap((l) => l.conflicts)
    expect(flagged.length).toBeGreaterThan(0)
    for (const c of flagged) {
      expect('message' in c).toBe(false)
      expect(c.cause).toMatch(/^(holiday|availability):/)
    }
  })
})

describe('Draft Lists and the pairing rule (catch-up Phase 31)', () => {
  it('discards a v23 store (Lists with no hospital or surgeon, the Surgeon TBC List) and reseeds with every List paired', () => {
    expect(PERSIST_VERSION).toBeGreaterThanOrEqual(24)
    const fresh = freshAppState()
    for (const l of Object.values(fresh.schedule.lists)) {
      expect(l.hospitalId, l.id).toBeTruthy()
      expect(l.surgeonId, l.id).toBeTruthy()
    }
    expect(Object.values(fresh.schedule.lists).filter((l) => l.state === 'DRAFT')).toHaveLength(16)
    expect(fresh.masters.hospitals['H-AAROOMS']).toMatchObject({ locationType: 'aaRooms' })
  })
})

describe('the notification pool and the cover marker gone (catch-up Phase 32)', () => {
  beforeEach(() => {
    flushPersist()
    localStorage.clear()
  })
  afterEach(() => localStorage.clear())

  it('discards a v24 store carrying a cover marker and no pool, and reseeds with an empty pool', () => {
    expect(PERSIST_VERSION).toBeGreaterThanOrEqual(25)
    const fresh = freshAppState()
    const slotId = Object.keys(fresh.schedule.slots)[0]!
    const stale = {
      ...fresh,
      schedule: {
        ...fresh.schedule,
        slots: { ...fresh.schedule.slots, [slotId]: { ...fresh.schedule.slots[slotId], coverRequest: { by: 'Dr Melanie Souter', kind: 'offer', atISO: '2026-07-21T08:00:00', status: 'pending' } } },
      },
    } as Record<string, unknown>
    delete stale['notifications']
    localStorage.setItem(PERSIST_KEY, JSON.stringify({ state: stale, version: 24 }))
    const s = createAppStore({ persisted: true }).getState()
    expect(s.notifications).toEqual({})
    expect(Object.values(s.schedule.slots).some((slot) => 'coverRequest' in slot)).toBe(false)
  })

  it('seeds an empty pool', () => {
    expect(freshAppState().notifications).toEqual({})
  })
})

describe('the browsable history (catch-up Phase 38a)', () => {
  beforeEach(() => {
    flushPersist()
    localStorage.clear()
  })
  afterEach(() => localStorage.clear())

  it('discards a v26 store without the January to March history and reseeds with it', () => {
    expect(PERSIST_VERSION).toBeGreaterThanOrEqual(27)
    const fresh = freshAppState()
    const lists = { ...fresh.schedule.lists }
    for (const id of Object.keys(lists)) if (/^L-HIST-\d{4}-/.test(id)) delete lists[id]
    const stale = { ...fresh, schedule: { ...fresh.schedule, lists } }
    localStorage.setItem(PERSIST_KEY, JSON.stringify({ state: stale, version: 26 }))
    const s = createAppStore({ persisted: true }).getState()
    expect(s.schedule.lists['L-HIST-2026-03-13-AM']).toBeDefined()
  })
})

describe('the single-Booking move seed (catch-up Phase 32a)', () => {
  beforeEach(() => {
    flushPersist()
    localStorage.clear()
  })
  afterEach(() => localStorage.clear())

  it("discards a v27 store without the acceptance beat's Booking, and reseeds with it", () => {
    expect(PERSIST_VERSION).toBeGreaterThanOrEqual(28)
    const fresh = freshAppState()
    const bookings = { ...fresh.schedule.bookings }
    delete bookings['BK0162']
    const stale = { ...fresh, schedule: { ...fresh.schedule, bookings } }
    localStorage.setItem(PERSIST_KEY, JSON.stringify({ state: stale, version: 27 }))
    const s = createAppStore({ persisted: true }).getState()
    expect(s.schedule.bookings['BK0162']?.listId).toBe('L-31902-2026-07-31-AM')
  })
})

describe('unavailability is never a conflict (catch-up Phase 32b)', () => {
  beforeEach(() => {
    flushPersist()
    localStorage.clear()
  })
  afterEach(() => localStorage.clear())

  it("discards a v28 store holding an 'availability' conflict on Rutherford's Wed 22 AM List, and reseeds it as a returned Draft List", () => {
    expect(PERSIST_VERSION).toBeGreaterThanOrEqual(29)
    const fresh = freshAppState()
    const id = 'L-29104-2026-07-22-AM'
    const draft = fresh.schedule.lists[id]!
    // The v28 shape: the List in Rutherford's closed session, flagged by the old availability rule.
    const staleList = {
      ...draft,
      state: 'ACTIVE',
      anaesthetistId: '29104',
      slotId: 'S-29104-2026-07-22-AM',
      conflicts: [{ kind: 'availability', cause: 'availability:S-29104-2026-07-22-AM:unavailable', raisedAtISO: '2026-07-21T08:00:00', slotId: 'S-29104-2026-07-22-AM', statusKey: 'unavailable' }],
    }
    const stale = { ...fresh, schedule: { ...fresh.schedule, lists: { ...fresh.schedule.lists, [id]: staleList } } }
    localStorage.setItem(PERSIST_KEY, JSON.stringify({ state: stale, version: 28 }))
    const s = createAppStore({ persisted: true }).getState()
    expect(s.schedule.lists[id]?.state).toBe('DRAFT')
    expect(s.schedule.lists[id]?.draft?.origin).toBe('unavailableReturn')
    const kinds = Object.values(s.schedule.lists).flatMap((l) => l.conflicts.map((c) => c.kind as string))
    expect(kinds.every((k) => k === 'holiday')).toBe(true)
  })
})

describe('the out-of-hours session (catch-up Phase 32c)', () => {
  beforeEach(() => {
    flushPersist()
    localStorage.clear()
  })
  afterEach(() => localStorage.clear())

  it('discards a v29 store (its schedule settings have no out-of-hours default) and reseeds with one', () => {
    expect(PERSIST_VERSION).toBeGreaterThanOrEqual(30)
    const fresh = freshAppState()
    const { OOH: _ooh, ...twoSessions } = fresh.appSettings.schedule.defaultTimes
    const stale = { ...fresh, appSettings: { ...fresh.appSettings, schedule: { ...fresh.appSettings.schedule, defaultTimes: twoSessions } } }
    localStorage.setItem(PERSIST_KEY, JSON.stringify({ state: stale, version: 29 }))
    const s = createAppStore({ persisted: true }).getState()
    expect(s.appSettings.schedule.defaultTimes.OOH).toEqual({ startTime: '18:00', endTime: '21:00' })
    expect(Object.values(s.schedule.slots).some((slot) => slot.session === 'OOH')).toBe(false)
  })

  it('a v30 store holding an opened out-of-hours session reloads it intact', () => {
    const api = createAppStore({ persisted: true })
    const out = openOutOfHoursSession(api, OFFICE_ACTOR, ANAE.souter, '2026-07-21')
    expect(out.ok).toBe(true)
    if (!out.ok) return
    flushPersist()
    expect(createAppStore({ persisted: true }).getState().schedule.slots[out.value.slotId]).toEqual(api.getState().schedule.slots[out.value.slotId])
  })
})

describe('Parties and flat Contracts (catch-up Phase 18)', () => {
  beforeEach(() => {
    flushPersist()
    localStorage.clear()
  })
  afterEach(() => localStorage.clear())

  it('discards a v31 store whose Contracts carry no AA code or pricing kind, and reseeds the flat Contracts', () => {
    const fresh = freshAppState()
    const { aaCode: _code, pricing: _pricing, ...oldShape } = fresh.masters.contracts['CT-HNZ']!
    const stale = { ...fresh, masters: { ...fresh.masters, contracts: { 'CT-HNZ': { ...oldShape, type: 2 } } } }
    localStorage.setItem(PERSIST_KEY, JSON.stringify({ state: stale, version: 31 }))
    const s = createAppStore({ persisted: true }).getState()
    expect(s.masters.contracts['CT-HNZ']).toMatchObject({ aaCode: 'CPH-002', pricing: { kind: 'rvgContractRate', unitRate: 23 } })
    expect(s.masters.contracts['CT-NO-CONTRACT']?.systemRole).toBe('noContractRvg')
    expect(Object.keys(s.masters.parties).length).toBeGreaterThan(10)
  })
})

describe('Specialties, funding tags and the fallbacks (catch-up Phase 18a)', () => {
  beforeEach(() => {
    flushPersist()
    localStorage.clear()
  })
  afterEach(() => localStorage.clear())

  it('discards a v32 store whose surgeons hold free-text specialties, and reseeds the lists and fallbacks', () => {
    expect(PERSIST_VERSION).toBeGreaterThanOrEqual(33)
    const fresh = freshAppState()
    const { specialtyIds: _ids, ...oldSurgeon } = fresh.masters.surgeons['S-HALE']!
    const { specialties: _s, fundingTags: _t, ...oldMasters } = fresh.masters
    const stale = { ...fresh, masters: { ...oldMasters, surgeons: { 'S-HALE': { ...oldSurgeon, specialty: 'Orthopaedics' } } } }
    localStorage.setItem(PERSIST_KEY, JSON.stringify({ state: stale, version: 32 }))
    const s = createAppStore({ persisted: true }).getState()
    expect(s.masters.surgeons['S-HALE']?.specialtyIds).toEqual(['SPC-ORTHO'])
    expect(s.masters.fundingTags['TAG-ACC']?.code).toBe('ACC')
    expect(Object.values(s.masters.contracts).some((c) => c.systemRole === 'openPriceFallback')).toBe(true)
  })
})

describe('RVG groups (catch-up Phase 19)', () => {
  beforeEach(() => {
    flushPersist()
    localStorage.clear()
  })
  afterEach(() => localStorage.clear())

  it('discards a v33 store with the flat RVG code table and reseeds the RVG groups', () => {
    const fresh = freshAppState()
    const { rvgGroups: _g, ...oldMasters } = fresh.masters
    const stale = { ...fresh, masters: { ...oldMasters, rvgCodes: { '20941': { code: '20941' } } } }
    localStorage.setItem(PERSIST_KEY, JSON.stringify({ state: stale, version: 33 }))
    const s = createAppStore({ persisted: true }).getState()
    expect(Object.values(s.masters.rvgGroups).filter((g) => g.code === 'T2')).toHaveLength(3)
    expect((s.masters as unknown as Record<string, unknown>)['rvgCodes']).toBeUndefined()
    expect(s.appSettings.warningRules.baseUnitsOutsideGuide).toEqual({ active: true, params: {} })
  })
})

describe('price ranges (catch-up Phase 19a)', () => {
  beforeEach(() => {
    flushPersist()
    localStorage.clear()
  })
  afterEach(() => localStorage.clear())

  it('discards a v34 store with the fixed-price rows and reseeds the ranges, the two fields and the time rule', () => {
    const fresh = freshAppState()
    const { rvgTimeRule: _r, ...oldMasters } = fresh.masters
    const contracts = Object.fromEntries(
      Object.entries(fresh.masters.contracts).map(([id, c]) => {
        const { invoiceDescription: _i, defaultRvgGroupId: _d, ...old } = c
        return [id, c.pricing.kind === 'fixed' ? { ...old, pricing: { kind: 'fixed' } } : old]
      }),
    )
    const stale = { ...fresh, masters: { ...oldMasters, contracts, contractPrices: { 'CP-BAR-1': { id: 'CP-BAR-1', price: 2800 } } } }
    localStorage.setItem(PERSIST_KEY, JSON.stringify({ state: stale, version: 34 }))
    const s = createAppStore({ persisted: true }).getState()
    expect((s.masters as unknown as Record<string, unknown>)['contractPrices']).toBeUndefined()
    expect(s.masters.rvgTimeRule.tiers).toHaveLength(2)
    expect(s.masters.contracts['CT-DOYLE-BAR']?.pricing).toMatchObject({ kind: 'fixed', ranges: [{ startISO: '2025-01-01', price: 2800 }, { startISO: '2026-07-28', price: 2950 }] })
    expect(s.masters.contracts['CT-MER-FACELIFT']?.defaultRvgGroupId).not.toBeNull()
  })
})

describe('modifiers (catch-up Phase 19b)', () => {
  beforeEach(() => {
    flushPersist()
    localStorage.clear()
  })
  afterEach(() => localStorage.clear())

  it('discards a v35 store with ASA classes and modifier codes and reseeds the RVG modifier table and the claims', () => {
    expect(PERSIST_VERSION).toBeGreaterThanOrEqual(36)
    const fresh = freshAppState()
    const { modifiers: _m, ...oldMasters } = fresh.masters
    const procedures = Object.fromEntries(
      Object.entries(fresh.schedule.procedures).map(([id, p]) => {
        const { modifierClaims: _c, removedModifierIds: _r, ...old } = p
        return [id, { ...old, asaClass: 'AS2', selectedModifierCodes: [] }]
      }),
    )
    const stale = {
      ...fresh,
      masters: { ...oldMasters, modifierCodes: { AS2: { code: 'AS2', group: 'AS', units: 1, description: 'ASA II' } } },
      schedule: { ...fresh.schedule, procedures },
    }
    localStorage.setItem(PERSIST_KEY, JSON.stringify({ state: stale, version: 35 }))
    const s = createAppStore({ persisted: true }).getState()
    expect((s.masters as unknown as Record<string, unknown>)['modifierCodes']).toBeUndefined()
    expect(Object.values(s.masters.modifiers)).toHaveLength(30)
    expect(s.schedule.procedures.P0001).toMatchObject({ modifierClaims: [], removedModifierIds: [] })
    expect((s.schedule.procedures.P0001 as unknown as Record<string, unknown>)['asaClass']).toBeUndefined()
  })
})

describe('one Contract per Procedure (catch-up Phase 20)', () => {
  beforeEach(() => {
    flushPersist()
    localStorage.clear()
  })
  afterEach(() => localStorage.clear())

  it('discards a v36 store with billing routes and payment categories and reseeds every Procedure on one Contract', () => {
    expect(PERSIST_VERSION).toBeGreaterThanOrEqual(37)
    const fresh = freshAppState()
    const procedures = Object.fromEntries(
      Object.entries(fresh.schedule.procedures).map(([id, p]) => [id, { ...p, billingRoute: 'billableParty', patientPaymentCategory: 'selfFundedPostProcedure' }]),
    )
    const stale = { ...fresh, schedule: { ...fresh.schedule, procedures } }
    localStorage.setItem(PERSIST_KEY, JSON.stringify({ state: stale, version: 36 }))
    const s = createAppStore({ persisted: true }).getState()
    const riley = s.schedule.procedures.P0036 as unknown as Record<string, unknown>
    expect(riley['billingRoute']).toBeUndefined()
    expect(riley['patientPaymentCategory']).toBeUndefined()
    expect(riley['governingContractId']).toBe('CT-SOUTER-RHINO')
  })
})

describe('procedure text and invoice description (catch-up Phase 20a)', () => {
  beforeEach(() => {
    flushPersist()
    localStorage.clear()
  })
  afterEach(() => localStorage.clear())

  it('discards a v37 store with Procedure descriptions and attachments and reseeds the procedure texts', () => {
    const fresh = freshAppState()
    const procedures = Object.fromEntries(
      Object.entries(fresh.schedule.procedures).map(([id, p]) => {
        const { procedureText: _t, invoiceDescription: _d, ...old } = p
        return [id, { ...old, description: 'Old wording' }]
      }),
    )
    const bookings = Object.fromEntries(Object.entries(fresh.schedule.bookings).map(([id, b]) => [id, { ...b, attachments: [] }]))
    const stale = { ...fresh, schedule: { ...fresh.schedule, procedures, bookings } }
    localStorage.setItem(PERSIST_KEY, JSON.stringify({ state: stale, version: 37 }))
    const s = createAppStore({ persisted: true }).getState()
    const first = s.schedule.procedures.P0001 as unknown as Record<string, unknown>
    expect(first['description']).toBeUndefined()
    expect(first['procedureText']).not.toBeUndefined()
    expect(s.schedule.bookings.BK0001 as unknown as Record<string, unknown>).not.toHaveProperty('attachments')
  })
})

describe('the RVG backstops (catch-up Phase 20 (9))', () => {
  beforeEach(() => {
    flushPersist()
    localStorage.clear()
  })
  afterEach(() => localStorage.clear())

  it('discards a v38 store without the RVG backstop Contracts and reseeds them', () => {
    expect(PERSIST_VERSION).toBeGreaterThanOrEqual(39)
    const fresh = freshAppState()
    const contracts = Object.fromEntries(Object.entries(fresh.masters.contracts).filter(([, c]) => c.systemRole !== 'rvgFallback'))
    const stale = { ...fresh, masters: { ...fresh.masters, contracts } }
    localStorage.setItem(PERSIST_KEY, JSON.stringify({ state: stale, version: 38 }))
    const s = createAppStore({ persisted: true }).getState()
    expect(Object.values(s.masters.contracts).some((c) => c.systemRole === 'rvgFallback')).toBe(true)
  })
})

describe('the payer on the Booking (catch-up Phase 21)', () => {
  beforeEach(() => {
    flushPersist()
    localStorage.clear()
  })
  afterEach(() => localStorage.clear())

  it('discards a v39 store with per-Procedure payers and reseeds every Booking with a payer', () => {
    expect(PERSIST_VERSION).toBeGreaterThanOrEqual(40)
    const fresh = freshAppState()
    const bookings = Object.fromEntries(
      Object.entries(fresh.schedule.bookings).map(([id, b]) => {
        const { ...rest } = b as typeof b & { payer?: unknown }
        delete rest.payer
        return [id, rest]
      }),
    )
    const stale = { ...fresh, schedule: { ...fresh.schedule, bookings }, masters: { ...fresh.masters, billableParties: {} } }
    localStorage.setItem(PERSIST_KEY, JSON.stringify({ state: stale, version: 39 }))
    const s = createAppStore({ persisted: true }).getState()
    expect(Object.values(s.schedule.procedures).every((p) => p.payer !== undefined)).toBe(true)
    expect(s.masters as unknown as Record<string, unknown>).not.toHaveProperty('billableParties')
  })
})

describe('insurance on the Booking (catch-up Phase 21 session 2)', () => {
  beforeEach(() => {
    flushPersist()
    localStorage.clear()
  })
  afterEach(() => localStorage.clear())

  it('discards a v40 store without funders and reseeds them', () => {
    expect(PERSIST_VERSION).toBeGreaterThanOrEqual(41)
    const fresh = freshAppState()
    const bookings = Object.fromEntries(
      Object.entries(fresh.schedule.bookings).map(([id, b]) => {
        const { funderPartyId: _f, insuranceApprovalNumber: _n, ...rest } = b
        void _f
        void _n
        return [id, rest]
      }),
    )
    localStorage.setItem(PERSIST_KEY, JSON.stringify({ state: { ...fresh, schedule: { ...fresh.schedule, bookings } }, version: 40 }))
    const s = createAppStore({ persisted: true }).getState()
    expect(Object.values(s.schedule.bookings).some((b) => b.funderPartyId === 'PY-NIB')).toBe(true)
  })
})

describe('RVG detail by pricing kind and completion (catch-up Phase 21a session 1)', () => {
  beforeEach(() => {
    flushPersist()
    localStorage.clear()
  })
  afterEach(() => localStorage.clear())

  it('discards a v41 store without the modifiers-step marker and reseeds it', () => {
    expect(PERSIST_VERSION).toBeGreaterThanOrEqual(42)
    const fresh = freshAppState()
    const procedures = Object.fromEntries(
      Object.entries(fresh.schedule.procedures).map(([id, p]) => {
        const { modifiersConfirmed: _m, ...rest } = p
        void _m
        return [id, rest]
      }),
    )
    localStorage.setItem(PERSIST_KEY, JSON.stringify({ state: { ...fresh, schedule: { ...fresh.schedule, procedures } }, version: 41 }))
    const s = createAppStore({ persisted: true }).getState()
    expect(Object.values(s.schedule.procedures).some((p) => p.modifiersConfirmed === true)).toBe(true)
  })
})

describe('office review flags and the movable Booking (catch-up Phase 21a session 2)', () => {
  beforeEach(() => {
    flushPersist()
    localStorage.clear()
  })
  afterEach(() => localStorage.clear())

  it('discards a v42 store without the review-flags List and reseeds it', () => {
    expect(PERSIST_VERSION).toBeGreaterThanOrEqual(43)
    const fresh = freshAppState()
    const bookings = Object.fromEntries(Object.entries(fresh.schedule.bookings).filter(([, b]) => b.listId !== SEED_LIST_IDS.reviewFlags))
    localStorage.setItem(PERSIST_KEY, JSON.stringify({ state: { ...fresh, schedule: { ...fresh.schedule, bookings } }, version: 42 }))
    const s = createAppStore({ persisted: true }).getState()
    expect(Object.values(s.schedule.bookings).filter((b) => b.listId === SEED_LIST_IDS.reviewFlags)).toHaveLength(4)
  })
})

describe('invoice presentation and the split (catch-up Phase 22)', () => {
  beforeEach(() => {
    flushPersist()
    localStorage.clear()
  })
  afterEach(() => localStorage.clear())

  it('discards a v43 store whose Prentice Booking carries no split and reseeds it', () => {
    expect(PERSIST_VERSION).toBeGreaterThanOrEqual(44)
    const fresh = freshAppState()
    const procedures = Object.fromEntries(
      Object.entries(fresh.schedule.procedures).map(([id, p]) => {
        const { split: _split, ...rest } = p
        return [id, rest]
      }),
    )
    localStorage.setItem(PERSIST_KEY, JSON.stringify({ state: { ...fresh, schedule: { ...fresh.schedule, procedures } }, version: 43 }))
    const s = createAppStore({ persisted: true }).getState()
    expect(Object.values(s.schedule.procedures).filter((p) => p.split !== undefined)).toHaveLength(1)
    expect(Object.values(s.masters.anaesthetists).filter((a) => a.gstNumber !== undefined).length).toBeGreaterThan(10)
  })
})

describe('a payer on each Procedure (catch-up Phase 22a)', () => {
  beforeEach(() => {
    flushPersist()
    localStorage.clear()
  })
  afterEach(() => localStorage.clear())

  it('discards a v44 store whose payer sits on the Booking and reseeds a payer on every Procedure', () => {
    expect(PERSIST_VERSION).toBeGreaterThanOrEqual(45)
    const fresh = freshAppState()
    // The v44 shape: the payer on the Booking, none on the Procedures.
    const bookings = Object.fromEntries(Object.entries(fresh.schedule.bookings).map(([id, b]) => [id, { ...b, payer: { kind: 'patient' } }]))
    const procedures = Object.fromEntries(
      Object.entries(fresh.schedule.procedures).map(([id, p]) => {
        const { payer: _payer, ...rest } = p
        return [id, rest]
      }),
    )
    localStorage.setItem(PERSIST_KEY, JSON.stringify({ state: { ...fresh, schedule: { ...fresh.schedule, bookings, procedures } }, version: 44 }))
    const s = createAppStore({ persisted: true }).getState()
    expect(Object.values(s.schedule.procedures).every((p) => p.payer !== undefined)).toBe(true)
    expect(Object.values(s.schedule.bookings).some((b) => 'payer' in b)).toBe(false)
  })
})

describe('the primary Procedure (catch-up Phase 23)', () => {
  beforeEach(() => {
    flushPersist()
    localStorage.clear()
  })
  afterEach(() => localStorage.clear())

  it('discards a v45 store whose Procedures carry isAdditional and reseeds exactly one primary per Booking', () => {
    expect(PERSIST_VERSION).toBe(46)
    const fresh = freshAppState()
    // The v45 shape: isAdditional on every Procedure, no isPrimary.
    const procedures = Object.fromEntries(
      Object.entries(fresh.schedule.procedures).map(([id, p]) => {
        const { isPrimary, ...rest } = p
        return [id, { ...rest, isAdditional: !isPrimary }]
      }),
    )
    localStorage.setItem(PERSIST_KEY, JSON.stringify({ state: { ...fresh, schedule: { ...fresh.schedule, procedures } }, version: 45 }))
    const s = createAppStore({ persisted: true }).getState()
    expect(Object.values(s.schedule.procedures).every((p) => typeof p.isPrimary === 'boolean')).toBe(true)
    expect(Object.values(s.schedule.procedures).some((p) => 'isAdditional' in p)).toBe(false)
  })
})
