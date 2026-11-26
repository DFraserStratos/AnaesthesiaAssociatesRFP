Please run build plan Phase 71 (Sources and confirming unchanged Lists) of the Anaesthesia Associates (AA) prototype.

Load the run-build-phase skill and follow it for this phase (1 session, Lane F). The phase doc's Before you start, Reference, Work items, Demo triggers, Manual test checklist, Demo guide updates, Adversarial review (at the Wave 7 join) and PROGRESS.md updates sections hold the phase's reads, drift-check stops, rules and finish items; below is only what the doc does not already say.

Override: you run in an Intake build lane: follow docs/build-plan/LANES-INTAKE.md, which overrides this prompt, the run-build-phase skill and CLAUDE.md (quick checks only, no review, screen-proof or checklist run; commit on your lane branch by path; never push). Skip the catalogue screenshot recipes, the demo guide and the capture: the owner's sweep does them.

Hold to these above all:
- Start only when `68 complete:` is merged into your branch; build on the names 68 shipped (its `notes.md` and PROGRESS entry), edit none of 68's files, and note any change they need for the join.
- Confirm unchanged is one change set through 68's `intakeDecide.ts`, in the new `store/intakeBulk.ts`; it changes no List or Booking, is never automatic, and an identical re-arrival still waits for a person.
- Sources derive from 68's arrival records and stored source state, counted on the demo clock (never `Date.now()`); inbound only is stated, and nothing writes to a source; no retry or alerting.
- The raw view stays behind the restricted role, with a reason, masked and audited; import `RawRowSheet` unchanged and nothing else from `apps/admin/matching/`; keep `correctEthnicityCode` and every `integrationActions.ts` signature as they are.
- No new shared component or variant, no private copy of a shared one, no vendor name for the PDF reader in copy; no seed change and no `PERSIST_VERSION` bump.

Phase goal: the office sees each source's state in Intake's second view and confirms the Lists that match exactly together (US-02.1.7, US-02.1.6; DM-14, DM-21; D117, D118, D124, D125). The Sources view at /admin/intake/sources shows St George's, Southern Cross and the rooms' mailbox with whether each is receiving, when it last sent, today's messages and what each became, held messages with their reason and a restricted raw view, the hospitals not connected (Forte Health among them), and the line that AA only reads and never writes back. The matches-exactly bench lists an arrival's unchanged Lists and confirms them in one action that changes no List or Booking, never automatically; the held-message bench shows the message, its source, its reason and the raw view, and dismisses it with a reason. Layout: docs/explorations/intake-ideas.html #sources, #idea1 and #reco.
