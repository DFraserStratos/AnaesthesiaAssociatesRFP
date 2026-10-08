# Data-model delta: catalogue vs prototype

Read-only comparison of the entity, relationship and lifecycle model the requirements catalogue now describes (see [domain-model.md](../../../../requirements-board/requirements/domain-model.md), updated through 2026-10-08) with what `aa-prototype/` implements at HEAD (PERSIST_VERSION 16, after catch-up Phases 14, 15 and 15a). The code is treated as the truth about the prototype; the old build docs were used only as leads. Retired and Future items are excluded except as boundary references that explain a removal (FT-04.4, US-02.4.3, US-03.3.7, US-02.4.4, FT-14.1, FT-14.2).

This pass (catalogue commit 60e2d1e) replaces the earlier one (commit 3d3a18c, DM-01 to DM-47). The catalogue has since been rewritten around contract holders, dated Contract versions, RVG groups with a procedure list, a single No contract (RVG), the payer on the Booking, the ACTIVE list state, fixed-price prepayment with nothing calculated afterwards, and events. **DM ids are stable:** each delta that continues an earlier one keeps its id (so the build plan's references hold), and deltas with no predecessor take DM-48 to DM-54. Earlier ids with no delta here: DM-01 closed (Card to Booking, built in Phase 15); DM-06 merged into DM-42 (whoever submits did the procedures); DM-27 merged into DM-22 (invoice numbering and presentation; new invoice kinds in DM-17, DM-18, DM-24; Contract-driven layout and delivery in DM-16); DM-33 merged into DM-32 (fuller anaesthetist profile; prepaid settings stay in DM-19); DM-36 dropped earlier; DM-37 merged into DM-10 (the anaesthetist's Contract change, flagged at review); DM-40 dropped (no estimated duration: prepayment is a fixed price); DM-47 merged into DM-23 (patient follow-up actions and re-send). DM-31 keeps the warning routine, partly built by Phase 15a session 1; what remains is listed under it. Sizes: S under a day, M a day or two, L several days, XL a week or more including seed, screens and tests; the size counts the ripple, not just the type edit.

**Summary.** 46 structural deltas. By kind: NewEntity 15, ChangedEntity 14, ChangedRelationship 2, RuleChange 6, RemovedEntity 2, NewLifecycle 2, ChangedLifecycle 4, NewRelationship 1. By size: L 14, M 22, S 6, XL 4. Two prior deltas are now closed or reversed rather than open: the Card to Booking rename is done (Phase 15) and the protected default Contract per hospital and insurer, which the earlier pass listed as aligned, is now a removal (DM-49).

## Verification pass (adversarial)

Every delta was re-read against its catalogue items (status and swimlane checked, so no Retired or Future item is the sole basis of a delta) and against the code. Result: all 46 deltas survive; none were refuted. Corrections made in place:

- **Scope.** DM-38: the Contract schedule upload (US-04.2.13) is in the Future Work lane, so only the master holiday calendar and spreadsheet loading stay. DM-03 and DM-52: the integration reschedule clash source (US-02.5.2) is Future Work. DM-39: photo capture (US-02.4.4) is Future Work by swimlane although its status is Proposed.
- **Overstated catalogue claims.** DM-07: the catalogue does not say Contracts have no categories, only that none are settled. DM-20: netting an issued prepayment off the final invoice stays (US-08.2.2), so the visible deduction line is aligned. DM-45: the prototype audits a superset of the catalogue, so it is a policy note, not a gap (kept at S, no rebuild). DM-31 is a ChangedEntity, not a NewEntity, because the model is built (Phase 15a).
- **Citations and counts.** DM-10, DM-43 and DM-46 all cited validateBookingForBilling.ts:104 (the function signature); the checks are at :125 (route), :152-165 (range base code) and :222-230 (Method 3 gate). DM-07: 12 seeded Contracts, not about nine. DM-48 and DM-07: 10 non-test files read holderType, not 11. DM-02: 9 non-test files use listIdForSlot or listForSlot (46 read schedule.lists), not 27. DM-39: 8 files, not 6. DM-45 line numbers moved to :188 and :131.
- **Added detail, no new delta.** DM-48 notes the prototype's 'organisation' and 'billableParty' holder types; DM-15 notes that base-on-primary and time-on-every-procedure already match; DM-08 adds the per-Procedure ledger share (US-05.3.5). Two catalogue contradictions were added below (included modifiers; rate x time note). No structural delta was missed that is not already covered by DM-13 to DM-38: the candidates checked (ACC flag, sign-in, past-work search and archive, concurrent edits, hospital-set Contracts) are informational, non-model or Future Work.

## Suggested order

Two tracks share only Booking and Procedure and can run in parallel; they join at DM-42 and DM-34.

- **Pricing track.** DM-13 (RVG groups and procedure list) then DM-48, DM-07, DM-09 and DM-49 together (holder, dated Contract, lines, No contract (RVG)), then DM-10 (one Contract per Procedure, no route). DM-43, DM-14, DM-44 and DM-15 follow DM-10; DM-50 (pricing precedence) needs DM-09 and DM-14; DM-08 (snapshot at AUTHORISED) closes the track. DM-46, DM-16 and DM-51 ride alongside DM-07 and DM-10. DM-11 (payer) needs DM-48 and DM-10, then DM-28 and DM-12.
- **Schedule track.** DM-02, DM-52 and DM-03 together (Slot, ACTIVE and DRAFT states, Draft List), then DM-04 and DM-53. DM-41 (notification pool) and DM-32 (master profiles) are independent and can go first. DM-05 and DM-42 need DM-41; DM-54 needs DM-32; DM-34 needs DM-51, DM-30 and DM-03; DM-35 needs DM-32.
- **Money track.** DM-22 (payable in the ledger) first; DM-19 and DM-20 (prepaid settings, prepayment) need DM-13, DM-09, DM-11; DM-17 then DM-18 then DM-24; DM-21 needs DM-20, DM-24 and DM-22; DM-23, DM-25, DM-26 and DM-29 need DM-22 (DM-25 also DM-24).
- **Free-standing, small.** DM-39, DM-45, DM-30, DM-38 and DM-46. DM-31 (warnings) absorbs a rule as each source entity lands (DM-43, DM-11, DM-12, DM-23).

Every model change that alters the seed shape needs a PERSIST_VERSION bump (currently 16; CLAUDE.md still says 13).

## Already aligned, no delta

Verified in code: DRAFT to SUBMITTED to AUTHORISED guards with no Returned state, office-only edits after submit, AUTHORISED immutable (lifecycle.ts:48-70, :210, :262); soft cancel that keeps the Booking and charges no fee (lifecycle.ts:348); per-Booking billing failure that holds the whole Booking while the List's others bill (billingRun.ts:68-165); one invoice per distinct billable party per Booking (invoiceBuild.ts:264); ACCREC plus draft ACCPAY pair with independent received and disbursed amounts and pro-rata release (paymentActions.ts:41); hidden internal patient ID with the NHI never sent to Xero and dual-format NHI validation (nhi.ts); Xero contact archiving; per-anaesthetist unit value and GST period; Insurer.acceptsDirectClaims; tiered time units with part intervals rounded up (timeUnits.ts:13-31); per-hospital holiday calendar with a soft conflict flag; availability painted before the recurring pairing (canvas.ts:116); derived warnings with a stored clearance and no gate (Phase 15a); List attachments and an optional display-only Booking.source (Phase 15); Lists leave the anaesthetist's forward views when the billing run completes (List.billedAtISO, types.ts:323); roles anaesthetist, office and system.

## Prototype-only, no catalogue home (keep as demo, not model deltas)

DayNote (types.ts:635), seeded anaesthetist dashboard figures, XeroVolumeStory and DemoSettings (types.ts:884-906), ListPhoneNote (types.ts:295), and the simulated HL7 and FHIR transport with per-feed field mapping and message log (types.ts:832-880), which serve FT-14.1 and FT-14.2 (both Future) and become a demo of the later integration, not part of the first-release model (see DM-34).

## Catalogue points that contradict each other (for the owner; the deltas follow the more specific item)

- **Billable parties.** Greg and the draft design (AR-29, ERD AR-30) hold hospitals, surgeons, insurers, patients and guardians in one billable-party reference table, while [US-11.2.2](../../../../requirements-board/requirements/stories/US-11.2.2.md) says a guardian's details live on the Booking and are not a master record. DM-11 follows the Booking payer and keeps a reference table for holders.
- **AA-added RVG groups.** [domain-model.md](../../../../requirements-board/requirements/domain-model.md) says AA marks its own groups AA-sourced; [US-05.1.1](../../../../requirements-board/requirements/stories/US-05.1.1.md) notes (2026-10-02) they are not marked. DM-13 follows the story.
- **Booking sources.** The domain model's Booking sources still list a photo of the card and copy of another Booking; [US-02.4.3](../../../../requirements-board/requirements/stories/US-02.4.3.md) is Retired and [US-02.4.4](../../../../requirements-board/requirements/stories/US-02.4.4.md) is Future. DM-39 follows the stories.
- **Matching-screen sync.** The domain model (section 1) still says the automatic sync shows a last-synced time and runs on a schedule, on open and by button; [US-02.1.5](../../../../requirements-board/requirements/stories/US-02.1.5.md) removed those. DM-34 follows the story.
- **Prepayment link.** The draft design links the prepayment from the booking procedure; the catalogue holds it on the Booking ([US-06.3.1](../../../../requirements-board/requirements/stories/US-06.3.1.md)). DM-20 flags it; either shape works.
- **Alert threshold.** [US-11.3.2](../../../../requirements-board/requirements/stories/US-11.3.2.md) says admins can change the 90-day threshold; [US-13.7.4](../../../../requirements-board/requirements/stories/US-13.7.4.md) (Future) says thresholds stay fixed until AA asks. DM-23 keeps it in app settings.
- **Contract split.** [EP-01](../../../../requirements-board/requirements/stories/EP-01.md) says 'the Contract may be split'; [US-08.2.3](../../../../requirements-board/requirements/stories/US-08.2.3.md) says splitting is a Booking action, not a Contract setting. DM-28 follows the story.
- **Included modifiers.** [US-05.2.3](../../../../requirements-board/requirements/stories/US-05.2.3.md) (Retired) still notes 'a base code never absorbs a modifier', while [US-05.1.4](../../../../requirements-board/requirements/stories/US-05.1.4.md) (Confirmed) and the domain model lock P1 at 0 units on Neurosurgery and Spine codes. DM-44 follows US-05.1.4.
- **Rate x time.** The Retired note on [US-03.3.7](../../../../requirements-board/requirements/stories/US-03.3.7.md) says it was merged into US-03.3.6 'including rate x time'; US-03.3.6 itself says that line is removed (OQ-89). DM-46 follows US-03.3.6.
- **Multi-procedure rule.** [FT-05.3](../../../../requirements-board/requirements/stories/FT-05.3.md) and [US-05.3.1](../../../../requirements-board/requirements/stories/US-05.3.1.md) are Verify while [OQ-90](../../../../requirements-board/requirements/questions/OQ-90.md) asks whether the default rule applies at all; DM-15 builds it as written.

## Index

| ID | Kind | Title | Size |
| --- | --- | --- | --- |
| [DM-13](#dm-13) | NewEntity | RVG groups, body sections and a curated procedure list replace the flat RVG code table and free-text procedure description | XL |
| [DM-48](#dm-48) | NewEntity | Contract holder becomes a master record (third or first party, bills-holder flag, billable party, anaesthetist) | L |
| [DM-07](#dm-07) | ChangedEntity | Contract becomes a dated, versioned record with an AA code; Type 1/2/3, scope, default flag and the Method 3 gate go | XL |
| [DM-09](#dm-09) | ChangedEntity | Contract line (one per procedure, carrying only what it sets) replaces ContractPrice | L |
| [DM-49](#dm-49) | ChangedEntity | One stored No contract (RVG) replaces the protected default Type 1 per hospital and direct-billing insurer | M |
| [DM-10](#dm-10) | ChangedRelationship | Each Procedure selects exactly one Contract at booking setup; the billing route and billing-time Contract resolution disappear | XL |
| [DM-43](#dm-43) | RuleChange | Starting units resolve through Contract line, procedure then RVG group; out-of-range base units warn instead of fail | M |
| [DM-50](#dm-50) | RuleChange | Pricing follows one precedence with fixed-rate and fixed-discount Contracts and a recorded price source; Type 2/3 pricing goes | L |
| [DM-14](#dm-14) | ChangedEntity | Price changes split into an anaesthetist adjustment (gated by the Contract) and an office override | M |
| [DM-44](#dm-44) | NewEntity | Modifiers become per-Procedure records with explanations; age and included modifiers are locked; ASA is just a modifier | L |
| [DM-15](#dm-15) | RuleChange | Multi-procedure rule: one primary flag, time on every procedure, modifier units split above four, no Contract-specific ordinals | M |
| [DM-46](#dm-46) | RemovedEntity | Rate x time billing and the Method 3 'individual arrangement' gate are removed; other billing lines remain with their own dates | M |
| [DM-08](#dm-08) | NewLifecycle | Authorising a List snapshots each Procedure's Contract version and pricing inputs; the billing engine reads the snapshot | L |
| [DM-16](#dm-16) | ChangedEntity | Contract carries invoice layout, delivery method and the holder references a Booking must supply | S |
| [DM-51](#dm-51) | NewEntity | Procedure keeps source wording exactly as received, with later different wording added beside it | M |
| [DM-11](#dm-11) | ChangedRelationship | Who is billed: the Contract's holder or the payer named on the Booking, replacing the per-Procedure billable-party override | L |
| [DM-28](#dm-28) | ChangedEntity | Splitting a Procedure's fee between payers is a Booking action with typed $ or % shares, not a line-level funder override | M |
| [DM-12](#dm-12) | NewEntity | Booking may carry an insurance indication that guides the Contract but never decides who is billed (storage open) | S |
| [DM-30](#dm-30) | RuleChange | NHI is required: a missing NHI is a visible problem and blocks authorising the List | M |
| [DM-02](#dm-02) | ChangedEntity | Slot becomes a stored entity separate from List; Day parents both | XL |
| [DM-52](#dm-52) | ChangedLifecycle | List lifecycle becomes DRAFT, ACTIVE, SUBMITTED, AUTHORISED, where DRAFT means no anaesthetist | L |
| [DM-03](#dm-03) | NewEntity | Draft List: a List with no anaesthetist that can hold Bookings and is assigned by the office | L |
| [DM-04](#dm-04) | ChangedEntity | Slot status is user-maintained master data kept from one availability calendar, with series | M |
| [DM-05](#dm-05) | ChangedLifecycle | An anaesthetist moves their own List to the office or a colleague, with no confirmation; marking a Slot unavailable forces return or assign | M |
| [DM-42](#dm-42) | ChangedLifecycle | A single Booking moves to a colleague, and whoever submits a List did its procedures | M |
| [DM-41](#dm-41) | NewEntity | Shared notification pool in the Admin App | M |
| [DM-53](#dm-53) | ChangedEntity | Recurring booking replaces the Permanent List; a pairing that lands on an unavailable Slot becomes a Draft List | S |
| [DM-54](#dm-54) | NewEntity | Private two-way pairing preferences and an admin-only anaesthetist priority tier | M |
| [DM-32](#dm-32) | ChangedEntity | Surgeons' rooms, surgeon profile, hospital contact email and fuller anaesthetist profile are master data | M |
| [DM-34](#dm-34) | NewEntity | Hospital bookings land on a matching screen as import rows with an admin decision, and an unmatched queue | L |
| [DM-35](#dm-35) | NewEntity | Explicit-save change sets, an on-demand update email draft picked from the change history, and email templates | M |
| [DM-39](#dm-39) | RemovedEntity | Copy a Booking and photo capture are removed from the model | S |
| [DM-19](#dm-19) | NewEntity | Prepaid settings on the anaesthetist profile (procedures or whole RVG groups) trigger prepayment, replacing the per-Procedure payment category | M |
| [DM-20](#dm-20) | ChangedLifecycle | Prepayment: fixed price from the anaesthetist's own Contract, invoice drafted at setup and held for admin approval, nothing calculated afterwards | L |
| [DM-21](#dm-21) | NewEntity | Trust account: prepayment held pending, refunded in full on cancellation, kept when the Booking moves | M |
| [DM-17](#dm-17) | NewEntity | Events on a Procedure (pre-op, post-op, additional invoice, credit) replace the post-op addendum Booking | L |
| [DM-18](#dm-18) | ChangedEntity | Additional invoice: a free-form invoice recorded as an event, to any billable party, with its own ledger pair | L |
| [DM-24](#dm-24) | NewLifecycle | A wrong invoice is credited in full then rebilled; the payable is reversed by a negative invoice | L |
| [DM-22](#dm-22) | ChangedEntity | The internal ledger holds both halves of each pair as its own records, with the payable independent of Xero | L |
| [DM-23](#dm-23) | NewRelationship | Derived ledger positions for the whole ledger, per anaesthetist and per patient; flat outstanding list without ageing; patient balance alerts | M |
| [DM-25](#dm-25) | NewEntity | Weekly payment cycle with period approval of BCTIs and a remittance advice that nets negative invoices | M |
| [DM-26](#dm-26) | NewEntity | AA fee is a separate monthly invoice from AA to each anaesthetist, not a percentage deducted from the payable | M |
| [DM-29](#dm-29) | RuleChange | GST schedule is on a cash basis of payables actually paid, not of amounts received | S |
| [DM-31](#dm-31) | ChangedEntity | Warning routine: more rules, an admin to-do list and a Booking flag in both apps (one rule is built) | M |
| [DM-45](#dm-45) | RuleChange | Audit covers invoices and credit notes but not disbursements, payments or receipts | S |
| [DM-38](#dm-38) | ChangedEntity | Reference data: a master public-holiday calendar, spreadsheet-loaded masters and an optional Contract schedule upload | M |

## DM-13

### RVG groups, body sections and a curated procedure list replace the flat RVG code table and free-text procedure description

**Kind:** NewEntity · **Size:** XL

**Catalogue says.** Base units live on the RVG group: the NZSA RVG as published plus AA's own groups, each with a unique human-readable system code, a body section (top level of the picker), base units always set and above 0, and modifier units default 0 (US-05.1.1, US-05.1.3). Beneath the groups sits a curated procedure list (about 400 rows to start): each procedure is worded for the invoice, belongs to exactly one RVG group (no nesting, no prices), may set its own base or modifier units, and every group has a general procedure (US-05.1.6). The picker has two tabs, Procedures (body area, subgroup, procedure) and RVG codes (body area, RVG code) (FT-04.3). Seeded once from spreadsheets, then maintained by hand with every change recorded. Open: one list or two and where the system code sits (OQ-88), how a published unit range is held (OQ-101), invoice wording of a general procedure (OQ-103).

**Prototype has.** Only RvgCode (types.ts:550): code, description, a flat anatomicalSite string, baseUnits single or range, and absorbsModifierCodes; 33 demo rows keyed by code (seed/rvgCodes.ts). A Procedure stores a free-text description and one scalar rvgBaseCode (types.ts:453). There is no body section, no group-versus-procedure split, no procedure list, no general procedure, no AA-added groups and no group-level modifier units.

**Impact.** Foundation for the whole pricing track. Procedure gains a procedureId (and group via the procedure) in place of description plus rvgBaseCode, which 19 files read. The seed needs a few hundred procedures and the real group list; the capture, booking-setup and matching screens need the two-tab picker. Must precede DM-09 (lines key on a procedure), DM-10, DM-43, DM-44, DM-51 and DM-19.

**Catalogue:** [US-05.1.1](../../../../requirements-board/requirements/stories/US-05.1.1.md), [US-05.1.3](../../../../requirements-board/requirements/stories/US-05.1.3.md), [US-05.1.6](../../../../requirements-board/requirements/stories/US-05.1.6.md), [FT-05.1](../../../../requirements-board/requirements/stories/FT-05.1.md), [FT-04.3](../../../../requirements-board/requirements/stories/FT-04.3.md), [US-03.3.1](../../../../requirements-board/requirements/stories/US-03.3.1.md), [US-13.4.3](../../../../requirements-board/requirements/stories/US-13.4.3.md), [OQ-88](../../../../requirements-board/requirements/questions/OQ-88.md), [OQ-101](../../../../requirements-board/requirements/questions/OQ-101.md), [OQ-103](../../../../requirements-board/requirements/questions/OQ-103.md), [domain-model.md](../../../../requirements-board/requirements/domain-model.md)

**Prototype:** `aa-prototype/src/domain/types.ts:550`, `aa-prototype/src/domain/types.ts:453`, `aa-prototype/src/domain/seed/rvgCodes.ts:13`

## DM-48

### Contract holder becomes a master record (third or first party, bills-holder flag, billable party, anaesthetist)

**Kind:** NewEntity · **Size:** L

**Catalogue says.** Every Contract belongs to one contract holder: an insurer, hospital, surgeon or surgeon's rooms (third party, prices locked) or an anaesthetist (first party, own price list, offered only on that anaesthetist's Bookings). A holder records whether it pays AA itself (its billable party record is then required and billed) or only sets the price (the payer on the Booking is billed). A holder can hold many Contracts (US-04.1.5, US-04.2.1). The office creates first-party holders and their Contracts from the price list the anaesthetist supplies (OQ-91).

**Prototype has.** No holder entity. Contract carries holderType ('hospital' | 'insurer' | 'surgeon' | 'organisation' | 'billableParty') plus holderId pointing into four disjoint tables (Hospital, Insurer, Surgeon, ContractHolderOrganisation; types.ts:195-216). A first-party idea exists only as ContractScope individualAnaesthetist (types.ts:207). There is no bills-holder flag: the holder is always the counterparty on the contract-holder route (invoiceBuild.ts:192-213). Insurer.acceptsDirectClaims (types.ts:166) gates only the Insurer route.

**Impact.** New master plus CRUD, with Contract pointing at it. Insurers and hospitals stay as billable-party sources but stop being the Contract's key. Needed before DM-07, DM-49, DM-10 and DM-11. Medium ripple (10 non-test files read holderType). The prototype's 'organisation' (ContractHolderOrganisation, for example COS) and 'billableParty' holder types have no catalogue counterpart: group holders become surgeon or rooms holders (DM-32) and a billable-party holder becomes the holder's billable-party link.

**Catalogue:** [US-04.1.5](../../../../requirements-board/requirements/stories/US-04.1.5.md), [US-04.2.1](../../../../requirements-board/requirements/stories/US-04.2.1.md), [US-04.2.14](../../../../requirements-board/requirements/stories/US-04.2.14.md), [FT-11.2](../../../../requirements-board/requirements/stories/FT-11.2.md), [US-11.4.1](../../../../requirements-board/requirements/stories/US-11.4.1.md), [domain-model.md](../../../../requirements-board/requirements/domain-model.md)

**Prototype:** `aa-prototype/src/domain/types.ts:195`, `aa-prototype/src/domain/types.ts:216`, `aa-prototype/src/domain/types.ts:166`, `aa-prototype/src/domain/billing/invoiceBuild.ts:192`

## DM-07

### Contract becomes a dated, versioned record with an AA code; Type 1/2/3, scope, default flag and the Method 3 gate go

**Kind:** ChangedEntity · **Size:** XL

**Catalogue says.** A Contract is a structure that sets how a procedure is paid for and who pays. It is a dated version: start date, optional end date, a review date and a link to the version it replaces; lines share the dates; a price review creates a new version (lines copied then changed, old version ends the day before), and the version in force on the procedure date prices it, so old Bookings keep old prices; versions can be entered ahead of their start (US-04.2.10, US-04.1.2, US-04.1.3). Every Contract has a unique short AA code (format still open, OQ-66) searchable alongside holder codes (US-04.1.4). Holders, not categories, shape the Contract list: third party, first party and No contract (RVG) (US-04.1.1); whether Contracts also carry category headings in the picker is not settled (domain-model.md, Contract table, 'kind'). Admins create, edit, version and retire; anaesthetists never edit Contracts.

**Prototype has.** Contract (types.ts:216) has type 1 | 2 | 3, holderType and holderId, scope organisation or individualAnaesthetist, permitsIndividualArrangement, isDefault, effectiveFromISO and effectiveToISO, and type2Detail. There is no replaces link, review date, AA code or version history; contractActions.ts edits in place with audit entries only. Effectiveness is judged on the List date at billing time (contracts.ts isEffectiveOn) and selection ranks individual over organisational over default (contracts.ts:34). The seed holds 12 Contracts (six protected default Type 1s and six negotiated; seed/contracts.ts:45).

**Impact.** Schema rewrite of the master that pricing, billing and the review screens read (24 files touch governingContractId or billingRoute, 10 non-test files touch holderType). Needs DM-48 and DM-09 in the same step. The rank-based selectContract is replaced by the filtered picker of DM-10. Seed Contracts are re-authored. A new version needs a copy-lines action and an overlap guard.

**Catalogue:** [US-04.1.1](../../../../requirements-board/requirements/stories/US-04.1.1.md), [US-04.1.2](../../../../requirements-board/requirements/stories/US-04.1.2.md), [US-04.1.3](../../../../requirements-board/requirements/stories/US-04.1.3.md), [US-04.1.4](../../../../requirements-board/requirements/stories/US-04.1.4.md), [US-04.2.10](../../../../requirements-board/requirements/stories/US-04.2.10.md), [US-04.2.11](../../../../requirements-board/requirements/stories/US-04.2.11.md), [FT-04.1](../../../../requirements-board/requirements/stories/FT-04.1.md), [FT-04.2](../../../../requirements-board/requirements/stories/FT-04.2.md), [OQ-66](../../../../requirements-board/requirements/questions/OQ-66.md), [domain-model.md](../../../../requirements-board/requirements/domain-model.md)

**Prototype:** `aa-prototype/src/domain/types.ts:216`, `aa-prototype/src/domain/billing/contracts.ts:34`, `aa-prototype/src/store/contractActions.ts:1`, `aa-prototype/src/domain/seed/contracts.ts:45`

## DM-09

### Contract line (one per procedure, carrying only what it sets) replaces ContractPrice

**Kind:** ChangedEntity · **Size:** L

**Catalogue says.** A Contract has lines, at most one per procedure; a combination Contract has a line under each parent procedure (US-04.2.4, US-04.2.11). A line carries only what it sets: a fixed price (ex GST), a fixed rate, a fixed discount, base or modifier units that differ from the procedure's, an optional holder code and description kept for reference and searchable, and possibly a time band (OQ-89). Blank inherits and 0 is a value. Removed from lines: RVG mapping, add-on flag, quantity rule, price tier, line-level effective date; no line prices a whole RVG group.

**Prototype has.** ContractPrice (types.ts:250): contractId, optional rvgBaseCode, optional surgeonId, optional procedureOrdinal, price. Only Type 3 Contracts use rows, matched most-specific-wins (contracts.ts:77) and falling back to BTM when none match. Rate and discount live on Contract.type2Detail (types.ts:212), not on a line. No holder code, description, units override or time band.

**Impact.** Replaces masters.contractPrices and matchContractPrice. Surgeon-specific and ordinal-specific prices are re-expressed as surgeon-held Contracts and as plain lines. The Contract picker (DM-10) and the unit resolver (DM-43) read lines. Seed prices and Master Data screens are rewritten. Must follow DM-13 and DM-07.

**Catalogue:** [US-04.2.4](../../../../requirements-board/requirements/stories/US-04.2.4.md), [US-04.2.2](../../../../requirements-board/requirements/stories/US-04.2.2.md), [US-04.2.11](../../../../requirements-board/requirements/stories/US-04.2.11.md), [US-05.2.5](../../../../requirements-board/requirements/stories/US-05.2.5.md), [US-05.2.6](../../../../requirements-board/requirements/stories/US-05.2.6.md), [US-05.4.3](../../../../requirements-board/requirements/stories/US-05.4.3.md), [FT-04.2](../../../../requirements-board/requirements/stories/FT-04.2.md), [OQ-89](../../../../requirements-board/requirements/questions/OQ-89.md), [domain-model.md](../../../../requirements-board/requirements/domain-model.md)

**Prototype:** `aa-prototype/src/domain/types.ts:250`, `aa-prototype/src/domain/types.ts:212`, `aa-prototype/src/domain/billing/contracts.ts:77`, `aa-prototype/src/domain/seed/contracts.ts:139`

## DM-49

### One stored No contract (RVG) replaces the protected default Type 1 per hospital and direct-billing insurer

**Kind:** ChangedEntity · **Size:** M

**Catalogue says.** Exactly one No contract (RVG): no holder, no lines, never expires, found by a flag not its name, offered first for every procedure by rule, billing the payer on the Booking. There are no hospital, insurer or per-procedure default Contracts and nothing is derived from the List's location (US-04.3.3, OQ-78). The default-Contract feature and stories (FT-04.4, US-04.4.1, US-04.4.2) are Retired.

**Prototype has.** A protected default Type 1 per hospital and per direct-claims insurer, created atomically with the hospital or when the insurer flag flips (mastersActions.ts:45-150), protected from delete and end-dating (contractActions.ts isProtectedDefault), and used as the fallback when a negotiated Contract is expired or absent (invoiceBuild.ts defaultContractFor, resolveContractForProcedure:114). The Billable Party route resolves with no Contract at all.

**Impact.** This was an aligned feature in the earlier pass and is now a removal. Delete the per-holder invariants, the fallback rules and their tests; add one flagged Contract and the 'offered first' rule; payer-on-Booking billing replaces the Billable Party route (DM-11). Must come with DM-07.

**Catalogue:** [US-04.3.3](../../../../requirements-board/requirements/stories/US-04.3.3.md), [FT-04.4](../../../../requirements-board/requirements/stories/FT-04.4.md), [US-04.4.1](../../../../requirements-board/requirements/stories/US-04.4.1.md), [US-04.4.2](../../../../requirements-board/requirements/stories/US-04.4.2.md), [OQ-78](../../../../requirements-board/requirements/questions/OQ-78.md), [domain-model.md](../../../../requirements-board/requirements/domain-model.md)

**Prototype:** `aa-prototype/src/store/mastersActions.ts:45`, `aa-prototype/src/store/contractActions.ts:1`, `aa-prototype/src/domain/billing/invoiceBuild.ts:114`, `aa-prototype/src/domain/seed/contracts.ts:45`

## DM-10

### Each Procedure selects exactly one Contract at booking setup; the billing route and billing-time Contract resolution disappear

**Kind:** ChangedRelationship · **Size:** XL

**Catalogue says.** Every Procedure references exactly one Contract before its Booking can be marked complete (US-04.3.1). Admin sets it at booking setup (mandatory; a Booking without one stays on the admin's list); the anaesthetist may change the procedure or Contract until they submit, with no reason, audited and flagged at office review; a change refreshes starting units and any fixed price and clears a typed price if the new Contract is not adjustable (US-04.3.4, US-03.4.1, FT-03.4). The picker offers No contract (RVG) first, then Contracts with a line for the procedure, valid on the procedure date, whose holder fits the List's hospital, surgeon or rooms and (first party) the Booking's anaesthetist (US-04.3.2). The engine resolves no route or payer; the Contract does (US-08.1.1).

**Prototype has.** Procedure carries billingRoute 'hospital' | 'billableParty' | 'insurer' (types.ts:418), optional governingContractId, insurerId, billablePartyId, patientPaymentCategory, prepaymentDetail, accRelated and billingReference. The route is set explicitly (the validator fails an unset route, validateBookingForBilling.ts:125). The Contract is resolved at billing time from holder, effective date and default fallback (invoiceBuild.ts:114) and is not locked. Only the office edits billing setup (shared/booking/OfficeBillingSetup.tsx); the anaesthetist sees a read-only line.

**Impact.** The central relationship change: Procedure.contractId (mandatory) replaces route, governing Contract, insurer and payment category. 24 files reference governingContractId or billingRoute (validator, invoice build, billing run, office review, capture UI, seed Bookings). Anaesthetist gains a Contract and procedure picker; office review gains a Contract-change flag. Needs DM-13 to DM-49; unblocks DM-43, DM-50, DM-08, DM-11 and DM-20. Blank-procedure setup is open (OQ-99).

**Catalogue:** [US-04.3.1](../../../../requirements-board/requirements/stories/US-04.3.1.md), [US-04.3.2](../../../../requirements-board/requirements/stories/US-04.3.2.md), [US-04.3.4](../../../../requirements-board/requirements/stories/US-04.3.4.md), [US-03.4.1](../../../../requirements-board/requirements/stories/US-03.4.1.md), [FT-03.4](../../../../requirements-board/requirements/stories/FT-03.4.md), [FT-04.3](../../../../requirements-board/requirements/stories/FT-04.3.md), [US-08.1.1](../../../../requirements-board/requirements/stories/US-08.1.1.md), [US-07.2.2](../../../../requirements-board/requirements/stories/US-07.2.2.md), [US-03.6.1](../../../../requirements-board/requirements/stories/US-03.6.1.md), [OQ-99](../../../../requirements-board/requirements/questions/OQ-99.md), [OQ-98](../../../../requirements-board/requirements/questions/OQ-98.md), [domain-model.md](../../../../requirements-board/requirements/domain-model.md)

**Prototype:** `aa-prototype/src/domain/types.ts:418`, `aa-prototype/src/domain/types.ts:453`, `aa-prototype/src/domain/billing/invoiceBuild.ts:114`, `aa-prototype/src/shared/booking/OfficeBillingSetup.tsx:36`, `aa-prototype/src/domain/billing/validateBookingForBilling.ts:125`

## DM-43

### Starting units resolve through Contract line, procedure then RVG group; out-of-range base units warn instead of fail

**Kind:** RuleChange · **Size:** M

**Catalogue says.** Base and modifier units start from the first layer that sets them: the Contract's line, the procedure, the RVG group (blank inherits, 0 is a value); fixed price, rate and discount come from the line only. The resolved value and the layer it came from are recorded. It re-runs when the procedure or Contract changes. For a ranged code the anaesthetist picks the exact base figure and may enter any value, including outside the published range; that is accepted and raises an after-procedure warning (US-03.3.1, FT-05.2, OQ-62, OQ-56). How a range is held is OQ-101.

**Prototype has.** resolveBtm (fee.ts:58) takes base units from the single RvgCode row (single, or a range via baseUnitsSelected) with a captured override flagged 'overridden'; there is no Contract or procedure layer and no layer recorded. The validator flags a missing or out-of-range selection as a billing failure rather than a warning (validateBookingForBilling.ts:152-165).

**Impact.** Pure module change in domain/billing with new tests plus a source-layer field on the captured units. Capture UI shows starting values and refreshes on change. Depends on DM-13 and DM-09; feeds the warning rule in DM-31.

**Catalogue:** [US-03.3.1](../../../../requirements-board/requirements/stories/US-03.3.1.md), [FT-05.2](../../../../requirements-board/requirements/stories/FT-05.2.md), [US-05.1.1](../../../../requirements-board/requirements/stories/US-05.1.1.md), [US-05.1.6](../../../../requirements-board/requirements/stories/US-05.1.6.md), [US-04.2.4](../../../../requirements-board/requirements/stories/US-04.2.4.md), [US-13.7.1](../../../../requirements-board/requirements/stories/US-13.7.1.md), [OQ-62](../../../../requirements-board/requirements/questions/OQ-62.md), [OQ-101](../../../../requirements-board/requirements/questions/OQ-101.md), [OQ-56](../../../../requirements-board/requirements/questions/OQ-56.md)

**Prototype:** `aa-prototype/src/domain/billing/fee.ts:58`, `aa-prototype/src/domain/types.ts:87`, `aa-prototype/src/domain/billing/validateBookingForBilling.ts:152`

## DM-50

### Pricing follows one precedence with fixed-rate and fixed-discount Contracts and a recorded price source; Type 2/3 pricing goes

**Kind:** RuleChange · **Size:** L

**Catalogue says.** The first that applies: office override at review, the anaesthetist's typed price (adjustable Contracts only), the Contract's fixed price (BTM kept for reference), else BTM x the Contract's fixed rate or the anaesthetist's own unit value, less the Contract's locked fixed discount and/or the anaesthetist's own percentage discount (whether both may combine is OQ-89). A price of 0 gives a no-charge invoice. The engine rejects a typed price on a non-adjustable Contract and a missing BTM with no fixed price. Fixed rate and fixed discount are new, not dormant. Every price is held GST exclusive (FT-05.2, US-05.2.1, US-05.2.5, US-05.2.6, US-05.4.3, US-05.2.7).

**Prototype has.** feeFor (fee.ts:180): Type 1 units x the anaesthetist's unit value; Type 2 an agreed unit rate or a percent discount folded into a derived rate; Type 3 a fixed ContractPrice else a BTM fallback; non-RVG billing lines; then the typed priceOverride last. No recorded price source, no adjustable gate, no separate discount step, no locked-discount display.

**Impact.** Rewrite of the pure fee path and its Vitest suite; FeeResult gains a priceSource and a rejection path. Invoice line text must stop being the only snapshot (see DM-08). Depends on DM-09 and DM-14. Whether the multi-procedure rule still applies at all is OQ-90 (see DM-15).

**Catalogue:** [FT-05.2](../../../../requirements-board/requirements/stories/FT-05.2.md), [US-05.2.1](../../../../requirements-board/requirements/stories/US-05.2.1.md), [US-05.2.5](../../../../requirements-board/requirements/stories/US-05.2.5.md), [US-05.2.6](../../../../requirements-board/requirements/stories/US-05.2.6.md), [US-05.4.3](../../../../requirements-board/requirements/stories/US-05.4.3.md), [US-05.2.7](../../../../requirements-board/requirements/stories/US-05.2.7.md), [US-04.2.2](../../../../requirements-board/requirements/stories/US-04.2.2.md), [OQ-89](../../../../requirements-board/requirements/questions/OQ-89.md), [OQ-90](../../../../requirements-board/requirements/questions/OQ-90.md), [domain-model.md](../../../../requirements-board/requirements/domain-model.md)

**Prototype:** `aa-prototype/src/domain/billing/fee.ts:180`, `aa-prototype/src/domain/billing/fee.ts:187`, `aa-prototype/src/domain/types.ts:443`

## DM-14

### Price changes split into an anaesthetist adjustment (gated by the Contract) and an office override

**Kind:** ChangedEntity · **Size:** M

**Catalogue says.** Anaesthetist adjustment: a typed price or a percentage discount with a required reason, allowed only on No contract (RVG) and the anaesthetist's own first-party Contracts; on a third-party Contract the price is read-only and a fixed discount shows locked; the adjustment is cleared if the Contract changes to a non-adjustable one; BTM is still recorded in full (US-03.5.1, US-05.4.1, US-03.5.2). Office override at review: percent, amount or final fixed fee, with a reason, always allowed, even over a fixed fee (US-05.4.2). Both audited.

**Prototype has.** A single optional Procedure.priceOverride (types.ts:443): fixedFee, dollarAdjustment or percentAdjustment plus reason, written by anyone with edit rights through editProcedure (lifecycle.ts:438). No actor distinction, no Contract gating and no clearing on Contract change; OverrideCard and PriceOverrideSheet drive it.

**Impact.** Procedure gains two fields (or two small records), with the adjustable test derived from the holder's party type and No contract (RVG). Validator and both UIs gate on it; audit labels change. Depends on DM-48 and DM-07. Price change on a prepaid procedure is OQ-96.

**Catalogue:** [US-03.5.1](../../../../requirements-board/requirements/stories/US-03.5.1.md), [US-03.5.2](../../../../requirements-board/requirements/stories/US-03.5.2.md), [US-05.4.1](../../../../requirements-board/requirements/stories/US-05.4.1.md), [US-05.4.2](../../../../requirements-board/requirements/stories/US-05.4.2.md), [FT-03.5](../../../../requirements-board/requirements/stories/FT-03.5.md), [FT-05.4](../../../../requirements-board/requirements/stories/FT-05.4.md), [OQ-96](../../../../requirements-board/requirements/questions/OQ-96.md), [domain-model.md](../../../../requirements-board/requirements/domain-model.md)

**Prototype:** `aa-prototype/src/domain/types.ts:443`, `aa-prototype/src/store/lifecycle.ts:438`, `aa-prototype/src/shared/capture/OverrideCard.tsx:28`, `aa-prototype/src/shared/flows/PriceOverrideSheet.tsx:32`

## DM-44

### Modifiers become per-Procedure records with explanations; age and included modifiers are locked; ASA is just a modifier

**Kind:** NewEntity · **Size:** L

**Catalogue says.** The system applies only modifiers that cannot be removed: the age modifier (A1 or A2) from the patient's date of birth on the procedure date, and any modifier already included in a code's base units (P1 on every Neurosurgery code H7A to H9b and every Spine code S1 to S10), shown selected at 0 units and locked. Every other modifier is optional, chosen from the RVG modifier table plus AA's own, itemised, each claimed one needing a short explanation. Nothing is pre-filled, ASA included. Some modifier values are not plain numbers. Locked modifiers imply a modifier record per Procedure (US-03.3.4, US-03.3.8, US-05.1.4, US-05.1.5, OQ-94, OQ-95).

**Prototype has.** Procedure.selectedModifierCodes (string array) and a separate asaClass field that seeds its AS code (fee.ts:79-84; types.ts:440). modifierUnits sums plain numbers and zeroes any code in RvgCode.absorbsModifierCodes with a refusal caption (modifierUnits.ts:58). The seed marks P1 absorbed on hip, shoulder and spine demo codes. No explanation field, no date-of-birth driven age modifier and no per-Procedure modifier record.

**Impact.** New record (procedure, modifier, units, explanation, locked reason); modifier master gains non-numeric value shapes and AA's own codes; asaClass, absorbsModifierCodes and the refusal path go; completion blockers add the explanation rule; the capture sheet is rebuilt. 12 files read selectedModifierCodes or asaClass. Needs DM-13 (included modifier belongs to the group); feeds DM-15.

**Catalogue:** [US-03.3.4](../../../../requirements-board/requirements/stories/US-03.3.4.md), [US-03.3.8](../../../../requirements-board/requirements/stories/US-03.3.8.md), [US-05.1.4](../../../../requirements-board/requirements/stories/US-05.1.4.md), [US-05.1.5](../../../../requirements-board/requirements/stories/US-05.1.5.md), [FT-03.3](../../../../requirements-board/requirements/stories/FT-03.3.md), [OQ-94](../../../../requirements-board/requirements/questions/OQ-94.md), [OQ-95](../../../../requirements-board/requirements/questions/OQ-95.md), [domain-model.md](../../../../requirements-board/requirements/domain-model.md)

**Prototype:** `aa-prototype/src/domain/types.ts:440`, `aa-prototype/src/domain/types.ts:550`, `aa-prototype/src/domain/billing/modifierUnits.ts:58`, `aa-prototype/src/domain/billing/fee.ts:79`, `aa-prototype/src/domain/billing/modifierCodes.ts:1`

## DM-15

### Multi-procedure rule: one primary flag, time on every procedure, modifier units split above four, no Contract-specific ordinals

**Kind:** RuleChange · **Size:** M

**Catalogue says.** Every Booking has exactly one primary Procedure, settable by anyone with edit rights. Base units only on the primary. Time units on every Procedure from its own times (1 per 15 minutes for two hours then 1 per 10, a part interval rounded up; the tiers held as data). Modifier units all on the primary while the total is 4 or fewer, otherwise split equally across all Procedures with the remainder to the primary (US-03.2.1, US-03.2.2, US-05.3.1, US-05.2.2). Contract-specific second-procedure rules are Retired (US-04.2.5, US-05.3.4). Whether the default rule applies at all is OQ-90 (status Verify).

**Prototype has.** The base-on-primary and time-on-every-procedure parts already match (additional procedures yield time units only); what differs is the modifier split above four, the settable primary flag and the Contract-keyed second-procedure prices. Procedure.isAdditional boolean (types.ts:453): an additional procedure yields time units only and modifiers sit on the first (fee.ts:107 splitBillingUnits); ordinal-keyed fixed prices (ContractPrice.procedureOrdinal; fee.ts:212); time tiers as module constants (timeUnits.ts:13-31).

**Impact.** isAdditional becomes isPrimary (14 files), the allocation step is pure and testable, ordinal pricing and its seed rows go, tiers become data. Needs DM-44 for the modifier total. Small if built once OQ-90 is read as 'the rule applies'.

**Catalogue:** [US-03.2.1](../../../../requirements-board/requirements/stories/US-03.2.1.md), [US-03.2.2](../../../../requirements-board/requirements/stories/US-03.2.2.md), [US-05.3.1](../../../../requirements-board/requirements/stories/US-05.3.1.md), [FT-05.3](../../../../requirements-board/requirements/stories/FT-05.3.md), [US-05.2.2](../../../../requirements-board/requirements/stories/US-05.2.2.md), [US-04.2.5](../../../../requirements-board/requirements/stories/US-04.2.5.md), [US-05.3.4](../../../../requirements-board/requirements/stories/US-05.3.4.md), [OQ-90](../../../../requirements-board/requirements/questions/OQ-90.md), [OQ-15](../../../../requirements-board/requirements/questions/OQ-15.md)

**Prototype:** `aa-prototype/src/domain/types.ts:453`, `aa-prototype/src/domain/billing/fee.ts:107`, `aa-prototype/src/domain/billing/fee.ts:212`, `aa-prototype/src/domain/billing/timeUnits.ts:13`

## DM-46

### Rate x time billing and the Method 3 'individual arrangement' gate are removed; other billing lines remain with their own dates

**Kind:** RemovedEntity · **Size:** M

**Catalogue says.** Rate x time capture is Retired (US-03.3.7): a Contract with its own fixed rate prices the whole Procedure at BTM x that rate (US-05.2.6), not a billing line. Contract add-on fees are removed. Other billing lines that sit outside BTM (post-op reviews, nerve catheters, pain consults, transport) remain and can carry their own later date; post-care may instead be an event (US-03.3.6, DM-17).

**Prototype has.** ChargeBasis 'rvg' | 'fixed' | 'rateTime' (types.ts:519); BillingLine hours and rate; Contract.permitsIndividualArrangement as the Method 3 gate, validator-enforced (validateBookingForBilling.ts:222-230); a seeded rate x time capture Booking (Souter) and the capture UI for it.

**Impact.** Delete the rateTime basis, the gate field and validator branch, the seeded scenario and UI; add an optional date on a billing line. Independent of most others; do alongside DM-07 so the Contract shape is touched once.

**Catalogue:** [US-03.3.6](../../../../requirements-board/requirements/stories/US-03.3.6.md), [US-03.3.7](../../../../requirements-board/requirements/stories/US-03.3.7.md), [US-05.2.6](../../../../requirements-board/requirements/stories/US-05.2.6.md), [US-04.2.4](../../../../requirements-board/requirements/stories/US-04.2.4.md), [OQ-89](../../../../requirements-board/requirements/questions/OQ-89.md)

**Prototype:** `aa-prototype/src/domain/types.ts:519`, `aa-prototype/src/domain/types.ts:528`, `aa-prototype/src/domain/billing/fee.ts:237`, `aa-prototype/src/domain/billing/validateBookingForBilling.ts:222`

## DM-08

### Authorising a List snapshots each Procedure's Contract version and pricing inputs; the billing engine reads the snapshot

**Kind:** NewLifecycle · **Size:** L

**Catalogue says.** On AUTHORISED the engine snapshots, per Procedure, the procedure, Contract version, resolved values and which layer each came from, recorded BTM, rate and discount used, price and price source, and the payer or billable party. Later changes to the RVG, procedures or Contracts never alter an issued invoice, which can always be reproduced from what it was generated from (US-04.3.5, US-08.4.4, US-08.1.1, US-07.3.1, US-07.3.2). The engine resolves no route or payer.

**Prototype has.** authoriseList (lifecycle.ts:262) only sets the List to AUTHORISED. The billing run later resolves the Contract and computes the fee at run time (invoiceBuild.ts:114 and :264; billingRun.ts:68) and stores amounts plus rate text inside invoice line descriptions (invoiceBuild.ts describeFeeLine). No stored Contract version or resolved layers.

**Also.** US-05.3.5 asks the ledger to record the units and dollars attributed to each Procedure: InvoiceLine.procedureId is optional today (types.ts:688), so the snapshot should carry the per-Procedure share.

**Impact.** New PricingSnapshot record per Procedure, written at authorisation and read by the run and by invoice regeneration; the immutable lock now covers the Contract version, not just the Booking. Needs DM-07, DM-10, DM-50 and DM-11. The existing per-Booking failure isolation (billingRun.ts:68-165) stays.

**Catalogue:** [US-04.3.5](../../../../requirements-board/requirements/stories/US-04.3.5.md), [US-08.4.4](../../../../requirements-board/requirements/stories/US-08.4.4.md), [US-08.1.1](../../../../requirements-board/requirements/stories/US-08.1.1.md), [US-07.3.1](../../../../requirements-board/requirements/stories/US-07.3.1.md), [US-07.3.2](../../../../requirements-board/requirements/stories/US-07.3.2.md), [FT-07.3](../../../../requirements-board/requirements/stories/FT-07.3.md), [domain-model.md](../../../../requirements-board/requirements/domain-model.md)

**Prototype:** `aa-prototype/src/store/lifecycle.ts:262`, `aa-prototype/src/domain/billing/invoiceBuild.ts:114`, `aa-prototype/src/domain/billing/invoiceBuild.ts:264`, `aa-prototype/src/store/billingRun.ts:68`

## DM-16

### Contract carries invoice layout, delivery method and the holder references a Booking must supply

**Kind:** ChangedEntity · **Size:** S

**Catalogue says.** A Contract sets the invoice layout (contract holder or patient), the delivery method (email, or portal upload for a direct insurer) and the GST treatment (US-04.2.8). It also names the references its holder needs on invoices (insurer member number, claim reference, purchase order); the Booking asks for them and completion requires them (US-04.2.2, US-03.6.1). No invoice email sits on the Contract.

**Prototype has.** Layout is derived from the counterparty kind at build time (invoiceBuild.ts:216, Invoice.layout types.ts:679). A single free-text Procedure.billingReference (hospital approval reference) with its completeness check. No delivery-method field; emailing is a stamp (billingRun.ts:398).

**Impact.** A few Contract fields and a Booking-side reference map keyed by the Contract's declared inputs; completion blocker updates. Depends on DM-07.

**Catalogue:** [US-04.2.8](../../../../requirements-board/requirements/stories/US-04.2.8.md), [US-04.2.2](../../../../requirements-board/requirements/stories/US-04.2.2.md), [US-03.6.1](../../../../requirements-board/requirements/stories/US-03.6.1.md), [US-08.4.1](../../../../requirements-board/requirements/stories/US-08.4.1.md), [US-08.4.2](../../../../requirements-board/requirements/stories/US-08.4.2.md), [US-04.2.7](../../../../requirements-board/requirements/stories/US-04.2.7.md)

**Prototype:** `aa-prototype/src/domain/billing/invoiceBuild.ts:216`, `aa-prototype/src/domain/types.ts:672`, `aa-prototype/src/store/billingRun.ts:398`

## DM-51

### Procedure keeps source wording exactly as received, with later different wording added beside it

**Kind:** NewEntity · **Size:** M

**Catalogue says.** Each Procedure keeps the procedure text exactly as the originating system sent it (hospital download or feed, surgeon PDF, email), never edited or overwritten; a later update with different wording is added with its source system and time; manual entry has an optional 'as given' field. On every booking screen in both apps, each Procedure shows a stack: as received, then procedure and RVG code, then Contract name, holder, who is invoiced and pricing basis. The invoice uses the procedure's own wording (to confirm) (US-02.5.7, US-03.1.9, US-02.3.1, US-02.4.1).

**Prototype has.** One editable free-text Procedure.description (types.ts:453). IntegrationMessage keeps the raw message text (types.ts:852) but the Booking does not; no history of wordings, no source system or time, no 'as given'.

**Impact.** New append-only source-text list on Procedure written by every intake path (manual create, integration, PDF ingest, matching screen); the three-part stack appears on all booking screens, the review and the matching screen. Pairs with DM-13 (the chosen procedure sits under the source text) and DM-34.

**Catalogue:** [US-02.5.7](../../../../requirements-board/requirements/stories/US-02.5.7.md), [US-03.1.9](../../../../requirements-board/requirements/stories/US-03.1.9.md), [US-03.1.2](../../../../requirements-board/requirements/stories/US-03.1.2.md), [US-02.3.1](../../../../requirements-board/requirements/stories/US-02.3.1.md), [US-02.4.1](../../../../requirements-board/requirements/stories/US-02.4.1.md), [OQ-13](../../../../requirements-board/requirements/questions/OQ-13.md), [domain-model.md](../../../../requirements-board/requirements/domain-model.md)

**Prototype:** `aa-prototype/src/domain/types.ts:453`, `aa-prototype/src/domain/types.ts:852`, `aa-prototype/src/store/integrationActions.ts:434`

## DM-11

### Who is billed: the Contract's holder or the payer named on the Booking, replacing the per-Procedure billable-party override

**Kind:** ChangedRelationship · **Size:** L

**Catalogue says.** Each Procedure's Contract decides who is billed: the holder's billable party record when the holder pays AA itself, otherwise the payer on the Booking. Every Booking names a payer (name and email) prefilled from the patient and editable by the office or the anaesthetist to a parent or guardian; a payer email is required on that path and blocks completion; a patient under 18 as payer is a mild warning, not a block; a guardian's details live on the Booking for the life of the debt then archive, not as a master record (FT-11.2, US-11.2.1 to US-11.2.4, US-04.2.1). Billable parties are reference records (hospitals, surgeons, insurers, patients or guardians) per Greg and the draft design (AR-29); how that sits with 'no guardian master record' is not settled. Settled for now by OQ-67, OQ-54, OQ-78.

**Prototype has.** Per-Procedure: billablePartyId override pointing to a BillableParty master (hiddenInternalId, relationship, contact; types.ts:127) created by createBillableParty (billablePartyActions.ts:21) with its own Xero contact (types.ts:768). Default payer is the patient on the Billable Party route. The counterparty is a CounterpartyRef union of hospital, insurer, surgeon, organisation, patient and billableParty (types.ts:73) chosen by counterpartyForProcedure (invoiceBuild.ts:192). No Booking-level payer, no payer-email completion rule.

**Impact.** Booking gains payer fields; counterparty resolution becomes holder-billable-party or Booking payer; the BillableParty master is dropped or repurposed as the reference table; Xero contact keying stays on a hidden id. 13 files read billablePartyId. EP-11 now agrees (each Booking names a payer). Needs DM-48 and DM-10; DM-28, DM-19 and DM-31 build on it.

**Catalogue:** [FT-11.2](../../../../requirements-board/requirements/stories/FT-11.2.md), [US-11.2.1](../../../../requirements-board/requirements/stories/US-11.2.1.md), [US-11.2.2](../../../../requirements-board/requirements/stories/US-11.2.2.md), [US-11.2.3](../../../../requirements-board/requirements/stories/US-11.2.3.md), [US-11.2.4](../../../../requirements-board/requirements/stories/US-11.2.4.md), [US-04.2.1](../../../../requirements-board/requirements/stories/US-04.2.1.md), [US-08.2.1](../../../../requirements-board/requirements/stories/US-08.2.1.md), [EP-11](../../../../requirements-board/requirements/stories/EP-11.md), [OQ-67](../../../../requirements-board/requirements/questions/OQ-67.md), [OQ-54](../../../../requirements-board/requirements/questions/OQ-54.md), [OQ-78](../../../../requirements-board/requirements/questions/OQ-78.md), [domain-model.md](../../../../requirements-board/requirements/domain-model.md)

**Prototype:** `aa-prototype/src/domain/types.ts:127`, `aa-prototype/src/domain/types.ts:73`, `aa-prototype/src/domain/types.ts:453`, `aa-prototype/src/domain/billing/invoiceBuild.ts:192`, `aa-prototype/src/store/billablePartyActions.ts:21`

## DM-28

### Splitting a Procedure's fee between payers is a Booking action with typed $ or % shares, not a line-level funder override

**Kind:** ChangedEntity · **Size:** M

**Catalogue says.** On a Booking the user presses a button against a Procedure's Contract line to split the invoiced fee between several billable parties; each share is a typed $ or %; each party is invoiced its share separately. It is not a Contract setting (the payment setting US-04.2.12 is Retired) and is separate from an additional invoice. Basis is our pick (OQ-68); whether % shares must total 100 is open (US-08.2.1, US-08.2.3, US-11.4.1, OQ-23).

**Prototype has.** BillingLine.funderOverride (types.ts:528) with a conservation rule (once any line is overridden, line amounts must sum to the computed fee); office-only allocation via setBillingLineAllocation (billingLineActions.ts:138) and setProcedureFunderAllocation (:218). Grouping invoices by distinct counterparty per Booking is already built (invoiceBuild.ts:264) and aligned.

**Impact.** Replace line-level overrides with a per-Procedure shares record (party, $ or %); validator and allocation sheet adapt; invoice grouping unchanged. Needs DM-11.

**Catalogue:** [US-08.2.3](../../../../requirements-board/requirements/stories/US-08.2.3.md), [US-08.2.1](../../../../requirements-board/requirements/stories/US-08.2.1.md), [US-04.2.12](../../../../requirements-board/requirements/stories/US-04.2.12.md), [US-11.4.1](../../../../requirements-board/requirements/stories/US-11.4.1.md), [FT-08.2](../../../../requirements-board/requirements/stories/FT-08.2.md), [OQ-23](../../../../requirements-board/requirements/questions/OQ-23.md), [OQ-68](../../../../requirements-board/requirements/questions/OQ-68.md)

**Prototype:** `aa-prototype/src/domain/types.ts:528`, `aa-prototype/src/store/billingLineActions.ts:138`, `aa-prototype/src/store/billingLineActions.ts:218`, `aa-prototype/src/domain/billing/invoiceBuild.ts:264`

## DM-12

### Booking may carry an insurance indication that guides the Contract but never decides who is billed (storage open)

**Kind:** NewEntity · **Size:** S

**Catalogue says.** The Booking may carry the patient's insurance indication (for example SXAP) from the surgeon's booking or the hospital, guiding which Contract is chosen; the Contract still decides who is billed. A Booking that says an insurer will pay with no insurer Contract chosen is a warning at office review, not a block. Whether and where it is stored is open (OQ-93); no Insurer route remains (US-03.1.9 area, US-07.2.2, US-11.4.1).

**Prototype has.** None. Procedure.insurerId is the payee of the Insurer billing route (types.ts:453); accRelated is an informational flag.

**Impact.** One field plus a review warning rule (DM-31) once OQ-93 is answered; insurerId stops being a route. Tiny, but blocked on the owner's decision.

**Catalogue:** [US-07.2.2](../../../../requirements-board/requirements/stories/US-07.2.2.md), [US-11.4.1](../../../../requirements-board/requirements/stories/US-11.4.1.md), [US-04.3.2](../../../../requirements-board/requirements/stories/US-04.3.2.md), [FT-11.2](../../../../requirements-board/requirements/stories/FT-11.2.md), [OQ-93](../../../../requirements-board/requirements/questions/OQ-93.md)

**Prototype:** `aa-prototype/src/domain/types.ts:453`, `aa-prototype/src/domain/types.ts:166`

## DM-30

### NHI is required: a missing NHI is a visible problem and blocks authorising the List

**Kind:** RuleChange · **Size:** M

**Catalogue says.** Patient record keyed on NHI (or, proposed, the system's own ID with the NHI added under a second unique index; OQ-49 open), NHI required. A Booking without one appears on a problem list (patient, List, surgeon's rooms) until added; working assumption is the Booking proceeds flagged and authorising the List is blocked. The anaesthetist sees the NHI or 'NHI missing'; Bookings are searchable by NHI or name; later NHI attaches to the single record with no duplicate (US-11.1.1, US-11.1.4, US-11.1.5, US-03.1.5, US-03.1.7, US-14.4.1).

**Prototype has.** Patient.nhi optional (types.ts:103); upsertPatient creates a 'createdProvisional' record when no NHI is given and reuses by NHI when present (intake.ts:127); the hiddenInternalId invariant and dual-format NHI validation are aligned. No problem list; authoriseList (lifecycle.ts:262) has no NHI check; no NHI search.

**Impact.** Derived problem-list selector, authorise guard, merge path when the NHI arrives, NHI shown or flagged in both apps. Shape depends on OQ-49. Interacts with DM-03 and DM-34 (Bookings arriving without NHI).

**Catalogue:** [US-11.1.1](../../../../requirements-board/requirements/stories/US-11.1.1.md), [US-11.1.4](../../../../requirements-board/requirements/stories/US-11.1.4.md), [US-11.1.5](../../../../requirements-board/requirements/stories/US-11.1.5.md), [US-03.1.5](../../../../requirements-board/requirements/stories/US-03.1.5.md), [US-03.1.7](../../../../requirements-board/requirements/stories/US-03.1.7.md), [OQ-49](../../../../requirements-board/requirements/questions/OQ-49.md), [OQ-30](../../../../requirements-board/requirements/questions/OQ-30.md)

**Prototype:** `aa-prototype/src/domain/types.ts:103`, `aa-prototype/src/store/intake.ts:127`, `aa-prototype/src/store/lifecycle.ts:262`, `aa-prototype/src/domain/nhi.ts:1`

## DM-02

### Slot becomes a stored entity separate from List; Day parents both

**Kind:** ChangedEntity · **Size:** XL

**Catalogue says.** The settled logical model (OQ-64): a day holds an AM and a PM Slot for every active anaesthetist, created and stored across the rolling horizon (four months today, any number, a rarely changed setting; shortening drops days, extending fills them), empty ones included. A Slot is a box with a status, default times with per-Slot override, and holds at most one List; with no List it has no surgeon or hospital. A List is put into a Slot; both are children of the day. A new anaesthetist gets Slots from their start date. The word 'slot' never appears in the UI (EP-01, FT-01.1, US-01.1.1 to US-01.1.4, FT-01.3). How it is stored is for the developers.

**Prototype has.** No Slot. One List per anaesthetist x date x session whose id is derived from the slot (listIdForSlot, seed/canvas.ts:45; List types.ts:301). An empty slot is a List with statusKey 'free' and state 'DRAFT'. reassignList deletes the target's free List and mints a regenerated List for the vacated slot (lifecycle.ts:543-630). Horizon constants are 14 days back and 4 months forward (clock.ts:86-88). No Day entity; times override on the List (startTime, endTime).

**Impact.** Largest structural change on the schedule side. Introduce Slot (anaesthetist, date, session, status, optional times) on the deterministic slot id, List with its own id and slotId. 9 non-test files use listIdForSlot or listForSlot and 46 read schedule.lists: canvas generator, seed, availability, reassignment, dashboards, mobile and web calendars, scale test. This is the logical model (OQ-64); the catalogue leaves storage to the developers, but a Draft List with no anaesthetist cannot be keyed by a slot id, so some separation is forced. Must precede DM-52 to DM-42, DM-53 and DM-34.

**Catalogue:** [EP-01](../../../../requirements-board/requirements/stories/EP-01.md), [FT-01.1](../../../../requirements-board/requirements/stories/FT-01.1.md), [FT-01.3](../../../../requirements-board/requirements/stories/FT-01.3.md), [US-01.1.1](../../../../requirements-board/requirements/stories/US-01.1.1.md), [US-01.1.2](../../../../requirements-board/requirements/stories/US-01.1.2.md), [US-01.1.3](../../../../requirements-board/requirements/stories/US-01.1.3.md), [US-01.1.4](../../../../requirements-board/requirements/stories/US-01.1.4.md), [OQ-64](../../../../requirements-board/requirements/questions/OQ-64.md), [domain-model.md](../../../../requirements-board/requirements/domain-model.md)

**Prototype:** `aa-prototype/src/domain/types.ts:301`, `aa-prototype/src/domain/seed/canvas.ts:45`, `aa-prototype/src/store/lifecycle.ts:543`, `aa-prototype/src/domain/clock.ts:86`

## DM-52

### List lifecycle becomes DRAFT, ACTIVE, SUBMITTED, AUTHORISED, where DRAFT means no anaesthetist

**Kind:** ChangedLifecycle · **Size:** L

**Catalogue says.** A List is DRAFT while it has no anaesthetist (a Draft List), ACTIVE once it has all five of its pairing (anaesthetist, surgeon, hospital, day, session), then SUBMITTED and AUTHORISED. A List set up with its anaesthetist starts ACTIVE; an ACTIVE List returned to the office (moved, withdrawn, or caught by an automated reschedule clash, which is the Future Work path of US-02.5.2) becomes DRAFT again. The anaesthetist completes Bookings and submits only while ACTIVE; no Returned state. Slot availability status is separate from list state (EP-07, FT-07.1 to FT-07.3, FT-01.6). Until 7 October 'DRAFT' was the name of today's ACTIVE.

**Prototype has.** ListState 'DRAFT' | 'SUBMITTED' | 'AUTHORISED' (types.ts:46), where DRAFT means assigned and editable and also labels every empty free Slot-List. Guards in editRefusal (lifecycle.ts:48-70) and the submit and authorise rules key on 'DRAFT'; 16 files reference it. No Returned state anywhere (aligned).

**Impact.** Semantic rename across guards, selectors, seed, chips, tests (16 files) plus a new ACTIVE to DRAFT transition. Do in the same change as DM-02 and DM-03 so existing 'DRAFT' meaning is never mixed. The seed's persisted state needs a PERSIST_VERSION bump.

**Catalogue:** [EP-07](../../../../requirements-board/requirements/stories/EP-07.md), [FT-07.1](../../../../requirements-board/requirements/stories/FT-07.1.md), [FT-07.2](../../../../requirements-board/requirements/stories/FT-07.2.md), [FT-07.3](../../../../requirements-board/requirements/stories/FT-07.3.md), [FT-01.6](../../../../requirements-board/requirements/stories/FT-01.6.md), [US-07.1.1](../../../../requirements-board/requirements/stories/US-07.1.1.md), [US-07.2.1](../../../../requirements-board/requirements/stories/US-07.2.1.md), [US-07.3.1](../../../../requirements-board/requirements/stories/US-07.3.1.md), [domain-model.md](../../../../requirements-board/requirements/domain-model.md)

**Prototype:** `aa-prototype/src/domain/types.ts:46`, `aa-prototype/src/store/lifecycle.ts:48`, `aa-prototype/src/store/lifecycle.ts:210`, `aa-prototype/src/store/lifecycle.ts:262`

## DM-03

### Draft List: a List with no anaesthetist that can hold Bookings and is assigned by the office

**Kind:** NewEntity · **Size:** L

**Catalogue says.** A Draft List is a List created with no anaesthetist; hospital, surgeon, day and session are required; it takes no Slot and can hold Bookings. It arises from a surgeon's room needing an anaesthetist, an anaesthetist returning a List to the office (including by marking its Slot unavailable), a recurring booking landing on an unavailable Slot, an integration reschedule that clashes (US-02.5.2 is in the Future Work lane, so this source is not first release), and the matching screen. It shows prominently in the Admin App; only an admin assigns it (making it ACTIVE), never offered to anaesthetists (OQ-86); it can be removed or re-dated (FT-01.6, US-01.6.1 to US-01.6.4, US-13.1.1, US-02.5.2).

**Prototype has.** Nothing. List.anaesthetistId is mandatory (types.ts:304) and every Booking hangs off a List id (types.ts:373). The generator silently drops a recurring booking that falls on an unavailable availability row (canvas.ts:116-119).

**Impact.** List.anaesthetistId optional; Draft List page, day-dashboard rows, planning side panel, assign, remove and re-date actions; emitted by DM-05 (return to office), DM-53 (recurring on unavailable Slot) and DM-34 (matching). Assignment shows preference conflicts (DM-54). After DM-02 and DM-52.

**Catalogue:** [FT-01.6](../../../../requirements-board/requirements/stories/FT-01.6.md), [US-01.6.1](../../../../requirements-board/requirements/stories/US-01.6.1.md), [US-01.6.2](../../../../requirements-board/requirements/stories/US-01.6.2.md), [US-01.6.3](../../../../requirements-board/requirements/stories/US-01.6.3.md), [US-01.6.4](../../../../requirements-board/requirements/stories/US-01.6.4.md), [US-01.5.5](../../../../requirements-board/requirements/stories/US-01.5.5.md), [US-02.5.2](../../../../requirements-board/requirements/stories/US-02.5.2.md), [US-13.1.1](../../../../requirements-board/requirements/stories/US-13.1.1.md), [OQ-86](../../../../requirements-board/requirements/questions/OQ-86.md), [OQ-81](../../../../requirements-board/requirements/questions/OQ-81.md)

**Prototype:** `aa-prototype/src/domain/types.ts:304`, `aa-prototype/src/domain/types.ts:373`, `aa-prototype/src/domain/seed/canvas.ts:116`

## DM-04

### Slot status is user-maintained master data kept from one availability calendar, with series

**Kind:** ChangedEntity · **Size:** M

**Catalogue says.** Statuses are a user-maintained list: each has a fixed internal ID, an editable label and an editable colour; rules read the ID, not the label; the start set is free (default), on holiday, unavailable. The anaesthetist keeps status up per Slot from one calendar in their app: mark days off ahead, create a series, edit or delete one instance; this and the Slot status are one mechanism, independent of bookings. A List in the Slot shows in place of the status (US-01.2.1 to US-01.2.3, US-01.5.3, FT-01.2). Whether the private, public and pre-op list colours survive as list kinds is not stated.

**Prototype has.** ListStatus master keyed by a compile-time six-value LIST_STATUS_KEYS union (types.ts:51-61, parity-tested with the theme) mixing availability (free, holiday, unavailable) with list kind (private, public, preop); the admin screen is view-only. A separate AnaesthetistAvailability master (types.ts:603) is reconciled into the List by setAvailability (lifecycle.ts:698): only a truly free List restatuses, otherwise an availability ListConflict is flagged. No series, no instance exceptions.

**Impact.** Statuses become data with id, label, colour; the availability master folds into the Slot; series (rule plus exceptions) is new; the theme parity test and the status legend read from data. The home of the private, public and pre-op kinds needs an owner decision. After DM-02.

**Catalogue:** [US-01.2.1](../../../../requirements-board/requirements/stories/US-01.2.1.md), [US-01.2.2](../../../../requirements-board/requirements/stories/US-01.2.2.md), [US-01.2.3](../../../../requirements-board/requirements/stories/US-01.2.3.md), [US-01.5.3](../../../../requirements-board/requirements/stories/US-01.5.3.md), [FT-01.2](../../../../requirements-board/requirements/stories/FT-01.2.md), [OQ-17](../../../../requirements-board/requirements/questions/OQ-17.md), [OQ-64](../../../../requirements-board/requirements/questions/OQ-64.md)

**Prototype:** `aa-prototype/src/domain/types.ts:51`, `aa-prototype/src/domain/types.ts:603`, `aa-prototype/src/domain/types.ts:620`, `aa-prototype/src/store/lifecycle.ts:698`, `aa-prototype/src/apps/admin/screens/MasterData.tsx:453`

## DM-05

### An anaesthetist moves their own List to the office or a colleague, with no confirmation; marking a Slot unavailable forces return or assign

**Kind:** ChangedLifecycle · **Size:** M

**Catalogue says.** The anaesthetist moves a List to the AA office (it becomes a Draft List) or pushes it into a colleague's free Slot found in the availability view; no acceptance, no office confirmation; withdrawing also returns it to a Draft List. Marking a Slot unavailable while it holds a List asks them to return or assign it, so a List is not left with an absent anaesthetist. The colleague sees it appear with a notice; the office is notified through the shared pool and offered the cover-change update email. No not-preferred warning on this hand-over (US-01.4.3, US-01.4.5, US-01.5.5, US-13.8.2, US-01.4.1). The Slot left behind is OQ-84. Conflicts remain only for hospital closures and a Booking landing on an already-unavailable Slot (US-01.5.2).

**Prototype has.** A CoverRequest offer or request marker on a Free List (types.ts:277; requestCover lifecycle.ts:843), simulated with nothing moving. Moving a whole List is office-only (reassignList lifecycle.ts:543 refuses non-office; target must be Free; vacated slot regenerates with an office-chosen status). Marking a booked Slot unavailable only flags an availability ListConflict and the List stays with the anaesthetist (lifecycle.ts:698-830).

**Impact.** Replace CoverRequest with anaesthetist-actor move actions on the Slot and List model; the availability ListConflict stops being produced by mark-unavailable; the mobile cover sheet becomes a move sheet. Posts to DM-41. Needs DM-02, DM-03 and DM-04.

**Catalogue:** [US-01.4.3](../../../../requirements-board/requirements/stories/US-01.4.3.md), [US-01.4.5](../../../../requirements-board/requirements/stories/US-01.4.5.md), [US-01.5.5](../../../../requirements-board/requirements/stories/US-01.5.5.md), [US-01.5.2](../../../../requirements-board/requirements/stories/US-01.5.2.md), [US-01.5.4](../../../../requirements-board/requirements/stories/US-01.5.4.md), [US-13.8.2](../../../../requirements-board/requirements/stories/US-13.8.2.md), [US-01.4.1](../../../../requirements-board/requirements/stories/US-01.4.1.md), [US-01.4.2](../../../../requirements-board/requirements/stories/US-01.4.2.md), [OQ-65](../../../../requirements-board/requirements/questions/OQ-65.md), [OQ-84](../../../../requirements-board/requirements/questions/OQ-84.md), [OQ-43](../../../../requirements-board/requirements/questions/OQ-43.md)

**Prototype:** `aa-prototype/src/domain/types.ts:277`, `aa-prototype/src/store/lifecycle.ts:543`, `aa-prototype/src/store/lifecycle.ts:698`, `aa-prototype/src/store/lifecycle.ts:843`, `aa-prototype/src/shared/flows/RequestCoverSheet.tsx:1`

## DM-42

### A single Booking moves to a colleague, and whoever submits a List did its procedures

**Kind:** ChangedLifecycle · **Size:** M

**Catalogue says.** An anaesthetist can move one Booking to another anaesthetist found by search, as well as a whole List; a receiver marked unavailable first sets themselves available (their acceptance). The List's anaesthetist did every procedure on it: a Booking done by someone else moves to a List of theirs, even a one-Booking List, and its payable and any prepayment payee follow, with no recalculation (US-01.4.7, US-01.4.6, US-06.5.4). The experience and whether it notifies are open (OQ-85).

**Prototype has.** reassignBooking (lifecycle.ts:635) moves a Booking and its Procedures between Lists; an anaesthetist actor may only move between their own Lists (refused with 'notOwnList'), the office anywhere not AUTHORISED; payables are attributed through booking to list to anaesthetist when read (selectors.ts:611). No receiver-availability rule, no creation of a receiver List, no notification.

**Impact.** Permit cross-anaesthetist Booking moves by the anaesthetist, create or find the receiver List in a Slot, repoint the payable half (DM-21, DM-22). Needs DM-02 and DM-03; notifications via DM-41.

**Catalogue:** [US-01.4.7](../../../../requirements-board/requirements/stories/US-01.4.7.md), [US-01.4.6](../../../../requirements-board/requirements/stories/US-01.4.6.md), [US-06.5.4](../../../../requirements-board/requirements/stories/US-06.5.4.md), [US-01.4.2](../../../../requirements-board/requirements/stories/US-01.4.2.md), [OQ-85](../../../../requirements-board/requirements/questions/OQ-85.md), [OQ-70](../../../../requirements-board/requirements/questions/OQ-70.md)

**Prototype:** `aa-prototype/src/store/lifecycle.ts:635`, `aa-prototype/src/store/selectors.ts:611`

## DM-41

### Shared notification pool in the Admin App

**Kind:** NewEntity · **Size:** M

**Catalogue says.** One pool of notifications shared by the whole admin team, not per user, for things that happened and need no action; separate from the warnings to-do list; newest first, paginated; every logged-on admin sees the same pool. The first source is an anaesthetist moving their own List (which List moved and to whom). What else posts, expiry, and whether a notice can be marked actioned are open (FT-13.8, US-13.8.1, US-13.8.2, OQ-79).

**Prototype has.** Nothing. requestCover is documented as simulated with no real notification (lifecycle.ts:843).

**Impact.** New append-only slice plus an admin screen and dashboard entry; written by DM-05 and DM-42 and launches the update email of DM-35. Independent otherwise; can be built early.

**Catalogue:** [FT-13.8](../../../../requirements-board/requirements/stories/FT-13.8.md), [US-13.8.1](../../../../requirements-board/requirements/stories/US-13.8.1.md), [US-13.8.2](../../../../requirements-board/requirements/stories/US-13.8.2.md), [FT-13.7](../../../../requirements-board/requirements/stories/FT-13.7.md), [OQ-79](../../../../requirements-board/requirements/questions/OQ-79.md)

**Prototype:** `aa-prototype/src/store/lifecycle.ts:843`

## DM-53

### Recurring booking replaces the Permanent List; a pairing that lands on an unavailable Slot becomes a Draft List

**Kind:** ChangedEntity · **Size:** S

**Catalogue says.** A recurring booking is the standing intersection of a hospital, an anaesthetist and a surgeon on a day of the week and an AM or PM session, painted onto Lists across the horizon before any Bookings exist (so a List can hold none). The anaesthetist's calendar is painted first; a recurring booking landing on an unavailable Slot creates a Draft List. The term replaces template, permanent booking and Permanent List (US-01.3.2, OQ-81).

**Prototype has.** PermanentList (types.ts:585) with nullable hospitalId and surgeonId and a statusKey; the generator paints availability first and then the template, silently dropping the template under an unavailable row (canvas.ts:116-119); admin add and edit exist (mastersActions.ts:398-443).

**Impact.** Rename and decide whether null hospital and surgeon (a pre-op session at AA's rooms) survive; emit a Draft List instead of dropping the pairing. Depends on DM-03. Seed permanentLists.ts and the master screen change.

**Catalogue:** [US-01.3.2](../../../../requirements-board/requirements/stories/US-01.3.2.md), [US-01.1.2](../../../../requirements-board/requirements/stories/US-01.1.2.md), [US-13.4.1](../../../../requirements-board/requirements/stories/US-13.4.1.md), [OQ-81](../../../../requirements-board/requirements/questions/OQ-81.md)

**Prototype:** `aa-prototype/src/domain/types.ts:585`, `aa-prototype/src/domain/seed/canvas.ts:116`, `aa-prototype/src/store/mastersActions.ts:398`

## DM-54

### Private two-way pairing preferences and an admin-only anaesthetist priority tier

**Kind:** NewEntity · **Size:** M

**Catalogue says.** Admin staff keep private preferences between a surgeon and an anaesthetist, in both directions, not-preferred and preferred (which side asked, optional reason), visible on both profiles and never to anaesthetists. When admin assign a Draft List, put a List in a Slot, or move or reassign a List, available anaesthetists with a conflict are shown separately from those without, as a soft warning. Each anaesthetist has an admin-only tier (Gold Elite, Gold, Silver, Bronze default; names provisional) that orders suggestions, shuffled within a tier; anaesthetists never see tiers and their own colleague list is not tier-ordered (US-13.6.3, US-13.6.4, US-01.3.5, US-01.3.6, US-01.4.5, OQ-43, OQ-102).

**Prototype has.** Nothing: no preference entity, no tier on Anaesthetist (types.ts:141), assignment pickers do not separate or order candidates.

**Impact.** New Preference record plus Anaesthetist.tier; admin profile screens; assignment, reassign and availability-finder pickers need grouping and a seeded deterministic shuffle (no Math.random). Needs a privacy boundary so neither anaesthetist app reads them. Needs DM-32 (surgeon master) and feeds DM-03.

**Catalogue:** [US-13.6.3](../../../../requirements-board/requirements/stories/US-13.6.3.md), [US-13.6.4](../../../../requirements-board/requirements/stories/US-13.6.4.md), [US-01.3.5](../../../../requirements-board/requirements/stories/US-01.3.5.md), [US-01.3.6](../../../../requirements-board/requirements/stories/US-01.3.6.md), [US-01.4.5](../../../../requirements-board/requirements/stories/US-01.4.5.md), [FT-13.6](../../../../requirements-board/requirements/stories/FT-13.6.md), [OQ-43](../../../../requirements-board/requirements/questions/OQ-43.md), [OQ-102](../../../../requirements-board/requirements/questions/OQ-102.md)

**Prototype:** `aa-prototype/src/domain/types.ts:141`, `aa-prototype/src/store/lifecycle.ts:543`

## DM-32

### Surgeons' rooms, surgeon profile, hospital contact email and fuller anaesthetist profile are master data

**Kind:** ChangedEntity · **Size:** M

**Catalogue says.** Surgeons' rooms are master records (name, contact email and phone, the surgeons who belong to it); a surgeon has a profile (room, NZ registration number, HPI CPN as the unique index) and surgeon groups appear in the reference list; hospitals hold a contact email for booking updates. The anaesthetist profile holds contact details, registration number, HPI CPN, bank account details in the system, unit value, GST period (monthly, two-monthly, six-monthly), prepaid settings (DM-19), priority tier (DM-54) and a start date that drives their Slots (US-13.6.1, US-13.6.2, US-12.1.4, US-12.1.1, US-12.1.2, US-13.4.1, US-01.1.3, OQ-14, OQ-52).

**Prototype has.** Hospital is id and name only (types.ts:155); Surgeon is id, name, specialty (types.ts:160); Anaesthetist has registration number, contact, unitValue, gstPeriod, an hpiId (rename to HPI CPN only) and active (types.ts:141). No rooms, contact emails, surgeon identifiers, bank details or start date; the UI never shows them.

**Impact.** Mostly additive: a SurgeonRoom entity and new fields, edit forms in Master Data, seed values, and persisted-state bump. Update-email addressing (DM-35) and the missing-NHI flow (DM-30) read the room email. Low risk; can run early.

**Catalogue:** [FT-13.6](../../../../requirements-board/requirements/stories/FT-13.6.md), [US-13.6.1](../../../../requirements-board/requirements/stories/US-13.6.1.md), [US-13.6.2](../../../../requirements-board/requirements/stories/US-13.6.2.md), [US-12.1.4](../../../../requirements-board/requirements/stories/US-12.1.4.md), [US-12.1.1](../../../../requirements-board/requirements/stories/US-12.1.1.md), [US-12.1.2](../../../../requirements-board/requirements/stories/US-12.1.2.md), [US-13.4.1](../../../../requirements-board/requirements/stories/US-13.4.1.md), [US-01.1.3](../../../../requirements-board/requirements/stories/US-01.1.3.md), [OQ-14](../../../../requirements-board/requirements/questions/OQ-14.md), [OQ-52](../../../../requirements-board/requirements/questions/OQ-52.md)

**Prototype:** `aa-prototype/src/domain/types.ts:141`, `aa-prototype/src/domain/types.ts:155`, `aa-prototype/src/domain/types.ts:160`, `aa-prototype/src/domain/seed/cast.ts:44`

## DM-34

### Hospital bookings land on a matching screen as import rows with an admin decision, and an unmatched queue

**Kind:** NewEntity · **Size:** L

**Catalogue says.** The system imports hospital bookings however each provides them into a matching screen. For each row the admin matches it to an existing List and Booking, creates a Booking on an existing List, creates a List in an anaesthetist's Slot, creates a Draft List, or rejects it; each row shows its procedure text as received; a later update to a matched Booking shows field differences (matched by date, surgeon, location, Slot) for approval; rows that cannot be matched stay in an unmatched queue; nothing is applied until an admin decides. An automatic sync from St George's and Southern Cross (no last-synced time) is in scope; other feeds, HL7 v2, FHIR and automatic matching are Future Work (US-02.1.1 to US-02.1.5, FT-02.1, FT-14.6). Surgeon PDF ingest (US-02.2.1) is Future Work.

**Prototype has.** Simulated HL7 and FHIR messages are applied straight to Bookings by processMessage (integrationActions.ts:309), with message statuses, retry and dead-letter in an IntegrationMessage log (types.ts:852); ingestPdfRow (:434) is a canned PDF. Integration writes are gated only by List state (editRefusal). No import row, no match decision, no field-difference view, no unmatched queue.

**Impact.** New ImportRow and MatchDecision entities and a queue screen; Booking writes from feeds move behind approval; the HL7/FHIR message log is demoted (FT-14.1, FT-14.2 are Future) or becomes the row source. Needs DM-51, DM-02, DM-03 and DM-30.

**Catalogue:** [US-02.1.1](../../../../requirements-board/requirements/stories/US-02.1.1.md), [US-02.1.2](../../../../requirements-board/requirements/stories/US-02.1.2.md), [US-02.1.3](../../../../requirements-board/requirements/stories/US-02.1.3.md), [US-02.1.4](../../../../requirements-board/requirements/stories/US-02.1.4.md), [US-02.1.5](../../../../requirements-board/requirements/stories/US-02.1.5.md), [FT-02.1](../../../../requirements-board/requirements/stories/FT-02.1.md), [US-02.5.7](../../../../requirements-board/requirements/stories/US-02.5.7.md), [FT-14.6](../../../../requirements-board/requirements/stories/FT-14.6.md), [OQ-13](../../../../requirements-board/requirements/questions/OQ-13.md)

**Prototype:** `aa-prototype/src/store/integrationActions.ts:309`, `aa-prototype/src/store/integrationActions.ts:434`, `aa-prototype/src/domain/types.ts:852`, `aa-prototype/src/store/lifecycle.ts:48`

## DM-35

### Explicit-save change sets, an on-demand update email draft picked from the change history, and email templates

**Kind:** NewEntity · **Size:** M

**Catalogue says.** An admin saves Booking edits explicitly (unsaved-changes warning); each save records the fields changed (before, after, who, when) in the append-only change history. A Booking's admin screen has an on-demand 'draft update email' button: the admin picks one or more changes and a mailto compose window opens prefilled with subject, boilerplate, the changes and the To address (hospital contact for a cover change, surgeon's room for a Booking change), about 2,000 characters, nothing sent or recorded. Templates are user-configurable per kind of change (US-02.3.2, US-02.3.3, US-02.3.4, US-02.5.5, OQ-69, OQ-46; automatic sending is Future, US-02.3.5).

**Prototype has.** Append-only audit per mutation (AuditEntry types.ts:655, mutate.ts), not grouped into save sets; edits apply immediately (editBooking lifecycle.ts:402); no email draft, no templates, no contact emails to address it.

**Impact.** A change-set grouping on audit entries (or a draft buffer), an email-draft launcher and a template master; admin edit form becomes explicit-save. Needs DM-32 for addresses; launched from DM-41 notices.

**Catalogue:** [US-02.3.2](../../../../requirements-board/requirements/stories/US-02.3.2.md), [US-02.3.3](../../../../requirements-board/requirements/stories/US-02.3.3.md), [US-02.3.4](../../../../requirements-board/requirements/stories/US-02.3.4.md), [US-02.5.5](../../../../requirements-board/requirements/stories/US-02.5.5.md), [US-02.3.1](../../../../requirements-board/requirements/stories/US-02.3.1.md), [OQ-69](../../../../requirements-board/requirements/questions/OQ-69.md), [OQ-46](../../../../requirements-board/requirements/questions/OQ-46.md), [OQ-82](../../../../requirements-board/requirements/questions/OQ-82.md)

**Prototype:** `aa-prototype/src/domain/types.ts:655`, `aa-prototype/src/store/lifecycle.ts:402`, `aa-prototype/src/store/mutate.ts:1`

## DM-39

### Copy a Booking and photo capture are removed from the model

**Kind:** RemovedEntity · **Size:** S

**Catalogue says.** Copy a Booking is Retired (US-02.4.3) and photo capture of the booking card is in the Future Work lane (US-02.4.4, status Proposed); the anaesthetist still adds a missing Booking by hand, with an optional 'as given' field (US-02.4.1). Sources of a Booking are a hospital download, surgeon PDF, admin entry and anaesthetist ad hoc entry (EP-02).

**Prototype has.** copyBooking (bookingActions.ts:196, built in Phase 15), Booking.copiedFromBookingId and BookingSource values 'copy' and 'anaesthetistPhoto' (types.ts:371-383); an optional, display-only Booking.source.

**Impact.** Delete the copy action, its field, UI and tests (8 non-test files); trim BookingSource. Independent and small. Needs a PERSIST_VERSION bump only if seeded Bookings carry the removed values.

**Catalogue:** [US-02.4.3](../../../../requirements-board/requirements/stories/US-02.4.3.md), [US-02.4.4](../../../../requirements-board/requirements/stories/US-02.4.4.md), [US-02.4.1](../../../../requirements-board/requirements/stories/US-02.4.1.md), [US-02.4.2](../../../../requirements-board/requirements/stories/US-02.4.2.md), [EP-02](../../../../requirements-board/requirements/stories/EP-02.md), [domain-model.md](../../../../requirements-board/requirements/domain-model.md)

**Prototype:** `aa-prototype/src/store/bookingActions.ts:196`, `aa-prototype/src/domain/types.ts:371`, `aa-prototype/src/domain/types.ts:373`

## DM-19

### Prepaid settings on the anaesthetist profile (procedures or whole RVG groups) trigger prepayment, replacing the per-Procedure payment category

**Kind:** NewEntity · **Size:** M

**Catalogue says.** Each anaesthetist chooses on their own profile which procedures, or whole RVG groups, are prepaid; an admin can maintain them on their behalf. A Booking needs prepayment when any of its Procedures (or that procedure's RVG group) is in the set and the payer is a person paying for the patient, never an organisation (OQ-73); this is checked across the whole Booking. A pre-payable flag on the Contract was floated and not adopted (FT-06.1, US-06.1.1, US-06.1.2, US-06.2.1, US-12.1.3, US-05.1.3).

**Prototype has.** No setting. Prepayment is derived from Procedure.patientPaymentCategory === 'selfFundedPrepayment' on the Billable Party route (selectors.ts:307-313), set per Procedure by the office (types.ts:425).

**Impact.** AnaesthetistPrepaidSetting (procedure ids and RVG group ids); bookingRequiresPrepayment is rewritten on payer type; patientPaymentCategory goes. Needs DM-13 and DM-11; precedes DM-20.

**Catalogue:** [FT-06.1](../../../../requirements-board/requirements/stories/FT-06.1.md), [FT-06.2](../../../../requirements-board/requirements/stories/FT-06.2.md), [US-06.1.1](../../../../requirements-board/requirements/stories/US-06.1.1.md), [US-06.1.2](../../../../requirements-board/requirements/stories/US-06.1.2.md), [US-06.2.1](../../../../requirements-board/requirements/stories/US-06.2.1.md), [US-12.1.3](../../../../requirements-board/requirements/stories/US-12.1.3.md), [US-05.1.3](../../../../requirements-board/requirements/stories/US-05.1.3.md), [OQ-73](../../../../requirements-board/requirements/questions/OQ-73.md)

**Prototype:** `aa-prototype/src/store/selectors.ts:307`, `aa-prototype/src/domain/types.ts:425`, `aa-prototype/src/domain/types.ts:141`

## DM-20

### Prepayment: fixed price from the anaesthetist's own Contract, invoice drafted at setup and held for admin approval, nothing calculated afterwards

**Kind:** ChangedLifecycle · **Size:** L

**Catalogue says.** The prepaid amount is the full fixed price on the anaesthetist's own first-party Contract line (never a deposit, part or estimate), shown to the anaesthetist on the Booking. The invoice is generated automatically at booking setup and not sent until an admin approves it, then goes out with a standard letter template; a later List submit does not invoice it again. After the procedure the prepaid amount is the price and BTM is reference only: no automatic invoice or credit, no threshold; the anaesthetist or office raises an additional invoice or credit note by hand. Prepayments are re-checked when Procedures, Contract or payer change (not on a move). Unpaid is a warning, never a gate. Open: no price in the Contract (OQ-92), price change (OQ-96), part credit (OQ-97), pair timing (OQ-80), and whether the link sits on the Procedure or the Booking (FT-06.2 to FT-06.4, US-06.2.2, US-06.3.1 to US-06.3.6, US-06.4.1, US-08.2.2, US-03.1.8).

**Prototype has.** Prepayment is Procedure.patientPaymentCategory plus prepaymentDetail {type full | split, depositAmount} (types.ts:425-438). The office raises the pre-procedure invoice by hand (raisePreProcedureInvoice, prepaymentActions.ts:51); a split deposit line is a flat agreed figure with the balance billed at the run and a visible netting line (invoiceBuild.ts:444-475). A full prepayment invoices an estimated full fee computed by feeFor, not a Contract price (invoiceBuild.ts:456-). The amount does not come from a Contract. Status is derived (selectors.ts:363-380) and the unpaid warning is built and ungated (Phase 15a; warnings/rules/prepaymentUnpaid.ts), which is aligned.

**Impact.** Remove PrepaymentDetail and the split path; amount read from a first-party Contract line (needs DM-09, DM-19); add an Invoice 'held for approval' state and letter-template master; the balance run no longer bills a difference. The visible deduction line that nets an issued prepayment off the final invoice stays (US-08.2.2, aligned). Before DM-21.

**Catalogue:** [FT-06.2](../../../../requirements-board/requirements/stories/FT-06.2.md), [FT-06.3](../../../../requirements-board/requirements/stories/FT-06.3.md), [FT-06.4](../../../../requirements-board/requirements/stories/FT-06.4.md), [US-06.2.2](../../../../requirements-board/requirements/stories/US-06.2.2.md), [US-06.3.1](../../../../requirements-board/requirements/stories/US-06.3.1.md), [US-06.3.5](../../../../requirements-board/requirements/stories/US-06.3.5.md), [US-06.3.6](../../../../requirements-board/requirements/stories/US-06.3.6.md), [US-06.4.1](../../../../requirements-board/requirements/stories/US-06.4.1.md), [US-08.2.2](../../../../requirements-board/requirements/stories/US-08.2.2.md), [US-03.1.8](../../../../requirements-board/requirements/stories/US-03.1.8.md), [OQ-92](../../../../requirements-board/requirements/questions/OQ-92.md), [OQ-96](../../../../requirements-board/requirements/questions/OQ-96.md), [OQ-97](../../../../requirements-board/requirements/questions/OQ-97.md), [OQ-80](../../../../requirements-board/requirements/questions/OQ-80.md)

**Prototype:** `aa-prototype/src/domain/types.ts:435`, `aa-prototype/src/store/prepaymentActions.ts:51`, `aa-prototype/src/domain/billing/invoiceBuild.ts:456`, `aa-prototype/src/store/selectors.ts:363`, `aa-prototype/src/domain/warnings/rules/prepaymentUnpaid.ts:1`

## DM-21

### Trust account: prepayment held pending, refunded in full on cancellation, kept when the Booking moves

**Kind:** NewEntity · **Size:** M

**Catalogue says.** Prepayment money is held in AA's trust account as a pending payment and the anaesthetist's payable is not released until the procedure is done. A cancelled Booking's prepayment is refunded to the patient in full from the trust account, recorded as a credit linked to the prepayment invoice, handled by the office. A replacement Booking with another anaesthetist starts its own prepayment at that anaesthetist's price. A prepaid Booking that moves keeps the agreed amount (honour system, no recalculation) and only the payable half of its draft pair is updated to the new anaesthetist; trust payments are made from the system (FT-06.5, US-06.5.1 to US-06.5.4, US-02.5.3, OQ-70, OQ-80).

**Prototype has.** Soft cancel retains the Booking and no fee is charged (cancelBooking lifecycle.ts:348), but no refund. The prepayment payable is released pro-rata as money is received (proRataAuthorised, paymentActions.ts:41) rather than held until the procedure is done. No trust concept and no payee repoint.

**Impact.** A held or released state on the prepayment payable, a release trigger at procedure completion, a refund credit (needs DM-24) and a payable-repoint action called by DM-42. Needs DM-20 and DM-22. Stays Verify in the catalogue; pair timing is OQ-80.

**Catalogue:** [FT-06.5](../../../../requirements-board/requirements/stories/FT-06.5.md), [US-06.5.1](../../../../requirements-board/requirements/stories/US-06.5.1.md), [US-06.5.2](../../../../requirements-board/requirements/stories/US-06.5.2.md), [US-06.5.3](../../../../requirements-board/requirements/stories/US-06.5.3.md), [US-06.5.4](../../../../requirements-board/requirements/stories/US-06.5.4.md), [US-02.5.3](../../../../requirements-board/requirements/stories/US-02.5.3.md), [OQ-70](../../../../requirements-board/requirements/questions/OQ-70.md), [OQ-80](../../../../requirements-board/requirements/questions/OQ-80.md)

**Prototype:** `aa-prototype/src/store/lifecycle.ts:348`, `aa-prototype/src/store/paymentActions.ts:41`, `aa-prototype/src/store/prepaymentActions.ts:51`

## DM-17

### Events on a Procedure (pre-op, post-op, additional invoice, credit) replace the post-op addendum Booking

**Kind:** NewEntity · **Size:** L

**Catalogue says.** An event is anything recorded against a Procedure after it is set up and is its own element attached to it, listed on the Procedure in both apps. Pre-op and post-op events carry their own date and time, record a time or a fixed fee, take no other modifiers, have an 'invoice' tick box and a 'same as the Procedure's billable party' tick. A billable event is its own line item on the Procedure's invoice if that is not yet approved, otherwise a separate invoice in the next run, through one standard review step; the Contract can replace a recorded time with a fixed fee. Covers pain management and ACC pre-op assessments (CS250, CS260, CS70 open) (FT-03.7, US-03.7.1 to US-03.7.3, US-08.6.1, US-05.5.2, OQ-63, OQ-12).

**Prototype has.** A post-op addendum is a new linked Booking (bookingType 'postOpAddendum', addendumOfBookingId; types.ts:373 area) running its own capture, submit, authorise and bill cycle (addPostOpAddendum, bookingActions.ts:290). Late fee lines are BillingLines added before invoicing (addBillingLine, billingLineActions.ts:46). No event record, invoice tick, billable-party tick or same-run versus next-run rule.

**Impact.** New Event entity (procedure, kind, date and time, time or fixed fee, invoiced flag, billable party or same-as, invoice link); replaces the addendum Booking (6 files) and the post-invoice billing-line path; the billing run picks events up; one review step; both apps list them. After DM-10 and DM-08; DM-18 and DM-24 are event kinds.

**Catalogue:** [FT-03.7](../../../../requirements-board/requirements/stories/FT-03.7.md), [US-03.7.1](../../../../requirements-board/requirements/stories/US-03.7.1.md), [US-03.7.2](../../../../requirements-board/requirements/stories/US-03.7.2.md), [US-03.7.3](../../../../requirements-board/requirements/stories/US-03.7.3.md), [US-08.6.1](../../../../requirements-board/requirements/stories/US-08.6.1.md), [US-05.5.2](../../../../requirements-board/requirements/stories/US-05.5.2.md), [FT-08.6](../../../../requirements-board/requirements/stories/FT-08.6.md), [OQ-63](../../../../requirements-board/requirements/questions/OQ-63.md), [OQ-12](../../../../requirements-board/requirements/questions/OQ-12.md)

**Prototype:** `aa-prototype/src/store/bookingActions.ts:290`, `aa-prototype/src/store/billingLineActions.ts:46`, `aa-prototype/src/domain/types.ts:373`, `aa-prototype/src/domain/types.ts:528`

## DM-18

### Additional invoice: a free-form invoice recorded as an event, to any billable party, with its own ledger pair

**Kind:** ChangedEntity · **Size:** L

**Catalogue says.** An admin (any Procedure) or the anaesthetist (their own Procedure) presses a button against a Procedure's Contract line to add a free-form invoice (per line description, quantity, amount; no Contract or unit rules) to any billable party. It is traceable both ways to the original Procedure and invoice, recorded as an event, goes through the standard review step, and has its own invoice number, ledger pair, Xero pair and anaesthetist payable. Uses: late post-op charges, extra work after prepaid or fixed-price work, splitting a combined Procedure (after invoicing: credit note then additional invoices that total the credited amount; split before sending is OQ-77 part 3) (US-08.6.1, US-08.6.3, US-08.6.4, US-08.4.3, US-11.3.3 for re-send).

**Prototype has.** Invoice.kind 'standard' | 'prePayment' (types.ts:680) with a bookingId and no link to an original invoice or Procedure; priced lines only (InvoiceLine.procedureId optional, types.ts:688). No free-form entry and no second-invoice lineage.

**Impact.** Invoice.kind widens (additional, credit note), with originalInvoiceId and procedureId; free-form line entry UI in both apps; same pair creation and Xero handoff as any invoice. Needs DM-17 and DM-22.

**Catalogue:** [US-08.6.1](../../../../requirements-board/requirements/stories/US-08.6.1.md), [US-08.6.3](../../../../requirements-board/requirements/stories/US-08.6.3.md), [US-08.6.4](../../../../requirements-board/requirements/stories/US-08.6.4.md), [US-08.4.3](../../../../requirements-board/requirements/stories/US-08.4.3.md), [FT-08.6](../../../../requirements-board/requirements/stories/FT-08.6.md), [US-11.3.3](../../../../requirements-board/requirements/stories/US-11.3.3.md), [OQ-72](../../../../requirements-board/requirements/questions/OQ-72.md), [OQ-77](../../../../requirements-board/requirements/questions/OQ-77.md)

**Prototype:** `aa-prototype/src/domain/types.ts:672`, `aa-prototype/src/domain/types.ts:688`, `aa-prototype/src/domain/billing/invoiceBuild.ts:264`

## DM-24

### A wrong invoice is credited in full then rebilled; the payable is reversed by a negative invoice

**Kind:** NewLifecycle · **Size:** L

**Catalogue says.** An invoice is never edited, retracted or partly adjusted: it is credited in full (to any party, the original billable party included) and a new corrected invoice raised, each traceable to the original; the ledger payable and the Xero pair are reversed and re-created together. The reversal is a negative invoice to the anaesthetist, netted in their next payment run and shown on the remittance advice. A credit note is not a refund. The rebill may start from a draft copy of the original's lines. With no later payment to net against it is handled outside the system. Credit and new invoices are events on the Procedure (US-08.6.2, US-08.6.5, US-08.6.6, US-10.2.5, US-06.5.2, OQ-28, OQ-42, OQ-71, OQ-72, OQ-77).

**Prototype has.** Nothing: no credit note, no negative payable, no rebill; invoices are immutable once raised and BillingCase moves only pending to disbursed or failed (types.ts:697-707). The word 'negative invoice' appears only in validator comments.

**Impact.** CreditNote entity linked to its invoice, a negative payable record and Xero credit mirroring, rebill-from-copy action, new BillingCase states. Needs DM-18 and DM-22; precedes DM-25 and DM-21's refund.

**Catalogue:** [US-08.6.2](../../../../requirements-board/requirements/stories/US-08.6.2.md), [US-08.6.5](../../../../requirements-board/requirements/stories/US-08.6.5.md), [US-08.6.6](../../../../requirements-board/requirements/stories/US-08.6.6.md), [US-10.2.5](../../../../requirements-board/requirements/stories/US-10.2.5.md), [US-06.5.2](../../../../requirements-board/requirements/stories/US-06.5.2.md), [FT-08.6](../../../../requirements-board/requirements/stories/FT-08.6.md), [OQ-28](../../../../requirements-board/requirements/questions/OQ-28.md), [OQ-42](../../../../requirements-board/requirements/questions/OQ-42.md), [OQ-71](../../../../requirements-board/requirements/questions/OQ-71.md), [OQ-72](../../../../requirements-board/requirements/questions/OQ-72.md)

**Prototype:** `aa-prototype/src/domain/types.ts:697`, `aa-prototype/src/domain/types.ts:707`, `aa-prototype/src/store/billingRun.ts:68`

## DM-22

### The internal ledger holds both halves of each pair as its own records, with the payable independent of Xero

**Kind:** ChangedEntity · **Size:** L

**Catalogue says.** For every invoice the engine creates a linked receivable from the billable party and payable to the anaesthetist in its own ledger, the system of record, which Xero only mirrors as an ACCREC and a draft ACCPAY created together; the ledger tracks money in and money out per patient and per anaesthetist and survives Xero contact archiving. Invoices are presented in the anaesthetist's name with AA as agent and a unique invoice number; the payable carries the receivable's number with a '-P' suffix; each payable is a buyer-created tax invoice (new IRD name to confirm), one per procedure (FT-08.3, US-08.3.1 to US-08.3.4, US-08.4.3, US-08.4.5, US-09.1.1, US-09.1.4, US-10.1.2, EP-08, OQ-29).

**Prototype has.** The ledger is the billing slice (Invoice, InvoiceLine, BillingCase with receivedAmount, authorisedAmount, disbursedAmount and Xero ids; types.ts:672-760), which the code calls a mirror and the apps read instead of Xero. The payable document and its amounts exist only as XeroAccPay in the Xero simulation (types.ts:790), so the payable has no ledger record of its own; no '-P' numbering and no buyer-created tax invoice wording.

**Impact.** Promote the Payable into the ledger (id, number, amount, authorised, disbursed, status, anaesthetist) with Xero downstream; split BillingCase into receivable and payable sides; rewire payments, payables run, selectors and the Xero view. Foundation for DM-21, DM-18, DM-24, DM-23, DM-25 and DM-26.

**Catalogue:** [FT-08.3](../../../../requirements-board/requirements/stories/FT-08.3.md), [US-08.3.1](../../../../requirements-board/requirements/stories/US-08.3.1.md), [US-08.3.2](../../../../requirements-board/requirements/stories/US-08.3.2.md), [US-08.3.3](../../../../requirements-board/requirements/stories/US-08.3.3.md), [US-08.3.4](../../../../requirements-board/requirements/stories/US-08.3.4.md), [US-08.4.3](../../../../requirements-board/requirements/stories/US-08.4.3.md), [US-08.4.5](../../../../requirements-board/requirements/stories/US-08.4.5.md), [US-09.1.1](../../../../requirements-board/requirements/stories/US-09.1.1.md), [US-09.1.4](../../../../requirements-board/requirements/stories/US-09.1.4.md), [US-10.1.2](../../../../requirements-board/requirements/stories/US-10.1.2.md), [OQ-29](../../../../requirements-board/requirements/questions/OQ-29.md)

**Prototype:** `aa-prototype/src/domain/types.ts:707`, `aa-prototype/src/domain/types.ts:790`, `aa-prototype/src/store/xeroHandoff.ts:153`, `aa-prototype/src/store/paymentActions.ts:78`, `aa-prototype/src/store/payablesActions.ts:146`

## DM-23

### Derived ledger positions for the whole ledger, per anaesthetist and per patient; flat outstanding list without ageing; patient balance alerts

**Kind:** NewRelationship · **Size:** M

**Catalogue says.** The Admin App shows the ledger's position at two scopes, the whole ledger (receivables outstanding, receipts held, payables due, amounts disbursed, any imbalance) and a single anaesthetist, and a patient's outstanding invoices across all anaesthetists, patient-centric even when a guardian pays (FT-13.2, US-13.2.1, US-13.2.2, US-08.3.5, US-11.3.1). The anaesthetist's outstanding list is flat, oldest first, with no ageing buckets or age chips (US-12.2.1). Booking or matching a patient with a balance alerts staff: mild below the threshold (90 days from invoice date, admin-changeable), strong above, mild for a credit balance, never a block; follow-up actions and invoice re-send are recorded (US-11.3.2, US-11.3.3, OQ-41, OQ-74).

**Prototype has.** A per-anaesthetist outstanding list built per ACCPAY invoice with agingDays and a bucket (selectors.ts:584-640, AgingBuckets), which the catalogue now excludes. A boolean patientHasOutstandingPriorEpisode intake check (selectors.ts:280), surfaced as a 'Prior balance' flag in the billing monitor (BillingMonitorScreen.tsx:200); no threshold or mild and strong. No admin whole-ledger, per-anaesthetist or per-patient balance screen (admin screens are billing monitor, integration monitor, invoices, review, master data, audit); no follow-up record.

**Impact.** New selectors (pure over the ledger) and three admin views; remove the ageing buckets from the web Accounts and dashboard screens; threshold in appSettings; FollowUpAction record. Needs DM-22 and DM-11; the alert rule lands in DM-31.

**Catalogue:** [FT-13.2](../../../../requirements-board/requirements/stories/FT-13.2.md), [US-13.2.1](../../../../requirements-board/requirements/stories/US-13.2.1.md), [US-13.2.2](../../../../requirements-board/requirements/stories/US-13.2.2.md), [US-08.3.5](../../../../requirements-board/requirements/stories/US-08.3.5.md), [US-12.2.1](../../../../requirements-board/requirements/stories/US-12.2.1.md), [FT-11.3](../../../../requirements-board/requirements/stories/FT-11.3.md), [US-11.3.1](../../../../requirements-board/requirements/stories/US-11.3.1.md), [US-11.3.2](../../../../requirements-board/requirements/stories/US-11.3.2.md), [US-11.3.3](../../../../requirements-board/requirements/stories/US-11.3.3.md), [OQ-41](../../../../requirements-board/requirements/questions/OQ-41.md), [OQ-74](../../../../requirements-board/requirements/questions/OQ-74.md), [OQ-59](../../../../requirements-board/requirements/questions/OQ-59.md)

**Prototype:** `aa-prototype/src/store/selectors.ts:584`, `aa-prototype/src/store/selectors.ts:280`, `aa-prototype/src/domain/dateDays.ts:1`

## DM-25

### Weekly payment cycle with period approval of BCTIs and a remittance advice that nets negative invoices

**Kind:** NewEntity · **Size:** M

**Catalogue says.** A payable is released when its receivable is paid, for exactly the amount received. Payments run on a weekly cycle named by ISO week: Friday the ledger is closed and snapshotted, Monday for the office to clear problems, Tuesday the schedule of released payables goes to the accountant, anomalies roll into the next cycle; a payment is shown against its week number. BCTIs for a period are approved for payment before the run (who approves is open). The anaesthetist's remittance advice shows invoices paid and negative invoices netted (US-10.2.1, US-10.2.5, US-10.2.6, US-10.2.7, US-10.2.4, OQ-47).

**Prototype has.** runPayables (payablesActions.ts:146) pays every authorised-minus-disbursed amount at once under a payablesRunId (Disbursement, types.ts:819). No cycle or week identity, no approval state, no held-out anomalies, no remittance advice, no netting.

**Impact.** PaymentRun entity (ISO week, status, held-out items), an approval state on payables, a remittance document, and netting of negative payables. Needs DM-24 and DM-22. Proposed in the catalogue, so keep it replaceable.

**Catalogue:** [US-10.2.1](../../../../requirements-board/requirements/stories/US-10.2.1.md), [US-10.2.5](../../../../requirements-board/requirements/stories/US-10.2.5.md), [US-10.2.6](../../../../requirements-board/requirements/stories/US-10.2.6.md), [US-10.2.7](../../../../requirements-board/requirements/stories/US-10.2.7.md), [US-10.2.4](../../../../requirements-board/requirements/stories/US-10.2.4.md), [FT-10.2](../../../../requirements-board/requirements/stories/FT-10.2.md), [OQ-47](../../../../requirements-board/requirements/questions/OQ-47.md)

**Prototype:** `aa-prototype/src/store/payablesActions.ts:146`, `aa-prototype/src/domain/types.ts:819`, `aa-prototype/src/store/paymentActions.ts:41`

## DM-26

### AA fee is a separate monthly invoice from AA to each anaesthetist, not a percentage deducted from the payable

**Kind:** NewEntity · **Size:** M

**Catalogue says.** At month end AA raises one fee invoice to each anaesthetist from fee settings: fixed charges (several items) plus a charge per BCTI issued in the month (for example $500 + $5 x 40 = $700), generated by one monthly run and tracked in the ledger separately from any procedure's receivable and payable; Greg's view is that it never nets against payables and counts only paid invoices (OQ-60 open). The anaesthetist sees them and their payment status (FT-10.3, US-10.3.1, US-10.3.2, US-10.3.3, OQ-02, OQ-60).

**Prototype has.** An illustrative 5% AA service fee deducted from the ACCPAY: AA_SERVICE_FEE_RATE (agencyFee.ts:7), snapshotted on XeroAccPay as serviceFeeRate, serviceFeeAmount and net amountPayable (types.ts:790-808; xeroHandoff.ts:270), labelled 'prototype assumption only'.

**Impact.** Remove the deduction (payable equals receivable value, which changes seeded amounts and the Xero view), add FeeSettings and FeeInvoice entities, a monthly run action and an anaesthetist view. Needs DM-22.

**Catalogue:** [FT-10.3](../../../../requirements-board/requirements/stories/FT-10.3.md), [US-10.3.1](../../../../requirements-board/requirements/stories/US-10.3.1.md), [US-10.3.2](../../../../requirements-board/requirements/stories/US-10.3.2.md), [US-10.3.3](../../../../requirements-board/requirements/stories/US-10.3.3.md), [EP-10](../../../../requirements-board/requirements/stories/EP-10.md), [OQ-02](../../../../requirements-board/requirements/questions/OQ-02.md), [OQ-60](../../../../requirements-board/requirements/questions/OQ-60.md)

**Prototype:** `aa-prototype/src/domain/billing/agencyFee.ts:7`, `aa-prototype/src/domain/types.ts:790`, `aa-prototype/src/store/xeroHandoff.ts:270`

## DM-29

### GST schedule is on a cash basis of payables actually paid, not of amounts received

**Kind:** RuleChange · **Size:** S

**Catalogue says.** Each anaesthetist gets a GST schedule aligned to their own GST period showing the sales AA made for them, the GST component of each, and a check that it balances with what they were paid. It is on a cash basis: only payables AA actually paid in the period are listed; anything outstanding falls into a later period (US-12.2.2, EP-12). All prices are held exclusive of GST (US-05.2.7).

**Prototype has.** BillingReceipt carries a GST component of amounts received into AA (gross x 0.15/1.15; types.ts:752, paymentActions.ts:32); the web Accounts screen's GST report reads those receipts; GST_RATE is a module constant (invoiceBuild.ts).

**Impact.** Re-base the report on disbursements (the payable's paid side from DM-22) and group by the anaesthetist's GST period. Small; follows DM-22.

**Catalogue:** [US-12.2.2](../../../../requirements-board/requirements/stories/US-12.2.2.md), [US-12.1.2](../../../../requirements-board/requirements/stories/US-12.1.2.md), [US-05.2.7](../../../../requirements-board/requirements/stories/US-05.2.7.md), [EP-12](../../../../requirements-board/requirements/stories/EP-12.md)

**Prototype:** `aa-prototype/src/domain/types.ts:752`, `aa-prototype/src/store/paymentActions.ts:32`, `aa-prototype/src/apps/web/screens/AccountsScreen.tsx:43`

## DM-31

### Warning routine: more rules, an admin to-do list and a Booking flag in both apps (one rule is built)

**Kind:** ChangedEntity · **Size:** M

**Catalogue says.** One routine checks Bookings and raises warnings, several per Booking, of a before- or after-procedure kind and mild or strong, which never block: unpaid prepayment, a billable patient with a balance, a child as payer, base units outside the RVG range, an insurer-will-pay Booking with no insurer Contract (office review). They show on the admin dashboard as a to-do list where an admin clears them (optional for mild), and as a small warning triangle on the Booking in both apps, clearly visible when the anaesthetist opens it, with no confirm step on submit. Settings for thresholds and switching checks off are Future (FT-13.7, US-13.7.1 to US-13.7.3, US-07.2.2, US-13.7.4).

**Prototype has.** Built in Phase 15a: Warning, WarningRule, WarningClearance and AppSettings (warnings/types.ts), derived warnings with one registered rule 'prepaymentUnpaid', a stored office clearance outside the Booking, and rule parameters in appSettings. The Booking flag exists in the shared booking detail; no admin dashboard to-do list screen reads openWarnings.

**Impact.** The model is right; the work is adding rules as their source entities land (DM-11 child payer, DM-12 insurer without Contract, DM-43 out-of-range units, DM-23 patient balance) and the dashboard to-do screen. Each new rule widens WarningRuleId.

**Catalogue:** [FT-13.7](../../../../requirements-board/requirements/stories/FT-13.7.md), [US-13.7.1](../../../../requirements-board/requirements/stories/US-13.7.1.md), [US-13.7.2](../../../../requirements-board/requirements/stories/US-13.7.2.md), [US-13.7.3](../../../../requirements-board/requirements/stories/US-13.7.3.md), [US-11.3.2](../../../../requirements-board/requirements/stories/US-11.3.2.md), [US-11.2.4](../../../../requirements-board/requirements/stories/US-11.2.4.md), [US-03.3.1](../../../../requirements-board/requirements/stories/US-03.3.1.md), [US-07.2.2](../../../../requirements-board/requirements/stories/US-07.2.2.md), [US-06.3.2](../../../../requirements-board/requirements/stories/US-06.3.2.md)

**Prototype:** `aa-prototype/src/domain/warnings/types.ts:20`, `aa-prototype/src/store/warnings.ts:111`, `aa-prototype/src/domain/warnings/rules/prepaymentUnpaid.ts:1`, `aa-prototype/src/shared/booking/BookingDetailBody.tsx:1`

## DM-45

### Audit covers invoices and credit notes but not disbursements, payments or receipts

**Kind:** RuleChange · **Size:** S

**Catalogue says.** The audit trail shows who or what made every change: creates, updates, reassignments, authorisations, invoices and credit notes. Greg: not disbursements, payments or receipts, which are done in Xero; how deep the audit goes is for the developers (US-13.5.2).

**Prototype has.** Every mutation is audited through mutate(), including simulated Xero payments and disbursements (paymentActions.ts:188-195 'xero.paymentReceived' and 'xero.accpayAuthorised'; payablesActions.ts:131 'xero.disbursed').

**Impact.** Not a model gap: the prototype audits a superset of what the catalogue lists, so nothing has to change. A policy note rather than a rebuild: audit stays uniform in the demo, or payment and disbursement entries are filtered out of the audit viewer. Credit notes (DM-24) must be audited.

**Catalogue:** [US-13.5.2](../../../../requirements-board/requirements/stories/US-13.5.2.md), [FT-13.5](../../../../requirements-board/requirements/stories/FT-13.5.md), [domain-model.md](../../../../requirements-board/requirements/domain-model.md)

**Prototype:** `aa-prototype/src/store/paymentActions.ts:188`, `aa-prototype/src/store/payablesActions.ts:131`, `aa-prototype/src/store/mutate.ts:1`

## DM-38

### Reference data: a master public-holiday calendar, spreadsheet-loaded masters and an optional Contract schedule upload

**Kind:** ChangedEntity · **Size:** M

**Catalogue says.** Admins maintain all reference data in one place: hospitals with contact email, surgeons and surgeon groups, rooms, insurers, anaesthetists, Slot statuses, recurring bookings, the master public-holiday calendar and each hospital's own calendar, RVG groups, modifiers and Contracts. It is loaded once from controlled spreadsheets (repeatable for test systems, rows failing validation reported), then edited by hand, every change recorded; Solutions Plus supplies operation names only; clean cut, no migration. A Contract schedule upload (one approved format, checked by a second person) sits in the Future Work lane (US-04.2.13), first-release need open (OQ-100) (US-13.4.1 to US-13.4.3, US-04.2.13, FT-13.4, OQ-100).

**Prototype has.** Master Data screen with partial CRUD for hospitals, insurer direct-claims flag, anaesthetists, hospital holidays, permanent lists and Contracts (mastersActions.ts, contractActions.ts); holidays are per hospital only (types.ts:612) with no master calendar; seed data are TypeScript fixtures, not spreadsheets; List statuses view-only; no schedule upload.

**Impact.** CRUD for the new masters (DM-13 to DM-49, DM-04, DM-54, DM-32), a master holiday calendar feeding each hospital's, and optionally a CSV load script for seeds. The Contract upload preview is Future Work and out of the first-release model. Mostly follows the entity deltas.

**Catalogue:** [US-13.4.1](../../../../requirements-board/requirements/stories/US-13.4.1.md), [US-13.4.2](../../../../requirements-board/requirements/stories/US-13.4.2.md), [US-13.4.3](../../../../requirements-board/requirements/stories/US-13.4.3.md), [US-04.2.13](../../../../requirements-board/requirements/stories/US-04.2.13.md), [FT-13.4](../../../../requirements-board/requirements/stories/FT-13.4.md), [US-01.5.1](../../../../requirements-board/requirements/stories/US-01.5.1.md), [OQ-100](../../../../requirements-board/requirements/questions/OQ-100.md)

**Prototype:** `aa-prototype/src/store/mastersActions.ts:45`, `aa-prototype/src/domain/types.ts:612`, `aa-prototype/src/apps/admin/screens/MasterData.tsx:38`
