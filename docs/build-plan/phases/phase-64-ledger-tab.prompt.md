Please run build plan Phase 64 (The Ledger tab) of the Anaesthesia Associates (AA) prototype.

This phase runs in Lane C of the build lanes (docs/build-plan/LANES.md), Wave 5. If this session is not the Lane C session inside its worktree (branch lane/c), stop and tell me to paste docs/build-plan/lanes/lane-c.prompt.md instead.

Load the run-build-phase skill and follow it for this phase (1 session). The phase doc's Before you start, Reference, Work items, Demo triggers, Manual test checklist, Demo guide updates, Review steer for Wave 5's join and PROGRESS.md updates sections hold the phase's reads, drift-check stops, rules and finish items; below is only what the doc does not already say.

Override: commit when green (stage by path; never push). Skip the catalogue screenshot recipes, the demo guide and the capture: the owner's sweep does them. Test once, at the very end (D113): finish on the quick checks only (phase-check.mjs --changed and npm run lint in aa-prototype/); skip the full gate, the screen-proof, the manual test checklist run and the adversarial review: Wave 5's join runs them once for 58 to 67. Use subagents as much as possible (D112): parallel subagents to read code and requirements and to build independent pieces (each told its own files); keep decisions and joins in your own context.

Hold to these above all:
- Start only when 58 is DONE on `master` (stop as blocked if not); touch only Lane C's files and new ones: never `router.tsx`, `SideNav.tsx`, `AdminApp.tsx`, `routes.tsx`, `financePaths.ts`, `financeCounts.ts` or `registry.ts` (note needs under "For the merge"), and never the Day view's use of `ReconciliationCard`.
- The sentence reads the Day view's reconciliation status and adds no check of its own; the four figures are named as the story names them, and "Receipts held" (money AA holds for anaesthetists) is not "receipts to place".
- The anaesthetists' five money columns are new pure, tested reads in one pass over the pairs, equal to `anaesthetistPosition` per anaesthetist (parity test); never that function once per row.
- Build from the shared kit (D115): no new shared component or variant, StatTiles two by two is only a grid; every existing `ledger-*`, `holding-*`, `data-pair-id`, `data-unmatched-id` and `data-check` hook survives.
- OQ-149 at D106's default (place or refund in the system only, nothing pushed to Xero) and OQ-125's provisional pill kept; `LedgerScreen.tsx` keeps the one-anaesthetist branch for the account route until 65. No seed change, no `PERSIST_VERSION` bump.
- Never touch the capture recipes, ATLAS or the demo guide; list what the sweep must re-point.

Phase goal: the Ledger tab of the Finances section says in one sentence whether the books are square and what is wrong, shows four figures (owed to AA, owed to the anaesthetists, the AA Holding account, receipts to place) as StatTiles two by two in a rail card beside a segmented Anaesthetists, Invoice pairs or AA Holding account list, and lists every anaesthetist with billed, paid into AA, disbursed, AA owes them and they owe AA, with receipts to place and their Allocate and Mark refunded in the rail (US-13.2.1's tab half; the mock's `#p-ledger` and `#kit`; D106, D107, D114, D115). The whole/one switch, the headline, the equation and the ten tiles leave the tab, and the slow open and the 1440 overflow are measured and fixed.
