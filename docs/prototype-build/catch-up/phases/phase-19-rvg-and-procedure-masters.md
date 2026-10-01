# Phase 19 · RVG, modifier and procedure masters

**Requirements covered:**
[US-05.1.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.1.1.md) RVG code master data (Verify) ·
[US-05.1.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.1.3.md) Group codes (Confirmed) ·
[US-05.1.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.1.5.md) Modifier code master (Proposed) ·
[US-05.1.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.1.6.md) Procedure master mapped to RVG codes (Verify) ·
[US-03.3.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.3.1.md) Select an RVG code, with ranged override (Verify; graded Contradicts) ·
[DM-13](../analysis/domain-model-delta.md#dm-13) Procedure master (master procedure list) and RVG groups ·
[RV-04](../analysis/reverse-check.md#rv-04-ranged-base-code-is-bounded-to-the-published-range) ranged base code bounded to the published range.
Answered: owner decision D3 ([OQ-56](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-56.md), with
[OQ-32](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-32.md)) and
[OQ-06](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-06.md) (answered, but the answer and the
meeting disagree). Open: [OQ-62](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-62.md) (where
base units live, and how a procedure is picked).
**Left this phase:** [US-05.5.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.5.2.md)
(ACC pre-op codes) and [OQ-12](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-12.md) moved to
Phase 39b: the ACC pre-op assessment is now a fixed-fee pre-op event on the real Procedure, not a coded
billing line. Nothing here builds pre-op codes.
**Depends on:** Phase 15a (the warning routine, the Warning record, the office to-do list, the warning
triangle and the shared "Raise sample warnings" trigger) and Phase 18 (the reshaped Contract model,
its `ContractScope` arrays and the fee parity harness). Phases 14 and 15 are in place (the trigger
registry; Booking vocabulary).
**Estimated:** 2 sessions. Session 1: work items 1 to 8 (baseline, model, modifier master, resolver,
completion rule and warning rule, groups, seed, store actions, tests), ending green. Session 2: work
items 9 to 14 (Admin masters and the Contract scope chips, the procedure-first picker on every capture
path, the creation paths, the copy sweep, the warning sample, shots, demo guide) and the review pass.
Both sessions are full. If session 2 runs long, cut the Contract-table scope pills (9e's display half)
before any capture path.

**Confirm before building.** US-05.1.1, US-05.1.6 and US-03.3.1 are Verify because of OQ-62. D3 is
answered and is built as the answer, with no provisional label. OQ-62 is built as its recommendation
(base units on the master procedure list, picked by operation name), labelled provisional in **one
place** only (the Master procedure list tab header), and kept behind the one resolver so that switching
the source is one change.

## Goal

Settle where base units come from, and how a procedure is picked, before 20's Contract picker, 23's
Booking-level engine and 25's lock build on them.

- **RVG master becomes editable.** Admins add AA-sourced codes with their base units, marked AA-sourced.
  The NZSA rows keep the guide's own values: the RVG guide is only a guide, and AA sets its own figures
  on the master procedure list (US-05.1.1, OQ-62 recommendation).
- **RVG groups.** AA-defined groups (cosmetic, plastics, dental) are many-to-many tags on codes, beside
  the NZSA body headings (today's `anatomicalSite`). Phase 26's prepaid tick list selects codes by them,
  and a Contract's scope can name them (the field Phase 18 left for this phase; Phase 20 filters by it).
- **Modifier master matches the catalogue set,** with editable units and selection rules held as data:
  add VM1, TTE1 and TTE2, PACU1, EAA1, POC1 to POC3, NC1 and NC2; retire PO1 and PO2.
- **Master procedure list** (DM-13's `ProcedureType`). Operation names, each mapped to an RVG code or
  category and holding its own base units, ideally derived from its code (US-05.1.6). It is admin data.
  The default Contract, and any hospital Contract with no base-unit override, prices from it.
- **One pure base-unit resolver** decides a Procedure's base units: a manual override, then the
  Contract override (a slot that 23 fills), then the anaesthetist's chosen value on a ranged code, then
  the master procedure list, then the RVG guide value.
- **Procedure-first capture picker** on mobile, web and Admin, and on the manual and phone-advice forms.
  The user picks a procedure from the list, grouped and filtered by RVG body headings. That seeds the
  RVG code, the base units and the operation text (US-03.3.1). Phase 20 adds the Contract pick after it.
- **Any base-unit value is accepted (D3).** The ranged clamp and the out-of-range completion refusal
  go. A value can be typed. An entry outside the code's published value or range raises a mild
  after-procedure warning for the office through 15a's routine. It never blocks save, completion,
  submit or authorise.

No figure in the S1 to S5 run sheet moves.

## Before you start: drift check

1. Run `git diff 501b0b8 -- "docs/discovery-reference/Updated Requirements/catalogue" "docs/discovery-reference/Updated Requirements/domain-model.md"`
   and read the hunks for US-05.1.1, US-05.1.3, US-05.1.5, US-05.1.6, US-03.3.1, US-04.2.2 (the
   Contract override this phase leaves a slot for), US-04.3.2 (the Contract pick 20 adds after the
   procedure), US-06.1.1 (the consumer of groups), US-13.7.1 (the warning routine), OQ-06, OQ-56,
   OQ-62 and OQ-53. Also re-read the "RVG code and modifier master" section and the "Selection"
   paragraph of `domain-model.md`. If an item changed, re-read it whole and adjust the work items. If
   one is now Retired or Future, drop its work and say so in the PROGRESS entry.
2. Check `docs/discovery-reference/Data files/` (`git log` on it) for Vanessa's standard procedure
   list (RVG codes and base units, US-05.1.6 note) and AA's fuller modifier list. If the procedure list
   has landed, take operation names and their code mapping for the seed, but keep base units equal to
   what seeded Procedures bill today (item 7c). If the modifier list has landed, take its descriptions
   and selection rules for the ten new codes. Keep unit values demo-plausible and labelled unless the
   owner says to adopt AA's figures, and never re-price a code the run sheet uses.
3. Confirm the open question.

| Gate | Build | If answered differently |
|---|---|---|
| **D3 / OQ-56** (answered) | Any base units accepted; an out-of-range entry raises a mild after-procedure warning for the office through 15a's routine. No label | Not expected. If the drift check shows a threshold or mute was added, that is US-13.7.4 (Future): do not build it |
| **OQ-62** (Open: base units on the master procedure list or the RVG code master; picked by operation name or by RVG code) | The recommendation: base units on the master procedure list, the RVG code master keeps the guide's values, the user picks an operation name. One "Provisional · where base units live and how a procedure is picked are still to confirm with AA (OQ-62)" note on the Master procedure list tab, nowhere else | If base units go on the RVG code master: make NZSA base units editable in item 8a, drop `ProcedureType.baseUnits` from the resolver (step 4 becomes the code's own value) and keep the list as names only. If the pick is by RVG code: keep the picker's grouping and filters but list codes, not entries. Either is a change in `baseUnits.ts` and `ProcedurePickerSheet` only; stop and ask the owner before starting it |
| **US-05.1.1, US-05.1.6, US-03.3.1** (Verify) | Build as written | Adjust to the verified text |

4. Read what Phases 15, 15a, 17 and 18 actually built (their PROGRESS entries). File names below are as
   at `501b0b8`, before Phase 14. Phase 15 renames Card to Booking (for example `validateCardForBilling`,
   `CardDetailBody`, `ManualCardForm`, `cardActions.ts`); Phase 18 reshapes `Contract` and the pricing
   half of `fee.ts`. Follow the renamed files and 18's shapes; this phase touches only the base-unit and
   modifier halves of `resolveBtm`. Confirm in particular:
   - from 15a: where the warning rules live and how a rule is registered, the Warning shape (timing
     before or after, strength mild or strong, text, rule key, per-Procedure key), when an
     after-procedure warning surfaces and is re-raised after a Clear, how samples are added to "Raise
     sample warnings", and whether 15a folded any review flags into warnings;
   - from 18: `ContractScope` (its `procedureTypeIds`, typed `string[]` and empty on every Contract;
     its `rvgCodes` and funding-source arrays), `SCOPE_NARROWING_DIMENSIONS` in `contracts.ts`, the
     `feeParity.test.ts` harness and its `__parity__/` fixture, `ContractEditSheet`'s Scope chips,
     and how `auditNarrative.ts` narrates a scope.
5. Record the current `PERSIST_VERSION` (13 at `501b0b8`; 14 to 18 will have bumped it).

## Reference

**Design (convention 17).** No mockup covers Admin master data. Extend the Admin Review page's table
anatomy (`docs/design/Admin Review.dc.html`: header row, mono data cells, status pills, row actions) and
the existing Master data tabs and edit sheets (`ContractEditSheet`, `AddHolidaySheet`). Capture stays on
`docs/design/Mobile App.dc.html` screen 3 (code card, picker bottom sheet, modifier chips) and its web
twin in `Web Dashboard.dc.html`'s card anatomy: the procedure picker is that sheet with a body-heading
chip row added under the search box. Tokens, the pill and tint treatments, the warn tint and the
provisional badge style come from `Design Language.dc.html`. Teal is the only action colour. Source,
group and "Provisional" markers are neutral pills, never crimson.

**Catalogue.** The files linked above, plus
[US-04.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.2.md)
(Contract base-unit override, built in 23),
[US-04.3.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.3.2.md)
(the filtered Contract pick after the procedure, built in 20),
[US-05.1.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.1.4.md)
(absorbed loadings, which already match),
[US-03.7.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.7.2.md)
(post-op work is a post-op event, built in 39b, which is why PO1 and PO2 go),
[US-06.1.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.1.1.md)
(prepaid by group, built in 26),
[US-13.7.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.7.1.md)
(the warning routine and its out-of-range warning, built in 15a), and
[US-13.4.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.4.3.md)
(spreadsheet loads, built in 42). OQ-53's answer (combinations are Contracts, the list is grouped and
filtered by body headings). The evidence is `catalogue/notes/2026-10-01-aa-meeting-with-greg.md`
items 4, 27, 30, 47, 53, 55 and 59.

**Analysis.** `../GAP-ANALYSIS.md` sections "EP-05 · RVG master data and fee calculation rules" and
"EP-03" (US-03.3.1), the DM-13 row of "Structural changes" and the RV-04 row of "Prototype behaviour to
remove or rework". `../epics/EP-05.md` (US-05.1.1, 05.1.3, 05.1.5, 05.1.6) and `../epics/EP-03.md`
(US-03.3.1). `../analysis/domain-model-delta.md#dm-13` and `#dm-31` (the warning record),
`../analysis/reverse-check.md` (RV-04). `../analysis/prototype-map-domain.md` (billing maths),
`prototype-map-shared.md` (capture suite), `prototype-map-admin.md` section 9 (Master data), and
`prototype-map-store-seed.md` (masters, seed).
`docs/discovery-reference/Data files/Master Fee List.xlsx` (Procedures tab: Body Section, Subgroup,
Procedure, RVG Code, Base Units) and `Data files/Group 1/Anaesthesia_Associates_Procedure_Master_Cleaned_v2.xlsx`
show AA's own procedure-list shape. Take the shape and a few operation names from them, not their
figures.

**Code entry points (at `501b0b8`).**

- Types: `src/domain/types.ts`. Covers `UnitProvenance`/`CapturedUnits` (86), `Procedure` (444:
  `description`, `rvgBaseCode`, `baseUnitsSelected`, `baseUnitsCaptured`, `selectedModifierCodes`),
  `RvgBaseUnits` and `RvgCode` (536 to 547), `ModifierGroup` (549, with `'POSTOP'`) and `ModifierCode`
  (556).
- Modifier master: `src/domain/billing/modifierCodes.ts`. Holds `MODIFIER_CODES`, a static `BY_CODE` map,
  `EXCLUSIVE_MODIFIER_GROUPS`, `STACKS_WITHIN_GROUP`, `modifierBandOf`, `toggleModifierCode` and
  `ASA_SEED_UNITS`. `modifierUnits.ts` sums and refuses codes. All of these read the static table today,
  although `masters.modifierCodes` is already in the store.
- Base units: `src/domain/billing/fee.ts`. `resolveBtm` (58) reads `baseCode.baseUnits` or
  `baseUnitsSelected`, and `FeeContext.baseCode` (122) feeds it.
- `validateCardForBilling.ts`: `feeContextFor` (77), the "something to charge" rule (129 to 132), and the
  in-range rule (152 to 163, the RV-04 guard). `invoiceBuild.ts` (`InvoiceBuildContext`).
- UI fee context: `src/shared/capture/feeContext.ts`. `procedureFee` is the second fee-context assembler
  and must stay in step with `feeContextFor`.
- Seed: `src/domain/seed/rvgCodes.ts` (`RVG_CODES`, about 35 codes; ranged 20880, 47522, 51011, 45030;
  `EYE_CODES`, `GENERAL_CODES`), and `seed/index.ts` (`SeedMasters`, 95 and 96, built at 410 and 411).
  In `seed/cards.ts`, a range draw consumes the RNG. `seed/billing.ts` `contextFor` builds the seeded
  invoices.
- Store: `src/store/mastersActions.ts` (the office-only, audited master pattern), `lifecycle.ts`
  `editProcedure` (445), `cardActions.ts` (create input, `rvgBaseCode` at 44 and 136), `mutate.ts`
  `allocateId` (99, id kinds).
- Admin: `src/apps/admin/screens/MasterData.tsx`. Covers `NAV` (41), the `Sheet` union (60),
  `RvgCodesView` (411) and `ModifierCodesView` (432). `src/apps/admin/flows/ContractEditSheet.tsx`
  (18's Scope chips), `src/domain/billing/contracts.ts` (18's Contract helpers), and
  `apps/admin/flows/PhoneAdviceBooking.tsx` (the prefill with `rvgBaseCode: '20950'`, 28 to 36).
  `apps/admin/reviewFlags.ts` (`naturalBtm`) and `ReviewScreen.tsx`.
- Capture (shared by mobile, web and the Admin Booking detail): `src/shared/capture/`. Covers
  `BtmCaptureBlock.tsx`, `ProcedureCodeCard.tsx` (`pick` at 38, the `RangeUnitsRow` clamp at 147),
  `CodePickerSheet.tsx` (search by code or name, grouped by `anatomicalSite`, 33 to 47),
  `ModifierChips.tsx` (the static `BANDS` and `STACKING_CODES`), `modifierLabels.ts`, `UnitsCard.tsx`
  (the B caption and `modifierBreakdown`), `AsaCard.tsx` (`ASA_SEED_UNITS`). Creation forms:
  `src/shared/flows/ManualCardForm.tsx` (the "Procedure code" select, 172 to 195) and
  `sampleExtractions.ts` (codes 20941 and 49558).
- Tests to extend: `domain/billing/modifierUnits.test.ts`, `fee.test.ts`, `seed.test.ts`,
  `store/btmCapture.test.ts`, `captureActions.test.ts`, `cardActions.test.ts`, `mastersActions.test.ts`,
  15a's warning-routine tests, `src/pwa/pwaPurity.test.ts` (must stay green). Playwright:
  `visual/mobile-phase04.spec.ts` (`m4-01-modifiers` and the code picker shots),
  `mobile-interactions.spec.ts` (the PA band indicator), `admin-phase07.spec.ts` (`a7-04-masters`).

## Work items

Model, domain and seed first, then store, then UI. Every new write goes through `mutate()` with an audit
meta. Every rule is a pure function in `src/domain/billing/` (the warning rule in 15a's rule location)
with a Vitest test.

1. **Baseline the figures (before any edit).** Phase 18 built the harness:
   `src/domain/billing/feeParity.test.ts` with its fixture in `domain/billing/__parity__/`. Add a
   `phase-19-baseline.json` fixture beside 18's, generated from the untouched code at the start of this
   phase (if 18's harness is missing, create it to the same shape and say so in PROGRESS). It covers
   every seeded Procedure's `feeFor` total and every seeded invoice total from `buildSeed()`. Never
   regenerate it with `-u`: a mismatch is a parity failure to explain, not to accept. The fixture must
   come out identical at the end of the phase. The only allowed exceptions are ones listed in the
   PROGRESS entry, and none are expected. This is how "keep the S3 captures' figures by remapping, not
   re-pricing" is proved.

2. **Model** (`src/domain/types.ts`), serving US-05.1.1, 05.1.3, 05.1.5, 05.1.6 and DM-13.
   - `RvgCode` gains `source: 'nzsa' | 'aa'` (the AA-sourced marker, US-05.1.1 AC) and
     `aaGroupIds: RvgGroupId[]`. `anatomicalSite` stays: it is the NZSA body heading that groups and
     filters the picker (US-03.3.1). Its UI label becomes "Body heading".
   - New `RvgGroup { id: RvgGroupId; name: string; description?: string }`. These are AA groups only.
     Body-heading groups are derived from `anatomicalSite`, never stored, so they cannot drift. A pure
     `RvgGroupRef = { kind: 'site'; site: string } | { kind: 'aa'; groupId: RvgGroupId }` names either
     kind for consumers (26's tick list, 20's picker, 23's overrides).
   - New `ProcedureType { id; name; rvg: { kind: 'code'; code: string } | { kind: 'group'; group: RvgGroupRef };
     baseUnits: number; notes?: string }`. Base units are a single defined figure (US-05.1.6 AC1),
     pre-filled from the code's guide value when an entry is created ("ideally derived from its RVG
     code"). The UI names it "Master procedure list" (Donald's proposed name, without "RVG"); the type
     name follows DM-13.
   - `Procedure` gains `procedureTypeId?: ProcedureTypeId`, the procedure picked from the list. A
     Procedure picked from a group-mapped entry has `procedureTypeId` and no `rvgBaseCode`.
   - `ModifierGroup` becomes `'PA' | 'A' | 'AS' | 'ASE' | 'OB' | 'P' | 'AI' | 'VM' | 'TTE' | 'PACU' | 'EAA' | 'POC' | 'NC'`,
     with `'POSTOP'` removed. `ModifierCode` gains `selection: 'oneOfGroup' | 'addsOnTop'`, the selection
     rule as data. A static `MODIFIER_GROUPS` definition in `modifierCodes.ts` holds each group's capture
     title, refusal-sentence band label, order, and `inCaptureByDefault` flag. Groups themselves are not
     admin-editable in this phase (Phase 42 keeps them code-held).
   - `SeedMasters`/`AppState['masters']` gain `rvgGroups` and `procedureTypes`. `allocateId` gains the
     `rvgGroup` and `procedureType` kinds.
   - **Contract scope by RVG group and by procedure** (Phase 18's handoff: "RVG groups arrive with Phase
     19's group master"; the domain model's scope is "procedures[] ... rvgCodes[] or rvgGroups[]").
     Phase 18's `ContractScope` already has `procedureTypeIds` as a `string[]`: retype it to
     `ProcedureTypeId[]`. Add `rvgGroups: RvgGroupRef[]`, and add `rvgGroups` to 18's
     `SCOPE_NARROWING_DIMENSIONS` beside procedures and RVG codes. Both stay empty on every seeded
     Contract so no selection or figure moves; empty means no narrowing, like 18's other scope arrays.
     Phase 20's picker filters by them through `scopeCoversProcedure` (item 6) and seeds the first
     procedure scopes (its item 7); Phase 23 sets `procedureTypeIds` on combination Contracts (one
     Contract under each parent procedure, OQ-53). This phase builds no selection change. If 18's own
     selection helper already reads `scope.rvgCodes`, route it through `scopeCoversProcedure` so groups
     count too. Give `auditNarrative.ts` English for the two scope fields.

3. **Modifier master as data** (US-05.1.5).
   - `modifierCodes.ts`: `MODIFIER_CODES` becomes exactly the catalogue set. That is PA1 to PA5, A1 and
     A2, AS1 to AS4, ASE, OB1 to OB4, AI1, P1, plus the new VM1, TTE1, TTE2, PACU1, EAA1, POC1 to POC3,
     NC1 and NC2. PO1 and PO2 are removed (post-op work is a post-op event, Phase 39b). Existing codes
     keep their units exactly (S3 figures; Decisions log 2026-07-22, 2026-07-23).
   - New codes get demo-plausible units (1 or 2) and a neutral description ("Description to confirm
     with AA"), unless drift check step 2 supplied AA's text. Do not invent clinical meanings.
   - Existing codes keep their descriptions, which still carry the RFP's meanings (a US-05.1.5 gap
     point). They become admin-editable in item 9d and sit under the "until AA's fuller list arrives"
     subheading. If AA's list has landed, replace descriptions only, never units.
   - AS2 stays. The domain model's modifier list reads "AS1/AS3/AS4", but US-05.1.5 says AS1 to AS4,
     the story wins, and the seed's ASA draw uses AS2. Note it in the Decisions log.
   - Selection defaults, which are a picked reading: numbered siblings (TTE1/TTE2, POC1 to POC3,
     NC1/NC2) are `oneOfGroup`, like PA, A, AS and OB; the singletons VM1, PACU1 and EAA1 are
     `addsOnTop`. PA5 keeps `addsOnTop` (the 2026-07-27 exemption).
   - `EXCLUSIVE_MODIFIER_GROUPS` and `STACKS_WITHIN_GROUP` are replaced by the per-code `selection`
     field. Every existing code's resulting band must equal today's, which the tests assert.
   - `modifierBandOf`, `toggleModifierCode` and `modifierUnits` take the master
     (`Readonly<Record<string, ModifierCode>>`) as a **required** parameter, so the compiler finds every
     caller. `fee.ts` gets it from a new `FeeContext.modifierCodes`, fed by `feeContextFor`,
     `procedureFee`, `InvoiceBuildContext` and `seed/billing.ts` `contextFor`.
   - `ASA_SEED_UNITS` becomes `asaSeedUnits(asaClass, master)`, read from the AS rows, so an edited AS
     unit value shows in `AsaCard` and the M caption.
   - The static table survives only as the seed source and a test fixture (`DEFAULT_MODIFIER_MASTER`).
     No runtime path reads it.
   - Tests (`modifierUnits.test.ts`):
     - the code set equals the US-05.1.5 list;
     - PO1 and PO2 are gone, and the POSTOP assertions are rewritten;
     - every existing code's band is unchanged;
     - flipping a code's `selection` in a test master changes both toggle and sum behaviour;
     - an unknown code is still refused with its reason.

4. **The base-unit resolver**, a new `src/domain/billing/baseUnits.ts` (US-05.1.6 AC1 to AC4, US-03.3.1,
   RV-04). This is the one place OQ-62's answer lives.
   - `resolveBaseUnits({ procedure, rvgCode?, procedureType?, contractBaseUnits? })` returns
     `{ units, source, guide?, outsideGuide }`, where `guide` is the code's published single value or
     range.
   - `source` is one of `'captured' | 'contract' | 'rvgRangeChosen' | 'procedureList' | 'rvgGuide' | 'none'`.
   - Precedence:
     1. `baseUnitsCaptured.source === 'overridden'` (a manual override, unchanged behaviour);
     2. `contractBaseUnits` (a slot: nothing passes it until Phase 23 adds the Contract override);
     3. on a ranged code, the chosen `baseUnitsSelected` (the anaesthetist's judgement, US-03.3.1;
        the picker seeds it from the list entry, so it is set on every picked ranged Procedure);
     4. a `procedureType` whose mapping covers the Procedure (its own code, a group containing the
        code, or, with no code, the entry itself). This is how the default Contract and every hospital
        Contract with no override take base units from the list (US-05.1.6 AC3);
     5. the RVG guide single value;
     6. otherwise 0 with `'none'`.
   - A link whose entry does not cover the Procedure's current code is ignored, and the fallback
     applies. This is defensive; the store clears such links (item 8).
   - `outsideGuide` is true when the source is `'captured'` or `'rvgRangeChosen'`, the code has a guide
     value, and the units differ from a single guide value or lie outside the guide's min to max. It is
     false for `'procedureList'`, `'contract'` and `'rvgGuide'`: those are AA's own data, which may
     depart from the guide by design (US-05.1.1).
   - `resolveBtm` delegates its base branch to this. `BtmBreakdown` gains `baseSource` and `baseGuide`
     so the UI, the warning rule and 25's lock read one answer. `UnitProvenance` keeps its meaning.
   - `FeeContext` gains `procedureType?` (and `contractBaseUnits?`, left unset). Both assemblers,
     `feeContextFor` and `procedureFee`, look the link up in `masters.procedureTypes`, and so do
     `reviewFlags.naturalBtm`, `invoiceBuild` and `seed/billing.ts`.
   - Add pure helpers: `procedureTypesForCode(code, masters)` (entries mapped to that code or to a group
     containing it) and `soleProcedureTypeForCode(code, masters)` (the entry when exactly one is mapped
     directly to the code, else undefined), for paths that know only a code (item 11).
   - Tests (`baseUnits.test.ts`):
     - each precedence step;
     - two list entries under one RVG code keep their own units (AC2);
     - an unlinked default-Contract Procedure and a linked one each price from the right source (AC3);
     - the Contract slot beats the list (AC4) and the chosen value;
     - a mismatched link is ignored;
     - `outsideGuide`: min and max are inside; min-1 and max+1 are outside; a manual override on a
       single code that differs from the guide is outside; a list entry that differs from the guide is
       not;
     - a group-mapped entry with no code prices from the entry;
     - no code and no entry gives 0 and `'none'`.
   - Grep `baseUnits.kind` afterwards. Outside `baseUnits.ts`, only display helpers (the picker row label,
     the master tables) may read it.

5. **RV-04 rework under D3** (`validateCardForBilling.ts` and 15a's routine).
   - a. **Completion no longer bounds a ranged entry.** Replace the in-range rule. When the Procedure's
     code is ranged, `baseUnitsSelected` is unset, and there is no covering list entry and no Contract
     figure, the rule fails `baseUnitsSelected` with "Base code {code} is a range ({min} to {max}):
     choose a base unit value." Decide this from the resolver's inputs with the manual override set
     aside (its `baseSource` would read `'captured'` and hide the gap): a manual override does not
     stand in for the chosen value, as today; pin that in a test. Any chosen value passes, inside the
     range or not.
   - b. **The "something to charge" rule** accepts a `procedureTypeId` as well as an `rvgBaseCode`, and
     the times rule applies whenever either is set. Its sentence becomes "Pick a procedure or add at
     least one billing line."
   - c. **The out-of-range warning** (US-03.3.1 AC "Out of range", US-13.7.1). Register one rule,
     `baseUnitsOutsideGuide`, in 15a's routine, following 15a's rule shape: timing **after**, strength
     **mild**, one Warning per Procedure, raised when `resolveBaseUnits(...).outsideGuide` is true.
     Text: "Base units {n} are outside the RVG guide for {code} ({min} to {max})." or "(guide value
     {v})." for a single code. It follows 15a's surfacing, clearing and re-raise rules; nothing else
     here decides them. Mild is a picked reading (OQ-56 sets no strength); record it in the Decisions
     log.
     - Wiring, per 15a's "a new rule needs a rule file, a registry entry, its facts, its app-settings
       defaults and a sample": a rule file in `src/domain/warnings/rules/`, appended to `WARNING_RULES`
       after `prepaymentUnpaid`; `baseUnitsOutsideGuide` added to the `WarningRuleId` union; an
       optional fact on `WarningFacts` carrying what the resolver needs (`rvgCodes`,
       `procedureTypes`; the rule imports `resolveBaseUnits` from `domain/billing`, which is pure),
       filled by `warningFactsFor`; a default entry (active, no params) in `appSettings.warningRules`
       through `backfillMerge`, so a persisted store gains it.
     - The finding carries `procedureId`, so the key is per Procedure (15a's key rule).
   - d. Tests: out-of-range passes completion and raises the warning; an in-range value raises none; a
     list-linked ranged code passes with no chosen value; overridden with no chosen value still fails;
     an outside value never blocks completion, submit or authorise (one store test through each); two
     outside Procedures on one Booking give two warnings; the pristine seed raises no
     `baseUnitsOutsideGuide` warning anywhere (so the to-do list is not flooded at load). Update the
     existing in-range tests, which assert the old rule.

6. **RVG groups and scope, the pure side** (`src/domain/billing/rvgGroups.ts`, US-05.1.3).
   - `groupsOfCode(code, masters)` returns the body-heading group plus its AA groups.
   - `codesInGroup(ref, masters)` handles both kinds.
   - `searchRvgCodes(query, masters)` matches code, description, body heading or AA group name, for the
     Admin table.
   - `searchProcedureTypes(query, masters)` matches operation name, RVG code, code description or AA
     group name, and `procedureTypesByHeading(masters, headingFilter?)` returns the entries grouped by
     body heading (the code's `anatomicalSite`; a group-mapped entry under its site or AA group name),
     both for the capture picker.
   - `scopeCoversProcedure(scope, procedure, masters)` is true when `scope.procedureTypeIds`,
     `scope.rvgCodes` and `scope.rvgGroups` are all empty, or the Procedure's entry is listed, or its
     code is listed, or its code is in a listed group.
   - Tests cover many-to-many membership, heading derivation, search, grouping and
     `scopeCoversProcedure` (empty, by entry, by code, by body heading, by AA group, not covered).
     Phase 26 consumes `codesInGroup` and Phase 20 consumes `scopeCoversProcedure`; this phase builds no
     prepaid UI and no Contract selection change.

7. **Seed.** One `PERSIST_VERSION` bump for the whole phase. Draw nothing from the seeded RNG for new
   master data or links, so every generated Booking stays identical.
   - a. `rvgCodes.ts`: every existing row gets `source: 'nzsa'`, and its values do not change. Add two or
     three AA-sourced codes with an `AA` prefix. One is a dental code ("Dental extraction under GA",
     for the dental group), and one is a code the guide does not name. Mark them `source: 'aa'`, with
     demo-plausible base units. Do not add them to `GENERAL_CODES` or `EYE_CODES`, so generation is
     unchanged.
   - b. `rvgGroups`: Cosmetic (41800, 45200, 31340), Plastics (45030, 45200, 31340, 41800), Dental (the AA
     dental code) and Bariatric (20880, 20882). Set membership on `aaGroupIds`.
   - c. `procedureTypes`: **one entry per seeded RVG code**, named from AA's Master Fee List or Vanessa's
     list where one fits, otherwise the code's own description, with base units equal to the code's
     guide value (for a ranged code, its min, which only seeds the stepper). So every code is pickable
     and a link never moves a figure. The one exception is 45030's own entry, "Skin flap repair,
     complex", seeded at 6 (its max) so the pair below differs. Then add:
     - a second entry under 45030 at a different value, "Skin lesion excision, simple" at 4 (AC2), so
       45030 has exactly two entries, 4 and 6;
     - one entry mapped to a group rather than a code (for example "Dental clearance, multiple" under
       Dental);
     - one entry for each AA code.
   - d. **Links.** In a post-generation pass, set `procedureTypeId` on every seeded Procedure whose code
     has `soleProcedureTypeForCode`. Ranged-code Procedures keep their drawn `baseUnitsSelected`, which
     outranks the entry, so no figure moves. 45030 Procedures stay unlinked (two entries) and price as
     today. Scripted Bookings are linked like the rest; S1's Sarah Mitchell (20950) arrives through the
     hospital message path, which links her the same way (item 11). The parity fixture (item 1) must
     hold.
   - e. Every seeded Contract gets `scope.rvgGroups: []`; `scope.procedureTypeIds` stays empty as 18
     left it (Phase 20 seeds the first procedure scopes, 23 the combination parents).
   - f. `modifierCodes`: the new set via `byId`. At `501b0b8` no seeded Procedure selects PO1 or PO2 (grep
     `cards.ts`). If 15 to 18 introduced any, remap each one to a fixed billing line ("Post-op ward
     review" or "Post-op acute pain management"). Its amount is the dollar value the code contributed at
     that Procedure's resolved unit rate, so the fee total is unchanged; the parity fixture proves it.
     Phase 39b turns such lines into post-op events.
   - g. Update `seed.test.ts`:
     - every `procedureTypeId` resolves and covers its Procedure's code;
     - every seeded RVG code has at least one entry;
     - every seeded modifier selection is in the master;
     - AA codes are marked `aa`;
     - group members exist.

8. **Store actions.** Items a to d are office-only, audited, and return `Outcome`, following
   `mastersActions.ts`. Put them in a new `src/store/rvgMasterActions.ts` and export them from
   `store/index.ts`. Item e follows `editProcedure`'s lifecycle rights.
   - a. RVG codes (US-05.1.1).
     - `addAaRvgCode` validates: the code is unique, the description is non-empty, the body heading is
       required, base units are a positive integer (single) or a min under max (range), absorbs lists
       only codes in the master, and groups exist. Always `source: 'aa'`. An `alsoAddToProcedureList`
       flag (default true) creates the matching `ProcedureType` in the same commit, so the code is
       pickable at once.
     - `editAaRvgCode` refuses an NZSA row with `nzsaGuideReadOnly`: "NZSA codes keep the guide's
       values. Set AA's own figure on the master procedure list."
     - `setRvgCodeGroups` works on any code; tagging is allowed on NZSA rows.
     - `deleteAaRvgCode` is refused with `codeInUse` while any Procedure or ProcedureType references the
       code.
   - b. RVG groups (US-05.1.3): `createRvgGroup` (the name is unique), `renameRvgGroup`, and
     `deleteRvgGroup`, which is refused while a ProcedureType maps to it or a Contract scope lists it.
     Membership is removed with it, and the audit entry records the codes it covered. Contract scope
     groups and procedures are written through Phase 18's Contract edit action, which gains a check that
     each group and entry exists.
   - c. Master procedure list (US-05.1.6 AC1): `createProcedureType`, `editProcedureType` and
     `deleteProcedureType`.
     - Save requires a name, an RVG code or group that exists, and a positive integer for base units
       (AC1).
     - A duplicate name under the same code is refused.
     - Delete is refused while Procedures link to the entry or a Contract scope lists it.
     - An edit re-prices unlocked Procedures that link to it and have no chosen value. That is the
       expected pre-25 behaviour, and AUTHORISED invoices keep their snapshot amounts. Say so in a test.
   - d. Modifier codes (US-05.1.5): `editModifierCode` (units a non-negative integer, description,
     selection) and `addModifierCode` (into an existing group; the code is unique). `deleteModifierCode`
     is refused while any Procedure selects the code.
   - e. **Picking a procedure** (US-03.3.1). `pickProcedure(api, actor, procedureId, procedureTypeId)`
     writes in one audited commit: `procedureTypeId`; `rvgBaseCode` (the entry's code, or cleared for a
     group-mapped entry); `baseUnitsSelected` (the entry's units when the code is ranged, else cleared);
     `baseUnitsCaptured` cleared; and `description` set to the entry's name when the description is
     empty or still equals the previous entry's name or the previous code's description, so typed
     operation text survives. It follows the same rights as `editProcedure` (the anaesthetist on a
     DRAFT Booking, the office per its edit rules). `editProcedure`:
     - clears `procedureTypeId` in the same commit when a patch changes `rvgBaseCode` to a code the
       entry does not cover;
     - accepts any positive whole number for `baseUnitsSelected` (no range check; refuse zero, negatives
       and fractions with "Base units must be a whole number of 1 or more.").
     - `createCard`'s input (`cardActions.ts`) gains `procedureTypeId`, validated the same way.
   - Tests: a new `store/rvgMasterActions.test.ts` covers every guard and audit entry above. Also
     cover:
     - editing a modifier's units changes a DRAFT Procedure's fee, and an already-built invoice does not
       change;
     - `pickProcedure` seeds code, chosen value and description, keeps typed text, and is refused on a
       submitted Booking for the anaesthetist;
     - the link is cleared when the code changes;
     - an out-of-range `baseUnitsSelected` is stored;
     - a Contract scope naming an unknown group or entry is refused, and a group or entry in a scope
       cannot be deleted.

   **Session 1 ends here, green:** `npm run build`, `npm run build:pwa`, `npx vitest run`, and the parity
   fixture unchanged. The old `CodePickerSheet` still works in session 1, because every Procedure with a
   code still prices without a link.

9. **Admin, Master data** (`MasterData.tsx`, desktop; teal actions; tables in the existing chrome).
   New admin sheets (`RvgCodeSheet`, `RvgGroupSheet`, `ProcedureTypeSheet`, `ModifierCodeSheet`) are new
   files in `src/apps/admin/flows/` beside `ContractEditSheet`, each a new member of the `Sheet` union.
   - a. **RVG codes.** A search box drives `searchRvgCodes`, and a group filter covers body headings and
     AA groups.
     - Columns: Code (mono), Description, Body heading, Groups (neutral pills), Base units, Absorbs, and
       Source. Source is a neutral "NZSA" or "AA" pill; the AA pill shows "AA-sourced" in its title.
     - "Add AA code" opens `RvgCodeSheet` (code, description, body heading, single or range base units,
       absorbs, groups, and "Also add to the master procedure list", on by default).
     - Row "Edit" opens the same sheet. For an NZSA row, only Groups can be edited, and the base-unit
       fields are read-only with the `nzsaGuideReadOnly` sentence as a caption.
     - The subheading drops "view only" and reads "The RVG guide is a guide: AA sets its own base units on
       the master procedure list. Demo-plausible values; the full NZSA 2021 set loads at go-live (Phase
       42)."
   - b. **RVG groups** is a new tab (or a panel on the RVG codes tab). It lists each group with its code
     count, and offers New group, Rename, and Delete, with the refusal sentence shown. Tag codes from
     the code sheet's Groups field, a multi-select of chips.
   - c. **Master procedure list** is a new tab. It is a table of Operation name, Mapped to (code mono with
     its description, or group pill), Body heading, Base units (mono), RVG guide (mono, the code's guide
     value or range, for comparison), and Linked Procedures (count).
     - New and Edit open `ProcedureTypeSheet`: a name, a mapping segmented control (RVG code or RVG
       group) with a searchable select, and a base-units stepper pre-filled from the guide value, with
       "RVG guide: N" beside it.
     - The header carries the phase's one OQ-62 note, as a `DemoBadge`: "Provisional · where base units
       live and how a procedure is picked are still to confirm with AA (OQ-62)."
     - A caption under the header: "If a procedure's base units keep being overridden, change its figure
       here." (US-05.1.6, the meeting's guidance.)
     - Delete is refused while entries are linked.
   - d. **Modifier codes.** Each row gets Edit, and the tab gets an "Add modifier code" action; both use
     `ModifierCodeSheet`.
     - Fields: units stepper, description, and Selection as a segmented control ("Pick one in group" /
       "Adds on top"). The group is fixed on edit and chosen on add.
     - The Selection column now reads the data.
     - The subheading says: "Unit values are demo-plausible, not AA's schedule. New codes' descriptions
       are to confirm until AA's fuller list arrives."
     - Keep the PA5 "question for AA" wording unless the drift check shows it is settled.
   - e. **Contracts.** `ContractEditSheet`'s Scope section (Phase 18's multi-select chips) gains "RVG
     groups" (body headings and AA groups) and "Procedures" (master procedure list entries) chip selects
     beside RVG codes. The Contracts table's scope summary shows them as neutral pills. Nothing else in
     the Contract editor changes.
   - Add `data-shot` hooks: `masters-rvg`, `masters-rvg-groups`, `masters-procedure-list`,
     `masters-modifiers`.

10. **Procedure-first capture, mobile, web and Admin (shared)**, for US-03.3.1, US-05.1.5 and RV-04.
    `BtmCaptureBlock` is shared by the mobile Booking, the web Booking and the Admin Booking detail, so
    this is one change for all three.
    - a. **`ProcedurePickerSheet`** (new, `src/shared/capture/`), replacing `CodePickerSheet`, which is
      deleted.
      - Title "Procedure". A search box ("Search procedure, code or group") drives
        `searchProcedureTypes`.
      - Under it, a horizontally scrolling chip row of body headings ("All", then each heading in
        order) filters the list (US-03.3.1 "grouped and filtered by RVG body headings").
      - Rows are grouped under body-heading headers. Each row: the operation name (15, semibold), the
        mono RVG code (or a neutral group pill), and "B 5" or "B 5 · guide 4 to 6". The current entry is
        tinted teal, as today.
      - Empty state: "No procedures match that search."
      - Picking calls `pickProcedure`. A bottom sheet on mobile, the surface's overlay on web and Admin
        (`useSurface`), as today.
    - b. **`ProcedureCodeCard`** (section label "Procedure").
      - Linked: the entry name, the mono code beneath, and "Base 5 units · from the procedure list".
      - Unlinked with a code (an inbound Booking whose code has two entries, or a legacy Procedure): the
        code and its description, a "Choose the procedure" prompt, and the picker opens with the search
        pre-filled with the code.
      - Nothing yet: "No procedure yet" and "Choose".
      - The 2026-09-28 ruling holds: base units are capture context, and the anaesthetist's card still
        shows no fee.
    - c. **`RangeUnitsRow`** drops its clamp. The floor is 1 and there is no ceiling. The value is
      seeded by the pick; steppers move it by one, and tapping the value opens a numeric input
      (`inputMode="numeric"`) so any value can be typed. The guide stays in the label ("Guide 8 to 10 ·
      11 chosen"). Outside the range, a warn-tinted caption (not an error, no label): "Outside the guide
      range. The office will see a warning after the procedure."
    - d. `ModifierChips`: `BANDS` and `STACKING_CODES` are derived at render from
      `useAppStore((s) => s.masters.modifierCodes)` and `MODIFIER_GROUPS`, no longer at module load.
      - Groups with `inCaptureByDefault` (PA, A, OB, ASE, P, AI) render as today.
      - The new groups (TTE, POC, NC as segmented bands; VM1, PACU1, EAA1 as chips) sit under a
        "More modifiers" disclosure row. It starts collapsed, opens itself when any code inside is
        selected, and shows a count of selected codes. This keeps the phone's capture height, which is
        what the 2026-07-28 ruling was about.
      - Labels come from `modifierLabels.ts`. PO1 and PO2 are removed, and new codes fall back to the
        code itself ("TTE1"), not an invented label.
      - The footer caption becomes: "Modifier unit values are demo-plausible, not AA's schedule."
    - e. `UnitsCard` and `AsaCard` read the store master (via `asaSeedUnits`, `modifierBreakdown` and
      `getModifierCode(code, master)`). The B row's caption comes from `baseSource`: "From the procedure
      list", "From the RVG guide", "Chosen", "Chosen, outside the guide range", "Set manually" (with
      "outside the guide range" appended when `outsideGuide`) or "Set by the Contract" (from 23).

11. **Creation paths pick a procedure too.**
    - `ManualCardForm` (shared: mobile and web add, Admin add, phone advice): the "Procedure code" select
      becomes a "Procedure" chooser row that opens `ProcedurePickerSheet`. Picking fills the operation
      text (still editable) and passes `procedureTypeId` and the code to `createCard`. It stays optional,
      as today.
    - Paths that know only an RVG code link through `soleProcedureTypeForCode`, or leave the Procedure
      unlinked (it then prices from the guide and the card prompts as in 10b): the phone-advice prefill
      (`PhoneAdviceBooking`, 20950), the photo extractions (`sampleExtractions.ts`, 20941 and 49558), the
      hospital message and integration intake, and any demo trigger that creates a Procedure. Grep
      `rvgBaseCode:` across `src/` to find them all.
    - Copy, add-procedure and post-op paths carry `procedureTypeId` wherever they carry `rvgBaseCode`.

12. **Copy and label sweep.** Search `src/` for "view only" (RVG and modifier tabs), "PO1", "Post-op
    ward review", "between {min} and {max}", "needs a selected unit value", "Procedure code", "Search
    code or name", "No codes match", "Add an RVG base code" and "RFP's stated ranges", and update each.
    Every new user-visible string follows the no en/em dash rule; ranges use "to". The only provisional
    label is the OQ-62 note (item 9c), using `DemoBadge` (`src/shared/DemoBadge.tsx`), never crimson.

13. **Warning sample** (see Demo triggers). Add this rule's entry to 15a's `WARNING_SAMPLES` in
    `src/store/warningSamples.ts` (`{ ruleId, stage, unstage }`), never in an app folder, and update
    15a's "1 rule registered" message and its registry test: with a second rule, the `multiWarning`
    Booking now shows two warnings on screen.

14. **Playwright and green.**
    - Update `m4-01-modifiers`, the code picker shots (now the procedure picker) and the
      `mobile-interactions` band spec, which follows PA and must keep passing.
    - Add specs for:
      - the four master tabs;
      - adding an AA code (with "Also add to the master procedure list") and picking it in the mobile
        procedure picker;
      - the body-heading filter narrowing the picker;
      - typing an out-of-range value on 47522, the caption, completion succeeding, and the warning on
        the Admin to-do list.
    - Run `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots`. All must be green,
      and the parity fixture unchanged.

## Demo triggers

- **15a's "Raise sample warnings" gains an out-of-range sample** (Admin · Day and Admin · Booking
  detail, bar). It follows 15a's targets: on the Day view, 15a's pinned
  `SEED_WARNING_SAMPLE_BOOKINGS`, including `multiWarning`, which now shows two warnings (the
  prepayment one and this one); on a Booking detail, the Booking in the URL. On each target it takes
  the first Procedure with an RVG code (a stable rule, never a hardcoded id): on a ranged code it sets
  `baseUnitsSelected` to the guide's max plus 2; on a single code it sets a manual base-unit override
  of the guide value plus 2. Both go through the audited `editProcedure` as 15a's demo actor, and
  `unstage` restores the Procedure's fields from the pristine seed. The mild after-procedure warning
  then shows on the to-do list and as a triangle on that Booking in all three apps. It shares 15a's
  disabled states ("Samples already raised", an AUTHORISED List).
- **Normal use, no new button:** on mobile or web capture, typing base units outside the range is
  accepted, and the warning lands on the office's to-do list (15a's to-do list and triangle show it
  like any other open warning).
- Everything else (the masters, the procedure picker, the modifier chips) is shown through normal use.
  No Control Panel change. PWA: the picker, the unclamped range and the triangle reach the PWA through
  the shared capture components, so the out-of-range beat is normal use on the handset and needs no PWA
  trigger. No mobile beat waits on the office (a warning never blocks), so no new PWA stand-in is
  needed; clearing uses 15a's "Office clears this warning". Master edits are Admin-only, and the PWA
  shows their effect when the handset reloads its seed, like any other master.

## Out of scope

- The Contract pick after the procedure, filtering by `scopeCoversProcedure`, holder-code search and
  the default hospital Contract (Phase 20, US-04.3.2). This phase adds only the scope fields, their
  editor chips and the pure helper.
- The Contract base-unit override and its UI, Booking-level pricing with the 3/2/2 modifier split, and
  combination Contracts (Phase 23). This phase only leaves the resolver's `contractBaseUnits` slot,
  tested, and the `procedureTypeIds` scope field.
- Locking the base-unit source at AUTHORISED (Phase 25). The prepaid tick list of codes and groups
  (Phase 26). Estimated duration per Procedure (Phase 27).
- ACC pre-op codes and every pre-op or post-op event (Phase 39b, US-05.5.2, OQ-12, OQ-63).
- Spreadsheet loads of the RVG, procedure-list and modifier masters, Vanessa's full procedure list, the
  full NZSA 2021 set, and editing the modifier groups themselves (Phase 42).
- Warning thresholds, mutes and the warning settings page (US-13.7.4, Future).
- Real NZSA or AA unit values. All units stay demo-plausible and labelled.

## Manual test checklist

- [ ] Admin → Master data → RVG codes: search "cosmetic" finds the tagged codes. The group filter
      narrows to Plastics. Each row shows an NZSA or AA source pill.
- [ ] Add AA code (for example AA205, single base 4, body heading Skin, group Plastics, "Also add to the
      master procedure list" on): it saves with an AA pill, an entry appears on the list, and both have
      audit entries. On mobile, the procedure picker lists it under Skin, and picking it seeds Base 4.
- [ ] Editing an NZSA row allows Groups only. The base units are read-only and carry the guide sentence.
- [ ] Deleting an AA code that a Procedure uses is refused with the in-use sentence.
- [ ] RVG groups: create "Orthodontic", rename it, and try deleting a group a list entry maps to
      (refused).
- [ ] Contracts: edit a Contract's scope, add the Cosmetic RVG group and one procedure, save (audited),
      and see them as neutral pills. Deleting Cosmetic is then refused. Remove both again.
- [ ] Master procedure list: two entries under 45030 show 4 and 6 beside the guide "4 to 6". Saving an
      entry without a mapping or base units is refused. The OQ-62 note shows here, and nowhere else.
- [ ] Mobile capture on a DRAFT Booking: "Change" opens the procedure picker. Searching "skin" and
      tapping the Abdomen chip both narrow it. Picking "Skin lesion excision, simple" sets 45030 with the
      range stepper at 4 and the operation text; picking "Skin flap repair, complex" moves it to 6.
      Typed operation text is not overwritten.
- [ ] Ranged code (47522 hip revision): stepping or typing 11 is allowed, with the "Outside the guide
      range" caption. Mark complete and submit succeed. The Admin to-do list shows "Base units 11 are
      outside the RVG guide for 47522 (8 to 10)", and the Booking carries the triangle in mobile, web
      and Admin. Clearing it works as 15a defines. A value of 9 raises nothing.
- [ ] Web capture and the Admin Booking detail behave the same; the manual add form and phone advice
      both open the same picker.
- [ ] Admin Day Tue 21 → Demo actions → "Raise sample warnings" includes the out-of-range sample; the
      `multiWarning` Booking shows two warnings, each with its own text. "Clear sample warnings"
      restores its Procedure's seed values.
- [ ] Modifier codes: the set matches US-05.1.5, with PO1 and PO2 gone. Editing TTE1 to 2 units and
      selecting it on a DRAFT Booking adds 2 to M. Switching TTE's selection to "Adds on top" lets TTE1
      and TTE2 stack.
- [ ] Capture: PA, A and BMI bands and the Also applies chips look as before. "More modifiers" opens
      and shows the new bands and chips, and it opens itself on a Booking that has one selected.
- [ ] S1 Beat 3 (Sarah Mitchell, 20950, linked to "Appendicectomy, laparoscopic") and S3's Holt and fee
      figures are unchanged, and the parity test is green.
- [ ] Audit viewer: rvgCode, rvgGroup, procedureType, modifierCode and pickProcedure entries appear with
      before and after values.
- [ ] No en or em dash in any new app copy (grep the diff). Actions are teal, pills neutral, and no
      crimson.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots` green.

## Demo guide updates

No scripted figure changes. Patch the wording these sections carry, and the matching sections of
`master-demo-guide.html`, in the same session:

- `04-presenter-cheat-sheet.md`:
  - "Fee calculation": "The anaesthetist selects the RVG code" becomes "The anaesthetist picks the
    procedure from AA's master procedure list, grouped by RVG body heading, which seeds the code and
    base units". "Some RVG codes are ranges..." becomes "On a ranged code she chooses the value; any
    value is accepted, and one outside the guide raises a warning for the office after the procedure,
    never a block". Add "Base units come from the master procedure list (AA's own figures; the RVG guide
    is only a guide). Where they live is still to confirm with AA (OQ-62)."
  - "RFP ambiguities" item 10 ("Modifier values and time rounding"): the modifier set is the
    catalogue's, editable in Admin; selection rules are master data; post-op work is not a modifier.
  - Item 12 ("ACC pre-op flat-fee codes") is Phase 39b's; leave it for that phase, but remove any
    claim that this phase changed it.
- `02-workflows-and-handoffs.md` capture steps 3 and 8: step 3 becomes "For each Procedure she picks the
  procedure from the list (filtered by body heading), which seeds the RVG code and base units; on a
  ranged code she sets the value, and an out-of-range value raises an office warning"; step 8 removes
  "post-op care" from the stacking list and mentions "More modifiers".
- `03-demo-script.md`:
  - S1 Beat 3: "Choose procedure 20950" still reads correctly (Sarah arrives linked); check the
    Expected text names the procedure card as it now reads.
  - The S5 discovery points (the line about demo-plausible modifier values): add the master procedure
    list and OQ-62.
  - Add an optional "Worth pointing at" in S5: Admin → Master data → Master procedure list, showing two
    entries under one code and the guide column.
  - Confirm S3 reads unchanged.
- Control Panel scenario text: none expected. Grep `src/apps/demo` for "post-op", "RVG code" and modifier
  wording to confirm.

## Adversarial review (after build)

After the manual test checklist and the four commands are green, and before writing the PROGRESS entry,
run the standard **adversarial review-and-fix pass (PROGRESS convention 18)**. Fan out about three
independent Opus review subagents, one each for **quality**, **bugs/correctness** and **plan adherence**.
Add a fourth on billing maths, because the resolver sits under every fee. This session then
independently verifies every finding against the catalogue files, this doc and the code, fixes the
confirmed ones (with a test for each bug), re-greens, and records the pass. Do not re-raise anything
settled in the Decisions log.

**Steer this phase's reviewers at:**

- **No figure moved.** The parity fixture is byte-identical. S1 Beat 3, S3 Holt (whatever 16 to 18
  left) and the S3 fee figures are unchanged. Every seeded link resolves to exactly the units the
  Procedure billed before; ranged Procedures keep their drawn chosen value.
- **One base-unit answer.** Only `baseUnits.ts` decides base units and `outsideGuide`. Both fee-context
  assemblers (`feeContextFor`, `procedureFee`), `invoiceBuild`, `seed/billing.ts`, `naturalBtm` and the
  warning rule pass the same inputs. Check the precedence: manual override, then Contract slot, then
  chosen ranged value, then the list, then the guide. A stale or mismatched link falls back instead of
  pricing. Switching OQ-62's answer would touch only `baseUnits.ts` and the picker.
- **D3 is done exactly.** No clamp in the UI, no range check in the store, no out-of-range refusal in
  the validator. An outside value raises one mild after-procedure warning per Procedure through 15a's
  routine and blocks nothing (save, complete, submit, authorise). An unchosen ranged value with no list
  entry still blocks, and a manual override does not waive it. The rule is wired as 15a requires (rule
  file, registry entry, facts, app-settings default, sample), the pristine seed raises none, and the
  `multiWarning` Booking shows two warnings. No "provisional" label on any of it.
- **Procedure-first everywhere.** Mobile, web, the Admin Booking detail, the manual form and phone
  advice all use `ProcedurePickerSheet`; `CodePickerSheet` is gone. Grouping and filtering use body
  headings. Picking writes code, link, chosen value and operation text in one audited commit, and does
  not overwrite typed text. Code-only paths link only through `soleProcedureTypeForCode`.
- **Modifier rules are data.** No runtime path reads the static `MODIFIER_CODES` or a module-level band
  table. An Admin edit shows at once in the chips, the M caption, the ASA caption and the fee.
  Existing codes' band behaviour is identical, including the PA5 exemption and first-wins refusal. PO1
  and PO2 have gone from code, labels, tests and copy.
- **Master guards.** NZSA guide values are read-only. AA codes are marked. Deletes of anything in use
  (by a Procedure, an entry or a Contract scope) are refused. Every master write is office-only, goes
  through `mutate()` and is audited. `PERSIST_VERSION` is bumped once, and no new seed data draws from
  the RNG.
- **Contract scope fields** (`rvgGroups`, `procedureTypeIds`) are empty on every seeded Contract, so no
  selection or price moves.
- **One OQ-62 label.** It appears on the Master procedure list tab only.
- **No gold-plating.** No Contract pick, no Contract override field, no prepaid UI, no loader, no
  pre-op codes, no warning settings. Plus the usual: teal-only actions, no dashes in copy, mobile sheets
  not modals, `pwaPurity` green.

## PROGRESS.md updates

- Status row for catch-up Phase 19, and a phase entry: what was built, the parity result, the review
  pass (findings confirmed and fixed, anything not treated as a defect and why), tests added, and the
  `PERSIST_VERSION` bump. Record that US-05.5.2 left for 39b.
- **Decisions log:**
  1. The modifier master is store data, with the selection rule per code. This supersedes the
     2026-07-22 "table lives in `modifierCodes.ts`" entry and its PO1 to PO2 list, and carries the
     2026-07-27 band reading forward as the default for the new numbered groups.
  2. The 2026-07-28 picker shape is extended with "More modifiers".
  3. RV-04 under D3 (OQ-56 answered): ranged base units are unbounded, can be typed, and an entry
     outside the guide raises a mild after-procedure warning. This supersedes the Phase 04 in-range
     completion rule and stepper clamp. Mild is a picked reading.
  4. Base-unit precedence (manual, Contract, chosen ranged value, master procedure list, guide), with
     the list as the source per OQ-62's recommendation, labelled provisional on the list tab only.
  5. The capture picker is procedure-first, grouped and filtered by RVG body heading (US-03.3.1, OQ-53).
     This supersedes the Phase 04 RVG code picker. Code-only paths link only to a sole entry.
  6. NZSA guide values are read-only; AA codes carry the `aa` source. AS2 stays in the modifier set
     (US-05.1.5 wins over the domain model's "AS1/AS3/AS4").
  7. Contract scope gains `rvgGroups` and `procedureTypeIds`, matched with `scopeCoversProcedure`;
     selection by them is Phase 20's.
- **Handoff list:**
  - 20 adds the Contract pick after the procedure, filters by `scopeCoversProcedure` and seeds the
    first procedure scopes.
  - 23 fills `contractBaseUnits` from the Contract's override and sets `procedureTypeIds` on
    combination Contracts.
  - 25 locks `baseSource`, the linked entry, the chosen value and the modifier values used.
  - 26 builds the tick list on `codesInGroup`.
  - 39b owns ACC pre-op codes as pre-op events (US-05.5.2).
  - 42 loads the masters (Vanessa's procedure list included) from spreadsheets.
  - OQ-62's outcome: if base units move to the RVG code master, or the pick moves to RVG codes, it is a
    change in `baseUnits.ts` and `ProcedurePickerSheet` (see the gate table).
  - AA's fuller modifier list replaces the placeholder descriptions.
