Please run build plan Phase 51 (Waiting for an NHI as a tab on Intake) of the Anaesthesia Associates (AA) prototype.

This phase runs in Lane B of the build lanes (docs/build-plan/LANES.md). If this session is not the Lane B session inside its worktree (branch lane/b), stop and tell me to paste docs/build-plan/lanes/lane-b.prompt.md instead.

Load the run-build-phase skill and follow it for this phase (1 session). The phase doc's Before you start, Reference, Work items, Demo triggers, Manual test checklist, Demo guide updates, Adversarial review (after build) and PROGRESS.md updates sections hold the phase's reads, drift-check stops, rules and finish items; below is only what the doc does not already say.

Override: commit when green (stage by path; never push). Skip the catalogue screenshot recipes, the demo guide and the capture: the owner's sweep does them.

Hold to these above all:
- 53 (Lane A) merges this phase's `51 complete:` commit at its start, so write in notes.md what you changed in `router.tsx`, `routes.tsx` and the selectors; `AdminApp.tsx` and `SideNav.tsx` are never touched (the counts change in the selectors).
- The counts change only in `patientAttentionCount` and `matchingAttentionCount`: a waiting row counts once, on Intake, and Intake's count drops when the NHI is added, the no-List edge included (the built default in the doc).
- The view moves with `mv` (never `git mv`) and keeps its behaviour, copy and every `data-*` hook; hospital cancellations with no NHI stay on Matching.
- In `registry.ts` edit only `NHI_HUB_ROUTES`' waiting entry and the `receive-no-nhi-list` entry; the other lanes add to that file.
- No seed change, no `PERSIST_VERSION` bump, no recipe, ATLAS or guide edit.

Phase goal: rows waiting for an NHI become their own tab on Intake beside Matching (US-11.1.5, US-11.1.4, US-02.1.4; D99, D100). `WaitingNhiView` moves from Patients to Intake at `/admin/intake/waiting` unchanged in behaviour, the old Patients path redirects, Patients keeps Search and Follow-up, and Intake's attention count includes the rows and drops when the NHI is added while the Patients count stops counting them. Matching's link, the `receive-no-nhi-list` trigger and the NHI hub routes point at the tab. Layout reference: docs/explorations/people-section.html `#patients`, and Intake's own tab strip.
