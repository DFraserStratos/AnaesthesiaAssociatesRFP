/**
 * Every word the app shows about events on a Procedure (catch-up Phase 38b;
 * FT-03.7, US-03.7.3, US-08.6.3). PWA-safe: no React, no app import.
 *
 * Greg was not convinced by the name "event" (FT-03.7, 2026-10-02 #44) and
 * offered nothing else: rename it here only. Every surface, and every store
 * sentence that names an event, reads its words from this file. No en or em
 * dash in any string.
 */

import type { ProcedureEvent, ProcedureEventKind } from '../domain/types'
import type { ProcedureEventStatus } from '../domain/billing/procedureEvent'
import type { EventPricing, PrePostOpEventType } from '../domain/billing/prePostOpEvent'
import { drSurname, formatCurrency } from './format'

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
  /** The Events tab's page subtitle (the Lists tab keeps the queue's own). */
  eventsTabSub: (n: number) => `Pre-op, post-op and billing events, additional invoices and credits awaiting review before the next billing run. ${n} in the queue.`,
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
  // Catch-up Phase 39: a credit note in full, with its replacements.
  credit: 'Credit',
  // Catch-up Phase 39b: pre-op, post-op and billing events.
  preOp: 'Pre-op',
  postOp: 'Post-op',
  billing: 'Billing event',
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
  // Catch-up Phase 39b.
  'procedureEvent.backToReview': 'Event sent back to review',
  'invoice.eventLine': 'Event added to an invoice as a line',
  'invoice.eventInvoiceCreated': 'Event invoice raised',
  'contractEventFee.add': 'Contract event fee added',
  'contractEventFee.edit': 'Contract event fee edited',
  'contractEventFee.remove': 'Contract event fee removed',
}

/**
 * The audit viewer's words for a correction (catch-up Phase 39; US-13.5.2:
 * every step of a credit is its own entry). `actionLabels.ts` spreads these.
 */
export const CREDIT_ACTION_LABELS: Record<string, string> = {
  'credit.submitted': 'Credit submitted for review',
  'credit.partyChanged': 'Credit addressed to another party',
  'credit.updated': 'Credit edited',
  'credit.removed': 'Credit removed',
  'credit.approved': 'Credit approved for billing',
  'credit.declined': 'Credit declined',
  'credit.issued': 'Credit issued',
  'invoice.credited': 'Invoice credited in full',
  'invoice.rebilled': 'New invoice issued for a credited one',
  'creditNote.create': 'Credit note raised',
  'creditNote.sent': 'Credit note emailed',
  'creditNote.toPost': 'Credit note marked to post',
  'creditNote.notSent': 'Credit note not sent',
  'creditNote.xeroWaiting': 'Credit note waiting for Xero',
  'negativeInvoice.create': 'Negative invoice raised to the anaesthetist',
  'ledger.receivableCredited': 'Receivable credited in the ledger',
  'ledger.payableReversed': 'Payable reversed in the ledger',
  'xero.creditNoteCreated': 'Xero credit note created',
  'xero.accPayVoided': 'Xero bill voided',
  'xero.accPayCredited': 'Xero bill credited',
  'xero.correctionNoop': 'Xero correction already done',
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

/** Store sentences for a credit (catch-up Phase 39; US-08.6.5, OQ-97). No en or em dash. */
export const CREDIT_MESSAGES = {
  invoiceNotFound: 'Invoice not found.',
  /** Catch-up Phase 39a: Xero is paying this invoice's payable in a payment run; the credit waits for the run. */
  inPaymentRun: (week: string) => `Being paid in ${week}'s payment run. Credit it once the run is paid.`,
  reasonRequired: 'Give a reason for the credit.',
  notOwnProcedure: 'You can only credit invoices for your own procedures.',
  splitOfficeOnly: 'Only the office can split an invoice into additional invoices.',
  splitNeedsTwo: 'A split needs at least two new invoices.',
  alreadyCredited: 'This invoice is already credited.',
  correctionPending: 'A credit for this invoice is waiting for review.',
  /** Catch-up Phase 41: a cancelled Booking's prepayment was credited or refunded by the cancellation. */
  prepaymentBookingCancelled: "A cancelled booking's prepayment was settled when it was cancelled.",
  /** Catch-up Phase 41 (D31): a prepayment invoice is credited whole, never split. */
  prepaymentNoSplit: 'A prepayment invoice is credited in full. Raise an additional invoice for anything still owed.',
  /** Catch-up Phase 41: before the List is authorised, only the office credits a prepayment invoice. */
  prepaymentBeforeAuthorise: 'The office credits a prepayment invoice before the List is authorised.',
  aaFeeNotCreditable: 'AA fee invoices are not credited here.',
  noChargeNotCreditable: 'A no-charge invoice has nothing to credit.',
  invoiceEmailRequired: 'Add an invoice email for this billable party.',
  procedureNotOnInvoice: 'This Procedure is not on that invoice.',
  partOfCorrection: 'This invoice is part of a credit. Review, edit or remove the credit instead.',
  notACredit: 'That is not a credit.',
  invoiceCredited: 'This invoice was credited. Record the payment against the new invoice.',
  paidOutCredited: 'This invoice was credited. Its payable is reversed.',
  noPair: 'The invoice has no ledger pair to credit.',
} as const

/**
 * Every word the credit's screens show (catch-up Phase 39, work item 7): the
 * credit form and its wrappers, the entry points, the standing pills, the
 * credited banner, the credit note document and the rows that list them. No
 * en or em dash.
 */
export const CREDIT_LABELS = {
  /** The two entry buttons (the invoice rail, the Procedure's button slot). */
  creditNote: 'Credit note',
  creditRebill: 'Credit in full and rebill',
  /** The invoice rail card. */
  correctCard: 'Correct this invoice',
  correctCaption:
    'For an AA-side error, less work than expected or a split requested by the billable party. The invoice is never edited: it is credited in full and new invoices are issued. A disputed invoice with no AA error stays outstanding.',
  /** The sheet's title per mode, in 38b's pattern: "Credit note · David Chen · Hip hemiarthroplasty". */
  sheetTitle: (mode: 'credit' | 'rebill' | 'edit', patient: string, procedure: string): string =>
    `${mode === 'rebill' ? 'Credit in full and rebill' : mode === 'edit' ? 'Edit the credit' : 'Credit note'} · ${patient} · ${procedure}`,
  /** Under the title: "Credits AA-2026-H03 in full. Nothing on it is edited." */
  sheetDescription: (number: string) => `Credits ${number} in full. Nothing on it is edited.`,
  /** Which of the Procedure's live invoices to credit (a fee split has one per party). */
  whichInvoice: 'Invoice to credit',
  /** Step 1 and step 2 (step 2's name is `newInvoices`). */
  stepCredit: 'Credit',
  newInvoices: 'New invoices',
  /** The original's summary. */
  originalInvoice: 'Original invoice',
  billed: 'Billed to',
  total: 'Total',
  /** The party the credit note goes to. */
  creditTo: 'Credit note to',
  invoiceEmail: 'Invoice email',
  invoiceEmailHintTo: (to: string) => `Leave blank to send it to ${to}.`,
  invoiceEmailHintPost: 'Leave blank to post it to the party.',
  invoiceEmailHintNone: 'This party has no invoice address. Add an email.',
  /** The reason. */
  reason: 'Reason',
  reasonChipsLabel: 'Common reasons',
  reasonPlaceholder: 'Why is this invoice credited?',
  /** The office's chips and the anaesthetist's (work item 11). */
  officeReasons: ['Wrong billable party', 'Wrong amount', 'Less work than expected', 'Split requested', 'Paid twice'] as readonly string[],
  anaesthetistReasons: ['Less work than expected', 'Wrong billable party', 'Paid twice'] as readonly string[],
  /** The money state (the office's variant). */
  moneyState: 'What happens to the money',
  unpaid: 'Unpaid: nothing held.',
  heldForPayer: (paid: string, payer: string) => `Paid ${paid}: ${paid} will be held for ${payer}.`,
  payableOffset: (dr: string, amount: string) => `${dr}'s payment is reversed: a negative invoice for ${amount}, offset against the unpaid payable.`,
  payableNets: (dr: string, paid: string, amount: string) => `${dr} was paid ${paid}: a negative invoice for ${amount} nets in their next payment run.`,
  payableBoth: (dr: string, paid: string, amount: string, offset: string) =>
    `${dr} was paid ${paid}: a negative invoice for ${amount}, ${offset} offset against the unpaid payable and ${paid} netted in their next payment run.`,
  /** The anaesthetist's one sentence in place of the money state (work item 11). */
  yourPaymentReversed: 'Your payment for this invoice is reversed.',
  notARefund: 'A credit note is not a refund.',
  /** The trail preview. */
  trailTitle: 'On issue',
  trailDebit: 'Debit',
  trailCredit: 'Credit',
  trailContra: 'Contra',
  trailCreditNote: 'Credit note, numbered on issue',
  trailNegative: (dr: string) => `Negative invoice to ${dr}, numbered on issue`,
  trailNewInvoice: (party: string) => `New invoice to ${party}`,
  /** Step 2. */
  newInvoicesNone: 'No new invoice. The credit stands alone unless you add one.',
  newInvoiceTitle: (n: number) => `New invoice ${n}`,
  addInvoice: 'Add an invoice',
  removeInvoice: 'Remove this invoice',
  /** Submit, new or edited: 38b's verb. */
  submit: EVENT_LABELS.saveForReview,
  officeSubmitNote: 'Goes through the standard review step and is issued in the next run.',
  anaesthetistSubmitNote: 'The office reviews it, then it is issued in the next billing run.',
  /** The invoice's standing (neutral pills, never red). */
  pendingPill: 'Credit waiting for review',
  /** The standing pill, the credited original's total, the ledger pair's and the Xero sim's word. */
  credited: 'Credited',
  /** The credited original's line, around its links: "Credited in full by CN-2026-0001 on Tue 21 Jul 2026 · rebilled as AA-2026-0013". */
  creditedInFullBy: 'Credited in full by',
  on: 'on',
  rebilledAs: 'rebilled as',
  replacedBy: 'replaced by',
  /** A replacement's line under its number: "Rebills AA-2026-0007 (credited by CN-2026-0001)". */
  rebills: (number: string) => `Rebills ${number}`,
  creditedByParen: (cn: string) => `(credited by ${cn})`,
  /** The events list. */
  rebillOf: (number: string) => `Rebill of ${number}`,
  creditsInFull: (number: string) => `Credits ${number} in full`,
  /** The review queue's one row per correction. */
  reviewRow: (number: string, replacements: number) =>
    `Credit ${number} in full${replacements > 0 ? `, ${replacements} new ${replacements === 1 ? 'invoice' : 'invoices'}` : ''}`,
  newInvoice: 'New invoice',
  /** The credit note document. */
  documentHeading: 'CREDIT NOTE',
  dateIssued: 'Date issued',
  creditToDoc: 'Credit to',
  totalCredited: 'Total credited',
  deliveryCaption: 'Xero does not send credit notes; the engine sends it.',
  /** The holder layout's line under the addressee, as the invoice prints it. */
  attnAccounts: 'Attn: Accounts',
  negativeInvoiceCard: 'Negative invoice',
  negativeOffset: 'offset against the unpaid payable',
  negativeNets: (amount: string) => `${amount} nets in the next payment run`,
  newInvoicesNoneDoc: 'None. The credit stands alone.',
  xeroCard: 'Xero',
  xeroWaiting: 'Waiting for Xero',
  xeroAccPayVoided: 'Draft ACCPAY voided',
  xeroFailed: 'Xero correction failed · retry in Billing monitor',
  openBillingMonitor: 'Open the Billing monitor',
  /** The Invoices screen. */
  kind: 'Credit note',
  credits: (number: string) => `Credits ${number}`,
  /** A demo payment trigger on a credited invoice. */
  paymentDisabled: 'Invoice credited',

  // Session 2's screen words (work items 9 to 13), folded in from the old CREDIT_UI_LABELS.
  /** The office's copy of the original's lines on a new invoice card (US-08.6.6). */
  copyLines: "Start from a copy of the original's lines",
  /** The split (US-08.6.4). */
  splitButton: 'Split into additional invoices',
  /** "Split AA-2026-0002 into additional invoices", with the Contract under it. */
  splitTitle: (number: string) => `Split ${number} into additional invoices`,
  splitDescription: 'The original invoice is credited in full.',
  splitMustAddUp: 'The new invoices must add up to the credited invoice.',
  leftToAllocate: 'Left to allocate',
  splitBeforeGst: 'All before GST.',
  gstRounding: (amount: string) => `GST is rounded on each invoice, so the totals with GST differ by ${amount}. That is accepted.`,
  putTheRest: 'Put the rest on this invoice',
  restLine: 'Rest of the credited invoice',
  splitReason: 'Split requested',
  submitSplit: (n: number) => `Save ${n} invoices for review`,
  /** A split component's line under its number: "Additional invoice · part 2 of 3 · replaces AA-2026-0007 · Facelift". */
  splitPart: (part: number, of: number, number: string, procedure: string) => `Additional invoice · part ${part} of ${of} · replaces ${number} · ${procedure}`,
  /** The ledger (work item 12). */
  creditsHeldForPayers: 'Credits held for payers',
  creditsHeldSub: 'Paid on credited invoices, refunded outside the system',
  negativeToNet: 'Negative invoices to net',
  negativeToNetSub: 'Paid out on credited invoices',
  /** "Dr Sharma's credits": the ledger's trail heading. */
  creditsOf: (who: string) => `${who}'s credits`,
  trailStep: 'Step',
  trailRecord: 'Record',
  trailAmount: 'Amount',
  trailNewDebit: 'New debit',
  netsNextRun: 'Nets in the next payment run',
  offsetDone: 'Offset against the unpaid payable',
  /** The Billing monitor (work item 13). */
  correctionFailed: 'Xero correction failed',
  correctionAttempt: (n: number) => `attempt ${n}`,
  nextTry: 'next try',
  resolveAndRetry: 'Resolve and retry',
  /** The Xero sim pair detail. */
  xeroCreditNotes: 'Credit notes',
  xeroAllocated: 'Allocated',
  xeroUnallocated: 'Unallocated',
  xeroAccPayVoidedNote: 'The draft bill was voided: nothing had been authorised to pay.',
  xeroNewPairs: 'New pairs',
} as const

/** A credit event's status words where they differ from an additional invoice's (catch-up Phase 39): it is issued, not invoiced. */
export const CREDIT_STATUS_LABEL: Partial<Record<ProcedureEventStatus, string>> = {
  approved: 'Approved · issued in the next billing run',
  invoiced: 'Issued',
}

/** An event's status words, by kind: a credit reads "Issued" where an additional invoice reads "Invoiced". */
export function eventStatusLabel(kind: ProcedureEventKind, status: ProcedureEventStatus): string {
  return (kind === 'credit' ? CREDIT_STATUS_LABEL[status] : undefined) ?? EVENT_STATUS_LABEL[status]
}

/** A change flagged in Xero, in words (catch-up Phase 37; `paidAfterCredit` catch-up Phase 39). */
export const XERO_FLAG_LABEL: Record<'voidedInXero' | 'amendedInXero' | 'paidAfterCredit', string> = {
  voidedInXero: 'Voided in Xero',
  amendedInXero: 'Amended in Xero',
  paidAfterCredit: 'Paid in Xero after its credit',
}

/**
 * A flag in words, one way everywhere (the invoice's Ledger card, the Billing
 * monitor, the Xero panels): "Voided in Xero", "Paid in Xero after its credit
 * · $120.00", "Amended in Xero · total $1,910.00", with the time Xero changed
 * it after the label when given ("Amended in Xero 08:02 · total $1,910.00").
 * A `paidAfterCredit` flag on the payable (`leg: 'payable'`) is a payout, not
 * a payment: "Paid out in Xero after its credit · $120.00".
 */
export function xeroFlagText(kind: keyof typeof XERO_FLAG_LABEL, amount: number, at?: string, leg?: 'payable'): string {
  const label = kind === 'paidAfterCredit' && leg === 'payable' ? XERO_FLAG_PAYOUT_LABEL : XERO_FLAG_LABEL[kind]
  const head = at !== undefined ? `${label} ${at}` : label
  if (kind === 'voidedInXero') return head
  if (kind === 'paidAfterCredit') return `${head} · ${formatCurrency(amount)}`
  return `${head} · total ${formatCurrency(amount)}`
}

/** A `paidAfterCredit` flag on the payable: Xero paid the bill out after the credit. */
export const XERO_FLAG_PAYOUT_LABEL = 'Paid out in Xero after its credit'

/** What a flag leaves in the ledger, and where the office resolves it, after `xeroFlagText`. */
export const XERO_FLAG_COPY = {
  flagged: 'flagged',
  flaggedForOffice: 'flagged for the office.',
  ledgerKeepsIssued: 'The ledger keeps the amount issued.',
  ledgerIgnoresPayment: 'The ledger does not apply it.',
} as const

/** Result copy for a credit (catch-up Phase 39). */
export const CREDIT_COPY = {
  /** "1 credit note and 1 additional invoice raised" (the next billing run's result). */
  runResult: (creditNotes: number, invoices: number): string => {
    const parts: string[] = []
    if (creditNotes > 0) parts.push(`${creditNotes} credit ${creditNotes === 1 ? 'note' : 'notes'}`)
    if (invoices > 0 || creditNotes === 0) parts.push(`${invoices} additional ${invoices === 1 ? 'invoice' : 'invoices'}`)
    return `${parts.join(' and ')} raised`
  },
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

/** Store sentences for the split and the anaesthetist's credit entry (catch-up Phase 39 session 2, work items 10 and 11). No en or em dash. */
export const SPLIT_MESSAGES = {
  procedureNotFound: 'Procedure not found.',
  /** OQ-77 part 3 (D41): before sending, a split is a normal admin edit. */
  notYetInvoiced: "Not invoiced yet. Edit the Booking's Procedures, Contracts and prices instead.",
  /** Phase 41 credits a prepayment invoice. */
  prepaidNotSplittable: 'Splitting a prepaid combination is not in this prototype yet.',
} as const

/** The demo triggers' words for a credit (catch-up Phase 39 session 2, work item 14). No en or em dash. */
export const CREDIT_DEMO_COPY = {
  combinedStaged: 'Staged: a billed Merivale combination. Open its invoice and use Split into additional invoices.',
  alreadyStaged: 'Already staged',
  /** The result's link: "Open AA-2026-0002". */
  openInvoice: (number: string) => `Open ${number}`,
  stagePostOpFirst: 'Stage post-op scenario first',
  invoiceCredited: 'Invoice credited',
  creditWaiting: 'Credit waiting for review',
  alreadyPaidOut: 'Already paid out',
  kindNotHere: 'AA fee and prepayment invoices are not credited here',
  /** "Paid in full and paid out to Dr Sharma in Xero. Credit it to see the negative invoice." (Phase 37: payouts are made in Xero.) */
  paidOut: (dr: string) => `Paid in full, approved for payment and paid out to ${dr} in Xero. Credit it to see the negative invoice. Once credited, the negative invoice is netted in ${dr}'s next payment run.`,
  noCreditAwaiting: 'No credit on this Booking is awaiting review',
  /** "Approved by the office and issued in the next billing run (CN-2026-0001)." */
  creditIssued: (number: string) => `Approved by the office and issued in the next billing run (${number}).`,
} as const

/** Store sentences from the Phase 39 review: a credit that waits for Xero, a correction queued behind its original. No en or em dash. */
export const CREDIT_SYNC_MESSAGES = {
  /** The run's skip message while Xero holds money on the invoice that the ledger has not recorded yet. */
  waitingForXeroSync: 'Waiting for Xero to sync a payment on this invoice.',
  /** A correction queued behind the hand-off of the invoice it credits. */
  waitingForOriginal: 'Waiting for the invoice it credits to reach Xero.',
} as const

/** Store sentences for pre-op, post-op and billing events (catch-up Phase 39b). No en or em dash. */
export const EVENT_KIND_MESSAGES = {
  listUnassigned: 'Assign the List first.',
  feeNotOnContract: "This procedure's Contract has no fee for that type of event.",
  creditAfterInvoice: 'Credits after invoicing need a credit note. Use Credit note on this procedure.',
  officePriceInvalid: 'Type the price in dollars and cents, 0 or more and under $100,000.00.',
  officeReasonRequired: 'Give a reason for the price.',
  noOfficePriceOnBilling: 'A billing event is priced as typed. Edit its amount instead.',
  needsPrice: 'Needs a price: invoiced in the next run once priced.',
  creditTooBig: 'Needs a change: the credit is more than the invoice.',
  creditNoInvoice: "Needs a change: a credit rides on its party's invoice, and there is none to take it. Decline it or use Credit note.",
  creditWaits: "Waiting for its party's invoice: a credit is billed with the procedure's List.",
  pickType: { preOp: 'Pick a pre-op type.', postOp: 'Pick a post-op type.' },
  pickParty: 'Pick who to bill.',
} as const

// ---------------------------------------------------------------------------
// Pre-op, post-op and billing events (catch-up Phase 39b; US-03.7.1, US-03.7.2,
// US-05.5.2). The kind labels join EVENT_KIND_LABEL above. No en or em dash: a
// credit reads "-$40.00" with a plain hyphen.
// ---------------------------------------------------------------------------

/** The type names of a pre-op or post-op event (`EVENT_TYPES`). */
export const EVENT_TYPE_LABEL: Record<PrePostOpEventType, string> = {
  postOpWardReview: 'Post-op ward review',
  hduReview: 'HDU review',
  painConsult: 'Pain consult',
  accPreOpAssessment: 'ACC pre-op assessment',
  otherPreOp: 'Other pre-op',
  otherPostOp: 'Other post-op',
}

export const PRE_POST_OP_COPY = {
  /** The two buttons at the foot of a Procedure's events. */
  addPrePostOp: 'Add pre-op or post-op event',
  addBilling: 'Add billing event',
  /** The sheets' titles and primary action. */
  prePostOpTitle: 'Pre-op or post-op event',
  billingTitle: 'Billing event',
  addEvent: 'Add event',
  saveChanges: 'Save changes',
  preOp: 'Pre-op',
  postOp: 'Post-op',
  typeLabel: 'Type',
  dateLabel: 'Date',
  startLabel: 'Start time',
  recordTime: 'Record a time',
  fixedFee: 'Fixed fee',
  minutesLabel: 'Minutes',
  feeAmountLabel: 'Fee, ex GST',
  /** "40 min". */
  minutes: (n: number) => `${n} min`,
  /** An event's amount with a plain hyphen for a credit: "-$40.00", "$180.00". */
  amount: (n: number) => (n < 0 ? `-${formatCurrency(-n)}` : formatCurrency(n)),
  /** A timed event before the office prices it (US-03.7.1; the anaesthetist sees no calculation). */
  timePricingCaption: 'The office prices the time at review.',
  /** A Contract event fee shown read-only in the sheet. */
  contractFeeCaption: "Fixed fee under this procedure's Contract",
  /** The ACC presets' caption (OQ-12 part 1, provisional). */
  accCodesCaption: "Codes to confirm with AA's accountant (OQ-12).",
  /** The invoice tick. */
  invoiceTick: 'Invoice this event',
  invoiceTickCaption: 'Cleared: kept on the record, never invoiced.',
  /** The "same as" tick and its reading caption (US-03.7.1; our reading of Greg's courier comparison). */
  sameAsTick: 'Billed to the same party as the procedure',
  sameAsCaption: 'Our reading: the same party as the procedure unless you change it.',
  billTo: 'Bill to',
  /** The routing caption under the primary action (OQ-121, D69). */
  routingCaption: 'Reviewed by the office, then billed in the next run.',
  /** The billing event sheet. */
  charge: 'Charge',
  credit: 'Credit',
  descriptionLabel: 'What is this for?',
  amountLabel: 'Amount, ex GST',
  creditCaption: 'Reduces what is owed.',
  /** A credit once the Procedure is invoiced: 39's credit note is the route (a one-line credit note is not built). */
  creditAfterInvoice: 'Credits after invoicing need a credit note. Use Credit note on this procedure.',
  /** The review sheet. */
  setPrice: 'Set a price',
  officePriceLabel: 'Price, ex GST',
  officeReasonLabel: 'Reason for the price',
  officeReasonRequired: 'Give a reason for the price.',
  needsPrice: 'Needs a price: invoiced in the next run once priced.',
  creditTooBig: 'Needs a change: the credit is more than the invoice.',
  /** "Contract fee STGACC-PAIN · $120.00 replaces 40 min". */
  feeReplaces: (code: string | undefined, amount: string, minutes: number) => `Contract fee${code !== undefined && code !== "" ? ` ${code}` : ""} · ${amount} replaces ${minutes} min`,
  /** "45 min · 3 time units x $25.00 Contract rate = $75.00" (office only). */
  timeCalculation: (minutes: number, units: number, rate: string, origin: 'contractRate' | 'unitValue', amount: string, discountPercent?: number) =>
    `${minutes} min · ${units} time units x ${rate} ${origin === 'contractRate' ? 'Contract rate' : 'unit value'}${discountPercent !== undefined ? ` less ${discountPercent}%` : ''} = ${amount}`,
  /** The invoice line's lead, per kind. */
  lineLead: { preOp: 'Pre-op event', postOp: 'Post-op event', billing: 'Billing event', credit: 'Credit' },
  /** An event invoice's relates-to line: "Post-op event · relates to AA-2026-0012 · {Procedure}". */
  relatesTo: (lead: string, number: string, procedure: string) => `${lead} · relates to ${number} · ${procedure}`,
  /** An event invoice raised before its Procedure had one: "Post-op event · {Procedure}". */
  eventFor: (lead: string, procedure: string) => `${lead} · ${procedure}`,
  /** "+2 event lines" under an invoice number. */
  eventLines: (n: number) => `+${n} event ${n === 1 ? 'line' : 'lines'}`,
  /** "+1 event invoice" on a Billing monitor row. */
  eventInvoices: (n: number) => `+${n} event ${n === 1 ? 'invoice' : 'invoices'}`,
  /** The Contract editor's section. */
  eventFeesTitle: 'Event fees',
  eventFeesCaption: 'Fixed fees this Contract charges for a pre-op or post-op event, in place of the time recorded.',
  eventFeesEmpty: 'No event fees on this Contract.',
  addEventFee: 'Add event fee',
  holderCodeLabel: 'Holder code',
  holderDescriptionLabel: 'Description',
  fixedPriceLabel: 'Fixed price, ex GST',
  eventTypeHead: 'Event type',
  actionsHead: 'Actions',
  save: 'Save',
  cancel: 'Cancel',
  newFee: (field: string) => `New fee ${field.toLowerCase()}`,
  /** The minutes stepper's noun ("Fewer minutes", "More minutes"). */
  minutesNoun: 'minutes',
  priceLabel: 'Price',
  needsPriceShort: 'Needs a price',
  kindLabel: 'Pre-op or post-op',
  recordsLabel: 'Recorded as',
  directionLabel: 'Charge or credit',
} as const

/** An event's invoice-line lead (catch-up Phase 39b): "Pre-op event", "Post-op event", "Billing event", or "Credit" for a negative billing event. */
export function eventLineLead(detail: ProcedureEvent['detail'], amount?: number): string | undefined {
  if (detail.kind === 'preOp' || detail.kind === 'postOp') return PRE_POST_OP_COPY.lineLead[detail.kind]
  if (detail.kind === 'billing') return (amount ?? (detail.direction === 'credit' ? -1 : 1)) < 0 ? PRE_POST_OP_COPY.lineLead.credit : PRE_POST_OP_COPY.lineLead.billing
  return undefined
}

/** How an event's price reads to the office: the calculation, the Contract fee, the typed fee or the office's price (never shown to the anaesthetist). */
export function pricingText(p: EventPricing): string {
  switch (p.basis) {
    case 'time':
      return PRE_POST_OP_COPY.timeCalculation(p.minutes ?? 0, p.timeUnits ?? 0, formatCurrency(p.rate ?? 0), p.rateOrigin ?? 'unitValue', formatCurrency(p.amount), p.discountPercent)
    case 'contractEventFee':
      return p.replacedMinutes !== undefined
        ? PRE_POST_OP_COPY.feeReplaces(p.holderCode, formatCurrency(p.amount), p.replacedMinutes)
        : `Contract fee${p.holderCode !== undefined ? ` ${p.holderCode}` : ''} · ${formatCurrency(p.amount)}`
    case 'typedFixedFee':
      return `${PRE_POST_OP_COPY.fixedFee} · ${formatCurrency(p.amount)}`
    case 'billingEvent':
      return PRE_POST_OP_COPY.amount(p.amount)
    case 'officePrice':
      return `${PRE_POST_OP_COPY.setPrice} · ${formatCurrency(p.amount)}${p.officeReason !== undefined ? ` · ${p.officeReason}` : ''}`
  }
}

/**
 * A pre-op, post-op or billing event's row text: its type (and ACC code) or
 * description, what was recorded, and the amount the viewer may see once one
 * exists (the frozen price; a typed fee or charge as typed, a credit negative;
 * a Contract fee's fixed price). A time before review shows none: never a
 * calculation (`EVENT_RULES.anaesthetistSees`). Undefined for 38b's and 39's kinds.
 */
export function kindRowText(
  state: { masters: { contractEventFees: Record<string, { fixedPrice: number }> } },
  e: Pick<ProcedureEvent, 'detail' | 'pricing'>,
): { first: string; recorded: string; amount: number | undefined } | undefined {
  const d = e.detail
  if (d.kind === 'billing') {
    return { first: d.description, recorded: d.direction === 'credit' ? PRE_POST_OP_COPY.credit : PRE_POST_OP_COPY.charge, amount: e.pricing?.amount ?? (d.direction === 'credit' ? -d.amount : d.amount) }
  }
  if (d.kind !== 'preOp' && d.kind !== 'postOp') return undefined
  const r = d.recording
  const asRecorded = r.kind === 'fixedFee' ? (r.source === 'typed' ? r.amount : state.masters.contractEventFees[r.eventFeeId]?.fixedPrice) : undefined
  return {
    first: `${EVENT_TYPE_LABEL[d.type]}${d.code !== undefined ? ` · ${d.code}` : ''}`,
    recorded: r.kind === 'time' ? PRE_POST_OP_COPY.minutes(r.minutes) : PRE_POST_OP_COPY.fixedFee,
    amount: e.pricing?.amount ?? asRecorded,
  }
}

/**
 * The prepaid settlement block and the credit of a prepayment invoice (catch-up
 * Phase 41, work item 9; US-06.4.1, D31): the prepaid amount is the price, the
 * recorded BTM is for reference only (never a dollar figure), and nothing is
 * invoiced or credited automatically. No en or em dash.
 */
export const PREPAID_SETTLEMENT_COPY = {
  title: 'Prepaid settlement',
  prepaid: 'Prepaid',
  thePrice: 'the price for this procedure',
  recordedBtm: 'Recorded BTM',
  units: (n: number) => `${n} ${n === 1 ? 'unit' : 'units'}`,
  forReference: 'for reference only',
  /** "Moved from the AA Holding account to Dr Souter on 24 Jul". */
  moved: (to: string, day: string) => `Moved from the AA Holding account to ${to} on ${day}`,
  you: 'you',
  nothingAutomatic: 'Nothing is invoiced or credited automatically.',
  credited: 'Credited',
  additionalInvoice: 'Additional invoice',
  /** The credit form's notice on a prepayment invoice, before `CREDIT_LABELS.notARefund`. */
  creditWhole: 'This credits the whole prepayment invoice. Raise an additional invoice for anything still owed.',
} as const
