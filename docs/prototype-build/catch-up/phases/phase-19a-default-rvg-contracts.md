# Phase 19a · Default RVG Contracts hold the base units

**Requirements covered:**
[US-04.4.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.4.2.md) Default RVG Contract for every procedure (Verify) ·
[FT-04.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-04.4.md) Default Contracts for hospitals, insurers and procedures (Proposed) ·
[US-05.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.2.2.md) Tiered time units (Confirmed) ·
[DM-43](../analysis/domain-model-delta.md#dm-43) base units live in each procedure's default RVG Contracts; any other Contract may override them.
Also builds, without closing: the base-unit half of
[US-04.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.2.md)
(the Contract base-unit override for a procedure, RVG code or group, moved here from Phase 23; the
story closes in Phase 24 with the defined rate and the adjustment rule), US-05.1.6 AC1 and AC2 ("at
least one default RVG Contract"; "the override is used"), and the procedures and RVG groups
dimensions of
[US-04.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.1.md)
scope (the `procedureTypeIds` retype, `scope.rvgGroups` and `scopeCoversProcedure`, which Phase 19
left to this phase), with the procedure scope seeded on every Contract, so Phase 20's procedure
filter (D16) returns real Contracts.
Answered and built as answered: owner decision D12
([OQ-62](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-62.md)), D25
([OQ-75](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-75.md)) and the
procedure half of D16 ([OQ-66](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-66.md)).
Open, built as their recommendation and labelled provisional in one place:
[OQ-78](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-78.md) (default
Contracts, or the hospital holding every Contract) and
[OQ-88](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-88.md) (RVG code
master and procedure master, one list or two).
**Depends on:** Phase 19 (the editable RVG reference master, the master procedure list with no base
units, `ProcedureTypeId`, `RvgGroupRef`, `groupsOfCode` and `codesInGroup`, the one base-unit
resolver in `baseUnits.ts` with its `contractBaseUnits` slot, `procedureTypesForCode`,
`soleProcedureTypeForCode` and `procedureTypesByGroup`, the `baseUnitsOutsideGuide` warning rule, the
procedure-first picker). 19 builds **no** Contract change: the `scope.procedureTypeIds` retype,
`scope.rvgGroups`, `scopeCoversProcedure`, the editor's procedure and group scope fields and the
scope delete guards are this phase's (item 9).
Through 19: Phase 18 (the four-part Contract, `scope.procedureTypeIds` typed `string[]` and left
empty, `FeeScheduleLine.mappedRvgCodes`, `nextAaCode`, the fee parity harness), 15a (the warning
routine) and 15 (Booking vocabulary).
**Estimated:** 2 sessions. Session 1: work items 1 to 7 (baseline, model, time rule as data, the
generated default RVG Contracts, the resolver switch, their store actions, the stale rounding copy),
ending green with the parity fixture unchanged. Session 2: work items 8 to 14 (the override list, the
scope model 19 left (`scopeCoversProcedure`, RVG groups) and the procedure scope with its derivation
and seed, the Admin screens, capture and Review captions, shots,
demo guide) and the review pass. If session 2 runs long, cut the Review table's source pill (item
12c) before any editor or seed work.

**Confirm before building.** US-04.4.2 is Verify because OQ-78 is open (Greg is revisiting the
default-Contract model). D12 and D25 are answered and built with no provisional label. OQ-78 and
OQ-88 are built as their recommendations behind one helper module, labelled provisional in **one
place** only (the header of the "Default RVG Contracts" view, item 10a), so a different answer is a
change in `defaultRvgContracts.ts` and that view.

## Goal

Move base units onto Contracts (OQ-62 answered, DM-43), finish the base-unit source before 20's
Contract picker, 23's Booking-level engine, 25's lock and 27's estimator read it, and make the time
tiers data.

- **Every master procedure has one or two default RVG Contracts,** the standard RVG
  recommendation, holding its base units and its other settings (US-04.4.2, US-05.1.6). The data
  supports both of AA's options: one Contract with a range, or one Contract per kind (for example
  Simple and Complex), each with its own value. The seed generates one default RVG Contract per
  procedure from today's RVG figures, so **no fee moves**, and shows one per-kind pair on a
  procedure no seeded Booking uses. FT-04.4 then holds for hospitals, direct insurers and
  procedures.
- **Contracts gain a base-unit field** (single or range, on a default RVG Contract) and **an override
  list** keyed by procedure, RVG code or group, so any other Contract can override base units
  (US-04.2.2 "Base units"; this replaces the override Phase 23 was to add).
- **The one resolver reads the Contract.** A Procedure's base units come from its Contract's override,
  else the procedure's default RVG Contract. Until Phase 20 stores a Contract on every Procedure, the
  Contract is the one today's resolver already picks. The RVG master's values become reference only:
  they seed a new default RVG Contract and are shown beside it for comparison, and price only an
  unlinked legacy Procedure that no default Contract can be found for.
- **Every Contract is scoped to its master procedures,** so Phase 20's procedure-first filter returns
  real Contracts: each generated default RVG Contract is set against its own procedure, and every
  existing hospital, insurer and Surgeon Solo or Group Contract gets its procedure scope, derived from
  its schedule lines' RVG mapping where it has lines and set by hand otherwise. This phase also
  builds the scope model 19 left: `procedureTypeIds` retyped to `ProcedureTypeId[]`, a
  `scope.rvgGroups` dimension (US-04.2.1 "RVG codes or groups") and the one pure
  `scopeCoversProcedure` that Phase 20's filter calls. The Contract editor's Scope section gains a
  searchable Procedures field and RVG group chips.
- **The Admin Contract editor shows a procedure's default RVG Contracts under the procedure** and
  edits their base units. Thousands of them in production must not flood the Contract catalogue or
  the picker: they live under their procedure, searchable, and are kept out of the main Contract list
  and every Contract select. Spreadsheet import is Phase 42's.
- **Tiered time units become data** (US-05.2.2). OQ-75 is answered: a part interval always rounds up,
  15 minutes for the first two hours, then 10. The stale "assumption" caption on the T row, the
  Control Panel callout and the matching demo-guide lines go.

No figure in the S1 to S5 run sheet moves. The one deliberate figure change is the seeded override's
own Booking (item 8e), listed in the parity test and PROGRESS.

## Before you start: drift check

1. Run `git diff 3d3a18c -- "docs/discovery-reference/Updated Requirements/catalogue" "docs/discovery-reference/Updated Requirements/domain-model.md"`
   and read the hunks for US-04.4.2, FT-04.4, US-04.4.1, US-05.2.2, US-04.2.2, US-04.2.1, US-04.3.2
   (the picker that reads the procedure scope), US-04.3.3 (the hospital default), US-05.1.6, US-05.1.1,
   US-03.3.1, US-06.2.4 (the estimator that reads base and time units), OQ-62, OQ-66, OQ-75, OQ-78 and
   OQ-88. Re-read the domain model's "The default Contract" and "Base units come from the RVG code"
   rows, its `baseUnits / baseUnitOverrides` row, the "RVG code and modifier master" section and the
   glossary's "Default RVG Contract". If an item changed, re-read it whole and adjust the work items.
   If one is now Retired or Future, drop its work and say so in the PROGRESS entry.
2. Check `docs/discovery-reference/Data files/` (`git log` on it) for Vanessa's standard procedure list
   with RVG codes and base units (US-05.1.6 note: it will pre-populate the default Contracts). If it has
   landed, do not adopt its figures: keep every generated default RVG Contract at today's figure (item
   5) and note the file for Phase 42's loader.
3. Confirm the open questions.

| Gate | Build | If answered differently |
|---|---|---|
| **D12 / OQ-62** (answered) | Base units in one or two default RVG Contracts per procedure (range, or one per kind), any other Contract may override for a procedure, code or group; the master procedure list and the RVG master hold no pricing figure. No label | Not expected. If the drift check shows Greg's "Contracts as children of a master code" adopted, stop and ask the owner: it changes item 2's model |
| **D25 / OQ-75** (answered) | Part intervals always round up, 15 minutes for two hours then 10, held as data. No label | Not expected. A different interval or boundary is a data change in `DEFAULT_RVG_TIME_RULE` only |
| **OQ-78** (Open: default Contracts, or the hospital holding every Contract) | Keep both defaults. The hospital's RVG Default Hospital Contract stays the Contract Phase 20 defaults onto the Procedure; the procedure's default RVG Contract is the base-unit source behind it and behind every Contract with no override. One "Provisional" note on the Default RVG Contracts view header, nowhere else | If Greg drops default Contracts, the procedure defaults stay as the base-unit source (OQ-62 is answered) and only the hospital default changes, which is Phase 20's and 21's. Log it; do not stop |
| **OQ-88** (Open: one list or two; where the system code sits) | 19's reading: one procedure master, a system code per line, RVG codes as reference. Default RVG Contracts hang off the procedure master line (`procedureTypeId`), never off an RVG code | If procedures become children of RVG codes, nothing here changes. If the two lists merge, the `defaultRvgFor` key follows the merged line: a change in `defaultRvgContracts.ts` only |
| **US-04.4.2** (Verify) | Build as written | Adjust to the verified text |

4. Read what Phases 15a, 15b, 16, 17, 18 and 19 actually built (their PROGRESS entries). File names
   below are as at `3d3a18c` (after 14, 15 and 15a session 1). Confirm in particular:
   - from 18: the `Contract` shape (category, `holder` union, `scope` with `procedureTypeIds`,
     `pricingBasis`, `isDefault`, `aaCode`), `FeeScheduleLine.mappedRvgCodes` and `isAddOn`,
     `nextAaCode`, `isRetired`, `selectContract`'s precedence, the protected-default guard in
     `contractActions.ts`, the Contract catalogue and detail panel, `ContractEditSheet`'s Scope
     chips, the `CT-RVG-POSTPAID` and `CT-CES-HNZ` Contracts, `feeParity.test.ts` and its
     `__parity__/` fixtures;
   - from 19: what `ProcedureType` holds (no base units, per D12; its system code, if 19 added one
     under OQ-88), `resolveBaseUnits`'s signature, `source` values and precedence, `BtmBreakdown`'s
     `baseSource` and `baseGuide`, the `contractBaseUnits` slot, `outsideGuide` and the
     `baseUnitsOutsideGuide` rule, `procedureTypesForCode`, `soleProcedureTypeForCode`,
     `groupsOfCode`, `codesInGroup`, `procedureTypesByGroup`, `createProcedureType` and
     `deleteProcedureType` in `rvgMasterActions.ts`, `ProcedureTypeSheet` and the Master procedure
     list tab, the RVG codes tab's copy, the B caption and `RangeUnitsRow` wording ("From the RVG
     reference", "Guide 8 to 10 · 11 chosen", "Outside the guide range..."), how seeded Procedures
     were linked (19's plan leaves 45030's Procedures unlinked because 45030 has two lines), and its
     out-of-range warning sample. 19's plan builds no Contract change; if it did add
     `scopeCoversProcedure`, `scope.rvgGroups` or Procedures chips anyway, extend those instead of
     writing a second one (item 9);
   - from 15a: how a warning rule reads its facts (19's rule re-points here, item 6).
5. Record the current `PERSIST_VERSION` (16 at `3d3a18c`; 15b to 19 will have bumped it).

## Reference

**Design (convention 17).** No mockup covers Contract or master-data editing. Extend the Admin Review
page's table anatomy (`docs/design/Admin Review.dc.html`: header row, mono data cells, status pills,
row actions) and the Master data tabs and edit sheets as 18 and 19 left them (`ContractEditSheet`,
`ProcedureTypeSheet`). Capture captions stay on `docs/design/Mobile App.dc.html` screen 3 (the code
card and units card) and its web twin in `Web Dashboard.dc.html`. Tokens, pills, the warn tint and the
provisional badge style come from `Design Language.dc.html`. Teal is the only action colour. Source,
kind and "Provisional" markers are neutral pills, never crimson.

**Catalogue.** The files linked above, plus
[US-05.1.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.1.6.md)
(the procedure master; "one default Contract with a range, or one per kind"),
[US-05.1.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.1.1.md)
(the RVG master as reference data),
[US-04.3.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.3.3.md)
(the hospital default),
[US-04.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.4.1.md)
(mandatory default Contract, already met),
[US-04.3.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.3.2.md)
(the picker filtered by procedure then hospital, built in 20),
[US-06.2.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.2.4.md)
(the estimator, built in 27) and
[US-13.4.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.4.3.md)
(spreadsheet loads, built in 42). The evidence is `catalogue/notes/2026-10-02-aa-meeting-with-greg.md`
items 3, 16, 22 and 40, and `notes/2026-10-02-aa-booking-and-pricing-review-with-greg.md` items 40
and 53.

**Analysis.** `../GAP-ANALYSIS.md` sections "EP-04 · Contracts" (FT-04.4, US-04.4.2) and "EP-05 · RVG
master data and fee calculation rules" (US-05.2.2), and the DM-43 row of "Structural changes".
`../epics/EP-04.md` (FT-04.4, US-04.4.2) and `../epics/EP-05.md` (US-05.2.2).
`../analysis/domain-model-delta.md#dm-43` (and DM-07, DM-10, DM-13 for context).
`../analysis/prototype-map-domain.md` (billing maths), `prototype-map-shared.md` (capture suite),
`prototype-map-admin.md` section 9 (Master data) and `prototype-map-store-seed.md` (masters, seed).

**Code entry points (at `3d3a18c`; follow 18's and 19's shapes).**

- Types: `src/domain/types.ts`. `RvgBaseUnits` and `RvgCode` (about 550), `Contract` (about 216 to
  241; 18 reshapes it), `Procedure.baseUnitsSelected`, `baseUnitsCaptured`, `governingContractId`.
- Time units: `src/domain/billing/timeUnits.ts` (`PARTIAL_INTERVAL_ROUNDING`, the `TIER1_*` and
  `TIER2_INTERVAL` constants, `timeUnitsFromMinutes`, `timeUnits`), read by `fee.ts` `resolveBtm`
  (line 76) and exported from `domain/billing/index.ts`. Tests: `timeUnits.test.ts`.
- Base units: `src/domain/billing/fee.ts` `resolveBtm` and `FeeContext` (19 delegates the base branch
  to `baseUnits.ts`). The fee-context assemblers that must all pass the same inputs: `feeContextFor`
  in `validateBookingForBilling.ts`, `procedureFee` in `src/shared/capture/feeContext.ts`,
  `InvoiceBuildContext` in `invoiceBuild.ts`, `contextFor` in `src/domain/seed/billing.ts`,
  `naturalBtm` in `src/apps/admin/reviewFlags.ts` (its own `resolveBtm(` call), and their callers:
  `procedureFee(` in `shared/capture/BtmCaptureBlock.tsx`, `shared/booking/BookingDetailBody.tsx`,
  `shared/flows/FunderAllocationSheet.tsx` and `apps/admin/screens/ReviewScreen.tsx`, and
  `feeFor(feeContextFor(...))` in `invoiceBuild.ts`, `validateBookingForBilling.ts` and
  `store/billingLineActions.ts` (grep `feeFor(`, `procedureFee(`, `feeContextFor(` and `resolveBtm(`).
- Contract selection today: `domain/billing/contracts.ts` `selectContract` (34),
  `invoiceBuild.ts` `defaultContractFor` (86), `resolveContractForProcedure` (114) and
  `counterpartyForProcedure` (192). `shared/flows/EditBillingSetupSheet.tsx` "Governing contract"
  select (175), which lists every Contract.
- Seed: `src/domain/seed/contracts.ts` (`CONTRACT`, `CONTRACTS`, `CONTRACT_PRICES`, 18's lines),
  `seed/rvgCodes.ts` (`RVG_CODES`, `GENERAL_CODES`, `EYE_CODES`), `seed/bookings.ts`
  (`DEFAULT_CONTRACT_BY_HOSPITAL` at 117 maps Southern Cross to SXAP and Christchurch Public to Health
  NZ, so every generated Booking there sits on a rate Contract), `seed/index.ts` (`SeedMasters` at 91,
  built at about 438), `seed.test.ts`.
- Store: `store/contractActions.ts` (18's create, edit, retire and the protected-default guard),
  `store/rvgMasterActions.ts` (19), `store/mastersActions.ts` (`createHospital` 45,
  `setInsurerDirectClaims` 102: the atomic default pattern), `store/mutate.ts` `allocateId`,
  `store/appStore.ts` (`PERSIST_VERSION` 136).
- Admin: `src/apps/admin/screens/MasterData.tsx` (`ContractsView` 198, `RvgCodesView` 411, 19's
  Master procedure list tab), `src/apps/admin/flows/ContractEditSheet.tsx`, 19's
  `ProcedureTypeSheet.tsx`, `src/apps/admin/screens/ReviewScreen.tsx` (the B · T · M cell, 264).
- Capture: `src/shared/capture/UnitsCard.tsx` (the T caption at 68, the B caption from 19's
  `baseSource`), `ProcedureCodeCard.tsx` (19's "Base N units · from ..." line).
- Demo surface: `src/apps/demo/DemoControlPanel.tsx` 209 to 231 (the "Billing assumption" callout).
- Audit copy: `src/shared/audit/fieldLabels.ts`, `auditNarrative.ts`.
- Tests to extend: `timeUnits.test.ts`, `fee.test.ts`, 19's `baseUnits.test.ts` and
  `rvgMasterActions.test.ts`, `contracts.test.ts`, `invoiceBuild.test.ts`, `seed.test.ts`,
  `feeParity.test.ts`, 15a's warning tests, `src/pwa/pwaPurity.test.ts` (must stay green).
  Playwright: `visual/admin-phase07.spec.ts` (`a7-04-masters`), `mobile-phase04.spec.ts`,
  `booking-calculation-display.spec.ts`, `demo-actions.spec.ts` (the Control Panel page).

## Work items

Model, domain and seed first, then store, then UI. Every new write goes through `mutate()` with an
audit meta. Every rule is a pure function in `src/domain/billing/` with a Vitest test. No new seed data
draws from the seeded RNG. One `PERSIST_VERSION` bump for the phase.

1. **Baseline the figures (before any edit).** Add `phase-19a-baseline.json` beside 18's and 19's
   fixtures in `domain/billing/__parity__/`, generated from the untouched code at the start of the
   phase: every seeded Procedure's `feeFor` total and B, T and M units, and every seeded invoice total
   from `buildSeed()`. Add **named cases** for each scripted Booking S2 to S5 (find them through the
   scenario markers in `seed/index.ts` and the run sheet: Ellison and Holt in S3, the S4 prepaid and
   billing-failure Bookings, the S5 Health NZ beat), so a regression names the beat it breaks. Never
   regenerate with `-u`. At the end the fixture is identical except the one listed exception (item
   8e), which the test asserts explicitly (that Procedure's B rises by exactly the override's
   difference and its fee by that many units at its rate; nothing else moves).

2. **Model** (`src/domain/types.ts`), for US-04.4.2, US-04.2.2 "Base units" and DM-43.
   - `ContractBaseUnits = RvgBaseUnits` (`{ kind: 'single'; units } | { kind: 'range'; min; max }`):
     one shape for the reference and the Contract.
   - `Contract` gains:
     - `defaultRvgFor?: { procedureTypeId: ProcedureTypeId; kindLabel?: string; kindOrder: 1 | 2 }`,
       which marks a default RVG Contract. Set means "a default RVG Contract of this procedure".
       `kindLabel` is required when a procedure has two (for example "Simple", "Complex") and
       optional when it has one;
     - `baseUnits?: ContractBaseUnits`, required when `defaultRvgFor` is set and refused otherwise (a
       store guard and a seed test): other Contracts change base units only through overrides;
     - `baseUnitOverrides: readonly ContractBaseUnitOverride[]`, **required**, usually empty, so the
       compiler finds every Contract literal (seed, `fixtures.ts` `mkContract`, the store's create
       paths). Always empty on a default RVG Contract.
   - `ContractBaseUnitOverride = { id; target: { kind: 'procedure'; procedureTypeId } | { kind: 'code'; code: string } | { kind: 'group'; group: RvgGroupRef }; baseUnits: number }`
     (`RvgGroupRef` from 19). The units are a single positive whole number, as Phase 23's plan had
     it. `allocateId` gains a `baseUnitOverride` kind.
   - **Category and holder of a default RVG Contract (a picked reading, OQ-78).** There is no
     seventh category (US-04.1.1). A default RVG Contract is category `rvgDefaultPostPaid`, holder
     `bookingBillableParty`, pricing basis `rvgUnitsAnaesthetistRate`, `isDefault: true` (protected),
     effective from 2020-01-01, organisational, `scope.procedureTypeIds = [its procedure]`. This is
     "normal RVG pricing, the payer named when picked" (US-04.3.3 note, D17), so Phase 20 can offer it
     and Phase 21 can ask for the payer's name and email without another shape. 18's single
     organisation-wide `CT-RVG-POSTPAID` stays as the fallback for a Procedure with no master
     procedure. Record the reading in the Decisions log and on the owner's review list.
   - `RvgTimeRule = { tiers: readonly { fromMinute: number; intervalMinutes: number }[]; partInterval: 'roundUp' }`
     (US-05.2.2 "defined as data"). `partInterval` is a one-value literal: OQ-75 says always, so it is
     recorded, not configurable. `SeedMasters` and `AppState['masters']` gain `rvgTimeRule`.
   - `auditNarrative.ts` and `fieldLabels.ts`: English for `defaultRvgFor` ("Default RVG Contract
     for {procedure}{, kind}"), `baseUnits` ("Base units 5" or "Base units 8 to 10"),
     `baseUnitOverrides` ("{procedure | RVG code | group}: {n} base units") and the time rule.

3. **Time units as data** (`domain/billing/timeUnits.ts`, US-05.2.2).
   - `DEFAULT_RVG_TIME_RULE = { tiers: [{ fromMinute: 0, intervalMinutes: 15 }, { fromMinute: 120, intervalMinutes: 10 }], partInterval: 'roundUp' }`.
     It survives only as the seed source and a test fixture; no runtime path reads it.
   - `timeUnitsFromMinutes(minutes, rule)` takes the rule as a **required** parameter: units are
     summed tier by tier, each tier's span divided by its interval and rounded up for a part
     interval, the last tier open-ended. Non-positive spans give 0. `timeUnits(start, end, rule)`
     follows.
   - `validateRvgTimeRule(rule)` (pure; tiers ascending, first at 0, positive whole intervals; each
     closed tier's span a whole multiple of its interval, which keeps the "first two hours is 8
     units" reading exact). The seed test runs it.
   - `describeTimeRule(rule)` gives the sentence the Admin panel and the T caption tooltip show: "1
     unit per 15 minutes or part for the first 2 hours, then 1 unit per 10 minutes or part. A part
     interval always rounds up." (built from the data, never typed twice).
   - Remove `PARTIAL_INTERVAL_ROUNDING`, the tier constants and the "ASSUMPTION ... AA must confirm"
     header; the new header cites US-05.2.2 and OQ-75 (answered).
   - `FeeContext` gains a required `timeRule`; every assembler listed in the Reference passes
     `masters.rvgTimeRule`. Phase 27's estimator calls the same function with the same rule.
   - Tests (`timeUnits.test.ts`): the two acceptance criteria (95 minutes is 7, 125 minutes is 9); 0,
     1, 15, 16, 120 (8) and 121 (9) minutes; a negative span; a test rule with different tiers changes
     the result (the rule is really read); `validateRvgTimeRule` refuses each malformed rule.

4. **Default RVG Contracts, the pure side** (new `src/domain/billing/defaultRvgContracts.ts`, exported
   from the billing index). This is the one place OQ-78's and OQ-88's readings live.
   - `isDefaultRvgContract(c)`: `c.defaultRvgFor !== undefined`.
   - `defaultRvgContractsFor(procedureTypeId, contracts)`: that procedure's one or two, by
     `kindOrder`, excluding retired ones.
   - `defaultRvgContractForProcedure(procedure, { contracts, masters, contract? })`, which picks the
     base-unit Contract behind a Procedure:
     1. the Procedure's own Contract (`contract`) when it is one of its procedure's default RVG
        Contracts (how Phase 20's pick of the "Complex" kind will apply);
     2. else the procedure's first default RVG Contract by `kindOrder` (a labelled interim for the
        per-kind pair until Phase 20's picker lets the kind be chosen);
     3. a Procedure with an RVG code and no `procedureTypeId` uses `soleProcedureTypeForCode`
        (19) and then steps 1 and 2; with no sole procedure it returns undefined.
   - `generateDefaultRvgContract(procedureType, { rvgCodes, aaCode, id, kind? })`, pure, used by the
     seed and by the store: copies the mapped code's reference figure exactly (single stays single,
     a range stays a range). A procedure mapped to a group with no code takes the group's members'
     lowest single reference value (or the member range's min to max), and if none has one, 1, with
     a test for each.
   - `standardBaseUnitsFor(procedure, ...)`: the figure `outsideGuide` compares against (item 6):
     the default RVG Contract's base units, else the RVG reference figure.
   - Tests: one per pick step; a retired default is skipped; the per-kind pair picks Simple first and
     the Procedure's own Contract when it is Complex; the sole-procedure rule for a code-only
     Procedure and undefined for a code with two procedures; the generator for single, range and
     group-mapped procedures.

5. **Seed: one default RVG Contract per procedure** (`seed/contracts.ts`, `seed/index.ts`).
   - In `buildSeed`, after 19's procedure master is built, generate one default RVG Contract per
     master procedure, in procedure order, **appended after every existing Contract** so no existing id
     or AA code moves. Ids are deterministic (`CT-RVGD-<procedureTypeId>`, a `-2` suffix for a second
     kind); AA codes come from 18's `nextAaCode('rvgDefaultPostPaid', ...)`, the only code maker, so
     they continue the RDP sequence. Pin the first few in `seed.test.ts`.
   - **One per-kind pair for demo.** On one master procedure that no seeded Procedure links to (the
     seed test proves it), preferably 19's AA dental procedure, replace its single default with two:
     "Simple" at its reference value and "Complex" at the reference plus 2 (demo-plausible, labelled
     in a code comment). Ranged codes 20880, 47522 and 51011 keep one Contract with a range, so the
     seed shows both of AA's options.
   - **45030's two lines** (19's "Skin flap repair, complex" and "Skin lesion excision, simple", two
     procedures sharing one RVG code): each gets its own single default, the simple line at the
     reference min (4) and the complex line at the max (6), as 19's handoff says (US-05.1.6: "the
     same RVG code can appear with different values"). 19 left every seeded 45030 Procedure unlinked,
     so they keep pricing from the RVG reference range with their chosen value (resolver step 5) and
     no figure moves; the seed test proves no seeded Procedure links to either line.
   - **FT-04.4 invariants** in `seed.test.ts`: every hospital has one protected RVG Default Hospital
     Contract; every direct-claims insurer has its protected default; every master procedure has one or
     two default RVG Contracts, two only with both kinds labelled; every default RVG Contract has
     `baseUnits`, scope exactly its own procedure, empty overrides and the category, holder and basis of
     item 2; no other Contract has `baseUnits`. The insurer default is effective from 2020-01-01 like
     the hospital defaults: if `setInsurerDirectClaims` still mints it effective from today (gaps.json
     US-04.4.1 verify note: a past-dated List billed to a newly enabled insurer would find no
     Contract), align it here, with a store test.
   - The parity fixture (item 1) must hold: each generated figure equals the reference figure that
     priced the Procedure before.

6. **The resolver reads the Contract** (19's `src/domain/billing/baseUnits.ts`, DM-43, US-04.4.2 AC2).
   - `resolveBaseUnits` takes `{ procedure, rvgCode?, procedureType?, contractBaseUnits?, defaultRvgContract? }`.
     The precedence after this phase:
     1. `baseUnitsCaptured.source === 'overridden'`, the manual override (`'captured'`);
     2. `contractBaseUnits`, the Procedure's Contract's override (`'contract'`, item 8);
     3. on a ranged figure, the chosen `baseUnitsSelected` (`'chosen'`, 19's name for it). The range
        is the default RVG Contract's, else the RVG reference's;
     4. the default RVG Contract's single value (`'defaultRvgContract'`);
     5. the RVG reference single value (`'rvgReference'`), only for a Procedure with a code that no
        default RVG Contract can be found for (an unlinked legacy Procedure). This keeps every
        legacy figure while making the reference a fallback, not a source;
     6. otherwise 0 with `'none'`.
     19's `source` union is `'captured' | 'chosen' | 'contract' | 'rvgReference' | 'none'`: add
     `'defaultRvgContract'`, and `'contract'` now means only a Contract override (19's slot fed both).
     19's `offered = contractBaseUnits ?? rvgCode.baseUnits` becomes the override, else the default
     RVG Contract's figure, else the reference. Grep every reader of `baseSource`.
   - `BtmBreakdown` gains `baseContractId?` (the Contract that supplied the figure: the override's
     Contract or the default RVG Contract) and `baseKindLabel?`, so the caption, Review and Phase 25's
     lock read one answer.
   - **The Procedure's Contract before Phase 20.** Every assembler already resolves a Contract for
     the fee (`resolveContractForProcedure`, the stored `governingContractId`, the hospital default).
     Pass that same Contract to `defaultRvgContractForProcedure` and to `contractBaseUnitsFor` (item
     8b). Do not add a second selection.
   - **`outsideGuide` compares against the standard figure.** `outsideGuide` (19) is true for the
     `'captured'` and `'chosen'` sources when the units differ from `standardBaseUnitsFor`'s single
     value or lie outside its range; false for `'contract'`, `'defaultRvgContract'` and
     `'rvgReference'`. The `baseUnitsOutsideGuide` rule (19, timing after, mild) keeps its id; its
     fact gains the Contracts it needs, and its text becomes "Base units {n} are outside the default
     RVG Contract for {procedure} ({min} to {max})." or "(standard value {v})." Seeded figures equal
     the reference, so no seeded warning appears or disappears; the pristine-seed test from 19 still
     asserts none. Log the comparison as a picked reading (D3 says "the code's published value or
     range"; the default Contract is AA's standard RVG figure).
   - 19's completion rule (a ranged code with no chosen value blocks) now asks of the figure in
     force: ranged on the default RVG Contract and no Contract override. A manual override still does
     not waive it.
   - **RVG values are reference only.** Grep `baseUnits.kind` and `rvgCode.baseUnits` afterwards:
     outside `baseUnits.ts`, `defaultRvgContracts.ts` (the generator and `standardBaseUnitsFor`) and
     display helpers (the masters tables, the "RVG reference: N" captions), nothing reads them.
   - **Keep default RVG Contracts out of today's selection.** `selectContract`,
     `resolveContractForProcedure` and `defaultContractFor` skip `isDefaultRvgContract` Contracts.
     Their `bookingBillableParty` holder would otherwise match billable-party-route Procedures and
     change the Contract shown. Phase 20 decides when to offer them. Test it.
   - Tests (extend `baseUnits.test.ts`, `fee.test.ts`, `invoiceBuild.test.ts`): each precedence step;
     a default RVG Contract edit changes a linked Procedure's base and nothing else; the reference
     never prices a linked Procedure, even when it differs from the Contract (US-04.4.2 AC2); the
     per-kind pair; the unlinked fallback; `outsideGuide` against an edited range (8 to 12: 11 is no
     longer outside); `selectContract` never returns a default RVG Contract.

7. **Store actions for default RVG Contracts** (in 19's `src/store/rvgMasterActions.ts`, office-only,
   audited, returning `Outcome`), for US-04.4.2 and US-05.1.6 AC1.
   - 19's `createProcedureType` creates the procedure's default RVG Contract **in the same commit**,
     from `generateDefaultRvgContract` (AA code from `nextAaCode`), so a saved procedure always has one
     (US-05.1.6 AC1). 19's Add AA code with "Also add to the master procedure list" gets one through it.
   - `editDefaultRvgBaseUnits(contractId, baseUnits)`: positive whole numbers, min under max for a
     range; refused on a Contract that is not a default RVG Contract (`notDefaultRvgContract`).
   - `addDefaultRvgKind(procedureTypeId, { firstKindLabel, kindLabel, baseUnits })`: turns one into
     two, labelling both. A third is refused (`defaultRvgTwoAtMost`: "A procedure has one or two default
     RVG Contracts."). `removeDefaultRvgKind(contractId)` deletes the second and clears the remaining
     one's label; removing the last is refused (`defaultRvgRequired`: "Every procedure keeps a default
     RVG Contract.").
   - 19's `deleteProcedureType` (already refused while Procedures link) deletes the procedure's
     default RVG Contracts in the same commit. 19's `editProcedureType` changing the mapped code
     leaves the Contracts' base units as they are (hand-maintained, US-04.4.2), and the sheet shows the
     new code's reference beside them.
   - 18's Contract edit and delete actions refuse a default RVG Contract's category, holder, basis,
     scope and delete (`defaultRvgManagedByProcedure`: "This default RVG Contract belongs to
     {procedure}. Change it from the procedure."). Its retire follows its procedure.
   - Before Phase 25's lock, an edit re-prices unlocked Procedures on DRAFT and SUBMITTED Bookings,
     and AUTHORISED invoices keep their snapshot amounts. Say so in a test.
   - Tests (extend `rvgMasterActions.test.ts`): each guard and audit entry; a new procedure has its
     default; one to two to one; the last cannot go; a procedure delete removes its defaults; editing
     a default changes a DRAFT Booking's fee and not a built invoice.

   **Stale rounding copy (also session 1).** `UnitsCard.tsx`'s T caption becomes "From start and
   finish stamps · RVG time tiers", with `describeTimeRule` as its title. Delete the Control Panel's
   "Billing assumption" callout (`DemoControlPanel.tsx` 209 to 231) and its `Info` import if unused.
   Grep `src/` for "assumption", "round up" and "rounds up" and update anything else that calls the
   rounding unsettled.

   **Session 1 ends here, green:** `npm run build`, `npm run build:pwa`, `npx vitest run`, and the
   parity fixture unchanged (no exception yet). Default RVG Contracts exist and price every linked
   Procedure; there is no editor yet.

8. **The Contract base-unit override** (US-04.2.2 "Base units", US-05.1.6 AC2).
   - a. Pure `contractBaseUnitsFor(contract, procedure, masters)` in `baseUnits.ts`. A procedure
     target (the Procedure's `procedureTypeId`) beats a code target, which beats an AA-group target,
     which beats a body-heading target (19's `groupsOfCode`). It returns `{ units, overrideId }` or
     undefined, and always undefined for a default RVG Contract.
   - b. Every assembler passes it as `contractBaseUnits` for the Procedure's Contract (item 6). Phase
     23's Booking-level engine reads the same function for the primary; nothing here changes how an
     additional Procedure is charged.
   - c. Store actions in `contractActions.ts`, office-only, audited:
     `addContractBaseUnitOverride(contractId, target, baseUnits)` (the target exists in the masters;
     units a positive whole number; a duplicate target is refused; two group overrides on one Contract
     that disagree for a shared code are refused with `overrideOverlap`, naming the code; refused on a
     default RVG Contract with `defaultRvgUseBaseUnits`: "Set this procedure's base units on its default
     RVG Contract."), `editContractBaseUnitOverride` and `removeContractBaseUnitOverride`. 19's
     `deleteProcedureType`, `deleteRvgCode` and `deleteRvgGroup` are refused while any override
     targets the item or any Contract scope names it (`inContractUse`, naming the Contract's AA code;
     19's handoff "adds the scope delete guards").
   - d. Tests: each precedence step of `contractBaseUnitsFor`; the override beats the default RVG
     Contract and the chosen ranged value; a manual capture beats it; it matches through a group;
     the guards; editing an override re-prices a DRAFT Booking and not a built invoice.
   - e. **The one deliberate figure change: a seeded override for demo.** On a non-default Contract
     (prefer Health NZ or St George's ACC), one procedure target at its default value plus 1, on a
     procedure that exactly one seeded Booking on that Contract uses. Choose a SUBMITTED Booking in
     the seeded Review queue whose patient the run sheet never names, and never an S3, S4 or S5
     Booking or one of the S5 Health NZ beat's Bookings (grep `docs/demo-guide/03-demo-script.md` for
     the patient). Pin it in `seed.test.ts`, name it in the parity test (item 1) and in PROGRESS, and
     give it a scenario marker in `seed/index.ts` for the recipes. Every other seeded Contract has
     `baseUnitOverrides: []`.

9. **Every Contract scoped to its master procedures** (US-04.2.1 procedures and RVG groups, for D16
   and US-04.3.2).
   - 0. **The scope model 19 left** (`types.ts`, new `src/domain/billing/contractProcedureScope.ts`).
     Retype 18's `scope.procedureTypeIds: string[]` to `ProcedureTypeId[]`. Add
     `scope.rvgGroups: RvgGroupRef[]` (19's ref: a body heading or an AA group), empty on every
     seeded Contract, and add it to 18's `SCOPE_NARROWING_DIMENSIONS`. Pure
     `scopeCoversProcedure(scope, procedure, masters)`, the one matcher Phase 20's filter calls: true
     when `procedureTypeIds`, `rvgCodes` and `rvgGroups` are all empty, or the Procedure's
     `procedureTypeId` is listed, or its `rvgBaseCode` is listed, or its code is in a listed group
     (19's `codesInGroup`). A Procedure with no master link and no code is covered only when all three
     are empty. Tests for each branch, including an unlinked Procedure with a code (covered by a code
     or group scope, not by a procedure scope).
   - a. Pure `procedureScopeFromLines(contractId, feeScheduleLines, masters)` (in
     `src/domain/billing/contractProcedureScope.ts`): the master procedures whose code is in the
     Contract's non-add-on lines' `mappedRvgCodes` (through `procedureTypesForCode`), in procedure
     order, deduplicated. Lines with no mapping add nothing. Tests: Doyle's bariatric lines give the
     bariatric procedures; an add-on line adds none; an unmapped line adds none.
   - b. **The seeded scopes** (`seed/contracts.ts`; 18 left every `procedureTypeIds` empty):
     - generated default RVG Contracts: exactly their own procedure (item 5);
     - fixed-schedule Contracts (Doyle bariatric, 18's CES Health NZ schedule): derived with
       `procedureScopeFromLines`;
     - rate-basis Contracts with no lines (SXAP, Health NZ, St George's ACC, COS ACC): set by hand in
       one `HAND_SET_PROCEDURE_SCOPE` table, written as procedure groups (19's body-part `group`)
       expanded to their procedures with 19's `procedureTypesByGroup` at seed build and stored as
       procedure ids (the field the editor shows). Demo-plausible readings, each commented: SXAP and Health NZ, every body heading their
       seeded Bookings use; St George's ACC and COS ACC, the orthopaedic, hand and urology
       headings;
     - protected defaults stay **procedure-unscoped, meaning every procedure**: each hospital's RVG
       Default Hospital, the nib insurer default and `CT-RVG-POSTPAID`. They are the fallback that
       closes any no-Contract path (FT-04.4); scoping them would reopen one. The editor shows "All
       procedures". Log the reading;
     - a Contract any of whose seeded Procedures has no master procedure (for example Aria's laser
       resurfacing, if 19 left it unlinked, or a 45030 Procedure) stays procedure-unscoped, logged,
       because `scopeCoversProcedure` (item 9.0) would otherwise exclude it. (Alternatively list the
       unlinked code in `scope.rvgCodes`; pick one and log it.)
   - c. **Seed tests** (`seed.test.ts`): every seeded Procedure's current Contract covers it under
     `scopeCoversProcedure`, so Phase 20's filter finds it; each scripted Booking S2 to S5 is pinned
     by name with its procedure and Contract; every Contract except the protected defaults and the
     logged unscoped ones has a non-empty procedure scope; every derived scope equals
     `procedureScopeFromLines`.
   - d. Store: 18's Contract edit action accepts `scope.procedureTypeIds` and `scope.rvgGroups`,
     checking each id or group exists, and refuses scope edits on a default RVG Contract (item 7). New
     `setContractProcedureScopeFromLines(contractId)`, audited, fills the scope from item 9a; refused
     with `noMappedLines` ("This Contract has no schedule lines mapped to RVG codes.") when it would be
     empty.

10. **Admin: default RVG Contracts under the procedure** (desktop; teal actions; existing table
    chrome). New `src/apps/admin/flows/DefaultRvgContractsSheet.tsx`, a new member of `MasterData`'s
    `Sheet` union.
    - a. **Contracts tab, "Default RVG Contracts" view.** 18's Contracts tab gains a segmented control
      "Contracts · Default RVG Contracts". The main list no longer shows default RVG Contracts
      (`isDefaultRvgContract`), so it reads as it did after 18. The new view lists procedures grouped
      by body part (19's `procedureTypesByGroup`), searchable by procedure name, RVG code, system code
      or AA code: each row shows the procedure, its mono RVG code, its Contract or Contracts ("RDP-0021
      · 5", "RDP-0024 · 8 to 10", or "Simple 4 · Complex 6" as two neutral kind pills) and "RVG
      reference" (mono) for comparison, with Edit. The header carries the phase's one provisional note
      as a `DemoBadge`: "Provisional · each procedure's default RVG Contract supplies base units behind
      every other Contract, including each hospital's RVG Default Hospital. How the two defaults relate
      is still to confirm with AA (OQ-78)." Caption under it: "If a procedure's base units keep being
      overridden, change its default RVG Contract here." `data-shot="contracts-default-rvg"`.
    - b. **`DefaultRvgContractsSheet`**, opened from that view and from 19's Master procedure list
      (a new "Default RVG Contract" column and the procedure sheet's link). For each of the one or two
      Contracts: AA code (mono, read-only), kind label (when two), base units as a "Single · Range"
      segmented control with steppers and a typed numeric input, and "RVG reference: N" beside it.
      Actions: Save (calls `editDefaultRvgBaseUnits`), "Add a second kind" (asks both labels and the
      value), "Remove this kind" (refusal sentences shown). Spreadsheet loading is Phase 42's: no
      import button. `data-shot="default-rvg-sheet"`.
    - c. **Master procedure list and RVG codes tabs (19's).** The RVG codes table's "Base units" column
      becomes "Reference base units", and its subheading reads "Reference only. Base units are set on
      each procedure's default RVG Contract." 19's NZSA read-only sentence ends "...on the procedure's
      default RVG Contract." The RVG codes tab gains a read-only "RVG time rule" panel showing
      `describeTimeRule(masters.rvgTimeRule)` (editing is Phase 42's).
      `data-shot="masters-rvg-time-rule"`.

11. **Admin: overrides and procedure scope in the Contract editor** (`ContractEditSheet`, 18's detail
    panel).
    - a. A **Base units** section on every Contract except a default RVG Contract: "Uses each
      procedure's default RVG Contract" when the list is empty, then one row per override (target as a
      neutral pill: procedure name, mono RVG code, or group; base units mono; "Default: N" beside, from
      `standardBaseUnitsFor`; Remove), and "Add override" (target segmented Procedure · RVG code · RVG
      group, a searchable select, a units stepper). Refusal sentences shown inline.
      `data-shot="contract-base-units"`.
    - b. A default RVG Contract opens read-only in the editor except for a "Base units" row and an
      "Edit on the procedure" link to item 10b, with the `defaultRvgManagedByProcedure` sentence as a
      caption.
    - c. The **Scope** section's Procedures field: a searchable multi-select (by procedure name, RVG
      code or system code, never a list of every procedure at once), chips for the chosen ones with a
      count, "All procedures" when empty, and, on a Contract with mapped schedule lines, "Set from
      schedule lines" (`setContractProcedureScopeFromLines`). Beside 18's RVG codes chips, an **RVG
      groups** chip field (body headings and AA groups, 19's `RvgGroupRef`; "Any" when empty). If 19
      built Procedures chips after all, replace them with this field. The catalogue's scope summary
      shows "{n} procedures" or "All procedures". `data-shot="contract-scope-procedures"`.
    - d. **No default RVG Contract in any Contract select.** `EditBillingSetupSheet`'s "Governing
      contract" select and 18's option lists filter `isDefaultRvgContract` out. Phase 20's picker
      decides how to offer the Procedure's own.

12. **Capture and Review show where base units came from** (shared: mobile, web, Admin Booking detail).
    - a. `UnitsCard`'s B caption from `baseSource`: "From the default RVG Contract" (with " · {kind}"
      for a per-kind pair), "Set by the Contract ({AA code})", "Chosen" and "Chosen, outside the
      standard range", "Set manually", and "From the RVG reference · choose the procedure" for the
      unlinked fallback. `ProcedureCodeCard`'s line becomes "Base 5 units · from the default RVG
      Contract" (or "· set by the Contract"). The 2026-09-28 ruling holds: the anaesthetist's
      Booking shows no fee.
    - b. 19's `RangeUnitsRow` reads its range from the default RVG Contract: 19's "Guide 8 to 10 · 11
      chosen" becomes "Standard 8 to 10 · 11 chosen", and its warn caption "Outside the guide range.
      The office will see a warning after the procedure." becomes "Outside the standard range. The
      office will see a warning after the procedure.", shown from `outsideGuide`.
    - c. Admin Review: the B · T · M cell carries a neutral "Contract" pill beside B when
      `baseSource === 'contract'`, with the AA code in its title, so the office sees an override at
      authorise. `reviewFlags.naturalBtm` passes the same Contract inputs (an override is not a manual
      override and raises no review flag). `data-shot="review-btm"` if not already present.
    - d. Copy sweep: grep `src/` for 19's base-unit wording ("From the RVG reference", "guide range",
      "Guide ", "RVG guide", "guide value", "From the Contract") and update each to the wording above;
      "RVG reference" survives only as the comparison label and the unlinked-fallback caption. Every new string
      follows the no en or em dash rule; ranges use "to".

13. **Warning sample.** 19's out-of-range sample in 15a's `WARNING_SAMPLES`
    (`src/store/warningSamples.ts`) sets a value above the guide's max; re-point it to
    `standardBaseUnitsFor` so it still lands outside after this phase. No new sample: this phase
    adds no warning rule.

14. **Playwright and green.**
    - Update `a7-04-masters` and any spec that reads the RVG codes tab, the Contracts table or the
      Control Panel callout (`demo-actions.spec.ts`), and `booking-calculation-display.spec.ts` if it
      reads the T or B caption.
    - Add specs for: the Default RVG Contracts view with search; editing 20950's default to 6 and
      seeing B 6 on a DRAFT Booking with "From the default RVG Contract" while the RVG codes tab still
      shows 5; adding and removing an override by RVG group on a DRAFT Booking's Contract; the seeded
      override Booking's B caption in capture and its pill in Review; the Procedures scope field with
      "Set from schedule lines" on the bariatric Contract.
    - Run `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots`. All green, and the
      parity fixture identical except item 8e's listed exception.

## Demo triggers

No new button. Everything is shown through normal use:

- **Admin Contract editor, Default RVG Contracts view:** editing a procedure's default RVG Contract
  base units changes the next capture of that procedure, while the RVG master's reference value stays
  (product, no new button).
- **Seeded Contract that overrides one procedure's base units** (item 8e): its Booking shows "Set by
  the Contract" in capture and the Contract pill in Review (no new button).
- **Admin Contract editor:** a seeded hospital Contract's scope lists the procedures its schedule
  lines map to, and "Set from schedule lines" fills one (product, no new button).
- 15a's shared "Raise sample warnings" keeps 19's out-of-range sample, re-pointed (item 13).

No Control Panel change beyond deleting the rounding callout. PWA: the B and T captions reach the PWA
through the shared capture components, and no mobile beat waits on the office or a backend event, so
no PWA stand-in is needed. Master and Contract edits are Admin-only; the PWA shows their effect when
the handset reloads its seed, like any other master.

## Out of scope

- The Contract picker filtered by procedure then hospital, the default RVG Contract always offered,
  choosing a per-kind default from the picker, and every route, payer and insurer change (Phase 20).
  This phase seeds the scopes, keeps default RVG Contracts out of today's selection and selects, and
  builds no picker.
- The payer's name and email on a default Contract (Phase 21). Booking-level pricing, the 3/2/2 split
  and combination Contracts (Phase 23, which reads `contractBaseUnitsFor`). The Contract defined unit
  rate and the anaesthetist adjustment (Phase 24, which closes US-04.2.2).
- Locking the base-unit source at AUTHORISED (Phase 25: it records `baseSource`, `baseContractId`, the
  override id and the units). The estimator and contingency units (Phase 27, which reads the resolver
  and `timeUnitsFromMinutes` with `masters.rvgTimeRule`).
- Spreadsheet import of default RVG Contracts and overrides, Vanessa's procedure list, and editing the
  time rule (Phase 42). Greg's "Contracts as children of a master code" (not adopted, US-04.4.2 note).
- Warning thresholds or settings (US-13.7.4, Future). Real NZSA or AA unit values: every figure stays
  demo-plausible and labelled.

## Manual test checklist

The agent runs every item itself in the running app and reports it with evidence; none is handed to
the owner (ROADMAP.md "Owner review: agents test themselves").

- [ ] Admin → Master data → Contracts: the main list reads as after Phase 18, with no default RVG
      Contracts in it. "Default RVG Contracts" lists every master procedure under its body heading;
      search "hip" narrows to the hip procedures; 47522 shows one Contract "8 to 10"; the per-kind
      procedure shows "Simple" and "Complex" pills; the OQ-78 badge shows here and nowhere else.
- [ ] Edit "Appendicectomy, laparoscopic" (20950) from 5 to 6: on a DRAFT Booking with 20950 (for
      example the Thu 23 Christchurch Public acute List), B shows 6 with "From the default RVG
      Contract", on web, mobile and the Admin Booking detail; the RVG codes tab still shows reference
      5; the audit viewer has the entry with before and after. Set it back to 5.
- [ ] "Add a second kind" on a procedure makes two labelled Contracts; a third is refused; removing
      one leaves one; the last cannot be removed. Each refusal shows its sentence.
- [ ] A new master procedure (19's sheet, or Add AA code with "Also add to the master procedure
      list") appears in the Default RVG Contracts view with its default pre-filled from the reference.
- [ ] The seeded override Booking (item 8e): capture shows "Set by the Contract ({AA code})", Review's
      B · T · M cell shows the Contract pill, and its fee matches the parity test's listed exception.
      Removing the override returns B to the default (then restore it).
- [ ] Add an override by RVG group on a Contract that a DRAFT Booking uses: that Booking's B changes;
      an overlapping group override is refused with the code named; remove it.
- [ ] Contracts: Doyle's bariatric Contract's scope lists the bariatric procedures; "Set from schedule
      lines" on the CES Health NZ schedule fills its cataract procedure(s); SXAP lists its hand-set
      procedures; each RVG Default Hospital reads "All procedures"; an RVG group chip can be added and
      removed; deleting a procedure or RVG group a Contract scope names is refused; a default RVG
      Contract's scope and delete are refused with "This default RVG Contract belongs to ...".
- [ ] The two 45030 procedures show single defaults 4 and 6 in the Default RVG Contracts view; a
      seeded 45030 Procedure still reads "From the RVG reference · choose the procedure" at its old
      figure.
- [ ] Office billing setup's "Governing contract" select lists no default RVG Contract.
- [ ] Time units: set a DRAFT Booking's times to 95 minutes (T 7) and 125 minutes (T 9). The T caption
      reads "From start and finish stamps · RVG time tiers" with the rule as its tooltip; the RVG codes
      tab shows the time rule panel; the Control Panel no longer shows the "Billing assumption"
      callout.
- [ ] Out of range: 47522 at 11 still raises the office warning; after editing 47522's default
      Contract to 8 to 12 and re-raising, 11 raises none; set it back. "Raise sample warnings" on Admin
      Day still stages 19's sample.
- [ ] S1 Beat 3 (Sarah Mitchell, 20950), S3's Ellison and Holt figures, S4 and S5 are unchanged, and the
      parity test is green with only the listed exception.
- [ ] PWA (5174): the B and T captions read as on mobile.
- [ ] No en or em dash in any new app copy (grep the diff). Actions are teal, pills neutral, and no
      crimson.
- [ ] Catalogue screenshots: the recipes for US-04.4.2, US-04.4.1 and US-05.2.2 are created or
      updated, every recipe this phase broke is re-pointed, a full `npm run capture` ends with no
      failed recipe and no story without a recipe, the covered items' new shots are checked by eye, and
      `npm run verify:board` is green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots` and `npm run verify:board`
      green.

## Demo guide updates

No scripted figure changes. Patch these sections, and the matching sections of
`master-demo-guide.html`, in the same session:

- `04-presenter-cheat-sheet.md`:
  - "Fee calculation" (as 19 left it): add "Base units come from each procedure's default RVG
    Contract, AA's standard RVG figure; any other Contract can override them for a procedure, RVG code
    or group. The RVG master is reference only." Replace "The RFP does not define partial-interval
    rounding; the prototype rounds up per started interval as a discovery assumption" with "A part
    interval always rounds up (confirmed with AA). The tiers are held as data."
  - "RFP ambiguities" item 10 ("Modifier values and time rounding"): drop "Partial time-interval
    rounding is a prototype assumption"; retitle it "Modifier values".
- `03-demo-script.md`:
  - S1's discovery point ("partial-interval time rounding is a prototype assumption..."): replace with
    "Time units follow the RVG tiers, a part interval always rounding up, as AA confirmed."
  - S5 "Worth pointing at" (19 added the master procedure list): add Admin → Master data → Contracts →
    Default RVG Contracts, the per-kind pair and the seeded override.
  - Confirm S3, S4 and S5 read unchanged.
- `master-demo-guide.html`: the S1 discovery callout (about line 859), the cheat-sheet rounding bullet
  (about 1026) and card 10 (about 1124), plus whatever 19 changed in the same places.
- Control Panel scenario text: none beyond the deleted callout. Grep `src/apps/demo` for "rounding" and
  "assumption" to confirm.

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19), run
after the review pass and before the PROGRESS.md entry. Re-run
`node docs/prototype-build/catch-up/tools/recipe-status.mjs 19a` first: earlier phases (18 and 19
especially) will have changed these recipes since this plan was written.

**Covered items.** FT-04.4 has stories, so its items are its stories. When the phase is done, each
recipe in `requirements-board/capture/recipes/` matches what was built:

| Item | Recipe at plan time | When this phase is done |
|---|---|---|
| [US-04.4.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.4.2.md) Default RVG Contract for every procedure | none | Create it, `captured`. Admin shots: `default-rvg-contracts` (Contracts → Default RVG Contracts, `contracts-default-rvg`: a ranged and a single procedure and the per-kind pair, the OQ-78 badge; highlight the Contracts column) with a `search` state ("hip"), and `edit` with `DefaultRvgContractsSheet` open on 20950 (`default-rvg-sheet`, "RVG reference: 5" beside the value). Add a web and a mobile `base-source` shot on a DRAFT Booking with 20950 (B row "From the default RVG Contract", `units-row-b`). Captions in the catalogue's words: "Each procedure's default RVG Contract holds its base units" |
| [US-04.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.4.1.md) Mandatory default Contract | captured · admin-add-hospital[added, contracts] | Stays `captured`. Re-run: the `contracts` state's highlight `tr:has-text("Ashburton Surgical")` must still find the new hospital default in the main list (default RVG Contracts are no longer there, which only shortens it). Re-caption with 18's category name if 18 did not |
| [US-05.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.2.2.md) Tiered time units | captured · web-time-units, mobile-time-units | Stays `captured`. Re-shoot both on `BK0001` with the new T caption ("From start and finish stamps · RVG time tiers"). Add an admin `time-rule` shot on the RVG codes tab (`masters-rvg-time-rule`), caption "Time tiers held as data: a part interval always rounds up" |

**Recipes this phase breaks.**
- `US-05.1.6` (19 left it `partial`, its reason naming the default RVG Contracts or the override):
  add an admin `default-rvg` state from the Master procedure list's new column into
  `DefaultRvgContractsSheet`, and a `contract-override` state on the item 8e Contract; turn it
  `captured` unless 19 left another gap, and say which.
- `US-04.2.2` (`pricing-basis` states `type-1` to `rate-time`, re-shot by 18 and 24's to-do): add a
  `base-unit-override` state with the Base units section open on the item 8e Contract
  (`contract-base-units`). It stays `partial` with "The Contract defined unit rate and the
  anaesthetist adjustment rule are built in Phase 24."
- `US-04.2.1` (18 left it `partial`, "The procedures filter is filled by Phase 19a and narrows the
  picker in Phase 20."): re-shoot `contract-holder` with the Procedures field and RVG group chips
  (`contract-scope-procedures`, the bariatric Contract) and reword the reason to "The scope narrowing
  the Contract picker is built in Phase 20."
- `US-05.1.1` (`rvg-codes`): the column is now "Reference base units" and the subheading changed;
  re-caption "RVG codes as reference data" and keep the highlight.
- `US-03.3.1` (19 left it `partial`, "...picking a Contract after it, which seeds the base units, is
  built in Phases 19a and 20"; its `closed` state reads "Base N units"): re-shoot `closed` with "Base N
  units · from the default RVG Contract"; its `ranged` and `outside-guide` states now read "Standard 8
  to 10" and "Outside the standard range"; reword the reason to "...is built in Phase 20." Phase 20
  turns it `captured`.
- `US-04.1.2`, `US-04.1.1`, `US-04.3.2` and any recipe that counts rows in or clicks through the Contracts
  table: the main list no longer holds default RVG Contracts and the tab gains a segmented control.
  Check their selectors with `--dry`.
- `US-05.3.1`, `US-05.3.2` and `US-03.5.2` read `units-row-b` or `units-row-t`; the captions changed but
  the hooks did not, so `--dry` should pass. Look at their shots.

**ATLAS.md.** Existing hooks (`contracts-default-rvg`, `default-rvg-sheet`, `contract-base-units`,
`contract-scope-procedures`, `masters-rvg-time-rule`, `review-btm` if added), Overlays (the Default RVG
Contracts sheet and the segmented Contracts tab), Seed data worth shooting (the per-kind procedure, the
item 8e override Booking and its scenario marker, the default RVG Contract AA codes), and the Demo
control panel section (the rounding callout is gone). Routes are unchanged.

## Adversarial review (after build)

After the manual test checklist and the four commands are green, and before writing the PROGRESS
entry, run the standard **adversarial review-and-fix pass (PROGRESS convention 18)**. Fan out about
three independent Opus review subagents, one each for **quality**, **bugs/correctness** and **plan
adherence**, and a fourth on **billing maths**, because every fee path reads base and time units. This
session then independently verifies every finding against the catalogue files, this doc and the code,
fixes the confirmed ones (with a test for each bug), re-greens, and records the pass. Do not re-raise
anything settled in the Decisions log.

**Steer this phase's reviewers at:**

- **No figure moved but one.** The parity fixture is identical except item 8e's single listed
  Procedure, whose change is exactly the override's units times its rate. The named S2 to S5 cases are
  green. Every generated default equals the reference figure that priced its Procedures before.
- **One base-unit answer.** Only `baseUnits.ts` decides base units and `outsideGuide`, with this
  precedence: manual, Contract override, chosen ranged value, default RVG Contract, RVG reference
  (unlinked fallback only). Every assembler (`feeContextFor`, `procedureFee`, `invoiceBuild`,
  `seed/billing.ts`, `naturalBtm`, the warning rule, each `feeFor(` caller) passes the same Contract,
  default RVG Contract and time rule. The RVG reference never prices a linked Procedure. No second
  Contract selection was written.
- **Default RVG Contracts stay out of the way.** `selectContract`, `resolveContractForProcedure`,
  `defaultContractFor`, the governing-contract select and the main Contract list never show or pick
  one. They are protected, scoped to exactly their procedure, carry `baseUnits` and no overrides, and
  are managed only from the procedure. Every procedure has one or two; creating a procedure creates one
  in the same commit; the last cannot be removed.
- **Overrides.** Procedure beats code beats AA group beats body heading; overlapping group overrides
  are refused; a default RVG Contract cannot carry one; deletes of a target in use are refused; each
  write is audited.
- **Procedure scope.** `scopeCoversProcedure` is the one matcher (procedure, code or group; all
  empty covers everything) and Phase 20 needs no second one. Every seeded Procedure's Contract covers
  it, and the scripted Bookings are pinned. Derived scopes equal `procedureScopeFromLines`; hand-set scopes are
  stored as procedure ids; the protected defaults are "All procedures" by design, not by omission.
- **Time rule as data.** No runtime path reads `DEFAULT_RVG_TIME_RULE` or a tier constant; 95 minutes is
  7 and 125 is 9; a changed test rule changes the result; no copy still calls the rounding an
  assumption (app, Control Panel, demo guide, code comments).
- **One OQ-78 label**, on the Default RVG Contracts view only. D12 and D25 carry no label.
- **No gold-plating.** No picker, no payer capture, no Booking-level engine, no lock, no estimator,
  no spreadsheet import, no time-rule editor, no seventh category. Plus the usual: teal-only actions,
  no dashes in copy, sheets not modals on mobile, `pwaPurity` green, `PERSIST_VERSION` bumped once,
  no new RNG draws.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry; ROADMAP.md "Owner review: agents test
  themselves"): the defaults built for open questions (OQ-78: both defaults kept, the procedure's
  behind the hospital's; OQ-88: defaults keyed by the procedure master line), the picked readings
  (default RVG Contracts as protected RVG Default Post-paid Contracts held by the Booking's billable
  party; the first kind used until Phase 20's picker; `outsideGuide` against the default Contract's
  figure; protected defaults left "All procedures"; the hand-set procedure scopes on the rate
  Contracts; 45030's two lines at 4 and 6; the insurer default's effective date if aligned; the one
  seeded override and its figure change), and the screens worth a look: Admin →
  Master data → Contracts → Default RVG Contracts, a Contract's Base units and Scope sections, and the
  override Booking in Review (office persona).
- **Catalogue screenshots result:** the recipe created (US-04.4.2) and changed (US-05.2.2, US-04.4.1,
  and the broken ones such as US-05.1.6, US-04.2.2, US-04.2.1, US-05.1.1 and US-03.3.1), the
  `requirements-board/capture/REPORT.md` counts (captured, partial, absent, failed) before and after,
  and the partial reasons handed on: US-04.2.2 to Phase 24 and US-04.2.1 to Phase 20.
- Status row for catch-up Phase 19a, and a phase entry: what was built, the parity result with the
  listed exception, the review pass (findings confirmed and fixed, anything not treated as a defect
  and why), tests added, and the `PERSIST_VERSION` bump.
- **Decisions log:**
  1. Base units live in each procedure's one or two default RVG Contracts (D12, OQ-62 answered), with
     the resolver precedence above; the RVG master is reference only. This supersedes 19's interim
     source (the RVG reference through the resolver) and the Phase 04 reading that base units come
     from the code.
  2. A default RVG Contract is a protected `rvgDefaultPostPaid` Contract held by the Booking's billable
     party, scoped to its procedure, marked `defaultRvgFor`, managed from the procedure, kept out of
     today's selection; provisional beside the hospital default (OQ-78).
  3. The Contract base-unit override (procedure, code, AA group, body heading) is built here, not in
     Phase 23.
  4. Partial time intervals always round up, under tiers held as data (D25, OQ-75 answered). This
     supersedes the 2026-07-22 "Time-unit partial-interval rounding ... a named ASSUMPTION" entry and
     the Control Panel callout it required.
  5. Contract procedure scope is seeded: derived from schedule lines, hand-set on rate Contracts,
     "All procedures" on protected defaults. Scope gains RVG groups, and `scopeCoversProcedure`
     matches procedure, code or group (all empty covers every procedure).
  6. 45030's two procedure lines take single defaults at the reference min and max (4 and 6), so the
     seed shows two procedures sharing one RVG code with different values; their seeded Procedures
     stay unlinked and price from the reference.
- **Handoff list:**
  - 20 offers the procedure's default RVG Contract or Contracts in its picker (`defaultRvgContractsFor`,
    letting the kind be chosen), filters by the seeded scopes through `scopeCoversProcedure` and
    `scope.rvgGroups` (built here, not in 19 as 20's doc says), and decides how the hospital default
    and the procedure default sit together under OQ-78.
  - 21 asks for the payer's name and email when a default RVG Contract is picked.
  - 23's Booking-level engine reads `contractBaseUnitsFor` on the primary; it builds no override.
  - 25 locks `baseSource`, `baseContractId`, the override id and the units used.
  - 27's estimator uses the resolver and `timeUnitsFromMinutes(minutes, masters.rvgTimeRule)`.
  - 42 loads default RVG Contracts and overrides from spreadsheets (Vanessa's list) through this
    phase's store guards, and makes the time rule editable.
