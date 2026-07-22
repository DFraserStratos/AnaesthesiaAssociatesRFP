/**
 * The complete typed domain model (Phase 01).
 *
 * PURITY CONVENTION (mechanically enforced by `domainPurity.test.ts`): nothing
 * under `src/domain/` imports React, react-dom, or any DOM/UI library. Domain
 * code is pure data + pure functions; components read it through the store.
 *
 * Every entity of the RFP's Candidate Architecture is typed NOW — including the
 * billing / Xero / integration shapes that Phases 08–11 fill with behaviour —
 * so the store shape never churns later (phase doc: "typed now, filled 08–11").
 * Where the RFP is ambiguous, the reading taken is recorded in a comment and in
 * PROGRESS.md's Decisions log / REQUIREMENTS §11.
 *
 * Style notes (tsconfig `erasableSyntaxOnly`): string unions + `as const`
 * arrays, never `enum`; IDs are string aliases for readability, not branding.
 */

// ---------------------------------------------------------------------------
// Shared scalars & refs
// ---------------------------------------------------------------------------

/** ISO `YYYY-MM-DD`. */
export type IsoDate = string
/** ISO 8601 date-time string. */
export type IsoDateTime = string
/** `HH:mm` 24-hour wall-clock time. */
export type WallTime = string

export type PatientId = string
export type BillablePartyId = string
/** An anaesthetist's ID IS their registration number (RFP master; 2nd review #2). */
export type AnaesthetistId = string
export type HospitalId = string
export type SurgeonId = string
export type InsurerId = string
export type OrganisationId = string
export type ContractId = string
export type ListId = string
export type CardId = string
export type ProcedureId = string
export type InvoiceId = string

export type Session = 'AM' | 'PM'

/** List lifecycle (PROGRESS convention 6 — no Returned state). */
export type ListState = 'DRAFT' | 'SUBMITTED' | 'AUTHORISED'

/**
 * The six list-status keys. MUST stay string-identical to the theme's
 * `StatusKey` (`src/theme/statusColours.ts`) — parity is asserted in
 * `statusKeyParity.test.ts`; the domain stays self-contained (no theme import).
 */
export const LIST_STATUS_KEYS = [
  'private',
  'public',
  'preop',
  'holiday',
  'unavailable',
  'free',
] as const
export type ListStatusKey = (typeof LIST_STATUS_KEYS)[number]

/** Who performed an action (audit + cancellation records). */
export type ActorRole = 'anaesthetist' | 'office' | 'system'

/** Where a mutation originated (PROGRESS convention 7). */
export type AuditSource = 'anaesthetist' | 'office' | 'integration' | 'system' | 'demo'

/**
 * A billing counterparty reference — who money is owed by / billed to.
 * Used by BillingLine funder overrides (5th review #4) and Invoices.
 */
export type CounterpartyKind =
  | 'hospital'
  | 'insurer'
  | 'surgeon'
  | 'organisation'
  | 'patient'
  | 'billableParty'
export interface CounterpartyRef {
  kind: CounterpartyKind
  id: string
}

/** Provenance of a captured B/T/M unit value (RFP design principle 10). */
export type UnitProvenance = 'seeded' | 'overridden'
export interface CapturedUnits {
  units: number
  source: UnitProvenance
}

// ---------------------------------------------------------------------------
// People & payers
// ---------------------------------------------------------------------------

/**
 * Patient. `hiddenInternalId` is the INVARIANT key (3rd review #5) — it is what
 * crosses to Xero as the ContactNumber (convention 8: the NHI never does).
 * `nhi` is OPTIONAL: the RFP links records to an NHI "where available" (vs the
 * schedule section's "unique identifier: NHI" — tension recorded in
 * REQUIREMENTS §11). Validate the NHI whenever present.
 */
export interface Patient {
  hiddenInternalId: PatientId
  nhi?: string
  name: string
  dobISO: IsoDate
  phone?: string
  email?: string
  address?: string
  /** NZHIS Level 4 ethnicity code — only ever a validated code is stored. */
  ethnicityCode?: string
  /**
   * Quarantine for an invalid inbound ethnicity code (7th review A11): the
   * received value is held "pending correction", never stored as the code;
   * the Card still books; the manual-fix flow supplies a valid code.
   */
  ethnicityPending?: { receivedCode: string; reason: string }
}

/**
 * Billable Party — a non-patient payer override, most commonly a guardian
 * paying for a minor. Deliberately NOT a Patient row (3rd review #6): guardians
 * hold no NHI, and the RFP treats "Patient and Billable Party records" as
 * parallel classes. Gets its own hidden-ID Xero contact (4th review #5).
 */
export interface BillableParty {
  hiddenInternalId: BillablePartyId
  name: string
  relationshipToPatient: string
  phone?: string
  email?: string
  address?: string
}

/**
 * Anaesthetist master (RFP: "basic contact information plus registration
 * number (ID)"; 2nd review #2, 6th review #5). `unitValue` is the
 * anaesthetist-specific $ per unit the Type 1 path multiplies by.
 */
export interface Anaesthetist {
  registrationNumber: AnaesthetistId
  name: string
  phone: string
  email: string
  unitValue: number
  gstPeriod: GstPeriod
  /** HPI practitioner identifier (6th review #11; FHIR Practitioner). */
  hpiId: string
  active: boolean
}

export type GstPeriod = 'monthly' | 'biMonthly' | 'sixMonthly'

export interface Hospital {
  id: HospitalId
  name: string
}

export interface Surgeon {
  id: SurgeonId
  name: string
  specialty?: string
}

export interface Insurer {
  id: InsurerId
  name: string
  /**
   * The Insurer billing route is "only available where that Insurer accepts
   * direct claims from AA" (RFP; 6th review #2) — validator-enforced.
   */
  acceptsDirectClaims: boolean
}

/**
 * An external group that holds contracts, e.g. Canterbury Orthopaedic Surgeons
 * — the RFP's ACC contracts "held externally instead" (3rd review #8).
 */
export interface ContractHolderOrganisation {
  id: OrganisationId
  name: string
  description?: string
}

// ---------------------------------------------------------------------------
// Contracts
// ---------------------------------------------------------------------------

/**
 * `billableParty` holders exist ONLY for individual-arrangement contracts
 * (RFP: "a Billable Party, Hospital, or Insurer must hold a Contract that
 * explicitly permits an individually-arranged structure"; 5th review #2).
 */
export type ContractHolderType =
  | 'hospital'
  | 'insurer'
  | 'surgeon'
  | 'organisation'
  | 'billableParty'

/**
 * Contract scope with selection precedence: when both match, an
 * individual-anaesthetist-scoped contract beats an organisational one
 * (RFP hierarchy; 5th review #3). All seeds today are organisational.
 */
export type ContractScope =
  | { kind: 'organisation' }
  | { kind: 'individualAnaesthetist'; anaesthetistId: AnaesthetistId }

/** Type 2 pricing detail: an agreed unit rate, or a % discount off the anaesthetist's own unit value. */
export type ContractType2Detail =
  | { basis: 'agreedUnitRate'; unitRate: number }
  | { basis: 'percentDiscount'; percent: number }

export interface Contract {
  id: ContractId
  name: string
  /** RFP contract types: 1 = standard units, 2 = agreed rate/discount, 3 = fixed price list. */
  type: 1 | 2 | 3
  holderType: ContractHolderType
  holderId: string
  scope: ContractScope
  /**
   * The Method 3 gate (5th review #1): rate x time capture is offered only
   * under a contract carrying this flag; validator-enforced on billing lines.
   */
  permitsIndividualArrangement: boolean
  /**
   * The protected default Type 1 (hospitals + direct-billing insurers only;
   * 3rd review #9): cannot be deleted or end-dated; expired/absent Type 2/3
   * falls back to it. Store invariant from Phase 02; 7th review B14 adds the
   * creation half.
   */
  isDefault: boolean
  effectiveFromISO: IsoDate
  /** Absent = open-ended. */
  effectiveToISO?: IsoDate
  /** Required when `type === 2`. */
  type2Detail?: ContractType2Detail
}

/**
 * A Type 3 fixed-price row. Matching keys are explicit (2nd review #4): the
 * RFP's "keyed by some combination of contract holder, surgeon, and/or
 * procedure type". In the prototype's curated set the RVG base code stands in
 * for "procedure type" — a labelled DEMO SIMPLIFICATION (5th review #3): a real
 * build may need non-RVG procedure identifiers. Most-specific match wins.
 */
export interface ContractPrice {
  id: string
  contractId: ContractId
  rvgBaseCode?: string
  surgeonId?: SurgeonId
  /** 1-based position of the procedure on its Card (2nd-procedure rules). */
  procedureOrdinal?: number
  price: number
}

// ---------------------------------------------------------------------------
// The canvas: Lists & Cards
// ---------------------------------------------------------------------------

/** A reconciliation conflict flagged onto a List (availability/holiday; 1st review #2, 7th review A9). */
export interface ListConflict {
  kind: 'availability' | 'holiday'
  message: string
}

/**
 * A cover marker recorded on a Free List (Phase 03 mobile request-cover flow;
 * Decisions log 2026-07-21 "New interactions"). `offer` = the owner offers
 * their own free session for cover; `request` = a colleague is asked to cover a
 * free session. Simulated only — no real notification; the audit entry and this
 * marker are the demonstration.
 */
export interface CoverRequest {
  by: string
  kind: 'offer' | 'request'
  targetAnaesthetistId?: AnaesthetistId
  message?: string
  atISO: IsoDateTime
  status: 'pending'
}

export interface List {
  id: ListId
  dateISO: IsoDate
  anaesthetistId: AnaesthetistId
  session: Session
  state: ListState
  statusKey: ListStatusKey
  hospitalId?: HospitalId
  surgeonId?: SurgeonId
  /** Office-overridable session times (5th review #6). */
  startTime?: WallTime
  endTime?: WallTime
  conflicts: ListConflict[]
  /** A pending cover offer/request on a Free List (Phase 03). */
  coverRequest?: CoverRequest
  /**
   * Stamped at completion of the List's billing run (Phase 08; 3rd review
   * #12). Lists vanish from the anaesthetist's forward views at invoice
   * generation, NOT at AUTHORISED — an authorised list is still unbilled.
   */
  billedAtISO?: IsoDateTime
  notes?: string
}

/**
 * Correlation key for integration-created bookings (6th review #1): HL7 SCH-2
 * filler appointment ID (the RFP sample's `1661243` — SCH-2, not SCH-1, per
 * 7th review A15) or the FHIR Appointment identifier. S13/S14/S15 locate their
 * Card by it; MSH-10 dedupes *messages*, this key correlates *appointments*.
 */
export interface IntegrationCorrelationRef {
  sourceFeedId: string
  externalAppointmentId: string
}

/**
 * Audited soft-cancel (7th review B23): cancelled Cards are retained and
 * visible, excluded from completion/submission validation and billing, never
 * hard-deleted. Manual cancel and the S15 message share this mechanism.
 */
export interface CardCancellation {
  reason: string
  by: string
  role: ActorRole
  source: AuditSource
  atISO: IsoDateTime
}

/** Audited override of the pre-payment completion gate (B7; 2nd review #6). */
export interface PrepaymentOverride {
  reason: string
  by: string
  atISO: IsoDateTime
}

export interface CardAttachment {
  id: string
  name: string
  kind: 'photo' | 'pdf' | 'other'
  /**
   * A data URL for a picked or bundled image, so an attachment renders inline
   * (Phase 03). Demo tradeoff: data URLs persist into localStorage — acceptable
   * for the small bundled/sample photos this prototype attaches.
   */
  dataUrl?: string
}

export interface Card {
  id: CardId
  listId: ListId
  /** Always the hidden internal ID — never the NHI (convention 8). */
  patientId: PatientId
  scheduledTime?: WallTime
  /** Completion is validation-gated; submission is completion-gated (1st review #1). */
  completed: boolean
  completedAtISO?: IsoDateTime
  /** Card Copy is the RFP's additional-procedure mechanism (M6; 3rd review #2). */
  copiedFromCardId?: CardId
  correlationRef?: IntegrationCorrelationRef
  cancellation?: CardCancellation
  prepaymentOverride?: PrepaymentOverride
  attachments: CardAttachment[]
  notes?: string
  /** Stamped in lockstep with every audit entry (7th review A8). */
  lastModifiedBy: string
  lastModifiedAtISO: IsoDateTime
}

// ---------------------------------------------------------------------------
// Procedures & billing capture
// ---------------------------------------------------------------------------

/**
 * 'hospital' is the RFP's name for the CONTRACT-HOLDER route — the holder may
 * equally be a surgeon or an organisation (1st review #5). Distinct from the
 * Insurer route (AA billing a direct-claim insurer itself).
 */
export type BillingRoute = 'hospital' | 'billableParty' | 'insurer'

/**
 * The RFP's three Billable-Party-route categories (2nd review #5) — they
 * determine recipient wording and payment workflow. Required by the validator
 * on that route (7th review A2).
 */
export type PatientPaymentCategory =
  | 'selfFundedPostProcedure'
  | 'selfFundedPrepayment'
  | 'insuredReimbursement'

/**
 * Rides with `selfFundedPrepayment` (7th review B6): the RFP's full-vs-split
 * distinction. The Card-level "pre-payment required" flag is DERIVED from the
 * card's procedures, never stored separately.
 */
export interface PrepaymentDetail {
  type: 'full' | 'split'
  depositAmount?: number
}

export type AsaClass = 'AS1' | 'AS2' | 'AS3' | 'AS4'

/** Typed price override — mandatory reason whenever present (7th review A6/B5). */
export type PriceOverride =
  | { kind: 'fixedFee'; amount: number; reason: string }
  | { kind: 'dollarAdjustment'; amount: number; reason: string }
  | { kind: 'percentAdjustment'; percent: number; reason: string }

/**
 * Procedure — the unit of billing on a Card. Captured BTM inputs persist AS
 * DATA, not just computed totals (7th review A3; RFP design principle 10: an
 * invoice must be reproducible against what was true when raised).
 */
export interface Procedure {
  id: ProcedureId
  cardId: CardId
  description: string
  /**
   * Unset until explicitly set (RFP: "set explicitly (by hospital advice, or
   * by AA staff where the hospital does not specify)"; 3rd review #1) — the
   * validator fails an unset route.
   */
  billingRoute?: BillingRoute
  governingContractId?: ContractId
  /** Insurer route only. */
  insurerId?: InsurerId
  /**
   * OVERRIDE only — on the Billable Party route the payer defaults to the
   * patient themself (RFP: "billableParty (→ Patient by default)"; 7th review
   * A1/B15). Set only when someone else pays (e.g. a guardian).
   */
  billablePartyId?: BillablePartyId
  /** Required by the validator when `billingRoute === 'billableParty'`. */
  patientPaymentCategory?: PatientPaymentCategory
  /** Required when `patientPaymentCategory === 'selfFundedPrepayment'`. */
  prepaymentDetail?: PrepaymentDetail
  /**
   * Informational (6th review #3): ACC-relatedness is "invisible to the
   * billing engine" (RFP), but sources W4's ACC column and the
   * authorisation-review advisory when such a procedure sits on the
   * Billable Party route.
   */
  accRelated: boolean
  /** The hospital's contract/approval reference (6th review #6; A4's completeness check). */
  billingReference?: string
  /**
   * A copied Card's procedures are additional from the first (3rd review #2):
   * additional procedures yield TIME UNITS ONLY (RFP split-billing rule).
   */
  isAdditional: boolean

  // --- captured BTM inputs (data, not derivation) ---
  asaClass?: AsaClass
  /** Modifier codes as selected (chips in Phase 04). */
  selectedModifierCodes: string[]
  /** One base code per procedure — base is capped at a single code. */
  rvgBaseCode?: string
  /** The anaesthetist's chosen value where the base code is a range. */
  baseUnitsSelected?: number
  /** B/T/M with provenance — an office/anaesthetist override beats the seeded computation. */
  baseUnitsCaptured?: CapturedUnits
  timeUnitsCaptured?: CapturedUnits
  modifierUnitsCaptured?: CapturedUnits
  anaestheticStartISO?: IsoDateTime
  handoverISO?: IsoDateTime

  priceOverride?: PriceOverride

  /** The legacy Outcome panel's Int Notes / Op Notes (Phase 04 capture). */
  intNotes?: string
  opNotes?: string
}

/** How a billing line's amount arises (RFP methods; 'rateTime' = Method 3 hours x rate). */
export type ChargeBasis = 'rvg' | 'fixed' | 'rateTime'

/**
 * A billing line. `funderOverride` (5th review #4) bills the line to that
 * counterparty instead of the Procedure's resolved route — the RFP's
 * one-procedure-two-funders split. CONSERVATION RULE (validator-checked):
 * once any of a procedure's lines carries a funder override, the procedure's
 * stored line amounts must sum, to the cent, to its computed fee.
 */
export interface BillingLine {
  id: string
  procedureId: ProcedureId
  chargeBasis: ChargeBasis
  units?: number
  /** $ per unit ('rvg') or $ per hour ('rateTime'). */
  rate?: number
  /** 'rateTime' only. */
  hours?: number
  amount: number
  description: string
  funderOverride?: CounterpartyRef
}

// ---------------------------------------------------------------------------
// RVG & modifier masters
// ---------------------------------------------------------------------------

export type RvgBaseUnits =
  | { kind: 'single'; units: number }
  | { kind: 'range'; min: number; max: number }

export interface RvgCode {
  code: string
  description: string
  anatomicalSite: string
  baseUnits: RvgBaseUnits
  /** Modifier codes this base absorbs (e.g. `['P1']` when positioning is included). */
  absorbsModifierCodes: string[]
}

export type ModifierGroup = 'PA' | 'A' | 'AS' | 'ASE' | 'OB' | 'P' | 'AI' | 'POSTOP'

/**
 * Modifier master row. Unit values are DEMO-PLAUSIBLE figures within the RFP's
 * stated ranges, NOT an authoritative NZSA schedule (Decisions log 2026-07-22;
 * discovery item). The table lives in `billing/modifierCodes.ts`.
 */
export interface ModifierCode {
  code: string
  group: ModifierGroup
  units: number
  description: string
}

// ---------------------------------------------------------------------------
// Scheduling masters
// ---------------------------------------------------------------------------

/**
 * Permanent List — the weekly template the canvas generates from.
 * `surgeonId` is nullable: the RFP says surgeon assignment is "usually
 * (approximately 80%) defined in the anaesthetist's Permanent List", though its
 * principle-6 field list omits surgeon (reading recorded in REQUIREMENTS §11).
 * `hospitalId` is nullable too (Phase 02): a recurring pre-op assessment
 * session runs at AA's own rooms, not a hospital.
 */
export interface PermanentList {
  id: string
  hospitalId: HospitalId | null
  anaesthetistId: AnaesthetistId
  /** 0 = Sunday … 6 = Saturday (matches `Date.getDay()`). */
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6
  session: Session
  surgeonId: SurgeonId | null
  statusKey: ListStatusKey
  /** Display label the generated List carries as its note (e.g. "Acute theatre"). */
  notes?: string
}

/**
 * Availability MASTER (1st review #2): anaesthetist availability writes here
 * and is reconciled into the canvas — free sessions restatus, booked sessions
 * conflict-flag — never written to Lists directly.
 */
export interface AnaesthetistAvailability {
  id: string
  anaesthetistId: AnaesthetistId
  dateISO: IsoDate
  session: Session
  kind: 'available' | 'unavailable' | 'holiday'
  note?: string
}

export interface HospitalHoliday {
  id: string
  hospitalId: HospitalId
  dateISO: IsoDate
  name: string
}

/** List-status master row (keyed by the shared six-status key). */
export interface ListStatus {
  key: ListStatusKey
  label: string
  description?: string
}

// ---------------------------------------------------------------------------
// Audit
// ---------------------------------------------------------------------------

/**
 * Append-only audit entry (convention 7). Every Card/Procedure mutation (and
 * List reassignment/state change, plus Phase 08/10's automated actions with
 * source 'system'; 6th review #7) writes one. `entityType` stays a plain
 * string so later phases can audit new entities without reshaping.
 */
export interface AuditEntry {
  id: string
  entityType: string
  entityId: string
  who: string
  role: ActorRole
  source: AuditSource
  action: string
  before?: unknown
  after?: unknown
  atISO: IsoDateTime
}

// ---------------------------------------------------------------------------
// Billing pipeline (typed now — behaviour lands in Phases 08–09)
// ---------------------------------------------------------------------------

export interface Invoice {
  id: InvoiceId
  invoiceNumber: string
  caseReference: string
  cardId: CardId
  counterparty: CounterpartyRef
  /** Invoice layout differs by recipient class (RFP). */
  layout: 'contractHolder' | 'patient'
  kind: 'standard' | 'prePayment'
  subtotal: number
  gst: number
  total: number
  raisedAtISO?: IsoDateTime
  emailedAtISO?: IsoDateTime
}

export interface InvoiceLine {
  id: string
  invoiceId: InvoiceId
  procedureId?: ProcedureId
  description: string
  units?: number
  amount: number
}

export type BillingPipelineStatus =
  | 'pending'
  | 'invoiced'
  | 'handedOff'
  | 'partPaid'
  | 'paid'
  | 'disbursed'
  | 'failed'

/** One invoice's journey through the pipeline: invoice ↔ Xero ACCREC/ACCPAY GUIDs + status. */
export interface BillingCase {
  id: string
  cardId: CardId
  invoiceId?: InvoiceId
  accRecId?: string
  accPayId?: string
  status: BillingPipelineStatus
}

// ---------------------------------------------------------------------------
// Xero simulation shapes (typed now — behaviour lands in Phase 10)
// ---------------------------------------------------------------------------

export interface XeroContact {
  /** Xero GUID. */
  contactId: string
  /** ContactNumber = the hidden internal ID. NEVER the NHI (convention 8). */
  contactNumber: string
  name: string
  /** Organisational contacts persist; individual contacts archive (4th review #5). */
  type: 'organisation' | 'patient' | 'billableParty'
  archived: boolean
}

export interface XeroAccRec {
  /** Xero invoice GUID. */
  id: string
  invoiceId: InvoiceId
  contactId: string
  amountDue: number
  /** CUMULATIVE across successive partial payments (7th review A16). */
  amountReceived: number
  status: 'awaitingPayment' | 'paid' | 'voided'
}

export interface XeroAccPay {
  /** Xero bill GUID. */
  id: string
  /** The paired ACCREC (handoff is pair-atomic; 7th review B8). */
  accRecId: string
  contactId: string
  /** CUMULATIVE (7th review A16): payables runs pay authorised minus disbursed. */
  amountAuthorised: number
  amountDisbursed: number
  status: 'draft' | 'authorised' | 'paid'
}

export interface PaymentIn {
  id: string
  accRecId: string
  amount: number
  atISO: IsoDateTime
  /** Per-payment idempotency key alongside the InvoiceID (7th review A16). */
  idempotencyKey: string
  source: 'webhook' | 'poll'
}

export interface Disbursement {
  id: string
  accPayId: string
  amount: number
  atISO: IsoDateTime
  payablesRunId: string
}

// ---------------------------------------------------------------------------
// Integration simulation shapes (typed now — behaviour lands in Phase 11)
// ---------------------------------------------------------------------------

/** Per-hospital feed config — the field mapping is load-bearing in the failure-fix flow (1st review #10). */
export interface IntegrationFeed {
  id: string
  hospitalId: HospitalId
  transport: 'hl7v2' | 'fhir' | 'pdf'
  /** Source field/segment path → domain field name. */
  fieldMapping: Record<string, string>
}

export type IntegrationMessageStatus =
  | 'pending'
  | 'processed'
  | 'retrying'
  | 'deadLetter'
  | 'manualIntervention'

export interface IntegrationMessage {
  id: string
  feedId: string
  /** HL7 MSH-10 — message-level dedupe/idempotency (1st review #12). */
  messageControlId: string
  /** e.g. 'S12' | 'S13' | 'S14' | 'S15' | a FHIR event name. */
  eventType: string
  correlationRef?: IntegrationCorrelationRef
  status: IntegrationMessageStatus
  attempts: number
  receivedAtISO: IsoDateTime
  raw?: string
}

// ---------------------------------------------------------------------------
// Demo settings
// ---------------------------------------------------------------------------

/** Demo-configurable settings (2nd review #11: the archive window is a setting, seeded at 90). */
export interface DemoSettings {
  contactArchiveInactivityDays: number
}
