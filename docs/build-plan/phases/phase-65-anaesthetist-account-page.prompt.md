Please run build plan Phase 65 (The anaesthetist's account page) of the Anaesthesia Associates (AA) prototype.

This phase runs in Lane C of the build lanes (docs/build-plan/LANES.md), Wave 5. If this session is not the Lane C session inside its worktree (branch lane/c), stop and tell me to paste docs/build-plan/lanes/lane-c.prompt.md instead.

Load the run-build-phase skill and follow it for this phase (1 session). The phase doc's Before you start, Reference, Work items, Demo triggers, Manual test checklist, Demo guide updates, Review steer for Wave 5's join and PROGRESS.md updates sections hold the phase's reads, drift-check stops, rules and finish items; below is only what the doc does not already say.

Override: commit when green (stage by path; never push). Skip the catalogue screenshot recipes, the demo guide and the capture: the owner's sweep does them. Test once, at the very end (D113): finish on the quick checks only (phase-check.mjs --changed and npm run lint in aa-prototype/); skip the full gate, the screen-proof, the manual test checklist run and the adversarial review: Wave 5's join runs them once for 58 to 67. Use subagents as much as possible (D112): parallel subagents to read code and requirements and to build independent pieces (each told its own files); keep decisions and joins in your own context.

Hold to these above all:
- Start only when 58 and 64 are DONE on their lane branches; build in the file 58's account route renders and never edit `router.tsx`, `routes.tsx`, `financePaths.ts`, `SideNav.tsx`, `AdminApp.tsx` or `registry.ts`: list any route, link or trigger change under "For the merge" and in `notes.md`.
- Built from the mock's `#kit` only: `ProfilePage`, `Card`, `RailSection`, `StatTile`, `Pill`, `Notice`, `TableShell`; no new shared component or variant, no private copy of one.
- The page and 64's list row read the same `anaesthetistLedgerPosition`; every link goes through `financePaths.ts` or `anaesthetistRecordPath`; money through `formatMoney`.
- `LedgerPaymentRuns.tsx` imports only `RUN_STATUS` from `PaymentCyclePanel` (66 changes it next); the whole/one switch and its remnants in `LedgerScreen.tsx` go.
- No seed change, no `PERSIST_VERSION` bump; never touch the capture recipes, ATLAS or the demo guide, and list what the sweep must re-point.

Phase goal: each anaesthetist's money gets its own account page under Ledger, finishing US-13.2.1 (D107, D114, D115). At /admin/finances/ledger/anaesthetists/:anaesthetistId, on the record pattern: a back link to the Ledger, the name with a Square or Out of balance pill, a summary line (what AA owes them and in which week's run, what they owe AA) and Open in People; the AA owes them and They owe AA cards, their invoice pairs (billed, paid in, disbursed), and a rail of their payment runs (a few, See all) and credit trails. It replaces the Whole ledger / One anaesthetist switch; an unknown id falls back to the Ledger tab. At its close the six criteria of US-13.2.1 are walked across 64 and 65. Layout reference: docs/explorations/finances-section.html, `#records` (Anaesthetist's account), with `#kit`, `#p-ledger` and `#moves`.
