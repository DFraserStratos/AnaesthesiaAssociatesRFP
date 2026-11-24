# B08 · Git history reader: implementation

Session 2026-11-19, on `board-fixes` at `f3c7d9f8` (board 1.16.0). Master had nothing `board-fixes`
lacked; no merge. Prerequisites checked COMPLETE: B01, B02, B03, B04. The territory files were
unchanged since `d4341735` (last edits `f53a2471`), so FINDINGS and SPEC lines held; B01 had moved the
history-blob route in `cataloguePlugin.ts` (now `serveHistoryBlob` and `blobWasAt` at about
`:344-421`).

## Decisions

PROGRESS accepted decision 19. Asked of the user: D-05 (reuse stays), B05-Q3 (a restore continues),
B05-Q2 (journal cut only at a committed deletion), D-07(d) (follow unchanged unstaged moves). Settled
from evidence and shown in the approved plan: D-07(a), (b), (c), (e), B08-Q1, Q2, Q3, Q5, Q6.

**B08-Q6, evidence.** Scratch repository, 50 tracked files with their mtimes moved forward:
`git status --porcelain` rewrote `.git/index` (inode/mtime changed: it takes `index.lock` to refresh
the stat cache). The same with `GIT_OPTIONAL_LOCKS=0`: index untouched. The board ran `git status` on
every history read (cards, sidecars, assets, screenshots, `layoutDirty`), so a board in a lane
worktree could make an agent's concurrent `git add` or `git commit` fail on `index.lock`. Confirmed;
fixed (REQ-10.7). Proof: `gitReader.test.ts` "B08-Q6".

## Approach (as built)

- **`server/gitCore.ts`** (new): `git()` and `gitBytes()` with `GIT_OPTIONAL_LOCKS=0`,
  `--literal-pathspecs`, `core.quotePath=false`, `color.ui=false`, `log.showSignature=false`,
  `log.follow=false`; `Lru`, `memo` (moved from catalogueDiff), `shared` (in flight only); `repoTop`,
  `objectFormat`, `indexIdentity` (`rev-parse --git-path index`, then size, mtime and inode),
  `headOf`; `parseRawLog` / `parseRawChanges` (`-z --raw`); `readBlobs` (any object type, skips the
  bytes of non-blobs, a spec with a newline reads null); `workingNames` (index name when
  `diff-files` says unchanged, else `hash-object --stdin-paths`, cached by path, size, mtime, inode).
- **`server/gitRenames.ts`** (rewritten): `moveContext(top, head)` = first-parent rename log (memo per
  top and HEAD), staged renames (`diff --cached -M`, keyed by the index identity), unstaged pairs
  (`ls-files --deleted` against `--others`, likely pairs hashed in the clean form), shared while in
  flight. `committedPath`, `pathsOf`, `priorPaths`, `priorDirs` (same semantics as before on the new
  log) and `folderMoves` (an earlier folder only when the move emptied it).
- **`server/gitHistory.ts`** (rewritten): one `walk` over `log -z --first-parent
  --diff-merges=first-parent --no-renames --raw` for the file's paths. At a rename commit the walk moves
  to the old path (a pure move is skipped). A deletion is listed `deleted: true` and the walk goes on.
  A rename-away ends the walk. `gitFileHistory` (`GitVersion.deleted`), `gitAssetHistory`
  (`AssetCommit.deleted`; `working` from `workingNames`), and `gitScreenshots` (per file: disk, index
  and HEAD files, plus files deleted from the folder as it was, through `folderMoves`; returns
  `ended`) all use it. `gitBlob(cwd, sha, path?)` serves the blob with `cat-file --filters`, falling
  back to the stored blob. `onDiskIs(abs, sha)` accepts the raw name or the clean-form name. Caches:
  `historyCacheSizes()`.
- **`server/historyJournal.ts`**: `gitBlobSha(buf, format)`, `objectFormatSync(dir)`; the screenshot
  scan hashes in the repository's width and re-hashes a kept hash of the other width without logging.
- **`server/catalogueDiff.ts`**: `Lru` and `memo` from gitCore; worktree blob names from
  `workingNames` (R-72); `withToday` applies today's artifacts on every response, outside the memo
  (R-74); `count` reads the kept result; the three `priorDirs` share one `moveContext` (R-161).
- **Touch rights:** `server/cataloguePlugin.ts` (`serveHistoryBlob`: the `?src=` case is gated by
  `blobWasAt`; served with filters; disk fallback by `onDiskIs`. `blobWasAt`: `onDiskIs`, its cache an
  Lru reported to `historyCacheSizes`). `server/catalogueApi.ts` passes `screenshotsEnded` into the
  timeline input, and the screenshot catch returns `ended: []`. `shared/history.ts` gains the
  optional fields.

## Cache keys and bounds (D-07 a, b)

| Cache | Key | Bound |
|---|---|---|
| file versions | top, HEAD, parser, the path chain | 256 |
| asset commits | top, HEAD, path chain | 128 |
| screenshot commits | top, HEAD, card, files, starts, paths | 128 |
| rename log | top, HEAD | 4 |
| staged renames | top, HEAD, index identity | 8 |
| working-name hashes | top, path, size, mtime (ns), inode | 512 |
| blob checks (route) | sha, path (true answers only) | 2000 |
| repository tops / formats / index paths / empty trees | folder or top | 64 each |
| Diff caches (unchanged) | as before | 4 to 4096 |

Unstaged pairs are read afresh on every read (one `ls-files --deleted`; `--others` and hashing only
when something tracked is missing). The whole move context is shared while in flight.

## Fixture scenarios and before-runs (convention 13)

`tests/gitReader.test.ts` (60 tests after review) with `tests/gitFixture.ts` (SHA-1 and SHA-256 repositories,
linked worktrees, merges, a `git` shim on PATH that logs calls and can fail the rename log). Each
format runs R-23 (a to e; e against a `rev-list --first-parent` + `diff-tree` truth), R-24 (with
`core.quotePath` at its default and false), R-69 (main checkout and linked worktree), R-70, R-71,
R-72 (autocrlf, `eol=crlf`, a clean filter), R-73 and R-54 support (a to e). Then B08-Q3 (SHA-256 only),
B08-Q6, R-161 (three), R-74, R-162, the `?src=` gate, B08-Q2 (smudge) and REQ-02.5 (a newline in a
name).

**Before:** the same test files against `git archive f3c7d9f8` of the board in the scratchpad: 49 of
59 fail. The 60th, the `Lru` eviction unit test, fails there on import (no `gitCore.ts`), so the run used
a variant without it. The 10 that pass:
- preservation checks: fast-forward merge (both widths), branch switch and stash (both widths), the
  retried rename read, and no repository;
- non-ASCII folder with `core.quotePath=false` (both widths: the old parser read unquoted paths; the
  default setting fails);
- SHA-1 whole-catalogue screenshot move;
- SHA-1 R-73.
**After:** 60 of 60 pass.

LFS: git-lfs is not installed here; the clean and smudge filter fixture stands in (REQ-05, B08-Q2).
Real LFS remains a manual check.

## Timings and manual checks (real repository, read-only)

The SPEC's manual check on the real repository: card `US-01.4.6`, changed by a wave merge
(`fe4e7cc5`), pre-B08 against now:
- **History:** cold 5.5 s before, 2.6 s now; warm 0.12 s, 0.11 s.
- **Diff count (`HEAD` against the files on disk):** 0.29 s before, 0.33 s now.
- **The visible change:** the lane commit "Catch-up Phase 32a" is replaced by the merge "Catch-up
  Phase 38a: merge master (32a)", which carries the same `images` change. No other entry moved.

From lane A's worktree (read-only):
- **Three concurrent Diff counts:** one whole-history rename log.
- **Two card history reads:** no staged rename diff (cached by the worktree's own index).
- **The worktree's index:** untouched.

## Review (convention 15)

Two Sonnet reviewers ran in parallel: completeness and correctness; quality and git correctness.

**Confirmed and fixed** (the four behaviour fixes each have a regression test that fails on the pre-B08
board):
- `status.showUntrackedFiles=no` made an untracked card read as clean. `PRE` now pins it, and
  `status.renames` too.
- An inherited `GIT_DIR`, `GIT_INDEX_FILE` and the like (a dev server started from a hook) pointed every
  read at another repository. `gitEnv` now drops them.
- A path holding `\x1e` split the log parse. `parseRawLog` now reads token by token.
- The working-name cache ignored the conversion config. Its key now holds the repository config,
  `info/attributes`, and the top and the file's own `.gitattributes`.
- A `"`-leading path broke `hash-object --stdin-paths`; such paths are now named one at a time.
- Long path lists (a mass `mv`) could overflow the command line; they now go to git in slices of 500
  (`inChunks`).
- Smudging an LFS pointer from a request could reach the network. `GIT_LFS_SKIP_SMUDGE=1` is now set, so
  an LFS version is served as its pointer (the B08-Q2 fallback).
- Tidying:
  - one synchronous object-format helper, in `gitCore.ts` (the journal's own copy removed);
  - an unused `objectFormat` removed;
  - the `git` alias in catalogueDiff and the doubled `--literal-pathspecs` in the plugin removed;
  - `i18n.logOutputEncoding` pinned.
- The R-162 test could not fail. It now has an LRU eviction proof (order and bound over 200 keys).

**Recorded, not changed:**
- Clean filters run when a changed file is named, as `git add` would run them. git-lfs writes under
  `.git/lfs/objects`, never the index or refs. Documented in the `gitCore.ts` header.
- The working-name cache does not watch global config or another folder's `.gitattributes`.
- Costs per read:
  - one `ls-files --deleted` on every read (D-07(a));
  - the whole-history rename log re-run per HEAD, as before B08;
  - negative blob checks not cached;
  - the first-seen screenshot hashed twice by the route.
- `parserId` keys by function identity (every caller passes a stable function).
- An unstaged move that also changes the basename under line-ending conversion is not paired. The
  size filter compares the raw size; such a move shows once staged.
- git's own `-M` can pair a deleted card with a similar new one in one commit, which gives no deletion
  bound. That is the same case as REQ-11.4, left to B05-REQ-20.

**Not reproducible:** none.

**Timeouts.** Under load averages of 20 to 27, `verify:board` timed out at 5 s in
`gitHistory.test.ts`, `historyJournal.test.ts` and `catalogueDiff.test.ts`; each passes alone. The
readers run one more git process per read than before. These B08-territory test files now set a 60 s
test timeout, as `gitReader.test.ts` does.

## Recovery

Read paths and in-memory caches only; no catalogue data or file format changes. The journal writes new
screenshot hashes in the repository's width; on SHA-1 (every catalogue today) nothing changes.
Reverting the phase commit restores the old readers.

## Handoff

See the B08 entry in PROGRESS.md (contracts for B05 and B09).
