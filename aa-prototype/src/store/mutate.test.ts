/**
 * The mutation wrapper: lastModifiedBy/At stamped in LOCKSTEP with every
 * audit entry — plus `storeDiscipline`, the source-scan proving no module
 * outside mutate.ts raw-writes a domain slice (the grep-provable convention).
 */

import { describe, expect, it } from 'vitest'
import { createAppStore } from './appStore'
import { cancelBooking, completeBooking, editBooking, editProcedure } from './lifecycle'
import { auditForEntity, proceduresForBooking } from './selectors'
import { mutate, type Actor } from './mutate'
import { SEED_MARKERS } from '../domain/seed'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const SOUTER: Actor = {
  who: 'Dr Melanie Souter',
  role: 'anaesthetist',
  source: 'anaesthetist',
  anaesthetistId: '34821',
}

function marker(key: string): string {
  const m = SEED_MARKERS[key]
  if (m === undefined) throw new Error(`missing marker ${key}`)
  return m.entityId
}

const ELLISON_BOOKING = marker('pendingCaptureBooking')

describe('the wrapper stamps lastModifiedBy/At in lockstep with the audit entry', () => {
  it('on booking edits', () => {
    const api = createAppStore()
    expect(editBooking(api, OFFICE, ELLISON_BOOKING, { notes: 'note' }).ok).toBe(true)
    const state = api.getState()
    const booking = state.schedule.bookings[ELLISON_BOOKING]
    const entry = auditForEntity(state, ELLISON_BOOKING).at(-1)
    expect(entry?.action).toBe('booking.update')
    expect(booking?.lastModifiedBy).toBe('Kirsty W.')
    expect(booking?.lastModifiedAtISO).toBe(entry?.atISO)
  })

  it('on procedure edits (stamping the PARENT booking)', () => {
    const api = createAppStore()
    const procedure = proceduresForBooking(api.getState(), ELLISON_BOOKING)[0]
    if (procedure === undefined) throw new Error('no procedure')
    expect(editProcedure(api, OFFICE, procedure.id, { billingReference: 'SX-2026-7000' }).ok).toBe(true)
    const state = api.getState()
    const booking = state.schedule.bookings[ELLISON_BOOKING]
    const entry = auditForEntity(state, procedure.id).at(-1)
    expect(entry?.action).toBe('procedure.update')
    expect(booking?.lastModifiedBy).toBe('Kirsty W.')
    expect(booking?.lastModifiedAtISO).toBe(entry?.atISO)
  })

  it('on completion and cancellation', () => {
    const api = createAppStore()
    // Ellison seeds pre-capture — stamp her finish so completion validates.
    const ellisonProc = proceduresForBooking(api.getState(), ELLISON_BOOKING)[0]
    if (ellisonProc === undefined) throw new Error('no procedure')
    expect(editProcedure(api, SOUTER, ellisonProc.id, { handoverISO: '2026-07-21T17:20:00' }).ok).toBe(true)
    expect(completeBooking(api, SOUTER, ELLISON_BOOKING).ok).toBe(true)
    let state = api.getState()
    expect(state.schedule.bookings[ELLISON_BOOKING]?.lastModifiedBy).toBe('Dr Melanie Souter')
    expect(state.schedule.bookings[ELLISON_BOOKING]?.lastModifiedAtISO).toBe(
      auditForEntity(state, ELLISON_BOOKING).at(-1)?.atISO,
    )

    const cancelTarget = marker('twoFunderBooking')
    expect(cancelBooking(api, OFFICE, cancelTarget, 'Rebooked').ok).toBe(true)
    state = api.getState()
    expect(state.schedule.bookings[cancelTarget]?.lastModifiedBy).toBe('Kirsty W.')
    expect(state.schedule.bookings[cancelTarget]?.lastModifiedAtISO).toBe(
      auditForEntity(state, cancelTarget).at(-1)?.atISO,
    )
  })

  it('audit is append-only and ids are sequential', () => {
    const api = createAppStore()
    const before = api.getState().audit.length
    expect(editBooking(api, OFFICE, ELLISON_BOOKING, { notes: 'a' }).ok).toBe(true)
    expect(editBooking(api, OFFICE, ELLISON_BOOKING, { notes: 'b' }).ok).toBe(true)
    const audit = api.getState().audit
    expect(audit.length).toBe(before + 2)
    const [first, second] = audit.slice(-2)
    expect(first?.id).not.toBe(second?.id)
    // Sequential, not merely distinct: the counter increments by exactly one.
    const ordinal = (id: string | undefined): number => Number((id ?? '').replace(/^A/, ''))
    expect(ordinal(second?.id)).toBe(ordinal(first?.id) + 1)
  })

  it('refuses a write carrying no audit meta (convention 7)', () => {
    const api = createAppStore()
    const before = api.getState().audit.length
    expect(() => mutate(api, OFFICE, [], () => ({}))).toThrow(/audit meta/)
    // Nothing committed: the audit log is untouched.
    expect(api.getState().audit.length).toBe(before)
  })
})

// ---------------------------------------------------------------------------
// storeDiscipline — the source scan (same pattern as domainPurity)
// ---------------------------------------------------------------------------

// The whole src tree (every .ts/.tsx under src), minus tests. Widened from the
// original store+apps+shell-only net, which missed src root (router.tsx),
// shared/, theme/, and any .ts under apps/shell — holes in a "grep-provable"
// discipline. Vite normalises keys relative to this file: store/ siblings keep
// `./name.ts`, everything else is `../dir/name.ts`.
const SOURCES = import.meta.glob(['../**/*.{ts,tsx}', '!../**/*.test.{ts,tsx}'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

describe('storeDiscipline', () => {
  const files = Object.keys(SOURCES)

  it('finds the store and app sources', () => {
    expect(files.length).toBeGreaterThan(10)
  })

  it('only mutate.ts and clockActions.ts ever call setState', () => {
    for (const file of files) {
      if (file.endsWith('/mutate.ts') || file.endsWith('/clockActions.ts')) continue
      const source = SOURCES[file] ?? ''
      expect(/\.setState\s*\(/.test(source), `${file} must not call setState directly`).toBe(false)
    }
  })

  it("clockActions' setState calls write only the clock", () => {
    const source = SOURCES['./clockActions.ts'] ?? ''
    const calls = source.match(/\.setState\s*\(/g) ?? []
    const clockOnly = source.match(/\.setState\s*\(\s*\{\s*clock/g) ?? []
    expect(calls.length).toBeGreaterThan(0)
    expect(clockOnly.length).toBe(calls.length)
  })

  it("appStore's initializer set() writes only the shell slice", () => {
    const source = SOURCES['./appStore.ts'] ?? ''
    const calls = source.match(/[^.\w]set\s*\(\s*\{/g) ?? []
    const shellOnly = source.match(/[^.\w]set\s*\(\s*\{\s*shell/g) ?? []
    expect(calls.length).toBe(shellOnly.length)
  })
})
