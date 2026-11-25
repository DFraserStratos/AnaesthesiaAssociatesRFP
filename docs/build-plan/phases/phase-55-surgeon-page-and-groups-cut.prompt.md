Please run build plan Phase 55 (The surgeon's page, and surgeon groups cut) of the Anaesthesia Associates (AA) prototype.

This phase runs in Lane B of the build lanes (docs/build-plan/LANES.md). If this session is not the Lane B session inside its worktree (branch lane/b), stop and tell me to paste docs/build-plan/lanes/lane-b.prompt.md instead.

Load the run-build-phase skill and follow it for this phase (1 to 2 sessions: session 1 the cut, green; session 2 the page). The phase doc's Before you start, Reference, Work items, Demo triggers, Manual test checklist, Demo guide updates, Adversarial review (after build) and PROGRESS.md updates sections hold the phase's reads, drift-check stops, rules and finish items; below is only what the doc does not already say.

Override: commit when green (stage by path; never push). Skip the catalogue screenshot recipes, the demo guide and the capture: the owner's sweep does them.

Hold to these above all:
- The surgeon group record goes whole (type, slice, seed, actions, retire kind, rename link, `SGN`, selectors, sheet, labels, tests, baseline) with a `PERSIST_VERSION` bump; the Party of kind surgeon group and every Contract it holds do not change. If a reader of the record turns up in billing, the step rail, pairings, rules or the loader, stop (doc, Before you start 1 and 4).
- One card, one change: each card saves only its own fields through `editSurgeon` and writes one audited change (a following surgeon Party rename inside the same change set); refusals show on their card; Cancel writes nothing.
- Build on 53's shared card and side panel and extend them only with a prop and its `/demo/catalogue` row; never copy them, and never rebuild 53's Surgeons list search, filters or pager.
- Linked Contracts and next Lists come from pure, tested selectors; swap only this page's element in the People route block, never reorder it.
- Remove files with `rm`, never `git rm`; keep every surgeon page hook the specs and recipes use, moving the edit sheet's field hooks onto the cards.

Phase goal: each surgeon gets a page in People at /admin/people/surgeons/:surgeonId on 53's record pattern: cards for name and practice, registration number, HPI CPN (blank allowed, duplicates refused), specialties and contacts, plus a Status card holding Retire, each edited and saved on its own as one audited change; a side panel of the surgeon's pairings both ways, the Contracts linked to them (each naming its holder) and their next Lists, a few each with See all; no Groups card, and the edit sheet kept for New surgeon only. The surgeon group record is removed from the domain, store and seed (DM-08, OQ-148 at its default), with a PERSIST_VERSION bump, while the surgeon-group Parties and their Contracts stay as they are.
