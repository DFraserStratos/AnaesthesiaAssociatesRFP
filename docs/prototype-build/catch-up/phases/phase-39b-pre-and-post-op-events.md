# Phase 39b · Pre-op and post-op events

**Requirements covered:**
[FT-03.7](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-03.7.md) Events on a Procedure (Verify; this phase builds its pre-op and post-op kinds, the admin entry, the invoice tick, the "same as" billable party and the before-or-after invoicing rule) ·
[US-03.7.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.7.1.md) Add a pre-op or post-op event to a Procedure (Verify) ·
[US-03.7.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.7.2.md) Bill an event (Confirmed) ·
[US-05.5.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.5.2.md) ACC pre-op flat fee codes (Open: the codes are OQ-12; the model is settled as a pre-op event) ·
[US-03.3.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.3.6.md) Other billing lines (including UNIT X RATE) (Proposed).
Read alongside (not closed here):
[US-03.7.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.7.3.md)
(see a Procedure's events; Phase 38b built the events list, and this phase's kinds appear in it),
[DM-17](../analysis/domain-model-delta.md#dm-17) (the event element; Phase 38b built it, this phase
adds kinds to it),
[US-08.6.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.6.1.md) and
[US-08.6.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.6.3.md)
(the admin's free-form additional invoice, an event kind Phase 38b built; it stays the office's path
for a free-form late charge),
[US-05.2.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.2.6.md)
(the Contract defined rate, Confirmed; Phase 24 prices whole Procedures at it through `unitRateFor`,
which this phase's UNIT x RATE line calls),
[US-05.2.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.2.5.md)
(fixed fee pricing) and
[US-04.2.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.4.md)
(fixed fee schedule lines with the add-on flag and quantity rule; Phase 18 built them),
[FT-11.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-11.2.md)
(the billable party, defined by the Contract; Phase 21),
[US-07.3.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-07.3.2.md)
(the Booking is immutable after AUTHORISED: an event never edits it),
[US-09.1.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-09.1.4.md) and
[US-10.3.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-10.3.1.md)
(an event's own invoice is its own receivable, so its ACCPAY is one more BCTI in Phase 16's count; an
event line on the Procedure's invoice adds none),
[OQ-63](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-63.md) (Answered,
owner decision D13: its own element, a line item, "event" for everything, one review step, bundled
with the Procedure's invoice if possible or else the next run, an invoice tick),
[OQ-12](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-12.md) (Open: the ACC
codes CS250, CS260 and CS70 and the fixed-fee Contract, with AA's accountant),
[OQ-89](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-89.md) (Open:
whether the Contract defined rate is a whole-Procedure basis or a separate billing line, and whether
schedule lines keep add-ons; built as its recommendation),
[OQ-50](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-50.md) (Answered:
time units come from the RVG rules only) and
[OQ-75](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-75.md) (Answered,
D25: a part interval is always rounded up, 15 minutes for the first two hours, then 10; Phase 19a
holds the tiers as data),
[OQ-48](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-48.md) (Open: which
date decides the price in force; the procedure date, built as its recommendation and extended to each
event's own date),
[OQ-29](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-29.md) and
[OQ-60](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-60.md) (BCTI
granularity and what the AA fee counts; open, kept in Phase 16's count function), the meeting notes
`catalogue/notes/2026-10-01-aa-meeting-with-greg.md` (#6, #34, #46, #54, #61),
`catalogue/notes/2026-10-02-aa-meeting-with-greg.md` (#4, #24, #25, #26, #35, #44) and
`catalogue/notes/2026-10-02-aa-booking-and-pricing-review-with-greg.md` (#21, #55) (see Reference),
and the Booking section and glossary of
[domain-model.md](../../../discovery-reference/Updated%20Requirements/domain-model.md).
**Depends on:** 24 (`unitRateFor`, the one pure rate function; `ChargeBasis` reduced to `'rvg' |
'fixed'` with `BillingLine.rate` as "$ per unit"; the agreed rate per unit as the Contract defined
rate; the Aria defined-rate Contract and Dr Souter's Mon 27 Jul capture Booking,
`SEED_MARKERS.definedRateCaptureBooking`), 38a (the calendar and search that reach a past Procedure
on mobile and web; its handoff names the event control as the one control a billed Booking may show)
and 38b (the event element on the Procedure, its one standard review step and next-run invoicing,
the events list on every Procedure in all three apps, the one user-facing label for "event", the
additional-invoice kind, and the withdrawn post-op addendum flow this phase brings back as events).
It needs nothing from 39 or 39a, so it may run straight after 38b. By the roadmap order 14 (the
demo-trigger registry, `useDemoTriggerContext`, the PWA sheet, `OFFICE_ACTOR` and
`OFFICE_SIMULATION_ACTOR`, "Office authorises this List"), 15 (Booking vocabulary and the
`.../bookings/:bookingId` routes), 15a (the warning triangle; no rule is added here; no submit confirm
step), 16 (the `-P` rule and the BCTI count, `bctiRecords` and `bctisFor`), 18 (`FeeScheduleLine`,
`isAddOn`, `quantityRule`, `priceInForce`, `addOnLinesInForce`), 19 and 19a (the procedure master, the
default RVG Contracts, the time tiers as data and the round-up rule), 20 (one Contract per Procedure
and the pure scope rule), 21 (the Contract-defined billable party, the payer's name and email capture,
the party picker), 22 (`materialiseInvoices`, `deliveryPlanFor`, `lineage`, `procedureIds`,
`gstTreatment`, the split payment setting), 23 (exactly one primary Procedure, `isPrimary`), 25 (the
`BookingLock`, the locked billable party and payee, `regenerateInvoiceFromLock`), 26 (the
anaesthetist's unit value in the profile), 28 (Slots and Lists), 32 and 32a (a moved Booking sits on
the doer's List), 36 (`newBookingPair`, `handoffPair`, the ledger, one payable leg per receivable) and
38 (billed Lists stay visible) have also run.
**Estimated:** 2 sessions. Session 1 is the model, the pure rules and pricing, the store actions with
both invoicing branches, the dated and typed billing lines (Contract add-ons and UNIT x RATE), late
lines and the seed (work items 1 to 7), ending at a green stop point with every action tested at store
level. Session 2 is the anaesthetist and admin screens, the review surfaces, the invoice documents,
the triggers, the demo guide and the close-out (work items 8 to 14).

## Goal

Phase 38b built the event element on a Procedure: its own record, its one standard review step,
next-run invoicing and the events list in all three apps, with the admin's additional invoice as its
first kind. It also withdrew the anaesthetist's post-op addendum Booking, so today an anaesthetist who
sees a patient again (a ward review the next day, a pain consult, a nerve catheter left in) or before
the procedure (an ACC pre-op assessment) has no way to record it except ringing the office. AA asked
for the anaesthetist to add this care themselves (FT-03.7), and OQ-63 (D13) settled how. This phase
adds the **pre-op and post-op kinds** to 38b's element:

- **Add a pre-op or post-op event** (US-03.7.1). From a current Procedure, or a past one reached
  through Phase 38a's calendar or search, on mobile and web, the anaesthetist adds an event with its
  own date and start time, recording **either a time** (minutes) **or a fixed fee**. An event takes no
  modifiers, no ASA and no base units. It has an **invoice tick** (cleared means recorded but never
  invoiced) and a **billable party** set by a **"same as" tick** (the Procedure's billable party,
  our reading of Greg's courier comparison, labelled) or, with the tick cleared, entered in the
  sheet. An **admin can add one too** from the Admin Booking detail, for example when someone rings
  the office. The event is never a Procedure and never primary; it lists in the Procedure's events
  (38b) beside additional invoices and credits.
- **Bill an event** (US-03.7.2, Confirmed). A billable event is **its own line item**, priced from its
  recorded time (RVG time units at the Procedure's unit rate on the event date, through 24's
  `unitRateFor`) or its fixed fee; **the Procedure's Contract can carry a fixed fee for that kind of
  event, which replaces the time**. Its invoicing follows the Procedure's invoice:
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
  The anaesthetist never sees a computed price (the 2026-09-28 ruling); the office sees the
  calculation in review.
- **The ACC pre-op assessment is a pre-op event** (US-05.5.2). The anaesthetist adds a pre-op event of
  type "ACC pre-op assessment" and picks a code (CS250, CS260 or CS70, provisional, OQ-12) from a
  fixed-fee ACC Contract. It is priced by that Contract, is never primary and shows as its own line on
  the invoice. The free-text ACC caption in the add-billing-line sheet goes.
- **Other billing lines** (US-03.3.6, all of it). A billing line gains **a date of its own**
  (defaulting to the List date), **preset line types** (post-op ward or HDU review, nerve catheter,
  pain consult, medical transport, Contract add-on fee, UNIT x RATE, other) beside free text, **the
  UNIT x RATE line** (a number of units at the Contract defined rate, priced through 24's
  `unitRateFor` on the line's date and offered only where the Procedure's Contract defines a rate;
  24 prices the whole Procedure and builds no line; OQ-89's recommendation, labelled provisional in one
  place), and **Contract add-on fee lines** picked from the Procedure's Contract (Phase 18's add-on
  schedule lines, priced on the line's own date). A line the anaesthetist adds after the List is
  submitted cannot touch the submitted or locked Booking: it is recorded as an event (a late line)
  and follows the same before-or-after rule. Choosing "Post-op ward review", "HDU review" or "Pain
  consult" also offers to add it as a post-op event instead (whether these leave the billing-line list
  is not stated, so both are offered).

The state gains the pre-op and post-op fields on 38b's event record, three fields on `BillingLine`,
an event line on the invoice, and two seeded Contracts' extra lines and one new Contract, so
`PERSIST_VERSION` is bumped. No seeded figure moves.

## Before you start: drift check

1. Run the drift check against the plan's catalogue snapshot:

   ```
   git diff 3d3a18c -- "docs/discovery-reference/Updated Requirements/catalogue" "docs/discovery-reference/Updated Requirements/domain-model.md"
   ```

   Read the hunks (if any) for FT-03.7, US-03.7.1, US-03.7.2, US-05.5.2, US-03.3.6, the context items
   US-03.7.3, US-08.6.1, US-08.6.3, US-05.2.6, US-05.2.5, US-04.2.4, FT-11.2, US-07.3.2, US-09.1.4,
   US-10.3.1, the questions OQ-63, OQ-12, OQ-89, OQ-50, OQ-75, OQ-48, OQ-29 and OQ-60, and the
   domain-model lines on events, billing lines and the additional invoice. If an item changed, re-read
   it and adjust the work items. If an item is now Retired or Future, drop its work items and record
   that in the PROGRESS entry. At 3d3a18c FT-03.7 and US-03.7.1 are **Verify**, US-03.7.2
   **Confirmed**, US-05.5.2 **Open** and US-03.3.6 **Proposed**; the screenshots on US-05.5.2 and
   US-03.3.6 show the earlier flat-fee line and the retired hourly rate x time line, and this phase's
   Catalogue screenshots step re-shoots them.
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
   - **OQ-12 (the ACC codes), open.** Seed CS250, CS260 and CS70 as provisional lines with demo prices
     on the fixed-fee ACC pre-op Contract (work item 6), each line and the event sheet's code rows
     labelled "Codes and prices to confirm with AA's accountant (OQ-12)". If answered, change only the
     seeded lines and drop the label.
   - **OQ-89 (the Contract defined rate), open.** Phase 24 built its recommendation (the defined rate
     is the agreed rate per unit and prices the whole Procedure) in `DEFINED_RATE_READING`. Build the
     UNIT x RATE line as US-03.3.6 describes it: extra units outside BTM, priced at the same rate
     through `unitRateFor`, offered only when it returns source `contractDefinedRate`. Label it
     provisional in one place (`UNIT_RATE_LINE_READING`, beside 24's constant, read by the sheet's one
     caption and the tests). If OQ-89 now says the defined rate is only a whole-Procedure basis, drop
     the line type and record it; if it says only a separate line, build the line as here anyway and
     log it on the "For the owner's review" list (24's whole-Procedure pricing would change, which is
     a follow-up phase's, not this one's); no stop.
   - **OQ-48 (pricing date), open.** Build its recommendation (the procedure date) extended to the event
     and the dated line: a time event prices at the unit rate in force on **the event's own date**, and
     a dated add-on or UNIT x RATE line at the price or rate in force on **the line's own date**,
     because each is a service given on that date. One helper, `servicePricingDate(...)`, labelled
     provisional in its comment.
   - **OQ-29 and OQ-60 (BCTI granularity, what the fee counts), open.** An event invoice is a
     receivable with its own ACCPAY, so it is one more BCTI through 16's `bctiRecords`, counted by the
     same rule as 38b's additional invoices; an event line on the Procedure's invoice adds none; nothing
     here counts BCTIs. If granularity flips to one per procedure, only 16's count function changes.
3. **Prerequisite names.** Confirm Phases 24, 38a and 38b are DONE in PROGRESS.md and read their handoff
   notes, then note the exact current names (this doc's working names first; use what shipped):
   - from **38b** (its plan's names, which this doc uses): the record and slice (`ProcedureEvent`,
     `schedule.procedureEvents`, `occurredOnISO`, `startTime`, `billable` as the invoice tick, `party:
     EventParty` with `sameAs`, the `detail` union, `review: EventReview` with `awaitingReview`,
     `approved` and `declined`, `invoiceId`, `addedBy`), `ProcedureEventKind` (this phase adds `'preOp'`
     and `'postOp'`), the pure module `src/domain/billing/procedureEvent.ts` (`EVENT_RULES`,
     `EVENT_KINDS`, `eventStatus`, `eventInvoicing`, `resolveEventParty`, `validateEventBase`), the
     store actions (`addProcedureEvent`, `updateProcedureEvent`, `removeProcedureEvent`,
     `approveProcedureEvent`, `declineProcedureEvent`, `runEventInvoicing`), the `'additional'` invoice
     kind, the `additionalTo` lineage role and `Invoice.eventId`, the selectors (`eventsForProcedure`,
     `eventsForBooking`, `eventsAwaitingReview`, `approvedEventsAwaitingRun`, `liveInvoiceForProcedure`),
     `ProcedureEventsList` and its hooks (`procedure-events`, `procedure-event-row`), the Admin Review
     Events tab (`/admin/review?tab=events`, `admin-events-queue`) and `EventReviewSheet`
     (`event-review-sheet`), the `run-next-billing-run` trigger, `procedureEventCopy.ts` (the one
     label for "event"), whether `AdditionalInvoiceSheet`'s party field is reusable here, `stage-post-op`'s
     current routes, `when`, body and result copy (38b kept it for Dr Sharma's Tue 14 Jul AM List and
     the additional-invoice beat; 39 and 39a beats may depend on it), and what it left where the
     withdrawn "Add post-op event" block was;
   - from **24**: `unitRateFor` and its `UnitRateSource` values, `DEFINED_RATE_READING`, `FeeResult.rateSource`,
     the reduced `ChargeBasis`, the remaining `BillingLine` fields, the Aria Contract's id and code
     (`CT-ARIA-HOURLY`, `ariaDefinedRate`) and `SEED_MARKERS.definedRateCaptureBooking`, and how
     `CT-STG-ACC`'s agreed $25.00 a unit now resolves (expected: source `contractDefinedRate`);
   - from **38a**: `SEED_LOOKBACK`, `searchBookingsFor`, `listsOnDayFor`, the `?day=` and `?q=` URL
     state, and how a billed List's Booking detail renders read only;
   - from **19a**: the time-tier function that replaced or wraps `timeUnitsFromMinutes` (D25's round-up),
     the one an event must use;
   - from **18**: `FeeScheduleLine` (`isAddOn`, `quantityRule`, `holderCode`, `prices`), `priceInForce`,
     `addOnLinesInForce`, the seeded `CT-CES-HNZ` add-on lines, the aaCode allocator and the
     id-to-code table pinned in `seed.test.ts`, the parity fixture
     `domain/billing/__parity__/phase-18-baseline.json`, and whether office-attached add-ons live in
     `Procedure.feeSchedule.addOns` (work item 4 must not create a second add-on home);
   - from **25**: `BookingLock`, the locked billable party and payee, `regenerateInvoiceFromLock`;
   - from **22**: `materialiseInvoices`, `deliveryPlanFor`, the `lineage` roles, `procedureIds`,
     `gstTreatment`, how a split Procedure's two invoices are told apart; from **21**: the billable
     party from the Contract, the payer's name and email capture and the party picker; from **20**:
     the pure Contract scope rule and how the picker hides a Contract with no Procedure lines; from
     **36**: `newBookingPair`, `handoffPair`, `retryBillingCase` or its current name; from **16**:
     `bctiRecords`, `bctisFor`; from **26**: where the anaesthetist's unit value lives; from **14**: the
     registry file, `OFFICE_ACTOR`, `OFFICE_SIMULATION_ACTOR`, the PWA sheet, "Office authorises this
     List"; from **15**: `src/shared/booking/BookingDetailBody.tsx` and the Booking routes.
   - If 39 has already run, note whether its credit note and credit-and-rebill accept an invoice that
     carries event lines and an event invoice (work item 3's last bullet).
4. **The staging session.** Confirm Dr Souter's Thu 16 Jul 2026 AM session is free in a fresh seed (the
   canvas RNG fills Slots) and that no S1 to S5 beat uses it. If not, use her nearest earlier free
   weekday session inside the canvas and name it in the PROGRESS entry and the trigger copy.
5. Note the current `PERSIST_VERSION` (16 after 15a session 1; later phases will have moved it).

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
  events and 38b's review step. No mockup covers events or the invoice document: extend 38b's surfaces,
  `InvoiceDocument`'s print sheet and rail, and the Invoices table as they stand.

**Catalogue items:** the covered and context files listed above. The meeting notes:
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
- 2026-10-02 booking and pricing review #21 (US-03.3.6 retitled "UNIT X RATE") and #55 (the Contract
  defined rate is a unit rate, not hourly).

**Analysis files:**

- `docs/prototype-build/catch-up/GAP-ANALYSIS.md`: theme 5 ("Events, additional invoices, credit and
  rebill"), the FT-03.7, US-03.7.1, US-03.7.2, US-03.7.3, US-03.3.6 and US-05.5.2 rows, the DM-17 and
  DM-46 rows, RV-10, the EP-03 and EP-05 structural notes (EP-03's names the 'Stage post-op scenario'
  trigger to retire or re-point), and the "Demo-trigger buttons" section.
- `docs/prototype-build/catch-up/epics/EP-03.md` (FT-03.7, US-03.7.1, US-03.7.2, US-03.3.6) and
  `epics/EP-05.md` (US-05.5.2).
- `analysis/domain-model-delta.md` DM-17 (and DM-18 for the additional invoice it sits beside, DM-27
  for the invoice kinds, DM-22 for the ledger pair, DM-09 for fee schedule lines and add-ons, DM-46 for
  the defined rate).
- `analysis/prototype-map-shared.md` (the shared Booking detail body, `BtmCaptureBlock`,
  `BillingLinesCard`, `AddBillingLineSheet`), `prototype-map-apps-mobile-web.md` (the mobile and web
  Booking routes), `prototype-map-admin.md` (Review, Invoices, the invoice document),
  `prototype-map-store-seed.md` (`billingLineActions`, counters, the seed's Contracts) and
  `prototype-map-domain.md` (`fee.ts`, `invoiceBuild.ts`, `timeUnits.ts`).

**Code entry points** (line numbers are from 3d3a18c; phases 15a to 38b will have moved them: use the
names from the drift check):

- Billing lines: `src/domain/types.ts` `BillingLine` 528 to 541 (no date, no type), `ChargeBasis` 519
  (24 drops `'rateTime'`); `src/store/billingLineActions.ts` (`addBillingLine` 46, guarded by
  `editRefusal` at 57, which refuses an anaesthetist on a non-DRAFT List; `removeBillingLine`; the
  funder-allocation conservation rule, or what 22 left of it); `src/store/lifecycle.ts` `editRefusal` 48
  (unchanged by this phase); `src/shared/capture/AddBillingLineSheet.tsx` (the basis options, the ACC
  detail at 85 and caption at 107, both of which go); `src/shared/capture/BillingLinesCard.tsx` (the
  list and the "Add billing line" foot, rendered from `BtmCaptureBlock.tsx`).
- Pricing: `src/domain/billing/fee.ts` (the captured non-RVG lines loop, which prices dated, add-on and
  UNIT x RATE lines after this phase), `src/domain/billing/timeUnits.ts` (`timeUnitsFromMinutes` at 26,
  or 19a's tier function), 24's `src/domain/billing/unitRate.ts`, 18's `contracts.ts` helpers,
  `src/domain/billing/invoiceBuild.ts` (the line snapshot and `describeFeeLine`), `InvoiceLine`.
- Booking detail: `src/shared/booking/BookingDetailBody.tsx` (the procedures loop; 38b's events list
  under each Procedure; at 3d3a18c the withdrawn addendum block sat at 666 to 690 and its banner at 486).
- Admin: `src/apps/admin/screens/ReviewQueue.tsx` and `ReviewScreen.tsx` (the List review, where a
  List's events show before authorise), 38b's review step for events, `InvoiceDocument.tsx`,
  `InvoicesScreen.tsx`, the Admin Booking detail, `src/apps/admin/flows/` (38b's additional-invoice
  sheet for the sheet pattern), `src/apps/admin/routes.tsx`, `src/router.tsx`.
- Billing run: `src/store/billingRun.ts` (`runBillingForList` 68, run on the `listAuthorised` app event
  from `src/store/events.ts`; that file is the app-event emitter, not the event element, so do not
  name anything of this phase after it).
- Seed: `src/domain/seed/contracts.ts` (`CONTRACT.stgAcc` is `CT-STG-ACC` at 23 and 82),
  `src/domain/seed/cast.ts` (`SURG.hale`, Mr T. Hale, Orthopaedics; `ANAE.souter`),
  `src/domain/seed/patients.ts` (`PAT.bennett`, Coral Bennett, `ZAG5541`), `src/domain/seed/bookings.ts`
  (the ACL reconstruction rows for the RVG code), 18's fee schedule lines, 25's
  `masters.contractVersions`.
- Store plumbing: `src/store/mutate.ts` `ID_FORMATS` (`billingLine: { prefix: 'BL', pad: 4 }` 66),
  `allocateId`, `clockISO`; `src/store/appStore.ts` (`PERSIST_VERSION` 136, `freshAppState`,
  `resetDomainState`); `src/shared/audit/fieldLabels.ts` and `ACTION_LABELS`
  (`src/shared/audit/actionLabels.ts`).
- Demo: `src/shared/demoTriggers/registry.ts` (`stage-post-op` at 312 at 3d3a18c, as 38b left it), the
  PWA sheet, `pwaPurity.test.ts`, `demoTriggers.test.ts` (the `stage-post-op` route cases at 94 to 98
  and 151).
- Tests to extend: `store/captureActions.test.ts` (where `addBillingLine` is tested at 3d3a18c),
  `domain/billing/fee.test.ts`, `invoiceBuild.test.ts`, `unitRate.test.ts`, 38b's event action tests,
  `store/billingRun.test.ts`, 16's count test, `seed.test.ts`, `store/persistMigrate.test.ts`,
  `shared/demoTriggers/demoTriggers.test.ts`, `pwaPurity.test.ts`, and the Playwright specs that shoot
  the Booking detail and the add-billing-line sheet.

## Work items

### Session 1: model, pricing, store and seed

1. **Model** (`domain/types.ts`, extending 38b's record). US-03.7.1, US-03.3.6.
   - 38b's kind union gains `'preOp' | 'postOp'`. `PrePostOpEventType` = `'postOpWardReview' |
     'hduReview' | 'painConsult' | 'accPreOpAssessment' | 'otherPreOp' | 'otherPostOp'`.
   - Reuse 38b's record as it stands: `occurredOnISO` is the event's date, `startTime` its start time,
     `billable` the invoice tick, `party: EventParty` (`{ sameAs: true }` or a named party; a person
     entered by name and email is created through 21's payer path), `review` (38b's states,
     `approveProcedureEvent` and `declineProcedureEvent`), `invoiceId` (the event's own invoice) and
     `addedBy` (gaining `anaesthetistId?` if 38b lacks it). Add only what 38b lacks, as the new members
     of 38b's `detail` union: `{ kind: 'preOp' | 'postOp'; type: PrePostOpEventType; recording:
     EventRecording; origin: 'event' | 'lateLine' }`. Beside them on the record: `pricing?:
     EventPricing` (frozen at approval), `invoiceRoute?: 'procedureInvoice' | 'ownInvoice'` (frozen at
     approval from 38b's `eventInvoicing`) and `invoiceLineId?` (a line on the Procedure's invoice).
   - `EventRecording`, a discriminated union:
     - `{ kind: 'time'; minutes: number }`;
     - `{ kind: 'fixedFee'; source: 'contractLine'; contractId; feeScheduleLineId }` (an ACC code, or
       the Contract's fee for this type of event);
     - `{ kind: 'fixedFee'; source: 'typed'; amount }` (no Contract fee exists; the person adding it
       types it);
     - `{ kind: 'line'; line: LateLineInput }` for a late billing line (work item 5), where
       `LateLineInput` is the billing line input of work item 4.
     There is no modifier, ASA, base-unit or RVG field anywhere on the record (US-03.7.1 AC 2).
   - `EventPricing`, written at review and frozen with the invoice, so 25's Regenerate can reproduce
     it: `{ basis: 'time' | 'contractFixedFee' | 'typedFixedFee' | 'line' | 'officePrice';
     pricingDateISO; minutes?; timeUnits?; unitRate?; rateSource?; contractId?; contractVersion?;
     feeScheduleLineId?; holderCode?; replacedMinutes?; amount; officeReason? }`, amounts ex GST in
     dollars to the cent as every stored price. `contractVersion` is 25's version the price was read
     from, so the event is traceable to a Contract version as a lock is.
   - `BillingLine` gains `serviceDateISO?: IsoDate` (absent means the List date), `lineType?:
     BillingLineType` and, for a Contract add-on, `feeScheduleLineId?` and `quantity?`.
     `BillingLineType` = `'postOpWardReview' | 'hduReview' | 'nerveCatheter' | 'painConsult' |
     'medicalTransport' | 'contractAddOn' | 'unitRate' | 'other'`. `chargeBasis` keeps 24's values: an
     add-on line is `'fixed'` with a `feeScheduleLineId`, and a UNIT x RATE line is `'rvg'` with
     `units` and the `rate` it was priced at, so nothing that switches on `ChargeBasis` ripples.
   - `FeeScheduleLine` (18) gains `eventTypes?: PrePostOpEventType[]`: a line that prices an event of
     those types as a fixed fee. Such a line never matches a Procedure (like an add-on) and is never
     offered as an add-on.
   - `InvoiceLine` gains `serviceDateISO?` and `eventId?` (an event line on the Procedure's invoice).
     An event's own invoice uses 38b's event-invoice kind and lineage role; add neither twice.
   - Thread anything new through `AppState`, the empty schedule slice, `freshAppState`,
     `resetDomainState` and the seed builders (38b added the slice; only new fields here).
2. **Pure rules and pricing.** The routing and party rules stay in 38b's
   `src/domain/billing/procedureEvent.ts`, extended there; the type table, validation and pricing go in
   `src/domain/billing/prePostOpEvent.ts`, re-exported from the billing index, Vitest-covered
   (convention 9). Nowhere else is a pre-op or post-op event validated, priced or routed.
   - **38b's module, extended** (one rule, no second constant): `EVENT_KINDS` gains `preOp` and
     `postOp` as 38b's handoff gives them (`addedBy: ['anaesthetist', 'office']`, `tick: 'shown'`,
     `reviewed: true`, `mayBundle: true`, `needsInvoicedProcedure: false`); `validateEventBase`'s date
     rule becomes per kind (a pre-op event may be dated before the List date: item below);
     `eventInvoicing`'s `'withProcedureInvoice'` branch becomes reachable. Comment D13 and the two
     labelled readings beside `EVENT_RULES`: `sameAsDefault` resolves through `resolveEventParty` to
     the Procedure's billable party (our reading of #24), and an event billed to another party, or
     recorded once the Procedure's invoice is approved, is `'ownInvoiceNextRun'` (our reading of "if
     possible"; D13's "otherwise, next run").
   - `EVENT_TYPES`: per type, its kind (pre-op or post-op), whether it takes a time, a fixed fee or
     both, and whether its fixed fee may come from another in-scope Contract (`accPreOpAssessment`
     only). Labels live in the copy (work item 8), not here.
   - `validatePrePostOpEvent(input, { listDateISO, todayISO })`, which calls 38b's `validateEventBase`
     for the shared checks: a pre-op event is dated on or before
     the List date, a post-op event on or after it, neither after today ("An event cannot be dated in
     the future."); a time is whole minutes from 1 to 720; a typed fee is above zero; a type that needs
     a Contract line has one; a cleared "same as" tick needs a party. Returns `null` or `{ code;
     message; field }`.
   - `eventFeeLineFor({ lines, contractId, type, dateISO })`: the Procedure's Contract's line whose
     `eventTypes` include the type and that has a price in force on the date, else undefined.
     `accPreOpLinesFor({ contracts, lines, procedure, hospitalId, dateISO })`: the ACC pre-op lines on
     in-scope Contracts (20's pure scope rule) with a price in force, in line order, for the picker.
   - `servicePricingDate(...)`: the event's own date, or the line's own date (OQ-48's recommendation
     extended; provisional, in its comment).
   - `pricePrePostOpEvent(event, ctx)` with `ctx = { contract; lines; anaesthetist }`: returns `{ kind:
     'priced'; pricing: EventPricing; description }` or `{ kind: 'refused'; code; message }`:
     - **a Contract fixed fee replaces a time** (US-03.7.2 AC 3): when `eventFeeLineFor` finds a line,
       the price is that line's price in force, `basis: 'contractFixedFee'`, with `replacedMinutes`
       set for a time event ("Contract fixed fee STGACC-PAIN replaces 40 min");
     - **a time** otherwise: 19a's tier function on the minutes (the RVG rule, OQ-50, rounded up per
       D25) times `unitRateFor(contract, anaesthetist, pricingDateISO)` (24), with its `source` kept
       in `rateSource`. A fixed-schedule Contract with no event line returns no rate: refused
       `noUnitRate` ("This Contract has no unit rate for a timed event. Set a price in review.");
     - **a typed or code fixed fee** as recorded; a **late line** through work item 4's line pricing;
     - an event whose invoice tick is cleared is refused `notInvoiced` (it is never priced);
     - no modifier, ASA or base-unit input exists in `ctx`;
     - the Contract and lines in `ctx` are the live Contract (its current 25 version) read on the event
       date, never the Booking's lock: the event is a new service priced once at review and frozen in
       `pricing` (with `contractVersion`). The lock is not read for the rate and never written.
   - Routing is 38b's `eventInvoicing(event, { procedureInvoiced, sameParty })`, not a new function:
     `sameParty` is true for the "same as" tick or an entered party equal to the Procedure's;
     `'withProcedureInvoice'` maps to `invoiceRoute: 'procedureInvoice'` and `'ownInvoiceNextRun'` to
     `'ownInvoice'`; an un-ticked event has no route. On a Procedure split two ways by 22's payment
     setting, the "same as" party is the Contract's billable party and the line goes on that party's
     invoice, never split (our reading, commented beside `EVENT_RULES`).
   - `eventInvoiceLine(event, pricing)`: one line, description such as "Post-op pain consult · 18 Jul
     2026 · 40 min, Contract fixed fee" or "ACC pre-op assessment · CS250 · 13 Jul 2026", with
     `serviceDateISO`, `eventId`, quantity 1, the amount.
   - Tests (worked figures): 45 min under `CT-STG-ACC` at $25.00 a unit is 3 units, $75.00; 121 min
     enters the second tier (8 + 1 = 9 units, the part interval rounded up); a Contract event line
     replaces 40 min with its fixed fee; the line is ignored before its first price date; an ACC code
     line priced on its date; a typed fee; the `noUnitRate` refusal on a fixed-schedule Contract; every
     validation refusal, including both date edges, the future date and a missing entered party; an
     un-ticked event refused; each `eventInvoicing` branch for the new kinds (same party before, same
     party after, other party before, un-ticked) and the per-kind date rule in `validateEventBase`;
     determinism; and a guard that the module imports nothing from the
     modifier or ASA modules and computes no unit rate of its own.
3. **Store: pre-op and post-op events** (`src/store/prePostOpEventActions.ts`, or 38b's event actions
   file extended; exported from `store/index.ts`). US-03.7.1, US-03.7.2.
   - **The guard.** Extend 38b's event guard (keep `editRefusal` exactly as it is, so a billed Booking
     stays locked: 38a's handoff): for a pre-op or post-op event the actor is the anaesthetist of the
     Procedure's List (after 32 and 32a, the doer) or the office (US-03.7.1 AC 5); the Booking and
     Procedure are not cancelled; the List has an anaesthetist (a Draft List, 31, has none: "Assign
     the List first."). Any List state is allowed, DRAFT to billed. Another anaesthetist is refused.
   - `addPrePostOpEvent(api, actor, procedureId, input)`, a thin wrapper over 38b's
     `addProcedureEvent` (or that action extended; no second write path): validate (item 2), then one
     `mutate()` writing the event through 38b's record with its review state set as 38b sets a new event, the
     invoice tick, the party choice and `addedBy` (role and source from the actor). Audit
     `procedureEvent.add` (38b's action name) with the kind, stamping the Booking. The Booking, its
     Procedures and its lock are not written (US-07.3.2): assert deep-equal in the tests.
   - Edit and remove: through 38b's `updateProcedureEvent` and `removeProcedureEvent`, extended to the
     new fields; the adder or the office, while the event is `awaitingReview` or `declined`; editing a
     declined event sends it back to `awaitingReview` (38b's rule). Refused once approved ("This event
     is approved. Ask the office to correct its invoice."). Audit before and after, and the full record
     on remove.
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
       pair to the locked payee. The authorise run raises no event invoice.
     An event refused `noUnitRate` is left out and stays awaiting review, now in 38b's Events tab
     ("Needs a price: invoiced in the next run once priced"); the List authorises as normal.
   - **After the Procedure's invoice: the next run.** An event recorded once the List is authorised
     goes through 38b's review step (the Events tab and `EventReviewSheet`). `approveProcedureEvent`
     prices it for these kinds (item 2; an `officePrice` with a reason replaces the computed price,
     `basis: 'officePrice'`, and is required on `noUnitRate`) and freezes `pricing`; the office confirms
     or changes the party (21's picker, audited); 38b's `runEventInvoicing` raises its own invoice from
     the frozen `pricing` (extend its pricing step for these kinds; additional invoices keep
     `priceFreeFormInvoice`), exactly as for an additional invoice. One path, `runEventInvoicing`,
     raises every event invoice, once.
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
     as above) and `approvedEventsAwaitingRun`; add
     `prePostOpEventsAwaitingListReview(listId)` for the List review, and `eventLinesFor(invoiceId)`
     (derived, never stored on the invoice).
   - Tests: add on a DRAFT, a SUBMITTED and a billed List as the List's anaesthetist and as the office;
     refused for another anaesthetist, a cancelled Booking or Procedure, a Draft List; the Booking,
     Procedures and lock deep-equal before and after; edit and remove until reviewed, refused after;
     authorise with a same-party event puts one dated line on the Procedure's invoice (total, pair and
     payable include it, BCTI count unchanged); authorise with an other-party event approves it and
     raises no invoice, then `runEventInvoicing` raises one event invoice; a pre-authorise event never
     appears in `eventsAwaitingReview`; an event added after authorise is invoiced only after 38b's
     review and next run, once; authorise twice, the run twice and a replayed handoff raise nothing twice; an
     un-ticked event never invoices; `noUnitRate` before approval is left for review and priced there;
     the BCTI count above; Regenerate reports "identical" on both kinds of invoice.
4. **Billing lines: a date, a type, Contract add-ons and UNIT x RATE** (`billingLineActions.ts`,
   `fee.ts`, `invoiceBuild.ts`). US-03.3.6.
   - `AddBillingLineInput` gains `serviceDateISO?`, `lineType` (required from the UI; default `'other'`
     for old callers) and, for `'contractAddOn'`, `feeScheduleLineId` and `quantity`, and for
     `'unitRate'`, `units`. The date may not be before the List date, nor after today unless it is the
     List date (a DRAFT List can be in the future).
   - **One add-on price**, `addOnFeeLine(line, quantity, dateISO)` beside 18's helpers: the line must
     be in `addOnLinesInForce` for the Procedure's Contract on the date (refused `addOnNotOnContract`,
     "This add-on is not on this Procedure's Contract for that date."), quantity whole and 1 or more
     when the line has a quantity rule, else 1; amount = price in force x quantity, ex GST.
     `addBillingLine` stores that amount and `fee.ts` prices the line through the same function on the
     line's date. If 18 stores office-attached add-ons in `Procedure.feeSchedule.addOns`, keep that
     home for the office and refuse the same add-on line as both an attached add-on and a billing line
     on one Procedure (`addOnAlreadyAttached`); both price through `addOnFeeLine`.
   - **The UNIT x RATE line**, `unitRateLine(units, contract, anaesthetist, dateISO)` beside it: offered
     only when `unitRateFor(contract, anaesthetist, dateISO)` returns source `contractDefinedRate`
     (refused `noDefinedRate`, "This Procedure's Contract does not define a rate."); units whole, 1 to
     99; amount = units x that rate, rounded to the cent once. `addBillingLine` stores `units`, `rate`
     and the amount; `fee.ts` re-prices through the same function on the line's date, so no second
     rate derivation exists (24's grep test still passes). Provisional in one place:
     `UNIT_RATE_LINE_READING` (OQ-89), read by the sheet caption and the tests.
   - `fee.ts` keeps its shape; a dated line passes its date through to the fee line, and
     `invoiceBuild.ts` copies it to `InvoiceLine.serviceDateISO` when it differs from the List date.
     The fee line for an add-on reads "<holderCode> · <description>", plus " x n <unitLabel>"; a UNIT x
     RATE line reads "n units at the Contract defined rate" (the rate shown on the office side and the
     invoice only).
   - 18's parity fixture and 24's R7 parity must match unchanged (no seeded Procedure has a dated,
     typed, add-on or UNIT x RATE line): run them, never with `-u`.
   - Tests: a dated line keeps its date onto the invoice line; each preset type round-trips; an add-on
     priced on its own date across a price step; an add-on not on the Contract refused; quantity on a
     quantity-rule line; the duplicate add-on refusal; 2 units on the Aria Contract at $26.50 is $53.00
     and a rate step across two dates prices each at its own step; the `noDefinedRate` refusal on a
     fixed-schedule or default RVG Contract; the conservation rule (if 22 kept it) still holds with
     dated lines.
5. **Late billing lines are events** (`prePostOpEventActions.ts`). US-03.3.6's "days later".
   - `addLateBillingLine(api, actor, procedureId, input)`: the anaesthetist's line when the List is not
     DRAFT (`editRefusal` would refuse `addBillingLine`). It validates the line through item 4 and
     records an event with `origin: 'lateLine'`, `recording: { kind: 'line', line }`, kind from the
     line's date against the List date, the invoice tick on, the "same as" party. From here it is an
     event: before authorise it travels with the Procedure's invoice, after it 38b's review and next
     run; the same BCTI rule. Audit `procedureEvent.add` with `origin`. The Procedure's `billingLines`
     are never written after submit.
   - `addBillingLine` itself is unchanged for the office (it may still add lines to a SUBMITTED List)
     and for the anaesthetist on a DRAFT List.
   - Tests: an anaesthetist line on a SUBMITTED List becomes a late-line event and the Booking is
     deep-equal; authorise puts it on the Procedure's invoice with its date; on a billed List it is
     invoiced on its own after review; an add-on late line priced on its own date.
6. **Seed: Contracts with add-on and event fee lines** (`seed/contracts.ts` and 18's fee schedule
   lines; labelled demo prices).
   - **St George's ACC (`CT-STG-ACC`, the existing agreed-rate Contract at $25.00 a unit, a Contract
     defined rate after 24) gains lines** (`CP-STGACC-1` on, from 2026-01-01): add-ons `STGACC-NC`
     "Nerve catheter, continuous block" ($180.00) and `STGACC-TX` "Medical transport escort, per hour"
     ($150.00, quantity rule "hour"); and the event fee line `STGACC-PAIN` "Acute pain review, fixed
     fee" ($120.00, `eventTypes ['painConsult']`). Its unit rate prices a timed event (45 min is 3
     units, $75.00) and a UNIT x RATE line. Labelled reading: US-04.2.4 describes add-on lines on fixed
     fee schedules (OQ-89 question 3 keeps them); an agreed-rate Contract carrying add-on and event fee
     lines is the prototype's reading. Add-on and event lines never match a Procedure, so every seeded
     Procedure on `CT-STG-ACC` prices exactly as before.
   - **New `CT-ACC-PREOP` "ACC pre-operative assessment, St George's"**: the same category, holder and
     billable party as `CT-STG-ACC` as 18 and 21 seeded it (so an ACC pre-op event on a St George's ACC
     Procedure rides on the Procedure's invoice as its own line), `fundingSources ['ACC']`,
     `fixedSchedule`, scope St George's, from 2026-01-01, its `aaCode` from 18's allocator. Lines
     (`CP-ACCPRE-1` to `-3`): `CS250`, `CS260` and `CS70` "ACC pre-op assessment", demo prices,
     `eventTypes ['accPreOpAssessment']`, each with the OQ-12 note. It has no Procedure line and no
     master procedures in 19a's scope, so it is never picked for a Procedure (confirm 20's picker hides
     it, or filter it there). Labelled reading: ACC Contracts are held via the hospital, as 18 seeded
     St George's ACC; other hospitals' ACC pre-op Contracts are master data (Phase 42).
   - Both Contracts carry 25's version history: the seeded v1 snapshot in `masters.contractVersions`
     includes the new lines, so `contractVersions.test.ts` ("the latest version deep-equals the live
     Contract and lines") still holds. `CT-ACC-PREOP` declares no required inputs (21): an event has
     no completion step.
   - Neither change moves a figure: 18's parity fixture, 24's R7 and 25's `phase-25-invoices.json` must
     match unchanged, and every S1 to S5 figure stands. Update the pinned id-to-code table in
     `seed.test.ts`.
   - Bump `PERSIST_VERSION` by one (the event fields, the line fields, the invoice line fields, the
     Contract and lines) with a comment line ("Phase 39b: pre-op and post-op events"). Extend
     `persistMigrate.test.ts` (a stale payload is discarded to the fresh seed). Two fresh seeds
     deep-equal.
7. **Session 1 stop point.** Every action above tested at store level; `npm run build`,
   `npm run build:pwa` and `npx vitest run` green before session 2 starts.

### Session 2: screens, review, documents, triggers and docs

8. **Copy in one place.** Extend 38b's event copy (the one label for "event"; do not define the word
   again): the kind labels ("Pre-op", "Post-op"), "Add pre-op or post-op event", the type labels
   ("Post-op ward review", "HDU review", "Pain consult", "ACC pre-op assessment", "Other pre-op", "Other
   post-op"), the tick captions ("Invoice this event" with "Cleared: kept on the record, never
   invoiced." and "Billed to the same party as the procedure" with the reading caption "Our reading:
   the same party as the procedure unless you change it."), the routing captions ("Goes on the
   procedure's invoice when the List is approved." and "Invoiced on its own in the next run, after
   review."), and the OQ-12 caption. `BILLING_LINE_TYPE_LABEL` ("Post-op ward review", "HDU review",
   "Nerve catheter", "Pain consult", "Medical transport", "Contract add-on fee", "UNIT x RATE",
   "Other") and the OQ-89 caption ("Provisional: units at the Contract defined rate (OQ-89).") go in
   the same file or beside it, PWA-safe. No en or em dash in any of them.
9. **Anaesthetist side: the events and the sheets** (the shared Booking detail body, so mobile and web
   render the same; US-03.7.1, US-03.1.4 parity).
   - 38b's events list under each Procedure shows the new kinds: date and start time (mono), a Pre-op
     or Post-op pill, the type, what was recorded ("40 min", "Fixed fee", "CS250", or the late line's
     type and date), "Not invoiced" when the tick is cleared, the party when it is not the
     Procedure's, and the review state on 38b's pills ("On the procedure's invoice" with the invoice
     number in mono once billed, or 38b's own-invoice state). **No amount computed by the system is
     shown** (the 2026-09-28 ruling; a typed fee shows as typed). Edit and remove while allowed. This
     amends 38b's "no party and no actions" rule on the anaesthetist surfaces for these kinds only (the
     anaesthetist chose the party and may correct their own unreviewed event); additional invoices and
     credits stay as 38b shows them, and the section now shows always so the add button has a home.
   - The list's foot: a secondary teal **Add pre-op or post-op event**, shown on any List state when the
     guard allows. On a billed List it is the one control on the read-only Booking (38a's handoff),
     replacing whatever caption 38b left; the rest stays read only.
   - **`AddPrePostOpEventSheet`** (via `useSurface`, a bottom sheet on mobile; or 38b's add sheet
     extended): Pre-op or Post-op (segmented), the type as tappable rows, the date (defaulting to the
     List date for pre-op and the day after for post-op, capped at today) and start time, then "Record
     a time" (a minutes stepper in 5-minute steps, mono) or "Fixed fee": a Contract fee line shows
     "Fixed fee under this procedure's Contract" with no amount; the ACC pre-op type lists the codes
     from `accPreOpLinesFor` as rows ("CS250 · ACC pre-op assessment") with the OQ-12 caption;
     otherwise a typed amount. The **invoice tick** (on by default) and the **"same as" tick** (on by
     default, with the reading caption); clearing it opens 21's party picker (an organisation, or a
     person by name and email). The routing caption under the primary teal **Add event** says where it
     will be invoiced. Refusals inline against the field. `data-shot="add-event-sheet"`.
   - **`AddBillingLineSheet`** gains a **Type** row set (the preset types), a **Date** field
     (defaulting to the List date), for "Contract add-on fee" the Contract's add-on rows from
     `addOnLinesInForce` on the chosen date (holder code and description, quantity stepper when the
     line has a quantity rule, no price on the anaesthetist side), and for "UNIT x RATE" a units
     stepper with the OQ-89 caption and no rate or amount (the row is disabled with "This procedure's
     Contract does not define a rate." where `unitRateFor` gives another source). The fixed amount stays.
     The ACC detail and caption go; in their place, on any type: "An ACC pre-op assessment is a pre-op
     event." with a link button **Add as pre-op event**. Choosing "Post-op ward review", "HDU review" or
     "Pain consult" shows "Usually added as a post-op event, with its own date and time." and **Add as
     post-op event instead**, which opens the event sheet with the type carried over. On a List that is
     not DRAFT the sheet's banner reads "This List is submitted. This line is recorded as an event and
     invoiced with the procedure, or on its own if the invoice is already raised." and **Add line** calls
     `addLateBillingLine`. `data-shot="add-billing-line-sheet"`.
   - `BillingLinesCard` shows each line's type and, when it differs from the List date, its date in
     mono. An add-on or UNIT x RATE line shows no price to the anaesthetist; the office sees it in its
     fee panel.
   - Mobile and web routes are unchanged: the sheets open over the Booking detail
     (`/mobile/lists/:listId/bookings/:bookingId`, `/web/lists/:listId/bookings/:bookingId`), reached
     from 38a's calendar (`?day=`) and search (`?q=`) as well as the Lists.
10. **Admin: add and review** (US-03.7.1 AC 5, US-03.7.2).
    - **Admin Booking detail:** 38b's events list under each Procedure gains **Add pre-op or post-op
      event** (office actor, the same sheet as a side sheet), shown on any List state the guard allows.
      An office-added event follows the same review as any other.
    - **The List review** (`ReviewScreen.tsx`): each Procedure with ticked, unreviewed pre-op or
      post-op events shows them under the Procedure (pill, type, date and time in mono, recorded, party,
      route, and the price with its calculation: "45 min · 3 time units x $25.00 = $75.00" or "Contract
      fixed fee STGACC-PAIN · $120.00 replaces 40 min"), with **Set a price** (amount and reason) where
      `noUnitRate`. Authorising the List reviews them (work item 3). The review count and authorise
      button are unchanged. `data-shot="review-list-events"`.
    - **38b's review step** for events after the invoice (the Events tab, `admin-events-queue`, and
      `EventReviewSheet`) shows the new kinds with the same calculation, the party (default, 21's
      picker for another, audited) and **Set a price**; its **Approve for billing** and **Decline**
      actions are unchanged, and approval still raises nothing ("Approved. Invoiced in the next billing
      run."); `run-next-billing-run` raises the invoice. Extend 38b's `event-review-sheet` hook; add none.
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
12. **Re-point the stage trigger and add the PWA stand-in** (the Phase 14 registry; bodies in
    `src/store` or `src/shared`, so `pwaPurity` holds).
    - `stage-post-op`, re-pointed to Dr Souter as well. A store helper `stagePostOpForSouter(api)`
      builds, with the ordinary store actions and actors (never a direct state write), a past Procedure
      awaiting review: on Dr Souter's Thu 16 Jul AM session (drift check step 4) a List at St George's
      with Mr Hale, one Booking for Coral Bennett, one primary Procedure "ACL reconstruction" on St
      George's ACC (`CT-STG-ACC`), times 08:05 to 09:40, ASA AS2, the Contract's required input filled
      (21 made St George's ACC require `claimReference`; use a demo claim number such as
      "ACC-DEMO-0716", or completion refuses), completed and submitted as Dr Souter (15a: no confirm
      step), and left SUBMITTED, so the presenter shows the before branch (events on the Procedure's
      invoice) and then, once the List is authorised, the after branch on the same Booking. If an
      action refuses a past date, use the office path (28's assignment as the office actor) and record
      it. **38b's step stays**: the body still does what 38b left it doing for Dr Sharma's Tue 14 Jul AM
      List, because the additional-invoice beat (and 39's and 39a's, if built) depend on it. Each half
      is idempotent on its own (it skips a half already staged), so the trigger stays enabled until
      both are done; its `when` widens to the new mobile and web routes. Routes: 38b's Admin routes,
      plus Mobile · Lists and Booking (`/mobile/lists`, `/mobile/lists/:listId`,
      `/mobile/lists/:listId/bookings/:bookingId`) and Web · Lists and Booking, surfaces both (bar, and
      the PWA sheet on the mobile patterns). Description: "Gives Dr Souter a submitted ACL
      reconstruction (Coral Bennett, Thu 16 Jul) awaiting review, to add pre-op and post-op events
      to, and keeps Dr Sharma's Tue 14 Jul List ready for the additional invoice." Result: "Staged.
      Search Bennett, open Thursday's Booking and use Add pre-op or post-op event." Disabled "Already
      staged: search Bennett and open Thursday's Booking".
    - New `office-reviews-event`, "Office reviews this event" (Mobile · Booking,
      `/mobile/lists/:listId/bookings/:bookingId`; `surfaces: ['pwa']`, `badge: 'office-stand-in'`): on
      a billed List, `approveProcedureEvent` as `OFFICE_SIMULATION_ACTOR` on the oldest pre-op, post-op
      or late-line event awaiting review on the URL's Booking, with the default party and no office
      price (or, when none awaits review, the oldest approved one awaiting the run, such as an
      other-party event approved with its List), then `runEventInvoicing` for it. Result "Reviewed by the
      office (simulated). Invoice AA-2026-00nn raised in the next run." Disabled "No event awaiting
      review or the next run on this Booking", "Reviewed with its List:
      use Office authorises this List" when the List is not yet authorised (14's per-List stand-in then
      puts the event lines on the invoice), or, on `noUnitRate`, "Needs a price from the office: review
      it in Admin".
    - `demoTriggers.test.ts` covers both (routes, surfaces, disabled states, the pinned per-screen
      counts); confirm `office-reviews-event` shows only in the PWA sheet. Nothing is added to the
      Control Panel page; its index lists the entries under their screens.
13. **Persistence, labels and copy.**
    - Every new audit action gets a label in `ACTION_LABELS` (`invoice.eventLine`, and any 38b action
      whose narration needs the new kinds); `fieldLabels.ts` gains the event and line fields.
    - Copy sweep: no en or em dash in any new string; "event", the kinds and the type names come only
      from the copy (item 8); no amount on any anaesthetist surface; grep `src` for the removed ACC
      caption ("CS250, CS260, CS70" outside the seed and copy) and for "slot" in new app copy.
    - If session 2 changed the seed again, bump `PERSIST_VERSION` again (or once for the phase if both
      sessions ship as one change; record from and to).
14. **Tests, shots and docs close-out.** Component tests for the events list's new rows and the two
    sheets (the anaesthetist sees no computed amount; the add button is the only control on a billed
    Booking; the add-as-event shortcuts carry the type; clearing "same as" requires a party; the UNIT x
    RATE row is disabled off a defined-rate Contract). Playwright: a new
    `visual/phase39b-events.spec.ts` (mobile Booking detail with pre-op and post-op events, the event
    sheet, the extended billing line sheet with an add-on, a UNIT x RATE line and a date, the web
    Booking detail, the List review with events, 38b's review step with a post-op event, the
    Procedure's invoice with event lines, and an event invoice) and update any spec that shot 38b's
    caption or the old billing line sheet. The capture recipes, ATLAS.md and `npm run verify:board`
    are the Catalogue screenshots step below. Then the demo guide (below) and PROGRESS.

## Demo triggers

The headline actions are **product UI**, not demo triggers: **Add pre-op or post-op event** on the
mobile, web and Admin Booking detail, **Add billing line** (with a preset type, a date, a UNIT x RATE
line or a Contract add-on fee) on the mobile and web Booking detail, **Authorise** in Admin Review
(the List's review, which carries its events onto the invoice), and 38b's review step and next run
for events after the invoice. What the registry gains or changes:

| Label | Screen | Surface | Effect |
|---|---|---|---|
| Stage post-op scenario (re-pointed, `stage-post-op`) | 38b's Admin routes, plus Mobile · Lists and Booking and Web · Lists and Booking | bar and pwa (pwa on the mobile patterns) | Builds Dr Souter's submitted ACL reconstruction for Coral Bennett on Thu 16 Jul AM under St George's ACC (`CT-STG-ACC`, with its new add-on and event fee lines), through ordinary actions (with St George's ACC's required claim reference), left awaiting review; keeps 38b's Dr Sharma step; each half skips itself once staged. Disabled, once both are staged, "Already staged: search Bennett and open Thursday's Booking" |
| Office reviews this event (new, `office-reviews-event`) | Mobile · Booking (`/mobile/lists/:listId/bookings/:bookingId`) | pwa, office stand-in badge | On a billed List, approves the oldest pre-op, post-op or late-line event awaiting review on the URL's Booking (else takes the oldest approved one awaiting the run) as `OFFICE_SIMULATION_ACTOR` and runs `runEventInvoicing` for it; the event's own invoice appears. Disabled "No event awaiting review or the next run on this Booking", "Reviewed with its List: use Office authorises this List" or "Needs a price from the office: review it in Admin" |

PWA parity: an event has a mobile side that waits on the office. Before the invoice, 14's "Office
authorises this List" is the stand-in (it reviews the List and its events, and the lines land on the
Procedure's invoice); after it, "Office reviews this event". In the framed build the presenter plays
the office in Admin Review. 15a's "Raise sample warnings" is unchanged: this phase adds no warning
rule. Phase 44's audit records the stand-ins.

## Out of scope

- **A separate event approval queue**: D13 is one standard review step for everything (the List's
  review before the invoice, 38b's after it).
- **An event as a Procedure on the Booking**, events with modifiers, ASA or base units, and an event
  changing the original Booking, Procedure or lock (US-07.3.2).
- **A refund shown as an event** (OQ-63's answer, tentative) and any other event kind beyond pre-op,
  post-op and the late line; 38b and 39 own additional invoices and credits.
- **Credit notes over event lines or event invoices**: Phase 39 (handoff).
- **A warning rule for events** (for example an event waiting too long for review): no catalogue item
  asks for one; 15a's routine is the place if AA does.
- **Prepayment of events**: an event is never in 27's prepaid set or estimate; 41's moved prepaid
  Booking does not move its events' payee (handoff note).
- New rate rules beyond 24's `unitRateFor`, and editable preset types (the types are a constant until
  Phase 42 says otherwise).
- Confirming the ACC codes or prices (OQ-12), the pricing date (OQ-48) and OQ-89's line-or-basis
  question: each stays provisional in its one place.
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
deep-equal Booking checks, both invoicing branches and the BCTI count; the parity fixtures match;
`npm run build`, `npm run build:pwa` and `npx vitest run` green.

Session 2 (after **Reset → Confirm reset**):

- [ ] Mobile (Dr Souter) · Lists: Demo actions shows **Stage post-op scenario**; run it. Search
      "Bennett": Thursday's Booking and Coral Bennett's backdrop Booking appear. Open Thursday's: it
      reads submitted, read only, with **Add pre-op or post-op event** under the Procedure.
- [ ] Add a pre-op event: ACC pre-op assessment, Mon 13 Jul, pick CS250 (OQ-12 caption shown). It reads
      Pre-op, "CS250"; the routing caption says it goes on the procedure's invoice.
- [ ] Add a post-op ward review, Fri 17 Jul 08:00, 45 min, ticks on. Add an HDU review with the invoice
      tick cleared: it reads "Not invoiced". No amount anywhere on the phone.
- [ ] Add a post-op event with "same as" cleared and a person entered (name and email): its routing
      caption says it is invoiced on its own.
- [ ] Try a post-op event dated Wed 15 Jul (before the List date) and one dated tomorrow: both refused
      with their sentences. The sheet offers no modifier, ASA or base-unit control.
- [ ] Add billing line on the same Booking: the banner says the List is submitted and the line is
      recorded as an event; choose "Contract add-on fee", date Sat 18 Jul, "STGACC-NC · Nerve catheter,
      continuous block": it lists as a late line. Choose "Pain consult": the sheet offers **Add as
      post-op event instead** and opens the event sheet with the type set.
- [ ] Admin · Review, Thursday's List: the Procedure shows the ACC pre-op, the ward review ("45 min · 3
      time units x $25.00 = $75.00"), the other-party event and the nerve catheter line, not the HDU
      review. **Authorise**: the Procedure's invoice carries the CS250 line, the ward review and the
      nerve catheter as their own dated lines; the other-party event is approved but raises no invoice
      yet (the Billing monitor's "Waiting for the next billing run" lists it), and it is not in the
      Events tab; the Booking still has exactly one primary Procedure. Run **Run the next billing run**
      (`run-next-billing-run`): the other-party event is its own invoice, relating to the Procedure's;
      the AA fee run preview (16) counts one more BCTI for the event invoice and none for the lines.
- [ ] Back on the phone (now billed, read only): the only control is **Add pre-op or post-op event**.
      Add a pain consult, Sat 18 Jul 10:30, 40 min. Admin: it waits in 38b's review step with "Contract
      fixed fee STGACC-PAIN · $120.00 replaces 40 min"; **Approve for billing**, then **Run the next
      billing run**: its own
      invoice, one dated line, "Post-op event · relates to AA-2026-..." under the number; the original
      invoice's rail lists it; its own ledger pair and Xero pair (with the `-P` payable).
- [ ] Admin · Booking detail: **Add pre-op or post-op event** as the office (a post-op ward review); it
      reviews and invoices like any other; Admin · Audit shows the office as its adder.
- [ ] **Decline** an event in 38b's review step with a reason: the phone shows Declined and the reason;
      editing it sends it back to awaiting review.
- [ ] Mobile (Dr Souter), the Mon 27 Jul Aria Booking (`definedRateCaptureBooking`): Add billing line,
      **UNIT x RATE**, 2 units, with the OQ-89 caption and no amount; Admin shows 2 units x $26.50 =
      $53.00. On a Booking on RVG Default Post-paid the UNIT x RATE row is disabled with its sentence.
      Reset afterwards (24's adjustment beat uses the same List).
- [ ] Admin · Invoice of the Procedure's invoice and of the event invoice: **Regenerate from locked
      data** reports identical on both.
- [ ] PWA (`npm run build:pwa` preview or the dev PWA): after Reset, stage, add a post-op event, use
      **Office reviews this event**: disabled "Reviewed with its List..."; use **Office authorises this
      List**: the event is on the invoice. Add another event, then **Office reviews this event**: its
      own invoice with its number. The entry does not show in the framed harness bar.
- [ ] 38b's beat still works: Admin · Sarah Mitchell's Booking on Dr Sharma's Tue 14 Jul List, **Create
      additional invoice**, and it lists in that Procedure's events.
- [ ] Admin · Audit shows each new action with the right who, role and source (anaesthetist or office
      for add, edit and remove; the office for review and authorise; the simulated office for the
      stand-ins).
- [ ] No en or em dash in any new string; no "slot" in app copy; no computed amount on any anaesthetist
      surface; teal is the only action colour; crimson unused on the new screens; the "same as",
      OQ-12 and OQ-89 captions shown.
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
  - **S4 Beat 2** (38b rewrote it as the office's additional invoice) gains a lead-in, "the
    anaesthetist's own pre-op and post-op care": Stage post-op scenario; on the phone search Bennett,
    open Thursday's Booking, add the ACC pre-op (CS250) and a post-op ward review (45 min); in Admin ·
    Review the events show under the Procedure; authorise; the invoice carries them as their own
    lines. Then on the billed Booking add a pain consult (40 min); in Admin review it and run the next
    run; open its own invoice. Say: "The anaesthetist records care themselves, before or days after,
    instead of ringing the office. It is an event on the Procedure with its own date and time. Before
    the invoice is approved it travels on the Procedure's invoice as its own line; after, it is
    invoiced in the next run on its own, traceable to the original, through the same review. The
    Contract can swap the time for a fixed fee." Then 38b's office additional invoice, also an event.
    Expected: one invoice with three event lines, one event invoice, the original Booking untouched.
  - Optional aside, **UNIT x RATE**: on the Aria Booking, a UNIT x RATE line of 2 units; the office
    sees it at the Contract defined rate. Say: "Units at the rate the Contract defines; the anaesthetist
    never sees the money."
  - The **Direct URLs** table gains the List review and 38b's event review route as shipped.
  - The S4 discovery points gain OQ-12 (the ACC codes) and OQ-89 (UNIT x RATE as a line), one line
    each, and the "same as" reading.
- **`02-workflows-and-handoffs.md`:** the "Post-operative addition" case (38b rewrote it for the
  office) gains the anaesthetist's path: add a pre-op or post-op event from the Booking (reached by
  calendar or search), the invoice tick and the "same as" party, on the Procedure's invoice before
  approval or its own invoice in the next run, one review; an admin can add one too; a late billing
  line after submit takes the same path. A short "ACC pre-op assessment" case. The capture workflow
  notes that billing lines carry their own date, a preset type, Contract add-on fees and UNIT x RATE.
- **`04-presenter-cheat-sheet.md`:** "Built and clickable" gains pre-op and post-op events, the ACC
  pre-op event, and dated, typed billing lines with UNIT x RATE; "Strong phrases" gains "One review step
  for everything recorded against a procedure"; "Statements to avoid" gains "events need a separate
  approval" (D13 says one review step) and "these are the ACC codes" (OQ-12 is open).
- **`01-personas-and-responsibilities.md`:** the anaesthetist adds pre-op and post-op events and late
  billing lines; the office adds them on request and reviews them.
- **`README.md`:** the readiness row for pre-op and post-op work.
- **`master-demo-guide.html`:** the same sections (S4 Beat 2 and its asides, the workflow cases, the
  cheat-sheet equivalents, the personas), then the S4 Beat 2 spot-check.
- **Control Panel scenario text:** the S4 message that names "Stage post-op scenario" gains the Souter
  half.

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19),
run after the review pass and before the PROGRESS.md entry. Re-run
`node docs/prototype-build/catch-up/tools/recipe-status.mjs 39b` first: earlier phases (38b above all)
may have changed these recipes since this plan was written.

**Covered items.** When the phase is done, each recipe in `requirements-board/capture/recipes/`
matches what was built:

| Item | Recipe at plan time | When this phase is done |
|---|---|---|
| [US-03.7.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.7.1.md) Add a pre-op or post-op event to a Procedure | absent · stub, no shots | captured. Replace the stub. Run the `stage-post-op` bar action, then reach the Booking from the search (`?q=Bennett`, Phase 38a), since its ids are staged at runtime. Mobile and web: shot `add-event` highlighting `[data-shot=add-event-sheet]` (Post-op, a time stepper, the invoice tick and the "same as" tick), states `sheet`, `added` (the post-op event with its own date in 38b's events list), `not-invoiced` (tick cleared) and `other-party` ("same as" cleared, a party entered). Admin: shot `admin-add-event` on the Admin Booking detail with the office's sheet. Captions in the catalogue's words: "A post-op event is saved against the Procedure with its own date", "No modifiers can be added to an event", "Recorded but not invoiced", "The event carries the billable party entered", "An admin can add an event" |
| [US-03.7.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.7.2.md) Bill an event | absent · stub, no shots | captured. Replace the stub. After staging and adding a ward review: Admin `review-list-events` on the List review (highlight `[data-shot=review-list-events]`, the calculation); `on-invoice` after **Authorise**, the Procedure's invoice highlighting `[data-shot=invoice-event-lines]` (the event as its own dated line); `fixed-fee` for the pain consult in 38b's review step ("Contract fixed fee STGACC-PAIN replaces 40 min"); `separate-invoice` after the next run, the event invoice with its relates-to line. Captions: "Recorded before approval, it is a line on the Procedure's invoice", "Recorded after, a separate invoice in the next run, traceable to the Procedure", "The Contract's fixed fee is charged instead of the time". The PWA stand-in is not shot |
| [US-03.7.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.7.3.md) See a Procedure's events | none at plan time (Phase 38b creates it) | stays whatever 38b left it; add a `pre-post-op` state on the staged Bennett Booking (mobile, web and Admin) showing a pre-op and a post-op event beside an additional invoice in the events list, keeping 38b's shot names. If 38b left no recipe, create one with that state and record it |
| [US-05.5.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.5.2.md) ACC pre-op flat fee codes | partial · web-acc-preop, mobile-acc-preop | stays `partial` unless AA supplies the code rates: reshoot as a pre-op event. Web and mobile (`acc-preop`): on the staged Bennett Booking, Add pre-op or post-op event, Pre-op, type "ACC pre-op assessment", highlight the code rows ("CS250 · ACC pre-op assessment") in `[data-shot=add-event-sheet]` with the OQ-12 caption; add an `on-invoice` state on the Admin invoice showing CS250 as its own line. The old recipe fills the retired "What this line charges" description with the code; replace those steps. New reason: "CS250, CS260 and CS70 are in the picker with demo prices; AA's real ACC codes and rates are not confirmed (OQ-12)." Caption: "ACC pre-op assessment is a fixed-fee pre-op event, code picked from a list, its own invoice line" |
| [US-03.3.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.3.6.md) Other billing lines (including UNIT X RATE) | partial · web-billing-line[card,sheet], mobile-billing-line[card,sheet] | captured. Keep the shot names and the `card` and `sheet` states; the sheet now has the Type row and a Date field, so highlight `[data-shot=add-billing-line-sheet]`; add a `typed-dated` state (an HDU review dated the day after the List), a `late-line` state on a submitted List showing the banner, and a `unit-rate` shot on the Aria capture Booking (`SEED_MARKERS.definedRateCaptureBooking`) with the UNIT x RATE units stepper and the OQ-89 caption, which replaces the retired US-03.3.7 rate x time images the item still lists. Captions in the catalogue's words ("Billing lines outside the base, time and modifier calculation", "A billing line can carry its own later date", "A unit x rate billing line where the Contract defines its own rate"). Drop the partial reason |

**Recipes this phase breaks.** Work item 14 already asks for `US-03.3.6.json` and `US-05.5.2.json` to
be re-pointed; reconcile with it as follows. Found at plan time:
- `US-03.3.7` (Retired, merged into US-03.3.6) and `US-05.2.6`: 24 removed or rebuilt their hourly
  states. If `US-03.3.7.json` is still run, leave it as 24 left it; the UNIT x RATE shots live on
  US-03.3.6 now.
- `US-08.6.1` and `US-08.6.3` (38b's rebuilt shots): any state that shows 38b's withdrawn-flow caption
  on a locked Booking now shows the **Add pre-op or post-op event** control; re-point by label, keep
  the names.
- Any recipe that relied on `stage-post-op` building only Dr Sharma's List: the trigger now also stages
  Dr Souter's Thu 16 Jul List, which adds a Booking to Dr Souter's Lists, calendar and search, and a
  List to Admin Review's queue; check list, calendar and review recipes by the `--dry` run.
- Re-grep before capture: `grep -lE 'Add billing line|What this line charges|capture-billing-lines|post-op|stage-post|procedure-events' requirements-board/capture/recipes/*.json`.

**ATLAS.md.** Personas and IDs / Seed data: the staged Bennett Booking (Thu 16 Jul AM, St George's,
ACC, staged submitted), the seeded `CT-ACC-PREOP` Contract and the new `CT-STG-ACC` lines, and how to
reach the runtime-generated ids (search `Bennett`). Overlays and Existing hooks: `add-event-sheet`,
`add-billing-line-sheet`, `review-list-events`, `invoice-event-lines`, and 38b's `admin-events-queue`
and `event-review-sheet` extended to the new kinds.
Demo control panel: the re-pointed `stage-post-op` and the PWA-only `office-reviews-event`. The ATLAS
note for the Add billing line sheet (placeholders, the Type row and the removed ACC caption) is updated.

## Adversarial review (after build)

Once the manual test checklist and `npm run build`, `npm run build:pwa`, `npx vitest run` and
`npm run shots` are green, and before writing the PROGRESS entry, run the standard **adversarial
review-and-fix pass (PROGRESS convention 18)**:

- fan out four independent Opus review subagents, for **quality**, **bugs/correctness**, **plan
  adherence** and **money integrity** (each event invoiced once, on the right invoice; conservation on
  each pair; the BCTI feed), each given the covered catalogue files, this doc and the diff;
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
  after, is its own invoice, raised only by `runEventInvoicing`. Authorise twice, the run twice, a replayed handoff, an event edited
  between authorise and the run: never a second line, invoice, pair or BCTI. An un-ticked or unreviewed
  event never invoices and never counts.
- **Pricing in one place.** Time events use 19a's tier function and `unitRateFor` on the event date,
  nothing else; a Contract event line replaces the time; no modifier, ASA or base-unit input reaches
  the event; add-on lines price through `addOnFeeLine` and UNIT x RATE lines through `unitRateLine`
  (which calls `unitRateFor`) on their own date, in the store and in `fee.ts` alike; 18's and 24's
  parity hold.
- **Hidden fee.** No computed amount on any mobile or web anaesthetist surface, including the sheets,
  the events list, the add-on and UNIT x RATE rows and the PWA stand-ins' results.
- **Traceability.** Every event line and event invoice links to its Procedure and, for an event
  invoice, the original invoice; back-links are derived, never stored on the original; Regenerate
  reproduces both.
- **Containment.** The invoicing rules and the two readings in 38b's `EVENT_RULES`, `EVENT_KINDS` and
  `eventInvoicing` (no second routing function or constant), the name in 38b's
  label, the ACC codes only in the seed, the OQ-89 reading in `UNIT_RATE_LINE_READING`, each step its
  own store action.
- **The staging.** `stage-post-op` uses ordinary actions, is deterministic, and still does 38b's Dr
  Sharma step; `office-reviews-event` is PWA only and audited as the simulated office.
- **Design and copy.** Bottom sheets with tappable rows on mobile; teal the only action colour; status
  pills on semantic tokens; mono dates, times and codes; no en or em dashes and no "slot" in app copy.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry; ROADMAP.md "Owner review: agents test
  themselves"): the readings built (the "same as" default, an other-party event on its own invoice in
  the next run even when recorded before approval, an
  event's line on a split Procedure's main invoice, a `noUnitRate` event left for review, the staged
  Booking left submitted so both branches show), the open questions built as recommendations (OQ-12,
  OQ-48, OQ-89), anything logged rather than fixed, and the screens worth a look, each with its route
  and persona.
- **Status row** for catch-up Phase 39b, and a phase entry with:
  - the drift-check result (FT-03.7 and US-03.7.1 still Verify or not, US-03.7.2, US-05.5.2 and
    US-03.3.6 status; OQ-12, OQ-89 and OQ-48 status), the session used for the staging, and, if 39 has
    run, whether its credit note handles event lines and event invoices;
  - what was built, with the name map for later phases: the kinds and fields added to 38b's record,
    `EventRecording`, `EventPricing`, the `EVENT_KINDS` entries, `EVENT_TYPES`, `validatePrePostOpEvent`,
    `eventFeeLineFor`, `accPreOpLinesFor`, `servicePricingDate`, `pricePrePostOpEvent`,
    `eventInvoiceLine`, `addPrePostOpEvent`, `addLateBillingLine`, `addOnFeeLine`,
    `unitRateLine`, `UNIT_RATE_LINE_READING`, the authorise and run hooks, the `BillingLine`,
    `InvoiceLine` and `FeeScheduleLine` fields, the selectors, the copy added, the lines added to
    `CT-STG-ACC`, the seeded `CT-ACC-PREOP`, `stagePostOpForSouter`, the trigger ids, routes and audit
    actions;
  - the `PERSIST_VERSION` bump or bumps (from and to);
  - tests added and the before and after Vitest and Playwright counts;
  - the review pass.
- **Catalogue screenshots result:** recipes created or changed (US-03.7.1, US-03.7.2, US-03.7.3,
  US-05.5.2, US-03.3.6, plus any re-pointed 38b recipe), the `capture/REPORT.md` counts (captured,
  partial, absent, failed) before and after, and any partial reason handed to a later phase.
- **Decisions log:**
  1. **Amended:** Phase 38b's withdrawal of the anaesthetist's post-op flow: the anaesthetist's own path
     is now a pre-op or post-op event; the office's additional invoice stays.
  2. **New (D13, OQ-63 answered):** pre-op and post-op events are kinds on the one event element, a
     line item, with an invoice tick and a "same as" party; before the Procedure's invoice is approved
     they travel on it as their own lines, after it (or when billed to another party) they are invoiced
     on their own in the next run, by 38b's `runEventInvoicing` only; one review step
     (the List's review, then 38b's); an admin can add one. Readings: the "same as" default is the
     Procedure's party, and an event billed to another party gets its own invoice.
  3. **New (provisional, OQ-12):** the ACC pre-op assessment is a pre-op event priced by a fixed-fee
     ACC Contract held via the hospital with the same billable party, codes CS250, CS260 and CS70 with
     demo prices; never primary; its own invoice line.
  4. **New:** an event is priced from its recorded time by the RVG time rule (OQ-50, D25) at
     `unitRateFor`'s rate on the event's own date (the live Contract version, recorded in the frozen
     pricing, never the Booking's lock), unless the Contract carries a fixed fee for that event type;
     the office may set a price with a reason; the anaesthetist never sees a price (the 2026-09-28
     ruling upheld).
  5. **New:** a billing line carries its own date, a preset type and, for a Contract add-on, the add-on
     schedule line priced on the line's date (OQ-48's recommendation, provisional); a line the
     anaesthetist adds after submit is an event, never a write to the submitted or locked Booking.
  6. **New (provisional, OQ-89):** the UNIT x RATE line is extra units at the Contract defined rate,
     priced through `unitRateFor`, offered only where the Contract defines a rate, beside 24's
     whole-Procedure pricing.
  7. **New (provisional, OQ-29, OQ-60):** each event invoice adds one BCTI to 16's count; event lines on
     the Procedure's invoice, un-ticked and unreviewed events add none.
  8. **Amended:** the `stage-post-op` trigger now stages Dr Souter's submitted Procedure as well as
     38b's Dr Sharma step.
- **Handoff notes:**
  - For **39**: a credit note or credit-and-rebill over an invoice with event lines, or over an event
    invoice, re-prices event lines from their frozen `pricing`; credits list in the Procedure's events.
  - For **43a**: the event sheet and the extended billing line sheet are anaesthetist capture screens
    to keep free of Contract complexity (add-on rows show holder code and description only; UNIT x RATE
    shows units only).
  - For **40**: the patient view lists event lines and event invoices with their standing.
  - For **41**: a moved prepaid Booking's payee repoint must carry its event invoices' payables with
    it, or say why not; events are never prepaid.
  - For **42**: preset line types and event types are constants; event fee lines are ordinary fee
    schedule lines with `eventTypes`, so the loader should accept the field.
  - For **43**: the List review's events and 38b's review step must stay usable at full scale.
  - For **44**: S4 Beat 2's lead-in and the asides as written here; the OQ-12 and OQ-89 lines if
    answered later; "Office reviews this event" for the PWA parity audit.
