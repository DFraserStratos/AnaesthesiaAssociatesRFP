# Domain model delta: catalogue vs prototype

Read-only comparison of the entity, relationship and lifecycle model the requirements catalogue now describes (see [domain-model.md](../../../discovery-reference/Updated%20Requirements/domain-model.md)) with what `aa-prototype/` implements. The code is treated as the truth about the prototype; the old build docs were used only as leads. This version supersedes the earlier delta written against catalogue commit `1f067a8`; it re-grades every delta against the 2026-10-01 update ([change record](../../../discovery-reference/Updated%20Requirements/changes/2026-10-01-requirements-update.md)). Items with status Retired, and stories in the Future Work swim lane (US-04.3.6, US-13.7.4, US-14.1.1 to US-14.6.2), are excluded.

**Summary.** 40 structural deltas between the catalogue as it stands after the 2026-10-01 meeting with Greg and the Requirements Board answers and the prototype (code unchanged since the earlier pass at catalogue commit `1f067a8`). After adversarial verification: 27 upheld, 12 corrected, 1 added (DM-40), none dropped. The HL7/FHIR message model and monitor, the warning settings page (US-13.7.4) and the other Future Work items are out of the plan.

**Verification.** Every cited item was checked for status (none Retired, none missing; the cited items in the Future Work lane are boundary references only) and every prototype anchor was re-read in code. Corrections: DM-01 and DM-20 (estimated duration is per Procedure, new DM-40; stored Booking source is optional), DM-03 (unavailable-anaesthetist route still open under OQ-64), DM-04 (default AM and PM times are not a setting), DM-11 (the catalogue is split on Booking versus Procedure for the billable party; US-08.2.1 groups by the Procedure's party), DM-12 (accRelated need not go), DM-16 (US-04.2.7 has no purchase order), DM-22 (BCTI cardinality ambiguity), DM-28 (grouping is already aligned; only the payment setting is a delta), DM-36 (story body matches the prototype, contingent S item), DM-37 (derive the approval flag from audit), DM-39 (Booking source optional). Each section carries a Verification line.

**What moved since the earlier pass.** Reversed: the swap request with office confirmation is gone (anaesthetists move their own List, DM-05); insurer and funding source on the Booking is withdrawn, they sit on neither Patient nor Booking (DM-12, was DM-35); prepayment is all or nothing, generated automatically at setup and held for admin approval, with no completion gate (DM-20); the additional invoice is free-form (DM-18); a Draft List is now a List with no anaesthetist that can hold Bookings (DM-03). New: Slot status as one mechanism with the calendar (DM-04), the doer's-List rule (DM-06), combination Contracts, `aaCode` and payment setting (DM-07), pre-op and post-op events (DM-17), trust-account hold and moved prepaid Bookings (DM-21), negative invoices, remittance advice and BCTI period approval (DM-25), AA fee settings (DM-26), GST schedule on a cash basis (DM-29), the warning routine (DM-31), estimated duration per Procedure (DM-40).

**Order.** Foundations everything else ripples from: DM-01 (Card to Booking rename, as its own mechanical step), DM-02 (Slot/List split), DM-07 (Contract reshape) and DM-22 (ledger pair). Then DM-10 and DM-11 (one Contract per Procedure, stored billable party), which need DM-07 and DM-13. The ledger (DM-22) must precede additional invoices, prepayment, trust hold, credit and rebill, negative invoices, AA fee, GST schedule and balance tools; DM-40 must precede the prepayment estimator in DM-20. The Draft List (DM-03) must precede move-to-office (DM-05), the doer's-List rule (DM-06) and matching-screen Draft List creation (DM-34). DM-31 (warnings) can start early over today's data and absorb each source as it lands.

**Still moving (model shape may change).** OQ-64 (logical model of days, Slots and Lists), OQ-62 (base units on RVG code or procedure master), OQ-63 (event model), OQ-67 (who a Contract belongs to, whether per-Booking billable party stays), OQ-68 (split basis), OQ-70 (prepaid Booking moved), OQ-49 (Booking without NHI), OQ-65 (who is told of a move), OQ-66 (Contract navigation and aaCode), OQ-69 (email prompt or button), OQ-15, OQ-47, OQ-48, OQ-60, OQ-61, OQ-71, OQ-72, OQ-73, OQ-74, OQ-75, OQ-38.

**Already aligned, no delta.** DRAFT to SUBMITTED to AUTHORISED with no Returned state and the edit-rights rules; append-only audit; soft cancel (and no cancellation fee); hidden internal patient ID with NHI never sent to Xero and dual-format NHI validation; ACCREC plus draft ACCPAY pair with received and disbursed as independent amounts, pro-rata payable release and unarchive-before-invoicing; per-Booking (per-Card) billing failure that holds the whole Booking while the List's others bill; one invoice per distinct billable party per Booking (US-08.2.1); tiered time units; per-anaesthetist unit value; HPI id on the anaesthetist; Insurer acceptsDirectClaims; protected default Contract per hospital and direct insurer (FT-04.4); per-hospital holiday calendars; PermanentList (the catalogue's recurring booking, painted at roll-forward; rename only); soft availability conflict flag; the office price override; simulated photo capture; NHI lookup simulation; roles anaesthetist, office and system; the ledger's per-Procedure share (US-05.3.5, via InvoiceLine).

Sizes: S under a day, M a day or two, L several days, XL a week or more including seed, screens and tests. A rename or field move is cheap on its own; the size counts the ripple.

| ID | Kind | Title | Size |
| --- | --- | --- | --- |
| [DM-01](#dm-01) | ChangedEntity | Card becomes Booking and carries booking-level state (warnings, prepayment, billable party default, invoice email) | L |
| [DM-02](#dm-02) | ChangedEntity | Slot, List and Draft List are separate things; the prototype welds Slot and List together | XL |
| [DM-03](#dm-03) | NewEntity | Draft List: a List created with no anaesthetist, which can hold Bookings | L |
| [DM-04](#dm-04) | ChangedEntity | Availability is a status on the Slot, kept up from one calendar (with series), not a second record reconciled into the List | M |
| [DM-05](#dm-05) | ChangedLifecycle | An anaesthetist moves their own List with no request and no office confirmation (replaces the swap request) | M |
| [DM-06](#dm-06) | RuleChange | Whoever submits a List did its procedures: a Booking done by someone else moves to their List, and its payable follows | M |
| [DM-07](#dm-07) | ChangedEntity | Contract is reshaped from Type 1/2/3 to category, holder, multi-dimension scope, pricing basis, aaCode and payment setting | XL |
| [DM-08](#dm-08) | NewLifecycle | Contract versions and the AUTHORISED snapshot (Contract and calculation inputs locked with the Procedure) | L |
| [DM-09](#dm-09) | ChangedEntity | ContractPrice becomes a full FeeScheduleLine chosen on the Procedure | L |
| [DM-10](#dm-10) | ChangedRelationship | Each Procedure selects exactly one Contract, picked procedure first, narrowed by the List's hospital; the billing-route step disappears | XL |
| [DM-11](#dm-11) | ChangedRelationship | Billable party and invoice email become stored fields that default from the Contract holder, independent of pricing; the guardian record is in doubt | L |
| [DM-12](#dm-12) | RemovedEntity | Insurer and funding source belong to neither Patient nor Booking (reverses the earlier proposal to capture them on the Booking) | S |
| [DM-13](#dm-13) | NewEntity | Procedure master (master procedure list) mapped to RVG code or category, holding base units (placement disputed) | M |
| [DM-14](#dm-14) | ChangedEntity | Anaesthetist adjustment is a new Contract-gated record; the office override already exists | S |
| [DM-15](#dm-15) | RuleChange | Multi-procedure rule: one primary Procedure, time on every Procedure, modifier units split above four, per-Contract override | M |
| [DM-16](#dm-16) | ChangedEntity | Required Booking inputs per Contract and the 'confirm with hospital' flag on the Procedure | S |
| [DM-17](#dm-17) | NewEntity | Pre-op and post-op events on a Procedure, added by the anaesthetist, billed through office approval | L |
| [DM-18](#dm-18) | ChangedEntity | Additional invoice is a free-form admin invoice on a Procedure; it replaces the post-op addendum Card | L |
| [DM-19](#dm-19) | NewEntity | Prepaid settings on the anaesthetist profile (RVG codes and groups) replace the per-Procedure payment category | M |
| [DM-20](#dm-20) | ChangedLifecycle | Prepayment lifecycle: automatic estimate at setup, admin approval before sending, all or nothing, no completion gate | L |
| [DM-21](#dm-21) | NewEntity | Trust account: prepayment held pending, refunded in full on cancellation, kept when the Booking moves | M |
| [DM-22](#dm-22) | ChangedEntity | Internal ledger: promote BillingCase into linked receivable and payable records (Xero stays a mirror) | L |
| [DM-23](#dm-23) | NewRelationship | Derived ledger positions: whole ledger, per anaesthetist and per patient, and a flat outstanding list with no ageing | M |
| [DM-24](#dm-24) | NewLifecycle | A wrong invoice is credited in full, then rebilled (credit note, payable reversal, new invoice) | L |
| [DM-25](#dm-25) | NewEntity | Negative invoice to the anaesthetist, netted in the payment run and shown on a remittance advice; BCTIs approved per period | M |
| [DM-26](#dm-26) | NewEntity | AA fee is a separate monthly invoice from AA to each anaesthetist, built from fee settings (not a deduction on the payable) | M |
| [DM-27](#dm-27) | ChangedEntity | Invoice entity: numbering, supplier and agent presentation, email, delivery, lineage and new kinds | M |
| [DM-28](#dm-28) | ChangedEntity | A Contract payment setting (full or split) drives a second invoice; grouping by billable party is already aligned | M |
| [DM-29](#dm-29) | RuleChange | GST schedule is on a cash basis of payables actually paid, not of amounts received | S |
| [DM-30](#dm-30) | RuleChange | Patient: NHI required, missing NHI as a flagged problem list, Booking proceeds but authorising is blocked | M |
| [DM-31](#dm-31) | NewEntity | One warning routine and a Warning record on the Booking, a dashboard to-do list and a flag in both apps (soft, never blocks) | M |
| [DM-32](#dm-32) | NewEntity | Surgeon profile, surgeons' rooms, blacklist, surgeon groups and hospital contact email | L |
| [DM-33](#dm-33) | ChangedEntity | Anaesthetist profile: bank details, prepaid settings, start date, HPI CPN, admin-editable | S |
| [DM-34](#dm-34) | ChangedEntity | Intake: import rows, admin match/create/reject decisions, unmatched queue and per-hospital sync state (St George's and Southern Cross only) | L |
| [DM-35](#dm-35) | NewEntity | Explicit-save change sets and the Booking update email draft (offered after a Booking change and after a List reassignment) | M |
| [DM-36](#dm-36) | ChangedLifecycle | List visibility after invoicing: unbilled to billed, not vanished (low priority, contingent on AA) | S |
| [DM-37](#dm-37) | ChangedLifecycle | Anaesthetist Contract changes are flagged for office approval (derived from audit; the anaesthetist cannot change the Contract today) | S |
| [DM-38](#dm-38) | ChangedEntity | Reference data: master public-holiday calendar, controlled-spreadsheet load, editable masters | S |
| [DM-39](#dm-39) | ChangedEntity | List-level attachments and Copy a Booking as a skeleton (copy is not the additional-procedure mechanism); a stored Booking source is optional | M |
| [DM-40](#dm-40) | ChangedEntity | Estimated duration is recorded per Procedure from the surgeon's rooms and feeds the prepayment estimate | S |

## DM-01

### Card becomes Booking and carries booking-level state (warnings, prepayment, billable party default, invoice email)

**Kind:** ChangedEntity · **Size:** L

**Catalogue says.** Booking replaces Card; 'Card' now means only the physical hospital or surgeon card. A Booking belongs to one List (or a Draft List), references one Patient, has exactly one primary Procedure and 0..n additional ones, and itself carries billable party and invoice email, prepayment state (required, amount, invoice), open warnings. The estimated duration the surgeon's rooms give is recorded per Procedure (US-06.2.5, DM-40), not on the Booking. Booking sources (hospital download, surgeon PDF, admin entry, anaesthetist ad hoc or photo, copy) are a descriptive list in domain-model.md; no story requires a stored source field and the audit trail already records the source of each change. Mutable until SUBMITTED, office-only until AUTHORISED, then immutable, with an append-only change history.

**Prototype has.** Card (types.ts:370) with listId, patientId, completed, copiedFromCardId, cardType/addendumOfCardId, correlationRef, cancellation, prepaymentOverride, attachments. The name is baked into CardId (types.ts:39), Invoice.cardId (types.ts:666), BillingCase.cardId (types.ts:699), store/cardActions.ts, audit entityType 'card' and UI copy. Billable party, route, payment category and prepayment detail sit on the Procedure, not the Card. No stored source field (only correlationRef at types.ts:333 and the audit source, which already covers it), no warnings, no invoice email. Edit-rights lifecycle already matches (anaesthetist refused once SUBMITTED, lifecycle.ts:55-70).

**Impact.** Foundation. Do the mechanical rename first as its own step (store keys, audit entityType strings, PERSIST_VERSION bump, copy), then add the booking-level fields as the later deltas need them (DM-11 billable party default and invoice email, DM-20 prepayment, DM-31 warnings; a stored source only if wanted, DM-39). The rename is cosmetic per se but every later delta touches these types, so it should land before them. Touches types, store actions, selectors, seed (cards.ts, history.ts, audit.ts), invoice and case keys and every screen's copy.

**Verification (corrected).** Rename and Booking-holds-state upheld: Card at types.ts:370, CardId :39, Invoice.cardId :666, BillingCase.cardId :699 confirmed; edit-rights lifecycle matches (lifecycle.ts:44-71). Corrected: (1) estimated duration is per Procedure (US-06.2.5 'duration of a Procedure on the Booking'), now DM-40; (2) a stored Booking source is not required by any story, only the domain-model.md Sources bullet, so it is optional; (3) billable party placement is open (see DM-11). Scope: all refs Confirmed, Proposed or Open (US-11.2.2 Open, OQ-67); none Retired or Future.

**Catalogue:** [domain-model.md](../../../discovery-reference/Updated%20Requirements/domain-model.md), [FT-03.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-03.2.md), [US-03.1.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.1.3.md), [US-02.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.4.1.md), [US-03.6.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.6.1.md), [US-02.5.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.5.3.md), [US-11.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.2.2.md)

**Prototype:** `aa-prototype/src/domain/types.ts:370`, `aa-prototype/src/domain/types.ts:39`, `aa-prototype/src/store/cardActions.ts:179`, `aa-prototype/src/store/lifecycle.ts:363`

## DM-02

### Slot, List and Draft List are separate things; the prototype welds Slot and List together

**Kind:** ChangedEntity · **Size:** XL

**Catalogue says.** Two Slots (AM, PM) per active anaesthetist per day, four months ahead, exist whether or not anything is attached and default to free; an anaesthetist's Slots start from their start date and are freely editable afterwards. A List is assigned to an anaesthetist, sits in exactly one Slot, holds Bookings and has exactly one surgeon and one hospital; a Slot with no List has neither. Hierarchy: Day, then Slot or List, then Booking, Procedure, Contract. Lists are projected from recurring bookings or made ad hoc by an admin from a free Slot. Whether every Slot is stored or empty ones are inferred is left to implementation (OQ-64). Reassignment consumes the covering anaesthetist's Slot; the vacated Slot returns to available.

**Prototype has.** Only List (types.ts:301): one per anaesthetist x date x session with id derived from the slot (listIdForSlot, canvas.ts:44). An empty Slot is a List with statusKey 'free' and state 'DRAFT'; assigning a surgeon and hospital edits the same record. reassignList keeps the moved List's id but deletes the target's free List and mints a new List id for the vacated slot (lifecycle.ts:550-640), so List identity and Slot identity are welded. Anaesthetist has no start date (types.ts:141). No Day entity. Horizon is 14 days back to 4 months forward (clock.ts:96). Seed generates every slot deterministically (seed/canvas.ts).

**Impact.** Foundation and the largest structural change on the schedule side; must precede DM-03, DM-04, DM-05, DM-06 and DM-36. Introduce a Slot record (anaesthetist, date, session, availability, default times) on the deterministic slot id, and give List its own id plus a slotId, created on assignment (manual assignment, recurring-booking projection, Draft List assignment, ingest). Keeping Slots stored (about 20,000 small records, what the seed already generates) is the cheapest reading of the 'stored or inferred' freedom. Ripples into seed canvas generation, clock roll-forward, listForSlot/cardsForList selectors, reassignList, the Admin Day grid, mobile schedule and web availability. PERSIST_VERSION bump and reseed.

**Verification (upheld).** Confirmed: List is the only schedule type (types.ts:301), id derived from the slot (listIdForSlot, canvas.ts:44), empty Slot = List with statusKey 'free' and state 'DRAFT', reassignList deletes the target's free List and allocates a fresh id for the vacated slot (lifecycle.ts:550-640), no Day or Slot type, no Anaesthetist start date (types.ts:141). FT-01.3 is Verify, US-01.1.x Proposed, OQ-64 open so Slot storage stays a free choice. US-01.1.4 (an all-day booking uses both Slots) needs no extra delta: it is two Lists today.

**Catalogue:** [domain-model.md](../../../discovery-reference/Updated%20Requirements/domain-model.md), [EP-01](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/EP-01.md), [FT-01.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-01.1.md), [FT-01.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-01.3.md), [US-01.1.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.1.1.md), [US-01.1.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.1.3.md), [US-01.3.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.3.1.md), [US-01.3.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.3.3.md), [US-01.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.4.1.md), [OQ-64](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-64.md)

**Prototype:** `aa-prototype/src/domain/types.ts:301`, `aa-prototype/src/domain/seed/canvas.ts:44`, `aa-prototype/src/store/lifecycle.ts:550`, `aa-prototype/src/domain/clock.ts:96`, `aa-prototype/src/domain/types.ts:141`

## DM-03

### Draft List: a List created with no anaesthetist, which can hold Bookings

**Kind:** NewEntity · **Size:** L

**Catalogue says.** A Draft List is a List created with no anaesthetist. Hospital, surgeon, day and session are all required to create it and it takes no Slot. Bookings can be added before assignment. It arises when a surgeon's room needs an anaesthetist, when an anaesthetist moves a List to the office or withdraws, and, per the OQ-27 answer, when an anaesthetist with Lists marks themselves unavailable (US-01.5.2 and US-01.5.3 still leave the conflict-flag alternative open under OQ-64). Shown prominently in the Admin App (own page and beside the day view and on the one-day dashboard), with time waiting; never offered to anaesthetists; only an admin assigns it, choosing anaesthetist and Slot, when it becomes a List keeping anything recorded (soft warning for an unavailable Slot or blacklisted pairing). An unfilled or cancelled one is removed or re-dated, audited. A matching-screen row can create one.

**Prototype has.** Nothing. List.anaesthetistId is mandatory (types.ts:304) and every Card hangs off a List id, so an unassigned request has nowhere to live: an admin must first pick an anaesthetist's free List (editList) or ingest into an existing List. The word DRAFT in the prototype is the approval ListState (types.ts:46), a different concept.

**Impact.** New draftLists collection or an optional-anaesthetist List (Card.listId must be able to point at it), audit entity, Admin views (own page, day-dashboard rows, planning-view side panel), assign, remove and re-date actions, and creation from DM-05 (move to office), DM-04 (unavailable anaesthetist) and DM-34 (matching screen). Depends on DM-02; the blacklist warning on assign depends on DM-32. Rename the clash with ListState 'DRAFT' when the type is added. Naming is still unsettled (OQ-64), so keep the shape minimal (hospital, surgeon, date, session, notes, createdAt).

**Verification (corrected).** Upheld that the prototype has nothing: List.anaesthetistId is required (types.ts:304) and every Card hangs off a List id; 'DRAFT' clash with ListState confirmed (types.ts:46). Corrected: the unavailable-anaesthetist route to a Draft List is the OQ-27 answer but US-01.5.2/US-01.5.3 still treat it as open (OQ-64), so it is a trigger to support, not a settled rule. FT-01.6 and US-01.6.1/.3/.4 are Verify, US-01.6.2 Proposed, OQ-44 Answered.

**Catalogue:** [FT-01.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-01.6.md), [US-01.6.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.6.1.md), [US-01.6.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.6.2.md), [US-01.6.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.6.3.md), [US-01.6.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.6.4.md), [US-13.1.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.1.1.md), [US-02.1.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.1.2.md), [OQ-44](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-44.md), [OQ-64](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-64.md)

**Prototype:** `aa-prototype/src/domain/types.ts:304`, `aa-prototype/src/domain/types.ts:46`, `aa-prototype/src/store/lifecycle.ts:498`

## DM-04

### Availability is a status on the Slot, kept up from one calendar (with series), not a second record reconciled into the List

**Kind:** ChangedEntity · **Size:** M

**Catalogue says.** Availability status is held on the half-day Slot, free by default, set by the anaesthetist from a calendar in their app (mark days off ahead, create a series, edit or delete one instance). The Slot status and the calendar are one mechanism, not two to reconcile; once a List is put in the Slot, the List shows in place of the status. Values and colours are master data and not named yet (OQ-64). Marking a Slot unavailable when it holds a List: the Lists become Draft Lists (OQ-27 answer) or are conflict-flagged (OQ-64, open). Admins set default AM and PM times, overridable per Slot.

**Prototype has.** Two parallel models. One six-value ListStatusKey on the List (private, public, preop, holiday, unavailable, free; types.ts:53) mixes what is booked with availability and is locked to the theme palette by statusKeyParity.test.ts. A separate AnaesthetistAvailability master (types.ts:593; available, unavailable, holiday; one row per date and session, no range or recurrence) is reconciled INTO the List by setAvailability (lifecycle.ts:703): an empty free List restatuses, anything with booking context only gets a conflict flag. ListStatus master rows exist (types.ts:610) but their vocabulary is theme-fixed. Optional startTime/endTime on List only; there is no admin setting for default AM and PM times, the seed hard-codes them by status (defaultTimes, seed/canvas.ts:50).

**Impact.** Depends on DM-02. Availability moves onto the Slot; the displayed status key becomes derived (Slot availability plus attached List kind), which keeps the six-colour design language. Replace the AnaesthetistAvailability-plus-reconcile pair with Slot edits; add a recurrence rule (series with per-instance exception) behind the anaesthetist calendar; model the status set as editable master data, not a union; add an admin default AM and PM times setting (US-01.1.4) with a per-Slot override. The conflict-flag versus Draft-List outcome for an unavailable anaesthetist with Lists is undecided (OQ-64): build the flag now (already exists) and add the Draft List route behind DM-03.

**Verification (corrected).** Both parallel models confirmed (types.ts:53 six-value key, types.ts:593 availability master) and the reconcile in setAvailability confirmed (lifecycle.ts:703-780: empty free List restatuses, otherwise conflict flag). Added from US-01.1.4: default AM/PM times are not a setting (canvas.ts:50 constant). US-01.2.x and US-01.5.3 are Verify; OQ-64 open on Draft List versus conflict flag, so keep the status set editable data.

**Catalogue:** [FT-01.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-01.2.md), [US-01.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.2.1.md), [US-01.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.2.2.md), [US-01.2.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.2.3.md), [US-01.1.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.1.4.md), [US-01.5.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.5.2.md), [US-01.5.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.5.3.md), [OQ-17](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-17.md), [OQ-27](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-27.md), [OQ-64](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-64.md)

**Prototype:** `aa-prototype/src/domain/types.ts:53`, `aa-prototype/src/domain/types.ts:593`, `aa-prototype/src/domain/types.ts:610`, `aa-prototype/src/store/lifecycle.ts:703`, `aa-prototype/src/domain/statusKeyParity.test.ts`

## DM-05

### An anaesthetist moves their own List with no request and no office confirmation (replaces the swap request)

**Kind:** ChangedLifecycle · **Size:** M

**Catalogue says.** An anaesthetist selects one of their Lists and moves it either to the AA office, where it becomes a Draft List, or into a colleague's free Slot found in the availability view. The colleague does not accept and the office does not confirm: a high-trust system. Withdrawing from a List also returns it as a Draft List. A blacklisted pairing shows the same soft warning as an office assignment. Who is told is open (OQ-65). The office can still reassign a List with its Bookings (owner reference changes, one temporal event from/to/by/when) and is then offered the update email to the hospital contact.

**Prototype has.** No anaesthetist-initiated move. reassignList is office-only (lifecycle.ts:550-565, refuse 'officeOnly') and changes owner immediately. requestCover (lifecycle.ts:844) lets an anaesthetist post a CoverRequest (types.ts:277), an 'offer' or 'request' marker with status 'pending' only, on a FREE List; it is never resolved and unrelated to a booked List. No move-to-office path (no Draft List), no blacklist.

**Impact.** The earlier plan to add a SwapRequest record with PENDING/CONFIRMED/DECLINED is withdrawn: the catalogue now wants no request entity. Remove CoverRequest; add anaesthetist-actor actions moveListToOffice (creates a Draft List, DM-03) and pushListToSlot (target must be a free Slot of a colleague), each audited as one from/to/by/when event; reassignList becomes a Slot change rather than delete-and-regenerate. Depends on DM-02, DM-03 and DM-32 (blacklist warning). Notification recipients are unsettled (OQ-65): audit trail only for now. Mobile and web availability flows change.

**Verification (upheld).** Confirmed: reassignList refuses non-office actors ('officeOnly', lifecycle.ts:560-563); requestCover only writes a status 'pending' CoverRequest marker on a FREE List and nothing resolves it (lifecycle.ts:844-899; types.ts:277-284); no move-to-office path. US-01.4.3 is Verify, US-01.4.1 and US-01.4.5 Proposed, OQ-65 open. The CoverRequest 'offer' marker has no catalogue counterpart: removing it is a choice, the availability finder (US-01.4.2) is a view only.

**Catalogue:** [US-01.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.4.1.md), [US-01.4.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.4.3.md), [US-01.4.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.4.5.md), [US-01.4.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.4.2.md), [US-02.3.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.3.3.md), [OQ-08](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-08.md), [OQ-39](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-39.md), [OQ-43](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-43.md), [OQ-65](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-65.md)

**Prototype:** `aa-prototype/src/domain/types.ts:277`, `aa-prototype/src/store/lifecycle.ts:550`, `aa-prototype/src/store/lifecycle.ts:844`

## DM-06

### Whoever submits a List did its procedures: a Booking done by someone else moves to their List, and its payable follows

**Kind:** RuleChange · **Size:** M

**Catalogue says.** The List's anaesthetist did every procedure on it. If another anaesthetist did a Booking, it is moved to a List of theirs, even if that is a one-Booking List. The payable, and any prepayment payee, follow the Booking; prepayments are re-checked on any move but the agreed prepaid amount stays and the doing anaesthetist is payee, wearing or benefiting from the rate difference (OQ-70, to confirm with Ben). Say 'completed or submitted Booking', never 'timesheet'.

**Prototype has.** reassignCard (lifecycle.ts:640) lets an anaesthetist move a Card only between their own DRAFT Lists (refuse 'notOwnList'); only the office can move a Card to another anaesthetist's List, and the move neither creates a List for the doer nor re-checks prepayment. The payee is never stored: anaesthetistIdForCase joins case, Card, List, anaesthetist live (selectors.ts:612), so an unbilled case follows the move implicitly, while BillingReceipt stamps anaesthetistId at receipt (types.ts:745) and XeroAccPay carries no anaesthetist id (types.ts:780).

**Impact.** Rule and action change rather than a new entity: a 'move Booking to the doer' action that finds or creates the doer's List in the right Slot (needs DM-02) and re-runs the prepayment check (DM-20). The derived-payee design can stay but the prepayment payable must repoint explicitly once the ledger holds a payable record (DM-22), and payee must be stamped on that record at authorisation (DM-08). Depends on DM-02, DM-03 and DM-20/DM-21.

**Verification (upheld).** Confirmed: reassignCard allows an anaesthetist to move a Card only between their own DRAFT Lists ('notOwnList', lifecycle.ts:640-690); payee is derived by anaesthetistIdForCase (selectors.ts:612), so an unbilled case already follows the move, while BillingReceipt stamps anaesthetistId at receipt (types.ts:745). US-01.4.6, US-06.5.4 and US-06.3.5 are Verify; OQ-70 open. Real gaps: find-or-create the doer's List, prepayment payee repoint, and the prepayment re-check.

**Catalogue:** [US-01.4.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.4.6.md), [US-06.5.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.5.4.md), [US-06.3.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.3.5.md), [FT-06.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-06.5.md), [OQ-40](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-40.md), [OQ-70](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-70.md)

**Prototype:** `aa-prototype/src/store/lifecycle.ts:640`, `aa-prototype/src/store/selectors.ts:612`, `aa-prototype/src/domain/types.ts:745`, `aa-prototype/src/domain/types.ts:780`

## DM-07

### Contract is reshaped from Type 1/2/3 to category, holder, multi-dimension scope, pricing basis, aaCode and payment setting

**Kind:** ChangedEntity · **Size:** XL

**Catalogue says.** One reusable Contract answers how a Procedure is priced, what rules apply, who is invoiced by default and what extra Booking inputs are needed. Fields: id, aaCode (AA's own unique identifier on every Contract, scheme open OQ-66), name, version, effectiveFrom/To, reviewDate; category (RVG Default Post-paid, RVG Default Hospital, Hospital, Surgeon Solo, Surgeon Group, Insurance; no Pre-paid category, ACC is a Hospital or holder Contract); holder (hospital, surgeon or surgeon-group entity, insurer, or the Booking's billable party); scope filters (procedures from the master procedure list, hospitals, surgeons, insurers, RVG codes or groups, fundingSource, anaesthetists where empty = organisational); pricingBasis (anaesthetist rate, contract rate or % discount, FIXED_SCHEDULE, RATE_TIME); baseUnitOverrides; multiProcedureRule; allowsAnaesthetistAdjustment; paymentSetting FULL or SPLIT (basis OQ-68); requiredBookingInputs; invoiceLayout; deliveryMethod; gstTreatment. A combination of procedures is a Contract set against each parent procedure. Whether a Contract belongs to the hospital or the funding source, and the pay fall-through order, are open (OQ-67). Every hospital and direct insurer holds a default RVG Contract.

**Prototype has.** Contract (types.ts:216): type 1|2|3, one holderType/holderId (hospital, insurer, surgeon, organisation, billableParty), scope organisation | one individualAnaesthetist, permitsIndividualArrangement (the rate x time gate), isDefault (protected default Type 1), effective dates, type2Detail (agreedUnitRate | percentDiscount). No aaCode, category, procedures[] scope, hospitals/surgeons/insurers/funding scope, multiProcedureRule, allowsAnaesthetistAdjustment, requiredBookingInputs, paymentSetting, deliveryMethod, gstTreatment, reviewDate. No surgeon group with members (ContractHolderOrganisation, types.ts:180, is the nearest). Seeds: five hospital default Type 1s, nib default, SXAP/HNZ/ACC/bariatric/COS/hourly examples (seed/contracts.ts). contractActions.ts creates, edits and deletes (deleteContract exists; the catalogue retires and versions).

**Impact.** Foundation for pricing, selection and the Contract catalogue. Mapping: Type 1 = anaesthetist-rate units, Type 2 = contract-rate units, Type 3 = FIXED_SCHEDULE, permitsIndividualArrangement = RATE_TIME. The selectContract precedence resolver (individual beats organisational, specific beats default) becomes scope filtering plus an explicit choice (DM-10). fee.ts, contracts.ts, contractActions.ts, the Contract editor in MasterData and seed contracts all change. scope.anaesthetists becomes a list; add a SurgeonGroup with members (DM-32); aaCode generation scheme is open (OQ-66), use a simple sequence. A combination Contract needs procedures[] scope and a Booking that records only the Contract. Depends on nothing; DM-08, DM-09, DM-10, DM-14, DM-15, DM-16, DM-28 depend on it. Base-unit ownership is disputed (DM-13). Note the domain-model.md category table still lists 'RVG Default Pre-paid'; US-04.1.1 and OQ-25 (no Pre-paid category) win.

**Verification (upheld).** Contract fields confirmed (types.ts:216-241) and the Contract editor and seeds exist (contractActions.ts create/edit/delete, deleteContract at :152; the catalogue retires and versions instead). US-04.1.1 has no Pre-paid category, so the stale 'RVG Default Pre-paid' row in the domain-model.md table loses to it and OQ-25. US-04.2.7 lists four inputs; domain-model.md adds purchaseOrder. US-04.1.4, US-04.2.1, US-04.2.11, US-04.2.12 are Verify; OQ-66, OQ-67, OQ-68 open.

**Catalogue:** [domain-model.md](../../../discovery-reference/Updated%20Requirements/domain-model.md), [EP-04](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/EP-04.md), [FT-04.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-04.1.md), [FT-04.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-04.2.md), [FT-04.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-04.4.md), [US-04.1.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.1.1.md), [US-04.1.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.1.2.md), [US-04.1.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.1.4.md), [US-04.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.1.md), [US-04.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.2.md), [US-04.2.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.5.md), [US-04.2.7](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.7.md), [US-04.2.8](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.8.md), [US-04.2.11](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.11.md), [US-04.2.12](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.12.md), [US-05.5.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.5.1.md), [OQ-06](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-06.md), [OQ-25](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-25.md), [OQ-66](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-66.md), [OQ-67](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-67.md), [OQ-68](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-68.md)

**Prototype:** `aa-prototype/src/domain/types.ts:195`, `aa-prototype/src/domain/types.ts:216`, `aa-prototype/src/domain/seed/contracts.ts:32`, `aa-prototype/src/store/contractActions.ts:53`, `aa-prototype/src/domain/billing/contracts.ts:38`

## DM-08

### Contract versions and the AUTHORISED snapshot (Contract and calculation inputs locked with the Procedure)

**Kind:** NewLifecycle · **Size:** L

**Catalogue says.** Every version of a Contract is kept. At AUTHORISED the engine snapshots the Contract version onto each Procedure, plus the reference data the calculation used (rates, RVG values, the anaesthetist's unit value, party details), so an invoice regenerates exactly and later edits or price changes never alter a raised invoice. The engine reads the locked Contract only. Every price line carries its own effective-from date; which date decides the price in force is open (OQ-48, Greg leans to the procedure date).

**Prototype has.** No version on Contract and no snapshot: authoriseList only flips state (lifecycle.ts:277). The billing run rates against the LIVE contract and writes amounts into InvoiceLine description text. If the stored Contract has expired by billing, resolveContractForProcedure falls back to the holder's default Type 1 or raises a failed case (invoiceBuild.ts:114-146). Contract has one effectiveFrom/To pair; ContractPrice has no dates.

**Impact.** Append-only Contract version history (contractId + version) and a per-Procedure locked record (contractId, contractVersion, unit value, base units, price line) written in authoriseList; the billing run reads only that record, which removes the effective-date fallback branch and its 'contractIneffective' failure demo. The same record is where the payee anaesthetist is fixed (DM-06). Depends on DM-07 and DM-09. Reseed and PERSIST_VERSION bump. The exact frozen fields are still to be decided (US-15.0.3).

**Verification (upheld).** Confirmed: authoriseList only flips state (lifecycle.ts:277-310); resolveContractForProcedure falls back to the default when the stored Contract is ineffective on the List date (invoiceBuild.ts:139-146). The invoice build does freeze amounts and rate text per line (describeFeeLine, invoiceBuild.ts:240-247), so the output is a snapshot but the calculation inputs are not locked. US-04.3.5 Confirmed, US-04.1.3 and US-04.2.10 Proposed; OQ-48 open.

**Catalogue:** [US-04.1.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.1.3.md), [US-04.3.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.3.5.md), [US-07.3.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-07.3.1.md), [US-08.4.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.4.4.md), [US-04.2.10](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.10.md), [US-15.0.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-15.0.3.md), [OQ-48](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-48.md)

**Prototype:** `aa-prototype/src/store/lifecycle.ts:277`, `aa-prototype/src/domain/billing/invoiceBuild.ts:114`, `aa-prototype/src/domain/types.ts:216`

## DM-09

### ContractPrice becomes a full FeeScheduleLine chosen on the Procedure

**Kind:** ChangedEntity · **Size:** L

**Catalogue says.** Children of a FIXED_SCHEDULE Contract: holder code and description (SXAP AP0126, CES HNZCATall, ACC OPT101), priceExGst and priceIncGst, optional mappedRvgCodes so BTM is still recorded, timeBand, isAddOn, quantityRule (for example per area), tier (commitment versus panel) and effectiveFrom per line. Holder codes are kept as searchable references (typing 8942 filters to that Contract). The Procedure records feeScheduleLineId; base, time and modifier units are still recorded when the price comes from a line.

**Prototype has.** ContractPrice (types.ts:250): contractId, optional rvgBaseCode, surgeonId, procedureOrdinal, price; matched most-specific-wins by key (matchContractPrice, contracts.ts:77). No holder code, description, GST-inclusive price, time band, add-on, quantity rule, tier or date. No feeScheduleLineId on Procedure; a Type 3 with no matching row falls back to BTM (a labelled demo reading).

**Impact.** Replace ContractPrice and key-based matching with an explicit line chosen on the Procedure and shown by holder code. fee.ts Type 3 branch gains time bands, add-ons and quantity; procedureOrdinal moves to the Contract's multiProcedureRule (DM-15). Seed needs realistic lines and the Admin price editor changes. Depends on DM-07. The not-on-schedule outcome is DM-16.

**Verification (upheld).** ContractPrice (types.ts:250) and key-based matching (contracts.ts:77) confirmed; line fields in US-04.2.4 match (tier is domain-model.md only). US-05.2.5 Confirmed, US-04.2.4 and US-04.2.10 Proposed; OQ-48 open (which date decides).

**Catalogue:** [US-04.2.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.4.md), [US-04.2.10](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.10.md), [US-05.2.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.2.5.md), [US-03.6.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.6.1.md), [OQ-18](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-18.md), [OQ-48](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-48.md)

**Prototype:** `aa-prototype/src/domain/types.ts:250`, `aa-prototype/src/domain/billing/contracts.ts:77`, `aa-prototype/src/domain/billing/fee.ts:180`, `aa-prototype/src/store/contractActions.ts:200`

## DM-10

### Each Procedure selects exactly one Contract, picked procedure first, narrowed by the List's hospital; the billing-route step disappears

**Kind:** ChangedRelationship · **Size:** XL

**Catalogue says.** No route step. Each Procedure has exactly one governing Contract, a prerequisite for completing the Booking. The user picks the procedure first (from the list grouped by RVG body headings), then a Contract from those set against it, narrowed by the List's hospital (surgeon not settled); the default RVG Contract is always offered, and a holder code can be typed to find a Contract. The patient's insurer or funding source is NOT a filter (OQ-55). Admin sets the Contract at booking setup, the anaesthetist may change it, the office approves at review. A combination Contract is chosen once and the Booking then records only the Contract. Thousands of Contracts must stay navigable (OQ-66).

**Prototype has.** Procedure has billingRoute ('hospital' | 'billableParty' | 'insurer'), governingContractId (optional), insurerId, billablePartyId, patientPaymentCategory (selfFundedPostProcedure | selfFundedPrepayment | insuredReimbursement), prepaymentDetail and billingReference (types.ts:409-484). The validator fails an unset route; the billing run resolves contract and payer from route plus stored contract (invoiceBuild.ts:114, 192); the 'billableParty' route needs no contract at all. Contract choice is an office-only billing-setup control (OfficeBillingSetup, EditBillingSetupSheet). There is no procedure-first picker, no hospital-narrowed Contract list and no way to find a Contract by holder code.

**Impact.** Removes BillingRoute, PatientPaymentCategory and the route-driven use of Procedure.insurerId (DM-12); governingContractId becomes required for completion. Who gets the invoice moves to the Booking (DM-11); the prepayment trigger moves to the anaesthetist's prepaid settings (DM-19, DM-20). Rewrites resolveContractForProcedure, counterpartyForProcedure, validateCardForBilling, the mobile and web capture and office billing-setup UI (the route picker becomes a filtered Contract picker), review flags and the seed for every Card. New: filtered picker selector with holder-code search, default-Contract auto-creation for a new hospital or insurer. Depends on DM-07 and DM-13 (procedure master for the first pick); DM-11 runs alongside. Largest ripple on the billing side.

**Verification (upheld).** Confirmed: the validator fails an unset route, contract and payer come from route plus stored Contract (invoiceBuild.ts:114-215), and the Contract picker is an unfiltered select of every Contract (EditBillingSetupSheet.tsx:175-180), office only. Added nuance: the ROUTE is also set by the anaesthetist at ad hoc entry (ManualCardForm.tsx:206) and in EditProcedureSheet, so removing the route step touches anaesthetist capture too. US-04.3.1, US-04.3.3, US-04.3.4 Confirmed; US-04.3.2 Verify; OQ-53 Answered; OQ-66 open.

**Catalogue:** [FT-04.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-04.3.md), [US-04.3.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.3.1.md), [US-04.3.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.3.2.md), [US-04.3.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.3.3.md), [US-04.3.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.3.4.md), [US-04.2.11](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.11.md), [US-03.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.4.1.md), [US-07.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-07.2.2.md), [US-08.1.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.1.1.md), [US-11.4.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.4.2.md), [US-04.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.4.1.md), [FT-04.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-04.4.md), [OQ-53](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-53.md), [OQ-55](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-55.md), [OQ-66](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-66.md)

**Prototype:** `aa-prototype/src/domain/types.ts:409`, `aa-prototype/src/domain/types.ts:444`, `aa-prototype/src/domain/billing/invoiceBuild.ts:114`, `aa-prototype/src/domain/billing/invoiceBuild.ts:192`, `aa-prototype/src/domain/billing/validateCardForBilling.ts:104`, `aa-prototype/src/shared/card/OfficeBillingSetup.tsx`

## DM-11

### Billable party and invoice email become stored fields that default from the Contract holder, independent of pricing; the guardian record is in doubt

**Kind:** ChangedRelationship · **Size:** L

**Catalogue says.** A billable party and an invoice email are held on the Booking and default to the Contract holder (hospital, insurer, surgeon entity) or, for patient-direct Contracts, the patient, and can be overridden by admin or anaesthetist (for example a hospital taking the invoice while pricing stays default RVG). The billable party is independent of pricing. A patient under 18 as billable party raises a mild, clearable warning (no block; none when someone else pays); there is no separate guardian record, a guardian's details are a Contract matter kept for the life of the debt. Placement is not settled: domain-model.md puts them on the Booking (ER diagram, Booking section) but its billing-context table says 'on the Booking or Procedure', and US-08.2.1 and US-04.3.7 speak of 'the billable party each Procedure has'; OQ-55's answer has one Booking with Procedures on different Contracts and different billable parties. Whether the per-Booking override stays at all, or each arrangement becomes its own Contract, is open (OQ-67), as is who the Contract belongs to.

**Prototype has.** BillableParty (types.ts:127) is a guardian-only record with relationshipToPatient, deliberately not a Patient, with its own Xero contact type. Payer is derived per Procedure: counterpartyForProcedure returns the insurer, the BillableParty or the patient (billableParty route), else the resolved contract's holder (invoiceBuild.ts:192). Payer is already resolved per Procedure and stored nowhere. No Booking-level payer and no invoice email on Card, Procedure or Invoice (only Patient.email and BillableParty.email). No under-18 check (Patient.dobISO exists, types.ts:107). CounterpartyRef kinds already cover hospital, insurer, surgeon, organisation, patient and billableParty (types.ts:73).

**Impact.** Add a stored billableParty (CounterpartyRef) and invoiceEmail with defaults from the chosen Contract holder or patient. Hold them on the Booking as the default with an optional per-Procedure value so either reading works until OQ-67; the billing run keeps grouping by each Procedure's resolved party (DM-28, DM-27). Do not extend the BillableParty guardian entity: US-11.2.4 says there is no guardian record, while US-11.2.2 (Open, OQ-67) still lets a Booking name another party, so keep the entity as is until OQ-67 resolves and treat the under-18 check as a warning (DM-31). Invoice email required for patient-direct Contracts (DM-16). Depends on DM-01 and DM-10.

**Verification (corrected).** Corrected: the draft said the billable party lives on the Booking. The catalogue is split: domain-model.md and US-11.2.2 say Booking, but US-08.2.1 ('billable party each one has'), US-04.3.7 and the OQ-55 answer imply per Procedure. Confirmed in code: BillableParty is guardian-only (types.ts:127), payer derived per Procedure (invoiceBuild.ts:192-212), no invoice email, no under-18 check. US-11.2.2 is Open (OQ-67); US-11.2.4 Confirmed says there is no guardian record.

**Catalogue:** [FT-11.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-11.2.md), [US-11.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.2.1.md), [US-11.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.2.2.md), [US-11.2.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.2.3.md), [US-11.2.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.2.4.md), [US-04.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.1.md), [US-08.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.2.1.md), [US-08.4.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.4.2.md), [US-07.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-07.2.2.md), [OQ-54](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-54.md), [OQ-55](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-55.md), [OQ-67](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-67.md)

**Prototype:** `aa-prototype/src/domain/types.ts:127`, `aa-prototype/src/domain/types.ts:73`, `aa-prototype/src/domain/billing/invoiceBuild.ts:192`, `aa-prototype/src/store/billablePartyActions.ts:21`

## DM-12

### Insurer and funding source belong to neither Patient nor Booking (reverses the earlier proposal to capture them on the Booking)

**Kind:** RemovedEntity · **Size:** S

**Catalogue says.** OQ-55 answer: insurer and funding source are held on neither the Patient nor the Booking; each Procedure's Contract says who pays, with as many Contracts as needed for any mix. Funding source (private, SXAP, HNZ, ACC) describes the Contract (scope.fundingSource) and is no longer a picker filter; whether insurer and funding source stay as Contract scope filters depends on OQ-67. An insurer that does not accept direct claims means the patient is invoiced and forwards it. ACC is a Hospital or holder Contract with ACC pricing, invisible to the engine.

**Prototype has.** Procedure.insurerId (types.ts:444-470), used as payer only on the 'insurer' route and informational on the hospital route, and Procedure.accRelated (types.ts:476), an informational boolean that drives an ACC review advisory (reviewFlags.ts, case c). Insurer master has acceptsDirectClaims (types.ts:166). No funding-source value anywhere.

**Impact.** The previous plan (add Booking.insurerId and Booking.fundingSource) is withdrawn. Remove Procedure.insurerId and the insurer route with DM-10; add Contract.scope.insurers and fundingSource (DM-07). accRelated need not go: US-05.5.1 keeps ACC 'invisible to the Billing/Invoice Engine', which is how the prototype already treats it, so the ACC advisory is a review choice, not a model change. US-11.4.2 (insurer without direct claims, patient invoiced) still needs a trigger once no Booking field holds the insurer; the catalogue is silent, a Contract holder flag is the likely home. Insurer master stays, as a Contract holder. Small, but must land with DM-10 so no screen keeps reading insurerId.

**Verification (corrected).** Upheld: OQ-55 is Answered (neither Patient nor Booking holds insurer or funding source); Procedure.insurerId and the insurer route confirmed (types.ts:444-470, validateCardForBilling.ts:174), acceptsDirectClaims confirmed (types.ts:173). Corrected: the draft's 'fold accRelated into the Contract' is not asked for, the catalogue (US-05.5.1, FT-05.5) is consistent with the prototype's informational accRelated; the removal is only insurerId and the insurer route. OQ-67 open on whether insurer and funding source stay as scope filters.

**Catalogue:** [US-04.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.1.md), [US-04.3.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.3.2.md), [US-11.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.4.1.md), [US-11.4.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.4.2.md), [US-07.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-07.2.2.md), [FT-05.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-05.5.md), [US-05.5.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.5.1.md), [OQ-55](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-55.md), [OQ-67](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-67.md)

**Prototype:** `aa-prototype/src/domain/types.ts:444`, `aa-prototype/src/domain/types.ts:476`, `aa-prototype/src/domain/types.ts:166`, `aa-prototype/src/apps/admin/reviewFlags.ts`, `aa-prototype/src/domain/billing/validateCardForBilling.ts:174`

## DM-13

### Procedure master (master procedure list) mapped to RVG code or category, holding base units (placement disputed)

**Kind:** NewEntity · **Size:** M

**Catalogue says.** A master list of standard single procedures by operation name, each mapped to an RVG code or category and holding its own base units (a code alone can carry different values), ideally derived from the code. Default and hospital Contracts that use default base units take them from it; a Contract may override. Position loadings are modifiers. The RVG code master keeps the guide's own values and AA can add AA-sourced codes and RVG groups (cosmetic, plastics, dental). Out-of-range base units entered by the anaesthetist are accepted and raise an after-procedure warning. DISPUTED: the OQ-06 board answer puts base units on the RVG code master; the 2026-10-01 meeting put them on the master procedure list (OQ-62). Loaded from controlled spreadsheets; Solutions Plus supplies names only. Donald proposes dropping 'RVG' from the name.

**Prototype has.** No procedure master. Procedure.rvgBaseCode points straight at RvgCode (types.ts:540), whose baseUnits (single or range) are the only base-unit source, with baseUnitsSelected for ranges and a captured override (types.ts:491-495). No AA-sourced flag, no groups and no operation-name entity. validateCardForBilling refuses an out-of-range base selection outright rather than warning. Modifier master exists (types.ts:556, demo values).

**Impact.** New masters ProcedureType (name, rvgCode or category, baseUnits) and RvgGroup with code-to-group tags (also needed by DM-19). Procedure gains procedureTypeId, or keeps rvgBaseCode with base units resolved through the master and a Contract override (DM-07). resolveBtm changes its base-unit source; the out-of-range refusal becomes a warning (DM-31). The capture UI picker changes to procedure-first (DM-10). Keep the shape flexible until OQ-62 settles; it need not block DM-10 if the first pick can stay RVG-code based.

**Verification (upheld).** Confirmed: no procedure master, base units only on RvgCode (types.ts:540-547); validateCardForBilling fails a ranged base code whose selected value is outside min..max (validateCardForBilling.ts:152-162) where the catalogue wants acceptance plus an after-procedure warning (US-03.3.1 Verify, OQ-56 Answered). US-05.1.6 and US-05.1.1 Verify; OQ-62 open, so keep base-unit placement flexible.

**Catalogue:** [US-05.1.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.1.6.md), [US-05.1.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.1.1.md), [US-05.1.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.1.3.md), [US-05.1.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.1.5.md), [US-03.3.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.3.1.md), [US-04.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.2.md), [US-13.4.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.4.3.md), [OQ-06](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-06.md), [OQ-56](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-56.md), [OQ-62](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-62.md)

**Prototype:** `aa-prototype/src/domain/types.ts:540`, `aa-prototype/src/domain/types.ts:491`, `aa-prototype/src/domain/seed/rvgCodes.ts`, `aa-prototype/src/domain/billing/fee.ts:58`

## DM-14

### Anaesthetist adjustment is a new Contract-gated record; the office override already exists

**Kind:** ChangedEntity · **Size:** S

**Catalogue says.** Two distinct records on the Procedure. Anaesthetist adjustment: percent discount or fixed final price with a reason, only when the Contract allows it (the field is not offered otherwise), applied after BTM is recorded in full (even at 100% discount). Office override: percent, amount or fixed final with a reason, always available whatever the Contract says, including over a fixed-fee price, audited. Both apply after the base calculation.

**Prototype has.** One PriceOverride union on the Procedure (types.ts:434): fixedFee, dollarAdjustment, percentAdjustment, each with a reason, no actor and no Contract gate. This IS the office override, so that half is aligned. The anaesthetist reuses the same field: the capture UI offers fixedFee or dollarAdjustment and reserves percent for the office (OverrideCard.tsx:28-46), a UI convention rather than a model rule, and nothing gates it on the Contract. fee.ts applies it after the subtotal.

**Impact.** Keep priceOverride as officeOverride (add actor). Add a separate anaesthetistAdjustment {PERCENT | FIXED_FINAL, value, reason} offered only when the Contract has allowsAnaesthetistAdjustment; fee.ts applies adjustment then override and records the pre-adjustment fee. Anaesthetist capture UI swaps fixed or dollar for percent or fixed-final and hides the field when the Contract does not permit it. Depends on DM-07.

**Verification (upheld).** Confirmed: one PriceOverride union (types.ts:434-437), the anaesthetist UI offers only fixedFee and dollarAdjustment (OverrideCard.tsx:28-46, percent left to the office), nothing gates on the Contract. US-05.4.2, US-05.4.1 Confirmed; US-03.5.1 Proposed; OQ-16 Answered (office can always override). Office half aligned except for an actor field.

**Catalogue:** [FT-03.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-03.5.md), [US-03.5.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.5.1.md), [US-03.5.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.5.2.md), [FT-05.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-05.4.md), [US-05.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.4.1.md), [US-05.4.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.4.2.md), [US-04.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.2.md), [OQ-16](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-16.md)

**Prototype:** `aa-prototype/src/domain/types.ts:434`, `aa-prototype/src/domain/types.ts:501`, `aa-prototype/src/domain/billing/fee.ts:180`, `aa-prototype/src/shared/capture/OverrideCard.tsx`, `aa-prototype/src/shared/flows/PriceOverrideSheet.tsx`

## DM-15

### Multi-procedure rule: one primary Procedure, time on every Procedure, modifier units split above four, per-Contract override

**Kind:** RuleChange · **Size:** M

**Catalogue says.** Exactly one primary Procedure per Booking (anyone with edit rights, including an inbound source, can change it; an ACC pre-op assessment is never primary). Base units only on the primary, never editable on others. Time units on every Procedure from its own times, always from the RVG rule. Modifier units all on the primary when the Booking total is 4 or fewer; above 4 they are split equally across all Procedures with the remainder to the primary (7 over 3 = 3/2/2), whichever Contracts the Procedures are on. Each Procedure is priced by its own Contract. A Contract may replace the rule (SECOND_CODE_PERCENT, ADD_ON_FEE, NOT_BILLABLE). The even-split rounding is reopened for Ben to validate (OQ-15).

**Prototype has.** The RFP rule: an additional Procedure yields time units ONLY; base and modifiers charge on the first Procedure alone (splitBillingUnits, fee.ts:107). Procedure.isAdditional (types.ts:484) is set by addProcedure and copyCard; there is no isPrimary flag (the first Procedure by order is implicitly primary) and no set-primary action. No modifier split. Contract second-procedure pricing is ContractPrice.procedureOrdinal on Type 3 only. The share per Procedure is recorded as invoice lines, not as a ledger share.

**Impact.** Pure domain change with Vitest updates: replace isAdditional with isPrimary (exactly-one invariant), compute modifier allocation across the whole Booking (feeFor then needs the Booking, not one Procedure), honour Contract.multiProcedureRule. Capture UI shows the allocated modifier share on additional Procedures instead of 'Not charged'. Seed and every worked-example test change. Depends on DM-07 (rule field) and DM-01. Keep the remainder rule switchable until OQ-15 is answered.

**Verification (upheld).** Confirmed: splitBillingUnits gives an additional Procedure time units only (fee.ts:107-109), isAdditional set by addProcedure and copyCard, no isPrimary and no set-primary action. US-05.3.1 is Open (OQ-15 reopened), US-03.2.1/.2/.3 Confirmed, US-05.3.4 Proposed. US-05.3.5 (ledger tracks each Procedure's share, Confirmed) is met by InvoiceLine.procedureId, units and amount, so no separate delta.

**Catalogue:** [FT-05.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-05.3.md), [US-05.3.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.3.1.md), [US-05.3.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.3.4.md), [US-05.3.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.3.5.md), [US-03.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.2.1.md), [US-03.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.2.2.md), [US-03.2.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.2.3.md), [US-04.2.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.5.md), [US-05.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.2.2.md), [OQ-15](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-15.md), [OQ-53](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-53.md)

**Prototype:** `aa-prototype/src/domain/billing/fee.ts:107`, `aa-prototype/src/domain/types.ts:484`, `aa-prototype/src/store/cardActions.ts:394`, `aa-prototype/src/shared/capture/UnitsCard.tsx:36`

## DM-16

### Required Booking inputs per Contract and the 'confirm with hospital' flag on the Procedure

**Kind:** ChangedEntity · **Size:** S

**Catalogue says.** A Contract declares which per-Booking inputs it requires (US-04.2.7: invoice email, billable party, prepaid amount, insurer member number or claim reference; domain-model.md also lists purchaseOrder); the Booking holds the values and cannot be marked complete until they are present. When a hospital sheet says a Procedure is under a Contract but it is not on the Contract's schedule, an admin can set the Contract anyway and flag the Procedure 'to confirm with the hospital'; the flag shows at office review and clears on confirmation.

**Prototype has.** Procedure.billingReference (types.ts:480) is the only generic reference and is checked only on the 'hospital' route (billingReferenceMissing, validateCardForBilling.ts:53). No insurerMemberNumber, claimReference or purchaseOrder, no per-Contract required-input declaration, no confirm-with-hospital flag.

**Impact.** Additive fields on Procedure or Booking (memberNumber, claimReference, purchaseOrder, toConfirmWithHospital) plus Contract.requiredBookingInputs; validateCardForBilling and reviewFlags read the declaration instead of the route-based reference rule. Depends on DM-07 and DM-10.

**Verification (corrected).** Confirmed: billingReference is the only generic reference and is checked only on the 'hospital' route (billingReferenceMissing, validateCardForBilling.ts:48-54); no confirm-with-hospital flag. Corrected: US-04.2.7 does not list purchase order (domain-model.md does), so treat it as optional. US-04.2.7 and US-04.3.7 Proposed.

**Catalogue:** [US-04.2.7](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.7.md), [US-03.6.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.6.1.md), [US-04.3.7](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.3.7.md), [US-07.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-07.2.2.md)

**Prototype:** `aa-prototype/src/domain/types.ts:480`, `aa-prototype/src/domain/billing/validateCardForBilling.ts:53`, `aa-prototype/src/apps/admin/reviewFlags.ts`

## DM-17

### Pre-op and post-op events on a Procedure, added by the anaesthetist, billed through office approval

**Kind:** NewEntity · **Size:** L

**Catalogue says.** The anaesthetist adds events to a Procedure themselves (pain management after the procedure, an ACC pre-op assessment): each has its own date and time, records either a time or a fixed fee, takes no other modifiers, attaches to the original Procedure so it stays traceable, and may be marked not billable. A billable event produces a new invoice, traceable to the Procedure, priced from its time or fixed fee (the Contract can replace the time with a fixed fee), provisionally approved by the office before issue. Whether an event is its own element (Donald, recommended) or a Procedure added to the Booking (Greg), its name, whether it is an invoice line or a procedure, and approval are open (OQ-63). An ACC pre-op assessment is never the primary Procedure.

**Prototype has.** Nothing. The nearest thing is the post-op addendum Card (cardType 'postOpAddendum', addendumOfCardId; types.ts:388-389; addPostOpAddendum, cardActions.ts:270), a whole new Card on the original anaesthetist's free DRAFT List with its own capture, submit, authorise and bill cycle, which is a different mechanism from an event on a Procedure. BillingLine has no service date of its own (types.ts:518). A POSTOP modifier group exists (types.ts:549) but is just a modifier.

**Impact.** New ProcedureEvent record (procedureId, date, time or fixedFee, billable, approvalState, invoiceId) with an anaesthetist-facing add flow (mobile and web, reachable from past Procedures, US-03.1.6) and an Admin approval queue; its invoice is a new kind linked to the Procedure (DM-27). Replaces the anaesthetist-driven part of the addendum Card (see DM-18). Depends on DM-01, DM-07 (fixed-fee swap) and DM-27. Keep the shape thin until OQ-63 is answered.

**Verification (upheld).** Confirmed: nearest thing is addPostOpAddendum (cardActions.ts:270), a whole new Card on a free empty session today, not an event on a Procedure; BillingLine has no date (types.ts:518). FT-03.7 and US-03.7.1/.2 Verify, US-05.5.2 Open (ACC codes), OQ-63 and OQ-12 open. US-03.3.6 also wants a billing line to carry its own later date, a second reason BillingLine needs one.

**Catalogue:** [FT-03.7](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-03.7.md), [US-03.7.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.7.1.md), [US-03.7.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.7.2.md), [US-05.5.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.5.2.md), [US-03.3.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.3.6.md), [US-03.1.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.1.6.md), [OQ-12](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-12.md), [OQ-63](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-63.md)

**Prototype:** `aa-prototype/src/domain/types.ts:388`, `aa-prototype/src/store/cardActions.ts:270`, `aa-prototype/src/domain/types.ts:518`, `aa-prototype/src/domain/types.ts:549`

## DM-18

### Additional invoice is a free-form admin invoice on a Procedure; it replaces the post-op addendum Card

**Kind:** ChangedEntity · **Size:** L

**Catalogue says.** An admin, from a button in the Admin App, creates an additional invoice attached to a Procedure for post-invoice charges and for splitting a combined fixed-price Procedure at a billable party's request. It is free-form: each line has a description, quantity and amount, with no Contract pricing or unit rules (OQ-45). No extra approval; audited. It links and is traceable to the original Procedure and invoice (the original shows its additional invoices), has its own unique number, ledger pair, Xero pair and anaesthetist payable, and never unlocks the original. The balance after a prepayment is NOT an additional invoice. Open: whether it can go to a different billable party and whether the original is credited on a split (OQ-72). A wrong invoice is never fixed this way (DM-24).

**Prototype has.** Post-op addendum: a NEW Card (cardType 'postOpAddendum', addendumOfCardId; types.ts:388-389) created by addPostOpAddendum (cardActions.ts:270) on the original anaesthetist's free DRAFT List for today, running its own capture, submit, authorise and bill cycle with ordinary Contract pricing; the original stays locked. It is anaesthetist-driven, not an admin button, needs a free session, and the resulting invoice records no link to the original. No free-form invoice and no 'split a combined Procedure' concept.

**Impact.** Remove Card.cardType, addendumOfCardId and addPostOpAddendum; add Invoice kind 'additional' with procedureId, originalInvoiceId, free-form lines and its own ledger pair (DM-22). New admin action and Procedure-level button; the mobile 'add post-op charge' entry becomes an event (DM-17) or 'tell the office'. Depends on DM-22 and DM-27. Splitting a combined Procedure follows the combination Contract model (DM-07, OQ-53).

**Verification (upheld).** Confirmed: addPostOpAddendum is anaesthetist-driven, refused unless the original List is AUTHORISED and a free empty session exists today (cardActions.ts:270-310), resulting invoices carry no link to the original. US-08.6.1/.3/.4 Verify, free-form per OQ-45 (Answered); OQ-72 open. US-08.6.1 also lets the anaesthetist add the line as an event (DM-17) or tell the office.

**Catalogue:** [FT-08.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-08.6.md), [US-08.6.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.6.1.md), [US-08.6.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.6.3.md), [US-08.6.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.6.4.md), [US-04.2.11](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.11.md), [US-06.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.4.1.md), [OQ-24](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-24.md), [OQ-45](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-45.md), [OQ-53](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-53.md), [OQ-72](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-72.md)

**Prototype:** `aa-prototype/src/domain/types.ts:388`, `aa-prototype/src/store/cardActions.ts:270`, `aa-prototype/src/domain/types.ts:518`, `aa-prototype/src/domain/types.ts:666`

## DM-19

### Prepaid settings on the anaesthetist profile (RVG codes and groups) replace the per-Procedure payment category

**Kind:** NewEntity · **Size:** M

**Catalogue says.** Each anaesthetist ticks the RVG codes or whole groups (cosmetic, plastics, dental) that require prepayment; an admin can view and edit them on their behalf. A Booking needs prepayment when ANY of its Procedures carries a code in that set (checked across the whole Booking), and only where the patient (the person paying for them) is the billable party (OQ-58, OQ-73). Prepaid is a property of the procedure choice, never of the Contract; there is no Pre-paid Contract category (OQ-25).

**Prototype has.** No per-anaesthetist prepaid set and no code groups. Prepayment is a per-Procedure declaration: patientPaymentCategory 'selfFundedPrepayment' plus prepaymentDetail {full | split, depositAmount} (types.ts:416-430), and cardRequiresPrepayment reads those flags (selectors.ts:307).

**Impact.** New Anaesthetist.prepaidSettings (rvgCodes[], rvgGroups[]) and the RvgGroup master (DM-13); prepayment-required becomes derived from a Booking's Procedures against that set instead of a hand-picked payment category. Anaesthetist profile screens (mobile and web) and the Admin anaesthetist editor gain a tick list. Depends on DM-10 (category removed) and DM-13 (groups); feeds DM-20.

**Verification (upheld).** Confirmed: cardRequiresPrepayment reads route 'billableParty' plus category 'selfFundedPrepayment' (selectors.ts:307-313); no per-anaesthetist prepaid set. FT-06.1, US-06.1.1, US-12.1.3 Confirmed; US-06.2.1 Verify; OQ-73 open (patient must be billable party).

**Catalogue:** [FT-06.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-06.1.md), [US-06.1.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.1.1.md), [US-06.1.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.1.2.md), [US-06.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.2.1.md), [US-12.1.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-12.1.3.md), [US-05.1.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.1.3.md), [OQ-25](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-25.md), [OQ-58](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-58.md), [OQ-73](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-73.md)

**Prototype:** `aa-prototype/src/domain/types.ts:416`, `aa-prototype/src/domain/types.ts:426`, `aa-prototype/src/store/selectors.ts:307`, `aa-prototype/src/domain/types.ts:141`

## DM-20

### Prepayment lifecycle: automatic estimate at setup, admin approval before sending, all or nothing, no completion gate

**Kind:** ChangedLifecycle · **Size:** L

**Catalogue says.** The Booking holds prepaymentRequired, prepaidAmount and prepaymentInvoiceId. The amount is always the full estimate, never a deposit or partial amount: (base + time + 2 contingency modifier units) x the anaesthetist's own unit value, time units from the estimated duration the surgeon's rooms give for each Procedure (US-06.2.5, DM-40) by the standard RVG rule (OQ-38, OQ-50, OQ-75), worded as an estimate from standard letter templates. The invoice is generated automatically at booking setup when a Procedure matches the prepaid list and the patient is the billable party, and is held until an admin approves it, then goes out with the letter; submitting the List does not invoice it again. Status (unpaid, part paid, paid) is tracked with an alert as the date nears, re-checked after each receipt and whenever Procedures, Contract, List or Booking change. NO block on completing a Booking or List: an outstanding prepayment is a warning in both apps. After AUTHORISED the balance (final minus prepaid) is invoiced if positive (OQ-61: a small shortfall may be let go); if negative nothing is refunded or credited (OQ-03).

**Prototype has.** Pre-payment is a separate 'prePayment' Invoice kind (types.ts:670) raised on demand by the office (raisePreProcedureInvoice, prepaymentActions.ts:53) against selfFundedPrepayment Procedures. Amount is the Procedure fee (full) or a flat deposit (split); there is no estimate calculation, no estimated duration (DM-40), no contingency units, no letter template, no admin approval hold. The balance run nets it as a negative 'Less pre-payment deposit' line (invoiceBuild.ts, prePaidByProcedure; a full prepayment nets to $0 and a deposit larger than the fee is a negativeTotal exception, invoiceBuild.ts:417). Completion is BLOCKED while a required prepayment is unpaid (completionBlockersFor, lifecycle.ts:93), liftable only by an audited Card.prepaymentOverride (types.ts:352). Status is derived (prepaymentStatusFor, selectors.ts:372).

**Impact.** Booking gains prepayment {required (derived), amount, invoiceId}; add a pure estimator in domain/billing and a PrepaymentLetterTemplate master; the 'prePayment' Invoice kind stays but is generated at booking setup into a held (not sent) state and sent on admin approval. Remove the deposit/split form (prepaymentDetail.split) and the completion gate with its audited override: the old hard-gate ruling is superseded by US-06.3.2 and OQ-57, but check the Decisions log before deleting. The unpaid prepayment becomes a warning (DM-31). Remaining-balance invoice links to the prepayment invoice; excess prepaid creates nothing. Depends on DM-01, DM-10, DM-19, DM-22 and DM-40 (estimated duration). Persisted seed shape changes.

**Verification (corrected).** Confirmed: completion blocked by 'prepaymentUnpaid' (lifecycle.ts:93-135) liftable only by the audited override (types.ts:352), raisePreProcedureInvoice is an on-demand office action (prepaymentActions.ts:53), deposit via prepaymentDetail, balance run nets prePaidByProcedure (selectors.ts:350-362), status derived (selectors.ts:372). Corrected: estimated duration is per Procedure (US-06.2.5), not on the Booking; split out as DM-40. US-06.3.2 (no block) is Confirmed; US-06.2.1/.2 and US-06.3.1 Verify; OQ-57, OQ-58 Answered; OQ-38, OQ-61, OQ-73, OQ-75 open.

**Catalogue:** [EP-06](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/EP-06.md), [FT-06.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-06.2.md), [FT-06.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-06.3.md), [FT-06.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-06.4.md), [US-06.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.2.2.md), [US-06.2.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.2.3.md), [US-06.2.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.2.4.md), [US-06.2.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.2.5.md), [US-06.3.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.3.1.md), [US-06.3.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.3.2.md), [US-06.3.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.3.4.md), [US-06.3.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.3.5.md), [US-06.3.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.3.6.md), [US-06.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.4.1.md), [US-06.4.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.4.2.md), [US-08.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.2.2.md), [OQ-03](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-03.md), [OQ-38](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-38.md), [OQ-50](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-50.md), [OQ-57](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-57.md), [OQ-58](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-58.md), [OQ-61](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-61.md), [OQ-73](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-73.md), [OQ-75](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-75.md)

**Prototype:** `aa-prototype/src/domain/types.ts:352`, `aa-prototype/src/domain/types.ts:426`, `aa-prototype/src/store/prepaymentActions.ts:53`, `aa-prototype/src/store/lifecycle.ts:93`, `aa-prototype/src/store/selectors.ts:372`, `aa-prototype/src/domain/billing/invoiceBuild.ts:456`

## DM-21

### Trust account: prepayment held pending, refunded in full on cancellation, kept when the Booking moves

**Kind:** NewEntity · **Size:** M

**Catalogue says.** Prepayment money is held in AA's trust account as a pending payment and not paid to the anaesthetist until the procedure is done. A cancelled Booking's prepayment is always refunded in full to the patient from the trust account, even if the anaesthetist would otherwise have been paid; payments out of the trust account are made from the system. A prepaid Booking moved to another anaesthetist keeps the agreed amount, is not billed again, the prepayment's draft payable is repointed and the doer is payee (US-06.5.4; to confirm with Ben, OQ-70). Trust payments go out weekly, other payables on the 20th (OQ-47).

**Prototype has.** Nothing. cancelCard soft-cancels a Card (lifecycle.ts:363) with no reference to prepayment money; no refund, trust account or hold concept. The payable to the anaesthetist is released as soon as money is received, pro rata (XeroAccPay.amountAuthorised, types.ts:780), so there is no 'pending until the procedure is done' state.

**Impact.** New TrustAccount balance and refund entries wired to Booking cancellation and credit notes (DM-24), plus a payable hold: a prepayment payable stays DRAFT until the Booking's List is AUTHORISED (and so paid to whoever did it, DM-06). Only demonstrable once the ledger exists (DM-22). Weekly versus monthly payment day is open (OQ-47), keep it a payments-run setting.

**Verification (upheld).** Confirmed: cancelCard (lifecycle.ts:363) has no money handling; payables release pro rata on receipt (payablesActions.ts, xeroHandoff.ts:234) with no 'pending until the procedure is done' state. FT-06.5 and US-06.5.x Verify; OQ-70, OQ-47 open. US-06.5.2 records the refund as a credit against the prepayment invoice, so this also depends on DM-24.

**Catalogue:** [FT-06.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-06.5.md), [US-06.5.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.5.1.md), [US-06.5.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.5.2.md), [US-06.5.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.5.3.md), [US-06.5.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.5.4.md), [US-02.5.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.5.3.md), [US-10.2.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-10.2.6.md), [OQ-21](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-21.md), [OQ-40](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-40.md), [OQ-47](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-47.md), [OQ-70](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-70.md)

**Prototype:** `aa-prototype/src/store/lifecycle.ts:363`, `aa-prototype/src/domain/types.ts:780`, `aa-prototype/src/store/payablesActions.ts:146`

## DM-22

### Internal ledger: promote BillingCase into linked receivable and payable records (Xero stays a mirror)

**Kind:** ChangedEntity · **Size:** L

**Catalogue says.** For every invoice the engine creates a linked receivable (from the billable party) and payable (to the anaesthetist) in its own ledger, linked to each other, to the Booking and to Procedures. It tracks dollars in (receipts) and out (disbursements) as two separate states and is the system of record: patient and anaesthetist history survive Xero contact archiving, and apps read balances from it. Xero holds a mirrored ACCREC and a DRAFT ACCPAY created together and linked by the returned Xero IDs; ACCPAY is authorised for exactly the amount received; both carry the engine's unique invoice number (payable with a '-P' suffix). The ACCPAY is a buyer-created tax invoice (BCTI), one per procedure (US-09.1.4 note, yet also 'the same value as its receivable', OQ-42, so a pair per invoice and a BCTI per Procedure are not yet reconciled), anaesthetist as supplier and AA as agent (new IRD name to confirm, GST presentation OQ-29). Xero never holds NHI or other PII, only a unique ID.

**Prototype has.** A de facto ledger exists at invoice level: BillingCase (types.ts:697), one per invoice, with invoiceId, accRecId, accPayId and cumulative receivedAmount, authorisedAmount, disbursedAmount held as independent axes (status is a derived label). Apps read this mirror, never Xero, and receipts are an append-only idempotent set (BillingReceipt, types.ts:742). The Xero simulation (XeroAccRec, XeroAccPay, PaymentIn, Disbursement; types.ts:769-815) mirrors it; contacts key on the hidden ID (xeroHandoff.ts) and an archived contact is unarchived before invoicing (aligned). Missing: separate receivable and payable records with their own numbers (no '-P' payable number), links from each to Booking and Procedures, BCTI presentation, credit legs, AA-fee and additional-invoice legs, and patient-level history as first-class ledger data (today joined through Cards).

**Impact.** Foundation for the money side but an evolution, not a rewrite: promote BillingCase into a LedgerPair (receivable leg and payable leg, each with its own number, amount, received or disbursed entries and Xero IDs, plus Booking and Procedure links, and the payee anaesthetist stamped at authorisation). The Xero slice stays as simulated mirrors. Selectors, payment and payables actions, GST schedule source, Accounts screens and the Demo Xero simulator re-point to the pair. Must precede DM-18, DM-20, DM-21, DM-23, DM-24, DM-25, DM-26 and DM-29. Seed and PERSIST_VERSION change.

**Verification (corrected).** Upheld as an evolution of BillingCase (types.ts:697-732 holds received, authorised, disbursed as independent axes; receipts append-only, types.ts:742; Xero mirror types.ts:769-815). Corrected: added the cardinality ambiguity, US-08.3.1 pairs every invoice while US-09.1.4 says one BCTI per procedure; a pair per invoice is the safe reading and per-Procedure BCTIs would need ledger lines per Procedure (US-05.3.5). EP-08 and FT-08.3 Confirmed, US-09.1.x Proposed; OQ-29 open.

**Catalogue:** [EP-08](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/EP-08.md), [FT-08.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-08.3.md), [US-08.3.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.3.1.md), [US-08.3.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.3.2.md), [US-08.3.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.3.3.md), [US-08.3.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.3.4.md), [US-08.4.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.4.3.md), [US-08.4.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.4.5.md), [EP-09](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/EP-09.md), [US-09.1.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-09.1.1.md), [US-09.1.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-09.1.4.md), [US-09.3.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-09.3.1.md), [US-09.3.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-09.3.4.md), [US-10.1.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-10.1.2.md), [US-10.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-10.2.1.md), [US-10.2.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-10.2.3.md), [OQ-29](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-29.md), [OQ-30](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-30.md)

**Prototype:** `aa-prototype/src/domain/types.ts:697`, `aa-prototype/src/domain/types.ts:742`, `aa-prototype/src/domain/types.ts:769`, `aa-prototype/src/store/appStore.ts:43`, `aa-prototype/src/store/xeroHandoff.ts:153`, `aa-prototype/src/store/paymentActions.ts:78`, `aa-prototype/src/store/payablesActions.ts:146`

## DM-23

### Derived ledger positions: whole ledger, per anaesthetist and per patient, and a flat outstanding list with no ageing

**Kind:** NewRelationship · **Size:** M

**Catalogue says.** Admins see the ledger in or out of balance at three scopes: whole ledger (receivables outstanding, receipts held, payables due, amounts disbursed, any imbalance), a single anaesthetist, and a single patient (all invoices across every anaesthetist, paid, part paid or unpaid). Anaesthetists see a flat list of their own outstanding payables (about 100 rows, oldest first) with NO ageing buckets, age chips or Overdue view (OQ-59, accepted for now), and a date-ranged summary of received amounts with GST aligned to their GST period, plus a dashboard combining calendar, financial position and locum availability.

**Prototype has.** Balance figures derive from BillingCase and the Xero mirror (caseOutstandingAmount, selectors.ts:272; the outstanding list, selectors.ts:662) but there is no whole-ledger in-balance view and no patient-scoped ledger screen. The anaesthetist dashboard is partly seeded demo figures (seed/anaesthetistDashboard.ts). Patient outstanding is only a boolean 'has unpaid prior episode' (selectors.ts:285). Ageing buckets and an Overdue view exist (bucketForAgingDays in dateDays.ts; receivablesAgingFor and overdueAccountsFor, selectors.ts:676-700) which the catalogue now drops.

**Impact.** Pure derived selectors over the DM-22 ledger, no new stored entity: balance totals with an imbalance figure, per-anaesthetist and per-patient rollups, a patient invoice list. Retire the seeded dashboard figures where a derivation exists and remove the ageing and overdue UI. New Admin views; web dashboard and Accounts screen re-point. Depends on DM-22.

**Verification (upheld).** Confirmed: ageing and Overdue selectors exist (selectors.ts:662-700, bucketForAgingDays in dateDays.ts), no whole-ledger imbalance view, no patient-scoped ledger screen (admin screens list has no patient view), dashboard partly seeded (seed/anaesthetistDashboard.ts). OQ-59 Answered 'for now'; FT-13.2 and US-13.2.x Confirmed, US-08.3.5 and US-12.2.3 Proposed.

**Catalogue:** [FT-13.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-13.2.md), [US-13.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.2.1.md), [US-13.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.2.2.md), [US-08.3.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.3.5.md), [US-11.3.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.3.1.md), [FT-12.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-12.2.md), [US-12.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-12.2.1.md), [US-12.2.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-12.2.3.md), [OQ-59](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-59.md)

**Prototype:** `aa-prototype/src/store/selectors.ts:272`, `aa-prototype/src/store/selectors.ts:662`, `aa-prototype/src/store/selectors.ts:676`, `aa-prototype/src/domain/seed/anaesthetistDashboard.ts`, `aa-prototype/src/apps/web/screens/AccountsScreen.tsx`

## DM-24

### A wrong invoice is credited in full, then rebilled (credit note, payable reversal, new invoice)

**Kind:** NewLifecycle · **Size:** L

**Catalogue says.** An issued invoice is never edited, retracted or partly adjusted. An admin credits it in full (credit note against the receivable for the whole amount, reversal of the linked payable, Xero ACCREC and ACCPAY reversed and recreated together) and bills a new corrected invoice with its own number; credit note and new invoice each link to the original. The credit note must reach the billable party (Xero does not send them). An AA-side error is fixed this way (OQ-19); otherwise an unpaid invoice stays outstanding with no patient fallback. After the anaesthetist has been paid, the reversal is a negative invoice (DM-25). Every step is audited.

**Prototype has.** No credit note, reversal or rebill. retryBillingCase (billingRun.ts:285) re-runs a FAILED case only; XeroAccRec has a 'voided' status (types.ts:777) that nothing drives; negative invoices are refused (negativeTotal, invoiceBuild.ts:417). Correction after invoicing is unsupported except through the post-op addendum.

**Impact.** New CreditNote record (originalInvoiceId, amount, reason, issuedBy) with ledger reversal legs, Invoice.creditedBy and rebilledAs links, an admin action that credits and opens a rebill from the original Booking's data, and a simulated Xero credit-note path. Depends on DM-22 and DM-27; DM-25 covers the paid-anaesthetist case.

**Verification (upheld).** Confirmed: retryBillingCase retries FAILED cases only (billingRun.ts:285), XeroAccRec 'voided' is typed (types.ts:777) but nothing sets it, negative totals are refused (invoiceBuild.ts:417), no credit note or rebill. US-08.6.2 Verify; OQ-19, OQ-28, OQ-42 Answered.

**Catalogue:** [US-08.6.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.6.2.md), [FT-08.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-08.6.md), [US-06.5.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.5.2.md), [OQ-19](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-19.md), [OQ-28](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-28.md), [OQ-36](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-36.md), [OQ-42](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-42.md)

**Prototype:** `aa-prototype/src/domain/types.ts:777`, `aa-prototype/src/store/billingRun.ts:285`, `aa-prototype/src/domain/billing/invoiceBuild.ts:417`

## DM-25

### Negative invoice to the anaesthetist, netted in the payment run and shown on a remittance advice; BCTIs approved per period

**Kind:** NewEntity · **Size:** M

**Catalogue says.** A refund after the anaesthetist has been paid is a credit note to the billable party offset by a negative invoice to the anaesthetist, netted against their positive payables in the next payment run (for example 19 positive and one negative), and shown on the remittance advice. With no later payment to net against, recovery is open (OQ-71). Once the BCTIs for a payment period are generated they are approved for payment before being paid; who approves and how it relates to releasing a payable when its receivable is paid is open (OQ-47). Payments are weekly for trust money, the 20th monthly otherwise.

**Prototype has.** A payables run exists (payablesActions.ts:146) that pays each ACCPAY's increment (amountAuthorised minus amountDisbursed) and records Disbursement rows carrying a payablesRunId string (types.ts:809). There is no PayablesRun record, no negative amounts anywhere, no remittance advice entity and no period approval step: release is automatic pro rata when money is received.

**Impact.** New PayablesRun record (period, status, approvedBy), signed payable amounts with netting in the run, and a RemittanceAdvice view per anaesthetist per run listing invoices paid and negatives netted. A period-approval gate sits between BCTI generation and the run. Depends on DM-22 and DM-24; interacts with the trust hold (DM-21). OQ-47 and OQ-71 are open, so model the run record and netting but leave recovery and approver undecided.

**Verification (upheld).** Confirmed: runPayables disburses authorised minus disbursed (payablesActions.ts:146); payablesRunId is only a counter-allocated id string (payablesActions.ts:73-76, Disbursement types.ts:809), no PayablesRun record, no negative amounts, no remittance entity, no approval step. US-10.2.5 and US-10.2.6 Verify; OQ-47 and OQ-71 open.

**Catalogue:** [US-10.2.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-10.2.5.md), [US-10.2.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-10.2.6.md), [US-10.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-10.2.1.md), [FT-10.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-10.2.md), [US-09.1.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-09.1.4.md), [US-08.6.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.6.2.md), [OQ-42](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-42.md), [OQ-47](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-47.md), [OQ-71](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-71.md)

**Prototype:** `aa-prototype/src/store/payablesActions.ts:146`, `aa-prototype/src/domain/types.ts:809`

## DM-26

### AA fee is a separate monthly invoice from AA to each anaesthetist, built from fee settings (not a deduction on the payable)

**Kind:** NewEntity · **Size:** M

**Catalogue says.** At month end a fee invoice run raises one invoice per anaesthetist: fixed charges (possibly several items) plus a charge per BCTI issued to them in the month, set on a settings page (for example $500 + $5 x 40 = $700). It is a separate ledger item from any procedure's receivable and payable, the one flow where money goes from the anaesthetist to AA, and the anaesthetist sees it and its payment status in their app. Open: what the per-invoice charge counts, whether only paid invoices count, whether it nets against payables, the fixed schedule and whether it varies by anaesthetist (OQ-60).

**Prototype has.** An illustrative fixed 5% service fee (AA_SERVICE_FEE_RATE, agencyFee.ts:7) is deducted from each ACCPAY at handoff: XeroAccPay stores grossAmount, serviceFeeRate, serviceFeeAmount and net amountPayable (types.ts:780; xeroHandoff.ts:234; seeded history uses it too, seed/history.ts:265). No fee invoice entity, no AA-to-anaesthetist receivable, no fee settings and no anaesthetist-facing view.

**Impact.** Change the payable to the gross procedure amount and add AaFeeInvoice (anaesthetistId, period, items, per-BCTI count and charge, total, status) with its own receivable from the anaesthetist, an AaFeeSettings record (fixed items, per-invoice rate) behind an Admin settings page, a monthly run action and an anaesthetist app view. Changes ACCPAY amounts everywhere shown (Demo Xero, Accounts, payables run) and reseeds history. Depends on DM-22. Keep the open OQ-60 variants as settings, not code.

**Verification (upheld).** Confirmed: fixed 5% AA_SERVICE_FEE_RATE (agencyFee.ts:7) deducted at handoff (xeroHandoff.ts:234), stored on XeroAccPay (types.ts:787-792) and seeded history. US-10.3.1 and US-10.3.3 Verify, US-10.3.2 Proposed; OQ-60 open. US-09.1.4's note ('each BCTI is the same value as its receivable') supports a gross payable.

**Catalogue:** [FT-10.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-10.3.md), [US-10.3.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-10.3.1.md), [US-10.3.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-10.3.2.md), [US-10.3.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-10.3.3.md), [EP-10](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/EP-10.md), [OQ-02](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-02.md), [OQ-60](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-60.md)

**Prototype:** `aa-prototype/src/domain/billing/agencyFee.ts:7`, `aa-prototype/src/domain/types.ts:780`, `aa-prototype/src/store/xeroHandoff.ts:234`, `aa-prototype/src/domain/seed/history.ts:265`

## DM-27

### Invoice entity: numbering, supplier and agent presentation, email, delivery, lineage and new kinds

**Kind:** ChangedEntity · **Size:** M

**Catalogue says.** Every invoice has a unique number (the remittance-matching key; the payable carries it plus '-P'), is presented in the anaesthetist's name with their GST number and AA as agent, takes its layout (Contract holder or patient) and delivery method (email or portal upload) from the Contract, is sent to the Booking's invoice email, holds prices GST-exclusive with inclusive derived, and any past invoice can be regenerated exactly from locked data. Kinds needed: standard, prepayment, remaining balance, additional, event, credit note, negative (anaesthetist side) and AA fee.

**Prototype has.** Invoice (types.ts:662): invoiceNumber, caseReference, cardId, counterparty, layout, kind 'standard' | 'prePayment', subtotal, gst, total, raisedAtISO, emailedAtISO. No invoice email, delivery method, supplier or agent fields, procedure link, original-invoice link or any other kind. GST is 15% on ex-GST lines (invoiceBuild.ts GST_RATE); layout is derived from counterparty kind (layoutFor, invoiceBuild.ts:216), not from the Contract. Balance-after-prepayment is not a distinct kind.

**Impact.** Add recipientEmail, deliveryMethod, supplier (anaesthetist with GST number), agent, procedureIds, originalInvoiceId and widen kind. The invoice document component and email step change; layout and delivery become Contract-driven. Depends on DM-07 and DM-11; DM-17, DM-18, DM-24, DM-25 and DM-26 each add a kind.

**Verification (upheld).** Confirmed: Invoice (types.ts:662-676) has kind 'standard' | 'prePayment' only, no email, delivery, supplier or lineage fields; layout derived from counterparty kind (invoiceBuild.ts:216). US-08.4.x Proposed, US-08.4.2 Confirmed, US-04.2.8 Proposed; OQ-29 open.

**Catalogue:** [FT-08.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-08.4.md), [US-08.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.4.1.md), [US-08.4.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.4.2.md), [US-08.4.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.4.3.md), [US-08.4.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.4.4.md), [US-08.4.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.4.5.md), [US-04.2.8](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.8.md), [US-05.2.7](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.2.7.md), [US-06.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.4.1.md), [OQ-29](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-29.md)

**Prototype:** `aa-prototype/src/domain/types.ts:662`, `aa-prototype/src/domain/billing/invoiceBuild.ts:216`, `aa-prototype/src/apps/admin/screens/InvoiceDocument.tsx`, `aa-prototype/src/store/billingRun.ts:398`

## DM-28

### A Contract payment setting (full or split) drives a second invoice; grouping by billable party is already aligned

**Kind:** ChangedEntity · **Size:** M

**Catalogue says.** One invoice per distinct billable party within a Booking. A Contract's payment setting is FULL (the assigned party pays the whole line) or SPLIT (the line item is divided between parties, for example an insurer and the patient's gap, with an invoice each). The split basis (percentage only, percentage or free field, typed $ or %), whether percentages must total 100, whether the Contract or the Booking sets it, and whether it is a per-Contract default are open (OQ-23, OQ-68). Billing failure is per Booking: other Bookings on a List still invoice; if any Procedure's billable party fails the whole Booking is held back for a manual fix (OQ-05).

**Prototype has.** Grouping already is one invoice per Card per distinct counterparty (buildInvoicesForCard, invoiceBuild.ts:264), and failure is already per Card: a build exception fails the whole Card and the List's other Cards still bill (billingRun.ts:95-165, ALIGNED, no change). Splitting one Procedure between funders uses BillingLine.funderOverride (types.ts:518-530) with a to-the-cent conservation rule (setProcedureFunderAllocation, billingLineActions.ts:218): an office-set per-line allocation, not a Contract-declared payment setting.

**Impact.** The grouping key does not change: US-08.2.1 groups by 'the billable party each Procedure has', which the prototype already resolves per Procedure; DM-11 only changes where that party comes from. funderOverride and its conservation logic can stay as the demo mechanism until OQ-68 settles, or be replaced by Contract.paymentSetting SPLIT generating a second invoice. Low urgency; leave until DM-07, DM-11 and DM-22 land.

**Verification (corrected).** Corrected: the draft said the grouping key moves to a Booking-level party; US-08.2.1 groups per Procedure's party, which is what buildInvoicesForCard does (invoiceBuild.ts:264), and per-Booking failure is aligned (billingRun.ts:95-165). The only delta is Contract.paymentSetting SPLIT versus the office-set funderOverride (types.ts:518-530, billingLineActions.ts:218). US-04.2.12, US-08.2.1/.3, US-08.5.2 Verify; OQ-68 open (OQ-23 and OQ-05 Answered).

**Catalogue:** [FT-08.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-08.2.md), [US-08.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.2.1.md), [US-08.2.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.2.3.md), [US-08.5.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.5.2.md), [US-04.2.12](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.12.md), [US-11.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.4.1.md), [OQ-05](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-05.md), [OQ-23](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-23.md), [OQ-68](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-68.md)

**Prototype:** `aa-prototype/src/domain/billing/invoiceBuild.ts:264`, `aa-prototype/src/domain/types.ts:518`, `aa-prototype/src/store/billingLineActions.ts:218`, `aa-prototype/src/store/billingRun.ts:95`

## DM-29

### GST schedule is on a cash basis of payables actually paid, not of amounts received

**Kind:** RuleChange · **Size:** S

**Catalogue says.** Each anaesthetist gets a GST schedule aligned to their own GST period: the sales AA made for them, the GST component of each, and a check that it balances with what they were paid. GST is on a cash basis, so only payables AA actually paid them in the period are listed; anything outstanding falls into a later period. Ben wants it very early (release not confirmed).

**Prototype has.** gstActivityFor (selectors.ts:709) lists amounts RECEIVED from payers (BillingReceipt rows with grossAmount and gstAmount at receipt, types.ts:742), windowed by the anaesthetist's gstPeriod. It is keyed on money in, not on Disbursement rows (types.ts:809), and has no balance check against payments made.

**Impact.** Re-source the schedule from disbursed payables (via the ledger payable record, DM-22) and add the balance check. Small, but the receipt-based version must not be shown as the GST schedule. Depends on DM-22 and, for a period-based payment run, DM-25.

**Verification (upheld).** Confirmed: gstActivityFor lists BillingReceipt rows (money received) windowed by the anaesthetist's period (selectors.ts:709-737), keyed on receipts not Disbursement rows, no balance check. US-12.2.2 is Verify, US-12.1.2 Proposed.

**Catalogue:** [US-12.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-12.2.2.md), [US-12.1.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-12.1.2.md), [US-05.2.7](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.2.7.md), [EP-12](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/EP-12.md), [FT-12.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-12.2.md)

**Prototype:** `aa-prototype/src/store/selectors.ts:709`, `aa-prototype/src/domain/types.ts:742`, `aa-prototype/src/domain/types.ts:809`

## DM-30

### Patient: NHI required, missing NHI as a flagged problem list, Booking proceeds but authorising is blocked

**Kind:** RuleChange · **Size:** M

**Catalogue says.** One patient record per NHI (both formats validated) with a hidden internal ID for billing and ledger; NHI never goes to Xero (OQ-30, settled). Proposed: the system's own patient ID as the key with the NHI attached later as a second unique index (OQ-49). The NHI is required: a patient without one is an exception on a problem list (showing patient, List and surgeon's rooms) to be resolved, and the anaesthetist sees the NHI or 'NHI missing' on each Booking. Working assumption until OQ-49: the Booking, Procedures and Contracts go ahead flagged, and authorising the List is blocked until the NHI is added. The NHI can be refreshed from the central register. Duplicates found later are part of OQ-49.

**Prototype has.** Patient.nhi is OPTIONAL (types.ts:103-105) and a provisional record is created without one (upsertPatient 'createdProvisional', intake.ts:52-127); NHI is validated for both formats and the hidden internal ID is already the key (aligned). No problem list, and nothing stops authoriseList for a Booking whose patient has no NHI. The NHI shows on mobile List and Card detail with a badge but no explicit 'NHI missing' state (CardDetailBody.tsx:317).

**Impact.** Mostly rules and views with a small model change: a derived missing-NHI exception set feeding an Admin problem list, an 'NHI pending' state on the patient, an authorise guard for Lists holding such Bookings, and an attach-NHI action that merges onto an existing record. The provisional-versus-blocked decision (OQ-49) determines whether the current createdProvisional path stays. The warning surface is DM-31.

**Verification (upheld).** Confirmed: Patient.nhi optional (types.ts:105), upsertPatient creates a provisional record with no NHI (intake.ts:97-127), authoriseList has no NHI check (lifecycle.ts:277-310), no problem list. US-11.1.4 is Open (OQ-49) and US-11.1.5 Proposed; the 'authorising blocked' rule is only the working assumption in US-11.1.4.

**Catalogue:** [FT-11.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-11.1.md), [US-11.1.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.1.1.md), [US-11.1.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.1.2.md), [US-11.1.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.1.4.md), [US-11.1.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.1.5.md), [US-03.1.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.1.5.md), [US-14.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-14.4.1.md), [OQ-30](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-30.md), [OQ-49](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-49.md)

**Prototype:** `aa-prototype/src/domain/types.ts:103`, `aa-prototype/src/store/intake.ts:52`, `aa-prototype/src/store/lifecycle.ts:277`, `aa-prototype/src/shared/card/CardDetailBody.tsx:317`

## DM-31

### One warning routine and a Warning record on the Booking, a dashboard to-do list and a flag in both apps (soft, never blocks)

**Kind:** NewEntity · **Size:** M

**Catalogue says.** One routine checks Bookings and their billable parties and raises warnings, several per Booking if need be, of a before-procedure or after-procedure kind, mild or strong, each with text. Current warnings: unpaid prepayment, billable patient with an amount owing (mild under the threshold, strong over it, 90 days to start and admin-changeable, owing amounts only, OQ-74 refines), under-18 patient as billable party (mild), out-of-range base units (after-procedure, for the office). Warnings never block saving, submitting or authorising. Open warnings show on the admin dashboard as a to-do list where an admin can clear them, and as a small triangle on the Booking in both apps (tap to read); submitting a Booking with a warning asks for a short confirm. A settings page for thresholds and switching off checks is Future Work (US-13.7.4).

**Prototype has.** No common warning model. Scattered soft signals: ListConflict on the List (availability or holiday; types.ts:265), computed review flags with no record or clearing (reviewFlags.ts: not completed, missing reference, ACC advisory, manual unit override), a boolean row.outstandingPriorBalance (selectors.ts:492), and HARD blocks where the catalogue now wants warnings: the prepayment completion gate (lifecycle.ts:93), out-of-range base refusal (validateCardForBilling) and an insurer-direct-claim failure. No under-18 check, no age threshold, no clearable to-do list, no Booking-level flag, no submit-confirm step.

**Impact.** New Warning record (bookingId, kind, strength, text, source rule, clearedBy, clearedAt) produced by one pure routine in domain, with a selector feeding the Admin to-do list and a flag component on the Booking in both apps, plus a confirm step on anaesthetist submit. Converts several existing blockers and flags into warnings (DM-13, DM-20, DM-11, DM-30). The alert threshold needs an app-settings record (DemoSettings is the wrong home). ListConflict stays as the List-level flag (DM-04). Can be built early over today's data and extended as each source delta lands.

**Verification (upheld).** Confirmed: scattered soft signals (ListConflict types.ts:265, reviewFlags.ts, outstandingPriorBalance selectors.ts:492) and hard blocks the catalogue now wants as warnings (prepayment gate lifecycle.ts:93-135, out-of-range base validateCardForBilling.ts:152-162, insurer direct-claim :174). US-13.7.1/.2/.3 Verify, US-11.2.4 Confirmed; US-13.7.4 is in the Future Work lane and stays out. OQ-41, OQ-54, OQ-56, OQ-57 settled or answered; OQ-74 open.

**Catalogue:** [FT-13.7](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-13.7.md), [US-13.7.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.7.1.md), [US-13.7.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.7.2.md), [US-13.7.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.7.3.md), [US-11.2.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.2.4.md), [US-11.3.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.3.2.md), [US-06.3.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.3.2.md), [US-03.3.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.3.1.md), [US-01.5.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.5.2.md), [OQ-41](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-41.md), [OQ-54](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-54.md), [OQ-56](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-56.md), [OQ-57](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-57.md), [OQ-74](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-74.md)

**Prototype:** `aa-prototype/src/domain/types.ts:265`, `aa-prototype/src/apps/admin/reviewFlags.ts`, `aa-prototype/src/store/selectors.ts:492`, `aa-prototype/src/store/lifecycle.ts:93`, `aa-prototype/src/domain/billing/validateCardForBilling.ts:104`

## DM-32

### Surgeon profile, surgeons' rooms, blacklist, surgeon groups and hospital contact email

**Kind:** NewEntity · **Size:** L

**Catalogue says.** Surgeons belong to rooms; a room is master data holding a contact email (and phone). A surgeon profile holds the NZ medical registration number and one HPI CPN (Common Person Number: the one identifier, the surgeon's unique index; the anaesthetist profile holds one too, OQ-52). A blacklist of anaesthetist and surgeon pairings is kept by admin staff; it gives a soft warning, never a block, when a List or Draft List is assigned and when an anaesthetist moves their own List into a colleague's Slot. Whether anaesthetists also keep their own (one list or two) and what each side learns are open (OQ-43); the name may become 'block list'. Hospitals hold a contact email for booking updates. Surgeon groups are master data and can hold Contracts.

**Prototype has.** Surgeon is only { id, name, specialty? } (types.ts:160); Hospital is { id, name } (types.ts:155). No room entity, no registration number or HPI CPN, no blacklist, no contact emails, no surgeon group with members. The Anaesthetist master already carries hpiId (types.ts:149, aligned).

**Impact.** New masters SurgeonRoom, extended Surgeon, SurgeonGroup (members), BlacklistEntry (and Hospital.contactEmail); seed with rooms and identifiers; Admin master-data editors and surgeon profile page; blacklist-aware pickers in List and Draft List assignment and in the anaesthetist's move (DM-05). Independent of most other work but required by the warnings in DM-03 and DM-05, the mailto draft (DM-35) and a Surgeon Group Contract holder (DM-07). Rename hpiId to HPI CPN in copy.

**Verification (upheld).** Confirmed: Surgeon is { id, name, specialty? } (types.ts:160), Hospital { id, name } (types.ts:155), no room, registration number, HPI CPN, blacklist, contact email or surgeon group; Anaesthetist.hpiId exists (types.ts:149). FT-13.6 and US-13.6.x Proposed; blacklist is soft-warn only (US-13.6.3); OQ-43 and OQ-52 open or answered as cited.

**Catalogue:** [FT-13.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-13.6.md), [US-13.6.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.6.1.md), [US-13.6.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.6.2.md), [US-13.6.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.6.3.md), [US-01.3.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.3.5.md), [US-01.4.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.4.5.md), [US-13.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.4.1.md), [US-02.3.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.3.3.md), [OQ-43](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-43.md), [OQ-52](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-52.md)

**Prototype:** `aa-prototype/src/domain/types.ts:155`, `aa-prototype/src/domain/types.ts:160`, `aa-prototype/src/domain/seed/cast.ts`, `aa-prototype/src/apps/admin/screens/MasterData.tsx`

## DM-33

### Anaesthetist profile: bank details, prepaid settings, start date, HPI CPN, admin-editable

**Kind:** ChangedEntity · **Size:** S

**Catalogue says.** The anaesthetist record holds contact details, registration number, HPI CPN, bank account details (held in the system, used for the payables run), dollar value per unit, GST period, prepaid RVG codes or groups (admin can maintain on their behalf) and, for Slot generation, a start date.

**Prototype has.** Anaesthetist (types.ts:141): registrationNumber, name, phone, email, unitValue, gstPeriod, hpiId, active. No bank account, no prepaid set, no start date, no GST number. editAnaesthetist and addAnaesthetist exist (mastersActions.ts:185, 241).

**Impact.** Additive fields (bankAccount, gstNumber for the supplier presentation in DM-27, startDate for DM-02, prepaidSettings via DM-19) and editor UI on Admin and anaesthetist profile screens. Bank details are display-only in the demo. Small; depends on DM-19.

**Verification (upheld).** Confirmed: Anaesthetist (types.ts:141-151) has no bank account, GST number, prepaid set or start date; editAnaesthetist and addAnaesthetist exist (mastersActions.ts:185, :241). US-12.1.4 Verify (bank details in the system, OQ-14 Answered), US-12.1.1/.2 Proposed.

**Catalogue:** [FT-12.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-12.1.md), [US-12.1.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-12.1.1.md), [US-12.1.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-12.1.2.md), [US-12.1.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-12.1.3.md), [US-12.1.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-12.1.4.md), [US-06.1.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.1.2.md), [US-01.1.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.1.3.md), [OQ-14](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-14.md), [OQ-52](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-52.md)

**Prototype:** `aa-prototype/src/domain/types.ts:141`, `aa-prototype/src/store/mastersActions.ts:185`, `aa-prototype/src/store/mastersActions.ts:241`

## DM-34

### Intake: import rows, admin match/create/reject decisions, unmatched queue and per-hospital sync state (St George's and Southern Cross only)

**Kind:** ChangedEntity · **Size:** L

**Catalogue says.** The priority pathway is the hospital download, imported as a file or synced automatically from St George's and Southern Cross (on a schedule, when the matching screen opens, and by a sync button, with last-synced time and failures shown). Every imported row gets an admin decision: match to an existing List and Booking (field differences shown first), create a Booking on an existing List, create a List in a Slot or a Draft List, or reject; unmatched rows stay in a queue. Sync only brings rows in; nothing applies until an admin decides. The surgeon PDF is second (read, correct fields such as an invalid NHI, then ingest) and is still needed. HL7 v2, FHIR R4, near real time, reliability monitoring and further feeds with automatic matching are Future Work; NHI lookup is in scope.

**Prototype has.** An HL7/FHIR-centred integration model: IntegrationFeed per hospital with a field mapping (types.ts:822), IntegrationMessage log with statuses and MSH-10 dedupe (types.ts:842), and a simulator that creates or updates Cards automatically on DRAFT Lists (integrationActions.ts:306) with a monitor screen. ingestPdfRow ingests a corrected PDF row (integrationActions.ts:431). Three feeds (St George's HL7, Christchurch Public HL7, Southern Cross FHIR; domain/integrations/feeds.ts). No import-row record, no admin decision, no unmatched queue, no last-synced state, no field-difference view and no Draft List target. NHI lookup already simulated (nzhis.ts lookupNhi).

**Impact.** New ImportBatch/ImportRow (hospital, source, raw fields, proposed match, decision MATCH | CREATE_BOOKING | CREATE_LIST | CREATE_DRAFT | REJECT | UNMATCHED, decidedBy) and a per-hospital SyncState (lastSyncedAt, lastError) for the two integrated hospitals. The matching screen must stop the automatic apply the simulator does today (contradicts US-02.1.5). The HL7/FHIR message model, retry and dead-letter monitor are Future Work: leave them behind the Demo panel, not extended. The unmatched queue and Draft List creation depend on DM-03 and DM-01.

**Verification (upheld).** Confirmed: three feeds incl. Christchurch Public HL7 (feeds.ts:24-27), simulator creates or updates Cards automatically (integrationActions.ts:306-), no import-row record, queue or sync state; NHI lookup exists (domain/nzhis.ts, ManualCardForm.tsx:79). FT-14.6 is cited only as the boundary: its stories US-14.6.1/.2 sit in the Future Work lane, as do US-14.1 to US-14.5 integration items, so only St George's and Southern Cross sync (US-02.1.5) is in scope. US-02.1.2 and US-02.1.4 Confirmed.

**Catalogue:** [FT-02.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-02.1.md), [FT-02.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-02.2.md), [US-02.1.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.1.1.md), [US-02.1.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.1.2.md), [US-02.1.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.1.3.md), [US-02.1.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.1.4.md), [US-02.1.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.1.5.md), [US-02.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.2.1.md), [US-02.3.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.3.1.md), [US-14.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-14.4.1.md), [FT-14.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-14.6.md), [OQ-13](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-13.md), [OQ-34](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-34.md)

**Prototype:** `aa-prototype/src/domain/types.ts:822`, `aa-prototype/src/domain/types.ts:842`, `aa-prototype/src/store/integrationActions.ts:306`, `aa-prototype/src/store/integrationActions.ts:431`, `aa-prototype/src/domain/integrations/feeds.ts:24`, `aa-prototype/src/apps/admin/screens/IntegrationMonitorScreen.tsx`

## DM-35

### Explicit-save change sets and the Booking update email draft (offered after a Booking change and after a List reassignment)

**Kind:** NewEntity · **Size:** M

**Catalogue says.** An admin edits a Booking and saves explicitly; the system holds what changed since the last save (field, before, after, who, when) in the append-only history and can draft a hospital update email via a mailto link (plain text, about 2,000 characters; subject, boilerplate, change list, To address). It is offered after any saved Booking change (to the surgeon's room) and after a List reassignment (to the hospital contact for a cover change); the admin can edit the address; the system sends and records nothing. Whether it is a prompt after saving or an on-demand button is open (OQ-69). Concurrent edits from different sources are caught at save by a row version (technical, OQ-07).

**Prototype has.** Every field edit commits immediately through mutate() and is audited per field (editCard and editProcedure, lifecycle.ts:415/445); audit is append-only with before and after (types.ts:645). No save boundary, no change-set entity, no row version, no mailto draft, no contact emails to address it to.

**Impact.** Admin-side editing becomes a draft-then-save form emitting one ChangeSet (grouped audit entries) and offering the mailto draft; needs the contact emails from DM-32. A Booking version counter is only needed to show concurrent-edit detection, best a Demo-panel button that simulates a same-field clash rather than a model change. Anaesthetist mobile flows keep immediate saves. Medium UI rework of the Admin Booking editor.

**Verification (upheld).** Confirmed: every edit commits immediately and is audited per field (editCard lifecycle.ts:415, editProcedure :445), no change-set entity, no row version, no mailto in the codebase, no contact emails. US-02.3.2 and US-02.5.6 Proposed, US-02.3.3 Verify; OQ-69 open.

**Catalogue:** [US-02.3.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.3.2.md), [US-02.3.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.3.3.md), [US-02.5.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.5.5.md), [US-02.5.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.5.6.md), [US-13.5.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.5.2.md), [US-01.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.4.1.md), [OQ-07](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-07.md), [OQ-46](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-46.md), [OQ-65](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-65.md), [OQ-69](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-69.md)

**Prototype:** `aa-prototype/src/domain/types.ts:645`, `aa-prototype/src/store/lifecycle.ts:415`, `aa-prototype/src/store/mutate.ts`, `aa-prototype/src/shared/card/HistoryTimeline.tsx`

## DM-36

### List visibility after invoicing: unbilled to billed, not vanished (low priority, contingent on AA)

**Kind:** ChangedLifecycle · **Size:** S

**Catalogue says.** US-07.4.1 (Open) says the List drops out of the anaesthetist's List view once its invoices are generated, and the invoices then appear as lines in outstanding balances, which is what the prototype does. Only a Note adds that AA said a List should move from unbilled to billed and processed, not simply vanish. The trigger event is open (OQ-31).

**Prototype has.** List.billedAtISO is stamped at the end of the List's billing run and removes the List from the anaesthetist's forward views (types.ts:323; billingRun.ts header, 'Lists vanish ... at invoice generation').

**Impact.** Not a firm delta: the story body matches the prototype. If AA confirms the Note, show an UNBILLED/BILLED status and a 'billed' section on mobile and web, derived from billedAtISO with no new entity. Low priority; agree the visible behaviour with AA first.

**Verification (corrected).** Downgraded: the requirement text matches the prototype (List.billedAtISO stamped at the end of the billing run removes the List from forward views, types.ts:323, billingRun.ts:7-12, ForwardListsScreen.tsx:62). The contrary evidence is a Note on an Open story (OQ-31). Kept as a contingent S item rather than dropped.

**Catalogue:** [FT-07.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-07.4.md), [US-07.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-07.2.1.md), [US-07.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-07.4.1.md), [OQ-31](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-31.md)

**Prototype:** `aa-prototype/src/domain/types.ts:323`, `aa-prototype/src/store/billingRun.ts:68`

## DM-37

### Anaesthetist Contract changes are flagged for office approval (derived from audit; the anaesthetist cannot change the Contract today)

**Kind:** ChangedLifecycle · **Size:** S

**Catalogue says.** Admin normally sets the Contract at booking setup; the anaesthetist may change it until they submit; every change is audited and flagged for office review; at SUBMITTED review the office approves or corrects the selections (and checks references, addresses and invoice emails). The engine reads the locked Contract only.

**Prototype has.** Review flags are computed views (reviewFlags.ts) over Card and Procedure data; Procedure.governingContractId has no record of who set or changed it or whether the office approved it. Mobile shows billing context read-only and the full billing-setup editor (EditBillingSetupSheet) is the office's, so the anaesthetist cannot change the Contract at all.

**Impact.** No new record needed: the audit trail already records who changed governingContractId, when and in which role, so derive the 'changed by the anaesthetist, awaiting office approval' flag from audit entries and add at most an office approval stamp at review. The real gap is that the anaesthetist cannot pick a Contract at all (US-03.4.1, Confirmed), solved by the filtered picker in DM-10; keep it simple for the anaesthetist (US-15.0.1). Depends on DM-10.

**Verification (corrected).** Confirmed: the Contract is chosen only in the office's EditBillingSetupSheet (shared/flows/EditBillingSetupSheet.tsx:60,112; shown via OfficeBillingSetup in CardDetailBody.tsx:684), review flags are computed (reviewFlags.ts). Corrected: a stored approval record is not needed because AuditEntry already carries who, role and before/after; the substantive gap is anaesthetist access (US-03.4.1 Confirmed), already inside DM-10. US-04.3.4 and US-07.2.2 Confirmed.

**Catalogue:** [FT-03.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-03.4.md), [US-03.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.4.1.md), [US-04.3.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.3.4.md), [US-07.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-07.2.2.md), [US-15.0.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-15.0.1.md), [OQ-26](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-26.md)

**Prototype:** `aa-prototype/src/apps/admin/reviewFlags.ts`, `aa-prototype/src/domain/types.ts:454`, `aa-prototype/src/shared/card/OfficeBillingSetup.tsx`

## DM-38

### Reference data: master public-holiday calendar, controlled-spreadsheet load, editable masters

**Kind:** ChangedEntity · **Size:** S

**Catalogue says.** Admins maintain hospitals (with contact email), surgeons, groups and rooms, insurers, anaesthetists, Slot statuses, recurring bookings, the master public-holiday calendar plus each hospital's own, RVG codes and groups, modifier codes and Contracts, all referenced by identity (changed once, reflected everywhere) except the billing snapshot. Go-live is a clean cut: reference data is loaded from AA-owned controlled spreadsheets with failing rows reported and not loaded; Solutions Plus supplies operation names only.

**Prototype has.** HospitalHoliday per hospital (types.ts:602) and PermanentList (types.ts:575, structurally the recurring booking; rename only) with add/edit actions (mastersActions.ts:320, 398, 443). No master statutory holiday calendar, no bulk or spreadsheet load, and several listed masters do not exist yet (rooms, procedure master, RVG groups, prepaid settings, fee schedule lines).

**Impact.** Add a statutory holiday master and, if demoable, a validated import step in Admin master data; the master-data screen grows with each new master from DM-07, DM-09, DM-13 and DM-32. Cutover loading is not a prototype feature, at most a demo button. Rename PermanentList to recurring booking in copy with DM-01's rename pass. Low risk; follows the other master-data deltas.

**Verification (upheld).** Confirmed: HospitalHoliday (types.ts:602) and PermanentList (types.ts:575, structurally the recurring booking, painted at roll-forward by clockActions.ts:43) exist; no master public-holiday calendar, no spreadsheet load. US-13.4.1 Confirmed names the master calendar; US-13.4.2/.3 and US-01.5.1 Proposed. Spreadsheet loading is not a prototype feature.

**Catalogue:** [US-13.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.4.1.md), [US-13.4.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.4.2.md), [US-13.4.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.4.3.md), [US-01.5.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.5.1.md), [US-01.3.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.3.2.md), [US-15.0.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-15.0.3.md)

**Prototype:** `aa-prototype/src/domain/types.ts:602`, `aa-prototype/src/domain/types.ts:575`, `aa-prototype/src/store/mastersActions.ts:320`, `aa-prototype/src/apps/admin/screens/MasterData.tsx`

## DM-39

### List-level attachments and Copy a Booking as a skeleton (copy is not the additional-procedure mechanism); a stored Booking source is optional

**Kind:** ChangedEntity · **Size:** M

**Catalogue says.** The anaesthetist can attach files or photos to a Booking or to a whole List. An ad hoc Booking can be entered manually or by photographing the physical card, which pre-fills the Booking for confirmation. Copy a Booking copies only the skeleton (patient, List, references), never procedure details. Additional Procedures belong to one Booking (FT-03.2). Booking source appears only as a descriptive list in domain-model.md (Booking > Sources); no story requires a stored field and the audit trail already records each change's source. The anaesthetist can search Bookings by NHI or patient name and jump to any past day from a calendar.

**Prototype has.** CardAttachment lives on Card only (types.ts:358, 393). Photo capture already exists as a simulation (PhotoCaptureFlow.tsx, canned sampleExtractions.ts feeding a pre-filled ManualCardForm). copyCard creates a NEW Card in the same List whose one Procedure is isAdditional from the start and inherits billing route, insurer, payer, payment category and contract from the source (cardActions.ts:179-236): Copy is the RFP's additional-procedure mechanism. No stored Booking source (audit source and correlationRef cover it), no List-level attachments, no search or calendar jump to past work.

**Impact.** Add List.attachments; a stored Booking.source is optional. Redefine copy as a skeleton Booking with a fresh primary Procedure and no inherited contract, payer or category; additional Procedures are added inside the Booking (addProcedure exists, cardActions.ts:394) and priced by DM-15. Folds into DM-01's rename pass; the copy change interacts with DM-10, DM-15 and seed Cards using copiedFromCardId. Search and calendar navigation are selectors and UI only.

**Verification (corrected).** Confirmed: CardAttachment only on Card (types.ts:358, 393); copyCard makes a new Card in the same List whose one Procedure is isAdditional and inherits route, insurer, payer, category and Contract (cardActions.ts:179-236); photo capture is simulated. US-02.4.3 and US-03.1.3 Proposed state copy is skeleton only and attachments may be on a List. Corrected: Booking.source is not a story requirement, so optional.

**Catalogue:** [US-03.1.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.1.3.md), [US-02.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.4.1.md), [US-02.4.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.4.3.md), [FT-02.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-02.4.md), [US-03.1.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.1.6.md), [US-03.1.7](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.1.7.md)

**Prototype:** `aa-prototype/src/shared/flows/PhotoCaptureFlow.tsx`, `aa-prototype/src/shared/flows/sampleExtractions.ts`, `aa-prototype/src/domain/types.ts:358`, `aa-prototype/src/store/cardActions.ts:179`, `aa-prototype/src/shared/flows/ManualCardForm.tsx`

## DM-40

### Estimated duration is recorded per Procedure from the surgeon's rooms and feeds the prepayment estimate

**Kind:** ChangedEntity · **Size:** S

**Catalogue says.** An admin records the estimated duration of a Procedure on the Booking when the surgeon's rooms give one, by email, phone or in their PDF list. The prepayment estimate uses it to work out time units by the standard tiered RVG rule; once the procedure is done the anaesthetist's recorded start and handover times decide the final time units. The surgeon's room master (DM-32) is who sends it. The contingency units and the check against the RVG 2021 text are open (OQ-38, OQ-75).

**Prototype has.** Nothing. Procedure holds only anaestheticStartISO and handoverISO (types.ts:498-499) and time units are computed from them (fee.ts:58); there is no estimate field, and PDF ingest (ingestPdfRow, integrationActions.ts:431) carries only scheduled time and operation.

**Impact.** New optional Procedure.estimatedDurationMin set on admin entry and on PDF ingest (DM-34). The pure prepayment estimator in domain/billing (DM-20) reads it through the tiered time rule already in fee.ts. Must land before DM-20's estimator; small on its own. Placement on the Procedure rather than the Booking follows US-06.2.5.

**Verification (added).** Added by the verifier: the draft put estimated duration on the Booking (DM-01, DM-20) but US-06.2.5 (Proposed) records it per Procedure, and nothing in the prototype holds it. Scope: US-06.2.4, US-06.2.5, US-02.2.1, US-13.6.1 all Proposed; OQ-38 and OQ-75 open.

**Catalogue:** [US-06.2.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.2.5.md), [US-06.2.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.2.4.md), [US-02.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.2.1.md), [US-13.6.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.6.1.md), [OQ-38](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-38.md), [OQ-75](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-75.md)

**Prototype:** `aa-prototype/src/domain/types.ts:498`, `aa-prototype/src/domain/billing/fee.ts:58`, `aa-prototype/src/store/integrationActions.ts:431`
