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

import type { SpecialtyId } from './specialties'
import type { RvgGroupId } from './billing/rvgGroups'

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
/**
 * A payer named on a Booking in place of the patient (catch-up Phase 21): the
 * `BP####` id the retired guardian master used, so a re-expressed guardian
 * keeps its Xero contact (allocated from `counters.billableParty`).
 */
export type PayerId = string
/** An anaesthetist's ID IS their registration number (RFP master; 2nd review #2). */
export type AnaesthetistId = string
export type HospitalId = string
export type SurgeonId = string
export type SurgeonGroupId = string
export type PairingPreferenceId = string
export type InsurerId = string
export type OrganisationId = string
export type ContractId = string
export type ListId = string
export type SlotId = string
export type BookingId = string
export type ProcedureId = string
export type InvoiceId = string
/** One hospital import, sheet or feed message on the matching screen (catch-up Phase 33; DM-34). */
export type ImportBatchId = string
/** One incoming booking row on the matching screen (catch-up Phase 33; DM-34). */
export type ImportRowId = string
/** A stub on a List (catch-up Phase 33a; DM-58): `STB0001`, never the NHI or the hospital's ref. */
export type StubId = string
/** A rooms' PDF list as received (catch-up Phase 34; DM-61): `PDL0001`. */
export type PdfListId = string

/**
 * A day's sessions: AM and PM, generated for every active anaesthetist, and
 * `OOH`, the out-of-hours session after PM that the office opens for one
 * anaesthetist on a day (catch-up Phase 32c; US-01.1.6). The UI says
 * "Out-of-hours" for it (`sessionText`); sort sessions with `sessionRank`,
 * never by their text.
 */
export type Session = 'AM' | 'PM' | 'OOH'

/**
 * List lifecycle (EP-07, FT-07.1, AR-22; PROGRESS convention 6 as amended in
 * catch-up Phases 15b and 31, no Returned state). DRAFT is a Draft List: no
 * anaesthetist and no Slot yet (catch-up Phase 31). ACTIVE is a List with all
 * five of its pairing (anaesthetist, surgeon, hospital, day and session), where
 * the anaesthetist completes Bookings and submits. A List set up with its
 * anaesthetist starts ACTIVE; assigning a Draft List makes it ACTIVE; an ACTIVE
 * List that goes back to the office is DRAFT again (`detachListToDraft`). An
 * empty session is a Slot with no List, so it carries no state at all.
 */
export type ListState = 'DRAFT' | 'ACTIVE' | 'SUBMITTED' | 'AUTHORISED'

/** The states of a List with an anaesthetist and a Slot. */
export type AssignedListState = Exclude<ListState, 'DRAFT'>

/**
 * A List's lifecycle state as the screens print it: the catalogue's names
 * (EP-07, FT-07.1), upper case. One home (read by the availability status
 * validator, which refuses a status named after a List state, and re-exported
 * by `shared/format.ts`). DRAFT is shown only on a Draft List, beside its
 * "Unassigned" flag (`shared/scheduleTerms.ts`); no assigned List is ever
 * labelled DRAFT or "Open". An empty session has no state to print.
 */
export const LIST_STATE_LABELS: Record<ListState, string> = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  SUBMITTED: 'SUBMITTED',
  AUTHORISED: 'AUTHORISED',
}
/** The List's states as a value list (EP-07), for the status validator's guard. */
export const LIST_STATES = Object.keys(LIST_STATE_LABELS) as ListState[]

/**
 * The design's six status colour tokens (Design Language §02: `status/private`,
 * `status/public`, `status/preop`, `status/holiday`, `status/unavailable`,
 * `status/free`). This is the PALETTE an availability status or a List kind
 * picks its colour from, not a vocabulary of statuses: an admin-added status
 * reuses one of these and its label tells it apart. Parity with the theme's
 * `STATUS_PALETTE` is asserted in `statusTokenParity.test.ts`; the domain never
 * imports the theme.
 */
export const STATUS_COLOUR_TOKENS = ['private', 'public', 'preop', 'holiday', 'unavailable', 'free'] as const
export type StatusColourToken = (typeof STATUS_COLOUR_TOKENS)[number]

/** Block fill treatment (Design Language §02): solid, hatched (Unavailable) or dashed (Free). */
export const STATUS_TREATMENTS = ['solid', 'hatched', 'dashed'] as const
export type StatusTreatment = (typeof STATUS_TREATMENTS)[number]

/**
 * A Slot status's fixed internal ID (catch-up Phase 29; US-01.2.2, OQ-64
 * answered). Rules, Slots and series store and compare this, never a label.
 * Seeded statuses keep the values Phase 28 stored (`free`, `holiday`,
 * `unavailable`); a status an admin adds gets a generated `ST####` ID. The
 * store validates a key against the status master, not the type. Literal keys
 * appear only in `domain/slotStatus.ts` and the seed.
 */
export type SlotStatusKey = string

/**
 * A List's kind (catch-up Phase 28). The catalogue models no List kind
 * (DM-04: private and pre-op appear only as RFP candidate statuses); it is
 * kept as a List attribute so the six-colour design language and the seed's
 * pre-op Lists still read. Logged for the owner. Public is not a kind of List:
 * since catch-up Phase 32d (D86, RV-43) it is a Slot status (`publicHospital`)
 * with an optional note and no List detail.
 */
export const LIST_KINDS = ['private', 'preop'] as const
export type ListKind = (typeof LIST_KINDS)[number]

/** The List kinds' fixed labels (chip, then long label); not master data (catch-up Phase 29). */
export const LIST_KIND_LABELS: Record<ListKind, { label: string; longLabel: string }> = {
  private: { label: 'Private', longLabel: 'Private' },
  preop: { label: 'Pre-op', longLabel: 'Pre-op Assessment' },
}

/**
 * What a session shows (catch-up Phase 29: one display key space): the List's
 * kind when a List is in the Slot, otherwise the Slot's status ID unchanged.
 * No status ID can equal a List kind (seeded IDs are availability words, Public
 * is `publicHospital` since Phase 32d, generated ones `ST####`), so the space
 * cannot collide. Never a List state.
 */
export type DisplayKey = ListKind | SlotStatusKey

/** Who performed an action (audit + cancellation records). */
export type ActorRole = 'anaesthetist' | 'office' | 'system'

/** Where a mutation originated (PROGRESS convention 7). */
export type AuditSource = 'anaesthetist' | 'office' | 'integration' | 'system' | 'demo'

/**
 * A billing counterparty reference: who money is owed by, billed to. Used by
 * BillingLine funder overrides (5th review #4) and Invoices; worked out by
 * `billablePartyForProcedure` (`domain/billing/whoIsBilled.ts`) alone.
 *
 * - `patient`: the patient is the Procedure's payer (`id` the patient).
 * - `payer`: another payer named on a Procedure (`id` its `BP####`; catch-up
 *   Phase 21, on each Procedure since 22a; AR-44 `#payer`), resolved from the
 *   Procedures holding it or the invoice's `billedTo` snapshot, never from a
 *   master.
 * - `hospital`, `insurer`, `surgeon`, `organisation`, `billableParty`: a holder
 *   Party's billing identity, the one each Party already carried
 *   (`Party.billingIdentity`), so no seeded counterparty or Xero contact
 *   moves. `billableParty` is only Aria's record (`BP0002`), folded from the
 *   retired guardian master into its Party; it is never a payer.
 * - `party`: a holder Party with no older identity (`id` its `PartyId`).
 *
 * Each id resolves one way only.
 */
export type CounterpartyKind =
  | 'hospital'
  | 'insurer'
  | 'surgeon'
  | 'organisation'
  | 'patient'
  | 'payer'
  | 'billableParty'
  | 'party'
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
  /** In the NZ Post address standard (catch-up Phase 21, US-11.2.3); read as the payer's when the patient pays. */
  postalAddress?: PostalAddress
  /** NZHIS Level 4 ethnicity code — only ever a validated code is stored. */
  ethnicityCode?: string
  /**
   * Quarantine for an invalid inbound ethnicity code (7th review A11): the
   * received value is held "pending correction", never stored as the code;
   * the Booking still books; the manual-fix flow supplies a valid code.
   */
  ethnicityPending?: { receivedCode: string; reason: string }
}

/**
 * A postal address in the NZ Post address standard (US-11.2.3; Greg, 28
 * October): an address line (a street address, PO Box or Private Bag), an
 * optional second line (unit, building or RD), suburb, town or city and a
 * four-digit postcode. `formatPostalAddress` and `postalAddressProblem`
 * (`domain/billing/payer.ts`) are its only rules.
 */
export interface PostalAddress {
  line1: string
  line2?: string
  suburb?: string
  city: string
  postcode: string
}

/**
 * The payer on a Procedure (catch-up Phase 21, moved onto each Procedure by
 * catch-up Phase 22a; US-11.2.2, DM-11, RV-30; AR-44 `#payer`, `#patient`):
 * who is invoiced whenever the Procedure's Contract does not bill its holder
 * (`billablePartyForProcedure`).
 *
 * - `patient`: the "different payer" tick is clear (Greg, 28 October). The
 *   name, email and postal address are read from the patient record; the two
 *   optional fields hold ones typed for this Booking where the record has
 *   none (never written back).
 * - `other`: the tick is set. Any party who pays: a parent, a guardian, a
 *   benefactor or a family trust. `id` is a `BP####` id, so a guardian
 *   re-expressed from the retired master keeps its Xero contact.
 *
 * Identity, never matching: a payer copied to another Procedure keeps its id
 * and is the same payer; one typed in separately is a new id even with the
 * same name and email (`payerKey`, `domain/billing/procedurePayer.ts`). One
 * record per payer id on a Booking: every Procedure holding an id holds the
 * same details. Written only by `setProcedurePayer` after creation.
 *
 * Contact is optional in the type so a payer can be saved before it is known;
 * the Paid by sheet asks and Review flags a billed payer with neither
 * (`payerContactMissing`), never a completion check (our reading).
 */
export type ProcedurePayer =
  | { kind: 'patient'; email?: string; postalAddress?: PostalAddress }
  | {
      kind: 'other'
      id: PayerId
      name: string
      relationship?: string
      email?: string
      postalAddress?: PostalAddress
      phone?: string
    }

/** A payer who is not the patient: a Procedure's other payer, or a split share's "another person". */
export type OtherPayer = Extract<ProcedurePayer, { kind: 'other' }>

/** Who an invoice was addressed to when it was raised (catch-up Phase 21): the payer's details stay with the debt. Phase 22 sends from it. */
export interface InvoiceBilledTo {
  name: string
  email?: string
  postalAddress?: PostalAddress
}

/**
 * An anaesthetist's bank account (catch-up Phase 26; US-12.1.4, OQ-14,
 * DM-32): master data the office holds. Payments to anaesthetists are made in
 * Xero (D53), so nothing in the app pays from it. `accountNumber` is stored
 * dashed, `BB-bbbb-AAAAAAA-SS(S)` (`domain/bankAccount.ts`), and shown masked
 * everywhere but the office's editor and in every audit entry.
 */
export interface BankAccount {
  accountName: string
  accountNumber: string
}

/**
 * Anaesthetist master, and the anaesthetist's profile (US-12.1.4, catch-up
 * Phase 26): contact details, registration number, HPI CPN, bank account and
 * the dollar value per unit. `unitValue` is the anaesthetist-specific $ per
 * unit RVG at the anaesthetist's rate multiplies by; it is the one field the
 * anaesthetist edits themselves (US-12.1.1). The office holds the rest.
 */
export interface Anaesthetist {
  registrationNumber: AnaesthetistId
  name: string
  phone: string
  email: string
  unitValue: number
  /**
   * The HPI CPN (Health Provider Index Common Person Number, e.g. `12ABCD`;
   * OQ-52): one identifier, unique across every practitioner, surgeons
   * included. Mandatory on an anaesthetist (US-12.1.4, Phase 26), stored
   * normalised (Phase 17).
   */
  hpiId: string
  /** Mandatory (US-12.1.4, Phase 26): held by the office, display-only to the anaesthetist. */
  bankAccount: BankAccount
  /**
   * The date the anaesthetist starts (catch-up Phase 28; US-01.1.3: adding an
   * anaesthetist "creates their Slots from their start date"). No Slot exists
   * before it.
   */
  startDateISO: IsoDate
  /**
   * Only an active anaesthetist has Slots (FT-01.1, US-01.1.1 "every active
   * anaesthetist"): generation skips an inactive one, and switching one off
   * removes their Slots from today on.
   */
  active: boolean
  /**
   * The anaesthetist's GST number (catch-up Phase 22; DM-62, US-08.4.5):
   * optional, held only on the Admin anaesthetist record (the profile shows
   * none), stored as typed digits. Every receivable invoice prints it in the
   * supplier block, or "GST number not held" when blank.
   */
  gstNumber?: string
}

/**
 * Where a List is held (catch-up Phase 31; US-01.3.1): a hospital, or AA's own
 * rooms. The pre-op clinic is held at AA rooms, which is a location, not a
 * hospital: never a Contract holder, a hospital feed or a sync target.
 */
export type LocationType = 'hospital' | 'aaRooms'

export interface Hospital {
  id: HospitalId
  name: string
  /** A hospital or AA's own rooms (the pre-op clinic's location). */
  locationType: LocationType
  /** Contact email for booking updates (US-13.4.1). Optional: a newly added hospital may not have one yet. */
  contactEmail?: string
}

/**
 * Surgeon master (FT-13.6, US-13.6.2; catch-up Phase 17). `id` (`S-HALE`)
 * stays the record key so no List or Contract is re-keyed; `hpiId` is the
 * surgeon's unique index.
 */
export interface Surgeon {
  id: SurgeonId
  name: string
  /**
   * The surgeon's specialties from AA's list (US-13.6.6, catch-up Phase 18a):
   * one or more, usually one, never empty (the store refuses a save with
   * none). Shown everywhere through `surgeonSpecialtyLabel`.
   */
  specialtyIds: SpecialtyId[]
  /**
   * The practice name as the office knows it (US-13.6.2; catch-up Phase 17b,
   * D74): plain text for the office to read, nothing depends on it. A surgeon
   * at two practices holds both names, the main one first. Absent when blank.
   */
  practiceName?: string
  /**
   * The surgeon's own name, email and phone (US-13.6.5; catch-up Phase 17b):
   * always present, any field blank. Never the To of an office email.
   */
  personalContact: SurgeonContact
  /**
   * The surgeon's office contacts (a practice manager, PA or shared inbox;
   * US-13.6.5, D74), in order; the first with an email is the office's
   * default To. Empty when none; never an all-blank set. Read for an address
   * only through `officeAddressFor` (`domain/surgeonContacts.ts`;
   * `officeAddressGuard.test.ts` keeps it so).
   */
  officeContacts: SurgeonContact[]
  /**
   * The HPI CPN: the Health Provider Index Common Person Number, the
   * surgeon's unique index (OQ-52), unique across every practitioner
   * (surgeons and anaesthetists) when held. Stored trimmed and upper-cased.
   * Optional (OQ-129, D76): admin staff fill it in, absent until then; whether
   * it is ever required is `surgeonHpiCpnRequired()` (OQ-143). A practitioner
   * identifier, never the patient's NHI.
   */
  hpiId?: string
  /** NZ medical registration number, held for information only. */
  medicalRegistrationNumber?: string
}

/**
 * One contact on a surgeon (US-13.6.5; catch-up Phase 17b, DM-60): a name,
 * email and phone, each absent when blank (never `''`).
 */
export interface SurgeonContact {
  name?: string
  email?: string
  phone?: string
}

/** A named group of surgeons (US-13.4.1), beside `organisations`; Phase 18's holders may link to it. */
export interface SurgeonGroup {
  id: SurgeonGroupId
  name: string
  description?: string
  memberSurgeonIds: SurgeonId[]
}

// ---------------------------------------------------------------------------
// Office-private: pairing preferences and priority tiers (catch-up Phase 17)
// ---------------------------------------------------------------------------

/** Not preferred (formerly the blacklist) or preferred (US-13.6.3, US-13.6.4). Names are OQ-102's answer (D36), in one label set. */
export type PairingKind = 'NOT_PREFERRED' | 'PREFERRED'
/** Which side asked for the entry (US-13.6.3 "says which side asked"). */
export type PairingSide = 'SURGEON' | 'ANAESTHETIST'

/**
 * One private pairing preference between one surgeon and one anaesthetist
 * (DM-54). Recorded and ended by the office only; active while `endedAtISO`
 * is absent. Ending never deletes, so the history is kept.
 */
export interface PairingPreference {
  id: PairingPreferenceId
  kind: PairingKind
  raisedBy: PairingSide
  anaesthetistId: AnaesthetistId
  surgeonId: SurgeonId
  reason?: string
  addedAtISO: IsoDateTime
  addedBy: string
  endedAtISO?: IsoDateTime
  endedBy?: string
  endReason?: string
}

/** Admin-only priority tier (US-01.3.6): 1 is the highest, 4 the default for an anaesthetist with no entry. */
export type PriorityTier = 1 | 2 | 3 | 4

/**
 * The office-only state slice (OQ-43, D44; US-01.3.6 "Admin only"). Pairing
 * preferences and priority tiers live here, NOT in `masters` and NOT on the
 * `Anaesthetist` record, because `masters` reaches the anaesthetist apps.
 * Only the Admin app and the store's office write paths read it, through
 * `store/officePrivate.ts` (not re-exported from the store barrel) and
 * `domain/pairingPreferences.ts`; `src/apps/officePrivacy.test.ts` enforces it.
 */
export interface OfficePrivateSlice {
  pairingPreferences: Record<PairingPreferenceId, PairingPreference>
  /** Keyed by anaesthetist id; an anaesthetist with no entry is at the default tier. */
  priorityTiers: Record<AnaesthetistId, PriorityTier>
}

/**
 * INTERIM identity (catch-up Phase 18, RV-39): there is no Insurer master any
 * more. An insurer is a Party; this bare record stays only as the id a
 * Party's `billingIdentity` points at, so no counterparty or Xero contact
 * moves (catch-up Phase 21 keeps it as the Party's billing identity).
 */
export interface Insurer {
  id: InsurerId
  name: string
}

/**
 * INTERIM identity (catch-up Phase 18): the old contract-holder organisation,
 * kept only as the counterparty a surgeon-group Party's `billingIdentity`
 * points at (Canterbury Orthopaedic Surgeons). Catch-up Phase 21 keeps it as
 * that Party's billing identity, so no issued counterparty moves.
 */
export interface ContractHolderOrganisation {
  id: OrganisationId
  name: string
  description?: string
}

// ---------------------------------------------------------------------------
// Parties (catch-up Phase 18; the model module is domain/billing/parties.ts)
// ---------------------------------------------------------------------------

export type { DeliveryMethod, Party, PartyId, PartyKind } from './billing/parties'

// ---------------------------------------------------------------------------
// Specialties and funding tags (catch-up Phase 18a; their model modules are
// domain/specialties.ts and domain/billing/fundingTags.ts)
// ---------------------------------------------------------------------------

export type { Specialty, SpecialtyId } from './specialties'
export type { FundingTag, FundingTagId } from './billing/fundingTags'

// ---------------------------------------------------------------------------
// Contracts
// ---------------------------------------------------------------------------

/** The flat Contract (catch-up Phase 18; the model module is domain/billing/contracts.ts). */
export type { BillsTo, Contract, ContractPricing, ContractStatus, PricingKind, SystemRole } from './billing/contracts'

/** A fixed-price Contract's dated price ranges (catch-up Phase 19a; the module is domain/billing/priceRanges.ts). */
export type { PriceRange, RangeSummary } from './billing/priceRanges'
/** The RVG time rule held as data (catch-up Phase 19a; domain/billing/timeUnits.ts). */
export type { RvgTimeRule, RvgTimeTier } from './billing/timeUnits'

// ---------------------------------------------------------------------------
// The canvas: Lists & Bookings
// ---------------------------------------------------------------------------

/**
 * A conflict on a List (catch-up Phase 30; US-01.5.2, US-01.5.4; OQ-09 soft
 * warning, never a block). Derived from facts, never stamped: a List conflicts
 * when its hospital is closed on its date (`holiday`). An anaesthetist's
 * unavailability is never a conflict (D59; catch-up Phase 32b).
 * `domain/conflicts.ts` holds the rule and the wording; `mutate()` reconciles
 * every List whose facts a mutation touched, so renaming a holiday changes the
 * text with no write. `cause` is the stable key a clear is matched on:
 * `holiday:<holidayId>`.
 */
export interface ListConflict {
  kind: 'holiday'
  cause: string
  raisedAtISO: IsoDateTime
  holidayId?: string
}

/**
 * The office clearing a conflict (catch-up Phase 30; US-01.5.4). It holds only
 * while its cause stands: when the cause goes the clear is dropped, so a clash
 * that comes back flags again. No reason is required (OQ-09).
 */
export interface ConflictClear {
  cause: string
  by: string
  role: ActorRole
  atISO: IsoDateTime
  note?: string
}

/** Where an anaesthetist's own move sends a List (catch-up Phase 32; US-01.4.3, D7). */
export type OwnMoveRoute = 'office' | 'colleague'

/** Why: a plain move, or the hand-on from marking the session not available (US-01.5.5). */
export type OwnMoveCause = 'move' | 'unavailable'

/**
 * What a notification is about. `listMoved`: an anaesthetist moved her own List
 * (Phase 32, always posted). `bookingMoved`: she moved a single Booking to a
 * colleague and ticked "Tell the office" (Phase 32a, optional, D58).
 * `officeAlert`: she asked the office to check a List or a Booking, with a
 * note (catch-up Phase 32b; US-03.6.3, D58).
 */
export type NotificationKind = 'listMoved' | 'bookingMoved' | 'officeAlert'

/**
 * One record in the Admin App's shared notification pool (catch-up Phase 32;
 * FT-13.8, US-13.8.1, US-13.8.2, US-13.8.3, DM-41). Written once, inside its
 * action's own commit, by `postNotification` alone; nothing deletes one. A
 * notice is active or resolved (D58): `resolveNotification` is the one
 * updater, writing `resolvedAt` and `resolvedBy` once, when an admin ticks it,
 * which hides it for every admin (no per-user state). Nothing expires. The
 * date, session, hospital and surgeon are a snapshot when it was posted, so
 * the notice stays true after the List moves again or is re-dated. It carries
 * no pairing preference.
 */
export interface Notification {
  id: string
  atISO: IsoDateTime
  kind: NotificationKind
  /** The actor's `who` (the anaesthetist who moved the List or raised the alert). */
  byActor: string
  /** The List moved, or the List the alert is about (an alert on a Booking: the Booking's List). */
  listId: ListId
  /** Kinds `listMoved` and `bookingMoved` only. */
  route?: OwnMoveRoute
  /** Kinds `listMoved` and `bookingMoved` only. */
  cause?: OwnMoveCause
  /** The anaesthetist who moved it, or who raised the alert. */
  fromAnaesthetistId: AnaesthetistId
  /** Route `colleague` only. */
  toAnaesthetistId?: AnaesthetistId
  dateISO: IsoDate
  session: Session
  hospitalId: string
  surgeonId: string
  /** The message the anaesthetist typed, for the office and the colleague; an alert's required note. */
  message?: string
  /** Kind `bookingMoved`: the Booking moved (`listId` is the new List created for it). Kind `officeAlert`: the Booking the alert is about. */
  bookingId?: BookingId
  /** The patient as "Riley, A." when it was posted (a snapshot, like the rest). */
  patientName?: string
  /** When an admin ticked it resolved (US-13.8.3); absent while active. Written once. */
  resolvedAt?: IsoDateTime
  /** Who ticked it (the office actor's `who`); written with `resolvedAt`. */
  resolvedBy?: string
}

/**
 * An office-logged phone-call note on a List (Phase 07). During the
 * authorisation review the office records a call it made about the List (e.g.
 * clarifying a missing reference with the hospital); the note shows on the
 * review action bar AND in the List's audit trail. There is deliberately NO
 * return-to-anaesthetist action anywhere — a SUBMITTED List flows only forward
 * to AUTHORISED (no Returned state); the anaesthetist can still change it until
 * then, and the last change stands (catch-up Phase 38a). Optional; the seed populates
 * none, so no PERSIST_VERSION bump.
 */
export interface ListPhoneNote {
  text: string
  by: string
  atISO: IsoDateTime
}

/**
 * A Slot (catch-up Phase 28; EP-01, US-01.1.1, DM-02, DM-04): the AM or PM
 * half-day an active anaesthetist has on every day of the schedule horizon,
 * from their start date. Every Slot is stored (OQ-64). It is a box with a
 * status and may be empty; a List is put into it (`List.slotId`) and then
 * shows in place of the status. "Slot" never appears in app copy: the UI says
 * session.
 */
export interface Slot {
  id: SlotId
  anaesthetistId: AnaesthetistId
  dateISO: IsoDate
  session: Session
  /**
   * The availability status's fixed ID (`masters.slotStatuses`): the default
   * (Free) until changed; the one availability mechanism (FT-01.2).
   */
  status: SlotStatusKey
  /** The session's note (for example "open for cover" or a leave reason). */
  note?: string
  /**
   * Per-Slot time overrides (US-01.1.4 "each Slot can override"); absent means
   * the schedule settings' default for the session. They travel with a
   * reassigned List.
   */
  startTime?: WallTime
  endTime?: WallTime
  /**
   * The availability series that set this Slot's status (catch-up Phase 29;
   * US-01.5.3). A pointer, not a second status: the Slot's own `status` is the
   * only thing anything reads.
   */
  seriesId?: SeriesId
}

/** Where a Draft List came from (catch-up Phase 31; FT-01.6, AR-22 `draft-arises`). */
export type DraftOrigin =
  /** The office logs a surgeon's room request (phone, email, PDF). */
  | 'request'
  /** A recurring booking on a session already marked closed (OQ-81 part 2). */
  | 'recurringClash'
  /** An anaesthetist moves or withdraws their List to the office (Phase 32, US-01.4.3). */
  | 'movedToOffice'
  /** They mark a booked session unavailable and return the List (Phase 32, US-01.5.5). */
  | 'unavailableReturn'
  /** A matching-screen row (Phase 33, US-02.1.2). */
  | 'hospitalRow'

/** How a request reached the office (origin `request` only). */
export type RequestSource = 'phone' | 'email' | 'pdf' | 'other'

/**
 * A Draft List's trail (catch-up Phase 31): where it came from, since when and
 * by whom. Kept after assignment (with `assignedAtISO`), so the List's history
 * shows the time it waited.
 */
export interface DraftTrail {
  origin: DraftOrigin
  /** Origin `request` only. */
  source?: RequestSource
  /** Created, or returned to the office: the waiting time runs from here. */
  sinceISO: IsoDateTime
  /** `actor.who`. */
  by: string
  /** `recurringClash` (the recurring booking's anaesthetist), `movedToOffice`, `unavailableReturn`. */
  fromAnaesthetistId?: AnaesthetistId
  /**
   * `recurringClash` only: the recurring booking, day and session it stands
   * for. Never changed by a re-date, so the recurring booking never makes a
   * second one for that day.
   */
  projectedFor?: {
    recurringBookingId: string
    dateISO: IsoDate
    session: Session
    /** The recurring booking's anaesthetist, kept when a List assigned from a clash goes back to the office (otherwise `fromAnaesthetistId`). */
    anaesthetistId?: AnaesthetistId
  }
  /** Set on assignment; the trail is kept. */
  assignedAtISO?: IsoDateTime
  assignedBy?: string
}

/**
 * Where a List came from (catch-up Phase 34; US-02.2.4, DM-70): a surgeon's
 * rooms' PDF with the address it arrived from, the hospital's list, entry by
 * hand, or a recurring booking. Set when the List is created
 * (`originForNewList`, `domain/lists/listOrigin.ts`) and kept after
 * assignment, a return to the office or a re-date. Separate from `DraftTrail`.
 */
export type ListOrigin =
  | { kind: 'pdf'; senderEmail: string; pdfListId?: PdfListId }
  | { kind: 'hospital'; hospitalId: HospitalId }
  | { kind: 'manual' }
  | { kind: 'recurring' }

/**
 * The fields every List has, Draft Lists included. Every List has exactly one
 * hospital (or AA rooms) and one surgeon (US-01.3.1, EP-01; catch-up Phase 31
 * made both required).
 */
export interface ListBase {
  id: ListId
  dateISO: IsoDate
  session: Session
  /** Private or pre-op (outside the catalogue's model; see `ListKind`). Public is a Slot status since catch-up Phase 32d. */
  kind: ListKind
  hospitalId: HospitalId
  surgeonId: SurgeonId
  conflicts: ListConflict[]
  /** Where the List came from (catch-up Phase 34; US-02.2.4). */
  origin: ListOrigin
  /** Office clears of a live conflict (catch-up Phase 30); absent reads as none. */
  conflictClears?: ConflictClear[]
  /**
   * Provenance (catch-up Phase 30; US-01.3.2): the recurring booking that
   * projected this List (or, for a recurring-clash Draft List, that it stands
   * for). An office edit of the projected fields removes it, so a hand-edited
   * List is never overwritten by a recurring booking.
   */
  recurringBookingId?: string
  /**
   * Where a projected List came from before the office moved it (catch-up
   * Phase 30): its recurring booking and original session, so the projection
   * never paints a second List for that date in the session it left.
   */
  recurringOrigin?: { recurringBookingId: string; slotId: SlotId }
  /** Office-logged phone-call notes (Phase 07 review); never a return channel. */
  phoneNotes?: ListPhoneNote[]
  /**
   * Stamped at completion of the List's billing run (Phase 08). The office
   * reads it (Billing monitor, Review's recently billed, the office stand-in).
   * It no longer decides the anaesthetist's main view: a List leaves that at
   * AUTHORISED (`hasLeftMainView`, catch-up Phase 38a, OQ-31).
   */
  billedAtISO?: IsoDateTime
  notes?: string
  /** Present on a Draft List, and kept after it is assigned (catch-up Phase 31). */
  draft?: DraftTrail
  /** A removed Draft List (US-01.6.4): soft, audited; it stays DRAFT and leaves every view but History. */
  removedAtISO?: IsoDateTime
  removedBy?: string
  removeReason?: string
  /**
   * Who took it away: the office, or a change to the recurring booking it came
   * from. Only the second stops it answering for its day (`answeringLists`);
   * the reason is display text the office can type.
   */
  removeCause?: 'office' | 'recurringBookingChanged'
}

/**
 * A List with its anaesthetist (catch-up Phase 28; EP-01, FT-07.1): created
 * when the office assigns one, a recurring booking projects one or a Draft
 * List is assigned, put into exactly one Slot, and holding Bookings. It has
 * exactly one surgeon, one anaesthetist and one hospital, plus the day and
 * session of its Slot; with all five it is ACTIVE. `anaesthetistId`, `dateISO`
 * and `session` are denormalised copies of its Slot's, written only by the
 * store actions that set `slotId`, and checked by an invariant test.
 */
export interface AssignedList extends ListBase {
  state: AssignedListState
  anaesthetistId: AnaesthetistId
  /** The Slot the List is in. Backdrop history Lists (`L-HIST`, `L-RB-`) predate the horizon and have no Slot record. */
  slotId: SlotId
}

/**
 * A Draft List (catch-up Phase 31; FT-01.6, US-01.6.1 to US-01.6.4, OQ-44
 * answered): a List in state DRAFT with no anaesthetist and no Slot, so
 * creating one changes nobody's schedule. Its hospital, surgeon, day and
 * session are all required, and it may already hold Bookings. It is never
 * offered to anaesthetists and is assigned only by the office (OQ-86 answered
 * no, D46: no Draft List reaches any anaesthetist surface, ever); assigning it
 * makes it ACTIVE in the session its day and session fix, keeping its id. A
 * cancelled or unfilled one is removed (soft) or re-dated. A recurring-clash
 * Draft List keeps its recurring booking's id as provenance.
 */
export interface DraftList extends ListBase {
  state: 'DRAFT'
  anaesthetistId?: undefined
  slotId?: undefined
  draft: DraftTrail
}

export type List = AssignedList | DraftList

/**
 * Correlation key for integration-created bookings (6th review #1): HL7 SCH-2
 * filler appointment ID (the RFP sample's `1661243` — SCH-2, not SCH-1, per
 * 7th review A15) or the FHIR Appointment identifier. S13/S14/S15 locate their
 * Booking by it; MSH-10 dedupes *messages*, this key correlates *appointments*.
 */
export interface IntegrationCorrelationRef {
  sourceFeedId: string
  externalAppointmentId: string
}

/**
 * Audited soft-cancel (7th review B23): cancelled Bookings are retained and
 * visible, excluded from completion/submission validation and billing, never
 * hard-deleted. Manual cancel and the S15 message share this mechanism.
 */
export interface BookingCancellation {
  reason: string
  by: string
  role: ActorRole
  source: AuditSource
  atISO: IsoDateTime
}

/**
 * The catalogue's live Booking sources (domain model, Booking > Sources;
 * DM-39). The domain model's bullet still lists a copy of another Booking and a
 * photo of the physical card: Copy a Booking is Retired (US-02.4.3) and photo
 * capture is Future Work (US-02.4.4), so neither is a source (catch-up Phase 15b).
 */
export type BookingSource = 'hospitalDownload' | 'surgeonPdf' | 'admin' | 'anaesthetistAdHoc'

export interface Booking {
  id: BookingId
  listId: ListId
  /** Always the hidden internal ID — never the NHI (convention 8). */
  patientId: PatientId
  scheduledTime?: WallTime
  /** Completion is validation-gated; submission is completion-gated (1st review #1). */
  completed: boolean
  completedAtISO?: IsoDateTime
  /**
   * Post-op addendum Bookings (B8; Phase 09) carry `bookingType: 'postOpAddendum'`
   * and link back to the original episode via `addendumOfBookingId`. The addendum
   * is a NEW Booking that runs its own capture->submit->authorise->bill cycle; the
   * original stays locked and immutable (the RFP's immutability answer). Both
   * fields absent on ordinary Bookings.
   */
  bookingType?: 'postOpAddendum'
  addendumOfBookingId?: BookingId
  correlationRef?: IntegrationCorrelationRef
  /**
   * How the Booking entered the system, where the creating path knows it
   * (DM-39). Optional and DISPLAY-ONLY: no validator, guard, selector, billing
   * module or review flag reads it, and absent means "not recorded". The audit
   * trail stays the record of where each change came from.
   */
  source?: BookingSource
  /**
   * The Booking's insurer or funder (catch-up Phase 21; US-11.4.3, DM-12): a
   * Party of kind `insurer` (NIB, Southern Cross Health Society) or `funder`
   * (ACC, Health NZ); absent when the patient pays. AR-58's name (earlier
   * plans called it `insurerHolderId`). Never a counterparty: it never
   * decides who is billed and never narrows the Contracts offered; it only
   * marks one path "Suggested" on the step rail (US-04.3.10). Written only by
   * `setBookingInsurance`.
   *
   * OQ-93 answered: fields on the Booking; no narrowing; the approval number
   * is the one acceptance reference; the only insurance warning is a missing
   * number on an insurer. D82 (OQ-136 answered): a Contract asks the Booking
   * for no other reference; the hospital's own reference is gone (catch-up
   * Phase 25a, DM-68).
   */
  funderPartyId?: string
  /** The insurer's approval number for the claim (US-11.4.3): the office and, on the day, the anaesthetist record it; the anaesthetist sees it. */
  insuranceApprovalNumber?: string
  cancellation?: BookingCancellation
  notes?: string
  /** Stamped in lockstep with every audit entry (7th review A8). */
  lastModifiedBy: string
  lastModifiedAtISO: IsoDateTime
}

// ---------------------------------------------------------------------------
// Procedures & billing capture
// ---------------------------------------------------------------------------

/**
 * The step rail's answers so far (US-04.3.8), held on a Procedure only while
 * it has no Contract, so whoever opens it next (the office or the
 * anaesthetist) carries on from there. Cleared when a Contract is set. Never a
 * stored destination: once a Contract is chosen, where its invoice goes is
 * worked out from the Contract (`destinationOf`).
 *
 * `narrow` is step 2's answer: `standard` or `prepaid` under Patient, a
 * funding tag id under the hospital, a holder Party id under Special.
 */
export interface RailAnswers {
  destination: 'patient' | 'hospital' | 'special'
  narrow?: string
}

/**
 * The office's approval of a Contract change (catch-up Phase 21a): who, when,
 * and how (Approve on Review, or approved at authorise).
 */
export interface ContractApproval {
  by: string
  atISO: IsoDateTime
  how: 'explicit' | 'authorise'
}

/**
 * Where a Procedure's text came from (catch-up Phase 20a; US-02.5.7, DM-51):
 * the surgeon's rooms (a PDF list or an email), the hospital (its download or
 * feed), or entered by hand (phone advice, the anaesthetist's own entry).
 * `unrecorded` is for seeded history whose channel was never kept.
 */
export type ProcedureTextSource =
  | 'surgeonPdf'
  | 'email'
  | 'hospitalDownload'
  | 'hospitalFeed'
  /** A hospital's daily sheet keyed by the office (catch-up Phase 33's `manualSheet` channel). */
  | 'hospitalSheet'
  | 'phone'
  | 'anaesthetist'
  | 'unrecorded'

/**
 * The Procedure's one text, exactly as received (US-02.5.7, DM-51): stored
 * character for character, never trimmed or reworded. `from` names the
 * sender where known (the hospital, the person who typed it).
 */
export interface ProcedureText {
  text: string
  source: ProcedureTextSource
  receivedAtISO: IsoDateTime
  from?: string
}

/** Where the invoice description's value came from (US-08.4.6, D37). */
export type InvoiceDescriptionOrigin = 'rooms' | 'entered' | 'hospital' | 'contract' | 'edited'

/**
 * The wording the invoice prints for a Procedure (US-08.4.6, DM-51): a field
 * of its own with its provenance. Set by the order of defaults
 * (`startingInvoiceDescription`), applied by `refreshInvoiceDescription`, and
 * changed by hand only by the office (`setInvoiceDescription`), whose edit
 * always wins (D73). `editedOver` is the default's text when the office
 * edited, so the view can tell a newer default has arrived since (a cue only).
 */
export interface InvoiceDescription {
  text: string
  origin: InvoiceDescriptionOrigin
  editedOver?: string
}

/**
 * Procedure — the unit of billing on a Booking. Captured BTM inputs persist AS
 * DATA, not just computed totals (7th review A3; RFP design principle 10: an
 * invoice must be reproducible against what was true when raised).
 */
export interface Procedure {
  id: ProcedureId
  bookingId: BookingId
  /**
   * Who pays for this Procedure when its Contract bills the payer (catch-up
   * Phase 22a; US-11.2.2, DM-11; D85, OQ-140 answered): filled in from the
   * patient on every creation path, a Procedure added later copying a shared
   * payer (`payerForNewProcedure`), written only by `setProcedurePayer`.
   */
  payer: ProcedurePayer
  /**
   * The procedure text, exactly as received (catch-up Phase 20a; US-02.5.7,
   * DM-51). Written only by `createBooking` and `replaceProcedureText`; never
   * edited (`editProcedure` refuses it). A replaced text goes to the Booking's
   * change history as the `procedure.procedureText.replace` audit entry, never
   * a second field here. Null when none was received.
   */
  procedureText: ProcedureText | null
  /**
   * The invoice description (catch-up Phase 20a; US-08.4.6, D37, D73). Null
   * when there is nothing to print yet. Changed only through
   * `refreshInvoiceDescription` (by the store actions) and the office's
   * `setInvoiceDescription` / `applyDefaultInvoiceDescription`.
   */
  invoiceDescription: InvoiceDescription | null
  /**
   * The Procedure's one Contract (US-04.3.1, DM-10): set by the office at
   * booking setup on the step rail, or by the anaesthetist until the List is
   * AUTHORISED. None is "Needs an invoice destination" (US-04.3.4): the
   * Booking waits on the office's list and completion refuses it. Written only
   * through `setProcedureContract` (or a creation path given one), never
   * `editProcedure`.
   */
  governingContractId?: ContractId
  /** The step rail's answers so far while no Contract is set (US-04.3.8); cleared when one is. */
  railAnswers?: RailAnswers
  /**
   * The one typed price (catch-up Phase 24; DM-14, US-05.2.8): ex GST, in
   * dollars like every other figure, 0 allowed. The anaesthetist's override on
   * an RVG Contract that allows it, the amount on an open-price fallback, or
   * the office's change on any Contract (`setProcedurePrice`); it holds the
   * price ahead of the computed one (`priceFor`) and a Contract change clears
   * it. Never a rate or a discount: those are the Contract's.
   */
  enteredPrice?: number

  /**
   * The Booking's primary Procedure (catch-up Phase 23; US-03.2.1, US-03.2.2,
   * DM-15): exactly one per Booking that has Procedures, guaranteed by the
   * store, and listed first everywhere (`inDisplayOrder`). It drives the
   * multi-procedure rule (`domain/billing/multiProcedure.ts`): base units and
   * the Booking's modifiers are recorded on the primary, time units on every
   * Procedure, and modifiers above 4 split across the RVG-priced Procedures.
   * The primary is a choice, not the first done: the first Procedure entered
   * starts as the primary, and anyone with edit rights changes it with Make
   * primary (`setPrimaryProcedure`). An ACC pre-op assessment is a pre-op
   * event (39b), never a Procedure, so never primary. The flag is the
   * catalogue's addition beside the flat ERD's booking procedure fields
   * (AR-61#booking-procedure; the domain model's "`isPrimary` flag drives the
   * multi-procedure rule").
   */
  isPrimary: boolean

  // --- captured BTM inputs (data, not derivation) ---
  /**
   * The optional modifiers claimed, each with a short explanation (catch-up
   * Phase 19b, DM-44). Written only through the modifier store actions, never
   * `editProcedure`. The age and included modifiers are derived, not stored.
   */
  modifierClaims: ModifierClaim[]
  /** The pre-applied modifiers (age, included) the anaesthetist removed. */
  removedModifierIds: ModifierId[]
  /**
   * The modifiers step is answered (catch-up Phase 21a; US-03.3.4, US-03.6.1;
   * our reading of AR-58 A20, which does not say how a step with no modifier
   * completes): set by claiming a modifier or by "None apply"
   * (`confirmNoModifiers`). Never cleared by a Contract change or by removing
   * a claim. Pre-applied age and included modifiers do not count: the step is
   * the anaesthetist's decision. Required on an RVG kind only (`rvgDetail.ts`).
   */
  modifiersConfirmed?: boolean
  /**
   * The office's approval of the anaesthetist's latest Contract change
   * (catch-up Phase 21a; US-07.2.2, US-03.4.1, DM-10): stamped by
   * `approveContractSelection` (`explicit`) or by `authoriseList` for a change
   * still unapproved (`authorise`). Whether a change is pending is read from
   * the audit's order (`contractChangeFor`), so a later change re-opens it.
   */
  contractApproval?: ContractApproval
  /**
   * The RVG code, optional (catch-up Phase 19): a reference to one RVG group
   * row by its hidden id. The Procedure's `description` stays the text received.
   */
  rvgGroupId?: RvgGroupId
  /** The anaesthetist's chosen value on a ranged RVG group (any whole number, D3). */
  baseUnitsSelected?: number
  /** B/T/M with provenance — an office/anaesthetist override beats the seeded computation. */
  baseUnitsCaptured?: CapturedUnits
  timeUnitsCaptured?: CapturedUnits
  modifierUnitsCaptured?: CapturedUnits
  anaestheticStartISO?: IsoDateTime
  handoverISO?: IsoDateTime

  /**
   * The split of this Procedure's fee between billable parties (catch-up
   * Phase 22; US-08.2.3, DM-28): typed by the office or the anaesthetist with
   * the Split button, through `setProcedureSplit`. Absent means no split: the
   * party the Contract bills is invoiced in full. Nothing on the Contract
   * names a split or a default share.
   */
  split?: FeeSplit

  /** The legacy Outcome panel's Int Notes / Op Notes (Phase 04 capture). */
  intNotes?: string
  opNotes?: string
}

/** One party's share of a split fee, typed in $ (ex GST) or %, or the rest (catch-up Phase 22). */
export type SplitShareBasis =
  | { kind: 'amount'; amountExGst: number }
  | { kind: 'percent'; percent: number }
  | { kind: 'rest' }

export interface SplitShare {
  /** Who pays this share: the same reference the invoice build bills (`billablePartyForProcedure`). */
  party: CounterpartyRef
  basis: SplitShareBasis
  /**
   * "Another person" (catch-up Phase 22a; US-08.2.3, DM-28): a person named on
   * this share alone, with their own `BP####` id and contact; `party` is then
   * `{ kind: 'payer', id: person.id }`. Never the Procedure's payer, never
   * matched on name or email.
   */
  person?: OtherPayer
}

/** A Procedure's fee split (US-08.2.3): the maths lives only in `domain/billing/splitShare.ts`. */
export interface FeeSplit {
  shares: SplitShare[]
}

/** How a billing line's amount arises: units at a rate, or a fixed amount (the rate x time basis is gone, catch-up Phase 24, RV-03). */
export type ChargeBasis = 'rvg' | 'fixed'

/**
 * A captured billing line (a fixed amount; an RVG line is never
 * an input). Who pays is the Procedure's Contract, or its split (catch-up
 * Phase 22), never the line.
 */
export interface BillingLine {
  id: string
  procedureId: ProcedureId
  chargeBasis: ChargeBasis
  units?: number
  /** $ per unit ('rvg'). */
  rate?: number
  amount: number
  description: string
}

// ---------------------------------------------------------------------------
// RVG & modifier masters
// ---------------------------------------------------------------------------

/**
 * The RVG groups (catch-up Phase 19; the model module is
 * domain/billing/rvgGroups.ts): the one master list base units come from.
 */
export type {
  BaseUnitsRange,
  BaseUnitsSource,
  GuideValue,
  ResolvedBaseUnits,
  RvgGroup,
  RvgGroupId,
} from './billing/rvgGroups'

/**
 * Modifiers (catch-up Phase 19b; the rule module is domain/billing/modifiers.ts):
 * the master (the NZSA RVG 2021 table as printed, plus AA's own), a Procedure's
 * claims, and the derived itemised rows pricing and the UI read.
 */
export type {
  Modifier,
  ModifierClaim,
  ModifierId,
  ModifierOrigin,
  ProcedureModifier,
} from './billing/modifiers'
import type { ModifierClaim, ModifierId } from './billing/modifiers'

// ---------------------------------------------------------------------------
// Scheduling masters
// ---------------------------------------------------------------------------

/**
 * Recurring booking (DM-53, US-01.3.2; catch-up Phase 30 renamed the
 * Permanent List): the standing intersection of a hospital, an anaesthetist
 * and a surgeon on a day of the week and a session. A pattern of Lists, not a
 * Booking for one patient. It always names a hospital (or AA rooms) and a
 * surgeon (US-01.3.1, catch-up Phase 31), because it projects Lists.
 */
export interface RecurringBooking {
  id: string
  hospitalId: HospitalId
  anaesthetistId: AnaesthetistId
  /** 0 = Sunday … 6 = Saturday (matches `Date.getDay()`). */
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6
  session: Session
  surgeonId: SurgeonId
  /** The kind of List the projection creates (catch-up Phase 28: was `statusKey`). */
  kind: ListKind
  /** Optional session times, written as Slot overrides by the projection (e.g. pre-op 09:00 to 12:00). */
  startTime?: WallTime
  endTime?: WallTime
  /** Display label the generated List carries as its note (e.g. "Acute theatre"). */
  notes?: string
  /** First date the arrangement runs (catch-up Phase 30); absent means from the start of the canvas. */
  effectiveFromISO?: IsoDate
  /** Last date the arrangement runs; absent means ongoing. A retire sets it. */
  effectiveToISO?: IsoDate
  /** Set by `retireRecurringBooking`: the row stays in the master for its history and never projects again. */
  retiredAtISO?: IsoDateTime
}

/**
 * One session of the seed's leave calendar (catch-up Phase 28: was the
 * availability master, which was reconciled into the canvas). It is generator
 * input only: generation paints it onto the Slot's status after writing the
 * Slot free (US-01.1.1). At runtime availability lives on the Slot alone.
 */
export interface SeedLeaveWindow {
  anaesthetistId: AnaesthetistId
  dateISO: IsoDate
  session: Session
  status: SlotStatusKey
  note?: string
}

/**
 * The schedule settings (catch-up Phase 28; FT-01.1, US-01.1.4): the horizon
 * in whole months (four in current practice) and the default AM and PM times,
 * one record the office edits.
 */
export interface ScheduleSettings {
  horizonMonths: number
  defaultTimes: Record<Session, { startTime: WallTime; endTime: WallTime }>
}

export interface HospitalHoliday {
  id: string
  hospitalId: HospitalId
  dateISO: IsoDate
  name: string
}

/**
 * An availability status (catch-up Phase 29; US-01.2.2, OQ-64 answered): one
 * row of the user-maintained master `masters.slotStatuses`, availability
 * values only. Never a List's state (DRAFT, ACTIVE, SUBMITTED, AUTHORISED).
 */
export interface SlotStatus {
  /** Fixed internal ID that rules read: seeded `free`/`holiday`/`unavailable`, added `ST####`. Never edited. */
  key: SlotStatusKey
  /** Chip label, at most 16 characters. */
  label: string
  /** Headers and pickers, at most 32 characters. */
  longLabel: string
  /** What the status means (legend and editor). */
  description: string
  /** One of the design's six tokens, never a free hex. */
  colour: StatusColourToken
  treatment: StatusTreatment
  /** Open for bookings: the office may place a List and the finders count it as free. */
  bookable: boolean
  anaesthetistCanSet: boolean
  /** The status every new session takes and a cleared one returns to (exactly one, bookable). */
  isDefault?: true
  order: number
  retiredAtISO?: IsoDateTime
}

/** Monday first, ISO numbering (1 = Monday ... 7 = Sunday). */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7

export type SeriesId = string

/** One instance of a series changed or deleted on its own, keyed `<dateISO>-<AM|PM>`. */
export type SeriesException =
  | { kind: 'deleted' }
  | { kind: 'edited'; statusKey: SlotStatusKey; note?: string }

/**
 * Repeating days off (catch-up Phase 29; US-01.5.3: "recurring days off are a
 * rule on the calendar"). A rule plus exceptions that writes the status onto
 * its Slots; nothing reads availability from it, only from Slots.
 */
export interface AvailabilitySeries {
  id: SeriesId
  anaesthetistId: AnaesthetistId
  statusKey: SlotStatusKey
  sessions: 'AM' | 'PM' | 'both'
  note?: string
  /** Monday first, at least one. */
  weekdays: Weekday[]
  everyWeeks: 1 | 2 | 3 | 4
  startISO: IsoDate
  /** No until date: the series runs with the horizon. */
  untilISO?: IsoDate
  exceptions: Record<string, SeriesException>
  createdAtISO: IsoDateTime
  /** A deleted series is ended, not removed, so audit and history still read. */
  endedAtISO?: IsoDateTime
}

// ---------------------------------------------------------------------------
// Day notes (Phase 06 — the Admin Day mockup's Internal notes panel)
// ---------------------------------------------------------------------------

/**
 * A per-day internal office note. Stored per calendar date on the app state
 * (`dayNotes`), never on a List — these are the office's day-level annotations
 * (Admin Day mockup). A `flagged` note renders with an amber left bar.
 */
export interface DayNote {
  id: string
  atISO: IsoDateTime
  by: string
  /** Display initials, e.g. "KW" — derived from the author's name. */
  initials: string
  text: string
  flagged: boolean
}

// ---------------------------------------------------------------------------
// Audit
// ---------------------------------------------------------------------------

/**
 * Append-only audit entry (convention 7). Every Booking/Procedure mutation (and
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

/** The supplier on a receivable invoice (US-08.4.5): the anaesthetist, as at the run. */
export interface InvoiceSupplier {
  anaesthetistId: AnaesthetistId
  name: string
  gstNumber?: string
}

/** AA as agent on a receivable invoice (US-08.4.5), as at the run. */
export interface InvoiceAgent {
  name: string
  gstNumber: string
}

/** One send of an emailed invoice: the run's, then any office Resend. */
export interface InvoiceSend {
  atISO: IsoDateTime
  to: string
  by: string
}

/**
 * How the invoice went out (catch-up Phase 22; US-08.4.2, FT-08.4): stamped by
 * the billing run from `invoiceDeliveryFor` (the Party's setting, or the
 * payer's email, else post). No portal value (D55's default, OQ-114 open).
 */
export type InvoiceDelivery =
  | { method: 'email'; status: 'sent'; sends: InvoiceSend[] }
  | { method: 'email'; status: 'noAddress' }
  | { method: 'post'; status: 'toPost'; address: string[]; markedAtISO: IsoDateTime }

/** The split share an invoice was raised for (US-08.2.3). */
export interface InvoiceSplitInfo {
  procedureId: ProcedureId
  /** The Procedure's whole fee, ex GST, that was split. */
  feeExGst: number
  /** "$132.50", "62.5%" or "the rest". */
  shareLabel: string
  isRest: boolean
}

/** Links between invoices (Phase 38b adds `additionalTo`, Phase 39 `rebillOf`). */
export interface InvoiceLineage {
  role: 'otherShareOfSplit'
  invoiceId: InvoiceId
}

/** The holder layout's cross-match fields (US-08.4.1), as at the run: the procedure date and the surgeon (no Booking reference, D82; the approval number on it is OQ-142, open). */
export interface InvoiceCrossMatch {
  procedureDateISO: IsoDate
  surgeon?: string
}

export interface Invoice {
  id: InvoiceId
  invoiceNumber: string
  caseReference: string
  bookingId: BookingId
  counterparty: CounterpartyRef
  /** The addressee's name and contact as at the run (catch-up Phase 21), so a payer's details stay with the debt. */
  billedTo?: InvoiceBilledTo
  /** The holder's layout or the patient's, from the Contract (`invoiceLayoutFor`, catch-up Phase 22), snapshotted at the run. */
  layout: 'contractHolder' | 'patient'
  kind: 'standard' | 'prePayment'
  subtotal: number
  gst: number
  total: number
  raisedAtISO?: IsoDateTime
  /** The Procedures this invoice bills, in Booking order (catch-up Phase 22). */
  procedureIds?: ProcedureId[]
  /** The anaesthetist as supplier (US-08.4.5), snapshotted at the run. */
  supplier?: InvoiceSupplier
  /** AA as agent (US-08.4.5), snapshotted at the run. */
  agent?: InvoiceAgent
  /** Set on an invoice raised from a split share (US-08.2.3). */
  split?: InvoiceSplitInfo
  /** The Contract's holder reference code (US-04.2.18), on the holder layout. */
  holderReference?: string
  /** The holder layout's cross-match fields (US-08.4.1). */
  crossMatch?: InvoiceCrossMatch
  /** The other shares of the same split. */
  lineage?: InvoiceLineage[]
  /**
   * A $0.00 invoice for a Procedure priced at $0 (catch-up Phase 24; US-03.5.1):
   * headed "No charge", delivered like any other, its Xero receivable $0.00 and
   * no payable leg or BCTI. A reading.
   */
  noCharge?: true
  /** How it was sent (US-08.4.2); stamped by the run. */
  delivery?: InvoiceDelivery
  /**
   * A prepayment invoice's approval (catch-up Phase 27; US-06.3.1, D6): an
   * admin approved it, or approval was switched off and the system sent it.
   */
  approval?: InvoiceApproval
}

/** Who let a prepayment invoice go out, and how (catch-up Phase 27). */
export interface InvoiceApproval {
  mode: 'approved' | 'automatic'
  by: string
  role: ActorRole
  atISO: IsoDateTime
}

/** The B/T/M breakdown printed on a holder-layout fee line (US-08.4.1). */
export interface InvoiceLineBtm {
  /** Base units charged: 0 on an additional procedure (catch-up Phase 23). */
  base: number
  time: number
  /** The modifier units charged here: the Procedure's share under the multi-procedure rule. */
  modifiers: number
  /** The units charged: base + time + modifiers. */
  units: number
  unitValue: number
  /** Set on an additional procedure's line (catch-up Phase 23); absent reads as primary (and on a line issued before it). */
  role?: 'additional'
  /** The Booking's modifier units when they were split ("Modifiers 3 of 7"); absent when not split. */
  modifiersOf?: number
}

export interface InvoiceLine {
  id: string
  invoiceId: InvoiceId
  procedureId?: ProcedureId
  /** A fee, a discount (its own negative line) or an adjustment (a prepayment deduction; a typed price prints as the fee line since catch-up Phase 24). */
  kind?: 'fee' | 'discount' | 'adjustment'
  description: string
  units?: number
  amount: number
  /** Holder layout fee lines only. */
  btm?: InvoiceLineBtm
  /**
   * A prepayment line's Contract when it was raised (catch-up Phase 27): the
   * re-check reads it to tell a Procedure that changed Contract after sending.
   */
  contractId?: ContractId
}

// ---------------------------------------------------------------------------
// The internal ledger (catch-up Phase 36; FT-08.3, US-08.3.1, US-08.3.2, DM-22,
// DM-23). AA's system of record for what is owed and what has moved: every
// invoice the engine raises is a ledger pair, made in the same mutate as the
// invoice, before and independent of the Xero hand-off. Xero mirrors the legs
// (their `xero*Id`s) as a receivables and banking service. The maths is pure,
// in `domain/billing/ledger.ts`.
// ---------------------------------------------------------------------------

/** Who a payable leg pays: an anaesthetist, or the AA Holding account (US-06.5.1). Stamped when the leg is made and never changed (D38): no repoint exists. */
export type PayeeRef = { kind: 'anaesthetist'; anaesthetistId: AnaesthetistId } | { kind: 'holding' }

/** Money a billable party owes AA: the invoice. Cumulative amounts, signed so a later credit (Phase 39) can enter. */
export interface ReceivableLeg {
  /** The invoice number (US-08.4.3). */
  number: string
  /** Who is billed: the invoice's own payer or holder, read from the invoice (22a, D85); the anaesthetist on an AA fee pair. */
  counterparty: CounterpartyRef | { kind: 'anaesthetist'; id: AnaesthetistId }
  /** The invoice total, GST inclusive. */
  amount: number
  /** CUMULATIVE received (money in to AA). */
  receivedAmount: number
  /** Set once, by the receipt that completes it (the BCTI count's paid month); a replay never moves it. */
  paidInAtISO?: IsoDateTime
  /** The Xero ACCREC mirroring it; absent until the hand-off. */
  xeroAccRecId?: string
}

/**
 * Money AA owes on a receivable: to the anaesthetist, or to the AA Holding
 * account for a prepayment. On a procedure pair this leg IS the BCTI: one per
 * receivable invoice, the same value, never one per Procedure (OQ-29 open; the
 * one-place note is beside `bctiRecordsOf`).
 */
export interface PayableLeg {
  /** `${invoiceNumber}-P` on a pair (US-08.4.3), stored; a transfer's own id on its `in` leg. */
  number: string
  payee: PayeeRef
  /** Equals the receivable's amount (FT-10.3: AA's fee is its own invoice, never deducted). */
  amount: number
  /** CUMULATIVE released for the payables run: exactly what was received (`payableReleasedFor`). */
  releasedAmount: number
  /** CUMULATIVE paid out (the ledger's record of a payment made in Xero, D53). */
  disbursedAmount: number
  /** When it was issued: the date the BCTI counts in under `paidOnly: false`. */
  issuedAtISO: IsoDateTime
  /** Stamped when paid out in full. */
  paidOutAtISO?: IsoDateTime
  /** The Xero ACCPAY mirroring it; absent until the hand-off (never on a transfer). */
  xeroAccPayId?: string
}

/** One Procedure's part of a Booking pair's invoice (information about the one payable, never a split of it). */
export interface ProcedureShare {
  procedureId: ProcedureId
  units?: number
  amountExGst: number
}

/**
 * A Booking's ledger pair: a procedure invoice (`procedure`) or a prepayment
 * invoice (`prePayment`, its payable to the AA Holding account until 27a's
 * transfer moves it, 27). Linked to the Booking, its List, the patient (whoever
 * pays, so a patient's position reaches every invoice of theirs, DM-23) and the
 * Procedures it bills.
 */
export interface BookingLedgerPair {
  id: string
  kind: 'procedure' | 'prePayment'
  invoiceId: InvoiceId
  bookingId: BookingId
  listId: ListId
  /** The payee anaesthetist, the same id as the payable leg's; absent on a `prePayment` pair (its payee is the AA Holding account). */
  anaesthetistId?: AnaesthetistId
  /** The patient's hidden internal id, set whoever pays. */
  patientId: PatientId
  procedureIds: ProcedureId[]
  procedureShares: ProcedureShare[]
  createdAtISO: IsoDateTime
  receivable: ReceivableLeg
  /** Absent only on a no-charge invoice (catch-up Phase 24: a $0.00 receivable, nothing owed, no BCTI). */
  payable?: PayableLeg
  /** The archived account's ACC marker (seeded history only; catch-up Phase 18a). */
  archivedAccRelated?: true
}

/** AA's monthly fee invoice to an anaesthetist (catch-up Phase 16; FT-10.3, DM-26): a receivable from the anaesthetist and NO payable. AA's own money, never part of what is held for anaesthetists. */
export interface AaFeeLedgerPair {
  id: string
  kind: 'aaFee'
  aaFeeInvoiceId: string
  anaesthetistId: AnaesthetistId
  createdAtISO: IsoDateTime
  receivable: ReceivableLeg
}

/** A ledger pair: every consumer says which kinds it reads. */
export type LedgerPair = BookingLedgerPair | AaFeeLedgerPair

/**
 * Money in (Phase 10's billing receipt, a ledger entry since catch-up Phase 36). Append-only: the
 * GST-report source (each carries its GST component) and the payment
 * idempotency key-set. An AA fee payment is money in to AA, never the
 * anaesthetist's income: `pairKind` says so, and it carries no anaesthetist.
 */
export interface LedgerReceipt {
  id: string
  pairId: string
  pairKind: LedgerPair['kind']
  /** The payee anaesthetist on a procedure receipt; absent on a prepayment held in the AA Holding account and on an AA fee payment. */
  anaesthetistId?: AnaesthetistId
  accRecId?: string
  grossAmount: number
  gstAmount: number
  atISO: IsoDateTime
  idempotencyKey: string
  source: 'webhook' | 'poll' | 'allocation' | 'aaFee'
}

/** Money out to an anaesthetist (the ledger's record of a payment made in Xero, D53). */
export interface LedgerDisbursement {
  id: string
  /** The pair or transfer whose payable it pays. */
  pairId: string
  anaesthetistId: AnaesthetistId
  amount: number
  atISO: IsoDateTime
  /** The Xero payables run that paid it. */
  payablesRunId: string
  /** The Xero bill payment it records (catch-up Phase 37: set on every detected entry). */
  xeroDisbursementId?: string
  /** The Xero bill payment's key (`BILLPAY-`): the key-set that makes detection idempotent, as receipts are for payments. */
  idempotencyKey: string
  /** How the engine learned of the bill payment: Xero's bill-paid webhook or the reconciliation poll. */
  detectedBy: 'webhook' | 'poll'
}

/**
 * A receipt that matches no invoice (US-08.3.4): held in the ledger, so the
 * ledger is out of balance until the office allocates or refunds it.
 * `anaesthetistId` is set only when it arrived attributed (its bank reference
 * names one), never guessed from the amount; it then counts in that
 * anaesthetist's scope.
 */
export interface UnmatchedReceipt {
  id: string
  amount: number
  reference: string
  atISO: IsoDateTime
  idempotencyKey: string
  source: 'webhook' | 'poll'
  anaesthetistId?: AnaesthetistId
  status: 'held' | 'allocated' | 'refunded'
  allocatedToPairId?: string
  resolvedAtISO?: IsoDateTime
  resolvedBy?: string
  note?: string
}

/** A billing-run failure (OQ-05): no invoice was raised, so it is no pair. One per Booking, which fails whole. */
export interface BillingException {
  id: string
  bookingId: BookingId
  listId: ListId
  code: string
  message: string
  procedureId?: ProcedureId
  atISO: IsoDateTime
  resolvedAtISO?: IsoDateTime
  resolvedPairIds?: string[]
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
  /**
   * What the receivable is for. `procedure`: a procedure invoice, paired with
   * an ACCPAY (its `invoiceId` is a Billing Engine `Invoice`). `aaFee`: AA's own
   * monthly fee invoice to an anaesthetist, with no ACCPAY (catch-up Phase 16).
   */
  kind: 'procedure' | 'aaFee'
  invoiceId: InvoiceId
  contactId: string
  /** Xero InvoiceNumber: the engine's invoice number, stored (US-09.1.1). */
  invoiceNumber: string
  /** Xero Reference: the case reference, for internal tracing only (US-09.1.1). */
  reference: string
  /** When the record was raised in Xero (the demo clock at handoff). */
  issuedAtISO: IsoDateTime
  amountDue: number
  /** CUMULATIVE across successive partial payments (7th review A16). */
  amountReceived: number
  /** Set once, by the payment that completes it (the BCTI count reads it). */
  paidAtISO?: IsoDateTime
  status: 'awaitingPayment' | 'paid' | 'voided'
  /** When AA staff voided it directly in Xero (catch-up Phase 37): invisible to the engine until the poll. */
  voidedAtISO?: IsoDateTime
  /** When AA staff edited its total directly in Xero (catch-up Phase 37); the engine keeps the issued total on its receivable leg. */
  amendedAtISO?: IsoDateTime
}

export interface XeroAccPay {
  /** Xero bill GUID. */
  id: string
  /** The paired ACCREC (handoff is pair-atomic; 7th review B8). */
  accRecId: string
  contactId: string
  /** The receivable's InvoiceNumber with the `-P` suffix (US-08.4.3), stored. */
  invoiceNumber: string
  /** The case reference, as on the paired ACCREC (US-09.1.1). */
  reference: string
  issuedAtISO: IsoDateTime
  /**
   * The payee: the anaesthetist who did the procedure (the List's anaesthetist
   * at handoff). The BCTI count charges it to this anaesthetist.
   */
  anaesthetistId: AnaesthetistId
  /**
   * Equals the paired ACCREC's amountDue (FT-10.3: AA's fee is its own monthly
   * invoice, never deducted here).
   */
  amountPayable: number
  /** CUMULATIVE (7th review A16): payables runs pay authorised minus disbursed. */
  amountAuthorised: number
  amountDisbursed: number
  status: 'draft' | 'authorised' | 'paid'
  /**
   * Who the payable credits when it is not the anaesthetist (catch-up Phase
   * 27; FT-06.3): a prepayment's payable credits the AA Holding account
   * (`AA_HOLDING_ACCOUNT`), which the payables run never pays; 27a's transfer
   * pays the anaesthetist who did the List. `anaesthetistId` still names the
   * List's anaesthetist at the time. Absent: the anaesthetist.
   */
  payeeAccount?: 'aaHoldingAccount'
  /**
   * The ACCPAY held as a buyer-created tax invoice (catch-up Phase 22;
   * US-09.1.4): one per receivable invoice, the same value. Wording and the
   * document's name are provisional (OQ-29). Absent only on records from
   * before the phase (the seed fills every one).
   */
  taxInvoice?: BuyerCreatedTaxInvoice
}

/** The buyer-created tax invoice wording an ACCPAY carries (US-09.1.4; provisional, OQ-29). */
export interface BuyerCreatedTaxInvoice {
  kind: 'buyerCreated'
  documentName: string
  wording: string
  supplierName: string
  supplierGstNumber?: string
  agentName: string
  agentGstNumber: string
  relatesToInvoiceNumber: string
  provisional: true
}

export interface PaymentIn {
  id: string
  accRecId: string
  amount: number
  atISO: IsoDateTime
  /** Per-payment idempotency key alongside the InvoiceID (7th review A16). */
  idempotencyKey: string
  /**
   * `aaFee`: an anaesthetist paying AA's monthly fee invoice into AA's own
   * account (catch-up Phase 16). It is never a procedure receipt.
   * `allocation`: the office allocated an unmatched receipt to this invoice
   * (catch-up Phase 36), dated the receipt's own day.
   */
  source: 'webhook' | 'poll' | 'aaFee' | 'allocation'
}

// ---------------------------------------------------------------------------
// AA's monthly fee (catch-up Phase 16; FT-10.3, US-10.3.1 to US-10.3.3, D1, DM-26)
// ---------------------------------------------------------------------------

/** One fixed item of AA's monthly fee (several may make up the fixed fee). */
export interface AaFeeFixedItem {
  id: string
  description: string
  /** Excluding GST. */
  amount: number
}

/**
 * AA's fee settings, kept in app settings and not in code (US-10.3.3). Every
 * amount is held EXCLUDING GST: the system holds every price ex GST and works
 * GST out once at the foot of the invoice, because the rate can change
 * (US-05.2.7, Greg 2026-10-07). So there is no "amounts include GST" flag.
 * One schedule for every anaesthetist; whether the fixed items vary by
 * anaesthetist is OQ-60, so the shape can be keyed by anaesthetist later.
 */
export interface AaFeeSettings {
  fixedItems: AaFeeFixedItem[]
  /** Charge per BCTI paid in the month, excluding GST. */
  perBctiCharge: number
}

export interface AaFeeInvoiceLine {
  description: string
  /** Excluding GST. */
  amount: number
}

/** A counted BCTI, snapshotted onto the fee invoice that charged it. */
export interface AaFeeCountedBcti {
  accPayId: string
  /** The ACCPAY's number (the receivable's with `-P`). */
  billNumber: string
  receivableInvoiceNumber: string
  issuedAtISO: IsoDateTime
  receivablePaidAtISO?: IsoDateTime
}

/**
 * AA's monthly fee invoice to one anaesthetist: the document. Its money is its
 * `aaFee` ledger pair's (catch-up Phase 36; DM-26): a receivable from the
 * anaesthetist and no payable, AA's own income, never netted against a
 * payable (FT-10.3). Its `bctis` snapshot records what was counted at the
 * time; it is not a second count.
 */
export interface AaFeeInvoice {
  id: string
  /** `AA-FEE-2026-####`. */
  invoiceNumber: string
  /** The fee invoice's own case reference (its id). */
  reference: string
  anaesthetistId: AnaesthetistId
  /** `YYYY-MM`. */
  monthISO: string
  /** The settings it was raised with: a later change applies to the next run only. */
  settings: AaFeeSettings
  lines: AaFeeInvoiceLine[]
  bctis: AaFeeCountedBcti[]
  bctiCount: number
  /** Excluding GST. */
  subtotal: number
  gst: number
  total: number
  raisedAtISO: IsoDateTime
  /** The office button, or the scheduled month-end run. */
  raisedBy: 'office' | 'scheduled'
  /** Its `aaFee` ledger pair: the receivable, its Xero mirror and its money. */
  ledgerPairId: string
}

export interface Disbursement {
  id: string
  /** The ACCPAY paid. Absent when the run paid a transferred prepayment: the AA Holding account's payable is never paid. */
  accPayId?: string
  /** Set when the run paid a transferred prepayment (catch-up Phase 27a): the transfer, not an ACCPAY, was paid. */
  transferId?: string
  amount: number
  atISO: IsoDateTime
  payablesRunId: string
  /** The bill payment's key (`BILLPAY-<id>`, catch-up Phase 37): the engine records it once, by webhook or poll. */
  idempotencyKey: string
}

/**
 * The Billing Engine's durable Xero sync queue (catch-up Phase 37; EP-09's
 * resilience brief): every engine-to-Xero call that could not complete waits
 * here with its attempt count and an exponential-backoff next attempt on the
 * demo clock, and is retried until Xero answers. Keyed, so a retry never
 * duplicates. Engine-side (`billing.xeroQueue`); sent items stay as history.
 */
export interface XeroQueueItem {
  /** `XQ####`. */
  id: string
  kind: 'handoff' | 'journal' | 'paymentSync' | 'disbursementSync' | 'poll'
  /** `HANDOFF-<pairId>`, `JOURNAL-<transferId>`, the payment's own key, the bill payment's key, `POLL-<dateISO>`. */
  idempotencyKey: string
  target: { pairId?: string; transferId?: string; accRecId?: string; accPayId?: string; xeroPaymentId?: string; xeroDisbursementId?: string }
  enqueuedAtISO: IsoDateTime
  /** Attempts made, the first (failed) call included. */
  attempts: number
  nextAttemptAtISO: IsoDateTime
  lastError?: string
  status: 'waiting' | 'alerted' | 'sent'
  sentAtISO?: IsoDateTime
}

/**
 * A mismatch the reconciliation poll found between what the engine issued and
 * what Xero now shows (catch-up Phase 37; EP-09, US-09.2.2): an invoice voided
 * or amended directly in Xero. The ledger keeps the issued amount; the
 * office's resolution is recorded (provisional: the policy is AA's to agree)
 * and moves no money.
 */
export interface XeroDivergence {
  /** `XD####`. */
  id: string
  kind: 'voidedInXero' | 'amendedInXero'
  accRecId: string
  pairId: string
  invoiceId: InvoiceId
  /** What Xero shows, with when AA staff changed it there. */
  xeroShows: { status: XeroAccRec['status']; total: number; changedAtISO?: IsoDateTime }
  engineHolds: { amount: number; outstanding: number }
  detectedAtISO: IsoDateTime
  status: 'open' | 'resolved'
  resolution?: { outcome: 'reissueInXero' | 'creditInEngine' | 'noAction'; note: string; who: string; atISO: IsoDateTime }
}

/** A remittance advice a payer sent with one bulk deposit (catch-up Phase 37; US-10.2.4). Xero side only. */
export interface XeroRemittance {
  /** `RMT####`. */
  id: string
  payerContactId: string
  receivedAtISO: IsoDateTime
  reference: string
  lineIds: string[]
}

/** One line of a bulk deposit in Xero's bank reconciliation (catch-up Phase 37). Xero side only: an unmatched line never reaches the engine. */
export interface XeroBankLine {
  /** `BKL####`. */
  id: string
  remittanceId: string
  quotedReference: string
  amount: number
  status: 'matchedByAddOn' | 'unmatched' | 'matchedByOffice'
  accRecId?: string
  paymentInId?: string
}

/**
 * The transfer of a prepayment from the AA Holding account to the anaesthetist
 * who did the List (catch-up Phase 27a; US-06.5.1, US-09.1.3, DM-21, D38): one
 * entry with both legs (the account's payable for the prepayment reduced, a
 * payable to the anaesthetist created), linked to its prepayment invoice. An
 * accounting move, not an invoice, an ACCREC, a `PaymentIn` or a receipt: no
 * GST moves. One per collect case, so one per payer's prepayment invoice.
 * Written only at List authorisation (the trigger provisional, OQ-125, D72).
 * Promoted into the ledger by catch-up Phase 36 (27a's `PrepayTransfer`): held
 * as two payable legs, never a receivable, neither money in nor money out of
 * AA. Phases 37 and 39a read these names: keep them.
 */
export interface LedgerTransfer {
  id: string
  kind: 'prepayTransfer'
  /** The `prePayment` pair it transfers from. */
  collectPairId: string
  invoiceId: InvoiceId
  bookingId: BookingId
  listId: ListId
  patientId: PatientId
  /** The payer identity of the invoice (22a's `kind:id`), for the entries table only. */
  payerKey?: string
  createdAtISO: IsoDateTime
  /** The AA Holding account's payable reduced: what it held for the prepayment at the transfer, and so what left it. */
  out: { amount: number }
  /**
   * The payable to the anaesthetist who did the List (the payee locked at
   * authorise, catch-up Phase 25): the prepayment invoice's total, gross, so it
   * equals the payable it replaces, released exactly as the payer pays.
   */
  in: PayableLeg
  /** The simulated Xero manual journal mirroring it (`postTransferJournal`); absent until posted. A failed post waits in the Xero sync queue (catch-up Phase 37). */
  xeroJournalId?: string
}

/** One line of a simulated Xero manual journal. */
export interface XeroJournalLine {
  /** The creditor the line moves: the AA Holding account's contact, or the anaesthetist's. */
  contactId: string
  description: string
  debit: number
  credit: number
}

/**
 * A simulated Xero manual journal (catch-up Phase 27a): the mirror of a
 * prepayment transfer, two lines (debit the AA Holding account's payable,
 * credit the anaesthetist's), referencing the prepayment invoice number and
 * never naming the patient. How the real system posts the move is still open
 * (US-06.5.1's Technical discussion): only `postTransferJournal` writes it.
 */
export interface XeroJournal {
  id: string
  /** `MJ-0001`. */
  journalNumber: string
  transferId: string
  /** The prepayment invoice's number. */
  reference: string
  dateISO: IsoDateTime
  lines: XeroJournalLine[]
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

/**
 * Message-log statuses. `duplicate` (Phase 11) is a message replayed after it
 * already processed: deduped by MSH-10, recorded but with no second effect.
 */
export type IntegrationMessageStatus =
  | 'pending'
  | 'processed'
  | 'retrying'
  | 'deadLetter'
  | 'duplicate'

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
  /** Last processing attempt time (Phase 11). */
  updatedAtISO?: IsoDateTime
  raw?: string
  /** Why the last attempt failed / parked (Phase 11) — rendered in the monitor. */
  failureReason?: string
  /**
   * The matching-screen row this message staged (catch-up Phase 33; RV-13): a
   * parsed message never changes a Booking itself, it waits for the office.
   */
  resultImportRowId?: ImportRowId
  /** Extracted patient display name (Phase 11), for the log's patient-ref column. */
  patientRef?: string
}

// ---------------------------------------------------------------------------
// Intake: import batches and rows on the matching screen (catch-up Phase 33)
// ---------------------------------------------------------------------------

/**
 * How a row arrived (DM-34): `download` is a hospital's file imported through
 * an integration (app copy says "import", US-02.1.1; no sync, D52),
 * `manualSheet` a daily sheet the office keys, `feedMessage` the Future-scope
 * HL7/FHIR simulator's message, `pdfList` a surgeon's rooms' PDF list sent to
 * matching (catch-up Phase 34; source `rooms`).
 */
export type ImportChannel = 'download' | 'manualSheet' | 'feedMessage' | 'pdfList'

/**
 * Whose text and booking the row is (OQ-108 answered, D51): the hospital's,
 * or the surgeon's rooms' (Phase 34's PDF rows). Every channel built in Phase
 * 33 is `hospital`.
 */
export type ImportSource = 'hospital' | 'rooms'

/**
 * What the hospital sent (OQ-13 open: a superset of the plausible fields).
 * Only the hospital, date, session and patient name are required; a field not
 * supplied is never a change and never blanks a Booking field.
 */
export interface IncomingBookingFields {
  hospitalId: HospitalId
  dateISO: IsoDate
  session: Session
  /** The hospital's appointment id when it sends one: the duplicate key and the correlation ref, never a match key (D62). */
  externalRef?: string
  /** `hpiId` is the HPI CPN (OQ-52), matched first. */
  surgeon?: { name: string; hpiId?: string }
  scheduledTime?: WallTime
  /** No NHI means the row waits on the unmatched queue and creates nothing (D11). */
  patient: { name: string; nhi?: string; dobISO?: IsoDate; ethnicityCode?: string }
  /** `text`: the wording exactly as sent, never trimmed (US-02.1.2, US-02.5.7); `code`: the hospital's own code, shown, never mapped. */
  procedure?: { text?: string; code?: string }
  /** The insurer or funder as sent (US-11.4.3): shown and recorded as source data (D28), never who is billed. */
  insurer?: { text: string; insurerPartyId?: string; approvalNumber?: string }
  note?: string
  hospitalStatus: 'booked' | 'cancelled'
  cancelReason?: string
}

/** The identifying fields the office may correct on a row; never the procedure wording. */
export interface ImportRowCorrections {
  nhi?: string
  patientName?: string
  dobISO?: IsoDate
  scheduledTime?: WallTime
  /** A surgeon the office picked from the master (when the row's did not resolve). */
  surgeonId?: SurgeonId
}

export type ChangeType = 'new' | 'modification' | 'cancellation' | 'noChange'

export type IncomingFieldKey = 'time' | 'patientName' | 'dob' | 'nhi' | 'procedureText' | 'insurer' | 'note'

/** Only what the office chose in the panel; never derived from the row (FT-02.1, OQ-78). */
export interface OfficePicks {
  rvgGroupId?: string
  /** The Contract the office picked on the step rail, with the price typed on an open-price Contract. */
  contract?: { contractId: ContractId; enteredPrice?: number }
  /** Record the row's insurer or funder on the Booking (default on, the office may untick). */
  recordInsurer?: boolean
}

/** The office's decision on a row (US-02.1.2): there is no move (D62). */
export type ImportDecision =
  | { kind: 'match'; bookingId: BookingId; changeType: ChangeType; fieldsApplied: IncomingFieldKey[]; picks?: OfficePicks }
  | { kind: 'createBooking'; listId: ListId; bookingId: BookingId; picks?: OfficePicks }
  | { kind: 'createList'; slotId: SlotId; listId: ListId; bookingId: BookingId; picks?: OfficePicks }
  | { kind: 'createDraft'; listId: ListId; bookingId: BookingId; picks?: OfficePicks }
  | { kind: 'reject'; reason: string }

/**
 * One incoming row (DM-34). "Unmatched" and "waiting for an NHI" are derived
 * by the matcher, never stored, so a row cannot be unmatched and forgotten.
 */
export interface ImportRow {
  id: ImportRowId
  batchId: ImportBatchId
  channel: ImportChannel
  source: ImportSource
  receivedAtISO: IsoDateTime
  incoming: IncomingBookingFields
  corrections?: ImportRowCorrections
  status: 'open' | 'applied' | 'rejected'
  decision?: ImportDecision
  decidedBy?: string
  decidedAtISO?: IsoDateTime
  /** The feed message that staged it (channel `feedMessage`). */
  messageId?: string
}

/** One import: a hospital's file, a keyed sheet or a feed message. */
export interface ImportBatch {
  id: ImportBatchId
  channel: ImportChannel
  source: ImportSource
  hospitalId: HospitalId
  label: string
  /** The sample file it came from (OQ-13 interim). */
  sampleId?: string
  importedBy: string
  importedAtISO: IsoDateTime
  rowIds: ImportRowId[]
  /** Rows already imported with identical fields, skipped. */
  skippedCount: number
  /** Channel `pdfList` only (catch-up Phase 34): the PDF list it came from and the address it arrived from. */
  pdfListId?: PdfListId
  senderEmail?: string
}

// ---------------------------------------------------------------------------
// The rooms' PDF lists (catch-up Phase 34; FT-02.2, US-02.2.1, DM-61)
// ---------------------------------------------------------------------------

/** The fields of a PDF list row the office may correct before sending (never the wording, US-02.5.7). */
export type PdfRowField = 'nhi' | 'name' | 'dobISO' | 'scheduledTime' | 'ethnicityCode'

/** One row as read from the PDF (the reading is simulated: no OCR). */
export interface PdfRowAsRead {
  nhi?: string
  name: string
  dobISO?: IsoDate
  scheduledTime?: WallTime
  ethnicityCode?: string
  /** The rooms' wording, exactly as printed; never corrected. */
  procedureText: string
}

export interface PdfRowCorrection {
  field: PdfRowField
  from: string
  to: string
  atISO: IsoDateTime
  by: string
}

export interface PdfListRow {
  id: string
  asRead: PdfRowAsRead
  /** In the order made; the latest per field wins (`effectivePdfRow`). */
  corrections: PdfRowCorrection[]
}

/**
 * A surgeon's rooms' PDF list as the office received it (DM-61): the file, the
 * sending surgeon, the address it arrived from, when, the List it suggests,
 * its status and the rows as read with each correction. Sent to matching, its
 * rows become import rows with the rooms as their source. No room record (17b).
 */
export interface SurgeonPdfList {
  id: PdfListId
  /** The sample it was uploaded from (the reading is simulated). */
  sampleId: string
  file: { name: string; facsimile: string }
  surgeonId: SurgeonId
  /** The email address the PDF arrived from, entered with the upload (US-02.2.4). */
  senderEmail: string
  hospitalId: HospitalId
  subject: string
  receivedAtISO: IsoDateTime
  receivedBy: string
  /** The List it suggests: whose session, which day, which session. */
  target: { anaesthetistId: AnaesthetistId; dateISO: IsoDate; session: Session }
  status: 'received' | 'sent'
  /** An earlier sent list for the same surgeon, hospital, date and session (our reading, DM-61). */
  replacesId?: PdfListId
  /** Set on send: the import batch its rows went to (absent when every row was unchanged). */
  batchId?: ImportBatchId
  sentAtISO?: IsoDateTime
  sentBy?: string
  rows: PdfListRow[]
}

/** Why an incoming booking could not become a Booking. A union so another cause is one member more. */
export type StubReason = 'noNhi'

/**
 * A stub on a List (catch-up Phase 33a; FT-02.6, DM-58, D66): stands in a
 * waiting row's place on the List the row would land on, until the office
 * resolves the row at intake. Not a Booking: held in the intake slice, never
 * in `schedule.bookings`, on its own id (never the NHI). Only
 * `settleStubForRow` (inside `decideImportRow`'s commit) and a Draft List's
 * removal or re-dating change its status.
 */
export interface Stub {
  id: StubId
  listId: ListId
  importRowId: ImportRowId
  reason: StubReason
  /** What the row carried, as received (US-02.6.2: what a stub shows is our reading). */
  asReceived: {
    patientName: string
    procedureText?: string
    scheduledTime?: WallTime
    hospitalId: HospitalId
    /** The import it came from, e.g. "Southern Cross theatre list, Tue 28 Jul to Thu 6 Aug". */
    sourceLabel: string
  }
  createdAtISO: IsoDateTime
  /** `resolved`: the Booking took its place; `removed`: the row was rejected or its Draft List went. */
  status: 'standing' | 'resolved' | 'removed'
  settledAtISO?: IsoDateTime
  settledBy?: string
  /** The Booking that took its place (status `resolved`). */
  bookingId?: BookingId
}

// ---------------------------------------------------------------------------
// Demo settings
// ---------------------------------------------------------------------------

/**
 * The Xero contact-volume story (Phase 10; 5th review #11): seeded aggregate
 * counters the Xero-sim archiving callout narrates and the archive job
 * decrements. Scale is NARRATED, not simulated (N4) — these are counters, not
 * ~28k seeded records.
 */
export interface XeroVolumeStory {
  /** Approximate invoices per year (RFP: ≈28,000). */
  invoicesPerYear: number
  /** Approximate share of one-time clients (RFP: ~99%). */
  oneTimePct: number
  /** Active (non-archived) contacts, near the soft limit; the archive job decrements it. */
  activeContacts: number
  /** Xero's ~10k soft contact limit. */
  softLimit: number
}

/** Demo-configurable settings (2nd review #11: the archive window is a setting, seeded at 90). */
export interface DemoSettings {
  contactArchiveInactivityDays: number
  /**
   * When set, the NEXT engine-to-Xero call fails once and waits in the Xero
   * sync queue, which retries it after its backoff (Phase 10's demo control,
   * re-based in catch-up Phase 37), then this flag clears. Badged demo-only.
   */
  failNextHandoff?: boolean
  /** Xero's API is unavailable to the engine (catch-up Phase 37's simulated outage): every call queues. */
  xeroOutage?: { sinceISO: IsoDateTime }
  /**
   * The Booking the armed hand-off fault waits for (catch-up Phase 25's staged
   * billing failure, a built default): absent, the next hand-off faults.
   * Cleared with the flag when it fires.
   */
  failHandoffBookingId?: string
  /** Seeded aggregate contact-volume counters for the Xero-sim callout. */
  volumeStory: XeroVolumeStory
}
