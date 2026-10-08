# Phase 39b · Pre-op and post-op events

**Requirements covered:**
[FT-03.7](../../../../requirements-board/requirements/stories/FT-03.7.md) Events on a Procedure (Verify; unchanged at 60e2d1e; this phase builds its pre-op and post-op kinds, the admin entry, the invoice tick, the "same as" billable party and the before-or-after invoicing rule) ·
[US-03.7.1](../../../../requirements-board/requirements/stories/US-03.7.1.md) Add a pre-op or post-op event to a Procedure (Verify; unchanged) ·
[US-03.7.2](../../../../requirements-board/requirements/stories/US-03.7.2.md) Bill an event (Confirmed; unchanged) ·
[US-05.5.2](../../../../requirements-board/requirements/stories/US-05.5.2.md) ACC pre-op flat fee codes (Open: the codes are OQ-12; the model is settled as a pre-op event; at 60e2d1e only a link to US-03.2.1 was added) ·
[US-03.3.6](../../../../requirements-board/requirements/stories/US-03.3.6.md) Other billing lines (Proposed; **changed at 60e2d1e**: retitled from "Other billing lines (including UNIT X RATE)"; the unit x rate billing line is removed, because a fixed-rate Contract prices the whole Procedure (US-05.2.6, Phase 19a's lines and Phase 24's precedence), and Contract add-on fees are removed, because the add-on flag left Contract lines on 7 October. What remains, and what this phase builds: lines outside BTM (post-op ward or HDU reviews, nerve catheters, pain consults, medical transport), each able to carry its own later date).

**Left this phase on 2026-10-08:** the UNIT x RATE billing line, its `UNIT_RATE_LINE_READING`, the
Contract add-on fee line, `addOnFeeLine`, the dependency on 24's `unitRateFor` (24 no longer builds
it) and on 18's `FeeScheduleLine.isAddOn`, `quantityRule` and `addOnLinesInForce` (18 and 19a no
longer build them). None is built. OQ-89 no longer gates this phase: its questions 1 and 2 are
answered in effect (no billing line) and its open parts (the time band, a discount on top of a fixed
discount) are 19a's and 24's (D40). If any add-on or unit x rate code is found in the app, this
phase removes it (work item 4).

Read alongside (not closed here):
[US-03.7.3](../../../../requirements-board/requirements/stories/US-03.7.3.md)
(see a Procedure's events; Phase 38b built the events list, and this phase's kinds appear in it),
[DM-17](../analysis/domain-model-delta.md#dm-17) (the event element; Phase 38b built it, this phase
adds kinds to it),
[US-08.6.1](../../../../requirements-board/requirements/stories/US-08.6.1.md) and
[US-08.6.3](../../../../requirements-board/requirements/stories/US-08.6.3.md)
(the free-form additional invoice, an event kind Phase 38b built, now raised by the office on any
Procedure or by the anaesthetist on their own; it stays the free-form route for a late charge, and
the by-hand route when the work on a fixed-price Procedure differed),
[US-05.2.6](../../../../requirements-board/requirements/stories/US-05.2.6.md)
(fixed rate Contracts, Confirmed: the line's fixed rate prices the whole Procedure, not a billing
line; a timed event reads the same rate, work item 2),
[US-05.2.5](../../../../requirements-board/requirements/stories/US-05.2.5.md)
(fixed fee pricing, Confirmed, changed at 60e2d1e: on a fixed-price Contract the system calculates
nothing further; 24 refuses a billing line on a fixed-price Procedure, and this phase keeps that rule
for late lines and refuses to calculate a timed event there),
[US-04.2.4](../../../../requirements-board/requirements/stories/US-04.2.4.md)
(Contract lines, Verify, changed at 60e2d1e: one per procedure, add-on flag and quantity rule
dropped; Phase 19a builds them),
[US-05.2.1](../../../../requirements-board/requirements/stories/US-05.2.1.md)
(the anaesthetist's own unit value, from 26's profile, the rate where no fixed rate applies),
[FT-11.2](../../../../requirements-board/requirements/stories/FT-11.2.md)
(who is billed: the Contract's holder's billable party when the holder pays AA, otherwise the payer
on the Booking; Phase 21's one function),
[US-07.3.2](../../../../requirements-board/requirements/stories/US-07.3.2.md)
(the Booking is immutable after AUTHORISED: an event never edits it),
[US-09.1.4](../../../../requirements-board/requirements/stories/US-09.1.4.md) and
[US-10.3.1](../../../../requirements-board/requirements/stories/US-10.3.1.md)
(an event's own invoice is its own receivable, so its ACCPAY is one more BCTI in Phase 16's count; an
event line on the Procedure's invoice adds none),
[OQ-63](../../../../requirements-board/requirements/questions/OQ-63.md) (Answered,
owner decision D13: its own element, a line item, "event" for everything, one review step, bundled
with the Procedure's invoice if possible or else the next run, an invoice tick),
[OQ-12](../../../../requirements-board/requirements/questions/OQ-12.md) (Open: the ACC
codes CS250, CS260 and CS70 and the fixed-fee Contract, with AA's accountant),
[OQ-48](../../../../requirements-board/requirements/questions/OQ-48.md) (**Answered**
2026-10-07, D45: the procedure date decides the price in force; this phase extends it to an event's
own date, a labelled reading),
[OQ-89](../../../../requirements-board/requirements/questions/OQ-89.md) (Open only on the
time band and a discount on top of a fixed discount, 19a's and 24's; it no longer touches this
phase),
[OQ-50](../../../../requirements-board/requirements/questions/OQ-50.md) (Answered:
time units come from the RVG rules only) and
[OQ-75](../../../../requirements-board/requirements/questions/OQ-75.md) (Answered,
D25: a part interval is always rounded up, 15 minutes for the first two hours, then 10; Phase 19a
holds the tiers as data),
[OQ-29](../../../../requirements-board/requirements/questions/OQ-29.md) and
[OQ-60](../../../../requirements-board/requirements/questions/OQ-60.md) (BCTI
granularity and what the AA fee counts; open, kept in Phase 16's count function), the meeting notes
`requirements-board/requirements/notes/2026-10-01-aa-meeting-with-greg.md` (#6, #34, #46, #54, #61),
`requirements-board/requirements/notes/2026-10-02-aa-meeting-with-greg.md` (#4, #24, #25, #26, #35, #44),
`requirements-board/requirements/notes/2026-10-02-aa-booking-and-pricing-review-with-greg.md` (#21, #55),
`requirements-board/requirements/notes/2026-10-06-aa-directors-meeting.md` (#11) and
`requirements-board/requirements/notes/2026-10-07-aa-meeting-with-greg.md` (#5) (see Reference),
and the Procedure section (its events paragraph) and glossary of
[domain-model.md](../../../../requirements-board/requirements/domain-model.md).

**The pricing model it reads** (a draft: a v5 may change it): an event is priced from the
Procedure's Contract through the structures Phases 18, 19a and 24 keep in one place in
`aa-prototype/src/domain/billing`. The reference shape is the draft technical design
[AR-29](../../../../requirements-board/requirements/artifacts/AR-29.md) at
[#contract-line-fields](../../../../requirements-board/requirements/artifacts/AR-29.md) (the fixed
rate and fixed discount a timed event reads), [#resolver-layers](../../../../requirements-board/requirements/artifacts/AR-29.md),
[#price-precedence](../../../../requirements-board/requirements/artifacts/AR-29.md) (the calculated
step whose rate and discount a timed event reuses), [#contract-versions](../../../../requirements-board/requirements/artifacts/AR-29.md)
(the version in force on the event's date), [#pricing-snapshot](../../../../requirements-board/requirements/artifacts/AR-29.md)
(the frozen record `EventPricing` mirrors for an event) and [#billable-party](../../../../requirements-board/requirements/artifacts/AR-29.md)
(the "same as" party), its ERD [AR-30](../../../../requirements-board/requirements/artifacts/AR-30.md)
at [#contract](../../../../requirements-board/requirements/artifacts/AR-30.md),
[#contract-line](../../../../requirements-board/requirements/artifacts/AR-30.md) and
[#booking-procedure](../../../../requirements-board/requirements/artifacts/AR-30.md), and the
plain-language guide [AR-28](../../../../requirements-board/requirements/artifacts/AR-28.md) (true as
written) at [#who-gets-the-invoice](../../../../requirements-board/requirements/artifacts/AR-28.md)
and [#booking-to-invoice](../../../../requirements-board/requirements/artifacts/AR-28.md). The draft
has no event: this phase's one addition to the Contract, the **Contract event fee** (work item 1), sits
beside 19a's lines in the same module, so a design change stays a contained edit.

**Depends on:** 24 (the one price precedence `priceProcedure` in `pricePrecedence.ts`, its calculated
step's rate (the line's fixed rate or the anaesthetist's unit value) and fixed discount, `PriceSource`,
the `billingLineOnFixedPrice` rejection, the reduced `ChargeBasis` `'rvg' | 'fixed'` and the
fixed-amount-only billing line sheet), 38a (the archive (calendar) and search that reach a past
Procedure on mobile and web, since an invoiced List leaves the main view; its handoff names the
controls a billed Booking may show) and 38b (the event element on the Procedure, its one standard
review step and next-run invoicing, the events list on every Procedure in all three apps, the one
user-facing label for "event", `EVENT_RULES.anaesthetistSees`, the additional-invoice kind raised by
the office or by the anaesthetist on their own Procedure, `procedureOwner` and `mayRaise`, the
`run-next-billing-run` trigger and the PWA stand-in `office-reviews-additional-invoice`). It needs
nothing from 39 or 39a, so it may run straight after 38b. By the roadmap order 14 (the demo-trigger
registry, `useDemoTriggerContext`, the PWA sheet, `OFFICE_ACTOR` and `OFFICE_SIMULATION_ACTOR`,
"Office authorises this List"), 15 (Booking vocabulary and the `.../bookings/:bookingId` routes),
15a (the warning triangle; no rule is added here; no submit confirm step), 15b (ACTIVE for an
assigned List), 16 (the `-P` rule and the BCTI count, `bctiRecords` and `bctisFor`), 18 (contract
holders, `CH-STG`, `CT-STG-ACC`, dated Contract versions and the version in force on a date, the
aaCode allocator, the parity fixture), 19 (procedures, `ProcedureType`, the ACL reconstruction
procedure), 19a (`ContractLine` with `fixedRate` and `fixedDiscountPercent`, the resolver with each
value's layer, `isPlainRvgContract`, the new-version copy of lines, `timeUnitsFromMinutes(minutes,
rule)` and `masters.rvgTimeRule`), 19b (modifiers as itemised records: none on an event), 20 (one
Contract per Procedure, the holder-fit rule and the picker's candidate list), 20a (the three-part
stack: an event is not in it), 21 (`billablePartyForProcedure` in `whoIsBilled.ts`, the payer on the
Booking, holder references (`claimReference` on St George's ACC) and completion), 22
(`materialiseInvoices`, `deliveryPlanFor`, `lineage`, `procedureIds`, Contract-driven layout and GST,
the Split button), 23 (exactly one primary Procedure, `isPrimary`), 25 (the `BookingLock` pricing
snapshot, the locked billable party and payee, `regenerateInvoiceFromLock`), 26 (the anaesthetist's
unit value in the profile), 28 (Slots and Lists), 32 and 32a (a moved Booking sits on the doer's
List) and 36 (`newBookingPair`, `handoffPair`, the ledger, one payable leg per receivable,
`bctiRecordsOf`) have also run.
**Estimated:** 2 sessions. Session 1 is the model (with the Contract event fee), the pure rules and
pricing, the store actions with both invoicing branches, the dated and typed billing lines, late
lines and the seed (work items 1 to 7), ending at a green stop point with every action tested at store
level. Session 2 is the anaesthetist and admin screens, the event-fee section of the Contract
editor, the review surfaces, the invoice documents, the triggers, the demo guide and the close-out
(work items 8 to 14).

## Goal

Phase 38b built the event element on a Procedure: its own record, its one standard review step,
next-run invoicing and the events list in all three apps, with the free-form additional invoice as
its first kind. It also withdrew the anaesthetist's post-op addendum Booking, so today an
anaesthetist who sees a patient again (a ward review the next day, a pain consult, a nerve catheter
left in) or before the procedure (an ACC pre-op assessment) can only type a free-form additional
invoice once the Procedure is invoiced, or ring the office. AA asked for the anaesthetist to record
this care themselves (FT-03.7), and OQ-63 (D13) settled how. This phase adds the **pre-op and post-op
kinds** to 38b's element:

- **Add a pre-op or post-op event** (US-03.7.1). From a current Procedure, or a past one reached
  through Phase 38a's archive or search, on mobile and web, the anaesthetist adds an event with its
  own date and start time, recording **either a time** (minutes) **or a fixed fee**. An event takes no
  modifiers and no base units. It has an **invoice tick** (cleared means recorded but never
  invoiced) and a **billable party** set by a **"same as" tick** (the Procedure's billable party, our
  reading of Greg's courier comparison, labelled) or, with the tick cleared, entered in the sheet.
  An **admin can add one too** from the Admin Booking detail, for example when someone rings the
  office. The event is never a Procedure and never primary; it lists in the Procedure's events (38b)
  beside additional invoices and credits.
- **Bill an event** (US-03.7.2, Confirmed). A billable event is **its own line item**, priced from its
  recorded time or its fixed fee; **the Procedure's Contract can carry a fixed fee for that kind of
  event, which replaces the time** (a Contract event fee, below). A recorded time is priced as the
  catalogue prices time: RVG time units (19a's tiers, rounded up per D25) at the rate 24's calculated
  step would use for the Procedure (the Contract line's fixed rate, else the anaesthetist's own unit
  value), less the line's fixed discount, on the Contract version in force on the event's date. On a
  Procedure priced at a Contract fixed price nothing is calculated (US-05.2.5): a timed event there is
  priced by the office at review, or by a Contract event fee. Its invoicing follows the Procedure's
  invoice:
  - **recorded before the Procedure's invoice is approved** (before its List is authorised) and billed
    to the Procedure's party, it **travels with the Procedure**: the office sees it in the List's
    review, and the billing run puts it on the Procedure's invoice as its own line;
  - **recorded after the invoice is raised**, or billed to another party, it is **a separate invoice**,
    traceable to the Procedure, invoiced in **the next run** (38b's `runEventInvoicing`): after the
    invoice, once through 38b's review step; before it, once approved with the List at authorise (an
    invoice to another party cannot carry the Procedure's lines, our reading of "if possible", so
    D13's "otherwise, next run" applies);
  - every event goes through **the one standard review step** (the List's review before approval,
    38b's review step after it), with no separate approval queue; an event whose invoice tick is
    cleared, or that has not been through review, is never invoiced.
- **The ACC pre-op assessment is a pre-op event** (US-05.5.2). The anaesthetist adds a pre-op event of
  type "ACC pre-op assessment" and picks a code (CS250, CS260 or CS70, provisional, OQ-12) from a
  fixed-fee ACC Contract's event fees. It is priced by that Contract, is never primary and shows as
  its own line on the invoice. The free-text ACC caption in the add-billing-line sheet goes.
- **Other billing lines** (US-03.3.6 as it now stands). A billing line gains **a date of its own**
  (defaulting to the List date) and **preset line types** (post-op ward review, HDU review, nerve
  catheter, pain consult, medical transport, other) beside its free-text description; it stays 24's
  fixed-amount line, and 24's rule stands (not offered on a Procedure priced at a Contract fixed
  price). A line the anaesthetist adds after the List is submitted cannot touch the submitted or
  locked Booking: it is recorded as an event (a late line) and follows the same before-or-after
  rule. Choosing "Post-op ward review", "HDU review" or "Pain consult" also offers to add it as a
  post-op event instead (whether these leave the billing-line list is not stated, so both are
  offered). There is **no UNIT x RATE line and no Contract add-on fee line**: both left the catalogue
  on 2026-10-07, and any code that still offers them is removed here.

**Keep the pricing model in one place.** The Contract event fee, the event's rate and discount, its
pricing date and its price live in `aa-prototype/src/domain/billing` (beside 19a's lines and
resolver and 24's precedence) plus the seed, behind types the UI reads. The timed event reuses 24's
calculated-step rate and discount through one exported helper, never a second derivation, so a later
change to the draft design (AR-29, AR-30) or to 24's precedence reaches events without a second edit.

The state gains the pre-op and post-op fields on 38b's event record, two fields on `BillingLine`, an
event line on the invoice, the Contract event fee collection, one event fee on `CT-STG-ACC` and one
new Contract, so `PERSIST_VERSION` is bumped. No seeded figure moves.

## Before you start: drift check

1. Run the drift check against the plan's catalogue snapshot (catalogue commit 60e2d1e):

   ```
   node docs/prototype-build/catch-up/tools/plan-state.mjs --diff FT-03.7,US-03.7.1,US-03.7.2,US-05.5.2,US-03.3.6,US-03.7.3,US-08.6.1,US-08.6.3,US-05.2.6,US-05.2.5,US-04.2.4,US-05.2.1,FT-11.2,US-07.3.2,US-09.1.4,US-10.3.1,OQ-63,OQ-12,OQ-48,OQ-89,OQ-50,OQ-75,OQ-29,OQ-60
   ```

   Read the hunks (if any) for FT-03.7, US-03.7.1, US-03.7.2, US-05.5.2, US-03.3.6, the context items
   and the questions, and the domain-model lines on events (the Procedure section's events
   paragraph), billing lines and the additional invoice. To see why an item says what it says, run
   `npm --prefix requirements-board run source -- --item <ID> --text` and read only the cited
   passages (Node 22.18 or newer). If an item changed, re-read it and adjust the work items. If an
   item is now Retired or Future, drop its work items and record that in the PROGRESS entry. At
   60e2d1e FT-03.7 and US-03.7.1 are **Verify**, US-03.7.2 **Confirmed**, US-05.5.2 **Open** and
   US-03.3.6 **Proposed** (titled "Other billing lines", with no unit x rate line and no Contract
   add-on fees); the screenshots on US-05.5.2 show the earlier flat-fee billing line, and US-03.3.6's
   image list may still carry US-03.3.7's retired rate x time images unless Phase 24 removed them.
   This phase's Catalogue screenshots step re-shoots both.
2. **Owner decisions and questions** (each answer built as stated; each open one kept in one place):
   - **D13 (OQ-63, answered).** Build the answer, not a default: its own element on the Procedure (38b's
     record), a line item, "event" as the one name (38b's label), the invoice tick, the "same as"
     party tick, bundling with the Procedure's invoice before approval and the next run after it, one
     standard review step and no separate approval queue. The two readings the catalogue itself calls
     ours stay labelled: the "same as" default is the Procedure's party (US-03.7.1 note), and an event
     billed to another party gets its own invoice (US-03.7.2 note). Do not add a second rule: both
     already live in 38b's pure event module (`EVENT_RULES.sameAsDefault` with `resolveEventParty`, and
     the same-party condition in `eventInvoicing`); this phase adds its kinds to `EVENT_KINDS`, wires
     `eventInvoicing`'s `'withProcedureInvoice'` branch into the List run (38b's handoff), and comments
     both readings there (work item 2), with the "same as" caption in the copy (work item 8). An
     other-party event recorded before approval is approved with the List and invoiced in the next run
     (`'ownInvoiceNextRun'`, D13's "otherwise, next run"), so one path, 38b's `runEventInvoicing`,
     raises every event invoice. A refund shown as an event is tentative (OQ-63's answer): not built.
   - **OQ-12 (the ACC codes), open** (ROADMAP.md "Confirm before building" row for 39b). Seed CS250,
     CS260 and CS70 as provisional event fees with demo prices on the fixed-fee ACC pre-op Contract
     (work item 6), each fee and the event sheet's code rows labelled "Codes and prices to confirm with
     AA's accountant (OQ-12)". If answered, change only the seeded fees and drop the label.
   - **OQ-48 (pricing date), answered (D45): the procedure date.** A Procedure is priced on the
     Contract version in force on its procedure date (18, 25). An event is a separate service on its
     own date, which the answer does not address; build the procedure-date principle extended to it
     (the service date decides): a timed event or a Contract event fee reads the Procedure's Contract
     version in force on **the event's own date**. One helper, `servicePricingDate(...)`, with the
     reading in its comment, logged on the "For the owner's review" list. A dated billing line is a
     typed amount, so its date prices nothing.
   - **OQ-89, no longer this phase's.** Its questions 1 and 2 are answered in effect (US-03.3.6's note:
     the fixed rate prices the whole Procedure, so there is no unit x rate line) and the add-on flag
     is dropped (question 3). Its open parts (the time band, a discount on top of a fixed discount)
     are D40's defaults in 19a and 24. Nothing to build or label here.
   - **The 2026-09-28 ruling, as 24 and 38b left it.** 24 superseded it in part for the Procedure's
     price section (a third-party price shown read-only, a fixed rate and fixed discount shown locked,
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
     the shared additional-invoice form's party field is reusable here, where the anaesthetist's
     "Raise additional invoice" button sits on the stack, and `stage-post-op`'s current routes, `when`,
     body and result copy (38b kept it for Dr Sharma's Tue 14 Jul AM List and the additional-invoice
     beat; 39 and 39a beats may depend on it);
   - from **24**: `priceProcedure`, `PriceResult` (`rate` and its origin, `discountPercent` and its
     origin), `PriceSource`, `adjustmentAllowed`, the `billingLineOnFixedPrice` rejection and its
     sentence, whether the calculated step's rate and discount are already an exported helper (work
     item 2 needs one), the reduced `ChargeBasis`, the remaining `BillingLine` fields, and that no
     `unitRateFor`, `rateTime` or hourly line remains;
   - from **19a**: `ContractLine`, `lineFor`, the resolver's name and output, `isPlainRvgContract`,
     how 18's new-version action copies lines (event fees copy the same way), the `CT-STG-ACC`
     fixed-rate lines ($25.00 a unit on the orthopaedic, hand and spine sections, from `RATE_LINES`),
     `timeUnitsFromMinutes(minutes, rule)` and `masters.rvgTimeRule`;
   - from **38a**: `searchBookingsFor`, the archive's `?day=` and the search's `?q=` URL state, which
     Lists the main view holds (an un-invoiced submitted List stays; an invoiced one leaves), and how a
     billed List's Booking detail renders read only;
   - from **18**: the holder master (`CH-STG`, `billsHolder`, `billablePartyRef`), `CT-STG-ACC`, the
     version-in-force lookup, the aaCode allocator and the id-to-code table pinned in `seed.test.ts`,
     the parity fixture `domain/billing/__parity__/phase-18-baseline.json`;
   - from **19**: `ProcedureType` and the ACL reconstruction procedure's id; from **20**: the holder-fit
     rule and the picker's candidate list (it must never offer a Contract that has only event fees);
     from **21**: `billablePartyForProcedure`, the payer on the Booking, holder references and the
     party picker; from **22**: `materialiseInvoices`, `deliveryPlanFor`, the `lineage` roles,
     `procedureIds`, `gstTreatment`, the Split button's records and how a split Procedure's invoices
     are told apart; from **25**: `BookingLock`, the locked billable party and payee,
     `regenerateInvoiceFromLock`; from **36**: `newBookingPair`, `handoffPair`; from **16**:
     `bctiRecords`, `bctisFor`; from **26**: where the anaesthetist's unit value lives; from **14**: the
     registry file, `OFFICE_ACTOR`, `OFFICE_SIMULATION_ACTOR`, the PWA sheet, "Office authorises this
     List"; from **15**: `src/shared/booking/BookingDetailBody.tsx` and the Booking routes.
   - If 39 has already run, note whether its credit note and credit-and-rebill accept an invoice that
     carries event lines and an event invoice (work item 3's corrections bullet).
4. **Leftovers.** Grep `aa-prototype/src` and `aa-prototype/visual` for `isAddOn|quantityRule|addOnLines|addOns|unitRateFor|UNIT x RATE|unit x rate|rateTime|Rate × time|permitsIndividualArrangement|Ancillary fixed amount`. Expected: none outside history comments (24 removed the rate x time line and its Method 3 gate). Anything found is removed in work item 4 and recorded.
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
  under the Procedure as the billing lines card does), the bottom sheet anatomy for the event and
  billing-line sheets. Mobile-first: bottom sheets with tappable rows, never desktop forms or dropdowns
  (convention 16).
- `docs/design/Web Dashboard.dc.html`: the web panel anatomy for the same section on the web Booking
  detail (the shared body renders both).
- `docs/design/Admin Review.dc.html`: the admin table, tabs, side sheet and pills for the List review's
  events, 38b's review step and the Contract editor's event-fee section. No mockup covers events or
  the invoice document: extend 38b's surfaces, 19a's lines grid, `InvoiceDocument`'s print sheet and
  rail, and the Invoices table as they stand.

**Catalogue items:** the covered and context files listed above, and the pricing artifacts AR-28,
AR-29 and AR-30 at the regions named in the header (US-03.3.6 also links
[AR-24#record-billing](../../../../requirements-board/requirements/artifacts/AR-24.md)). The meeting
notes:
- 2026-10-01 #6 (the ACC pre-op assessment as a fixed-fee Contract, never primary, recorded as a pre-op
  event; time or fixed price events with no other modifiers; a Contract can replace a recorded time
  with a fixed fee), #34 (the events feature: post-care self-service instead of ringing the office,
  its own date and time; a significant job is another Booking), #46 (an ACC pre-op assessment is never
  the primary), #54 (OQ-12 is with AA's accountant) and #61 (admin approval of anaesthetist events,
  settled by 2026-10-02 #4 as one review step for all);
- 2026-10-02 #4 (OQ-63 answered: its own element; a line item; "event" for everything, tagged pre-op
  or post-op in one generic place; "an event that occurs before the invoice is approved just travels
  with the procedure. An event that happens after the invoice is raised generates a separate invoice";
  a pre-op event is billed with the procedure, not before; the admin team can add events; the
  billable-or-not button), #24 (the "same as" billable-party tick, default not stated), #25 (events as
  the Procedure's history; a refund as an event, tentative), #26 (anaesthetists may submit at once and
  "wash up" post-ops in the next round; the rule covers both), #35 (for Ben: whether unbilled events
  are recorded today and whether submitting is held back; nothing to build) and #44 (Greg not convinced
  by "events");
- 2026-10-02 booking and pricing review #21 and #55 (the unit x rate rewording, now history);
- 2026-10-06 directors #11 and 2026-10-07 Greg #5 (a fixed-rate Contract prices the whole procedure;
  the add-on flag and quantity rule dropped: why US-03.3.6 lost both lines).

**Analysis files:**

- `docs/prototype-build/catch-up/GAP-ANALYSIS.md`: theme 5 ("Events, additional invoices, credit and
  rebill"), the FT-03.7, US-03.7.1, US-03.7.2, US-03.7.3, US-03.3.6 and US-05.5.2 rows (US-03.3.6
  re-graded at 60e2d1e: Contradicts on the rate x time line, Phase 24's, and Missing on the own date
  and preset types, this phase's), the DM-17 and DM-46 rows, RV-10 and RV-24, the EP-03 and EP-05
  structural notes (EP-03's names the 'Stage post-op scenario' trigger to retire or re-point), and the
  "Demo-trigger buttons" section.
- `docs/prototype-build/catch-up/epics/EP-03.md` (FT-03.7, US-03.7.1, US-03.7.2, US-03.3.6) and
  `epics/EP-05.md` (US-05.5.2).
- `analysis/domain-model-delta.md` DM-17 (and DM-18 for the additional invoice it sits beside, DM-22
  for the ledger pair and the invoice kinds, DM-09 for Contract lines, DM-50 for the one precedence
  whose calculated step a timed event reuses, DM-46 for the removed rate x time line).
- `analysis/prototype-map-shared.md` (the shared Booking detail body, `BtmCaptureBlock`,
  `BillingLinesCard`, `AddBillingLineSheet`), `prototype-map-apps-mobile-web.md` (the mobile and web
  Booking routes), `prototype-map-admin.md` (Review, Invoices, the invoice document, the Contract
  editor), `prototype-map-store-seed.md` (`billingLineActions`, counters, the seed's Contracts) and
  `prototype-map-domain.md` (`fee.ts`, `invoiceBuild.ts`, `timeUnits.ts`).

**Code entry points** (line numbers are from 3d3a18c; phases 15a to 38b will have moved them: use the
names from the drift check):

- Billing lines: `src/domain/types.ts` `BillingLine` 528 to 541 (no date, no type), `ChargeBasis` 519
  (24 dropped `'rateTime'`); `src/store/billingLineActions.ts` (`addBillingLine` 46, guarded by
  `editRefusal` at 57, which refuses an anaesthetist on a List that is not ACTIVE after 15b; 24's
  fixed-price refusal; `removeBillingLine`; whatever 22 left of the funder-allocation rule);
  `src/store/lifecycle.ts` `editRefusal` 48 (unchanged by this phase);
  `src/shared/capture/AddBillingLineSheet.tsx` (the fixed amount line as 24 left it; the ACC detail at
  85 and caption at 107, both of which go); `src/shared/capture/BillingLinesCard.tsx` (the list and the
  "Add billing line" foot, rendered from `BtmCaptureBlock.tsx`).
- Pricing: 24's `src/domain/billing/pricePrecedence.ts`, 19a's `contractLines.ts` and resolver,
  `src/domain/billing/timeUnits.ts` (19a's `timeUnitsFromMinutes(minutes, rule)`), `fee.ts` (the
  captured fixed-amount lines, which pass their date through after this phase),
  `src/domain/billing/invoiceBuild.ts` (the line snapshot and `describeFeeLine`), `InvoiceLine`.
- Booking detail: `src/shared/booking/BookingDetailBody.tsx` (the procedures loop; 38b's events list
  under each Procedure; 20a's stack with 38b's "Raise additional invoice" on its Contract part).
- Admin: `src/apps/admin/screens/ReviewQueue.tsx` and `ReviewScreen.tsx` (the List review, where a
  List's events show before authorise), 38b's review step for events, `InvoiceDocument.tsx`,
  `InvoicesScreen.tsx`, the Admin Booking detail, 19a's Contract lines grid in the Contract editor,
  `src/apps/admin/flows/` (38b's additional-invoice sheet for the sheet pattern),
  `src/apps/admin/routes.tsx`, `src/router.tsx`.
- Billing run: `src/store/billingRun.ts` (`runBillingForList` 68, run on the `listAuthorised` app event
  from `src/store/events.ts`; that file is the app-event emitter, not the event element, so do not
  name anything of this phase after it).
- Seed: `src/domain/seed/contracts.ts` (`CONTRACT.stgAcc` is `CT-STG-ACC`), 19a's contract lines seed,
  `src/domain/seed/cast.ts` (`SURG.hale`, Mr T. Hale, Orthopaedics; `ANAE.souter`),
  `src/domain/seed/patients.ts` (`PAT.bennett`, Coral Bennett, `ZAG5541`), 19's procedure seed (the
  ACL reconstruction procedure), 25's `masters.contractVersions`.
- Store plumbing: `src/store/mutate.ts` `ID_FORMATS` (`billingLine: { prefix: 'BL', pad: 4 }` 66),
  `allocateId`, `clockISO`; `src/store/appStore.ts` (`PERSIST_VERSION`, `freshAppState`,
  `resetDomainState`); `src/shared/audit/fieldLabels.ts` and `ACTION_LABELS`
  (`src/shared/audit/actionLabels.ts`).
- Demo: `src/shared/demoTriggers/registry.ts` (`stage-post-op` and 38b's
  `office-reviews-additional-invoice`), the PWA sheet, `pwaPurity.test.ts`, `demoTriggers.test.ts`.
- Tests to extend: `store/captureActions.test.ts` (where `addBillingLine` is tested at 3d3a18c),
  `domain/billing/fee.test.ts`, `invoiceBuild.test.ts`, `pricePrecedence.test.ts`,
  `contractLines.test.ts`, 38b's event action tests, `store/billingRun.test.ts`, 16's count test,
  `seed.test.ts`, `store/persistMigrate.test.ts`, `shared/demoTriggers/demoTriggers.test.ts`,
  `pwaPurity.test.ts`, and the Playwright specs that shoot the Booking detail and the add-billing-line
  sheet.

## Work items

### Session 1: model, pricing, store and seed

1. **Model** (`domain/types.ts`, extending 38b's record; the event-fee type in 19a's billing module).
   US-03.7.1, US-03.7.2, US-03.3.6.
   - 38b's kind union gains `'preOp' | 'postOp'`. `PrePostOpEventType` = `'postOpWardReview' |
     'hduReview' | 'painConsult' | 'accPreOpAssessment' | 'otherPreOp' | 'otherPostOp'`.
   - Reuse 38b's record as it stands: `occurredOnISO` is the event's date, `startTime` its start time,
     `billable` the invoice tick, `party: EventParty` (`{ sameAs: true }` or a named party; a person
     entered by name and email goes through 21's payer and party path), `review` (38b's states,
     `approveProcedureEvent` and `declineProcedureEvent`), `invoiceId` (the event's own invoice) and
     `addedBy`. Add only what 38b lacks, as the new members of 38b's `detail` union: `{ kind: 'preOp' |
     'postOp'; type: PrePostOpEventType; recording: EventRecording; origin: 'event' | 'lateLine' }`.
     Beside them on the record: `pricing?: EventPricing` (frozen at approval), `invoiceRoute?:
     'procedureInvoice' | 'ownInvoice'` (frozen at approval from 38b's `eventInvoicing`) and
     `invoiceLineId?` (a line on the Procedure's invoice).
   - `EventRecording`, a discriminated union:
     - `{ kind: 'time'; minutes: number }`;
     - `{ kind: 'fixedFee'; source: 'contractEventFee'; contractId; eventFeeId }` (an ACC code, or the
       Contract's fee for this type of event);
     - `{ kind: 'fixedFee'; source: 'typed'; amount }` (no Contract fee exists; the person adding it
       types it, ex GST);
     - `{ kind: 'line'; line: LateLineInput }` for a late billing line (work item 5), where
       `LateLineInput` is the billing line input of work item 4.
     There is no modifier, base-unit or RVG field anywhere on the record (US-03.7.1 AC 2).
   - **`ContractEventFee`**, the one addition to the Contract (in 19a's `contractLines.ts` or a
     sibling `contractEventFees.ts` in the same folder, re-exported from the billing index and through
     `types.ts`): `{ id; contractId; eventType: PrePostOpEventType; holderCode?: string;
     holderDescription?: string; fixedPrice: number }`, `fixedPrice` ex GST, 0 or more. `contractId`
     is the Contract version, as 19a's lines are. A Contract version holds at most one fee per event
     type, except `accPreOpAssessment`, which may hold several (one per code, told apart by
     `holderCode`). The type comment says: the draft design (AR-29, AR-30) has no event and no
     event fee; US-03.7.2 AC 3 ("a Contract with a fixed fee for the event") needs one; it is kept
     beside the lines so a v5 that models it differently is one edit. `allocateId` gains a
     `contractEventFee` kind (`CEF###`). `SeedMasters` and `AppState['masters']` gain
     `contractEventFees`.
   - `EventPricing`, written at review and frozen with the invoice, so 25's Regenerate can reproduce
     it: `{ basis: 'time' | 'contractEventFee' | 'typedFixedFee' | 'line' | 'officePrice';
     pricingDateISO; minutes?; timeUnits?; rate?; rateOrigin?: 'fixedRate' | 'unitValue';
     discountPercent?; contractId?; contractVersion?; eventFeeId?; holderCode?; replacedMinutes?;
     amount; officeReason? }`, amounts ex GST in dollars to the cent as every stored price.
     `contractVersion` is the version the price was read from, so the event is traceable to a
     Contract version as a lock is.
   - `BillingLine` gains `serviceDateISO?: IsoDate` (absent means the List date) and `lineType?:
     BillingLineType`. `BillingLineType` = `'postOpWardReview' | 'hduReview' | 'nerveCatheter' |
     'painConsult' | 'medicalTransport' | 'other'`. `chargeBasis` stays 24's `'fixed'` for these lines
     (a typed amount), so nothing that switches on `ChargeBasis` ripples. No add-on, quantity or unit
     x rate field.
   - `InvoiceLine` gains `serviceDateISO?` and `eventId?` (an event line on the Procedure's invoice).
     An event's own invoice uses 38b's event-invoice kind and lineage role; add neither twice.
   - Thread anything new through `AppState`, the empty schedule slice, `freshAppState`,
     `resetDomainState` and the seed builders (38b added the slice; only new fields here).
2. **Pure rules and pricing.** The routing and party rules stay in 38b's
   `src/domain/billing/procedureEvent.ts`, extended there; the type table, validation and pricing go in
   `src/domain/billing/prePostOpEvent.ts`, re-exported from the billing index, Vitest-covered
   (convention 9). Nowhere else is a pre-op or post-op event validated, priced or routed.
   - **38b's module, extended** (one rule, no second constant): `EVENT_KINDS` gains `preOp` and
     `postOp` (`addedBy: ['anaesthetist', 'office']`, `anaesthetistOwnOnly: true`, `tick: 'shown'`,
     `reviewed: true`, `mayBundle: true`, `needsInvoicedProcedure: false`); `validateEventBase`'s date
     rule becomes per kind (a pre-op event may be dated before the List date: item below);
     `eventInvoicing`'s `'withProcedureInvoice'` branch becomes reachable. Comment D13 and the two
     labelled readings beside `EVENT_RULES`: `sameAsDefault` resolves through `resolveEventParty` to
     the Procedure's billable party (21's `billablePartyForProcedure`; our reading of #24), and an
     event billed to another party, or recorded once the Procedure's invoice is approved, is
     `'ownInvoiceNextRun'` (our reading of "if possible"; D13's "otherwise, next run"). "Own" is 38b's
     `procedureOwner` (the locked payee once invoiced, else the List's anaesthetist).
   - `EVENT_TYPES`: per type, its kind (pre-op or post-op), whether it takes a time, a fixed fee or
     both, and whether its fixed fee may come from another fitting Contract (`accPreOpAssessment`
     only). Labels live in the copy (work item 8), not here.
   - `validatePrePostOpEvent(input, { listDateISO, todayISO })`, which calls 38b's `validateEventBase`
     for the shared checks: a pre-op event is dated on or before the List date, a post-op event on or
     after it, neither after the later of today and the List date ("An event cannot be dated in the
     future."); a time is whole minutes from 1 to 720; a typed fee is above zero; a type that needs a
     Contract fee has one; a cleared "same as" tick needs a party. Returns `null` or `{ code; message;
     field }`.
   - `servicePricingDate(event)`: the event's own date (OQ-48's answer, the procedure date, extended to
     a separate service; the reading in its comment).
   - `eventFeeFor({ eventFees, contractVersionId, type })`: the Contract version's fee for the type,
     else undefined. `accPreOpFeesFor({ contracts, holders, eventFees, booking, procedure, dateISO })`:
     the `accPreOpAssessment` fees on the Procedure's own Contract version in force on the date first,
     then on other Contract versions in force on the date whose holder fits the Booking by 20's
     holder-fit rule (the one fit function, imported, never copied), in Contract then `holderCode`
     order, for the picker.
   - **One rate helper, shared with 24.** If 24 did not export it, extract from `priceProcedure`'s
     calculated step a pure `calculatedRateAndDiscount(terms, anaesthetist)` returning `{ rate;
     rateOrigin: 'fixedRate' | 'unitValue'; discountPercent; discountOrigin }` (the line's fixed rate,
     else the anaesthetist's own unit value; the line's fixed discount, else none), and make
     `priceProcedure` call it, so the two cannot drift. The anaesthetist's own typed price or %
     discount on the Procedure (24's adjustment) is never applied to an event (a labelled reading:
     the adjustment is on the Procedure's price).
   - `pricePrePostOpEvent(event, ctx)` with `ctx = { procedure; contractVersion; resolvedTerms;
     eventFees; anaesthetist; timeRule }`, where `contractVersion` is the Procedure's Contract version
     in force on `servicePricingDate` (18's lookup) and `resolvedTerms` are 19a's resolver output for
     the Procedure's procedure on that version. Returns `{ kind: 'priced'; pricing: EventPricing;
     description }` or `{ kind: 'refused'; code; message }`:
     - **a Contract event fee replaces a time** (US-03.7.2 AC 3): when `eventFeeFor` finds a fee for
       the type, the price is its `fixedPrice`, `basis: 'contractEventFee'`, with `replacedMinutes`
       set for a time event ("Contract fee STGACC-PAIN replaces 40 min");
     - **a time** otherwise: `timeUnitsFromMinutes(minutes, timeRule)` (the RVG rule, OQ-50, rounded
       up per D25) x the helper's rate, less its discount, rounded once to the cent;
     - **refused `noEventRate`** when `resolvedTerms` set a fixed price for the procedure (US-05.2.5:
       on a fixed-price Contract the system calculates nothing further): "This procedure has a fixed
       price, so a timed event is not calculated. Set a price in review."; and **refused
       `contractNotInForce`** when no version of the Procedure's Contract is in force on the event's
       date ("{Contract} is not valid on {date}. Set a price in review.");
     - **a typed or code fixed fee** as recorded; a **late line** at its typed amount;
     - an event whose invoice tick is cleared is refused `notInvoiced` (it is never priced);
     - no modifier or base-unit input exists in `ctx`;
     - the Contract, terms and fees in `ctx` are the live Contract version read on the event's date,
       never the Booking's lock: the event is a new service priced once at review and frozen in
       `pricing` (with `contractVersion`). The lock is not read for the rate and never written.
   - Routing is 38b's `eventInvoicing(event, { procedureInvoiced, sameParty })`, not a new function:
     `sameParty` is true for the "same as" tick or an entered party equal to the Procedure's;
     `'withProcedureInvoice'` maps to `invoiceRoute: 'procedureInvoice'` and `'ownInvoiceNextRun'` to
     `'ownInvoice'`; an un-ticked event has no route. An ACC code taken from another Contract whose
     who-is-invoiced (21's function on that Contract) differs from the Procedure's sets the event's
     party to that Contract's and clears "same as" (a labelled reading), so it is invoiced on its own.
     On a Procedure split by 22's Split button, the "same as" party is the Procedure's who-is-invoiced
     and the line goes on that party's invoice, never split (our reading, commented beside
     `EVENT_RULES`).
   - `eventInvoiceLine(event, pricing)`: one line, description such as "Post-op pain consult · 18 Jul
     2026 · 40 min, Contract fee" or "ACC pre-op assessment · CS250 · 13 Jul 2026", with
     `serviceDateISO`, `eventId`, quantity 1, the amount ex GST (GST at the invoice foot, 22).
   - Tests (worked figures): 45 min on an ACL reconstruction under `CT-STG-ACC` (fixed rate $25.00 a
     unit on its orthopaedic line) is 3 units, $75.00; 121 min enters the second tier (8 + 1 = 9
     units, the part interval rounded up); the same 45 min under No contract (RVG) at a fixture unit
     value of $30.00 is $90.00 (`rateOrigin: 'unitValue'`); a fixed discount of 10% on a fixture line
     takes $75.00 to $67.50; a Contract event fee replaces 40 min with its fixed price; a fee on the
     Contract's later version is used for an event dated in it and not for one dated before it; an
     ACC code fee priced on its date; a typed fee; `noEventRate` on a fixed-price Procedure (the Doyle
     bariatric line) and `contractNotInForce`; every validation refusal, including both date edges, the
     future date and a missing entered party; an un-ticked event refused; each `eventInvoicing` branch
     for the new kinds (same party before, same party after, other party before, un-ticked) and the
     per-kind date rule in `validateEventBase`; `priceProcedure`'s worked examples W1 to W12 still
     pass after the helper is extracted; determinism; and a guard that the module imports nothing from
     the modifier modules and derives no rate of its own (it calls the shared helper).
3. **Store: pre-op and post-op events** (`src/store/prePostOpEventActions.ts`, or 38b's event actions
   file extended; exported from `store/index.ts`). US-03.7.1, US-03.7.2.
   - **The guard.** Extend 38b's event guard (keep `editRefusal` exactly as it is, so a billed Booking
     stays locked: 38a's handoff): for a pre-op or post-op event the actor is the Procedure's owner
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
   - **Before the Procedure's invoice: it travels with the Procedure.** While the List is not yet
     authorised, a billable pre-op or post-op event is reviewed in the List's review, and only there:
     38b's `eventsAwaitingReview` (the Events tab) leaves out events whose List is not yet authorised,
     so no event has two review paths. In the authorise commit (25's lock is written there) and the
     billing run it triggers (`runBillingForList`), for each ticked pre-op or post-op event awaiting
     review on the List's Procedures, in event id order: `pricePrePostOpEvent`, freeze `pricing`,
     approve it as the authorising office actor (38b's `review.state: 'approved'`), freeze
     `invoiceRoute` from `eventInvoicing`, then
     - `'procedureInvoice'`: 22's `materialiseInvoices` adds `eventInvoiceLine` to the Procedure's
       invoice (its own line, after the Procedure's lines, with its date) and stamps `invoiceLineId`.
       The invoice's total, its ledger pair (36) and its one payable leg include it; no new invoice,
       pair or BCTI. Audit `invoice.eventLine` (event, Procedure, invoice, amount). `runEventInvoicing`
       reads the frozen `invoiceRoute` and skips any event with `invoiceLineId` (re-deriving
       `eventInvoicing` after authorise would say `'ownInvoiceNextRun'` and invoice it twice), and
       38b's `eventStatus` reads such an event as `invoiced`;
     - `'ownInvoice'` (another party): approved, it waits for the next run like any approved event
       (38b's `approvedEventsAwaitingRun`), and `runEventInvoicing` raises its own invoice, traceable
       to the Procedure and the now-raised original invoice (38b's `additionalTo` lineage), with 36's
       pair to the locked payee, laid out and delivered by 22's rules for the Contract it was priced
       under. The authorise run raises no event invoice.
     An event refused `noEventRate` or `contractNotInForce` is left out and stays awaiting review, now
     in 38b's Events tab ("Needs a price: invoiced in the next run once priced"); the List authorises
     as normal.
   - **After the Procedure's invoice: the next run.** An event recorded once the List is authorised
     goes through 38b's review step (the Events tab and `EventReviewSheet`). `approveProcedureEvent`
     prices it for these kinds (item 2; an `officePrice` with a reason replaces the computed price,
     `basis: 'officePrice'`, and is required on `noEventRate` and `contractNotInForce`) and freezes
     `pricing`; the office confirms or changes the party (21's picker, audited); 38b's
     `runEventInvoicing` raises its own invoice from the frozen `pricing` (extend its pricing step for
     these kinds; additional invoices keep `priceFreeFormInvoice`), exactly as for an additional
     invoice. One path, `runEventInvoicing`, raises every event invoice, once.
   - Not invoiced: an event with the tick cleared never enters review, is never priced and never
     invoices; the office can still see it in the Procedure's events.
   - **BCTI feed:** an event's own invoice's ACCPAY appears in `bctiRecords` through the same rule as
     any ACCPAY (or payable leg, as 36 left it). Extend 16's count test: one event invoice adds exactly
     one BCTI for its month; an event line on the Procedure's invoice, an un-ticked, unreviewed,
     approved-but-not-run or declined event add none.
   - **Corrections:** a credit note over an invoice with event lines, or over an event invoice, is
     Phase 39's (it may run after this phase). If 39 has run, test that its credit and rebill handle
     both (a rebill re-prices an event line from its frozen `pricing`, never the Procedure's lock);
     if not, record it in the handoff for 39. No new correction UI.
   - Regenerate: 25's `regenerateInvoiceFromLock` reproduces an invoice with event lines and an event
     invoice from the lock plus each event's frozen `pricing`; extend it to read them.
   - Selectors: reuse 38b's `eventsForProcedure`, `eventsForBooking`, `eventsAwaitingReview` (filtered
     as above) and `approvedEventsAwaitingRun`; add `prePostOpEventsAwaitingListReview(listId)` for the
     List review, and `eventLinesFor(invoiceId)` (derived, never stored on the invoice).
   - **Contract event fee actions** (office only, for the Contract editor in work item 10):
     `addContractEventFee`, `editContractEventFee` and `removeContractEventFee`, each validated (a
     fixed price of 0 or more; at most one fee per event type per version except ACC codes, unique by
     `holderCode`; the Contract version exists) with refusal sentences, audited, and refused on a
     version that is no longer current as 19a refuses line edits there. 18's new-version action
     copies the version's event fees as 19a made it copy lines (new ids, same terms); a test proves an
     edit on the new version leaves the old version's fee untouched. **`isPlainRvgContract` (19a)
     gains "and has no event fees"** in the one helper, so a Contract holding only event fees is never
     a plain RVG Contract and never offered in 20's picker; test it.
   - Tests: add on an ACTIVE, a SUBMITTED and a billed List as the owner and as the office; refused for
     another anaesthetist, a cancelled Booking or Procedure, a Draft List; the Booking, Procedures and
     lock deep-equal before and after; edit and remove until reviewed, refused after; authorise with a
     same-party event puts one dated line on the Procedure's invoice (total, pair and payable include
     it, BCTI count unchanged); authorise with an other-party event approves it and raises no invoice,
     then `runEventInvoicing` raises one event invoice; a pre-authorise event never appears in
     `eventsAwaitingReview`; an event added after authorise is invoiced only after 38b's review and
     next run, once; authorise twice, the run twice and a replayed handoff raise nothing twice; an
     un-ticked event never invoices; `noEventRate` before approval is left for review and priced there;
     the BCTI count above; the event fee actions and the version copy; Regenerate reports "identical"
     on both kinds of invoice.
4. **Billing lines: a date and a type** (`billingLineActions.ts`, `fee.ts`, `invoiceBuild.ts`).
   US-03.3.6.
   - `AddBillingLineInput` gains `serviceDateISO?` and `lineType` (required from the UI; default
     `'other'` for old callers). The date may not be before the List date, nor after today unless it
     is the List date (an ACTIVE List can be in the future). The amount stays typed (24's fixed
     amount line), above zero; 24's refusal on a fixed-price Procedure stands unchanged.
   - `fee.ts` keeps its shape; a dated line passes its date through to the fee line, and
     `invoiceBuild.ts` copies it to `InvoiceLine.serviceDateISO` when it differs from the List date.
     A typed line's fee line reads "{type label} · {description}" with the date where it differs.
   - **No UNIT x RATE line and no Contract add-on line** (US-03.3.6, 2026-10-07). If drift check
     step 4 found any add-on, quantity-rule, unit-rate or hourly remnant, remove it (code, tests,
     copy, `ACTION_LABELS`) and record it; 24's grep test that no second rate derivation exists still
     passes.
   - 18's parity fixture and 24's parity must match unchanged (no seeded Procedure has a dated or
     typed line): run them, never with `-u`.
   - Tests: a dated line keeps its date onto the invoice line; each preset type round-trips; the date
     edges; the fixed-price refusal still fires for a typed, dated line; the conservation rule (if 22
     kept one) still holds with dated lines.
5. **Late billing lines are events** (`prePostOpEventActions.ts`). US-03.3.6's "days later".
   - `addLateBillingLine(api, actor, procedureId, input)`: the anaesthetist's line when the List is not
     ACTIVE (`editRefusal` would refuse `addBillingLine`). It validates the line through item 4
     (including 24's fixed-price refusal: a fixed price is the whole price, so a late line there is
     refused with 24's sentence, which points at an additional invoice) and records an event with
     `origin: 'lateLine'`, `recording: { kind: 'line', line }`, kind from the line's date against the
     List date, the invoice tick on, the "same as" party. From here it is an event: before authorise
     it travels with the Procedure's invoice, after it 38b's review and next run; the same BCTI rule.
     Audit `procedureEvent.add` with `origin`. The Procedure's `billingLines` are never written after
     submit.
   - `addBillingLine` itself is unchanged for the office (it may still add lines to a SUBMITTED List)
     and for the anaesthetist on an ACTIVE List.
   - Tests: an anaesthetist line on a SUBMITTED List becomes a late-line event and the Booking is
     deep-equal; authorise puts it on the Procedure's invoice with its date; on a billed List it is
     invoiced on its own after review; a late line on a fixed-price Procedure is refused.
6. **Seed: the Contract event fees** (`seed/contracts.ts` and 19a's lines seed; labelled demo prices).
   - **St George's ACC (`CT-STG-ACC`, holder `CH-STG`, fixed-rate lines at $25.00 a unit from 19a)
     gains one event fee** on its current version: `STGACC-PAIN` "Acute pain review, fixed fee"
     ($120.00, `eventType 'painConsult'`). Its lines are untouched, so every seeded Procedure on it
     prices exactly as before; its fixed rate prices a timed event (45 min is 3 units, $75.00).
   - **New `CT-ACC-PREOP` "ACC pre-operative assessment, St George's"**: holder `CH-STG` (the same holder
     as `CT-STG-ACC`, so who is invoiced is the same party and an ACC pre-op event on a St George's ACC
     Procedure rides on the Procedure's invoice as its own line), third party, dated from
     2026-01-01, its `aaCode` from 18's allocator, no lines and no holder references. Event fees
     (`CEF` ids): `CS250`, `CS260` and `CS70` "ACC pre-op assessment", demo prices, `eventType
     'accPreOpAssessment'`, each with the OQ-12 note. Because it has event fees it is not a plain RVG
     Contract, so 20's picker never offers it for a Procedure (item 3's `isPlainRvgContract` change;
     test it). Labelled reading: ACC Contracts are held via the hospital, as 18 seeded St George's ACC;
     other hospitals' ACC pre-op Contracts are master data (Phase 42).
   - Both Contracts carry 25's version history: the seeded v1 snapshot in `masters.contractVersions`
     includes the event fees, so `contractVersions.test.ts` ("the latest version deep-equals the live
     Contract and lines") still holds, extended to fees.
   - Neither change moves a figure: 18's parity fixture, 24's parity and 25's `phase-25-invoices.json`
     must match unchanged, and every S1 to S5 figure stands. Update the pinned id-to-code table in
     `seed.test.ts`.
   - Bump `PERSIST_VERSION` by one (the event fields, the line fields, the invoice line fields, the
     event fee collection and the new Contract) with a comment line ("Phase 39b: pre-op and post-op
     events"). Extend `persistMigrate.test.ts` (a stale payload is discarded to the fresh seed). Two
     fresh seeds deep-equal.
7. **Session 1 stop point.** Every action above tested at store level; `npm run build`,
   `npm run build:pwa` and `npx vitest run` green before session 2 starts.

### Session 2: screens, review, documents, triggers and docs

8. **Copy in one place.** Extend 38b's event copy (`procedureEventCopy.ts`, the one label for
   "event"; do not define the word again): the kind labels ("Pre-op", "Post-op"), "Add pre-op or
   post-op event", the type labels ("Post-op ward review", "HDU review", "Pain consult", "ACC pre-op
   assessment", "Other pre-op", "Other post-op"), the tick captions ("Invoice this event" with
   "Cleared: kept on the record, never invoiced." and "Billed to the same party as the procedure" with
   the reading caption "Our reading: the same party as the procedure unless you change it."), the
   routing captions ("Goes on the procedure's invoice when the List is approved." and "Invoiced on its
   own in the next run, after review."), the pricing caption for a timed event ("The office prices the
   time at review."), and the OQ-12 caption. `BILLING_LINE_TYPE_LABEL` ("Post-op ward review", "HDU
   review", "Nerve catheter", "Pain consult", "Medical transport", "Other") goes in the same file or
   beside it, PWA-safe. No en or em dash in any of them.
9. **Anaesthetist side: the events and the sheets** (the shared Booking detail body, so mobile and web
   render the same; US-03.7.1, US-03.1.4 parity).
   - 38b's events list under each Procedure shows the new kinds: date and start time (mono), a Pre-op
     or Post-op pill, the type, what was recorded ("40 min", "Fixed fee", "CS250", or the late line's
     type and date), "Not invoiced" when the tick is cleared, the party, and the review state on 38b's
     pills ("On the procedure's invoice" with the invoice number in mono once billed, or 38b's
     own-invoice state). Amounts follow 38b's `EVENT_RULES.anaesthetistSees` (drift check step 2): a
     total once one exists, never a calculation. Edit and remove under `mayEditEvent`. The section now
     shows always on the owner's Procedure so the add button has a home.
   - The list's foot: a secondary teal **Add pre-op or post-op event**, shown on any List state when the
     guard allows. On a billed List it sits beside 38b's **Raise additional invoice** as the
     anaesthetist's controls on the read-only Booking (38a's handoff); the rest stays read only.
   - **`AddPrePostOpEventSheet`** (via `useSurface`, a bottom sheet on mobile; or 38b's shared form
     extended): Pre-op or Post-op (segmented), the type as tappable rows, the date (defaulting to the
     List date for pre-op and the day after for post-op, capped at today) and start time, then "Record
     a time" (a minutes stepper in 5-minute steps, mono, with the pricing caption and no preview) or
     "Fixed fee": a Contract event fee shows "Fixed fee under this procedure's Contract" with its price
     read-only (as 24 shows a third-party price); the ACC pre-op type lists the codes from
     `accPreOpFeesFor` as rows ("CS250 · ACC pre-op assessment", price read-only) with the OQ-12
     caption; otherwise a typed amount. The **invoice tick** (on by default) and the **"same as"
     tick** (on by default, with the reading caption); clearing it opens 21's party picker (an
     organisation, or a person by name and email). The routing caption under the primary teal **Add
     event** says where it will be invoiced. Refusals inline against the field.
     `data-shot="add-event-sheet"`.
   - **`AddBillingLineSheet`** (24's fixed amount line) gains a **Type** row set (the preset types)
     and a **Date** field (defaulting to the List date). The ACC detail and caption go; in their place,
     on any type: "An ACC pre-op assessment is a pre-op event." with a link button **Add as pre-op
     event**. Choosing "Post-op ward review", "HDU review" or "Pain consult" shows "Usually added as a
     post-op event, with its own date and time." and **Add as post-op event instead**, which opens the
     event sheet with the type carried over. On a List that is not ACTIVE the sheet's banner reads
     "This List is submitted. This line is recorded as an event and invoiced with the procedure, or on
     its own if the invoice is already raised." and **Add line** calls `addLateBillingLine`. It is
     still not offered on a fixed-price Procedure (24). `data-shot="add-billing-line-sheet"`.
   - `BillingLinesCard` shows each line's type and, when it differs from the List date, its date in
     mono.
   - Mobile and web routes are unchanged: the sheets open over the Booking detail
     (`/mobile/lists/:listId/bookings/:bookingId`, `/web/lists/:listId/bookings/:bookingId`), reached
     from 38a's main view, archive (`?day=`) and search (`?q=`).
10. **Admin: add, review and the Contract's event fees** (US-03.7.1 AC 5, US-03.7.2).
    - **Admin Booking detail:** 38b's events list under each Procedure gains **Add pre-op or post-op
      event** (office actor, the same sheet as a side sheet), shown on any List state the guard allows.
      An office-added event follows the same review as any other.
    - **The List review** (`ReviewScreen.tsx`): each Procedure with ticked, unreviewed pre-op or
      post-op events shows them under the Procedure (pill, type, date and time in mono, recorded, party,
      route, and the price with its calculation: "45 min · 3 time units x $25.00 fixed rate = $75.00" or
      "Contract fee STGACC-PAIN · $120.00 replaces 40 min"), with **Set a price** (amount and reason)
      where `noEventRate` or `contractNotInForce`. Authorising the List reviews them (work item 3). The
      review count and authorise button are unchanged. `data-shot="review-list-events"`.
    - **38b's review step** for events after the invoice (the Events tab, `admin-events-queue`, and
      `EventReviewSheet`) shows the new kinds with the same calculation, the party (default, 21's
      picker for another, audited) and **Set a price**; its **Approve for billing** and **Decline**
      actions are unchanged, and approval still raises nothing ("Approved. Invoiced in the next billing
      run."); `run-next-billing-run` raises the invoice. Extend 38b's `event-review-sheet` hook; add none.
    - **The Contract editor** (19a's lines grid): an **Event fees** section under the lines, office
      only, listing each fee (event type, holder code and description, fixed price in mono) with add,
      edit and remove in a side sheet through work item 3's actions; read only on a version that is not
      current. Caption: "Fixed fees this Contract charges for a pre-op or post-op event, in place of
      the time recorded." `data-shot="contract-event-fees"`.
    - The Admin Day screen is not changed.
11. **Admin: invoices.**
    - `InvoiceDocument.tsx`: an event line on the Procedure's invoice shows its kind, type and date
      in mono ("Post-op event · Ward review · 17 Jul 2026"), its own line after the Procedure's lines;
      any line carrying `serviceDateISO` shows its date. An event invoice uses 38b's relates-to line
      ("Post-op event · relates to AA-2026-0012 · {Procedure}"; "Pre-op event" for a pre-op one). The
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
      completed and submitted as Dr Souter (15a: no confirm step), and left SUBMITTED, so the presenter
      shows the before branch (events on the Procedure's invoice) and then, once the List is
      authorised, the after branch on the same Booking. If an action refuses a past date, use the
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
    - **One office stand-in, widened.** 38b's PWA-only `office-reviews-additional-invoice` becomes
      "Office reviews this event" (Mobile · Booking, `/mobile/lists/:listId/bookings/:bookingId`;
      `surfaces: ['pwa']`, `badge: 'office-stand-in'`), covering every reviewed kind: on the URL's
      Booking, `approveProcedureEvent` as `OFFICE_SIMULATION_ACTOR` on the oldest event awaiting review
      in 38b's review step (an additional invoice, or a pre-op, post-op or late-line event on an
      authorised List) with the default party and no office price, or, when none awaits review, the
      oldest approved one awaiting the run (such as an other-party event approved with its List), then
      `runEventInvoicing` for it and `handoffPair`. Result "Reviewed by the office (simulated). Invoice
      AA-2026-00nn raised in the next run." Disabled "No event awaiting review or the next run on this
      Booking", "Reviewed with its List: use Office authorises this List" when the only waiting events
      sit on a List not yet authorised (14's per-List stand-in then puts them on the invoice), or, on
      `noEventRate` or `contractNotInForce`, "Needs a price from the office: review it in Admin". Keep
      38b's id unless no recipe or test references it, in which case rename it `office-reviews-event`;
      record which. There is one office-review stand-in, not two.
    - `demoTriggers.test.ts` covers both (routes, surfaces, disabled states, the pinned per-screen
      counts); confirm the stand-in shows only in the PWA sheet. Nothing is added to the Control Panel
      page; its index lists the entries under their screens.
13. **Persistence, labels and copy.**
    - Every new audit action gets a label in `ACTION_LABELS` (`invoice.eventLine`, the three Contract
      event fee actions, and any 38b action whose narration needs the new kinds); `fieldLabels.ts`
      gains the event, event fee and line fields, in English ("Acute pain review: fixed fee $120.00").
    - Copy sweep: no en or em dash in any new string; "event", the kinds and the type names come only
      from the copy (item 8); no calculation on any anaesthetist surface; grep `src` for the removed
      ACC caption ("CS250, CS260, CS70" outside the seed and copy), for "UNIT x RATE", "add-on" and
      "Ancillary", and for "slot" in new app copy.
    - If session 2 changed the seed again, bump `PERSIST_VERSION` again (or once for the phase if both
      sessions ship as one change; record from and to).
14. **Tests, shots and docs close-out.** Component tests for the events list's new rows and the two
    sheets (no calculation shown to the anaesthetist; the add button and 38b's Raise additional invoice
    are the only controls on a billed Booking; the add-as-event shortcuts carry the type; clearing
    "same as" requires a party; the billing line sheet has no unit-rate or add-on option) and for the
    Contract editor's event-fee section. Playwright: a new `visual/phase39b-events.spec.ts` (mobile
    Booking detail with pre-op and post-op events, the event sheet, the extended billing line sheet
    with a type and a date, the web Booking detail, the List review with events, 38b's review step
    with a post-op event, the Contract event fees, the Procedure's invoice with event lines, and an
    event invoice) and update any spec that shot the old billing line sheet. The capture recipes,
    ATLAS.md and `npm run verify:board` are the Catalogue screenshots step below. Then the demo guide
    (below) and PROGRESS.

## Demo triggers

The headline actions are **product UI**, not demo triggers: **Add pre-op or post-op event** on the
mobile, web and Admin Booking detail, **Add billing line** (with a preset type and a date) on the
mobile and web Booking detail, **Authorise** in Admin Review (the List's review, which carries its
events onto the invoice), the Contract editor's **Event fees**, and 38b's review step and next run
for events after the invoice. What the registry gains or changes:

| Label | Screen | Surface | Effect |
|---|---|---|---|
| Stage post-op scenario (re-pointed, `stage-post-op`) | 38b's Admin routes, plus Mobile · Lists and Booking and Web · Lists and Booking | bar and pwa (pwa on the mobile patterns) | Builds Dr Souter's submitted ACL reconstruction for Coral Bennett on Thu 16 Jul AM under St George's ACC (`CT-STG-ACC`, with its new event fee), through ordinary actions (with the patient as payer and St George's ACC's claim reference), left awaiting review; keeps 38b's Dr Sharma step; each half skips itself once staged. Disabled, once both are staged, "Already staged: search Bennett and open Thursday's Booking" |
| Office reviews this event (38b's `office-reviews-additional-invoice`, widened and relabelled) | Mobile · Booking (`/mobile/lists/:listId/bookings/:bookingId`) | pwa, office stand-in badge | Approves the oldest event awaiting 38b's review step on the URL's Booking (any kind; else takes the oldest approved one awaiting the run) as `OFFICE_SIMULATION_ACTOR` and runs `runEventInvoicing` for it; the event's own invoice appears. Disabled "No event awaiting review or the next run on this Booking", "Reviewed with its List: use Office authorises this List" or "Needs a price from the office: review it in Admin" |

PWA parity: an event has a mobile side that waits on the office. Before the invoice, 14's "Office
authorises this List" is the stand-in (it reviews the List and its events, and the lines land on the
Procedure's invoice); after it, "Office reviews this event". In the framed build the presenter plays
the office in Admin Review. 15a's "Raise sample warnings" is unchanged: this phase adds no warning
rule. Phase 44's audit records the stand-ins.

## Out of scope

- **The UNIT x RATE billing line and Contract add-on fee lines**: removed from the catalogue on
  2026-10-07 (US-03.3.6; OQ-89 questions 1 to 3). A fixed-rate Contract prices the whole Procedure
  (19a, 24).
- **A separate event approval queue**: D13 is one standard review step for everything (the List's
  review before the invoice, 38b's after it).
- **An event as a Procedure on the Booking**, events with modifiers or base units, and an event
  changing the original Booking, Procedure or lock (US-07.3.2).
- **A refund shown as an event** (OQ-63's answer, tentative) and any other event kind beyond pre-op,
  post-op and the late line; 38b and 39 own additional invoices and credits.
- **Credit notes over event lines or event invoices**: Phase 39 (handoff).
- **A warning rule for events** (for example an event waiting too long for review): no catalogue item
  asks for one; 15a's routine is the place if AA does.
- **Prepayment of events**: an event is never in 27's prepaid set and never adds to a prepaid
  Procedure's price; on a prepaid or fixed-price Procedure, extra work is an event or an additional
  invoice raised by hand (US-06.4.1, US-05.2.5), never automatic. Whether 41's payee repoint on a
  moved prepaid Booking carries its event invoices' payables is 41's to decide (handoff note).
- **The anaesthetist's own adjustment on an event** (24's typed price or % discount applies to the
  Procedure only), new rate rules beyond 24's calculated step, and editable preset types (the types
  are a constant until Phase 42 says otherwise).
- **Event fees in the draft design**: the Contract event fee is the prototype's addition; if a v5
  models it, the change is in the billing module only.
- Confirming the ACC codes or prices (OQ-12): provisional in its one place.
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
      reads submitted, read only, with **Add pre-op or post-op event** under the Procedure.
- [ ] Add a pre-op event: ACC pre-op assessment, Mon 13 Jul, pick CS250 (OQ-12 caption shown, its
      fixed price read-only). It reads Pre-op, "CS250"; the routing caption says it goes on the
      procedure's invoice.
- [ ] Add a post-op ward review, Fri 17 Jul 08:00, 45 min, ticks on: the sheet shows the pricing
      caption and no figure. Add an HDU review with the invoice tick cleared: it reads "Not invoiced".
      No calculation anywhere on the phone.
- [ ] Add a post-op event with "same as" cleared and a person entered (name and email): its routing
      caption says it is invoiced on its own.
- [ ] Try a post-op event dated Wed 15 Jul (before the List date) and one dated tomorrow: both refused
      with their sentences. The sheet offers no modifier or base-unit control.
- [ ] Add billing line on the same Booking: the banner says the List is submitted and the line is
      recorded as an event; type "Nerve catheter", date Sat 18 Jul, $180.00: it lists as a late line.
      The sheet offers no UNIT x RATE or add-on option. Choose "Pain consult": the sheet offers **Add
      as post-op event instead** and opens the event sheet with the type set.
- [ ] Admin · Review, Thursday's List: the Procedure shows the ACC pre-op, the ward review ("45 min · 3
      time units x $25.00 fixed rate = $75.00"), the other-party event and the nerve catheter line, not
      the HDU review. **Authorise**: the Procedure's invoice carries the CS250 line, the ward review and
      the nerve catheter as their own dated lines; the other-party event is approved but raises no
      invoice yet (the Billing monitor's "Waiting for the next billing run" lists it), and it is not in
      the Events tab; the Booking still has exactly one primary Procedure. Run **Run the next billing
      run** (`run-next-billing-run`): the other-party event is its own invoice, relating to the
      Procedure's; the AA fee run preview (16) counts one more BCTI for the event invoice and none for
      the lines.
- [ ] Back on the phone (now invoiced: the List has left the main view, so search Bennett): the
      controls are **Add pre-op or post-op event** and 38b's **Raise additional invoice**. Add a pain
      consult, Sat 18 Jul 10:30, 40 min. Admin: it waits in 38b's review step with "Contract fee
      STGACC-PAIN · $120.00 replaces 40 min"; **Approve for billing**, then **Run the next billing
      run**: its own invoice, one dated line, "Post-op event · relates to AA-2026-..." under the number;
      the original invoice's rail lists it; its own ledger pair and Xero pair (with the `-P` payable).
      The phone's events list shows its total and party, no calculation.
- [ ] A Doyle bariatric (fixed-price) Booking: add a 30 min post-op event; Admin review shows "This
      procedure has a fixed price, so a timed event is not calculated" and **Set a price**; set $60.00
      with a reason; it invoices at $60.00. Add billing line is not offered on that Procedure.
- [ ] Admin · Contracts, St George's ACC: the **Event fees** section lists `STGACC-PAIN`; add a fee for
      "Post-op ward review" at $90.00 and see a new ward review event priced at it; remove it. ACC
      pre-operative assessment, St George's lists CS250, CS260 and CS70 with the OQ-12 caption. In a
      Booking's Contract picker, the ACC pre-op Contract is never offered.
- [ ] Admin · Booking detail: **Add pre-op or post-op event** as the office (a post-op ward review); it
      reviews and invoices like any other; Admin · Audit shows the office as its adder.
- [ ] **Decline** an event in 38b's review step with a reason: the phone shows Declined and the reason;
      editing it sends it back to awaiting review.
- [ ] Admin · Invoice of the Procedure's invoice and of the event invoice: **Regenerate from locked
      data** reports identical on both.
- [ ] PWA (`npm run build:pwa` preview or the dev PWA): after Reset, stage, add a post-op event, use
      **Office reviews this event**: disabled "Reviewed with its List..."; use **Office authorises this
      List**: the event is on the invoice. Add another event, then **Office reviews this event**: its
      own invoice with its number. 38b's additional-invoice beat still works through the same entry.
      The entry does not show in the framed harness bar.
- [ ] 38b's beat still works: Admin · Sarah Mitchell's Booking on Dr Sharma's Tue 14 Jul List, **Create
      additional invoice**, and it lists in that Procedure's events.
- [ ] Admin · Audit shows each new action with the right who, role and source (anaesthetist or office
      for add, edit and remove; the office for review, authorise and event fees; the simulated office
      for the stand-ins).
- [ ] No en or em dash in any new string; no "slot" in app copy; no calculation on any anaesthetist
      surface; teal is the only action colour; crimson unused on the new screens; the "same as" and
      OQ-12 captions shown.
- [ ] Catalogue screenshots: the recipes for US-03.7.1, US-03.7.2, US-05.5.2 and US-03.3.6 are created
      or updated, US-03.7.3 is extended, any recipe this phase broke is re-pointed, a full `npm run
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
    scenario; on the phone search Bennett, open Thursday's Booking, add the ACC pre-op (CS250) and a
    post-op ward review (45 min); in Admin · Review the events show under the Procedure; authorise;
    the invoice carries them as their own lines. Then on the invoiced Booking (found again by search)
    add a pain consult (40 min); in Admin review it and run the next run; open its own invoice. Say:
    "The anaesthetist records care themselves, before or days after, instead of ringing the office.
    It is an event on the Procedure with its own date and time. Before the invoice is approved it
    travels on the Procedure's invoice as its own line; after, it is invoiced in the next run on its
    own, traceable to the original, through the same review. The Contract can swap the time for a
    fixed fee." Then 38b's additional invoice, also an event. Expected: one invoice with three event
    lines, one event invoice, the original Booking untouched.
  - Remove any UNIT x RATE or Contract add-on narration left anywhere in the script (none is expected
    after 24; check).
  - The **Direct URLs** table gains the List review and 38b's event review route as shipped.
  - The S4 discovery points gain OQ-12 (the ACC codes), one line, and the "same as" reading.
- **`02-workflows-and-handoffs.md`:** the "Post-operative addition" case (38b rewrote it) gains the
  anaesthetist's event path: add a pre-op or post-op event from the Booking (reached by the main view,
  archive or search), the invoice tick and the "same as" party, on the Procedure's invoice before
  approval or its own invoice in the next run, one review; an admin can add one too; a late billing
  line after submit takes the same path. A short "ACC pre-op assessment" case. The capture workflow
  notes that billing lines carry their own date and a preset type (and are not offered on a fixed
  price).
- **`04-presenter-cheat-sheet.md`:** discovery point **12 "ACC pre-op flat-fee codes (CS250, CS260,
  CS70)"** says the prototype "captures these as ancillary fixed-amount billing lines with the code
  named in the description": rewrite it to the pre-op event picked from the fixed-fee ACC pre-op
  Contract's code fees, its own invoice line, codes and prices provisional (OQ-12). "Built and clickable" gains pre-op and post-op events, the ACC
  pre-op event, Contract event fees and dated, typed billing lines; "Strong phrases" gains "One review
  step for everything recorded against a procedure"; "Statements to avoid" gains "events need a
  separate approval" (D13 says one review step), "these are the ACC codes" (OQ-12 is open) and "a unit
  x rate line or an add-on fee" (both removed from the requirements).
- **`01-personas-and-responsibilities.md`:** the anaesthetist adds pre-op and post-op events and late
  billing lines; the office adds them on request, keeps the Contract event fees and reviews them.
- **`README.md`:** the readiness row for pre-op and post-op work.
- **`master-demo-guide.html`:** the same sections (S4 Beat 2, the workflow cases, the cheat-sheet
  equivalents including the "12 · ACC pre-op flat-fee codes" card, the personas), then the S4 Beat 2 spot-check.
- **Control Panel scenario text:** the S4 message that names "Stage post-op scenario" gains the Souter
  half.

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19),
run after the review pass and before the PROGRESS.md entry. Re-run
`node docs/prototype-build/catch-up/tools/recipe-status.mjs 39b` first: earlier phases (24 and 38b
above all) may have changed these recipes since this plan was written.

**Covered items.** When the phase is done, each recipe in `requirements-board/capture/recipes/`
matches what was built:

| Item | Recipe at plan time | When this phase is done |
|---|---|---|
| [US-03.7.1](../../../../requirements-board/requirements/stories/US-03.7.1.md) Add a pre-op or post-op event to a Procedure | absent · stub, no shots | captured. Replace the stub. Run the `stage-post-op` bar action, then reach the Booking from the search (`?q=Bennett`, Phase 38a), since its ids are staged at runtime. Mobile and web: shot `add-event` highlighting `[data-shot=add-event-sheet]` (Post-op, a time stepper, the invoice tick and the "same as" tick), states `sheet`, `added` (the post-op event with its own date in 38b's events list), `not-invoiced` (tick cleared) and `other-party` ("same as" cleared, a party entered). Admin: shot `admin-add-event` on the Admin Booking detail with the office's sheet. Captions in the catalogue's words: "A post-op event is saved against the Procedure with its own date", "No modifiers can be added to an event", "Recorded but not invoiced", "The event carries the billable party entered", "An admin can add an event" |
| [US-03.7.2](../../../../requirements-board/requirements/stories/US-03.7.2.md) Bill an event | absent · stub, no shots | captured. Replace the stub. After staging and adding a ward review: Admin `review-list-events` on the List review (highlight `[data-shot=review-list-events]`, the calculation at the line's fixed rate); `on-invoice` after **Authorise**, the Procedure's invoice highlighting `[data-shot=invoice-event-lines]` (the event as its own dated line); `fixed-fee` for the pain consult in 38b's review step ("Contract fee STGACC-PAIN replaces 40 min"), with an Admin shot `contract-event-fees` of St George's ACC's Event fees section; `separate-invoice` after the next run, the event invoice with its relates-to line. Captions: "Recorded before approval, it is a line on the Procedure's invoice", "Recorded after, a separate invoice in the next run, traceable to the Procedure", "The Contract's fixed fee is charged instead of the time". The PWA stand-in is not shot |
| [US-03.7.3](../../../../requirements-board/requirements/stories/US-03.7.3.md) See a Procedure's events | none at plan time (Phase 38b creates it) | stays whatever 38b left it; add a `pre-post-op` state on the staged Bennett Booking (mobile, web and Admin) showing a pre-op and a post-op event beside an additional invoice in the events list, keeping 38b's shot names. If 38b left no recipe, create one with that state and record it. If 38b's reason said pre-op and post-op events join in 39b, drop that clause (credits stay with 39 unless it has run) |
| [US-05.5.2](../../../../requirements-board/requirements/stories/US-05.5.2.md) ACC pre-op flat fee codes | partial · web-acc-preop, mobile-acc-preop | stays `partial` unless AA supplies the code rates: reshoot as a pre-op event. Web and mobile (`acc-preop`): on the staged Bennett Booking, Add pre-op or post-op event, Pre-op, type "ACC pre-op assessment", highlight the code rows ("CS250 · ACC pre-op assessment") in `[data-shot=add-event-sheet]` with the OQ-12 caption; add an `on-invoice` state on the Admin invoice showing CS250 as its own line. The old recipe fills the retired "What this line charges" description with the code; replace those steps. Replace the stale reason ("added as an ancillary fixed amount line, with the code typed into the description") with: "CS250, CS260 and CS70 are event fees on a fixed-fee ACC Contract with demo prices; AA's real ACC codes and rates are not confirmed (OQ-12)." Caption: "ACC pre-op assessment is a fixed-fee pre-op event, code picked from a list, its own invoice line" |
| [US-03.3.6](../../../../requirements-board/requirements/stories/US-03.3.6.md) Other billing lines | partial · web-billing-line[card,sheet], mobile-billing-line[card,sheet] | captured. Keep the shot names and the `card` and `sheet` states; the sheet now has the Type row and a Date field (and no rate x time, UNIT x RATE or add-on option), so highlight `[data-shot=add-billing-line-sheet]`; add a `typed-dated` state (a nerve catheter dated the day after the List) and a `late-line` state on the staged submitted List showing the banner. Replace the stale caption "Add billing line: fixed amount" and any caption naming UNIT x RATE or rate x time with captions in the catalogue's words ("Billing lines outside the base, time and modifier calculation", "A billing line can carry its own later date"). If any retired US-03.3.7 rate x time image is still listed on the item, confirm Phase 24 dropped the steps that make it, so the capture no longer produces it. Drop the partial reason |

**Recipes this phase breaks.** Work item 14 already asks for `US-03.3.6.json` and `US-05.5.2.json` to
be re-pointed; reconcile with it as follows. Found at plan time:
- `US-08.6.1` and `US-08.6.3` (38b's rebuilt shots): a state that shows the anaesthetist's controls on
  an invoiced Booking now also shows **Add pre-op or post-op event** beside **Raise additional
  invoice**; re-point by label, keep the names.
- A recipe that drives 38b's PWA stand-in by its label or id (if the id is renamed, re-point it).
- 19a's Contract lines grid recipes (US-04.2.4 and any Contract editor shot): the new Event fees
  section must not move their highlighted targets; check by the `--dry` run.
- Any recipe that relied on `stage-post-op` building only Dr Sharma's List: the trigger now also stages
  Dr Souter's Thu 16 Jul List, which adds a Booking to Dr Souter's Lists, archive and search, and a
  List to Admin Review's queue; check list, archive and review recipes by the `--dry` run.
- Re-grep before capture: `grep -lE 'Add billing line|What this line charges|Ancillary|capture-billing-lines|post-op|stage-post|procedure-events|office-reviews' requirements-board/capture/recipes/*.json`.

**ATLAS.md.** Personas and IDs / Seed data: the staged Bennett Booking (Thu 16 Jul AM, St George's,
ACC, staged submitted), the seeded `CT-ACC-PREOP` Contract with its three event fees and the
`STGACC-PAIN` fee on `CT-STG-ACC`, and how to reach the runtime-generated ids (search `Bennett`).
Overlays and Existing hooks: `add-event-sheet`, `add-billing-line-sheet`, `review-list-events`,
`invoice-event-lines`, `contract-event-fees`, and 38b's `admin-events-queue` and `event-review-sheet`
extended to the new kinds. Demo control panel: the re-pointed `stage-post-op` and the widened PWA-only
office stand-in. The ATLAS note for the Add billing line sheet (the Type row, the Date field and the
removed ACC caption) is updated.

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

- **The locked Booking stays locked.** No event, late line or review writes the Booking, its
  Procedures, their billing lines after submit, or the lock. `editRefusal` is unchanged; only the event
  guard lets the anaesthetist act on a billed List, and only on their own unreviewed events.
- **One review step, no second queue.** Before the invoice, events are reviewed with the List (and are
  not in 38b's Events tab); after it, in 38b's review step. No event has two review paths, and no other
  approval path, flag or screen exists.
- **Each event invoiced once, in the right place.** A same-party event recorded before authorise is a
  line on the Procedure's invoice (no new invoice, pair or BCTI); another party's, or one recorded
  after, is its own invoice, raised only by `runEventInvoicing`. Authorise twice, the run twice, a
  replayed handoff, an event edited between authorise and the run: never a second line, invoice, pair
  or BCTI. An un-ticked or unreviewed event never invoices and never counts.
- **Pricing in one place.** Time events use 19a's `timeUnitsFromMinutes` with the stored rule and the
  rate and discount from the one helper `priceProcedure` also calls, on the Contract version in force
  on the event's date; nothing is calculated on a fixed-price Procedure; a Contract event fee
  replaces the time; no modifier or base-unit input reaches the event; no anaesthetist adjustment is
  applied to an event; 18's and 24's parity hold.
- **The Contract event fee stays contained.** One type, one module beside 19a's lines, copied with a
  new version, never read by the Procedure's price, and a Contract holding only event fees is never a
  plain RVG Contract or a picker candidate.
- **No removed lines return.** No UNIT x RATE, add-on, quantity or hourly option, field or label
  anywhere.
- **What the anaesthetist sees.** 38b's rule: totals and party on their own Procedure's events, never a
  calculation and never a Booking total, on mobile, web and the PWA stand-in's results.
- **Traceability.** Every event line and event invoice links to its Procedure and, for an event
  invoice, the original invoice; back-links are derived, never stored on the original; Regenerate
  reproduces both.
- **Containment.** The invoicing rules and the two readings in 38b's `EVENT_RULES`, `EVENT_KINDS` and
  `eventInvoicing` (no second routing function or constant), the name in 38b's label, the ACC codes
  only in the seed, the pricing date in `servicePricingDate`, each step its own store action.
- **The staging.** `stage-post-op` uses ordinary actions, is deterministic, and still does 38b's Dr
  Sharma step; the office stand-in is PWA only, one entry, and audited as the simulated office.
- **Design and copy.** Bottom sheets with tappable rows on mobile; teal the only action colour; status
  pills on semantic tokens; mono dates, times and codes; no en or em dashes and no "slot" in app copy.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry; ROADMAP.md "Owner review: agents test
  themselves"): the readings built (the "same as" default; an other-party event on its own invoice in
  the next run even when recorded before approval; an ACC code from another Contract billing that
  Contract's party; an event's line on a split Procedure going to the Procedure's who-is-invoiced; the
  Contract event fee as a Contract child the draft design lacks; a timed event at the line's fixed
  rate or the anaesthetist's unit value less the line's fixed discount, without the anaesthetist's
  own adjustment; nothing calculated for a timed event on a fixed-price Procedure; the event's own
  date picking the Contract version (OQ-48 extended); a late line refused on a fixed price; an
  anaesthetist's billing line after submit recorded as an event rather than refused (the Booking is
  office-only from SUBMITTED); a typed fixed fee allowed on an event under any Contract that has no
  event fee for its type, priced by the office at review (24's read-only third-party price covers the
  Procedure's price only); a `noEventRate` event left for review; the staged Booking left submitted so both branches show), the
  open question built provisionally (OQ-12), anything logged rather than fixed, and the screens worth
  a look, each with its route and persona.
- **Status row** for catch-up Phase 39b, and a phase entry with:
  - the drift-check result (FT-03.7 and US-03.7.1 still Verify or not, US-03.7.2, US-05.5.2 and
    US-03.3.6 status; OQ-12 status), the leftovers grep (step 4), the session used for the staging,
    and, if 39 has run, whether its credit note handles event lines and event invoices;
  - what was built, with the name map for later phases: the kinds and fields added to 38b's record,
    `EventRecording`, `EventPricing`, `ContractEventFee` and its actions, the `EVENT_KINDS` entries,
    `EVENT_TYPES`, `validatePrePostOpEvent`, `servicePricingDate`, `eventFeeFor`, `accPreOpFeesFor`,
    the shared rate helper's name, `pricePrePostOpEvent`, `eventInvoiceLine`, `addPrePostOpEvent`,
    `addLateBillingLine`, the authorise and run hooks, the `BillingLine` and `InvoiceLine` fields,
    the `isPlainRvgContract` change, the selectors, the copy added, the event fee on `CT-STG-ACC`, the
    seeded `CT-ACC-PREOP`, `stagePostOpForSouter`, the trigger ids, routes and audit actions;
  - the `PERSIST_VERSION` bump or bumps (from and to);
  - tests added and the before and after Vitest and Playwright counts;
  - the review pass.
- **Catalogue screenshots result:** recipes created or changed (US-03.7.1, US-03.7.2, US-03.7.3,
  US-05.5.2, US-03.3.6, plus any re-pointed 38b recipe), the `capture/REPORT.md` counts (captured,
  partial, absent, failed) before and after, and any partial reason handed to a later phase.
- **Decisions log:**
  1. **Amended:** Phase 38b's withdrawal of the anaesthetist's post-op flow: besides 38b's free-form
     additional invoice, the anaesthetist's own path is now a pre-op or post-op event.
  2. **New (D13, OQ-63 answered):** pre-op and post-op events are kinds on the one event element, a
     line item, with an invoice tick and a "same as" party; before the Procedure's invoice is approved
     they travel on it as their own lines, after it (or when billed to another party) they are invoiced
     on their own in the next run, by 38b's `runEventInvoicing` only; one review step (the List's
     review, then 38b's); an admin can add one. Readings: the "same as" default is the Procedure's
     party, and an event billed to another party gets its own invoice.
  3. **New (provisional, OQ-12):** the ACC pre-op assessment is a pre-op event priced by a fixed-fee
     ACC Contract held via the hospital with the same holder, codes CS250, CS260 and CS70 as event
     fees with demo prices; never primary; its own invoice line.
  4. **New:** a Contract may carry fixed event fees (`ContractEventFee`, beside its lines; the draft
     design has none), which replace a recorded time (US-03.7.2). A timed event is priced from its
     recorded time by the RVG time rule (OQ-50, D25) at the rate 24's calculated step uses (the line's
     fixed rate, else the anaesthetist's unit value) less the line's fixed discount, on the Contract
     version in force on the event's own date (OQ-48's procedure-date answer extended to a separate
     service), read live, recorded in the frozen pricing, never from the Booking's lock; nothing is
     calculated on a fixed-price Procedure; the office may set a price with a reason.
  5. **New:** a billing line carries its own date and a preset type; a line the anaesthetist adds after
     submit is an event, never a write to the submitted or locked Booking.
  6. **Recorded (2026-10-07, US-03.3.6):** no UNIT x RATE billing line and no Contract add-on fee
     line; the 2026-10-02 "UNIT X RATE" retitle is superseded.
  7. **New (provisional, OQ-29, OQ-60):** each event invoice adds one BCTI to 16's count; event lines on
     the Procedure's invoice, un-ticked and unreviewed events add none.
  8. **Amended:** the `stage-post-op` trigger now stages Dr Souter's submitted Procedure as well as
     38b's Dr Sharma step, and 38b's PWA office stand-in covers every event kind.
- **Handoff notes:**
  - For **39**: a credit note or credit-and-rebill over an invoice with event lines, or over an event
    invoice, re-prices event lines from their frozen `pricing`; credits list in the Procedure's events.
  - For **43a**: the event sheet and the extended billing line sheet are anaesthetist capture screens
    to keep free of office-only Contract complexity (a Contract event fee shows its code, description
    and price only; a time shows no figure).
  - For **40**: the patient view lists event lines and event invoices with their standing.
  - For **41**: a moved prepaid Booking's payee repoint must carry its event invoices' payables with
    it, or say why not; events are never prepaid and never added to a prepaid price automatically.
  - For **42**: preset line types and event types are constants; Contract event fees are master data
    the loader should accept beside Contract lines (Contract, version, event type, holder code,
    fixed price).
  - For **43**: the List review's events and 38b's review step must stay usable at full scale; the
    generator builds event fees through the same module.
  - For **44**: S4 Beat 2's lead-in as written here; the OQ-12 line if answered later; "Office reviews
    this event" for the PWA parity audit.
