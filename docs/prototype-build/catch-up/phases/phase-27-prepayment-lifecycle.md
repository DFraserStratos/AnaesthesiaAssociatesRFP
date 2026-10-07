# Phase 27 · Prepayment lifecycle

**Requirements covered:**
[EP-06](../../../../requirements-board/requirements/stories/EP-06.md) (Verify; the trigger, estimate, generation, approval, tracking, re-check and prepaid-excess half. Letters, the balance invoice's citation of the prepayment, the overpaid case's surfaces, the trust hold, refunds and the payable half's update on a move are Phase 41),
[FT-06.2](../../../../requirements-board/requirements/stories/FT-06.2.md) (Confirmed),
[US-06.2.1](../../../../requirements-board/requirements/stories/US-06.2.1.md) (Confirmed; a person paying for the patient, never an organisation, OQ-73 answered),
[US-06.2.2](../../../../requirements-board/requirements/stories/US-06.2.2.md) (Verify; always the full estimate, set by the calculation and seen by office and anaesthetist, no deposit; whether a prepayment is ever partial is OQ-76, built all or nothing),
[US-06.2.3](../../../../requirements-board/requirements/stories/US-06.2.3.md) (Confirmed; re-graded Contradicts because a final below the estimate fails the Booking today. This phase builds the estimate wording on the invoice and the no-failure path for a prepaid amount above the final; the letter templates are Phase 41),
[US-06.2.4](../../../../requirements-board/requirements/stories/US-06.2.4.md) (Proposed; base units from the procedure's default RVG Contract unless another applies, OQ-62; part intervals rounded up, OQ-75 answered),
[US-06.2.5](../../../../requirements-board/requirements/stories/US-06.2.5.md) (Proposed; entered by the office from the surgeon's rooms by email or phone; the surgeon PDF route, US-02.2.1, is Future Work),
[US-06.3.1](../../../../requirements-board/requirements/stories/US-06.3.1.md) (Verify; generated at setup with its pair, OQ-80's recommendation, held for admin approval, not invoiced again at submit; the letter is Phase 41),
[US-06.3.2](../../../../requirements-board/requirements/stories/US-06.3.2.md) (Confirmed; no block, a warning in both apps that strengthens as the date nears),
[US-06.3.5](../../../../requirements-board/requirements/stories/US-06.3.5.md) (Verify; re-check on change and on move; OQ-70 answered: a move keeps the agreed amount, and the payable half's update is Phase 41's),
[FT-08.1](../../../../requirements-board/requirements/stories/FT-08.1.md) (Proposed; its one named exception, the prepayment invoice at setup);
[DM-20](../analysis/domain-model-delta.md#dm-20) (prepayment lifecycle, except the letter-template
master, the trust hold, the balance invoice's citation and the overpaid settlement surfaces);
[DM-40](../analysis/domain-model-delta.md#dm-40) (estimated duration per Procedure);
[RV-09](../analysis/reverse-check.md) (prepayment as a patient category and a manual raise; the
completion gate itself went in Phase 15a).
**Depends on:** Phase 15a (session 1, built: the pure warning routine in `src/domain/warnings`,
`WARNING_RULES`, the `prepaymentUnpaid` rule with `PREPAYMENT_REQUIRED_TEXT` and
`PREPAYMENT_UNPAID_TEXT`, the `appSettings` record and its backfill, `warningClearances`, the
`store/warnings.ts` selectors and the audited `clearWarning`, the completion gate and its override
gone; session 2: the to-do list, the triangle, the warning visible on opening a Booking, no confirm
step at submit, `WARNING_SAMPLES`), Phase 25 (the balance run prices only from the AUTHORISED lock)
and Phase 26 (the anaesthetist's prepaid set of RVG codes and groups, `expandPrepaidCodes` /
`prepaidReasonFor` in `domain/billing/prepaidSet.ts`, `setPrepaidSettings`, and the profile's unit
value). Through them: 19's base-unit resolver (`resolveBaseUnits` in `domain/billing/baseUnits.ts`)
with 19a filling its `contractBaseUnits` slot from the procedure's default RVG Contract or a Contract
base-unit override, 19a's RVG time tiers held as data, RVG groups, 20's interim office-set prepayment
flag (replaced here), 21's billable party (`billablePartyForProcedure`) and `prepaidAmount` required
input, 22's invoice layout, GST rule, `materialiseInvoices` and `InvoiceDelivery`, 23's Booking-level
engine (time on every Procedure, `rvgDefault` for an additional Procedure), 15's Booking vocabulary,
15b's removal of Copy, and 14's trigger registry and office stand-in.
**Estimated:** 2 sessions. Session 1: work items 1 to 10 (figures pinned, model, estimator,
derivation and status, the engine's prepayment sync, approve and send, estimated duration and the
setting, the warning escalation, the balance run and the prepaid excess, seed), ending green with the
UI edited only as far as it must compile. Session 2: items 11 to 16 (Booking panel, the approval
surfaces, invoice wording and the review chip, settings and audit labels, triggers, shots and the demo guide). This is a full two
sessions. If session 1 overruns, items 9 and 10 open session 2; cut nothing, and never skip the demo
guide or the adversarial pass.

## Goal

Prepayment stops being something a person picks. A Booking needs prepayment when any of its
Procedures carries an RVG code in the anaesthetist's prepaid set (Phase 26), checked across the whole
Booking and never from the Contract, and only where that Procedure's billable party is a person
paying for the patient (the patient, or for example a guardian), never an organisation such as an
insurer or hospital (owner decision D23, OQ-73 answered: "prepayments are always patient-direct").
Phase 20's interim office-set flag goes.

The amount is always the full estimate; there is no deposit or partial amount (US-06.2.2; whether a
prepayment is ever partial is OQ-76, open, built all or nothing). A pure estimator works it out: base
units from the procedure's default RVG Contract unless another Contract or a Contract base-unit
override applies (OQ-62, US-04.4.2: 19's resolver with 19a's Contract lookup), time units from each
prepaid Procedure's estimated duration (recorded by the office from the surgeon's rooms, DM-40)
through the RVG tiers with every part interval rounded up (D25, OQ-75 answered), plus contingency
modifier units held as a setting (OQ-38), all at the anaesthetist's own unit value. The estimate is
stored on the Booking with its breakdown, and the prepayment invoice is worded as an estimate that
may come out higher or lower (US-06.2.3).

Per owner decision D6 (OQ-58, answered), the system generates the prepayment invoice as soon as a
Booking that matches the prepaid list has a complete estimate, with its receivable and payable pair
created at generation (OQ-80's recommendation). The invoice and its Xero draft pair are held as
**Awaiting approval**; nothing is sent until an admin presses **Approve and send**. A later List
submit never invoices it again, and FT-08.1 names this as its one exception. The office sees each
upcoming prepaid Booking as estimate needed, awaiting approval, unpaid, part paid or paid.

Because the estimate carries contingency units, the prepaid amount is usually above the final fee.
Billing accepts that here (OQ-03 answered): at authorise, a group that goes negative only because of
the prepayment raises no invoice and no failure, its sibling Bookings bill, and the excess is
recorded. Without this, every prepaid Booking would fail billing until Phase 41.

Per owner decision D5 (OQ-57, answered), nothing blocks: Phase 15a already removed the completion gate
and turned the unpaid prepayment into a warning. This phase makes that warning escalate, mild from a
week out and strong from two days out, in both apps. When Procedures, a Contract, the estimated
duration or the setting change, or when a List or Booking moves, the engine re-checks the requirement
and amount. Per owner decision D20 (OQ-70, answered), a move to another anaesthetist keeps the agreed
amount, and the anaesthetist who does it wears or benefits from the difference; only the payable half
of the pair moves, and Phase 41 updates it. After AUTHORISED, the balance run deducts what was
prepaid; the balance invoice's citation of the prepayment invoice is Phase 41's (US-06.4.1).

> Names below are the post-Phase 15 names (`Booking`, `bookingId`, `BookingDetailBody`,
> `bookingRequiresPrepayment`, `prePaymentInvoicesForBooking`, `buildPrePaymentInvoiceForBooking`,
> `raisePreProcedureInvoice`, routes `/mobile/lists/:listId/bookings/:bookingId` and
> `/admin/day/:dateISO/bookings/:bookingId`). Use the names Phases 15a to 26 actually shipped (the
> warning rule and facts, the resolver and 19a's Contract lookup, the time tiers, the prepaid set,
> the billable party, the materialiser, the lock record), as their PROGRESS entries record them.

## Before you start: drift check

1. Run:

   ```
   node docs/prototype-build/catch-up/tools/plan-state.mjs --diff EP-06,FT-06.2,US-06.2.1,US-06.2.5,US-06.3.1,US-06.3.2,US-06.3.5,FT-08.1,FT-06.3,FT-06.4,FT-06.5,US-06.3.4,US-06.3.6,US-06.4.1,US-06.4.2,US-06.5.4,US-08.2.2,US-12.1.3,US-05.2.2,US-04.4.2,US-06.1.1,US-13.7.1,US-13.7.3,OQ-38,OQ-61,OQ-76,OQ-80,US-06.3.3,US-13.7.4,US-02.2.1,OQ-57,OQ-58,OQ-73,OQ-75,OQ-70,OQ-03,US-06.2.2
   ```

   Look for changes to EP-06, FT-06.2, US-06.2.1 to US-06.2.5, US-06.3.1, US-06.3.2, US-06.3.5,
   FT-08.1, and to the items this phase leans on: FT-06.3, FT-06.4, FT-06.5, US-06.3.4, US-06.3.6,
   US-06.4.1, US-06.4.2, US-06.5.4, US-08.2.2, US-12.1.3, US-05.2.2, US-04.4.2, US-06.1.1,
   US-13.7.1 to US-13.7.3, OQ-38, OQ-61, OQ-76, OQ-80, and the domain model's Prepayment and Warnings
   sections. Check that US-06.3.3 is still Retired (merged into US-06.3.2), US-13.7.4 is still Future
   and US-02.2.1 (surgeon PDF ingest) is still Future Work. If an item changed, re-read it and adjust
   the work items. If one is now Retired or Future, drop it from this phase and record that in the
   PROGRESS entry.
2. **Owner decisions answered.** Build each as answered, not as a default, and do not label it
   provisional:
   - **D5 / OQ-57** (2026-10-01): no block on completing a Booking or List; a clear warning in both
     apps. 15a removed the gate; this phase escalates the warning by date (item 8).
   - **D6 / OQ-58** (2026-10-01): the system generates the prepayment invoice when a Procedure
     matches the anaesthetist's prepaid list; it is held until an admin approves it, then sent.
     FT-08.1 names it as its one exception (items 5 and 6).
   - **D23 / OQ-73** (2026-10-02): prepayment only where the billable party is a person paying for
     the patient (the patient, or a guardian or other person party from 21), never an organisation.
     Greg: "prepayments are always patient-direct... there's no hospital involved". Phase 21's
     `isPersonParty(party, payer)` in `domain/billing/billableParty.ts` already holds the rule (true
     for the patient and a named payer not marked `organisation`); reuse it, never a second helper
     (item 4). No caption.
   - **D25 / OQ-75** (2026-10-02): a part interval is always rounded up under the RVG tiers (15
     minutes for the first two hours, then 10). US-05.2.2 is now Confirmed with two criteria (95
     minutes gives 7 time units, 125 gives 9), and 19a holds the tiers as data. The estimator calls
     the same tiered function the final calculation uses (19a's `timeUnitsFromMinutes(minutes, rule)`
     in `domain/billing/timeUnits.ts`, with the rule passed in from `masters.rvgTimeRule`, never
     `DEFAULT_RVG_TIME_RULE`); it carries no time-rule caveat.
   - **D20 / OQ-70** (2026-10-02): a prepaid Booking moved to another anaesthetist keeps the agreed
     amount; the anaesthetist who does it wears or benefits from the difference, and only the payable
     half of the draft pair is updated (Phase 41 does that update, DM-21). The move re-checks but
     does not change the amount (US-06.3.5, US-06.5.4). One helper,
     `prepaymentBasisAnaesthetist(state, bookingId)`, holds the rule (item 4).
   - **OQ-03** (answered earlier): a prepaid amount above the final is not refunded or credited.
     This phase makes billing accept it (item 9); Phase 41 builds its surfaces.
   If one has been reopened since `3d3a18c`, build the plan as written, label that point provisional
   in one place, and put it first on the "For the owner's review" list.
3. **Open questions.** Each is Open at `3d3a18c`. Build the stated reading, labelled provisional in
   one place (the meeting's working rule), so a different answer is a small change:
   - **OQ-38** (the two contingency modifier units). An estimate-only buffer, held as a setting (two
     to start), shown as its own row in the estimate, never recorded as modifiers on the Procedure
     and never used by the final calculation. One "Provisional (OQ-38)" caption on the contingency row
     of the breakdown and on the setting. If answered as "two specific modifier codes recorded on the
     Procedure", build that, record the codes as estimate-only, and log it. If answered as "varies by
     anaesthetist", move the setting onto the Phase 26 profile with the global value as the default.
   - **OQ-76** (is a prepayment all or nothing, and what an over- or under-run does). Build all or
     nothing: the prepaid amount is always the full estimate (US-06.2.2 as written; Vanessa: "all or
     nothing"). An overrun is the positive balance the balance run already invoices (OQ-61's
     recommendation); an under-run is item 9's accepted excess (OQ-03). One comment naming OQ-76 on
     the amount rule in `domain/billing/prepayment.ts`, the Decisions log and the owner-review list;
     no UI caption (the panel already says "Estimate"). If AA wants a partial share, a percentage
     setting applied to the estimator's amount is the small change.
   - **OQ-80** (when the pair is created and amended). Build its recommendation: the receivable and
     payable pair is created when the prepayment invoice is generated (item 5), as drafts, and only
     the payable is amended on a move before the procedure (Phase 41). Keep the timing behind one
     function, `generatePrepaymentInvoice`, with a comment naming OQ-80, and log it.
   - **OQ-61** (always invoice a positive balance?) is out of this phase's scope; the balance run keeps
     invoicing every positive balance. Do not add a threshold.
   - **Readings settled here (log them, no caption):**
     - **A split payment setting** (22's `Contract.paymentSetting: 'split'`). 22 made a split
       Contract's default billable party the patient (the remainder), so `isPersonParty` alone would
       pass it, and 22's handoff leaves "how a prepayment meets a split" to this phase. Reading, from
       OQ-73's "always patient-direct": a Procedure on a split Contract is **never prepaid**;
       prepayment applies only where a person pays the whole fee. The exclusion sits beside
       `isPersonParty` in `prepaidProceduresFor` (item 4). It replaces 22's `prepaidSplit` validator
       check, which can no longer fire: delete it and its test, and test the exclusion instead. If AA
       wants the remainder prepaid, the estimator's amount times 22's remainder share is the small
       change.
     - **"Agreed" means sent** (D20). The amount is agreed once the invoice has gone to the payer.
       A held invoice was never sent, so a move before approval withdraws it and generates afresh
       for the new anaesthetist (their prepaid set and unit value); a move after sending keeps the
       amount and the invoice.
4. **Read what Phases 15a to 26 actually built** (their PROGRESS entries):
   - 15a: the `WarningFacts` shape and its `prepaymentStatus` field, the `prepaymentUnpaid` rule file
     and texts, the `appSettings` record and its backfill, `warningClearances`, `warningsForBooking` /
     `openWarnings` / `clearWarning`, the clearance re-open rule, `WarningsPanel`, the to-do card, the
     triangle and the Booking outline, `WARNING_SAMPLES` and its prepayment sample (20 or 26 may
     already have re-pointed it), and where the office's "Raise pre-procedure invoice" button was
     left. Submit has no confirm step (US-13.7.3); do not add one.
   - 15b: Copy a Booking is gone, so no copy path calls the sync.
   - 19 and 19a: the base-unit resolver's name and inputs, the function 19a uses to look up the
     procedure's default RVG Contract (or a Contract base-unit override for a procedure, code or
     group) and pass `contractBaseUnits`, the seeded default RVG Contracts' base units for 41800
     Rhinoplasty and 41789 Septoplasty, and the time-tier data and the function that reads it.
   - 20: the Booking `prepayment` interim field, `setBookingPrepayment`, `PrepaymentFlagSheet`, the
     validator's split-deposit check and the seeded Riley deposit.
   - 21: `billablePartyForProcedure` (the effective party), its `prepaidAmount` required input and the
     guardian prepayment test.
   - 22: the GST rule and invoice layout (where the prepayment wording now lives), `materialiseInvoices`
     and its separate send step, `deliveryPlanFor`, `InvoiceDelivery`, `supplier`, `lineage`,
     `paymentSetting` with the split's default party, and `prepaidSplit`.
   - 23: Booking-level time handling (time units on every Procedure from its own times) and how an
     additional Procedure is priced.
   - 25: the lock record and whether `prePaidByProcedure` still threads into the locked run.
   - 26: the prepaid-set shape, its seeded sets (Souter's Cosmetic group and the code that holds
     41800), its coherence test's Riley exception, and whether it already re-checks anything on a
     settings edit.
   Adjust the work items to reuse what exists instead of adding a second copy.
   - **Additional prepaid Procedures after 23.** 23 prices base units on the primary only: an
     additional Procedure has base 0 (`baseSource: 'additional'`) and is priced by its Contract's
     multi-procedure rule. The typical prepaid case (US-06.2.1) is exactly that: a hospital primary
     with a cosmetic add-on (Nair). Confirm how 23 shipped, then apply item 3's reading so the
     estimate follows what the engine will charge. If 23 shipped something else, adjust item 3 and
     item 10's Nair figures to match, and log it.
5. Record the result (including "no drift", D5, D6, D20, D23 and D25 as built, and the OQ-38,
   OQ-76 and OQ-80 readings) in the PROGRESS entry.

## Reference

- **Design** (convention 17):
  - `docs/design/Design Language.dc.html`: the semantic tints (warning for estimate needed, awaiting
    approval, unpaid and part paid; success for paid), neutral pills for status, Spline Sans Mono with
    tabular-nums for every amount and unit count, and teal as the only action colour (crimson never on
    the prepayment panel, the rail card, the approval strip or the warning).
  - `docs/design/Admin Day.dc.html`: the right rail's white cards (15a's To-do card is the pattern for
    the new "Pre-payments" card).
  - `docs/design/Mobile App.dc.html`: the Booking detail anatomy (white cards with micro-cap
    headings, 14px radius) and the bottom-sheet pattern for the duration editor.
  - `docs/design/Admin Review.dc.html`: the flag chips in the review table.
  - No mockup covers the estimate breakdown. Extend the mobile card-row pattern: one mono row per
    component (base, time, contingency) per prepaid Procedure, a rule, then units x unit value =
    amount.
- **Catalogue:** the covered files above, plus FT-06.3, FT-06.4, FT-06.5, US-06.3.4, US-06.3.6,
  US-06.4.1, US-06.4.2, US-06.5.4, US-08.2.2, US-12.1.3, US-05.2.2, US-04.4.2, US-06.1.1, US-13.7.1
  to US-13.7.3; the questions OQ-38, OQ-76 and OQ-80 (open), OQ-03, OQ-50, OQ-57, OQ-58, OQ-62, OQ-70,
  OQ-73 and OQ-75 (answered), and OQ-61; and `domain-model.md` (Prepayment, Warnings). Evidence:
  `requirements-board/requirements/notes/2026-10-01-aa-meeting-with-greg.md` (#2, #16, #24, #31, #32, #47, #50) and
  `requirements-board/requirements/notes/2026-10-02-aa-meeting-with-greg.md` (#2, #3, #11, #14, #16, #17, #19, #21, #42,
  #47); change log `changes/2026-10-02-requirements-update.md`.
- **Gap analysis:** `GAP-ANALYSIS.md` (Summary, theme 5 "Prepayment reversed", "Remove or rework",
  "Demo impact" S4, the DM-20, DM-40 and RV-09 rows); `epics/EP-06.md` (every item this phase
  covers; US-06.2.3 is re-graded Contradicts for the lower-final failure) and `epics/EP-08.md`
  (FT-08.1); `gaps.json` entries for the covered IDs, FT-06.4, US-06.4.2, DM-20, DM-40 and RV-09;
  `analysis/domain-model-delta.md` (DM-19, DM-20, DM-21, DM-31, DM-40, DM-43);
  `analysis/reverse-check.md` (RV-09, RV-17).
- **Code entry points** (July line numbers, from `analysis/prototype-map-*.md`; shifted by 15 to 26):
  - `src/domain/types.ts`: `Booking` 370 (20 added `prepayment`), `PrepaymentDetail` 426, `Procedure`
    444 (anaesthetic start and handover about 498), `Invoice` 662 (`kind: 'standard' | 'prePayment'`),
    `InvoiceLine` 678, `BillingCase` 699, `XeroAccRec` about 770 (`status: 'awaitingPayment' | 'paid' |
    'voided'`), `XeroAccPay` about 780. 15a's `AppSettings` is not here: it lives in
    `src/domain/warnings/types.ts`, seeded by `defaultAppSettings` in `domain/warnings/settings.ts`
    and backfilled by `backfillMerge` in `store/appStore.ts`.
  - `src/domain/billing/`: `invoiceBuild.ts` (`buildInvoicesForBooking` deduction line about 380 to
    395, the `negativeTotal` belt about 408 to 424, `buildPrePaymentInvoiceForBooking` 456 to 505);
    `timeUnits.ts` (`timeUnitsFromMinutes(minutes, rule)`, the rule from 19a's `masters.rvgTimeRule`);
    `fee.ts`; 19's `baseUnits.ts`
    and 19a's default RVG Contract lookup; 26's `prepaidSet.ts`;
    `validateBookingForBilling.ts` (20's prepayment check); `prePaymentInvoice.test.ts`.
  - `src/domain/warnings/` (15a): `types.ts`, `routine.ts`, `rules/prepaymentUnpaid.ts`,
    `rules/index.ts`.
  - `src/store/`: `prepaymentActions.ts` (`raisePreProcedureInvoice` 53, 20's `setBookingPrepayment`);
    `selectors.ts` (`bookingRequiresPrepayment` 307, `prePaymentInvoicesForBooking`,
    `paidPrePaymentCaseForBooking`, `prePaidByProcedure` 345, `prepaymentStatusFor` 372);
    `lifecycle.ts` (`cancelBooking` 363, `editBooking` 415, `editProcedure` 445, `reassignList` 550,
    `reassignBooking` 640); `bookingActions.ts` (`createBooking`, `addProcedure` 394, `removeProcedure`
    474); 20's `setProcedureContract`; 21's billable-party actions; `mastersActions.ts`
    (`editAnaesthetist` 185); `billingRun.ts` (threads `prePaidByProcedure`); `paymentActions.ts`
    (`receivePayment` 78); `clockActions.ts` (`advanceClockToDate` 101); `xeroHandoff.ts`
    (`handoffCase` 153, `handoffCasesForBooking` 291); 15a's `warnings.ts` and `warningSamples.ts`;
    14's `officeStandIn.ts`; `prepayment.test.ts`, `paymentActions.test.ts`, `seedBilling.test.ts`,
    `demoScenarios.test.ts`.
  - `src/shared/booking/BookingDetailBody.tsx` (the prepayment row 15a left beside `WarningsPanel`,
    `data-shot="booking-prepayment"`); 20's `src/shared/flows/PrepaymentFlagSheet.tsx`,
    `flows/index.ts`; `src/shared/audit/actionLabels.ts`, `fieldLabels.ts`, `auditNarrative.ts` (the
    `PrepaymentDetail` formatter about 142); `src/shared/demoTriggers/` (14's registry, `types.ts`,
    `context.ts`); `src/domain/dateDays.ts` (`daysBetween`).
  - `src/apps/admin/`: `components/RightRail.tsx` (15a's To-do card), `outlet.ts`, `reviewFlags.ts`,
    `screens/ReviewScreen.tsx`, `screens/InvoicesScreen.tsx`, `screens/InvoiceDocument.tsx` (the
    prepayment wording, 496 to 530 in July), `screens/BillingMonitorScreen.tsx`,
    `screens/MasterData.tsx`.
  - `src/apps/demo/DemoXero.tsx`, `xeroPairView.ts` (the ACCREC status pill).
  - Seed: `src/domain/seed/bookings.ts` (Riley on Souter Fri 24 AM about 808, Nair on Souter Fri 24
    PM about 878, `SEED_MARKERS.prepaymentBooking` and `SEED_PREPAID_BOOKING_ID`), `billing.ts`
    (`buildSeedBillingSlice`, the paid INV0001/BC0001 pre-payment about 105 to 245), `rvgCodes.ts`
    (41800 Rhinoplasty 5 base units, 41789 Septoplasty 4, now reference values) and 19a's seeded
    default RVG Contracts (which hold the base units the estimator uses), `cast.ts` (Souter $26.50),
    26's prepaid sets.
  - Shots: `visual/admin-phase09.spec.ts`, `admin-phase08.spec.ts`, 15a's `visual/warnings.spec.ts`.
    Capture recipes: `requirements-board/capture/recipes/US-06.2.1.json`, `US-06.2.2`, `US-06.2.3`,
    `US-06.3.1`, `US-06.3.2`, `US-06.3.3`, `US-06.3.4`, `US-06.3.5`, `US-06.4.1`.

## Work items

**Session 1: figures, model, estimator, engine, seed.**

1. **Pin the figures first.** Before changing code, add `src/store/prepaymentParity.test.ts` capturing
   from the current build: every seeded Booking's prepayment status and open warnings; the S3 invoice
   totals (Holt, Prentice nib and St George's) and the S4 Beat 3 and Beat 5 figures; and the balance
   run for Souter Fri 24 PM (Nair) as it stands after Phase 25. S3, S4 Beats 3 and 5 and S5 must not
   move. The only deliberate changes are Riley's and Nair's figures (item 10), re-pinned there with
   the reason.
2. **Types** (`domain/types.ts`; DM-20, DM-40):
   - Delete `PrepaymentDetail` and 20's interim `Booking.prepayment` of that type, and delete the
     "INTERIM office-set flag" comment. Nothing anywhere can hold a deposit or a split.
   - `Procedure` gains `estimatedDurationMin?: number`: the office's figure from the surgeon's rooms,
     per Procedure (US-06.2.5, DM-40), entered by email or phone. Only `setEstimatedDuration` (item 7)
     writes it: the surgeon PDF route (US-02.2.1) is Future Work, so no review screen edits it.
   - `Booking` gains `prepayment?: BookingPrepayment`, where `BookingPrepayment = { amount: number;
     estimate: PrepaymentEstimateSnapshot; anaesthetistId: AnaesthetistId; atISO: IsoDateTime }`.
     `amount` is ex-GST. The snapshot holds the per-Procedure units breakdown, unit value and
     contingency setting used, so the Booking shows what was invoiced even after inputs move (US-06.2.2:
     "the amount is stored on the Booking"). It is written only by the engine (item 5).
   - "Prepayment required" is derived, never stored (this restores the 7th review B6 ruling that
     Phase 20 suspended). The domain model's `prepaymentInvoiceId` is also derived: an invoice already
     carries its Booking and `kind: 'prePayment'`. Record both readings in the Decisions log.
   - `Invoice` gains `approval?: { status: 'awaitingApproval' | 'approved' | 'withdrawn'; by?: string;
     role?: ActorRole; atISO?: IsoDateTime; reason?: string }`, set only on `prePayment` invoices
     (US-06.3.1). 22's `InvoiceDelivery` gains a `{ status: 'held' }` variant for an invoice not yet
     approved. The balance invoice's citation of the prepayment invoice (a `lineage` role and the
     invoice number on the deduction line, US-06.4.1) is Phase 41's: do not add it here.
   - `XeroAccRec.status` gains `'draft'` (US-06.3.1: "the matching pair of draft records in Xero");
     `XeroAccPay.status` gains `'voided'` for a withdrawn pair.
   - 15a's `AppSettings` (in `domain/warnings/types.ts`, not `domain/types.ts`; seeded by
     `defaultAppSettings`) gains `prepayment: { contingencyUnits: number }`, seeded `{ contingencyUnits:
     2 }` (US-06.2.4 AC3). `backfillMerge`'s one-level merge of `appSettings` already fills a missing
     `prepayment` key from the fresh seed; pin that in its regression test. If 15a's comment calls the
     record rule parameters only, widen it. The escalation windows are rule params (item 8), not here.
   - `BillingCase` gains `excessAboveFinal?: number` (item 9's prepaid-above-final record, ex-GST, on
     the prepayment invoice's case). Phase 36 re-points it to the ledger; Phase 41 builds its surfaces.
   - Actor: a new `ENGINE_ACTOR: Actor = { who: 'Billing engine', role: 'system', source: 'system' }`
     in `prepaymentActions.ts`, beside the existing `BILLING_RUN_ACTOR` pattern in `billingRun.ts`.
3. **Pure estimator** (`domain/billing/prepaymentEstimate.ts`, exported from the billing index, with
   `prepaymentEstimate.test.ts`; US-06.2.4):
   - `estimatePrepayment({ prepaidProcedures, contingencyUnits, unitValue, timeRule })`, where each prepaid
     Procedure brings its resolved base inputs and its own `estimatedDurationMin`. Base units come
     from the Procedure's Contract (OQ-62, US-04.4.2, US-06.2.4): one of the procedure's default RVG
     Contracts unless another Contract or a Contract base-unit override applies. Get them by calling
     19's `resolveBaseUnits` directly with the `contractBaseUnits` that 19a's lookup supplies for that
     Procedure (the same lookup the fee-context assemblers use, never a second one), never through
     `resolveBtm` or `feeFor`, which zero an additional Procedure's base. The RVG reference value is
     never read directly. The estimate never reads the office override, the anaesthetist adjustment,
     recorded modifiers or actual times.
   - **Additional prepaid Procedure (a settled reading; log it).** Mirror what 23's engine will
     charge, so the estimate is close to the final:
     - a prepaid primary brings its resolved base units;
     - a prepaid additional Procedure whose Contract rule is `rvgDefault` brings 0 base units (23
       charges it time plus a modifier share only);
     - under any other rule (`secondCodePercent`, `addOnFee`, `notBillable`) it brings its standalone
       resolved base units, a prudent over-estimate that item 9's excess path absorbs.
     Each line records `baseBasis: 'primary' | 'additionalRvgDefault' | 'standalone'` so the
     breakdown can say why.
   - Time units are per Procedure, from that Procedure's estimated duration, matching 23's "time on
     every Procedure": `timeUnits = timeUnitsFromMinutes(estimatedDurationMin, timeRule)`, the same
     tiered function and the same rule (`masters.rvgTimeRule`, 19a) the final calculation uses, every
     part interval rounded up (D25, US-05.2.2).
   - It returns `{ kind: 'incomplete'; missing: { procedureId; what: 'estimatedDuration' |
     'baseUnits' }[] }` when any prepaid Procedure lacks a duration, or has a ranged code with no
     chosen base units. Otherwise it returns `{ kind: 'estimate'; baseUnits; timeUnits;
     contingencyUnits; totalUnits; unitValue; amount; lines }`:
     - `amount = roundToCents(totalUnits x unitValue)`, ex-GST, always at the anaesthetist's own unit
       value, never an AA rate;
     - `lines` gives one line per prepaid Procedure (its base and time units), with the contingency
       units on the first prepaid Procedure in Booking order (the primary when it is prepaid). That
       keeps `prePaidByProcedure` keyed per Procedure for the balance run.
   - Tests:
     - the AC: 10 base + 90 minutes gives 10 + 6 + 2 = 18 units x the unit value;
     - two anaesthetists with different unit values get identical units and different dollars;
     - the contingency count comes from the input, and 0 and 3 both work;
     - incomplete without a duration (naming the Procedure), and incomplete for a ranged code with no
       selection;
     - base units come from the procedure's default RVG Contract, and a Contract base-unit override
       (19a) wins when one applies; changing the RVG reference value alone does not move the estimate;
     - US-05.2.2's criteria through the estimator: 95 minutes gives 7 time units and 125 gives 9; 120
       gives 8 and 121 gives 9 (part intervals always round up, D25);
     - two prepaid Procedures each bring their own time units;
     - a prepaid additional Procedure on an `rvgDefault` Contract brings 0 base units; on a
       `secondCodePercent` Contract it brings its standalone base;
     - lines sum to the amount to the cent.
4. **Derivation and status** (pure helpers in `domain/billing/prepayment.ts`, wrapped by selectors in
   `selectors.ts`; US-06.2.1, US-06.3.2):
   - `prepaidProceduresFor(booking, procedures, prepaidSettings, masters, partyOf)`: the non-cancelled
     Procedures whose RVG code is in 26's `expandPrepaidCodes(prepaidSettings, masters)`, directly or
     through a ticked group, whose effective billable party (21's `billablePartyForProcedure`)
     passes 21's `isPersonParty` (D23, OQ-73 answered: any person paying for the patient, never an
     organisation), and whose Contract's payment setting is not `split` (the split reading in item 3
     of the drift check). Reuse 26's helpers; do not re-expand
     groups here. The panel's "why" line uses 26's `prepaidReasonFor`. Every Procedure counts, not just
     the primary, and the Contract never triggers it (US-06.2.1 notes, OQ-25).
   - `prepaymentBasisAnaesthetist(state, bookingId)` (D20, OQ-70 answered; "agreed means sent" is
     the reading settled here): the anaesthetist whose prepaid set and unit value decide the
     prepayment. Before any invoice is sent, it is the List's anaesthetist. Once an invoice has been
     sent, it is the anaesthetist on that invoice (22's `supplier.anaesthetistId`): the agreed
     prepayment stands when the Booking moves, and the anaesthetist who does it wears or benefits
     from the difference. The payable half's update to the doer is Phase 41's. A List with no
     anaesthetist (31's Draft Lists, later) gives none, so nothing is required and nothing is
     generated; a held invoice is withdrawn (it was never sent) and a sent one keeps its agreed amount.
     Phase 32 relies on that withdrawal when a List is returned to the office, and regenerates at
     assignment. Phase 31's plan words it as "generates and withdraws nothing" on a Draft List; the
     rule here wins for a held invoice, so say so in the handoff for 31 and test both cases.
   - `bookingRequiresPrepayment(state, bookingId)`: true when `prepaidProceduresFor` (against the
     basis anaesthetist's set) is non-empty and the Booking is not cancelled. Grep that nothing reads
     20's flag.
   - Rework `prepaymentStatusFor` to return `{ status, amount?, invoiceIds, invoicedTotal,
     receivedTotal, currentEstimate? }`, where status is one of:
     - `none`: not required and nothing sent, or the List is AUTHORISED or billed with no sent
       prepayment invoice (the balance run then bills it in full);
     - `estimateNeeded`: required, and the estimate is incomplete (a duration or base units missing);
     - `awaitingApproval`: a generated invoice is held, not yet sent;
     - `unpaid`: sent, nothing received;
     - `partPaid`: received above zero and below the invoiced total (US-06.3.2);
     - `paid`: received covers the invoiced total, keyed on mirror money as
       `paidPrePaymentCaseForBooking` is today, and summed across the Booking's sent prepayment
       invoices;
     - `notNeeded`: a sent prepayment invoice exists but the Booking no longer requires prepayment.
     Withdrawn invoices never count.
   - `currentEstimate` is the live estimate when an invoice has been sent, so the UI can show
     "Estimate now $X; invoiced $Y" after a change. The difference settles at authorise: a top-up on
     the balance invoice, or item 9's accepted excess.
   - `upcomingPrepayments(state)`: every Booking that requires prepayment or has a prepayment invoice,
     on a List not yet AUTHORISED, across all dates, with its status and days to go, ordered by date.
     Read the clock from state, never `new Date()`.
   - Status is derived on read, so a receipt re-checks it with no hook (DM-20: "re-checked after each
     receipt", US-06.3.4).
   - Tests for every status, part paid from a half payment, two parties summed, an organisation payer
     never requiring prepayment, a guardian payer requiring it, a prepaid code on a split Contract
     (22's `CT-NIB-SPLIT`) never requiring it, and a sent invoice keeping the requirement after a move
     to an anaesthetist without the code.
5. **The engine's prepayment sync** (`prepaymentActions.ts`, tests in a rewritten
   `prepayment.test.ts`; US-06.3.1, US-06.3.5, FT-08.1). One store routine,
   `syncPrepayment(api, bookingId, cause)`, run as `ENGINE_ACTOR` after commit. It is both the
   generation at setup and the re-check; nothing else writes `Booking.prepayment` or generates a
   prepayment invoice.
   - `cause` is a `PrepaymentSyncCause` union (`bookingCreated`, `procedureChanged`,
     `contractChanged`, `payerChanged`, `durationChanged`, `settingChanged`, `unitValueChanged`,
     `prepaidSetChanged`, `bookingCancelled`, `bookingMoved`, `listMoved`, `primaryChanged`,
     `listAuthorised`), so 28's reassign and 32's List moves pass `listMoved` and 32a's single-Booking
     move passes `bookingMoved`. Phase 32's plan may call this routine `recheckPrepayment`; keep the
     name `syncPrepayment` and record it in the PROGRESS handoff so 32 and 32a use the shipped name.
   - It returns its outcome (`generated`, `reestimated`, `withdrawn`, `regenerated`, `cleared`,
     `unchanged`, `agreedAmountKept`), which item 11 shows.
   - A pure `prepaymentPlan(input)` in `domain/billing/prepayment.ts` decides, from the derived
     requirement, the estimator's result, the stored prepayment and the Booking's prepayment invoices:
     - `generate`: required, estimate complete, no live invoice. Store the estimate on the Booking and
       generate the invoice held.
     - `reestimate`: required, estimate complete, a held invoice for the same anaesthetist whose
       amount differs. Rewrite the stored estimate and the held invoice's lines, amount and draft pair
       in place (it was never sent).
     - `withdraw`: a held invoice that is no longer right: the requirement has gone, the estimate is
       now incomplete, or the List's anaesthetist changed before sending. Withdraw it (and `generate`
       again in the same call when still required and complete).
     - `clearStored`: not required, an estimate stored, no live invoice.
     - `none` otherwise. A **sent** invoice is never rewritten: the agreed amount stands (D20), and
       the difference settles at authorise (item 9).
   - Generation (the old `raisePreProcedureInvoice`, reworked as the internal
     `generatePrepaymentInvoice`):
     - builds through `buildPrePaymentInvoiceForBooking`, which reads the stored estimate, not a flag:
       one line per prepaid Procedure, "Pre-payment estimate, {n} units", with `units` set; grouped by
       21's effective billable party, patient layout; GST by 22's rule for that Procedure's Contract;
     - materialises through 22's `materialiseInvoices` with `approval: { status: 'awaitingApproval' }`
       and delivery `{ status: 'held' }`: nothing is emailed or queued to a portal;
     - creates the `BillingCase` and hands off the pair as **drafts** (ACCREC `draft`, ACCPAY `draft`)
       through `handoffCase` (a held case hands off with the ACCREC in `draft`). This is the one place
       the pair is created: at generation, OQ-80's recommendation (provisional, one comment naming
       OQ-80 here). Phase 41 amends only the payable on a move;
     - refuses as today for a cancelled Booking, an AUTHORISED or billed List, and a live invoice.
     - audited `invoice.prePaymentGenerated` and `booking.prepayment`, both carrying the cause.
   - Withdrawal: `approval.status: 'withdrawn'` with the cause as `reason`, the draft ACCREC `voided`
     and the draft ACCPAY `voided`, audited `invoice.prePaymentWithdrawn`. The number stays used; a
     withdrawn invoice never counts in totals.
   - Call `syncPrepayment` after commit from:
     - `createBooking` (booking setup; Copy a Booking is gone since 15b);
     - `addProcedure`, `removeProcedure` and `editProcedure` (RVG code, procedure pick and chosen base
       units);
     - `setProcedureContract` (the Contract may override base units or change the payer) and 21's
       billable-party edits;
     - `setEstimatedDuration` (item 7) and the contingency setting edit (for every Booking with a held
       or unstored estimate on a List not yet AUTHORISED);
     - `cancelBooking` (a held invoice is withdrawn; a sent one is left for Phase 41's refund);
     - `reassignBooking` and `reassignList` (US-06.3.5: "whenever a List or a Booking is moved"), and
       export it for 28's reassign, 31's Draft List assign, 32's List moves and 32a's single-Booking
       move;
     - `editAnaesthetist` on a unit value change, and 26's `setPrepaidSettings` (for that
       anaesthetist's Bookings on Lists not yet AUTHORISED);
     - 23's "Make primary" (it moves base units, so item 3's reading changes the estimate).
   - Remove 20's `setBookingPrepayment`, `PrepaymentFlagSheet` and its export, the office's "Raise
     pre-procedure invoice" button, 20's validator split-deposit check, and 22's `prepaidSplit` check
     (the derivation now excludes split Contracts). Completion never validates
     prepayment, except through 21's `prepaidAmount` required input, which is now satisfied when the
     Booking does not require prepayment or has a stored amount (no seeded Contract declares it, so no
     beat can block on it). Test it.
   - Tests:
     - a Booking created with a prepaid code and a duration generates exactly one held invoice and a
       draft pair, by "Billing engine";
     - without a duration it generates nothing and reads `estimateNeeded`; recording the duration
       generates it;
     - a held invoice is re-estimated in place when the duration changes, and withdrawn when the
       prepaid Procedure is removed;
     - a Booking whose prepaid Procedure bills an insurer or a hospital generates nothing;
     - submitting the List never raises a second prepayment invoice (US-06.3.1 AC3);
     - after sending, removing the prepaid Procedure rewrites nothing and reads `notNeeded`;
     - reassigning before sending withdraws and regenerates at the new anaesthetist's unit value (or
       clears when the new set lacks the code); reassigning after sending keeps the amount, the
       invoice and the status, and the outcome reads `agreedAmountKept` (D20);
     - each run is idempotent: calling `syncPrepayment` twice writes one audit row, not two.
6. **Approve and send** (`approvePrepaymentInvoice(api, actor, invoiceId)` in `prepaymentActions.ts`;
   US-06.3.1 AC2):
   - Office only; refused unless the invoice is a `prePayment` invoice in `awaitingApproval`, and on a
     cancelled Booking or an AUTHORISED or billed List.
   - Sets `approval: { status: 'approved', by, role, atISO }`, stamps delivery from 22's
     `deliveryPlanFor` at the clock time (email to 21's `invoiceEmail`, or the portal), and moves the
     draft ACCREC to `awaitingPayment`. The ACCPAY stays `draft`; a later receipt authorises it pro
     rata exactly as today (the trust hold that stops that is Phase 41's, DM-21).
   - Audited `invoice.prePaymentApproved`, plus 22's `invoice.sent` or `invoice.portalQueued`.
   - `receivePayment` refuses a `draft` ACCREC ("This invoice has not been sent yet."), so a payment
     can never land on a held invoice. Update the Xero sim's status pill for `draft`.
   - Tests: office approves and sends once; the anaesthetist is refused; a second approve is refused;
     payment before approval is refused; after approval half payment reads `partPaid`.
7. **Estimated duration and the setting:**
   - **`setEstimatedDuration(api, actor, procedureId, minutes | null)`** (US-06.2.5):
     - office only (US-06.2.5 is Admin App); the office types the figure the surgeon's rooms gave by
       email or phone, and this is the field's only writer;
     - refused on an AUTHORISED or billed List; minutes must be a whole number from 5 to 720;
     - audited `procedure.estimatedDuration`;
     - runs `syncPrepayment` after commit.
   - **`editPrepaymentSettings(api, actor, { contingencyUnits })`** in `mastersActions.ts`: office only,
     0 to 6, audited `settings.prepayment`, then `syncPrepayment` over the Bookings named in item 5.
   - Tests for both, including the refusals.
8. **The escalating warning** (15a's `rules/prepaymentUnpaid.ts`; US-06.3.2, US-13.7.1, D5):
   - Widen 15a's `WarningFacts.prepaymentStatus` (today `'none' | 'required' | 'outstanding' |
     'paid'`) to item 4's result (status, amount, invoiced and received totals, invoice numbers). The
     facts already carry `list` (its `dateISO`) and `todayISO`. The derivation needs the prepaid sets,
     Contracts, payers and the contingency setting, so widen `store/warnings.ts`'s `WarningState`
     (today `schedule | billing | appSettings | clock`) to include `masters`, and update the
     components that memoise on it.
   - The rule raises one before-procedure finding while the status is outstanding (`estimateNeeded`,
     `awaitingApproval`, `unpaid`, `partPaid`) and the List is not AUTHORISED:
     - `daysToGo = daysBetween(todayISO, listDateISO)`;
     - **mild** when `daysToGo <= mildWithinDays` (7);
     - **strong** when `daysToGo <= strongWithinDays` (2), including the day itself and a passed date
       on a List not yet authorised;
     - nothing further out.
     Seed the params `{ mildWithinDays: 7, strongWithinDays: 2 }` in `defaultParams`; 15a's record and
     backfill carry them. There is no screen for them (US-13.7.4 is Future).
   - Texts (no en or em dash):
     - `estimateNeeded`: "Prepayment needed. Record the estimated duration so the estimate can be
       worked out.";
     - `awaitingApproval`: "Prepayment invoice {number} is awaiting approval and has not been sent.";
     - `unpaid`: "Prepayment invoice {number} unpaid. Check with the patient before surgery starts.";
     - `partPaid`: "Prepayment part paid, ${x} of ${y} received. Check with the patient before surgery
       starts."
   - 15a's clearance re-opens at a higher strength, so a mild warning cleared from the to-do list comes
     back when it turns strong. Test it.
   - `paid`, `notNeeded` and `none` raise nothing; the warning never blocks (15a's "Never blocks"
     tests stay green).
   - **Re-point 15a's prepayment sample** in `warningSamples.ts`: stage the condition through the
     audited `editProcedure` by setting the sample Booking's primary Procedure to the first code in its
     anaesthetist's prepaid set (with no estimated duration, so it reads `estimateNeeded`; the
     Procedure's effective payer must pass `isPersonParty` on a non-split Contract); unstage
     restores the seed values. If the sample Booking's anaesthetist has an empty set, re-pin the sample
     to a Booking whose anaesthetist has one (Souter, Beaumont or Chen from 26).
   - Tests: the thresholds at 8, 7, 3, 2, 0 and -1 days; each status's text; params change the
     windows; the seeded Riley Booking reads mild on Tue 21 Jul and strong after
     `advanceClockToDate('2026-07-22')`.
9. **The balance run and the prepaid excess** (`invoiceBuild.ts`, `billingRun.ts`; US-06.2.3's
   lower final, US-08.2.2, FT-06.4's balance half):
   - `prePaidByProcedure` counts only **sent** prepayment invoices and carries the invoice id (the
     excess record below needs it). A
     prepaid Procedure that has since been cancelled moves its deduction to the Booking's first
     non-cancelled Procedure billed to the same party; with none, it is an excess (below).
   - **At authorise, a held invoice is withdrawn** (cause "List authorised before approval") and not
     netted: it was never sent, so the balance run bills the full fee.
   - The deduction line reads "Less pre-payment already invoiced": the "deposit" wording goes,
     because no deposit exists. The balance invoice attaches to the Procedure as today and is not an
     additional invoice. Its citation of the prepayment invoice (the number on the deduction line, a
     `lineage` link and the balance note's wording, US-06.4.1) is Phase 41's; leave the existing
     balance note as it is.
   - The run keeps pricing from 25's lock record. The deduction is applied after the locked price, and
     the prepaid amount is not written into the lock.
   - **Prepaid above final** (OQ-03 answered: not refunded or credited; US-06.2.3: the final "may come
     out higher or lower"). The estimate adds contingency units that the final usually lacks, so this
     is common, and without this path every prepaid Booking authorised from here on would fail
     billing with `negativeTotal`, S4 included. A counterparty group whose subtotal is
     negative only because of prepayment deduction lines no longer fails the Booking: it raises no
     invoice and returns `prepaymentExcess: { counterparty, amount, prepaymentInvoiceIds }[]` on the
     build result. The run records it as `excessAboveFinal` on the prepayment invoice's `BillingCase`,
     audited `booking.prepaymentExcess`. The Booking's billing case reads billed, not failed, and the
     Billing monitor shows no exception for it. Phase 41 builds the overpaid case's surfaces and
     wording (FT-06.4, US-06.4.2). A negative group with no prepayment line still fails with
     `negativeTotal`, as today (the Phase 08 belt, narrowed). Every positive balance is invoiced
     (OQ-61's recommendation, unchanged), which is also OQ-76's overrun case.
   - Tests:
     - an estimate below final gives a positive balance with the reworded deduction line;
     - an estimate equal to final raises no invoice;
     - an estimate above final records the excess, raises no invoice and no failure, and sibling
       Bookings bill;
     - a prepaid Procedure cancelled after sending, with no sibling on the same party, is an excess;
     - a held invoice at authorise is withdrawn and the full fee billed;
     - the payer-changed guard still fails for review;
     - a negative price override still fails;
     - the final price never reads `estimatedDurationMin` or the contingency setting (US-06.2.5).
10. **Seed** (`seed/bookings.ts`, `billing.ts`, `index.ts`; bump `PERSIST_VERSION` by one):
    - **Prepaid sets.** Confirm 26 seeded Souter's set to include 41800 Rhinoplasty (her Cosmetic
      group) and not 41789 Septoplasty. Replace 26's coherence-test Riley exception with real
      assertions:
      - the Bookings that derive prepayment on Lists not yet AUTHORISED are exactly Riley and Nair;
      - no billed or history Booking reads outstanding, and no seeded invoice is `awaitingApproval`.
      If the filler hits others, narrow 26's seeded sets. Never change the filler's `rng()` draw order.
    - **Riley** (Souter Fri 24 AM, `SEED_MARKERS.prepaymentBooking`):
      - The Procedure gains `rvgBaseCode: '41800'`.
      - It drops the flat $1,200 fixed line and 20's `{ split, 800 }` deposit, so it prices by RVG on
        the rhinoplasty's default RVG Contract with Riley as the billable party (a person paying for
        herself, whatever 20 and 21 seed for a patient-direct Contract).
      - Seeded with no estimated duration: status `estimateNeeded`, a mild warning (3 days out on Tue
        21 Jul), no invoice. S4 Beat 1 sets it live.
      - Pin the estimate at 90 minutes, (base + 6 + 2) x Souter's unit value, the base from 41800's
        default RVG Contract (19a seeds it from the reference value, 5). At July values that is 13 x
        $26.50 = $344.50 ex-GST; use whatever 19a and 26 now resolve.
    - **Nair** (Souter Fri 24 PM, `SEED_PREPAID_BOOKING_ID`):
      - The rhinoplasty is the only prepaid Procedure; the septoplasty stays on Forte's default.
      - Seed the rhinoplasty's `estimatedDurationMin: 60` and a stored estimate, computed by the
        estimator at seed time. Under item 3's reading the rhinoplasty is the additional Procedure on
        an `rvgDefault` Contract, so the estimate is 0 base + 4 time + 2 contingency = 6 units (6 x
        $26.50 = $159.00 ex-GST at July values).
      - `buildSeedBillingSlice` builds the paid INV0001/BC0001 from that stored amount, seeded
        `approval: { status: 'approved', by: 'Kirsty W.' }` a few days before the demo date, with a
        sent delivery.
      - Set the rhinoplasty's recorded times so the final exceeds the estimate by a small top-up
        (surgery ran long): for example 14:00 to 15:45 (105 minutes, 7 time units), a one-unit
        top-up. Keep the septoplasty's times so the hospital invoice does not move. Authorising Fri
        24 PM then shows a balance invoice for the top-up with "Less pre-payment already invoiced"
        (Phase 41 adds the citation of INV0001). Use whatever 23's engine actually charges and
        re-pin.
    - **Leave the excess path unseeded.** No seeded Booking may have prepaid above final; the manual
      test covers the excess path. A `seed.test` assertion pins every seeded prepaid Booking's balance
      at zero or above.
    - Update `seedBilling.test.ts`, `demoScenarios.test.ts` and the markers' comments. Re-pin item 1's
      Riley and Nair figures with the reason.
    - **Session 1 exit:** fix the listed tests; edit the UI only as far as compiling needs (the
      prepayment row reads the new status; 20's sheet and the raise button are gone); run
      `npm run build`, `npm run build:pwa` and `npx vitest run`, all green, with item 1 passing; write
      a short "session 1 done" note in the PROGRESS entry.

**Session 2: surfaces, triggers, demo.**

11. **Booking prepayment panel** (15a's prepayment row in `BookingDetailBody` rebuilt as a
    `PrepaymentPanel` component in `src/shared/booking/`, all three apps through `useSurface()`;
    US-06.2.2, US-06.2.5, US-06.3.2):
    - Title by status, as a semantic tint:
      - "Pre-payment needed · estimate incomplete";
      - "Pre-payment invoice awaiting approval";
      - "Pre-payment unpaid";
      - "Pre-payment part paid · $x of $y received";
      - "Pre-payment received";
      - "Pre-payment no longer needed".
      Amounts are in mono with tabular-nums.
    - Body:
      - which Procedures matched ("Rhinoplasty is on Dr Souter's pre-paid list"), and who pays
        (the patient, or the guardian by name), with no caption;
      - the stored amount, labelled "Estimate";
      - the invoice number with a link to the invoice document (office);
      - "Agreed with Dr X" after a move, when the basis anaesthetist differs from the List's (D20);
      - the open prepayment warning stays in 15a's `WarningsPanel` above; the panel does not repeat
        it.
    - An "Estimated duration" row per prepaid Procedure: the office edits it (a minutes stepper in
      15-minute steps, typed entry allowed; a bottom sheet on mobile, inline on web and admin) and the
      anaesthetist sees it read-only ("From the surgeon's rooms"). With none yet, the anaesthetist sees
      "The office records the estimated duration from the surgeon's rooms."
    - An estimate breakdown (collapsed by default on mobile): per prepaid Procedure base and time,
      then contingency (with the OQ-38 caption), total units, x unit value, amount. The base row
      names its source ("From the default RVG Contract" or the Contract that applies) and the time
      row its minutes; no time-rule caveat (D25). After sending, the snapshot is shown, plus
      "Estimate now $X" when it drifts.
    - The office sees a teal **Approve and send** on `awaitingApproval` (calls
      `approvePrepaymentInvoice`; the confirmation names the invoice and where it went). Nobody types
      an amount: there is no "Set pre-payment" action and no deposit input. US-06.2.2 says "an admin
      or the anaesthetist sets the prepaid amount", but the same story makes it the automatic full
      estimate (US-06.2.4); read "sets" as the amount being set on the Booking by the calculation,
      seen by the office and the anaesthetist alike (the anaesthetist read-only), and log the reading.
    - The re-check is visible (US-06.3.5): the duration editor's confirmation and the admin reassign
      confirmation append `syncPrepayment`'s outcome in one line, for example "Pre-payment re-checked:
      estimate updated", "Pre-payment re-checked: invoice withdrawn" or "Pre-payment re-checked:
      agreed amount kept".
    - Delete the "RFP open question" and "discovery point" copy (RV-17).
    - Keep `data-shot="booking-prepayment"` and add `data-shot="prepayment-estimate"`.
12. **Admin approval and tracking surfaces** (US-06.3.1, US-06.3.2):
    - **Right rail:** a new "Pre-payments" card in `RightRail.tsx`, under 15a's To-do card, fed by
      `upcomingPrepayments` through `AdminOutletContext`.
      - Rows show patient, anaesthetist surname (`drSurname`), procedure date ("In 3 days"), the
        amount and a status pill (estimate needed, awaiting approval, unpaid, part paid, paid).
      - An `awaitingApproval` row carries a teal **Approve and send**.
      - Clicking a row opens the admin Booking detail.
      - Empty state: "No upcoming pre-payments."
      - `data-shot="rail-prepayments"`.
    - **Invoices screen** (`InvoicesScreen.tsx`): an "Awaiting approval" strip above the table, one row
      per held prepayment invoice with **Approve and send**; held and withdrawn invoices carry a
      neutral pill in the table. `data-shot="invoices-awaiting-approval"`.
    - **Invoice document** (`InvoiceDocument.tsx`): a held prepayment invoice shows "Awaiting approval.
      Not sent." and **Approve and send**; a withdrawn one shows "Withdrawn before sending" with the
      reason.
    - The day grid needs no new signal: 15a's triangle carries the warning.
13. **Invoice wording and the review chip** (US-06.2.3, US-08.2.2):
    - Prepayment invoice note (wherever 22 left the patient-layout note): "This pre-procedure invoice
      is an estimate of the anaesthetic fee. The final fee is calculated after the procedure and may
      be higher or lower; any balance is invoiced after the procedure."
    - Balance invoice: only the deduction line's "deposit" wording goes (item 9). The citation of the
      prepayment invoice and the balance note's "prepayment" wording are Phase 41's (US-06.4.1).
    - Remove the "deposit" and "discovery point for AA" sentences, here and in the
      `prepaymentActions.ts` module comment (FT-08.1's gap). Letter templates are Phase 41; do not
      add them.
    - Review screen (`reviewFlags.ts`) chip, beside 15a's triangle: "Pre-payment sent but no longer
      needed" (warning tint) for `notNeeded`. The overpaid case's chip, Billing monitor line and
      wording are Phase 41's; here the excess shows only as its audit entry and the Booking billing
      cleanly.
14. **Settings and audit labels:**
    - `MasterData.tsx` gains a "Pre-payment" section: contingency units (0 to 6, stepper), office
      only, calling `editPrepaymentSettings`, with the "Provisional (OQ-38)" caption (US-06.2.4 AC3).
      The warning windows are not shown (US-13.7.4 is Future).
    - Add audit labels: `procedure.estimatedDuration` "Estimated duration recorded",
      `booking.prepayment` "Pre-payment estimate stored", `booking.prepaymentCleared` "Pre-payment no
      longer required", `invoice.prePaymentGenerated` "Pre-payment invoice generated",
      `invoice.prePaymentApproved` "Pre-payment invoice approved and sent",
      `invoice.prePaymentWithdrawn` "Pre-payment invoice withdrawn", `booking.prepaymentExcess`
      "Pre-paid more than the final fee", `settings.prepayment` "Pre-payment settings changed". Give
      the fields `estimatedDurationMin`, `prepayment` and `approval` narrative formatters. Drop the
      `prepaymentDetail` formatter and its test, and 20's `card.prepayment` / `booking.prepayment`
      flag label if it reads as a flag.
15. **Demo triggers** (the registry in `src/shared/demoTriggers/registry.ts`; bodies in `src/shared`
    or `src/store`, so `pwaPurity` holds; the office stand-in body goes beside Phase 14's
    `authoriseAsSimulatedOffice` in `src/store/officeStandIn.ts`). See "Demo triggers" below. Add
    registry tests:
    - visibility per route;
    - disabled reasons;
    - the clock jump lands on the date two days before and never rewinds;
    - "Add prepaid-list Booking" creates one Booking with one held invoice;
    - the stand-in approves and sends exactly one invoice.
    Never add anything to the Control Panel page. Update the Control Panel S4 scenario text
    (`DemoControlPanel.tsx`, the S4 `blurb` and step (1) message as 15a left them) to the new beat.
16. **Shots, recipes and the demo guide:**
    - Update `visual/admin-phase09.spec.ts`, `admin-phase08.spec.ts` and 15a's `warnings.spec.ts` for
      the new panel, the rail card, the approval strip and the mild-then-strong triangle.
    - Add a mobile shot of the part-paid panel and a PWA shot of the stand-in.
    - Run `node requirements-board/scripts/capture.ts --only US-06.2.1,US-06.2.2,US-06.2.3,US-06.3.1,US-06.3.2,US-06.3.4,US-06.3.5,US-06.4.1 --dry`
      to see the recipes that break (US-06.2.2's deposit shot, the Raise button clicks, the old
      day-grid flag if 15a left it, and US-06.3.5's category captions will). Fixing them and re-capturing is the "Catalogue
      screenshots" step below, after the review pass. Never edit a requirement's text or status.
    - Patch the demo guide (below).

## Demo triggers

Harness bar (framed build):

| Label | Screen | Surface | Effect |
|---|---|---|---|
| Move to 2 days before procedure | Admin · Day (`/admin/day/:dateISO`) and Admin · Booking detail (`/admin/day/:dateISO/bookings/:bookingId`) | bar | On the Booking detail it acts on the Booking in the URL. On the Day view, `choices` lists the outstanding prepaid Bookings from `upcomingPrepayments`, earliest first. Calls `advanceClockToDate(api, procedureDate - 2 days)`: the warning turns from mild to strong on the triangle and the to-do list, and a cleared mild warning re-opens. Disabled with "No outstanding pre-payments" or "Already 2 days or less before". The clock only moves forward, and Reset restores it |
| Add prepaid-list Booking | Admin · Day and Admin · Booking detail | bar | As the office stand-in (`OFFICE_SIMULATION_ACTOR`), creates a Booking on Dr Souter's next open List (DRAFT, today or later) for a named seed demo patient, with a primary Procedure coded 41800 on its default RVG Contract with the patient as billable party (a person paying for herself) and a 90-minute estimated duration (a named seed constant, "from the surgeon's rooms"). The engine stores the estimate and generates the invoice "Awaiting approval", so it appears on the rail card and the Invoices strip. Message names the Booking and the invoice number. Disabled with "No open List for Dr Souter" or "Already added (Reset to repeat)" |
| Payment received · half / full (re-pointed) | Admin · Booking detail, plus the existing Admin · Invoice document and Xero sim pair routes | bar | Phase 14's re-homed webhook entries gain the Booking detail route. There, `choices` are that Booking's sent prepayment ACCRECs. Half shows "Part paid · $x of $y received" on the panel, the rail and the warning text; full shows "Pre-payment received" and the warning goes. Disabled with "Awaiting approval, not sent yet" on a held invoice. Same body and idempotency keys as today |

**Approve and send** is a product button (Booking panel, rail card, Invoices strip, invoice
document), not a trigger.

Registry ids (the capture runner's `trigger` step and ATLAS's "Demo actions by screen" table use
them): `prepayment-two-days-before` (the clock jump, bar and PWA), `add-prepaid-booking`, and
`pwa-office-approves-prepayment`. The payment entries keep Phase 14's ids (`payment-half`,
`payment-full`, `payment-replay`, `pwa-payment-half`, `pwa-payment-full`); only their routes grow.

PWA equivalents (the mobile Booking waits on the office and on a patient's payment):

| Label | Screen | Surface | Effect |
|---|---|---|---|
| Office approves and sends the prepayment invoice | Mobile · Booking (`/mobile/lists/:listId/bookings/:bookingId`) | PWA only, badge office stand-in | When the Booking requires prepayment: as the office stand-in, records a 90-minute estimated duration on each prepaid Procedure that has none (the same seed constant), which lets the engine generate the held invoice, then `approvePrepaymentInvoice`. Message names the estimate and the invoice number. Disabled with "Already sent" or "This booking does not need pre-payment" |
| Patient pays half / full of the pre-payment | Mobile · Booking | PWA only | Phase 14's `pwa-payment-half` / `pwa-payment-full` bodies (shared function), registered on the mobile Booking route with `choices` limited to that Booking's sent prepayment ACCRECs. Disabled with "No sent pre-payment invoice yet" |
| Move to 2 days before procedure | Mobile · Booking | PWA only | The same body as the bar entry, acting on the Booking in the URL, so the handset's triangle turns strong |

15a's shared "Raise sample warnings" keeps working with item 8's re-pointed prepayment sample; no new
sample is added (this phase changes a rule, it does not add one).

## Out of scope

- Prepayment letter templates and reminders (US-06.3.6; the letter picker joins Approve and send in
  41); the balance invoice's citation of the prepayment invoice and its "prepayment" wording
  (US-06.4.1); the overpaid prepayment's surfaces beyond item 9's record, its Review chip, Billing
  monitor line and "Stage overpaid prepayment" beat (FT-06.4, US-06.4.2, OQ-03); the trust account
  hold and release, refund on cancellation, the update of the payable half of the pair to the doer
  when a prepaid Booking moves (D20, US-06.5.4) and a replacement anaesthetist's fresh prepayment
  (FT-06.5, US-06.5.1 to US-06.5.4). All Phase 41.
- Crediting a sent prepayment invoice that is no longer needed (Phases 39 and 41). This phase flags it
  and lets the balance run settle the difference.
- The prepaid settings screens and admin edit-on-behalf (FT-06.1, US-06.1.1, US-06.1.2): Phase 26.
- The ledger legs behind prepayment status (FT-06.3 via FT-08.3): Phase 36 re-points
  `prepaymentStatusFor` from `BillingCase` money to the ledger.
- Estimated duration arriving on a surgeon PDF (US-02.2.1, Future Work) or a hospital row: no phase
  builds it; the office enters it through `setEstimatedDuration`.
- A partial prepayment (OQ-76, open): built all or nothing; a percentage on the estimator's amount is
  the change if AA answers otherwise.
- The anaesthetist's own moves and the doer rule (US-01.4.3, US-01.4.6, US-01.4.7): Phase 32's List
  moves and 32a's single-Booking move call `syncPrepayment`; the Slot reassign is Phase 28's and
  calls it too.
- A settings page for the warning windows or for switching the approval step off (US-13.7.4, Future;
  domain model: "built only when AA asks").
- The unpaid-balance warning at booking for a patient's earlier invoices (Phase 40).

## Manual test checklist

The agent runs every item itself in the running app and reports it with evidence; none is handed
to the owner (ROADMAP.md "Owner review: agents test themselves").

- [ ] Reset. Admin Day, Tue 21 Jul: the "Pre-payments" card lists Annette Riley (Souter, Fri 24 Jul,
      "Estimate needed", "In 3 days"), and Priya Nair as paid. The To-do card shows Riley's mild
      warning "Prepayment needed. Record the estimated duration...". The Fri 24 AM block carries the
      amber triangle.
- [ ] Admin Booking detail for Riley: the panel says Rhinoplasty is on Dr Souter's pre-paid list. No
      amount input, no deposit and no "Set pre-payment" anywhere.
- [ ] Enter 90 minutes on the rhinoplasty. At once the breakdown reads base (from the default RVG
      Contract) + 6 time + 2 contingency (OQ-38 caption) x $26.50 (or the current unit value),
      matching item 10's pinned figure; the
      panel reads "Awaiting approval" with the invoice number; the audit shows `booking.prepayment` and
      `invoice.prePaymentGenerated` by "Billing engine"; the Xero sim shows a draft ACCREC and ACCPAY.
      The warning text now says the invoice is awaiting approval.
- [ ] "Payment received · half" is disabled on the held invoice ("Awaiting approval, not sent yet").
- [ ] Approve and send (from the rail card): the invoice is sent to the invoice email, the ACCREC reads
      awaiting payment, the ACCPAY stays draft, and the status reads "Pre-payment unpaid".
- [ ] "Payment received · half" from Riley's Booking detail: panel, rail row and warning text read
      "Part paid · $x of $y received". Replay is idempotent.
- [ ] Mobile, Souter Fri 24 AM: Riley's row carries the amber triangle; opening the Booking shows the
      warning clearly, the part-paid panel and the duration read-only. The anaesthetist completes the
      Booking and submits the List with no confirm step (US-13.7.3): nothing blocks.
- [ ] Clear Riley's mild warning from the To-do card, then "Move to 2 days before procedure": the clock
      reads Wed 22 Jul 08:00, the warning re-opens as strong (red triangle) on Admin and mobile.
- [ ] Re-check: "Add prepaid-list Booking" creates a Booking with a held invoice. Change its duration:
      the held invoice's amount changes in place. Set 95 minutes, then 125: the breakdown reads 7 and
      then 9 time units (D25, US-05.2.2's criteria). Remove the rhinoplasty: the invoice is withdrawn
      (draft pair voided) and the panel goes. On a sent invoice, removing the prepaid Procedure shows
      "Pre-payment no longer needed" and the review chip, and nothing is rewritten.
- [ ] Move: reassign a Booking with a held invoice to a colleague with no prepaid set: the invoice is
      withdrawn and nothing is required, and the confirmation reads "Pre-payment re-checked: invoice
      withdrawn". Reassign Riley (sent) to a colleague: the amount and invoice stay, no new invoice
      is raised, the confirmation reads "agreed amount kept", and the panel says "Agreed with Dr
      Souter" (D20; the payable half's update is Phase 41's).
- [ ] Payer: move a held Booking's prepaid Procedure to a Contract whose billable party is an
      organisation (an insurer or the hospital): the held invoice is withdrawn and nothing is
      required. A guardian payer keeps it, named on the panel, with no caption. Moving the prepaid
      Procedure to a split Contract (nib split) withdraws it too.
- [ ] Master data, Pre-payment: set contingency to 3. A held estimate updates; a sent one does not.
- [ ] Balance: submit and authorise Souter Fri 24 PM (Nair). The balance invoice carries "Less
      pre-payment already invoiced" (no "deposit"), and the top-up equals item 10's pinned figure.
      Submit never raised a second prepayment invoice.
- [ ] Held at authorise: authorise a List holding a Booking whose invoice is still awaiting approval:
      the invoice is withdrawn and the full fee billed.
- [ ] Excess: on a test Booking, record a long estimated duration and short actual times, approve and
      send, then complete, submit and authorise. No negative invoice is raised, the Billing monitor
      shows no failure for it, sibling Bookings on the List bill, and the audit shows "Pre-paid more
      than the final fee" with the amount by "Billing engine". A non-prepaid Booking with a negative
      price override still fails as before.
- [ ] S3 and S4 Beats 3 and 5 figures are unchanged (item 1).
- [ ] Invoice documents: the estimate wording says the final may be higher or lower; no "deposit",
      "discovery point", "RFP open question", "Provisional (OQ-73)" or OQ-75 time-rule copy remains in
      the prepayment surfaces. The only provisional caption is OQ-38's.
- [ ] PWA build: on Riley's mobile Booking, the demo-actions sheet offers "Office approves and sends
      the prepayment invoice" (office stand-in badge), then "Patient pays half" (part paid), then "Move
      to 2 days before procedure" (strong triangle). Sheets are bottom sheets with teal actions and no
      crimson.
- [ ] No en or em dashes in new copy; amounts in mono with tabular-nums.
- [ ] Catalogue screenshots: the recipes for the covered items above are created or updated, any recipe this phase broke is re-pointed, a full `npm run capture` ends with no failed recipe and no story without a recipe, the covered items' new shots are checked by eye, and `npm run verify:board` is green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots` and `npm run verify:board` are all green.

## Demo guide updates

Patch these in the same session, in `docs/demo-guide/` and the matching sections of
`master-demo-guide.html` (S4 Beat 1, the cheat sheet's Pre-payment section, the workflows'
Pre-payment case and the status table):

- `03-demo-script.md` **S4 Beat 1**, renamed "Pre-payment from the prepaid list" (15a left it as
  "Prepayment warning"):
  - **Click:**
    - Admin Day, Tue 21 Jul: point at Riley on the "Pre-payments" card and her mild warning on the
      To-do card.
    - Open Annette Riley. Enter the estimated duration of 90 minutes on the rhinoplasty: the estimate
      and the invoice appear, "Awaiting approval".
    - Approve and send.
    - Payment received · half: part paid.
    - Mobile, Souter Fri 24 AM, Riley: the triangle, the warning on opening and the part-paid panel;
      complete and submit, with no confirm step.
  - **Say:** "Rhinoplasty is on Dr Souter's own pre-paid list and the patient pays for herself, so
    the booking needs pre-payment; an insurer or a hospital never does. The system estimates it from
    the procedure's base units, the surgeon's estimated time rounded up by the RVG tiers and two
    contingency units, all at her own rate, generates the invoice straight away and holds it until we
    approve it. The office tracks it as unpaid, part paid or paid. Nothing blocks the anaesthetist:
    the warning is the control, and it gets stronger as the day approaches. If the booking moves to a
    colleague, the agreed amount stands."
  - **Expected:** the estimate, the held then sent invoice with its Xero pair, part paid on all three
    surfaces, and a submit that goes through.
- **S4 new closing Beat 6, "The date approaches"** ("Move to 2 days before procedure" on Admin Day,
  after clearing Riley's mild warning). It sits last so Beats 2 to 5 run on the seeded date: the clock
  jump advances the day, which runs the reconciliation poll and moves today's Lists. Check whether
  Beat 2 still finds its DRAFT today List after a jump; if it does not, keep the jump last and say so
  in Stage it.
- S4 "Discovery points": "the two contingency units (OQ-38)", "whether a prepayment is ever partial,
  and what an over- or under-run does (OQ-76)" and "when the prepayment's pair is created and amended
  (OQ-80)". Drop any gate or deposit point, and the OQ-70, OQ-73 and OQ-75 points (answered: say them
  as facts in Beat 1).
- `04-presenter-cheat-sheet.md` section 8 "Pre-payment": rewritten. The trigger is the anaesthetist's
  prepaid list and a person paying for the patient, never an organisation (D23); the estimate formula
  (default RVG Contract base units, time rounded up, D25); the invoice generated at setup and sent on
  approval (D6); the escalating warning (D5); a move keeps the agreed amount (D20); a prepaid amount
  above the final is accepted with no invoice; and no deposit.
- `02-workflows-and-handoffs.md` "Pre-payment" case: the same rewrite (no "full or split").
- `docs/demo-guide/README.md` status row and the master guide's status table: "Pre-payment from the
  prepaid list: estimate, approve and send, escalating warning".
- The Control Panel S4 scenario text (item 15).
- **Milestone:** end with a consistency read of `master-demo-guide.html` against the edited Markdown:
  S4 beat numbering, figures and trigger labels agree.

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19),
run after the review pass and before the PROGRESS.md entry. Re-run
`node docs/prototype-build/catch-up/tools/recipe-status.mjs 27` first: earlier phases may have
changed these recipes since this plan was written. Item 16's `--dry` run finds what is broken; this
step fixes it and takes the final shots. Some admin shots start from a held or sent prepayment
invoice: stage the invoice with real clicks (enter the duration, Approve and send are product
controls), and stage a payment or the clock jump with the runner's `trigger` step after a `goto` to
the entry's screen (`payment-half` / `payment-full` on the Booking detail or invoice route,
`prepayment-two-days-before` on Admin Day or the Booking detail; on a :5174 shot the step opens the
PWA Demo sheet). The Control Panel has no payment buttons since Phase 14; never click it for one.

**Covered items.** When the phase is done, each recipe in `requirements-board/capture/recipes/`
matches what was built:

| Item | Recipe at plan time | When this phase is done |
|---|---|---|
| [US-06.1.1](../../../../requirements-board/requirements/stories/US-06.1.1.md) Tick codes or groups  | absent at plan time (Phase 26 makes it captured) | No new work. Phase 26 owns these shots. Re-run `recipe-status.mjs 27`; if the recipe is captured, confirm it still passes `--dry` and that its caption matches the prepaid list now driving the Booking panel. |
| [US-06.1.2](../../../../requirements-board/requirements/stories/US-06.1.2.md) Admin can maintain on behalf  | absent at plan time (Phase 26 makes it captured) | No new work, as for US-06.1.1. |
| [US-06.2.1](../../../../requirements-board/requirements/stories/US-06.2.1.md) Detect prepayment requirement  | partial · mobile-prepayment-flag, web-prepayment-flag | captured. Replace the payment-category flag shots with the Booking panel on Annette Riley (Souter Fri 24 AM) on mobile (`/mobile/lists/L-34821-2026-07-24-AM`, open Riley), web and admin (`/admin/day/2026-07-24` Booking detail): state `needed` ("Pre-payment needed · estimate incomplete", "Rhinoplasty is on Dr Souter's pre-paid list", the patient paying), highlight `[data-shot=booking-prepayment]`. Add a Nair state (Souter Fri 24 PM) showing the requirement found across the whole Booking (the rhinoplasty is the second Procedure, the septoplasty on the hospital's Contract raises nothing). Caption: "A Booking needs prepayment when a Procedure is on the anaesthetist's prepaid list and a person pays for the patient". Drop the partial reason. |
| [US-06.2.2](../../../../requirements-board/requirements/stories/US-06.2.2.md) Set the prepaid amount  | partial · admin-deposit-invoice, admin-full-fee-invoice | captured. Delete the `deposit-invoice` shot (no deposit exists after this phase). Keep `full-fee-invoice` at `/admin/invoices/INV0001` (Nair) and add an admin and a mobile `prepayment-estimate` shot of the Booking panel on Riley showing the stored "Estimate", read-only for the anaesthetist, with no amount input. Caption: "The prepaid amount is always the full estimate, set by the calculation". Drop the partial reason. |
| [US-06.2.3](../../../../requirements-board/requirements/stories/US-06.2.3.md) Prepayment is an estimate  | partial · admin-estimated-full-fee | partial. Keep `estimated-full-fee` at `/admin/invoices/INV0001`, highlight the new note "This pre-procedure invoice is an estimate of the anaesthetic fee. The final fee is calculated after the procedure and may be higher or lower". Add state `balance` on the balance invoice for Nair after authorising Souter Fri 24 PM (the final above the estimate: a top-up). Reason: "The estimate wording is on the invoice and a final below the estimate now bills with no failure (Phase 27, not seeded); the estimate letter (US-06.3.6) and the overpaid case's surfaces are Phase 41." |
| [US-06.2.4](../../../../requirements-board/requirements/stories/US-06.2.4.md) Calculate the prepayment estimate  | absent (placeholder: "Not built yet: catch-up Phase 27 builds this.") | captured. Fill the recipe and drop the absent reason. Admin Booking detail for Riley: state `breakdown` after entering 90 minutes, with the breakdown open (base units from the default RVG Contract, 6 time units, 2 contingency units with the OQ-38 caption, total units, x unit value, amount; highlight `[data-shot=prepayment-estimate]`). Add admin Master data, Pre-payment section (contingency units stepper, "Provisional (OQ-38)"), state `setting`. Caption: "Estimate: base units from the procedure's Contract and time units rounded up, plus contingency, at the anaesthetist's own unit value". |
| [US-06.2.5](../../../../requirements-board/requirements/stories/US-06.2.5.md) Estimated duration from the surgeon's rooms  | absent (placeholder: "Not built yet: catch-up Phase 27 builds this.") | captured. Fill the recipe and drop the absent reason. Admin Booking detail for Riley: states `empty` (no duration, the stepper) and `entered` (90 minutes recorded, the held invoice appears). Mobile (Souter Fri 24 AM, Riley): state `read-only` showing "From the surgeon's rooms" and, before entry, "The office records the estimated duration from the surgeon's rooms." Caption: "Estimated duration recorded by the office from the surgeon's rooms". No PDF state: surgeon PDF ingest (US-02.2.1) is Future Work. |
| [US-06.3.1](../../../../requirements-board/requirements/stories/US-06.3.1.md) Raise the prepayment invoice  | captured · admin-raise-prepayment-invoice, admin-prepayment-invoice, simulator-prepayment-xero-pair | captured. Re-shoot `raise-prepayment-invoice` with new states: `awaiting-approval` (Riley, 90 minutes entered, the held invoice and a teal "Approve and send") and `sent` (after Approve and send). The old "Raise pre-procedure invoice" click is gone. Keep `prepayment-invoice` at `/admin/invoices/INV0001`. In `prepayment-xero-pair` (`/demo/xero/invoices/XRB0`) keep the sent pair and add a `held` state for the draft ACCREC and ACCPAY of a held invoice (the pair created at generation). Add admin `invoices-awaiting-approval` (Invoices strip) and `rail-prepayments` (the right-rail card with Approve and send). Caption: "Prepayment invoice generated at setup with its draft pair and held until the office approves and sends it". |
| [US-06.3.2](../../../../requirements-board/requirements/stories/US-06.3.2.md) Track prepayment status and alert when outstanding  | partial · admin-day-grid-flag, admin-card-status | captured. Re-shoot `day-grid-flag` (15a's amber triangle and Booking outline, not the old "Pre-payment flagged" button; re-point the click) and `card-status` with states `estimate-needed`, `unpaid`, `part-paid` and `received` (Nair, paid). Add admin `rail-prepayments` (all upcoming prepaid Bookings with status pills, which closes the missing list) and a mobile shot of Riley's row with the warning triangle and the opened Booking showing the warning and the panel. Add state `strong` after the `trigger` step `prepayment-two-days-before` on Riley's admin Booking detail (the triangle and the warning turned strong). Caption: "Pre-payment status per upcoming Booking, with a warning that strengthens as the date nears". Drop the partial reason. |
| [US-06.3.4](../../../../requirements-board/requirements/stories/US-06.3.4.md) Re-check after each receipt  | captured · admin-recheck-after-payment | captured. Re-shoot `recheck-after-payment`: states `part-paid` and `paid` now start from Riley's generated invoice (enter 90 minutes, Approve and send, then the `trigger` step `payment-half` or `payment-full` on Riley's admin Booking detail), not the Raise button. Highlight `[data-shot=booking-prepayment]`. Caption: "Half the estimate received, pre-payment part paid" and "Estimate paid in full, pre-payment received". |
| [US-06.3.5](../../../../requirements-board/requirements/stories/US-06.3.5.md) Re-check when the Booking changes  | partial · admin-recheck-on-change | captured. Replace the payment-category shots. `recheck-on-change` states `before` (Riley, held invoice at the 90-minute estimate) and `after` (duration changed to 120 minutes: the held invoice amount changed in place and the confirmation reads "Pre-payment re-checked: estimate updated"). Add a `moved` state: reassign a sent Booking to a colleague and show "Agreed with Dr Souter" and "agreed amount kept". Caption: "The requirement and amount are re-checked when the Booking changes or moves; a move keeps the agreed amount". Drop the partial reason. |
| [US-06.3.6](../../../../requirements-board/requirements/stories/US-06.3.6.md) Prepayment letter templates  | absent (placeholder: Phase 41) | absent. Keep it with no shots; replace the reason: "No prepayment letter templates; Phase 41 adds the letter picker beside Approve and send." |
| [US-06.4.1](../../../../requirements-board/requirements/stories/US-06.4.1.md) Invoice the remaining balance  | captured · admin-balance-invoice | partial. Re-shoot `balance-invoice`: the setup that raised the deposit invoice is replaced by authorising Souter Fri 24 PM (`/admin/review/L-34821-2026-07-24-PM`, Nair); the balance invoice (its id is the first runtime invoice, check it) shows the top-up and "Less pre-payment already invoiced". Caption: "Balance invoice after the procedure: final fee less the pre-payment already invoiced". Reason: "The balance is invoiced and the deposit wording is gone, but the balance invoice does not yet cite the prepayment invoice; Phase 41 adds the citation." |
| [US-06.4.2](../../../../requirements-board/requirements/stories/US-06.4.2.md) No refund when prepaid exceeds final  | absent | absent. Update the reason: "A prepaid amount above the final is accepted: no invoice, no credit and no billing failure, with the excess recorded on the prepayment's billing case (Phase 27). It is not seeded, so not capturable here, and its surfaces are Phase 41's. See Phase 27's manual test." Say so in the PROGRESS entry. |
| [US-06.5.1](../../../../requirements-board/requirements/stories/US-06.5.1.md) Trust account  | absent (placeholder: Phase 41) | absent. Keep it with no shots; replace the reason: "No trust account hold; Phase 41 holds and releases the prepayment payable." This phase leaves the ACCPAY draft until a receipt authorises it, as today. |
| [US-06.5.2](../../../../requirements-board/requirements/stories/US-06.5.2.md) Refund a prepayment on cancellation  | absent (placeholder: Phase 41) | absent. Keep it with no shots; replace the reason: "No refund path; a sent prepayment whose Procedure is removed is flagged 'no longer needed' (Phase 27) and Phase 41 builds the refund." |
| [US-06.5.3](../../../../requirements-board/requirements/stories/US-06.5.3.md) Prepayment for a replacement anaesthetist  | absent (placeholder: Phase 41) | absent. Keep it with no shots; replace the reason: "A new Booking derives its own prepayment at its anaesthetist's rate through the normal sync, but the cancel, refund and new-Booking sequence is Phase 41." If the new anaesthetist's estimate is visible on a new Booking after a cancellation in the build, upgrade to partial with that shot. |
| [US-06.5.4](../../../../requirements-board/requirements/stories/US-06.5.4.md) Prepaid Booking moved to another anaesthetist  | absent (placeholder: Phase 41) | partial. Fill the recipe. Shoot reassigning Riley (sent) to a colleague: the confirmation "Pre-payment re-checked: agreed amount kept" and the Booking panel "Agreed with Dr Souter", no new invoice raised. Reason: "The agreed amount stands and the patient is not billed again, but the payable half of the draft pair is not yet updated to the new anaesthetist; Phase 41 does that." |
| [US-08.1.1](../../../../requirements-board/requirements/stories/US-08.1.1.md) Process an AUTHORISED List using each Procedure's locked Contract  | captured · admin-authorise-list, admin-billing-run | captured. Keep the recipe. Re-check `billing-run` and add a state for Souter Fri 24 PM (Nair) so the pipeline shows the balance invoice for the top-up; a held prepayment invoice is withdrawn at authorise, not billed. No wording change. |

**Recipes this phase breaks.**
- The Booking panel hook stays `data-shot="booking-prepayment"` (Phase 15's name; seven recipes use
  it: US-06.2.1, 06.2.2, 06.3.1, 06.3.2, 06.3.3, 06.3.4 and 06.3.5). Keep it on the rebuilt panel so
  they still find it; re-check their captions.
- Every recipe that clicks "Raise pre-procedure invoice" (button gone, the invoice is generated at
  setup): besides the covered items, `US-08.2.2` (`deposit-invoice`, `balance-invoice`), `US-09.2.1`
  (`payment-webhook`), `US-09.2.3` (`webhook-replay`), `US-09.2.4` (`accpay-disbursed`,
  `payables-run`) and `US-09.3.4` (`archived-contact-reused`, `contact-unarchived`). Replace the
  click with: enter 90 minutes on Riley, then Approve and send, keeping each shot `name`. `US-08.2.2`
  also loses its deposit shot with the deposit wording.
- `daygrid-block-prepayment` (the old day-grid flag, used by `US-06.3.3` and the setups of
  `US-06.2.2`, `US-06.3.1`, `US-06.3.2`, `US-06.3.4`, `US-06.3.5`, `US-06.4.1`): 15a session 2 removes
  the `$` corner and may already have re-pointed them; any left re-point to 15a's triangle hook, or
  open Riley by URL. `US-06.3.3` is Retired (merged into US-06.3.2) and shows a gate that no longer
  exists: handle it per the ROADMAP rule.
- `INV0001` recipes (`US-05.2.7`, `US-08.4.1`, `US-09.1.1`) and `XRB0` recipes (`US-08.3.1`,
  `US-09.1.3`, `US-10.1.1`, `US-10.3.1`, `US-15.0.6`): Nair's prepayment is now the estimate
  (6 units at the July rate) and is seeded `approved` and sent. Their routes are unchanged; check the
  captions and highlights that name an amount. `US-11.3.3` uses `INV0002`; confirm it is still the
  first runtime invoice.
- Work item 16 asks for a `--dry` run of the covered recipes; the full `--dry` is the real check.

**ATLAS.md.** Seed data and Personas and IDs: Riley seeded with no duration (estimate needed) and
Nair's paid INV0001 as the estimate. Routes: the Booking detail routes after Phase 15 if ATLAS still
shows the Card routes. Existing hooks: keep `booking-prepayment`; add `prepayment-estimate`,
`rail-prepayments`, `invoices-awaiting-approval`; drop `daygrid-block-prepayment` if 15a has not. Overlays: the duration editor sheet and Approve and send
confirmation. Demo control panel section: the S4 scenario text, and the "Demo actions by screen"
table gains `prepayment-two-days-before` and `add-prepaid-booking` (Admin Day and Booking detail),
the payment entries on the Booking detail route, and the PWA's `pwa-office-approves-prepayment`; the
"a raised pre-procedure invoice is `XR0001`" note becomes a generated, approved one.

## Adversarial review (after build)

After the manual test checklist and the four commands are green, and before writing the PROGRESS
entry, run the standard adversarial review-and-fix pass (PROGRESS convention 18). Fan out
independent Opus review subagents: quality, bugs/correctness and plan adherence, plus a fourth,
money lens for this money phase. Then this session verifies every finding against the catalogue, this
plan and the code, fixes the confirmed ones, re-greens, and records the pass. Do not re-raise
anything settled in the Decisions log except the rulings this phase explicitly supersedes.

**Steer this phase's reviewers at:**

- **Derivation only.** Nothing reads a payment category, 20's interim flag or the Contract to decide
  whether prepayment is required. Every Procedure on the Booking counts, groups resolve through 26's
  helpers, cancelled Procedures and Bookings never trigger it, an organisation payer never does, a
  split-payment Contract never does (and 22's `prepaidSplit` check is gone), and the D23 (OQ-73) and
  D20 (OQ-70) rules each live in one helper with no provisional caption.
- **All or nothing.** No deposit, split or typed amount survives anywhere: types, store, UI, seed,
  invoice wording, demo guide. The OQ-76 reading is named in one place.
- **Estimator maths.**
  - The AC figure is exact.
  - The unit value is the anaesthetist's own, never an AA rate.
  - Contingency comes from `appSettings`, never a literal 2.
  - Time uses the same tiered function and rule as the final (`timeUnitsFromMinutes` with
    `masters.rvgTimeRule`, 19a) on
    each Procedure's own estimated duration, every part interval rounded up (D25: 95 minutes is 7,
    125 is 9).
  - Base units come from the Procedure's Contract (the default RVG Contract unless another applies)
    through `resolveBaseUnits` and 19a's lookup, never the RVG reference value directly, per item 3's
    reading (a prepaid additional Procedure on `rvgDefault` brings none), so a seeded estimate never
    exceeds its final.
  - Lines sum to the amount to the cent; the amount is ex-GST and GST follows 22's rule.
  - Nothing in the estimator reads actual times, modifiers, overrides or adjustments.
- **Generation and approval (D6, FT-08.1).**
  - `syncPrepayment` is the only writer of `Booking.prepayment` and the only generator; it runs as the
    engine with its cause, and is idempotent.
  - A held invoice is never emailed, never queued to a portal and never payable; its Xero records
    are drafts, created only in `generatePrepaymentInvoice` (OQ-80).
  - Approve and send is office only, once, and sends through 22's delivery plan.
  - List submit never raises a second prepayment invoice; a held invoice at authorise is withdrawn,
    never netted.
- **Money conservation.**
  - Prepaid plus balance equals the final fee (GST included) whenever the balance is zero or above.
  - The excess path raises no negative invoice, no billing failure and no credit, fails no sibling,
    and records the excess against the right sent prepayment invoice; a negative group without a
    prepayment line still fails.
  - Only sent prepayment invoices are deducted; the deduction line says no "deposit". The balance
    invoice's citation of the prepayment is Phase 41's, so do not flag its absence.
  - The locked price (25) is never altered by the deduction.
- **Status and warning (D5).**
  - Part paid is derived from mirror money summed across sent invoices.
  - `paid`, `notNeeded` and `none` raise no warning; mild at 7 days, strong at 2, nothing further out,
    nothing once AUTHORISED.
  - A cleared mild warning re-opens when strong.
  - The warning reads the demo clock only (no `Date.now()` or `new Date()`), and nothing blocks
    completion, submit or authorise; submit has no confirm step (US-13.7.3).
- **Re-check.** Every listed action calls `syncPrepayment` after commit, including moves, payer
  changes, unit value and prepaid-set edits. It never rewrites a sent invoice, and a move after
  sending keeps the agreed amount and raises no new invoice (D20).
- **Rights and audit.** Estimated duration and the setting are office only; every new action carries
  before and after.
- **Triggers and PWA.** Each entry shows only on its routes, the clock jump never rewinds, the
  stand-in is badged and sends one invoice, and `pwaPurity` still passes. The seed determinism and the
  filler `rng()` order are unchanged, and `PERSIST_VERSION` is bumped.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry; ROADMAP.md "Owner review: agents test
  themselves"): the defaults built for open questions, provisional readings, anything logged
  rather than fixed, and the screens worth a look, each with its route and persona. Include the
  "agreed means sent" reading: a held (never sent) invoice is withdrawn and generated afresh for the
  new anaesthetist on a move, which reads US-06.5.4 AC1 ("no new prepayment invoice is raised") as
  applying to a sent invoice; the alternative is to rewrite the held invoice in place. Include the
  split-Contract exclusion and the 7 and 2 day windows.
- Status row for catch-up Phase 27, and a phase entry covering:
  - the drift-check result, and D5, D6, D20 (OQ-70), D23 (OQ-73) and D25 (OQ-75) built as answered;
  - the OQ-38, OQ-76 and OQ-80 readings built as provisional, and where each lives;
  - what 15a to 26 were found to provide;
  - the session 1 and session 2 split and the adversarial pass;
  - the tests added (estimator, status, sync, approval, escalation, balance link, excess, parity);
  - `PERSIST_VERSION` old to new;
  - Riley's and Nair's re-pinned figures;
  - the Catalogue screenshots result: the recipes created or changed, the recipes this phase broke
    and how each was re-pointed, the REPORT.md counts (captured, partial, absent, failed) before and
    after, and any partial reason handed to a later phase (Phase 41 for the letters, the balance
    invoice's citation, the overpaid surfaces, trust hold, refund and the payable half on a move);
  - for the owner, catalogue wording this phase did not edit: US-06.3.5's body still says "payment
    category", and US-06.2.5 still names the surgeon PDF list although US-02.2.1 is Future Work (do
    not edit the catalogue text; images are re-shot by the screenshot step);
  - for Phase 31: on a Booking whose List has no anaesthetist, `syncPrepayment` generates nothing
    and keeps a sent invoice, but withdraws a held one (Phase 32 depends on that), so 31's "withdraws
    nothing" check applies to sent invoices only;
  - for Phases 28, 31, 32, 32a, 36 and 41: `syncPrepayment` (Phase 32's plan may call it
    `recheckPrepayment`) with its `PrepaymentSyncCause` values `listMoved` and `bookingMoved`,
    `prepaymentBasisAnaesthetist`, `setEstimatedDuration`, the `approval` record, the `draft` ACCREC,
    `generatePrepaymentInvoice` as the one place the pair is created (OQ-80), `prePaidByProcedure`
    carrying the invoice id, and `excessAboveFinal` on the prepayment invoice's case (41 cites the
    prepayment on the balance invoice and builds the overpaid surfaces).
- Decisions log:
  - **Superseded:**
    - Phase 09's open-question reading (1) (the office raises the pre-invoice by hand before the
      procedure), replaced by D6: generated by the engine at setup, held, sent on approval.
    - Phase 09 build decision (4): split balance = fee - deposit and full = no balance, and Riley as a
      flat $1,200 fee. Prepayment is now the full estimate only, with a top-up balance or a recorded
      excess.
    - Phase 20's interim office-set Booking flag, closed. The 7th review B6 "derived, never stored"
      ruling is restored.
    - 15a's provisional "strong" strength for the unpaid prepayment, replaced by the date escalation.
    - The overpaid prepayment's `negativeTotal` failure ("needs a manual credit"): a group negative
      only because of the prepayment now bills cleanly with the excess recorded (OQ-03, US-06.2.3).
      The Phase 08 `negativeTotal` belt stays for every other negative.
  - **Readings settled here:** the amount is always the engine's estimate (nobody types one; US-06.2.2's
    "an admin or the anaesthetist sets" read as set by the calculation and seen by both); time and
    estimated duration are per Procedure; contingency sits on the first prepaid Procedure; a prepaid
    additional Procedure is estimated as 23 will charge it; a held invoice is re-estimated in place or
    withdrawn, a sent one never rewritten; held invoices have a draft Xero pair and are withdrawn at
    authorise; the warning windows are 7 and 2 days as rule params; the prepaid-above-final excess is
    recorded, never invoiced (OQ-03); a split-payment Contract is never prepaid, replacing 22's
    `prepaidSplit` (from OQ-73's "always patient-direct"); "agreed" means sent, so a held invoice
    follows a move and a sent one keeps its amount (D20, judged against the invoice's anaesthetist).
  - **Answered, built as answered (no caption):** D20 / OQ-70 (agreed amount stands, only the payable
    half moves, in 41), D23 / OQ-73 (any person paying for the patient, never an organisation), D25 /
    OQ-75 (part intervals always rounded up, through the same tiered function as the final).
  - **Provisional (open questions built as their reading):** OQ-38 (estimate-only contingency
    setting, one caption), OQ-76 (all or nothing; overrun invoiced as the balance, under-run accepted
    as the excess), OQ-80 (pair created at generation; only the payable amended on a move).
