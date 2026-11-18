# Phase B12: Build-plan tools match their skills, see lane-built work, and stay generic

**Status:** PLANNED

**Requirements:** R-07 (plan-tool half; B12 closes R-07), R-14, R-15, R-16, R-17, R-18, R-19,
R-135, R-136, R-137, R-138, R-139, R-150, R-151, R-164 ([FINDINGS.md](../../FINDINGS.md), "Findings
in detail", each under `#### R-nn`; theme "Build-plan and phase-runner tools"). Adjudicate and fix if
confirmed: A-4 and A-10 (FINDINGS "Appendix: refuted findings"; PROGRESS accepted decision 3).
Adjacent: A-9. Deferred decision D-08 ([PLAN.md](../../PLAN.md) "Deferred decisions";
[PROGRESS.md](../../PROGRESS.md) register).

**Owns:** the behaviour of `requirements-board/agent/skills/run-build-phase/` (`SKILL.md`,
`tools/phase-check.mjs`, `tools/phase-context.mjs` and its test) and
`requirements-board/agent/skills/update-build-plan/` (`SKILL.md`, every file in `tools/`, including
the shared modules `config.mjs`, `req-changes.mjs`, `scope.mjs`, `plan-docs.mjs` that both skills
import, and `build-index.mjs`). Also (PLAN B12 territory; accepted decisions 5 and 6): the agent-tool
test suites in `verify:board` (the board `package.json` `verify` script), the R-139 fix in
`requirements-board/scripts/capture.ts`, and the `starter/deny.txt` terms and
`starter/this-repo/run-build-phase.md` (and `update-build-plan.md`) placeholders that R-150 and R-151
need. Acceptance for the 15 owned findings (closing R-07 with B02's proof of the board half), the
A-4 and A-10 verdicts, and the resolution of D-08 with the plan's owner.

**Excludes:**
- The catch-up plan's own documents in `docs/prototype-build/catch-up/` (`plan.config.json`,
  `status.json`, `LANES.md`, `ROADMAP.md`, phase docs, lane prompts): read-only for B12. Keys for the
  live `plan.config.json` are proposed to the plan's owner, not written by B12 (PLAN B12 territory).
- The rest of `starter/`, `ADOPTING.md`, `README.md` (whole-file pass), the About page's install text,
  and R-39/R-134 in `capture.ts`: B14. B14 verifies B12's `starter/` changes rather than redoing them.
- R-07's board half (the shared status rule in `shared/statuses.ts`, the recode script, the diff and
  history route) and the D-02 decision: B02. B12 applies B02's accepted rule in the plan tools.
- How agent `.mjs` tools share `shared/*.ts` rules (D-03): B04. B12 inherits the answer if it needs
  shared code.
- Consistency-review and linking tools: B13. B15 only confirms B12's A-4 and A-10 verdicts at the
  audit commit.

**Depends on:** B02 (status rule, D-02). D-03 settled in a B04 planning conversation before B12
builds, only if B12 needs to share `shared/statuses.ts` (not needed if D-02 picks the no-overlap rule;
accepted decision 8). D-08 resolved with the plan's owner before B12 builds. Runs in its own worktree,
in parallel with the serial app order B01, B02, B03, B04, B08, B05, B07, B06, B09, B10, B11, B14, B15,
after B02 and before B14 (PLAN "Build order"; convention 10).

**Unblocks:** B14 (kit docs follow B12's final skill text and config keys; B14 verifies B12's deny
terms and starter placeholders); the catch-up lanes (D-08); B15 (confirms B12's dispositions and the
A-4/A-10 verdicts).

**Binding constraints:**
- **Live-plan compatibility** (PLAN "Live agents"; PROGRESS convention 8). Build lanes in other
  worktrees (`-laneA`, `-laneB`, `-U2`, `-U3`) use these tools now and take them from `master` when
  they merge it at a phase start (`LANES.md`, "How a lane session runs", step 2). Every change keeps
  the in-flight catch-up plan, its `plan.config.json`, its phase docs and its lane rules working
  unchanged, or ships with a migration the plan's owner accepts.
- **Project-generic kit code** (root `CLAUDE.md`; PLAN binding constraints). Tool code and each
  skill's body carry no project vocabulary; project facts live only in the plan's `plan.config.json`,
  `requirements/board.config.json` and each skill's "This repo" block. The kit export swaps "This
  repo" blocks for `starter/this-repo/*.md` and fails on terms in `starter/deny.txt`.
- **Existing stack:** plain Node ES modules, dependency-free (`phase-check.mjs` says so), Node >=
  22.18; tool tests use `node --test`. No new dependency without a recorded reason.
- **The two skills share modules.** `run-build-phase/tools/` imports `config.mjs`, `req-changes.mjs`,
  `plan-docs.mjs` and `scope.mjs` from `update-build-plan/tools/`; a change to one keeps both skills
  working (update-build-plan `SKILL.md`, "The tools and the plan's config").
- **PROGRESS conventions 1 to 14** apply, in particular 2 (dispositions), 5 and 14 (version bump taken
  at merge time: master's version plus B12's minor bump, CHANGELOG entry on top, lock file
  regenerated with `npm install`), 6 (finish green), 8 (live-plan compatibility), 11 (touch rights),
  12 (doc lines), 13 (proof fails first).
- **Finish green:** `npm run verify:board` from the repo root, which after B12 also runs every
  `*.test.mjs` under `requirements-board/agent/`.
- **Git and lanes:** B12 runs in its own worktree and branch, merged into `master`; commit and merge,
  never push; stage by path at commit time only (convention 9). B12
  never writes to lane branches, lane worktrees or `$(git rev-parse --git-common-dir)/lanes/`, and
  never takes lane ports (5273/5274/5280, 5373/5374/5380) or 5173/5174/5180/5181.

## Objective and outcomes

The two build-plan skills are how the catch-up plan is updated and how each phase is run. The review
found that their tools disagree with their own documentation in ways that freeze or drop work, mislead
a resumed phase, and loop forever on a bad config, and that the "generic" kit still carries this
project's words. When B12 is delivered:

1. **Built means built.** A phase with an `IN PROGRESS` row is partly built everywhere (plan-state,
   briefs, recipe checks, baselines), never also "built". (R-14)
2. **Plan updates on master never undo lane work.** A phase that a lane has checkpointed or completed
   is neither rewritten as unbuilt nor re-baselined by an update run on `master`. (R-17, D-08)
3. **Re-grade picks every item whose meaning or scope changed at the target commit**, including a
   pure lane move across an out-of-scope lane, and reads that commit, not today's files. It does so
   in bounded time. (R-16, R-138, R-164)
4. **A remade plan points at the docs it wrote.** (R-18)
5. **The context pack tells a phase the truth**: the right run order, a diff command with the pack's
   own baseline, and no project words baked into its parsing. (R-19, R-135, R-151)
6. **The phase gate cannot be fooled or hung**: `--failed` always remembers the last full gate's
   failures, aliases schedule correctly, and a dependency cycle is a config error. (R-15, R-136,
   R-137)
7. **The skill's own close-out leaves a true capture report committed**, and its body names no
   project conventions outside "This repo", with the kit's leak check guarding them. (R-139, R-150)
8. **The plan tools read stored statuses by B02's rule**, so a renumber never makes them treat a
   Confirmed item as retired; the plan page's "re-plan first" flag and its lane rows are right.
   (R-07 plan-tool half, A-10, A-4)
9. **The agent tools' tests are part of `verify:board`**, so no later phase breaks them while green.
   (accepted decision 6)

Every owned finding ends with a recorded disposition (PROGRESS convention 2).

## Sources and current-state evidence

Verified at HEAD `d4341735` (board 1.12.3) on 2026-11-18. Line numbers are current; "holds" means the
mechanism in FINDINGS is present as described.

| Finding | Current location | State at HEAD |
|---|---|---|
| R-14 | `update-build-plan/tools/config.mjs:155-185` (`built` :178, `builtByEntry` :180) | Holds. Scratch progress file (row 27 `IN PROGRESS` plus its `### Catch-up Phase 27` entry) gives `built=['26','27']`, `builtByEntry=['26','27']`, `inProgress=['27']`. Consumers: `plan-state.mjs:39` (`builtPhases`), `recipe-status.mjs:78`, `phase-context.mjs:561, :766-769`. |
| R-15 | `run-build-phase/tools/phase-check.mjs:395` (always writes `last.json`), `:293-301` (`--failed` treats `OMIT` as passed; stored `changed` never read) | Holds. |
| R-16 | `update-build-plan/tools/req-changes.mjs:83` (`COSMETIC_FIELDS` has `swimlane`); `regrade-ids.mjs:40-43` | Holds. The live plan sets `outOfScopeLanes: ["Future Work"]`. |
| R-17 | `update-build-plan/SKILL.md:310-312`; `config.mjs` `phaseStatus` reads only the working tree's progress file | Holds, live. On `master`, `phaseStatus` reports 26, 27, 32d and 33 as not built; `git show lane/a:docs/prototype-build/PROGRESS.md` has `DONE` rows for all four; `lane/a` holds `26 complete:`, `27 checkpoint:`/`27 complete:`, `32d …`, `33 …` commits; the lanes' `A.status` reads `27a started`. `apply-plan-update.mjs:28-31` keeps baselines from the same master-only source. |
| R-18 | `update-build-plan/tools/apply-plan-update.mjs:45-50` (`file = o?.file \|\| …` at :49) | Holds. The fresh-plan workflow labels its outline `architect` (`workflow-dev-plan.js:131`); an update labels it `architect:update` (`workflow-plan-outline.js:125`). |
| R-19 | `run-build-phase/tools/phase-context.mjs:369-372` | Holds, live. On the real ROADMAP, the "Sequencing rules" run order parses to a step `['U6','25a']`, so 26's "phase before" is 25a; the "Tracks" statement reads "18 November" as phase 18 (step `['18','25a','17b','32d']`). |
| R-135 | `run-build-phase/SKILL.md:173`; `plan-state.mjs:54-58` (range from `plan.commit` only, :56); `phase-context.mjs:593-601` | Holds. The pack itself labels the command "against plan.json's baseline" (:601). Phase docs carry many `plan-state.mjs --diff <IDs>` lines that `diffIds` (:432-436) parses. |
| R-136 | `phase-check.mjs:114-119`, `:310-316`, `:345`, `:357-358` | Holds by reading: `inRun` holds canonical names, so an alias in `needs`/`after` counts as "not in run" and met. The live config uses no alias in `needs`/`after`. |
| R-137 | `phase-check.mjs:119`, `:310-322`, `:362-386` | Holds by reading: no acyclicity check; `waves()` recurses without a guard; `pump()` re-queues itself with `setImmediate` while every check waits. |
| R-138 | `update-build-plan/tools/regrade-ids.mjs:30-38`, `:49` | Holds. Fields, story list, recodes and statuses come from the working tree, and question `affects` from the working tree, whatever `<to-ref>` is. |
| R-139 | `run-build-phase/SKILL.md:268`; `requirements-board/scripts/capture.ts:159-163` (`fullRun = !only` at :163), `:646-649` | Holds; capture lines moved by about one. B12 owns this fix in `capture.ts` (PLAN shared-files row: B12 then B14). |
| R-150 | `run-build-phase/SKILL.md:114, 151, 170, 185, 197, 222, 256-257, 283` | Holds: `master-demo-guide.html`, the demo clock, `PERSIST_VERSION` (four places), "the RFP rule", the Control Panel, all outside "This repo". None of these terms is in `starter/deny.txt`. "Decisions log" is also used as if generic (:222, :240, :263, :296). |
| R-151 | `phase-context.mjs:66` (`PERSIST_VERSION`, `BK0` in `BAD_BEFORE`), `:68` (`Lists`, `Bookings`, `Procedures`, `Contracts`, `patients`, `invoices` in `COUNT_AFTER`), `:798` (`'Decisions log'`), `:807` (`'Discovered for later'`) | Holds. `:744` is not a defect: progress sections already come from `runner.context.progressSections` (default `['Binding conventions']`). The test file asserts `'PERSIST_VERSION 26 to 27'` is not a mention (`phase-context.test.mjs:40`). The live progress file's headings are `## Decisions log` and `## Discovered for later — handoff list`. |
| R-07 (plan-tool half) | `update-build-plan/tools/scope.mjs:40-48` (`normaliseStatus` follows every recode in turn, whatever the version's date); callers `req-changes.mjs:99, :183-188`, `assemble-gaps.mjs:42-53`, `build-args.mjs:13-29`, `regrade-ids.mjs:38`, `recipe-status.mjs:52`, `phase-context.mjs:475, :517, :534-536, :615` | Holds by mechanism. The live `status-recodes.json` holds one names-to-codes entry (2026-10-20), which is safe; an overlapping numeric renumber would re-map values saved after it. |
| R-164 | `req-changes.mjs:105-112` (`sidesOf`: two `git show`), `:176-189` (`changedInSubstance`: recodes re-read per entry) | Holds. Callers: `regrade-ids.mjs:40`, `phase-briefs.mjs:57-58`, `phase-context.mjs:607, :726`. |

Other verified facts:
- The tools' `node --test` suites (`req-changes.test.mjs`, `plan-docs.test.mjs`,
  `phase-context.test.mjs`: 27 tests, all passing at HEAD) are **not** run by `npm run verify:board`
  (Vitest includes only `tests/**/*.test.ts` and `src/**/*.test.ts`). `phase-check.mjs` and
  `build-index.mjs` have no tests. No other `*.test.mjs` exists under `agent/` today.
- An existing test fixes today's legacy rule that an entry with no status row counts as built
  (`req-changes.test.mjs:140-142`: `### Catch-up Phase 16` alone gives `built` and `builtByEntry`
  `['16']`).
- Lane facts the tools could read (all from `LANES.md` and git, none machine-declared in
  `plan.config.json`): lane branches `lane/a`, `lane/b`; commit subjects `<id> checkpoint:` and
  `<id> complete:`; each lane branch's own `PROGRESS.md`; one-line status files and `notes.md` in
  `$(git rev-parse --git-common-dir)/lanes/`; `status.json` `guidance.lanes` entries (`name`,
  free-text `where` naming the branch, `queue`, `prompt_file`), rendered by `build-index.mjs`.
- `LANES.md` step 4 has a lane check its dependencies against **its own branch's** `PROGRESS.md`.
- **A-4** holds by reading `build-index.mjs:278-280`: `laneRows` sits inside the truthy branch of
  `safeNow.length`, so "Start now" drops the lane rows and their prompt buttons when no phase is
  marked safe (queued phase cards still copy the lane prompt, :201-205).
- **A-10** holds by mechanism at `build-index.mjs:141-160`: `qThen` reads a blocking question's
  status at `plan.commit` and `qNow` today's, both raw, and compares each with the answered codes
  without `normaliseStatus`. A question already answered before a names-to-codes recode (stored
  `Answered` then, `4` now) reads as "answered since the baseline" and flags its phase "re-plan
  first". It does not bite the live plan today because its baseline is after the 2026-10-20 recode,
  which is why the verifier refuted the harm as described.
- A-9's array skip is `phase-context.mjs:407-409`; the verifier found no harm, and B12 leaves it
  unless D-08 makes lanes part of the pack.

Assumption, not verified: the U2 and U3 worktrees run older phases on their own branches and pick up
tool changes the same way as the lanes.

## Detailed requirements

### B12-REQ-01 · An in-progress phase is partly built, never built (R-14)

- A phase whose progress-file row says `IN PROGRESS` (or that `status.json` lists in `in_progress`
  when there is no progress file) is reported as in progress and **not** as built by every phase-status
  reader: plan-state's `builtPhases`, the built-by-entry set that `recipe-status.mjs` uses, and the
  context pack's notion of built dependencies and the next unbuilt phase.
- Such a phase therefore gets a brief, is listed under `partlyBuilt` rather than frozen, keeps its own
  drift baseline, and is checked by `recipe-status.mjs --check` like any unbuilt phase.
- Preserved: a `DONE` row is built; an entry with no row at all still counts as built (the legacy rule
  in `req-changes.test.mjs`); `keepBaseline` still holds DONE and IN PROGRESS phases; the pack still
  shows an IN PROGRESS phase's own entry and resume note.
- update-build-plan `SKILL.md` (the `progress` row of the config table and Stage 2b) states the rule.

### B12-REQ-02 · Plan updates on master never treat lane-built work as unbuilt (R-17; D-08)

Unconditional outcome, whichever D-08 option is chosen:
- An update-build-plan run on `master` while lanes run never rewrites, as unbuilt, the doc of a phase
  that a lane has checkpointed or completed, and never moves that doc's drift baseline. Such a phase
  is treated as built (complete on a lane) or partly built (checkpointed on a lane), or the run stops
  and names it.
- The plan tools never silently proceed past lane evidence they can see. If lanes are declared (for
  example `guidance.lanes`) and the chosen mechanism cannot account for a lane, the run says so.
- Lane identity (branch names, progress path, commit-subject patterns, status-file location) comes
  from plan data or configuration, never from literals in tool code.
- Preserved: inside a lane worktree, the context pack's dependency status still reflects that lane's
  own branch only (`LANES.md` step 4 relies on it). `build-index.mjs` keeps rendering
  `guidance.lanes` as 1.12.3 does, apart from the A-4 fix (B12-REQ-15), unless the owner accepts a change.
- The update-build-plan `SKILL.md` text at Stage 3 step 1 (currently :310-312) and Stage 0 describe the
  chosen behaviour.

The mechanism is D-08 (below). This requirement is blocked on it.

### B12-REQ-03 · Re-grade selection reads the target commit and catches scope moves (R-16, R-138)

- `regrade-ids.mjs <to-ref>` computes everything it reports for the target from `<to-ref>`: the story
  list, each item's parent, status and lane, the recodes and status roles, and each changed
  question's `affects`. Uncommitted working-tree edits do not change its answer for a committed ref.
  (When the target is the working tree, which the tools allow elsewhere, it reads the working tree.)
- An item whose out-of-scope verdict differs between the baseline and the target is never treated as
  cosmetic. If it is in scope at the target it is re-graded; if it left scope it is reported as
  dropped (so the orchestrator can set `runReverse`). This covers a story dragged out of or into an
  out-of-scope lane with no other edit, and a feature whose scope flips because its stories moved.
- An item retired after the baseline is out of scope at the target and does not escape the report.
- The output keeps its keys (`baseline`, `to`, `counts`, `ids`, `cosmeticOnly`) and `--ids-only`; any
  new information is added, not renamed.
- update-build-plan `SKILL.md` Stage 0 step 3 stops saying a `swimlane:` change is always ignored.
- Preserved: a pure recode or relabel is still no change; a lane move between two in-scope lanes is
  still cosmetic.

### B12-REQ-04 · Change detection costs bounded git work (R-164)

- One run of the change-detection path reads the recode list once (per side if the chosen recode model
  needs both), not once per entry.
- Reading the two sides of N changed entries does not cost a separate process per side per entry: the
  number of git processes grows sub-linearly with N (for example, batched).
- The callers (`regrade-ids.mjs`, `phase-briefs.mjs`, `phase-context.mjs`) get identical substance
  verdicts and diffs to today for the same inputs.
- The recode reading uses B02's accepted rule as applied by B12-REQ-14, not today's chain.

### B12-REQ-05 · A remade plan points at the docs it wrote (R-18)

- On a fresh-plan remake, a phase number that the new plan reuses with a different slug records the
  new doc path in `plan.json`, not the old plan's path.
- When an old doc for that number is left in `phases/`, the apply step reports it (both paths) rather
  than leaving every tool reading an abandoned doc in silence. Whether it is left, moved or removed is
  B12-Q6; nothing is deleted without that answer.
- Preserved: on an update run, an existing phase keeps its existing doc path; `--built`, the output
  JSON keys and the missing-doc warning are unchanged.

### B12-REQ-06 · The pack's run order is the ROADMAP's run order (R-19)

- A range whose ends are both track phases (`U1 to U6`) expands over track phases only; a range whose
  ends are both numbered expands over numbered phases only (today's rule).
- A day and month ("18 November", "18 Nov") is not read as a phase id in a run-order statement.
- On the live ROADMAP, the "Sequencing rules" statement places U6 alone in its step and 25a after 27a;
  the pack for 26 names U6 as the phase before it.
- Preserved: every case in `phase-context.test.mjs` "the run order" test; track-name expansion;
  `runOrder` config shape.

### B12-REQ-07 · The drift recovery command uses the pack's own baseline (R-135)

- `plan-state.mjs --diff` can diff from a stated baseline as well as from `plan.json`'s commit.
- The context pack prints, for a trimmed diff, a command whose range is exactly the pack's baseline,
  so running it shows the same change the pack trimmed.
- run-build-phase `SKILL.md` Stage 2 step 1 tells the runner to use that command.
- Preserved: `plan-state.mjs --diff <IDs>` with no new flag behaves exactly as today (phase docs carry
  dozens of such lines); `diffIds` still finds the IDs on existing and new forms of the line; `--to`,
  `--coverage` and the JSON output keys are unchanged.

### B12-REQ-08 · `--failed` always remembers the last full gate (R-15)

- After a full gate (`phase-check` with no mode flag) records failures or skips, a later partial run
  (`--changed`, `--only`, or a capture mode) never makes `--failed` report "nothing failed" while a
  check that failed in its full form has not since passed in its full form.
- A check's result in its `--changed` form, or an `OMIT`, never clears its full-form failure.
- A check re-run in full form (by `--only` or `--failed`) and passing does clear it.
- `--failed` with no failure on record still prints its "nothing failed" line and exits 0.
- A results file written by the pre-B12 tool (a lane mid-phase picks the new tool up at a merge) is
  read without error; a results file written by the new tool does not break a pre-B12 tool (rollback).
- run-build-phase `SKILL.md` (tools table, Stage 3 step 5) and the tool's `--help` describe what
  `--failed` re-runs.

### B12-REQ-09 · The check graph is canonical and acyclic (R-136, R-137)

- An alias named in a check's `needs` or `after` schedules exactly as the canonical name does: the
  dependent check waits for it, and `needs` skips on its failure.
- A dependency cycle in `runner.checks` is a config error found at load: every mode (`--list`, a run,
  `--only`, `--failed`, `--changed`) exits 2 with a message naming the checks in the cycle, before
  taking the lock or starting anything.
- No run can wait forever: if no check can start and none is running, the waiting checks end as SKIP
  with a reason, the summary is RED, and the lock is released.
- Preserved: the live `runner.checks` schedule (`--list` output unchanged apart from any wording the
  fix needs), exit codes 0/1/2, unknown-name validation, the lock and stale-lock takeover.

### B12-REQ-10 · The close-out leaves a true capture report (R-139)

- When a run-build-phase close-out ends, the committed capture report shows no recipe as failed that
  the session fixed: either a full capture of the final state rewrote it, or a capture limited to some
  IDs (`--only`) updated those IDs' rows. Saying in the notes that the report is stale does not meet
  this requirement (accepted decision 12).
- The fix may be in the skill's close-out text, in `phase-check.mjs --capture`, in
  `scripts/capture.ts` (B12 owns the R-139 change there; PLAN shared-files row B12 then B14), or a
  combination. A `--only` run that updates rows changes only those IDs' rows and leaves the report's
  other rows and totals consistent.
- On a lane, the session skips the final full capture (`LANES.md` override) and the join's capture
  must leave the report true; any change here keeps that path working.
- Preserved: `--capture <IDs>` (dry run then capture) and `--capture all` (no dry pass) as today;
  report before/after lines; lanes still skip the final full capture and leave it to the join
  (`LANES.md` overrides).

### B12-REQ-11 · run-build-phase's body is generic (R-150)

- No project convention appears in run-build-phase `SKILL.md` outside "This repo": no
  `PERSIST_VERSION`, demo clock, "RFP rule", `master-demo-guide.html`, Control Panel or similar. The
  body refers to roles ("the app's persisted-state version, if 'This repo' names one", "the demo guide
  'This repo' names", "a source rule or a recorded ruling that made the difference on purpose") and
  "This repo" carries the project's facts, so this repo's runner behaves as it does today.
- "Decisions log" in the body is either named by "This repo" or worded as the progress file's decision
  section, consistent with B12-REQ-12.
- Stage names and numbers, and the step references `LANES.md` and lane prompts rely on (Stage 0 resume
  path, Stage 5's final `--capture all`, Stage 7 plan-page edits, `--stop-servers`), are unchanged.
- B12 adds the removed project terms to `starter/deny.txt` (FINDINGS R-150 fix; accepted decision 5),
  and adds placeholder lines to `starter/this-repo/run-build-phase.md` (and `update-build-plan.md` if
  its "This repo" block gains a line) for every new "This repo" line, so an adopter's runner is told
  what to fill in. No kit-bound file outside a "This repo" block still contains a denied term, so the
  export's leak check passes. B14 verifies these, it does not redo them.

### B12-REQ-12 · The context pack's parsing carries no project vocabulary (R-151)

- The generic code of `phase-context.mjs` holds only generic count nouns and "not a phase" contexts.
  Project nouns (Bookings, Procedures, Contracts, patients, invoices, Lists), the
  `PERSIST_VERSION`/`BK0` contexts, and the progress-file section names for the decisions log and the
  handoff list come from `runner.context` configuration.
- With no such configuration, an adopter's pack works with generic defaults; with this plan's
  configuration, packs for the live plan read mentions and sections as today.
- A section name the config gives that the progress file lacks is noted in the pack, not silently
  ignored.
- Because B12 proposes, and does not write, keys for the live `plan.config.json`, B12 either keeps
  the live plan's packs unchanged without touching it, or supplies an additive config migration the
  plan's owner accepts (B12-Q3). New keys are documented in update-build-plan `SKILL.md`'s `runner` row and the
  `phase-context.mjs` header.

### B12-REQ-14 · Plan tools read stored statuses by B02's rule (R-07 plan-tool half)

- Every plan-tool status reader (`scope.mjs` `normaliseStatus` and the scope rule, and their callers
  `req-changes.mjs`, `assemble-gaps.mjs`, `build-args.mjs`, `regrade-ids.mjs`, `recipe-status.mjs`,
  `phase-context.mjs`, and `build-index.mjs` per B12-REQ-15) applies the rule B02 accepts under D-02:
  - if D-02 scopes each recode to the versions before it, a stored value is mapped only by recodes
    recorded after that version was saved, so a value saved after a renumber reads as itself;
  - if D-02 chooses the no-overlap rule (no target is a source in the same or an earlier recode),
    following the chain is idempotent on post-recode values, and the plan tools rely on that rule
    rather than on their own copy of a different one.
- The plan tools read `status-recodes.json` in whatever form B02 defines it, including the existing
  array of entries; the live 2026-10-20 names-to-codes entry reads as today (`Confirmed` reads as `4`,
  `Retired` as `6`).
- If D-02's rule needs code from `shared/statuses.ts`, the plan tools use the sharing mechanism D-03
  accepts; otherwise they keep their own copy with a test that it agrees with B02's rule.
- B12 closes R-07 when this requirement's proof and B02's proof of the board half both pass.

### B12-REQ-15 · The plan page: "re-plan first" and lane rows are right (A-10, A-4)

- **A-10.** Adjudicate with a fixture (a blocking question answered before a names-to-codes recode,
  plan baseline before the recode). If confirmed, the "re-plan first" flag compares statuses read by
  B12-REQ-14's rule on both sides, so a question already answered at the baseline never flags its
  phase, and one answered since the baseline still does.
- **A-4.** Adjudicate with a fixture `status.json` that has `guidance.lanes` and no `safe` phase. If
  confirmed, "Start now" still shows each lane with its queue and its prompt button.
- Each ends with a recorded verdict (confirmed and Fixed, or refuted with evidence); B15 confirms the
  verdicts at the audit commit.

### B12-REQ-16 · The agent tools' tests run in `verify:board` (accepted decision 6)

- `npm run verify:board` runs every `*.test.mjs` under `requirements-board/agent/` (found by a glob,
  not a list of named suites), so a test B13 or a later phase adds there is picked up without
  another edit.
- A failing agent-tool test makes `verify:board` fail.
- The new tests B12 adds (including for `phase-check.mjs` and `build-index.mjs`) sit where the glob
  finds them and leave no files behind in the repo.
- The existing three steps of `verify` (typecheck, Vitest, catalogue check) are unchanged.

### B12-REQ-13 · Preserved interfaces (all requirements)

The live plan and its phase docs rely on these; none changes incompatibly:
- **Commands and flags:** `phase-context.mjs <id> [--out <file> | --stdout] [--plan <dir>]`;
  `phase-check.mjs` with `--only`, `--failed`, `--changed`, `--list`, `--dry`, `--capture <IDs|all>`,
  `--stop-servers`, `--help`, `--plan`, exit codes 0/1/2, the `GREEN`/`RED` summary line, the lock,
  `.lane.env` loading, `portEnv`, the Node guard; `plan-state.mjs [--to] [--coverage] [--diff [IDs]]`;
  `regrade-ids.mjs <to> [--ids-only]`; `phase-briefs.mjs … --out --built`; `apply-plan-update.mjs
  <journals…> <sha> [--built]`; `recipe-status.mjs <id> | --check`; `build-index.mjs`; `config.mjs
  [--json]`; plan discovery (`--plan`, `BUILD_PLAN`, the repo's only `plan.config.json`).
- **Data shapes:** `plan.config.json` keys as they are (every new key optional, with defaults that keep
  the live plan's behaviour); `status.json` including `guidance.lanes`; `plan.json`; the JSON keys each
  tool prints; `phaseStatus`'s returned fields (both skills import it).
- **Plan-document formats the tools parse:** progress status rows, `### Catch-up Phase <id> · <title>
  (<date>)` entries, Decisions-log entry lines, drift baseline lines (`BASELINE_LINE`),
  `plan-state.mjs --diff <IDs>` lines, owner decision rows, lane commit subjects and status files.
- **The skills' stage structure** as named above (B12-REQ-11).

## Dependencies and handoffs

**Inputs consumed**
- From B02: the accepted D-02 rule and the form of `status-recodes.json` (B02's "To B12" handoff names
  the exact rule), applied by B12-REQ-14 and used by B12-REQ-04 and B12-REQ-15.
- From B04, only if B12 needs shared code: the accepted D-03 mechanism (settled before B12 builds;
  accepted decision 8). It would also settle the status defaults mirrored in `config.mjs:118-126`.
- D-08 answer from the plan's owner (recorded in PROGRESS.md before build).

**Files outside B12's folders that B12 edits** (convention 11; PLAN shared-files table)
- `requirements-board/scripts/capture.ts` (R-139), before B14's R-39 and R-134 changes.
- `requirements-board/starter/deny.txt` and `starter/this-repo/run-build-phase.md` (and
  `update-build-plan.md` if needed) for R-150 and R-151, after B02 (which keeps the starter tests
  green) and before B14.
- `requirements-board/package.json` `verify` script (B12-REQ-16), merged by hand at merge time
  (convention 14).
- `scope.mjs` and its callers are B12's own files; B02 does not edit them (accepted decision 4).

**Outputs owned and handed off**
- To B14: what B12 changed in `starter/` (deny terms, placeholder lines) and in `capture.ts`, for
  verification rather than re-doing; new config keys and their defaults, for B14's whole-file pass of
  `ADOPTING.md` and README; the B12 doc lines already updated (Doc facts).
- To B13 and later phases: new agent-tool tests go anywhere under `agent/` with a `.test.mjs` name and
  `verify:board` runs them.
- To the plan's owner: any accepted migration for the catch-up plan (B12-Q3, D-08), as exact additive
  changes the owner applies or authorises, plus a note for the lanes if the skill text they follow
  changed in a way they will notice.
- To B15: the dispositions, the compatibility evidence, and the A-4 and A-10 verdicts for B15 to
  confirm at the audit commit.

**Integration proof owner:** B12 for its tools against the live plan (read-only); B15 for the
programme-wide pass.

## Acceptance and evidence

Unconditional proof obligations (one per finding; fixture plans are small throwaway git repos or plan
folders outside the tracked tree; the form of each test is the execution agent's choice). **Every
proof must fail on the code at B12's start, or the recorded manual check must show the failure, and
pass after the fix** (convention 13). A verdict that a finding does not reproduce instead records the
fixture that shows it.

| Req | Finding | Proof |
|---|---|---|
| 01 | R-14 | A fixture progress file with a DONE row, an IN PROGRESS row plus its entry, and an entry-only phase: the IN PROGRESS phase is in progress and not built in plan-state output, the recipe check and the pack; DONE and entry-only phases stay built; the existing `phaseStatus` test still passes. |
| 02 | R-17 | Fixture repo with a `master` and two lane branches, one holding a checkpointed phase and one a completed phase (progress rows, entries and commits in the plan's lane format): per D-08, an update run on `master` treats them as partly built and built (or stops naming them); no baseline line in their docs moves; the pack run inside a lane fixture still reports dependencies from that lane's branch. Criteria beyond this floor await D-08. |
| 03 | R-16, R-138 | Fixture catalogue: a story moved out of the out-of-scope lane only, a story moved into it, a story moved between two in-scope lanes, a story retired after the baseline, a question whose `affects` changed only in the working tree. `regrade-ids <committed ref>` re-grades the first, reports the second as dropped, keeps the third cosmetic, drops the fourth, and is unaffected by the uncommitted edit. |
| 04 | R-164 | A fixture change of a few hundred entries: substance verdicts and diffs identical to the 1.12.3 functions; the recode file read once per side; git process count well below one per side per entry (counted, not just timed). |
| 05 | R-18 | Fixture old `plan.json` plus a fresh-plan journal reusing a number with a new slug: `plan.json` names the new doc; the old one is reported. An update journal for an existing phase keeps its path. |
| 06 | R-19 | Unit cases: `U6 (U1 to U6 built)` mid-statement, a numbered range across track phases, "18 November" in a statement; all existing run-order cases unchanged. |
| 07 | R-135 | Fixture phase doc with its own baseline older than `plan.json`'s: the pack's printed command, run, shows the same hunks the pack trimmed; the bare `--diff <IDs>` output is byte-identical to 1.12.3. |
| 08 | R-15 | Fixture `runner.checks` with deterministic pass/fail commands: full gate fails a check, `--changed` then passes its quick form, `--failed` re-runs the failed check; `--only <it>` passing in full form then clears it; a pre-B12 results file is read. |
| 09 | R-136, R-137 | Fixture config with `needs: ["<alias>"]`: the dependent starts only after the aliased check; config with a two-check cycle: `--list` and a run exit 2 naming both, take no lock and start nothing. |
| 10 | R-139 | Walk the close-out as the skill states it, on a fixture catalogue (or a scratch copy) where one recipe fails in the final capture and is then fixed: the capture report file itself, as it would be committed, lists no failure for that recipe and its totals agree with its rows. Fails today (`--capture <IDs>` leaves the report as the full run wrote it). |
| 11 | R-150 | Search of run-build-phase `SKILL.md` outside "This repo" for the listed terms finds none (finds them today); the body read with this repo's "This repo" block gives the same instructions as before (reviewer check). A scratch kit export (to a folder outside the repo) passes its leak check, and the same export with one denied term planted in a generic body fails it. The starter "This repo" block has a placeholder for each new line. |
| 14 | R-07 (plan-tool half) | If D-02 scopes recodes by version: a fixture catalogue with an overlapping renumber (`4=5,5=6`) recorded at a commit, and items saved after it, keeps a Confirmed item graded through `regrade-ids`, `build-args`, `assemble-gaps` and the pack, and detects a later real move (fails today: the item reads as Retired). If D-02 picks no-overlap: a test that chain-following is idempotent on post-recode values in the plan tools, and that they reject or flag an overlapping map as B02's rule says. Either way the live 2026-10-20 entry reads as today. R-07 closes only with B02's board-half proof also passing. |
| 15 | A-10, A-4 | The fixture decides each verdict. Run it first on the code at B12's start to establish whether the defect reproduces at HEAD. A-10 fixture: a plan whose baseline predates a names-to-codes recode, with one blocking question already answered at the baseline and one answered after it; the defect is a "re-plan first" flag on the first. A-4 fixture: `status.json` with `guidance.lanes` and no safe phase; the defect is "Start now" without each lane and its prompt button. If a defect reproduces, the fixture fails before the fix and passes after it (the second A-10 question still flags). If it does not, the disposition is "Not reproducible at HEAD" with the fixture run as evidence, and nothing is changed for it. Each runs on a plan-folder copy, never the live plan. |
| 16 | accepted decision 6 | A deliberately failing `*.test.mjs` placed in a scratch subfolder under `agent/` turns `verify:board` red, and removing it turns it green; the existing suites all run under `verify:board` (they do not today). |
| 12 | R-151 | Unit cases: a count noun given by config ("22 tickets") is not read as naming Phase 22 when configured, and the generic defaults hold no project noun; section names from config are found; a configured name the file lacks is noted. The pack for a live phase matches today's mention and section results under the agreed configuration. |

**Live-plan compatibility check (required, read-only on the real plan):**
- Before and after the change, from B12's worktree (whose plan files are the live plan as of its
  branch point, refreshed by merging `master` before the final check), capture and compare: `node …/phase-context.mjs <id>
  --stdout` for at least 26, 27a, 33, 44 and U6 (or the current equivalents); `plan-state.mjs`,
  `plan-state.mjs --coverage`, `plan-state.mjs --diff <a phase doc's IDs>`, `regrade-ids.mjs HEAD`,
  `recipe-status.mjs --check`, `phase-check.mjs --list`, `config.mjs --json`. Differences are limited
  to what the fixes intend (for example 26's run-order line), each explained in the phase entry.
- Tools that write (`build-index.mjs`, `apply-plan-update.mjs`, `phase-briefs.mjs --out`, a full
  `phase-check` run) are exercised only on a copy of the plan folder outside the tracked tree or on
  fixtures, never on `docs/prototype-build/catch-up/`.
- The live `plan.config.json`, as committed, loads without error and without new keys.

**Gate:** `npm run verify:board` green, including every `*.test.mjs` under `agent/` (B12-REQ-16).

**Prohibited regressions:** any change to a preserved interface in B12-REQ-13; a lane's pack reading
another lane's progress; any write under `docs/prototype-build/`, a lane branch or the lanes folder
during B12's build or checks.

## Deferred decisions for execution planning

Shared register: [PROGRESS.md](../../PROGRESS.md) "Deferred decisions".

### D-08 · Lane-aware plan state on master

- **Source/gap:** R-17; `LANES.md` expects plan updates on `master` during a wave ("Pick up master …
  it brings in the owner's requirements or plan updates"), while every phase-status reader sees only
  `master`'s working tree.
- **Affects:** B12-REQ-02, and through it plan-state, phase-briefs inputs, `apply-plan-update`
  baselines, `recipe-status --check`, and possibly `build-index.mjs`'s view of the wave.
- **Owner:** B12, with the plan's owner. **Dependents:** the catch-up lanes. **Gate:** before B12
  builds.
- **Options and consequences:**
  - **A. Read each lane branch's progress file** (`git show <branch>:<progress>`) and merge its DONE
    and IN PROGRESS rows into the plan-update view. Reuses the existing row parser and is exact for
    anything a lane has written up. Needs the lane branches declared somewhere machine-readable (a new
    optional field in `guidance.lanes` or `plan.config.json`: plan-owned files, so a migration the
    owner accepts). Misses work committed as a checkpoint whose progress row is not yet written.
  - **B. Read lane commit subjects** (`<id> checkpoint:`, `<id> complete:`). Catches checkpoints
    exactly as `LANES.md` defines them. The patterns are this plan's convention, so they must be
    configuration to keep the kit generic; a subject typo misleads it.
  - **C. Read the lanes' status files** in the git common dir. Cheapest to read but volatile, one line
    per lane, free text, and outside git history; weakest evidence.
  - **D. Refuse or warn during a wave.** The update tools detect lane branches ahead of `master` with
    phase work and stop (or demand an explicit override), so plan updates run only between waves. No
    new data, simplest to prove. Changes the owner's practice in `LANES.md` (excluded territory), and
    requirements changes wait for the join.
  - **E. Manual flags with a guard.** The orchestrator passes lane-built and lane-partly-built phases
    (extending `--built`), and the tools refuse to run with lanes declared unless those flags are given.
    Least code; relies on the orchestrator reading lane state correctly.
  - Combinations are possible (for example A or B for accounting plus D's detection as a backstop).
- **Common consequences:** whatever is chosen must not change a lane's own pack (`LANES.md` step 4);
  any new plan data is additive and inert to pre-B12 tools; generic code holds no lane names.

### New questions

| ID | Question / gap | Affects | Owner | Dependents | Gate | Impact |
|---|---|---|---|---|---|---|
| B12-Q1 | Answered (accepted decision 6, 2026-11-18): agent-tool tests join `verify:board` in B12, every `*.test.mjs` under `agent/`. Now B12-REQ-16. | | | | | |
| B12-Q2 | Answered (accepted decision 5 and PLAN B12 territory, 2026-11-18): B12 adds the R-150 deny terms and starter "This repo" placeholders; B14 verifies. Now in B12-REQ-11. | | | | | |
| B12-Q3 | Moving project vocabulary and section names out of `phase-context.mjs` needs those values in the live `plan.config.json`, which B12 proposes but does not write. Owner applies an additive migration, or B12 keeps behaviour identical another way? | REQ-12 | B12 with the plan's owner | catch-up lanes | B12 build | Without the migration, live packs could misread "PERSIST_VERSION 26 to 27" as naming 26 and 27. |
| B12-Q4 | Answered (accepted decisions 5 and 12, 2026-11-18): the R-139 fix is B12's, including `scripts/capture.ts`, and closes only when the committed report is correct. Now B12-REQ-10. | | | | | |
| B12-Q5 | Answered (accepted decision 3, 2026-11-18): B12 adjudicates and fixes A-4 and A-10; B15 confirms. Now B12-REQ-15. | | | | | |
| B12-Q6 | On a remake, what happens to an old doc whose number is reused with a new slug: left and warned, moved aside, or removed? | REQ-05 | B12 (plan's owner decides) | none | B12 build | Deletion is destructive; default to warn only. |

## Risks and recovery requirements

- **How a lane picks the change up.** Lanes merge `master` only at a phase start with a clean tree,
  and at the join. A lane mid-phase keeps its old tools until then, so within one wave the two lanes
  may run different tool versions. Required: nothing they share (the progress-file formats, commit
  subjects, status files, `status.json`) changes meaning between versions, and each worktree's own
  `.build-phase/` files written by one version are readable by the other.
- **Skill text lanes follow.** If run-build-phase's text changes in ways a lane will see (for example
  the drift recovery command or `--failed`), the change is backward compatible with the lane prompts
  and `LANES.md`; the phase entry says what changed so the owner can tell the lanes.
- **Shared modules.** A change to `config.mjs`, `req-changes.mjs`, `scope.mjs` or `plan-docs.mjs`
  breaks both skills at once if wrong; both skills' tests and the live compatibility check run after
  any such change.
- **Plan data migration.** Any accepted change to the catch-up plan's files (D-08, B12-Q3) is
  additive, shown to the owner before it is applied, and inert to pre-B12 tools.
- **Status rule.** B12-REQ-14 changes how every plan tool reads statuses. Until B02's rule and
  migration land, the plan tools must keep reading the live `status-recodes.json` as today; B12 does
  not build REQ-14 against a guessed rule.
- **Parallel worktree.** B12 runs beside the serial app phases. It merges `master` before its final
  checks, takes its version at merge time, and resolves the `package.json` `verify` line and lock
  file by hand and `npm install` (convention 14).
- **Rollback.** Reverting B12's merge on `master` restores the previous tools; lanes pick up the revert at
  their next merge. Required: no B12 output (results files, packs, new optional config or plan keys)
  breaks the reverted tools.
- **No harm while building.** B12's checks never run the live plan's full gate on shared ports, never
  write into `docs/prototype-build/`, and never touch lane branches or `.git/lanes/`.

## Execution and handoff obligations

1. Read PROGRESS.md in full (conventions 1 to 14, accepted decisions), this SPEC, the cited FINDINGS
   entries and A-4, A-9, A-10, both SKILL.md files, `LANES.md` and `plan.config.json`. Re-verify each
   finding at the then-current HEAD (lanes may have merged into `master` since 2026-11-18); mark any
   that no longer reproduce.
2. Confirm B02 has landed and its D-02 rule is recorded; confirm D-03 if B12 needs shared code.
   Resolve D-08 with the user (the plan's owner), and B12-Q3 and B12-Q6. Record answers in PROGRESS.md
   before building.
3. Write `docs/board-fixes/phases/B12-build-plan-tools/IMPLEMENTATION.md` before building: chosen
   approach per requirement, execution bites, concrete tests, the compatibility-check script, recovery.
4. Work in B12's own worktree with its own ports. Build in bites; show each proof failing on the
   starting code before the fix (convention 13); keep both skills' tests and the compatibility check
   passing after each bite that touches a shared module.
5. Finish green: `npm run verify:board` (now including every agent `*.test.mjs`); the live-plan
   compatibility check recorded with its intended differences.
6. At merge time, bump the board version (minor) from master's current version in
   `requirements-board/package.json`, regenerate the lock file with `npm install`, and put the
   `CHANGELOG.md` entry on top, naming each behaviour change and any new config key (conventions 5
   and 14).
7. Update the doc lines that describe behaviour B12 changes (both SKILL.md files, tool headers and
   `--help`, and any README, ADOPTING or About line that states it) and list every changed doc line
   under "Doc facts" in the PROGRESS entry (convention 12); B14 does the whole-file pass.
8. Run the three independent review lenses (quality, completeness against this SPEC, bugs and
   correctness), plus a compatibility reviewer steered at the preserved interfaces and the lanes.
   Verify each finding, fix confirmed ones with a regression test where practical, rerun the gate.
9. Give every owned finding a disposition: **Fixed**, **Not reproducible at HEAD** (evidence),
   **Won't fix** (user accepted, reason) or **Moved** (named owner, recorded in PROGRESS.md and both
   SPECs). R-07 is closed by B12 once B02's board-half proof and B12-REQ-14's proof both pass. Record
   the A-4 and A-10 verdicts.
10. Commit on B12's branch by path, B12's files only (including the `capture.ts`, `starter/` and
    `package.json` edits named in the entry), merge into `master`; never push. Write the PROGRESS.md
    phase entry last: what shipped, dispositions, verdicts, D-08 answer, migrations handed to the
    plan's owner, Doc facts, handoffs to B14 and B15, and anything discovered for later (for example
    `plan-state.mjs:60-63` reads item status from the working tree even with `--to`, the same class
    as R-138).
