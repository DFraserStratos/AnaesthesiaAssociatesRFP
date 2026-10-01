# Phase 42 · Reference data and controlled loads

**Requirements covered:**
[US-13.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.4.1.md) Maintain reference tables (Confirmed; closes the rows Phases 17, 18, 19, 29 and 30 did not: hospital retire, insurers, the master public-holiday calendar, and one consistent pattern across every master; its "recurring bookings" row is Phase 30's rename and editor, refitted here) ·
[US-11.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.4.1.md) Insurer master data (Confirmed; add, rename, retire and the accepts-direct-claims flag here. Its cover split between insurer and patient is the Contract's payment setting, built in Phase 22, so the insurer row carries no split) ·
[US-13.4.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.4.2.md) Clean-cut start, not a full migration (Proposed) ·
[US-13.4.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.4.3.md) Reference data loaded from controlled spreadsheets (Proposed) ·
[DM-38](../analysis/domain-model-delta.md#dm-38) Reference data: master public-holiday calendar, controlled-spreadsheet load, editable masters (the statutory calendar and loads; Phase 30 built the hospital-calendar half and the recurring-booking rename).
Also touches, without closing:
[FT-13.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-13.4.md) (the feature; its RFP-response ETL migration is narrowed to the clean cut),
[US-01.5.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.5.1.md) (each hospital keeps its own calendar; public holidays move out of it),
[US-05.1.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.1.6.md) (Verify: where base units live is [OQ-62](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-62.md)), [US-05.1.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.1.5.md) and [US-04.2.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.4.md) (their masters become load targets; Phases 18, 19 and 23 built them),
[US-04.2.12](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.12.md) (the Contract payment setting the Insurers view points at; Phase 22 built it).
No RV finding is closed here. **Open questions:** none gates this phase. OQ-51 (the Solutions Plus
identifiers) was deleted on the board unanswered on 2026-10-01; the clean cut takes operation names
only (US-13.4.3), so no identifier is carried. OQ-62 (where base units live) is Open and built by
Phase 19 as its recommendation; the master procedure list sheet loads base units wherever 19 holds them
(see the drift check).
**Depends on:** Phase 17 (surgeon profile with its one HPI CPN, surgeons' rooms, surgeon groups, hospital contact email, `editHospital`, `isPlausibleEmail`, the `apps/admin/screens/masters/` split and the `?view=` search param), Phase 18 (the Contract record with its AA identifier, `FeeScheduleLine`, Contract retire, the organisations master behind surgeon groups, the protected RVG Default Hospital and insurer defaults minted by `createHospital` and `setInsurerDirectClaims`), Phase 19 (the editable RVG, RVG group, modifier and master procedure list, `ProcedureType`, the base-unit resolver and the master procedure list's validator (a positive whole number, no RVG guide range check), `allocateId` kinds), Phase 29 (the Slot status master) and Phase 30 (derived conflicts reconciled in `mutate()`, `conflictFactsFor`, `describeConflict`, `HolidaySheet`, `editHospitalHoliday`, `deleteHospitalHoliday`, the hospital month calendar, and the rename of Permanent Lists to recurring bookings with their projection). Also relies on 14 (the demo-trigger registry, `useDemoTriggerContext`, the shared actor constants), 20 (the Contract picker; `Procedure.insurerId` removed with nothing in its place, per D2), 21 (the Booking's billable-party override), 22 (the Contract payment setting), 23 (Contract base-unit overrides and `addContractBaseUnitOverride`'s guards, if built), 25 (Contract versions), 31 (the Draft List holiday warning), 33 (the matching screen's create actions) and 34 (the three hospitals it appended).
**Estimated:** 2 sessions. Session 1 is the model, seed, pure rules and store (work items 1 to 10) and stops green with every existing screen still rendering. Session 2 is the screens, the go-live view, the triggers, the shots and the demo guide (items 11 to 19).
**Size warning:** this is a roll-up and sits at the top of two sessions; session 1 in particular is
heavy (seven loader specs, the planner refactor and the holiday migration). If session 1 runs long, end
it green after item 7 and start session 2 with items 8 to 10; do not drop a covered target. Within
session 2, trim in this order if needed, and log each trim for Phase 44: the Insurers "Contracts"
link-through (keep the count), the collapsible `LoadResultBanner` (keep it static), the public-holiday
"Lists affected" column, then Organisations retire.

## Goal

Master data has grown one phase at a time. Surgeons, rooms and groups came in 17, Contracts in 18,
RVG, modifier and master procedure lists in 19, Contract payment settings in 22, Slot statuses in
29, holiday editing and recurring bookings in 30. What is left
is the part US-13.4.1 names and nobody owns yet, and a single pattern that makes the whole area feel
like one tool:

- **Hospitals** can be edited (17) and now **retired and reinstated**. A rename also renames the
  hospital's protected default Contract while that name is still the generated one, so "change once,
  reflected everywhere" holds.
- **Insurers** can be **created, renamed, retired and reinstated**, each with the accepts-direct-claims
  flag. Creating a direct-claim insurer mints its protected insurer default Contract in the same
  commit, by the rule 18 set (US-11.4.1). Special rates and the cover split between insurer and
  patient are Contracts and their payment setting (22), never fields on the insurer row. Insurers
  sit on neither the Booking nor the Patient (D2): an insurer is reached through the Contract a
  Procedure selects, or a Booking's billable-party override (21).
- A **master public-holiday calendar**. One row per statutory or regional holiday, applying to every
  hospital unless a hospital is listed as open that day. The seeded per-hospital Labour Day and
  Canterbury Anniversary rows migrate into it, so each hospital's own calendar holds only its own
  closures (US-13.4.1, US-01.5.1). Public holidays raise conflicts through 30's derived rule.
- **Retire, never delete, anything referenced by identity.** Hospitals, surgeons, rooms, groups,
  insurers and organisations retire with a stated reason when nothing upcoming depends on them. Pickers stop offering
  them, and every existing reference keeps resolving.
- **One consistent pattern across every view:** grouped sub-nav, the same header, "Show retired", edit
  sheet, retire and reinstate, and a "Load from spreadsheet" action. It is driven by one registry of
  views, with a test that maps every US-13.4.1 row to a view that can add and edit.
- **A controlled-spreadsheet loader** for exactly the catalogue's spreadsheet list (US-13.4.3):
  hospitals, surgeons' rooms, surgeons, the master procedure list (with RVG mapping and base units),
  modifier codes, fee-schedule lines and Contract base-unit overrides (23's "Contract-specific
  overrides"). Insurers, hospital holidays and public holidays are not on that list and stay
  hand-maintained (a few rows each). A load is checked first: every row is validated with the same
  rules as the manual add, and a result panel lists valid rows and rejected rows with reasons. Then
  the admin loads it: one audited `mutate()` loads exactly the valid rows, and rejected rows never
  touch master data (US-13.4.3 AC1).
- **A clean-cut go-live demo.** A Solutions Plus operation list, names only, sits beside AA's
  decisions and the controlled spreadsheets. Junk such as "10% discount" is excluded, rows AA has not
  approved are not loaded, and Solutions Plus unit values are shown struck through and never used.
  "Load approved data" loads only approved, valid rows from the controlled spreadsheets
  (US-13.4.2 AC1 and AC2, US-13.4.3 AC2).

Two harness-bar triggers make the loads demoable without files on the presenter's laptop: "Load
sample spreadsheet" on the current Master data view and "Go-live data load (demo)". Nothing here is
mobile, so there is no PWA stand-in.

## Before you start: drift check

1. Diff the catalogue for this phase's items against the plan's snapshot (501b0b8, the 2026-10-01
   requirements update):

   ```
   git diff 501b0b8 -- "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-13.4.1.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-11.4.1.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-13.4.2.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-13.4.3.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/FT-13.4.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-01.5.1.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-01.3.2.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-05.1.6.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-05.1.5.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-04.2.4.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-04.2.12.md" "docs/discovery-reference/Updated Requirements/catalogue/questions/OQ-62.md" "docs/discovery-reference/Updated Requirements/domain-model.md"
   ```

   At 501b0b8 this plan already reflects: US-13.4.1's "Permanent Lists" row renamed "recurring
   bookings" (Phase 30's rename; this phase only refits its view); US-11.4.1's cover split moved onto
   the Contract's payment setting (US-04.2.12, built in 22; split basis OQ-68 is 22's); US-05.1.6 at
   Verify with base-unit placement disputed (OQ-62); US-04.2.4's holder code kept searchable (18 and
   20 built it; the fee-schedule loader carries the holder code as today); OQ-51 deleted. If an item
   changed after 501b0b8, re-read it and adjust the work items before planning. If a covered item is
   now Retired or Future, drop it from this phase and say so in the PROGRESS entry. Watch in
   particular for:
   - **Re-loading after go-live** (US-13.4.3: "Whether admins can re-load it later is to be
     decided"; still open at 501b0b8). The interim is that the per-view loader is available at any
     time, but it only adds and never overwrites (work items 4 and 7). If AA decides no re-load, keep the
     loader only inside the Go-live load view and remove the per-view "Load from spreadsheet" action.
     If AA decides re-load may update existing rows, add an "update" row outcome that shows a field
     diff and goes through the entity's edit action, and record it in the Decisions log.
   - **The spreadsheet list** in US-13.4.3 and the domain model's "Reference data and go-live"
     section. A new target joins the loader only if its master already exists; otherwise note it for
     Phase 44.
   - **The master calendar's scope** (national vs regional, or per-hospital opt-in rather than
     opt-out). The interim is "applies to every hospital unless listed as open".
   - **US-13.4.2 / 13.4.3 moving to Confirmed** with new acceptance criteria, for example a sign-off
     step or a named approver. Add it to the go-live batch as a field, not a new workflow.
2. **OQ-62 (where base units live).** Open at 501b0b8; Phase 19 built its recommendation (base
   units on the master procedure list, picked by operation name). Build the Procedure sheet against
   what 19 built: its Base units column loads into `ProcedureType` through 19's validator. If OQ-62
   has since been answered the other way and 19's follow-up moved base units onto the RVG code
   master, drop the Base units column from the Procedure sheet (names and RVG mapping only), point
   the go-live "units come only from the controlled sheet" test at the RVG code's value, and record
   it. Either way a loaded base-unit value obeys exactly the manual add's rule (19's
   `createProcedureType`, 23's `addContractBaseUnitOverride`: a positive whole number) and is never
   checked against the RVG guide's range: these are AA's own figures, which may depart from the
   guide by design (US-05.1.6, domain model "RVG code and modifier master"). They raise no warning
   either, because 19's `outsideGuide` is false for `'procedureList'` and `'contract'` sources. D3's
   after-procedure warning is about an anaesthetist's entry on a Procedure, not master data. No Solutions Plus identifier is carried (OQ-51 deleted; US-13.4.3 takes names only):
   the candidate list holds operation names plus the scan-row number for traceability ("Scan row
   14"). Additional-invoice numbering is Phase 39's.
3. **Baseline.**
   - Confirm Phases 17, 18, 19, 29 and 30 are DONE in PROGRESS.md, and note whether 20, 21, 22, 23,
     25, 31, 33 and 34 are DONE.
   - From their entries and Decisions-log rows, note the names actually chosen:
     - the view ids in `?view=` and the `NAV` shape (17, 19, 29);
     - the `SurgeonRoom`, `SurgeonGroup` and `Surgeon` fields (including the HPI CPN field, its
       normaliser and duplicate check across surgeons and anaesthetists) and their sheets (17);
     - `Contract.category`, `holder`, the AA identifier, `retiredAtISO`, the protected-default minting
       helpers, the `FeeScheduleLine` shape and `addFeeScheduleLine` (18);
     - `ProcedureType`, `procedureTypes`, `rvgGroups`, `MODIFIER_GROUPS`, `ModifierCodeSheet`,
       `ProcedureTypeSheet`, the base-unit validator and where base units live (19, OQ-62);
     - the Contract picker's filter and the default hospital Contract (20); the Booking's
       billable-party override field and its picker (21);
     - `Contract.paymentSetting` and its default for a newly minted insurer default (22);
     - `ContractBaseUnitOverride` and `addContractBaseUnitOverride`, if 23 built them;
     - what a Contract version records and which actions write one (25);
     - `masters.slotStatuses` (29);
     - `ListConflict.cause`, `conflictFactsFor`, `holidaysByDateHospital`, `reconcileAllConflicts`,
       the reconcile trigger list in `store/conflictReconcile.ts`, `HolidaySheet`, the hospital
       month calendar, and the recurring-booking names (`RecurringBooking`,
       `masters.recurringBookings`, `recurringBookingProjection.ts`, `applyRecurringBookingsToCanvas`,
       the view id) (30);
     - the hospitals 34 appended, their `HOSPITAL_HOLIDAYS` rows, and `INTEGRATED_HOSPITALS` /
       `HOSPITAL_SYNC_SCHEDULE` (34's `syncSchedule.ts`);
     - `validateSlotStatusDraft` (29), the precedent for item 4's pure validators.
     Use those names throughout. This doc's code references are as at the snapshot, or as those
     phases planned them.
   - Record the seed's flagged-List set today (List ids with a `holiday` conflict, by cause), so the
     public-holiday migration can prove the set does not move (work item 3).
   - Grep every picker that offers hospitals, surgeons, rooms, groups or insurers
     (`grep -rn "masters.hospitals\|masters.surgeons\|masters.insurers\|surgeonRooms\|surgeonGroups" src --include=*.tsx`)
     and list them, together with 20's Contract picker (which must hide Contracts whose holder is
     retired) and 21's billable-party override picker (which can name an insurer or hospital). Work
     item 16 routes each one through the active-only selectors.
   - From 18's entry, note the organisations master (`masters.organisations`, kept as the
     counterparty behind a surgeon group's `billingOrganisationId`) and 18's Decision (g), which hands
     its retire and reinstate to this phase.
   - Grep every reader of hospital holidays
     (`grep -rn "masters.holidays\|holidaysByDateHospital\|HospitalHoliday" src --include=*.ts --include=*.tsx`).
     At the snapshot: the canvas generator (`domain/seed/canvas.ts:91`), the horizon advance
     (`store/clockActions.ts:45`), the new-anaesthetist canvas generation in `addAnaesthetist`
     (`store/mastersActions.ts:278`) and the Hospitals view (`MasterData.tsx:280`); 30 and 31 add
     `conflictFactsFor`, the recurring-booking projection, the conflict preview and the Draft List
     assignment warning. List them; work item 2 routes each through `closuresIndex`,
     so no reader silently loses Labour Day when the per-hospital rows go.
   - Grep for stored copies of a master's name (for example a Contract name built from a hospital
     name, or a `hospitalName` on a record). List them; work item 5 handles the protected defaults,
     and anything else is noted for the reviewers.
   - Note the current `PERSIST_VERSION` in `src/store/appStore.ts` (13 at the snapshot; 14 to 41 will
     have bumped it) and bump it by one from whatever it is now.
4. **Owner decisions.** None of D1 to D11 gates this phase. D2 (answered: insurer and funding
   source on neither the Booking nor the Patient) shapes it: an insurer is referenced only as a
   Contract holder and as a Booking's billable-party override, so the insurer retire blockers and
   pickers read those (work items 2 and 16), never a Booking insurer field. D3 (answered: an
   anaesthetist may enter base units outside a code's range, with an after-procedure office
   warning) does not apply to master data: the Procedure and override loaders follow 19's and 23's
   manual-add rules, with no guide-range check and no warning (step 2).

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
blacklist", "RVG code and modifier master", "Reference data and go-live" and the glossary's
"Recurring booking" and "HPI CPN" entries. The 2026-10-01 note
(`catalogue/notes/2026-10-01-aa-meeting-with-greg.md`) points 12, 44 and 64 (insurer cover split,
recurring bookings, plain-RVG insurance jobs).

**Analysis:**
- `docs/prototype-build/catch-up/GAP-ANALYSIS.md`: theme 9 (master data and surgeon model), the
  "Oversight/NFR" demo-trigger line (Go-live load, Load sample spreadsheet), and the EP-13 and EP-11
  tables.
- `docs/prototype-build/catch-up/epics/EP-13.md` (US-13.4.1, 13.4.2, 13.4.3) and `epics/EP-11.md`
  (US-11.4.1: re-graded Partial, size S; add, edit and retire are this phase's, the split is 22's).
- `analysis/domain-model-delta.md` DM-38 (and DM-32, DM-13 and DM-09 for the load targets; DM-12
  for D2 and DM-28 for the payment setting).
- `analysis/prototype-map-admin.md` section 9 (Master data), `prototype-map-store-seed.md`
  (`mutate`, `allocateId`, masters actions, seed), `prototype-map-shell-demo-pwa.md` (the trigger
  registry and the PWA closure).

**Code entry points (as at the snapshot; use the names 17 to 34 chose where they differ):**
- `aa-prototype/src/domain/types.ts`: `Hospital` (:155), `Surgeon` (:160), `Insurer` (:166),
  `HospitalHoliday` (:602), and 17's `SurgeonRoom` and `SurgeonGroup`.
- `aa-prototype/src/domain/seed/cast.ts`: `HOSP`, `HOSPITALS` (:95-109), `INS`, `INSURERS` (:116-127);
  `domain/seed/availabilityAndHolidays.ts`: `HOSPITAL_HOLIDAYS` (a `flatMap` over `HOSPITALS` that
  writes Labour Day Mon 26 Oct and Canterbury Anniversary Day Fri 13 Nov per hospital, plus 30's
  `HH900` Southern Cross closure); `domain/seed/index.ts`: `SeedMasters` (:87) and `buildSeed`;
  `domain/seed/canvas.ts`: `ADHOC_HOSPITALS` (:61).
- `aa-prototype/src/domain/conflicts.ts` (30): `conflictFactsFor`, `expectedConflicts`,
  `describeConflict`, `reconcileAllConflicts`; `src/store/conflictReconcile.ts` (30), called only
  from `mutate.ts`.
- `aa-prototype/src/store/mastersActions.ts`: `createHospital` (:45), `setInsurerDirectClaims`
  (:102), 17's `editHospital`, and 30's `addHospitalHoliday`, `editHospitalHoliday` and
  `deleteHospitalHoliday`. `src/store/surgeonActions.ts` (17), `contractActions.ts` (18),
  `rvgMasterActions.ts` (19).
- `aa-prototype/src/store/mutate.ts`: `ID_FORMATS` (:61), `allocateId` (:99), `MutationMeta`
  (:115). `src/store/appStore.ts`: `AppState` (:75), `PERSIST_VERSION` (:130).
- `aa-prototype/src/apps/admin/screens/MasterData.tsx` and 17's `apps/admin/screens/masters/`
  (`Entity`, `NAV`, `InsurersView` at snapshot :364, `HospitalsView` at :274); sheets in
  `apps/admin/flows/` (`HolidaySheet`, `EditHospitalSheet`, `SurgeonEditSheet`, `SurgeonRoomSheet`,
  `SurgeonGroupSheet`, `ContractEditSheet`, `ProcedureTypeSheet`, `ModifierCodeSheet`);
  `apps/admin/tableChrome.ts`.
- `aa-prototype/src/shared/demoTriggers/` (14): `types.ts`, `registry.ts`, `context.ts`
  (`DemoContextValues`); `src/shared/DemoBadge.tsx`.
- `aa-prototype/src/shared/audit/actionLabels.ts`, `auditNarrative.ts`.
- Tests to extend: `store/mastersActions.test.ts`, 17's `store/surgeonActions.test.ts`,
  `domain/conflicts.test.ts`, `domain/seed/seed.test.ts`, 28's `domain/seed/canvasGolden.test.ts`,
  `store/persistMigrate.test.ts`, `shared/audit/auditNarrative.test.ts`, the registry tests,
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
     not persisted inside `masters` because a load is an office work item, not reference data. The
     types come from item 4 (`src/domain/masterLoad/types.ts`), re-exported here.
   - `ListConflict` (30) gains `publicHolidayId?: PublicHolidayId`. The cause key for a public
     holiday is `publicHoliday:<id>`, alongside 30's `holiday:<holidayId>`.
   - `allocateId` kinds in `ID_FORMATS`: `publicHoliday` (`PHN`, pad 3; the seed uses `PH001`),
     `insurer` (`INN`, pad 3; the seed uses `I-NIB`), `masterLoad` (`ML`, pad 3) and `goLiveBatch`
     (`GL`, pad 2). Add hospital, room, surgeon and group kinds only if 17 did not.
2. **Pure rules** (new files, no React, each with a Vitest file beside it):
   - `src/domain/masterLifecycle.ts`: `isRetired(record)`; `activeOnly(records, keepId?)`, which
     keeps a retired record only when it is the current value, so an edit form never silently drops
     a stored hospital; `retireBlockers(kind, id, facts)` returns readable blocker sentences with
     counts. The caller fills `facts` from the store (the domain does not import the store):
     - **hospital:** upcoming non-AUTHORISED Lists and Draft Lists on or after the demo clock's
       today; active recurring bookings; membership of the generator's ad hoc set (`ADHOC_HOSPITALS`), worded as "New
       days are still scheduled here"; non-retired Contracts other than its protected default;
       membership of 34's `INTEGRATED_HOSPITALS`, worded as "Hospital sync is set up here".
     - **surgeon:** upcoming Lists and Draft Lists; active recurring bookings; the generator's ad hoc
       set if it has one.
     - **room:** active surgeons linked to it (17 makes `roomId` required).
     - **group:** non-retired Contracts it holds (18's surgeon-group holder).
     - **organisation:** non-retired surgeon groups whose `billingOrganisationId` names it (18).
     - **insurer:** `acceptsDirectClaims` on ("Turn off direct claims first"); non-retired Contracts
       it holds other than its protected default; non-AUTHORISED Procedures whose selected Contract
       it holds, its protected default included (20); non-AUTHORISED Bookings whose billable-party
       override names it (21). There is no Booking or Patient insurer field to count (D2).
     Protected defaults are never retired by this phase: they stay for locked and past Bookings, and
     stop being chosen because their holder can no longer be picked.
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
     projection and conflict preview, 31's Draft List assignment warning, and any other) through `closuresFor` / `closuresIndex` instead of
     `masters.holidays` alone. 31's warning reads "St George's is closed that day (Labour Day, public
     holiday)." for a public closure. A test per reader: with the per-hospital Labour Day rows gone,
     Labour Day still closes the hospital for that reader.
3. **Seed** (`domain/seed/availabilityAndHolidays.ts`, `domain/seed/index.ts`; DM-38):
   - New `PUBLIC_HOLIDAYS`: `PH001` Labour Day Mon 26 Oct 2026 (national); `PH002` Canterbury
     Anniversary Day Fri 13 Nov 2026 (regional, "Canterbury"); `PH003` Christmas Day Fri 25 Dec 2026;
     `PH004` Boxing Day (observed) Mon 28 Dec 2026; `PH005` New Year's Day Fri 1 Jan 2027; `PH006`
     Day after New Year's Day (observed) Mon 4 Jan 2027; `PH007` Waitangi Day (observed) Mon 8 Feb
     2027. Every row has `openHospitalIds: []`. Only the first two fall inside today's canvas horizon;
     the rest make the calendar look real and flag Lists if the presenter rolls the clock forward.
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
     - `LoadEntity` = `'hospitals' | 'surgeonRooms' | 'surgeons' | 'procedureMaster' | 'modifierCodes' | 'feeScheduleLines' | 'contractBaseUnitOverrides'`,
       the US-13.4.3 list (drop the last if 23 did not build overrides).
     - `RowResult` = `{ rowNumber; cells; status: 'valid' | 'rejected'; reasons: string[]; key: string; fields? }`.
     - `MasterLoad` = `{ id; entity; source: { kind: 'sample'; sampleId } | { kind: 'file'; fileName }; targetContractId?; header; headerErrors: string[]; rows: RowResult[]; status: 'staged' | 'loaded' | 'discarded'; stagedAtISO; stagedBy; loadedAtISO?; loadedRecordIds?: string[]; goLiveBatchId? }`.
     - `LoaderSpec<F>` = `{ entity; label; columns: { key; header; required; hint }[]; parseRow(cells, ctx): { fields: F } | { reasons: string[] }; keyOf(fields): string; existing(fields, masters): string | null; references?(fields, ctx): string[] }`.
   - `validate.ts`: `validateSheet(spec, parsed, masters, ctx)`:
     - A missing required column rejects the whole sheet ("Missing column: Contact email"), and no
       row is valid.
     - A row with the wrong cell count is rejected ("Row has 3 cells; the sheet has 2 columns").
     - Otherwise each row goes through `parseRow`, and then:
       - a duplicate key within the sheet is rejected ("Duplicate of row 4");
       - a key already in master data is rejected ("Already in master data: edit it there"), because
         a load adds and never overwrites (the US-13.4.3 re-load interim);
       - an unresolved reference is rejected (for example "No surgeons' room named Riverside Rooms").
         `ctx.pendingKeys` lets a surgeon row reference a room loaded earlier in the same go-live
         batch.
     - Every reason for a row is collected, not only the first.
   - **One set of rules.** Each spec's `parseRow` calls the same pure field validator the entity's
     manual create action uses. Extract those validators into `src/domain/masterValidation.ts` where
     they are not already pure (hospital name and email; room; surgeon; `ProcedureType` mapping and
     base units; modifier code, group and units; `FeeScheduleLine` fields and prices; 23's base-unit
     override target, units and `overrideOverlap`). The store actions call
     them too, so a rejected row's reason is word for word the refusal the Add sheet shows. A parity
     test drives both paths for each refusal.
5. **Store: hospitals, insurers and retirement** (`src/store/mastersActions.ts`, 17's
   `surgeonActions.ts`; US-13.4.1, US-11.4.1). Every action is office only, goes through `mutate()`
   with before and after metas, and takes its timestamps from the demo clock.
   - `createInsurer(api, actor, { name, acceptsDirectClaims })`:
     - it refuses a blank or duplicate name (case-insensitive);
     - when `acceptsDirectClaims` is true, the same commit mints the protected insurer default
       Contract, using the helper `setInsurerDirectClaims` uses (18's rule, name and AA identifier,
       and 22's default payment setting), so there is one minting path;
     - it takes no cover-split or rate field: the split is the Contract's payment setting (22) and
       special rates are Contracts (US-11.4.1);
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
     that take a hospital or surgeon, the Contract holder and scope writes (18), and the
     billable-party override (21, which can name an insurer or hospital) refuse a retired id ("St
     George's is retired"). The exception is when the value is unchanged, so editing an old List at a
     retired hospital still saves.
   - Tests (extend `mastersActions.test.ts` and `surgeonActions.test.ts`): the anaesthetist actor is
     refused everywhere; each refusal; `createInsurer` with and without direct claims (the default is
     minted once, with the right category and holder); the rename follow-through with a generated and
     a hand-edited default name; each kind's retire blockers and reinstate (an insurer held by an
     open Procedure's Contract or named by a billable-party override is refused); a retired hospital
     refused by the List and Booking write paths but tolerated when unchanged.
6. **Store: the public-holiday calendar** (`src/store/mastersActions.ts`; DM-38, US-13.4.1):
   - `addPublicHoliday(api, actor, { dateISO, name, kind, region?, openHospitalIds })` refuses
     `nameRequired`, `dateRequired`, `duplicatePublicHoliday` (same date) and `unknownHospital`.
     `editPublicHoliday(api, actor, id, patch)` has the same refusals plus `notFound`.
     `deletePublicHoliday(api, actor, id)` removes the row; the audit keeps the full before. They
     audit `publicHoliday.create`, `publicHoliday.update` and `publicHoliday.delete`.
   - Add `masters.publicHolidays` to 30's reconcile trigger list in `store/conflictReconcile.ts`. When
     a public holiday changes, reconcile the Lists on its old and new dates at every hospital. A
     change to `openHospitalIds` therefore raises or clears exactly the right flags. The actions return
     `{ flagged, resolved }` from the mutation result, in 30's `HolidaySheet` result-line shape.
   - Tests: with the clock rolled into range, the seeded Christmas Day (`PH003`) flags that day's
     Lists, and adding a second public holiday on the same date is refused
     (`duplicatePublicHoliday`); add a public holiday on a canvas weekday, and it flags the Lists; mark one
     hospital open, and its flags clear while the others stay; move the date, and the old flags clear
     and the new ones raise; delete, and everything clears; an office clear (30) on a public-holiday
     conflict holds only while the cause stands.
7. **Store: loads** (`src/store/masterLoadActions.ts`, exported from `src/store/index.ts`;
   US-13.4.3 AC1):
   - `stageMasterLoad(api, actor, { entity, csvText, source, targetContractId? })`:
     - it parses and validates against current masters and writes a `staged` `MasterLoad`;
     - it audits `masterLoad.stage` with `after: { entity, rows, valid, rejected, source }`;
     - it never writes `masters` (a test deep-equals `masters` before and after);
     - it refuses `officeOnly`, an unknown entity, a missing or retired target Contract for fee
       lines or overrides, a fee-line target whose pricing basis is not `fixedSchedule`, and an
       empty sheet (overrides go into any Contract 23's `addContractBaseUnitOverride` accepts);
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
       (`hospital.create`, `procedureType.create` and so on) with `after` carrying
       `{ loadId, rowNumber }`, plus one `masterLoad.commit` summary meta;
     - it marks the load `loaded` with `loadedRecordIds`;
     - if any planner refuses mid-fold (a bug, since the rows were just re-validated), the whole
       commit aborts and returns the refusal. It never partially loads.
   - `discardMasterLoad(api, actor, loadId)` audits `masterLoad.discard`.
   - Tests: office only; stage never touches masters; commit loads exactly the valid rows and no
     rejected row; one commit, with the expected meta count; stale re-validation; `nothingToLoad`; a
     second commit is refused; ids are deterministic (two runs deep-equal); each loaded record's
     History shows "Loaded from spreadsheet, row N".
8. **Loader specs and sample spreadsheets** (`src/domain/masterLoad/specs/*.ts`,
   `src/domain/masterLoad/samples.ts`; US-13.4.3):
   - One spec per `LoadEntity`, each small. The columns are:
     - hospitals: Hospital name, Contact email;
     - surgeons' rooms: Room name, Contact email, Phone;
     - surgeons: Name, Specialty, Room, HPI CPN, NZ registration number (for information), keyed
       on the HPI CPN (17's handoff), with 17's HPI CPN normaliser, shape check and duplicate check
       across surgeons and anaesthetists;
     - master procedure list: Operation name, RVG code or group, Base units (19's rule: a positive
       whole number, with no RVG guide range check; see drift-check step 2 for OQ-62);
     - modifier codes: Code, Group, Units, Description, Selection (19's rules: an existing group, a
       unique code, units a non-negative whole number);
     - fee-schedule lines, into one target Contract: 18's line fields (holder code, description,
       mapped RVG codes, price ex GST, price incl GST, effective from, time band from and to, add-on),
       with 18's rules (holder code unique within the Contract, both prices above zero and agreeing at
       ex x 1.15 to the cent);
     - Contract base-unit overrides, into one target Contract: Operation name, RVG code or RVG group
       (exactly one, 23's three target kinds), Base units (23's rule: a positive whole number, no
       guide range check; a duplicate target or an `overrideOverlap` is rejected with 23's sentence).
     Insurers, hospital holidays and public holidays have no sheet (not on US-13.4.3's list); they
     are maintained by hand.
     Dates (effective from) are ISO `YYYY-MM-DD` or `d/m/yyyy` (both parsed, and anything else
     rejected with "Date must be a real date, for example 2026-12-25").
   - `samples.ts`: `SAMPLE_SHEETS`, one bundled CSV string per entity, each `{ id, entity, fileName, label, csv, targetContractId? }`.
     Each sample has two to six valid rows and three to five invalid ones, and every invalid row
     exercises a different refusal from that entity's validator. For example, the hospitals sample:
     - valid: "Rangiora Day Surgery, bookings@rangioraday.example" and "Ashburton Hospital,
       theatre@ashburton.example";
     - rejected, already in master data: "St George's";
     - rejected, name required: a blank name;
     - rejected, implausible email: "Timaru Surgical, not-an-email";
     - rejected, duplicate: a second Rangiora row.
     Use `.example` domains only. The fee-schedule sample targets a seeded fixed-schedule Contract
     (from 18), with one holder code that already exists on it. The overrides sample targets a seeded
     hospital Contract and rejects an unknown operation name and a zero value. The modifier sample
     includes an unknown group and a non-numeric unit. The surgeons sample rejects a malformed HPI
     CPN, a duplicate HPI CPN and an unknown room. The Procedure sample includes one base-unit value
     outside its RVG guide, which loads (AA's own figure, as in 19's manual add) and is pinned as
     valid, and one zero value, rejected with 19's sentence. Write the fixture rows against the
     masters as 17 to 34 left them, and pin each sample's valid and rejected counts in a test.
   - The samples live in `src/domain` so the trigger registry (inside the PWA import closure) can
     import them. They are demo fixtures, not seed: nothing loads them at build time.
9. **Create planners, one path** (store; the refactor that keeps loads inside the guards):
   - Extract the body of each create action the loader targets into a pure planner:
     `planHospitalCreate(state, fields)`, `planSurgeonRoomCreate`, `planSurgeonCreate`,
     `planProcedureTypeCreate`, `planModifierCodeCreate`, `planFeeScheduleLineCreate` and
     `planContractBaseUnitOverrideCreate`.
   - Each returns `{ state: nextSlices, metas }` or a refusal. It includes the id allocation, the
     protected-default minting for hospitals, and 25's Contract version write for fee lines and
     overrides.
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
        - one name already in 19's master procedure list.
      - `junkReason(name)` returns "Looks like a pricing note, not an operation" for a percent sign or
        the word discount, and "Marked not for use" or "Not an operation" for the other patterns.
      - `normaliseOperationName(name)` folds case, whitespace and punctuation. A candidate whose
        normalised name repeats an earlier scan row is junk with the reason "Duplicate of scan row N".
      - Fixture counts, pinned in a test and quoted by the trigger message and the checklist: 14
        rows, 5 junk ("10% discount", "DO NOT USE - old code", "Test op", "Misc", the duplicate), 2
        not approved, 1 already in the master procedure list, and the rest approved.
      - Tests for each pattern and for the duplicate.
    - `goLive.ts`:
      - `GO_LIVE_PACK` = the Solutions Plus list plus three controlled sheets, in load order:
        surgeons' rooms, surgeons (referencing those rooms) and the master procedure list sheet (Operation
        name, RVG code or group, Base units, as AA fills it from the approved names).
      - `GoLiveCandidate` = `{ scanRow; name; spUnits; decision: 'approved' | 'notApproved' | 'junk'; reason? }`.
        The fixture carries AA's recorded decisions: most approved, two not approved ("No longer
        performed by AA members", "Replaced by a newer operation name"), and junk set by `junkReason`
        and by the duplicate rule.
      - `evaluateGoLive(batch, masters)` joins each candidate to the procedure sheet by normalised
        name. It returns one outcome per candidate: `loads`, `notApproved`, `junk`,
        `noControlledRow` ("Needs an RVG mapping and base units in the controlled spreadsheet"),
        `alreadyInMaster`, or `controlledRowRejected` (with the sheet's reasons).
      - A procedure-sheet row with no Solutions Plus candidate loads as an AA addition, because names
        can come from AA as well.
      - A procedure-sheet row whose candidate is not approved or junk is rejected ("Not approved for
        go-live").
      - **Solutions Plus units are never read** into anything that loads. A test gives the fixture
        units that differ from the controlled sheet, and asserts the loaded base units equal the
        controlled sheet's.
    - `goLiveActions.ts`:
      - `stageGoLiveLoad(api, actor)` creates the `GoLiveBatch` (`{ id, candidates, loadIds, status, stagedAtISO, stagedBy, loadedAtISO? }`),
        stages each controlled sheet as a `MasterLoad` with `goLiveBatchId`, validating in pack order
        with `pendingKeys`, and audits `goLive.stage`. It refuses while a batch is already staged.
      - `setGoLiveApproval(api, actor, scanRow, approved, reason?)` refuses a junk row ("Junk is
        excluded and cannot be approved") and audits `goLive.approve` or `goLive.unapprove`. It
        re-runs the procedure sheet's validation, so the join outcomes follow at once.
      - `commitGoLiveLoad(api, actor)` runs one `mutate()` that folds every sheet's valid rows in
        pack order through the item 9 planners. Procedure rows are included only when
        `evaluateGoLive` says `loads`. It marks every load and the batch `loaded`, and audits
        `goLive.commit` with the counts (loaded by sheet, Solutions Plus entries not loaded).
      - `discardGoLiveLoad(api, actor)`.
    - Tests (`goLive.test.ts`, `goLiveActions.test.ts`):
      - each outcome;
      - an unapproved candidate never appears in the master procedure list (US-13.4.2 AC1);
      - loaded fields come only from the controlled sheets (US-13.4.2 AC2);
      - "10% discount" is excluded and cannot be approved (US-13.4.3 AC2);
      - un-approving a row before commit removes it from the load;
      - rooms load before the surgeons that reference them;
      - one commit, and nothing partial on a planner refusal.

    **Session 1 ends here, green:** `npm run build`, `npm run build:pwa` and `npx vitest run`, with
    every existing Master data view still rendering, and the flagged-List set unchanged.

11. **One pattern for every view** (`apps/admin/screens/masters/`; US-13.4.1 "in one place"):
    - `masterViews.ts`, a registry the sub-nav renders from:
      `{ view; label; group: 'People and places' | 'Schedule' | 'Billing' | 'Settings' | 'Go-live'; catalogueRows: string[]; add: boolean; edit: boolean; retire: boolean; remove: boolean; load?: LoadEntity[] }`.
    - The groups:
      - People and places: Anaesthetists, Hospitals & holidays, Surgeons, Surgeons' rooms, Surgeon
        groups, Insurers, and Organisations (18's surviving master);
      - Schedule: Recurring bookings (30's view and id), Slot statuses, Public holidays;
      - Billing: Contracts, Master procedure list, RVG codes, RVG groups, Modifier codes;
      - Settings: Xero & archiving;
      - Go-live: Go-live load.
    - The `?view=` param and the existing view ids are kept.
    - `MasterViewChrome.tsx` holds the shared pieces:
      - `MasterHeader`: title, one-line subtitle, count, the primary teal "Add ..." action, and a
        secondary "Load from spreadsheet" where `load` is set;
      - `ShowRetiredToggle`: off by default; retired rows render in mist with a neutral "Retired" pill
        and the reason in its title;
      - `RetireSection`, for the foot of an edit sheet: "Retire" with a required reason, showing
        `retireBlockers` as a warning list when refused, or "Reinstate";
      - `LoadResultBanner`: the entity's staged or last load, from item 13.
    - Refit every view to it, including 17's, 18's, 19's, 29's and 30's.
      - Drop any remaining "view only" or "read only" subtitle.
      - Views with retire use `RetireSection` in their existing sheet.
      - Rows referenced by nothing keep their delete: hospital holidays, public holidays, and 19's
        RVG groups and unlinked master procedure list entries.
    - Test (`masterViews.test.ts`): each row of US-13.4.1's list maps to a view with `add` and
      `edit`:
      - hospitals with contact email;
      - surgeons;
      - surgeon groups;
      - surgeons' rooms;
      - insurers;
      - anaesthetists;
      - Slot availability statuses;
      - recurring bookings;
      - the master public-holiday calendar;
      - hospital calendars;
      - RVG codes;
      - RVG groups;
      - modifier codes;
      - Contracts.
      Every masters view that retires declares `retire`.
    - MasterData publishes the current view with `useDemoTriggerContext('masters.view', view)`. Add
      the key to `DemoContextValues`.
12. **Insurers, Hospitals & holidays, and Public holidays views** (US-11.4.1, US-13.4.1, DM-38):
    - **Insurers** (rebuilt):
      - a table with columns Name, Accepts direct claims (Yes / No), Contracts (count of non-retired
        Contracts it holds, linking to Contracts filtered by holder, if 18's view filters), and
        Status;
      - "Add insurer" and a row "Edit" open `InsurerSheet` (name, and an "Accepts direct claims"
        switch). On add, the switch creates the default Contract. On edit, it calls
        `setInsurerDirectClaims` with 18's copy on what it creates. The sheet ends with
        `RetireSection`;
      - the subtitle reads "Insurers that accept direct claims hold Insurance Contracts. Special
        rates are Contracts, and a cover split with the patient is set on the Contract's payment
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
13. **Load from spreadsheet** (`apps/admin/flows/LoadSpreadsheetSheet.tsx`,
    `apps/admin/screens/masters/LoadResultPanel.tsx`; US-13.4.3 AC1):
    - `LoadSpreadsheetSheet` (through `useSurface().Overlay`) has:
      - the entity name and its columns (required ones marked), from the spec;
      - "Download template", a header-only CSV built client-side as a Blob, with no fetch;
      - a `.csv` file input (FileReader text passed to `stageMasterLoad`, with source `file`);
      - for fee lines and overrides, a "Load into Contract" select of eligible Contracts;
      - the caption "Save the controlled spreadsheet as CSV. Rows that fail a check are listed and not
        loaded.";
      - the provisional line "Provisional: whether admins re-load after go-live is to be decided.
        Loads add new rows and never change existing ones."
      There is no sample-file option here. Samples are demo fixtures and live in the Demo actions menu
      (item 17).
    - `LoadResultPanel`, shared with the go-live view:
      - a summary line ("7 rows · 4 valid · 3 rejected");
      - an Admin Review style table with columns Row (mono), the spec's key columns, Result (a
        success-tint "Valid" or error-tint "Rejected" pill, always with its word), and Reasons (one
        per line);
      - "Only rejected" filter chips;
      - a teal "Load 4 valid rows" and a secondary "Discard".
      After a load, the summary reads "Loaded 4 rows on 21 Jul 2026 · 3 rejected rows were not
      loaded", the new rows appear in the view's table at once, and each row links to its record where
      the view has a detail page (the surgeon profile).
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
      - Controlled spreadsheet shows the RVG code (mono) or group pill with base units, or "No row";
      - Result is "Loads" or "Not loaded" with the reason;
      - non-junk rows have an Approve / Unapprove toggle (`setGoLiveApproval`). On junk rows the toggle
        is disabled, with the reason as its tooltip;
      - hook: `data-shot="go-live-candidates"`.
    - **Controlled spreadsheets:** one collapsible card per sheet in pack order (Surgeons' rooms,
      Surgeons, Master procedure list), each with its counts and a `LoadResultPanel` without its own Load
      button.
    - Actions: a teal "Load approved data" (`commitGoLiveLoad`) and a secondary "Discard". The result
      line reads, for example, "Loaded 3 rooms, 5 surgeons and 7 operations. 8 Solutions Plus entries
      were not loaded.", with links to each view. The counts are computed, never typed in; the
      fixture's are pinned in `goLive.test.ts` (item 10).
    - A caption under the candidate table states the clean-cut rule (US-13.4.3): "Solutions Plus
      identifiers and unit values are not carried over. Only operation names are used."
    - Hook: `data-shot="masters-go-live"`.
15. **Audit labels and narrative** (`shared/audit/actionLabels.ts`, `auditNarrative.ts`, and
    `fieldLabels.ts` where fields are new):
    - Hospitals and insurers:
      - `hospital.retire` "Hospital retired";
      - `hospital.reinstate` "Hospital reinstated";
      - the same pair for surgeon, surgeon room, surgeon group and insurer;
      - `insurer.create` "Insurer added" and `insurer.update` "Insurer updated".
    - Public holidays:
      - `publicHoliday.create` "Public holiday added";
      - `publicHoliday.update` "Public holiday changed";
      - `publicHoliday.delete` "Public holiday deleted".
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
      scope chips (18), 21's billable-party override picker, the surgeon room select (17), the
      matching-screen create actions (33), and the shared `SurgeonSelect` (17). There is no Booking
      insurer or funding picker to route (D2: 20 removed it).
    - 20's Contract picker hides a Contract whose holder is retired (keeping it, labelled, when it is
      the Procedure's current Contract). That is how a retired hospital's or insurer's protected
      default stops being chosen without being retired itself.
    - A retired current value shows as "St George's (retired)".
    - Display paths (grid, drawer, invoices, history, profile) keep resolving retired names unchanged.
    - Tests: a retired hospital is absent from a fresh picker and present, labelled, when it is the
      current value; a retired insurer's Contracts are absent from a fresh Contract picker and from
      the billable-party override picker.
17. **Demo triggers** (`src/shared/demoTriggers/registry.ts`; bodies call the item 7 and 10 actions;
    see the table below). Update the registry tests that assert entries per route. Add nothing to the
    Control Panel page; its index lists both entries under "Admin · Master data" automatically.
18. **Shots and hooks** (`visual/admin-phase07.spec.ts`, or a new `visual/admin-masters-loads.spec.ts`):
    - the Insurers view;
    - Public holidays;
    - the hospital calendar with Labour Day;
    - a staged hospitals load with its result panel;
    - the loaded state;
    - the go-live view before and after "Load approved data".
    Keep the existing master-data shot green; move its hooks if 17 moved them.
19. **Copy sweep and demo guide.**
    - Grep the app for copy these masters make stale:
      - "view only" and "read only" on Master data;
      - "full NZSA 2021 set loads at go-live (Phase 42)" (19's RVG subtitle) becomes "At go-live, the
        full code set loads from AA's controlled spreadsheet.";
      - any "Phase 42" string in rendered copy.
    - No en or em dash in any new string.
    - Then the demo guide updates below.

## Demo triggers

| id | Label | Screen (routes) | Surfaces | Effect | Disabled when |
|---|---|---|---|---|---|
| `load-sample-spreadsheet` | Load sample spreadsheet | Admin · Master data (`/admin/masters`) | bar | `when`: the published `'masters.view'` has `load` entries in `masterViews.ts`. `choices`: that view's `SAMPLE_SHEETS`, labelled by file name. There is usually one (Hospitals & holidays offers "hospitals.csv"); Contracts offers "fee-schedule-<Contract>.csv" and, if built, "base-unit-overrides-<Contract>.csv". `run`: `stageMasterLoad` as 14's shared `OFFICE_ACTOR` (Kirsty, because in the framed build the presenter is the office choosing the file), with source `{ kind: 'sample', sampleId }` and the sample's `targetContractId`. The view's `LoadResultBanner` opens on the result. It stages and does not load, so the presenter shows the rejected rows and then presses the product's own "Load N valid rows". Message: "hospitals.csv checked: 2 rows valid, 4 rejected. Review the result on Hospitals & holidays and press Load." | a staged load for this entity already exists ("A load is already waiting on this screen; load or discard it first"); the target Contract is retired or missing ("The sample's Contract is not available") |
| `go-live-data-load` | Go-live data load (demo) | Admin · Master data (`/admin/masters`, any view) | bar | `run`: `stageGoLiveLoad` as the same actor. The Master data sub-nav's Go-live load item gains a warn dot while a batch is staged, and every view shows a one-line banner, "A go-live load is ready to review", with an "Open" link that sets `?view=goLive`. The presenter approves or un-approves names and presses the product's "Load approved data". Message: "Go-live load prepared: 14 Solutions Plus names (5 excluded as junk, 2 not approved) and 3 controlled spreadsheets. Open Master data, Go-live load." | a batch is already staged ("A go-live load is already waiting; load or discard it first") |

`indexPath`: `/admin/masters?view=hospitals` for the sample loader and `/admin/masters?view=goLive`
for go-live. Both entries are bar only. Their bodies and fixtures live in `src/shared` and
`src/domain`, so `pwaPurity.test.ts` still passes.

**Normal use, no button:** adding, editing, retiring and reinstating every master; the public-holiday
calendar; loading a real CSV through "Load from spreadsheet"; approving go-live names; "Load N valid
rows"; and "Load approved data".

**PWA:** none. Master data and loads are Admin-only, the PWA has no Admin, and no mobile beat waits on
reference data. A retired hospital or surgeon simply stops appearing in the anaesthetist's pickers
through item 16.

## Out of scope

- **Excel (`.xlsx`) parsing.** Controlled spreadsheets are saved as CSV; record the reading.
  Mapping arbitrary column names is out too: the template's headers are the contract.
- **Updating existing records from a load, or deleting by load.** A load only adds. This is the
  US-13.4.3 interim; the drift check says what changes if AA decides.
- **Loads for anaesthetists, insurers, hospital holidays, public holidays, recurring bookings, Slot
  statuses, RVG codes, RVG groups and Contracts themselves.** They are not in the catalogue's
  spreadsheet list (US-13.4.3); each is maintained by hand in its view. RVG codes keep 19's editor; the
  full NZSA set is narrated, not loaded.
- **Editing the modifier groups themselves** (19 deferred it here). The catalogue asks for modifier
  codes, not groups, and the groups are selection-rule structure held in code (`MODIFIER_GROUPS`).
  Note it in PROGRESS as considered and not built.
- **Loading patients, Bookings, invoices, balances or anything transactional from Solutions Plus.**
  The clean cut excludes them; the go-live view says so in its subtitle.
- **Any Solutions Plus identifier** (US-13.4.3 takes names only; OQ-51 was deleted unanswered),
  and additional-invoice numbering (Phase 39).
- **An insurer cover split, rate or funding field on the insurer row.** The split is the Contract's
  payment setting and its basis (US-04.2.12, OQ-68), built in Phase 22; special rates are insurer
  Contracts (US-11.4.1). This phase only links an insurer to its Contracts.
- **Loading Contract rules from spreadsheets** (23's handoff mentions "rules and overrides"). US-13.4.3
  lists fixed fee schedules and "Contract-specific overrides"; this phase reads the overrides as 23's
  base-unit overrides. The per-Contract multi-procedure rule stays a Contract editor field (23). Note
  the reading in PROGRESS.
- **Editing the hospital sync set-up** (`INTEGRATED_HOSPITALS`, `HOSPITAL_SYNC_SCHEDULE`, 34). It is
  integration configuration, not a US-13.4.1 table, and OQ-13 still shapes it. It stays code-held; a
  hospital in it cannot be retired (item 2).
- **Public holidays on the anaesthetist's mobile or web availability calendar** (29). Note it for
  Phase 44 if the demo wants it.
- **Scale:** timing a full-size load and the full-scale dataset are Phase 43's. The loader's pure
  validator is the seam 43 can time.
- **The S1 to S5 rewrite** (Phase 44). This phase adds an optional beat only.

## Manual test checklist

The agent runs every item itself in the running app and reports it with evidence; none is handed
to the owner (ROADMAP.md "Owner review: agents test themselves").

- [ ] Admin, Master data: the sub-nav is grouped (People and places, Schedule, Billing, Settings,
      Go-live), and every view has the same header, with no "view only" anywhere.
- [ ] Insurers: add "Southern Health Cover" with direct claims on. It appears with Yes, and Contracts
      shows its new protected insurer default. Rename it, and the default's generated name follows.
      Try to retire nib: refused with "Turn off direct claims first" and its Contracts listed. Retire
      the new insurer with a reason: it greys out under "Show retired", the Contract picker on a new
      Booking's Procedure no longer offers its Contracts, and the billable-party override no longer
      offers it. The Insurer sheet has no split or rate field, and its caption points at the
      insurer's Contracts, where nib's payment setting (22) shows Full or Split.
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
- [ ] Demo actions on Hospitals & holidays: "Load sample spreadsheet", hospitals.csv. The result panel
      shows each rejected row with its reason (already in master data, name required, email, duplicate)
      and the valid rows. Nothing is added yet. Press "Load 2 valid rows": they appear in the list,
      and each one's History reads "Loaded from spreadsheet, row N". The rejected rows are absent.
- [ ] Repeat on Surgeons' rooms, Surgeons (a row naming an unknown room, a malformed HPI CPN and a
      duplicate HPI CPN are each rejected with 17's wording), Master procedure list (a base-unit
      value outside its RVG guide loads and raises no warning; a zero is rejected), Modifier codes
      and Contracts (fee-schedule sample into its Contract, where a duplicate holder code is
      rejected; the base-unit overrides sample into its Contract; if 25 is built, one version "Loaded
      from spreadsheet" is written per load). Insurers and Public holidays show no "Load from
      spreadsheet" and no sample trigger.
- [ ] Load from spreadsheet with a real file: download the template, add two rows (one bad) in a text
      editor, save as CSV and choose it. The same result panel appears. A file missing a required
      column is rejected as a whole, with "Missing column: ...".
- [ ] Stale protection: stage the hospitals sample, then add "Rangiora Day Surgery" by hand, then
      press Load. That row turns rejected ("Already in master data") and only the others load.
- [ ] Demo actions, "Go-live data load (demo)": the banner appears on every view. On Go-live load,
      "10% discount", "DO NOT USE", "Test op", "Misc" and the upper-case duplicate are Excluded with
      reasons, and their toggles are disabled. Solutions Plus units are struck through and marked Not
      used. Two names show Not approved.
- [ ] Un-approve one approved name: its Result turns "Not loaded: not approved for go-live" and the
      tiles update. Press "Load approved data": the result line counts rooms, surgeons and operations.
      The Master procedure list shows the new operations with the controlled sheet's base units (not
      Solutions Plus's), and the un-approved and junk names are absent.
- [ ] Audit viewer: filter to masterLoad and goLive. Stage, commit, approvals and each created record
      are present, with who, role and before and after.
- [ ] The harness bar shows "Load sample spreadsheet" only on Master data views with a loader, and
      "Go-live data load (demo)" only on Master data. Neither shows on Day view or in the installed
      PWA. The Control Panel index lists both under Admin · Master data.
- [ ] Reset: loads, the go-live batch and the loaded records are gone. The public holidays are back
      as seeded.
- [ ] No en or em dash in any new copy, no crimson on any new control, teal the only action colour, and
      every outcome pill carries its word.
- [ ] Catalogue screenshots: the recipes for the covered items above (US-13.4.1, US-11.4.1, US-13.4.2 and US-13.4.3) are created or updated, any recipe this phase broke is re-pointed, a full `npm run capture` ends with no failed recipe and no story without a recipe, the covered items' new shots are checked by eye, and `npm run verify:board` is green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots` and `npm run verify:board` are all green.

## Demo guide updates

In the same session (each phase patches the beats it touches):
- `docs/demo-guide/03-demo-script.md`:
  - **S5, a new optional Beat 5 "Controlled reference data and a clean-cut go-live"** (about 2
    minutes):
    - Click: Admin, Master data, Hospitals & holidays, Demo actions, Load sample spreadsheet. Point at
      the rejected rows, then Load. Then Demo actions, Go-live data load (demo), and Master data,
      Go-live load. Point at "10% discount" excluded and the struck-through Solutions Plus units.
      Un-approve one name, then Load approved data, then open the Master procedure list.
    - Say: "AA starts clean. Only data AA has approved is loaded, and it comes from AA's own
      controlled spreadsheets. Every row is checked with the same rules as a manual add, and anything
      that fails is listed and left out. Solutions Plus gives us names, not numbers."
    - Expected: as in the manual checklist.
  - **S5 Discovery points:** add "whether admins can re-load reference data after go-live
    (US-13.4.3)".
  - **Direct URLs:** add `/admin/masters?view=publicHolidays` and `/admin/masters?view=goLive` (use
    the real view ids).
  - **S2** only if it names a hospital holiday by its old per-hospital row. Labour Day is now a
    public holiday; check the wording.
- `docs/demo-guide/04-presenter-cheat-sheet.md`:
  - the Admin Web list: "Master data and audit" becomes "Master data (every reference table,
    spreadsheet loads, go-live load) and audit";
  - one line under availability and holiday conflicts: public holidays come from one master calendar;
  - one "strong phrase": "Nothing comes across because it exists in Solutions Plus."
- `docs/demo-guide/01-personas-and-responsibilities.md`: Kirsty's duty 9 ("Maintain schedule-related
  master data ...") becomes "Maintain all reference data (hospitals, surgeons and rooms, insurers,
  recurring bookings, public holidays and hospital calendars, codes and Contracts), including loads
  from AA's controlled spreadsheets".
- `docs/demo-guide/02-workflows-and-handoffs.md`: in the canvas workflow's triggers (line 70 at the
  snapshot), "A recurring booking or hospital holiday changes" (Phase 30's wording) becomes "A
  recurring booking, hospital holiday or public holiday changes". Add a short "Reference data and go-live" note beside the Source list naming the
  clean cut.
- `docs/demo-guide/master-demo-guide.html`: mirror the same S5 beat, discovery points, Direct URLs,
  cheat-sheet and persona lines, word for word.
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
| [US-13.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.4.1.md) Maintain reference tables | partial · master-data states anaesthetists, contracts, permanent-lists, hospitals-holidays, surgeons, rvg-codes, modifier-codes, list-statuses (several captioned "(view only)") | captured. Re-shoot `master-data` at `/admin/masters` with one state per view in the grouped sub-nav (People and places, Schedule, Billing, Settings, Go-live), keeping the existing state slugs but re-pointing the clicks to the current button names (Recurring bookings for `permanent-lists`, Slot statuses for `list-statuses`) and re-captioning with no "(view only)"; add states `surgeon-groups`, `rvg-groups`, `public-holidays` (`masters-public-holidays`, the master calendar with a national and a Canterbury row), `hospitals-holidays` with Labour Day and a retire refusal (St George's: refused with upcoming List and recurring booking counts), and `retired` (a retired hospital under "Show retired"). Highlight the table or sub-nav group the state is about. Drop the partial reason |
| [US-11.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.4.1.md) Insurer master data | captured · insurers (the Insurers button, highlight `table`) | stays captured. Re-shoot `insurers` with the rebuilt view (columns Name, Accepts direct claims, Contracts count, Status; hook `masters-insurers`) in place of the bare `table` highlight, and add an `add-insurer` state (InsurerSheet with the direct-claims switch and the caption "Rates and any split with the patient are set on the insurer's Contracts.") and a `retire-refused` state (nib: "Turn off direct claims first") |
| [US-13.4.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.4.2.md) Clean-cut start, not a full migration | none (create it) | create, captured. Admin shot `go-live-load` at `/admin/masters?view=goLive` with states `staged` (run the `go-live-data-load` entry from `[data-shot=demo-actions]` first: "14 Solutions Plus names (5 excluded as junk, 2 not approved)" and the 3 controlled spreadsheets) and `loaded` (after approving names and pressing "Load approved data"; the un-approved and junk names are absent). Caption: "Clean-cut start: only AA-approved data is loaded" |
| [US-13.4.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.4.3.md) Reference data loaded from controlled spreadsheets | none (create it) | create, captured. Admin shot `controlled-load` at `/admin/masters?view=hospitals` with states `sheet` (Load from spreadsheet sheet, `master-load-sheet`, Download template and the required columns), `result` (after the `load-sample-spreadsheet` entry stages hospitals.csv: "7 rows · 4 valid · 3 rejected", each rejected row with its reason; `master-load-result`) and `loaded` ("Loaded 4 rows on 21 Jul 2026 · 3 rejected rows were not loaded", new rows in the table). Caption: "Controlled spreadsheet loaded, with rejected rows listed with reasons" |

**Recipes this phase breaks.**

- About 28 recipes open `/admin/masters` and click a sub-nav button by name; 42 regroups and renames the sub-nav (item 11), so each needs its button names and highlights checked with `--dry`. Found by `grep -l 'admin/masters'`: `FT-04.1`, `FT-05.1`, `FT-13.4`, `US-01.1.2`, `US-01.1.3`, `US-01.2.2`, `US-01.3.2`, `US-01.5.1`, `US-01.5.2`, `US-04.1.1`, `US-04.1.2`, `US-04.2.1`, `US-04.2.2`, `US-04.2.4`, `US-04.2.5`, `US-04.2.9`, `US-04.4.1`, `US-05.1.1`, `US-05.1.3`, `US-05.1.4`, `US-05.1.5`, `US-05.2.1`, `US-09.3.3`, `US-12.1.1`, `US-12.1.2` and `US-12.1.4`. The buttons they use include Contracts, Hospitals & holidays, Recurring bookings, Insurers and RVG codes.
- `US-01.5.1.json` and `US-01.5.2.json` (hospital holiday calendar and its conflicts): the seeded per-hospital Labour Day and Canterbury Anniversary rows migrate to the master public-holiday calendar, so re-point any hospital-holiday highlight to the new "Public holidays" line or view.
- Any recipe that lists hospitals or surgeons in a picker (Booking, Contract holder): retired masters leave the pickers (item 16); the seed has none retired, so no change expected.
- Work item 18 lists the Playwright specs; the `--dry` run is the check for anything else.

**ATLAS.md.** Update "Routes" (the `?view=` Master data views and `/admin/masters?view=goLive`), "Overlays that need clicks" (InsurerSheet, PublicHolidaySheet, Load from spreadsheet, the retire dialogs), "Existing hooks" (`masters-insurers`, `masters-public-holidays`, `master-load-sheet`, `master-load-result` and the sub-nav group hooks) and the line that says Master data tabs include "Hospitals & holidays".

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
- **Loads stay inside the guards.** No load path writes `masters` except through the item 9 planners
  inside one `mutate()`. Stage never writes masters. Commit re-validates, loads nothing partial, and
  writes one meta per record plus a summary. A rejected row can never reach master data, including
  after an approval toggle, a stale row or a planner refusal. Hunt for a second create path that
  bypasses a planner, such as a spec building a record itself.
- **One set of rules.** Every rejected-row reason equals the manual action's refusal text for the same
  input. The parity test covers every refusal of every spec. No validator is duplicated between
  `masterValidation.ts` and a store action. Base units follow 19's and 23's manual rules on every
  path (a positive whole number): no load refuses a value for being outside its RVG guide, no load
  raises a warning for it (AA's own figures; D3's warning is for an anaesthetist's entry), and they
  land on the master 19 holds them on (OQ-62). Surgeon rows use 17's one HPI CPN rule, not a second check.
- **Clean cut is honest.** Solutions Plus units never reach a loaded record. Junk cannot be approved.
  An unapproved name never loads, even when the controlled sheet has a row for it. The go-live view's
  wording does not claim the masters were emptied.
- **Retire, never break a reference.** A retired hospital, surgeon, room, group or insurer still
  resolves everywhere it is displayed (grid, drawer, invoices, history, profile, locks). It
  disappears from every picker (check the drift-check grep list, including 31's, 33's, 20's
  Contract picker by holder and 21's billable-party override). No Booking or Patient insurer field
  has crept back in to support a picker or a blocker (D2).
  Blockers are correct and counted from the demo clock's today. Protected defaults are never retired.
- **Public holidays through the one conflict rule.** The flagged-List set did not move in the
  migration. Every public-holiday change reconciles through 30's `mutate()` hook with no stamping.
  `openHospitalIds` raises and clears exactly the right flags. An office clear on a public-holiday
  cause behaves like 30's. AA-rooms Lists stay unflagged. No reader of hospital holidays (generator, horizon advance,
  `addAnaesthetist`'s generation, recurring-booking projection, conflict preview, Draft List warning) still reads `masters.holidays`
  alone.
- **Change once, reflected everywhere.** A hospital or insurer rename shows in every live surface.
  The protected default's generated name follows, a hand-edited one does not, and locked or raised
  invoices keep their snapshot. List any other stored copy of a master name the grep found.
- **Determinism and state.** Ids come from `allocateId`, timestamps from the demo clock, and
  `FileReader` is the only browser API used for input. `masterLoads` resets with the seed.
  `PERSIST_VERSION` is bumped and `persistMigrate.test.ts` extended.
- **Trigger scope and design.** Both triggers are bar only, show only on Master data (the sample
  loader only on views with a loader), are disabled with a reason, and never load by themselves. The
  sample fixtures are imported from `src/domain`, and `pwaPurity.test.ts` holds. Teal is the only
  action colour, outcome pills carry words, the result panel follows Admin Review's table, and there
  are no en or em dashes.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry; ROADMAP.md "Owner review: agents test
  themselves"): the defaults built for open questions, provisional readings, anything logged
  rather than fixed, and the screens worth a look, each with its route and persona.
- **Status row** for catch-up Phase 42, and a phase entry with:
  - the drift-check result (items changed since 501b0b8 or not, OQ-62 status and where base units
    loaded, the re-load question, and the 17 to 34 names used);
  - what was built, per work item;
  - the flagged-List set before and after the public-holiday migration;
  - the stored-name copies the grep found and what was done;
  - the `PERSIST_VERSION` bump (from and to);
  - tests added (including the rule-parity and US-13.4.1 coverage tests);
  - the review pass.
- **Catalogue screenshots:** the recipes created or changed (by ID), the `capture/REPORT.md` counts before and after (captured, partial, absent, failed), the recipes this phase broke and how they were re-pointed, and any partial reason handed to a later phase.
- **Decisions log:**
  1. **Public holidays are one master calendar.** A row applies to every hospital except those
     listed as open that day. Hospital calendars hold only hospital-specific closures. The seeded
     per-hospital Labour Day and Canterbury Anniversary rows migrated with the flagged set unchanged.
     AA-rooms Lists raise no holiday conflict. This amends Phase 30's decision 10 ("Hospital
     holidays can be edited and deleted") and the original
     seed reading of `HOSPITAL_HOLIDAYS` (statutory days as per-hospital rows).
  2. **Masters referenced by identity retire, never delete.** Retire needs a reason, refuses while
     upcoming work depends on the record, hides the record from pickers, and keeps every reference
     resolving. Delete stays only for rows nothing references (holidays, public holidays, 19's unused
     RVG groups and Procedure entries). Anaesthetists keep their Active flag. This supersedes Phase
     17's "no delete or deactivate; Phase 42 owns it" and the Phase 07 "view only" master readings.
  3. **A rename follows through to the holder's protected default Contract** while its name is still
     the generated one. Raised and locked invoices keep their snapshot (the catalogue's one
     exception).
  4. **Insurers are maintained in full.** Creating one with direct claims mints its protected insurer
     default in the same commit, through 18's single minting path (AA identifier and 22's default
     payment setting included). The insurer row carries no split or rate: a cover split is the
     Contract's payment setting (US-11.4.1, US-04.2.12). An insurer that accepts direct claims,
     holds Contracts, or is reached by an open Procedure's Contract or a billable-party override
     cannot be retired. Insurers sit on neither Booking nor Patient (D2).
  5. **Loads are checked, then committed.** Stage validates and reports without touching masters.
     Commit re-validates and loads exactly the valid rows in one audited `mutate()`, through the same
     planners and validators as a manual add. Each loaded record's audit carries its load and row.
     Rejected rows are never loaded (US-13.4.3 AC1).
  6. **Loads add and never overwrite; controlled spreadsheets are CSV.** This is provisional until AA
     decides on re-loading (US-13.4.3). An existing key is rejected with "Already in master data:
     edit it there".
  7. **Solutions Plus supplies operation names only.** Its units are never read, junk is excluded and
     cannot be approved, AA's approval gates each name, and no Solutions Plus identifier is carried
     (US-13.4.3; OQ-51 was deleted unanswered). The go-live demo loads into today's masters and says
     so.
  8. **Modifier groups stay code-held.** 19's deferral was considered and not built, because the
     catalogue asks for modifier codes.
  9. **"Contract-specific overrides" are base-unit overrides.** The multi-procedure rule is edited
     on the Contract (23) and not loaded. The hospital sync set-up (34) stays code-held, and an
     integrated hospital cannot be retired.
  10. **Loaded base units follow the manual add and OQ-62.** A loaded value obeys 19's and 23's rule
     (a positive whole number) with no RVG guide range check and no warning, because list and
     Contract figures are AA's own (19's `outsideGuide` is false for them); D3's after-procedure
     warning stays with an anaesthetist's entry on a Procedure. They load onto the master procedure
     list while OQ-62's recommendation stands.
  11. **The loader covers only US-13.4.3's list** (hospitals, surgeons' rooms, surgeons, the master
     procedure list, modifier codes, fee-schedule lines, base-unit overrides). Insurers, hospital
     holidays and public holidays are maintained by hand.
- **Handoff notes:**
  - For **43**: `validateSheet` and `commitMasterLoad` are the seams to time on a full-scale sheet.
    `SAMPLE_SHEETS` shows the fixture pattern.
  - For **44**: S5's optional Beat 5; the re-load question in the discovery points; public
    holidays on the anaesthetist calendars if wanted. The grouped Master data sub-nav and the
    "(view only)" captions on US-13.4.1's screenshots are re-shot in this phase's Catalogue
    screenshots step.
