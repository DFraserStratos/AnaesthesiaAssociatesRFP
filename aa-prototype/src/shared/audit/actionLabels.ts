import { PAIRING_LABELS } from '../../domain/pairingPreferences'

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
  'booking.complete': 'Booking completed',
  'booking.uncomplete': 'Booking reopened for amendment',
  'booking.cancel': 'Booking cancelled',
  'booking.attachmentAdd': 'Attachment added',
  'booking.attachmentRemove': 'Attachment removed',
  'booking.reassign': 'Booking moved to another list',
  'booking.warningCleared': 'Warning cleared',
  'booking.warningSampleUnstaged': 'Sample warning removed',
  'booking.billed': 'Booking billed',
  'booking.billingException': 'Billing exception raised',

  // --- Procedures & billing lines -----------------------------------------
  'procedure.create': 'Procedure added',
  'procedure.update': 'Procedure updated',
  'procedure.remove': 'Procedure removed',
  'billingLine.add': 'Billing line added',
  'billingLine.update': 'Billing line updated',
  'billingLine.remove': 'Billing line removed',

  // --- Lists ---------------------------------------------------------------
  'list.update': 'List updated',
  'list.attachmentAdd': 'List attachment added',
  'list.attachmentRemove': 'List attachment removed',
  'list.submit': 'List submitted',
  'list.authorise': 'List authorised',
  'list.billed': 'List billed',
  'list.create': 'List assigned',
  'list.reassign': 'List reassigned',
  'list.conflict': 'Conflict flagged',
  'list.phoneNote': 'Phone note logged',
  'list.pairingAcknowledged': `${PAIRING_LABELS.kind.NOT_PREFERRED} pairing assigned (warning acknowledged)`,

  // --- Sessions (catch-up Phase 28). A Slot's audit codes say "session", as
  // the Audit viewer prints the raw code and entity type beside the label. --
  'session.status': 'Availability set',
  'session.times': 'Session times changed',
  'session.coverRequest': 'Cover requested',

  // --- Canvas & scheduling masters ----------------------------------------
  'canvas.generate': 'Canvas generated',
  'canvas.rollForward': 'Canvas rolled forward',
  'canvas.trim': 'Sessions removed',
  'settings.scheduleDefaults': 'Default session times changed',
  'settings.horizon': 'Schedule horizon changed',
  'permanentList.create': 'Permanent list added',
  'permanentList.update': 'Permanent list updated',
  'permanentList.pairingAcknowledged': `${PAIRING_LABELS.kind.NOT_PREFERRED} pairing assigned (warning acknowledged)`,
  'holiday.create': 'Holiday added',
  'dayNote.add': 'Day note added',

  // --- People & payers -----------------------------------------------------
  'patient.create': 'Patient created',
  'patient.update': 'Patient updated',
  'patient.reuse': 'Existing patient matched',
  'patient.ethnicity.correct': 'Ethnicity code corrected',
  'billableParty.create': 'Billable party added',
  'anaesthetist.create': 'Anaesthetist added',
  'anaesthetist.update': 'Anaesthetist updated',
  'hospital.create': 'Hospital added',
  'hospital.update': 'Hospital updated',
  'surgeon.create': 'Surgeon added',
  'surgeon.update': 'Surgeon updated',
  'surgeonRoom.create': "Surgeons' room added",
  'surgeonRoom.update': "Surgeons' room updated",
  'surgeonGroup.create': 'Surgeon group added',
  'surgeonGroup.update': 'Surgeon group updated',
  // Office-private (catch-up Phase 17): only Admin histories read these.
  'pairing.add': `${PAIRING_LABELS.entry} added`,
  'pairing.end': `${PAIRING_LABELS.entry} ended`,
  'anaesthetist.tierSet': 'Priority tier changed',
  'insurer.update': 'Insurer updated',

  // --- Contracts -----------------------------------------------------------
  'contract.create': 'Contract created',
  'contract.update': 'Contract updated',
  'contract.delete': 'Contract deleted',
  'contractPrice.create': 'Fixed price added',
  'contractPrice.update': 'Fixed price updated',

  // --- Billing run & invoices ---------------------------------------------
  'invoice.create': 'Invoice raised',
  'invoice.raisePrePayment': 'Pre-payment invoice raised',
  'invoice.email': 'Invoice emailed',

  // --- Integrations --------------------------------------------------------
  'integration.receive': 'Message received',
  'feed.update': 'Feed mapping updated',

  // --- Xero simulation & money movement -----------------------------------
  'xero.pairCreated': 'Xero invoice pair created',
  'xero.handoffFailed': 'Xero handoff failed',
  'xero.handoffNoop': 'Xero handoff already done',
  'xero.paymentReceived': 'Payment received',
  'xero.accpayAuthorised': 'Xero bill authorised',
  'xero.disbursed': 'Disbursement recorded',
  'xero.contactResolved': 'Xero contact resolved',
  'xero.contactArchived': 'Xero contact archived',
  'xero.feeAccRecCreated': 'Xero AA fee invoice created',

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
