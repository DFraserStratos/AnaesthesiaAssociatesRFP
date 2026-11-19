/**
 * The one app store (Phase 02). State = the seeded domain (masters, schedule,
 * audit, settings, counters) + the demo clock + typed empty scaffolds for the
 * Phase 08 to 11 slices + the shell slice migrated in from Phase 00.
 *
 * WRITE DISCIPLINE (mechanically enforced by `storeDiscipline` in
 * `mutate.test.ts`): domain slices are written ONLY through `mutate.ts` — the
 * audit wrapper. The shell action below and the clock writes in
 * `clockActions.ts` are the only writes outside it, and neither touches a
 * domain slice.
 *
 * Persistence: versioned localStorage key, written through the coalescing,
 * failure-latching wrapper in `persistStorage.ts`. A version bump discards
 * stale persisted state, so the next load reseeds — bump PERSIST_VERSION
 * whenever the seed shape or content changes.
 */

import { create, type StateCreator, type StoreApi, type UseBoundStore } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { resilientLocalStorage } from './persistStorage'
import { bindCrossTabSync } from './crossTabSync'
import { INITIAL_CLOCK, type DemoClockState } from '../domain/clock'
import { buildSeed, buildSeedBillingSlice, SEED_AUTHORISED_INVOICED_BOOKING_IDS, SEED_PREPAID_BOOKING_ID, type SeedState } from '../domain/seed'
import { INTEGRATION_FEEDS } from '../domain/integrations'
import type {
  AaFeeInvoice,
  BillingException,
  Disbursement,
  IntegrationFeed,
  IntegrationMessage,
  ImportBatch,
  ImportBatchId,
  ImportRow,
  ImportRowId,
  Stub,
  StubId,
  PdfListId,
  SurgeonPdfList,
  Invoice,
  InvoiceLine,
  LedgerDisbursement,
  LedgerPair,
  LedgerReceipt,
  LedgerTransfer,
  PaymentIn,
  UnmatchedReceipt,
  XeroAccPay,
  XeroAccRec,
  XeroBankLine,
  XeroContact,
  XeroDivergence,
  XeroJournal,
  XeroQueueItem,
  XeroRemittance,
} from '../domain/types'
import type { AppId } from '../shell/appConfig'
import type { BookingLock } from '../domain/billing/lock'
import { seedLocks } from './locks'
import { seededIntake } from '../domain/seed/intakeSeed'

// ---------------------------------------------------------------------------
// Slice shapes (typed now, filled in Phases 08 to 11)
// ---------------------------------------------------------------------------

export interface BillingSlice {
  invoices: Record<string, Invoice>
  invoiceLines: Record<string, InvoiceLine>
  /**
   * The internal ledger (catch-up Phase 36; FT-08.3, US-08.3.2): one pair per
   * invoice, AA's system of record. Xero mirrors it. `domain/billing/ledger.ts`
   * holds the maths; `store/ledgerSelectors.ts` the reads.
   */
  ledger: Record<string, LedgerPair>
  /** Append-only money in (Phase 10's receipts, now ledger entries): GST-report source + payment idempotency key-set. */
  receipts: Record<string, LedgerReceipt>
  /** Money out to anaesthetists: the ledger's record of each payment (made in Xero, D53). */
  disbursements: Record<string, LedgerDisbursement>
  /** Receipts that matched no invoice, held until the office allocates or refunds them (catch-up Phase 36). */
  unmatchedReceipts: Record<string, UnmatchedReceipt>
  /** Billing-run failures (OQ-05): no invoice, so no pair, until resolved and retried. */
  exceptions: Record<string, BillingException>
  /**
   * PMS-side ContactID cache (Phase 10; RFP Appendix 2 contact resolution: a
   * cached ContactID is tried first, then a lookup by ContactNumber, then
   * create). Keyed by the composite `${kind}:${id}` (never a raw id — 4 disjoint
   * org namespaces). A hint only: never authoritative, never NHI-derived.
   */
  contactIdCache: Record<string, string>
  /** AA's monthly fee invoices to anaesthetists (catch-up Phase 16): the documents; each one's money is its `aaFee` ledger pair. */
  aaFeeInvoices: Record<string, AaFeeInvoice>
  /**
   * The pricing snapshot per Booking, written at AUTHORISED (catch-up Phase 25;
   * US-04.3.5, DM-08): the billing run, its retry and Regenerate read only
   * this. Keyed by Booking id; `domain/billing/lock.ts` holds the shape.
   */
  locks: Record<string, BookingLock>
  /**
   * Prepayment transfers from the AA Holding account to the anaesthetist who
   * did the List (catch-up Phase 27a; US-06.5.1), one per `prePayment` pair,
   * held as two payable legs (catch-up Phase 36). The account's balance and
   * entries are derived from these and the pairs (`domain/billing/ledger.ts`),
   * never stored.
   */
  transfers: Record<string, LedgerTransfer>
  /**
   * The durable Xero sync queue (catch-up Phase 37; EP-09): every engine call
   * Xero did not take, retried with backoff on the demo clock. Engine-side,
   * because the queue belongs to the engine. Sent items stay as history.
   */
  xeroQueue: Record<string, XeroQueueItem>
  /** Voids and amendments made directly in Xero, flagged by the reconciliation poll (catch-up Phase 37). */
  xeroDivergences: Record<string, XeroDivergence>
}

export interface XeroSlice {
  contacts: Record<string, XeroContact>
  accRecs: Record<string, XeroAccRec>
  accPays: Record<string, XeroAccPay>
  payments: Record<string, PaymentIn>
  disbursements: Record<string, Disbursement>
  /** Simulated manual journals mirroring prepayment transfers (catch-up Phase 27a). */
  journals: Record<string, XeroJournal>
  /** Bulk remittance advices and their bank lines (catch-up Phase 37; US-10.2.4): Xero side only, never read by the engine. */
  remittances: Record<string, XeroRemittance>
  bankLines: Record<string, XeroBankLine>
}

export interface IntegrationsSlice {
  feeds: Record<string, IntegrationFeed>
  messages: Record<string, IntegrationMessage>
}

/**
 * The matching screen's staged rows (catch-up Phase 33; DM-34): one batch per
 * hospital import, keyed sheet or feed message, each holding its rows. Seeded
 * empty; no sync state (US-02.1.5 is Future Work, D52).
 */
export interface IntakeSlice {
  batches: Record<ImportBatchId, ImportBatch>
  rows: Record<ImportRowId, ImportRow>
  /** Stubs on Lists for rows waiting at intake (catch-up Phase 33a; DM-58): never Bookings. */
  stubs: Record<StubId, Stub>
  /** The rooms' PDF lists as received (catch-up Phase 34; DM-61). */
  pdfLists: Record<PdfListId, SurgeonPdfList>
}

export interface ShellSlice {
  currentApp: AppId
  /**
   * Office candidate-picker request counter (catch-up Phase 17): bumped each
   * time an office picker opens, zeroed by Reset. The picker's shuffle key is
   * `listId + ':' + suggestionSeq`, so reopening reshuffles within a tier and
   * a fresh Reset replays the same orders (never Math.random, never the
   * clock). UI state, not a domain mutation, so not audited.
   */
  suggestionSeq: number
}

export interface AppState extends SeedState {
  clock: DemoClockState
  billing: BillingSlice
  xero: XeroSlice
  integrations: IntegrationsSlice
  intake: IntakeSlice
  shell: ShellSlice
}

export interface AppActions {
  setCurrentApp: (app: AppId) => void
  /** Bump `shell.suggestionSeq` and return the new value (one office picker opening). */
  nextSuggestionSeq: () => number
}

export type AppStore = AppState & AppActions
export type AppStoreApi = StoreApi<AppStore>
export type BoundAppStore = UseBoundStore<StoreApi<AppStore>>

// ---------------------------------------------------------------------------
// Construction
// ---------------------------------------------------------------------------

export const PERSIST_KEY = 'aa-demo'
/** v49: catch-up Phase 24 session 2, the price beats and the rate x time removal (RV-03, US-03.3.10): Aria
 *  (`CT-ARIA-HOURLY`, id kept) is RVG at its own rate with no `permitsRateTime`; Fitzgerald's Aria Booking loses its
 *  rate x time line (the seed's only billing line) for A5 and times; the Forte RVG less 10% Contract; Forte Health RVG
 *  allows the override; seven Bookings (Souter Mon 27 Jul AM, the range beat, the no-charge Booking); Souter's Thu 16
 *  Jul PM List AUTHORISED with its Face lift invoice. Reseeds on load.
 *  v48: catch-up Phase 24 session 1, one price function (US-05.2.8, DM-14, RV-04): `Procedure.priceOverride` and its
 *  reason gone; the one typed price is `enteredPrice` on any Contract (the seeded $1,200 fixed fee on BK0179 now an
 *  `enteredPrice` at the same figure). Reseeds on load.
 *  v47: catch-up Phases 23 and 17a joined (one past both branches' 46). Phase 23, the primary Procedure and the
 *  multi-procedure rule (US-03.2.2, US-05.3.1, DM-15): `Procedure.isPrimary` replaces `isAdditional` (exactly one
 *  per Booking; Nair's prepaid second Procedure additional), modifier claims on an additional Procedure moved to its
 *  primary, and the three-procedure Booking on Souter Mon 13 Jul AM (SUBMITTED) with its fixed patient. Reseeds on load.
 *  v46: catch-up Phase 17a, surgeons' rooms (DM-60, US-13.6.5; D75): `Surgeon.roomId` becomes the ordered
 *  `roomIds` (the four two-practice directory surgeons at both rooms), a room's `contactEmail` and `phone`
 *  optional (the directory's invented reception@ addresses gone), and `SurgeonRoom.contacts` (seeded practice
 *  manager and PA contacts). Reseeds on load.
 *  v45: catch-up Phase 22a session 1, a payer on each Procedure (US-11.2.2, US-08.2.1; D85, provisional on
 *  OQ-140): `Procedure.payer` (Booking.payer gone; every Procedure takes its Booking's payer, BP ids kept),
 *  Grace Park's second Procedure (Hana Park copied, BP0001) and the two-payer Booking on the payer review
 *  List (BP0004, BP0005; the payer counter at 6). Reseeds on load.
 *  v44: catch-up Phase 22, invoice presentation, delivery and the split (US-08.2.3, US-08.4.2, US-08.4.5,
 *  US-09.1.4): `Procedure.split` (Prentice's fee split on the Booking, the two funder lines gone),
 *  `Anaesthetist.gstNumber`, invoices' supplier, agent, delivery and Procedure links, the ACCPAY's
 *  `taxInvoice`, holder reference codes on St George's and nib's RVG Contracts. Reseeds on load.
 *  v43: catch-up Phase 21a session 2, office review (US-07.2.2, US-04.3.11): the review-flags List
 *  (Chen Tue 14 Jul AM, SUBMITTED) with Dr Chen's seeded Contract change, a typed price, a Booking that
 *  needs a price and a Contract linked to another surgeon; the movable Merivale Booking on Souter Mon 10
 *  Aug PM; five pinned patients (PT0160 to PT0164); `Procedure.contractApproval`.
 *  v42: catch-up Phase 21a session 1, RVG detail by pricing kind and completion (US-03.3.9, US-03.6.1):
 *  `Procedure.modifiersConfirmed` (set on every completed Booking's Procedures) and two Bookings on
 *  Souter's Mon 10 Aug PM List (the fixed price with no times, the open price that needs a price) with
 *  their two patients.
 *  v41: catch-up Phase 21 session 2, insurance on the Booking (US-11.4.3): `Booking.funderPartyId` and
 *  `insuranceApprovalNumber` (NIB on every nib-Contract Booking, AIA on the claim-back Booking, the review
 *  List's NIB and Health NZ cases) and the Southern Cross "Suggested" Booking (BK0175).
 *  v40: catch-up Phase 21 session 1, the payer on the Booking (US-11.2.2, RV-30): `Booking.payer`
 *  on every Booking (Hana Park, BP0001, on Grace Park's), `Procedure.billablePartyId`,
 *  `billsHolderInterim` and the `billableParties` master gone, `Patient.address` re-expressed as
 *  an NZ Post `postalAddress` with seeded emails, `Invoice.billedTo`, and the payer review List.
 *  v39: catch-up Phase 20 (9), owner review 2026-11-16: every hospital tag and Special holder gains
 *  an RVG backstop Contract (`CT-RVG-<key>`, `systemRole: 'rvgFallback'`) beside its Fixed price one.
 *  v38: catch-up Phase 20a, procedure text (US-02.5.7, US-08.4.6): `Procedure.description`
 *  replaced by one `procedureText` (the hospital's replacing the rooms', the replaced text in
 *  the audit history) and an `invoiceDescription`; attachments removed (RV-01); AR-35's
 *  illustrative wording seeded; MSG-STG-1001 and MSG-STG-1012 reworded.
 *  v37: catch-up Phase 20, one Contract per Procedure: the route, the
 *  Procedure's insurer and the payment category gone; every seeded Procedure on
 *  one Contract (Riley and Nair on Dr Souter's prepaid price list, a new
 *  `CT-SOUTER-RHINO-COS`), the route-less Bookings with none and the first
 *  pre-op's `railAnswers`; `enteredPrice` and `billsHolderInterim`. Reseeds on load.
 *  v36: catch-up Phase 19b, modifiers: `masters.modifiers` (the NZSA RVG
 *  2021 table as printed, generated from the catalogue, keyed by hidden id)
 *  replacing `masters.modifierCodes`; `Procedure.modifierClaims` and
 *  `removedModifierIds` replacing `asaClass` and `selectedModifierCodes`;
 *  `RvgGroup.includedModifierIds` (P1 on the 20 Neurosurgery and Spine rows)
 *  and `noAgeModifier` replacing the interim `includesModifierCodes`; the
 *  seeded AS3 claims and the Spine Booking. Reseeds on load.
 *  v35: catch-up Phase 19a, price ranges: a fixed price holds `ranges`,
 *  every Contract an `invoiceDescription` and `defaultRvgGroupId`,
 *  `masters.contractPrices` gone and `masters.rvgTimeRule` new; the priced
 *  items (Doyle, CES, Merivale, Dr Souter), the hernia on No contract · RVG
 *  and the Merivale Face lift Booking BK0163. Reseeds on load.
 *  v34: catch-up Phase 19, the RVG groups (`masters.rvgGroups`, the NZSA RVG
 *  2021 rows plus AA's own, keyed by hidden id) replacing `masters.rvgCodes`,
 *  `Procedure.rvgGroupId` replacing `rvgBaseCode`, the fixed-price rows keyed
 *  by `rvgGroupId`, and the `baseUnitsOutsideGuide` warning rule's default.
 *  Reseeds on load.
 * v33: catch-up Phase 18a, AA's specialties and funding tags (`masters.specialties`,
 *  `masters.fundingTags`), `Surgeon.specialtyIds` replacing the free text, a
 *  Contract's `specialtyIds` and `fundingTagId`, the open-price fallbacks,
 *  and `Procedure.accRelated` gone. Reseeds on load.
 * v32: catch-up Phase 18 session 2, the flat Contract (AA code, pricing
 *  kind, links, prepaid, override, Active or Disabled; no type, dates or
 *  default), No contract · RVG, Unisports Ortho and COS ACC fixed fees.
 *  Reseeds on load.
 * v31: catch-up Phase 18 session 1, the Party master (`masters.parties`, 19
 *  seeded Parties), Contracts held by a Party (`holderId`, `billsTo`, `status`;
 *  no `holderType` or scope), insurers without the direct-claims flag and a
 *  new interim insurer id (I-SCHS). Reseeds on load.
 * v29: catch-up Phase 32b: unavailability is never a conflict. Dr Rutherford's
 *  Wed 22 Jul AM List is seeded as a returned Draft List (origin
 *  `unavailableReturn`, a `draftList.detach` audit row), and the `availability`
 *  conflict kind is gone, so a v28 store's stale availability conflicts must not
 *  survive. Reseeds on load.
 * v28: catch-up Phase 32a: the single-Booking move; one appended seed Booking
 *  (BK0162, the acceptance beat) and the pool's `bookingMoved` kind (a v27
 *  store, which lacks the Booking, reseeds).
 * v27: catch-up Phase 38a: browsable history January to March 2026 (twelve
 *  backdrop Lists for Dr Souter, 29 Bookings, all settled before April).
 * v26: the specialist directory (`seed/specialistDirectory.ts`): 40 more
 *  surgeons' rooms and 131 more surgeons, fictional, from AA's list of 3
 *  November 2026; master data only, named by no List.
 * v25: catch-up Phase 32: the shared notification pool (`notifications`, seeds
 *  empty; `NT` ids); the cover marker (`Slot.coverRequest`) is gone (a v24
 *  store, which may carry one, reseeds).
 * v24: catch-up Phase 31: the DRAFT state; Draft Lists are Lists with no
 *  anaesthetist (requests and recurring clashes); every List carries a hospital
 *  and a surgeon; AA rooms is a location (a v23 store reseeds).
 * v23: 2026-10-09 · catch-up Phase 30: conflicts derived from facts (a cause,
 *  not a message) and office clears; Wed 22 conflicts re-seeded as real facts
 *  (Rutherford AM unavailable, the Southern Cross closure HH900); Permanent
 *  Lists renamed recurring bookings (`masters.recurringBookings`, RCB ids),
 *  with `List.recurringBookingId` provenance and start, end and retire dates.
 *  v22: 2026-10-09 · catch-up Phase 29: the availability statuses are a
 *  user-maintained master (`masters.slotStatuses`, was the six-key
 *  `masters.listStatuses`); repeating days off in
 *  `schedule.availabilitySeries`; `Slot.seriesId`; counters `slotStatus` and
 *  `availabilitySeries`. The generated canvas is unchanged.
 *  v21: 2026-10-09 · catch-up Phase 28: Slot and List split; the canvas is two
 *  records (`schedule.slots`, every session stored, free by default; Lists only
 *  where assigned or projected, with `slotId` and `kind`); `masters.availability`
 *  gone (availability is the Slot's status); schedule settings in
 *  `appSettings.schedule` (horizon months, default session times); anaesthetists
 *  have a start date.
 *  v20: 2026-10-09 · catch-up Phase 17: surgeons gain `roomId`, `hpiId` (the
 *  HPI CPN) and a registration number; `masters.surgeonRooms` and
 *  `masters.surgeonGroups`; hospitals gain `contactEmail`; the new top-level
 *  office-only `officePrivate` slice (pairing preferences, priority tiers);
 *  `shell.suggestionSeq`.
 *  v19: 2026-10-09 · catch-up Phase 16 step 2: AA fee settings in
 *  `appSettings.aaFee` (a labelled sample schedule, ex GST), the
 *  `billing.aaFeeInvoices` map with Dr Souter's seeded May and June fee
 *  invoices and their `aaFee` ACCRECs (and the paid one's payment).
 *  v18: 2026-10-09 · catch-up Phase 16 step 1: no AA fee deducted from a payable
 *  any more (every seeded ACCPAY equals its ACCREC, disbursed in full); Xero
 *  records store InvoiceNumber, Reference, issue and paid dates (and the ACCREC
 *  kind, the ACCPAY anaesthetist); no personal information in Xero (patient and
 *  billable-party contacts named by hidden id); the missed webhook dated July.
 *  v17: 2026-10-09 · catch-up Phase 15b: Copy a Booking removed (US-02.4.3 Retired):
 *  no `copiedFromBookingId`, no 'copy' or 'anaesthetistPhoto' source; List state
 *  DRAFT renamed ACTIVE (EP-07, FT-07.1).
 *  v16: 2026-10-02 · catch-up Phase 15a: app settings for the warning routine;
 *  warning clearances; prepayment override removed (D5).
 *  v15: 2026-10-02 · catch-up Phase 15: Booking.source on the scenario Bookings,
 *  List attachments (the seeded theatre-list PDF), AT attachment ids.
 *  v14: 2026-10-02 · catch-up Phase 15: Card renamed to Booking: `schedule.bookings`,
 *  BK ids (HBK for history), `booking.*` audit, `counters.booking`.
 *  v13: 2026-07-30 — S1's Tue 28 AM List seeds three booked, uncaptured Bookings
 *  again (Mr Hale, St George's), so the S12 arrival lands on a populated List.
 *  v12: 2026-07-29 — ACCPAY records now snapshot an illustrative 5% AA service
 *  fee and the net amount payable to the anaesthetist.
 *  v11: 2026-07-29 — S1's Tue 28 AM List starts empty for the live S12 arrival;
 *  its S13/S14/S15 exemplars moved to Aug 3/4, and S3's two Mon 20 Souter
 *  Lists now seed SUBMITTED in the Review queue.
 *  v10: 2026-07-29 — rich deterministic booking, Procedure, capture, fee-line
 *  and lifecycle history for every seeded Booking, including historical billing
 *  Bookings. Returning demos must reseed so the new audit graph and counter land.
 *  v9: 2026-07-28 — removed a build-phase label from historical List notes.
 *  v8: 2026-07-27 — modifier bands (one code per band). The seed's own content
 *  is unchanged, but a pre-fix persisted Procedure can hold two codes from the
 *  same band (e.g. A1 + A2); those now resolve to one code and render a
 *  refusal caption, so the stale selection is discarded rather than carried
 *  into a demo.
 *  v7: Phase 11 — seeded integration feeds (3) in the integrations slice, five
 *  integration-origin seed Bookings (correlationRef set) with a new SUBMITTED
 *  locked-target List (Beaumont Mon 20), new `Booking.correlationRef` usage, and
 *  the `IntegrationMessage` log shape ('duplicate' status + failure/result
 *  fields). Reseeds on load.
 *  v30: catch-up Phase 32c, the out-of-hours session (`Session` gains `OOH`,
 *  the schedule settings an out-of-hours default, 18:00 to 21:00).
 *  v6: Phase 10 — new billing-case money fields (received/authorised/disbursed +
 *  paidIn/disbursed stamps + the hand-off fault flag), the `receipts` ledger on the
 *  billing slice, DemoSettings.volumeStory + failNextHandoff, seeded historical
 *  ledger + Xero rows (Souter receivables/GST) and the seeded
 *  missed-webhook PaymentIn, new counters (XC/XR/XP/PMT/DSB/PR/RCT).
 *  v5: Phase 09 — new seed bookings (relocated unpaid pre-payment booking, the mixed
 *  + full pre-payment booking, the multi-booking billing-failure list), the seeded
 *  PAID pre-invoice billing slice, and new `Booking` fields (bookingType /
 *  addendumOfBookingId). v4: Phase 06 — `dayNotes` slice added to SeedState (3
 *  seeded Tue-21 notes) + two advisory ListConflicts seeded onto Wed 22 booked
 *  Lists. v3: Phase 05 — seeded anaesthetist-dashboard figures added to
 *  SeedState (`dashboards`; W1/W4). v2: Phase 04 — Ellison handover unseeded
 *  (live Finish-now demo) + the Souter rate x time capture booking + patient.
 *  v50: catch-up Phase 25, the pricing snapshot (`billing.locks`, every seeded
 *  AUTHORISED List locked, the history backdrop migrated from its invoices)
 *  and the billing case's `payeeAnaesthetistId`.
 *  v51: catch-up Phase 26, the anaesthetist profile (`Anaesthetist.bankAccount`
 *  seeded for all 14 on bank 99; `gstPeriod` removed).
 *  v52: catch-up Phase 27, the prepayment lifecycle (`prepaymentDetail` gone;
 *  `Invoice.approval`, `InvoiceLine.contractId`, `XeroAccPay.payeeAccount`,
 *  `appSettings.prepayment`, the lock's `settledByPrepayment`; Nair on Dr
 *  Souter's prepaid Rhinoplasty at $1,200, INV0001's payable to the AA Holding
 *  account; Riley awaiting approval).
 *  v52: catch-up Phase 32d, Public as a Slot status (`publicHospital`, D86): the `public` List kind retired; the
 *  public Lists holding Bookings are private Lists (same ids), the bookless ones Public sessions ("CPH"), seven
 *  weekly Public series (AS0001 to AS0007), six recurring-clash Draft Lists gone. Reseeds on load.
 *  v53: catch-up Phase 33, the intake slice (import batches and rows, seeded empty); HL7/FHIR messages stage rows
 *  instead of applying (`resultImportRowId`); `manualIntervention` and `integrationImmutable` retired. Reseeds on load.
 *  v54: Wave 1 sync on lane/a, Lane B's 32d and 33 (v52, v53) joined with Lane A's 27 (v52): one past the higher.
 *  v55: catch-up Phase 27a, the AA Holding account's transfer (`billing.transfers`, `xero.journals`,
 *  the billing case's `prepayLeg` on BC0001, `Disbursement.transferId`). Reseeds on load.
 *  v56: catch-up Phase 25a, the seeded Disabled Contract (Christchurch Eye Surgery 2025 rate, `CT-CES-2025`, its
 *  `contract.disable` audit entry on Fri 10 Jul) and Margaret Ellery's Booking on it on 21a's review-flags List. Reseeds on load.
 *  v57: catch-up Phase 25a session 2, the Procedure's hospital reference removed (`Procedure.billingReference`, the
 *  lock's copy, `InvoiceCrossMatch.hospitalRef`, the seeded values and audit fields; DM-68, D82). Reseeds on load.
 *  v56: catch-up Phase 33a, stubs on a List (`intake.stubs`, counter `stub`): the seeded intake holds one
 *  Southern Cross row with no NHI (IRS001, Mere Tipene) and its stub STB0001 on Dr Souter's Tue 4 Aug PM List.
 *  Reseeds on load.
 *  v58: Wave 2 sync on lane/a, Lane B's 33a (v56) joined with Lane A's 25a (v56, v57): one past the higher.
 *  v59: catch-up Phase 36, the internal ledger: the billing cases slice becomes `billing.ledger` (pairs with receivable
 *  and payable legs), with `disbursements`, `unmatchedReceipts` and `exceptions`; receipts carry `pairId`;
 *  transfers hold `out`/`in` legs; AA fee invoices point at their `aaFee` pair; counter `ledgerPair`. Reseeds on load.
 *  v58: Wave 2 sync on lane/b, Lane A's 25a (v57) joined with Lane B's 33a (v56): one past the higher.
 *  v59: catch-up Phase 17b, no surgeons' rooms (`masters.surgeonRooms`, `Surgeon.roomIds` and room contacts gone);
 *  each surgeon holds `practiceName`, `personalContact` and `officeContacts`, and three directory surgeons no HPI CPN
 *  yet (D74, D76). Reseeds on load.
 *  v60: Wave 2 join, Lane A's 36 (v59) joined with Lane B's 17b (v59): one past the higher.
 *  v61: catch-up Phase 37, Xero mirror resilience: `billing.xeroQueue` and `billing.xeroDivergences`, `xero.remittances`
 *  and `xero.bankLines` (empty in the seed); ledger disbursements carry `idempotencyKey` and `detectedBy`, Xero bill
 *  payments `idempotencyKey`; the pair's and the transfer's fault fields are gone (a failed call is a queue item). Reseeds on load.
 *  v61: catch-up Phase 34, the rooms' PDF lists and where a List came from: `intake.pdfLists` (seeded PDL0001, Mr
 *  Okafor's list as received; counter `pdfList`), every List's `origin` (two pinned: a rooms' PDF with its sender, the
 *  hospital's list). Reseeds on load.
 *  v62: the Wave 3 sync of 34 into lane/a (Phase 37 and Phase 34 both took v61). Reseeds on load.
 *  v63: catch-up Phase 38: seeded dashboard figures removed (`dashboards`, the Productivity and Leave panels); ageing
 *  buckets gone. Reseeds on load. */
export const PERSIST_VERSION = 63

export function emptyBillingSlice(): BillingSlice {
  return { invoices: {}, invoiceLines: {}, ledger: {}, receipts: {}, disbursements: {}, unmatchedReceipts: {}, exceptions: {}, contactIdCache: {}, aaFeeInvoices: {}, locks: {}, transfers: {}, xeroQueue: {}, xeroDivergences: {} }
}
export function emptyXeroSlice(): XeroSlice {
  return { contacts: {}, accRecs: {}, accPays: {}, payments: {}, disbursements: {}, journals: {}, remittances: {}, bankLines: {} }
}
export function emptyIntegrationsSlice(): IntegrationsSlice {
  return { feeds: {}, messages: {} }
}

/** The intake slice: seeded empty, the presenter imports or a trigger delivers (catch-up Phase 33). */
export function emptyIntakeSlice(): IntakeSlice {
  return { batches: {}, rows: {}, stubs: {}, pdfLists: {} }
}

/** The seeded intake slice: one waiting no-NHI row and its stub on a List (catch-up Phase 33a). */
export function seededIntakeSlice(): IntakeSlice {
  return seededIntake()
}

/** The seeded integrations slice: the three feed configs, no messages yet (Phase 11). */
export function seededIntegrationsSlice(): IntegrationsSlice {
  const feeds: Record<string, IntegrationFeed> = {}
  for (const feed of INTEGRATION_FEEDS) feeds[feed.id] = feed
  return { feeds, messages: {} }
}

/** A pristine full app state from the deterministic seed. */
export function freshAppState(): AppState {
  const seed = buildSeed()
  // The pristine seed ships one PAID pre-payment slice (Phase 09), with the
  // counters bumped past the ids it consumed so the first runtime billing run
  // continues the sequence cleanly.
  const seedBilling = buildSeedBillingSlice(seed, SEED_PREPAID_BOOKING_ID, SEED_AUTHORISED_INVOICED_BOOKING_IDS)
  const state: AppState = {
    ...seed,
    counters: seedBilling.counters,
    clock: INITIAL_CLOCK,
    billing: {
      invoices: seedBilling.invoices,
      invoiceLines: seedBilling.invoiceLines,
      ledger: seedBilling.ledger,
      receipts: seedBilling.receipts,
      disbursements: seedBilling.disbursements,
      unmatchedReceipts: {},
      exceptions: {},
      contactIdCache: seedBilling.contactIdCache,
      aaFeeInvoices: seedBilling.aaFeeInvoices,
      locks: {},
      transfers: {},
      xeroQueue: {},
      xeroDivergences: {},
    },
    xero: seedBilling.xero,
    integrations: seededIntegrationsSlice(),
    intake: seededIntakeSlice(),
    shell: { currentApp: 'mobile', suggestionSeq: 0 },
  }
  // Every seeded AUTHORISED List is locked (catch-up Phase 25); its pairs carry the same payee from the seed.
  const locked = seedLocks(state)
  return { ...state, billing: { ...state.billing, locks: locked.locks } }
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/**
 * Rehydration merge for the persisted store: start from the fresh `current`
 * state, overlay the `persisted` state, and for every object-valued top-level
 * slice overlay one level deep so a sub-key missing from the persisted store
 * (e.g. `settings.volumeStory`, `billing.receipts`, a new counter) is filled
 * from the fresh seed instead of vanishing. Exactly one level deep on purpose:
 * record maps live one level down and are copied wholesale, so a record the
 * demo deleted is never resurrected. Exported for the regression test.
 */
export function backfillMerge(current: AppStore, persisted: unknown): AppStore {
  const p = isPlainObject(persisted) ? persisted : {}
  const merged: Record<string, unknown> = { ...current, ...p }
  for (const key of Object.keys(current) as (keyof AppStore)[]) {
    const cv = current[key]
    const pv = p[key as string]
    if (isPlainObject(cv) && isPlainObject(pv)) {
      merged[key as string] = { ...cv, ...pv }
    }
  }
  // One deliberate second level (catch-up Phase 15a): a rule registered after
  // the store was persisted gains its seeded settings entry, while a persisted
  // entry (its switch and params) wins.
  const appSettings = merged['appSettings']
  if (isPlainObject(appSettings) && isPlainObject(current.appSettings)) {
    const persistedRules = isPlainObject(appSettings['warningRules']) ? appSettings['warningRules'] : {}
    merged['appSettings'] = {
      ...appSettings,
      warningRules: { ...current.appSettings.warningRules, ...persistedRules },
    }
  }
  return merged as unknown as AppStore
}

export interface CreateAppStoreOptions {
  /** Persist to localStorage under the versioned key (the app singleton does; tests do not). */
  persisted?: boolean
}

export function createAppStore(options: CreateAppStoreOptions = {}): BoundAppStore {
  const initializer: StateCreator<AppStore> = (set, get) => ({
    ...freshAppState(),
    setCurrentApp: (app: AppId) =>
      set((state) => ({ shell: { ...state.shell, currentApp: app } })),
    nextSuggestionSeq: () => {
      const next = (get().shell.suggestionSeq ?? 0) + 1
      set((state) => ({ shell: { ...state.shell, suggestionSeq: next } }))
      return next
    },
  })

  if (options.persisted === true) {
    return create<AppStore>()(
      persist(initializer, {
        name: PERSIST_KEY,
        version: PERSIST_VERSION,
        // Coalesced + guarded writes (persistStorage.ts). zustand's own write
        // path has no try/catch and runs inside setState, so a full-quota
        // localStorage throws out of mutate() into a click handler, where no
        // error boundary can catch it. This is storage MECHANICS only — same
        // key, same JSON shape, same version — so there is deliberately NO
        // PERSIST_VERSION bump: an existing persisted store rehydrates as-is.
        storage: createJSONStorage(() => resilientLocalStorage),
        // A PERSIST_VERSION bump means the seed shape/content CHANGED, so a
        // different-version persisted store must be DISCARDED and reseeded. zustand
        // does NOT auto-discard on a version mismatch, so migrate returns the
        // pristine current-shape seed. (This alone is not enough — see merge.)
        migrate: () => freshAppState() as AppStore,
        // migrate only fires on a version MISMATCH. A store persisted at the
        // CURRENT version but from before a nested field existed (dev churn, or
        // a shape change that forgot to bump the version) takes the no-migrate
        // path, and zustand's default merge is a SHALLOW spread: the persisted
        // `settings` (no `volumeStory`) clobbers the fresh one wholesale, so
        // DemoXero reads `undefined.softLimit` and the app blank-screens. Backfill
        // one level deep so every slice's sub-keys always exist: persisted (live)
        // values win where present, fresh seed fills the gaps. Only whole missing
        // sub-keys are added, and record maps (invoices, contacts, ...) are taken
        // wholesale from the persisted store, so no deleted seed record is
        // resurrected. Deep record-SHAPE changes still require a version bump.
        merge: (persisted, current) => backfillMerge(current as AppStore, persisted),
      }),
    )
  }
  return create<AppStore>()(initializer)
}

/**
 * The app singleton. Components read through it; guards and demo controls
 * receive it (or a test-created store) as their `api` argument.
 */
export const useAppStore: BoundAppStore = createAppStore({ persisted: true })

// Live sync with other tabs of this origin (Admin in one, mobile in another):
// another tab's write to the key rehydrates this singleton without writing
// back. Binds once, and not at all without a window. See crossTabSync.ts.
bindCrossTabSync(useAppStore, PERSIST_KEY)
