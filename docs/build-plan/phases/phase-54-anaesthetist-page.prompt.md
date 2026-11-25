Please run build plan Phase 54 (The anaesthetist's page) of the Anaesthesia Associates (AA) prototype.

This phase runs in Lane A of the build lanes (docs/build-plan/LANES.md). If this session is not the Lane A session inside its worktree (branch lane/a), stop and tell me to paste docs/build-plan/lanes/lane-a.prompt.md instead.

Load the run-build-phase skill and follow it for this phase (1 session). The phase doc's Before you start, Reference, Work items, Demo triggers, Manual test checklist, Demo guide updates, Adversarial review (after build) and PROGRESS.md updates sections hold the phase's reads, drift-check stops, rules and finish items; below is only what the doc does not already say.

Override: commit when green (stage by path; never push). Skip the catalogue screenshot recipes, the demo guide and the capture: the owner's sweep does them.

Hold to these above all:
- One card, one change: each card saves through `editAnaesthetist` with only its own changed fields (one audited `anaesthetist.update`), refuses on its own card, and the bank number stays masked at rest and in the audit; the name is read-only; no store change, no seed change, no `PERSIST_VERSION` bump.
- 50's rate and tier card and 52's status card (with its history card) are placed as built, never rewritten or copied; the cards and the side panel come from 53's shared components, extended with a default-off prop at most, never copied into the screen.
- Only the People route's element for this page changes: no edit to the People block's order, router, side nav, `AdminApp`, `ProfileChrome`'s `HeaderActions` or the other People pages; `PairingSection` gets at most one default-off prop, because the surgeon's page (Lane B) shares it.
- Panel rows come from pure, tested selectors (three of eight Lists plus See all; a hospital-held linked Contract still shows; Draft and past Lists never); the tier and preferences stay office only.
- `EditAnaesthetistSheet`, its list row Edit, its tests, catalogue rows and spec steps are all removed, and Add anaesthetist keeps working; never edit the capture recipes, ATLAS or the demo guide.

Phase goal: each anaesthetist gets a page in People at /admin/people/anaesthetists/:anaesthetistId (the registration number) on 53's record pattern, ProfilePage fluid with the 412px side panel. Identity (name and registration read-only, HPI CPN), Contact and Bank and GST cards are each edited and saved on their own as one audited change, beside 50's Rate and tier card and 52's Status and History cards placed as they are. The side panel shows their pairings, the Contracts linked to them and their next Lists, three of each with See all. The all-fields EditAnaesthetistSheet is deleted, finishing US-12.1.4.
