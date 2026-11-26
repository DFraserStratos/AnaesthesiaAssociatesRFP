Please run build plan Phase 72 (Needs NHI, the stub guard and Validators to Help) of the Anaesthesia Associates (AA) prototype.

Load the run-build-phase skill and follow it for this phase (1 to 2 sessions; Lane G, the checkpoint is after Work item 3). The phase doc's Before you start, Reference, Work items, Demo triggers, Manual test checklist, Demo guide updates, Adversarial review (at the Wave 7 join) and PROGRESS.md updates sections hold the phase's reads, drift-check stops, rules and finish items; below is only what the doc does not already say.

Override: you run in an Intake build lane: follow docs/build-plan/LANES-INTAKE.md, which overrides this prompt, the run-build-phase skill and CLAUDE.md (quick checks only, no review, screen-proof or checklist run; commit on your lane branch by path; never push). Skip the catalogue screenshot recipes, the demo guide and the capture: the owner's sweep does them.

Also read: the PROGRESS entry and the lanes-intake notes of 68, for the Needs NHI bench's props and the names the doc's Before you start 3 lists.

Hold to these above all:
- Start only when 68 is complete on `lane/d`; touch only Lane G's files and the doc's named additions: never `ReviewScreen`, `PatientRecord`, `registry.ts`, 68's feed, selectors or `Workbench.tsx`, and nothing under `apps/admin/matching/`.
- The stub guard is a lifecycle block, not a warning rule: one reason from one place (`STUB_ONLY_REASON`), read by the refusals, `authoriseBlockersFor`, `SubmitListSheet` and the stand-in; `authoriseList` must not prefix it with "needs a price"; a List with any non-cancelled Booking is never held up.
- One Add NHI path: the Hub lookup sheet (`AddNhiSheet`); the chase request goes to one address; Intake's count is once per waiting row and drops by one when the NHI is added (68's badge, unchanged).
- `SubmitListSheet`'s reason prop and `listProgress`'s stub count default to today's look; build from the shared kit, no private pill, card or cell, and keep every `waiting-nhi-*`, `list-stub-note` and `list-row-stub` hook accounted for.
- Never name a vendor for the PDF reader, and no dashes, "slot", "swap" or phase numbers in copy. No seed change, no `PERSIST_VERSION` bump; the PWA stand-ins keep working.

Phase goal: rows waiting for an NHI are worked from the Intake feed's Needs NHI filter in a docked bench (the patient as received, how close the List is, a chase card with one address and the request, and the one Add NHI path through the Hub lookup sheet, the row becoming a Booking in its stub's place), while a List holding only a stub reads "1 waiting at intake", never complete, and can be neither submitted nor authorised, with the reason shown in the submit sheet, the apps and the Review queue (US-11.1.5, US-11.1.4, US-02.6.3, US-02.6.4; DM-18; D117, D124, D125). WaitingNhiView folds into the bench, and the validators' explanation moves to Help.
