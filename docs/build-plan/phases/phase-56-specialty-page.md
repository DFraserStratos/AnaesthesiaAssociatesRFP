# Phase 56 · The specialty's page

**Requirements covered:**
[US-13.4.4](../../../requirements-board/requirements/stories/US-13.4.4.md) Specialties (status 3 Verify, graded **Partial**, size M; rewritten 25 November: the list sits on People's Specialties tab and each specialty has a page showing its surgeons and Contracts, where it is renamed or removed). The list behaviour already holds (broad names, audited add, rename and remove, Remove refused while held, a rename reaching holders by id); what is missing is the page, the holders listed rather than counted, and Rename and Remove as table-row actions in a sheet.
No DM or RV row changes: a specialty is the record it was ([domain-model.md](../../../requirements-board/requirements/domain-model.md) "Specialty", DM-63; [domain-model-delta.md](../analysis/domain-model-delta.md) has nothing for this phase). No seed change.
**Answered, built as answered** (owner, 25 November, for the build, not yet seen by AA or Greg): D99 (the section's shape, the page route), D100 (old links redirect), D104 (the record pattern), D105 (the story split: 53 builds the tab, this phase the page).
**Open questions:** none gate this phase.

**Depends on:** 53 (the People section: the Specialties tab, the route block, the record pattern's shared components) and 55 (the surgeon's page the rows open, and the surgeon selectors it left).
**Estimated:** 1 session.

**Runs in:** Lane B of the build lanes, Wave 3 (after 55, in the same lane): built in the `AnaesthesiaAssociatesRFP-laneB` worktree, committed on `lane/b` with a `56 complete:` commit, and joined onto `master` with the rest of its wave (54 to 57). [LANES.md](../LANES.md) overrides this doc's and the skill's commit, port, gate, review, owner-review and plan-page steps for a lane session (a lighter gate per phase; the full gate, one review and the owner's test of 50 to 57, `TEST-50-57.md`, come after the Wave 3 join).

## Goal

A specialty is a page, not a table row. From the Specialties tab the office opens Orthopaedics and sees who holds it.

- **The page** (`/admin/people/specialties/:specialtyId`, `ProfilePage` fluid with the 412px rail, back link "Specialties"): the **name** as a card edited and saved on its own (one audited `specialty.update`, reaching every surgeon and Contract by id), a **Surgeons** card listing the surgeons who hold the specialty, each opening the surgeon's page, and a **Contracts** card listing the Contracts that carry it, each opening its Contract page, both with counts. The rail says who holds it (the count sentence), holds **Remove** (refused with the store's sentence while held) and the specialty's **History**.
- **The list** keeps Add and loses its row actions: a row opens the page. The seed's twelve specialties stay (the story names nine; Neurosurgery, Vascular surgery and Oral and maxillofacial surgery were added on purpose and AA's spreadsheet will replace the list).

## Before you start

1. **Drift check** against the plan baseline `67cba2c`:

   ```
   node requirements-board/agent/skills/update-build-plan/tools/plan-state.mjs --diff US-13.4.4,US-13.6.6,US-04.2.16
   ```

   Re-read anything changed after `67cba2c`. If US-13.4.4 is Retired or Future, drop the phase and record it. If a rule changes (a subspecialty allowed, Remove permitted while held, a specialty renamed from the list rather than the page), stop and tell the user. No linked question gates the phase.
2. **Confirm 53 and 55 are DONE** on `lane/b` and read their PROGRESS entries. From 53 note: the People section frame and its tab strip, the Specialties tab file and the list's row and Add handling (whether its rows already open a page route), the People path helpers (the file and the names for a specialty, a surgeon and a Contract), the redirect helper, the shared record pattern (`EditableCard`, `useCardEdit`, the side panel with See all: names, props, how a card saves and refuses) and `ProfilePage`'s rail. From 55 note: the surgeon page's path helper, the surgeon selectors it left (what returns a surgeon's specialties, the Active or Retired test), and how its specialties card writes (the id it takes). Stop if either is not DONE, or if 53's Specialties tab does not exist.
3. **Built as answered, no label:** the route and the id-keyed page (D99), the old `?view=specialties` link still redirecting to the tab (D100), the cards edited one at a time on 53's shared pattern (D104). No on-screen caption: the story carries no open reading.
4. **Built defaults** (each a line on the owner's review list, none gets an on-screen caption):
   - **Holders match the refusal.** The Surgeons card lists every surgeon whose `specialtyIds` include the specialty, Retired ones too (a `Pill` "Retired"), and the Contracts card every Contract whose `specialtyIds` include it, Disabled ones too (a `Pill` "Disabled"). So the two counts equal `specialtyUsage` and the sentence Remove shows ("held by 3 surgeons and 2 Contracts"). System Contracts are left out (`isOfficeContract`; they hold no specialty). A Contract with no specialty is offered for every specialty and is not listed: a one-line hint under the card says so.
   - **Both lists show every holder, no pager.** At practice scale the longest is a few dozen rows, in the page's own scroll; sorted by name (surgeons by surname, Contracts by name).
   - **Remove stays enabled.** Pressing it on a held specialty shows the store's refusal in place, in the rail, where the holders are already listed; on an unheld one a confirm sheet (the shared `ConfirmSheet`) removes it and replaces the route with the Specialties tab. The change log adds no new rule.
   - **Add saves and opens the new page**, as 48's New party does: the create form stays a small overlay on the list (`SpecialtySheet`, create only), then navigates.
   - **History moves to the page's rail** (the shared `HistorySheet`, by the specialty's id); the list's History action goes with the other row actions.
   - **An unknown `:specialtyId`** falls back to the Specialties tab (`RequireEntity`, as 45 and 48 do); a removed one lands there too.
5. **Reads beyond the run-build-phase standard list:**
   - **Design:** [people-section.html](../../explorations/people-section.html) `#map` (the Specialties tab, "12. A page per specialty with its surgeons and the Contracts for it", the route and the tab strip; it is not a catalogue artifact, and where it differs from D99 the decision wins) and the side-panel and card mocks it shares with the other People pages. [contracts-section.html](../../explorations/contracts-section.html) `#parties` for the Party page, the pattern this page copies in shape (a Details card, a counted "Its Contracts" card, the rail). [admin-layout-audit.md](../../admin-layout-audit.md): the page frame modes (fluid for a record page with the 412px rail) and the 1280 minimum. [Design Language](../../design/Design%20Language.dc.html) for pill and table tokens; [Admin Review](../../design/Admin%20Review.dc.html) for the table chrome the two cards extend.
   - **ROADMAP.md:** D99 (the People section's shape: one nav entry, routed tabs, a page per record keyed by an id that never changes, on `ProfilePage` fluid with the rail), D100 (old links redirect and stay; in-app links go to the new routes directly), D104 (one record pattern lifted once by 53; 54 to 57 build on it and never copy it; a side panel shows a few rows with See all), D105 (US-13.4.1's unit is 53's, so the tab is not rebuilt here); the sequencing rules "Wave 3 after 53" (each phase adds or swaps only its own routes in the People block, never reorders it, and extends 53's components with a prop) and "56 follows 55 in Lane B"; "Owner review: agents test themselves"; "Demo triggers" and "PWA parity" (neither applies).
   - **GAP-ANALYSIS.md:** the EP-13 row for US-13.4.4 and its `gaps.json` entry (the missing page and route, Rename and Remove as row actions, the seed's twelve), [epics/EP-13.md](../epics/EP-13.md) `#us-13.4.4`.
   - **Catalogue:** US-13.4.4 in full (its Shared and Specialty page criteria; its Notes of 25 November: specialties move to People, each has a page); US-13.6.6 (a surgeon's specialties, "Required": the reason a held specialty cannot be removed); US-04.2.16 (a Contract's specialties, none meaning every specialty). [domain-model.md](../../../requirements-board/requirements/domain-model.md) "Specialty".
   - **DECISIONS.md:** no ruling is superseded; honour that a surgeon always holds at least one specialty (`cleanSpecialtyIds`) and that a Contract with none is offered for every specialty (`contractFitsSpecialties`). **BACKLOG.md:** closes none.
   - **PROGRESS.md:** 53's entry (the section frame, the tab strip, the shared record pattern, the path helpers, the redirects) and 55's (the surgeon page and its path helper, the selectors); the archived catch-up's Phase 18a entry only for what the Specialties view, `SpecialtySheet` and the store actions already do (`specialtyUsage`, `specialtyUsageText`, the name rules) so none regresses.

## Reference

- **Code:** `src/domain/specialties.ts` (`specialtiesInOrder`, `specialtyUsage`, `specialtyUsageText`, `specialtyNameRefusal`, `contractSpecialtyLabel`) and `specialties.test.ts`; `src/store/specialtyActions.ts` (`createSpecialty`, `renameSpecialty`, `removeSpecialty`) and `specialtyTagActions.test.ts`; `src/domain/billing/fallbacks.ts` (`isOfficeContract`); `src/domain/seed/specialties.ts` (the twelve, `SPC`); 53's Specialties tab and People path helpers; `src/apps/admin/screens/masters/SpecialtiesView.tsx` (what 53 moved: its row actions and `SpecialtySheet`), `specialtiesTags.test.tsx`; `src/apps/admin/contractsPaths.ts` (`contractPath`); `src/shared/ui/` (`Card`, 53's `EditableCard`, `Eyebrow`, `DefRow`, `Pill`, `TextAction`, `Notice`, `FormError`, `EmptyState`, `BackLink`), `src/shared/surface/` (the confirm sheet, `OverlayHeader`, `SheetActions`), `src/shared/table/` (`TableShell`, `Td`, `ClickableRow`), `src/shared/booking` (`HistorySheet`); `src/shared/format.ts` (`drSurname`, `surnameOf`); `src/apps/demo/catalogue/AdminCatalogue.tsx`; Playwright `visual/admin-phase18a.spec.ts` (its specialties test) and `visual/admin-masters-loads.spec.ts`.

## Work items

1. **Pure holders** (extend `src/domain/specialties.ts`, with tests in `specialties.test.ts`; no React or store). `specialtyHolders(masters, id)` returns `{ surgeons, contracts }`: the surgeons whose `specialtyIds` include `id`, by surname, and the office Contracts (`isOfficeContract`) whose `specialtyIds` include it, by name, each with the facts the rows show (a surgeon's practice, their other specialties through `surgeonSpecialtyLabel`, `retiredAtISO`; a Contract's holder Party name, funding tag code and status). Tests: the criterion's example (a fixture where Ophthalmology is held by three surgeons and two Contracts lists exactly those); for every seeded specialty the two list lengths equal `specialtyUsage`; a Contract with no specialties is in no list; a Retired surgeon and a Disabled Contract are listed and marked; a system Contract is never listed. Derive once per render (`useMemo` on the surgeons and Contracts slices); never inside a row.
2. **The route.** Add `specialties/:specialtyId` to the People block of `router.tsx` and its route component to `routes.tsx`, beside 53's tab routes (add, never reorder); a `specialtyPath(id)` helper beside 53's, and `RequireEntity` falling back to the Specialties tab. In-app links to a specialty (the list's rows, the surgeon page's specialty pills if 55 made them links) go through it; the old `?view=specialties` redirect (53's) stays.
3. **The page** (new `SpecialtyPage.tsx` under 53's People screens folder; hooks `data-shot="specialty-page"`, `specialty-name`, `specialty-surgeons`, `specialty-contracts`, `specialty-rail`). Header: the name, and "Held by 3 surgeons and 2 Contracts" from `specialtyUsageText`. Left: the **Name** card on 53's `EditableCard` (Edit, field, Save, Cancel as that pattern defines them) saving through `renameSpecialty` (one `specialty.update`, before and after the name; a blank or duplicate name refused in place with `SPECIALTY_REFUSAL_MESSAGES`; an unchanged name saves nothing; hint "Every surgeon and Contract holding it shows the new name"); the **Surgeons** card, a table Surgeon, Practice, Also holds, each row opening 55's surgeon page (`ClickableRow`, `data-surgeon`), with the count in the header and `EmptyState` "No surgeon holds this specialty yet."; the **Contracts** card, a table Contract, Held by, Funding tag, Status, each row opening `contractPath(id)` (`data-contract`), the count in the header, `EmptyState` "No Contract is limited to this specialty." and the hint line for Contracts with none. Rail: the count sentence, **Remove** (`TextAction`, `specialty-remove`: on a held specialty the store's refusal from `removeSpecialty` in `FormError`; otherwise the shared confirm sheet, then `removeSpecialty` and a replace-navigation to the Specialties tab) and **History** (`HistorySheet` by the specialty's id).
4. **The list loses its row actions.** In 53's Specialties tab (the moved `SpecialtiesView`): drop the History, Rename and Remove actions and the rename branch of `SpecialtySheet`, so it is create only (`createSpecialty`, then navigate to `specialtyPath(newId)`); rows open the page (`ClickableRow`, `onOpen` navigates; if 53 already did, keep it); the "Held by" column keeps "20 surgeons, 8 Contracts" through `specialtyUsageText`'s pieces as today; "Add specialty" stays the page's one primary action. Keep `data-specialty`, `masters-specialties` (or the shot name 53 gave it) and `specialty-sheet`.
5. **Tests.** `specialtiesTags.test.tsx`: its "Specialties view" cases move with the row actions: the list renders 12 rows with their counts, Add saves and opens the new specialty's page; on the page a rename saves, audits `specialty.update` and shows the new name on the list, on a surgeon of that specialty and on a Contract (reached by id); a duplicate name is refused in place; Remove on Ophthalmology shows the store's sentence and removes nothing; Remove on a new unheld specialty confirms, audits `specialty.remove` and lands on the tab; the Surgeons card lists exactly the holders and a row opens the surgeon's page; the Contracts card likewise and a row opens the Contract's page; an unknown id falls back to the tab. Keep `specialtyTagActions.test.ts` unchanged and green. Playwright: `visual/admin-phase18a.spec.ts` (its specialties test: add from the tab, then rename and Remove on the page) and any spec that clicks a specialty row action; run the specs you changed (the join runs the whole of `visual/`).
6. **Build on the shared components; migrate nothing new into a screen file (one component per job).** UI is built from `ProfilePage`, 53's `EditableCard` and side panel, `Card`, `Eyebrow`, `Pill`, `TextAction`, `Notice`, `FormError`, `EmptyState`, `BackLink`, `TableShell`, `Td`, `ClickableRow`, the confirm sheet and `HistorySheet`. No private `Pill`, `Row`, `Card` or `Section` in `SpecialtyPage.tsx`; if the Name card or the rail needs a prop the shared pieces lack, extend them with a prop that defaults to today's look, never copy them, and add its row in `/demo/catalogue/admin` in the same change. Keep every `shot` and `data-*` hook. Tokens only; no en or em dashes in copy.

## Demo triggers

| id | Label | Screen | Surfaces | Effect | Disabled when |
|---|---|---|---|---|---|
| (product) | Open Orthopaedics and follow a surgeon or a Contract; Remove refused while held | Specialties tab, specialty page | none | normal use | |
| PWA | none (Admin only) | | | | |

The existing sample-sheet trigger for the `specialties` sheet stays on the Specialties tab (53 keyed it); nothing is added.

## Out of scope

- Subspecialties, adding or removing a surgeon's or a Contract's specialty from this page (a surgeon's specialties are 55's card, a Contract's are its own page), merging two specialties, reordering the list, and replacing the seed's twelve (AA's spreadsheet will; the story's nine are not restored).
- The Specialties tab's search, filters and paging (53), the surgeon's page (55), the Contract page (45), and the Master data pointer line (53).
- Capture recipes, ATLAS and the demo guide (the owner's sweep); a seed or `PERSIST_VERSION` change (none: no seed shape or content moves).

## Manual test checklist

Run these yourself in the running app and report pass or fail with evidence.

- [ ] Admin side nav, People, Specialties tab: twelve specialties, each row showing "N surgeons, M Contracts" and opening its page; no Rename, Remove or History on a row; "Add specialty" is the one primary action.
- [ ] Open Ophthalmology: the header's count sentence matches the Surgeons and Contracts cards' counts; every surgeon row opens that surgeon's page and every Contract row opens its Contract page; a Retired surgeon or Disabled Contract is marked; the page fits at 1280 and 1440.
- [ ] Rename on the Name card: Edit, change it, Save: the audit reads `specialty.update` with before and after names; the list, a surgeon of that specialty and a Contract that carries it show the new name; a blank or existing name is refused in place and Cancel restores.
- [ ] Remove on Ophthalmology: refused in the rail with the store's sentence, nothing removed, the holders visible on the page.
- [ ] Add "Paediatric surgery" from the list: it lands on the new page with empty cards and their empty states; Remove confirms, audits `specialty.remove` and returns to the tab.
- [ ] History in the rail opens the shared history sheet with the specialty's entries; an unknown `/admin/people/specialties/xyz` lands on the tab; `/admin/masters?view=specialties` still redirects to the tab.
- [ ] The lane gate (LANES.md: the quick checks and this phase's own specs) green; the full Vitest, builds and `visual/` suite run at the wave's join.

## Demo guide updates

None by this phase: the owner's `/sweep` re-points the guide, the capture recipes and ATLAS. Keep `demoGuideSync.test.ts` green. In the progress entry, list the guide lines that name Specialties as a Master data view or its row actions (grep `docs/demo-guide/` for "Specialties" and "Rename") and the recipes US-13.4.4 touches (ATLAS's `masters-specialties` and `specialty-sheet` rows), so the sweep finds them.

## Adversarial review (after build)

Inside a lane the review waits for the join (LANES.md). When it runs, standard pass (convention 18); steer this phase's reviewers at:

- **One holder rule.** The lists, the counts and Remove's refusal all read from `specialtyHolders` and `specialtyUsage`; no count retyped in a component; the two lists' lengths equal the usage for every specialty, Retired surgeons and Disabled Contracts included, system Contracts and "every specialty" Contracts never listed.
- **Rename reaches holders by id.** One `renameSpecialty`, one audit entry, names (not ids) in before and after; no surgeon or Contract record is rewritten; nothing on the page caches the old name.
- **Remove refused, in place.** The store's sentence is the only wording; no client-side disabling ahead of the guard; an unheld specialty confirms first and the route does not dangle after removal.
- **No regression on the list.** Add still audits `specialty.create` and opens the page; the name rules and the seed's twelve unchanged; the list lost only the row actions.
- **Shared, once.** The record pattern's shared components are used and extended by prop only, never copied; hooks kept; the catalogue row added if a prop was; `oneComponentPerJob.test.ts` green with its allow-list unchanged.
- **Routes.** The People block only gained its route, nothing reordered; a stale id falls back; the old redirects intact.
- **Copy and tokens.** No en or em dashes, no "slot" or phase numbers; the catalogue's words (Contract, Booking); crimson nowhere, teal the only action colour; derived once per render at practice scale (165 surgeons, about 343 Contracts).

## PROGRESS.md updates

- **For the owner's review:** the built defaults of Before you start 4 (holders match the refusal, Retired and Disabled included and marked; no pager; Remove stays enabled and refuses in place; Add opens the new page; History on the rail; an unknown id lands on the tab); that the seed keeps its twelve specialties against the story's nine, for AA's spreadsheet to replace; the guide lines and recipes the sweep must re-point.
- Status row and phase entry: drift check against `67cba2c`; D99, D100, D104 and D105 as built; the names 53 and 55 shipped that this phase used; `specialtyHolders` and `specialtyPath` added; tests added; `PERSIST_VERSION` unchanged; review deferred to the join. Handoffs: the sweep (the recipes for US-13.4.4, ATLAS's `masters-specialties` and `specialty-sheet` rows, the guide's Master data lines for Specialties), and the join (this phase's only shared-file edits are its route lines in `router.tsx` and `routes.tsx` and its row in `/demo/catalogue/admin`).
- Decisions log: Retired and Disabled holders listed and marked, and Remove staying enabled with an in-place refusal, each also in `docs/DECISIONS.md`.
