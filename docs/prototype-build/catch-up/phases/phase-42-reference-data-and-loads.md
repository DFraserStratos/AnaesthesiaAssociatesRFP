# Phase 42 · Reference data and controlled loads

**Requirements covered:**
[US-13.4.1](../../../../requirements-board/requirements/stories/US-13.4.1.md) Maintain reference tables (Confirmed; closes the rows Phases 17, 18, 19, 19a, 29 and 30 did not: hospital retire, insurers, the master public-holiday calendar, and one consistent pattern across every master; its "recurring bookings" row is Phase 30's rename and editor, refitted here. Greg would call these master data, not reference tables (2026-10-02 #39): the app says "Master data" only) ·
[US-11.4.1](../../../../requirements-board/requirements/stories/US-11.4.1.md) Insurer master data (Confirmed; add, rename, retire and the accepts-direct-claims flag here. Its cover split between insurer and patient is the Contract's payment setting, built in Phase 22 as D18 answered it: typed $ or % shares set on the Booking, defaulting from the Contract. The insurer row carries no split) ·
[US-13.4.2](../../../../requirements-board/requirements/stories/US-13.4.2.md) Clean-cut start, not a full migration (Confirmed on 2026-10-02, acceptance criteria unchanged) ·
[US-13.4.3](../../../../requirements-board/requirements/stories/US-13.4.3.md) Reference data loaded from controlled spreadsheets (Proposed; its list now ends "any Contracts (Could be RVG, fixed or other style)", and Greg asked for calendar data from spreadsheets too, so a test system can be loaded again the same way) ·
[DM-38](../analysis/domain-model-delta.md#dm-38) Reference data: master public-holiday calendar, recurring-booking vocabulary, controlled-spreadsheet load, editable masters (the statutory calendar, the loads and calendar loads; Phase 30 built the hospital-calendar half and the recurring-booking rename, Phase 31 the recurring clash that becomes a Draft List).
Also touches, without closing:
[FT-13.4](../../../../requirements-board/requirements/stories/FT-13.4.md) (the feature; its RFP-response ETL migration is narrowed to the clean cut),
[US-04.4.2](../../../../requirements-board/requirements/stories/US-04.4.2.md) and [FT-04.4](../../../../requirements-board/requirements/stories/FT-04.4.md) (each procedure's default RVG Contracts "are imported from spreadsheets at the start, then maintained by hand": the import is here, the model and the hand editor are 19a's),
[US-05.1.6](../../../../requirements-board/requirements/stories/US-05.1.6.md) (Confirmed; the procedure master holds no base units, OQ-62 answered), [US-05.1.5](../../../../requirements-board/requirements/stories/US-05.1.5.md) (Confirmed; AA's own modifier list), [US-04.2.4](../../../../requirements-board/requirements/stories/US-04.2.4.md) and [US-04.2.2](../../../../requirements-board/requirements/stories/US-04.2.2.md) (their masters become load targets; Phases 18, 19, 19a, 23 and 24 built them),
[US-05.2.2](../../../../requirements-board/requirements/stories/US-05.2.2.md) (the RVG time tiers, held as data by 19a, become editable here; D25 keeps the part interval always rounding up),
[US-01.5.1](../../../../requirements-board/requirements/stories/US-01.5.1.md) (Confirmed; each hospital keeps its own calendar, and public holidays move out of it),
[US-01.3.2](../../../../requirements-board/requirements/stories/US-01.3.2.md) (Verify; recurring bookings, refitted to the one pattern and counted in retire blockers),
[US-04.2.12](../../../../requirements-board/requirements/stories/US-04.2.12.md) (the Contract payment setting the Insurers view points at; Phase 22 built it).
No RV finding is closed here.
**Answered and built as answered:** D12 (OQ-62: base units live in each procedure's one or two
default RVG Contracts, so the procedure sheet loads them there and the procedure master holds none),
D16 (OQ-66: every loaded Contract gets its short AA code from 18's generator), D17 (OQ-67: the
Contract always defines the billable party, so there is no per-Booking billable-party override to
guard or count), D18 (OQ-68: the split is typed on the Booking, so the insurer row has none), D25
(OQ-75: the time rule's part interval always rounds up, so the time-rule editor edits tiers only), D2
(no insurer on the Booking or Patient) and D14 (OQ-64: "slot" never reaches app copy).
**Still open, and how this phase treats them:** whether admins can re-load reference data after
go-live (US-13.4.3 "to be decided"): loads are allowed at any time, add only, with the question
stated once on the loader sheet. Whether "calendar schedules" join US-13.4.3's list was "left unclear"
in the room: this phase loads the calendars (public holidays and hospital holidays) and keeps
recurring bookings hand-made, logged for the owner. OQ-78 and OQ-88 are 19a's and 19's, labelled
there; this phase adds no label for them. OQ-51 (Solutions Plus identifiers) was deleted unanswered,
so the clean cut takes operation names only and carries no identifier.
**Depends on:** Phase 17 (surgeon profile with its one HPI CPN, surgeons' rooms, surgeon groups, hospital contact email, `editHospital`, `isPlausibleEmail`, the `apps/admin/screens/masters/` split and the `?view=` search param), Phase 18 (the Contract record with its AA code from `nextAaCode`, `createContract`, `FeeScheduleLine` and `addFeeScheduleLine`, Contract retire, the organisations master behind surgeon groups, the protected RVG Default Hospital and insurer defaults minted by `createHospital` and `setInsurerDirectClaims`), Phase 19 (the editable RVG reference master, RVG groups and `RvgGroupRef`, the modifier master with `addModifierCode`, the procedure master `ProcedureType` (`systemCode`, `name`, `group`, `subgroup`, `rvgCode`, `defaultModifierCodes`, no base units) with `createProcedureType` and `systemCodeIsFree`, UI name "Procedure master", `allocateId` kinds), Phase 19a (default RVG Contracts: `Contract.defaultRvgFor` and `baseUnits`, `generateDefaultRvgContract`, the base-unit rules of `editDefaultRvgBaseUnits` and `addDefaultRvgKind`, `addContractBaseUnitOverride` and its guards, `procedureScopeFromLines` and `setContractProcedureScopeFromLines`, `masters.rvgTimeRule` with `validateRvgTimeRule` and `describeTimeRule`, the Contracts tab's "Default RVG Contracts" view and `DefaultRvgContractsSheet`), Phase 29 (the availability status master, nav "Availability statuses") and Phase 30 (derived conflicts reconciled in `mutate()`, `conflictFactsFor`, `describeConflict`, `HolidaySheet`, `addHospitalHoliday`, `editHospitalHoliday`, `deleteHospitalHoliday`, the hospital month calendar, and the rename of Permanent Lists to recurring bookings with their projection). Also relies on 14 (the demo-trigger registry, `useDemoTriggerContext`, `store/demoActors.ts` with `OFFICE_ACTOR`), 20 (the Contract picker filtered by procedure then hospital; `Procedure.insurerId` removed with nothing in its place, per D2), 21 (the payer captured on a default or patient-direct Contract, the Contract's required inputs, and no per-Booking billable-party override, per D17), 22 (the Contract payment setting with its default split share, and the invoice layout, delivery and GST fields), 23 (the multi-procedure rule and combination Contracts), 24 (the Contract defined unit rate and the allows-adjustment rule), 25 (Contract versions), 31 (the Draft List holiday warning and the recurring clash that becomes a Draft List), 33 (the matching screen's create actions) and 34 (the three hospitals it appended and `INTEGRATED_HOSPITALS`).
**Estimated:** 2 sessions. Session 1 is the model, seed, pure rules and store (work items 1 to 10) and stops green with every existing screen still rendering. Session 2 is the screens, the go-live view, the triggers, the shots and the demo guide (items 11 to 19).
**Size warning:** this is a roll-up and sits at the top of two sessions; session 1 in particular is
heavy (ten loader specs, the planner refactor and the holiday migration). If session 1 runs long, end
it green after item 7 and start session 2 with items 8 to 10; do not drop a covered target. Within
session 2, trim in this order if needed, and log each trim for Phase 44: the RVG time rule editor
(19a's read-only panel stays), the Insurers "Contracts" link-through (keep the count), the
collapsible `LoadResultBanner` (keep it static), the public-holiday "Lists affected" column, then
Organisations retire.

## Goal

Master data has grown one phase at a time. Surgeons, rooms and groups came in 17, Contracts in 18,
the RVG, modifier and procedure masters in 19, default RVG Contracts and the time rule as data in
19a, Contract payment settings in 22, availability statuses in 29, holiday editing and recurring
bookings in 30. What is left is the part US-13.4.1 names and nobody owns yet, and a single pattern
that makes the whole area feel like one tool:

- **Hospitals** can be edited (17) and now **retired and reinstated**. A rename also renames the
  hospital's protected default Contract while that name is still the generated one, so "change once,
  reflected everywhere" holds.
- **Insurers** can be **created, renamed, retired and reinstated**, each with the accepts-direct-claims
  flag. Creating a direct-claim insurer mints its protected insurer default Contract in the same
  commit, by the rule 18 set (US-11.4.1). Special rates and the cover split between insurer and
  patient are Contracts and their payment setting (22, with the typed share on the Booking per D18),
  never fields on the insurer row. Insurers sit on neither the Booking nor the Patient (D2), and the
  Contract always defines the billable party (D17): an insurer is reached only as the holder of the
  Contract a Procedure selects.
- A **master public-holiday calendar**. One row per statutory or regional holiday, applying to every
  hospital unless a hospital is listed as open that day. The seeded per-hospital Labour Day and
  Canterbury Anniversary rows migrate into it, so each hospital's own calendar holds only its own
  closures (US-13.4.1, US-01.5.1). Public holidays raise conflicts through 30's derived rule.
- **Retire, never delete, anything referenced by identity.** Hospitals, surgeons, rooms, groups,
  insurers and organisations retire with a stated reason when nothing upcoming depends on them.
  Pickers stop offering them, and every existing reference keeps resolving.
- **One consistent pattern across every view:** grouped sub-nav, the same header, "Show retired", edit
  sheet, retire and reinstate, and a "Load from spreadsheet" action. It is driven by one registry of
  views, with a test that maps every US-13.4.1 row to a view that can add and edit. The 19a time rule
  joins it as an editable panel (tiers only; a part interval always rounds up, D25).
- **A controlled-spreadsheet loader** for the catalogue's spreadsheet list (US-13.4.3 at 3d3a18c) plus
  calendars: hospitals; hospital holidays and public holidays (the calendars, so a test system loads
  the same way again); surgeons' rooms; surgeons; the procedure master **with each procedure's one or
  two default RVG Contracts, which hold its base units** (US-04.4.2: imported at the start, then
  maintained by hand); modifier codes; and **any Contracts, RVG, fixed or other style**: a Contracts
  sheet carrying every field the Contract editor takes, a fee-schedule lines sheet and a Contract
  base-unit overrides sheet. Insurers, anaesthetists, recurring bookings, availability statuses and the
  RVG reference codes and groups are not on that list and stay hand-maintained. A load is checked
  first: every row is validated with the same rules as the manual add, and a result panel lists valid
  rows and rejected rows with reasons. Then the admin loads it: one audited `mutate()` loads exactly
  the valid rows, and rejected rows never touch master data (US-13.4.3 AC1). The same fixture loaded
  after a Reset gives identical records, so a load repeats.
- **A clean-cut go-live demo.** A Solutions Plus operation list, names only, sits beside AA's
  decisions and the controlled spreadsheets. Junk such as "10% discount" is excluded, rows AA has not
  approved are not loaded, and Solutions Plus unit values are shown struck through and never used.
  "Load approved data" loads only approved, valid rows from the controlled spreadsheets
  (US-13.4.2 AC1 and AC2, US-13.4.3 AC2), base units landing on the default RVG Contracts.

Two harness-bar triggers make the loads demoable without files on the presenter's laptop: "Load
sample spreadsheet" on the current Master data view and "Go-live data load (demo)". Nothing here is
mobile, so there is no PWA stand-in.

## Before you start: drift check

1. Diff the catalogue for this phase's items against the plan's snapshot (3d3a18c, the 2026-10-03
   requirements update after the three 2026-10-02 meetings with Greg):

   ```
   node docs/prototype-build/catch-up/tools/plan-state.mjs --diff US-13.4.1,US-11.4.1,US-13.4.2,US-13.4.3,FT-13.4,US-04.4.2,FT-04.4,US-01.5.1,US-01.3.2,US-05.1.6,US-05.1.5,US-05.2.2,US-04.2.2,US-04.2.4,US-04.2.12,OQ-62,OQ-78,OQ-88
   ```

   At 3d3a18c this plan already reflects: US-13.4.3's list ending "any Contracts (Could be RVG, fixed
   or other style)" in place of "fixed fee schedules and any Contract-specific overrides", and its note
   that Greg would load schedule and calendar data from spreadsheets so a test system can be loaded
   again (calendars built here; recurring bookings left by hand, logged); US-13.4.2 Confirmed with
   unchanged criteria; US-13.4.1's note that Greg calls these master data; US-04.4.2's default RVG
   Contracts "imported from spreadsheets at the start, then maintained by hand"; US-05.1.6 Confirmed
   with no base units on the procedure master (OQ-62 answered, D12); US-05.1.5 Confirmed as AA's own
   list; US-11.4.1's split basis per OQ-68 (D18, built in 22); US-01.3.2 at Verify with its List
   created before any Bookings and its clash becoming a Draft List (31); US-01.5.1 Confirmed;
   US-05.2.2's tiers as data with a part interval always rounding up (D25). If an item changed after
   3d3a18c, re-read it and adjust the work items before planning. If a covered item is now Retired or
   Future, drop it from this phase and say so in the PROGRESS entry. Watch in particular for:
   - **Re-loading after go-live** (US-13.4.3: "Whether admins can re-load it later is to be
     decided"; still open at 3d3a18c). This phase allows a load at any time, adds only and never
     overwrites (work items 4 and 7), and states the question once on the loader sheet. If AA decides
     no re-load, keep the loader only inside the Go-live load view and remove the per-view "Load from
     spreadsheet" action. If AA decides re-load may update existing rows, add an "update" row outcome
     that shows a field diff and goes through the entity's edit action, and record it in the
     Decisions log.
   - **Calendar schedules** (US-13.4.3's note: "Whether calendar schedules join the list above was
     left unclear"). If the list gains them explicitly, keep the calendar sheets and, if it names
     recurring bookings, add a recurring-bookings sheet through 30's create planner (nothing is
     painted until the view's "Apply to canvas now"; a clash becomes 31's Draft List). If it rules
     calendars out, keep the calendar sheets and say so on the owner's review list.
   - **The spreadsheet list** in US-13.4.3 and the domain model's "Reference data and go-live"
     section. A new target joins the loader only if its master already exists; otherwise note it for
     Phase 44.
   - **The master calendar's scope** (national vs regional, or per-hospital opt-in rather than
     opt-out). This phase builds "applies to every hospital unless listed as open".
   - **OQ-78 and OQ-88** (default Contracts, or the hospital holding every Contract; one procedure
     list or two). The loader follows whatever 19 and 19a built; if either was re-planned after an
     answer, re-shape the procedure and Contracts sheets to it before building.
2. **Base units on the loaders (D12, answered).** Base units live only in each procedure's default
   RVG Contracts (19a); the procedure master and the RVG reference master hold no pricing figure. So
   the procedure sheet carries a Base units column per default RVG Contract and the loader writes it
   onto the default RVG Contracts it creates with the procedure, never onto `ProcedureType` and never
   onto `RvgCode`. A loaded value obeys exactly the manual rule: 19a's `editDefaultRvgBaseUnits` for a
   default RVG Contract (a positive whole number, or a range of two with min under max) and 19a's
   `addContractBaseUnitOverride` for an override (a positive whole number). It is never checked
   against the RVG reference range: these are AA's own figures, which may depart from the guide by
   design (US-05.1.6, domain model "RVG code and modifier master"). They raise no warning either,
   because 19a's `outsideGuide` is false for the `'defaultRvgContract'` and `'contract'` sources; D3's
   after-procedure warning is about an anaesthetist's entry on a Procedure, not master data. No
   Solutions Plus identifier is carried (OQ-51 deleted; US-13.4.3 takes names only): the candidate
   list holds operation names plus the scan-row number for traceability ("Scan row 14").
   Additional-invoice numbering is Phase 38b's and 39's.
3. **Baseline.**
   - Confirm Phases 17, 18, 19, 19a, 29 and 30 are DONE in PROGRESS.md, and note whether 20, 21, 22,
     23, 24, 25, 31, 33 and 34 are DONE.
   - From their entries and Decisions-log rows, note the names actually chosen:
     - the view ids in `?view=` and the `NAV` shape (17, 19, 19a, 29);
     - the `SurgeonRoom`, `SurgeonGroup` and `Surgeon` fields (including the HPI CPN field, its
       normaliser and duplicate check across surgeons and anaesthetists) and their sheets (17);
     - `Contract.category`, `holder`, `scope`, `pricingBasis`, `aaCode` and `nextAaCode`,
       `retiredAtISO`, `createContract` and its validator, the protected-default minting helpers, the
       `FeeScheduleLine` shape and `addFeeScheduleLine` (18);
     - `ProcedureType`, `procedureTypes`, `systemCodeIsFree`, `rvgGroups`, `RvgGroupRef`,
       `MODIFIER_GROUPS`, `addModifierCode`, `ProcedureTypeSheet`, `ModifierCodeSheet` and the
       "Procedure master" view id (19);
     - `defaultRvgFor`, `Contract.baseUnits`, `ContractBaseUnits`, `generateDefaultRvgContract`,
       `editDefaultRvgBaseUnits`, `addDefaultRvgKind` and their refusals (`defaultRvgTwoAtMost`,
       `defaultRvgManagedByProcedure`), `ContractBaseUnitOverride`, `addContractBaseUnitOverride`
       and its refusals (`overrideOverlap`, `defaultRvgUseBaseUnits`), `procedureScopeFromLines`,
       `setContractProcedureScopeFromLines` (`noMappedLines`), `masters.rvgTimeRule`,
       `validateRvgTimeRule`, `describeTimeRule` and `data-shot="masters-rvg-time-rule"` (19a);
     - the Contract picker's filter (20); how 21 captures the payer on a default or patient-direct
       Contract and the Contract's required-input field (21); `Contract.paymentSetting` and
       `defaultSplitShare`, `Contract.invoicing` (`invoiceLayout`, `deliveryMethod`, `gstTreatment`)
       and their defaults for a newly minted insurer default (22); `multiProcedureRule` and the combination Contract fields (23); the
       defined unit rate and allows-adjustment fields (24);
     - what a Contract version records and which actions write one (25);
     - `masters.slotStatuses` and the "Availability statuses" view id (29);
     - `ListConflict.cause`, `conflictFactsFor`, `holidaysByDateHospital`, `reconcileAllConflicts`,
       the reconcile trigger list in `store/conflictReconcile.ts`, `HolidaySheet`, the hospital
       month calendar, and the recurring-booking names (`RecurringBooking`,
       `masters.recurringBookings`, `recurringBookingProjection.ts`, `applyRecurringBookingsToCanvas`,
       the view id) (30); 31's Draft List assignment warning;
     - the hospitals 34 appended, their `HOSPITAL_HOLIDAYS` rows, and `INTEGRATED_HOSPITALS` (34's
       `domain/intake/syncDeliveries.ts`, beside its `HOSPITAL_SYNC_DELIVERIES` fixture; 34 has no
       sync schedule);
     - `validateSlotStatusDraft` (29), the precedent for item 4's pure validators.
     Use those names throughout. This doc's code references are as at 3d3a18c, or as those phases
     planned them.
   - Record the seed's flagged-List set today (List ids with a `holiday` conflict, by cause), so the
     public-holiday migration can prove the set does not move (work item 3).
   - Grep every picker that offers hospitals, surgeons, rooms, groups or insurers
     (`grep -rn "masters.hospitals\|masters.surgeons\|masters.insurers\|surgeonRooms\|surgeonGroups" src --include=*.tsx`)
     and list them, together with 20's Contract picker (which must hide Contracts whose holder is
     retired) and 18's Contract holder select. Work item 16 routes each one through the active-only
     selectors. Confirm 21 left no per-Booking billable-party override (D17); if one survived, it is a
     bug to report, not a picker to route.
   - From 18's entry, note the organisations master (`masters.organisations`, kept as the
     counterparty behind a surgeon group's `billingOrganisationId`) and 18's Decision (g), which hands
     its retire and reinstate to this phase.
   - Grep every reader of hospital holidays
     (`grep -rn "masters.holidays\|holidaysByDateHospital\|HospitalHoliday" src --include=*.ts --include=*.tsx`).
     At 3d3a18c: the canvas generator (`domain/seed/canvas.ts:90-93`), the horizon advance
     (`store/clockActions.ts:45`), the new-anaesthetist canvas generation in `addAnaesthetist`
     (`store/mastersActions.ts:278`) and the Hospitals view (`MasterData.tsx:280`); 28, 30 and 31 add
     `conflictFactsFor`, the recurring-booking projection, the conflict preview and the Draft List
     assignment warning. List them; work item 2 routes each through `closuresIndex`, so no reader
     silently loses Labour Day when the per-hospital rows go.
   - Grep for stored copies of a master's name (for example a Contract name built from a hospital
     name, or a `hospitalName` on a record). List them; work item 5 handles the protected defaults,
     and anything else is noted for the reviewers.
   - Note the current `PERSIST_VERSION` in `src/store/appStore.ts` (16 at 3d3a18c, after 15a's first
     session; 15a to 41 will have bumped it) and bump it by one from whatever it is now.
   - Check `docs/discovery-reference/Data files/` (`git log` on it) for Vanessa's standard procedure
     list, modifier list, contract overrides and surgeons' rooms list (US-13.4.3's note). If any has
     landed, model the matching sample's columns on its headers (still saved as CSV), but keep every
     fixture row demo-plausible: no real figure is loaded into the seed.
4. **Owner decisions.** None of D1 to D25 gates this phase; these shape it, all answered:
   - D2: insurer and funding source on neither the Booking nor the Patient. D17: the Contract always
     defines the billable party, with no per-Booking override. So an insurer is referenced only as a
     Contract holder, and the insurer retire blockers and pickers read that, never a Booking field
     (work items 2 and 16).
   - D3: an anaesthetist's base units outside a code's range raise an after-procedure office warning.
     It does not apply to master data: the procedure and override loaders follow 19a's manual rules,
     with no guide-range check and no warning (step 2).
   - D12: base units in each procedure's default RVG Contracts (step 2).
   - D14: "slot" never appears in app copy. The Schedule group's entry is 29's "Availability
     statuses", and blocker and result copy says "session".
   - D16: a loaded Contract's AA code comes from 18's `nextAaCode`, never from the sheet.
   - D18: the cover split is a typed $ or % share on the Booking, defaulting from the Contract's
     payment setting; the Contracts sheet loads the payment setting and its default share.
   - D25: the part interval always rounds up; the time-rule editor shows it read-only.

## Reference

**Design files (convention 17).** No mockup covers Master data, a loader or a go-live screen. Extend
the admin's own patterns, and do not invent new chrome:
- `docs/design/Design Language.dc.html`: the tokens (teal the only action colour, crimson identity
  only), the semantic success, warning and error trios for row outcomes, neutral pills, tables, radii,
  the sheet rules, and "colour is never the only signal" (every outcome pill carries its word).
- `docs/design/Admin Review.dc.html`: the Admin table, header (title, subtitle, count, filter chips),
  the four-tile summary row and row actions. The load result panel and the go-live summary follow it.
- `docs/design/Admin Day.dc.html`: the dark-ink side nav and the admin page chrome the Master data
  sub-nav sits in.
- `docs/design/Web Availability.dc.html`: the month cell anatomy that 30's hospital calendar reused.
  Public holidays show in it as closures.

**Catalogue:** the covered items above; `domain-model.md` sections "1. What changed since the RFP"
(the clean-cut and "Permanent Lists and List templates" rows), "Surgeon, surgeons' room and
blacklist", "RVG code and modifier master", "The default Contract", "Reference data and go-live" and
the glossary's "Recurring booking", "Default RVG Contract" and "HPI CPN" entries. The 2026-10-01 note
(`requirements-board/requirements/notes/2026-10-01-aa-meeting-with-greg.md`) points 12, 44 and 64 (insurer cover split,
recurring bookings, plain-RVG insurance jobs). The 2026-10-02 notes:
`requirements-board/requirements/notes/2026-10-02-aa-requirements-review-with-greg.md` points 9, 10, 39, 40, 77 and 86
(clean cut confirmed, "just Contracts", master data not reference tables, calendars from
spreadsheets) and `requirements-board/requirements/notes/2026-10-02-aa-meeting-with-greg.md` points 3, 22 and 40 (base units
in default RVG Contracts, imported then hand-maintained). The change log
`changes/2026-10-02-aa-requirements-review-with-greg.md`.

**Analysis:**
- `docs/prototype-build/catch-up/GAP-ANALYSIS.md`: theme 9 (master data and surgeon model), the
  "Oversight/NFR" demo-trigger line (Go-live load, Load sample spreadsheet), and the EP-13 and EP-11
  tables.
- `docs/prototype-build/catch-up/epics/EP-13.md` (US-13.4.1, 13.4.2, 13.4.3) and `epics/EP-11.md`
  (US-11.4.1: Partial, size S; add, edit and retire are this phase's, the split is 22's).
  `epics/EP-04.md` (US-04.4.2: the import half is this phase's).
- `analysis/domain-model-delta.md` DM-38 (and DM-32, DM-13, DM-43 and DM-09 for the load targets;
  DM-12 for D2 and DM-28 for the payment setting).
- `analysis/prototype-map-admin.md` section 9 (Master data), `prototype-map-store-seed.md`
  (`mutate`, `allocateId`, masters actions, seed), `prototype-map-shell-demo-pwa.md` (the trigger
  registry and the PWA closure).

**Code entry points (as at 3d3a18c; use the names 17 to 34 chose where they differ):**
- `aa-prototype/src/domain/types.ts`: `Hospital` (:155), `Surgeon` (:160), `Insurer` (:166),
  `PermanentList` (:585, 30's `RecurringBooking`), `HospitalHoliday` (:612), and 17's `SurgeonRoom`
  and `SurgeonGroup`.
- `aa-prototype/src/domain/seed/cast.ts`: `HOSP`, `HOSPITALS` (:95-109), `INS`, `INSURERS` (:111-124);
  `domain/seed/availabilityAndHolidays.ts`: `HOSPITAL_HOLIDAYS` (:58, a `flatMap` over `HOSPITALS`
  that writes Labour Day Mon 26 Oct and Canterbury Anniversary Day Fri 13 Nov per hospital, plus 30's
  `HH900` Southern Cross closure); `domain/seed/index.ts`: `SeedMasters` (:91) and `buildSeed`;
  `domain/seed/canvas.ts`: `ADHOC_HOSPITALS` (:61) and the holiday map (:90-93).
- `aa-prototype/src/domain/conflicts.ts` (30): `conflictFactsFor`, `expectedConflicts`,
  `describeConflict`, `reconcileAllConflicts`; `src/store/conflictReconcile.ts` (30), called only
  from `mutate.ts`.
- `aa-prototype/src/store/mastersActions.ts`: `createHospital` (:45), `setInsurerDirectClaims`
  (:102), `addAnaesthetist` (:241), `addHospitalHoliday` (:320), 17's `editHospital`, and 30's
  `editHospitalHoliday` and `deleteHospitalHoliday`. `src/store/surgeonActions.ts` (17),
  `contractActions.ts` (18, 19a), `rvgMasterActions.ts` (19, 19a).
- `aa-prototype/src/store/mutate.ts`: `ID_FORMATS` (:61), `allocateId` (:100), `MutationMeta`
  (:116). `src/store/appStore.ts`: `AppState` (:75), `PERSIST_VERSION` (:136, 16).
- `aa-prototype/src/apps/admin/screens/MasterData.tsx` and 17's `apps/admin/screens/masters/`
  (`Entity`, `NAV` at :41, `InsurersView` at :364, `HospitalsView` at :275, `PermanentListsView` at
  :244, `ListStatusesView` at :453); sheets in `apps/admin/flows/` (`HolidaySheet`,
  `EditHospitalSheet`, `SurgeonEditSheet`, `SurgeonRoomSheet`, `SurgeonGroupSheet`,
  `ContractEditSheet`, `ProcedureTypeSheet`, `ModifierCodeSheet`, 19a's `DefaultRvgContractsSheet`);
  `apps/admin/tableChrome.ts`.
- `aa-prototype/src/shared/demoTriggers/` (14): `types.ts` (`surfaces`, `indexPath`), `registry.ts`,
  `context.ts` (`DemoContextValues`); `src/store/demoActors.ts` (`OFFICE_ACTOR`);
  `src/shared/DemoBadge.tsx`.
- `aa-prototype/src/shared/audit/actionLabels.ts`, `auditNarrative.ts`.
- Tests to extend: `store/mastersActions.test.ts`, 17's `store/surgeonActions.test.ts`, 19's and 19a's
  `store/rvgMasterActions.test.ts` and `store/contractActions.test.ts`, `domain/conflicts.test.ts`,
  `domain/seed/seed.test.ts`, 28's `domain/seed/canvasGolden.test.ts`, `store/persistMigrate.test.ts`,
  `shared/audit/auditNarrative.test.ts`, `shared/demoTriggers/demoTriggers.test.ts`,
  `src/pwa/pwaPurity.test.ts`; Playwright `visual/admin-phase07.spec.ts` (the master-data shot).

## Work items

Build in this order: types, pure rules, seed, store, then screens. **Session 1 ends after item 10,
green.**

1. **Types** (`src/domain/types.ts`; DM-38, US-13.4.1, US-11.4.1):
   - `Hospital`, `Surgeon`, `SurgeonRoom`, `SurgeonGroup` and `Insurer` gain
     `retiredAtISO?: IsoDate` and `retiredReason?: string`. Anaesthetists keep their existing
     `active` flag ("Inactive"), which is already maintained; say so in the Decisions log rather than
     migrating it. The organisations master that 18 keeps behind surgeon groups (its record type,
     whatever 18 named it) gains the same two fields: 18's Decision (g) hands its retire and
     reinstate to this phase.
   - New `PublicHoliday { id: PublicHolidayId; dateISO: IsoDate; name: string; kind: 'national' | 'regional'; region?: string; openHospitalIds: HospitalId[] }`.
     `openHospitalIds` lists hospitals that run as normal that day; every other hospital is closed.
     The `region` is a label ("Canterbury"), not a filter, because every AA hospital is in
     Christchurch.
   - `SeedMasters` / `AppState['masters']` gain `publicHolidays: Record<PublicHolidayId, PublicHoliday>`.
   - New top-level slice `AppState.masterLoads: { loads: Record<MasterLoadId, MasterLoad>; goLive: GoLiveBatch | null }`,
     not persisted inside `masters` because a load is an office work item, not master data. The
     types come from item 4 (`src/domain/masterLoad/types.ts`), re-exported here.
   - `ListConflict` (30) gains `publicHolidayId?: PublicHolidayId`. The cause key for a public
     holiday is `publicHoliday:<id>`, alongside 30's `holiday:<holidayId>`.
   - `allocateId` kinds in `ID_FORMATS`: `publicHoliday` (`PHN`, pad 3; the seed uses `PH001`),
     `insurer` (`INN`, pad 3; the seed uses `I-NIB`), `masterLoad` (`ML`, pad 3) and `goLiveBatch`
     (`GL`, pad 2). `hospital` (`HN`) exists already; add room, surgeon and group kinds only if 17 did not.
2. **Pure rules** (new files, no React, each with a Vitest file beside it):
   - `src/domain/masterLifecycle.ts`: `isRetired(record)`; `activeOnly(records, keepId?)`, which
     keeps a retired record only when it is the current value, so an edit form never silently drops
     a stored hospital; `retireBlockers(kind, id, facts)` returns readable blocker sentences with
     counts. The caller fills `facts` from the store (the domain does not import the store):
     - **hospital:** upcoming non-AUTHORISED Lists and Draft Lists on or after the demo clock's
       today; active recurring bookings; membership of the generator's ad hoc set
       (`ADHOC_HOSPITALS`), worded as "New days are still scheduled here"; non-retired Contracts
       other than its protected default; membership of 34's `INTEGRATED_HOSPITALS`, worded as
       "Hospital sync is set up here".
     - **surgeon:** upcoming Lists and Draft Lists; active recurring bookings; the generator's ad hoc
       set if it has one.
     - **room:** active surgeons linked to it (17 makes `roomId` required).
     - **group:** non-retired Contracts it holds (18's surgeon-group holder).
     - **organisation:** non-retired surgeon groups whose `billingOrganisationId` names it (18).
     - **insurer:** `acceptsDirectClaims` on ("Turn off direct claims first"); non-retired Contracts
       it holds other than its protected default; non-AUTHORISED Procedures whose selected Contract
       it holds, its protected default included (20). There is no Booking or Patient insurer field
       and no billable-party override to count (D2, D17).
     Protected defaults (each hospital's RVG Default Hospital, each insurer default, each procedure's
     default RVG Contracts) are never retired by this phase: they stay for locked and past Bookings,
     and the hospital and insurer ones stop being chosen because their holder can no longer be
     picked.
   - `src/domain/holidays.ts`: `closuresFor(dateISO, hospitalId, { hospitalHolidays, publicHolidays })`
     returns `Closure[]`, where `Closure` is `{ source: 'hospital'; holidayId; name } | { source: 'public'; publicHolidayId; name }`.
     `closuresIndex(masters)` builds the date-and-hospital map 30's `conflictFactsFor` reads, with a
     public holiday applied to every hospital not in `openHospitalIds`. Retired hospitals are still
     indexed, because a past List there still reads its closure. Tests: a public holiday closes every
     hospital; an open hospital is excluded; a hospital holiday and a public holiday on the same day
     give two closures; the index is stable for equal input.
   - Extend 30's `conflictFactsFor` and `expectedConflicts` to read `closuresIndex`. A public closure
     yields `{ kind: 'holiday', cause: 'publicHoliday:<id>', publicHolidayId }`. `describeConflict`
     reads "St George's is closed: Labour Day (public holiday)." Lists with no hospital (AA rooms)
     still raise no holiday conflict, as today; record that reading. Extend `conflicts.test.ts`.
   - **Every other holiday reader moves too.** Route each reader from the drift-check grep (the canvas
     generator, the horizon advance, `addAnaesthetist`'s canvas generation, 30's recurring-booking
     projection and conflict preview, 31's Draft List assignment warning and its recurring clash, and
     any other) through `closuresFor` / `closuresIndex` instead of `masters.holidays` alone. 31's
     warning reads "St George's is closed that day (Labour Day, public holiday)." for a public
     closure. A test per reader: with the per-hospital Labour Day rows gone, Labour Day still closes
     the hospital for that reader.
3. **Seed** (`domain/seed/availabilityAndHolidays.ts`, `domain/seed/index.ts`; DM-38):
   - New `PUBLIC_HOLIDAYS`: `PH001` Labour Day Mon 26 Oct 2026 (national); `PH002` Canterbury
     Anniversary Day Fri 13 Nov 2026 (regional, "Canterbury"); `PH003` Christmas Day Fri 25 Dec 2026;
     `PH004` Boxing Day (observed) Mon 28 Dec 2026; `PH005` New Year's Day Fri 1 Jan 2027; `PH006`
     Day after New Year's Day (observed) Mon 4 Jan 2027; `PH007` Waitangi Day (observed) Mon 8 Feb
     2027. Every row has `openHospitalIds: []`. Only the first two fall inside today's canvas horizon
     (28's configurable horizon, four months in current practice, may reach further: count what it
     covers); the rest make the calendar look real and flag Lists if the presenter rolls the clock
     forward.
   - `HOSPITAL_HOLIDAYS` drops its per-hospital Labour Day and Canterbury Anniversary rows (for the
     original five hospitals and 34's appended ones). It keeps only hospital-specific closures (30's
     `HH900`). Keep the `HH` id range for those.
   - `buildSeed` passes `publicHolidays` to `reconcileAllConflicts`. **The flagged-List set must not
     move:** every List flagged by a per-hospital Labour Day or Canterbury row before is flagged by the
     public holiday after. Only the cause key changes (`holiday:HH001` to `publicHoliday:PH001`).
     Regenerate the golden canvas fixture's conflicts column only, and assert that the flagged-id set
     equals the baseline from the drift check.
   - Insurers: the seed keeps nib and AIA Health. More insurers are added by hand in the demo (the
     checklist's Southern Health Cover), so the seed does not grow.
   - Seed tests: the public holidays are present and sorted; no hospital holiday is named Labour Day
     or Canterbury Anniversary Day; the flagged set is unchanged; two builds deep-equal.
   - Bump `PERSIST_VERSION` by one, with a comment line ("Phase 42: master public-holiday calendar
     replaces per-hospital statutory rows; retire fields on masters; masterLoads slice"), and extend
     `persistMigrate.test.ts`.
4. **Loader engine, pure** (`src/domain/masterLoad/`; US-13.4.3 AC1):
   - `csv.ts`: `parseCsv(text)` returns `{ header: string[]; rows: { rowNumber; cells: string[] }[] }`.
     It handles quoted cells, embedded commas and quotes, CRLF, a leading BOM, and blank trailing
     lines. `rowNumber` is the spreadsheet row, with the header as row 1. Tests for each case.
   - `types.ts`:
     - `LoadEntity` = `'hospitals' | 'hospitalHolidays' | 'publicHolidays' | 'surgeonRooms' | 'surgeons' | 'procedureMaster' | 'modifierCodes' | 'contracts' | 'feeScheduleLines' | 'contractBaseUnitOverrides'`:
       US-13.4.3's list at 3d3a18c (hospitals; surgeons and rooms; procedures with their RVG mapping
       and base units, which land on the default RVG Contracts; modifiers; any Contracts, as the
       Contract, its schedule lines and its base-unit overrides) plus the two calendars.
     - `RowResult` = `{ rowNumber; cells; status: 'valid' | 'rejected'; reasons: string[]; key: string; fields? }`.
     - `MasterLoad` = `{ id; entity; source: { kind: 'sample'; sampleId } | { kind: 'file'; fileName }; header; headerErrors: string[]; rows: RowResult[]; status: 'staged' | 'loaded' | 'discarded'; stagedAtISO; stagedBy; loadedAtISO?; loadedRecordIds?: string[]; goLiveBatchId? }`.
     - `LoaderSpec<F>` = `{ entity; label; columns: { key; header; required; hint }[]; parseRow(cells, ctx): { fields: F } | { reasons: string[] }; keyOf(fields): string; groupKeyOf?(fields): string; validateGroup?(rows, ctx): Map<rowNumber, string[]>; existing(fields, masters): string | null; references?(fields, ctx): string[] }`.
       `groupKeyOf` and `validateGroup` serve the procedure sheet, where one or two rows sharing a
       system code are one procedure with its one or two default RVG Contracts.
   - `validate.ts`: `validateSheet(spec, parsed, masters, ctx)`:
     - A missing required column rejects the whole sheet ("Missing column: Contact email"), and no
       row is valid.
     - A row with the wrong cell count is rejected ("Row has 3 cells; the sheet has 2 columns").
     - Otherwise each row goes through `parseRow`, and then:
       - a duplicate key within the sheet is rejected ("Duplicate of row 4");
       - a key already in master data is rejected ("Already in master data: edit it there"), because
         a load adds and never overwrites;
       - an unresolved reference is rejected (for example "No surgeons' room named Riverside Rooms",
         "No Contract with code or name HOS-0099");
       - a group failing `validateGroup` rejects every row in it with the group's reason, so a
         procedure never loads with half its default RVG Contracts.
       `ctx.pendingKeys` lets a row reference a record loaded earlier in the same go-live batch (a
       surgeon naming a room, a schedule line naming a Contract on the Contracts sheet).
     - Every reason for a row is collected, not only the first.
   - **One set of rules.** Each spec's `parseRow` calls the same pure field validator the entity's
     manual create action uses. Extract those validators into `src/domain/masterValidation.ts` where
     they are not already pure (hospital name and email; hospital holiday; public holiday; room;
     surgeon; `ProcedureType` fields; 19a's default RVG base units and kind labels; modifier code,
     group and units; 18's Contract create fields with the fields 21 to 24 added; `FeeScheduleLine`
     fields and prices; 19a's base-unit override target, units, `overrideOverlap` and
     `defaultRvgUseBaseUnits`). The store actions call them too, so a rejected row's reason is word
     for word the refusal the Add sheet shows. A parity test drives both paths for each refusal.
5. **Store: hospitals, insurers and retirement** (`src/store/mastersActions.ts`, 17's
   `surgeonActions.ts`; US-13.4.1, US-11.4.1). Every action is office only, goes through `mutate()`
   with before and after metas, and takes its timestamps from the demo clock.
   - `createInsurer(api, actor, { name, acceptsDirectClaims })`:
     - it refuses a blank or duplicate name (case-insensitive);
     - when `acceptsDirectClaims` is true, the same commit mints the protected insurer default
       Contract, using the helper `setInsurerDirectClaims` uses (18's rule, name and AA code, and
       22's default payment setting), so there is one minting path;
     - it takes no cover-split or rate field: the split is the Contract's payment setting, typed per
       Booking (22, D18), and special rates are Contracts (US-11.4.1);
     - it audits `insurer.create`, plus `contract.create` for the default.
   - `editInsurer(api, actor, id, { name })` refuses a blank or duplicate name, and audits
     `insurer.update`. The direct-claims flag stays on `setInsurerDirectClaims`, whose behaviour is
     unchanged apart from refusing a retired insurer.
   - **Renames follow through.** `editHospital` (17) and `editInsurer` also rename the holder's
     protected default Contract when its name still equals the generated name for the old holder
     name. The rename happens in the same commit and audits `contract.update`, or writes a version if
     25 versions Contract names. A default the office has renamed by hand is left alone.
   - `retireMaster(api, actor, kind, id, reason)` and `reinstateMaster(api, actor, kind, id)` for
     `hospital | surgeon | surgeonRoom | surgeonGroup | insurer | organisation` (18 keeps the
     organisations master and hands its retire here):
     - retire refuses `notFound`, `alreadyRetired`, `reasonRequired`, and `inUse` with
       `retireBlockers`' sentences joined;
     - reinstate refuses `notFound` and `notRetired`;
     - they audit `<kind>.retire` and `<kind>.reinstate`.
     No delete action is added for these masters.
   - Every create and edit action for these masters, the List, Draft List and Booking write paths
     that take a hospital or surgeon, and the Contract holder and scope writes (18) refuse a retired
     id ("St George's is retired"). The exception is when the value is unchanged, so editing an old
     List at a retired hospital still saves.
   - Tests (extend `mastersActions.test.ts` and `surgeonActions.test.ts`): the anaesthetist actor is
     refused everywhere; each refusal; `createInsurer` with and without direct claims (the default is
     minted once, with the right category, holder and AA code); the rename follow-through with a
     generated and a hand-edited default name; each kind's retire blockers and reinstate (an insurer
     held by an open Procedure's Contract is refused); a retired hospital refused by the List and
     Booking write paths but tolerated when unchanged.
6. **Store: the public-holiday calendar and the RVG time rule** (`src/store/mastersActions.ts`,
   19a's `rvgMasterActions.ts`; DM-38, US-13.4.1, US-05.2.2):
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
     `validateRvgTimeRule` with its sentences, `partInterval` fixed at `'roundUp'` (D25: a patch that
     changes it is refused, "A part interval always rounds up."). Audits `rvgTimeRule.update` with
     before and after. It re-prices Procedures that carry no Phase 25 lock, on DRAFT and SUBMITTED
     Bookings; locked Procedures and AUTHORISED invoices keep their figures.
   - Tests: with the clock rolled into range, the seeded Christmas Day (`PH003`) flags that day's
     Lists, and adding a second public holiday on the same date is refused
     (`duplicatePublicHoliday`); add a public holiday on a canvas weekday, and it flags the Lists; mark
     one hospital open, and its flags clear while the others stay; move the date, and the old flags
     clear and the new ones raise; delete, and everything clears; an office clear (30) on a
     public-holiday conflict holds only while the cause stands. The time rule: a valid edit changes a
     DRAFT Booking's T units and not a locked one; a malformed rule and a part-interval change are
     refused.
7. **Store: loads** (`src/store/masterLoadActions.ts`, exported from `src/store/index.ts`;
   US-13.4.3 AC1):
   - `stageMasterLoad(api, actor, { entity, csvText, source })`:
     - it parses and validates against current masters and writes a `staged` `MasterLoad`;
     - it audits `masterLoad.stage` with `after: { entity, rows, valid, rejected, source }`;
     - it never writes `masters` (a test deep-equals `masters` before and after);
     - it refuses `officeOnly`, an unknown entity and an empty sheet. A schedule line or override
       naming a missing, retired or wrong-basis Contract is a rejected row, not a refused sheet;
     - staging a new load for an entity discards any earlier staged load for that entity
       (`masterLoad.discard`), so each view shows one live result.
   - `commitMasterLoad(api, actor, loadId)`:
     - it refuses `notFound`, `notStaged`, and `nothingToLoad` (zero valid rows);
     - it **re-validates** against current masters first. A row that has gone stale since staging
       (for example the same hospital added by hand in between) turns rejected with its new reason
       and is not loaded;
     - it then runs **one** `mutate()` whose recipe folds each valid row through the entity's create
       planner (item 9), in row order;
     - it writes one meta per created record, using the same action name as a manual create
       (`hospital.create`, `procedureType.create`, `contract.create` and so on) with `after`
       carrying `{ loadId, rowNumber }`, plus one `masterLoad.commit` summary meta;
     - calendar loads reconcile conflicts through 30's `mutate()` hook once, and the summary returns
       `{ flagged, resolved }`;
     - it marks the load `loaded` with `loadedRecordIds`;
     - if any planner refuses mid-fold (a bug, since the rows were just re-validated), the whole
       commit aborts and returns the refusal. It never partially loads.
   - `discardMasterLoad(api, actor, loadId)` audits `masterLoad.discard`.
   - Tests: office only; stage never touches masters; commit loads exactly the valid rows and no
     rejected row; one commit, with the expected meta count; stale re-validation; `nothingToLoad`; a
     second commit is refused; ids are deterministic (two runs deep-equal, and the same sample after a
     Reset gives identical records, so a test load repeats); each loaded record's History shows
     "Loaded from spreadsheet, row N".
8. **Loader specs and sample spreadsheets** (`src/domain/masterLoad/specs/*.ts`,
   `src/domain/masterLoad/samples.ts`; US-13.4.3, US-04.4.2):
   - One spec per `LoadEntity`, each small. The columns are:
     - hospitals: Hospital name, Contact email;
     - hospital holidays: Hospital, Date, Name (30's `addHospitalHoliday` rules: the hospital exists
       and is not retired, one closure per hospital and date), keyed on hospital and date;
     - public holidays: Date, Name, Kind (National or Regional), Region, Open hospitals (hospital
       names separated by ";"), with item 6's rules, keyed on the date;
     - surgeons' rooms: Room name, Contact email, Phone;
     - surgeons: Name, Specialty, Room, HPI CPN, NZ registration number (for information), keyed
       on the HPI CPN (17's handoff), with 17's HPI CPN normaliser, shape check and duplicate check
       across surgeons and anaesthetists;
     - **procedure master and default RVG Contracts** (US-05.1.6, US-04.4.2): System code, Procedure
       name, Group, Subgroup, RVG code, Default modifiers (codes separated by ";"), Kind, Base units.
       One row per default RVG Contract: a procedure with one default has one row and a blank or
       labelled Kind; a procedure with two (for example Simple and Complex) has two rows sharing the
       system code, both labelled. Procedure fields follow 19's `createProcedureType` rules (name,
       group, an existing RVG code, `systemCodeIsFree`, existing modifiers, no duplicate name under
       the same code). Base units are "5" or "8 to 10" and follow 19a's rules (positive whole
       numbers, min under max for a range) with no RVG reference range check and no warning (drift
       step 2); Base units is required, because the sheet is where the default Contract's figure
       comes from. `validateGroup` refuses a third row with 19a's `defaultRvgTwoAtMost` sentence, an
       unlabelled pair ("Two default RVG Contracts need a kind each, for example Simple and
       Complex."), and a pair whose procedure fields differ ("Rows 5 and 6 share a system code but
       name different procedures."). Nothing lands on `ProcedureType` or `RvgCode` as base units;
     - modifier codes: Code, Group, Units, Description, Selection (19's rules: an existing group, a
       unique code, units a non-negative whole number);
     - **Contracts** (any style, US-13.4.3): Name, Category, Holder, Pricing basis, Unit rate, Effective
       from, Review date, Procedures (system codes or body headings separated by ";"), then one
       column per field 21 to 24 added to the Contract editor's create path (required inputs, payment
       setting with its default split share, invoice layout, delivery method, GST treatment,
       multi-procedure rule, the defined unit rate and the allows-adjustment rule, and 23's
       combination fields), each optional where the editor has a default. Validation is 18's
       `createContract` validator with those fields' rules. The AA code is never read from the sheet:
       18's `nextAaCode` makes it at commit (D16). Refused: a protected default's category for its
       holder ("A hospital's RVG Default Hospital Contract is made with the hospital."), anything
       marking a default RVG Contract (19a's `defaultRvgManagedByProcedure` sentence: they come from
       the procedure sheet), and an unknown or retired holder. **Procedure scope follows 19a:** a
       Procedures cell sets `scope.procedureTypeIds`; a blank cell is valid only when the same load
       batch carries mapped schedule lines for that Contract, whose scope is then derived at commit
       through `procedureScopeFromLines`, and otherwise is rejected with 19a's `noMappedLines`
       sentence;
     - fee-schedule lines: Contract (an existing Contract's AA code or name, or the name of a Contract
       on the same batch's Contracts sheet), then 18's line fields (holder code, description, mapped
       RVG codes, price ex GST, price incl GST, effective from, time band from and to, add-on), with
       18's rules (the Contract's pricing basis takes schedule lines, holder code unique within the
       Contract, both prices above zero and agreeing at ex x 1.15 to the cent);
     - Contract base-unit overrides: Contract (as above), then Procedure (system code), RVG code or
       RVG group (exactly one, 19a's three target kinds), Base units (19a's rule: a positive whole
       number, no guide range check; a duplicate target, an `overrideOverlap` or a default RVG
       Contract is rejected with 19a's sentence).
     Insurers, anaesthetists, recurring bookings, availability statuses and the RVG reference codes
     and groups have no sheet (not on US-13.4.3's list); they are maintained by hand.
     Dates are ISO `YYYY-MM-DD` or `d/m/yyyy` (both parsed, and anything else rejected with "Date
     must be a real date, for example 2026-12-25").
   - `samples.ts`: `SAMPLE_SHEETS`, one or more bundled CSV strings per entity, each
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
     - `procedure-master.csv`: valid single-default rows, one ranged row ("8 to 10") and one Simple
       and Complex pair; one base-unit value outside its RVG reference, which loads (AA's own
       figure) and is pinned as valid; rejected, a zero value, an unknown RVG code, a taken system
       code, an unlabelled pair and a third row for one procedure;
     - `modifier-codes.csv`: rejected rows include an unknown group and a non-numeric unit;
     - `surgeons.csv`: rejected rows include a malformed HPI CPN, a duplicate HPI CPN and an unknown
       room;
     - `contracts.csv`: valid, one fixed-schedule surgeon Contract with procedures and one
       rate-basis hospital Contract with body headings; rejected, a blank Procedures cell with no
       lines, an unknown holder, a second RVG Default Hospital for St George's, a split payment
       setting with no default share;
     - `fee-schedule-lines.csv`: lines into a seeded fixed-schedule Contract (from 18), named by AA
       code, with one holder code that already exists on it and one line naming a rate-basis
       Contract;
     - `base-unit-overrides.csv`: into a seeded hospital Contract; rejected, an unknown procedure, a
       zero value and a row naming a default RVG Contract.
     Write the fixture rows against the masters as 17 to 34 left them, and pin each sample's valid
     and rejected counts in a test.
   - The samples live in `src/domain` so the trigger registry (inside the PWA import closure) can
     import them. They are demo fixtures, not seed: nothing loads them at build time.
9. **Create planners, one path** (store; the refactor that keeps loads inside the guards):
   - Extract the body of each create action the loader targets into a pure planner:
     `planHospitalCreate(state, fields)`, `planHospitalHolidayCreate`, `planPublicHolidayCreate`,
     `planSurgeonRoomCreate`, `planSurgeonCreate`, `planProcedureTypeCreate`,
     `planModifierCodeCreate`, `planContractCreate`, `planFeeScheduleLineCreate` and
     `planContractBaseUnitOverrideCreate`.
   - Each returns `{ state: nextSlices, metas }` or a refusal. It includes the id allocation, the
     protected-default minting for hospitals, 18's `nextAaCode`, and 25's Contract version write for
     Contracts, lines and overrides.
   - `planProcedureTypeCreate(state, fields, { defaultRvg? })` creates the procedure and its default
     RVG Contracts in one plan: from `defaultRvg` (one or two `{ kindLabel?, baseUnits }` from the
     sheet) when a load supplies it, otherwise through 19a's `generateDefaultRvgContract` from the
     RVG reference, exactly as the manual `createProcedureType` does today. One planner, two sources.
   - Contracts loaded with a blank Procedures cell get their scope from 19a's
     `procedureScopeFromLines` after the batch's lines fold, in the same commit.
   - The single-record actions become `validate, plan, mutate`, with behaviour and audit unchanged
     (their existing tests prove it). `commitMasterLoad` folds the same planners.
   - A load into one Contract writes **one** Contract version labelled "Loaded from spreadsheet" for
     the whole load, if 25's version model takes a change set. Otherwise follow 25's per-edit rule and
     note it in PROGRESS.
10. **Go-live batch, pure and store** (`src/domain/masterLoad/solutionsPlus.ts`,
    `src/domain/masterLoad/goLive.ts`, `src/store/goLiveActions.ts`; US-13.4.2, US-13.4.3 AC2):
    - `solutionsPlus.ts`:
      - `SOLUTIONS_PLUS_OPERATIONS`, the fixture: about 14 rows of `{ scanRow, name, spUnits }`
        transcribed from a printed list. `spUnits` is kept only to be shown struck through.
      - The rows include junk:
        - "10% discount" (the catalogue's example);
        - "DO NOT USE - old code";
        - "Test op";
        - "Misc";
        - an upper-case, trailing-space duplicate of "Laparoscopic cholecystectomy";
        - one name already in 19's procedure master.
      - `junkReason(name)` returns "Looks like a pricing note, not an operation" for a percent sign or
        the word discount, and "Marked not for use" or "Not an operation" for the other patterns.
      - `normaliseOperationName(name)` folds case, whitespace and punctuation. A candidate whose
        normalised name repeats an earlier scan row is junk with the reason "Duplicate of scan row N".
      - Fixture counts, pinned in a test and quoted by the trigger message and the checklist: 14
        rows, 5 junk ("10% discount", "DO NOT USE - old code", "Test op", "Misc", the duplicate), 2
        not approved, 1 already in the procedure master, and the rest approved.
      - Tests for each pattern and for the duplicate.
    - `goLive.ts`:
      - `GO_LIVE_PACK` = the Solutions Plus list plus six controlled sheets, in load order: surgeons'
        rooms, surgeons (referencing those rooms), the procedure master with default RVG Contracts
        (as AA fills it from the approved names), Contracts (one fixed-schedule surgeon Contract
        with a blank Procedures cell), fee-schedule lines (into that Contract by name, so its scope
        derives from them) and public holidays for 2027 (the calendar, Greg's point 40).
      - `GoLiveCandidate` = `{ scanRow; name; spUnits; decision: 'approved' | 'notApproved' | 'junk'; reason? }`.
        The fixture carries AA's recorded decisions: most approved, two not approved ("No longer
        performed by AA members", "Replaced by a newer operation name"), and junk set by `junkReason`
        and by the duplicate rule.
      - `evaluateGoLive(batch, masters)` joins each candidate to the procedure sheet by normalised
        procedure name (per system-code group). It returns one outcome per candidate: `loads`,
        `notApproved`, `junk`, `noControlledRow` ("Needs an RVG code and base units in the controlled
        spreadsheet"), `alreadyInMaster`, or `controlledRowRejected` (with the sheet's reasons).
      - A procedure-sheet group with no Solutions Plus candidate loads as an AA addition, because
        names can come from AA as well.
      - A procedure-sheet group whose candidate is not approved or junk is rejected ("Not approved
        for go-live").
      - **Solutions Plus units are never read** into anything that loads. A test gives the fixture
        units that differ from the controlled sheet and from the RVG reference, and asserts the loaded
        default RVG Contracts' base units equal the controlled sheet's.
    - `goLiveActions.ts`:
      - `stageGoLiveLoad(api, actor)` creates the `GoLiveBatch` (`{ id, candidates, loadIds, status, stagedAtISO, stagedBy, loadedAtISO? }`),
        stages each controlled sheet as a `MasterLoad` with `goLiveBatchId`, validating in pack order
        with `pendingKeys`, and audits `goLive.stage`. It refuses while a batch is already staged.
      - `setGoLiveApproval(api, actor, scanRow, approved, reason?)` refuses a junk row ("Junk is
        excluded and cannot be approved") and audits `goLive.approve` or `goLive.unapprove`. It
        re-runs the procedure sheet's validation, so the join outcomes follow at once.
      - `commitGoLiveLoad(api, actor)` runs one `mutate()` that folds every sheet's valid rows in
        pack order through the item 9 planners. Procedure groups are included only when
        `evaluateGoLive` says `loads`. It marks every load and the batch `loaded`, and audits
        `goLive.commit` with the counts (loaded by sheet, Solutions Plus entries not loaded).
      - `discardGoLiveLoad(api, actor)`.
    - Tests (`goLive.test.ts`, `goLiveActions.test.ts`):
      - each outcome;
      - an unapproved candidate never appears in the procedure master (US-13.4.2 AC1);
      - loaded fields come only from the controlled sheets (US-13.4.2 AC2), base units on the default
        RVG Contracts and none on the procedure;
      - "10% discount" is excluded and cannot be approved (US-13.4.3 AC2);
      - un-approving a row before commit removes it and its default RVG Contracts from the load;
      - rooms load before the surgeons that reference them, and the Contract before its lines, whose
        mapping sets its procedure scope;
      - one commit, and nothing partial on a planner refusal;
      - Reset then stage and commit again gives identical records (the repeatable test load).

    **Session 1 ends here, green:** `npm run build`, `npm run build:pwa` and `npx vitest run`, with
    every existing Master data view still rendering, and the flagged-List set unchanged.

11. **One pattern for every view** (`apps/admin/screens/masters/`; US-13.4.1 "in one place"):
    - `masterViews.ts`, a registry the sub-nav renders from:
      `{ view; label; group: 'People and places' | 'Schedule' | 'Billing' | 'Settings' | 'Go-live'; catalogueRows: string[]; add: boolean; edit: boolean; retire: boolean; remove: boolean; load?: LoadEntity[] }`.
    - The groups:
      - People and places: Anaesthetists, Hospitals & holidays (load: hospitals, hospital holidays),
        Surgeons (load: surgeons), Surgeons' rooms (load: rooms), Surgeon groups, Insurers, and
        Organisations (18's surviving master);
      - Schedule: Recurring bookings (30's view and id), Availability statuses (29's), Public
        holidays (load: public holidays);
      - Billing: Contracts (load: Contracts, fee-schedule lines, base-unit overrides; 19a's "Default
        RVG Contracts" view inside it, load: procedure master), Procedure master (load: procedure
        master), RVG codes (with 19a's time rule panel), RVG groups, Modifier codes (load: modifier
        codes);
      - Settings: Xero & archiving;
      - Go-live: Go-live load.
    - The `?view=` param and the existing view ids are kept.
    - **One label.** The area is "Master data" in every heading, subtitle and caption. App copy never
      says "reference tables" or "reference data" (Greg, 2026-10-02 #39); the RVG master's
      "Reference base units" (19a, the RVG reference) is a different sense and stays.
    - `MasterViewChrome.tsx` holds the shared pieces:
      - `MasterHeader`: title, one-line subtitle, count, the primary teal "Add ..." action, and a
        secondary "Load from spreadsheet" where `load` is set;
      - `ShowRetiredToggle`: off by default; retired rows render in mist with a neutral "Retired" pill
        and the reason in its title;
      - `RetireSection`, for the foot of an edit sheet: "Retire" with a required reason, showing
        `retireBlockers` as a warning list when refused, or "Reinstate";
      - `LoadResultBanner`: the entity's staged or last load, from item 13.
    - Refit every view to it, including 17's, 18's, 19's, 19a's, 29's and 30's.
      - Drop any remaining "view only" or "read only" subtitle.
      - Views with retire use `RetireSection` in their existing sheet.
      - Rows referenced by nothing keep their delete: hospital holidays, public holidays, and 19's
        RVG groups and unlinked procedure master entries.
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
      - RVG codes;
      - RVG groups;
      - modifier codes;
      - Contracts.
      Every masters view that retires declares `retire`. Every `LoadEntity` is offered by at least
      one view.
    - MasterData publishes the current view with `useDemoTriggerContext('masters.view', view)`. Add
      the key to `DemoContextValues`.
12. **Insurers, Hospitals & holidays, Public holidays and the time rule** (US-11.4.1, US-13.4.1,
    DM-38, US-05.2.2):
    - **Insurers** (rebuilt):
      - a table with columns Name, Accepts direct claims (Yes / No), Contracts (count of non-retired
        Contracts it holds, linking to Contracts filtered by holder, if 18's view filters), and
        Status;
      - "Add insurer" and a row "Edit" open `InsurerSheet` (name, and an "Accepts direct claims"
        switch). On add, the switch creates the default Contract. On edit, it calls
        `setInsurerDirectClaims` with 18's copy on what it creates. The sheet ends with
        `RetireSection`;
      - the subtitle reads "Insurers that accept direct claims hold Insurance Contracts. Special
        rates are Contracts, and a split with the patient is set by the Contract's payment
        setting.";
      - `InsurerSheet` has no split, rate or funding field; under the switch, one caption reads
        "Rates and any split with the patient are set on the insurer's Contracts.", linking to
        Contracts filtered by this holder;
      - hook: `data-shot="masters-insurers"`.
    - **Hospitals & holidays:**
      - 17's `EditHospitalSheet` gains `RetireSection`, and a rename shows "Its default Contract is
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
    - **RVG time rule** (19a's read-only panel on RVG codes, `masters-rvg-time-rule`): an "Edit"
      action opens `RvgTimeRuleSheet`: one row per tier (from minute, interval minutes; add and
      remove a tier), "A part interval always rounds up." as a read-only line, a live preview of
      `describeTimeRule` and worked examples (95 and 125 minutes), and Save calling `editRvgTimeRule`
      with its refusal sentences inline. `data-shot="rvg-time-rule-sheet"`. First in the trim order.
13. **Load from spreadsheet** (`apps/admin/flows/LoadSpreadsheetSheet.tsx`,
    `apps/admin/screens/masters/LoadResultPanel.tsx`; US-13.4.3 AC1):
    - `LoadSpreadsheetSheet` (through `useSurface().Overlay`) has:
      - where the view offers more than one sheet, a segmented choice of which (for example
        Contracts · Schedule lines · Base-unit overrides);
      - the sheet's name and its columns (required ones marked), from the spec, with the procedure
        sheet's hint "One row per default RVG Contract. Two rows share a system code when a procedure
        has a Simple and a Complex kind.";
      - "Download template", a header-only CSV built client-side as a Blob, with no fetch;
      - a `.csv` file input (FileReader text passed to `stageMasterLoad`, with source `file`);
      - the caption "Save the controlled spreadsheet as CSV. Rows that fail a check are listed and not
        loaded.";
      - the one line on the open question: "Whether admins re-load after go-live is still to be
        decided. Loads add new rows and never change existing ones."
      There is no sample-file option here. Samples are demo fixtures and live in the Demo actions menu
      (item 17).
    - `LoadResultPanel`, shared with the go-live view:
      - a summary line (hospitals.csv: "6 rows · 2 valid · 4 rejected");
      - an Admin Review style table with columns Row (mono), the spec's key columns, Result (a
        success-tint "Valid" or error-tint "Rejected" pill, always with its word), and Reasons (one
        per line); the procedure sheet groups a pair's two rows under one procedure;
      - "Only rejected" filter chips;
      - a teal "Load 2 valid rows" and a secondary "Discard".
      After a load, the summary reads "Loaded 2 rows on 21 Jul 2026 · 4 rejected rows were not
      loaded" (a calendar load adds "· 6 Lists flagged"; all counts are computed), the new rows appear in the view's table at
      once, and each row links to its record where the view has a detail page (the surgeon profile,
      the Contract's detail panel, the procedure's `DefaultRvgContractsSheet`).
    - `LoadResultBanner` sits above each view's table while that entity has a staged load, or a load
      in the last demo day. It is collapsible.
    - Hooks: `data-shot="master-load-sheet"`, `data-shot="master-load-result"`.
14. **Go-live load view** (`apps/admin/screens/masters/GoLiveLoadView.tsx`, group Go-live; US-13.4.2,
    US-13.4.3 AC2):
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
      - Controlled spreadsheet shows the procedure's RVG code (mono) and its default RVG Contract base
        units ("5", "8 to 10", or "Simple 4 · Complex 6"), or "No row";
      - Result is "Loads" or "Not loaded" with the reason;
      - non-junk rows have an Approve / Unapprove toggle (`setGoLiveApproval`). On junk rows the toggle
        is disabled, with the reason as its tooltip;
      - hook: `data-shot="go-live-candidates"`.
    - **Controlled spreadsheets:** one collapsible card per sheet in pack order (Surgeons' rooms,
      Surgeons, Procedure master and default RVG Contracts, Contracts, Schedule lines, Public
      holidays), each with its counts and a `LoadResultPanel` without its own Load button.
    - Actions: a teal "Load approved data" (`commitGoLiveLoad`) and a secondary "Discard". The result
      line reads, for example, "Loaded 3 rooms, 5 surgeons, 7 procedures with 8 default RVG
      Contracts, 1 Contract with 4 schedule lines and 4 public holidays. 8 Solutions Plus entries were
      not loaded.", with links to each view. The counts are computed, never typed in; the fixture's
      are pinned in `goLive.test.ts` (item 10).
    - A caption under the candidate table states the clean-cut rule (US-13.4.3): "Solutions Plus
      identifiers and unit values are not carried over. Only operation names are used."
    - Hook: `data-shot="masters-go-live"`.
15. **Audit labels and narrative** (`shared/audit/actionLabels.ts`, `auditNarrative.ts`, and
    `fieldLabels.ts` where fields are new):
    - Hospitals and insurers:
      - `hospital.retire` "Hospital retired";
      - `hospital.reinstate` "Hospital reinstated";
      - the same pair for surgeon, surgeon room, surgeon group, insurer and organisation;
      - `insurer.create` "Insurer added" and `insurer.update` "Insurer updated".
    - Public holidays:
      - `publicHoliday.create` "Public holiday added";
      - `publicHoliday.update` "Public holiday changed";
      - `publicHoliday.delete` "Public holiday deleted".
    - Time rule: `rvgTimeRule.update` "RVG time rule changed", narrated through `describeTimeRule`
      before and after.
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
    - Add `activeHospitals`, `activeSurgeons`, `activeRooms`, `activeGroups` and `activeInsurers`
      selectors in `store/selectors.ts`, built on `activeOnly(records, keepId)`.
    - Route every picker from the drift-check grep through them: `EditListSheet`, `PhoneAdviceBooking`,
      30's recurring-booking sheet, the Draft List and assignment flows (31), the Contract holder and
      scope chips (18), the surgeon room select (17), the matching-screen create actions (33), 35's
      admin Booking editor if it picks a hospital or surgeon, and the shared `SurgeonSelect` (17).
      There is no Booking insurer or funding picker (D2: 20 removed it) and no billable-party
      override picker (D17: 21 removed it).
    - 20's Contract picker hides a Contract whose holder is retired (keeping it, labelled, when it is
      the Procedure's current Contract). That is how a retired hospital's or insurer's protected
      default stops being chosen without being retired itself. Default RVG Contracts (holder: the
      Booking's billable party) are unaffected.
    - A retired current value shows as "St George's (retired)".
    - Display paths (grid, drawer, invoices, history, profile) keep resolving retired names unchanged.
    - Tests: a retired hospital is absent from a fresh picker and present, labelled, when it is the
      current value; a retired insurer's Contracts are absent from a fresh Contract picker.
17. **Demo triggers** (`src/shared/demoTriggers/registry.ts`; bodies call the item 7 and 10 actions;
    see the table below). Update the registry tests that assert entries per route. Add nothing to the
    Control Panel page; its index lists both entries under "Admin · Master data" automatically.
18. **Shots and hooks** (`visual/admin-phase07.spec.ts`, or a new `visual/admin-masters-loads.spec.ts`):
    - the Insurers view;
    - Public holidays;
    - the hospital calendar with Labour Day;
    - a staged hospitals load with its result panel;
    - the loaded state;
    - a staged procedure-master load with a Simple and Complex pair;
    - the time rule sheet;
    - the go-live view before and after "Load approved data".
    Keep the existing master-data shot green; move its hooks if 17 moved them.
19. **Copy sweep and demo guide.**
    - Grep the app for copy these masters make stale:
      - "view only" and "read only" on Master data;
      - any "full NZSA 2021 set loads at go-live (Phase 42)" or similar (19's RVG subtitle) becomes
        "At go-live, the procedure master and its default RVG Contracts load from AA's controlled
        spreadsheet.";
      - "reference tables" or "reference data" anywhere in app copy (one label: "Master data");
      - "slot" in any new or touched Master data string (D14);
      - any "Phase 42" string in rendered copy.
    - No en or em dash in any new string.
    - Then the demo guide updates below.

## Demo triggers

| id | Label | Screen (routes) | Surfaces | Effect | Disabled when |
|---|---|---|---|---|---|
| `load-sample-spreadsheet` | Load sample spreadsheet | Admin · Master data (`/admin/masters`) | bar | `when`: the published `'masters.view'` has `load` entries in `masterViews.ts`. `choices`: that view's `SAMPLE_SHEETS`, labelled by file name (Hospitals & holidays offers "hospitals.csv" and "hospital-holidays.csv"; Contracts offers "contracts.csv", "fee-schedule-lines.csv" and "base-unit-overrides.csv"; Procedure master and the Default RVG Contracts view offer "procedure-master.csv"; Public holidays offers "public-holidays-2027.csv"). `run`: `stageMasterLoad` as 14's shared `OFFICE_ACTOR` (Kirsty, because in the framed build the presenter is the office choosing the file), with source `{ kind: 'sample', sampleId }`. The view's `LoadResultBanner` opens on the result. It stages and does not load, so the presenter shows the rejected rows and then presses the product's own "Load N valid rows". Message: "hospitals.csv checked: 2 rows valid, 4 rejected. Review the result on Hospitals & holidays and press Load." | a staged load for this entity already exists ("A load is already waiting on this screen; load or discard it first") |
| `go-live-data-load` | Go-live data load (demo) | Admin · Master data (`/admin/masters`, any view) | bar | `run`: `stageGoLiveLoad` as the same actor. The Master data sub-nav's Go-live load item gains a warn dot while a batch is staged, and every view shows a one-line banner, "A go-live load is ready to review", with an "Open" link that sets `?view=goLive`. The presenter approves or un-approves names and presses the product's "Load approved data". Message: "Go-live load prepared: 14 Solutions Plus names (5 excluded as junk, 2 not approved) and 6 controlled spreadsheets. Open Master data, Go-live load." | a batch is already staged ("A go-live load is already waiting; load or discard it first") |

`indexPath`: `/admin/masters?view=hospitals` for the sample loader and `/admin/masters?view=goLive`
for go-live (use the real view ids). Both entries are bar only. Their bodies and fixtures live in
`src/shared` and `src/domain`, so `pwaPurity.test.ts` still passes.

**Normal use, no button:** adding, editing, retiring and reinstating every master; the public-holiday
calendar; editing the RVG time rule; loading a real CSV through "Load from spreadsheet"; approving
go-live names; "Load N valid rows"; and "Load approved data".

**PWA:** none. Master data and loads are Admin-only, the PWA has no Admin, and no mobile beat waits on
master data. A retired hospital or surgeon simply stops appearing in the anaesthetist's pickers
through item 16.

## Out of scope

- **Excel (`.xlsx`) parsing.** Controlled spreadsheets are saved as CSV; record the reading.
  Mapping arbitrary column names is out too: the template's headers are the contract.
- **Updating existing records from a load, or deleting by load.** A load only adds; editing a loaded
  default RVG Contract afterwards is by hand in 19a's sheet (US-04.4.2 "then maintained by hand").
  The drift check says what changes if AA decides re-loading.
- **Loads for anaesthetists, insurers, recurring bookings, availability statuses, RVG reference codes
  and RVG groups.** They are not on the catalogue's spreadsheet list (US-13.4.3) and each is maintained
  by hand in its view. Recurring bookings are the "calendar schedules" the room left unclear: hand-made
  here, logged for the owner (the drift check says what to add if the list names them). RVG codes are
  reference data (OQ-62) and keep 19's editor; the full NZSA set is narrated, not loaded.
- **Editing the modifier groups themselves** (19 deferred it here). The catalogue asks for modifier
  codes, not groups, and the groups are selection-rule structure held in code (`MODIFIER_GROUPS`).
  Note it in PROGRESS as considered and not built.
- **Protected defaults from the Contracts sheet.** Hospital and insurer defaults are minted by their
  holder rows (hospitals sheet, insurer add), and default RVG Contracts by the procedure sheet; the
  Contracts sheet refuses them.
- **Loading patients, Bookings, invoices, balances or anything transactional from Solutions Plus.**
  The clean cut excludes them; the go-live view says so in its subtitle.
- **Any Solutions Plus identifier** (US-13.4.3 takes names only; OQ-51 was deleted unanswered),
  and additional-invoice numbering (Phases 38b and 39).
- **An insurer cover split, rate or funding field on the insurer row.** The split is the Contract's
  payment setting with a typed share on the Booking (US-04.2.12, D18), built in Phase 22; special
  rates are insurer Contracts (US-11.4.1). This phase only links an insurer to its Contracts.
- **Changing the time rule's rounding.** A part interval always rounds up (D25); the editor changes
  tiers only.
- **Editing the hospital sync set-up** (34's `INTEGRATED_HOSPITALS` and its
  `HOSPITAL_SYNC_DELIVERIES` fixture in `domain/intake/syncDeliveries.ts`). It is integration
  configuration, not a US-13.4.1 table. It stays code-held; a hospital in it cannot be
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
      Go-live), every view has the same header, and no Master data copy says "view only", "reference
      tables", "reference data" or "slot".
- [ ] Insurers: add "Southern Health Cover" with direct claims on. It appears with Yes, and Contracts
      shows its new protected insurer default with an AA code. Rename it, and the default's generated
      name follows. Try to retire nib: refused with "Turn off direct claims first" and its Contracts
      listed. Retire the new insurer with a reason: it greys out under "Show retired" and the Contract
      picker on a new Booking's Procedure no longer offers its Contracts. The Insurer sheet has no
      split or rate field, and its caption points at the insurer's Contracts, where nib's payment
      setting (22) shows Full or Split with its default share.
- [ ] Hospitals & holidays: rename a hospital, and the Day grid, List drawer, Booking detail and
      Contracts holder column show the new name, while an already-raised invoice keeps the old
      addressee. Try to retire St George's: refused, with upcoming List and recurring booking counts.
      Retire a hospital with no upcoming work: accepted, gone from Edit list and phone advice, and
      still shown on its past Lists. Reinstate it.
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
- [ ] RVG codes, time rule: Edit shows the two tiers and "A part interval always rounds up." read-only;
      the preview gives 7 units for 95 minutes and 9 for 125. A tier with a zero interval is refused
      with 19a's sentence. Save a changed tier, and a DRAFT Booking's T units follow while an
      AUTHORISED one does not. Put it back.
- [ ] Demo actions on Hospitals & holidays: "Load sample spreadsheet", hospitals.csv. The result panel
      shows each rejected row with its reason (already in master data, name required, email, duplicate)
      and the valid rows. Nothing is added yet. Press "Load 2 valid rows": they appear in the list,
      and each one's History reads "Loaded from spreadsheet, row N". The rejected rows are absent.
      Then hospital-holidays.csv: the valid closures load and their result line counts the Lists
      flagged.
- [ ] Public holidays, public-holidays-2027.csv: the four 2027 holidays load, the seeded Christmas
      Day's date, the impossible date, the unknown hospital and the blank name are rejected with
      reasons.
- [ ] Procedure master, procedure-master.csv: the result groups the Simple and Complex pair under one
      procedure; the ranged "8 to 10" row and the row outside its RVG reference are valid with no
      warning; the zero, the unknown RVG code, the taken system code, the unlabelled pair and the
      third row are rejected with 19's and 19a's wording. Load: the procedures appear with no base
      units column of their own, and each one's default RVG Contracts (19a's view and sheet) hold the
      sheet's figures, editable by hand.
- [ ] Repeat on Surgeons' rooms, Surgeons (a row naming an unknown room, a malformed HPI CPN and a
      duplicate HPI CPN are each rejected with 17's wording), Modifier codes and Contracts:
      contracts.csv (the Contract with no procedures and no lines, the unknown holder, the second RVG
      Default Hospital and the split with no share are rejected; the loaded Contracts get AA codes and
      their procedure scope), fee-schedule-lines.csv (a duplicate holder code and a line naming a
      rate-basis Contract are rejected), base-unit-overrides.csv (a default RVG Contract target is
      rejected with 19a's sentence); if 25 is built, one version "Loaded from spreadsheet" is written
      per Contract per load. Insurers, Recurring bookings and Availability statuses show no "Load
      from spreadsheet" and no sample trigger.
- [ ] Load from spreadsheet with a real file: download the template, add two rows (one bad) in a text
      editor, save as CSV and choose it. The same result panel appears. A file missing a required
      column is rejected as a whole, with "Missing column: ...".
- [ ] Stale protection: stage the hospitals sample, then add "Rangiora Day Surgery" by hand, then
      press Load. That row turns rejected ("Already in master data") and only the others load.
- [ ] Demo actions, "Go-live data load (demo)": the banner appears on every view. On Go-live load,
      "10% discount", "DO NOT USE", "Test op", "Misc" and the upper-case duplicate are Excluded with
      reasons, and their toggles are disabled. Solutions Plus units are struck through and marked Not
      used. Two names show Not approved. Six controlled spreadsheets are listed in pack order.
- [ ] Un-approve one approved name: its Result turns "Not loaded: not approved for go-live" and the
      tiles update. Press "Load approved data": the result line counts rooms, surgeons, procedures
      with default RVG Contracts, the Contract with its lines, and public holidays. The Procedure
      master shows the new procedures, their default RVG Contracts hold the controlled sheet's base
      units (not Solutions Plus's, not the RVG reference), the loaded Contract's scope came from its
      lines, and the un-approved and junk names are absent.
- [ ] Repeatable: Reset, then run the go-live load again and load it: the same records with the same
      ids and AA codes.
- [ ] Audit viewer: filter to masterLoad and goLive. Stage, commit, approvals and each created record
      are present, with who, role and before and after.
- [ ] The harness bar shows "Load sample spreadsheet" only on Master data views with a loader, and
      "Go-live data load (demo)" only on Master data. Neither shows on Day view or in the installed
      PWA. The Control Panel index lists both under Admin · Master data.
- [ ] Reset: loads, the go-live batch and the loaded records are gone. The public holidays and the
      time rule are back as seeded.
- [ ] No en or em dash in any new copy, no crimson on any new control, teal the only action colour, and
      every outcome pill carries its word.
- [ ] Catalogue screenshots: the recipes for the covered items above (US-13.4.1, US-11.4.1, US-13.4.2 and US-13.4.3) are created or updated, any recipe this phase broke is re-pointed, a full `npm run capture` ends with no failed recipe and no story without a recipe, the covered items' new shots are checked by eye, and `npm run verify:board` is green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots` and `npm run verify:board` are all green.

## Demo guide updates

In the same session (each phase patches the beats it touches):
- `docs/demo-guide/03-demo-script.md`:
  - **S5, a new optional Beat 5 "Controlled master data and a clean-cut go-live"** (about 2
    minutes):
    - Click: Admin, Master data, Hospitals & holidays, Demo actions, Load sample spreadsheet. Point at
      the rejected rows, then Load. Then Demo actions, Go-live data load (demo), and Master data,
      Go-live load. Point at "10% discount" excluded, the struck-through Solutions Plus units and the
      base units beside each approved name. Un-approve one name, then Load approved data, then open
      the Procedure master and one new procedure's default RVG Contract.
    - Say: "AA starts clean. Only data AA has approved is loaded, and it comes from AA's own
      controlled spreadsheets: hospitals, surgeons, procedures with their default RVG Contracts, any
      Contracts, and the calendars. Every row is checked with the same rules as a manual add, and
      anything that fails is listed and left out. Solutions Plus gives us names, not numbers. And
      because it is a spreadsheet, the same load runs again into a test system."
    - Expected: as in the manual checklist.
  - **S5 Discovery points:** add "whether admins can re-load master data after go-live
    (US-13.4.3)" and "whether recurring bookings join the spreadsheet list (US-13.4.3's calendar
    schedules)".
  - **Direct URLs:** add `/admin/masters?view=publicHolidays` and `/admin/masters?view=goLive` (use
    the real view ids).
  - **S2** only if it names a hospital holiday by its old per-hospital row. Labour Day is now a
    public holiday; check the wording.
- `docs/demo-guide/04-presenter-cheat-sheet.md`:
  - the Admin Web list: "Master data and audit" becomes "Master data (every master in one place,
    spreadsheet loads including Contracts and calendars, go-live load) and audit";
  - one line under availability and holiday conflicts: public holidays come from one master calendar;
  - one "strong phrase": "Nothing comes across because it exists in Solutions Plus."
- `docs/demo-guide/01-personas-and-responsibilities.md`: Kirsty's duty 9 ("Maintain schedule-related
  master data ...") becomes "Maintain all master data (hospitals, surgeons and rooms, insurers,
  recurring bookings, public holidays and hospital calendars, codes, procedures with their default
  RVG Contracts, and Contracts), including loads from AA's controlled spreadsheets".
- `docs/demo-guide/02-workflows-and-handoffs.md`: in the canvas workflow's triggers, "A recurring
  booking or hospital holiday changes" (Phase 30's wording) becomes "A recurring booking, hospital
  holiday or public holiday changes". Add a short "Master data and go-live" note beside the Source
  list naming the clean cut and the repeatable spreadsheet loads.
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
changed these recipes since this plan was written.

**Covered items.** When the phase is done, each recipe in `requirements-board/capture/recipes/`
matches what was built:

| Item | Recipe at plan time | When this phase is done |
|---|---|---|
| [US-13.4.1](../../../../requirements-board/requirements/stories/US-13.4.1.md) Maintain reference tables | partial · master-data states anaesthetists, contracts, permanent-lists, hospitals-holidays, surgeons, rvg-codes, modifier-codes, list-statuses (several captioned "(view only)"; partial reason names view-only masters, no surgeon or RVG groups and no master holiday calendar) | captured. Re-shoot `master-data` at `/admin/masters` with one state per view in the grouped sub-nav (People and places, Schedule, Billing, Settings, Go-live), keeping the existing state slugs but re-pointing the clicks to the current button names (Recurring bookings for `permanent-lists`, Availability statuses for `list-statuses`) and re-captioning with no "(view only)"; add states `surgeon-groups`, `rvg-groups`, `procedure-master`, `public-holidays` (`masters-public-holidays`, the master calendar with a national and a Canterbury row), `hospitals-holidays` with Labour Day and a retire refusal (St George's: refused with upcoming List and recurring booking counts), and `retired` (a retired hospital under "Show retired"). Highlight the table or sub-nav group the state is about. Captions say "Master data", never "reference tables". Drop the partial reason |
| [US-11.4.1](../../../../requirements-board/requirements/stories/US-11.4.1.md) Insurer master data | captured · insurers (the Insurers button, highlight `table`) | stays captured. Re-shoot `insurers` with the rebuilt view (columns Name, Accepts direct claims, Contracts count, Status; hook `masters-insurers`) in place of the bare `table` highlight, and add an `add-insurer` state (InsurerSheet with the direct-claims switch and the caption "Rates and any split with the patient are set on the insurer's Contracts.") and a `retire-refused` state (nib: "Turn off direct claims first") |
| [US-13.4.2](../../../../requirements-board/requirements/stories/US-13.4.2.md) Clean-cut start, not a full migration | none (create it) | create, captured. Admin shot `go-live-load` at `/admin/masters?view=goLive` with states `staged` (run the `go-live-data-load` entry from `[data-shot=demo-actions]` first: "14 Solutions Plus names (5 excluded as junk, 2 not approved)", the struck-through units and the 6 controlled spreadsheets; highlight `go-live-candidates`) and `loaded` (after un-approving one name and pressing "Load approved data"; the result line, the un-approved and junk names absent). Caption: "Clean-cut start: only AA-approved data is loaded" |
| [US-13.4.3](../../../../requirements-board/requirements/stories/US-13.4.3.md) Reference data loaded from controlled spreadsheets | none (create it) | create, captured. Admin shot `controlled-load` with states `sheet` (`/admin/masters?view=hospitals`, Load from spreadsheet sheet, `master-load-sheet`, Download template and the required columns), `result` (after the `load-sample-spreadsheet` entry stages hospitals.csv: "6 rows · 2 valid · 4 rejected", each rejected row with its reason; `master-load-result`), `loaded` (after "Load 2 valid rows": "Loaded 2 rows on 21 Jul 2026 · 4 rejected rows were not loaded", the new rows in the table), `procedure-master` (procedure-master.csv staged on the Procedure master: the Simple and Complex pair grouped, the Base units column, a rejected zero) and `contracts` (contracts.csv staged on Contracts: a rate-basis and a fixed-schedule Contract valid, the no-procedures row rejected with its reason). Caption: "Controlled spreadsheet loaded, with rejected rows listed with reasons" |

**Recipes this phase breaks.**

- About 28 recipes open `/admin/masters` and click a sub-nav button by name; 42 regroups the sub-nav and adds a "Load from spreadsheet" action to several headers (item 11), so each needs its button names and highlights checked with `--dry`. Found by `grep -l 'admin/masters'` at 3d3a18c: `FT-04.1`, `FT-05.1`, `FT-13.4`, `US-01.1.2`, `US-01.1.3`, `US-01.2.2`, `US-01.3.2`, `US-01.5.1`, `US-01.5.2`, `US-04.1.1`, `US-04.1.2`, `US-04.2.1`, `US-04.2.2`, `US-04.2.4`, `US-04.2.5`, `US-04.2.9`, `US-04.4.1`, `US-05.1.1`, `US-05.1.3`, `US-05.1.4`, `US-05.1.5`, `US-05.2.1`, `US-09.3.3`, `US-12.1.1`, `US-12.1.2` and `US-12.1.4`, plus those 17 to 41 added (re-grep: at least 19's `US-05.1.6` on the Procedure master and 19a's `US-04.4.2` on the Default RVG Contracts view, and 19a's time-rule panel if a `US-05.2.2` state highlights it). The buttons they use include Contracts, Hospitals & holidays, Recurring bookings, Availability statuses, Insurers, Procedure master and RVG codes.
- `US-01.5.1.json` and `US-01.5.2.json` (hospital holiday calendar and its conflicts): the seeded per-hospital Labour Day and Canterbury Anniversary rows migrate to the master public-holiday calendar, so re-point any hospital-holiday highlight to the new "Public holidays" line or view.
- Any recipe that lists hospitals or surgeons in a picker (Booking, Contract holder): retired masters leave the pickers (item 16); the seed has none retired, so no change expected.
- Work item 18 lists the Playwright specs; the `--dry` run is the check for anything else.

**ATLAS.md.** Update "Routes" (the `?view=` Master data views and `/admin/masters?view=goLive`), "Overlays that need clicks" (InsurerSheet, PublicHolidaySheet, RvgTimeRuleSheet, Load from spreadsheet with its sheet choice, the retire dialogs), "Existing hooks" (`masters-insurers`, `masters-public-holidays`, `master-load-sheet`, `master-load-result`, `go-live-candidates`, `masters-go-live`, `rvg-time-rule-sheet` and the sub-nav group hooks) and the line that says Master data tabs include "Hospitals & holidays".

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
  including after an approval toggle, a stale row, a half-valid procedure pair or a planner refusal.
  Hunt for a second create path that bypasses a planner, such as a spec building a record itself.
- **One set of rules.** Every rejected-row reason equals the manual action's refusal text for the same
  input. The parity test covers every refusal of every spec. No validator is duplicated between
  `masterValidation.ts` and a store action. Surgeon rows use 17's one HPI CPN rule, not a second check.
  Contract rows use 18's create validator with 21 to 24's fields, not a loader-only reading.
- **Base units land where D12 puts them.** Loaded base units go onto default RVG Contracts (procedure
  sheet) or Contract overrides (override sheet) only, never onto `ProcedureType` or `RvgCode`. They
  follow 19a's manual rules (positive whole numbers, a range with min under max, one or two defaults
  with labelled kinds): no load refuses a value for being outside its RVG reference, and no load
  raises a warning for it (AA's own figures; D3's warning is for an anaesthetist's entry). Every
  loaded procedure has at least one default RVG Contract (US-05.1.6 AC1), and a loaded Contract's
  procedure scope is the sheet's or 19a's derivation from its lines, never empty by accident.
- **Clean cut is honest.** Solutions Plus units never reach a loaded record. Junk cannot be approved.
  An unapproved name never loads, even when the controlled sheet has a row for it. The go-live view's
  wording does not claim the masters were emptied. A Reset and re-run gives identical records.
- **Retire, never break a reference.** A retired hospital, surgeon, room, group, organisation or
  insurer still resolves everywhere it is displayed (grid, drawer, invoices, history, profile,
  locks). It disappears from every picker (check the drift-check grep list, including 31's, 33's and
  20's Contract picker by holder). No Booking or Patient insurer field and no per-Booking
  billable-party override has crept back in to support a picker or a blocker (D2, D17). Blockers are
  correct and counted from the demo clock's today. Protected defaults are never retired.
- **Public holidays through the one conflict rule.** The flagged-List set did not move in the
  migration. Every public-holiday change, including a calendar load, reconciles through 30's
  `mutate()` hook with no stamping. `openHospitalIds` raises and clears exactly the right flags. An
  office clear on a public-holiday cause behaves like 30's. AA-rooms Lists stay unflagged. No reader of
  hospital holidays (generator, horizon advance, `addAnaesthetist`'s generation, recurring-booking
  projection, conflict preview, Draft List warning and recurring clash) still reads `masters.holidays`
  alone.
- **The time rule.** Only tiers change; a part interval always rounds up (D25). One function prices
  time everywhere (19a's `timeUnitsFromMinutes` with `masters.rvgTimeRule`); locked Procedures and
  AUTHORISED invoices keep their figures.
- **Change once, reflected everywhere.** A hospital or insurer rename shows in every live surface.
  The protected default's generated name follows, a hand-edited one does not, and locked or raised
  invoices keep their snapshot. List any other stored copy of a master name the grep found.
- **Determinism and state.** Ids come from `allocateId`, AA codes from `nextAaCode`, timestamps from
  the demo clock, and `FileReader` is the only browser API used for input. `masterLoads` resets with
  the seed. `PERSIST_VERSION` is bumped and `persistMigrate.test.ts` extended.
- **Trigger scope, copy and design.** Both triggers are bar only, show only on Master data (the sample
  loader only on views with a loader), are disabled with a reason, and never load by themselves. The
  sample fixtures are imported from `src/domain`, and `pwaPurity.test.ts` holds. The app says "Master
  data", never "reference tables", and never "slot". Teal is the only action colour, outcome pills
  carry words, the result panel follows Admin Review's table, and there are no en or em dashes.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry; ROADMAP.md "Owner review: agents test
  themselves"): the readings built where the catalogue is open (re-loading after go-live: allowed,
  add only; calendar schedules: public and hospital holidays loaded, recurring bookings hand-made;
  the Contracts sheet's column set; the time rule editable by tier), anything logged rather than
  fixed, and the screens worth a look, each with its route and persona (Kirsty: Master data, Public
  holidays, Procedure master after a load, Go-live load).
- **Status row** for catch-up Phase 42, and a phase entry with:
  - the drift-check result (items changed since 3d3a18c or not, the re-load and calendar-schedule
    questions, whether Vanessa's files landed, and the 17 to 34 names used);
  - what was built, per work item;
  - the flagged-List set before and after the public-holiday migration;
  - the stored-name copies the grep found and what was done;
  - the `PERSIST_VERSION` bump (from and to);
  - tests added (including the rule-parity, US-13.4.1 coverage and repeatable-load tests);
  - the review pass.
- **Catalogue screenshots:** the recipes created or changed (by ID), the `capture/REPORT.md` counts before and after (captured, partial, absent, failed), the recipes this phase broke and how they were re-pointed, and any partial reason handed to a later phase.
- **Decisions log:**
  1. **Public holidays are one master calendar.** A row applies to every hospital except those
     listed as open that day. Hospital calendars hold only hospital-specific closures. The seeded
     per-hospital Labour Day and Canterbury Anniversary rows migrated with the flagged set unchanged.
     AA-rooms Lists raise no holiday conflict. This amends Phase 30's decision 10 ("Hospital
     holidays can be edited and deleted") and the original seed reading of `HOSPITAL_HOLIDAYS`
     (statutory days as per-hospital rows).
  2. **Masters referenced by identity retire, never delete.** Retire needs a reason, refuses while
     upcoming work depends on the record, hides the record from pickers, and keeps every reference
     resolving. Delete stays only for rows nothing references (holidays, public holidays, 19's unused
     RVG groups and procedure master entries). Anaesthetists keep their Active flag. This supersedes
     Phase 17's "no delete or deactivate; Phase 42 owns it" and the Phase 07 "view only" master
     readings.
  3. **A rename follows through to the holder's protected default Contract** while its name is still
     the generated one. Raised and locked invoices keep their snapshot (the catalogue's one
     exception).
  4. **Insurers are maintained in full.** Creating one with direct claims mints its protected insurer
     default in the same commit, through 18's single minting path (AA code and 22's default payment
     setting included). The insurer row carries no split or rate: a cover split is the Contract's
     payment setting with a typed share on the Booking (US-11.4.1, US-04.2.12, D18). An insurer that
     accepts direct claims, holds Contracts, or is reached by an open Procedure's Contract cannot be
     retired. Insurers sit on neither Booking nor Patient (D2), and no Booking overrides the billable
     party (D17).
  5. **Loads are checked, then committed.** Stage validates and reports without touching masters.
     Commit re-validates and loads exactly the valid rows in one audited `mutate()`, through the same
     planners and validators as a manual add. Each loaded record's audit carries its load and row.
     Rejected rows are never loaded (US-13.4.3 AC1). The same load after a Reset gives identical
     records, so a test system can be loaded again (Greg, 2026-10-02 #40).
  6. **Loads add and never overwrite; controlled spreadsheets are CSV.** Loads are allowed at any
     time while AA decides on re-loading (US-13.4.3), stated once on the loader sheet. An existing key
     is rejected with "Already in master data: edit it there".
  7. **Solutions Plus supplies operation names only.** Its units are never read, junk is excluded and
     cannot be approved, AA's approval gates each name, and no Solutions Plus identifier is carried
     (US-13.4.3; OQ-51 was deleted unanswered). The go-live demo loads into today's masters and says
     so.
  8. **Modifier groups stay code-held.** 19's deferral was considered and not built, because the
     catalogue asks for modifier codes.
  9. **Any Contract loads** (US-13.4.3 at 3d3a18c: "any Contracts (Could be RVG, fixed or other
     style)"). A Contracts sheet carries every field the Contract editor's create path takes (18 to
     24), with schedule lines and base-unit overrides on their own sheets, joined by Contract code or
     name. AA codes come from `nextAaCode` (D16). Protected defaults are minted by their holders and
     default RVG Contracts by the procedure sheet, never by the Contracts sheet. A loaded Contract's
     procedure scope is the sheet's, or derived from its loaded lines through 19a's
     `procedureScopeFromLines`. This supersedes this plan's earlier reading that only fixed fee
     schedules and base-unit overrides load and Contract rules stay editor-only. The hospital sync
     set-up (34) stays code-held, and an integrated hospital cannot be retired.
  10. **Loaded base units land on default RVG Contracts (D12, US-04.4.2).** The procedure sheet
     creates each procedure with its one or two default RVG Contracts holding the sheet's figures,
     under 19a's rules, with no RVG reference range check and no warning (AA's own figures; D3's
     after-procedure warning stays with an anaesthetist's entry). The procedure master and the RVG
     master hold none. After the load they are maintained by hand in 19a's sheet.
  11. **The loader covers US-13.4.3's list and the calendars** (hospitals, hospital holidays, public
     holidays, surgeons' rooms, surgeons, the procedure master with default RVG Contracts, modifier
     codes, Contracts, schedule lines, base-unit overrides). Insurers, anaesthetists, recurring
     bookings, availability statuses and the RVG reference codes and groups are maintained by hand.
     Recurring bookings are the unclear "calendar schedules": left hand-made, for the owner.
  12. **The RVG time rule is editable by tier** (19a's handoff, US-05.2.2 "defined as data"). A part
     interval always rounds up (D25) and is not editable.
  13. **One label: "Master data".** Greg would call these master data, not reference tables
     (2026-10-02 #39); the app uses "Master data" throughout. The catalogue story's title is the
     owner's to change.
- **Handoff notes:**
  - For **43**: `validateSheet` and `commitMasterLoad` are the seams to time on a full-scale sheet
    (thousands of Contracts and default RVG Contracts). `SAMPLE_SHEETS` shows the fixture pattern.
  - For **44**: S5's optional Beat 5; the re-load and calendar-schedule questions in the discovery
    points; public holidays on the anaesthetist calendars if wanted; any trim logged in this phase.
    The grouped Master data sub-nav and the "(view only)" captions on US-13.4.1's screenshots are
    re-shot in this phase's Catalogue screenshots step.
