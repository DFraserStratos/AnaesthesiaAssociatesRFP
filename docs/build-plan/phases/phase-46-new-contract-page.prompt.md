Please run build plan Phase 46 (The New contract page) of the Anaesthesia Associates (AA) prototype.

This phase runs in Lane A of the build lanes (docs/build-plan/LANES.md). If this session is not the Lane A session inside its worktree (branch lane/a), stop and tell me to paste docs/build-plan/lanes/lane-a.prompt.md instead.

Load the run-build-phase skill and follow it for this phase (1 session). The phase doc's Before you start, Reference, Work items, Demo triggers, Manual test checklist, Demo guide updates, Adversarial review (after build) and PROGRESS.md updates sections hold the phase's reads, drift-check stops, rules and finish items; below is only what the doc does not already say.

Override: commit when green (stage by path; never push). Skip the catalogue screenshot recipes, the demo guide and the capture: the owner's sweep does them.

Hold to these above all:
- One rule source: the save guard (`contractRefusal`, through `createContract`) and `billsPayerOnly`, `takesLinks`, `isRvgKind`, `CHOOSABLE_PRICING_KINDS`; the page retypes none of them, and Create is never disabled ahead of the guard.
- "Where it will show" reads only `destinationOf` and `destinationHint` (D91), and "Already held" is a hint from one pure, tested helper in `domain/billing`, never a block.
- The page is not a SidePanel: `AdminPage` fluid with the 412px rail, built from the shared fields, `RadioCard` and a `Card` variant with its catalogue row; the Contract route uses the id, never the AA code.
- Delete `ContractEditSheet` whole, with its Replaces picker and catalogue rows, but keep `stillOnContract`, `proceduresStillOnContract` and `ContractChangeNotice`; the D23 caption keeps one home and one `MUST_KEEP` pin, moved to the page.
- No seed change and no `PERSIST_VERSION` bump: the Abdominoplasty example is created in the test, not seeded.

Phase goal: a new Contract is entered on its own page, `/admin/contracts/new` (with `?holder=` prefilled), in the order its rules depend on: holder and who it bills, then pricing, then where it is offered, then name and codes. A rail shows where the Contract will appear on the step rail, live, and the holder's similarly named Contracts as a hint. Create runs the existing guard and lands on the new Contract's page from Phase 45. The old side-panel editor, its warning-only Replaces picker and their catalogue rows are deleted, and the tests and specs that read them move to the page.
