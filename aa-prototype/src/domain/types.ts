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
export type SurgeonRoomId = string
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

export type Session = 'AM' | 'PM'

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
 * (DM-04: private, public and pre-op appear only as RFP candidate statuses);
 * it is kept as a List attribute so the six-colour design language and the
 * seed's acute and pre-op Lists still read. Logged for the owner.
 */
export const LIST_KINDS = ['private', 'public', 'preop'] as const
export type ListKind = (typeof LIST_KINDS)[number]

/** The List kinds' fixed labels (chip, then long label); not master data (catch-up Phase 29). */
export const LIST_KIND_LABELS: Record<ListKind, { label: string; longLabel: string }> = {
  private: { label: 'Private', longLabel: 'Private' },
  public: { label: 'Public', longLabel: 'Public' },
  preop: { label: 'Pre-op', longLabel: 'Pre-op Assessment' },
}

/**
 * What a session shows (catch-up Phase 29: one display key space): the List's
 * kind when a List is in the Slot, otherwise the Slot's status ID unchanged.
 * No status ID can equal a List kind (seeded IDs are availability words,
 * generated ones `ST####`), so the space cannot collide. Never a List state.
 */
export type DisplayKey = ListKind | SlotStatusKey

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
   * the Booking still books; the manual-fix flow supplies a valid code.
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
  /**
   * The HPI CPN (Health Provider Index Common Person Number, e.g. `12ABCD`;
   * OQ-52): one identifier, unique across every practitioner, surgeons
   * included. Optional on an anaesthetist ("where available", US-12.1.4), so
   * blank is allowed here; a typed one is stored normalised (Phase 17).
   */
  hpiId: string
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
}

export type GstPeriod = 'monthly' | 'biMonthly' | 'sixMonthly'

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
  specialty?: string
  /** The surgeon's room (US-13.6.1: one room per surgeon). The room's surgeons are derived from this field, never stored on the room. */
  roomId: SurgeonRoomId
  /**
   * The HPI CPN: the Health Provider Index Common Person Number, the
   * surgeon's unique index (OQ-52), unique across every practitioner
   * (surgeons and anaesthetists). Stored trimmed and upper-cased. A
   * practitioner identifier, never the patient's NHI.
   */
  hpiId: string
  /** NZ medical registration number, held for information only. */
  medicalRegistrationNumber?: string
}

/** A surgeons' room (US-13.6.1): the practice that books with AA, with its contacts. */
export interface SurgeonRoom {
  id: SurgeonRoomId
  name: string
  contactEmail: string
  phone: string
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

/** Not preferred (formerly the blacklist) or preferred (US-13.6.3, US-13.6.4). Names are OQ-102's, in one label set. */
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
  /** 1-based position of the procedure on its Booking (2nd-procedure rules). */
  procedureOrdinal?: number
  price: number
}

// ---------------------------------------------------------------------------
// The canvas: Lists & Bookings
// ---------------------------------------------------------------------------

/**
 * A conflict on a List (catch-up Phase 30; US-01.5.2, US-01.5.4; OQ-09 soft
 * warning, never a block). Derived from facts, never stamped: a List conflicts
 * when its hospital is closed on its date (`holiday`) or its Slot's status is
 * closed (`availability`). `domain/conflicts.ts` holds the rule and the
 * wording; `mutate()` reconciles every List whose facts a mutation touched,
 * so renaming a holiday or a status changes the text with no write.
 * `cause` is the stable key a clear is matched on:
 * `holiday:<holidayId>` or `availability:<slotId>:<statusKey>`.
 */
export interface ListConflict {
  kind: 'availability' | 'holiday'
  cause: string
  raisedAtISO: IsoDateTime
  holidayId?: string
  slotId?: SlotId
  /** The Slot status's fixed ID (Phase 29), never its label. */
  statusKey?: SlotStatusKey
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

/** What a notification is about. One member today; OQ-79's later sources (and 32a's single Booking) add members. */
export type NotificationKind = 'listMoved'

/**
 * One record in the Admin App's shared notification pool (catch-up Phase 32;
 * FT-13.8, US-13.8.1, US-13.8.2, DM-41). Append-only: written once, inside
 * the move's own commit, by `postNotification` alone; nothing updates or
 * deletes one. It has no per-user, read or actioned state, so every admin
 * sees the same pool (D15; OQ-79's recommendation). The date, session,
 * hospital and surgeon are a snapshot at the move, so the notice stays true
 * after the List moves again or is re-dated. It carries no pairing preference.
 */
export interface Notification {
  id: string
  atISO: IsoDateTime
  kind: NotificationKind
  /** The actor's `who` (the anaesthetist who moved the List). */
  byActor: string
  listId: ListId
  route: OwnMoveRoute
  cause: OwnMoveCause
  fromAnaesthetistId: AnaesthetistId
  /** Route `colleague` only. */
  toAnaesthetistId?: AnaesthetistId
  dateISO: IsoDate
  session: Session
  hospitalId: string
  surgeonId: string
  /** The message the anaesthetist typed, for the office and the colleague. */
  message?: string
}

/**
 * An office-logged phone-call note on a List (Phase 07). During the
 * authorisation review the office records a call it made about the List (e.g.
 * clarifying a missing reference with the hospital); the note shows on the
 * review action bar AND in the List's audit trail. There is deliberately NO
 * return-to-anaesthetist action anywhere — a SUBMITTED List flows only forward
 * to AUTHORISED (no Returned state, convention 6). Optional; the seed populates
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
 * The fields every List has, Draft Lists included. Every List has exactly one
 * hospital (or AA rooms) and one surgeon (US-01.3.1, EP-01; catch-up Phase 31
 * made both required).
 */
export interface ListBase {
  id: ListId
  dateISO: IsoDate
  session: Session
  /** Private, public or pre-op (outside the catalogue's model; see `ListKind`). */
  kind: ListKind
  hospitalId: HospitalId
  surgeonId: SurgeonId
  conflicts: ListConflict[]
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
   * Stamped at completion of the List's billing run (Phase 08; 3rd review
   * #12). Lists vanish from the anaesthetist's forward views at invoice
   * generation, NOT at AUTHORISED — an authorised list is still unbilled.
   */
  billedAtISO?: IsoDateTime
  notes?: string
  /**
   * Files or photos attached to the List as a whole (US-03.1.3; catch-up
   * Phase 15). Optional so the generated canvas Lists carry nothing; absent
   * reads as empty. Written only through `addAttachment` / `removeAttachment`,
   * and it travels with the List when the List is reassigned.
   */
  attachments?: Attachment[]
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

export interface Attachment {
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
  cancellation?: BookingCancellation
  attachments: Attachment[]
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
 * distinction. The Booking-level "pre-payment required" flag is DERIVED from the
 * booking's procedures, never stored separately.
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
 * Procedure — the unit of billing on a Booking. Captured BTM inputs persist AS
 * DATA, not just computed totals (7th review A3; RFP design principle 10: an
 * invoice must be reproducible against what was true when raised).
 */
export interface Procedure {
  id: ProcedureId
  bookingId: BookingId
  description: string
  /**
   * Unset until explicitly set (RFP: "set explicitly (by hospital advice, or
   * by AA staff where the hospital does not specify)"; 3rd review #1) — the
   * validator fails an unset route.
   */
  billingRoute?: BillingRoute
  governingContractId?: ContractId
  /**
   * The insurer billed on the Insurer route. May also be recorded as
   * informational context on the Hospital route; the billing engine and
   * validator read it only when `billingRoute === 'insurer'`.
   */
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
   * Set on a Procedure added with "Add another procedure" (`addProcedure`):
   * additional procedures yield TIME UNITS ONLY (RFP split-billing rule). A
   * Booking's first Procedure is never additional.
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

export interface Invoice {
  id: InvoiceId
  invoiceNumber: string
  caseReference: string
  bookingId: BookingId
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
  bookingId: BookingId
  invoiceId?: InvoiceId
  accRecId?: string
  accPayId?: string
  status: BillingPipelineStatus
  /**
   * The MONEY source of truth (Phase 10; D-money-state). "Paid in" and
   * "disbursed" are two INDEPENDENT axes the single `status` enum cannot hold,
   * so `status` becomes a derived label and these three cumulative amounts are
   * authoritative. All default to 0 on every case creator.
   *   - `receivedAmount`   — cumulative received on the ACCREC (money in to AA).
   *   - `authorisedAmount` — cumulative authorised on the ACCPAY (exactly the amount received, to the payable).
   *   - `disbursedAmount`  — cumulative disbursed to the anaesthetist (payables runs).
   */
  receivedAmount: number
  authorisedAmount: number
  disbursedAmount: number
  /** Stamped when `receivedAmount` first reaches the ACCREC's `amountDue`. */
  paidInAtISO?: IsoDateTime
  /** Stamped when the case is fully disbursed (disbursed reaches authorised, at full pay-in). */
  disbursedAtISO?: IsoDateTime
  /**
   * A Xero HANDOFF fault (Phase 10; D-handoff) — data, not a throw. The case
   * stays `status:'invoiced'` with no pair; the monitor surfaces it and a
   * retry re-invokes the idempotent handoff. Distinct from `failure` (a
   * billing-RUN fault, keyed off `status:'failed'`).
   */
  handoffFailure?: { code: string; message: string }
  /**
   * Why a 'failed' case failed — the system of record the Phase 09 monitor
   * retries against (the audit entry is the history, not the current state).
   */
  failure?: { code: string; message: string; procedureId?: ProcedureId }
}

/**
 * A billing-side receipt of money in (Phase 10; D-money-state). Append-only:
 * the GST-report source (each row carries its GST component) AND the payment
 * idempotency key-set (a webhook replay / poll re-detect whose key is already
 * present is a no-op). Attributed to the anaesthetist directly so the GST
 * report needs no booking→list join. `grossAmount` is the amount received;
 * `gstAmount` its GST component (gross × 0.15 / 1.15).
 */
export interface BillingReceipt {
  id: string
  caseId: string
  anaesthetistId: AnaesthetistId
  accRecId: string
  grossAmount: number
  gstAmount: number
  atISO: IsoDateTime
  idempotencyKey: string
  source: 'webhook' | 'poll'
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
   */
  source: 'webhook' | 'poll' | 'aaFee'
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
 * AA's monthly fee invoice to one anaesthetist. It is its own billing case,
 * deliberately OUTSIDE `billing.cases`: every consumer of those cases
 * (payables, GST activity, Overdue, the monitor pipeline, the Invoices screen)
 * assumes a Booking behind it, and FT-10.3 says the fee is distinct from any
 * procedure's receivable and payable. It carries its ACCREC link and its money
 * state itself, has no ACCPAY, and is never netted against a payable.
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
  accRecId: string
  amountReceived: number
  paidAtISO?: IsoDateTime
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

/**
 * Message-log statuses. `duplicate` (Phase 11) is a message replayed after it
 * already processed: deduped by MSH-10, recorded but with no second effect.
 */
export type IntegrationMessageStatus =
  | 'pending'
  | 'processed'
  | 'retrying'
  | 'deadLetter'
  | 'manualIntervention'
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
  /** The Booking this message created or affected (Phase 11), for the monitor's link. */
  resultBookingId?: BookingId
  /** Extracted patient display name (Phase 11), for the log's patient-ref column. */
  patientRef?: string
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
   * When set, the NEXT Xero handoff records a `handoffFailure` and creates no
   * pair, then clears this flag (Phase 10 demo control; D-handoff). Badged
   * demo-only trigger.
   */
  failNextHandoff?: boolean
  /** Seeded aggregate contact-volume counters for the Xero-sim callout. */
  volumeStory: XeroVolumeStory
}
