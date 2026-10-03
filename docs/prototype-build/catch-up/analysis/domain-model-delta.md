# Domain model delta: catalogue vs prototype

Read-only comparison of the entity, relationship and lifecycle model the requirements catalogue now describes (see [domain-model.md](../../../discovery-reference/Updated%20Requirements/domain-model.md)) with what `aa-prototype/` implements. The code is treated as the truth about the prototype; the old build docs were used only as leads. This version supersedes the pass written against catalogue commit `501b0b8` (2026-10-01); it re-grades every delta against the three 2026-10-02 updates ([morning](../../../discovery-reference/Updated%20Requirements/changes/2026-10-02-requirements-update.md), [requirements review](../../../discovery-reference/Updated%20Requirements/changes/2026-10-02-aa-requirements-review-with-greg.md), [booking and pricing review](../../../discovery-reference/Updated%20Requirements/changes/2026-10-02-aa-booking-and-pricing-review-with-greg.md)) and against the code as built through Phases 14, 15 and 15a (commit `3d3a18c`). Items with status Retired or Future, and stories in the Future Work swim lane, are excluded; the few that are cited (US-02.2.1, US-02.4.3, US-02.4.4, US-05.2.3) are boundary references that explain a removal or a deferral, never requirements to build.

**Summary.** 46 structural deltas (after an adversarial verification pass on 2026-10-03: DM-36 was dropped as not a delta, DM-47 was added, and DM-04, DM-10, DM-12, DM-23, DM-34 and DM-39 were corrected; each carries a **Verified** note). Since the 2026-10-01 pass: **6 new** (DM-41 to DM-46), **29 re-graded** because the catalogue changed, **10 unchanged** in substance (anchors refreshed), **1 closed** (DM-01, built in Phase 15) and **1 partly built** (DM-31, the warning routine from Phase 15a, counted among the re-graded). By kind: ChangedEntity 15, ChangedLifecycle 4, ChangedRelationship 3, NewEntity 12, NewLifecycle 2, NewRelationship 1, RemovedEntity 3, RuleChange 6. The code changed only through Phases 14, 15 and 15a (the Card to Booking rename, the optional `Booking.source`, List attachments, derived warnings with one rule and a stored clearance, the removal of the prepayment completion gate, demo-trigger plumbing); no other model area moved.

**What the 2026-10-02 updates did to the model.** Reversed: the billable party is now always defined by the Contract with no per-Booking override and no guardian record (DM-11); Copy a Booking is retired and the skeleton copy built in Phase 15 goes (DM-39); the additional invoice and credit are events on the Procedure, not separate mechanisms (DM-17, DM-18, DM-24); the update email is an on-demand button picking from the change history, not a prompt after saving (DM-35); a recurring booking that lands on an unavailable Slot becomes a Draft List, not a flagged List (DM-03). Settled: the logical Day, Slot and List model with stored Slots and editable status master data (DM-02, DM-04); base units live in default RVG Contracts, not on the RVG code or the procedure list (DM-43, DM-13). New: the shared notification pool (DM-41), moving a single Booking (DM-42), default modifiers replacing absorbed modifiers (DM-44), the audit scope (DM-45), the Contract defined unit rate replacing hourly rate x time (DM-46).

**Order.** Done already: the rename (DM-01), the warning model and its one rule (DM-31), List attachments, and the removal of the prepayment gate (DM-20). Foundations that everything else ripples from: **DM-07** (Contract reshape), **DM-13 with DM-44 and DM-43** (master procedure list, default modifiers, base units in default RVG Contracts), **DM-02** (Slot and List split) and **DM-22** (ledger pair). Then **DM-10 and DM-11** (one Contract per Procedure, payer defined by the Contract), which need DM-07 and DM-13/DM-43; DM-09, DM-46, DM-15, DM-14, DM-16, DM-27 and DM-28 follow; DM-08 (the lock) closes the Contract track. Prepayment: DM-19 and DM-40 before DM-20; DM-21 needs DM-22 and DM-24. Schedule: DM-02, then DM-04 and DM-03; DM-32 (blacklist) and DM-41 (notification pool) before DM-05; then DM-42 and DM-06 (which re-check prepayment, so after DM-20). Intake: DM-34 after DM-03 and DM-10; DM-35 after DM-32 and DM-05. Money: DM-22 first, then the event kinds DM-17, DM-18 and DM-24 (with DM-27), then DM-25, DM-26, DM-23, DM-29. DM-31 absorbs each warning source as it lands; DM-30, DM-45 and DM-47 are small and free-standing (DM-47 follows DM-23).

**Suggested homes in the existing plan** (the plan update decides): DM-41 and DM-42 beside DM-05 and DM-06 in Phase 32; DM-43 and DM-44 with DM-13 in Phase 19 (before Phase 20 reads the first pick); DM-46 with the pricing bases in Phase 18, its capture path in Phase 24; DM-45 as a policy note in Phase 36 or 43; DM-39 now removes Copy, which Phase 15 built.

**Still moving (model shape may change).** OQ-62 and OQ-88 (one list or two, which carries the system code, default Contract count and the link to the hospital default, OQ-78), OQ-63 (event details), OQ-64 remainder (OQ-81 part 3 short-notice sickness, OQ-84 vacated Slot, OQ-85 single-Booking experience, OQ-86 Draft Lists pulled by anaesthetists), OQ-67 and OQ-78 (who a Contract belongs to, Greg's no-default-Contract model), OQ-68 (split basis, our pick), OQ-70 and OQ-80 (prepaid Booking moved, pair timing), OQ-49 (Booking without NHI), OQ-60, OQ-61 and OQ-76 (AA fee, shortfall, partial prepayment and over- or under-runs), OQ-66 (AA code format), OQ-69 and OQ-82 (update email, automatic email), OQ-77 (credit, rebill total), OQ-79 (what posts to the pool, expiry), OQ-89 (Contract defined rate, fixed fee), OQ-43, OQ-47, OQ-48, OQ-15, OQ-29.

**Already aligned, no delta.** DRAFT to SUBMITTED to AUTHORISED with no Returned state and the edit-rights rules (lifecycle.ts:48-72, :210-292); append-only audit through `mutate()`; soft cancel and no cancellation fee (lifecycle.ts:348); the Card to Booking rename, `Booking.source` and List attachments (Phase 15); derived warnings with a stored clearance, one rule, no gate (Phase 15a); hidden internal patient ID with NHI never sent to Xero and dual-format NHI validation; ACCREC plus draft ACCPAY pair with received and disbursed as independent amounts, pro-rata payable release and unarchive-before-invoicing; per-Booking billing failure that holds the whole Booking while the List's others bill (billingRun.ts:68-165); one invoice per distinct billable party per Booking (invoiceBuild.ts:264); tiered time units with part intervals rounded up (timeUnits.ts:13-31; the tiers are constants, noted in DM-15); per-anaesthetist unit value; HPI id on the anaesthetist (types.ts:149, rename to HPI CPN only); Insurer `acceptsDirectClaims`; protected default Contract per hospital and direct insurer (FT-04.4, mastersActions.ts:45); per-hospital holiday calendars; PermanentList (the catalogue's recurring booking, rename only; availability is already painted before it, canvas.ts:116-124, though the dropped booking should become a Draft List, DM-03); soft hospital-closure conflict flag; the office price override; roles anaesthetist, office and system; the ledger's per-Procedure share (US-05.3.5, via InvoiceLine). Not a model delta: the anaesthetist sign-in (US-13.5.3, OQ-83) is an external identity provider; the prototype only simulates its audit rows (authDemoActions.ts).

**Catalogue points that contradict each other (for the owner; the model follows the more specific item).**

- [EP-11](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/EP-11.md) still says each Booking carries its own billable party and invoice email that default to the patient; [FT-11.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-11.2.md), [US-11.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.2.2.md), [US-08.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.2.1.md) and the domain model say the Contract defines them with no per-Booking override (OQ-67). DM-11 follows the latter. [US-04.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.2.md) also calls billable party and invoice email "per-Booking values" the Contract only declares as required.
- The domain-model Contract category table still lists "RVG Default Pre-paid"; [US-04.1.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.1.1.md) and OQ-25 say there is no Pre-paid category. DM-07 follows US-04.1.1.
- The domain model keeps `RATE_TIME` (hourly) as a pricing basis; [US-05.2.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.2.6.md) now makes it a Contract defined unit rate, and [US-03.3.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.3.6.md) still treats it as a billing line outside BTM (OQ-89). DM-46 waits on OQ-89.
- [US-11.3.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.3.2.md) says admins can change the 90-day balance threshold; [US-13.7.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.7.4.md) (Future Work) says thresholds stay fixed until AA asks. DM-31 keeps the threshold in the existing app settings record.
- The domain model (section 1) still says the sync shows a last-synced time; [US-02.1.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.1.5.md) removed it. DM-34 makes the sync state optional.
- The domain model's Booking "Sources" bullet (domain-model.md) still lists "copy of another Booking" and a photo of the physical card; [US-02.4.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.4.3.md) is Retired and [US-02.4.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.4.4.md) is Future Work. DM-39 follows the stories.
- [US-01.6.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.6.3.md) lets an admin assign a Draft List onto an unavailable Slot with a soft warning, while [US-01.4.7](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.4.7.md) says the office does not assign work to someone marked unavailable without them knowing; [US-01.5.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.5.4.md) still lists a Booking landing on an unavailable anaesthetist's List as a conflict. DM-03 and DM-42 note it.

Sizes: S under a day, M a day or two, L several days, XL a week or more including seed, screens and tests. A rename or field move is cheap on its own; the size counts the ripple.

| ID | Kind | Title | Size | State |
| --- | --- | --- | --- | --- |
| [DM-01](#dm-01) | ChangedEntity | Card becomes Booking: closed in Phase 15; the booking-level state it also named is carried by DM-11, DM-20 and DM-31 | S | Closed |
| [DM-02](#dm-02) | ChangedEntity | Slot, List and Draft List are separate things: the prototype welds Slot and List together | XL | Re-graded |
| [DM-03](#dm-03) | NewEntity | Draft List: a List created with no anaesthetist, which can hold Bookings | L | Re-graded |
| [DM-04](#dm-04) | ChangedEntity | Availability is a status on the Slot, kept up from one calendar (with series), with the status values held as editable master data | M | Re-graded |
| [DM-05](#dm-05) | ChangedLifecycle | An anaesthetist moves their own List with no request and no office confirmation (replaces the cover request) | M | Re-graded |
| [DM-06](#dm-06) | RuleChange | Whoever submits a List did its procedures: a Booking done by someone else moves to their List, and its payable follows | M | Re-graded |
| [DM-07](#dm-07) | ChangedEntity | Contract is reshaped from Type 1/2/3 to category, holder, multi-dimension scope, pricing basis, aaCode and payment setting | XL | Re-graded |
| [DM-08](#dm-08) | NewLifecycle | Contract versions and the AUTHORISED snapshot (Contract and calculation inputs locked with the Procedure) | L | Unchanged |
| [DM-09](#dm-09) | ChangedEntity | ContractPrice becomes a full FeeScheduleLine chosen on the Procedure | L | Re-graded |
| [DM-10](#dm-10) | ChangedRelationship | Each Procedure selects exactly one Contract, picked procedure first, narrowed by the List's hospital; the billing-route step disappears | XL | Re-graded |
| [DM-11](#dm-11) | ChangedRelationship | Billable party and invoice email are defined by the Contract, with no per-Booking override; the guardian record goes | L | Re-graded |
| [DM-12](#dm-12) | RemovedEntity | Insurer and funding source belong to neither Patient nor Booking | S | Unchanged |
| [DM-13](#dm-13) | NewEntity | Master procedure list: procedures by body part with group, subgroup, RVG code or category and default modifiers, holding no base units | M | Re-graded |
| [DM-14](#dm-14) | ChangedEntity | Anaesthetist adjustment is a new Contract-gated record; the office override already exists | S | Unchanged |
| [DM-15](#dm-15) | RuleChange | Multi-procedure rule: one primary Procedure, time on every Procedure, modifier units split above four, per-Contract override | M | Re-graded |
| [DM-16](#dm-16) | ChangedEntity | Required Booking inputs per Contract and the 'confirm with hospital' flag on the Procedure | S | Unchanged |
| [DM-17](#dm-17) | NewEntity | Events on a Procedure: pre-op, post-op, additional invoice and credit are one element, with an invoice tick and one review step | L | Re-graded |
| [DM-18](#dm-18) | ChangedEntity | Additional invoice is a free-form admin invoice recorded as an event on a Procedure; it replaces the post-op addendum Booking | L | Re-graded |
| [DM-19](#dm-19) | NewEntity | Prepaid settings on the anaesthetist profile (RVG codes and groups) replace the per-Procedure payment category | M | Re-graded |
| [DM-20](#dm-20) | ChangedLifecycle | Prepayment lifecycle: automatic estimate at setup, admin approval before sending, all or nothing, a warning not a gate | L | Re-graded |
| [DM-21](#dm-21) | NewEntity | Trust account: prepayment held pending, refunded in full on cancellation, kept when the Booking moves | M | Re-graded |
| [DM-22](#dm-22) | ChangedEntity | Internal ledger: promote BillingCase into linked receivable and payable records (Xero stays a mirror) | L | Unchanged |
| [DM-23](#dm-23) | NewRelationship | Derived ledger positions: whole ledger, per anaesthetist and per patient, and a flat outstanding list with no ageing | M | Re-graded |
| [DM-24](#dm-24) | NewLifecycle | A wrong invoice is credited in full, then rebilled (credit note to any party, payable reversal, new invoice), recorded as events | L | Re-graded |
| [DM-25](#dm-25) | NewEntity | Negative invoice to the anaesthetist, netted in the payment run and shown on a remittance advice; BCTIs approved per period | M | Re-graded |
| [DM-26](#dm-26) | NewEntity | AA fee is a separate monthly invoice from AA to each anaesthetist, built from fee settings (not a deduction on the payable) | M | Re-graded |
| [DM-27](#dm-27) | ChangedEntity | Invoice entity: numbering, supplier and agent presentation, email, delivery, lineage and new kinds | M | Re-graded |
| [DM-28](#dm-28) | ChangedEntity | A Contract payment setting (full or split) drives a second invoice; shares are typed $ or % set on the Booking; grouping by billable party is already aligned | M | Re-graded |
| [DM-29](#dm-29) | RuleChange | GST schedule is on a cash basis of payables actually paid, not of amounts received | S | Unchanged |
| [DM-30](#dm-30) | RuleChange | Patient: NHI required, missing NHI as a flagged problem list, Booking proceeds but authorising is blocked | M | Unchanged |
| [DM-31](#dm-31) | NewEntity | One warning routine: the model is built (derived warnings, one rule, a stored clearance); the remaining rules, the to-do list and the Booking flag in both apps are not | M | Partly built |
| [DM-32](#dm-32) | NewEntity | Surgeon profile, surgeons' rooms, blacklist, surgeon groups and hospital contact email | L | Re-graded |
| [DM-33](#dm-33) | ChangedEntity | Anaesthetist profile: bank details, prepaid settings, start date, HPI CPN, admin-editable | S | Unchanged |
| [DM-34](#dm-34) | ChangedEntity | Intake: import rows, admin match/create/reject decisions, unmatched queue and sync from St George's and Southern Cross only | L | Re-graded |
| [DM-35](#dm-35) | NewEntity | Explicit-save change sets, an on-demand Booking update email draft picked from the change history, and email templates per kind of change | M | Re-graded |
| [DM-36](#dm-36) | (dropped) | List visibility after invoicing: not a delta, the catalogue body matches the prototype (watch item, OQ-31) | n/a | Dropped |
| [DM-37](#dm-37) | ChangedLifecycle | Anaesthetist Contract changes are flagged for office approval (derived from audit; the anaesthetist cannot change the Contract today) | S | Unchanged |
| [DM-38](#dm-38) | ChangedEntity | Reference data: master public-holiday calendar, recurring-booking vocabulary, controlled-spreadsheet load, editable masters | S | Re-graded |
| [DM-39](#dm-39) | RemovedEntity | Copy a Booking is retired: remove the copy action and its fields; photo capture is Future Work; List attachments are done | S | Re-graded |
| [DM-40](#dm-40) | ChangedEntity | Estimated duration is recorded per Procedure from the surgeon's rooms and feeds the prepayment estimate | S | Re-graded |
| [DM-41](#dm-41) | NewEntity | Shared notification pool in the Admin App: one pool for the whole team, newest first, for things that happened and need no action | M | New |
| [DM-42](#dm-42) | ChangedLifecycle | An anaesthetist moves a single Booking to a colleague; a receiver marked unavailable first sets themselves available | M | New |
| [DM-43](#dm-43) | ChangedRelationship | Base units live in each procedure's default RVG Contract(s), not on the RVG code; any other Contract may override them | L | New |
| [DM-44](#dm-44) | RuleChange | Absorbed modifiers are gone: a procedure carries default modifiers that are pre-filled and can be unticked | S | New |
| [DM-45](#dm-45) | RuleChange | Audit covers invoices and credit notes, not disbursements, payments or receipts (those are done in Xero) | S | New |
| [DM-46](#dm-46) | RemovedEntity | Hourly rate x time billing line is replaced by a Contract defined unit rate (the "individually arranged hourly" gate goes) | M | New |
| [DM-47](#dm-47) | NewEntity | Follow-up tools on a patient's outstanding invoices: recorded follow-up actions and invoice re-send | S | Added |

## DM-01

### Card becomes Booking: closed in Phase 15; the booking-level state it also named is carried by DM-11, DM-20 and DM-31

**Kind:** ChangedEntity · **Size:** S · **State:** Closed

**Since the last pass.** Closed. The rename, the optional Booking.source and List attachments were built in Phase 15 (commits 98bfd5c, b342a7d). Kept in the list so the plan keeps its reference; nothing structural remains here.

**Catalogue says.** Booking replaces Card; 'Card' now means only the physical hospital or surgeon card. A Booking belongs to one List (or a Draft List), references one Patient, has exactly one primary Procedure and 0..n additional ones, and carries prepayment state (required, amount, invoice) and open warnings. Its billable party and invoice email are defined through each Procedure's Contract (OQ-67), not held per Booking. Mutable until SUBMITTED, office-only until AUTHORISED, then immutable, with an append-only change history. Booking sources (hospital import, surgeon PDF, admin entry, anaesthetist ad hoc, photo) are a descriptive list only.

**Prototype has.** Done: Booking (types.ts:373), BookingId (:39), schedule.bookings, store/bookingActions.ts, audit entityType 'booking', optional display-only Booking.source (types.ts:371, :400, read by no rule) and List.attachments (types.ts:331). Edit-rights lifecycle matches the catalogue (lifecycle.ts:48-72). Not yet on the Booking: prepayment amount and invoice link (derived only, selectors.ts:307-380), billable party and invoice email (none), stored warnings (warnings are derived; only an office clearance is stored, store/warnings.ts, schedule.warningClearances).

**Impact.** Nothing structural is left in this delta. The remaining Booking-level fields arrive with the deltas that need them: DM-11 (payer and invoice email through the Contract), DM-20 (prepaid amount and invoice id), DM-31 (more warning rules). Do not reopen the rename.

**Catalogue:** [domain-model.md](../../../discovery-reference/Updated%20Requirements/domain-model.md), [FT-03.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-03.2.md), [US-03.1.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.1.3.md), [US-02.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.4.1.md), [US-03.6.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.6.1.md)

**Prototype:** `aa-prototype/src/domain/types.ts:373`, `aa-prototype/src/domain/types.ts:39`, `aa-prototype/src/store/bookingActions.ts:78`, `aa-prototype/src/store/lifecycle.ts:48`

## DM-02

### Slot, List and Draft List are separate things: the prototype welds Slot and List together

**Kind:** ChangedEntity · **Size:** XL · **State:** Re-graded

**Since the last pass.** Re-graded on the 2026-10-02 settlement of OQ-64: Slots are stored over a rolling horizon that is a setting, both Slots and Lists belong to the day, a List can hold no Bookings. Prototype side unchanged.

**Catalogue says.** Settled logical model (OQ-64): a day holds an AM and a PM Slot for every active anaesthetist ('a slot by definition belongs to a day'). Every Slot is created and stored across a rolling horizon (four months in current practice, any number of months, a rarely changed setting; shortening drops days, extending fills them), empty ones included, free by default, from the anaesthetist's start date, and freely editable afterwards. A Slot is a box with a status; a List is put into it and shows in place of the status. A List sits in exactly one Slot and, once assigned, has one anaesthetist, one surgeon, one hospital, one day and one session; a Slot with no List has no surgeon or hospital. A recurring booking creates its List before any Bookings exist, so a List can hold no Bookings. A reassignment consumes the covering anaesthetist's Slot; what the vacated Slot shows is open (OQ-84). Storage is for the developers and the word 'slot' never appears in the UI.

**Prototype has.** Only List exists (types.ts:301): one per anaesthetist x date x session, its id derived from the slot (listIdForSlot, domain/seed/canvas.ts:45). An empty Slot is a List with statusKey 'free' and state 'DRAFT' (canvas.ts:103-110); assigning a surgeon and hospital edits the same record. reassignList deletes the target's free List and mints a new id for the vacated slot (lifecycle.ts:543-626), so List identity and Slot identity are welded. No Day entity (DayNote per date only, types.ts:635), no Anaesthetist start date (types.ts:141-151). The horizon is a constant, 14 days back to 4 months forward (clock.ts:86-104). Default AM and PM times are hard-coded by status (canvas.ts:50-58). A List with no Bookings already exists (a PermanentList paints hospital and surgeon, canvas.ts:119-124).

**Impact.** Foundation and the largest structural change on the schedule side; must precede DM-03, DM-04, DM-05, DM-06 and DM-42. Introduce a Slot record (anaesthetist, date, session, status, optional time override) on the deterministic slot id, and give List its own id plus a slotId set on assignment (manual assignment, recurring-booking painting, Draft List assignment, ingest). Keeping every Slot stored (about 20,000 small records, which the seed already generates) is the cheapest reading of the storage freedom. A Day entity is not needed: the date is the key. Make the horizon length a stored setting and give the anaesthetist a start date (DM-33). Ripples into seed canvas generation, clock roll-forward, listForSlot and bookingsForList selectors, reassignList, the Admin Day grid, mobile schedule and web availability. PERSIST_VERSION bump and reseed.

**Catalogue:** [domain-model.md](../../../discovery-reference/Updated%20Requirements/domain-model.md), [EP-01](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/EP-01.md), [FT-01.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-01.1.md), [FT-01.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-01.3.md), [US-01.1.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.1.1.md), [US-01.1.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.1.3.md), [US-01.1.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.1.4.md), [US-01.3.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.3.1.md), [US-01.3.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.3.2.md), [US-01.3.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.3.3.md), [US-01.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.4.1.md), [OQ-64](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-64.md), [OQ-84](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-84.md)

**Prototype:** `aa-prototype/src/domain/types.ts:301`, `aa-prototype/src/domain/seed/canvas.ts:45`, `aa-prototype/src/store/lifecycle.ts:543`, `aa-prototype/src/domain/clock.ts:86`, `aa-prototype/src/domain/types.ts:141`

## DM-03

### Draft List: a List created with no anaesthetist, which can hold Bookings

**Kind:** NewEntity · **Size:** L · **State:** Re-graded

**Since the last pass.** Triggers widened 2026-10-02: an anaesthetist returning a List from an unavailable Slot, and a recurring booking that lands on an unavailable Slot (reverses the earlier accept-and-flag view, OQ-81). Admin now chooses only the anaesthetist.

**Catalogue says.** A Draft List is a List created with no anaesthetist. Hospital, surgeon, day and session are all required to create it, and it takes no Slot. Bookings can be added before assignment. It arises when (1) a surgeon's room needs an anaesthetist and none is assigned, (2) an anaesthetist moves a List to the office, including by marking its Slot unavailable (US-01.5.5), (3) a surgeon's recurring booking lands on a Slot the anaesthetist already marked unavailable (the anaesthetist's calendar is painted first; the List becomes a Draft List, not a flagged List, OQ-81 parts 1 and 2), and (4) an automated reschedule clashes (Future Work). Shown prominently in the Admin App (own page, beside the day view, on the one-day dashboard), clearly flagged as unassigned, sorted by date with time waiting. Never offered to anaesthetists (OQ-86 asks Ben). Only an admin assigns it, choosing only the anaesthetist (the Slot is predefined by the draft's day and session); it then becomes a List in that Slot keeping everything recorded, with a soft warning for an unavailable Slot or a blacklisted pairing. An unfilled one is removed or re-dated, audited. A matching-screen row can create one (US-02.1.2).

**Prototype has.** Nothing. List.anaesthetistId is mandatory (types.ts:304) and every Booking hangs off a List id (types.ts:373-376), so an unassigned request has nowhere to live. The word DRAFT in the prototype is the approval ListState (types.ts:46), a different concept. Generation already paints availability before the PermanentList (canvas.ts:116-119) but silently drops the recurring booking on an unavailable Slot instead of creating a Draft List. setAvailability flags a conflict on a booked List (lifecycle.ts:737-748) instead of offering return-or-assign.

**Impact.** New draft-List record (or an optional-anaesthetist List) that Booking.listId can point at; Admin views (own page, day-dashboard rows, planning side panel); assign, remove and re-date actions; creation from DM-05 (move to office), DM-04 (return from an unavailable Slot), canvas generation (recurring booking on an unavailable Slot) and DM-34 (matching screen). Depends on DM-02; the blacklist warning on assign depends on DM-32. Rename the clash with ListState 'DRAFT' when the type is added. Keep the shape minimal (hospital, surgeon, date, session, notes, createdAt) until OQ-86 and OQ-81 part 3 (short-notice sickness) settle.

**Catalogue:** [FT-01.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-01.6.md), [US-01.6.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.6.1.md), [US-01.6.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.6.2.md), [US-01.6.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.6.3.md), [US-01.6.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.6.4.md), [US-01.5.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.5.5.md), [US-01.5.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.5.2.md), [US-01.5.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.5.4.md), [US-01.3.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.3.2.md), [US-13.1.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.1.1.md), [US-02.1.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.1.2.md), [OQ-64](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-64.md), [OQ-81](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-81.md), [OQ-86](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-86.md)

**Prototype:** `aa-prototype/src/domain/types.ts:304`, `aa-prototype/src/domain/types.ts:46`, `aa-prototype/src/domain/seed/canvas.ts:116`, `aa-prototype/src/store/lifecycle.ts:737`

## DM-04

### Availability is a status on the Slot, kept up from one calendar (with series), with the status values held as editable master data

**Kind:** ChangedEntity · **Size:** M · **State:** Re-graded

**Since the last pass.** Re-graded 2026-10-02: the status values are a user-maintained list (fixed internal ID, editable label, editable colour), the List shows in place of the Slot status, and marking a booked Slot unavailable offers return-or-assign.

**Catalogue says.** Availability is a status held on the half-day Slot, free by default; an anaesthetist's AM and PM Slots can differ. The anaesthetist keeps it up from a calendar in their app (mark days off ahead, create a series, edit or delete one instance); the Slot status and the calendar are one mechanism, and once a List is put in the Slot the List shows in place of the status. Status values are master data, not a fixed set: each has a fixed internal ID, an editable label and an editable colour, rules read the ID, and a new status can be added with no code change (US-01.2.2); the starting values are free (default), on holiday, unavailable, to be defined with AA's users. Marking a Slot unavailable while it holds a List asks the anaesthetist to return it to the office (a Draft List) or assign it to a colleague (US-01.5.5). Admins set default AM and PM times, overridable per Slot (US-01.1.4). Short-notice sickness is open (OQ-81 part 3).

**Prototype has.** Two parallel models. A six-value ListStatusKey on the List (private, public, preop, holiday, unavailable, free; types.ts:53-61) mixes what is booked with availability and is locked to the theme palette by statusKeyParity.test.ts. A separate AnaesthetistAvailability master (types.ts:603-610; available, unavailable, holiday; one row per date and session, no range or recurrence) is reconciled INTO the List by setAvailability (lifecycle.ts:698-829): an empty free List restatuses, anything with booking context only gets a conflict flag. ListStatus rows hold key, label and description only (types.ts:620-624), with no colour and a key union fixed in code. Default AM and PM times are a hard-coded function (canvas.ts:50-58), not a setting.

**Impact.** Depends on DM-02. Availability moves onto the Slot; the displayed status becomes derived from the Slot status and the attached List, which keeps the six-colour design language only if AA keeps private, public and pre-op as a List attribute: the catalogue does not model a List kind at all, and US-01.2.1 lists private, public and pre-op only as candidate statuses, so the prototype's three booked-session colours have no confirmed home (agree with AA, OQ-17 follow-up). Replace the AnaesthetistAvailability-plus-reconcile pair with Slot edits; add a recurrence rule (series with per-instance exception) behind the anaesthetist calendar; turn the status set into editable master data with a colour field, so the union and the parity test go; add an admin default-times setting with a per-Slot override. The return-or-assign choice needs DM-03 and DM-05.

**Verified 2026-10-03 (corrected).** The Slot-status, calendar-series, master-data and default-times claims hold (US-01.2.1, US-01.2.2, US-01.5.3, US-01.1.4, OQ-64). Corrected: the draft assumed a List "kind" (private, public, pre-op) the catalogue never defines; the owner decision starts the status list from free, on holiday and unavailable only, so what happens to the three booked-session colours is open.

**Catalogue:** [FT-01.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-01.2.md), [US-01.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.2.1.md), [US-01.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.2.2.md), [US-01.2.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.2.3.md), [US-01.1.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.1.4.md), [US-01.5.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.5.2.md), [US-01.5.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.5.3.md), [US-01.5.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.5.5.md), [OQ-17](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-17.md), [OQ-27](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-27.md), [OQ-64](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-64.md), [OQ-81](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-81.md), [OQ-84](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-84.md)

**Prototype:** `aa-prototype/src/domain/types.ts:53`, `aa-prototype/src/domain/types.ts:603`, `aa-prototype/src/domain/types.ts:620`, `aa-prototype/src/store/lifecycle.ts:698`, `aa-prototype/src/domain/statusKeyParity.test.ts`

## DM-05

### An anaesthetist moves their own List with no request and no office confirmation (replaces the cover request)

**Kind:** ChangedLifecycle · **Size:** M · **State:** Re-graded

**Since the last pass.** 2026-10-02: the office is told through the shared notification pool (DM-41) and offered the on-demand cover-change email (DM-35); the colleague sees the List with a notice; a single Booking can move too (DM-42).

**Catalogue says.** An anaesthetist selects one of their Lists and either moves it to the AA office, where it becomes a Draft List, or pushes it into a free Slot of a colleague found in the availability view. The colleague does not accept and the office does not confirm: a high-trust system. Withdrawing from a List also returns it as a Draft List. A blacklisted pairing shows the same soft warning as an office assignment. The office is notified through the Admin App's shared notification pool and offered the cover-change update email; the colleague sees the List appear in their app with a notice (OQ-65). The Slot status left behind is open (OQ-84). The office can still reassign a List with its Bookings (owner reference changes, one temporal event from, to, by, when).

**Prototype has.** No anaesthetist-initiated move. reassignList is office-only (lifecycle.ts:543-565, refuse 'officeOnly') and changes the owner immediately. requestCover (lifecycle.ts:843-894) lets an anaesthetist post a CoverRequest (types.ts:277-284), an 'offer' or 'request' marker with status 'pending' only, on a FREE List; nothing resolves it and it is unrelated to a booked List. No move-to-office path (no Draft List), no blacklist, no notice to anyone.

**Impact.** The old plan's SwapRequest record stays withdrawn: the catalogue wants no request entity. Remove CoverRequest; add anaesthetist-actor actions moveListToOffice (creates a Draft List, DM-03) and pushListToSlot (target must be a free Slot of a colleague), each audited as one from, to, by, when event and each posting to the notification pool (DM-41); reassignList becomes a Slot change rather than delete-and-regenerate. A colleague notice is a small per-anaesthetist record or a derived 'moved to me since I last looked'. Depends on DM-02, DM-03, DM-32 (blacklist warning) and DM-41. Mobile and web availability flows change.

**Catalogue:** [US-01.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.4.1.md), [US-01.4.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.4.2.md), [US-01.4.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.4.3.md), [US-01.4.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.4.5.md), [US-01.5.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.5.5.md), [US-02.3.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.3.3.md), [US-13.8.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.8.2.md), [OQ-08](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-08.md), [OQ-43](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-43.md), [OQ-65](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-65.md), [OQ-84](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-84.md)

**Prototype:** `aa-prototype/src/domain/types.ts:277`, `aa-prototype/src/store/lifecycle.ts:543`, `aa-prototype/src/store/lifecycle.ts:843`

## DM-06

### Whoever submits a List did its procedures: a Booking done by someone else moves to their List, and its payable follows

**Kind:** RuleChange · **Size:** M · **State:** Re-graded

**Since the last pass.** 2026-10-02: the move happens before the procedure; the agreed prepayment stays and only the payable half of its draft pair moves (OQ-70, pair timing OQ-80). The single-Booking move is DM-42.

**Catalogue says.** The List's anaesthetist did every procedure on it. If another anaesthetist does a Booking, it is moved to a List of theirs (before the procedure), even a one-Booking List; an anaesthetist never does a procedure on another's List. The payable, and any prepayment payee, follow the Booking; prepayments are re-checked on any move, the agreed prepaid amount stays, the doer is paid and wears or benefits from the rate difference, and only the payable half of the prepayment's draft pair is updated to the doer (OQ-70; when the pair is created and amended is open, OQ-80). Say 'completed or submitted Booking', never 'timesheet'.

**Prototype has.** reassignBooking (lifecycle.ts:635-684) lets an anaesthetist move a Booking only between their own DRAFT Lists (refuse 'notOwnList', :654-660); only the office can move a Booking to another anaesthetist's List, and the move neither creates a List for the doer nor re-checks prepayment. The payee is never stored: anaesthetistIdForCase joins case, Booking, List and anaesthetist live (selectors.ts:611), so an unbilled case follows the move implicitly, while BillingReceipt stamps anaesthetistId at receipt (types.ts:752-762) and XeroAccPay carries no anaesthetist id (types.ts:790-807).

**Impact.** Rule and action change rather than a new entity: a 'move Booking to the doer' action that finds or creates the doer's List in the right Slot (needs DM-02) and re-runs the prepayment check (DM-20). The derived-payee design can stay, but the prepayment payable must be repointed explicitly once the ledger holds a payable record (DM-22), and the payee must be stamped on that record at authorisation (DM-08). Depends on DM-02, DM-03, DM-20 and DM-21.

**Catalogue:** [US-01.4.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.4.6.md), [US-06.5.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.5.4.md), [US-06.3.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.3.5.md), [FT-06.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-06.5.md), [OQ-40](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-40.md), [OQ-70](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-70.md), [OQ-80](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-80.md)

**Prototype:** `aa-prototype/src/store/lifecycle.ts:635`, `aa-prototype/src/store/selectors.ts:611`, `aa-prototype/src/domain/types.ts:752`, `aa-prototype/src/domain/types.ts:790`

## DM-07

### Contract is reshaped from Type 1/2/3 to category, holder, multi-dimension scope, pricing basis, aaCode and payment setting

**Kind:** ChangedEntity · **Size:** XL · **State:** Re-graded

**Since the last pass.** Re-graded 2026-10-02: the Contract always defines the billable party; the hourly rate x time basis became a Contract defined unit rate (DM-46); base units live in default RVG Contracts (DM-43); the model is still being reviewed by Greg (US-04.1.1 Verify, OQ-78).

**Catalogue says.** One reusable Contract answers how a Procedure is priced, what rules apply, who is invoiced (it always defines the billable party, OQ-67) and what extra Booking inputs are needed. Fields: id, aaCode (AA's unique short structured code, searchable, format open OQ-66), name, version, effective-from and -to, reviewDate; category (RVG Default Post-paid, RVG Default Hospital, Hospital, Surgeon Solo, Surgeon Group, Insurance; no Pre-paid category, ACC is a Hospital or holder Contract); holder (hospital, surgeon or surgeon group, insurer, or the payer named when picked); scope filters on hospitals, procedures from the master procedure list, surgeons, insurers, RVG codes or groups, funding source and specific anaesthetists (empty means organisational, which merges the retired individual-Contract story); pricing basis (anaesthetist's own unit value, contract rate or discount, fixed fee schedule, Contract defined unit rate); baseUnitOverrides; multiProcedureRule; allowsAnaesthetistAdjustment; paymentSetting FULL or SPLIT; requiredBookingInputs; invoice layout, delivery method, GST treatment. A combination is a Contract set against each parent procedure. Whether a Contract belongs to the hospital or to the funding source is not settled, and Greg's no-default-Contract alternative is open (OQ-78). Note: domain-model.md's category table still lists 'RVG Default Pre-paid'; US-04.1.1 and OQ-25 (no Pre-paid category) win.

**Prototype has.** Contract (types.ts:216-241): type 1|2|3, one holderType and holderId (hospital, insurer, surgeon, organisation, billableParty), scope organisation or one individualAnaesthetist, permitsIndividualArrangement (the rate x time gate), isDefault (the protected default Type 1), effective dates, type2Detail (agreedUnitRate or percentDiscount). No aaCode, category, procedures, hospitals, surgeons, insurers or funding-source scope, multiProcedureRule, allowsAnaesthetistAdjustment, requiredBookingInputs, paymentSetting, delivery method, GST treatment or reviewDate. No surgeon group with members (ContractHolderOrganisation, types.ts:180, is the nearest). Seeds: five hospital default Type 1s, a nib default, SXAP, HNZ, ACC, bariatric, COS and hourly examples (seed/contracts.ts:45-). contractActions.ts creates, edits and deletes (deleteContract :152); the catalogue retires and versions.

**Impact.** Foundation for pricing, selection and the Contract catalogue. Mapping: Type 1 = anaesthetist-rate units, Type 2 = contract-rate units, Type 3 = FIXED_SCHEDULE, permitsIndividualArrangement goes with DM-46. The selectContract precedence resolver (individual beats organisational, specific beats default, contracts.ts:34-62) becomes scope filtering plus an explicit choice (DM-10). fee.ts, contracts.ts, contractActions.ts, the Contract editor in MasterData and the seed contracts all change. scope.anaesthetists becomes a list; add a SurgeonGroup with members (DM-32); use a simple sequence for aaCode until OQ-66 settles. Keep the field set flexible while Greg reviews the model. Depends on nothing; DM-08, DM-09, DM-10, DM-14, DM-15, DM-16, DM-27, DM-28, DM-43 and DM-46 depend on it.

**Catalogue:** [domain-model.md](../../../discovery-reference/Updated%20Requirements/domain-model.md), [EP-04](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/EP-04.md), [FT-04.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-04.1.md), [FT-04.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-04.2.md), [FT-04.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-04.4.md), [US-04.1.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.1.1.md), [US-04.1.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.1.2.md), [US-04.1.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.1.4.md), [US-04.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.1.md), [US-04.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.2.md), [US-04.2.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.5.md), [US-04.2.7](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.7.md), [US-04.2.8](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.8.md), [US-04.2.11](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.11.md), [US-04.2.12](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.12.md), [US-05.5.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.5.1.md), [OQ-06](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-06.md), [OQ-25](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-25.md), [OQ-66](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-66.md), [OQ-67](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-67.md), [OQ-68](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-68.md), [OQ-78](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-78.md)

**Prototype:** `aa-prototype/src/domain/types.ts:195`, `aa-prototype/src/domain/types.ts:216`, `aa-prototype/src/domain/seed/contracts.ts:45`, `aa-prototype/src/store/contractActions.ts:53`, `aa-prototype/src/domain/billing/contracts.ts:34`

## DM-08

### Contract versions and the AUTHORISED snapshot (Contract and calculation inputs locked with the Procedure)

**Kind:** NewLifecycle · **Size:** L · **State:** Unchanged

**Since the last pass.** Unchanged since the earlier pass; invoice reproducibility was clarified 2026-10-02 as keeping what the invoice was generated from (its recipe), not regenerating from another point in time.

**Catalogue says.** Every version of a Contract is kept. At AUTHORISED the engine snapshots the Contract version onto each Procedure, plus the reference data the calculation used (rates, RVG values, the anaesthetist's unit value, party details), so an invoice as raised can be produced again and later edits or price changes never alter it. The engine reads the locked Contract only. Every price line carries its own effective-from date; which date decides the price in force is open (OQ-48, Greg leans to the procedure date).

**Prototype has.** No version on Contract and no snapshot: authoriseList only flips state (lifecycle.ts:262-292). The billing run rates against the LIVE contract and writes amounts into InvoiceLine description text. If the stored Contract has expired by billing, resolveContractForProcedure falls back to the holder's default Type 1 or raises a failed case (invoiceBuild.ts:114-150, 'contractIneffective'). Contract has one effectiveFrom and effectiveTo pair; ContractPrice has no dates.

**Impact.** Append-only Contract version history (contractId + version) and a per-Procedure locked record (contractId, contractVersion, unit value, base units, price line) written in authoriseList; the billing run reads only that record, which removes the effective-date fallback branch and its 'contractIneffective' failure demo. The same record is where the payee anaesthetist is fixed (DM-06). Depends on DM-07 and DM-09. Reseed and PERSIST_VERSION bump. The exact frozen fields are still to be decided (US-15.0.3).

**Catalogue:** [US-04.1.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.1.3.md), [US-04.3.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.3.5.md), [US-07.3.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-07.3.1.md), [US-08.4.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.4.4.md), [US-04.2.10](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.10.md), [US-15.0.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-15.0.3.md), [OQ-48](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-48.md)

**Prototype:** `aa-prototype/src/store/lifecycle.ts:262`, `aa-prototype/src/domain/billing/invoiceBuild.ts:114`, `aa-prototype/src/domain/types.ts:216`

## DM-09

### ContractPrice becomes a full FeeScheduleLine chosen on the Procedure

**Kind:** ChangedEntity · **Size:** L · **State:** Re-graded

**Since the last pass.** 2026-10-02: US-05.2.5 was simplified to 'the fixed fee is the total price' and how time bands, add-ons and quantity rules sit with it is OQ-89; the line fields in US-04.2.4 are unchanged.

**Catalogue says.** Children of a fixed-fee Contract: the holder's code and description (SXAP AP0126, CES HNZCATall, ACC OPT101), price excluding and including GST, optional mapped RVG codes so BTM is still recorded, optional time band, an add-on flag and a quantity rule (for example per area), plus tier (commitment versus panel) and effective-from per line (domain model). Holder codes are kept as searchable references (typing 8942 filters to that Contract). The Procedure records which line applies; base, time and modifier units are still recorded when the price comes from a line. How time bands, add-ons and quantity rules combine with 'the fixed fee is the total price' is OQ-89.

**Prototype has.** ContractPrice (types.ts:250-258): contractId, optional rvgBaseCode, surgeonId, procedureOrdinal, price; matched most-specific-wins by key (matchContractPrice, contracts.ts:77-). No holder code, description, GST-inclusive price, time band, add-on, quantity rule, tier or date. No feeScheduleLineId on Procedure; a Type 3 with no matching row falls back to BTM (fee.ts:199-228, a labelled demo reading).

**Impact.** Replace ContractPrice and key-based matching with an explicit line chosen on the Procedure and shown by holder code. fee.ts's Type 3 branch gains time bands, add-ons and quantity (leave the combination rule switchable until OQ-89); procedureOrdinal moves to the Contract's multiProcedureRule (DM-15). Seed needs realistic lines and the Admin price editor changes. Depends on DM-07. The not-on-schedule outcome is DM-16.

**Catalogue:** [US-04.2.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.4.md), [US-04.2.10](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.10.md), [US-05.2.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.2.5.md), [US-03.6.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.6.1.md), [OQ-18](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-18.md), [OQ-48](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-48.md), [OQ-89](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-89.md)

**Prototype:** `aa-prototype/src/domain/types.ts:250`, `aa-prototype/src/domain/billing/contracts.ts:77`, `aa-prototype/src/domain/billing/fee.ts:199`, `aa-prototype/src/store/contractActions.ts:200`

## DM-10

### Each Procedure selects exactly one Contract, picked procedure first, narrowed by the List's hospital; the billing-route step disappears

**Kind:** ChangedRelationship · **Size:** XL · **State:** Re-graded

**Since the last pass.** Re-graded 2026-10-02: filters now include AA code search, the default RVG Contract is always offered, the anaesthetist may change the Contract until they submit, and Greg's no-default-Contract alternative is open (OQ-78).

**Catalogue says.** No route step. Every Procedure has exactly one Contract before its Booking can be completed. Admin sets it at booking setup; the anaesthetist may change it until they submit; the office approves or corrects it at the SUBMITTED review. The user picks the procedure first (from the master procedure list grouped by RVG body headings), then a Contract from those set against it, narrowed by the List's hospital (and possibly the surgeon, not settled); the default RVG Contract is always offered; typing an AA code or a holder's own code filters to that Contract. The patient's insurer or funding source is NOT a filter (OQ-55). Where nothing more specific applies the Procedure defaults to the RVG Default Hospital Contract of the List's hospital. A combination Contract is chosen once and the Booking then records only the Contract. Thousands of Contracts must stay navigable (OQ-66).

**Prototype has.** Procedure has billingRoute ('hospital' | 'billableParty' | 'insurer'), governingContractId (optional), insurerId, billablePartyId, patientPaymentCategory, prepaymentDetail and billingReference (types.ts:462-488). The validator fails an unset route (validateBookingForBilling.ts:124-127); the billing run resolves contract and payer from route plus stored contract (invoiceBuild.ts:114-215); the 'billableParty' route needs no contract at all. Contract choice is an unfiltered select of every Contract in the office-only billing-setup sheet (EditBillingSetupSheet.tsx:176, OfficeBillingSetup). The route is also set by the anaesthetist at ad hoc entry (ManualBookingForm.tsx:67) and in EditProcedureSheet (:32). No procedure-first picker, no hospital-narrowed list, no code search.

**Impact.** Removes BillingRoute, PatientPaymentCategory and the route-driven use of Procedure.insurerId (DM-12); governingContractId becomes required for completion. Who gets the invoice comes from the Contract (DM-11); the prepayment trigger moves to the anaesthetist's prepaid settings (DM-19, DM-20). Rewrites resolveContractForProcedure, counterpartyForProcedure, validateBookingForBilling, the mobile and web capture, the office billing-setup UI (the route picker becomes a filtered Contract picker for both admin and anaesthetist), review flags and the seed for every Booking. New: filtered picker selector with AA-code and holder-code search. Default-Contract auto-creation for a new hospital or insurer is already built (createHospital and createInsurer mint a protected default Type 1, mastersActions.ts:45-150); it only has to become the RVG Default Hospital or Insurance default category (US-04.4.1), and the Procedure has to default to the List's hospital default at setup (today the fallback is applied by the billing run, invoiceBuild.ts:114-150). Depends on DM-07, DM-13 and DM-43 (procedure master and default RVG Contracts for the first pick); DM-11 runs alongside. Largest ripple on the billing side.

**Verified 2026-10-03 (corrected).** Catalogue reading holds (US-04.3.1 to US-04.3.4, US-03.4.1, US-04.2.1). Corrected: the draft listed default-Contract auto-creation as new work, but the store already does it; the delta is the category rename and moving the default to booking setup.

**Catalogue:** [FT-04.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-04.3.md), [US-04.3.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.3.1.md), [US-04.3.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.3.2.md), [US-04.3.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.3.3.md), [US-04.3.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.3.4.md), [US-04.2.11](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.11.md), [US-03.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.4.1.md), [FT-03.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-03.4.md), [US-07.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-07.2.2.md), [US-08.1.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.1.1.md), [US-11.4.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.4.2.md), [US-04.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.4.1.md), [FT-04.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-04.4.md), [OQ-53](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-53.md), [OQ-55](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-55.md), [OQ-66](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-66.md), [OQ-78](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-78.md)

**Prototype:** `aa-prototype/src/domain/types.ts:462`, `aa-prototype/src/domain/billing/invoiceBuild.ts:114`, `aa-prototype/src/domain/billing/invoiceBuild.ts:192`, `aa-prototype/src/domain/billing/validateBookingForBilling.ts:124`, `aa-prototype/src/shared/flows/EditBillingSetupSheet.tsx:176`, `aa-prototype/src/shared/booking/OfficeBillingSetup.tsx`

## DM-11

### Billable party and invoice email are defined by the Contract, with no per-Booking override; the guardian record goes

**Kind:** ChangedRelationship · **Size:** L · **State:** Re-graded

**Since the last pass.** REVERSED 2026-10-02 (OQ-67 for now): the earlier plan held a billable party and invoice email on the Booking defaulting from the Contract holder with an override. The catalogue now says the Contract always defines the billable party and there is no per-Booking override. Note EP-11's first paragraphs still say each Booking carries its own billable party and invoice email; FT-11.2, US-11.2.2, US-08.2.1 and the domain model say otherwise, and they win.

**Catalogue says.** Each Procedure's Contract defines who pays and where the invoice goes, with as many Contracts as AA needs. Picking a default Contract (or a patient-direct Contract) asks for the name and email of whoever pays, for example a guardian, so even a default Contract has a billable party; a hospital taking the invoice for work priced at default RVG is a Contract with that hospital as billable party. The billable party is independent of how the Procedure is priced. There is no separate guardian record: a guardian's details are a Contract-level matter kept for the life of the debt, then archived. A patient under 18 as billable party is a mild clearable warning (DM-31), none when someone else pays. The Contract declares which inputs are required (invoice email, billable party) and the Booking holds the entered values (US-04.2.7). Invoices go to the invoice email captured on the Booking (US-08.4.2). Greg's alternative (no default Contract, hospital holds every Contract) is open (OQ-78).

**Prototype has.** BillableParty (types.ts:127-134) is a guardian-only master record, deliberately not a Patient, with its own Xero contact type. The payer is derived per Procedure: counterpartyForProcedure returns the insurer, the BillableParty or the patient on the route, else the resolved contract's holder (invoiceBuild.ts:192-215). The payer is resolved per Procedure and stored nowhere. A per-Procedure billablePartyId override exists (types.ts:475) and is chosen in the office billing-setup sheet (EditBillingSetupSheet.tsx:154). No invoice email on Booking, Procedure or Invoice (only Patient.email and BillableParty.email). No under-18 check (Patient.dobISO exists, types.ts:107). CounterpartyRef already covers hospital, insurer, surgeon, organisation, patient and billableParty (types.ts:73-83).

**Impact.** Replace the per-Procedure billablePartyId override and the guardian master with payer details captured when a default or patient-direct Contract is picked: a payer name and email (a small payer record or two fields) stored with the Procedure's Contract selection, and an invoiceEmail stored beside it, with the defaults coming from the Contract holder. Retire BillableParty as a master and its Xero contact kind, or keep the type as the payer record behind the Contract pick. The billing run keeps grouping by each Procedure's resolved party (DM-28, DM-27). Invoice email required for patient-direct Contracts (DM-16). The under-18 check is a warning rule (DM-31). Depends on DM-07 and DM-10. Flag the EP-11 wording to the owner so the catalogue stops contradicting itself.

**Catalogue:** [FT-11.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-11.2.md), [US-11.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.2.1.md), [US-11.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.2.2.md), [US-11.2.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.2.3.md), [US-11.2.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.2.4.md), [EP-11](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/EP-11.md), [US-04.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.1.md), [US-04.3.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.3.3.md), [US-08.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.2.1.md), [US-08.4.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.4.2.md), [US-07.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-07.2.2.md), [OQ-54](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-54.md), [OQ-55](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-55.md), [OQ-67](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-67.md), [OQ-78](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-78.md)

**Prototype:** `aa-prototype/src/domain/types.ts:127`, `aa-prototype/src/domain/types.ts:475`, `aa-prototype/src/domain/billing/invoiceBuild.ts:192`, `aa-prototype/src/store/billablePartyActions.ts:21`, `aa-prototype/src/shared/flows/EditBillingSetupSheet.tsx:154`

## DM-12

### Insurer and funding source belong to neither Patient nor Booking

**Kind:** RemovedEntity · **Size:** S · **State:** Unchanged

**Since the last pass.** Unchanged since the earlier pass (OQ-55); anchors refreshed.

**Catalogue says.** OQ-55 answer: insurer and funding source are held on neither the Patient nor the Booking; each Procedure's Contract says who pays, with as many Contracts as needed for any mix. Funding source (private, SXAP, HNZ, ACC) describes the Contract and is no longer a picker filter. An insurer that does not accept direct claims means the patient is invoiced and forwards it (US-11.4.2). ACC is a Hospital or holder Contract with ACC pricing, invisible to the engine.

**Prototype has.** Procedure.insurerId (types.ts:469), used as payer only on the 'insurer' route and informational on the hospital route, and Procedure.accRelated (types.ts:486), an informational boolean that drives an ACC review advisory (reviewFlags.ts). Insurer master has acceptsDirectClaims (types.ts:166-174). No funding-source value anywhere.

**Impact.** Remove Procedure.insurerId and the insurer route with DM-10; add Contract scope insurers and fundingSource (DM-07). accRelated has no catalogue home: US-05.5.1 makes ACC just a Contract (a holder or hospital Contract with ACC pricing, funding source ACC), so the informational boolean goes or is derived from the Contract's funding source. Its only reader, the "ACC should not bill the patient directly" review advisory, fires on the billableParty route (reviewFlags.ts:83), which DM-10 removes, so the advisory needs a new trigger or retires with the route. US-11.4.2 (insurer without direct claims, patient invoiced) still needs a trigger once no Booking field holds the insurer; a Contract holder flag is the likely home. The Insurer master stays, as a Contract holder. Small, but it must land with DM-10 so no screen keeps reading insurerId.

**Verified 2026-10-03 (corrected).** Catalogue claims hold (US-04.2.1, US-04.3.2, US-11.4.1, US-11.4.2, US-05.5.1; OQ-55). Corrected: the draft said accRelated need not go, but its one consumer is route-driven and dies with DM-10.

**Catalogue:** [US-04.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.1.md), [US-04.3.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.3.2.md), [US-11.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.4.1.md), [US-11.4.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.4.2.md), [US-07.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-07.2.2.md), [FT-05.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-05.5.md), [US-05.5.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.5.1.md), [OQ-55](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-55.md), [OQ-67](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-67.md)

**Prototype:** `aa-prototype/src/domain/types.ts:469`, `aa-prototype/src/domain/types.ts:486`, `aa-prototype/src/domain/types.ts:166`, `aa-prototype/src/apps/admin/reviewFlags.ts`, `aa-prototype/src/domain/billing/validateBookingForBilling.ts:166`

## DM-13

### Master procedure list: procedures by body part with group, subgroup, RVG code or category and default modifiers, holding no base units

**Kind:** NewEntity · **Size:** M · **State:** Re-graded

**Since the last pass.** Re-graded 2026-10-02 (OQ-62 settled): base units are no longer on the list or the RVG code master (they move to default RVG Contracts, DM-43), and the list gains default modifiers (DM-44) and a possible unique system code (OQ-88).

**Catalogue says.** Admins maintain a master list of procedures by operation name, grouped by body part: each has a group, a subgroup, the RVG code or category it belongs under (holds or references, still in tension, OQ-88) and its default modifiers. The mapping is by hand, with gaps filled by Vanessa. The list holds no base units. Text the anaesthetist types about a procedure stays on the Procedure. A unique human-readable system code (a 'code', not an ID) may sit on the RVG code master or on each procedure line (OQ-88). The RVG code master keeps the guide's own reference values, AA can add codes the guide lacks with no AA-sourced marker, and codes are grouped (the guide's sections plus AA groups such as cosmetic, plastics, dental). Out-of-range base units entered by the anaesthetist are accepted and raise an after-procedure warning (US-03.3.1, OQ-56). Loaded from controlled spreadsheets; Solutions Plus supplies names only.

**Prototype has.** No procedure master and no RVG groups. Procedure.rvgBaseCode points straight at RvgCode (types.ts:501), whose baseUnits (single or range) are the only base-unit source (types.ts:550-557). No unique system code, no group or subgroup, no default modifiers. The validator refuses an out-of-range base selection outright (validateBookingForBilling.ts:152-163) instead of warning. Modifier master exists with demo values (types.ts:566, billing/modifierCodes.ts).

**Impact.** New masters ProcedureType (name, group, subgroup, rvgCode or category, defaultModifierCodes, optional systemCode) and RvgGroup with code-to-group tags (also needed by DM-19). Procedure gains procedureTypeId and keeps rvgBaseCode as reference. The picker becomes procedure-first (DM-10). The out-of-range refusal becomes a warning (DM-31). Keep the shape flexible until OQ-88 settles (one list or two, which carries the system code, parent and child or flat). Base-unit ownership is DM-43. Does not need to block DM-10 if the first pick can stay RVG-code based.

**Catalogue:** [US-05.1.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.1.1.md), [US-05.1.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.1.3.md), [US-05.1.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.1.4.md), [US-05.1.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.1.5.md), [US-05.1.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.1.6.md), [US-03.3.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.3.1.md), [US-13.4.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.4.3.md), [OQ-56](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-56.md), [OQ-62](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-62.md), [OQ-88](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-88.md)

**Prototype:** `aa-prototype/src/domain/types.ts:501`, `aa-prototype/src/domain/types.ts:550`, `aa-prototype/src/domain/seed/rvgCodes.ts`, `aa-prototype/src/domain/billing/validateBookingForBilling.ts:152`

## DM-14

### Anaesthetist adjustment is a new Contract-gated record; the office override already exists

**Kind:** ChangedEntity · **Size:** S · **State:** Unchanged

**Since the last pass.** Unchanged since the earlier pass; anchors refreshed.

**Catalogue says.** Two distinct records on the Procedure. Anaesthetist adjustment: percent discount or fixed final price with a required reason, only when the Contract allows it (the field is not offered otherwise), applied after BTM is recorded in full (even at 100% discount). Office price override: fixed final, dollar or percent adjustment with a reason, always available whatever the Contract says, including over a fixed-fee price (OQ-16), audited. Both apply after the base calculation, and the fee before the adjustment is kept.

**Prototype has.** One PriceOverride union on the Procedure (types.ts:443-446): fixedFee, dollarAdjustment, percentAdjustment, each with a reason, no actor and no Contract gate. This IS the office override, so that half is aligned. The anaesthetist reuses the same field: the capture UI offers fixedFee or dollarAdjustment and reserves percent for the office (OverrideCard.tsx), a UI convention rather than a model rule, and nothing gates it on the Contract. fee.ts applies it after the subtotal (fee.ts:257-269).

**Impact.** Keep priceOverride as the office override (add actor). Add a separate anaesthetistAdjustment {PERCENT | FIXED_FINAL, value, reason} offered only when the Contract has allowsAnaesthetistAdjustment; fee.ts applies adjustment then override and records the pre-adjustment fee. The anaesthetist capture UI swaps fixed or dollar for percent or fixed-final and hides the field when the Contract does not permit it. Depends on DM-07.

**Catalogue:** [FT-03.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-03.5.md), [US-03.5.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.5.1.md), [US-03.5.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.5.2.md), [FT-05.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-05.4.md), [US-05.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.4.1.md), [US-05.4.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.4.2.md), [US-04.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.2.md), [OQ-16](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-16.md)

**Prototype:** `aa-prototype/src/domain/types.ts:443`, `aa-prototype/src/domain/types.ts:511`, `aa-prototype/src/domain/billing/fee.ts:257`, `aa-prototype/src/shared/capture/OverrideCard.tsx`, `aa-prototype/src/shared/flows/PriceOverrideSheet.tsx`

## DM-15

### Multi-procedure rule: one primary Procedure, time on every Procedure, modifier units split above four, per-Contract override

**Kind:** RuleChange · **Size:** M · **State:** Re-graded

**Since the last pass.** Unchanged on the rule; two small notes added 2026-10-02: part intervals always round up (the prototype already does) and the time tiers are to be defined as data, not hard-coded.

**Catalogue says.** Exactly one primary Procedure per Booking (anyone with edit rights, including an inbound source, can change it; an ACC pre-op assessment is an event and never primary). Base units only on the primary, never editable on others. Time units on every Procedure from its own times, tiered 1 per 15 minutes for the first two hours then 1 per 10, a part interval always rounded up, the tiers defined as data (US-05.2.2). Modifier units all on the primary when the Booking total is 4 or fewer; above 4 they are split equally across all Procedures with the remainder to the primary (7 over 3 = 3/2/2), whichever Contracts they are on. Each Procedure is priced by its own Contract. A Contract may replace the rule (percent of the second code, add-on fee, not billable). The even-split rounding is reopened for Ben (OQ-15).

**Prototype has.** The RFP rule: an additional Procedure yields time units ONLY; base and modifiers charge on the first Procedure alone (splitBillingUnits, fee.ts:107-109). Procedure.isAdditional (types.ts:494) is set by addProcedure (bookingActions.ts:422); there is no isPrimary flag (the first Procedure by order is implicitly primary) and no set-primary action. No modifier split. Contract second-procedure pricing is ContractPrice.procedureOrdinal on Type 3 only. Time rounding is already up (timeUnits.ts:13-31, aligned) but the tiers are constants (timeUnits.ts:16-19). The share per Procedure is recorded as invoice lines, not as a ledger share.

**Impact.** Pure domain change with Vitest updates: replace isAdditional with isPrimary (exactly-one invariant), compute modifier allocation across the whole Booking (feeFor then needs the Booking, not one Procedure), honour Contract.multiProcedureRule, move the time tiers into data. Capture UI shows the allocated modifier share on additional Procedures instead of 'Not charged'. Seed and every worked-example test change. Depends on DM-07 (rule field) and DM-44 (default modifiers pre-filled per Procedure). Keep the remainder rule switchable until OQ-15 is answered.

**Catalogue:** [FT-05.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-05.3.md), [US-05.3.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.3.1.md), [US-05.3.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.3.4.md), [US-05.3.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.3.5.md), [US-03.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.2.1.md), [US-03.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.2.2.md), [US-03.2.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.2.3.md), [US-04.2.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.5.md), [US-05.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.2.2.md), [OQ-15](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-15.md), [OQ-53](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-53.md), [OQ-75](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-75.md)

**Prototype:** `aa-prototype/src/domain/billing/fee.ts:107`, `aa-prototype/src/domain/types.ts:494`, `aa-prototype/src/store/bookingActions.ts:422`, `aa-prototype/src/domain/billing/timeUnits.ts:13`, `aa-prototype/src/shared/capture/UnitsCard.tsx`

## DM-16

### Required Booking inputs per Contract and the 'confirm with hospital' flag on the Procedure

**Kind:** ChangedEntity · **Size:** S · **State:** Unchanged

**Since the last pass.** Unchanged since the earlier pass; anchors refreshed.

**Catalogue says.** A Contract declares which per-Booking inputs it requires (US-04.2.7: invoice email, billable party, prepaid amount, insurer member number or claim reference; the domain model also lists purchaseOrder); the Booking holds the values and cannot be marked complete until they are present. When a hospital sheet says a Procedure is under a Contract but it is not on the Contract's schedule, an admin can set the Contract anyway and flag the Procedure 'to confirm with the hospital'; the flag shows at office review and clears on confirmation. If the hospital takes the invoice, that is a Contract with the hospital as billable party.

**Prototype has.** Procedure.billingReference (types.ts:488) is the only generic reference and is checked only on the 'hospital' route (billingReferenceMissing, validateBookingForBilling.ts:49-55). No insurer member number, claim reference or purchase order, no per-Contract required-input declaration, no confirm-with-hospital flag.

**Impact.** Additive fields on Procedure or Booking (memberNumber, claimReference, purchaseOrder, toConfirmWithHospital) plus Contract.requiredBookingInputs; validateBookingForBilling and reviewFlags read the declaration instead of the route-based reference rule. Depends on DM-07 and DM-10.

**Catalogue:** [US-04.2.7](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.7.md), [US-03.6.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.6.1.md), [US-04.3.7](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.3.7.md), [US-07.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-07.2.2.md)

**Prototype:** `aa-prototype/src/domain/types.ts:488`, `aa-prototype/src/domain/billing/validateBookingForBilling.ts:49`, `aa-prototype/src/apps/admin/reviewFlags.ts`

## DM-17

### Events on a Procedure: pre-op, post-op, additional invoice and credit are one element, with an invoice tick and one review step

**Kind:** NewEntity · **Size:** L · **State:** Re-graded

**Since the last pass.** Widened 2026-10-02 (OQ-63 answered): event is the one name for everything recorded against a Procedure after setup, so additional invoices (DM-18) and credits (DM-24) are events too; admins can add them; each has an invoice tick box and a 'same as' billable-party tick; one standard review step.

**Catalogue says.** An event is its own element attached to the original Procedure (not a Procedure added to the Booking), and all of a Procedure's events are listed on it in both apps (US-03.7.3). Kinds: pre-op or post-op time recording or fixed fee (pain management after the procedure, an ACC pre-op assessment), an additional invoice, a credit; a refund may show as an event (tentative). The anaesthetist mostly adds pre-op and post-op events, and an admin can too; each has its own date and time, records either a time or a fixed fee, takes no other modifiers, and has a tick box for whether it will be invoiced. Its billable party is set by a 'same as' tick (our reading: the Procedure's party; the default is not stated), otherwise entered. A billable event is its own line item priced from its time or fixed fee (the Contract can replace a time with a fixed fee): a line on the Procedure's invoice if recorded before that invoice is approved and the party is the same, otherwise a separate invoice in the next run, traceable to the Procedure. Every event goes through the same standard review step. An ACC pre-op assessment is never the primary Procedure.

**Prototype has.** Nothing. The nearest thing is the post-op addendum Booking (bookingType 'postOpAddendum', addendumOfBookingId; types.ts:385-392; addPostOpAddendum, bookingActions.ts:290), a whole new Booking on the original anaesthetist's free DRAFT List with its own capture, submit, authorise and bill cycle, which is a different mechanism from an event on a Procedure. BillingLine has no service date of its own (types.ts:528-540). A POSTOP modifier group exists (types.ts:559) but is only a modifier. No review step, invoice tick or billable-party tick.

**Impact.** New ProcedureEvent record (procedureId, kind, date and time, time or fixedFee, billable tick, billable party or 'same as', reviewState, invoiceId) with an anaesthetist-facing add flow (mobile and web, reachable from past Procedures, US-03.1.6), an Admin add path, a Procedure events list in both apps, and one review step before invoicing. Its invoice is a new Invoice kind linked to the Procedure (DM-27). DM-18 and DM-24 are event kinds on the same record. Replaces the anaesthetist-driven part of the addendum Booking. Depends on DM-07 (fixed-fee swap), DM-27 and, for the invoice line, DM-22. Keep the shape thin until the OQ-63 details (default of the 'same as' tick, display fields) settle.

**Catalogue:** [FT-03.7](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-03.7.md), [US-03.7.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.7.1.md), [US-03.7.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.7.2.md), [US-03.7.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.7.3.md), [FT-08.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-08.6.md), [US-05.5.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.5.2.md), [US-03.3.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.3.6.md), [US-03.1.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.1.6.md), [OQ-12](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-12.md), [OQ-63](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-63.md)

**Prototype:** `aa-prototype/src/domain/types.ts:385`, `aa-prototype/src/store/bookingActions.ts:290`, `aa-prototype/src/domain/types.ts:528`, `aa-prototype/src/domain/types.ts:559`

## DM-18

### Additional invoice is a free-form admin invoice recorded as an event on a Procedure; it replaces the post-op addendum Booking

**Kind:** ChangedEntity · **Size:** L · **State:** Re-graded

**Since the last pass.** 2026-10-02: it can go to any billable party, is recorded as an event (DM-17), goes through the same review step and is invoiced in the next run, and has a credit note option (DM-24). The old 'no extra approval' is gone.

**Catalogue says.** An admin, from a button in the Admin App, creates an additional invoice attached to a Procedure for charges after invoicing and for splitting a combined Procedure at a billable party's request. It is free-form: each line has a description, quantity and amount, no Contract pricing or unit rules (OQ-45). It can go to any billable party (OQ-72) and is recorded as an event on the Procedure, traceable to the original Procedure and invoice (the original shows its additional invoices). It goes through the same standard review step as every event, is invoiced in the next run, and is audited. It has its own unique number, ledger pair, Xero pair and anaesthetist payable, and never unlocks the original. The balance after a prepayment is NOT an additional invoice. A wrong invoice is never fixed this way (DM-24).

**Prototype has.** Post-op addendum: a NEW Booking (bookingType 'postOpAddendum', addendumOfBookingId; types.ts:391-392) created by addPostOpAddendum (bookingActions.ts:290-) on the original anaesthetist's free DRAFT List for today, running its own capture, submit, authorise and bill cycle with ordinary Contract pricing; the original stays locked. It is anaesthetist-driven, not an admin button, needs a free session today, and the resulting invoice records no link to the original. No free-form invoice, no review step, no 'split a combined Procedure' concept.

**Impact.** Remove Booking.bookingType, addendumOfBookingId and addPostOpAddendum; add Invoice kind 'additional' with procedureId, originalInvoiceId, free-form lines, its own ledger pair (DM-22) and an event record (DM-17). New admin action and a Procedure-level button; the mobile 'add post-op charge' entry becomes a post-op event (DM-17) or 'tell the office'. Depends on DM-17, DM-22 and DM-27. Splitting a combined Procedure uses the combination Contract model (DM-07, OQ-53) and the credit-then-rebill path (DM-24, OQ-77).

**Catalogue:** [FT-08.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-08.6.md), [US-08.6.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.6.1.md), [US-08.6.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.6.3.md), [US-08.6.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.6.4.md), [US-04.2.11](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.11.md), [US-06.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.4.1.md), [OQ-24](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-24.md), [OQ-45](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-45.md), [OQ-53](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-53.md), [OQ-63](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-63.md), [OQ-72](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-72.md), [OQ-77](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-77.md)

**Prototype:** `aa-prototype/src/domain/types.ts:391`, `aa-prototype/src/store/bookingActions.ts:290`, `aa-prototype/src/domain/types.ts:528`, `aa-prototype/src/domain/types.ts:672`

## DM-19

### Prepaid settings on the anaesthetist profile (RVG codes and groups) replace the per-Procedure payment category

**Kind:** NewEntity · **Size:** M · **State:** Re-graded

**Since the last pass.** 2026-10-02 (OQ-73): prepayment is flagged only where the billable party is a person paying for the patient, never an organisation.

**Catalogue says.** Each anaesthetist ticks the RVG codes or whole groups (cosmetic, plastics, dental) that require prepayment; an admin can view and edit them on their behalf. A Booking needs prepayment when ANY of its Procedures carries a code in that set (checked across the whole Booking), and only where the billable party is a person paying for the patient (the patient or, for example, a guardian), never an organisation such as an insurer or hospital (OQ-58, OQ-73). Prepaid is a property of the procedure choice, never of the Contract; there is no Pre-paid Contract category (OQ-25).

**Prototype has.** No per-anaesthetist prepaid set and no code groups. Prepayment is a per-Procedure declaration: patientPaymentCategory 'selfFundedPrepayment' plus prepaymentDetail {full | split, depositAmount} (types.ts:425-438), and bookingRequiresPrepayment reads those flags (selectors.ts:307-314).

**Impact.** New Anaesthetist.prepaidSettings (rvgCodes[], rvgGroups[]) and the RvgGroup master (DM-13); prepayment-required becomes derived from a Booking's Procedures against that set, and only where the Contract's billable party is a person. Anaesthetist profile screens (mobile and web) and the Admin anaesthetist editor gain a tick list. Depends on DM-10 (category removed), DM-11 (who is the billable party) and DM-13 (groups); feeds DM-20.

**Catalogue:** [FT-06.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-06.1.md), [US-06.1.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.1.1.md), [US-06.1.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.1.2.md), [US-06.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.2.1.md), [US-12.1.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-12.1.3.md), [US-05.1.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.1.3.md), [OQ-25](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-25.md), [OQ-58](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-58.md), [OQ-73](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-73.md)

**Prototype:** `aa-prototype/src/domain/types.ts:425`, `aa-prototype/src/domain/types.ts:435`, `aa-prototype/src/store/selectors.ts:307`, `aa-prototype/src/domain/types.ts:141`

## DM-20

### Prepayment lifecycle: automatic estimate at setup, admin approval before sending, all or nothing, a warning not a gate

**Kind:** ChangedLifecycle · **Size:** L · **State:** Re-graded

**Since the last pass.** The completion gate and its audited override are gone (Phase 15a, D5); the rest is still to build. 2026-10-02 added: prepayment only for a person paying, re-check on every List or Booking move, partial prepayment and over- or under-run still open (OQ-76), pair timing open (OQ-80).

**Catalogue says.** The Booking holds prepaymentRequired, prepaidAmount and the prepayment invoice. The amount is always the full estimate, never a deposit or fixed partial amount (whether partial happens is open, OQ-76): (base units from the procedure's default RVG Contract + time units + 2 contingency modifier units, a setting) x the anaesthetist's own unit value, time units from the estimated duration the surgeon's rooms give by the standard tiered rule, parts rounded up (OQ-38, OQ-50, OQ-75), always worded as an estimate from standard letter templates (US-06.3.6). The invoice is generated automatically at booking setup only where the billable party is a person paying for the patient (OQ-73), is held until an admin approves it, then goes out with the letter; submitting the List does not invoice it again. Status (unpaid, part paid, paid) is tracked with an alert as the date nears and re-checked after each receipt and whenever Procedures, Contract, List or Booking change or move. No block on completing a Booking or List: an outstanding prepayment is a warning in both apps. After AUTHORISED the balance (final minus prepaid) is invoiced if positive (a small shortfall may be let go, OQ-61; an overrun may or may not raise another invoice, OQ-76); if negative nothing is refunded or credited (OQ-03).

**Prototype has.** Gate removed: completionBlockersFor (lifecycle.ts:94-112) checks billing completeness only and the unpaid prepayment is the derived 'prepaymentUnpaid' warning (domain/warnings/rules/prepaymentUnpaid.ts; Booking.prepaymentOverride is gone). Still July-shaped: a separate 'prePayment' Invoice kind (types.ts:680) raised on demand by the office (raisePreProcedureInvoice, prepaymentActions.ts:51-) against 'selfFundedPrepayment' Procedures (selectors.ts:307); amount is the Procedure fee (full) or a flat deposit (split; types.ts:435-438, invoiceBuild.ts:456-500); no estimate calculation, no estimated duration (DM-40), no contingency units, no letter template, no admin approval hold, no payer-is-a-person condition. The balance run nets it as a negative 'Less pre-payment deposit' line (a deposit larger than the fee is a negativeTotal exception, invoiceBuild.ts:417). Status is derived (prepaymentStatusFor, selectors.ts:372-379).

**Impact.** Booking gains prepayment {required (derived), amount, invoiceId}; add a pure estimator in domain/billing, a contingency-units setting and a PrepaymentLetterTemplate master; the 'prePayment' Invoice kind stays but is generated at booking setup into a held (not sent) state and sent on admin approval. Remove the deposit/split form (prepaymentDetail.split). The unpaid-prepayment warning exists; Phase 27 makes its strength escalate by date. Remaining-balance invoice links to the prepayment invoice; excess prepaid creates nothing. Depends on DM-10, DM-11, DM-19, DM-22 and DM-40 (estimated duration). Persisted seed shape changes.

**Catalogue:** [EP-06](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/EP-06.md), [FT-06.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-06.2.md), [FT-06.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-06.3.md), [FT-06.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-06.4.md), [US-06.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.2.2.md), [US-06.2.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.2.3.md), [US-06.2.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.2.4.md), [US-06.2.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.2.5.md), [US-06.3.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.3.1.md), [US-06.3.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.3.2.md), [US-06.3.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.3.4.md), [US-06.3.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.3.5.md), [US-06.3.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.3.6.md), [US-06.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.4.1.md), [US-06.4.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.4.2.md), [US-08.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.2.2.md), [OQ-03](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-03.md), [OQ-38](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-38.md), [OQ-50](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-50.md), [OQ-57](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-57.md), [OQ-58](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-58.md), [OQ-61](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-61.md), [OQ-73](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-73.md), [OQ-75](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-75.md), [OQ-76](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-76.md), [OQ-80](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-80.md)

**Prototype:** `aa-prototype/src/store/lifecycle.ts:94`, `aa-prototype/src/domain/types.ts:435`, `aa-prototype/src/domain/types.ts:680`, `aa-prototype/src/store/prepaymentActions.ts:51`, `aa-prototype/src/store/selectors.ts:372`, `aa-prototype/src/domain/billing/invoiceBuild.ts:456`, `aa-prototype/src/domain/warnings/rules/prepaymentUnpaid.ts`

## DM-21

### Trust account: prepayment held pending, refunded in full on cancellation, kept when the Booking moves

**Kind:** NewEntity · **Size:** M · **State:** Re-graded

**Since the last pass.** 2026-10-02 (OQ-70): when a prepaid Booking moves, the agreed amount stands and only the payable half of the draft pair is updated to the doer; when the pair is created and amended is open (OQ-80).

**Catalogue says.** Prepayment money is held in AA's trust account as a pending payment and is not paid to the anaesthetist until the procedure is done. A cancelled Booking's prepayment is always refunded in full to the patient from the trust account, recorded as a credit against the prepayment invoice, even if the anaesthetist would otherwise have been paid; payments out of the trust account are made from the system. A prepaid Booking moved to another anaesthetist keeps the agreed amount, is not billed again, only the payable half of its draft pair is updated to the doer (so the trust account in Xero stays balanced; which half is our reading) and the doer wears or benefits from the difference (US-06.5.4). A cancelled prepayment later rebooked with a new anaesthetist is a fresh prepayment (US-06.5.3). Trust payments go out weekly, other payables on the 20th (OQ-47).

**Prototype has.** Nothing. cancelBooking soft-cancels a Booking (lifecycle.ts:348-392) with no reference to prepayment money; no refund, trust account or hold concept. The payable to the anaesthetist is released as soon as money is received, pro rata (XeroAccPay.amountAuthorised, types.ts:804), so there is no 'pending until the procedure is done' state.

**Impact.** New TrustAccount balance and refund entries wired to Booking cancellation and credit notes (DM-24), plus a payable hold: a prepayment payable stays DRAFT until the Booking's List is AUTHORISED (and so is paid to whoever did it, DM-06). Only demonstrable once the ledger exists (DM-22). Weekly versus monthly payment day is open (OQ-47): keep it a payments-run setting. Keep the pair-timing question (OQ-80) behind one function.

**Catalogue:** [FT-06.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-06.5.md), [US-06.5.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.5.1.md), [US-06.5.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.5.2.md), [US-06.5.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.5.3.md), [US-06.5.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.5.4.md), [US-10.2.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-10.2.6.md), [OQ-21](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-21.md), [OQ-40](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-40.md), [OQ-47](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-47.md), [OQ-70](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-70.md), [OQ-80](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-80.md)

**Prototype:** `aa-prototype/src/store/lifecycle.ts:348`, `aa-prototype/src/domain/types.ts:790`, `aa-prototype/src/store/payablesActions.ts:146`

## DM-22

### Internal ledger: promote BillingCase into linked receivable and payable records (Xero stays a mirror)

**Kind:** ChangedEntity · **Size:** L · **State:** Unchanged

**Since the last pass.** Unchanged since the earlier pass. 2026-10-02 notes: audit stops at invoices and credit notes (DM-45) and the BCTI-per-procedure versus per-invoice ambiguity is still open (OQ-29).

**Catalogue says.** For every invoice the engine creates a linked receivable (from the billable party) and payable (to the anaesthetist) in its own ledger, linked to each other and to the Booking and Procedures. It tracks dollars in (receipts) and out (disbursements) as two separate states and is the system of record: patient and anaesthetist history survive Xero contact archiving and apps read balances from it. Xero holds a mirrored ACCREC and a DRAFT ACCPAY created together and linked by the returned Xero IDs; the ACCPAY is authorised for exactly the amount received; both carry the engine's unique invoice number (payable with a '-P' suffix). The ACCPAY is a buyer-created tax invoice (BCTI), one per procedure per the US-09.1.4 note yet also 'the same value as its receivable' (OQ-42), so a pair per invoice and a BCTI per Procedure are not yet reconciled; anaesthetist as supplier and AA as agent (new IRD name and GST presentation, OQ-29). Xero never holds NHI or other PII, only a unique ID.

**Prototype has.** A de facto ledger exists at invoice level: BillingCase (types.ts:707-742), one per invoice, with invoiceId, accRecId, accPayId and cumulative receivedAmount, authorisedAmount and disbursedAmount held as independent axes (status is a derived label). Apps read this mirror, never Xero, and receipts are an append-only idempotent set (BillingReceipt, types.ts:752-762). The Xero simulation (XeroContact, XeroAccRec, XeroAccPay, PaymentIn, Disbursement; types.ts:768-825) mirrors it; contacts key on the hidden ID (xeroHandoff.ts) and an archived contact is unarchived before invoicing (aligned). Missing: separate receivable and payable records with their own numbers (no '-P' payable number), links from each to Booking and Procedures, BCTI presentation, credit legs, AA-fee and additional-invoice legs, and patient-level history as first-class ledger data (today joined through Bookings).

**Impact.** Foundation for the money side but an evolution, not a rewrite: promote BillingCase into a LedgerPair (receivable leg and payable leg, each with its own number, amount, received or disbursed entries and Xero IDs, plus Booking and Procedure links, and the payee anaesthetist stamped at authorisation). The Xero slice stays as simulated mirrors. Selectors, payment and payables actions, the GST schedule source, Accounts screens and the Demo Xero simulator re-point to the pair. Must precede DM-17 and DM-18 (event invoices), DM-20, DM-21, DM-23, DM-24, DM-25, DM-26 and DM-29. Seed and PERSIST_VERSION change.

**Catalogue:** [EP-08](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/EP-08.md), [FT-08.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-08.3.md), [US-08.3.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.3.1.md), [US-08.3.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.3.2.md), [US-08.3.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.3.3.md), [US-08.3.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.3.4.md), [US-08.4.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.4.3.md), [US-08.4.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.4.5.md), [EP-09](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/EP-09.md), [US-09.1.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-09.1.1.md), [US-09.1.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-09.1.4.md), [US-09.3.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-09.3.1.md), [US-09.3.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-09.3.4.md), [US-10.1.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-10.1.2.md), [US-10.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-10.2.1.md), [US-10.2.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-10.2.3.md), [OQ-29](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-29.md), [OQ-30](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-30.md), [OQ-42](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-42.md)

**Prototype:** `aa-prototype/src/domain/types.ts:707`, `aa-prototype/src/domain/types.ts:752`, `aa-prototype/src/domain/types.ts:768`, `aa-prototype/src/store/appStore.ts:43`, `aa-prototype/src/store/xeroHandoff.ts:153`, `aa-prototype/src/store/paymentActions.ts:78`, `aa-prototype/src/store/payablesActions.ts:146`

## DM-23

### Derived ledger positions: whole ledger, per anaesthetist and per patient, and a flat outstanding list with no ageing

**Kind:** NewRelationship · **Size:** M · **State:** Re-graded

**Since the last pass.** 2026-10-02: the patient balance is always attributed to the patient even when a guardian pays (US-13.2.2, Greg: 'a patient-centric view'); the anaesthetist scope is merged into US-13.2.1 and Greg wants an out-of-balance anaesthetist visible as a list.

**Catalogue says.** Admins see the ledger in or out of balance at two scopes (US-13.2.1: the whole ledger with receivables outstanding, receipts held, payables due, amounts disbursed and any imbalance, and a single anaesthetist, owed to them, collected and paid out, US-08.3.5, which anaesthetists also see) and, separately, a single patient (US-13.2.2, US-11.3.1) (all invoices across every anaesthetist, paid, part paid or unpaid), the patient balance always shown against the patient whoever the billable party is. Anaesthetists see a flat list of their own outstanding payables (about 100 rows, oldest first) with NO ageing buckets, age chips or Overdue view (OQ-59, accepted for now), and a date-ranged GST summary aligned to their GST period, plus a dashboard combining calendar, financial position and locum availability.

**Prototype has.** Balance figures derive from BillingCase and the Xero mirror (caseOutstandingAmount, selectors.ts:272; the flat list accpayInvoicesFor, selectors.ts:648-665) but there is no whole-ledger in-balance view and no patient-scoped ledger screen. The anaesthetist dashboard is partly seeded demo figures (seed/anaesthetistDashboard.ts). Patient outstanding is only a boolean 'has unpaid prior episode' (patientHasOutstandingPriorEpisode, selectors.ts:285-299), joined through the Booking. Ageing buckets and an Overdue view exist (bucketForAgingDays in dateDays.ts; receivablesAgingFor, selectors.ts:678-690; overdueAccountsFor, :667) which the catalogue now drops.

**Impact.** Pure derived selectors over the DM-22 ledger, no new stored entity: balance totals with an imbalance figure, per-anaesthetist and per-patient rollups (the receivable must carry or reach the patient so a guardian-paid invoice still counts to the patient), a patient invoice list. Retire the seeded dashboard figures where a derivation exists and remove the ageing and overdue UI. New Admin views; web dashboard and Accounts screen re-point. Depends on DM-22.

**Verified 2026-10-03 (corrected).** Every prototype claim holds (selectors.ts:272, :285, :648, :667, :678; seed/anaesthetistDashboard.ts exists). Corrected only the scope count: US-13.2.1 defines two ledger scopes (the per-anaesthetist one merged from the retired US-13.2.3) and the patient balance is a third, separate story. US-13.2.1 still has its acceptance criterion to be written with the prototype, so the anaesthetist-scope screen content is not fixed.

**Catalogue:** [FT-13.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-13.2.md), [US-13.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.2.1.md), [US-13.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.2.2.md), [US-08.3.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.3.5.md), [US-11.3.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.3.1.md), [FT-12.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-12.2.md), [US-12.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-12.2.1.md), [US-12.2.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-12.2.3.md), [OQ-59](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-59.md)

**Prototype:** `aa-prototype/src/store/selectors.ts:272`, `aa-prototype/src/store/selectors.ts:648`, `aa-prototype/src/store/selectors.ts:678`, `aa-prototype/src/domain/seed/anaesthetistDashboard.ts`, `aa-prototype/src/apps/web/screens/AccountsScreen.tsx`

## DM-24

### A wrong invoice is credited in full, then rebilled (credit note to any party, payable reversal, new invoice), recorded as events

**Kind:** NewLifecycle · **Size:** L · **State:** Re-graded

**Since the last pass.** 2026-10-02: the credit note option on additional invoices credits the original to any party, the original billable party included; the credit and rebill are events on the Procedure; a rebill can start from a copy of the original's lines (US-08.6.6); whether the credit reverses the linked payable is open (OQ-77).

**Catalogue says.** An issued invoice is never edited, retracted or partly adjusted. An admin credits it in full (a credit note against the receivable for the whole amount to the party they pick, the original billable party included, a reversal of the linked payable as a negative invoice, Xero ACCREC and ACCPAY reversed and recreated together) and bills a new corrected invoice, or new additional invoices for a split, each linked to the original. The credit and the new invoices are events on the Procedure. A credit note is not a refund; refunding a resulting credit happens outside the system. The credit note must reach the billable party (Xero does not send them). An AA-side error is fixed this way (OQ-19); otherwise an unpaid invoice stays outstanding. After the anaesthetist has been paid, the reversal is a negative invoice (DM-25). Open: whether the rebilled invoices must total the credited one, and a split asked for before the combined invoice is sent (OQ-77).

**Prototype has.** No credit note, reversal or rebill. retryBillingCase (billingRun.ts:285) re-runs a FAILED case only; XeroAccRec has a 'voided' status (types.ts:787) that nothing drives; negative invoices are refused (negativeTotal, invoiceBuild.ts:417). Correction after invoicing is unsupported except through the post-op addendum.

**Impact.** New CreditNote record (originalInvoiceId, party, amount, reason, issuedBy) with ledger reversal legs, Invoice.creditedBy and rebilledAs links, an event record on the Procedure (DM-17), an admin action that credits and opens a rebill pre-filled from the original's lines, and a simulated Xero credit-note path. Depends on DM-17, DM-22 and DM-27; DM-25 covers the paid-anaesthetist case. Keep payable reversal and rebill total switchable until OQ-77 settles.

**Catalogue:** [US-08.6.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.6.2.md), [US-08.6.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.6.5.md), [US-08.6.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.6.6.md), [FT-08.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-08.6.md), [US-06.5.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.5.2.md), [OQ-19](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-19.md), [OQ-28](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-28.md), [OQ-36](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-36.md), [OQ-42](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-42.md), [OQ-72](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-72.md), [OQ-77](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-77.md)

**Prototype:** `aa-prototype/src/domain/types.ts:787`, `aa-prototype/src/store/billingRun.ts:285`, `aa-prototype/src/domain/billing/invoiceBuild.ts:417`

## DM-25

### Negative invoice to the anaesthetist, netted in the payment run and shown on a remittance advice; BCTIs approved per period

**Kind:** NewEntity · **Size:** M · **State:** Re-graded

**Since the last pass.** 2026-10-02 (OQ-71): with no later payment to net against, the case is handled outside the system and nothing is built; the carry-forward-and-invoice reading used in the plan for Phase 39a is no longer required by the catalogue.

**Catalogue says.** A refund after the anaesthetist has been paid is a credit note to the billable party offset by a negative invoice to the anaesthetist, netted against their positive payables in the next payment run (for example 19 positive and one negative) and shown on the remittance advice; the anaesthetist bears the refund. With no later payment to net against, AA settles it with the anaesthetist outside the system and nothing is built (OQ-71); a cancelled prepayment is not this case. Once the BCTIs for a payment period are generated they are approved for payment before being paid; who approves and how it relates to releasing a payable when its receivable is paid is open (OQ-47). Payments are weekly for trust money, the 20th monthly otherwise.

**Prototype has.** A payables run exists (runPayables, payablesActions.ts:146) that pays each ACCPAY's increment (amountAuthorised minus amountDisbursed) and records Disbursement rows carrying a payablesRunId string (types.ts:819-825). There is no PayablesRun record, no negative amounts anywhere, no remittance advice entity and no period approval step: release is automatic pro rata when money is received.

**Impact.** New PayablesRun record (period, status, approvedBy), signed payable amounts with netting in the run, and a RemittanceAdvice view per anaesthetist per run listing invoices paid and negatives netted. A period-approval gate sits between BCTI generation and the run. Depends on DM-22 and DM-24; interacts with the trust hold (DM-21). OQ-47 is open, so model the run record and netting but leave the approver undecided. Do not build recovery for the no-later-payment case.

**Catalogue:** [US-10.2.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-10.2.5.md), [US-10.2.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-10.2.6.md), [US-10.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-10.2.1.md), [FT-10.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-10.2.md), [US-09.1.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-09.1.4.md), [US-08.6.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.6.2.md), [OQ-42](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-42.md), [OQ-47](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-47.md), [OQ-71](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-71.md)

**Prototype:** `aa-prototype/src/store/payablesActions.ts:146`, `aa-prototype/src/domain/types.ts:819`

## DM-26

### AA fee is a separate monthly invoice from AA to each anaesthetist, built from fee settings (not a deduction on the payable)

**Kind:** NewEntity · **Size:** M · **State:** Re-graded

**Since the last pass.** 2026-10-02 (OQ-60 still open): Greg's view, to confirm with AA's accountant, is that the fee never nets against payables, is a separate invoice paid into a separate bank account, and counts only paid invoices; the fixed-charge schedule is unknown.

**Catalogue says.** At month end a fee invoice run raises one invoice per anaesthetist: fixed charges (several items may make it up) plus a charge per BCTI issued to them in the month, set on a settings page (for example $500 + $5 x 40 = $700). It is a separate ledger item from any procedure's receivable and payable, the one flow where money goes from the anaesthetist to AA, and the anaesthetist sees it and its payment status in their app. Open: what the per-invoice charge counts (Greg: only paid invoices, so a moved Booking is not charged twice), whether it nets against payables (Greg: never), the fixed schedule and whether it varies by anaesthetist (OQ-60).

**Prototype has.** An illustrative fixed 5% service fee (AA_SERVICE_FEE_RATE, agencyFee.ts:7) is deducted from each ACCPAY at handoff: XeroAccPay stores grossAmount, serviceFeeRate, serviceFeeAmount and a net amountPayable (types.ts:790-807; xeroHandoff.ts:234; seeded history uses it too, seed/history.ts:265, seed/billing.ts:204). No fee invoice entity, no AA-to-anaesthetist receivable, no fee settings and no anaesthetist-facing view.

**Impact.** Change the payable to the gross procedure amount and add AaFeeInvoice (anaesthetistId, period, items, per-BCTI count and charge, total, status) with its own receivable from the anaesthetist, an AaFeeSettings record (fixed items, per-invoice rate) behind an Admin settings page, a monthly run action and an anaesthetist app view. Changes ACCPAY amounts everywhere shown (Demo Xero, Accounts, payables run) and reseeds history. Depends on DM-22. Keep the open OQ-60 variants as settings, not code, and count BCTIs through one tested function.

**Catalogue:** [FT-10.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-10.3.md), [US-10.3.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-10.3.1.md), [US-10.3.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-10.3.2.md), [US-10.3.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-10.3.3.md), [EP-10](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/EP-10.md), [OQ-02](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-02.md), [OQ-60](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-60.md)

**Prototype:** `aa-prototype/src/domain/billing/agencyFee.ts:7`, `aa-prototype/src/domain/types.ts:790`, `aa-prototype/src/store/xeroHandoff.ts:234`, `aa-prototype/src/domain/seed/history.ts:265`

## DM-27

### Invoice entity: numbering, supplier and agent presentation, email, delivery, lineage and new kinds

**Kind:** ChangedEntity · **Size:** M · **State:** Re-graded

**Since the last pass.** Kinds widened 2026-10-02: an event invoice (pre-op, post-op, additional) and a credit note are invoices the event model produces (DM-17, DM-18, DM-24).

**Catalogue says.** Every invoice has a unique number (the remittance-matching key; the payable carries it plus '-P'), is presented in the anaesthetist's name with their GST number and AA as agent, takes its layout (Contract holder or patient) and delivery method (email or portal upload) from the Contract, goes to the invoice email captured on the Booking, holds prices GST-exclusive with inclusive derived, and any past invoice can be produced exactly as raised from locked data (its recipe). Kinds needed: standard, prepayment, remaining balance, event (pre-op or post-op), additional, credit note, negative (anaesthetist side) and AA fee.

**Prototype has.** Invoice (types.ts:672-686): invoiceNumber, caseReference, bookingId, counterparty, layout, kind 'standard' | 'prePayment', subtotal, gst, total, raisedAtISO, emailedAtISO. No invoice email, delivery method, supplier or agent fields, procedure link, original-invoice link or any other kind. GST is 15% on ex-GST lines (invoiceBuild.ts:39); layout is derived from counterparty kind (layoutFor, invoiceBuild.ts:216), not from the Contract. Balance-after-prepayment is not a distinct kind.

**Impact.** Add recipientEmail, deliveryMethod, supplier (anaesthetist with GST number), agent, procedureIds, originalInvoiceId and widen kind. The invoice document component and email step change; layout and delivery become Contract-driven. Depends on DM-07 and DM-11; DM-17, DM-18, DM-24, DM-25 and DM-26 each add a kind.

**Catalogue:** [FT-08.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-08.4.md), [US-08.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.4.1.md), [US-08.4.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.4.2.md), [US-08.4.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.4.3.md), [US-08.4.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.4.4.md), [US-08.4.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.4.5.md), [US-04.2.8](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.8.md), [US-05.2.7](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.2.7.md), [US-06.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.4.1.md), [OQ-29](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-29.md)

**Prototype:** `aa-prototype/src/domain/types.ts:672`, `aa-prototype/src/domain/billing/invoiceBuild.ts:216`, `aa-prototype/src/apps/admin/screens/InvoiceDocument.tsx`, `aa-prototype/src/store/billingRun.ts:398`

## DM-28

### A Contract payment setting (full or split) drives a second invoice; shares are typed $ or % set on the Booking; grouping by billable party is already aligned

**Kind:** ChangedEntity · **Size:** M · **State:** Re-graded

**Since the last pass.** 2026-10-02 (OQ-68, our pick, to pressure-test with AA): each party's share is a typed value in $ or %, set on the Booking and defaulting from the Contract; the split can divide the line in any way.

**Catalogue says.** One invoice per distinct billable party within a Booking. A Contract's payment setting is FULL (the assigned party pays the whole line) or SPLIT (the line item is divided between parties, for example an insurer and the patient's gap, with an invoice each). Each party's share is a typed value in $ or % (for example $48 or 48%), set on the Booking and defaulting from the Contract; whether percentages must total 100 and what the line items say are not settled. Billing failure is per Booking: other Bookings on a List still invoice; if any Procedure's billable party fails the whole Booking is held back for a manual fix (OQ-05).

**Prototype has.** Grouping already is one invoice per Booking per distinct counterparty (buildInvoicesForBooking, invoiceBuild.ts:264), and failure is already per Booking: a build exception fails the whole Booking and the List's other Bookings still bill (billingRun.ts:68-165, aligned, no change). Splitting one Procedure between funders uses BillingLine.funderOverride (types.ts:528-540) with a to-the-cent conservation rule (setProcedureFunderAllocation, billingLineActions.ts:218): an office-set per-line allocation, not a Contract-declared payment setting and not typed $ or %.

**Impact.** The grouping key does not change: US-08.2.1 groups by the billable party each Procedure's Contract defines (DM-11). funderOverride and its conservation logic can stay as the demo mechanism, or be replaced by Contract.paymentSetting SPLIT with typed $ or % shares generating a second invoice. Low urgency; leave until DM-07, DM-11 and DM-22 land.

**Catalogue:** [FT-08.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-08.2.md), [US-08.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.2.1.md), [US-08.2.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.2.3.md), [US-08.5.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.5.2.md), [US-04.2.12](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.12.md), [US-11.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.4.1.md), [OQ-05](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-05.md), [OQ-23](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-23.md), [OQ-68](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-68.md)

**Prototype:** `aa-prototype/src/domain/billing/invoiceBuild.ts:264`, `aa-prototype/src/domain/types.ts:528`, `aa-prototype/src/store/billingLineActions.ts:218`, `aa-prototype/src/store/billingRun.ts:68`

## DM-29

### GST schedule is on a cash basis of payables actually paid, not of amounts received

**Kind:** RuleChange · **Size:** S · **State:** Unchanged

**Since the last pass.** Unchanged since the earlier pass; anchors refreshed.

**Catalogue says.** Each anaesthetist gets a GST schedule aligned to their own GST period: the sales AA made for them, the GST component of each, and a check that it balances with what they were paid. GST is on a cash basis, so only payables AA actually paid them in the period are listed; anything outstanding falls into a later period. Ben wants it very early (release not confirmed).

**Prototype has.** gstActivityFor (selectors.ts:708-737) lists amounts RECEIVED from payers (BillingReceipt rows with grossAmount and gstAmount at receipt, types.ts:752-762), windowed by the anaesthetist's gstPeriod. It is keyed on money in, not on Disbursement rows (types.ts:819-825), and has no balance check against payments made.

**Impact.** Re-source the schedule from disbursed payables (via the ledger payable record, DM-22) and add the balance check. Small, but the receipt-based version must not be shown as the GST schedule. Depends on DM-22 and, for a period-based payment run, DM-25.

**Catalogue:** [US-12.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-12.2.2.md), [US-12.1.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-12.1.2.md), [US-05.2.7](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.2.7.md), [EP-12](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/EP-12.md), [FT-12.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-12.2.md)

**Prototype:** `aa-prototype/src/store/selectors.ts:708`, `aa-prototype/src/domain/types.ts:752`, `aa-prototype/src/domain/types.ts:819`

## DM-30

### Patient: NHI required, missing NHI as a flagged problem list, Booking proceeds but authorising is blocked

**Kind:** RuleChange · **Size:** M · **State:** Unchanged

**Since the last pass.** Unchanged since the earlier pass; the lean (OQ-49) is still a working assumption.

**Catalogue says.** One patient record per NHI (both formats validated) with a hidden internal ID for billing and the ledger; NHI never goes to Xero (OQ-30). Proposed: the system's own patient ID as the key with the NHI attached later as a second unique index (OQ-49). The NHI is required: a patient without one is an exception on a problem list (showing patient, List and surgeon's room) until the NHI is added, and the anaesthetist sees the NHI or 'NHI missing' on each Booking. Working assumption until OQ-49: the Booking, Procedures and Contracts go ahead flagged and authorising the List is blocked until the NHI is added. The NHI can be refreshed from the central register. Duplicates found later are part of OQ-49.

**Prototype has.** Patient.nhi is OPTIONAL (types.ts:105) and a provisional record is created without one (upsertPatient 'createdProvisional', intake.ts:52-127); NHI is validated for both formats and the hidden internal ID is already the key (aligned). No problem list, and nothing stops authoriseList (lifecycle.ts:262-292) for a Booking whose patient has no NHI. The NHI shows on the Booking detail with a badge but no explicit 'NHI missing' state (BookingDetailBody.tsx:316, nhiBadge in shared/format.ts).

**Impact.** Mostly rules and views with a small model change: a derived missing-NHI exception set feeding an Admin problem list, an 'NHI pending' state on the patient, an authorise guard for Lists holding such Bookings, and an attach-NHI action that merges onto an existing record. The provisional-versus-blocked decision (OQ-49) determines whether the current createdProvisional path stays. The warning surface is DM-31.

**Catalogue:** [FT-11.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-11.1.md), [US-11.1.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.1.1.md), [US-11.1.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.1.2.md), [US-11.1.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.1.4.md), [US-11.1.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.1.5.md), [US-03.1.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.1.5.md), [US-14.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-14.4.1.md), [OQ-30](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-30.md), [OQ-49](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-49.md)

**Prototype:** `aa-prototype/src/domain/types.ts:103`, `aa-prototype/src/store/intake.ts:52`, `aa-prototype/src/store/lifecycle.ts:262`, `aa-prototype/src/shared/booking/BookingDetailBody.tsx:316`

## DM-31

### One warning routine: the model is built (derived warnings, one rule, a stored clearance); the remaining rules, the to-do list and the Booking flag in both apps are not

**Kind:** NewEntity · **Size:** M · **State:** Partly built

**Since the last pass.** Partly built in Phase 15a. 2026-10-02: the confirm step on submit was dropped, the Booking flag is 'much like the prototype today' and visually clear on opening, balance days count from the invoice date and a credit balance is mild (OQ-74), and notices that need no action go to the shared pool (DM-41), not the to-do list.

**Catalogue says.** One routine checks Bookings and their billable parties and raises warnings, several per Booking if need be, of a before-procedure or after-procedure kind, mild or strong, each with text. Current warnings: unpaid prepayment, a billable patient with a balance (for an amount owing mild under the threshold and strong over it, 90 days to start from the invoice date; a credit balance is mild; yellow versus red), a child (under 18) as billable party (mild), and base units outside the RVG code's range (after-procedure, for the office). Warnings never block saving, submitting or authorising. Open warnings show on the admin dashboard as a to-do list where an admin can clear them, and as a small warning triangle on the Booking in both apps, visually clear when the anaesthetist opens it; there is no confirm step on submit. A settings page for thresholds and switching off checks is Future Work (US-13.7.4), although US-11.3.2 says admins can change the 90-day threshold (the two disagree).

**Prototype has.** Built: domain/warnings (routine.ts, types.ts, rules/prepaymentUnpaid.ts, settings.ts) with Warning kind, strength, text and rule, derived per Booking and never stored; the only stored state is an office clearance in schedule.warningClearances (store/warnings.ts, clearWarning, openWarnings, warningSummaryByList); AppSettings.warningRules seeded in the store (seed/index.ts, appStore.ts v16); the unpaid-prepayment rule is the only one registered (rules/index.ts:11) and the Booking detail shows its text (BookingDetailBody.tsx:5, :503). Not built: the other rules (child billable party, patient balance, out-of-range base units), a dashboard to-do list with clearing and a Booking flag in both apps (no UI reads openWarnings; the Day grid still draws its own prepayment dot from prepaymentStatusFor, AdminApp.tsx:192-203). HARD blocks that the catalogue wants as warnings remain: the out-of-range base refusal (validateBookingForBilling.ts:152-163) and the insurer direct-claims failure (:166-182). The July scatter of ListConflict (types.ts:265), computed review flags (reviewFlags.ts) and the outstandingPriorBalance boolean (selectors.ts:285) is still separate.

**Impact.** The Warning model and routine exist; remaining work registers rules as their source deltas land (DM-11 child billable party, DM-13 out-of-range base units, DM-20 prepayment escalation, DM-30 missing NHI, DM-23 patient balance with its invoice-date and credit-balance rules), converts the two hard blocks to warnings, builds the Admin to-do list and the Booking flag, and decides the alert-threshold setting (AppSettings already exists, US-11.3.2 versus US-13.7.4). ListConflict stays as the List-level flag (DM-04). Can run any time after DM-13 and DM-11 give it sources; no model change blocks it.

**Catalogue:** [FT-13.7](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-13.7.md), [US-13.7.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.7.1.md), [US-13.7.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.7.2.md), [US-13.7.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.7.3.md), [US-11.2.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.2.4.md), [US-11.3.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.3.2.md), [US-06.3.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.3.2.md), [US-03.3.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.3.1.md), [US-01.5.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.5.2.md), [OQ-41](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-41.md), [OQ-54](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-54.md), [OQ-56](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-56.md), [OQ-57](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-57.md), [OQ-74](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-74.md)

**Prototype:** `aa-prototype/src/domain/warnings/types.ts`, `aa-prototype/src/domain/warnings/routine.ts`, `aa-prototype/src/domain/warnings/rules/index.ts:11`, `aa-prototype/src/store/warnings.ts`, `aa-prototype/src/domain/billing/validateBookingForBilling.ts:152`, `aa-prototype/src/apps/admin/reviewFlags.ts`, `aa-prototype/src/store/selectors.ts:285`

## DM-32

### Surgeon profile, surgeons' rooms, blacklist, surgeon groups and hospital contact email

**Kind:** NewEntity · **Size:** L · **State:** Re-graded

**Since the last pass.** 2026-10-02: Greg would design the blacklist as two lists (a surgeon may refuse an anaesthetist too); whether each side learns of the other's entry is deferred (OQ-43); a room's picture (contacts, surgeons as children, or an actor-and-role relationship) is left to the developers.

**Catalogue says.** Surgeons belong to rooms; a room is master data holding a name, contact email and phone and its surgeons (a surgeon is linked to a room; whether more than one is not settled). A surgeon profile holds the name, room, NZ medical registration number and one HPI CPN (the practitioner's unique index; the anaesthetist profile holds one too, OQ-52). A blacklist of anaesthetist and surgeon pairings is kept by admin staff (optional reason); it gives a soft warning, never a block, when a List or Draft List is assigned and when an anaesthetist moves their own List into a colleague's Slot, and blacklisted options are shown separated in the pickers. Anaesthetists may also keep their own (one list or two, OQ-43); the name may become 'block list'. Hospitals hold a contact email for booking updates. Surgeon groups are master data and can hold Contracts. The room is who the office emails for a missing NHI and who sends estimated durations.

**Prototype has.** Surgeon is only { id, name, specialty? } (types.ts:160-164); Hospital is { id, name } (types.ts:155-158). No room entity, no registration number or HPI CPN, no blacklist, no contact emails, no surgeon group with members. The Anaesthetist master already carries hpiId (types.ts:149, aligned).

**Impact.** New masters SurgeonRoom, extended Surgeon, SurgeonGroup (members), BlacklistEntry (allow both directions) and Hospital.contactEmail; seed with rooms and identifiers; Admin master-data editors and surgeon profile page; blacklist-aware pickers in List and Draft List assignment and in the anaesthetist's move (DM-05). Independent of most other work but required by the warnings in DM-03 and DM-05, the mailto draft (DM-35) and a Surgeon Group Contract holder (DM-07). Rename hpiId to HPI CPN in copy.

**Catalogue:** [FT-13.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-13.6.md), [US-13.6.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.6.1.md), [US-13.6.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.6.2.md), [US-13.6.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.6.3.md), [US-01.3.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.3.5.md), [US-01.4.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.4.5.md), [US-13.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.4.1.md), [US-02.3.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.3.3.md), [OQ-43](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-43.md), [OQ-52](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-52.md)

**Prototype:** `aa-prototype/src/domain/types.ts:155`, `aa-prototype/src/domain/types.ts:160`, `aa-prototype/src/domain/seed/cast.ts`, `aa-prototype/src/apps/admin/screens/MasterData.tsx`

## DM-33

### Anaesthetist profile: bank details, prepaid settings, start date, HPI CPN, admin-editable

**Kind:** ChangedEntity · **Size:** S · **State:** Unchanged

**Since the last pass.** Unchanged since the earlier pass; anchors refreshed.

**Catalogue says.** The anaesthetist record holds contact details, registration number, HPI CPN (where available), bank account details (held in the system, on the profile, and used for the payables run, OQ-14), dollar value per unit, GST period, prepaid RVG codes or groups (admin can maintain them on their behalf) and, for Slot generation, a start date.

**Prototype has.** Anaesthetist (types.ts:141-151): registrationNumber, name, phone, email, unitValue, gstPeriod, hpiId, active. No bank account, prepaid set, start date or GST number (needed for the supplier presentation). editAnaesthetist and addAnaesthetist exist (mastersActions.ts:185, 241).

**Impact.** Additive fields (bankAccount, gstNumber for DM-27, startDate for DM-02, prepaidSettings via DM-19) and editor UI on Admin and anaesthetist profile screens. Bank details are display-only in the demo. Small; depends on DM-19.

**Catalogue:** [FT-12.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-12.1.md), [US-12.1.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-12.1.1.md), [US-12.1.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-12.1.2.md), [US-12.1.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-12.1.3.md), [US-12.1.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-12.1.4.md), [US-06.1.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.1.2.md), [US-01.1.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.1.3.md), [OQ-14](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-14.md), [OQ-52](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-52.md)

**Prototype:** `aa-prototype/src/domain/types.ts:141`, `aa-prototype/src/store/mastersActions.ts:185`, `aa-prototype/src/store/mastersActions.ts:241`

## DM-34

### Intake: import rows, admin match/create/reject decisions, unmatched queue and sync from St George's and Southern Cross only

**Kind:** ChangedEntity · **Size:** L · **State:** Re-graded

**Since the last pass.** Trimmed 2026-10-02: US-02.1.1 is now 'import hospital bookings, however each hospital provides them'; US-02.1.5 dropped the schedule, pull-on-open, sync button and last-synced ACs ('remove all of the faff') and keeps 'no silent apply'; surgeon PDF ingest (US-02.2.1) moved to Future Work. The domain model still mentions a last-synced time.

**Catalogue says.** The priority pathway is the hospital import, brought in from St George's and Southern Cross by an automatic sync whose technical particulars are still to come (other hospitals are Future Work), with matching a manual admin review. Every imported row gets an admin decision: match to an existing List and Booking (with the field differences shown first, including updates to an already matched Booking), create a Booking on an existing List, create a List in an anaesthetist's Slot, create a Draft List when nobody is assigned yet, or reject; unmatched rows stay in a queue; nothing applies until an admin decides. Surgeon PDF ingest (read, correct, ingest) is Future Work. HL7 v2, FHIR R4, near real time, reliability monitoring, more feeds and automatic matching are Future Work; NHI lookup is in scope.

**Prototype has.** An HL7/FHIR-centred integration model: IntegrationFeed per hospital with a field mapping (types.ts:832-838), IntegrationMessage log with statuses and MSH-10 dedupe (types.ts:852-872), and a simulator that creates or updates Bookings automatically on DRAFT Lists (integrationActions.ts:309-) with a monitor screen. ingestPdfRow ingests a corrected PDF row (integrationActions.ts:434). Three feeds (St George's HL7, Christchurch Public HL7, Southern Cross FHIR; domain/integrations/feeds.ts:20-37). No import-row record, admin decision, unmatched queue, last-synced state, field-difference view or Draft List target. NHI lookup already simulated (domain/nzhis.ts lookupNhi).

**Impact.** New ImportBatch/ImportRow (hospital, source, raw fields, proposed match, decision MATCH | CREATE_BOOKING | CREATE_LIST | CREATE_DRAFT | REJECT | UNMATCHED, decidedBy) and the two integrated hospitals as the only automatic sources. No SyncState or last-synced time is needed: US-02.1.5 removed it, and only the domain model still mentions it. The third seeded feed (Christchurch Public HL7, domain/integrations/feeds.ts:34) is outside the first release (US-14.6.1, Future Work) and should leave the shipped scenario. The matching screen must stop the automatic apply the simulator does today (contradicts US-02.1.5). The HL7/FHIR message model, retry and dead-letter monitor and the PDF ingest are Future Work: leave them behind the Demo panel, do not extend them. The unmatched queue and Draft List creation depend on DM-03.

**Verified 2026-10-03 (corrected).** US-02.1.1 to US-02.1.5 read as drafted and the prototype has no import-row record, decision or unmatched queue. Corrected: the optional SyncState is not required by any in-scope story, and the Christchurch Public feed is Future Work (US-14.6.1) though the seed ships it.

**Catalogue:** [FT-02.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-02.1.md), [FT-02.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-02.2.md), [US-02.1.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.1.1.md), [US-02.1.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.1.2.md), [US-02.1.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.1.3.md), [US-02.1.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.1.4.md), [US-02.1.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.1.5.md), [US-02.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.2.1.md), [US-02.3.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.3.1.md), [US-14.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-14.4.1.md), [FT-14.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-14.6.md), [OQ-13](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-13.md), [OQ-34](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-34.md)

**Prototype:** `aa-prototype/src/domain/types.ts:832`, `aa-prototype/src/domain/types.ts:852`, `aa-prototype/src/store/integrationActions.ts:309`, `aa-prototype/src/store/integrationActions.ts:434`, `aa-prototype/src/domain/integrations/feeds.ts:20`, `aa-prototype/src/apps/admin/screens/IntegrationMonitorScreen.tsx`

## DM-35

### Explicit-save change sets, an on-demand Booking update email draft picked from the change history, and email templates per kind of change

**Kind:** NewEntity · **Size:** M · **State:** Re-graded

**Since the last pass.** CHANGED 2026-10-02 (OQ-69): the update email is an on-demand button on any Booking, not a prompt after saving; the admin picks one or more changes from the change history; the office is offered the cover-change email from a List-move notification; user-configurable templates per kind of change are Confirmed (US-02.3.4); whether the email for an anaesthetist's own move should be automatic is OQ-82.

**Catalogue says.** An admin edits a Booking and saves explicitly (unsaved-changes warning on leaving); the system holds what changed since the last save (field, before, after, who, when) in the append-only history. Every Booking in the Admin App has an on-demand 'draft update email' button used ad hoc: the admin picks one or more changes from the history and a mailto compose window opens (plain text, about 2,000 characters) with a subject, boilerplate, the picked changes and, where known, the To address (hospital contact for a cover change, surgeon's room for a Booking change); the admin edits and sends it, the system sends and records nothing. Admins keep email templates per kind of change (a change of anaesthetist, an error, a cancellation), and the update email starts from the matching one. Whether an anaesthetist's own List move should email automatically is OQ-82. Concurrent edits are caught at save by a row version, but US-02.5.6 is Future Work.

**Prototype has.** Every field edit commits immediately through mutate() and is audited per field (editBooking and editProcedure, lifecycle.ts:402, :438); audit is append-only with before and after (types.ts:655-666). No save boundary, no change-set entity, no pick-from-history, no row version, no mailto draft, no templates, no contact emails to address it to.

**Impact.** Admin-side editing becomes a draft-then-save form emitting one ChangeSet (grouped audit entries) with an on-demand 'draft update email' button that lists the Booking's history entries for picking; needs the contact emails from DM-32 and a small EmailTemplate master per change kind. A cover change (a List move or reassignment, DM-05) is picked from the same history. Concurrent-edit detection is Future Work: skip the row version. Anaesthetist mobile flows keep immediate saves. Medium UI rework of the Admin Booking editor.

**Catalogue:** [US-02.3.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.3.2.md), [US-02.3.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.3.3.md), [US-02.3.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.3.4.md), [US-02.5.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.5.5.md), [US-13.5.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.5.2.md), [US-01.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.4.1.md), [OQ-46](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-46.md), [OQ-65](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-65.md), [OQ-69](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-69.md), [OQ-82](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-82.md)

**Prototype:** `aa-prototype/src/domain/types.ts:655`, `aa-prototype/src/store/lifecycle.ts:402`, `aa-prototype/src/store/lifecycle.ts:438`, `aa-prototype/src/store/mutate.ts`, `aa-prototype/src/shared/booking/HistoryTimeline.tsx`

## DM-36

### Dropped: List visibility after invoicing is not a delta

**Kind:** (dropped) · **State:** Dropped

**Verified 2026-10-03 (refuted).** The draft itself called this "not a firm delta". [US-07.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-07.4.1.md) (Open) says a List drops out of the anaesthetist's view once its invoices are generated, which is exactly what the prototype does (List.billedAtISO, types.ts:323; billingRun.ts:68-165), and [US-07.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-07.2.1.md) (a submitted List stays visible, marked 'completed, unbilled') matches the submitted-but-unbilled behaviour already shown. Only a Note records AA's wish that a List move from unbilled to billed rather than vanish; the trigger is open ([OQ-31](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-31.md)). Watch item, not a model change: if AA confirms the Note, show an UNBILLED or BILLED label from billedAtISO with no new entity. The ID is kept so earlier references resolve.

## DM-37

### Anaesthetist Contract changes are flagged for office approval (derived from audit; the anaesthetist cannot change the Contract today)

**Kind:** ChangedLifecycle · **Size:** S · **State:** Unchanged

**Since the last pass.** Unchanged since the earlier pass; anchors refreshed.

**Catalogue says.** Admin normally sets the Contract at booking setup; the anaesthetist may change it until they submit; every change is audited and flagged for office review; at SUBMITTED review the office approves or corrects the selections (and checks references, addresses and invoice emails). The engine reads the locked Contract only.

**Prototype has.** Review flags are computed views (reviewFlags.ts) over Booking and Procedure data; Procedure.governingContractId (types.ts:463) has no record of who set or changed it or whether the office approved it. The billing context is read-only on mobile and the full billing-setup editor (EditBillingSetupSheet) is the office's, so the anaesthetist cannot change the Contract at all.

**Impact.** No new record needed: the audit trail already records who changed governingContractId, when and in which role, so derive the 'changed by the anaesthetist, awaiting office approval' flag from audit entries and add at most an office approval stamp at review. The real gap is that the anaesthetist cannot pick a Contract at all (US-03.4.1, Confirmed), solved by the filtered picker in DM-10; keep it simple for the anaesthetist (US-15.0.1). Depends on DM-10.

**Catalogue:** [FT-03.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-03.4.md), [US-03.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.4.1.md), [US-04.3.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.3.4.md), [US-07.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-07.2.2.md), [US-15.0.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-15.0.1.md), [OQ-26](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-26.md)

**Prototype:** `aa-prototype/src/apps/admin/reviewFlags.ts`, `aa-prototype/src/domain/types.ts:463`, `aa-prototype/src/shared/booking/OfficeBillingSetup.tsx`, `aa-prototype/src/shared/flows/EditBillingSetupSheet.tsx:60`

## DM-38

### Reference data: master public-holiday calendar, recurring-booking vocabulary, controlled-spreadsheet load, editable masters

**Kind:** ChangedEntity · **Size:** S · **State:** Re-graded

**Since the last pass.** 2026-10-02: 'recurring booking' (the prototype's PermanentList) creates its List against the anaesthetist, surgeon, hospital, day and session before any Bookings, and becomes a Draft List where the Slot is unavailable (DM-03); who may edit a recurring arrangement from which end is unsettled; calendars may also load from spreadsheets; Greg would call some of these master data, not reference tables.

**Catalogue says.** Admins maintain hospitals (with contact email), surgeons, groups and rooms, insurers, anaesthetists, Slot statuses, recurring bookings, the master (public holiday) calendar plus each hospital's own, RVG codes and groups, modifier codes and Contracts, all referenced by identity (changed once, reflected everywhere) except the billing snapshot. Go-live is a clean cut: reference data is loaded from AA-owned controlled spreadsheets (hospitals, surgeons and rooms, procedures with their RVG mapping and default Contracts, modifiers, Contracts of any style) with failing rows reported and not loaded; Solutions Plus supplies operation names only.

**Prototype has.** HospitalHoliday per hospital (types.ts:612-617) and PermanentList (types.ts:585-596, structurally the recurring booking; rename only) with add and edit actions (mastersActions.ts:320, 398, 443) painted at roll-forward (clockActions.ts:43). No master statutory holiday calendar, no bulk or spreadsheet load, and several listed masters do not exist yet (rooms, procedure master, RVG groups, prepaid settings, fee schedule lines, Slot statuses as data).

**Impact.** Add a statutory holiday master and, if demoable, a validated import step in Admin master data; the master-data screen grows with each new master from DM-07, DM-09, DM-13 and DM-32. Rename PermanentList to recurring booking in copy (Phase 30 in the plan). Cutover loading is not a prototype feature, at most a demo button. Low risk; follows the other master-data deltas.

**Catalogue:** [US-13.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.4.1.md), [US-13.4.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.4.2.md), [US-13.4.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.4.3.md), [US-01.5.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.5.1.md), [US-01.3.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.3.2.md), [US-15.0.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-15.0.3.md)

**Prototype:** `aa-prototype/src/domain/types.ts:612`, `aa-prototype/src/domain/types.ts:585`, `aa-prototype/src/store/mastersActions.ts:320`, `aa-prototype/src/store/clockActions.ts:43`, `aa-prototype/src/apps/admin/screens/MasterData.tsx`

## DM-39

### Copy a Booking is retired: remove the copy action and its fields; photo capture is Future Work; List attachments are done

**Kind:** RemovedEntity · **Size:** S · **State:** Re-graded

**Since the last pass.** CHANGED 2026-10-02: US-02.4.3 (Copy a Booking) is Retired ('redundant, an early response to not being able to add a procedure to a booking') and 'to be removed from the prototype'; US-02.4.4 photo capture is Future Work. The skeleton Copy built in Phase 15 is therefore removed, not kept. List-level attachments and the optional Booking.source were built in Phase 15 and are aligned.

**Catalogue says.** Another procedure for the same patient is added to the Booking itself (FT-03.2, US-03.2.3), not by copying a Booking. The anaesthetist adds a missing Booking manually (US-02.4.1); adding one from a photo of the booking card is Future Work (US-02.4.4). The anaesthetist can attach files or photos to a Booking or to a whole List (US-03.1.3). The Booking source appears only as a descriptive list in the domain model and no story requires a stored field. That list (domain-model.md, Booking, Sources) still names "copy of another Booking" and a photo of the card, so it contradicts US-02.4.3 (Retired) and US-02.4.4 (Future Work).

**Prototype has.** Aligned: List.attachments (types.ts:331) and Booking.attachments (:402), written through attachmentActions.ts; optional display-only Booking.source (types.ts:371, :400). To remove: copyBooking (bookingActions.ts:196-285), Booking.copiedFromBookingId (types.ts:383), the 'copy' BookingSource value (types.ts:371), the 'Copy booking' action in the three apps and the copy banner. The simulated photo path (PhotoCaptureFlow.tsx, sampleExtractions.ts, the 'anaesthetistPhoto' source value) is out of the first release.

**Impact.** Delete the copy action, its audit action, the copiedFromBookingId field, the 'copy' source value and their tests and demo-guide beats; PERSIST_VERSION bump if seeded Bookings carry copiedFromBookingId. Decide whether to keep the simulated photo capture behind the Demo panel as Future-scope or remove it; the source value can stay optional. 'Add another procedure' stays the only additional-procedure path (DM-15). Small.

**Verified 2026-10-03 (corrected).** Retired and Future status confirmed (US-02.4.3 Retired, US-02.4.4 Future Work); copyBooking, copiedFromBookingId and the 'copy' source value exist (bookingActions.ts:196, types.ts:371, :383) and the only UI entry is the shared BookingDetailBody (:340, :466-479). Corrected: added the stale domain-model.md Sources list to the catalogue contradictions, and the copy action lives in one shared component, not three separate app implementations.

**Catalogue:** [US-02.4.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.4.3.md), [US-02.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.4.1.md), [US-02.4.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.4.4.md), [FT-02.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-02.4.md), [US-03.1.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.1.3.md), [US-03.2.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.2.3.md), [FT-03.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-03.2.md)

**Prototype:** `aa-prototype/src/store/bookingActions.ts:196`, `aa-prototype/src/domain/types.ts:383`, `aa-prototype/src/domain/types.ts:371`, `aa-prototype/src/shared/flows/PhotoCaptureFlow.tsx`, `aa-prototype/src/domain/types.ts:331`

## DM-40

### Estimated duration is recorded per Procedure from the surgeon's rooms and feeds the prepayment estimate

**Kind:** ChangedEntity · **Size:** S · **State:** Re-graded

**Since the last pass.** Unchanged; the surgeon PDF route for supplying it is now Future Work, so it is entered by email or phone.

**Catalogue says.** An admin records the estimated duration of a Procedure on the Booking when the surgeon's rooms give one, by email, phone or in their PDF list (the PDF path is Future Work). The prepayment estimate uses it to work out time units by the standard tiered RVG rule (part intervals rounded up); once the procedure is done the anaesthetist's recorded start and handover times decide the final time units. The surgeon's room master (DM-32) is who sends it.

**Prototype has.** Nothing. Procedure holds only anaestheticStartISO and handoverISO (types.ts:508-509) and time units are computed from them (fee.ts:58); there is no estimate field, and PDF ingest (ingestPdfRow, integrationActions.ts:434) carries only scheduled time and operation.

**Impact.** New optional Procedure.estimatedDurationMin set on admin entry. The pure prepayment estimator in domain/billing (DM-20) reads it through the tiered time rule already in timeUnits.ts. Must land before DM-20's estimator; small on its own. Placement on the Procedure rather than the Booking follows US-06.2.5.

**Catalogue:** [US-06.2.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.2.5.md), [US-06.2.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.2.4.md), [US-02.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.2.1.md), [US-13.6.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.6.1.md), [OQ-38](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-38.md), [OQ-75](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-75.md)

**Prototype:** `aa-prototype/src/domain/types.ts:508`, `aa-prototype/src/domain/billing/fee.ts:58`, `aa-prototype/src/store/integrationActions.ts:434`

## DM-41

### Shared notification pool in the Admin App: one pool for the whole team, newest first, for things that happened and need no action

**Kind:** NewEntity · **Size:** M · **State:** New

**Since the last pass.** NEW 2026-10-02 (FT-13.8, OQ-65, OQ-79). Donald typed the requirement; the first source is an anaesthetist moving their own List.

**Catalogue says.** The Admin App holds one pool of notifications shared by the whole admin team, not one per user, for things that have happened and need no action; it is separate from the to-do list of warnings that need action and does not appear on it. Every logged-on admin sees the same pool, newest first, paged back through older notifications; each says what happened and when. The first source is an anaesthetist moving their own List to the office or a colleague (including a hand-on from an unavailable Slot), saying which List moved and to whom, after which the office can send the cover-change update email (US-13.8.2). What else posts to it, whether notices expire or are archived (Greg: it only has to hold notices until seen, 'the rest is just a log file'), whether one can be marked actioned and whether a single-Booking move posts are open (OQ-79, OQ-85).

**Prototype has.** Nothing. No notification entity or screen exists. requestCover writes only an audit entry and a marker on a Free List (lifecycle.ts:843-894, 'no real notification'). The nearest are the office's per-day internal notes (DayNote, types.ts:635-643), which are manual annotations, and the app-event emitter (events.ts), which is not persisted.

**Impact.** New append-only Notification record (id, atISO, kind, text, optional list and anaesthetist references, no per-user read state) and an Admin pool screen with paging; written by the anaesthetist's List move actions (DM-05) and, if OQ-85 settles that way, the single-Booking move (DM-42). Keep it separate from warnings (DM-31) and from the audit trail. Depends on DM-05 for its first source; the pool screen can be built first over seeded rows. Small model, but a new Admin surface.

**Catalogue:** [FT-13.8](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-13.8.md), [US-13.8.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.8.1.md), [US-13.8.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.8.2.md), [FT-13.7](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-13.7.md), [EP-13](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/EP-13.md), [US-01.4.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.4.3.md), [US-02.3.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.3.3.md), [OQ-65](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-65.md), [OQ-79](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-79.md), [OQ-85](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-85.md)

**Prototype:** `aa-prototype/src/store/lifecycle.ts:843`, `aa-prototype/src/domain/types.ts:635`, `aa-prototype/src/store/events.ts`

## DM-42

### An anaesthetist moves a single Booking to a colleague; a receiver marked unavailable first sets themselves available

**Kind:** ChangedLifecycle · **Size:** M · **State:** New

**Since the last pass.** NEW 2026-10-02 (US-01.4.7, FT-01.4; the experience is OQ-85 and the vacated Slot OQ-84).

**Catalogue says.** In their app an anaesthetist can move one Booking from one of their Lists to another anaesthetist as well as a whole List (Greg: 'at the list level or at the booking level'). The receiver is found by searching by anaesthetist. A receiver who is on leave or unavailable does not show as available: they first set their own Slot available, which is their acceptance of the work, and the office does not assign work to someone marked unavailable without them knowing. The Booking ends up on a List of the receiver's (a List created for it if needed, even a one-Booking List, US-01.4.6); the payable and any prepayment follow the Booking. Whether a single-Booking move posts to the notification pool is OQ-85. A favour List created on the fly is not built now.

**Prototype has.** reassignBooking (lifecycle.ts:635-684) moves a Booking only between two Lists of the SAME anaesthetist for an anaesthetist actor (refuse 'notOwnList', :654-660, DRAFT Lists only); only the office can move a Booking to another anaesthetist's List, and the target List must already exist. No receiver search, no 'set myself available to accept' step, no find-or-create of the receiver's List, no notification.

**Impact.** New anaesthetist-actor action moveBookingToAnaesthetist (find or create the receiver's List in the same Slot via DM-02, re-check prepayment via DM-06, post to the pool if OQ-85 says so via DM-41) plus the receiver's availability change (DM-04) and a colleague notice. Admin MoveBookingFlow stays for office moves. Depends on DM-02, DM-04 and DM-06; keep the UI thin until OQ-85 defines the experience. The blacklist warning (DM-32) applies as it does to a List move.

**Catalogue:** [US-01.4.7](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.4.7.md), [US-01.4.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.4.6.md), [US-01.4.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.4.3.md), [FT-01.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-01.4.md), [US-13.8.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.8.2.md), [OQ-84](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-84.md), [OQ-85](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-85.md)

**Prototype:** `aa-prototype/src/store/lifecycle.ts:635`, `aa-prototype/src/apps/admin/flows/MoveBookingFlow.tsx`

## DM-43

### Base units live in each procedure's default RVG Contract(s), not on the RVG code; any other Contract may override them

**Kind:** ChangedRelationship · **Size:** L · **State:** New

**Since the last pass.** NEW 2026-10-02 (OQ-62 answered): the earlier plan put base units on the procedure master or the RVG code master. The afternoon session settled that AA may use either one default Contract with a range or one per kind (simple, complex); the relation to the hospital's RVG Default Hospital Contract is still open (OQ-78).

**Catalogue says.** Every procedure on the master procedure list has one or two default RVG Contracts, the standard RVG recommendation, holding its base units and all its other settings. Either one default Contract with a range of base units, or one per kind (for example simple and complex) each with its own value; the system supports both. They are imported from spreadsheets at the start and then maintained by hand, so a rare RVG change is applied by hand (Greg's idea of Contracts as children of a master code is not adopted). Picking a Contract for a Procedure seeds its base units from that Contract (its default RVG Contract unless another applies); the anaesthetist chooses the exact value where a range applies and may set any value, including one outside it (an after-procedure warning, DM-31). Any other Contract may override base units for a procedure, RVG code or group, and a base unit overridden consistently means AA should change its default Contract. The RVG code master keeps the guide's values as reference only. How these relate to each hospital's RVG Default Hospital Contract is not settled (OQ-78).

**Prototype has.** RvgCode.baseUnits (single or range, types.ts:550-557) is the ONLY base-unit source: resolveBtm reads it directly (fee.ts:66-73), with baseUnitsSelected for ranges and a captured override (types.ts:503-505). Contract has no base-unit field and no per-procedure or per-code override (types.ts:216-241). The seed's RVG codes carry the figures (seed/rvgCodes.ts) and no default Contract exists per procedure. The anaesthetist picks the base code in the capture cards (ProcedureCodeCard.tsx, UnitsCard.tsx).

**Impact.** Move the base-unit source from RvgCode to a Contract link: a default RVG Contract per master-list procedure (DM-13) carrying base units (single, range or per-kind) and a Contract base-unit override list keyed by procedure, RVG code or group (DM-07). resolveBtm and the estimator read the Contract's base units; the range selection and out-of-range warning follow. Seed: generate one default RVG Contract per procedure from the current RVG figures. Depends on DM-07 and DM-13; DM-10's first pick, DM-20's estimator and DM-08's lock all read the result, so land it with or just after DM-13. Keep the one-or-two question behind the data, not the code.

**Catalogue:** [US-04.4.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.4.2.md), [FT-04.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-04.4.md), [US-05.1.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.1.6.md), [US-05.1.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.1.1.md), [US-03.3.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.3.1.md), [US-04.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.2.md), [US-06.2.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.2.4.md), [US-13.4.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.4.3.md), [OQ-62](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-62.md), [OQ-78](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-78.md)

**Prototype:** `aa-prototype/src/domain/types.ts:550`, `aa-prototype/src/domain/billing/fee.ts:66`, `aa-prototype/src/domain/types.ts:216`, `aa-prototype/src/domain/seed/rvgCodes.ts`, `aa-prototype/src/shared/capture/ProcedureCodeCard.tsx`

## DM-44

### Absorbed modifiers are gone: a procedure carries default modifiers that are pre-filled and can be unticked

**Kind:** RuleChange · **Size:** S · **State:** New

**Since the last pass.** NEW 2026-10-02: US-05.1.4 was rewritten (default modifiers on the procedure master) and US-05.2.3 (conditional positioning modifier) was retired.

**Catalogue says.** A base code never absorbs a modifier: modifiers are never included in base units, and positioning loadings such as beach-chair or prone are modifiers. Some procedure codes specify a default modifier (spine and neuro procedures indicate prone positioning); the system records them as a modifiers column on the procedure master. When the anaesthetist adds that Procedure to a Booking its default modifiers are pre-filled and can be unticked (an unticked one is not charged). The conditional P1 rule (add P1 only when the base does not include positioning) is retired.

**Prototype has.** RvgCode.absorbsModifierCodes (types.ts:556) makes a base code refuse a modifier: modifierUnits zeroes an absorbed code with a reason (modifierUnits.ts:58-61), the capture chips and the code card grey it out (ModifierChips.tsx:83, ProcedureCodeCard.tsx:60), and the seed marks hip and shoulder codes as absorbing P1 (seed/rvgCodes.ts:23-25, :32-33). No default modifiers on any master; nothing is pre-filled.

**Impact.** Remove absorbsModifierCodes and the absorbed-refusal branch; add defaultModifierCodes to the master procedure (DM-13) and pre-fill selectedModifierCodes from it when a Procedure is created or its procedure is picked, leaving the existing one-per-band rule. Update the modifier seed, tests (fee, modifierUnits, fixtures BASE_ABSORBS_P1) and the capture copy. Depends on DM-13; DM-15's modifier split reads the resulting selection. Small, but touches the BTM tests.

**Catalogue:** [US-05.1.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.1.4.md), [US-05.1.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.1.5.md), [US-05.2.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.2.3.md), [US-05.1.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.1.6.md), [US-03.3.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.3.4.md)

**Prototype:** `aa-prototype/src/domain/types.ts:556`, `aa-prototype/src/domain/billing/modifierUnits.ts:58`, `aa-prototype/src/shared/capture/ModifierChips.tsx:83`, `aa-prototype/src/domain/seed/rvgCodes.ts:23`

## DM-45

### Audit covers invoices and credit notes, not disbursements, payments or receipts (those are done in Xero)

**Kind:** RuleChange · **Size:** S · **State:** New

**Since the last pass.** NEW 2026-10-02 (US-13.5.2, Greg: invoices and credit notes, but not disbursements, payments or receipts; depth for the developers, with storage cost in mind).

**Catalogue says.** The audit trail records who or what made every change, and when: creates, updates, reassignments, authorisations, invoices and credit notes, across manual and automated actions. Disbursements, payments and receipts are not audited here because they are done in Xero. How deep the audit goes is for the developers to settle.

**Prototype has.** Every domain write goes through mutate(), including money events: receivePayment audits each receipt with source 'system' (paymentActions.ts:78-111), the payables run audits 'xero.disbursed' per payable (payablesActions.ts:71, :131) and the Xero handoff audits each pair (xeroHandoff.ts:175, :208). There is no credit-note audit because there is no credit note (DM-24).

**Impact.** A policy call rather than a structural change: either leave the money-event audit in (harmless in a prototype, and the Audit viewer shows it) or stop auditing receipts, payments and disbursements, which keeps the audit viewer aligned with the catalogue and the ledger as the record. Add credit notes to the audited set with DM-24. Do not let this delay anything. Size S.

**Catalogue:** [US-13.5.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.5.2.md), [FT-13.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-13.5.md), [US-02.5.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.5.5.md), [US-08.6.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.6.2.md)

**Prototype:** `aa-prototype/src/store/paymentActions.ts:111`, `aa-prototype/src/store/payablesActions.ts:71`, `aa-prototype/src/store/xeroHandoff.ts:208`, `aa-prototype/src/store/mutate.ts`

## DM-46

### Hourly rate x time billing line is replaced by a Contract defined unit rate (the "individually arranged hourly" gate goes)

**Kind:** RemovedEntity · **Size:** M · **State:** New

**Since the last pass.** NEW 2026-10-02: US-05.2.6 was renamed from 'Rate x time pricing' to 'Contract defined rate' ('it's not an hourly rate, it's a unit rate'), and US-03.3.6, US-04.2.2 and US-04.2.1 follow. Whether it is the same basis as the agreed contract rate is OQ-89; Donald said 'we'll come back to that'.

**Catalogue says.** A Contract can define its own rate, a unit rate and not an hourly one: an alternative to the anaesthetist's own unit value, defined on the Contract and used to price the Procedure (US-05.2.6). The anaesthetist captures it as a unit x rate billing line through the same billing-line path as any other line (US-03.3.6), and the Contract's pricing basis lists it beside the anaesthetist's rate, the agreed contract rate or discount, and the fixed fee schedule (US-04.2.2). The 'individually arranged' permission flag and the hourly structure no longer appear. Whether the Contract defined rate and the agreed contract rate are one basis, whether it prices the whole Procedure or is a line outside BTM, and how it combines with a fixed fee are OQ-89.

**Prototype has.** A BillingLine can be chargeBasis 'rateTime' (hours x rate, types.ts:518-540; fee.ts:236-250), offered only under a Contract carrying permitsIndividualArrangement (types.ts:228; validator gate validateBookingForBilling.ts:220-232, INDIVIDUAL_ARRANGEMENT_MESSAGE :39), seeded for one billable-party-held hourly Contract (seed/contracts.ts, 'Aria ... hourly', CT-ARIA-HOURLY). The capture UI adds the line in AddBillingLineSheet and BillingLinesCard. The Contract's type 2 agreedUnitRate (types.ts:212-214) is the nearest per-unit alternative.

**Impact.** Replace the hours x rate line with a unit x rate line (units and a Contract-set rate), drop permitsIndividualArrangement and the Method 3 validator gate, and reseed the hourly example as a Contract defined unit rate. Fold the pricing basis into DM-07 and the line capture into the existing billing-line path; do not build until OQ-89 says whether this is a separate basis or the contract rate. Depends on DM-07. Medium: touches types, fee.ts, the validator, the capture sheets, seed and tests.

**Catalogue:** [US-05.2.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.2.6.md), [US-03.3.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.3.6.md), [US-04.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.2.md), [US-05.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.2.1.md), [US-05.2.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.2.5.md), [OQ-89](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-89.md)

**Prototype:** `aa-prototype/src/domain/types.ts:519`, `aa-prototype/src/domain/types.ts:228`, `aa-prototype/src/domain/billing/fee.ts:236`, `aa-prototype/src/domain/billing/validateBookingForBilling.ts:220`, `aa-prototype/src/shared/capture/AddBillingLineSheet.tsx`

## DM-47

### Follow-up tools on a patient's outstanding invoices: recorded follow-up actions and invoice re-send

**Kind:** NewEntity · **Size:** S · **State:** Added

**Since the last pass.** ADDED 2026-10-03 by the verification pass: [US-11.3.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.3.3.md) (Proposed, in the MVP lane) was not covered by any delta.

**Catalogue says.** Admins can record follow-up actions and re-send invoices for a patient's outstanding items, so an admin's follow-up on an unpaid invoice is tracked in the system, not just remembered. It sits with the patient outstanding view (US-11.3.1) in FT-11.3.

**Prototype has.** Nothing. No follow-up record, note or re-send action exists. An invoice is emailed once: the Admin invoice document offers the email action only while emailedAtISO is unset (apps/admin/screens/InvoiceDocument.tsx:247-269) and the Invoice carries a single emailedAtISO (types.ts:685), so a second send or a history of sends cannot be shown.

**Impact.** Small additive record: PatientFollowUp (patientId, optional invoiceIds, kind note or resend, text, by, atISO) and a resend action that appends to a send history instead of overwriting emailedAtISO, audited through mutate(). Surfaces on the per-patient balance view (DM-23). Depends on DM-23 for the screen and DM-27 for the invoice email address; independent of everything else. The trigger for outstanding amounts reuses the warning thresholds (DM-31) but needs no change to them.

**Catalogue:** [US-11.3.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.3.3.md), [US-11.3.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.3.1.md), [FT-11.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-11.3.md), [US-08.4.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.4.2.md)

**Prototype:** `aa-prototype/src/apps/admin/screens/InvoiceDocument.tsx:247`, `aa-prototype/src/domain/types.ts:685`, `aa-prototype/src/apps/admin/screens/InvoicesScreen.tsx:216`

