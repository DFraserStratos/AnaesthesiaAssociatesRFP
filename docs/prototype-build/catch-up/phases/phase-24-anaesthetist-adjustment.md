# Phase 24 · Contract defined rate and anaesthetist adjustment

**Requirements covered:**
[US-04.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.2.md) Contract pricing and adjustment rules (Verify, [OQ-89](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-89.md)). Rewritten on 2026-10-02: base units come from the procedure's default RVG Contract ([US-04.4.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.4.2.md), built by 19a), and the fourth pricing basis is a **Contract defined unit rate**, not rate x time. This phase closes its last two missing parts, the defined rate and the allows-adjustment rule ·
[FT-05.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-05.2.md) Unit and fee calculation (now Confirmed), which closes here ·
[US-05.2.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.2.6.md) Contract defined rate (renamed from "Rate x time pricing", now Confirmed) ·
[FT-03.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-03.5.md) Anaesthetist adjustment ·
[US-03.5.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.5.1.md) Apply an anaesthetist adjustment, with required reason (Proposed) ·
[FT-05.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-05.4.md) Adjustments and overrides ·
[US-05.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.4.1.md) Apply anaesthetist adjustment ·
[DM-46](../analysis/domain-model-delta.md#dm-46) the hourly rate x time billing line and its "individually arranged" gate are replaced by a Contract defined unit rate ·
[DM-14](../analysis/domain-model-delta.md#dm-14) the anaesthetist adjustment is its own Contract-gated record, and the office override stays the existing `priceOverride` ·
[RV-24](../analysis/reverse-check.md#rv-24-rate-x-time-billing-line-hours-x-hourly-rate-gated-by-a-method-3-contract-flag) the hours x rate line, its Method 3 flag and the hourly seed Contract go ·
[RV-11](../analysis/reverse-check.md#rv-11-anaesthetist-adjustment-is-dollar-or-fixed-price-and-always-offered-percentage-is-office-only) the dollar-or-fixed, always-offered, ungated anaesthetist adjustment is reworked.
Kept as they are and re-tested, not reopened:
[US-05.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.2.1.md) Per-unit pricing rate (now Confirmed; its rate now comes through this phase's rate function),
[US-05.4.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.4.2.md) Office price override (Matches; the office can always override, [OQ-16](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-16.md) Answered) and
[US-03.5.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.5.2.md) BTM still recorded in full (Matches; must survive a 100% discount).
Not this phase's: the dated UNIT x RATE billing line outside BTM
([US-03.3.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.3.6.md),
Proposed) is Phase 39b's, priced through this phase's rate function.
**Depends on:** Phase 23 (the Booking-level pricing engine, the 3/2/2 modifier split and the
per-Contract multi-procedure rule). Also relies on 15 (Booking vocabulary), 15a (the warning
routine, which this phase leaves alone), 18 (the reshaped `Contract`, its `PricingBasis` with the
`rateTime` interim, `ContractRateStep` and `rateInForce`, `permitsRateTime`, and the rebuilt Contract
detail panel), 19 (the master procedure list, the procedure-first capture picker, and D3's "any
base-unit value accepted, with an after-procedure office warning"), 19a (the default RVG Contracts
that hold base units, the Contract base-unit override, the base-unit resolver reading the Contract,
and RVG time tiers as data), 20 (one Contract per Procedure, `setProcedureContract`, the Contract
picker), 21 (Review's Contract column and approval) and 22 (invoice presentation and the Contract
payment setting, FULL or SPLIT, with its typed share).
**Estimated:** 2 sessions. **Session 1** builds the Contract defined rate (work items 1 to 5) and
ends green with the hourly line gone and the Aria seed re-expressed. **Session 2** builds the
anaesthetist adjustment (work items 6 to 17). Each session leaves the app green and demoable.

## Goal

**Session 1: the Contract defined rate.** A Contract can define its own **unit rate**, an
alternative to the anaesthetist's own unit value (US-05.2.6, DM-46). It is a unit rate, not an hourly
one. The prototype's hourly rate x time billing line goes with everything that carries it: the
`rateTime` charge basis and pricing basis, the "Rate x time (hourly)" option in Add billing line, the
Method 3 "permits individual arrangement" flag, `permitsRateTime` and the validator gate with its
message (RV-24).

OQ-89 is open. Its recommendation, built here and labelled provisional in one place, is that **the
Contract defined rate is the agreed contract rate per unit**: one pricing basis, which prices the
**whole Procedure** (its units, after 23's Booking-level rule, at the Contract's rate in place of the
anaesthetist's unit value). Every unit rate the engine uses comes from **one pure rate function**.
This phase builds **no billing line**: the dated UNIT x RATE line outside BTM (US-03.3.6) is Phase
39b's, priced through the same function, so if OQ-89 later makes the defined rate a separate basis or
a separate line, it is one change in one place.

The seeded hourly Contract (`CT-ARIA-HOURLY`) and its two rate x time Bookings are re-expressed as
whole-Procedure pricing at a Contract defined unit rate. FT-05.2 (unit and fee calculation) closes.

**Session 2: the anaesthetist adjustment.** The anaesthetist adjustment becomes **its own record on
the Procedure**, separate from the office override (today's `priceOverride`). It is a **percent
discount** or a **fixed final price**. There is no dollar variant, and a reason is always required.
It is offered only when the **Procedure's Contract allows it**, and only once base, time and modifier
units are recorded. A 100% discount still leaves all of those units recorded.

The pure engine applies the layers in the domain model's order: **Booking-level base calculation
(Phase 23, at the unit rate from this phase's function), then the anaesthetist adjustment, then the
office override.** It records the fee before each layer. The office override stays available on
**every** Contract, including a fixed-fee one, and keeps its three kinds (fixed fee, dollar,
percent).

On mobile and the anaesthetist web app, the adjustment field appears only where the Contract allows
it. Otherwise it is not offered. Admin Review, the admin Booking total and the invoice show both
layers.

The Contract gains **`allowsAnaesthetistAdjustment`**, edited in the Contract detail panel beside the
defined-rate basis. With both, US-04.2.2's pricing and adjustment rules are complete.

The adjustment changes the **price**, never the base units. Base units live in each procedure's
default RVG Contract (OQ-62, answered; D12), which 19a built. The 2026-10-01 meeting said a base unit
that is consistently overridden means AA fixes its default RVG Contract, so this phase adds no rule,
report or Contract setting for repeated overrides.

## Before you start: drift check

1. Diff the catalogue against the snapshot (catalogue commit 3d3a18c):

   ```
   git diff 3d3a18c -- "docs/discovery-reference/Updated Requirements/catalogue" "docs/discovery-reference/Updated Requirements/domain-model.md"
   ```

   - **What to read.** Read the diff for US-04.2.2, US-05.2.6, FT-05.2, US-05.2.1, US-03.3.6,
     FT-03.5, US-03.5.1, US-03.5.2, FT-05.4, US-05.4.1, US-05.4.2, OQ-89, OQ-62 and OQ-16. In
     `domain-model.md`, read the Contract table's `pricingBasis`, `baseUnits / baseUnitOverrides`
     and `allowsAnaesthetistAdjustment` rows, the "Procedure billing context" rows
     `anaesthetistAdjustment` and `officeOverride`, and section 3, "Calculation rules".
   - **At 3d3a18c (the three 2026-10-02 meetings with Greg)** this phase's items stand as follows:
     - **US-04.2.2** was rewritten and is now **Verify** ("we haven't verified it"). Base units come
       from the procedure's default RVG Contract and any other Contract may override them for a
       procedure, code or group (19a built this); the fourth pricing basis is "a Contract defined
       unit rate"; the adjustment criterion is unchanged.
     - **US-05.2.6** was renamed "Contract defined rate" and is **Confirmed**: "a unit rate, not an
       hourly rate", an alternative to the anaesthetist's unit value, defined on the Contract.
       Whether it is the same basis as the agreed contract rate is OQ-89.
     - **FT-05.2** is now **Confirmed** (new source: the booking and pricing review #17).
     - **US-05.2.1** is now Confirmed; it applies "wherever the Procedure's Contract does not set a
       fixed fee or its own rate".
     - **US-03.3.6** was retitled "Other billing lines (including UNIT X RATE)" and stays Proposed.
       Its note names the tension with US-05.2.6 (OQ-89). It is Phase 39b's.
     - **US-03.5.1** and **US-05.4.2** changed only links and image order. FT-03.5, US-03.5.2, FT-05.4,
       US-05.4.1 and OQ-16 did not change.
     - **OQ-62 is answered** (D12): base units live in each procedure's default RVG Contracts. No
       part of it is open for this phase.
     - **OQ-89 is open**, with a recommendation: "treat the Contract defined rate as the agreed
       contract rate per unit". Its question 3 (schedule lines' time bands and add-ons) is Phase
       18's.
   - **If an item changed since**, re-read it and adjust the work items below.
   - **If an item is now Retired or Future**, drop it and say so in the PROGRESS entry.
   - **Things to look for:**
     - OQ-89 answered: see drift check 4;
     - a dollar variant being added to the anaesthetist adjustment;
     - the office being allowed to edit the anaesthetist's adjustment;
     - a cap on the fixed final price;
     - a rule that detects or reports a consistently overridden base unit (the meeting said AA
       fixes its default RVG Contract instead; if a story now asks for one, it belongs to 19a or 42,
       not here);
     - the anaesthetist being shown the fee before and after the adjustment (drift check 3).
2. **Two known wording clashes in `domain-model.md`, already resolved.**
   - Its Procedure billing-context table still lists `anaesthetistAdjustment { type: PERCENT,
     AMOUNT or FIXED_FINAL }`. FT-03.5, US-03.5.1, US-05.4.1 and US-04.2.2 all say "percentage
     discount or fixed final price", and DM-14 settles on no dollar variant. **Build** the stories'
     reading. If the diff shows `AMOUNT` added to a story, add a `dollar` kind to the record and the
     segmented control; it is one more branch in item 7.
   - Its Contract table still lists `RATE_TIME` (hourly, individually arranged) as the fourth
     `pricingBasis`, and section 3 still prices it as "rate x duration". US-05.2.6 and US-04.2.2
     (both rewritten at 3d3a18c) say a Contract defined unit rate. **Build** the stories' reading.
   - **Tell the owner** both in the phase notes, so `domain-model.md` can be corrected. Do not edit
     the catalogue in this phase.
3. **The anaesthetist sees no fee (the 2026-09-28 ruling, a user decision).** US-05.4.1's catalogue
   screenshots are captioned "the Booking total shows the fee before it". That was captured when the
   anaesthetist Booking still showed a total.
   - **Build:** keep the ruling. The fee before the adjustment is **recorded** (US-05.4.1: "records
     the fee as it stood before the adjustment") and shown to the office, but the anaesthetist
     Booking shows no money. The only exception is the fixed final price the anaesthetist types in.
     The defined rate follows the same rule: the anaesthetist captures B, T and M as on any Contract
     and sees no rate or fee.
   - **Do not ask now** (ROADMAP.md "Owner review: agents test themselves"): put "should the
     anaesthetist see the before and after figures?" on the phase's "For the owner's review" list.
     If the owner later answers yes, add a read-only "Calculated fee · after your adjustment" row to
     the adjustment card only, not a Booking total. Record the answer in the Decisions log.
   - **Catalogue screenshots.** US-03.5.1's images are captioned "Adjustment and charge" and
     "Dollar adjustment field", US-05.4.1's show a Booking total, and US-05.2.6's show the hourly
     line. They were shot from retired behaviour. This phase re-shoots them in the Catalogue
     screenshots step below. It still never edits the catalogue's text or status.
4. **OQ-89 (the Contract defined rate).** Its questions 1 and 2 decide this phase's shape.
   - **If still open:** build the recommendation. The Contract defined rate is the agreed contract
     rate per unit: Phase 18's `rvgUnitsContractRate` basis with an `agreedUnitRate` step, priced
     for the whole Procedure. Label it provisional in **one place**: a single note beside the basis
     selector in the Contract detail panel, "Provisional: the Contract defined rate is the agreed
     rate per unit and prices the whole procedure (OQ-89).", and one exported constant
     (`DEFINED_RATE_READING`) that the note and the tests read.
   - **If answered "a different basis":** add a `contractDefinedRate` kind to `PricingBasis` and one
     branch in `unitRateFor` (item 2). Nothing else moves, because every caller goes through it.
   - **If answered "a line outside BTM":** this phase still removes the hourly line, and the
     whole-Procedure pricing stays for the agreed rate; record the answer for Phase 39b, whose UNIT x
     RATE line already calls `unitRateFor`.
   - Either way, drop the provisional note if answered.
5. **Proposed and Verify items.**
   - **US-03.5.1** stays Proposed until the reason rule is confirmed. The reason is already
     mandatory; keep it.
   - **US-04.2.2** is Verify: it is still to be walked through with AA. Build it as written and put
     it on the "For the owner's review" list with the defined-rate reading.
   - Build both as written.
6. **Read what Phases 18 to 23 actually left.** Check their PROGRESS entries and the code for:
   - the name and shape of Phase 23's Booking-level engine (planned as `bookingFeeFor` in
     `src/domain/billing/bookingFee.ts` over the per-Procedure `feeFor`), what it returns per
     Procedure, and how it marks the primary (`isPrimary`);
   - Phase 18's `PricingBasis` (planned: `rvgUnitsAnaesthetistRate`, `rvgUnitsContractRate { rates:
     ContractRateStep[] }`, `fixedSchedule`, and the `rateTime` interim), `rateInForce`,
     `permitsRateTime`, `PRICING_BASIS_LABEL` and its "a `rateTime` Contract needs at least one rate
     x time line" validator rule;
   - what 18 left on the Aria Contract (planned: `rvgDefaultPostPaid`, holder
     `bookingBillableParty`, `rateTime`, `anaesthetistIds [Souter, Fitzgerald]`), and whether it kept
     today's $26.50 agreed unit rate anywhere;
   - the base-unit resolver 19a left (planned as `resolveBaseUnits` in
     `src/domain/billing/baseUnits.ts`, reading the procedure's default RVG Contract and any
     Contract override) and its "no base" result, and the master procedure entry 19 seeded for
     abdominoplasty and laser skin resurfacing (if any);
   - the field that holds the Procedure's Contract (`contractSelection`, per Phase 20);
   - the Contract detail panel's section layout (Phase 18);
   - how 22's SPLIT payment setting takes the holder's share from a Procedure's total;
   - how 22's invoice presents override lines.

   Then name the real symbols in your plan. Also grep for any `priceOverride` of kind
   `dollarAdjustment` or `fixedFee` that a later phase seeded or wrote as the anaesthetist:
   - at 3d3a18c the seed has **none**;
   - S5's three staged audit edits are ASA and notes only, so they are unaffected.

   Re-express any you find as percent or fixed final (item 15), or move them to office overrides.
7. Note the current `PERSIST_VERSION`, which is 16 at 3d3a18c (after 15a session 1) and higher after
   15b to 23.

## Reference

**Design files (convention 17).**
- `docs/design/Mobile App.dc.html`: the capture sections, segmented controls, text fields and
  captions that the adjustment card follows.
- `docs/design/Admin Review.dc.html`: the Review row anatomy. Flag pills sit in the Flags column, as
  in "T adjusted +1 manually" on David Chen's row. The Fee cell is mono and tabular-nums.
- `docs/design/Web Dashboard.dc.html`: only for the web chrome around the shared Booking detail.
- `docs/design/Design Language.dc.html`: tokens.
  - Teal for Save adjustment and Price override.
  - The neutral pill for recorded layers and for the rate source; the warning tint only for "not
    allowed".
  - Crimson never.
  - Spline Sans Mono for every figure, rate and percent.
- No mockup draws the adjustment or the Contract editor. Extend the capture-section and Review-pill
  patterns, and Phase 18's Contract detail panel sections, rather than inventing a new panel.

**Catalogue.** The covered items above, plus
[US-04.4.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.4.2.md)
(default RVG Contracts hold base units; 19a),
[US-03.3.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.3.6.md)
(the UNIT x RATE line; 39b),
[US-05.2.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.2.5.md)
(fixed fee, the other whole-Procedure basis),
[US-04.3.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.3.5.md)
(the locked Contract that US-05.4.1 names; Phase 25 builds the lock) and
[FT-07.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-07.2.md)
(SUBMITTED review, where the office overrides), and
[OQ-89](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-89.md) (the defined
rate's shape) and
[OQ-62](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-62.md) (answered:
base units in the default RVG Contracts). The evidence is
`notes/2026-10-02-aa-booking-and-pricing-review-with-greg.md` points #17, #19, #20 and #55. In
`domain-model.md`, see section 3's pipeline: "then apply anaesthetist adjustment (if allowed), then
office override".

**Analysis.**
- `../GAP-ANALYSIS.md`: theme 4 ("Pricing rule changes"), the DM-14 and DM-46 rows under
  "Structural changes", and the RV-11 and RV-24 rows under "Prototype behaviour to remove or rework",
  then the EP-03, EP-04 and EP-05 tables.
- `../epics/EP-03.md` (FT-03.5, US-03.5.1), `../epics/EP-04.md` (US-04.2.2) and `../epics/EP-05.md`
  (FT-05.2, US-05.2.6, FT-05.4, US-05.4.1).
- `../analysis/domain-model-delta.md` (DM-14, DM-46) and `../analysis/reverse-check.md` (RV-11,
  RV-24).
- The code maps: `../analysis/prototype-map-domain.md`, `prototype-map-shared.md`,
  `prototype-map-admin.md` and `prototype-map-store-seed.md`.

**Code entry points.** These are named and line-numbered as at 3d3a18c, after Phase 15's Booking
rename (already built: `bookingActions.ts`, `shared/booking/BookingDetailBody`,
`validateBookingForBilling`, seed `bookings.ts`). Phases 15a to 23 move lines and may rename
symbols, so use the names they left.
- **Session 1 (defined rate):**
  - `src/domain/types.ts`: `Contract.permitsIndividualArrangement` (~l.228) and
    `ContractType2Detail` (~l.212), both reshaped by 18 into `PricingBasis`; `ChargeBasis` (~l.519,
    `'rateTime'`) and `BillingLine.rate` / `hours` (~l.533 to 536).
  - `src/domain/billing/fee.ts`: the unit-rate block (~l.186 to 196) and the non-RVG line loop with
    its `rateTime` branch (~l.236 to 250); `FeeLine.hours` / `rate` (~l.140).
  - `src/domain/billing/validateBookingForBilling.ts`: `INDIVIDUAL_ARRANGEMENT_MESSAGE` (~l.39) and
    the Method 3 gate (~l.219 to 231), plus whatever 18 added for `rateTime`.
  - `src/store/billingLineActions.ts`: the `'rateTime'` input shape (~l.29 to 36) and the gate
    (~l.42, ~l.78 to 82).
  - `src/shared/capture/AddBillingLineSheet.tsx` (the Basis type ~l.10, `rateTimePermitted` ~l.30,
    the option ~l.92 to 98, the hours and rate fields) and `BillingLinesCard.tsx` (~l.18, ~l.96).
  - `src/apps/admin/flows/ContractEditSheet.tsx`: the Type 2 basis segmented control (~l.184), the
    "Permits individual arrangement (Method 3)" control (~l.189), or 18's basis selector.
  - `src/shared/audit/fieldLabels.ts` (`permitsIndividualArrangement` ~l.100) and
    `auditNarrative.ts` (the `agreedUnitRate` narrative ~l.158).
  - `src/domain/seed/contracts.ts` (`CONTRACT.ariaHourly` ~l.26, the Aria Contract ~l.119 to 132),
    `src/domain/seed/bookings.ts` (Fitzgerald's Wed 15 Jul rate x time Booking ~l.717 to 740, Souter's
    Mon 27 Jul capture Booking ~l.868 to 886, the scenario keys `rateTime` / `rateTimeCapture`
    ~l.42 and ~l.1244), and `src/domain/seed/index.ts` (`SEED_MARKERS.rateTimeBooking`,
    `rateTimeCaptureBooking` ~l.603 to 613, `individualArrangementContract` ~l.700 to 704).
  - `src/apps/demo/DemoData.tsx` (~l.212, the scenario comment and marker list).
  - Tests that construct `rateTime` today: `fee.test.ts` (~l.170), `validateBookingForBilling.test.ts`
    (~l.195), `captureActions.test.ts` (~l.106 to 187), `billingRun.test.ts` (~l.207 to 218, the
    $1,440 Aria invoice), `seed.test.ts` (~l.325, "3 hours at $480 = $1,440") and
    `mastersActions.test.ts`.
- **Session 2 (adjustment):**
  - `src/domain/types.ts`: `PriceOverride` (~l.443) and `Procedure.priceOverride` (~l.511);
    `Contract` (reshaped by 18); the `by` and `atISO` shape that `BookingCancellation` uses.
  - `src/domain/billing/fee.ts`: `feeFor`, the override block (~l.254 to 267); `AppliedOverride` and
    `FeeResult` (~l.146 to 166); Phase 23's Booking-level engine beside it.
  - `src/domain/billing/baseUnits.ts` (19a's `resolveBaseUnits`; it does not exist at 3d3a18c): read
    only, for the "B recorded" gate.
  - `src/domain/billing/validateBookingForBilling.ts`: the price-override checks (~l.232 to 243) and
    the base code and time checks (~l.130 to 160) that the "recorded in full" rule must share.
  - `src/domain/billing/invoiceBuild.ts` (~l.369 to 378): the "Price override, {reason}" delta line.
  - `src/domain/billing/index.ts` (re-exports) and `src/domain/billing/fixtures.ts` (`mkContract`).
  - `src/store/lifecycle.ts`: `ProcedurePatch` (~l.443), `editProcedure` (~l.445), `editRefusal`
    (~l.48): the anaesthetist on their own DRAFT List, the office on DRAFT and SUBMITTED,
    integrations DRAFT only.
  - `src/store/contractActions.ts`: `ContractInput`, `createContract`, `editContract`.
    `setProcedureContract` is Phase 20's.
  - `src/shared/capture/OverrideCard.tsx`, to be replaced. It is mounted in `BtmCaptureBlock.tsx`
    ~l.249, in a `Pair` with `BillingLinesCard`, and its anchor field `'priceOverride'` sits in the
    `anchored` set ~l.107.
  - `src/shared/flows/PriceOverrideSheet.tsx` and `src/shared/booking/OfficeBillingSetup.tsx` (the Override row
    and the "Price override" button).
  - `src/shared/booking/BookingDetailBody.tsx` (15's rename of `CardDetailBody`): the override note
    (~l.238 to 248) and the `actor.role !== 'anaesthetist'` total guard.
  - `src/shared/surface/context.ts` (the total props' `overrideNote`) and `src/shared/capture/BookingTotalPanel.tsx`.
  - `src/shared/capture/feeContext.ts`: `procedureFee` and `bookingFee`, or the Booking-level view
    23 left.
  - `src/apps/admin/screens/ReviewScreen.tsx` (the Fee column) and `src/apps/admin/reviewFlags.ts`
    (pure, tested).
  - `src/apps/admin/flows/ContractEditSheet.tsx` and `src/apps/admin/screens/MasterData.tsx`
    (`ContractsView`).
  - `src/shared/audit/auditNarrative.ts` (`formatShape` ~l.132), `fieldLabels.ts` and
    `actionLabels.ts`.
  - `src/domain/seed/contracts.ts`, `bookings.ts`, `audit.ts` (the procedure snapshot), `index.ts`
    (`SEED_LIST_IDS.morrisonMon20`, `SEED_MARKERS`) and `seed.test.ts`.
  - Tests that construct `priceOverride` today: `fee.test.ts`, `validateBookingForBilling.test.ts`,
    `invoiceBuild.test.ts`, `billingRun.test.ts`, `mastersActions.test.ts`, `auditNarrative.test.ts`.
  - Playwright: `visual/admin-phase06.spec.ts` ~l.45 to 55 (the office % override,
    `a-05-override.png`) and `visual/booking-attachments.spec.ts` ~l.44 (`expectSameHeight(page,
    'Adjustment and charge', 'Billing lines')`).

## Work items

### Session 1: the Contract defined rate

1. **Model** (`domain/types.ts`). Satisfies DM-46 and RV-24.
   - **`PricingBasis`** loses `{ kind: 'rateTime' }`. The Contract defined rate is Phase 18's
     `rvgUnitsContractRate` with an `agreedUnitRate` step (OQ-89's recommendation, drift check 4).
     The `percentDiscount` step stays: a discount off the anaesthetist's unit value is the other
     half of the same basis (US-04.2.2's "a contract rate per unit, or a percentage discount").
   - **`ChargeBasis`** becomes `'rvg' | 'fixed'`. `BillingLine.hours` goes, and `rate` is documented
     as "$ per unit, 'rvg' only". `FeeLine.hours` goes.
   - **`permitsRateTime`** and any remaining `permitsIndividualArrangement` field are removed. Grep
     must find neither in `src`, nor "Method 3", "individually arranged" or "hourly" in rendered
     strings.
   - **`FeeResult`** gains `rateSource: UnitRateSource | null` (item 2), so the office total, Review
     and the invoice can say where the rate came from without re-deriving it.
2. **One pure rate function** in a new `src/domain/billing/unitRate.ts`, re-exported from the billing
   index, with Vitest tests in `unitRate.test.ts`. Covers US-05.2.6, US-05.2.1 and FT-05.2.
   - **`unitRateFor(contract, anaesthetist, pricingDateISO)`** returns `{ unitRate, source }` or
     `null`:
     - no Contract, or `rvgUnitsAnaesthetistRate`: the anaesthetist's unit value, source
       `anaesthetistUnitValue`;
     - `rvgUnitsContractRate` with an `agreedUnitRate` step in force (18's `rateInForce`): that rate,
       source `contractDefinedRate`;
     - `rvgUnitsContractRate` with a `percentDiscount` step: the anaesthetist's unit value less the
       percent, rounded to cents **here** (moved from `fee.ts`, so a charged amount and a displayed
       "$x.xx per unit" never disagree), source `contractDiscount`;
     - `fixedSchedule`: `null`, because the matched line's fee is the whole price (US-05.2.5).
   - **Every unit rate goes through it.** `feeFor`'s RVG line, 23's Booking-level engine, the
     prepayment estimate path and the billing-line guards read `unitRateFor`; no other module
     computes a unit rate. Add a test that greps the billing folder for a second derivation, or
     assert through `feeFor` fixtures that each basis prices at `unitRateFor`'s figure.
   - **Whole-Procedure pricing.** On a defined-rate Contract, all of the Procedure's billable units
     after 23's rule (the primary's B, T and its 3/2/2 modifier share; an additional Procedure's T and
     share) are priced at the Contract's rate, in place of the anaesthetist's unit value. B, T and M
     are recorded exactly as on any Contract.
   - **Phase 39b's hook.** Export `unitRateFor` so 39b's dated UNIT x RATE line prices its units
     through it. Build no billing line here.
   - **Tests:**
     - **R1.** No Contract and the RVG Default Hospital: Dr Souter's unit value.
     - **R2.** A defined rate of $26.50 on 12 units prices $318.00, and the anaesthetist's unit value
       is ignored.
     - **R3.** A 10% discount off $30.00 gives $27.00 per unit; a 12.5% discount off $33.33 rounds the
       rate to cents once.
     - **R4.** A rate step changing across two List dates (18's `rateInForce`): each date prices at
       its own step.
     - **R5.** A fixed-schedule Contract returns `null`, and the fee is the matched line's.
     - **R6.** A multi-procedure Booking on a defined-rate Contract under 23's rule: every
       Procedure's units price at the Contract's rate, and the 3/2/2 shares are unchanged.
     - **R7.** Parity: every seeded Contract other than Aria prices to the cent as before.
3. **Retire the hourly line.**
   - `AddBillingLineSheet` loses the "Rate × time (hourly)" option, its hours and rate fields, its
     live preview and `rateTimePermitted`. The sheet offers the fixed amount line only, until 39b
     adds preset types and the UNIT x RATE line. Update its header comment.
   - `BillingLinesCard` loses its `rateTime` row branch and its "Method 3 gate" comment.
   - `billingLineActions` loses the `'rateTime'` input and the Method 3 refusal.
   - `validateBookingForBilling` loses `INDIVIDUAL_ARRANGEMENT_MESSAGE`, the Method 3 gate and 18's
     "a `rateTime` Contract needs a rate x time line" rule.
   - `fee.ts` loses the `rateTime` branch in the non-RVG line loop.
   - `fieldLabels` drops `permitsIndividualArrangement`; `auditNarrative` narrates an
     `agreedUnitRate` step as "Contract defined rate $26.50 per unit".
   - Update the tests that construct `rateTime` (code entry points), re-expressing each as a
     defined-rate case or deleting it where it only tested the gate.
4. **Contract editor: the defined-rate basis** (`ContractEditSheet`, 18's Pricing section). Covers
   US-04.2.2 AC 1 and AC 3, and US-05.2.6.
   - The basis selector's fourth option ("Rate x time", `PRICING_BASIS_LABEL`) goes. The options are
     "Anaesthetist's unit value", "Contract defined rate" and "Fee schedule".
   - "Contract defined rate" opens 18's rate steps with a segmented control **$ per unit · %
     discount**. "$ per unit" is a mono field labelled "Contract defined rate ($ per unit)", caption
     "Prices the whole procedure at this rate instead of the anaesthetist's unit value." "% discount"
     keeps 18's field and caption.
   - The provisional note (drift check 4) sits beside the selector, once.
   - `PRICING_BASIS_LABEL.rvgUnitsContractRate` reads "Contract defined rate"; the Contract catalogue
     (`ContractsView`) shows it as the basis pill, with the step in force in mono ("$26.50 per unit",
     or "10% discount" for a discount step, so a discount is never read as a defined rate).
   - **Store.** `ContractInput` and `ContractEditPatch` refuse a `rateTime` basis; the existing
     rate-step validation (rate above 0, percent above 0 and up to 100) stays.
   - **Office Booking total and Review.** The RVG fee line's rate caption reads from `rateSource`:
     "at Dr Souter's unit value $30.00", "at the Contract defined rate $26.50" or "at a 10% Contract
     discount, $27.00". The anaesthetist surfaces show none of it (2026-09-28 ruling).
   - **Invoice.** The anaesthesia line on a defined-rate Contract quotes "n units at $26.50", the
     same layout 22 uses for the agreed rate.
   - **Hooks:** `data-shot="contract-pricing-basis"` (if 18 left none) and `data-shot="fee-rate-source"`
     on the office rate caption.
5. **Seed: re-express the hourly Contract, then green and the persist bump.**
   - **The Aria Contract** (`CT-ARIA-HOURLY`; keep the system id, which no screen shows, so later
     phases and recipes keep resolving it). Rename the code key `ariaHourly` to `ariaDefinedRate`,
     and the name to "Aria Skin and Laser Clinic, Contract defined rate". Its basis becomes
     `rvgUnitsContractRate` with one `agreedUnitRate` step of **$26.50** from 2025-06-01 (the figure
     today's `type2Detail` already carries), holder and scope as 18 left them. It is not a default
     and gets `allowsAnaesthetistAdjustment: false` in session 2.
   - **Fitzgerald's Wed 15 Jul Booking** (completed, today 3.0 hours at $480 = $1,440 with no
     procedure code). Give its Procedure 19's abdominoplasty master entry (its base from the default
     RVG Contract, through 19a's resolver), start and handover that give the same 3 hours (08:30 to
     11:30, inside its 11:45 completion), and an ASA class. Drop the rate x time line (this frees one seeded billing-line id and its audit entry id: if
     later ids shift, confirm no test, recipe, ATLAS entry or guide beat pins them, and record it in
     the phase entry). Its fee becomes
     (B + T + M) x $26.50, with T from 19a's time tiers (3 hours = 8 + 6 = 14 time units under OQ-75's
     round-up). Pin the new figure in `seed.test.ts` and `billingRun.test.ts` in place of $1,440, and
     check no demo-guide beat or Control Panel text quotes $1,440 (none does at 3d3a18c).
   - **Souter's Mon 27 Jul capture Booking** (Heather Sinclair, "Laser skin resurfacing", uncaptured).
     Keep it uncaptured on the Aria Contract; its description drops "individually arranged hourly
     rate". It becomes the "Contract defined rate" capture Booking: captured like any other, priced
     at $26.50 per unit on the office side.
   - **Markers.** `SEED_MARKERS.rateTimeBooking` becomes `definedRateBooking` ("Contract defined rate
     Booking"), `rateTimeCaptureBooking` becomes `definedRateCaptureBooking`, and
     `individualArrangementContract` becomes `definedRateContract`, with the details re-worded (no
     "Method 3", "hourly" or "individual arrangement"). Update `DemoData.tsx`.
   - **Determinism.** Edit only these explicit scenario rows; touch no generator or RNG input. The
     generated canvas and every other figure (S3's Holt and Prentice, the bariatric $2,800 and $950,
     S4, S5) are unchanged: R7 and the seed tests prove it.
   - **Persist.** Bump `PERSIST_VERSION` by one from the value Phase 23 left (a stored `rateTime`
     line in a stale state would otherwise survive).
   - **Session 1 ends here:** `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run
     shots` green, the Decisions-log entries for the defined rate written (item 17), and the US-05.2.6
     and US-04.2.2 recipes handled in the Catalogue screenshots step if session 2 might not follow at
     once.

### Session 2: the anaesthetist adjustment

6. **Model** (`domain/types.ts`). Satisfies DM-14.
   - **Rename** `PriceOverride` to `OfficeOverride` and `Procedure.priceOverride` to
     `Procedure.officeOverride`. The union is unchanged: `fixedFee`, `dollarAdjustment` or
     `percentAdjustment`, each with a mandatory `reason`. Add `by` and `atISO`, the same shape
     `BookingCancellation` uses, so Review and the Booking can say who set it without reading the
     audit trail.
     - **Why rename:** with two layers, a field called "price override" that the anaesthetist no
       longer writes is a trap.
     - **Where:** rename in one pass through the code, seed, tests, `seed/audit.ts` and the audit
       labels.
   - **Add** `Procedure.anaesthetistAdjustment?: AnaesthetistAdjustment`, where the type is
     `{ kind: 'percentDiscount'; percent: number; reason; by; atISO } | { kind: 'fixedFinal';
     amount: number; reason; by; atISO }`.
     - `percent` is a positive discount, so 10 means 10% off. The range is greater than 0 and at
       most 100, and decimals are allowed (test F uses 12.5).
     - `amount` is the Procedure's whole final price ex GST, 0 or more.
     - There is no dollar kind (drift check 2).
   - **Add** `Contract.allowsAnaesthetistAdjustment: boolean`, always present and never optional,
     so every seeded and created Contract says yes or no explicitly (US-04.2.2 AC 5).
7. **Pure rules** in a new `src/domain/billing/adjustments.ts`, re-exported from the billing index,
   with Vitest tests in `adjustments.test.ts`:
   - **`adjustmentAllowed(contract)`**: true only when the Contract exists and
     `allowsAnaesthetistAdjustment` is true. A Procedure with no Contract is never allowed.
     US-04.2.2 AC 5, US-05.4.1.
   - **`btmRecordedInFull(procedure, primary, ctx)`**: the FT-03.5 gate "once BTM units are
     recorded in full". Since Phase 23, B and M belong to the Booking's primary Procedure (an
     additional Procedure has base 0 and no ASA of its own), so they are read from `primary`; T is
     read from the Procedure itself. It is true when:
     - **B:** 19a's base-unit resolver returns a base for the **primary**: from its procedure's
       default RVG Contract, a Contract override, or the value the anaesthetist entered. Under D3 any
       entered value counts, including one outside a ranged code's published range (that raises 19's
       after-procedure office warning, never a block, and never hides the adjustment);
     - **T:** this Procedure's start and handover are both recorded, and handover is after start;
     - **M:** the **primary's** ASA class is recorded.

     For the primary itself, `primary` is the same Procedure. Test both: an additional Procedure
     passes once its own times and the primary's B and ASA are recorded, and fails while the
     primary's ASA is blank (this is what makes test G2 reachable). Also test that a primary with
     an out-of-range base value (D3) counts as B recorded.

     **Rule for M (a prototype reading).** M counts as recorded once the primary's ASA class is set,
     because the ASA class is the one modifier every anaesthetic carries. Other modifiers can
     legitimately be none. The validator does not require ASA today, so this is a new check, not an
     extracted one. Record it in the Decisions log.

     **One source for the B and T checks.** Extract the validator's existing base-code and time
     checks into a shared predicate that both `validateBookingForBilling` and this helper call. Do
     not copy them, so completion and the adjustment gate cannot disagree.

     A Procedure with no base at all (no procedure chosen yet) is never "recorded in full", so the
     field never shows for it. The gate reads only the resolver, never a copied base-unit source.
   - **`applyAdjustmentLayers(baseTotal, adjustment, allowed, override)`** returns `{
     beforeAdjustment, adjustment: AppliedAdjustment | null, afterAdjustment, override:
     AppliedOverride | null, total }`. `AppliedAdjustment` is `{ adjustment, permitted: boolean,
     before, after }`.
     - **Adjustment:**
       - `percentDiscount`: `roundToCents(base * (1 - percent/100))`.
       - `fixedFinal`: `roundToCents(amount)`.
     - **A stored adjustment the Contract does not allow** is returned with `permitted: false` and is
       **not applied**. The engine never discounts against the Contract. The validator and Review
       surface it (items 9 and 13), so it is never silent.
     - **Office override,** applied to `afterAdjustment`:
       - `fixedFee` replaces it;
       - `dollarAdjustment` adds to it;
       - `percentAdjustment` scales it.
     - **US-03.5.2:** B, T and M units are never touched. The function only sees money.
   - **Tests:** the worked examples. Set the fixture's anaesthetist unit value to $30.00.
     - **A.** RVG at the anaesthetist rate, Contract allows. 12 units = $360.00. A 10% discount gives
       $324.00. An office +$20.00 gives **$344.00**, with `beforeAdjustment` 360, `afterAdjustment`
       324 and `total` 344.
     - **B.** A fixed final of $300.00 on the same base gives $300.00. An office -10% gives
       **$270.00**.
     - **C.** A 100% discount gives **$0.00**, while `btm` and `billableUnits` (12) are unchanged.
       An office fixed fee of $50.00 then gives $50.00. An office percent on the $0.00 stays $0.00.
     - **D.** A fixed-fee Contract that allows adjustment. A schedule line of $2,800.00 with a 10%
       discount gives $2,520.00. An office fixed fee of $2,650.00 gives **$2,650.00**.
     - **E.** A fixed-fee Contract that does not allow adjustment (the Doyle bariatric shape). A
       stored 10% discount gives `permitted: false` and a total of $2,800.00. An office -$100.00
       gives **$2,700.00**. This proves the office override works over a fixed fee (US-05.4.2).
     - **F.** Rounding: 12.5% off $333.33 gives $291.66.
     - **G.** Order matters. A 10% discount followed by an office fixed fee of $400.00 gives $400.00.
       A fixed final of $300.00 followed by an office +$25.00 gives $325.00.
     - **H.** No layers: the total equals the base, to the cent, for every seeded Contract basis.
       This is the parity test.
     - **I.** A defined-rate Contract that allows adjustment (a fixture, not Aria). 12 units at the
       Contract's $26.50 = $318.00, not the anaesthetist's $360.00. A 10% discount gives $286.20. An
       office +$20.00 gives **$306.20**. On the same Contract with adjustment not allowed, a stored
       10% is `permitted: false` and the total is $318.00.
8. **Engine wiring** (`fee.ts` and Phase 23's Booking-level engine):
   - **Per-Procedure layering.** Replace the override block in `feeFor`. The per-Procedure base
     that 23's engine produces (after the multi-procedure rule and the 3/2/2 split, at
     `unitRateFor`'s rate) goes through `applyAdjustmentLayers` with that Procedure's own Contract
     permission.
   - **Booking total** = the sum of the per-Procedure totals.
   - **`FeeResult`** gains `adjustment: AppliedAdjustment | null` and `afterAdjustment`.
     - `subtotal` stays the base, before any layer.
     - `override.before` becomes `afterAdjustment`.
     - Update every reader:
       - `procedureFee` and `bookingFee` in `feeContext.ts`, or 23's Booking view;
       - `ReviewScreen`;
       - `invoiceBuild`;
       - `billingRun`;
       - the prepayment estimate path.
   - **Test G2, a multi-procedure Booking under 23's rule.** An adjustment on the additional
     Procedure changes only that Procedure's post-rule fee. The primary's fee and the 3/2/2 unit
     shares are unchanged.
   - **Payment setting (22).** Confirm a SPLIT Contract's share is taken from the Procedure's
     **final** total, after both layers, and a FULL Contract bills that final total. 22's planned
     `splitFee` caps an amount share at the fee (`min(amountExGst, fee)`), so a discount below a
     fixed holder share gives the holder the whole fee and a zero remainder, which raises no
     remainder invoice. Add that test: the remainder never goes negative. Only if 22 left no cap,
     the validator refuses instead: "The adjustment takes the fee below the amount {holder} covers.
     Change the adjustment or the override."
   - **23's not-billable rule (a prototype reading).** A Procedure that 23's multi-procedure rule
     prices as `notBillable` is treated as not allowed by `adjustmentAllowed`'s caller: no field,
     and a fixed final price can never put a charge on it. Log it.
9. **Validator** (`validateBookingForBilling`). Every message is verbatim and has no dashes.
   - `anaesthetistAdjustment` reason blank: "Give a reason for the adjustment."
   - Percent out of range: "Enter a discount above 0 and up to 100 percent."
   - Negative fixed final: "The final price cannot be negative."
   - Stored but not permitted: "{Contract} does not allow an anaesthetist adjustment. Remove it."
   - `officeOverride`: keep the existing reason and "makes the fee negative" checks, re-keyed to
     the new field and computed on the layered total.
   - The failure fields are `anaesthetistAdjustment` and `officeOverride`, so the capture latch
     anchors each to its own card.
   - These are completion checks on invalid billing data, like 21's required inputs, not 15a
     warnings. Register no warning rule and add no "Raise sample warnings" sample: the routine and
     its to-do list are untouched by this phase.
   - Update `validateBookingForBilling.test.ts`.
10. **Store actions** in a new `src/store/adjustmentActions.ts`, exported from `store/index.ts`,
    each through `mutate()` with before and after metas and the demo clock:
    - **`setAnaesthetistAdjustment(api, actor, procedureId, input | null)`**
      - **Rights:** `editRefusal` first, so only the anaesthetist on their own DRAFT List passes.
      - **Refusals:**
        - `officeRole`: "The adjustment is the anaesthetist's. Use the office price override."
          Exception: the office may pass `null` to clear an adjustment the Contract no longer
          allows. That is the only office write, and it is audited.
        - `integrationSource`.
        - `adjustmentNotAllowed`: "{Contract} does not allow an anaesthetist adjustment."
        - `btmNotRecorded`: "Record base, time and modifier units before adjusting the price."
        - `reasonRequired`.
        - `percentOutOfRange` and `finalPriceNegative`.
      - **Clearing.** `adjustmentNotAllowed`, `btmNotRecorded` and the input checks apply only to a
        non-null input. The anaesthetist may always pass `null` on their own DRAFT List, including
        for an adjustment the Contract no longer allows, so the validator's "Remove it." (item 9) is
        always actionable on the phone.
      - **Writes** `by` and `atISO`, and audits `procedure.anaesthetistAdjustment`.
      - Covers FT-03.5, US-03.5.1 AC 1 and AC 2, and US-05.4.1.
    - **`setOfficeOverride(api, actor, procedureId, input | null)`**
      - **Rights:** office only, on DRAFT or SUBMITTED. The anaesthetist is refused with "Only the
        office can set a price override."
      - **Rules:** the reason is required, and the override is allowed whatever the Contract says,
        including a fixed fee (US-05.4.2, OQ-16).
      - **Writes** `by` and `atISO`, and audits `procedure.officeOverride`.
    - **`ProcedurePatch`** omits `anaesthetistAdjustment` and `officeOverride`. `editProcedure` also
      refuses them at runtime (`useDedicatedAction`), so no path bypasses the gates. Test both.
    - **Contract change clears a disallowed adjustment.** Phase 20's `setProcedureContract` does
      this in the same `mutate()`, with a second meta, when the new Contract does not allow
      adjustment and an adjustment is stored. The meta is `procedure.anaesthetistAdjustment`, with
      `after: undefined` and a note "Removed: {Contract} does not allow an anaesthetist adjustment".
      The Contract picker sheet warns before the tap: "Your 10% discount will be removed. {Contract}
      does not allow adjustments."
    - **Tests** (`adjustmentActions.test.ts`):
      - each refusal;
      - the rights matrix across DRAFT, SUBMITTED and AUTHORISED for anaesthetist, office and
        integration;
      - the audit entries;
      - the Contract-change clear, with two metas and one state change;
      - the office clear of a disallowed adjustment only;
      - the anaesthetist's clear of a disallowed adjustment, and of one with BTM no longer recorded.
11. **Contract rule: editor and store.** Covers US-04.2.2 AC 5.
    - **Store.** `ContractInput` and `ContractEditPatch` gain `allowsAnaesthetistAdjustment`.
      `createContract` defaults it to false when the caller omits it. Phase 18's "add hospital
      creates its RVG Default Hospital" path and 19a's default RVG Contract creation write false
      explicitly.
    - **Contract detail panel** (`ContractEditSheet`, the Pricing section, below item 4's basis).
      Add a Segmented control, "Anaesthetist adjustment", with the options "Not allowed" and
      "Allowed: % discount or fixed final price". The caption reads: "When allowed, the
      anaesthetist can discount the fee or set a final price, with a reason. The office can always
      override."
    - **Contract catalogue** (`ContractsView`). Allowed Contracts carry a neutral pill "Anaesthetist
      may adjust".
    - **Labels.** `FIELD_LABELS.allowsAnaesthetistAdjustment` is "Anaesthetist may adjust the price",
      so History reads correctly.
    - **Hooks:** `data-shot="contract-adjustment-rule"`.
    - **Tests:** create, edit and audit in `mastersActions.test.ts` or `contractActions` tests.
    - **Before Phase 25.** Toggling the flag off on a Contract in use leaves stored adjustments in
      place. They go "not permitted" (items 7, 9 and 13) until someone removes them. Phase 25's
      versions make this a per-version value.
12. **Anaesthetist capture UI.** `shared/capture/OverrideCard.tsx` is replaced by
    `shared/capture/AdjustmentCard.tsx`, imported directly by `BtmCaptureBlock` as `OverrideCard` is
    today (it is not in `shared/capture/index.ts`). Delete `OverrideCard.tsx`. The same component
    serves mobile and the anaesthetist web app through `useSurface()`.
    - **Contract does not allow it and nothing is stored:** render nothing. The field is not offered
      at all (US-04.2.2, US-05.4.1). `BillingLinesCard` takes the full row: make `Pair` handle a
      single child, or mount it alone. A stored adjustment the Contract no longer allows still
      renders, read-only, as below, so it is never silent.
    - **Allowed, but BTM not recorded in full:** show the section titled "Price adjustment" with a
      single caption, "You can discount the fee or set a final price once base, time and modifier
      units are recorded." Show no inputs. It appears live as capture completes, because it reads the
      store.
    - **Allowed and recorded:**
      - a Segmented control with **None · Discount % · Final price**;
      - "Discount %" is a mono field, placeholder 10, taking more than 0 and up to 100 (decimals
        allowed);
      - "Final price $" is a mono field, placeholder 450.00;
      - "Reason (required)" is free text;
      - "A reason is required before the adjustment can be saved." shows in the warning on-tint while
        the reason is blank;
      - **Save adjustment** is the teal secondary action and commits on Save, never per keystroke;
      - at 100%, the caption reads "Base, time and modifier units stay recorded. Nothing is charged."
        (US-03.5.2).
    - **No money shown.** Show no calculated fee and no unit rate (the 2026-09-28 ruling; drift
      check 3).
    - **The office override.** When an office override exists, the anaesthetist sees one read-only
      caption, "The office has also set a price override on this procedure.", with no figures.
    - **Read-only views** (a SUBMITTED or AUTHORISED List, or the office viewing): "Discount 10% ·
      {reason} · Dr {surname}" or "Final price $300.00 · {reason} · Dr {surname}", using
      `drSurname` from `shared/format.ts`.
      - **If the adjustment is not permitted:** add a warning-tint line "{Contract} does not allow an
        anaesthetist adjustment. It is not applied."
      - **Remove:** a teal link that clears it. The office's calls the office clear from item 10; the
        anaesthetist gets the same link on their own DRAFT List (a `null` write). The editable card
        never offers inputs for a not-permitted adjustment.
    - **Anchors.** Replace `'priceOverride'` in `BtmCaptureBlock`'s anchored set with
      `'anaesthetistAdjustment'`. The card carries `validationTarget` for that field, so "Mark
      complete" scrolls to it and focuses it.
    - **Remove the office's copy.** The office no longer edits a price from the capture block. Its
      override lives only in office billing setup (item 13).
    - **Copy.** Delete `OverrideCard`'s "Adjustment and charge", "Percentage adjustments are set by
      the office.", "Adjustment $", "Charge $" and "Charge amount $" copy. The office
      `PriceOverrideSheet` keeps its own "$ adjust" mode and "Adjustment $ (negative reduces)" label:
      the office override keeps all three kinds. Update the sheet's header comment, which describes
      `OverrideCard`.
    - **Hook:** `data-shot="adjustment-card"`.
13. **Office surfaces** (Admin; the office web Booking detail and Review). Covers FT-05.4 and
    US-05.4.2.
    - **Office billing setup rows:**
      - **Anaesthetist adjustment:** "None", "Discount 10% · Dr Morrison", "Final price $300.00 · Dr
        Morrison", or a warning chip "Not allowed by {Contract}".
      - **Office override:** the renamed Override row. The "Price override" button keeps its name,
        so the Playwright spec's locator holds.
    - **`PriceOverrideSheet`** (office only):
      - It writes through `setOfficeOverride`.
      - It shows context lines above the type control, in mono: "Calculated $360.00" and "After the
        anaesthetist's 10% discount $324.00". The office then sees exactly what it overrides.
      - Its heading is "Office price override".
    - **Admin Booking total** (the total props). Add `adjustmentNote` beside `overrideNote`.
      - For one Procedure: "Calculated $360.00 · anaesthetist discount 10% · $324.00" and "Office
        override · was $324.00". On a defined-rate Contract the "Calculated" figure sits under item
        4's rate caption, so the office reads rate, adjustment and override top to bottom.
      - For several: "Adjusted on n of m procedures" and the existing override count sentence.
      - The total panel renders both lines. The mobile Booking total still renders nothing.
    - **Review** (`ReviewScreen`, `reviewFlags.ts`, which stays pure with new inputs as parameters):
      - The **Fee** cell shows the final Booking fee. When any layer applies, it adds a second mono
        line in mist, "was $360.00", giving the base before any layer.
      - **Flags:**
        - "Discount 10% by Dr {surname}" or "Final price by Dr {surname}" (neutral);
        - "Office override" (neutral);
        - "Adjustment not allowed by {Contract}" (warn).
      - The flags tile and the "flags open" count pick these up. Test them in `reviewFlags.test.ts`.
    - **Hooks:** `review-adjustment-flag`, `office-override-sheet`, `booking-total-layers`.
14. **Invoice** (`invoiceBuild.ts`; the layout from 22). Covers FT-05.4.
    - After a Procedure's fee lines, add up to two visible delta lines on the Procedure's billable
      party group:
      - "Anaesthetist adjustment, 10% discount, {reason}", or "Anaesthetist adjustment, agreed final
        price, {reason}", with amount `after - before`;
      - then the existing "Price override, {reason}", with amount `total - afterAdjustment`.
    - A not-permitted adjustment raises no line.
    - **On a SPLIT Contract (22):** the delta lines sit on the remainder invoice with the full fee
      lines, before "Less paid by {holder}". The holder's single share line quotes the final fee.
    - This follows the Phase 08 pattern, which carries the reason on the line. Do not change that
      pattern here, but raise with the owner whether reasons should print on a customer invoice.
    - A 100% discount gives a $0.00 group, and a $0.00 group raises no invoice (the existing rule).
      B, T and M stay on the Booking.
    - **Tests** (`invoiceBuild.test.ts`, `billingRun.test.ts`):
      - both lines, in order, reconciling to the invoice subtotal to the cent;
      - the 100% case raises no invoice and leaves the units intact;
      - the not-permitted case;
      - S3's figures are unchanged: Holt $396.18, Prentice $152.38 and $91.43, or the figures Phase
        22 re-based them to; Aria's figure is session 1's.
15. **Seed, then the persist bump.**
    - **Contracts** (`contracts.ts`, labelled demo readings):
      - `allowsAnaesthetistAdjustment: true` on **RVG Default Post-paid** (`CT-RVG-POSTPAID`, new in
        Phase 18). The anaesthetist bills their own patient and may discount.
      - `false` on every other Contract: each RVG Default Hospital, 19a's default RVG Contracts, nib,
        SXAP, Health NZ, both ACC, Doyle bariatric, the CES HNZ schedule, 22's nib split Contract,
        23's combination Contracts and the Aria Contract defined rate Contract, whose rate is already
        agreed with the clinic.
      - If 18 to 21 seeded another patient-direct RVG Contract, it is true there too.
    - **The capture beat.** Dr Souter needs an uncaptured Booking on RVG Default Post-paid on a
      DRAFT List of hers.
      - Put it on her pinned Mon 27 Jul List, beside the Aria defined-rate capture Booking
        (`SEED_MARKERS.definedRateCaptureBooking`), so one List shows both states: the field offered
        on one Booking and absent on the other. Reuse an existing Booking if 20 or 21 already seeded
        one there.
      - Otherwise add one explicit scenario Booking, "Excision of skin lesion, self funded", for a
        pinned patient with a fixed valid NHI and an email. Record it as
        `SEED_MARKERS.adjustmentCaptureBooking`.
      - Add nothing to the generator, and touch no RNG input.
    - **Ids stay put** (Phase 23's pattern). Build both new Bookings (this one and the Review beat's)
      after every existing seeded Booking, 23's included, and use pinned patients created without
      `takePatient()`, so their Booking, Procedure, patient, line and audit ids are allocated last and
      no existing id moves. Recipes start on fixed ids (BK0001, BK0009, BK0010, BK0028, BK0031,
      BK0037): the seed test asserts the existing ids are unchanged.
    - **The Review beat.** On Dr Morrison's Mon 20 Jul SUBMITTED List (`SEED_LIST_IDS.morrisonMon20`,
      S2 Beat 4, which quotes no figures), one completed Booking on RVG Default Post-paid carries a
      seeded **10% discount**, reason "Long-standing patient, courtesy discount".
      - At 3d3a18c every Booking on that List is St George's hospital-billed (default or ACC), so
        none is on Post-paid. Unless 20 or 21 already put one there, add one explicit, fully
        captured scenario Booking at the end of the List (self funded, a pinned patient with a fixed
        valid NHI and an email, primary with ASA). Seed its Contract selection so it raises no Phase
        20 "Contract changed by anaesthetist" flag (office-set or already approved, whichever 20
        provides), so the adjustment is the only new flag on the row.
      - Check S2 Beat 4's counts, any Review-count assertions in tests and the `US-07.2.3` recipe
        (which shoots this List's Review) after adding it.
      - It gets a matching seeded audit entry by Dr Morrison in `seed/audit.ts`.
      - Record it as `SEED_MARKERS.adjustedBooking`.
      - Do not use the Booking that Phase 20 gave the "Contract changed by anaesthetist" flag.
    - **Seed tests:**
      - every seeded adjustment is permitted by its Contract and has a reason;
      - every seeded Booking with an adjustment has BTM recorded in full (`btmRecordedInFull`);
      - no seeded `officeOverride` has an anaesthetist `by`;
      - the S3 and S5 invoice figures and session 1's Aria figure are unchanged;
      - the generated canvas is unchanged.
    - **Persist.** Bump `PERSIST_VERSION` by one from the value session 1 left.
16. **Copy, labels, audit and shots.**
    - **Labels:**
      - `ACTION_LABELS`: `procedure.anaesthetistAdjustment` "Anaesthetist adjustment" and
        `procedure.officeOverride` "Office price override".
      - `FIELD_LABELS`: `anaesthetistAdjustment` and `officeOverride`. Drop `priceOverride`.
    - **`auditNarrative.formatShape`:**
      - `percentDiscount` gives "Discount 10% · {reason}";
      - `fixedFinal` gives "Final price $300.00 · {reason}";
      - the office kinds keep today's wording;
      - `by` and `atISO` are not rendered twice.
      - Update `auditNarrative.test.ts`.
    - **Playwright:**
      - `admin-phase06.spec.ts` still passes on the renamed sheet heading. Update its text
        expectations (l.55's `/Adjustment .*10%/` must match the Office override row, not the new
        "Discount 10%" adjustment row) and re-shoot `a-05-override.png`.
      - Rewrite `booking-attachments.spec.ts`'s equal-height check to use "Price adjustment" on an
        allowing Booking, and assert the card is absent on a non-allowing one.
      - Add shots: `adjustment-card` (mobile and web, allowed and before BTM),
        `review-adjustment-flag`, `contract-adjustment-rule`, and session 1's `contract-pricing-basis`
        on the Aria Contract and `fee-rate-source` on Fitzgerald's Booking.
    - **Copy:** no en or em dashes anywhere. Teal on every new action. Crimson nowhere.
17. **Decisions log** (PROGRESS.md), superseding and recording:
    - **Superseded (session 1):** the Method 3 hourly rate line (5th review #1, "the Method 3 gate":
      rate x time capture offered only under a Contract with `permitsIndividualArrangement`), Phase
      18's `rateTime` interim and its "needs a rate x time line" rule, and the Decisions log
      2026-07-23 reading that kept Fitzgerald's hourly Booking as Phase 08's billing exemplar. The
      Contract defined rate is a unit rate on the Contract, pricing the whole Procedure through
      `unitRateFor`; RV-24 is closed.
    - **Superseded (session 2):** the 2026-07-22 seventh review A6/B5 half that reads "mobile's
      legacy Adjustment/Charge fields now write the typed $/fixed overrides". The anaesthetist now
      writes a separate, Contract-gated percent or fixed final adjustment, and the office's full
      typed editor is the only override. RV-11 is closed. `OverrideCard`'s header comment goes with
      it.
    - **Superseded:** Phase 08's single "Price override" invoice line. There are now two layered
      delta lines.
    - **Readings:**
      - the Contract defined rate is the agreed contract rate per unit and prices the whole
        Procedure (OQ-89's recommendation, provisional in one place); the UNIT x RATE line is 39b's,
        through the same function;
      - `CT-ARIA-HOURLY` keeps its system id under its new name;
      - M counts as recorded once the primary's ASA class is set, and an additional Procedure reads B
        and M from the primary (Phase 23's model);
      - the office does not edit the anaesthetist's adjustment, only overrides on top of it, apart
        from clearing a disallowed one;
      - a stored, disallowed adjustment is never applied and is always flagged, and the anaesthetist
        can always remove their own on a DRAFT List;
      - a Procedure priced `notBillable` by 23's rule is not offered the adjustment;
      - a Contract change clears a disallowed adjustment, with a warning first;
      - the anaesthetist still sees no fee and no rate (drift check 3; the owner's answer if one
        came);
      - the domain model lists `AMOUNT` and `RATE_TIME`, and the stories win (drift check 2);
      - the adjustment is a price change only and never stands in for a base-unit override; a base
        unit overridden consistently is fixed in the procedure's default RVG Contract (US-04.2.2
        note, OQ-62), so nothing in the app detects or reports it.

## Demo triggers

**None.** Everything in this phase is normal use:
- **The defined rate** is seeded: the re-expressed Aria Contract carries a Contract defined unit rate
  of $26.50. Fitzgerald's completed Wed 15 Jul Booking on it prices its whole Procedure at the
  Contract's rate instead of her unit value, shown in the office Booking total, Review and the
  invoice. Souter's Mon 27 Jul Aria Booking is captured like any other (B, T, M, no hourly line, no
  money on the phone) and then prices the same way on the office side. No new button.
- the anaesthetist captures and adjusts on mobile or web;
- the office overrides in Admin Review or on the Booking;
- the office sets the pricing basis and the adjustment rule in Master data.

Nothing is automatic, scheduled or external. Register no trigger and add nothing to the Control
Panel.

**PWA:** no stand-in needed. The handset half of the beat (capture, then the field appearing, then
saving a discount with a reason) is complete on the phone. The office override and the defined rate
have no mobile side, because the anaesthetist sees no fee.

Check two things still work with a layered Booking and a defined-rate Booking:
- Phase 14's "Office authorises this List" PWA entry;
- the "Play the office" scaffold.

Authorising prices with both layers and at the defined rate, and touches neither the adjustment nor
the rate.

## Out of scope

- **The UNIT x RATE billing line** (US-03.3.6: a dated line outside BTM, priced as units x the
  Contract's rate) and the preset billing-line types: Phase 39b, through `unitRateFor`.
- **The lock at AUTHORISED (Phase 25).** US-05.4.1's "locked Contract" wording is met there. The
  lock records:
  - the unit rate and its source (the defined rate, the discount or the anaesthetist's value);
  - the adjustment, the permission it was applied under and its before and after amounts;
  - the office override.

  Until then the rate and the permission are read live from the Contract.
- Contract versions, and a per-version rate step and `allowsAnaesthetistAdjustment` (Phase 25).
- Fee schedule time bands, add-ons and quantity rules (OQ-89 question 3): Phase 18.
- Adjustment on the prepayment estimate (Phase 27). The estimate is set before BTM is recorded, so
  no adjustment can exist then. It prices at `unitRateFor`'s rate, and the balance invoice reads the
  final layered total.
- Adjustment or override on an additional invoice (Phase 38b, D10; free-form, no pricing rules).
- Ledger legs carrying the layered total (Phase 36).
- A dollar anaesthetist adjustment, a cap on the fixed final price, or an office edit of the
  anaesthetist's adjustment. Build none unless the drift check says so.
- Showing the anaesthetist any fee or rate, unless the owner answers drift check 3 with yes.
- Any change to base units, the multi-procedure rule or the Contract picker beyond item 10's clear
  and warning. Base units are 19a's.
- Detecting, reporting or warning on a consistently overridden base unit. The 2026-10-01 answer is
  that AA fixes its own default RVG Contract (US-04.2.2 note).
- A new warning rule. The stored-but-not-permitted adjustment is a completion check (item 9), and
  15a's routine is untouched.

## Manual test checklist

The agent runs every item itself in the running app and reports it with evidence; none is handed
to the owner (ROADMAP.md "Owner review: agents test themselves").

**Session 1 (defined rate):**
- [ ] **No hourly line.** Mobile and web, Dr Souter, Mon 27 Jul, Heather Sinclair's Aria Booking: Add
      billing line offers the fixed amount line only, with no "Rate × time" option and no "Method 3"
      or "hourly" wording anywhere. Capture B, T and M as on any Booking; no rate or fee shows on the
      phone or the anaesthetist web app.
- [ ] **Priced at the Contract's rate.** In Admin, open that Booking after capture, and Fitzgerald's
      Wed 15 Jul Aria Booking: the total's rate caption reads "at the Contract defined rate $26.50",
      and the fee is the billable units x $26.50, not x the anaesthetist's unit value. Review shows
      the same fee.
- [ ] **Invoice.** Bill Fitzgerald's Booking (authorise its List, or the state 15 to 23 left): the
      anaesthesia line quotes the units at $26.50 and the invoice goes to the Aria clinic as before.
- [ ] **Contract editor.** Master data, Contracts, the Aria Contract: the basis reads "Contract
      defined rate", $ per unit, $26.50, with the one provisional OQ-89 note. The basis selector has
      three options and no "Rate x time". Change the rate on a test Contract and see the fee follow
      on a DRAFT Booking that uses it; History narrates "Contract defined rate $x per unit".
- [ ] **Parity.** S3's Holt and Prentice figures, the bariatric $2,800 and $950 and S5 Beat 1 are
      unchanged.

**Session 2 (adjustment):**
- [ ] **Field absent where not allowed.** Mobile, Dr Souter, Mon 27 Jul: the Aria defined-rate
      Booking shows no Price adjustment section. So does any St George's default Booking (S1's Sarah
      Mitchell on Tue 28 Jul).
- [ ] **Gate on BTM.** On the same List, the RVG Default Post-paid Booking shows only "You can
      discount the fee or set a final price once base, time and modifier units are recorded." Choose
      the procedure, Start now, Finish now and ASA I. The Discount % / Final price control appears
      without a reload. If the procedure's code is ranged, a base value outside the range still
      opens the field (D3), and only 19's after-procedure office warning follows.
- [ ] **Reason required.** Choose Discount %, enter 10 and leave the reason blank: Save stays
      disabled with the warning. Add "Courtesy discount" and save. The read-only line reads
      "Discount 10% · Courtesy discount · Dr Souter", and no fee shows anywhere on the phone.
- [ ] **100% keeps the units.** Change it to a 100% discount. The caption says the units stay
      recorded, the B/T/M rows are unchanged, and Mark complete succeeds.
- [ ] **Web parity.** The anaesthetist web app shows the same card, gate and copy on the same Booking,
      in the desktop layout.
- [ ] **Office cannot write the adjustment, anaesthetist cannot override.** In Admin, the capture
      block shows the adjustment read-only with no inputs. On the phone there is no Price override
      control. `editProcedure` refuses both fields (unit-tested).
- [ ] **Contract change clears it.** On the phone, switch that Booking's Contract to St George's
      default. The picker warns that the discount will be removed. After confirming, the section
      disappears and History shows the removal.
- [ ] **Review shows both layers.** Admin, Review, Dr Morrison Mon 20 Jul: the adjusted Booking's
      Fee shows the final amount with "was $x", and the Flags show "Discount 10% by Dr Morrison".
      Open it, open Price override, and check the sheet shows "Calculated" and "After the
      anaesthetist's 10% discount". Apply +$20.00 with a reason. The total, Fee cell and flags show
      both layers.
- [ ] **Invoice shows both layers.** Authorise that List (S2 Beat 4). The patient's invoice shows the
      fee line, then "Anaesthetist adjustment, 10% discount, …", then "Price override, …", and it
      reconciles to the total.
- [ ] **Override over a fixed fee and a defined rate.** A Booking on the Doyle bariatric fixed-fee
      Contract shows no adjustment field, and the office can still apply a fixed fee override. The
      same holds on Fitzgerald's Aria Booking: no adjustment, and an office override applies on top of
      the defined-rate fee.
- [ ] **Contract rule in Master data.** Set "Anaesthetist adjustment: Allowed" on St George's RVG
      Default Hospital. Sarah Mitchell's Booking (after capture) now offers the field. Set it back:
      the saved adjustment shows "Not allowed by …" in Review and on the Booking, is not applied to
      the fee, blocks Mark complete for a DRAFT Booking with the validator sentence, and the Remove
      link clears it (the anaesthetist's on the phone, or the office's in Admin).
- [ ] **Scripted beats unbroken.** S1 Beat 3, S2 Beat 4, the S3 Beat 1 figures, S4 and S5 Beat 1 run
      as scripted.
- [ ] No en or em dashes in any new copy; teal on every new action; crimson nowhere new.
- [ ] Catalogue screenshots: the recipes for US-03.5.1, US-03.5.2, US-05.2.1, US-05.4.1, US-05.4.2,
      US-04.2.2 and US-05.2.6 are created or updated, US-05.2.2, US-05.2.5 and US-05.2.7 still pass,
      the Retired US-03.3.7, US-03.5.3 and US-05.2.4 recipes are handled as listed, any recipe this
      phase broke is re-pointed, a full `npm run capture` ends with no failed recipe
      and no story without a recipe, the covered items' new shots are checked by eye, and `npm run
      verify:board` is green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots` and `npm run
      verify:board` all green.

## Demo guide updates

In the same session as the change, patch these files in `docs/demo-guide/`, and the same sections of
`master-demo-guide.html`:
- **Session 1:**
  - **`04-presenter-cheat-sheet.md`, Contracts section** (as Phase 18 left it): the fourth basis line
    becomes "Contract defined rate: a $ per unit rate on the Contract that prices the whole
    procedure instead of the anaesthetist's unit value (Aria Skin and Laser Clinic, $26.50).
    Provisional: treated as the agreed contract rate (OQ-89)." Drop any "rate x time", "hourly" or
    "Method 3" wording.
  - **`02-workflows-and-handoffs.md`**, anaesthetist capture step 10: "She may record an allowed
    fixed or rate-by-time line, or an override with a reason." becomes "She may add a fixed billing
    line." (the adjustment half lands in session 2).
  - **`03-demo-script.md`:** no beat uses the hourly line at 3d3a18c; grep for "rate x time",
    "hourly" and "$1,440" and fix any that 15 to 23 added.
- **Session 2:**
  - **`03-demo-script.md`:**
    - **S1 Beat 3, "Worth pointing at":** Sarah's St George's Contract offers no price adjustment.
      Adjustments exist only where a Contract allows them. Add an optional aside: Mon 27 Jul, the
      self-funded Booking; capture BTM; the adjustment appears; save a 10% discount with a reason.
    - **S2 Beat 4, "Worth pointing at":** Dr Morrison's discounted Booking. Its Fee shows "was $x"
      and its flag names the discount. Add an optional office override live to show the two layers,
      then authorise.
    - **S4 and S5:** no change. Confirm the S5 Beat 1 History still reads cleanly with the renamed
      labels.
  - **`02-workflows-and-handoffs.md`**, capture step 10: "She may add a fixed billing line, and,
    where the Contract allows it, a percent discount or final price with a reason." Add an office
    review line: "The office can always apply a price override, on top of any anaesthetist
    adjustment."
  - **`01-personas-and-responsibilities.md`:** add the adjustment and override flags to the office's
    review responsibilities.
  - **`04-presenter-cheat-sheet.md`:** add a Contract rules line, "Anaesthetist adjustment: allowed
    per Contract, % or final price, reason required; office override always available".
- **Control Panel:** no trigger. Update the S2 scenario message in
  `src/apps/demo/DemoControlPanel.tsx` only if it lists the Review contents.

This is not a milestone phase. Phase 25 runs the next master-guide consistency read.

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19),
run after the review pass and before the PROGRESS.md entry, at the end of each session for the items
that session changed. Re-run `node docs/prototype-build/catch-up/tools/recipe-status.mjs 24` first:
earlier phases may have changed these recipes since this plan was written.

**Covered items.** When the phase is done, each recipe in `requirements-board/capture/recipes/`
matches what was built:

| Item | Recipe at plan time | When this phase is done |
|---|---|---|
| [US-03.5.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.5.1.md) Apply an anaesthetist adjustment, with required reason | partial · web-adjustment, mobile-adjustment (none, adjustment) | Captured. The existing recipes start on BK0009, a St George's default Booking whose Contract does not allow an adjustment, so move both to `SEED_MARKERS.adjustmentCaptureBooking` (Dr Souter's pinned Mon 27 Jul List, RVG Default Post-paid; take the id from the built seed). Re-shoot web and mobile, highlight `adjustment-card`: state `none` is the "Price adjustment" section with the None, Discount %, Final price control; `adjustment` is a discount typed with its required reason. Add a `not-offered` state (or shot) on the Aria defined-rate Booking beside it on the same List: no adjustment section where the Contract does not allow it. Add a `before-btm` state with the caption "once base, time and modifier units are recorded". Caption in the catalogue's words. Drop the partial reason. |
| [US-03.5.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.5.2.md) BTM still recorded in full at a 100% discount | captured · web-full-discount, mobile-full-discount | Stays captured. Same move off BK0009 to the adjustment Booking; keep the highlight on `units-row-b` and `units-row-m` and the 100% state, with the caption "Base, time and modifier units stay recorded. Nothing is charged." Keep the shot `name`s. |
| [US-05.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.2.1.md) Per-unit pricing rate | captured · admin-unit-values, admin-card-fee | Stays captured. The fee now comes through `unitRateFor` and the office total gains the rate caption ("at Dr Souter's unit value $x"): re-shoot `admin-card-fee` with `fee-rate-source` in the highlight. Keep the shot `name`s. |
| [US-05.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.2.2.md) Tiered time units | captured · web-time-units, mobile-time-units | Stays as 19a left it. This phase does not touch the time tiers; the `--dry` run is the check. |
| [US-05.2.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.2.5.md) Fixed fee schedule pricing | partial · admin-fixed-price | Stays as Phase 18 left it (its partial reason, time bands and add-ons, is 18's and OQ-89 question 3's). `unitRateFor` returns no rate for a fixed schedule, so the shot should not change; the `--dry` run is the check. |
| [US-05.2.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.2.6.md) Contract defined rate | captured · web-rate-time, mobile-rate-time (entry, added) | Captured, rebuilt. The existing shots add an hourly line on BK0037 through "Rate × time (hourly)", which this phase removes, so both shots fail. Replace them with `admin-defined-rate`: state `contract` on the Aria Contract's detail panel in Master data, highlight `contract-pricing-basis` ("Contract defined rate", $26.50 per unit); state `booking` on Fitzgerald's Wed 15 Jul Booking (`SEED_MARKERS.definedRateBooking`) in Admin, highlight `fee-rate-source` ("at the Contract defined rate $26.50") with the fee. Caption in the catalogue's words: "the procedure priced at the Contract's specified unit rate". No anaesthetist shot (the anaesthetist sees no rate). |
| [US-05.2.7](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.2.7.md) GST | captured · admin-invoice-gst | Stays captured. INV0001 is not an Aria invoice; the `--dry` run is the check. |
| [US-05.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.4.1.md) Apply anaesthetist adjustment | partial · web-adjustment, mobile-adjustment (entry, applied) | Captured. Same move off BK0009. `entry` shows the reason required; `applied` shows the adjustment applied with no money on the anaesthetist screen (the 2026-09-28 ruling). The old caption "the Booking total shows the fee before it" goes. Add the office side: `admin-adjustment-layers` on the seeded `SEED_MARKERS.adjustedBooking` (Dr Morrison, Mon 20 Jul List `SEED_LIST_IDS.morrisonMon20`) with `booking-total-layers` ("Calculated $360.00 · anaesthetist discount 10% · $324.00") and `review-adjustment-flag` on `/admin/review/<that List>`. Drop the partial reason. |
| [US-05.4.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.4.2.md) Office price override | captured · admin-price-override (entry, applied) | Stays captured. The sheet is renamed "Office price override" and shows "Calculated" and "After the anaesthetist's discount" context lines; the "Price override" button keeps its name. Re-shoot both states (`office-override-sheet`), moved off BK0009 to the seeded `SEED_MARKERS.adjustedBooking` (Dr Morrison, Mon 20 Jul) so the "After the anaesthetist's 10% discount" context line shows. |
| [US-04.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.2.md) Contract pricing and adjustment rules | captured · admin-pricing-basis (type-1, type-2, type-3, rate-time) | Stays captured. Re-shoot the basis states (Phase 18 rebuilt the sheet): the anaesthetist's unit value, the Contract defined rate ($ per unit on Aria, and % discount on a discount Contract) and the fee schedule. The `rate-time` state goes; rename it `defined-rate`. Add `adjustment-rule` highlighting `contract-adjustment-rule` ("Anaesthetist may adjust the price") for RVG Default Post-paid, with a second state on a Contract where it is off. |

**Recipes this phase breaks.**
- **Retired recipes still run.** `npm run capture` runs every recipe whose item exists, Retired
  ones included, and a merged story keeps showing the retired item's images (`assets/<retired ID>/`)
  in its own `images` list. So:
  - `US-05.2.6` (above).
  - `US-03.3.7` (Retired, merged into US-03.3.6). Its recipe clicks "Add billing line" and the hourly
    option on Heather Sinclair's Booking, and US-03.3.6 still lists its `web-rate-time.png` and
    `mobile-rate-time.png`. Set the recipe to `absent` (reason: "Retired. The hourly line was removed
    in Phase 24; the UNIT x RATE shot is Phase 39b's, under US-03.3.6"), and remove those two
    `assets/US-03.3.7/` entries from US-03.3.6's `images` list (an images edit only, as the capture
    step makes; no text or status change), since an absent recipe prunes the files and nothing true
    could replace them before 39b. Say so in the PROGRESS entry for 39b.
  - `US-03.5.3` (Retired, merged into US-03.5.1). Its `adjustment-reason` shots click "Adjustment $"
    in `capture-adjustment-and-charge` on BK0009, and US-03.5.1 still shows them ("A reason is
    required before the adjustment can be saved", "Adjustment saved with its reason"). Re-point it to
    the adjustment capture Booking with Discount %, a typed 10 and the reason, highlight
    `adjustment-card`, and keep the shot `name` and the `required` and `saved` state names so
    US-03.5.1's image paths still resolve.
  - `US-05.2.4` (Retired, merged into US-05.2.1). US-05.2.1 shows its `admin-contract-rate.png` ("Booking
    priced at the contract's agreed $24 per unit instead of Dr Rutherford's $32", BK0031). It is now
    a Contract defined rate Booking: add `fee-rate-source` ("at the Contract defined rate $24.00") to
    its highlight, keep the shot name, and check it with `--dry`.
- `US-03.3.5`, `US-03.5.2`, `US-03.5.1` and `US-05.4.1` highlight
  `[data-shot=capture-adjustment-and-charge]`, which `OverrideCard` carried and `AdjustmentCard`
  (`adjustment-card`) replaces. `US-03.3.5` (itemise modifiers) is not a covered item: re-point its
  hook to `adjustment-card` and move it off BK0009 where it needs the field. All of them also start on
  BK0009; the field is not offered there.
- `US-03.3.6` shoots Add billing line (`sheet` state, "Add billing line: fixed amount") on BK0009; the
  sheet loses its hourly option, so the `--dry` run is the check.
- `US-05.4.2` and `US-07.2.3` open the office override sheet by the "Price override" button and, in
  `US-07.2.3`, click `"$ adjust"`; the button name and the three kinds stay, but check the dialog
  heading and the `text=/Office billing setup/` ancestor selector in `US-07.2.3` after item 13 adds
  the Anaesthetist adjustment row.
- Any recipe that shoots the admin Booking total or the Review Fee cell (`card-calculation` users
  `US-05.2.1`, `US-05.2.5`, `US-05.3.4`, `US-05.3.5`) gains item 4's rate caption, and changes again
  only if a layer is seeded on its Booking; the `--dry` run is the check.

**ATLAS.md.** Update Seed data (the Aria Contract defined rate and Fitzgerald's re-expressed Booking,
the adjustment capture Booking, the adjusted Review Booking on Morrison's List, the Post-paid
Contract flag), Personas and IDs (`SEED_MARKERS.definedRateBooking`, `definedRateCaptureBooking`,
`definedRateContract`, `adjustmentCaptureBooking`, `adjustedBooking`; the `rateTime*` and
`individualArrangementContract` markers removed), and Existing hooks (`contract-pricing-basis`,
`fee-rate-source`, `adjustment-card`, `contract-adjustment-rule`, `review-adjustment-flag`,
`office-override-sheet`, `booking-total-layers`; `capture-adjustment-and-charge` removed).

## Adversarial review (after build)

Run the standard adversarial review-and-fix pass (PROGRESS convention 18) at the end of each
session, after the manual test checklist and `npm run build`, `npm run build:pwa`, `npx vitest run`
and `npm run shots` are green, and before writing the PROGRESS entry.
- Fan out three independent Opus review subagents: **quality**, **bugs and money correctness**, and
  **plan and catalogue adherence**.
- This session then independently verifies every finding against the catalogue files and the code,
  fixes the confirmed ones and re-greens.
- Record the pass in the phase entry.
- Do not re-raise anything the Decisions log settles, including the 2026-09-28 "anaesthetist sees no
  fee" ruling.

**Steer this phase's reviewers at:**
- **One rate function.** Every unit rate the engine charges comes from `unitRateFor`: the RVG line,
  23's Booking-level engine, the prepayment estimate path and the billing-line guards. No second
  derivation, and the discount rate rounds to cents in that one place. A defined-rate Contract prices
  every billable unit of the whole Procedure at the Contract's rate. No billing line was added for
  it (39b's).
- **The hourly line is gone everywhere.** No `rateTime`, `permitsRateTime`,
  `permitsIndividualArrangement` or `INDIVIDUAL_ARRANGEMENT_MESSAGE` in `src`; no "Method 3",
  "hourly" or "individually arranged" in rendered strings; no stale seed marker. The OQ-89
  provisional label sits in one place.
- **Seed parity.** Only the two Aria Bookings' figures moved; Fitzgerald's new figure is (B + T + M)
  x $26.50 with T from 19a's tiers; everything else, including the S3 figures, is unchanged.
- **Order and arithmetic.** The pipeline is exactly: base (23's Booking-level engine at
  `unitRateFor`'s rate), then the anaesthetist adjustment, then the office override, per Procedure.
  Every step rounds to cents in one place. The worked examples A to I, G2 and R1 to R7 hold. The
  invoice delta lines reconcile to the total to the cent.
- **The gate is real in the store, not just the UI.** `setAnaesthetistAdjustment` refuses when the
  Contract does not allow it or BTM is not recorded. `editProcedure` cannot write either layer. The
  anaesthetist cannot write `officeOverride`. The office cannot write an adjustment, except to clear
  a disallowed one.
- **"Not offered at all" means absent.** Where the Contract does not allow it, there is no disabled
  field, no caption and no empty card on mobile or web. The before-BTM caption shows only where the
  Contract allows.
- **Never silent.** A stored, disallowed adjustment is never applied to money, and is flagged on the
  Booking, in Review and by the validator. A Contract change clears one only after warning.
- **Base units untouched.** The phase reads base units only through 19a's resolver, never copies a
  base-unit source, and adds no repeated-override rule (US-04.2.2's note says AA fixes its default
  RVG Contract). An out-of-range base value (D3) still counts as B recorded.
- **US-03.5.2.** A 100% discount leaves B, T and M, `billableUnits` and the audit record intact.
  A $0.00 group raises no invoice and no error.
- **No regressions.** The office override still works on every Contract, including over a fixed fee
  and a defined rate. 22's payment-setting split is unchanged where no layer applies. The
  "recorded in full" rule shares the validator's predicate rather than copying it. No money and no
  rate appear on any anaesthetist surface. `PERSIST_VERSION` is bumped in each session that changed
  the seed. The generator and canvas are untouched.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry; ROADMAP.md "Owner review: agents test
  themselves"): the defaults built for open questions (OQ-89: the defined rate as the agreed rate per
  unit, pricing the whole Procedure), the Verify item (US-04.2.2, still to be walked through),
  provisional readings, anything logged rather than fixed, and the screens worth a look, each with
  its route and persona. Include:
  - the domain-model `AMOUNT` and `RATE_TIME` wording;
  - whether reasons should print on customer invoices;
  - the before and after display question;
  - the Aria Contract's new figure for Fitzgerald's Booking.
- **Status row** for Phase 24, and a phase entry (one per session, or one entry with a section each)
  recording:
  - the drift-check result against 3d3a18c, including OQ-89's status;
  - the `PERSIST_VERSION` from and to;
  - the real names of the rate function, the engine function and fields used;
  - the Aria figures before and after;
  - the tests added;
  - the adversarial review pass.
- **Decisions log:** the entries listed in work item 17.
- **Handoff notes:**
  - **25:** lock the unit rate and its source per Procedure (no `rateTime` source any more), and
    `anaesthetistAdjustment`, the permission it applied under, `beforeAdjustment`,
    `afterAdjustment` and `officeOverride`. Make the rate steps and `allowsAnaesthetistAdjustment`
    versioned Contract fields. "Regenerate from locked data" must reproduce both invoice delta lines
    and the defined-rate fee.
  - **27:** the estimator prices at `unitRateFor`'s rate; the balance invoice reads the layered
    total.
  - **36:** the ledger legs carry the layered total.
  - **38b:** an additional invoice carries neither layer (free-form, D10).
  - **39b:** the UNIT x RATE line prices its units through `unitRateFor`; the billing-line sheet now
    offers the fixed amount only; US-03.3.7's recipe is absent and its two hourly images are gone from
    US-03.3.6's list, so 39b's `unit-rate` shot fills that gap; record OQ-89's answer if one came.
  - **43a:** the anaesthetist screens carry no rate or Contract pricing wording.
  - **44:** re-script the S1 Beat 3 aside and the S2 Beat 4 note into the rewritten run sheet.
- **Catalogue screenshots.** The step's result: recipes changed (US-03.5.1, US-03.5.2, US-05.2.1,
  US-05.2.6, US-05.4.1, US-05.4.2, US-04.2.2, plus the Retired US-03.3.7, US-03.5.3 and US-05.2.4,
  US-03.3.5 and any other recipe the step broke), the `capture/REPORT.md` counts (captured, partial, absent, failed) before and after, and any
  partial reason handed to a later phase.
