Please run build plan Phase 59 (The Finances read models) of the Anaesthesia Associates (AA) prototype.

This phase runs in Lane B of the build lanes (docs/build-plan/LANES.md), Wave 4. If this session is not the Lane B session inside its worktree (branch lane/b), stop and tell me to paste docs/build-plan/lanes/lane-b.prompt.md instead.

Load the run-build-phase skill and follow it for this phase (1 session). The phase doc's Before you start, Reference, Work items, Demo triggers, Manual test checklist, Demo guide updates, Review steer for Wave 5's join and PROGRESS.md updates sections hold the phase's reads, drift-check stops, rules and finish items; below is only what the doc does not already say.

Override: commit when green (stage by path; never push). Skip the catalogue screenshot recipes, the demo guide and the capture: the owner's sweep does them. Test once, at the very end (D113): finish on the quick checks only (phase-check.mjs --changed and npm run lint in aa-prototype/); skip the full gate, the screen-proof, the manual test checklist run and the adversarial review: Wave 5's join runs them once for 58 to 67. Use subagents as much as possible (D112): parallel subagents to read code and requirements and to build independent pieces (each told its own files); keep decisions and joins in your own context.

Hold to these above all:
- Pure domain only: new files `billingStatus.ts` and `invoiceState.ts` (and their tests) in `domain/billing/`, never importing the store; the store's indexes, the state slices and `todayISO` come in as arguments. No screen, store, router, registry or catalogue file, and nothing 58 owns.
- The only edit to an existing file is two optional fields on `BillingException` in `domain/types.ts` (`resolvedBy`, `resolvedNote`); no seed change, no `PERSIST_VERSION` bump. `domain/billing/index.ts` only if the files join the barrel.
- Reuse the monitor's stage rules over `pairStatusLabel` and the ledger's owing rule; never a second copy. Done includes a failure resolved by hand (resolved, no `resolvedPairIds`); a stuck Booking is a problem under its List, counted once (D109); AA fee invoices never reach the invoice rows.
- The no-address code is a name, reason and fix only: tests build the exception directly; 60's run raises it (D116).
- Every story example is a test, plus a practice-scale test; write the exports and what 60 and 62 pass in `notes.md`.

Phase goal: the read models the Billing and Invoices tabs stand on, as pure, tested functions with no UI (the mock's `docs/explorations/finances-section.html` `#p-billing`, `#billing-table` version C and `#p-invoices` show what they feed). `billingStatus.ts` gives each Booking's and List's billing status (stage, sent, in Xero, paid in, disbursed, the problem's reason and fix with the new payer-has-no-address code, Problems, In progress or Done, List counts, anaesthetist grouping, search, the problem-List count and the Xero hand-offs tied to their Lists); `invoiceState.ts` gives each invoice's kind, owing, state, age and search keys and the Unpaid, Part paid, Paid, Awaiting approval and All filters.
