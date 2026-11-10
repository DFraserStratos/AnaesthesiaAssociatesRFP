# Phase 39b · Pre-op, post-op and billing events

**Requirements covered:**
[FT-03.7](../../../../requirements-board/requirements/stories/FT-03.7.md) Events on a Procedure (**Verify** since 4 November; the former other billing lines merged into it, an event may be added at any time, each event has its own billable party, events live with the Booking and appear on no List or schedule, even when dated on another day, and (OQ-121 answered, D69) an event marked for invoicing is billed in the next billing run, never held for the Procedure's invoice; this phase builds its pre-op, post-op and billing kinds, the admin entry, the invoice tick and the "same as" billable party) ·
[US-03.7.1](../../../../requirements-board/requirements/stories/US-03.7.1.md) Add a pre-op or post-op event to a Procedure (Agreed; **new criterion 28 October**: an event dated on another day is not on that day's List; the billable party defaults to the Procedure's, our reading, Greg doubtful; the ACC codes parked) ·
[US-03.7.2](../../../../requirements-board/requirements/stories/US-03.7.2.md) Bill an event (**Verify**: a billing event is a free-form way to invoice on a Procedure and its Contract, a charge with a free-text description or a credit, its own line; **three new criteria 4 November** (OQ-121 answered, D69): next run, bundled where possible, on its own; the billing rule is 38b's one rule) ·
[US-05.5.2](../../../../requirements-board/requirements/stories/US-05.5.2.md) ACC pre-op flat fee codes (**Agreed** 28 October: the ACC pre-op follows the generic event and pricing rules, no fixed-fee Contract line, ACC being a funding tag on a holder's Contract (18a); some ACC pre-op events may be preconfigured, otherwise free text; OQ-12 part 2 answered, whether CS250, CS260 and CS70 are the right codes is still OQ-12 part 1; billed in the next run like every event, OQ-121) ·
[DM-46](../analysis/domain-model-delta.md#dm-46) The BillingLine entity removed (**joined from Phase 24 at d4db277**: about 25 non-test files, `chargeBasis`, the add-line sheet and billing-lines card, the seeded lines re-expressed as billing events; Phase 24 removed only the rate x time line and its gate).

**Left this phase at d4db277:** [US-03.3.6](../../../../requirements-board/requirements/stories/US-03.3.6.md) Other billing lines (**Retired**, merged into FT-03.7; Donald: a billing event is "basically a flexible tool to add another invoicing event to a procedure"). Its work went into billing events (US-03.7.2): no preset line types, no line date, no `addLateBillingLine`, no "late line" event; the Add billing line sheet and the billing-lines card are removed (work item 5), not extended. The UNIT x RATE line and the Contract add-on fee are catalogue-retired (7 October); none is built, and any remnant found is removed.

Read alongside (not closed here):
[US-03.7.3](../../../../requirements-board/requirements/stories/US-03.7.3.md)
(see a Procedure's events; Phase 38b built the events list, and this phase's kinds appear in it),
[US-03.7.4](../../../../requirements-board/requirements/stories/US-03.7.4.md)
(the pre-op consult in AA's room: **parked** on [OQ-138](../../../../requirements-board/requirements/questions/OQ-138.md); nothing is built for it),
[DM-17](../analysis/domain-model-delta.md#dm-17) (the event element; Phase 38b built it, this phase
adds kinds to it),
[US-08.6.1](../../../../requirements-board/requirements/stories/US-08.6.1.md) and
[US-08.6.3](../../../../requirements-board/requirements/stories/US-08.6.3.md)
(the free-form additional invoice, an event kind Phase 38b built; it stays the way to invoice several
lines at once or to any party after the invoice; a billing event is the one-line charge or credit that
can also ride on the Procedure's invoice),
[US-08.6.5](../../../../requirements-board/requirements/stories/US-08.6.5.md)
(the credit note option, Phase 39: a credit billing event raised after the invoice goes through it),
[US-05.2.6](../../../../requirements-board/requirements/stories/US-05.2.6.md)
(RVG at the Contract's rate: a rate Contract's unit rate prices the whole Procedure; a timed event reads the same
rate, work item 2),
[US-05.2.5](../../../../requirements-board/requirements/stories/US-05.2.5.md)
(on a fixed-price Contract the system calculates nothing further and extra work is an ad hoc invoice or
credit by hand; so a billing event, typed by hand, is allowed on a fixed-price Procedure, and this phase
refuses only to calculate a timed event there),
[US-04.2.4](../../../../requirements-board/requirements/stories/US-04.2.4.md) (Retired 5 November: each priced
item is a Contract of its own, D1; there are no lines, so nothing here reads one),
[US-05.2.1](../../../../requirements-board/requirements/stories/US-05.2.1.md) (the anaesthetist's own
unit value, from 26's profile),
[FT-11.2](../../../../requirements-board/requirements/stories/FT-11.2.md) (who is billed; Phase 21's one
function),
[US-07.3.2](../../../../requirements-board/requirements/stories/US-07.3.2.md) (the Booking is immutable
after AUTHORISED: an event never edits it),
[US-09.1.4](../../../../requirements-board/requirements/stories/US-09.1.4.md) and
[US-10.3.1](../../../../requirements-board/requirements/stories/US-10.3.1.md)
(an event's own invoice is its own receivable, so its ACCPAY is one more BCTI in Phase 16's count; an
event line on the Procedure's invoice adds none),
[OQ-63](../../../../requirements-board/requirements/questions/OQ-63.md) (Answered, owner decision
D13, extended 16 October: one name, "event", for everything recorded against a Procedure after setup;
its own element, a line item, one review step, an invoice tick; other billing lines are events; events at any time; part 4 reopened 28 October and settled by OQ-121's answer),
[OQ-121](../../../../requirements-board/requirements/questions/OQ-121.md) (**Answered 4 November**, D69, Donald for the build, not yet seen by Vanessa: every event is billed in the next run through 38b's review step, bundled with the same party's invoice where it can be, otherwise on its own),
[OQ-12](../../../../requirements-board/requirements/questions/OQ-12.md) (Open: part 2 **answered 28 October**, no fixed-fee Contract; part 1, whether the ACC codes CS250, CS260 and CS70 are right, is still open with AA's accountant),
[OQ-48](../../../../requirements-board/requirements/questions/OQ-48.md) (**Answered**
2026-10-07, D45: the procedure date decides the price in force; it governs a fixed price's range, which an
event never reads, so an event's own date picks no price),
[OQ-50](../../../../requirements-board/requirements/questions/OQ-50.md) (Answered:
time units come from the RVG rules only) and
[OQ-75](../../../../requirements-board/requirements/questions/OQ-75.md) (Answered,
D25: a part interval is always rounded up, 15 minutes for the first two hours, then 10; Phase 19a
holds the tiers as data),
[OQ-29](../../../../requirements-board/requirements/questions/OQ-29.md) and
[OQ-60](../../../../requirements-board/requirements/questions/OQ-60.md) (BCTI
granularity and what the AA fee counts; open, kept in Phase 16's count function), the meeting notes
`requirements-board/requirements/notes/2026-10-01-aa-meeting-with-greg.md` (#6, #34, #46, #54, #61),
`requirements-board/requirements/notes/2026-10-02-aa-meeting-with-greg.md` (#4, #24, #25, #26, #35, #44) and
`requirements-board/requirements/notes/2026-10-16-aa-meeting-with-greg.md` (#45, #59, #60, #61, #62) and
`requirements-board/requirements/notes/2026-10-28-aa-meeting-with-greg.md` (#9, #23, #24, #31, #81)
(see Reference), and the Procedure section (its events paragraph) and glossary of
[domain-model.md](../../../../requirements-board/requirements/domain-model.md).

**The pricing model it reads** (Donald's flat Contract model of 5 November, D1 to D11: made for the build, not
yet confirmed by AA or Greg; no Contract lines, versions or staged changes): an event is priced from the
Procedure's own Contract through the one pricing function Phase 24 keeps in `aa-prototype/src/domain/billing`.
The reference is the proposal [AR-58](../../../../requirements-board/requirements/artifacts/AR-58.md) at 2.2 and
2.3 (the Contract and its five pricing kinds: `rvgAnaesthetistRate`, `rvgContractRate` with its `unitRate`,
`rvgDiscount` with its `discountPct`, `fixed`, `open`), 5.7 (a Procedure's price follows its Contract's settings
until held; rates and discounts are undated) and 5.9 (an event attaches to a Procedure and its billable party
defaults to the Procedure's; fee extras on a schedule are billing events, never Contracts, D10), with the flat
ERD [AR-61](../../../../requirements-board/requirements/artifacts/AR-61.md). The proposal has no event fee: this
phase's one addition to the Contract, the **Contract event fee** (work item 1), sits beside the Contract in the
same module, so a model change stays a contained edit.

**Depends on:** 24 (the one pricing function over the five pricing kinds, each kind's rate and discount,
`PriceSource`; 24 removed the rate x time line and its gate and left the BillingLine entity, fixed amount only,
which this phase removes), 38a (the main view, the date lookup and the search that reach a past
Procedure on mobile and web, since an invoiced List leaves the main view; its handoff names the
controls a billed Booking may show) and 38b (the event element on the Procedure, its one standard
review step and next-run invoicing, the events list on every Procedure in all three apps, the one
user-facing label for "event", `EVENT_RULES.anaesthetistSees`, the additional-invoice kind raised by
the office or by the anaesthetist on their own Procedure, `procedureOwner` and `mayRaise`, the
`run-next-billing-run` trigger and the PWA stand-in `office-reviews-additional-invoice`). It needs
nothing from 39 or 39a to build, so it may run straight after 38b; by the roadmap number 39 runs
first, and if it has run, a credit billing event after the invoice reuses its credit note (work item 4).
By the roadmap order 14 (the demo-trigger
registry, `useDemoTriggerContext`, the PWA sheet, `OFFICE_ACTOR` and `OFFICE_SIMULATION_ACTOR`,
"Office authorises this List"), 15 (Booking vocabulary and the `.../bookings/:bookingId` routes),
15a (the warning triangle; no rule is added here; no submit confirm step), 15b (ACTIVE for an
assigned List), 16 (the `-P` rule and the BCTI count, `bctiRecords` and `bctisFor`), 18 (the flat
Contract model: Parties (St George's and its ACC Contract; use 18's shipped IDs for the old `CH-STG` and `CT-STG-ACC`), the Contract's pricing kind, the aaCode allocator,
the parity fixture), 18a (funding tags: ACC is a tag on a holder's Contract, not a kind of Contract), 19
(procedures, `ProcedureType`, the ACL reconstruction procedure), 19a (price ranges and `fixed` Contracts,
starting values, `timeUnitsFromMinutes(minutes, rule)` and `masters.rvgTimeRule`), 19b (modifiers as
itemised records: none on an event), 20 (one Contract per Procedure, the holder-fit rule and the picker's
candidate list), 20a (the three-part stack: an event is not in it), 21 (`billablePartyForProcedure` in
`whoIsBilled.ts`, the payer on the Booking, holder references (`claimReference` on St George's ACC) and
completion), 22 (`materialiseInvoices`, `deliveryPlanFor`, `lineage`, `procedureIds`, Contract-driven layout
and GST, the Split button), 23 (exactly one primary Procedure, `isPrimary`), 25 (the `BookingLock` pricing
snapshot, whose `billingLines` copy goes with the entity, the locked billable party and payee,
`regenerateInvoiceFromLock`), 26 (the anaesthetist's unit value in the profile), 28 (Slots and Lists), 32 and 32a (a moved Booking sits on the doer's
List), 35 (explicit save: its drafted-action table and `BookingSnapshot.billingLines` name the lines
removed here) and 36 (`newBookingPair`, `handoffPair`, the ledger, one payable leg per receivable,
`bctiRecordsOf`) have also run.
**Estimated:** 2 sessions. Session 1 is the model (with the Contract event fee), the pure rules and
pricing, the store actions (review, then next-run bundling), billing events, the BillingLine removal with the seeded
lines re-expressed, and the seed (work items 1 to 7), ending at a green stop point with every action tested at store
level. Session 2 is the anaesthetist and admin screens (the two event sheets), the event-fee section of the Contract
editor, the review surfaces, the invoice documents, the triggers, the demo guide and the close-out
(work items 8 to 14).

## Goal

Phase 38b built the event element on a Procedure: its own record, its one standard review step,
next-run invoicing and the events list in all three apps, with the free-form additional invoice as
its first kind. It also withdrew the anaesthetist's post-op addendum Booking, so an anaesthetist who
sees a patient again (a ward review, a pain consult, a nerve catheter) or before the procedure (an ACC
pre-op assessment) can only type a free-form additional invoice once the Procedure is invoiced, or ring
the office; and any other charge is still a **billing line**, an older second way to add one. AA asked
for the anaesthetist to record this care themselves (FT-03.7), OQ-63 (D13) settled how, and on 16
October billing lines merged into events. This phase adds the **pre-op, post-op and billing kinds** to
38b's element and removes the BillingLine entity (DM-46):

- **Add a pre-op or post-op event** (US-03.7.1). From a current Procedure, or a past one reached
  through Phase 38a's main view, date lookup or search, on mobile and web, the anaesthetist adds an event with its
  own date and start time, recording **either a time** (minutes) **or a fixed fee**. An event takes no
  modifiers and no base units. It has an **invoice tick** (cleared means recorded but never
  invoiced) and a **billable party** set by a **"same as" tick** (the Procedure's billable party, our
  reading of Greg's courier comparison, labelled) or, with the tick cleared, entered in the sheet.
  An **admin can add one too** from the Admin Booking detail, for example when someone rings the
  office. The event is never a Procedure; it lists in the Procedure's events (38b) beside additional
  invoices and credits, and **appears on no List or schedule**, even when dated on another day
  (US-03.7.1, FT-03.7): no List, schedule or day view reads events.
- **Add a billing event** (US-03.7.2, rewritten). A free-form way to invoice on a Procedure and its
  Contract: a **charge** (a free-text description and an amount ex GST) or a **credit** (the same,
  reducing what is owed), on any Procedure at any time, by the anaesthetist on their own or the office,
  with the same invoice tick and "same as" party and its own date (the List date by default). It
  replaces the billing line. The amount is typed and prices nothing, so it is allowed on a fixed-price Procedure (US-05.2.5's by-hand route).
- **How a billable event is invoiced** (US-03.7.2, all kinds). Each is **its own line item**,
  priced from its recorded time, its fixed fee or its typed amount; **a Contract can carry a fixed fee
  for a kind of pre-op or post-op event, which replaces the time** (a Contract event fee, below; the
  swap is kept from OQ-12's answer, though US-03.7.2 no longer states it). A recorded time is priced as the
  catalogue prices time: RVG time units (19a's tiers, rounded up per D25) at the rate the Procedure's
  Contract's pricing kind sets (a rate Contract's unit rate, else the anaesthetist's own unit
  value, less a discount Contract's percentage), read from the Contract as it stands when the office prices it, never from a version or line. On a
  Procedure whose Contract is a fixed or open price nothing is calculated (US-05.2.5): a timed event there is
  priced by the office at review, or by a Contract event fee. Every event marked for invoicing goes through **the one standard review step** (38b's Events tab and `EventReviewSheet`, whatever state the Procedure's List is in) and is then billed in **the next billing run**, never held for the Procedure's invoice (OQ-121 answered, D69; 38b's one rule, built as answered, not yet seen by Vanessa):
  - **bundled**: it goes on the invoice for the same billable party in that run where there is one (the Procedure's invoice when its List is in the run), as its own dated line (a credit a negative line);
  - **otherwise an invoice of its own**, traceable to the Procedure (an event billed to another party joins that party's invoice in the run, never the Procedure's);
  - a credit that cannot be bundled is issued as a credit note (US-08.6.5) through Phase 39's issue path, which also reverses the linked payable;
  - an event whose invoice tick is cleared, or that has not been through review, is never invoiced.
- **The ACC pre-op assessment is a pre-op event** (US-05.5.2, Agreed). It follows the generic event and
  pricing rules: no fixed-fee Contract line, and ACC is a funding tag on the holder's Contract (18a), not a kind of Contract. The sheet offers **preconfigured ACC pre-op events** for
  CS250, CS260 and CS70 (codes provisional, OQ-12 part 1), otherwise free text; the price is a
  recorded time or a typed fixed fee, or a Contract event fee for the type if the Contract has one. Like every event it is billed in the next run.
- **The BillingLine entity is removed** (DM-46, work item 5): the entity, `chargeBasis`, the Add billing
  line sheet, the billing-lines card and every read of them go, and each seeded line becomes a billing
  event with the same figure, so no seeded total moves. There is **no UNIT x RATE line, no Contract
  add-on fee line and no preset line type**.

**Keep the pricing model in one place.** The Contract event fee, the event's rate and discount and its
price live in `aa-prototype/src/domain/billing` (beside 19a's Contract module and 24's pricing function)
plus the seed, behind types the UI reads. The timed event reuses 24's per-kind rate and discount
through one exported helper, never a second derivation, so a later
change to the contract model (AR-58, AR-61) or to 24's pricing reaches events without a second edit.

The state gains the pre-op, post-op and billing members on 38b's event record, an event line on the
invoice, the Contract event fee collection, one event fee on `CT-STG-ACC` and the
seeded billing events, and loses `billingLines`, so `PERSIST_VERSION` is bumped. No seeded figure moves.

## Before you start: drift check

1. Run the drift check against the plan's catalogue snapshot (catalogue commit fbdd555):

   ```
   node requirements-board/agent/skills/update-build-plan/tools/plan-state.mjs --diff FT-03.7,US-03.7.1,US-03.7.2,US-05.5.2,US-03.3.6,US-03.7.3,US-08.6.1,US-08.6.3,US-08.6.5,US-05.2.6,US-05.2.5,US-04.2.4,US-05.2.1,FT-11.2,US-07.3.2,US-09.1.4,US-10.3.1,OQ-63,OQ-12,OQ-121,OQ-48,OQ-50,OQ-75,OQ-29,OQ-60,US-03.7.4,OQ-138
   ```

   Read the hunks (if any) for FT-03.7, US-03.7.1, US-03.7.2, US-05.5.2, US-03.3.6, the context items
   and the questions, and the domain-model lines on events (the Procedure section's events
   paragraph), billing lines and the additional invoice. To see why an item says what it says, run
   `npm --prefix requirements-board run source -- --item <ID> --text` and read only the cited
   passages (Node 22.18 or newer). If an item changed, re-read it and adjust the work items. If an
   item is now Retired or Future, drop its work items and record that in the PROGRESS entry. At
   efe123c FT-03.7 and US-03.7.2 are **Verify**, US-03.7.1 and US-05.5.2 are **Agreed** and
   US-03.3.6 is **Retired** (nothing of it is built), US-03.7.4 is parked on OQ-138 (nothing to build); the screenshots on US-05.5.2 show the earlier
   flat-fee billing line, which this phase's Catalogue screenshots step re-shoots.
2. **Owner decisions and questions** (each answer built as stated; each open one kept in one place):
   - **D13 (OQ-63, answered; extended 16 October; its before-approval branch superseded by OQ-121).** Build the answer: its own element on the Procedure (38b's record), a line item, "event" as the one name (38b's label), the invoice tick, the "same as" party tick, one standard review step and no separate approval queue, billed in the next run (next bullet). The "same as" default is the Procedure's party, the one reading the catalogue calls ours (US-03.7.1 note): it lives in 38b's pure event module (`EVENT_RULES.sameAsDefault` with `resolveEventParty`), commented there, with the "same as" caption in the copy (work item 8). This phase adds its kinds to `EVENT_KINDS` (work item 2). The 16 October extension (other billing lines merge into events, a billing event is a free-form charge or credit, events at any time) is one more kind, `'billing'`, on the same element and the same path: no second route for "lines". A refund shown as an event (US-03.7.3: web only, a record made outside the system) is not built here.
   - **OQ-121 (how and when an event is billed), answered 4 November, D69** (Donald for the build, not yet seen by Vanessa). Build it as answered, with no provisional label: every event marked for invoicing, the ACC pre-op included, goes through 38b's review step and is billed in the next run, never held for the Procedure's invoice, bundled with the same billable party's invoice where it can be, otherwise its own, traceable to the Procedure. 38b builds the one rule (`eventInvoicing`, `runEventInvoicing`). This phase adds `'preOp'`, `'postOp'` and `'billing'` with `mayBundle: true` and wires nothing into the List run: the old "travels with the Procedure" branch and any List-review of events are gone. Confirm from 38b's handoff how its run decides what "in that run" covers (the List's authorise run, or a combined run) and use it as shipped.
   - **OQ-12 (the ACC pre-op), part 2 answered 28 October; the codes still open.** The ACC pre-op is a
     pre-op event under the generic rules (the RVG guide gives codes and no prices): build no fixed-fee
     Contract. Build **preconfigured events** for CS250, CS260 and CS70 as `ACC_PREOP_PRESETS` (code and
     label, no price; work item 2) that fill the type and description, labelled "Codes to confirm with
     AA's accountant (OQ-12)". If part 1 is answered, change the presets only and drop the label.
   - **OQ-48 (pricing date), answered (D45): the procedure date.** It decides a fixed price's range in force,
     which an event never reads. A timed event, or a Contract event fee, is priced from the Procedure's Contract
     as it stands when the office prices it (AR-58 5.7: rates and discounts are undated, an edit follows), frozen
     in the event's `pricing` at approval. The event's own date picks nothing, so no pricing-date helper is built.
     A billing event is a typed amount.
   - **The 2026-09-28 ruling, as 24 and 38b left it.** 24 superseded it in part for the Procedure's
     price section (a third-party price shown read-only, a Contract's rate or discount shown read-only,
     still no calculated total); 38b superseded it for events (`EVENT_RULES.anaesthetistSees:
     'ownTotalsAndParty'`: on their own Procedure the anaesthetist sees each event's total ex GST and
     party). This phase follows 38b's rule for its kinds: the anaesthetist sees a total once one
     exists (a typed fee as typed, a Contract event fee as its fixed price, a timed event only once
     the office has priced it at review), never a calculation ("units x rate") and never a Booking
     total.
   - **OQ-29 and OQ-60 (BCTI granularity, what the fee counts), open.** An event invoice is a
     receivable with its own ACCPAY, so it is one more BCTI through 16's `bctiRecords` (36's
     `bctiRecordsOf`), counted by the same rule as 38b's additional invoices; an event line on the
     Procedure's invoice adds none; nothing here counts BCTIs. If granularity flips to one per
     procedure, only 16's count function changes.
3. **Prerequisite names.** Confirm Phases 24, 38a and 38b are DONE in PROGRESS.md and read their handoff
   notes, then note the exact current names (this doc's working names first; use what shipped):
   - from **38b**: the record and slice (`ProcedureEvent`, `schedule.procedureEvents`,
     `occurredOnISO`, `startTime`, `billable` as the invoice tick, `party: EventParty` with `sameAs`,
     the `detail` union, `review: EventReview` with `awaitingReview`, `approved` and `declined`,
     `invoiceId`, `addedBy`), `ProcedureEventKind` (this phase adds `'preOp'` and `'postOp'`), the
     pure module `src/domain/billing/procedureEvent.ts` (`EVENT_RULES`, `EVENT_KINDS`, `mayRaise`,
     `mayEditEvent`, `eventStatus`, `eventInvoicing`, `resolveEventParty`, `validateEventBase`),
     `procedureOwner`, the store actions (`addProcedureEvent`, `updateProcedureEvent`,
     `removeProcedureEvent`, `approveProcedureEvent`, `declineProcedureEvent`, `runEventInvoicing`),
     the `'additional'` invoice kind, the `additionalTo` lineage role and `Invoice.eventId`, the
     selectors (`eventsForProcedure`, `eventsForBooking`, `eventsAwaitingReview`,
     `approvedEventsAwaitingRun`, `liveInvoiceForProcedure`), `ProcedureEventsList` and its hooks
     (`procedure-events`, `procedure-event-row`), the Admin Review Events tab and `EventReviewSheet`
     (`admin-events-queue`, `event-review-sheet`), the `run-next-billing-run` trigger, the PWA stand-in
     `office-reviews-additional-invoice`, `procedureEventCopy.ts` (the one label for "event"), whether
     the shared additional-invoice form's party field and lines editor are reusable here, where the anaesthetist's
     "Raise additional invoice" button sits on the stack, and `stage-post-op`'s current routes, `when`,
     body and result copy (38b kept it for Dr Sharma's Tue 14 Jul AM List and the additional-invoice
     beat; 39 and 39a beats may depend on it);
   - from **24**: its one pricing function and result (the rate and discount each pricing kind gives,
     and their origin), `PriceSource`, `adjustmentAllowed`, whether the per-kind rate and discount
     (`rvgAnaesthetistRate`, `rvgContractRate`, `rvgDiscount`) are already an
     exported helper (work item 2 needs one), what 24 left of `BillingLine` (a fixed-amount line and
     its `billingLineOnFixedPrice` rejection; work item 5 removes them), and that no `unitRateFor`,
     `rateTime` or hourly line remains;
   - from **19a**: price ranges and `fixed` Contracts, how a Contract of an RVG kind is told from the
     rest, the `CT-STG-ACC` pricing (`rvgContractRate`, $25.00 a unit),
     `timeUnitsFromMinutes(minutes, rule)` and `masters.rvgTimeRule`;
   - from **38a**: `searchBookingsFor`, the date lookup's `?day=` and the search's `?q=` URL state, which
     Lists the main view holds (an un-invoiced submitted List stays; an invoiced one leaves), and how a
     billed List's Booking detail renders read only;
   - from **18** and **18a**: the holder master (`CH-STG`, `billsHolder`, `billablePartyRef`), `CT-STG-ACC`, the
     Contract's `pricing` kind and `fundingTagId` (ACC), the aaCode allocator and the id-to-code table pinned in `seed.test.ts`,
     the parity fixture `domain/billing/__parity__/phase-18-baseline.json`;
   - from **19**: `ProcedureType` and the ACL reconstruction procedure's id; from **20**: the holder-fit
     rule and the picker's candidate list (event fees never change it);
     from **21**: `billablePartyForProcedure`, the payer on the Booking, holder references and the
     party picker; from **22**: `materialiseInvoices`, `deliveryPlanFor`, the `lineage` roles,
     `procedureIds`, `gstTreatment`, the Split button's records and how a split Procedure's invoices
     are told apart; from **25**: `BookingLock` (and its `billingLines` member), the locked billable party and payee,
     `regenerateInvoiceFromLock`; from **36**: `newBookingPair`, `handoffPair`; from **16**:
     `bctiRecords`, `bctisFor`; from **26**: where the anaesthetist's unit value lives; from **14**: the
     registry file, `OFFICE_ACTOR`, `OFFICE_SIMULATION_ACTOR`, the PWA sheet, "Office authorises this
     List"; from **15**: `src/shared/booking/BookingDetailBody.tsx` and the Booking routes.
   - If 39 has already run, note whether its credit note and credit-and-rebill accept an invoice that
     carries event lines and an event invoice (work item 3's corrections bullet), and the name of its
     credit note issue function (work item 4's credit after the invoice). If 35 has run, note its
     drafted-action table's `addBillingLine` and `removeBillingLine` rows and `BookingSnapshot.billingLines`.
4. **Leftovers.** Grep `aa-prototype/src` and `aa-prototype/visual` for `BillingLine|billingLines|chargeBasis|ChargeBasis|billingLine\.|isAddOn|quantityRule|addOnLines|addOns|unitRateFor|UNIT x RATE|unit x rate|rateTime|Rate × time|permitsIndividualArrangement|Ancillary fixed amount`. Expected: the BillingLine files of work item 5 (about 25 non-test files at plan time) and nothing else outside history comments. Anything else found is removed in work item 5 and recorded.
5. **The staging session.** Confirm Dr Souter's Thu 16 Jul 2026 AM session is free in a fresh seed (the
   canvas RNG fills Slots) and that no S1 to S5 beat uses it. If not, use her nearest earlier free
   weekday session inside the canvas and name it in the PROGRESS entry and the trigger copy.
6. Note the current `PERSIST_VERSION` (16 after 15a session 1; later phases will have moved it).

## Reference

**Design files (convention 17):**

- `docs/design/Design Language.dc.html`: tokens (teal `#0D6E63` the only action colour, crimson
  identity only, the six status colours with their tints, pills at radius 999, Spline Sans Mono with
  tabular-nums for every date, time, code and amount, the bottom-sheet and `sheet-in` motion
  patterns, 4pt spacing).
- `docs/design/Mobile App.dc.html`: the Booking detail and its Procedure cards (38b's events list sits
  under the Procedure where the billing lines card was), the bottom sheet anatomy for the event sheets. Mobile-first: bottom sheets with tappable rows, never desktop forms or dropdowns
  (convention 16).
- `docs/design/Web Dashboard.dc.html`: the web panel anatomy for the same section on the web Booking
  detail (the shared body renders both).
- `docs/design/Admin Review.dc.html`: the admin table, tabs, side sheet and pills for
  38b's review step and the Contract editor's event-fee section. No mockup covers events or
  the invoice document: extend 38b's surfaces, the Contract editor, `InvoiceDocument`'s print sheet and
  rail, and the Invoices table as they stand.

**Catalogue items:** the covered and context files listed above, and the flat Contract model, AR-58 (2.2 and 2.3,
5.7, 5.9) and its ERD AR-61. The meeting
notes:
- 2026-10-01 #6 (the ACC pre-op assessment as a fixed-fee Contract, never primary, recorded as a pre-op
  event; time or fixed price events with no other modifiers; a Contract can replace a recorded time
  with a fixed fee), #34 (the events feature: post-care self-service instead of ringing the office,
  its own date and time; a significant job is another Booking), #46 (an ACC pre-op assessment is never
  the primary), #54 (OQ-12 is with AA's accountant) and #61 (admin approval of anaesthetist events,
  settled by 2026-10-02 #4 as one review step for all);
- 2026-10-02 #4 (OQ-63 answered: its own element; a line item; "event" for everything, tagged pre-op
  or post-op in one generic place; (its before-and-after billing rule superseded 4 November by OQ-121: every event is billed in the next run);
  a pre-op event is billed with the procedure, not before; the admin team can add events; the
  billable-or-not button), #24 (the "same as" billable-party tick, default not stated), #25 (events as
  the Procedure's history; a refund as an event, tentative), #26 (anaesthetists may submit at once and
  "wash up" post-ops in the next round; the rule covers both), #35 (for Ben: whether unbilled events
  are recorded today and whether submitting is held back; nothing to build) and #44 (Greg not convinced
  by "events");
- 2026-10-16 #45 (other billing lines kept with the procedure; Donald prefers "billing event"), #59 (events
  are one name for all of them; other billing lines merge into events), #60 (the event's billable
  party; ACC codes parked), #61 (US-03.7.2 rewritten as a free-form invoice event: a charge with free
  text or a credit, on the Procedure and its Contract) and #62 (a refund could show as an event, web only);
- Notes 2026-11-04 Donald working decisions #3 (OQ-121 answered: all events billed in the next run, bundled if they can be, otherwise on their own, no waiting).

**Analysis files:**

- `docs/prototype-build/catch-up/GAP-ANALYSIS.md`: theme 5 ("Events, additional invoices, credit and
  rebill"), the FT-03.7, US-03.7.1, US-03.7.2, US-03.7.3 and US-05.5.2 rows (US-03.3.6 is Retired: its
  row is history), the DM-17 and DM-46 rows, the EP-03 and EP-05
  structural notes (EP-03's names the 'Stage post-op scenario' trigger to retire or re-point), and the
  "Demo-trigger buttons" section.
- `docs/prototype-build/catch-up/epics/EP-03.md` (FT-03.7, US-03.7.1, US-03.7.2) and
  `epics/EP-05.md` (US-05.5.2).
- `analysis/domain-model-delta.md` DM-17 (and DM-18 for the additional invoice it sits beside, DM-22
  for the ledger pair and the invoice kinds, DM-09 for the Contract (flat, no lines), DM-50 for the one precedence
  whose pricing a timed event reuses, DM-46 for the BillingLine removal).
- `analysis/prototype-map-shared.md` (the shared Booking detail body, `BtmCaptureBlock`,
  `BillingLinesCard`, `AddBillingLineSheet`), `prototype-map-apps-mobile-web.md` (the mobile and web
  Booking routes), `prototype-map-admin.md` (Review, Invoices, the invoice document, the Contract
  editor), `prototype-map-store-seed.md` (`billingLineActions`, counters, the seed's Contracts) and
  `prototype-map-domain.md` (`fee.ts`, `invoiceBuild.ts`, `timeUnits.ts`).

**Code entry points** (line numbers are from 3d3a18c; phases 15a to 38b will have moved them: use the
names from the drift check):

- Billing lines (all removed here, work item 5): `src/domain/types.ts` `BillingLine` and `ChargeBasis`;
  `src/store/billingLineActions.ts`; `src/shared/capture/AddBillingLineSheet.tsx`;
  `src/shared/capture/BillingLinesCard.tsx` (rendered from `BtmCaptureBlock.tsx`); the other readers are
  the drift check's step 4 grep. `src/store/lifecycle.ts` `editRefusal` stays exactly as it is.
- Pricing: 24's pricing function (`src/domain/billing/pricePrecedence.ts` or its successor), 19a's price-range module,
  `src/domain/billing/timeUnits.ts` (19a's `timeUnitsFromMinutes(minutes, rule)`), `fee.ts` (loses
  its line sum),
  `src/domain/billing/invoiceBuild.ts` (loses the line snapshot, gains event lines), `InvoiceLine`.
- Booking detail: `src/shared/booking/BookingDetailBody.tsx` (the procedures loop; 38b's events list
  under each Procedure; 20a's stack with 38b's "Raise additional invoice" on its Contract part).
- Admin: `src/apps/admin/screens/ReviewQueue.tsx` and `ReviewScreen.tsx` (the List review, which shows no events), 38b's review step for every event, `InvoiceDocument.tsx`,
  `InvoicesScreen.tsx`, the Admin Booking detail, the Contract editor,
  `src/apps/admin/flows/` (38b's additional-invoice sheet for the sheet pattern),
  `src/apps/admin/routes.tsx`, `src/router.tsx`.
- Billing run: `src/store/billingRun.ts` (`runBillingForList` 68, run on the `listAuthorised` app event
  from `src/store/events.ts`; that file is the app-event emitter, not the event element, so do not
  name anything of this phase after it).
- Seed: `src/domain/seed/contracts.ts` (`CONTRACT.stgAcc` is `CT-STG-ACC`), 19a's price-range seed,
  `src/domain/seed/cast.ts` (`SURG.hale`, Mr T. Hale, Orthopaedics; `ANAE.souter`),
  `src/domain/seed/patients.ts` (`PAT.bennett`, Coral Bennett, `ZAG5541`), 19's procedure seed (the
  ACL reconstruction procedure).
- Store plumbing: `src/store/mutate.ts` `ID_FORMATS` (`billingLine: { prefix: 'BL', pad: 4 }` 66, which goes),
  `allocateId`, `clockISO`; `src/store/appStore.ts` (`PERSIST_VERSION`, `freshAppState`,
  `resetDomainState`); `src/shared/audit/fieldLabels.ts` and `ACTION_LABELS`
  (`src/shared/audit/actionLabels.ts`).
- Demo: `src/shared/demoTriggers/registry.ts` (`stage-post-op` and 38b's
  `office-reviews-additional-invoice`), the PWA sheet, `pwaPurity.test.ts`, `demoTriggers.test.ts`.
- Tests to extend: `store/captureActions.test.ts` (loses its `addBillingLine` tests),
  `domain/billing/fee.test.ts`, `invoiceBuild.test.ts`, `pricePrecedence.test.ts`,
  `contractEventFees.test.ts`, 38b's event action tests, `store/billingRun.test.ts`, 16's count test,
  `seed.test.ts`, `store/persistMigrate.test.ts`, `shared/demoTriggers/demoTriggers.test.ts`,
  `pwaPurity.test.ts`, and the Playwright specs that shoot the Booking detail (those of the retired
  add-billing-line sheet go).

## Work items

### Session 1: model, pricing, store and seed

1. **Model** (`domain/types.ts`, extending 38b's record; the event-fee type in 19a's billing module).
   US-03.7.1, US-03.7.2, DM-46.
   - 38b's kind union gains `'preOp' | 'postOp' | 'billing'`. `PrePostOpEventType` = `'postOpWardReview' |
     'hduReview' | 'painConsult' | 'accPreOpAssessment' | 'otherPreOp' | 'otherPostOp'`.
   - Reuse 38b's record as it stands: `occurredOnISO` is the event's date, `startTime` its start time,
     `billable` the invoice tick, `party: EventParty` (`{ sameAs: true }` or a named party; a person
     entered by name and email goes through 21's payer and party path), `review` (38b's states,
     `approveProcedureEvent` and `declineProcedureEvent`), `invoiceId` (the event's own invoice) and
     `addedBy`. Add only what 38b lacks, as the new members of 38b's `detail` union: `{ kind: 'preOp' |
     'postOp'; type: PrePostOpEventType; recording: EventRecording }` and `{ kind: 'billing'; direction:
     'charge' | 'credit'; description: string; amount: number }` (`amount` ex GST in dollars to the cent,
     above zero; a credit's sign is its `direction`, never a negative stored amount). Beside them on the
     record: `pricing?: EventPricing` (frozen at approval) and `invoiceLineId?` (the event's line when the run bundled it onto an invoice; 38b's `invoiceId` names the invoice that carries it, its own or the bundle).
   - `EventRecording`, a discriminated union for the pre-op and post-op kinds:
     - `{ kind: 'time'; minutes: number }`;
     - `{ kind: 'fixedFee'; source: 'contractEventFee'; contractId; eventFeeId }` (the Contract's fee for this type of event);
     - `{ kind: 'fixedFee'; source: 'typed'; amount }` (no Contract fee exists; the person adding it
       types it, ex GST).
     There is no modifier, base-unit or RVG field anywhere on the record (US-03.7.1 AC 2), and a billing
     event carries no time, rate or unit.
   - **`ContractEventFee`**, the one addition to the Contract (a sibling `contractEventFees.ts` beside 19a's
     Contract module, re-exported from the billing index and through `types.ts`): `{ id; contractId;
     eventType: PrePostOpEventType; holderCode?: string; holderDescription?: string; fixedPrice: number }`,
     `fixedPrice` ex GST, 0 or more. `contractId` is the Contract (flat: no versions). A Contract holds at most one
     fee per event type (`holderCode` is only its label). The type comment says: the proposal (AR-58) has no
     event and no event fee; a Contract replacing a recorded time with a fixed fee (OQ-12's answer, 1 October
     notes #6) needs one; US-03.7.2 no longer states the swap; it is kept beside the Contract so a model that
     covers it differently is one edit. It is not a fee extra (those are billing events, D10). `allocateId` gains a
     `contractEventFee` kind (`CEF###`). `SeedMasters` and `AppState['masters']` gain `contractEventFees`.
   - `EventPricing`, written at review and frozen with the invoice, so 25's Regenerate can reproduce
     it: `{ basis: 'time' | 'contractEventFee' | 'typedFixedFee' | 'billingEvent' | 'officePrice'; minutes?;
     timeUnits?; rate?; rateOrigin?: 'contractRate' | 'unitValue'; discountPercent?; contractId?; pricingKind?;
     eventFeeId?; holderCode?; replacedMinutes?; amount; officeReason? }`, amounts ex GST in dollars to the
     cent as every stored price; `amount` is signed, so a credit billing event is negative. `contractId` and
     `pricingKind` record the Contract and the pricing kind the price was read under, so the event is traceable
     to its Contract as it stood; the Contract's later edits never move a frozen event.
   - `InvoiceLine` gains `serviceDateISO?` and `eventId?` (a bundled event line).
     An event's own invoice uses 38b's event-invoice kind and lineage role; add neither twice.
   - The BillingLine entity and `ChargeBasis` are not extended: work item 5 removes them.
   - Thread anything new through `AppState`, the empty schedule slice, `freshAppState`,
     `resetDomainState` and the seed builders (38b added the slice; only new fields here).
2. **Pure rules and pricing.** The routing and party rules stay in 38b's
   `src/domain/billing/procedureEvent.ts`, extended there; the type table, validation and pricing go in
   `src/domain/billing/prePostOpEvent.ts`, re-exported from the billing index, Vitest-covered
   (convention 9). Nowhere else is a pre-op or post-op event validated, priced or routed.
   - **38b's module, extended** (one rule, no second constant): `EVENT_KINDS` gains `preOp`, `postOp` and `billing` (`addedBy: ['anaesthetist', 'office']`, `anaesthetistOwnOnly: true`, `tick: 'shown'`, `reviewed: true`, `mayBundle: true`, `needsInvoicedProcedure: false`); `validateEventBase`'s date rule becomes per kind (a pre-op event may be dated before the List date: item below). `eventInvoicing` and `runEventInvoicing` are not changed (OQ-121 answered, D69: 38b built next run, bundled where it can be). The "same as" default stays commented beside `EVENT_RULES` as our reading: `sameAsDefault` resolves through `resolveEventParty` to the Procedure's billable party (21's `billablePartyForProcedure`; #24). "Own" is 38b's `procedureOwner` (the locked payee once invoiced, else the List's anaesthetist).
   - `EVENT_TYPES`: per type, its kind (pre-op or post-op), whether it takes a time, a fixed fee or
     both. `ACC_PREOP_PRESETS` (US-05.5.2): CS250, CS260 and CS70, each a code and a label, no
     price, the one home of the codes (OQ-12 part 1, provisional). Labels live in the copy (work item 8).
   - **Events are on no List** (FT-03.7, US-03.7.1): an event's date is its own and places it nowhere;
     no selector that builds a List, a schedule or a day's view reads `procedureEvents`.
   - `validatePrePostOpEvent(input, { listDateISO, todayISO })`, which calls 38b's `validateEventBase`
     for the shared checks: a pre-op event is dated on or before the List date, a post-op event on or
     after it, neither after the later of today and the List date ("An event cannot be dated in the
     future."); a time is whole minutes from 1 to 720; a typed fee is above zero; a cleared "same as" tick needs a party. Returns `null` or `{ code; message;
     field }`.
   - No pricing-date helper: a Contract's rates and discounts are undated (AR-58 5.7), so an event's own date
     picks no price; `validatePrePostOpEvent` is the only place its date is used.
   - `eventFeeFor({ eventFees, contractId, type })`: the Contract's fee for the type,
     else undefined.
   - **One rate helper, shared with 24.** If 24 did not export it, extract from its one pricing function a pure
     `timedRateFor(pricing, anaesthetist)` returning `{ kind: 'rate'; rate; rateOrigin: 'contractRate' |
     'unitValue'; discountPercent }` for `rvgAnaesthetistRate` (the anaesthetist's unit value, no discount),
     `rvgContractRate` (the Contract's `unitRate`) and `rvgDiscount` (the anaesthetist's unit value, less
     `discountPct`), or `{ kind: 'none' }` for `fixed` and `open`, and make the Procedure's pricing call it, so
     the two cannot drift. The anaesthetist's own typed price or adjustment on the Procedure (24) is never
     applied to an event (a labelled reading: the adjustment is on the Procedure's price).
   - `pricePrePostOpEvent(event, ctx)` with `ctx = { procedure; contract; eventFees; anaesthetist; timeRule }`,
     where `contract` is the Procedure's Contract as it stands (flat: no version, no line). Returns
     `{ kind: 'priced'; pricing: EventPricing; description }` or `{ kind: 'refused'; code; message }`:
     - **a Contract event fee replaces a time** (US-03.7.2 AC 3): when `eventFeeFor` finds a fee for
       the type, the price is its `fixedPrice`, `basis: 'contractEventFee'`, with `replacedMinutes`
       set for a time event ("Contract fee STGACC-PAIN replaces 40 min");
     - **a time** otherwise: `timeUnitsFromMinutes(minutes, timeRule)` (the RVG rule, OQ-50, rounded
       up per D25) x the helper's rate, less its discount, rounded once to the cent;
     - **refused `noEventRate`** when the helper returns `none` (the Contract is a `fixed` or `open` price;
       US-05.2.5: nothing further is calculated): "This procedure has a fixed price, so a timed event is not
       calculated. Set a price in review.";
     - **a typed or code fixed fee** as recorded;
     - an event whose invoice tick is cleared is refused `notInvoiced` (it is never priced);
     - no modifier or base-unit input exists in `ctx`;
     - the Contract and fees in `ctx` are read live when the office approves, never the Booking's lock (its
       pricing snapshot): the event is a new service priced once at review and frozen in `pricing`. The lock
       is not read for the rate and never written.
   - Routing is 38b's `eventInvoicing` and `runEventInvoicing`, not new code: `sameParty` is true for the "same as" tick or an entered party equal to the Procedure's; an un-ticked event has no route; an event billed to another party never joins the Procedure's invoice. On a Procedure split by 22's Split button, the "same as" party is the Procedure's who-is-invoiced and the line goes on that party's invoice, never split (our reading, commented beside `EVENT_RULES`).
   - `eventInvoiceLine(event, pricing)`: one line, description such as "Post-op pain consult · 18 Jul
     2026 · 40 min, Contract fee" or "ACC pre-op assessment · CS250 · 13 Jul 2026", with
     `serviceDateISO`, `eventId`, quantity 1, the amount ex GST (GST at the invoice foot, 22), for
     every kind: a billing event reads "Billing event · {description} · {date}", a credit "Credit ·
     {description} · {date}" with a negative amount (work item 4's `priceBillingEvent` prices them).
   - Tests (worked figures): 45 min on an ACL reconstruction under `CT-STG-ACC` (`rvgContractRate`, `unitRate`
     $25.00) is 3 units, $75.00; 121 min enters the second tier (8 + 1 = 9 units, the part interval rounded up);
     the same 45 min under No contract · RVG (`rvgAnaesthetistRate`) at a fixture unit value of $30.00 is $90.00
     (`rateOrigin: 'unitValue'`); a fixture `rvgDiscount` Contract at 10% takes $90.00 to $81.00; a Contract
     event fee replaces 40 min with its fixed price; a Contract's `unitRate` edited before approval changes the
     event's price, and after approval leaves the frozen event untouched; an ACC preset (CS250) priced as a typed
     fee and as a time; a typed fee; `noEventRate` on a `fixed` Contract (the Doyle bariatric Procedure) and on an
     `open` one; every validation refusal, including both date edges, the future date and a missing entered party;
     an un-ticked event refused; `eventInvoicing` for the new kinds (bundled, own invoice, other party, un-ticked)
     and the per-kind date rule in `validateEventBase`; 24's worked examples still pass after the helper is
     extracted; determinism; and a guard that the module imports nothing from the modifier modules and derives no
     rate of its own (it calls the shared helper).
3. **Store: pre-op and post-op events** (`src/store/prePostOpEventActions.ts`, or 38b's event actions
   file extended; exported from `store/index.ts`). US-03.7.1, US-03.7.2.
   - **The guard.** Extend 38b's event guard (keep `editRefusal` exactly as it is, so a billed Booking
     stays locked: 38a's handoff): for a pre-op, post-op or billing event the actor is the Procedure's owner
     (38b's `procedureOwner`: the List's anaesthetist, after 32 and 32a the doer, or the locked payee
     once invoiced) or the office (US-03.7.1 AC 5); the Booking and Procedure are not cancelled; the
     List has an anaesthetist (a Draft List, DRAFT since 31, has none: "Assign the List first."). Any
     List state from ACTIVE to billed is allowed. Another anaesthetist is refused.
   - `addPrePostOpEvent(api, actor, procedureId, input)`, a thin wrapper over 38b's
     `addProcedureEvent` (or that action extended; no second write path): validate (item 2), then one
     `mutate()` writing the event through 38b's record with its review state set as 38b sets a new
     event, the invoice tick, the party choice and `addedBy` (role and source from the actor). Audit
     `procedureEvent.add` (38b's action name) with the kind, stamping the Booking. The Booking, its
     Procedures and its lock are not written (US-07.3.2): assert deep-equal in the tests.
   - Edit and remove: through 38b's `updateProcedureEvent` and `removeProcedureEvent`, extended to the
     new fields, under 38b's `mayEditEvent` (the adder or the office, while the event is
     `awaitingReview` or `declined`; editing a declined event sends it back to `awaitingReview`).
     Refused once approved ("This event is approved. Ask the office to correct its invoice."). Audit
     before and after, and the full record on remove.
   - **Review, then the next run (every event, any List state).** A ticked pre-op, post-op or billing event goes to 38b's review step (the Events tab and `EventReviewSheet`) as soon as it is added, on a List of any state from ACTIVE; there is no List-review path and the authorise commit knows nothing of events. `approveProcedureEvent` prices it for these kinds (item 2; an `officePrice` with a reason replaces the computed price, `basis: 'officePrice'`, and is required on `noEventRate`) and freezes `pricing`; the office confirms or changes the party (21's picker, audited). The next run (38b's `runEventInvoicing`, the one path, extended to price these kinds; additional invoices keep `priceFreeFormInvoice`) then puts each approved event, in event id order, on the invoice for the same billable party in that run where there is one (the Procedure's invoice when its List is in the run), as its own dated line stamped `invoiceLineId` (via 22's `materialiseInvoices`), or else raises an invoice of its own, traceable to the Procedure and its invoice (38b's `additionalTo` lineage), with 36's pair to the locked payee, laid out and delivered by 22's rules for the Contract it was priced under. A bundled line adds to the invoice's total, its ledger pair (36) and its one payable leg: no new invoice, pair or BCTI. Audit `invoice.eventLine` (event, Procedure, invoice, amount). The run skips an event already invoiced (`invoiceId`), so authorise twice, the run twice or a replayed handoff never bills one twice, and 38b's `eventStatus` reads it as `invoiced`. An event refused `noEventRate`, or a credit that would take the invoice it joins below $0.00 (`creditExceedsInvoice`), stays awaiting review ("Needs a price: invoiced in the next run once priced", or "Needs a change: the credit is more than the invoice", which the office fixes by editing the amount or declining).
   - Not invoiced: an event with the tick cleared never enters review, is never priced and never
     invoices; the office can still see it in the Procedure's events.
   - **BCTI feed:** an event's own invoice's ACCPAY appears in `bctiRecords` through the same rule as
     any ACCPAY (or payable leg, as 36 left it). Extend 16's count test: one event invoice adds exactly
     one BCTI for its month; a bundled event line, an un-ticked, unreviewed,
     approved-but-not-run or declined event add none.
   - **Corrections:** a credit note over an invoice with event lines, or over an event invoice, is
     Phase 39's (it may run after this phase). If 39 has run, test that its credit and rebill handle
     both (a rebill re-prices an event line from its frozen `pricing`, never the Procedure's lock);
     if not, record it in the handoff for 39. No new correction UI.
   - Regenerate: 25's `regenerateInvoiceFromLock` reproduces an invoice with event lines and an event
     invoice from the lock plus each event's frozen `pricing`; extend it to read them.
   - Selectors: reuse 38b's `eventsForProcedure`, `eventsForBooking`, `eventsAwaitingReview` and `approvedEventsAwaitingRun` (all kinds, any List state); add `eventLinesFor(invoiceId)` (derived, never stored on the invoice).
   - **Contract event fee actions** (office only, for the Contract editor in work item 10):
     `addContractEventFee`, `editContractEventFee` and `removeContractEventFee`, each validated (a fixed price of
     0 or more; at most one fee per event type per Contract; the Contract exists) with refusal sentences and
     audited, edited in place as every Contract setting is (AR-58 5.7; no version, no copy). A fee edit reaches
     only events not yet approved; an approved event keeps its frozen `pricing`. A test proves both, and that a
     Contract's event fees never change the picker's candidates or the Procedure's price.
   - Tests: add on an ACTIVE, a SUBMITTED and a billed List as the owner and as the office; refused for another anaesthetist, a cancelled Booking or Procedure, a Draft List; the Booking, Procedures and lock deep-equal before and after; an event dated on another day is on no List, schedule or day view; edit and remove until reviewed, refused after; an event on a not-yet-authorised List goes to the Events tab, never a List review; approve then run: a same-party event is one dated line on the invoice for its party in the run (total, pair and payable include it, BCTI count unchanged), and with no such invoice it is its own invoice (one more BCTI); an other-party event never joins the Procedure's invoice; the run twice, authorise twice and a replayed handoff raise nothing twice; an un-ticked event never invoices; `noEventRate` is left for review and priced there; the ACC pre-op takes the same path; the BCTI count above; a billing charge and a credit bundle as dated lines (the credit negative, the total their sum) and a credit over the total is left in review; the event fee actions (edited in place, an approved event keeping its frozen price); Regenerate reports "identical" on both kinds of invoice.
4. **Billing events** (`src/domain/billing/billingEvent.ts`, `src/store/billingEventActions.ts`, replacing
   `billingLineActions.ts`; exported from the billing index and `store/index.ts`). US-03.7.2, FT-03.7.
   - `validateBillingEvent(input, { listDateISO, todayISO })`, calling 38b's `validateEventBase`: a
     description of 1 to 120 characters; an amount above zero and below $100,000.00 ex GST; a
     direction of `'charge'` or `'credit'`; a date on or after the List date and not after the later of
     today and the List date; a cleared "same as" tick needs a party.
   - `priceBillingEvent(event)`: `basis: 'billingEvent'` at the typed amount, negative for a credit;
     refused `notInvoiced` when the tick is cleared. It reads no Contract, rate, unit or Booking
     total, so it is never refused on a fixed-price Procedure (US-05.2.5's by-hand route; a
     labelled reading) and never `noEventRate`. A credit that would take the
     invoice it joins below $0.00 is left in review as `creditExceedsInvoice`, in the run (work item 3).
   - `addBillingEvent(api, actor, procedureId, input)`, a thin wrapper over 38b's `addProcedureEvent`
     (no second write path) under work item 3's guard and `procedureOwner` rule; edit and remove
     through 38b's `updateProcedureEvent` and `removeProcedureEvent` under `mayEditEvent`. Audit
     `procedureEvent.add` with the kind and direction.
   - **Invoicing is work item 3's, unchanged for this kind**: review in 38b's step, then the next run (bundled with the same party's invoice where it can be, a credit a negative line; otherwise its own invoice). A **credit that cannot be bundled** is issued as a credit note for its one line through Phase 39's issue function (US-08.6.5: it reverses the linked payable), never a second path; if 39 has not run, the sheet's Credit option is not offered once the Procedure is invoiced ("Credits after invoicing need a credit note.") and the gap goes to 39's handoff.
   - Tests: a charge and a credit validate and price as typed (+$180.00, -$40.00); every refusal; allowed
     on the Doyle bariatric Procedure; the Booking, Procedures and lock deep-equal before and after;
     edit and remove until reviewed; refused for another anaesthetist, a cancelled Booking and a Draft
     List; an un-ticked billing event never invoices.
5. **Remove the BillingLine entity (DM-46)** (domain, store, seed and the screens that read it; the
   billing event sheet is work item 9). The files are the drift check's step 4 grep (about 25 non-test
   files at plan time).
   - **Delete:** `BillingLine`, `ChargeBasis`, `schedule.billingLines`, `ID_FORMATS.billingLine` (`BL`),
     `billingLineActions.ts` (`addBillingLine`, `removeBillingLine`, anything 22 left), the line
     selectors, `fee.ts`'s line sum and the line members of `FeeLine`, `invoiceBuild.ts`'s line
     snapshot and `describeFeeLine`'s line branch, the validator's line checks, 24's
     `billingLineOnFixedPrice` rejection, any `permitsIndividualArrangement` trace, the lock's
     `billingLines` copy (a bundled event carries its own frozen `pricing`,
     which Regenerate reads), 35's `BookingSnapshot.billingLines` and drafted-table rows if 35 has run,
     the audit snapshots and `billingLine.*` labels, `AddBillingLineSheet`, `BillingLinesCard` and
     every reader (`BtmCaptureBlock`, `BookingDetailBody`, `ReviewScreen`, `ListDetailView`,
     `HistorySheet`, `feeContext` and the rest of the grep). A Booking's total is the Procedure's price;
     events show on their own lines.
   - **Re-express the seeded lines as billing events** (grep `addLine(` in `seed/bookings.ts`; at plan
     time the two-funder Procedure's lines and the prepayment Procedure's fixed line): each becomes
     `kind: 'billing'`, direction charge, the line's description and amount, the List date, tick on,
     "same as". On an invoiced List it is `approved` and `invoiced`, its `invoiceId` and `invoiceLineId` pointing at the line the seeded invoice already carries (invoice, pair and figures untouched); on a List not yet authorised it is `awaitingReview` and billed in the next run. Seed
     audit entries for the lines become `procedureEvent.add` entries. No seeded total moves: 18's and
     24's parity fixtures and 25's `phase-25-invoices.json` match unchanged; if a fixture records
     `billingLines` as input, change the input shape only, record it, never `-u`.
   - Any add-on, quantity-rule, unit-rate, rate x time or hourly remnant goes too, with its tests, copy
     and `ACTION_LABELS`.
   - Tests: every seeded invoice total and Booking figure unchanged; the re-expressed events show with
     their invoice line; a grep test that no `BillingLine`, `billingLines`, `chargeBasis` or `billingLine.`
     identifier survives outside history comments (extend 24's "no second rate derivation" test);
     `fee.test.ts`, `invoiceBuild.test.ts` and the validator tests keep every non-line case; a Booking is
     billable with a primary Procedure and a price, no line needed.
6. **Seed: the Contract event fees** (`seed/contracts.ts`; labelled demo prices).
   - **St George's ACC (`CT-STG-ACC`, holder `CH-STG`, `rvgContractRate` at $25.00 a unit with the ACC funding
     tag, as 18, 18a and 19a seed it) gains one event fee**: `STGACC-PAIN` "Acute pain review, fixed fee"
     ($120.00, `eventType 'painConsult'`). Its pricing is untouched, so every seeded Procedure on it
     prices exactly as before; its unit rate prices a timed event (45 min is 3 units, $75.00).
   - **No ACC pre-op Contract** (US-05.5.2, OQ-12 part 2 answered; ACC is a funding tag, not a kind of
     Contract): the CS250, CS260 and CS70 presets are constants (item 2), not seed data.
   - The fee moves no figure: 18's parity fixture, 24's parity and 25's `phase-25-invoices.json`
     must match unchanged, and every S1 to S5 figure stands.
   - Bump `PERSIST_VERSION` by one (the event fields, the invoice line fields, the event fee collection,
     the seeded billing events and the removed `billingLines`) with a comment line
     ("Phase 39b: pre-op, post-op and billing events; BillingLine removed"). Extend `persistMigrate.test.ts` (a stale payload is discarded to the fresh seed). Two
     fresh seeds deep-equal.
7. **Session 1 stop point.** Every action above tested at store level, no `BillingLine` identifier left; `npm run build`,
   `npm run build:pwa` and `npx vitest run` green before session 2 starts.

### Session 2: screens, review, documents, triggers and docs

8. **Copy in one place.** Extend 38b's event copy (`procedureEventCopy.ts`, the one label for
   "event"; do not define the word again): the kind labels ("Pre-op", "Post-op", "Billing event"),
   "Add pre-op or post-op event", "Add billing event", "Charge" and "Credit", the description prompt
   ("What is this for?"), the type labels ("Post-op ward review", "HDU review", "Pain consult", "ACC
   pre-op assessment", "Other pre-op", "Other post-op"), the tick captions ("Invoice this event" with
   "Cleared: kept on the record, never invoiced." and "Billed to the same party as the procedure" with
   the reading caption "Our reading: the same party as the procedure unless you change it."), the
   routing caption ("Reviewed by the office, then billed in the next run."), the pricing caption for a timed event ("The office prices the
   time at review."), the credit captions ("Reduces what is owed." and, once invoiced, "Issued as a
   credit note in the next run."), and the OQ-12 caption. No en or em dash in any of them (a credit
   amount reads "-$40.00" with a plain hyphen).
9. **Anaesthetist side: the events and the sheets** (the shared Booking detail body, so mobile and web
   render the same; US-03.7.1, US-03.7.2, US-03.1.4 parity).
   - 38b's events list under each Procedure shows the new kinds: date and start time (mono, a start
     time only on pre-op and post-op), a Pre-op, Post-op or Billing event pill, the type or the
     description, what was recorded ("40 min", "Fixed fee", "CS250", or "Charge" and "Credit" for a
     billing event), "Not invoiced" when the tick is cleared, the party, and the review state on 38b's
     pills (awaiting review, approved, declined, or invoiced with the invoice number in mono). Amounts follow 38b's `EVENT_RULES.anaesthetistSees` (drift check step 2): a
     total once one exists (a billing event's typed amount at once, a credit as "-$40.00"), never a
     calculation. Edit and remove under `mayEditEvent`. The section now shows always on the owner's
     Procedure, on a List from ACTIVE on, so the add buttons have a home; it replaces the billing-lines
     card, and `BtmCaptureBlock` keeps no Add billing line foot.
   - The list's foot: two secondary teal buttons, **Add pre-op or post-op event** and **Add billing
     event**, shown on any List state when the guard allows. On a billed List they sit beside 38b's
     **Raise additional invoice** as the anaesthetist's controls on the read-only Booking (38a's
     handoff); the rest stays read only.
   - **`AddPrePostOpEventSheet`** (via `useSurface`, a bottom sheet on mobile; or 38b's shared form
     extended): Pre-op or Post-op (segmented), the type as tappable rows, the date (defaulting to the
     List date for pre-op and the day after for post-op, capped at today) and start time, then "Record
     a time" (a minutes stepper in 5-minute steps, mono, with the pricing caption and no preview) or
     "Fixed fee": a Contract event fee shows "Fixed fee under this procedure's Contract" with its price
     read-only (as 24 shows a third-party price); the ACC pre-op type lists the three presets as
     rows ("CS250 · ACC pre-op assessment") with the OQ-12 caption, and picking one fills the type and
     description before the same time or fixed fee choice; otherwise a typed amount. The **invoice tick** (on by default) and the **"same as"
     tick** (on by default, with the reading caption); clearing it opens 21's party picker (an
     organisation, or a person by name and email). The routing caption under the primary teal **Add
     event** says it is reviewed, then billed in the next run. Refusals inline against the field.
     `data-shot="add-event-sheet"`.
   - **`AddBillingEventSheet`** (the same surface and a shared fields component for the date, tick and
     party): **Charge** or **Credit** (segmented), a free-text **What is this for?** field and an
     **Amount** (ex GST, mono), the date (the List date by default), the invoice tick and the "same as"
     tick as above, the routing caption, and for a credit "Reduces what is owed." No time, rate, unit,
     modifier, type or preset list. It is offered on a fixed-price Procedure too. Once the Procedure is
     invoiced the Credit option follows work item 4. `data-shot="add-billing-event-sheet"`.
   - Mobile and web routes are unchanged: the sheets open over the Booking detail
     (`/mobile/lists/:listId/bookings/:bookingId`, `/web/lists/:listId/bookings/:bookingId`), reached
     from 38a's main view, date lookup (`?day=`) and search (`?q=`).
10. **Admin: add, review and the Contract's event fees** (US-03.7.1 AC 5, US-03.7.2).
    - **Admin Booking detail:** 38b's events list under each Procedure gains **Add pre-op or post-op
      event** and **Add billing event** (office actor, the same sheets as side sheets), shown on any List state the guard allows.
      An office-added event follows the same review as any other.
    - **The List review** (`ReviewScreen.tsx`) is unchanged: it shows no events (they are reviewed in the Events tab); each Procedure's events list on the Booking detail carries their states.
    - **38b's review step** for every event (the Events tab, `admin-events-queue`, and
      `EventReviewSheet`) shows the new kinds with the same calculation, the party (default, 21's
      picker for another, audited) and **Set a price**; its **Approve for billing** and **Decline**
      actions are unchanged, and approval still raises nothing ("Approved. Invoiced in the next billing
      run."); `run-next-billing-run` raises the invoice. Extend 38b's `event-review-sheet` hook; add none.
    - **The Contract editor**: an **Event fees** section under the Contract's pricing, office only, listing each
      fee (event type, holder code and description, fixed price in mono) with add, edit and remove in a side
      sheet through work item 3's actions. Caption: "Fixed fees this Contract charges for a pre-op or post-op
      event, in place of the time recorded." `data-shot="contract-event-fees"`.
    - The Admin Day screen is not changed.
11. **Admin: invoices.**
    - `InvoiceDocument.tsx`: a bundled event line on an invoice shows its kind, type and date
      in mono ("Post-op event · Ward review · 17 Jul 2026", "Billing event · Nerve catheter · 18 Jul 2026", a
      credit with a negative amount), its own line after the Procedure's lines;
      any line carrying `serviceDateISO` shows its date. An event invoice uses 38b's relates-to line
      ("Post-op event · relates to AA-2026-0012 · {Procedure}"; "Pre-op event" or "Billing event" for those kinds). The
      original invoice's rail lists event invoices beside 38b's additional invoices.
      `data-shot="invoice-event-lines"`.
    - Invoices screen: 38b's kind column covers an event invoice; an invoice with event lines shows
      "+n event lines" under its number.
    - Billing monitor: the Booking row detail adds "+1 event invoice" when one exists.
12. **Re-point the stage trigger and widen the PWA stand-in** (the Phase 14 registry; bodies in
    `src/store` or `src/shared`, so `pwaPurity` holds).
    - `stage-post-op`, re-pointed to Dr Souter as well. A store helper `stagePostOpForSouter(api)`
      builds, with the ordinary store actions and actors (never a direct state write), a past Procedure
      awaiting review: on Dr Souter's Thu 16 Jul AM session (drift check step 5) a List at St George's
      with Mr Hale, one Booking for Coral Bennett (the payer on the Booking prefilled as the patient,
      21), one primary Procedure on the ACL reconstruction procedure (19's list) under St George's ACC
      (`CT-STG-ACC`), times 08:05 to 09:40, no optional modifier claimed (so none needs an explanation;
      any locked age modifier 19b applies stays), St George's ACC's holder reference filled (21 made it
      need `claimReference`; use a demo claim number such as "ACC-DEMO-0716", or completion refuses),
      completed and submitted as Dr Souter (15a: no confirm step), and left SUBMITTED, so the presenter shows events reviewed and billed with the Procedure's invoice when the List is authorised and the run is made, and an event added after that invoiced on its own in the next run, on the same Booking. If an action refuses a past date, use the
      office path (28's assignment as the office actor) and record it. **38b's step stays**: the body
      still does what 38b left it doing for Dr Sharma's Tue 14 Jul AM List, because the
      additional-invoice beat (and 39's and 39a's, if built) depend on it. Each half is idempotent on
      its own (it skips a half already staged), so the trigger stays enabled until both are done; its
      `when` widens to the new mobile and web routes. Routes: 38b's Admin routes, plus Mobile · Lists
      and Booking (`/mobile/lists`, `/mobile/lists/:listId`, `/mobile/lists/:listId/bookings/:bookingId`)
      and Web · Lists and Booking, surfaces both (bar, and the PWA sheet on the mobile patterns).
      Description: "Gives Dr Souter a submitted ACL reconstruction (Coral Bennett, Thu 16 Jul) awaiting
      review, to add pre-op and post-op events to, and keeps Dr Sharma's Tue 14 Jul List ready for the
      additional invoice." Result: "Staged. Search Bennett, open Thursday's Booking and use Add pre-op
      or post-op event." Disabled "Already staged: search Bennett and open Thursday's Booking".
    - **One office stand-in, widened.** 38b's PWA-only `office-reviews-additional-invoice` becomes "Office reviews this event" (Mobile · Booking, `/mobile/lists/:listId/bookings/:bookingId`; `surfaces: ['pwa']`, `badge: 'office-stand-in'`), covering every reviewed kind: on the URL's Booking, `approveProcedureEvent` as `OFFICE_SIMULATION_ACTOR` on the oldest event awaiting review (any kind, any List state) with the default party and no office price, or, when none awaits review, the oldest approved one awaiting the run, then `runEventInvoicing` for it and `handoffPair`. Result "Reviewed by the office (simulated). Invoice AA-2026-00nn raised in the next run." Disabled "No event awaiting review or the next run on this Booking" or, on `noEventRate`, "Needs a price from the office: review it in Admin". Keep 38b's id unless no recipe or test references it, in which case rename it `office-reviews-event`; record which. There is one office-review stand-in, not two.
    - `demoTriggers.test.ts` covers both (routes, surfaces, disabled states, the pinned per-screen
      counts); confirm the stand-in shows only in the PWA sheet. Nothing is added to the Control Panel
      page; its index lists the entries under their screens.
13. **Persistence, labels and copy.**
    - Every new audit action gets a label in `ACTION_LABELS` (`invoice.eventLine`, the three Contract
      event fee actions, and any 38b action whose narration needs the new kinds); `fieldLabels.ts`
      gains the event, event fee and line fields, in English ("Acute pain review: fixed fee $120.00").
    - Copy sweep: no en or em dash in any new string; "event", the kinds and the type names come only
      from the copy (item 8); no calculation on any anaesthetist surface; grep `src` for the removed
      ACC caption ("CS250, CS260, CS70" outside the seed and copy), for "UNIT x RATE", "add-on",
      "Ancillary" and "billing line", and for "slot" in new app copy.
    - If session 2 changed the seed again, bump `PERSIST_VERSION` again (or once for the phase if both
      sessions ship as one change; record from and to).
14. **Tests, shots and docs close-out.** Component tests for the events list's new rows and the two
    sheets (no calculation shown to the anaesthetist; the two add buttons and 38b's Raise additional invoice
    are the only controls on a billed Booking; clearing "same as" requires a party; the billing event
    sheet has a free-text field and an amount and no time, rate, unit, modifier or add-on control; a
    credit reads negative) and for the
    Contract editor's event-fee section. Playwright: a new `visual/phase39b-events.spec.ts` (mobile
    Booking detail with pre-op and post-op events, the event sheet, the billing event sheet with a
    charge and a credit, the web Booking detail, 38b's review step
    with a post-op event, the Contract event fees, the Procedure's invoice with event lines, and an
    event invoice) and delete or re-point any spec that shot the old billing line sheet or card. The capture recipes,
    ATLAS.md and `npm run verify:board` are the Catalogue screenshots step below. Then the demo guide
    (below) and PROGRESS.

## Demo triggers

The headline actions are **product UI**, not demo triggers: **Add pre-op or post-op event** and **Add billing
event** on the mobile, web and Admin Booking detail, the Contract editor's **Event fees**, and 38b's review step and
next run for every event. What the registry gains or changes:

| Label | Screen | Surface | Effect |
|---|---|---|---|
| Stage post-op scenario (re-pointed, `stage-post-op`) | 38b's Admin routes, plus Mobile · Lists and Booking and Web · Lists and Booking | bar and pwa (pwa on the mobile patterns) | Builds Dr Souter's submitted ACL reconstruction for Coral Bennett on Thu 16 Jul AM under St George's ACC (`CT-STG-ACC`, with its new event fee), through ordinary actions (with the patient as payer and St George's ACC's claim reference), left awaiting review; keeps 38b's Dr Sharma step; each half skips itself once staged. Disabled, once both are staged, "Already staged: search Bennett and open Thursday's Booking" |
| Office reviews this event (38b's `office-reviews-additional-invoice`, widened and relabelled) | Mobile · Booking (`/mobile/lists/:listId/bookings/:bookingId`) | pwa, office stand-in badge | Approves the oldest event awaiting 38b's review step on the URL's Booking (any kind, any List state; else takes the oldest approved one awaiting the run) as `OFFICE_SIMULATION_ACTOR` and runs `runEventInvoicing` for it; the event's invoice appears. Disabled "No event awaiting review or the next run on this Booking" or "Needs a price from the office: review it in Admin" |

PWA parity: an event has a mobile side that waits on the office: "Office reviews this event" reviews it and makes the run; 14's "Office authorises this List" is unchanged. In the framed build the presenter plays the office in Admin Review (the Events tab) and runs the next billing run. 15a's "Raise sample warnings" is unchanged: this phase adds no warning rule. Phase 44's audit records the stand-ins.

## Out of scope

- **Billing lines of any kind**: the UNIT x RATE line, Contract add-on fee lines and other billing lines
  are gone from the catalogue (US-03.3.6 Retired; OQ-89). A rate Contract prices the whole
  Procedure (24); fee extras on a schedule are billing events, not Contracts (D10); a charge by hand is a billing event.
- **A separate event approval queue**: D13 is one standard review step for everything (38b's, whatever the List state).
- **An event as a Procedure on the Booking**, events with modifiers or base units, and an event
  changing the original Booking, Procedure or lock (US-07.3.2).
- **A refund shown as an event** (US-03.7.3: web only, a record made outside the system) and any other
  event kind beyond pre-op, post-op and billing; 38b and 39 own additional invoices and credit notes.
- **Credit notes over event lines or event invoices**: Phase 39 (handoff); a credit billing event after the
  invoice only calls 39's issue function.
- **A warning rule for events** (for example an event waiting too long for review): no catalogue item
  asks for one; 15a's routine is the place if AA does.
- **Prepayment of events**: an event is never in 27's prepaid set and never adds to a prepaid
  Procedure's price; on a prepaid or fixed-price Procedure, extra work is an event or an additional
  invoice raised by hand (US-06.4.1, US-05.2.5), never automatic. A moved prepaid Booking repoints no payee (D38); events are never prepaid, so
  their payables follow the usual non-prepaid rule (handoff note).
- **The anaesthetist's own adjustment on an event** (24's typed price or % discount applies to the
  Procedure only), new rate rules beyond 24's pricing, and editable event types (the types
  are a constant until Phase 42 says otherwise).
- **Event fees in the proposal**: the Contract event fee is the prototype's addition (AR-58 has none); if the
  model later covers it, the change is in the billing module only.
- **The pre-op consult in AA's room** (US-03.7.4): parked on OQ-138; nothing is built for it.
- **Contract versions, lines and staged changes**: none exist in the flat model (D1 to D11); an event reads the
  Contract as it stands.
- Confirming the ACC codes (OQ-12 part 1): provisional in `ACC_PREOP_PRESETS`; no ACC prices are held.
- Changing how and when an event is billed (OQ-121 answered, D69): 38b's one rule; a later change is that rule only.
- Renaming "event" (Greg unconvinced, no alternative): 38b's one label is the place.
- Emailing the anaesthetist when the office declines an event: the state and reason show on the
  Booking.
- Significant later work as another Booking: US-03.7.1's note (Greg) says a significant job is a new
  Booking, made through the ordinary paths; nothing here detects or redirects it. Whether anaesthetists
  record unbilled events today, or hold back submitting, is for Ben (FT-03.7's note); the rule covers
  both.

## Manual test checklist

The agent runs every item itself in the running app and reports it with evidence; none is handed
to the owner (ROADMAP.md "Owner review: agents test themselves").

Session 1 (store level, after **Reset → Confirm reset**): the store tests above pass, including the
deep-equal Booking checks, both invoicing branches, the shared rate helper and the BCTI count; the
parity fixtures match; `npm run build`, `npm run build:pwa` and `npx vitest run` green.

Session 2 (after **Reset → Confirm reset**):

- [ ] Mobile (Dr Souter) · Lists: Demo actions shows **Stage post-op scenario**; run it. Search
      "Bennett": Thursday's Booking and Coral Bennett's backdrop Booking appear. Open Thursday's: it
      reads submitted, with **Add pre-op or post-op event** and **Add billing event** under the Procedure.
- [ ] Add a pre-op event: ACC pre-op assessment, Mon 13 Jul, pick the CS250 preset (OQ-12 caption shown), a
      typed fixed fee of $60.00. It reads Pre-op, "CS250"; the routing caption says it is reviewed, then billed in the next run.
- [ ] Add a post-op ward review, Fri 17 Jul 08:00, 45 min, ticks on: the sheet shows the pricing
      caption and no figure. Add an HDU review with the invoice tick cleared: it reads "Not invoiced".
      No calculation anywhere on the phone.
- [ ] Add a post-op event with "same as" cleared and a person entered (name and email): the same caption shows, and it will not join the Procedure's invoice.
- [ ] Try a post-op event dated Wed 15 Jul (before the List date) and one dated tomorrow: both refused
      with their sentences. The sheet offers no modifier or base-unit control.
- [ ] Events are on no List: the Fri 17 Jul post-op event shows on the Procedure's events only; that
      day's List (the date lookup `?day=`, web and Admin Day) and the schedule show no event, and
      Thursday's Booking appears once.
- [ ] Add billing event on the same Booking: Charge, "Nerve catheter", Sat 18 Jul, $180.00; then Credit,
      "Goodwill adjustment", $40.00. Both list as Billing events ("$180.00", "-$40.00"). The sheet has no
      time, rate, unit, type or UNIT x RATE or add-on control. No Add billing line button or billing-lines
      card exists anywhere.
- [ ] Admin · Review · Events: the tab lists the ACC pre-op, the ward review ("45 min · 3 time units x $25.00 Contract rate = $75.00"), the other-party event, the nerve catheter charge and the credit, not the HDU review; Thursday's List review shows no events. **Approve for billing** each, then **Authorise** the List and make the run (`run-next-billing-run`): the Procedure's invoice carries the CS250 line, the ward review, the nerve catheter and the credit (-$40.00) as their own dated lines, its total their sum; the other-party event is not on it but its own invoice, relating to the Procedure's; the Booking still has exactly one primary Procedure; the AA fee run preview (16) counts one more BCTI for the event invoice and none for the lines. An event approved but not yet run is listed under "Waiting for the next billing run" in the Billing monitor.
- [ ] Back on the phone (now invoiced: the List has left the main view, so search Bennett): the
      controls are **Add pre-op or post-op event**, **Add billing event** and 38b's **Raise additional invoice**. Add a pain
      consult, Sat 18 Jul 10:30, 40 min. Admin: it waits in 38b's review step with "Contract fee
      STGACC-PAIN · $120.00 replaces 40 min"; **Approve for billing**, then **Run the next billing
      run**: its own invoice, one dated line, "Post-op event · relates to AA-2026-..." under the number;
      the original invoice's rail lists it; its own ledger pair and Xero pair (with the `-P` payable).
      The phone's events list shows its total and party, no calculation. A Credit billing event on the invoiced
      Booking is offered only if Phase 39 has run, and then issues a credit note in the next run.
- [ ] A Doyle bariatric (fixed-price) Booking: add a 30 min post-op event; Admin review shows "This
      procedure has a fixed price, so a timed event is not calculated" and **Set a price**; set $60.00
      with a reason; it invoices at $60.00. Add billing event there accepts a typed $50.00 charge: nothing is calculated and it
      rides on the invoice as its own line.
- [ ] The BillingLine entity is gone: a seeded Booking that carried a billing line (the two-funder or
      prepayment one) shows it as a Billing event in its events list with the same amount, and its invoice
      total is unchanged; `grep -rE "BillingLine|billingLines|chargeBasis" aa-prototype/src` finds nothing
      outside history comments.
- [ ] Admin · Contracts, St George's ACC: the **Event fees** section lists `STGACC-PAIN`; add a fee for
      "Post-op ward review" at $90.00 and see a new ward review event priced at it; remove it. A
      Contract's unit rate edited before an awaiting-review timed event is approved changes its calculation; an approved event keeps its price.
- [ ] Admin · Booking detail: **Add pre-op or post-op event** as the office (a post-op ward review); it
      reviews and invoices like any other; Admin · Audit shows the office as its adder.
- [ ] **Decline** an event in 38b's review step with a reason: the phone shows Declined and the reason;
      editing it sends it back to awaiting review.
- [ ] Admin · Invoice of the Procedure's invoice and of the event invoice: **Regenerate from locked
      data** reports identical on both.
- [ ] PWA (`npm run build:pwa` preview or the dev PWA): after Reset, stage, add a post-op event, use
      **Office reviews this event**: its own invoice with its number is raised in the next run. Use **Office authorises this List**, add another event, then **Office reviews this event**: again its own invoice. 38b's additional-invoice beat still works through the same entry.
      The entry does not show in the framed harness bar.
- [ ] 38b's beat still works: Admin · Sarah Mitchell's Booking on Dr Sharma's Tue 14 Jul List, **Create
      additional invoice**, and it lists in that Procedure's events.
- [ ] Admin · Audit shows each new action with the right who, role and source (anaesthetist or office
      for add, edit and remove; the office for review, authorise and event fees; the simulated office
      for the stand-ins).
- [ ] No en or em dash in any new string; no "slot" in app copy; no calculation on any anaesthetist
      surface; teal is the only action colour; crimson unused on the new screens; the "same as" and
      OQ-12 captions shown.
- [ ] Catalogue screenshots: the recipes for US-03.7.1, US-03.7.2 and US-05.5.2 are created or updated,
      US-03.3.6's recipe is gone with its screen, US-03.7.3 is extended, any recipe this phase broke is re-pointed, a full `npm run
      capture` ends with no failed recipe and no story without a recipe, the covered items' new shots
      are checked by eye, and `npm run verify:board` is green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots` green;
      `npm run verify:board` green.

## Demo guide updates

Take every figure, number and label from a reset run of the built app. This is not a milestone phase:
spot-check the master guide's S4 Beat 2 against the run sheet (the full read is 39a's and 44's).

- **`03-demo-script.md`:**
  - **S4 Beat 2** (38b rewrote it around the additional invoice, raised by the office or by the
    anaesthetist) gains a lead-in, "the anaesthetist's own pre-op and post-op care": Stage post-op
    scenario; on the phone search Bennett, open Thursday's Booking, add the ACC pre-op (CS250), a
    post-op ward review (45 min) and a billing event (a $180.00 nerve catheter charge); in Admin · Review · Events approve them; authorise and run: the invoice carries them as their own lines. Then on the invoiced Booking (found again by search) add a pain consult (40 min); in Admin review it and run the next run; open its own invoice. Say: "The anaesthetist records care themselves, before or days after, instead of ringing the office. It is an event on the Procedure with its own date and time. Whenever it is recorded it goes through the same review and is billed in the next run: on the same invoice as the party's other lines if it can be, otherwise on its own, traceable to the original. No waiting. The Contract can swap the time for a fixed fee." Then 38b's additional invoice, also an event. Expected: one invoice with the events as lines, one event invoice, the original Booking untouched.
  - Remove any UNIT x RATE or Contract add-on narration, and any "Add billing line" step (it is a billing
    event now), left anywhere in the script.
  - The **Direct URLs** table gains 38b's event review route as shipped.
  - The S4 discovery points gain OQ-12 (the ACC codes), one line each for the "same as" reading and for the event billing rule being Donald's answer for the build, not yet seen by Vanessa.
- **`02-workflows-and-handoffs.md`:** the "Post-operative addition" case (38b rewrote it) gains the
  anaesthetist's event path: add a pre-op or post-op event from the Booking (reached by the main view,
  archive or search), the invoice tick and the "same as" party, billed in the next run, bundled with the same party's invoice where it can be, otherwise its own invoice, one review; an admin can add one too; a billing event (a charge or credit with free text) takes the same path. A short "ACC pre-op assessment"
  case. The capture workflow's billing-line step becomes billing events.
- **`04-presenter-cheat-sheet.md`:** discovery point **12 "ACC pre-op flat-fee codes (CS250, CS260,
  CS70)"** says the prototype "captures these as ancillary fixed-amount billing lines with the code
  named in the description": rewrite it to a preconfigured pre-op event (CS250, CS260, CS70) under the
  generic event and pricing rules (ACC is a funding tag on the Contract, not a Contract kind), its own invoice line, codes provisional (OQ-12). "Built and clickable" gains pre-op and post-op events, the ACC
  pre-op event, Contract event fees and billing events (a free-text charge or credit); "Strong phrases" gains "One review
  step for everything recorded against a procedure"; "Statements to avoid" gains "events need a
  separate approval" (D13 says one review step), "these are the ACC codes" (OQ-12 is open), "ACC pre-op has its own fixed-fee Contract" (answered no), "Vanessa has confirmed how events are billed" (OQ-121 is Donald's answer for the build) and "a unit
  x rate line or an add-on fee" (both removed from the requirements), and "billing lines" (they are billing events).
- **`01-personas-and-responsibilities.md`:** the anaesthetist adds pre-op, post-op and billing events; the office adds them on request, keeps the Contract event fees and reviews them.
- **`README.md`:** the readiness row for pre-op and post-op work.
- **`master-demo-guide.html`:** the same sections (S4 Beat 2, the workflow cases, the cheat-sheet
  equivalents including the "12 · ACC pre-op flat-fee codes" card, the personas), then the S4 Beat 2 spot-check.
- **Control Panel scenario text:** the S4 message that names "Stage post-op scenario" gains the Souter
  half.

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19),
run after the review pass and before the PROGRESS.md entry. Re-run
`node requirements-board/agent/skills/update-build-plan/tools/recipe-status.mjs 39b` first: earlier phases (24 and 38b
above all) may have changed these recipes since this plan was written.

**Covered items.** When the phase is done, each recipe in `requirements-board/requirements/capture/recipes/`
matches what was built:

| Item | Recipe now | When this phase is done |
|---|---|---|
| FT-03.7 Events on a Procedure | no row of its own | no change here: its stories' shots show it |
| [US-03.7.1](../../../../requirements-board/requirements/stories/US-03.7.1.md) Add a pre-op or post-op event | absent · stub | captured. Run `stage-post-op`, reach the Booking by search (`?q=Bennett`, 38a). Mobile and web `add-event`, highlight `[data-shot=add-event-sheet]` (Post-op, time stepper, invoice tick, "same as" tick), states `sheet`, `added`, `not-invoiced`, `other-party`, `fixed-fee`, `not-on-list` (the event's date on the day's List: no event shown). Admin `admin-add-event` and `contract-event-fees`. Captions in the catalogue's words (own date on the Procedure, not on that day's List, no modifiers, recorded but not invoiced, party entered, an admin can add one) |
| [US-03.7.2](../../../../requirements-board/requirements/stories/US-03.7.2.md) Bill an event | absent · stub | captured. Mobile and web `add-billing-event`, highlight `[data-shot=add-billing-event-sheet]`, states `charge` (a nerve catheter), `credit`, `added`. Admin `on-invoice` after the run, highlight `[data-shot=invoice-event-lines]` (the charge its own dated line, the credit negative), and `own-invoice` for an event with no same-party invoice in the run. Captions: billed in the next run, with the party's other lines where it can be, otherwise an invoice of its own traceable to the Procedure. PWA stand-in not shot |
| [US-03.7.3](../../../../requirements-board/requirements/stories/US-03.7.3.md) See a Procedure's events | none (38b creates it) | no change here (38b owns it); add a `pre-post-op` state on the staged Bennett Booking (mobile, web, Admin) with pre-op, post-op and billing events beside an additional invoice, keeping 38b's shot names |
| [US-03.7.4](../../../../requirements-board/requirements/stories/US-03.7.4.md) Pre-op consult in AA's room | none | no change here: parked on OQ-138, no recipe, nothing shot |
| [US-05.5.2](../../../../requirements-board/requirements/stories/US-05.5.2.md) ACC pre-op flat fee codes | partial · web-acc-preop, mobile-acc-preop | captured (Agreed; the caption notes the codes are unconfirmed). Reshoot as a pre-op event (`acc-preop`, web and mobile): the three presets in `[data-shot=add-event-sheet]` with the OQ-12 caption; `on-invoice` shows CS250 as its own line. Replace the old "What this line charges" steps and the stale reason with "CS250, CS260 and CS70 are preconfigured pre-op events under the generic event and pricing rules; ACC is a funding tag, not a Contract; AA's real codes are not confirmed (OQ-12)." |

US-03.3.6 (Retired) has no row: nothing of it is shot.

**Recipes this phase breaks.** Found at plan time:
- `US-03.3.6.json` drives the Add billing line sheet and billing-lines card this phase removes (DM-46);
  the build phase removes it (or leaves it only as Retired's no-recipe state) so no recipe shoots a
  removed screen, and `--dry` proves it. The same for any other recipe that opens either.
- `US-08.6.1` and `US-08.6.3` (38b's rebuilt shots): a state that shows the anaesthetist's controls on
  an invoiced Booking now also shows **Add pre-op or post-op event** and **Add billing event** beside
  **Raise additional invoice**; re-point by label, keep the names.
- A recipe that drives 38b's PWA stand-in by its label or id (if the id is renamed, re-point it).
- Contract editor recipes (18's and 19a's, any Contract editor shot): the new Event fees
  section must not move their highlighted targets; check by the `--dry` run.
- Any recipe that relied on `stage-post-op` building only Dr Sharma's List: the trigger now also stages
  Dr Souter's Thu 16 Jul List, which adds a Booking to Dr Souter's Lists and search, and a
  List to Admin Review's queue; check list, search and review recipes by the `--dry` run.
- Re-grep before capture: `grep -lE 'Add billing line|billing-line|BillingLines|What this line charges|Ancillary|capture-billing-lines|post-op|stage-post|procedure-events|office-reviews' requirements-board/requirements/capture/recipes/*.json`.

**ATLAS.md.** Personas and IDs / Seed data: the staged Bennett Booking (Thu 16 Jul AM, St George's,
ACC, staged submitted) and the
`STGACC-PAIN` fee on `CT-STG-ACC`, and how to reach the runtime-generated ids (search `Bennett`).
Overlays and Existing hooks: `add-event-sheet`, `add-billing-event-sheet`,
`invoice-event-lines`, `contract-event-fees`, and 38b's `admin-events-queue` and `event-review-sheet`
extended to the new kinds; the Add billing line sheet and billing-lines card hooks and notes go. Demo
control panel: the re-pointed `stage-post-op` and the widened PWA-only office stand-in.

## Adversarial review (after build)

Once the manual test checklist and `npm run build`, `npm run build:pwa`, `npx vitest run` and
`npm run shots` are green, and before writing the PROGRESS entry, run the standard **adversarial
review-and-fix pass (PROGRESS convention 18)**:

- fan out four independent Opus review subagents, for **quality**, **bugs/correctness**, **plan
  adherence** and **money integrity** (each event invoiced once, on the right invoice; conservation on
  each pair; the BCTI feed; the rate helper shared with 24), each given the covered catalogue files,
  this doc and the diff;
- this session then independently verifies every finding against the catalogue, this doc and the
  code, fixes the confirmed ones (with a test wherever a bug had none), re-greens, and records the pass
  in the phase entry;
- do not re-raise anything already settled in the Decisions log (as amended by this phase).

**Steer this phase's reviewers at:**

- **The locked Booking stays locked.** No event or review writes the Booking, its
  Procedures or the lock. `editRefusal` is unchanged; only the event
  guard lets the anaesthetist act on a billed List, and only on their own unreviewed events.
- **One review step, no second queue.** Every event, on a List of any state, is reviewed in 38b's Events tab and nowhere else: the List review shows none, and no other approval path, flag or screen exists.
- **Events are on no List.** No List, schedule, day view or Admin Day read includes an event; its date is its own.
- **Each event invoiced once, in the next run.** An approved event is billed in the next run and never held for the Procedure's invoice: a line on the same billable party's invoice in that run where there is one (a credit a negative line; no new invoice, pair or BCTI), otherwise its own invoice, raised only by `runEventInvoicing`; another party's never joins the Procedure's invoice. Authorise twice, the run twice, a replayed handoff, an event edited between approval and the run: never a second line, invoice, pair or BCTI. An un-ticked or unreviewed event never invoices and never counts.
- **Pricing in one place.** Time events use 19a's `timeUnitsFromMinutes` with the stored rule and the
  rate and discount from the one helper 24's pricing also calls, on the Contract as it stands when priced
  (no version, no line); nothing is calculated on a fixed or open price Procedure; a Contract event fee
  replaces the time; no modifier or base-unit input reaches the event; no anaesthetist adjustment is
  applied to an event; a billing event is typed, prices nothing and is never refused on a fixed-price
  Procedure; a credit after the invoice goes through 39's credit note, not a second path; 18's and 24's
  parity hold.
- **The Contract event fee stays contained.** One type, one module beside the Contract, edited in place and
  audited, never read by the Procedure's price or the picker; an approved event keeps its frozen price when a
  fee or the Contract's rate later changes.
- **The flat Contract.** No Contract version, line, staged change, `contractVersion` or pricing-date helper
  appears in event code, types, copy or seed, and AR-28, AR-29 and AR-30 are cited nowhere (AR-58 and AR-61 are
  the references).
- **The BillingLine entity stays gone.** No `BillingLine`, `billingLines`, `chargeBasis`, Add billing line
  sheet, billing-lines card or preset line type, and no UNIT x RATE, add-on, quantity or hourly option,
  field or label anywhere; every seeded line is a billing event with its old figure and every seeded
  invoice total holds.
- **What the anaesthetist sees.** 38b's rule: totals and party on their own Procedure's events, never a
  calculation and never a Booking total, on mobile, web and the PWA stand-in's results.
- **Traceability.** Every event line and event invoice links to its Procedure and, for an event
  invoice, the original invoice; back-links are derived, never stored on the original; Regenerate
  reproduces both.
- **Containment.** The invoicing rules and the two readings in 38b's `EVENT_RULES`, `EVENT_KINDS` and
  `eventInvoicing` (no second routing function or constant), the name in 38b's label, the ACC codes
  only in `ACC_PREOP_PRESETS`, the OQ-121 rule only in 38b's `eventInvoicing` and `runEventInvoicing`, each step its own store action.
- **The staging.** `stage-post-op` uses ordinary actions, is deterministic, and still does 38b's Dr
  Sharma step; the office stand-in is PWA only, one entry, and audited as the simulated office.
- **Design and copy.** Bottom sheets with tappable rows on mobile; teal the only action colour; status
  pills on semantic tokens; mono dates, times and codes; no en or em dashes and no "slot" in app copy.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry; ROADMAP.md "Owner review: agents test
  themselves"): the readings built (the "same as" default;
  an event's line on a split Procedure going to the Procedure's who-is-invoiced; the
  Contract event fee as a Contract child the proposal lacks, kept for the time
  swap although US-03.7.2 no longer states the swap; a timed event at the Contract's unit rate or the
  anaesthetist's unit value less a discount Contract's percentage, without the anaesthetist's own adjustment;
  nothing calculated for a timed event on a fixed or open price Procedure; an event priced from the
  Contract as it stands at review, never a version or line (AR-58 5.7); a billing event allowed on a fixed-price Procedure (typed by hand,
  US-05.2.5), with a shown invoice tick, a direction instead of a negative amount and the List date as
  its default date; a credit a negative line on the invoice it is bundled with, left in review if it would take that invoice below $0.00; a credit that cannot be bundled a one-line credit note through 39's path, or not offered if 39 has
  not run; the seeded billing lines re-expressed as events with their old figures; a typed fixed fee
  allowed on an event under any Contract that has no event fee for its type, priced by the office at
  review; a `noEventRate` event left for review; the staged Booking left submitted so bundling and an own invoice both show), the ACC pre-op as codes with no price (presets, no fixed-fee Contract), the one open question built provisionally (OQ-12 part 1: the codes; OQ-121, D69, is built as answered, Donald's answer not yet seen by Vanessa), anything logged rather than fixed, and
  the screens worth a look, each with its route and persona.
- **Status row** for catch-up Phase 39b, and a phase entry with:
  - the drift-check result (FT-03.7 and US-03.7.2 Verify, US-03.7.1 and US-05.5.2 Agreed, OQ-121 answered (D69), OQ-12 part 1
    open, US-03.3.6 Retired, US-03.7.4 parked on OQ-138), the leftovers grep (step 4), the session used for the staging,
    and, if 39 has run, whether its credit note handles event lines and event invoices;
  - what was built, with the name map for later phases: the kinds and fields added to 38b's record,
    `EventRecording`, `EventPricing`, `ContractEventFee` and its actions, the `EVENT_KINDS` entries,
    `EVENT_TYPES`, `validatePrePostOpEvent`, `eventFeeFor`, `ACC_PREOP_PRESETS`,
    the shared rate helper's name, `pricePrePostOpEvent`, `eventInvoiceLine`, `addPrePostOpEvent`,
    `addBillingEvent`, `validateBillingEvent`, `priceBillingEvent`, the authorise and run hooks, the
    `InvoiceLine` fields, the removed BillingLine files,
    the selectors, the copy added, the event fee on `CT-STG-ACC`, the
    `stagePostOpForSouter`, the trigger ids, routes and audit actions;
  - the `PERSIST_VERSION` bump or bumps (from and to);
  - tests added and the before and after Vitest and Playwright counts;
  - the review pass.
- **Catalogue screenshots result:** recipes created or changed (US-03.7.1, US-03.7.2, US-03.7.3,
  US-05.5.2, US-03.3.6's recipe removed, plus any re-pointed 38b recipe), the `requirements-board/requirements/capture/REPORT.md` counts (captured,
  partial, absent, failed) before and after, and any partial reason handed to a later phase.
- **Decisions log:**
  1. **Amended:** Phase 38b's withdrawal of the anaesthetist's post-op flow: besides 38b's free-form
     additional invoice, the anaesthetist's own path is now a pre-op or post-op event.
  2. **New (D13, OQ-63 answered; OQ-121 answered, D69):** pre-op and post-op events are kinds on the one event element, a line item, with an invoice tick and a "same as" party; every event goes through one review step (38b's) and is billed in the next run, never held for the Procedure's invoice, bundled with the same billable party's invoice where it can be, otherwise its own, by 38b's `runEventInvoicing` only; an admin can add one. Reading: the "same as" default is the Procedure's party. Events appear on no List.
  3. **New (OQ-12 part 2 answered; codes provisional, part 1):** the ACC pre-op assessment is a pre-op
     event under the generic rules, with preconfigured CS250, CS260 and CS70 (code and label, no
     price); no fixed-fee Contract.
  4. **New:** a Contract may carry fixed event fees (`ContractEventFee`, beside the Contract; the flat model,
     AR-58, has none), which replace a recorded time (US-03.7.2). A timed event is priced from its recorded time
     by the RVG time rule (OQ-50, D25) at the rate its Procedure's Contract pricing kind sets (the Contract's unit
     rate, else the anaesthetist's unit value, less a discount Contract's percentage), read live from the
     Contract as it stands when the office prices it, frozen in the event's pricing, never from the Booking's
     lock; nothing is calculated on a fixed or open price Procedure; the office may set a price with a reason.
     Donald's flat Contract decisions (5 November) are built, not yet confirmed by AA or Greg.
  5. **New (16 October):** a billing event, a free-form charge or credit with free text, replaces the
     billing line (US-03.3.6 Retired, US-03.7.2 rewritten); the BillingLine entity is removed (DM-46);
     it is allowed on a fixed-price Procedure (typed by hand) and the seeded lines are billing events
     with their old figures.
  6. **Recorded (2026-10-07, 16 October):** no UNIT x RATE billing line and no Contract add-on fee line;
     other billing lines merge into events.
  7. **New (provisional, OQ-29, OQ-60):** each event invoice adds one BCTI to 16's count; event lines on
     the Procedure's invoice, un-ticked and unreviewed events add none.
  8. **Amended:** the `stage-post-op` trigger now stages Dr Souter's submitted Procedure as well as
     38b's Dr Sharma step, and 38b's PWA office stand-in covers every event kind.
- **Handoff notes:**
  - For **39**: a credit note or credit-and-rebill over an invoice with event lines, or over an event
    invoice, re-prices event lines from their frozen `pricing`; credits list in the Procedure's events; a
    credit billing event after the invoice calls your credit note issue function for one line (name it in
    your handoff, or add that path if 39b ran first).
  - For **43a**: the two event sheets (pre-op or post-op, and billing event) are anaesthetist capture screens
    to keep free of office-only Contract complexity (a Contract event fee shows its code, description
    and price only; a time shows no figure).
  - For **40**: the patient view lists event lines and event invoices with their standing.
  - For **41**: a moved prepaid Booking repoints no payee (D38), and events are never prepaid and never added to a prepaid price automatically.
  - For **42**: event types are constants; Contract event fees are master data
    the loader should accept beside Contracts (Contract, event type, holder code,
    fixed price).
  - For **43**: 38b's review step must stay usable at full scale; the
    generator builds event fees through the same module.
  - For **44**: S4 Beat 2's lead-in as written here, billing event included; the OQ-12 line if answered later; "Office reviews
    this event" for the PWA parity audit.
