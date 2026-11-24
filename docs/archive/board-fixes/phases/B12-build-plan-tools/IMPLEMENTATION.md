# B12 · Implementation plan

Written before building, 2026-11-20, at `58e0b6ba` (board-fixes `b35abbba` + master `7e227e66`, the wave
4 join). Decisions: accepted decision 28 (D-08, B12-Q3, B12-Q6); decision 16 (R-07 rule). D-03 not
needed (no `shared/*.ts` import). Every finding re-verified at HEAD: all hold (only `capture.ts` lines
moved by about 3).

## Technical choices per requirement

| Req | Finding | Choice |
|---|---|---|
| 16 | decision 6 | Board `verify` gains `&& node --test "agent/**/*.test.mjs"` (Node's own glob, Node >= 22.18); the existing three steps first, unchanged. |
| 01 | R-14 | `phaseStatus`: `built` and `builtByEntry` leave out phases in `inProgress` (row, or `status.json` `in_progress` with no progress file). Entry-only stays built; `keepBaseline` and every returned field kept. `phase-context.mjs` built-deps and next-unbuilt use the fixed sets; its own-entry lookup also takes IN PROGRESS. |
| 02 | R-17, D-08 | `laneStatus(c, root)` in `config.mjs`; `phaseStatus(c, root, { lanes: true })` merges it (stronger state wins) and adds `lanes: { branches: [{ branch, built, partlyBuilt, missing? }], declared, unaccounted }`. Commit subjects from `git log --format=%s HEAD..<branch>`, matched with `lanes.complete` / `lanes.checkpoint` (`{id}` placeholder, default `{id} complete:` / `{id} checkpoint:`, anchored at the start); progress rows from `git show <branch>:<progress>` through the same row parser. The current branch is skipped. Callers with `{ lanes: true }`: `plan-state.mjs` (status output; stderr note when unaccounted), `apply-plan-update.mjs` (kept baselines; exit 2 when declared lanes are unaccounted, unless `--ignore-lanes`), `recipe-status.mjs --check`. Not `phase-context.mjs`, not `build-index.mjs`. |
| 03 | R-16, R-138 | `regrade-ids.mjs` reads at `<to>`: story list by `git ls-tree`, item heads, recodes, board config and question `affects` through one `cat-file --batch`. For every changed entry (and every changed or added story), the out-of-scope verdict at the baseline and at `<to>` is compared: in scope at `<to>` and changed verdict, re-graded even if cosmetic-only; out of scope at `<to>` but not at the baseline, listed under the new key `dropped`. Keys `baseline`, `to`, `counts`, `ids`, `cosmeticOnly` and `--ids-only` kept. |
| 04 | R-164 | `req-changes.mjs`: `readBlobs(cwd, specs)` runs one `git cat-file --batch` for every `<ref>:<path>`; `changedEntries` / `changedInSubstance` take sides from it, and recodes are read once per side per call (a `recodesAt` cache keyed by ref). Existing exported signatures kept; a batch form `substanceVerdicts(entries, opts)` added for callers with many entries. |
| 05 | R-18 | `apply-plan-update.mjs`: the old `file` is kept only when the old entry's slug equals the new slug; otherwise the new path, and `{ num, old, new }` reported on stderr and under the additive output key `superseded` when the old file exists. Nothing moved or deleted (Q6). |
| 06 | R-19 | `parseRunOrder`: a range keeps phases of its ends' kind only (both numbered: numbered; both tracks: tracks with the same letter); a number followed by a month name is not a phase. |
| 07 | R-135 | `plan-state.mjs --diff <IDs> --from <sha>`; with no `--from`, byte-identical output. The pack prints `node <tools>/plan-state.mjs --diff <its ids> --from <its baseline>`; SKILL Stage 2 step 1 says to use it. `diffIds` still parses both forms. |
| 08 | R-15 | `last.json` merged by check name (done; see the tool header). |
| 09 | R-136, R-137 | Canonical `needs` / `after`; cycle check at load (exit 2 naming it, before lock); scheduler backstop SKIPs checks that can never start (done). |
| 10 | R-139 | `scripts/capture.ts`: a non-dry `--only` run updates the existing REPORT.md: bullets parsed by ID and section, the run's IDs moved to their new section with their new text, the summary table, section counts and totals line recounted from the merged rows. Missing or unparseable report: left alone, with a line saying to run the full capture. SKILL close-out says the committed report must list no failure. |
| 11 | R-150 | run-build-phase SKILL body by role; "This repo" gains the project facts (state version, demo guide files, the source rule); `starter/this-repo/run-build-phase.md` placeholders; `starter/deny.txt` gains the terms a scratch export shows are only in this repo's text. |
| 12 | R-151 | `runner.context.countNouns` (count words after a number), `notPhaseBefore` (regex fragments before a number), `decisionsSection` (default "Decisions log"), `handoffSection` (default "Discovered for later"). Generic code keeps generic nouns. A configured or default section the progress file lacks is noted in the pack. |
| 14 | R-07 | No change to `normaliseStatus` (decision 16). Guard test: idempotent on post-recode codes, the live 2026-10-20 entry reads as today; the failing-first proof is B02's `tests/recodeStatuses.test.ts` (overlap refused). |
| 15 | A-10, A-4 | Fixture first on the starting code. A-10: `build-index.mjs` reads recodes at the plan commit and today, and compares `normaliseStatus`ed values. A-4: lane rows rendered whether or not a phase is safe. |

## Execution bites

1. phase-check (R-15, R-136, R-137) with `phase-check.test.mjs`.
2. verify script (REQ-16).
3. phaseStatus R-14 and lanes R-17 with `config.test.mjs` (fixture repo, master plus two lane branches).
4. req-changes batching R-164, then regrade-ids R-16/R-138 (`regrade-ids.test.mjs`).
5. plan-state `--from`, phase-context R-19, R-135, R-151 (extend `phase-context.test.mjs`).
6. apply-plan-update R-18 (`apply-plan-update.test.mjs`).
7. build-index A-4, A-10 (`build-index.test.mjs`).
8. capture.ts R-139 (Vitest test in `tests/` for the report merge, as capture.ts is TypeScript).
9. SKILL texts, starter, deny list (R-150), scratch kit export.
10. Live compatibility, review, finish.

## Concrete checks

- Each new test is copied into `scratchpad/base/requirements-board/...` (the pre-B12 tools from `git
  archive 58e0b6ba`) and run there first: it must fail; then it passes in the worktree.
- Live compatibility: `scratchpad/compat.sh <dir>` (packs for 26, 27a, 33, 44, U6, 39a, 39b, 40, 41;
  plan-state, `--coverage`, `--diff`; `regrade-ids HEAD`; `recipe-status --check`; `phase-check --list`;
  `config.mjs --json`), before (`scratchpad/before/`) and after; diff limited to intended changes. The
  proposed config is exercised on a copy of the plan folder via `--plan`, reading the real `lane/a` and
  `lane/b` read-only.
- `npm run verify:board` green, now with the agent tests. A scratch `kit:export` passes, and fails with a
  planted denied term.

## Recovery

- Every change is in B12's worktree and branch; nothing writes the live plan, the lane branches or
  `.git/lanes/`. Reverting B12's commit restores the tools; the new `last.json` keys, `superseded`,
  `dropped` and `lanes` output keys and the optional config keys are ignored by the old tools.
- Mixed versions in one wave: `last.json` keeps `{ at, changed, results[{ name, status, ... }] }`, so either
  version reads the other's file.

## Handoff

- Owner: the migration JSON for the live `plan.config.json` (decision 28), applied at the master merge.
- B14: new config keys and defaults; the `starter/` and `capture.ts` changes to verify; Doc facts.
- B15: dispositions and the A-4 and A-10 verdicts.
