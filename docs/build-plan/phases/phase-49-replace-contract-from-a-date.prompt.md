Please run build plan Phase 49 (Replace a Contract from a date) of the Anaesthesia Associates (AA) prototype.

This phase runs in Lane A of the build lanes (docs/build-plan/LANES.md). If this session is not the Lane A session inside its worktree (branch lane/a), stop and tell me to paste docs/build-plan/lanes/lane-a.prompt.md instead.

Load the run-build-phase skill and follow it for this phase (one to two sessions). The phase doc's Before you start, Reference, Work items, Demo triggers, Manual test checklist, Demo guide updates, Adversarial review (after build) and PROGRESS.md updates sections hold the phase's reads, drift-check stops, rules and finish items; below is only what the doc does not already say.

Override: commit when green (stage by path; never push). Skip the catalogue screenshot recipes, the demo guide and the capture: the owner's sweep does them.

Hold to these above all:
- The link and the change date live only in the new Contract's `contract.create` audit entry (`replaces: { contractId, fromISO }`): no field on `Contract`, no seeded replacement, `PERSIST_VERSION` stays 78 (D94; work item 1).
- `replaceContract` runs in one `withChangeSet(api, 'move', …)`: create, event fees, then only the listed and ticked Procedures through `setProcedureContract` with per-row outcomes, then the disable; a refused create writes nothing (work item 2).
- The to-do is a pure, derived rule in `domain/warnings/rules/` with a Contract subject, outside `WARNING_RULES`, with no Clear, and never a blocker (`lifecycle.ts` untouched) (work item 4).
- A late disable lists from the change date read from the audit, never the entry's timestamp, tested with the story's 1, 5 and 8 January example (work item 8).
- A system Contract is refused in the store as well as hidden; a fixed price changing from a date points to a price range; the rate notice says the replacement is offered from today (D90, open).
- The story says "Procedures" where the design sheet says "Bookings"; the Contract page URL is the Contract id, never the AA code.

Phase goal: Replace from a date as one action from a Contract's page: a sheet that copies the Contract with any setting changed (the ones fixed at creation included) under a new AA code, lists the Procedures from the change date still on the old one (locked ones left out), moves only the ones the office ticks, and leaves the old Contract Active with a to-do on the date or disables it now, every step audited in one change set. The to-do shows in the Day view and on the old Contract's page once the date is reached (a "Reach the change date" demo trigger gets there), a late disable lists the Procedures from the change date, and the replacement shows in both Contracts' history, which finishes US-04.1.3.
