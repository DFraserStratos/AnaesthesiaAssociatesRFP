Please run build plan Phase 53 (The People section and the shared record pattern) of the Anaesthesia Associates (AA) prototype.

This phase runs in Lane A of the build lanes (docs/build-plan/LANES.md). If this session is not the Lane A session inside its worktree (branch lane/a), stop and tell me to paste docs/build-plan/lanes/lane-a.prompt.md instead.

Load the run-build-phase skill and follow it for this phase (2 sessions; the checkpoint is after Work item 7). The phase doc's Before you start, Reference, Work items, Demo triggers, Manual test checklist, Demo guide updates, Adversarial review (after build) and PROGRESS.md updates sections hold the phase's reads, drift-check stops, rules and finish items; below is only what the doc does not already say.

Override: commit when green (stage by path; never push). Skip the catalogue screenshot recipes, the demo guide and the capture: the owner's sweep does them.

Hold to these above all:
- Start only when 46 to 49 are DONE on `master`, 50 and 52 are complete on `lane/a` and 51 is complete on `lane/b` and merged in (if 51 is not complete, stop as blocked); this phase owns every shared shell file, and lays the People route block in the doc's fixed order for 54 to 57.
- The lift changes nothing on the Contract page: `ContractPage.test.tsx` and the Contract specs pass untouched, every hook survives, and `useCardEdit` takes a commit callback, never `editContract`.
- Every old link in D100 redirects with replace and stays; in-app links go through `peoplePaths.ts` and `patientPath` only.
- Only the Surgeon groups list and its sheet go; the surgeon group record, its seed, its actions and the surgeon page's Groups card stay for 55. No seed change, no `PERSIST_VERSION` bump.
- The list filters are pure and tested (`peopleLists.ts`); the Surgeons list meets Find a person; Inactive reads 52's `isActiveOn`; the tier stays office-only.
- Never touch the capture recipes, ATLAS or the demo guide; list what the sweep must re-point.

Phase goal: anaesthetists, surgeons, specialties and patients become one People section of the Admin app (US-13.4.1; D98, D99, D100, D104, D105). A People entry takes Patients' place and its attention count in the side nav, with four routed tabs (Anaesthetists, Surgeons, Specialties, Patients); the record routes move under them with today's screens, and every old Master data, profile and Patients link redirects. Master data keeps Places with a pointer across, and the Surgeon groups list goes. The Anaesthetists, Surgeons and Specialties lists are searched, filtered and paged; the Patients tab hosts today's views until 57. The Contract page's cards edited one at a time and its rail of short sections with See all are lifted into shared components with catalogue rows, for 54 to 57 to build on. Layout reference: docs/explorations/people-section.html, `#map`, `#nav` and `#groups`.
