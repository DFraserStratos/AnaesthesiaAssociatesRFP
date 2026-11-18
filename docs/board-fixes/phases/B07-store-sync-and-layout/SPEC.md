# Phase B07: Live updates and card moves stay ordered, complete and cheap

**Status:** PLANNED

**Requirements:** six findings in [FINDINGS.md](../../FINDINGS.md), section "Findings in detail":
R-40 (unsaved card moves lost on reload), R-57 (deleted card's position kept in pending saves and
undo), R-58 (initial-load snapshot overwrites a newer change event), R-59 (overlapping failed layout
saves restore the older batch), R-158 (every file event re-reads the whole catalogue), R-159 (the
client applies events one at a time and rebuilds every node). Systemic issue 1 (writes from a stale
model; R-59 is listed under it) and the Performance theme. Programme decision **D-10** (asset
version and change signal; PLAN.md "Deferred decisions", PROGRESS accepted decisions 5 and 9),
whose consumers are R-96 (B09) and R-104 (B10).

**Owns:**
- The store's live-update path: initial and repeat loads, event application, event ordering
  against snapshots (`src/store.ts` `load`, `applyEvent`; `src/App.tsx` event and connection
  wiring; `src/useCatalogueRefresh.ts`).
- The Freeform layout save queue and its interaction with undo, delete and reload (`setPositions`,
  `flushLayout`, `deleteItem`'s position bookkeeping, `step`), and the "unsaved card moves" signal
  the leave-page guard reads.
- `syncFromDisk` and event sending in `server/catalogueApi.ts`, additive read helpers for the
  incremental re-sync in `server/catalogueFs.ts`, and the watcher's batching in
  `server/cataloguePlugin.ts` (PLAN territory; shared-files rows for these files).
- The `catalogue:changed` event shape (the batched delivery), for the watcher and for every write
  route (accepted decision 5).
- Node identity reuse in `src/board/graph.ts` and `BoardView` where the render bound of B07-REQ-07
  needs it (PLAN territory).
- **D-10** and its delivery: the asset version and change signal, in the snapshot and the batched
  delivery, that B09 and B10 consume (B07-REQ-08).
- The wording of the connection and card-move messages that describe this behaviour (the `store.ts`
  comment at line 40; the Offline and card-move text in `ProblemPill`, a B03 file that B07 edits
  under touch rights, convention 11).
- A disposition and proof for each owned finding, and the phase's performance evidence.

**Excludes:**
- Edit sheets, drafts, "Keep mine", edits typed during a save, the store's save actions and the
  leave guard in `src/nav.ts` (B06). B07 changes nothing in `useEditableRecord`; its
  `hasUnsavedDrafts()` stays as the sheet half of the leave-page guard.
- The store's status filter persistence and `dropUnknownStatuses` (R-46, B02); the per-list status
  damage state (B02).
- Cycle-safe walks, per-file load isolation, the error boundary and the issue surface (`ProblemPill`
  layout and behaviour, D-06) (B03).
- Write routes and their semantics, one check per batch (R-26), lane rename and lane delete as one
  write including the store's `renameLane` and `deleteLane` (R-56), config section base tokens,
  ID-reuse journal handling, the client transport in `src/api.ts` and the write protocol (D-04)
  (all B05). No lane work in B07. The request guards in `cataloguePlugin.ts` (B01).
- How the board canvas lays out and draws cards, lane merge and collapse state (B11), apart from
  the node identity reuse above.
- How timelines refresh on a screenshot change (R-96, B09) and how gallery and lightbox URLs use the
  version (R-104, B10): B07 provides the signal only.

**Depends on:** B05 (PLAN "Depends on"), with **D-04** recorded in PROGRESS.md. Serial order: B01,
B02, B03, B04, B08, B05, **B07**, B06, B09, B10, B11, B14, B15 (convention 10), so B01's request
guards, B02's status-filter and damage state, B03's load isolation and `ProblemPill`, B08's history
hashing and B05's write routes, events and lane wiring are all in place and are B07's inputs. B07's
own gate: **D-10** recorded before B07 builds.

**Unblocks:** B06 (builds sheet conflict handling on B07-REQ-01's ordering and B07-REQ-07's event
shape); B09 (R-96 consumes D-10 and B07-REQ-08); B10 (R-104 consumes D-10 and B07-REQ-08); B11
(keeps B07's node and `data` identity reuse).

**Binding constraints:** every constraint in [PLAN.md](../../PLAN.md) "Binding constraints" and
[PROGRESS.md](../../PROGRESS.md) conventions 1 to 14: existing stack only (Vite 8, React 18,
zustand, @xyflow/react, TypeScript, Node >= 22.18, Vitest, Playwright; new dependencies only with a
recorded reason); board code stays project-generic; visual or wording changes follow
`requirements-board/DESIGN.md`; no change to requirement content; `npm run verify:board` green;
touched Playwright specs pass on a free port (never 5173, 5174, 5180, 5181); board version bump and
`CHANGELOG.md` entry; commit and merge, never push; never stage mid-phase; touch rights (11); doc
lines listed under "Doc facts" (12); every proof fails before the fix and passes after (13). Root
`CLAUDE.md`: the board is a local dev tool whose dev server is the file API, and coding agents write
many catalogue files in bursts while the board is open.

## Objective and outcomes

The board mirrors the files on disk while people drag cards and agents rewrite files around them.
When B07 is delivered:

1. **Nothing the user moved is silently lost.** A card move that has not reached the file yet
   survives a reload, a server restart and the automatic reload that follows it, or the user is
   asked before leaving. No message claims a retry that does not happen.
2. **Order is kept.** The store never shows an older version of a record after a newer one has
   arrived, whether the older one comes from a start-up snapshot, a repeat load or an earlier save's
   echo. The layout file never ends with an older position than the user's latest for any card.
3. **Removed cards stay removed.** No save, retry, undo or redo writes a position for a card that no
   longer exists.
4. **A burst of file changes costs one re-sync and one render, not N.** The server's work per
   re-sync follows the files that changed, not the size of the catalogue; each open tab receives
   one delivery per re-sync and renders once; cards the burst did not change do not re-render.
5. **Asset changes are visible.** A screenshot rewritten on disk reaches open tabs once per re-sync
   with a version token that later phases use to refresh timelines (B09) and image URLs (B10).

Why now: coding agents (build lanes, capture, link and consistency tools) routinely write tens to
hundreds of catalogue files while the board is open, and the catch-up plan runs two lanes at once.
At today's size each re-sync blocks the dev server for about half a second (see evidence), so a
long burst keeps the file API busy for much of its run, and every tab re-renders the whole board
once per record.

## Sources and current-state evidence

All evidence re-checked at HEAD `d4341735` (board 1.12.3), the review's own commit; the working tree
has no changes under `requirements-board/`. **Every owned finding still reproduces by reading; no
line numbers have moved.**

**Catalogue size today** (`requirements-board/requirements/`): 387 items (15 epics, 70 features,
302 stories), 140 questions, 65 artifact sidecars with 46 artifact files, 747 screenshot files in
243 asset folders (267 MB), plus 27 notes, 20 change logs and 3 reference files the watcher also
sees. The `/api/catalogue` snapshot is about 1.7 MB of JSON.

**Measured on this machine (scratch scripts, warm cache, noisy):** a full `loadCatalogue` takes
0.30 to 0.50 s (the first, cold call about 4 s); the screenshot journal scan run on every re-sync
takes 0.17 to 0.32 s (one noisy run 1.4 to 1.8 s); the integrity check alone takes 16 to 32 ms;
extracting link targets for all 387 items about 2 ms. So one re-sync costs roughly 0.5 to 0.8 s of
synchronous server time today, almost all of it re-reading files that did not change. The finding's
own measurements were 0.45 to 1.8 s per reload.

| Finding | Evidence at HEAD |
|---|---|
| R-40 | `src/App.tsx:47-51`: the `vite:ws:connect` handler flushes moves then reloads. Vite is 8.3.0; `node_modules/vite/dist/client/client.mjs:1029-1037` handles a disconnect by polling and calling `location.reload()`, and never reopens the socket in place, so the handler never runs after an outage. `App.tsx:63-69`: beforeunload checks only `hasUnsavedDrafts()`. `store.ts:87` `pendingLayout`, the 400 ms debounce (`:339-343`) and Mapped moves in flight (`movesInFlight`, `:91`) live only in memory. `store.ts:40` comment claims a retry "on reconnect". `client.mjs:935-937`: once beforeunload has fired, Vite sets `willUnload` and never polls again, so choosing "Stay" leaves the board Offline for good. Confirmed. |
| R-57 | `store.ts:194-207` `deleteItem` removes the deleted IDs from `layout.positions` only, not from `pendingLayout` or from `past`/`future` position entries. `step` (`:382-387`) re-applies a positions entry with `setPositions`, which puts the deleted ID back into `pendingLayout`; the layout PUT (`server/catalogueApi.ts:567-602`) writes positions for any ID (it filters unknown IDs only for the journal, `:577`). The server's own delete route does strip positions (`:385-391`). Mapped "fields" entries are safe: `driftFrom` refuses a missing card. Confirmed, as narrow as the verifier said. |
| R-58 | `store.ts:105-114`: `load()` awaits the snapshot then sets every record from it. `App.tsx:37-39` starts the load and `:42-60` subscribes to events independently, so events applied while the snapshot is in flight are overwritten. Also: `main.tsx` renders under `StrictMode`, and the board only runs in dev, so the load effect runs twice and two snapshots race; whichever resolves last wins. Confirmed. |
| R-59 | `store.ts:349-361`: a flush swaps `pendingLayout` for `{}` and sends; nothing stops a second flush while the first is in flight. If both fail, the later failure's merge `{ ...sending, ...pendingLayout }` puts the older batch over the newer. Confirmed by reading. Two further cases at HEAD: two overlapping flushes that both succeed can reach the server in either order, leaving the older position in the file; and a layout event that arrives while a flush is in flight (no timer, empty `pendingLayout`) replaces local positions with the server's, so a card can jump back until the echo arrives (`:145`). |
| R-158 | `server/cataloguePlugin.ts:39-41, 105-118`: events are coalesced (120 ms debounce, 600 ms maximum wait), then `syncFromDisk` (`catalogueApi.ts:605-639`) runs `journal.screenshots` over every asset folder (`historyJournal.ts:92-118`) and a full `loadCatalogue`, for any path under the folder (notes, changes, reference, capture, assets) and for the watcher's echo of the board's own writes. A long burst produces a re-sync every 600 ms or so, each blocking the server. Confirmed. |
| R-159 | `cataloguePlugin.ts:71`: one `dev.ws.send` per event; `syncFromDisk` emits one event per changed record plus an issues event. `store.ts:121-139`: each event is its own `set`, a fresh `items` object, so the shared index and every `useIndex` consumer recompute per event. `src/board/graph.ts:54-79` `buildNodes` makes a fresh `data` object per node on every rebuild, so the memoised `CardNode` re-renders every card. `store.ts:135-139`: artifact events skip the rev check. Note: the server also emits an artifact event when only its file facts (`meta`) change (`catalogueApi.ts:621-625`), so a client-side rev check must not drop meta-only changes. Confirmed; the finding notes the scale is overstated at today's size. |

**Other current facts this phase builds on:**
- The store already keeps unsent moves on top of a fresh load (`store.ts:108-113`), ignores its own
  layout echo while moves are waiting (`:144-145`), retries failed moves when the layout file
  changes on disk (`:141-143`), serialises Mapped moves with chained revs (`moveQueue`, `:89`,
  `:266-268`), and skips item and question events whose rev it already holds (`:124`, `:130`).
  `tests/store.test.ts` pins each of these.
- `src/useCatalogueRefresh.ts` re-runs the Diff review's count and data (`useUncommittedCount`,
  `useDiffData`) after record events (not positions, checks or settings) and on window focus,
  debounced.
- The watcher calls `api.worktreeChanged()` at once on every event so the Diff review never serves a
  comparison older than the files (`cataloguePlugin.ts:107-108`), ignores `.tmp` files, and watches
  artifact files that live outside the folder (`:85-95`).
- The integrity check depends on more than record files: image existence under `assets/` and the
  facts of each artifact's file (`server/catalogueFs.ts:147-182`).
- **D-10 today (asset version and change signal):** a screenshot rewritten in place (for example by
  `npm run capture`) produces no event: `syncFromDisk` only fingerprints it in the history journal
  (`journal.screenshots`, `historyJournal.ts:92-118`, which keeps size, mtime and git blob hash per
  file) and emits nothing unless a record changed. Screenshot URLs carry no version
  (`assetUrl`, `src/api.ts:91`, used by `Screenshots.tsx:66, :99`), whereas artifact files already
  carry one (`artifactFileUrl` appends `?v=` from `meta.fileRev`, `src/api.ts:84`). This is the
  mechanism behind R-96 (B09) and R-104 (B10).

**Found while verifying, not in FINDINGS.md** (in B07's territory unless marked):
- The problem panel prints "Card moves not saved: Card moves not saved yet: <reason>"
  (`ProblemPill.tsx:91` prefixes text that `store.ts:359` already prefixes). Folded into
  B07-REQ-03.
- Possible: if the HMR socket opens after `App` subscribes, the start-up `vite:ws:connect` runs
  `flushLayout().then(load)`, a second full load at start-up. Not verified; covered by B07-REQ-01.
- The watcher never stops watching an outside artifact file whose artifact was removed
  (`cataloguePlugin.ts:85-95`). Minor; for "Discovered for later" unless fixed in passing.

**Assumptions:** the HMR WebSocket delivers messages to a tab in the order the server sent them
(it is one TCP connection); HTTP requests from one tab may be handled in any order.

## Detailed requirements

### B07-REQ-01 Events and snapshots never go backwards (closes R-58)

1. Any full read of the catalogue into the store (the start-up load, StrictMode's second run of it,
   and any later load after a reconnect or reload) leaves each record, the layout, the config and
   the issues at the newest version the tab has received, whether that came in the snapshot or in
   an event that arrived before, during or after the snapshot request.
2. A record deleted or changed on disk while the board is starting never reappears in its older
   form; a deleted card never shows as a ghost that 404s on save.
3. When two loads overlap, the result is the same as if only the later-started one had run on top
   of every event received; an earlier response never replaces a later one.
4. Unsaved and in-flight card moves stay on top of whatever a load returns (today's behaviour,
   extended to moves that are in flight, not only waiting).
5. The guarantee holds for every event kind: item, question, artifact, layout, config, issues, and
   the batched delivery introduced by B07-REQ-07.

Candidate (FINDINGS): buffer events while a load is in flight and replay them, in arrival order,
over the snapshot. A server sequence number is another option. Either is the planner's choice.

### B07-REQ-02 Unsaved card moves survive a reload and a server restart (closes R-40)

1. Leaving or reloading the tab while any Freeform move is waiting in the debounce, waiting after a
   failed save, or in flight, asks first, in the same way unsaved sheet edits do. The same applies
   while a Mapped move is in flight.
2. A reload the user did not choose, in particular Vite's automatic reload after the dev server
   comes back, never silently drops unsaved Freeform positions: they are kept across the reload,
   shown on the board after it, and sent again; once saved they are forgotten. They never overwrite
   a position that is newer on disk for a card the user has not moved since (normal patch
   semantics: only the cards the user moved are sent).
3. Kept moves for a card that no longer exists after the reload are dropped (B07-REQ-04).
4. Mapped moves still in flight at a reload are not shown as saved after it. Whether they are
   replayed (they carry base revs, so a stale one is refused) or reported as not saved is B07-Q5;
   either way the user is not left believing a move landed when it did not.
5. If the user chooses "Stay" when the server has gone, the board does not stay Offline for good
   without saying so: it either recovers its live connection when the server returns, or tells the
   user plainly that the server is back and a reload is needed, and that their moves are kept.
   The exact mechanism and wording are B07-Q6.
6. The reconnect handler either does what its comment says or is removed; no code path or comment
   claims a retry that cannot happen.

Candidate (FINDINGS): a `hasUnsavedMoves()` check in beforeunload, unsent positions in
sessionStorage replayed after `load()`. The leave guard is B06's (`src/nav.ts`, which B06 reworks
after B07): B07 provides the "unsaved card moves" signal and wires it into the guard as it stands at
B07's start (today `App.tsx`); B06 must keep reading it.

### B07-REQ-03 Messages tell the truth (closes the messaging part of R-40)

1. The `store.ts` comment on `layoutError` names only the retries that really happen.
2. The Offline text says what is and is not kept while offline (for example that card moves are
   kept and sent when the server is back, while sheet edits stay as drafts), rather than "Changes
   aren't being saved" if that is no longer true after B07-REQ-02.
3. The card-move problem text carries its prefix once (fixes the doubled "Card moves not saved").
4. Wording follows `DESIGN.md` and the house voice; the problem pill's behaviour (shown only while
   something is wrong, "All clear" fade) is unchanged.

### B07-REQ-04 Removed cards leave no position behind (closes R-57)

1. When a card leaves the catalogue, deleted from this tab or removed on disk and learned from an
   event, its ID is removed from every pending, failed, kept (B07-REQ-02) and in-flight-retry
   position save, and from the position entries of undo and redo history.
2. Undoing or redoing a positions entry that names a removed card applies to the remaining cards
   only and never writes a position for the removed one. An entry left with nothing to apply is
   dropped rather than counted as a step that did something.
3. The layout file never gains a position, from any board action, for an item that does not exist
   on disk at the time of the write. A later card that happens to reuse the ID (whatever D-05
   decides about reuse) starts at its story-map place, not at the deleted card's spot.
4. Mapped "fields" history keeps today's behaviour: a step naming a missing card is refused with
   "Can't undo/redo: ... changed since".

Candidate (FINDINGS): strip deleted IDs from `pendingLayout` and history; have the server ignore
positions for unknown IDs. The server half is a minimal edit in B05's layout route under touch
rights (convention 11; B07 is on the `catalogueApi.ts` row) and must check against disk, not only
the synced state (see Risks).

### B07-REQ-05 Layout saves are ordered, success or failure (closes R-59)

1. After any sequence of Freeform moves and saves, with saves succeeding, failing or answering in
   any order, each card's position in the layout file, once the queue is idle and the server
   reachable, is the user's latest position for it.
2. A failed save never makes an older position win over a newer one, for retries or for what the
   board shows.
3. Two saves from one tab never reach the server in an order that leaves an older position on disk
   (today two overlapping requests can be handled in either order).
4. While a card's move is waiting or in flight, a layout event from the server (its own echo, an
   earlier save's echo, or another writer's change) never shows an older position for that card.
   Positions of cards the user has not moved still follow the event.
5. Today's preserved behaviours (debounced, rounded, patch-only saves; newer moves win; failed
   moves retried on the next move and when the layout file changes on disk) keep working.

Candidate (FINDINGS): serialise flushes as `moveQueue` does, or merge with sequence numbers.

### B07-REQ-06 The server's re-sync costs what changed (closes R-158)

1. A re-sync's file reading and parsing is proportional to the files that changed in the burst,
   plus a bounded constant; it does not re-read or re-parse unchanged record files, and does not
   walk every screenshot folder when none changed.
2. A change to a file that feeds nothing the server holds (a note, a change log, a reference file
   that is no artifact's file, any other path outside the record folders, assets, layout and
   config) causes no record re-read and no event.
3. The watcher's echo of the board's own write, whose content the server already holds, costs at
   most a read of that one file and emits nothing new.
4. Changes that feed the integrity check without changing a record (a screenshot added or removed,
   an artifact's file edited inside or outside the folder) still update the issues and, for an
   artifact's file, that artifact's facts, exactly as a full re-read would.
5. **Equivalence:** after any burst, the server's state (records, revs, parse issues, integrity
   issues, layout, config with its section base tokens and per-list status damage state, artifact
   facts, asset versions) equals what a full re-read of the folder would give at that moment. The
   history journal records the same entries (disk edits, positions, screenshot rewrites, and the
   hand-delete handling B05 adds) as the full re-sync does.
6. When the change set cannot be known precisely (a watcher error, a folder added, removed or
   renamed, a path the incremental path does not recognise, many files at once if the planner sets
   such a threshold), the server falls back to a full re-read, so it is never left wrong, only
   slower.
7. Latency is kept: during a sustained burst, changes still reach open tabs at least about as often
   as today's maximum wait (600 ms plus the re-sync itself); a burst never starves updates.
8. The Diff review's freshness rule is kept: every file event marks comparisons stale at once.
9. A re-sync that fails is logged as today and does not stop later re-syncs. If B07 surfaces it to
   the user, it follows D-06 (B03).

Candidate (FINDINGS): re-read only the changed paths, skip unrelated folders, skip the board's own
revs.

### B07-REQ-07 One delivery and one render per burst (closes R-159)

1. Each re-sync reaches each open tab as one delivery carrying all of its changes (records, layout,
   config with its section base tokens and status damage state, issues, asset changes per
   B07-REQ-08), not one message per record. Write routes that change several records in one request
   deliver the same way: B07 moves B05's emitters, which send one check and one issues event per
   request (R-26), onto the batched delivery (accepted decision 5: B07 owns the event shape).
2. One delivery causes at most one store update and one board rebuild in the tab, however many
   records it carries.
3. Cards the delivery did not change keep their identity through the rebuild, so they do not
   re-render; a card re-renders only when something it draws changed (its item, its open-question
   count, its descendant count, its tone, its size or position).
4. An artifact event that carries the rev and facts the tab already holds is ignored; one whose
   facts (`meta`) changed with the same rev is still applied.
5. `useCatalogueRefresh` keeps its meaning under the new delivery: it re-runs (debounced) when a
   delivery carries any item, question or artifact change, and not for one carrying only positions,
   issues or config; focus still re-runs it.
6. Events from older servers or tests in the per-event shape need not be supported (the client and
   server ship together), but every in-repo consumer of `catalogue:changed` and every test that
   calls `applyEvent` or `syncFromDisk` is moved to the new shape in this phase.

Candidate (FINDINGS): batch events on both ends, reuse unchanged node objects, add a rev check for
artifacts. Node reuse in `src/board/graph.ts` and `BoardView` is B07's where this bound needs it
(PLAN territory); B11 keeps it.

### B07-REQ-08 Asset changes reach open tabs with a version (D-10; consumed by R-96 and R-104)

1. When a screenshot or other asset file under the catalogue's `assets/` is added, rewritten in
   place or removed on disk, open tabs learn of it once per re-sync, on the same batched delivery as
   other changes: which cards' assets changed, and a version token for each changed file (or that
   it is gone).
2. The snapshot gives the current version token of every asset file, so a tab that loads after the
   change has the same tokens as a tab that received the delivery; B07-REQ-01's ordering applies to
   asset versions as to records.
3. A file whose content has not changed keeps its token across re-syncs, events, reloads and server
   restarts (a touch without a content change does not count as a change unless D-10 decides
   otherwise and says so); a content change always gives a new token.
4. The token can be placed in an asset URL that B01's guarded `/requirements/` route accepts, and
   the route still serves the current file for any token (a stale token never fails the request).
5. Consumers that do not use the signal ignore it safely: it causes no record update, no catalogue
   reload and no board rebuild of its own (B07-REQ-07's render bound holds), and `useCatalogueRefresh`
   treats it per D-10 (B09 decides whether a timeline re-reads on it).
6. The asset signal costs what changed (B07-REQ-06): only the asset folders that changed are
   fingerprinted, and the history journal still records screenshot rewrites as today.
7. B07 delivers the signal and the token; it does not change `HistoryView` (B09) or `Screenshots`
   and the lightbox (B10). If a minimal consumer edit is needed to prove the contract end to end,
   it is named in the PROGRESS entry under touch rights (convention 11).

The form of the signal and the token is D-10 (below).

### Preserved behaviour (must not regress)

- Every behaviour pinned by `tests/store.test.ts`: one debounced rounded patch; failed moves kept
  and resent; a move made during a failed save wins; retry when the layout file changes; layout
  event ignored while moves wait; unsent moves on top of a fresh load; Mapped moves reflow at once,
  send revs and adopt saved revs, roll back with a reason on refusal; undo and redo of Freeform and
  Mapped moves, drift refusal, retitle tolerance, redo cleared by a new move, lane renames out of
  history.
- Item and question events at a rev the tab already holds cause no update (own echoes are free).
- `sharedIndex` returns the same index object until items, questions or config change.
- Lane edits, `firstLane` renames, and the store's `renameLane` and `deleteLane` as B05 wired them
  to the one-write lane request, behave as B05 leaves them; B07 does no lane work.
- What earlier phases put in the snapshot, events and `syncFromDisk` survives the batched delivery
  and the incremental re-sync unchanged: **config section base tokens** (B05-REQ-06), the
  **per-list status damage state** (B02), and the **hand-delete journal handling** in `syncFromDisk`
  (B05, R-54), each as B02 and B05 leave them. The batched delivery carries the base tokens and the
  damage state wherever today's config event and snapshot carry them, and the incremental re-sync
  performs the journal step for a file removed by hand exactly as the full re-sync does.
- Server: no event when nothing changed; layout, config and issues events when they change; journal
  entries for disk edits, positions and screenshots; `.tmp` files ignored; outside artifact files
  watched; Diff review marked stale at once; B03's per-record load isolation (one bad file is an
  issue, the rest load) holds on the incremental path too.
- The problem pill's grouping and "All clear" behaviour; the sheets' own leave-page guard.

## Dependencies and handoffs

**Consumes:**
- B05: write routes, R-26's one check and one issues event per request, the store's `renameLane`
  and `deleteLane` as B05 wired them to the one-write lane request (R-56; no lane work in B07), the
  layout PUT as B05 leaves it, config section base tokens (B05-REQ-06), the hand-delete journal step
  in `syncFromDisk` (R-54), the client transport in `src/api.ts`, and **D-04**. If D-04 changes the
  batch route's request, response or conflict shape, `moveItems` and undo follow it; if D-04 brings
  layout writes under a base-rev protocol, B07-REQ-05's ordering is built on that protocol rather
  than beside it.
- B01: the request guards and the `/requirements/` asset route rules in `cataloguePlugin.ts`
  (D-01); B07-REQ-08's URL token must pass them.
- B02: the status-filter handling in `applyEvent`'s config branch and the per-list status damage
  state in the snapshot and config event (kept as B02 leaves them, applied once per delivery).
- B03: per-file load isolation, `ProblemPill` (B07 edits its text only), and D-06 if sync failures
  are surfaced.
- B08: history hashing in `historyJournal.ts` (both hash widths), which any asset token built on the
  journal's fingerprint inherits.
- D-05 (B05, user): no dependency for correctness; B07-REQ-04 holds whatever reuse rule is chosen.

**Produces:**
- The live-update contract later phases rely on: deliveries are applied in order, never
  overwritten by an older snapshot, one store update per delivery (B06 builds sheet conflict
  handling on it; B09's diff count and B10's viewers rely on `useCatalogueRefresh`).
- The batched delivery shape on the `catalogue:changed` channel, for the watcher and every write
  route, recorded in PROGRESS.md for B06, B09, B10 and B11.
- **D-10** recorded in PROGRESS.md, and B07-REQ-08's asset signal and version token: B09 (R-96)
  refreshes open timelines from it; B10 (R-104) versions gallery and lightbox URLs with it.
- The "unsaved card moves" signal the leave guard reads; B06 keeps reading it in `src/nav.ts`.
- Node and `data` identity reuse in the board's node building (`tests/graph.test.ts` pins it), which
  B11 keeps when it reworks `graph.ts` and `BoardView`.

**Integration proof owner:** B07 proves its own findings and the D-10 contract; B09 and B10 prove
their consumer behaviour; B15 re-checks all of them in the closing audit.

## Acceptance and evidence

Every proof below must fail on the code before the fix and pass after it (convention 13); a manual
check records what was seen before and after. The planner picks the test tooling; the phrasing is
what must be shown, not test code.

| Item | Proof |
|---|---|
| R-40 | A test that the leave-page guard asks while a Freeform move is in each unsaved state (debounce, failed, in flight) and while a Mapped move is in flight, and not when everything is saved. A test that positions unsaved at a simulated reload (a fresh store over kept state) appear after the next load and are sent once, and are not resent after success. A recorded manual check on a scratch catalogue served on a free port: fail a drag by stopping the dev server, restart it, let Vite reload, see the card stay put and the layout file gain the position; and the "Stay" path per B07-Q6. Review of the comment, Offline and card-move text (no doubled prefix). |
| R-57 | A test of drag, delete (from the tab, and by an event), undo: no layout save names the deleted ID, `pendingLayout` and history hold no entry for it, and an emptied history entry is dropped. If the server defence is adopted, an API test that a layout PUT naming an ID with no file on disk writes no position for it, and one naming a card just created on disk (not yet synced) keeps it. |
| R-58 | A test with the snapshot request held open: a delete, an update and a layout change arrive as events, then an older snapshot resolves; the store keeps the newer state and no deleted record returns. A second test with two overlapping loads resolving in reverse order. A third with a batched delivery arriving mid-load. |
| R-59 | The finding's scratch scenario as a test: flush A in flight, a newer move, flush B, both fail in each order; the retry sends the newest position. A test that two saves cannot reach the API out of order (or that the server-side merge makes order irrelevant). A test that a layout event during an in-flight save does not move that card back. |
| R-158 | (a) An equivalence test: on a copy of a fixture catalogue, apply a randomised burst (create, edit, delete, rename-in-place of items, questions, artifacts and their files, screenshots, layout, config, plus unrelated files, and a file removed by hand), re-sync incrementally, and compare the server state (including config section base tokens, the per-list status damage state and asset versions) and journal entries (including the hand-delete step) with a full re-read; include a case that forces the full-re-read fallback. (b) A count check: a one-file change re-reads one record file; a change under `notes/` re-reads none and emits nothing; the board's own write emits nothing. (c) **Measured performance**, recorded in IMPLEMENTATION.md and the PROGRESS entry: on a copy of today's real catalogue (387 items, 140 questions, 65 artifacts, 747 screenshots) in a temp folder, time a one-file re-sync and a 50-file burst written over about 2 s, before and after. Baseline at HEAD is about 0.5 to 0.8 s per re-sync, one re-sync per about 600 ms of burst. Target: a one-file re-sync at least ten times cheaper than the measured full re-read on the same machine, and a 50-file burst's total re-sync time proportional to the 50 files, not to 50 times the catalogue. The count checks are the binding proof; the timings are recorded evidence. |
| R-159 | (a) A test that one re-sync with N changed records produces one delivery per tab, and that a multi-record write request produces one delivery. (b) A store test that applying one delivery of N changes notifies subscribers once and leaves unchanged records with the same object identity. (c) A test that unchanged cards keep node and `data` identity through a rebuild after a one-card change (pure function test where possible). (d) A test that an artifact event at the held rev and facts is ignored and a meta-only change is applied. (e) A test that a delivery carrying config keeps the section base tokens and status damage state the old config event carried. (f) **Measured** in the browser on a scratch copy of the real catalogue served on a free port: touch 300 records at once and record the time until the board settles and the number of `CardNode` renders, before and after; target one board rebuild per delivery and renders limited to changed cards. |
| D-10 (B07-REQ-08) | (a) Rewrite one screenshot on disk: open tabs receive one delivery naming that card and a new token for that file, and no record update or board rebuild follows from it alone. (b) An unchanged asset's token is identical across several unrelated catalogue deliveries, a reload and a server restart; a touch with no content change follows what D-10 records. (c) A burst rewriting screenshots of several cards gives one delivery naming each card once. (d) A tab loading after the rewrite gets the new token in the snapshot. (e) An asset URL carrying the token is served by B01's guarded route, and so is one carrying an old token. (f) Removing a screenshot is signalled as gone. |

**Prohibited regressions:** any preserved behaviour above; any failing existing test in
`tests/store.test.ts`, `tests/api.test.ts`, `tests/artifacts.test.ts`, `tests/historyJournal.test.ts`
or `tests/graph.test.ts` other than updates for the new delivery shape that keep each test's intent;
`npm run verify:board` red; any board e2e spec touched by the phase failing on a free port.

**Awaiting a named decision:** B07-REQ-08's form (D-10); B07-REQ-02.4 (B07-Q5); B07-REQ-02.5
wording and mechanism and the scope of kept moves (B07-Q6).

## Deferred decisions for execution planning

See the shared register in [PROGRESS.md](../../PROGRESS.md) "Deferred decisions".

**Owned shared decision: D-10, asset version and change signal.**
- *Gap:* R-96 (B09) and R-104 (B10) both need to know when a screenshot changed and a version to
  show the current file; FINDINGS proposes "an assets event or fingerprint" and "a per-asset version
  ... append `?v=`". Nothing exists today (evidence above).
- *Affects:* B07-REQ-08, B07-REQ-06.6, B07-REQ-07.1, B07-REQ-01.5. *Owner:* B07 (accepted decisions
  5 and 9). *Dependants:* B09 (R-96), B10 (R-104). *Resolve before:* B07 build; record in PROGRESS.md.
- *Options and consequences (not chosen here):*
  1. *An asset-change entry on the batched delivery plus per-asset tokens in the snapshot.* Cheapest
     for consumers (one place to look); the snapshot grows by one token per asset file (747 today).
  2. *Per-card asset versions inside each item's record or meta.* Fits card-centred consumers (the
     timeline, the gallery) and rides existing item updates, but an asset change would then look
     like a record change, which B07-REQ-08.5 forbids unless consumers can tell them apart; it also
     mixes file facts into records.
  3. *A version served with the asset list or with the asset itself (for example its mtime or a
     content hash in a header), polled or fetched on demand.* No event-shape change, but no push:
     R-96's open timeline would not refresh by itself.
- *Token form, also open:* git blob hash (the journal already computes it; follows B08's hash width;
  stable across restarts and touches), size plus mtime (cheap; changes on a touch, and can collide
  on a same-size rewrite within the clock's resolution), or a counter (not stable across restarts).
  Whatever the form, it must pass B01's asset route (D-01) and leave the route serving the current
  file.
- *Token placement in the URL:* B01 builds first and admits a version token in the asset URL's
  query string (B01 P-05), so a query-string token needs no change to B01's guard. Any other
  placement (a path segment, a header) needs a minimal edit to B01's guard under touch rights
  (convention 11), named in B07's PROGRESS entry, and B01's guard proofs (PR-04, PR-05) re-run and
  passing after it.
- *Boundary impact:* none on territories for a query-string token; another placement adds the B01
  guard edit above. B09 and B10 build against the recorded form.
- *Acceptance impact:* the D-10 proof rows above are unconditional on the outcome; their exact
  observation (which field, which URL form) follows the recorded answer.

**Consumed:** D-04 (write protocol, B05): shapes `moveItems`, undo and possibly layout writes; B07
does not plan its queue until D-04 is recorded. D-01 (B01): the asset route a URL token must pass.
D-05 (ID reuse) and D-06 (issue surface) only as noted above; D-02 only through B02's status-filter
code and damage state.

**Answered questions:**
- **B07-Q1** Answered (accepted decision 10, 2026-11-18): B07 is on the `server/catalogueApi.ts` row for
  `syncFromDisk`, event sending and the layout route's unknown-ID filter, after B05; additive read
  helpers in `server/catalogueFs.ts` after B03 and B05 (PLAN shared-files table).
- **B07-Q2** Answered (accepted decisions 5 and 10, 2026-11-18): B07 owns the `catalogue:changed` event shape;
  B05 sends one check and one issues event per request, and B07 moves B05's emitters and every
  client consumer onto the batched delivery.
- **B07-Q3** Answered (accepted decision 10, 2026-11-18): B07 does node identity reuse in `graph.ts` and
  `BoardView` where its render bound needs it; B11 keeps it.
- **B07-Q4** Answered (accepted decisions 5 and 10, 2026-11-18): `ProblemPill` is B03's; B07 edits only its
  Offline and card-move text under touch rights.

**Open questions:**

| ID | Question | Affects | Owner | Depends | Resolve before | Proposal (not a decision) |
|---|---|---|---|---|---|---|
| B07-Q5 | Mapped moves still in flight at a reload: replay them after load (base-rev checked) or report them as not saved? A replay of a move the server already applied would be refused as stale. | REQ-02.4 | B07 planning, with the user | D-04 | B07 build | Report as not saved, unless D-04 gives a safe way to tell "already applied". |
| B07-Q6 | After "Stay" when the server has gone, Vite stops polling. Should the board watch for the server itself and recover or offer a reload, and what does it say? Should kept moves survive only a reload of the same tab, or a closed and reopened tab too? | REQ-02.2, REQ-02.5, REQ-03.2 | B07 planning, with the user | none | B07 build | Same-tab survival as the minimum; the board offers a reload when the server is back. |

## Risks and recovery requirements

- **Incremental re-sync drift.** A missed or misread change leaves the server wrong until the next
  full read, and a wrong server state feeds the write guard. Required: the equivalence proof
  (REQ-06.5), the full-re-read fallback (REQ-06.6), and a way to force a full re-read without a
  code change (for example on server start, which already does one). The planner should keep the
  full path and test both.
- **macOS watcher behaviour.** File events can be coalesced, duplicated or arrive as add/unlink
  pairs for an atomic rename (the board itself writes via temp file and rename). The incremental
  path must treat any event for a path as "re-read this path" and never trust the event type alone.
- **Server-side unknown-ID filter.** The server's synced state can lag the disk by the debounce; a
  filter against synced state could drop a position for a card an agent just created. Required: any
  such filter checks the file on disk, as the write routes already do.
- **Kept moves replayed over newer work.** A kept position replayed after a reload must stay a
  per-card patch for cards the user moved, and must be dropped for removed cards; it must never
  rewrite the whole layout or lanes.
- **Envelope change breaks in-flight consumers.** Every `catalogue:changed` consumer in the repo is
  moved in the same commit (REQ-07.6). Lanes in other worktrees pick the board up through merges
  from master and run their own dev servers, so client and server stay matched there too.
- **Performance claims on noisy hardware.** Timings vary several-fold between runs here; record the
  machine, several runs and the median, and treat count-based checks as the binding proof.
- **Rollback.** Each requirement should be separable enough that a regression in one (for example
  the incremental re-sync) can be reverted to today's full re-read without undoing the ordering
  fixes. No catalogue data changes; no migration.

## Execution and handoff obligations

1. Read PLAN.md, PROGRESS.md (conventions 1 to 14, accepted decisions, D-04 and D-01 as recorded,
   and the entries of B01, B02, B03, B08 and B05), this SPEC, the owned findings and R-96 and R-104
   in FINDINGS.md, and the code at the then-current HEAD. Re-verify each finding; anything no longer
   reproducing gets "Not reproducible at HEAD" with evidence.
2. Resolve D-10 (with B09's and B10's needs in view) and the open questions B07-Q5 and B07-Q6 with
   the user in the planning conversation; record them in PROGRESS.md before building.
3. Write `docs/board-fixes/phases/B07-store-sync-and-layout/IMPLEMENTATION.md` before building: the
   chosen means for each requirement, the bites, the tests, the baseline measurements, and how each
   preserved behaviour (including B02's and B05's snapshot, event and journal additions) is
   protected.
4. Build in bites. Every proof fails on the code before the fix and passes after it (convention 13).
   Never stage mid-phase.
5. Finish green: `npm run verify:board` from the repo root; touched Playwright specs on a free port.
6. Bump the board version in `requirements-board/package.json` and its lock file (minor: users see
   the leave-page guard and kept moves) and add a `CHANGELOG.md` entry describing the behaviour.
7. Update the doc lines that describe behaviour B07 changes (README, SCHEMA, About, DESIGN, any
   SKILL.md; for example the README's account of live updates, if any) and list each line changed
   under "Doc facts" in the PROGRESS entry (convention 12).
8. Run the three review lenses (quality and maintainability, completeness against this SPEC, bugs
   and correctness), fix confirmed findings, and record the outcome.
9. Record the result last in PROGRESS.md: phase status, D-10 and the other answers, the delivery
   shape, the asset signal and token, the unsaved-moves signal and the node-reuse contract for B06,
   B09, B10 and B11, edits made in other phases' files under touch rights (for example
   `ProblemPill.tsx`, the layout route, `graph.ts`, `BoardView`), performance before and after, Doc
   facts, discoveries for later, and one disposition per owned finding: R-40, R-57, R-58, R-59,
   R-158, R-159, each **Fixed**, **Not reproducible at HEAD**, **Won't fix (user accepted)** or
   **Moved** (named owner, recorded in both SPECs).
10. Commit this phase's files by path and merge; never push.
