# Phase 24 · Price precedence, fixed rate and discount, and the anaesthetist adjustment

**Requirements covered:**
[FT-05.2](../../../../requirements-board/requirements/stories/FT-05.2.md) Unit and fee calculation (Confirmed): the one price precedence, with a recorded price source and the engine's rejections ·
[US-05.2.5](../../../../requirements-board/requirements/stories/US-05.2.5.md) Fixed fee schedule pricing (Confirmed; Contradicts today): the line's fixed price is the whole price, with nothing calculated or added on top ·
[US-05.4.3](../../../../requirements-board/requirements/stories/US-05.4.3.md) Fixed discount Contracts (Confirmed, new): a pre-applied discount the anaesthetist sees and cannot edit or remove ·
[US-04.2.2](../../../../requirements-board/requirements/stories/US-04.2.2.md) Contract pricing terms (**Verify**, [OQ-89](../../../../requirements-board/requirements/questions/OQ-89.md)): the line terms and the adjustable rule, which close here ·
[FT-03.5](../../../../requirements-board/requirements/stories/FT-03.5.md) Anaesthetist adjustment ·
[US-03.5.1](../../../../requirements-board/requirements/stories/US-03.5.1.md) Apply an anaesthetist adjustment, with required reason (**Verify**) ·
[US-05.4.1](../../../../requirements-board/requirements/stories/US-05.4.1.md) Apply anaesthetist adjustment ·
[FT-05.4](../../../../requirements-board/requirements/stories/FT-05.4.md) Adjustments and overrides ·
[DM-50](../analysis/domain-model-delta.md#dm-50) one pricing precedence with fixed-rate and fixed-discount Contracts and a recorded price source ·
[DM-14](../analysis/domain-model-delta.md#dm-14) the anaesthetist adjustment and the office override become two records ·
[DM-46](../analysis/domain-model-delta.md#dm-46) the rate x time billing line and the Method 3 gate go ·
[RV-11](../analysis/reverse-check.md#rv-11-anaesthetist-adjustment-is-dollar-or-fixed-price-and-always-offered-percentage-is-office-only) the dollar-or-fixed, always-offered anaesthetist adjustment is reworked ·
[RV-24](../analysis/reverse-check.md#rv-24-rate-x-time-billing-line-hours-x-hourly-rate-gated-by-a-method-3-contract-flag) the hours x rate line, its Method 3 flag and the hourly seed go.

**Carried across without regression, with parity tests** (each Matches today, some only through the
old model; see ROADMAP.md "Old-model matches are carried across"):
[US-05.2.6](../../../../requirements-board/requirements/stories/US-05.2.6.md) Fixed rate Contracts
(Matches through 19a's fixed-rate lines; this phase's precedence must keep it, and adds its "rate
locked" display for the anaesthetist),
[US-05.2.1](../../../../requirements-board/requirements/stories/US-05.2.1.md) Per-unit pricing rate,
[US-05.4.2](../../../../requirements-board/requirements/stories/US-05.4.2.md) Office price override
(the office can always override, [OQ-16](../../../../requirements-board/requirements/questions/OQ-16.md)),
[US-03.5.2](../../../../requirements-board/requirements/stories/US-03.5.2.md) BTM still recorded in
full (must survive a 100% discount and a $0 price) and
[US-05.2.7](../../../../requirements-board/requirements/stories/US-05.2.7.md) GST at the invoice foot
on ex-GST prices.

**Left this phase on 2026-10-08:** none of its items. US-05.2.6 now Matches and is carried across
rather than built. The prototype-only "Contract defined rate" basis, the `unitRateFor` rate function
and the `allowsAnaesthetistAdjustment` Contract flag that this doc once planned are dropped: 19a's
lines carry the fixed rate and discount, the adjustable rule is derived (below), and 39b no longer
has a UNIT x RATE line to feed.

**Depends on:** Phase 23 (the Booking-level pricing pass, `isPrimary`, the RVG default
multi-procedure rule for calculated Procedures, OQ-90's default D26, and combination Contracts).
Also relies on 15b (ACTIVE Lists), 18 (contract holders with `partyType`, the one No contract (RVG)
found by `isDefault`, dated versions, the interim `permitsIndividualArrangement` Method 3 gate it
left for this phase), 19 (RVG groups and procedures), 19a (Contract lines with `fixedPrice`,
`fixedRate` and `fixedDiscountPercent`, the resolver with each value's layer, `FeeResult`'s resolved
terms, the anaesthetists' own fixed-price Contracts, the time tiers as data), 19b (itemised
modifiers), 20 (one Contract per Procedure, `setProcedureContract`, the picker and the anaesthetist's
Change Contract action), 20a (the three-part stack and its "pricing basis" selector), 21 (the payer on
the Booking, completion checks and Review's stack) and 22 (invoice layout and the Split button).
**Estimated:** 2 sessions. **Session 1** is the engine: the precedence with its price source and
rejections, the office override as its own record, the no-charge invoice, and the rate x time line's
removal with the Aria seed re-expressed (work items 1 to 8). **Session 2** is the anaesthetist
adjustment and every surface that shows the layers (work items 9 to 17). Each session leaves the app
green and demoable.

## Goal

**One price precedence, in one place.** Build the catalogue's precedence (FT-05.2, DM-50;
[AR-29#price-precedence](../../../../requirements-board/requirements/artifacts/AR-29.md)) as one pure
function in `aa-prototype/src/domain/billing`. For each Procedure, the first that applies sets the
price:

0. the **office override** at review (US-05.4.2): a fixed final fee, a dollar or a percentage
   adjustment, with a reason, on any Contract;
1. else the **anaesthetist's typed price**, on an adjustable Contract only;
2. else the Contract line's **fixed price**, the whole price: BTM is recorded for reference and
   nothing is added (US-05.2.5: no BTM fallback for an additional Procedure or an unmatched line, and
   no captured billing line on top);
3. else **calculated**: (B + T + M) x the line's **fixed rate** (US-05.2.6, carried from 19a without
   regression) or the anaesthetist's own unit value (US-05.2.1), less a discount: the line's **fixed
   discount** (US-05.4.3, shown to the anaesthetist as a pre-applied price override, locked) or the
   anaesthetist's own % discount.

A price of 0, or a 100% discount, gives a **no-charge invoice**, and BTM is still recorded (US-03.5.2,
Matches: keep). Each priced Procedure records its **price source** (office override, anaesthetist
price, Contract fixed price, calculated), the figure before each layer, and the rate and discount
used; 20a's "pricing basis" selector is re-pointed to read it.

**The engine rejects rather than ignores**
([AR-29#price-validation](../../../../requirements-board/requirements/artifacts/AR-29.md)): when a
typed price or discount sits on a Contract that is not adjustable, when BTM is missing and no fixed
price resolves, or when the Contract is not valid on the procedure date.

**Adjustable** means No contract (RVG) or a first-party Contract (FT-03.5, US-03.5.1, US-05.4.1,
US-04.2.2; [AR-29#contract-behaviour](../../../../requirements-board/requirements/artifacts/AR-29.md),
[AR-28#what-the-anaesthetist-can-change](../../../../requirements-board/requirements/artifacts/AR-28.md)).
It is derived, not a Contract setting: `isDefault`, or the holder's `partyType` is first party. There
the anaesthetist may type a price or a % discount, with a required reason (no dollar variant: a flat
change is a typed price). On a third-party Contract the price shows read-only with no discount
field; to depart from it they change the Contract (20's action), which also changes who is billed. A
Contract line's fixed discount shows locked where the price change would be, and per OQ-89's open
second part (D40's default) the anaesthetist adds nothing on top of it.

**Two records, not one slot.** The office override (US-05.4.2, Matches) becomes its own record,
separate from the anaesthetist's adjustment (DM-14, FT-05.4, RV-11), and is the only way to change a
third-party price without changing the Contract.

**The hourly line goes** (DM-46, RV-24): the rate x time billing line, its `rateTime` charge basis,
the Method 3 "permits individual arrangement" flag and its validator gate. The seeded Aria Contract
and its two Bookings are re-expressed on Aria's fixed-rate line ($26.50 a unit, which 19a seeded).

Mobile, web and Admin show the layers each viewer is allowed; Review and the invoice show them all.
Whether the price on a prepaid Procedure can change is OQ-96, built in 27 (D30).

**Keep the pricing model in one place.** The precedence, the adjustable rule, the validation and the
price source live in `aa-prototype/src/domain/billing` (beside 19a's resolver and lines) plus the
seed, behind types the UI reads, so a later design change (AR-29 is a draft; a v5 may change it)
stays a contained edit. The reference shape is
[AR-29#booking-procedure-fields](../../../../requirements-board/requirements/artifacts/AR-29.md)
(where the typed price, the discount, the reason, the override and the price source sit on the
booking procedure),
[#contract-behaviour](../../../../requirements-board/requirements/artifacts/AR-29.md),
[#price-validation](../../../../requirements-board/requirements/artifacts/AR-29.md) and
[#price-precedence](../../../../requirements-board/requirements/artifacts/AR-29.md), its ERD
[AR-30#booking-procedure](../../../../requirements-board/requirements/artifacts/AR-30.md), and the
plain-language guide
[AR-28#what-the-anaesthetist-can-change](../../../../requirements-board/requirements/artifacts/AR-28.md)
and [#worked-examples](../../../../requirements-board/requirements/artifacts/AR-28.md) (true as
written).

## Before you start: drift check

1. **Diff the catalogue** against the snapshot (catalogue commit 60e2d1e):

   ```
   node docs/prototype-build/catch-up/tools/plan-state.mjs --diff FT-05.2,US-05.2.5,US-05.4.3,US-04.2.2,FT-03.5,US-03.5.1,US-05.4.1,FT-05.4,US-05.2.6,US-05.2.1,US-05.4.2,US-03.5.2,US-05.2.7,OQ-89,OQ-96,OQ-90,OQ-16
   ```

   - **What to read.** The diff for each ID, then in `domain-model.md` section 3 "Calculation rules"
     (the precedence block and the rejections), the Contract table's "adjustable" and "pricing
     terms" rows, the Contract line's "discount" row, and the Procedure rows
     `anaesthetistAdjustment` and `officeOverride`. To see why an item says what it says, run
     `npm --prefix requirements-board run source -- --item <ID> --text` and read only the cited
     passages (Node 22.18 or newer).
   - **At 60e2d1e** this phase's items stand as follows:
     - **FT-05.2** states the four-step precedence, the no-charge invoice and (technical discussion)
       the resolver, the three rejections and the recorded price source. It notes the draft design
       has no term for a Contract's fixed discount and keeps the Contract rate dormant; both need
       logic.
     - **US-05.2.5** (Confirmed): the fixed fee is the whole price, BTM recorded, nothing further
       calculated; any difference is an ad hoc invoice or credit note by hand (38b, 39). Graded
       **Contradicts**: an additional Procedure or an unmatched code falls back to BTM, and captured
       billing lines add on top. 19a already prices a fixed price on any Procedure; this phase
       removes the rest.
     - **US-05.4.3** (Confirmed, new): a 10% fixed discount takes $1,000 to $900, shown applied and
       locked where the price override shows; the office can still override.
     - **US-04.2.2** (**Verify**): line terms (fixed price, fixed rate, fixed discount, units), the
       default (BTM x the anaesthetist's own unit value), the adjustable rule, holder references (21's).
       Its catalogue images still show Contract types 1 to 3 and the rate x time option.
     - **FT-03.5, US-03.5.1 (Verify), US-05.4.1:** the adjustable rule as above. The old "once BTM is
       recorded in full" gate is **gone** from FT-03.5; `domain-model.md` still says the adjustment is
       "applied after BTM is recorded in full", which this phase honours in the engine (a calculated
       price needs BTM), not as a field gate. US-03.5.1 names OQ-96 (prepaid) and OQ-89 (stacking).
     - **US-05.2.6** was renamed "Fixed rate Contracts": the rate applies to the whole Procedure, not
       a billing line, and the anaesthetist cannot change a third-party Contract's rate. Matches
       through Type 2's agreed rate today, through 19a's lines after 19a.
     - **US-05.2.1** gained fixed-rate and fixed-discount criteria (Matches). **US-05.4.2**: the
       office override is the only way to change a third-party price without changing the Contract
       (Matches). **US-03.5.2** and **FT-05.4**: unchanged in substance.
     - **OQ-89** is **answered in part** (D40): the fixed rate is a unit rate in place of the
       anaesthetist's for the whole Procedure, the fixed discount a separate locked setting, add-ons
       and quantity rules dropped. **Still open:** the time band (19a's default: none) and whether the
       anaesthetist can add a price or discount on top of a fixed discount (this phase's default: no).
     - **OQ-96** is open (D30, built in 27). **OQ-90** is open (D26, 23's default: the RVG rule for
       calculated Procedures only). **OQ-16** answered: the office can always override.
   - **If an item changed since 60e2d1e**, re-read it and adjust the work items. **If an item is now
     Retired or Future**, drop it and say so in the PROGRESS entry.
   - **Things to look for:**
     - OQ-89's second part answered (item 2's `fixedDiscountBlocksAdjustment` flips in one place);
     - a dollar discount kind added for the anaesthetist (one more branch in item 2);
     - where the adjustable setting lives settled differently (AR-29's open point: holder, Contract or
       line; the predicate in item 2 is the one place);
     - the anaesthetist being shown the calculated fee (drift check 3);
     - AR-29 moved to a v5: follow its booking procedure fields and precedence inside the same one
       place, and log it.
2. **OQ-89 (D40).**
   - **If still open:** build the default. No anaesthetist price or discount on a line that carries a
     fixed discount: the locked discount shows and no input is offered, and the engine rejects one
     stored there. Keep it as one named constant beside the adjustable predicate, with a code
     comment naming OQ-89; no UI label (the locked discount caption is true either way).
   - **If answered "yes, on top":** flip the constant; define how the two combine (applied in turn,
     each rounded once, the line's first) in the same function, and add the worked example.
   - The time band is 19a's; build nothing for it here.
3. **What the anaesthetist sees (the 2026-09-28 ruling, superseded in part).** The ruling hid all
   money from the anaesthetist's Booking. The catalogue now gives them a price field: a third-party
   price shown read-only (US-03.5.1, US-04.2.2), a fixed rate they cannot change (US-05.2.6), a fixed
   discount shown locked (US-05.4.3), their own fixed price shown and editable, and a typed price on
   No contract (RVG) ([AR-29#contract-behaviour](../../../../requirements-board/requirements/artifacts/AR-29.md)).
   - **Build:** the price section shows exactly those, and still **no calculated total** (no "BTM x
     unit value = $x" on mobile or web). Record the supersession in the Decisions log.
   - **Do not ask now:** put "should the anaesthetist see the calculated price before and after their
     discount?" on the "For the owner's review" list. If yes later, one read-only row in the price
     section, not a Booking total.
4. **Verify items.** US-04.2.2 and US-03.5.1 are **Verify**: build them as written and put both on the
   "For the owner's review" list.
5. **Read what Phases 15b to 23 actually left.** Check their PROGRESS entries and the code, then name
   the real symbols in your plan:
   - 18: the holder type with `partyType: 'thirdParty' | 'firstParty'`, `isDefault` and
     `noContractOf`, the version lookup (`isEffectiveOn` or as built), `permitsIndividualArrangement`,
     `permitsRateTime` and `INDIVIDUAL_ARRANGEMENT_MESSAGE` (left for this phase), the Aria Contract
     (`CT-ARIA-HOURLY`, holder `CH-ARIA`), and whether 18's or 21's "an ended Contract with no
     successor falls to No contract (RVG)" interim is still in the fee path;
   - 19a: the resolver's name and output (`fixedPrice`, `fixedRate`, `fixedDiscountPercent`, each
     with its layer), `lineFor`, `isPlainRvgContract`, `ownPriceListFor` and `ownFixedPriceFor`, the
     `FeeResult` terms it added, where the calculated step rounds once, Aria's fixed-rate lines (which
     procedures), Dr Souter's first-party Contract, and the fixtures 19a added to the parity harness
     (`feeParity.test.ts` and `__parity__/`, built by 18);
   - 20: `setProcedureContract`, the picker, the anaesthetist's Change Contract action, how a changed
     Contract re-runs the resolver, and the "Contract changed by anaesthetist" review flag;
   - 20a: the stack component (`ProcedureStack` in `src/shared/booking`, as planned) and its "pricing
     basis" selector (planned as `pricingBasisFor` in `src/domain/billing/procedureStack.ts`, reading
     19a's line: the basis, never the computed fee);
   - 21: the payer on the Booking, the completion checks, Review's stack, and any "procedure not on
     the Contract" flag 21 built in place of the silent BTM fallback;
   - 22: the invoice layout, the Split button and how a split takes its shares from a Procedure's
     price, and how an override line is presented;
   - 23: the Booking-level engine's name (planned as `bookingFeeFor`), what it returns per Procedure,
     `isPrimary`, and where the RVG rule adjusts calculated Procedures' units.

   Also grep for any `priceOverride` of kind `dollarAdjustment` or `fixedFee` that a later phase seeded
   or wrote as the anaesthetist (none at 60e2d1e; S5's staged audit edits are not price edits) and
   re-express each as a typed price or % discount, or move it to an office override.
6. Note the current `PERSIST_VERSION` (16 at 60e2d1e; higher after 15b to 23).

## Reference

**Design files (convention 17).**
- `docs/design/Mobile App.dc.html`: capture sections, segmented controls, text fields, captions.
- `docs/design/Admin Review.dc.html`: row anatomy; flag pills in the Flags column (as "T adjusted +1
  manually"); the mono, tabular-nums Fee cell.
- `docs/design/Web Dashboard.dc.html`: the web chrome around the shared Booking detail only.
- `docs/design/Design Language.dc.html`: tokens. Teal for Save price, Remove and Price override; the
  neutral pill for recorded layers and the price source; a neutral lock treatment for read-only and
  locked prices; the warning tint only for "not allowed"; mono for every figure, rate and percent;
  crimson never.
- No mockup draws the price section or the layered total. Extend the capture-section and Review-pill
  patterns rather than inventing a panel.

**Catalogue.** The covered items, plus
[US-04.2.14](../../../../requirements-board/requirements/stories/US-04.2.14.md) (the anaesthetist's own
fixed-price Contracts, kept by the office),
[US-04.1.5](../../../../requirements-board/requirements/stories/US-04.1.5.md) (holders and party type),
[US-03.4.1](../../../../requirements-board/requirements/stories/US-03.4.1.md) (the anaesthetist changes
the Contract),
[US-04.3.3](../../../../requirements-board/requirements/stories/US-04.3.3.md) (No contract (RVG)),
[US-03.3.6](../../../../requirements-board/requirements/stories/US-03.3.6.md) (other billing lines; the
UNIT x RATE line is removed),
[US-08.6.3](../../../../requirements-board/requirements/stories/US-08.6.3.md) and
[US-08.6.5](../../../../requirements-board/requirements/stories/US-08.6.5.md) (the by-hand routes US-05.2.5
names; 38b, 39),
[FT-07.2](../../../../requirements-board/requirements/stories/FT-07.2.md) (SUBMITTED review, where the
office overrides),
[OQ-89](../../../../requirements-board/requirements/questions/OQ-89.md),
[OQ-96](../../../../requirements-board/requirements/questions/OQ-96.md) and
[OQ-90](../../../../requirements-board/requirements/questions/OQ-90.md).

**Artifacts** (read, never edit; AR-29 and AR-30 are a draft):
[AR-28](../../../../requirements-board/requirements/artifacts/AR-28.md) `#what-the-anaesthetist-can-change`
(the three-column table: third-party fixed price, own fixed price, No contract (RVG)) and
`#worked-examples` (the six to eight cases the tests mirror);
[AR-29](../../../../requirements-board/requirements/artifacts/AR-29.md) `#booking-procedure-fields`
(`price_entered`, `discount_pct_entered`, `adjustment_reason`, `price`, `price_source`),
`#contract-behaviour` (the adjustable rule and the per-kind price field), `#price-validation`,
`#price-precedence` and `#dormant-capabilities` (the rate and discount, live here);
[AR-30](../../../../requirements-board/requirements/artifacts/AR-30.md) `#booking-procedure`. The
files are `artifacts/files/Contract pricing model - technical design v4.pdf` (a `.docx` beside it)
and `How procedures are priced and who pays.pdf`.

**Analysis.**
- `../GAP-ANALYSIS.md`: everything before "## By epic" (theme 4, pricing), the DM-50, DM-14 and DM-46
  rows under "Structural changes", the RV-11 and RV-24 rows under "Prototype behaviour to remove or
  rework", then the EP-03, EP-04 and EP-05 tables.
- `../epics/EP-03.md` (FT-03.5, US-03.5.1), `../epics/EP-04.md` (US-04.2.2) and `../epics/EP-05.md`
  (FT-05.2, US-05.2.5, US-05.2.6, FT-05.4, US-05.4.1, US-05.4.3).
- `../analysis/domain-model-delta.md` (DM-50, DM-14, DM-46; DM-09 and DM-43 for 19a's side) and
  `../analysis/reverse-check.md` (RV-11, RV-24).
- The code maps: `../analysis/prototype-map-domain.md`, `prototype-map-shared.md`,
  `prototype-map-admin.md` and `prototype-map-store-seed.md`.

**Code entry points** (line numbers as at 60e2d1e, after 15a session 1; Phases 15b to 23 move lines
and rename symbols, so use the names they left):
- **Session 1 (engine):**
  - `src/domain/billing/fee.ts`: `feeFor`; the RVG and fixed component (rewritten by 19a around the
    line); the non-RVG line loop with its `rateTime` branch (~l.236 to 250); the override block
    (~l.254 to 267); `FeeLine.hours` / `rate` (~l.140); `AppliedOverride` and `FeeResult` (~l.146 to
    166); 23's Booking-level engine beside it.
  - `src/domain/types.ts`: `PriceOverride` (~l.443), `Procedure.priceOverride` (~l.511), `ChargeBasis`
    (~l.519, `'rateTime'`), `BillingLine.rate` / `hours` (~l.533 to 536),
    `Contract.permitsIndividualArrangement` (~l.228, as 18 left it); the `by` and `atISO` shape that
    `BookingCancellation` uses.
  - `src/domain/billing/validateBookingForBilling.ts`: `INDIVIDUAL_ARRANGEMENT_MESSAGE` (~l.39), the
    Method 3 gate (~l.219 to 231), the price-override checks (~l.232 to 243), the base code and time
    checks (~l.130 to 160).
  - `src/domain/billing/invoiceBuild.ts`: the "Price override, {reason}" delta line (~l.355 to 378) and
    the `$0` group skip (~l.423); `src/store/billingRun.ts`.
  - `src/store/billingLineActions.ts`: the `'rateTime'` input (~l.29 to 36), the gate (~l.42, ~l.78 to
    82), the rate x time amount (~l.97 to 101).
  - `src/shared/capture/AddBillingLineSheet.tsx` (the Basis type ~l.10, `rateTimePermitted` ~l.30, the
    option ~l.92 to 98) and `BillingLinesCard.tsx` (~l.18, ~l.96).
  - `src/apps/admin/flows/ContractEditSheet.tsx`: the "Permits individual arrangement (Method 3)"
    control (~l.189, or wherever 18 moved it).
  - `src/shared/flows/PriceOverrideSheet.tsx` (its fixed fee above zero, ~l.62) and
    `src/shared/booking/OfficeBillingSetup.tsx` (the Override row and "Price override" button, ~l.81
    to 90).
  - `src/shared/audit/fieldLabels.ts` (`permitsIndividualArrangement` ~l.100, `priceOverride`),
    `actionLabels.ts`, `auditNarrative.ts` (`formatShape` ~l.132).
  - Seed: `src/domain/seed/contracts.ts` (`CONTRACT.ariaHourly` ~l.26, the Aria Contract ~l.119 to
    132), `bookings.ts` (Fitzgerald's Wed 15 Jul rate x time Booking ~l.717 to 740, Souter's Mon 27
    Jul Aria Booking ~l.868 to 886, the scenario keys `rateTime` / `rateTimeCapture`), `index.ts`
    (`SEED_MARKERS.rateTimeBooking`, `rateTimeCaptureBooking` ~l.603 to 613,
    `individualArrangementContract` ~l.700 to 704), `audit.ts`; `src/apps/demo/DemoData.tsx` (~l.212).
  - Tests that construct `rateTime` or `priceOverride`: `fee.test.ts`, `validateBookingForBilling.test.ts`,
    `captureActions.test.ts` (~l.106 to 187), `invoiceBuild.test.ts`, `billingRun.test.ts` (~l.207 to
    218, the $1,440 Aria invoice), `seed.test.ts` (~l.325, "3 hours at $480 = $1,440"),
    `mastersActions.test.ts`, `auditNarrative.test.ts`.
- **Session 2 (adjustment and surfaces):**
  - `src/store/lifecycle.ts`: `ProcedurePatch` (~l.443), `editProcedure` (~l.445), `editRefusal` (~l.48).
  - `src/store/contractActions.ts` and 20's `setProcedureContract`.
  - `src/shared/capture/OverrideCard.tsx` (to be replaced), mounted in `BtmCaptureBlock.tsx` (~l.249 to
    266, in a `Pair` with `BillingLinesCard`; its anchor `'priceOverride'` in the `anchored` set ~l.107).
  - `src/shared/booking/BookingDetailBody.tsx` (the override note ~l.238 to 248, the
    `actor.role !== 'anaesthetist'` total guard), `src/shared/surface/context.ts` (`overrideNote`),
    `src/shared/capture/BookingTotalPanel.tsx`, `src/shared/capture/feeContext.ts`, 20a's stack.
  - `src/apps/admin/screens/ReviewScreen.tsx` (the Fee column) and `src/apps/admin/reviewFlags.ts`.
  - `src/apps/admin/screens/MasterData.tsx` (`ContractsView`) and the Contract detail panel.
  - Playwright: `visual/admin-phase06.spec.ts` ~l.45 to 55 (`a-05-override.png`) and
    `visual/booking-attachments.spec.ts` ~l.44 (`expectSameHeight(page, 'Adjustment and charge',
    'Billing lines')`).

## Work items

### Session 1: the precedence, the office override record and the hourly line

1. **Model** (`domain/types.ts`, the billing types). Satisfies DM-50 and DM-14;
   [AR-29#booking-procedure-fields](../../../../requirements-board/requirements/artifacts/AR-29.md),
   [AR-30#booking-procedure](../../../../requirements-board/requirements/artifacts/AR-30.md).
   - **Rename** `PriceOverride` to `OfficeOverride` and `Procedure.priceOverride` to
     `Procedure.officeOverride`, in one pass through code, seed, tests, `seed/audit.ts` and the
     labels. The union keeps its three kinds (US-05.4.2): `fixedFee` (now **0 or more**, so the office
     can make a no-charge price), `dollarAdjustment`, `percentAdjustment`, each with a mandatory
     `reason`, plus `by` and `atISO` (the `BookingCancellation` shape). With two layers, a field
     called "price override" that the anaesthetist no longer writes is a trap.
   - **Add** `Procedure.anaesthetistAdjustment?: AnaesthetistAdjustment` =
     `{ kind: 'price'; amount: number; reason; by; atISO } | { kind: 'percentDiscount'; percent:
     number; reason; by; atISO }`: the design's `price_entered` and `discount_pct_entered` with
     `adjustment_reason`. `amount` is the whole price ex GST, 0 or more; `percent` is above 0 and up
     to 100, decimals allowed. No dollar kind. Session 1 adds the type and the engine path; the store
     and UI are session 2's.
   - **`PriceSource`** = `'officeOverride' | 'anaesthetistPrice' | 'contractFixedPrice' |
     'calculated'` (the design's `OFFICE_OVERRIDE`, `ANAESTHETIST_PRICE`, `CONTRACT_FIXED_PRICE`,
     `CALCULATED`), with one label map for every surface ("Office override", "Anaesthetist's price",
     "Contract fixed price", "Calculated").
   - **`ChargeBasis`** becomes `'rvg' | 'fixed'`; `BillingLine.hours` and `FeeLine.hours` go; `rate`
     is "$ per unit, 'rvg' only".
2. **The adjustable rule and the precedence** in a new `src/domain/billing/pricePrecedence.ts`,
   re-exported from the billing index, with Vitest tests in `pricePrecedence.test.ts`. This module is
   the one place for the precedence, the adjustable rule, the validation and the price source.
   - **`isAdjustable(contract, holder)`**: `contract.isDefault` or `holder.partyType ===
     'firstParty'` ([AR-29#contract-behaviour](../../../../requirements-board/requirements/artifacts/AR-29.md)).
     A Procedure with no Contract is not adjustable (20 makes a Contract mandatory).
   - **`fixedDiscountBlocksAdjustment`** (OQ-89 open part, D40 default `true`): a line with a fixed
     discount takes no anaesthetist price or discount. **`adjustmentAllowed(contract, holder,
     terms)`** = `isAdjustable` and not blocked by a fixed discount. Every caller (engine, store, UI)
     reads `adjustmentAllowed`; nothing else tests the party type.
   - **`priceProcedure(input)`** returns either a `PriceResult` or a `PriceRejection`. Its input is the
     Procedure's recorded BTM and billable units after 23's rule, 19a's resolved terms (`fixedPrice`,
     `fixedRate`, `fixedDiscountPercent`, each with its layer), the anaesthetist's unit value, the
     adjustment, the office override, the Contract version's validity on the procedure date and
     whether any captured billing line exists. It runs the design's order
     ([AR-29#price-precedence](../../../../requirements-board/requirements/artifacts/AR-29.md)):
     - **Validation first** ([AR-29#price-validation](../../../../requirements-board/requirements/artifacts/AR-29.md)),
       each a `PriceRejection { code, message }`, never a silent fallback:
       - `adjustmentNotAllowed`: an adjustment stored on a Contract that does not allow it, or on a
         fixed-discount line (D40). "{Contract} does not allow an anaesthetist price or discount.
         Remove it."
       - `btmMissing`: no fixed price resolves and the times are not recorded. "Record the start and
         handover times: {Contract} sets no fixed price for this procedure." (B always resolves from
         the group, and M may be none, so "BTM missing" means the time inputs; share the validator's
         existing time predicate, extracted, not copied.)
       - `contractNotInForce`: the selected Contract version is not valid on the procedure date.
         "{Contract} is not valid on {date}. Choose a Contract in force on the procedure date."
         This replaces any "ended Contract falls to No contract (RVG)" interim still in the fee path.
       - `noLineForProcedure`: a Contract that has lines has none for the Procedure's procedure (a
         plain RVG Contract with no lines, D32, and No contract (RVG) are priced, not rejected).
         "{Contract} has no line for {procedure}. Choose another Contract or No contract (RVG)." If 21
         built a "procedure not on the Contract" flag, this rejection is its single source.
       - `billingLineOnFixedPrice`: a captured billing line on a Procedure whose price is the
         Contract's fixed price (US-05.2.5: nothing is added). "A fixed price is the whole price.
         Remove the billing line; raise an additional invoice if the work differed."
     - **Steps** (each amount rounded to cents once, where it is made):
       1. `anaesthetistPrice`: an allowed typed price is the price.
       2. `contractFixedPrice`: the line's fixed price is the price, BTM returned for reference. If an
          allowed anaesthetist % discount is stored (only possible on a first-party fixed price), it
          applies to the fixed price (a picked reading: AR-28's table gives "Percentage discount: Yes"
          for the anaesthetist's own fixed price, while AR-29's formula shows the discount only in the
          calculated step); the source stays `contractFixedPrice`, with the discount recorded. Log it.
       3. `calculated`: `billableUnits x rate x (1 - discount / 100)`, `rate` the line's fixed rate or
          the anaesthetist's unit value, `discount` the line's fixed discount or the anaesthetist's
          own % (never both, D40), rounded once (19a's rounding). Captured non-RVG billing lines add
          here only. Export this step as one pure helper (for example `calculatedPrice(units, rate,
          discountPercent)`, with the rate and discount picked by one exported function), so 39b's
          time-priced events reuse it rather than re-derive a rate or discount.
       - Then the **office override** (step 0) on the result: `fixedFee` replaces it, `dollarAdjustment`
         adds to it, `percentAdjustment` scales it; the source becomes `officeOverride`.
     - **`PriceResult`** records `priceSource`, `contractPrice` (the step 2 or 3 figure before any
       anaesthetist layer), `afterAdjustment`, `beforeOverride`, `total`, the `rate` and its origin
       (`fixedRate` or `unitValue`), the `discountPercent` and its origin (`fixedDiscount` or
       `anaesthetist`), and `noCharge` (`total === 0`). B, T and M are never touched: the function
       only sees money.
   - **Tests: the worked examples** (fixture unit value $30.00; mirror
     [AR-28#worked-examples](../../../../requirements-board/requirements/artifacts/AR-28.md) where they
     apply):
     - **W1.** No contract (RVG), 12 units: $360.00, `calculated`.
     - **W2.** Fixed rate $26.50 on 12 units: $318.00, the anaesthetist's $30.00 ignored (US-05.2.6).
     - **W3.** Fixed discount 10% on a calculated $1,000.00: $900.00 (US-05.4.3's criterion), origin
       `fixedDiscount`.
     - **W4.** Fixed rate $26.50 and fixed discount 10% on 12 units: $286.20.
     - **W5.** Fixed price $2,800.00 with B, T and M recorded: $2,800.00, `contractFixedPrice`, BTM
       returned; a fixed price of 0 gives $0.00 and `noCharge`.
     - **W6.** No contract (RVG), typed price $450.00: $450.00, `anaesthetistPrice`, `contractPrice`
       $360.00 recorded (US-05.4.1: the fee before the adjustment is kept).
     - **W7.** No contract (RVG), 10% discount: $324.00; 100% discount: $0.00 with `btm` and
       `billableUnits` unchanged (US-03.5.2); 50% (AR-28's colleague's family member): $180.00.
     - **W8.** First-party fixed price $1,200.00: typed $1,500.00 gives $1,500.00; a 10% discount gives
       $1,080.00 (the picked reading).
     - **W9.** Rejections: a typed price on a third-party Contract; a discount on a third-party
       Contract; a discount on a fixed-discount line (D40); times missing with no fixed price; times
       missing with a fixed price (priced, not rejected); a Contract not in force on the date; a lined
       Contract with no line for the procedure; a plain RVG Contract (priced); a billing line on a
       fixed price.
     - **W10.** Office override over each source: fixed fee $2,650.00 over a fixed price; +$20.00 over
       W7's $324.00 gives $344.00; -10% over W6's $450.00 gives $405.00; fixed fee $0.00 gives a
       no-charge price; the override over a third-party fixed rate (W2) applies (US-05.4.2).
     - **W11.** Rounding: 12.5% off 11 units at $30.30 rounds once to $291.64 (11 x 30.30 = 333.30,
       less 12.5% = 291.6375).
     - **W12.** Parity: with no layer, every seeded Procedure prices to the cent as 23 left it (the
       parity fixture, item 8).
3. **Engine wiring** (`fee.ts` and 23's Booking-level engine).
   - `feeFor` (or 23's per-Procedure step) calls `priceProcedure` after the multi-procedure rule has
     set the calculated Procedures' units (D26: the RVG rule touches calculated Procedures only, so a
     fixed-price or typed-price Procedure is not re-based by it). The old override block, the
     additional-procedure and no-match BTM fallbacks, and any second derivation of a rate or discount
     go. The Booking total is the sum of the per-Procedure totals.
   - `FeeResult` gains the `PriceResult` fields (or holds it) and a `rejection`. Update every reader:
     `procedureFee` and `bookingFee` in `feeContext.ts` (or 23's view), `ReviewScreen`, `reviewFlags`,
     `invoiceBuild`, `billingRun`, `BookingDetailBody`, 20a's stack selector and the selectors.
   - **20a's "pricing basis" selector** (`pricingBasisFor` in `procedureStack.ts`, or as 20a named it)
     is re-pointed to read the price source and figure: "Contract
     fixed price $2,800.00", "Fixed rate $26.50 a unit", "Your unit value, less 10% (Contract)", "Your
     price", "Office override". One selector, so 43a and the stack never re-derive it. It still names
     the basis and its set figure (a fixed price, a rate, a percent, the anaesthetist's own typed
     price), never a calculated total or an override amount (20a's rule and drift check 3).
   - **Test G2, multi-procedure under 23's rule.** An adjustment on an additional calculated Procedure
     changes only that Procedure's price; the primary's price and the unit shares are unchanged.
   - **22's split.** A Split divides the Procedure's **final** price (after every layer). If a typed $
     share now exceeds the final price (an adjustment or override lowered it), the validator refuses
     with "The split shares come to more than the price ({price}). Change the split or the
     adjustment.", unless 22 already caps or refuses it; test that the remainder never goes negative.
4. **Validator** (`validateBookingForBilling`). Every message verbatim, no dashes.
   - Each `PriceRejection` becomes a failure on its own field (`anaesthetistAdjustment`, the
     Contract selection field 20 left, the time fields `anaestheticStartISO` and `handoverISO`,
     `billingLines`), so the capture latch anchors it.
   - **Times follow the precedence** (FT-05.2's gap: the validator demands times "even when a fixed
     price resolves"). Today's unconditional "Record the anaesthetic start time." and "Record the
     handover time." checks on every RVG code give way to `btmMissing`: the times are required only
     when no fixed price resolves. On a fixed-price Procedure the capture still offers the times and
     records B, T and M for reference when entered (US-05.2.5), and "Handover must be after the
     anaesthetic start." still applies when both are entered, but missing times no longer block Mark
     complete. One predicate, extracted from the validator and called by `priceProcedure`. A picked
     reading: log it, and put it on the "For the owner's review" list.
   - `officeOverride`: the existing reason and "makes the fee negative" checks, re-keyed and computed
     on the layered total; a fixed fee of 0 is accepted.
   - These are completion checks on invalid billing data, not 15a warnings: register no warning rule
     and no "Raise sample warnings" sample.
   - The billing run treats a rejection as a per-Booking billing failure with the same sentence (it
     should never arise after completion; a re-dated List or an end-dated version can still cause
     it).
5. **No-charge invoice** (`invoiceBuild.ts`, `billingRun.ts`). A price of 0 or a 100% discount gives a
   no-charge invoice (FT-05.2, US-05.4.1, US-03.5.1).
   - A billable-party group whose priced total is $0.00 **before any prepayment deduction** now raises
     an invoice with its lines at $0.00, GST $0.00, headed "No charge", delivered like any other
     (22's delivery). A group netted to $0 only by a prepayment deduction still raises none (27's
     rule, US-08.2.2); test both.
   - A no-charge invoice raises **no payable leg and no BCTI** (nothing is owed to the anaesthetist),
     so 16's BCTI count is unchanged; its draft Xero ACCREC is created at $0.00 like any receivable. A
     picked reading: log it with the BCTI granularity point.
   - Before switching, list any seeded group that prices at $0 today (it now raises a no-charge
     invoice); none is expected.
6. **The hourly line goes.** Covers DM-46, RV-24.
   - `AddBillingLineSheet` loses "Rate × time (hourly)", its hours and rate fields, its live preview
     and `rateTimePermitted`; it offers the fixed amount line only, and is not offered on a Procedure
     priced at the Contract's fixed price (item 2's `billingLineOnFixedPrice`). Update its header
     comment.
   - `BillingLinesCard` loses its `rateTime` branch and its "Method 3 gate" comment;
     `billingLineActions` loses the `'rateTime'` input and the Method 3 refusal, and refuses a line on
     a fixed-price Procedure with the item 2 sentence.
   - `validateBookingForBilling` loses `INDIVIDUAL_ARRANGEMENT_MESSAGE` and the Method 3 gate; `fee.ts`
     loses its `rateTime` branch.
   - `Contract.permitsIndividualArrangement`, `permitsRateTime` and the Contract editor's "Permits
     individual arrangement (Method 3)" control go; `fieldLabels` drops the label.
   - Grep must find none of `rateTime`, `permitsRateTime`, `permitsIndividualArrangement`,
     `INDIVIDUAL_ARRANGEMENT_MESSAGE` in `src`, nor "Method 3", "hourly", "individually arranged" or
     "rate x time" in rendered strings.
7. **Seed: the Aria Contract and its two Bookings.**
   - **The Aria Contract** (`CT-ARIA-HOURLY`; keep the system id, which no screen shows, so later
     phases and recipes keep resolving it). Rename the code key `ariaHourly` to `ariaFixedRate` and
     the name to "Aria Skin and Laser Clinic, fixed rate". Its holder and billing stay as 18 left them
     (third party, holder billed). Its terms are 19a's fixed-rate lines at **$26.50 a unit**; make
     sure 19a's `RATE_LINES` table gives it a line for each procedure its two Bookings now use (widen
     the table, never a line per Booking).
   - **Fitzgerald's Wed 15 Jul Booking** (completed, today 3.0 hours at $480 = $1,440 with no procedure
     code). Give its Procedure 19's abdominoplasty procedure (its group's base units through the
     resolver), start and handover 08:30 to 11:30 (inside its 11:45 completion), and no claimed
     modifiers (19b: modifiers are optional). Drop the rate x time line (this frees one seeded
     billing-line id and its audit entry id: confirm no test, recipe, ATLAS entry or guide beat pins
     them). Its price becomes (B + 14 + 0) x $26.50, T from 19a's tiers (3 hours = 8 + 6 under the
     always-round-up rule), source `calculated`, origin `fixedRate`. Pin the figure in `seed.test.ts`
     and `billingRun.test.ts` in place of $1,440, and grep the demo guide and Control Panel for
     "$1,440" (none at 60e2d1e).
   - **Souter's Mon 27 Jul Aria Booking** (Heather Sinclair, "Laser skin resurfacing", uncaptured):
     stays uncaptured on the Aria Contract, with the procedure 19 gave it (or laser resurfacing's
     general procedure); its description drops "individually arranged hourly rate". It becomes the
     **fixed-rate capture Booking**: captured like any other, its rate shown read-only to Dr Souter
     (session 2).
   - **Markers.** `SEED_MARKERS.rateTimeBooking` becomes `fixedRateBooking` ("Fixed rate Booking"),
     `rateTimeCaptureBooking` becomes `fixedRateCaptureBooking`, `individualArrangementContract`
     becomes `fixedRateContract`, re-worded with no "Method 3", "hourly" or "individual
     arrangement". Update `DemoData.tsx`.
8. **Parity, then green and the persist bump.**
   - Add a `phase-24` fixture to the fee parity harness (`feeParity.test.ts`, `__parity__/`), generated
     from the code as 23 left it before any edit, with named cases for each scripted Booking S2 to S5
     and the carried-across matches (US-05.2.6's fixed rates at $26.50, $23, $25 and $24; the bariatric
     $2,800 and $950 with GST; a No contract (RVG) Booking at the anaesthetist's own value; the office
     override seeds). Never regenerate it with `-u`. Only the two Aria Bookings may move, asserted by
     their new figures; anything else that moves is a bug.
   - **Determinism.** Edit only the explicit scenario rows named above; touch no generator or RNG input.
   - **Persist.** Bump `PERSIST_VERSION` by one from the value 23 left (a stored `rateTime` line or a
     `priceOverride` key in stale state would otherwise survive).
   - **Session 1 ends here:** `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots`
     green, the parity fixture identical except Aria, and the session 1 Decisions-log entries written
     (item 17). The office's override sheet and Review keep working on the renamed record; the
     anaesthetist's `OverrideCard` writes nothing new this session (hide its inputs if needed, so no
     write targets the old field).

### Session 2: the anaesthetist adjustment and the surfaces

9. **Store actions** in a new `src/store/adjustmentActions.ts`, exported from `store/index.ts`, each
   through `mutate()` with before and after metas and the demo clock. Covers FT-03.5, US-03.5.1,
   US-05.4.1, US-05.4.2.
   - **`setAnaesthetistAdjustment(api, actor, procedureId, input | null)`**
     - **Rights:** `editRefusal` first, so only the anaesthetist on their own ACTIVE List passes.
     - **Refusals:** `officeRole` ("The anaesthetist sets their own price. Use the office price
       override."; the one exception is the office passing `null` to clear an adjustment the Contract
       no longer allows, audited); `integrationSource`; `adjustmentNotAllowed` ("{Contract} does not
       allow an anaesthetist price or discount."); `fixedDiscountLocked` ("{Contract} sets a fixed
       discount. It cannot be changed or added to."); `reasonRequired`; `percentOutOfRange`;
       `priceNegative`.
     - **Clearing** (`null`) is never gated for the anaesthetist on their own ACTIVE List, including an
       adjustment the Contract no longer allows, so the validator's "Remove it." is always actionable
       on the phone.
     - Writes `by` and `atISO`; audits `procedure.anaesthetistAdjustment`.
   - **`setOfficeOverride(api, actor, procedureId, input | null)`**: office only, on ACTIVE or
     SUBMITTED; the anaesthetist is refused ("Only the office can set a price override."); reason
     required; allowed whatever the Contract (US-05.4.2, OQ-16); writes `by` and `atISO`; audits
     `procedure.officeOverride`.
   - **`ProcedurePatch`** omits both fields and `editProcedure` refuses them at runtime
     (`useDedicatedAction`), so no path bypasses the gates. Test both.
   - **A Contract change clears a disallowed adjustment.** 20's `setProcedureContract` clears a stored
     adjustment in the same `mutate()`, with a second meta (`procedure.anaesthetistAdjustment`,
     `after: undefined`, note "Removed: {Contract} does not allow an anaesthetist price or discount"),
     when the new Contract (or its line, D40) does not allow it
     ([AR-29#contract-selection](../../../../requirements-board/requirements/artifacts/AR-29.md)). The
     Change Contract sheet warns before the tap: "Your 10% discount will be removed. {Contract} does
     not allow a price change."
   - **Tests** (`adjustmentActions.test.ts`): each refusal; the rights matrix across ACTIVE,
     SUBMITTED and AUTHORISED for anaesthetist, office and integration; the audit entries; the
     Contract-change clear (two metas, one state change); the office's clear of a disallowed
     adjustment only; the anaesthetist's clear of a disallowed one.
10. **Anaesthetist price section** (mobile and the anaesthetist web app). `OverrideCard.tsx` is
    replaced by `shared/capture/PriceCard.tsx`, imported by `BtmCaptureBlock` as `OverrideCard` is
    today, one component for both surfaces through `useSurface()`. Delete `OverrideCard.tsx`. Covers
    FT-03.5, US-03.5.1, US-05.4.1, US-05.4.3, US-05.2.6's "rate locked".
    - **One selector** decides the state from `adjustmentAllowed`, the resolved terms and the stored
      adjustment, and the card renders it. The section is titled "Price" in every state:
      - **No contract (RVG)** (adjustable, calculated): caption "RVG pricing at your unit value." A
        Segmented control **None · Your price · Discount %**; "Your price $" is a mono field
        (placeholder 450.00, 0 or more); "Discount %" a mono field (above 0, up to 100); "Reason
        (required)" free text; "A reason is required before the price can be saved." in the warning
        on-tint while blank; **Save price** the teal secondary action, committing on Save, never per
        keystroke. At 100% or $0.00: "Base, time and modifier units stay recorded. This gives a
        no-charge invoice." (US-03.5.2).
      - **Their own first-party Contract** (adjustable, fixed price): "Your price list: $1,200.00" in
        mono, then the same control, so they may type another price or a discount with a reason.
      - **A third-party Contract:** read-only, with a neutral lock treatment and no inputs: "Agreed
        price $2,800.00", "Fixed rate $26.50 a unit" or "RVG pricing at your unit value" (a plain RVG
        Contract), with the holder's name, and the caption "Agreed with {holder}. To use a different
        price, change the Contract." linking to 20's Change Contract action. No discount field.
      - **A fixed discount** (any Contract): "10% fixed discount, set by the Contract" shown applied
        and locked where the price change would be, with no inputs (US-05.4.3; D40).
      - **No calculated total** anywhere on the anaesthetist surfaces (drift check 3).
    - **Read-only views** (a SUBMITTED or AUTHORISED List, or the office viewing the capture block):
      "Your price $450.00 · {reason} · Dr {surname}" or "Discount 10% · {reason} · Dr {surname}",
      using `drSurname` from `shared/format.ts`. A stored adjustment the Contract no longer allows
      adds a warning-tint line "{Contract} does not allow an anaesthetist price or discount. It is not
      applied." and a teal **Remove** link (the anaesthetist's on their own ACTIVE List, the office's
      clear in Admin).
    - When an office override exists, the anaesthetist sees one read-only caption, "The office has
      set a price override on this procedure.", with no figures.
    - The office no longer edits a price from the capture block: its override lives only in office
      billing setup (item 11).
    - **Anchors.** Replace `'priceOverride'` in `BtmCaptureBlock`'s anchored set with
      `'anaesthetistAdjustment'`; the card carries `validationTarget`, so "Mark complete" scrolls to it.
      `BillingLinesCard` stays its `Pair` partner (and is hidden on a fixed-price Procedure, item 6).
    - **Copy.** Delete "Adjustment and charge", "Percentage adjustments are set by the office.",
      "Adjustment $", "Charge $" and "Charge amount $".
    - **Hooks:** `data-shot="price-card"`, with `data-state` of `adjustable`, `own-price`,
      `third-party`, `fixed-discount` and `read-only`.
11. **Office surfaces** (Admin; the office web Booking detail; Review). Covers FT-05.4, US-05.4.2,
    FT-05.2's recorded price source.
    - **Office billing setup rows:** "Anaesthetist's price" ("None", "Your price $450.00 · Dr Morrison",
      "Discount 10% · Dr Morrison", or a warning chip "Not allowed by {Contract}") and "Office
      override" (the renamed row; the "Price override" button keeps its name, so the Playwright
      locator holds).
    - **`PriceOverrideSheet`** (office only): writes through `setOfficeOverride`; heading "Office price
      override"; mono context lines above the type control: "{Price source} $360.00" and "After the
      anaesthetist's 10% discount $324.00" (when one applies), so the office sees exactly what it
      overrides; a fixed fee of 0 is accepted.
    - **Admin Booking total** (the total props): a `priceLayers` note beside `overrideNote`. For one
      Procedure: the price source pill and figure ("Calculated $360.00", "Contract fixed price
      $2,800.00", with the rate and any fixed discount from 19a's caption), then "Anaesthetist discount
      10% · $324.00" or "Anaesthetist's price · $450.00", then "Office override · was $324.00". For
      several: "Adjusted on n of m procedures" and the override count sentence. The mobile Booking
      total still renders nothing.
    - **Review** (`ReviewScreen`; `reviewFlags.ts`, kept pure): the Fee cell shows the final Booking
      price and, when any layer applies, a second mono line in mist, "was $360.00". Flags: "Discount 10%
      by Dr {surname}" or "Own price by Dr {surname}" (neutral), "Office override" (neutral), "No
      charge" (neutral), "Price not allowed by {Contract}" (warn), and each `PriceRejection` (warn).
      The flags tile and "flags open" count pick them up; test them in `reviewFlags.test.ts`.
    - **Contract catalogue and detail panel** (`ContractsView`, 18's panel): a neutral pill
      "Anaesthetist may adjust" on No contract (RVG) and first-party Contracts, and "Price locked for
      the anaesthetist" on third-party ones, read from `isAdjustable` (derived, not editable). The lines
      grid (19a's) shows a fixed discount with a lock icon and the caption "Shown to the anaesthetist,
      locked".
    - **Hooks:** `price-source`, `booking-total-layers`, `review-adjustment-flag`,
      `office-override-sheet`, `contract-adjustable-pill`.
12. **Invoice** (`invoiceBuild.ts`, 22's layout). Covers FT-05.4.
    - After a Procedure's fee lines (the fixed price, or the calculated line with 19a's "less {n}%
      (Contract)"), up to two delta lines on its billable-party group: "Anaesthetist discount 10%,
      {reason}" or "Anaesthetist's price, {reason}" (amount `afterAdjustment - contractPrice`), then
      "Price override, {reason}" (amount `total - beforeOverride`). A disallowed adjustment raises no
      line (it is a rejection).
    - On a Procedure 22's Split divided, the delta lines sit with the Procedure's lines before the split
      shares are taken, and each share quotes the final price.
    - Keep the Phase 08 pattern that prints the reason; raise with the owner whether reasons should
      print on a customer invoice.
    - **Tests** (`invoiceBuild.test.ts`, `billingRun.test.ts`): both lines in order reconciling to the
      subtotal to the cent; a 100% discount raising a no-charge invoice with the units intact; S3's
      figures unchanged (Holt $396.18, Prentice $152.38 and $91.43, or the figures 22 and 23 re-based
      them to).
13. **Seed the beats** (`contracts.ts`, `bookings.ts`, `audit.ts`, `index.ts`; demo values labelled in
    comments).
    - **Dr Souter's Mon 27 Jul ACTIVE List** carries one Booking per state, so one List shows them all:
      - the **fixed-rate** Aria Booking (item 7): rate shown read-only;
      - a **No contract (RVG)** capture Booking, uncaptured: reuse one if 20 or 21 left one there;
        otherwise add "Excision of skin lesion, self funded" (a pinned patient with a fixed valid NHI
        and an email, the payer on the Booking prefilled from the patient). Record it as
        `SEED_MARKERS.adjustmentCaptureBooking`;
      - a **fixed-discount** Booking: a new demo Contract under an existing third-party surgeon or
        rooms holder 18 seeded (for example Dr Doyle, holder not billed, so the payer on the Booking is
        invoiced) with one line carrying a **10% fixed discount** for one procedure, and one explicit
        uncaptured Booking on it. Record them as `SEED_MARKERS.fixedDiscountContract` and
        `fixedDiscountBooking`;
      - Sarah Mitchell's repeat Booking there (a hospital's plain RVG Contract, D32) shows the
        third-party read-only RVG price; Doyle's bariatric Bookings on her earlier Lists show a
        read-only third-party fixed price.
    - **The Review beat.** On Dr Morrison's Mon 20 Jul SUBMITTED List (`SEED_LIST_IDS.morrisonMon20`,
      S2 Beat 4, which quotes no figures), one completed Booking on No contract (RVG) carries a seeded
      **10% discount**, reason "Long-standing patient, courtesy discount", with a matching seeded audit
      entry by Dr Morrison. Reuse a No contract (RVG) Booking there if 20 or 21 left one; otherwise add
      one fully captured explicit Booking at the end of the List (a pinned patient, payer prefilled),
      whose Contract selection raises no "Contract changed by anaesthetist" flag. Record it as
      `SEED_MARKERS.adjustedBooking`. Check S2 Beat 4's counts, any Review-count test and the US-07.2.3
      recipe.
    - **Ids stay put.** Build every new Booking and Contract after every existing seeded one (23's
      included), with pinned patients created without `takePatient()`, so no existing id moves;
      recipes start on fixed ids (BK0001, BK0009, BK0010, BK0028, BK0031, BK0037). The seed test
      asserts the existing ids are unchanged.
    - **Seed tests:** every seeded adjustment is allowed by its Contract and has a reason; no seeded
      `officeOverride` has an anaesthetist `by`; the fixed-discount Booking prices at its calculated
      price less 10% once captured; the parity fixture, Aria's figure and S3 and S5's figures are
      unchanged; the generated canvas is unchanged.
    - **Persist.** Bump `PERSIST_VERSION` by one from session 1's value.
14. **Labels and audit.**
    - `ACTION_LABELS`: `procedure.anaesthetistAdjustment` "Anaesthetist price or discount",
      `procedure.officeOverride` "Office price override". `FIELD_LABELS`: both fields; drop
      `priceOverride` and `permitsIndividualArrangement`.
    - `auditNarrative.formatShape`: `percentDiscount` "Discount 10% · {reason}"; `price` "Own price
      $450.00 · {reason}"; the office kinds keep today's wording; `by` and `atISO` are not rendered
      twice. Update `auditNarrative.test.ts`.
15. **Playwright.**
    - `admin-phase06.spec.ts`: the renamed sheet heading; l.55's `/Adjustment .*10%/` must match the
      Office override row, not the new "Discount 10%" row; re-shoot `a-05-override.png`.
    - `booking-attachments.spec.ts`: the equal-height check uses "Price" on the adjustment capture
      Booking, and asserts the read-only state on the Aria Booking.
    - Add shots: `price-card` in each state on mobile and web, `booking-total-layers`,
      `review-adjustment-flag`, `contract-adjustable-pill`, and a no-charge invoice.
16. **Copy and design.** No en or em dashes anywhere; teal on every new action; crimson nowhere; the
    lock and price-source treatments neutral; the warning tint only for "not allowed" and rejections.
17. **Decisions log** (PROGRESS.md), superseding and recording:
    - **Superseded (session 1):** the Method 3 hourly rate line (5th review #1, "the Method 3 gate")
      and 18's interim `permitsIndividualArrangement`; the 2026-07-23 reading that kept Fitzgerald's
      hourly Booking as Phase 08's billing exemplar (it is now a fixed-rate Booking); the silent BTM
      fallback for an additional Procedure or an unmatched code (if 19a or 21 has not already
      recorded it); "a $0 group raises no invoice" (now a no-charge invoice, except a group netted to
      0 by a prepayment); the office fixed fee "above zero" rule; any "ended Contract falls to No
      contract (RVG)" interim (now a rejection).
    - **Superseded (session 2):** the 2026-07-22 seventh review A6/B5 half "mobile's legacy
      Adjustment/Charge fields now write the typed $/fixed overrides" (the anaesthetist now writes a
      separate, Contract-gated typed price or % discount); Phase 08's single "Price override" invoice
      line (two layered delta lines); the 2026-09-28 "fee hidden from the anaesthetist" ruling **in
      part** (the catalogue's price field, read-only third-party price, locked fixed discount and own
      fixed price are shown; the calculated total is still not). RV-11 and RV-24 are closed.
    - **Readings:** adjustable is derived from `isDefault` and the holder's party type (where the
      setting lives is open in AR-29); OQ-89's second part built as its default (no price or discount
      on a fixed-discount line, one constant); the anaesthetist's % discount on a first-party fixed
      price applies to that price (AR-28 over AR-29's formula); "BTM missing" means the time inputs,
      and the validator no longer demands times on a Procedure whose fixed price resolves;
      the domain model's "applied after BTM is recorded in full" is honoured by the engine's
      rejection, not a field gate; a no-charge invoice raises no payable and no BCTI; a billing line on
      a fixed-price Procedure is refused, not added; a lined Contract with no line for the procedure
      is a rejection; `CT-ARIA-HOURLY` keeps its system id under its new name; the office does not
      edit the anaesthetist's adjustment, only overrides on top of it, apart from clearing a
      disallowed one.

## Demo triggers

**No new button.** Everything here is normal use:
- **Seeded Contracts on Dr Souter's Lists:** on her Mon 27 Jul ACTIVE List, the fixed-rate Aria
  Booking (the re-expressed Aria Contract; its rate read-only), a 10% fixed-discount Booking (the
  discount shown locked), Sarah Mitchell's hospital plain RVG Booking (read-only), and a No contract
  (RVG) Booking where she types a price or a % discount with a reason; Doyle's bariatric Bookings on
  her earlier Lists show a third-party fixed price read-only.
- **Admin Review** (product): Dr Morrison's Mon 20 Jul List has the discounted Booking; the office
  applies an override on a third-party price with its reason, shown beside the Contract price on the
  Booking total and the invoice.
- The Contract catalogue shows which Contracts the anaesthetist may adjust (derived).

Nothing is automatic, scheduled or external. Register no trigger and add nothing to the Control
Panel.

**PWA:** no stand-in needed. The handset half (open a Booking, see what the Contract allows, save a
price or discount with a reason, or see the price locked) is complete on the phone; the office override
is an office action with no mobile half beyond the caption. Check that Phase 14's "Office authorises
this List" PWA entry and the "Play the office" scaffold still authorise a List with layered and
no-charge Bookings.

## Out of scope

- **The pricing snapshot at AUTHORISED** (Phase 25): it records the price source, the adjustment and
  its permission, the before and after figures and the override. Until then they are computed live.
- **The price on a prepaid Procedure** (OQ-96, D30): 27 locks it, as one more branch of
  `adjustmentAllowed`.
- **The time band on a line** (OQ-89's other open part): 19a's default, none.
- **Holder references and completion rules** (21), **the Split button** (22), **combination
  Contracts** and **the multi-procedure rule** (23).
- **Additional invoices and credit notes by hand** (38b, 39), the routes US-05.2.5 names when the work
  differed from a fixed price. An additional invoice carries neither layer (free-form, D10).
- **Other billing lines' dates and preset types** (39b); there is no UNIT x RATE line any more.
- **A dollar discount for the anaesthetist, a cap on the typed price, an office edit of the
  anaesthetist's adjustment, an editable "allows adjustment" setting on the Contract.** Build none
  unless the drift check says so.
- **Showing the anaesthetist a calculated total**, unless the owner answers drift check 3 with yes.
- **Base units and the resolver** (19, 19a), **modifiers** (19b): read only.
- **A new warning rule:** the rejections are completion checks; 15a's routine is untouched.

## Manual test checklist

The agent runs every item itself in the running app and reports it with evidence; none is handed to
the owner (ROADMAP.md "Owner review: agents test themselves").

**Session 1 (engine):**
- [ ] **No hourly line.** Mobile and web, Dr Souter, Mon 27 Jul, Heather Sinclair's Aria Booking: Add
      billing line offers the fixed amount line only; no "Rate × time", "Method 3" or "hourly" anywhere.
- [ ] **Fixed rate.** Admin, Fitzgerald's Wed 15 Jul Aria Booking: the total reads "Calculated" at
      "Fixed rate $26.50 a unit" and the fee is the billable units x $26.50; Review shows the same; its
      invoice quotes the units at $26.50 and goes to the Aria clinic.
- [ ] **Fixed price is the whole price.** A Doyle bariatric Booking: "Contract fixed price $2,800.00"
      with B, T and M shown for reference; Add billing line is not offered on it. On a test copy with
      the times cleared, Mark complete is not blocked by the times (the price still resolves), while a
      No contract (RVG) Booking with no times is.
- [ ] **Rejections.** On a test ACTIVE List: end-date a Contract version before the List date and see
      "is not valid on" at Mark complete and in Review; a No contract (RVG) Booking with no times shows
      the times sentence.
- [ ] **No-charge invoice.** An office fixed fee override of $0.00 on a SUBMITTED Booking, then
      authorise: a $0.00 "No charge" invoice is raised, with no payable and no BCTI, and the units stay
      recorded.
- [ ] **Office override record.** Admin, Price override on any SUBMITTED Booking: the sheet is "Office
      price override", saves with a reason, and History reads "Office price override".
- [ ] **Parity.** S3's Holt and Prentice figures, the bariatric $2,800 and $950 with GST, the $23, $24
      and $25 fixed-rate Bookings and S5 Beat 1 are unchanged.

**Session 2 (adjustment and surfaces):**
- [ ] **Own pricing.** Mobile, Dr Souter, Mon 27 Jul, the No contract (RVG) Booking: the Price section
      offers None, Your price and Discount %. Enter 10% and leave the reason blank: Save stays disabled
      with the warning. Add "Courtesy discount" and save: "Discount 10% · Courtesy discount · Dr
      Souter", and no fee or total shows anywhere on the phone.
- [ ] **No charge.** Change it to 100% (or Your price $0.00): the caption says the units stay recorded
      and it gives a no-charge invoice; Mark complete succeeds after capture.
- [ ] **Third-party read-only.** The Aria Booking shows "Fixed rate $26.50 a unit", locked, with "Agreed
      with Aria Skin and Laser Clinic. To use a different price, change the Contract." and no discount
      field; Sarah Mitchell's Booking shows RVG pricing read-only.
- [ ] **Fixed discount locked.** The fixed-discount Booking shows "10% fixed discount, set by the
      Contract", locked, with no inputs; after capture the Admin total shows the calculated price less
      10% (US-05.4.3).
- [ ] **Own price list.** A Booking of Dr Souter's on her own first-party Contract (or one switched to it
      with 20's Change Contract) shows "Your price list: $1,200.00" and accepts a typed price with a
      reason.
- [ ] **Web parity.** The anaesthetist web app shows the same card, states and copy on the same
      Bookings, in the desktop layout.
- [ ] **Office cannot write the adjustment; the anaesthetist cannot override.** Admin shows the
      adjustment read-only; the phone has no Price override control; `editProcedure` refuses both
      (unit-tested).
- [ ] **Contract change clears it.** On the phone, change the discounted No contract (RVG) Booking's
      Contract to a third-party one: the sheet warns the discount will be removed; after confirming, the
      section turns read-only and History shows the removal.
- [ ] **Review shows the layers.** Admin, Review, Dr Morrison Mon 20 Jul: the adjusted Booking's Fee
      shows the final price with "was $x" and the flag "Discount 10% by Dr Morrison". Open Price
      override: "Calculated" and "After the anaesthetist's 10% discount" show. Apply +$20.00 with a
      reason: the total, Fee cell and flags show both layers.
- [ ] **Invoice shows the layers.** Authorise that List (S2 Beat 4): the payer's invoice shows the fee
      line, "Anaesthetist discount 10%, …", then "Price override, …", reconciling to the total.
- [ ] **Override over a third-party price.** On a Doyle bariatric or Aria Booking the office applies a
      fixed fee override with a reason; the total and invoice show it beside the Contract price.
- [ ] **Contract catalogue.** No contract (RVG) and Dr Souter's own Contract show "Anaesthetist may
      adjust"; a hospital or insurer Contract shows "Price locked for the anaesthetist"; the
      fixed-discount line shows its lock.
- [ ] **Scripted beats unbroken.** S1 Beat 3, S2 Beat 4, the S3 Beat 1 figures, S4 and S5 Beat 1 run as
      scripted.
- [ ] No en or em dashes in new copy; teal on every new action; crimson nowhere new.
- [ ] Catalogue screenshots: every row below is created or updated as it says, every recipe this phase
      broke is re-pointed, a full `npm run capture` ends with no failed recipe and no story without a
      recipe, the covered items' new shots are checked by eye, and `npm run verify:board` is green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots` and `npm run
      verify:board` all green.

## Demo guide updates

In the same session as the change, patch these in `docs/demo-guide/` and the same sections of
`master-demo-guide.html`, as 18 to 23 left them:
- **Session 1:**
  - **`04-presenter-cheat-sheet.md`, "Fee calculation":** add the price order: "Price order: an office
    override; else the anaesthetist's own price (No contract (RVG) and their own Contracts only); else
    the Contract's fixed price (BTM kept for reference); else BTM x the Contract's fixed rate or the
    anaesthetist's unit value, less a fixed discount or the anaesthetist's own. A price of 0 gives a
    no-charge invoice." It replaces the single `Fee = (Base + Time + Modifier units) x anaesthetist's
    own dollar value per unit` formula block (keep that formula as the calculated step only). Drop any
    "rate x time", "hourly", "Method 3" or "Aria hourly" wording; the Aria Contract is "fixed rate,
    $26.50 a unit".
  - **`02-workflows-and-handoffs.md`**, anaesthetist capture step 10: "She may record an allowed fixed
    or rate-by-time line, or an override with a reason." becomes "She may add a fixed billing line,
    except on a fixed-price Contract." (the price half lands in session 2).
  - **`03-demo-script.md`:** grep for "rate x time", "hourly" and "$1,440" and fix any 15 to 23 added
    (none at 60e2d1e).
- **Session 2:**
  - **`03-demo-script.md`:**
    - **S1 Beat 3, "Worth pointing at"** (and the step 9 line "Her Booking shows no units or fee" in
      02): Sarah's Contract is a hospital's, so her price shows read-only and she sees no running fee.
      Add an optional aside: Dr Souter, Mon 27 Jul, the No contract (RVG) Booking; save a 10% discount
      with a reason; then the Aria Booking's locked fixed rate and the fixed-discount Booking's locked
      10%.
    - **S2 Beat 4** (it has no "Worth pointing at" line today; add one): Dr Morrison's discounted
      Booking: its Fee shows "was $x" and its flag names the discount; optionally apply an office
      override live to show both layers, then authorise. Its "Expected" still holds; if the Review
      queue or flags count it quotes moves with the new Booking, fix the figure.
    - **S5 Beat 1:** confirm the History still reads cleanly with the renamed labels.
  - **`02-workflows-and-handoffs.md`:** step 9 "shows no units or fee" becomes "shows no running fee;
    its Price section shows what her Contract allows"; step 10 adds "On No contract (RVG) or her own
    Contract she may type a price or a % discount with a reason; a third-party price shows read-only
    and a fixed discount shows locked."; an office review line "The office can always apply a price
    override, on top of any anaesthetist price or discount."
  - **`01-personas-and-responsibilities.md`:** the office's review responsibilities gain the price
    source, the anaesthetist price and override flags, and the rejections.
  - **`04-presenter-cheat-sheet.md`, "Contracts":** "Anaesthetist price changes: only on No contract
    (RVG) and their own Contracts, a typed price or % discount with a reason; third-party prices
    read-only; a fixed discount shows locked; the office can always override."
  - **`04-presenter-cheat-sheet.md`, "Fee calculation"** bullet "The anaesthetist Booking shows no
    units or fee, only Mark complete" and **`README.md`** (~l.109, "The anaesthetist Booking (Mobile and
    Anaesthetist Web) shows no units or fee"): both become "shows no running fee; its Price section
    shows what the Contract allows (a read-only or locked price, or their own price or % discount on No
    contract (RVG) and their own Contracts)". Grep the four docs and the master guide for any other
    line saying the anaesthetist Booking shows no money at all.
- **Control Panel:** no trigger; update the S2 scenario message in `DemoControlPanel.tsx` only if it
  lists the Review contents.

Not a milestone phase; Phase 25 runs the next master-guide consistency read. Phase 44 re-scripts
these asides into the rewritten run sheet.

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19), run
after the review pass and before the PROGRESS.md entry, at the end of each session for what it
changed. Re-run `node docs/prototype-build/catch-up/tools/recipe-status.mjs 24` first: 19a renames the
US-05.2.6 shot and re-points US-04.2.2 and US-05.2.5 before this phase runs.

**Covered items.** When the phase is done, each recipe in `requirements-board/capture/recipes/`
matches what was built, and every caption below replaces a stale one:

| Item | Recipe at plan time | When this phase is done |
|---|---|---|
| [US-03.5.1](../../../../requirements-board/requirements/stories/US-03.5.1.md) Apply an anaesthetist adjustment (with required reason) | partial · web-adjustment, mobile-adjustment (none, adjustment) | **Captured.** Move off BK0009 (a hospital Contract, now read-only) to `SEED_MARKERS.adjustmentCaptureBooking` (take the id from the built seed). Highlight `price-card`, web and mobile, states: `own-pricing` (No contract (RVG): None, Your price, Discount %), `discount` (10% typed with its reason), `third-party` (the Aria Booking: the price read-only, no discount field), `fixed-discount` (the fixed-discount Booking: locked). Captions in the catalogue's words, replacing "Adjustment and charge" and "Dollar adjustment field": "Own pricing on No contract (RVG): a price or a percentage discount", "A third-party price shows read-only", "A fixed discount shows locked". Drop the partial reason (the prepaid lock is OQ-96's, built in 27; not a gap in this story's criteria). |
| [US-03.5.2](../../../../requirements-board/requirements/stories/US-03.5.2.md) BTM still recorded in full | captured · web-full-discount, mobile-full-discount | Stays captured. Same move to the adjustment capture Booking; a 100% discount with its reason; highlight `units-row-b`, `units-row-m` and `price-card`; caption "Base, time and modifier units stay recorded at a 100% discount, a no-charge invoice". Keep the shot `name`s. |
| [US-05.2.1](../../../../requirements-board/requirements/stories/US-05.2.1.md) Per-unit pricing rate | captured · admin-unit-values, admin-card-fee | Stays captured. Re-shoot `admin-card-fee` with `price-source` in the highlight ("Calculated at Dr {surname}'s unit value"). Keep the shot `name`s. |
| [US-05.2.2](../../../../requirements-board/requirements/stories/US-05.2.2.md) Tiered time units | captured · web-time-units, mobile-time-units | Unchanged (19a's); the `--dry` run is the check. |
| [US-05.2.5](../../../../requirements-board/requirements/stories/US-05.2.5.md) Fixed fee schedule pricing | partial · admin-fixed-price | **Partial**, narrower. Re-shoot the bariatric Booking on the Admin detail with `price-source` ("Contract fixed price $2,800.00") and the BTM rows "for reference"; caption "Booking priced at the Contract's fixed price, units still recorded", replacing the "surgeon's fixed price list" and 19a's "surgeon's Contract line" captions; replace the partial reason (today's "matched fixed price row" text, or 19a's "The price source and the precedence are built in Phase 24.") with "Raising an additional invoice or credit note by hand when the work differed is built in Phases 38b and 39." |
| [US-05.2.6](../../../../requirements-board/requirements/stories/US-05.2.6.md) Fixed rate Contracts | captured · web-rate-time, mobile-rate-time (entry, added) | Stays captured as 19a left it (`fixed-rate`, a Southern Cross Booking at the line's $26.50); add `price-source` ("Fixed rate $26.50 a unit") to its highlight, and add a mobile state `rate-locked` on the Aria capture Booking showing the rate read-only (its "Rate locked" criterion). If 19a did not rename the old `rate-time` shots, they fail now: replace them as 19a's doc says. |
| [US-05.2.7](../../../../requirements-board/requirements/stories/US-05.2.7.md) GST | captured · admin-invoice-gst | Stays captured (INV0001 is not an Aria or adjusted invoice); the `--dry` run is the check. |
| [US-05.4.1](../../../../requirements-board/requirements/stories/US-05.4.1.md) Apply anaesthetist adjustment | partial · web-adjustment, mobile-adjustment (entry, applied) | **Captured.** Same move to the adjustment capture Booking: `entry` (a typed price or 10% discount with its reason), `applied` (the saved read-only line, no money on the anaesthetist screen). Replace "Adjustment applied, the Booking total shows the fee before it" with "Adjustment applied; the fee before it is kept for the office". Add `admin-adjustment-layers` on `SEED_MARKERS.adjustedBooking` with `booking-total-layers` and `review-adjustment-flag` on `/admin/review/<that List>`. Drop the partial reason. |
| [US-05.4.2](../../../../requirements-board/requirements/stories/US-05.4.2.md) Office price override | captured · admin-price-override (entry, applied) | Stays captured. Move off BK0009 to `SEED_MARKERS.adjustedBooking` so the "After the anaesthetist's 10% discount" context line shows; highlight `office-override-sheet`; the sheet is "Office price override". Keep the shot `name`s. |
| [US-05.4.3](../../../../requirements-board/requirements/stories/US-05.4.3.md) Fixed discount Contracts | none (create it) | **Create, captured.** Mobile and web `fixed-discount` on `SEED_MARKERS.fixedDiscountBooking`: `price-card` in its locked state, caption "A Contract's fixed discount, shown applied and locked"; admin `fixed-discount-total` on the same Booking after capture (seed or recipe steps), highlight `booking-total-layers`, caption "Priced at the anaesthetist's unit value less the Contract's 10% discount". |
| [US-04.2.2](../../../../requirements-board/requirements/stories/US-04.2.2.md) Contract pricing terms | captured · admin-pricing-basis (type-1, type-2, type-3, rate-time) | **Captured** (Verify item; the shot shows what was built). Every Type 1/2/3 and rate x time caption goes. 19a renamed `type-1`, `type-2` and `type-3` to `rvg`, `fixed-rate` and `fixed-price` on its lines grid and kept `rate-time` for this phase: drop `rate-time` ("Contract permitting an individually arranged rate times time"); keep 19a's three states (check with `--dry`; if 19a did not rename them, do it here as its doc says, replacing the Type captions); add `fixed-discount` (the seeded fixed-discount Contract's lines grid with its locked 10%; caption "A Contract line with a fixed discount, shown locked to the anaesthetist"), `adjustable` (No contract (RVG) or Dr Souter's own Contract with "Anaesthetist may adjust"; caption "No contract (RVG) and the anaesthetist's own Contracts are adjustable"), `locked` (a third-party Contract with "Price locked for the anaesthetist"), and a mobile `third-party-read-only` on the Aria Booking. Drop 19a's partial reason. |

**Recipes this phase breaks.**
- **Retired recipes still run**, and a merged story keeps showing the retired item's images:
  - `US-03.3.7` (Retired, rate x time, merged into US-03.3.6) clicks the hourly option on Heather
    Sinclair's Booking. Set it `absent` ("Retired. The hourly line was removed in Phase 24.") and remove
    its `web-rate-time.png` and `mobile-rate-time.png` entries from US-03.3.6's `images` list (an images
    edit, as the capture step makes; no text or status change).
  - `US-03.5.3` (Retired, merged into US-03.5.1) clicks "Adjustment $" in
    `capture-adjustment-and-charge` on BK0009; US-03.5.1 still shows its four shots. Re-point it to the
    adjustment capture Booking with Discount %, 10 and the reason, highlight `price-card`, keep the shot
    `name` and the `required` and `saved` state names so US-03.5.1's image paths resolve, and re-caption
    "A reason is required before the price can be saved" and "Discount saved with its reason".
  - `US-05.2.4` (Retired, merged into US-05.2.1): its `admin-contract-rate` shot (BK0031, "$24 per unit
    instead of Dr Rutherford's $32") is now a fixed-rate line; add `price-source` to its highlight,
    keep the name, check with `--dry`.
  - `US-03.3.5` (Retired) scrolls to `capture-adjustment-and-charge`; re-point to `price-card` unless
    19b already removed or re-pointed it.
- `US-03.3.6` shoots Add billing line on BK0009; the sheet loses its hourly option; `--dry` is the check
  (move it if BK0009's Procedure is now on a fixed price, where the sheet is not offered).
- `US-07.2.3` opens the override sheet by "Price override" and clicks `"$ adjust"`: check the dialog
  heading and its `text=/Office billing setup/` ancestor after item 11 adds the Anaesthetist's price
  row, and the Review counts after item 13's Booking.
- Any recipe shooting the admin Booking total or the Review Fee cell (`US-05.2.1`, `US-05.2.5`,
  `US-05.3.5` and others using `card-calculation`) gains the price-source pill; `--dry` is the check.

**ATLAS.md.** Update Seed data (the Aria fixed-rate Contract and Fitzgerald's re-expressed Booking, the
Mon 27 Jul state Bookings, the fixed-discount Contract, the adjusted Review Booking), Personas and IDs
(`fixedRateBooking`, `fixedRateCaptureBooking`, `fixedRateContract`, `adjustmentCaptureBooking`,
`fixedDiscountContract`, `fixedDiscountBooking`, `adjustedBooking`; the `rateTime*` and
`individualArrangementContract` markers removed) and Existing hooks (`price-card` and its states,
`price-source`, `booking-total-layers`, `review-adjustment-flag`, `office-override-sheet`,
`contract-adjustable-pill`; `capture-adjustment-and-charge` removed).

## Adversarial review (after build)

Run the standard pass (PROGRESS convention 18) at the end of each session, after the manual test
checklist and `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots` are green, and
before the PROGRESS entry. Fan out three Opus review subagents (quality; bugs and money correctness;
plan and catalogue adherence), independently verify every finding against the catalogue and the code,
fix the confirmed ones and re-green, and record the pass. Do not re-raise what the Decisions log
settles.

**Steer this phase's reviewers at:**
- **One place.** The precedence, `isAdjustable`, `adjustmentAllowed`, the rejections and the price
  source live in `src/domain/billing/pricePrecedence.ts`; no surface tests the party type or re-derives
  a rate, discount or source; 20a's selector reads the recorded source.
- **The order and the arithmetic.** Exactly: validation, then typed price, else fixed price, else
  calculated (fixed rate or unit value, less one discount, rounded once), then the office override.
  W1 to W12 and G2 hold; the invoice delta lines reconcile to the cent.
- **Rejects, never ignores.** A typed price or discount on a non-adjustable Contract or a
  fixed-discount line, missing times with no fixed price, a Contract not in force, a lined Contract with
  no line for the procedure, a billing line on a fixed price: each is a named rejection, surfaced at
  completion, in Review and in the billing run. No silent BTM fallback survives.
- **The gate is in the store, not just the UI.** `setAnaesthetistAdjustment` refuses where not allowed;
  `editProcedure` writes neither layer; the anaesthetist cannot write `officeOverride`; the office
  writes no adjustment except to clear a disallowed one.
- **What the anaesthetist sees.** The price field per the Contract (read-only, locked, own price list,
  or editable), never a calculated total; a third-party price has no discount field and no disabled
  input pretending to be one.
- **US-03.5.2 and the no-charge invoice.** A 100% discount or $0 price leaves B, T and M,
  `billableUnits` and the audit intact and raises a $0.00 "No charge" invoice with no payable; a group
  netted to 0 by a prepayment raises none.
- **The hourly line is gone everywhere**, no stale marker; Aria prices on its fixed-rate line.
- **No regressions.** The parity fixture is identical apart from the two Aria Bookings; US-05.2.6's
  fixed rates, the bariatric fixed prices, GST and the office override on every Contract are unchanged;
  22's split is unchanged where no layer applies; `PERSIST_VERSION` is bumped in each session that
  changed the seed; the generator and canvas are untouched.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry; ROADMAP.md "Owner review: agents test
  themselves"), each with its route and persona where it is a screen:
  - US-04.2.2 and US-03.5.1 are Verify: built as written, still to be walked through;
  - OQ-89's open part (D40): no anaesthetist price or discount on a fixed-discount line, one constant;
  - the adjustable rule derived from No contract (RVG) and the holder's party type (where the setting
    lives is open in AR-29);
  - the anaesthetist's % discount on their own fixed price applies to that price (AR-28's table over
    AR-29's formula);
  - should the anaesthetist see the calculated price before and after their discount (drift check 3);
  - whether reasons should print on customer invoices;
  - the no-charge invoice raises no payable and no BCTI, with a $0.00 Xero ACCREC;
  - a billing line on a fixed-price Procedure is refused rather than added, and a lined Contract with no
    line for the procedure is a rejection;
  - the domain model's "applied after BTM is recorded in full", built as the engine's rejection, not a
    field gate;
  - on a fixed-price Procedure the start and handover times are offered and recorded but no longer
    required to complete (only `btmMissing` demands them, when no fixed price resolves);
  - Fitzgerald's new Aria figure, and the seeded fixed-discount Contract (demo values).
- **Status row** for Phase 24 and a phase entry (one per session, or one with a section each): the
  drift-check result against 60e2d1e (OQ-89, OQ-96 and OQ-90 status); `PERSIST_VERSION` from and to;
  the real names (`priceProcedure`, `isAdjustable`, `adjustmentAllowed`, `PriceSource`, the store
  actions, `PriceCard`); the Aria figures before and after; the parity result; the tests added; the
  review pass; the catalogue screenshot result (`capture/REPORT.md` counts before and after).
- **Decisions log:** the entries in work item 17.
- **Handoff notes:**
  - **25:** snapshot per Procedure the price source, `contractPrice`, `afterAdjustment`,
    `beforeOverride`, `total`, the rate and its origin, the discount and its origin, the adjustment
    with its reason and author and the `adjustmentAllowed` result it was applied under, and the office
    override; price only from the snapshot; "Regenerate from locked data" must reproduce both delta
    lines and the no-charge invoice.
  - **27:** add the prepaid lock (OQ-96, D30) as one more branch of `adjustmentAllowed`; a prepaid
    Procedure's price is the prepaid amount; a group netted to 0 by the deduction raises no invoice,
    unlike a no-charge price.
  - **36:** ledger legs carry the final price; a no-charge invoice has a receivable leg at $0.00 and no
    payable leg.
  - **38b and 39:** additional invoices and credit notes carry neither layer; a credit and rebill
    copies the original's lines including the delta lines.
  - **39b:** the billing-line sheet offers the fixed amount only and is not offered on a fixed-price
    Procedure; US-03.3.7's recipe is absent and its two hourly images are gone from US-03.3.6; the
    calculated step's exported helper (name as built) is the one to reuse for time-priced events.
  - **43a:** keep the anaesthetist's Price section and the read-only and locked states the catalogue
    gives them; strip only office-only wording.
  - **44:** re-script the S1 Beat 3 aside and the S2 Beat 4 note into the rewritten run sheet.
