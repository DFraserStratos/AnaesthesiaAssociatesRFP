# Phase 19 · RVG, modifier and Procedure masters

**Requirements covered:**
[US-05.1.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.1.1.md) RVG code master data (Verify) ·
[US-05.1.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.1.3.md) Group codes (Confirmed) ·
[US-05.1.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.1.5.md) Modifier code master (Proposed) ·
[US-05.1.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.1.6.md) Procedure master mapped to RVG codes (Proposed) ·
[US-03.3.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.3.1.md) Select an RVG code, with ranged override (Verify) ·
[US-05.5.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.5.2.md) ACC pre-op flat fee codes (Open) ·
[DM-11](../analysis/domain-model-delta.md#dm-11) Procedure master and RVG groups ·
[RV-04](../analysis/reverse-check.md#rv-04-ranged-base-code-is-bounded-to-the-published-range) ranged base code bounded to the published range.
Open questions: [OQ-06](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-06.md) (Confirm),
[OQ-12](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-12.md) (Open); owner decision D3 (ROADMAP).
**Depends on:** Phase 18 (the reshaped Contract model and its fee parity tests). Phases 14 and 15 are in
place (Booking vocabulary; the registry exists but this phase adds no triggers).
**Estimated:** 2 sessions. Session 1: work items 1 to 8 (baseline, model, modifier master, resolver,
validator, seed, store actions, tests), ending green. Session 2: work items 9 to 15 (Admin masters and
the Contract scope chips, capture, office link, review flag, ACC codes, shots, demo guide) and the
review pass. Both sessions are full. If session 1 runs long, move item 8's ACC pre-op action (8f) to
the start of session 2 with item 13, rather than cutting tests or the parity check.

**Confirm before building.** Most items here are Verify, Proposed or Open. The phase is placed early
for structure: 23's Booking-level engine and 25's lock need the base-unit sources to be final. Build the
recommended readings below, label every provisional reading in the UI, and do not build past them.

## Goal

Settle where base units come from before the engine and the lock build on them.

- **RVG master becomes editable.** Admins can add AA-sourced codes with their base units, marked as
  AA-sourced. The NZSA rows keep the guide's own values.
- **RVG groups.** AA-defined groups (cosmetic, plastics, dental) are many-to-many tags on codes, alongside
  the NZSA site groups. Phase 26's prepaid tick list selects codes by these groups, and a Contract's
  scope can name them (the field Phase 18 left for this phase; Phase 20 filters by it).
- **Modifier master matches the catalogue set,** with editable units and selection rules held as data:
  add VM1, TTE1 and TTE2, PACU1, EAA1, POC1 to POC3, NC1 and NC2; retire PO1 and PO2.
- **Procedure master.** Operation names are mapped to an RVG code or group, and each holds its own
  authoritative base units. It is admin data.
- **One pure base-unit resolver** decides a Procedure's base units, in this order: a manual capture
  override, then the Contract override (a slot that 23 fills), then the Procedure master, then the RVG
  guide value.
- **Ranged codes are no longer bounded at completion.** An out-of-range entry raises an office review
  flag.
- **ACC pre-op flat-fee codes** (CS250, CS260 and CS70) become selectable coded billing lines on ACC
  Contracts.

The capture picker does not change, and no figure in the S1 to S5 run sheet moves.

## Before you start: drift check

1. Run `git diff 1f067a8 -- "docs/discovery-reference/Updated Requirements/catalogue"` and read the
   hunks for US-05.1.1, US-05.1.3, US-05.1.5, US-05.1.6, US-03.3.1, US-05.5.2, US-04.2.2 (the Contract
   override this phase leaves a slot for), US-06.1.1 (the consumer of groups), OQ-06, OQ-12 and OQ-32.
   Also re-read the RVG, modifier and Procedure master section of `domain-model.md`. If an item changed,
   re-read it whole and adjust the work items. If one is now Retired or Future, drop its work and say
   so in the PROGRESS entry.
2. Check `docs/discovery-reference/Data files/` (`git log` on it) for AA's fuller modifier list or the
   base-units sheet that US-13.4.3 says Vanessa is sending. If the modifier list has landed, take its
   descriptions and selection rules for the ten new codes. Keep unit values demo-plausible and labelled
   unless the owner says to adopt AA's figures, and never re-price an existing code the run sheet uses.
3. Confirm the gating owner answer and the open questions. For each one still open, build the safe
   interim shown here.

| Gate | If still open (the interim to build) | If answered differently |
|---|---|---|
| **D3** (drop the range bound?) | Default: the validator no longer bounds a ranged entry; an out-of-range value raises a warn review flag labelled provisional | If the owner keeps the bound: keep the in-range completion rule, skip the review flag, and still route base units through the resolver |
| **OQ-06** (Confirm: base units on a Procedure master; pick by operation name or by RVG code?) | Build the Procedure master and resolver. The anaesthetist still picks by RVG code; no pick-by-operation-name picker. A Procedure links to a master entry only through an office action (and the seed). The Procedure master tab carries a "Provisional · how a Procedure is picked is still to confirm (OQ-06)" note | If OQ-06 rejects the Procedure master (base units back on the RVG code), stop and ask the owner before items 4, 7c, 8c, 9c and 11. If it confirms pick by operation name, still do not build the picker here; log it in the handoff list for a follow-up phase |
| **OQ-12** (Open: ACC pre-op codes billed as flat-fee lines?) | Codes only. The amount is entered by hand, because the fixed amounts are unknown. The code selector is labelled "Provisional · to confirm with AA billing" | If AA supplies amounts, pre-fill them from the code master as editable defaults |
| **US-05.1.1 / US-03.3.1** (Verify) | Build as written; label the AA-sourced marker and the unbounded range as provisional where they show | Adjust to the verified text |

4. Read what Phases 15 to 18 actually built (their PROGRESS entries). File names below are as at
   `1f067a8`. Phase 15 renames Card to Booking (for example `validateCardForBilling`, `CardDetailBody`,
   `cardFee`). Phase 18 reshapes `Contract` and the pricing half of `fee.ts`. Follow the renamed files and
   18's shapes; this phase touches only the base-unit and modifier halves of `resolveBtm`. Confirm in
   particular what 18 left for: `ContractScope` (its `rvgCodes` and `fundingSources` arrays), the
   `feeParity.test.ts` harness and its `__parity__/` fixture, the `accContractCard` scenario marker, and
   `ContractEditSheet`'s Scope chips.
5. Record the current `PERSIST_VERSION` (13 at `1f067a8`; 14 to 18 will have bumped it).

## Reference

**Design (convention 17).** No mockup covers Admin master data. Extend the Admin Review page's table
anatomy (`docs/design/Admin Review.dc.html`: header row, mono data cells, status pills, row actions) and
the existing Master data tabs and edit sheets (`ContractEditSheet`, `AddHolidaySheet`). Capture stays on
`docs/design/Mobile App.dc.html` screen 3 (code card, picker sheet, modifier chips) and its web twin in
`Web Dashboard.dc.html`'s card anatomy. Tokens, the pill and tint treatments, and the provisional/demo
badge style come from `Design Language.dc.html`. Teal is the only action colour. Source, group and
"Provisional" markers are neutral pills, never crimson.

**Catalogue.** The files linked above, plus
[US-04.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.2.md)
(Contract base-unit override, built in 23),
[US-05.1.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.1.4.md)
(absorbed loadings, which already match),
[US-03.3.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.3.6.md)
(post-op reviews are billing lines, which is why PO1 and PO2 go),
[US-05.5.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.5.1.md)
(ACC is ordinary Contract pricing),
[US-06.1.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.1.1.md)
(prepaid by group, built in 26), and
[US-13.4.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.4.3.md)
(spreadsheet loads, built in 42). `domain-model.md` section "RVG code and modifier master".

**Analysis.** `../GAP-ANALYSIS.md` sections "EP-05 · RVG master data and fee calculation rules" and "EP-03"
(US-03.3.1), the DM-11 row of "Structural changes" and the RV-04 row of "Prototype behaviour to remove or
rework". `../epics/EP-05.md` (US-05.1.1, 05.1.3, 05.1.5, 05.1.6, 05.5.2) and `../epics/EP-03.md`
(US-03.3.1). `../analysis/domain-model-delta.md#dm-11`, `../analysis/reverse-check.md` (RV-04; RV-20 for
what "ACC special case" must not come back as). `../analysis/prototype-map-domain.md` (billing maths),
`prototype-map-shared.md` (capture suite), `prototype-map-admin.md` section 9 (Master data), and
`prototype-map-store-seed.md` (masters, seed).
`docs/discovery-reference/Data files/Master Fee List.xlsx` (Procedures tab: Body Section, Subgroup,
Procedure, RVG Code, Base Units) shows AA's own Procedure master shape. Take the shape and a few
operation names from it, not its figures.

**Code entry points (at `1f067a8`).**

- Types: `src/domain/types.ts`. Covers `RvgBaseUnits` and `RvgCode` (about line 537), `ModifierGroup` and
  `ModifierCode` (549 to 560), `Procedure` (444: `rvgBaseCode`, `baseUnitsSelected`, `baseUnitsCaptured`,
  `selectedModifierCodes`), `BillingLine` (518) and `CapturedUnits`/`UnitProvenance`.
- Modifier master: `src/domain/billing/modifierCodes.ts`. Holds `MODIFIER_CODES`, a static `BY_CODE` map,
  `EXCLUSIVE_MODIFIER_GROUPS`, `STACKS_WITHIN_GROUP`, `modifierBandOf`, `toggleModifierCode` and
  `ASA_SEED_UNITS`. `modifierUnits.ts` sums and refuses codes. All of these read the static table today,
  although `masters.modifierCodes` is already in the store.
- Base units: `src/domain/billing/fee.ts`. `resolveBtm` (line 58) reads `baseCode.baseUnits` or
  `baseUnitsSelected`, and `FeeContext.baseCode` feeds it.
- `validateCardForBilling.ts`: `feeContextFor` (77) and the in-range rule (152 to 163, the RV-04 guard).
  `invoiceBuild.ts` (`InvoiceBuildContext`, calls at 289 and 484).
- UI fee context: `src/shared/capture/feeContext.ts`. `procedureFee` is the second fee-context assembler
  and must stay in step with `feeContextFor`.
- Seed: `src/domain/seed/rvgCodes.ts` (`RVG_CODES`, about 35 codes, `EYE_CODES`, `GENERAL_CODES`), and
  `seed/index.ts` (`SeedMasters`, lines 87 to 103 and 400 to 415). In `seed/cards.ts`, a range draw
  consumes the RNG at line 1143. `seed/billing.ts` `contextFor` (line 80) builds the seeded invoices.
- Store: `src/store/mastersActions.ts` (the office-only, audited master pattern) and `lifecycle.ts`
  `editProcedure` (about line 449). `billingLineActions.ts` `addBillingLine` (46). `mutate.ts`
  `allocateId` (id kinds).
- Admin: `src/apps/admin/screens/MasterData.tsx`. Covers `NAV`, `RvgCodesView` (411), `ModifierCodesView`
  (432) and the `Sheet` union. `src/apps/admin/flows/ContractEditSheet.tsx` (18's Scope chips) and
  `src/domain/billing/contracts.ts` (18's Contract helpers) for the scope groups and `isAccContract`. `apps/admin/reviewFlags.ts` holds `reviewFlagsForCard` and `naturalBtm`,
  and `ReviewScreen.tsx` feeds it.
- Capture (shared by mobile and web): `src/shared/capture/`. Covers `ProcedureCodeCard.tsx` (the
  `RangeUnitsRow` clamp), `CodePickerSheet.tsx` (unchanged), `ModifierChips.tsx` (the static `BANDS` and
  `STACKING_CODES`), `modifierLabels.ts`, `UnitsCard.tsx` (the B caption "From procedure code" and
  `modifierBreakdown`), `AsaCard.tsx` (`ASA_SEED_UNITS`), `AddBillingLineSheet.tsx` (the CS250 caption)
  and `BillingLinesCard`. `src/shared/card/OfficeBillingSetup.tsx` is the office-only billing panel.
- Tests to extend: `domain/billing/modifierUnits.test.ts`, `fee.test.ts`, `seed.test.ts`,
  `store/btmCapture.test.ts`, `mastersActions.test.ts`, `apps/admin/reviewFlags.test.ts`,
  `src/pwa/pwaPurity.test.ts` (must stay green). Playwright: `visual/mobile-phase04.spec.ts`
  (`m4-01-modifiers`), `mobile-interactions.spec.ts` (the PA band indicator), `admin-phase07.spec.ts`
  (`a7-04-masters`).

## Work items

Model, domain and seed first, then store, then UI. Every new write goes through `mutate()` with an audit
meta. Every rule is a pure function in `src/domain/billing/` with a Vitest test.

1. **Baseline the figures (before any edit).** Phase 18 built the harness:
   `src/domain/billing/feeParity.test.ts` with its fixture in `domain/billing/__parity__/`. Add a
   `phase-19-baseline.json` fixture beside 18's, generated from the untouched code at the start of this
   phase (if 18's harness is missing, create it to the same shape and say so in PROGRESS). It covers
   every seeded Procedure's `feeFor` total and every seeded invoice total from `buildSeed()`. Never
   regenerate it with `-u`: a mismatch is a parity failure to explain, not to accept. The fixture must
   come out identical at the end of the phase. The only allowed exceptions are ones listed in the
   PROGRESS entry, and none are expected. This is how "keep the S3 captures' figures by remapping, not
   re-pricing" is proved.

2. **Model** (`src/domain/types.ts`), serving US-05.1.1, 05.1.3, 05.1.5, 05.1.6 and DM-11.
   - `RvgCode` gains `source: 'nzsa' | 'aa'` (the AA-sourced marker, US-05.1.1 AC) and `aaGroupIds: RvgGroupId[]`.
     `anatomicalSite` stays: it is the NZSA section and still groups the picker.
   - New `RvgGroup { id: RvgGroupId; name: string; description?: string }`. These are AA groups only.
     NZSA site groups are derived from `anatomicalSite`, never stored, so they cannot drift. A pure
     `RvgGroupRef = { kind: 'site'; site: string } | { kind: 'aa'; groupId: RvgGroupId }` names either
     kind for consumers (26's tick list).
   - New `ProcedureType { id; name; rvg: { kind: 'code'; code: string } | { kind: 'group'; groupId: RvgGroupId };
     baseUnits: number; notes?: string }`. Base units are a single authoritative figure (US-05.1.6 AC1).
     The UI names it "Procedure master"; the type name follows DM-11.
   - `Procedure` gains `procedureTypeId?: ProcedureTypeId`, the optional link to a master entry.
   - `ModifierGroup` becomes `'PA' | 'A' | 'AS' | 'ASE' | 'OB' | 'P' | 'AI' | 'VM' | 'TTE' | 'PACU' | 'EAA' | 'POC' | 'NC'`,
     with `'POSTOP'` removed. `ModifierCode` gains `selection: 'oneOfGroup' | 'addsOnTop'`, the selection
     rule as data. A static `MODIFIER_GROUPS` definition in `modifierCodes.ts` holds each group's capture
     title, refusal-sentence band label, order, and `inCaptureByDefault` flag. Groups themselves are not
     admin-editable in this phase (Phase 42).
   - `BillingLine` gains `code?: string` for a coded flat-fee line. New master `PreOpCode { code; description;
     fundingSource: 'ACC' }` (US-05.5.2).
   - `SeedMasters`/`AppState['masters']` gain `rvgGroups`, `procedureTypes` and `preOpCodes`. `allocateId`
     gains the `rvgGroup` and `procedureType` kinds.
   - **Contract scope by RVG group** (Phase 18's handoff: "RVG groups arrive with Phase 19's group
     master"; the domain model's scope is "rvgCodes[] or rvgGroups[]"). Phase 18's `ContractScope`
     gains `rvgGroups: RvgGroupRef[]`, empty on every seeded Contract so no selection or figure moves.
     Empty means no narrowing, like 18's other scope arrays. Phase 20's Contract picker consumes it
     through `scopeCoversCode` (item 6); this phase builds no selection change. If 18's own selection
     helper already reads `scope.rvgCodes`, route it through `scopeCoversCode` so groups count too.

3. **Modifier master as data** (US-05.1.5).
   - `modifierCodes.ts`: `MODIFIER_CODES` becomes exactly the catalogue set. That is PA1 to PA5, A1 and
     A2, AS1 to AS4, ASE, OB1 to OB4, AI1, P1, plus the new VM1, TTE1, TTE2, PACU1, EAA1, POC1 to POC3,
     NC1 and NC2. PO1 and PO2 are removed. Existing codes keep their units exactly (S3 figures;
     Decisions log 2026-07-22, 2026-07-23).
   - New codes get demo-plausible units (1 or 2) and a neutral provisional description ("Description to
     confirm with AA"), unless drift check step 2 supplied AA's text. Do not invent clinical meanings.
   - Existing codes keep their descriptions, which still carry the RFP's meanings (a US-05.1.5 gap
     point). They become admin-editable in item 9d and sit under the "provisional until AA's fuller list
     arrives" subheading. If AA's list has landed, replace descriptions only, never units.
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

4. **The base-unit resolver**, a new `src/domain/billing/baseUnits.ts` (US-05.1.6 AC1 to AC3, US-03.3.1,
   RV-04).
   - `resolveBaseUnits({ procedure, rvgCode?, procedureType?, contractBaseUnits? })` returns
     `{ units, source, guideRange?, outOfGuideRange }`.
   - `source` is one of `'captured' | 'contract' | 'procedureMaster' | 'rvgGuide' | 'rvgRangeChosen' | 'none'`.
   - Precedence:
     1. `baseUnitsCaptured.source === 'overridden'` (a manual override, unchanged behaviour);
     2. `contractBaseUnits` (a slot: nothing passes it until Phase 23 adds the Contract field);
     3. a `procedureType` whose mapping covers the Procedure's code (the entry's own code, or an AA
        group that contains the code);
     4. the RVG single value;
     5. the ranged code's `baseUnitsSelected`;
     6. otherwise 0 with `'none'`.
   - A link whose entry does not cover the Procedure's current code is ignored, and the fallback
     applies. This is defensive; the store clears such links (item 8).
   - `outOfGuideRange` is true only when the source is `'rvgRangeChosen'` and the value is outside the
     guide's min to max.
   - `resolveBtm` delegates its base branch to this. `BtmBreakdown` gains `baseSource` and
     `baseGuide` (the range, if any) so the UI, the review flags and 25's lock read one answer.
     `UnitProvenance` keeps its meaning.
   - `FeeContext` gains `procedureType?` (and `contractBaseUnits?`, left unset). Both assemblers,
     `feeContextFor` and `procedureFee`, look the link up in `masters.procedureTypes`, and so do
     `reviewFlags.naturalBtm` and `seed/billing.ts`.
   - Add `procedureTypesForCode(code, masters)`, a pure helper that returns the entries mapped to that
     code or to a group containing it.
   - Tests (`baseUnits.test.ts`):
     - each precedence step;
     - two master entries under one RVG code keep their own units (AC2);
     - the Contract slot beats the master (AC3);
     - a mismatched link is ignored;
     - range boundaries: min and max are in range; min-1 and max+1 are out of range and flagged;
     - no code at all gives 0 and `'none'`.
   - Grep `baseUnits.kind` afterwards. Outside `baseUnits.ts`, only display helpers (the picker row label,
     the master table) may read it.

5. **RV-04 rework: completion no longer bounds a ranged entry** (`validateCardForBilling.ts`, per D3's
   default).
   - Replace the in-range rule. When the Procedure's code is ranged, `baseUnitsSelected` is unset, and
     the resolved `baseSource` is not `'procedureMaster'` or `'contract'`, the rule fails
     `baseUnitsSelected` with "Base code {code} is a range ({min} to {max}): choose a base unit value."
   - A manual override (`'captured'`) does not stand in for the chosen value, as today: an overridden
     ranged Procedure with no chosen value still fails. Pin that in a test.
   - An out-of-range value passes.
   - A Procedure linked to a master entry needs no chosen value.
   - Tests: out-of-range passes; missing still fails; master-linked ranged code passes; overridden with
     no chosen value still fails. Update the existing in-range tests, which assert the old rule.

6. **RVG groups, the pure side** (`src/domain/billing/rvgGroups.ts`, US-05.1.3).
   - `groupsOfCode(code, masters)` returns the site group plus its AA groups.
   - `codesInGroup(ref, masters)` handles both kinds.
   - `searchRvgCodes(query, masters)` matches code, description, site or AA group name, for the Admin
     table filter.
   - `scopeCoversCode(scope, code, masters)` is true when both `scope.rvgCodes` and `scope.rvgGroups`
     are empty, or the code is listed, or it is in a listed group (item 2's Contract scope field).
   - Tests cover many-to-many membership, site derivation and `scopeCoversCode` (empty, by code, by
     site group, by AA group, not covered). Phase 26 consumes `codesInGroup` and Phase 20 consumes
     `scopeCoversCode`; this phase builds no prepaid UI and no picker change.

7. **Seed.** One `PERSIST_VERSION` bump for the whole phase. Draw nothing from the seeded RNG for new
   master data, so every generated Booking stays identical.
   - a. `rvgCodes.ts`: every existing row gets `source: 'nzsa'`, and its values do not change. Add two or
     three AA-sourced codes with an `AA` prefix. One is a dental code ("Dental extraction under GA",
     for the dental group), and one is a code the guide does not name. Mark them `source: 'aa'`, with
     demo-plausible base units. Do not add them to `GENERAL_CODES` or `EYE_CODES`, so generation is
     unchanged.
   - b. `rvgGroups`: Cosmetic (41800, 45200, 31340), Plastics (45030, 45200, 31340, 41800), Dental (the AA
     dental code) and Bariatric (20880, 20882). Set membership on `aaGroupIds`.
   - c. `procedureTypes`: about 12 entries. Take the names from AA's Master Fee List where one fits a seeded
     code. Each entry mapped to an existing code carries **the same base units as that code's guide
     value**, so a link never moves a figure. Include one code with two entries at different values
     (for example 45030: "Skin lesion excision, simple" 4 and "Skin flap repair, complex" 6; AC2), and
     one entry mapped to a group rather than a code.
     - Link `procedureTypeId` on a handful of seeded Procedures that the run sheet does not script, where
       the entry's units equal what the Procedure bills today. Pick them in a post-generation pass by a
       stable rule (sorted Procedure id, first N matching the code), never with an RNG draw.
     - Every seeded Contract gets `scope.rvgGroups: []`.
     - Leave S1's Sarah Mitchell, S3's Holt pair and every S4/S5 scripted Booking unlinked.
     - The parity fixture (item 1) must hold.
   - d. `modifierCodes`: the new set via `byId`. At `1f067a8` no seeded Procedure selects PO1 or PO2 (grep
     `cards.ts`). If 15 to 18 introduced any, remap each one to a fixed billing line ("Post-op ward
     review" or "Post-op acute pain management", per US-03.3.6). Its amount is the dollar value the
     code contributed at that Procedure's resolved unit rate, so the fee total is unchanged; the parity
     fixture proves it.
   - e. `preOpCodes`: CS250, CS260 and CS70, each with a description marked "to confirm with AA billing
     (OQ-12)". Seed no pre-op billing line, which would move a figure. It is demoed live.
   - f. Update `seed.test.ts`:
     - every `procedureTypeId` resolves and covers its Procedure's code;
     - every seeded modifier selection is in the master;
     - AA codes are marked `aa`;
     - group members exist.

8. **Store actions.** Items a to e are office-only, audited, and return `Outcome`, following
   `mastersActions.ts`. Put them in a new `src/store/rvgMasterActions.ts` and export them from
   `store/index.ts`. Item f extends `addBillingLine` and keeps its existing actor rules (the
   anaesthetist bills the pre-op line, US-05.5.2).
   - a. RVG codes (US-05.1.1).
     - `addAaRvgCode` validates: the code is unique, the description is non-empty, the site is required,
       base units are a positive integer (single) or a min under max (range), absorbs lists only codes in
       the master, and groups exist. Always `source: 'aa'`.
     - `editAaRvgCode` refuses an NZSA row with `nzsaGuideReadOnly`: "NZSA codes keep the guide's
       values. Set a different figure on the Procedure master." The guide's own values are kept.
     - `setRvgCodeGroups` works on any code; tagging is allowed on NZSA rows.
     - `deleteAaRvgCode` is refused with `codeInUse` while any Procedure or ProcedureType references the
       code.
   - b. RVG groups (US-05.1.3): `createRvgGroup` (the name is unique), `renameRvgGroup`, and
     `deleteRvgGroup`, which is refused while a ProcedureType maps to it or a Contract scope lists it.
     Membership is removed with it, and the audit entry records the codes it covered. Contract scope
     groups are written through Phase 18's existing Contract edit action, which gains a check that
     each group exists.
   - c. Procedure master (US-05.1.6 AC1): `createProcedureType`, `editProcedureType` and
     `deleteProcedureType`.
     - Save requires a name, an RVG code or group that exists, and a positive integer for base units
       (AC1).
     - A duplicate name under the same code is refused.
     - Delete is refused while Procedures link to the entry.
     - An edit re-prices unlocked Procedures that link to it. That is the expected pre-25 behaviour, and
       AUTHORISED invoices keep their snapshot amounts. Say so in a test.
   - d. Modifier codes (US-05.1.5): `editModifierCode` (units a non-negative integer, description,
     selection) and `addModifierCode` (into an existing group; the code is unique). `deleteModifierCode`
     is refused while any Procedure selects the code.
   - e. The Procedure link. `setProcedureType(api, actor, procedureId, procedureTypeId | null)` is
     office-only, follows the same lifecycle rights as office billing edits, and requires
     `procedureTypesForCode` to include the entry. `editProcedure` clears `procedureTypeId` in the same
     commit when a patch changes `rvgBaseCode` to a code the entry does not cover, so `ProcedureCodeCard.pick`
     needs no extra write.
   - f. ACC pre-op codes (US-05.5.2). `addBillingLine` accepts `code?`, allowed on `chargeBasis: 'fixed'`
     only.
     - The code must be in `masters.preOpCodes`.
     - The Procedure's Contract must be an ACC Contract, or the action refuses with `preOpCodeNotAcc`.
     - The line description defaults to "ACC pre-op assessment · {code}".
     - Decide "ACC Contract" with one pure `isAccContract(contract)` in `domain/billing/contracts.ts`:
       `contract.scope.fundingSources.includes('ACC')`, reading Phase 18's `ContractScope.fundingSources`
       (18's seeded ACC Contracts carry `['ACC']`). Never a revived ACC flag or `accRelated` (RV-20). If
       18 left the field under another name, follow it and record that in the Decisions log. Tests in
       `contracts.test.ts`: ACC-scoped is true; unscoped and other funding sources are false.
     - `invoiceBuild` carries `code` onto the invoice line, and the description shows it.
   - Tests: a new `store/rvgMasterActions.test.ts` covers every guard and audit entry above. Also
     cover:
     - editing a modifier's units changes a DRAFT Procedure's fee;
     - an already-built invoice does not change;
     - the link is cleared when the code changes;
     - a pre-op code is refused on a non-ACC Contract;
     - a Contract scope naming an unknown group is refused, and a group in a scope cannot be deleted.

   **Session 1 ends here, green:** `npm run build`, `npm run build:pwa`, `npx vitest run`, and the parity
   fixture unchanged.

9. **Admin, Master data** (`MasterData.tsx`, desktop; teal actions; tables in the existing chrome).
   New admin sheets (`RvgCodeSheet`, `RvgGroupSheet`, `ProcedureTypeSheet`, `ModifierCodeSheet`) are new
   files in `src/apps/admin/flows/` beside `ContractEditSheet`, each a new member of the `Sheet` union.
   Provisional notes use the existing `src/shared/DemoBadge.tsx`.
   - a. **RVG codes.** A search box drives `searchRvgCodes`, and a group filter covers site and AA groups.
     - Columns: Code (mono), Description, Site, Groups (neutral pills), Base units, Absorbs, and Source.
       Source is a neutral "NZSA" or "AA" pill; the AA pill shows the "AA-sourced" wording in its title.
     - "Add AA code" opens `RvgCodeSheet` (code, description, site, single or range base units, absorbs,
       groups).
     - Row "Edit" opens the same sheet. For an NZSA row, only Groups can be edited, and the base-unit
       fields are read-only with the `nzsaGuideReadOnly` sentence as a caption.
     - The subheading drops "view only" and keeps "Demo-plausible values; the full NZSA 2021 set loads at
       go-live (Phase 42)."
   - b. **RVG groups** is a new tab (or a panel on the RVG codes tab). It lists each group with its code
     count, and offers New group, Rename, and Delete, with the refusal sentence shown. Tag codes from
     the code sheet's Groups field, a multi-select of chips.
   - c. **Procedure master** is a new tab. It is a table of Operation name, Mapped to (code mono with its
     description, or group pill), Base units (mono), and Linked Procedures (count).
     - New and Edit open `ProcedureTypeSheet`. It has a name, a mapping segmented control (RVG code or
       RVG group) with a searchable select, and a base-units stepper.
     - The sheet shows "RVG guide value: N" beside the stepper for reference.
     - A header note carries the OQ-06 provisional label.
     - Delete is refused while entries are linked.
   - d. **Modifier codes.** Each row gets Edit, and the tab gets an "Add modifier code" action; both use
     `ModifierCodeSheet`.
     - Fields: units stepper, description, and Selection as a segmented control ("Pick one in group" /
       "Adds on top"). The group is fixed on edit and chosen on add.
     - The Selection column now reads the data.
     - The subheading says: "Unit values are demo-plausible, not AA's schedule. New codes' descriptions
       are provisional until AA's fuller list arrives."
     - Remove the "question for AA" wording only if the drift check shows it is settled; otherwise keep
       it for the band reading.
   - e. **Contracts.** `ContractEditSheet`'s Scope section (Phase 18's multi-select chips) gains an
     "RVG groups" chip select beside RVG codes, listing site and AA groups. The Contracts table's scope
     summary shows them as neutral pills. Nothing else in the Contract editor changes.
   - Add `data-shot` hooks: `masters-rvg`, `masters-rvg-groups`, `masters-procedure-master`,
     `masters-modifiers`.

10. **Capture, mobile and web (shared)**, for US-03.3.1, US-05.1.5 and RV-04. The code picker
    (`CodePickerSheet`) is not changed.
    - a. `ProcedureCodeCard`.
      - `RangeUnitsRow` drops its clamp. The floor is 1 and there is no ceiling. The first press starts
        from min. The guide range stays in the label ("Guide 8 to 10 units · 11 chosen").
      - When the value is out of range, show a warn-tinted caption (not an error): "Outside the guide
        range. The office will see this at review." It is labelled Provisional per D3.
      - When the resolved source is `procedureMaster`, hide the range row. The card's units line then
        reads "Base 5 units · Procedure master: Appendicectomy, laparoscopic".
      - The 2026-09-28 ruling holds: base units are capture context, and the card still shows no fee.
    - b. `ModifierChips`: `BANDS` and `STACKING_CODES` are derived at render from
      `useAppStore((s) => s.masters.modifierCodes)` and `MODIFIER_GROUPS`, no longer at module load.
      - Groups with `inCaptureByDefault` (PA, A, OB, ASE, P, AI) render as today.
      - The new groups (TTE, POC, NC as segmented bands; VM1, PACU1, EAA1 as chips) sit under a
        "More modifiers" disclosure row. It starts collapsed, opens itself when any code inside is
        selected, and shows a count of selected codes. This keeps the phone's capture height, which is
        what the 2026-07-28 ruling was about.
      - Labels come from `modifierLabels.ts`. PO1 and PO2 are removed, and new codes fall back to the
        code itself ("TTE1"), not an invented label.
      - The footer caption becomes: "Modifier unit values are demo-plausible, not AA's schedule."
    - c. `UnitsCard` and `AsaCard` read the store master (via `asaSeedUnits`, `modifierBreakdown` and
      `getModifierCode(code, master)`). The B row's seeded caption comes from `baseSource`: "From the
      Procedure master", "From the RVG guide", "Chosen within the guide range", "Chosen outside the guide
      range" or "Set by the Contract" (from 23).
    - d. `ManualCardForm`: no change beyond compiling against the new master parameters.

11. **Office: link a Procedure to the Procedure master** (US-05.1.6).
    - `OfficeBillingSetup` gains a summary row: "Procedure master · Appendicectomy, laparoscopic (5 units)",
      or "None · RVG guide value".
    - The row has a Change action that opens `ProcedureTypeSheet`'s picker variant
      (`SetProcedureTypeSheet` in `src/shared/flows/`). It lists only `procedureTypesForCode(procedure.rvgBaseCode)`
      plus "None", each showing its base units, and calls `setProcedureType`.
    - This is an office mapping on one Procedure, not the OQ-06 capture picker. The anaesthetist
      surfaces get only the read-only caption from 10a.
    - `src/shared/flows/` ships to the PWA, so `SetProcedureTypeSheet` imports nothing from
      `src/apps/admin/` (`pwaPurity.test.ts`).
    - Phase 20 reworks this panel; keep the row self-contained so it moves cleanly.

12. **Office review flag for out-of-range base units** (RV-04 and D3).
    - `reviewFlagsForCard` gains a warn flag: "Base {n} outside the guide range {min} to {max}". It is
      keyed per procedure and reads `fee.btm.baseSource` and `baseGuide`.
    - `naturalBtm` passes the procedure type and modifier master. `ReviewCardInput` gains the
      `procedureTypes` and `modifierCodes` masters, fed by `ReviewScreen`.
    - It shows in `ReviewScreen`'s Flags tile and table like the other flags, and on the Admin Booking
      detail's UnitsCard caption.
    - Tests (`reviewFlags.test.ts`): the flag shows out of range, is absent in range, and is absent for a
      master-linked Procedure.

13. **ACC pre-op codes in capture** (US-05.5.2, provisional under OQ-12).
    - `AddBillingLineSheet`: when `isAccContract(contract)` is true, the "Ancillary fixed amount" option
      shows an "ACC pre-op code" segmented control (CS250 · CS260 · CS70 · None) above Description.
      Picking a code pre-fills the description, and the amount is still typed.
    - The caption becomes: "Provisional · ACC pre-op codes and their amounts are to confirm with AA
      billing."
    - On any other Contract, the control is absent and the old "name the code in the description"
      caption is removed.
    - `BillingLinesCard` shows the code as a mono prefix. The Admin invoice line shows it too
      (`InvoiceDocument`).
    - Mobile and web share the sheet, so there is one change for both.

14. **Copy and label sweep.** Search `src/` for "view only" (RVG and modifier tabs), "PO1", "Post-op
    ward review", "between {min} and {max}", "Name the code in the description" and "RFP's stated
    ranges", and update each. Every new user-visible string follows the no en/em dash rule; ranges use
    "to". Provisional labels use the existing `DemoBadge` (`src/shared/DemoBadge.tsx`), never crimson.

15. **Playwright and green.**
    - Update `m4-01-modifiers` and the `mobile-interactions` band spec, which follows PA and must keep
      passing.
    - Add specs for:
      - the four master tabs;
      - adding an AA code and seeing it in the capture picker (mobile);
      - an out-of-range entry showing the caption, then the review flag in Admin;
      - an ACC pre-op code line on a seeded ACC-Contract Booking (web; Phase 18's `accContractCard`
        scenario marker, "ACC procedure under St George's ACC Contract").
    - Run `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots`. All must be green,
      and the parity fixture unchanged.

## Demo triggers

None. Everything this phase adds can be shown through normal use: Admin master data, capture on
mobile or web, the office billing panel, and the Review screen. Nothing here is automatic, scheduled,
or an external event, so no registry entry is added and the Control Panel is untouched. PWA: the
modifier master, the ranged entry and the pre-op code sheet reach the PWA through the shared capture
components. No mobile beat waits on the office, so no PWA office stand-in is needed. Master edits are
an Admin-only act, and the PWA shows their effect when the handset reloads its seed, like any other
master.

## Out of scope

- A pick-by-operation-name capture picker, or any change to `CodePickerSheet`'s grouping or search
  (OQ-06). Group search lives in the Admin table only. This leaves one US-03.3.1 gap point open on
  purpose: the capture picker is still grouped by anatomical site only, not "and other groupings".
  Log it in the handoff list with the OQ-06 follow-up, so the picker changes once, not twice.
- Contract selection by RVG group (Phase 20). This phase adds only the scope field, its editor chips
  and `scopeCoversCode`.
- The Contract base-unit override field and its UI, and Booking-level pricing with the 3/2/2 modifier
  split (Phase 23). This phase only leaves the resolver's `contractBaseUnits` slot, tested.
- Locking the base-unit source at AUTHORISED (Phase 25). The prepaid tick list of codes and groups
  (Phase 26).
- Spreadsheet loads of the RVG, Procedure and modifier masters, the full NZSA 2021 set, and editing the
  modifier groups themselves (Phase 42).
- Fixed amounts per ACC pre-op code (OQ-12). Removing other ACC special-case markers (RV-20, earlier
  phase).
- Real NZSA or AA unit values. All units stay demo-plausible and labelled.

## Manual test checklist

- [ ] Admin → Master data → RVG codes: search "cosmetic" finds the tagged codes. The group filter
      narrows to Plastics. Each row shows an NZSA or AA source pill.
- [ ] Add AA code (for example AA205, single base 4, groups Plastics): it saves with an AA pill and an audit
      entry. It then appears in the mobile and web code pickers under its site, and picking it seeds
      Base 4 units.
- [ ] Editing an NZSA row allows Groups only. The base units are read-only and carry the guide sentence.
- [ ] Deleting an AA code that a Procedure uses is refused with the in-use sentence.
- [ ] RVG groups: create "Orthodontic", rename it, and try deleting a group a Procedure master entry
      maps to (refused).
- [ ] Contracts: edit a Contract's scope, add the Cosmetic RVG group, save (audited), and see it as a
      neutral pill. Deleting Cosmetic is then refused with the in-use sentence. Remove it again.
- [ ] Procedure master: two entries under 45030 show different base units. Saving an entry without a
      mapping or base units is refused. The OQ-06 provisional note shows.
- [ ] Office on an Admin Booking with 45030: Procedure master "Change" lists only the two 45030 entries
      plus None. Picking "Skin flap repair, complex" changes B to 6, and the B caption reads "From the
      Procedure master". Changing the code clears the link.
- [ ] Modifier codes: the set matches US-05.1.5, with PO1 and PO2 gone. Editing TTE1 to 2 units and
      selecting it on a DRAFT Booking adds 2 to M. Switching TTE's selection to "Adds on top" lets TTE1
      and TTE2 stack.
- [ ] Capture (mobile, then web): PA, A and BMI bands and the Also applies chips look as before.
      "More modifiers" opens and shows the new bands and chips, and it opens itself on a Booking that
      has one selected.
- [ ] Ranged code (47522 hip revision): stepping to 11 is allowed, with the "Outside the guide range"
      caption. Mark complete succeeds. In Admin Review the List shows the "Base 11 outside the guide range
      8 to 10" flag. Leaving the value unchosen still blocks completion with the choose-a-value sentence.
- [ ] Add billing line on a Booking whose Contract is an ACC Contract: the CS250 · CS260 · CS70 selector
      shows, and CS250 pre-fills the description. The line lists with a mono CS250 prefix, and the built
      invoice line carries it. On a non-ACC Contract the selector is absent.
- [ ] S1 Beat 3 (Sarah Mitchell, 20950) and S3's Holt and fee figures are unchanged, and the parity test
      is green.
- [ ] Audit viewer: rvgCode, rvgGroup, procedureType and modifierCode entries appear with before and
      after values.
- [ ] No en or em dash in any new app copy (grep the diff). Actions are teal, pills neutral, and no
      crimson.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots` green.

## Demo guide updates

No scripted figure changes. Patch the wording these sections carry, and the matching sections of
`master-demo-guide.html`, in the same session:

- `04-presenter-cheat-sheet.md`:
  - "Fee calculation": "Some RVG codes are ranges..." becomes "the anaesthetist chooses a value; going
    outside the guide range is allowed and flagged for the office (provisional)". Add "base units come
    from the Procedure master where a Procedure is linked, otherwise the RVG guide".
  - Item 10: the modifier set is the catalogue's, editable in Admin; selection rules are master data;
    post-op reviews are billing lines, not modifiers.
  - Item 12: pre-op codes are now selectable on ACC Contracts, with the amount entered (OQ-12).
- `02-workflows-and-handoffs.md` capture steps 3 and 8: remove "post-op care" from the stacking list,
  mention "More modifiers", and note the unbounded range with its review flag.
- `03-demo-script.md`:
  - The S5 discovery points (line about demo-plausible modifier values): add the Procedure master and
    OQ-06.
  - Add an optional "Worth pointing at" in S5: Admin → Master data → Procedure master, showing two
    entries under one code.
  - Confirm S1 Beat 3 and S3 read unchanged.
- Control Panel scenario text: none expected. Grep `src/apps/demo` for "post-op" and modifier wording to
  confirm.

## Adversarial review (after build)

After the manual test checklist and the four commands are green, and before writing the PROGRESS entry,
run the standard **adversarial review-and-fix pass (PROGRESS convention 18)**. Fan out about three
independent Opus review subagents, one each for **quality**, **bugs/correctness** and **plan adherence**.
Add a fourth on billing maths, because the resolver sits under every fee. This session then
independently verifies every finding against the catalogue files, this doc and the code, fixes the
confirmed ones (with a test for each bug), re-greens, and records the pass. Do not re-raise anything
settled in the Decisions log.

**Steer this phase's reviewers at:**

- **No figure moved.** The parity fixture is byte-identical. S1 Beat 3, S3 Holt ($396.18 or whatever
  16 to 18 left) and the S3 fee figures are unchanged. Every seeded `procedureTypeId` link carries
  exactly the guide value it replaces.
- **One base-unit answer.** Only `baseUnits.ts` decides base units, and both fee-context assemblers
  (`feeContextFor`, `procedureFee`), `invoiceBuild`, `seed/billing.ts` and `naturalBtm` pass the same
  inputs. Check the precedence: manual override, then Contract slot, then Procedure master, then guide
  single, then range chosen. A stale or mismatched link falls back instead of pricing.
- **Modifier rules are data.** No runtime path reads the static `MODIFIER_CODES` or a module-level band
  table. An Admin edit shows at once in the chips, the M caption, the ASA caption and the fee.
  Existing codes' band behaviour is identical, including the PA5 exemption and first-wins refusal. PO1
  and PO2 have gone from code, labels, tests and copy.
- **RV-04 is done exactly.** Out-of-range does not block and does raise the warn flag. An unchosen
  ranged value still blocks. A master-linked Procedure needs no chosen value. The D3 provisional label
  shows.
- **Master guards.** NZSA guide values are read-only. AA codes are marked. Deletes of anything in use
  are refused. Every master write is office-only, goes through `mutate()` and is audited.
  `PERSIST_VERSION` is bumped once, and no new seed data draws from the RNG.
- **ACC pre-op codes appear only on an ACC Contract,** decided by the scope funding source through
  `isAccContract`, never by a revived ACC flag (RV-20). The store guard mirrors the UI. The code
  reaches the invoice line.
- **Contract scope groups** are empty on every seeded Contract, so no selection or price moves; a
  group in any scope blocks its deletion.
- **No gold-plating.** No operation-name picker, no picker changes, no Contract override field, no
  prepaid UI, no loader. Plus the usual: teal-only actions, no dashes in copy, mobile sheets not
  modals, `pwaPurity` green.

## PROGRESS.md updates

- Status row for catch-up Phase 19, and a phase entry: what was built, the parity result, the review
  pass (findings confirmed and fixed, anything not treated as a defect and why), tests added, and the
  `PERSIST_VERSION` bump.
- **Decisions log:**
  1. The modifier master is store data, with the selection rule per code. This supersedes the
     2026-07-22 "table lives in `modifierCodes.ts`" entry and its PO1 to PO2 list, and carries the
     2026-07-27 band reading forward as the default for the new numbered groups.
  2. The 2026-07-28 picker shape is extended with "More modifiers".
  3. RV-04 under D3: ranged base units are unbounded at completion and flagged for review. This
     supersedes the Phase 04 in-range completion rule.
  4. Base-unit precedence (manual, Contract, Procedure master, guide) and the office-set Procedure
     master link as the OQ-06 interim.
  5. NZSA guide values are read-only; AA codes carry the `aa` source. AS2 stays in the modifier set
     (US-05.1.5 wins over the domain model's "AS1/AS3/AS4").
  6. ACC pre-op codes are coded fixed lines gated by `isAccContract` on 18's `scope.fundingSources`,
     provisional under OQ-12.
  7. Contract scope gains `rvgGroups` (site or AA groups), matched with `scopeCoversCode`; selection by
     it is Phase 20's.
- **Handoff list:**
  - 23 fills `contractBaseUnits` from the Contract's override.
  - 25 locks `baseSource`, the linked entry and the modifier values used.
  - 26 builds the tick list on `codesInGroup`.
  - 20 filters Contracts by `scopeCoversCode` (scope RVG codes and groups).
  - 42 loads the masters from spreadsheets and makes groups editable.
  - The OQ-06 outcome decides whether a pick-by-operation picker phase is needed. That same picker
    change adds AA groups to the capture picker (US-03.3.1 "and other groupings", left open here).
  - AA's fuller modifier list replaces the provisional descriptions.
