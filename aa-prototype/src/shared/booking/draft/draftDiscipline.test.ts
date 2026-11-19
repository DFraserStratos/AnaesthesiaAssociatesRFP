/**
 * The Booking detail's draft discipline (catch-up Phase 35; DM-35), proved
 * from the source: in `shared/booking`, `shared/capture`, `shared/flows` and
 * the other shared folders the Booking detail mounts (`warnings`,
 * `contracts`, `status`, `audit`, `surface`), every read goes through
 * `useBookingStore` and every drafted write through
 * `useBookingApi()`, so the Admin Booking detail's edits land in its draft.
 * `useAppStore` (the real store) appears only in the files below, each for a
 * reason: a command that acts on the saved Booking at once (and waits while
 * the draft is unsaved), a List-level flow never mounted as a drafted edit,
 * the saved history, or the draft module itself.
 */

import { describe, expect, it } from 'vitest'

const SOURCES = import.meta.glob(
  [
    '../**/*.{ts,tsx}',
    '../../capture/**/*.{ts,tsx}',
    '../../flows/**/*.{ts,tsx}',
    '../../warnings/**/*.{ts,tsx}',
    '../../contracts/**/*.{ts,tsx}',
    '../../status/**/*.{ts,tsx}',
    '../../audit/**/*.{ts,tsx}',
    '../../surface/**/*.{ts,tsx}',
    '!../**/*.test.{ts,tsx}',
    '!../../*/**/*.test.{ts,tsx}',
  ],
  { query: '?raw', import: 'default', eager: true },
) as Record<string, string>

/** A glob key as a path under `src/shared/` (`booking/X.tsx`, `capture/X.tsx`, `booking/draft/X.tsx`). */
function sharedPath(key: string): string {
  if (key.startsWith('../../')) return key.slice('../../'.length)
  if (key.startsWith('../')) return `booking/${key.slice('../'.length)}`
  if (key.startsWith('./')) return `booking/draft/${key.slice('./'.length)}`
  return key
}

/** The only files that may name `useAppStore`, and why. */
const REAL_STORE_ALLOWED: Record<string, string> = {
  'booking/draft/BookingStoreContext.tsx': 'the draft module: with no provider the Booking screens fall back to the real store',
  'booking/draft/BookingDraftProvider.tsx': 'the draft module: the real store the draft copies from and saves to',
  'booking/BookingDetailBody.tsx': 'commands completeBooking, uncompleteBooking and addPostOpAddendum, and the saved audit behind the history',
  'booking/HistorySheet.tsx': "the history shows saved changes only: the real audit, never a draft's own entries",
  'booking/BookingAsAtPanel.tsx': 'the as-at view reconstructs from the saved audit and Booking; writes nothing',
  'booking/OfficeSavedNotice.tsx': "reads the real audit for another actor's save; writes nothing",
  'flows/CancelBookingSheet.tsx': 'command cancelBooking',
  'flows/MoveBookingToColleagueSheet.tsx': "command moveBookingToAnaesthetist (the anaesthetist's single-Booking move)",
  'flows/AlertOfficeSheet.tsx': 'List-level notices: alertOffice and resolveNotification write notifications, never the Booking',
  'flows/SubmitListSheet.tsx': 'List-level command submitList',
  'flows/MoveListSheet.tsx': 'List-level moves (moveListToOffice, pushListToSlot, markUnavailableAndMoveList)',
  'flows/ManualBookingForm.tsx': "List-level flow: createBooking adds a new Booking to a List (AddBookingFlow), never mounted in a Booking's draft",
  'warnings/useBookingWarnings.ts': 'warnings read the saved Booking, so they update on Save, not while drafting (a recorded Phase 35 deviation)',
  'warnings/WarningsPanel.tsx': "command clearWarning: clearing a warning writes the real store at once and stays enabled while the draft is dirty (the phase doc's rule)",
  'contracts/ContractSelect.tsx': "reads the Contract and party masters only (never a Booking), and is not mounted on the Booking detail (the catalogue's store example)",
  'status/useSlotStatuses.ts': "the schedule grid's slot statuses (StatusChip, StatusLegend), read from the saved schedule; writes nothing",
}

/** Writes that belong in the draft: never handed the real store. */
const DRAFTED_WRITES = [
  'editBooking',
  'editPatient',
  'editProcedure',
  'addProcedure',
  'removeProcedure',
  'setRailAnswers',
  'pickRvgGroup',
  'claimModifier',
  'removeModifier',
  'restoreModifier',
  'confirmNoModifiers',
  'editModifierExplanation',
  'setProcedureContract',
  'setProcedurePrice',
  'setInvoiceDescription',
  'applyDefaultInvoiceDescription',
  'addSourceText',
  'setProcedurePayer',
  'savePaidBy',
  'setBookingInsurance',
  'setProcedureSplit',
  'setPrimaryProcedure',
  'addBillingLine',
  'removeBillingLine',
]

describe('draftDiscipline', () => {
  const files = Object.keys(SOURCES).map((key) => ({ path: sharedPath(key), source: SOURCES[key] ?? '' }))

  it('scans the Booking, capture and flow sources', () => {
    const paths = files.map((f) => f.path)
    expect(paths).toContain('booking/BookingDetailBody.tsx')
    expect(paths).toContain('capture/TimesCard.tsx')
    expect(paths).toContain('flows/PaidBySheet.tsx')
    expect(paths).toContain('booking/draft/BookingDraftProvider.tsx')
    expect(paths).toContain('warnings/WarningsPanel.tsx')
    expect(paths).toContain('contracts/railParts.tsx')
    expect(paths).toContain('status/useSlotStatuses.ts')
    expect(paths.some((p) => p.includes('.test.'))).toBe(false)
  })

  it('names useAppStore only in the allowlisted files', () => {
    const offenders = files.filter((f) => /\buseAppStore\b/.test(f.source) && REAL_STORE_ALLOWED[f.path] === undefined).map((f) => f.path)
    expect(offenders, 'read through useBookingStore and write through useBookingApi()').toEqual([])
  })

  it('keeps the allowlist honest: each allowed file still uses the real store', () => {
    const paths = new Set(files.map((f) => f.path))
    for (const path of Object.keys(REAL_STORE_ALLOWED)) {
      expect(paths.has(path), `${path} is gone: drop it from the allowlist`).toBe(true)
      const source = files.find((f) => f.path === path)?.source ?? ''
      expect(/\buseAppStore\b/.test(source), `${path} no longer names useAppStore: drop it from the allowlist`).toBe(true)
    }
  })

  it('never hands the real store to a drafted write', () => {
    const pattern = new RegExp(`\\b(${DRAFTED_WRITES.join('|')})\\(\\s*useAppStore\\b`)
    const offenders = files.filter((f) => pattern.test(f.source)).map((f) => `${f.path}: ${f.source.match(pattern)?.[1]}`)
    expect(offenders).toEqual([])
  })
})
