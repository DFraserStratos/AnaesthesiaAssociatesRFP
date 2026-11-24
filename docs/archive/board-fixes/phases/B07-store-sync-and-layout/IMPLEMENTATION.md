# B07 implementation plan

Approved plan for Phase B07 (Store sync and layout), saved before the build. Decisions: accepted decision 21
(D-10, B07-Q5, B07-Q6). Sections "Baseline", "As built", "Recovery" and "Handoff" are added as the build goes.

## Context

Phase B07 of the Board fixes Buildbook. The Requirements Board mirrors the files on disk while people drag
cards and agents rewrite catalogue files in bursts. Six findings are owned: R-40 (unsaved card moves lost on
reload), R-57 (deleted card's position kept in pending saves and undo), R-58 (snapshot overwrites newer
events), R-59 (overlapping layout saves land out of order), R-158 (every file event re-reads the whole
catalogue) and R-159 (one event per record, every card re-rendered). B07 also owns D-10, the asset version and
change signal that B09 (R-96) and B10 (R-104) consume.

**Starting point (verified):**
- I'm already in the board-fixes worktree, on branch `board-fixes`, with a clean tree at `418bd3bd` (B05).
  Master has nothing that `board-fixes` lacks, so no merge is needed. B05 is COMPLETE.
- Findings re-checked at HEAD: all six still reproduce. Line numbers have drifted since `d4341735`:
  - `store.ts`: `load` :108, `applyEvent` :124, `deleteItem` :197, `setPositions` :346, `flushLayout` :373,
    `step` :396.
  - `App.tsx`: reconnect handler :49-53, beforeunload :65-71.
  - `catalogueApi.ts`: notifier :222-247, `syncFromDisk` :974.
  - `cataloguePlugin.ts`: watcher :213-226.
  - `historyJournal.ts`: `screenshots` :133.
  - `ProblemPill.tsx`: doubled prefix :103 (it adds "Card moves not saved:" to a message `store.ts:383`
    already starts with it).
- A write request's delivery is sent (`flush`, `catalogueApi.ts:476`) before its HTTP response.

## Decisions to record first

These go in PROGRESS.md as **accepted decision 21** before any build. The user answered every question in
this session.
- **D-10 = a delivery entry plus the git blob hash.**
  - Each batched delivery carries `assets: { [src]: token | null }`, where `src` is `assets/<ID>/<name>`, the
    form `item.images` uses. `null` means the file was removed. The cards are the `<ID>` segment.
  - The snapshot carries `assets` for every file.
  - The token is the file's git blob hash in the repository's width, the same hash the journal keeps. So a
    touch with no content change keeps the token, and it survives a restart.
  - URL form: `/requirements/assets/…?v=<token>`. B01's route already accepts `?v=` and serves the current
    file for any token.
  - Assets-only deliveries trigger no record update, no rebuild and no `useCatalogueRefresh`.
- **B07-Q5 = check, then report.** A Mapped move in flight at unload keeps its target fields in sessionStorage.
  After the reload: if the move landed, nothing is said; if not, the Card moves group says it was not saved.
  It is never replayed.
- **B07-Q6 = save the moves, then offer Reload; kept moves are same-tab only.**
  - While Offline, the board pings its server every 2 s. When the server is back, kept Freeform moves are
    saved over HTTP at once, and the pill says the server is back and offers Reload.
  - Kept moves live in sessionStorage. A closed tab with unsaved moves still asks first.
- Downstream:
  - B06 reads `hasUnsavedMoves()` in its leave guard.
  - B09 and B10 build on the `assets` slice and `assetUrl(src, token)`.
  - B11 keeps node and `data` reuse.
  - `setLanes`' missing `lanesRev` stays with B11. B07 does no lane work (SPEC exclusion).

## Approach

### Server

**1. One batched delivery (R-159 server; REQ-07.1, REQ-08.1).**
- `shared/types.ts`: replace `CatalogueEvent` with `CatalogueDelivery`:
  `{ epoch, seq, items?, questions?, artifacts?, layout?, config?, issues?, assets? }`. Record maps are
  `id → record | null`.
- `epoch` is a per-process boot ID; `seq` goes up with each delivery.
- `catalogueApi.ts`:
  - The notifier (`pending`, `notify`, `issuesChanged`, `flush`) merges everything into one delivery: one per
    write request, one per sync. B05's one check and one issues event per request (R-26) are kept, and
    `config.revs` and `layout.lanesRev` ride through unchanged.
  - The snapshot (`GET /api/catalogue`) adds `epoch`, `seq` and `assets`.
  - New `GET /api/ping` → `{ epoch, seq }`, for the Offline watcher.
- `cataloguePlugin.ts` sends one `dev.ws.send` per delivery.

**2. Incremental re-sync (R-158; REQ-06).**
- New `server/watchBatch.ts`, extracted from the plugin's inline debounce so it can be tested:
  - It gathers changed paths between syncs, with the same 120 ms debounce and 600 ms maximum wait.
  - `addDir`/`unlinkDir` outside `assets/<ID>`, a watcher `error`, or more than 500 paths in a burst means a
    full re-read.
  - `worktreeChanged()` still runs at once on every event.
- `syncFromDisk(paths?)`: with no paths it does today's full `loadCatalogue`, which the DELETE route, the lane
  route and tests use. With paths, it classifies each one exactly as `loadCatalogue`'s inputs:
  - `stories|questions|artifacts/<name>.md` (non-dot): re-read that one file (`readItemFile` and the others),
    with that file's own parse and lint issues.
  - `board-layout.json`: `readLayout`.
  - `board.config.json` or `status-recodes.json`: `readConfig`.
  - `assets/<ID>/…`: rescan that one asset folder.
  - A file some artifact uses (by resolved path): recompute that artifact's `artifactInfo` (already cached by
    stat).
  - Anything else (notes, changes, reference, README): nothing re-read, nothing emitted.
- How the state is kept so it equals a full read:
  - Parse issues are kept per source, keyed by `kind/name`, `layout` and `config`. They are rebuilt in
    `loadCatalogue`'s sorted order.
  - Record maps are re-sorted when a key is added, so issue order matches a full load.
  - `issuesFor` runs once, only when something changed. That is a bounded constant with no file parsing.
- The journal step is the same as in the full path:
  - `journal.item(rec, 'disk', { reappeared })`, with B05's `reappeared` only when the file was missing (not
    unreadable) in the previous state;
  - positions;
  - screenshots for the changed folders only.
- A board echo re-reads one file, finds the same rev, and emits nothing.
- A thrown incremental sync falls back to a full re-read, logged as today.

**3. Asset versions (D-10; REQ-08).**
- `journal.screenshots(assetsDir, { ids?, offline? })` returns the per-file fingerprints it computed
  (`src → sha`), cached by size and mtime as today and persisted in `<ID>.shots.json`. With `ids` it scans
  only those folders.
- `NO_JOURNAL` gets an in-memory version (no files), so tests and scripts without a journal still get tokens.
- The API keeps `state.assets`. A sync puts any token change into the delivery's `assets`.

**4. R-57 server defence.** The layout PUT ignores a non-null position for an ID with no item file on disk
(`existsSync(itemPath(id))`), not checked against synced state. A minimal edit in B05's route under touch rights.

### Client

**5. Ordered loads (R-58; REQ-01).**
- `store.ts` gets `applyDelivery(d)` in place of `applyEvent`. It makes one `set()` per delivery and copies
  only the changed keys, so unchanged `Rev` objects keep their identity.
- Item and question entries at a rev the tab already holds are skipped.
- Artifacts are skipped when both the rev and the `meta` JSON are the same, so a meta-only change still
  applies (REQ-07.4).
- `load()` takes a load token, and the store logs deliveries received while any load is in flight. When a
  snapshot comes back:
  - it is dropped if a later-started load has already applied;
  - otherwise it is applied, then every logged delivery with `seq > snap.seq` from the same `epoch` is
    replayed;
  - a delivery from another epoch triggers a full load.
- This covers the StrictMode double load, overlapping loads and deliveries that arrive mid-load.

**6. Layout queue (R-59, R-57, R-40; REQ-02, 04, 05).**
- Saves:
  - Flushes are serialised on one chain, `layoutQueue`. While a flush is in flight, its patch is
    `inflightLayout`.
  - A failure merges `{ ...inflight, ...pending }`, so newer moves win.
  - Saves never overlap, so they reach the server in order.
- A layout delivery merges per card: each card the user moved (pending or in flight) keeps its local
  position, and every other card follows the file. A file change still retries failed moves, as today.
- Removed cards: `forgetCards(ids)` runs from `deleteItem` and from deliveries that remove items. It strips
  those IDs from pending, in-flight retry, kept storage and `past`/`future` positions entries, and drops any
  entry left empty. `step` applies only the cards that still exist.
- `hasUnsavedMoves()` is true when anything is pending, in flight, or a Mapped move is in flight. Kept moves:
  - Pending and in-flight positions are mirrored to sessionStorage (`requirements-board:unsaved-moves`, read
    through `src/storage.ts`).
  - After the next load, they are put back on top (unknown IDs dropped), shown, and flushed once; they are
    cleared once saved.
  - A Mapped batch in flight is mirrored with its target fields. After the load it is compared with the
    cards: if it landed, nothing is said; otherwise `moveError` says it was not saved.

**7. App wiring (R-40; REQ-02.5, 02.6, 03).**
- `App.tsx` subscribes to `catalogue:changed` once (`applyDelivery`) and removes the dead `vite:ws:connect`
  handler.
- beforeunload checks `hasUnsavedDrafts() || hasUnsavedMoves()`.
- While Offline, a `/api/ping` poller runs every 2 s. When the server is back, it flushes kept moves, and the
  pill shows a "server is back" line with a Reload button. That button suppresses our own prompt, because the
  moves are kept.
- Also in this bite:
  - `useCatalogueRefresh` re-runs on deliveries that carry item, question or artifact entries.
  - The `store.ts` `layoutError` comment is fixed.
  - `ProblemPill` text (touch rights): Offline says card moves are kept and sent when the server is back, and
    sheet edits stay as drafts. The prefix appears once.
  - `api.ts`: `assetUrl(src, token?)`, which adds `?v=`.
- The `assets` store slice is not read by the board view, so it causes no rebuild.

**8. Node reuse (R-159 render; REQ-07.2, 07.3).**
- `graph.ts` `buildNodes(g, counts, prev?)` reuses the previous node's `data` when `item` (same object), `w`,
  `h`, `openQuestions`, `childCount` and `tone` all match. It reuses the whole node when position, hidden,
  zIndex, className and handles also match.
- In `BoardView.tsx`'s merge effect, a reused computed node keeps the previous state node, which holds the
  measured and selected state, so `CardNode`'s memo skips it.

## Bites, each failing first where it is a proof

0. **Baseline.**
   - A scratch `git archive 418bd3bd` (the pre-B07 board) for before-proofs.
   - Real-catalogue timings in a temp copy (387/140/65/747):
     - a one-file full re-sync, 5 runs, median;
     - a 50-file burst over about 2 s through a `fs.watch`-driven harness with the plugin's debounce, giving
       re-sync count and total time;
     - deliveries per burst.
   - Browser: touch 300 records on a scratch copy served on port 5482, then record the time to settle and
     the `CardNode` renders (a temporary dev-only counter, not committed).
1. **Delivery shape, seq and epoch, notifier merge, ping.** Every `catalogue:changed` consumer and test moves
   in this one commit (`App.tsx`, `useCatalogueRefresh.ts`, store, plugin, `tests/{store,api,writeCost,writeModel}`).
2. **Incremental re-sync, `watchBatch.ts`, journal scan by folder, asset tokens, layout PUT filter.**
3. **Store:** `applyDelivery`, ordered loads, the layout queue, `forgetCards`, kept moves, the Mapped
   in-flight check, `hasUnsavedMoves`.
4. **App wiring:** beforeunload, the Offline poller and Reload, pill text, `assetUrl`.
5. **Node reuse** in `graph.ts` and `BoardView`.
6. **After measurements**, docs, version and CHANGELOG, then the review.

## Tests (new unless noted; each shown failing on the archive first)

- **`tests/storeSync.test.ts`** (R-58, R-59, R-57, R-40, R-159b and d):
  - Snapshot held open while a delete, an update and a layout delivery arrive: the newer state is kept and the
    deleted card does not return.
  - Two loads resolving in reverse order.
  - A delivery mid-load.
  - Two flushes, both failing in each order: the retry sends the newest position.
  - Saves never overlap.
  - A layout delivery during an in-flight save leaves that card in place and moves the others.
  - Drag, delete (from this tab and by a delivery), undo: no save names the ID and the empty entry is dropped.
  - `hasUnsavedMoves` in the debounce, failed, in-flight and Mapped in-flight states, and false when all is
    saved.
  - Kept moves: a fresh store over kept sessionStorage shows them after load, sends them once, clears them on
    success, and drops a removed ID.
  - Mapped in flight at reload, both the landed and the not-landed case.
  - One delivery of N changes notifies subscribers once and keeps unchanged identities.
  - Artifact entries: same rev and meta ignored; a meta-only change applied.
- **`tests/resync.test.ts`** (R-158, R-159a, D-10):
  - Equivalence: on a fixture copy, a seeded randomised burst (create, edit, delete and rename-in-place of
    items, questions and artifacts; artifact files; screenshots added, rewritten, touched and removed;
    layout; config and recodes; notes; a hand delete; an unreadable file). After an incremental sync,
    `getState()` must equal a fresh `loadCatalogue` plus the asset scan, including config `revs`,
    `statusState`, `lanesRev` and parse issues. Journal entries must equal those of a twin API doing full
    syncs. It runs over many seeds, plus a forced-fallback case (directory event, over threshold, an
    unrecognised directory).
  - Counts, using a passthrough `node:fs` read counter:
    - a one-file change reads one record file;
    - a change under `notes/` reads none and emits nothing;
    - a board write's echo emits nothing;
    - a screenshot-only change scans one folder.
  - One delivery per sync and per multi-record write.
  - D-10 a to d and f:
    - a rewrite gives one delivery naming the card with a new token and no record entry;
    - a touch or unrelated deliveries keep the token, and so do a reload and a new API on the same journal (a
      restart);
    - a burst over several cards gives one delivery naming each once;
    - the snapshot carries the new token;
    - a removal gives `null`.
- **`tests/watchBatch.test.ts`**: debounce and maximum wait, the full-read triggers, duplicate and split
  add/unlink events, and `worktreeChanged` called at once.
- **R-57 server** (`tests/writeModel.test.ts` addition): a PUT naming an ID with no file writes no position;
  one naming a card just created on disk (not yet synced) keeps it.
- **D-10 e**: a live Vite check (the `tests/originLive.test.ts` harness) that the asset URL is served with the
  current and with an old `?v=` token.
- **`tests/graph.test.ts`** (existing file; additions): after a one-card change, unchanged cards keep node and
  `data` identity; a changed card, its count or its tone gets a new one.
- Updated for the shape only, with each test's intent kept: `tests/store.test.ts`, `api.test.ts`,
  `writeCost.test.ts`, `writeModel.test.ts`, `historyJournal.test.ts`, `reuse.test.ts`, `artifacts.test.ts`,
  `loadResilienceApi.test.ts`.
- **Manual on 5482** (a scratch copy of the real catalogue):
  - Stop the server after a drag, restart it, let Vite reload: the card stays and the file gains the
    position.
  - The "Stay" path: the pill says the server is back, the moves are saved, Reload works.
  - The pill's Offline and card-move text.
  - The 300-record render measurement before and after.

## Critical files

- **Server:**
  - `server/catalogueApi.ts` (notifier, `syncFromDisk`, snapshot, ping, layout PUT filter);
  - `server/catalogueFs.ts` (additive per-file read helpers);
  - `server/cataloguePlugin.ts` (watcher, uses `watchBatch`);
  - new `server/watchBatch.ts`;
  - `server/historyJournal.ts` (`screenshots` by `ids`, returns fingerprints; in-memory `NO_JOURNAL`).
- **Shared:** `shared/types.ts`.
- **Client:**
  - `src/store.ts`, `src/App.tsx`, `src/useCatalogueRefresh.ts`;
  - `src/api.ts` (`assetUrl`, `ping`);
  - `src/components/ProblemPill.tsx` (text and the Reload line; touch rights);
  - `src/board/graph.ts`, `src/views/BoardView.tsx`.
- **Reused:**
  - `readItemFile`, `readQuestionFile`, `readArtifactFile`, `readLayout`, `readConfig`, `withMeta` and
    `issuesFor` (`catalogueFs.ts`);
  - `artifactInfo` and `artifactPath` (`artifactFiles.ts`);
  - `inside` (`realPaths.ts`);
  - `src/storage.ts` (`readJson`, `writeJson`; sessionStorage variant if needed);
  - `src/clientProblems.ts` for any client failure (D-06).

## Risks and recovery

- **The incremental path is separable.** `syncFromDisk()` with no paths is the full path. Passing no paths
  from `watchBatch` reverts R-158 alone and keeps the ordering fixes.
- **macOS events:**
  - an event's type is never trusted; any event means "re-read this path";
  - directory events mean a full read;
  - `.tmp` files are ignored.
- **The server filter checks the disk, not synced state.**
- **Server restart:** a new `epoch` makes the client do a full load, never a seq comparison across processes.
- **No catalogue data changes and no migration.** Journal `.shots.json` keeps its format.

## Verification and close

- `npm run verify:board` from the repo root.
- Touched e2e on a free port (5482 or the 5182 fixture project): `board-mapped`, `item-delete`, `bad-data`,
  `artifacts`.
- `npm run check` byte-identical on the real catalogue.
- Before-proofs against the archive.
- After-timings recorded beside the baseline in IMPLEMENTATION.md. The target is a one-file re-sync at least
  10 times cheaper than a full one, with burst cost proportional to the files changed.
- Board 1.18.0 → **1.19.0** (minor), with the lock file and a CHANGELOG entry.
- Doc lines:
  - README "How it works": live updates, kept moves, the delivery, asset versions; server and src maps;
  - About, if it says anything about live updates;
  - DESIGN.md's masthead paragraph, if the pill gains the Reload line.
- Light review (convention 15): two Sonnet reviewers in parallel, given the SPEC, the findings and the diff.
  - Reviewer 1: completeness and correctness.
  - Reviewer 2: quality and performance.
  - I verify each finding myself, fix it, add regression tests and rerun.
- Order of writing at the end:
  1. `IMPLEMENTATION.md`: saved before the build, with an "As built" section added at the end.
  2. The PROGRESS entry:
     - a disposition for each of the six findings;
     - D-10, the delivery shape, `hasUnsavedMoves` and the node-reuse contract for B06, B09, B10 and B11;
     - touch-rights edits: `ProblemPill.tsx`, the layout PUT, `historyJournal.ts`, the tests above;
     - before and after performance;
     - Doc facts;
     - Discovered items:
       - the outside-artifact watch never removed;
       - `setLanes`' missing `lanesRev`, for B11;
       - the theoretical save-echo race across two sockets, for B06.
  3. The status row, and the PHASE STATUS block in `docs/board-fixes/index.html`, naming B06 next.
- Commit by path on `board-fixes`; never push.

## Baseline and measurements

Machine: this Mac, load averages 9 to 25 throughout (other sessions and scanning), so every timing is noisy;
the count checks in `tests/resync.test.ts` and `tests/storeSync.test.ts` are the binding proof. Scripts in the
session scratchpad (`bench/bench.mjs`, `bench/render.mjs`, `bench/outage.mjs`), run on an APFS clone of the
real catalogue (387 items, 140 questions, 65 artifacts, 747 screenshots).

**Server re-sync** (`bench.mjs`: a fresh API over the copy with a journal; one-file re-sync 7 runs, median;
then 50 story files appended over 2 s through `fs.watch` with the plugin's debounce):

| Run (interleaved, same copy) | One-file re-sync | 50-file burst |
|---|---|---|
| pre-B07 (`418bd3bd`), first baseline, load 9 | 400, 359, 455 ms | 4 re-syncs, 1.7 to 2.0 s, 54 deliveries |
| B07 / pre-B07, pair 1 (load 21) | 91 / 1,487 ms | 1.4 s, 5 deliveries / 3.8 s, 54 deliveries |
| B07 / pre-B07, pair 2 | 34 / 656 ms | 0.55 s, 4 / 8.9 s, 54 |
| B07 / pre-B07, pair 3 | 42 / 544 ms | 0.64 s, 4 / 3.0 s, 54 |

A one-file re-sync is 13 to 19 times cheaper. What is left is the integrity check, run once per re-sync that
changed something (about 25 ms of rules; B01's per-image symbolic-link test, about 30 ms, is now cached
between re-syncs and dropped for a card whose screenshot folder changes).

**Browser** (`render.mjs`, Mapped board on a scratch copy, temporary counters in `CardNode` and the board's
node build, removed after; development build, so React's StrictMode runs each render and memo twice):

| | 300 records changed at once | 1 record changed |
|---|---|---|
| pre-B07 (port 5483) | settled in 8.4 s, 4,690 card renders, 600 builds | 670 card renders, 2 builds |
| B07 (port 5482) | settled in 1.0 s, 504 card renders, 2 builds | 2 card renders, 2 builds |

**Manual R-40** (`outage.mjs`, Freeform, port 5482): drag a card, stop the server inside the 400 ms debounce,
start it again.
- *Leave*: the leave prompt asked once; Vite reloaded; the card stayed where it was dragged and
  `board-layout.json` gained its position; session storage emptied.
- *Stay*: prompt dismissed, Vite stopped polling; within 2 s of the server answering the board saved the move
  (file gained the position), the pill read "Server is back", its Connection line "The board's server is back
  and your card moves are saved. Reload to see changes made on disk again." with Reload; Reload asked
  nothing and the board came back live.
- While offline the panel read "Offline: the board's server isn't answering. Card moves are kept and sent when
  it's back; sheet edits stay as drafts until you save them." and "Card moves not saved yet (Failed to fetch).
  They are kept and sent again with your next move, or when the server answers." (prefix once).

## As built

Follows the plan. Differences:
1. Folder events are passed to the re-sync as paths (not judged in `watchBatch`): `planSync` reads the whole
   folder for the catalogue folder, a record folder or `assets/` itself, rescans a card's folder for
   `assets/<ID>`, marks artifacts whose file sits under a changed folder, and ignores the rest.
2. `partialLoad` takes records from the server's state (so the board's own writes since the last sync stay)
   and parse issues from `LoadResult.sources` (new: parse issues by file), kept in step by the layout and config
   writes.
3. A delivery carries `issues` only when they changed (a re-sync) or when the request changed records (a write).
4. The image link cache (`links` in `catalogueApi.ts`, `imageLinkOut` in `catalogueFs.ts`) was added after the
   first measurement showed the per-image `realpath` was half of a re-sync.
5. `src/storage.ts` gained a session area (`StorageArea`, `removeJson`) for the kept moves.
6. Removed cards are recognised as cards the store saw leave (`forgetCards` from `deleteItem` and from a
   delivery), and as kept moves whose card is not in the first load after a reload; a move for a card the store
   never held is still sent (the server drops it if there is no file).

7. After the review: a changed screenshot folder always reruns the check (a nested image or a symbolic-link swap changes
   no version); the layout and config are read before deciding anything changed, so the board's own drag or Settings
   echo costs no check; a re-sync that fails makes the next one read everything (at once, never looping); a Mapped
   move is kept for a reload from the moment it is queued; screenshot versions are kept in path order; the in-memory
   screenshot store is per server (`memoryJournal()`).

## Recovery

- R-158 alone: make `createWatchBatch`'s `sync` call `api.syncFromDisk()` without paths (full re-read every
  burst); everything else stays.
- Client ordering: `applyDelivery` with no `seen` check behaves as before for ordering; the queue and kept moves
  are independent.
- No catalogue data changed; no migration. Session storage key `requirements-board:unsaved-moves` can be cleared
  at any time.

## Handoff

The delivery shape, the D-10 signal, the unsaved-moves signal and the node-reuse contract are in the B07 entry of
PROGRESS.md ("What later phases need").
