Please run requirements catch-up Phase U7 (UI unification: close out) of the Anaesthesia Associates (AA) prototype.

Load the run-build-phase skill and follow it for this phase (one session, track: UI unification). The phase doc's Before you start, Reference, Work items, Demo triggers, Manual test checklist, Demo guide updates, Catalogue screenshots, Adversarial review (after build) and PROGRESS.md updates sections hold the phase's reads, drift-check stops, rules and finish items; below is only what the doc does not already say.

Override:
- This phase edits CLAUDE.md, the binding instructions file: the "One component per job" section is README section 8's approved text, word for word, placed after the design section; diff it against the README. Change nothing else in CLAUDE.md beyond the one-line catalogue and research fixes the doc names.

Also read: docs/ui-unification/README.md sections 1 and 4; docs/ui-unification/PLAN.md in full, section 5 (the plan.config.json rule) included; the PROGRESS.md entries of the catch-up phases PLAN.md section 3 names (what each migrated).

Hold to these above all:
- Write the guardrail test (aa-prototype/src/apps/oneComponentPerJob.test.ts) first and run it red; its failures join the worklist. Its allow-list only shrinks: a reason on every entry, a ceiling, a stale-entry check.
- No redesign: a visible change cites the README question that approved it or, for a U35 repeat, the README U35 "Canonical look"; anything else that moves against the start-of-U7 set is fixed. Default props keep today's look; no hook lost; never re-open the 27 answers (README section 6) or the intended differences (section 5).
- Delete every private copy you replace; never leave it beside the shared one. Keep catalogue row names stable wherever the component did not change (the shots are keyed by name) and record every rename in RESULTS.md.
- Leave the stays-custom surfaces (DayGrid, SlideStack, the invoice document, the phone frame) and the demo simulators unless Phases 41 or 43 already moved them (question 2). PERSIST_VERSION does not change; no seed or store change.

Phase goal: close the UI unification by migrating every stable call site the earlier phases skipped and the remaining U35 small repeats onto one shared component each (StickyDock, NoticeLine, PickRow, AddRowButton, TickGlyph, Disclosure, TotalsBlock, DayChip and one progress label source), regrouping the live catalogue by family with a "Shared component" column and its three tests in step, adding a source-scan guardrail test whose allow-list can only shrink, writing the approved "One component per job" section into CLAUDE.md word for word with the shared UI README and the plan's standing rules in step, confirming every one of the 27 answers is in the Decisions log, and recording the before and after counts and screenshots in docs/ui-unification/RESULTS.md, all with no redesign, no lost hook and no seed change, before Phase 44 takes the final screenshots.
