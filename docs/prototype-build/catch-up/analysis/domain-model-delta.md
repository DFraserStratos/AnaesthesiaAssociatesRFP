# Data-model delta: catalogue vs prototype

Read-only comparison of the entity, relationship and lifecycle model the requirements catalogue now describes (see [domain-model.md](../../../../requirements-board/requirements/domain-model.md), updated through 2026-10-19 with the board edits of 2026-10-20) with what `aa-prototype/` implements at HEAD (PERSIST_VERSION 25, after catch-up Phases 14 to 17 and 28 to 32). The code is treated as the truth about the prototype; the old build docs were used only as leads. Retired items and items in the Future Work lane are excluded except as boundary references that explain a removal; item statuses were otherwise ignored, because the status scheme was recoded since the last pass.

This pass (catalogue commit d4db277, from 60e2d1e) updates the earlier one. Two things moved the picture. First, the requirements changed again, in the 14, 16 and 19 October meetings: there is **no procedure list** (the RVG groups are the one master list), **prepayment is triggered by a Contract flag and its money goes to a prepay holding account** (the anaesthetist's prepaid setting and GST period are Retired), pricing is **one rule on values held on the Procedure** with a per-Contract editable flag and no reason for changes, the contract holder gained a practitioner link and an is-billed setting, Contract changes are staged and versioned with a single future-dated version, the NHI is mandatory, an anaesthetist can edit a SUBMITTED List until it is authorised, and notices are resolved by a tick. Second, the prototype's **Schedule track is built** (Phases 28 to 32, with 15b, 16 and 17): the Slot and List split, ACTIVE and Draft Lists, the slot-status master and availability series, recurring bookings, own-List moves with a notification pool, surgeons' rooms and preferences, and the AA fee invoice.

**DM ids are stable.** Each delta that continues an earlier one keeps its id, even where the reading moved (the title and body say how); new deltas take DM-55 to DM-57. Earlier ids with no open delta now: DM-02 built in Phase 28: the Slot is stored (Slot, types.ts:530) and a List sits in it through slotId (AssignedList, :673); the day-as-parent is a storage choice the catalogue leaves to the developers (OQ-64); DM-52 built in Phases 15b and 31: ListState DRAFT, ACTIVE, SUBMITTED, AUTHORISED with DRAFT meaning no anaesthetist (types.ts:59, DraftList :691, detachListToDraft); DM-03 built in Phase 31: Draft Lists (draftListActions.ts:86 to :299, DraftListsScreen); the one source not yet emitting is a matching-screen row (origin hospitalRow), which arrives with DM-34; DM-04 built in Phase 29: Slot status is user-maintained master data (SlotStatus types.ts:1012, slotStatusActions.ts) kept from one availability calendar with series (AvailabilitySeries :1048). The private, public and pre-op List kinds stay as a prototype-only attribute (listed below); DM-05 built in Phase 32: the anaesthetist moves their own List to the office or a colleague with no confirmation, with the vacated-Slot question (listMoveActions.ts:208 to :240, MoveListSheet) and marking a Slot unavailable forces return or assign (availabilityActions.ts:161). The office-sickness remainder is DM-56; DM-53 built in Phase 30: the Permanent List is the recurring booking (RecurringBooking types.ts:953) and one landing on an unavailable Slot becomes a Draft List (DraftOrigin recurringClash); DM-54 built in Phase 17: private two-way pairing preferences and the admin-only priority tier in an office-only slice (OfficePrivateSlice types.ts:332, store/officePrivate.ts), with a seeded shuffle (shell.suggestionSeq); DM-26 built in Phase 16: no fee is deducted from a payable and AA fee settings, monthly fee invoices and their ledger case exist (AaFeeInvoice types.ts:1335, aaFeeActions.ts). Whether only paid BCTIs count is OQ-60, not a model gap; DM-39 built in Phase 15b: copy a Booking and the photo source are gone (BookingSource types.ts:742; no copiedFromBookingId); DM-19 dropped, the reading was reversed: the prepaid-procedures setting on the anaesthetist profile is Retired (FT-06.1, US-06.1.1, US-06.1.2, US-12.1.3); prepayment is triggered by a Contract flagged as prepaid, which lands in DM-07 (the flag) and DM-20 (the trigger). From earlier passes: DM-01 closed (Card to Booking, Phase 15); DM-06 merged into DM-42; DM-27 merged into DM-22; DM-33 merged into DM-32; DM-36 dropped; DM-37 merged into DM-10; DM-40 dropped (no estimated duration); DM-47 merged into DM-23. DM-31 keeps the warning routine, now with only its rules left. Sizes: S under a day, M a day or two, L several days, XL a week or more including seed, screens and tests; the size counts the ripple, not just the type edit.

**Summary.** 39 structural deltas open (was 46). By kind: NewEntity 10, ChangedEntity 13, ChangedRelationship 2, RuleChange 7, RemovedEntity 1, NewLifecycle 2, ChangedLifecycle 3, NewRelationship 1. By size: XL 2, L 15, M 18, S 4. Ten earlier deltas are closed or dropped (nine built, DM-19 reversed) and three are new (DM-55, DM-56, DM-57). No build has touched the pricing track, and the money track only through the AA fee invoice; the schedule track shrinks to DM-42, DM-41, DM-34, DM-35, DM-55, DM-56 and DM-32.

**Verification pass.** An adversarial re-read of every delta against the catalogue (scope checked: each cited item is neither Retired nor in the Future Work lane, except where the delta names it as a boundary) and against the code. All 39 survived; none was dropped. Corrected: DM-24 (the BillingCase status set was misdescribed: it has seven statuses but no credited or reversed one), DM-45 (reframed as a policy note, not a structural gap), DM-29 (gstPeriod is read by 10 non-test files, not 11) and DM-16 (the email stamp is at billingRun.ts:411). Re-checked against code and upheld: DM-55 (editRefusal refuses an anaesthetist on a SUBMITTED List, lifecycle.ts:70 to :72; the forward views key on billedAtISO, selectors.ts:390), DM-56 (applySessionWrites leaves an office-recorded sickness with the availability conflict, availabilityActions.ts:190), DM-30 (upsertPatient accepts a blank NHI, intake.ts:52), DM-41 and DM-32 (Notification has no resolved state; Anaesthetist has no bank fields). No missed structural delta found: the rest of the domain model (Slot, List, Draft List, recurring bookings, preferences and tiers, hospital and room contacts, AA fee invoice, ex-GST pricing, per-Booking billing failure) matches the code.

## Suggested order

Two tracks share only Booking and Procedure and join at DM-34 and DM-42's notice. The Schedule track already ran ahead of Contracts, so what is left of it is mostly independent.

- **Pricing track.** DM-13 (RVG groups) then DM-48, DM-07, DM-09 and DM-49 together (holder, dated Contract with its flags, lines, No contract (RVG)), then DM-10 (one Contract and line per Procedure, no route). DM-43, DM-14, DM-44, DM-15 and DM-50 follow DM-10 (DM-50 needs DM-09 and DM-14; DM-15 needs DM-44); DM-51 pairs with DM-13; DM-16 and DM-57 ride alongside DM-07; DM-11 (payer) needs DM-48 and DM-10, then DM-12 and DM-28; DM-08 (snapshot at AUTHORISED) closes the track. DM-46 (BillingLine removal) waits for DM-17.
- **Money track.** DM-22 (payable in the ledger) first; DM-20 (prepaid Contract trigger) needs DM-07, DM-09 and DM-11; DM-21 (holding account) needs DM-20 and DM-22; DM-17 then DM-18 then DM-24; DM-23, DM-25 and DM-29 need DM-22 (DM-25 also DM-24).
- **Schedule, remaining.** DM-34 needs DM-51 and DM-30; DM-35 needs DM-41; DM-42 (Phase 32a) needs DM-41 for its optional notice.
- **Free-standing, small.** DM-55, DM-56, DM-32, DM-30, DM-38, DM-45 and DM-41 can go at any time. DM-31 absorbs a rule as each source entity lands (DM-43, DM-11, DM-12, DM-23).

Every model change that alters the seed shape needs a PERSIST_VERSION bump (currently 25; CLAUDE.md still says 13).

## Already aligned, no delta

Verified in code: DRAFT to SUBMITTED to AUTHORISED guards with no Returned state and an immutable AUTHORISED List (lifecycle.ts:50, :275, :362; the anaesthetist edit window after submit is now DM-55); soft cancel that keeps the Booking and charges no fee (lifecycle.ts:362); per-Booking billing failure that holds the whole Booking while the List's others bill (billingRun.ts:69); one invoice per distinct billable party per Booking (invoiceBuild.ts:264); ACCREC plus draft ACCPAY pair with independent received and disbursed amounts and pro-rata release (payableRelease.ts:16; the holding-account payee is DM-21); the NHI never sent to Xero and dual-format NHI validation (nhi.ts), with the hidden internal ID now an implementation detail the catalogue allows; Xero contact archiving; per-anaesthetist unit value; tiered time units with part intervals rounded up (timeUnits.ts:13); per-hospital holiday calendar with a soft closure conflict; recurring bookings painted after the anaesthetist's calendar (Phases 28 and 30); derived warnings with a stored clearance and no gate, and the to-do list (Phases 15a and 15a2); List attachments and an optional display-only Booking.source (Phase 15); roles anaesthetist, office and system. Built since the last pass and now aligned: the Slot and List split, ACTIVE and Draft Lists, the slot-status master and availability series, the own-List move and its notification pool, surgeons' rooms, surgeon profile, preferences and tiers, the AA fee invoice, and the removal of copy and photo Bookings.

## Prototype-only, no catalogue home (keep as demo, not model deltas)

DayNote (types.ts:1075), seeded anaesthetist dashboard figures, XeroVolumeStory and DemoSettings (types.ts:1426, :1438), ListPhoneNote (types.ts:516), and the simulated HL7 and FHIR transport with per-feed field mapping and message log (types.ts:1374 to :1414), which serve FT-14.1 and FT-14.2 (both Future) and become a demo of the later integration, not part of the first-release model (see DM-34). Also: ListKind private, public and pre-op as a List attribute (types.ts:113; the catalogue models no List kind, and whether the colours survive as kinds is not stated), the SlotStatus fields bookable, anaesthetistCanSet and treatment (types.ts:1012), and the AA rooms location type (US-01.3.3 mentions AA's rooms for the pre-op clinic).

## Catalogue points that contradict each other (for the owner; the deltas follow the more specific item)

- **Included modifiers.** [US-03.3.4](../../../../requirements-board/requirements/stories/US-03.3.4.md) says an included modifier shows 'as a pill selected at 0 units that cannot be unselected', while [US-05.1.4](../../../../requirements-board/requirements/stories/US-05.1.4.md), [US-05.1.5](../../../../requirements-board/requirements/stories/US-05.1.5.md) and the domain model (Donald, 20 October) say none is locked and the anaesthetist can remove it. DM-44 follows the not-locked reading.
- **Where the insurer sits.** [US-11.4.3](../../../../requirements-board/requirements/stories/US-11.4.3.md) and the domain model hold the insurer and approval number on the Booking; the v6 design holds an insurer and an 'insurance acceptance' reference on the booking procedure; [OQ-93](../../../../requirements-board/requirements/questions/OQ-93.md) is open. DM-12 follows the Booking.
- **Relinking versus the lock.** [US-04.2.10](../../../../requirements-board/requirements/stories/US-04.2.10.md) relinks un-invoiced Procedures to a new Contract version on submit, while [US-04.3.5](../../../../requirements-board/requirements/stories/US-04.3.5.md) locks the version at AUTHORISED; its own note says the v6 text does not say how they meet. DM-08 lets the lock win once a List is AUTHORISED.
- **Insurer flag.** [FT-11.4](../../../../requirements-board/requirements/stories/FT-11.4.md) and [US-11.4.1](../../../../requirements-board/requirements/stories/US-11.4.1.md) still give each insurer accepts-direct-claims, while [US-04.1.5](../../../../requirements-board/requirements/stories/US-04.1.5.md) puts an is-billed setting on each holder ([OQ-114](../../../../requirements-board/requirements/questions/OQ-114.md)). DM-48 keeps the flag as information until it is answered.
- **Prepayment netting.** [US-08.2.2](../../../../requirements-board/requirements/stories/US-08.2.2.md) deducts the prepayment from the final invoice, while [US-06.4.1](../../../../requirements-board/requirements/stories/US-06.4.1.md) and [US-06.5.1](../../../../requirements-board/requirements/stories/US-06.5.1.md) pay the anaesthetist from the holding account in place of another invoice; [OQ-116](../../../../requirements-board/requirements/questions/OQ-116.md) asks whether mixed Bookings still deduct. DM-20 keeps the deduction line for mixed Bookings only.
- **Cash refunds and payments.** [US-06.5.1](../../../../requirements-board/requirements/stories/US-06.5.1.md) and [US-06.5.2](../../../../requirements-board/requirements/stories/US-06.5.2.md) refund from the system, earlier notes said in Xero ([OQ-115](../../../../requirements-board/requirements/questions/OQ-115.md)); [US-09.2.4](../../../../requirements-board/requirements/stories/US-09.2.4.md) has the anaesthetist paid in Xero's payables run while trust payments are made from the system ([OQ-111](../../../../requirements-board/requirements/questions/OQ-111.md)). DM-21 and DM-25 build the ledger side, which is the same either way.
- **Anaesthetist edit window.** The v6 design says the anaesthetist may change the Contract 'before the list is submitted'; [US-03.4.1](../../../../requirements-board/requirements/stories/US-03.4.1.md) and [FT-03.4](../../../../requirements-board/requirements/stories/FT-03.4.md) follow Donald and Greg (until AUTHORISED). DM-10 and DM-55 follow the catalogue.

## Index

| ID | Kind | Title | Size |
| --- | --- | --- | --- |
| [DM-13](#dm-13) | ChangedEntity | The RVG group becomes the one master list (hidden key, type-ahead rows, modifier units, AA groups); there is no procedure list | L |
| [DM-48](#dm-48) | NewEntity | The contract holder becomes a master record (insurer, hospital, surgeon or rooms, anaesthetist; AA holds No contract) with an is-billed flag, a billable party and a practitioner link | L |
| [DM-07](#dm-07) | ChangedEntity | The Contract becomes a series of dated versions with an AA code and behaviour flags; Type 1/2/3, scope, the default per holder and the Method 3 gate go | XL |
| [DM-09](#dm-09) | ChangedEntity | The Contract line (standalone, carrying only what it sets, with a system line key) replaces ContractPrice | L |
| [DM-49](#dm-49) | ChangedEntity | One stored No contract (RVG), held by AA and never billed, replaces the protected default Type 1 per hospital and direct-billing insurer | M |
| [DM-10](#dm-10) | ChangedRelationship | Each Procedure selects one Contract and, where it has lines, one line at booking setup; the billing route and billing-time Contract resolution disappear | XL |
| [DM-43](#dm-43) | RuleChange | Starting units come from the Contract line, then the RVG group, and become the Procedure's own values; any value is accepted and an out-of-range one only warns | M |
| [DM-50](#dm-50) | RuleChange | Pricing is one rule on values held on the Procedure: its price, else (base + time + modifier) x rate x (1 - discount); Type 2/3 pricing goes | L |
| [DM-14](#dm-14) | ChangedEntity | Price changes become edits of the Procedure's own price, rate and discount: the anaesthetist where the Contract is editable, the office on any Contract, no reason, last change stands | M |
| [DM-44](#dm-44) | NewEntity | Modifiers become per-Procedure records, each claimed one with an explanation; age and included modifiers are pre-applied but not locked; ASA is just a modifier | L |
| [DM-15](#dm-15) | RuleChange | Multi-procedure rule: one primary flag, time on every procedure, modifier units split above four, no Contract-specific ordinals | M |
| [DM-46](#dm-46) | RemovedEntity | The BillingLine entity, rate x time billing and the Method 3 gate are removed; other late lines become events | L |
| [DM-08](#dm-08) | NewLifecycle | Authorising a List snapshots each Procedure's Contract version, line and pricing values; the billing engine reads the snapshot | L |
| [DM-16](#dm-16) | ChangedEntity | The Contract carries invoice layout, delivery method, GST treatment and the holder references a Booking must supply | S |
| [DM-51](#dm-51) | NewEntity | Each Procedure keeps the text exactly as received from each source, the rooms' and the hospital's apart, plus a separate invoice description | M |
| [DM-11](#dm-11) | ChangedRelationship | Who is billed: the Contract's holder or the payer named on the Booking, replacing the per-Procedure billable-party override and the billing routes | L |
| [DM-28](#dm-28) | ChangedEntity | Splitting a Procedure's fee between payers is a Booking action with typed $ or % shares, not a line-level funder override | M |
| [DM-12](#dm-12) | NewEntity | The Booking carries the insurer and the insurance approval number, recorded by the office; insurance guides the Contract but never decides who is billed | S |
| [DM-30](#dm-30) | RuleChange | The NHI is mandatory with no blank: a Booking cannot be saved without one, and an incoming row without one waits at intake | M |
| [DM-42](#dm-42) | ChangedLifecycle | A single Booking moves to a colleague by creating a List in the colleague's free Slot; whoever submits a List did its procedures | M |
| [DM-41](#dm-41) | ChangedEntity | The shared notification pool gains an active or resolved state with who and when, and a second source: an anaesthetist's 'ask the office to check' | M |
| [DM-32](#dm-32) | ChangedEntity | The anaesthetist profile holds bank account details (the rest of the master data is built) | S |
| [DM-34](#dm-34) | NewEntity | Hospital bookings land on a matching screen as import rows with an admin decision; unmatched rows and rows with no NHI wait in a queue | L |
| [DM-35](#dm-35) | NewEntity | Explicit-save change sets, an on-demand update email draft picked from the change history, and email templates | M |
| [DM-38](#dm-38) | ChangedEntity | Reference data: a master public-holiday calendar, a repeatable one-off data load and maintenance screens for the new masters | M |
| [DM-31](#dm-31) | ChangedEntity | Warning routine: the model and the dashboard to-do list are built; the remaining rules land as their source entities do | M |
| [DM-20](#dm-20) | ChangedLifecycle | Prepayment: started by picking a prepaid Contract, amount is the line's price, invoice generated when an admin approves it, nothing calculated afterwards | L |
| [DM-21](#dm-21) | NewEntity | Prepay holding account: the prepayment's payable is a ledger account, and a second pair pays the anaesthetist who did the List at authorisation | L |
| [DM-17](#dm-17) | NewEntity | Events on a Procedure (pre-op, post-op, billing event, additional invoice, credit, refund) replace the post-op addendum Booking and the other billing lines | L |
| [DM-18](#dm-18) | ChangedEntity | Additional invoice: a free-form invoice recorded as an event, to any billable party, with its own ledger pair when raised after the original has gone | L |
| [DM-24](#dm-24) | NewLifecycle | A wrong invoice is credited in full then rebilled; the payable is reversed by a negative invoice | L |
| [DM-22](#dm-22) | ChangedEntity | The internal ledger holds both halves of each pair as its own records (including the holding-account payable), with the payable independent of Xero | L |
| [DM-23](#dm-23) | NewRelationship | Derived ledger positions for the whole ledger, per anaesthetist and per patient; a flat outstanding list without ageing; patient balance alerts | M |
| [DM-25](#dm-25) | NewEntity | Weekly payment cycle with period approval of BCTIs and a remittance advice that nets negative invoices | M |
| [DM-29](#dm-29) | RuleChange | The GST report lists the payments AA passed to the anaesthetist in the month; the anaesthetist's GST period goes | M |
| [DM-45](#dm-45) | RuleChange | Audit covers invoices, credit notes, master data and Contract changes but not disbursements, payments or receipts | S |
| [DM-55](#dm-55) | ChangedLifecycle | A SUBMITTED List stays editable by the anaesthetist until AUTHORISED, and a List leaves the anaesthetist's main view at AUTHORISED | M |
| [DM-56](#dm-56) | RuleChange | An anaesthetist's unavailability is never a conflict: conflicts cover hospital closures only | M |
| [DM-57](#dm-57) | NewEntity | Contract changes are staged, reviewed on a dashboard and submitted together as a new dated version | M |

## DM-13

### The RVG group becomes the one master list (hidden key, type-ahead rows, modifier units, AA groups); there is no procedure list

**Kind:** ChangedEntity · **Size:** L

**Catalogue says.** Base units sit on the RVG group: the NZSA RVG as published plus AA's own groups (not marked as AA-sourced), each with a code, description, anatomy heading, base units always set and above 0, and modifier units default 0. RVG codes are not unique enough to be keys, so a row has a hidden key and the same code can appear on several rows with different values. The RVG groups are the one master list: there is no procedure list, no body-section picker and no general procedure (OQ-88 answered; US-05.1.6 Retired). The anaesthetist picks the code by type-ahead showing code, short description and base units. The RVG code on a Procedure is optional, and the 'procedure' on a Booking is the text received. Seeded once from spreadsheets, then maintained by hand with every change audited. Open: the system code (US-05.1.1 note), how a published unit range is held (OQ-101), whether the anatomy heading is used to browse (US-05.1.3, Verify).

**Prototype has.** Only RvgCode (types.ts:919), keyed by its code string: code, description, an anatomicalSite string, baseUnits single or range, absorbsModifierCodes; 33 demo rows (seed/rvgCodes.ts:13). Procedure.rvgBaseCode (types.ts:870) is a scalar string into that table, and the validator requires one unless a billing line exists (validateBookingForBilling.ts:130). No hidden key, no duplicate-code rows, no modifier units on the group, no AA-added groups, no type-ahead that shows base units.

**Impact.** Foundation for the pricing track, and smaller than the earlier reading (no procedure list, no two-tab picker, no general procedure, no body section). RvgCode gets a hidden id, anatomy heading and modifier units; Procedure.rvgBaseCode becomes an optional group reference (22 non-test files read it); absorbsModifierCodes moves to DM-44's included-modifier link. The seed needs the real NZSA group list; the code picker (shared/capture/CodePickerSheet.tsx) gains the type-ahead rows. Must precede DM-09 (a line names a default RVG group), DM-43 and DM-44.

**Catalogue:** [US-05.1.1](../../../../requirements-board/requirements/stories/US-05.1.1.md), [US-05.1.3](../../../../requirements-board/requirements/stories/US-05.1.3.md), [US-05.1.6](../../../../requirements-board/requirements/stories/US-05.1.6.md), [US-03.3.1](../../../../requirements-board/requirements/stories/US-03.3.1.md), [FT-05.1](../../../../requirements-board/requirements/stories/FT-05.1.md), [FT-04.3](../../../../requirements-board/requirements/stories/FT-04.3.md), [US-13.4.3](../../../../requirements-board/requirements/stories/US-13.4.3.md), [OQ-88](../../../../requirements-board/requirements/questions/OQ-88.md), [OQ-101](../../../../requirements-board/requirements/questions/OQ-101.md), [domain-model.md](../../../../requirements-board/requirements/domain-model.md)

**Prototype:** `aa-prototype/src/domain/types.ts:919`, `aa-prototype/src/domain/types.ts:870`, `aa-prototype/src/domain/seed/rvgCodes.ts:13`, `aa-prototype/src/domain/billing/validateBookingForBilling.ts:130`

## DM-48

### The contract holder becomes a master record (insurer, hospital, surgeon or rooms, anaesthetist; AA holds No contract) with an is-billed flag, a billable party and a practitioner link

**Kind:** NewEntity · **Size:** L

**Catalogue says.** Every Contract belongs to a contract holder: an insurer, a hospital, a surgeon or a surgeon's rooms, or an anaesthetist (own price list). AA itself holds No contract (RVG). 'First party' and 'third party' are dropped. Each holder records whether AA invoices it (then its billable party record is required and billed) or it only sets the price (the Booking's payer is billed), and optionally the anaesthetist or surgeon its Contracts belong to, so they are offered only on that person's Bookings. A holder can hold many Contracts. The office creates anaesthetists' holders and Contracts from the price list the anaesthetist supplies (US-04.1.5, US-04.2.1, US-04.2.14, OQ-91). Open: what the insurer's accepts-direct-claims flag now means (OQ-114), how a surgeon's fixed-price arrangement is found for a Booking (OQ-105).

**Prototype has.** No holder entity. Contract carries holderType 'hospital' | 'insurer' | 'surgeon' | 'organisation' | 'billableParty' plus holderId into four disjoint tables (types.ts:367, :388; ContractHolderOrganisation types.ts:352), and ContractScope individualAnaesthetist (types.ts:379) is the only first-party idea. There is no is-billed flag: the holder is always the counterparty on the contract-holder route (invoiceBuild.ts:192). Insurer.acceptsDirectClaims (types.ts:345) gates the Insurer route only.

**Impact.** New holder master with CRUD; Contract.holderType and holderId (10 non-test files) become a holder reference. Hospital, Insurer and Surgeon stay as reference records and billable-party sources but stop being the Contract's key. The prototype's 'organisation' and 'billableParty' holder kinds have no catalogue counterpart: a group holder becomes a surgeon or rooms holder, and a billable-party holder becomes the holder's billable-party link. acceptsDirectClaims waits on OQ-114. Needed before DM-07, DM-49, DM-10 and DM-11.

**Catalogue:** [US-04.1.5](../../../../requirements-board/requirements/stories/US-04.1.5.md), [US-04.2.1](../../../../requirements-board/requirements/stories/US-04.2.1.md), [US-04.2.14](../../../../requirements-board/requirements/stories/US-04.2.14.md), [FT-11.2](../../../../requirements-board/requirements/stories/FT-11.2.md), [US-11.4.1](../../../../requirements-board/requirements/stories/US-11.4.1.md), [OQ-91](../../../../requirements-board/requirements/questions/OQ-91.md), [OQ-105](../../../../requirements-board/requirements/questions/OQ-105.md), [OQ-114](../../../../requirements-board/requirements/questions/OQ-114.md), [domain-model.md](../../../../requirements-board/requirements/domain-model.md)

**Prototype:** `aa-prototype/src/domain/types.ts:367`, `aa-prototype/src/domain/types.ts:352`, `aa-prototype/src/domain/types.ts:345`, `aa-prototype/src/domain/billing/invoiceBuild.ts:192`

## DM-07

### The Contract becomes a series of dated versions with an AA code and behaviour flags; Type 1/2/3, scope, the default per holder and the Method 3 gate go

**Kind:** ChangedEntity · **Size:** XL

**Catalogue says.** A Contract is a structure that sets how a procedure is paid for and who pays; there are no kinds or categories. Each Contract is a series of dated versions (start, optional end, a review date, a forward link to the version that revised it) and all its lines share the dates. Every change, a correction or a renewal, creates a new version from a date the office chooses (never past, never backdated, nothing deleted); the previous version ends the day before; only one future-dated version at a time, freely corrected or withdrawn until it starts; the version in force on the procedure date prices the Procedure. On submit, un-invoiced Procedures dated on or after the new start are relinked to the new version's line with the same line key, unmatched ones are listed, and a prepaid Procedure keeps its invoiced price (OQ-104). Every Contract has a unique short AA code (format OQ-66), searchable with holder codes. Behaviour comes from flags AA sets: the holder is billed (on the holder), editable (may the anaesthetist change price, rate or discount; OQ-107), prepaid, and default (No contract (RVG)), plus invoice layout, delivery method and GST treatment (US-04.1.1 to US-04.1.4, US-04.2.2, US-04.2.8, US-04.2.10). Anaesthetists never edit Contracts.

**Prototype has.** Contract (types.ts:388): type 1 | 2 | 3, holderType and holderId, scope, permitsIndividualArrangement, isDefault, effectiveFromISO and effectiveToISO, type2Detail. No version link, review date, AA code, editable flag or prepaid flag; contractActions.ts edits in place with audit entries only. Effectiveness is judged on the List date at billing time (contracts.ts:22) and selection ranks individual over organisational over default (contracts.ts:34). The seed holds 12 Contracts (seed/contracts.ts:45).

**Impact.** Schema rewrite of the master that pricing, billing and the review screens read (26 non-test files touch governingContractId or billingRoute, 10 touch holderType). Needs DM-48 and DM-09 in the same step. The rank-based selectContract is replaced by the filtered picker of DM-10. The editable flag drives DM-14 and the prepaid flag drives DM-20. A new version needs a copy-lines action, an overlap guard and the relink on submit; staged review is DM-57. Seed Contracts are re-authored.

**Catalogue:** [US-04.1.1](../../../../requirements-board/requirements/stories/US-04.1.1.md), [US-04.1.2](../../../../requirements-board/requirements/stories/US-04.1.2.md), [US-04.1.3](../../../../requirements-board/requirements/stories/US-04.1.3.md), [US-04.1.4](../../../../requirements-board/requirements/stories/US-04.1.4.md), [US-04.2.10](../../../../requirements-board/requirements/stories/US-04.2.10.md), [US-04.2.2](../../../../requirements-board/requirements/stories/US-04.2.2.md), [US-04.2.8](../../../../requirements-board/requirements/stories/US-04.2.8.md), [FT-04.1](../../../../requirements-board/requirements/stories/FT-04.1.md), [FT-04.2](../../../../requirements-board/requirements/stories/FT-04.2.md), [OQ-66](../../../../requirements-board/requirements/questions/OQ-66.md), [OQ-104](../../../../requirements-board/requirements/questions/OQ-104.md), [OQ-107](../../../../requirements-board/requirements/questions/OQ-107.md), [domain-model.md](../../../../requirements-board/requirements/domain-model.md)

**Prototype:** `aa-prototype/src/domain/types.ts:388`, `aa-prototype/src/domain/billing/contracts.ts:22`, `aa-prototype/src/domain/billing/contracts.ts:34`, `aa-prototype/src/store/contractActions.ts:106`, `aa-prototype/src/domain/seed/contracts.ts:45`

## DM-09

### The Contract line (standalone, carrying only what it sets, with a system line key) replaces ContractPrice

**Kind:** ChangedEntity · **Size:** L

**Catalogue says.** A Contract has lines, or none (a hospital's plain RVG Contract has none). A line stands alone: no nesting, no procedure link, and several lines may share a default RVG code; a combination (for example 'Facelift plus 1 add on') is a line of its own. A line carries only what it sets: a system line key (never reused, kept when a new version copies the line), an optional holder reference code unique within the Contract and searchable, a description that starts the invoice description, an optional default RVG code, and any of a fixed price (ex GST), a rate, a discount, or base or modifier units. Blank means not set and 0 is a value. Removed: procedure link, RVG mapping, time band, add-on flag, quantity rule, price tier and line-level dates (US-04.2.4, US-04.2.11, US-04.2.2, US-05.2.5, US-05.2.6, US-05.4.3; OQ-89).

**Prototype has.** ContractPrice (types.ts:422): contractId, optional rvgBaseCode, surgeonId, procedureOrdinal, price. Only Type 3 Contracts use rows, matched most-specific-wins (contracts.ts:77) with a BTM fallback. Rate and discount live on Contract.type2Detail (types.ts:384), not on a line. No line key, reference code, description, default RVG code or units override.

**Impact.** Replaces masters.contractPrices and matchContractPrice (14 non-test files). Surgeon-specific and ordinal-specific prices are re-expressed as surgeon-held Contracts and plain lines. The picker (DM-10), the unit resolver (DM-43) and pricing (DM-50) read lines, and a Procedure points to a line. Seed prices and Master Data screens are rewritten. After DM-13 and DM-07.

**Catalogue:** [US-04.2.4](../../../../requirements-board/requirements/stories/US-04.2.4.md), [US-04.2.11](../../../../requirements-board/requirements/stories/US-04.2.11.md), [US-04.2.2](../../../../requirements-board/requirements/stories/US-04.2.2.md), [US-05.2.5](../../../../requirements-board/requirements/stories/US-05.2.5.md), [US-05.2.6](../../../../requirements-board/requirements/stories/US-05.2.6.md), [US-05.4.3](../../../../requirements-board/requirements/stories/US-05.4.3.md), [FT-04.2](../../../../requirements-board/requirements/stories/FT-04.2.md), [OQ-89](../../../../requirements-board/requirements/questions/OQ-89.md), [domain-model.md](../../../../requirements-board/requirements/domain-model.md)

**Prototype:** `aa-prototype/src/domain/types.ts:422`, `aa-prototype/src/domain/types.ts:384`, `aa-prototype/src/domain/billing/contracts.ts:77`, `aa-prototype/src/domain/seed/contracts.ts:139`

## DM-49

### One stored No contract (RVG), held by AA and never billed, replaces the protected default Type 1 per hospital and direct-billing insurer

**Kind:** ChangedEntity · **Size:** M

**Catalogue says.** Exactly one No contract (RVG): held by AA (a holder that is never billed), no practice-wide prices, never expires, found by a flag and not its name, offered first for every procedure, billing the payer on the Booking. There are no hospital, insurer or per-procedure default Contracts and nothing is derived from the List's location. A holder's plain RVG Contract with no lines is an ordinary Contract offered by context (OQ-98). Routine procedures as lines of No contract (RVG) are a possible later option (OQ-106). The default-Contract feature is Retired (US-04.3.3, FT-04.4, US-04.4.1, US-04.4.2; OQ-78).

**Prototype has.** A protected default Type 1 per hospital and per direct-claims insurer, created with the hospital or when the insurer flag flips (mastersActions.ts:57, :177), protected from delete and end-dating (contractActions.ts:28, :111, :157) and used as the fallback when a negotiated Contract is absent or expired (invoiceBuild.ts:86, :114). The Billable Party route resolves with no Contract at all.

**Impact.** A removal of an invariant the earlier pass counted as aligned. Delete the per-holder creation, protection and fallback rules and their tests; add one flagged Contract held by AA and the 'offered first' rule; payer-on-Booking billing replaces the Billable Party route (DM-11). Comes with DM-07.

**Catalogue:** [US-04.3.3](../../../../requirements-board/requirements/stories/US-04.3.3.md), [FT-04.4](../../../../requirements-board/requirements/stories/FT-04.4.md), [US-04.4.1](../../../../requirements-board/requirements/stories/US-04.4.1.md), [US-04.4.2](../../../../requirements-board/requirements/stories/US-04.4.2.md), [OQ-78](../../../../requirements-board/requirements/questions/OQ-78.md), [OQ-98](../../../../requirements-board/requirements/questions/OQ-98.md), [OQ-106](../../../../requirements-board/requirements/questions/OQ-106.md), [domain-model.md](../../../../requirements-board/requirements/domain-model.md)

**Prototype:** `aa-prototype/src/store/mastersActions.ts:57`, `aa-prototype/src/store/contractActions.ts:28`, `aa-prototype/src/domain/billing/invoiceBuild.ts:114`, `aa-prototype/src/domain/seed/contracts.ts:45`

## DM-10

### Each Procedure selects one Contract and, where it has lines, one line at booking setup; the billing route and billing-time Contract resolution disappear

**Kind:** ChangedRelationship · **Size:** XL

**Catalogue says.** Every Procedure references exactly one Contract (and, where the Contract has lines, one line) before its Booking can be marked complete. The office sets it at booking setup, its main job being to identify who pays (holder, then Contract, then line); a Booking without a Contract stays on the admin's list, and the RVG code or line may be left blank for the anaesthetist (OQ-99). The anaesthetist may change the Contract, line and RVG code until the List is AUTHORISED, with no reason; every change is audited and flagged at office review; changing the Contract resets price, rate, discount and starting units. The picker lists Contracts, not lines: No contract (RVG) first, then the hospital's, then surgeons' and anaesthetists' arrangements, valid on the procedure date and whose holder fits the Booking, with RVG-code reverse lookup and AA or holder code search. The engine resolves no route or payer; the Contract does (US-04.3.1, US-04.3.2, US-04.3.4, US-03.4.1, FT-03.4, FT-04.3, US-08.1.1).

**Prototype has.** Procedure carries billingRoute 'hospital' | 'billableParty' | 'insurer' (types.ts:831), governingContractId (:832), insurerId (:838), billablePartyId (:844), patientPaymentCategory (:846) and prepaymentDetail (:848). The route is set explicitly (the validator fails an unset route, validateBookingForBilling.ts:125). The Contract is resolved at billing time from holder, date and default fallback (invoiceBuild.ts:114) and is not locked. Only the office edits billing setup (shared/booking/OfficeBillingSetup.tsx:41); the anaesthetist sees a read-only line. No Contract-change flag at review.

**Impact.** The central relationship change: Procedure.contractId (mandatory) and contractLineId replace route, governing Contract, insurer and payment category (26 non-test files read governingContractId or billingRoute: validator, invoice build, billing run, review, capture UI, seed). The anaesthetist gains a Contract and RVG picker and a change window to AUTHORISED; office review gains a Contract-change flag; an unset Contract keeps the Booking on the admin's list. Needs DM-13 to DM-49; unblocks DM-43, DM-50, DM-08, DM-11 and DM-20.

**Catalogue:** [US-04.3.1](../../../../requirements-board/requirements/stories/US-04.3.1.md), [US-04.3.2](../../../../requirements-board/requirements/stories/US-04.3.2.md), [US-04.3.4](../../../../requirements-board/requirements/stories/US-04.3.4.md), [US-03.4.1](../../../../requirements-board/requirements/stories/US-03.4.1.md), [FT-03.4](../../../../requirements-board/requirements/stories/FT-03.4.md), [FT-04.3](../../../../requirements-board/requirements/stories/FT-04.3.md), [US-08.1.1](../../../../requirements-board/requirements/stories/US-08.1.1.md), [US-07.2.2](../../../../requirements-board/requirements/stories/US-07.2.2.md), [US-03.6.1](../../../../requirements-board/requirements/stories/US-03.6.1.md), [OQ-99](../../../../requirements-board/requirements/questions/OQ-99.md), [OQ-98](../../../../requirements-board/requirements/questions/OQ-98.md), [domain-model.md](../../../../requirements-board/requirements/domain-model.md)

**Prototype:** `aa-prototype/src/domain/types.ts:831`, `aa-prototype/src/domain/types.ts:832`, `aa-prototype/src/domain/billing/invoiceBuild.ts:114`, `aa-prototype/src/shared/booking/OfficeBillingSetup.tsx:41`, `aa-prototype/src/domain/billing/validateBookingForBilling.ts:125`

## DM-43

### Starting units come from the Contract line, then the RVG group, and become the Procedure's own values; any value is accepted and an out-of-range one only warns

**Kind:** RuleChange · **Size:** M

**Catalogue says.** Choosing the Contract (and line) and the RVG code fills in the Procedure's starting values: base units from the RVG code, or from the line where the line states its own; modifier units from 0 plus any modifier the system applies; any price, rate or discount from the line. From then on they are the Procedure's own values, which the anaesthetist may change to any figure, including one outside the published range; that raises an after-procedure warning for the office and never blocks. Changing the Contract resets them. The RVG code is optional (not needed on a fixed price). There is no procedure layer and no source layer is recorded (US-03.3.1, FT-05.2, US-05.1.1, US-04.2.2, US-13.7.1; OQ-56, OQ-101).

**Prototype has.** resolveBtm (fee.ts:58) takes base units from the single RvgCode row (single, or a range via baseUnitsSelected) with a captured override flagged 'overridden' (types.ts:154). No Contract-line layer and no reset on a Contract change. The validator fails a missing or out-of-range selection (validateBookingForBilling.ts:152 to :165) instead of warning.

**Impact.** Pure module change in domain/billing with new tests; the validator branch becomes a warning (DM-31); capture UI shows starting values and refreshes on a Contract or code change. Depends on DM-13 and DM-09.

**Catalogue:** [US-03.3.1](../../../../requirements-board/requirements/stories/US-03.3.1.md), [FT-05.2](../../../../requirements-board/requirements/stories/FT-05.2.md), [US-05.1.1](../../../../requirements-board/requirements/stories/US-05.1.1.md), [US-04.2.2](../../../../requirements-board/requirements/stories/US-04.2.2.md), [US-04.2.4](../../../../requirements-board/requirements/stories/US-04.2.4.md), [US-13.7.1](../../../../requirements-board/requirements/stories/US-13.7.1.md), [OQ-56](../../../../requirements-board/requirements/questions/OQ-56.md), [OQ-101](../../../../requirements-board/requirements/questions/OQ-101.md), [domain-model.md](../../../../requirements-board/requirements/domain-model.md)

**Prototype:** `aa-prototype/src/domain/billing/fee.ts:58`, `aa-prototype/src/domain/types.ts:154`, `aa-prototype/src/domain/billing/validateBookingForBilling.ts:152`

## DM-50

### Pricing is one rule on values held on the Procedure: its price, else (base + time + modifier) x rate x (1 - discount); Type 2/3 pricing goes

**Kind:** RuleChange · **Size:** L

**Catalogue says.** A Procedure is priced by its Contract and the values held on the Procedure itself (Donald, 18 October; the documents' ordered price steps are not adopted). If the Procedure holds a price (a fixed price from its line, the prepaid amount, or one entered by someone permitted) that is the price and BTM is kept for reference. Otherwise the price is (B + T + M) x rate x (1 - discount): the rate is the line's rate, else the anaesthetist's own unit value; the discount is the one held on the Procedure, shown as its own invoice line. A price of 0 gives a no-charge invoice; BTM is optional on a fixed price and required on a fixed-rate Contract. Prices use the Contract version in force on the procedure date; submission is rejected when no price can be worked out; every price is held ex GST (FT-05.2, US-05.2.1, US-05.2.5, US-05.2.6, US-05.4.3, US-05.2.7, US-03.5.2).

**Prototype has.** feeFor (fee.ts:180): Type 1 units x unit value; Type 2 an agreed unit rate or a percent discount folded into a derived rate; Type 3 a fixed ContractPrice else a BTM fallback (the ordinal rule at fee.ts:212); non-RVG billing lines (fee.ts:237); then the typed priceOverride last (types.ts:880). Price, rate and discount are not held on the Procedure and nothing records a price source.

**Impact.** Rewrite of the pure fee path and its Vitest suite on the new Procedure values (price, rate, discount) with a rejection path; Procedure gains those three fields, filled from the line. Invoice line text must stop being the only snapshot (DM-08). Depends on DM-09 and DM-14.

**Catalogue:** [FT-05.2](../../../../requirements-board/requirements/stories/FT-05.2.md), [US-05.2.1](../../../../requirements-board/requirements/stories/US-05.2.1.md), [US-05.2.5](../../../../requirements-board/requirements/stories/US-05.2.5.md), [US-05.2.6](../../../../requirements-board/requirements/stories/US-05.2.6.md), [US-05.4.3](../../../../requirements-board/requirements/stories/US-05.4.3.md), [US-05.2.7](../../../../requirements-board/requirements/stories/US-05.2.7.md), [US-03.5.2](../../../../requirements-board/requirements/stories/US-03.5.2.md), [US-04.2.2](../../../../requirements-board/requirements/stories/US-04.2.2.md), [OQ-89](../../../../requirements-board/requirements/questions/OQ-89.md), [domain-model.md](../../../../requirements-board/requirements/domain-model.md)

**Prototype:** `aa-prototype/src/domain/billing/fee.ts:180`, `aa-prototype/src/domain/billing/fee.ts:212`, `aa-prototype/src/domain/billing/fee.ts:237`, `aa-prototype/src/domain/types.ts:880`

## DM-14

### Price changes become edits of the Procedure's own price, rate and discount: the anaesthetist where the Contract is editable, the office on any Contract, no reason, last change stands

**Kind:** ChangedEntity · **Size:** M

**Catalogue says.** The Contract carries a flag, set by AA, saying whether the anaesthetist may change price, rate or discount (typically yes on RVG-priced Contracts, no on a hospital's fixed-price Contract or a surgeon's fixed fee, where no discount may be added either; a prepaid Procedure is OQ-96). Where not allowed, the price is read-only and they change the Contract or ask the office. The office can change any price, rate or discount on any Contract at any time. No reason is needed (US-03.5.3 Retired; only a claimed modifier needs an explanation); every change is audited and flagged at office review, and the last change stands, neither side outranking the other. Changing the Contract resets the values. BTM is still recorded in full (US-03.5.1, US-03.5.2, US-05.4.1, US-05.4.2, FT-03.5, FT-05.4; OQ-107 answered).

**Prototype has.** One optional Procedure.priceOverride of fixedFee, dollarAdjustment or percentAdjustment with a mandatory reason (types.ts:812, :880), writable by anyone with edit rights through editProcedure (lifecycle.ts:452); OverrideCard and PriceOverrideSheet drive it. No Contract editable flag, no actor distinction, no reset on a Contract change, no review flag.

**Impact.** priceOverride and its reason go; the Procedure's price, rate and discount (DM-50) are edited in place with the actor audited; validator and both UIs gate on the Contract's editable flag; audit labels and the review flag change. 9 non-test files read priceOverride. Price change on a prepaid Procedure is OQ-96. Depends on DM-07 and DM-10.

**Catalogue:** [US-03.5.1](../../../../requirements-board/requirements/stories/US-03.5.1.md), [US-03.5.2](../../../../requirements-board/requirements/stories/US-03.5.2.md), [US-05.4.1](../../../../requirements-board/requirements/stories/US-05.4.1.md), [US-05.4.2](../../../../requirements-board/requirements/stories/US-05.4.2.md), [FT-03.5](../../../../requirements-board/requirements/stories/FT-03.5.md), [FT-05.4](../../../../requirements-board/requirements/stories/FT-05.4.md), [OQ-96](../../../../requirements-board/requirements/questions/OQ-96.md), [OQ-107](../../../../requirements-board/requirements/questions/OQ-107.md), [domain-model.md](../../../../requirements-board/requirements/domain-model.md)

**Prototype:** `aa-prototype/src/domain/types.ts:812`, `aa-prototype/src/domain/types.ts:880`, `aa-prototype/src/store/lifecycle.ts:452`, `aa-prototype/src/shared/capture/OverrideCard.tsx:28`, `aa-prototype/src/shared/flows/PriceOverrideSheet.tsx:32`

## DM-44

### Modifiers become per-Procedure records, each claimed one with an explanation; age and included modifiers are pre-applied but not locked; ASA is just a modifier

**Kind:** NewEntity · **Size:** L

**Catalogue says.** The anaesthetist picks each modifier that applies from the RVG modifier table plus AA's own, itemised, and gives a short explanation for each claimed one (the only explanation the system asks for). The system pre-applies only the age modifier (A1 or A2, from the patient's date of birth) and any modifier already included in a code's base units (P1 on every Neurosurgery code H7A to H9b and Spine code S1 to S10), shown selected at 0 units; none is locked and the anaesthetist can remove any (Donald, 20 October). Nothing is pre-filled from ASA, which is one of the optional modifiers. Some modifier values are not plain numbers. Whether any is applied at all is OQ-95 (US-03.3.4, US-03.3.8, US-05.1.4, US-05.1.5, FT-03.3; US-03.3.5 Itemise modifiers is Retired, merged into US-03.3.4).

**Prototype has.** Procedure.selectedModifierCodes (string array, types.ts:868) plus a separate asaClass (types.ts:866) that seeds its AS code (fee.ts:79); modifierUnits sums plain numbers and zeroes any code in RvgCode.absorbsModifierCodes with a refusal caption (modifierUnits.ts:58). No explanation field, no date-of-birth age modifier, no per-Procedure modifier record.

**Impact.** New record (procedure, modifier, units, explanation, origin: chosen, age or included); the modifier master gains non-numeric value shapes and AA's own codes; the RVG group's included link replaces absorbsModifierCodes; asaClass and the refusal path go; completion blockers add the explanation rule; the capture sheet is rebuilt. 13 non-test files read selectedModifierCodes or asaClass. Needs DM-13; feeds DM-15.

**Catalogue:** [US-03.3.4](../../../../requirements-board/requirements/stories/US-03.3.4.md), [US-03.3.8](../../../../requirements-board/requirements/stories/US-03.3.8.md), [US-05.1.4](../../../../requirements-board/requirements/stories/US-05.1.4.md), [US-05.1.5](../../../../requirements-board/requirements/stories/US-05.1.5.md), [FT-03.3](../../../../requirements-board/requirements/stories/FT-03.3.md), [US-03.6.1](../../../../requirements-board/requirements/stories/US-03.6.1.md), [OQ-94](../../../../requirements-board/requirements/questions/OQ-94.md), [OQ-95](../../../../requirements-board/requirements/questions/OQ-95.md), [domain-model.md](../../../../requirements-board/requirements/domain-model.md)

**Prototype:** `aa-prototype/src/domain/types.ts:868`, `aa-prototype/src/domain/types.ts:866`, `aa-prototype/src/domain/types.ts:919`, `aa-prototype/src/domain/billing/modifierUnits.ts:58`, `aa-prototype/src/domain/billing/fee.ts:79`

## DM-15

### Multi-procedure rule: one primary flag, time on every procedure, modifier units split above four, no Contract-specific ordinals

**Kind:** RuleChange · **Size:** M

**Catalogue says.** Every Booking has exactly one primary Procedure, set by anyone with edit rights. Base units only on the primary. Time units on every Procedure from its own start and finish times (1 per 15 minutes for two hours, then 1 per 10; a part interval rounded up; the tiers held as data). Modifier units all on the primary while the Booking's total is 4 or fewer, otherwise divided as evenly as possible across all Procedures with the remainder to the primary (7 over 3 is 3, 2, 2). No Contract changes the rule: Contract-specific second-procedure rules are Retired (US-03.2.1, US-03.2.2, US-05.3.1, US-05.2.2; US-04.2.5 and US-05.3.4 Retired; OQ-90 answered).

**Prototype has.** The base-on-primary and time-on-every-procedure parts already match (an additional procedure yields time units only). What differs: Procedure.isAdditional is a boolean on added procedures (types.ts:863) with modifiers always on the first (fee.ts:107 splitBillingUnits); no settable primary and no modifier split above four; ordinal-keyed fixed prices (ContractPrice.procedureOrdinal; fee.ts:212); time tiers are module constants (timeUnits.ts:13).

**Impact.** isAdditional becomes isPrimary (15 non-test files); the allocation step is pure and testable; ordinal pricing and its seed rows go; tiers become data. Needs DM-44 for the modifier total.

**Catalogue:** [US-03.2.1](../../../../requirements-board/requirements/stories/US-03.2.1.md), [US-03.2.2](../../../../requirements-board/requirements/stories/US-03.2.2.md), [US-05.3.1](../../../../requirements-board/requirements/stories/US-05.3.1.md), [FT-05.3](../../../../requirements-board/requirements/stories/FT-05.3.md), [US-05.2.2](../../../../requirements-board/requirements/stories/US-05.2.2.md), [US-04.2.5](../../../../requirements-board/requirements/stories/US-04.2.5.md), [US-05.3.4](../../../../requirements-board/requirements/stories/US-05.3.4.md), [OQ-90](../../../../requirements-board/requirements/questions/OQ-90.md), [domain-model.md](../../../../requirements-board/requirements/domain-model.md)

**Prototype:** `aa-prototype/src/domain/types.ts:863`, `aa-prototype/src/domain/billing/fee.ts:107`, `aa-prototype/src/domain/billing/fee.ts:212`, `aa-prototype/src/domain/billing/timeUnits.ts:13`

## DM-46

### The BillingLine entity, rate x time billing and the Method 3 gate are removed; other late lines become events

**Kind:** RemovedEntity · **Size:** L

**Catalogue says.** Rate x time capture is Retired (US-03.3.7): a Contract with its own fixed rate prices the whole Procedure at BTM x that rate (US-05.2.6), not a billing line. 'Other billing lines' (post-op reviews, nerve catheters, pain consults, transport) are Retired as a concept (US-03.3.6) and merged into events (FT-03.7, DM-17). Contract add-on fees are gone (US-04.2.4). Time is an optional recording only (OQ-89). A split between payers is a Booking action, not a line setting (DM-28).

**Prototype has.** BillingLine with ChargeBasis 'rvg' | 'fixed' | 'rateTime' (types.ts:888, :897), hours and rate, and funderOverride; Contract.permitsIndividualArrangement as the Method 3 gate, validator-enforced (validateBookingForBilling.ts:222); the seeded rate x time capture Booking (Souter); lines summed into the fee (fee.ts:237); the add-line UI (shared/capture/AddBillingLineSheet.tsx, BillingLinesCard.tsx).

**Impact.** Wider than the earlier reading: the whole BillingLine entity (25 non-test files touch BillingLine, billingLines or chargeBasis) is replaced by events (DM-17) and the Procedure's price. Delete the rateTime basis, the gate field, the validator branch, the seeded scenario and the UI. Build DM-17 first, then remove; do with DM-07 so the Contract shape is touched once.

**Catalogue:** [US-03.3.6](../../../../requirements-board/requirements/stories/US-03.3.6.md), [US-03.3.7](../../../../requirements-board/requirements/stories/US-03.3.7.md), [US-05.2.6](../../../../requirements-board/requirements/stories/US-05.2.6.md), [US-04.2.4](../../../../requirements-board/requirements/stories/US-04.2.4.md), [FT-03.7](../../../../requirements-board/requirements/stories/FT-03.7.md), [OQ-89](../../../../requirements-board/requirements/questions/OQ-89.md), [domain-model.md](../../../../requirements-board/requirements/domain-model.md)

**Prototype:** `aa-prototype/src/domain/types.ts:888`, `aa-prototype/src/domain/types.ts:897`, `aa-prototype/src/domain/billing/fee.ts:237`, `aa-prototype/src/domain/billing/validateBookingForBilling.ts:222`

## DM-08

### Authorising a List snapshots each Procedure's Contract version, line and pricing values; the billing engine reads the snapshot

**Kind:** NewLifecycle · **Size:** L

**Catalogue says.** On AUTHORISED the engine snapshots, per Procedure, the Contract version (each version its own record), the values on the Procedure (units, price, rate, discount), the recorded BTM, the rate and discount used, the price, and the payer or billable party details. Later changes to RVG groups or Contracts never alter an issued invoice, which can always be reproduced. The engine resolves no route or payer. Before authorisation, where the Contract was revised after the Booking was made, values refresh from the revised line (a prepaid Procedure keeps its invoiced price); how that relinking meets a Procedure locked at authorisation is not stated (US-04.2.10 note) (US-04.3.5, US-07.3.1, US-07.3.2, US-08.4.4, US-08.1.1, US-05.3.5).

**Prototype has.** authoriseList (lifecycle.ts:275) only sets the List to AUTHORISED. The billing run later resolves the Contract and computes the fee at run time (invoiceBuild.ts:114, :264; billingRun.ts:69) and stores amounts plus rate text inside invoice line descriptions (invoiceBuild.ts describeFeeLine :247). No stored Contract version or resolved values. InvoiceLine.procedureId is optional (types.ts:1131), so the per-Procedure ledger share of US-05.3.5 is not recorded.

**Impact.** New PricingSnapshot record per Procedure, written at authorisation and read by the run and by invoice regeneration, carrying the per-Procedure units and dollars; the immutable lock now covers the Contract version as well as the Booking. Needs DM-07, DM-10, DM-50 and DM-11. The existing per-Booking failure isolation (billingRun.ts:69) stays.

**Catalogue:** [US-04.3.5](../../../../requirements-board/requirements/stories/US-04.3.5.md), [US-08.4.4](../../../../requirements-board/requirements/stories/US-08.4.4.md), [US-08.1.1](../../../../requirements-board/requirements/stories/US-08.1.1.md), [US-07.3.1](../../../../requirements-board/requirements/stories/US-07.3.1.md), [US-07.3.2](../../../../requirements-board/requirements/stories/US-07.3.2.md), [US-05.3.5](../../../../requirements-board/requirements/stories/US-05.3.5.md), [US-04.2.10](../../../../requirements-board/requirements/stories/US-04.2.10.md), [FT-07.3](../../../../requirements-board/requirements/stories/FT-07.3.md), [domain-model.md](../../../../requirements-board/requirements/domain-model.md)

**Prototype:** `aa-prototype/src/store/lifecycle.ts:275`, `aa-prototype/src/domain/billing/invoiceBuild.ts:114`, `aa-prototype/src/domain/billing/invoiceBuild.ts:264`, `aa-prototype/src/store/billingRun.ts:69`, `aa-prototype/src/domain/types.ts:1131`

## DM-16

### The Contract carries invoice layout, delivery method, GST treatment and the holder references a Booking must supply

**Kind:** ChangedEntity · **Size:** S

**Catalogue says.** A Contract sets the invoice layout (holder or patient; the holder's carries the BTM breakdown), the delivery method (email, or portal upload for a direct insurer) and the GST treatment (US-04.2.8). It also names the references its holder needs on invoices (an insurer member number, the holder's own reference such as SXAP); the office supplies them on the Booking, not the anaesthetist (US-04.2.2, US-11.4.3). The configurable required booking inputs are Retired (US-04.2.7). No invoice email sits on the Contract.

**Prototype has.** Layout is derived from the counterparty kind at build time (layoutFor, invoiceBuild.ts:216; Invoice.layout types.ts:1119). A single free-text Procedure.billingReference (hospital approval reference) with its completeness check (validateBookingForBilling.ts:49). No delivery-method field; emailing is a stamp (billingRun.ts:411).

**Impact.** A few Contract fields and a Booking-side reference map keyed by the references the Contract names; the completeness check moves to office review. Depends on DM-07.

**Catalogue:** [US-04.2.8](../../../../requirements-board/requirements/stories/US-04.2.8.md), [US-04.2.2](../../../../requirements-board/requirements/stories/US-04.2.2.md), [US-04.2.7](../../../../requirements-board/requirements/stories/US-04.2.7.md), [US-11.4.3](../../../../requirements-board/requirements/stories/US-11.4.3.md), [US-03.6.1](../../../../requirements-board/requirements/stories/US-03.6.1.md), [US-08.4.1](../../../../requirements-board/requirements/stories/US-08.4.1.md), [US-08.4.2](../../../../requirements-board/requirements/stories/US-08.4.2.md)

**Prototype:** `aa-prototype/src/domain/billing/invoiceBuild.ts:216`, `aa-prototype/src/domain/types.ts:857`, `aa-prototype/src/store/billingRun.ts:411`

## DM-51

### Each Procedure keeps the text exactly as received from each source, the rooms' and the hospital's apart, plus a separate invoice description

**Kind:** NewEntity · **Size:** M

**Catalogue says.** Each Procedure keeps the procedure text exactly as each originating system sent it: the surgeon's rooms' description and, separately, the hospital's, never edited or overwritten; a later update with different wording is added beside it with its source system and time; manual entry keeps what was typed or told as its source text. The procedure on a Booking is now just this text (no procedure master). The booking screens in both apps show it above the Contract and the RVG code, with who is invoiced and the pricing basis. A separate invoice description, starting as the chosen line's description else the Booking's description and editable without touching the received texts, is what the invoice prints (US-02.5.7, US-03.1.9, US-08.4.6, US-03.1.2, US-02.3.1, US-02.4.1). Open: which description the invoice prints for an RVG Contract (OQ-103), where each feed carries the text (OQ-13).

**Prototype has.** One editable free-text Procedure.description (types.ts:825). IntegrationMessage keeps the raw message text (types.ts:1394) but the Booking does not; no history of wordings, no source system or time, no 'as given', no invoice description (invoice lines print the description).

**Impact.** Append-only source-text list on Procedure written by every intake path (manual create, integration, PDF ingest, matching screen), an editable invoiceDescription, and the stack on all booking screens, the review and the matching screen. Pairs with DM-13 (the chosen RVG sits under the text), DM-09 (line description) and DM-34.

**Catalogue:** [US-02.5.7](../../../../requirements-board/requirements/stories/US-02.5.7.md), [US-03.1.9](../../../../requirements-board/requirements/stories/US-03.1.9.md), [US-08.4.6](../../../../requirements-board/requirements/stories/US-08.4.6.md), [US-03.1.2](../../../../requirements-board/requirements/stories/US-03.1.2.md), [US-02.3.1](../../../../requirements-board/requirements/stories/US-02.3.1.md), [US-02.4.1](../../../../requirements-board/requirements/stories/US-02.4.1.md), [OQ-13](../../../../requirements-board/requirements/questions/OQ-13.md), [OQ-103](../../../../requirements-board/requirements/questions/OQ-103.md), [domain-model.md](../../../../requirements-board/requirements/domain-model.md)

**Prototype:** `aa-prototype/src/domain/types.ts:825`, `aa-prototype/src/domain/types.ts:1394`, `aa-prototype/src/store/integrationActions.ts:453`

## DM-11

### Who is billed: the Contract's holder or the payer named on the Booking, replacing the per-Procedure billable-party override and the billing routes

**Kind:** ChangedRelationship · **Size:** L

**Catalogue says.** Each Procedure's Contract decides who is billed: the holder's billable party record when the holder pays AA itself, otherwise the payer on the Booking. Every Booking names a payer (name and email) prefilled from the patient and editable by the office or the anaesthetist to a parent or guardian; the payer's email is required where the payer is billed; a patient under 18 as payer is a mild warning, not a block. A guardian is entered as the Booking's payer and kept for the life of the debt, not held as a master record. Billable parties are reference records (hospitals, surgeons, insurers and patients). One invoice per distinct billable party per Booking (FT-11.2, US-11.2.1 to US-11.2.4, US-04.2.1, US-08.2.1; OQ-67, OQ-54, OQ-78).

**Prototype has.** Per-Procedure: billablePartyId override pointing to a BillableParty master (a guardian record with relationship and contact; types.ts:195) created by createBillableParty (billablePartyActions.ts:21) with its own Xero contact (types.ts:1215). The default payer is the patient on the Billable Party route. The counterparty is a CounterpartyRef union of hospital, insurer, surgeon, organisation, patient and billableParty (types.ts:148) chosen by counterpartyForProcedure (invoiceBuild.ts:192). No Booking-level payer, no payer-email completion rule.

**Impact.** Booking gains payer fields (name, email), prefilled from the patient; counterparty resolution becomes holder-billable-party or Booking payer; the BillableParty master is repurposed as the reference table for hospitals, surgeons, insurers and patients, and the guardian master is replaced by the Booking payer; Xero contact keying stays on a hidden id (xeroHandoff.ts:79). 13 non-test files read billablePartyId. Needs DM-48 and DM-10; DM-28, DM-20 and DM-31 build on it.

**Catalogue:** [FT-11.2](../../../../requirements-board/requirements/stories/FT-11.2.md), [US-11.2.1](../../../../requirements-board/requirements/stories/US-11.2.1.md), [US-11.2.2](../../../../requirements-board/requirements/stories/US-11.2.2.md), [US-11.2.3](../../../../requirements-board/requirements/stories/US-11.2.3.md), [US-11.2.4](../../../../requirements-board/requirements/stories/US-11.2.4.md), [US-04.2.1](../../../../requirements-board/requirements/stories/US-04.2.1.md), [US-08.2.1](../../../../requirements-board/requirements/stories/US-08.2.1.md), [OQ-67](../../../../requirements-board/requirements/questions/OQ-67.md), [OQ-54](../../../../requirements-board/requirements/questions/OQ-54.md), [OQ-78](../../../../requirements-board/requirements/questions/OQ-78.md), [domain-model.md](../../../../requirements-board/requirements/domain-model.md)

**Prototype:** `aa-prototype/src/domain/types.ts:195`, `aa-prototype/src/domain/types.ts:148`, `aa-prototype/src/domain/billing/invoiceBuild.ts:192`, `aa-prototype/src/store/billablePartyActions.ts:21`

## DM-28

### Splitting a Procedure's fee between payers is a Booking action with typed $ or % shares, not a line-level funder override

**Kind:** ChangedEntity · **Size:** M

**Catalogue says.** On a Booking the user presses a button against a Procedure to split the invoiced fee between several billable parties; each share is a typed $ or %, and each party is invoiced its share on its own invoice. It is a user action, not a Contract or Procedure setting (the payment setting US-04.2.12 is Retired) and is separate from an additional invoice. The basis is our pick (OQ-68); whether % shares must total 100 is open (US-08.2.3, US-08.2.1, US-11.4.1; OQ-23).

**Prototype has.** BillingLine.funderOverride (types.ts:908) with a conservation rule (once any line is overridden, line amounts must sum to the computed fee); office-only allocation through setBillingLineAllocation (billingLineActions.ts:138) and setProcedureFunderAllocation (:218). Grouping invoices by distinct counterparty per Booking is built (invoiceBuild.ts:264) and aligned.

**Impact.** Replace line-level overrides with a per-Procedure shares record (party, $ or %); the validator and allocation sheet adapt; invoice grouping is unchanged. Must move together with DM-46, which removes BillingLine, the carrier of the override today. Needs DM-11.

**Catalogue:** [US-08.2.3](../../../../requirements-board/requirements/stories/US-08.2.3.md), [US-08.2.1](../../../../requirements-board/requirements/stories/US-08.2.1.md), [US-04.2.12](../../../../requirements-board/requirements/stories/US-04.2.12.md), [US-11.4.1](../../../../requirements-board/requirements/stories/US-11.4.1.md), [FT-08.2](../../../../requirements-board/requirements/stories/FT-08.2.md), [OQ-23](../../../../requirements-board/requirements/questions/OQ-23.md), [OQ-68](../../../../requirements-board/requirements/questions/OQ-68.md)

**Prototype:** `aa-prototype/src/domain/types.ts:908`, `aa-prototype/src/store/billingLineActions.ts:138`, `aa-prototype/src/store/billingLineActions.ts:218`, `aa-prototype/src/domain/billing/invoiceBuild.ts:264`

## DM-12

### The Booking carries the insurer and the insurance approval number, recorded by the office; insurance guides the Contract but never decides who is billed

**Kind:** NewEntity · **Size:** S

**Catalogue says.** Where a Booking is insured, the office records on it the insurer and the insurance approval number (the reference the insurer gives when it accepts the claim). A code such as SXAP from the rooms says the hospital is arranging the cover, not that it is approved. It is the office's job, not the anaesthetist's, who can complete the Booking without it; a Booking marked insured with no number sends the office to ring the rooms. A Booking that says an insurer will pay with no insurer Contract chosen is a warning at office review, not a block. No Insurer billing route remains. Open: whether the v6 design's insurer on the booking procedure is the same, and whether insurance narrows the Contract list (US-11.4.3, US-07.2.2, US-04.3.2; OQ-93).

**Prototype has.** None. Procedure.insurerId (types.ts:838) is the payee of the Insurer billing route; accRelated (types.ts:855) is an informational flag.

**Impact.** Booking gains an insurer reference and an approval number (office edit, shown at review); insurerId stops being a route; the review warning rule lands with DM-31. Small, but the storage place (Booking or Procedure) waits on OQ-93.

**Catalogue:** [US-11.4.3](../../../../requirements-board/requirements/stories/US-11.4.3.md), [US-07.2.2](../../../../requirements-board/requirements/stories/US-07.2.2.md), [US-04.3.2](../../../../requirements-board/requirements/stories/US-04.3.2.md), [FT-11.2](../../../../requirements-board/requirements/stories/FT-11.2.md), [FT-11.4](../../../../requirements-board/requirements/stories/FT-11.4.md), [OQ-93](../../../../requirements-board/requirements/questions/OQ-93.md), [domain-model.md](../../../../requirements-board/requirements/domain-model.md)

**Prototype:** `aa-prototype/src/domain/types.ts:838`, `aa-prototype/src/domain/types.ts:855`

## DM-30

### The NHI is mandatory with no blank: a Booking cannot be saved without one, and an incoming row without one waits at intake

**Kind:** RuleChange · **Size:** M

**Catalogue says.** Every patient record has an NHI from creation, with no blank and no pending state; the NHI is the patient identifier throughout (an internal ID is only an implementation detail) and the dedupe key, one record per NHI. A Booking cannot be saved without an NHI. An incoming booking (feed or surgeon PDF) with none waits on the matching screen's unmatched queue, creating neither a Booking nor a patient, until the office adds the NHI; the office sees the waiting rows, marked urgent as the date nears. The earlier idea of a Booking proceeding with the NHI pending and authorising blocked is dropped. The anaesthetist sees the NHI; Bookings are searchable by NHI or name (US-11.1.1, US-11.1.4, US-11.1.5, US-02.1.4, US-03.1.5, US-03.1.7; OQ-49 answered 16 and 19 October).

**Prototype has.** Patient.nhi is optional (types.ts:173); upsertPatient creates a 'createdProvisional' record when no NHI is given and reuses by NHI when present (intake.ts:52); the UI prints 'NHI pending' (shared/format.ts:86). Dual-format validation (nhi.ts) and the hidden internal ID kept for Xero are fine. No waiting-row queue, no save guard, no search by NHI.

**Impact.** Patient.nhi becomes required; remove the provisional path and 'NHI pending' state (16 non-test files read the NHI); creation paths (manual, integration, PDF) refuse or park a row without one; the waiting rows live in DM-34's unmatched queue; search by NHI or name. Replaces the earlier problem-list-and-authorise-block design. The seed's patients need checking for blank NHIs.

**Catalogue:** [US-11.1.1](../../../../requirements-board/requirements/stories/US-11.1.1.md), [US-11.1.4](../../../../requirements-board/requirements/stories/US-11.1.4.md), [US-11.1.5](../../../../requirements-board/requirements/stories/US-11.1.5.md), [US-02.1.4](../../../../requirements-board/requirements/stories/US-02.1.4.md), [US-03.1.5](../../../../requirements-board/requirements/stories/US-03.1.5.md), [US-03.1.7](../../../../requirements-board/requirements/stories/US-03.1.7.md), [OQ-49](../../../../requirements-board/requirements/questions/OQ-49.md), [OQ-30](../../../../requirements-board/requirements/questions/OQ-30.md)

**Prototype:** `aa-prototype/src/domain/types.ts:173`, `aa-prototype/src/store/intake.ts:52`, `aa-prototype/src/shared/format.ts:86`, `aa-prototype/src/domain/nhi.ts:1`

## DM-42

### A single Booking moves to a colleague by creating a List in the colleague's free Slot; whoever submits a List did its procedures

**Kind:** ChangedLifecycle · **Size:** M

**Catalogue says.** An anaesthetist can move a single Booking as well as a whole List, only to a colleague who is free in that Slot (found by scrolling or type-to-filter). The move creates a List in the colleague's Slot holding the Booking; a Booking is never moved into another anaesthetist's existing List, and two Lists in a Slot are not supported (for now; OQ-85). A receiver on leave first sets their own Slot available, which is their acceptance. The mover may notify the admin pool or raise the update email, neither required; no not-preferred warning. The List's anaesthetist did every procedure on it: a Booking done by someone else moves to a List of theirs, even a one-Booking List, and its payable follows; a prepaid Booking's payable is the holding account, so nothing moves and nothing is recalculated (US-01.4.7, US-01.4.6, US-06.5.4, US-13.8.2; OQ-85, OQ-70).

**Prototype has.** reassignBooking (lifecycle.ts:574) moves a Booking between Lists; an anaesthetist actor may only move between their own Lists (refused with 'notOwnList'), the office anywhere not AUTHORISED. The whole-List own move is built (listMoveActions.ts:208, :222, :240; Phase 32) but there is no single-Booking move, no creation of the receiver's List and no receiver-availability rule. Phase 32a is next.

**Impact.** An anaesthetist-actor single-Booking move that creates the receiver's List in a free Slot (the built Slot and List split makes this direct); the colleague finder (domain/listMoves.ts pushTargets :139) is reused for Bookings; an optional notice (DM-41). The earlier 'repoint the payable' step is gone: a payable follows the Booking by derivation and a prepaid one sits in the holding account (DM-21).

**Catalogue:** [US-01.4.7](../../../../requirements-board/requirements/stories/US-01.4.7.md), [US-01.4.6](../../../../requirements-board/requirements/stories/US-01.4.6.md), [US-06.5.4](../../../../requirements-board/requirements/stories/US-06.5.4.md), [US-13.8.2](../../../../requirements-board/requirements/stories/US-13.8.2.md), [US-01.4.2](../../../../requirements-board/requirements/stories/US-01.4.2.md), [OQ-85](../../../../requirements-board/requirements/questions/OQ-85.md), [OQ-70](../../../../requirements-board/requirements/questions/OQ-70.md)

**Prototype:** `aa-prototype/src/store/lifecycle.ts:574`, `aa-prototype/src/store/listMoveActions.ts:208`, `aa-prototype/src/domain/listMoves.ts:139`

## DM-41

### The shared notification pool gains an active or resolved state with who and when, and a second source: an anaesthetist's 'ask the office to check'

**Kind:** ChangedEntity · **Size:** M

**Catalogue says.** One pool for the whole admin team, separate from the to-do list, shown as a dashboard panel with active notices newest first and a count. A notice has two states only, active and resolved: any admin resolves it by ticking, which hides it for everyone (who and when are kept; a 'show resolved' filter brings it back), and it never expires; the same tick clears a to-do. There is no per-user read state. Sources: an anaesthetist moving a List (US-13.8.2) and, for now, an alert on a List or Booking with a note from an anaesthetist who is unsure about it ('ask the office to check', US-03.6.3, shown at office review in US-07.2.2); a single-Booking move may notify optionally (US-13.8.1, US-13.8.3, FT-13.8; OQ-79).

**Prototype has.** Built in Phase 32: Notification (types.ts:487), append-only, one kind 'listMoved', with 'no per-user, read or actioned state'; a Notifications screen and dashboard panel (store/notifications.ts, apps/admin/screens/NotificationsScreen.tsx). A notice cannot be resolved and nothing raises a check request.

**Impact.** Notification gains resolvedAtISO and resolvedBy (the append-only rule bends for the one tick), a 'show resolved' filter, a new kind carrying a note and a List or Booking link, an anaesthetist-app action, and review-queue visibility; the tick is shared with the warnings to-do (DM-31).

**Catalogue:** [FT-13.8](../../../../requirements-board/requirements/stories/FT-13.8.md), [US-13.8.1](../../../../requirements-board/requirements/stories/US-13.8.1.md), [US-13.8.2](../../../../requirements-board/requirements/stories/US-13.8.2.md), [US-13.8.3](../../../../requirements-board/requirements/stories/US-13.8.3.md), [US-03.6.3](../../../../requirements-board/requirements/stories/US-03.6.3.md), [US-07.2.2](../../../../requirements-board/requirements/stories/US-07.2.2.md), [OQ-79](../../../../requirements-board/requirements/questions/OQ-79.md)

**Prototype:** `aa-prototype/src/domain/types.ts:487`, `aa-prototype/src/store/notifications.ts:27`, `aa-prototype/src/apps/admin/screens/NotificationsScreen.tsx:1`

## DM-32

### The anaesthetist profile holds bank account details (the rest of the master data is built)

**Kind:** ChangedEntity · **Size:** S

**Catalogue says.** The anaesthetist profile holds contact details, registration number, HPI CPN where available, bank account details held in the system (not Xero only), and the dollar value per unit, which is the only billing setting; there is no GST period and no prepaid procedures. Surgeons' rooms (name, contact email and phone), the surgeon profile (room, registration number, HPI CPN), surgeon groups and a hospital contact email are master data (US-12.1.4, US-12.1.1, EP-12, US-13.6.1, US-13.6.2, US-13.4.1; OQ-14, OQ-52).

**Prototype has.** Built in Phase 17: surgeons' rooms, surgeon profile, surgeon groups and hospital contact email (types.ts:246, :260, :278, :286). Anaesthetist (types.ts:209) holds contact, unit value, HPI CPN, start date and active but no bank details, and still carries gstPeriod (see DM-29).

**Impact.** One field set on Anaesthetist plus an edit form in Master Data and seed values; used by the payables run's disbursement (DM-25; OQ-111). Low risk, can run any time. The earlier delta covered the whole profile; the rest is closed.

**Catalogue:** [US-12.1.4](../../../../requirements-board/requirements/stories/US-12.1.4.md), [US-12.1.1](../../../../requirements-board/requirements/stories/US-12.1.1.md), [EP-12](../../../../requirements-board/requirements/stories/EP-12.md), [US-13.6.1](../../../../requirements-board/requirements/stories/US-13.6.1.md), [US-13.6.2](../../../../requirements-board/requirements/stories/US-13.6.2.md), [OQ-14](../../../../requirements-board/requirements/questions/OQ-14.md), [OQ-52](../../../../requirements-board/requirements/questions/OQ-52.md)

**Prototype:** `aa-prototype/src/domain/types.ts:209`, `aa-prototype/src/store/mastersActions.ts:282`

## DM-34

### Hospital bookings land on a matching screen as import rows with an admin decision; unmatched rows and rows with no NHI wait in a queue

**Kind:** NewEntity · **Size:** L

**Catalogue says.** The first release takes hospital bookings however each hospital provides them (St George's and Southern Cross are in scope, the particulars still to come; one theatre list a day for the next day) onto a review-and-merge screen. For each row the admin matches it to a List and Booking, creates a Booking on an existing List, creates a List in an anaesthetist's Slot, creates a Draft List, or rejects it; a later update to a matched Booking shows field differences for approval; each row shows its procedure text as received. Rows that cannot be matched, and rows with no NHI, stay in the unmatched queue until the office decides or adds the NHI; nothing is applied silently. The automatic schedule, pull on open, sync button and last-synced time were removed (US-02.1.5). Detecting removals from a re-sent List (US-02.2.3), surgeon PDF ingest (US-02.2.1) and automatic matching (US-14.6.2) are Future Work (US-02.1.1 to US-02.1.5, FT-02.1, FT-14.6; OQ-13, OQ-109).

**Prototype has.** Simulated HL7 and FHIR messages are applied straight to Bookings by processMessage (integrationActions.ts:328), with statuses, retry and dead-letter in an IntegrationMessage log (types.ts:1394); ingestPdfRow (:453) is a canned PDF. Integration writes are gated only by List state (editRefusal, lifecycle.ts:50). 'hospitalRow' is reserved as a Draft List origin (types.ts:567) but nothing emits it. No import row, no match decision, no difference view, no unmatched queue.

**Impact.** New ImportRow and MatchDecision entities and a queue screen; Booking writes from feeds move behind approval; the HL7 and FHIR message log is demoted (FT-14.1 and FT-14.2 are Future) or becomes the row source. The Slot, List and Draft List entities it creates into are built (Phases 28 and 31). Needs DM-51 and DM-30.

**Catalogue:** [US-02.1.1](../../../../requirements-board/requirements/stories/US-02.1.1.md), [US-02.1.2](../../../../requirements-board/requirements/stories/US-02.1.2.md), [US-02.1.3](../../../../requirements-board/requirements/stories/US-02.1.3.md), [US-02.1.4](../../../../requirements-board/requirements/stories/US-02.1.4.md), [US-02.1.5](../../../../requirements-board/requirements/stories/US-02.1.5.md), [FT-02.1](../../../../requirements-board/requirements/stories/FT-02.1.md), [US-02.5.7](../../../../requirements-board/requirements/stories/US-02.5.7.md), [US-11.1.5](../../../../requirements-board/requirements/stories/US-11.1.5.md), [FT-14.6](../../../../requirements-board/requirements/stories/FT-14.6.md), [OQ-13](../../../../requirements-board/requirements/questions/OQ-13.md), [OQ-109](../../../../requirements-board/requirements/questions/OQ-109.md)

**Prototype:** `aa-prototype/src/store/integrationActions.ts:328`, `aa-prototype/src/store/integrationActions.ts:453`, `aa-prototype/src/domain/types.ts:1394`, `aa-prototype/src/domain/types.ts:567`, `aa-prototype/src/store/lifecycle.ts:50`

## DM-35

### Explicit-save change sets, an on-demand update email draft picked from the change history, and email templates

**Kind:** NewEntity · **Size:** M

**Catalogue says.** An admin saves Booking edits explicitly (unsaved-changes warning); each save records the fields changed (before, after, who, when) in the append-only change history. A Booking's admin screen has an on-demand 'draft update email' button: the admin picks one or more changes and a mailto compose window opens prefilled with subject, boilerplate, the changes and the To address (hospital contact for a cover change, surgeon's room for a Booking change), about 2,000 characters, nothing sent or recorded. The office is offered the cover-change email from a List-move notice. Templates are user-configurable per kind of change (US-02.3.2, US-02.3.3, US-02.3.4, US-02.5.5; OQ-69, OQ-46, OQ-82; automatic sending is Future, US-02.3.5).

**Prototype has.** Append-only audit per mutation (AuditEntry types.ts:1095, mutate.ts), not grouped into save sets; edits apply immediately (editBooking, lifecycle.ts:416); no email draft and no templates. The contact emails it needs now exist (hospital and room, Phase 17).

**Impact.** A change-set grouping on audit entries (or a draft buffer), an email-draft launcher and a template master; the admin edit form becomes explicit-save. Launched from DM-41 notices. DM-32's addressing data is already built.

**Catalogue:** [US-02.3.2](../../../../requirements-board/requirements/stories/US-02.3.2.md), [US-02.3.3](../../../../requirements-board/requirements/stories/US-02.3.3.md), [US-02.3.4](../../../../requirements-board/requirements/stories/US-02.3.4.md), [US-02.5.5](../../../../requirements-board/requirements/stories/US-02.5.5.md), [US-02.3.1](../../../../requirements-board/requirements/stories/US-02.3.1.md), [OQ-69](../../../../requirements-board/requirements/questions/OQ-69.md), [OQ-46](../../../../requirements-board/requirements/questions/OQ-46.md), [OQ-82](../../../../requirements-board/requirements/questions/OQ-82.md)

**Prototype:** `aa-prototype/src/domain/types.ts:1095`, `aa-prototype/src/store/lifecycle.ts:416`, `aa-prototype/src/store/mutate.ts:1`

## DM-38

### Reference data: a master public-holiday calendar, a repeatable one-off data load and maintenance screens for the new masters

**Kind:** ChangedEntity · **Size:** M

**Catalogue says.** Admins maintain all reference data in one place: hospitals with contact email, surgeons and surgeon groups, rooms, insurers, anaesthetists, Slot availability statuses, recurring bookings, the master public-holiday calendar and each hospital's own, RVG groups, modifiers, contract holders, and Contracts with their lines. It is loaded once by a developer-run data load (what is loaded, and from where, is not yet clear), repeatable so test systems can be wiped and reloaded, then edited by hand with every change recorded; clean cut, no migration. The Contract schedule upload is Future Work (US-04.2.13), its first-release need open (US-13.4.1, US-13.4.2, US-13.4.3, US-05.1.1; OQ-100).

**Prototype has.** The Master Data screen has CRUD for hospitals, anaesthetists, surgeons and rooms, statuses, recurring bookings, holidays and Contracts (mastersActions.ts, surgeonActions.ts, slotStatusActions.ts, contractActions.ts). Holidays are per hospital only (types.ts:1000) with no master calendar; seed data are TypeScript fixtures; no data-load script.

**Impact.** CRUD for the new masters (RVG groups DM-13, holders DM-48, Contracts DM-07 and DM-09, modifiers DM-44), a master holiday calendar feeding each hospital's, and optionally a repeatable load script for seeds. Mostly follows the entity deltas.

**Catalogue:** [US-13.4.1](../../../../requirements-board/requirements/stories/US-13.4.1.md), [US-13.4.2](../../../../requirements-board/requirements/stories/US-13.4.2.md), [US-13.4.3](../../../../requirements-board/requirements/stories/US-13.4.3.md), [US-04.2.13](../../../../requirements-board/requirements/stories/US-04.2.13.md), [FT-13.4](../../../../requirements-board/requirements/stories/FT-13.4.md), [US-01.5.1](../../../../requirements-board/requirements/stories/US-01.5.1.md), [OQ-100](../../../../requirements-board/requirements/questions/OQ-100.md)

**Prototype:** `aa-prototype/src/store/mastersActions.ts:57`, `aa-prototype/src/domain/types.ts:1000`, `aa-prototype/src/apps/admin/screens/masters/`

## DM-31

### Warning routine: the model and the dashboard to-do list are built; the remaining rules land as their source entities do

**Kind:** ChangedEntity · **Size:** M

**Catalogue says.** One routine checks Bookings and raises warnings, several per Booking, of a before- or after-procedure kind and mild or strong, which never block: unpaid prepayment, a billable patient with a balance, a child as payer, base units outside the RVG range, an insurer-will-pay Booking with no insurer Contract (office review). They show on the admin dashboard as a to-do list where an admin clears them, and as a warning triangle on the Booking in both apps, clearly visible when the anaesthetist opens it, with no confirm step on submit. Settings for thresholds and switching checks off are Future (FT-13.7, US-13.7.1 to US-13.7.3, US-07.2.2, US-11.3.2, US-11.2.4, US-03.3.1; US-13.7.4).

**Prototype has.** Built in Phases 15a and 15a2: Warning, WarningRule, WarningClearance and AppSettings (domain/warnings/types.ts), one registered rule 'prepaymentUnpaid' (WarningRuleId, types.ts:20), a stored office clearance outside the Booking, derived open warnings read by the admin dashboard to-do list (apps/admin/AdminApp.tsx:225) and a Booking flag in both apps.

**Impact.** Only the rules remain, each widening WarningRuleId as its source lands: child payer (DM-11), insurer-will-pay with no insurer Contract (DM-12), out-of-range units (DM-43), billable patient with a balance (DM-23). The dashboard tick also resolves notices (DM-41). A Contract changed by the anaesthetist is an audit and review flag (DM-10), not a warning.

**Catalogue:** [FT-13.7](../../../../requirements-board/requirements/stories/FT-13.7.md), [US-13.7.1](../../../../requirements-board/requirements/stories/US-13.7.1.md), [US-13.7.2](../../../../requirements-board/requirements/stories/US-13.7.2.md), [US-13.7.3](../../../../requirements-board/requirements/stories/US-13.7.3.md), [US-07.2.2](../../../../requirements-board/requirements/stories/US-07.2.2.md), [US-11.3.2](../../../../requirements-board/requirements/stories/US-11.3.2.md), [US-11.2.4](../../../../requirements-board/requirements/stories/US-11.2.4.md), [US-03.3.1](../../../../requirements-board/requirements/stories/US-03.3.1.md)

**Prototype:** `aa-prototype/src/domain/warnings/types.ts:20`, `aa-prototype/src/store/warnings.ts:112`, `aa-prototype/src/domain/warnings/rules/prepaymentUnpaid.ts:1`, `aa-prototype/src/apps/admin/AdminApp.tsx:225`

## DM-20

### Prepayment: started by picking a prepaid Contract, amount is the line's price, invoice generated when an admin approves it, nothing calculated afterwards

**Kind:** ChangedLifecycle · **Size:** L

**Catalogue says.** Picking a Contract flagged as prepaid starts the prepayment; it is always from a person paying for the patient, never an organisation (OQ-73), checked across the whole Booking and re-checked when Procedures, Contract or payer change (not on a move). The prepaid amount is the full price on that Contract's line, which always has one, shown to the anaesthetist; never a deposit, part or estimate. The invoice is generated when an admin approves it on the screen where outgoing invoices are approved (not at setup, not on receipt), then sent with a standard letter; its pair is a receivable from the payer on the Booking and a payable to the prepay holding account (DM-21); a later submit does not invoice it again. A prepaid Procedure keeps the price on its issued invoice if the Contract's price changes (OQ-104). After authorisation the prepaid amount is the price and BTM is reference only: no automatic invoice or credit, no threshold; extra work or a credit is raised by hand. Unpaid is a warning, never a gate (FT-06.2 to FT-06.4, US-06.2.1, US-06.2.2, US-06.3.1, US-06.3.2, US-06.3.5, US-06.3.6, US-06.4.1, US-08.2.2; OQ-76, OQ-92, OQ-96, OQ-97, OQ-116).

**Prototype has.** Prepayment is Procedure.patientPaymentCategory 'selfFundedPrepayment' plus prepaymentDetail full or split (types.ts:794, :804, :846, :848), derived on the Billable Party route (bookingRequiresPrepayment, selectors.ts:574). The office raises the pre-procedure invoice by hand (raisePreProcedureInvoice, prepaymentActions.ts:52); a split deposit is a flat agreed figure with the balance billed at the run and a visible netting line (invoiceBuild.ts:296 to :460); a full prepayment invoices an estimated fee computed by feeFor, not a Contract price. Status is derived (selectors.ts:639) and the unpaid warning is built (domain/warnings/rules/prepaymentUnpaid.ts), which is aligned.

**Impact.** Remove PrepaymentDetail, the split path and the payment category; the trigger and amount read from the prepaid Contract's line (needs the prepaid flag in DM-07, DM-09 and DM-11); Invoice gains a 'held for approval' state and a letter-template master; no balance invoice at the run. The visible deduction line stays for mixed Bookings pending OQ-116. The earlier per-anaesthetist prepaid setting (DM-19) is dropped. Before DM-21.

**Catalogue:** [FT-06.2](../../../../requirements-board/requirements/stories/FT-06.2.md), [FT-06.3](../../../../requirements-board/requirements/stories/FT-06.3.md), [FT-06.4](../../../../requirements-board/requirements/stories/FT-06.4.md), [US-06.2.1](../../../../requirements-board/requirements/stories/US-06.2.1.md), [US-06.2.2](../../../../requirements-board/requirements/stories/US-06.2.2.md), [US-06.3.1](../../../../requirements-board/requirements/stories/US-06.3.1.md), [US-06.3.2](../../../../requirements-board/requirements/stories/US-06.3.2.md), [US-06.3.5](../../../../requirements-board/requirements/stories/US-06.3.5.md), [US-06.3.6](../../../../requirements-board/requirements/stories/US-06.3.6.md), [US-06.4.1](../../../../requirements-board/requirements/stories/US-06.4.1.md), [US-08.2.2](../../../../requirements-board/requirements/stories/US-08.2.2.md), [OQ-92](../../../../requirements-board/requirements/questions/OQ-92.md), [OQ-96](../../../../requirements-board/requirements/questions/OQ-96.md), [OQ-97](../../../../requirements-board/requirements/questions/OQ-97.md), [OQ-104](../../../../requirements-board/requirements/questions/OQ-104.md), [OQ-116](../../../../requirements-board/requirements/questions/OQ-116.md)

**Prototype:** `aa-prototype/src/domain/types.ts:794`, `aa-prototype/src/domain/types.ts:804`, `aa-prototype/src/store/prepaymentActions.ts:52`, `aa-prototype/src/domain/billing/invoiceBuild.ts:296`, `aa-prototype/src/store/selectors.ts:574`, `aa-prototype/src/domain/warnings/rules/prepaymentUnpaid.ts:1`

## DM-21

### Prepay holding account: the prepayment's payable is a ledger account, and a second pair pays the anaesthetist who did the List at authorisation

**Kind:** NewEntity · **Size:** L

**Catalogue says.** A prepayment is not paid to the anaesthetist: the other side of its pair is a prepay holding account, which the ledger treats like an anaesthetist's account (its balance is all the deposits for procedures not yet done), within AA's trust accounting. Prepayment is two steps: the money is collected into the account, then when the office authorises the List a second pair moves it to whichever anaesthetist did the List, in place of another invoice to the patient. A cancelled Booking's prepayment is refunded in full from the account, recorded as a credit linked to the prepayment invoice that reverses its receivable and its payable to the account; a replacement Booking with another anaesthetist starts its own prepayment. A moved prepaid Booking changes nothing in the ledger (FT-06.4, FT-06.5, US-06.5.1 to US-06.5.4, US-09.1.3, US-08.3.1; OQ-70, OQ-80). Open: whether the cash refund is paid from the system or through Xero (OQ-115).

**Prototype has.** No holding account. Soft cancel keeps the Booking and charges no fee (cancelBooking, lifecycle.ts:362) but refunds nothing. The prepayment's ACCPAY is to the anaesthetist and is released pro rata as money is received (payableRelease.ts:16; paymentActions.ts:69), so the anaesthetist can be paid before the procedure.

**Impact.** A ledger account entity (balance, entries) as the payee of the prepayment pair; the release rule holds the prepayment payable until authorisation and then creates the second pair to the List's anaesthetist (so a move needs no payee change); a refund credit (needs DM-24); draft Xero pairs to the holding account. Needs DM-20 and DM-22. Supersedes the earlier 'trust account' and 'repoint the payable' reading.

**Catalogue:** [FT-06.4](../../../../requirements-board/requirements/stories/FT-06.4.md), [FT-06.5](../../../../requirements-board/requirements/stories/FT-06.5.md), [US-06.5.1](../../../../requirements-board/requirements/stories/US-06.5.1.md), [US-06.5.2](../../../../requirements-board/requirements/stories/US-06.5.2.md), [US-06.5.3](../../../../requirements-board/requirements/stories/US-06.5.3.md), [US-06.5.4](../../../../requirements-board/requirements/stories/US-06.5.4.md), [US-09.1.3](../../../../requirements-board/requirements/stories/US-09.1.3.md), [US-08.3.1](../../../../requirements-board/requirements/stories/US-08.3.1.md), [OQ-70](../../../../requirements-board/requirements/questions/OQ-70.md), [OQ-80](../../../../requirements-board/requirements/questions/OQ-80.md), [OQ-115](../../../../requirements-board/requirements/questions/OQ-115.md)

**Prototype:** `aa-prototype/src/store/lifecycle.ts:362`, `aa-prototype/src/domain/billing/payableRelease.ts:16`, `aa-prototype/src/store/paymentActions.ts:69`, `aa-prototype/src/store/prepaymentActions.ts:52`

## DM-17

### Events on a Procedure (pre-op, post-op, billing event, additional invoice, credit, refund) replace the post-op addendum Booking and the other billing lines

**Kind:** NewEntity · **Size:** L

**Catalogue says.** An event is anything recorded against a Procedure after it is set up: its own element attached to it, listed on the Procedure in both apps. Pre-op and post-op events carry their own date and time, record a time or a fixed fee, take no other modifiers, have an 'invoice' tick box and a 'same as the Procedure's billable party' tick. A billing event is a free-form charge with a text description, or a credit; the former other billing lines are merged into events, and a refund can also show as one. A billable event is its own line item on the Procedure's invoice if that is not yet approved, otherwise a separate invoice in the next run, through one standard review step; a Contract can replace a recorded time with a fixed fee. Covers pain management and ACC pre-op assessments (CS250, CS260, CS70 open) (FT-03.7, US-03.7.1 to US-03.7.3, US-08.6.1, US-05.5.2, FT-08.6; OQ-63, OQ-12).

**Prototype has.** A post-op addendum is a new linked Booking (bookingType 'postOpAddendum', addendumOfBookingId; types.ts:760) running its own capture, submit, authorise and bill cycle (addPostOpAddendum, bookingActions.ts:199). Late fee lines are BillingLines added before invoicing (addBillingLine, billingLineActions.ts:46). No event record, invoice tick, billable-party tick or same-run versus next-run rule.

**Impact.** New Event entity (procedure, kind, date and time, time or fixed fee, invoiced flag, billable party or same-as, invoice link); replaces the addendum Booking (6 non-test files) and the post-invoice billing-line path; the billing run picks events up; one review step; both apps list them. After DM-10 and DM-08; DM-18 and DM-24 are event kinds. DM-46's removal of BillingLine waits on this.

**Catalogue:** [FT-03.7](../../../../requirements-board/requirements/stories/FT-03.7.md), [US-03.7.1](../../../../requirements-board/requirements/stories/US-03.7.1.md), [US-03.7.2](../../../../requirements-board/requirements/stories/US-03.7.2.md), [US-03.7.3](../../../../requirements-board/requirements/stories/US-03.7.3.md), [US-08.6.1](../../../../requirements-board/requirements/stories/US-08.6.1.md), [US-05.5.2](../../../../requirements-board/requirements/stories/US-05.5.2.md), [FT-08.6](../../../../requirements-board/requirements/stories/FT-08.6.md), [OQ-63](../../../../requirements-board/requirements/questions/OQ-63.md), [OQ-12](../../../../requirements-board/requirements/questions/OQ-12.md), [domain-model.md](../../../../requirements-board/requirements/domain-model.md)

**Prototype:** `aa-prototype/src/store/bookingActions.ts:199`, `aa-prototype/src/store/billingLineActions.ts:46`, `aa-prototype/src/domain/types.ts:760`, `aa-prototype/src/domain/types.ts:897`

## DM-18

### Additional invoice: a free-form invoice recorded as an event, to any billable party, with its own ledger pair when raised after the original has gone

**Kind:** ChangedEntity · **Size:** L

**Catalogue says.** An admin (any Procedure) or the anaesthetist (their own Procedure) presses a button against a Procedure to add a free-form invoice (per line description, quantity, amount; no Contract or unit rules) to any billable party. It is traceable both ways to the original Procedure and invoice, recorded as an event, goes through the standard review step, and, being raised after the original invoice has gone, has its own invoice number, ledger pair, Xero pair and anaesthetist payable (an event raised before approval is a line on that invoice instead). Uses: late post-op charges, extra work after prepaid or fixed-price work, splitting a combined Procedure (a credit note, then additional invoices that total the credited amount; a split before the List is authorised is a normal edit) (US-08.6.1, US-08.6.3, US-08.6.4, US-08.4.3, US-11.3.3; OQ-72, OQ-77).

**Prototype has.** Invoice.kind 'standard' | 'prePayment' (types.ts:1120) with a bookingId and no link to an original invoice or Procedure; priced lines only (InvoiceLine.procedureId optional, types.ts:1131). No free-form entry and no second-invoice lineage.

**Impact.** Invoice.kind widens (additional, credit note), with originalInvoiceId and procedureId; free-form line entry UI in both apps; the same pair creation and Xero handoff as any invoice; an event added before approval joins the invoice. Needs DM-17 and DM-22.

**Catalogue:** [US-08.6.1](../../../../requirements-board/requirements/stories/US-08.6.1.md), [US-08.6.3](../../../../requirements-board/requirements/stories/US-08.6.3.md), [US-08.6.4](../../../../requirements-board/requirements/stories/US-08.6.4.md), [US-08.4.3](../../../../requirements-board/requirements/stories/US-08.4.3.md), [FT-08.6](../../../../requirements-board/requirements/stories/FT-08.6.md), [US-11.3.3](../../../../requirements-board/requirements/stories/US-11.3.3.md), [OQ-72](../../../../requirements-board/requirements/questions/OQ-72.md), [OQ-77](../../../../requirements-board/requirements/questions/OQ-77.md)

**Prototype:** `aa-prototype/src/domain/types.ts:1112`, `aa-prototype/src/domain/types.ts:1131`, `aa-prototype/src/domain/billing/invoiceBuild.ts:264`

## DM-24

### A wrong invoice is credited in full then rebilled; the payable is reversed by a negative invoice

**Kind:** NewLifecycle · **Size:** L

**Catalogue says.** An invoice is never edited, retracted or partly adjusted: it is credited in full (to any party, the original billable party included) and a new corrected invoice raised, each traceable to the original; the ledger payable and the Xero pair are reversed and re-created together. The reversal is a negative invoice to the anaesthetist, netted in their next payment run and shown on the remittance advice. A credit note is not a refund. The rebill may start from a draft copy of the original's lines. With no later payment to net against it is handled outside the system. Credit and new invoices are events on the Procedure (US-08.6.2, US-08.6.5, US-08.6.6, US-10.2.5, US-06.5.2; OQ-28, OQ-42, OQ-71, OQ-72, OQ-77).

**Prototype has.** Nothing: no credit note, no negative payable, no rebill; invoices are immutable once raised; BillingPipelineStatus runs pending, invoiced, handedOff, partPaid, paid, disbursed, failed, with no credited or reversed state (types.ts:1137 to :1145).

**Impact.** CreditNote entity linked to its invoice, a negative payable record and Xero credit mirroring, a rebill-from-copy action, new BillingCase states. Needs DM-18 and DM-22; precedes DM-25's netting and DM-21's refund.

**Catalogue:** [US-08.6.2](../../../../requirements-board/requirements/stories/US-08.6.2.md), [US-08.6.5](../../../../requirements-board/requirements/stories/US-08.6.5.md), [US-08.6.6](../../../../requirements-board/requirements/stories/US-08.6.6.md), [US-10.2.5](../../../../requirements-board/requirements/stories/US-10.2.5.md), [US-06.5.2](../../../../requirements-board/requirements/stories/US-06.5.2.md), [FT-08.6](../../../../requirements-board/requirements/stories/FT-08.6.md), [OQ-28](../../../../requirements-board/requirements/questions/OQ-28.md), [OQ-42](../../../../requirements-board/requirements/questions/OQ-42.md), [OQ-71](../../../../requirements-board/requirements/questions/OQ-71.md), [OQ-72](../../../../requirements-board/requirements/questions/OQ-72.md)

**Prototype:** `aa-prototype/src/domain/types.ts:1147`, `aa-prototype/src/store/billingRun.ts:69`

## DM-22

### The internal ledger holds both halves of each pair as its own records (including the holding-account payable), with the payable independent of Xero

**Kind:** ChangedEntity · **Size:** L

**Catalogue says.** For every invoice the engine creates a linked receivable from the billable party and a payable to the anaesthetist in its own ledger, the system of record, which Xero only mirrors as an ACCREC and a draft ACCPAY created together (a prepayment's payable is to the holding account instead). The ledger tracks money in and money out per patient and per anaesthetist and survives Xero contact archiving. Invoices are presented in the anaesthetist's name with AA as agent and a unique number; the payable carries the receivable's number with a '-P' suffix; each payable is a buyer-created tax invoice (new IRD name to confirm), one per procedure (FT-08.3, US-08.3.1 to US-08.3.4, US-08.4.3, US-08.4.5, US-09.1.1, US-09.1.4, US-10.1.2, EP-08; OQ-29, OQ-111).

**Prototype has.** The ledger is the billing slice (Invoice, InvoiceLine, BillingCase with receivedAmount, authorisedAmount, disbursedAmount and Xero ids; types.ts:1112 to :1182), which the code calls a mirror and the apps read instead of Xero. The payable document and its amounts exist only as XeroAccPay in the Xero simulation (types.ts:1244), so the payable has no ledger record of its own. The '-P' number is stored (types.ts:1250); no buyer-created tax invoice wording.

**Impact.** Promote the Payable into the ledger (id, number, amount, authorised, disbursed, status, payee: anaesthetist or holding account) with Xero downstream; split BillingCase into receivable and payable sides; rewire payments, the payables run, selectors and the Xero view. Foundation for DM-21, DM-18, DM-24, DM-23, DM-25 and DM-29.

**Catalogue:** [FT-08.3](../../../../requirements-board/requirements/stories/FT-08.3.md), [US-08.3.1](../../../../requirements-board/requirements/stories/US-08.3.1.md), [US-08.3.2](../../../../requirements-board/requirements/stories/US-08.3.2.md), [US-08.3.3](../../../../requirements-board/requirements/stories/US-08.3.3.md), [US-08.3.4](../../../../requirements-board/requirements/stories/US-08.3.4.md), [US-08.4.3](../../../../requirements-board/requirements/stories/US-08.4.3.md), [US-08.4.5](../../../../requirements-board/requirements/stories/US-08.4.5.md), [US-09.1.1](../../../../requirements-board/requirements/stories/US-09.1.1.md), [US-09.1.4](../../../../requirements-board/requirements/stories/US-09.1.4.md), [US-10.1.2](../../../../requirements-board/requirements/stories/US-10.1.2.md), [OQ-29](../../../../requirements-board/requirements/questions/OQ-29.md), [OQ-111](../../../../requirements-board/requirements/questions/OQ-111.md)

**Prototype:** `aa-prototype/src/domain/types.ts:1147`, `aa-prototype/src/domain/types.ts:1244`, `aa-prototype/src/store/xeroHandoff.ts:179`, `aa-prototype/src/store/paymentActions.ts:69`, `aa-prototype/src/store/payablesActions.ts:147`

## DM-23

### Derived ledger positions for the whole ledger, per anaesthetist and per patient; a flat outstanding list without ageing; patient balance alerts

**Kind:** NewRelationship · **Size:** M

**Catalogue says.** The Admin App shows the ledger's position at two scopes, the whole ledger (receivables outstanding, receipts held, payables due, amounts disbursed, any imbalance) and a single anaesthetist, and a patient's outstanding invoices across all anaesthetists, patient-centric even when a guardian pays (FT-13.2, US-13.2.1, US-13.2.2, US-08.3.5, US-11.3.1; the per-anaesthetist story US-13.2.3 is merged into US-13.2.1). The anaesthetist's outstanding list is flat, oldest first, with no ageing buckets or chips (US-12.2.1). Booking or matching a patient with a balance alerts staff: mild under the threshold (90 days from the invoice date, fixed until AA asks), strong above, mild for a credit balance, never a block; follow-up actions and invoice re-send are recorded (US-11.3.2, US-11.3.3; OQ-41, OQ-74, OQ-59).

**Prototype has.** A per-anaesthetist outstanding list built per ACCPAY invoice with agingDays and a bucket (selectors.ts:874 to :952, AgingBuckets; used by apps/web/screens/AccountsScreen.tsx), which the catalogue now excludes. A boolean patientHasOutstandingPriorEpisode intake check (selectors.ts:552) shown as 'Prior balance' in the billing monitor; no threshold, mild or strong. No admin whole-ledger, per-anaesthetist or per-patient balance screen; no follow-up record.

**Impact.** New pure selectors over the ledger and three admin views; remove the ageing buckets from the web Accounts and dashboard screens; the threshold in appSettings; a FollowUpAction record. Needs DM-22 and DM-11; the alert rule lands in DM-31.

**Catalogue:** [FT-13.2](../../../../requirements-board/requirements/stories/FT-13.2.md), [US-13.2.1](../../../../requirements-board/requirements/stories/US-13.2.1.md), [US-13.2.2](../../../../requirements-board/requirements/stories/US-13.2.2.md), [US-08.3.5](../../../../requirements-board/requirements/stories/US-08.3.5.md), [US-12.2.1](../../../../requirements-board/requirements/stories/US-12.2.1.md), [FT-11.3](../../../../requirements-board/requirements/stories/FT-11.3.md), [US-11.3.1](../../../../requirements-board/requirements/stories/US-11.3.1.md), [US-11.3.2](../../../../requirements-board/requirements/stories/US-11.3.2.md), [US-11.3.3](../../../../requirements-board/requirements/stories/US-11.3.3.md), [OQ-41](../../../../requirements-board/requirements/questions/OQ-41.md), [OQ-74](../../../../requirements-board/requirements/questions/OQ-74.md), [OQ-59](../../../../requirements-board/requirements/questions/OQ-59.md)

**Prototype:** `aa-prototype/src/store/selectors.ts:874`, `aa-prototype/src/store/selectors.ts:552`, `aa-prototype/src/apps/web/screens/AccountsScreen.tsx:32`

## DM-25

### Weekly payment cycle with period approval of BCTIs and a remittance advice that nets negative invoices

**Kind:** NewEntity · **Size:** M

**Catalogue says.** A payable is released when its receivable is paid, for exactly the amount received. Payments run on a weekly cycle named by ISO week: Friday the ledger is closed and snapshotted, Monday for the office to clear problems, Tuesday the schedule of released payables goes to the accountant, anomalies roll into the next cycle; a payment is shown against its week number. BCTIs for a period are approved for payment before the run (who approves is open). The anaesthetist's remittance advice shows invoices paid and negative invoices netted (US-10.2.1, US-10.2.5, US-10.2.6, US-10.2.7, FT-10.2; OQ-47). Whether the payment is made in Xero or from the new system is OQ-111.

**Prototype has.** runPayables (payablesActions.ts:147) pays every authorised-minus-disbursed amount at once under a payablesRunId (Disbursement, types.ts:1361). No cycle or week identity, no approval state, no held-out anomalies, no remittance advice, no netting.

**Impact.** PaymentRun entity (ISO week, status, held-out items), an approval state on payables, a remittance document, and netting of negative payables. Needs DM-24 and DM-22. Proposed in the catalogue, so keep it replaceable.

**Catalogue:** [US-10.2.1](../../../../requirements-board/requirements/stories/US-10.2.1.md), [US-10.2.5](../../../../requirements-board/requirements/stories/US-10.2.5.md), [US-10.2.6](../../../../requirements-board/requirements/stories/US-10.2.6.md), [US-10.2.7](../../../../requirements-board/requirements/stories/US-10.2.7.md), [FT-10.2](../../../../requirements-board/requirements/stories/FT-10.2.md), [OQ-47](../../../../requirements-board/requirements/questions/OQ-47.md), [OQ-111](../../../../requirements-board/requirements/questions/OQ-111.md)

**Prototype:** `aa-prototype/src/store/payablesActions.ts:147`, `aa-prototype/src/domain/types.ts:1361`, `aa-prototype/src/store/paymentActions.ts:69`

## DM-29

### The GST report lists the payments AA passed to the anaesthetist in the month; the anaesthetist's GST period goes

**Kind:** RuleChange · **Size:** M

**Catalogue says.** Each month each anaesthetist gets a list of the payments AA has passed to them in the month, with the GST component of each, for their GST return. It lists payments, not invoices sent, since an invoice may be paid in part; anything outstanding falls into a later month. It is something to download, email or print, so it suits the web app. There is no GST period on the profile (US-12.1.2 Retired: 'all they have is a unit rate'). All prices are held ex GST (US-12.2.2, EP-12, US-12.1.1, US-05.2.7; OQ-29).

**Prototype has.** BillingReceipt carries a GST component of amounts received into AA (types.ts:1192; gstComponentOf, paymentActions.ts:34); the web Accounts screen's GST report reads those receipts. Anaesthetist.gstPeriod 'monthly' | 'biMonthly' | 'sixMonthly' (types.ts:215, :237) is held and edited (10 non-test files).

**Impact.** Re-base the report on payments made to the anaesthetist (the payable's paid side from DM-22) and group by calendar month; remove gstPeriod, its seed values and its editor. Follows DM-22.

**Catalogue:** [US-12.2.2](../../../../requirements-board/requirements/stories/US-12.2.2.md), [US-12.1.2](../../../../requirements-board/requirements/stories/US-12.1.2.md), [US-12.1.1](../../../../requirements-board/requirements/stories/US-12.1.1.md), [US-05.2.7](../../../../requirements-board/requirements/stories/US-05.2.7.md), [EP-12](../../../../requirements-board/requirements/stories/EP-12.md), [OQ-29](../../../../requirements-board/requirements/questions/OQ-29.md)

**Prototype:** `aa-prototype/src/domain/types.ts:215`, `aa-prototype/src/domain/types.ts:1192`, `aa-prototype/src/store/paymentActions.ts:34`, `aa-prototype/src/apps/web/screens/AccountsScreen.tsx:39`

## DM-45

### Audit covers invoices, credit notes, master data and Contract changes but not disbursements, payments or receipts

**Kind:** RuleChange · **Size:** S

**Catalogue says.** The audit trail shows who or what made each audited change: creates, updates, reassignments, authorisations, invoices, credit notes, master data changes, and Contract and time-entry changes. Disbursements, payments and receipts are not audited there, since they are recorded in Xero; how deep the audit goes is for the developers (US-13.5.2, FT-13.5).

**Prototype has.** Every mutation is audited through mutate(), including simulated Xero payments and disbursements (paymentActions.ts 'xero.paymentReceived' at :186 and 'xero.accpayAuthorised' at :193; payablesActions.ts 'xero.disbursed' at :132).

**Impact.** Not a structural gap, kept as a small policy delta (verifier: the catalogue states an exclusion the prototype does not honour, but nothing is missing): the prototype audits a superset, so nothing has to change. A policy note: audit stays uniform in the demo, or payment and disbursement entries are filtered out of the audit viewer. Credit notes (DM-24) and Contract versions (DM-07) must be audited.

**Catalogue:** [US-13.5.2](../../../../requirements-board/requirements/stories/US-13.5.2.md), [FT-13.5](../../../../requirements-board/requirements/stories/FT-13.5.md), [domain-model.md](../../../../requirements-board/requirements/domain-model.md)

**Prototype:** `aa-prototype/src/store/paymentActions.ts:186`, `aa-prototype/src/store/payablesActions.ts:132`, `aa-prototype/src/store/mutate.ts:1`

## DM-55

### A SUBMITTED List stays editable by the anaesthetist until AUTHORISED, and a List leaves the anaesthetist's main view at AUTHORISED

**Kind:** ChangedLifecycle · **Size:** M

**Catalogue says.** Once a List is SUBMITTED the anaesthetist can still see it and change its Bookings until the office authorises it; changes are audited, the office sees them at review, the last change stands and neither side has authority over the other. Submitting only tells the office it has work to do and makes the List less prominent. The anaesthetist's main view shows upcoming work, earlier Lists not yet authorised and submitted ones not yet authorised; an authorised List leaves the main view (not at submit, not when billed, not on payment), its invoices show as outstanding balances, and it stays findable by search on patient name, NHI or date. AUTHORISED stays immutable (US-07.2.1, US-07.2.3, FT-07.2, US-07.4.1, US-07.4.2, US-03.1.6, US-03.1.7, US-07.3.2; OQ-31).

**Prototype has.** editRefusal refuses an anaesthetist once a List is SUBMITTED ('Only the office can change it now'; lifecycle.ts:50 to :75, reassignBooking :574, the mobile submit flow). A List leaves the anaesthetist's forward views when the billing run stamps List.billedAtISO (types.ts:641; selectors.ts:390; apps/mobile/screens/ForwardListsScreen.tsx:76; apps/web/screens/DashboardScreen.tsx:88), not at AUTHORISED. The earlier pass counted both as aligned.

**Impact.** Relax the anaesthetist edit rule to ACTIVE and SUBMITTED (16 non-test files name 'SUBMITTED'), keep AUTHORISED locked, and make anaesthetist edits to a SUBMITTED List visible at review (audit already records them); switch the forward-view filter from billedAtISO to AUTHORISED and keep search for older work (catch-up Phase 38a). The billedAtISO stamp stays for the office monitor.

**Catalogue:** [US-07.2.1](../../../../requirements-board/requirements/stories/US-07.2.1.md), [US-07.2.3](../../../../requirements-board/requirements/stories/US-07.2.3.md), [FT-07.2](../../../../requirements-board/requirements/stories/FT-07.2.md), [US-07.4.1](../../../../requirements-board/requirements/stories/US-07.4.1.md), [US-07.4.2](../../../../requirements-board/requirements/stories/US-07.4.2.md), [US-03.1.6](../../../../requirements-board/requirements/stories/US-03.1.6.md), [US-03.1.7](../../../../requirements-board/requirements/stories/US-03.1.7.md), [US-07.3.2](../../../../requirements-board/requirements/stories/US-07.3.2.md), [OQ-31](../../../../requirements-board/requirements/questions/OQ-31.md)

**Prototype:** `aa-prototype/src/store/lifecycle.ts:50`, `aa-prototype/src/store/lifecycle.ts:574`, `aa-prototype/src/domain/types.ts:641`, `aa-prototype/src/store/selectors.ts:390`, `aa-prototype/src/apps/mobile/screens/ForwardListsScreen.tsx:76`

## DM-56

### An anaesthetist's unavailability is never a conflict: conflicts cover hospital closures only

**Kind:** RuleChange · **Size:** M

**Catalogue says.** A List conflicts only when its hospital is closed: a soft warning, never a block. An anaesthetist's unavailability, short-notice sickness included, is never a conflict flag: a List never stays with an anaesthetist who is unavailable, and they return it to the office or assign it to a colleague there and then, choosing what the vacated Slot becomes. A recurring booking landing on an unavailable Slot becomes a Draft List (US-01.5.2, US-01.5.4, US-01.5.5, US-01.4.3, US-01.3.2; OQ-81, OQ-84).

**Prototype has.** ListConflict kind 'availability' | 'holiday' (types.ts:446); conflicts.ts derives an availability conflict for a List in a Slot with a closed status (expectedConflicts, conflicts.ts:114). The anaesthetist's own path is guarded (return or assign, built in Phase 32), but the office's sickness-record path keeps the List with the availability conflict as 'OQ-81 part 3, provisional' (availabilityActions.ts:190 applySessionWrites; store/demoSimulations.ts:49 simulateSickness; the Conflicts screen).

**Impact.** Remove the 'availability' conflict kind and its derivation; the office recording sickness must also force a return or assign (or send the List to the Draft Lists); the Conflicts screen and dashboard shrink to holiday closures; tests and the sickness demo trigger are rewritten. Independent of every other delta.

**Catalogue:** [US-01.5.2](../../../../requirements-board/requirements/stories/US-01.5.2.md), [US-01.5.4](../../../../requirements-board/requirements/stories/US-01.5.4.md), [US-01.5.5](../../../../requirements-board/requirements/stories/US-01.5.5.md), [US-01.4.3](../../../../requirements-board/requirements/stories/US-01.4.3.md), [US-01.3.2](../../../../requirements-board/requirements/stories/US-01.3.2.md), [OQ-81](../../../../requirements-board/requirements/questions/OQ-81.md), [OQ-84](../../../../requirements-board/requirements/questions/OQ-84.md), [domain-model.md](../../../../requirements-board/requirements/domain-model.md)

**Prototype:** `aa-prototype/src/domain/types.ts:446`, `aa-prototype/src/domain/conflicts.ts:114`, `aa-prototype/src/store/availabilityActions.ts:190`, `aa-prototype/src/store/demoSimulations.ts:49`

## DM-57

### Contract changes are staged, reviewed on a dashboard and submitted together as a new dated version

**Kind:** NewEntity · **Size:** M

**Catalogue says.** The office maintains one Contract at a time on a header and lines screen. Edits are not applied straight away but staged and shown on a review dashboard for that Contract; the office reviews them, sets the effective date and submits together, all or nothing, creating the new dated version and recording what changed. The dashboard shows header changes before and after, counts of lines added, altered, removed and unchanged, each altered line's changed values (highlighting any that become blank), errors that block submit (duplicate codes, a missing or past effective date, a second future-dated version) and warnings that do not (affected Bookings). A one-line fix follows the same path. Upload in the AA template (Alter or Replace) is Future Work (US-04.1.6, US-04.1.2, US-04.1.3, US-04.2.10, US-04.2.13; OQ-100 open for the first release).

**Prototype has.** contractActions.ts edits a Contract and its price rows in place, immediately, with an audit entry (createContract :53, editContract :106, addContractPrice :200, editContractPrice :235). No staged change set, no diff, no effective-date step.

**Impact.** A staged ContractChange per Contract (header patch plus line adds, alters, removes) applied only on submit, a pure diff builder, and the review dashboard screen; submit creates the version through DM-07 and runs the relink and the affected-Booking list. After DM-07 and DM-09. The upload path stays out.

**Catalogue:** [US-04.1.6](../../../../requirements-board/requirements/stories/US-04.1.6.md), [US-04.1.2](../../../../requirements-board/requirements/stories/US-04.1.2.md), [US-04.1.3](../../../../requirements-board/requirements/stories/US-04.1.3.md), [US-04.2.10](../../../../requirements-board/requirements/stories/US-04.2.10.md), [US-04.2.13](../../../../requirements-board/requirements/stories/US-04.2.13.md), [OQ-100](../../../../requirements-board/requirements/questions/OQ-100.md), [domain-model.md](../../../../requirements-board/requirements/domain-model.md)

**Prototype:** `aa-prototype/src/store/contractActions.ts:53`, `aa-prototype/src/store/contractActions.ts:106`, `aa-prototype/src/store/contractActions.ts:200`
