/**
 * The Matching screen's words (catch-up Phase 33; US-02.1.1 to US-02.1.4).
 * Display only: every rule lives in `domain/intake/matching.ts`. App copy says
 * "import", never "download", and "session", never "slot".
 */

import type { ChangeType, ImportChannel, ImportDecision, ImportRow, IncomingBookingFields } from '../../../domain/types'
import { CHANGE_TYPE_LABELS, listOwnerLabel, sessionLabel, type MatchingView } from '../../../domain/intake'
import { hhmm, plural, shortDay } from '../../../shared/format'
import type { PillTone } from '../../../shared/ui'
import { DRAFT_LIST } from '../../../shared/scheduleTerms'

/** The channel's micro-cap under the hospital: the samples stand in for each hospital's file (OQ-13). */
export const CHANNEL_CAPS: Record<ImportChannel, string> = {
  download: 'Sample file',
  manualSheet: 'Keyed sheet',
  // Fired from Future scope: HL7 and FHIR (catch-up Phase 34): never presented as an in-scope feed.
  feedMessage: 'Future-scope HL7 demo',
  pdfList: 'Rooms PDF',
}

/** A rooms row's micro-cap (catch-up Phase 34): "Rooms PDF · Mr C. Okafor". */
export function roomsCap(fields: IncomingBookingFields): string {
  return `Rooms PDF · ${fields.surgeon?.name ?? 'the surgeon'}`
}

/** Change-type pills: neutral sunken for New, Modification and No change; the error tint only for a Cancellation. */
export function changeTypePill(changeType: ChangeType): { label: string; tone: PillTone } {
  return { label: CHANGE_TYPE_LABELS[changeType], tone: changeType === 'cancellation' ? 'error' : 'neutral' }
}

/** Every field the hospital did not supply, in words (FT-02.1's note), or null when nothing is missing. */
export function missingFields(fields: IncomingBookingFields): string | null {
  const out: string[] = []
  if (fields.patient.nhi === undefined || fields.patient.nhi.trim() === '') out.push('NHI')
  if (fields.patient.dobISO === undefined || fields.patient.dobISO === '') out.push('date of birth')
  if (fields.surgeon === undefined) out.push('surgeon')
  if (fields.scheduledTime === undefined) out.push('time')
  if (fields.procedure?.text === undefined || fields.procedure.text.trim() === '') out.push('procedure wording')
  if (out.length === 0) return null
  const list = out.length === 1 ? out[0]! : `${out.slice(0, -1).join(', ')} and ${out[out.length - 1]}`
  return `Missing from the hospital: ${list}`
}

/** "Tue 28 Jul AM · 08:30" */
export function whenText(fields: IncomingBookingFields): string {
  return `${sessionLabel(fields.dateISO, fields.session)}${fields.scheduledTime !== undefined ? ` · ${fields.scheduledTime}` : ''}`
}

/** The insurer as the hospital sent it: "nib · Approval 1234567". */
export function insurerText(fields: IncomingBookingFields): string | null {
  const i = fields.insurer
  if (i === undefined) return null
  return i.approvalNumber !== undefined ? `${i.text} · Approval ${i.approvalNumber}` : i.text
}

/** "Applied: Booking created on Dr Souter's Tue 28 Jul AM List" and the other decisions' first words. */
export function decisionText(view: Pick<MatchingView, 'lists' | 'anaesthetists' | 'bookings'>, row: ImportRow, decision: ImportDecision): string {
  const fields = row.incoming
  const who = (bookingId: string) => view.bookings[bookingId]?.patient.name ?? fields.patient.name
  switch (decision.kind) {
    case 'reject':
      return `Rejected: ${decision.reason}`
    case 'createBooking': {
      const list = view.lists[decision.listId]
      if (list === undefined) return 'Applied: Booking created'
      const owner = listOwnerLabel(view, list)
      return list.anaesthetistId === undefined
        ? `Applied: Booking created on the ${DRAFT_LIST} for ${sessionLabel(list.dateISO, list.session)}`
        : `Applied: Booking created on ${owner}'s ${sessionLabel(list.dateISO, list.session)} List`
    }
    case 'createList': {
      const list = view.lists[decision.listId]
      return list === undefined
        ? 'Applied: List and Booking created'
        : `Applied: List and Booking created in ${listOwnerLabel(view, list)}'s ${sessionLabel(list.dateISO, list.session)} session`
    }
    case 'createDraft':
      return `Applied: ${DRAFT_LIST} and Booking created for ${sessionLabel(fields.dateISO, fields.session)}`
    case 'match': {
      if (decision.changeType === 'cancellation') return `Applied: ${who(decision.bookingId)}'s Booking cancelled`
      const n = decision.fieldsApplied.length + (decision.picks?.contract !== undefined ? 1 : 0) + (decision.picks?.rvgGroupId !== undefined ? 1 : 0)
      if (n === 0) return `Marked as matched: ${who(decision.bookingId)}'s Booking`
      return `Applied: ${plural(n, 'change')} to ${who(decision.bookingId)}'s Booking`
    }
  }
}

/** "Kirsty W. 09:14", or with the day when it was not today: "Kirsty W. · Tue 21 Jul 09:14". */
export function byWhen(row: Pick<ImportRow, 'decidedBy' | 'decidedAtISO'>, todayISO: string): string {
  if (row.decidedAtISO === undefined) return row.decidedBy ?? ''
  const day = row.decidedAtISO.slice(0, 10) === todayISO ? '' : `${shortDay(row.decidedAtISO)} `
  return `${row.decidedBy ?? ''} ${day}${hhmm(row.decidedAtISO)}`.trim()
}

/** Quick reject reasons (work item 10). */
export const QUICK_REJECT_REASONS = ['Not an AA booking', 'Duplicate of another row', 'Wrong hospital or date'] as const
