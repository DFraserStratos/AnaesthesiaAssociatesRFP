# Phase 19a · Contract lines and starting values

**Requirements covered:**
[FT-04.2](../../../../requirements-board/requirements/stories/FT-04.2.md) Contract definition (status 3; graded Contradicts: a header and standalone lines, which may be none) ·
[US-04.2.4](../../../../requirements-board/requirements/stories/US-04.2.4.md) Contract lines (status 4; graded Contradicts) ·
[US-04.2.11](../../../../requirements-board/requirements/stories/US-04.2.11.md) Combinations as Contract lines (status 4; graded Contradicts; joined from Phase 23 on 2026-10-20) ·
[US-04.2.14](../../../../requirements-board/requirements/stories/US-04.2.14.md) Anaesthetist's own price list Contracts (status 4; graded Contradicts) ·
[US-05.2.2](../../../../requirements-board/requirements/stories/US-05.2.2.md) Tiered time units (status 4; graded Partial) ·
[DM-09](../analysis/domain-model-delta.md#dm-09) the standalone Contract line, with a system line key, replaces ContractPrice ·
[DM-43](../analysis/domain-model-delta.md#dm-43) starting values come from the line, else the RVG row, and become the Procedure's own ·
[RV-07](../analysis/reverse-check.md#rv-07-second-procedure-pricing-keyed-on-the-procedure-ordinal) second-procedure pricing keyed on the procedure ordinal goes (joined 2026-10-20).
(RV-34 left this list: the 2026-10-20 renumbering gave its old finding, the ordinal key, the id RV-07,
and RV-34 now names the dashboard panels, which are Phase 38's.)
Carried across without regression, each with a parity test (work item 1):
[US-05.2.6](../../../../requirements-board/requirements/stories/US-05.2.6.md) fixed rate (today Type 2's
`agreedUnitRate`), [US-05.2.5](../../../../requirements-board/requirements/stories/US-05.2.5.md) the
fixed price as the whole price, [US-05.2.1](../../../../requirements-board/requirements/stories/US-05.2.1.md)
and [US-05.2.7](../../../../requirements-board/requirements/stories/US-05.2.7.md) (prices ex GST, GST at
the invoice foot).
Answered and built as answered (no label): D32
([OQ-98](../../../../requirements-board/requirements/questions/OQ-98.md): a Contract may hold no lines and
then prices at RVG), D40 ([OQ-89](../../../../requirements-board/requirements/questions/OQ-89.md): no time
band, add-on flag or quantity rule on a line), D42 and D64
([OQ-91](../../../../requirements-board/requirements/questions/OQ-91.md): the office creates and keeps the
anaesthetists' price lists, flagged prepaid where wanted; prepaid is 18's Contract setting), D25
([OQ-75](../../../../requirements-board/requirements/questions/OQ-75.md): a part interval always rounds
up), D45 ([OQ-48](../../../../requirements-board/requirements/questions/OQ-48.md): the version in force on
the procedure date), OQ-90 (no Contract prices a second procedure; RV-07) and OQ-53 (a combination is a
line of its own).
Open, built as their defaults: D49
([OQ-106](../../../../requirements-board/requirements/questions/OQ-106.md): No contract (RVG) has no lines;
the phase's one provisional label) and D48
([OQ-105](../../../../requirements-board/requirements/questions/OQ-105.md): a surgeon's fixed prices are a
Contract held by the surgeon's rooms; labelled where 18 and 20 show it, not here).

**Re-planned 2026-10-20 (catalogue `d4db277`).** Lines stand alone: no procedure link (there is no
procedure list, OQ-88, D39), no nesting, several may share a default RVG code. The 2026-10-08 plan's
"one line per procedure", the line, procedure and group resolver with layers, the first-party wording
and the plain-RVG provisional badge are superseded. Starting values are filled onto the Procedure
with no layer recorded (DM-43). The file keeps its historical slug (`default-rvg-contracts`), pinned
by the plan tools.

**Depends on:** Phase 18 (holders with "is billed", billable party and practitioner link; Contracts
as dated versions with the editable and prepaid settings (D50, D64), the AA code, composite search,
holder filter, office-only guards, the started-version freeze `termsLocked` and New version; No
contract (RVG); the ex-default plain RVG Contracts; the Souter holder with no Contract yet; Doyle's
two versions; **the Type 2 rate terms and the `ContractPrice` rows kept in place as interim terms**;
the fee parity harness) and Phase 19 (RVG rows as the one master list with a hidden key, base and
modifier units, a starting figure and range; the optional RVG code on a Procedure by type-ahead; any
base-unit value accepted with the out-of-range office warning). Through them: 17 (rooms), 15a (the
warning routine) and the built 14 and 15.
**Estimated:** 2 sessions. Session 1: work items 1 to 6 (parity first, the line type, the seeded
terms moved onto lines with the ordinal rows dropped, starting values on the Procedure, the fee path
re-expressed), ending green. Session 2: work items 7 to 12 (store actions, the price lists and the
Merivale combinations, the editor's header and lines grid, captions, the time tiers as data,
Playwright, demo guide) and the review pass. If session 2 runs long, cut "Set for all lines" (item
9e) last of all, and the Review fee wording (item 10c) first.

**Confirm before building.** Build the catalogue as it stands at `d4db277`. The line's default RVG
code is "agreed in principle; Ben has not yet been asked": build it, unlabelled, and put it on the
owner-review list. AR-29 and AR-30 (technical design v6, overwritten in place; the v4 regions are
gone) are Greg's proposal: field names for orientation, the catalogue wins. Keep the line type, its
validation, the starting values and the fee path in **one place** in `aa-prototype/src/domain/billing`
(plus the seed), behind types the UI reads.

## Goal

Replace the Contract-wide terms and the price rows with the catalogue's **standalone Contract lines**,
fill each Procedure's **starting values** from its line or RVG row, seed the **Merivale combination
lines** and **Dr Souter's prepaid price list**, and make the **RVG time tiers data**, with every
scripted figure unchanged.

- **Contract lines** (DM-09, FT-04.2, US-04.2.4;
  [AR-29#contract-line-fields](../../../../requirements-board/requirements/artifacts/AR-29.md),
  [#line-identity](../../../../requirements-board/requirements/artifacts/AR-29.md),
  [#null-handling](../../../../requirements-board/requirements/artifacts/AR-29.md),
  [AR-30#contract-line](../../../../requirements-board/requirements/artifacts/AR-30.md)). A Contract
  version holds zero or more lines. A line carries a **system line key** (never reused, kept when New
  version copies the line), an optional **holder reference code** (unique within the Contract,
  searchable), a **description** (it will start the Procedure's invoice description, Phase 20a), an
  optional **default RVG code** (fills the Procedure's RVG code; finds the line in a search by RVG
  code), and any of a **price** (ex GST), a **rate**, a **discount**, **base units** and **modifier
  units**. Blank means not set; 0 is a value. No procedure link, nesting, time band, add-on flag,
  quantity rule, price tier or line dates.
- **The interim terms move onto lines.** Doyle's priced rows and every Type 2 rate become lines with
  the same figure. The ordinal rows (CP-BAR-3 and its twin on the upcoming version) are **dropped**
  (RV-07, OQ-90): the hernia repair is priced at RVG under today's additional-procedure rule until
  Phase 23. That one seeded figure moves and is asserted by its exact difference. Any surgeon-keyed
  row (none is seeded) would become a Contract held by the surgeon's rooms (D48).
- **Starting values** (DM-43, US-03.3.1, [AR-29#resolver](../../../../requirements-board/requirements/artifacts/AR-29.md),
  [AR-01#starting-values](../../../../requirements-board/requirements/artifacts/AR-01.md),
  [#contract-reset](../../../../requirements-board/requirements/artifacts/AR-01.md)). Setting the
  Contract (and line) and the RVG code fills the Procedure's own values: base units from the line
  where it states them, else the RVG row; modifier units from the line, else the row (0); price, rate
  and discount from the line. They are then the Procedure's values, with no source recorded; a
  Contract or line change resets them all; an RVG code change refills units only. Phase 20's picker
  chooses the line; until then one interim rule picks it (item 4).
- **The fee path** reads the Procedure's values with today's arithmetic: its price; else BTM x (its
  rate, else the anaesthetist's unit value) x (1 - discount), rounded once. Parity holds every S1 to
  S5 figure.
- **Combinations are lines** (US-04.2.11, OQ-53): Merivale Plastic Surgery's Contract with Face lift
  $3,565, Facelift plus 1 add on $3,910 and plus 2 add ons $4,255, each with default RVG code H3, each
  priced as one line.
- **The anaesthetists' price-list Contracts** (US-04.2.14, D42, D64;
  [AR-28#typical-arrangements](../../../../requirements-board/requirements/artifacts/AR-28.md),
  [#prepayment](../../../../requirements-board/requirements/artifacts/AR-28.md)): held by a holder
  linked to the anaesthetist, holder not billed, created and kept by the office, flagged prepaid
  where wanted, editable as AA sets. Dr Souter's list is seeded, flagged prepaid, so Phase 27 has
  prepaid amounts.
- **No contract (RVG) has no lines** (D49, provisional); a holder's plain RVG Contract has none
  either (D32, answered, no label).
- **Tiered time units become data** (US-05.2.2, D25): the tiers are seeded data, the stale
  "assumption" copy goes.
- **The Admin Contract editor gets a header and lines grid**, read-only on a started version (18's
  freeze; Phase 25 adds staging).

No figure in the S1 to S5 run sheet moves. The only seeded figure expected to move is the bariatric
hernia Procedure (item 1).

## Before you start: drift check

1. Run `node requirements-board/agent/skills/update-build-plan/tools/plan-state.mjs --diff <IDs>` (baseline `d4db277`) for
   FT-04.2, US-04.2.4, US-04.2.11, US-04.2.14, US-05.2.2, US-04.2.2, US-04.2.10, US-04.3.2, US-03.3.1,
   US-05.1.1, US-05.2.1, US-05.2.5, US-05.2.6, US-05.2.7, US-05.4.3, US-08.4.6, FT-06.2, OQ-48, OQ-53,
   OQ-75, OQ-89, OQ-90, OQ-91, OQ-96, OQ-98, OQ-101, OQ-103, OQ-105, OQ-106 and OQ-107. Re-read
   domain-model.md's Procedure and Contract sections (the Contract line table, "Procedure billing
   context", "Selection") and section 3's starting-values block. If an item changed, re-read it whole
   and adjust; if one is now Retired or Future, drop its work and say so in PROGRESS. If AR-29 or AR-30
   changed, follow it inside the same one place and log it.
2. Confirm the gates.

| Gate | Build | If answered differently |
|---|---|---|
| **D32 / OQ-98** (answered) | A Contract may have no lines; it prices at RVG. No label | Not expected |
| **D40 / OQ-89** (answered) | No time band, add-on flag or quantity rule on a line | Not expected |
| **D42, D64 / OQ-91** (answered) | The office keeps price lists; prepaid is 18's Contract setting; no anaesthetist write path | Not expected |
| **D25 / OQ-75** (answered) | Part intervals round up; tiers as data; recorded time only | A data change in the seeded rule only |
| **D45 / OQ-48** (answered) | The version in force on the procedure date | Not expected |
| **D49 / OQ-106** (open) | No contract (RVG) has no lines; "Provisional" on its Lines note only | Allow lines on it: lift one refusal |
| **D48 / OQ-105** (open) | Surgeon prices sit on a rooms-held Contract (Merivale's); no surgeon-keyed line | Seed and holder only; the line type is unchanged |
| **D35 / OQ-101** (open, 19's) | Read 19's starting figure and range; a line's base units are one number | A ranged line widens one field here |
| Default RVG code (Ben not yet asked) | Built, optional, unlabelled | Remove one field; the interim pick then uses the general line only |

3. Read what Phases 18 and 19 built (their PROGRESS entries) and follow their names: 18's Contract,
   holder and version types, the settings (`editable`, `prepaid` or 18's names), `termsLocked` and its
   sentence, where the interim terms sit (`interimTerms`, `interimTermsOf`, `type2Detail`,
   `ContractPrice`), the Souter holder, the plain RVG Contracts, Doyle's versions and their row ids,
   `contractMatchesQuery`, the parity harness; 19's RVG row type and key, the Procedure's RVG code
   field, how base units are held today (stored or derived with an override flag), the out-of-range
   rule and its warning sample, and the type-ahead component.
4. Record `PERSIST_VERSION`.

## Reference

**Design (convention 17).** No mockup covers Contract editing: extend the Admin Review page's table
anatomy (`docs/design/Admin Review.dc.html`) and the editor as 18 left it. Captions stay on
`Mobile App.dc.html` screen 3 and its web twin. Teal is the only action colour; the provisional badge
and pills are neutral.

**Catalogue.** The files above, plus [US-04.2.2](../../../../requirements-board/requirements/stories/US-04.2.2.md)
(terms; 24), [US-04.2.10](../../../../requirements-board/requirements/stories/US-04.2.10.md) (versions;
25), [US-04.3.2](../../../../requirements-board/requirements/stories/US-04.3.2.md) (the picker; 20),
[US-08.4.6](../../../../requirements-board/requirements/stories/US-08.4.6.md) (invoice description;
20a), [FT-06.2](../../../../requirements-board/requirements/stories/FT-06.2.md) (prepayment; 27).

**Artifacts (link, never edit).** AR-29 (v6): `#contract-line-fields`, `#line-identity`,
`#null-handling`, `#resolver`, `#contract-fields`, `#contract-behaviour`, `#contract-versions`. AR-30:
`#contract-line`, `#contract`, `#rvg-group`. AR-28: `#typical-arrangements`, `#prepayment`. AR-01:
`#starting-values`, `#contract-reset`. AR-02: `#anaesthetist-price-list`, `#surgeon-arrangement`.
AR-16: `#time-units`.

**Analysis.** `../analysis/domain-model-delta.md` `#dm-09`, `#dm-43`; `../analysis/reverse-check.md`
RV-07; `../epics/EP-04.md` and `EP-05.md` for the covered rows; `prototype-map-domain.md`,
`prototype-map-shared.md`, `prototype-map-admin.md` section 9, `prototype-map-store-seed.md`.

**Code entry points (at `60e2d1e`, before 18 and 19; follow what they left).** `domain/types.ts`
(`ContractType2Detail`, `Contract.type2Detail`, `ContractPrice` with `rvgBaseCode`, `surgeonId`,
`procedureOrdinal`; `Procedure.baseUnitsSelected`, `baseUnitsCaptured`, `governingContractId`);
`domain/billing/contracts.ts` (`matchContractPrice`, `selectContract`); `fee.ts` (`FeeContext`, `feeFor`
Type 2 branch and Type 3 match with the additional-procedure discard, `resolveBtm`); `timeUnits.ts`;
every reader of `contractPrices`, `type2Detail`, `procedureOrdinal`, `matchContractPrice`
(`validateBookingForBilling.ts`, `invoiceBuild.ts`, `shared/capture/feeContext.ts`,
`BookingDetailBody.tsx`, `store/selectors.ts`, `store/contractActions.ts`, `shared/audit/fieldLabels.ts`,
`seed/billing.ts`, `seed/contracts.ts`, `ContractEditSheet.tsx` `PriceRows`, `apps/admin/reviewFlags.ts`,
`billingLineActions.ts`); `seed/bookings.ts` (the bariatric Booking about 685; Souter's Riley and Nair
rhinoplasty Bookings); `UnitsCard.tsx` (the "(assumption)" T caption); `DemoControlPanel.tsx` (the
"Billing assumption" callout).

## Work items

Model, domain and seed first, then store, then UI. Every write goes through `mutate()` with an audit
meta. Every rule is a pure function in `src/domain/billing/` with a Vitest test. No new seed data draws
from the seeded RNG. One `PERSIST_VERSION` bump.

**Session 1: lines, the terms moved onto them, starting values and the fee path.**

1. **Parity first (before any edit).** Add `phase-19a-baseline.json` to `domain/billing/__parity__/`
   from the untouched code: every seeded Procedure's fee total, B, T and M, charge lines, and every
   seeded invoice total. Named cases: each scripted Booking S1 to S5; a Southern Cross Booking at
   $26.50 a unit and a Health NZ one at $23 (US-05.2.6); the COS ACC $24 and St George's ACC $25
   Bookings; the bariatric primary at $2,800 and GST on it (US-05.2.5, US-05.2.7); a No contract (RVG)
   Booking (US-05.2.1). Never regenerate with `-u`. At the end only the bariatric hernia Procedure (and
   its invoice) differs, asserted by its exact difference and listed in PROGRESS.

2. **The line type and pure helpers** (new `src/domain/billing/contractLines.ts`; type re-exported
   through `types.ts`).
   - `ContractLine = { id; lineKey; contractId; referenceCode: string | null; description: string;
     defaultRvgKey: string | null; price: number | null; rate: number | null; discountPercent: number |
     null; baseUnits: number | null; modifierUnits: number | null }`. `contractId` is the version row;
     `defaultRvgKey` is 19's hidden RVG row key (shown as its code). Every nullable field is required,
     so the compiler finds every literal. `allocateId` gains `contractLine` (`CLN###`) and `lineKey`
     (`LK####`, monotonic, never reused).
   - `masters.contractLines` replaces the price-row collection. Remove `ContractPrice`,
     `matchContractPrice`, the Contract-level rate and discount (`type2Detail` or 18's name), 18's
     `interimTerms` and `interimTermsOf`, and every `procedureOrdinal` and price-row `surgeonId`.
     `permitsRateTime` stays for Phase 24.
   - Helpers, each tested: `linesOf(contractId, lines)`; `linesWithRvgCode(contractId, rvgKey, lines)`
     (Phase 20's reverse lookup); `validateContractLine(line, { lines, rvgRows })` with typed refusals
     (reference code unique within the version, `referenceCodeTaken`; description required; default
     RVG code exists; price and rate ≥ 0; discount 0 to 100; units whole ≥ 0; a line with a price sets
     no rate or discount, `priceExcludesRateAndDiscount`, a picked reading); `lineSearchText(line,
     rvgRows)` (reference code, description, default RVG code), added to 18's `contractMatchesQuery`;
     `setTermOnLines(lines, 'rate' | 'discountPercent', value)` (every line with no price; counts
     changed and skipped).
   - Audit copy in English ("Face lift: price $3,565.00", "rate $26.50 a unit", "discount 10%", "base
     units 10", "not set").

3. **Move the seeded terms onto lines** (`seed/contracts.ts` or a new `seed/contractLines.ts`; ids
   `CL-<contract>-<n>`, keys fixed in the seed).
   - **Doyle:** on both versions, the 20880 and 20882 rows become lines with a description, default
     RVG code and price ($2,800 and $2,400; the upcoming version's gastric bypass $2,950), the same
     line keys on both. The ordinal rows are dropped (RV-07).
   - **Rates:** each rate Contract (SXAP $26.50, Health NZ $23, St George's ACC $25, COS ACC $24, Aria
     $26.50) gets one general line with no default RVG code carrying the rate, plus, on SXAP and Health
     NZ, two or three demo-plausible coded lines (`AP0126`-style, a Health NZ code) with a default RVG
     code and the same rate, from one commented table. Demo values, labelled.
   - **Plain RVG Contracts** (18's ex-defaults) keep no lines. No contract (RVG) has none.
   - **Versions:** 18's New version copies the lines with new ids and the **same line keys**; a test
     proves an edit on the new version leaves the old line untouched.
   - Seed tests: line keys unique per version and shared across a copy; reference codes unique per
     version; no line on No contract (RVG); every seeded Procedure on a rate Contract gets a line with
     its old rate through item 4's pick.

4. **Starting values on the Procedure** (DM-43; new `startingValues.ts` beside the lines).
   - Procedure fields: `contractLineId: string | null`, and the Procedure's own `price`, `rate`,
     `discountPercent` (nullable). Base and modifier units are held on the Procedure as 19 left them;
     if 19 still derives base units at price time with an override flag, store them here instead. Phase
     24 makes these values editable and adds the editable flag; this phase only fills them.
   - `startingValuesFor({ line, rvgRow })`: base units from the line where set, else the row's starting
     figure; modifier units from the line where set, else the row's (0); price, rate, discount from the
     line, else null. No layer is returned or stored.
   - `interimLineFor(version, rvgKey, lines)`: **until Phase 20's picker**, the one line whose default
     RVG code is the Procedure's, else the version's one line with no default RVG code, else none. One
     function, commented as interim, deleted by 20.
   - `fillStartingValues` (store helper, also run by the seed): when a Procedure's Contract is set or
     changed (today's selection or 18's edit sheet) it re-picks the line and resets every value; when
     its RVG code changes on the same line it refills units only. The version is the one in force on
     the procedure date (18's lookup); nothing selects a Contract here.
   - Seeded Procedures are filled at seed build, keeping any recorded override or chosen ranged value
     (so B, T and M match the baseline).
   - Modifier units: the starting figure is added to today's computed modifier sum until 19b itemises
     modifiers (no seeded line sets one, so no figure moves). A picked reading.
   - Out-of-range (19's rule keeps its id): skipped when the Procedure's base units equal its line's
     stated figure. A picked reading; the pristine seed raises no new warning.
   - Tests: line units beat the row; blank falls to the row; 0 is kept; Contract change resets and
     re-picks; RVG code change refills units only; a version not in force is never read; No contract
     (RVG) and a plain RVG Contract give RVG values.

5. **The fee path reads the Procedure** (`fee.ts`).
   - `FeeContext` loses `contractPrices`, `surgeonId`, `procedureOrdinal` and the Type 2 terms. Every
     assembler (`feeContextFor`, `procedureFee`, `InvoiceBuildContext`, `seed/billing.ts`,
     `reviewFlags.naturalBtm`, `BookingDetailBody`, selectors, every `feeFor(`) passes the same inputs.
   - The Procedure's `price` is the whole price ("Contract price" line; BTM still computed for
     reference; on any Procedure, primary or additional; 0 gives $0); else `roundToCents(billableUnits x
     (rate ?? unitValue) x (1 - (discountPercent ?? 0) / 100))`, rounded once (supersedes the 8th
     review's per-unit discount rounding; no seeded discount, so no figure moves). Today's
     additional-procedure rule stays for Phase 23; the office `priceOverride` stays for Phase 24.
   - Tests: price; price on an additional Procedure; price 0; rate regardless of the anaesthetist's
     value (US-05.2.6); discount; no line (RVG); GST at the foot (US-05.2.7); the Merivale $3,910 line
     priced as one line.

6. **Session 1 ends green.** Build, build:pwa, vitest, parity as item 1 says. Grep `src/` for
   `ContractPrice`, `contractPrices`, `type2Detail`, `interimTerms`, `procedureOrdinal`,
   `matchContractPrice`, `agreedUnitRate`: none left outside test names. Until item 9 the editor shows
   a read-only lines table.

**Session 2: store, price lists, combinations, the editor, captions and time tiers.**

7. **Store actions** (`store/contractActions.ts`, office-only, audited, `Outcome`):
   `addContractLine`, `editContractLine`, `removeContractLine`, `setContractLinesTerm` (all or nothing,
   one audit entry with the count), each through `validateContractLine` with its sentence shown in the
   editor. Refused on No contract (RVG) ("No contract (RVG) has no lines."), on a started version (18's
   sentence), and for any anaesthetist actor (US-04.2.14). A line edit never touches an existing
   Procedure's values (relinking is Phase 25's); it applies at the next fill. Tests for each refusal,
   the audit entry, and `setContractLinesTerm` on Health NZ's new version ($24.00 on every line with no
   price; the current version still $23; refused on the started version).

8. **Price lists and combinations** (seed and tests).
   - **Dr Souter's price list** (US-04.2.14): on 18's Souter holder (linked to her, not billed), a
     Contract "Dr M. Souter, prepay price list" in force from 2026-01-01, **prepaid on**, editable off
     (OQ-96's recommendation; logged), lines Rhinoplasty $1,200 (the figure Riley's prepayment uses)
     and two or three cosmetic lines, each with a description and default RVG code, demo values
     labelled. No seeded Procedure moves onto it (offering is 20's, the prepaid amount 27's).
   - **Merivale Plastic Surgery** (US-04.2.11): append a Merivale Plastic Surgery rooms in 17's shape
     with one existing cosmetic surgeon, a rooms holder (not billed, so the payer is billed; D48's
     default), and its Contract with the three catalogue lines ("Face lift" $3,565, "Facelift plus 1
     add on (eg bleph)" $3,910, "Facelift plus 2 add ons (eg bleph & fat grafting)" $4,255), each with
     default RVG code H3 (19's row; if 19 has several H3 rows, the first). No seeded Booking uses it.
   - Tests: both Contracts, holders and lines pinned; a search by H3 within Merivale's lines finds all
     three (the second criterion); Souter's list reads prepaid.

9. **Admin: the Contract header and lines grid** (`ContractEditSheet`, 18's detail panel; desktop).
   - a. **Header** as 18 left it (name, dates, holder, settings including prepaid and editable), then a
     **Lines** section: Line key (mono, muted), Reference code, Description, Default RVG code (19's
     type-ahead), Price (ex GST), Rate ($ a unit), Discount (%), Base units, Modifier units, Remove. A
     blank cell shows a muted "Not set"; 0 shows 0. "Add line" adds an editable row. A search box
     filters by reference code, description or RVG code. `data-shot="contract-lines"`, rows
     `contract-line-row`.
   - b. Started version: read-only grid, 18's sentence and the teal New version action.
   - c. A Contract with no lines: "No lines. Priced at RVG: the anaesthetist's unit value, or the rate
     or discount set on the Procedure." No label. `data-shot="contract-lines-empty"`.
   - d. No contract (RVG): no grid; the note "No contract (RVG) has no lines." with a neutral
     **Provisional** badge naming OQ-106, the phase's only label.
   - e. **Set for all lines** on the Rate and Discount headers of an editable version: popover with the
     value (or "Not set") and the live count, teal confirm. `data-shot="contract-lines-set-all"`.
   - f. The old Terms choice, Contract-level rate, `PriceRows` (`contract-price-rows`), "Any code" and
     the ordinal input go. The catalogue's summary column reads "{n} lines" or "No lines · RVG
     pricing"; the composite search finds a Contract by a line's reference code or description.

10. **Captions and Review** (shared capture, Admin).
    - a. `UnitsCard`'s B caption, computed for display only: "Starting value from the Contract line"
      while B equals the line's figure, else 19's wording; no stored source. `ProcedureCodeCard`
      follows.
    - b. A Contract or RVG code change refreshes the values on screen at once.
    - c. Admin Review's fee cell: "Price" or "@ $x a unit, less n%" from the Procedure's values.
    - d. Copy sweep: grep app copy for "Type 2", "Type 3", "agreed rate", "price row", "Any code",
      "ordinal", "first party", "third party" and "fixed fee schedule". No en or em dashes.

11. **Time units as data** (`timeUnits.ts`, US-05.2.2, D25).
    - `RvgTimeRule = { tiers: { fromMinute; intervalMinutes }[]; partInterval: 'roundUp' }` in
      `masters.rvgTimeRule`, seeded from `DEFAULT_RVG_TIME_RULE` (15 from 0, 10 from 120), which no
      runtime path reads. `timeUnitsFromMinutes(minutes, rule)` with the rule required; `FeeContext`
      gains `timeRule`. `validateRvgTimeRule` and `describeTimeRule` ("1 unit per 15 minutes or part
      for the first 2 hours, then 1 unit per 10 minutes or part.").
    - Remove `PARTIAL_INTERVAL_ROUNDING`, the tier constants and the ASSUMPTION header.
    - Tests: 95 minutes is 7, 125 is 9; 0, 1, 15, 16, 120 (8), 121 (9); a different test rule changes
      the result; malformed rules refused.
    - T caption "From start and finish stamps · RVG time tiers" with `describeTimeRule` as its title.
      Delete the Control Panel's "Billing assumption" callout. A read-only **RVG time rule** panel on
      19's RVG tab, `data-shot="masters-rvg-time-rule"`.

12. **Playwright and green.** Update every spec that reads the price rows, the Contract-level rate,
    the T or B caption or the Control Panel callout. Add specs: SXAP's lines (read-only on the started
    version); Doyle's two lines on each version and no ordinal anywhere; New version on SXAP from a
    date before an ACTIVE List, set base units on the new version's general line, change that List
    Booking's RVG code and see B start at the line figure, clear it and see the RVG row's; Merivale's
    three lines found by H3; Souter's list (prepaid) by the holder filter; the No contract (RVG) note
    with its badge; the time-rule panel; S5 Beat 4 (Health NZ New version from 1 Aug 2026, Set for all
    lines $24.00, the Hemi Walker invoice unchanged). Build, build:pwa, vitest and shots green.

## Demo triggers

No new button. Normal use:

- **Admin Contract editor:** a line's base units override the RVG row's starting value on the next
  fill (a new Procedure, or an RVG code change on a Booking dated in that version); clearing it falls
  back to the RVG row.
- **Admin Contracts:** Dr Souter's price list flagged prepaid, and Merivale Plastic Surgery's
  combination lines, found by holder or by H3.
- **S5 Beat 4:** Health NZ New version, then Rate, Set for all lines, $24.00.

The only Control Panel change is deleting the rounding callout. No PWA stand-in: the captions reach
the PWA through the shared capture components.

## Out of scope

- The Contract and line picker, offering by holder fit and practitioner, the RVG-code reverse lookup
  UI, and removing `interimLineFor` (Phase 20). The invoice description (20a).
- Editing the Procedure's price, rate and discount, the editable flag's effect, the discount as its
  own invoice line, and the full precedence (24). The multi-procedure rule (23). Staging, relinking by
  line key and the snapshot (25). The prepaid amount and prepayment (27). Itemised modifiers (19b).
- Spreadsheet loads of lines and editing the time rule (42). A time band (D40).

## Manual test checklist

The agent runs every item itself and reports it with evidence.

- [ ] SXAP: the general line at $26.50 and its coded lines; blank cells read "Not set"; no
      Contract-level rate; the started version is read-only with 18's sentence.
- [ ] Doyle: two lines on each version (gastric bypass $2,800, then $2,950 upcoming), same line keys,
      no ordinal anywhere; the bariatric hernia Procedure is priced at RVG and its figure matches the
      parity test's asserted difference.
- [ ] New version on SXAP, base units on its general line, an ACTIVE List Booking's RVG code changed:
      B starts at the line figure on web, mobile and Admin; cleared, it starts at the RVG row's; each
      write audited.
- [ ] A Contract change on a Procedure resets its values; an RVG code change refills units only.
- [ ] Refusals: a duplicate reference code; a price with a rate; a discount of 120; a line on No
      contract (RVG); an edit on a started version. Each shows its sentence.
- [ ] Merivale: three lines at $3,565, $3,910, $4,255 with H3; the line search by H3 finds all three.
- [ ] Dr Souter's price list: the holder filter finds it, prepaid on, editable off, Rhinoplasty
      $1,200; no anaesthetist persona can open or edit it on web, mobile or the PWA.
- [ ] A plain RVG Contract shows the empty state with no label; No contract (RVG) shows its note with
      the Provisional badge, and the badge appears nowhere else.
- [ ] The catalogue search finds a Contract by `AP0126`; the summary reads "{n} lines" or "No lines ·
      RVG pricing".
- [ ] S5 Beat 4: every price-less line on the new version reads $24.00, the current version $23.00,
      one audit entry; the Hemi Walker invoice unchanged.
- [ ] Time units: 95 minutes is T 7, 125 is T 9; the new T caption and tooltip; the time-rule panel;
      no "Billing assumption" callout.
- [ ] S1 to S5 figures unchanged; parity green.
- [ ] PWA (5174): B and T captions as on mobile. No en or em dash in new copy; actions teal.
- [ ] Catalogue screenshots as below, `npm run capture` with no failed recipe, shots checked by eye.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots`, `npm run verify:board`
      green.

## Demo guide updates

Patch these, and the same sections of `master-demo-guide.html`:

- `04-presenter-cheat-sheet.md` "Contracts": "A Contract has a header and lines. Each line stands
  alone and sets only what it needs: a price, a rate, a discount or units, with a reference code, a
  description and an optional default RVG code. A Contract may have no lines and then prices at RVG.
  A combination such as Merivale's Facelift plus 1 add on is a line of its own. An anaesthetist's
  price list is kept by the office and can be flagged prepaid (Dr Souter's)." "Fee calculation":
  "A part interval always rounds up (confirmed with AA); the tiers are held as data. Choosing the
  Contract, line and RVG code fills the Procedure's starting values." Item 10: drop the rounding
  assumption.
- `03-demo-script.md`: S1's rounding discovery point replaced as above; **S5 Beat 4**: the rate now
  sits on a line: "New version from 1 Aug 2026, then on the new version's Lines, Rate, Set for all
  lines, $24.00"; figure and expected result unchanged. S5 "Worth pointing at": a Contract's Lines,
  Merivale's combination lines and Dr Souter's prepaid list.
- Control Panel text: grep `src/apps/demo` for "rounding", "assumption", "Type 2", "Type 3".

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19), after
the review pass. Re-run `node requirements-board/agent/skills/update-build-plan/tools/recipe-status.mjs 19a` first. No
caption may describe price rows, an ordinal, a time band, first or third party, or rounding as an
assumption.

| Item | Recipe now | When this phase is done |
|---|---|---|
| [US-04.2.4](../../../../requirements-board/requirements/stories/US-04.2.4.md) Contract lines | partial · admin-price-rows | Stays `partial`. Rename the shot `lines`, highlight `[data-shot=contract-lines]`: states `fixed-price` (Doyle), `rate` (SXAP, coded and general lines) and `search` (reference code). Caption "Each line stands alone and sets only what it needs". Reason: "Picking a line and searching by its codes when choosing a Contract is Phase 20's; its description on the invoice Phase 20a's." |
| [US-04.2.11](../../../../requirements-board/requirements/stories/US-04.2.11.md) Combinations as Contract lines | absent · "Phase 23 builds this" | `captured`. Admin shot `combination-lines`: Merivale's Contract with its three lines, state `search-h3`. Caption "A combination is a line of its own, found by its RVG code" |
| [US-04.2.14](../../../../requirements-board/requirements/stories/US-04.2.14.md) Anaesthetist's own price list Contracts | none | Create, `partial`. Admin shot `price-list`: Souter's Contract via the holder filter, prepaid on, its lines. Caption "An anaesthetist's price list, kept by the office and flagged prepaid". Reason: "Offering it only on her Bookings is Phase 20's, a price change where editable Phase 24's, the prepaid amount Phase 27's." |
| [US-05.2.2](../../../../requirements-board/requirements/stories/US-05.2.2.md) Tiered time units | captured · web-time-units, mobile-time-units | Stays `captured`. Re-shoot both with the new T caption; add admin `time-rule` on `masters-rvg-time-rule`. Caption "Time tiers held as data: a part interval always rounds up" |
| [US-04.2.1](../../../../requirements-board/requirements/stories/US-04.2.1.md) | partial · admin-contract-holder | No change here (Phases 18, 20, 21 own it); `--dry` only |
| [US-04.2.2](../../../../requirements-board/requirements/stories/US-04.2.2.md) | captured · admin-pricing-basis[type-1,type-2,type-3,rate-time] | Phase 24 owns it. Re-point any state still showing Contract-level terms to `[data-shot=contract-lines]` or `contract-lines-empty`, turn it `partial`, reason "Prices on the Procedure and the editable flag are built in Phase 24." |
| [US-04.2.8](../../../../requirements-board/requirements/stories/US-04.2.8.md) | absent | No change here (Phase 22 owns it) |
| [US-04.2.10](../../../../requirements-board/requirements/stories/US-04.2.10.md) | absent | No change here (Phases 18 and 25 own it); re-shoot only if 18's shot shows a Contract-level rate |

**Recipes this phase breaks.** `US-05.2.6` (re-shoot a Southern Cross Booking at the line's $26.50,
caption "A fixed rate prices the whole Procedure"); `US-05.2.5` (the bariatric primary, reason naming
Phase 24); `US-04.2.5` (Retired; its ordinal step goes); `US-04.1.1`, `US-04.1.2`, `US-04.3.2` and any
recipe clicking the editor (check with `--dry`); `US-05.3.1`, `US-05.3.2`, `US-03.5.2` read the units
rows (look at the shots).

**ATLAS.md.** Hooks added (`contract-lines`, `contract-line-row`, `contract-lines-empty`,
`contract-lines-set-all`, `masters-rvg-time-rule`) and removed (`contract-price-rows`); seed data
(Souter's list, Merivale's rooms and lines, SXAP and Doyle lines); the Control Panel callout gone.

## Adversarial review (after build)

Run the standard pass (PROGRESS convention 18): Opus reviewers for quality, bugs/correctness, plan
adherence and billing maths. Verify each finding, fix with a test, re-green. Do not re-raise settled
Decisions-log rulings.

**Steer this phase's reviewers at:**

- **Figures.** Parity identical except the bariatric hernia's asserted difference; every rate and
  price landed on a line with the same figure.
- **One place.** Line type, validation, starting values and fee path in `src/domain/billing`; the UI
  recomputes nothing.
- **Lines.** Standalone: no procedure link, nesting, time band, add-on flag, quantity rule or ordinal;
  line keys never reused and kept on copy; reference codes unique per version; none on No contract
  (RVG); started versions frozen; writes office-only and audited.
- **Starting values.** Line over RVG row for units; price, rate, discount from the line only; blank
  not set, 0 kept; no source stored; Contract change resets; RVG code change refills units;
  `interimLineFor` is the only line pick and is marked interim.
- **Fee path.** Price is the whole price on any Procedure; else BTM x rate x (1 - discount), rounded
  once; no Type 2 or 3 branch survives; every assembler passes the same inputs.
- **Price lists and combinations.** Souter's list prepaid, not billed, on her linked holder; Merivale's
  lines each one fixed price with H3; no anaesthetist write path.
- **Time rule as data.** No runtime read of the default or tier constants; 95 is 7, 125 is 9.
- **One label** (OQ-106 on No contract (RVG)). **No gold-plating:** no picker, offering, editing of
  Procedure prices, staging, snapshot or time band. Plus teal-only actions, no dashes, `pwaPurity`
  green, one `PERSIST_VERSION` bump.

## PROGRESS.md updates

- **For the owner's review:** D49's default (No contract (RVG) has no lines, provisional); D48's
  default (Merivale as a rooms-held Contract); the default RVG code built though Ben has not been
  asked; the picked readings (`interimLineFor` until 20; a price excludes rate and discount on a line;
  discount rounded once; starting modifier units added to the computed sum until 19b; out-of-range
  skipped when B equals the line's figure; "Set for all lines"); the dropped $950 hernia row and the
  hernia's new figure; Souter's list prepaid on, editable off; the demo line codes and prices; screens
  worth a look (SXAP, Doyle, Merivale, Souter, No contract (RVG), a B caption from a line).
- **Catalogue screenshots result:** recipes created (US-04.2.14) and changed (US-04.2.4, US-04.2.11,
  US-05.2.2, and the broken ones), `REPORT.md` counts before and after, partial reasons handed on.
- Status row and phase entry: what was built, parity result, review pass, tests, `PERSIST_VERSION`.
- **Decisions log:** (1) a Contract's terms live on standalone lines, which may be none (DM-09,
  US-04.2.4, D32), superseding the 2026-07-22 ruling (4) on `ContractPrice` keys and the Type 1/2/3
  basis; (2) no ordinal key and no Contract prices a second procedure (RV-07, OQ-90), superseding the
  2026-07-22 "Type 3 second-procedure fallback" and the Phase 08 "Type 3 x isAdditional" ruling; the
  $950 row is dropped; (3) a discount rounds once, superseding Phase 08's per-unit rounding; (4)
  starting values are filled onto the Procedure with no layer (DM-43; D3 and D12 as superseded); (5)
  the office keeps price lists, flagged prepaid (D42, D64); (6) part intervals round up under tiers as
  data (D25), superseding the 2026-07-22 rounding ASSUMPTION, ruling (8) and the callout; (7) No
  contract (RVG) has no lines (D49, provisional).
- **Handoff list:**
  - 19b: the starting modifier units from `startingValuesFor`, and how claimed modifiers combine.
  - 20: the Contract and line picker replaces `interimLineFor`; the RVG-code reverse lookup reads
    `linesWithRvgCode`; a pick runs `fillStartingValues`; price lists are offered by the holder's
    practitioner link.
  - 20a: the line's description starts the invoice description.
  - 23: Merivale's combination lines are seeded here; the bariatric hernia is the multi-procedure case.
  - 24: the Procedure's `price`, `rate` and `discountPercent` exist and are filled; 24 makes them
    editable under the editable flag, adds the discount line and folds in `priceOverride`.
  - 25: New version keeps line keys; relinking by line key and staging are 25's.
  - 27: the prepaid amount is the Procedure's price from a prepaid Contract's line (Souter's).
  - 42: loads match lines on the line key, else the reference code; the time rule becomes editable.
