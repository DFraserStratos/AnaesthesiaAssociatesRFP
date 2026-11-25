# Phase 51 · Waiting for an NHI as a tab on Intake

**Requirements covered:**
[US-11.1.5](../../../requirements-board/requirements/stories/US-11.1.5.md) Intake rows waiting for an NHI (status 3 Verify, graded **Contradicts**, size M: every row behaviour holds, but the view is a Patients tab and the Patients badge counts rows Intake's badge already counts),
[US-11.1.4](../../../requirements-board/requirements/stories/US-11.1.4.md) Patient without NHI (status 3 Verify, **Partial**, size S: only the placement differs),
[US-02.1.4](../../../requirements-board/requirements/stories/US-02.1.4.md) Unmatched queue (status 3 Verify, **Partial**, size S: the link and the demo trigger still point at Patients).
DM-10 (patient list counts) is finished in 57; this phase only takes the waiting rows out of the Patients count ([domain-model-delta.md](../analysis/domain-model-delta.md)). No seed change.
**Answered, built as answered** (owner, 25 November, for the build, not yet seen by AA): D99 (Waiting for NHI goes to Intake), D100 (`/admin/patients/waiting` redirects), D101 (Wave 2's split).
**Open:** none.

**Depends on:** none in the plan; it builds on what is on `master` (45 to 49) and the shipped Intake (catch-up Phases 34 and 40).
**Estimated:** 1 session.

**Runs in:** Lane B of the build lanes, Wave 2 (its only phase in that wave, beside Lane A's 50, 52 and 53): built in the `AnaesthesiaAssociatesRFP-laneB` worktree, committed on `lane/b` with a `51 complete:` commit, and joined onto `master` with the rest of Wave 2 (50 to 53). Lane A's 53 merges the `51 complete:` commit at its start, so write in notes.md what this phase changed in `router.tsx`, `routes.tsx` and the selectors. [LANES.md](../LANES.md) overrides this doc's and the skill's commit, port, gate, review, owner-review and plan-page steps for a lane session (a lighter gate per phase; the full gate, one review and the owner's test come after the join).

## Goal

Rows waiting for an NHI are a tab on Intake beside Matching, and count once.

- **Waiting for NHI tab** (`/admin/intake/waiting`): the existing view, moved and unchanged in behaviour: the patient as received, the List or date, one address to chase with the others offered, Urgent within three days, the audited request, Add NHI matching the single record, and the stub on the List.
- **Patients** loses the tab (it keeps Search and Follow-up until 53); `/admin/patients/waiting` redirects to the Intake tab.
- **Counts:** Intake's attention count includes the rows and drops by one when the NHI is added; the Patients count stops counting them.

## Before you start

1. **Drift check** against the plan baseline `67cba2c`:

   ```
   node requirements-board/agent/skills/update-build-plan/tools/plan-state.mjs --diff US-11.1.5,US-11.1.4,US-02.1.4
   ```

   Re-read anything changed after `67cba2c`. If a covered story is Retired or Future, drop it and record it. If the rows' place (a tab on Intake beside the unmatched rows) or the counting rule (Intake's count, dropping when the NHI is added) changes, stop and tell the user.
2. **Confirm 45 to 49 are DONE on `master`** (Wave 1 is joined). Nothing else to confirm: 50 runs beside this phase in Lane A and touches none of its files.
3. **Built as answered:** D99, D100, D101 (above). This phase adds its Intake route, turns the Patients `waiting` route into a redirect and adds its route component as Work items 3 says; nothing in `AdminApp.tsx` or `SideNav.tsx` is needed. Neither badge needs a component edit: both already read the two selectors.
4. **Built defaults** (each a line on the owner's review list, none gets an on-screen caption):
   - **The no-List edge.** A row with no List yet has no stub, so `addNhiToWaitingRow` today only corrects the row and leaves it open on Matching ("Choose a decision for this row"), and Intake's count does not drop. US-11.1.5 says the row leaves the tab and the count drops. Default: the row leaves the waiting tab (its NHI is present), and Intake's count drops when the NHI is added, because a row that is no longer waiting and has no decision to make is not "waiting"; if the row still needs the office to decide, it stays counted once as an ordinary Matching row, never twice. Build the smallest rule that makes the tab, the count and the criterion agree, decide it by reading `matchingAttentionCount`, `addNhiToWaitingRow` and `assessImportRow` for a no-List row, and log it. Prove it with a test of both cases (a row with a stub, a row with no List).
   - **Hospital cancellations with no NHI** stay out of the tab (`waitingNhiRows` already skips them) and stay on Matching for Reject, still counted there.
   - **The tab's count badge** is the waiting rows' count, as the Patients tab showed it; Intake's other tabs show none, so the badge appears on this tab only if `INTAKE_TABS` can carry one without a new shared variant; otherwise none.
   - **Add NHI's two follow-ups** ("Open list", "Open in Matching") keep their behaviour; "Open in Matching" opens `/admin/intake/matching` with `{ selectRowId }` as today.
5. **Reads beyond the run-build-phase standard list:**
   - **Design:** [people-section.html](../../explorations/people-section.html) `#patients` (the "What moves" note: Waiting for NHI moves to Intake as a tab beside matching; the "Badges" note: Intake's badge adds the rows). It shows no mock of the Intake tab itself: use Intake's own tab strip (`IntakeScreen.tsx`, the `LineTabLink` row) and the existing `WaitingNhiView` layout, unchanged.
   - **ROADMAP.md:** D99, D100 (above, one line each: People's shape with Waiting for NHI to Intake; old Patients links redirect); D101 (Wave 2's split: 51 runs in Lane B); D105's DM-10 line (51 takes the waiting rows out of the patient count, 57 finishes it); "Owner review: agents test themselves".
   - **GAP-ANALYSIS.md:** the EP-11 row for US-11.1.5 and US-11.1.4 and the EP-02 row for US-02.1.4, with their `gaps.json` entries (the evidence lines, which Work items answer).
   - **Catalogue:** the three stories in full, their Notes of 25 November ("A tab on Intake"); [US-02.6.1](../../../requirements-board/requirements/stories/US-02.6.1.md) only for the stub on the List.
   - **DECISIONS.md:** honours the Patients and NHI rulings (a hospital cancellation with no NHI is not chased); supersedes none. **BACKLOG.md:** closes none.
   - **PROGRESS.md:** the catch-up archive's Phase 40 and 40a entries (docs/archive/prototype-build/catch-up/) only for what `WaitingNhiView`, `AddNhiSheet`, `waitingNhiRows`, `addNhiToWaitingRow` and `NHI_HUB_ROUTES` already do, so none regresses.

## Reference

- **Code:** `src/apps/admin/screens/IntakeScreen.tsx` (`INTAKE_TABS`, `useIntakePage`); `src/apps/admin/screens/patients/` (`WaitingNhiView.tsx`, `AddNhiSheet.tsx`, `PatientsScreen.tsx` with `PATIENT_LIST_PATHS`, `SHOTS`, its tab strip and counts, `patients.test.tsx`, `nhiRegister40a.test.tsx`); `src/apps/admin/intake/` (the other Intake tabs, where a tab component sits); `src/apps/admin/routes.tsx` (`AdminIntakeRoute`, `AdminWaitingNhiRoute`, `patientListRoute`); `src/router.tsx` (Intake and Patients blocks); `src/apps/admin/matching/MatchingTable.tsx` (the `matching-waiting-link`); `src/store/patientSelectors.ts` (`waitingNhiRows`, `patientAttentionCount`), `matchingSelectors.ts` (`matchingAttentionCount`), `patientActions.ts` (`addNhiToWaitingRow`), `stubSettle.ts`; `src/shared/demoTriggers/registry.ts` (`NHI_HUB_ROUTES`, `receive-no-nhi-list`); `src/apps/demo/demoScenarios.ts` (the `waitingForNhi` marker is a seed route: leave `domain/seed/index.ts` alone, the redirect keeps it loading), `src/apps/demo/catalogue/AdminCatalogue.tsx`.
- **Tests:** `phase40Triggers.test.ts`, `phase40aTriggers.test.ts`, `demoScenarios.test.ts`, `MatchingBalance.test.tsx`, `patientActions.test.ts`, `phase40Review.test.ts`, `matchingActions.test.ts` (it asserts a count of 6); Playwright `visual/admin-patients.spec.ts`, `nhi-lookup.spec.ts`, `admin-layout.spec.ts`, `demo-actions-audit.spec.ts`.
- **Design:** `docs/explorations/people-section.html` `#patients`.

## Work items

1. **Move the view.** With `mv`, never `git mv`: `screens/patients/WaitingNhiView.tsx` and `AddNhiSheet.tsx` to `src/apps/admin/intake/` (new files `WaitingNhiTab.tsx` wrapping the view, and `AddNhiSheet.tsx` if `grep` shows nothing in Patients uses it; otherwise leave it and import it). Behaviour, copy and every `shot`, `data-shot` and `data-*` hook unchanged, except the caption and any text that says "Patients" for this view. The tab reads `waitingNhiRows` and takes `actor`, `onOpenList` and `onOpenMatching` the way `usePatientRouteHandlers` does (read from the Admin outlet; do not edit that hook, copy its three lines into the tab).
2. **The Intake tab.** `INTAKE_TABS` gains `{ path: '/admin/intake/waiting', label: 'Waiting for NHI', mode: 'fit' }` after Matching. The page `sub` line and header copy stay as they are unless they contradict the tab. The tab places any primary action through `useIntakePage` (none expected).
3. **Routes.** In `router.tsx`'s Intake block add one route `waiting` rendering the new route component; in its Patients block turn `waiting` into `<Navigate to="/admin/intake/waiting" replace />`; in `apps/admin/routes.tsx` add one route component (`AdminWaitingNhiTabRoute`). Once the Patients redirect is in, `AdminWaitingNhiRoute` is unused: delete it from `routes.tsx`. Record these edits in notes.md for 53, which merges this phase at its start.
4. **Patients loses the tab.** `PatientsScreen.tsx`: drop `waiting` from `PatientListView`, `PATIENT_LIST_PATHS`, `SHOTS`, `counts`, `labels`, the tab strip and the render; the screen keeps Search and Follow-up. The Patients tab strip's count badges for the two left are unchanged.
5. **Counts, in the selectors only.** `patientAttentionCount` stops adding `waitingNhiRows`; `matchingAttentionCount` keeps counting open rows (waiting ones included, once) and follows Before you start 4's no-List rule, so Intake's count drops when the NHI is added. If the rule needs `addNhiToWaitingRow` to change, change only that no-stub branch. Update the selectors' own doc comments ("The Patients nav badge: ..."); `SideNav.tsx`'s comment is left alone.
6. **Re-point the links.** `MatchingTable.tsx`'s `matching-waiting-link` to `/admin/intake/waiting`; in `registry.ts` change only `NHI_HUB_ROUTES`' `'/admin/patients/waiting'` entry and the `receive-no-nhi-list` entry's `screen` ('Admin · Intake · Waiting for NHI'), `routes`, `indexPath` and the "wait here and on Matching" copy if it names Patients (the other lanes add entries to this file: touch nothing else); `demoScenarios.ts`' beat path; `NHI_HUB_SCREEN` ("Add booking, and Admin · Patients") only if it names the waiting view.
7. **Tests.** New `waitingCounts.test.ts` beside the selectors: a waiting row counts once, in `matchingAttentionCount` and not in `patientAttentionCount`; Add NHI on a row with a stub drops Intake's count by one; the no-List case behaves as the default says; a hospital cancellation with no NHI is not in `waitingNhiRows` and stays counted on Matching. Move the waiting parts of `patients.test.tsx` and `nhiRegister40a.test.tsx` next to the tab. `matchingActions.test.ts`'s count of 6 and `patientActions.test.ts`'s `base + 2` follow the new rule (change an expected figure only where the rule says it moves, and note each). `MatchingBalance.test.tsx`, `phase40Triggers.test.ts`, `phase40aTriggers.test.ts` and `demoScenarios.test.ts` take the new path; add a router test that `/admin/patients/waiting` lands on `/admin/intake/waiting`. Playwright: `admin-patients.spec.ts`, `nhi-lookup.spec.ts`, `admin-layout.spec.ts` (and `demo-actions-audit.spec.ts` if it lists the path) follow the new path. `demoGuideSync.test.ts` stays green without a guide edit (it reads only the Demo actions labels, which do not change).
8. **Catalogue row.** `AdminCatalogue.tsx`'s `WaitingNhiView / WaitingNhiRowView / AddNhiSheet` row: its `source` and `usedIn` follow the move, in this change.
9. **Build on the shared components** (`AdminPage`, `LineTabs`/`LineTabLink`, `TableShell`, `Pill`, `TextAction`, `Button`, the shared sheet). The move adds no private copy; the view already uses the shared ones. Keep every `shot`, `data-shot` and `data-*` hook.

## Demo triggers

| id | Label | Screen | Surfaces | Effect | Disabled when |
|---|---|---|---|---|---|
| `receive-no-nhi-list` (existing) | Receive list with a missing NHI | Admin, Intake, Waiting for NHI | bar | the same Forte Health sheet with two no-NHI bookings, re-pointed from Patients to the tab | already received |
| `pwa-office-adds-nhi` (existing) | Office adds the NHI | PWA | bar | unchanged: runs the same store action | as before |
| (product) | Add NHI on the tab; Intake's count dropping by one | Intake, Waiting for NHI | none | normal use | |

For urgency, the existing demo clock control (advance to within three days of the row's date).

## Out of scope

- Any change to the row behaviour, the request, the stub or the patient match; a Patients list change (53, 57); the Patients badge's other three counts.
- `AdminApp.tsx` and `SideNav.tsx`, and any shell change beyond the routes named in Work items 3.
- Capture recipes, ATLAS and the demo guide (the owner's sweep); a seed or `PERSIST_VERSION` change (none: no seed shape or content moves, and `domain/seed/index.ts`'s route marker stays).

## Manual test checklist

Run these yourself in the running app and report pass or fail with evidence.

- [ ] Admin, Intake: the tab strip reads Matching, Waiting for NHI, PDF lists, Data quality, Validators; Waiting for NHI lists IRS001's row with its patient as received, the List or date and the address to chase; the page fits at 1280 and 1440.
- [ ] Demo actions, Receive list with a missing NHI: two rows join; Intake's badge rises by two and the Patients badge does not move.
- [ ] Add NHI to the new-patient row: the row leaves the tab, a stub on its List becomes the Booking, Intake's badge drops by one; adding the returning patient's NHI matches the single record.
- [ ] A row with no List yet: Add NHI behaves as the built default says, and the tab, the badge and Matching agree.
- [ ] A hospital cancellation with no NHI is not on the tab and still shows on Matching for Reject.
- [ ] Matching's "Waiting for NHI" link opens the tab; `/admin/patients/waiting` redirects to it and Back does not loop; Patients shows only Search and Follow-up.
- [ ] An NHI lookup's hub entry shows on the tab and on the Patients screens still left.
- [ ] `build`, `build:pwa`, `vitest` and the whole of `visual/` green (the lane's lighter gate first; the full gate after the join).

## Demo guide updates

None by this phase: the owner's `/sweep` re-points the guide, the capture recipes and ATLAS. Keep `demoGuideSync.test.ts` green. In the progress entry list what the sweep must re-point: the guide's "Patients, Waiting for NHI" beats (the redirect keeps them loading; grep `docs/demo-guide/` for "Waiting for NHI"), S-scenario beats that open `/admin/patients/waiting`, and the recipes and ATLAS rows for `admin-waiting-nhi`, `matching-waiting-link` and the `patients-tabs` shot (US-11.1.5, US-11.1.4, US-02.1.4).

## Adversarial review (after build)

Standard pass (convention 18), run once after the join per LANES.md. Steer this phase's reviewers at:

- **One count, once.** A waiting row is in `matchingAttentionCount` and never in `patientAttentionCount`; the no-List edge and the cancellation case behave as logged; no badge arithmetic in `AdminApp.tsx` or `SideNav.tsx`.
- **Shell edits.** `router.tsx` and `routes.tsx` carry only the named edits (Intake route, Patients redirect, the route component, `AdminWaitingNhiRoute` removed); `registry.ts` changed only the named lines.
- **Redirect and links.** Every in-app link and demo trigger points to `/admin/intake/waiting`; the old path redirects with replace; the seed's route marker still resolves.
- **Moved unchanged.** The view's behaviour, copy and hooks are as before; no private copy of a shared component; the catalogue row follows.
- **Copy and tokens.** No en or em dashes, no "slot" or phase numbers; crimson nowhere, teal the only action colour.

## PROGRESS.md updates

- **For the owner's review:** the no-List edge default and what it does to Intake's count; the tab's badge choice; any export left unused in `routes.tsx` for 53; what the sweep must re-point.
- Status row and phase entry: drift check against `67cba2c`; D99, D100 as built; the names this phase shipped (the tab component, the route component, the selectors' new rule); tests added or changed (each moved figure); `PERSIST_VERSION` unchanged; lane commit `51 complete:`. Handoffs: 53 (Patients keeps Search and Follow-up; the three-filter list builds on `PatientsScreen`; the redirects stay), 57 (DM-10: one row per patient finishes there), the sweep.
- Decisions log: the no-List edge rule, also in `docs/DECISIONS.md`.
