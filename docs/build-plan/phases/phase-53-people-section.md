# Phase 53 · The People section and the shared record pattern

**Requirements covered:**
[US-13.4.1](../../../requirements-board/requirements/stories/US-13.4.1.md) Maintain reference tables (status 3 Verify, graded **Contradicts**, size XL: a Surgeon groups list still exists against "No surgeon group record"; there is no People section; the people lists have no search, filter or paging). This phase builds its Three places, No surgeon group record (the list) and Find a person; its One card, one change is US-13.6.2's, built in 55 (D105).
No DM or RV row is closed here: DM-08 (the surgeon group record removed) is 55's and DM-10 is 57's ([GAP-ANALYSIS.md](../GAP-ANALYSIS.md) "Structural changes"). No seed change, no `PERSIST_VERSION` bump.
**Answered, built as answered** (owner, 25 November, for the build, not yet seen by AA): D99 (the section's shape), D100 (old links redirect and stay), D104 (one record pattern, lifted once), D105 (the People stories' split).
**Open, built to its default:** [OQ-148](../../../requirements-board/requirements/questions/OQ-148.md) (any record of surgeons who practise together; D98: none, so the Surgeon groups list goes; the record behind it goes in 55).

**Depends on:** 46 to 49 on `master` and 50 to 52 in Wave 2: 45 (the Contract page this phase lifts from), 46, 47 and 49 (what the Contract page and section look like now), 48 (the Master data pointer, the explicit `seeded` chrome, the three-view removal pattern), 50 (the tier filter and the rate and tier card), 51 (`patientAttentionCount` without waiting rows, the Intake route and the `/admin/patients/waiting` redirect), 52 (`isActiveOn`, the status cards on the anaesthetist record, its last-day trigger).
**Estimated:** 2 sessions. **Checkpoint** after Work item 7: the section, tabs, record routes, redirects, links, Master data and the specs moved, every list as it is today. Session 2: items 8 to 13.

**Runs in:** Lane A of the build lanes, Wave 2, last in Lane A's queue (after 50 and 52, and after Lane B's 51, whose `51 complete:` commit it merges at its start): built in the `AnaesthesiaAssociatesRFP-laneA` worktree, committed on `lane/a` with a `53 complete:` commit, and joined onto `master` with the rest of Wave 2 (50 to 53) when the full gate is green. [LANES.md](../LANES.md) overrides this doc's and the skill's commit, port, gate, review, owner-review and plan-page steps for a lane session. The owner tests 53 with 50 to 57 after Wave 3's join (`TEST-50-57.md`), never before.

## Goal

Anaesthetists, surgeons, specialties and patients become one **People** section of the Admin app, and the record pattern the People pages will share is lifted out of the Contract page.

- **Side nav:** a People entry where Patients was, carrying Patients' amber attention count; Patients leaves the nav.
- **Four routed tabs** on `AdminPage` fit: Anaesthetists (`/admin/people/anaesthetists`, where the section opens), Surgeons, Specialties, Patients. Anaesthetists, Surgeons and Specialties are searched, filtered and paged; Patients hosts today's search and follow-up views as they are (57 rebuilds it).
- **Record routes move** under their tabs with today's screens: `/admin/people/anaesthetists/:anaesthetistId` (the registration number), `/admin/people/surgeons/:surgeonId`, `/admin/people/patients/:nhi`. Every old Master data, profile and Patients link redirects (D100); in-app links go to the new routes.
- **Master data** keeps Places (hospitals and their holidays) and the rest, with a pointer line; the Surgeon groups view and its sheet go.
- **Shared record pattern:** `EditableCard` with `useCardEdit`, and a rail section of a few rows with See all, become shared components with catalogue rows; the Contract page runs on them with no change in behaviour.

## Before you start

1. **Drift check** against the plan baseline `67cba2c`:

   ```
   node requirements-board/agent/skills/update-build-plan/tools/plan-state.mjs --diff US-13.4.1,OQ-148
   ```

   Re-read anything changed after `67cba2c`. If US-13.4.1 is Retired or Future, stop. If its three places, the People tabs, or the Find a person criterion change, stop and tell the user. An answer to OQ-148 is not a stop: an answer that brings a list back is a new phase (D98), so the list still goes here; log it.
2. **Confirm:** 46 to 49 DONE on `master`; 50 and 52 complete on `lane/a`; 51 complete on `lane/b` and merged into `lane/a` (LANES.md's sync step; stop as blocked if 51 is not complete). Stop if any is not. Read their PROGRESS entries and note:
   - **45:** `ProfilePage` fluid with the 412px rail (props), the `Card` editing and footer props, `ContractsTabs` (the `LineTabs` and `LineTabLink` strip pattern), `mastersRedirect.ts` and where `AdminMastersRoute` calls it, the `adminContracts.tab` trigger key; in `ContractCards.tsx` `useCardEdit` and `EditableCard`, in `ContractPage.tsx` `OnThisContractRail`, `RailRow` and `RAIL_ROWS`.
   - **46, 49:** what each added to the Contract page or its header (49's Replace), so the lift keeps it; whether either imports from `ContractCards.tsx`.
   - **47:** the catalogue's toolbar (search box and `FilterPills` on one row at 1280), the shape the People toolbars copy.
   - **48:** the Master data pointer (`masters-moved-note`), `MasterHeader` and `LoadResultBanner`'s `seeded` prop, the section tab registry (`contractsTabs.ts` or as named), `masterViews.test.ts`'s two-place mapping, `SEEDED_SHEETS_BY_VIEW` keyed by tab, `LoadResultPanel`'s `recordPath` and `VIEW_OF`, `GoLiveLoadView`'s `SHEET_WORDS` paths.
   - **50:** the tier filter on the Anaesthetists list (its control and state) and the rate and tier card's name and file.
   - **51:** `patientAttentionCount` as left (waiting rows out), the Intake route, the `/admin/patients/waiting` redirect in `router.tsx`'s Patients block, `PatientsScreen`'s tabs after the move, its edit to `NHI_HUB_ROUTES`.
   - **52:** `isActiveOn` (signature), the status and history cards on `AnaesthetistRecord`, the "Demo: pass the last day" trigger's id and routes, the `PERSIST_VERSION` it set.
3. **Built as answered, no label:** the section, tabs and record routes (D99), the redirects (D100), the lift (D104), the split (D105). No on-screen caption: US-13.4.1 carries no open reading for this phase.
4. **Open, built to default** (each a line on the owner's review list, none gets a caption):
   - **No surgeon group list** (OQ-148, D98): the view, its sheet and its registry row go; the record, the surgeon page's read-only Groups card and the catalogue's surgeon-group `RetireSection` example stay for 55.
   - **List state in the URL** (replace, so Back is not a filter change): `q`, `status`, `tier`, `specialty`, `page`. A record's back link returns to its tab's plain path.
   - **Page size 50** on every People list (the mock's "165, 50 a page"), through the admin `Pager`.
   - **Filters:** Anaesthetists Active (default), Inactive, All by 52's `isActiveOn` on the demo day, plus 50's tier filter; Surgeons Active (default), Retired, All (All added for parity with Anaesthetists), replacing Show retired, plus a specialty filter (All specialties first); Specialties search only.
   - **Search:** Anaesthetists by name, registration number or HPI CPN; Surgeons by name, practice name or HPI CPN; Specialties by name. Case-insensitive, HPI CPN matched normalised.
   - **Anaesthetists sort by surname** (`surnameOf`), closing BACKLOG's Masters clause of "Anaesthetist names sort three ways".
   - **Tab counts** beside each label as the mock's `#map` shows (active anaesthetists, active surgeons, specialties); Patients carries none (its count is the nav's).
   - **Patients tab's temporary switch** until 57: `FilterPills` "Search · Needs follow-up" (`?show=followUp`); Follow-up keeps its fluid frame. `/admin/patients/follow-up` redirects there; 57 replaces the switch with its filters and keeps the param or redirects it.
   - **Master data** opens on Hospitals (`DEFAULT_MASTERS_VIEW`), and its one pointer line names both sections: "Contracts, Parties and Funding tags are in Contracts. Anaesthetists, surgeons and specialties are in People." with a `TextAction` link on each section name.
   - **Shared homes and names:** `src/shared/ui/EditableCard.tsx` (exporting `EditableCard` and `useCardEdit`) and `src/shared/ui/RailSection.tsx` (`RailSection`, `RailRow`). Not `SidePanel`: that name is the edit surface in `shared/surface`.
5. **Reads beyond the run-build-phase standard list:**
   - **Design:** [people-section.html](../../explorations/people-section.html) is the layout reference (not a catalogue artifact): `#map` (the four tabs, their routes, counts, filters, what leaves and stays in Master data, "People and places" becoming "Places"), `#nav` (People where Patients was, after Invoices, with the amber badge), `#groups` (what the cut removes and what stays: the Party of kind surgeon group). [contracts-section.html](../../explorations/contracts-section.html) `#record` for the cards and rail the lift must keep exactly. [admin-layout-audit.md](../../admin-layout-audit.md): fit for the lists, fluid for the records and Follow-up, the 1280 minimum. [Admin Review](../../design/Admin%20Review.dc.html) for the list, toolbar and table chrome the tabs reuse.
   - **ROADMAP.md:** D98 (no surgeon group list; the record goes in 55), D99 (the section's shape), D100 (the redirects stay), D104 (lift once; later phases extend with a prop), D105 (US-13.4.1's split; the Surgeons filters built here; US-11.1.1 and US-11.3.1 move with the section); sequencing rules "53 last in Lane A's Wave 2 queue" and "Wave 3 after 53" (the People route block's order is fixed for 54 to 57); "Owner review: agents test themselves".
   - **GAP-ANALYSIS.md:** the EP-13 note and its US-13.4.1 row with the `gaps.json` entry (the evidence lines: `masterViews.ts`, `SurgeonsView.tsx`); the EP-11 note's item (4) (the section move); the verification-log row for US-13.4.1.
   - **Catalogue:** US-13.4.1 in full (the three places, the four criteria, its Notes of 25 November); OQ-148; [the 25 November note](../../../requirements-board/requirements/notes/2026-11-25-donald-people-section.md) #1, #2, #5, #6 and #14. [domain-model.md](../../../requirements-board/requirements/domain-model.md) "Procedures and Contracts" (a surgeon group exists only as a Party). US-13.6.2, US-12.1.4, US-13.4.4 and US-11.1.1 only to see what the pages built on the lift will need, so its props fit them.
   - **DECISIONS.md:** honour "A Contract page's cards each save alone" (the lifted hook keeps it), "Controls stay buttons; only page switches are links" (tabs are `LineTabLink`s, the Patients switch and filters are controls), "The internal patient id is never shown" (NHI in routes), "Real routing in all three apps" (legacy redirects kept). Supersedes none; add one ruling (item 13).
   - **BACKLOG.md:** closes the "Masters → Anaesthetists (85) and Surgeons (165)" clause of "Long admin lists with no paging or search" and the Masters clause of "Anaesthetist names sort three ways"; leaves "Patient search stops at 50" to 57.
   - **PROGRESS.md:** the entries of 45 to 52 (above), and in the catch-up archive Phase 17 and 17b (the Master data pages, `SurgeonProfile`, `AnaesthetistRecord`), 40 (the Patients routes and views) and 42 (the registry) only for what they do, so nothing regresses.

## Reference

- **Shell:** `src/router.tsx` (the admin `patients` and `masters` blocks), `src/shell/RequireEntity.tsx`, `src/apps/admin/AdminApp.tsx` (`sectionForPath`, the nav path map, `patientBadge`), `components/SideNav.tsx` (`NavSection`), `routes.tsx` (`AdminMastersRoute`, the surgeon, anaesthetist and patient route components), `mastersRedirect.ts`, `mastersPaths.ts`, `src/shared/patients/patientPath.ts`.
- **Lists:** `screens/masters/` (`AnaesthetistsView.tsx`, `SurgeonsView.tsx` with `SurgeonGroupsView` and `SurgeonGroupSheet`, `SpecialtiesView.tsx`, `masterViews.ts`, `masterViews.test.ts`, `view.ts`, `MasterData.tsx`, `chrome.tsx` (`MasterHeader`, `ShowRetiredToggle`), `LoadResultPanel.tsx`, `GoLiveLoadView.tsx`, `SeedLoadView.tsx`, `loadViews.test.tsx`, `specialtiesTags.test.tsx`, `mastersPages.test.tsx`); `screens/patients/` (`PatientsScreen.tsx`, `PatientRecord.tsx`); `screens/AnaesthetistRecord.tsx`, `screens/SurgeonProfile.tsx`; `components/Pager.tsx`.
- **Record pattern:** `screens/contracts/ContractCards.tsx`, `ContractPage.tsx`, `ContractPage.test.tsx`, `ContractsSection.tsx`; `components/ProfileChrome.tsx` (`PROFILE_CARD`); `src/store/mutate.ts` (`Outcome`).
- **Shared UI:** `src/shared/ui/` (`Card`, `TextAction`, `Button`, `FormError`, `CountBadge`, `FilterPills`, `NameSearchBox`, `LineTabs`, `LineTabLink`, `EmptyState`, `README.md`), `src/shared/table/`, `src/shared/format.ts` (`surnameOf`), `src/apps/demo/catalogue/AdminCatalogue.tsx`.
- **Triggers and tests:** `src/shared/demoTriggers/registry.ts` (`SEEDED_SHEETS_BY_VIEW`, `sampleSheetsFor`, `NHI_HUB_ROUTES`, `ADMIN_MASTERS`), `context.ts`; `src/apps/officePrivacy.test.ts`, `oneComponentPerJob.test.ts`, `appCopy.test.ts`; Playwright `visual/` `admin-patients`, `admin-phase17`, `admin-phase17b`, `admin-phase18a`, `admin-layout`, `nhi-lookup`, `phase28`, `profile-phase26`.

## Work items

**Session 1 (to the checkpoint)**

1. **People in the side nav.** `SideNav.tsx`: `NavSection` `'patients'` becomes `'people'`, labelled People, in the same place, with the amber count (rename the prop `peopleBadge`, still `patientAttentionCount` as 51 left it). `AdminApp.tsx`: `sectionForPath` maps `people` (and the redirecting `patients`) to `'people'`; the path map gets `people: '/admin/people'`. The nav keeps 13 entries.
2. **The section frame and tabs** (new `screens/people/PeopleSection.tsx`, beside the section's tab registry `peopleTabs.ts` with each tab's label, path and `seeded` sheets, after 48's pattern). `AdminPage` titled People, a `LineTabs` strip of `LineTabLink`s (`data-shot="people-tabs"`, `data-people-tab`), counts as Before you start 4. Each tab renders today's list unchanged in session 1: `AnaesthetistsView` (with 50's tier filter), `SurgeonsView` (Surgeon groups gone, item 6), `SpecialtiesView`, and `PatientsScreen` without its own title and tab strip, its search and follow-up views behind the temporary switch (Before you start 4). Each tab publishes `useDemoTriggerContext('adminPeople.tab', <tab>)` (add the key to `context.ts`).
3. **The People route block** in `router.tsx`, in this fixed order (Wave 3 only adds or swaps its own routes): `people` index redirecting to `anaesthetists`; `anaesthetists` with child `:anaesthetistId` (`AnaesthetistRecord`); `surgeons` with `:surgeonId` (`SurgeonProfile`); `specialties` (a comment marks where 56 adds `:specialtyId`); `patients` with `:nhi` (`PatientRecord`). Nest each record under its tab so `RequireEntity`'s `..` falls back to the tab. Back links name the tab (`Anaesthetists`, `Surgeons`, `Patients`). New `apps/admin/peoplePaths.ts` is the one home: `peoplePath(tab)`, and `anaesthetistRecordPath` and `surgeonProfilePath` move here with their names; `mastersPaths.ts` keeps `mastersViewPath`; `patientPath` returns `/admin/people/patients/:nhi`.
4. **Redirects (D100)**, all replace-navigation, all kept. `mastersRedirect.ts`: `?view=anaesthetists`, `surgeons`, `surgeonRooms` and `specialties` go to their tabs, `?view=surgeonGroups` to Surgeons (alongside 45's and 48's cases). `router.tsx`: `/admin/masters/anaesthetists/:id` and `/admin/masters/surgeons/:id` go to the record pages (one small param-carrying redirect component in `routes.tsx`); `/admin/patients` to the Patients tab, `/admin/patients/follow-up` to it with `?show=followUp`, `/admin/patients/:nhi` to the patient's page. 51's `/admin/patients/waiting` route stays as 51 wrote it, ranked above `:nhi`.
5. **In-app links go direct.** Every caller of the moved helpers and of `/admin/patients` (grep `surgeonProfilePath`, `anaesthetistRecordPath`, `mastersViewPath('anaesthetists'|'surgeons'|'specialties')`, `patientPath`, `/admin/patients`): the Day view's `SlotDrawer`, `PairingSection`, `EditAnaesthetistSheet`, matching `RowPanel`, `AdminBookingDetail`, review and invoices, `LoadResultPanel`'s `recordPath` and `VIEW_OF`, `GoLiveLoadView`'s `SHEET_WORDS` (the three sheets get a `to` path), `chrome.tsx`. Seed load and Go-live load copy that names Master data for the anaesthetists, surgeons and specialties sheets names People; both views stay in Master data and still load those sheets.
6. **Master data becomes Places.** `masterViews.ts`: delete the `anaesthetists`, `surgeons`, `specialties` and `surgeonGroups` entries; group `'People and places'` becomes `'Places'` (Hospitals & holidays); `view.ts` drops the four from `MastersView` and `DEFAULT_MASTERS_VIEW` becomes `hospitals`; `MasterData.tsx` renders no case for them and shows the one pointer line (Before you start 4) under 48's hook. Delete `SurgeonGroupsView` and `SurgeonGroupSheet` from `SurgeonsView.tsx`; leave the `SurgeonGroup` type, slice, seed, store actions, audit labels and the surgeon page's Groups card for 55.
7. **Tests, triggers and specs moved.** `masterViews.test.ts`: the mapping becomes US-13.4.1's three places (Master data views; 48's Contracts tabs; the People tabs: anaesthetists, surgeons, specialties, patients), and "every load sheet is named" reads the People tabs' `seeded` too. `loadViews.test.tsx`, `specialtiesTags.test.tsx`, `mastersPages.test.tsx` and the patients tests follow the new paths. `registry.ts`: `SEEDED_SHEETS_BY_VIEW` keeps `anaesthetists`, `surgeons`, `specialties` keyed by the People tab, `sampleSheetsFor` reads `adminContracts.tab ?? adminPeople.tab ?? adminMasters.view`, the load-sample trigger's routes gain `/admin/people`; `NHI_HUB_ROUTES` and any trigger on `/admin/patients`, `/admin/patients/:nhi` or the old profile routes (52's last-day trigger included) re-point; `demoScenarios.ts` paths likewise. Playwright: the eight specs in Reference move to the new routes. New: a redirect test for every old path and `?view=` value (replace, no loop, unknown ids fall back to the tab).

   **Checkpoint:** the lane's gate green, `IN PROGRESS` row, `**Session 1**` paragraph (run-build-phase "Two-session phases").

**Session 2**

8. **Pure list filters** (new `screens/people/peopleLists.ts` with `peopleLists.test.ts`; no React or store): `anaesthetistRows(all, { q, status, tier }, todayISO)`, `surgeonRows(all, { q, specialtyId, status })`, `specialtyRows(all, { q })`, each returning the filtered, sorted rows (Before you start 4). Tests: Find a person's example (search a name, filter a specialty, only matches); HPI CPN and registration search; Inactive by `isActiveOn` on the demo day; Retired via `isRetired`; tier; surname order.
9. **Every People list searched, filtered and paged.** On each tab one toolbar row at 1280 (after 47's): `NameSearchBox`, `FilterPills`, a compact `SelectField` for specialty or tier, the primary Add action; the table in its fit card; `Pager` (50) in the card's footer, reset to page 1 on any filter change. `ShowRetiredToggle` leaves Surgeons (it stays for the Master data views that use it). Empty results use `EmptyState`. The tier filter and column stay Admin-only (`officePrivacy.test.ts`).
10. **Lift `EditableCard` and `useCardEdit`** into `src/shared/ui/EditableCard.tsx`. The hook takes the save as a callback, not `editContract`: `useCardEdit<D, P>(from: () => D, commit: (patch: P) => { ok: true } | { ok: false; message: string })`, returning `draft`, `setDraft`, `error`, `start`, `cancel`, `save`; a refusal keeps the draft open and shows the message on the card. `EditableCard` keeps its props, hooks (`${shot}-edit`, `-cancel`, `-save`, `-error`) and look, and takes a `style` prop (the Contract page passes `PROFILE_CARD`). `ContractCards.tsx` imports both and passes `(patch) => editContract(useAppStore, actor, contract.id, patch)`.
11. **Lift the rail section** into `src/shared/ui/RailSection.tsx`: `RailSection` (title, count with `CountBadge`, `aside`, rows, a row limit defaulting to 5, an empty line, and "See all N" as a `TextAction` to a path, with `shot` and `${shot}-all`) and `RailRow` (link title, sub line, `data-*` passed through). `OnThisContractRail` renders through it with identical output (`contract-on-this`, `contract-on-this-all`, `data-on-contract`).
12. **Build on the shared components (one component per job) and the catalogue.** The tabs and lists use `AdminPage`, `LineTabs`, `LineTabLink`, `FilterPills`, `NameSearchBox`, `SelectField`, `Pager`, `TableShell`, `Td`, `ClickableRow`, `Pill`, `TextAction`, `Button`, `EmptyState`, `CountBadge`; default props keep today's look and every `shot`, `data-shot` and `data-*` hook stays. No new en or em dashes, "slot" or phase numbers in copy; teal the only action colour; tokens only. `/demo/catalogue/admin` gains rows for `EditableCard` (with `useCardEdit`), `RailSection` and the People tab strip, and the Master data rows that named the removed views are updated; `shared/ui/README.md` lists the two. No private `RailRow` or card wrapper remains in `ContractPage.tsx` or `ContractCards.tsx`; `oneComponentPerJob.test.ts`'s allow-list only shrinks. `ContractPage.test.tsx` and the Contract Playwright specs pass untouched: the lift changes no behaviour.
13. **Finish.** New tests: `EditableCard.test.tsx` (Edit, Cancel restores, Save calls the commit with the card's patch only, a refusal shows in place and keeps the draft), `RailSection.test.tsx` (row limit, See all count, empty line), list tests per tab (search, filters, pager, URL kept on reload). DECISIONS.md gains one ruling: "People is its own Admin section; record pages are keyed by a fixed id; every in-app link goes through `peoplePaths.ts`; the old Master data, profile and Patients links redirect and stay. Build plan Phase 53 (D99, D100)." Delete the closed BACKLOG clauses.

## Demo triggers

| id | Label | Screen | Surfaces | Effect | Disabled when |
|---|---|---|---|---|---|
| `load-sample-spreadsheet` (existing) | Load sample spreadsheet | Admin, People: Anaesthetists, Surgeons, Specialties tabs | bar | the tab's sample sheet, re-pointed from the Master data views through `adminPeople.tab` | a load is already waiting for that sheet |
| NHI lookup hub (existing) | as today | Admin, People, Patients tab and a patient's page | bar | unchanged, its routes re-pointed to `/admin/people/patients` | as today |
| 52's last-day trigger (existing) | as 52 named it | the anaesthetist's page at its new route | bar | unchanged, its route re-pointed | as 52 set |
| (product) | Search, filters and paging on each list | People tabs | none | normal use | |
| PWA | none (Admin only) | | | | |

## Out of scope

- The record pages' rebuilds: the anaesthetist's (54), the surgeon's and the surgeon group record (55, DM-08, the `PERSIST_VERSION` bump), the specialty's page (56), the Patients tab's filters and the patient's page (57, DM-10).
- Any change to the Contract page's behaviour or look; any Master data view besides the four that leave.
- New filters on the Patients tab, patient search beyond 50 matches (57).
- Capture recipes, ATLAS and the demo guide (the owner's sweep); a seed change.

## Manual test checklist

Run these yourself in the running app and report pass or fail with evidence.

- [ ] Admin side nav: People sits where Patients was with the amber count; Patients is gone; 13 entries; People opens on Anaesthetists.
- [ ] Each tab fits at 1280 and 1440, one toolbar row, the list scrolling inside its card, the `Pager` at 50; tab counts read 85, 165 (active) and 12 or as seeded.
- [ ] Anaesthetists: search a surname, a registration number and an HPI CPN; Active, Inactive (after 52's last-day trigger), All; the tier filter; surname order; a row opens `/admin/people/anaesthetists/<registration>` with 50's and 52's cards; back returns to the tab.
- [ ] Surgeons: search a name, then filter a specialty: only matches, a page at a time; Retired and All; no Show retired; a row opens the surgeon's page (its Groups card still there, read-only).
- [ ] Specialties: search; add, edit and remove as before.
- [ ] Patients tab: search finds a patient; Needs follow-up shows today's follow-up view; a row opens `/admin/people/patients/<NHI>`.
- [ ] Master data opens on Hospitals; the group reads Places; no Anaesthetists, Surgeons, Specialties or Surgeon groups; the pointer links to People and Contracts.
- [ ] Redirects land and Back does not loop: `/admin/masters?view=anaesthetists`, `surgeons`, `specialties`, `surgeonGroups`, `surgeonRooms`; `/admin/masters/anaesthetists/<id>`, `/admin/masters/surgeons/<id>`; `/admin/patients`, `/admin/patients/follow-up`, `/admin/patients/<NHI>`, `/admin/patients/waiting` (to Intake).
- [ ] In-app links (Day drawer, pairings, review, invoices, matching, Seed load results) open the new routes directly.
- [ ] A Contract page: each card's Edit, Cancel, Save and refusal as before; the rail's rows and See all as before; Replace and Disable as before.
- [ ] Sample-sheet trigger on each People tab offers that tab's sheet.

## Demo guide updates

None by this phase: the owner's `/sweep` re-points the guide, the capture recipes and ATLAS; the redirects keep them loading. Keep `demoGuideSync.test.ts` green. **For the sweep**, list in the progress entry: `docs/demo-guide/03-demo-script.md`'s Master data views line (Surgeons, Specialties, Surgeon groups), S2's patient beats (`/admin/patients/CQY9304`), the NHI register refresh beat ("Patients → Search"), every guide line naming Patients in the side nav or Master data's Anaesthetists or Surgeons; the recipes of US-13.4.1 (its Surgeon groups screenshots), US-13.6.2, US-12.1.4, US-13.4.4, US-11.1.1 and US-11.3.1; ATLAS rows on `/admin/masters?view=anaesthetists|surgeons|specialties|surgeonGroups`, the old profile routes and `/admin/patients*`.

## Adversarial review (after build)

Standard pass (convention 18), run at Wave 2's join as LANES.md sets. Steer the reviewers at:

- **The Contract page unchanged.** `ContractPage.test.tsx` and the Contract specs pass untouched; every hook on the cards and the rail survives; the hook's commit is the only save path and sends one card's patch.
- **One home each.** People paths only from `peoplePaths.ts` and `patientPath`; no hand-built `/admin/people` string in a screen; no live link to an old route (grep).
- **Redirects.** Every old value in D100 lands, replaces history, and survives; unknown ids fall back to their tab; `parseMastersView` no longer defaults to a view that left.
- **Lists.** Filters are pure and tested; Find a person's example works on the Surgeons list; Inactive reads `isActiveOn`; the pager resets on filter change; the tier stays office-only.
- **Master data clean.** The four views are gone from `masterViews.ts`, `view.ts`, the sub-nav and `MasterData.tsx`; the registry test maps US-13.4.1 across three places; the surgeon group record still loads (55 removes it).
- **Shared, once.** A new private copy of a shared component is a finding. `EditableCard`, `useCardEdit` and `RailSection` exist once with catalogue rows; no private copy in a People or Contract file; no local `Pill`, `Row`, `Card` or `Section`.
- **Copy and tokens.** No en or em dashes, no "slot" or phase numbers; teal the only action colour; crimson only on the active nav.

## PROGRESS.md updates

- **For the owner's review:** the built defaults of Before you start 4 (no surgeon group list; list state in the URL; page size 50; the filters and Surgeons' All; the search fields; surname order; tab counts; the Patients tab's temporary switch and `?show=followUp`; Master data opening on Hospitals and its pointer; the shared components' homes and names).
- **For the sweep:** the guide lines, recipes and ATLAS rows listed under Demo guide updates.
- Status row and phase entry: drift check against `67cba2c`; D99, D100, D104, D105 built and OQ-148 at its default; the names 46 to 52 shipped that this phase used; the names it ships for 54 to 57 (`peoplePaths.ts`, the People route block and its order, `adminPeople.tab`, `peopleTabs.ts`, `EditableCard`, `useCardEdit`, `RailSection`, `RailRow`, `peopleLists.ts`); tests added; `PERSIST_VERSION` unchanged. Handoffs: 54 to 57 build their pages on the shared components and extend them by prop; 55 removes the surgeon group record and the Groups card; 57 replaces the Patients switch.
- Decisions log: the People section and its redirects (also in `docs/DECISIONS.md`), and the shared record pattern's homes.
