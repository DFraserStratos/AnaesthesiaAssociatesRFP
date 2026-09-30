# Domain model delta: catalogue vs prototype

Read-only comparison of the entity, relationship and lifecycle model the requirements catalogue now describes (see [domain-model.md](../../../discovery-reference/Updated%20Requirements/domain-model.md)) with what `aa-prototype/` implements. Items with status Retired or Future are excluded. The code is treated as the truth about the prototype; the old build docs were used only as leads.

**Summary.** 34 structural deltas (after adversarial verification: 1 dropped, 1 added, 5 corrected, 28 upheld) between the future-state catalogue and the prototype. Biggest cuts: (1) the billing-route model (BillingRoute, PatientPaymentCategory, insurerId, governingContractId) collapses to exactly one Contract per Procedure, and Contract is reshaped from Type 1/2/3 to category/holder/scope/pricingBasis (DM-06, DM-09); (2) the List is split into Slot, List and Draft List (DM-02, DM-03); (3) BillingCase plus the Xero mirror is replaced by an internal ledger as system of record, with credit and rebill, additional invoices, AA fee invoices and trust refunds around it (DM-18 to DM-22); (4) Card becomes Booking and takes over billable party, invoice email and prepayment state (DM-01, DM-10, DM-16). The ledger (3) is an evolution of BillingCase, not a rewrite (DM-18 corrected). New master data: Surgeon, SurgeonRoom, Blacklist, Procedure master, PrepaidSetting, FeeScheduleLine. Order: DM-01, DM-02, DM-06, DM-09, DM-10 are foundations that everything else ripples from; the ledger work (DM-18) must precede credit/rebill, additional invoices, AA fee and balance tools. Already aligned, no delta: DRAFT to SUBMITTED to AUTHORISED with no Returned state, append-only audit, soft cancel, hidden internal patient ID with NHI never sent to Xero, dual-format NHI validation, ACCREC plus draft ACCPAY pair with two payment states and pro-rata payable release, per-invoice failure tracking, one invoice per distinct payer per Card, tiered time units, per-anaesthetist unit value, HPI on the anaesthetist, insurer acceptsDirectClaims, per-hospital holiday calendars, Permanent Lists, soft conflict warnings, scheduled Xero contact archiving. Also aligned, found in verification: the office price override (DM-12), photo capture as a simulation (DM-34), roles as anaesthetist / office / system (former DM-33, dropped). Out of plan because Future: the HL7/FHIR message model and monitor (DM-28 keeps only the manual matching model). Heavy open-question exposure (model shape may still move): OQ-06, OQ-17, OQ-23, OQ-27, OQ-40, OQ-42, OQ-44, OQ-49, OQ-53.

Sizes: S under a day, M a day or two, L several days, XL a week or more including seed, screens and tests. **Verification.** DM-33 (roles) was refuted: the catalogue asks only for role-based rights with 'further roles as needed', which the prototype's role checks already satisfy. DM-35 (patient insurer and funding source) was added. DM-12, DM-18, DM-28, DM-29 and DM-34 were corrected; each section carries a Verification line. Deltas are numbered in suggested build order where one must precede another; each section's Impact says what it blocks.

| ID | Kind | Title | Size |
| --- | --- | --- | --- |
| [DM-01](#dm-01) | ChangedEntity | Card becomes Booking and carries the booking-level billing context | L |
| [DM-02](#dm-02) | ChangedEntity | Slot, List and Draft List are three things; the prototype has one (List = slot) | XL |
| [DM-03](#dm-03) | NewEntity | Draft List (prepared, not yet assigned to any anaesthetist) | M |
| [DM-04](#dm-04) | ChangedEntity | Slot availability status: own vocabulary, held on the Slot, independent of bookings | M |
| [DM-05](#dm-05) | NewEntity | Swap request between anaesthetists, confirmed by the office | M |
| [DM-06](#dm-06) | ChangedEntity | Contract is reshaped from Type 1/2/3 to category, holder, scope and pricing basis | XL |
| [DM-07](#dm-07) | NewLifecycle | Contract versions and the AUTHORISED snapshot (contract locked with the Procedure) | L |
| [DM-08](#dm-08) | ChangedEntity | ContractPrice becomes a full FeeScheduleLine | L |
| [DM-09](#dm-09) | ChangedRelationship | Each Procedure selects exactly one Contract; the billing-route step disappears | XL |
| [DM-10](#dm-10) | ChangedRelationship | Billable party and invoice email live on the Booking and are independent of pricing | L |
| [DM-11](#dm-11) | NewEntity | Procedure master mapped to RVG code or category, holding authoritative base units | M |
| [DM-12](#dm-12) | ChangedEntity | Anaesthetist adjustment is a new Contract-gated record; the office override is already the existing priceOverride | S |
| [DM-13](#dm-13) | RuleChange | Multi-procedure rule: primary flag, modifier split above four units, per-Contract override | M |
| [DM-14](#dm-14) | ChangedEntity | Required booking inputs and the 'confirm with hospital' flag on the Procedure | S |
| [DM-15](#dm-15) | NewEntity | Prepaid settings on the anaesthetist profile (RVG codes and groups) | M |
| [DM-16](#dm-16) | ChangedLifecycle | Prepayment lifecycle: estimate, invoice at setup, tracking, remaining balance, no completion gate | L |
| [DM-17](#dm-17) | NewEntity | Trust account and central prepayment refunds | M |
| [DM-18](#dm-18) | ChangedEntity | Internal ledger: promote BillingCase into linked receivable and payable records (Xero stays a mirror) | L |
| [DM-19](#dm-19) | NewRelationship | Derived ledger positions: whole ledger, per anaesthetist, per patient (in balance or out) | M |
| [DM-20](#dm-20) | ChangedEntity | Additional invoice on a Procedure replaces the post-op addendum Card | L |
| [DM-21](#dm-21) | NewLifecycle | Wrong invoice is credited in full, then rebilled (credit note, payable reversal, new invoice) | L |
| [DM-22](#dm-22) | NewEntity | AA fee is a separate invoice from AA to the anaesthetist (not a deduction on the payable) | M |
| [DM-23](#dm-23) | ChangedEntity | Invoice entity: numbering, supplier/agent presentation, email, delivery and lineage | M |
| [DM-24](#dm-24) | ChangedRelationship | Invoice grouping by billable party and how one Procedure splits between two payers | M |
| [DM-25](#dm-25) | RuleChange | Patient: NHI required with a missing-NHI problem list; configurable unpaid-invoice alert | M |
| [DM-26](#dm-26) | NewEntity | Surgeon profile, surgeons' rooms, blacklist and hospital contact email | L |
| [DM-27](#dm-27) | ChangedEntity | Anaesthetist profile: bank details, prepaid settings, admin-editable | S |
| [DM-28](#dm-28) | ChangedEntity | Intake model: import rows, matching decisions, unmatched queue and per-hospital sync state | L |
| [DM-29](#dm-29) | NewEntity | Explicit-save change sets, booking update email draft and concurrent-edit detection | M |
| [DM-30](#dm-30) | ChangedLifecycle | List visibility after invoicing: unbilled to billed, not vanished | S |
| [DM-31](#dm-31) | ChangedLifecycle | Contract selection carries an approval state (anaesthetist change flagged, office approves at review) | S |
| [DM-32](#dm-32) | ChangedEntity | Reference data: master public-holiday calendar, controlled-spreadsheet load, editable masters | S |
| [DM-34](#dm-34) | ChangedEntity | Booking source, List-level attachments and Copy a Booking (copy is not the additional-procedure mechanism) | M |
| [DM-35](#dm-35) | ChangedRelationship | Patient insurer and funding source are captured on the Booking and drive the Contract picker | S |

## DM-01

### Card becomes Booking and carries the booking-level billing context

**Kind:** ChangedEntity · **Size:** L

**Catalogue says.** Booking replaces Card; 'Card' now means only the physical hospital or surgeon card. A Booking belongs to one List, references a Patient (NHI), has one primary and zero or more additional Procedures, and itself carries the billable party, invoice email, prepayment state (required, amount, prepayment invoice), estimated duration and its source (hospital download, surgeon PDF, admin, anaesthetist ad hoc or photo, copy). Attachments can sit on a Booking or a whole List.

**Prototype has.** Card (types.ts:370) with listId, patientId, completed, copiedFromCardId, correlationRef, cancellation, prepaymentOverride, attachments. No source field beyond correlationRef and audit source. Billable party, billing route and payment category live on the Procedure, not the Card. The name Card is baked into ids (CardId), Invoice.cardId, BillingCase.cardId, audit entityType 'card', store/cardActions.ts and copy. Attachments exist on Card only.

**Impact.** Foundation. Touches types, store actions, selectors, seed (cards.ts, history.ts, audit.ts), invoices/cases keys, audit labels and every screen's copy. Do the mechanical rename first as its own step (persist key, audit entityType strings, PERSIST_VERSION bump), then add the new booking-level fields as DM-10, DM-16 and DM-28 need them. A rename is cosmetic per se but the field moves are not.

**Verification (upheld).** Card at types.ts:370, CardId at types.ts:39, attachments on Card only: all confirmed. Booking source is listed in domain-model.md (Booking > Sources), not in one story. Scope: all refs are Confirmed or Proposed.

**Catalogue:** [domain-model.md (Booking)](../../../discovery-reference/Updated%20Requirements/domain-model.md), [FT-03.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-03.2.md), [US-03.1.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.1.3.md), [US-02.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.4.1.md), [US-02.4.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.4.3.md), [US-03.6.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.6.1.md), [US-11.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.2.2.md)

**Prototype:** `aa-prototype/src/domain/types.ts:370`, `aa-prototype/src/domain/types.ts:39`, `aa-prototype/src/store/cardActions.ts:70`, `aa-prototype/src/store/cardActions.ts:179`

## DM-02

### Slot, List and Draft List are three things; the prototype has one (List = slot)

**Kind:** ChangedEntity · **Size:** XL

**Catalogue says.** A Slot is the AM or PM session generated per anaesthetist per day, four months ahead, and can be empty. A List is assigned to an anaesthetist, sits in exactly one Slot, holds Bookings and follows the one-surgeon-one-hospital rule. A Slot with no List has no surgeon or hospital. Hierarchy: Day > Slot > List > Booking > Procedure > Contract. Lists move between anaesthetists with Bookings intact; the swap consumes the covering anaesthetist's Slot and the vacated Slot returns to available.

**Prototype has.** Only List (types.ts:301), one per anaesthetist x date x session, id derived from the slot (L-<anae>-<date>-<session>, canvas.ts:listIdForSlot). An empty Slot is a List with statusKey 'free' and state 'DRAFT'. Assigning a surgeon and hospital edits the same record (editList). reassignList deletes the target's free List and mints a new List id for the vacated slot (lifecycle.ts:550), i.e. the List identity and the Slot identity are welded together. Horizon is 14 days back to 4 months forward (clock.ts:96).

**Impact.** Foundation and the largest structural change on the schedule side. A new Slot record (anaesthetist, date, session, availability, default times) keyed by the deterministic slot id; List gains its own id and a slotId, and is created on assignment (US-01.3.3, permanent-list projection, Draft List assignment). Ripples into seed canvas generation, clock roll-forward, every selector using listForSlot/cardsForList, reassignList (now: change the List's slot, vacate the old one), the Admin Day grid, mobile schedule, web availability. Must precede DM-03, DM-04, DM-05. Persisted state must be reseeded.

**Verification (upheld).** Confirmed: List id is derived from the slot (canvas.ts:45), and reassignList allocates a fresh List id for the vacated slot (lifecycle.ts:601 via allocateId) and deletes the target's free List. US-01.3.4 (Retired) is merged into US-01.3.1, so nothing dropped. FT-01.3 is Verify; OQ-44 open.

**Catalogue:** [domain-model.md (Slot, List and Draft List)](../../../discovery-reference/Updated%20Requirements/domain-model.md), [EP-01](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/EP-01.md), [FT-01.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-01.1.md), [FT-01.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-01.3.md), [US-01.1.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.1.1.md), [US-01.3.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.3.1.md), [US-01.3.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.3.3.md), [US-01.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.4.1.md), [OQ-44](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-44.md)

**Prototype:** `aa-prototype/src/domain/types.ts:301`, `aa-prototype/src/domain/seed/canvas.ts:44`, `aa-prototype/src/store/lifecycle.ts:550`, `aa-prototype/src/domain/seed/index.ts:105`

## DM-03

### Draft List (prepared, not yet assigned to any anaesthetist)

**Kind:** NewEntity · **Size:** M

**Catalogue says.** A Draft List records what is known so far (hospital, surgeon, day, session), has no anaesthetist, takes no Slot, is flagged in the Admin App and on the one-day dashboard, shows time waiting, and is assigned by an admin to a chosen anaesthetist and Slot, becoming a List and keeping anything recorded. Assignment onto an unavailable Slot or a blacklisted pairing shows a soft warning. It can be created from a hospital row on the matching screen. Whether it may hold Bookings and what happens on cancellation is open (OQ-44).

**Prototype has.** Nothing. Requests that arrive before an anaesthetist is known have nowhere to go; an admin must pick an anaesthetist's free List first (editList) or ingest into an existing List. The word DRAFT in the prototype is the approval state of a List (ListState), not this concept, so the two can be confused in code and copy.

**Impact.** New collection in the schedule slice (draftLists), audit entity, Admin views (flagged list plus day-dashboard rows), an assign action that converts it into a List in a Slot. Depends on DM-02 (Slot/List split) and, for the blacklist warning, DM-26. Naming clash with ListState 'DRAFT' should be resolved when the type is added. Contents and lifecycle still open (OQ-44), so keep the shape minimal (hospital?, surgeon?, date, session, note, createdAt).

**Verification (upheld).** US-01.6.1 to .3 are Proposed; contents and lifecycle open (OQ-44), so keep the shape minimal. 'DRAFT' clash with ListState confirmed (types.ts:46).

**Catalogue:** [FT-01.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-01.6.md), [US-01.6.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.6.1.md), [US-01.6.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.6.2.md), [US-01.6.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.6.3.md), [US-02.1.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.1.2.md), [US-13.1.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.1.1.md), [OQ-44](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-44.md)

**Prototype:** `aa-prototype/src/domain/types.ts:46`, `aa-prototype/src/store/lifecycle.ts:498`

## DM-04

### Slot availability status: own vocabulary, held on the Slot, independent of bookings

**Kind:** ChangedEntity · **Size:** M

**Catalogue says.** Availability is set per Slot by the anaesthetist (available, available for emergency, unavailable, on leave; final set TBC, OQ-17), is master data the admin can add to and rename with description and colour, and is never derived from booking activity. Admins set default start and end times for AM and PM Slots, overridable per Slot. Whether this is the same concept as the RFP's separate Anaesthetist Availability calendar is open (OQ-27).

**Prototype has.** One six-value ListStatusKey (private, public, preop, holiday, unavailable, free; types.ts:53) that mixes what is booked (private/public/preop) with availability (holiday/unavailable/free) and drives the six status colours from the design language. A separate AnaesthetistAvailability master (types.ts:593; kinds available, unavailable, holiday) is reconciled INTO List.statusKey (or a conflict flag) by setAvailability (lifecycle.ts:703) - the RFP reading. ListStatus master rows exist (types.ts:610) but their vocabulary is fixed by the theme parity test. Session start/end are optional office-overridable fields on List.

**Impact.** Depends on DM-02. Availability moves onto the Slot; the display status key becomes derived (Slot availability plus whether a List is attached and its kind) so the existing six-colour design language can stay. reconcile logic in setAvailability, conflict flagging and canvas generation change. Vocabulary stays a moving target until OQ-17 and OQ-27 settle, so model the status set as editable master data rather than a union type.

**Verification (upheld).** Both models exist side by side in the prototype (types.ts:53 six-value key, types.ts:593 availability master). US-01.5.3 is Open and OQ-17/OQ-27 are open, so the status set must stay editable data.

**Catalogue:** [FT-01.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-01.2.md), [US-01.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.2.1.md), [US-01.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.2.2.md), [US-01.2.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.2.3.md), [US-01.1.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.1.4.md), [US-01.5.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.5.3.md), [OQ-17](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-17.md), [OQ-27](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-27.md)

**Prototype:** `aa-prototype/src/domain/types.ts:53`, `aa-prototype/src/domain/types.ts:593`, `aa-prototype/src/domain/types.ts:610`, `aa-prototype/src/store/lifecycle.ts:703`, `aa-prototype/src/domain/statusKeyParity.test.ts`

## DM-05

### Swap request between anaesthetists, confirmed by the office

**Kind:** NewEntity · **Size:** M

**Catalogue says.** From the availability view an anaesthetist requests that one of their Lists be swapped to a colleague; the office confirms the reassignment before it takes effect (whether confirmation can be skipped for short-notice cover is OQ-39). A blacklisted colleague for the List's surgeon shows the same soft warning as an office assignment (what it reveals is OQ-43). Reassignment changes the owner reference on the List; the move is one temporal event (from, to, by, when).

**Prototype has.** CoverRequest (types.ts:277) hangs off a FREE List as an optional field: an 'offer' or 'request' marker with status 'pending' only, simulated, no resolution and no relation to a booked List. reassignList is office-only and immediate. No pending/approved/declined state and no reassignment event record beyond the audit entry.

**Impact.** Replaces the CoverRequest marker with a SwapRequest record (listId, fromAnaesthetistId, toAnaesthetistId, status PENDING/CONFIRMED/DECLINED, requestedBy, decidedBy). Mobile request flow, Admin review action, availability finder. Depends on DM-02 (a booked List moves between Slots) and DM-26 (blacklist).

**Verification (upheld).** CoverRequest only ever has status 'pending' (types.ts:277-285) and hangs off a free List. OQ-08 is Answered (owner reference changes); OQ-39/OQ-43 open.

**Catalogue:** [US-01.4.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.4.3.md), [US-01.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.4.1.md), [US-01.4.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.4.5.md), [US-01.4.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.4.2.md), [OQ-08](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-08.md), [OQ-39](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-39.md), [OQ-43](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-43.md)

**Prototype:** `aa-prototype/src/domain/types.ts:277`, `aa-prototype/src/store/lifecycle.ts:844`, `aa-prototype/src/store/lifecycle.ts:550`

## DM-06

### Contract is reshaped from Type 1/2/3 to category, holder, scope and pricing basis

**Kind:** ChangedEntity · **Size:** XL

**Catalogue says.** One reusable Contract answers how a Procedure is priced, what rules apply, who is invoiced by default, and what extra inputs the Booking needs. Fields: id, name, version, effectiveFrom/To, reviewDate; category (RVG Default Post-paid, RVG Default Hospital, Hospital, Surgeon Solo, Surgeon Group, Insurance; ACC is a Hospital/holder Contract with ACC pricing; no Pre-paid category); holder (hospital, surgeon or surgeon-group entity, insurer, or the Booking's billable party); scope filters (hospitals[], surgeons[], insurers[], rvgCodes[]/groups[], fundingSource, anaesthetists[] where empty = organisational); pricingBasis (RVG_UNITS_ANAESTHETIST_RATE, RVG_UNITS_CONTRACT_RATE with $/unit or % discount, FIXED_SCHEDULE, RATE_TIME); baseUnitOverrides; multiProcedureRule; allowsAnaesthetistAdjustment; coveredAmount/coveredPercent; requiredBookingInputs; invoiceLayout; deliveryMethod; gstTreatment.

**Prototype has.** Contract (types.ts:216): type 1|2|3, one holderType/holderId (hospital, insurer, surgeon, organisation, billableParty), scope organisation|individualAnaesthetist, permitsIndividualArrangement (the rate x time gate), isDefault (protected default Type 1), effective dates, type2Detail (agreedUnitRate | percentDiscount). No category, no multi-dimension scope, no fundingSource, no multiProcedureRule, no allowsAnaesthetistAdjustment, no requiredBookingInputs, no covered amount, no delivery method, no GST treatment, no reviewDate. Seeds: five hospital default Type 1s, nib default, SXAP/HNZ/ACC/bariatric/COS/hourly examples (seed/contracts.ts). contractActions.ts creates/edits/deletes (deleteContract exists; catalogue says retire and version).

**Impact.** Foundation for pricing, selection and the Admin Contract catalogue. Maps: Type 1 = RVG_UNITS_ANAESTHETIST_RATE, Type 2 = RVG_UNITS_CONTRACT_RATE, Type 3 = FIXED_SCHEDULE, permitsIndividualArrangement = RATE_TIME. selectContract precedence (individual beats organisational, specific beats default) becomes scope-filtering plus an explicit choice (DM-09), not a resolver. fee.ts, contracts.ts, contractActions.ts, MasterData contract editor, seed contracts all change. Depends on nothing; DM-07, DM-08, DM-09, DM-12, DM-13, DM-14 depend on it. Base-unit ownership (Contract override vs Procedure master) still open (OQ-06). Category list follows US-04.1.1 (no Pre-paid). A Surgeon Group needs a member list (see DM-26). Scope.anaesthetists becomes a list.

**Verification (upheld).** Extra points found: (a) the catalogue category list (US-04.1.1) has NO 'RVG Default Pre-paid', although the table in domain-model.md still lists it; US-04.1.1 and OQ-25 (Answered) win. (b) 'Surgeon Group' holder has no member list in the prototype (ContractHolderOrganisation is the nearest thing). (c) scope.anaesthetists[] is a list; the prototype allows one individual anaesthetist. US-04.2.9 (Retired) is merged into US-04.2.1 (Verify), so the individual-Contract reach is still in scope.

**Catalogue:** [domain-model.md (Contract (recommended structure))](../../../discovery-reference/Updated%20Requirements/domain-model.md), [EP-04](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/EP-04.md), [FT-04.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-04.1.md), [FT-04.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-04.2.md), [US-04.1.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.1.1.md), [US-04.1.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.1.2.md), [US-04.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.1.md), [US-04.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.2.md), [US-04.2.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.5.md), [US-04.2.7](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.7.md), [US-04.2.8](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.8.md), [US-05.5.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.5.1.md), [OQ-06](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-06.md), [OQ-25](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-25.md)

**Prototype:** `aa-prototype/src/domain/types.ts:195`, `aa-prototype/src/domain/types.ts:216`, `aa-prototype/src/domain/seed/contracts.ts:32`, `aa-prototype/src/store/contractActions.ts:53`, `aa-prototype/src/domain/billing/contracts.ts:38`

## DM-07

### Contract versions and the AUTHORISED snapshot (contract locked with the Procedure)

**Kind:** NewLifecycle · **Size:** L

**Catalogue says.** The system keeps every version of a Contract. At AUTHORISED the engine snapshots the Contract version onto each Procedure (and the reference data the calculation used: rates, RVG values, the anaesthetist's unit value, party details) so an invoice can be regenerated exactly, and later edits or price changes never change a raised invoice. Every price line carries its own effective-from date and upcoming prices can be entered ahead (which date decides the price in force is OQ-48).

**Prototype has.** No version on Contract and no snapshot at AUTHORISED (authoriseList only flips state, lifecycle.ts:277). Reproducibility is partial and after the fact: the billing run rates with the LIVE contract and writes amounts and a rate description into InvoiceLine text (invoiceBuild.ts, 'Snapshot the rate detail into the line description'). If a Contract expires between authorise and billing, resolveContractForProcedure falls back to the hospital or insurer default Type 1 or raises a failed BillingCase (invoiceBuild.ts:114). Contract has a single effectiveFrom/To pair; ContractPrice has no dates.

**Impact.** New Contract version history (append-only, keyed contractId + version) and a per-Procedure locked record (contractId, contractVersion, unit value, base units, price line used) written in authoriseList. The billing run reads only the locked record, which removes the effective-date fallback branch and its 'contractIneffective' failure demo. Depends on DM-06 and DM-08. Reseed and PERSIST_VERSION bump. The fields to freeze are still to be decided in discovery.

**Verification (upheld).** US-04.3.5 is Confirmed. authoriseList (lifecycle.ts:277) only flips state; resolveContractForProcedure falls back to the default when the stored contract is ineffective (invoiceBuild.ts:139-146). Fields to freeze are still to be decided (US-15.0.3).

**Catalogue:** [US-04.1.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.1.3.md), [US-04.3.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.3.5.md), [US-07.3.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-07.3.1.md), [US-08.4.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.4.4.md), [US-04.2.10](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.10.md), [US-15.0.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-15.0.3.md), [OQ-48](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-48.md)

**Prototype:** `aa-prototype/src/store/lifecycle.ts:277`, `aa-prototype/src/domain/billing/invoiceBuild.ts:114`, `aa-prototype/src/domain/types.ts:216`

## DM-08

### ContractPrice becomes a full FeeScheduleLine

**Kind:** ChangedEntity · **Size:** L

**Catalogue says.** Children of a FIXED_SCHEDULE Contract: holder code and description (e.g. SXAP AP0126, CES HNZCATall, ACC OPT101), priceExGst and priceIncGst, optional mappedRvgCodes so BTM is still recorded, timeBand, isAddOn, quantityRule (e.g. per area), tier (commitment vs panel) and effectiveFrom. The Procedure records feeScheduleLineId. Base, time and modifier units are still recorded when the price comes from a line.

**Prototype has.** ContractPrice (types.ts:250): contractId, optional rvgBaseCode, surgeonId, procedureOrdinal (2nd-procedure price), price. Matched most-specific-wins by RVG base code, surgeon and ordinal (contracts.ts:matchContractPrice); no holder code, description, GST-inclusive price, time band, add-on, quantity rule, tier or date. No feeScheduleLineId on Procedure; a Type 3 with no matching row falls back to BTM (a labelled demo reading).

**Impact.** Replaces ContractPrice and its selection-by-key matching with an explicit line chosen on the Procedure (and shown by holder code). fee.ts Type 3 branch gains time bands, add-ons and quantity; procedureOrdinal moves to the Contract's multiProcedureRule (DM-13). Seed needs realistic lines; Admin price editor changes. Depends on DM-06. The not-on-schedule outcome is DM-14.

**Verification (upheld).** ContractPrice (types.ts:250) confirmed. OQ-48 open (which date decides the price).

**Catalogue:** [US-04.2.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.4.md), [US-04.2.10](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.10.md), [US-05.2.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.2.5.md), [US-03.6.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.6.1.md), [OQ-18](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-18.md), [OQ-48](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-48.md)

**Prototype:** `aa-prototype/src/domain/types.ts:250`, `aa-prototype/src/domain/billing/contracts.ts:77`, `aa-prototype/src/domain/billing/fee.ts:180`, `aa-prototype/src/store/contractActions.ts:200`

## DM-09

### Each Procedure selects exactly one Contract; the billing-route step disappears

**Kind:** ChangedRelationship · **Size:** XL

**Catalogue says.** No separate route step. Each Procedure selects exactly one Contract (a hard prerequisite for completing the Booking), chosen from a list filtered by the List's hospital, the surgeon, the patient's insurer or funding source and the RVG code; the RVG Default Hospital Contract for the List's hospital is always offered and is the default. Admin sets it at booking setup, the anaesthetist may change it (audited and flagged for office review), and the admin approves or corrects it at SUBMITTED review. Insurance: an insurer that does not accept direct claims means the patient is invoiced and forwards the invoice, not a separate category.

**Prototype has.** Procedure has billingRoute ('hospital' | 'billableParty' | 'insurer'), governingContractId (optional), insurerId, billablePartyId, patientPaymentCategory (selfFundedPostProcedure | selfFundedPrepayment | insuredReimbursement), prepaymentDetail, billingReference (types.ts:444-484, 409-430). The validator fails an unset route; the billing run resolves the contract and the payer from route plus stored contract (invoiceBuild.ts:114, 192). The 'billableParty' route needs no contract at all. Contract choice is an admin/office billing-setup control (OfficeBillingSetup, EditBillingSetupSheet).

**Impact.** Removes BillingRoute, PatientPaymentCategory and Procedure.insurerId; contractId becomes required for completion. Who-gets-the-invoice moves to the Booking (DM-10); prepayment trigger moves to the anaesthetist's prepaid settings (DM-15/DM-16). Rewrites resolveContractForProcedure, counterpartyForProcedure, validateCardForBilling, the mobile/web capture and office billing-setup UI (the route picker becomes a filtered Contract picker), the review flags and the seed for every card. Default-contract auto-creation on new hospital/insurer (US-04.4.1) and a filtered picker selector are new. Depends on DM-06; DM-10 and DM-24 run alongside. Largest ripple on the billing side.

**Verification (upheld).** Confirmed in invoiceBuild.ts:114-190: billableParty route resolves with no contract, hospital and insurer routes fall back to a default Type 1. US-08.1.2 (Retired) is merged into US-08.1.1, still in scope. FT-04.3 and US-04.3.1 to .4 are Confirmed.

**Catalogue:** [FT-04.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-04.3.md), [US-04.3.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.3.1.md), [US-04.3.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.3.2.md), [US-04.3.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.3.3.md), [US-04.3.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.3.4.md), [US-03.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.4.1.md), [US-07.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-07.2.2.md), [US-08.1.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.1.1.md), [US-11.4.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.4.2.md), [US-04.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.4.1.md), [FT-04.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-04.4.md)

**Prototype:** `aa-prototype/src/domain/types.ts:409`, `aa-prototype/src/domain/types.ts:416`, `aa-prototype/src/domain/types.ts:444`, `aa-prototype/src/domain/billing/invoiceBuild.ts:114`, `aa-prototype/src/domain/billing/invoiceBuild.ts:192`, `aa-prototype/src/domain/billing/validateCardForBilling.ts:104`, `aa-prototype/src/shared/card/OfficeBillingSetup.tsx`

## DM-10

### Billable party and invoice email live on the Booking and are independent of pricing

**Kind:** ChangedRelationship · **Size:** L

**Catalogue says.** Each Booking carries a billable party and invoice email. It defaults to the Contract's holder (hospital, insurer, surgeon entity) or, for patient-direct Contracts, the patient, and can be overridden by admin or anaesthetist (a guardian, or a hospital taking the invoice while the price stays default RVG). The billable party is independent of how the Procedure is priced. A patient under 18 is never the billable party: it is flagged at booking setup and again at office review (block or warn is OQ-54). Invoice email is required for patient-direct Contracts.

**Prototype has.** BillableParty (types.ts:127) is a guardian-only record with relationshipToPatient, deliberately not a Patient. Payer is derived per Procedure: counterpartyForProcedure returns the insurer, the BillableParty or the patient (billableParty route), else the resolved contract's holder (invoiceBuild.ts:192). There is no Booking-level payer and no invoice email field on Card, Procedure or Invoice (only Patient.email and BillableParty.email). No under-18 check (Patient.dobISO exists, types.ts:107). counterparty kinds already include hospital, insurer, surgeon, organisation, patient, billableParty (types.ts:73).

**Impact.** Adds booking-level billableParty (CounterpartyRef) and invoiceEmail with defaults derived from the chosen Contract holder or patient; groups Procedures by that party in the billing run (DM-24/DM-23). BillableParty stays for guardians but is now one of several party kinds. New validation: under-18 flag, invoice email required for patient-direct Contract. Card/Booking detail UI gets a payer block; Xero contact resolution keyed per party is unchanged. Depends on DM-01 and DM-09.

**Verification (upheld).** No invoiceEmail on Card, Procedure or Invoice (types.ts:370, 444, 662). US-11.2.4 (under 18) is Proposed; block-or-warn is OQ-54.

**Catalogue:** [FT-11.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-11.2.md), [US-11.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.2.1.md), [US-11.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.2.2.md), [US-11.2.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.2.3.md), [US-11.2.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.2.4.md), [US-04.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.1.md), [US-08.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.2.1.md), [US-08.4.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.4.2.md), [US-07.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-07.2.2.md), [OQ-54](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-54.md)

**Prototype:** `aa-prototype/src/domain/types.ts:127`, `aa-prototype/src/domain/types.ts:73`, `aa-prototype/src/domain/billing/invoiceBuild.ts:192`, `aa-prototype/src/store/billablePartyActions.ts:21`

## DM-11

### Procedure master mapped to RVG code or category, holding authoritative base units

**Kind:** NewEntity · **Size:** M

**Catalogue says.** A master list of operations by name (e.g. appendicectomy), each mapped to the RVG code or category it belongs under and holding its own authoritative base units, because a code alone can carry different values (minor vs simple). A Contract may override those base units. Position loadings are modifiers, not base units. The RVG code master keeps the guide's own values, and AA can add AA-sourced codes. Whether the anaesthetist picks by operation name or by RVG code is open (OQ-06). Loaded from controlled spreadsheets; Solutions Plus supplies names only.

**Prototype has.** No Procedure master. Procedure.rvgBaseCode points straight at RvgCode (types.ts:544) whose baseUnits are the base-unit source (single or range), with baseUnitsSelected for ranges and a captured override (types.ts:491-495). RvgCode has no AA-sourced flag and no groups; there is no RVG group concept (no cosmetic/plastics/dental tags) and no operation-name entity. Modifier master exists (ModifierCode, types.ts:556) with demo values.

**Impact.** New masters: ProcedureType (name, rvgCode or category, baseUnits) and RvgGroup with code-to-group tags (also needed by DM-15). Procedure gains procedureTypeId (or keeps rvgBaseCode with base units resolved through the master and Contract override). resolveBtm changes its base-unit source. Capture UI picker changes if OQ-06 lands on operation names. Depends on DM-06 for the override. Keep the shape flexible until OQ-06 is settled.

**Verification (upheld).** US-05.1.6 Proposed; US-05.1.2 (Add AA codes, Retired) is merged into US-05.1.1 (Verify), so the AA-sourced flag remains in scope. OQ-06 status is Confirm.

**Catalogue:** [US-05.1.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.1.6.md), [US-05.1.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.1.1.md), [US-05.1.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.1.3.md), [US-05.1.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.1.5.md), [US-03.3.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.3.1.md), [US-04.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.2.md), [US-13.4.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.4.3.md), [OQ-06](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-06.md)

**Prototype:** `aa-prototype/src/domain/types.ts:540`, `aa-prototype/src/domain/types.ts:491`, `aa-prototype/src/domain/seed/rvgCodes.ts`, `aa-prototype/src/domain/billing/fee.ts:57`

## DM-12

### Anaesthetist adjustment is a new Contract-gated record; the office override is already the existing priceOverride

**Kind:** ChangedEntity · **Size:** S

**Catalogue says.** Two distinct records on the Procedure. Anaesthetist adjustment: a percent discount or fixed final price with a required reason, only when the Contract allows it (the field is not offered otherwise), applied after BTM is recorded in full (even at 100% discount). Office override: percent, amount or fixed final with a reason, always available whatever the Contract says, including over a fixed-fee price, fully audited. Both apply after the base calculation.

**Prototype has.** One PriceOverride union on the Procedure (types.ts:434): fixedFee, dollarAdjustment, percentAdjustment, each with a reason, no actor and no Contract gate. This IS the catalogue's office override (US-05.4.2 lists the same three forms, always available, OQ-16 Answered), so that half is aligned. The anaesthetist path reuses the same field: the capture UI lets the anaesthetist write fixedFee or dollarAdjustment and reserves percent for the office (OverrideCard.tsx:28-46), a UI convention rather than a model rule, and nothing gates it on the Contract (no allowsAnaesthetistAdjustment). fee.ts applies it after the subtotal.

**Impact.** Keep priceOverride as officeOverride (add actor). Add a separate anaesthetistAdjustment {PERCENT|FIXED_FINAL, value, reason} that is offered only when the Procedure's Contract has allowsAnaesthetistAdjustment; fee.ts applies adjustment then override and records the pre-adjustment fee (BTM stays recorded in full, even at 100%). Anaesthetist capture UI swaps fixed/dollar for percent/fixed-final and hides the field when the Contract does not permit it. Audit labels change. Depends on DM-06 for the Contract flag.

**Verification (corrected).** Draft said the single priceOverride is replaced. It is not: the office override in US-05.4.2 (fixed final fee, dollar adjustment, percentage adjustment, always available) is exactly the existing PriceOverride union, so the office side is ALREADY ALIGNED. What is missing is a separate Contract-gated anaesthetist adjustment record (percent discount or fixed final price only, reason required, no dollar adjustment). Today the anaesthetist UI writes fixedFee or dollarAdjustment and percent is office-only (OverrideCard.tsx:28-46), which is the reverse of the catalogue for percent and dollar. Size lowered from M to S.

**Catalogue:** [FT-03.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-03.5.md), [US-03.5.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.5.1.md), [US-03.5.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.5.2.md), [FT-05.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-05.4.md), [US-05.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.4.1.md), [US-05.4.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.4.2.md), [US-04.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.2.md), [OQ-16](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-16.md)

**Prototype:** `aa-prototype/src/domain/types.ts:434`, `aa-prototype/src/domain/types.ts:501`, `aa-prototype/src/domain/billing/fee.ts:180`, `aa-prototype/src/shared/capture/OverrideCard.tsx`, `aa-prototype/src/shared/flows/PriceOverrideSheet.tsx`

## DM-13

### Multi-procedure rule: primary flag, modifier split above four units, per-Contract override

**Kind:** RuleChange · **Size:** M

**Catalogue says.** Exactly one primary Procedure per Booking (anyone with edit rights, including an inbound source, may change which). Base units only on the primary, never editable on others. Time units on every Procedure from its own times. Modifier units all on the primary when the Booking total is 4 or fewer; above 4 they are split equally across all Procedures with the remainder to the primary (worked example 7 over 3 = 3/2/2; rounding when they do not divide is OQ-15). Each Procedure is priced by its own Contract. A Contract may replace the rule (SECOND_CODE_PERCENT 50%, ADD_ON_FEE, NOT_BILLABLE). The ledger records each Procedure's share of units and dollars. How combined procedures are modelled is OQ-53.

**Prototype has.** The RFP rule: an additional Procedure yields time units ONLY; base and modifiers charge on the first Procedure alone (fee.ts:splitBillingUnits, line 107). Procedure.isAdditional is set by addProcedure/copyCard (types.ts:484); there is no isPrimary flag (the first Procedure by order is implicitly primary) and no 'set primary' action. No modifier split. Contract 2nd-procedure pricing is by ContractPrice.procedureOrdinal (Type 3 only). The share per Procedure is recorded as invoice lines, not a ledger share.

**Impact.** Pure domain change with Vitest updates: replace isAdditional with isPrimary (exactly-one invariant), compute per-Booking modifier allocation across Procedures (feeFor now needs the whole Booking, not one Procedure), honour Contract.multiProcedureRule. Capture UI shows an allocated modifier share on additional Procedures instead of 'Not charged'. Seed and every worked-example test change. Depends on DM-06 for the rule field; DM-01 for Booking-level computation. Rounding remainder rule to be confirmed (OQ-15).

**Verification (upheld).** US-05.3.2 and US-05.3.3 (Retired) are merged into US-05.3.1 (Confirmed). splitBillingUnits confirmed (fee.ts:107). Note the prototype sets isAdditional on a whole copied Card (cardActions.ts:179), which is tied up with DM-34.

**Catalogue:** [FT-05.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-05.3.md), [US-05.3.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.3.1.md), [US-05.3.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.3.4.md), [US-05.3.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.3.5.md), [US-03.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.2.1.md), [US-03.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.2.2.md), [US-03.2.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.2.3.md), [US-04.2.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.5.md), [OQ-15](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-15.md), [OQ-53](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-53.md)

**Prototype:** `aa-prototype/src/domain/billing/fee.ts:107`, `aa-prototype/src/domain/types.ts:484`, `aa-prototype/src/store/cardActions.ts:394`, `aa-prototype/src/shared/capture/UnitsCard.tsx:36`

## DM-14

### Required booking inputs and the 'confirm with hospital' flag on the Procedure

**Kind:** ChangedEntity · **Size:** S

**Catalogue says.** A Contract declares which per-Booking inputs it requires (invoiceEmail, billableParty, prepaidAmount, insurerMemberNumber, claimReference, purchaseOrder); the Booking holds the values and cannot be marked complete until they are present. When a hospital sheet says a Procedure is under a Contract but it is not on the Contract's schedule, an admin can set the Contract anyway and flag the Procedure 'to confirm with the hospital'; the flag shows on office review and is cleared on confirmation, after which either the price is added to the schedule or the Procedure stays on default RVG pricing with only the billable party changed.

**Prototype has.** Procedure.billingReference (types.ts:480) is the only generic reference, checked only on the 'hospital' route (billingReferenceMissing, validateCardForBilling.ts:53). No insurerMemberNumber, claimReference, purchaseOrder, no per-Contract required-input declaration, no confirm-with-hospital flag.

**Impact.** Small additive fields on Procedure/Booking (memberNumber, claimReference, purchaseOrder, toConfirmWithHospital) plus Contract.requiredBookingInputs; validateCardForBilling and reviewFlags read the declaration instead of the route-based reference rule. Depends on DM-06 and DM-09.

**Verification (upheld).** US-04.3.7 and US-04.2.7 are Proposed. US-04.3.6 (hospital data sets the Contract) is Proposed but in the Future Work lane and is correctly not used.

**Catalogue:** [US-04.2.7](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.7.md), [US-03.6.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.6.1.md), [US-04.3.7](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.3.7.md), [US-07.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-07.2.2.md)

**Prototype:** `aa-prototype/src/domain/types.ts:480`, `aa-prototype/src/domain/billing/validateCardForBilling.ts:53`, `aa-prototype/src/apps/admin/reviewFlags.ts`

## DM-15

### Prepaid settings on the anaesthetist profile (RVG codes and groups)

**Kind:** NewEntity · **Size:** M

**Catalogue says.** Each anaesthetist ticks the RVG codes or whole groups (cosmetic, plastics, dental) that require prepayment; an admin can view and edit them on the anaesthetist's behalf. A Booking needs prepayment whenever ANY of its Procedures carries a code in that set (checked across the whole Booking). Prepaid is a property of the procedure choice, not the Contract; there is no Pre-paid Contract category.

**Prototype has.** No per-anaesthetist prepaid set and no code groups. Prepayment is a per-Procedure declaration: patientPaymentCategory 'selfFundedPrepayment' plus prepaymentDetail {full|split, depositAmount} (types.ts:416-430), and cardRequiresPrepayment reads those flags (selectors.ts:307). The 'Card-level pre-payment required flag is DERIVED from the card's procedures'.

**Impact.** New Anaesthetist.prepaidSettings (rvgCodes[], rvgGroups[]) and RvgGroup master (DM-11); prepayment-required becomes derived from Booking Procedures against that set instead of a hand-picked payment category. Anaesthetist profile screens (mobile and web) and the Admin anaesthetist editor gain a tick list. Depends on DM-09 (category removed) and DM-11 (groups). Feeds DM-16.

**Verification (upheld).** FT-06.1 and US-12.1.3 are Confirmed. OQ-25 Answered (no Pre-paid category).

**Catalogue:** [FT-06.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-06.1.md), [US-06.1.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.1.1.md), [US-06.1.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.1.2.md), [US-06.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.2.1.md), [US-12.1.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-12.1.3.md), [US-05.1.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.1.3.md), [OQ-25](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-25.md)

**Prototype:** `aa-prototype/src/domain/types.ts:416`, `aa-prototype/src/domain/types.ts:426`, `aa-prototype/src/store/selectors.ts:307`, `aa-prototype/src/domain/types.ts:141`

## DM-16

### Prepayment lifecycle: estimate, invoice at setup, tracking, remaining balance, no completion gate

**Kind:** ChangedLifecycle · **Size:** L

**Catalogue says.** Booking holds prepaymentRequired, prepaidAmount and prepaymentInvoiceId. The default amount is an automatic estimate: (base + time + a configurable 2 contingency modifier units) x the anaesthetist's own unit value, time from the estimated duration the surgeon's rooms give (admin records it on the Booking), always worded as an estimate via standard letter templates the admins maintain; or a deposit. The invoice is raised to the billable party at booking setup and tracked unpaid/part paid/paid with an alert as the date nears; status is re-checked after each receipt and whenever Procedures or the Contract change. After AUTHORISED: remaining balance = final - prepaid, invoiced if positive (also the top-up when surgery runs long), credited if negative (refund mechanism open, OQ-03).

**Prototype has.** Pre-payment is a separate 'prePayment' Invoice kind (types.ts:670) raised by the office (raisePreProcedureInvoice, prepaymentActions.ts:53) against selfFundedPrepayment Procedures, amount = the Procedure fee or the split deposit, no estimate calculation, no estimated duration, no letter template. Balance run nets it as a visible deduction line per prepaid Procedure (invoiceBuild.ts, prePaidByProcedure) and a full prepayment nets to $0. Completion is BLOCKED while a required prepayment is unpaid, liftable by an audited Card.prepaymentOverride (lifecycle.ts:93, PrepaymentOverride types.ts:352). Status is derived (prepaymentStatusFor, selectors.ts:372; none/required/outstanding/paid/overridden). No credit path when prepaid > final.

**Impact.** Booking gains prepayment {required (derived), amount, kind ESTIMATE|DEPOSIT, invoiceId, estimatedDurationMin}; new pure estimator in domain/billing (with a contingency-units setting) and a PrepaymentLetterTemplate master; the 'prePayment' Invoice kind is retained but is raised at booking setup, not only by the office button. The Card-completion gate (prepaymentUnpaid blocker) and its audited override have no catalogue support and are replaced by tracking and alerts: needs a ruling before removal (check Decisions log). Overpayment credit is open. Depends on DM-01, DM-09, DM-15, DM-18. Persisted seed shape changes. Remaining-balance invoice must link to the prepayment invoice (US-06.4.1).

**Verification (upheld).** Correction of emphasis: the catalogue does not say 'no gate' anywhere; it frames an unpaid prepayment as an alert so the admin follows up or the anaesthetist cancels (US-06.3.2), and the completeness list in US-03.6.1 omits prepayment. The prototype's hard completion gate plus audited override is a July 2026 ruling reaffirmed in three reviews (PROGRESS decisions log); the catalogue supersedes it, but this is the one place a user ruling is wise before deleting. EP-06 is Verify; US-06.4.2 is Open (OQ-03). US-06.3.3 (Retired) is merged into US-06.3.2.

**Catalogue:** [EP-06](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/EP-06.md), [FT-06.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-06.2.md), [FT-06.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-06.3.md), [FT-06.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-06.4.md), [US-06.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.2.2.md), [US-06.2.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.2.3.md), [US-06.2.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.2.4.md), [US-06.2.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.2.5.md), [US-06.3.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.3.1.md), [US-06.3.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.3.2.md), [US-06.3.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.3.4.md), [US-06.3.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.3.5.md), [US-06.3.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.3.6.md), [US-06.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.4.1.md), [US-06.4.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.4.2.md), [US-08.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.2.2.md), [OQ-03](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-03.md), [OQ-04](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-04.md), [OQ-38](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-38.md), [OQ-50](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-50.md)

**Prototype:** `aa-prototype/src/domain/types.ts:352`, `aa-prototype/src/domain/types.ts:426`, `aa-prototype/src/store/prepaymentActions.ts:53`, `aa-prototype/src/store/lifecycle.ts:93`, `aa-prototype/src/store/selectors.ts:372`, `aa-prototype/src/domain/billing/invoiceBuild.ts:456`

## DM-17

### Trust account and central prepayment refunds

**Kind:** NewEntity · **Size:** M

**Catalogue says.** Prepayment money to be returned (chiefly a cancelled Booking) goes back to AA's trust account and is refunded to the patient from it, including where the anaesthetist has already been paid; the refund is a credit in the ledger linked to the original prepayment invoice. The next anaesthetist starts a fresh prepayment at their own unit value; nothing is moved between anaesthetists. Payments out of the trust account are made from the system. When money enters and leaves, and how a paid anaesthetist is recovered (OQ-42), are open. This is a proposal to confirm with AA (OQ-40).

**Prototype has.** Nothing. cancelCard soft-cancels a Card (lifecycle.ts:363) with no reference to prepayment money; no refund, trust account or replacement-prepayment concept. The Xero/ledger shapes have no credit or outbound-refund records.

**Impact.** New TrustAccount balance and refund entries, wired to booking cancellation and to credit notes (DM-21). Only demonstrable once the ledger exists (DM-18). Status is Proposed with open questions, so schedule it late and keep it thin.

**Verification (upheld).** FT-06.5 and its stories are Proposed; OQ-40 and OQ-42 open. Nothing in the prototype touches prepayment money on cancel (lifecycle.ts:363).

**Catalogue:** [FT-06.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-06.5.md), [US-06.5.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.5.1.md), [US-06.5.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.5.2.md), [US-06.5.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.5.3.md), [US-02.5.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.5.3.md), [OQ-21](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-21.md), [OQ-40](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-40.md), [OQ-42](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-42.md)

**Prototype:** `aa-prototype/src/store/lifecycle.ts:363`, `aa-prototype/src/domain/types.ts:343`

## DM-18

### Internal ledger: promote BillingCase into linked receivable and payable records (Xero stays a mirror)

**Kind:** ChangedEntity · **Size:** L

**Catalogue says.** For every invoice the engine creates a linked receivable (from the billable party) and payable (to the anaesthetist) in its own ledger, linked to each other and to the Booking and Procedures. It tracks dollars in (receipts) and out (disbursements) as two separate states, keeps patient and anaesthetist history independent of Xero contact archiving, and is what anaesthetists and admins read balances from. Xero holds an ACCREC and a DRAFT ACCPAY created together and linked using the returned Xero IDs; ACCPAY is authorised for exactly the amount received; both carry the engine's unique invoice number (payable with a '-P' suffix) and internal reference; the ACCPAY is a buyer-created tax invoice with the anaesthetist as supplier and AA as agent (GST presentation OQ-29).

**Prototype has.** A de facto ledger already exists at invoice level: BillingCase (types.ts:697), one per invoice, with invoiceId, accRecId, accPayId and cumulative receivedAmount / authorisedAmount / disbursedAmount held as two independent axes (paid in, disbursed); status is a derived label. Apps read this 'billing mirror' (BillingCase plus invoices), never Xero, and receipts are an append-only idempotent set (BillingReceipt, types.ts:742). The Xero simulation (XeroAccRec, XeroAccPay, PaymentIn, Disbursement; types.ts:769-815) mirrors it. What is missing: distinct receivable and payable records with their own numbers (no '-P' payable number), links from each to Booking and Procedures, buyer-created tax invoice presentation with the anaesthetist as supplier, credit legs, AA-fee items, and patient-level history as first-class ledger data (today it is joined through Cards). Contacts use the hidden internal ID (xeroHandoff.ts).

**Impact.** Foundation for the money side, but an evolution, not a rewrite: promote BillingCase into a LedgerPair (receivable leg and payable leg, each with its own number, amount, received / disbursed entries and Xero mirror IDs, plus booking and procedure links). Xero slice types stay as simulated mirrors. Selectors, payment and payables actions, GST report source, Accounts screens and the Demo Xero simulator re-point to the pair. Must precede DM-19, DM-20, DM-21, DM-22 and DM-17. Seed and PERSIST_VERSION change.

**Verification (corrected).** Draft said 'No ledger'. That overstates the gap: BillingCase already holds independent cumulative received / authorised / disbursed amounts per invoice, apps read this mirror rather than Xero (selectors.ts:272, 662), and payments are idempotent. The real gaps are: separate receivable and payable records with their own numbers and links to Booking and Procedures, patient history that survives Xero contact archiving as first-class ledger data, buyer-created ACCPAY presentation, credit legs, and AA-fee items. Size lowered from XL to L; the ledger can grow out of BillingCase rather than replace it.

**Catalogue:** [EP-08](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/EP-08.md), [FT-08.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-08.3.md), [US-08.3.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.3.1.md), [US-08.3.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.3.2.md), [US-08.3.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.3.3.md), [US-08.3.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.3.4.md), [US-08.4.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.4.3.md), [US-08.4.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.4.5.md), [EP-09](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/EP-09.md), [US-09.1.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-09.1.1.md), [US-09.1.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-09.1.4.md), [US-10.1.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-10.1.2.md), [US-10.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-10.2.1.md), [US-10.2.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-10.2.3.md), [OQ-29](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-29.md)

**Prototype:** `aa-prototype/src/domain/types.ts:697`, `aa-prototype/src/domain/types.ts:742`, `aa-prototype/src/domain/types.ts:769`, `aa-prototype/src/store/appStore.ts:43`, `aa-prototype/src/store/xeroHandoff.ts:153`, `aa-prototype/src/store/paymentActions.ts:78`, `aa-prototype/src/store/payablesActions.ts:146`

## DM-19

### Derived ledger positions: whole ledger, per anaesthetist, per patient (in balance or out)

**Kind:** NewRelationship · **Size:** M

**Catalogue says.** Admins see the ledger's position at three scopes: whole ledger (receivables outstanding, receipts held, payables due, amounts disbursed, and any imbalance), a single anaesthetist (what is owing, what they owe; the same view scoped) and a single patient (all invoices across every anaesthetist with paid/part paid/unpaid). Anaesthetists see a flat list of their own unpaid payables (~100 rows) and a date-ranged summary of received amounts with the GST component aligned to their own GST period, both from the ledger, plus a dashboard combining calendar, financial position and locum availability.

**Prototype has.** Balance figures are derived from BillingCase and the Xero mirror (selectors.ts: outstanding ACCPAY list at ~662, caseOutstandingAmount at 272, GST report from BillingReceipt) but there is no whole-ledger, in-balance/out-of-balance view and no patient-scoped ledger screen. The anaesthetist dashboard is partly seeded demo figures (seed/anaesthetistDashboard.ts, domain/seed/index.ts dashboards) rather than derived. Patient outstanding is only a boolean 'has unpaid prior episode' (selectors.ts:285).

**Impact.** Pure derived selectors over the DM-18 ledger (no new stored entity): balance totals with an imbalance figure, per-anaesthetist and per-patient rollups, patient invoice list. Retire the seeded dashboard figures where a derivation exists. Admin needs new views; web dashboard and Accounts screen re-point. Depends on DM-18.

**Verification (upheld).** US-13.2.3 (Retired) is merged into US-13.2.1 (Confirmed); US-13.2.2 Confirmed. Aging buckets and GST activity already exist per anaesthetist (selectors.ts:676-700), so the new work is the whole-ledger imbalance view and the patient-scoped list.

**Catalogue:** [FT-13.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-13.2.md), [US-13.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.2.1.md), [US-13.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.2.2.md), [US-08.3.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.3.5.md), [US-11.3.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.3.1.md), [FT-12.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-12.2.md), [US-12.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-12.2.1.md), [US-12.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-12.2.2.md), [US-12.2.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-12.2.3.md)

**Prototype:** `aa-prototype/src/store/selectors.ts:272`, `aa-prototype/src/store/selectors.ts:662`, `aa-prototype/src/domain/seed/anaesthetistDashboard.ts`, `aa-prototype/src/apps/web/screens/AccountsScreen.tsx`

## DM-20

### Additional invoice on a Procedure replaces the post-op addendum Card

**Kind:** ChangedEntity · **Size:** L

**Catalogue says.** For billing lines dated after a List is invoiced (ward review, nerve catheter, pain consult) and for splitting a combined fixed-price Procedure, an admin creates an additional invoice attached to a Procedure and a Contract on it, from a button in the Admin App, with free lines (time units, modifiers, fixed amount, billable party). No extra approval; audited. It links and is traceable to the original Procedure and invoice (the original shows its additional invoices), gets its own unique number, ledger pair, Xero pair and anaesthetist payable, and never unlocks the original. The balance after a prepayment is NOT an additional invoice. Pricing rules for its lines are OQ-45; how a combined Procedure is modelled is OQ-53.

**Prototype has.** Post-op addendum: a NEW Card with cardType 'postOpAddendum' and addendumOfCardId (types.ts:388-389) created by addPostOpAddendum (cardActions.ts:270) on the original anaesthetist's free DRAFT List for today, running its own capture, submit, authorise and bill cycle; the original stays locked. It is anaesthetist-driven through the normal List workflow, not an admin button, needs a free session, and produces an ordinary invoice with no link recorded on the Invoice. BillingLine carries no service date of its own (types.ts:518). No 'split a combined Procedure' concept.

**Impact.** Remove Card.cardType/addendumOfCardId and addPostOpAddendum; add Invoice kind 'additional' with procedureId, originalInvoiceId and its own ledger pair (DM-18); BillingLine gains an optional service date. New admin action and Procedure-level button, and the mobile 'add post-op charge' entry becomes 'tell the office' (or is removed). Depends on DM-18 and DM-23. Split of a combined Procedure depends on OQ-53.

**Verification (upheld).** FT-08.6 is Verify; OQ-24 Answered; OQ-45 and OQ-53 open. addPostOpAddendum confirmed (cardActions.ts:270).

**Catalogue:** [FT-08.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-08.6.md), [US-08.6.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.6.1.md), [US-08.6.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.6.3.md), [US-08.6.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.6.4.md), [US-03.3.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.3.6.md), [US-06.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.4.1.md), [OQ-24](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-24.md), [OQ-45](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-45.md), [OQ-51](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-51.md), [OQ-53](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-53.md)

**Prototype:** `aa-prototype/src/domain/types.ts:388`, `aa-prototype/src/store/cardActions.ts:270`, `aa-prototype/src/domain/types.ts:518`, `aa-prototype/src/domain/types.ts:662`

## DM-21

### Wrong invoice is credited in full, then rebilled (credit note, payable reversal, new invoice)

**Kind:** NewLifecycle · **Size:** L

**Catalogue says.** An issued invoice is never edited, retracted or partly adjusted. An admin credits it in full (credit note against the receivable for the whole amount, reversal of the linked payable, Xero ACCREC and ACCPAY reversed and recreated together) and bills a new corrected invoice with its own number; credit note and new invoice each link to the original. The trail reads debit, credit, contra, new debit. The credit note must reach the billable party (Xero does not send them). Recovering money once the anaesthetist has been paid is open (OQ-42). Every step is audited.

**Prototype has.** No credit note, reversal or rebill. retryBillingCase (billingRun.ts:285) re-runs a FAILED billing case only; XeroAccRec has a 'voided' status (types.ts:777) that nothing drives; the archive of an invoice is not modelled. Correction after invoicing is unsupported except via the post-op addendum.

**Impact.** New CreditNote record (originalInvoiceId, amount, reason, issuedBy) with ledger reversal legs, Invoice.creditedBy/rebilledAs links, an admin action that credits then opens a rebill from the original's Booking data, and a simulated Xero credit-note path. Depends on DM-18 and DM-23; recovery of an already-disbursed payable is undecided so model the trail only.

**Verification (upheld).** US-08.6.2 is Verify. XeroAccRec.status 'voided' is only read for display (DemoXero.tsx:647), nothing sets it.

**Catalogue:** [US-08.6.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.6.2.md), [FT-08.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-08.6.md), [US-06.5.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.5.2.md), [OQ-28](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-28.md), [OQ-36](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-36.md), [OQ-42](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-42.md)

**Prototype:** `aa-prototype/src/domain/types.ts:777`, `aa-prototype/src/store/billingRun.ts:285`, `aa-prototype/src/domain/types.ts:662`

## DM-22

### AA fee is a separate invoice from AA to the anaesthetist (not a deduction on the payable)

**Kind:** NewEntity · **Size:** M

**Catalogue says.** AA charges each anaesthetist a fee on its own invoice from AA to the anaesthetist, tracked in the ledger and distinct from any procedure's receivable and payable; the anaesthetist sees these invoices and their payment status in their app. Basis and frequency are open (OQ-02).

**Prototype has.** An illustrative fixed 5% service fee (AA_SERVICE_FEE_RATE, agencyFee.ts:7) is deducted from each ACCPAY at handoff: XeroAccPay stores grossAmount, serviceFeeRate, serviceFeeAmount and net amountPayable (types.ts:780; xeroHandoff.ts:234). There is no AA fee invoice entity, no AA-to-anaesthetist receivable and no anaesthetist-facing view of it. The module comment says 'the RFP does not state AA's fee model'.

**Impact.** Change the payable to the gross amount (anaesthetist owed the full procedure amount) and add AaFeeInvoice (anaesthetistId, period or basis, amount, status) with its own ledger receivable from the anaesthetist; web app shows it. Fee basis is open, so keep a demo-labelled basis. Depends on DM-18. Changes ACCPAY amounts everywhere they are shown (Demo Xero, Accounts, payables run).

**Verification (upheld).** FT-10.3 Confirmed; OQ-02 open. Fee is deducted from the ACCPAY (xeroHandoff.ts:234, agencyFee.ts:7), confirmed.

**Catalogue:** [FT-10.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-10.3.md), [US-10.3.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-10.3.1.md), [US-10.3.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-10.3.2.md), [EP-10](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/EP-10.md), [OQ-02](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-02.md)

**Prototype:** `aa-prototype/src/domain/billing/agencyFee.ts:7`, `aa-prototype/src/domain/types.ts:780`, `aa-prototype/src/store/xeroHandoff.ts:234`

## DM-23

### Invoice entity: numbering, supplier/agent presentation, email, delivery and lineage

**Kind:** ChangedEntity · **Size:** M

**Catalogue says.** Every invoice has a unique number (the remittance-matching key; payable carries the receivable's number plus '-P'), is presented in the anaesthetist's name with their GST number and AA as agent, uses a contract-holder or patient layout and a delivery method from the Contract (email or portal upload), is sent to the invoice email on the Booking, prices are held GST-exclusive with inclusive derived, and any past invoice can be regenerated exactly from locked data. Invoice kinds needed: standard, prepayment, remaining balance, additional, credit note and AA fee.

**Prototype has.** Invoice (types.ts:662): invoiceNumber, caseReference, cardId, counterparty, layout, kind 'standard' | 'prePayment', subtotal/gst/total, raisedAtISO, emailedAtISO. No invoice email field, delivery method, supplier/agent fields, procedure link, original-invoice link or credit/additional kinds. GST is computed at the standard 15% on ex-GST lines (invoiceBuild.ts:GST_RATE). Invoice layout is derived from counterparty kind (layoutFor, invoiceBuild.ts:216) not from the Contract.

**Impact.** Add recipientEmail, deliveryMethod, supplier (anaesthetist with GST number), agent, procedureIds, originalInvoiceId, and widen kind. Invoice document component and email step change. Layout and delivery become Contract-driven. Depends on DM-06 and DM-10; DM-20, DM-21, DM-22 add kinds.

**Verification (upheld).** US-08.4.x Proposed or Confirmed; OQ-29 open. Layout derived from counterparty kind (invoiceBuild.ts:216) confirmed. Remaining-balance invoices must also link to the prepayment invoice (US-06.4.1).

**Catalogue:** [FT-08.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-08.4.md), [US-08.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.4.1.md), [US-08.4.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.4.2.md), [US-08.4.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.4.3.md), [US-08.4.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.4.4.md), [US-08.4.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.4.5.md), [US-04.2.8](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.8.md), [US-05.2.7](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.2.7.md), [OQ-29](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-29.md)

**Prototype:** `aa-prototype/src/domain/types.ts:662`, `aa-prototype/src/domain/billing/invoiceBuild.ts:216`, `aa-prototype/src/apps/admin/screens/InvoiceDocument.tsx`, `aa-prototype/src/store/billingRun.ts:398`

## DM-24

### Invoice grouping by billable party and how one Procedure splits between two payers

**Kind:** ChangedRelationship · **Size:** M

**Catalogue says.** One invoice per distinct billable party within a Booking (one party = one invoice; different parties = several). A Contract may declare a covered amount or covered percentage: the holder or insurer is invoiced for the covered portion and the patient (billable party) for the gap, as two invoices. The mechanism is open because one-Contract-per-Procedure does not naturally express partial cover (OQ-23). A combined fixed-price Procedure is split for a party by additional invoices (DM-20).

**Prototype has.** Grouping is already one invoice per Card per distinct counterparty (invoiceBuild.ts:264). Splitting one Procedure between funders uses BillingLine.funderOverride (types.ts:518-530) with a to-the-cent conservation rule (setProcedureFunderAllocation, billingLineActions.ts:218), an office-set per-line allocation rather than a Contract-declared covered amount/percent.

**Impact.** Grouping key changes from procedure-derived counterparty to the Booking's billable party (DM-10). funderOverride/conservation logic can stay as the demo mechanism until OQ-23 is settled, or be replaced by Contract.coveredAmount/coveredPercent generating a second invoice. Low urgency; leave until DM-10 and DM-18 land.

**Verification (upheld).** One invoice per Card per counterparty confirmed (invoiceBuild.ts:264). FT-08.2 Proposed; US-08.2.1 Verify; OQ-23 open.

**Catalogue:** [FT-08.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-08.2.md), [US-08.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.2.1.md), [US-08.2.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.2.3.md), [US-08.6.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.6.4.md), [US-05.3.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.3.5.md), [OQ-23](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-23.md)

**Prototype:** `aa-prototype/src/domain/billing/invoiceBuild.ts:264`, `aa-prototype/src/domain/types.ts:518`, `aa-prototype/src/store/billingLineActions.ts:218`

## DM-25

### Patient: NHI required with a missing-NHI problem list; configurable unpaid-invoice alert

**Kind:** RuleChange · **Size:** M

**Catalogue says.** One patient record per NHI (dual format validated; hidden internal ID for billing and ledger; NHI never to Xero), and the NHI is required. A patient without one is a visible exception on a problem list (showing patient, List and surgeon's rooms) until the NHI is added, then matched to the single record with no duplicate; whether the Booking may exist provisionally or is blocked is open (OQ-49). The anaesthetist sees the NHI (or 'NHI missing') on each Booking. Admins see all of a patient's invoices across anaesthetists and are alerted when a patient with an invoice unpaid past a configurable threshold (90 days to start; what it counts from, OQ-41) is booked or matched again.

**Prototype has.** Patient.nhi is OPTIONAL and provisional records are created without one (types.ts:105; upsertPatient 'createdProvisional', intake.ts:52-135); NHI is validated for both formats and dedupes on match. No problem list. The NHI is already shown on the mobile List and Card detail (ListDetailScreen.tsx:200, CardDetailBody.tsx:569) with an nhiBadge, but not as an explicit 'NHI missing' state. The unpaid alert is a boolean 'any unpaid prior episode' (patientHasOutstandingPriorEpisode, selectors.ts:285) with no age threshold and no setting. Patient master, hidden internal ID and Xero ContactNumber handling already match.

**Impact.** Mostly rules and views, small model change: an app settings record for the alert threshold (DemoSettings is the wrong home), invoice age computed from the ledger (DM-18) and a derived 'missing NHI' exception set. The provisional-vs-blocked decision (OQ-49) determines whether the current 'createdProvisional' path stays. Follow-up actions on unpaid invoices (US-11.3.3) need a small FollowUp record.

**Verification (upheld).** Patient.nhi is optional (types.ts:105) and US-11.1.4 is Open (OQ-49). US-11.1.3 (Deduplicate on NHI, Retired) is merged into US-11.1.1, no gap. patientHasOutstandingPriorEpisode is boolean only (selectors.ts:285).

**Catalogue:** [FT-11.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-11.1.md), [US-11.1.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.1.1.md), [US-11.1.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.1.2.md), [US-11.1.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.1.4.md), [US-11.1.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.1.5.md), [US-03.1.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.1.5.md), [FT-11.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-11.3.md), [US-11.3.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.3.1.md), [US-11.3.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.3.2.md), [US-11.3.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.3.3.md), [OQ-41](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-41.md), [OQ-49](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-49.md)

**Prototype:** `aa-prototype/src/domain/types.ts:103`, `aa-prototype/src/store/intake.ts:52`, `aa-prototype/src/store/selectors.ts:285`

## DM-26

### Surgeon profile, surgeons' rooms, blacklist and hospital contact email

**Kind:** NewEntity · **Size:** L

**Catalogue says.** Surgeons and surgeons' rooms are master data. A room holds a name, contact email and phone and the surgeons who belong to it (each surgeon belongs to a room; one room per surgeon unless AA says otherwise). A surgeon profile holds the NZ medical registration number, HPI number, CPN number (what CPN stands for is OQ-52) and the blacklist. The blacklist is anaesthetist and surgeon pairings (optional reason) kept by admin staff; it yields a soft warning, never a block, when a List or Draft List is assigned and when an anaesthetist hands over their own List, and blacklisted options are grouped separately in the pickers. Hospitals hold a contact email for booking updates. Insurers and hospitals are reference data.

**Prototype has.** Surgeon is only { id, name, specialty? } (types.ts:160); Hospital is { id, name } (types.ts:155). No room entity, no registration/HPI/CPN, no blacklist, no contact emails. The Anaesthetist master already carries hpiId (types.ts:149).

**Impact.** New masters (SurgeonRoom, extended Surgeon, BlacklistEntry) and Hospital.contactEmail; seed with rooms and identifiers; Admin master-data editors and a surgeon profile page; blacklist-aware pickers in List/Draft List assignment and swap. Independent of most other work but required by DM-03 and DM-05 warnings, and the mailto draft in DM-29. Also add a Surgeon Group (with member surgeons) so a Surgeon Group Contract holder (DM-06) has something to point at.

**Verification (upheld).** Added detail: US-13.4.1 lists 'surgeon groups' as master data; the prototype has no surgeon group with member surgeons (only ContractHolderOrganisation). Room, identifiers and blacklist all Proposed; OQ-43 and OQ-52 open.

**Catalogue:** [FT-13.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-13.6.md), [US-13.6.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.6.1.md), [US-13.6.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.6.2.md), [US-13.6.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.6.3.md), [US-01.3.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.3.5.md), [US-01.4.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.4.5.md), [US-13.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.4.1.md), [US-02.3.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.3.3.md), [OQ-43](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-43.md), [OQ-52](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-52.md)

**Prototype:** `aa-prototype/src/domain/types.ts:155`, `aa-prototype/src/domain/types.ts:160`, `aa-prototype/src/domain/seed/cast.ts`, `aa-prototype/src/apps/admin/screens/MasterData.tsx`

## DM-27

### Anaesthetist profile: bank details, prepaid settings, admin-editable

**Kind:** ChangedEntity · **Size:** S

**Catalogue says.** The anaesthetist master record holds contact details, registration number, HPI number, bank account details (held in the system, not Xero only; used for the payables run), dollar value per unit, GST period and prepaid RVG codes/groups; admins can maintain the prepaid selection on their behalf.

**Prototype has.** Anaesthetist (types.ts:141): registrationNumber, name, phone, email, unitValue, gstPeriod, hpiId, active. No bank account, no prepaid set. editAnaesthetist/addAnaesthetist exist (mastersActions.ts:185, 241).

**Impact.** Additive fields (bankAccount, prepaidSettings via DM-15) and editor UI on Admin and anaesthetist profile screens. Bank details are display-only in the demo (payables run reads them). Small, depends on DM-15.

**Verification (upheld).** US-12.1.5 (Retired) is merged into US-12.1.4 (Verify); OQ-14 Answered (bank details in the system).

**Catalogue:** [FT-12.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-12.1.md), [US-12.1.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-12.1.1.md), [US-12.1.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-12.1.2.md), [US-12.1.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-12.1.3.md), [US-12.1.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-12.1.4.md), [US-06.1.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.1.2.md), [OQ-14](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-14.md)

**Prototype:** `aa-prototype/src/domain/types.ts:141`, `aa-prototype/src/store/mastersActions.ts:185`, `aa-prototype/src/store/mastersActions.ts:241`

## DM-28

### Intake model: import rows, matching decisions, unmatched queue and per-hospital sync state

**Kind:** ChangedEntity · **Size:** L

**Catalogue says.** The priority pathway is the hospital download (imported file, or an automatic sync from St George's and Southern Cross on a schedule, when the matching screen opens and by a sync button, with a last-synced time and failures shown). Every imported row gets an admin decision: match to an existing List and Booking (showing field-level differences first), create a Booking on an existing List, create a List in a Slot or a Draft List, or reject; rows that cannot be matched stay in an unmatched queue. Sync only brings rows in; nothing is applied until an admin decides. The surgeon PDF is second (read, correct fields such as an invalid NHI, then ingest). HL7 v2, FHIR R4, near real time, reliability/monitoring and further hospital feeds with automatic matching are Future Work, except NHI lookup via the Digital Services Hub (in scope).

**Prototype has.** An HL7/FHIR-centred integration model: IntegrationFeed per hospital with a field mapping (types.ts:822), IntegrationMessage log with statuses pending/processed/retrying/deadLetter/manualIntervention/duplicate and MSH-10 dedupe (types.ts:842), and a simulator that creates or updates Cards automatically on DRAFT Lists (integrationActions.ts:306, monitor screen IntegrationMonitorScreen). ingestPdfRow ingests a corrected PDF row into a List (integrationActions.ts:431). Three feeds (St George's HL7, Christchurch Public HL7, Southern Cross FHIR; domain/integrations/feeds.ts). No import-row record, no admin match/create/reject decision, no unmatched queue, no last-synced state, no field-difference view, no Draft List target.

**Impact.** New ImportBatch/ImportRow (hospital, source, raw fields, proposed match, decision MATCH|CREATE_BOOKING|CREATE_LIST|CREATE_DRAFT|REJECT|UNMATCHED, decidedBy) and a per-hospital SyncState (lastSyncedAt, lastError) for St George's and Southern Cross only. The matching screen must stop the automatic apply that the current simulator does. The HL7/FHIR simulator, message log and retry/dead-letter monitor are Future Work: leave them as they are behind the Demo panel (a demo-only surface, not extended, not planned). The unmatched queue and Draft List creation depend on DM-03 and DM-01. Sync button and last-synced time are UI plus a store action.

**Verification (corrected).** Draft cited FT-14.1, FT-14.2 and FT-14.5 (status Future) and US-14.6.1 and US-14.6.2 (Future Work lane) as catalogue sources. Removed. The prototype's HL7/FHIR message model, feeds, MSH-10 dedupe and retry/dead-letter monitor are Future Work in the catalogue, so they are out of the plan (leave as a demo-only surface, not extended). The in-scope delta is the manual matching model (FT-02.1: US-02.1.1 to .5), which is absent, and the rule that nothing applies without an admin decision: the prototype's simulator creates and updates Cards automatically (integrationActions.ts:306), which contradicts US-02.1.5 ('nothing is applied until an admin decides'). US-14.4.1 (NHI lookup) is in scope and the prototype already simulates lookupNhi. FT-02.1 and FT-02.2 are Verify; US-02.2.2 (Retired) merged into US-02.2.1.

**Catalogue:** [FT-02.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-02.1.md), [FT-02.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-02.2.md), [US-02.1.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.1.1.md), [US-02.1.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.1.2.md), [US-02.1.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.1.3.md), [US-02.1.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.1.4.md), [US-02.1.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.1.5.md), [US-02.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.2.1.md), [US-02.3.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.3.1.md), [US-14.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-14.4.1.md), [OQ-13](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-13.md), [OQ-34](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-34.md)

**Prototype:** `aa-prototype/src/domain/types.ts:822`, `aa-prototype/src/domain/types.ts:842`, `aa-prototype/src/store/integrationActions.ts:306`, `aa-prototype/src/store/integrationActions.ts:431`, `aa-prototype/src/domain/integrations/feeds.ts:24`, `aa-prototype/src/apps/admin/screens/IntegrationMonitorScreen.tsx`

## DM-29

### Explicit-save change sets, booking update email draft and concurrent-edit detection

**Kind:** NewEntity · **Size:** M

**Catalogue says.** An admin edits a Booking and saves explicitly; the system holds what changed since the last save (field, before, after, who, when) in the append-only change history, and can draft a hospital update email via a mailto link (about 2,000 characters, subject, boilerplate, change list, To address from the hospital or surgeons' room contact email); the system sends and records nothing. Concurrent edits from different sources are caught at save by optimistic concurrency with a row version, merging non-conflicting fields and escalating same-field contention (which changes trigger the email and to whom is OQ-46).

**Prototype has.** Every field edit commits immediately through mutate() and is audited per field (editCard/editProcedure, lifecycle.ts:415/445); audit is append-only with before/after (types.ts:645). No save boundary, no change set entity, no row version or conflict detection, no mailto draft, no contact emails to address it to.

**Impact.** Admin-side editing becomes a draft-then-save form that emits one ChangeSet (grouped audit entries) and offers the mailto draft (needs DM-26 contact emails). Booking gains a version counter only if concurrent-edit detection is shown; that (US-02.5.6, technical, OQ-07 Answered) is best a Demo-panel button that simulates a same-field clash, not a model change. The anaesthetist mobile flows keep immediate saves. Medium UI rework of the Admin Booking editor.

**Verification (corrected).** Split by weight. In scope and structural: explicit save with a saved change set (US-02.3.2) and the mailto draft (US-02.3.3), both Proposed. US-02.5.6 (concurrent edits) is a technical mechanism from the RFP response (row version, OQ-07 Answered): mark it a lightweight or demo-button item, not a model change. Contact emails come from DM-26.

**Catalogue:** [US-02.3.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.3.2.md), [US-02.3.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.3.3.md), [US-02.5.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.5.5.md), [US-02.5.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.5.6.md), [US-13.5.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.5.2.md), [OQ-07](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-07.md), [OQ-46](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-46.md)

**Prototype:** `aa-prototype/src/domain/types.ts:645`, `aa-prototype/src/store/lifecycle.ts:415`, `aa-prototype/src/store/mutate.ts`, `aa-prototype/src/shared/card/HistoryTimeline.tsx`

## DM-30

### List visibility after invoicing: unbilled to billed, not vanished

**Kind:** ChangedLifecycle · **Size:** S

**Catalogue says.** After AUTHORISED the anaesthetist sees the List as 'completed, unbilled' while under review; once its invoices are generated it leaves the to-do view and reappears as lines in outstanding balances. AA (2026-09-29) said a List should move from unbilled to billed and processed, not simply vanish. The trigger event is open (OQ-31).

**Prototype has.** List.billedAtISO is stamped at the end of the List's billing run and removes the List from the anaesthetist's forward views (types.ts:323; billingRun.ts header, 'Lists vanish ... at invoice generation').

**Impact.** Small: replace the vanish rule with a billing status on the List (UNBILLED, BILLED, with the invoices attached) and a 'billed' section on mobile/web. Depends on DM-02 (List identity) and DM-18. Open question, so decide the visible behaviour with AA before building.

**Verification (upheld).** US-07.4.1 is Open (OQ-31). Prototype stamps List.billedAtISO and hides the List (types.ts:323). AA said 2026-09-29 the List should move from unbilled to billed, not vanish.

**Catalogue:** [FT-07.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-07.4.md), [US-07.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-07.2.1.md), [US-07.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-07.4.1.md), [OQ-31](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-31.md)

**Prototype:** `aa-prototype/src/domain/types.ts:323`, `aa-prototype/src/store/billingRun.ts:68`

## DM-31

### Contract selection carries an approval state (anaesthetist change flagged, office approves at review)

**Kind:** ChangedLifecycle · **Size:** S

**Catalogue says.** Admin normally sets the Contract at booking setup; the anaesthetist may change it freely until they submit; every change is audited and flagged for office review; at the SUBMITTED review the admin approves the selections or corrects them (also checking references, addresses, invoice emails and that no child is the billable party). The engine reads the locked Contract only, never resolving a route itself.

**Prototype has.** Review flags are computed views (apps/admin/reviewFlags.ts) over card/procedure data; the Procedure holds governingContractId with no record of who set or changed it or whether the office approved it. Mobile shows billing context read-only; the full billing-setup editor (EditBillingSetupSheet) is the office's, so the anaesthetist cannot change the Contract at all.

**Impact.** Small additive record on the Procedure (contractSetBy, changedByAnaesthetistAt, approvedByOfficeAt) feeding the review queue and the AUTHORISED lock (DM-07). Anaesthetist app gains a Contract picker. Depends on DM-09.

**Verification (upheld).** FT-03.4 Confirmed, US-07.2.2 Confirmed, OQ-26 Answered. Contract choice in the prototype is office-only (OfficeBillingSetup, EditBillingSetupSheet); no approval record exists.

**Catalogue:** [FT-03.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-03.4.md), [US-03.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.4.1.md), [US-04.3.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.3.4.md), [US-07.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-07.2.2.md), [OQ-26](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-26.md)

**Prototype:** `aa-prototype/src/apps/admin/reviewFlags.ts`, `aa-prototype/src/domain/types.ts:454`, `aa-prototype/src/shared/card/OfficeBillingSetup.tsx`

## DM-32

### Reference data: master public-holiday calendar, controlled-spreadsheet load, editable masters

**Kind:** ChangedEntity · **Size:** S

**Catalogue says.** Admins maintain hospitals (with contact email), surgeons and groups, rooms, insurers, anaesthetists, Slot statuses, Permanent Lists, the master public-holiday calendar plus each hospital's own calendar, RVG codes and groups, modifier codes and Contracts, all referenced by identity (change once, reflected everywhere) with the single exception of the billing snapshot. Go-live is a clean cut: reference data is loaded from AA-owned controlled spreadsheets (hospitals, surgeons and rooms, procedures with RVG mapping and base units, modifiers, fixed fee schedules and Contract overrides), with rows failing validation reported and not loaded; Solutions Plus supplies operation names only.

**Prototype has.** HospitalHoliday per hospital (types.ts:602) and Permanent Lists (types.ts:575) exist with add/edit actions (mastersActions.ts:320, 398, 443). No master (statutory) holiday calendar, no bulk/spreadsheet load, and several listed masters do not exist yet (rooms, procedure master, RVG groups, prepaid settings, fee schedule lines).

**Impact.** Add a statutory holiday master and (if it can be demoed) a validated import step in the Admin master-data area; the master-data screen grows with each new master from DM-06, DM-08, DM-11, DM-26. Cutover loading is not a prototype feature, so at most a demo button. Low risk, follows the other master-data deltas.

**Verification (upheld).** Master (public holiday) calendar is named in US-13.4.1 and absent in the prototype (searched src for a statutory or public-holiday master: none). US-13.4.2/.3 are Proposed. Loading is a cutover activity: at most a demo import button.

**Catalogue:** [US-13.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.4.1.md), [US-13.4.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.4.2.md), [US-13.4.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.4.3.md), [US-01.5.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.5.1.md), [US-01.3.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.3.2.md), [US-15.0.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-15.0.3.md)

**Prototype:** `aa-prototype/src/domain/types.ts:602`, `aa-prototype/src/domain/types.ts:575`, `aa-prototype/src/store/mastersActions.ts:320`, `aa-prototype/src/apps/admin/screens/MasterData.tsx`

## DM-34

### Booking source, List-level attachments and Copy a Booking (copy is not the additional-procedure mechanism)

**Kind:** ChangedEntity · **Size:** M

**Catalogue says.** The anaesthetist can attach files or photos to a Booking or to a whole List. An anaesthetist ad hoc Booking can be entered manually or by photographing the physical card, from which the system pre-fills the Booking for confirmation. Copy a Booking copies only the skeleton (patient, List, references), never procedure details. Additional Procedures belong to one Booking (FT-03.2). Booking source is recorded for every entry route.

**Prototype has.** CardAttachment lives on Card only (types.ts:358, 393). Photo capture already exists as a simulation (PhotoCaptureFlow.tsx, canned sampleExtractions.ts feeding a pre-filled ManualCardForm). copyCard creates a NEW Card in the same List whose one Procedure is isAdditional from the start and inherits billing route, insurer, payer, payment category and contract from the source (cardActions.ts:179-236): Copy is the RFP's additional-procedure mechanism. No stored Booking source (only correlationRef and the audit source), no List-level attachments.

**Impact.** Add List.attachments and Booking.source. Redefine copy: a skeleton Booking (patient, List, references) with a fresh primary Procedure, no inherited contract, payer or category. Additional procedures are added inside the Booking (addProcedure exists) and priced by the DM-13 rule. Folds into the DM-01 rename pass; the copy change interacts with DM-13, DM-09 and seed cards that use copiedFromCardId.

**Verification (corrected).** Draft said 'no photo-read pre-fill'. That is wrong: PhotoCaptureFlow.tsx plus sampleExtractions.ts already simulate photo capture with a pre-filled ManualCardForm (canned, demo-badged). US-02.4.2 (Retired) is merged into US-02.4.1, so the requirement is met by the simulation. Real remaining deltas: attachments at List level, a stored Booking source, and the Copy semantics. Bigger point found: the prototype's Copy is the additional-procedure mechanism (a NEW Card with an isAdditional Procedure that inherits billing route, contract and payer, cardActions.ts:179-236). The catalogue makes additional Procedures part of ONE Booking (FT-03.2) and Copy a Booking (US-02.4.3) copies only patient, List and references, never procedure details. So a copy becomes an independent Booking with its own primary Procedure, and multi-procedure billing lives inside one Booking (addProcedure already exists, cardActions.ts:394). Size raised from S to M.

**Catalogue:** [US-03.1.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.1.3.md), [US-02.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.4.1.md), [US-02.4.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.4.3.md), [FT-02.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-02.4.md)

**Prototype:** `aa-prototype/src/shared/flows/PhotoCaptureFlow.tsx`, `aa-prototype/src/shared/flows/sampleExtractions.ts`, `aa-prototype/src/domain/types.ts:358`, `aa-prototype/src/store/cardActions.ts:179`, `aa-prototype/src/shared/flows/ManualCardForm.tsx`

## DM-35

### Patient insurer and funding source are captured on the Booking and drive the Contract picker

**Kind:** ChangedRelationship · **Size:** S

**Catalogue says.** The filtered Contract list is narrowed by the List's hospital, the surgeon, the patient's insurer or funding source (private, SXAP, HNZ, ACC) and the RVG code (US-04.3.2, Contract scope in domain-model.md). The office review checks 'whether insurance needs adding, and the insurer details already there' (US-07.2.2). A Contract can require an insurer member number or claim reference per Booking (US-04.2.7). ACC is a funding source and a Hospital or holder Contract with ACC pricing, invisible to the engine (FT-05.5). Where the insurer does not accept direct claims, the patient is invoiced and forwards it (US-11.4.2). The catalogue does not say where the patient's insurer or funding source is held; the Booking is the natural home.

**Prototype has.** Procedure.insurerId, used as the payer only on the 'insurer' billing route and informational on the hospital route (types.ts:444-470), and Procedure.accRelated, an informational boolean for ACC (types.ts:476). No funding-source value, no insurer on the Booking or Patient, and neither field feeds any Contract selection, because the Contract is chosen from the route (invoiceBuild.ts:114).

**Impact.** Add Booking.insurerId and Booking.fundingSource (private, SXAP, HNZ, ACC, other) plus the per-Booking member number and claim reference (DM-14). They become inputs to the filtered Contract picker (DM-09) and replace Procedure.insurerId and accRelated. Depends on DM-01 and DM-06; feeds DM-09 and DM-14. The prototype's ACC review advisory becomes a Contract-filter concern. Where the value lives (Patient or Booking) is not settled in the catalogue; raise it as a question.

**Verification (added).** Missed by the author. Catalogue refs confirmed present and in scope (FT-05.5 and US-05.5.1 Proposed; US-04.3.2, US-04.2.7, US-07.2.2 Confirmed or Proposed). Prototype claim checked against types.ts and invoiceBuild.ts.

**Catalogue:** [US-04.3.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.3.2.md), [US-04.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.1.md), [US-04.2.7](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.7.md), [US-07.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-07.2.2.md), [US-11.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.4.1.md), [US-11.4.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.4.2.md), [FT-05.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-05.5.md), [US-05.5.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.5.1.md)

**Prototype:** `aa-prototype/src/domain/types.ts:444`, `aa-prototype/src/domain/types.ts:476`, `aa-prototype/src/domain/billing/invoiceBuild.ts:114`, `aa-prototype/src/domain/billing/validateCardForBilling.ts:174`
