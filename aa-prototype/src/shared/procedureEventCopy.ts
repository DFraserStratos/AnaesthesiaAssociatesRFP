/**
 * Every word the app shows about events on a Procedure (catch-up Phase 38b;
 * FT-03.7, US-03.7.3, US-08.6.3). PWA-safe: no React, no app import.
 *
 * Greg was not convinced by the name "event" (FT-03.7, 2026-10-02 #44) and
 * offered nothing else: rename it here only. Every surface, and every store
 * sentence that names an event, reads its words from this file. No en or em
 * dash in any string.
 */

import type { ProcedureEventKind } from '../domain/types'
import type { ProcedureEventStatus } from '../domain/billing/procedureEvent'
import { drSurname } from './format'

export const EVENT_LABELS = {
  /** The section heading under each Procedure. */
  section: 'Events',
  /** Admin's empty line (the anaesthetist apps hide the section when empty). */
  empty: 'No events on this Procedure yet.',
  review: 'Review',
  approve: 'Approve for billing',
  decline: 'Decline',
  edit: 'Edit',
  remove: 'Remove',
  /** The button on the Procedure's Contract row, Admin. */
  createAdditional: 'Create additional invoice',
  /** The same button on mobile and web, on the anaesthetist's own Procedure. */
  raiseAdditional: 'Raise additional invoice',
  saveForReview: 'Save for review',
  raisedByYou: 'Raised by you',
  raisedByOffice: 'Raised by the office',
  /** "Raised by Dr Souter". */
  raisedBy: (name: string) => `Raised by ${name}`,
  /** Admin Review's tabs. */
  listsTab: 'Lists',
  eventsTab: 'Events',
  /** The Billing monitor panel. */
  awaitingRunTitle: 'Waiting for the next billing run',
  /** The review sheet. */
  approveNote: 'Approved events are invoiced in the next billing run.',
  approvedResult: 'Approved. Invoiced in the next billing run.',
  declineReasonLabel: 'Reason (shown to whoever raised it)',
  declinedReason: (reason: string) => `Declined: ${reason}`,
  sameAsOriginal: 'Same as the original invoice',
  removeConfirm: 'Remove this event? It has not been invoiced.',
  /** Review's Events tab with nothing waiting. */
  queueEmpty: 'No events awaiting review.',
  /** A row's lines beyond the first ("+2 lines"). */
  moreLines: (n: number) => `+${n} ${n === 1 ? 'line' : 'lines'}`,
  exGst: 'ex GST',
} as const

export const EVENT_KIND_LABEL: Record<ProcedureEventKind, string> = {
  additionalInvoice: 'Additional invoice',
}

export const EVENT_STATUS_LABEL: Record<ProcedureEventStatus, string> = {
  notBillable: 'Not invoiced',
  awaitingReview: 'Awaiting review',
  approved: 'Approved · invoiced in the next billing run',
  invoiced: 'Invoiced',
  declined: 'Declined',
}

/** The audit viewer's words for the event actions (`shared/audit/actionLabels.ts` spreads these). */
export const EVENT_ACTION_LABELS: Record<string, string> = {
  'procedureEvent.add': 'Event raised',
  'procedureEvent.update': 'Event edited',
  'procedureEvent.remove': 'Event removed',
  'procedureEvent.approve': 'Event approved for billing',
  'procedureEvent.decline': 'Event declined',
  'procedureEvent.invoiced': 'Event invoiced',
}

/** Store sentences that name an event (refusals and results). */
export const EVENT_MESSAGES = {
  notFound: 'Event not found.',
  approvedLocked: 'This event is approved. It is invoiced in the next billing run.',
  invoicedLocked: 'This event is invoiced. Correct it with a credit note.',
  notYours: 'You can change only an event you raised on your own Procedure.',
  officeOnlyReview: 'Only the office reviews events.',
  notAwaiting: 'Only an event awaiting review can be approved or declined.',
  giveReason: 'Give a reason.',
  nothingToRun: 'No approved events are waiting for the billing run.',
} as const

/**
 * Who raised an event, one way everywhere: "Raised by you" to the anaesthetist
 * who raised it, "Raised by the office" for an office event, else "Raised by
 * Dr Souter".
 */
export function raisedByText(addedBy: { role: string; who: string; anaesthetistId?: string }, viewer?: { role: string; anaesthetistId?: string }): string {
  if (addedBy.role === 'office') return EVENT_LABELS.raisedByOffice
  if (viewer?.role === 'anaesthetist' && viewer.anaesthetistId !== undefined && addedBy.anaesthetistId === viewer.anaesthetistId) return EVENT_LABELS.raisedByYou
  return EVENT_LABELS.raisedBy(drSurname(addedBy.who))
}

/** The additional invoice form's notes. */
export const ADDITIONAL_INVOICE_COPY = {
  title: (patient: string, procedure: string) => `Additional invoice · ${patient} · ${procedure}`,
  additionalTo: (number: string) => `Additional to ${number}`,
  dateLabel: 'Date of the charge',
  partyLabel: 'Billed to',
  otherParty: 'Another billable party',
  sameAsWithName: (name: string) => `Same as the original invoice (${name})`,
  linesLabel: 'Lines',
  description: 'Description',
  quantity: 'Quantity',
  amount: 'Amount',
  addLine: 'Add line',
  removeLine: 'Remove line',
  subtotal: 'Subtotal',
  gst: 'GST',
  total: 'Total',
  saveNote: "It goes through the office's review step and is invoiced in the next billing run.",
  pickParty: 'Pick who to bill.',
  keepIt: 'Keep it',
  openBooking: 'Open the Booking',
  /** The invoice document's line under the number. */
  relatesTo: (number: string, procedure: string) => `Additional invoice · relates to ${number} · ${procedure}`,
  additionalInvoicesCard: 'Additional invoices',
  plusAdditional: (n: number) => `+${n} additional ${n === 1 ? 'invoice' : 'invoices'}`,
} as const
