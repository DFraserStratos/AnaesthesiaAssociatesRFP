/**
 * Stubs on a List (catch-up Phase 33a; FT-02.6, US-02.6.1 to US-02.6.3,
 * DM-58, D66). Pure and PWA-safe: no React, no store, no clock.
 *
 * An incoming booking with no NHI waits in the unmatched queue and creates no
 * Booking (D11); a stub, a record of its own and never a Booking, stands in its
 * place on the List the row would land on until the office resolves the row at
 * intake.
 */

import type { ImportRow, IsoDateTime, ListState, Stub, WallTime } from '../types'
import { effectiveIncoming } from './matching'
import { isBlankText } from '../billing/procedureStack'

/**
 * Our readings, labelled once (the app shows `STUB_READINGS_CAPTION` in the
 * stub sheet; the owner's review list repeats them). OQ-118 says stubs stand
 * until the office resolves them from intake, and no more.
 */
export const STUB_READINGS = [
  "The Booking takes the stub's place on the List once the office adds the NHI (US-02.6.3).",
  'A stub shows the patient name, procedure wording and time as received, the reason and the source (US-02.6.2).',
  "A List holding a stub never reads complete: the stub's own marking and a note beside the progress, with no warning, to-do entry or prompt; a List holding only a stub can be neither submitted nor authorised (US-02.6.1, US-02.6.4).",
  'No stub when the row has no List to land on, or its List is authorised, or the row is a cancellation.',
  'A stub follows its List when the List is reassigned or moved.',
  'Removing or re-dating a Draft List takes its stub off; the row keeps waiting.',
  "A row the office decides onto another List resolves the stub, and the Booking appears there.",
] as const

/** The one in-app line naming the readings (the stub sheet). */
export const STUB_READINGS_CAPTION = 'How a stub reads is our reading, to confirm with AA.'

/** The reason, in words, for each `StubReason`. */
export const STUB_REASON_TEXT: Readonly<Record<Stub['reason'], string>> = {
  noNhi: 'Waiting at intake: no NHI',
}

/** Who acts on a stub, in words. */
export const STUB_OWNER_TEXT = 'The office is resolving this'

/** The List a stub would stand on: what the matcher's `targetListId` names. */
export interface StubLandingList {
  id: string
  state: ListState
}

/**
 * The stub a staged row places (US-02.6.1), or undefined when the row has an
 * NHI, has no List to land on, or that List is AUTHORISED (our reading).
 * `id` is filled by the store from its counter.
 */
export function stubFor(
  row: Pick<ImportRow, 'id' | 'incoming' | 'corrections'>,
  landingList: StubLandingList | undefined,
  sourceLabel: string,
  createdAtISO: IsoDateTime,
): Omit<Stub, 'id'> | undefined {
  const fields = effectiveIncoming(row)
  const nhi = fields.patient.nhi
  if (nhi !== undefined && nhi.trim() !== '') return undefined
  if (fields.hospitalStatus === 'cancelled') return undefined
  if (landingList === undefined || landingList.state === 'AUTHORISED') return undefined
  const text = fields.procedure?.text
  return {
    listId: landingList.id,
    importRowId: row.id,
    reason: 'noNhi',
    asReceived: {
      patientName: fields.patient.name,
      ...(text !== undefined && !isBlankText(text) ? { procedureText: text } : {}),
      ...(fields.scheduledTime !== undefined ? { scheduledTime: fields.scheduledTime } : {}),
      hospitalId: fields.hospitalId,
      sourceLabel,
    },
    createdAtISO,
    status: 'standing',
  }
}

/** A List's standing stubs, by time as received (untimed last), then id. */
export function stubsOnList(stubs: Readonly<Record<string, Stub>> | readonly Stub[], listId: string): Stub[] {
  const all = Array.isArray(stubs) ? (stubs as readonly Stub[]) : Object.values(stubs as Record<string, Stub>)
  return all
    .filter((s) => s.listId === listId && s.status === 'standing')
    .sort((a, b) => (a.asReceived.scheduledTime ?? '99:99').localeCompare(b.asReceived.scheduledTime ?? '99:99') || a.id.localeCompare(b.id))
}

/**
 * The stub guard's one reason (US-02.6.4, DM-18): read by `submitList`'s and
 * `authoriseList`'s refusals, `authoriseBlockersFor`, `SubmitListSheet` and the
 * office stand-in. Our wording.
 */
export const STUB_ONLY_REASON =
  'This List holds only a booking waiting at intake, with no NHI yet. The office has to resolve it before the List can be submitted or authorised.'

/**
 * The stub guard's pure rule (US-02.6.4): a List is held when a stub stands on
 * it and it has no Booking that is not cancelled. A List with any live Booking
 * is never held up by its stub.
 */
export function listHeldByStub(activeBookingCount: number, standingStubCount: number): boolean {
  return standingStubCount > 0 && activeBookingCount === 0
}

/** "1 waiting at intake", "2 waiting at intake"; empty for none. */
export function listStubNote(count: number): string {
  return count > 0 ? `${count} waiting at intake` : ''
}

/**
 * Bookings and stubs in one time order for a List view: a Booking keeps its
 * own order key; a stub sorts by its time as received, after Bookings at the
 * same time. Untimed entries go last.
 */
export function withStubsInTimeOrder<B>(
  bookings: readonly B[],
  timeOf: (b: B) => WallTime | undefined,
  stubs: readonly Stub[],
): Array<{ kind: 'booking'; booking: B } | { kind: 'stub'; stub: Stub }> {
  type Entry = { kind: 'booking'; booking: B } | { kind: 'stub'; stub: Stub }
  if (stubs.length === 0) return bookings.map((booking) => ({ kind: 'booking', booking }))
  const out: Entry[] = bookings.map((booking) => ({ kind: 'booking', booking }))
  for (const stub of stubs) {
    const t = stub.asReceived.scheduledTime
    // Insert after the last Booking whose time is at or before the stub's (Bookings keep their own order).
    let at = out.length
    if (t !== undefined) {
      at = 0
      for (let i = 0; i < out.length; i++) {
        const e = out[i]!
        const et = e.kind === 'booking' ? timeOf(e.booking) : e.stub.asReceived.scheduledTime
        if (et !== undefined && et <= t) at = i + 1
      }
    }
    out.splice(at, 0, { kind: 'stub', stub })
  }
  return out
}
