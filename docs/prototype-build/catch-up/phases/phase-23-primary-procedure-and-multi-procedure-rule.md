# Phase 23 · Primary Procedure, multi-procedure rule and combination Contracts

**Requirements covered:**
[FT-03.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-03.2.md) Booking structure: primary and additional procedures (Confirmed) ·
[US-03.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.2.1.md) One primary Procedure (Confirmed) ·
[US-03.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.2.2.md) Anyone with edit rights can set the primary (Confirmed) ·
[US-04.2.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.5.md) Multi-procedure rule per Contract (Proposed) ·
[US-04.2.11](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.11.md) Combination Contracts (Verify; found through the picker's procedure and hospital filters and AA code search, and a split after invoicing is a credit then rebill) ·
[FT-05.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-05.3.md) Multi-procedure rule, superseding the RFP split-billing rule (Verify) ·
[US-05.3.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.3.1.md) Multi-procedure BTM rule (Open) ·
[US-05.3.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.3.4.md) Contract-specific second-procedure rules (Proposed) ·
[DM-15](../analysis/domain-model-delta.md#dm-15) multi-procedure rule: one primary Procedure, time on every Procedure, modifier units split above four, per-Contract override ·
[RV-02](../analysis/reverse-check.md#rv-02-modifier-units-never-split-across-procedures-the-above-4-total-rule-is-missing) modifier units never split across procedures.
**Reads, without building:** Phase 19a's base units, which live in each procedure's default RVG
Contracts ([US-04.4.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.4.2.md),
[DM-43](../analysis/domain-model-delta.md#dm-43), owner decision D12), and 19a's Contract base-unit
override for a procedure, RVG code or group (the override half of
[US-04.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.2.md),
which closes in 24). This phase reads both through its Booking-level pass: base units count on the
primary only, and on an additional Procedure only inside the percent rule's standalone price.
Builds the combination Contract that Phase 39 credits and rebills per component
([US-08.6.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.6.4.md),
OQ-72). Re-checks [US-05.3.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.3.5.md)
(each Procedure's share recorded, Matches), which must still match afterwards.
Open question: [OQ-15](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-15.md)
(Open: the equal split, for Ben to validate). Answered and built as answered:
[OQ-53](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-53.md) (a combination
is a Contract set against each parent procedure),
[OQ-66](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-66.md) (D16: a short
structured AA code on every Contract, the picker filtered by procedure then hospital, with code search;
a combination Contract is found the same way),
[OQ-62](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-62.md) (D12: base units
live in each procedure's default RVG Contracts, built in 19 and 19a),
[OQ-06](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-06.md) (a Contract may
override base units, built in 19a) and
[OQ-72](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-72.md) (D22: splitting a
combined invoice after it is sent is a credit note, then new additional invoices; Phase 39's).
**Depends on:** Phase 19a (base units held by each procedure's default RVG Contracts, the Contract
base-unit override, the resolver reading the Contract through `contractBaseUnitsFor` (19a's pure
function in `baseUnits.ts`) and filling 19's `contractBaseUnits` slot, the RVG
master as reference only, every Contract scoped to its master procedures, and the RVG time tiers as data,
D25) and Phase 22 (invoice presentation, Contract-driven lines, the Contract payment setting, FULL or
SPLIT with typed $ or % shares set on the Booking (D18) that replaced `funderOverride`, and one BCTI per
receivable invoice). Through them: 14 (the trigger registry), 15 (Booking vocabulary), 15a (the warning
routine, with no submit confirm step), 15b (Copy a Booking removed, photo capture out of the chooser),
16 (the BCTI count, `bctisFor`), 18 (the Contract model, `scope.procedureTypeIds`, the AA code from
`nextAaCode`, `contractSearch` and fee-schedule lines), 19 (the master procedure list `ProcedureType`,
the procedure-first picker and `pickProcedure`, default modifiers through `applyDefaultModifiers` in
place of absorbed ones, `RvgGroupRef`, the out-of-range base-unit warning, D3), 20 (one Contract per
Procedure, the picker filtered by procedure then hospital with the default RVG Contract always offered
and AA code search) and 21 (the Contract-defined billable party, D17, and the schedule-miss flag) are
in place.
**Estimated:** 2 sessions. Session 1: work items 1 to 9 (baseline, model, the pure engine reading 19a's
base units, the combination offer rule, rewiring every fee caller, store actions, seed, tests), ending
green. Session 2: work items 10 to 16 (capture UI with the primary first, Booking total, Review and
invoices, the Contract editor, combinations in the picker, the two triggers, copy sweep, Playwright,
demo guide) and the review pass. Session 1 is the heavy one: it changes the shape of the fee engine
under every caller. If it overruns, finish items 1 to 7 and 9 green and carry item 8f (the Contract
actions) into session 2 with item 12, rather than splitting the engine rewire.

## Goal

Replace the RFP's split-billing rule with the catalogue's multi-procedure rule, give every Booking one
explicit primary Procedure shown first, and add combination Contracts.

- **Exactly one primary, shown first.** `Procedure.isAdditional` becomes `Procedure.isPrimary`, with
  exactly one primary per Booking that has Procedures, guaranteed by the store and asserted by the seed
  test. The primary is always listed first on every surface (US-03.2.2 note); the others follow in
  Booking order. The primary is a choice, not a time order: the first procedure done may not be the
  primary.
- **"Make primary".** Anyone with edit rights (the anaesthetist on mobile and web, the office in Admin,
  and an inbound hospital or surgeon feed) can make another Procedure primary while the Booking is
  editable. Doing so re-anchors base and modifier units in one audited commit. AA staff normally set it
  at creation or import from the order on the rooms' sheet, so the first Procedure entered starts as
  the primary.
- **Booking-level pricing.** Fees are computed for the whole Booking, not one Procedure at a time:
  - base units on the primary only, from 19a's resolver for the primary's own Contract (its override
    for that procedure, code or group if it has one, otherwise the procedure's default RVG Contract),
    and structurally not editable on an additional Procedure;
  - time units on every Procedure, from its own times and 19a's tier data;
  - modifier units recorded once for the Booking, on the primary. They all stay on the primary while
    the total is 4 or fewer. Above 4 they are split equally across the Procedures, with the remainder
    to the primary: 7 over 3 is 3/2/2, **whichever Contracts the Procedures are on**. OQ-15 is open
    (Ben to validate), so the split lives in one pure function and is labelled provisional there and
    in the Decisions log.
- **Per-Contract rule.** Each Contract carries a multi-procedure rule: RVG default, a percentage of the
  second procedure's own code, a fixed add-on fee, or not billable. An additional Procedure is priced
  by its own Contract's rule. This replaces the Type 3 `procedureOrdinal` rows.
- **Combination Contracts** (US-04.2.11, OQ-53 and OQ-66 answered). A combination such as an
  abdominoplasty, breast lift and liposuction is one Contract set against each of its parent
  procedures. The Contract picker offers it when any of them is picked, and its AA code finds it
  through 20's code search. The Booking records only that Contract on one Procedure, never the
  components. Splitting its invoice after it is sent is Phase 39's credit note then per-component
  additional invoices (US-08.6.4, OQ-72).
- **Visible everywhere it counts.** A seeded three-procedure Souter Booking with 7 modifier units shows
  3/2/2 on the office Booking total, in Review and on invoice lines. A seeded Southern Cross cosmetic
  combination Contract is offered under each of its three procedures. Vitest worked examples cover
  every case.

The anaesthetist still sees no fee (the 2026-09-28 ruling). Their capture shows units and shares only.
Invoices still group by billable party, so the BCTI count (16's `bctisFor`) does not move.

## Before you start: drift check

1. Run `git diff 3d3a18c -- "docs/discovery-reference/Updated Requirements/catalogue" "docs/discovery-reference/Updated Requirements/domain-model.md"`
   and read the hunks for FT-03.2, US-03.2.1, US-03.2.2, US-03.2.3, US-04.2.2, US-04.2.5, US-04.2.11,
   US-04.3.2, US-04.4.2, FT-05.3, US-05.1.4, US-05.1.6, US-05.3.1, US-05.3.4, US-05.3.5, US-08.6.4,
   OQ-15, OQ-53, OQ-66, OQ-06, OQ-62, OQ-72 and OQ-77. Re-read the domain model's "Procedure" and
   "Contract (recommended structure)" sections (the `scope` row with `procedures[]`, the
   `baseUnits / baseUnitOverrides` row and `multiProcedureRule`), the Contract selection paragraph
   (procedure first, then a Contract filtered by the hospital, with AA code search; a combination is a
   Contract) and "3. Calculation rules" (the units table and the 7 over 3 worked example).
   - If an item changed, re-read it whole and adjust the work items.
   - If one is now Retired or Future, drop its work and say so in the PROGRESS entry.
   - Watch in particular for: a changed threshold (4) or remainder rule (OQ-15), the rule options on
     US-04.2.5, whether US-04.2.5 or US-05.3.4 has moved off Proposed, and any change to how a
     combination Contract is recorded on the Booking (US-04.2.11).
2. Confirm the open question and the Proposed stories.

| Gate | If still open (what to build) | If answered differently |
|---|---|---|
| **OQ-15** (Open: Ben to validate the equal integer split, remainder to the primary, whichever Contracts) | Build it exactly as written: `floor(total / n)` each, `total mod n` added to the primary, and Procedures on different Contracts split together. Keep it in one pure function (`allocateModifierUnits`) with the remainder policy as one named constant, so Ben's answer is a one-place change. Label it provisional there, on the Contract editor's RVG default caption and in the Decisions log. The participant reading (item 3) is part of the same provisional point | If the remainder goes elsewhere, or rounding differs, change `allocateModifierUnits` and its tests only. If the split must include Procedures whose Contract replaces the rule, drop the participant filter in item 3 |
| **US-04.2.5 / US-05.3.4** (Proposed) | Build all four options. The three non-default ones carry a neutral "Proposed" pill in the Contract editor | Adjust to the confirmed text |

   Answered, so build the answer with no provisional label:
   - **OQ-53**: a combination is a Contract set against each parent procedure (item 6).
   - **OQ-66** (D16): every Contract carries 18's short AA code, and 20's picker (procedure, then
     hospital, with AA code and holder code search) is how Contracts are found. A combination Contract
     adds no navigation of its own: it carries its AA code from `nextAaCode` and is found by it.
   - **OQ-62** (D12) and **OQ-06**: base units live in each procedure's default RVG Contracts, and any
     other Contract may override them for a procedure, code or group. Both are 19a's; this phase reads
     the resolver's answer and never decides base units itself.
   - **OQ-72** (D22): a split asked for after the combined invoice is sent is a credit note against the
     original, then one additional invoice per component (Phase 39; the rebill total and a split before
     invoicing are OQ-77, also 39's).
3. Read what Phases 14 to 22 actually built (their PROGRESS entries). File and symbol names below are as
   at `3d3a18c` (Phases 14, 15 and 15a session 1 built; Booking vocabulary in the code). Follow any
   rename a later phase made:
   - 15: `store/bookingActions.ts` (`createBooking`, `addProcedure`, `removeProcedure`,
     `addPostOpAddendum`), `shared/booking/BookingDetailBody`, `validateBookingForBilling.ts`
     (`feeContextFor`), `buildInvoicesForBooking`, `buildPrePaymentInvoiceForBooking`,
     `BookingTotalPanel`, `bookingFee` (with `BookingFeeTotals`), seed `bookings.ts`, the markers
     `splitBillingBooking` and `bariatricType3Booking`, refusal `bookingCancelled`, routes
     `…/bookings/:bookingId`.
   - 15a: the warning routine and how a rule registers; the warning shows on opening the Booking and
     there is no confirm step at submit (US-13.7.3). Phase 19's out-of-range base-unit warning (D3) is
     one of its rules; item 7 makes it read the primary only.
   - 15b: Copy a Booking is gone from the store, the three apps and the seed (US-02.4.3 Retired), and
     photo capture is out of the Add a booking chooser (at most a badged Future-scope demo). Confirm
     `copyBooking` no longer exists, so no creation path makes a Booking whose only Procedure is
     additional (FT-03.2's former copy point, DM-39).
   - 16: `bctisFor`, the one BCTI count. This phase must not change what it counts.
   - 18: the Contract shape (category, holder, `scope` with `procedureTypeIds`, pricing basis, `aaCode`
     from `nextAaCode`, `issuedAaCodes`), `contractSearch` and `FeeScheduleLine`, which replaced
     `ContractPrice`. 18 kept `FeeScheduleLine.procedureOrdinal` as a labelled interim for the bariatric
     row (`CP-BAR-3`, holder code `BAR-HER2`, 49120 ordinal 2, $950), and `matchFeeScheduleLine` still
     takes `procedureOrdinal` and `isAdditional` keys. Item 2 removes all three.
   - 19: `baseUnits.ts` (`resolveBaseUnits` and its `source` values), `BtmBreakdown.baseSource`, the
     `ProcedureType` master, `Procedure.procedureTypeId`, `procedureTypesForCode`, the procedure-first
     `ProcedurePickerSheet` and its `pickProcedure` store action (it writes code, link, description and
     default modifiers in one commit), `applyDefaultModifiers`, `scopeCoversProcedure`, the modifier
     master as store data (no absorption), `RvgGroupRef`, `groupsOfCode`, the out-of-range base warning
     (D3) and `feeParity.test.ts`. Note which entries exist for abdominoplasty, breast lift and
     liposuction.
   - 19a: the per-procedure default RVG Contracts (one or two, single value, range or one per kind, and
     their ids, AA codes and category), the Contract base-unit override (its type, store actions, editor
     section and hook, and the precedence 19a built: manual override, the Procedure's own Contract
     override for its procedure, code or group, the chosen value on a ranged figure, the default RVG
     Contract's value), how the resolver gets `contractBaseUnits` for a Procedure from its Contract,
     what is seeded on pick (a chosen value on a ranged default RVG Contract), how every existing
     Contract's procedure scope was derived from its schedule lines, and the time tiers as data.
   - 20: each Procedure selects its own Contract; `contractOptionsFor` (returning `{ defaults, others,
     total }`, defaults always offered and the search run over the in-scope set only), how it narrows
     through `scopeCoversProcedure` and the hospital, and that a Procedure with no master entry and no
     code sees only Contracts with empty procedure, code and group scope. Also how `addProcedure` picks
     the new Procedure's Contract, and `setProcedureContract`.
   - 21: the Contract-defined billable party (D17), and `isScheduleMiss`, which Phase 21 left untouched
     for additional Procedures.
   - 22: the Contract-driven invoice line format, the payment setting (FULL or SPLIT, typed $ or %
     shares) and its guard, `Booking.splitShares` (keyed by Procedure; 22's handoff asks this phase to
     re-key it if Booking-level pricing moves the priced line), `splitFee`, the Split row that replaced
     `FunderAllocationSheet` in `OfficeBillingSetup`, the deleted funder conservation branch, and
     invoice grouping by billable party.
4. Record the current `PERSIST_VERSION` (16 at `3d3a18c`, set by 15a session 1; 15b to 22 will have
   bumped it).

## Reference

**Design (convention 17).** Capture follows `docs/design/Mobile App.dc.html` screen 3 (the procedure
card, the ASA segmented card, the B / T / M stepper rows with their seeded captions, the modifier
chips) and its web twin in `Web Dashboard.dc.html`'s card anatomy. The Booking total, Review row and
per-procedure breakdown follow `Admin Review.dc.html` (mono tabular units, the TOTAL UNITS block, row
flags). The pill shape (`r-pill`), the accent tint note, the tokens and the `motion/selection-slide`
pattern come from `Design Language.dc.html` (transcribed in `src/theme/`). The design has no
provisional badge: "Provisional", "Proposed" and "Combination" markers are small neutral pills, as
Phases 19 and 22 do (not `DemoBadge`, which means demo simulation). Teal is the only action colour:
"Make primary" is a teal text action beside Edit. The "Primary" marker is a neutral pill, never crimson
and never a status colour. No mockup covers the Contract editor or the Contract picker; extend the
existing `ContractEditSheet` sections, 20's `ContractPickerSheet` rows and the Admin Review table
anatomy.

**Catalogue.** The files linked above, plus
[US-03.2.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.2.3.md)
(add additional Procedures, each with its own Contract; built in 20),
[US-03.3.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.3.3.md)
(recorded start and handover times),
[US-04.2.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.4.md)
(fixed fee schedule lines),
[US-04.3.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.3.2.md)
(the picker filtered by procedure then hospital, the default RVG Contract always offered, AA code
search; built in 20),
[US-05.1.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.1.4.md)
(default modifiers, pre-filled and untickable; built in 19) and
[OQ-77](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-77.md) (the rebill
total and a split before invoicing, Phase 39's). `domain-model.md` sections "Procedure", "Contract
(recommended structure)" (the `scope`, `multiProcedureRule` and `baseUnits / baseUnitOverrides` rows),
the Contract selection paragraph and "3. Calculation rules". The meeting notes
`catalogue/notes/2026-10-01-aa-meeting-with-greg.md` points #8, #27 and #46 (the split, combinations and
the primary) and `catalogue/notes/2026-10-02-aa-meeting-with-greg.md` points #3, #7 and #13 (base units
in default RVG Contracts, the AA code and the filtered picker, the credit-and-rebill split). The
catalogue screenshots on US-03.2.1, US-04.2.5 and US-05.3.4 show the superseded "time units only"
caption, ordinal rows or the ordinal-rule caption; they are not a spec, and the Catalogue screenshots
step re-shoots them.

**Analysis.** `../GAP-ANALYSIS.md`: theme 4 (multi-procedure and primary Procedure) and theme 3
(Contract replaces the billing route, for the picker), the DM-15 row of "Structural changes", the RV-02
row of "Prototype behaviour to remove or rework", the "Demo-trigger buttons" summary, and the EP-03,
EP-04 and EP-05 tables. `../epics/EP-03.md` (FT-03.2, US-03.2.1, US-03.2.2), `../epics/EP-04.md`
(US-04.2.5, US-04.2.11, US-04.2.2, US-04.4.2) and `../epics/EP-05.md` (FT-05.3, US-05.3.1, US-05.3.4,
US-05.3.5). `../analysis/domain-model-delta.md#dm-15` (and DM-09, which moves `procedureOrdinal` onto the
Contract's rule, DM-07 for combination scope, DM-43 for where base units live and DM-44 for default
modifiers), `../analysis/reverse-check.md` (RV-02). Code maps: `../analysis/prototype-map-domain.md`
(section 5, billing maths), `prototype-map-shared.md` (capture suite, Booking body, flows),
`prototype-map-admin.md` (Review, Master data contracts), `prototype-map-store-seed.md` (Booking
actions, seed Bookings and Contracts) and `prototype-map-shell-demo-pwa.md` (the PWA sheet and
`pwaPurity`).

**Code entry points (at `3d3a18c`; Phases 15b to 22 will have moved lines and renamed some symbols,
so follow their PROGRESS entries).**

- Types: `src/domain/types.ts`. `Procedure` (453; `isAdditional` at 494, with the RFP comment above
  it), `Contract` (216), `ContractPrice` (250; `procedureOrdinal` at 256; 18's `FeeScheduleLine`),
  `BillingLine` (528), `CapturedUnits` (87) and `UnitProvenance` (86).
- Fee maths: `src/domain/billing/fee.ts`. `resolveBtm` (58), `splitBillingUnits` (107, the rule to
  remove), `FeeContext.procedureOrdinal` (126), `feeFor` (180), the Type 3 additional fallback (204 to
  214), the "time units only" line description (227 to 229). `contracts.ts` `matchContractPrice`
  (ordinal key, 66 and 96; 18's `matchFeeScheduleLine`). Phase 19's and 19a's `baseUnits.ts`. Modifier
  values in `billing/modifierCodes.ts` (AS3 3, OB3 2, P1 2: the seeded 7; 19 moved them to store data).
- Fee callers, every one of which passes an ordinal today:
  - `validateBookingForBilling.ts` `feeContextFor` (77; the ordinal parameter at 79) and any fee check
    22 left there (22 deletes the funder conservation branch);
  - `invoiceBuild.ts` `buildInvoicesForBooking` (264; `feeContextFor` with `index + 1` at 289) and
    `buildPrePaymentInvoiceForBooking` (456; 484);
  - `store/billingLineActions.ts` (ordinal from position at 174 and 259, `feeFor` at 175 and 260);
  - `shared/capture/feeContext.ts` (`procedureFee` 36 with `procedureOrdinal: ordinal` at 54,
    `bookingFee` 74) and its exports in `shared/capture/index.ts` (6); comments naming them in
    `shared/capture/BookingTotalPanel.tsx` (about 21) and `shared/surface/context.ts` (45, 47);
  - `shared/capture/BtmCaptureBlock.tsx`, `shared/booking/BookingDetailBody.tsx` (`bookingTotals` 191,
    `bookingBreakdown` 205 to 246 with `procedureFee(... ordinal: index + 1 ...)` at 214 and the "Time
    units only" note at 229; the ordinal comment at 606 and `ordinal={index + 1}` at 614),
    `shared/flows/FunderAllocationSheet.tsx` (22 deletes it and adds a Split row to
    `OfficeBillingSetup` that reads `splitFee` on the current fee), `shared/booking/OfficeBillingSetup.tsx`
    (`ordinal` prop at 14 and 36; hook `office-billing-setup-${ordinal}` at 58; heading "procedure
    {ordinal}" at 61);
  - `apps/admin/screens/ReviewScreen.tsx` (`primary = procs[0]` at 76), `apps/admin/reviewFlags.ts`
    (`naturalBtm` 53), `apps/web/screens/ListDetailView.tsx` (`procs[0]?.description` at 77);
  - `domain/seed/billing.ts` `contextFor` (81), which feeds `buildPrePaymentInvoiceForBooking`.
- Store: `src/store/bookingActions.ts`. `createBooking` (78; first Procedure at 138),
  `addPostOpAddendum` (290; its Procedure at 364, `isAdditional: false`), `addProcedure` (422 to 470;
  `isAdditional: true` at 450), `removeProcedure` (502; the by-position guard from 519). With
  `copyBooking` (196) gone in 15b, these are the only places a Procedure is created. `store/lifecycle.ts`
  `editRefusal` (48; integration actors may edit DRAFT only) and `editProcedure` (438). Every capture
  write (`AsaCard`, `ModifierChips`, `UnitsCard`, the procedure card) goes through `editProcedure`;
  `ProcedureCodeCard.pick` sends `baseUnitsSelected: undefined, baseUnitsCaptured: undefined` with a
  code change (42; 19's `pickProcedure` replaces it, check what it sends). `store/contractActions.ts`
  (`editContract` 106, `addContractPrice` 200 with the ordinal at 217).
  `store/integrationActions.ts` `integrationActor(feedId)` (45, private, labels from `FEED_META`; its
  `createBooking` calls at 150 and 467); `domain/integrations/feeds.ts` (the feed configs at 82 to 84
  carry `hospitalId`: St George's, Christchurch Public and Southern Cross only).
- Capture (shared by mobile, web and admin): `UnitsCard.tsx` (`isAdditional` prop at 22; B and M
  captions at 59 and 77), `BtmCaptureBlock.tsx` (the header with "PROCEDURE n", Edit and Remove at 123
  to 180, Remove offered when `ordinal > 1` at 164; the additional note from 209; `AsaCard` disabled at
  217; `isAdditional` passed at 244), `ModifierChips.tsx`, `AsaCard.tsx`, the procedure card (19's) and
  wherever 19a shows the range chooser. `src/shared/flows/RemoveProcedureSheet` is the pattern for the
  new confirm sheet. 20's `ContractPickerSheet` for the combination rows.
- Admin: `src/apps/admin/flows/ContractEditSheet.tsx` (the price rows with the ordinal input at 225 to
  260, hook `contract-price-rows` at 253; 18 and 19a reshape the sections), `apps/admin/screens/MasterData.tsx`
  (the Contracts table).
- Seed: `domain/seed/bookings.ts` (the `addProcedure` spec helper with `isAdditional` at 264 and 275;
  the Holt pair at 545 to 565, 49115 primary and 49120 additional, both AS2, on Forte's default; the
  bariatric pair at 684 to 715, 20880 and 49120, both AS3, on `CONTRACT.doyleBariatric`),
  `seed/history.ts` (229), `seed/audit.ts` (95), `seed/contracts.ts` (`CONTRACT` at 14 to 27, `CONTRACTS`,
  `CONTRACT.sxap`, `CP-BAR-3` at 143; 18 and 19a add to it), `seed/rvgCodes.ts` (20941, 49115 and 49120
  at 15 to 21; 31340 Abdominoplasty at 55; reference values only after 19a), `seed/index.ts` (the
  `splitBillingBooking` scenario at 591 to 595, "Second procedure isAdditional: time units only", and
  `bariatricType3Booking` at 615 to 619, "second procedure priced by the ordinal rule"),
  `billing/fixtures.ts` (38).
- Copy and labels: `shared/audit/fieldLabels.ts` (`isAdditional` 54, `procedureOrdinal` 105),
  `shared/audit/actionLabels.ts`, `apps/demo/DemoControlPanel.tsx` (S3 blurb at 285, steps at 297).
- Triggers: 14's `src/shared/demoTriggers/registry.ts` (route sets such as `MOBILE_LISTS` at 54),
  `src/store/demoActors.ts` and the PWA sheet.
- Tests to rework: `fee.test.ts`, `contracts.test.ts`, `invoiceBuild.test.ts`, `prePaymentInvoice.test.ts`,
  `store/billingRun.test.ts`, `store/captureActions.test.ts`, `store/bookingActions.test.ts`,
  `store/btmCapture.test.ts`, `store/postOpAddendum.test.ts`, `domain/seed/seed.test.ts`,
  `apps/admin/reviewFlags.test.ts`, `src/pwa/pwaPurity.test.ts` (must stay green). Playwright (all in
  `aa-prototype/visual/`): `mobile-phase04.spec.ts`, `admin-phase08.spec.ts`,
  `booking-calculation-display.spec.ts`, `demo-actions.spec.ts`, `pwa-device.spec.ts`.

## Work items

Model, pure engine and seed first, then store, then UI. Every write goes through `mutate()` with an audit
meta. Every rule is a pure function in `src/domain/billing/` with a Vitest test.

1. **Baseline the figures (before any edit).** Regenerate Phase 19's `feeParity.test.ts` fixture from the
   code as it stands (after 19a, so base units already come from the default RVG Contracts). Add a
   census test beside it that lists every seeded Booking with more than one Procedure: its Procedures,
   their Contracts, each one's modifier inputs, the Booking's modifier total, its invoices and its BCTI
   count from `bctisFor`. At `3d3a18c` there are two, the Holt pair (Forte, AS2 on both) and the
   bariatric pair (Doyle, AS3 on both), each with a primary total of 4 or fewer.
   - At the end of the phase the fixture may differ only for the new seeded three-procedure Booking.
     Every other figure is unchanged, S3's Holt invoice included ($396.18 at `3d3a18c`, or whatever 16
     to 22 left), because under this phase's reading (modifiers recorded once, on the primary) neither
     pair has more than 4 modifier units. A reading that summed each Procedure's own modifiers would
     move Holt (AS2 + AS2), which is why item 9a removes the additional Procedures' ASA.
   - The BCTI count per anaesthetist and month is unchanged: grouping by billable party does not move.
   - List any other difference in the PROGRESS entry with its reason. None is expected.

2. **Model** (`src/domain/types.ts`), for DM-15, FT-03.2, US-04.2.5 and US-04.2.11.
   - `Procedure.isAdditional: boolean` becomes `Procedure.isPrimary: boolean`. Rewrite the doc comment
     from the RFP split-billing rule to the catalogue rule, including "the primary is a choice, not the
     first done; an ACC pre-op assessment is a pre-op event (39b), never a Procedure, so never primary".
   - New `MultiProcedureRule`, a discriminated union:
     `{ kind: 'rvgDefault' } | { kind: 'secondCodePercent'; percent: number } | { kind: 'addOnFee'; amount: number } | { kind: 'notBillable' }`.
     `Contract.multiProcedureRule: MultiProcedureRule` is **required**, so the compiler finds every
     Contract literal (19a's default RVG Contracts included). The amount is GST exclusive, like every
     stored price.
   - `Contract.isCombination: boolean`, required (US-04.2.11). A combination Contract lists each of its
     parent procedures in 18's `scope.procedureTypeIds` (two or more, enforced by item 8f and the seed
     test). Nothing else is added: the Booking records only the Contract (item 6).
   - No base-unit field or override type is added here: 19a's Contract base-unit override and the
     default RVG Contracts' base units are the model this phase reads.
   - Remove `procedureOrdinal` from 18's `FeeScheduleLine` (`ContractPrice` at `3d3a18c`), and remove
     both the `procedureOrdinal` and the `isAdditional` keys from `matchFeeScheduleLine`'s query
     (`matchContractPrice` at `3d3a18c`). Position no longer means anything once the primary is a flag.
     The matcher is called for the primary only, and for an additional Procedure only inside the
     percent rule's standalone price (item 4); an additional Procedure never takes a schedule line
     directly. The seeded use moves to the bariatric Contract's rule (item 9).

3. **The multi-procedure allocation, pure** (new `src/domain/billing/multiProcedure.ts`), for FT-05.3,
   US-05.3.1 (AC "Modifier split"), US-03.2.1 and US-03.2.2.
   - `primaryOf(procedures)` returns `{ kind: 'ok'; primary }`, or `{ kind: 'noPrimary' }` or
     `{ kind: 'severalPrimaries'; ids }`. The store guarantees exactly one; the engine refuses the other
     two cases rather than guessing.
   - `inDisplayOrder(procedures)`: the primary first, then the rest in Booking order. Every list of a
     Booking's Procedures (capture, Booking total, Review detail, invoice lines, history labels) uses
     it, so "Procedure 1" is always the primary.
   - `MODIFIER_SPLIT_THRESHOLD = 4`, commented as the catalogue value, and
     `MODIFIER_REMAINDER_TO = 'primary'`, commented "provisional, OQ-15: Ben to validate".
   - `allocateModifierUnits(total, participantIds, primaryId)` returns a record of shares.
     - `total <= 4`: all on the primary, 0 on the rest.
     - Otherwise each participant gets `floor(total / n)` and the primary also gets `total mod n`.
     - Only the primary may be the single participant, which gives it everything.
   - **Who takes part (provisional with OQ-15).** The participants are the primary plus every
     additional Procedure whose own Contract's rule is `rvgDefault`, **whichever Contract that is**
     (US-05.3.1 note): Procedures on different RVG-default Contracts split together. An additional
     Procedure whose Contract replaces the rule (US-04.2.5) is priced wholly by that rule and takes no
     modifier share, so no share is lost; it stays with the others. With every Procedure on an RVG
     default rule (the usual case) this is exactly the catalogue's "split equally across every
     Procedure in the Booking".
   - `ProcedureAllocation { role: 'primary' | 'additional'; rule: MultiProcedureRule; modifierShare: number; bookingModifierUnits: number; splitAcross: number }`.
     `splitAcross` is 1 when nothing was split.
   - `allocateBooking(procedures, ruleFor, bookingModifierUnits)` returns the allocation for every
     Procedure.
   - Tests (`multiProcedure.test.ts`), every worked example written out:
     - 0 units over 3: 0/0/0. 4 over 3: 4/0/0 (at the threshold, all on the primary).
     - 5 over 2: 3/2. **7 over 3: 3/2/2** (the catalogue example). 6 over 4: 3/1/1/1. 8 over 4: 2/2/2/2.
     - 5 over 6: 5/0/0/0/0/0 (every share rounds to 0, the remainder is all of it). 9 over 1: 9.
     - The primary gets the remainder wherever it sits in Booking order (first, middle or last).
     - 7 over 3 with the three Procedures on three different RVG-default Contracts: still 3/2/2.
     - 7 over 3 with the third Procedure on an add-on-fee Contract splits over 2: 4/3, and the third gets
       0.
     - The shares always sum to the total.
     - `inDisplayOrder` puts a primary stored last at the top and keeps the others' order; a primary
       with a later start time than an additional Procedure stays primary.
     - No primary and two primaries are refused.

4. **`feeFor` prices one Procedure from its allocation** (`fee.ts`), for FT-05.3, US-05.3.1, US-05.3.4
   and RV-02.
   - `FeeContext.allocation: ProcedureAllocation` is **required**. `FeeContext.procedureOrdinal` is
     removed. The compiler then finds every caller for item 7.
   - `resolveBtm` keeps reading each Procedure's own inputs and its own Contract's base units through
     19a's resolver. On an additional Procedure base is 0 with a new `baseSource` value `'additional'`
     (added to 19 and 19a's union), whatever its code, its Contract's figure, a range choice or stored
     capture. On the primary, `btm.modifiers` is the Booking's modifier total, computed from the
     primary's ASA and selected codes (19's pre-filled defaults included as captured selections; there
     is no absorption after 19) or its manual capture. An additional Procedure's own modifier inputs are
     ignored: the store forbids them (item 8e), and the engine must not count them twice if old data
     carries them.
   - `splitBillingUnits` is deleted. Charged units are B + T + modifier share on the primary, and T +
     modifier share on an additional Procedure under `rvgDefault`.
   - Additional Procedure under its Contract's rule:
     - `rvgDefault`: T + share at the Contract's unit rate. On a fixed-schedule Contract that has no unit
       rate, at the anaesthetist's own unit value. This is today's fallback with new wording, and it is
       never a schedule miss (check 21's `isScheduleMiss` skips additional Procedures).
     - `secondCodePercent`: `percent` of the Procedure's standalone price, rounded to cents. The
       standalone price is what it would charge as the only Procedure on its Contract: its schedule
       line on a fixed-schedule Contract, otherwise its own base units (from 19a's resolver for its own
       Contract, so that Contract's override applies here) plus its own time units at the Contract's
       rate, with no modifiers. This is a picked reading of "a percentage of the second procedure's own
       code"; log it.
     - `addOnFee`: the amount, as one fixed line.
     - `notBillable`: no anaesthesia line and a result flag `notBillable: true`.
     - In every case, captured non-RVG billing lines on that Procedure still bill: the rule prices the
       anaesthesia component only. Log it.
   - A primary on a fixed-schedule Contract (a combination Contract included) charges its line price.
     Its modifier share is included in that price, so the units show but add no dollars. This is the
     existing reading, restated.
   - Line descriptions, which reach invoice lines (inside 22's line format), with no dashes. A
     single-Procedure Booking keeps exactly the description 22 left, so no single-procedure invoice,
     snapshot or spec changes. With two or more Procedures:
     - primary: "Anaesthesia, primary procedure (B 6 + T 6 + M 3 units)", and when split,
       "(B 6 + T 6 + M 3 of 7 units)";
     - additional: "Anaesthesia, additional procedure (T 2 + M 2 of 7 units)", or "(T 2 units)" with no
       share;
     - "Additional procedure, 50% of 49120 standalone";
     - "Additional procedure, add-on fee".
   - `FeeResult` gains `allocation` (echoed) and `notBillable`. `billableUnits` means the units charged
     at a rate, which is 0 for the percent, add-on and not-billable rules.
   - The typed office price override still applies per Procedure after the rule. Phase 24's
     anaesthetist adjustment will slot in before it, and 24's Contract defined unit rate prices a
     Procedure's charged units through one rate function at the same point the Contract's rate is read
     here: keep that read in one place so 24 replaces it once.

5. **The Booking-level engine** (new `src/domain/billing/bookingFee.ts`).
   - `bookingFeeFor(procedures, ctxFor)`. `ctxFor(procedure)` returns that Procedure's `FeeContext`
     without an allocation, including the `contractBaseUnits` 19a resolves for that Procedure's own
     Contract, so `invoiceBuild` can inject each Procedure's resolved Contract.
   - Pass 1 resolves B/T/M per Procedure (base through 19a's resolver on each Procedure's own Contract)
     and takes the Booking modifier total from the primary. Pass 2 reads each additional Procedure's
     rule from its context's Contract, calls `allocateBooking`, and then calls `feeFor` for each. Base
     units count only on the primary and inside the percent rule's standalone price; nowhere else does
     a Contract base-unit override reach an additional Procedure.
   - It returns `{ kind: 'ok'; primaryId; order; allocations; fees: Record<ProcedureId, FeeResult>; units; total }`
     (`order` from `inDisplayOrder`), or `{ kind: 'structural'; reason: 'noPrimary' | 'severalPrimaries' }`.
   - Export both new modules from `billing/index.ts`.
   - Tests (`bookingFee.test.ts`), dollar figures pinned from a hand calculation written in the test:
     - The seeded three-procedure example (item 9c) at Dr Souter's $26.50: 20941 primary (B 6 from its
       default RVG Contract), 49120 and 49115 additional, AS3 + OB3 + P1 = 7 modifier units. Base only
       on 20941, each Procedure's own T, M 3/2/2, and the total.
     - The same Booking after making 49115 primary: base 5 instead of 6 (49115's default RVG Contract),
       modifiers still 3/2/2 but the 3 now on 49115, and 49115 listed first.
     - The same Booking with 49120 on a second RVG-default Contract at a different rate: still 3/2/2,
       each share priced at its own Contract's rate.
     - 19a's override, read through the pass: the primary on a Contract that overrides its procedure's
       base units takes the override (19a's source value); the same override on an additional
       Procedure's Contract changes nothing under `rvgDefault` and changes the standalone price under
       `secondCodePercent`; making that Procedure primary brings the override into B.
     - Holt: the same total as before the phase (the primary's AS2 is 1 unit, so nothing splits), and
       the invoice still the figure item 1 pinned in `invoiceBuild.test.ts`.
     - The bariatric Booking under `addOnFee` $950 gives the same $2,800 + $950 as today's ordinal row.
     - `secondCodePercent` 50 on a units Contract and on a fixed-schedule Contract.
     - `notBillable`: $0 anaesthesia, but a captured fixed line on that Procedure still bills.
     - A manual M capture on the primary is the total that splits.
     - A single Procedure on the seeded combination Contract (item 9b) charges the combination's line
       price, whichever parent procedure it carries.
     - A single-Procedure Booking is unchanged from today's single-procedure figures (the parity fixture
       proves it at scale).
     - The structural refusals.

6. **Combination Contracts, pure** (US-04.2.11, OQ-53 and OQ-66 answered), in 20's selector module.
   - A combination Contract is offered only on a **positive procedure match**: the Procedure's
     `procedureTypeId` is one of its `scope.procedureTypeIds`. This falls out of 19's
     `scopeCoversProcedure` as 20 uses it, provided the combination's `scope.rvgCodes` and
     `scope.rvgGroups` stay empty (otherwise a code match would offer it to a Procedure with no
     master-list procedure). Item 8f and the seed test enforce that; do not write a second procedure
     or code matcher. Every other filter (hospital, in effect, not retired) applies as 20 built it.
   - `contractOptionsFor` gains a `combinations` list beside `defaults` and `others`: offered
     combination Contracts move out of `others`, listed after the defaults and before the others. 20's
     search applies to `combinations` as it does to `others` (the defaults stay whatever is typed), so
     typing the combination's AA code, or its holder code `SX-COMBO-ABL`, on a parent procedure filters
     the list to it and says what matched. 20's search runs over the in-scope set only, so the code
     does not find it on a procedure that is not a parent. That is the answered navigation (OQ-66): add
     no other.
   - `combinationParts(contract, masters)` returns the parent procedures' names in scope order, for the
     picker caption and the Booking.
   - `coveredByCombination(booking procedures, contracts)` returns, for each Procedure whose
     `procedureTypeId` is a parent of a combination Contract already chosen on another Procedure of the
     same Booking, that Procedure's id and the combination (the inline note in item 13; never a block).
   - The Booking records only the Contract: no component Procedures are created, and the Procedure on
     the combination keeps the parent procedure it was picked from.
   - Tests (extend 20's selector test, add `combination.test.ts`):
     - the acceptance criterion: with the seeded combination set against three procedures, picking any
       of the three on a Southern Cross List offers it;
     - a fourth procedure, an unset procedure and a St George's List are not offered it;
     - its AA code typed on a parent procedure filters to it; typed on a fourth procedure it finds
       nothing new;
     - `combinationParts` order;
     - `coveredByCombination` finds a second Procedure for liposuction beside an abdominoplasty on the
       combination, and nothing when no combination is chosen.

7. **Rewire every fee caller onto `bookingFeeFor`.** No pricing path may read a position afterwards.
   - `validateBookingForBilling.ts`:
     - `feeContextFor(procedure, ctx)` loses its ordinal, and any fee check left in the validator
       (22 deleted the funder conservation branch) prices through `bookingFeeFor`;
     - a structural result is a failure on field `isPrimary`: "This Booking needs exactly one primary
       procedure";
     - whatever 19 and 19a left for a ranged base figure with no value chosen (D3: any value accepted,
       an office warning out of range) applies to the primary only, because base is never charged on an
       additional Procedure.
   - 19's out-of-range base-unit warning rule (in 15a's routine) evaluates the primary only, and
     re-evaluates after Make primary. A warning raised on the old primary clears through the routine's
     normal re-run.
   - `invoiceBuild.ts`:
     - `buildInvoicesForBooking` resolves every Procedure's Contract first, then prices the Booking once
       with `bookingFeeFor` using the resolved Contracts, then keeps its grouping by billable party,
       22's payment-setting split and prepayment netting per Procedure, and orders lines with
       `inDisplayOrder`;
     - 22's `splitFee` applies to each Procedure's allocated fee (after its rule). Each Procedure still
       has its own priced line under its own Contract, so `Booking.splitShares` stays keyed by
       Procedure and needs no re-key (22's handoff), and Make primary does not move a share. Say so in
       the PROGRESS entry, and test a split Contract on an additional Procedure;
     - grouping is unchanged, so the invoices, the ACCPAYs and `bctisFor`'s count are unchanged for
       every seeded Booking; assert that the three-procedure Booking yields one receivable and one BCTI;
     - a structural result is exception `noPrimaryProcedure`;
     - a `notBillable` Procedure contributes no anaesthesia line (its captured lines still do);
     - `buildPrePaymentInvoiceForBooking` prices through the same engine.
   - `store/billingLineActions.ts` (both guards; they compute the ordinal from position today) and
     `seed/billing.ts` `contextFor`.
   - `shared/capture/feeContext.ts`:
     - reshape `bookingFee` to `bookingFee({ procedures, list, masters, billingLines })` and delete
       `procedureFee`. It returns `{ units, total, order, views: Record<ProcedureId, ProcedureFeeView> }`
       (`BookingFeeTotals` grows to this), and each view carries its `fee`, `allocation`, `baseCode`,
       `contract` and `nonRvgLines`;
     - update the `shared/capture/index.ts` exports and the comments in `BookingTotalPanel` and
       `shared/surface/context.ts`;
     - `bookingFee` is the one UI assembler, and it must stay in step with `feeContextFor`.
   - UI callers: `BookingDetailBody`, `BtmCaptureBlock` (a `view` prop, no own pricing), 22's Split row,
     `OfficeBillingSetup` (the `ordinal` prop and the "procedure {ordinal}" heading go; it reads
     "primary procedure" or "additional procedure"; keep the `office-billing-setup-n` hook numbered by
     `inDisplayOrder` so recipes keep landing), `ReviewScreen`, `ListDetailView` and `reviewFlags`
     (`naturalBtm` keeps working per Procedure; the flags take the view's fee).
   - Grep `ordinal`, `procedureOrdinal`, `isAdditional` and `splitBillingUnits` across `src/`. Only
     display numbering ("Procedure 2" labels, from `inDisplayOrder`) may remain.

8. **Store actions.**
   - a. **Creation keeps exactly one primary.**
     - `createBooking` creates its first Procedure with `isPrimary: true`. The first Procedure entered
       is the primary by default, which matches the rooms' sheet order AA staff work from.
     - `addProcedure` creates `isPrimary: false`. It starts on the **primary's** Contract when in scope,
       not index 0's (20 wrote "the first Procedure's Contract"; re-base it here), and otherwise follows
       20's default-Contract rule.
     - The integration create paths (`integrationActions.ts`, about 150 and 467), the manual flow and
       photo capture, if 15b kept it as a badged demo, go through `createBooking`, so they inherit this.
     - `addPostOpAddendum` creates its Procedure with `isPrimary: true` (the addendum is its own Booking
       until 38b replaces it with an additional invoice and 39b withdraws the anaesthetist's post-op
       flow).
   - b. **`setPrimaryProcedure(api, actor, procedureId)`** in `store/bookingActions.ts`, exported from
     `store/index.ts`. It serves US-03.2.2 and US-03.2.1.
     - Guard order: `notFound`, then `bookingCancelled`, then `editRefusal` (AUTHORISED is locked; the
       anaesthetist needs their own DRAFT; an integration actor needs DRAFT; the office has DRAFT and
       SUBMITTED), then `bookingCompleted` for the anaesthetist only ("This Booking is marked complete.
       Amend it before changing the primary procedure."; the office corrects completed Bookings at
       review, as it does other fields), then `alreadyPrimary`.
     - One `mutate()`, two `procedure.setPrimary` metas (old and new, before and after), stamping the
       Booking. The audit source is the actor's, so a feed writes `integration`.
     - The effect:
       - the old primary's flag clears and the new one's sets;
       - the Booking's modifier inputs (`asaClass`, `selectedModifierCodes`, `modifierUnitsCaptured`)
         move from the old primary to the new one, so modifiers stay one set per Booking. Defaults are
         not re-applied: they are captured selections by now (19's handoff);
       - the old primary's base inputs (a manual base override, and the chosen value on a ranged
         default RVG Contract, whichever fields 19a uses) are cleared and kept in the audit `before`, so
         no additional Procedure carries base inputs (item 8e, the seed invariant). If it is made
         primary again, its base comes from its own Contract through the resolver;
       - the new primary's base comes from 19a's resolver for its own Contract, procedure and code
         (an override on that Contract if one matches, otherwise the default RVG Contract). If that
         figure is a range with no value chosen, 19's rule for that case applies; that is correct and
         needs no special case.
     - Returns `{ previousPrimaryId }`.
   - c. **`removeProcedure` guards by flag, not position.** It refuses `primaryProcedure`: "The primary
     procedure cannot be removed. Make another procedure primary first, or cancel the Booking if the
     whole booking is wrong." The 2026-07-27 ruling (no silent promotion) is carried forward: removal
     never promotes anything, and the user promotes explicitly.
   - d. `ProcedurePatch` omits `isPrimary`. `editProcedure` refuses an `isPrimary` key with
     `usePrimaryAction` ("Use Make primary to change the primary procedure.") as a defensive guard for
     untyped callers.
   - e. **Structural enforcement on additional Procedures** (US-05.3.1 "enforced structurally, not just
     as a UI hint"). `editProcedure` refuses:
     - `baseUnitsCaptured` or `baseUnitsSelected` on an additional Procedure, with
       `additionalProcedureBase`: "Base units are charged on the primary procedure only.";
     - `asaClass`, `selectedModifierCodes` or `modifierUnitsCaptured` on an additional Procedure, with
       `modifiersOnPrimary`: "Modifiers are recorded once for the Booking, on the primary procedure."
     - Only a value is refused. Clearing a key (`undefined`, or `[]` for `selectedModifierCodes`) is
       allowed, because a procedure or code change clears base keys, and changing an additional
       Procedure's procedure or code must keep working. Test both.
     - 19's `pickProcedure` and 20's `setProcedureContract` seed base inputs and default modifiers on
       pick (a chosen value on a ranged default RVG Contract, per 19a). On an additional Procedure they
       must clear base inputs instead of seeding them, and must not write modifiers to it. **Picked
       reading (log it):** an additional Procedure's default modifiers join the Booking's one set on the
       primary in the same audited commit, add-only (a code already selected, or a band already taken
       under 19's one-per-band rule, is left as it is), so a prone procedure added second still
       pre-fills prone, untickable on the primary (US-05.1.4). Test that picking a ranged procedure for
       an additional Procedure succeeds and stores no base input, and that its default lands on the
       primary.
   - f. **Contract actions** (`contractActions.ts`), office-only and audited, returning `Outcome`:
     - `setContractMultiProcedureRule(contractId, rule)`: the percent must be over 0 and at most 100,
       and the amount over 0;
     - `setContractCombination(contractId, isCombination)`: refused with `combinationNeedsParents`
       ("A combination Contract is set against two or more procedures.") when fewer than two
       `scope.procedureTypeIds` are set, and with `combinationProceduresOnly` ("A combination Contract
       is set against procedures, not RVG codes or groups.") when `scope.rvgCodes` or `scope.rvgGroups`
       is not empty. Extend 18's and 19a's scope edit so it refuses, with the same sentences, removing a
       parent that would leave a combination with fewer than two, or adding a code or group to a
       combination. If 19a re-derives procedure scope from schedule lines on a line edit, it must
       never re-derive a combination's explicit scope: guard it;
     - `addContractPrice` (or 18's line action) drops the ordinal;
     - 19a's base-unit override actions are unchanged; this phase only reads their result.
     - Before 25's lock, an edit re-prices unlocked Bookings on that Contract, and AUTHORISED invoices
       keep their snapshots. Say so in a test.
   - Tests (extend `bookingActions.test.ts`, `captureActions.test.ts` and `postOpAddendum.test.ts`; add
     `store/multiProcedureActions.test.ts`):
     - create, add, post-op addendum, remove and set-primary each leave exactly one primary;
     - an added Procedure starts on the primary's Contract, also when the primary is not first;
     - set-primary moves the modifier inputs and clears the old base inputs, with both audit entries;
     - set-primary onto a Procedure whose Contract has a 19a override gives B from the override;
     - every guard in order;
     - an integration actor succeeds on DRAFT and is refused on SUBMITTED with `integrationImmutable`;
     - the anaesthetist is refused on a completed Booking, and the office is not;
     - removing the primary is refused, and removing an additional Procedure still cascades its lines;
     - the `editProcedure` refusals, and that a procedure or code change (which clears base keys) on an
       additional Procedure still succeeds;
     - the default-modifier merge onto the primary;
     - the Contract rule and combination guards and audits;
     - a rule edit re-prices a DRAFT Booking's fee.

9. **Seed.** One `PERSIST_VERSION` bump for the phase. Draw nothing new from the seeded RNG, and do not
   call `takePatient()` for new data: it shifts every later draw. The parity fixture proves both.
   - a. `bookings.ts`: the spec helper's `isAdditional` becomes `isPrimary`, true for a Booking's first
     Procedure unless the spec says otherwise. The additional Procedures of the Holt and bariatric
     Bookings lose their `asaClass` (ASA is recorded once, on the primary). `history.ts`, `audit.ts` and
     `fixtures.ts` follow.
   - b. `contracts.ts`: every Contract (19a's default RVG Contracts included) gets
     `multiProcedureRule: { kind: 'rvgDefault' }` and `isCombination: false`, except:
     - the Doyle bariatric Contract gets `addOnFee` $950, and the `CP-BAR-3` ordinal row is deleted (the
       census and parity tests show the figure is unchanged);
     - SXAP gets `secondCodePercent` 50, as the domain model says SXAP does (unit values demo-plausible,
       labelled). The census must show no seeded multi-procedure Booking on SXAP; if one exists, list its
       figure change;
     - **one combination Contract**, appended after every existing Contract (19a's default RVG Contracts
       included) so no id or AA code moves: "Southern Cross cosmetic combination", in 18's shape, held
       by Southern Cross (the hospital, as SXAP is), hospital scope Southern Cross, `isCombination: true`,
       `scope.procedureTypeIds` the three parents below set explicitly (code and group scope empty,
       never derived from its line), its AA code from `nextAaCode` (and added to `issuedAaCodes`), fixed
       schedule with one line carrying no RVG code (holder code `SX-COMBO-ABL`, "Abdominoplasty, breast
       lift and liposuction, combined", a demo-plausible price, labelled demo data in a comment). No
       seeded Booking uses it, so no figure moves; Phase 39 stages the split.
     - the three parents are 19's master-list entries for abdominoplasty (31340), breast lift and
       liposuction. At `3d3a18c` only 31340 exists (`rvgCodes.ts` has no breast lift or liposuction
       code), and 19's `ProcedureType` requires exactly one `rvgCode`. So for each parent 19 did not
       seed:
       - append a reference RVG code to `rvgCodes.ts` (the NZSA code where AA's Master Fee List gives
         one, otherwise an AA-added code in 19's `AA` pattern, keeping `AA205` free for 19's manual
         test), tagged into 19's Cosmetic AA group through `aaGroupIds`, and kept out of
         `GENERAL_CODES` and `EYE_CODES` so List generation is unchanged;
       - append its `ProcedureType` at the end of `procedureTypes`;
       - append its default RVG Contract in 19a's pattern (US-04.4.2: every procedure has at least
         one), with base units from AA's Master Fee List where it has them, otherwise demo-plausible
         and labelled.
       If 19a builds its default RVG Contracts in a loop placed before other Contracts, emit the new
       ones after every existing Contract instead, so no existing Contract id or AA code moves; the
       seed test asserts every existing AA code is unchanged. No seeded Booking uses these codes, so
       a Contract override or tick list scoped to the Cosmetic group moves no figure (the parity
       fixture proves it).
   - c. **The seeded three-procedure Booking**, spec in a new `src/domain/seed/multiProcedureDemo.ts` and
     shared with the trigger in item 14 (`MULTI_PROCEDURE_DEMO`: procedures, codes, time offsets,
     modifiers, patient).
     - Procedures: 20941 laparoscopic cholecystectomy as primary (ASA III, BMI 35 to 40, non-supine; AS3
       + OB3 + P1 = 7 units at the seeded values), then 49120 umbilical hernia repair and 49115 inguinal
       hernia repair as additional Procedures, same anaesthetic, each with its own times. If 19's
       master or 19a's default RVG Contracts changed any of these units, pick procedures that still sum
       to 7 modifier units and keep a base difference between the first two primaries.
     - Every Procedure is on the Contract 20's default rule stores at the List's hospital (rule
       `rvgDefault`).
     - Patient: one new fixed patient with an explicit id, never from the generated pool.
     - List: a past Souter List that no S1 to S5 beat uses. Confirm with a one-off seed query at the drift
       check, and put the choice in the PROGRESS entry. Leave the List SUBMITTED (with its `list.submit`
       audit) and the Booking completed, so it sits in the Review queue and can be authorised to show
       invoice lines.
     - Build it after every existing seeded Booking, so its Booking, Procedure, patient and audit ids are
       allocated last and no existing seeded id moves. The seed test asserts the existing ids are
       unchanged.
     - Check the Review queue: it gains exactly this one row. "Next in queue" from Souter Mon 20 AM must
       still land on Mon 20 PM (S3 Beat 1), and no scripted count may move. Check 15a's to-do list count
       too: the new Booking raises no warning.
     - Add `scenario.multiProcedure` to the seed ids.
     - Replace the `splitBillingBooking` scenario detail ("Second procedure isAdditional: time units only
       on the BTM path.") with "Additional procedure: its own time units, base on the primary only,
       modifiers on the primary (4 or fewer)". Replace the `bariatricType3Booking` detail ("second
       procedure priced by the ordinal rule") with "additional procedure priced by the Contract's $950
       add-on rule". Add a `multiProcedureBooking` entry: "Three procedures, 7 modifier units, split
       3 · 2 · 2".
   - d. `seed.test.ts`:
     - exactly one primary in every Booking with Procedures;
     - no additional Procedure carries base or modifier inputs;
     - every Contract has a rule and an `isCombination` value, and every combination has two or more
       parents that resolve in `procedureTypes`, empty code and group scope and a unique AA code;
     - every master procedure added here has a default RVG Contract and a reference RVG code;
     - every Contract id and AA code that existed before this phase is unchanged;
     - the three-procedure Booking allocates 3/2/2;
     - bariatric is $950 by rule and `CP-BAR-3` is gone;
     - no seeded Procedure is on the combination Contract;
     - the parity fixture holds except for the new Booking, and `bctisFor` counts are unchanged.

   **Session 1 ends here, green:** `npm run build`, `npm run build:pwa`, `npx vitest run`, with the parity
   fixture diff limited to the new Booking.

10. **Capture UI, shared by mobile, web and admin** (US-03.2.1, US-03.2.2, US-05.3.1).
    - a. **The primary first.** `BtmCaptureBlock`s render in `inDisplayOrder`: the primary at the top,
      then the rest in Booking order. After Make primary the blocks re-sort with the theme's
      `motion/selection-slide` (never blocking; reduced motion falls back to the 80 ms fade).
    - b. **`BtmCaptureBlock` header.** When the Booking has more than one Procedure:
      - the primary shows a neutral "Primary" pill beside its "PROCEDURE 1" label
        (`data-shot="procedure-primary-pill"`);
      - each additional Procedure shows a teal "Make primary" text action beside Edit
        (`data-shot="make-primary"`). It is offered under the same rule as Edit, and hidden for the
        anaesthetist on a completed Booking;
      - "Remove" shows only on additional Procedures, by flag.
    - c. **`MakePrimarySheet`** (new, `src/shared/flows/`, through `useSurface().Overlay`, so it is a
      bottom sheet on mobile and a dialog on desktop), modelled on `RemoveProcedureSheet`.
      - Title: "Make this the primary procedure?"
      - Body: "Base units will come from {procedure} ({code}). The Booking's modifiers move to this
        procedure, and it moves to the top. {old procedure} becomes an additional procedure and stops
        carrying base units." Add "Its manual base adjustment is cleared." only when there is one.
      - Actions: a teal "Make primary" and a secondary "Keep {old procedure}". It calls
        `setPrimaryProcedure`; a refusal shows in the sheet.
    - d. **The additional note** (the accent tint note, same place; keep the `procedure-additional-note`
      hook):
      - under `rvgDefault`: "Additional procedure. Base units are charged on the primary procedure only.
        It earns its own time units, and an equal share of the Booking's modifiers once they total more
        than 4."
      - when its Contract replaces the rule: "Additional procedure. {Contract} prices additional
        procedures by its own rule: {50% of this procedure's own code | a fixed add-on fee | not
        billable}."
      - No dollar amount on any anaesthetist surface (the 2026-09-28 ruling).
    - e. **ASA and modifiers on an additional Procedure.** `AsaCard` and `ModifierChips` are not rendered.
      One caption row replaces them: "Modifiers are recorded once for the Booking, on the primary
      procedure." The range chooser (wherever 19a shows a ranged default RVG Contract's choice) is
      hidden on an additional Procedure, which reads "Base not charged on an additional procedure".
    - f. **`UnitsCard` takes `allocation` in place of `isAdditional`.**
      - Primary B row: 19 and 19a's captions, including 19a's Contract-sourced caption for an override
        or a default RVG Contract.
      - Additional B row: 0, caption "Base units are on the primary procedure", no stepper.
      - T row: unchanged on every Procedure.
      - Primary M row: the Booking total (what its stepper edits). Its caption is the breakdown, plus
        "Booking total 7, split 3 · 2 · 2. This procedure carries 3." when split.
      - Additional M row: its share, with "Share of the Booking's 7 modifier units", or "None · the
        Booking's 3 modifier units stay on the primary" at 4 or fewer, or "Not shared · priced by the
        Contract's rule". No stepper.
    - g. **A Procedure on a combination Contract** shows a neutral "Combination" pill on its Contract
      chip and the caption "Covers {parts}" (from `combinationParts`). Units and captions are as for any
      Procedure on a fixed-schedule Contract.
    - h. Mobile, web and admin share these components, so there is one change for all three, and the PWA
      gets it through the shared capture.

11. **The Booking total, Review and invoices (office).**
    - a. `BookingDetailBody` `bookingBreakdown` builds its rows from `bookingFee`, in `order`. The row
      notes are:
      - "Primary · B + T + M 3 of 7";
      - "Additional · T + M 2 of 7";
      - "Additional · 50% of own code";
      - "Additional · add-on fee";
      - "Additional · not billable";
      - on a combination Contract, the Contract's name only ("Southern Cross cosmetic combination ·
        fixed price"), never the components.
      "Time units only" is deleted. The history entity labels read "Primary · {description}" and
      "Additional · {description}". Hook: `data-shot="booking-total-split"` (inside the existing
      `booking-calculation` test id, which recipes already highlight).
    - b. The anaesthetist surfaces stay fee-free: grep that no `bookingFee(...).total` reaches mobile or
      anaesthetist web output (`BookingDetailBody`'s `showBookingTotal` stays false for the
      anaesthetist).
    - c. `ReviewScreen`:
      - the row's `primary` is the `isPrimary` Procedure;
      - a multi-procedure row's BTM cell adds "M 7 · split 3 · 2 · 2" (mono, tabular);
      - the per-procedure detail shows each share, primary first;
      - `entityLabels` use Primary and Additional.
    - d. Invoice lines carry item 4's descriptions inside 22's layout, primary first. Confirm that each
      line shows its own Procedure's units and amount (US-05.3.5 still matches), and that the seeded
      three-procedure Booking still gives one invoice and one ACCPAY.
    - e. `ListDetailView` (web) and any other row that shows "the operation" through `procs[0]` use the
      primary's description. Grep `[0]?.description` and `procs[0]`.

12. **The Admin Contract editor** (`ContractEditSheet` in 18's and 19a's shape), for US-04.2.5,
    US-05.3.4 and US-04.2.11.
    - a. **An "Additional procedures" section.**
      - A segmented control: "RVG default · % of own code · Add-on fee · Not billable".
      - A percent or amount field when the option needs one (mono).
      - The RVG default caption: "Base on the primary only, time on every procedure, modifiers split
        equally above 4 units with the remainder to the primary, whichever Contracts the procedures are
        on." with a neutral "Provisional · equal split to be validated by AA (OQ-15)" pill.
      - A neutral "Proposed" pill on the three non-default options (US-04.2.5 and US-05.3.4 are Proposed).
      - It saves through `setContractMultiProcedureRule`. Hook: `data-shot="contract-multi-procedure-rule"`.
    - b. **Combination.** A "Combination of procedures" switch beside 19a's procedure-scope chips, saved
      through `setContractCombination`, with the caption "Offered when any of these procedures is
      picked. The Booking records only this Contract." Refusals show inline.
      Hook: `data-shot="contract-combination"`.
    - c. The fee-schedule rows lose the ordinal input and the "· ordinal n" text.
    - d. 19a's "Base unit overrides" section is left as 19a built it (no provisional label: OQ-06 and
      OQ-62 are answered). Add nothing to it.
    - e. The Master data Contracts table gains an "Additional procedures" column in neutral text ("RVG
      default", "50% of own code", "$950 add-on", "Not billable") and a neutral "Combination" pill on
      combination rows.

13. **Combinations in the Contract picker** (20's `ContractPickerSheet`, mobile, web and admin).
    - A "Combinations" group lists the offered combination Contracts after the defaults, each row with
      the neutral "Combination" pill, the AA code, "Covers {parts}" and 20's pricing-basis caption (the
      anaesthetist sees 20's plain row, with no pricing basis or price). Typing its AA code filters to it
      with 20's "AA code {code}" match text. Hook: `data-shot="contract-picker-combination"`.
    - When `coveredByCombination` flags a Procedure, its block shows an accent tint note: "{Contract}
      already covers {procedure}. Remove this procedure unless it is billed separately." It never
      blocks, and the anaesthetist sees no price in it.
    - No new search or navigation: 20's procedure, hospital and code search is the answered navigation
      (OQ-66).

14. **Demo triggers** (registry entries in 14's `src/shared/demoTriggers/registry.ts`; bodies in a new
    `src/store/demoMultiProcedure.ts`, so `pwaPurity` holds). See "Demo triggers" below for labels and
    effects.
    - `stageMultiProcedureBooking(api)` reuses `MULTI_PROCEDURE_DEMO` and the real store actions:
      `createBooking`, `addProcedure` twice, then 19's `pickProcedure` and `editProcedure` for procedures,
      times and modifiers (modifiers on the primary only, so item 8e never refuses it). It uses a demo
      actor (office role, audit source `demo`), added to 14's `src/store/demoActors.ts` beside
      `OFFICE_ACTOR`. It is idempotent per List.
    - `feedChangesPrimary(api, bookingId)` calls `setPrimaryProcedure` with an integration actor for the
      List's hospital: the feed config in `domain/integrations/feeds.ts` whose `hospitalId` is the List's
      hospital gives the `FEED_META` label; any other hospital gets `{ who: 'Hospital feed', role:
      'system', source: 'integration' }`. Export a small helper from `integrationActions.ts` for this
      rather than duplicating `integrationActor`. It targets the next Procedure after the current primary
      in Booking order, cycling.
    - Vitest (`demoMultiProcedure.test.ts`):
      - both bodies are deterministic;
      - the loader refuses a second load on the same List;
      - the feed change is audited with source `integration` and refused on a SUBMITTED List;
      - both entries' `disabledReason` strings;
      - the new ids are unique in the registry test.

15. **Copy, labels and scenario text sweep.**
    - Grep `src/` for "time units only", "Time units only", "Not charged on an additional procedure",
      "stay on the first", "first procedure", "split-billing", "split billing", "isAdditional" and
      "ordinal", and update each.
    - Labels: `fieldLabels` gets `isPrimary: 'Primary procedure'`, `multiProcedureRule: 'Additional
      procedure rule'` and `isCombination: 'Combination of procedures'`; `isAdditional` and
      `procedureOrdinal` are removed. `actionLabels` gets `procedure.setPrimary: 'Primary procedure
      changed'` and the two Contract actions.
    - `DemoControlPanel.tsx` S3 scenario text (the blurb at 285, the steps at 297): "the split-billing
      and two-funder Lists" and "the split-billing Booking" become "the multi-procedure and two-funder
      Lists" and "the multi-procedure Booking".
    - Comments in `fee.ts`, `bookingActions.ts` and `types.ts` that cite the RFP split-billing rule are
      rewritten.
    - Every new string follows the no en/em dash rule: middots, commas or "to".

16. **Playwright and green.**
    - Update the specs that assert the old note, captions, procedure order or "Time units only":
      - `mobile-phase04.spec.ts` (the additional-procedure note);
      - `admin-phase08.spec.ts` (the multi-procedure invoice);
      - `booking-calculation-display.spec.ts` (still no anaesthetist fee).
    - Add specs for:
      - mobile: add a procedure, "Make primary", the new primary moves to the top with the pill, and the
        B captions change over;
      - the Admin Booking total on the seeded three-procedure Booking, showing 3/2/2 (`booking-total-split`);
      - the Review row's split text;
      - the Contract editor rule and the combination switch;
      - the Contract picker on a Southern Cross List offering the combination for abdominoplasty, and
        its AA code filtering to it (`contract-picker-combination`);
      - both triggers from the harness bar (`demo-actions.spec.ts`);
      - `pwa-device.spec.ts`: the feed trigger from the PWA sheet on a two-procedure Booking.
    - Run `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots`. All must be green.

## Demo triggers

Two harness-bar entries, both also on the PWA sheet. "Make primary" and the combination offer are normal
use on every surface and need no trigger. No mobile beat waits on the office here, so no PWA office
stand-in is needed. The Control Panel page gets no trigger; only its S3 scenario text changes (item 15).

Seeded, no button: the three-procedure Souter Booking with 7 modifier units (3/2/2 on the Booking total,
in Review and on invoice lines once authorised), and the Southern Cross cosmetic combination Contract
(picking abdominoplasty, breast lift or liposuction on a Southern Cross List offers it in the picker, on
mobile, web and admin, and its AA code finds it there).

The feed entry's label says "changes", not the "swaps" of earlier drafts of this plan: the vocabulary
rule is "move or reassign, never swap".

| id | Label | Screen (routes) | Surfaces | Effect | Disabled when |
|---|---|---|---|---|---|
| `load-multi-procedure-booking` | Load 3-procedure Booking (7 modifier units) | List detail and Booking detail in all three apps: `/mobile/lists/:listId`, `/mobile/lists/:listId/bookings/:bookingId`, `/web/lists/:listId`, `/web/lists/:listId/bookings/:bookingId`, `/admin/day/:dateISO/bookings/:bookingId` | bar and pwa | Adds the `MULTI_PROCEDURE_DEMO` Booking (20941 primary, 49120 and 49115 additional, AS3 + OB3 + P1 = 7 modifier units, each on the List hospital's default Contract, times set, not marked complete) to **Dr Souter's next open List**: the earliest Souter List dated after the demo clock's today that is DRAFT, booked and has a hospital. Message: "Loaded on Dr Souter's {date} {session} List: 3 procedures, 7 modifier units, split 3 · 2 · 2." `indexPath` is that Booking's Admin detail | "Already loaded on {date} {session}" when that List holds a Booking for the demo patient; "Dr Souter has no open List ahead" when there is none |
| `feed-changes-primary` | Hospital feed changes the primary | Booking detail in all three apps (the Booking in the URL); `when` the Booking has two or more Procedures | bar and pwa | The inbound source for the List's hospital makes the next Procedure primary through `setPrimaryProcedure`, audited with source `integration` under the feed's label; the new primary moves to the top. Message: "{Feed} made {description} the primary. Base units now come from {code}." | The List is not DRAFT ("A hospital feed cannot change a submitted List", mirroring `integrationImmutable`); the Booking is cancelled; fewer than two Procedures (hidden by `when`) |

Neither entry carries the Future-scope badge: the inbound source is in scope (US-03.2.2, Confirmed) and
is not the HL7/FHIR tooling that Phase 34 demotes. Both show the standard "Demo trigger" badge. This
phase applies the feed's change directly because the matching screen does not exist yet. Once it does,
the change should land as a matching row ("no silent apply"). Phase 33's plan does not yet list this
entry, so put it in this phase's handoff to 33 and in the PROGRESS open items (44's trigger audit is the
backstop).

## Out of scope

- Where base units live, the default RVG Contracts, the Contract base-unit override and its editor
  section, and the time tiers as data (19a; OQ-62 and OQ-06 answered). This phase reads them.
- The Contract defined unit rate, the anaesthetist adjustment and the Contract's "allows adjustment"
  rule that close US-04.2.2 (Phase 24).
- Locking `isPrimary`, the allocation, the rule, the base-unit source and the combination Contract at
  AUTHORISED (Phase 25). Until then a Contract rule edit re-prices unlocked Bookings.
- Splitting a combination Contract's invoice: after it is sent, a credit note against the original and
  then one additional invoice per component (US-08.6.4, US-08.6.5, OQ-72: Phase 39, on 38b's event
  element). The rebill total and a split before invoicing are OQ-77 (39's). Greg's "operation"
  container was not adopted and is not built.
- Any change to how an additional Procedure selects its Contract beyond starting on the primary's, or
  to picker navigation (Phase 20, OQ-66 answered), to the billable party (Phase 21, D17) or to invoice
  grouping and the payment setting (Phase 22, D18).
- The ACC pre-op assessment, which becomes a pre-op event (Phase 39b), never a Procedure.
- Setting the primary from an imported rooms' sheet or hospital row. Imports create through
  `createBooking`, so the first row's procedure is the primary; 33 and 34 edit the primary Procedure.
  Neither plans an import-driven primary change; note it in the handoff.
- The ledger's per-Procedure share records (Phase 36). The share is recorded on invoice lines as today.
- Spreadsheet loads (Phase 42). The multi-procedure rule and the combination flag stay Contract editor
  fields (42's reading).
- Showing any fee on the anaesthetist Booking (the 2026-09-28 ruling stands).

## Manual test checklist

The agent runs every item itself in the running app and reports it with evidence; none is handed
to the owner (ROADMAP.md "Owner review: agents test themselves").

- [ ] Mobile (Dr Souter): on a DRAFT Booking, add a procedure. The first shows the "Primary" pill at the
      top. The new one shows the additional note, B 0 "Base units are on the primary procedure", its own
      T, the modifiers caption row instead of ASA and chips, and "Make primary".
- [ ] "Make primary" opens the bottom sheet and names what moves. Confirm it. The new primary slides to
      the top with the pill, the B captions change over, the ASA card and chips now render on the new
      primary with the same selection, and the Booking history shows two "Primary procedure changed"
      entries.
- [ ] "Remove" is not offered on the primary. Removing an additional Procedure still works.
- [ ] Changing the procedure on an additional Procedure still works (no base refusal), and it still
      shows B 0. Picking a procedure with a default modifier for it adds that modifier to the primary's
      chips.
- [ ] The anaesthetist sees no fee anywhere on the Booking, on mobile or web.
- [ ] Web (anaesthetist): the same Make primary walk works through the desktop dialog, and the List row's
      operation text is the primary's.
- [ ] Admin: open the seeded three-procedure Souter Booking. The Booking total rows read "Primary · B + T +
      M 3 of 7", "Additional · T + M 2 of 7" and "Additional · T + M 2 of 7", and the total equals the
      Vitest-pinned figure.
- [ ] Make 49115 primary from Admin. It moves to the top, base drops from 6 to 5, the 3 moves to 49115,
      and the total changes to the second pinned figure. Make 20941 primary again, and the original total
      and order return.
- [ ] 19a's override, read through the pass: on the DRAFT three-procedure Booking the loader trigger
      adds (not the seeded SUBMITTED one; Copy is gone since 15b), add a 19a base-unit override for 49115's procedure on its Contract. Nothing changes
      while 49115 is additional; make it primary and B shows the override with 19a's Contract caption.
      Remove the override.
- [ ] Review queue: the seeded List's row shows "M 7 · split 3 · 2 · 2". "Next in queue" from Souter Mon 20
      AM still lands on Mon 20 PM. The Admin to-do list count is unchanged.
- [ ] Authorise the seeded List. One invoice; its lines read "(B 6 + T n + M 3 of 7 units)" and "(T n +
      M 2 of 7 units)", primary first, and each line's amount matches the Booking total row. The Xero
      simulator shows one ACCPAY for it.
- [ ] S3 Beat 1 after a reset: Holt AA-2026-0002 is the figure item 1 pinned ($396.18 at `3d3a18c`) with
      one invoice, and its additional line reads "Anaesthesia, additional procedure (T 2 units)". The
      Prentice pair is unchanged.
- [ ] Admin → Master data → Contracts:
      - the Doyle bariatric Contract shows "$950 add-on" and SXAP shows "50% of own code";
      - the Southern Cross cosmetic combination shows the "Combination" pill and its AA code;
      - switching a Contract to "Not billable" makes a DRAFT Booking's additional line show "Additional ·
        not billable" with $0 anaesthesia;
      - switch it back.
- [ ] Contract editor: the RVG default caption carries the OQ-15 provisional pill and the other options
      the "Proposed" pill. Turning "Combination of procedures" on for a Contract with one procedure in
      scope is refused with the sentence, and adding an RVG code to the combination's scope is refused.
- [ ] Contract picker (mobile, web and admin) on a Southern Cross List: pick abdominoplasty, then breast
      lift, then liposuction; each offers the combination in its "Combinations" group with "Covers
      Abdominoplasty, Breast lift, Liposuction". Type its AA code: the list filters to it with the match
      text. Choose it: the Booking shows the Contract only. A fourth procedure, or the same procedure on
      a St George's List, is not offered it. Add a second Procedure for liposuction: the "already
      covers" note shows and nothing is blocked.
- [ ] Demo actions (harness bar, on a Souter List or Booking): "Load 3-procedure Booking (7 modifier
      units)" adds it to the next open List with the message. A second run is disabled with "Already
      loaded".
- [ ] On that DRAFT Booking, "Hospital feed changes the primary" moves the pill and the order. The audit
      entry shows the feed's label with source integration. On a SUBMITTED List it is disabled with the
      reason.
- [ ] PWA (`npm run build:pwa`, handset or device spec): both entries appear in the demo-actions sheet on
      a Booking, and the feed change works there.
- [ ] Audit viewer: `procedure.setPrimary`, Contract rule and combination entries show before and after.
- [ ] No en or em dash in any new app copy (grep the diff), and no "slot" or "swap" in new copy.
      Actions are teal, the Primary, Combination, Proposed and Provisional pills neutral, no crimson.
- [ ] Catalogue screenshots: the recipes for US-03.2.1, US-03.2.2, US-04.2.5, US-04.2.11, US-05.3.1,
      US-05.3.4 and US-05.3.5 (and the shots of US-03.2.3) are created or updated, any recipe this phase
      broke is re-pointed, a full `npm run capture` ends with no failed recipe and no story without a
      recipe, the covered items' new shots are checked by eye, and `npm run verify:board` is green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots` and `npm run verify:board` green.

## Demo guide updates

Patch these in the same session, with the matching sections of `master-demo-guide.html` (the workflows
block around its "additional Procedure is time-only" lines, the billing-engine steps, the "Split billing"
cheat-sheet card and the S3 section). Line numbers are as at `3d3a18c`; later phases move them.

- `04-presenter-cheat-sheet.md`: the "Split billing" section (98) becomes "Multi-procedure rule":
  - one primary per Booking, always listed first, and anyone with edit rights can make another primary;
  - base on the primary only, from its Contract (19a's line on default RVG Contracts and overrides
    stays as 19a wrote it);
  - time on every Procedure;
  - modifiers on the primary up to 4 units, then split equally with the remainder to the primary (7 over
    3 = 3/2/2), whichever Contracts the Procedures are on (provisional: Ben to validate, OQ-15);
  - a Contract can replace the rule (SXAP 50%, bariatric $950 add-on, or not billable);
  - a combination (abdominoplasty, breast lift and liposuction) is one Contract offered under each of
    its procedures and found by its AA code; the Booking records only the Contract, and splitting its
    invoice after it is sent is a credit note then an additional invoice per part.
  Keep "one Procedure may split across funders" in whatever form 22 left it (the payment setting).
- `02-workflows-and-handoffs.md`: "Multiple Procedures" (around 261 to 265) is rewritten the same way
  and adds "Make primary" and the combination Contract. Billing engine step 5 (around 349), "It enforces
  time-only additional Procedures", becomes "It applies the multi-procedure rule and each Procedure's
  Contract rule".
- `01-personas-and-responsibilities.md`: the anaesthetist's item about additional procedures (around
  51, "which charges time units only") mentions "Make primary" and drops the time-only wording. The
  office list gains "set the primary from the rooms' sheet, and correct it at review".
- `03-demo-script.md`:
  - S3 Beat 1 (around 248): "the one-invoice, same-funder split" Booking becomes "the one-invoice
    multi-procedure Booking (additional procedure on its own time units; modifiers stay on the primary
    at 4 or fewer)". Re-verify the Holt and Prentice figures; they should not move.
  - S3 "Serves" line (232): "split billing" becomes "the multi-procedure rule".
  - Add an optional "Worth pointing at" after S3 Beat 1: open the seeded three-procedure Souter Booking in
    Admin, show 3/2/2, click "Make primary" on 49115, and show it move to the top with base 6 to 5. Then
    open the Contract picker on a Southern Cross Booking for abdominoplasty, show the combination, and
    type its AA code. Name the two demo actions.
  - S5 discovery points: add OQ-15 (Ben to validate the equal split and who takes part). Drop any
    OQ-53 or OQ-66 point: both are answered.
- Control Panel scenario text: the S3 blurb and steps (item 15), and the `splitBillingBooking`,
  `bariatricType3Booking` and `multiProcedureBooking` scenario detail (item 9c).

Other "split-billing" mentions at `3d3a18c` to reword the same way: `03-demo-script.md` lines 16, 236
and 257 ("the split-billing Booking" becomes "the multi-procedure Booking") and 292;
`04-presenter-cheat-sheet.md` section 7 "Split-billing invoice count" (267 to 270) and
`02-workflows-and-handoffs.md` 363. Those last three are the RFP's invoice-count tension, a live
discovery point: keep the point, name it "multi-procedure invoice count", state that invoices group by
billable party so a multi-procedure Booking is one invoice and one BCTI, and quote "Split Billing" only
as the RFP heading. The RFP source citation at workflows 281 stays.

This is not a milestone phase, so no full consistency read is required. Grep the four guide files and
the master guide for "time-only", "time units only" and "split billing" / "split-billing" afterwards;
only quoted RFP headings may remain.

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19),
run after the review pass and before the PROGRESS.md entry. Re-run
`node docs/prototype-build/catch-up/tools/recipe-status.mjs 23` first: earlier phases may have
changed these recipes since this plan was written.

**Covered items.** When the phase is done, each recipe in `requirements-board/capture/recipes/`
matches what was built:

| Item | Recipe at plan time | When this phase is done |
|---|---|---|
| [US-03.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.2.1.md) One primary Procedure | captured · web-primary-and-additional, mobile-primary-and-additional | Stays captured. The old captions ("First procedure anchors base and modifier units"; "it bills time units only, base and modifiers stay on the first") are superseded. Re-shoot both on BK0009 (`/web/lists/L-34821-2026-07-21-PM/bookings/BK0009`, and the mobile route) after adding a second procedure: highlight `procedure-primary-pill` on the first block and the additional note (`procedure-additional-note`) on the second ("Base units are on the primary procedure"). Keep the shot `name`s. Caption: one Procedure is the primary, shown first. |
| [US-03.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.2.2.md) Anyone with edit rights can set the primary | absent | Captured. Create a recipe: `web-make-primary` and `mobile-make-primary`, starting on BK0009 (the US-03.2.1 routes, an editable Souter DRAFT Booking) after clicking "Add another procedure", with states `before` (the teal "Make primary" action, `make-primary`), `sheet` (the `MakePrimarySheet`, a bottom sheet on mobile and a dialog on web, naming what moves) and `moved` (the new primary on top with the Primary pill); `admin-make-primary` on the seeded three-procedure Booking (`SEED_MARKERS.multiProcedureBooking`, find its id from the built seed). Caption: anyone with edit rights can set the primary Procedure, and it is shown first. Drop the absent reason. |
| [US-03.2.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.2.3.md) Add procedures to a Booking | partial · web-add-procedure (before, copy, added), mobile-add-procedure (before, added) | Not a covered item, but its shots show the additional block that changes. 15b drops the `copy` state with Copy (the catalogue caption is now "Add another procedure to the Booking"); 20 sets the status and the partial reason. Re-shoot both (the Primary pill, no ASA card on the additional Procedure, the added Procedure starting on the primary's Contract). Keep the status and reason as 20 left them; this phase does not change how a Contract is chosen per added Procedure. |
| [US-04.2.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.5.md) Multi-procedure rule per Contract | partial · admin-ordinal-rows | Captured. The ordinal rows are gone (work item 12c). Replace `admin-ordinal-rows` with `admin-multi-procedure-rule` on `/admin/masters`: the Contract sheet's "Additional procedures" section (`contract-multi-procedure-rule`) with states for the four options (RVG default, % of own code, Add-on fee, Not billable) and the "Proposed" pills; drop the ordinal caption. Add `admin-contracts-table` for the new "Additional procedures" column. Drop the partial reason. |
| [US-04.2.11](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.11.md) Combination Contracts | absent ("Not built yet: catch-up Phase 23 builds this.") | Create, captured. Admin: `admin-contract-combination` on the Contract sheet (`contract-combination`, the "Combination of procedures" switch and its caption) for "Southern Cross cosmetic combination". Picker shots on mobile, web and admin (`contract-picker-combination`): on an editable DRAFT Booking on a Southern Cross List (BK0009 on Souter Tue 21 PM, `L-34821-2026-07-21-PM`, is Southern Cross and DRAFT at `3d3a18c`; confirm in the built seed and name it in ATLAS.md), picking abdominoplasty, breast lift or liposuction offers the combination under "Combinations" with the neutral pill and "Covers {parts}"; one state with its AA code typed in the search, filtered to it. Caption in the catalogue's words: when any of the parent procedures is picked, the Contract is offered, and the picker's filters and AA code search find it. Drop the absent reason. |
| [US-05.3.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.3.1.md) Multi-procedure BTM rule | captured · web-additional-base, mobile-additional-base | Stays captured. Re-shoot both on BK0022 (`/web/lists/L-34821-2026-07-20-AM/bookings/BK0022`, and the mobile route): the highlight `units-row-b` of the additional block now reads 0 with the caption that base units are on the primary; re-check the `nth=1` selector still lands, since the additional block loses its ASA card and chips and the blocks follow `inDisplayOrder`. Add `admin-modifier-split` on the seeded three-procedure Booking, highlight `booking-total-split` ("Primary · B + T + M 3 of 7", "Additional · T + M 2 of 7" twice, the 3/2/2 split). Caption in the catalogue's words. The anaesthetist shots show units and shares only, no fee. |
| [US-05.3.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.3.4.md) Contract-specific second-procedure rules | captured · admin-second-procedure | Stays captured, retitled: the second Procedure is priced by the Contract's rule, not an ordinal row. Re-shoot `admin-second-procedure` (`/admin/day/2026-07-14/bookings/BK0028`, the bariatric Booking), replacing the caption "Second procedure priced by the contract's own ordinal rule" with "Additional procedure priced by the Contract's add-on fee" ($950 on the Doyle bariatric Contract). Highlight `booking-total-split` inside `booking-calculation`. |
| [US-05.3.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.3.5.md) Ledger tracks each Procedure's share | captured · admin-per-procedure | Stays captured (the item Matches). Re-shoot `admin-per-procedure` (`/admin/day/2026-07-20/bookings/BK0022`, highlight `booking-calculation`): the rows now read "Primary" and "Additional", primary first. Keep the caption "The Booking's fee broken down by Procedure, on the office view". The share is still recorded on invoice lines. |

**Recipes this phase breaks.**
- `US-03.2.1` highlights `[data-shot=procedure-additional-note]` and carries the "time units only" caption; `US-03.2.3` clicks "Add another procedure" and highlights `procedure-header` and `procedure-contract` at `nth=1`. Re-point both to the new block anatomy and order.
- `US-05.3.2` (shot `additional-time`) shoots an additional Procedure's times and T row at `nth=1`; re-check its selectors after the block loses the ASA card and chips.
- `US-04.2.4`, `US-04.2.5` and `US-04.2.2` highlight `[data-shot=contract-price-rows]` (or 18's renamed hook); the ordinal input and "· ordinal n" text leave the fee-schedule rows (work item 12c). `US-04.2.4` carries an absent reason that mentions the ordinal key (also Phase 18's); update the wording if the ordinal is gone. `US-04.2.2` also shows 19a's override section: leave it as 19a shot it.
- `US-05.2.1`, `US-05.2.4`, `US-05.2.5`, `US-05.3.4` and `US-05.3.5` highlight `[data-testid=booking-calculation]`; the breakdown rows change to "Primary" and "Additional" notes, so check the highlight still lands.
- `US-03.1.1`, `US-03.4.1` and `US-04.3.3` use `procedure-header`, which gains the Primary pill and the Make primary action. Any recipe using `office-billing-setup-n` keeps landing because the numbering follows `inDisplayOrder`.
- The `--dry` run is the check for anything else.

**ATLAS.md.** Update Seed data (the three-procedure Souter Booking and its List, the Southern Cross combination Contract and its AA code, the bariatric add-on fee), Personas and IDs (`SEED_MARKERS.multiProcedureBooking`), Existing hooks (`procedure-primary-pill`, `make-primary`, `booking-total-split`, `contract-multi-procedure-rule`, `contract-combination`, `contract-picker-combination`) and the Demo control panel section for "Load 3-procedure Booking (7 modifier units)" and "Hospital feed changes the primary".

## Adversarial review (after build)

After the manual test checklist and the four commands are green, and before writing the PROGRESS entry,
run the standard **adversarial review-and-fix pass (PROGRESS convention 18)**:

- Fan out about three independent Opus review subagents, one each for **quality**, **bugs/correctness**
  and **plan adherence**. Add a fourth on **billing maths**, because the fee engine changes shape under
  every invoice.
- This session then verifies every finding independently against the catalogue files, this doc and the
  code. Fix the confirmed ones, each bug with a test, then re-green and record the pass.
- Do not re-raise anything settled in the Decisions log.

**Steer this phase's reviewers at:**

- **The split is exact.** Recompute every worked example in `multiProcedure.test.ts` and
  `bookingFee.test.ts` by hand:
  - the threshold is "more than 4", so exactly 4 does not split;
  - the remainder goes to the primary wherever it sits;
  - the shares sum to the total;
  - Procedures on different RVG-default Contracts split together;
  - a replaced-rule Procedure takes no share and loses none;
  - the remainder policy and threshold live in one place, labelled provisional (OQ-15).
- **One engine.** Every fee in the app comes from `bookingFeeFor`: the UI assembler, the validator, the
  invoice build (with resolved Contracts), the prepayment build, the billing-line guards and the seed. No
  caller prices a Procedure alone or reads a position; grep `ordinal`, `[0]` near procedures, and
  `isAdditional`.
- **Base units are 19a's.** This phase decides no base units of its own: every B comes from 19a's
  resolver on the Procedure's own Contract, counts on the primary only, and reaches an additional
  Procedure only inside the percent rule's standalone price. No second override lookup, no RVG master
  read for base units, no provisional label on OQ-06 or OQ-62.
- **Exactly one primary, always, shown first.** Every creation path (manual, photo if 15b kept it, post-op
  addendum, integration, seed, the trigger) makes one, and no Copy path remains (15b). Remove never
  promotes. Set-primary is a single commit with both audit entries. Every list of Procedures (capture,
  total, Review, invoice lines) uses `inDisplayOrder`. A structural error fails loudly (validator
  failure, invoice exception) instead of guessing.
- **Re-anchoring is right.** After Make primary:
  - the modifier inputs are on the new primary and gone from the old one, defaults not re-applied;
  - the old primary's base inputs are cleared and kept in `before`;
  - the new primary's base comes from its own Contract through 19a's resolver;
  - 19's ranged-figure rule and out-of-range warning follow the primary, not the old one.
- **Structural, not cosmetic.** `editProcedure` refuses base and modifier writes on an additional
  Procedure, and `isPrimary` patches, whatever the UI shows. Clearing those keys (a procedure or code
  change) is still allowed, and 19's and 20's pick paths seed nothing on an additional Procedure; its
  default modifiers join the primary's set, add-only.
- **Rights.** The integration actor works on DRAFT only; the anaesthetist on their own DRAFT and not on a
  completed Booking; the office on DRAFT and SUBMITTED; AUTHORISED on nobody.
- **No figure moved that should not.** The parity fixture differs only for the new Booking. Holt is
  unchanged, bariatric $2,800 + $950 by rule, and S3's Prentice pair is unchanged. Invoice grouping and
  `bctisFor`'s counts are unchanged. The new seed draws nothing from the RNG or the patient pool, and the
  combination Contract, any new procedure entries and their default RVG Contracts are appended.
  `PERSIST_VERSION` is bumped once.
- **The anaesthetist never sees a fee** (2026-09-28). The additional note, the M share captions, the
  combination caption, the "already covers" note and the Make primary sheet carry units only.
- **Contract rules.** Percent and add-on validation; the ordinal row is gone from the model, editor, tests
  and seed.
- **Combinations as answered.** Offered only on a positive procedure match and the List's hospital,
  through 20's selector with no second matcher; found by its AA code through 20's in-scope search and
  no other navigation; code and group scope empty on every combination and never re-derived; never for
  an unset procedure; the Booking holds one Procedure on the Contract and no components; the "already
  covers" note never blocks; two or more parents enforced in the store and the seed.
- **No gold-plating.** No operation container, no invoice split or credit, no adjustment, no defined
  rate, no lock, no ledger share, no loaders, no new picker navigation, no new override UI. Plus the
  usual: teal-only actions, neutral pills, no dashes in copy, sheets not modals on mobile, `pwaPurity`
  green, and the trigger bodies in `src/store`.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry; ROADMAP.md "Owner review: agents test
  themselves"): the defaults built for open questions (OQ-15's split and its participants), the picked
  readings below, anything logged rather than fixed, and the screens worth a look, each with its route
  and persona.
- A status row for catch-up Phase 23, and a phase entry covering:
  - the drift-check result and the OQ-15 status;
  - what was built;
  - the parity result (the only diff being the new Booking), the BCTI count check, and the List chosen
    for the seeded Booking;
  - the master-list entries and default RVG Contracts added for the combination, if any;
  - the `PERSIST_VERSION` from and to;
  - the tests added;
  - the review pass: findings confirmed and fixed, and anything not treated as a defect, with the reason.
- **Decisions log:**
  1. The catalogue multi-procedure rule replaces the RFP split-billing rule ("additional Procedure = time
     units only"), superseding the Phase 01, 04 and 08 readings.
  2. `isPrimary` replaces `isAdditional`, with an exactly-one invariant; the primary is listed first
     everywhere (US-03.2.2 note).
  3. The 2026-07-22 "Type 3 second-procedure fallback" and ordinal keying are superseded by each
     Contract's `multiProcedureRule`. The bariatric ordinal row became a $950 add-on fee. Handoff P2 is
     closed.
  4. The 2026-07-27 `removeProcedure` ruling is kept but re-based: the primary is refused by flag, not
     position, and removal never promotes. "Make primary" is the explicit route.
  5. Provisional (OQ-15, Ben to validate): the equal split with the remainder to the primary, whichever
     Contracts, and its participants (the primary plus additional Procedures on an RVG-default rule).
  6. Picked readings:
     - modifiers are recorded once per Booking, on the primary, and move with Make primary;
     - an additional Procedure's default modifiers join the primary's set, add-only;
     - `secondCodePercent` is a percentage of the Procedure's standalone price (its own Contract's base
       units, 19a's override included);
     - captured non-RVG lines still bill under every rule;
     - a fixed-schedule primary's modifier share is inside its line price;
     - the integration actor may set the primary on DRAFT only;
     - the anaesthetist must Amend a completed Booking first, and the office need not;
     - an added Procedure starts on the primary's Contract.
  7. 19a's base units (default RVG Contracts and Contract overrides) are read on the primary only, and
     on an additional Procedure only inside the percent rule's standalone price.
  8. Combination Contracts (OQ-53 and OQ-66 answered): `isCombination` plus two or more parents in
     procedure scope, offered only on a positive procedure match, found by its AA code through the
     picker's search, recorded on the Booking as the Contract alone; the "operation" container was not
     adopted.
- **Handoff list:**
  - 24 prices each Procedure's charged units at the Contract defined unit rate through its one rate
    function, at the single rate read this phase leaves in `feeFor`, and applies the anaesthetist
    adjustment per Procedure after the allocation and before the office override.
  - 25 locks `isPrimary`, the allocation, the rule, the base-unit source and the combination Contract at
    AUTHORISED.
  - 22's `Booking.splitShares` re-key handoff is closed: shares stay keyed by Procedure.
  - 27's estimator mirrors this engine: base on the primary, 0 base on an additional Procedure under
    `rvgDefault`, time per Procedure, and `baseSource: 'additional'` as shipped (27 logs its own
    reading for the other rules).
  - 33: re-point `feed-changes-primary` so the change lands as a matching row (not yet in 33's plan);
    imports keep the first row's procedure as primary, and a primary change from an import is not
    planned anywhere.
  - 36 records each Procedure's share on the ledger (US-05.3.5).
  - 39 credits the seeded combination Contract's invoice and rebills it as per-component additional
    invoices (US-08.6.4, US-08.6.5, OQ-72; OQ-77 for the rebill total and a split before invoicing),
    pricing from per-Procedure units.
  - 39b models the ACC pre-op assessment as an event, never a Procedure, so never primary.
  - 42: the multi-procedure rule and the combination flag stay Contract editor fields.
  - 43a keeps the Contract rule wording off the anaesthetist screens if it simplifies them.
  - The OQ-15 outcome.
- **Catalogue screenshots.** The step's result: recipes created (US-03.2.2, US-04.2.11) and changed
  (US-03.2.1, US-04.2.5, US-05.3.1, US-05.3.4, US-05.3.5, the US-03.2.3 shots, plus every recipe the
  step broke), the `capture/REPORT.md` counts (captured, partial, absent, failed) before and after,
  and any partial reason handed to a later phase.
