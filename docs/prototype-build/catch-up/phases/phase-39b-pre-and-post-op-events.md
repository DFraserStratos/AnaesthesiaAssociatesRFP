# Phase 39b · Pre-op and post-op events

**Requirements covered:**
[FT-03.7](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-03.7.md) Pre-op and post-op events (Verify, new) ·
[US-03.7.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.7.1.md) Add a pre-op or post-op event to a Procedure (Verify, new) ·
[US-03.7.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.7.2.md) Bill a pre-op or post-op event (Verify, new) ·
[US-05.5.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.5.2.md) ACC pre-op flat fee codes (Open; rewritten as a fixed-fee pre-op event, moved here from Phase 19) ·
[US-03.3.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.3.6.md) Other billing lines, including rate x time (Proposed; moved here from Phase 39) ·
[DM-17](../analysis/domain-model-delta.md#dm-17) Pre-op and post-op events on a Procedure, added by the anaesthetist, billed through office approval.
Read alongside (not closed here):
[US-03.1.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.1.6.md) and
[US-03.1.7](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.1.7.md)
(the calendar and search that reach a past Procedure; Phase 38a built them),
[US-08.6.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.6.1.md) and
[US-08.6.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.6.3.md)
(the admin's free-form additional invoice, which needs no approval; Phase 39 built it and it stays the
office's path),
[US-05.2.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.2.5.md)
(fixed fee schedule pricing) and
[US-04.2.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.4.md)
(fixed fee schedule lines with the add-on flag and quantity rule; Phase 18 built them),
[US-05.2.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.2.6.md)
(rate x time, captured through the same billing line path),
[US-07.3.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-07.3.2.md)
(the Booking is immutable after AUTHORISED: an event never edits it),
[US-09.1.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-09.1.4.md) and
[US-10.3.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-10.3.1.md)
(an event invoice is its own receivable, so its ACCPAY is one more BCTI in Phase 16's count),
[OQ-63](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-63.md) (Open: how
events are modelled, named and approved; built as its recommendation),
[OQ-12](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-12.md) (Open: the ACC
codes CS250, CS260 and CS70, with AA's accountant),
[OQ-50](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-50.md) (Answered:
time units come from the RVG rules only) and its follow-up
[OQ-75](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-75.md) (Open: the
check against the NZSA RVG 2021 text, including part-interval rounding; `timeUnitsFromMinutes` stays
the one rule, so an answer changes only that function),
[OQ-48](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-48.md) (Open: which
date decides the price in force; the procedure date, provisional),
[OQ-29](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-29.md) and
[OQ-60](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-60.md) (BCTI
granularity and what the AA fee counts; open), the 2026-10-01 meeting note
`catalogue/notes/2026-10-01-aa-meeting-with-greg.md` (points #6, #34, #46, #54, #61 and #63; see
Reference for what each says), and the
Booking section and glossary of
[domain-model.md](../../../discovery-reference/Updated%20Requirements/domain-model.md).
**Depends on:** 23 (exactly one primary Procedure per Booking, `isPrimary`, and Booking-level
pricing; an event is never a Procedure, so it can never be primary), 38a (the calendar and search
that reach a past, billed Procedure on mobile and web; its handoff says the event is the one control
that may appear on a billed List) and 39 (the free-form additional invoice, the removed post-op
addendum Booking and the one-line caption on a locked Booking that this phase replaces). By the
roadmap order 14 (the demo-trigger registry, `useDemoTriggerContext`, the PWA sheet,
`OFFICE_ACTOR` and `OFFICE_SIMULATION_ACTOR`, `stage-post-op`), 15 (Booking vocabulary and the
`.../bookings/:bookingId` routes), 15a (the warning triangle; no rule is added here), 16 (the
`-P` rule and the BCTI count, `bctiRecords` and `bctisFor`), 18 (`FeeScheduleLine`, `isAddOn`,
`quantityRule`, `priceInForce`, `addOnLinesInForce`, `permitsRateTime`), 19 (the procedure master),
20 (one Contract per Procedure and the pure scope rule), 21 (the billable party and invoice email on
the Booking, defaulted from the Contract), 22 (`materialiseInvoices`, `deliveryPlanFor`, `lineage`,
`procedureIds`, `gstTreatment`, `supplier` and `agent`), 25 (the `BookingLock`, the locked payee,
`regenerateInvoiceFromLock`), 26 (the anaesthetist's unit value in the profile), 28 (Slots and Lists),
32 (a Booking done by another anaesthetist sits on the doer's List), 36 (`newBookingPair`,
`handoffPair`, the ledger) and 39a (payment runs, which pay an event's payable like any other) have
also run.
**Estimated:** 2 sessions. Session 1 is the model, the pure pricing, the store actions, the dated and
typed billing lines and the seed (work items 1 to 7), ending at a green stop point with every action
tested at store level. Session 2 is the anaesthetist screens on mobile and web, the office approval
queue, the invoice documents, the triggers, the demo guide and the close-out (work items 8 to 14).

## Goal

Today an anaesthetist who sees a patient again after the procedure (a ward review the next day, a
pain consult, a nerve catheter left in) has no way to record it: Phase 39 removed the post-op
addendum Booking, and the locked Booking carries only a caption saying the office raises later
charges. AA asked at the 2026-10-01 meeting for the anaesthetist to add this post-care themselves,
instead of ringing or emailing the office (FT-03.7). This phase builds it, following OQ-63's
recommendation, labelled provisional throughout:

- **Pre-op and post-op events on a Procedure** (US-03.7.1, DM-17). From a current Procedure, or a
  past one reached through Phase 38a's calendar or search, on mobile and web, the anaesthetist adds
  an **event** with its own date and start time, and records **either a time** (minutes) **or a fixed
  fee**. An event takes no modifiers, no ASA and no base units. It may be marked **not billable**. It
  is its own element, attached to the original Procedure and listed under it, never a new Procedure
  and never primary.
- **Office approval, then its own invoice** (US-03.7.2). A billable event goes to an **Events** queue
  in Admin Review. The office approves or declines it (decline needs a reason). Once approved it
  raises **its own invoice** with one line, its own number, its own ledger pair and Xero pair, and a
  payable to the locked payee, traceable to the Procedure and its original invoice. A not-billable
  event raises nothing and never enters the queue. The price is the recorded time in RVG time units
  (OQ-50) at the Procedure's Contract unit rate on the event date, unless **the Contract has a fixed
  fee for that kind of event**, which replaces the time. The anaesthetist never sees the price (the
  2026-09-28 ruling); the office sees the calculation.
- **The ACC pre-op assessment is a pre-op event** (US-05.5.2). The anaesthetist adds a pre-op event of
  type "ACC pre-op assessment" and picks a code (CS250, CS260 or CS70, provisional, OQ-12) from a
  fixed-fee ACC Contract. It is priced by that Contract, is never primary and shows as its own invoice
  line. The free-text ACC caption in the add-billing-line sheet goes.
- **Other billing lines grow up** (US-03.3.6, all of it). A billing line gains **a date of its own**
  (defaulting to the List date), **preset line types** (post-op ward or HDU review, nerve catheter,
  pain consult, medical transport, Contract add-on fee, other) beside free text and rate x time, and
  **Contract add-on fee lines** picked from the Procedure's Contract (Phase 18's add-on schedule lines,
  through `addOnLinesInForce`, priced on the line's own date). A line the anaesthetist adds **after
  the List is submitted** cannot touch the submitted or locked Booking: it is recorded as a late line
  on the event path, approved by the office and invoiced on its own, exactly like a billable event.
  Choosing "Post-op ward review", "HDU review" or "Pain consult" offers to add it as a post-op event
  instead.

The state gains a `procedureEvents` slice, three fields on `BillingLine`, an `'event'` invoice kind
and its lineage role, and two seeded Contracts with add-on and event fee lines, so `PERSIST_VERSION`
is bumped. No seeded figure moves.

## Before you start: drift check

1. Run the drift check against the plan's catalogue snapshot:

   ```
   git diff 501b0b8 -- "docs/discovery-reference/Updated Requirements/catalogue" "docs/discovery-reference/Updated Requirements/domain-model.md"
   ```

   Read the hunks (if any) for FT-03.7, US-03.7.1, US-03.7.2, US-05.5.2, US-03.3.6, the context items
   US-03.1.6, US-03.1.7, US-08.6.1, US-08.6.3, US-05.2.5, US-04.2.4, US-05.2.6, US-07.3.2, US-09.1.4,
   US-10.3.1, the questions OQ-63, OQ-12, OQ-50, OQ-75, OQ-48, OQ-29 and OQ-60, and the domain-model
   lines on events,
   billing lines and the additional invoice. If an item changed, re-read it and adjust the work items.
   If an item is now Retired or Future, drop its work items and record that in the PROGRESS entry.
   FT-03.7, US-03.7.1 and US-03.7.2 were **Verify** at plan time (new on 2026-10-01), US-05.5.2 was
   **Open** and US-03.3.6 **Proposed**; the screenshots on US-05.5.2 and US-03.3.6 show the earlier
   flat-fee billing line, and this phase's Catalogue screenshots step re-shoots them.
2. **Open questions and their safe interims** (each kept in one place, so a different answer stays
   contained):
   - **OQ-63 (model, name, invoice display, approval, "may or may not be billable").** If still open,
     build its recommendation, labelled "Provisional · to confirm with AA (OQ-63)" on the event sheet,
     the Events queue and the event invoice: its own element on the Procedure (`ProcedureEvent`), shown
     as its own invoice with one line, approved by the office before invoicing; "not billable" means
     recorded for the record and never invoiced. Keep the choices in one constant, `EVENT_RULES`
     (work item 2), and the user-facing name in one label map, `EVENT_LABELS` (work item 8). Keep the
     record thin with one store action per step, so a switch stays contained:
     - if OQ-63 says **an event is a Procedure added to the Booking** (Greg's lean): stop and tell the
       owner before building. It would put events through 23's primary rule and 25's lock, and change
       work items 1, 3 and 5;
     - if it says **no approval**: `approveProcedureEvent` runs inside `addProcedureEvent` for a
       billable event (actor the anaesthetist, source anaesthetist) and the queue becomes a list of
       recent events; nothing else moves;
     - if it says **a line on the Procedure's invoice**: that only works before the List is billed;
       after billing the event still needs its own invoice (US-07.3.2). Tell the owner.
   - **OQ-12 (the ACC codes).** If still open, seed CS250, CS260 and CS70 as provisional lines with
     demo prices on the ACC fixed-fee Contract (work item 6), each line and the event sheet labelled
     "Codes and prices to confirm with AA's accountant (OQ-12)". If answered, change only the seeded
     lines.
   - **OQ-48 (pricing date).** Build the procedure date as the recommendation says, extended to the
     event and the dated line: a time event prices at the unit rate in force on **the event's own
     date**, and a dated add-on line at the price in force on **the line's own date**, because each is
     a service given on that date. One helper, `servicePricingDate(...)`, labelled provisional.
   - **OQ-29 and OQ-60 (BCTI granularity, what the fee counts).** An event invoice is a receivable
     with its own ACCPAY, so it is one more BCTI through 16's `bctiRecords`, counted by the same rule
     as 39's additional invoices; nothing here counts BCTIs. A not-billable or declined event is not a
     BCTI. If granularity flips to one per procedure, only 16's count function changes.
3. **Prerequisite names.** Confirm Phases 23, 38a and 39 are DONE in PROGRESS.md and read their handoff
   notes, then note the exact current names (planned names first; use what shipped):
   - from **39**: the locked-Booking caption and its `data-shot` (`locked-booking-late-charge-caption`),
     `Invoice.kind` with `'additional'`, the `additionalTo` lineage role, `AdditionalInvoiceBasis`,
     `liveInvoiceForProcedure`, `additionalInvoicesFor`, the "Additional invoices" rail card on the
     invoice document, the Kind column on the Invoices screen, the extended
     `regenerateInvoiceFromLock`, `creditAndRebill` and which invoice kinds it accepts, and
     `stage-post-op`'s current routes, `when`, body and result copy (39 kept it to authorise Dr
     Sharma's Tue 14 Jul AM List; 39 and 39a beats depend on that step);
   - from **38a**: `SEED_LOOKBACK`, `searchBookingsFor`, `listsOnDayFor`, the `?day=` and `?q=` URL
     state, and how a billed List's Booking detail renders read only (the place the event control goes);
   - from **23**: `Procedure.isPrimary`, the exactly-one-primary check and where it runs;
   - from **18**: `FeeScheduleLine` (`isAddOn`, `quantityRule`, `holderCode`, `prices`),
     `priceInForce`, `addOnLinesInForce`, `permitsRateTime`, `INDIVIDUAL_ARRANGEMENT_MESSAGE`, the
     seeded `CT-CES-HNZ` add-on lines, the aaCode allocator and the id-to-code table pinned in
     `seed.test.ts`, the parity fixture `domain/billing/__parity__/phase-18-baseline.json`, and whether
     office-attached add-ons live in `Procedure.feeSchedule.addOns` (work item 4 must not create a
     second add-on home);
   - from **25**: `BookingLock`, the locked payee, `regenerateInvoiceFromLock`;
   - from **22**: `materialiseInvoices`, `deliveryPlanFor`, the `lineage` roles, `procedureIds`,
     `gstTreatment`; from **21**: the billable-party default from the Contract and the picker; from
     **20**: the pure Contract scope rule; from **36**: `newBookingPair`, `handoffPair`,
     `retryBillingException` or `resolveAndRetry`; from **16**: `bctiRecords`, `bctisFor`; from **26**:
     where the anaesthetist's unit value lives; from **14**: the registry file, `OFFICE_ACTOR`,
     `OFFICE_SIMULATION_ACTOR`, the PWA sheet; from **15**: the Booking detail body's name (it was
     `src/shared/card/CardDetailBody.tsx`) and the Booking routes.
4. **The staging Slot.** Confirm Dr Souter's Thu 16 Jul 2026 AM Slot is free in a fresh seed (the
   canvas RNG fills Slots) and that no S1 to S5 beat uses it. If not, use her nearest earlier free
   weekday Slot inside the canvas and name it in the PROGRESS entry and the trigger copy.
5. Note the current `PERSIST_VERSION`.

## Reference

**Design files (convention 17):**

- `docs/design/Design Language.dc.html`: tokens (teal `#0D6E63` the only action colour, crimson
  identity only, the six status colours with their tints, pills at radius 999, Spline Sans Mono with
  tabular-nums for every date, time, code and amount, the bottom-sheet and `sheet-in` motion
  patterns, 4pt spacing).
- `docs/design/Mobile App.dc.html`: the Booking detail and its Procedure cards (the events section
  sits under the Procedure as the billing lines card does), the bottom sheet anatomy for the event
  and billing-line sheets. Mobile-first: bottom sheets with tappable rows, never desktop forms or
  dropdowns (convention 16).
- `docs/design/Web Dashboard.dc.html`: the web panel anatomy for the same section on the web Booking
  detail (the shared body renders both).
- `docs/design/Admin Review.dc.html`: the admin table, tabs, side sheet and pills for the Events queue
  and its approval sheet. No mockup covers events or the invoice document: extend the Review screen,
  `InvoiceDocument`'s print sheet and rail, and the Invoices table as they stand.

**Catalogue items:** the covered and context files listed above; the 2026-10-01 meeting note points
#6 (the ACC pre-op assessment as a fixed-fee Contract, never primary, recorded as a pre-op event;
"time or fixed price events" with no other modifiers; a Contract can replace a recorded time with a
fixed fee; "line items" or "procedures" on an invoice not settled), #34 (the events feature,
post-care self-service instead of ringing the office, its own date and time, "probably the same
approval flows", a significant job as another Booking, the modelling not settled), #46 (an ACC
pre-op assessment is never the primary), #54 (OQ-12 is with AA's accountant), #61 (events go through
admin approval; the admin's additional invoice needs none) and #63 (the event-or-procedure and
line-or-procedure questions still open).

**Analysis files:**

- `docs/prototype-build/catch-up/GAP-ANALYSIS.md`: theme 8 ("Events replace the post-op addendum;
  look-back and search"), the FT-03.7, US-03.7.1, US-03.7.2, US-03.3.6 and US-05.5.2 rows, the DM-17
  row, the EP-03 and EP-05 structural notes, and the "Demo-trigger buttons" section ("repoint Stage
  post-op scenario to Dr Souter").
- `docs/prototype-build/catch-up/epics/EP-03.md` (FT-03.7, US-03.7.1, US-03.7.2, US-03.3.6) and
  `epics/EP-05.md` (US-05.5.2).
- `analysis/domain-model-delta.md` DM-17 (and DM-18 for the additional invoice it sits beside, DM-27
  for the invoice kinds, DM-22 for the ledger pair, DM-09 for fee schedule lines and add-ons).
- `analysis/prototype-map-shared.md` (the shared Booking detail body, `BtmCaptureBlock`,
  `BillingLinesCard`, `AddBillingLineSheet`), `prototype-map-apps-mobile-web.md` (the mobile and web
  Booking routes), `prototype-map-admin.md` (Review, Invoices, the invoice document),
  `prototype-map-store-seed.md` (`billingLineActions`, counters, the seed's Contracts) and
  `prototype-map-domain.md` (`fee.ts`, `invoiceBuild.ts`, `timeUnits.ts`).

**Code entry points** (line numbers are from 501b0b8; phases 14 to 39a will have moved them and
renamed Card to Booking: use the names from the drift check):

- Billing lines: `src/domain/types.ts` `BillingLine` 518 to 535 (no date, no type), `ChargeBasis`
  516; `src/store/billingLineActions.ts` (`addBillingLine` 46, guarded by `editRefusal`, which refuses
  an anaesthetist on a non-DRAFT List; `removeBillingLine`; the funder-allocation conservation rule);
  `src/store/lifecycle.ts` `editRefusal` 48 (unchanged by this phase); `src/shared/capture/
  AddBillingLineSheet.tsx` (the basis options, the ACC caption 100 to 106 that goes);
  `src/shared/capture/BillingLinesCard.tsx` (the list and the "Add billing line" foot, rendered from
  `BtmCaptureBlock.tsx` 257).
- Pricing: `src/domain/billing/fee.ts` (the captured non-RVG lines loop 236 to 250, which prices dated
  and add-on lines after this phase), `src/domain/billing/timeUnits.ts` (`timeUnitsFromMinutes`, the
  RVG T1/T2 rule, the only time-unit function an event may use), 18's `contracts.ts` helpers,
  `src/domain/billing/invoiceBuild.ts` (`describeFeeLine` 243, the line snapshot), `InvoiceLine`.
- Booking detail: the shared body (`src/shared/card/CardDetailBody.tsx` at 501b0b8: the procedures
  loop around 670, 39's caption where the "Add post-op event" block was, 720 to 737).
- Admin: `src/apps/admin/screens/ReviewQueue.tsx` and `ReviewScreen.tsx` (the Events tab joins the
  queue), `InvoiceDocument.tsx`, `InvoicesScreen.tsx`, `src/apps/admin/flows/` (39's
  `AdditionalInvoiceSheet` for the sheet pattern), `src/apps/admin/routes.tsx`, `src/router.tsx`.
- Seed: `src/domain/seed/contracts.ts` (`CONTRACT` ids 15 to 27; `stgAcc` is `CT-STG-ACC`),
  `src/domain/seed/cast.ts` (`SURG.hale`, Mr T. Hale, Orthopaedics, at St George's; `ANAE.souter`),
  `src/domain/seed/patients.ts` (`PAT.bennett`, Coral Bennett, `ZAG5541`), `src/domain/seed/cards.ts`
  (the COS ACL reconstruction 742 to 760 for the RVG code), 18's fee schedule lines.
- Store plumbing: `src/store/mutate.ts` `ID_FORMATS` (`billingLine: { prefix: 'BL', pad: 4 }` 65),
  `allocateId`, `clockISO`; `src/store/appStore.ts` (`PERSIST_VERSION`, the schedule slice,
  `freshAppState`, `resetDomainState`); `src/shared/audit/fieldLabels.ts` and `ACTION_LABELS`.
- Demo: `src/apps/demo/DemoControlPanel.tsx` `stagePostOpScenario` 179 (re-homed by 14 to
  `stage-post-op` in `src/shared/demoTriggers/registry.ts`), the PWA sheet, `pwaPurity.test.ts`.
- Tests to extend: `store/billingLines.test.ts` (or wherever `addBillingLine` is tested),
  `domain/billing/fee.test.ts`, `invoiceBuild.test.ts`, 39's `additionalInvoiceActions.test.ts` (the
  BCTI count pattern), 16's count test, `seed.test.ts`, `store/persistMigrate.test.ts`,
  `shared/demoTriggers/demoTriggers.test.ts`, `pwaPurity.test.ts`, and the Playwright specs that shoot
  the Booking detail and the add-billing-line sheet.

## Work items

### Session 1: model, pricing, store and seed

1. **Model** (`domain/types.ts`). DM-17, US-03.3.6.
   - `ProcedureEventType` = `'postOpWardReview' | 'hduReview' | 'painConsult' | 'accPreOpAssessment' |
     'otherPreOp' | 'otherPostOp'`; `ProcedureEventPhase` = `'preOp' | 'postOp'`.
   - `ProcedureEvent`, in a new `schedule.procedureEvents` record (beside `billingLines`): `{ id;
     procedureId; bookingId; phase; type; description; dateISO; startTime?: WallTime; recording:
     EventRecording; billable: boolean; status: 'notBillable' | 'awaitingApproval' | 'approved' |
     'invoiced' | 'declined'; addedBy: { who; role; anaesthetistId }; addedAtISO; decision?: { by: {
     who; role }; atISO; reason? }; pricing?: EventPricing; billableParty?: CounterpartyRef;
     invoiceId?: InvoiceId; origin: 'event' | 'lateLine' }`.
   - `EventRecording`, a discriminated union:
     - `{ kind: 'time'; minutes: number }`;
     - `{ kind: 'fixedFee'; source: 'contractLine'; contractId; feeScheduleLineId }` (an ACC code, or
       the Contract's fee for this type of event);
     - `{ kind: 'fixedFee'; source: 'typed'; amount }` (no Contract fee exists; the anaesthetist
       types it, as they type an ancillary amount today);
     - `{ kind: 'line'; line: LateLineInput }` for a late billing line (work item 5), where
       `LateLineInput` is the billing line input of work item 4.
     There is no modifier, ASA, base-unit or RVG field anywhere on the record (US-03.7.1 AC 2).
   - `EventPricing`, written at approval and frozen with the invoice, so Phase 25's Regenerate can
     reproduce it: `{ basis: 'time' | 'contractFixedFee' | 'typedFixedFee' | 'line' | 'officePrice';
     pricingDateISO; minutes?; timeUnits?; unitRate?; contractId?; contractVersion?;
     feeScheduleLineId?; holderCode?; replacedMinutes?; amount; officeReason? }`, amounts ex GST in
     dollars to the cent as every stored price. `contractVersion` is 25's `Contract.version` the price
     was read from, so the event invoice is traceable to a Contract version as a lock is.
   - `BillingLine` gains `serviceDateISO?: IsoDate` (absent means the List date), `lineType?:
     BillingLineType` and, for a Contract add-on, `feeScheduleLineId?` and `quantity?`.
     `BillingLineType` = `'postOpWardReview' | 'hduReview' | 'nerveCatheter' | 'painConsult' |
     'medicalTransport' | 'contractAddOn' | 'other'`. `chargeBasis` keeps its values (an add-on line is
     `'fixed'` with a `feeScheduleLineId`), so nothing that switches on `ChargeBasis` ripples.
   - `FeeScheduleLine` (18) gains `eventTypes?: ProcedureEventType[]`: a line that prices an event of
     those types as a fixed fee. Such a line never matches a Procedure (like an add-on) and is never
     offered as an add-on.
   - `Invoice.kind` widens with `'event'`; `Invoice.lineage` roles gain `'eventOf'` (an event invoice
     points at the Procedure's original invoice when one exists); `InvoiceLine` gains
     `serviceDateISO?`.
   - `ID_FORMATS`: `procedureEvent` (`EV`, pad 4). Thread the new record through `AppState`, the empty
     schedule slice, `freshAppState`, `resetDomainState` and the seed builders.
2. **Pure event rules and pricing** in a new `src/domain/billing/procedureEvent.ts`, re-exported from
   the billing index, Vitest-covered (convention 9). The only place an event is validated or priced.
   - `EVENT_RULES`, the one OQ-63 constant, commented "OQ-63 recommendation, provisional": `{ model:
     'ownElement'; invoice: 'ownInvoiceOneLine'; approval: 'office' }`.
   - `EVENT_TYPES`: per type, its phase, whether it takes a time, a fixed fee or both, and whether its
     fixed fee may come from another in-scope Contract (`accPreOpAssessment` only). Labels live in the
     UI copy map (work item 8), not here.
   - `validateEventInput(input, { listDateISO, todayISO })`: a pre-op event is dated on or before the
     List date, a post-op event on or after it, neither after today ("An event cannot be dated in the
     future."); a time is whole minutes from 1 to 720; a typed fee is above zero; a type that needs a
     Contract line has one. Returns `null` or `{ code; message; field }`.
   - `eventFeeLineFor({ lines, contractId, type, dateISO })`: the Procedure's Contract's line whose
     `eventTypes` include the type and that has a price in force on the date, else undefined.
     `accPreOpLinesFor({ contracts, lines, procedure, hospitalId, dateISO })`: the ACC pre-op lines on
     in-scope Contracts (20's pure scope rule) with a price in force, in line order, for the picker.
   - `servicePricingDate(...)`: the event's own date, or the line's own date (OQ-48, provisional).
   - `priceProcedureEvent(event, ctx)` with `ctx = { contract; lines; anaesthetistUnitValue;
     rateInForce }`: returns `{ kind: 'priced'; pricing: EventPricing; description }` or `{ kind:
     'refused'; code; message }`:
     - **a Contract fixed fee replaces a time** (US-03.7.2 AC 2): when `eventFeeLineFor` finds a line,
       the price is that line's price in force, `basis: 'contractFixedFee'`, with `replacedMinutes`
       set for a time event ("Contract fixed fee STGACC-PAIN replaces 40 min");
     - **a time** otherwise: `timeUnitsFromMinutes(minutes)` (the RVG rule, OQ-50) times the unit rate
       the Procedure's Contract uses on the event date: 18's `rateInForce` for a Contract rate, the
       anaesthetist's unit value for `rvgUnitsAnaesthetistRate` or no Contract. A `fixedSchedule` or
       `rateTime` Contract with no event line has no unit rate: refused `noUnitRate` ("This Contract
       has no unit rate for a timed event. Set a price to approve it.");
     - **a typed or code fixed fee** as recorded; a **late line** through work item 4's line pricing;
     - a not-billable event is refused `notBillable` (it is never priced);
     - no modifier, ASA or base-unit input exists in `ctx`;
     - the Contract and lines in `ctx` are the live Contract (its current 25 version) and its lines,
       read on the event date, never the Booking's lock: the event is a new service priced once at
       approval and frozen in `pricing` (with `contractVersion`), which is the OQ-48 reading extended
       to events, provisional. The Booking's lock is not read for the rate and never written.
   - `eventInvoiceLine(event, pricing)`: one line, description such as "Post-op pain consult · 18 Jul
     2026 · 40 min, Contract fixed fee" or "ACC pre-op assessment · CS250 · 13 Jul 2026", with
     `serviceDateISO`, quantity 1, the amount.
   - Tests (worked figures): 45 min under `CT-STG-ACC` at $25.00 is 3 units, $75.00; 121 min enters
     the second tier (9 units); a Contract event line replaces 40 min with its fixed fee; the line is
     ignored before its first price date; an ACC code line priced on its date; a typed fee; the
     `noUnitRate` refusal; every validation refusal, including both date edges and the future date; a
     not-billable event refused; determinism; and a guard that the module imports nothing from the
     modifier or ASA modules.
3. **Store: events** (a new `src/store/procedureEventActions.ts`, exported from `store/index.ts`).
   US-03.7.1, US-03.7.2.
   - **The event guard** `eventRefusal(actor, state, procedure)`, separate from `editRefusal`
     (which stays exactly as it is, so a billed Booking stays locked: 38a's handoff): the actor is the
     anaesthetist of the Procedure's List (after 32, the doer), the Booking and Procedure are not
     cancelled, and the List has an anaesthetist (a Draft List, 31, has none). Any List state is
     allowed, DRAFT to billed. The office does not add events (its path is 39's additional invoice).
   - `addProcedureEvent(api, actor, procedureId, input)`: validate (item 2), then one `mutate()`
     writing the event with status `awaitingApproval` when billable, `notBillable` otherwise. Audit
     `procedureEvent.add` on the event, stamping the Booking. The Booking, its Procedures and its lock
     are not written (US-07.3.2): assert deep-equal in the tests.
   - `updateProcedureEvent` and `removeProcedureEvent`: the adder only, while the event is
     `notBillable`, `awaitingApproval` or `declined`; an edit of a declined event sends it back to
     `awaitingApproval`; toggling billable moves it in or out of the queue. Refused once approved
     ("This event is approved. Ask the office to correct its invoice."). Audit `procedureEvent.update`
     (before and after) and `procedureEvent.remove` (the full record).
   - `approveProcedureEvent(api, actor, eventId, { billableParty?, officePrice? })`: office only
     (`officeOnly`). Prices through item 2 (an `officePrice` with a reason replaces the computed price,
     `basis: 'officePrice'`, and is required on `noUnitRate`). The billable party defaults to the
     event Contract's holder for an event priced by another Contract (the ACC pre-op), else the
     Booking's locked billable party (21, 25); any other party is allowed and audited. One
     `mutate()`: status `approved`, the decision, the frozen `pricing` and party; audit
     `procedureEvent.approve`. Then, in the same commit, **if the Procedure's List is billed**,
     `raiseEventInvoiceInto(draft, eventId)`:
     - allocate through 22's `materialiseInvoices`, kind `'event'`, `procedureIds: [procedureId]`, the
       `eventOf` lineage to `liveInvoiceForProcedure` (39) when one exists, one line from
       `eventInvoiceLine`, layout, delivery and GST treatment from the event's Contract or else the
       Procedure's locked Contract;
     - create 36's pair through `newBookingPair` (receivable from the party, payable to the Booking's
       locked payee from 25 for the same total, per 16);
     - stamp `invoiceId` and status `invoiced`; audit `invoice.eventCreated` (number, event, Procedure,
       original invoice, party, amount), 22's delivery entries and 36's `ledger.pairCreated`.
     After the commit, `handoffPair` for the new pair, as 39's additional invoice does (a handoff fault
     leaves the invoice valid and the monitor's retry picks it up).
     **If the List is not billed yet**, the event stays `approved` ("Invoiced when the List is
     billed"), and the billing run raises it (next bullet).
   - **The billing run** (22's `runBillingForList` or its current name): after the List's own invoices,
     call `raiseApprovedEventInvoicesForList(draft, listId)`, which runs `raiseEventInvoiceInto` for
     each approved, uninvoiced event on the List's Procedures, in event id order. One path raises every
     event invoice.
   - `declineProcedureEvent(api, actor, eventId, reason)`: office only, reason required ("Give a
     reason the anaesthetist will see."); status `declined`; audit `procedureEvent.decline`.
   - **BCTI feed:** the event invoice's ACCPAY appears in `bctiRecords` through the same rule as any
     ACCPAY (or payable leg, as 36 left it). Extend 16's count test: one invoiced event adds exactly one
     BCTI for its month; not-billable, awaiting, approved-but-uninvoiced and declined events add none.
   - **Corrections:** confirm whether 39's `creditAndRebill` accepts an `'event'` invoice. If it does,
     its rebill must re-price from the event's frozen `pricing`, not the Procedure's lock; if it does
     not, it refuses with a plain sentence ("Event invoices are corrected by the office with an
     additional invoice."). Test whichever is true. No new correction UI.
   - Selectors: `eventsForProcedure`, `eventsForBooking`, `eventsAwaitingApproval` (oldest first),
     `eventInvoicesFor(invoiceId)` (derived back-links, never stored on the original invoice).
   - Tests (`procedureEventActions.test.ts`): add on a DRAFT, a SUBMITTED and a billed List as the
     List's anaesthetist; refused for another anaesthetist, the office, a cancelled Booking or
     Procedure, a Draft List; the Booking, Procedures and lock deep-equal before and after; edit and
     remove until approved, refused after; approve raises one invoice with the right kind, number,
     lineage, line, pair and payee on a billed List, and none on a SUBMITTED List until the billing
     run, which then raises exactly one; approving twice refuses; decline needs a reason and a declined
     event resubmits on edit; the not-billable event never queues and never invoices; the BCTI count
     above; Regenerate (25's `regenerateInvoiceFromLock`, extended to route an `'event'` invoice to
     its frozen `pricing`) reports "identical".
4. **Billing lines: a date, a type and Contract add-ons** (`billingLineActions.ts`, `fee.ts`,
   `invoiceBuild.ts`). US-03.3.6.
   - `AddBillingLineInput` gains `serviceDateISO?`, `lineType` (required from the UI; default
     `'other'` for old callers) and, for `'contractAddOn'`, `feeScheduleLineId` and `quantity`. The
     date may not be before the List date or after today. Rate x time stays the same path, gated by
     18's `permitsRateTime` with `INDIVIDUAL_ARRANGEMENT_MESSAGE`.
   - **One add-on price**, `addOnFeeLine(line, quantity, dateISO)` beside 18's helpers: the line must
     be in `addOnLinesInForce` for the Procedure's Contract on the date (refused `addOnNotOnContract`,
     "This add-on is not on this Procedure's Contract for that date."), quantity whole and 1 or more
     when the line has a quantity rule, else 1; amount = price in force x quantity, ex GST.
     `addBillingLine` stores that amount and `fee.ts` prices the line through the same function on the
     line's date (OQ-48 reading). If 18 stores office-attached add-ons in
     `Procedure.feeSchedule.addOns`, keep that home for the office and refuse the same add-on line as
     both an attached add-on and a billing line on one Procedure (`addOnAlreadyAttached`); both price
     through `addOnFeeLine`.
   - `fee.ts` keeps its shape; a dated line passes its date through to the fee line, and
     `invoiceBuild.ts` copies it to `InvoiceLine.serviceDateISO` when it differs from the List date.
     The fee line for an add-on reads "<holderCode> · <description>", plus " x n <unitLabel>".
   - 18's parity fixture must match unchanged (no seeded Procedure has a dated, typed or add-on line):
     run it, never with `-u`.
   - Tests: a dated line keeps its date onto the invoice line; each preset type round-trips; an add-on
     priced on its own date across a price step; an add-on not on the Contract refused; quantity on a
     quantity-rule line; the duplicate add-on refusal; rate x time unchanged; the conservation rule
     still holds with dated lines.
5. **Late billing lines take the event path** (`procedureEventActions.ts`). US-03.3.6's "days later".
   - `addLateBillingLine(api, actor, procedureId, input)`: the anaesthetist's line when the List is
     not DRAFT (`editRefusal` would refuse `addBillingLine`). It validates the line through item 4 and
     records a `ProcedureEvent` with `origin: 'lateLine'`, `recording: { kind: 'line', line }`, phase
     from the line's date against the List date, `billable: true`, status `awaitingApproval`. From
     here it is an event: the same queue, approval, invoice and BCTI. Audit `procedureEvent.add` with
     `origin`. The Procedure's `billingLines` are never written after submit.
   - `addBillingLine` itself is unchanged for the office (it may still add lines to a SUBMITTED List)
     and for the anaesthetist on a DRAFT List.
   - Tests: an anaesthetist line on a SUBMITTED List becomes an awaiting late line and the Booking is
     deep-equal; on a billed List the same; approval invoices it on its own with its date; an add-on
     late line priced on its own date.
6. **Seed: Contracts with add-on and event fee lines** (`seed/contracts.ts` and 18's fee schedule
   lines; labelled demo prices).
   - **St George's ACC (`CT-STG-ACC`, the existing agreed-rate Contract at $25.00 a unit) gains lines**
     (`CP-STGACC-1` on, from 2026-01-01): add-ons `STGACC-NC` "Nerve catheter, continuous block"
     ($180.00) and `STGACC-TX` "Medical transport escort, per hour" ($150.00, quantity rule "hour");
     and the event fee line `STGACC-PAIN` "Acute pain review, fixed fee" ($120.00, `eventTypes
     ['painConsult']`). This is the Contract with add-ons that Dr Souter's staged Procedure uses, and
     its unit rate prices a timed event (45 min is 3 units, $75.00). Labelled reading: US-04.2.4
     describes add-on lines on fixed fee schedules; an agreed-rate Contract carrying add-on and event
     fee lines is the prototype's reading, to confirm with AA. Add-on and event lines never match a
     Procedure, so every seeded Procedure on `CT-STG-ACC` prices exactly as before.
   - **New `CT-ACC-PREOP` "ACC pre-operative assessment, St George's"**: category `hospital`, holder St
     George's, `fundingSources ['ACC']`, `fixedSchedule`, scope St George's, from 2026-01-01, its
     `aaCode` from 18's allocator. Lines (`CP-ACCPRE-1` to `-3`): `CS250`, `CS260` and `CS70` "ACC
     pre-op assessment", demo prices, `eventTypes ['accPreOpAssessment']`, each with the OQ-12
     provisional note. This is the fixed-fee ACC Contract US-05.5.2 asks for; it has no Procedure line,
     so it is never picked for a Procedure (confirm 20's picker hides a Contract with only event lines,
     or filter it there). Labelled reading: ACC Contracts are held via the hospital, as 18 seeded St
     George's ACC; other hospitals' ACC pre-op Contracts are master data (Phase 42).
   - Both Contracts carry 25's version history: the seeded v1 snapshot in `masters.contractVersions`
     includes the new lines, so `contractVersions.test.ts` ("the latest version deep-equals the live
     Contract and lines") still holds. `CT-ACC-PREOP` declares no required inputs (21): an event has no
     completion step (labelled reading).
   - Neither change moves a figure: 18's parity fixture and 25's `phase-25-invoices.json` must match
     unchanged, and every S1 to S5 figure stands. Update the pinned id-to-code table in `seed.test.ts`.
   - Bump `PERSIST_VERSION` by one (the new slice, the line fields, the invoice kind, the Contract and
     lines) with a comment line ("Phase 39b: pre-op and post-op events"). Extend
     `persistMigrate.test.ts` (a stale payload is discarded to the fresh seed). Two fresh seeds
     deep-equal.
7. **Session 1 stop point.** Every action above tested at store level; `npm run build`,
   `npm run build:pwa` and `npx vitest run` green before session 2 starts.

### Session 2: screens, approval queue, documents, triggers and docs

8. **Copy in one place** (`src/shared/procedureEventCopy.ts`, PWA-safe): `EVENT_LABELS` (the
   user-facing name, provisional: "Pre-op event", "Post-op event", "Add pre-op or post-op event",
   "Events"), the type labels ("Post-op ward review", "HDU review", "Pain consult", "ACC pre-op
   assessment", "Other pre-op", "Other post-op"), `BILLING_LINE_TYPE_LABEL` ("Post-op ward review",
   "HDU review", "Nerve catheter", "Pain consult", "Medical transport", "Contract add-on fee",
   "Other"), the status labels ("Not billable", "Awaiting office approval", "Approved · invoiced when
   the List is billed", "Invoiced", "Declined"), and the two provisional captions (OQ-63, OQ-12). No en
   or em dash in any of them. If OQ-63 renames the element, this file is the one edit.
9. **Anaesthetist side: the events section and sheets** (the shared Booking detail body, so mobile and
   web render the same; US-03.7.1, US-03.1.4 parity).
   - Under each Procedure, an **Events** card (`ProcedureEventsCard`, `src/shared/capture/`), in the
     billing lines card's anatomy: each event's date and start time (mono), a Pre-op or Post-op pill,
     the type, what was recorded ("40 min", "Fixed fee", "CS250", or the late line's type and date),
     and a status pill on semantic tokens (Not billable neutral, Awaiting warning, Approved neutral,
     Invoiced success with the invoice number in mono, Declined neutral with the office's reason). **No
     amount computed by the system is shown** (the 2026-09-28 ruling; a typed fee shows as typed). Edit
     and remove while allowed. `data-shot="procedure-events"`.
   - The card's foot: a secondary teal **Add pre-op or post-op event**, shown on any List state when
     `eventRefusal` allows. On a billed List it **replaces 39's locked-Booking caption** and is the one
     control on the read-only Booking (38a's handoff); the rest stays read only.
   - **`AddProcedureEventSheet`** (via `useSurface`, a bottom sheet on mobile): Pre-op or Post-op
     (segmented), the type as tappable rows, the date (defaulting to the List date for pre-op and the
     day after for post-op, capped at today) and start time, then "Record a time" (a minutes stepper
     in 5-minute steps, mono) or "Fixed fee": a Contract fee line shows "Fixed fee under this
     Procedure's Contract" with no amount; the ACC pre-op type lists the codes from `accPreOpLinesFor`
     as rows ("CS250 · ACC pre-op assessment") with the OQ-12 chip; otherwise a typed amount. A
     **Billable** switch (on by default) with the caption "Not billable events are kept on the record
     and never invoiced." One primary teal **Add event** with the note "Billable events go to the office
     for approval before they are invoiced." and the OQ-63 chip. Refusals inline against the field.
     `data-shot="add-event-sheet"`.
   - **`AddBillingLineSheet`** gains a **Type** row set (the preset types), a **Date** field
     (defaulting to the List date), and for "Contract add-on fee" the Contract's add-on rows from
     `addOnLinesInForce` on the chosen date (holder code and description, quantity stepper when the
     line has a quantity rule, no price on the anaesthetist side). Fixed amount and rate x time stay.
     The ACC caption (100 to 106) goes; in its place, on any type: "An ACC pre-op assessment is a pre-op
     event." with a link button **Add as pre-op event**. Choosing "Post-op ward review", "HDU review" or
     "Pain consult" shows "Usually added as a post-op event, with its own date and time." and **Add as
     post-op event instead**, which opens the event sheet with the type carried over. On a List that is
     not DRAFT the sheet's banner reads "This List is submitted. This line goes to the office for
     approval and is invoiced on its own." and **Add line** calls `addLateBillingLine`.
     `data-shot="add-billing-line-sheet"`.
   - `BillingLinesCard` shows each line's type and, when it differs from the List date, its date in
     mono. An add-on line shows no price to the anaesthetist; the office sees it in its fee panel.
   - Mobile and web routes are unchanged: the sheets open over the Booking detail
     (`/mobile/lists/:listId/bookings/:bookingId`, `/web/lists/:listId/bookings/:bookingId`), reached
     from 38a's calendar (`?day=`) and search (`?q=`) as well as the Lists.
10. **Admin: the Events queue and approval** (US-03.7.2).
    - **Review** gains an **Events** tab (`/admin/review?tab=events`; the List queue stays the default
      tab) with a count in the side nav's Review item when events await approval. A table from
      `eventsAwaitingApproval`: anaesthetist (`drSurname`), patient, Procedure and List date, event
      (pill, type, date and time in mono), recorded, billable party, price (mono, from item 2, with its
      explanation), waiting (days). `data-shot="admin-events-queue"`.
    - A row opens **`EventApprovalSheet`** (`src/apps/admin/flows/`, office only; the 39 sheet
      pattern): the event, its Procedure and original invoice (links), the calculation ("45 min · 3
      time units x $25.00 = $75.00" or "Contract fixed fee STGACC-PAIN · $120.00 replaces 40 min"), the
      billable party (default, 21's picker for another, audited), an optional **Set a price** (amount
      and reason, required on `noUnitRate`), a primary teal **Approve and invoice** (or **Approve** when
      the List is not billed, with "Invoiced when the List is billed"), and **Decline** with a reason.
      The OQ-63 chip. On success the result line names the invoice number and links to it.
      `data-shot="event-approval-sheet"`.
    - The Admin Booking detail lists each Procedure's events (read only, with **Review** opening the
      same sheet). The Admin Day and Review List screens are not changed.
11. **Admin: the event invoice and its links.**
    - `InvoiceDocument.tsx`: on an `'event'` invoice the heading keeps "TAX INVOICE" (22's rule) and a
      line under the number reads "Post-op event · relates to AA-2026-0012 · {Procedure}" (a link;
      "Pre-op event" for a pre-op one); the one line shows its date in mono. Any line carrying
      `serviceDateISO` shows its date. On an invoice with event invoices, a rail card **Events** lists
      them (derived from `eventInvoicesFor`), beside 39's Additional invoices card.
      `data-shot="invoice-event-links"`.
    - Invoices screen: Kind gains **Event**, with "Event on AA-2026-0012" under the number.
    - Billing monitor: the Booking row detail adds "+1 event invoice" when one exists.
12. **Re-point the stage trigger and add the PWA stand-in** (the Phase 14 registry; bodies in
    `src/store` or `src/shared`, so `pwaPurity` holds).
    - `stage-post-op`, re-pointed to Dr Souter. A store helper `stagePostOpForSouter(api)` builds, with
      the ordinary store actions and actors (never a direct state write), a past, billed Procedure:
      on Dr Souter's Thu 16 Jul AM Slot (drift check step 4) a List at St George's with Mr Hale, one
      Booking for Coral Bennett, one primary Procedure "ACL reconstruction" on St George's ACC
      (`CT-STG-ACC`), times 08:05 to 09:40, ASA AS2, the Contract's required input filled (21 made
      St George's ACC require `claimReference`; use a demo claim number such as "ACC-DEMO-0716", or
      completion refuses), completed and submitted as Dr Souter (through 15a's submit confirm path),
      then authorised as `OFFICE_SIMULATION_ACTOR`, so 25's lock is written and the billing run raises
      the invoice, pair and Xero pair. If an action refuses a past date, use the office path (28's
      assignment as the office actor) and record it. **The 39 step stays**: the body still authorises
      Dr Sharma's Tue 14 Jul AM List exactly as 39 left it, because 39's additional-invoice beat and
      39a's refund-after-payout beat depend on it. Each half is idempotent on its own (it skips a half
      already staged), so the trigger stays enabled until both are done; its `when` (39 keyed it to Dr
      Sharma's List on the Admin routes) widens to the new mobile and web routes. Routes: 39's Admin routes, plus Mobile · Lists and Booking
      (`/mobile/lists`, `/mobile/lists/:listId`, `/mobile/lists/:listId/bookings/:bookingId`) and Web ·
      Lists and Booking, surfaces both (bar, and the PWA sheet on the mobile patterns). Description:
      "Gives Dr Souter a billed ACL reconstruction (Coral Bennett, Thu 16 Jul) to add post-op events
      to, and authorises Dr Sharma's Tue 14 Jul AM List for the additional invoice." Result: "Staged.
      Search Bennett, open Thursday's Booking and use Add pre-op or post-op event." Disabled "Already
      staged: search Bennett and open Thursday's Booking".
    - New `office-approves-event`, "Office approves this event" (Mobile · Booking,
      `/mobile/lists/:listId/bookings/:bookingId`; `surfaces: ['pwa']`, `badge: 'office-stand-in'`):
      `approveProcedureEvent(api, OFFICE_SIMULATION_ACTOR, oldest awaiting event or late line on the
      URL's Booking)` with the default party and no office price. Result "Approved by the office
      (simulated). Invoice AA-2026-00nn raised." or, on an unbilled List, "Approved. It is invoiced when
      the List is billed." Disabled "No event awaiting approval on this Booking" or, on `noUnitRate`,
      "Needs a price from the office: approve it in Admin".
    - `demoTriggers.test.ts` covers both (routes, surfaces, disabled states, the pinned per-screen
      counts); confirm `office-approves-event` shows only in the PWA sheet. Nothing is added to the
      Control Panel page; its index lists the entries under their screens.
13. **Persistence, labels and copy.**
    - Every new audit action gets a label in `ACTION_LABELS`: `procedureEvent.add`,
      `procedureEvent.update`, `procedureEvent.remove`, `procedureEvent.approve`,
      `procedureEvent.decline`, `invoice.eventCreated`; `fieldLabels.ts` gains the event and line
      fields.
    - Copy sweep: no en or em dash in any new string; "event" and the type names come only from
      `procedureEventCopy.ts`; no amount on any anaesthetist surface; grep `src` for the removed ACC
      caption ("Name the code in the description").
    - If session 2 changed the seed again, bump `PERSIST_VERSION` again (or once for the phase if both
      sessions ship as one change; record from and to).
14. **Tests, shots and docs close-out.** Component tests for `ProcedureEventsCard` and the two sheets
    (anaesthetist sees no computed amount; the add button is the only control on a billed Booking;
    the add-as-event shortcuts carry the type). Playwright: a new `visual/phase39b-events.spec.ts`
    (mobile Booking detail with events, the event sheet, the extended billing line sheet with an add-on
    and a date, the web Booking detail, Admin Review Events tab, the approval sheet, an event invoice
    with its relates-to line) and update any spec that shot 39's caption or the old billing line
    sheet. The capture recipes (US-03.7.1, US-03.7.2, US-05.5.2, US-03.3.6),
    ATLAS.md and `npm run verify:board` are the Catalogue screenshots step below. Then the demo guide
    (below) and PROGRESS.

## Demo triggers

The headline actions are **product UI**, not demo triggers: **Add pre-op or post-op event** and **Add
billing line** (with a preset type, a date and a Contract add-on fee) on the mobile and web Booking
detail, and **Approve and invoice** and **Decline** in Admin Review's Events tab. What the registry
gains or changes:

| Label | Screen | Surface | Effect |
|---|---|---|---|
| Stage post-op scenario (re-pointed, `stage-post-op`) | 39's Admin · Review and Booking detail routes, plus Mobile · Lists and Booking and Web · Lists and Booking | bar and pwa (pwa on the mobile patterns) | Builds Dr Souter's billed ACL reconstruction for Coral Bennett on Thu 16 Jul AM under St George's ACC (`CT-STG-ACC`, with its new add-on and event fee lines), through ordinary actions (with St George's ACC's required claim reference), and keeps 39's authorise of Dr Sharma's Tue 14 Jul AM List; each half skips itself once staged. Disabled, once both are staged, "Already staged: search Bennett and open Thursday's Booking" |
| Office approves this event (new, `office-approves-event`) | Mobile · Booking (`/mobile/lists/:listId/bookings/:bookingId`) | pwa, office stand-in badge | Approves the oldest awaiting event or late line on the URL's Booking as `OFFICE_SIMULATION_ACTOR`; the invoice is raised and the event reads Invoiced. Disabled "No event awaiting approval on this Booking" or "Needs a price from the office: approve it in Admin" |

PWA parity: the event and the late line have a mobile side that waits on the office, so the PWA gets
"Office approves this event" on the mobile Booking. In the framed build the presenter plays the office
in Admin Review's Events tab. 15a's "Raise sample warnings" is unchanged: this phase adds no warning
rule. Phase 44's audit records the stand-in.

## Out of scope

- **The office adding events** for an anaesthetist: the office raises late charges with 39's free-form
  additional invoice, which needs no approval (US-03.7.2's contrast).
- **An event as a Procedure on the Booking** (Greg's lean in OQ-63), events on the Procedure's own
  invoice as a line, events with modifiers, ASA or base units, and an event changing the original
  Booking, Procedure or lock (US-07.3.2).
- **A warning rule for events** (for example an event waiting too long for approval): no catalogue item
  asks for one; 15a's routine is the place if AA does.
- **Prepayment of events**: an event invoice is always post-paid and never enters 27's prepaid set or
  estimate; 41's moved prepaid Booking does not move its events' payee (handoff note).
- Correction UI for an event invoice beyond what 39's credit and rebill already accepts (work item 3).
- Rate x time beyond today's path, new rate rules, and editable preset types (the types are a constant
  until Phase 42 says otherwise).
- Confirming the ACC codes or prices (OQ-12) and the pricing date (OQ-48): both stay provisional.
- Emailing the anaesthetist when the office declines an event: the status and reason show on the
  Booking.
- Significant later work as another Booking: US-03.7.1's note (Greg) says a significant job is a new
  Booking, made through the ordinary paths; nothing here detects or redirects it.

## Manual test checklist

Session 1 (store level, after **Reset → Confirm reset**): the store tests above pass, including the
deep-equal Booking checks and the BCTI count; the parity fixture matches; `npm run build`,
`npm run build:pwa` and `npx vitest run` green.

Session 2 (after **Reset → Confirm reset**):

- [ ] Mobile (Dr Souter) · Lists: Demo actions shows **Stage post-op scenario**; run it. Search
      "Bennett": Thursday's Booking and Coral Bennett's backdrop Booking appear. Open Thursday's: it
      reads "Done · billed", read only, and the only control is **Add pre-op or post-op event**; 39's
      caption is gone.
- [ ] Add a post-op event: Pain consult, Sat 18 Jul 10:30, record 40 min, billable. It lists under the
      Procedure with Post-op, "40 min" and Awaiting office approval; no amount anywhere on the
      phone. Edit it to 45 min, then back to 40 min.
- [ ] Add a post-op ward review, Fri 17 Jul 08:00, 45 min. Add an HDU review marked not billable: it
      reads Not billable and never appears in the office queue.
- [ ] Try a post-op event dated Wed 15 Jul (before the List date) and one dated tomorrow: both refused
      with their sentences. The type rows offer no modifier, ASA or base-unit control.
- [ ] Add billing line on the same Booking: choose "Contract add-on fee", date Sat 18 Jul, pick "STGACC-NC
      · Nerve catheter, continuous block": the banner says the List is submitted and the line goes to
      the office; it appears as a late billing line awaiting approval. Choose "Pain consult": the sheet
      offers **Add as post-op event instead** and opens the event sheet with the type set.
- [ ] Add a pre-op event: ACC pre-op assessment, Mon 13 Jul, pick CS250 (OQ-12 chip shown). It reads
      Pre-op, "CS250", Awaiting office approval.
- [ ] Web (Dr Souter) · Lists, search Bennett, open the same Booking: the same events and controls.
- [ ] Admin · Review · **Events** tab: four awaiting rows (pain consult, ward review, the nerve catheter
      late line, the ACC pre-op), oldest first, the nav shows the count. Open the pain consult: "Contract
      fixed fee STGACC-PAIN replaces 40 min". **Approve and invoice**: an Event invoice with its own
      number, one dated line, "Post-op event · relates to AA-2026-..." under the number; the original
      invoice's rail lists it under Events; the Invoices screen shows Kind Event.
- [ ] Approve the ward review: "45 min · 3 time units x $25.00 = $75.00". Approve the nerve catheter
      line: priced from the add-on line on 18 Jul. Approve the ACC pre-op: priced from CS250, billable
      party St George's (the ACC Contract's holder), its own invoice line; the Booking still has
      exactly one primary Procedure.
- [ ] Add another event on the phone and **Decline** it in Admin with a reason: the phone shows Declined
      and the reason; editing it sends it back to Awaiting.
- [ ] Each approved event has its own ledger pair and Xero pair (the Xero sim lists it with the `-P`
      payable); the AA fee run preview (16) counts one more BCTI per event invoice for July and none
      for the not-billable or declined events.
- [ ] On a DRAFT List of Dr Souter's that no later beat needs (Reset afterwards), add a pre-op event
      dated today to a Booking: approve it in Admin: "Invoiced when the List is billed"; complete,
      submit and authorise that List: the event invoice is raised once, after the List's own invoices.
- [ ] Admin · Invoice of an event invoice: **Regenerate from locked data** reports identical.
- [ ] PWA (`npm run build:pwa` preview or the dev PWA): on Thursday's Booking, add an event, then the
      PWA sheet's **Office approves this event**: Invoiced with its number. The entry does not show in
      the framed harness bar.
- [ ] 39's beat still works: Admin · Sarah Mitchell's Booking on Dr Sharma's Tue 14 Jul List, **Create
      additional invoice**; 39a's **Stage refund after payout** still enables on her invoice.
- [ ] Admin · Audit shows each new action with the right who, role and source (anaesthetist for add,
      edit and remove; office for approve and decline; the simulated office for the stand-in).
- [ ] No en or em dash in any new string; no computed amount on any anaesthetist surface; teal is the
      only action colour; crimson unused on the new screens; provisional chips for OQ-63 and OQ-12.
- [ ] Catalogue screenshots: the recipes for US-03.7.1, US-03.7.2, US-05.5.2 and US-03.3.6 are created or updated, any recipe this phase broke is re-pointed, a full `npm run capture` ends with no failed recipe and no story without a recipe, the covered items' new shots are checked by eye, and `npm run verify:board` is green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots` green;
      `npm run verify:board` green.

## Demo guide updates

Take every figure, number and label from a reset run of the built app. This is not a milestone phase:
spot-check the master guide's S4 Beat 2 against the run sheet (the full read is 39a's and 44's).

- **`03-demo-script.md`:**
  - **S4 Beat 2** (39 rewrote it as the office's additional invoice) gains a lead-in, "the
    anaesthetist's own post-care": Stage post-op scenario; on the phone search Bennett, open
    Thursday's Booking, add a post-op pain consult (40 min) and a nerve catheter add-on dated Saturday;
    in Admin · Review · Events approve both; open the event invoice. Say: "The anaesthetist records
    post-care themselves, days later, instead of ringing the office. It is its own element on the
    Procedure with its own date and time; the office approves it and it is invoiced on its own line,
    traceable to the original. The Contract can swap the time for a fixed fee." Then 39's office
    additional invoice as the contrast ("the office's own late charge needs no approval"). Expected:
    two event invoices, the original untouched.
  - Optional aside, **ACC pre-op assessment**: add a pre-op event, ACC pre-op assessment, CS250;
    approve; its own invoice line. Say: "ACC pre-op assessments are a fixed-fee pre-op event under the
    ACC Contract, never the primary procedure. The codes are with AA's accountant."
  - The **Direct URLs** table gains "Event approvals · `/admin/review?tab=events`".
  - The S4 discovery points gain OQ-63 (event or added procedure, name, invoice line or procedure,
    approval) and OQ-12 (the ACC codes), one line each.
- **`02-workflows-and-handoffs.md`:** the "Post-operative addition" case (39 rewrote it for the office)
  gains the anaesthetist's path: add an event from the Booking (reached by calendar or search), office
  approval, its own invoice; not-billable events kept on the record; a late billing line after submit
  takes the same path. A short "ACC pre-op assessment" case. The capture workflow notes that billing
  lines carry their own date, a preset type and Contract add-on fees.
- **`04-presenter-cheat-sheet.md`:** "Built and clickable" gains pre-op and post-op events, the ACC
  pre-op event and dated, typed billing lines; "Strong phrases" gains "Post-care is recorded by the
  anaesthetist and approved by the office"; "Statements to avoid" gains "events are added as a new
  procedure" (OQ-63 is open) and "these are the ACC codes" (OQ-12 is open).
- **`01-personas-and-responsibilities.md`:** the anaesthetist adds pre-op and post-op events and late
  billing lines; the office approves or declines them.
- **`README.md`:** the readiness row for post-op work.
- **`master-demo-guide.html`:** the same sections (S4 Beat 2 and its aside, the workflow cases, the
  cheat-sheet equivalents, the personas), then the S4 Beat 2 spot-check.
- **Control Panel scenario text:** the S4 message that names "Stage post-op scenario" gains the Souter
  half.

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19),
run after the review pass and before the PROGRESS.md entry. Re-run
`node docs/prototype-build/catch-up/tools/recipe-status.mjs 39b` first: earlier phases may have
changed these recipes since this plan was written.

**Covered items.** When the phase is done, each recipe in `requirements-board/capture/recipes/`
matches what was built:

| Item | Recipe at plan time | When this phase is done |
|---|---|---|
| [US-03.7.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.7.1.md) Add a pre-op or post-op event to a Procedure | absent · stub, no shots | captured. Replace the stub. Run the `stage-post-op` bar action (Dr Souter's billed ACL reconstruction for Coral Bennett, Thu 16 Jul), then reach the Booking from the search (`?q=Bennett`, Phase 38a), since its ids are staged at runtime. Mobile shots `procedure-events` (highlight `[data-shot=procedure-events]`, the Events card) and `add-event-sheet` (highlight `[data-shot=add-event-sheet]`, Post-op, a time stepper and the Billable switch); web the same on the web Booking detail. States: `sheet` and `added` (the Post-op event with its own date and an "Awaiting office approval" pill), and `not-billable` with the switch off. Captions: "A post-op event is saved against the Procedure with its own date", "No modifiers can be added to an event", "An event can be marked not billable" |
| [US-03.7.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.7.2.md) Bill a pre-op or post-op event | absent · stub, no shots | captured. Replace the stub. Admin `/admin/review?tab=events`: shot `events-queue`, highlight `[data-shot=admin-events-queue]`; `approval` state opens a row and highlights `[data-shot=event-approval-sheet]` (the calculation "45 min · 3 time units x $25.00 = $75.00" and **Approve and invoice**); `invoiced` state opens the new invoice at `/admin/invoices/<id>` highlighting `[data-shot=invoice-event-links]` and its "Post-op event · relates to AA-..." line. Add a `fixed-fee` state for the Contract fixed fee replacing the time. Anaesthetist side: the Events card shows no invoice and no amount until approved (web and mobile `awaiting` state). Simulator or PWA stand-in is not shot. Caption: "An approved event raises its own invoice, traceable to the original Procedure; nothing is invoiced before approval" |
| [US-05.5.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.5.2.md) ACC pre-op flat fee codes | partial · web-acc-preop, mobile-acc-preop | stays `partial` unless AA supplies the code rates: reshoot as a pre-op event. Web and mobile (`acc-preop`): open the Booking on St George's ACC, Add pre-op or post-op event, Pre-op, type "ACC pre-op assessment", highlight the code rows ("CS250 · ACC pre-op assessment") in `[data-shot=add-event-sheet]` with the OQ-12 chip, then the added event. The old recipe fills the retired "What this line charges" description with the code; replace those steps. New reason: "CS250, CS260 and CS70 are in the picker with demo prices; AA's real ACC rates are not held (OQ-12)." Caption: "ACC pre-op assessment is a fixed-fee pre-op event, code picked from a list" |
| [US-03.3.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.3.6.md) Other billing lines, including rate x time | partial · web-billing-line[card,sheet], mobile-billing-line[card,sheet] | captured. Keep the shot names and the `card` and `sheet` states; the sheet now has the Type row (Post-op ward review, HDU review, Nerve catheter, Pain consult, Medical transport, Contract add-on fee, Other) and a Date field, so highlight `[data-shot=add-billing-line-sheet]` and add a `typed-dated` state with an HDU review dated the day after the List, and a `late-line` state on a submitted List showing the banner "This line goes to the office for approval and is invoiced on its own." Captions in the catalogue's words ("Billing lines outside the base, time and modifier calculation", "A billing line can carry its own later date"). Drop the partial reason |

**Recipes this phase breaks.** Work item 14 already asks for `US-03.3.6.json` and `US-05.5.2.json` to be re-pointed; reconcile with it as follows. Found at plan time:
- `US-03.3.7` and `US-05.2.6` (rate x time lines; web and mobile) click `Add billing line` and fill `[placeholder="What this line charges"]` in the sheet this phase extends with a Type row and a Date field. The placeholder and fixed amount and rate x time paths stay, so they should still run, but the `--dry` run decides; if a step breaks, fix by label and keep the shot names. The `[data-shot=capture-billing-lines]` highlight stays.
- `US-08.6.1` (Phase 39's rebuilt shots): its web and mobile `post-op-event` shots show the locked-Booking caption after Phase 39. This phase replaces that caption with the Add pre-op or post-op event control, so re-point both shots to `[data-shot=procedure-events]` on the staged Bennett Booking (or on a billed Booking), keep the names, and reword the caption to "The anaesthetist adds a post-op event; the office raises a free-form additional invoice".
- Any recipe that relied on `stage-post-op` building only Dr Sharma's Tue 14 Jul List: the trigger now also stages Dr Souter's Thu 16 Jul List, which adds a Booking to Dr Souter's Lists and search; check list and calendar recipes by the `--dry` run.
- Re-grep before capture: `grep -lE 'Add billing line|What this line charges|capture-billing-lines|post-op|stage-post' requirements-board/capture/recipes/*.json`.

**ATLAS.md.** Personas and IDs / Seed data: the staged Bennett Booking (Thu 16 Jul AM, St George's, ACC), the seeded `CT-ACC-PREOP` Contract and how to reach the runtime-generated ids (search `Bennett`). Overlays and Existing hooks: `procedure-events`, `add-event-sheet`, `add-billing-line-sheet`, `admin-events-queue`, `event-approval-sheet`, `invoice-event-links`. Routes: `/admin/review?tab=events`. Demo control panel: the re-pointed `stage-post-op` and the PWA-only `office-approves-event`. The ATLAS note for the Procedure picker/Add billing line sheet (placeholders and the removed ACC caption) is updated if the sheet's labels changed.

## Adversarial review (after build)

Once the manual test checklist and `npm run build`, `npm run build:pwa`, `npx vitest run` and
`npm run shots` are green, and before writing the PROGRESS entry, run the standard **adversarial
review-and-fix pass (PROGRESS convention 18)**:

- fan out four independent Opus review subagents, for **quality**, **bugs/correctness**, **plan
  adherence** and **money integrity** (one invoice per approved event, conservation on its pair, the
  BCTI feed), each given the covered catalogue files, this doc and the diff;
- this session then independently verifies every finding against the catalogue, this doc and the
  code, fixes the confirmed ones (with a test wherever a bug had none), re-greens, and records the pass
  in the phase entry;
- do not re-raise anything already settled in the Decisions log (as amended by this phase).

**Steer this phase's reviewers at:**

- **The locked Booking stays locked.** No event, late line or approval writes the Booking, its
  Procedures, their billing lines after submit, or the lock. `editRefusal` is unchanged; only
  `eventRefusal` lets the anaesthetist act on a billed List, and only to add, edit or remove their own
  unapproved events.
- **One invoice per approved billable event, once.** Approve twice, approve then bill the List, the
  billing run twice, a replayed handoff: never a second invoice, pair or BCTI. A not-billable, awaiting
  or declined event never invoices and never counts.
- **Pricing in one place.** Time events use `timeUnitsFromMinutes` and the Procedure's Contract rate on
  the event date, nothing else; a Contract event line replaces the time; no modifier, ASA or base-unit
  input reaches the event; add-on lines price through `addOnFeeLine` on their own date, in the store and
  in `fee.ts` alike; 18's parity fixture is unchanged.
- **Hidden fee.** No computed amount on any mobile or web anaesthetist surface, including the sheets,
  the events card, the add-on rows and the PWA stand-in's result.
- **Traceability.** Every event invoice links to its Procedure and, when one exists, the original
  invoice; back-links are derived, never stored on the original; Regenerate reproduces it.
- **Containment of OQ-63 and OQ-12.** The rules in `EVENT_RULES`, the name in
  `procedureEventCopy.ts`, the codes only in the seed, each step its own store action.
- **The staging.** `stage-post-op` uses ordinary actions, is deterministic, and still authorises Dr
  Sharma's List for 39 and 39a; `office-approves-event` is PWA only and audited as the simulated office.
- **Design and copy.** Bottom sheets with tappable rows on mobile; teal the only action colour; status
  pills on semantic tokens; mono dates, times and codes; no en or em dashes in app copy.

## PROGRESS.md updates

- **Status row** for catch-up Phase 39b, and a phase entry with:
  - the drift-check result (FT-03.7, US-03.7.1 and US-03.7.2 still Verify or not, US-05.5.2 and
    US-03.3.6 status; OQ-63, OQ-12 and OQ-48 status), the Slot used for the staging, and whether 39's
    `creditAndRebill` accepts an event invoice;
  - what was built, with the name map for later phases: `ProcedureEvent`, `EventRecording`,
    `EventPricing`, the `procedureEvents` slice, `EVENT_RULES`, `EVENT_TYPES`, `validateEventInput`,
    `eventFeeLineFor`, `accPreOpLinesFor`, `servicePricingDate`, `priceProcedureEvent`,
    `eventInvoiceLine`, `eventRefusal`, `addProcedureEvent`, `updateProcedureEvent`,
    `removeProcedureEvent`, `approveProcedureEvent`, `declineProcedureEvent`, `raiseEventInvoiceInto`,
    `raiseApprovedEventInvoicesForList`, `addLateBillingLine`, `addOnFeeLine`, the `BillingLine` and
    `FeeScheduleLine` fields, the `'event'` invoice kind and `eventOf` role, the selectors,
    `procedureEventCopy.ts`, the lines added to `CT-STG-ACC`, the seeded `CT-ACC-PREOP`,
    `stagePostOpForSouter`, the trigger ids, routes and audit actions;
  - the `PERSIST_VERSION` bump or bumps (from and to);
  - tests added and the before and after Vitest and Playwright counts;
  - the review pass.
- **Catalogue screenshots result:** recipes created or changed (US-03.7.1, US-03.7.2, US-05.5.2, US-03.3.6, plus the re-pointed US-08.6.1 and any of US-03.3.7 and US-05.2.6 that broke), the `capture/REPORT.md` counts (captured, partial, absent, failed) before and after, and any partial reason handed to a later phase.
- **Decisions log:**
  1. **Amended:** Phase 39's locked-Booking caption ("charges after this List was invoiced are raised
     by the office"): the anaesthetist's own path is now a pre-op or post-op event, approved by the
     office; the office's additional invoice stays, with no approval.
  2. **New (provisional, OQ-63):** an event is its own element on the Procedure, invoiced on its own
     invoice with one line after office approval; "not billable" means kept on the record and never
     invoiced; the name lives in one copy file.
  3. **New (provisional, OQ-12):** the ACC pre-op assessment is a pre-op event priced by a fixed-fee
     ACC Contract held via the hospital, codes CS250, CS260 and CS70 with demo prices; never primary.
  4. **New:** an event is priced from its recorded time by the RVG time rule (OQ-50) at the
     Procedure's Contract unit rate on the event's own date (the live Contract version, recorded in
     the frozen pricing, never the Booking's lock), unless the Contract carries a fixed fee for that
     event type; the office may set a price with a reason; the anaesthetist never sees a
     price (the 2026-09-28 ruling upheld).
  5. **New:** a billing line carries its own date, a preset type and, for a Contract add-on, the add-on
     schedule line priced on the line's date (OQ-48 reading, provisional); a line the anaesthetist adds
     after submit is a late line on the event path, never a write to the submitted or locked Booking.
  6. **New (provisional, OQ-29, OQ-60):** each event invoice adds one BCTI to 16's count;
     not-billable and declined events add none.
  7. **Amended:** the Phase 09 / 14 `stage-post-op` trigger now stages Dr Souter's billed Procedure as
     well as Dr Sharma's List.
- **Handoff notes:**
  - For **43a**: the event sheet and the extended billing line sheet are anaesthetist capture screens
    to keep free of Contract complexity (add-on rows show holder code and description only).
  - For **40**: the patient view lists event invoices with their standing.
  - For **41**: a moved prepaid Booking's payee repoint must carry its event invoices' payables with
    it, or say why not; events are never prepaid.
  - For **42**: preset line types and event types are constants; event fee lines are ordinary fee
    schedule lines with `eventTypes`, so the loader should accept the field.
  - For **43**: the Events queue and `eventsAwaitingApproval` must stay usable at full scale.
  - For **44**: S4 Beat 2's lead-in and the ACC aside as written here; the OQ-63 and OQ-12 lines if
    answered later; "Office approves this event" for the PWA parity audit.
