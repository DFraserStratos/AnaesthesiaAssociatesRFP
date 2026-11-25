Please run build plan Phase 50 (The rate and priority tier card) of the Anaesthesia Associates (AA) prototype.

This phase runs in Lane A of the build lanes (docs/build-plan/LANES.md). If this session is not the Lane A session inside its worktree (branch lane/a), stop and tell me to paste docs/build-plan/lanes/lane-a.prompt.md instead.

Load the run-build-phase skill and follow it for this phase (1 session). The phase doc's Before you start, Reference, Work items, Demo triggers, Manual test checklist, Demo guide updates, Adversarial review (after build) and PROGRESS.md updates sections hold the phase's reads, drift-check stops, rules and finish items; below is only what the doc does not already say.

Override: commit when green (stage by path; never push). Skip the catalogue screenshot recipes, the demo guide and the capture: the owner's sweep does them.

Hold to these above all:
- A click on a tier never saves: the card's choice is a local draft; only Save writes, only what changed, both writes in one `withChangeSet` (D102), one audited change.
- The card is self-contained (`anaesthetistId`, `actor`) so 54 can place it as is; it lives on today's anaesthetist record and the shared shell files stay as they are (53 moves the routes).
- Build on shared `Card`'s `editing` and `footer` props, never a copy of the Contract page's private editable card.
- The tier stays in the office-private slice and out of the anaesthetist apps; the anaesthetist's own rate editing does not regress; no seed change, no `PERSIST_VERSION` bump.
- The rate leaves `EditAnaesthetistSheet` and the Profile card; the list filter lives in `AnaesthetistsView.tsx` only.

Phase goal: the priority tier is edited in a card with the rate per unit, never by a single click, finishing US-01.3.6 and DM-09 (D102). A self-contained "Rate and tier" card on today's anaesthetist record replaces the click-to-save Priority tier card and the Profile card's rate: Edit, choose, Save or Cancel, one audited change per save. The edit sheet loses its rate field, and the Anaesthetists list gains a tier filter. Layout reference: docs/explorations/people-section.html, `#tier`.
