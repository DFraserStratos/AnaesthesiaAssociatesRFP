Please run build plan Phase 47 (The grouped Contract catalogue) of the Anaesthesia Associates (AA) prototype.

This phase runs in Lane B of the build lanes (docs/build-plan/LANES.md). If this session is not the Lane B session inside its worktree (branch lane/b), stop and tell me to paste docs/build-plan/lanes/lane-b.prompt.md instead.

Load the run-build-phase skill and follow it for this phase (1 session). The phase doc's Before you start, Reference, Work items, Demo triggers, Manual test checklist, Demo guide updates, Adversarial review (after build) and PROGRESS.md updates sections hold the phase's reads, drift-check stops, rules and finish items; below is only what the doc does not already say.

Override: commit when green (stage by path; never push). Skip the catalogue screenshot recipes, the demo guide and the capture: the owner's sweep does them.

Hold to these above all:
- `groupContracts` is pure and tested, keyed by ids (they go in `?in=`); a Contract linked to two surgeons is under both, and no count adds the groups up for a total.
- Where a Contract sits for "Invoice goes to" comes only from `destinationOf` (D91, OQ-145 open: a hospital's untagged Contract stays under Special).
- `GroupRow`'s sub-heading is a variant that defaults to today's look, with its `/demo/catalogue/admin` row; the index is one generic `GroupIndex`, never a copy of Master data's nav.
- The remembered grouping is per office user in the persisted shell slice (`shell.contractGrouping`), never browser storage, cleared by Reset, with no `PERSIST_VERSION` bump; the URL wins over it.
- `?holder=` (and D93's redirected `&holder=`) still works by becoming `?group=holder&in=<PartyId>`; every `data-shot` and `data-*` hook the specs and recipes use survives; the toolbar fits one row at 1280.
- No seed change, no checkboxes or bulk actions, no recipe, ATLAS or guide edit.

Phase goal: the Contract list becomes the grouped catalogue, finishing US-04.1.2 (D96). A pure, tested `groupContracts` groups Contracts six ways (holder, kind of holder, funding tag with No tag, surgeon, where the invoice goes, pricing kind). An index of groups with counts sits beside the list, which shows the chosen group's Contracts under sub-headings and is searched by name, holder reference or AA code and filtered Active, Disabled or All. The grouping and the picked group live in the URL, the last grouping is remembered for each office user, and the holder filter becomes the holder grouping. Layout reference: docs/explorations/contracts-section.html, `#catalogue` and `#map`.
