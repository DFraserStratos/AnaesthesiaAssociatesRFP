# Phase 19a · Contract lines and the starting-units resolver

**Requirements covered:**
[FT-04.2](../../../../requirements-board/requirements/stories/FT-04.2.md) Contract definition (Verify) ·
[US-04.2.4](../../../../requirements-board/requirements/stories/US-04.2.4.md) Contract lines (Verify) ·
[US-04.2.14](../../../../requirements-board/requirements/stories/US-04.2.14.md) Anaesthetist's own fixed-price Contracts (Confirmed) ·
[US-05.2.2](../../../../requirements-board/requirements/stories/US-05.2.2.md) Tiered time units (Confirmed) ·
[DM-09](../analysis/domain-model-delta.md#dm-09) a Contract line (one per procedure, carrying only what it sets) replaces ContractPrice ·
[DM-43](../analysis/domain-model-delta.md#dm-43) starting units resolve through the Contract line, the procedure, then the RVG group ·
[RV-34](../analysis/reverse-check.md#rv-34-contract-specific-second-procedure-pricing-type-3-price-rows-keyed-by-procedure-ordinal) the procedure-ordinal price key goes.
Carried across without regression (they Match today only through the old model, ROADMAP.md
"Old-model matches are carried across"):
[US-05.2.6](../../../../requirements-board/requirements/stories/US-05.2.6.md) fixed rate Contracts
(today Type 2's `agreedUnitRate`),
[US-05.2.5](../../../../requirements-board/requirements/stories/US-05.2.5.md) the fixed price as the
whole price (today Type 3's matched row),
[US-05.2.1](../../../../requirements-board/requirements/stories/US-05.2.1.md) and
[US-05.2.7](../../../../requirements-board/requirements/stories/US-05.2.7.md) (prices held ex GST,
GST at the invoice foot). Each gets a parity test (work item 1).
Answered and built as answered:
[OQ-91](../../../../requirements-board/requirements/questions/OQ-91.md) (D42: the office creates and
keeps every first-party Contract from the anaesthetist's price list; anaesthetists never edit
Contracts), [OQ-75](../../../../requirements-board/requirements/questions/OQ-75.md) (D25: a part
interval always rounds up under the RVG tiers, applied to recorded time only),
[OQ-62](../../../../requirements-board/requirements/questions/OQ-62.md) (D12 and D3 as superseded on
2026-10-08: base units on the RVG group, a procedure may set its own, a Contract line may override
both; any value accepted) and
[OQ-48](../../../../requirements-board/requirements/questions/OQ-48.md) (D45: the procedure date
decides the Contract version in force).
Open, built as their default and kept in one place:
[OQ-89](../../../../requirements-board/requirements/questions/OQ-89.md) (D40: no time band on a line;
whether an anaesthetist may discount on top of a fixed discount is Phase 24's) and
[OQ-98](../../../../requirements-board/requirements/questions/OQ-98.md) (D32: a holder's plain RVG
Contract has no lines and applies to every procedure at RVG pricing), with
[OQ-101](../../../../requirements-board/requirements/questions/OQ-101.md) (D35, Phase 19's default:
the group holds a starting figure and the printed range) read, not changed.

**Re-planned 2026-10-08 (catalogue `60e2d1e`).** This phase was "Default RVG Contracts hold the base
units". Default RVG Contracts are Retired with the rest of the default-Contract model (FT-04.4,
US-04.4.1, US-04.4.2; D12 and D16 superseded; OQ-78 answered), so everything built on them is out of
this plan: the generated per-procedure default RVG Contracts and their per-kind pair, the Contract
base-unit override list keyed by procedure, code or group, the "Default RVG Contracts" view and
sheet, the Contract procedure scope with its derivation from schedule lines, `scope.rvgGroups` and
`scopeCoversProcedure` (Phase 20 offers a Contract when it has a line for the procedure, D16), and the
OQ-78 provisional badge. In their place the phase builds the catalogue's Contract lines, the line
layer of the one resolver, the anaesthetists' own price lists and the time tiers as data. The file
keeps its historical name (`default-rvg-contracts`), pinned by the plan tools.

**Depends on:** Phase 18 (contract holders, third or first party, with "holder is billed", billable
party and anaesthetist; Contracts as dated versions with the new-version flow, the AA code and its
generator, composite search, the active and holder filters, office-only editing; one stored No
contract (RVG); Type 1/2/3 gone as categories with **the Type 2 rate or discount terms and the Type 3
price rows kept in place** as 18's interim terms (`interimTerms`, read through `interimTermsOf`,
`type2Detail` and the `ContractPrice` rows), today's selection and the route unchanged; Doyle's
bariatric Contract as two versions (`CT-DOYLE-BAR` to 27 Jul with `CP-BAR-1` to `CP-BAR-3`, and the
upcoming `CT-DOYLE-BAR-2` from 28 Jul with `CP-BAR-4` to `CP-BAR-6`, gastric bypass $2,950); the
**started-version freeze** (`termsLocked`: a version's terms cannot change once it has started; a
price review is a New version); and the fee parity harness) and Phase 19 (RVG groups under body
sections with base and modifier units, a starting figure and the printed range; the curated
procedure list (`ProcedureType`, keyed `procedureTypeId`, because `procedureId` already names a
booking Procedure), each procedure in exactly one group with an optional own figure, and a general
procedure per group; the one starting-units resolver `resolveStartingUnits` reading the procedure and
the group; the price rows re-keyed by `procedureTypeId`, ordinal kept; the two-tab picker; the
out-of-range office warning). Through them: 17, 16, 15b, 15a (the warning routine) and the built 14
and 15.
**Estimated:** 2 sessions. Session 1: work items 1 to 6 (baseline, the line type and pure helpers,
the seeded terms moved onto lines with the ordinal key gone, the resolver's line layer, the fee path
re-expressed), ending green with the parity fixture unchanged. Session 2: work items 7 to 13 (store
actions, the anaesthetists' own price lists, the Admin lines grid, capture captions, the time tiers
as data with the stale rounding copy, Playwright, demo guide) and the review pass. If session 2 runs
long, cut the Review screen's line pill (item 10c) before any store, seed or grid work.

**Confirm before building.** FT-04.2 and US-04.2.4 are Verify (Greg is reviewing the draft design
and updating his own model). The draft technical design v4 is the reference shape and may become a
v5: keep the line type, the resolver and the fee path in **one place** in
`aa-prototype/src/domain/billing` (plus the seed), behind types the UI reads, so a design change is a
contained edit. OQ-91 and OQ-75 are answered and carry no label. OQ-98's default carries the phase's
one provisional label (the empty lines state, item 9b); OQ-89's default (no time band) needs no
label because nothing is shown for it.

## Goal

Replace the Contract-wide pricing terms with the catalogue's **Contract lines**, give the one
resolver its **line layer**, give each anaesthetist who prices their own work an **own fixed-price
Contract kept by the office**, and make the **RVG time tiers data**, with no demo figure moving.

- **Contract lines** (DM-09, FT-04.2, US-04.2.4;
  [AR-29#contract-line-fields](../../../../requirements-board/requirements/artifacts/AR-29.md),
  [AR-30#contract-line](../../../../requirements-board/requirements/artifacts/AR-30.md)). At most one
  line per procedure per Contract version, holding only what it sets, every pricing field nullable:
  a **fixed price** (ex GST, the whole price; BTM recorded for reference), a **fixed rate** (a unit
  rate in place of the anaesthetist's), a **fixed discount** (a percentage off the calculated price),
  **base units** and **modifier units** (blank inherits, 0 is a value,
  [AR-29#null-handling](../../../../requirements-board/requirements/artifacts/AR-29.md)), plus the
  holder's own code and description for reference and search. No group lines (none are known; the
  draft keeps them dormant), no RVG mapping (every procedure has its group), no add-on flag, quantity
  rule, price tier or line dates (lines share their Contract version's dates, Phase 18), and no time
  band (OQ-89's default, D40). A combination Contract will have a line under each parent procedure
  (Phase 23); the line shape needs nothing more for it.
- **The Type 2 and Type 3 terms move onto lines.** Every seeded Type 3 price row and every Type 2
  rate becomes a line on the procedures it priced. The procedure-ordinal key goes (RV-34): the
  bariatric second-procedure row becomes a plain line on its own procedure, and whether a second
  procedure prices differently is OQ-90 (Phase 23). US-05.2.6's fixed rate is carried across with a
  parity test. The draft design keeps rate and discount dormant
  ([AR-29#dormant-capabilities](../../../../requirements-board/requirements/artifacts/AR-29.md));
  the catalogue makes them live (US-05.2.6, US-05.4.3), so both are modelled and priced now.
- **Plain RVG Contracts** (OQ-98's default, D32): a holder's Contract with no lines applies to every
  procedure at RVG pricing (the anaesthetist's unit value), billed as its holder decides. One pure
  predicate says so, for Phase 20's picker.
- **The anaesthetists' own fixed-price Contracts** (US-04.2.14, OQ-91 answered, D42;
  [AR-28#contracts-two-kinds](../../../../requirements-board/requirements/artifacts/AR-28.md)): a
  first-party holder per anaesthetist who prices this way, and a Contract whose lines give a fixed
  price per procedure (for example Dr B. Smith, Face lift, $3,200), created and kept by the office
  from the price list the anaesthetist supplies, never edited by an anaesthetist. Dr Souter's price
  list is seeded, covering her prepaid procedures, so Phases 26 and 27 have prepaid amounts. Offering
  it only on her own Bookings is Phase 20's; the anaesthetist's price change with a reason is 24's.
- **One resolver, now with the line layer** (DM-43;
  [AR-29#resolver-layers](../../../../requirements-board/requirements/artifacts/AR-29.md)). For the
  Procedure's procedure and its Contract (the version in force on the procedure date), base and
  modifier starting units come from the first layer that sets them: the Contract's line for the
  procedure, then the procedure, then its RVG group. The fixed price, rate and discount come from the
  line only. Each value is returned with the layer it came from, for capture's captions, Review and
  Phase 25's snapshot. It re-runs whenever the procedure or the Contract changes. Capture shows the
  starting values and still accepts any value (D3).
- **The pure fee path prices from the line**, with today's arithmetic re-expressed: the line's fixed
  price; else BTM x the line's fixed rate or the anaesthetist's unit value, less any fixed discount.
  Parity tests hold every S3, S4 and S5 figure. Phase 24 adds the full precedence (the office
  override and the anaesthetist's typed price as layers, the price source, the engine rejections and
  the adjustment).
- **Tiered time units become data** (US-05.2.2). OQ-75 is answered: a part interval always rounds up,
  15 minutes for the first two hours, then 10. There is no prepayment estimate any more, so the rule
  applies to recorded time only (D25). The stale "assumption" caption, the Control Panel callout and
  the matching demo-guide lines go.
- **The Admin Contract editor gets a lines grid**: one row per line, each field inherit or override,
  the inherited value shown greyed (what shows through from the procedure or the group), as the draft
  asks. Lines are the version's terms, so 18's started-version freeze holds them: a started version's
  lines are read-only, and the office changes them through New version, which copies the lines
  (domain model "version": "its lines copied from the old and then changed";
  [AR-29#contract-versions](../../../../requirements-board/requirements/artifacts/AR-29.md)).

Keep the line type, its validation, the resolver and the fee path in **one place** in
`src/domain/billing` (beside the pricing-model module Phases 18 and 19 started) plus the seed, behind
types the UI reads. The plain-language guide
([AR-28#contracts-two-kinds](../../../../requirements-board/requirements/artifacts/AR-28.md) and
[#worked-examples](../../../../requirements-board/requirements/artifacts/AR-28.md)) is true as
written; AR-29 and AR-30 are a draft a v5 may change.

No figure in the S1 to S5 run sheet moves. Any seeded figure that does move is listed by exact amount
in the parity test and PROGRESS (none is expected; see item 1).

## Before you start: drift check

1. Run `node docs/prototype-build/catch-up/tools/plan-state.mjs --diff <IDs>` (baseline `60e2d1e`)
   for FT-04.2, US-04.2.4, US-04.2.14, US-05.2.2, US-04.2.2, US-04.2.10, US-04.2.11, US-04.1.5,
   US-04.3.2 (the offering that reads lines, Phase 20), US-05.1.1, US-05.1.6, US-05.2.1, US-05.2.5,
   US-05.2.6, US-05.2.7, US-05.4.3, US-03.3.1, US-06.2.2 (the prepaid amount from the first-party
   Contract), OQ-89, OQ-91, OQ-98, OQ-101, OQ-75, OQ-48 and OQ-90. Re-read the domain model's
   "Contract (draft structure)" section (the Contract holder, Contract and **Contract line** tables
   and the "Selection" paragraph), section 3 "Calculation rules" and the glossary's "Contract line".
   If an item changed, re-read it whole and adjust the work items; if one is now Retired or Future,
   drop its work and say so in the PROGRESS entry. Also check whether AR-29 has a v5 (a new artifact
   or a changed `AR-29.md`): if so, follow v5's line fields and resolver layers inside the same one
   place and log the difference.
2. Confirm the gates.

| Gate | Build | If answered differently |
|---|---|---|
| **D42 / OQ-91** (answered 2026-10-08) | The office creates and keeps every first-party Contract from the anaesthetist's price list; no anaesthetist write path. No label | Not expected |
| **D25 / OQ-75** (answered; superseded in part) | Part intervals always round up, 15 minutes for two hours then 10, held as data; recorded time only (no estimate). No label | A different interval or boundary is a data change in the seeded rule only |
| **D3, D12 / OQ-62** (superseded 2026-10-08) | Starting base units from the line, then the procedure, then the group; any value accepted, out-of-range warns the office (19's rule) | Not expected |
| **D45 / OQ-48** (answered) | The resolver reads the Contract version in force on the procedure date (18's selection); lines share their version's dates | Not expected |
| **D40 / OQ-89** (open: time band; a discount on top of a fixed discount) | No time band field on a line; a code comment on the line type names OQ-89. The stacking question is Phase 24's. No UI label | If the time band stays, add one nullable band to the line type and one matching step in the resolver, in this module only |
| **D32 / OQ-98** (open: plain RVG Contracts of a holder) | A Contract with no lines applies to every procedure at RVG pricing; `isPlainRvgContract` is the one predicate; "Provisional" only on the editor's empty lines state | A line per procedure or per group instead: the predicate and the seed change, nothing in the fee path |
| **D35 / OQ-101** (open, Phase 19's default) | Read 19's group starting figure and range; a line or procedure figure is one number | If a range moves onto lines, the line's base field widens in this module only |
| **FT-04.2, US-04.2.4** (Verify) | Build as written, to the draft's line shape | Adjust to the verified text; a v5 design change stays inside the one module |

3. Read what Phases 15a to 19 actually built (their PROGRESS entries); names below are as planned,
   so follow what they left. Confirm in particular:
   - from 18: the Contract and contract-holder types and where they live, the holder's party (third
     or first), "holder is billed", billable party and anaesthetist fields, how versions are held
     (one row per version, the previous-version link, the new-version action that copies terms,
     `termsLocked` and its refusal sentence), Doyle's two seeded versions and their rows, where the
     **Type 2 rate or discount terms** and the **Type 3 price rows** (`interimTerms`, `interimTermsOf`,
     `type2Detail`, `ContractPrice` or the names 18 gave them) now sit, the AA code generator, the
     composite search helper (`contractMatchesQuery`, `contractSearch`) and the holder
     filter, No contract (RVG) and how it is found (the flag, never the name), any third-party
     Contract 18 left with no price terms (a plain RVG Contract), the protected-delete and office-only
     guards in `contractActions.ts`, the Contract catalogue, detail panel and editor sheet, and
     `feeParity.test.ts` with its `__parity__/` fixtures;
   - from 19: the RVG group and procedure types (ids, system codes, the group's base and modifier
     units, its starting figure and range, the procedure's optional own figure, the general
     procedure per group; 19 planned `ProcedureType` and `procedureTypeId`), how a seeded Procedure
     links to its procedure, the one resolver's name, signature, layer names and output (19 planned
     `resolveStartingUnits({ procedureType, group })` in `startingUnits.ts` with layers `'procedure'`
     and `'rvgGroup'`, and `baseUnitsFor` with sources `'overridden' | 'chosen' | 'procedure' |
     'rvgGroup' | 'none'`; its handoff names the new layer `'contractLine'` with a `line?` input),
     how 19 re-keyed the price rows by `procedureTypeId` (ordinal kept), `BtmBreakdown`'s source
     fields, the out-of-range rule and its warning sample, the two-tab picker, the procedure delete
     guard, `procedureTypesInGroup`, and the RVG groups tab where the time-rule panel will sit;
   - from 15a: how a warning rule reads its facts.
4. Record the current `PERSIST_VERSION` (16 at `b342a7d`; 15b to 19 will have bumped it).

## Reference

**Design (convention 17).** No mockup covers Contract editing. Extend the Admin Review page's table
anatomy (`docs/design/Admin Review.dc.html`: header row, mono data cells, status pills, row actions)
and the Contract editor and detail panel as 18 left them. Capture captions stay on
`docs/design/Mobile App.dc.html` screen 3 (the code card and the units card) and its web twin in
`Web Dashboard.dc.html`. Tokens, pills, the inherited-value grey (the neutral text tokens) and the
provisional badge style come from `Design Language.dc.html`. Teal is the only action colour; layer,
holder and "Provisional" markers are neutral pills, never crimson.

**Catalogue.** The files linked above, plus
[US-04.2.2](../../../../requirements-board/requirements/stories/US-04.2.2.md) (the line terms and
the adjustment rule; closes in 24),
[US-04.1.5](../../../../requirements-board/requirements/stories/US-04.1.5.md) (contract holders, 18),
[US-04.2.10](../../../../requirements-board/requirements/stories/US-04.2.10.md) (versions; lines are
copied into a new version),
[US-04.2.11](../../../../requirements-board/requirements/stories/US-04.2.11.md) (combination
Contracts, 23),
[US-04.3.2](../../../../requirements-board/requirements/stories/US-04.3.2.md) (offering by line, 20),
[US-05.1.1](../../../../requirements-board/requirements/stories/US-05.1.1.md) and
[US-05.1.6](../../../../requirements-board/requirements/stories/US-05.1.6.md) (the group and
procedure layers, 19),
[FT-05.2](../../../../requirements-board/requirements/stories/FT-05.2.md) (the price order, 24),
[US-05.4.3](../../../../requirements-board/requirements/stories/US-05.4.3.md) (the fixed discount's
locked display, 24) and
[US-06.2.2](../../../../requirements-board/requirements/stories/US-06.2.2.md) (the prepaid amount,
27).

**Artifacts (link these spots; do not edit the artifacts).**
- [AR-28](../../../../requirements-board/requirements/artifacts/AR-28.md) (the plain-language guide,
  true as written): `#contracts-two-kinds` (third party and first party), `#worked-examples`.
- [AR-29](../../../../requirements-board/requirements/artifacts/AR-29.md) (draft technical design
  v4; file `artifacts/files/Contract pricing model - technical design v4.pdf`):
  `#contract-line-fields` (the line, every pricing field nullable), `#resolver-layers` (layers,
  first value wins; base and modifier units through every layer, price terms from the line only),
  `#null-handling` (null inherits, 0 is a value, the editor's inherit or override choice),
  `#dormant-capabilities` (rate and discount kept dormant by the draft, live here),
  `#contract-versions` (a new version copies its lines), and for context `#contract-fields` (FT-04.2's
  link), `#contract-holder-fields` (the first-party holder) and `#integrity-rules` (at most one line
  per contract per target).
- [AR-30](../../../../requirements-board/requirements/artifacts/AR-30.md) (the ERD): `#contract-line`,
  with `#procedure` and `#rvg-group` beneath it and `#contract` above it.
- [AR-01](../../../../requirements-board/requirements/artifacts/AR-01.md) `#starting-values`
  (US-04.2.4's link: where starting values come from), AR-28 `#what-the-anaesthetist-can-change`
  (US-04.2.14's link; the price change itself is Phase 24's),
  [AR-02](../../../../requirements-board/requirements/artifacts/AR-02.md) `#first-party` and
  [AR-16](../../../../requirements-board/requirements/artifacts/AR-16.md) `#time-units` (the RVG's
  own time rule), as the catalogue items link them.

**Analysis.** `../GAP-ANALYSIS.md` sections "EP-04 · Contracts" (FT-04.2, US-04.2.4, US-04.2.14) and
"EP-05 · RVG master data and fee calculation rules" (US-05.2.2, US-05.2.6), the DM-09 and DM-43 rows
of "Structural changes (data model)" and the RV-34 row of "Prototype behaviour to remove or rework".
`../epics/EP-04.md` (FT-04.2, US-04.2.4, US-04.2.14) and `../epics/EP-05.md` (US-05.2.2, US-05.2.6).
`../analysis/domain-model-delta.md` `#dm-09` and `#dm-43` (with DM-07, DM-13 and DM-50 for context)
and `../analysis/reverse-check.md` RV-34 (and RV-17, the stale "assumption" copy).
`../analysis/prototype-map-domain.md` (billing maths), `prototype-map-shared.md` (capture suite),
`prototype-map-admin.md` section 9 (Master data) and `prototype-map-store-seed.md`.

**Code entry points (at `60e2d1e`, before 18 and 19; follow what they left).**
- Types: `src/domain/types.ts` `ContractType2Detail` (about 212), `Contract.type2Detail` (240),
  `ContractPrice` (250 to 258, with `rvgBaseCode?`, `surgeonId?`, `procedureOrdinal?`, `price`),
  `Procedure.baseUnitsSelected`, `baseUnitsCaptured`, `governingContractId`.
- Price matching and selection: `domain/billing/contracts.ts` `matchContractPrice` (most specific
  wins, 77), `selectContract`, `isEffectiveOn`.
- Fee: `domain/billing/fee.ts` `FeeContext` (`contractPrices`, `surgeonId`, `procedureOrdinal`),
  `feeFor` (the Type 2 rate branch at about 188 to 196 with the per-unit cents rounding of a percent
  discount, the Type 3 match and the additional-procedure discard rule at 198 to 217), `resolveBtm`
  (19 delegates its base branch to its resolver).
- Time units: `domain/billing/timeUnits.ts` (`PARTIAL_INTERVAL_ROUNDING`, the `TIER1_*` and
  `TIER2_INTERVAL` constants, the ASSUMPTION header, `timeUnitsFromMinutes`, `timeUnits`), read by
  `fee.ts` `resolveBtm` (76). Tests: `timeUnits.test.ts`.
- Every reader of the price rows and Type 2 terms (grep `contractPrices`, `ContractPrice`,
  `type2Detail`, `interimTerms`, `procedureOrdinal`, `matchContractPrice`): `validateBookingForBilling.ts`
  (`feeContextFor`), `invoiceBuild.ts`, `shared/capture/feeContext.ts` (`procedureFee`),
  `shared/booking/BookingDetailBody.tsx`, `store/selectors.ts`, `store/index.ts`,
  `store/contractActions.ts` (`addContractPrice`, `editContractPrice`, the price-above-zero
  refusal at about 205), `shared/audit/fieldLabels.ts`, `domain/seed/billing.ts` (`contextFor`),
  `domain/seed/index.ts`, `domain/seed/contracts.ts`, `apps/admin/flows/ContractEditSheet.tsx`
  (`PriceRows` with "Any code" and the ordinal input, about 225 to 322; the Type 2 rate field, 184),
  plus `apps/admin/reviewFlags.ts` `naturalBtm` and `store/billingLineActions.ts` (grep `feeFor(`).
  Tests: `contracts.test.ts`, `fee.test.ts`, `invoiceBuild.test.ts`, `prePaymentInvoice.test.ts`,
  `validateBookingForBilling.test.ts`, `billingRun.test.ts`, `btmCapture.test.ts`,
  `mastersActions.test.ts`, `seed.test.ts`.
- Seed: `domain/seed/contracts.ts` (`CONTRACT`, `CONTRACTS`: SXAP $26.50, Health NZ $23, St
  George's ACC $25, COS ACC $24 and Aria $26.50 as Type 2 agreed unit rates, no seeded percent
  discount; `CONTRACT_PRICES`: CP-BAR-1 20880 $2,800, CP-BAR-2 20882 $2,400, CP-BAR-3 49120
  ordinal 2 $950), `domain/seed/bookings.ts` (`DEFAULT_CONTRACT_BY_HOSPITAL` at 118 puts every
  generated Southern Cross Booking on SXAP and every Christchurch Public one on Health NZ; the
  bariatric Booking at about 685; Souter's prepaid Bookings: Riley, "Rhinoplasty, self funded" at
  about 828, and Nair's "Rhinoplasty, cosmetic component" 41800 at about 911), `domain/seed/cast.ts`
  (Souter, unit value $26.50).
- Capture: `shared/capture/UnitsCard.tsx` (the T caption "From start / finish stamps · part
  intervals round up (assumption)" at 68; the B caption from 19's source), `ProcedureCodeCard.tsx`
  (19's "Base N units · from ..." line).
- Demo surface: `apps/demo/DemoControlPanel.tsx` 209 to 231 (the "Billing assumption" callout).
- Admin: `apps/admin/screens/MasterData.tsx` (18's Contracts tab, 19's RVG groups and Procedures
  tabs), `apps/admin/flows/ContractEditSheet.tsx`, `apps/admin/screens/ReviewScreen.tsx` (the
  B · T · M cell).
- Store: `store/contractActions.ts`, `store/mutate.ts` `allocateId` and `ID_FORMATS`,
  `store/appStore.ts` `PERSIST_VERSION`.
- Playwright: `visual/admin-phase07.spec.ts` (`a7-04-masters`), `admin-phase08.spec.ts`,
  `mobile-phase04.spec.ts`, `booking-calculation-display.spec.ts`, `demo-actions.spec.ts` (the
  Control Panel page). `src/pwa/pwaPurity.test.ts` must stay green.

## Work items

Model, domain and seed first, then store, then UI. Every new write goes through `mutate()` with an
audit meta. Every rule is a pure function in `src/domain/billing/` with a Vitest test. No new seed data
draws from the seeded RNG. One `PERSIST_VERSION` bump for the phase.

**Session 1: lines, the terms moved onto them, the resolver and the fee path.**

1. **Baseline the figures (before any edit).** Add `phase-19a-baseline.json` beside 18's and 19's
   fixtures in `domain/billing/__parity__/`, generated from the untouched code at the start of the
   phase: every seeded Procedure's `feeFor` total, its B, T and M units and its charge lines, and every
   seeded invoice total from `buildSeed()`. Add **named cases** so a regression names the beat it
   breaks:
   - each scripted Booking S2 to S5 (find them through the scenario markers in `seed/index.ts` and the
     run sheet: Ellison and Holt in S3, the S4 prepaid and billing-failure Bookings, the S5 Health NZ
     beat's Bookings);
   - the carried-across matches: a Southern Cross design-day Booking at $26.50 a unit and a Health NZ
     Booking at $23 (US-05.2.6, fixed rate regardless of the anaesthetist's unit value), the COS ACC
     $24 and St George's ACC $25 Bookings, the bariatric Booking ($2,800 + $950, GST $562.50: US-05.2.5,
     US-05.2.7), and a No contract (RVG) Booking at the anaesthetist's own value (US-05.2.1).
   Never regenerate with `-u`. At the end the fixture is identical. The only seeded case that could
   move is an *additional* Procedure on a fixed-price Contract whose code had a row with no ordinal
   (today discarded, item 5); none is expected in the seed. If the switch moves any figure, the test
   asserts it by its exact difference and PROGRESS lists it.

2. **The line type and its pure helpers** (new `src/domain/billing/contractLines.ts`, exported from
   the billing index; the type re-exported through `types.ts` so the store and UI import one name).
   For DM-09, FT-04.2, US-04.2.4 ([AR-29#contract-line-fields](../../../../requirements-board/requirements/artifacts/AR-29.md),
   [AR-30#contract-line](../../../../requirements-board/requirements/artifacts/AR-30.md)).
   - `ContractLine = { id; contractId; procedureTypeId; holderCode?: string; holderDescription?: string;
     fixedPrice: number | null; fixedRate: number | null; fixedDiscountPercent: number | null;
     baseUnits: number | null; modifierUnits: number | null }`. `contractId` is the Contract version
     (each version is its own row in 18's model, as in the draft); `procedureTypeId` is 19's procedure
     id (the draft's `procedure_id`; `procedureId` already names a booking Procedure, so use 19's
     name, whatever it left). Every pricing field is **required
     and nullable**, so the compiler finds every literal and `null` always means "inherit". The type
     comment names OQ-89 (no time band, D40), the dormant group target (not modelled: no group line
     exists) and the draft status of AR-29. `allocateId` gains a `contractLine` kind (`CLN###`).
   - Masters: `contractLines` replaces 18's price-row collection (`contractPrices` or 18's name) in
     `SeedMasters` and `AppState['masters']`.
   - Remove `ContractPrice` (or 18's renamed type), `matchContractPrice`, the Contract-level Type 2
     terms (`ContractType2Detail`, `type2Detail`, or wherever 18 left the rate and discount), 18's
     `interimTerms` field and `interimTermsOf` (a Contract's pricing now follows from its lines;
     `isPlainRvgContract` below replaces `'rvg'`), 18's create refusal of a `rateOrDiscount` Contract
     without `type2Detail`, and every `procedureOrdinal` and price-row `surgeonId` key.
     `permitsIndividualArrangement` and `permitsRateTime` (the Method 3 gate) stay for Phase 24.
   - Pure helpers, each tested:
     - `lineFor(contractId, procedureTypeId, lines)`: the one line or undefined;
     - `validateContractLine(line, { procedures, lines })`, returning typed refusals: the procedure
       exists; at most one line per procedure per Contract version (`lineExists`); a fixed price is a
       sum of money ≥ 0 (0 is a no-charge price, so today's "price must be greater than zero" goes); a
       fixed rate ≥ 0; a fixed discount from 0 to 100; base and modifier units whole numbers ≥ 0; a
       line with a fixed price sets no fixed rate or discount (`fixedPriceExcludesRate`: the price is
       the whole price, so a rate or discount beside it would never apply; a picked reading, logged).
       A line that sets no pricing field is valid (a holder-code reference line priced at RVG,
       US-04.2.2's "Default" criterion);
     - `isPlainRvgContract(contract, lines)` (D32, OQ-98's default): a Contract that is not No
       contract (RVG) and has no lines. It applies to every procedure at RVG pricing; Phase 20 offers
       it for every procedure when its holder fits, as No contract (RVG) is offered by rule;
     - `lineSearchText(line, procedure)`: holder code, holder description and procedure name, which
       18's composite Contract search (`contractMatchesQuery`) adds (US-04.2.4: holder codes
       searchable), with no second search;
     - `setTermOnLines(lines, field, value)` for `field` `'fixedRate' | 'fixedDiscountPercent'`:
       the version's lines with that term set (or cleared, `null`) on every line that sets no fixed
       price, plus the count changed and the count skipped. A price review on a rate Contract is one
       change on the new version, not one edit per line (the domain model: a new version's "lines
       copied from the old and then changed"); S5 Beat 4's "$24.00" goes through it (item 9e). A
       picked convenience, logged.
   - Audit copy (`fieldLabels.ts`, `auditNarrative.ts`): English for a line ("{procedure}: fixed
     price $3,200.00", "fixed rate $26.50 a unit", "fixed discount 10%", "base units 10", "modifier
     units 0", "inherits"), never the raw field name.

3. **Move the seeded terms onto lines** (`domain/seed/contracts.ts`, a new `seed/contractLines.ts` if
   it reads better; deterministic ids `CL-<contract>-<procedure>`).
   - **Fixed prices.** Doyle's bariatric Contract, **both versions 18 seeded**. On `CT-DOYLE-BAR`:
     CP-BAR-1 (20880, $2,800) and CP-BAR-2 (20882, $2,400) become fixed-price lines on the procedures
     19 re-keyed those rows to; CP-BAR-3 (49120, ordinal 2, $950) becomes a **plain** fixed-price line
     on 49120's procedure, with no ordinal (RV-34): under Doyle's Contract that procedure costs $950
     whether or not it is the primary. On the upcoming `CT-DOYLE-BAR-2` (from 28 Jul): CP-BAR-4 to
     CP-BAR-6 become the same three lines with the gastric bypass at $2,950, so 18's "Upcoming" beat and
     its US-04.2.10 shot keep their figure. The bariatric Booking's second Procedure keeps $950, so its
     invoice stays $2,800 + $950. Any
     surgeon-keyed row (none is seeded; the editor allowed them) would become a surgeon or rooms
     Contract with plain lines.
   - **Fixed rates.** Every Type 2 agreed unit rate becomes fixed-rate lines on the procedures the
     Contract prices, from one commented `RATE_LINES` table read by one pure seed helper: SXAP
     ($26.50) and Health NZ ($23), the two hospitals' general agreements, on every procedure in 19's
     list; St George's ACC ($25) and COS ACC ($24) on the orthopaedic, hand and spine sections; Aria
     ($26.50) on the procedures its seeded Procedures use (the rate x time line itself is Phase 24's).
     A seed test proves every seeded Procedure on one of these Contracts finds a line with the same
     rate; if one does not, widen the table, never add a line per Booking. No percent discount is
     seeded today, so none is moved.
   - **Holder codes.** Give a handful of lines demo-plausible holder codes and descriptions, labelled
     demo values in a comment (SXAP-style `AP0126`, a Health NZ code, Doyle's `BAR-01` to `BAR-03`), so
     the grid and 18's composite search have something to find. No holder code is invented for
     every line.
   - **A code with no procedure.** A line needs a procedure: a seeded row whose code 19 left with no
     specific procedure goes on that group's general procedure, logged in a comment.
   - **Plain RVG Contracts.** A third-party Contract 18 left with no price terms (`interimTerms:
     'rvg'`: 18 plans six, the ex-defaults such as "St George's RVG" and "nib RVG") keeps no lines and
     is a plain RVG Contract (`isPlainRvgContract`). If 18 left none, seed one (for example nib's,
     billed to nib) so the editor's empty state and Phase 20 have one to show.
   - **Versions.** 18's new-version action now copies the version's lines (new ids, same terms) into
     the new version, as US-04.2.10 and AR-29#contract-versions say; a test proves a line edit on the
     new version leaves the old version's line untouched.
   - Seed tests: no line names a missing procedure; at most one line per procedure per Contract
     version; No contract (RVG) has no lines; the bariatric, rate and plain-RVG cases above.

4. **The resolver's line layer** (19's one resolver; DM-43, US-05.1.6's "Contract that sets base
   units" criterion, [AR-29#resolver-layers](../../../../requirements-board/requirements/artifacts/AR-29.md),
   [#null-handling](../../../../requirements-board/requirements/artifacts/AR-29.md)). Extend 19's
   resolver; never write a second.
   - Inputs: the Procedure's procedure (19's link), its RVG group, and the Contract version's line for
     that procedure (`lineFor`), where the Contract version is the one today's selection already
     resolves for the procedure date (18's `isEffectiveOn` and version lookup). The resolver never
     selects a Contract or a version. No contract (RVG) and a plain RVG Contract have no line.
   - Output, one typed object the UI, the warning rule and Phase 25 read (19's
     `resolveStartingUnits` gains a `line?` input, as 19's handoff says):
     `{ base: { units, layer: 'contractLine' | 'procedure' | 'rvgGroup', range? }, modifier: { units,
     layer }, fixedPrice: { value, layer: 'contractLine' } | null, fixedRate: ... | null,
     fixedDiscountPercent: ... | null }`. Keep 19's layer names as built; later phase docs call the new
     layer `'line'`, meaning this one.
     Base and modifier units always resolve (the group is fully populated); a `null` field looks
     through to the next layer, any value including 0 stops it. The range comes only from the group
     (19's starting figure and printed range, D35); a line or procedure figure is one number.
   - The recorded value keeps 19's precedence over the starting value: a manual override, then a
     chosen value on a ranged starting figure, then the starting value. Name the base source values
     after the layer (`'contractLine'` beside 19's `'procedure'` and `'rvgGroup'` in `baseUnitsFor`),
     and grep every reader of 19's source field.
   - **Out of range** (19's `baseUnitsOutsideGuide` rule keeps its id): the recorded value is compared
     with the starting figure in force, the group's range when the group supplies it, else the single
     figure the line or procedure sets. A picked reading (D3 speaks of the published range; a line's
     figure is AA's own), logged. The pristine seed still raises no out-of-range warning.
   - **Modifier units.** The resolved starting modifier units (0 from every group unless a procedure
     or line sets a figure; none is seeded) are added to today's computed modifier sum, so no figure
     moves; a line's explicit 0 switches off a procedure's non-zero figure ("some contracts do zero
     modifiers"). How itemised modifiers combine with it is Phase 19b's, which keeps this function as
     the one source of the starting figure. A picked reading, logged.
   - It re-runs whenever its inputs change: a changed procedure or Contract refreshes the starting
     values; a manual override survives the change (test).
   - `BtmBreakdown` gains the layer for base and modifier units and the line id, so the caption,
     Review and Phase 25's snapshot read one answer.
   - Tests: each layer for base and for modifier units; null inherits and 0 stops at every layer; a
     line base figure beats the procedure's own and the group's; price terms come from the line only
     (a procedure or group never supplies one); a Contract version not in force is never read; No
     contract (RVG) and a plain RVG Contract fall to the procedure and group; the out-of-range
     comparison against a line figure, a procedure figure and a group range.

5. **The fee path prices from the line** (`fee.ts`; [AR-29#dormant-capabilities](../../../../requirements-board/requirements/artifacts/AR-29.md):
   the rate and discount are live here, not dormant).
   - `FeeContext` loses `contractPrices`, `surgeonId` and `procedureOrdinal` and gains the resolved
     starting values (or the line, with the resolver called inside `feeFor`; pick one and keep it
     single). Every assembler passes the same inputs: `feeContextFor`, `procedureFee`,
     `InvoiceBuildContext`, `seed/billing.ts` `contextFor`, `reviewFlags.naturalBtm`,
     `BookingDetailBody`, the selectors and every `feeFor(` caller. No second Contract selection.
   - The RVG or fixed component, in today's order re-expressed:
     1. `fixedPrice` resolves: one `fixed` line "Contract price" for the line's price, the BTM still
        computed and returned for reference. It applies to any Procedure, primary or additional (the
        8th review's "an additional procedure takes a fixed price only from an ordinal-keyed row" goes
        with the ordinal key, RV-34). A fixed price of 0 gives a $0 line;
     2. otherwise `rate = fixedRate ?? anaesthetist.unitValue` and the amount is
        `roundToCents(billableUnits x rate x (1 - discount / 100))`, `discount` being the line's fixed
        discount or 0 (AR-29's calculated step). The time-only rule for an additional Procedure stays
        until Phase 23. The fee line shows the rate and, when set, "less {n}% (Contract)".
   - The 8th review's per-unit cents rounding of a Type 2 percent discount is superseded: the
     discount now applies to the amount, rounded once. No seeded Contract carries a discount, so no
     figure moves; a test pins the new rounding. Decisions log entry.
   - `FeeResult` gains the resolved terms used (`fixedPrice`, `fixedRate`, `fixedDiscountPercent`,
     each with its layer), so Review and Phase 24's price source read them rather than recomputing.
   - Unchanged here: the office `priceOverride` (Phase 24 makes it the top layer), the non-RVG billing
     lines and the Method 3 gate (24), the multi-procedure rule (23), the route and who is billed (20,
     21).
   - The validator: any rule that read the price rows or Type 2 terms reads the line instead; a
     Contract with a fixed price and no B, T or M recorded still validates as today.
   - Tests (`fee.test.ts`, `invoiceBuild.test.ts`, `billingRun.test.ts`): fixed price; fixed price on
     an additional Procedure; fixed price 0; fixed rate on 10 units regardless of the anaesthetist's
     value (US-05.2.6's criterion); fixed discount on the calculated price; rate and discount together;
     no line (RVG pricing); a plain RVG Contract; GST still at the foot on ex-GST prices (US-05.2.7).

6. **Session 1 ends green.** `npm run build`, `npm run build:pwa`, `npx vitest run`, and the parity
   fixture identical (item 1). Grep `src/` for `ContractPrice`, `contractPrices`, `type2Detail`,
   `interimTerms`, `procedureOrdinal`, `matchContractPrice` and `agreedUnitRate`: only test names and the Decisions
   log may mention them. The editor still needs its grid (item 9), so until then the Admin Contract
   sheet shows a read-only lines table; nothing else is left half-wired.

**Session 2: store, the anaesthetists' own price lists, the editor, captions and time tiers.**

7. **Store actions for lines** (`store/contractActions.ts`, office-only, audited, returning
   `Outcome`).
   - `addContractLine(contractId, procedureTypeId, terms)`, `editContractLine(lineId, terms)`,
     `removeContractLine(lineId)` and `setContractLinesTerm(contractId, field, value)` (item 2's
     `setTermOnLines`, every changed line validated, all or nothing, one audit entry naming the term,
     the value and the count), each through `validateContractLine` with its refusal sentence
     shown as-is in the editor ("This Contract already has a line for {procedure}.", "A line with a
     fixed price takes no rate or discount: the price is the whole price.", "A discount is a
     percentage from 0 to 100."). Refused on No contract (RVG) (`defaultHasNoLines`: "No contract (RVG)
     has no lines; it prices every procedure at RVG pricing.").
   - **No anaesthetist write path** (US-04.2.14, D42): every Contract, holder and line action refuses
     an anaesthetist actor (`officeOnly`), whoever the Contract's holder is, with a store test per
     action; no anaesthetist screen offers one.
   - **18's started-version freeze holds for lines.** Lines are the version's terms: add, edit and
     remove are refused once `termsLocked(version, today)` is true, with 18's single-sourced sentence
     ("This version has started. Use New version to change its terms."). The office changes a started
     Contract's lines by New version (which copies them, item 3) and editing the upcoming version. The
     seed's line moves (item 3) are seed data, not store edits.
   - 19's procedure delete is refused while any line names the procedure (`inContractUse`, naming the
     Contract's AA code).
   - `addContractPrice`, `editContractPrice`, their price-above-zero refusal and any Type 2 rate or
     discount edit on the Contract go.
   - Before Phase 25's lock, a line edit on an upcoming version re-prices the unlocked Procedures it
     governs (procedure date on or after the version's start) on ACTIVE and SUBMITTED Lists, and built
     invoices keep their amounts. Say so in a test.
   - Tests: each refusal and audit entry; the started-version refusal; the anaesthetist refusals; the
     delete guard; `setContractLinesTerm` on Health NZ's new version (every rate line at $24.00, the
     current version's lines still $23, fixed-price lines skipped, refused on the started version); a line edit on an upcoming version re-prices an ACTIVE List's Booking dated in it and
     not a built invoice; the new-version copy (item 3).

8. **The anaesthetists' own fixed-price Contracts** (US-04.2.14, OQ-91 answered, D42;
   [AR-28#contracts-two-kinds](../../../../requirements-board/requirements/artifacts/AR-28.md),
   [AR-29#contract-holder-fields](../../../../requirements-board/requirements/artifacts/AR-29.md)).
   - **Seed Dr Souter's price list.** A first-party holder for Dr Melanie Souter (party first,
     anaesthetist set, holder not billed, so the payer on the Booking is billed), unless 18 seeded one;
     and her Contract, "Dr M. Souter, own price list" (AA code from 18's generator, in force from
     2026-01-01), with fixed-price lines covering her prepaid procedures: **Rhinoplasty at $1,200**
     (the agreed professional fee Riley's seeded prepayment already uses, `seed/bookings.ts` about
     825, the S4 Beat 1 Booking; Nair's cosmetic rhinoplasty is the same procedure) and two or three
     more cosmetic procedures from 19's list (for example 19's "Face-lift", Blepharoplasty,
     Abdominoplasty), demo-plausible and labelled as such in a comment. If 19's list
     lacks one, add it to 19's procedure seed in its group, with its seed test. **No seeded Procedure
     is moved onto this Contract** (offering it is Phase 20's, the prepaid amount Phase 27's), so no
     fee moves; a seed test pins the Contract, its holder and its lines.
   - **One place to read an anaesthetist's own price.** Pure `ownPriceListFor(anaesthetistId,
     { contracts, holders, lines }, dateISO)` (the first-party Contract version in force) and
     `ownFixedPriceFor(anaesthetistId, procedureTypeId, ...)` returning the line's fixed price or
     undefined. Phase 20 offers the Contract on her own Bookings from the first; 26 shows each fixed
     price beside her prepaid tick list; 27 takes the prepaid amount from the second, and an undefined
     price is OQ-92's warning (D27). Tests for each, including another anaesthetist (undefined) and a
     version not yet in force.
   - **The office keeps it** in the same editor as every Contract (item 9): 18's holder picker
     offers a first-party holder for an anaesthetist, and the detail panel reads "First party · Dr
     Melanie Souter's own price list, kept by the office". A change to her prices once the version has
     started is a New version, like any Contract. A holder that names an anaesthetist is first
     party (AR-29's integrity rule); if 18 did not enforce it, add the refusal here.

9. **Admin: the lines grid** (`ContractEditSheet` and 18's detail panel; desktop; teal actions;
   existing table chrome).
   - a. A **Lines** section on every Contract except No contract (RVG): a table with the procedure
     (name, mono RVG code and system code), holder code and description, **Fixed price (ex GST)**,
     **Fixed rate ($ a unit)**, **Fixed discount (%)**, **Base units**, **Modifier units** and Remove.
     Each pricing cell is **inherit or override**
     ([AR-29#null-handling](../../../../requirements-board/requirements/artifacts/AR-29.md)): inherit
     shows the value beneath as a greyed placeholder ("10 · from procedure", "5 · from group H3",
     "None · RVG pricing" for the price terms); override stores the typed value, and an override left
     empty stores 0. "Add line" opens a searchable procedure select (19's Procedures-tab search; never
     a flat list of every procedure). Search within a Contract's lines by procedure, RVG code or
     holder code. On a started version (`termsLocked`) the grid is read-only, showing the same
     inherit or override values, with 18's "This version has started. Use New version to change its
     terms." and the teal New version action beside it. `data-shot="contract-lines"` on the section,
     `contract-line-row` on rows.
   - b. A Contract with no lines shows: "No lines. This Contract prices every procedure at RVG
     pricing (the anaesthetist's unit value)." with a neutral **Provisional** badge whose title names
     OQ-98. This is the phase's only provisional label. `data-shot="contract-lines-empty"`.
   - c. 18's interim **Terms** choice ("RVG at the anaesthetist's rate", "Fixed rate or discount",
     "Fixed prices"), the Contract-level rate and discount fields, the `PriceRows` (and its
     `contract-price-rows` hook), its "Any code" option and the ordinal input are gone; the "Rate x
     time permitted" toggle stays for Phase 24. The Contract catalogue's summary column reads "{n} lines" or "No
     lines · RVG pricing"; the catalogue and its composite search find a Contract by a line's holder
     code or description.
   - d. The first-party Contract shows its holder as above, and its grid defaults new lines to a fixed
     price.
   - e. **Set for all lines** on the Fixed rate and Fixed discount column headers of an editable
     version (hidden on a started one): a small popover with the value (or "Inherit" to clear) and the
     live count ("Sets the fixed rate on 212 lines; 3 fixed-price lines are left as they are"), teal
     confirm, through `setContractLinesTerm`. This keeps S5 Beat 4 one step: Health NZ, New version
     from 1 Aug 2026, then the new version's fixed rate set for all lines to $24.00 (18's beat typed
     the rate on the Contract, which is gone). `data-shot="contract-lines-set-all"`.

10. **Capture and Review show where starting units and terms came from** (shared: mobile, web,
    Admin Booking detail).
    - a. `UnitsCard`'s B caption from the base layer: "From the Contract line ({AA code})", "Set for
      this procedure", 19's group wording for the group layer, then 19's "Chosen", out-of-range and
      "Set manually" captions. The M caption names the line or procedure only when one sets modifier
      units. `ProcedureCodeCard`'s "Base N units · from ..." line follows the same words. The
      2026-09-28 ruling (no fee on the anaesthetist's Booking) is left as it stands; Phases 20a and 24
      re-read it.
    - b. A changed procedure or Contract refreshes the starting values on screen at once (item 4),
      with no stale caption.
    - c. Admin Review: the B · T · M cell carries a neutral "Line" pill when a line set base or
      modifier units, the AA code in its title; the fee cell shows "Fixed price" or "@ $x a unit, less
      n%" from `FeeResult`'s terms. `reviewFlags.naturalBtm` passes the same inputs (a line figure is
      not a manual override and raises no review flag). `data-shot="review-btm"` if not already
      present.
    - d. Copy sweep: grep `src/` for "Type 2", "Type 3", "agreed rate", "price row", "Any code",
      "ordinal" and "fixed fee schedule" in app copy and update each to line wording. Every new string
      follows the no en or em dash rule; ranges use "to".

11. **Time units as data** (`domain/billing/timeUnits.ts`, US-05.2.2, D25).
    - `RvgTimeRule = { tiers: readonly { fromMinute: number; intervalMinutes: number }[];
      partInterval: 'roundUp' }`, a one-value literal: OQ-75 says always, so it is recorded, not
      configurable. `SeedMasters` and `AppState['masters']` gain `rvgTimeRule`, seeded from
      `DEFAULT_RVG_TIME_RULE = { tiers: [{ fromMinute: 0, intervalMinutes: 15 }, { fromMinute: 120,
      intervalMinutes: 10 }], partInterval: 'roundUp' }`, which survives only as the seed source and a
      test fixture; no runtime path reads it.
    - `timeUnitsFromMinutes(minutes, rule)` takes the rule as a **required** parameter: units are
      summed tier by tier, each tier's span divided by its interval and rounded up for a part
      interval, the last tier open-ended; a non-positive span gives 0. `timeUnits(start, end, rule)`
      follows. `FeeContext` gains a required `timeRule`; every assembler passes `masters.rvgTimeRule`.
    - `validateRvgTimeRule(rule)` (tiers ascending, the first at 0, positive whole intervals, each
      closed tier's span a whole multiple of its interval); the seed test runs it.
      `describeTimeRule(rule)` builds the sentence the Admin panel and the T caption tooltip show: "1
      unit per 15 minutes or part for the first 2 hours, then 1 unit per 10 minutes or part. A part
      interval always rounds up." (from the data, never typed twice).
    - Remove `PARTIAL_INTERVAL_ROUNDING`, the tier constants and the "ASSUMPTION ... AA must confirm"
      header; the new header cites US-05.2.2 and OQ-75 (answered).
    - Tests (`timeUnits.test.ts`): the acceptance criteria (95 minutes is 7, 125 minutes is 9); 0, 1,
      15, 16, 120 (8) and 121 (9) minutes; a negative span; a test rule with different tiers changes
      the result (the rule is really read); `validateRvgTimeRule` refuses each malformed rule.
    - **Stale rounding copy.** `UnitsCard`'s T caption becomes "From start and finish stamps · RVG time
      tiers", with `describeTimeRule` as its title. Delete the Control Panel's "Billing assumption"
      callout (`DemoControlPanel.tsx` 209 to 231) and its `Info` import if unused. Grep `src/` for
      "assumption", "round up" and "rounds up" and update anything else that calls the rounding
      unsettled (RV-17).
    - 19's RVG groups tab gains a read-only **RVG time rule** panel showing `describeTimeRule`
      (editing it is Phase 42's). `data-shot="masters-rvg-time-rule"`.

12. **Warnings.** This phase adds no warning rule. 19's out-of-range sample in 15a's "Raise sample
    warnings" still lands outside after the comparison change in item 4; re-point it only if it no
    longer does.

13. **Playwright and green.**
    - Update `a7-04-masters`, the Phase 08 admin spec and any spec that reads the Contract editor's
      price rows or rate field, the T or B caption (`booking-calculation-display.spec.ts`,
      `mobile-phase04.spec.ts`) or the Control Panel callout (`demo-actions.spec.ts`).
    - Add specs for: the lines grid on SXAP (fixed-rate lines, read-only on the started version) and
      Doyle's Contract (fixed prices, 49120 at $950 with no ordinal, on both versions); New version on
      SXAP from a date before a seeded ACTIVE List's date, then a base-units override on the new
      version's line for a procedure that List's Booking uses, and seeing that Booking's B change with
      "From the Contract line", then clearing it to fall back to the procedure and the group; the
      empty-lines state with its Provisional badge; Dr
      Souter's own price list found through the holder filter; the time-rule panel; S5 Beat 4's path
      (Health NZ New version from 1 Aug 2026, Set for all lines $24.00, the Hemi Walker invoice
      unchanged).
    - Run `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots`. All green, and
      the parity fixture identical.

## Demo triggers

No new button. Everything is shown through normal use:

- **Admin Contract editor, lines grid:** on a seeded Contract, New version (18's flow, from a date
  before an ACTIVE List's date) copies the lines; overriding a procedure's base units on the new
  version's line changes the starting value on a Booking under that Contract dated in the new version;
  clearing it falls back to the procedure's own figure, then the group's (product, no new button). A
  started version's lines are read-only, as 18 freezes its terms.
- **Admin Contracts:** Dr Souter's own price list (a first-party holder) with a fixed price per
  procedure, kept by the office, found through the holder filter (product, no new button).
- **S5 Beat 4 (Admin Contracts, Health NZ):** New version, then the new version's fixed rate "Set
  for all lines" to $24.00 (item 9e); the current version and its invoices keep $23 (product, no new
  button).
- 15a's shared "Raise sample warnings" keeps 19's out-of-range sample (item 12).

No Control Panel change beyond deleting the rounding callout. PWA: the B and T captions reach the PWA
through the shared capture components, and no mobile beat waits on the office or a backend event, so
no PWA stand-in is needed. Contract edits are office-only; the PWA shows their effect when the
handset reloads its seed, like any other master.

## Out of scope

- Offering Contracts by line, holder fit and date, No contract (RVG) first, the RVG-codes route to
  lines across a group, offering a first-party Contract only on its anaesthetist's Bookings, and
  offering plain RVG Contracts for every procedure (Phase 20). This phase gives 20 `lineFor`,
  `isPlainRvgContract` and `ownPriceListFor`.
- The full price precedence (office override, the anaesthetist's typed price on adjustable Contracts,
  the price source, the engine's rejections), the anaesthetist adjustment, the fixed discount shown
  locked where the override is, and whether an anaesthetist may discount on top of a fixed discount
  (Phase 24; OQ-89's second part). The rate x time line and the Method 3 gate (Phase 24).
- Combination Contracts and the multi-procedure rule (Phase 23). The pricing snapshot (Phase 25,
  which records the resolved values and their layers). The prepaid tick list and its prices (26) and
  the prepaid amount (27). Itemised modifiers (19b).
- Group lines (dormant in the draft; none known), a time band on a line (D40), a Contract schedule
  upload (US-04.2.13, Future Work; D34), spreadsheet loads of lines (Phase 42), editing the time rule
  (42). Anaesthetists viewing their own price list in the app beyond what 26 shows.
- Real NZSA or holder figures: every seeded price, rate and holder code stays demo-plausible and
  labelled.

## Manual test checklist

The agent runs every item itself in the running app and reports it with evidence; none is handed to
the owner (ROADMAP.md "Owner review: agents test themselves").

- [ ] Admin → Master data → Contracts → SXAP: the Lines section lists fixed-rate lines at $26.50,
      price and discount cells greyed "None · RVG pricing", base units greyed with their layer; no
      Contract-level rate field remains; the started version's grid is read-only with 18's "Use New
      version" sentence. Doyle's bariatric Contract shows three fixed-price lines on each version,
      49120 at $950 with no ordinal anywhere, the upcoming version's gastric bypass at $2,950.
- [ ] New version on a Contract that governs an ACTIVE List's Booking (from a date on or before that
      List's date), then override base units on the new version's line for that Booking's procedure:
      the Booking's B shows the new figure with "From the Contract line ({AA code})" on web, mobile and
      the Admin Booking detail; clear the override and B falls back to the procedure's figure (or the
      group's); the audit viewer has each entry with before and after.
- [ ] Refusals: a second line for the same procedure; a fixed price with a rate; a discount of 120;
      a line on No contract (RVG); a line edit on a started version; deleting a procedure a line
      names. Each shows its sentence.
- [ ] Set a fixed price of $0 on a test line of that upcoming version: the Booking prices at $0 with
      BTM still shown; remove it.
- [ ] A Contract with no lines shows the empty state with the Provisional badge (OQ-98); the badge
      appears nowhere else.
- [ ] The catalogue's composite search finds a Contract by a line's holder code (for example
      `AP0126`); the summary column reads "{n} lines" or "No lines · RVG pricing".
- [ ] Dr Souter's own price list: the holder filter finds it; it reads first party, kept by the
      office; Rhinoplasty $1,200 and the other lines are there; an anaesthetist persona has no way to
      open or edit it on web, mobile or the PWA.
- [ ] A new Contract version (18's flow) copies its lines; editing a line on the new version leaves
      the old version's line unchanged.
- [ ] S5 Beat 4: Health NZ agreed rate, New version from 1 Aug 2026, then Fixed rate "Set for all
      lines" $24.00 with its count: every rate line on the new version reads $24.00, the current
      version's still $23.00 and read-only, one audit entry; the Hemi Walker invoice is unchanged.
- [ ] Time units: set an ACTIVE List Booking's times to 95 minutes (T 7) and 125 minutes (T 9). The
      T caption reads "From start and finish stamps · RVG time tiers" with the rule as its tooltip;
      the RVG groups tab shows the time rule panel; the Control Panel no longer shows the "Billing
      assumption" callout.
- [ ] Out of range: 19's ranged sample still raises the office warning; a Booking whose line sets 10
      base units and records 12 raises it; "Raise sample warnings" on Admin Day still stages 19's
      sample.
- [ ] S1 Beat 3 (Sarah Mitchell, 20950), S3's Ellison and Holt figures, S4 (Riley, Nair, the billing
      failure) and S5 (the Health NZ beat, the $23 rate) are unchanged, and the parity test is green.
- [ ] Admin Review: a Booking with a line base figure shows the "Line" pill; a SXAP Booking's fee
      cell reads "@ $26.50 a unit".
- [ ] PWA (5174): the B and T captions read as on mobile.
- [ ] No en or em dash in any new app copy (grep the diff). Actions are teal, pills neutral, and no
      crimson.
- [ ] Catalogue screenshots: the recipes for US-04.2.4, US-04.2.14 and US-05.2.2 are created or
      updated, every recipe this phase broke is re-pointed, a full `npm run capture` ends with no
      failed recipe and no story without a recipe, the covered items' new shots are checked by eye,
      and `npm run verify:board` is green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots` and `npm run verify:board`
      green.

## Demo guide updates

No scripted figure changes. Patch these sections, and the matching sections of
`master-demo-guide.html`, in the same session:

- `04-presenter-cheat-sheet.md`:
  - "Contracts" (as Phase 18 left it, with Type 1/2/3 and the protected default Type 1 already gone):
    add "A Contract's lines set its terms per procedure: a fixed price, a fixed rate, a fixed discount,
    or base or modifier units. A blank inherits from the procedure and its RVG group; 0 is a value. A
    Contract with no lines prices every procedure at RVG pricing (provisional, OQ-98)." and "An
    anaesthetist who prices their own work has their own price list, kept by the office (Dr Souter's,
    in Admin → Master data → Contracts)."
  - "Fee calculation": replace "The RFP does not define partial-interval rounding; the prototype
    rounds up per started interval as a discovery assumption" with "A part interval always rounds up
    (confirmed with AA). The tiers are held as data." Re-read the base-unit bullets as 19 left them and
    add the line layer: "Starting base units come from the Contract line, then the procedure, then its
    RVG group."
  - "RFP ambiguities" item 10 ("Modifier values and time rounding"): drop "Partial time-interval
    rounding is a prototype assumption"; retitle it "Modifier values" (unless 19b already rewrote it).
- `03-demo-script.md`:
  - S1's discovery point ("partial-interval time rounding is a prototype assumption..."): replace with
    "Time units follow the RVG tiers, a part interval always rounding up, as AA confirmed."
  - S5 Beat 4 ("Contract versions", on the Health NZ Contract as 18 left it): its rate now sits on
    the Contract's lines. Change 18's click "New version from 1 Aug 2026, review date 1 Apr 2027,
    rate $24.00, Save" to "New version from 1 Aug 2026, review date 1 Apr 2027, then on the new
    version's Lines, Fixed rate, Set for all lines, $24.00", and reword any line that calls it a
    Contract-wide agreed rate. The figure and the expected result stay; the beat's wider re-script is
    Phase 25's.
  - S5 "Worth pointing at" (Phase 19 may have added one after Beat 4; if not, add it there): add Admin
    → Master data → Contracts → a Contract's Lines (inherit or override, the greyed values beneath)
    and Dr Souter's own price list.
  - Confirm S3, S4 and S5 read unchanged.
- `master-demo-guide.html`: the S1 discovery callout (about line 859), the S5 Beat 4 card (about 978),
  the cheat-sheet rounding bullet (about 1026), the Contracts card (about 1049) and card 10 (about
  1124), plus whatever 18 and 19 changed in the same places.
- Control Panel scenario text: none beyond the deleted callout. Grep `src/apps/demo` for "rounding",
  "assumption", "Type 2" and "Type 3" to confirm.

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19), run
after the review pass and before the PROGRESS.md entry. Re-run
`node docs/prototype-build/catch-up/tools/recipe-status.mjs 19a` first: earlier phases (18 and 19
especially) will have changed these recipes since this plan was written. Never leave a caption that
describes Type 3 price rows, an ordinal, a "fixed fee schedule" with add-ons, or rounding as an
assumption.

**Covered items.** When the phase is done, each recipe in `requirements-board/capture/recipes/`
matches what was built:

| Item | Recipe at plan time | When this phase is done |
|---|---|---|
| [US-04.2.4](../../../../requirements-board/requirements/stories/US-04.2.4.md) Contract lines | partial · admin-price-rows (caption "Fixed price rows on a Type 3 contract"; reason lists holder code, GST inclusive price, time band, add-on flag and quantity rule as missing) | `partial`. Rename the shot `price-rows` to `lines` (the old name describes the retired Type 3 rows) and highlight `[data-shot=contract-lines]`: states `fixed-price` (Doyle's Contract: three fixed-price lines, 49120 at $950, holder codes), `fixed-rate` (SXAP: rate lines, price cells greyed "None · RVG pricing") and `override` (a base-units override beside greyed inherited values). Caption "Each Contract line sets only what it needs for one procedure; a blank inherits". `absentReason`: "A combination Contract's line under each parent procedure is built in Phase 23, and holder codes are searched in the Contract picker in Phase 20. A line has no time band while OQ-89 is open." No add-on, quantity or time band anywhere in the shot or caption |
| [US-04.2.14](../../../../requirements-board/requirements/stories/US-04.2.14.md) Anaesthetist's own fixed-price Contracts | none | Create it, `partial`. Admin shot `own-price-list`: the Contracts catalogue filtered by holder to Dr Souter, then her Contract open with its fixed-price lines (Rhinoplasty $1,200) and "First party · ... kept by the office". Caption "An anaesthetist's own price list, kept by the office from the prices she supplies". `absentReason`: "Offering it only on her own Bookings is built in Phase 20, her price change with a reason in Phase 24, and the prepaid amount from it in Phases 26 and 27." |
| [US-05.2.2](../../../../requirements-board/requirements/stories/US-05.2.2.md) Tiered time units | captured · web-time-units, mobile-time-units | Stays `captured`. Re-shoot both on `BK0001` with the new T caption ("From start and finish stamps · RVG time tiers"). Add an admin `time-rule` shot on 19's RVG groups tab (`masters-rvg-time-rule`), caption "Time tiers held as data: a part interval always rounds up". No "assumption" anywhere |

**Listed under FT-04.2, owned by other phases** (FT-04.2 has stories, so the tool lists them; this
phase only checks them):

| Item | Owner | This phase |
|---|---|---|
| [US-04.2.1](../../../../requirements-board/requirements/stories/US-04.2.1.md) Contract holder, who is billed, and where it applies | 18, 20, 21 | Check `--dry`: the detail panel gains a Lines section, so a highlight on the panel may move. No re-caption |
| [US-04.2.2](../../../../requirements-board/requirements/stories/US-04.2.2.md) Contract pricing terms | 24 | Its `type-1`, `type-2` and `type-3` states (names 18 kept while the terms stayed on the Contract) showed Contract-level terms, which are gone: rename them, as retired names, to `rvg` (a plain RVG Contract's empty lines), `fixed-rate` (SXAP's rate lines) and `fixed-price` (Doyle's lines), all on `[data-shot=contract-lines]` or `contract-lines-empty`; a discount state only if a discount line is seeded (none is), so say so in the reason. Keep `rate-time` for Phase 24. Caption "A Contract line can set a fixed price, a fixed rate, a fixed discount or units", replacing every "Type n" and "fixed fee schedule" caption. It is `captured` today and becomes `partial` (the gap is Contradicts): "The price precedence, the fixed discount shown locked and the anaesthetist adjustment are built in Phase 24." |
| [US-04.2.8](../../../../requirements-board/requirements/stories/US-04.2.8.md) Invoice presentation and delivery | 22 | No change |
| [US-04.2.10](../../../../requirements-board/requirements/stories/US-04.2.10.md) Contract prices effective from a date | 18 | If 18's shot shows the version's price rows or a Contract-level rate (S5 Beat 4's $24.00), re-shoot it with the copied lines and the rate set through "Set for all lines"; otherwise no change |
| [US-04.2.11](../../../../requirements-board/requirements/stories/US-04.2.11.md) Combination Contracts | 23 | No change |
| [US-04.2.13](../../../../requirements-board/requirements/stories/US-04.2.13.md) Upload a Contract schedule | Future Work (D34, OQ-100) | Nothing to build. If the capture run reports it with no recipe, add an `absent` one: "Future Work: no in-app Contract schedule upload in the first release (OQ-100)." |

**Recipes this phase breaks.**
- `US-05.2.6` (captured · `rate-time` on web and mobile, "Rate times time billing line", which
  describes the Method 3 line Phase 24 removes): rename the shot to `fixed-rate` and re-shoot a
  Southern Cross Booking priced at the line's $26.50 a unit on the Admin Booking detail, caption "A
  fixed-rate Contract prices the whole Procedure at its rate". It stays `captured` (now through the
  line); Phase 24 re-checks it.
- `US-05.2.5` (partial · `fixed-price`, reason "priced from the matched fixed price row (by RVG code,
  surgeon and procedure ordinal)"): re-shoot the bariatric Booking, caption "Booking priced from the
  surgeon's Contract line, units still recorded", reason "The price source and the precedence are
  built in Phase 24."
- `US-05.1.6` and `US-05.1.1` (19's): add a `line-override` state where 19 left a reason naming the
  Contract line's override as 19a's, and turn them `captured` unless 19 left another gap (say which).
- `US-03.3.1` (19's or 20's, whichever touched it last): its `closed` and ranged states' B caption
  may now read "From the Contract line"; re-shoot if the seeded Booking sits on a Contract with a line
  base figure, and keep the reason pointing at Phase 20.
- `US-04.1.1`, `US-04.1.2`, `US-04.3.2` and any recipe that clicks through the Contract editor: the
  price rows and the rate field are gone and the Lines section is new. Check their selectors with
  `--dry`.
- `US-05.3.1`, `US-05.3.2` and `US-03.5.2` read `units-row-b` or `units-row-t`; the captions changed
  but the hooks did not, so `--dry` should pass. Look at their shots.

**ATLAS.md.** Hooks (`contract-lines`, `contract-line-row`, `contract-lines-empty`,
`contract-lines-set-all`, `masters-rvg-time-rule`, `review-btm` if added; `contract-price-rows` removed), Seed data worth
shooting (Dr Souter's own price list and its holder, the SXAP and Doyle lines, the plain RVG
Contract, the line holder codes), and the Demo control panel section (the rounding callout is gone).
Routes are unchanged.

## Adversarial review (after build)

After the manual test checklist and the four commands are green, and before writing the PROGRESS
entry, run the standard **adversarial review-and-fix pass (PROGRESS convention 18)**. Fan out about
three independent Opus review subagents, one each for **quality**, **bugs/correctness** and **plan
adherence**, and a fourth on **billing maths**, because every fee path now reads lines. This session
then independently verifies every finding against the catalogue files, this doc and the code, fixes
the confirmed ones (with a test for each bug), re-greens, and records the pass. Do not re-raise
anything settled in the Decisions log.

**Steer this phase's reviewers at:**

- **No figure moved.** The parity fixture is identical; the named S2 to S5 cases and the carried-
  across matches (US-05.2.6's rates, US-05.2.5's bariatric prices, US-05.2.7's GST, US-05.2.1) are
  green. Every Type 2 rate and Type 3 row landed on a line with the same figure.
- **One place.** The line type, its validation, the resolver and the fee path live in
  `src/domain/billing` (plus the seed); the UI reads their types and helpers and recomputes nothing.
  A v5 change to the line or the layers would touch this module and the seed only.
- **The layers.** Base and modifier units: line, then procedure, then group; price terms from the
  line only; null inherits and 0 stops at every layer; the Contract version is the one in force on the
  procedure date and the resolver selects nothing itself; a manual value survives a change of
  procedure or Contract; each value carries its layer.
- **The fee path.** Fixed price is the whole price on any Procedure (no ordinal anywhere); else BTM x
  the line's rate or the anaesthetist's value, less the line's discount, rounded once. No Type 2 or
  Type 3 branch, `ContractPrice`, `type2Detail` or `procedureOrdinal` survives. Every assembler passes
  the same inputs; no second Contract selection.
- **Lines.** At most one per procedure per version; none on No contract (RVG); a fixed price excludes
  a rate and a discount; 0 is accepted; new versions copy lines; a started version's lines are
  frozen (18's `termsLocked`, the same sentence); both Doyle versions carry their lines; procedure
  deletes are guarded; every write is audited and office-only.
- **First-party Contracts.** Dr Souter's holder is first party with her as anaesthetist and is not
  billed; no seeded Procedure sits on it; `ownFixedPriceFor` is the one reader; no anaesthetist write
  path exists in the store or any app.
- **Time rule as data.** No runtime path reads `DEFAULT_RVG_TIME_RULE` or a tier constant; 95 minutes
  is 7 and 125 is 9; a changed test rule changes the result; no copy still calls the rounding an
  assumption (app, Control Panel, demo guide, code comments).
- **One provisional label** (OQ-98, the empty lines state). OQ-91 and OQ-75 carry none.
- **No gold-plating.** No picker or offering logic, no price precedence or price source, no
  adjustment, no snapshot, no group lines, no time band, no schedule upload, no time-rule editor.
  "Set for all lines" is the one bulk edit (rate or discount on an editable version, for S5 Beat 4);
  no other bulk or import path.
  Plus the usual: teal-only actions, no dashes in copy, `pwaPurity` green, `PERSIST_VERSION` bumped
  once, no new RNG draws.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry; ROADMAP.md "Owner review: agents test
  themselves"): the defaults built for open questions (OQ-98: a Contract with no lines prices every
  procedure at RVG pricing, labelled provisional on the empty state; OQ-89: no time band on a line),
  the picked readings (a fixed price excludes a rate and discount on the same line; a fixed discount
  applies to the amount, rounded once; the out-of-range warning compares against a line's or
  procedure's own figure when one sets it; starting modifier units added to the claimed modifiers
  until 19b; "Set for all lines" for a version's fixed rate or discount, skipping fixed-price lines,
  so a price review on a rate Contract stays one step (S5 Beat 4); the `RATE_LINES` procedure sets for SXAP, Health NZ and the ACC Contracts; seeded holder
  codes; the plain RVG Contract seeded if 18 left none; Dr Souter's price list figures, Rhinoplasty
  $1,200 and the others), whether AR-29 moved to a v5 at the drift check, and the screens worth a
  look: Admin → Master data → Contracts → SXAP and Doyle's Lines, the empty state, Dr Souter's own
  price list, and a Booking's B caption under a line override (office persona).
- **Catalogue screenshots result:** the recipe created (US-04.2.14) and changed (US-04.2.4,
  US-05.2.2, and the broken ones such as US-05.2.6, US-05.2.5, US-04.2.2, US-05.1.6, US-05.1.1 and
  US-03.3.1), the `requirements-board/capture/REPORT.md` counts (captured, partial, absent, failed)
  before and after, and the partial reasons handed on: US-04.2.4 to Phases 20 and 23, US-04.2.14 to
  20, 24, 26 and 27, US-04.2.2 and US-05.2.5 to 24.
- Status row for catch-up Phase 19a, and a phase entry: what was built, the parity result, the review
  pass (findings confirmed and fixed, anything not treated as a defect and why), tests added, and the
  `PERSIST_VERSION` bump.
- **Decisions log:**
  1. A Contract's terms live on its lines, one per procedure per version, carrying only what they
     set (DM-09, US-04.2.4); the Type 2 Contract-wide rate and discount and the Type 3 price rows are
     gone. This supersedes the 2026-07-22 second-review ruling (4) on `ContractPrice` matching keys
     and the Type 1/2/3 pricing basis.
  2. The procedure-ordinal price key is gone (RV-34; US-04.2.5 and US-05.3.4 Retired): a line's fixed
     price prices its procedure whether primary or additional. This supersedes the 2026-07-22 "Type 3
     second-procedure fallback" and the Phase 08 review's "Type 3 x isAdditional takes a fixed price
     only from an ordinal-keyed row"; the bariatric $950 now comes from a plain line.
  3. A fixed discount applies to the calculated amount and rounds once, superseding the Phase 08
     review's per-unit cents rounding of a Type 2 percent discount.
  4. Starting units resolve line, procedure, group, with each value's layer (DM-43; D3 and D12 as
     superseded); the out-of-range comparison reading above.
  5. The office keeps each anaesthetist's own fixed-price Contract (OQ-91, D42); no anaesthetist
     write path. Lines are a version's terms, so 18's started-version freeze covers them: a started
     Contract's lines change only through New version.
  6. Partial time intervals always round up, under tiers held as data (D25, OQ-75 answered), for
     recorded time only. This supersedes the 2026-07-22 "Time-unit partial-interval rounding ... a
     named ASSUMPTION" entry, ruling (8) of the same day's second review, and the Control Panel
     callout they required.
  7. A Contract with no lines prices every procedure at RVG pricing (OQ-98's default, D32,
     provisional).
- **Handoff list:**
  - 19b reads the resolved starting modifier units (and their layer) as the one starting figure when
    it makes modifiers itemised, and decides how claimed modifiers combine with it.
  - 20 offers a Contract when its version in force has a line for the procedure (`lineFor`), offers
    plain RVG Contracts for every procedure when their holder fits (`isPlainRvgContract`), offers a
    first-party Contract only on its anaesthetist's Bookings (`ownPriceListFor`), and from the RVG
    codes tab lists the lines across a group; the resolver re-runs on its Contract change.
  - 20a's "pricing basis with figure" reads `FeeResult`'s terms (fixed price, fixed rate, fixed
    discount).
  - 23 adds combination Contracts as one line under each parent procedure, and decides how the
    multi-procedure rule treats a fixed-price line on an additional Procedure (OQ-90).
  - 24 builds the full precedence over these terms, the fixed discount shown locked, the price source
    and the engine rejections, and the adjustment on No contract (RVG) and first-party Contracts.
  - 25 snapshots the Contract version, the line id, the resolved values and their layers, the rate
    and discount used. Its S5 Beat 4 "New version from 1 Aug 2026 at $24.00" now sets the rate with
    the grid's "Set for all lines".
  - 26 shows each prepaid procedure's fixed price from `ownFixedPriceFor`; 27 takes the prepaid amount
    from it, and an undefined price raises OQ-92's warning (D27).
  - 42 loads lines (blank inherits, 0 is zero) through this phase's store guards, and makes the time
    rule editable.
