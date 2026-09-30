# Phase 27 · Prepayment lifecycle

**Requirements covered:**
[EP-06](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/EP-06.md) (Verify; the trigger, estimate, tracking and settlement half. Letters, credits, trust account and refunds are Phase 41),
[FT-06.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-06.2.md),
[US-06.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.2.1.md),
[US-06.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.2.2.md) (Verify),
[US-06.2.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.2.3.md) (the estimate wording on the invoice; letter templates are Phase 41),
[US-06.2.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.2.4.md) (Proposed),
[US-06.2.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.2.5.md) (Proposed),
[US-06.3.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.3.2.md),
[US-06.3.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.3.5.md) (Verify),
[US-06.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.4.1.md);
[DM-16](../analysis/domain-model-delta.md#dm-16) (prepayment lifecycle, except the letter-template
master and the overpayment credit); [RV-09](../analysis/reverse-check.md) (prepayment as a patient
category, a completion-time gate and a manual raise).
**Depends on:** Phase 25 (the balance run prices only from the AUTHORISED lock) and Phase 26 (the
anaesthetist's prepaid set of RVG codes and groups, `expandPrepaidCodes` / `prepaidReasonFor` in
`domain/billing/prepaidSet.ts`, `setPrepaidSettings`, and the profile's unit value). Through them:
19's base-unit resolver (`resolveBaseUnits` in `domain/billing/baseUnits.ts`) and RVG groups, 20's interim office-set prepayment flag (replaced here), 21's
billable party and `prepaidAmount` required input, 22's invoice layout and GST rule, 23's
Booking-level engine, 15's Booking vocabulary and 14's trigger registry.
**Estimated:** 2 sessions. Session 1: work items 1 to 11 (figures pinned, model, estimator, status and
alert, store actions, re-check, balance link, seed, D5), ending green with the UI edited only as far
as it must compile. Session 2: items 12 to 18 (Booking panel and sheet, admin alert surfaces, review,
invoice wording, settings, triggers, shots, demo guide). This is a full two sessions. If session 1
overruns, items 10 and 11 open session 2; cut nothing, and never skip the demo guide or the
adversarial pass.

## Goal

Prepayment stops being something a person picks. A Booking needs prepayment when any of its
Procedures carries an RVG code in the anaesthetist's prepaid set (Phase 26), checked across the whole
Booking and never from the Contract. The Booking stores the prepaid amount: by default an estimate
from a pure estimator (base units through Phase 19's resolver, time units from an estimated duration
the office records from the surgeon's rooms, plus contingency modifier units held as a setting, all at
the anaesthetist's own unit value), or a deposit. The office or the anaesthetist sets it, and the
prepayment invoice is raised at setup (owner decision D6). The office sees each prepaid Booking as
amount not set, unpaid, part paid or paid, with an alert that escalates as the procedure date
approaches. When Procedures, the Contract or the estimated duration change before the procedure, the
requirement and amount are re-checked. After AUTHORISED, the balance invoice deducts what was
prepaid and names the prepayment invoice it settles.

Owner decision D5 fixes the gate. By default the hard completion gate and its audited override go,
and the escalating alert is the control. If the owner keeps the gate, it stays but fires from the
derived requirement. Phase 20's interim office-set flag is removed.

> Names below are the July names (`Card`, `cardId`, `CardDetailBody`, `cardRequiresPrepayment`,
> `raisePreProcedureInvoice`, `buildPrePaymentInvoiceForCard`). Phase 15 renamed Card to Booking; use
> the renamed identifiers, files and routes (`/mobile/lists/:listId/bookings/:bookingId`,
> `/admin/day/:dateISO/bookings/:bookingId`). Likewise use the names Phases 19 to 26 actually shipped
> (the resolver, the prepaid set, the billable party, the lock record).

## Before you start: drift check

1. Run:

   ```
   git diff 1f067a8 -- "docs/discovery-reference/Updated Requirements/catalogue" "docs/discovery-reference/Updated Requirements/domain-model.md"
   ```

   Look for changes to EP-06, FT-06.2, US-06.2.1 to US-06.2.5, US-06.3.2, US-06.3.5, US-06.4.1, and
   to the items this phase leans on: FT-06.3, FT-06.4, US-06.3.1, US-06.3.4, US-06.4.2, US-08.2.2,
   US-12.1.3, US-05.2.2, US-06.1.1, FT-08.1 and the domain model's Prepayment section. Check that
   US-06.3.3 is still Retired (merged into US-06.3.2). If an item changed, re-read it and adjust the
   work items. If one is now Retired or Future, drop it from this phase and record that in the PROGRESS
   entry.
2. **Owner decisions D5 and D6.** Confirm whether either has been answered.

   | Gate | If unanswered (the default to build, labelled provisional) | If answered differently |
   |---|---|---|
   | **D5** (keep the hard completion gate? RV-09, a settled July ruling; the catalogue is silent) | Remove the gate and its audited override (work item 10a). The escalating unpaid-prepayment alert (item 6) is the control. The anaesthetist still sees the unpaid state on the Booking and can cancel | Keep the gate (item 10b): `completionBlockersFor` blocks on the derived outstanding statuses, part paid included; the override stays, re-keyed to the derived requirement. The alert is built either way |
   | **D6** (who raises the prepayment invoice at setup? FT-08.1 says no engine action before AUTHORISED; US-06.3.1 has the engine raise it) | The engine raises it the moment an amount is stored, as a system actor ("Billing engine"), recorded as a named exception to FT-08.1 in the Decisions log | The office raises it: storing the amount stops there, the status reads "To invoice", and the Booking prompts the office with "Raise pre-payment invoice" (today's manual button, re-pointed at the stored amount) |

3. **Open questions.** Both are Open at `1f067a8`. If still open, build the interim below and label it.
   - **OQ-38** (the two contingency modifier units). Interim: the recommendation. An estimate-only
     buffer, held as a setting (two to start), shown as its own row in the estimate, never recorded as
     modifiers on the Procedure and never used by the final calculation. Label the setting and the
     estimate row "Provisional · to confirm with AA (OQ-38)". If answered as "two specific modifier
     codes recorded on the Procedure", stop and ask the owner before item 3. If answered as "varies by
     anaesthetist", move the setting onto the Phase 26 profile with the global value as the default.
   - **OQ-50** (the time rule after two hours). Interim: keep `timeUnitsFromMinutes`
     (`domain/billing/timeUnits.ts`, US-05.2.2 as written, round up per started interval). When the
     estimated duration is over 120 minutes, the estimate breakdown carries "Time rule after two hours
     to confirm (OQ-50)". If answered, change `timeUnitsFromMinutes` and its tests only; the estimator
     calls it and needs no change.
   - US-06.3.5 cites OQ-35 (diagram-sourced, treat as more correct than the RFP). Its catalogue text
     and images still describe a payment category, which Phase 20 removed. Build the re-check against
     Procedure, Contract and duration changes, and note the stale wording in the PROGRESS entry for the
     owner (do not edit the catalogue).
4. **Read what Phases 19 to 26 actually built** (their PROGRESS entries): the base-unit resolver's
   name and inputs (and whether 23 fills its Contract override slot); 20's Booking prepayment field,
   `setBookingPrepayment`, `PrepaymentFlagSheet` and the validator's prepayment checks; 21's
   `billablePartyForProcedure`, its `prepaidAmount` required input and the guardian prepayment test;
   22's GST rule and invoice layout (where the prepayment wording now lives); 23's Booking-level time
   handling; 25's lock record and whether `prePaidByProcedure` still threads into the locked run; 26's
   prepaid-set shape, its seeded sets and whether it already re-checks anything on a settings edit.
   Adjust the work items to reuse what exists instead of adding a second copy.
   - **Additional prepaid Procedures after 23.** 23 prices base units on the primary only: an
     additional Procedure has base 0 (`baseSource: 'additional'`) and is priced by its Contract's
     multi-procedure rule. The typical prepaid case (US-06.2.1) is exactly that: a hospital primary
     with a cosmetic add-on (Nair). Confirm how 23 shipped, then apply item 3's reading so the
     estimate follows what the engine will charge. If 23 shipped something else, adjust item 3 and
     item 9's Nair figures to match, and log it.
5. Record the result (including "no drift" and both decision answers) in the PROGRESS entry.

## Reference

- **Design** (convention 17):
  - `docs/design/Design Language.dc.html`: the semantic tints (warning for unpaid and part paid,
    error for an urgent alert, success for paid), neutral pills for status, Spline Sans Mono with
    tabular-nums for every amount and unit count, and teal as the only action colour (crimson never
    on the prepayment panel, the sheet or the alert).
  - `docs/design/Admin Day.dc.html`: the right rail's white cards (the "Awaiting review" card is the
    pattern for the new "Pre-payments due" card) and the day-grid block corner signals.
  - `docs/design/Mobile App.dc.html`: the Booking detail anatomy (white cards with micro-cap
    headings, 14px radius) and the bottom-sheet pattern for the amount sheet.
  - `docs/design/Admin Review.dc.html`: the flag chips in the review table.
  - No mockup covers the estimate breakdown. Extend the mobile card-row pattern: one mono row per
    component (base, time, contingency), a rule, then units x unit value = amount.
- **Catalogue:** the covered files above, plus FT-06.3, FT-06.4, US-06.3.1, US-06.3.4, US-06.4.2,
  US-08.2.2, US-12.1.3, US-05.2.2, US-06.1.1, OQ-38, OQ-50 and `domain-model.md` (Prepayment).
- **Gap analysis:** `GAP-ANALYSIS.md` (Summary, theme 7, "Remove or rework" and "Demo impact" S4, the
  DM-16 and RV-09 rows); `epics/EP-06.md` (every item this phase covers); `gaps.json` entries for the
  covered IDs, DM-16 and RV-09; `analysis/domain-model-delta.md` (DM-15, DM-16);
  `analysis/reverse-check.md` (RV-09, RV-17).
- **Code entry points** (July line numbers, from `analysis/prototype-map-*.md`; shifted by 15 to 26):
  - `src/domain/types.ts`: `Card` 370 (`prepaymentOverride`; 20 added `prepayment`),
    `PrepaymentOverride` 352, `PrepaymentDetail` 426, `Invoice` 662 (`kind: 'standard' | 'prePayment'`),
    `InvoiceLine` 678, `DemoSettings` 886.
  - `src/domain/billing/`: `invoiceBuild.ts` (`buildInvoicesForCard` deduction line about 380 to 393,
    the `negativeTotal` belt about 412 to 421, `buildPrePaymentInvoiceForCard` 456 to 505);
    `timeUnits.ts` (`timeUnitsFromMinutes`); `fee.ts`; 19's `baseUnits.ts`; `validateCardForBilling.ts`
    (20's prepayment checks); `prePaymentInvoice.test.ts`.
  - `src/store/`: `prepaymentActions.ts` (`raisePreProcedureInvoice` 53, `overridePrepaymentGate` 181,
    20's `setBookingPrepayment`); `selectors.ts` (`cardRequiresPrepayment` 307,
    `prePaymentInvoicesForCard`, `paidPrePaymentCaseForCard`, `prePaidByProcedure`,
    `prepaymentStatusFor` 372); `lifecycle.ts` (`completionBlockersFor` 93, `cancelCard` 363,
    `editCard` 415, `editProcedure` 445, `reassignList` 550, `reassignCard` 640); `cardActions.ts`
    (`addProcedure` 394, `removeProcedure` 474); `mastersActions.ts` (`editAnaesthetist` 185);
    `billingRun.ts` (threads `prePaidByProcedure`); `paymentActions.ts` (`receivePayment` 78);
    `clockActions.ts` (`advanceClockToDate` 101); `xeroHandoff.ts` (`handoffCasesForCard`);
    `prepayment.test.ts`, `paymentActions.test.ts`, `seedBilling.test.ts`, `demoScenarios.test.ts`.
  - `src/shared/card/CardDetailBody.tsx` (the prepayment banner 512 to 545, `doRaisePrepayment` 458,
    `officeActionStyle` 91); `src/shared/flows/PrepaymentOverrideSheet.tsx`, 20's
    `PrepaymentFlagSheet.tsx`, `flows/index.ts`; `src/shared/audit/actionLabels.ts`, `fieldLabels.ts`,
    `auditNarrative.ts` (the `PrepaymentDetail` formatter about 142); `src/shared/demoTriggers/`
    (14's registry, `types.ts`, `context.ts`); `src/domain/dateDays.ts` (`daysBetween`).
  - `src/apps/admin/`: `AdminApp.tsx` (`prepaymentFlags` 194 to 204), `components/DayGrid.tsx`
    (the `$` corner 354, the "Pre-payment flagged" filter 229), `components/RightRail.tsx`,
    `reviewFlags.ts` (73 to 77), `screens/ReviewScreen.tsx` 74, `screens/InvoiceDocument.tsx`
    (the prepayment wording, 496 to 530 in July), `screens/MasterData.tsx`.
  - Seed: `src/domain/seed/cards.ts` (Riley on Souter Fri 24 AM about 808, Nair on Souter Fri 24 PM
    about 878, `SEED_MARKERS.prepayment` / `prepaymentPaid` 1226), `billing.ts`
    (`buildSeedBillingSlice`, the paid INV0001/BC0001 pre-payment about 105 to 245), `rvgCodes.ts`
    (41800 Rhinoplasty 5 base units, 41789 Septoplasty 4), `cast.ts` (Souter $26.50), 26's prepaid sets.
  - Shots: `visual/admin-phase09.spec.ts`, `admin-phase08.spec.ts` (`data-shot="card-prepayment"`,
    `daygrid-block-prepayment`). Capture recipes: `requirements-board/capture/recipes/US-06.2.1.json`,
    `US-06.2.2`, `US-06.2.3`, `US-06.3.1`, `US-06.3.2`, `US-06.3.3`, `US-06.3.4`, `US-06.3.5`,
    `US-06.4.1`.

## Work items

**Session 1: figures, model, estimator, store, seed.**

1. **Pin the figures first.** Before changing code, add `src/store/prepaymentParity.test.ts` capturing
   from the current build: every seeded Booking's prepayment status; the S3 invoice totals (Holt,
   Prentice nib and St George's) and the S4 Beat 3 and Beat 5 figures; and the balance run for Souter
   Fri 24 PM (Nair) as it stands after Phase 25. S3, S4 Beats 3 and 5 and S5 must not move. The only
   deliberate changes are Riley's and Nair's figures (item 9), re-pinned there with the reason.
2. **Types** (`domain/types.ts`; DM-16):
   - Delete `PrepaymentDetail` and 20's interim `Booking.prepayment` of that type, and delete the
     "INTERIM office-set flag" comment.
   - Booking gains:
     - `estimatedDurationMin?: number`: the office's figure from the surgeon's rooms (US-06.2.5).
     - `prepayment?: BookingPrepayment`, where `BookingPrepayment = { kind: 'estimate' | 'deposit';
       amount: number; estimate?: PrepaymentEstimateSnapshot; setBy: { who: string; role: ActorRole;
       atISO: IsoDateTime } }`. `amount` is ex-GST, as today's deposit is. The snapshot holds the units
       breakdown, unit value and contingency setting used, so the Booking shows what was invoiced even
       after inputs move (US-06.2.2: "the amount is stored on the Booking").
   - "Prepayment required" is derived, never stored (this restores the 7th review B6 ruling that
     Phase 20 suspended). The domain model's `prepaymentInvoiceId` is also derived: an invoice already
     carries its Booking and `kind: 'prePayment'`. Record both readings in the Decisions log.
   - `Invoice` gains `settlesPrepaymentInvoiceIds?: InvoiceId[]` (set on a balance invoice) and
     `InvoiceLine` gains `prepaymentInvoiceId?` (set on each deduction line). US-06.4.1.
   - `DemoSettings` gains `prepayment: { contingencyUnits: number; alertWatchDays: number;
     alertUrgentDays: number }`, seeded `{ 2, 7, 2 }` (US-06.2.4 AC3).
   - If D5 is the default: delete `PrepaymentOverride` and `Card.prepaymentOverride` (item 10a).
   - `BillingCase` gains `creditDue?: number` (new; item 8's interim excess, ex-GST, on the
     prepayment invoice's case). Phase 36 re-points it to the ledger and Phase 41 turns it into a
     credit.
   - Actor: a new `ENGINE_ACTOR: Actor = { who: 'Billing engine', role: 'system', source: 'system' }`
     in `prepaymentActions.ts`, beside the existing `BILLING_RUN_ACTOR` pattern in `billingRun.ts`
     (nothing named `ENGINE_ACTOR` exists in July).
3. **Pure estimator** (`domain/billing/prepaymentEstimate.ts`, exported from the billing index, with
   `prepaymentEstimate.test.ts`; US-06.2.4):
   - `estimatePrepayment({ prepaidProcedures, estimatedDurationMin, contingencyUnits, unitValue })`.
     Each prepaid Procedure's base units come from calling 19's `resolveBaseUnits` directly (with 23's
     `contractBaseUnits` when set), never through `resolveBtm` or `feeFor`, which zero an additional
     Procedure's base. The estimate never reads the office override, the anaesthetist adjustment,
     recorded modifiers or actual times.
   - **Additional prepaid Procedure (a picked reading, provisional; log it).** Mirror what 23's engine
     will charge, so the estimate is close to the final:
     - a prepaid primary brings its resolved base units;
     - a prepaid additional Procedure whose Contract rule is `rvgDefault` brings 0 base units (23
       charges it time plus a modifier share only);
     - under any other rule (`secondCodePercent`, `addOnFee`, `notBillable`) it brings its standalone
       resolved base units, a prudent over-estimate the excess path (item 8) absorbs.
     Each line records `baseBasis: 'primary' | 'additionalRvgDefault' | 'standalone'` so the
     breakdown can say why.
   - It returns `{ kind: 'incomplete'; missing: ('estimatedDuration' | 'baseUnits')[] }` when a
     duration is missing, or a ranged code has no chosen base units. Otherwise it returns
     `{ kind: 'estimate'; baseUnits; timeUnits; contingencyUnits; totalUnits; unitValue; amount;
     lines }`:
     - `timeUnits = timeUnitsFromMinutes(estimatedDurationMin)`, one figure for the Booking;
     - `amount = roundToCents(totalUnits x unitValue)`, ex-GST, always at the anaesthetist's own unit
       value, never an AA rate;
     - `lines` gives one line per prepaid Procedure (its base units), with the time and contingency
       units on the first prepaid Procedure in Booking order (the primary when it is prepaid). That
       keeps `prePaidByProcedure` keyed per Procedure for the balance run.
   - Tests:
     - the AC: 10 base + 90 minutes gives 10 + 6 + 2 = 18 units x the unit value;
     - two anaesthetists with different unit values get identical units and different dollars;
     - the contingency count comes from the input, and 0 and 3 both work;
     - incomplete without a duration, and incomplete for a ranged code with no selection;
     - a Contract base-unit override is used when the resolver returns one;
     - 120 minutes gives 8 time units and 121 gives 9 (the OQ-50 boundary);
     - a prepaid additional Procedure on an `rvgDefault` Contract brings 0 base units; on a
       `secondCodePercent` Contract it brings its standalone base;
     - lines sum to the amount to the cent.
4. **Derivation and status** (pure helpers in `domain/billing/prepayment.ts`, wrapped by selectors in
   `selectors.ts`; US-06.2.1, US-06.3.2):
   - `prepaidProceduresFor(booking, procedures, prepaidSettings, masters)`: the non-cancelled Procedures
     whose RVG code is in 26's `expandPrepaidCodes(prepaidSettings, masters)`, directly or through a
     ticked group. Reuse it; do not re-expand groups here. The panel's "why" line uses 26's
     `prepaidReasonFor`. Every Procedure counts, not
     just the primary, and the Contract is never consulted (US-06.2.1 notes, OQ-25).
   - `bookingRequiresPrepayment(state, bookingId)`: true when that list is non-empty and the Booking
     is not cancelled. It replaces `cardRequiresPrepayment`; grep that no caller reads 20's flag.
   - Rework `prepaymentStatusFor` to return `{ status, amount?, kind?, invoicedTotal, receivedTotal,
     currentEstimate? }`, where status is one of:
     - `none`: not required and nothing invoiced, or the List is AUTHORISED or billed with no
       prepayment invoice (the balance run then bills it in full);
     - `amountNeeded`: required, no stored amount;
     - `toInvoice`: amount stored, no invoice (the D6 office branch, or a refused engine raise);
     - `unpaid`: invoiced, nothing received;
     - `partPaid`: received above zero and below the invoiced total (US-06.3.2);
     - `paid`: received covers the invoiced total, keyed on mirror money as
       `paidPrePaymentCaseForCard` is today, and summed across the Booking's prepayment invoices;
     - `notNeeded`: a prepayment invoice exists but the Booking no longer requires prepayment;
     - `overridden`: only if D5 keeps the gate.
   - `currentEstimate` is the live estimate when the stored kind is `estimate`. The UI can then show
     "Estimate now $X; invoiced $Y" after a change, and the difference settles on the balance
     invoice (US-06.4.1 notes: the top-up).
   - Status is derived on read, so a receipt re-checks it with no hook (DM-16: "re-checked after each
     receipt").
   - Tests for every status, part paid from a half payment, and two parties summed.
5. **Store actions** (`prepaymentActions.ts`, tests in a rewritten `prepayment.test.ts`):
   - **`setEstimatedDuration(api, actor, bookingId, minutes | null)`**:
     - office only (US-06.2.5 is Admin App);
     - refused on an AUTHORISED or billed List; minutes must be a whole number from 5 to 720;
     - audited `booking.estimatedDuration`;
     - runs the re-check (item 7) after commit.
   - **`setPrepaymentAmount(api, actor, bookingId, choice)`**, where choice is
     `{ kind: 'estimate' } | { kind: 'deposit'; amount }` (US-06.2.2). It replaces 20's
     `setBookingPrepayment`.
     - Rights: the anaesthetist on their own DRAFT List; the office on DRAFT and SUBMITTED; nobody on
       AUTHORISED or billed.
     - Refusals:
       - `notPrepayment`: "This booking does not need pre-payment.";
       - `estimateIncomplete`: names what is missing. To the office: "Enter the estimated duration
         first." To the anaesthetist, who cannot enter it: "The office records the estimated duration
         from the surgeon's rooms. Set a deposit, or ask the office.";
       - `depositInvalid`: the deposit must be above zero;
       - `prepaymentInvoiced`: "A pre-payment invoice has been raised. Any difference is settled on
         the balance invoice." Changing the amount after invoicing is refused, because voids and
         credits are Phases 39 and 41.
     - Stores `BookingPrepayment` with the estimate snapshot, audited `booking.prepayment`.
     - D6 default: after commit it calls the raise below as `ENGINE_ACTOR` (`{ who: 'Billing engine',
       role: 'system', source: 'system' }`). The office branch stops at the stored amount.
   - **Rework `raisePreProcedureInvoice`** into `raisePrepaymentInvoice(api, actor, bookingId)`:
     - allowed actors: office or the engine;
     - refused unless the status is `toInvoice` (or `amountNeeded` resolved in the same call);
     - keeps today's refusals for cancelled, authorised or billed, and already raised;
     - the office button remains only for `toInvoice`;
     - Xero handoff exactly as today (`handoffCasesForCard`; FT-06.3, unchanged).
   - **`buildPrePaymentInvoiceForCard`** reads the stored `BookingPrepayment`, not a category:
     - An `estimate` raises the snapshot's lines, described "Pre-payment estimate, {n} units" with
       `units` set.
     - A `deposit` raises one "Pre-payment deposit" line on the first prepaid Procedure.
     - Grouping is by 21's effective billable party of each prepaid Procedure, patient layout.
     - GST follows 22's rule for that Procedure's Contract.
     - Update `prePaymentInvoice.test.ts`, keeping the $800 to 800/120/920 deposit test and the guardian
       addressee test.
   - Remove 20's validator prepayment checks ("Enter the deposit amount for a split pre-payment" and
     "flag set but no procedure bills the patient"). Completion never validates prepayment, except
     through D5's kept gate or 21's `prepaidAmount` required input. That input is now satisfied when
     the Booking does not require prepayment or has a stored amount. Test it.
6. **The date-driven alert** (pure `prepaymentAlertFor(status, procedureDateISO, todayISO, settings)`
   in `domain/billing/prepayment.ts`, and the selector `prepaymentsDue(state)`; US-06.3.2 AC):
   - The alert applies only while the status is outstanding (`amountNeeded`, `toInvoice`, `unpaid`,
     `partPaid`) and the List is not AUTHORISED.
     - `daysToGo = daysBetween(todayISO, listDateISO)`.
     - Level `watch` when `daysToGo <= alertWatchDays`.
     - Level `urgent` when `daysToGo <= alertUrgentDays`, including the day itself and a passed date
       on a List not yet authorised.
     - Otherwise `none`.
   - `prepaymentsDue(state)` lists every outstanding prepaid Booking with a level above `none`,
     across all dates (future ones, plus passed dates on Lists not yet AUTHORISED), ordered by urgency
     then date. Read the clock from state,
     never `new Date()`.
   - Tests: the thresholds at 8, 7, 3, 2, 0 and -1 days; `paid` and `notNeeded` never alert; settings
     change the windows; the seeded Riley Booking reads `watch` on Tue 21 Jul and `urgent` after
     `advanceClockToDate('2026-07-22')`.
7. **The re-check** (US-06.3.5):
   - A pure `prepaymentRecheck(input)` in `domain/billing/prepayment.ts` returns one of:
     - `clear`: not required, amount stored, no invoice;
     - `reestimate`: required, kind `estimate`, no invoice, and the estimate amount differs;
     - `none` otherwise, which covers deposits, any invoiced Booking and incomplete estimates.
   - The store wrapper `recheckPrepayment(api, bookingId, cause)` in `prepaymentActions.ts` applies it
     as `ENGINE_ACTOR` with audited `booking.prepaymentCleared` or `booking.prepaymentReestimated`,
     both carrying the cause.
   - Call it after commit from:
     - `addProcedure`, `removeProcedure` and `editProcedure` (RVG code and chosen base units);
     - `setProcedureContract` (the Contract may override base units);
     - `setEstimatedDuration`, `cancelCard`, `reassignCard` and `reassignList` (a different
       anaesthetist means a different prepaid set and unit value);
     - `editAnaesthetist` on a unit value change, and 26's `setPrepaidSettings` (for that
       anaesthetist's Bookings on Lists not yet AUTHORISED);
     - 23's "Make primary" (it moves base units, so item 3's reading changes the estimate);
     - the settings edit (item 16).
   - An invoiced Booking is never touched. Its status reads `notNeeded`, or it shows the estimate
     drift. The replacement-anaesthetist prepayment and the refund are Phase 41.
   - Tests: removing the prepaid Procedure before invoicing clears the amount; changing the duration
     re-estimates; the deposit is untouched; after invoicing nothing is rewritten and the status reads
     `notNeeded`; reassigning to an anaesthetist without the code clears it.
8. **The balance invoice** (`invoiceBuild.ts`, `billingRun.ts`; US-06.4.1, FT-06.4):
   - `prePaidByProcedure` also carries the prepayment invoice id.
   - The deduction line reads "Less pre-payment {invoiceNumber} already invoiced" with
     `prepaymentInvoiceId` set. The balance invoice's `settlesPrepaymentInvoiceIds` lists the
     prepayment invoices it deducts. It attaches to the Procedure as today, and is not an additional
     invoice.
   - The run keeps pricing from 25's lock record. The deduction is applied after the locked price, and
     the prepaid amount is not written into the lock.
   - **Interim for prepaid above final.** The estimate now adds contingency units that the final
     usually lacks, so the negative case becomes common. A counterparty group whose subtotal is
     negative only because of prepayment deduction lines no longer fails the Booking. It raises no
     invoice and returns `prepaymentExcess: { counterparty, amount, prepaymentInvoiceIds }[]` on the
     build result. No balance case exists, so the run records it as `creditDue` on the prepayment
     invoice's `BillingCase` (item 2), audited
     `booking.prepaymentExcess`. It is shown as "Pre-paid more than the final fee: $X to credit" on the
     Booking and in the billing monitor, labelled "Credit handled in a later release". Phase 41 turns
     it into a credit (US-06.4.2, OQ-03). A negative group with no prepayment line still fails with
     `negativeTotal`, as today.
   - Tests:
     - an estimate below final gives a positive balance naming the prepayment invoice;
     - an estimate equal to final raises no invoice;
     - an estimate above final records the excess and raises no invoice;
     - a deposit gives the balance;
     - the payer-changed guard still fails for review;
     - a negative price override still fails;
     - the final price never reads `estimatedDurationMin` or the contingency setting (US-06.2.5).
9. **Seed** (`seed/cards.ts`, `billing.ts`, `index.ts`; bump `PERSIST_VERSION` by one):
   - **Prepaid sets.** Confirm 26 seeded Souter's set to include 41800 Rhinoplasty (or a cosmetic
     group holding it) and not 41789 Septoplasty; add it if not. Add `seed.test` assertions:
     - the Bookings that derive prepayment on Lists not yet AUTHORISED are exactly Riley and Nair;
     - no billed or history Booking reads outstanding.
     If the filler hits others, narrow 26's seeded sets. Never change the filler's `rng()` draw order.
   - **Riley** (Souter Fri 24 AM, `SEED_MARKERS.prepayment`):
     - The Procedure gains `rvgBaseCode: '41800'`.
     - It drops the flat $1,200 fixed line and 20's `{split, 800}` flag, so it prices by RVG on its
       RVG Default Post-paid Contract.
     - Seeded with no estimated duration and no amount: status `amountNeeded`, alert `watch` (3 days
       out on Tue 21 Jul). S4 Beat 1 sets it live.
     - Pin the estimate at 90 minutes, (resolved base + 6 + 2) x Souter's unit value. At July values
       that is 13 x $26.50 = $344.50 ex-GST; use whatever 19 and 26 now resolve.
   - **Nair** (Souter Fri 24 PM, `SEED_MARKERS.prepaymentPaid`):
     - The rhinoplasty is the only prepaid Procedure; the septoplasty stays on Forte's default.
     - Seed `estimatedDurationMin: 60` and a stored `estimate`, computed by the estimator at seed time.
       Under item 3's reading the rhinoplasty is the additional Procedure on an `rvgDefault` Contract,
       so the estimate is 0 base + 4 time + 2 contingency = 6 units (6 x $26.50 = $159.00 ex-GST at
       July values).
     - `buildSeedBillingSlice` builds the paid INV0001/BC0001 from that stored amount.
     - Set the rhinoplasty's recorded times so the final exceeds the estimate by a small top-up
       (surgery ran long): for example 14:00 to 15:45 (105 minutes, 7 time units), a one-unit top-up.
       Keep the septoplasty's times so the hospital invoice does not move. Authorising Fri 24 PM then
       shows a balance invoice naming INV0001. Use whatever 23's engine actually charges and re-pin.
   - **Leave the excess path unseeded.** No seeded Booking may have prepaid above final; the manual
     test covers the excess path. A `seed.test` assertion pins every seeded prepaid Booking's balance
     at zero or above.
   - Update `seedBilling.test.ts`, `demoScenarios.test.ts` and the markers' comments. Re-pin item 1's
     Riley and Nair figures with the reason.
10. **Decision D5.**
    - **(a) Default, remove the gate** (RV-09):
      - delete the `prepaymentUnpaid` blocker in `completionBlockersFor` and its copy;
      - delete `overridePrepaymentGate`, `PrepaymentOverrideSheet` and its export, the `overridden`
        status, the review flag "Pre-payment gate overridden", the day-grid `overridden` variant, and
        the audit labels `card.prepaymentOverride` and `prepaymentOverride`;
      - rewrite the `prepayment.test.ts` gate tests as "unpaid prepayment does not block completion,
        and the alert shows";
      - check that `paymentActions.test`'s "paying clears the gate" becomes "paying reads paid";
      - gate: `grep -rnE "prepaymentOverride|overridePrepaymentGate|PrepaymentOverrideSheet|prepaymentUnpaid|Override gate" aa-prototype/src`
        returns nothing.
    - **(b) If the owner keeps the gate:**
      - `completionBlockersFor` blocks on the outstanding statuses (`amountNeeded`, `toInvoice`,
        `unpaid`, `partPaid`), with copy naming the status and the amount received;
      - `notNeeded` and `paid` never block;
      - the override stays, refused when `bookingRequiresPrepayment` is false;
      - tests for each status, including part paid still blocking.
11. **Session 1 exit:**
    - Fix the listed tests.
    - Edit the UI only as far as compiling needs: the banner reads the new status; the override
      button and sheet are gone under 10a.
    - Run `npm run build`, `npm run build:pwa` and `npx vitest run`, all green; item 1 passes.
    - Write a short "session 1 done" note in the PROGRESS entry.

**Session 2: surfaces, triggers, demo.**

12. **Booking prepayment panel** (shared `CardDetailBody` banner rebuilt as a `PrepaymentPanel`
    component in `src/shared/card/`, all three apps through `useSurface()`; US-06.2.2, US-06.2.5,
    US-06.3.2):
    - Title by status, as a semantic tint:
      - "Pre-payment needed · amount not set";
      - "Pre-payment to invoice";
      - "Pre-payment unpaid";
      - "Pre-payment part paid · $x of $y received";
      - "Pre-payment received";
      - "Pre-payment no longer needed".
      Amounts are in mono with tabular-nums.
    - Body:
      - which Procedures matched ("Rhinoplasty is on Dr Souter's pre-paid list");
      - the stored amount with its kind ("Estimate" or "Deposit");
      - the invoice number with a link to the invoice document (office);
      - the alert line when the level is above none ("Procedure in 2 days");
      - under D5 default, the anaesthetist's line "Unpaid pre-payment. Follow up with the office, or
        cancel the booking if it will not be paid."
    - An "Estimated duration" row: the office can edit it (a minutes stepper in 15-minute steps,
      typed entry allowed) and the anaesthetist sees it read-only ("From the surgeon's rooms").
    - An estimate breakdown (collapsed by default on mobile): base, time, contingency (with the OQ-38
      label), total units, x unit value, amount. The OQ-50 caveat shows over 120 minutes. After
      invoicing, the snapshot is shown, plus "Estimate now $X" when it drifts.
    - A teal "Set pre-payment" action for whoever holds the rights. It opens `PrepaymentAmountSheet`
      (replacing 20's `PrepaymentFlagSheet`), a bottom sheet on mobile and a Dialog on web and admin:
      - a Segmented control, Estimate or Deposit;
      - the estimate total with its breakdown, or a currency input for the deposit;
      - a note that the amount is an estimate and the final fee may be higher or lower (US-06.2.3);
      - Save calls `setPrepaymentAmount`.
      - For the anaesthetist with no estimated duration yet, Estimate is disabled with item 5's
        anaesthetist copy; Deposit stays available.
      Under the D6 default the confirmation line says the invoice was raised and names it.
    - The office sees "Raise pre-payment invoice" only for `toInvoice`.
    - Delete the "RFP open question" and "discovery point" copy (RV-17).
    - Keep `data-shot="card-prepayment"` and add `data-shot="prepayment-estimate"`.
13. **Admin alert surfaces** (US-06.3.2):
    - **Right rail:** a new "Pre-payments due" card in `RightRail.tsx`, above "Awaiting review", fed
      by `prepaymentsDue` through `AdminOutletContext`.
      - Rows show patient, anaesthetist surname (`drSurname`), procedure date, status and the level
        chip ("In 3 days" warning, "In 2 days" error).
      - Clicking a row opens the admin Booking detail.
      - Empty state: "No pre-payments outstanding."
      - `data-shot="rail-prepayments-due"`.
    - **Day grid:** `prepaymentFlags` in `AdminApp.tsx` becomes a map to the alert level. The `$`
      corner uses the warning tint for `watch` or no level, and the error tint for `urgent`. The
      tooltip names the status and days to go. The "Pre-payment flagged" filter is unchanged.
14. **Review flags** (`reviewFlags.ts`, `ReviewScreen.tsx`, tests):
    - "Pre-payment outstanding" covers `amountNeeded`, `toInvoice` and `unpaid`.
    - "Pre-payment part paid, $x of $y" is new.
    - "Pre-payment raised but no longer needed" is a warning for `notNeeded`.
    - "Pre-paid more than the final fee" appears when an excess is recorded.
    - The overridden flag goes under D5 default.
15. **Invoice wording** (wherever 22 left the patient-layout note in `InvoiceDocument.tsx`; US-06.2.3,
    US-06.4.1):
    - Estimate pre-payment: "This pre-procedure invoice is an estimate of the anaesthetic fee. The
      final fee is calculated after the procedure and may be higher or lower; any balance is invoiced
      and any overpayment is credited."
    - Deposit: "the agreed deposit of $X, payable before the procedure; the balance is invoiced after
      the procedure."
    - Balance invoice: "Balance after pre-payment INV0012", with the deduction line naming it.
    - Remove the "discovery point for AA" sentences. Letter templates are Phase 41; do not add them.
16. **Prepayment settings** (`MasterData.tsx`, a "Pre-payment" section; a new
    `editPrepaymentSettings(api, actor, patch)` in `demoSettingsActions.ts` or `mastersActions.ts`):
    - Office only. Fields: contingency units (0 to 6), watch window days and urgent window days
      (urgent no more than watch).
    - Audited `settings.prepayment`, then the re-check on un-invoiced estimates.
    - The contingency row carries the OQ-38 label (US-06.2.4 AC3).
    - Add audit labels: `booking.estimatedDuration` "Estimated duration recorded",
      `booking.prepayment` "Pre-payment amount set", `booking.prepaymentCleared` "Pre-payment no longer
      required", `booking.prepaymentReestimated` "Pre-payment estimate updated",
      `booking.prepaymentExcess` "Pre-paid more than the final fee", `settings.prepayment` "Pre-payment
      settings changed". Give fields `estimatedDurationMin` and `prepayment` narrative formatters.
      Drop the `prepaymentDetail` formatter and its test.
17. **Demo triggers** (the registry in `src/shared/demoTriggers/registry.ts`; bodies in `src/shared`
    or `src/store`, so `pwaPurity` holds; the office stand-in body goes beside Phase 14's
    `authoriseAsSimulatedOffice` in `src/store/officeStandIn.ts`). See "Demo triggers" below. Add registry tests:
    - visibility per route;
    - disabled reasons;
    - the clock jump lands on the date two days before and never rewinds;
    - the stand-in raises exactly one invoice.
    Never add anything to the Control Panel page. Update the Control Panel S4 scenario text
    (`DemoControlPanel.tsx` about 415 to 421: the `blurb` "Pre-payment gate" and the step (1)
    message "override the blocked pre-payment in Admin") to the new beat.
18. **Shots, recipes and the demo guide:**
    - Update `visual/admin-phase09.spec.ts` and `admin-phase08.spec.ts` for the new panel, rail card
      and day-grid tones.
    - Add a mobile shot of the part-paid panel and a PWA shot of the stand-in.
    - Run `node requirements-board/scripts/capture.ts --only US-06.2.1,US-06.2.2,US-06.2.3,US-06.3.1,US-06.3.2,US-06.3.4,US-06.3.5,US-06.4.1 --dry`
      and record the recipes that break (US-06.3.2's "gate cleared" and US-06.3.5's category captions
      will). Do not edit catalogue files.
    - Patch the demo guide (below).

## Demo triggers

Harness bar (framed build):

| Label | Screen | Surface | Effect |
|---|---|---|---|
| Move to 2 days before procedure | Admin · Day (`/admin/day/:dateISO`) and Admin · Booking detail (`/admin/day/:dateISO/bookings/:bookingId`) | bar | On the Booking detail it acts on the Booking in the URL. On the Day view, `choices` lists the outstanding prepaid Bookings from `prepaymentsDue`, earliest first. Calls `advanceClockToDate(api, procedureDate - 2 days)`: the rail row and the `$` corner turn urgent. Disabled with "No outstanding pre-payments" or "Already 2 days or less before". The clock only moves forward, and Reset restores it |
| Payment received · half / full (re-pointed) | Admin · Booking detail, plus the existing Admin · Invoice document and Xero sim pair routes | bar | Phase 14's re-homed webhook entries gain the Booking detail route. There, `choices` are that Booking's open prepayment ACCRECs. Half shows "Part paid · $x of $y received" on the panel, the rail and the review flag; full shows "Pre-payment received". Same body and idempotency keys as today |

PWA equivalents (the mobile Booking waits on the office and on a patient's payment):

| Label | Screen | Surface | Effect |
|---|---|---|---|
| Office sets the estimate and raises the prepayment invoice | Mobile · Booking (`/mobile/lists/:listId/bookings/:bookingId`) | PWA only, badge office stand-in | When the Booking requires prepayment and the status is `amountNeeded`: as the office stand-in, records a 90-minute estimated duration if none is set (a named seed constant, "from the surgeon's rooms"). Then `setPrepaymentAmount({kind:'estimate'})`. Under the D6 default, the engine raises the invoice; on the office branch, the stand-in also calls `raisePrepaymentInvoice`. Message names the estimate and the invoice number. Disabled with "Amount already set" or "This booking does not need pre-payment" |
| Patient pays half / full of the pre-payment | Mobile · Booking | PWA only | Phase 14's `pwa-payment-half` / `pwa-payment-full` bodies (shared function), registered on the mobile Booking route with `choices` limited to that Booking's open prepayment ACCRECs. Disabled with "No pre-payment invoice yet" |
| Move to 2 days before procedure | Mobile · Booking | PWA only | The same body as the bar entry, acting on the Booking in the URL, so the handset shows the urgent line |

## Out of scope

- Prepayment letter templates and reminders (US-06.3.6); the credit for an overpaid prepayment
  (US-06.4.2, OQ-03), beyond item 8's interim flag; the trust account, refund on cancellation and a
  replacement anaesthetist's prepayment (FT-06.5, US-06.5.1 to US-06.5.3). All Phase 41.
- Voiding or crediting a raised prepayment invoice that is no longer needed or whose amount changed
  (Phases 39 and 41). This phase flags it and lets the balance run settle the difference.
- The prepaid settings screens and admin edit-on-behalf (FT-06.1, US-06.1.1, US-06.1.2): Phase 26.
- The ledger legs behind prepayment status (FT-06.3 via FT-08.3): Phase 36 re-points
  `prepaymentStatusFor` from `BillingCase` money to the ledger.
- Estimated duration arriving on a hospital row or a surgeon PDF (US-02.2.1): Phases 33 and 34 may
  carry it into `setEstimatedDuration`.
- The unpaid-balance alert at booking for a patient's earlier invoices (Phase 40).

## Manual test checklist

- [ ] Reset. Admin Day, Tue 21 Jul: the "Pre-payments due" card lists Annette Riley (Souter, Fri
      24 Jul, "Amount not set", "In 3 days", warning tint). The Fri 24 AM block's `$` corner is amber.
- [ ] Admin Booking detail for Riley: the panel says Rhinoplasty is on Dr Souter's pre-paid list.
      Enter 90 minutes. The breakdown reads base + 6 time + 2 contingency (OQ-38 label) x $26.50 (or
      the current unit value), and matches item 9's pinned figure.
- [ ] "Set pre-payment", Estimate, Save. Under D6 default the invoice is raised at once, the status
      reads "Pre-payment unpaid", the audit shows `booking.prepayment` then `invoice.raisePrePayment`
      by "Billing engine", and the Xero sim shows the ACCREC and ACCPAY pair.
- [ ] Try Deposit on another fresh prepaid Booking (add 41800 to a Souter DRAFT Booking): a deposit
      of $800 invoices 800 / 120 / 920. Changing it after invoicing is refused with the balance-invoice
      message.
- [ ] Nair's admin Booking detail: the breakdown shows the rhinoplasty as the additional Procedure
      with 0 base units (item 3's reading), and the stored estimate matches item 9's pinned figure.
      On mobile, as Dr Souter on a fresh prepaid DRAFT Booking with no duration, Estimate is disabled
      with the office copy and a deposit can be saved.
- [ ] "Payment received · half" from Riley's Booking detail: panel, rail row and review flag read
      "Part paid · $x of $y received". Replay is idempotent.
- [ ] "Move to 2 days before procedure": the clock reads Wed 22 Jul 08:00, Riley's rail chip and the
      `$` corner turn error-toned ("In 2 days"), and the mobile Booking shows the urgent line.
- [ ] D5 default: on mobile, Riley's Booking completes (after capture) with the prepayment still part
      paid, with no gate and no "Override gate" anywhere. The item 10a grep is empty.
      (If D5 keeps the gate: completion is refused while part paid, and the override lifts it.)
- [ ] Re-check: on a DRAFT prepaid Booking with an un-invoiced estimate, remove the rhinoplasty. The
      amount clears automatically, audited `booking.prepaymentCleared`. Change the duration on another
      and the estimate updates. On an invoiced Booking, removing the prepaid Procedure shows "Pre-payment
      no longer needed" and a review flag, and nothing is rewritten.
- [ ] Master data, Pre-payment: set contingency to 3. An un-invoiced estimate re-estimates and the
      invoiced one does not.
- [ ] Balance: submit and authorise Souter Fri 24 PM (Nair). The balance invoice carries "Less
      pre-payment INV0001 already invoiced" and "Balance after pre-payment INV0001". The top-up equals
      item 9's pinned figure.
- [ ] Excess: on a test Booking, set a deposit above the final fee, then complete, submit and
      authorise. No negative invoice is raised; the Booking and billing monitor show "Pre-paid more
      than the final fee: $X to credit". Sibling Bookings bill.
- [ ] S3 and S4 Beats 3 and 5 figures are unchanged (item 1).
- [ ] Invoice documents: the estimate wording says the final may be higher or lower; no "discovery
      point" or "RFP open question" copy remains in the prepayment surfaces.
- [ ] PWA build: on Riley's mobile Booking, the demo-actions sheet offers "Office sets the estimate
      and raises the prepayment invoice" (office stand-in badge), then "Patient pays half" (part
      paid), then "Move to 2 days before procedure". The panel is a bottom sheet with teal actions
      and no crimson.
- [ ] No en or em dashes in new copy; amounts in mono with tabular-nums.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots` are all green.

## Demo guide updates

Patch these in the same session, in `docs/demo-guide/` and the matching sections of
`master-demo-guide.html` (lines about 527, 732, 913 to 914, 938 and 1102 in July):

- `03-demo-script.md` **S4 Beat 1**, renamed "Pre-payment from the prepaid list":
  - **Click:**
    - Admin Day, Tue 21 Jul: point at the "Pre-payments due" card.
    - Open Annette Riley.
    - Enter the estimated duration of 90 minutes.
    - Set pre-payment, Estimate, Save. The invoice is raised.
    - Payment received · half: part paid.
    - Mobile, Souter Fri 24 AM, Riley: the anaesthetist sees part paid.
  - **Say:** "Rhinoplasty is on Dr Souter's own pre-paid list, so the booking needs pre-payment. The
    system estimates it from base units, the surgeon's estimated time and two contingency units at
    her own rate, and invoices it at setup. The office tracks it as unpaid, part paid or paid."
    Under D5 default add: "Nothing blocks the anaesthetist. The alert is the control." Under the kept
    gate, keep the block-and-override narration, fired from the derived requirement.
  - **Expected:** the estimate, the invoice and pair, part paid on all three surfaces.
- **S4 new closing Beat 6, "The date approaches"** ("Move to 2 days before procedure" on Admin Day).
  It sits last so Beats 2 to 5 run on the seeded date: the clock jump advances the day, which runs the
  reconciliation poll and moves today's Lists. Check whether Beat 2's post-op addendum still finds
  Sharma's DRAFT today List after a jump; if it does not, keep the jump last and say so in Stage it.
- S4 "Discovery points": replace "the pre-payment gate and override placement" with "the two
  contingency units (OQ-38) and the time rule after two hours (OQ-50)", plus under D5 default "whether
  an unpaid pre-payment should ever block".
- `04-presenter-cheat-sheet.md` section 8 "Pre-payment": rewritten. The trigger is the anaesthetist's
  prepaid list, the estimate formula, invoicing at setup (D6) and the escalating alert. The gate text
  goes under D5 default.
- `02-workflows-and-handoffs.md` "Pre-payment" case (about line 424): the same rewrite.
- `docs/demo-guide/README.md` status row (line 95) and the master guide's status table: "Pre-payment
  from the prepaid list, estimate and alert". Remove "gate" under D5 default.
- The Control Panel S4 scenario text (item 17).
- **Milestone:** end with a consistency read of `master-demo-guide.html` against the edited Markdown:
  S4 beat numbering, figures and trigger labels agree.

## Adversarial review (after build)

After the manual test checklist and the four commands are green, and before writing the PROGRESS
entry, run the standard adversarial review-and-fix pass (PROGRESS convention 18). Fan out
independent Opus review subagents: quality, bugs/correctness and plan adherence, plus a fourth,
money lens for this money phase. Then this session verifies every finding against the catalogue, this
plan and the code, fixes the confirmed ones, re-greens, and records the pass. Do not re-raise
anything settled in the Decisions log except the rulings this phase explicitly supersedes.

**Steer this phase's reviewers at:**

- **Derivation only.** Nothing reads a payment category, 20's interim flag or the Contract to decide
  whether prepayment is required. Every Procedure on the Booking counts, groups resolve through 19's
  RVG groups, and cancelled Procedures and Bookings never trigger it.
- **Estimator maths.**
  - The AC figure is exact.
  - The unit value is the anaesthetist's own, never an AA rate.
  - Contingency comes from settings, never a literal 2.
  - Time uses `timeUnitsFromMinutes`.
  - Base units come from `resolveBaseUnits` per item 3's reading (a prepaid additional Procedure on
    `rvgDefault` brings none), so a seeded estimate never exceeds its final.
  - Lines sum to the amount to the cent.
  - The deposit and estimate are both ex-GST, and GST follows 22's rule.
  - Nothing in the estimator reads actual times, modifiers, overrides or adjustments.
- **Money conservation.**
  - Prepaid plus balance equals the final fee (GST included) whenever the balance is zero or above.
  - The excess path raises no negative invoice and fails no sibling.
  - A negative group without a prepayment line still fails.
  - Each deduction line and balance invoice names the right prepayment invoice.
  - The locked price (25) is never altered by the deduction.
- **Status and alert.**
  - Part paid is derived from mirror money summed across invoices.
  - `paid` and `notNeeded` never alert.
  - The alert reads the demo clock only (no `Date.now()` or `new Date()`) and stops once the List is
    AUTHORISED.
  - `prepaymentsDue` spans dates, not just the selected day.
- **Re-check.** Every listed action calls it after commit, including reassign, unit value and prepaid
  set edits. It never rewrites an invoiced Booking, never touches a deposit amount, and audits as the
  engine with the cause.
- **Rights and audit.**
  - Estimated duration is office only.
  - The amount can be set by the anaesthetist on their own DRAFT List and by the office on DRAFT and
    SUBMITTED, never on AUTHORISED, and never after invoicing.
  - Under D6 default, exactly one invoice is raised per set, by the engine actor.
  - Every new action carries before and after.
- **D5 honoured as answered.** Under the default, the item 10a grep is empty and no copy anywhere
  (app, shots, demo guide, Control Panel text) still mentions a gate or override. Under the kept gate,
  it fires from the derived statuses, and part paid blocks.
- **Triggers and PWA.** Each entry shows only on its routes, the clock jump never rewinds, the
  stand-in is badged and raises one invoice, and `pwaPurity` still passes. The seed determinism and the
  filler `rng()` order are unchanged, and `PERSIST_VERSION` is bumped.

## PROGRESS.md updates

- Status row for catch-up Phase 27, and a phase entry covering:
  - the drift-check result and the D5 and D6 answers or defaults;
  - the OQ-38 and OQ-50 interims;
  - what 19 to 26 were found to provide;
  - the session 1 and session 2 split and the adversarial pass;
  - the tests added (estimator, status, alert, re-check, balance link, excess, parity);
  - `PERSIST_VERSION` old to new;
  - Riley's and Nair's re-pinned figures;
  - the broken capture recipes;
  - the stale "payment category" wording in US-06.3.5 for the owner.
- Decisions log:
  - **Superseded:**
    - Under D5 default: the 2nd external review ruling that pre-payment is a real completion gate
      lifted by an audited override (2026-07-22, reaffirmed in the 3rd to 5th and 7th reviews), and
      Phase 09 build decision (2)'s gate reading.
    - Phase 09's open-question reading (1) (the office raises the pre-invoice by hand before the
      procedure), replaced by D6.
    - Phase 09 build decision (4): split balance = fee - deposit and full = no balance, and Riley as a
      flat $1,200 fee. These become an estimate or deposit, a top-up balance, or a recorded excess.
    - Phase 20's interim office-set Booking flag, closed. The 7th review B6 "derived, never stored"
      ruling is restored.
  - **New provisional readings:**
    - The estimate covers only the prepaid Procedures, with time and contingency on the first of them.
    - A prepaid additional Procedure is estimated as 23 will charge it (no base units under
      `rvgDefault`; standalone base under the other rules).
    - Estimated duration is one figure per Booking.
    - The contingency is an estimate-only setting (OQ-38).
    - The alert windows are 7 and 2 days, as a setting.
    - The status set and the rule that an AUTHORISED List with no prepayment invoice reads `none`.
    - An invoiced amount is never re-estimated; the difference settles on the balance.
    - The prepaid-above-final excess is an interim flag until Phase 41's credit.
    - Under D6 default, the engine raise is a named exception to FT-08.1.
