# Tools fail-first re-audit (B12, B13, B14)

Pre-phase code was extracted with git archive into `failfirst/b12-pre`, `b13-pre`, `b14-pre` (node_modules symlinked); proof tests taken as at each phase commit. B14 tests ran from the real worktree against the old code via EXPORT_KIT_UNDER_TEST, BOARD_UNDER_TEST and SKILL_INSTALL_UNDER_TEST (all scratch repos in tmp). B13's consistency test ran with CR_NO_PROTECTED=1 (its documented switch for pre-option scripts).

| Finding | Phase | Proof (file > name) | Pre-phase result | Genuine? | HEAD | Notes |
|---|---|---|---|---|---|---|
| R-14 | B12 | config.test.mjs > IN PROGRESS phase with session-1 entry is in progress, not built | built list had '27' extra (expected ['26','28']) | yes | pass | |
| R-15 | B12 | phase-check.test.mjs > --failed remembers a full-gate failure across a --changed run; pre-B12 last.json read | "nothing failed last run" (FAIL erased); lint result lost | yes | pass | |
| R-16 | B12 | regrade-ids.test.mjs > re-grade reads target commit and catches scope moves | got ['US-01.1.5'], expected FT-02.1, US-01.1.1, US-01.1.6, US-02.1.1 | yes | pass | same test also holds R-138 |
| R-17 | B12 | config.test.mjs > update view counts lane-built/checkpointed; own-branch view; unaccounted guard. apply-plan-update.test.mjs > two D-08 guards | lane view ['26'] vs expected ['26','33','34']; own-branch view differs; guards: TypeError (no `unaccounted` field) and run not stopped | yes (main lane test); guard tests are import-ish (new field/flag) | pass | |
| R-18 | B12 | apply-plan-update.test.mjs > fresh-plan remake reuses number with new slug | plan.json kept phase-29-availability-calendar.md, expected phase-29-ledger-core.md | yes | pass | update-run and renamed-slug guards pass old, as intended |
| R-19 | B12 | phase-context.test.mjs > track range expands over that track only (R-19) | [U3,U1,21,U2,25a] vs expected [U3,U1,U2] | yes | pass | |
| R-136 | B12 | phase-check.test.mjs > alias in needs schedules like canonical name | order [build,typecheck] vs [typecheck,build] | yes | pass | |
| A-4 | B12 | build-index.test.mjs > Start now lists each lane (A-4) | no "Copy Lane A prompt"; page says "No phase is marked safe" | yes | pass | |
| A-10 | B12 | build-index.test.mjs > answered before recode does not flag re-plan (A-10) | OQ-01 flagged although answered at baseline | yes | pass | |
| R-07 (plan half) | B12 | scope.test.mjs (4 tests) | pass on old (recorded guard, no tool change) | n/a guard | pass 4/4 | as recorded |
| R-08 | B13 | linkRuns.test.ts (5 tests); workflows.test.mjs > REQ-11 R-08 | linkRuns: suite cannot load, scripts/linkRuns.ts absent; workflow: epics.join TypeError (old arg shape) | import-only | pass | Stand-ins: (a) standin-r08.mjs drives the old workflow with its own arg shape: prompts write to `.links/EP-06.proposed.json`, HEAD writes `.links/current/...`. (b) old apply-links on a folder holding two batches' files applies both (2 batch files, 2 proposals), no run notion; HEAD names the run. Run archiving and pickLinkRun are not driven on old code (no such code; the behaviour is absent) |
| R-09 | B13 | consistency-review.test.mjs > REQ-03 decision binds to change seen; question fixup | decision read as '' (expected 'accept'); fixup Q-01 now Gamma not skipped | yes | pass | |
| R-20 | B13 | consistency-review.test.mjs > REQ-04 | questions list empty, expected 'Lonely' kept | yes | pass | |
| R-21 | B13 | consistency-review.test.mjs > REQ-05 | action field undefined on every change | yes | pass | field absent in old = defect |
| R-34 | B13 | consistency-review.test.mjs > REQ-01 | as written: EISDIR crash on the 'folder' case; with that case removed: "absolute: undefined", not refused (edit outside catalogue accepted) | yes (after dropping the folder case) | pass | folder-case crash alone is also a defect, but the absolute-path result is the clear proof |
| R-142 | B13 | consistency-review.test.mjs > REQ-07 (R-141, R-142) | note cite resolves to '2026-10-16-r-d-review', expected null | yes | pass | |
| R-05 | B14 | exportKit.test.ts > refuses repo root, `--to ..`, folder inside board, other live board, edited/journal/new-file earlier kit, missing marker | 12 of 17 fail: no Refused, exit 0 where 1 expected (export proceeds into live board) | yes | pass 17/17 | scratch repos only |
| R-31 | B14 | userPath.test.ts (6 fail on old); exportKit relative --to | export:csv --out not written under caller folder; artifact:new "notes/x.md does not exist"; links, check, relative --to fail | yes | pass | |
| R-130 | B14 | skillInstall.test.ts > keeps owning a link skill folder that gains a .DS_Store (R-130) | link mode: '.claude/skills/add-artifact (already ...' reported, ownership lost | yes (link mode) | pass | copy-mode R-130 test passes on old code (ledger says old fails link mode only) |

Counts at HEAD: B12 8 files 42 tests pass (config 5, regrade 2, build-index 2, apply-plan-update 5, plan-state 1, scope 4, phase-check 5, phase-context 18); B13 consistency 10, workflows 7, shared-rules 2, linkRuns+linkProposals 15; B14 45 of 45.

## Agent-test glob
`node --test "agent/**/*.test.mjs"` (Node globSync) and `find agent -name '*.test.mjs'` both give the same 13 files. Unmatched: none.

## Gaps
- R-08: no genuine fail-first on the core proof (linkRuns.test.ts is import-only on old code; the workflow test fails on an arg-shape error). Stand-ins show old behaviour (loose `.links/`, apply takes every file in the folder) but not the "removed link comes back" scenario directly.
- R-07 plan half: guard only (passes old), as recorded.
- R-17: the two apply-plan-update D-08 guard tests and the "unaccounted" config guard fail on old only by missing field/flag (import-ish); the lane-view test is the genuine one.
- R-130: only the link-mode half fails on old; copy-mode passes old.
- R-34 test as written fails old on an EISDIR crash first; genuine refusal failure shown only with the folder case removed (copy made in scratch, original untouched).
- Worktree: other uncommitted changes (CHANGELOG.md, README.md, package.json, package-lock.json, e2e, starter/START-HERE.html, CLOSING-CORRECTNESS.md) appeared in git status during the audit; none were written by this audit (writes only under failfirst/).
