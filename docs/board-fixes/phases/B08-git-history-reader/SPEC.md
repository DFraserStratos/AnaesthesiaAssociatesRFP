# Phase B08: Git history reader

**Status:** PLANNED

**Requirements:** R-23, R-24, R-69, R-70, R-71, R-72, R-73, R-74, R-161, R-162, from
[FINDINGS.md](../../FINDINGS.md) ("Findings in detail", `#### R-nn`), and systemic issue 3 ("The
card, sidecar, screenshot and asset history readers skip the careful git handling that
catalogueDiff uses"). PLAN outcome 5: "History is right: first-parent, rename-aware within bounds,
safe for any filename and either hash width, and cached with limits." PLAN's B08 row: B08 "owns
cutting history at a deletion"; PROGRESS accepted decision 4: R-54's "history cut by B08's
deletion bound (B05 closes)".

**Owns:**
- Correct git history for cards, question and artifact sidecars, artifact files and card
  screenshots: which commits are listed, what each one changed, and which earlier paths count.
- Rename discovery (committed, staged and, per D-07, unstaged) with each earlier path bounded by
  the commit that moved the file (the **rename bound**).
- The **deletion bound**: the readers expose where a path's history ends at a deletion, so a later
  record at that path does not inherit it (B08-REQ-11). B05 applies it to close R-54.
- Blob names for files on disk in git's own (clean) form, in SHA-1 and SHA-256 repositories,
  including the screenshot hashes in `server/historyJournal.ts`.
- The caches of all of the above, and the artifact-context part of the Diff review's cached
  commit-to-commit comparisons.
- Deferred decision **D-07** (git reader contract: cache key and bounds, SHA-256, unstaged moves,
  deletion and rename bounds).
- The behavioural contract B05 and B09 build on (see "Dependencies and handoffs"), including any
  optional fields B08 adds to `shared/history.ts` for B09.
- The investigation of `git status` index-lock contention in lane worktrees (B08-Q6, answered).
- A disposition for each of the ten owned findings.

Territory (PLAN.md): `server/gitHistory.ts`, `server/gitRenames.ts`, the git-reading side of
`server/catalogueDiff.ts`, history hashing in `server/historyJournal.ts`, and optional fields in
`shared/history.ts`. Under convention 11 (touch rights), B08 makes minimal edits in other phases'
files where a fix needs them (`cataloguePlugin.ts` blob route, `catalogueApi.ts` history routes
if signatures change) and names them in its PROGRESS entry.

**Excludes:**
- How timelines and diffs are built and drawn: `buildTimeline` and the rest of `shared/history.ts`
  beyond optional fields, `shared/proseDiff.ts`, `src/diff/*`, `HistoryView`, `VisualCompare`
  (**B09**, and B10 for viewers). B08 makes the input right; B09 decides how it is shown.
- R-54's ID rule, journal handling (setting the journal aside on a delete) and applying the deletion
  bound to the timeline (**B05**, which closes R-54 under D-05).
- The request guards, static-file rules, symlink rules and 404 answers in
  `server/cataloguePlugin.ts` (**B01**, R-04, R-22, R-35), and its watcher (**B07**).
- Per-record load isolation in `server/historyJournal.ts` (**B03**, R-49), its ID-reuse handling
  (**B05**), sync (**B07**, R-158) and first-sight timestamps (**B09**, R-87); screenshot change
  events (**B07**, D-10; consumed by **B09**, R-96).
- Write routes in `server/catalogueApi.ts` (**B05**).

**Depends on:** B03 (`historyJournal.ts`), per PLAN.md. In the serial order B08 runs after B01,
B02, B03 and B04 and before B05. Gates before build: D-07 resolved and recorded in PROGRESS.md;
D-05, with B05-Q2 and B05-Q3 (restore versus reuse), settled and recorded in a B05 planning
conversation (planning-only gate, PROGRESS accepted decision 8), because the deletion bound must
fit the ID rule.

**Unblocks:** **B05** (deletion bound and D-07; B05 applies the bound to close R-54). **B09** (the
timeline and diff inputs below, and D-07).

**Binding constraints:** PLAN.md "Binding constraints" and PROGRESS.md conventions 1 to 14, in
particular: existing stack only (Node >= 22.18, TypeScript, Vitest; new dependencies only with a
recorded reason); board code stays project-generic (no knowledge of this repo's layout); finish
green with `npm run verify:board`; version bump and CHANGELOG entry; touch rights (11); doc lines
listed under "Doc facts" (12); every proof fails before the fix (13); no staging mid-phase; commit
and merge, never push. Further, inherited from the code's own stated contract (`gitHistory.ts`
header): history reading is read-only and asynchronous, and no git, or a folder outside a
repository, reads as no history rather than an error. Live build lanes run their own dev servers in
linked worktrees (`-laneA`, `-laneB`, `-U2`, `-U3`), so every requirement holds in a linked
worktree as well as the main checkout.

## Objective and outcomes

The board shows a card's, an artifact's and a screenshot's past from git, and the Diff review
compares any two states. The Diff review's reader (`catalogueDiff.ts`) already walks first parents,
parses NUL-delimited output and handles both hash widths. The other readers do not. With two build
lanes merging into master every wave, they now show false reverts, lose history for any non-ASCII
path, mix one file's history into another's, report phantom changes under line-ending conversion,
show nothing in SHA-256 repositories, and keep growing caches that are not shared between
concurrent requests.

When B08 is delivered:

1. Every history reader answers from HEAD's first-parent chain, comparing each commit with its
   first parent, so the version list's neighbours are true before-and-after pairs.
2. Any filename git can store gets the same history as an ASCII one, whatever `core.quotePath` is.
3. An earlier path belongs to a file only up to the commit that moved it, a path's history is
   marked where a deletion ended it, and a screenshot's history follows that one file, not its
   whole folder.
4. Moves made in the working tree are reflected as D-07 decides, and nothing read before a move is
   staged or committed stays cached as stale.
5. A file on disk is named as git would store it (line-ending and filter rules applied), in either
   hash width, so an unchanged file never reads as changed.
6. Cached comparisons never carry a stale reading of today's artifacts.
7. Identical concurrent reads share one git run, caching works in linked worktrees, and every
   cache has an upper bound.

## Sources and current-state evidence

All evidence was checked at HEAD `d4341735` (board 1.12.3). None of the territory files has
changed since the review (`git log` shows the last edits at f53a2471 and earlier), so the
FINDINGS line numbers still hold. Each finding was reproduced in scratch repositories by calling
the real functions (scripts and repos under the B08 scratchpad folder).

| Finding | Where at HEAD | Reproduced at HEAD |
|---|---|---|
| R-23 | `gitHistory.ts:138` (plain `git log`, no `--first-parent`); consumer `shared/history.ts:259-271` diffs list neighbours | Yes. Lane sets description, main sets title, `--no-ff` merge. Versions list `merge, main title, lane desc, add`; the timeline shows "main title" changing the description D1 to D0 (false revert) and the merge re-applying it. |
| R-24 | `gitHistory.ts:138/147`, `:183/189-191`, `:236/246-247`; `gitRenames.ts:22-26, 38, 51` (no `-z`) | Yes, with a correction. `Transcript – café.md` edited twice: 0 asset commits. `café.png` screenshot src reads `assets/US-01.1.1/caf\303\251.png"`. A card in a non-ASCII folder that **never moved** still gets its history (the reader falls back to today's path), so "empties every card history" does not hold for that case. A non-ASCII folder that **moved** loses every pre-move version and lists the pure move as a change. |
| R-69 | `gitRenames.ts:51` (`git diff -M HEAD` sees no untracked paths); cache keys `gitHistory.ts:133, 178, 231` | Yes. Folder moved with plain `mv`: 0 versions. After `git add -A` the same read still returns 0 (cached under HEAD only), which also confirms R-23's "also" about staged moves. |
| R-70 | `gitRenames.ts:58-67` (prior paths over all history); `gitHistory.ts:137, 235`; `cataloguePlugin.ts:246` | Yes. After `pricing.svg` is archived to `pricing-v1.svg` and a new `pricing.svg` added and edited, the archive's history lists `edit v2, add v2, add v1`. The reverse also holds: the new `pricing.svg` lists `add v2, archive (removed), add v1`. |
| R-71 | `gitRenames.ts:70-81` (`priorDirs`); `gitHistory.ts:182-192` | Yes. After `b.png` moves from `US-1` to `US-2`, US-2's history lists both recaptures of US-1's `a.png`, as `assets/US-2/a.png`. |
| R-72 | `catalogueDiff.ts:313-325` (raw bytes hashed); `gitHistory.ts:87, 221` | Yes, for `core.autocrlf=true`. An artifact whose sidecar alone was edited shows `fileBefore` and `fileAfter` differing; `gitAssetHistory` reports `head` and `working` differing while `dirty` is false. LFS was not reproduced (git-lfs is not installed here). Record files are not affected: a CRLF card reads as unchanged. |
| R-73 | `gitHistory.ts:189, 246` (40-hex only), `:221` (SHA-1 working hash); `historyJournal.ts:41, 107` | Yes. In `git init --object-format=sha256`, asset history and screenshot history return 0 commits; `head` is 64 hex but `working` is 40 hex. |
| R-74 | `catalogueDiff.ts:626-633` ("today" read once), key `:706`, memo `:716` | Yes. A..B compared, AR-01 renamed on disk, `touched()` called: the cached result's `context.artifacts` is still empty (same object), while a fresh reader returns AR-01 with its old title. |
| R-161 | `gitRenames.ts:30-41` (values cached, not promises), `:42-53` (`.git/index` stat); `catalogueDiff.ts:183` (three parallel `priorDirs`) | Yes, by code reading and a linked-worktree check: `statSync(<worktree>/.git/index)` fails with ENOTDIR, so the uncommitted rename diff is never cached there. `git rev-parse --git-path index` names the real index. |
| R-162 | `gitHistory.ts:111, 165, 214`; also `gitRenames.ts:30, 32` | Yes, by code reading: plain Maps keyed by HEAD, never evicted. `catalogueDiff.ts` already has a bounded `Lru` and a promise `memo` (`:61-93`). |

Other facts relevant to the contract:
- The version list includes a deletion as a version with `item: null`, and nothing marks it as
  the end of a record's life. Checked at HEAD: add, delete, re-add a different card at the same
  path gives `readd (New card), delete (null), add (old title)`, read by `buildTimeline` as one
  card's history (R-54).
- Existing tests: `tests/gitHistory.test.ts` (moves before and after commit, move plus edit, artifact
  files and screenshots across moves, never-moved card), `tests/historyJournal.test.ts` (dirty
  flag, screenshot rewrite and blob read-back, outside a repository), `tests/catalogueDiff.test.ts`
  (accents, SHA-256, first-parent merges, folder moves, recodes, reader caching). No test covers
  merges, non-ASCII paths or SHA-256 for the four non-Diff readers.
- The real catalogue has no non-ASCII paths today and is SHA-1, so R-24 and R-73 are latent here.
  The kit is generic, though, and SHA-256 support is claimed elsewhere (`OBJECT_SHA`, `emptyTree`).
- User configuration such as `log.follow` and `color.ui=always` did not change results in a check;
  `core.quotePath` (default on) is the setting that breaks parsing.
- Paths with glob or pathspec-magic characters (`Notes [d].md`, `:(top)x.md`, `a*.md`) gave correct
  asset history at HEAD, because the readers filter by exact path afterwards. catalogueDiff passes
  `--literal-pathspecs`.
- Real repository scale: 261 commits on HEAD, 8 merges; the whole-history rename log takes about
  0.9 to 1.5 s, so running it three to six times at once (R-161) is noticeable.

Assumption (not verified): merges in lanes are mostly `--no-ff` or fast-forward merges of
`lane/*` into master. The requirements below hold for either.

## Detailed requirements

Wording: a **reader** is any of the card or sidecar history, screenshot history, artifact-file
history, rename discovery, the history-blob route's earlier-path check, and the Diff review's
git reading. A **fixture repository** is a throwaway repository built for a test.

### B08-REQ-01 · First-parent history (closes R-23)

1. Card and sidecar versions, artifact-file commits and screenshot commits list only commits on
   HEAD's first-parent chain. Each change is measured against that commit's first parent.
2. A merge that changed the file relative to its first parent is listed once, as the merge, with
   the content after the merge. Commits reached only through a merge's second parent are not
   listed as separate entries (attribution of a merge to its lane commits is B08-Q1). A
   fast-forward merge puts the lane's commits on the first-parent chain, so they are listed
   individually.
3. A merge that left the file as its first parent had it is not listed.
4. Consequently, for every adjacent pair in a version list, the older entry is the file's state at
   the newer entry's first parent. A consumer that diffs neighbours (B09's `buildTimeline`) then
   shows only real changes.
5. Rename discovery walks the same commits with the same merge rule, so a move made on a lane is
   dated at the merge that brought it in.
6. The Diff review's commit list already follows this rule and must keep doing so.

### B08-REQ-02 · Any filename, any quoting setting (closes R-24)

1. Every reader gives a file whose path has non-ASCII letters, spaces, quotes, backslashes, tabs,
   glob characters or a leading colon the same history it gives an ASCII-named file in the same
   situation. This includes a non-ASCII **folder** that has moved.
2. Results do not depend on `core.quotePath` (default or `false`) or on other display settings
   that change git's path quoting.
3. Screenshot entries name the file exactly (no escape sequences, no stray quotes).
4. Paths are given to git literally, never as patterns, as catalogueDiff does now.
5. A path that git's line-based batch protocols cannot carry (a newline in the name) leaves that
   one file without history. It never yields another file's history and never fails the request.

### B08-REQ-03 · Renames bounded by commit, screenshots per file (closes R-70, R-71)

1. Every earlier path is tied to the commit that moved the file away from it. Commits at that
   earlier path count for the file only at or before that commit.
2. The other side of the same bound: when a file is renamed away from a path and a different file
   is later added at that path, the new file's history starts after the rename. It does not list
   the old file's commits or the rename as its removal. Deletion followed by re-adding a path is
   the deletion bound, B08-REQ-11.
3. A rename chain (A to B to C) is followed segment by segment, each segment bounded.
4. Screenshot history follows each screenshot file through its own renames, bounded as above. A
   card's screenshot history lists rewrites of the files that are, or were, that card's files,
   and never rewrites of files that only shared a folder with one of them.
5. When a whole folder moves (the requirements folder, `assets/`, or a card's screenshot folder),
   every file in it keeps its pre-move history. This must keep working (see REQ-10).
6. A screenshot entry names the file by its current path under the card's folder (`assets/<ID>/<name>`),
   as now, so the history-blob route can serve both blobs.
7. The history-blob route's "was this blob ever at this path" check keeps accepting a blob from
   any earlier path of the file. Whether it should apply the same bound is B08-Q5; it must not
   become stricter than the history it is asked to serve.

### B08-REQ-04 · Working-tree moves and freshness (closes R-69, and the "also" in R-23)

Unconditional:
1. A move staged with `git mv` or `git add` is followed before it is committed, as now.
2. No history read is cached across a change to the index or to which files exist. After staging,
   unstaging or committing a move, the next read reflects it. Nothing read before a move is
   staged stays stale until the next commit.
3. In a linked worktree the same holds, using that worktree's own index.

Conditional on D-07 (what a caller gets for an unstaged move):
4. Either the reader follows a move made with plain `mv` that git has not been told about (at
   least for files whose content did not change), so the moved card shows its history; or the
   response says explicitly that the file has no recorded history because it looks newly added,
   so the UI can say so rather than show a silent "added". The chosen behaviour is proven by the
   R-69 scenario.

### B08-REQ-05 · Working files named in git's clean form (closes R-72)

1. The blob name the board gives a file on disk is the name `git add` would give it in that
   repository: line-ending conversion (`core.autocrlf`, `.gitattributes` `text` and `eol`) and
   configured clean filters (LFS and others) applied.
2. This covers the Diff review's worktree side (`fileBefore`/`fileAfter` against the disk) and
   artifact-file history's `working`. An unchanged file under conversion never reads as changed,
   and `working` equals `head` when git says the file is clean.
3. A blob name reported for a file on disk can be fetched through the history-blob route while
   the file still has that content (today the route's on-disk fallback hashes raw bytes,
   `cataloguePlugin.ts:205-209, 262`).
4. Content served for a historical blob of a filtered path (an LFS pointer) is B08-Q2. Until it is
   decided, a pointer is never reported as a change to the file's content.

### B08-REQ-06 · Both hash widths (closes R-73)

1. In a SHA-256 repository, every reader gives the same results it gives for the same history in
   a SHA-1 repository: artifact-file and screenshot history, working blob names, and the
   history-blob route.
2. Object names of either width are recognised everywhere the readers parse them.
3. Working-file hashes use the repository's own object format, found from the repository, never
   assumed.
4. Screenshot changes the journal records (`historyJournal.ts:41, 107`) carry blob names the
   history-blob route can serve in that repository. How existing journal entries written with the
   wrong width are treated is B08-Q3.
5. `artifactFiles.ts` uses the same SHA-1 helper as a cache-busting `fileRev`, not as a git name.
   It need not change, but must keep working if the helper changes.

### B08-REQ-07 · Cached comparisons read today's artifacts afresh (closes R-74)

1. The artifact context of a commit-to-commit comparison (the artifacts that "read differently
   then" than today) reflects the artifacts on disk at the time of each response, not at the first
   read. After an on-disk change reported through `touched()`, the next response is current.
2. The expensive git work for a commit-to-commit comparison stays cached (commits never change).
3. Comparisons with the disk keep their present generation behaviour, watched and unwatched.

### B08-REQ-08 · Shared in-flight reads, caching in worktrees (closes R-161)

1. Identical reads made at the same time share one git run. In particular the Diff review's count
   refresh, which asks for three record folders' earlier paths at once, runs the whole-history
   rename discovery at most once per repository state, not three to six times.
2. A failed read is not kept; the next request tries again.
3. Uncommitted rename data is cached between reads while the index and the working tree are
   unchanged, in a linked worktree as in the main checkout. The index is located through git, not
   assumed at `.git/index`.
4. Candidate (FINDINGS): limit the uncommitted rename diff's pathspec. Only acceptable if moves
   from outside the catalogue into it (a transcript moved into `artifacts/files/`) are still found.

### B08-REQ-09 · Bounded caches (closes R-162)

1. Every cache in the territory (file, screenshot and asset history; committed and uncommitted
   renames; comparison sides and indexes) has an upper bound on entries, and entries for a HEAD
   that has moved on can be evicted.
2. A long session with many commits (a lane wave) does not grow these caches beyond their bounds.
3. The bound values and the cache key are part of D-07.

### B08-REQ-10 · Preserved behaviour (must not regress)

1. Outside a repository, with no git, or with no commits yet: no history, never an error or a
   500. Readers stay asynchronous and never block the dev server.
2. A commit that only moved a file (same content, new path) is not a change to it; a move that
   also edited the file is one change (`gitHistory.test.ts`).
3. History reaches back past a renamed subfolder and past the whole requirements folder moving,
   before and after the move is committed (`gitHistory.test.ts`).
4. Deletion versions stay visible: a deletion stays in the card or sidecar version list as a
   version with no record (`item: null`), at its commit, and carries the deletion bound
   (B08-REQ-11), unless D-07(e) has the reader return only the current segment, in which case
   the response still says that earlier segments exist.
5. `dirty`, `working`, `mtime`, `head`, `layoutDirty` and `screenshotsDirty` keep their meaning.
6. Everything `tests/catalogueDiff.test.ts` proves today: first-parent commit list with parents,
   accents, SHA-256, folder moves (with a record folder renamed), recodes read as today's codes,
   untracked files, unreadable records, artifact files anywhere in the repository, the reader's
   sharing and generation caching, and repositories with no commits.
7. Readers never write to the repository, its index or its refs (see B08-Q6 for `git status`).
8. The API shapes the client reads (`GitFileHistory`, `AssetHistory`, `ScreenshotCommit`,
   `CommitsResponse`, `DiffResponse`) stay compatible. New information is added as optional
   fields. A field B08 adds to `shared/history.ts` or `shared/diff.ts` (the deletion bound, an
   unstaged move marker under D-07) is recorded in the PROGRESS entry for B05 and B09.
9. The board stays project-generic: no reader knows this repository's folder names.

### B08-REQ-11 · Deletion bound (serves R-54; B05 applies it and closes R-54)

1. For a card or sidecar, an artifact file and a screenshot file, the readers expose each point on
   HEAD's first-parent chain where the path's history was ended by a deletion (a commit after which
   the file is absent, having been present at its first parent). A record later added at the same
   path starts a new segment after that point.
2. The bound is exposed in a way B05 can apply without reading git again: either as optional data
   on the history responses (which versions belong to the current segment, or where the last
   bound is) or by the reader returning the current segment only, with a marker that earlier
   segments exist. Which one is D-07(e).
3. Whether a re-added file that restores the deleted record (a revert of the deletion) continues the
   old segment or starts a new one follows the D-05 answer with B05-Q2 and B05-Q3, recorded before
   B08 builds. The reader gives enough to tell them apart under the chosen rule (both the deleted
   version and the re-added version stay readable).
4. Only committed deletions on the first-parent chain count. A branch switch, a checkout or a
   `git stash` that removes and restores files in the working tree creates no bound.
   Reuse without a committed deletion produces no deletion bound, by design. In that case a card is
   deleted, a new card is created with the same ID, and one commit records the change as an edit
   of the path. Git sees an edit, so the readers report the old card's versions followed by the
   new one with **no bound**. They do not guess, and they report the same before and after that
   commit. B05 receives no bound for this case. Cutting history here, on the git side as well as
   in the journal, is owned by B05-REQ-20.
5. The rename bound (B08-REQ-03) and the deletion bound use one rule for where a segment starts,
   so a path renamed away and a path deleted are both bounded, each as itself.

## Dependencies and handoffs

**Consumes:** B03's per-record load isolation in `historyJournal.ts` (hard dependency, PLAN.md);
whatever B01 leaves in `cataloguePlugin.ts` (guards, 404 on a missed history blob, earlier in the
serial order); the D-05 answer with B05-Q2 and B05-Q3, recorded by a B05 planning conversation
before B08 builds (shapes B08-REQ-11.3).

**Produces, for B09** (the behavioural contract, stated in the PROGRESS entry):
- Version, asset-commit and screenshot-commit lists are newest first along HEAD's first-parent
  chain. Adjacent entries are first-parent before-and-after pairs (REQ-01.4). Order is graph order.
  Author dates on a first-parent chain can still be out of order after a rebase or cherry-pick, so
  B09 should not assume the dates are sorted.
- A merge entry carries the merge commit's own metadata (subject, author, date).
- A deletion is a version with no record and carries the deletion bound (B08-REQ-11, exposed as
  D-07(e) decides). Pure moves are absent.
- Screenshot entries name files by their current path under the card's folder. Blob names are in
  the repository's width and fetchable through the history-blob route.
- Whatever D-07 decides for unstaged moves, including any new optional field and what it means.
- Freshness: a read after the index or the working tree changes reflects the change. The cache
  never needs a client-side bust.

**Produces, for B05:** the deletion bound (B08-REQ-11) and the D-07 contract, so B05 can apply
the bound in its journal step and the timeline cut without reading git again, and close R-54.
The PROGRESS entry states exactly how the bound is exposed and how a restore is treated under
D-05. The contract states plainly that a reuse with no committed deletion (delete, re-create the
same ID, one commit records an edit) comes with no bound. B05-REQ-20 cuts history for that case
by its own means.

**Integration proof owner:** B08 proves its readers with fixture repositories. B09 proves the
timeline and Diff UI on top. B15 owns programme integration.

No new module, function name or data structure is mandated here. Whether the readers share one
module, and how its API looks, is the execution agent's choice. The observable obligation is that
every reader applies the same rules (REQ-01 to REQ-06) and passes the same scenarios.

## Acceptance and evidence

Unconditional proof obligations: one fixture-repository scenario per finding, run against the real
reader functions. Every proof must fail on the code before the fix and pass after it (convention
13); the failing run is recorded in IMPLEMENTATION.md. All scenarios also run in a SHA-256 fixture
where git supports it.

| Finding | Scenario that must pass |
|---|---|
| R-23 | (a) `--no-ff` merge: lane edits the description, main edits the title. Card versions list `merge` and `main title` but not the lane commit as its own entry, and no adjacent pair shows the description reverting. (b) The same with a fast-forward merge: the lane commit is listed. (c) A merge whose resolution differs from both parents is one change from its first parent. (d) An asset and a screenshot rewritten on a lane and merged: one entry at the merge, and no master commit appears to remove the lane's file. (e) Each reader's result is checked against `git log --first-parent --diff-merges=first-parent` for the same paths. |
| R-24 | With `core.quotePath` at its default and at `false`: `Transcript – 12 Nov.md` and `café.png` edited twice give two asset commits and two screenshot rewrites, with `src` exactly `assets/<ID>/café.png`. A non-ASCII requirements folder moved with `git mv` keeps every pre-move version and does not list the pure move. Quotes, backslashes and a tab in a name behave the same. |
| R-69 | A folder moved with plain `mv`: before staging, the result D-07 chose. After `git add -A`, without a commit, the full history (proves no stale cache). After unstaging, the D-07 result again. Repeated in a linked worktree. |
| R-70 | `pricing.svg` archived to `pricing-v1.svg`, a new `pricing.svg` added and edited. The archive lists only its own commits (`add v1`); the new file lists only `add v2` and its edit. A three-step chain A to B to C follows each segment. |
| R-71 | `b.png` moved from `US-1` to `US-2`, then US-1's `a.png` recaptured. US-2 lists only `b.png`'s own rewrites. US-1 still lists `a.png`'s. A whole card folder moved keeps all its files' history. |
| R-72 | With `core.autocrlf=true`, with `.gitattributes` `* text eol=crlf`, and with a fixture clean and smudge filter driver standing in for LFS: a sidecar-only edit shows no file change in the Diff review; artifact-file history reports `working` equal to `head`; the history-blob route serves the reported working name. Real LFS is proven too if git-lfs is available, or recorded as a manual check. |
| R-73 | In `git init --object-format=sha256`: artifact-file and screenshot history give the same commits as the SHA-1 fixture; `working` and `head` are 64 hex and equal when clean; a screenshot change the journal records can be fetched through the history-blob route. |
| R-74 | A..B compared through a watched reader, AR-01 renamed on disk, `touched()`: the next A..B response names AR-01's old title in its context, equal to a fresh reader's. The commit-to-commit git work is not repeated (shown by a spawn count or equivalent). |
| R-161 | With git invocations counted: the three concurrent earlier-path reads behind a Diff count run whole-history rename discovery once. In a linked-worktree fixture, a second identical read with no index or working-tree change runs no uncommitted rename diff. A failed read is retried. |
| R-162 | With many commits and a read after each, every territory cache's entry count stays at or below its bound. |
| R-54 support (B08-REQ-11; B05 closes R-54) | (a) Add card US-01.1.6, commit; delete it, commit; add a different card at the same path, commit. The history response exposes the deletion bound at the delete commit and the re-added card's segment starts after it; the deletion version stays listed (or, under D-07(e) "current segment only", the marker says earlier segments exist). At HEAD nothing marks the bound, so the proof fails first. (b) The same for an artifact file and a screenshot file. (c) Delete, commit, then restore the same record by reverting the deletion: the result D-05 with B05-Q3 chose. (d) A branch switch and a `git stash` that remove and restore the file create no bound. (e) A rename-away and a deletion at the same path are each bounded (shared rule with R-70). |

Prohibited regressions: every existing test in `tests/gitHistory.test.ts`,
`tests/historyJournal.test.ts`, `tests/catalogueDiff.test.ts`, `tests/api.test.ts` and
`tests/artifacts.test.ts` passes unchanged in meaning (REQ-10). A test may only be reworded where
D-07, D-05 or B08-Q1 changes the documented shape, and the change is recorded.

Manual check (recorded in IMPLEMENTATION.md): on this repository at master, open a card that was
edited in both lanes of a past wave and confirm its History tab shows no false revert; open the
Diff tab from a lane worktree and confirm counts refresh without repeated whole-history runs.

Awaiting a decision: the exact R-69 result (D-07(d)); the cache bounds checked in R-162 (D-07(b));
how the deletion bound is exposed (D-07(e)) and the restore case (D-05 with B05-Q3); the R-72 LFS
content scenario (B08-Q2); the journal-migration behaviour in R-73 (B08-Q3).

## Deferred decisions for execution planning

Register: [PROGRESS.md](../../PROGRESS.md) "Deferred decisions". Resolve in B08's implementation-planning
conversation, with the user where needed, before build.

### D-07 · Git reader contract

- **Source/gap:** FINDINGS systemic issue 3, R-54, R-69, R-73, R-161, R-162. Affects REQ-04,
  REQ-06, REQ-08, REQ-09, REQ-11. **Owner:** B08. **Depends on it:** B05 (deletion bound), B09
  (timeline and diff inputs). **Gate:** before B08 builds; (e) must also fit the D-05 answer,
  recorded before B08 builds.
- **(a) Cache key.** Options: (1) HEAD plus the index's identity (path from git, plus its
  modification time and size) plus the uncommitted rename set; (2) HEAD only, invalidated by the
  dev server's watcher (`touched()`), with scripts and tests reading uncached; (3) no caching of
  anything that depends on the working tree, cache only commit-derived data. Option 1 works
  without the watcher and in linked worktrees but costs a stat or git call per read. Option 2 is
  cheapest, but ties B08 to B07's watcher, and edits outside watched folders (a transcript moved
  in from `docs/`) are missed. Option 3 is simplest and correct but repeats the uncommitted diff on
  every read (the R-161 cost in worktrees).
- **(b) Bounds.** Options: keep only the current HEAD's entries; a fixed-size least-recently-used
  bound per cache, like catalogueDiff's `Lru`; or both. The number matters for lanes where three or
  four boards run at once.
- **(c) SHA-256.** Options: detect the object format once per repository and hash in process with
  that algorithm (fast, but does not apply clean filters, so R-72 needs a separate path); hash
  working files through git so filters and format both come from git (correct for R-72 and R-73
  together, but costs a subprocess); or a hybrid that uses the index's blob name when git reports
  the file clean and hashes through git only for dirty files. Also decide whether the journal
  stores the object format with each screenshot hash.
- **(d) Unstaged moves.** Options: (1) pair files missing from the working tree with untracked
  files of identical clean content and treat each pair as a rename (content-identical only);
  (2) also detect edited moves by similarity, computed without touching the real index (for
  example with a temporary index), which costs more; (3) do not follow; mark the response so the
  UI can say "moved, not yet recorded in git" (needs B09 to show it); (4) Won't fix (user
  accepted): document that history appears once the move is staged. Each option changes the R-69
  acceptance result and possibly an optional field in `shared/history.ts`.
- **(e) Deletion and rename bounds.** How the bound reaches B05 and B09. Options: (1) the history
  responses carry the whole list plus optional bound data (where each segment starts), and B05
  cuts in `buildTimeline` and its journal step; (2) the reader returns only the current segment,
  with a marker that earlier segments exist; (3) the reader takes an option and does either.
  Option 1 keeps the reader neutral and leaves the restore-versus-reuse rule wholly with B05, but
  every consumer must apply the bound. Option 2 makes the safe answer the default, but a restored
  record (B05-Q3) needs the reader to know the D-05 rule. Option 3 serves both at the cost of a
  wider contract. Applies equally to rename bounds (REQ-03).

### B08-Q1 · Attributing a merge to its lane commits
Source: REQ-01.2; R-23's fix makes a lane's work appear as the merge. Should a merge entry also
name the lane commits it brought in (subjects, authors), or is the merge alone enough? Owner: B08,
with B09 for the display. Gate: before B08 fixes the response shape. Default if unanswered: the
merge alone, as the Diff review does now.

### B08-Q2 · LFS and filtered content
Source: R-72 ("an LFS 'before' renders the pointer text"). Should the history-blob route serve a
filtered file's historical content as checked out (smudged), which needs git-lfs installed and the
object present locally, or serve the stored blob (the pointer) and let viewers say so? Owner: B08;
B10 if viewers must show a message. Gate: before B08 build. Impact: REQ-05.4 and its scenario.

### B08-Q3 · Journal hashes written with the wrong width
Source: R-73 (`historyJournal.ts:41, 107`). Existing `<ID>.shots.json` and journal entries in a
SHA-256 repository hold SHA-1 names that git cannot serve. Options: re-hash on next scan and leave
old entries unfetchable; convert on read; or record the format and ignore mismatched entries.
Owner: B08. Gate: before B08 build. No real catalogue is SHA-256 today, so this is about the kit.

### B08-Q4 · Boundary with R-54 (deletion versus rename-away)
Answered (accepted decisions 4 and 10, 2026-11-18): the rename and deletion bounds are both B08's
(B08-REQ-03, B08-REQ-11). B05 owns the ID rule and journal handling, applies B08's bound and
closes R-54. B08 builds before B05.

### B08-Q5 · Bounding the history-blob check
Source: REQ-03.7; `cataloguePlugin.ts:237-282` uses unbounded earlier paths to decide whether a
blob may be served. Should that check use the same bounds? It is an authorisation-style check
(B01's area) and serves blobs the timeline links to. Owner: B08, with B01's D-01 answer. Default:
keep it accepting at least everything the history lists.

### B08-Q6 · `git status` takes the index lock
Answered (accepted decision 10, 2026-11-18): B08 investigates. The readers run
`git status --porcelain` for `dirty`, and git may refresh the index under `index.lock` while
doing so. A board running in a lane worktree could then make an agent's concurrent `git commit` or
`git add` there fail with "index.lock exists". During planning, B08 tries to reproduce this and
records the result against the PROGRESS "Discovered for later" row. If it is confirmed, it is a
breach of REQ-10.7 (readers never write) and is fixed in this phase with a fail-first proof.

## Risks and recovery requirements

- **Shared files, in the serial order** (PLAN.md shared-files table): `historyJournal.ts` B03, then
  B08 (hashing), then B05, B07, B09; `cataloguePlugin.ts` B01, then B08 (blob-route hashing at
  `:205-209, 262`, earlier paths at `:237-282`, if needed), then B07; `catalogueDiff.ts` B02 (only
  if D-02 scopes recodes by commit), then B08, then B09 (R-91 data); `shared/history.ts` B08
  (optional fields), then B05, then B09; `catalogueApi.ts` history routes (`:300-333`) B08 only if
  signatures change, after B01 to B03 and before B05. B08 builds on what B01 to B04 left. Later
  phases inherit B08's shapes and must keep its proofs passing.
- **Visible change in history shape.** After REQ-01, lane commits no longer appear as their own
  entries after a `--no-ff` merge. That is intended, but users will notice it. The CHANGELOG entry
  says so.
- **Cost.** First-parent, NUL-delimited, bounded rename discovery and git-side hashing may cost more
  per read than today's shortcuts. The phase must not make the History tab or the Diff count
  noticeably slower on this repository. Record before-and-after timings for one card history and
  one Diff count in IMPLEMENTATION.md.
- **Stale or wrong caches** are the main way a fix here regresses silently. Every cache must be
  provably keyed on everything its answer depends on (REQ-04.2, REQ-07, REQ-08.3).
- **Live lanes.** Lane worktrees pick up B08 through merges from master. A reader that worked only
  in the main checkout would break the lanes' boards. Every scenario that involves the index runs
  in a linked worktree too.
- **Recovery.** The change is confined to read paths and in-memory caches; no catalogue data or
  file format changes, except journal hashes under B08-Q3. Reverting the phase's commit restores
  the old behaviour. A journal change must leave existing journals readable, and say in the
  CHANGELOG what happens to old entries.

## Execution and handoff obligations

1. Read root `CLAUDE.md`, PROGRESS.md in full, FINDINGS.md for R-23, R-24, R-54, R-69 to R-74,
   R-161, R-162 and systemic issue 3, this SPEC, and the territory code and tests. Re-verify the
   evidence table at the then-current HEAD. Earlier phases (B01 to B04) may have moved lines.
   Confirm B03 is complete and the D-05 answer (with B05-Q2 and B05-Q3) is recorded.
2. Resolve D-07 (including (e) to fit D-05) and B08-Q1 to B08-Q3 with the user, and B08-Q5 using
   B01's D-01 answer. Investigate B08-Q6. Record accepted answers in PROGRESS.md before building.
3. Write `docs/board-fixes/phases/B08-git-history-reader/IMPLEMENTATION.md` before building: the
   approach, resolved decisions, the fixture scenarios (failing first), checks, timings plan and
   recovery. Record each proof's failing run before the fix (convention 13).
4. Build. Do not stage mid-phase (`mv`/`rm`, never `git mv`/`git rm` in the real repo; fixture
   repositories in temporary folders are fine). Do not take ports 5173, 5174, 5180 or 5181.
5. Finish green: `npm run verify:board` from the repo root. Any touched Playwright spec passes on a
   free port.
6. Bump the board version in `requirements-board/package.json` and its lock file: minor, because
   history users see changes. Add a `CHANGELOG.md` entry that names the visible change in merge
   history and any journal-hash behaviour.
7. Run the three review lenses as independent subagents (quality; completeness against this SPEC;
   bugs and correctness, including worktree, merge and cache cases). Verify their findings, fix
   the confirmed ones and re-run verification.
8. Give every owned finding exactly one disposition: **Fixed** (with its scenario test), **Not
   reproducible at HEAD** (with evidence), **Won't fix** (user accepted, with reason; a candidate
   is D-07(d)4 for R-69), or **Moved** (named owner, recorded in PROGRESS.md and both SPECs). Note
   the partial correction to R-24's "empties every card history" claim.
9. Update the doc lines that describe history behaviour this phase changes (README, About page,
   SCHEMA where they mention history, moves or merges), and list every doc line changed under
   "Doc facts" in the PROGRESS entry (convention 12).
10. Write the PROGRESS.md phase entry last: decisions resolved, what shipped, deviations,
   verification, review fixes, dispositions, the B05 and B09 contracts above as actually built
   (the deletion bound's exposure, any new optional fields and their meaning, the cache keys and
   bounds), minimal edits made in other phases' files (convention 11), the B08-Q6 result and Doc
   facts.
11. Commit only this phase's files, by path; merge to master if built on a branch; never push.
