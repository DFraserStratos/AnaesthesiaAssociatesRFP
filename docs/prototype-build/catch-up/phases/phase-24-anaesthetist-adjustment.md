# Phase 24 · Contract-gated anaesthetist adjustment

**Requirements covered:**
[FT-03.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-03.5.md) Anaesthetist adjustment ·
[US-03.5.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.5.1.md) Apply an anaesthetist adjustment, with required reason (Proposed) ·
[FT-05.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-05.4.md) Adjustments and overrides ·
[US-05.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.4.1.md) Apply anaesthetist adjustment ·
[US-04.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.2.md) Contract pricing and adjustment rules (Proposed, [OQ-06](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-06.md)); this phase closes its last missing part, the allows-adjustment rule ·
[DM-12](../analysis/domain-model-delta.md#dm-12) the anaesthetist adjustment is its own Contract-gated record, and the office override stays the existing `priceOverride` ·
[RV-11](../analysis/reverse-check.md#rv-11-anaesthetist-adjustment-dollar-or-fixed-price-always-offered) the dollar-or-fixed, always-offered, ungated anaesthetist adjustment is reworked.
Kept as they are and re-tested, not reopened:
[US-05.4.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.4.2.md) Office price override (Matches; the office can always override, [OQ-16](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-16.md) Answered) and
[US-03.5.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.5.2.md) BTM still recorded in full (Matches; must survive a 100% discount).
**Depends on:** Phase 23 (the Booking-level pricing engine, the 3/2/2 modifier split, the per-Contract multi-procedure rule and the Contract base-unit override). Also relies on 15 (Booking vocabulary), 18 (the reshaped `Contract` and the rebuilt Contract detail panel), 19 (the one base-unit resolver), 20 (one Contract per Procedure, `setProcedureContract`, the Contract picker), 21 (Review's Contract column and approval) and 22 (invoice presentation and the covered-amount split).
**Estimated:** 1 session, and a tight one. If it runs over, stop green after work item 6 (model, pure
rules, engine, validator, store and Contract rule, all tested) and do items 7 to 12 in a second session.

## Goal

The anaesthetist adjustment becomes **its own record on the Procedure**, separate from the office
override (today's `priceOverride`). It is a **percent discount** or a **fixed final price**. There is no
dollar variant, and a reason is always required. It is offered only when the **Procedure's Contract
allows it**, and only once base, time and modifier units are recorded. A 100% discount still leaves
all of those units recorded.

The pure engine applies the two layers in the domain model's order: **Booking-level base calculation
(Phase 23), then the anaesthetist adjustment, then the office override.** It records the fee before
each layer. The office override stays available on **every** Contract, including a fixed-fee one, and
keeps its three kinds (fixed fee, dollar, percent).

On mobile and the anaesthetist web app, the adjustment field appears only where the Contract allows
it. Otherwise it is not offered. Admin Review, the admin Booking total and the invoice show both
layers.

The Contract gains **`allowsAnaesthetistAdjustment`**, edited in the Contract detail panel. With it,
US-04.2.2's pricing and adjustment rules are complete.

## Before you start: drift check

1. Diff the catalogue against the snapshot:

   ```
   git diff 1f067a8 -- "docs/discovery-reference/Updated Requirements/catalogue" "docs/discovery-reference/Updated Requirements/domain-model.md"
   ```

   - **What to read.** Read the diff for FT-03.5, US-03.5.1, US-03.5.2, FT-05.4, US-05.4.1, US-05.4.2,
     US-04.2.2, OQ-06 and OQ-16. In `domain-model.md`, read the Contract table's
     `allowsAnaesthetistAdjustment` row, the "Procedure billing context" rows `anaesthetistAdjustment`
     and `officeOverride`, and section 3, "Calculation rules".
   - **If an item changed**, re-read it and adjust the work items below.
   - **If an item is now Retired or Future**, drop it and say so in the PROGRESS entry.
   - **Things to look for:**
     - a dollar variant being added to the anaesthetist adjustment;
     - the office being allowed to edit the anaesthetist's adjustment;
     - a cap on the fixed final price;
     - the anaesthetist being shown the fee before and after the adjustment (see item 3 of this
       list).
2. **Known wording clash, already resolved.** `domain-model.md`'s Procedure billing-context table
   lists `anaesthetistAdjustment { type: PERCENT, AMOUNT or FIXED_FINAL }`. FT-03.5, US-03.5.1,
   US-05.4.1 and US-04.2.2 all say "percentage discount or fixed final price", and DM-12 settles on
   no dollar variant.
   - **Build:** the stories' reading.
   - **Tell the owner:** in the phase notes, so `domain-model.md` can be corrected. Do not edit the
     catalogue in this phase.
   - **If the diff shows `AMOUNT` added to a story:** add a `dollar` kind to the record and the
     segmented control. It is one more branch in item 2.
3. **The anaesthetist sees no fee (the 2026-09-28 ruling, a user decision).** US-05.4.1's catalogue
   screenshots are captioned "the Booking total shows the fee before it". That was captured when the
   anaesthetist Card still showed a total.
   - **Default:** keep the ruling. The fee before the adjustment is **recorded** (US-05.4.1: "records
     the fee as it stood before the adjustment") and shown to the office, but the anaesthetist Card
     shows no money. The only exception is the fixed final price the anaesthetist types in.
   - **Ask the owner** whether the anaesthetist should see the before and after figures. If the
     answer is yes, add a read-only "Calculated fee · after your adjustment" row to the adjustment
     card only, not a Card total. Record the answer in the Decisions log.
   - **Stale catalogue screenshots.** US-03.5.1's images are captioned "Adjustment and charge" and
     "Dollar adjustment field", and US-05.4.1's show a Booking total. They were shot from today's
     retired behaviour. Do not edit the catalogue; tell the owner they need re-shooting from this
     phase's `adjustment-card` shots.
4. **Proposed items.**
   - **US-03.5.1** stays Proposed until the reason rule is confirmed. The reason is already
     mandatory; keep it.
   - **US-04.2.2** stays Proposed until OQ-06 is settled.
   - Build both as written.
5. **OQ-06** (base units on a Procedure master, a Contract override, the RVG master keeping the
   guide's values).
   - **Why it touches this phase.** It gates US-04.2.2's base-unit half, which Phases 19 and 23
     built. This phase adds nothing to base units.
   - **If still open:** leave 23's provisional base-unit override and its labels exactly as they
     are.
   - **If answered differently** (for example, base units on the RVG code after all): that is
     rework for 19 and 23, not this phase. Note it in the PROGRESS entry and carry on. The
     "recorded in full" gate below reads whatever base-unit resolver 19 and 23 left.
6. **Read what Phases 18 to 23 actually left.** Check their PROGRESS entries and the code for:
   - the name and shape of Phase 23's Booking-level engine (for example `bookingFeeFor` over the
     per-Procedure `feeFor`), and what it returns per Procedure;
   - the field that holds the Procedure's Contract (`contractSelection`, per Phase 20);
   - the Contract detail panel's section layout (Phase 18);
   - how the covered amount (Phase 22) is taken from a Procedure's total;
   - how 22's invoice presents override lines.

   Then name the real symbols in your plan. Also grep for any `priceOverride` of kind
   `dollarAdjustment` or `fixedFee` that a later phase seeded or wrote as the anaesthetist:
   - at the snapshot the seed has **none**;
   - S5's three staged audit edits are ASA and notes only, so they are unaffected.

   Re-express any you find (item 9).
7. Note the current `PERSIST_VERSION`, which is 13 at the snapshot and higher after 15 to 23.

## Reference

**Design files (convention 17).**
- `docs/design/Mobile App.dc.html`: the capture sections, segmented controls, text fields and
  captions that the adjustment card follows.
- `docs/design/Admin Review.dc.html`: the Review row anatomy. Flag pills sit in the Flags column, as
  in "T adjusted +1 manually" on David Chen's row. The Fee cell is mono and tabular-nums.
- `docs/design/Web Dashboard.dc.html`: only for the web chrome around the shared Booking detail.
- `docs/design/Design Language.dc.html`: tokens.
  - Teal for Save adjustment and Price override.
  - The neutral pill for recorded layers; the warning tint only for "not allowed".
  - Crimson never.
  - Spline Sans Mono for every figure and percent.
- No mockup draws the adjustment. Extend the capture-section and Review-pill patterns rather than
  inventing a new panel.

**Catalogue.** The covered items above, plus
[US-04.3.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.3.5.md)
(the locked Contract that US-05.4.1 names; Phase 25 builds the lock) and
[FT-07.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-07.2.md)
(SUBMITTED review, where the office overrides). In `domain-model.md`, see section 3's pipeline: "then
apply anaesthetist adjustment (if allowed), then office override".

**Analysis.**
- `../GAP-ANALYSIS.md`: theme 6 and the DM-12 and RV-11 rows, then the EP-03, EP-04 and EP-05
  tables.
- `../epics/EP-03.md` (FT-03.5, US-03.5.1), `../epics/EP-04.md` (US-04.2.2) and `../epics/EP-05.md`
  (FT-05.4, US-05.4.1).
- `../analysis/domain-model-delta.md` (DM-12) and `../analysis/reverse-check.md` (RV-11).
- The code maps: `../analysis/prototype-map-domain.md`, `prototype-map-shared.md` and
  `prototype-map-admin.md`.

**Code entry points.** These are named as at the snapshot; use the names 15 to 23 left.
- `src/domain/types.ts`:
  - `PriceOverride` (~l.434) and `Procedure.priceOverride` (~l.501);
  - `Contract` (~l.216, reshaped by 18);
  - the `by` and `atISO` shape that `CardCancellation` (~l.343) uses.
- `src/domain/billing/fee.ts`:
  - `feeFor` (~l.180): the override block ~l.254 to 267;
  - `AppliedOverride` and `FeeResult` (~l.146 to 166);
  - Phase 23's Booking-level engine beside it.
- `src/domain/billing/validateCardForBilling.ts` (`validateBookingForBilling` after 15/21): the
  price-override checks (~l.232 to 243) and the base code and time checks (~l.130 to 160) that the
  "recorded in full" rule must share.
- `src/domain/billing/invoiceBuild.ts` (~l.369 to 378): the "Price override, {reason}" delta line.
- `src/domain/billing/index.ts` (re-exports) and `src/domain/billing/fixtures.ts` (`mkContract`).
- `src/store/lifecycle.ts`:
  - `ProcedurePatch` (~l.443);
  - `editProcedure` (~l.445);
  - `editRefusal` (~l.48): the anaesthetist on their own DRAFT List, the office on DRAFT and
    SUBMITTED, integrations DRAFT only.
- `src/store/contractActions.ts`: `ContractInput`, `createContract`, `editContract`.
  `setProcedureContract` is Phase 20's, in `store/cardActions.ts` or `contractSelectionActions.ts`.
- `src/shared/capture/OverrideCard.tsx`, to be replaced.
  - It is mounted in `BtmCaptureBlock.tsx` ~l.249, in a `Pair` with `BillingLinesCard`.
  - Its anchor field `'priceOverride'` sits in the `anchored` set ~l.107.
- `src/shared/flows/PriceOverrideSheet.tsx` and `src/shared/card/OfficeBillingSetup.tsx` (the
  Override row ~l.49 to 55, and the "Price override" button).
- `src/shared/card/CardDetailBody.tsx`: `cardBreakdown.overrideNote` ~l.238 to 248, and
  `showCardTotal = actor.role !== 'anaesthetist'` ~l.134.
- `src/shared/surface/context.ts` (`CardTotalProps.overrideNote`) and
  `src/shared/capture/CardTotalPanel.tsx`.
- `src/shared/capture/feeContext.ts`: `procedureFee` and `cardFee`, or the Booking-level view 23
  left.
- `src/apps/admin/screens/ReviewScreen.tsx` (the Fee column) and `src/apps/admin/reviewFlags.ts`
  (pure, tested).
- `src/apps/admin/flows/ContractEditSheet.tsx`, the Contract detail panel after 18.
  `src/apps/admin/screens/MasterData.tsx` holds `ContractsView`.
- `src/shared/audit/auditNarrative.ts` (`formatShape` ~l.132), `fieldLabels.ts` (~l.60) and
  `actionLabels.ts`.
- `src/domain/seed/contracts.ts`, `src/domain/seed/cards.ts`, `src/domain/seed/audit.ts` (~l.99,
  the procedure snapshot), `src/domain/seed/index.ts` (`SEED_LIST_IDS.morrisonMon20`,
  `SEED_MARKERS`) and `src/domain/seed/seed.test.ts`.
- Tests that construct `priceOverride` today:
  - `fee.test.ts`, `validateCardForBilling.test.ts`, `invoiceBuild.test.ts`;
  - `billingRun.test.ts`, `mastersActions.test.ts`, `auditNarrative.test.ts`.
- Playwright:
  - `visual/admin-phase06.spec.ts` ~l.45 to 55 (the office % override, `a-05-override.png`);
  - `visual/card-attachments.spec.ts` ~l.44 (`expectSameHeight(page, 'Adjustment and charge',
    'Billing lines')`).

## Work items

1. **Model** (`domain/types.ts`). Satisfies DM-12.
   - **Rename** `PriceOverride` to `OfficeOverride` and `Procedure.priceOverride` to
     `Procedure.officeOverride`. The union is unchanged: `fixedFee`, `dollarAdjustment` or
     `percentAdjustment`, each with a mandatory `reason`. Add `by` and `atISO`, the same shape
     `CardCancellation` uses, so Review and the Booking can say who set it without reading the audit
     trail.
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
2. **Pure rules** in a new `src/domain/billing/adjustments.ts`, re-exported from the billing index,
   with Vitest tests in `adjustments.test.ts`:
   - **`adjustmentAllowed(contract)`**: true only when the Contract exists and
     `allowsAnaesthetistAdjustment` is true. A Procedure with no Contract is never allowed.
     US-04.2.2 AC 5, US-05.4.1.
   - **`btmRecordedInFull(procedure, primary, ctx)`**: the FT-03.5 gate "once BTM units are
     recorded in full". Since Phase 23, B and M belong to the Booking's primary Procedure (an
     additional Procedure has base 0 with `baseSource: 'additional'`, and no ASA of its own), so they
     are read from `primary`; T is read from the Procedure itself. It is true when:
     - **B:** the Procedure has an RVG code in the master, and the base-unit resolver (19's, with
       23's Contract override) returns a base for the **primary**, including a selected value where
       the primary's base is ranged;
     - **T:** this Procedure's start and handover are both recorded, and handover is after start;
     - **M:** the **primary's** ASA class is recorded.

     For the primary itself, `primary` is the same Procedure. Test both: an additional Procedure
     passes once its own times and the primary's B and ASA are recorded, and fails while the
     primary's ASA is blank (this is what makes test G2 reachable).

     **Rule for M (a prototype reading).** M counts as recorded once the primary's ASA class is set,
     because the ASA class is the one modifier every anaesthetic carries. Other modifiers can
     legitimately be none. The validator does not require ASA today, so this is a new check, not an
     extracted one. Record it in the Decisions log.

     **One source for the B and T checks.** Extract the validator's existing base-code and time
     checks into a shared predicate that both `validateBookingForBilling` and this helper call. Do
     not copy them, so completion and the adjustment gate cannot disagree.

     A Procedure with no RVG code, such as a rate x time line, is never "recorded in full". The
     field therefore never shows for it.
   - **`applyAdjustmentLayers(baseTotal, adjustment, allowed, override)`** returns `{
     beforeAdjustment, adjustment: AppliedAdjustment | null, afterAdjustment, override:
     AppliedOverride | null, total }`. `AppliedAdjustment` is `{ adjustment, permitted: boolean,
     before, after }`.
     - **Adjustment:**
       - `percentDiscount`: `roundToCents(base * (1 - percent/100))`.
       - `fixedFinal`: `roundToCents(amount)`.
     - **A stored adjustment the Contract does not allow** is returned with `permitted: false` and is
       **not applied**. The engine never discounts against the Contract. The validator and Review
       surface it (items 4 and 8), so it is never silent.
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
3. **Engine wiring** (`fee.ts` and Phase 23's Booking-level engine):
   - **Per-Procedure layering.** Replace the override block in `feeFor`. The per-Procedure base
     that 23's engine produces (after the multi-procedure rule and the 3/2/2 split) goes through
     `applyAdjustmentLayers` with that Procedure's own Contract permission.
   - **Booking total** = the sum of the per-Procedure totals.
   - **`FeeResult`** gains `adjustment: AppliedAdjustment | null` and `afterAdjustment`.
     - `subtotal` stays the base, before any layer.
     - `override.before` becomes `afterAdjustment`.
     - Update every reader:
       - `procedureFee` and `cardFee` in `feeContext.ts`, or 23's Booking view;
       - `ReviewScreen`;
       - `invoiceBuild`;
       - `billingRun`;
       - the prepayment estimate path.
   - **Test G2, a multi-procedure Booking under 23's rule.** An adjustment on the additional
     Procedure changes only that Procedure's post-rule fee. The primary's fee and the 3/2/2 unit
     shares are unchanged.
   - **Covered amount (22).** Confirm the covered split reads the Procedure's **final** total,
     after both layers. Add a test where a discount takes the total below the covered amount: the
     patient share never goes negative. If 22 has no rule for this, the validator refuses: "The
     adjustment takes the fee below the amount {holder} covers. Change the adjustment or the
     override."
4. **Validator** (`validateBookingForBilling`). Every message is verbatim and has no dashes.
   - `anaesthetistAdjustment` reason blank: "Give a reason for the adjustment."
   - Percent out of range: "Enter a discount above 0 and up to 100 percent."
   - Negative fixed final: "The final price cannot be negative."
   - Stored but not permitted: "{Contract} does not allow an anaesthetist adjustment. Remove it."
   - `officeOverride`: keep the existing reason and "makes the fee negative" checks, re-keyed to
     the new field and computed on the layered total.
   - The failure fields are `anaesthetistAdjustment` and `officeOverride`, so the capture latch
     anchors each to its own card.
   - Update `validateCardForBilling.test.ts`.
5. **Store actions** in a new `src/store/adjustmentActions.ts`, exported from `store/index.ts`,
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
   - **Contract change clears a disallowed adjustment.** Phase 20's `setProcedureContract` does this
     in the same `mutate()`, with a second meta, when the new Contract does not allow adjustment
     and an adjustment is stored. The meta is `procedure.anaesthetistAdjustment`, with `after:
     undefined` and a note "Removed: {Contract} does not allow an anaesthetist adjustment". The
     Contract picker sheet warns before the tap: "Your 10% discount will be removed. {Contract}
     does not allow adjustments."
   - **Tests** (`adjustmentActions.test.ts`):
     - each refusal;
     - the rights matrix across DRAFT, SUBMITTED and AUTHORISED for anaesthetist, office and
       integration;
     - the audit entries;
     - the Contract-change clear, with two metas and one state change;
     - the office clear of a disallowed adjustment only.
6. **Contract rule: editor and store.** Covers US-04.2.2 AC 5.
   - **Store.** `ContractInput` and `ContractEditPatch` gain `allowsAnaesthetistAdjustment`.
     `createContract` defaults it to false when the caller omits it. Phase 18's "add hospital
     creates its RVG Default Hospital" path writes false explicitly.
   - **Contract detail panel** (`ContractEditSheet`, Pricing section after 18). Add a Segmented
     control, "Anaesthetist adjustment", with the options "Not allowed" and "Allowed: % discount or
     fixed final price". The caption reads: "When allowed, the anaesthetist can discount the fee or
     set a final price, with a reason. The office can always override."
   - **Contract catalogue** (`ContractsView`). Allowed Contracts carry a neutral pill "Anaesthetist
     may adjust".
   - **Labels.** `FIELD_LABELS.allowsAnaesthetistAdjustment` is "Anaesthetist may adjust the price",
     so History reads correctly.
   - **Hooks:** `data-shot="contract-adjustment-rule"`.
   - **Tests:** create, edit and audit in `mastersActions.test.ts` or `contractActions` tests.
   - **Before Phase 25.** Toggling the flag off on a Contract in use leaves stored adjustments in
     place. They go "not permitted" (items 2, 4 and 8) until someone removes them. Phase 25's
     versions make this a per-version value.
7. **Anaesthetist capture UI.** `shared/capture/OverrideCard.tsx` is replaced by
   `shared/capture/AdjustmentCard.tsx`, imported directly by `BtmCaptureBlock` as `OverrideCard` is
   today (it is not in `shared/capture/index.ts`). Delete `OverrideCard.tsx`. The same component serves mobile and the anaesthetist web app through
   `useSurface()`.
   - **Contract does not allow it:** render nothing. The field is not offered at all (US-04.2.2,
     US-05.4.1). `BillingLinesCard` takes the full row: make `Pair` handle a single child, or mount
     it alone.
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
   - **No money shown.** Show no calculated fee (the 2026-09-28 ruling; drift check 3).
   - **The office override.** When an office override exists, the anaesthetist sees one read-only
     caption, "The office has also set a price override on this procedure.", with no figures.
   - **Read-only views** (a SUBMITTED or AUTHORISED List, or the office viewing): "Discount 10% ·
     {reason} · Dr {surname}" or "Final price $300.00 · {reason} · Dr {surname}", using
     `drSurname` from `shared/format.ts`.
     - **If the adjustment is not permitted:** add a warning-tint line "{Contract} does not allow an
       anaesthetist adjustment. It is not applied."
     - **The office's Remove action:** a teal link that calls the office clear from item 5.
   - **Anchors.** Replace `'priceOverride'` in `BtmCaptureBlock`'s anchored set with
     `'anaesthetistAdjustment'`. The card carries `validationTarget` for that field, so "Mark
     complete" scrolls to it and focuses it.
   - **Remove the office's copy.** The office no longer edits a price from the capture block. Its
     override lives only in Office billing setup (item 8).
   - **Copy.** Delete `OverrideCard`'s "Adjustment and charge", "Percentage adjustments are set by
     the office.", "Adjustment $", "Charge $" and "Charge amount $" copy. The office
     `PriceOverrideSheet` keeps its own "$ adjust" mode and "Adjustment $ (negative reduces)" label:
     the office override keeps all three kinds. Update the sheet's header comment, which describes
     `OverrideCard`.
   - **Hook:** `data-shot="adjustment-card"`.
8. **Office surfaces** (Admin; the office web Booking detail and Review). Covers FT-05.4 and
   US-05.4.2.
   - **`OfficeBillingSetup` rows:**
     - **Anaesthetist adjustment:** "None", "Discount 10% · Dr Morrison", "Final price $300.00 · Dr
       Morrison", or a warning chip "Not allowed by {Contract}".
     - **Office override:** the renamed Override row. The "Price override" button keeps its name, so
       the Playwright spec's locator holds.
   - **`PriceOverrideSheet`** (office only):
     - It writes through `setOfficeOverride`.
     - It shows context lines above the type control, in mono: "Calculated $360.00" and "After the
       anaesthetist's 10% discount $324.00". The office then sees exactly what it overrides.
     - Its heading is "Office price override".
   - **Admin Booking total** (`CardTotalProps`). Add `adjustmentNote` beside `overrideNote`.
     - For one Procedure: "Calculated $360.00 · anaesthetist discount 10% · $324.00" and "Office
       override · was $324.00".
     - For several: "Adjusted on n of m procedures" and the existing override count sentence.
     - `CardTotalPanel` renders both lines. The mobile `CardTotal` still renders nothing.
   - **Review** (`ReviewScreen`, `reviewFlags.ts`, which stays pure with new inputs as parameters):
     - The **Fee** cell shows the final Booking fee. When any layer applies, it adds a second mono
       line in mist, "was $360.00", giving the base before any layer.
     - **Flags:**
       - "Discount 10% by Dr {surname}" or "Final price by Dr {surname}" (neutral);
       - "Office override" (neutral);
       - "Adjustment not allowed by {Contract}" (warn).
     - The flags tile and the "flags open" count pick these up. Test them in `reviewFlags.test.ts`.
   - **Hooks:** `review-adjustment-flag`, `office-override-sheet`, `booking-total-layers`.
9. **Invoice** (`invoiceBuild.ts`; the layout from 22). Covers FT-05.4.
   - After a Procedure's fee lines, add up to two visible delta lines on the Procedure's billable
     party group:
     - "Anaesthetist adjustment, 10% discount, {reason}", or "Anaesthetist adjustment, agreed final
       price, {reason}", with amount `after - before`;
     - then the existing "Price override, {reason}", with amount `total - afterAdjustment`.
   - A not-permitted adjustment raises no line.
   - This follows the Phase 08 pattern, which carries the reason on the line. Do not change that
     pattern here, but raise with the owner whether reasons should print on a customer invoice.
   - A 100% discount gives a $0.00 group, and a $0.00 group raises no invoice (the existing rule).
     B, T and M stay on the Booking.
   - **Tests** (`invoiceBuild.test.ts`, `billingRun.test.ts`):
     - both lines, in order, reconciling to the invoice subtotal to the cent;
     - the 100% case raises no invoice and leaves the units intact;
     - the not-permitted case;
     - S3's figures are unchanged: Holt $396.18, Prentice $152.38 and $91.43, or the figures Phase
       22 re-based them to.
10. **Seed, then the persist bump.**
    - **Contracts** (`contracts.ts`, labelled demo readings):
      - `allowsAnaesthetistAdjustment: true` on **RVG Default Post-paid** (`CT-RVG-POSTPAID`, new in
        Phase 18; it does not exist at the snapshot). The anaesthetist bills their own patient and may
        discount.
      - `false` on every other Contract: each RVG Default Hospital, nib, SXAP, Health NZ, both ACC,
        Doyle bariatric, the CES HNZ schedule and the Aria rate x time Contract, whose price is
        already individually arranged.
      - If 18 to 21 seeded an RVG Default Pre-paid-like Contract or another patient-direct RVG
        Contract, it is true there too.
    - **The capture beat.** Dr Souter needs an uncaptured Booking on RVG Default Post-paid on a
      DRAFT List of hers.
      - Put it on her pinned Mon 27 Jul List, beside the Aria rate x time capture Booking, so one
        List shows both states: the field offered on one Booking and absent on the other. Reuse an
        existing Booking if 20 or 21 already seeded one there.
      - Otherwise add one explicit scenario Booking, "Excision of skin lesion, self funded", for a
        pinned patient with a fixed valid NHI and an email. Record it as
        `SEED_MARKERS.adjustmentCaptureBooking`.
      - Add nothing to the generator, and touch no RNG input.
    - **The Review beat.** On Dr Morrison's Mon 20 Jul SUBMITTED List (`SEED_LIST_IDS.morrisonMon20`,
      S2 Beat 4, which quotes no figures), one completed Booking on RVG Default Post-paid carries a
      seeded **10% discount**, reason "Long-standing patient, courtesy discount".
      - At the snapshot every Booking on that List is St George's hospital-billed (default or ACC),
        so none is on Post-paid. Unless 20 or 21 already put one there, add one explicit, fully
        captured scenario Booking at the end of the List (self funded, a pinned patient with a fixed
        valid NHI and an email, primary with ASA). Seed its Contract selection so it raises no Phase
        20 "Contract changed by anaesthetist" flag (office-set or already approved, whichever 20
        provides), so the adjustment is the only new flag on the row.
      - Check S2 Beat 4's counts and any Review-count assertions in tests after adding it.
      - It gets a matching seeded audit entry by Dr Morrison in `seed/audit.ts`.
      - Record it as `SEED_MARKERS.adjustedBooking`.
      - Do not use the Booking that Phase 20 gave the "Contract changed by anaesthetist" flag.
    - **Seed tests:**
      - every seeded adjustment is permitted by its Contract and has a reason;
      - every seeded Booking with an adjustment has BTM recorded in full (`btmRecordedInFull`);
      - no seeded `officeOverride` has an anaesthetist `by`;
      - the S3 and S5 invoice figures are unchanged;
      - the generated canvas is unchanged.
    - **Persist.** Bump `PERSIST_VERSION` by one from the value Phase 23 left.
11. **Copy, labels, audit and shots.**
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
      - Rewrite `card-attachments.spec.ts`'s equal-height check to use "Price adjustment" on an
        allowing Booking, and assert the card is absent on a non-allowing one.
      - Add shots: `adjustment-card` (mobile and web, allowed and before BTM),
        `review-adjustment-flag` and `contract-adjustment-rule`.
    - **Copy:** no en or em dashes anywhere. Teal on every new action. Crimson nowhere.
12. **Decisions log** (PROGRESS.md), superseding and recording:
    - **Superseded:** the 2026-07-22 seventh review A6/B5 half that reads "mobile's legacy
      Adjustment/Charge fields now write the typed $/fixed overrides". The anaesthetist now writes a
      separate, Contract-gated percent or fixed final adjustment, and the office's full typed editor
      is the only override. RV-11 is closed. `OverrideCard`'s header comment goes with it.
    - **Superseded:** Phase 08's single "Price override" invoice line. There are now two layered
      delta lines.
    - **Readings:**
      - M counts as recorded once the primary's ASA class is set, and an additional Procedure reads B
        and M from the primary (Phase 23's model);
      - the office does not edit the anaesthetist's adjustment, only overrides on top of it, apart
        from clearing a disallowed one;
      - a stored, disallowed adjustment is never applied and is always flagged;
      - a Contract change clears a disallowed adjustment, with a warning first;
      - the anaesthetist still sees no fee (drift check 3; the owner's answer if one came);
      - the domain model lists `AMOUNT`, and the stories win (drift check 2).

## Demo triggers

**None.** Everything in this phase is normal use:
- the anaesthetist captures and adjusts on mobile or web;
- the office overrides in Admin Review or on the Booking;
- the office sets the Contract rule in Master data.

Nothing is automatic, scheduled or external. Register no trigger and add nothing to the Control
Panel.

**PWA:** no stand-in needed. The handset half of the beat (capture, then the field appearing, then
saving a discount with a reason) is complete on the phone. The office override has no mobile side,
because the anaesthetist sees no fee.

Check two things still work with a layered Booking:
- Phase 14's "Office authorises this List" PWA entry;
- the "Play the office" scaffold.

Authorising prices with both layers, and neither touches the adjustment.

## Out of scope

- **The lock at AUTHORISED (Phase 25).** US-05.4.1's "locked Contract" wording is met there. The
  lock records:
  - the adjustment, the permission it was applied under and its before and after amounts;
  - the office override.

  Until then the permission is read live from the Contract.
- Contract versions and a per-version `allowsAnaesthetistAdjustment` (Phase 25).
- Adjustment on the prepayment estimate (Phase 27). The estimate is set before BTM is recorded, so
  no adjustment can exist then. The balance invoice reads the final layered total.
- Adjustment or override on an additional invoice (Phase 39, D10).
- Ledger legs carrying the layered total (Phase 36).
- A dollar anaesthetist adjustment, a cap on the fixed final price, or an office edit of the
  anaesthetist's adjustment. Build none unless the drift check says so.
- Showing the anaesthetist any fee, unless the owner answers drift check 3 with yes.
- Any change to base units, the multi-procedure rule or the Contract picker beyond item 5's clear
  and warning.

## Manual test checklist

- [ ] **Field absent where not allowed.** Mobile, Dr Souter, Mon 27 Jul: the Aria rate x time
      Booking shows no Price adjustment section. So does any St George's default Booking (S1's Sarah
      Mitchell on Tue 28 Jul).
- [ ] **Gate on BTM.** On the same List, the RVG Default Post-paid Booking shows only "You can
      discount the fee or set a final price once base, time and modifier units are recorded." Choose
      the code, Start now, Finish now and ASA I. The Discount % / Final price control appears without
      a reload.
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
- [ ] **Override over a fixed fee.** A Booking on the Doyle bariatric fixed-fee Contract shows no
      adjustment field. The office can still apply a fixed fee override.
- [ ] **Contract rule in Master data.** Set "Anaesthetist adjustment: Allowed" on St George's RVG
      Default Hospital. Sarah Mitchell's Booking (after capture) now offers the field. Set it back:
      the saved adjustment shows "Not allowed by …" in Review and on the Booking, is not applied to
      the fee, blocks Mark complete for a DRAFT Booking with the validator sentence, and the office
      Remove link clears it.
- [ ] **Scripted beats unbroken.** S1 Beat 3, S2 Beat 4, the S3 Beat 1 figures, S4 and S5 Beat 1 run
      as scripted.
- [ ] No en or em dashes in any new copy; teal on every new action; crimson nowhere new.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots` all green.

## Demo guide updates

In the same session, patch these files in `docs/demo-guide/`, and the same sections of
`master-demo-guide.html`:
- **`03-demo-script.md`:**
  - **S1 Beat 3, "Worth pointing at":** Sarah's St George's Contract offers no price adjustment.
    Adjustments exist only where a Contract allows them. Add an optional aside: Mon 27 Jul, the
    self-funded Booking; capture BTM; the adjustment appears; save a 10% discount with a reason.
  - **S2 Beat 4, "Worth pointing at":** Dr Morrison's discounted Booking. Its Fee shows "was $x" and
    its flag names the discount. Add an optional office override live to show the two layers, then
    authorise.
  - **S4 and S5:** no change. Confirm the S5 Beat 1 History still reads cleanly with the renamed
    labels.
- **`02-workflows-and-handoffs.md`**, anaesthetist capture step 10: "She may record an allowed fixed
  or rate-by-time line, and, where the Contract allows it, a percent discount or final price with a
  reason." Add an office review line: "The office can always apply a price override, on top of any
  anaesthetist adjustment."
- **`01-personas-and-responsibilities.md`:** add the adjustment and override flags to the office's
  review responsibilities.
- **`04-presenter-cheat-sheet.md`:** add a Contract rules line, "Anaesthetist adjustment: allowed
  per Contract, % or final price, reason required; office override always available".
- **Control Panel:** no trigger. Update the S2 scenario message in
  `src/apps/demo/DemoControlPanel.tsx` only if it lists the Review contents.

This is not a milestone phase. Phase 25 runs the next master-guide consistency read.

## Adversarial review (after build)

Run the standard adversarial review-and-fix pass (PROGRESS convention 18). Do it after the manual
test checklist and `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots` are
green, and before writing the PROGRESS entry.
- Fan out three independent Opus review subagents: **quality**, **bugs and money correctness**, and
  **plan and catalogue adherence**.
- This session then independently verifies every finding against the catalogue files and the code,
  fixes the confirmed ones and re-greens.
- Record the pass in the phase entry.
- Do not re-raise anything the Decisions log settles, including the 2026-09-28 "anaesthetist sees no
  fee" ruling.

**Steer this phase's reviewers at:**
- **Order and arithmetic.** The pipeline is exactly: base (23's Booking-level engine), then the
  anaesthetist adjustment, then the office override, per Procedure. Every step rounds to cents in
  one place. The worked examples A to H and G2 hold. The invoice delta lines reconcile to the total
  to the cent.
- **The gate is real in the store, not just the UI.** `setAnaesthetistAdjustment` refuses when the
  Contract does not allow it or BTM is not recorded. `editProcedure` cannot write either layer. The
  anaesthetist cannot write `officeOverride`. The office cannot write an adjustment, except to clear
  a disallowed one.
- **"Not offered at all" means absent.** Where the Contract does not allow it, there is no disabled
  field, no caption and no empty card on mobile or web. The before-BTM caption shows only where the
  Contract allows.
- **Never silent.** A stored, disallowed adjustment is never applied to money, and is flagged on the
  Booking, in Review and by the validator. A Contract change clears one only after warning.
- **US-03.5.2.** A 100% discount leaves B, T and M, `billableUnits` and the audit record intact.
  A $0.00 group raises no invoice and no error.
- **No regressions.** The office override still works on every Contract, including over a fixed fee.
  S3's pinned figures and the covered-amount split are unchanged where no layer applies. The
  "recorded in full" rule shares the validator's predicate rather than copying it. No money appears
  on any anaesthetist surface. `PERSIST_VERSION` is bumped. The generator and canvas are untouched.

## PROGRESS.md updates

- **Status row** for Phase 24, and a phase entry recording:
  - the drift-check result, including the owner's answer on drift check 3 if one came, and the
    domain-model `AMOUNT` note;
  - the `PERSIST_VERSION` from and to;
  - the real names of the engine function and fields used;
  - the tests added;
  - the adversarial review pass.
- **Decisions log:** the entries listed in work item 12.
- **Handoff notes:**
  - **25:** lock `anaesthetistAdjustment`, the permission it applied under, `beforeAdjustment`,
    `afterAdjustment` and `officeOverride` per Procedure. Make `allowsAnaesthetistAdjustment` a
    versioned Contract field. "Regenerate from locked data" must reproduce both invoice delta lines.
  - **27:** the balance invoice reads the layered total.
  - **36:** the ledger legs carry the layered total.
  - **39:** decide whether an additional invoice can carry either layer (D10).
  - **44:** re-script the S1 Beat 3 aside and the S2 Beat 4 note into the rewritten run sheet.
