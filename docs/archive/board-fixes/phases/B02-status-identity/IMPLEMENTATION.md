# B02 · Status identity · implementation plan

Decisions applied: PROGRESS accepted decision 16 (D-02, B02-Q3 to Q6, A-2's fix, the R-07 rule for
B12). Base: `board-fixes` at `60bd04c6` (B01 plus the merge of master's pointer-page commit).
Paths below are relative to `requirements-board/`.

## Drift check at HEAD (SPEC written at d4341735)

Every finding still reproduces. Line drift only: `PUT /api/config` is `server/catalogueApi.ts:522-583`
(in-use guard `:541-547`, `was` test `:545`), the history route `:342-357` (`normaliseStatus` at
`:354`), `defaultStatus` on create `:453`, `:496`. `shared/statuses.ts`, `shared/config.ts`,
`scripts/recode-statuses.ts`, `shared/csv.ts`, `src/store.ts` and `SettingsView.tsx:415` are as the
SPEC cites. The journal folder rule lives in `server/cataloguePlugin.ts:34-38` (`historyDirFor`):
HISTORY_DIR, else `.history/` for the real folder, else a temp folder per catalogue. Working tree
clean apart from the merge.

## Technical choices

### Status model (`shared/statuses.ts`, `shared/config.ts`)

- `readStatusList(raw, kind, field)` keeps its contract (`list`, all `problems`) and adds
  `damage: string[]`, the structural subset. Structural: not a list, an entry without a valid code,
  every `statusListProblems` rule (duplicate code, role and settle rules). Cosmetic: a bad `tone`
  (label, help and heading already fall back silently).
- `parseStatusList(raw, kind, field, problems)` returns `{ list, state }`. Absent key: built-in list,
  healthy. No problems: healthy. Cosmetic only: **degraded**, the list as read with per-field
  fallbacks. Any structural problem: **damaged**, and the list is the *readable part* of the
  project's own: entries with valid codes, first wins for a duplicated code, unknown roles dropped,
  a role kept only where exactly one entry with an unduplicated code holds it, `settle` kept only on
  item statuses that are not retired. Never the defaults. The summary problem says the board reads
  only the readable part until `board.config.json` is fixed.
- `BoardConfig` gains:
  - `removedStatuses: { statuses: RemovedStatus[]; questionStatuses: RemovedStatus[] }`,
    `RemovedStatus = { code, label }`, parsed from the file's top-level `removedStatuses` (bad
    entries reported and skipped; a live code also listed as removed is reported as a reused code).
  - `statusState: { statuses: StatusListState; questionStatuses: StatusListState }`,
    `StatusListState = { state: 'healthy' | 'degraded' | 'damaged'; problems: string[]; highWater: number }`.
    This is the per-list damage contract B06 renders; it rides the snapshot (`config`) and the
    `config` event with no change to their shape. `highWater` is the largest code ever used by the
    list as far as the config and the recodes know (live, removed, numeric recode keys and values).
- `parseConfig(text, recodes = [])`. An unparseable file or a non-object: the defaults for every
  other field, but both status lists **damaged** and empty (never the default lists), with the
  reason. `DEFAULT_CONFIG` (no file) stays healthy defaults. `readConfig(root)` passes
  `readRecodes(root)`.
- Allocation: `nextStatusCode(...groups: Iterable<string>[])` returns one past the highest numeric
  code in any group. Server and Settings both call it with: the list, `String(highWater)` and the
  codes records hold.
- `statusLabel` shows a removed code as `<last label> (removed)`; unknown codes as stored.
- `defaultStatus` returns `''` when the default role is unresolved (no more `list[0]!` crash).
- Recode rules as pure helpers (used by the script and by the check):
  `recodeProblems(map, kind, ctx)` (no-overlap, fresh-or-explicit-merge, live merges) and
  `recodeHistoryProblems(recodes)` (an earlier overlapping history, for adopting repos).

### Check (`shared/check.ts`, touch rights)

- A damaged kind: card-level "status is not one of" errors are skipped (the config problem is the
  one error). Otherwise judged against the project's readable codes. A record holding a removed code
  says so (label, removed). An overlapping recode history is reported from `parseConfig` as a config
  problem.

### Server (`server/catalogueApi.ts`)

- `PUT /api/config`, per status field sent: parse the on-disk list (or built-in when absent); if
  **damaged**, 422 naming the file, field and reasons, file untouched. The incoming list must have no
  problems (as now). In-use guard judged against the on-disk list (not `state.config`): a dropped code
  that records hold and the on-disk list defines is refused; a code it never defined does not block.
  New codes (not on the on-disk list) must be past the high-water mark (on-disk list, removed,
  recodes, record codes), else 422 naming the reused code. Dropped codes are appended to
  `removedStatuses[field]` with their last label (a malformed `removedStatuses` refuses the drop).
- Item and question create, and PUT: a status that is new or changed must be one the readable list
  defines; create with no resolvable default and no status sent is refused (422).

### Client

- `src/views/SettingsView.tsx` `add` only: the helper with `highWater` and record codes.
- `src/store.ts` `dropUnknownStatuses`: returns without touching the filter while either list is
  damaged; prunes (and persists) only a genuinely absent code otherwise.

### CSV (`shared/csv.ts`, `scripts/export-csv.ts`)

`requirementsCsv(items, config)` and `questionsCsv(questions, config)` write `statusLabel`. Columns,
order, quoting unchanged; no code column (B02-Q6).

### Recode (`scripts/recode-statuses.ts`) and the lock (A-2)

- `historyDirFor(root)` moves to `server/historyJournal.ts` (exported), used by the plugin and the
  script, so the script rewrites the journal of the board that serves that catalogue (fixtures
  included); `HISTORY_DIR` still wins.
- Lock: the plugin writes `<historyDir>/board-<pid>.lock` at server start and removes it on server
  close and on process exit. `boardsRunning(historyDir)` lists locks whose pid is alive
  (`process.kill(pid, 0)`; `EPERM` counts as alive); stale locks are ignored. The recode refuses a
  real run while one is alive ("stop the board first"); `--dry-run` only notes it.
- R-06 (`planFolder(dir, map, { live, resume })`): an unmapped value at a target is skipped (already
  recoded) unless it is a live code and the map renames a live code; otherwise it is unmapped and the
  run refuses naming it and its files. In resume mode every target is skipped.
- No overlap (`recodeProblems`): for every non-identity pair, the target is not a source in this map
  nor in any earlier recode; a numeric source's target is a fresh code past the high-water mark
  (live, removed, recodes, record codes) or a live code named as an identity pair (an explicit merge);
  two live codes into one fresh code is refused (merge into a live code instead); a live code merged
  away that holds a role is refused. The dry run lists merges as merges.
- Config (B02-Q5): a damaged or unparseable config refuses the run. After the files, each config
  entry whose code is a non-identity source moves to its target, or is dropped when merged into a live
  code; written with `formatJson`, atomically, only if it changed.
- Order and restart (R-44): validate, then record the entry in `status-recodes.json` (skipped when
  the last entry has the same maps: a rerun resumes), then files (atomic each), then journal, then
  config. Every step is idempotent under the no-overlap rule (no target is ever a source), so a rerun
  of the same command finishes an interrupted run once. Failures name the file and step; exit 1.
- Journal: each `.jsonl` line parsed on its own; an unparseable line kept byte for byte and counted;
  `.last.json` likewise kept when unparseable; every file written temp-then-rename.

## Execution bites and proofs (each fails at HEAD, passes after)

1. Model + config tests (`tests/config.test.ts`; the fallback-to-defaults assertions change, called
   out for review): R-01 (a) degraded keeps codes, (b) every damaged case never reads as defaults on
   the six-status list; registry derivation (items 6, questions 4).
2. Check: R-01 (f) one list problem, no card flood; R-68 reused/removed code reported.
3. Server (`tests/api.test.ts`): R-01 (c) FINDINGS scenario (bad tone then reworded save keeps 5 and
   6) and damaged saves refused byte-identical; (d) in-use guard from disk; (e) state in snapshot and
   event; R-68 server allocation, reuse refused, removal recorded; create refused without default.
4. Store (`tests/store.test.ts`): R-46. Settings `add` (e2e or unit through the helper).
5. CSV (`tests/catalogue.test.ts`): R-30 labels, unknown as stored, columns unchanged.
6. Recode (`tests/recodeStatuses.test.ts`, running the script as a child process with
   `REQUIREMENTS_DIR` and `HISTORY_DIR` in a temp folder): R-06, R-07 overlap refused and chain
   idempotent (shared rule, diff, history route), R-44 truncated line and rerun after a forced
   failure, A-2 lock refusal; the 2026-10-20 entry reads as today.
7. Docs, version 1.14.0, CHANGELOG.

A-2 reproduction at HEAD: a scratch catalogue, a watching catalogue API with a scratch journal
(the board), the HEAD recode's file step then its journal rewrite (`recodeJournal`); the evidence is
recorded in the PROGRESS entry.

## Checks

`npm run verify:board`; `e2e/settings.spec.ts` on a free port; `node --test` of the plan tools
(`agent/skills/update-build-plan/tools`, `agent/skills/run-build-phase/tools`) as a compatibility
check; `npm run check` on the real catalogue identical before and after; manual damage checks on a
scratch copy of the real catalogue served on 5480.

## Recovery

No real catalogue file, recodes file or journal is written by this phase (no migration). Tests and
reproductions use temp folders only. Code is recoverable from git; a bad bite is reverted file by file.

## Handoff

- **B06:** `config.statusState[field]` (`state`, `problems`, `highWater`) is the lock-out input;
  the server already refuses damaged-list saves. Allocation: `nextStatusCode(list codes,
  [String(highWater)], record codes)`. Whole-list saves keep `removedStatuses` (server-side).
- **B12:** the R-07 rule in accepted decision 16; `status-recodes.json` unchanged in shape.
- **B05:** keep the damaged-list refusal, on-disk in-use guard, reuse refusal and removal record in
  the config write route.
- **B14:** doc facts in the PROGRESS entry; starter config needs no change.
