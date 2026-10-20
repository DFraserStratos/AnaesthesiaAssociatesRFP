# Phase 24 · Prices on the Procedure, the editable flag, fixed rate and discount

**Requirements covered:**
[FT-05.2](../../../../requirements-board/requirements/stories/FT-05.2.md) Unit and fee calculation: one rule on the values held on the Procedure, the version in force on the procedure date, a refusal when no price can be worked out ·
[US-05.2.5](../../../../requirements-board/requirements/stories/US-05.2.5.md) Fixed fee schedule pricing: a held price is the price, BTM optional and kept for reference ·
[US-05.2.6](../../../../requirements-board/requirements/stories/US-05.2.6.md) Fixed rate Contracts: the rate prices the whole Procedure, BTM required, changeable only where the Contract allows ·
[US-05.4.3](../../../../requirements-board/requirements/stories/US-05.4.3.md) Fixed discount Contracts: the discount as its own invoice line, shown and not editable where the Contract does not allow ·
[US-04.2.2](../../../../requirements-board/requirements/stories/US-04.2.2.md) Contract pricing terms: the editable flag per Contract ·
[FT-03.5](../../../../requirements-board/requirements/stories/FT-03.5.md) Anaesthetist adjustment ·
[US-03.5.1](../../../../requirements-board/requirements/stories/US-03.5.1.md) Apply an anaesthetist adjustment (no reason) ·
[US-03.5.2](../../../../requirements-board/requirements/stories/US-03.5.2.md) BTM still recorded in full (optional on a fixed price) ·
[FT-05.4](../../../../requirements-board/requirements/stories/FT-05.4.md) Changes to a Procedure's price ·
[US-05.4.1](../../../../requirements-board/requirements/stories/US-05.4.1.md) Apply anaesthetist adjustment ·
[US-05.4.2](../../../../requirements-board/requirements/stories/US-05.4.2.md) Office can change any price ·
[DM-50](../analysis/domain-model-delta.md#dm-50) pricing is one rule on values held on the Procedure ·
[DM-14](../analysis/domain-model-delta.md#dm-14) price changes are edits of those values, gated by the Contract's flag for the anaesthetist only ·
[RV-03](../analysis/reverse-check.md#rv-03-rate-x-time-billing-line-and-the-method-3-individual-arrangement-gate) the rate x time line and its Method 3 gate go ·
[RV-04](../analysis/reverse-check.md#rv-04-anaesthetist-price-adjustment-reason-mandatory-offered-on-every-contract-no-per-contract-flag) the reasoned, always-offered adjustment is reworked ·
[RV-29](../analysis/reverse-check.md#rv-29-the-anaesthetists-booking-shows-no-calculation-units-or-price) the anaesthetist sees the price and calculation.

**Carried across without regression, with parity tests:**
[US-05.2.1](../../../../requirements-board/requirements/stories/US-05.2.1.md) Per-unit pricing rate and
[US-05.2.7](../../../../requirements-board/requirements/stories/US-05.2.7.md) GST at the invoice foot
on ex-GST prices.

**Left this phase on 2026-10-20:** DM-46 (the BillingLine entity) and the old RV-11 and RV-24 ids. The
BillingLine removal, with every other billing line, moves to **39b** as billing events; this phase
removes only the rate x time line (now RV-03). The old RV-11 is RV-04 under the renumbered reverse
check. Superseded and not built: the ordered price precedence, the recorded price source, the required
reason, two records (anaesthetist adjustment and office override), and "adjustable = No contract (RVG)
and first-party" (D50).

**Depends on:** Phase 23. Also relies on 18 (holders, the Contract's **editable** and prepaid
settings, No contract (RVG) by `isDefault`, dated versions, the interim `permitsIndividualArrangement`
gate it left here), 19a (lines with fixed price, rate and discount; starting values filled onto the
Procedure and reset on a Contract change; Aria's $26.50 lines; Dr Souter's price list; the parity
harness), 20 (one Contract and line per Procedure, `setProcedureContract`, the anaesthetist's Change
Contract until AUTHORISED, flagged at review), 20a (the stack's "pricing basis" selector), 21
(completion with times only where the Contract prices from time; the payer), 22 (invoice layout, a
discount as its own line, the Split button) and 23 (the Booking-level pass, `isPrimary`, the RVG rule
on calculated Procedures).
**Estimated:** 2 sessions. **Session 1** is the engine: the values on the Procedure, the one rule, the
discount line, the no-charge invoice and the rate x time removal (work items 1 to 7). **Session 2** is
who may change them and every surface (work items 8 to 15). Each session leaves the app green and
demoable.

## Goal

**The price, rate and discount live on the Procedure** (DM-50, FT-05.2). 19a fills them from the
Contract line when the Contract (and line) is chosen; from then on they are the Procedure's own values,
reset on a Contract change (20). Prices are ex GST.

**One rule, in one place**, with no step order and no price-source record (the pricing documents'
ordered steps are not adopted, FT-05.2):
- if the Procedure holds a **price** (a line's fixed price, 27's prepaid amount, or one entered by
  someone permitted), that is the price; BTM is optional and kept for reference (US-05.2.5,
  US-03.5.2);
- otherwise **(B + T + M) x rate x (1 - discount)**: the rate is the Procedure's (from the line,
  US-05.2.6), else the anaesthetist's own unit value (US-05.2.1); BTM is then required. The discount
  is a fraction (10% is 0.1) and prints as **its own invoice line** (US-05.4.3: 10% on $1,000 gives a
  $100 discount line and $900).
- A price of 0 or a 100% discount gives a **no-charge invoice**, BTM still recorded.
- The Contract version in force on the procedure date prices it; where the Procedure's version is not
  in force on that date the values held are used and a review warning is raised
  ([AR-29#price-validation](../../../../requirements-board/requirements/artifacts/AR-29.md)). 25 adds
  the relink.
- Submission is **refused when no price can be worked out** (no price and no complete BTM); no silent
  BTM fallback survives.

**Who may change them** (FT-03.5, US-03.5.1, US-05.4.1, US-04.2.2; OQ-107, D50 answered): the
anaesthetist changes price, rate or discount only where the Contract's **editable** flag (18) allows;
where not, the price shows read-only, no discount of their own is offered, a Contract discount shows
as applied and not editable, and they change the Contract (20) or alert the office. **The office
changes any price, rate or discount on any Contract** until AUTHORISED (US-05.4.2, FT-05.4; OQ-16).
**No reason anywhere** (priceOverride and its reason go, RV-04). Every change is audited and flagged
at office review; the last change stands, neither side outranking the other.

**The anaesthetist sees the price and its calculation** (RV-29): the 2026-09-28 "no calculation"
ruling is superseded where the catalogue shows a price; log it for Donald.

**The rate x time line goes** (RV-03): the line, its `rateTime` basis, the Method 3 flag and gate. The
Aria Contract and its two Bookings are re-expressed on Aria's $26.50 fixed-rate lines. Other billing
lines stay until 39b.

A prepaid Procedure's price is 27's (OQ-96 open, D30).

**Keep the pricing model in one place** in `aa-prototype/src/domain/billing` (beside 19a's lines and
starting values) behind types the UI reads. Reference shape:
[AR-28#how-a-procedure-is-priced](../../../../requirements-board/requirements/artifacts/AR-28.md) and
[#price-reviews-and-controls](../../../../requirements-board/requirements/artifacts/AR-28.md),
[AR-29#contract-behaviour](../../../../requirements-board/requirements/artifacts/AR-29.md),
[#price-validation](../../../../requirements-board/requirements/artifacts/AR-29.md) and
[#booking-procedure-fields](../../../../requirements-board/requirements/artifacts/AR-29.md),
[AR-30#booking-procedure](../../../../requirements-board/requirements/artifacts/AR-30.md). AR-29 is
Greg's v6 proposal: its field names are orientation; the catalogue wins (no step order, no price
source).

## Before you start: drift check

1. **Diff the catalogue** against the plan's baseline, catalogue commit `d4db277`:

   ```
   node requirements-board/agent/skills/update-build-plan/tools/plan-state.mjs --diff FT-05.2,US-05.2.5,US-05.2.6,US-05.4.3,US-04.2.2,FT-03.5,US-03.5.1,US-03.5.2,FT-05.4,US-05.4.1,US-05.4.2,US-05.2.1,US-05.2.7,OQ-107,OQ-16,OQ-89,OQ-96
   ```

   The plan already reflects d4db277: the one rule on Procedure values (FT-05.2), the per-Contract
   editable flag with no reason (OQ-107 and D50, OQ-16), BTM optional on a fixed price (US-03.5.2,
   US-05.2.5), the rate live on the line (US-05.2.6), the discount its own invoice line (US-05.4.3),
   no time band (OQ-89, D40). OQ-96 is open (27's). Also read `domain-model.md`'s calculation rules and
   the Contract and Procedure rows for price, rate, discount and editable. **If an item changed since
   d4db277**, re-read it and adjust the work items; **if one is now Retired or Future**, drop it and say
   so in the PROGRESS entry.
2. **Read what 18 to 23 actually left** (PROGRESS entries and code), and name the real symbols:
   - 18: the Contract's editable setting (name and seeded values), `isDefault`, the version lookup,
     `permitsIndividualArrangement`, `permitsRateTime`, `INDIVIDUAL_ARRANGEMENT_MESSAGE`, the Aria
     Contract (`CT-ARIA-HOURLY`);
   - 19a: the line fields, the starting-values function, **whether it already added `price`, `rate`
     and `discount` to the Procedure** (if so, use them; if it held them elsewhere, move them here),
     the discount's stored form (percent or fraction: convert to a fraction in one place), where the
     fee path rounds, Aria's lines, the parity harness (`feeParity.test.ts`, `__parity__/`);
   - 20: `setProcedureContract`, the reset of price, rate and discount, the "Contract changed" review
     flag; 20a: the "pricing basis" selector (planned `pricingBasisFor`); 21: the times-only-where-timed
     completion predicate; 22: the invoice discount line slot and the Split; 23: the Booking-level
     engine (planned `bookingFeeFor`) and where the RVG rule adjusts calculated Procedures.
3. Grep for every `priceOverride` reader (9 non-test files at d4db277) and every seeded override; each
   becomes a value on the Procedure (a fixed fee a price, a percent a discount; a dollar adjustment a
   price at the adjusted figure).
4. Note the current `PERSIST_VERSION`.

## Reference

**Design files (convention 17).** `docs/design/Mobile App.dc.html` (capture sections, segmented
controls, fields, captions), `Admin Review.dc.html` (row anatomy, flag pills, the mono Fee cell),
`Web Dashboard.dc.html` (web chrome only), `Design Language.dc.html` (tokens: teal for Save and Change
price; a neutral treatment for read-only values; the warning tint only for a refusal or a review
warning; mono for every figure, rate and percent; crimson never). No mockup draws the price section:
extend the capture-section and Review-pill patterns.

**Catalogue.** The covered items, plus
[US-04.2.14](../../../../requirements-board/requirements/stories/US-04.2.14.md) (price lists),
[US-03.4.1](../../../../requirements-board/requirements/stories/US-03.4.1.md) (change the Contract),
[US-04.3.3](../../../../requirements-board/requirements/stories/US-04.3.3.md) (No contract (RVG)),
[US-13.5.2](../../../../requirements-board/requirements/stories/US-13.5.2.md) (audit),
[FT-07.2](../../../../requirements-board/requirements/stories/FT-07.2.md) (review),
[OQ-107](../../../../requirements-board/requirements/questions/OQ-107.md),
[OQ-16](../../../../requirements-board/requirements/questions/OQ-16.md),
[OQ-96](../../../../requirements-board/requirements/questions/OQ-96.md).
Artifacts (read, never edit) as linked in the Goal; AR-24#anaesthetist-adjustment draws the flag and
no reason.

**Analysis.** `../analysis/domain-model-delta.md` (DM-50, DM-14), `../analysis/reverse-check.md`
(RV-03, RV-04, RV-29), `../epics/EP-03.md`, `EP-04.md`, `EP-05.md`, and the code maps
`prototype-map-domain.md`, `-shared.md`, `-admin.md`, `-store-seed.md`.

**Code entry points** (names, since 15b to 23 move lines):
- Engine: `src/domain/billing/fee.ts` (`feeFor`, its `rateTime` branch and override block,
  `AppliedOverride`, `FeeResult`), 23's Booking-level engine, `invoiceBuild.ts` (the override delta
  line, the `$0` group skip), `validateBookingForBilling.ts` (`INDIVIDUAL_ARRANGEMENT_MESSAGE`, the
  Method 3 gate, the price-override checks), `src/store/billingRun.ts`.
- Model: `src/domain/types.ts` (`PriceOverride`, `Procedure.priceOverride`, `ChargeBasis`
  `'rateTime'`, `BillingLine.rate` / `hours`, `Contract.permitsIndividualArrangement`).
- Rate x time: `store/billingLineActions.ts`, `shared/capture/AddBillingLineSheet.tsx`,
  `BillingLinesCard.tsx`, `apps/admin/flows/ContractEditSheet.tsx` (the Method 3 control).
- Surfaces: `shared/capture/OverrideCard.tsx` (in `BtmCaptureBlock.tsx`, anchor `'priceOverride'`),
  `shared/flows/PriceOverrideSheet.tsx`, `shared/booking/OfficeBillingSetup.tsx`,
  `shared/booking/BookingDetailBody.tsx` (`showBookingTotal = actor.role !== 'anaesthetist'`),
  `shared/capture/BookingTotalPanel.tsx`, `feeContext.ts`, `apps/web/screens/ListDetailView.tsx`
  (Units and Fee columns), `apps/admin/screens/ReviewScreen.tsx`, `apps/admin/reviewFlags.ts`,
  `MasterData.tsx` (`ContractsView`).
- Store and audit: `store/lifecycle.ts` (`ProcedurePatch`, `editProcedure`, `editRefusal`),
  `shared/audit/fieldLabels.ts`, `actionLabels.ts`, `auditNarrative.ts`.
- Seed: `domain/seed/contracts.ts` (`CONTRACT.ariaHourly`), `bookings.ts` (Fitzgerald's Wed 15 Jul
  rate x time Booking, Souter's Mon 27 Jul Aria Booking), `index.ts` (`SEED_MARKERS.rateTimeBooking`,
  `rateTimeCaptureBooking`, `individualArrangementContract`), `audit.ts`, `apps/demo/DemoData.tsx`.
- Tests touching `rateTime` or `priceOverride`: `fee.test.ts`, `validateBookingForBilling.test.ts`,
  `captureActions.test.ts`, `invoiceBuild.test.ts`, `billingRun.test.ts` (the $1,440 Aria invoice),
  `seed.test.ts`, `mastersActions.test.ts`, `auditNarrative.test.ts`; Playwright
  `visual/admin-phase06.spec.ts` (`a-05-override.png`) and `visual/booking-attachments.spec.ts`
  ("Adjustment and charge").

## Work items

### Session 1: the values, the rule, the discount line and the rate x time removal

1. **Parity baseline first.** Add a `phase-24` fixture to the fee parity harness, generated from the
   code as 23 left it before any edit, with named cases for every scripted Booking S2 to S5, US-05.2.6's
   fixed rates ($26.50, $23, $25, $24), the bariatric $2,800 and $950 with GST, a No contract (RVG)
   Booking at the anaesthetist's own value, and every seeded `priceOverride`. Never regenerate with
   `-u`. Only the two Aria Bookings may move, asserted by their new figures.
2. **Model** (`domain/types.ts`). DM-50, DM-14;
   [AR-29#booking-procedure-fields](../../../../requirements-board/requirements/artifacts/AR-29.md).
   - `Procedure.price?: number` (ex GST, 0 allowed; absent means none held), `rate?: number` ($ a
     unit), `discount?: number` (a fraction, 0 to 1), as 19a left them or added here; 19a's
     starting-values function fills all three from the line.
   - `PriceOverride` and `Procedure.priceOverride` go, everywhere (code, seed, `seed/audit.ts`,
     labels, tests). Each seeded override is re-expressed per drift check 3, and its parity case
     asserts the same figure.
   - A held price and a discount never coexist: the discount applies to the calculation only. Setting
     a price clears the discount in the same write (item 8). A picked reading: log it.
   - `ChargeBasis` becomes `'fixed'` (plus whatever 39b's other lines need until it removes them);
     `BillingLine.hours` and `FeeLine.hours` go.
3. **The one rule** in a new `src/domain/billing/procedurePrice.ts`, re-exported from the billing
   index, with `procedurePrice.test.ts`. The one place for the rule, the refusal and the editable test.
   - **`priceProcedure(input)`** returns a `ProcedurePrice` or a `PriceRefusal`. Input: the
     Procedure's price, rate and discount, its recorded BTM and billable units after 23's rule, the
     anaesthetist's unit value in force.
     - Price held: `total = price`; BTM returned for reference if recorded; `calculated` (the BTM
       figure) also returned when BTM is complete, so the fee before the change is never lost
       (US-05.4.1).
     - Otherwise: `gross = round(units x (rate ?? unitValue))`, `discountAmount = round(gross x
       discount)`, `total = gross - discountAmount`, each rounded to cents once.
     - `noCharge = total === 0`.
     - **`noPrice` refusal** when no price is held and BTM is incomplete (the times missing, using 21's
       predicate, extracted, not copied): "Record the start and finish times: this procedure has no
       price set." A fixed-rate Procedure needs BTM like any calculated one (US-05.2.6).
     - Nothing records where a value came from.
   - **`anaesthetistMayChangePricing(contract)`** reads 18's editable setting; the only test of it.
     27 adds the prepaid branch here (D30). A code comment names OQ-107 and OQ-96.
   - **`contractVersionWarning`**: the Procedure's Contract version not in force on the procedure date
     gives a review warning (item 11), never a refusal or a fallback to No contract (RVG). Replace any
     18 or 21 interim that re-routes it.
   - **Tests, the worked examples** (fixture unit value $30.00):
     - **W1.** No contract (RVG), 12 units: $360.00.
     - **W2.** Rate $26.50, 12 units: $318.00, the $30.00 ignored (US-05.2.6).
     - **W3.** Discount 0.1 on gross $1,000.00: discount $100.00, total $900.00 (US-05.4.3).
     - **W4.** Rate $26.50 and discount 0.1, 12 units: $318.00 less $31.80, $286.20.
     - **W5.** Price $2,800.00 with BTM: $2,800.00, BTM returned; with no times: $2,800.00, not
       refused; price 0: $0.00 and `noCharge`.
     - **W6.** No contract (RVG) changed to price $450.00: $450.00, `calculated` $360.00.
     - **W7.** Discount 1.0: $0.00, BTM and billable units unchanged (US-03.5.2); 0.5: $180.00.
     - **W8.** No price and no times: `noPrice`; a rate line with no times: `noPrice`.
     - **W9.** Rounding: 11 units at $30.30 less 0.125: gross $333.30, discount $41.66, $291.64.
     - **W10.** Parity: every seeded Procedure prices as 23 left it (item 1).
     - **G2.** Under 23's rule, a discount on an additional calculated Procedure changes only that
       Procedure; the primary's price and the unit shares hold. A price-held Procedure is not re-based.
4. **Engine wiring** (`fee.ts`, 23's Booking-level engine).
   - The per-Procedure step calls `priceProcedure` after 23's rule; the old Type lookups at price time,
     the override block, the no-match and additional-Procedure BTM fallbacks and any second derivation
     of a rate or discount go. The Booking total is the sum.
   - `FeeResult` carries `ProcedurePrice` (gross, discount, total, calculated) and any refusal. Update
     every reader: `feeContext.ts`, `ReviewScreen`, `reviewFlags`, `invoiceBuild`, `billingRun`,
     `BookingDetailBody`, 20a's selector.
   - **20a's "pricing basis" selector** reads the Procedure's values: "Fixed price $2,800.00", "Rate
     $26.50 a unit", "Your unit value, less 10%". One selector; 43a and the stack never re-derive it.
   - **22's split** divides the Procedure's final price; if a typed $ share now exceeds it, the
     validator refuses "The split shares come to more than the price ({price}). Change the split or the
     price." unless 22 already does.
5. **Validator and billing run.** Every message verbatim, no dashes.
   - `noPrice` becomes a completion failure on the time fields, so the capture latch anchors it.
   - The `priceOverride` reason and "makes the fee negative" checks go. New range checks: price 0 or
     more; rate above 0; discount 0 to 100%.
   - The billing run treats a refusal as a per-Booking billing failure with the same sentence.
   - Completion checks, not 15a warnings: register no warning rule.
6. **Discount line and no-charge invoice** (`invoiceBuild.ts`, `billingRun.ts`; FT-05.2, US-05.4.3).
   - A Procedure with a discount prints its fee line at the gross, then its own line "Discount 10%" at
     minus the discount amount, in 22's discount slot; the lines reconcile to the total to the cent. A
     changed rate prints on the fee line ("12 units at $28.00"); a held price prints as the fee line.
     The old "Price override, {reason}" line goes.
   - A billable-party group whose priced total is $0.00 before any prepayment deduction now raises an
     invoice at $0.00, GST $0.00, headed "No charge", delivered like any other (22). A group netted to 0
     only by a prepayment still raises none (27's). Test both.
   - A no-charge invoice raises no payable leg and no BCTI (16's count unchanged); its draft Xero ACCREC
     is $0.00. A picked reading: log it with the BCTI granularity point.
   - List any seeded group that prices at $0 today before switching (none expected).
7. **The rate x time line goes** (RV-03), and the Aria seed.
   - `AddBillingLineSheet` loses "Rate × time (hourly)", its fields, preview and `rateTimePermitted`;
     `BillingLinesCard` and `billingLineActions` lose the `rateTime` branch and the Method 3 refusal;
     `validateBookingForBilling` loses `INDIVIDUAL_ARRANGEMENT_MESSAGE` and the gate; `fee.ts` its
     branch; `Contract.permitsIndividualArrangement`, `permitsRateTime` and the editor's Method 3
     control go. Fixed amount lines stay (39b).
   - Grep finds none of `rateTime`, `permitsRateTime`, `permitsIndividualArrangement`,
     `INDIVIDUAL_ARRANGEMENT_MESSAGE` in `src`, nor "Method 3", "hourly", "individually arranged" or
     "rate x time" in rendered strings.
   - **Aria Contract:** keep the id `CT-ARIA-HOURLY`; rename the key to `ariaFixedRate` and the name to
     "Aria Skin and Laser Clinic, fixed rate"; editable **off**; its terms are 19a's $26.50 lines, with a
     line for each procedure its two Bookings use (widen 19a's table, never a line per Booking).
   - **Fitzgerald's Wed 15 Jul Booking** (today 3.0 hours at $480 = $1,440): 19's abdominoplasty, start
     08:30 and finish 11:30, no claimed modifiers, its rate x time line dropped (confirm no test, recipe,
     ATLAS entry or beat pins the freed ids). Its price becomes (B + 14 + 0) x $26.50 (3 hours is 8 + 6
     time units); pin it in `seed.test.ts` and `billingRun.test.ts` in place of $1,440; grep the guide
     and Control Panel for "$1,440".
   - **Souter's Mon 27 Jul Aria Booking** (Heather Sinclair) stays uncaptured as the fixed-rate capture
     Booking; its description drops "individually arranged hourly rate".
   - Markers: `rateTimeBooking` to `fixedRateBooking`, `rateTimeCaptureBooking` to
     `fixedRateCaptureBooking`, `individualArrangementContract` to `fixedRateContract`; update
     `DemoData.tsx`.
   - **Session 1 ends here:** bump `PERSIST_VERSION` by one; build, build:pwa, vitest and shots green;
     the parity fixture identical except Aria. The office's existing sheet is re-pointed to write the
     values (item 10's action, office only) so nothing writes the old field; the anaesthetist's
     `OverrideCard` hides its inputs until session 2.

### Session 2: who may change them, and the surfaces

8. **One store action**, `setProcedurePricing(api, actor, procedureId, change)` in
   `src/store/pricingActions.ts`, exported from `store/index.ts`, through `mutate()` with before and
   after metas and the demo clock. FT-03.5, FT-05.4, US-03.5.1, US-05.4.1, US-05.4.2.
   - `change` is `{ price }` (sets a price, clears the discount), `{ rate?, discount? }` (clears any
     held price), or `reset` (re-fills from the line through 19a's starting values).
   - **Anaesthetist:** `editRefusal` as 20 and 38a left it (their own List until AUTHORISED); refused
     where `anaesthetistMayChangePricing` is false: "{Contract} sets this price. Change the Contract or
     alert the office."
   - **Office:** any Contract, until AUTHORISED (D63). **Integration:** refused.
   - No reason parameter. Range refusals as item 5. Audits `procedure.pricing` with the actor; the last
     write stands.
   - `ProcedurePatch` omits price, rate and discount and `editProcedure` refuses them at runtime, so no
     path bypasses the gate. Test it.
   - **Tests** (`pricingActions.test.ts`): the rights matrix (anaesthetist on an editable and a
     non-editable Contract, office on both, integration; ACTIVE, SUBMITTED, AUTHORISED); a price clears
     the discount; a rate or discount clears the price; reset; the audit metas; last change stands
     (anaesthetist 10%, then office price $300.00, then the anaesthetist's rate on an editable Contract).
9. **Anaesthetist price section** (mobile and the anaesthetist web app). `OverrideCard.tsx` is replaced
   by `shared/capture/PriceCard.tsx`, one component through `useSurface()`; delete `OverrideCard.tsx`.
   FT-03.5, US-03.5.1, US-05.4.1, US-05.4.3, US-05.2.6, RV-29.
   - Titled "Price". It always shows the price and its calculation in mono: "12 units x $30.00 =
     $360.00", "Discount 10% · minus $36.00", "Price $324.00"; or "Fixed price $2,800.00" with "Base,
     time and modifier units kept for reference" when units are recorded.
   - **Editable Contract:** a Segmented control **Calculated · Price**; Calculated offers "Rate $ a unit"
     (prefilled) and "Discount %"; Price offers "Price $" (0 or more). **Save** is the teal action,
     committing on Save. At $0.00 or 100%: "Base, time and modifier units stay recorded. This gives a
     no-charge invoice." A "Reset to Contract values" link when the values differ from the line.
   - **Not editable:** the same figures read-only, no inputs and no discount field, a Contract discount
     shown as applied, and the caption "Set by {Contract}. To use a different price, change the Contract
     or alert the office." linking to 20's Change Contract.
   - **No reason** field or copy anywhere. Delete "Adjustment and charge", "Percentage adjustments are
     set by the office.", "Adjustment $", "Charge $", "Charge amount $".
   - **Booking total:** `showBookingTotal` shows the total to the anaesthetist too; the web List table's
     Units and Fee columns stay, now consistent with the Booking detail.
   - Anchors: replace `'priceOverride'` with `'pricing'` in `BtmCaptureBlock`'s anchored set;
     `validationTarget` on the card. `BillingLinesCard` stays its `Pair` partner.
   - Hooks: `data-shot="price-card"`, `data-state` `editable`, `fixed`, `discount-fixed`, `no-charge`,
     `read-only` (a SUBMITTED or AUTHORISED List).
10. **Office surfaces** (Admin; the office web Booking detail).
    - `PriceOverrideSheet` becomes `PricingSheet` ("Change price"): the same control as item 9 with
      no flag gate, writing `setProcedurePricing`; the button in `OfficeBillingSetup` reads "Change
      price" and its row "Price" shows the values and calculation.
    - Admin Booking total shows gross, the discount line and the total per Procedure.
    - **Contract catalogue and detail** (`ContractsView`, 18's panel): a neutral pill "Anaesthetist can
      change pricing" or "Fixed for the anaesthetist" from 18's setting (the office toggles it in 18's
      editor). The lines grid shows a line's discount as a percent.
    - Hooks: `pricing-sheet`, `booking-total-lines`, `contract-editable-pill`.
11. **Review** (`ReviewScreen`; `reviewFlags.ts`, kept pure).
    - The Fee cell shows the final price and, when the values differ from the line's, a second mono
      line in mist, "Contract $360.00".
    - **Flag every change**: "Price changed by Dr {surname}" or "Price changed by the office" (neutral),
      read from the last `procedure.pricing` audit entry since the Contract was set (one selector; no
      stored source field). A picked reading: log it. Also "No charge" (neutral) and "Contract not in
      force on {date}" (warn, item 3), and `noPrice` (warn).
    - The flags tile and "flags open" count pick them up; test in `reviewFlags.test.ts`.
12. **Seed the beats** (`contracts.ts`, `bookings.ts`, `audit.ts`, `index.ts`; demo values labelled).
    - **Editable values per D50**: confirm 18's seeded setting reads on for No contract (RVG), hospital
      RVG Contracts and Dr Souter's price list, off for fixed-price hospital and rooms Contracts and
      Aria; set any 18 left otherwise.
    - **Dr Souter's Mon 27 Jul ACTIVE List**, one Booking per state: the Aria fixed-rate Booking (rate
      read-only); a **10% discount line** Booking on a new demo Contract under an existing hospital or
      rooms holder, editable off, one line with discount 0.1 (`SEED_MARKERS.discountContract`,
      `discountBooking`); a **fixed price read-only** Booking (a hospital fixed-price Contract if 18 or
      19a seeded one, else Doyle's rooms fixed fee); a **No contract (RVG)** Booking, uncaptured, where
      she changes the price or discount (reuse one if 20 or 21 left one, else add one with a pinned
      patient; `SEED_MARKERS.pricingCaptureBooking`).
    - **The Review beat:** on Dr Morrison's Mon 20 Jul SUBMITTED List (S2 Beat 4), one completed No
      contract (RVG) Booking with a 10% discount set by her, with a matching seeded audit entry
      (`SEED_MARKERS.discountedBooking`).
    - **The no-charge beat:** one completed Booking with price $0 set by its anaesthetist on a SUBMITTED
      List no scripted beat authorises (`SEED_MARKERS.noChargeBooking`), so authorising raises a
      no-charge invoice.
    - **Ids stay put:** new Bookings and Contracts after every existing one, pinned patients without
      `takePatient()`; the seed test asserts existing ids unchanged. Check S2 Beat 4's counts, any
      Review-count test and the US-07.2.3 recipe.
    - **Seed tests:** no seeded anaesthetist change on a non-editable Contract; the discount Booking
      prices at gross less 10% once captured; parity, Aria, S3 and S5 figures unchanged; the canvas
      unchanged.
    - Bump `PERSIST_VERSION` by one from session 1's value.
13. **Labels and audit.** `ACTION_LABELS` `procedure.pricing` "Price, rate or discount changed";
    `FIELD_LABELS` price, rate, discount; drop `priceOverride` and `permitsIndividualArrangement`.
    `auditNarrative.formatShape`: "Price $450.00", "Rate $28.00 a unit", "Discount 10%". Update
    `auditNarrative.test.ts`.
14. **Playwright.** `admin-phase06.spec.ts`: "Change price" and the sheet heading; re-shoot
    `a-05-override.png`. `booking-attachments.spec.ts`: the equal-height check uses "Price". Add shots:
    `price-card` in each state on mobile and web, `booking-total-lines`, the review flag,
    `contract-editable-pill`, a no-charge invoice and a discount line.
15. **Decisions log** (PROGRESS.md):
    - **Superseded:** the Method 3 hourly line and 18's interim gate; the 2026-07-23 reading keeping
      Fitzgerald's hourly Booking as the billing exemplar; the silent BTM fallbacks; "a $0 group raises
      no invoice"; the office fixed fee "above zero" rule; the 2026-07-22 seventh review A6/B5 typed
      override; Phase 08's "Price override, {reason}" line; the mandatory override reason (US-03.5.3
      retired); the 2026-09-28 "no calculation for the anaesthetist" ruling, where the catalogue shows a
      price (RV-29, for Donald); this plan's own earlier price precedence, price source, two records and
      "adjustable = No contract (RVG) and first-party" (D50).
    - **Readings:** a held price and a discount never coexist; the review flag read from the audit; a
      no-charge invoice has no payable and no BCTI; `CT-ARIA-HOURLY` keeps its id; Aria not editable.

## Demo triggers

**No new button.** Everything is normal use:
- **Dr Souter's Mon 27 Jul List** (mobile or web): the fixed-rate Aria Booking (rate read-only), the
  10% discount line Booking (shown, not editable; its own invoice line), a fixed price read-only, and
  No contract (RVG), where she changes the price or discount with no reason.
- **Admin Review** (product): the office changes a fixed price on any Booking; the invoice shows the
  new price and History records who. Dr Morrison's Mon 20 Jul List shows the discount flag.
- **The seeded $0 Procedure:** authorising its List raises a no-charge invoice.

Register no trigger; add nothing to the Control Panel. **PWA:** no stand-in; the handset half is
complete on the phone. Check Phase 14's "Office authorises this List" still authorises a List with a
discount and a no-charge Booking.

## Out of scope

- The pricing snapshot at AUTHORISED and the relink to a revised line (25).
- The prepaid price and its lock (27; OQ-96, D30): one more branch of `anaesthetistMayChangePricing`.
- Removing the BillingLine entity and the other billing lines (39b, DM-46); a billing event credit.
- Additional invoices and credit notes by hand (38b, 39).
- The Contract's editable setting itself and its editor (18); lines and starting values (19a); the
  Contract change and its reset (20); times only where timed (21); the multi-procedure rule (23).
- A dollar discount, a cap on a typed price, a reason field.

## Manual test checklist

The agent runs every item itself in the running app with evidence; none is handed to the owner.

**Session 1:**
- [ ] **No hourly line.** Mobile and web, Dr Souter, Mon 27 Jul, the Aria Booking: Add billing line
      offers the fixed amount only; no "Rate × time", "Method 3" or "hourly" anywhere.
- [ ] **Fixed rate.** Admin, Fitzgerald's Wed 15 Jul Booking: the fee is the units x $26.50; its invoice
      quotes the units at $26.50 and goes to the Aria clinic.
- [ ] **Fixed price.** A Doyle bariatric Booking: $2,800.00 with B, T and M for reference; with the
      times cleared on a test copy it still completes, while a No contract (RVG) Booking with no times
      is refused with the times sentence.
- [ ] **Discount line.** A Booking with discount 0.1: the invoice prints the fee line, "Discount 10%" and
      the total, reconciling to the cent.
- [ ] **No-charge invoice.** An office price of $0.00 on a SUBMITTED Booking, then authorise: a $0.00
      "No charge" invoice, no payable, no BCTI, units still recorded.
- [ ] **Parity.** S3's Holt and Prentice figures, the bariatric $2,800 and $950 with GST, the $23, $24
      and $25 fixed-rate Bookings and S5 Beat 1 unchanged.

**Session 2:**
- [ ] **Editable.** Mobile, Dr Souter, Mon 27 Jul, the No contract (RVG) Booking: the Price section shows
      "12 units x $30.00 = ..."; set Discount 10% and Save with no reason asked; the discount line and
      price show; History records Dr Souter.
- [ ] **No charge.** Price $0.00 (or 100%): the caption says units stay recorded and it gives a
      no-charge invoice; Mark complete succeeds after capture.
- [ ] **Not editable.** The Aria Booking shows "Rate $26.50 a unit" read-only with the change-the-Contract
      caption and no discount field; the discount Booking shows 10% applied, not editable; the fixed
      price Booking shows the price read-only.
- [ ] **Store gate.** On a non-editable Contract the anaesthetist's write is refused (unit-tested) and
      the UI offers no input; `editProcedure` refuses the fields.
- [ ] **Office any price.** Admin, Change price on the fixed-price Booking: set $2,650.00; the total,
      Review and invoice show it; History records the office; no reason asked.
- [ ] **Last change stands.** Anaesthetist sets 10%, office sets a price, the Booking shows the office's
      price; a later anaesthetist rate on an editable Contract replaces it.
- [ ] **Review flags.** Admin, Review, Dr Morrison Mon 20 Jul: "Price changed by Dr Morrison" and the
      Fee cell's "Contract $x"; authorise (S2 Beat 4): the invoice has the discount line.
- [ ] **Contract catalogue.** No contract (RVG) shows "Anaesthetist can change pricing"; Aria and the
      fixed-price Contracts "Fixed for the anaesthetist".
- [ ] **Web parity.** The anaesthetist web app shows the same card, states and copy on the same Bookings.
- [ ] **Scripted beats unbroken.** S1 Beat 3, S2 Beat 4, S3 Beat 1, S4 and S5 Beat 1 run as scripted.
- [ ] No en or em dashes in new copy; teal on every new action; crimson nowhere new.
- [ ] Catalogue screenshots: every row below created or updated as it says, every recipe this phase
      broke re-pointed, a full `npm run capture` with no failed recipe, the covered items' new shots
      checked by eye, `npm run verify:board` green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots` and `npm run verify:board`
      green.

## Demo guide updates

In the same session as the change, patch `docs/demo-guide/` and the same sections of
`master-demo-guide.html`, as 18 to 23 left them:
- **Session 1:**
  - **`04-presenter-cheat-sheet.md`, "Fee calculation":** the formula block becomes "Price = the
    Procedure's price if it holds one (BTM kept for reference); otherwise (Base + Time + Modifier units) x
    rate x (1 - discount), the rate the Contract line's or the anaesthetist's own unit value, the
    discount its own invoice line. A price of 0 gives a no-charge invoice." Drop any "rate x time",
    "hourly", "Method 3" or "Aria hourly"; Aria is "fixed rate, $26.50 a unit".
  - **`02-workflows-and-handoffs.md`** step 10: "She may record an allowed fixed or rate-by-time line, or
    an override with a reason." becomes "She may add a fixed billing line." (the price half lands in
    session 2).
  - **`03-demo-script.md`:** grep for "rate x time", "hourly", "$1,440" and "override" and fix any
    beat showing the Aria hourly Contract or a reasoned override.
- **Session 2:**
  - **`04-presenter-cheat-sheet.md`:** "Fee calculation"'s "The anaesthetist Booking shows no units or
    fee" becomes "shows the price and its calculation; she changes price, rate or discount only where
    the Contract allows"; "Contracts" gains "Each Contract carries a flag, set by AA, saying whether the
    anaesthetist may change its pricing; the office can change any price; no reason, every change
    audited and flagged at review, the last change stands." Same change to `README.md` (~l.109).
  - **`02-workflows-and-handoffs.md`:** step 9 "shows no units or fee" becomes "shows the price and its
    calculation"; step 10 adds "Where the Contract allows she may change the price, rate or discount, no
    reason needed; otherwise the price shows read-only."; an office line "The office can change any
    price, rate or discount, flagged at review."
  - **`03-demo-script.md`:** S1 Beat 3 optional aside (Dr Souter, Mon 27 Jul: a 10% discount on No
    contract (RVG), then the Aria read-only rate); S2 Beat 4 "Worth pointing at" (Dr Morrison's
    discount flag and the discount invoice line); **S5 Beat 1**: confirm History reads cleanly with
    "Price, rate or discount changed" and no override reason.
  - **`01-personas-and-responsibilities.md`:** the office's review gains the price-change flags and the
    no-charge invoice.

Phase 44 re-scripts these asides into the rewritten run sheet.

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19), run
after the review pass and before the PROGRESS.md entry, at the end of each session for what it changed.
Re-run `node requirements-board/agent/skills/update-build-plan/tools/recipe-status.mjs 24` first: 19a renames the US-05.2.6
shot and re-points US-04.2.2 and US-05.2.5 before this phase runs.

| Item | Recipe at plan time | When this phase is done |
|---|---|---|
| [US-03.5.1](../../../../requirements-board/requirements/stories/US-03.5.1.md) Apply an anaesthetist adjustment | partial · web-adjustment, mobile-adjustment (none, adjustment) | **Captured.** Move to `pricingCaptureBooking`; `price-card` web and mobile, states `editable` (Discount 10%, no reason), `fixed` (Aria, read-only, no discount field), `discount-fixed`. Captions: "Where the Contract allows, the anaesthetist changes price, rate or discount, no reason"; "Where it does not, the price shows read-only". Drop the partial reason. |
| [US-03.5.2](../../../../requirements-board/requirements/stories/US-03.5.2.md) BTM still recorded in full | captured · web-full-discount, mobile-full-discount | Stays captured. On `pricingCaptureBooking` at 100%, highlight the units rows and `price-card` (`no-charge`); add an admin `fixed-price-units` state (the bariatric Booking with no times, still priced). Caption "Units stay recorded at a 100% discount; optional on a fixed price". Keep the shot `name`s. |
| [US-05.2.1](../../../../requirements-board/requirements/stories/US-05.2.1.md) Per-unit pricing rate | captured · admin-unit-values, admin-card-fee | Carried across; `--dry` is the check (re-shoot `admin-card-fee` only if the card changed). |
| [US-05.2.2](../../../../requirements-board/requirements/stories/US-05.2.2.md) Tiered time units | captured · web-time-units, mobile-time-units | No change here (Phase 19a owns it). |
| [US-05.2.5](../../../../requirements-board/requirements/stories/US-05.2.5.md) Fixed fee schedule pricing | partial · admin-fixed-price | **Partial**, narrower. Re-shoot the bariatric Booking: "Fixed price $2,800.00" with BTM for reference; caption "A fixed price is the price; units optional, kept for reference"; partial reason "Raising an additional invoice or credit note by hand when the work differed is built in Phases 38b and 39." |
| [US-05.2.6](../../../../requirements-board/requirements/stories/US-05.2.6.md) Fixed rate Contracts | captured · web-rate-time, mobile-rate-time (entry, added) | Stays captured as 19a left it (`fixed-rate`); add mobile `rate-fixed` on the Aria Booking (`price-card` `fixed`, the rate read-only), caption "Rate fixed for the anaesthetist where the Contract does not allow a change". If 19a did not rename the `rate-time` shots, replace them as its doc says. |
| [US-05.2.7](../../../../requirements-board/requirements/stories/US-05.2.7.md) GST | captured · admin-invoice-gst | No change here (Phase 22 owns it); `--dry` is the check. |
| [US-05.4.1](../../../../requirements-board/requirements/stories/US-05.4.1.md) Apply anaesthetist adjustment | partial · web-adjustment, mobile-adjustment (entry, applied) | **Captured.** On `pricingCaptureBooking`: `entry` (Calculated, rate and Discount %), `applied` (the saved price with "12 units x $30.00 = $360.00" kept); admin `adjustment-review` on `discountedBooking` with the review flag. Caption "Changed rate, discount or price; the calculation is kept; no reason". Drop the partial reason. |
| [US-05.4.2](../../../../requirements-board/requirements/stories/US-05.4.2.md) Office can change any price | captured · admin-price-override (entry, applied) | Stays captured. Re-point to `pricing-sheet` ("Change price") on the bariatric fixed-price Booking; `applied` shows the new price and History naming the office. Caption "The office can change any price, no reason; the last change stands". Keep the shot `name`s. |
| [US-05.4.3](../../../../requirements-board/requirements/stories/US-05.4.3.md) Fixed discount Contracts | none (create it) | **Create, captured.** Mobile and web `discount-fixed` on `discountBooking` (`price-card`, 10% applied, not editable); admin `discount-invoice-line` on its invoice once captured and authorised (seed or recipe steps), highlight the "Discount 10%" line. Caption "A Contract's 10% discount, its own invoice line". |
| [US-04.2.2](../../../../requirements-board/requirements/stories/US-04.2.2.md) Contract pricing terms | captured · admin-pricing-basis (type-1, type-2, type-3, rate-time) | **Captured.** Drop `rate-time`; keep 19a's `rvg`, `fixed-rate`, `fixed-price`; add `discount` (the discount Contract's line) and `editable` (`contract-editable-pill` on No contract (RVG) and on Aria). Caption "A line sets a price, rate or discount; a flag on each Contract says whether the anaesthetist may change them". Drop 19a's partial reason. |
| [FT-05.2](../../../../requirements-board/requirements/stories/FT-05.2.md) Unit and fee calculation | none | **Create, captured.** Admin `booking-total-lines` on a calculated Booking with a discount (gross, discount, total) and the fixed-price Booking. Caption "Price held, else units x rate less discount". |
| [FT-05.4](../../../../requirements-board/requirements/stories/FT-05.4.md) Changes to a Procedure's price | none | **Create, captured.** Admin History on `discountedBooking` after an office price change: both entries, who and when. Caption "Every change audited; the last change stands". |
| [FT-03.5](../../../../requirements-board/requirements/stories/FT-03.5.md) Anaesthetist adjustment | none | **Create, captured.** Mobile `price-card` pair: `editable` on No contract (RVG), `fixed` on Aria. Caption "A flag on each Contract decides". |

**Recipes this phase breaks.**
- `US-03.3.7` (Retired, rate x time): set `absent` ("Retired. The rate x time line was removed in Phase
  24.") and remove `web-rate-time.png` and `mobile-rate-time.png` from US-03.3.6's `images` (an images
  edit only).
- `US-03.5.3` (Retired into US-03.5.1) clicks "Adjustment $" on BK0009: re-point to
  `pricingCaptureBooking` and `price-card`, keep the shot `name` and the `required` and `saved` state
  names so US-03.5.1's paths resolve, re-captioned "A changed discount saves with no reason" and
  "Discount saved".
- `US-05.2.4` (Retired): its `admin-contract-rate` shot is now a rate line; `--dry` is the check.
- `US-03.3.5` (Retired): re-point from `capture-adjustment-and-charge` to `price-card` unless 19b did.
- `US-03.3.6`: Add billing line loses its hourly option; `--dry` is the check (39b retires it).
- `US-07.2.3` clicks "Price override" and `"$ adjust"`: re-point to "Change price" and the sheet's
  fields; check Review counts after item 12's Bookings.
- Recipes on the admin Booking total or Review Fee cell (`US-05.2.1`, `US-05.2.5`, `US-05.3.5`,
  `card-calculation`): `--dry` is the check.

**ATLAS.md.** Seed data (Aria fixed rate, Fitzgerald's re-expressed Booking, the Mon 27 Jul state
Bookings, the discount Contract, the discounted and no-charge Bookings), IDs (`fixedRateBooking`,
`fixedRateCaptureBooking`, `fixedRateContract`, `pricingCaptureBooking`, `discountContract`,
`discountBooking`, `discountedBooking`, `noChargeBooking`; the `rateTime*` and
`individualArrangementContract` markers removed) and hooks (`price-card` and its states,
`pricing-sheet`, `booking-total-lines`, `contract-editable-pill`; `capture-adjustment-and-charge`
removed).

## Adversarial review (after build)

Run the standard pass (PROGRESS convention 18) at the end of each session, after the checklist and the
green builds, before the PROGRESS entry: three Opus reviewers (quality; bugs and money correctness;
plan and catalogue adherence), verify every finding, fix and re-green. Do not re-raise what the
Decisions log settles.

**Steer this phase's reviewers at:**
- **One rule, one place.** `priceProcedure`, `anaesthetistMayChangePricing` and the refusal live in
  `procedurePrice.ts`; no step order, no price-source field, no surface re-deriving a rate or discount.
- **The arithmetic.** Price held, else units x (rate or unit value), less the discount as its own
  amount, each rounded once; W1 to W10 and G2 hold; the discount line reconciles to the cent.
- **Refuses, never falls back.** No price and incomplete BTM is `noPrice` at completion, Review and the
  billing run; no silent BTM fallback; a Contract not in force warns with the held values.
- **The gate is in the store.** The anaesthetist's write is refused on a non-editable Contract; the
  office writes on any; `editProcedure` writes none of the three; no reason anywhere.
- **Last change stands and is seen.** Each change audited with the actor and flagged at review; a price
  and a discount never coexist.
- **What the anaesthetist sees.** The price and its calculation; read-only with no disabled inputs
  pretending where the Contract does not allow.
- **No-charge.** $0 or 100% leaves BTM intact and raises a "No charge" invoice with no payable; a group
  netted to 0 by a prepayment raises none.
- **The rate x time line is gone everywhere**; other billing lines unchanged; Aria prices on $26.50.
- **No regressions.** Parity identical apart from Aria; GST unchanged; `PERSIST_VERSION` bumped each
  session; generator and canvas untouched.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry), each with its route and persona:
  - the anaesthetist now sees the price, its calculation and the Booking total (RV-29, superseding his
    2026-09-28 ruling): Donald to confirm;
  - a held price and a discount never coexist (setting one clears the other);
  - the review flag read from the audit, naming who changed the price last;
  - the no-charge invoice raises no payable and no BCTI, with a $0.00 Xero ACCREC;
  - each seeded Contract's editable value (Aria and the discount Contract off) and the demo discount
    Contract;
  - Fitzgerald's new Aria figure.
- **Status row and phase entry:** the drift check against d4db277 (OQ-96 status); `PERSIST_VERSION`
  from and to; the real names (`priceProcedure`, `anaesthetistMayChangePricing`, `setProcedurePricing`,
  `PriceCard`, `PricingSheet`); the Aria figures before and after; the parity result; tests added; the
  review pass; the catalogue screenshot result (`REPORT.md` counts before and after).
- **Decisions log:** work item 15.
- **Handoff notes:**
  - **25:** snapshot the Procedure's price, rate and discount, the recorded BTM and the unit value in
    force, and the result; price only from the snapshot; "Regenerate from locked data" reproduces the
    discount line and the no-charge invoice; the relink refreshes the three values from the new line.
  - **27:** the prepaid lock (OQ-96, D30) as one branch of `anaesthetistMayChangePricing`; the prepaid
    amount is a held price; a group netted to 0 by the deduction raises no invoice.
  - **36:** a no-charge invoice has a $0.00 receivable leg and no payable.
  - **38b and 39:** additional invoices and credit notes are free-form; a credit and rebill copies the
    discount line.
  - **39b:** the rate x time line is gone and US-03.3.7's recipe absent; remove BillingLine; time-priced
    events reuse `priceProcedure`'s calculated step.
  - **43a:** keep the anaesthetist's Price section, its calculation and its read-only state.
  - **44:** re-script the S1 Beat 3 aside and the S2 Beat 4 note.
