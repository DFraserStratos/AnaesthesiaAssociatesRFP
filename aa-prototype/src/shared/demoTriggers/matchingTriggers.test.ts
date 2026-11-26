/**
 * Catch-up Phase 33's PWA office stand-in ("Hospital file imported and my
 * booking matched"; the two Matching bar entries were retired by build plan
 * Phase 68, D119). Routes, surfaces, disabled states, determinism; since Phase
 * 68 its rows arrive by their source through the ingest and the office decides
 * through `decideArrivingLists`.
 */

import { describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from '../../store/appStore'
import { proceduresForBooking } from '../../store/selectors'
import { DEMO_TRIGGERS } from './registry'
import { demoTriggersFor } from './match'
import type { DemoTrigger, DemoTriggerCtx } from './types'
import { FOSTER_HOSPITAL_WORDING } from '../../domain/intake'

const byId = (id: string): DemoTrigger => DEMO_TRIGGERS.find((t) => t.id === id)!
/** Leaves out catch-up Phase 43a's PWA "Sign out" (`phase43aTriggers.test.ts`). */
const ids = (api: BoundAppStore, pathname: string, surface: 'bar' | 'pwa') =>
  demoTriggersFor(api.getState(), pathname, surface)
    .map((m) => m.trigger.id)
    .filter((id) => id !== 'pwa-sign-out')
/** Not one of the seed's own intake rows (`IRS…`): the rows a run staged. */
/** Rows staged at runtime (the seed's own use `IRS`, and the seeded morning's `IRM`). */
const staged = (id: string) => !/^IR[SM]/.test(id)
const FOSTER = 'BK0043'

describe('the PWA office stand-in', () => {
  it('is PWA only on the three Lists layers', () => {
    const api = createAppStore()
    for (const path of ['/mobile/lists', '/mobile/lists/L1', '/mobile/lists/L1/bookings/BK1']) {
      expect(ids(api, path, 'pwa')).toContain('matching-office-matches-row')
      expect(ids(api, path, 'bar')).not.toContain('matching-office-matches-row')
    }
    expect(byId('matching-office-matches-row').badge).toBe('office-stand-in')
  })

  it("S1 (catch-up Phase 34): St George's file imported, Sarah Mitchell on Dr Souter's Tue 1 Dec AM List with her wording and No contract · RVG, the other rows left for the office, then disabled", () => {
    const api = createAppStore()
    const t = byId('matching-office-matches-row')
    const ctx: DemoTriggerCtx = { pathname: '/mobile/lists', params: {}, published: {} }
    expect(t.label).toBe('Hospital file imported and my booking matched')
    expect(t.choices!(api.getState(), ctx)[0]).toEqual({ id: 's1', label: "St George's file, Tue 1 Dec AM (S1)" })
    const res = t.run(api, ctx, 's1')
    expect(res.ok).toBe(true)
    const rows = Object.values(api.getState().intake.rows).filter((r) => staged(r.id))
    // The whole file arrives by St George's feed (Phase 68: as the hospital, never the office); only the two rows for the persona's List are decided.
    expect(rows).toHaveLength(5)
    expect(rows.filter((r) => r.status === 'applied').map((r) => r.incoming.patient.name).sort()).toEqual(['Dylan Kereama', 'Sarah Mitchell'])
    expect(rows.filter((r) => r.status === 'open')).toHaveLength(3)
    const batch = api.getState().intake.batches[rows[0]!.batchId]!
    expect(batch.arrivalSource).toEqual({ kind: 'hospitalFeed', hospitalId: 'H-STG' })
    expect(api.getState().audit.find((e) => e.action === 'importBatch.create' && e.entityId === batch.id)?.role).not.toBe('office')
    const sarahRow = rows.find((r) => r.incoming.patient.name === 'Sarah Mitchell')!
    expect(sarahRow).toMatchObject({ status: 'applied', decidedBy: 'AA office (simulated)' })
    const bookingId = sarahRow.decision!.kind === 'createBooking' ? sarahRow.decision!.bookingId : ''
    const [p] = proceduresForBooking(api.getState(), bookingId)
    expect(api.getState().schedule.bookings[bookingId]!.listId).toBe('L-34821-2026-12-01-AM')
    expect(p!.procedureText?.text).toBe('lap appy ?conv to open')
    // The office's rail answer (D33): No contract · RVG; the RVG code stays the anaesthetist's.
    expect(p!.governingContractId).toBe('CT-NO-CONTRACT')
    expect(p!.rvgGroupId).toBeUndefined()
    // Dylan's matched Booking is never given a Contract by the stand-in.
    const dylan = rows.find((r) => r.incoming.patient.name === 'Dylan Kereama')!
    const dylanBooking = dylan.decision!.kind === 'match' ? dylan.decision!.bookingId : ''
    const before = createAppStore().getState().schedule.procedures
    for (const q of proceduresForBooking(api.getState(), dylanBooking)) expect(q.governingContractId).toBe(before[q.id]!.governingContractId)
    expect(t.disabledReason?.(api.getState(), ctx, 's1')).toBe('Nothing new from the hospital for your Lists')
  })

  it('S1 is idempotent: a second run is refused', () => {
    const api = createAppStore()
    const t = byId('matching-office-matches-row')
    const ctx: DemoTriggerCtx = { pathname: '/mobile/lists', params: {}, published: {} }
    expect(t.disabledReason?.(api.getState(), ctx, 's1')).toBeNull()
    expect(t.run(api, ctx, 's1').ok).toBe(true)
    expect(t.run(api, ctx, 's1').ok).toBe(false)
  })

  it("on Diane Foster's Booking the office approves the update: the hospital's text replaces WLE MM", () => {
    const api = createAppStore()
    const t = byId('matching-office-matches-row')
    const ctx: DemoTriggerCtx = { pathname: `/mobile/lists/L-34821-2026-12-08-AM/bookings/${FOSTER}`, params: { listId: 'L-34821-2026-12-08-AM', bookingId: FOSTER }, published: {} }
    expect(t.run(api, ctx, 'booking').ok).toBe(true)
    expect(proceduresForBooking(api.getState(), FOSTER)[0]!.procedureText?.text).toBe(FOSTER_HOSPITAL_WORDING)
    expect(t.disabledReason?.(api.getState(), ctx, 'booking')).toBe('This update was already applied')
  })

  it('a new hospital booking on an ACTIVE St George\'s List takes the next pool patient, deterministically', () => {
    const runOnce = () => {
      const api = createAppStore()
      const ctx: DemoTriggerCtx = { pathname: '/mobile/lists/L-34821-2026-12-01-AM', params: { listId: 'L-34821-2026-12-01-AM' }, published: {} }
      const res = byId('matching-office-matches-row').run(api, ctx, 'list')
      return { ok: res.ok, message: res.message }
    }
    const first = runOnce()
    expect(first.ok).toBe(true)
    expect(first.message).toContain('Mere Tautahi')
    expect(runOnce()).toEqual(first)
  })
})
