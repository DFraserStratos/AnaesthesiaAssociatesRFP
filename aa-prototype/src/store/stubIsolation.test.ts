/**
 * Catch-up Phase 33a: a stub is never a Booking (FT-02.6, D66, D11). With the
 * seeded stub standing, every Booking path returns exactly what it returns
 * without it, and submit and authorise go through on a List holding one with
 * no prompt and no refusal, the stub standing afterwards.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createAppStore, type AppState, type AppStoreApi } from './appStore'
import { OFFICE_ACTOR } from './demoActors'
import { bookingsForList, needsInvoiceDestinationBookings } from './selectors'
import { authoriseList, completionBlockersFor, submitList } from './lifecycle'
import { openWarnings } from './warnings'
import { searchBookingsFor } from './lookback'
import { anaesthetistLedgerPosition, bctiRecords } from './ledgerSelectors'
import { SEED_STUB } from '../domain/seed/intakeSeed'
import { importHospitalDownload } from './matchingActions'
import type { Actor } from './mutate'

const SOUTER = '34821'
const SOUTER_ACTOR: Actor = { who: 'Dr Melanie Souter', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: SOUTER }

function withAndWithout(): { withStub: AppState; without: AppState } {
  const api = createAppStore()
  importHospitalDownload(api, OFFICE_ACTOR, 'SAMPLE_SX') // R4's stub on Tue 28 Jul PM too
  const withStub = api.getState()
  expect(Object.values(withStub.intake.stubs).filter((s) => s.status === 'standing')).toHaveLength(2)
  return { withStub, without: { ...withStub, intake: { ...withStub.intake, stubs: {} } } }
}

function bookingPaths(s: AppState) {
  const today = s.clock.todayISO
  const lists = [SEED_STUB.listId, 'L-34821-2026-07-28-PM']
  return {
    bookingsForList: lists.map((id) => bookingsForList(s, id).map((b) => b.id)),
    bookingCount: Object.keys(s.schedule.bookings).length,
    completion: lists.flatMap((id) => bookingsForList(s, id).map((b) => completionBlockersFor(s, b))),
    dashboard: anaesthetistLedgerPosition(s, SOUTER),
    warningsAndTodo: openWarnings(s).map((r) => JSON.stringify(r.warning)),
    needsInvoiceDestination: needsInvoiceDestinationBookings(s).map((r) => r.bookingId),
    bcti: bctiRecords(s).length,
    search: [searchBookingsFor(s, SOUTER, 'Tipene', today).total, searchBookingsFor(s, SOUTER, 'Tama Henare', today).total],
  }
}

describe('a stub is never a Booking', () => {
  it('every Booking count, completion, warning, to-do, billing, BCTI and search path ignores it', () => {
    const { withStub, without } = withAndWithout()
    expect(bookingPaths(withStub)).toEqual(bookingPaths(without))
    expect(bookingsForList(withStub, SEED_STUB.listId)).toEqual([])
    expect(bookingPaths(withStub).search).toEqual([0, 0])
    expect(withStub.schedule.bookings[SEED_STUB.stubId]).toBeUndefined()
  })

  it('its audit lines are on the stub, never on a Booking (the audit viewer\'s Booking filter)', () => {
    const { withStub } = withAndWithout()
    const stubLines = withStub.audit.filter((a) => a.action.startsWith('stub.'))
    expect(stubLines.length).toBeGreaterThan(0)
    for (const a of stubLines) {
      expect(a.entityType).toBe('stub')
      expect(withStub.schedule.bookings[a.entityId]).toBeUndefined()
    }
  })

  it('submit and authorise go through on a List holding a stub, with no prompt or refusal; the stub stands', () => {
    const api: AppStoreApi = createAppStore()
    expect(submitList(api, SOUTER_ACTOR, SEED_STUB.listId)).toMatchObject({ ok: true })
    expect(authoriseList(api, OFFICE_ACTOR, SEED_STUB.listId)).toMatchObject({ ok: true })
    const s = api.getState()
    expect(s.schedule.lists[SEED_STUB.listId]?.state).toBe('AUTHORISED')
    expect(s.intake.stubs[SEED_STUB.stubId]?.status).toBe('standing')
  })

  it('no Booking-path module reads stubs (source scan)', () => {
    const files = [
      'store/selectors.ts',
      'store/lifecycle.ts',
      'store/warnings.ts',
      'store/billingRun.ts',
      'store/lookback.ts',
      'domain/billing/bcti.ts',
      'domain/listProgress.ts',
    ]
    for (const f of files) {
      // The Demo data page's record counts (`stubs:`) are the one allowed mention; a comment's "stub" is no read.
      const code = readFileSync(resolve(__dirname, '..', f), 'utf8')
        .split('\n')
        .filter((l) => !/^\s*(\*|\/\/|\/\*)/.test(l) && !/^\s*stubs: Object\.keys\(state\.intake\.stubs\)\.length,$/.test(l))
        .join('\n')
      expect(code, f).not.toMatch(/intake\.stubs|stubsOnList|stubsForList|stubForRow|useListStubs|useStubCountsByList|standingStub/)
    }
  })
})
