# B14 · Implementation plan and record

Worktree `AnaesthesiaAssociatesRFP-board`, branch `board-fixes`, starting at `0047a169` (board 1.25.0).
Master had nothing `board-fixes` lacked, so no merge. Decisions: accepted decision 29 (PROGRESS.md),
asked in this session before building.

## Resolved decisions

| ID | Answer | Effect |
|---|---|---|
| D-09 source | HEAD by default (`git ls-tree` + one `git cat-file --batch`); `--uncommitted` takes tracked files on disk; never untracked or ignored files; refuse outside git | REQ-02; a real export follows the commit of its version bump |
| D-09 refusal | `.kit-export.json` marker (version, commit, source, SHA-256 per file); exact match or refused; only `node_modules/` exempt (and OS litter: `.DS_Store`, `Thumbs.db`, `desktop.ini`); fixed rule by real path; no `--force` | REQ-01 |
| B14-Q1 | Relative env folder values resolve against the board folder (`server/boardPaths.ts` `envPath`) | REQ-07.7 |
| B14-Q2 | No upgrade mode; README (source board) and ADOPTING (kit) describe re-export and copy-over | Discovered row |
| B14-Q3 | Fixture e2e board `BOARD_E2E_PORT` (default `BOARD_PORT` + 2), real `BOARD_E2E_REAL_PORT` (+ 3) | REQ-12 |
| B14-Q4 | `installStatus` and its test deleted; `installMode` inside the install | REQ-10.7, REQ-11 |
| B14-Q5 | Starter copies of `notes/README.md`, `changes/README.md`; `SHARED_REQ` = SCHEMA only | REQ-04 |
| B05-Q6 | Already done by B05 (plain non-overwriting move); REQ-14 recorded, not rebuilt | |
| Discovered rows | Export blockers and doc rows taken; code rows moved to B15 | |

## Technical choices

- **`scripts/userPath.ts`**: `callerDir()` trusts `INIT_CWD` only when `npm_lifecycle_script` names the running
  script file, so a script spawned inside another npm script (Vitest) keeps its own working folder;
  `userPath`, `shown`. Used by every script that takes or prints a path.
- **`server/boardPaths.ts`**: `BOARD_DIR`, `envPath(name)`; edits in `catalogueFs.ts`, `artifactFiles.ts`,
  `historyDir.ts`, `pdfFactsStore.ts` (touch rights).
- **`server/laneEnv.ts`**: `loadLaneEnv`, `boardPort`; used by `vite.config.ts`, `capture.ts`, `shoot-steps.ts`,
  `playwright.config.ts` (one loader instead of two).
- **`server/junk.ts`**: `isJunk` (dotfiles but `.gitignore`, `__pycache__`, `*.pyc`), `hasJunk`; used by the
  install and the export.
- **Export** builds the kit in memory from the source map, applies `<!-- kit:omit -->`, swaps "This repo",
  fills START-HERE (`{{version}}`, `{{commit}}`, `{{loop-svg}}`), runs the leak check and a reference check
  (`npm run <script>` and backticked board paths in shipped `.md`/`.html`/`playwright.config.ts`, CHANGELOG
  exempt), stages with the marker, and swaps the target folder whole (incoming sibling, rename, move
  `node_modules`, delete old; the old folder is put back if the rename fails). Target checks run before
  anything is read and again just before the swap.
- **Install**: ownership = manifest, or a link (or folder of links, junk aside) into `<board>/agent/`;
  after installing, every owned entry with no current source is removed and reported.
- **Capture**: `pruneShots(dir, wanted, apps, usedBy)` and `parseOnly(argv)` in `captureFiles.ts` (testable
  without Playwright).

## Bites and checks (each proof fails on the pre-B14 board, `git archive 0047a169` in the scratchpad)

1. Helpers, R-31 sweep, env rule: `tests/userPath.test.ts`. Old scripts (`BOARD_UNDER_TEST`): 6 of 10 fail.
2. Capture: `tests/captureFiles.test.ts` (R-39, R-134 units), `tests/captureArgs.test.ts` (old
   `CAPTURE_UNDER_TEST`: 5 of 5 fail; the old runner exits 0 having run a full capture and written the report).
3. Install: `tests/skillInstall.test.ts` (old `SKILL_INSTALL_UNDER_TEST`: 6 of 13 fail); in this worktree
   `install-skills` (no flag) keeps links; `git status -- .claude` shows only the intended changes.
4. Export: `tests/exportKit.test.ts` on synthetic scratch repositories (old `EXPORT_KIT_UNDER_TEST`: 13 of 17
   fail; `--to ..` under the npm environment replaced the scratch board's catalogue with the starter and
   deleted `starter/` and the export script, R-05 exactly).
5. Spec split and ports: `e2e/artifact-regions.spec.ts` (generic), `artifacts-real.spec.ts` (project);
   Playwright on 5482 and 5483 in this worktree.
6. Docs pass (README, ADOPTING, SCHEMA, START-HERE, About, starter, skills) and the denied-word fixes.
7. Version 1.26.0, CHANGELOG; `verify:board`; checkpoint commit; final export from HEAD to the scratchpad;
   in the kit (`node_modules` linked): `check`, `tsc -b`, Vitest, the region sweep.
8. Light review (two Sonnet reviewers), fixes, re-run.

## Recovery

Each area is separable (helpers, capture, install, export, docs). A faulty change is reverted by path;
the kit is re-exported to scratch to confirm. Exports are only ever pointed at scratch folders. The
tracked `__pycache__` link removal is a plain `rm`, staged only at commit.

## Handoff to B15

- Export: `npm --prefix requirements-board run kit:export -- --to <scratch>` after committing; the marker
  rule and refusals are in README "Sharing the board"; `tests/exportKit.test.ts` is the proof.
- Ports: Playwright `BOARD_PORT` + 2 / + 3 (env overrides `BOARD_E2E_PORT`, `BOARD_E2E_REAL_PORT`).
- Docs truth audit starts from the B14 PROGRESS entry's Doc facts.
