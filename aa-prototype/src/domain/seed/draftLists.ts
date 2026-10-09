/**
 * The seed's Draft Lists (catch-up Phase 31; FT-01.6, US-01.6.1, US-01.6.2,
 * US-01.3.2 AC2, OQ-81 part 2). Two kinds:
 *
 * - three requests from surgeons' rooms, logged by the office before an
 *   anaesthetist was found (`SEED_DRAFT_LISTS`). LD-001 is St George's PM on
 *   the S2 day (the mockup's "surgeon TBC" block, now with its surgeon named,
 *   US-01.3.1); LD-002 already holds two Bookings (US-01.6.1 "Bookings
 *   allowed") and fits Dr Souter's free Wed 22 PM (the PWA stand-in's first
 *   pick); LD-003 is the long wait, with Ms A. Reid, not preferred with Dr
 *   Sharma (Phase 17's seed), so assigning it shows the not-preferred group.
 * - the recurring clashes from today on: a recurring booking on a session the
 *   anaesthetist had already marked closed becomes a Draft List, through the
 *   same `recurringClashDraft` the store uses, stamped at the seed's notional
 *   overnight paint run. Days before today get none (history is never
 *   rewritten).
 *
 * Every timestamp here is a constant, never the clock.
 */

import type { AuditEntry, Booking, DraftList, Procedure, RecurringBooking, Slot } from '../types'
import { DEMO_TODAY } from '../clock'
import { normaliseClash, recurringClashDraft } from '../draftLists'
import type { RecurringClash } from './canvas'
import { HOSP, SURG } from './cast'
import { PAT } from './patients'

/** Who logged the seeded requests. */
const OFFICE = 'Kirsty W.'

/** The seed's notional overnight paint run: recurring clashes wait from here ("7 h" at 08:00). */
export const SEED_CLASH_RUN_ISO = `${DEMO_TODAY}T00:05:00`

/** The engine's name on the seed's recurring-clash Draft Lists. */
export const SEED_CLASH_BY = 'System'

export const SEED_DRAFT_LIST_IDS = {
  stGeorges: 'LD-001',
  forte: 'LD-002',
  eyeSurgery: 'LD-003',
} as const

export const SEED_DRAFT_LISTS: readonly DraftList[] = [
  {
    id: SEED_DRAFT_LIST_IDS.stGeorges,
    state: 'DRAFT',
    dateISO: DEMO_TODAY,
    session: 'PM',
    kind: 'private',
    hospitalId: HOSP.stg,
    surgeonId: SURG.tan,
    conflicts: [],
    notes: "St George's booking office needs an anaesthetist",
    draft: { origin: 'request', source: 'phone', sinceISO: '2026-07-20T15:40:00', by: OFFICE },
  },
  {
    id: SEED_DRAFT_LIST_IDS.forte,
    state: 'DRAFT',
    dateISO: '2026-07-22',
    session: 'PM',
    kind: 'private',
    hospitalId: HOSP.forte,
    surgeonId: SURG.nand,
    conflicts: [],
    notes: "Emailed by Mr Nand's secretary",
    draft: { origin: 'request', source: 'email', sinceISO: '2026-07-20T17:10:00', by: OFFICE },
  },
  {
    id: SEED_DRAFT_LIST_IDS.eyeSurgery,
    state: 'DRAFT',
    dateISO: '2026-07-27',
    session: 'AM',
    kind: 'private',
    hospitalId: HOSP.ces,
    surgeonId: SURG.reid,
    conflicts: [],
    notes: 'PDF from the rooms, cataract list',
    draft: { origin: 'request', source: 'pdf', sinceISO: '2026-07-17T09:50:00', by: OFFICE },
  },
]

/**
 * LD-002's two Bookings, appended after every other seeded Booking (their ids
 * follow the builder's counters, so no existing id moves). Patient-paid after
 * the procedure, on no prepaid category, so no prepayment, warning or fee
 * figure elsewhere moves. Phases 20a and 21 (source wording, payer on the
 * Booking) are not built yet: the request's wording rides on the Booking note.
 */
export function seedDraftListBookings(next: { booking: number; procedure: number }): {
  bookings: Booking[]
  procedures: Procedure[]
  next: { booking: number; procedure: number }
} {
  const specs = [
    { patientId: PAT.gray, time: '13:30', description: 'Tonsillectomy', code: '41764', note: 'Secretary\'s email: "adult tonsils, recurrent tonsillitis"' },
    { patientId: PAT.sinclair, time: '15:00', description: 'Septoplasty', code: '41789', note: 'Secretary\'s email: "septum, blocked left side"' },
  ]
  const bookings: Booking[] = []
  const procedures: Procedure[] = []
  let b = next.booking
  let p = next.procedure
  for (const spec of specs) {
    const bookingId = `BK${String(b).padStart(4, '0')}`
    bookings.push({
      id: bookingId,
      listId: SEED_DRAFT_LIST_IDS.forte,
      patientId: spec.patientId,
      scheduledTime: spec.time,
      completed: false,
      source: 'admin',
      attachments: [],
      notes: spec.note,
      lastModifiedBy: OFFICE,
      lastModifiedAtISO: '2026-07-20T17:10:00',
    })
    procedures.push({
      id: `P${String(p).padStart(4, '0')}`,
      bookingId,
      description: spec.description,
      rvgBaseCode: spec.code,
      accRelated: false,
      isAdditional: false,
      selectedModifierCodes: [],
      billingRoute: 'billableParty',
      patientPaymentCategory: 'selfFundedPostProcedure',
    })
    b += 1
    p += 1
  }
  return { bookings, procedures, next: { booking: b, procedure: p } }
}

/** The recurring clashes from today on, as Draft Lists (the store's rule, applied at the seed's paint run). */
export function seedRecurringClashDraftLists(
  clashes: readonly RecurringClash[],
  slots: Readonly<Record<string, Slot>>,
  recurringBookings: readonly RecurringBooking[],
): DraftList[] {
  const byId = new Map(recurringBookings.map((r) => [r.id, r]))
  const out: DraftList[] = []
  for (const clash of clashes) {
    const normalised = normaliseClash(clash, slots)
    const rb = byId.get(clash.recurringBookingId)
    if (normalised === undefined || rb === undefined) continue
    const draft = recurringClashDraft(normalised, rb, DEMO_TODAY, SEED_CLASH_RUN_ISO, SEED_CLASH_BY)
    if (draft !== null) out.push(draft)
  }
  return out
}

/** The creation audit rows, so each seeded Draft List's History starts where it was logged. */
export function seedDraftListAudit(drafts: readonly DraftList[]): AuditEntry[] {
  return drafts.map((d) => ({
    id: `seed-draft-${d.id}`,
    entityType: 'list',
    entityId: d.id,
    who: d.draft.by,
    role: d.draft.origin === 'request' ? 'office' : 'system',
    source: d.draft.origin === 'request' ? 'office' : 'system',
    action: d.draft.origin === 'request' ? 'draftList.create' : 'draftList.fromRecurringClash',
    atISO: d.draft.sinceISO,
    after: {
      state: 'DRAFT',
      dateISO: d.dateISO,
      session: d.session,
      hospitalId: d.hospitalId,
      surgeonId: d.surgeonId,
      origin: d.draft.origin,
      ...(d.draft.source !== undefined ? { source: d.draft.source } : {}),
      ...(d.recurringBookingId !== undefined ? { recurringBookingId: d.recurringBookingId } : {}),
      ...(d.draft.fromAnaesthetistId !== undefined ? { fromAnaesthetistId: d.draft.fromAnaesthetistId } : {}),
    },
  }))
}

/**
 * The demo's canned incoming requests (catch-up Phase 31's "Simulate incoming
 * request" and "Add Draft List for this day"). Days are relative to the demo
 * clock (`nextWeekday`), never fixed. The default, Christchurch Eye Surgery
 * with Ms A. Reid on the next Thursday PM, lands where Dr Sharma's session is
 * open on the pristine seed, so she shows in the not-preferred group.
 */
export const CANNED_DRAFT_LIST_REQUESTS = [
  { id: 'ces-reid-thu-pm', hospitalId: HOSP.ces, surgeonId: SURG.reid, weekday: 4, session: 'PM', source: 'email', note: 'Emailed by the rooms' },
  { id: 'forte-nand-mon-am', hospitalId: HOSP.forte, surgeonId: SURG.nand, weekday: 1, session: 'AM', source: 'pdf', note: 'PDF from the rooms' },
  { id: 'stg-tan-fri-am', hospitalId: HOSP.stg, surgeonId: SURG.tan, weekday: 5, session: 'AM', source: 'phone', note: "St George's booking office rang" },
] as const satisfies readonly { id: string; hospitalId: string; surgeonId: string; weekday: number; session: 'AM' | 'PM'; source: 'phone' | 'email' | 'pdf' | 'other'; note: string }[]

/** "Add Draft List for this day": one per session (catch-up Phase 31). */
export const CANNED_DAY_DRAFT_LISTS = [
  { id: 'am-stg-tan', hospitalId: HOSP.stg, surgeonId: SURG.tan, session: 'AM', source: 'phone' },
  { id: 'pm-forte-nand', hospitalId: HOSP.forte, surgeonId: SURG.nand, session: 'PM', source: 'phone' },
] as const
