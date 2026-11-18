# Phase B15: Closing audit, proof and truthful close

**Status:** PLANNED
**Requirements:** the seven programme outcomes and the disposition rule in [PLAN.md](../../PLAN.md)
("Purpose and outcome"); confirmation of every refuted finding A-1 to A-10 in
[FINDINGS.md](../../FINDINGS.md) "Appendix: refuted findings" (A-2 is adjudicated by B02, A-4 and
A-10 by B12, PROGRESS accepted decision 3; B15 confirms all ten); coverage of R-01 to R-164,
including the split deliveries PLAN.md records, and the five systemic issues in FINDINGS.md;
Buildbook Section 8, "Closing a programme" (`docs/BUILD-BOOK.md`).
**Owns:** the programme coverage audit; confirmation of the A-1 to A-10 verdicts at the audit
commit; the fresh independent closing review; integration proof (`verify:board` including the
agent-tool tests, the board Playwright suite, a kit export with its own check, the real catalogue
check); the documentation truth check; `docs/board-fixes/review/CLOSING-REVIEW.md`; consolidating
"Discovered for later"; the final board version and CHANGELOG entry; the B15 PROGRESS entry and the
programme's closing status, marked in `PLAN.md`, `index.html` and `PROGRESS.md` (PLAN.md B15
territory).
**Excludes:** any new fix or behaviour beyond a small confirmed regression found by this audit
(B15-REQ-17) or a text-only documentation correction (B15-REQ-25). Every other defect goes to
"Discovered for later" with an owner. Findings R-01 to R-164 stay owned by the phase PLAN.md names,
and A-2, A-4 and A-10 by their adjudicating phases; B15 verifies, it does not take them over.
`FINDINGS.md` is read-only; `PLAN.md` and `index.html` take closing-status edits only. Root
`CLAUDE.md`, `docs/prototype-build/catch-up/`, `aa-prototype/` and catalogue content are not B15
territory (B15-Q7).
**Depends on:** all (PLAN.md): B15 is last in the serial order B01, B02, B03, B04, B08, B05, B07,
B06, B09, B10, B11, B14, B15, after B12 and B13 have merged from their worktrees. Every phase B01 to
B14 recorded COMPLETE in PROGRESS.md with its findings' dispositions; B02's A-2 verdict and B12's
A-4 and A-10 verdicts recorded; B12's addition of every agent `*.test.mjs` to `verify:board`
(accepted decision 6); every deferred decision D-01 to D-10 answered and recorded under "Accepted
decisions"; each phase's own deferred questions (Bnn-Q*) resolved or carried with an owner.
**Unblocks:** programme close. The handoff is CLOSING-REVIEW.md plus the B15 PROGRESS entry, which
tell the user what is done, what was accepted, what is left and what they still owe.
**Binding constraints:** all of PLAN.md "Binding constraints" and PROGRESS.md conventions 1 to 14.
In particular: no requirement content changes (7); never push, stage by path at commit time only
(9); never take ports 5173, 5174, 5180 or 5181, nor a port a lane's `.lane.env` names (6); touch
rights for any small regression fix, named in the entry (11); doc lines changed listed under "Doc
facts" (12); every proof fails before its fix and passes after (13); worktree phases' versions taken
at merge (14). Agent messages are never user consent, so "Won't fix" needs the user's own recorded
acceptance.

## Objective and outcomes

The programme set out to fix 164 verified findings and five systemic causes. B15 establishes, with
evidence a stranger can re-run, whether it did. When B15 is delivered:

1. Every finding R-01 to R-164 has exactly one verified final disposition, and the evidence behind
   each disposition exists in the code, the tests or the ledger at a recorded commit.
2. The verdicts B02 reached on A-2 and B12 on A-4 and A-10 are confirmed to rest on reproducible
   evidence and to still hold, and every other refuted finding is shown to still rest on a true
   premise after the programme changed the code under it.
3. A fresh independent review, which includes a hunter for unmet promises and a regression lens over
   the five systemic issues, has examined the finished board, and each of its findings is verified
   and disposed of.
4. The board, its agent tools, its browser suite, its exported kit and the real catalogue are shown
   working together at the final commit.
5. The board's documentation tells the truth about the board as shipped.
6. CLOSING-REVIEW.md separates completed work, accepted deviations, exclusions, deferred follow-up
   and manual acceptance still owed, and gives a verdict per programme outcome.
7. The board carries a final version and CHANGELOG entry, and PROGRESS.md records the honest state.

## Sources and current-state evidence

- `docs/board-fixes/FINDINGS.md`: 164 findings (33 medium, 131 low), ranked summary table, five
  systemic issues, appendix A-1 to A-10. Two systemic "clears" lists name findings owned by a phase
  other than the one fixing that issue: R-54 (systemic issue 3, owned by B05) and R-149 (issue 2,
  owned by B14). The audit maps systemic issues by owning phase, not by theme.
- `docs/board-fixes/PLAN.md`: outcomes, owners, the split deliveries note under the phase table,
  territories (including deliverables that carry no R-number), shared-files order, D-01 to D-10, the
  proof rule ("failing-then-passing test ... otherwise a recorded manual check").
- `docs/board-fixes/PROGRESS.md`: conventions 1 to 14, decision register, accepted decisions 1 to 12,
  "Discovered for later" items taken into phase scope, phase entries (empty at planning).
- Split deliveries (PLAN.md, accepted decisions 4 and 7), each with one closing phase: R-01 (board
  and server half B02, lock-out UI B06; B06 closes); R-07 (board half B02, plan-tool half B12; B12
  closes); R-45 and R-111 (server halves B05; B06 closes); R-54 (ID rule and journal B05, history cut
  by B08's deletion bound; B05 closes); R-56 (wholly B05, including the store's `renameLane` and
  `deleteLane`); R-68 (allocation rule and the minimal Settings call-site edit, B02); R-119 (lane
  merge B11, extending B05's lane route under touch rights).
- Baseline: master at `d4341735`, board 1.12.3 (`requirements-board/package.json` and lock file).

Verified facts at `d4341735` that shape the proof (re-verify at execution; phases change them):

- `npm run verify:board` (root) runs `npm --prefix requirements-board run verify`, which is
  `tsc -b && vitest run && node scripts/check.ts`. Vitest includes only `tests/**/*.test.ts` and
  `src/**/*.test.ts` (`vite.config.ts`). The agent-tool tests (`agent/skills/run-build-phase/tools/
  phase-context.test.mjs`, `agent/skills/update-build-plan/tools/plan-docs.test.mjs`,
  `req-changes.test.mjs`) run under `node --test` and are not part of `verify:board` at this commit.
  B12 adds every `*.test.mjs` under `agent/` to `verify:board` by glob (accepted decision 6); until
  then a green `verify:board` does not prove agent-tool fixes (convention 6).
- `npm --prefix requirements-board run test:e2e` runs Playwright (`playwright.config.ts`): a
  `fixture` project on fixed port 5182 over a synthetic catalogue, and, with `BOARD_E2E_REAL=1`, a
  read-only `real` project on 5181 over this project's catalogue with its own `HISTORY_DIR`. Port
  5181 collides with the contract picker (R-157, B14 owns the fix).
- `npm --prefix requirements-board run kit:export -- --to "<folder>" [--dry-run]`
  (`scripts/export-kit.ts`) stages the kit in a temp folder, swaps each skill's "This repo" section
  for `starter/this-repo/<skill>.md`, writes START-HERE.html, runs the leak check against
  `starter/deny.txt` (fails with "nothing exported" on any match), warns when CHANGELOG.md has no
  entry for the version, and then replaces `<folder>/requirements-board/`. At this commit it copies
  the working tree (R-154) and can wipe a live board (R-05); D-09 decides the export source.
- `npm run check` (root) runs the catalogue check on the real catalogue.
- Context for confirming the owners' verdicts on A-2 and A-4 (B02 and B12 adjudicate them):
  - A-2 code: `scripts/recode-statuses.ts:142` writes every status file, then (line 145) rewrites the
    journal through `recodeJournal`, which maps both `from` and `to` of each status change through the
    map. With the board's watcher running, the watcher can journal "1 to 4" for a file the recode just
    wrote; the rewrite then makes it "4 to 4". `shared/history.ts` `collapse` drops an entry only when
    every change in it has equal `from` and `to`. Line 145 also skips the journal rewrite entirely when
    `REQUIREMENTS_DIR` is set, so a naive reproduction against a scratch catalogue would not exercise
    the mechanism. B02 owns this script, may have reshaped it under D-02, and adjudicates A-2.
  - A-4 code: `agent/skills/update-build-plan/tools/build-index.mjs` (about line 280) renders
    `laneRows` inside the `safeNow.length ? ... : 'No phase is marked safe to start ...'` branch of
    the "Start now" section, so lane rows and their copy-prompt buttons appear only when some phase
    is safe to start. B12 owns this file and adjudicates A-4 and A-10.
- Agent-tool compatibility: the live catch-up plan (`docs/prototype-build/catch-up/plan.config.json`,
  `LANES.md`) and lane worktrees consume the B12 tools through merges from master.

## Detailed requirements

### Coverage audit

**B15-REQ-01 Audit baseline.** The audit runs against one recorded commit on master (the audit
commit) and names the programme range `d4341735..<audit commit>`. Every programme commit is
attributed to a phase. Commits by other sessions in that range (catalogue updates, lane merges) are
identified and kept out of programme attribution. If B15 changes anything after the audit commit,
the integration proof (B15-REQ-18 to REQ-24) is rerun at the final commit.

**B15-REQ-02 Mechanical coverage.** A mechanical cross-check of the 164 IDs in FINDINGS.md against
PROGRESS.md shows: every ID has exactly one final disposition from the four allowed (Fixed, Not
reproducible at HEAD, Won't fix, Moved); no ID is missing, duplicated or given conflicting
dispositions; the recording phase is the PLAN.md owner or the target of a recorded move. For a
split delivery (R-01, R-07, R-45, R-54, R-56, R-68, R-111, R-119; see Sources) the final disposition
is recorded by the closing phase PLAN.md names, each producing phase's entry records the half it
delivered with its proof, and the finding counts as Fixed only when every half is delivered and
proven. The result (counts per disposition and per phase) is published in CLOSING-REVIEW.md.

**B15-REQ-03 Fixed means proven.** For every Fixed finding the ledger names the change and its proof:
a regression test, or a recorded manual check with the reason a test was not practical. Every proof
must fail on the code before the fix and pass after it (convention 13), and the phase entry records
that it did. B15 confirms each test exists at the audit commit, runs in a suite B15 runs (B15-REQ-18
to REQ-20) and passes. For every Medium finding, every security-theme finding (R-03, R-04, R-22,
R-34, R-35, R-36, R-63, R-102) and every systemic-issue-1 write-loss finding, B15 independently
re-establishes that the proof exercises the failure: it fails, or the manual check shows the
failure, without the fix. Low findings get the same independent check on a recorded sample (B15-Q3).
A proof that passes on the original code, or whose entry records no failing run, is a gap, not proof.

**B15-REQ-04 Not reproducible re-checked.** Each "Not reproducible at HEAD" disposition is re-checked
at the audit commit, not at the phase's own commit: the recorded evidence still holds, and later
phases did not reintroduce the failure.

**B15-REQ-05 Won't fix accepted by the user.** Each "Won't fix" has the user's acceptance recorded in
"Accepted decisions" with date and reason. A reviewer's or agent's recommendation is not acceptance.
A Won't fix without it is reported as an open item.

**B15-REQ-06 Moves resolve.** Every Moved chain ends in a final disposition or in "Discovered for
later" with a named owner. A move to an owner outside the programme counts as deferred follow-up in
the closing report, never as completed. A finding moved to B15 is handled per B15-Q2.

**B15-REQ-07 Systemic issues.** For each of the five systemic issues, the audit states whether the
root fix the programme chose is in place as one mechanism used by every consumer the finding named,
lists the findings it clears with their owners (including R-54 and R-149), and gives a verdict.

**B15-REQ-08 Phase records complete.** For each of B01 to B14 the audit confirms the PROGRESS entry
shows: COMPLETE; an implementation plan path; the three review lenses run with dispositions; every
local SPEC requirement (Bnn-REQ-*) accounted for as delivered, deviated (with reason) or moved;
touch-rights edits in other phases' files named (convention 11); doc lines changed listed under "Doc
facts" (convention 12); fail-first proof recorded (convention 13); the version bump and CHANGELOG
entry, taken at merge for B12 and B13 (convention 14); manual acceptance owed. PLAN deliverables
that carry no R-number are accounted for in the same way, among them: the issue surface and error
boundary (B03, D-06); the `catalogue:changed` event shape and the asset version and change signal
(B07, D-10); the client transport in `src/api.ts` (B05); the leave guard and artifact details form
(B06); `deleteLane` as one write (B05); layout saves landing in order (B07); the HistoryView
screenshot failure label (B10); agent-tool tests in `verify:board` (B12); index-lock contention in
lane worktrees investigated (B08). A missing review or an unaccounted requirement or deliverable is
a gap that the closing review must cover for that territory (B15-REQ-14) and that CLOSING-REVIEW.md
reports.

**B15-REQ-09 Decision register closed.** D-01 to D-10 each have an answer and a matching "Accepted
decisions" entry, and the code and docs agree with the answer. Every phase-level deferred question is
resolved or carried to "Discovered for later" with an owner. No register row stays "Open".

### Refuted findings

B02 adjudicates A-2, and B12 adjudicates A-4 and A-10, fixing them if confirmed (accepted decision
3). B15 confirms those verdicts and re-checks the premises of the other seven.

**B15-REQ-10 A-2 verdict confirmed.** B02's entry records a verdict (Confirmed or Refuted), the
reproduction behind it and, if confirmed, a disposition with fail-first proof. B15 confirms, at the
audit commit:
(a) the reproduction ran a recode while a journal-writing board watched the catalogue, used a
scratch catalogue and history folder, and actually exercised the journal path (see the
`REQUIREMENTS_DIR` guard noted above, or its successor after B02);
(b) it looked for each harm the finding names: status changes whose `from` equals `to`, journal
lines appended concurrently and lost, a recode left unrecorded, and whether any reader surfaces them
(the card timeline given `collapse`, the build plan's change check, CSV, the D-02 registry);
(c) the verdict still holds after the later phases that touched the journal and history (B08, B05,
B07, B09); a Fixed A-2's proof passes in a suite B15 runs.

**B15-REQ-11 A-4 and A-10 verdicts confirmed.** B12's entry records a verdict and evidence for each,
and, if confirmed, a disposition with fail-first proof. B15 confirms, at the audit commit (after
B12's merge to master):
(a) for A-4, the evidence covers a plan state in which no phase is safe to start while lanes exist
(for example every lane's current phase in progress), with the page generated to a scratch location,
never the live `docs/prototype-build/catch-up/index.html`, and lane rows and copy-prompt buttons
checked;
(b) for A-10, the evidence covers a recode under B02's D-02 rule between the plan's baseline and the
working tree, and the "re-plan first" flag behaves as B12 claims;
(c) both verdicts still hold at the audit commit.

**B15-REQ-12 Verdicts that do not hold.** A missing verdict means the owning phase is not complete
and keeps the programme open. A verdict whose evidence does not support it, or that no longer holds
at the audit commit, becomes a closing-review finding: fixed by B15 only if it is a small confirmed
regression (B15-REQ-17), otherwise recorded in "Discovered for later" with an owner in B02's or
B12's territory. Results go into PROGRESS.md and CLOSING-REVIEW.md; FINDINGS.md is not edited.

**B15-REQ-13 Other refutations still hold.** Each of A-1, A-3 and A-5 to A-9 rested on a premise
that a programme phase may have changed. B15 re-checks each premise at the audit commit and records
"still holds" or "no longer holds" with evidence; one that no longer holds becomes a closing-review
finding.

| ID | Premise to re-check | Phases that touched it |
|---|---|---|
| A-1 | ID reuse is deliberate; code, SCHEMA, README and tests agree with the D-05 answer, and R-54's disposition is consistent with it | B05, B14 |
| A-3 | `artifact:steps` port handling is covered by R-148's fix, in the script as well as the skill doc | B14 |
| A-5 | HistoryView's over-subscription is still harmless after the timeline changes | B09 |
| A-6 | Only point lists yield several spots, and none can carry a broken page, after the spot-parsing changes (R-75 to R-80) | B04 |
| A-7 | No PdfPage cleanup can race a pending page fetch after the pdf.js lifecycle change (R-13) | B10 |
| A-8 | The capture report's "every story" scope is still deliberate and documented after R-39 and R-134 | B14 |
| A-9 | Ignoring array-valued guidance (`guidance.lanes`) in the pack still causes no harm after R-19 and R-151 | B12 |

### Independent closing review

**B15-REQ-14 Fresh reviewers, separate lenses.** After the coverage audit, fresh reviewer subagents,
who have not authored or built any phase and are not given the audit's conclusions, review the
finished board against FINDINGS.md, PLAN.md, PROGRESS.md, the phase SPECs and the code itself (the
whole board, not only the programme diff). At minimum, as separate reviewers:
- **Unmet promises:** every outcome in PLAN.md, every SPEC acceptance item, every CHANGELOG claim
  from 1.12.3 on and every docs claim, checked against behaviour. Hunts for what was promised and is
  absent, partial or in the wrong place.
- **Systemic regression:** for each of the five systemic issues, searches the whole board for paths
  that bypass the root fix: a write that rebuilds a record or skips the disk check; a status read that
  ignores the registry or falls back to defaults; a git call outside the shared reader; a rule coded a
  second time; a tree walk without a cycle guard, a lookup without a default, a load that throws, a
  miss that falls through to the SPA.
- **Correctness:** bugs, edge cases, data loss, races and tests that do not prove their claim, across
  the programme diff.
The quality and conventions lens (genericity, no project vocabulary in generic code, DESIGN.md,
About page in step with skills), the origin-security lens (outcome 6) and the agent-tools-truth lens
(outcome 7, live-plan compatibility) are each covered, by a dedicated reviewer or explicitly assigned
to one above. Reviewers return ranked findings with evidence and a failure scenario and persist them
to files under `docs/board-fixes/review/`.

**B15-REQ-15 Outcome verdicts.** Each of the seven programme outcomes gets a verdict, Met, Met with
accepted deviations, or Not met, with the evidence and the findings, decisions and reviewer results
behind it.

**B15-REQ-16 Triage.** B15 deduplicates reviewer findings, verifies each against the code, and classes
it: regression (introduced by a programme phase), pre-existing defect not in FINDINGS, documentation
drift, or refuted (with evidence). Every finding gets a recorded disposition. Confident wording is not
evidence; nor is a passing suite a refutation.

**B15-REQ-17 Fix boundary.** B15 may fix a confirmed regression only when the fix is local to one
area, changes no accepted decision or shared interface (D-01 to D-10), needs no data migration, and
lands with a regression test that fails before the fix and passes after (convention 13). Edits in
another phase's files follow touch rights and are named in the B15 entry (convention 11). Everything
else, including every pre-existing defect, goes to
"Discovered for later" with reason and owner, and any outcome it breaks is reported as Not met or Met
with deviations. After any fix the full integration proof reruns.

### Integration proof

**B15-REQ-18** `npm run verify:board` passes from the repo root at the final commit.

**B15-REQ-19** The agent-tool tests run through `verify:board`'s glob over every `*.test.mjs` under
`requirements-board/agent/` (added by B12, accepted decision 6) and pass. B15 confirms that the glob
finds every agent test file, B13's included, that each B12 and B13 regression test is among them,
and that any other runner a phase added also ran and passed. If the glob is missing at the audit
commit, B12 is not complete.

**B15-REQ-20** The board Playwright suite passes: the fixture project and, with `BOARD_E2E_REAL=1`,
the read-only real-catalogue project, each on a port that is free and none of 5173, 5174, 5180, 5181
or a lane's `.lane.env` port, using the port mechanism B14 delivered. The real project writes only to
its own scratch history folder. A failure caused by catalogue content changed by another session is
distinguished from a board defect and recorded. Ports and results are recorded.

**B15-REQ-21 Kit export.** The kit is exported to a scratch folder outside this repo and outside any
git repository, never to this repo or a real adopting repo. The proof shows: the leak check passes
with zero `starter/deny.txt` matches; the export source follows D-09 (if it exports from a commit,
the final version is committed first); the kit's version, CHANGELOG entry and START-HERE version
agree; no untracked or ignored files and none of the export's skip-listed project files ship; each
skill's "This repo" block is the starter's; the kit installs its dependencies and its own catalogue
check passes (and `verify`, per B15-Q4); following ADOPTING.md in a scratch repo works at least
through installing the skills. Any step that cannot run (for example no network for install) is
recorded as manual acceptance owed, not as passed.

**B15-REQ-22 Real catalogue.** `npm run check` passes from the repo root. No programme commit changed
requirement content except migrations recorded in PROGRESS.md as shown to and accepted by the user
(for example the D-02 status registry); CLOSING-REVIEW.md lists each such migration.

**B15-REQ-23 Live agents.** The run-build-phase and update-build-plan tools run against the live
catch-up plan without error, in a mode that writes nothing in the repo or against a scratch copy, and
any tool change that needed a migration has the plan owner's recorded acceptance. The installed
skills in `.claude/skills/` and `.claude/workflows/` match `requirements-board/agent/` exactly (no
disowned, dangling or extra entries), checked by inspection.

**B15-REQ-24 Untouched territory.** No programme commit changed `aa-prototype/`,
`contract-picker-mock/`, `docs/prototype-build/catch-up/` or root `CLAUDE.md`, except changes the
user directed and the ledger records.

### Documentation truth pass

**B15-REQ-25 Docs match the board.** B15's pass is a truth check over B14's whole-file pass and the
"Doc facts" every phase listed (convention 12), using those lists as its starting point. Each of
these is checked against the code and corrected where untrue, by text-only edits that add no
behaviour: `requirements-board/README.md` (scripts against
`package.json`, Settings, skill list, folder map); `ADOPTING.md` (steps work against the exported
kit); the About page `src/views/AboutView.tsx` (install command and skill descriptions in step with
each SKILL.md); every `agent/skills/*/SKILL.md` and `agent/workflows/*` (commands, flags and described
tool behaviour match the tools) with its `starter/this-repo/` block; `requirements/SCHEMA.md`
(statuses per D-02, the ID rule per D-05, `cited_as`, spots, artifact rules as `shared/check.ts`
enforces them); `requirements/notes/README.md` and `changes/README.md`; `starter/` (START-HERE, starter
config agreeing with SCHEMA); `DESIGN.md` where visual rules changed; `CHANGELOG.md` (an entry per phase,
versions rising in merge order, B12 and B13 versions taken at merge per convention 14, claims true). Drift in root `CLAUDE.md` is reported to the user and changed only on
their direction (B15-Q7). A correction that needs behaviour to change is a finding, not a doc fix.

### Closing report, ledger and version

**B15-REQ-26 CLOSING-REVIEW.md.** Written at `docs/board-fixes/review/CLOSING-REVIEW.md`, it
contains: the audit and final commits and board version; the coverage table (B15-REQ-02) with links
to evidence; per-systemic-issue and per-outcome verdicts; the A-1 to A-10 table; reviewer lenses,
findings and dispositions; integration proof with commands, ports and results; and five separate
lists: **completed**, **accepted deviations** (with the decision that accepted each), **exclusions**,
**deferred follow-up** (with owners) and **manual acceptance owed** (who, what, how). It ends with
known limitations and the closing status.

**B15-REQ-27 Discovered for later consolidated.** Every "Discovered for later" item, from all phases
and from B15, has a reason and an owner; duplicates are merged; any item that is really a regression
or an unmet promise is reclassified and reported.

**B15-REQ-28 Final version.** The board version in `package.json` and its lock file is bumped once
more (convention 5: patch, unless a B15 regression fix is user-visible, then minor), above every phase's version,
with a CHANGELOG entry that closes the programme and names only what B15 changed. The bump comes
before the kit export so the kit carries it.

**B15-REQ-29 Honest close.** The programme is recorded COMPLETE only when B15-REQ-02 to REQ-25 hold
and every open item is a listed deferral or exclusion with an owner. Otherwise B15 stays IN PROGRESS
with each blocker named. Whether user-owned manual acceptance may remain at COMPLETE is B15-Q5.
B15 records the closing status in PROGRESS.md and marks it in `PLAN.md` and `index.html`, changing
nothing else in those two files.

## Dependencies and handoffs

- **Consumes:** PROGRESS.md entries, dispositions and "Doc facts" from B01 to B14; accepted answers
  to D-01 to D-10; each phase's SPEC and IMPLEMENTATION.md; B02's A-2 verdict and B12's A-4 and A-10
  verdicts; B12's agent-tool test glob in `verify:board`; B14's port mechanism, kit export guards
  (R-05, R-154, R-157, D-09) and whole-file docs pass; B12's tools in their final form.
- **Produces:** CLOSING-REVIEW.md; reviewer finding files under `docs/board-fixes/review/`; the B15
  phase entry, programme status and consolidated "Discovered for later" in PROGRESS.md; the closing
  status in PLAN.md and index.html; text-only doc corrections; any small regression fixes with tests;
  the final version and CHANGELOG entry.
- **Integration proof owner:** B15 for the whole programme (PLAN.md "Proof and integration").
- **Gate:** B15 does not start its audit while any B01 to B14 is not COMPLETE or B12 and B13 have not
  merged to master; a phase found incomplete is reported, not finished by B15.

## Acceptance and evidence

The programme may be called complete only when all of these are shown and recorded:

1. The mechanical coverage result: 164 of 164 findings with one verified disposition, zero gaps,
   duplicates or conflicts (B15-REQ-02 to REQ-06).
2. Fail-first evidence recorded by the phases for every Fixed finding (convention 13), and B15's
   independent failing-without-fix check for every Medium, security and write-loss finding and the
   Low sample (B15-REQ-03); split deliveries proven in every half.
3. B02's A-2 and B12's A-4 and A-10 verdicts confirmed at the audit commit; A-1, A-3 and A-5 to A-9
   premises re-checked (B15-REQ-10 to 13).
4. Reviewer reports from at least the unmet-promises, systemic-regression and correctness lenses, with
   every finding disposed of; verdicts for all five systemic issues and all seven outcomes.
5. Green output, at the final commit, of `npm run verify:board`, the agent-tool tests, the board
   Playwright fixture and real projects on recorded free ports, `npm run check`, and the kit export
   with zero leak matches and a passing check inside the exported kit.
6. The content-preservation and untouched-territory checks (B15-REQ-22, REQ-24).
7. The docs truth pass with each correction listed; the final version and CHANGELOG entry present
   and matching the lock file.
8. CLOSING-REVIEW.md with its five lists, and the B15 PROGRESS entry written last.

**What keeps the programme open:** a finding without a verified disposition; a Fixed finding whose
proof is missing, does not run or does not exercise the failure; a Won't fix without user acceptance;
a split delivery with an unproven half; an unaccounted PLAN deliverable; a Moved chain with no end;
an open decision; an A-2, A-4 or A-10 verdict missing from its owner's entry or unsupported at the
audit commit and not disposed of; any failing proof step in
item 5; an unfixed confirmed regression with no recorded deferral; an untrue doc left uncorrected and
unrecorded; an unrecorded catalogue content change.

**Prohibited regressions:** B15 must not change requirement content, change behaviour outside
B15-REQ-17, alter FINDINGS.md, edit PLAN.md or index.html beyond the closing status, write to the
live plan page or `.history/`, export into a
real repo, or take a reserved port.

## Deferred decisions for execution planning

See the shared register in [PROGRESS.md](../../PROGRESS.md). Open questions are owned by B15 and
resolved in its implementation-planning conversation with the user, before the step they gate. No
phase depends on them.

- **B15-Q1** Answered (accepted decision 10, 2026-11-18): A-2 is judged and fixed by B02, A-4 and
  A-10 by B12 (accepted decision 3); B15 confirms their verdicts and dispositions (B15-REQ-10 to 12).
- **B15-Q6** Answered (accepted decision 10, 2026-11-18): B15 marks the programme closed in
  `PLAN.md`, `index.html` and `PROGRESS.md`, with closing-status edits only (B15-REQ-29).

| ID | Question / gap | Owner | Affects | Resolve before | Boundary and acceptance impact |
|---|---|---|---|---|---|
| B15-Q2 | How B15 treats a finding or SPEC item an earlier phase moved to B15. B15 is not a fix phase; proposed default is to list it as deferred follow-up with a new owner unless it is a small confirmed regression or the user directs a small fix | B15 (user) | REQ-06 | coverage audit | Could add fix work to B15 |
| B15-Q3 | Convention 13 makes every phase record fail-first proof. Open: how many Low findings B15 independently re-checks: all, or a sample (for example at least one per phase plus every finding proved only by e2e or manual check) | B15 | REQ-03 | coverage audit | Sets how much of coverage B15 re-proves versus accepts from phase records |
| B15-Q4 | Kit acceptance depth: catalogue check only (PLAN.md minimum), or also `verify` and the fixture e2e inside the exported kit; and what to do when installing the kit's dependencies needs network that is unavailable | B15 (user) | REQ-21 | kit export | Changes what "kit runs" means in outcome 7 |
| B15-Q5 | May the programme be recorded COMPLETE while manual acceptance owed by the user remains (listed), or does it stay IN PROGRESS until the user signs it off? | B15 (user) | REQ-29 | the PROGRESS entry | Final status wording |
| B15-Q7 | Root `CLAUDE.md` describes the board (skills, kit, export rules). If it drifts from the shipped board, may B15 correct it with the user's approval, or only report it? | B15 (user) | REQ-25 | docs truth check | Repository instructions change only on the user's direction |

## Risks and recovery requirements

- **Master moves under the audit.** Other sessions and lane merges commit during B15. Pin the audit
  commit, attribute commits, and rerun the proof at the final commit (B15-REQ-01).
- **A destructive export.** If B14's guards regressed, an export at the wrong target wipes a board.
  Targets are scratch folders outside any repo only; refusal behaviour is taken from B14's tests,
  not by aiming the export at this repo.
- **Polluting real state in experiments.** Any re-check of the A-2 or A-4 verdicts and the real e2e
  project use scratch catalogues, history folders and output paths; nothing writes `.history/`, the real
  catalogue or the live plan page. Leave the working tree as found.
- **Port collisions with lanes and the user's board.** Choose free ports outside the reserved set and
  the lanes' `.lane.env` values; record them.
- **Confirmation bias.** Reviewers receive sources and code, not the audit's conclusions; the audit
  checks claims in PROGRESS.md against code and tests rather than trusting them.
- **Scope creep.** The audit will find pre-existing defects. Only small confirmed regressions are
  fixed; the rest go to "Discovered for later" with an owner.
- **Proof gaps hidden by green suites.** An agent test placed where B12's glob does not reach it never
  runs; a test can pass on the original code. B15-REQ-03 and REQ-19 close both gaps.
- **Version churn in worktrees.** The final bump changes the lock file that lane worktrees merge;
  keep `package.json` and the lock file in step in one commit, and check that B12's and B13's
  merge-time versions (convention 14) left no duplicate or out-of-order version.
- **Recovery.** B15 is restartable: each step (audit, verdict confirmation, review, proof, docs, report)
  records its state in IMPLEMENTATION.md and the B15 entry, so a fresh session resumes from the last
  verified step.

## Execution and handoff obligations

1. Read root `CLAUDE.md`, PROGRESS.md in full, FINDINGS.md, PLAN.md, this SPEC and every phase entry.
2. Confirm every B01 to B14 is COMPLETE, B12 and B13 are merged to master, and D-01 to D-10 are
   answered; stop and report otherwise.
3. Resolve the open questions B15-Q2 to Q5 and Q7 with the user where needed; record answers in
   PROGRESS.md.
4. Write `docs/board-fixes/phases/B15-closing-audit/IMPLEMENTATION.md` before auditing: audit
   commit, coverage method (split deliveries and PLAN deliverables included), Low sample (B15-Q3),
   how the owners' A-2, A-4 and A-10 verdicts are re-checked, reviewer lenses and briefs, ports, kit
   scratch location, order of version bump, commit and export.
5. Run the coverage audit and refutation re-checks, then launch the independent reviewers in parallel.
6. Verify every finding yourself; fix only within B15-REQ-17; correct docs within B15-REQ-25; rerun
   the full proof at the final commit.
7. Bump the version and add the CHANGELOG entry, commit B15's own files by path, export the kit (in
   the order D-09 requires), then write CLOSING-REVIEW.md with the final results and commit it (never
   push; tell the user what was committed and on which branch).
8. Update PROGRESS.md last: B15 entry, programme status, consolidated "Discovered for later" and
   decision answers. List every doc line B15 changed under "Doc facts" in the B15 entry (convention
   12), and every touch-rights edit (convention 11). Mark the closing status in PLAN.md and
   index.html. Record the honest status; do not mark the programme complete while required work
   remains.
