# Phase 42 · Reference data and controlled loads

**Requirements covered:**
[US-13.4.1](../../../../requirements-board/requirements/stories/US-13.4.1.md) Maintain reference tables (Confirmed; Partial; closes the rows Phases 17, 18, 19, 19b, 29 and 30 did not: hospital retire, insurers, the master public-holiday calendar, and one consistent pattern across every master; its "recurring bookings" row is Phase 30's rename and editor, refitted here. Greg would call these master data, not reference tables (2026-10-02 #39): the app says "Master data" only) ·
[US-11.4.1](../../../../requirements-board/requirements/stories/US-11.4.1.md) Insurer master data (Confirmed; graded Contradicts at `60e2d1e` because flipping the direct-claims flag minted a protected default Type 1, which Phase 18 removes. Here: add, rename, retire and reinstate, with the accepts-direct-claims flag creating **no** Contract; an insurer's Contracts, most of them plain RVG Contracts billed to the insurer (OQ-98, D32), sit under its contract holder (Phase 18). The cover split is a Booking action (Phase 22, RV-37), never on the insurer row) ·
[US-13.4.2](../../../../requirements-board/requirements/stories/US-13.4.2.md) Clean-cut start, not a full migration (Confirmed; Missing) ·
[US-13.4.3](../../../../requirements-board/requirements/stories/US-13.4.3.md) Reference data loaded from controlled spreadsheets (Proposed; Partial; changed 2026-10-07: "RVG groups and procedures, with base units", no default Contracts; seeded **once, run by a developer**, then changed by hand on screen; separate from the Contract schedule upload, which is Future Work; repeatable so a test system can be wiped and reloaded; holders will not fill in AA's template) ·
[DM-38](../analysis/domain-model-delta.md#dm-38) Reference data: a master public-holiday calendar and spreadsheet-loaded masters, the Contract schedule upload Future Work (the statutory calendar and the seed loads; Phase 30 built the hospital-calendar half and the recurring-booking rename, Phase 31 the recurring clash that becomes a Draft List).
Also touches, without closing:
[FT-13.4](../../../../requirements-board/requirements/stories/FT-13.4.md) (the feature; its RFP-response ETL migration is narrowed to the clean cut),
[US-05.1.1](../../../../requirements-board/requirements/stories/US-05.1.1.md) and [US-05.1.6](../../../../requirements-board/requirements/stories/US-05.1.6.md) (Confirmed; RVG groups hold the base units, a procedure may set its own; both become load targets, Phase 19 built them),
[US-05.1.5](../../../../requirements-board/requirements/stories/US-05.1.5.md) (Verify; "Admins load the modifier list as master data": the RVG table from AR-34's files plus AA's own, Phase 19b built it; AA's rows become loadable, editable and retirable here),
[US-04.1.5](../../../../requirements-board/requirements/stories/US-04.1.5.md), [US-04.2.4](../../../../requirements-board/requirements/stories/US-04.2.4.md) and [US-04.2.14](../../../../requirements-board/requirements/stories/US-04.2.14.md) (contract holders, Contract lines and the anaesthetists' own fixed-price Contracts become load targets; Phases 18 and 19a built them),
[US-04.2.13](../../../../requirements-board/requirements/stories/US-04.2.13.md) (Future Work: the Contract schedule upload is **not** built; the seed load is separate from it, D34),
[US-05.2.2](../../../../requirements-board/requirements/stories/US-05.2.2.md) (Confirmed; the RVG time tiers, held as data by 19a, become editable here; a part interval always rounds up),
[US-01.5.1](../../../../requirements-board/requirements/stories/US-01.5.1.md) (Confirmed; each hospital keeps its own calendar, and public holidays move out of it),
[US-01.3.2](../../../../requirements-board/requirements/stories/US-01.3.2.md) (Verify; recurring bookings, refitted to the one pattern and counted in retire blockers).
**Left this phase on 2026-10-08:** [US-04.4.2](../../../../requirements-board/requirements/stories/US-04.4.2.md) and
[FT-04.4](../../../../requirements-board/requirements/stories/FT-04.4.md) (Retired: there are no default RVG Contracts, so the
procedure sheet loads base units onto procedures and the RVG groups sheet onto groups) and
[US-04.2.12](../../../../requirements-board/requirements/stories/US-04.2.12.md) (Retired: the Contract has no payment setting;
the split is a Booking action). No RV finding is closed here.

**Decisions and questions** (ROADMAP.md owner decisions table, as re-read on 2026-10-08):
- **Gates this phase, still open, built as its default: D34** ([OQ-100](../../../../requirements-board/requirements/questions/OQ-100.md)).
  The first release is a **developer-run seed load plus office screens, with a second-person check
  done on screen**; there is **no in-app Contract schedule upload** (US-04.2.13 is Future Work). This
  phase builds exactly that: the loader is a demo stand-in for the developer's one-off seed (work
  items 4 to 10 and 13), the office maintains every master by hand, and a Contract version's lines
  carry a second-person check (work item 6a). One provisional note, on the Contract detail's check
  line: "Provisional · lines keyed or loaded are checked by a second person on screen; no schedule
  upload in the first release (OQ-100)." Logged on the owner's review list.
- **Answered, and built as answered (no label):**
  - **D12 superseded 2026-10-08** ([OQ-62](../../../../requirements-board/requirements/questions/OQ-62.md), with
    [OQ-78](../../../../requirements-board/requirements/questions/OQ-78.md)): base units live on the **RVG group**, a
    **procedure** may set its own, and a **Contract line** may override both; there are no default
    RVG Contracts. So the RVG groups sheet loads group figures, the procedures sheet loads a
    procedure's own figure (blank inherits), and the Contract lines sheet loads line figures. ~~Base
    units in each procedure's one or two default RVG Contracts~~.
  - **D16 superseded 2026-10-08** (OQ-66 still answered): the AA code rule is unchanged (a loaded
    Contract's code comes from 18's `nextAaCode`, never the sheet); the composite search, filters and
    No contract (RVG) first are 18's and 20's.
  - **D17 superseded 2026-10-08**: the Contract bills its holder (when the holder pays AA) or the
    payer on the Booking. Who is billed is the contract holder's setting, so the holders sheet loads
    "Holder is billed" and its billable party; nothing on the insurer or hospital row decides it.
  - **D18 superseded** (2026-10-05): the split is a Booking action with no Contract setting (Phase 22),
    so neither the insurer row nor the Contracts sheet carries a split or share.
  - **D2 superseded 2026-10-08**: an insurer is reached through its contract holder and through the
    **insurance indication** on the Booking (OQ-93, D28, Phase 21), which never decides who is billed.
    The insurer retire blockers count both.
  - **D42** ([OQ-91](../../../../requirements-board/requirements/questions/OQ-91.md)): the office keeps the
    anaesthetists' own fixed-price Contracts, so a first-party holder, its Contract and its lines load
    through the same sheets as any other and are then kept by the office.
  - **D45** (OQ-48): the procedure date decides the Contract version in force; a loaded Contract's
    Valid from is the sheet's.
  - **D25 superseded 2026-10-08**: the time rule applies to recorded time only (no prepayment
    estimate exists any more); a part interval always rounds up, so the time-rule editor edits tiers
    only.
  - **D14**: "slot" never reaches app copy.
  - **US-13.4.3's re-load question is answered by its new text**: the starting data is "seeded once,
    run by a developer ..., and then changed by hand on screen", and loading is repeatable so a test
    system can be wiped and reloaded. So there is **no office "Load from spreadsheet" action** on the
    office's Master data views (the 2026-10-03 plan's "loads at any time, add only" reading goes); the
    loader lives only in a demo-badged **Seed load** view that stands in for the developer's step.
- **Still open, followed as their owning phases built them (this phase adds no label for them):**
  D32 (OQ-98: a Contract row with no lines loads as a plain RVG Contract of its holder, offered for
  every procedure; 18, 19a, 20), D35 (OQ-101: an RVG group row carries a starting figure and an
  optional published range; 19), D37 (OQ-103: a loaded group's general procedure is named by 19's rule
  unless the sheet names it; 19), D39 (OQ-88: two levels, a unique system code on every group and
  procedure, both sheets keyed on it; 19) and D11 (OQ-49, NHI: not a master). "Whether calendar
  schedules join the list" (US-13.4.3's note) is still unclear: the calendars (public and hospital
  holidays) load, and recurring bookings stay hand-made, logged for the owner. OQ-51 (Solutions Plus
  identifiers) was deleted unanswered, so the clean cut takes operation names only.

**Depends on:** Phase 17 (surgeon profile with its one HPI CPN rule (`normaliseHpiCpn`,
`isPlausibleHpiCpn`, the duplicate check across surgeons and anaesthetists), surgeons' rooms, surgeon
groups, hospital contact email, `editHospital`, `isPlausibleEmail`, the `apps/admin/screens/masters/`
split and the `?view=` search param), Phase 18 (the contract-holder master `ContractHolder` with
`createContractHolder`, `editContractHolder`, `retireContractHolder` and `validateHolder`; the Contract
as dated versions with `createContract`, `createContractVersion`, `retireContract`, `termsLocked` and
the AA code from `nextAaCode`; the one stored No contract (RVG); `createHospital` and
`setInsurerDirectClaims` minting no Contract; the organisations master kept behind holders; the
"Contract holders" tab and `ContractHolderPanel`), Phase 19 (`BodySection`, `RvgGroup`,
`ProcedureType`, `systemCodeIsFree`, `generalProcedureName`, `createRvgGroup`, `createProcedureType`,
their retire and restore, the "RVG groups" and "Procedures" tabs, `RvgGroupSheet`,
`ProcedureTypeSheet`), Phase 19a (`ContractLine` with `validateContractLine`, `addContractLine`,
`editContractLine` and `removeContractLine`; plain RVG Contracts; the first-party Contracts with
`ownFixedPriceFor`; `masters.rvgTimeRule` with `validateRvgTimeRule`, `describeTimeRule` and
`timeUnitsFromMinutes`, and the read-only `masters-rvg-time-rule` panel it handed here), Phase 19b
(the `Modifier` master generated from AR-34's files, `addAaModifier`, the band table, the locked age
and included rules), Phase 29 (the availability status master, nav "Availability statuses",
`validateSlotStatusDraft`) and Phase 30 (derived conflicts reconciled in `mutate()`,
`conflictFactsFor`, `describeConflict`, `HolidaySheet`, `addHospitalHoliday`,
`editHospitalHoliday`, `deleteHospitalHoliday`, the hospital month calendar, and recurring bookings
with their projection). Also relies on 14 (the demo-trigger registry, `useDemoTriggerContext`,
`store/demoActors.ts`), 20 (the Contract picker, which offers No contract (RVG) first and hides
retired holders' Contracts), 21 (the payer on the Booking and the insurance indication
`Booking.insuranceIndication`), 22 (`Contract.invoicing`), 23 (`Contract.isCombination`), 25 (the
pricing snapshot, so a master edit never moves an AUTHORISED price), 26 and 28 (`addAnaesthetist` with
its start date, HPI CPN and profile fields, and 28's one generation path), 31 (the Draft List holiday
warning, the recurring clash that becomes a Draft List, and **AA rooms as a location row in the
hospitals master**, `Hospital.locationType: 'hospital' | 'aaRooms'` with `HOSP.aaRooms`, never a
Contract holder or a feed; its handoff asks 42's Hospitals editor to keep it non-deletable and out of
the holder and feed pickers), 33 (the matching screen's create actions), 34 (the hospitals it appended
and `INTEGRATED_HOSPITALS`) and, by build order rather than as a formal dependency, **39b** (the
Contract event fee, `ContractEventFee` in `masters.contractEventFees`, a fixed fee per event type on a
Contract version; its handoff asks 42's loader to accept it beside Contract lines). Confirm 39b is
DONE; if it is not, drop the event-fee sheet (work item 8) and log it for Phase 44.
**Estimated:** 2 sessions. Session 1 is the model, seed, pure rules and store (work items 1 to 10) and
stops green with every existing screen still rendering. Session 2 is the screens, the Seed load and
Go-live views, the triggers, the shots and the demo guide (items 11 to 19).
**Size warning:** this is a roll-up and sits at the top of two sessions; session 1 in particular is
heavy (thirteen loader specs, the planner refactor and the holiday migration). If session 1 runs long,
end it green after item 7 and start session 2 with items 8 to 10; do not drop a covered target.
Within session 2, trim in this order if needed, and log each trim for Phase 44: the RVG time rule
editor (19a's read-only panel stays), the Insurers "Contracts" link-through (keep the count), the
collapsible `LoadResultBanner` (keep it static), the public-holiday "Lists affected" column, then
Organisations retire.

## Goal

Master data has grown one phase at a time. Surgeons, rooms and groups came in 17, contract holders and
dated Contracts in 18, RVG groups and procedures in 19, Contract lines, the anaesthetists' own
Contracts and the time tiers as data in 19a, modifiers in 19b, availability statuses in 29, holiday
editing and recurring bookings in 30. What is left is the part US-13.4.1 names and nobody owns yet,
a single pattern that makes the whole area feel like one tool, the one-off developer-run seed
US-13.4.3 now describes, and the clean cut:

- **Hospitals** can be edited (17) and now **retired and reinstated**. A rename also renames the
  hospital's linked contract holder while the holder's name still equals the old hospital name, so
  "change once, reflected everywhere" holds. There is no hospital default Contract to rename (18
  removed them; OQ-78).
- **Insurers** can be **created, renamed, retired and reinstated**, each with the
  accepts-direct-claims flag, which **creates no Contract** (US-11.4.1's wrong behaviour is gone since
  18). An insurer's Contracts sit under its contract holder (18): most are plain RVG Contracts billed
  to the insurer (OQ-98's default, D32), offered for every procedure by 20. The Insurers view counts
  and links to them, and the insurer sheet offers "Set up as a contract holder" into 18's holder panel,
  prefilled. Special rates are Contract lines (19a); the cover split is a Booking action (22); the
  insurance indication on the Booking (21) reads the flag. None of these is a field on the insurer
  row.
- A **master public-holiday calendar**. One row per statutory or regional holiday, applying to every
  hospital unless a hospital is listed as open that day. The seeded per-hospital Labour Day and
  Canterbury Anniversary rows migrate into it, so each hospital's own calendar holds only its own
  closures (US-13.4.1, US-01.5.1). Public holidays raise conflicts through 30's derived rule.
- **Retire, never delete, anything referenced by identity.** Hospitals, surgeons, rooms, groups,
  insurers and organisations retire with a stated reason when nothing upcoming depends on them
  (18 already retires contract holders and Contracts, 19 RVG groups and procedures, 29 statuses, 30
  recurring bookings). AA's own modifiers become editable and retirable here (19b's handoff); the RVG
  table's rows stay as printed. Pickers stop offering retired records, and every existing reference
  keeps resolving.
- **One consistent pattern across every view:** grouped sub-nav, the same header, "Show retired", edit
  sheet, retire and reinstate. It is driven by one registry of views, with a test that maps every
  US-13.4.1 row to a view that can add and edit. The 19a time rule joins it as an editable panel
  (tiers only; a part interval always rounds up). There is **no "Load from spreadsheet" on the
  office's views**: the office keeps master data by hand (US-13.4.3). A view whose master the seed
  loads says so once in its subtitle ("Loaded once at go-live from AA's controlled spreadsheet, then
  kept here by hand.").
- **A seed load, standing in for the developer's one-off import** (US-13.4.3, DM-38,
  [AR-29 · Data loading](../../../../requirements-board/requirements/artifacts/AR-29.md#data-loading)). One
  loader with a spec per master: hospitals; hospital holidays and public holidays (the calendars, so a
  test system loads the same way again); surgeons' rooms; surgeons; anaesthetists; **RVG groups with
  their base units, and procedures with any base units of their own** (no default Contracts); AA's own
  modifiers; **contract holders; Contracts; Contract lines** (any Contract: plain RVG, fixed price,
  fixed rate, fixed discount or base-unit terms, first or third party) and the Contract event fees
  39b added (a fixed fee per event type, for example the ACC pre-op assessment). A load is checked first:
  every row is validated with the same rules as the manual add, and a result panel lists valid rows and
  rejected rows with reasons. Then it is loaded: one audited `mutate()` loads exactly the valid rows,
  and rejected rows never touch master data (US-13.4.3 AC1). The same sheets loaded after a Reset give
  identical records (AC2). It lives in a **Seed load** view, demo-badged as the developer's step, never
  in an office screen. There is **no Contract schedule upload** (D34, US-04.2.13 Future Work).
- **A second-person check on screen** (D34's default): a Contract version's lines carry "Checked by
  ... on ..." once a second office user confirms them against the holder's price list. Keying,
  editing or loading lines clears it; the person who last changed the lines cannot check them.
- **A clean-cut go-live demo** (US-13.4.2). A Solutions Plus operation list, names only, sits beside
  AA's decisions and the controlled spreadsheets. Junk such as "10% discount" is excluded, rows AA has
  not approved are not loaded, and Solutions Plus unit values are shown struck through and never
  used. "Load approved data" loads only approved, valid rows from the controlled spreadsheets
  (US-13.4.2 AC1 and AC2, US-13.4.3 AC3), base units landing on the RVG groups and procedures.

**The pricing model stays in one place.** This phase builds no pricing structure of its own: it
loads into the RVG group, procedure, contract-holder, Contract and Contract-line shapes that 18, 19,
19a and 19b keep in `aa-prototype/src/domain/billing` (plus the seed), through their validators and
create actions, behind the types the UI reads. A loader spec maps spreadsheet columns onto those types
and never declares a second shape or a second rule, so when the draft design moves to a v5 the change
stays a contained edit in that module and the specs follow it. The reference shape is the draft
technical design v4: [AR-29](../../../../requirements-board/requirements/artifacts/AR-29.md) regions
[`data-loading`](../../../../requirements-board/requirements/artifacts/AR-29.md#data-loading) (the template list
and the developer-run MVP baseline), [`data-model`](../../../../requirements-board/requirements/artifacts/AR-29.md#data-model),
[`contract-holder-fields`](../../../../requirements-board/requirements/artifacts/AR-29.md#contract-holder-fields),
[`contract-fields`](../../../../requirements-board/requirements/artifacts/AR-29.md#contract-fields),
[`contract-line-fields`](../../../../requirements-board/requirements/artifacts/AR-29.md#contract-line-fields),
[`null-handling`](../../../../requirements-board/requirements/artifacts/AR-29.md#null-handling) and
[`contract-versions`](../../../../requirements-board/requirements/artifacts/AR-29.md#contract-versions) ("a row is
the complete line, not a patch: a blank cell inherits and 0 means zero") and
[`integrity-rules`](../../../../requirements-board/requirements/artifacts/AR-29.md#integrity-rules); its ERD
[AR-30](../../../../requirements-board/requirements/artifacts/AR-30.md) regions
[`rvg-group`](../../../../requirements-board/requirements/artifacts/AR-30.md#rvg-group),
[`procedure`](../../../../requirements-board/requirements/artifacts/AR-30.md#procedure),
[`contract-holder`](../../../../requirements-board/requirements/artifacts/AR-30.md#contract-holder),
[`contract`](../../../../requirements-board/requirements/artifacts/AR-30.md#contract) and
[`contract-line`](../../../../requirements-board/requirements/artifacts/AR-30.md#contract-line). The
plain-language guide [AR-28](../../../../requirements-board/requirements/artifacts/AR-28.md) regions
[`rvg-groups-and-procedures`](../../../../requirements-board/requirements/artifacts/AR-28.md#rvg-groups-and-procedures),
[`contracts-two-kinds`](../../../../requirements-board/requirements/artifacts/AR-28.md#contracts-two-kinds) and
[`keeping-prices-up-to-date`](../../../../requirements-board/requirements/artifacts/AR-28.md#keeping-prices-up-to-date)
is true as written. AR-29 and AR-30 are a **draft** that a v5 may change before or during the build.
**Modifiers** come from the catalogue's files (artifact
[AR-34](../../../../requirements-board/requirements/artifacts/AR-34.md): `NZSA RVG 2021 modifiers.md` and
`NZSA RVG 2021 included modifiers.csv`) through 19b's generated table, never re-transcribed.

Three harness-bar triggers make the loads and the check demoable without files on the presenter's
laptop: "Load sample spreadsheet", "Go-live data load (demo)" and "A second person checks these
lines (demo)". Nothing here is mobile, so there is no PWA stand-in.

## Before you start: drift check

1. Run the catalogue diff against the plan's baseline, catalogue commit `60e2d1e` (rename-aware;
   never a plain `git diff` of the catalogue folder):

   ```
   node docs/prototype-build/catch-up/tools/plan-state.mjs --diff US-13.4.1,US-11.4.1,US-13.4.2,US-13.4.3,FT-13.4,US-05.1.1,US-05.1.6,US-05.1.5,US-04.1.5,US-04.2.4,US-04.2.14,US-04.2.13,US-05.2.2,US-01.5.1,US-01.3.2,OQ-100,OQ-98,OQ-88,OQ-101,OQ-103,OQ-93
   ```

   At plan time (2026-10-08, `3d3a18c..60e2d1e`) these moved, and the plan already reflects them:
   US-13.4.3 rewritten ("RVG groups and procedures, with base units", no default Contracts; seeded once
   by a developer, then changed by hand; separate from the Contract schedule upload; repeatable for
   test systems; holders will not fill AA's template; the old "whether admins can re-load later"
   point is gone); US-11.4.1 (insurer-held third-party Contracts; most insurer and hospital Contracts
   are plain RVG Contracts billed to their holder, OQ-98; the insurance indication guides the choice
   but the Contract decides who is billed, OQ-93); US-05.1.6 (a procedure may set its own base units;
   every group has a general procedure); US-05.1.5 (Verify; "Admins load the modifier list as master
   data": the RVG table plus Vanessa's list); US-05.2.2 (a part interval always rounds up); US-01.3.2
   (recurring bookings; a clash becomes a Draft List); US-04.4.2, FT-04.4 and US-04.2.12 Retired;
   US-04.2.13 added in the Future Work lane; OQ-100 added; OQ-62 and OQ-78 answered. Diff only for
   anything after `60e2d1e`. If a covered item is now Retired or Future, drop it from this phase and
   say so in the PROGRESS entry. Watch in particular for:
   - **OQ-100 (D34).** If the schedule upload is answered "in the first release", it is still not this
     phase's: record it for the owner and Phase 44 (it needs its own phase: format, delta or full
     overwrite, preview of new, changed and removed lines, control totals), and keep this phase's seed
     load separate. If the second-person check is answered differently (for example a control total
     rather than a "Checked by" mark), change work item 6a only.
   - **Calendar schedules** (US-13.4.3's note: "Whether calendar schedules join the list above was
     left unclear"). If the list gains them explicitly and names recurring bookings, add a
     recurring-bookings sheet through 30's create planner (nothing is painted until the view's "Apply
     to canvas now"; a clash becomes 31's Draft List). If it rules calendars out, keep the calendar
     sheets and say so on the owner's review list.
   - **The spreadsheet list** in US-13.4.3, AR-29 `data-loading` and the domain model's "Reference
     data and go-live" section. A new target joins the loader only if its master already exists;
     otherwise note it for Phase 44.
   - **The master calendar's scope** (national vs regional, or per-hospital opt-in rather than
     opt-out). This phase builds "applies to every hospital unless listed as open".
   - **OQ-98, OQ-88, OQ-101, OQ-103.** The loader follows whatever 18, 19 and 19a built for them; if
     one was answered and re-built, re-shape the matching sheet's columns to it before building.
2. **Where loaded base units land (D12 superseded, answered).** Base units live on the RVG group
   (required, above 0, with an optional published range, D35), a procedure may set its own (blank
   inherits the group's; 0 is a value), and a Contract line may override both (blank inherits, 0 is
   zero). So the RVG groups sheet writes `RvgGroup.baseUnits` and `baseUnitsRange`, the procedures
   sheet writes `ProcedureType.baseUnits` and `modifierUnits` (null when the cell is blank), and the
   Contract lines sheet writes the line's base and modifier units. A loaded value obeys exactly the
   manual rule of its target (19's `createRvgGroup` and `createProcedureType`, 19a's
   `validateContractLine`). AA's own figures are never refused for differing from the NZSA guide, and
   loading raises no warning: D3's after-procedure warning is about a value recorded on a Procedure,
   not master data. Nothing loads a default RVG Contract: none exist. No Solutions Plus identifier
   is carried (OQ-51 deleted; US-13.4.3 takes names only): the candidate list holds operation names
   plus the scan-row number for traceability ("Scan row 14").
3. **Baseline.**
   - Confirm Phases 17, 18, 19, 19a, 19b, 29 and 30 are DONE in PROGRESS.md, and note whether 20 to
     28, 31, 33, 34 and 39b are DONE.
   - From their entries and Decisions-log rows, note the names actually chosen:
     - the view ids in `?view=` and the `NAV` shape (17, 18's "Contract holders", 19's "RVG groups"
       and "Procedures", 19b's modifiers view, 29, 30);
     - the `SurgeonRoom`, `SurgeonGroup` and `Surgeon` fields and the HPI CPN normaliser, shape check
       and duplicate check (17);
     - `ContractHolder` (`partyType`, `kind` and its link field, `billsHolder`, `billablePartyRef`,
       `retiredAtISO`), `validateHolder`, `createContractHolder`, `retireContractHolder`; `Contract`
       (`aaCode`, `holderId`, `isDefault`, `effectiveFromISO`, `effectiveToISO`, `reviewDateISO`,
       `previousVersionId`, `retiredAtISO`), `createContract` and its validator, `nextAaCode`,
       `aaCodePrefixFor`, `termsLocked`, `noContractOf` (18);
     - `BodySection`, `RvgGroup`, `ProcedureType`, `systemCodeIsFree`, `generalProcedureName`,
       `createRvgGroup`, `createProcedureType`, their refusal sentences, `RvgGroupSheet` and
       `ProcedureTypeSheet` (19);
     - `ContractLine`, `validateContractLine` and its refusals, `addContractLine`, the plain RVG
       predicate, `ownFixedPriceFor`, `masters.rvgTimeRule`, `validateRvgTimeRule`,
       `describeTimeRule` and `data-shot="masters-rvg-time-rule"` (19a);
     - `Modifier`, the generated AR-34 table and its generator, `addAaModifier` and its refusals, the
       band table (19b);
     - `Booking.insuranceIndication` and its picker (21); `Contract.invoicing` and
       `defaultInvoicingFor` (22); `Contract.isCombination` (23); what 25's snapshot records;
     - `NewAnaesthetistFields` and `addAnaesthetist` with its start date (26, 28);
     - `masters.slotStatuses` and the "Availability statuses" view id (29);
     - `ListConflict.cause`, `conflictFactsFor`, `holidaysByDateHospital`, `reconcileAllConflicts`,
       the reconcile trigger list in `store/conflictReconcile.ts`, `HolidaySheet`, the hospital month
       calendar, and the recurring-booking names (`RecurringBooking`, `masters.recurringBookings`,
       the projection, `applyRecurringBookingsToCanvas`, the view id) (30); 31's Draft List assignment
       warning, `Hospital.locationType`, `HOSP.aaRooms` and `locationName`;
     - `ContractEventFee`, `masters.contractEventFees`, its validator, create action and id kind
       (`CEF`), and how 18's new-version action copies event fees (39b);
     - the hospitals 34 appended, their `HOSPITAL_HOLIDAYS` rows, and `INTEGRATED_HOSPITALS` (34's
       `domain/intake/syncDeliveries.ts`);
     - `validateSlotStatusDraft` (29), the precedent for item 4's pure validators.
     Use those names throughout. This doc's code references are as at `60e2d1e` (the prototype was
     last mapped at that commit), or as those phases planned them.
   - Record the seed's flagged-List set today (List ids with a `holiday` conflict, by cause), so the
     public-holiday migration can prove the set does not move (work item 3).
   - Grep every picker that offers hospitals, surgeons, rooms, groups, insurers or contract holders
     (`grep -rn "masters.hospitals\|masters.surgeons\|masters.insurers\|surgeonRooms\|surgeonGroups\|contractHolders" src --include=*.tsx`)
     and list them, including 18's holder-link picker, 20's Contract picker (which must hide Contracts
     whose holder is retired) and 21's insurance-indication picker. Work item 16 routes each one
     through the active-only selectors.
   - Grep every reader of hospital holidays
     (`grep -rn "masters.holidays\|holidaysByDateHospital\|HospitalHoliday" src --include=*.ts --include=*.tsx`).
     At `60e2d1e`: the canvas generator (`domain/seed/canvas.ts:90-93`), the horizon advance
     (`store/clockActions.ts:45`), the new-anaesthetist canvas generation in `addAnaesthetist`
     (`store/mastersActions.ts:241`) and the Hospitals view (`MasterData.tsx:275`); 28, 30 and 31 add
     the generation path, `conflictFactsFor`, the recurring-booking projection, the conflict preview
     and the Draft List assignment warning. List them; work item 2 routes each through
     `closuresIndex`, so no reader silently loses Labour Day when the per-hospital rows go.
   - Grep for stored copies of a master's name (a contract holder named after its hospital or
     insurer, a `hospitalName` on a record). List them; work item 5 handles the linked holder, and
     anything else is noted for the reviewers.
   - Note the current `PERSIST_VERSION` in `src/store/appStore.ts` (16 at plan time, after 15a's first
     session; 15a to 41 will have bumped it) and bump it by one from whatever it is now.
   - Check `docs/discovery-reference/Data files/` (`git log` on it) for Vanessa's base units sheet,
     fuller modifier list, contract overrides and surgeons' rooms list (US-13.4.3's note). If any has
     landed, model the matching sample's columns on its headers (still saved as CSV), but keep every
     fixture row demo-plausible: no real figure is loaded into the seed.
4. **Owner decisions.** D34 gates this phase (above). The rest shape it and are answered: D12, D16,
   D17, D18, D2, D25 and D14 as re-read on 2026-10-08, D42 (OQ-91) and D45 (OQ-48). D3 covers a value
   recorded on a Procedure, not master data.

## Reference

**Design files (convention 17).** No mockup covers Master data, a loader or a go-live screen. Extend
the admin's own patterns, and do not invent new chrome:
- `docs/design/Design Language.dc.html`: the tokens (teal the only action colour, crimson identity
  only), the semantic success, warning and error trios for row outcomes, neutral pills, tables, radii,
  the sheet rules, and "colour is never the only signal" (every outcome pill carries its word).
- `docs/design/Admin Review.dc.html`: the Admin table, header (title, subtitle, count, filter chips),
  the four-tile summary row and row actions. The load result panel, the Seed load view and the
  go-live summary follow it.
- `docs/design/Admin Day.dc.html`: the dark-ink side nav and the admin page chrome the Master data
  sub-nav sits in.
- `docs/design/Web Availability.dc.html`: the month cell anatomy that 30's hospital calendar reused.
  Public holidays show in it as closures.

**Catalogue:** the covered items above; `requirements-board/requirements/domain-model.md` sections
"1. What changed since the RFP" (the clean-cut row: a one-off seed, then by hand; the schedule upload
separate), "Contract (draft structure)" (the contract holder master data block), "RVG groups,
procedure list and modifier master", "Surgeon, surgeons' room, preferences and priority tiers" and
"Reference data and go-live", and the glossary's "Contract holder", "No contract (RVG)" and
"Recurring booking" entries. Evidence: `npm --prefix requirements-board run source -- --item US-13.4.3 --text`
(the 2026-09-29 points 27, 28, 30 and 31; the 2026-10-02 review points 10, 40 and 77; the 2026-10-07
meeting points 42 and 62, Greg: "They can just type it in by hand. It's such a rare event"; the
pricing-documents points 18 and 36), and the same for US-11.4.1 and OQ-100. Change log
`requirements-board/requirements/changes/2026-10-07-requirements-update.md` (the US-13.4.3, US-11.4.1,
US-04.2.13 and OQ-100 rows).

**Analysis:**
- `docs/prototype-build/catch-up/GAP-ANALYSIS.md`: the master data theme, the "Oversight/NFR"
  demo-trigger line, and the EP-13 and EP-11 tables.
- `docs/prototype-build/catch-up/epics/EP-13.md` (US-13.4.1, 13.4.2, 13.4.3) and `epics/EP-11.md`
  (US-11.4.1: Contradicts, size M; the minting is 18's to remove, add, edit and retire are this
  phase's, the indication is 21's).
- `analysis/domain-model-delta.md` DM-38 (and DM-48, DM-49, DM-13, DM-09, DM-43 and DM-44 for the
  load targets; DM-12 for the insurance indication).
- `analysis/prototype-map-admin.md` section 9 (Master data), `prototype-map-store-seed.md`
  (`mutate`, `allocateId`, masters actions, seed), `prototype-map-shell-demo-pwa.md` (the trigger
  registry and the PWA closure).

**Code entry points (as at `60e2d1e`; use the names 17 to 34 chose where they differ):**
- `aa-prototype/src/domain/types.ts`: `Hospital` (:155), `Surgeon` (:160), `Insurer` (:166),
  `PermanentList` (:585, 30's `RecurringBooking`), `HospitalHoliday` (:612), and the types 17, 18,
  19, 19a and 19b added (rooms, groups, holders, Contracts, groups, procedures, lines, modifiers).
- `aa-prototype/src/domain/seed/cast.ts`: `HOSP`, `HOSPITALS`, `INS`, `INSURERS`;
  `domain/seed/availabilityAndHolidays.ts`: `HOSPITAL_HOLIDAYS` (:58, a `flatMap` over `HOSPITALS`
  that writes Labour Day Mon 26 Oct and Canterbury Anniversary Day Fri 13 Nov per hospital, plus 30's
  `HH900` closure); `domain/seed/index.ts`: `SeedMasters` and `buildSeed` (holidays at :363 and
  :445); `domain/seed/canvas.ts`: `ADHOC_HOSPITALS` (:61) and the holiday map (:90-93).
- `aa-prototype/src/domain/billing/`: the pricing-model module 18, 19, 19a and 19b built (holders,
  Contracts, groups, procedures, lines, modifiers, the resolver and their validators). The loader
  imports from it and never re-implements a rule.
- `aa-prototype/src/domain/conflicts.ts` (30): `conflictFactsFor`, `expectedConflicts`,
  `describeConflict`, `reconcileAllConflicts`; `src/store/conflictReconcile.ts` (30), called only
  from `mutate.ts`.
- `aa-prototype/src/store/mastersActions.ts`: `createHospital` (:45), `setInsurerDirectClaims`
  (:102, minting nothing after 18), `addAnaesthetist` (:241), `addHospitalHoliday` (:320), 17's
  `editHospital`, and 30's `editHospitalHoliday` and `deleteHospitalHoliday`.
  `src/store/surgeonActions.ts` (17), `contractActions.ts` and `contractHolderActions.ts` (18, 19a),
  `rvgMasterActions.ts` (19), 19b's modifier actions.
- `aa-prototype/src/store/mutate.ts`: `ID_FORMATS` (:61), `allocateId` (:100), `MutationMeta`
  (:116). `src/store/appStore.ts`: `AppState`, `PERSIST_VERSION` (:136, 16).
- `aa-prototype/src/apps/admin/screens/MasterData.tsx` and 17's `apps/admin/screens/masters/`
  (`NAV` at :41, `InsurersView` at :364, `HospitalsView` at :275, `PermanentListsView` at :244,
  `ListStatusesView` at :453 at `60e2d1e`); sheets in `apps/admin/flows/` (`HolidaySheet`,
  `EditHospitalSheet`, `SurgeonEditSheet`, `SurgeonRoomSheet`, `SurgeonGroupSheet`,
  `ContractHolderPanel`, `ContractEditSheet`, `RvgGroupSheet`, `ProcedureTypeSheet`, 19b's modifier
  sheet); `apps/admin/tableChrome.ts`.
- `aa-prototype/src/shared/demoTriggers/` (14): `types.ts` (`surfaces`, `indexPath`), `registry.ts`,
  `context.ts` (`DemoContextValues`); `src/store/demoActors.ts` (`OFFICE_ACTOR`,
  `OFFICE_SIMULATION_ACTOR`); `src/shared/DemoBadge.tsx`.
- `aa-prototype/src/shared/audit/actionLabels.ts`, `auditNarrative.ts`.
- Tests to extend: `store/mastersActions.test.ts`, 17's `store/surgeonActions.test.ts`, 18's
  `store/contractActions.test.ts`, 19's `store/rvgMasterActions.test.ts`, 19b's
  `store/modifierActions.test.ts`, `domain/conflicts.test.ts`, `domain/seed/seed.test.ts`, 28's
  `domain/seed/canvasGolden.test.ts`, `store/persistMigrate.test.ts`,
  `shared/audit/auditNarrative.test.ts`, `shared/demoTriggers/demoTriggers.test.ts`,
  `src/pwa/pwaPurity.test.ts`; Playwright `visual/admin-phase07.spec.ts` (the master-data shot).

## Work items

Build in this order: types, pure rules, seed, store, then screens. **Session 1 ends after item 10,
green.**

1. **Types** (`src/domain/types.ts`; DM-38, US-13.4.1, US-11.4.1):
   - `Hospital`, `Surgeon`, `SurgeonRoom`, `SurgeonGroup` and `Insurer` gain
     `retiredAtISO?: IsoDate` and `retiredReason?: string`. Anaesthetists keep their existing
     `active` flag ("Inactive"); say so in the Decisions log rather than migrating it. The
     organisations master 18 keeps behind holders (`masters.organisations`, whatever 18 named its
     record type) gains the same two fields. AA's own `Modifier` rows gain them only if 19b gave
     modifiers no retire field.
   - New `PublicHoliday { id: PublicHolidayId; dateISO: IsoDate; name: string; kind: 'national' | 'regional'; region?: string; openHospitalIds: HospitalId[] }`.
     `openHospitalIds` lists hospitals that run as normal that day; every other hospital is closed.
     The `region` is a label ("Canterbury"), not a filter, because every AA hospital is in
     Christchurch.
   - `SeedMasters` / `AppState['masters']` gain `publicHolidays: Record<PublicHolidayId, PublicHoliday>`.
   - **The second-person check** (D34): 18's Contract version gains
     `linesCheck?: { checkedBy: string; checkedAtISO: IsoDateTime }` and
     `linesChangedBy?: string` (who last added, edited, removed or loaded a line on this version).
     Kept beside 18's and 19a's types in the pricing-model module, with a doc comment that it is
     OQ-100's default and not in the draft design.
   - New top-level slice `AppState.masterLoads: { loads: Record<MasterLoadId, MasterLoad>; goLive: GoLiveBatch | null }`,
     not persisted inside `masters` because a load is a work item, not master data. The types come
     from item 4 (`src/domain/masterLoad/types.ts`), re-exported here.
   - `ListConflict` (30) gains `publicHolidayId?: PublicHolidayId`. The cause key for a public
     holiday is `publicHoliday:<id>`, alongside 30's `holiday:<holidayId>`.
   - `allocateId` kinds in `ID_FORMATS`: `publicHoliday` (`PHN`, pad 3; the seed uses `PH001`),
     `insurer` (`INN`, pad 3), `masterLoad` (`ML`, pad 3) and `goLiveBatch` (`GL`, pad 2). Room,
     surgeon, surgeon group, holder, Contract, line, RVG group, procedure and modifier kinds exist
     from 17 to 19b; add one only where a phase did not.
   - `store/demoActors.ts` gains `SEED_LOAD_ACTOR` (`{ who: 'Developer seed load (simulated)', role: 'office', source: 'office' }`,
     office-shaped so it passes the same guards, named so nobody reads it as a person) and
     `SECOND_OFFICE_ACTOR` (`{ who: 'Second office user (simulated)', role: 'office', source: 'office' }`),
     each with a doc comment in the file's existing style.
2. **Pure rules** (new files, no React, each with a Vitest file beside it):
   - `src/domain/masterLifecycle.ts`: `isRetired(record)`; `activeOnly(records, keepId?)`, which
     keeps a retired record only when it is the current value, so an edit form never silently drops
     a stored hospital; `retireBlockers(kind, id, facts)` returns readable blocker sentences with
     counts. The caller fills `facts` from the store (the domain does not import the store):
     - **hospital:** upcoming non-AUTHORISED Lists and Draft Lists on or after the demo clock's
       today; active recurring bookings; membership of the generator's ad hoc set
       (`ADHOC_HOSPITALS`), worded as "New days are still scheduled here"; an active contract holder
       linked to it ("Retire its contract holder first: St George's Hospital, 1 active Contract");
       membership of 34's `INTEGRATED_HOSPITALS`, worded as "Hospital sync is set up here".
     - **surgeon:** upcoming Lists and Draft Lists; active recurring bookings; an active contract
       holder linked to the surgeon.
     - **room:** active surgeons linked to it (17 makes `roomId` required); an active rooms holder
       linked to it.
     - **group:** an active rooms holder linked to it (18's COS mapping).
     - **organisation:** active contract holders whose `billablePartyRef` names it (17's
       `SurgeonGroup` has no organisation field; if 17 or 18 added a group-to-organisation link,
       count it too).
     - **AA rooms** (31's `locationType: 'aaRooms'` row): never retired ("AA rooms is built in and
       cannot be retired."), as 31's handoff asks.
     - **insurer:** an active contract holder linked to it; upcoming non-AUTHORISED Bookings whose
       insurance indication (21) names it. The direct-claims flag is no blocker: it creates and holds
       nothing.
     - **AA modifier:** none; a retired modifier stays on Procedures that claimed it and leaves the
       picker (19b's picker reads `activeOnly`).
     There is no protected default Contract to except: No contract (RVG) has no holder and is never
     retired (18).
   - `src/domain/holidays.ts`: `closuresFor(dateISO, hospitalId, { hospitalHolidays, publicHolidays })`
     returns `Closure[]`, where `Closure` is `{ source: 'hospital'; holidayId; name } | { source: 'public'; publicHolidayId; name }`.
     `closuresIndex(masters)` builds the date-and-hospital map 30's `conflictFactsFor` reads, with a
     public holiday applied to every hospital not in `openHospitalIds`. Retired hospitals are still
     indexed, because a past List there still reads its closure. Tests: a public holiday closes every
     hospital; an open hospital is excluded; a hospital holiday and a public holiday on the same day
     give two closures; the index is stable for equal input.
   - Extend 30's `conflictFactsFor` and `expectedConflicts` to read `closuresIndex`. A public closure
     yields `{ kind: 'holiday', cause: 'publicHoliday:<id>', publicHolidayId }`. `describeConflict`
     reads "St George's is closed: Labour Day (public holiday)." **AA rooms** is a location row since
     31 (every List has one; "it may take a holiday like any location"), so a public holiday closes
     it too unless it is listed as open; the migration lists it in `openHospitalIds` only where the
     old per-hospital rows did not cover it, so its flags do not move either (seed, work item 3).
     Record the reading. Extend `conflicts.test.ts`.
   - **Every other holiday reader moves too.** Route each reader from the drift-check grep (28's
     generation path, the horizon advance, `addAnaesthetist`'s generation, 30's recurring-booking
     projection and conflict preview, 31's Draft List assignment warning and its recurring clash, and
     any other) through `closuresFor` / `closuresIndex` instead of `masters.holidays` alone. 31's
     warning reads "St George's is closed that day (Labour Day, public holiday)." for a public
     closure. A test per reader: with the per-hospital Labour Day rows gone, Labour Day still closes
     the hospital for that reader.
   - `linesCheck.ts` in the pricing-model module under `src/domain/billing/` (beside 19a's line rules;
     D34): `canCheckLines(version, actor)`
     returns a refusal when the version has no lines ("There are no lines to check."), is already
     checked, or `actor.who === version.linesChangedBy` ("A second person checks the lines: you
     changed them last."); `linesCheckState(version)` returns `'none' | 'notChecked' | 'checked'`
     for the UI. Tests for each.
3. **Seed** (`domain/seed/availabilityAndHolidays.ts`, `domain/seed/index.ts`; DM-38):
   - New `PUBLIC_HOLIDAYS`: `PH001` Labour Day Mon 26 Oct 2026 (national); `PH002` Canterbury
     Anniversary Day Fri 13 Nov 2026 (regional, "Canterbury"); `PH003` Christmas Day Fri 25 Dec 2026;
     `PH004` Boxing Day (observed) Mon 28 Dec 2026; `PH005` New Year's Day Fri 1 Jan 2027; `PH006`
     Day after New Year's Day (observed) Mon 4 Jan 2027; `PH007` Waitangi Day (observed) Mon 8 Feb
     2027. Every row has `openHospitalIds: []`, except that `HOSP.aaRooms` (31) is listed open on
     `PH001` and `PH002` if the old `HOSPITAL_HOLIDAYS` `flatMap` did not give it Labour Day and
     Canterbury Anniversary rows (check at the drift check; the set must not move). Only the first two fall inside today's canvas horizon
     (28's configurable horizon, four months in current practice, may reach further: count what it
     covers); the rest make the calendar look real and flag Lists if the presenter rolls the clock
     forward.
   - `HOSPITAL_HOLIDAYS` drops its per-hospital Labour Day and Canterbury Anniversary rows (for the
     original hospitals and 34's appended ones). It keeps only hospital-specific closures (30's
     `HH900`). Keep the `HH` id range for those.
   - `buildSeed` passes `publicHolidays` to `reconcileAllConflicts`. **The flagged-List set must not
     move:** every List flagged by a per-hospital Labour Day or Canterbury row before is flagged by the
     public holiday after. Only the cause key changes (`holiday:HH001` to `publicHoliday:PH001`).
     Regenerate the golden canvas fixture's conflicts column only, and assert that the flagged-id set
     equals the baseline from the drift check.
   - **Lines check state in the seed:** every seeded Contract version with lines is seeded as checked,
     `checkedBy` the seed's office name (`domain/seed/audit.ts`'s `OFFICE_NAME`, "Kirsty W.", a
     module-local constant at `60e2d1e`: export it rather than retyping the name) and
     `linesChangedBy` the seed load actor's name (the lines arrived in the go-live seed), except one
     upcoming version (the upcoming version 18 seeded, for example Doyle's) left **not checked** with
     `linesChangedBy: 'Kirsty W.'`, so the refusal and the second-person trigger are demoable at once.
     No figure moves.
   - Insurers: the seed keeps nib and AIA Health. More insurers are added by hand in the demo (the
     checklist's Southern Health Cover), so the seed does not grow.
   - Seed tests: the public holidays are present and sorted; no hospital holiday is named Labour Day
     or Canterbury Anniversary Day; the flagged set is unchanged; exactly one seeded version is not
     checked; two builds deep-equal.
   - Bump `PERSIST_VERSION` by one, with a comment line ("Phase 42: master public-holiday calendar
     replaces per-hospital statutory rows; retire fields on masters; lines check; masterLoads
     slice"), and extend `persistMigrate.test.ts`.
4. **Loader engine, pure** (`src/domain/masterLoad/`; US-13.4.3 AC1):
   - `csv.ts`: `parseCsv(text)` returns `{ header: string[]; rows: { rowNumber; cells: string[] }[] }`.
     It handles quoted cells, embedded commas and quotes, CRLF, a leading BOM, and blank trailing
     lines. `rowNumber` is the spreadsheet row, with the header as row 1. Tests for each case.
   - `types.ts`:
     - `LoadEntity` = `'hospitals' | 'hospitalHolidays' | 'publicHolidays' | 'surgeonRooms' | 'surgeons' | 'anaesthetists' | 'rvgGroups' | 'procedures' | 'modifiers' | 'contractHolders' | 'contracts' | 'contractLines' | 'contractEventFees'`:
       US-13.4.3's list (hospitals; surgeons and rooms; RVG groups and procedures with base units;
       modifiers; any Contracts, as holders, Contracts, lines and 39b's event fees), AR-29
       `data-loading`'s additions (anaesthetists, contract holders) and the two calendars.
     - `RowResult` = `{ rowNumber; cells; status: 'valid' | 'rejected'; reasons: string[]; key: string; fields? }`.
     - `MasterLoad` = `{ id; entity; source: { kind: 'sample'; sampleId } | { kind: 'file'; fileName }; header; headerErrors: string[]; rows: RowResult[]; status: 'staged' | 'loaded' | 'discarded'; stagedAtISO; stagedBy; loadedAtISO?; loadedRecordIds?: string[]; goLiveBatchId? }`.
     - `LoaderSpec<F>` = `{ entity; label; columns: { key; header; required; hint }[]; parseRow(cells, ctx): { fields: F } | { reasons: string[] }; keyOf(fields): string; existing(fields, masters): string | null; references?(fields, ctx): string[] }`.
       There are no row groups any more: one procedure is one row (the 2026-10-03 plan's Simple and
       Complex pairs belonged to the retired default RVG Contracts).
   - `validate.ts`: `validateSheet(spec, parsed, masters, ctx)`:
     - A missing required column rejects the whole sheet ("Missing column: Contact email"), and no
       row is valid.
     - A row with the wrong cell count is rejected ("Row has 3 cells; the sheet has 2 columns").
     - Otherwise each row goes through `parseRow`, and then:
       - a duplicate key within the sheet is rejected ("Duplicate of row 4");
       - a key already in master data is rejected ("Already in master data: edit it there"), because
         a load adds and never overwrites;
       - an unresolved reference is rejected (for example "No surgeons' room named Riverside Rooms",
         "No RVG group with system code HD-H3X", "No Contract with code or name SUR-0099").
       `ctx.pendingKeys` lets a row reference a record loaded earlier in the same go-live batch (a
       surgeon naming a room, a procedure naming a group, a Contract naming a holder, a line naming a
       Contract on the same batch's Contracts sheet).
     - Every reason for a row is collected, not only the first.
   - **Blank and zero** (AR-29 `null-handling` and `contract-versions`): in an optional numeric cell a
     blank means "not set, inherit" and `0` means zero. `parseOptionalNumber(cell)` is the one helper
     every spec uses; a test pins "", " ", "0", "0.0" and "-1".
   - **One set of rules.** Each spec's `parseRow` calls the same pure field validator the entity's
     manual create action uses. Extract those validators into `src/domain/masterValidation.ts` where
     they are not already pure (hospital name and email; hospital holiday; public holiday; room;
     surgeon; anaesthetist (26 and 28's fields)); for the pricing masters, **call the module's own
     validators** (19's group and procedure rules, 19a's `validateContractLine`, 18's
     `validateHolder` and Contract create validator, 19b's AA-modifier rules), never copy them. The
     store actions call them too, so a rejected row's reason is word for word the refusal the Add sheet
     shows. A parity test drives both paths for each refusal.
5. **Store: hospitals, insurers and retirement** (`src/store/mastersActions.ts`, 17's
   `surgeonActions.ts`; US-13.4.1, US-11.4.1). Every action is office only, goes through `mutate()`
   with before and after metas, and takes its timestamps from the demo clock.
   - `createInsurer(api, actor, { name, acceptsDirectClaims })` refuses a blank or duplicate name
     (case-insensitive) and audits `insurer.create`. It **creates no Contract and no holder**: an
     insurer's Contracts are set up under Contract holders (18). It takes no cover-split, rate or
     funding field (US-11.4.1: special rates are Contracts; the split is a Booking action, 22).
   - `editInsurer(api, actor, id, { name })` refuses a blank or duplicate name, and audits
     `insurer.update`. The direct-claims flag stays on `setInsurerDirectClaims` (minting nothing since
     18), which now also refuses a retired insurer.
   - **Renames follow through.** `editHospital` (17), `editInsurer`, and 17's surgeon, room and group
     edits also rename the linked contract holder when its name still equals the old name, in the same
     commit, audited `contractHolder.update`. A holder the office has renamed by hand is left alone.
     Raised invoices and 25's snapshots keep their names.
   - `retireMaster(api, actor, kind, id, reason)` and `reinstateMaster(api, actor, kind, id)` for
     `hospital | surgeon | surgeonRoom | surgeonGroup | insurer | organisation | aaModifier`:
     - retire refuses `notFound`, `alreadyRetired`, `reasonRequired`, `inUse` with
       `retireBlockers`' sentences joined, and (for `aaModifier`) an RVG-table row ("RVG modifiers
       are as printed and cannot be retired.");
     - reinstate refuses `notFound` and `notRetired`;
     - they audit `<kind>.retire` and `<kind>.reinstate`.
     No delete action is added for these masters.
   - `editAaModifier(api, actor, id, { factor, units, unitsAsPrinted? })` (19b's handoff): office
     only, 19b's AA-modifier rules, refuses an RVG-table row; audited `modifier.update`. The code is
     not editable (claims keep it). Claimed modifiers on Procedures keep their units until 25's
     snapshot locks them; an ACTIVE Procedure's M total follows the edit, as a group edit re-prices in
     19.
   - Every create and edit action for these masters, the List, Draft List and Booking write paths
     that take a hospital or surgeon, 18's holder-link writes and 21's insurance indication refuse a
     retired id ("St George's is retired"). The exception is when the value is unchanged, so editing
     an old List at a retired hospital still saves.
   - Tests (extend `mastersActions.test.ts`, `surgeonActions.test.ts` and 19b's modifier tests): the
     anaesthetist actor is refused everywhere; each refusal; `createInsurer` with direct claims on
     creates no Contract and no holder; the rename follow-through with a generated and a hand-edited
     holder name; each kind's retire blockers and reinstate (nib, linked to an active holder, is
     refused; an insurer named by an upcoming insurance indication is refused); a retired hospital
     refused by the List and Booking write paths but tolerated when unchanged; an RVG modifier refused
     by edit and retire.
6. **Store: the public-holiday calendar and the RVG time rule** (`src/store/mastersActions.ts`, 19's
   `rvgMasterActions.ts`; DM-38, US-13.4.1, US-05.2.2):
   - `addPublicHoliday(api, actor, { dateISO, name, kind, region?, openHospitalIds })` refuses
     `nameRequired`, `dateRequired`, `duplicatePublicHoliday` (same date) and `unknownHospital`.
     `editPublicHoliday(api, actor, id, patch)` has the same refusals plus `notFound`.
     `deletePublicHoliday(api, actor, id)` removes the row; the audit keeps the full before. They
     audit `publicHoliday.create`, `publicHoliday.update` and `publicHoliday.delete`.
   - Add `masters.publicHolidays` to 30's reconcile trigger list in `store/conflictReconcile.ts`. When
     a public holiday changes, reconcile the Lists on its old and new dates at every hospital. A
     change to `openHospitalIds` therefore raises or clears exactly the right flags. The actions return
     `{ flagged, resolved }` from the mutation result, in 30's `HolidaySheet` result-line shape.
   - `editRvgTimeRule(api, actor, rule)` (19a handed it here): office only, refused by 19a's
     `validateRvgTimeRule` with its sentences; the part interval always rounds up and a patch that
     changes it is refused ("A part interval always rounds up."). Audits `rvgTimeRule.update` with
     before and after. It re-prices Procedures with no 25 snapshot, on ACTIVE and SUBMITTED Lists;
     AUTHORISED Procedures and raised invoices keep their figures. The rule applies to recorded time
     only (there is no estimate).
   - Tests: with the clock rolled into range, the seeded Christmas Day (`PH003`) flags that day's
     Lists, and adding a second public holiday on the same date is refused
     (`duplicatePublicHoliday`); add a public holiday on a canvas weekday, and it flags the Lists; mark
     one hospital open, and its flags clear while the others stay; move the date, and the old flags
     clear and the new ones raise; delete, and everything clears; an office clear (30) on a
     public-holiday conflict holds only while the cause stands. The time rule: a valid edit changes an
     ACTIVE Booking's T units and not an AUTHORISED one; a malformed rule and a part-interval change are
     refused.
   **6a. Store: the second-person check** (D34; `src/store/contractActions.ts` beside 19a's line
   actions):
   - 19a's `addContractLine`, `editContractLine` and `removeContractLine`, and every loaded line
     (item 9), set the version's `linesChangedBy` to the actor's `who` and clear `linesCheck`, in the
     same commit. 39b's event-fee writes (add, edit, remove, load) do the same: an event fee is a
     priced term of the version, checked with its lines. 18's `createContractVersion` copies the
     lines (and event fees) and leaves the new version not checked, changed by the actor who made it.
   - `checkContractLines(api, actor, contractId)`: office only, refused by `canCheckLines`; writes
     `linesCheck` from the actor and the demo clock; audited `contract.linesChecked`.
   - The check never blocks pricing, invoicing or authorising (the default is a discipline, not a
     gate; OQ-100 may say otherwise). Log that reading.
   - Tests: Kirsty edits a line, then her check is refused; `SECOND_OFFICE_ACTOR` checks; editing a
     line clears it; a seed-loaded line (changed by `SEED_LOAD_ACTOR`) can be checked by Kirsty; a new
     version starts not checked; No contract (RVG) has no lines and no check state.
7. **Store: loads** (`src/store/masterLoadActions.ts`, exported from `src/store/index.ts`;
   US-13.4.3 AC1 and AC2):
   - `stageMasterLoad(api, actor, { entity, csvText, source })`:
     - it parses and validates against current masters and writes a `staged` `MasterLoad`;
     - it audits `masterLoad.stage` with `after: { entity, rows, valid, rejected, source }`;
     - it never writes `masters` or `contracts` (a test deep-equals them before and after);
     - it refuses `officeOnly`, an unknown entity and an empty sheet. A line naming a missing,
       retired or terms-locked Contract version is a rejected row, not a refused sheet;
     - staging a new load for an entity discards any earlier staged load for that entity
       (`masterLoad.discard`), so the Seed load view shows one live result per sheet.
   - `commitMasterLoad(api, actor, loadId)`:
     - it refuses `notFound`, `notStaged`, and `nothingToLoad` (zero valid rows);
     - it **re-validates** against current masters first. A row that has gone stale since staging
       (for example the same hospital added by hand in between) turns rejected with its new reason
       and is not loaded;
     - it then runs **one** `mutate()` whose recipe folds each valid row through the entity's create
       planner (item 9), in row order;
     - it writes one meta per created record, using the same action name as a manual create
       (`hospital.create`, `rvgGroup.create`, `procedureType.create`, `contractHolder.create`,
       `contract.create`, `contractLine.create` and so on) with `after` carrying `{ loadId, rowNumber }`,
       plus one `masterLoad.commit` summary meta;
     - calendar loads reconcile conflicts through 30's `mutate()` hook once, and the summary returns
       `{ flagged, resolved }`;
     - it marks the load `loaded` with `loadedRecordIds`;
     - if any planner refuses mid-fold (a bug, since the rows were just re-validated), the whole
       commit aborts and returns the refusal. It never partially loads.
   - `discardMasterLoad(api, actor, loadId)` audits `masterLoad.discard`.
   - The Seed load view and the triggers call these as `SEED_LOAD_ACTOR` (the developer's step), so
     the audit never shows Kirsty loading master data and loaded lines can be checked by Kirsty.
   - Tests: office-shaped actor only; stage never touches masters; commit loads exactly the valid rows
     and no rejected row; one commit, with the expected meta count; stale re-validation;
     `nothingToLoad`; a second commit is refused; ids are deterministic (two runs deep-equal, and the
     same sample after a Reset gives identical records, so a test load repeats); each loaded record's
     History shows "Loaded from spreadsheet, row N".
8. **Loader specs and sample spreadsheets** (`src/domain/masterLoad/specs/*.ts`,
   `src/domain/masterLoad/samples.ts`; US-13.4.3):
   - One spec per `LoadEntity`, each small. The columns are:
     - hospitals: Hospital name, Contact email; every loaded row is `locationType: 'hospital'` (AA
       rooms is 31's one built-in location row and is never loaded);
     - hospital holidays: Hospital, Date, Name (30's `addHospitalHoliday` rules: the hospital exists
       and is not retired, one closure per hospital and date), keyed on hospital and date;
     - public holidays: Date, Name, Kind (National or Regional), Region, Open hospitals (hospital
       names separated by ";"), with item 6's rules, keyed on the date;
     - surgeons' rooms: Room name, Contact email, Phone;
     - surgeons: Name, Specialty, Room, HPI CPN, NZ registration number (for information), keyed
       on the HPI CPN, with 17's HPI CPN normaliser, shape check and duplicate check across surgeons
       and anaesthetists;
     - anaesthetists: Name, HPI CPN, Unit value, GST period, Start date (the fields
       `NewAnaesthetistFields` takes as 26 and 28 left it; keyed on the HPI CPN; 28's start-date
       rule; each loaded anaesthetist gets 28's Slots through the one generation path);
     - **RVG groups** (US-05.1.1; [AR-30 · RVG group](../../../../requirements-board/requirements/artifacts/AR-30.md#rvg-group)):
       System code, Code, Name, Body section, Sub-heading, Base units, Range from, Range to, Modifier
       units, General procedure name. 19's `createRvgGroup` rules: a free system code, an existing
       body section (sections stay as the guide prints them), base units a whole number above 0, a
       range (both cells or neither) holding the figure (D35), modifier units blank (0) or a whole
       number of 0 or more. Each loaded group gets its general procedure in the same plan, named by
       19's `generalProcedureName` unless the sheet names it (D37). Keyed on the system code (the
       printed code is not a key: the guide prints two T2s);
     - **procedures** (US-05.1.6; [AR-30 · Procedure](../../../../requirements-board/requirements/artifacts/AR-30.md#procedure)):
       System code, Procedure name, RVG group (the group's system code), Subgroup, Base units,
       Modifier units. 19's `createProcedureType` rules: a name, an existing non-retired group, a
       subgroup, a free system code, no duplicate name in the group; Base units and Modifier units
       blank (inherit the group's) or a whole number of 0 or more (a 0 is a value). No default
       Contract, no Kind column, no pairs. No figure is checked against the NZSA guide, and none
       raises a warning (drift step 2);
     - **modifiers** (US-05.1.5): Code, Factor, Units, Units as printed. **AA's own rows only**, through
       19b's `addAaModifier` rules (a code that does not clash with another AA row; units a whole
       number of 0 or more). The RVG table is not a sheet in the prototype: it is already built from
       AR-34's files by 19b's generator, which is what the developer's seed would load. A test proves
       it: 19b's generated table, fed through the same `Modifier` shape into an empty masters state,
       deep-equals the seeded RVG rows, so nothing is ever re-transcribed;
     - **contract holders** (US-04.1.5; [AR-29 · Contract holder fields](../../../../requirements-board/requirements/artifacts/AR-29.md#contract-holder-fields),
       [AR-30 · Contract holder](../../../../requirements-board/requirements/artifacts/AR-30.md#contract-holder)):
       Name, Kind (Insurer, Hospital, Surgeon, Surgeon's rooms, Anaesthetist), Linked to (the insurer,
       hospital, room or group by name; a surgeon or anaesthetist by HPI CPN), Holder is billed (Yes or
       No), Billable party (a name; required when billed). The party type is derived from the kind (an
       anaesthetist holder is first party and never billed). 18's `validateHolder` sentences; AA
       rooms is never a holder's hospital (31), so a row linked to it is rejected with the rule 18
       and 31 left;
     - **Contracts** ([AR-29 · Contract fields](../../../../requirements-board/requirements/artifacts/AR-29.md#contract-fields),
       [AR-30 · Contract](../../../../requirements-board/requirements/artifacts/AR-30.md#contract)): Name,
       Holder (an existing holder's name, or one on the same batch's holders sheet), Valid from, Valid
       to, Review date, Invoice layout, Delivery method, Portal name (22's fields, optional where 22's
       `defaultInvoicingFor` gives a default), Combination (Yes or No, 23). 18's create validator with
       22's and 23's field rules. The AA code is never read from the sheet: 18's `nextAaCode` makes it
       at commit (D16). Refused: a row with no holder ("Every Contract needs a holder. No contract
       (RVG) is built in and is never loaded."), an unknown or retired holder, and a Contract whose
       name already exists for that holder ("Already in master data: add a new version there"). A
       Contract with no lines on the lines sheet loads as its holder's **plain RVG Contract** (D32,
       19a's predicate); the result panel says so per row ("Plain RVG: no lines");
     - **Contract lines** ([AR-29 · Contract line fields](../../../../requirements-board/requirements/artifacts/AR-29.md#contract-line-fields),
       [AR-30 · Contract line](../../../../requirements-board/requirements/artifacts/AR-30.md#contract-line)):
       Contract (an existing Contract's AA code or name, or the name of a Contract on the same batch's
       Contracts sheet), Procedure (system code), Holder code, Holder description, Fixed price (ex
       GST), Fixed rate, Fixed discount (%), Base units, Modifier units. Every pricing cell is
       optional: **a blank inherits and 0 means zero** (AR-29 `contract-versions`); a line that sets
       nothing is rejected with 19a's sentence. 19a's `validateContractLine` decides everything else
       (one line per procedure per version, an existing non-retired procedure, the field
       combinations it allows), and 18's `termsLocked` refuses a version that has started ("Its terms
       are locked: make a new version"). No RVG mapping, add-on, quantity, time band or line dates
       (19a removed them). Lines into a first-party Contract are its fixed prices (US-04.2.14; D42:
       the office keeps them afterwards);
     - **Contract event fees** (39b's handoff; US-13.4.3 "any Contracts"): Contract (as on the lines
       sheet), Event type (39b's preset types), Holder code, Fixed price (ex GST), with 39b's
       event-fee validator and create action and 18's `termsLocked`; keyed on Contract and event
       type. A Contract with event fees and no lines follows 39b's rule (its picker never offers a
       Contract on event fees alone), so the Contracts sheet's "Plain RVG: no lines" note uses 19a's
       plain RVG predicate as 39b left it, never a count of lines alone. Built only if 39b is DONE.
     Insurers, surgeon groups, recurring bookings, availability statuses, preferences and priority
     tiers, body sections and the RVG modifier table have no sheet (not on US-13.4.3's or AR-29's
     lists, or built from AR-34's files); they are maintained by hand or as printed. Dates are ISO `YYYY-MM-DD` or
     `d/m/yyyy` (both parsed, and anything else rejected with "Date must be a real date, for example
     2026-12-25").
   - `samples.ts`: `SAMPLE_SHEETS`, one bundled CSV string per entity, each
     `{ id, entity, fileName, label, csv }`. Each sample has two to six valid rows and three to five
     invalid ones, and every invalid row exercises a different refusal from that entity's validator.
     For example, the hospitals sample:
     - valid: "Rangiora Day Surgery, bookings@rangioraday.example" and "Ashburton Hospital,
       theatre@ashburton.example";
     - rejected, already in master data: "St George's";
     - rejected, name required: a blank name;
     - rejected, implausible email: "Timaru Surgical, not-an-email";
     - rejected, duplicate: a second Rangiora row.
     Use `.example` domains only. The others:
     - `public-holidays-2027.csv`: valid Good Friday Fri 26 Mar 2027, Easter Monday Mon 29 Mar 2027,
       ANZAC Day (observed) Mon 26 Apr 2027 and King's Birthday Mon 7 Jun 2027; rejected, the seeded
       Christmas Day's date, "31/02/2027", an unknown open hospital, a blank name;
     - `hospital-holidays.csv`: two valid hospital closures; rejected, an unknown hospital, a second
       closure on 30's `HH900` hospital and date, a bad date;
     - `surgeons.csv`: rejected rows include a malformed HPI CPN, a duplicate HPI CPN and an unknown
       room;
     - `anaesthetists.csv`: two valid rows; rejected, a duplicate HPI CPN, a start date in the past,
       a non-numeric unit value;
     - `rvg-groups.csv`: valid, two AA groups (one with a range "8 to 10" as Range from 8, Range to
       10, figure 8; one with a named general procedure); rejected, a zero base figure, a range not
       holding the figure, an unknown body section, a taken system code;
     - `procedures.csv`: valid, a procedure inheriting its group's figure (blank Base units), one with
       its own 10 ("Face-lift complex", the US-05.1.6 example) and one with its own 0; a figure that
       departs from the NZSA guide, which loads (AA's own figure) and is pinned as valid; rejected, an
       unknown group system code, a taken system code, a duplicate name in the group, a negative
       figure;
     - `modifiers.csv`: two AA rows (for example a weekend loading and a sitting position loading, as
       Vanessa's list will hold, with demo units); rejected, a code clashing with an AA row, a
       non-numeric unit, a blank factor;
     - `contract-holders.csv`: valid, a hospital holder billed to its hospital, a rooms holder not
       billed, and Dr Ngata's first-party holder (use a seeded anaesthetist who has no own Contract
       yet); rejected, a billed holder with no billable party, an anaesthetist holder marked billed,
       an unknown linked record;
     - `contracts.csv`: valid, a plain RVG Contract for the new hospital holder (no lines), a
       fixed-price rooms Contract and the first-party Contract; rejected, a blank holder, a retired
       holder, a Valid to before Valid from, a Contract name already held by that holder;
     - `contract-lines.csv`: lines into the batch's fixed-price Contract and the first-party
       Contract, one with only Base units (blank price, an override), one with Fixed rate, one with a
       Fixed discount; rejected, a second line for the same procedure, a line naming a started
       version of a seeded Contract (terms locked), an unknown procedure, a line that sets nothing;
     - `contract-event-fees.csv` (if 39b is DONE): one valid fee into the batch's fixed-price
       Contract; rejected, an unknown event type, a second fee for the same type on that version, a
       fee on a started version (terms locked).
     Write the fixture rows against the masters as 17 to 39b left them, and pin each sample's valid
     and rejected counts in a test.
   - The samples live in `src/domain` so the trigger registry (inside the PWA import closure) can
     import them. They are demo fixtures, not seed: nothing loads them at build time.
9. **Create planners, one path** (store; the refactor that keeps loads inside the guards):
   - Extract the body of each create action the loader targets into a pure planner:
     `planHospitalCreate(state, fields)`, `planHospitalHolidayCreate`, `planPublicHolidayCreate`,
     `planSurgeonRoomCreate`, `planSurgeonCreate`, `planAnaesthetistCreate` (with 28's Slot
     generation), `planRvgGroupCreate` (with its general procedure), `planProcedureTypeCreate`,
     `planAaModifierCreate`, `planContractHolderCreate`, `planContractCreate` (with 18's AA code and
     22's invoicing default), `planContractLineCreate` (setting `linesChangedBy`, clearing the
     check) and `planContractEventFeeCreate` (39b's create, the same check rule).
   - Each returns `{ state: nextSlices, metas }` or a refusal, and includes the id allocation. Where a
     phase already extracted a planner, reuse it.
   - The single-record actions become `validate, plan, mutate`, with behaviour and audit unchanged
     (their existing tests prove it). `commitMasterLoad` folds the same planners.
   - A Contract loaded with lines in the same batch is created first and its lines fold after it, in
     the same commit; its version starts not checked, changed by `SEED_LOAD_ACTOR`.
   - No planner touches the price resolver or the fee path: loading changes masters only, and 19's,
     19a's and 24's pricing reads them as for a hand-made record.
10. **Go-live batch, pure and store** (`src/domain/masterLoad/solutionsPlus.ts`,
    `src/domain/masterLoad/goLive.ts`, `src/store/goLiveActions.ts`; US-13.4.2, US-13.4.3 AC3):
    - `solutionsPlus.ts`:
      - `SOLUTIONS_PLUS_OPERATIONS`, the fixture: about 14 rows of `{ scanRow, name, spUnits }`
        transcribed from a printed list. `spUnits` is kept only to be shown struck through.
      - The rows include junk:
        - "10% discount" (the catalogue's example);
        - "DO NOT USE - old code";
        - "Test op";
        - "Misc";
        - an upper-case, trailing-space duplicate of "Laparoscopic cholecystectomy";
        - one name already in 19's procedure list.
      - `junkReason(name)` returns "Looks like a pricing note, not an operation" for a percent sign or
        the word discount, and "Marked not for use" or "Not an operation" for the other patterns.
      - `normaliseOperationName(name)` folds case, whitespace and punctuation. A candidate whose
        normalised name repeats an earlier scan row is junk with the reason "Duplicate of scan row N".
      - Fixture counts, pinned in a test and quoted by the trigger message and the checklist: 14
        rows, 5 junk ("10% discount", "DO NOT USE - old code", "Test op", "Misc", the duplicate), 2
        not approved, 1 already in the procedure list, and the rest approved.
      - Tests for each pattern and for the duplicate.
    - `goLive.ts`:
      - `GO_LIVE_PACK` = the Solutions Plus list plus eight controlled sheets, in load order:
        surgeons' rooms, surgeons (referencing those rooms), RVG groups (one AA group), procedures (as
        AA fills it from the approved names, each in one group, most inheriting the group's figure),
        contract holders (one rooms holder), Contracts (one fixed-price Contract for that holder and
        one plain RVG Contract), Contract lines (into the fixed-price Contract by name) and public
        holidays for 2027 (the calendar, Greg's point 40). A read-only card lists the RVG modifier
        table as "NZSA RVG 2021 modifier table · from AR-34's files · already seeded", so the pack
        names every master US-13.4.3 lists without re-transcribing one.
      - `GoLiveCandidate` = `{ scanRow; name; spUnits; decision: 'approved' | 'notApproved' | 'junk'; reason? }`.
        The fixture carries AA's recorded decisions: most approved, two not approved ("No longer
        performed by AA members", "Replaced by a newer operation name"), and junk set by `junkReason`
        and by the duplicate rule.
      - `evaluateGoLive(batch, masters)` joins each candidate to the procedures sheet by normalised
        procedure name. It returns one outcome per candidate: `loads`, `notApproved`, `junk`,
        `noControlledRow` ("Needs a procedure row with its RVG group in the controlled spreadsheet"),
        `alreadyInMaster`, or `controlledRowRejected` (with the sheet's reasons).
      - A procedures-sheet row with no Solutions Plus candidate loads as an AA addition, because
        names can come from AA as well.
      - A procedures-sheet row whose candidate is not approved or junk is rejected ("Not approved
        for go-live"), and so is any line on the lines sheet naming that procedure.
      - **Solutions Plus units are never read** into anything that loads. A test gives the fixture
        units that differ from the controlled sheet and from the group, and asserts each loaded
        procedure's resolved starting base units (19's resolver) equal the controlled sheets' (its own
        figure, else its group's).
    - `goLiveActions.ts`:
      - `stageGoLiveLoad(api, actor)` creates the `GoLiveBatch` (`{ id, candidates, loadIds, status, stagedAtISO, stagedBy, loadedAtISO? }`),
        stages each controlled sheet as a `MasterLoad` with `goLiveBatchId`, validating in pack order
        with `pendingKeys`, and audits `goLive.stage`. It refuses while a batch is already staged.
      - `setGoLiveApproval(api, actor, scanRow, approved, reason?)` refuses a junk row ("Junk is
        excluded and cannot be approved") and audits `goLive.approve` or `goLive.unapprove`. It
        re-runs the procedures sheet's (and the lines sheet's) validation, so the join outcomes follow
        at once.
      - `commitGoLiveLoad(api, actor)` runs one `mutate()` that folds every sheet's valid rows in
        pack order through the item 9 planners. Procedure rows are included only when
        `evaluateGoLive` says `loads`. It marks every load and the batch `loaded`, and audits
        `goLive.commit` with the counts (loaded by sheet, Solutions Plus entries not loaded).
      - `discardGoLiveLoad(api, actor)`.
      - All four act as `SEED_LOAD_ACTOR`, except approvals, which are AA's decision: they act as the
        Admin app's actor (Kirsty).
    - Tests (`goLive.test.ts`, `goLiveActions.test.ts`):
      - each outcome;
      - an unapproved candidate never appears in the procedure list (US-13.4.2 AC1);
      - loaded fields come only from the controlled sheets (US-13.4.2 AC2): base units on the group
        or the procedure, none from Solutions Plus, and no Contract created other than the sheet's;
      - "10% discount" is excluded and cannot be approved (US-13.4.3 AC3);
      - un-approving a row before commit removes it and its lines from the load;
      - rooms load before the surgeons that reference them, the group before its procedures, the
        holder before its Contracts and the Contract before its lines;
      - one commit, and nothing partial on a planner refusal;
      - Reset then stage and commit again gives identical records (US-13.4.3 AC2, the repeatable test
        load).

    **Session 1 ends here, green:** `npm run build`, `npm run build:pwa` and `npx vitest run`, with
    every existing Master data view still rendering, and the flagged-List set unchanged.

11. **One pattern for every view** (`apps/admin/screens/masters/`; US-13.4.1 "in one place"):
    - `masterViews.ts`, a registry the sub-nav renders from:
      `{ view; label; group: 'People and places' | 'Schedule' | 'Billing' | 'Settings' | 'Go-live'; catalogueRows: string[]; add: boolean; edit: boolean; retire: boolean; remove: boolean; seeded?: LoadEntity[] }`.
      `seeded` lists the sheets that load this master at go-live; it drives the subtitle line and the
      sample trigger's choices, never a button.
    - The groups:
      - People and places: Anaesthetists (seeded: anaesthetists), Hospitals & holidays (seeded:
        hospitals, hospital holidays), Surgeons (seeded: surgeons), Surgeons' rooms (seeded: rooms),
        Surgeon groups, Insurers, and Organisations (18's surviving master);
      - Schedule: Recurring bookings (30's view and id), Availability statuses (29's), Public
        holidays (seeded: public holidays);
      - Billing: Contract holders (18; seeded: contract holders), Contracts (seeded: Contracts,
        Contract lines, Contract event fees), Procedures (19; seeded: procedures), RVG groups (19, with 19a's time rule
        panel; seeded: RVG groups), Modifiers (19b; seeded: modifiers);
      - Settings: Xero & archiving;
      - Go-live: Seed load, Go-live load (both demo-badged).
    - The `?view=` param and the existing view ids are kept.
    - **One label.** The area is "Master data" in every heading, subtitle and caption. App copy never
      says "reference tables" or "reference data" (Greg, 2026-10-02 #39).
    - `MasterViewChrome.tsx` holds the shared pieces:
      - `MasterHeader`: title, one-line subtitle, count and the primary teal "Add ..." action; where
        `seeded` is set, the subtitle ends "Loaded once at go-live from AA's controlled spreadsheet,
        then kept here by hand.";
      - `ShowRetiredToggle`: off by default; retired rows render in mist with a neutral "Retired" pill
        and the reason in its title;
      - `RetireSection`, for the foot of an edit sheet: "Retire" with a required reason, showing
        `retireBlockers` as a warning list when refused, or "Reinstate";
      - `LoadResultBanner`: on a seeded view, a one-line banner while a seed load for that entity is
        staged ("A seed load for this list is waiting: Open Seed load").
    - Refit every view to it, including 17's, 18's, 19's, 19b's, 29's and 30's.
      - Drop any remaining "view only" or "read only" subtitle.
      - Views with retire use `RetireSection` in their existing sheet (18, 19, 29 and 30 keep their
        own retire actions, restyled to the same section).
      - Rows referenced by nothing keep their delete: hospital holidays and public holidays.
    - Test (`masterViews.test.ts`): each row of US-13.4.1's list maps to a view with `add` and
      `edit`:
      - hospitals with contact email;
      - surgeons;
      - surgeon groups;
      - surgeons' rooms;
      - insurers;
      - anaesthetists;
      - availability statuses (the catalogue's "Slot availability statuses");
      - recurring bookings;
      - the master public-holiday calendar;
      - hospital calendars;
      - RVG codes and groups (the RVG groups view);
      - modifier codes;
      - Contracts.
      Every masters view that retires declares `retire`. Every `LoadEntity` is named by at least one
      view's `seeded`. No office view renders a load action (asserted).
    - MasterData publishes the current view with `useDemoTriggerContext('masters.view', view)`, and
      18's Contract detail publishes the open version with `useDemoTriggerContext('contracts.version', id)`
      if 18 did not already publish one. Add the keys to `DemoContextValues`.
12. **Insurers, Hospitals & holidays, Public holidays, Modifiers, the time rule and the lines check**
    (US-11.4.1, US-13.4.1, DM-38, US-05.1.5, US-05.2.2):
    - **Insurers** (rebuilt):
      - a table with columns Name, Accepts direct claims (Yes / No), Contracts (count of active
        Contracts held by holders linked to the insurer, linking to Contracts filtered by those
        holders), and Status;
      - "Add insurer" and a row "Edit" open `InsurerSheet` (name, and an "Accepts direct claims"
        switch, with the caption "Turning this on creates no Contract."). Under it, one line: "Set up
        the insurer's Contracts under Contract holders. Most are plain RVG Contracts billed to the
        insurer." with a teal text action "Set up as a contract holder" that opens 18's holder panel
        prefilled (kind Insurer, linked to this insurer, holder is billed, billable party the
        insurer), shown only when no holder is linked. The sheet ends with `RetireSection`;
      - the subtitle reads "Insurers that accept direct claims are invoiced through their own
        Contracts. A split with the patient is made on the Booking.";
      - `InsurerSheet` has no split, rate or funding field;
      - hook: `data-shot="masters-insurers"`.
    - **Hospitals & holidays:**
      - 17's `EditHospitalSheet` gains `RetireSection`, and a rename shows "Its contract holder is
        renamed too" when item 5's rule applies;
      - each hospital card gains a "Public holidays" line: "Closed on all public holidays", or "Open
        on Labour Day" when listed;
      - 30's month calendar shows public holidays as closures in the `status/holiday` tint, labelled
        with the name and "Public holiday". They are read-only there, with a link to the Public
        holidays view;
      - the hospital's own pills and `HolidaySheet` are unchanged;
      - the header subtitle names both calendars.
    - **Public holidays** (new view, group Schedule):
      - a table with columns Date (mono, with weekday), Name, Kind (National / Regional ·
        Canterbury), Applies to ("All hospitals", or "All except Christchurch Public"), and Lists
        affected (a count of Lists currently flagged by it);
      - "Add public holiday" and a row "Edit" open `PublicHolidaySheet`, modelled on 30's
        `HolidaySheet` (date, name, kind, region, "Open that day" hospital chips). Delete sits behind
        a confirmation that states the flag count;
      - result lines use 30's shape: "Public holiday added. 10 Lists flagged." and "Christchurch
        Public marked open. 2 flags cleared.";
      - hook: `data-shot="masters-public-holidays"`.
    - **Modifiers** (19b's view): AA rows gain "Edit" (`editAaModifier`) and `RetireSection`; RVG rows
      show a neutral "NZSA RVG 2021" pill and no edit ("As printed in the RVG").
    - **RVG time rule** (19a's read-only panel, `masters-rvg-time-rule`): an "Edit" action opens
      `RvgTimeRuleSheet`: one row per tier (from minute, interval minutes; add and remove a tier),
      "A part interval always rounds up." as a read-only line, a live preview of `describeTimeRule`
      and worked examples (95 and 125 minutes), and Save calling `editRvgTimeRule` with its refusal
      sentences inline. `data-shot="rvg-time-rule-sheet"`. First in the trim order.
    - **The lines check** (18's Contract detail, beside 19a's lines grid): a line under the grid reads
      "Checked by Kirsty W. on 21 Jul 2026", or a neutral "Not checked" pill with "A second person
      checks these lines against the holder's price list." and a teal "Mark lines checked"
      (`checkContractLines`; its refusal inline). The one provisional note sits here (Decisions and
      questions above). The catalogue's Contract rows gain the same "Not checked" pill.
      `data-shot="contract-lines-check"`.
13. **Seed load view** (`apps/admin/screens/masters/SeedLoadView.tsx`, group Go-live,
    `apps/admin/screens/masters/LoadResultPanel.tsx`; US-13.4.3 AC1 and AC2):
    - Header: "Seed load". Subtitle: "AA's controlled spreadsheets, checked and loaded once before
      go-live. Every row is checked with the same rules as adding it by hand." A `DemoBadge` reads
      "Demo stand-in: in the real system a developer runs this load; the office never sees this
      screen." One more line states D34: "There is no Contract schedule upload in the first release;
      Contracts are kept by hand after the seed."
    - A list of the thirteen sheets in load order (rooms, surgeons, anaesthetists, hospitals, hospital
      holidays, public holidays, RVG groups, procedures, modifiers, contract holders, Contracts,
      Contract lines, Contract event fees; twelve if 39b's sheet was dropped), each row with its
      columns (required ones marked), "Download template" (a
      header-only CSV built client-side as a Blob, no fetch), a `.csv` file input (FileReader text
      passed to `stageMasterLoad` as `SEED_LOAD_ACTOR`, source `file`) and its last result. The
      lines row carries the hint "A blank cell inherits from the procedure or the RVG group; 0 means
      zero."; the procedures row "Leave Base units blank to use the RVG group's figure."
    - `LoadResultPanel`, shared with the go-live view:
      - a summary line (hospitals.csv: "6 rows · 2 valid · 4 rejected");
      - an Admin Review style table with columns Row (mono), the spec's key columns, Result (a
        success-tint "Valid" or error-tint "Rejected" pill, always with its word), and Reasons (one
        per line); a Contract row with no lines shows a neutral "Plain RVG" note;
      - "Only rejected" filter chips;
      - a teal "Load 2 valid rows" and a secondary "Discard".
      After a load, the summary reads "Loaded 2 rows on 21 Jul 2026 · 4 rejected rows were not
      loaded" (a calendar load adds "· 6 Lists flagged"; all counts are computed), and each row links
      to its record in its office view (the surgeon profile, the holder panel, the Contract detail,
      the procedure's sheet).
    - "Repeatable for a test system" footnote: "Reset the demo and load the same sheets again: the
      records come back identical."
    - Hooks: `data-shot="seed-load"`, `data-shot="master-load-result"`.
14. **Go-live load view** (`apps/admin/screens/masters/GoLiveLoadView.tsx`, group Go-live; US-13.4.2,
    US-13.4.3 AC3):
    - Header: "Go-live load". Subtitle: "A clean cut from Solutions Plus. Only data AA has approved is
      loaded, and it comes from AA's controlled spreadsheets. Nothing comes across because it exists
      in Solutions Plus." A `DemoBadge` reads "Demo: loads into today's master data; at go-live the
      masters start empty."
    - Empty state (no batch): one paragraph on the clean cut and a pointer to the Demo actions menu.
    - **Summary tiles** (Admin Review four-tile row): Will load (by sheet), Solutions Plus entries not
      loaded, Spreadsheet rows rejected, Approved names.
    - **Solutions Plus operation list (names only):**
      - a table with columns Scan row (mono), Operation name, Solutions Plus units (struck through in
        mist, with the column caption "Not used"), AA decision, Controlled spreadsheet, and Result;
      - AA decision is a pill: Approved, Not approved with reason, or Excluded with the junk reason;
      - Controlled spreadsheet shows the procedure's RVG group code (mono) and its starting base units
        ("6 from H3", or "10" where the procedure sets its own), or "No row";
      - Result is "Loads" or "Not loaded" with the reason;
      - non-junk rows have an Approve / Unapprove toggle (`setGoLiveApproval`). On junk rows the toggle
        is disabled, with the reason as its tooltip;
      - hook: `data-shot="go-live-candidates"`.
    - **Controlled spreadsheets:** one collapsible card per sheet in pack order, each with its counts
      and a `LoadResultPanel` without its own Load button, plus the read-only RVG modifier table card.
    - Actions: a teal "Load approved data" (`commitGoLiveLoad`) and a secondary "Discard". The result
      line reads, for example, "Loaded 3 rooms, 5 surgeons, 1 RVG group, 7 procedures, 1 contract
      holder, 2 Contracts with 4 lines and 4 public holidays. 9 Solutions Plus entries were not
      loaded.", with links to each view. The counts are computed, never typed in; the fixture's are
      pinned in `goLive.test.ts` (item 10).
    - A caption under the candidate table states the clean-cut rule (US-13.4.3): "Solutions Plus
      identifiers and unit values are not carried over. Only operation names are used."
    - Hook: `data-shot="masters-go-live"`.
15. **Audit labels and narrative** (`shared/audit/actionLabels.ts`, `auditNarrative.ts`, and
    `fieldLabels.ts` where fields are new):
    - Hospitals and insurers:
      - `hospital.retire` "Hospital retired";
      - `hospital.reinstate` "Hospital reinstated";
      - the same pair for surgeon, surgeon room, surgeon group, insurer, organisation and AA modifier;
      - `insurer.create` "Insurer added" and `insurer.update` "Insurer updated";
      - `modifier.update` "Modifier changed".
    - Public holidays:
      - `publicHoliday.create` "Public holiday added";
      - `publicHoliday.update` "Public holiday changed";
      - `publicHoliday.delete` "Public holiday deleted".
    - Time rule: `rvgTimeRule.update` "RVG time rule changed", narrated through `describeTimeRule`
      before and after.
    - Lines check: `contract.linesChecked` "Contract lines checked".
    - Loads:
      - `masterLoad.stage` "Spreadsheet checked";
      - `masterLoad.commit` "Spreadsheet loaded";
      - `masterLoad.discard` "Spreadsheet discarded".
    - Go-live:
      - `goLive.stage` "Go-live load prepared";
      - `goLive.approve` and `goLive.unapprove` "Go-live name approved" and "Go-live name not
        approved";
      - `goLive.commit` "Go-live data loaded".
    - The narrative renders `{ loadId, rowNumber }` on a create meta as "Loaded from spreadsheet,
      row 3", and a public-holiday conflict as 30's describeConflict text.
    - Extend `auditNarrative.test.ts`.
16. **Pickers offer active masters only** (US-13.4.1 "referenced by identity"):
    - Add `activeHospitals`, `activeSurgeons`, `activeRooms`, `activeGroups`, `activeInsurers` and
      `activeAaModifiers` selectors in `store/selectors.ts`, built on `activeOnly(records, keepId)`.
    - Route every picker from the drift-check grep through them: `EditListSheet`, `PhoneAdviceBooking`,
      30's recurring-booking sheet, the Draft List and assignment flows (31), 18's holder-link picker,
      17's surgeon room select and `SurgeonSelect`, 21's insurance-indication picker, the
      matching-screen create actions (33), and 35's admin Booking editor if it picks a hospital or
      surgeon. `activeHospitals` filters retirement only; the pickers that 31 made exclude AA rooms
      (18's holder link, the feed and sync pickers) keep that filter on top.
    - Confirm 20's Contract picker hides a Contract whose holder is retired (keeping it, labelled,
      when it is the Procedure's current Contract); add it here only if 20 did not. No contract
      (RVG) is always offered first.
    - A retired current value shows as "St George's (retired)".
    - Display paths (grid, drawer, invoices, history, profile, 25's snapshots) keep resolving retired
      names unchanged.
    - Tests: a retired hospital is absent from a fresh picker and present, labelled, when it is the
      current value; a retired insurer is absent from a fresh insurance-indication picker; a retired
      AA modifier is absent from 19b's picker and still listed on a Procedure that claimed it.
17. **Demo triggers** (`src/shared/demoTriggers/registry.ts`; bodies call the item 6a, 7 and 10
    actions; see the table below). Update the registry tests that assert entries per route. Add
    nothing to the Control Panel page; its index lists the entries under "Admin · Master data"
    automatically.
18. **Shots and hooks** (`visual/admin-phase07.spec.ts`, or a new `visual/admin-masters-loads.spec.ts`):
    - the Insurers view and `InsurerSheet`;
    - Public holidays;
    - the hospital calendar with Labour Day;
    - the Seed load view, a staged hospitals load with its result panel, and the loaded state;
    - a staged procedures load (blank, own and 0 figures) and a staged Contract lines load (blank
      inherits);
    - the lines check, not checked and checked;
    - the time rule sheet;
    - the go-live view before and after "Load approved data".
    Keep the existing master-data shot green; move its hooks if 17 to 19b moved them.
19. **Copy sweep and demo guide.**
    - Grep the app for copy these masters make stale:
      - "view only" and "read only" on Master data;
      - any "full set loads at go-live" or similar (19's RVG groups subtitle) becomes "At go-live, the
        RVG groups and procedures load once from AA's controlled spreadsheet.";
      - any "default RVG Contract", "protected default" or "default Type 1" in Master data copy (18 and
        19a should have removed them; anything left is a bug to fix here);
      - "reference tables" or "reference data" anywhere in app copy (one label: "Master data");
      - "Load from spreadsheet" on any office view;
      - "slot" in any new or touched Master data string (D14);
      - any "Phase 42" string in rendered copy.
    - No en or em dash in any new string.
    - Then the demo guide updates below.

## Demo triggers

| id | Label | Screen (routes) | Surfaces | Effect | Disabled when |
|---|---|---|---|---|---|
| `load-sample-spreadsheet` | Load sample spreadsheet | Admin · Master data (`/admin/masters`) | bar | `when`: the published `'masters.view'` is Seed load, or a view whose `seeded` is set in `masterViews.ts`. `choices`: on Seed load, every `SAMPLE_SHEETS` entry; on another view, that view's sheets, labelled by file name (Hospitals & holidays offers "hospitals.csv" and "hospital-holidays.csv"; Contracts offers "contracts.csv", "contract-lines.csv" and "contract-event-fees.csv"; Procedures "procedures.csv"; RVG groups "rvg-groups.csv"; Contract holders "contract-holders.csv"; Public holidays "public-holidays-2027.csv"). `run`: `stageMasterLoad` as `SEED_LOAD_ACTOR` (the developer's step), with source `{ kind: 'sample', sampleId }`. It stages and does not load, so the presenter shows the rejected rows on Seed load and then presses the product's own "Load N valid rows". Message: "hospitals.csv checked: 2 rows valid, 4 rejected. Open Master data, Seed load, and press Load." | a staged load for this sheet already exists ("A load is already waiting for this sheet; load or discard it first") |
| `go-live-data-load` | Go-live data load (demo) | Admin · Master data (`/admin/masters`, any view) | bar | `run`: `stageGoLiveLoad` as `SEED_LOAD_ACTOR`. The Master data sub-nav's Go-live load item gains a warn dot while a batch is staged, and every view shows a one-line banner, "A go-live load is ready to review", with an "Open" link that sets `?view=goLive`. The presenter approves or un-approves names and presses the product's "Load approved data". Message: "Go-live load prepared: 14 Solutions Plus names (5 excluded as junk, 2 not approved) and 8 controlled spreadsheets. Open Master data, Go-live load." | a batch is already staged ("A go-live load is already waiting; load or discard it first") |
| `second-person-checks-lines` | A second person checks these lines (demo) | Admin · Master data, Contracts with a Contract version open (`/admin/masters?view=contracts`, context `'contracts.version'`) | bar | `run`: `checkContractLines` as `SECOND_OFFICE_ACTOR` on the open version. Stands in for the second office user Kirsty cannot be. Message: "Lines checked by a second office user (simulated)." | no version open; the version has no lines; it is already checked ("These lines are already checked") |

`indexPath`: `/admin/masters?view=seedLoad` for the sample loader, `/admin/masters?view=goLive` for
go-live and `/admin/masters?view=contracts` for the check (use the real view ids). All three are bar
only. Their bodies and fixtures live in `src/shared` and `src/domain`, so `pwaPurity.test.ts` still
passes.

**Normal use, no button:** adding, editing, retiring and reinstating every master; the public-holiday
calendar; editing AA's modifiers; editing the RVG time rule; Kirsty's "Mark lines checked" on lines
someone else changed (the seed-loaded lines, for example); loading a real CSV on Seed load; approving
go-live names; "Load N valid rows"; and "Load approved data".

**PWA:** none. Master data and loads are Admin-only, the PWA has no Admin, and no mobile beat waits on
master data. A retired hospital, surgeon or AA modifier simply stops appearing in the anaesthetist's
pickers through item 16.

## Out of scope

- **A Contract schedule upload** (US-04.2.13, Future Work; D34): no in-app upload of a holder's
  schedule, no delta or full overwrite, no preview of new, changed and removed lines, no control
  totals. The seed load is separate from it (US-13.4.3). If OQ-100 brings it into the first release,
  it needs its own phase.
- **Any office "Load from spreadsheet" action.** The seed is a developer's one-off step (US-13.4.3);
  the office edits by hand. The Seed load view is a demo stand-in, badged as such.
- **Excel (`.xlsx`) parsing.** Controlled spreadsheets are saved as CSV; record the reading.
  Mapping arbitrary column names is out too: the template's headers are the contract.
- **Updating existing records from a load, or deleting by load.** A load only adds; a price review is
  18's New version, by hand.
- **Loads for insurers, surgeon groups, recurring bookings, availability statuses, preferences and
  priority tiers, body sections, and 31's request sources.** They are on neither US-13.4.3's nor
  AR-29's list, and each is maintained by hand in its view (body sections stay as the guide prints
  them; 31's request sources stay code-held, a candidate master noted for Phase 44). Recurring
  bookings are the "calendar schedules" the room left unclear: hand-made here, logged for the owner.
- **Loading the RVG modifier table from a sheet, or transcribing the full NZSA RVG.** The modifier
  table is built from AR-34's files (19b); the RVG groups sheet's go-live rows are AA additions and a
  handful of demo rows, and the full NZSA group set is narrated ("the full set loads the same way"),
  not transcribed here. Note it for the owner.
- **No contract (RVG) and default Contracts.** No contract (RVG) is the one built-in default (18) and
  is never loaded; there are no hospital, insurer or procedure default Contracts to load (OQ-78).
- **Loading patients, Bookings, invoices, balances or anything transactional from Solutions Plus.**
  The clean cut excludes them; the go-live view says so in its subtitle.
- **Any Solutions Plus identifier** (US-13.4.3 takes names only; OQ-51 was deleted unanswered).
- **An insurer cover split, rate or funding field on the insurer row.** The split is a Booking action
  (Phase 22); special rates are insurer-held Contract lines (19a); the insurance indication is 21's.
- **Changing the time rule's rounding.** A part interval always rounds up; the editor changes tiers
  only.
- **The second-person check as a gate.** It records who checked; it blocks nothing (D34's default).
- **Editing the hospital sync set-up** (34's `INTEGRATED_HOSPITALS` and its fixture). It is
  integration configuration, not a US-13.4.1 table. It stays code-held; a hospital in it cannot be
  retired (item 2).
- **Public holidays on the anaesthetist's mobile or web availability calendar** (29). Note it for
  Phase 44 if the demo wants it.
- **Scale:** timing a full-size load and the full-scale dataset are Phase 43's. The loader's pure
  validator is the seam 43 can time.
- **The S1 to S5 rewrite** (Phase 44). This phase adds an optional beat only.

## Manual test checklist

The agent runs every item itself in the running app and reports it with evidence; none is handed
to the owner (ROADMAP.md "Owner review: agents test themselves").

- [ ] Admin, Master data: the sub-nav is grouped (People and places, Schedule, Billing, Settings,
      Go-live), every view has the same header, no office view offers "Load from spreadsheet", seeded
      views say "Loaded once at go-live from AA's controlled spreadsheet, then kept here by hand.",
      and no Master data copy says "view only", "reference tables", "reference data", "default RVG
      Contract", "protected default" or "slot".
- [ ] Insurers: add "Southern Health Cover" with direct claims on. It appears with Yes and 0
      Contracts; Contracts and Contract holders show nothing new (no Contract was created). Use "Set
      up as a contract holder": 18's holder panel opens prefilled; save it, then add a plain RVG
      Contract with no lines under it, and the insurer's Contracts count reads 1. Rename the insurer:
      the holder's name follows. Try to retire nib: refused, "Retire its contract holder first". Retire
      a fresh insurer with no holder and a reason: it greys out under "Show retired" and leaves the
      insurance-indication picker on a Booking. The Insurer sheet has no split, rate or funding field.
- [ ] Hospitals & holidays: rename a hospital, and the Day grid, List drawer, Booking detail and the
      holder's name show the new name, while an already-raised invoice keeps the old addressee. Try to
      retire St George's: refused, with upcoming List, recurring booking and contract holder counts.
      Retire a hospital with no upcoming work and no active holder (add one by hand first: every
      seeded hospital has a holder from 18): accepted, gone from Edit list and phone advice, and any
      List placed there before retiring still shows its name. Reinstate it. AA rooms refuses Retire
      ("AA rooms is built in and cannot be retired.").
- [ ] Public holidays: seven rows from Labour Day to Waitangi Day (observed). Labour Day shows "Lists
      affected" equal to the count flagged before the phase. The hospital calendar for October shows
      Labour Day as a public-holiday closure. No hospital's own pills list Labour Day any more.
- [ ] Labour Day still reaches every holiday reader: the Day grid on Mon 26 Oct shows the same
      flagged Lists as before, and assigning a Draft List (31) at St George's that day warns "St
      George's is closed that day (Labour Day, public holiday)." Advancing the horizon (clock) raises
      no flag on a hospital marked open.
- [ ] Edit Labour Day and mark Christchurch Public open: the result line clears its flags, and the
      Conflicts screen (30) drops those rows only. Undo it. Add a public holiday on a canvas weekday:
      the Lists that day flag, and describeConflict reads "... is closed: <name> (public holiday)".
      Delete it: the flags clear.
- [ ] Modifiers: an AA modifier added by hand can be edited and retired; an RVG row shows "NZSA RVG
      2021" and no edit; a retired AA modifier leaves the capture picker and stays on a Procedure that
      claimed it.
- [ ] RVG groups, time rule: Edit shows the two tiers and "A part interval always rounds up." read-only;
      the preview gives 7 units for 95 minutes and 9 for 125. A tier with a zero interval is refused
      with 19a's sentence. Save a changed tier, and an ACTIVE Booking's T units follow while an
      AUTHORISED one does not. Put it back.
- [ ] Lines check: open the seeded upcoming version Kirsty keyed: "Not checked". Press "Mark lines
      checked": refused inline ("A second person checks the lines: you changed them last."). Demo
      actions, "A second person checks these lines (demo)": "Checked by Second office user (simulated)
      on 21 Jul 2026". Edit a line: back to "Not checked". Pricing, review and authorise are unaffected
      either way. The provisional OQ-100 note shows once.
- [ ] Seed load: the DemoBadge and the D34 line show; thirteen sheets in load order (twelve without 39b's event fees), each with Download
      template. Demo actions, "Load sample spreadsheet", hospitals.csv: the result panel shows each
      rejected row with its reason (already in master data, name required, email, duplicate) and the
      valid rows. Nothing is added yet. Press "Load 2 valid rows": they appear in Hospitals &
      holidays, and each one's History reads "Loaded from spreadsheet, row N" by "Developer seed load
      (simulated)". Then hospital-holidays.csv: the valid closures load and their result line counts
      the Lists flagged.
- [ ] public-holidays-2027.csv: the four 2027 holidays load; the seeded Christmas Day's date, the
      impossible date, the unknown hospital and the blank name are rejected with reasons.
- [ ] rvg-groups.csv then procedures.csv: the ranged group and the named general procedure load;
      the zero figure, the range not holding its figure, the unknown body section and the taken system
      code are rejected with 19's wording. In procedures, the blank Base units row shows "6 from H3"
      (inherits), "Face-lift complex" shows its own 10, the 0 row shows 0, the guide-departing figure
      is valid with no warning; the unknown group, taken code, duplicate name and negative figure are
      rejected. No Contract is created by either load.
- [ ] contract-holders.csv, contracts.csv, contract-lines.csv in that order: the holders appear on
      Contract holders (the first-party one marked First party, never billed); the plain RVG Contract
      shows "Plain RVG: no lines" and is offered for every procedure in 20's picker for a Booking at
      that hospital; the loaded Contracts got AA codes; the lines' blank cells show the inherited
      value greyed in 19a's grid; the second line for one procedure, the locked version, the unknown
      procedure and the empty line are rejected with 19a's and 18's wording. The loaded versions show
      "Not checked", and Kirsty can check them herself (the seed load changed them, not she).
- [ ] Repeat on Surgeons' rooms, Surgeons (an unknown room, a malformed HPI CPN and a duplicate HPI
      CPN are each rejected with 17's wording), Anaesthetists (a loaded anaesthetist has Slots from
      the start date on the Day grid) and Modifiers (AA rows only).
- [ ] Seed load with a real file: download the hospitals template, add two rows (one bad) in a text
      editor, save as CSV and choose it. The same result panel appears. A file missing a required
      column is rejected as a whole, with "Missing column: ...".
- [ ] Stale protection: stage the hospitals sample, then add "Rangiora Day Surgery" by hand, then
      press Load. That row turns rejected ("Already in master data") and only the others load.
- [ ] Demo actions, "Go-live data load (demo)": the banner appears on every view. On Go-live load,
      "10% discount", "DO NOT USE", "Test op", "Misc" and the upper-case duplicate are Excluded with
      reasons, and their toggles are disabled. Solutions Plus units are struck through and marked Not
      used. Two names show Not approved. Eight controlled spreadsheets are listed in pack order, with
      the RVG modifier table card read-only.
- [ ] Un-approve one approved name: its Result turns "Not loaded: not approved for go-live", its line
      leaves the lines sheet's valid rows, and the tiles update. Press "Load approved data": the
      result line counts rooms, surgeons, the group, procedures, the holder, the Contracts with their
      lines, and public holidays. The Procedures view shows the new procedures with their group's or
      own figures (not Solutions Plus's), and the un-approved and junk names are absent.
- [ ] Repeatable: Reset, then run the go-live load again and load it: the same records with the same
      ids and AA codes.
- [ ] Audit viewer: filter to masterLoad, goLive and contract.linesChecked. Stage, commit, approvals,
      checks and each created record are present, with who, role and before and after.
- [ ] The harness bar shows "Load sample spreadsheet" only on Seed load and seeded Master data views,
      "Go-live data load (demo)" only on Master data, and the lines-check entry only with a Contract
      version open. None shows on Day view or in the installed PWA. The Control Panel index lists all
      three under Admin · Master data.
- [ ] Reset: loads, the go-live batch and the loaded records are gone. The public holidays, the time
      rule and the seeded check states are back as seeded.
- [ ] No en or em dash in any new copy, no crimson on any new control, teal the only action colour, and
      every outcome pill carries its word.
- [ ] Catalogue screenshots: the recipes for the covered items (US-13.4.1, US-11.4.1, US-13.4.2 and
      US-13.4.3) are created or updated as the table below says, every stale caption it names is
      replaced, any recipe this phase broke is re-pointed, a full `npm run capture` ends with no
      failed recipe and no story without a recipe, the covered items' new shots are checked by eye,
      and `npm run verify:board` is green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots` and `npm run verify:board` are all green.

## Demo guide updates

In the same session (each phase patches the beats it touches). No scripted beat is broken by this
phase; it adds one optional beat and refreshes the master-data lines:
- `docs/demo-guide/03-demo-script.md`:
  - **S5, a new optional Beat 5 "Controlled master data and a clean-cut go-live"** (about 2
    minutes):
    - Click: Admin, Master data, Seed load. Demo actions, Load sample spreadsheet, procedures.csv.
      Point at the rejected rows and the blank Base units that inherit the group's figure, then Load.
      Then Demo actions, Go-live data load (demo), and Master data, Go-live load. Point at "10%
      discount" excluded, the struck-through Solutions Plus units and the base units beside each
      approved name. Un-approve one name, then Load approved data, then open Procedures and the loaded
      Contract, whose lines show "Not checked" until a second person checks them.
    - Say: "AA starts clean. A developer seeds the empty system once from AA's own controlled
      spreadsheets: hospitals, surgeons and rooms, anaesthetists, RVG groups and procedures with their
      base units, modifiers, contract holders, Contracts and their lines, and the calendars. Every row
      is checked with the same rules as adding it by hand, and anything that fails is listed and left
      out. After that, the office keeps it all by hand on these screens, and a second person checks any
      Contract's lines. Solutions Plus gives us names, not numbers. And because it is a spreadsheet,
      the same load runs again into a test system."
    - Expected: as in the manual checklist.
  - **S5 Discovery points:** add "whether a Contract schedule upload is needed in the first release
    (OQ-100)" and "whether recurring bookings join the seed spreadsheets (US-13.4.3's calendar
    schedules)". Remove any "whether admins can re-load master data after go-live" point (answered by
    US-13.4.3: seeded once, then by hand).
  - **Direct URLs:** add `/admin/masters?view=publicHolidays`, `/admin/masters?view=seedLoad` and
    `/admin/masters?view=goLive` (use the real view ids).
  - **S2** only if it names a hospital holiday by its old per-hospital row. Labour Day is now a
    public holiday; check the wording.
- `docs/demo-guide/04-presenter-cheat-sheet.md`:
  - the Admin Web list: "Master data and audit" becomes "Master data (every master in one place,
    kept by hand after a one-off seed from AA's controlled spreadsheets, Contract lines checked by a
    second person, go-live load) and audit";
  - one line under availability and holiday conflicts: public holidays come from one master calendar;
  - one "strong phrase": "Nothing comes across because it exists in Solutions Plus."
- `docs/demo-guide/01-personas-and-responsibilities.md`: Kirsty's duty 9 ("Maintain schedule-related
  master data ...") becomes "Maintain all master data (hospitals, surgeons and rooms, insurers,
  recurring bookings, public holidays and hospital calendars, RVG groups, procedures and modifiers,
  contract holders, Contracts and their lines), by hand after the one-off go-live seed, and check
  Contract lines a colleague keyed".
- `docs/demo-guide/02-workflows-and-handoffs.md`: in the canvas workflow's triggers, "A recurring
  booking or hospital holiday changes" (Phase 30's wording) becomes "A recurring booking, hospital
  holiday or public holiday changes". Add a short "Master data and go-live" note beside the Source
  list naming the clean cut, the one-off developer seed (repeatable into a test system) and no
  Contract schedule upload in the first release.
- `docs/demo-guide/master-demo-guide.html`: mirror the same S5 beat, discovery points, Direct URLs,
  cheat-sheet, persona and workflow lines, word for word.
- **Control Panel scenario text** (`apps/demo/DemoControlPanel.tsx`, the S5 blurb): add "Optional:
  Master data, Demo actions, Go-live data load." No trigger is added to the page.
- Not a milestone phase, so no full consistency read. Check that the patched sections match the run
  sheet.

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19),
run after the review pass and before the PROGRESS.md entry. Re-run
`node docs/prototype-build/catch-up/tools/recipe-status.mjs 42` first: earlier phases may have
changed these recipes since this plan was written. Several current captions describe old behaviour
(US-13.4.1's "(view only)" and "Permanent Lists" and "list statuses"; US-11.4.1's shot shows a screen
advertising a default Type 1 on the direct-claims flag): each is replaced by the recipe update below,
never left standing.

**Covered items.** When the phase is done, each recipe in `requirements-board/capture/recipes/`
matches what was built:

| Item | Recipe at plan time | When this phase is done |
|---|---|---|
| [US-13.4.1](../../../../requirements-board/requirements/stories/US-13.4.1.md) Maintain reference tables | partial · admin-master-data[anaesthetists, contracts, permanent-lists, hospitals-holidays, surgeons, rvg-codes, modifier-codes, list-statuses] (captions "(view only)" on surgeons, RVG codes, modifier codes and list statuses; "Permanent Lists"; the partial reason names view-only masters, no surgeon or RVG groups and no master holiday calendar) | `captured`. Re-shoot `admin-master-data` at `/admin/masters` with one state per view in the grouped sub-nav (People and places, Schedule, Billing, Settings, Go-live), keeping the existing state slugs but re-pointing the clicks to the current button names (Recurring bookings for `permanent-lists`, Availability statuses for `list-statuses`, RVG groups for `rvg-codes`, Modifiers for `modifier-codes`) and re-captioning every state with no "(view only)", "Permanent Lists" or "list statuses" ("Master data, recurring bookings", "Master data, availability statuses", "Master data, RVG groups", "Master data, modifiers: the NZSA RVG table plus AA's own"); add states `surgeon-groups`, `contract-holders`, `procedures`, `insurers`, `public-holidays` (`masters-public-holidays`, a national and a Canterbury row), `hospitals-holidays` with Labour Day as a public-holiday closure and a retire refusal (St George's: upcoming List, recurring booking and holder counts), and `retired` (a retired hospital under "Show retired"). Highlight the table or sub-nav group each state is about. Captions say "Master data", never "reference tables", and no state shows a load button. Drop the partial reason |
| [US-11.4.1](../../../../requirements-board/requirements/stories/US-11.4.1.md) Insurer master data | captured · admin-insurers (caption "Insurer master with the accepts direct claims flag"; the shot shows the old view, whose text advertises a default Type 1 minted on the flag) | stays `captured`, re-shot. `insurers` on `[data-shot=masters-insurers]` (columns Name, Accepts direct claims, Contracts count, Status; caption "Insurer master with the accepts direct claims flag; its Contracts sit under its contract holder"); add `add-insurer` (`InsurerSheet` with the switch, the caption "Turning this on creates no Contract." and "Set up as a contract holder" visible; caption "Adding an insurer creates no Contract") and `retire-refused` (nib: "Retire its contract holder first"). No state or caption mentions a default Contract |
| [US-13.4.2](../../../../requirements-board/requirements/stories/US-13.4.2.md) Clean-cut start, not a full migration | absent ("Not built yet: catch-up Phase 42 builds this.") | create, `captured`. Admin shot `go-live-load` at `/admin/masters?view=goLive` with states `staged` (run the `go-live-data-load` entry from `[data-shot=demo-actions]` first: "14 Solutions Plus names (5 excluded as junk, 2 not approved)", the struck-through units and the 8 controlled spreadsheets; highlight `go-live-candidates`) and `loaded` (after un-approving one name and pressing "Load approved data"; the result line, the un-approved and junk names absent). Caption: "Clean-cut start: only AA-approved data is loaded" |
| [US-13.4.3](../../../../requirements-board/requirements/stories/US-13.4.3.md) Reference data loaded from controlled spreadsheets | absent ("Not built yet: catch-up Phase 42 builds this.") | create, `captured`. Admin shot `seed-load` at `/admin/masters?view=seedLoad` with states `sheets` (the view with its DemoBadge "Demo stand-in: in the real system a developer runs this load", the D34 line and the thirteen sheets; highlight `seed-load`), `result` (after the `load-sample-spreadsheet` entry stages hospitals.csv: "6 rows · 2 valid · 4 rejected", each rejected row with its reason; `master-load-result`), `loaded` ("Loaded 2 rows on 21 Jul 2026 · 4 rejected rows were not loaded"), `procedures` (procedures.csv staged: the blank, own and 0 Base units valid, the unknown group rejected; caption "RVG groups and procedures load with their base units; no default Contracts") and `contract-lines` (contract-lines.csv staged: blank cells inheriting, the second line for one procedure rejected; caption "Contract lines load with blank cells inheriting and 0 meaning zero"). Main caption: "A one-off seed from AA's controlled spreadsheets, with rejected rows listed with reasons". No state shows an office "Load from spreadsheet" or a Contract schedule upload |

**Recipes this phase breaks.**

- About 28 recipes open `/admin/masters` and click a sub-nav button by name; 42 regroups the sub-nav
  (item 11), so each needs its button names and highlights checked with `--dry`. Found by
  `grep -l 'admin/masters'` at the 2026-10-03 plan: `FT-04.1`, `FT-05.1`, `FT-13.4`, `US-01.1.2`,
  `US-01.1.3`, `US-01.2.2`, `US-01.3.2`, `US-01.5.1`, `US-01.5.2`, `US-04.1.1`, `US-04.1.2`,
  `US-04.2.1`, `US-04.2.2`, `US-04.2.4`, `US-05.1.1`, `US-05.1.3`, `US-05.1.4`, `US-05.1.5`,
  `US-05.2.1`, `US-09.3.3`, `US-12.1.1`, `US-12.1.2` and `US-12.1.4` (the Retired `US-04.2.5`,
  `US-04.2.9`, `US-04.4.1` recipes were set `absent` by 18 to 20), plus those 17 to 41 added
  (re-grep: at least 18's `US-04.1.4` and `US-04.1.5` on Contract holders and the catalogue, 19's
  `US-05.1.6` on Procedures, 19a's `US-04.2.14` and the `US-05.2.2` time-rule panel, 19b's
  `US-05.1.4` `rvg-included`, 29's and 30's views). The buttons they use include Contracts, Contract
  holders, Hospitals & holidays, Recurring bookings, Availability statuses, Insurers, Procedures, RVG
  groups and Modifiers.
- `US-01.5.1.json` and `US-01.5.2.json` (hospital holiday calendar and its conflicts): the seeded
  per-hospital Labour Day and Canterbury Anniversary rows migrate to the master public-holiday
  calendar, so re-point any hospital-holiday highlight to the new "Public holidays" line or view.
- Any recipe on a Contract detail (18's `US-04.1.2`, `US-04.2.10`; 19a's `US-04.2.4`): the new
  lines-check line and the "Not checked" pill sit under the lines grid; re-check highlights with
  `--dry`.
- Any recipe that lists hospitals, surgeons or insurers in a picker: retired masters leave the
  pickers (item 16); the seed has none retired, so no change expected.
- Work item 18 lists the Playwright specs; the `--dry` run is the check for anything else.

**ATLAS.md.** Update "Routes" (the `?view=` Master data views, `seedLoad` and `goLive`), "Overlays that
need clicks" (InsurerSheet, PublicHolidaySheet, RvgTimeRuleSheet, the retire dialogs), "Existing hooks"
(`masters-insurers`, `masters-public-holidays`, `seed-load`, `master-load-result`,
`go-live-candidates`, `masters-go-live`, `rvg-time-rule-sheet`, `contract-lines-check` and the sub-nav
group hooks) and the line that says Master data tabs include "Hospitals & holidays".

## Adversarial review (after build)

Once the manual test checklist and `npm run build`, `npm run build:pwa`, `npx vitest run` and
`npm run shots` are green, and before writing the PROGRESS entry, run the standard **adversarial
review-and-fix pass (PROGRESS convention 18)**:
- fan out three independent Opus review subagents, one each for **quality**, **bugs/correctness** and
  **plan adherence**, with the catalogue files, this doc and the diff;
- this session then independently verifies every finding against the catalogue, this doc and the
  code, fixes the confirmed ones (with a test wherever a bug had none), re-greens, and records the
  pass in the phase entry;
- do not re-raise anything already settled in the Decisions log.

**Steer this phase's reviewers at:**
- **Loads stay inside the guards.** No load path writes `masters` or `contracts` except through the
  item 9 planners inside one `mutate()`. Stage never writes masters. Commit re-validates, loads nothing
  partial, and writes one meta per record plus a summary. A rejected row can never reach master data,
  including after an approval toggle, a stale row or a planner refusal. Hunt for a second create path
  that bypasses a planner, such as a spec building a record itself.
- **One pricing model, one set of rules.** Every rejected-row reason equals the manual action's
  refusal text for the same input, and the parity test covers every refusal of every spec. No loader
  file declares its own group, procedure, holder, Contract, line or modifier type or re-implements a
  rule from `src/domain/billing` (`validateHolder`, the Contract create validator, `systemCodeIsFree`,
  `validateContractLine`, 19b's AA-modifier rules); the specs only map columns. Surgeon and
  anaesthetist rows use 17's one HPI CPN rule.
- **Base units land where the catalogue puts them.** Group figures on `RvgGroup`, a procedure's own on
  `ProcedureType` (blank stays null and inherits; 0 stays 0), line figures on `ContractLine` (blank
  inherits, 0 is zero). Nothing creates a default RVG Contract, a hospital or insurer default, or a
  second No contract (RVG). No load refuses a value for differing from the NZSA guide or raises a
  warning for it. Every loaded group has its general procedure.
- **No office upload.** No office view offers a load; the Seed load view is badged as a stand-in and
  acts as `SEED_LOAD_ACTOR`; there is no Contract schedule upload anywhere (D34, US-04.2.13 Future).
  Loaded Contracts and lines are maintained afterwards only through 18's and 19a's screens.
- **The second-person check.** Every line write (add, edit, remove, load, new version) clears the
  check and records who changed the lines; the same person cannot check; the check blocks nothing;
  the provisional note appears once.
- **Clean cut is honest.** Solutions Plus units never reach a loaded record. Junk cannot be approved.
  An unapproved name never loads, even when the controlled sheet has a row for it, and neither do its
  lines. The go-live view's wording does not claim the masters were emptied. A Reset and re-run gives
  identical records.
- **Insurers.** Creating an insurer or flipping its flag creates no Contract and no holder. The insurer
  row carries no split, rate or funding field. Retire blockers read linked holders and upcoming
  insurance indications only.
- **Retire, never break a reference.** A retired hospital, surgeon, room, group, organisation,
  insurer or AA modifier still resolves everywhere it is displayed (grid, drawer, invoices, history,
  profile, snapshots). It disappears from every picker (check the drift-check grep list, including
  18's holder link, 20's Contract picker by holder, 21's indication picker, 31's and 33's flows).
  Blockers are correct and counted from the demo clock's today. No contract (RVG) is never retired.
- **Public holidays through the one conflict rule.** The flagged-List set did not move in the
  migration. Every public-holiday change, including a calendar load, reconciles through 30's
  `mutate()` hook with no stamping. `openHospitalIds` raises and clears exactly the right flags. An
  office clear on a public-holiday cause behaves like 30's. AA rooms (31's location row) is closed or
  listed open like any location, and its flags did not move either. No reader of
  hospital holidays still reads `masters.holidays` alone.
- **The time rule.** Only tiers change; a part interval always rounds up. One function prices time
  everywhere (19a's `timeUnitsFromMinutes` with `masters.rvgTimeRule`); AUTHORISED Procedures and
  raised invoices keep their figures.
- **Change once, reflected everywhere.** A hospital, insurer, surgeon, room or group rename shows in
  every live surface and follows into the linked holder's generated name; a hand-edited holder name
  does not; raised invoices and snapshots keep theirs. List any other stored copy of a master name the
  grep found.
- **Determinism and state.** Ids come from `allocateId`, AA codes from `nextAaCode`, timestamps from
  the demo clock, and `FileReader` is the only browser API used for input. `masterLoads` resets with
  the seed. `PERSIST_VERSION` is bumped and `persistMigrate.test.ts` extended.
- **Trigger scope, copy and design.** All three triggers are bar only, show only where the table says,
  are disabled with a reason, and never load or check by themselves beyond their one action. The
  sample fixtures are imported from `src/domain`, and `pwaPurity.test.ts` holds. The app says "Master
  data", never "reference tables", and never "slot". Teal is the only action colour, outcome pills
  carry words, the result panel follows Admin Review's table, and there are no en or em dashes.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry; ROADMAP.md "Owner review: agents test
  themselves"): D34 (OQ-100) as built (a developer-run seed, shown as a demo stand-in; no schedule
  upload; the second-person "Checked by" mark, which blocks nothing); calendar schedules (public and
  hospital holidays loaded, recurring bookings hand-made); the sheets' column sets (including the
  anaesthetists and contract holders sheets from AR-29's list, beyond US-13.4.3's); the RVG modifier
  table left to AR-34's files and the full NZSA group set narrated, not transcribed; the time rule
  editable by tier; anything logged rather than fixed; and the screens worth a look, each with its
  route and persona (Kirsty: Master data, Insurers, Public holidays, a Contract's lines check, Seed
  load, Go-live load).
- **Status row** for catch-up Phase 42, and a phase entry with:
  - the drift-check result (items changed since `60e2d1e` or not; OQ-100, OQ-98, OQ-88, OQ-101 and
    OQ-103 as found; the calendar-schedule question; whether Vanessa's files landed; and the 17 to
    34 names used);
  - what was built, per work item;
  - the flagged-List set before and after the public-holiday migration;
  - the stored-name copies the grep found and what was done;
  - the `PERSIST_VERSION` bump (from and to);
  - tests added (including the rule-parity, blank-and-zero, US-13.4.1 coverage, AR-34 table and
    repeatable-load tests);
  - the review pass.
- **Catalogue screenshots:** the recipes created or changed (by ID), the `capture/REPORT.md` counts
  before and after (captured, partial, absent, failed), the stale captions replaced, the recipes this
  phase broke and how they were re-pointed, and any partial reason handed to a later phase.
- **Decisions log:**
  1. **Public holidays are one master calendar.** A row applies to every hospital except those
     listed as open that day. Hospital calendars hold only hospital-specific closures. The seeded
     per-hospital Labour Day and Canterbury Anniversary rows migrated with the flagged set unchanged.
     AA rooms (31's location row) is closed by a public holiday like any location unless listed
     open. This amends Phase 30's decision 10 ("Hospital
     holidays can be edited and deleted") and the original seed reading of `HOSPITAL_HOLIDAYS`
     (statutory days as per-hospital rows).
  2. **Masters referenced by identity retire, never delete.** Retire needs a reason, refuses while
     upcoming work or an active contract holder depends on the record, hides the record from pickers,
     and keeps every reference resolving. Delete stays only for rows nothing references (hospital and
     public holidays). Anaesthetists keep their Active flag. AA's own modifiers are editable and
     retirable; RVG-table modifiers are as printed. This supersedes Phase 17's "no delete or
     deactivate; Phase 42 owns it" and the Phase 07 "view only" master readings.
  3. **A rename follows through to the linked contract holder's name** while it is still the old
     name. Raised invoices and pricing snapshots keep theirs. (Supersedes this plan's 2026-10-03
     reading, which renamed a protected default Contract; there are none, OQ-78.)
  4. **Insurers are maintained in full and mint nothing.** Add, rename, retire and reinstate, with
     the accepts-direct-claims flag creating no Contract and no holder (US-11.4.1; the minting went in
     Phase 18). An insurer's Contracts sit under its contract holder, most of them plain RVG Contracts
     (OQ-98's default). The insurer row carries no split, rate or funding field: the split is a Booking
     action (22), special rates are Contract lines (19a). An insurer linked to an active holder or
     named by an upcoming insurance indication (21) cannot be retired. Supersedes this plan's
     2026-10-03 reading (a direct-claim insurer mints its protected default; the split on the
     Contract's payment setting).
  5. **The seed is checked, then loaded.** Stage validates and reports without touching masters.
     Commit re-validates and loads exactly the valid rows in one audited `mutate()`, through the same
     planners and validators as a manual add. Each loaded record's audit carries its load and row and
     the simulated developer actor. Rejected rows are never loaded (US-13.4.3 AC1). The same sheets
     after a Reset give identical records (AC2).
  6. **A one-off developer seed, then by hand; CSV; add only** (US-13.4.3 as changed 2026-10-07).
     The loader is shown only in a demo-badged Seed load view; no office view offers a load, and an
     existing key is rejected with "Already in master data: edit it there". Supersedes this plan's
     2026-10-03 reading ("loads allowed at any time while AA decides on re-loading", with a per-view
     "Load from spreadsheet").
  7. **Solutions Plus supplies operation names only.** Its units are never read, junk is excluded and
     cannot be approved, AA's approval gates each name, and no Solutions Plus identifier is carried
     (US-13.4.3; OQ-51 was deleted unanswered). The go-live demo loads into today's masters and says
     so.
  8. **The RVG modifier table comes from AR-34's files, not a sheet.** 19b's generated table is what
     the seed would load; AA's own modifiers load from a sheet. The band table stays code-held.
  9. **Any Contract loads, as holders, Contracts and lines** (US-13.4.3: "any Contracts (Could be RVG,
     fixed or other style)"; AR-29 `data-loading`). A Contracts sheet carries the Contract version's
     fields (18, 22, 23), a holders sheet 18's holder fields, and a lines sheet 19a's line fields with
     a blank cell inheriting and 0 meaning zero. AA codes come from `nextAaCode` (D16). A Contract
     with no lines loads as a plain RVG Contract (OQ-98's default). No contract (RVG) and default
     Contracts are never loaded. Supersedes this plan's 2026-10-03 reading (schedule lines and
     base-unit override sheets; protected defaults minted by their holders). The hospital sync set-up
     (34) stays code-held, and an integrated hospital cannot be retired.
  10. **Loaded base units land on RVG groups, procedures and Contract lines** (OQ-62 as settled
     2026-10-07; US-05.1.1, US-05.1.6). Group figures above 0 with an optional range; a procedure's
     own figure or blank to inherit; line figures or blank to inherit. No NZSA guide range check and
     no warning (AA's own figures; D3's warning stays with a value recorded on a Procedure).
     Supersedes this plan's 2026-10-03 Decision 10 (base units on each procedure's one or two default
     RVG Contracts, Retired with FT-04.4 and US-04.4.2).
  11. **The seed covers US-13.4.3's list, AR-29's additions and the calendars** (hospitals, hospital
     holidays, public holidays, surgeons' rooms, surgeons, anaesthetists, RVG groups, procedures, AA
     modifiers, contract holders, Contracts, Contract lines and 39b's Contract event fees). Insurers,
     surgeon groups, recurring bookings, availability statuses, preferences and tiers, and body
     sections are maintained by hand.
     Recurring bookings are the unclear "calendar schedules": left hand-made, for the owner.
  12. **A second person checks Contract lines on screen** (OQ-100's default, D34). Any line or event-fee change
     clears the check and records who made it; the same person cannot check; it blocks nothing.
     Provisional until OQ-100 is answered. There is no Contract schedule upload (US-04.2.13 Future
     Work).
  13. **The RVG time rule is editable by tier** (19a's handoff, US-05.2.2 "defined as data"). A part
     interval always rounds up and is not editable.
  14. **One label: "Master data".** Greg would call these master data, not reference tables
     (2026-10-02 #39); the app uses "Master data" throughout. The catalogue story's title is the
     owner's to change.
- **Handoff notes:**
  - For **43**: `validateSheet` and `commitMasterLoad` are the seams to time on a full-scale sheet
    (thousands of Contracts and lines); 43's generator builds through the same pricing-model module
    and planners, never a second shape. `SAMPLE_SHEETS` shows the fixture pattern.
  - For **44**: S5's optional Beat 5; OQ-100 and the calendar-schedule question in the discovery
    points; public holidays on the anaesthetist calendars if wanted; the full NZSA group set if the
    demo wants it; 31's request sources as a candidate master; the event-fee sheet if 39b was not
    DONE; any trim logged in this phase.
