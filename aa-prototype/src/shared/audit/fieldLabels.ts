/**
 * Human labels for the patch keys that appear in an audit entry's
 * `before` / `after` objects (A7 presentation).
 *
 * Covers the editable fields of `Card`, `Procedure`, `List`, `Contract`,
 * `ContractPrice`, `Patient`, `Anaesthetist` and `BillingLine`, plus the
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

export const FIELD_LABELS: Record<string, string> = {
  // --- Card ----------------------------------------------------------------
  listId: 'List',
  patientId: 'Patient id',
  scheduledTime: 'Scheduled time',
  completed: 'Completed',
  completedAtISO: 'Completed at',
  copiedFromCardId: 'Copied from card',
  cardType: 'Card type',
  addendumOfCardId: 'Addendum of card',
  correlationRef: 'Appointment reference',
  cancellation: 'Cancellation',
  cancelled: 'Cancelled',
  prepaymentOverride: 'Pre-payment override',
  attachments: 'Attachments',
  notes: 'Notes for the office',
  lastModifiedBy: 'Last modified by',
  lastModifiedAtISO: 'Last modified at',

  // --- Procedure -----------------------------------------------------------
  cardId: 'Card',
  description: 'Description',
  billingRoute: 'Billing route',
  governingContractId: 'Governing contract',
  insurerId: 'Insurer',
  billablePartyId: 'Billable party',
  patientPaymentCategory: 'Payment category',
  prepaymentDetail: 'Pre-payment',
  accRelated: 'ACC related',
  billingReference: 'Billing reference',
  isAdditional: 'Additional procedure',
  asaClass: 'ASA class',
  selectedModifierCodes: 'Modifiers',
  rvgBaseCode: 'Procedure code',
  baseUnitsSelected: 'Base units chosen',
  baseUnitsCaptured: 'Base units',
  timeUnitsCaptured: 'Time units',
  modifierUnitsCaptured: 'Modifier units',
  anaestheticStartISO: 'Anaesthetic start',
  handoverISO: 'Handover',
  priceOverride: 'Price override',
  intNotes: 'Int notes',
  opNotes: 'Op notes',

  // --- List ----------------------------------------------------------------
  dateISO: 'Date',
  anaesthetistId: 'Anaesthetist',
  session: 'Session',
  state: 'State',
  statusKey: 'Status',
  hospitalId: 'Hospital',
  surgeonId: 'Surgeon',
  startTime: 'Start time',
  endTime: 'End time',
  conflicts: 'Conflicts',
  coverRequest: 'Cover request',
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

  // --- Contract & fixed prices --------------------------------------------
  contractId: 'Contract',
  name: 'Name',
  type: 'Contract type',
  holderType: 'Holder type',
  holderId: 'Holder',
  scope: 'Scope',
  permitsIndividualArrangement: 'Permits individual arrangement',
  isDefault: 'Default contract',
  effectiveFromISO: 'Effective from',
  effectiveToISO: 'Effective to',
  type2Detail: 'Type 2 pricing',
  procedureOrdinal: 'Procedure position',
  price: 'Price',

  // --- Patient & billable party -------------------------------------------
  nhi: 'NHI',
  dobISO: 'Date of birth',
  phone: 'Phone',
  email: 'Email',
  address: 'Address',
  ethnicityCode: 'Ethnicity code',
  ethnicityPending: 'Ethnicity pending correction',
  pending: 'Pending correction',
  matchedByNhi: 'Matched by NHI',
  provisional: 'Provisional record',
  relationshipToPatient: 'Relationship to patient',

  // --- Anaesthetist --------------------------------------------------------
  registrationNumber: 'Registration number',
  unitValue: 'Unit value',
  gstPeriod: 'GST period',
  hpiId: 'HPI id',
  active: 'Active',
  acceptsDirectClaims: 'Accepts direct claims',

  // --- Billing line --------------------------------------------------------
  procedureId: 'Procedure',
  chargeBasis: 'Charge basis',
  units: 'Units',
  rate: 'Rate',
  hours: 'Hours',
  amount: 'Amount',
  funderOverride: 'Billed to',

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
  emailedAtISO: 'Emailed at',
  code: 'Code',
  increment: 'This payment',
  cumulative: 'Received to date',
  authorisedCumulative: 'Authorised to date',
  fullyPaid: 'Fully paid',
  fullyPaidOut: 'Fully paid out',
  payablesRunId: 'Payables run',
  source: 'Payment source',
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
