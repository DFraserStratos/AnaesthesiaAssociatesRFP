# Phase 19 · RVG groups and the RVG code type-ahead

**Requirements covered:**
[FT-05.1](../../../../requirements-board/requirements/stories/FT-05.1.md) RVG groups and modifiers (status 4; Partial; the modifier half is Phase 19b's) ·
[US-05.1.1](../../../../requirements-board/requirements/stories/US-05.1.1.md) RVG groups (status 4; Partial) ·
[US-05.1.3](../../../../requirements-board/requirements/stories/US-05.1.3.md) Anatomy headings and AA groups (status 3, with a Verify point; Partial) ·
[DM-13](../analysis/domain-model-delta.md#dm-13) the RVG group becomes the one master list (hidden key, duplicate codes, modifier units, AA groups); there is no procedure list ·
[RV-10](../analysis/reverse-check.md#rv-10-ranged-base-code-is-hard-bounded-to-the-published-range) ranged base code hard-bounded to the published range.

**Left this phase (2026-10-20 update).** US-05.1.6 (the procedure master) is Retired: OQ-88 is
answered, the RVG groups are the one list, and its work (the procedure list, a general procedure per
group, the body-section picker and the Procedures and RVG codes tabs, the prepaid whole-group marking
of US-05.1.3) is deleted, not moved. RV-04 of the old numbering was this phase's clamp finding; the
reverse check renumbered it RV-10, and the id RV-04 now means the price-adjustment reason (Phase 24).
Modifiers stay 19b's; Contract lines and starting values filled onto the Procedure are 19a's; the
Contract pick is 20's; the received wording is 20a's.

**Decisions and questions.** **D3** ([OQ-56](../../../../requirements-board/requirements/questions/OQ-56.md),
[OQ-32](../../../../requirements-board/requirements/questions/OQ-32.md)), answered: any base-unit value
is accepted, and an out-of-range one raises an after-procedure warning for the office; no hard bound.
**D39** ([OQ-88](../../../../requirements-board/requirements/questions/OQ-88.md)), answered: one list,
each row with a hidden key. **D12** is superseded a second time ([OQ-62](../../../../requirements-board/requirements/questions/OQ-62.md)):
base units sit on the RVG group, a Contract line may state its own (19a), the anaesthetist may change
them, and there is no procedure layer. Build all of these as answered, with no label. Still open, built
as its default, with one provisional note: **D35**
([OQ-101](../../../../requirements-board/requirements/questions/OQ-101.md): a row holds a starting
figure plus the published range where the guide prints one). OQ-103 no longer gates this phase (the
general procedure is gone). Open and not built: a human-readable system code on each row
(US-05.1.1's note, "we'll come back to it"): default none beyond the hidden id, with code and
description searchable; log it.

**Depends on:** Phase 15a (the warning routine, Warning records, the office to-do list, the warning
triangle and the "Raise sample warnings" trigger) and Phase 18 (holders, dated Contracts, the fee
parity harness). Phases 14, 15, 15b and 17 are in place.

**Estimated:** 2 sessions. Session 1: work items 1 to 7 (baseline, the pricing-model module, the
resolver, the warning rule, seed and remap, store actions, every reader re-pointed), ending green
with the old picker minimally re-pointed. Session 2: items 8 to 12 (Admin RVG groups, the type-ahead
on every capture path, copy sweep, warning sample, shots, demo guide) and the review pass. If
session 2 runs long, cut the Admin "Retired" filter before any capture path.

**Owner review.** Agents test themselves (ROADMAP.md "Owner review: agents test themselves"): no
plan-approval stop. D35 is built as its default and logged on the phase's "For the owner's review" list.

## Goal

Replace the flat `RvgCode` table (keyed by its code) with the catalogue's one master list, the RVG
groups, before 19a adds Contract lines and 19b the modifiers.

- **RVG groups** (US-05.1.1, US-05.1.3, FT-05.1; DM-13). The NZSA RVG 2021 as published
  ([AR-16](../../../../requirements-board/requirements/artifacts/AR-16.md), Section II), plus AA's own
  rows beside them, unmarked. Each row has a **hidden id** (the key; never shown), a **code** that is
  not unique (the guide prints two T2s and two P6s, and the same code may sit on several rows with
  different base units), a **description**, the **anatomy heading** as the guide prints it (Head,
  Neurosurgery, Upper limb and so on), **base units** (a whole number above 0, the starting figure), the
  **published range** beside it where the guide prints one (H4 10 to 12; D35), and **modifier units**
  (0 by default, held quietly: only the Admin edit sheet shows it, since "the user never interacts
  with it"). No procedure list, no general procedure, no body-section picker, no tabs.
- **Office maintenance** in Admin Master data: add, edit, retire and restore rows, every change audited.
- **An optional RVG code by type-ahead** (US-05.1.1, US-03.3.1's pick, Phase 20 closes it). Typing "H1"
  lists every row with that code, each showing code, description and base units (and its anatomy
  heading as a small label). On mobile, web and the Admin Booking detail, the manual add form and phone
  advice. The Procedure's `rvgBaseCode` (a string into the old table) becomes an optional
  `rvgGroupId`; the "procedure" on a Booking stays the text received (`description`, 20a's).
- **One starting-units answer.** Base and modifier units from the picked row, with the recorded value
  winning as today (a typed override, else a chosen value on a ranged row). 19a adds the Contract line
  above and turns it into values filled onto the Procedure at pick.
- **Any base-unit value is accepted (D3, RV-10).** The range clamp and the completion refusal go. A
  recorded value that differs from the starting value and lies outside the row's range (or figure)
  raises one mild after-procedure warning through 15a's routine, never a block.
- **Optional means optional.** The validator stops insisting on an RVG code (completion rules are 21's).

**Pricing model in one place.** The row type, seed, search, the resolver and the out-of-range test
live in one module in `aa-prototype/src/domain/billing/` (joining 18's module if it made one), behind
types the UI reads; `domain/types.ts` only re-exports. Reference shape: the technical design v6,
[AR-29](../../../../requirements-board/requirements/artifacts/AR-29.md) regions `rvg-group-fields`,
`data-model`, `booking-procedure-fields`, `resolver`, `null-handling` and `data-loading`;
[AR-30](../../../../requirements-board/requirements/artifacts/AR-30.md) region `rvg-group`;
[AR-28](../../../../requirements-board/requirements/artifacts/AR-28.md) region `how-a-procedure-is-priced`.
It is Greg's proposal: field names are for orientation, the catalogue wins; departures (the range, the
anatomy label) are named fields in that module.

No S1 to S5 figure moves: every seeded Procedure is remapped to a row whose base units equal today's
figure (item 5).

## Before you start: drift check

1. Run the catalogue diff against the plan's baseline, catalogue commit `d4db277` (rename-aware;
   never a plain `git diff` of the catalogue folder):

   ```
   node requirements-board/agent/skills/update-build-plan/tools/plan-state.mjs --diff FT-05.1,US-05.1.1,US-05.1.3,US-05.1.6,US-03.3.1,FT-04.3,US-04.2.4,US-05.1.4,US-13.7.1,OQ-56,OQ-62,OQ-88,OQ-99,OQ-101,OQ-106
   ```

   At plan time (2026-10-20, `60e2d1e..d4db277`) these moved: FT-05.1 retitled "RVG groups and
   modifiers" (no procedure list; each group with its anatomy heading; found by type-ahead);
   US-05.1.1 (hidden key, anatomy heading, type-ahead criterion; system code still open; Greg keeps
   modifier units quietly); US-05.1.3 retitled "Anatomy headings and AA groups" (prepaid RVG group and
   tabs gone; Verify: whether the heading browses or filters, since the 14 October picker is
   type-ahead only); US-05.1.6 Retired; US-03.3.1 retitled "Choose the RVG code, with starting
   units" (RVG code optional); OQ-88 answered; OQ-62 and OQ-06 updated; OQ-101 still open; OQ-103
   no longer relevant; OQ-106 new (not this phase's). The plan already reflects all of this; diff
   only for anything after `d4db277`.
2. If an item changed after `d4db277`, re-read it whole and adjust the work items. If one is now
   Retired or Future, drop its work and say so in the PROGRESS entry.
3. Read `requirements-board/requirements/domain-model.md` "RVG groups and modifier master", the
   "Base units come from the RVG code" row of §1 and §3's resolver block.
4. Read the evidence with `npm --prefix "/Users/d.fraser/Local Dev/Anaesthesia Associates RFP/requirements-board" run source -- --item <ID> --text`
   for US-05.1.1 and FT-05.1 (Node 22.18 or newer), and the 8 October note's AR-35 wording table
   (`requirements-board/requirements/notes/2026-10-08-procedure-picker-and-source-text.md`): it names the
   RVG groups Phase 20a's wording maps to, so they must be seeded.
5. Check `docs/discovery-reference/Data files/` for Vanessa's procedure list. It is not an input here
   (there is no procedure list); only take descriptions and codes for the demo-sized seed.
6. Confirm the gates.

| Gate | Build | If answered differently |
|---|---|---|
| **D3 / OQ-56, D39 / OQ-88, OQ-62** (answered) | As Goal. No label | Not expected |
| **D35 / OQ-101** (open) | `baseUnits` is the starting figure (the range's lower bound unless AA sets another), with `baseUnitsRange { min, max }` beside it where the guide prints one. One "Provisional" note on the Admin RVG groups tab | If only the figure is kept, drop the range field; the warning then compares with the figure. One field in the module |
| **System code** (open, US-05.1.1 note) | None beyond the hidden id; code and description searchable | If a code is wanted, one field on the row and the sheet; record it |
| **US-05.1.3 Verify** (does the anatomy heading browse or filter) | A label on each row, in the Admin table (grouped under it) and in the type-ahead; no browse, no filter, no tags across groups | If it browses, add the chip row to the picker in the module's helper and `CodePickerSheet` only |

7. Read what 15a, 15b, 17 and 18 built (their PROGRESS entries). Confirm from 15a: how a warning rule
   is registered (rule file, `WARNING_RULES`, `WarningRuleId`, a `WarningFacts` field, the
   `appSettings.warningRules` default via `backfillMerge`), the Warning shape (after-procedure, mild,
   per-Procedure key), when it surfaces and re-raises, and the `WARNING_SAMPLES` entry shape and pinned
   sample Bookings (including `multiWarning`). From 18: the `feeParity.test.ts` harness and its
   `__parity__/` fixture, where 18 put the pricing model's types, and what shape `ContractPrice` (fixed
   prices keyed by RVG code) has after 18. File names below are as at the plan; re-grep.
8. Record the current `PERSIST_VERSION` (25 at `d4db277`; earlier phases may have bumped it).

## Reference

**Design (convention 17).** No mockup covers Admin master data. Extend the Admin Review page's table
anatomy (`docs/design/Admin Review.dc.html`) and the existing Master data tabs and edit sheets
(`ContractEditSheet`, `AddHolidaySheet`). The type-ahead is the picker sheet of `docs/design/Mobile App.dc.html`
screen 3 (and its web twin) with the search box leading; tokens, pills and the warn tint come from
`Design Language.dc.html`. Teal is the only action colour. The anatomy heading, "Retired" and
"Provisional" markers are neutral pills, never crimson.

**Catalogue.** The files linked above, plus
[US-03.3.1](../../../../requirements-board/requirements/stories/US-03.3.1.md) (the anaesthetist's pick, closed by 20),
[FT-04.3](../../../../requirements-board/requirements/stories/FT-04.3.md) (Contract list and the RVG code before or after, 20),
[US-04.2.4](../../../../requirements-board/requirements/stories/US-04.2.4.md) (lines with a default RVG code, 19a),
[US-13.7.1](../../../../requirements-board/requirements/stories/US-13.7.1.md) (the warning routine, 15a),
[US-13.4.3](../../../../requirements-board/requirements/stories/US-13.4.3.md) (spreadsheet loads, 42),
[US-05.1.4](../../../../requirements-board/requirements/stories/US-05.1.4.md) (included P1, 19b: why the Neurosurgery and Spine rows are seeded here),
[OQ-106](../../../../requirements-board/requirements/questions/OQ-106.md) (routine procedures as lines, not this phase's).
Artifacts: AR-16 (the NZSA RVG 2021 PDF, Section II; read by text extraction with `python3` and
`pypdf`, spot-check two-column rows, never copy beyond codes, descriptions and units),
`requirements-board/requirements/artifacts/files/NZSA RVG 2021 included modifiers.csv` (AR-34: the
Neurosurgery H7A to H9b and Spine S1 to S10 rows), AR-35 (the wording table's groups), AR-01 region
`starting-values`.

**Analysis.** `../GAP-ANALYSIS.md` "EP-05" (FT-05.1, US-05.1.1, US-05.1.3), the DM-13 row of
"Structural changes" and the RV-10 row of "Prototype behaviour to remove or rework";
`../epics/EP-05.md`; `../analysis/domain-model-delta.md#dm-13`, `#dm-43` (the resolver 19a
completes) and `#dm-31`; `../analysis/reverse-check.md` RV-10; the maps for domain, shared capture,
admin section 9 and store/seed.

**Code entry points (re-grep; lines as at the plan).**

- Types: `src/domain/types.ts`: `Procedure.rvgBaseCode` (870), `RvgBaseUnits` and `RvgCode` (915 to
  926, with `anatomicalSite` and `absorbsModifierCodes`), `ContractPrice`'s `rvgBaseCode` key (425).
- Base units: `src/domain/billing/fee.ts` `resolveBtm`; `FeeContext.baseCode`; `modifierUnits.ts` and
  `fixtures.ts` (`BASE_ABSORBS_P1`): re-pointed only.
- `validateBookingForBilling.ts`: `feeContextFor`, the RVG-code requirement (130 to 136) and the
  in-range rule (152 to 163); `invoiceBuild.ts`; `contracts.ts` (the Type 3 price match by code).
- UI fee context `src/shared/capture/feeContext.ts` (`procedureFee`, the second assembler; keep in
  step), `reviewFlags.naturalBtm`, `seed/billing.ts` `contextFor`.
- Warnings: `src/domain/warnings/` (`routine.ts`, `rules/index.ts`), `src/store/warnings.ts`,
  `src/store/warningSamples.ts`.
- Seed: `src/domain/seed/rvgCodes.ts` (the invented 5-digit codes; ranged 20880, 47522, 51011, 45030;
  P1 absorbed at 47516, 47519, 47522, 48900, 48939, 51011, 51020; `EYE_CODES`, `GENERAL_CODES`),
  `seed/index.ts`, `seed/bookings.ts` (the generator's range draw consumes the RNG), `seed/history.ts`,
  `seed/contracts.ts` (three Type 3 price rows by code), `seed/audit.ts`; intake fixtures
  `integrations/messages.ts` (`operation.code`) and `apps/admin/flows/PhoneAdviceBooking.tsx`.
- Store: `store/mastersActions.ts` (the office-only audited master pattern), `lifecycle.ts`
  `editProcedure`, `bookingActions.ts`, `contractActions.ts` (price rows by code), `mutate.ts`
  `allocateId`.
- Admin: `src/apps/admin/screens/masters/MasterData.tsx` (the `rvgCodes` tab) and `ReferenceViews.tsx`
  (`RvgCodesView`, "view only"), `flows/ContractEditSheet.tsx` (price rows by code),
  `screens/ReviewScreen.tsx` (the code column).
- Capture (shared by mobile, web and the Admin Booking detail): `src/shared/capture/`
  `ProcedureCodeCard.tsx`, `CodePickerSheet.tsx` (a substring filter grouped by `anatomicalSite`),
  `BtmCaptureBlock.tsx`, `UnitsCard.tsx`, `ModifierChips.tsx`, `ui.tsx` (`CaptureSection`'s hook is
  derived from its label); `shared/flows/ManualBookingForm.tsx` (the "Procedure code" select).
- Readers: about 22 non-test files read `rvgBaseCode` and 23 read `RvgCode`/`rvgCodes`/`RVG_CODES`
  (`grep -rln` both first).
- Tests to extend: `fee`, `modifierUnits`, `validateBookingForBilling`, `contracts`, `invoiceBuild`,
  `seed`, `btmCapture`, `captureActions`, `bookingActions`, `mastersActions`, `warnings/routine`,
  `pwaPurity` (stays green). Playwright: `visual/mobile-phase04.spec.ts` (the code picker shots),
  `admin-phase07.spec.ts` (`a7-04-masters`).

## Work items

Model, domain and seed first, then store, then UI. Every write goes through `mutate()` with an audit
meta. Every rule is a pure function with a Vitest test.

1. **Baseline the figures (before any edit).** Add `phase-19-baseline.json` beside 18's in
   `domain/billing/__parity__/`: every seeded Procedure's `feeFor` total and B, T and M, and every
   seeded invoice total from `buildSeed()`; if 18's harness is missing, create it and say so. Never
   regenerate with `-u`: a mismatch is a failure to explain. Also record each seeded Procedure's B and
   its source, for item 5's remap.

2. **The module: RVG groups** (US-05.1.1, US-05.1.3, DM-13; AR-29 `rvg-group-fields`, AR-30 `rvg-group`).
   - `RvgGroup` replaces `RvgCode`: `{ id: RvgGroupId; code: string; description: string; anatomy:
     string; baseUnits: number; baseUnitsRange?: { min: number; max: number }; modifierUnits: number;
     retired: boolean }`. `baseUnits` is whole and above 0; where a range is present `min <= baseUnits
     <= max`; `modifierUnits` is whole, 0 or more, 0 by default. `anatomy` is the heading as printed
     (a string, not a master). The "4 + Time" rows are seeded with their number (time is always
     charged; note it in the seed comment). `anatomicalSite` and `RvgBaseUnits` go. **Interim, deleted
     by 19b:** `includesModifierCodes?: string[]` on the rows remapped from the seven legacy absorbing
     codes, so `modifierUnits`' refusal and the capture strike-through behave as today; nothing new
     sets it and Admin does not show it.
   - `Procedure.rvgBaseCode` becomes `rvgGroupId?: RvgGroupId` (optional; a Procedure with none prices
     with no base units). `description` stays the text received. `SeedMasters` and
     `AppState['masters']` replace `rvgCodes` with `rvgGroups`; `allocateId` gains `rvgGroup`.
   - Pure helpers (tested): `groupOf`, `searchRvgGroups(query, groups)` (code and description,
     case-insensitive; exact code first, then code prefix, then description; retired excluded unless
     asked; "H1" returns every H1 row), `rvgGroupLabel(group)` (code, description and base units text,
     "B 6" or "B 10 to 12", for the picker, the card and Admin).
   - Never key anything by a printed code: P1, A1 and A2 as RVG rows are not the modifiers, T1 and T2
     are not time codes; the UI always shows a row's code with its description.

3. **The resolver and the recorded value** (US-05.1.1, DM-43's first layer; AR-29 `resolver`).
   - `resolveStartingUnits({ group })` returns `{ base: { units, layer: 'rvgGroup' }, modifier: { units,
     layer }, guide: { figure, range? } }` (19a adds `'contractLine'` above, and a `line?` input).
   - `baseUnitsFor({ procedure, starting })` returns `{ units, source, starting, outsideGuide }`,
     `source` one of `'overridden' | 'chosen' | 'rvgGroup' | 'none'`: the typed override, else
     `baseUnitsSelected` on a row with a range, else the starting value, else (no group) 0 and
     `'none'`. `outsideGuide` is true only when the source is `'overridden'` or `'chosen'`, the units
     differ from the starting value and lie outside the row's range (or differ from its figure where
     it has none).
   - `resolveBtm` delegates its base branch; the resolved modifier units (0 everywhere) join the sum
     (19b decides how itemised modifiers combine). `BtmBreakdown` gains `baseSource`, `baseLayer`
     and `baseGuide`. `FeeContext.baseCode` becomes `rvgGroup?`; both assemblers (`feeContextFor`,
     `procedureFee`), `naturalBtm`, `invoiceBuild`, `seed/billing.ts` and the warning rule pass the
     same inputs. `modifierUnits` reads the interim `includesModifierCodes` from the row.
   - Tests (`startingUnits.test.ts`): each `baseUnitsFor` step; `outsideGuide` at a range's min and max
     (inside), min-1 and max+1 (outside), a typed value on a single-figure row (outside), the starting
     value (not outside) and no group (0, `'none'`). Grep `baseUnits.kind` afterwards: only display
     helpers read the range outside the module.

4. **RV-10 under D3** (`validateBookingForBilling.ts` and 15a's routine).
   - a. The in-range completion rule and its "needs a selected unit value between" sentence go, and
     its tests. A ranged row starts at its figure, so nothing is left unchosen; if a seeded ranged
     Procedure with no chosen value would move the parity fixture, record it as the only exception.
   - b. The RVG-code requirement goes ("Add an RVG base code or at least one billing line"); the
     "RVG code {code} is not in the RVG master" failure becomes a lookup of `rvgGroupId`. Leave anything
     else that refuses a zero charge to 21 and name what is left in PROGRESS.
   - c. **The warning.** One rule, `baseUnitsOutsideGuide`, in 15a's shape: timing **after**, strength
     **mild** (a picked reading; OQ-56 sets none, log it), one Warning per Procedure, raised when
     `baseUnitsFor(...).outsideGuide`. Text: "Base units {n} are outside the RVG guide for {code} ({min}
     to {max})." or "(guide value {v})." Wiring per 15a: rule file in `domain/warnings/rules/`,
     appended after `prepaymentUnpaid`, the `WarningRuleId`, a `WarningFacts` field carrying what the
     resolver needs, a default in `appSettings.warningRules` through `backfillMerge`. Surfacing,
     clearing and re-raise are 15a's.
   - d. `editProcedure` accepts any whole number of 0 or more for `baseUnitsSelected` and the
     override ("Base units must be a whole number." otherwise); no range check in the store.
   - e. Tests: an outside value passes completion and raises the warning; inside the range raises
     none; a value equal to the starting value raises none; an outside value never blocks completion,
     submit or authorise (one store test through each); two outside Procedures give two warnings;
     **the pristine seed raises none of this rule**.

5. **Seed and remap** (AR-16; AR-35's groups; AR-34's CSV). One `PERSIST_VERSION` bump for the phase.
   **Draw nothing new from the seeded RNG.** `seed/rvgGroups.ts` replaces `rvgCodes.ts`, demo-sized
   and labelled "Demo-sized: the full NZSA 2021 set loads through Phase 42".
   - a. **Published rows** (code, description, anatomy heading, base units, range): every group
     AR-35's wording maps to, including each alternative it names (H1 to H6a, N1, T1, both T2s, T3, UL1
     to UL3, LL1, LL3 to LL6, A1 to A4, P1, P2, P4, E1, E2, S2, S6, S8b, S9b); every Neurosurgery (H7A,
     H7b, H8a, H8b, H9a, H9b) and Spine (S1 to S10, with S3a, S3b, S8a, S8b, S9a to S9c) row from the
     CSV, for 19b; the rows the remap needs; at least one row under every anatomy heading; both P6s;
     published ranges (H4, N4, T5c, A4, A6, A12, A13, R2) with the lower bound as the figure.
   - b. **AA's own rows**, beside the published ones, no marker: wherever no published row has the
     legacy Procedure's figure or range (so the pristine seed raises no warning). One per legacy code
     that needs it, carrying today's description and figure, and today's range with its lower bound as
     the figure for the ranged codes (for example "Skin flap repair" 4 to 6 for 45030, a hip revision
     8 to 10 for 47522, a lumbar laminectomy 6 to 8 for 51011); check 20880 the same way. List each AA
     row on the owner's review list.
   - c. **Remap every seeded Procedure** (scenario Procedures in `bookings.ts`, `history.ts`, the
     generator's `GENERAL_CODES` and `EYE_CODES`, `audit.ts`) through one seed-only table,
     `LEGACY_CODE_TO_RVG_GROUP` (legacy code to row, plus the legacy range where there was one). The
     generator keeps reading the legacy range for its draw and then writes `rvgGroupId`; ranged
     Procedures keep their drawn `baseUnitsSelected`. Pick a published row only when its base units
     equal today's figure and its anatomy fits; otherwise use an AA row. A row remapped from an
     absorbing legacy code carries `includesModifierCodes: ['P1']`, and never is shared with a
     non-absorbing one. Each Procedure's resolved B must equal item 1's record. The table is seed-only.
   - d. **Intake fixtures and triggers** carrying a code (`messages.ts` `operation.code`, the phone
     advice prefill, any demo trigger that creates a Procedure) point at a row by id; the operation
     text stays as the Procedure's `description`.
   - e. **Contract price rows re-keyed** (forced by retiring the invented codes): the three Type 3 rows
     (gastric bypass, sleeve gastrectomy, second-procedure umbilical hernia) match on `rvgGroupId`
     with the same prices and ordinal; `contracts.ts`, `contractActions.ts` and `ContractEditSheet`'s
     price row pick a row (a select by code and description). 19a replaces them with Contract lines.
   - f. `seed.test.ts`: base units above 0 and a range holds its figure on every row; every seeded
     Procedure's `rvgGroupId` resolves; the same code appears on more than one row (T2, P6); every AR-35
     row and every H7A to H9b and S1 to S10 row is present; every anatomy heading has a row; no seeded
     Procedure is `outsideGuide`; `includesModifierCodes` only on rows from the seven legacy absorbing
     codes; the generated Bookings are identical to the baseline.

6. **Store actions** (office-only, audited, returning `Outcome`, following `mastersActions.ts`; a new
   `src/store/rvgGroupActions.ts` exported from `store/index.ts`).
   - a. `createRvgGroup` validates a non-empty code, description and anatomy, base units whole and above
     0, a range (if any) holding the figure, and modifier units whole and 0 or more. `editRvgGroup`
     edits every field but the id (a code edit breaks nothing: Procedures link by id). An edited
     figure re-prices unlocked Procedures that take it live (no snapshot until 25; 19a turns this into
     values filled at pick); built invoices keep their amounts: say so in a test. `retireRvgGroup` and
     `restoreRvgGroup`: retiring hides the row from the picker and keeps it for existing Procedures.
     Duplicate codes are allowed; an exact duplicate (same code, description and figure) is refused.
   - b. `pickRvgGroup(api, actor, procedureId, rvgGroupId | null)`: in one audited commit, sets or
     clears `rvgGroupId`; when the row changes, clears `baseUnitsSelected` and `baseUnitsCaptured` (the
     starting value then shows); never touches `description`. Same rights as `editProcedure` (the
     anaesthetist on an ACTIVE Booking, the office per its edit rules). `createBooking`'s input
     carries `rvgGroupId`, validated the same way. Phase 20 adds the Contract pick; 19a fills starting
     values here.
   - c. Tests (`rvgGroupActions.test.ts`): every guard and audit entry; a retired row absent from the
     picker and still pricing an existing Procedure; a figure edit re-pricing an ACTIVE Procedure and
     not a built invoice; `pickRvgGroup` clearing a chosen value only on a row change and leaving
     typed text; refusal for the anaesthetist on a SUBMITTED Booking.

7. **Re-point every reader** of `rvgBaseCode`, `RvgCode`, `rvgCodes` and `RVG_CODES`. `ReviewScreen`'s
   code column shows the row's code (mono) with its description as the title; `BookingDetailBody` and
   `selectors.ts` read the row; `fieldLabels.ts` gains `rvgGroupId: 'RVG code'`.
   `CodePickerSheet` is re-pointed just enough to list rows and call `pickRvgGroup`.

   **Session 1 ends here, green:** `npm run build`, `npm run build:pwa`, `npx vitest run`, and the
   parity fixture unchanged.

8. **Admin, Master data** (`MasterData.tsx`, desktop; teal actions; existing table chrome). The
   `rvgCodes` tab becomes `rvgGroups` ("RVG groups"). Rows grouped under their anatomy heading.
   Columns: Code (mono), Description, Base units (mono: "6", or "10 · range 10 to 12"), and a neutral
   "Retired" pill. A search (`searchRvgGroups`) and an anatomy filter. "Add group" opens a new
   `RvgGroupSheet` (code, description, anatomy, base units, an optional range, modifier units; the id
   never shown); row Edit opens the same sheet; Retire and Restore are row actions; an "Active" or "All"
   filter greys retired rows. Duplicate-code rows sit side by side, told apart by description and
   units. Subheading: "The NZSA RVG 2021 groups AA prices from, plus AA's own. Demo-sized; the full
   set loads at go-live." One `DemoBadge`: "Provisional · a starting figure with the published range
   beside it (OQ-101)." Every write shows in the audit viewer. `data-shot` hooks: `masters-rvg-groups`,
   `rvg-group-sheet`.

9. **The RVG code type-ahead, mobile, web and Admin (shared)** (US-05.1.1, US-05.1.3).
   `BtmCaptureBlock` is shared by the mobile Booking, the web Booking and the Admin Booking detail, so
   this is one change for all three.
   - a. **`CodePickerSheet` reworked in place** (name kept), one flat list, no tabs and no body-section
     jump: a search box ("Search RVG code or description") that opens focused, and every matching row
     (`searchRvgGroups`) as: mono code, description, a small neutral anatomy label, and "B 6" or "B 10
     to 12". Typing "H1" lists every H1 row. The current row is tinted teal. Empty state: "No RVG codes
     match that search." With no query, the first rows by anatomy heading and code (a short default
     list, not the whole guide). A bottom sheet on mobile; the surface's overlay on web and Admin
     (`useSurface`).
   - b. **`ProcedureCodeCard`**: section label "RVG code", keeping the `capture-procedure-code` hook and
     the "Change" action (`CaptureSection` derives its hook from the label, so give it an optional
     explicit `shot` prop and pass `procedure-code`; the capture recipes click it). With a row: code
     and description, "Base 6 units · from the RVG group". Nothing yet: "No RVG code" and "Choose",
     with a "Clear" action, since the code is optional. Base units are capture context; the
     anaesthetist's Booking still shows no fee (2026-09-28 ruling).
   - c. **`RangeUnitsRow`** drops its clamp: floor 0, no ceiling, steppers by one, tapping the value
     opens a numeric input (`inputMode="numeric"`). It starts at the row's figure; label "Guide 10 to 12
     · 11 chosen". Outside the range, a warn-tinted caption (not an error): "Outside the guide range.
     The office will see a warning after the procedure."
   - d. `UnitsCard`'s B caption comes from `baseSource` and `baseLayer`: "From the RVG group",
     "Chosen", "Set manually", with ", outside the guide range" when `outsideGuide`.
   - e. **Creation paths.** `ManualBookingForm` (mobile and web add, Admin add, phone advice): the
     "Procedure code" select becomes an optional "RVG code" chooser row opening the same sheet,
     passing `rvgGroupId` to `createBooking`. `addProcedure` and every Procedure-creating path carry
     `rvgGroupId` where they carried `rvgBaseCode` (grep to confirm none is left).
   - Modifier chips are untouched (19b's) apart from reading the interim `includesModifierCodes`.

10. **Copy and label sweep.** Search `src/` for "RVG codes" (the Admin tab), "view only" on that tab,
    "Procedure code", "Search code or name", "No codes match", "anatomical", "between {min} and
    {max}", "needs a selected unit value" and "Add an RVG base code", and update each. No en or em
    dashes (ranges use "to"). The only provisional label is the note in item 8, a `DemoBadge`, never
    crimson. No "slot".

11. **Warning sample** (see Demo triggers): add this rule's entry to 15a's `WARNING_SAMPLES`, in 15a's
    entry shape, never in an app folder, and update 15a's "1 rule registered" message and registry
    test; the `multiWarning` Booking now shows two warnings.

12. **Playwright and green.** Update the code picker shots in `mobile-phase04.spec.ts` and
    `a7-04-masters`. Add specs for: adding an AA group and picking it in the mobile type-ahead; typing
    "H1" listing every H1 row with units; a typed out-of-range value on H4, its caption, completion
    succeeding, and the warning on the Admin to-do list. Run `npm run build`, `npm run build:pwa`,
    `npx vitest run` and `npm run shots`, all green, with the parity fixture unchanged.

## Demo triggers

- **15a's "Raise sample warnings" gains an out-of-range sample**, wherever 15a registered it (Admin ·
  Day and Admin · Booking detail on the bar; Mobile · Booking on the bar and the PWA). On the Day view
  it targets 15a's pinned `SEED_WARNING_SAMPLE_BOOKINGS`, including `multiWarning` (now two warnings:
  the prepayment one and this one); on a Booking, the Booking in the URL. On each target it takes the
  first Procedure with an RVG code (a stable rule, never a hardcoded id) and records base units of the
  larger of the row's range top and its figure, plus 2: as `baseUnitsSelected` on a ranged row, else as
  a manual override. A target with no Procedure carrying an RVG code gets its first Procedure set to
  the H4 row with 14 chosen. All through the audited `editProcedure` and `pickRvgGroup` as 15a's
  `DEMO_TRIGGER_ACTOR`. `isStaged` is true when that Procedure's base fields differ from the pristine
  seed and hold the sample's values; `unstage` restores them and drops the clearance of the
  per-Procedure key, as 15a's prepayment sample does. It shares all of 15a's disabled states.
- **Normal use, no new button:** in mobile, web or Admin capture, typing "H1" lists every H1 row, and
  typing base units outside the guide is accepted, with the warning on the office's to-do list, a
  triangle on the Booking in all three apps and on opening it (15a).
- **Product UI:** Admin · Master data · RVG groups: add an AA group and pick it in capture.
- No Control Panel change. The type-ahead, the unclamped range and the triangle reach the PWA through
  the shared capture components, so no PWA stand-in is needed (a warning never blocks); master edits
  are Admin-only and reach the PWA when its seed reloads.

## Out of scope

- Modifiers in every form (Phase 19b): the NZSA modifier table, itemised records, explanations, age and
  the included P1, the ASA card, absorbed modifiers out. The interim `includesModifierCodes` holds
  today's behaviour until then.
- Contract lines, the line layer, starting values filled onto the Procedure at pick, first-party
  price lists and time tiers as data (19a). The Contract pick and RVG-code reverse lookup of lines
  (20). Source wording and the stack (20a). Completion and a "needs an RVG code" rule (21).
- Pricing snapshot (25). Spreadsheet loads of the full NZSA set (42). Warning thresholds and mutes
  (US-13.7.4, Future).
- A procedure list, general procedures, body sections, tabs, a prepaid RVG group, tags across groups:
  all retired or dropped by the catalogue.
- Real AA unit values: published figures are the guide's; AA's own rows stay demo-plausible and
  labelled.

## Manual test checklist

The agent runs every item itself in the running app and reports it with evidence; none is handed to the
owner (ROADMAP.md "Owner review: agents test themselves").

- [ ] Admin → Master data → RVG groups: rows sit under their anatomy headings; H4 shows "10 · range
      10 to 12"; both T2s and both P6s show as separate rows with their own description and units;
      search "H1" lists every H1 row. The OQ-101 note shows here only.
- [ ] Add group ("Brow lift", Head, base 5): saves, audited, no marker; a base of 0 and a range that
      does not hold the figure are each refused. Retire it: gone from the picker, an existing
      Procedure on it still prices; Restore brings it back.
- [ ] Editing a row's base units changes an ACTIVE Procedure on it live (B follows) and not an already
      built invoice. Set it back.
- [ ] Mobile capture on an ACTIVE Booking: "Change" opens the type-ahead; typing "H1" lists every H1
      row with description and base units; picking one shows "Base N units · from the RVG group";
      "Clear" leaves the Procedure with no RVG code and completion is not refused for that. Typed
      operation text is never overwritten.
- [ ] Ranged row (H4): the range row starts at 10; typing 14 is allowed, with the "Outside the guide
      range" caption. Mark complete and submit succeed. The Admin to-do list shows "Base units 14 are
      outside the RVG guide for H4 (10 to 12).", and the Booking carries the triangle in mobile, web
      and Admin and shows the warning on opening. Clearing works as 15a defines. A value of 11 raises
      nothing.
- [ ] Web capture, the Admin Booking detail, the manual add form and phone advice open the same
      type-ahead.
- [ ] Admin Day Tue 21 → Demo actions → "Raise sample warnings" includes the out-of-range sample; the
      `multiWarning` Booking shows two warnings with their own text; "Clear sample warnings" restores
      its Procedure's seed values. On the PWA (5174), a seeded ACTIVE Booking's demo-actions sheet
      raises it, and the warning shows on opening.
- [ ] No warning of this rule on the to-do list at a fresh reset.
- [ ] A hip replacement (BK0009) still shows Positioning struck through with its caption (19b's to
      remove), and its fee is unchanged.
- [ ] S1 Beat 3 (Sarah Mitchell, "Appendicectomy, laparoscopic", B 5) and S3's fee figures are
      unchanged, and the parity test is green.
- [ ] Audit viewer: rvgGroup and pickRvgGroup entries appear with before and after values.
- [ ] No en or em dash in new app copy (grep the diff). Actions teal, pills neutral, no crimson, no
      "slot".
- [ ] Catalogue screenshots: the recipes for FT-05.1, US-05.1.1 and US-05.1.3 are updated, every recipe
      this phase broke is re-pointed, a full `npm run capture` ends with no failed recipe, the new
      shots are checked by eye, and `npm run verify:board` is green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots` and `npm run verify:board`
      green.

## Demo guide updates

No scripted figure changes. Patch the wording these beats carry, and the same sections of
`master-demo-guide.html`, in the same session:

- `03-demo-script.md` **S1 Beat 3** ("capture BTM on mobile"): "Choose procedure **20950 — Appendicectomy,
  laparoscopic**" becomes a pick by type-ahead (type the RVG code or a word of its description, pick
  the row for the appendicectomy), unless Sarah now arrives with an RVG code through the hospital
  message path, in which case the click is dropped; the Expected text names the RVG code card as it
  now reads. Add an optional "Worth pointing at": typing "H1" lists every H1 row with its description
  and base units.
- `03-demo-script.md` S5 discovery points: add RVG groups as published with AA's own beside them,
  duplicate codes told apart by description and units, an optional RVG code, and OQ-101. Optional S5
  "Worth pointing at": Admin → Master data → RVG groups.
- `04-presenter-cheat-sheet.md` "Fee calculation": "The anaesthetist selects the RVG code; the system
  does not automatically infer it" becomes "The anaesthetist picks the RVG code by typing; it is
  optional, and the system does not infer it". "Some RVG codes are ranges and require professional
  judgement" becomes "A ranged group starts at its starting figure; any value is accepted, and one
  outside the guide raises a warning for the office after the procedure, never a block". Add "Base
  units sit on the RVG group; a Contract line may override them (next phase)". Leave the positioning
  line for 19b. In "Statements to avoid", keep "The app automatically chooses the clinical RVG code."
- `02-workflows-and-handoffs.md` capture step 3 ("For each Procedure she selects the RVG base code")
  becomes "For each Procedure she may pick an RVG code by typing; on a ranged group she may change the
  starting figure, and an out-of-range value raises an office warning". Steps 6 to 8 are 19b's.
- `01-personas-and-responsibilities.md` line 42 ("Record ASA, RVG code, ..."): "RVG code" stays,
  made optional; the ASA wording is 19b's.
- `master-demo-guide.html`: the same sections. Control Panel scenario text: grep `src/apps/demo` for
  "RVG code" and "20950" and update any match.

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19), run
after the review pass and before the PROGRESS.md entry. Re-run
`node requirements-board/agent/skills/update-build-plan/tools/recipe-status.mjs 19` first (earlier phases may have changed
these recipes). Every current caption about the flat RVG code master ("RVG codes with ... absorbed
modifiers", "grouped by anatomical site") is replaced, never left standing. FT-05.1's modifier half
(US-05.1.4, US-05.1.5) is Phase 19b's; this phase only keeps their recipes running. US-05.1.6 is
Retired: no recipe row.

| Item | Recipe now | When this phase is done |
|---|---|---|
| [FT-05.1](../../../../requirements-board/requirements/stories/FT-05.1.md) RVG groups and modifiers | captured · admin-rvg-codes | Stays `captured`, re-pointed: `rvg-groups` (the RVG groups tab, `masters-rvg-groups`, anatomy headings visible, an AA row among them; caption "RVG groups as published, with their anatomy heading, plus AA's own") and a mobile `type-ahead` shot (caption "Find an RVG code by typing; each row shows its description and base units"). The modifier half stays 19b's |
| [US-05.1.1](../../../../requirements-board/requirements/stories/US-05.1.1.md) RVG groups | captured · admin-rvg-codes | Stays `captured`. `rvg-groups` on the tab (highlight the Code, Description and Base units columns and two rows sharing one code; caption "Each RVG group has a code, description and base units above 0; the same code can sit on several rows"), an `add-group` state with `RvgGroupSheet` open (caption "AA can add its own groups and set their base units"), and `type-ahead` on web and mobile with "H1" typed (highlight the rows' base units; caption "Typing H1 lists every H1 row"). The old caption goes |
| [US-05.1.3](../../../../requirements-board/requirements/stories/US-05.1.3.md) Anatomy headings and AA groups | partial · admin-rvg-sites, web-code-picker, mobile-code-picker ("grouped by anatomical site") | `captured`, the old partial reason ("codes cannot be selected as a set", AA groups) dropped (prepaid groups are gone from the catalogue). `rvg-sites` as the tab's anatomy-heading groups with an AA group beside the published ones (caption "RVG groups under the guide's anatomy headings, with AA's own beside them"); `code-picker` on web and mobile with the anatomy label on each row (caption "Each row carries its anatomy heading"). Keep the shot names. Leave the Verify point (does the heading browse or filter) in the caption: not built |
| [US-05.1.4](../../../../requirements-board/requirements/stories/US-05.1.4.md) Included modifiers | captured · admin-rvg-absorbs, web-absorbed-positioning, mobile-absorbed-positioning | No change here (Phase 19b owns it); only the recipe repair below |
| [US-05.1.5](../../../../requirements-board/requirements/stories/US-05.1.5.md) Modifier master | partial · admin-modifier-codes | No change here (Phase 19b owns it) |

**Recipes this phase breaks** (re-point them; the `--dry` run is the check):
- `US-05.1.4` (19b's): drop the admin `rvg-absorbs` shot (it clicks "RVG codes" and highlights the Absorbs
  column, which goes); the web and mobile `absorbed-positioning` shots still render, keep them with
  status `partial`: "Phase 19b replaces absorbed positioning with the included P1, pre-applied and
  removable, on Neurosurgery and Spine codes."
- `US-03.3.1` (20's, status unchanged): `rvg-picker` `open` and `search` fill
  `input[placeholder="Search code or name"]`; re-point to the new placeholder, `open` showing the
  type-ahead, `search` typing "H1"; the shot-level caption "RVG code picker" stays. Its ranged shots
  (today `US-03.3.2`'s `ranged-base-code`) move into US-03.3.1 as `ranged-base-units` on web and
  mobile, re-shot on an H4 Booking, states `start` (caption "A ranged group starts at its starting
  figure") and `outside` (14 typed; caption "Any value is accepted; outside the range raises a warning
  for the office").
- `US-03.3.2` (Retired, merged into US-03.3.1): set `absent`, "Retired: merged into US-03.3.1", no
  shots, once US-03.3.1 carries the ranged states.
- `US-13.4.1` (42's): its `rvg-codes` state clicks the old tab; re-point to "RVG groups", caption
  "Master data, RVG groups", and trim the RVG groups half of its `absentReason`.
- `US-05.1.2` (Retired): reword its `absentReason` to "Retired: merged into US-05.1.1".

**ATLAS.md.** Overlays (the type-ahead replaces the grouped code picker), Existing hooks
(`masters-rvg-groups`, `rvg-group-sheet`; the old `masters-rvg` hook gone; `capture-procedure-code`
kept), Master data tab names, and Seed data (the RVG groups as published with their anatomy headings,
AA's own rows, the duplicate T2 and P6 rows). Routes are unchanged.

## Adversarial review (after build)

After the manual test checklist and the commands are green, and before writing the PROGRESS entry,
run the standard **adversarial review-and-fix pass (PROGRESS convention 18)**: about three independent
Opus review subagents, one each for **quality**, **bugs/correctness** and **plan adherence**, plus a
fourth on **billing maths**, because the resolver sits under every fee. This session verifies every
finding against the catalogue files, this doc and the code, fixes the confirmed ones (a test for each
bug), re-greens, and records the pass. Do not re-raise anything settled in the Decisions log.

**Steer this phase's reviewers at:**

- **No figure moved.** The parity fixture is byte-identical. Every seeded Procedure's B equals today's
  (published rows only where the units match; AA rows otherwise); generated Bookings are identical (the
  generator still draws from the legacy ranges through the seed-only table); the three Type 3 price
  rows match by row with the same prices. S1 Beat 3 and S3 unchanged.
- **The pricing model is in one place.** The row type, search, the resolver and the out-of-range test
  live in one `domain/billing` module behind types the UI reads; no component computes a layer or a
  range check itself; `domain/types.ts` only re-exports. A later design revision of the RVG group would touch that
  module and the seed only.
- **One starting-units answer.** The row's figure, then the recorded value (override, then a chosen
  value on a ranged row). Both fee-context assemblers, `invoiceBuild`, `seed/billing.ts`,
  `naturalBtm` and the warning rule pass the same inputs. 19a's change is one more input and layer.
- **D3 is done exactly.** No clamp in the UI, no range check in the store, no range refusal in the
  validator, no demand for an RVG code. An outside value raises one mild after-procedure warning per
  Procedure and blocks nothing; the pristine seed raises none; `multiWarning` shows two warnings; the
  rule is wired as 15a requires.
- **The master holds.** The key is the hidden id and no printed code is a key (two T2s, two P6s; RVG
  P1, A1 and A2 never confused with the modifiers); base units above 0; a range holds its figure;
  retiring hides but never breaks an existing Procedure; every write office-only, through `mutate()`,
  audited; `PERSIST_VERSION` bumped once; no new RNG draw; AA rows unmarked.
- **The type-ahead follows US-05.1.1.** "H1" lists every H1 row with description and base units; the
  RVG code is optional and clearable; `CodePickerSheet` is reworked, with no tabs, no procedure list and
  no body-section picker anywhere; mobile, web, the Admin Booking detail, the manual form and phone
  advice all use it; typed text is never overwritten.
- **No modifier work and no Contract work.** Only the interim `includesModifierCodes` read (19b's); no
  Contract line, Contract pick, prepaid UI, loader or warning settings; no "default modifier".
  Plus the usual: teal-only actions, no dashes in copy, mobile sheets not modals, `pwaPurity` green.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry): D35 built as a starting figure (the lower
  bound) with the range beside it, a ranged row never blocking completion; no system code beyond the
  hidden id; the anatomy heading as a label only (no browse, no filter, no tags); modifier units held
  on the row and shown only on the Admin edit sheet; the AA rows made for the legacy codes (each
  listed, since no published row matched); the mild warning strength; the demo-sized seed; anything
  logged rather than fixed; and the screens worth a look, each with its route and persona.
- **Catalogue screenshots result:** the recipes re-pointed (FT-05.1, US-05.1.1, US-05.1.3), the broken
  ones fixed (US-05.1.4, US-03.3.1, US-03.3.2, US-13.4.1, US-05.1.2), the REPORT.md counts (captured,
  partial, absent, failed) before and after, and the partial reasons handed on (US-05.1.4 to 19b).
- Status row for catch-up Phase 19, and a phase entry: what was built, the parity result, the review
  pass (findings confirmed and fixed, anything not treated as a defect and why), tests added, and the
  `PERSIST_VERSION` bump.
- **Decisions log:**
  1. D12 superseded a second time: base units sit on the RVG group, a Contract line may state its own
     (19a), no procedure layer; the RVG groups are the one master list with a hidden key (OQ-88, D39).
  2. RV-10 under D3 (OQ-56): any base-unit value, typed or stepped; an out-of-range value raises a mild
     after-procedure warning (mild is a picked reading); with D35's starting figure a ranged row no
     longer blocks completion. Supersedes the Phase 04 in-range completion rule and stepper clamp.
  3. The capture picker is a type-ahead on code and description (US-05.1.1), superseding the Phase 04
     picker grouped by anatomical site; the RVG code is optional.
  4. The NZSA RVG 2021 groups replace the invented 5-digit codes (Decisions log 2026-07-22 superseded
     for the published rows); seeded Procedures keep their fees through AA rows.
  5. The 2026-10-02 readings superseded: "default modifiers pre-filled and untickable" and AA groups as
     many-to-many tags.
- **Handoff list:**
  - 19a adds the Contract line layer (`'contractLine'`, a `line?` input to `resolveStartingUnits`),
    replaces the re-keyed Type 3 price rows with Contract lines (a line's default RVG code is an
    `rvgGroupId`), and turns live group resolution into starting values filled onto the Procedure at
    pick and reset on a Contract change.
  - 19b replaces the interim `includesModifierCodes` with the included P1 on H7A to H9b and S1 to S10
    (seeded here) and owns everything modifier; the row's `modifierUnits` is resolved and added (0
    everywhere) for it to combine with itemised modifiers.
  - 20 inserts the Contract pick and the RVG-code reverse lookup of lines; `pickRvgGroup` is its entry
    point. 20a turns `description` into the received wording and seeds AR-35's wording on the seeded
    groups. 21 owns completion rules for an absent RVG code. 25 snapshots `baseSource`, `baseLayer`,
    the starting value and the recorded value. 42 loads groups from spreadsheets (AR-29
    `data-loading`), including the full NZSA set.
  - OQ-101 and the system code outcomes are module and `MasterData.tsx` changes (see the gate table).
