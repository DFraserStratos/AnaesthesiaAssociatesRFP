# Phase 19 · RVG, modifier and procedure masters

**Requirements covered:**
[US-05.1.1](../../../../requirements-board/requirements/stories/US-05.1.1.md) RVG code master data (Confirmed) ·
[US-05.1.3](../../../../requirements-board/requirements/stories/US-05.1.3.md) Group codes (Confirmed) ·
[US-05.1.4](../../../../requirements-board/requirements/stories/US-05.1.4.md) Default modifiers (Confirmed; graded Contradicts) ·
[US-05.1.5](../../../../requirements-board/requirements/stories/US-05.1.5.md) Modifier code master (Confirmed) ·
[US-05.1.6](../../../../requirements-board/requirements/stories/US-05.1.6.md) Procedure master mapped to RVG codes (Confirmed; graded Missing) ·
[US-03.3.1](../../../../requirements-board/requirements/stories/US-03.3.1.md) Select an RVG code, with ranged override (Verify; graded Contradicts) ·
[DM-13](../analysis/domain-model-delta.md#dm-13) master procedure list and RVG groups ·
[DM-44](../analysis/domain-model-delta.md#dm-44) default modifiers in place of absorbed modifiers ·
[RV-04](../analysis/reverse-check.md#rv-04-ranged-base-code-is-bounded-to-the-published-range) ranged base code bounded to the published range ·
[RV-23](../analysis/reverse-check.md#rv-23-base-codes-absorb-modifiers-p1-positioning-the-retired-conditional-positioning-behaviour) base codes absorb modifiers (the retired conditional positioning behaviour).
Answered: owner decision D3 ([OQ-56](../../../../requirements-board/requirements/questions/OQ-56.md), with
[OQ-32](../../../../requirements-board/requirements/questions/OQ-32.md)) and D12
([OQ-62](../../../../requirements-board/requirements/questions/OQ-62.md): base units live in each
procedure's default RVG Contracts; the procedure list holds none; the RVG master is reference data).
Open: [OQ-88](../../../../requirements-board/requirements/questions/OQ-88.md) (one list or two, and
which carries the system code).
**Left this phase:** the Contract base-unit override (US-04.2.2) and Contract scope by procedure and
RVG group (the `procedureTypeIds` retype, `rvgGroups`, `scopeCoversProcedure` and the Contract editor's
scope chips) moved to Phase 19a, with the default RVG Contracts that now hold the base units
(US-04.4.2, DM-43). 19a's, 20's and 23's docs still call `scope.rvgGroups` and
`scopeCoversProcedure(scope, procedure, masters)` "19's": do not build them here; 19a adds them with
the rest of Contract scope, and this phase's handoff says so. The AA-sourced marker is gone (US-05.1.1 dropped it on 2026-10-02).
[US-05.2.3](../../../../requirements-board/requirements/stories/US-05.2.3.md) (conditional
positioning) is Retired: this phase removes it (RV-23) and builds nothing for it. US-05.5.2 (ACC
pre-op codes) and OQ-12 stay with Phase 39b. The base-units-on-the-list reading of the old OQ-62
recommendation (procedure base units, "two entries under one code keep their own units") is withdrawn:
19a's default RVG Contracts carry per-kind values.
**Depends on:** Phase 15a (the warning routine, the Warning record, the office to-do list, the warning
triangle, the warning shown on opening a Booking and the shared "Raise sample warnings" trigger) and
Phase 18 (the reshaped Contract model and the fee parity harness). Phases 14, 15 and 15b are in place
(the trigger registry; Booking vocabulary; Copy a Booking and photo capture removed).
**Estimated:** 2 sessions. Session 1: work items 1 to 8 (baseline, model, modifier master and default
modifiers, resolver, completion rule and warning rule, groups, seed, store actions, tests), ending
green. Session 2: work items 9 to 14 (Admin masters, the procedure-first picker on every capture path,
the creation paths, the copy sweep, the warning sample, shots, demo guide) and the review pass. If
session 2 runs long, cut the RVG groups panel's rename action (9b) before any capture path.

**Confirm before building.** D3 and D12 are answered and are built as the answers, with no provisional
label. US-05.1.1, US-05.1.4, US-05.1.5 and US-05.1.6 are Confirmed; US-03.3.1 stays Verify only for
the Contract half of its flow (Phase 20) and where a unit range lives (19a). OQ-88 is open: build its
recommendation (one procedure master, each line with its own system code and an RVG code reference;
RVG codes as reference data only), labelled provisional in **one place** only (the Procedure master
tab header).

## Goal

Settle the masters before 19a moves the base units onto Contracts and 20's Contract picker, 23's
Booking-level engine and 25's lock build on them.

- **RVG master becomes editable reference data** (US-05.1.1, OQ-62 answered). It holds the guide's
  codes with their reference base units (single or range), AA-added codes with their reference base
  units, and a unique, human-readable **system code** per row. No AA-sourced marker and no Absorbs
  column. Until 19a, the reference value is still what a Procedure prices from, through one resolver.
- **RVG groups.** AA-defined groups (cosmetic, plastics, dental) are many-to-many tags on codes, beside
  the NZSA body headings (today's `anatomicalSite`). Phase 26's prepaid tick list selects codes by
  them, and 19a's Contract override and scope can name them.
- **Modifier master is AA's own editable list** (US-05.1.5): editable units and selection rules held as
  data, new codes can be added, and the calculator reads the store master. Add VM1, TTE1 and TTE2,
  PACU1, EAA1, POC1 to POC3, NC1 and NC2; retire PO1 and PO2 (post-op work is a post-op event, 39b).
- **Absorbed modifiers go; default modifiers replace them** (US-05.1.4, DM-44, RV-23; US-05.2.3
  Retired). No base code refuses a modifier. Each master procedure carries default modifiers (spine and
  neuro procedures specify prone positioning, P1), pre-filled when the Procedure is added or its
  procedure picked, and the anaesthetist can untick them, in which case they are not charged.
- **Master procedure list** (DM-13's `ProcedureType`; UI name "Procedure master", as Donald and Greg
  agreed on 2026-10-02). Per OQ-88's recommendation: each line has its own system code, an operation
  name, a group and subgroup by body part, an RVG code reference and default modifiers, and **no base
  units** (US-05.1.6). It is admin data. Free-typed operation text stays on the Procedure, never on the
  master.
- **One pure base-unit resolver** decides a Procedure's base units: a manual override, then the
  anaesthetist's chosen value where the offered units are a range, then the offered single value. The
  offered units are a Contract's (a slot that 19a fills from the procedure's default RVG Contract) or,
  until then, the RVG reference value.
- **Procedure-first capture picker** on mobile, web and Admin, and on the manual and phone-advice forms.
  The user picks a procedure from the list, grouped and filtered by body heading. That seeds the RVG
  code, the operation text and the default modifiers (US-03.3.1, US-05.1.4). Phase 20 adds the Contract
  pick after it.
- **Any base-unit value is accepted (D3).** The ranged clamp and the out-of-range completion refusal
  go. A value can be typed. An entry outside the code's reference value or range raises a mild
  after-procedure warning for the office through 15a's routine. It never blocks save, completion,
  submit or authorise.

No figure in the S1 to S5 run sheet moves.

## Before you start: drift check

1. Run `node docs/prototype-build/catch-up/tools/plan-state.mjs --diff <IDs>`
   and read the hunks for US-05.1.1, US-05.1.3, US-05.1.4, US-05.1.5, US-05.1.6, US-03.3.1, US-04.4.2
   and US-04.2.2 (19a's default RVG Contracts and override, which this phase leaves a slot for),
   US-04.3.2 (the Contract pick 20 adds after the procedure), US-06.1.1 (the consumer of groups),
   US-13.7.1 (the warning routine), OQ-56, OQ-62, OQ-88 and OQ-53. Also re-read the "RVG code and
   modifier master" section and the "Base units come from the RVG code" row of `domain-model.md`. If an
   item changed, re-read it whole and adjust the work items. If one is now Retired or Future, drop its
   work and say so in the PROGRESS entry. At `3d3a18c` that domain-model section still lists "absorbed
   loadings", an AA-sourced mark and "AS1/AS3/AS4": the stories (US-05.1.1, US-05.1.4, US-05.1.5) are
   newer and win; build them, not the section.
2. Check `docs/discovery-reference/Data files/` (`git log` on it) for Vanessa's standard procedure
   list and AA's fuller modifier list. If the procedure list has landed, take operation names, groups,
   subgroups and their code mapping for the seed; its base units are 19a's input (they pre-populate the
   default RVG Contracts), never this phase's. If the modifier list has landed, take its descriptions
   and selection rules for the ten new codes. Keep unit values demo-plausible and labelled unless the
   owner says to adopt AA's figures, and never re-price a code the run sheet uses.
3. Confirm the gates.

| Gate | Build | If answered differently |
|---|---|---|
| **D3 / OQ-56** (answered) | Any base units accepted; an out-of-range entry raises a mild after-procedure warning for the office through 15a's routine. No label | Not expected. A threshold or mute is US-13.7.4 (Future): do not build it |
| **D12 / OQ-62** (answered) | The procedure master holds no base units; the RVG master is editable reference data; base units are read from the RVG reference value through the one resolver until 19a puts them on each procedure's default RVG Contracts. No label | Not expected. If the drift check moves the range onto the default Contract, that is 19a's; the resolver's offered-units slot already allows it |
| **OQ-88** (Open: one list or two; which carries the system code; children or a flat list) | The recommendation: one procedure master, a flat list, each line with its own system code and an RVG code reference; the RVG master stays a separate reference list that also carries a system code (US-05.1.1's first bullet). One "Provisional · one list or two, and which carries the system code, are still to confirm with AA (OQ-88)" note on the Procedure master tab, nowhere else | If the two become one list, merge the RVG columns into the procedure master and keep `RvgCode` as a lookup only; if only one carries the system code, drop the other field. Both are a model and `MasterData.tsx` change behind `systemCodeIsFree` (item 8); stop and ask the owner before starting it |
| **US-03.3.1** (Verify: the Contract half and where a range lives) | Build the procedure half as written | Adjust to the verified text |

4. Read what Phases 15, 15a, 15b, 17 and 18 actually built (their PROGRESS entries). File names below
   are as at `3d3a18c` (after Phase 15's rename to Booking and 15a session 1); Phase 18 reshapes
   `Contract` and the pricing half of `fee.ts`, and 15b removes Copy and photo capture. Follow 18's
   shapes; this phase touches only the base-unit and modifier halves of `resolveBtm`. Confirm in
   particular:
   - from 15a: where the warning rules live and how a rule is registered, the Warning shape (timing
     before or after, strength mild or strong, text, rule key, per-Procedure key), when an
     after-procedure warning surfaces and is re-raised after a Clear, and the `WARNING_SAMPLES` entry
     shape and pinned sample Bookings (including `multiWarning`) behind "Raise sample warnings";
   - from 18: the `feeParity.test.ts` harness and its `__parity__/` fixture, and whether its selection
     helper reads RVG codes (19a extends Contract scope; this phase leaves it alone);
   - from 15b: whether the photo extractions (`sampleExtractions.ts`) survive as a badged Future-scope
     demo (if so they link like any code-only path, item 11).
5. Record the current `PERSIST_VERSION` (16 at `3d3a18c`; 15a session 2, 15b and 16 to 18 may have
   bumped it).

## Reference

**Design (convention 17).** No mockup covers Admin master data. Extend the Admin Review page's table
anatomy (`docs/design/Admin Review.dc.html`: header row, mono data cells, status pills, row actions) and
the existing Master data tabs and edit sheets (`ContractEditSheet`, `AddHolidaySheet`). Capture stays on
`docs/design/Mobile App.dc.html` screen 3 (code card, picker bottom sheet, modifier chips) and its web
twin in `Web Dashboard.dc.html`'s card anatomy: the procedure picker is that sheet with a body-heading
chip row added under the search box. Tokens, the pill and tint treatments, the warn tint and the
provisional badge style come from `Design Language.dc.html`. Teal is the only action colour. Group,
default and "Provisional" markers are neutral pills, never crimson.

**Catalogue.** The files linked above, plus
[US-04.4.2](../../../../requirements-board/requirements/stories/US-04.4.2.md)
(default RVG Contracts, built in 19a),
[US-04.2.2](../../../../requirements-board/requirements/stories/US-04.2.2.md)
(Contract base-unit override, built in 19a),
[US-04.3.2](../../../../requirements-board/requirements/stories/US-04.3.2.md)
(the filtered Contract pick after the procedure, built in 20),
[US-05.2.3](../../../../requirements-board/requirements/stories/US-05.2.3.md)
(Retired: why absorption goes),
[US-03.3.4](../../../../requirements-board/requirements/stories/US-03.3.4.md)
(the modifier capture, "non-standard positioning"),
[US-03.7.2](../../../../requirements-board/requirements/stories/US-03.7.2.md)
(post-op work is a post-op event, built in 39b, which is why PO1 and PO2 go),
[US-06.1.1](../../../../requirements-board/requirements/stories/US-06.1.1.md)
(prepaid by group, built in 26),
[US-13.7.1](../../../../requirements-board/requirements/stories/US-13.7.1.md)
(the warning routine and its out-of-range warning, built in 15a), and
[US-13.4.3](../../../../requirements-board/requirements/stories/US-13.4.3.md)
(spreadsheet loads, built in 42). OQ-53's answer (combinations are Contracts, the list is grouped and
filtered by body headings). The evidence is `requirements-board/requirements/notes/2026-10-02-aa-booking-and-pricing-review-with-greg.md`
items 13 to 16, 18, 39 to 46 and 48 to 51 (system code, the procedure list, parent or flat, no
AA-sourced marker, typed text stays on the Procedure, default modifiers, AA's own modifier list, how the
procedure master and default Contracts fit, and the name "procedure master"),
`2026-10-02-aa-meeting-with-greg.md` items 3 and 40 (base units in the default RVG Contracts), and
`2026-10-01-aa-meeting-with-greg.md` items 4, 27, 30, 47, 53, 55 and 59.

**Analysis.** `../GAP-ANALYSIS.md` sections "EP-05 · RVG master data and fee calculation rules" and
"EP-03" (US-03.3.1), the DM-13 and DM-44 rows of "Structural changes" and the RV-04 and RV-23 rows of
"Prototype behaviour to remove or rework". `../epics/EP-05.md` (US-05.1.1, 05.1.3, 05.1.4, 05.1.5,
05.1.6) and `../epics/EP-03.md` (US-03.3.1). `../analysis/domain-model-delta.md#dm-13`, `#dm-44`,
`#dm-43` (19a's, for the slot) and `#dm-31` (the warning record), `../analysis/reverse-check.md` (RV-04,
RV-23). `../analysis/prototype-map-domain.md` (billing maths), `prototype-map-shared.md` (capture
suite), `prototype-map-admin.md` section 9 (Master data), and `prototype-map-store-seed.md` (masters,
seed). `docs/discovery-reference/Data files/Master Fee List.xlsx` (Procedures tab: Body Section,
Subgroup, Procedure, RVG Code) and `Data files/Group 1/Anaesthesia_Associates_Procedure_Master_Cleaned_v2.xlsx`
show AA's own procedure-list shape. Take the shape (group, subgroup, procedure, RVG code) and a few
operation names from them, not their figures.

**Code entry points (at `3d3a18c`).**

- Types: `src/domain/types.ts`. Covers `UnitProvenance`/`CapturedUnits`, `Procedure` (453:
  `description`, `rvgBaseCode`, `baseUnitsSelected`, `baseUnitsCaptured`, `selectedModifierCodes`),
  `RvgBaseUnits` and `RvgCode` (546 to 557, with `absorbsModifierCodes` at 556), `ModifierGroup` (559,
  with `'POSTOP'`) and `ModifierCode` (566).
- Modifier master: `src/domain/billing/modifierCodes.ts`. Holds `MODIFIER_CODES`, a static `BY_CODE` map,
  `getModifierCode`, `EXCLUSIVE_MODIFIER_GROUPS`, `STACKS_WITHIN_GROUP`, `modifierBandOf`,
  `toggleModifierCode` and `ASA_SEED_UNITS`. `modifierUnits.ts` sums codes and refuses band collisions,
  unknown codes and (58 to 62) codes the base absorbs. All of these read the static table today,
  although `masters.modifierCodes` is already in the store. `fixtures.ts` holds `BASE_ABSORBS_P1` (100).
- Base units: `src/domain/billing/fee.ts`. `resolveBtm` (58) reads `baseCode.baseUnits` or
  `baseUnitsSelected` and passes `baseCode` to `modifierUnits` for absorption; `FeeContext.baseCode`
  feeds it.
- `validateBookingForBilling.ts`: `feeContextFor`, the "something to charge" rule, and the in-range rule
  (152 to 163, the RV-04 guard). `invoiceBuild.ts` (`InvoiceBuildContext`).
- UI fee context: `src/shared/capture/feeContext.ts` (45). `procedureFee` is the second fee-context
  assembler and must stay in step with `feeContextFor`.
- Warnings (15a session 1): `src/domain/warnings/` (`routine.ts`, `types.ts`, `settings.ts`,
  `rules/index.ts` with `WARNING_RULES = [prepaymentUnpaidRule]`, `rules/prepaymentUnpaid.ts`), and
  `src/store/warnings.ts` (`warningFactsFor`). `store/warningSamples.ts` arrives with 15a session 2.
- Seed: `src/domain/seed/rvgCodes.ts` (`RVG_CODES`, 34 codes; ranged 20880, 47522, 51011, 45030; seven
  rows absorbing P1 at 23 to 25, 32, 33, 36, 37; `EYE_CODES`, `GENERAL_CODES`), and `seed/index.ts`
  (`SeedMasters`). In `seed/bookings.ts`, a range draw consumes the RNG; no seeded Procedure selects P1
  (only Ellison's A1 at 430). `seed/billing.ts` `contextFor` builds the seeded invoices.
- Store: `src/store/mastersActions.ts` (the office-only, audited master pattern), `lifecycle.ts`
  `editProcedure` (438), `bookingActions.ts` (`createBooking` input with `rvgBaseCode` at 46 and 141,
  `addProcedure` 422, `addPostOpAddendum` 290), `mutate.ts` `allocateId` (id kinds).
- Admin: `src/apps/admin/screens/MasterData.tsx`. Covers `NAV` (41), the `Sheet` union,
  `RvgCodesView` (411, with the Absorbs column) and `ModifierCodesView` (432).
  `apps/admin/flows/PhoneAdviceBooking.tsx` (the prefill with `rvgBaseCode: '20950'`, 30).
  `apps/admin/reviewFlags.ts` (`naturalBtm`, 53) and `ReviewScreen.tsx`.
- Capture (shared by mobile, web and the Admin Booking detail): `src/shared/capture/`. Covers
  `BtmCaptureBlock.tsx`, `ProcedureCodeCard.tsx` (`pick` at 38, the "Includes positioning" caption at
  60 to 64, the `RangeUnitsRow` clamp), `CodePickerSheet.tsx` (search by code or name, grouped by
  `anatomicalSite`), `ModifierChips.tsx` (the static `BANDS` and `STACKING_CODES`, the absorbed
  strike-through at 73 to 91 and 142), `modifierLabels.ts`, `UnitsCard.tsx` (the B caption and
  `modifierBreakdown`), `AsaCard.tsx` (`ASA_SEED_UNITS`). Creation form:
  `src/shared/flows/ManualBookingForm.tsx` (the "Procedure code" select, 176 to 195).
- Tests to extend: `domain/billing/modifierUnits.test.ts` (the absorbed-P1 cases at 41 and 146),
  `fee.test.ts`, `seed.test.ts`, `store/btmCapture.test.ts`, `captureActions.test.ts`,
  `bookingActions.test.ts`, `mastersActions.test.ts`, `domain/warnings/routine.test.ts`,
  `src/pwa/pwaPurity.test.ts` (must stay green). Playwright: `visual/mobile-phase04.spec.ts`
  (`m4-01-modifiers` and the code picker shots), `mobile-interactions.spec.ts` (the PA band indicator),
  `admin-phase07.spec.ts` (`a7-04-masters`).

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
   re-pricing" is proved, including for the removal of absorption.

2. **Model** (`src/domain/types.ts`), serving US-05.1.1, 05.1.3, 05.1.4, 05.1.5, 05.1.6, DM-13 and DM-44.
   - `RvgCode` gains `systemCode: string` (unique, human readable, US-05.1.1's first bullet) and
     `aaGroupIds: RvgGroupId[]`, and **loses `absorbsModifierCodes`** (RV-23). `baseUnits` stays, now
     documented as the reference value. `anatomicalSite` stays: it is the NZSA body heading. Its UI
     label becomes "Body heading". No source or AA-sourced field (US-05.1.1 dropped the marker).
   - New `RvgGroup { id: RvgGroupId; name: string; description?: string }`. These are AA groups only.
     Body-heading groups are derived from `anatomicalSite`, never stored, so they cannot drift. A pure
     `RvgGroupRef = { kind: 'site'; site: string } | { kind: 'aa'; groupId: RvgGroupId }` names either
     kind for consumers (26's tick list, 19a's overrides and scope).
   - New `ProcedureType { id; systemCode: string; name: string; group: string; subgroup?: string;
     rvgCode: string; defaultModifierCodes: string[]; notes?: string }`. No base units (US-05.1.6, D12).
     `group` is the body part, defaulted from the RVG code's body heading when a line is created and
     editable. Every line references exactly one RVG code: the story's "RVG code or category" is served
     by an AA-added reference code standing for the category (US-05.1.1: AA adds codes against the most
     relevant RVG code), so every line is priceable. Log that reading for the owner. The UI names it
     "Procedure master"; the type name follows DM-13.
   - `Procedure` gains `procedureTypeId?: ProcedureTypeId`, the procedure picked from the list.
   - `ModifierGroup` becomes `'PA' | 'A' | 'AS' | 'ASE' | 'OB' | 'P' | 'AI' | 'VM' | 'TTE' | 'PACU' | 'EAA' | 'POC' | 'NC'`,
     with `'POSTOP'` removed. `ModifierCode` gains `selection: 'oneOfGroup' | 'addsOnTop'`, the selection
     rule as data. A static `MODIFIER_GROUPS` definition in `modifierCodes.ts` holds each group's capture
     title, refusal-sentence band label, order, and `inCaptureByDefault` flag. Groups themselves are not
     admin-editable in this phase (Phase 42 keeps them code-held).
   - `SeedMasters`/`AppState['masters']` gain `rvgGroups` and `procedureTypes`. `allocateId` gains the
     `rvgGroup` and `procedureType` kinds.
   - No Contract change. Contract scope by procedure and RVG group, the base-unit override and the
     default RVG Contracts are 19a's.

3. **Modifier master as data, and no absorption** (US-05.1.5, US-05.1.4, RV-23).
   - `modifierCodes.ts`: `MODIFIER_CODES` becomes PA1 to PA5, A1 and A2, AS1 to AS4, ASE, OB1 to OB4,
     AI1, P1, plus the new VM1, TTE1, TTE2, PACU1, EAA1, POC1 to POC3, NC1 and NC2 (the domain model's
     list; US-05.1.5 now just says it is AA's own list). PO1 and PO2 are removed. Existing codes keep
     their units exactly (S3 figures; Decisions log 2026-07-22, 2026-07-23).
   - New codes get demo-plausible units (1 or 2) and a neutral description ("Description to confirm
     with AA"), unless drift check step 2 supplied AA's text. Do not invent clinical meanings.
   - Existing codes keep their descriptions. They become admin-editable in item 9d. If AA's list has
     landed, replace descriptions only, never units.
   - AS2 stays. The domain model's modifier list reads "AS1/AS3/AS4", but the seed's ASA draw uses AS2
     and the old US-05.1.5 list named AS1 to AS4. Note it in the Decisions log.
   - Selection defaults, which are a picked reading: numbered siblings (TTE1/TTE2, POC1 to POC3,
     NC1/NC2) are `oneOfGroup`, like PA, A, AS and OB; the singletons VM1, PACU1 and EAA1 are
     `addsOnTop`. PA5 keeps `addsOnTop` (the 2026-07-27 exemption).
   - `EXCLUSIVE_MODIFIER_GROUPS` and `STACKS_WITHIN_GROUP` are replaced by the per-code `selection`
     field. Every existing code's resulting band must equal today's, which the tests assert.
   - **Absorption goes.** `modifierUnits(selectedCodes, master)` drops its `baseCode` parameter and the
     absorbed-refusal branch: it refuses only unknown codes and band collisions (first wins, as today).
     `resolveBtm` stops passing the base code. `BASE_ABSORBS_P1` leaves `fixtures.ts`.
   - `modifierBandOf`, `toggleModifierCode` and `modifierUnits` take the master
     (`Readonly<Record<string, ModifierCode>>`) as a **required** parameter, so the compiler finds every
     caller. `fee.ts` gets it from a new `FeeContext.modifierCodes`, fed by `feeContextFor`,
     `procedureFee`, `InvoiceBuildContext` and `seed/billing.ts` `contextFor`.
   - New pure `applyDefaultModifiers(selected, previousDefaults, nextDefaults, master)`: removes the
     previous procedure's default codes that the next one does not carry, then ensures each next default
     is selected (swapping a sibling in a `oneOfGroup` band, never toggling an already-selected code
     off). This is the one place pre-fill is decided (US-05.1.4 "Pre-filled"); unticking afterwards is
     an ordinary chip toggle (AC "Can be removed").
   - `ASA_SEED_UNITS` becomes `asaSeedUnits(asaClass, master)`, read from the AS rows, so an edited AS
     unit value shows in `AsaCard` and the M caption.
   - The static table survives only as the seed source and a test fixture (`DEFAULT_MODIFIER_MASTER`).
     No runtime path reads it.
   - Tests (`modifierUnits.test.ts`):
     - the code set equals the list above; PO1 and PO2 are gone, and the POSTOP assertions are
       rewritten;
     - P1 on any base code is charged (the two absorbed-P1 cases are rewritten, not deleted);
     - every existing code's band is unchanged;
     - flipping a code's `selection` in a test master changes both toggle and sum behaviour;
     - an unknown code is still refused with its reason;
     - `applyDefaultModifiers`: adds the defaults, swaps a band sibling, keeps a deliberately ticked
       non-default code, drops the previous defaults the next lacks, and is idempotent.

4. **The base-unit resolver**, a new `src/domain/billing/baseUnits.ts` (US-03.3.1, RV-04, D12). This is
   the one place base units are decided, and the one place 19a changes.
   - `resolveBaseUnits({ procedure, rvgCode?, contractBaseUnits? })` returns
     `{ units, source, offered?, guide?, outsideGuide }`. `offered` is `contractBaseUnits ?? rvgCode?.baseUnits`
     (an `RvgBaseUnits`, single or range); `guide` is the RVG code's reference value or range.
   - `source` is one of `'captured' | 'chosen' | 'contract' | 'rvgReference' | 'none'`.
   - Precedence:
     1. `baseUnitsCaptured.source === 'overridden'` (a manual override, unchanged behaviour);
     2. when `offered` is a range, the chosen `baseUnitsSelected` (the anaesthetist's judgement,
        US-03.3.1);
     3. when `offered` is single and came from `contractBaseUnits`, that value (a slot: nothing passes
        it until 19a fills it from the procedure's default RVG Contract or a Contract override);
     4. when `offered` is single and came from the RVG code, its reference value;
     5. otherwise 0 with `'none'` (no code, or a range with no chosen value, which the validator
        reports).
   - `outsideGuide` is true when the source is `'captured'` or `'chosen'`, the code has a reference
     value, and the units differ from a single value or lie outside its min to max. It is false for
     `'contract'` and `'rvgReference'`: those are AA's own data.
   - The procedure link plays no part in base units in this phase (the list holds none). 19a looks the
     linked procedure's default RVG Contract up and passes `contractBaseUnits`.
   - `resolveBtm` delegates its base branch to this. `BtmBreakdown` gains `baseSource` and `baseGuide`
     so the UI, the warning rule and 25's lock read one answer. `UnitProvenance` keeps its meaning.
   - `FeeContext` gains `contractBaseUnits?`, left unset. Both assemblers, `feeContextFor` and
     `procedureFee`, plus `reviewFlags.naturalBtm`, `invoiceBuild` and `seed/billing.ts`, call it through
     `resolveBtm` with the same inputs.
   - Add pure helpers: `procedureTypesForCode(code, masters)` (lines referencing that code) and
     `soleProcedureTypeForCode(code, masters)` (the line when exactly one references the code, else
     undefined), for paths that know only a code (item 11).
   - Tests (`baseUnits.test.ts`):
     - each precedence step;
     - the Contract slot (single) beats the RVG reference; a Contract range takes the chosen value;
     - a single RVG code with a chosen value set ignores it (as today);
     - `outsideGuide`: min and max are inside; min-1 and max+1 are outside; a manual override on a
       single code that differs from the reference is outside; a Contract value that differs is not;
     - no code gives 0 and `'none'`; a range with no chosen value gives 0 and `'none'`.
   - Grep `baseUnits.kind` afterwards. Outside `baseUnits.ts`, only display helpers (the picker row
     label, the master tables, the range row) may read it.

5. **RV-04 rework under D3** (`validateBookingForBilling.ts` and 15a's routine).
   - a. **Completion no longer bounds a ranged entry.** Replace the in-range rule. When the offered
     units are a range and `baseUnitsSelected` is unset, the rule fails `baseUnitsSelected` with "Base
     code {code} is a range ({min} to {max}): choose a base unit value." Decide this from the
     resolver's inputs with the manual override set aside (its `baseSource` would read `'captured'`
     and hide the gap): a manual override does not stand in for the chosen value, as today; pin that in
     a test. Any chosen value passes, inside the range or not.
   - b. **The "something to charge" rule**'s sentence becomes "Pick a procedure or add at least one
     billing line." (A picked procedure always sets `rvgBaseCode`, so the rule itself is unchanged.)
   - c. **The out-of-range warning** (US-03.3.1 AC "Out of range", US-13.7.1). Register one rule,
     `baseUnitsOutsideGuide`, in 15a's routine, following 15a's rule shape: timing **after**, strength
     **mild**, one Warning per Procedure, raised when `resolveBaseUnits(...).outsideGuide` is true.
     Text: "Base units {n} are outside the RVG guide for {code} ({min} to {max})." or "(guide value
     {v})." for a single code. It follows 15a's surfacing, clearing and re-raise rules; nothing else
     here decides them. Mild is a picked reading (OQ-56 sets no strength); record it in the Decisions
     log.
     - Wiring, per 15a's "a new rule is a rule file, an entry here, its facts in the store's
       `warningFactsFor`, its defaults and a sample": a rule file in `src/domain/warnings/rules/`,
       appended to `WARNING_RULES` after `prepaymentUnpaid`; `baseUnitsOutsideGuide` added to the
       `WarningRuleId` union; an optional fact on `WarningFacts` carrying what the resolver needs
       (`rvgCodes`; the rule imports `resolveBaseUnits` from `domain/billing`, which is pure), filled by
       `warningFactsFor`; a default entry (active, no params) in `appSettings.warningRules` through
       `backfillMerge`, so a persisted store gains it.
     - The finding carries `procedureId`, so the key is per Procedure (15a's key rule).
   - d. Tests: out-of-range passes completion and raises the warning; an in-range value raises none;
     overridden with no chosen value still fails; an outside value never blocks completion, submit or
     authorise (one store test through each); two outside Procedures on one Booking give two warnings;
     the pristine seed raises no `baseUnitsOutsideGuide` warning anywhere (so the to-do list is not
     flooded at load). Update the existing in-range tests, which assert the old rule.

6. **RVG groups and search, the pure side** (`src/domain/billing/rvgGroups.ts`, US-05.1.3).
   - `groupsOfCode(code, masters)` returns the body-heading group plus its AA groups.
   - `codesInGroup(ref, masters)` handles both kinds.
   - `searchRvgCodes(query, masters)` matches RVG code, system code, description, body heading or AA
     group name, for the Admin table.
   - `searchProcedureTypes(query, masters)` matches operation name, system code, RVG code, code
     description or AA group name, and `procedureTypesByHeading(masters, headingFilter?)` returns the
     lines grouped by `group` (the body part, defaulted from the code's body heading) then `subgroup`,
     both for the capture picker. Keep that name: 19a expands body headings to procedures with it.
   - Tests cover many-to-many membership, heading derivation, search (including typing the start of a
     system code) and grouping. Phase 26 consumes `codesInGroup`, and 19a consumes `RvgGroupRef` and
     `codesInGroup` for Contract scope and overrides; this phase builds no prepaid UI and no Contract
     change.

7. **Seed.** One `PERSIST_VERSION` bump for the whole phase. Draw nothing from the seeded RNG for new
   master data or links, so every generated Booking stays identical.
   - a. `rvgCodes.ts`: drop `absorbsModifierCodes` from every row; each row gets
     `systemCode: 'RVG-{code}'` and `aaGroupIds`; reference values do not change. Add two AA-added
     codes with an `AA` prefix and demo-plausible reference base units: a dental code ("Dental
     extraction under GA", for the dental group) and a category code the guide does not name (for
     example `AA101` and `AA102`; keep `AA205` free, the manual test adds it). Do not
     add them to `GENERAL_CODES` or `EYE_CODES`, so generation is unchanged.
   - b. `rvgGroups`: Cosmetic (41800, 45200, 31340), Plastics (45030, 45200, 31340, 41800), Dental (the AA
     dental code) and Bariatric (20880, 20882). Set membership on `aaGroupIds`.
   - c. `procedureTypes`: **one line per seeded RVG code**, named from AA's Master Fee List or Vanessa's
     list where one fits, otherwise the code's own description, with `group` equal to the code's body
     heading, a subgroup where one fits ("Upper GI", "Hernia", "Joint replacement") and a system code of
     a body-part prefix plus a short mnemonic (`ABD-APPX-LAP`, `SPN-LAM`). So every code is pickable.
     Then add:
     - a second line under 45030, "Skin lesion excision, simple", beside "Skin flap repair, complex"
       (two procedures sharing one RVG code, as in Donald's brow lift example; 19a gives them a default
       RVG Contract per kind);
     - one line for each AA code.
     - **Default modifiers** (US-05.1.4): P1 on the two spine lines (51011 Lumbar laminectomy, 51020
       Lumbar fusion, posterior), the catalogue's own example. No other line has defaults: the hip and
       shoulder codes that absorbed P1 get none, so nothing they bill changes. Log the choice for the
       owner.
   - d. **Links.** In a post-generation pass, set `procedureTypeId` on every seeded Procedure whose code
     has `soleProcedureTypeForCode`. The pass **does not pre-fill default modifiers**: a seeded
     Procedure's selection is its captured record. Ranged-code Procedures keep their drawn
     `baseUnitsSelected`, so no figure moves. 45030 Procedures stay unlinked (two lines) and price as
     today. At `3d3a18c` no seeded Procedure selects P1 (grep `bookings.ts`), so removing absorption
     moves no seeded figure; if 15b to 18 added one on a formerly absorbing code, remove P1 from that
     Procedure's selection in the seed so its fee is unchanged. The parity fixture (item 1) must hold.
   - e. `modifierCodes`: the new set via `byId`. At `3d3a18c` no seeded Procedure selects PO1 or PO2. If
     15 to 18 introduced any, remap each one to a fixed billing line ("Post-op ward review" or "Post-op
     acute pain management"). Its amount is the dollar value the code contributed at that Procedure's
     resolved unit rate, so the fee total is unchanged; the parity fixture proves it. Phase 39b turns
     such lines into post-op events.
   - f. Update `seed.test.ts`:
     - every `procedureTypeId` resolves and references its Procedure's code;
     - every seeded RVG code has at least one line;
     - system codes are unique across both masters;
     - every default modifier and every seeded modifier selection is in the master;
     - group members exist;
     - no row carries `absorbsModifierCodes`.

8. **Store actions.** Items a to d are office-only, audited, and return `Outcome`, following
   `mastersActions.ts`. Put them in a new `src/store/rvgMasterActions.ts` and export them from
   `store/index.ts`. Item e follows `editProcedure`'s lifecycle rights. A pure
   `systemCodeIsFree(code, masters, except?)` checks uniqueness across the RVG and procedure masters
   (so an OQ-88 merge cannot collide) and a shape rule (letters, digits and hyphens, 3 to 16
   characters, stored upper case).
   - a. RVG codes (US-05.1.1).
     - `addRvgCode` validates: the RVG code is unique, the system code is free, the description is
       non-empty, the body heading is required, reference base units are a positive integer (single)
       or a min under max (range), and groups exist. An `alsoAddToProcedureMaster` flag (default true)
       creates the matching `ProcedureType` in the same commit, so the code is pickable at once.
     - `editRvgCode` edits description, body heading, system code and reference base units on any row
       (the master is reference data). The RVG code itself cannot change once a Procedure or line
       references it. Until 19a an edited reference value re-prices unlocked Procedures that price from
       it; AUTHORISED invoices keep their snapshot amounts. Say so in a test.
     - `setRvgCodeGroups` works on any code.
     - `deleteRvgCode` is refused with `codeInUse` while any Procedure or ProcedureType references the
       code.
   - b. RVG groups (US-05.1.3): `createRvgGroup` (the name is unique), `renameRvgGroup`, and
     `deleteRvgGroup`. Membership is removed with it, and the audit entry records the codes it covered.
     (19a adds "refused while a Contract scope or override names it".)
   - c. Procedure master (US-05.1.6): `createProcedureType`, `editProcedureType` and
     `deleteProcedureType`.
     - Save requires a name, a group, an RVG code that exists, and a free system code. Default
       modifiers must exist in the modifier master. (US-05.1.6's "at least one default RVG Contract" is
       19a's to enforce.)
     - A duplicate name under the same code is refused.
     - Delete is refused while Procedures link to the line.
     - Editing default modifiers changes nothing already captured: pre-fill happens only on add or pick.
   - d. Modifier codes (US-05.1.5): `editModifierCode` (units a non-negative integer, description,
     selection) and `addModifierCode` (into an existing group; the code is unique). `deleteModifierCode`
     is refused while any Procedure selects the code or any procedure line defaults to it.
   - e. **Picking a procedure** (US-03.3.1, US-05.1.4). `pickProcedure(api, actor, procedureId, procedureTypeId)`
     writes in one audited commit: `procedureTypeId`; `rvgBaseCode` (the line's code); when the code
     changes, `baseUnitsSelected` and `baseUnitsCaptured` cleared (a ranged code then asks for a value,
     as today); `selectedModifierCodes` through `applyDefaultModifiers` (the previous line's defaults
     out, this line's in); and `description` set to the line's name when the description is empty or
     still equals the previous line's name or the previous code's description, so typed operation text
     survives. It follows the same rights as `editProcedure` (the anaesthetist on a DRAFT Booking, the
     office per its edit rules). `editProcedure`:
     - clears `procedureTypeId` in the same commit when a patch changes `rvgBaseCode` to a code the
       line does not reference;
     - accepts any positive whole number for `baseUnitsSelected` (no range check; refuse zero,
       negatives and fractions with "Base units must be a whole number of 1 or more.").
     - `createBooking`'s input (`bookingActions.ts`) gains `procedureTypeId`, validated the same way;
       when set, the first Procedure is created with the line's code, name and default modifiers.
   - Tests: a new `store/rvgMasterActions.test.ts` covers every guard and audit entry above. Also
     cover:
     - editing a modifier's units changes a DRAFT Procedure's fee, and an already-built invoice does not
       change;
     - `pickProcedure` seeds code, link, description and default modifiers, keeps typed text, keeps a
       non-default ticked code, swaps defaults when the pick changes, and is refused on a submitted
       Booking for the anaesthetist;
     - unticking a pre-filled default leaves it unticked and uncharged (US-05.1.4 AC "Can be removed");
     - the link is cleared when the code changes;
     - an out-of-range `baseUnitsSelected` is stored;
     - a system code already used on either master is refused.

   **Session 1 ends here, green:** `npm run build`, `npm run build:pwa`, `npx vitest run`, and the parity
   fixture unchanged. The old `CodePickerSheet` still works in session 1, because every Procedure with a
   code still prices without a link.

9. **Admin, Master data** (`MasterData.tsx`, desktop; teal actions; tables in the existing chrome).
   New admin sheets (`RvgCodeSheet`, `RvgGroupSheet`, `ProcedureTypeSheet`, `ModifierCodeSheet`) are new
   files in `src/apps/admin/flows/` beside `ContractEditSheet`, each a new member of the `Sheet` union.
   - a. **RVG codes.** A search box drives `searchRvgCodes`, and a group filter covers body headings and
     AA groups.
     - Columns: System code (mono), RVG code (mono), Description, Body heading, Groups (neutral pills)
       and Reference base units (mono). The Absorbs column goes.
     - "Add code" opens `RvgCodeSheet` (RVG code, system code, description, body heading, single or
       range reference base units, groups, and "Also add to the procedure master", on by default).
     - Row "Edit" opens the same sheet; the RVG code is read-only once referenced.
     - The subheading drops "view only" and reads "Reference values from the RVG guide, which is only a
       guide. Demo-plausible values; the full NZSA 2021 set loads at go-live."
   - b. **RVG groups** is a new tab (or a panel on the RVG codes tab). It lists each group with its code
     count, and offers New group, Rename, and Delete. Tag codes from the code sheet's Groups field, a
     multi-select of chips.
   - c. **Procedure master** is a new tab. It is a table of System code (mono), Procedure, Group,
     Subgroup, RVG code (mono with its description), RVG reference (mono, the code's reference value or
     range), Default modifiers (mono neutral pills) and Linked Procedures (count). No base units column.
     - New and Edit open `ProcedureTypeSheet`: name, system code, group (pre-filled from the RVG code's
       body heading) and subgroup, a searchable RVG code select with "RVG reference: N" beside it, and
       a default modifiers multi-select from the modifier master.
     - The header carries the phase's one OQ-88 note, as a `DemoBadge`: "Provisional · one list or
       two, and which carries the system code, are still to confirm with AA (OQ-88)."
     - Delete is refused while Procedures are linked.
   - d. **Modifier codes.** Each row gets Edit, and the tab gets an "Add modifier code" action; both use
     `ModifierCodeSheet`.
     - Fields: units stepper, description, and Selection as a segmented control ("Pick one in group" /
       "Adds on top"). The group is fixed on edit and chosen on add.
     - The Selection column now reads the data.
     - The subheading says: "AA's own modifier list. Unit values are demo-plausible, not AA's schedule.
       New codes' descriptions are to confirm until AA's fuller list arrives."
     - Keep the PA5 "question for AA" wording unless the drift check shows it is settled.
   - Add `data-shot` hooks: `masters-rvg`, `masters-rvg-groups`, `masters-procedure-list`,
     `masters-modifiers`.

10. **Procedure-first capture, mobile, web and Admin (shared)**, for US-03.3.1, US-05.1.4, US-05.1.5 and
    RV-04. `BtmCaptureBlock` is shared by the mobile Booking, the web Booking and the Admin Booking
    detail, so this is one change for all three.
    - a. **`ProcedurePickerSheet`** (new, `src/shared/capture/`), replacing `CodePickerSheet`, which is
      deleted.
      - Title "Procedure". A search box ("Search procedure or code") drives `searchProcedureTypes`.
      - Under it, a horizontally scrolling chip row of body headings ("All", then each group in order)
        filters the list (US-03.3.1 "grouped and filtered by RVG body headings").
      - Rows are grouped under group headers, subgroup as a quiet sub-label. Each row: the operation
        name (15, semibold), the mono system code and RVG code, and "B 5" or "B 4 to 6" (the reference
        value, until 19a). A row with default modifiers shows them as small mono pills. The current
        line is tinted teal, as today.
      - Empty state: "No procedures match that search."
      - Picking calls `pickProcedure`. A bottom sheet on mobile, the surface's overlay on web and Admin
        (`useSurface`), as today.
    - b. **`ProcedureCodeCard`** (section label "Procedure"; keep the `capture-procedure-code` hook).
      - Linked: the line's name, the mono codes beneath, and "Base 5 units".
      - Unlinked with a code (an inbound Booking whose code has two lines, or a legacy Procedure): the
        code and its description, a "Choose the procedure" prompt, and the picker opens with the search
        pre-filled with the code.
      - Nothing yet: "No procedure yet" and "Choose".
      - The "Includes positioning; P1 is not added separately." caption goes.
      - The 2026-09-28 ruling holds: base units are capture context, and the anaesthetist's Booking still
        shows no fee.
    - c. **`RangeUnitsRow`** drops its clamp. The floor is 1 and there is no ceiling. Steppers move the
      value by one, and tapping the value opens a numeric input (`inputMode="numeric"`) so any value
      can be typed. The guide stays in the label ("Guide 8 to 10 · 11 chosen"). Outside the range, a
      warn-tinted caption (not an error, no label): "Outside the guide range. The office will see a
      warning after the procedure."
    - d. `ModifierChips`: `BANDS` and `STACKING_CODES` are derived at render from
      `useAppStore((s) => s.masters.modifierCodes)` and `MODIFIER_GROUPS`, no longer at module load.
      - The absorbed state goes: no chip is inert or struck through, and the `baseCode` prop is
        replaced by the linked `procedureType` (for the default marker only).
      - A selected chip that is one of the linked line's defaults carries a small neutral "Default"
        marker; unticking it works like any chip. A caption under the chips when the line has defaults:
        "Default for this procedure: Positioning. Untick it if it does not apply."
      - Groups with `inCaptureByDefault` (PA, A, OB, ASE, P, AI) render as today.
      - The new groups (TTE, POC, NC as segmented bands; VM1, PACU1, EAA1 as chips) sit under a
        "More modifiers" disclosure row. It starts collapsed, opens itself when any code inside is
        selected, and shows a count of selected codes. This keeps the phone's capture height, which is
        what the 2026-07-28 ruling was about.
      - Labels come from `modifierLabels.ts`. PO1 and PO2 are removed, and new codes fall back to the
        code itself ("TTE1"), not an invented label.
      - The footer caption becomes: "Modifier unit values are demo-plausible, not AA's schedule."
    - e. `UnitsCard` and `AsaCard` read the store master (via `asaSeedUnits`, `modifierBreakdown` and
      `getModifierCode(code, master)`). The B row's caption comes from `baseSource`: "From the RVG
      reference", "Chosen", "Chosen, outside the guide range", "Set manually" (with "outside the guide
      range" appended when `outsideGuide`) or "From the Contract" (from 19a).

11. **Creation paths pick a procedure too.**
    - `ManualBookingForm` (shared: mobile and web add, Admin add, phone advice): the "Procedure code"
      select becomes a "Procedure" chooser row that opens `ProcedurePickerSheet`. Picking fills the
      operation text (still editable) and passes `procedureTypeId` to `createBooking`, which pre-fills
      the line's code and default modifiers. It stays optional, as today.
    - Paths that know only an RVG code link through `soleProcedureTypeForCode` (and then pre-fill its
      defaults, since the Procedure is being added), or leave the Procedure unlinked (it then prices from
      the RVG reference and the card prompts as in 10b): the phone-advice prefill (`PhoneAdviceBooking`,
      20950), the hospital message and integration intake, the photo extractions if 15b kept them as a
      badged demo, and any demo trigger that creates a Procedure. Grep `rvgBaseCode:` across `src/` to
      find them all.
    - The add-procedure and post-op addendum paths carry `procedureTypeId` wherever they carry
      `rvgBaseCode`.

12. **Copy and label sweep.** Search `src/` for "view only" (RVG and modifier tabs), "Absorbs",
    "already includes", "Includes positioning", "PO1", "Post-op ward review", "between {min} and {max}",
    "needs a selected unit value", "Procedure code", "Search code or name", "No codes match", "Add an RVG
    base code" and "RFP's stated ranges", and update each. `shared/audit/fieldLabels.ts` gains
    `procedureTypeId: 'Procedure'` and `rvgBaseCode` becomes "RVG code". Every new user-visible string
    follows the no en/em dash rule; ranges use "to". The only provisional label is the OQ-88 note (item
    9c), using `DemoBadge` (`src/shared/DemoBadge.tsx`), never crimson.

13. **Warning sample** (see Demo triggers). Add this rule's entry to 15a's `WARNING_SAMPLES` in
    `src/store/warningSamples.ts`, in the entry shape 15a defines, never in an app folder, and update
    15a's "1 rule registered" message and its registry test: with a second rule, the `multiWarning`
    Booking now shows two warnings on screen.

14. **Playwright and green.**
    - Update `m4-01-modifiers` (no struck-through chip), the code picker shots (now the procedure
      picker) and the `mobile-interactions` band spec, which follows PA and must keep passing.
    - Add specs for:
      - the four master tabs;
      - adding a code (with "Also add to the procedure master") and picking it in the mobile procedure
        picker;
      - the body-heading filter narrowing the picker, and a system-code search;
      - picking "Lumbar fusion, posterior": P1 pre-filled with the Default marker, then unticked;
      - typing an out-of-range value on 47522, the caption, completion succeeding, and the warning on
        the Admin to-do list.
    - Run `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots`. All must be green,
      and the parity fixture unchanged.

## Demo triggers

- **15a's "Raise sample warnings" gains an out-of-range sample**, wherever 15a registered it: Admin ·
  Day and Admin · Booking detail (bar), and Mobile · Booking (bar and PWA), so the sample reaches the
  handset with no new entry. It follows 15a's targets: on the Day view, 15a's pinned
  `SEED_WARNING_SAMPLE_BOOKINGS`, including `multiWarning`, which now shows two warnings (the
  prepayment one and this one); on a Booking (Admin or mobile), the Booking in the URL. On each
  target it takes the first Procedure with an RVG code (a stable rule, never a hardcoded id): on a
  ranged code it sets `baseUnitsSelected` to the guide's max plus 2; on a single code it sets a manual
  base-unit override of the reference value plus 2. A target with no coded Procedure gets its first
  Procedure set to 47522 with `baseUnitsSelected` 12, so `multiWarning` always shows both warnings.
  All go through the audited `editProcedure` as 15a's `DEMO_TRIGGER_ACTOR`. `isStaged` is true when
  that Procedure's base fields differ from the pristine seed and hold the sample's values; `unstage`
  restores them from the seed and drops the clearance of the per-Procedure key it staged, as 15a's
  prepayment sample does. The mild after-procedure warning then shows on the to-do list, as a
  triangle on that Booking in all three apps, and on opening the Booking (15a). It shares 15a's
  disabled states ("Samples already raised", "This Booking's List is authorised", "Samples stage on
  seeded Bookings only").
- **Normal use, no new button:** on mobile or web capture, typing base units outside the range is
  accepted, and the warning lands on the office's to-do list (15a's to-do list and triangle show it
  like any other open warning).
- **Normal use, no new button:** on mobile or web capture, picking a spine procedure ("Lumbar fusion,
  posterior") pre-fills Positioning (P1) with its Default marker; unticking it removes the charge.
- Everything else (the masters, the procedure picker, the modifier chips) is shown through normal use.
  No Control Panel change. PWA: the picker, the default modifiers, the unclamped range and the triangle
  reach the PWA through the shared capture components, so both beats are normal use on the handset and
  need no PWA trigger. No mobile beat waits on the office (a warning never blocks), so no new PWA
  stand-in is needed; clearing uses 15a's "Office clears this warning". Master edits are Admin-only,
  and the PWA shows their effect when the handset reloads its seed, like any other master.

## Out of scope

- Default RVG Contracts holding the base units, the Contract base-unit override for a procedure, code
  or group, the resolver reading the Contract, Contract scope by procedure and RVG group
  (`procedureTypeIds`, `rvgGroups`, `scopeCoversProcedure`, the editor's scope chips), and the RVG time
  tiers as data (Phase 19a, US-04.4.2, US-04.2.2, US-05.2.2, DM-43, D25).
- The Contract pick after the procedure, filtering by procedure then hospital and code search (Phase
  20, US-04.3.2).
- Booking-level pricing with the 3/2/2 modifier split and combination Contracts (Phase 23).
- Locking the base-unit source at AUTHORISED (Phase 25). The prepaid tick list of codes and groups
  (Phase 26). Estimated duration per Procedure (Phase 27).
- ACC pre-op codes and every pre-op or post-op event (Phase 39b, US-05.5.2, OQ-12, OQ-63).
- Spreadsheet loads of the RVG, procedure and modifier masters, Vanessa's full procedure list, the full
  NZSA 2021 set, and editing the modifier groups themselves (Phase 42).
- Warning thresholds, mutes and the warning settings page (US-13.7.4, Future).
- Conditional positioning (US-05.2.3, Retired): nothing replaces it but default modifiers.
- Parent-and-child navigation of procedures under RVG codes (OQ-88 part 3): the list is flat.
- Real NZSA or AA unit values. All units stay demo-plausible and labelled.

## Manual test checklist

The agent runs every item itself in the running app and reports it with evidence; none is handed
to the owner (ROADMAP.md "Owner review: agents test themselves").

- [ ] Admin → Master data → RVG codes: search "cosmetic" finds the tagged codes; typing "RVG-209"
      finds the 209xx codes by system code. The group filter narrows to Plastics. There is no Absorbs
      column and no source pill.
- [ ] Add code (for example AA205, system code `SKN-AA205`, single reference base 4, body heading Skin,
      group Plastics, "Also add to the procedure master" on): it saves, a line appears on the
      procedure master, and both have audit entries. On mobile, the procedure picker lists it under
      Skin, and picking it shows Base 4. A system code already used is refused.
- [ ] Editing a referenced code allows every field but the RVG code itself.
- [ ] Deleting a code that a Procedure uses is refused with the in-use sentence.
- [ ] RVG groups: create "Orthodontic", rename it, delete it; the audit entry records its codes.
- [ ] Procedure master: two lines under 45030 ("Skin lesion excision, simple" and "Skin flap repair,
      complex") beside the reference "4 to 6"; no base units column. The spine lines show P1 under
      Default modifiers. Saving a line without a group or RVG code is refused. The OQ-88 note shows
      here, and nowhere else.
- [ ] Mobile capture on a DRAFT Booking: "Change" opens the procedure picker. Searching "skin" and
      tapping the Abdomen chip both narrow it. Picking "Skin lesion excision, simple" sets 45030 with
      the range row asking for a value and the operation text; picking "Skin flap repair, complex"
      keeps the chosen value (same code). Typed operation text is not overwritten.
- [ ] Default modifiers: picking "Lumbar fusion, posterior" pre-fills Positioning (P1) with the Default
      marker and its caption; unticking it removes P1 from M on the Admin Booking. Picking a hip line
      afterwards drops the spine default. A hip replacement (BK0009, 47516) now charges P1 when it is
      ticked, with no strike-through.
- [ ] Ranged code (47522 hip revision): stepping or typing 11 is allowed, with the "Outside the guide
      range" caption. Mark complete and submit succeed. The Admin to-do list shows "Base units 11 are
      outside the RVG guide for 47522 (8 to 10)", and the Booking carries the triangle in mobile, web
      and Admin and shows the warning on opening. Clearing it works as 15a defines. A value of 9 raises
      nothing.
- [ ] Web capture and the Admin Booking detail behave the same; the manual add form and phone advice
      both open the same picker, and a Booking added with "Lumbar laminectomy" starts with P1 ticked.
- [ ] Admin Day Tue 21 → Demo actions → "Raise sample warnings" includes the out-of-range sample; the
      `multiWarning` Booking shows two warnings, each with its own text. "Clear sample warnings"
      restores its Procedure's seed values. On the PWA (5174), a seeded DRAFT Booking's demo-actions
      sheet raises the sample on that Booking, and the warning shows on opening it.
- [ ] Modifier codes: the set matches item 3, with PO1 and PO2 gone. Editing TTE1 to 2 units and
      selecting it on a DRAFT Booking adds 2 to M. Switching TTE's selection to "Adds on top" lets TTE1
      and TTE2 stack. Adding a new AA modifier to the P group shows it in capture.
- [ ] Capture: PA, A and BMI bands and the Also applies chips look as before. "More modifiers" opens
      and shows the new bands and chips, and it opens itself on a Booking that has one selected.
- [ ] S1 Beat 3 (Sarah Mitchell, 20950, "Appendicectomy, laparoscopic") and S3's Holt and fee figures
      are unchanged, and the parity test is green.
- [ ] Audit viewer: rvgCode, rvgGroup, procedureType, modifierCode and pickProcedure entries appear with
      before and after values.
- [ ] No en or em dash in any new app copy (grep the diff). Actions are teal, pills neutral, and no
      crimson.
- [ ] Catalogue screenshots: the recipes for US-05.1.1, US-05.1.3, US-05.1.4, US-05.1.5, US-05.1.6 and US-03.3.1 are created or updated, any recipe this phase broke is re-pointed, a full `npm run capture` ends with no failed recipe and no story without a recipe, the covered items' new shots are checked by eye, and `npm run verify:board` is green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots` and `npm run verify:board` green.

## Demo guide updates

No scripted figure changes. Patch the wording these sections carry, and the matching sections of
`master-demo-guide.html`, in the same session:

- `04-presenter-cheat-sheet.md`:
  - "Fee calculation": "The anaesthetist selects the RVG code" becomes "The anaesthetist picks the
    procedure from AA's procedure master, grouped by body heading, which seeds the RVG code and its
    default modifiers". "Some RVG codes are ranges..." becomes "On a ranged code she chooses the value;
    any value is accepted, and one outside the guide raises a warning for the office after the
    procedure, never a block". "Positioning cannot be charged again if the base code already includes
    it" becomes "Some procedures specify default modifiers (spine: positioning), pre-filled and
    untickable; no code absorbs a modifier". Add "Base units live in each procedure's default RVG
    Contract (the next phase); the RVG master is reference data."
  - "RFP ambiguities" item 10 ("Modifier values and time rounding"): the modifier set is AA's own,
    editable in Admin; selection rules are master data; post-op work is not a modifier.
  - Item 12 ("ACC pre-op flat-fee codes") is Phase 39b's; leave it for that phase.
- `02-workflows-and-handoffs.md` capture steps 3, 7 and 8: step 3 becomes "For each Procedure she picks
  the procedure from the procedure master (filtered by body heading), which seeds the RVG code and any
  default modifiers; on a ranged code she sets the value, and an out-of-range value raises an office
  warning"; step 7 ("prevents a positioning modifier if the base code already includes it") becomes
  "A procedure's default modifiers are pre-filled, and she can untick any that do not apply"; step 8
  removes "post-op care" from the stacking list and mentions "More modifiers".
- `03-demo-script.md`:
  - S1 Beat 3: "Choose procedure 20950 · Appendicectomy, laparoscopic" becomes a pick in the procedure
    picker (search "appendic"), unless Sarah now arrives linked through the hospital message path, in
    which case the click is dropped; check the Expected text names the procedure card as it now reads.
  - The S5 discovery points (the line about demo-plausible modifier values): add the procedure master,
    default modifiers and OQ-88.
  - Add an optional "Worth pointing at" in S5: Admin → Master data → Procedure master, showing two
    procedures under one RVG code and the spine default modifier.
  - Confirm S3 reads unchanged.
- `master-demo-guide.html`: the same sections, including the two absorbed-positioning sentences (the
  workflow's "A positioning modifier is blocked if the base code already absorbs" and the cheat sheet's
  "Positioning cannot be charged again").
- Control Panel scenario text: none expected. Grep `src/apps/demo` for "post-op", "RVG code",
  "absorb" and modifier wording to confirm.

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19),
run after the review pass and before the PROGRESS.md entry. Re-run
`node docs/prototype-build/catch-up/tools/recipe-status.mjs 19` first: earlier phases may have
changed these recipes since this plan was written.

**Covered items.** When the phase is done, each recipe in `requirements-board/capture/recipes/`
matches what was built:

| Item | Recipe at plan time | When this phase is done |
|---|---|---|
| [US-05.1.1](../../../../requirements-board/requirements/stories/US-05.1.1.md) RVG code master data | captured · admin-rvg-codes | Stays `captured`. Re-shoot `admin-rvg-codes` with the System code, Groups, Body heading and Reference base units columns and no Absorbs column, and add an `add-code` state with `RvgCodeSheet` open (for example AA205, "Also add to the procedure master" on). Highlight the System code column, then the sheet. Caption "Each RVG code has a unique system code; AA can add codes the guide does not cover" |
| [US-05.1.3](../../../../requirements-board/requirements/stories/US-05.1.3.md) Group codes | partial · admin-rvg-sites, web-code-picker, mobile-code-picker | `captured`. Re-shoot `admin-rvg-sites` (Groups pills plus the group filter) and add an `rvg-groups` state on the new RVG groups tab (`masters-rvg-groups`). Re-shoot `code-picker` on web and mobile as the procedure picker with the body-heading chips and grouped rows (keep the shot name; caption "Procedure picker grouped by body heading"). Drop the partial reason. Selecting a group as a set is by the group filter; the prepaid tick list is Phase 26, so if the review judges that gap material keep `partial` and say so |
| [US-05.1.4](../../../../requirements-board/requirements/stories/US-05.1.4.md) Default modifiers | captured · rvg-absorbs, web-absorbed-positioning, mobile-absorbed-positioning (the retired reading) | Stays `captured`, re-pointed. Drop `rvg-absorbs` and `absorbed-positioning`. Add an admin `procedure-defaults` shot (`masters-procedure-list`, highlight the Default modifiers column on the spine lines; caption "Spine procedures specify the prone positioning modifier") and `default-modifier` on web and mobile (Booking `BK0009`: open the procedure picker, pick "Lumbar fusion, posterior"): state `prefilled` (highlight Positioning with its Default marker; caption "The procedure's default modifier is pre-filled") and state `unticked` (after tapping it; caption "Unticked, so it is not charged") |
| [US-05.1.5](../../../../requirements-board/requirements/stories/US-05.1.5.md) Modifier code master | partial · admin-modifier-codes | `captured`. Re-shoot `admin-modifier-codes` showing the full set (VM1, TTE1 to TTE2, PACU1, EAA1, POC1 to POC3, NC1 to NC2 present, PO1 and PO2 gone) with the Selection column and the "Add modifier code" action, plus an `edit` state with `ModifierCodeSheet` open on TTE1 (units, description, Selection). Highlight the table, then the sheet. Caption "AA's own modifier list, with each code's unit value". Admin only. Drop the partial reason |
| [US-05.1.6](../../../../requirements-board/requirements/stories/US-05.1.6.md) Procedure master mapped to RVG codes | absent · placeholder, no shots | Add the shots, `partial`. `absentReason`: "Each procedure's default RVG Contracts, which hold its base units, and the Contract base unit override are built in Phase 19a." Admin shots: `procedure-list` (`masters-procedure-list`: system code, group and subgroup, RVG code, the two 45030 lines beside the reference "4 to 6", default modifiers, the OQ-88 provisional badge; highlight the Group, Subgroup and RVG code columns) and an `edit` state with `ProcedureTypeSheet` open ("RVG reference: N" beside the code select). Caption "Each procedure has a group, a subgroup and its RVG code, and no base units". Phase 19a turns it `captured` |
| [US-03.3.1](../../../../requirements-board/requirements/stories/US-03.3.1.md) Select an RVG code (with ranged override) | captured · web-rvg-picker[closed,open,search], mobile-rvg-picker[closed,open,search] | `partial`. `absentReason`: "The procedure is picked from the procedure master, but picking a Contract after it, which seeds the base units, is built in Phases 19a and 20." Re-shoot `rvg-picker` on web and mobile (Booking `BK0009`): `closed` (the "Procedure" card with name, mono codes and "Base N units"), `open` (body-heading chips, rows grouped under headings), `search` ("skin"). Add `ranged` and `outside-guide` states on both apps with a typed value outside the range and the warn caption "Outside the guide range. The office will see a warning after the procedure." (the existing US-03.3.2 ranged images the item lists can be re-shot here). Captions in the catalogue's words (Procedure, Booking). Phase 20 turns it `captured` |

**Recipes this phase breaks.**
- `US-05.2.3` (Retired 2026-10-02, still `captured`): its `absorbed-positioning` shots highlight
  `/already includes P1/`, which no longer renders. Set it `absent` with "Retired: a base code never
  absorbs a modifier; see US-05.1.4 default modifiers", with no shots.
- `US-03.3.2` (Retired, merged into US-03.3.1, still `captured`): it clicks
  `[data-shot=capture-procedure-code] >> text="Change"` and fills
  `input[placeholder="Search code or name"]`. `ProcedurePickerSheet` replaces `CodePickerSheet` with
  the placeholder "Search procedure or code" and a "Choose" prompt on an unlinked Procedure (work
  items 10a and 10b). Re-point it, or set it `absent` with "Retired: merged into US-03.3.1" and move its
  ranged states to the US-03.3.1 recipe.
- `US-03.3.1` and `US-05.1.3` use the same `Change` click and `capture-procedure-code` hook: keep
  that hook on the new `ProcedureCodeCard`, or re-point them.
- `US-13.4.1` (also Phase 42): the `rvg-codes` and `modifier-codes` states are captioned "(view only)"
  and its `absentReason` lists RVG and modifier codes as view only. Re-caption and trim the reason,
  leaving what is still true.
- `US-05.1.2` (Retired, `absent`): its `absentReason` says the RVG master is view only with no
  AA-sourced marker. Reword it to "Retired: merged into US-05.1.1".
- `US-03.3.5` (modifier chips: `capture-modifiers` with "Positioning" and "Emergency") and `US-03.3.4`
  (`capture-asa-status`): `ModifierChips` is now derived from the store master, the struck-through
  state is gone and the new groups sit under "More modifiers". The PA, A, OB, ASE, P and AI groups
  render as before, so these should still match; the `--dry` run is the check.

**ATLAS.md.** Overlays (the procedure picker replaces the code picker, and the "More modifiers"
disclosure), Existing hooks (`masters-rvg`, `masters-rvg-groups`, `masters-procedure-list`,
`masters-modifiers`, and `capture-procedure-code` if it moved) and Seed data (the procedure master
lines and their system codes, the spine default modifier, the AA groups, the new modifier codes, no
absorbing codes). Routes are unchanged.

## Adversarial review (after build)

After the manual test checklist and the four commands are green, and before writing the PROGRESS entry,
run the standard **adversarial review-and-fix pass (PROGRESS convention 18)**. Fan out about three
independent Opus review subagents, one each for **quality**, **bugs/correctness** and **plan adherence**.
Add a fourth on billing maths, because the resolver and the modifier sum sit under every fee. This
session then independently verifies every finding against the catalogue files, this doc and the code,
fixes the confirmed ones (with a test for each bug), re-greens, and records the pass. Do not re-raise
anything settled in the Decisions log.

**Steer this phase's reviewers at:**

- **No figure moved.** The parity fixture is byte-identical. S1 Beat 3, S3 Holt (whatever 16 to 18
  left) and the S3 fee figures are unchanged. Removing absorption moved nothing because no seeded
  Procedure selects P1 on a formerly absorbing code; the link pass pre-fills nothing; ranged
  Procedures keep their drawn chosen value.
- **One base-unit answer.** Only `baseUnits.ts` decides base units and `outsideGuide`. Both fee-context
  assemblers (`feeContextFor`, `procedureFee`), `invoiceBuild`, `seed/billing.ts`, `naturalBtm` and the
  warning rule pass the same inputs. Check the precedence: manual override, then the chosen value on an
  offered range, then the offered single value (Contract slot, else the RVG reference). The procedure
  master holds no base units anywhere (D12), and 19a's change is one input to the resolver.
- **D3 is done exactly.** No clamp in the UI, no range check in the store, no out-of-range refusal in
  the validator. An outside value raises one mild after-procedure warning per Procedure through 15a's
  routine and blocks nothing (save, complete, submit, authorise). An unchosen ranged value still
  blocks, and a manual override does not waive it. The rule is wired as 15a requires (rule file,
  registry entry, facts, app-settings default, sample), the pristine seed raises none, and the
  `multiWarning` Booking shows two warnings. No "provisional" label on any of it.
- **No absorption anywhere.** `absorbsModifierCodes`, the absorbed refusal, the strike-through, the
  "Includes positioning" caption, the Absorbs column and `BASE_ABSORBS_P1` are gone from code, tests
  and copy (RV-23). Default modifiers are pre-filled only on add or pick, through one
  `applyDefaultModifiers`, respect the one-per-band rule, and an unticked default is not charged and
  not re-added by an unrelated edit.
- **Procedure-first everywhere.** Mobile, web, the Admin Booking detail, the manual form and phone
  advice all use `ProcedurePickerSheet`; `CodePickerSheet` is gone. Grouping and filtering use body
  headings. Picking writes code, link, description and default modifiers in one audited commit, and
  does not overwrite typed text. Code-only paths link only through `soleProcedureTypeForCode`.
- **Modifier rules are data.** No runtime path reads the static `MODIFIER_CODES` or a module-level band
  table. An Admin edit shows at once in the chips, the M caption, the ASA caption and the fee.
  Existing codes' band behaviour is identical, including the PA5 exemption and first-wins refusal. PO1
  and PO2 have gone from code, labels, tests and copy.
- **Master guards.** System codes are unique across both masters. Deletes of anything in use (by a
  Procedure, a procedure line or a default modifier) are refused. Every master write is office-only,
  goes through `mutate()` and is audited. `PERSIST_VERSION` is bumped once, and no new seed data draws
  from the RNG.
- **One OQ-88 label.** It appears on the Procedure master tab only. No AA-sourced marker anywhere.
- **No gold-plating.** No default RVG Contract, no Contract override or scope field, no Contract pick,
  no prepaid UI, no loader, no pre-op codes, no warning settings, no parent-and-child navigation. Plus
  the usual: teal-only actions, no dashes in copy, mobile sheets not modals, `pwaPurity` green.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry; ROADMAP.md "Owner review: agents test
  themselves"): OQ-88 built as its recommendation (a system code on both masters, a flat list); every
  procedure line references one RVG code, a category being an AA-added code; P1 as the only seeded
  default modifier (spine lines; hips and shoulders, which absorbed it, get none); pre-fill on add and
  pick only, the previous line's defaults dropped on a re-pick; the warning's mild strength; the new
  modifier codes' placeholder descriptions and selection rules; anything logged rather than fixed; and
  the screens worth a look, each with its route and persona.
- **Catalogue screenshots result:** the recipe filled in (US-05.1.6), re-pointed (US-05.1.4) and changed
  (the other four covered items, plus the broken ones such as US-05.2.3, US-03.3.2 and US-13.4.1), the
  `requirements-board/capture/REPORT.md` counts (captured, partial, absent, failed) before and after,
  and the partial reasons handed on: US-05.1.6 to Phase 19a (default RVG Contracts and the override)
  and US-03.3.1 to Phases 19a and 20 (the Contract pick that seeds the base units).
- Status row for catch-up Phase 19, and a phase entry: what was built, the parity result, the review
  pass (findings confirmed and fixed, anything not treated as a defect and why), tests added, and the
  `PERSIST_VERSION` bump.
- **Decisions log:**
  1. The modifier master is store data, with the selection rule per code. This supersedes the
     2026-07-22 "table lives in `modifierCodes.ts`" entry and its PO1 to PO2 list, and carries the
     2026-07-27 band reading forward as the default for the new numbered groups.
  2. Absorbed P1 positioning is superseded (US-05.2.3 Retired, US-05.1.4 rewritten, RV-23): no base
     code refuses a modifier; procedures carry default modifiers, pre-filled and untickable.
  3. The 2026-07-28 picker shape is extended with "More modifiers" and the Default marker.
  4. RV-04 under D3 (OQ-56 answered): ranged base units are unbounded, can be typed, and an entry
     outside the guide raises a mild after-procedure warning. This supersedes the Phase 04 in-range
     completion rule and stepper clamp. Mild is a picked reading.
  5. Base-unit precedence (manual, chosen value on an offered range, offered single value), with the
     offered units from the RVG reference until 19a supplies the default RVG Contract's (D12). The
     procedure master holds no base units.
  6. The capture picker is procedure-first, grouped and filtered by body heading (US-03.3.1, OQ-53).
     This supersedes the Phase 04 RVG code picker. Code-only paths link only to a sole line.
  7. OQ-88's recommendation: one procedure master with a system code per line; the RVG master stays
     reference data with its own system code; no AA-sourced marker (US-05.1.1). AS2 stays in the
     modifier set (over the domain model's "AS1/AS3/AS4").
- **Handoff list:**
  - 19a passes `contractBaseUnits` from the linked procedure's default RVG Contract (or a Contract
    override for a procedure, code or group), seeds the default RVG Contracts from today's RVG
    reference values (45030's two lines get one per kind, 4 and 6), scopes Contracts by procedure and
    RVG group on `RvgGroupRef` and `codesInGroup` (it builds `scope.rvgGroups` and the pure
    `scopeCoversProcedure(scope, procedure, masters)` that 20 and 23 call; this phase did not), adds
    the scope delete guards, and re-words the RVG codes tab as reference only. The base-unit sources
    this phase left are `'captured' | 'chosen' | 'contract' | 'rvgReference' | 'none'`.
  - 20 adds the Contract pick after the procedure.
  - 23 reads the default modifiers through the 3/2/2 split as captured selections.
  - 25 locks `baseSource`, the linked line, the chosen value and the modifier values used.
  - 26 builds the tick list on `codesInGroup`.
  - 39b owns ACC pre-op codes as pre-op events (US-05.5.2).
  - 42 loads the masters (Vanessa's procedure list included) from spreadsheets.
  - OQ-88's outcome: one list or two, or a single system code, is a model and `MasterData.tsx` change
    behind `systemCodeIsFree` (see the gate table).
  - AA's fuller modifier list replaces the placeholder descriptions.
