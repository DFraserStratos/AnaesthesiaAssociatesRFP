# Closing review: CORRECTNESS lens

Reviewer: fresh closing reviewer (correctness). Range `d4341735..HEAD` on `board-fixes` (HEAD `d5499c70`, board 1.26.0). Read-only except this file.

## Summary

No data-loss, crash or unsafe-state defect was found in the priority areas. I found **0 important, 4 minor and 5 nit** items. All are small and none contradicts an accepted decision. Everything below carries file:line evidence; where I could not run the failing case I say "plausible".

Evidence gathered beyond reading:

- In-place YAML edit stress run (scratch script, memory only, nothing written): 2,550 patch-then-`edit*Text` applications over every real story, question and artifact file in `requirements-board/requirements/` (five item patches, three question patches, three artifact patches each). Result: 0 `LossyEditError`, 0 read-back mismatches. Hand cases (CRLF, trailing comment on a key, no trailing newline, no body, clearing and adding sections, a body heading inside the description) all behaved as `shared/inPlace.ts` documents.
- `node --test` on `agent/skills/update-build-plan/tools/*.test.mjs` and `agent/skills/run-build-phase/tools/*.test.mjs`: 54 pass, 0 fail.
- Read-only runs against the live plan: `plan-state.mjs --coverage`, bare `plan-state.mjs`, `plan-state.mjs --diff IDs --from 63a4490` (works; `--from` without `--diff` exits 2 as documented) and `phase-context.mjs 41 --stdout` (exit 0, 58.5 KB under the 60 KB budget, wrote nothing). All behave as their headers say.

## Findings

### CO-1 (minor, plausible) The server reports a collision for a field whose patched value already equals what is on disk
- Evidence: `shared/patch.ts:68` (`collisions` compares the tidied *base* value to disk, never the patch value); caller `server/catalogueApi.ts` `staleness()` (about line 395).
- Scenario: the user changes status 3 to 4 on a card while an agent saves the same card with status 4 (rev moves). The client sends `{ patch: { status: '4' }, base: { status: '3' }, baseRev: <old> }`. Disk status (4) differs from base (3), so `collisions` returns `['status']` and the write is a 409 with a collision, although applying the patch would be a no-op. The client's own quiet take-in (`useEditableRecord.ts`, effect around line 82) already ignores a clash whose values are equal, so the sheet and the server disagree. The user is shown a conflict choice for two identical values.
- Impact: a spurious conflict prompt in a rare race; no data is lost (Keep mine and Load theirs both end at the same value).
- Origin: programme (B05 write protocol, accepted decision 20).

### CO-2 (minor, code-confirmed, not run) Layout save accepts a path-like card id and records a position for it
- Evidence: `server/catalogueApi.ts:940`: `existsSync(itemPath(id, root))` is the only test on a body-supplied id, and `itemPath` is `join(storiesDir, `${id}.md`)` (`server/catalogueFs.ts:32`). `idFromPath` (B01) guards URL ids only.
- Scenario: `PUT /api/layout { positions: { "../README": { x: 1, y: 2 } } }` joins to `requirements/README.md`, which exists, so `positions["../README"]` is written into `board-layout.json`. Any `.md` reachable by `..` from `stories/` passes. Same-origin only (the origin guard stands), so this is data pollution, not a read or write of that file.
- Impact: a junk key in the layout file, carried until a delete or layout rewrite drops unknown ids. Also reachable from a corrupted sessionStorage "kept moves" entry: `src/store.ts` `kept0` accepts any id string for a position, then `load()` drops only ids absent from the snapshot, which would remove it client-side but not if it matched an item.
- Fix shape: apply `ID_FILE` (the rule `deleteItemAssets` already uses at `catalogueFs.ts:527`) to position keys.
- Origin: programme (B05/B07 changed the existence test from `state.items[id]` to a disk check, R-57); previously keyed on `state.items`.

### CO-3 (minor) Item delete removes screenshots after the all-or-nothing step, so a failure there leaves state and disk disagreeing
- Evidence: `server/catalogueApi.ts:650-656`: `writeAll([...])` covers record rewrites and file deletions, then `deleteItemAssets(x, root)` runs inside the loop that also does `delete state.items[x]`. `deleteItemAssets` (`catalogueFs.ts:526`) is a bare `rmSync(..., { recursive: true, force: true })`.
- Scenario: record files are deleted and committed to disk; `rmSync` of `assets/<ID>/` throws (EPERM or a locked file on a synced folder or Windows). The route returns 500 and exits before `delete state.items[x]`, `journal.forget(x)` and the `notify` for the remaining ids. Disk has no card, the server state still holds it, and the tab gets an error for a delete that happened. The watcher re-sync repairs the state shortly after (the deleted file is a change), so this self-heals, but the user sees "failed" for a delete that took effect and the leftover screenshot folder remains.
- Impact: misleading failure, not data loss (screenshots are tracked in git). The assets are also not covered by `putBack`, so "all or nothing" does not extend to them.
- Origin: pre-existing ordering; B05 made the record part atomic but left this tail outside it.

### CO-4 (minor, plausible) Rename detection runs unbounded (`-l0`) over the whole first-parent history, and a failure turns into "no history"
- Evidence: `server/gitRenames.ts:43` and `:59` (`-M -l0`); the log call uses `git()` with `maxBuffer: 64 MB` (`server/gitCore.ts:54`); `standing()` in `gitHistory.ts` has no catch of its own, so any rejection reaches the broad `catch { return none }` in `gitFileHistory` (and likewise in `gitScreenshots`, `gitAssetHistory`).
- Scenario: a repository with a very large mass-move commit. `-l0` removes git's rename limit, so the cost of a commit is added files times deleted files. Separately, the `--raw` output for the whole history has to fit in 64 MB. If either bound is hit the rename log rejects, `moveContext` rejects, and every history route returns an empty timeline with no message, indistinguishable from "no history".
- Impact: silent loss of history display on large repositories; this repo is nowhere near that size. I did not measure.
- Origin: programme (B08 introduced the single shared rename log).

### CO-5 (nit) A new body section is written with no blank line after the closing fence when the body was empty
- Evidence: `shared/inPlace.ts:323-328` (blank-line padding applies only `if (… && out)`; with an empty lead `out` is empty). Reproduced with a file that has frontmatter and no body, patched with `notes: 'N'`: result is `---\n## Notes\n\nN\n` (heading on the line directly after `---`). It reads back correctly (the `losses` check passes) and differs from `serialiseItem`'s form (blank line after the fence).
- Impact: cosmetic only; a later save does not normalise it.
- Origin: programme (B05).

### CO-6 (nit) `--items A=b=c` is read as `A=b`
- Evidence: `scripts/recode-statuses.ts:42` (`pair.split('=')` destructures two parts, the third is dropped silently). Target `b` is still validated as a code, so this cannot write a wrong code, but `3=4=5` records `3=4` with no warning.
- Origin: programme (B02/B14 script).

### CO-7 (nit) `kit:export --dry-run` leaves its staged kit in the system temp folder
- Evidence: `scripts/export-kit.ts:166-179`: the stage is `mkdtempSync(...)` and `--dry-run` exits at line 179 without removing it (the problem path says so in its message; the dry-run path only prints "staged in"). One folder per dry run accumulates.
- Origin: programme (B14), documented in the header as "staged in".

### CO-8 (nit) A status line with a trailing YAML comment is "unknown" to the recode script
- Evidence: `scripts/recode-statuses.ts:23,53-57` (`STATUS_LINE` captures the whole rest of the line, so `status: 3   # note` has value `3   # note`, matching no map key and no target).
- Impact: the recode refuses (`"3   # note" is not mapped`, nothing written), so it fails safe. The board never writes such a line; a hand-edited file could.
- Origin: pre-existing pattern, kept by the programme.

### CO-9 (nit, compat note, accepted by D-08) The live plan now needs a `lanes` key or the update view complains and `apply-plan-update` refuses
- Evidence: live `docs/prototype-build/catch-up/plan.config.json` has no `lanes` key while `status.json` declares `guidance.lanes` (Lane A, Lane B). Running `plan-state.mjs --coverage` or bare `plan-state.mjs` against it prints the "Do not update the plan until they are" warning on stderr (both exit normally); `apply-plan-update.mjs` exits 2 unless `--ignore-lanes` (`agent/skills/update-build-plan/tools/apply-plan-update.mjs`, the `status.lanes.unaccounted` guard). `--coverage` does not use lanes but still prints the warning because it is computed before the flag branch (`plan-state.mjs`, the `lanes?.unaccounted` line before `--coverage`).
- Not a bug: PROGRESS accepted decision D-08 and the SKILL.md row for `lanes` say exactly this, and the context pack and drift check (`phase-context.mjs`, `plan-state.mjs --diff`) are unaffected. Recorded because outcome 7 asks for backward compatibility with the live plan: the plan's owner must add `"lanes": { "branches": ["lane/a", "lane/b"] }` before the next plan update, or pass `--ignore-lanes`.

## Risky areas checked and found sound

- **In-place YAML (`shared/inPlace.ts`, `shared/patch.ts`)**: splice then read-back (`losses`) then canonical fallback gated on loss; a section the board never edits (artifact Source) is checked byte for byte; CRLF, BOM (kept by `writeAtomic`), flow lists, comments, new-key placement and removal all verified by the stress run above. `applyPatch` / `collisions` / `patchBetween` / `overlay` are mutually consistent (the `base` requirement is enforced in `collisions`).
- **Server write routes (`server/catalogueApi.ts`)**: every write re-reads the file (`itemOnDisk` and kin) before judging; `staleness` returns 400 for a missing `baseRev`/non-object `base`; a no-op patch writes nothing and returns the record; `guard` refuses only errors the load did not already have; `guardStatus` lets an unchanged status pass; batch moves check every record before writing any and refuse a duplicated id; `writeAll` dry-runs every in-place edit before writing, restores written files (including a step that wrote then threw) and names any file it could not restore; create uses `createAtomic` (exclusive) with bounded retry; delete is planned from a fresh `syncFromDisk()` and refuses if the doomed set differs from what the user saw (`ids`).
- **Config save (`PUT /api/config`)**: judged against the file on disk, not the server copy; damaged list never saved over; a status in use cannot be dropped; a code at or below the high-water mark cannot be reissued; removed statuses are appended to `removedStatuses` with prior entries untouched; unbased sections are 400; stale sections are 409 with the current copy.
- **Lane and layout writes**: lane list writes require `lanesRev` (400/409), story revs are checked per story and for extra ids, merge-on-rename is inside the same `writeAll` as the layout file, and positions never fail for a lane problem they did not cause.
- **Store sync and layout queue (`src/store.ts`)**: snapshot vs delivery ordering (epoch/seq, `loadApplied`, `logged` replay), one in-flight layout save (`layoutQueue` never rejects, failure puts back older moves only, `forgetCards` clears waiting, in-flight and history), kept moves mirrored to session storage and re-sent once after reload, Mapped moves checked not replayed, optimistic move rollback only when nothing newer replaced it. I traced the main races (delivery during load, restart during load, delete during a failing save) and found no ordering hole.
- **Edit sheets (`src/components/useEditableRecord.ts`)**: only changed fields are sent with their base values; typing during a save is kept (`later` overlay); a clash raises the choice only when values differ; an orphaned draft survives a vanished record; Discard is final (`dropDraft` then `reset`).
- **Git history reader (`gitHistory.ts`, `gitRenames.ts`, `gitCore.ts`)**: literal pathspecs, NUL-separated output, either hash width, first-parent walk with a rename-away ending a history and a deletion as a bound, uncommitted moves through `committedPath`/`pathsOf`, caches bounded (`Lru`) with rejected promises evicted (`memo`). Walk/rename logic read end to end; no off-by-one found.
- **Status registry and recode (`shared/statuses.ts`, `scripts/recode-statuses.ts`)**: `recodeProblems` makes the chain rule safe (no target is a source of the same or an earlier recode; fresh codes only past the high-water mark; merges named as identity pairs; roles protected); the script reads `status-recodes.json` strictly, records before rewriting, finishes an interrupted run without double-recording, refuses while a board runs, and rewrites only the `status:` line. The config list moves with it (`recodeConfigList`).
- **Kit export and skill install (`scripts/export-kit.ts`, `server/skillInstall.ts`)**: source is HEAD blobs (or tracked files with `--uncommitted`), never untracked ones; the target is refused when it is, contains or sits inside this board, is a link or file, or holds an earlier kit that is not byte-identical to its marker; the swap is rename-aside with restore on failure and keeps `node_modules`; the deny list and doc-reference checks run before anything is written. Skill install replaces or removes only what the manifest names or what links into this board's `agent/`; link-mode folders are recognised; junk never decides ownership.
- **Agent tools**: `phase-check.mjs` result merging (a quick pass never clears a failure or a full pass), cycle check before any run, no-progress guard so a run cannot wait forever, exit codes 0/1/2 as headed; `plan-state.mjs` `--from`/`--to`/`--diff` argument parsing; `regrade-ids.mjs` reads both sides at their own refs through one `cat-file --batch` and judges scope with the target's recodes (relies on D-02b's no-overlap rule, which `recodeHistoryProblems` reports on if violated); `req-changes.mjs` `readBlobs` header parsing is byte-offset correct; `apply.mjs` (consistency-review) applies a change whole or not at all against a scratch copy, refuses record folders, retired items, protected and retired artifacts and a question's answer, and fingerprints decisions. `guard.mjs` resolves real paths so link or case spellings cannot escape.
- **Deliveries and watcher (`shared/delivery.ts`, `server/watchBatch.ts`, `planSync`/`partialLoad`)**: a later change replaces an earlier one per record; the watcher never trusts event types; a failed partial re-sync falls back to a whole read; the partial path's file filter matches `listMd` exactly, so it equals a fresh load.
- **Journal (`server/historyJournal.ts`)**: unsafe ids refused, unreadable lines skipped, `forget` renames aside rather than deleting, a reused id starts a new life.
- **Diff text comparison (`shared/textCompare.ts`)**: the anchor-cut LCS recursion always shrinks and keeps order; the table form is exact when it fits.

## Not covered

I did not read the React views (B09 to B11 UI), the Playwright specs, `cataloguePlugin.ts` request guard (B01, the security lens), the consistency workflows' `.js` bodies line by line, or run `recipe-status.mjs`, `build-index.mjs` or `apply-plan-update.mjs` against the live plan (the last writes; the others I did not check headers for).
