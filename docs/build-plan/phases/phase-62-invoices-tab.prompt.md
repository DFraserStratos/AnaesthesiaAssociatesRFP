Please run build plan Phase 62 (The Invoices tab) of the Anaesthesia Associates (AA) prototype.

This phase runs in Lane B of the build lanes (docs/build-plan/LANES.md), Wave 5. If this session is not the Lane B session inside its worktree (branch lane/b), stop and tell me to paste docs/build-plan/lanes/lane-b.prompt.md instead.

Load the run-build-phase skill and follow it for this phase (1 session). The phase doc's Before you start, Reference, Work items, Demo triggers, Manual test checklist, Demo guide updates, Review steer for Wave 5's join and PROGRESS.md updates sections hold the phase's reads, drift-check stops, rules and finish items; below is only what the doc does not already say.

Override: commit when green (stage by path; never push). Skip the catalogue screenshot recipes, the demo guide and the capture: the owner's sweep does them. Test once, at the very end (D113): finish on the quick checks only (phase-check.mjs --changed and npm run lint in aa-prototype/); skip the full gate, the screen-proof, the manual test checklist run and the adversarial review: Wave 5's join runs them once for 58 to 67. Use subagents as much as possible (D112): parallel subagents to read code and requirements and to build independent pieces (each told its own files); keep decisions and joins in your own context.

Hold to these above all:
- Start only when 58 and 59 are DONE on `master` and merged into `lane/b`; read 58's and 59's PROGRESS entries and `notes.md` for the names they shipped (the tab file, the link shape, the invoice state and age) and build on those, never your own copy of a rule.
- State, Owing, Kind, age and the search keys come from 59's model only; the list is pure (`invoiceListRows.ts`, tested), derived once and paged after filtering; AA fee invoices never appear.
- `?view=approval` (or whatever shape 58 shipped) opens the Awaiting approval filter, mapped in the screen; never edit `router.tsx`, `routes.tsx`, `financePaths.ts`, `financeCounts.ts` or the registry; note any change they need under For the merge.
- Approve and send and the approval switch keep their behaviour, audit and `data-shot` hooks; Awaiting approval rows leave the filter when approved; OQ-114, OQ-120 and OQ-122 stay as built.
- Build from the shared kit only (D115): no new shared component or variant; no private copy of a shared one.
- Never touch the capture recipes, ATLAS or the demo guide; list what the sweep must re-point.

Phase goal: the Invoices tab of the Finances section finds any invoice, and prepayment invoices are approved under one of its filters (US-08.4.7, US-06.3.1; D107, D114, D115). Over 59's invoice model it lists every invoice, prepayment invoice and credit note AA raises on a payer (AA fee invoices left out), searched by invoice number, payable number, case reference, patient, payer or anaesthetist, with Kind, State (an unpaid one with its age) and Owing columns and the filters Unpaid (where it opens), Part paid, Paid, Awaiting approval and All. Awaiting approval replaces today's separate tab, with the approval switch beside the list in the rail and 58's `?view=approval` link mapped to the filter. Layout: docs/explorations/finances-section.html `#p-invoices`, built from `#kit`.
