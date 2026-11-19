import { PAIRING_LABELS } from '../../domain/pairingPreferences'
import { CREDIT_ACTION_LABELS, EVENT_ACTION_LABELS } from '../procedureEventCopy'
import { DRAFT_LIST } from '../scheduleTerms'

/**
 * Human labels for the store's audit action codes (A7 presentation).
 *
 * The stored trail keeps its machine codes (`procedure.update`) — nothing here
 * changes what is written. This is the reading layer: the Booking history sheet
 * leads with the label, and the admin Audit viewer shows the label with the raw
 * code beneath it, so the compliance surface stays greppable.
 *
 * Every code emitted anywhere under `src/store/` or `src/domain/seed/` has an
 * entry; `auditNarrative.test.ts` scans the sources and fails if one is added
 * without a label. `actionLabel` still degrades gracefully (`entity.verb` ->
 * "Entity verb") so an unmapped code renders as English rather than blank.
 *
 * Copy rule (CLAUDE.md): no en/em dashes. Labels are past-tense statements of
 * what happened, because a history is a record, not an instruction.
 */

export const ACTION_LABELS: Record<string, string> = {
  // --- Bookings ---------------------------------------------------------------
  'booking.create': 'Booking created',
  'booking.update': 'Booking updated',
  // The office's explicit save's header (catch-up Phase 35): one per change set.
  'booking.save': 'Booking saved',
  'booking.complete': 'Booking completed',
  'booking.uncomplete': 'Booking reopened for amendment',
  'booking.cancel': 'Booking cancelled',
  'booking.reassign': 'Booking moved to another list',
  'booking.warningCleared': 'Warning cleared',
  'procedure.payer': 'Payer changed',
  'booking.insurance': 'Insurer or funder changed',
  'booking.warningSampleUnstaged': 'Sample warning removed',
  'booking.billed': 'Booking billed',
  'booking.prepaidSettled': 'Prepaid, left off the final invoice',
  'booking.billingException': 'Billing exception raised',
  'booking.lock': 'Contract locked at authorise',

  // --- Procedures & billing lines -----------------------------------------
  'procedure.create': 'Procedure added',
  'procedure.update': 'Procedure updated',
  'procedure.contract': 'Contract changed',
  'procedure.split': 'Fee split',
  'procedure.railAnswers': 'Invoice destination so far',
  'procedure.price': 'Price changed',
  'procedure.remove': 'Procedure removed',
  // Catch-up Phase 23 (US-03.2.2).
  'procedure.setPrimary': 'Primary procedure changed',
  // Catch-up Phase 20a (US-02.5.7, US-08.4.6).
  'procedure.procedureText.replace': 'Procedure text replaced',
  'procedure.invoiceDescription.set': 'Invoice description changed',
  'procedure.invoiceDescription.applyDefault': 'Newer description used on the invoice',
  'billingLine.add': 'Billing line added',
  'billingLine.remove': 'Billing line removed',

  // --- Lists ---------------------------------------------------------------
  'list.update': 'List updated',
  'list.submit': 'List submitted',
  'list.authorise': 'List authorised',
  'list.billed': 'List billed',
  'list.create': 'List assigned',
  'list.reassign': 'List reassigned',
  // Conflicts (catch-up Phase 30): raised and resolved by the one rule in
  // mutate(); cleared and flagged again by the office.
  'list.conflict': 'Conflict raised',
  'list.conflictResolved': 'Conflict resolved',
  'list.conflictCleared': 'Conflict cleared by the office',
  'list.conflictRestored': 'Conflict flagged again',
  'list.remove': 'List removed',
  // Catch-up Phase 31: Draft Lists (the words from the one terms module).
  'draftList.create': `${DRAFT_LIST} created`,
  'draftList.assign': `${DRAFT_LIST} assigned`,
  'draftList.redate': `${DRAFT_LIST} date changed`,
  'draftList.remove': `${DRAFT_LIST} removed`,
  'draftList.fromRecurringClash': `${DRAFT_LIST} created from a recurring booking (anaesthetist unavailable)`,
  'draftList.detach': `List returned to the office as a ${DRAFT_LIST}`,
  'list.phoneNote': 'Phone note logged',
  // Catch-up Phase 32: an anaesthetist moves her own List (to the office or a colleague).
  'list.ownerMove': 'List moved by its anaesthetist',
  // Catch-up Phase 32b (US-03.6.3, US-13.8.3).
  'notification.alert': 'Alert sent to the office',
  'notification.resolve': 'Notice resolved by the office',
  // Catch-up Phase 32a: an anaesthetist hands one Booking to a colleague (a new List for them).
  'booking.movedToAnaesthetist': 'Booking moved to a colleague',
  'list.pairingAcknowledged': `${PAIRING_LABELS.kind.NOT_PREFERRED} pairing assigned (warning acknowledged)`,

  // --- Sessions (catch-up Phase 28). A Slot's audit codes say "session", as
  // the Audit viewer prints the raw code and entity type beside the label. --
  'session.status': 'Availability set',
  'session.outOfHoursOpen': 'Out-of-hours session opened',
  'session.outOfHoursClose': 'Out-of-hours session closed',
  'session.times': 'Session times changed',

  // --- Availability (catch-up Phase 29): days off, repeating days off and the
  // availability status master. No code or label says "slot" (OQ-64). --------
  'availability.setRange': 'Availability set',
  'availability.cleared': 'Day off removed',
  'availability.seriesCreated': 'Repeating days off added',
  'availability.seriesDeleted': 'Repeating days off deleted',
  'availabilityStatus.create': 'Availability status added',
  'availabilityStatus.update': 'Availability status updated',
  'availabilityStatus.retire': 'Availability status retired',
  'availabilityStatus.restore': 'Availability status restored',

  // --- Canvas & scheduling masters ----------------------------------------
  'canvas.generate': 'Canvas generated',
  'canvas.rollForward': 'Canvas rolled forward',
  'canvas.trim': 'Sessions removed',
  'settings.scheduleDefaults': 'Default session times changed',
  'settings.horizon': 'Schedule horizon changed',
  'settings.prepaymentApprovalChanged': 'Pre-payment approval switched',
  'recurringBooking.create': 'Recurring booking added',
  'recurringBooking.update': 'Recurring booking updated',
  'recurringBooking.pairingAcknowledged': `${PAIRING_LABELS.kind.NOT_PREFERRED} pairing assigned (warning acknowledged)`,
  'recurringBooking.retire': 'Recurring booking retired',
  'recurringBooking.apply': 'Recurring bookings applied to the canvas',
  'holiday.create': 'Holiday added',
  'holiday.update': 'Holiday changed',
  'holiday.delete': 'Holiday deleted',
  'dayNote.add': 'Day note added',

  // --- People & payers -----------------------------------------------------
  'patient.create': 'Patient created',
  'patient.update': 'Patient updated',
  'patient.reuse': 'Existing patient matched',
  'patient.ethnicity.correct': 'Ethnicity code corrected',
  'anaesthetist.create': 'Anaesthetist added',
  'anaesthetist.update': 'Anaesthetist updated',
  'hospital.create': 'Hospital added',
  'hospital.update': 'Hospital updated',
  'surgeon.create': 'Surgeon added',
  'surgeon.update': 'Surgeon updated',
  'surgeonGroup.create': 'Surgeon group added',
  'surgeonGroup.update': 'Surgeon group updated',
  // Office-private (catch-up Phase 17): only Admin histories read these.
  'pairing.add': `${PAIRING_LABELS.entry} added`,
  'pairing.end': `${PAIRING_LABELS.entry} ended`,
  'anaesthetist.tierSet': 'Priority tier changed',
  // Catch-up Phase 18 (US-04.1.5).
  'party.create': 'Party added',
  'party.update': 'Party updated',
  // Catch-up Phase 18a (US-13.4.4, US-13.4.5).
  'specialty.create': 'Specialty added',
  'specialty.update': 'Specialty renamed',
  'specialty.remove': 'Specialty removed',
  'fundingTag.create': 'Funding tag added',
  'fundingTag.update': 'Funding tag updated',
  'fundingTag.move': 'Funding tag moved',
  'fundingTag.remove': 'Funding tag removed',
  // Catch-up Phase 19 (US-05.1.1).
  'rvgGroup.create': 'RVG group added',
  'rvgGroup.update': 'RVG group updated',
  'rvgGroup.retire': 'RVG group retired',
  'rvgGroup.restore': 'RVG group restored',
  // Catch-up Phase 19b (US-03.3.4, US-03.3.8, US-05.1.4, US-05.1.5).
  'procedure.modifierClaim': 'Modifier claimed',
  'procedure.modifiersConfirm': 'No modifiers claimed',
  'procedure.contractApprove': 'Contract change approved by the office',
  'procedure.modifierExplanation': 'Modifier explanation changed',
  'procedure.modifierUnclaim': 'Modifier claim removed',
  'procedure.modifierRemove': 'Pre-applied modifier removed',
  'procedure.modifierRestore': 'Pre-applied modifier put back',
  'modifier.create': "AA's own modifier added",

  // --- Master data: retire, the calendar, the time rule, loads (catch-up Phase 42) ---
  'hospital.retire': 'Hospital retired',
  'hospital.reinstate': 'Hospital reinstated',
  'surgeon.retire': 'Surgeon retired',
  'surgeon.reinstate': 'Surgeon reinstated',
  'surgeonGroup.retire': 'Surgeon group retired',
  'surgeonGroup.reinstate': 'Surgeon group reinstated',
  'modifier.retire': "AA's own modifier retired",
  'modifier.reinstate': "AA's own modifier reinstated",
  'modifier.update': 'Modifier changed',
  'publicHoliday.create': 'Public holiday added',
  'publicHoliday.update': 'Public holiday changed',
  'publicHoliday.delete': 'Public holiday deleted',
  'rvgTimeRule.update': 'RVG time rule changed',
  'masterLoad.stage': 'Spreadsheet checked',
  'masterLoad.recheck': 'Spreadsheet checked again',
  'masterLoad.commit': 'Spreadsheet loaded',
  'masterLoad.discard': 'Spreadsheet discarded',
  'goLive.stage': 'Go-live load prepared',
  'goLive.approve': 'Go-live name approved',
  'goLive.unapprove': 'Go-live name not approved',
  'goLive.commit': 'Go-live data loaded',
  'goLive.discard': 'Go-live load discarded',

  // --- Contracts -----------------------------------------------------------
  'contract.create': 'Contract created',
  'contract.update': 'Contract updated',
  'contract.disable': 'Contract disabled',
  'contract.enable': 'Contract made active',
  'contract.fallbackCreate': 'Fixed price Contract made by the system',
  // Catch-up Phase 19a (US-04.2.15): a fixed price's ranges.
  'contract.priceRange.add': 'Price range added',
  'contract.priceRange.update': 'Price range corrected',
  'contract.priceRange.delete': 'Price range deleted',

  // --- Billing run & invoices ---------------------------------------------
  'invoice.create': 'Invoice raised',
  'invoice.raisePrePayment': 'Pre-payment invoice raised',
  'invoice.prePaymentApproved': 'Pre-payment invoice approved and sent',
  'invoice.prePaymentAutoSent': 'Pre-payment invoice sent, approval off',
  'invoice.sent': 'Invoice emailed',
  'invoice.toPost': 'Invoice marked to post',
  'invoice.notSent': 'Invoice not sent',
  'invoice.resend': 'Invoice resent',
  // Catch-up Phase 38b: events on a Procedure and the additional invoice.
  'invoice.additionalCreated': 'Additional invoice raised',
  'invoice.partyChanged': 'Billed to another party',
  // The event actions' words live in the one copy map (the name "event" is provisional).
  ...EVENT_ACTION_LABELS,
  // Catch-up Phase 39: credit notes, negative invoices and the Xero correction.
  ...CREDIT_ACTION_LABELS,

  // --- Integrations --------------------------------------------------------
  'integration.receive': 'Message received',
  'feed.update': 'Feed mapping updated',

  // --- Matching screen (catch-up Phase 33) ----------------------------------
  'importBatch.create': 'Hospital bookings imported',
  'importRow.receive': 'Hospital row received',
  'importRow.correct': 'Hospital row corrected',
  'importRow.decide': 'Hospital row decided',
  'booking.fromHospitalRow': 'Hospital row applied to this Booking',

  // --- Stubs on a List (catch-up Phase 33a) ---------------------------------
  'stub.place': 'Stub placed on List',
  'stub.resolve': 'Stub replaced by Booking',
  'stub.remove': 'Stub removed',
  // The rooms' PDF lists and where a List came from (catch-up Phase 34).
  'pdfList.upload': 'PDF list uploaded',
  'pdfList.resend': 'Updated PDF list received',
  'pdfList.correct': 'PDF list row corrected',
  'pdfList.send': 'PDF list sent to matching',
  'list.senderChanged': 'List sender changed',

  // --- Xero simulation & money movement -----------------------------------
  'xero.pairCreated': 'Xero invoice pair created',
  'xero.handoffNoop': 'Xero handoff already done',
  'xero.paymentReceived': 'Payment received',
  'xero.accpayAuthorised': 'Xero bill authorised',
  // The bill payment made in Xero's payables run (Xero side only since catch-up Phase 37); `ledger.disbursed` is the engine's record of it.
  'xero.disbursed': 'Bill paid in Xero',
  'xero.contactResolved': 'Xero contact resolved',
  'xero.contactArchived': 'Xero contact archived',
  // The AA Holding account's transfer and its Xero mirror (catch-up Phase 27a).
  'prepayment.transfer': 'Prepayment transferred to anaesthetist',
  'prepayment.transferNoop': 'Prepayment transfer already done',
  'prepayment.transferReleased': 'Transferred prepayment released',
  'xero.journalPosted': 'Xero transfer journal posted',
  'xero.journalNoop': 'Xero transfer journal already posted',
  // Xero mirror resilience (catch-up Phase 37): the outage, the sync queue, detection, divergence and the Xero side.
  'xero.outageStarted': 'Xero outage started (simulated)',
  'xero.outageEnded': 'Xero restored (simulated)',
  'xero.queued': 'Waiting for Xero',
  'xero.retryFailed': 'Xero retry failed',
  'xero.retryAlert': 'Xero alert raised',
  'xero.queueSent': 'Sent to Xero',
  'xero.paymentLanded': 'Payment landed in Xero',
  'xero.voidedInXero': 'Invoice voided in Xero',
  'xero.amendedInXero': 'Invoice total edited in Xero',
  'xero.divergenceFlagged': 'Change made in Xero flagged',
  'xero.divergenceResolved': 'Change made in Xero resolved',
  'xero.remittanceReceived': 'Bulk remittance received in Xero',
  'xero.bankLineUnmatched': 'Remittance line left for bank reconciliation',
  'xero.bankLineMatched': 'Remittance line matched in Xero',

  // --- The internal ledger (catch-up Phase 36) ----------------------------
  'ledger.pairCreated': 'Ledger pair created',
  'ledger.receiptRecorded': 'Receipt recorded in the ledger',
  'ledger.receiptNoop': 'Receipt already recorded',
  'ledger.disbursed': 'Paid out to the anaesthetist',
  'ledger.disburseNoop': 'Nothing to pay out',
  'ledger.unmatchedReceipt': 'Receipt with no matching invoice',
  'ledger.unmatchedAllocated': 'Unmatched receipt allocated',
  'ledger.unmatchedRefunded': 'Unmatched receipt refunded',
  'ledger.allocationNoop': 'Allocation already applied',
  'billing.exceptionResolved': 'Billing exception resolved',

  // --- AA's monthly fee (catch-up Phase 16) -------------------------------
  'aaFee.settingsChanged': 'AA fee settings changed',
  'aaFee.invoiceRaised': 'AA fee invoice raised',
  'aaFee.paymentRecorded': 'AA fee payment recorded',

  // --- Demo settings and triggers ---------------------------------------
  'settings.archiveWindow': 'Archive window changed',
  'settings.armHandoffFault': 'Handoff fault armed',
  'demo.bctisSeeded': 'A month of BCTIs seeded',

  // --- Accounts and sign-in (FT-13.5, simulated: catch-up Phase 14) -------
  'account.provisioned': 'Account provisioned',
  'auth.signIn': 'Signed in',
  'auth.signInFailed': 'Sign-in failed',
  'auth.passwordReset': 'Password reset by user',

  // --- Update emails (catch-up Phase 35; US-02.3.3, US-02.3.4) -------------
  'emailTemplate.create': 'Email template added',
  'emailTemplate.update': 'Email template updated',
  'emailTemplate.retire': 'Email template retired',
  'emailTemplate.restore': 'Email template restored',
  'updateEmail.drafted': 'Update email drafted (not sent)',
}

/** "someWord" -> "some word" (the shared camelCase splitter). */
function splitCamel(word: string): string {
  return word.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase()
}

/**
 * The action's label, or a derived one for an unmapped code: the first segment
 * becomes the subject and the rest the verb, so `widget.frobbed` reads
 * "Widget frobbed" instead of rendering a bare machine code to a clinician.
 */
export function actionLabel(action: string): string {
  const mapped = ACTION_LABELS[action]
  if (mapped !== undefined) return mapped
  const segments = action.split('.').filter((s) => s !== '')
  if (segments.length === 0) return 'Action recorded'
  const words = segments.map(splitCamel).join(' ')
  return words.charAt(0).toUpperCase() + words.slice(1)
}
