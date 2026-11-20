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
  eventsTabSub: (n: number) => `Additional invoices and credits awaiting review before the next billing run. ${n} in the queue.`,
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
  prepaymentNotCreditable: 'Crediting a prepayment invoice is not in this prototype yet.',
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
