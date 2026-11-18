/**
 * Human labels for the patch keys that appear in an audit entry's
 * `before` / `after` objects (A7 presentation).
 *
 * Covers the editable fields of `Booking`, `Procedure`, `List`, `Contract`
 * (and a fixed price's ranges), `Patient`, `Anaesthetist` and `BillingLine`, plus the
 * audit-only keys the store synthesises for events that are not field edits
 * (`{ cancelled, reason }`, `{ invoiceCount, exceptionCount }`, and so on).
 *
 * A single map, not one per entity: audit entries carry a key and a value, not
 * a type, and no two entities use the same key for different things. Where a
 * key is missing, `fieldLabel` sentence-cases the camelCase, which is why the
 * integration feed's dynamic mapping keys need no entries.
 *
 * Ids stay named as ids ("Patient id"), because the value rendered is the id.
 * Resolving an id to a person's name would need the master data, and this
 * module stays pure over the entry it is given.
 */

import { DRAFT_LISTS } from '../scheduleTerms'

export const FIELD_LABELS: Record<string, string> = {
  // --- Booking ----------------------------------------------------------------
  listId: 'List',
  patientId: 'Patient id',
  scheduledTime: 'Scheduled time',
  completed: 'Completed',
  completedAtISO: 'Completed at',
  bookingType: 'Booking type',
  addendumOfBookingId: 'Addendum of booking',
  correlationRef: 'Appointment reference',
  cancellation: 'Cancellation',
  cancelled: 'Cancelled',
  // Warning clearances (catch-up Phase 15a)
  ruleId: 'Warning rule',
  strength: 'Strength',
  warning: 'Warning',
  notes: 'Notes for the office',
  lastModifiedBy: 'Last modified by',
  lastModifiedAtISO: 'Last modified at',

  // --- Procedure -----------------------------------------------------------
  bookingId: 'Booking',
  description: 'Description',
  // Catch-up Phase 20a (US-02.5.7): the one procedure text, as received.
  procedureText: 'Procedure text',
  governingContractId: 'Contract',
  railAnswers: 'Invoice destination so far',
  enteredPrice: 'Price',
  payer: 'Payer',
  payerContact: 'Payer contact',
  insurerOrFunder: 'Insurer or funder',
  funderPartyId: 'Insurer or funder',
  insuranceApprovalNumber: 'Approval number',
  approval: 'Approval',
  approvalRequired: 'Pre-payment approval',
  billingReference: 'Billing reference',
  isPrimary: 'Primary procedure',
  // Catch-up Phase 19b: a Procedure's modifiers, by code, never by hidden id.
  modifierClaims: 'Modifiers claimed',
  removedModifierIds: 'Pre-applied modifiers removed',
  modifier: 'Modifier',
  explanation: 'Explanation',
  appliedBecause: 'Applied because',
  factor: 'Modifying factor',
  rvgGroupId: 'RVG code',
  anatomy: 'Anatomy heading',
  baseUnits: 'Base units',
  baseUnitsRange: 'Base unit range',
  modifierUnits: 'Modifier units',
  baseUnitsSelected: 'Base units chosen',
  baseUnitsCaptured: 'Base units',
  timeUnitsCaptured: 'Time units',
  modifierUnitsCaptured: 'Modifier units',
  anaestheticStartISO: 'Start',
  handoverISO: 'Finish',
  modifiersConfirmed: 'Modifiers step answered',
  contractApproval: 'Contract change approved',
  contractApproved: 'Contract change approved',
  how: 'How approved',
  intNotes: 'Int notes',
  opNotes: 'Op notes',

  // --- List ----------------------------------------------------------------
  dateISO: 'Date',
  anaesthetistId: 'Anaesthetist',
  session: 'Session',
  state: 'State',
  // Sessions (catch-up Phase 28; the UI says session, never "slot")
  slotId: 'Session',
  // The schedule settings' default times, by session (catch-up Phase 32c).
  AM: 'AM',
  PM: 'PM',
  OOH: 'Out-of-hours',
  slots: 'Sessions',
  note: 'Note',
  startDateISO: 'Start date',
  horizonMonths: 'Horizon (months)',
  fromMonths: 'From (months)',
  toMonths: 'To (months)',
  fromEndISO: 'Horizon ended',
  toEndISO: 'Horizon ends',
  hospitalId: 'Hospital',
  surgeonId: 'Surgeon',
  startTime: 'Start time',
  endTime: 'End time',
  conflicts: 'Conflicts',
  // Catch-up Phase 30: conflicts from facts, office clears, recurring-booking provenance and dates.
  conflictClears: 'Cleared conflicts',
  cause: 'Cause',
  detail: 'Detail',
  change: 'What changed',
  recurringBookingId: 'Recurring booking',
  // Catch-up Phase 31: Draft Lists and the location record.
  draft: 'Draft trail',
  origin: 'Came from',
  projectedFor: 'Stands for',
  removeReason: 'Reason removed',
  removedAtISO: 'Removed',
  locationType: 'Location type',
  fromAnaesthetistId: 'From anaesthetist',
  draftListIds: DRAFT_LISTS,
  draftListsUpdated: `${DRAFT_LISTS} updated`,
  draftListsRemoved: `${DRAFT_LISTS} removed`,

  // Catch-up Phase 32: an anaesthetist's own move.
  route: 'Moved to',
  notificationId: 'Notification',
  // Catch-up Phase 32a: the List created in the colleague's session for a moved Booking.
  createdListId: 'New List',
  phoneNotes: 'Phone notes',
  billedAtISO: 'Billed at',
  lists: 'Lists',
  fromISO: 'From',
  toISO: 'To',
  dayOfWeek: 'Day of week',
  flagged: 'Flagged',
  text: 'Note',
  message: 'Message',
  reason: 'Reason',
  kind: 'Kind',
  targetAnaesthetistId: 'Asked of',

  // --- Contract & fixed prices (the flat Contract, catch-up Phase 18) ----
  contractId: 'Contract',
  name: 'Name',
  aaCode: 'AA code',
  holderReference: 'Holder reference code',
  holderId: 'Holder',
  billsTo: 'Bills',
  linkedSurgeonIds: 'Linked surgeons',
  linkedAnaesthetistId: 'Linked anaesthetist',
  prepaid: 'Prepaid',
  anaesthetistMayOverridePrice: 'Anaesthetist may override the price',
  pricing: 'Pricing',
  systemRole: 'System Contract',
  price: 'Price',
  // Catch-up Phase 19a (US-04.2.15, US-04.2.18).
  invoiceDescription: 'Invoice description',
  defaultRvgCode: 'Default RVG code',
  priceRange: 'Price range',
  contract: 'Contract',

  // --- Party (catch-up Phase 18) -------------------------------------------
  codePrefix: 'Code prefix',
  billingName: 'Billing name',
  postalAddress: 'Postal address',
  deliveryMethod: 'Delivery',
  billingIdentity: 'Billing record',

  // --- Patient and payer -------------------------------------------------
  nhi: 'NHI',
  dobISO: 'Date of birth',
  phone: 'Phone',
  email: 'Email',
  ethnicityCode: 'Ethnicity code',
  ethnicityPending: 'Ethnicity pending correction',
  pending: 'Pending correction',
  matchedByNhi: 'Matched by NHI',
  provisional: 'Provisional record',

  // --- Anaesthetist --------------------------------------------------------
  registrationNumber: 'Registration number',
  unitValue: 'Unit value',
  // Catch-up Phase 26: the anaesthetist's bank details (US-12.1.4), the number always masked.
  bankAccount: 'Bank account',
  // OQ-52: one identifier for surgeons and anaesthetists alike (catch-up Phase 17).
  hpiId: 'HPI CPN',
  active: 'Active',

  // --- Surgeons, rooms, groups, hospitals (catch-up Phase 17) ---------------
  contactEmail: 'Contact email',
  // Catch-up Phase 18a: a surgeon's or a Contract's specialties and a Contract's tag, audited by name.
  specialties: 'Specialties',
  fundingTag: 'Funding tag',
  funder: 'Funder',
  roomId: "Surgeons' room",
  // Catch-up Phase 17a: a surgeon's rooms by name, in order (the main room first), and a room's contacts.
  rooms: 'Rooms',
  contact: 'Contact',
  for: 'For',
  role: 'Role',
  medicalRegistrationNumber: 'NZ medical registration number',
  memberSurgeonIds: 'Members',

  // --- Pairing preferences and tiers (office only, catch-up Phase 17) ------
  raisedBy: 'Asked by',
  addedAtISO: 'Added',
  addedBy: 'Added by',
  endedAtISO: 'Ended',
  endedBy: 'Ended by',
  endReason: 'End reason',
  tier: 'Priority tier',
  pairingPreferenceIds: 'Pairing preferences',

  // --- Billing line --------------------------------------------------------
  procedureId: 'Procedure',
  chargeBasis: 'Charge basis',
  units: 'Units',
  rate: 'Rate',
  hours: 'Hours',
  amount: 'Amount',
  split: 'Split',
  gstNumber: 'GST number',

  // --- Billing run, invoices, payments ------------------------------------
  invoiceNumber: 'Invoice number',
  caseReference: 'Case reference',
  counterparty: 'Counterparty',
  subtotal: 'Subtotal',
  gst: 'GST',
  total: 'Total',
  invoiceIds: 'Invoices',
  invoiceCount: 'Invoices raised',
  exceptionCount: 'Exceptions',
  billingCaseId: 'Billing case',
  retriedCaseId: 'Retried case',
  delivery: 'Delivery',
  code: 'Code',
  increment: 'This payment',
  cumulative: 'Received to date',
  authorisedCumulative: 'Authorised to date',
  fullyPaid: 'Fully paid',
  fullyPaidOut: 'Fully paid out',
  payablesRunId: 'Payables run',
  // Shared: a payment's source and a Booking's source (catch-up Phase 15).
  source: 'Source',
  idempotencyKey: 'Idempotency key',
  archived: 'Archived',

  // --- Xero simulation ----------------------------------------------------
  accRecId: 'Xero sales invoice',
  accPayId: 'Xero bill',
  payerContactId: 'Payer contact',
  payeeContactId: 'Payee contact',
  amountDue: 'Amount due',
  contactId: 'Xero contact',

  // --- Integrations & demo settings ---------------------------------------
  status: 'Status',
  attempts: 'Attempts',
  feed: 'Feed',
  event: 'Event',
  days: 'Days',
  failNextHandoff: 'Fail next handoff',
  atISO: 'At',

  // --- Accounts and sign-in (FT-13.5, simulated) --------------------------
  app: 'App',
  mfa: 'MFA check',
  provider: 'Sign-in provider',
  credentialsVisibleToAdmin: 'Credentials visible to admin',
  // --- Availability (catch-up Phase 29) -----------------------------------------
  sessions: 'Sessions',
  statuses: 'Sessions by status',
  set: 'Sessions set',
  seriesInstancesEdited: 'Repeating days changed on their own',
  seriesSessions: 'Sessions from repeating days off',
  seriesId: 'Repeating days off',
  rule: 'Repeats',
  leftAsIs: 'Sessions left as they were',
  endedFromISO: 'Ended from',
  returnedToDefault: 'Sessions returned to the default',
  keptAsOneOff: 'Changed days kept',
  sessionsCarrying: 'Sessions from today carrying it',
  longLabel: 'Long label',
  colour: 'Colour',
  treatment: 'Fill',
  bookable: 'Open for bookings',
  anaesthetistCanSet: 'Anaesthetists can set',
  defaultStatus: 'Default for new sessions',
  previousDefault: 'Previous default',
  retiredAtISO: 'Retired',
}

/**
 * The key's label, or a sentence-cased fallback ("someNewKey" -> "Some new
 * key"), with the ISO suffix the store uses on timestamps dropped so a new
 * `somethingAtISO` never renders its suffix at a clinician.
 */
export function fieldLabel(key: string): string {
  const mapped = FIELD_LABELS[key]
  if (mapped !== undefined) return mapped
  const stripped = key.replace(/ISO$/, '')
  const words = stripped.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase()
  return words.charAt(0).toUpperCase() + words.slice(1)
}
