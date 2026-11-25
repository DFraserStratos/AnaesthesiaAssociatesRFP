Please run build plan Phase 67 (The AA fees tab) of the Anaesthesia Associates (AA) prototype.

This phase runs in Lane B of the build lanes (docs/build-plan/LANES.md), Wave 5. If this session is not the Lane B session inside its worktree (branch lane/b), stop and tell me to paste docs/build-plan/lanes/lane-b.prompt.md instead.

Load the run-build-phase skill and follow it for this phase (1 session). The phase doc's Before you start, Reference, Work items, Demo triggers, Manual test checklist, Demo guide updates, Review steer for Wave 5's join and PROGRESS.md updates sections hold the phase's reads, drift-check stops, rules and finish items; below is only what the doc does not already say.

Override: commit when green (stage by path; never push). Skip the catalogue screenshot recipes, the demo guide and the capture: the owner's sweep does them. Test once, at the very end (D113): finish on the quick checks only (phase-check.mjs --changed and npm run lint in aa-prototype/); skip the full gate, the screen-proof, the manual test checklist run and the adversarial review: Wave 5's join runs them once for 58 to 67. Use subagents as much as possible (D112): parallel subagents to read code and requirements and to build independent pieces (each told its own files); keep decisions and joins in your own context.

Hold to these above all:
- Start only when 58 is DONE on `master` and merged into `lane/b`; read its PROGRESS entry and `notes.md` for the names it shipped (`AaFeesTab.tsx`, how `/aa-fees/settings` reaches the tab, the hooks and triggers it re-homed) and build on those.
- The tab opens on Unpaid, oldest first, from a new pure, tested helper (`screens/aaFeeRows.ts`), derived once and paged after filtering; never change `allAaFeeInvoices`'s order, `aaFee.ts` or 52's month rule.
- The fee settings sit on the tab in the rail (summary, then Change), not a sub-tab; `/aa-fees/settings` opens the tab with them open and in view, and you never edit that route, `router.tsx`, `routes.tsx`, `financePaths.ts`, `financeCounts.ts` or the registry; note any change they need under For the merge.
- Preview raises nothing; the run, its disabled reasons, its result line, the audit and every `data-shot` hook and `aaFees.month` context keep their behaviour; no seed change and no `PERSIST_VERSION` bump.
- Build from the shared kit only (D115): no new shared component or variant; no private copy of a shared one; AA fee invoices stay off the Invoices tab.
- Never touch the capture recipes, ATLAS or the demo guide; list what the sweep must re-point.

Phase goal: the AA fees tab of the Finances section lists AA's fee invoices to the anaesthetists, opening on the unpaid ones, with the month's run and its preview beside them and the fee settings on the same tab (US-10.3.1, US-10.3.3; D107, D110, D114, D115; OQ-60 and OQ-112 as built). Over `allAaFeeInvoices` it shows a toolbar of search, Unpaid, Paid and All pills and a month select, a paged table (Number, Anaesthetist, Month, BCTIs, Fee, GST, Total, State, Raised) that still unfolds to its lines and counted BCTIs, and a rail with the month's run (Runs on month end, Preview, Run monthly fee invoices), the fee settings and Earlier runs. Layout: docs/explorations/finances-section.html `#p-aafees`, built from `#kit`.
