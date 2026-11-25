Please run build plan Phase 56 (The specialty's page) of the Anaesthesia Associates (AA) prototype.

This phase runs in Lane B of the build lanes (docs/build-plan/LANES.md). If this session is not the Lane B session inside its worktree (branch lane/b), stop and tell me to paste docs/build-plan/lanes/lane-b.prompt.md instead.

Load the run-build-phase skill and follow it for this phase (1 session). The phase doc's Before you start, Reference, Work items, Demo triggers, Manual test checklist, Demo guide updates, Adversarial review (after build) and PROGRESS.md updates sections hold the phase's reads, drift-check stops, rules and finish items; below is only what the doc does not already say.

Override: commit when green (stage by path; never push). Skip the catalogue screenshot recipes, the demo guide and the capture: the owner's sweep does them.

Hold to these above all:
- Who holds a specialty comes from one pure, tested place (`specialtyHolders` beside `specialtyUsage` in `domain/specialties.ts`); both lists' lengths equal `specialtyUsage` for every specialty, so Retired surgeons and Disabled Contracts are listed and marked, system and "every specialty" Contracts never are, and nothing is derived inside a row.
- Rename is the existing `renameSpecialty`, one audited `specialty.update` reaching every holder by id; Remove is the existing `removeSpecialty`, refused with the store's sentence in place, never disabled ahead of it.
- The page is built on 53's shared record pattern (`EditableCard`, the rail) and `ProfilePage` fluid; a missing prop is added to the shared component with a catalogue row, never a private copy.
- The People block of `router.tsx` only gains `specialties/:specialtyId` (never reordered); the old `?view=specialties` redirect stays; every `data-specialty`, `data-shot` and `specialty-sheet` hook survives.
- No seed change (the twelve specialties stay against the story's nine), no `PERSIST_VERSION` bump, no recipe, ATLAS or guide edit.

Phase goal: each specialty gets a page in People (US-13.4.4; D99, D104) at `/admin/people/specialties/:specialtyId`, reached from the Specialties tab, which loses its Rename, Remove and History row actions and keeps Add. The page shows the specialty's name as a card edited and saved on its own, the surgeons who hold it (each opening the surgeon's page) and the Contracts that carry it (each opening its Contract page), both counted, with Remove (refused while held) and History on its rail. Layout reference: docs/explorations/people-section.html, `#map` (Specialties).
