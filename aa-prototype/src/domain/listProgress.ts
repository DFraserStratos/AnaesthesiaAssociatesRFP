/**
 * Where a List stands for its anaesthetist (catch-up Phase 38a; US-07.4.1,
 * US-07.4.2, FT-07.4, US-07.2.1). Pure: one exit predicate and one label source
 * that the mobile List rows, the web Lists table, the week strip and the search
 * rows all read, so the apps cannot drift on when a List leaves the main view or
 * what it is called meanwhile.
 */

import type { Booking, List } from './types'

/**
 * True once the List has left the anaesthetist's main view: when the office
 * authorises it (OQ-31, owner decision D9 as changed 2026-10-16). Not at submit,
 * not when the billing run stamps `billedAtISO`, not on payment. A List that has
 * left is found by search on patient name, NHI or date (US-03.1.6). Change only
 * this predicate if the exit moves again.
 */
export function hasLeftMainView(list: Pick<List, 'state'>): boolean {
  return list.state === 'AUTHORISED'
}

/** A List's progress, from its anaesthetist's side. */
export type ListProgress =
  /**
   * A Booking still to complete: ACTIVE and dated today or earlier, or
   * SUBMITTED with a Booking reopened or added since submit (owner, 2026-11-10:
   * she sees what blocks the office's authorise).
   */
  | 'toFinish'
  /** ACTIVE with at least one Booking and every Booking complete. */
  | 'readyToSubmit'
  /** SUBMITTED with every Booking complete: on the main view, less prominent, still editable (D63). */
  | 'submitted'
  /** AUTHORISED with its invoices raised (`billedAtISO` stamped). */
  | 'invoiced'
  /** AUTHORISED with no billing stamp yet (a billing failure, say). */
  | 'authorised'
  /** Anything else: upcoming work, or an ACTIVE List with no Booking. */
  | 'upcoming'

/** The one source of these labels (no screen spells them itself). */
export const LIST_PROGRESS_LABEL: Readonly<Record<ListProgress, string>> = {
  toFinish: 'To finish',
  readyToSubmit: 'Ready to submit',
  submitted: 'Done · unbilled',
  invoiced: 'Invoiced',
  authorised: 'Authorised',
  upcoming: '',
}

/**
 * The List's progress. `activeBookings` are its non-cancelled Bookings (the
 * caller filters); `todayISO` is the demo clock's date.
 */
export function listProgress(
  list: Pick<List, 'state' | 'dateISO' | 'billedAtISO'>,
  activeBookings: readonly Pick<Booking, 'completed'>[],
  todayISO: string,
): ListProgress {
  if (list.state === 'AUTHORISED') return list.billedAtISO !== undefined ? 'invoiced' : 'authorised'
  const total = activeBookings.length
  const done = activeBookings.filter((b) => b.completed).length
  // A reopened or added Booking blocks authorise: she sees it as to finish (owner, 2026-11-10).
  if (list.state === 'SUBMITTED') return done < total ? 'toFinish' : 'submitted'
  if (list.state !== 'ACTIVE') return 'upcoming'
  if (total === 0) return 'upcoming'
  if (done === total) return 'readyToSubmit'
  return list.dateISO <= todayISO ? 'toFinish' : 'upcoming'
}
