# Phase 19 · RVG groups, procedures and the two-tab picker

**Requirements covered:**
[FT-05.1](../../../../requirements-board/requirements/stories/FT-05.1.md) RVG groups, procedures and modifiers (Confirmed; Partial; joined 2026-10-08 for its groups and procedures half: the modifier list is Phase 19b's) ·
[US-05.1.1](../../../../requirements-board/requirements/stories/US-05.1.1.md) RVG groups (Confirmed; Partial) ·
[US-05.1.3](../../../../requirements-board/requirements/stories/US-05.1.3.md) Body sections and AA groups (Verify; Partial; whole-group prepaid marking is Phase 26's) ·
[US-05.1.6](../../../../requirements-board/requirements/stories/US-05.1.6.md) Procedure master mapped to RVG codes (Confirmed; Missing) ·
[DM-13](../analysis/domain-model-delta.md#dm-13) RVG groups, body sections and a curated procedure list replace the flat RVG code table and the free-text procedure ·
[RV-04](../analysis/reverse-check.md#rv-04-ranged-base-code-is-hard-bounded-to-the-published-range) ranged base code hard-bounded to the published range.

**Decisions and questions.** Owner decision **D3** ([OQ-56](../../../../requirements-board/requirements/questions/OQ-56.md),
with [OQ-32](../../../../requirements-board/requirements/questions/OQ-32.md)) still holds as answered: any
base-unit value is accepted and an out-of-range value raises an after-procedure warning for the office.
Its old second half (base units from each procedure's default RVG Contract) is **superseded
2026-10-08**, with **D12**: [OQ-62](../../../../requirements-board/requirements/questions/OQ-62.md)'s
2026-10-07 update settles base units on the **RVG group**, overridden by a **procedure** where AA sets
its own figure, and by a Contract line (Phase 19a). Default RVG Contracts are retired (FT-04.4,
US-04.4.1, US-04.4.2). Still open, built as the ROADMAP defaults, provisional and each kept in one
place: **D35** ([OQ-101](../../../../requirements-board/requirements/questions/OQ-101.md): a group holds a
starting figure plus the published range), **D37**
([OQ-103](../../../../requirements-board/requirements/questions/OQ-103.md): a general procedure is named by
section, tier and code in plain words AA can edit) and **D39**
([OQ-88](../../../../requirements-board/requirements/questions/OQ-88.md): two levels, groups then
procedures, as the catalogue now has them; a unique system code on every group and procedure, since
where it sits is still open).

**Left this phase (2026-10-08).** Everything about modifiers moved to the new **Phase 19b**:
US-05.1.4 (now locked included P1 on Neurosurgery and Spine codes, not default modifiers), US-05.1.5
(the modifier master from the NZSA table), DM-44 and RV-23 (absorbed modifiers out). So did the
"default modifiers pre-filled and untickable" reading, which the catalogue dropped. US-03.3.1 left for
Phase 20, which closes it with the Contract pick; this phase builds the two-tab picker it needs. The
2026-10-02 readings "the procedure list holds no base units" and "base units live in each
procedure's default RVG Contracts" are withdrawn: procedures may carry their own figure. The old
plan's AA groups as many-to-many tags (Cosmetic, Plastics, Dental, Bariatric) are dropped: an "RVG
group" is now one published code, and AA's own groups sit beside the published ones (US-05.1.3's
Verify point, built as its default below). Contract lines, the Contract line layer of the resolver
and Contract scope by procedure are Phase 19a's; the Contract pick after the picker is Phase 20's;
the source wording and the three-part stack are Phase 20a's.

**Depends on:** Phase 15a (the warning routine, Warning records, the office to-do list, the warning
triangle, the warning on opening a Booking and the shared "Raise sample warnings" trigger) and Phase
18 (contract holders, dated Contracts, one No contract (RVG), and the fee parity harness). Phases 14,
15 and 15b are in place (the trigger registry; Booking vocabulary; Copy and photo capture out; an
assigned List reads ACTIVE, never DRAFT). Phase 17 is in place too, but nothing here touches it.

**Estimated:** 2 sessions. Session 1: work items 1 to 8 (baseline, the pricing-model module, the
resolver, the warning rule, the seed and its remap, store actions, every `rvgBaseCode` reader
re-pointed, tests), ending green with the old picker minimally re-pointed. Session 2: work items 9 to
14 (Admin RVG groups and Procedures, the two-tab picker on every capture path, creation paths, the
copy sweep, the warning sample, shots, demo guide) and the review pass. If session 2 runs long, cut
the Admin "Retired" filter (9c) before any capture path.

**Owner review.** Agents test themselves (ROADMAP.md "Owner review: agents test themselves"): no
plan-approval stop. D3 and OQ-62 are built as answered, with no label. D35, D37 and D39 are built as
their defaults and logged on the phase's "For the owner's review" list.

## Goal

Replace the flat `RvgCode` table and the free-text procedure with the catalogue's two levels, the
masters every price starts from, before 19a adds Contract lines to the resolver, 20 adds the
Contract pick, 20a the source wording and 26 the prepaid tick list.

- **Body sections and RVG groups** (US-05.1.1, US-05.1.3, FT-05.1). The NZSA RVG 2021 groups as
  published ([AR-16](../../../../requirements-board/requirements/artifacts/AR-16.md), Section II,
  pages 7 to 11), each with a surrogate id, a unique human-readable **system code** (D39), its printed
  **code and name**, its **body section** (Head, Neck, UPPER LIMB, THORAX, SPINE, ABDOMEN, PERINEUM,
  PELVIC, VASCULAR, LOWER LIMB, ANAESTHESIA IN REMOTE LOCATIONS and so on, in the guide's order) and
  the guide's **sub-heading** where it prints one (Dental, Ocular, Neurosurgery, Breast, Cervical,
  Lumbar, Upper GI, Urology, Endoscopy), **base units** (always above 0: the **starting figure**) with
  the **published range** beside it where the guide prints one (H4 10 to 12, A4 6 to 8; D35), and
  **modifier units**, 0 by default. AA's own groups sit beside the published ones under a body
  section and are not marked as AA-sourced (US-05.1.1; the domain model's "marks them AA-sourced" is
  older and loses). The printed code is not a key: the guide prints two T2s and two P6s.
- **The procedure list** (US-05.1.6, DM-13; UI "Procedures"). Curated procedures, each worded for
  the invoice, in exactly one RVG group, with an AA subgroup, a system code, and optional own base and
  modifier units (null inherits the group's; 0 is a value, [AR-29](../../../../requirements-board/requirements/artifacts/AR-29.md)
  region `null-handling`). No nesting and no prices. **Every RVG group has a general procedure**,
  created with the group, named by section, tier and code in plain words AA can edit, for example
  "Head, moderate procedure (H3)" (D37).
- **One resolver for starting units**: base and modifier units from the procedure where it sets
  them, else its RVG group, with the layer each came from
  ([AR-29](../../../../requirements-board/requirements/artifacts/AR-29.md) region `resolver-layers`).
  Phase 19a adds the Contract line above them. What the anaesthetist records (a chosen value on a
  ranged group, or a typed override) still wins, as today.
- **Any base-unit value is accepted (D3, RV-04).** The ranged clamp and the completion refusal go.
  A ranged group starts at its starting figure, so nothing is left unchosen. A recorded value that
  differs from the starting value and lies outside the group's published figure or range raises one
  mild after-procedure warning for the office through 15a's routine, and never blocks.
- **A two-tab picker** on mobile, web and Admin (FT-04.3's layout, which US-03.3.1 and US-04.3.2
  use): **Procedures** (body section, then subgroup, then procedure) and **RVG codes** (body section,
  then the guide's sub-heading, then code), each one scrolling list with jump-to-section, and one
  search across procedure name, RVG code and system code. Picking a procedure sets it; picking an
  RVG code sets the group's general procedure (Phase 20 inserts the Contract lines across the group
  between the code and the procedure).
- **Office maintenance** in Admin Master data: add, edit and retire RVG groups and procedures, every
  change audited (FT-05.1).
- **The Procedure's pricing input becomes its procedure.** The booking Procedure gains
  `procedureTypeId` (the design's `procedure_id`; see work item 2 for the name) and loses
  `rvgBaseCode`; its RVG group is read through its procedure. Its free-text `description` stays as
  the interim wording received until Phase 20a turns it into the source wording list.

**Pricing model in one place.** The RVG group and procedure types, the general-procedure rule, the
search and grouping helpers and the starting-units resolver live in one module in
`aa-prototype/src/domain/billing/` (plus the seed), behind types the UI reads, so a v5 of the draft
design stays a contained edit. The reference shape is the draft technical design v4,
[AR-29](../../../../requirements-board/requirements/artifacts/AR-29.md) regions `data-model` (the entity
diagram, page 3; the RVG_GROUP and PROCEDURE field tables follow on page 4), `resolver-layers` and `null-handling`, and its ERD
[AR-30](../../../../requirements-board/requirements/artifacts/AR-30.md) regions `rvg-group` and `procedure`; the
plain-language guide [AR-28](../../../../requirements-board/requirements/artifacts/AR-28.md) region
`rvg-groups-and-procedures` is true as written. The design is a draft; where this doc departs from it
(the sub-heading, the range, the general procedure, the system code), the departure is a field in
that module, named in the PROGRESS entry.

No figure in the S1 to S5 run sheet moves: every seeded Procedure is remapped to a procedure whose
starting units equal today's figure (work item 6).

## Before you start: drift check

1. Run the catalogue diff against the plan's baseline, catalogue commit `60e2d1e` (rename-aware;
   never a plain `git diff` of the catalogue folder):

   ```
   node docs/prototype-build/catch-up/tools/plan-state.mjs --diff FT-05.1,US-05.1.1,US-05.1.3,US-05.1.6,US-03.3.1,FT-04.3,US-04.3.2,US-04.2.4,US-06.1.1,US-13.7.1,US-13.4.3,US-05.1.4,OQ-56,OQ-62,OQ-88,OQ-99,OQ-101,OQ-103
   ```

   At plan time (2026-10-08, `3d3a18c..60e2d1e`) these moved: FT-05.1 retitled "RVG groups,
   procedures and modifiers" (groups as published under body sections, the procedure list, office
   maintenance and audit, two routes); US-05.1.1 retitled "RVG groups" (system code, code and name,
   body section, base units above 0, modifier units 0; base units live here, OQ-62); US-05.1.3
   retitled "Body sections and AA groups" (Verify: whether AA's cosmetic, dental and plastics
   groupings stay); US-05.1.6 rewritten (one group per procedure, own figure optional, a general
   procedure per group, the two tabs); US-03.3.1 rewritten (two tabs, Contract, starting units, any
   value with a warning); OQ-62 settled on the group; OQ-88 moved, not settled (two levels in the
   guide and design; system code still open); OQ-101 and OQ-103 new. US-05.1.4 and US-05.1.5 are now
   19b's. The plan already reflects all of this; diff only for anything after `60e2d1e`.
2. If an item changed after `60e2d1e`, re-read it whole and adjust the work items. If one is now
   Retired or Future, drop its work and say so in the PROGRESS entry.
3. Read `requirements-board/requirements/domain-model.md` "RVG groups, procedure list and modifier
   master", the "Base units come from the RVG code" row of §1, the Procedure section and §3's
   resolver block. Where the domain model says AA groups are "marked AA-sourced", US-05.1.1 is newer
   and wins: no marker.
4. Read the evidence behind the rewrites with `npm --prefix "/Users/d.fraser/Local Dev/Anaesthesia Associates RFP/requirements-board" run source -- --item <ID> --text`
   for US-05.1.1, US-05.1.6 and FT-05.1 (Node 22.18 or newer), and the note
   `requirements-board/requirements/notes/2026-10-08-procedure-picker-and-source-text.md` (#2 to #5,
   and its "Illustrative source wording" table, artifact AR-35).
5. Check `docs/discovery-reference/Data files/` (`git log` on it) for Vanessa's procedure list. If it
   has landed, take operation names, subgroups and their RVG codes for the demo-sized seed; never take
   its figures where they would move a run-sheet figure. If not, seed the demo-plausible list below,
   labelled.
6. Confirm the gates.

| Gate | Build | If answered differently |
|---|---|---|
| **D3 / OQ-56** (answered) | Any base units accepted; an out-of-range entry raises a mild after-procedure warning for the office through 15a's routine. No label | Not expected. A threshold or mute is US-13.7.4 (Future): do not build it |
| **OQ-62** (answered 2026-10-07; old D12 superseded) | Base units on the RVG group, overridden by the procedure's own figure; 19a adds the Contract line above. No label | Not expected |
| **D39 / OQ-88** (Open: one list or two; hierarchy or flat; where the system code sits) | Two levels per the catalogue and the draft design: RVG groups, and procedures each in exactly one group, no nesting. A unique system code on every group and every procedure, unique across both. One "Provisional" note on the Admin Procedures tab | If the system code belongs on one level only, hide the other's column and drop its uniqueness check: a change in the module's `systemCodeIsFree` and `MasterData.tsx` only. If the two lists merge, procedures keep their group link as a lookup. Record either for the owner; do not stop |
| **D35 / OQ-101** (Open: how a range is held) | The group's `baseUnits` is the starting figure (the range's lower bound unless AA sets another), with `baseUnitsRange { min, max }` held beside it where the guide prints one. The anaesthetist starts from the figure and may record any value. One "Provisional" note on the Admin RVG groups tab | If only the figure is kept, drop the range field; the warning then compares with the figure. One field in the module |
| **D37 / OQ-103** (Open: a general procedure's invoice wording, and a review prompt) | `generalProcedureName`: where the group's name starts with a tier (Minor, Simple but Invasive, Moderate, Major, Complex, Significant), "{Section}, {tier in lower case} procedure ({code})", for example "Head, moderate procedure (H3)"; otherwise "{group name} ({code})", for example "Removal of spinal hardware (S1)". AA can edit the name afterwards. The review flag on a Procedure left on a general procedure is Phases 20 and 21's (handoff) | If AA picks the published description, regenerate the names in the seed only; the rule is one function |
| **US-05.1.3** (Verify: AA's own groupings) | AA groups beside the published ones, under a body section; no tags across groups | If tags are wanted, they are a new many-to-many field on the group; record it for Phase 42 |

7. Read what Phases 15a, 15b, 17 and 18 actually built (their PROGRESS entries). File names below are
   as at `60e2d1e`, which is the prototype as Phase 15 left it with 15a session 1 in place; follow the
   shapes those phases left. Confirm in particular:
   - from 15a: where warning rules live and how one is registered (rule file, `WARNING_RULES` entry,
     `WarningRuleId`, a `WarningFacts` field, the `appSettings.warningRules` default via
     `backfillMerge`), the Warning shape (after-procedure timing, mild strength, per-Procedure key),
     when an after-procedure warning surfaces and re-raises after a Clear, and the `WARNING_SAMPLES`
     entry shape and pinned sample Bookings (including `multiWarning`) behind "Raise sample warnings";
   - from 18: the `feeParity.test.ts` harness and its `__parity__/` fixture; where 18 put the pricing
     model's types (contract holders, Contracts, No contract (RVG)): if 18 made a pricing-model module
     in `domain/billing/`, this phase's groups and procedures join it; and what shape `ContractPrice`
     (the fixed-price rows keyed by RVG code) has after 18;
   - from 15b: that the photo extractions (`sampleExtractions.ts`) are gone or badged.
8. Record the current `PERSIST_VERSION` (16 at `60e2d1e`; 15a session 2, 15b and 16 to 18 may have
   bumped it).

## Reference

**Design (convention 17).** No mockup covers Admin master data. Extend the Admin Review page's table
anatomy (`docs/design/Admin Review.dc.html`: header row, mono data cells, status pills, row actions) and
the existing Master data tabs and edit sheets (`ContractEditSheet`, `AddHolidaySheet`). The picker is
the bottom sheet of `docs/design/Mobile App.dc.html` screen 3 (the code card and picker sheet) and its
web twin in `Web Dashboard.dc.html`'s card anatomy, with a two-segment tab control and a jump-to-section
chip row under the search box. Tokens, pills, the warn tint and the provisional badge come from
`Design Language.dc.html`. Teal is the only action colour. Body section, sub-heading, "General",
"Retired" and "Provisional" markers are neutral pills, never crimson.

**Catalogue.** The files linked above, plus
[FT-04.3](../../../../requirements-board/requirements/stories/FT-04.3.md) (the picker layout: two tabs, jump-to-section, one search; the RVG-code route),
[US-03.3.1](../../../../requirements-board/requirements/stories/US-03.3.1.md) (the anaesthetist's two routes and starting units, closed by Phase 20),
[US-04.3.2](../../../../requirements-board/requirements/stories/US-04.3.2.md) (the Contract list from an RVG code, Phase 20),
[US-04.2.4](../../../../requirements-board/requirements/stories/US-04.2.4.md) (Contract lines, Phase 19a),
[US-06.1.1](../../../../requirements-board/requirements/stories/US-06.1.1.md) (prepaid procedures or whole RVG groups, Phase 26),
[US-13.7.1](../../../../requirements-board/requirements/stories/US-13.7.1.md) (the warning routine, Phase 15a),
[US-13.4.3](../../../../requirements-board/requirements/stories/US-13.4.3.md) (spreadsheet loads, Phase 42),
[US-05.1.4](../../../../requirements-board/requirements/stories/US-05.1.4.md) (included modifiers, Phase 19b: why the Neurosurgery and Spine groups are seeded here),
[OQ-99](../../../../requirements-board/requirements/questions/OQ-99.md) (a blank procedure at setup, D33, Phases 20, 21 and 33).
Artifacts: [AR-16](../../../../requirements-board/requirements/artifacts/AR-16.md) (the NZSA RVG 2021 PDF:
Section II, the groups), [AR-28](../../../../requirements-board/requirements/artifacts/AR-28.md) region
`rvg-groups-and-procedures`, [AR-29](../../../../requirements-board/requirements/artifacts/AR-29.md) regions
`data-model`, `resolver-layers`, `null-handling` and `data-loading`,
[AR-30](../../../../requirements-board/requirements/artifacts/AR-30.md) regions `rvg-group` and `procedure`,
[AR-01](../../../../requirements-board/requirements/artifacts/AR-01.md) region `starting-values` (the first
layer with a value wins; blank inherits), [AR-35](../../../../requirements-board/requirements/artifacts/AR-35.md) (the 2026-10-08 note; the catalogue
links its table as `AR-35#illustrative-source-wording`, the note's "Illustrative source wording" heading), the
included-modifiers list `requirements-board/requirements/artifacts/files/NZSA RVG 2021 included modifiers.csv`
(AR-34: the Neurosurgery H7A to H9b and Spine S1 to S10 codes with their base units), and
[AR-02](../../../../requirements-board/requirements/artifacts/AR-02.md) region `procedure-master`. Read the RVG
PDF by text extraction (`python3` with `pypdf` works in this repo) and spot-check two-column rows
against the page; never copy the PDF's text beyond codes, names and units.

**Analysis.** `../GAP-ANALYSIS.md` "EP-05 · RVG master data and fee calculation rules" (FT-05.1,
US-05.1.1, US-05.1.3, US-05.1.6), the DM-13 row of "Structural changes" and the RV-04 row of
"Prototype behaviour to remove or rework". `../epics/EP-05.md`. `../analysis/domain-model-delta.md#dm-13`,
`#dm-43` (the resolver, which 19a completes) and `#dm-31` (the warning record);
`../analysis/reverse-check.md` RV-04. `../analysis/prototype-map-domain.md` (billing maths),
`prototype-map-shared.md` (capture suite), `prototype-map-admin.md` section 9 (Master data) and
`prototype-map-store-seed.md` (masters, seed). `docs/discovery-reference/Data files/Master Fee List.xlsx`
(Procedures tab: Body Section, Subgroup, Procedure, RVG Code) and
`Data files/Group 1/Anaesthesia_Associates_Procedure_Master_Cleaned_v2.xlsx` show AA's own list
shape; take the shape and a few names, not figures.

**Code entry points (at `60e2d1e`).**

- Types: `src/domain/types.ts`. `Procedure` (453: `description`, `rvgBaseCode` at 501,
  `baseUnitsSelected`, `baseUnitsCaptured`, `selectedModifierCodes`), `RvgBaseUnits` and `RvgCode`
  (546 to 557, with `anatomicalSite` and `absorbsModifierCodes`), `ContractPrice` (250, its
  `rvgBaseCode` key at 253).
- Base units: `src/domain/billing/fee.ts` `resolveBtm` (58): base from `baseCode.baseUnits` or
  `baseUnitsSelected`, and `baseCode` passed to `modifierUnits` for absorption. `FeeContext.baseCode`
  feeds it.
- `src/domain/billing/validateBookingForBilling.ts`: `feeContextFor`, the "something to charge" rule,
  and the in-range rule (152 to 163, the RV-04 guard). `invoiceBuild.ts` (`InvoiceBuildContext`).
  `contracts.ts` (63, 88: the Type 3 price match by `rvgBaseCode`).
- `src/domain/billing/modifierUnits.ts` (the absorbed refusal reads `baseCode.absorbsModifierCodes`)
  and `fixtures.ts` (`BASE_ABSORBS_P1`): untouched in meaning, re-pointed only (work item 3).
- UI fee context: `src/shared/capture/feeContext.ts`. `procedureFee` is the second fee-context
  assembler and must stay in step with `feeContextFor`.
- Warnings (15a session 1): `src/domain/warnings/` (`routine.ts`, `types.ts`, `settings.ts`,
  `rules/index.ts` with `WARNING_RULES = [prepaymentUnpaidRule]`), `src/store/warnings.ts`
  (`warningFactsFor`); `store/warningSamples.ts` arrives with 15a session 2.
- Seed: `src/domain/seed/rvgCodes.ts` (`RVG_CODES`, 34 invented 5-digit codes; ranged 20880, 47522,
  51011, 45030; P1 absorbed at 47516, 47519, 47522, 48900, 48939, 51011, 51020; `EYE_CODES`,
  `GENERAL_CODES`), `seed/index.ts` (`SeedMasters`), `seed/bookings.ts` (scenario Procedures by code;
  the generator's range draw at 1162 consumes the RNG), `seed/history.ts` (73, 101 to 112, 232: billing
  history rows by code), `seed/contracts.ts` (140 to 143: three Type 3 price rows by code),
  `seed/audit.ts` (96), `seed/billing.ts` `contextFor`.
- Intake fixtures with codes: `src/domain/integrations/messages.ts` (169, 188, 207, 275, 312:
  `operation.code`), `apps/admin/flows/PhoneAdviceBooking.tsx` (30: `rvgBaseCode: '20950'`),
  `shared/flows/sampleExtractions.ts` (30, 44) if 15b kept it.
- Store: `src/store/mastersActions.ts` (the office-only, audited master pattern), `lifecycle.ts`
  `editProcedure`, `bookingActions.ts` (`createBooking` with `rvgBaseCode`, `addProcedure`),
  `contractActions.ts` (192 to 223: price rows by code), `mutate.ts` `allocateId`, `selectors.ts`.
- Admin: `src/apps/admin/screens/MasterData.tsx` (`NAV` 41 with `rvgCodes` "RVG codes" at 49,
  `RvgCodesView` 411), `apps/admin/flows/ContractEditSheet.tsx` (225 to 258: price rows by code),
  `apps/admin/reviewFlags.ts` (`naturalBtm`), `screens/ReviewScreen.tsx` (262: the code column).
- Capture (shared by mobile, web and the Admin Booking detail): `src/shared/capture/`
  `BtmCaptureBlock.tsx`, `ProcedureCodeCard.tsx` (`pick` at 38, the `RangeUnitsRow` clamp at 150 to
  178), `CodePickerSheet.tsx` (search by code or name, grouped by `anatomicalSite`), `UnitsCard.tsx`
  (the B stepper and caption), `ModifierChips.tsx` (reads the base code for absorption).
  `shared/booking/BookingDetailBody.tsx`. Creation form: `src/shared/flows/ManualBookingForm.tsx`
  (the "Procedure code" select, 176 to 195).
- Readers: 19 non-test files read `rvgBaseCode` and 21 read `RvgCode`/`rvgCodes`/`RVG_CODES`
  (`grep -rln` both before starting; 11 test files read `rvgBaseCode`).
- Tests to extend: `fee.test.ts`, `modifierUnits.test.ts`, `validateBookingForBilling.test.ts`,
  `contracts.test.ts`, `invoiceBuild.test.ts`, `seed.test.ts`, `store/btmCapture.test.ts`,
  `captureActions.test.ts`, `bookingActions.test.ts`, `mastersActions.test.ts`,
  `domain/warnings/routine.test.ts`, `src/pwa/pwaPurity.test.ts` (must stay green). Playwright:
  `visual/mobile-phase04.spec.ts` (the code picker shots), `admin-phase07.spec.ts`
  (`a7-04-masters`).

## Work items

Model, domain and seed first, then store, then UI. Every new write goes through `mutate()` with an
audit meta. Every rule is a pure function with a Vitest test.

1. **Baseline the figures (before any edit).** Phase 18 built `src/domain/billing/feeParity.test.ts`
   with its fixture in `domain/billing/__parity__/`. Add `phase-19-baseline.json` beside 18's,
   generated from the untouched code: every seeded Procedure's `feeFor` total, its B, T and M, and
   every seeded invoice total from `buildSeed()`. If 18's harness is missing, create it to the same
   shape and say so in PROGRESS. Never regenerate it with `-u`: a mismatch is a parity failure to
   explain, not to accept. It must come out identical at the end of the phase, apart from exceptions
   listed in the PROGRESS entry (none expected). Also record each seeded Procedure's B and its
   source today, for item 6's remap.

2. **The pricing-model module: groups and procedures** (US-05.1.1, US-05.1.3, US-05.1.6, DM-13;
   [AR-29](../../../../requirements-board/requirements/artifacts/AR-29.md) region `data-model`,
   [AR-30](../../../../requirements-board/requirements/artifacts/AR-30.md) regions `rvg-group` and
   `procedure`). One module in `src/domain/billing/` (join the pricing-model module 18 made, or create
   `src/domain/billing/pricingModel/` with `masters.ts`, `procedures.ts` and `startingUnits.ts`).
   `src/domain/types.ts` re-exports the types so imports elsewhere do not reach into the module's
   files. The UI reads only these types and the module's helpers.
   - `BodySection { id: BodySectionId; name: string; order: number }`: the guide's sections in
     print order, seeded, read-only in this phase (Phase 42 makes masters loadable).
   - `RvgGroup` (replaces `RvgCode`): `{ id: RvgGroupId; systemCode: string; code: string; name:
     string; bodySectionId: BodySectionId; subHeading?: string; baseUnits: number; baseUnitsRange?:
     { min: number; max: number }; modifierUnits: number; retired: boolean }`. `baseUnits` is the
     starting figure, a whole number above 0; the range, where present, has `min <= baseUnits <= max`
     (D35). `modifierUnits` is a whole number of 0 or more, 0 by default (US-05.1.1; the directors'
     modifier rule keeps it 0). `anatomicalSite` and `RvgBaseUnits` go. The "4 + Time" codes are
     seeded with their number only (time is always charged); note it in the seed comment.
   - `ProcedureType` (the design's PROCEDURE; UI "procedure"): `{ id: ProcedureTypeId; systemCode:
     string; name: string; rvgGroupId: RvgGroupId; subgroup: string; baseUnits: number | null;
     modifierUnits: number | null; isGeneral: boolean; retired: boolean }`. `name` is the invoice
     wording. Exactly one non-retired `isGeneral` procedure per group (its `subgroup` is "General").
     **Interim, deleted by 19b:** `includesModifierCodes?: string[]`, carrying today's absorbed P1
     from the seven absorbing codes onto the procedures remapped from them, so `modifierUnits`'
     refusal and the capture strike-through behave exactly as today until 19b replaces them with the
     locked included modifier. Nothing new sets it; Admin does not show it.
   - The code names follow the existing `ProcedureType`/`procedureTypeId` (Phase 20's doc already
     uses them) rather than the design's `procedure_id`, because `procedureId` names a booking
     Procedure's id throughout the store, warnings and actions. App copy says "procedure".
   - The booking `Procedure` gains `procedureTypeId?: ProcedureTypeId` and **loses `rvgBaseCode`**:
     its RVG group is `groupOf(procedureType)`. A Procedure with no procedure prices with no base
     units, as a Procedure with no code does today (OQ-99's blank procedure at setup is Phases 20, 21
     and 33's, D33).
   - `SeedMasters` and `AppState['masters']` replace `rvgCodes` with `bodySections`, `rvgGroups` and
     `procedureTypes`. `allocateId` gains `rvgGroup` and `procedureType`.
   - Pure helpers in the module (tested): `groupOf`, `generalProcedureOf(groupId, masters)`,
     `procedureTypesInGroup(groupId, masters)` (Phase 19a's lines and Phase 26's whole-group prepaid
     selection read it), `generalProcedureName(group, section)` (D37's one rule),
     `systemCodeIsFree(code, masters, except?)` (unique across groups and procedures; letters, digits
     and hyphens, 3 to 20 characters, stored upper case), `searchPicker(query, masters)` (matches
     procedure name, RVG code, group name and system code, case-insensitive, prefix-friendly; returns
     both tabs' matches), `procedureTabSections(masters, query?)` (body section, then subgroup, then
     procedures, retired excluded, general procedure first in its group's subgroup) and
     `rvgTabSections(masters, query?)` (body section, then sub-heading, then groups).
   - No Contract change. Contract lines and their layer are 19a's.

3. **The starting-units resolver and the recorded value** (US-05.1.1, US-05.1.6, DM-43's first two
   layers; AR-29 regions `resolver-layers` and `null-handling`). In the module's `startingUnits.ts`.
   - `resolveStartingUnits({ procedureType, group })` returns `{ base: { units, layer }, modifier: {
     units, layer }, guide: { figure, range? } }` with `layer` one of `'procedure' | 'rvgGroup'`
     (19a adds `'contractLine'` above them, and a `line?` input). A null procedure field looks through
     to the group; a value, 0 included, stops there. The group is always populated, so base units
     always resolve.
   - `baseUnitsFor({ procedure, starting })` returns `{ units, source, starting, outsideGuide }`,
     `source` one of `'overridden' | 'chosen' | 'procedure' | 'rvgGroup' | 'none'`:
     1. `baseUnitsCaptured.source === 'overridden'` (the B stepper's typed value, as today);
     2. on a group with a published range, `baseUnitsSelected` when set (the range row, as today);
     3. else the starting value, with its layer as the source;
     4. no procedure: 0 and `'none'`.
     `outsideGuide` is true only when the source is `'overridden'` or `'chosen'`, the units differ from
     the starting value, and they lie outside the group's range (or differ from its figure where it
     has none). AA's own data (a procedure's own figure) never warns by itself.
   - `resolveBtm` delegates its base branch to `baseUnitsFor`, and adds the resolved starting
     modifier units to the modifier sum (0 for every seeded group and procedure, so nothing moves;
     19b decides how itemised modifiers combine with it). `BtmBreakdown` gains `baseSource`,
     `baseLayer` and `baseGuide` so the UI, the warning rule and 25's snapshot read one answer.
   - `FeeContext.baseCode` becomes `procedureType?` and `rvgGroup?` (or one masters lookup). Both
     assemblers (`feeContextFor`, `procedureFee`), `reviewFlags.naturalBtm`, `invoiceBuild` and
     `seed/billing.ts` `contextFor` pass the same inputs. `modifierUnits` reads the interim
     `includesModifierCodes` from the procedure where it read `absorbsModifierCodes` from the code; its
     behaviour and tests are otherwise untouched (19b's).
   - Tests (`startingUnits.test.ts`): each layer; null inherits and 0 stops; a procedure's own figure
     beats the group's; each `baseUnitsFor` step; `outsideGuide` at the range's min and max (inside),
     min-1 and max+1 (outside), a typed value on a single group that differs from its figure
     (outside), a typed value equal to a procedure's own figure that is itself outside the group's
     figure (not outside), and no procedure (0, `'none'`). Grep `baseUnits.kind` and
     `baseUnitsRange` afterwards: outside the module only display helpers read them.

4. **RV-04 under D3** (`validateBookingForBilling.ts` and 15a's routine).
   - a. **The in-range completion rule goes.** A ranged group starts at its starting figure, so there
     is no unchosen value to block (D35). Delete the rule and its "needs a selected unit value
     between" sentence; update the tests that assert it. Check the parity fixture: a seeded ranged
     Procedure with no chosen value would move from 0 to its starting figure (none is expected; if
     one exists, record it as the only allowed exception).
   - b. **The "something to charge" rule** reads "Pick a procedure or add at least one billing line."
     (a Procedure with a procedure always has base units). The "RVG code {code} is not in the RVG
     master." failure becomes a lookup of `procedureTypeId` ("This procedure is not in the procedure
     list."), keyed on the `procedureTypeId` field.
   - c. **The out-of-range warning** (US-13.7.1; US-03.3.1's "Out of range" criterion, which Phase 20
     closes). One rule, `baseUnitsOutsideGuide`, in 15a's routine, in 15a's rule shape: timing
     **after**, strength **mild**, one Warning per Procedure, raised when `baseUnitsFor(...).outsideGuide`.
     Text: "Base units {n} are outside the RVG guide for {code} ({min} to {max})." or "(guide value
     {v})." for a single figure. 15a's surfacing, clearing and re-raise rules apply unchanged. Mild is
     a picked reading (OQ-56 sets no strength): record it in the Decisions log.
     - Wiring, per 15a: a rule file in `src/domain/warnings/rules/`, appended to `WARNING_RULES` after
       `prepaymentUnpaid`; `baseUnitsOutsideGuide` in the `WarningRuleId` union; an optional fact on
       `WarningFacts` carrying the masters the resolver needs (the rule imports the pure resolver),
       filled by `warningFactsFor`; a default (active, no params) in `appSettings.warningRules`
       through `backfillMerge`, so a persisted store gains it. The finding carries `procedureId` (the
       booking Procedure's id), so the key is per Procedure.
   - d. **Recording a value.** `editProcedure` accepts any whole number of 0 or more for
     `baseUnitsSelected` and the captured override (today's B stepper floor), with "Base units must be
     a whole number." otherwise. No range check anywhere in the store.
   - e. Tests: an out-of-range value passes completion and raises the warning; a value inside the
     range raises none; a typed value equal to the starting value raises none; an outside value never
     blocks completion, submit or authorise (one store test through each); two outside Procedures on
     one Booking give two warnings; **the pristine seed raises no `baseUnitsOutsideGuide` warning
     anywhere** (so the to-do list is not flooded at load).

5. **Contract price rows re-keyed** (forced by retiring the invented codes; no fee moves). Whatever
   shape Phase 18 left the Type 3 fixed-price rows in, their `rvgBaseCode` match key becomes
   `procedureTypeId` (the three seeded rows: gastric bypass, sleeve gastrectomy and the second-procedure
   umbilical hernia row keep their prices and ordinal). `contracts.ts`' match compares the
   Procedure's `procedureTypeId`; `contractActions.ts` and `ContractEditSheet`'s price row pick a
   procedure (a select listing name and system code) in place of a code. This is the smallest re-key
   that keeps 18's terms working: Phase 19a replaces these rows with Contract lines keyed by
   procedure, and its parity test starts from them.

6. **Seed** ([AR-16](../../../../requirements-board/requirements/artifacts/AR-16.md); AR-35's table;
   AR-34's included-modifiers CSV for the Neurosurgery and Spine codes). One `PERSIST_VERSION` bump for
   the whole phase. **Draw nothing new from the seeded RNG**, so every generated Booking stays
   identical. Keep the masters in a new `seed/rvgGroups.ts` and `seed/procedureTypes.ts` (replacing
   `rvgCodes.ts`), demo-sized and labelled "Demo-sized: the full NZSA 2021 set and AA's procedure list
   load through Phase 42".
   - a. **Body sections** in the guide's order, every one the guide prints (Supervision, Head, Neck,
     UPPER LIMB, THORAX, SPINE, ABDOMEN, PERINEUM, PELVIC, VASCULAR, LOWER LIMB, ANAESTHESIA IN REMOTE
     LOCATIONS, PAIN CONSULTATIONS AND PROCEDURES), in sentence case for display.
   - b. **RVG groups as published**, codes, names, sub-headings, base units and ranges from the guide:
     - every group AR-35's illustrative wording maps to, including each alternative it names (H1, H2,
       H3, H4, H5, H6a, N1, T1, both T2s, T3, UL1, UL2, UL3, LL1, LL3, LL4, LL5, LL6, A1, A2, A3, A4,
       P1, P2, P4, E1, E2, S2, S6, S8b, S9b), so Phase 20a can seed its wording;
     - every Neurosurgery (H7A, H7b, H8a, H8b, H9a, H9b) and Spine (S1 to S10, with S3a, S3b, S8a,
       S8b, S9a to S9c) group, from the AR-34 CSV, so Phase 19b can lock P1 on them;
     - the groups the remap below needs (for example A5, A7, A8, N3, UL4, V1, H6b), at least one group
       in every body section, and both P6s (Urology and Obstetric) to show why the printed code is not
       a key;
     - system codes `RVG-{code}`, with a suffix where the guide repeats a code (`RVG-T2-MINOR`,
       `RVG-T2-SIMPLE`, `RVG-P6-URO`, `RVG-P6-OBS`);
     - published ranges (H4, N4, T5c, A4, A6, A12, A13, R2) with the lower bound as the starting figure.
     - Mind the clashes with modifier and time codes (RVG groups P1, A1 and A2 against the positioning
       and age modifiers; T1 and T2 against the guide's time codes): masters key groups by id, never by
       printed code, and the UI always shows a group's code with its section or name.
   - c. **AA's own groups**, beside the published ones under a body section, wherever a seeded
     Procedure's recorded value would fall outside its real group (so the pristine seed raises no
     warning): one per legacy ranged code that no published range holds, carrying today's range with
     its lower bound as the figure (for example "Skin flap repair", 4 to 6, under the body section that fits,
     for 45030; a hip revision group, 8 to 10, for 47522; a lumbar laminectomy group, 6 to 8, under
     SPINE Lumbar for 51011), with system codes `AA-{mnemonic}` and no marker. Check 20880 the same way
     (A8 holds 10; a generated draw of 9 or 11 would not fit).
   - d. **Procedures**, about 80 to 100, in AA subgroups ("General", "Joint replacement", "Arthroscopy",
     "Upper GI", "Hernia", "Ophthalmic", "Breast"), system codes of a section prefix and a mnemonic
     (`LL-TKR`, `ABD-LAPCHOLE`):
     - the general procedure of every seeded group, named by D37's rule;
     - one procedure for each legacy code (`RVG_CODES`), named from today's description or AA's
       Master Fee List, under the real group the guide's examples point to (for example
       laparoscopic cholecystectomy under A3, total hip replacement under LL4, knee arthroscopy under
       LL1, TURP under P4, cataract under H6a, varicose veins under V1), with **its own base units
       wherever the group's figure differs from today's figure** (appendicectomy, laparoscopic: own 5
       under A3's 6; total hip replacement: own 7 under LL4's 8), or under item c's AA group for the
       legacy ranged codes;
     - one procedure per distinct "Procedure (invoice wording)" in AR-35's table, with a trailing side
       ("right", "left") dropped so one procedure serves both sides (the side stays in the source
       wording, 20a): log that reading for the owner;
     - a few own-figure variants, among them "Face-lift" under H3 (inherits 6) and "Face-lift complex"
       under H3 with its own 10 (US-05.1.6's example), and two procedures sharing one group (for
       example "Skin lesion excision, simple" and "Skin flap repair, complex" under the skin group);
     - `includesModifierCodes: ['P1']` on exactly the procedures remapped from the seven legacy
       absorbing codes (interim, item 2).
   - e. **Remap every seeded Procedure** (scenario Procedures in `bookings.ts`, the history rows in
     `history.ts`, the generator's `GENERAL_CODES` and `EYE_CODES`, `audit.ts`) through one internal
     table, `LEGACY_CODE_TO_PROCEDURE` (legacy code to procedure system code, plus the legacy range
     where there was one), so the generator draws exactly as today: it keeps reading the legacy range
     for its RNG draw and then writes `procedureTypeId`. Ranged Procedures keep their drawn
     `baseUnitsSelected`. Each Procedure's resolved B must equal today's (item 1's record); the parity
     fixture proves the fees. The table is seed-only and never read at runtime.
   - f. **Intake fixtures and triggers** that carry a code: `messages.ts`' `operation.code`, the
     phone-advice prefill and any demo trigger that creates a Procedure point at a procedure by system
     code (the specific one where the fixture names it, else the group's general procedure). The
     operation text in a message stays as the Procedure's `description` (the interim received wording).
   - g. `seed.test.ts`: every group has exactly one non-retired general procedure; every procedure's
     group exists; system codes are unique across both lists; base units above 0 on every group and
     ranges hold the figure; every seeded Procedure's `procedureTypeId` resolves; every AR-35 group and
     every H7A to H9b and S1 to S10 group is present; no seeded Procedure is `outsideGuide`; every
     body section has a group; `includesModifierCodes` sits only on the procedures from the seven
     legacy absorbing codes; the generated Bookings are identical to the baseline (ids, dates,
     patients, procedures' times).

7. **Store actions** (office-only, audited, returning `Outcome`, following `mastersActions.ts`; a new
   `src/store/rvgMasterActions.ts` exported from `store/index.ts`).
   - a. **RVG groups** (US-05.1.1, FT-05.1). `createRvgGroup` validates a free system code, a non-empty
     code and name, an existing body section, base units a whole number above 0, a range (if any)
     holding the figure, and modifier units a whole number of 0 or more; it creates the group's
     general procedure in the same commit, named by D37's rule. `editRvgGroup` edits every field but
     the id (the surrogate key means a code edit breaks nothing; a Procedure keeps its link). An
     edited figure re-prices unlocked Procedures that inherit it (no snapshot until 25); built
     invoices keep their amounts. Say so in a test. `retireRvgGroup` and `restoreRvgGroup`: retiring
     hides the group and its procedures from the picker, keeps them for existing Procedures, and
     retires its procedures in the same commit.
   - b. **Procedures** (US-05.1.6). `createProcedureType`, `editProcedureType`, `retireProcedureType`,
     `restoreProcedureType`. Save requires a name, an existing non-retired group, a subgroup and a free
     system code; own base and modifier units are null (inherit) or a whole number of 0 or more (a 0
     base is allowed, AR-29 `null-handling`). A duplicate name in the same group is refused. A
     general procedure cannot be retired or moved to another group (rename it instead), and
     `isGeneral` is never set by hand.
   - c. **Picking** (the picker's two routes). `pickProcedure(api, actor, procedureId, procedureTypeId)`
     writes in one audited commit: `procedureTypeId`; when the group changes, `baseUnitsSelected` and
     `baseUnitsCaptured` cleared (the starting value then shows); and `description` set to the
     procedure's name when the description is empty or still equals the previous procedure's name, so
     typed or received text survives. `pickRvgGroup(api, actor, procedureId, rvgGroupId)` does the same
     with the group's general procedure (Phase 20 inserts the Contract step). Both follow
     `editProcedure`'s rights (the anaesthetist on an ACTIVE Booking, the office per its edit rules).
     `createBooking`'s input gains `procedureTypeId`, validated the same way.
   - d. Tests (`store/rvgMasterActions.test.ts`): every guard and audit entry above; a group's general
     procedure created with it; a retired procedure absent from both tabs and still pricing an
     existing Procedure; a group edit re-pricing an ACTIVE Procedure that inherits and not one with
     its own figure; `pickProcedure` keeping typed text and clearing a chosen value only on a group
     change; `pickRvgGroup` setting the general procedure; refusal for the anaesthetist on a SUBMITTED
     Booking; a system code used on either list refused.

8. **Re-point every reader** of `rvgBaseCode`, `RvgCode`, `rvgCodes` and `RVG_CODES` (grep both lists
   from the Reference). `ReviewScreen`'s code column shows the group's code (mono) with the procedure
   name as its title; `BookingDetailBody` and `selectors.ts` read the procedure; `fieldLabels.ts` gains
   `procedureTypeId: 'Procedure'` and drops `rvgBaseCode`. `CodePickerSheet` is re-pointed just enough
   to list groups and call `pickRvgGroup` (session 2 replaces it).

   **Session 1 ends here, green:** `npm run build`, `npm run build:pwa`, `npx vitest run`, and the
   parity fixture unchanged.

9. **Admin, Master data** (`MasterData.tsx`, desktop; teal actions; tables in the existing chrome). New
   sheets `RvgGroupSheet` and `ProcedureTypeSheet` in `src/apps/admin/flows/`, each a new member of the
   `Sheet` union.
   - a. **RVG groups** (the `rvgCodes` tab renamed `rvgGroups`, label "RVG groups"). Rows grouped under
     body section headers. Columns: System code (mono), Code (mono), Name, Sub-heading, Base units
     (mono: "6", or "10 · range 10 to 12"), Modifier units (mono), Procedures (count), and a neutral
     "Retired" pill where it applies. A search box (`searchPicker`, group results) and a body-section
     filter. "Add group" opens `RvgGroupSheet` (system code, code, name, body section, sub-heading, base
     units, an optional range, modifier units); row "Edit" opens the same sheet; "Retire" and "Restore"
     row actions. Subheading: "The NZSA RVG 2021 groups AA prices from, plus AA's own. Demo-sized; the
     full set loads at go-live." One provisional note, as a `DemoBadge`: "Provisional · a starting
     figure with the published range beside it (OQ-101)."
   - b. **Procedures** (new tab, label "Procedures"). Rows grouped by body section, then RVG group.
     Columns: System code (mono), Procedure, Subgroup, RVG group (mono code with its name), Base units
     and Modifier units (the own figure in mono, or the inherited figure greyed, "6 from H3"), a neutral
     "General" pill on each general procedure, and Linked (count of Procedures). New and Edit open
     `ProcedureTypeSheet`: name (the invoice wording), system code, a searchable RVG group select,
     subgroup, and base and modifier units each with an explicit inherit or override choice showing
     the inherited value as a greyed placeholder (AR-29 region `null-handling`). One provisional note,
     as a `DemoBadge`: "Provisional · system codes are on both RVG groups and procedures, and a general
     procedure's name is still to confirm with AA (OQ-88, OQ-103)."
   - c. Both tabs: an "Active" or "All" filter (retired rows greyed). Every action is audited and shows
     in the audit viewer.
   - Add `data-shot` hooks: `masters-rvg-groups`, `masters-procedures`, `rvg-group-sheet`,
     `procedure-sheet`.

10. **The two-tab picker, mobile, web and Admin (shared)** (FT-05.1, US-05.1.3, US-05.1.6; FT-04.3's
    layout). `BtmCaptureBlock` is shared by the mobile Booking, the web Booking and the Admin Booking
    detail, so this is one change for all three.
    - a. **`ProcedurePickerSheet`** (new, `src/shared/capture/`), replacing `CodePickerSheet`, which is
      deleted. Title "Procedure". One search box ("Search procedure, RVG code or system code") above a
      two-segment control, **Procedures** and **RVG codes**, each segment carrying its match count while
      a search is typed. Under it, a horizontally scrolling chip row of body sections jumps to that
      section in the active tab (jump-to-section, not a filter).
      - Procedures tab: body section headers, subgroup sub-headers, then rows: the procedure name
        (semibold), the mono system code and RVG code, and "B 6" (the starting figure; "B 10 to 12" on a
        ranged group). The general procedure sits first in its group's rows with a neutral "General"
        pill.
      - RVG codes tab: body section headers, the guide's sub-headings, then rows: the mono code, the
        group name, and "B 6" or "B 10 to 12". Picking calls `pickRvgGroup` (the general procedure).
        A caption under the tab: "Picking a code uses its general procedure."
      - The current procedure is tinted teal. Empty state: "No procedures or RVG codes match that
        search." A bottom sheet on mobile; the surface's overlay on web and Admin (`useSurface`).
    - b. **`ProcedureCodeCard`** (section label "Procedure"; keep the `capture-procedure-code` hook and
      the "Change" action, which 18 recipe steps across US-03.3.1 and US-03.3.2 click). The hook is
      derived from the section label (`CaptureSection` in `shared/capture/ui.tsx`, line 36), so the
      rename alone would turn it into `capture-procedure`: give `CaptureSection` an optional explicit
      `shot` prop and pass `procedure-code` here, so the hook stays. With a procedure: its name, the mono
      system code and RVG code beneath, and "Base 6 units · from A3" (or "· this procedure's own
      figure"). Nothing yet: "No procedure yet" and "Choose". The 2026-09-28 ruling holds: base units
      are capture context, and the anaesthetist's Booking still shows no fee.
    - c. **`RangeUnitsRow`** drops its clamp: floor 0, no ceiling, steppers move by one, and tapping
      the value opens a numeric input (`inputMode="numeric"`). It starts at the starting figure. The
      label reads "Guide 10 to 12 · 11 chosen". Outside the range, a warn-tinted caption (not an
      error): "Outside the guide range. The office will see a warning after the procedure."
    - d. `UnitsCard`'s B caption comes from `baseSource` and `baseLayer`: "From the RVG group",
      "From this procedure", "Chosen", "Set manually", with ", outside the guide range" when
      `outsideGuide`.
    - e. Modifier chips are untouched (19b's), apart from reading the interim
      `includesModifierCodes` from the procedure where they read the code's absorbed list.

11. **Creation paths pick a procedure too.**
    - `ManualBookingForm` (mobile and web add, Admin add, phone advice): the "Procedure code" select
      becomes a "Procedure" chooser row that opens `ProcedurePickerSheet`. Picking fills the operation
      text (still editable) and passes `procedureTypeId` to `createBooking`. It stays optional.
    - `addProcedure` and every path that creates a Procedure carry `procedureTypeId` where they
      carried `rvgBaseCode` (grep `rvgBaseCode:` to confirm none is left).

12. **Copy and label sweep.** Search `src/` for "RVG codes" (the Admin tab), "view only" on the RVG
    tab, "Procedure code", "Search code or name", "No codes match", "anatomical", "between {min} and
    {max}", "needs a selected unit value" and "Add an RVG base code", and update each. Every new
    string follows the no en or em dash rule; ranges use "to". The only provisional labels are the two
    notes in item 9, using `DemoBadge` (`src/shared/DemoBadge.tsx`), never crimson. No "slot" in app
    copy.

13. **Warning sample** (see Demo triggers). Add this rule's entry to 15a's `WARNING_SAMPLES` in
    `src/store/warningSamples.ts`, in 15a's entry shape, never in an app folder, and update 15a's "1
    rule registered" message and its registry test: the `multiWarning` Booking now shows two warnings.

14. **Playwright and green.**
    - Update the code picker shots in `mobile-phase04.spec.ts` (now the two-tab picker) and
      `a7-04-masters` (the RVG groups tab).
    - Add specs for: the two Admin tabs; adding a group (its general procedure appears on the
      Procedures tab) and a procedure under it, then picking that procedure in the mobile picker; the
      RVG codes tab picking a code (the card shows its general procedure); jump-to-section; a
      system-code search; a typed out-of-range value on H4, its caption, completion succeeding, and the
      warning on the Admin to-do list.
    - Run `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots`, all green, with
      the parity fixture unchanged.

## Demo triggers

- **15a's "Raise sample warnings" gains an out-of-range sample**, wherever 15a registered it (Admin ·
  Day and Admin · Booking detail on the bar; Mobile · Booking on the bar and the PWA), so it reaches
  the handset with no new entry. On the Day view it targets 15a's pinned
  `SEED_WARNING_SAMPLE_BOOKINGS`, including `multiWarning` (which now shows two warnings: the
  prepayment one and this one); on a Booking (Admin or mobile), the Booking in the URL. On each target
  it takes the first Procedure with a procedure (a stable rule, never a hardcoded id) and records base
  units of the larger of the group's guide top and the starting value, plus 2: as `baseUnitsSelected`
  on a ranged group, else as a manual override. A target with no Procedure carrying a procedure gets
  its first Procedure set to the H4 general procedure with 14 chosen. All through the audited
  `editProcedure` and `pickProcedure` as 15a's `DEMO_TRIGGER_ACTOR`. `isStaged` is true when that
  Procedure's base fields differ from the pristine seed and hold the sample's values; `unstage`
  restores them from the seed and drops the clearance of the per-Procedure key it staged, as 15a's
  prepayment sample does. It shares all of 15a's disabled states (among them "Samples already raised",
  "This Booking's List is authorised", "Samples stage on seeded Bookings only" and "Nothing to stage
  on this Booking").
- **Normal use, no new button:** in mobile, web or Admin capture, typing base units outside the
  guide is accepted, and the warning lands on the office's to-do list, as a triangle on the Booking in
  all three apps, and on opening it (15a).
- **Product UI:** Admin · Master data · RVG groups and Procedures: add a group or a procedure and pick
  it in capture.
- Everything else (the masters, the two-tab picker) is normal use. No Control Panel change. PWA: the
  picker, the unclamped range and the triangle reach the PWA through the shared capture components,
  so these beats are normal use on the handset; no mobile beat waits on the office (a warning never
  blocks), so no PWA stand-in is needed; clearing uses 15a's "Office clears this warning". Master
  edits are Admin-only; the PWA shows them when the handset reloads its seed, like any other master.

## Out of scope

- Modifiers in every form: the NZSA modifier table, itemised modifier records, explanations, locked
  age and the included P1, the ASA card, absorbed modifiers out, procedure defaults (Phase 19b,
  US-05.1.4, US-05.1.5, US-03.3.4, US-03.3.8, DM-44, RV-23). The interim `includesModifierCodes` keeps
  today's behaviour until then.
- Contract lines, the Contract line layer of the resolver, first-party price lists and the RVG time
  tiers as data (Phase 19a). The Contract pick after the picker, the RVG-code route to the lines
  across a group, and the review flag on a Procedure left on a general procedure (Phases 20 and 21,
  OQ-103). A blank procedure at setup (Phases 20, 21 and 33, OQ-99).
- Source wording on the Procedure and the three-part stack (Phase 20a), seeded from AR-35 on top of
  this phase's groups and procedures.
- The price precedence (Phase 24); the pricing snapshot of the resolved values and layers (Phase 25);
  the prepaid tick list of procedures and whole groups (Phase 26).
- Spreadsheet loads of groups and procedures, the full NZSA set and Vanessa's full list (Phase 42).
- Warning thresholds, mutes and the warning settings page (US-13.7.4, Future).
- Tags across groups (US-05.1.3's Verify point, unless the drift check settles it).
- Real AA unit values: published RVG figures are the guide's; AA's own groups and procedure figures
  stay demo-plausible and labelled.

## Manual test checklist

The agent runs every item itself in the running app and reports it with evidence; none is handed
to the owner (ROADMAP.md "Owner review: agents test themselves").

- [ ] Admin → Master data → RVG groups: groups sit under body sections in the guide's order; H4 shows
      "10 · range 10 to 12"; both T2s and both P6s show with their own system codes. Search "RVG-S9"
      finds S9a to S9c; the body-section filter narrows to SPINE. The OQ-101 note shows here only.
- [ ] Add group (for example code and system code `AA-BROW`, "Brow lift", Head, base 5): it saves with a general
      procedure "Brow lift (AA-BROW)" (D37's rule), both audited. A base
      of 0, a range that does not hold the figure, and a system code already used are each refused.
- [ ] Procedures: "Face-lift" shows "6 from H3" greyed; "Face-lift complex" shows its own 10. Every
      group has one "General" row. Adding a procedure under the new group with inherited units saves;
      retiring the general procedure is refused; retiring another hides it from the picker while an
      existing Procedure on it still prices. The OQ-88 and OQ-103 note shows here only.
- [ ] Editing H3's base units to 7 changes an ACTIVE Procedure on "Face-lift" (B 7) and not one on
      "Face-lift complex" (B 10); an already built invoice does not change. Set it back.
- [ ] Mobile capture on an ACTIVE Booking: "Change" opens the two-tab picker. Searching "chole" shows
      matches on both tabs with counts; a body-section chip jumps to that section. Picking
      "Laparoscopic cholecystectomy" shows "Base 6 units · from A3". On the RVG codes tab, picking H3
      sets "Head, moderate procedure (H3)". Typed operation text is not overwritten.
- [ ] Ranged group (H4 general procedure): the range row starts at 10; typing 14 is allowed, with the
      "Outside the guide range" caption. Mark complete and submit succeed. The Admin to-do list shows
      "Base units 14 are outside the RVG guide for H4 (10 to 12).", and the Booking carries the
      triangle in mobile, web and Admin and shows the warning on opening. Clearing works as 15a
      defines. A value of 11 raises nothing.
- [ ] Web capture and the Admin Booking detail behave the same; the manual add form and phone advice
      open the same picker.
- [ ] Admin Day Tue 21 → Demo actions → "Raise sample warnings" includes the out-of-range sample; the
      `multiWarning` Booking shows two warnings, each with its own text. "Clear sample warnings"
      restores its Procedure's seed values. On the PWA (5174), a seeded ACTIVE Booking's demo-actions
      sheet raises the sample on that Booking, and the warning shows on opening it.
- [ ] No warning is on the to-do list at a fresh reset (the pristine seed raises none of this rule).
- [ ] A hip replacement (BK0009) still shows Positioning struck through with its caption (19b's
      to remove), and its fee is unchanged.
- [ ] S1 Beat 3 (Sarah Mitchell, "Appendicectomy, laparoscopic", B 5 from its own figure) and S3's
      fee figures are unchanged, and the parity test is green.
- [ ] Audit viewer: rvgGroup, procedureType, pickProcedure and pickRvgGroup entries appear with before
      and after values.
- [ ] No en or em dash in any new app copy (grep the diff). Actions are teal, pills neutral, no
      crimson, no "slot".
- [ ] Catalogue screenshots: the recipes for FT-05.1, US-05.1.1, US-05.1.3 and US-05.1.6 are created
      or updated, every recipe this phase broke is re-pointed, a full `npm run capture` ends with no
      failed recipe and no story without a recipe, the covered items' new shots are checked by eye,
      and `npm run verify:board` is green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots` and `npm run verify:board`
      green.

## Demo guide updates

No scripted figure changes. Patch the wording these beats carry, and the same sections of
`master-demo-guide.html`, in the same session:

- `03-demo-script.md` **S1 Beat 3** ("capture BTM on mobile"): "Choose procedure **20950 —
  Appendicectomy, laparoscopic**" becomes a pick on the Procedures tab (search "append", pick
  "Appendicectomy, laparoscopic"), unless Sarah now arrives with a procedure through the hospital
  message path, in which case the click is dropped; the Expected text names the procedure card as it
  now reads ("Base 5 units · this procedure's own figure"). Add an optional "Worth pointing at": the
  RVG codes tab, browsing the guide's codes by body area.
- `03-demo-script.md` S5 discovery points: add RVG groups as published with AA's own beside them, the
  procedure list with a general procedure per group, the two tabs, and OQ-88, OQ-101 and OQ-103. Add
  an optional S5 "Worth pointing at": Admin → Master data → Procedures, showing "Face-lift" inheriting
  H3's 6 and "Face-lift complex" at its own 10.
- `04-presenter-cheat-sheet.md` "Fee calculation": "The anaesthetist selects the RVG code; the system
  does not automatically infer it" becomes "The anaesthetist picks the procedure from AA's procedure
  list (or browses the RVG codes); the system does not infer it". "Some RVG codes are ranges and
  require professional judgement" becomes "A ranged group starts at its starting figure; any value is
  accepted, and one outside the guide raises a warning for the office after the procedure, never a
  block". Add "Base units sit on the RVG group; a procedure may set its own figure; a Contract line may
  override both (next phase)". Leave the positioning line for Phase 19b. In "Statements to avoid",
  keep "The app automatically chooses the clinical RVG code."
- `02-workflows-and-handoffs.md` capture step 3 ("For each Procedure she selects the RVG base code")
  becomes "For each Procedure she picks the procedure (Procedures tab) or an RVG code (RVG codes tab);
  on a ranged group she may change the starting figure, and an out-of-range value raises an office
  warning". Steps 6 to 8 (ASA, positioning, modifier bands) are Phase 19b's.
- `01-personas-and-responsibilities.md` line 42 ("Record ASA, RVG code, ...") becomes "Record the
  procedure, ..."; the ASA wording is Phase 19b's.
- `master-demo-guide.html`: the same sections.
- Control Panel scenario text: grep `src/apps/demo` for "RVG code" and "20950" and update any match.

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19),
run after the review pass and before the PROGRESS.md entry. Re-run
`node docs/prototype-build/catch-up/tools/recipe-status.mjs 19` first: earlier phases may have
changed these recipes since this plan was written. Many current captions describe the old flat RVG
code master ("RVG codes with ... absorbed modifiers", "grouped by anatomical site"): each is replaced
by the recipe update below, never left standing. Because this phase covers FT-05.1, the tool also
lists its modifier stories US-05.1.4 and US-05.1.5: they are Phase 19b's to re-shoot, and this
phase only keeps their recipes running (see "Recipes this phase breaks"). US-05.1.1, US-05.1.3 and
US-05.1.6 are this phase's.

**Covered items.** When the phase is done, each recipe in `requirements-board/capture/recipes/`
matches what was built:

| Item | Recipe at plan time | When this phase is done |
|---|---|---|
| [FT-05.1](../../../../requirements-board/requirements/stories/FT-05.1.md) RVG groups, procedures and modifiers | captured · admin-rvg-codes ("RVG code master") | Stays `captured`, re-pointed. Replace `rvg-codes` (it clicks "RVG codes") with `rvg-groups` (the RVG groups tab, `masters-rvg-groups`; caption "RVG groups as published, under body sections, plus AA's own") and add `procedures` (the Procedures tab, `masters-procedures`; caption "The procedure list, each procedure in one RVG group, with a general procedure per group") and a mobile `picker` shot (the two-tab picker open on Procedures; caption "Find a procedure by body area, subgroup and procedure, or browse the RVG codes"). The modifier list half stays with Phase 19b |
| [US-05.1.1](../../../../requirements-board/requirements/stories/US-05.1.1.md) RVG groups | captured · admin-rvg-codes ("RVG codes with description, site, base units or range, and absorbed modifiers") | Stays `captured`. Re-shoot as `rvg-groups` on the RVG groups tab (highlight the System code, Base units and Modifier units columns; caption "Each RVG group has a system code, base units above 0 and modifier units") and add an `add-group` state with `RvgGroupSheet` open (caption "AA can add its own groups and set their base units"). The old caption goes |
| [US-05.1.3](../../../../requirements-board/requirements/stories/US-05.1.3.md) Body sections and AA groups | partial · admin-rvg-sites, web-code-picker, mobile-code-picker ("grouped by anatomical site") | `partial`, reason rewritten: "Whole-group prepaid marking is built in Phase 26." Re-shoot `rvg-sites` as the RVG groups tab's body-section headers with an AA group among them (caption "RVG groups under body sections, with AA's own beside them"), and `code-picker` on web and mobile as the two-tab picker: state `procedures` (Procedures tab, highlight a body section with its subgroups) and state `rvg-codes` (RVG codes tab, highlight a sub-heading such as Ocular), captions "Procedures under body section and subgroup" and "RVG codes under body section and the guide's sub-headings". Keep the shot names |
| [US-05.1.6](../../../../requirements-board/requirements/stories/US-05.1.6.md) Procedure master mapped to RVG codes | absent · "Not built yet: catch-up Phase 19 builds this." | `partial`, `absentReason`: "A Contract line setting base units for a procedure is built in Phase 19a, and reaching a procedure through the Contract lines offered for an RVG code in Phase 20." Admin shots: `procedure-list` (`masters-procedures`, highlight "Face-lift" inheriting "6 from H3", "Face-lift complex" at its own 10, and a "General" row; caption "Each procedure is in one RVG group and uses its base units unless AA sets its own") and an `edit` state with `ProcedureTypeSheet` open (the inherit or override choice); a mobile `rvg-route` shot (RVG codes tab, pick H3, the card showing "Head, moderate procedure (H3)"; caption "Every RVG group has a general procedure"). Phase 19a turns it `captured` |

**Recipes this phase breaks.**
- `US-05.1.4` (19b's item, still `captured` with the retired absorbed reading): its admin
  `rvg-absorbs` shot clicks "RVG codes" and highlights the Absorbs column, which goes. Drop that shot;
  the web and mobile `absorbed-positioning` shots still render (absorption is kept until 19b through
  `includesModifierCodes`), so keep them and set the status `partial` with "Phase 19b replaces
  absorbed positioning with the included P1, locked at 0 units, on Neurosurgery and Spine codes."
- `US-03.3.1` (Phase 20's, `captured`): `rvg-picker` `open` and `search` fill
  `input[placeholder="Search code or name"]` and show the old single list. Re-point to the new
  placeholder; `open` shows the Procedures tab, `search` searches "chole"; captions "Two-tab picker:
  Procedures and RVG codes" and "One search across procedure, RVG code and system code"; `closed`
  re-captioned "The Procedure card with its procedure, codes and starting base units"; the shot-level
  caption "RVG code picker" becomes "Procedure picker", keeping the shot name. Its ranged
  images are today US-03.3.2's shots (`ranged-base-code`, the 8 to 10 hip revision, now an AA group):
  move them into US-03.3.1's own recipe as a `ranged-base-units` shot on web and mobile, re-shot on a
  Booking set to the H4 general procedure, states `start` (caption "A ranged group starts at its
  starting figure") and `outside` (14 typed; caption "Any value is accepted; outside the range raises
  a warning for the office"). Status unchanged (Phase 20 decides it).
- `US-03.3.2` (Retired, merged into US-03.3.1, still `captured`): it clicks "Change" and fills the
  old placeholder. Set it `absent` with "Retired: merged into US-03.3.1", no shots, once US-03.3.1
  carries the ranged states.
- `US-13.4.1` (Phase 42's): its `rvg-codes` state is captioned "Master data, RVG codes (view only)"
  and clicks the old tab. Re-point it to "RVG groups", caption "Master data, RVG groups and
  procedures", and trim "RVG codes" from its `absentReason` list of view-only masters (keep what is
  still true; "There are no ... RVG groups" goes).
- `US-05.1.2` (Retired, `absent`): reword its `absentReason` to "Retired: merged into US-05.1.1".
- `US-03.3.4`, `US-03.3.5` and `US-05.1.5` (19b's) should still match (modifier chips and the
  modifier tab are untouched); the `--dry` run is the check.

**ATLAS.md.** Overlays (the two-tab picker replaces the code picker), Existing hooks
(`masters-rvg-groups`, `masters-procedures`, `rvg-group-sheet`, `procedure-sheet`; the `masters-rvg`
tab hook gone; `capture-procedure-code` kept), Master data tab names, and Seed data (body sections, the
RVG groups as published with their system codes, AA's own groups, the procedures with own figures,
"Face-lift" and "Face-lift complex", the general procedures). Routes are unchanged.

## Adversarial review (after build)

After the manual test checklist and the four commands are green, and before writing the PROGRESS entry,
run the standard **adversarial review-and-fix pass (PROGRESS convention 18)**. Fan out about three
independent Opus review subagents, one each for **quality**, **bugs/correctness** and **plan adherence**,
plus a fourth on **billing maths**, because the resolver sits under every fee. This session then
independently verifies every finding against the catalogue files, this doc and the code, fixes the
confirmed ones (with a test for each bug), re-greens, and records the pass. Do not re-raise anything
settled in the Decisions log.

**Steer this phase's reviewers at:**

- **No figure moved.** The parity fixture is byte-identical. Every seeded Procedure's B equals
  today's (own figures where the real group differs; AA groups for the legacy ranges); generated
  Bookings are identical (the generator still draws from the legacy ranges through the seed-only
  table); the three Type 3 price rows match by procedure with the same prices. S1 Beat 3 and the S3
  figures unchanged.
- **The pricing model is in one place.** Groups, procedures, the general-procedure rule, search and
  grouping, and the resolver live in one `domain/billing` module behind types the UI reads; no
  component computes a layer, a range check or a general procedure itself; `domain/types.ts` only
  re-exports. A v5 change to RVG_GROUP or PROCEDURE would touch that module and the seed only.
- **One starting-units answer.** Procedure then group (null inherits, 0 stops), then the recorded value
  (override, then a chosen value on a ranged group). Both fee-context assemblers, `invoiceBuild`,
  `seed/billing.ts`, `naturalBtm` and the warning rule pass the same inputs. 19a's change is one more
  input and one more layer.
- **D3 is done exactly.** No clamp in the UI, no range check in the store, no range refusal in the
  validator. An outside value raises one mild after-procedure warning per Procedure through 15a's
  routine and blocks nothing; AA's own figures never warn; the pristine seed raises none; the
  `multiWarning` Booking shows two warnings. The rule is wired as 15a requires.
- **The masters hold.** Every group has exactly one general procedure, created with it and never
  retired alone; system codes unique across both lists; base units above 0 on every group; ranges
  hold the figure; printed codes never used as keys (two T2s, two P6s; RVG P1, A1 and A2 never
  confused with the modifiers); retiring hides but never breaks an existing Procedure; every write
  office-only, through `mutate()`, audited; `PERSIST_VERSION` bumped once; no new RNG draw.
- **The picker follows FT-04.3.** Two tabs, each one list under body sections with jump-to-section,
  one search across name, RVG code and system code; the RVG codes tab sets the general procedure;
  `CodePickerSheet` is gone; mobile, web, the Admin Booking detail, the manual form and phone advice
  all use the new sheet; typed text is not overwritten.
- **No modifier work and no Contract work.** Nothing in modifiers changed beyond reading the interim
  `includesModifierCodes` (19b's); no Contract line, no Contract pick, no general-procedure review
  flag, no prepaid UI, no loader, no warning settings. No "default modifier" anywhere. Plus the usual:
  teal-only actions, no dashes in copy, mobile sheets not modals, `pwaPurity` green.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry; ROADMAP.md "Owner review: agents test
  themselves"): D39/OQ-88 built as two levels with a system code on both; D35/OQ-101 a starting figure
  (the lower bound) with the range beside it, and a ranged group never blocking completion; D37/OQ-103
  the general procedure's name rule; US-05.1.3's AA groups beside the published ones, no tags; the AA
  groups made for the legacy ranged codes; the seeded procedures' own figures that keep today's fees
  (each one listed, since the real group differs); AR-35's procedures with the side dropped; the mild
  warning strength; the demo-sized seed; anything logged rather than fixed; and the screens worth a
  look, each with its route and persona.
- **Catalogue screenshots result:** the recipes filled in (US-05.1.6), re-pointed (FT-05.1, US-05.1.1,
  US-05.1.3) and the broken ones fixed (US-05.1.4, US-03.3.1, US-03.3.2, US-13.4.1, US-05.1.2), the
  `requirements-board/capture/REPORT.md` counts (captured, partial, absent, failed) before and after,
  and the partial reasons handed on: US-05.1.6 to Phase 19a (the Contract line layer), US-05.1.3 to
  Phase 26 (whole-group prepaid), US-05.1.4 to Phase 19b.
- Status row for catch-up Phase 19, and a phase entry: what was built, the parity result, the review
  pass (findings confirmed and fixed, anything not treated as a defect and why), tests added, and the
  `PERSIST_VERSION` bump.
- **Decisions log:**
  1. Base units sit on the RVG group, overridden by a procedure's own figure (OQ-62's 2026-10-07
     settlement), superseding D12's default RVG Contracts and the "procedure list holds no base units"
     reading; the starting-units resolver has two layers until 19a adds the Contract line.
  2. RV-04 under D3 (OQ-56): any base-unit value, typed or stepped; an out-of-range recorded value
     raises a mild after-procedure warning (mild is a picked reading). With D35's starting figure, a
     ranged group no longer blocks completion. Supersedes the Phase 04 in-range completion rule and
     stepper clamp.
  3. The capture picker has two tabs, Procedures and RVG codes, with one search and jump-to-section
     (FT-04.3), superseding the Phase 04 RVG code picker grouped by anatomical site.
  4. The NZSA RVG 2021 groups replace the invented 5-digit codes (Decisions log 2026-07-22's
     demo-plausible RVG values superseded for the published groups); seeded Procedures keep their fees
     through own figures and AA groups.
  5. The 2026-10-02 readings superseded: "default modifiers pre-filled and untickable" (19b builds the
     locked included modifier instead) and the AA tags as many-to-many groups.
  6. Code names: `ProcedureType`/`procedureTypeId` for the design's PROCEDURE, because `procedureId`
     already names a booking Procedure; app copy says "procedure".
- **Handoff list:**
  - 19a adds the Contract line layer (`'contractLine'`, a `line?` input to `resolveStartingUnits`)
    above `'procedure'` and `'rvgGroup'`, replaces the re-keyed Type 3 price rows (keyed by
    `procedureTypeId`) with Contract lines, and keys lines by procedure; `procedureTypesInGroup` is
    there for it.
  - 19b replaces the interim `includesModifierCodes` with the locked included P1 on H7A to H9b and
    S1 to S10 (seeded here), and owns everything modifier; the group's and procedure's
    `modifierUnits` are resolved and added (0 everywhere) for 19b to combine with itemised modifiers.
  - 20 inserts the Contract pick after the picker, the RVG-code route to the lines across a group,
    and (with 21) OQ-103's review flag on a Procedure left on a general procedure; `pickRvgGroup`
    is the entry point it extends.
  - 20a seeds AR-35's source wording onto Procedures on this phase's procedures and groups (every
    AR-35 group is seeded; its procedures exist with the side dropped), turning `description` into the
    source wording list.
  - 25 snapshots `baseSource`, `baseLayer`, the starting value and the recorded value.
  - 26 builds the prepaid tick list on procedures and `procedureTypesInGroup`.
  - 42 loads groups and procedures from spreadsheets (AR-29 region `data-loading`), including the
    full NZSA set and Vanessa's list, and makes body sections loadable.
  - OQ-88, OQ-101 and OQ-103 outcomes are module and `MasterData.tsx` changes (see the gate table).
