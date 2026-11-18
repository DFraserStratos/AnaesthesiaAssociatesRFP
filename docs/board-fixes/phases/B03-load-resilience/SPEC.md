# Phase B03: Bad data becomes an issue, never a crash or a silent omission

**Status:** COMPLETE (2026-11-19; see PROGRESS.md)

**Requirements:** R-10, R-11, R-47, R-48, R-49, R-50, R-51, R-52, R-53, R-65, R-66, R-121, R-122,
R-160 (14 findings), each under "#### R-nn" in [FINDINGS.md](../../FINDINGS.md); systemic issue 5
("Bad data or a missing file crashes or misleads") in the same file; programme outcome 3 in
[PLAN.md](../../PLAN.md). Owned deferred decision: **D-06**.

**Owns:**
- The app-wide error boundary: which regions it protects, what a caught crash shows, and how the user
  recovers (through D-06).
- The issue surface: the masthead problem pill and its list (`src/components/ProblemPill.tsx`) and the
  reporting contract later phases follow (D-06; accepted decision 5).
- Cycle-safe tree walks everywhere they occur: `descendantsOf` in `src/store.ts` and in
  `shared/remove.ts`, the Outline's group of unplaced cards, and Freeform placement of cycle members
  (`src/board/autoLayout.ts`).
- Naming parent cycles in the catalogue check (`shared/check.ts`).
- Safe type lookups: `canParent` in `shared/move.ts`, display labels and ordering for an unconfigured
  item type, and `ItemModal`'s type use; no throw from any lookup keyed by item type.
- Per-file load isolation on the server: `server/catalogueFs.ts` (load, `listMd`, `readLayout`),
  `server/artifactFiles.ts` (artifact facts, `artifactInfo`), `server/historyJournal.ts` (screenshot
  scan).
- Parse robustness: a leading BOM in record files (`shared/files.ts`), dotfiles in record folders,
  out-of-range numeric entities (`shared/artifacts.ts decodeEntities`), U+0130 in find
  (`src/artifacts/find.ts`), malformed entries in `board-layout.json`, and one shared rule for reading
  JSON from browser storage that rejects valid JSON of the wrong shape, used by every store that keeps
  JSON in the browser (the Diff tab's Viewed store among them).
- PDF facts that survive a restart (cached across processes) and the git-ignore entry for them.
- Listing, not hiding: questions with an unconfigured status on the Outstanding items page and in
  its step-through; cards with a missing or wrong-type parent (and cycle members) in the Outline.
- One disposition per owned finding, with its proof.

**Excludes:**
- Mapped-layout visibility: orphans' children (R-29), the open card under a hidden retired ancestor
  (R-113) or in a collapsed lane (R-114): **B11**.
- The `REPO_ROOT` symlink case of R-47 (a `/`-rooted artifact path when the repository root and the
  requirements folder differ by a symlink): **B01**, through its real-path rule (B01-REQ-07; accepted
  decision 11). B03 reuses that rule and does not add a second path comparison.
- Missing artifact files and history blobs served as `index.html` with 200 (R-22), malformed
  percent-escapes giving 500 (R-63), path containment in `artifactPath`: **B01**.
- Write routes and their semantics in `server/catalogueApi.ts`, atomic create in `catalogueFs.ts`
  (R-64): **B05**. Sync and event sending in `catalogueApi.ts`, the problem pill's message text where
  B07 changes it: **B07**. The Outline's twisty and search behaviour (R-126), Questions owner filter
  (R-128): **B11**. Viewed ticks across tabs (R-93): **B09**. Artifact filter-preference behaviour
  (R-106): **B10**, on B03's storage reading rule. The artifact page's orphaned draft (R-12) and all
  sheet draft handling: **B06**. Status-list fallback and status-filter pruning (R-01, R-46): **B02**.
  Shared text rules in `shared/check.ts` (other than cycle naming) and the lint in `shared/files.ts`:
  **B04**. Kit export contents and the whole-file `.gitignore` and docs pass: **B14**.

**Depends on:** B01 (`artifactFiles.ts` real-path rule). Serial position: after B01 and B02 (PLAN
"Build order"; B02 also edits `server/catalogueApi.ts` and `src/store.ts` first). Gate: D-06 resolved
and recorded in [PROGRESS.md](../../PROGRESS.md) before B03 builds. Inherits accepted decisions 1 to
12.

**Unblocks:**
- **B04** builds its text rules on B03's shape of `shared/artifacts.ts` (entities), `shared/files.ts`
  (BOM), `shared/remove.ts` (`descendantsOf`) and `shared/check.ts` (cycle issue).
- **B08** builds history hashing on B03's `server/historyJournal.ts` screenshot scan.
- **B05** builds its write routes on a `catalogueFs.ts` whose load never throws for one file and
  whose layout read returns only valid positions with a damaged-entries signal.
- **B07** keeps B03's boundary mounts in `App.tsx` and edits only the problem pill's text.
- **B06**, **B10**, **B11** consume D-06 and the shared boundary. B06's sheets, B10's viewers and
  B11's canvas and views report failures through the issue surface's contract (below), not through
  surfaces of their own.
- **B11** builds `planMove` on a `canParent` that never throws, and Outline twisty and search fixes
  on an Outline that already lists every card.
- **B10** builds on a correct `find.ts`, and its saved filter preferences (R-106) are read through
  the shared storage reading rule (B03-REQ-06.2), not a copy of it. **B11** builds its collapsed-lane
  state and the Outline collapse state on the same rule, not a copy. **B09** builds R-93 on a Viewed
  store that survives damaged values.
- **B14** includes the stored-PDF-facts ignore entry in its kit and `.gitignore` pass.

**Issue-surface contract handed to later phases** (the parts not left to D-06):
- There is one place in the masthead that says something is wrong: the problem pill, shown only while
  a problem stands, opening one list grouped by kind (today Connection, Card moves, Checks). Check
  notes are never problems. "All clear" shows only when the last problem has gone.
- A phase that finds a problem the user must notice or act on reports it to this surface as a named
  group or entry, in the way D-06 settles; it does not add another masthead mark, toast or global
  banner. A message inside the phase's own region (a sheet, a viewer, Settings) stays allowed where
  D-06 says so.
- Server-found data problems keep arriving as catalogue issues and are listed under Checks.

**Binding constraints:** every constraint in PLAN.md "Binding constraints (every phase)" and
PROGRESS.md conventions 1 to 14 apply: existing stack only (Vite, React 18, zustand, @xyflow/react,
TypeScript, Node >= 22.18, Vitest, Playwright; a new dependency needs a recorded reason); visual
changes follow `requirements-board/DESIGN.md` (names over codes, status as pills, the masthead's
single problem pill and its grouped list); board code stays project-generic; `npm run verify:board`
green; touched Playwright specs pass on a free port (never 5173, 5174, 5180, 5181); fixes do not
change requirement content, and no catalogue data migration runs without the user seeing it; git
rules (commit and merge, never push, never stage mid-phase); touch rights (convention 11): B03
delivers each owned fix whole, with minimal edits in other phases' files named in its entry; doc
lines (convention 12); every proof fails before the fix and passes after (convention 13). The board
is a local dev tool and its dev server is the file API: resilience must not open new routes or relax
B01's guards.

## Objective and outcomes

The board, its dev server and its scripts are read and edited by people and by agents writing to
the same files, so a hand edit, a half-written file, a stray system file or an agent's mistake
reaches them routinely. Today one such file can white-screen the app, stop the dev server
starting, make `npm run check` stack-trace, turn every drag into a 500, or make cards vanish from
lists while the counts still include them.

When B03 is delivered:

1. **No single file can stop the catalogue loading.** Whatever one record, sidecar, artifact file,
   screenshot folder or layout entry holds, the check, the dev server's start and every sync finish,
   and the problem appears as an issue naming the file.
2. **No bad data can crash the app.** Known crash paths are fixed at the root; a render failure that
   still slips through is contained to its region by an error boundary, with the masthead and the
   problem list still working and a way back that survives a reload.
3. **Nothing counted is hidden.** Every question the masthead counts is listed and steppable; every
   card the Outline's header counts is listed and searchable; every card has a place on the Freeform
   board; a parent cycle is named by the check.
4. **Starting the board or running the check does not re-read unchanged PDFs.**

## Sources and current-state evidence

All verified at HEAD `d4341735` (board 1.12.3) on 2026-11-18, by reading the code and, where
marked, by running scratch reproductions against the real modules. Every finding still reproduces;
none has moved materially.

| Finding | Location at HEAD | Verified |
|---|---|---|
| R-10 | `src/store.ts:605-615` (`descendantsOf`, no visited set). Callers: `BoardView.tsx:91` (lineage memo, used at :187), :237 (drag start), :442 and :600 (epic tidy), and also `OutlineView.tsx:179` (collapsed-row count), which FINDINGS does not list. Freeform: `src/board/autoLayout.ts:36-47` files a card under its parent whenever the parent exists, and places only what an epic reaches, so cycle members get no placement (no crash). No error boundary anywhere in `src/` (no `componentDidCatch` or `getDerivedStateFromError`); `main.tsx` renders `<App>` bare under `StrictMode` and `HashRouter`. | Reproduced: the same walk on a self-parented story overflows the stack. |
| R-11 | `shared/move.ts:50-53`; reached from `src/board/mappedLayout.ts:94` and `src/store.ts:395`. `shared/files.ts:125` accepts any string as `type`. A second throw on the same data: `ItemModal.tsx:223` (`TYPE_LABEL[item.type].toLowerCase()` in the delete confirmation). Other type-keyed lookups render `undefined` or sort by `NaN` but do not throw (`CardNode.tsx:21`, `bits.tsx:82/86`, `itemSearch.ts:91`, `BoardMinimap.tsx:187`, `shared/csv.ts:51`). `shared/check.ts:93-96` already guards its own lookups. | Reproduced: `TypeError: Cannot read properties of undefined (reading 'includes')`. |
| R-47 | `server/artifactFiles.ts:113` (`readFileSync` outside any try, after a successful stat). `svgFacts` (:117) and `markdownFacts` (:125) also run unguarded. The finding's "also" on `REPO_ROOT` symlink paths is B01's (B01-REQ-07). | Reproduced: a mode-000 SVG makes `loadCatalogue` throw `EACCES`. |
| R-48 | `shared/artifacts.ts:45-53`; callers :74 (SVG attributes), :99 (SVG text), :334 (Markdown facts). | Reproduced: `RangeError: Invalid code point 99999999`. |
| R-49 | `server/historyJournal.ts:93-94` (`readdirSync` and `statSync` outside `quietly`); called at `catalogueApi.ts:132` (API start) and :608 (every sync, which DELETE runs first at :358). Also inside `quietly`: a torn `<id>.shots.json` (:97) makes that folder's record fail every time and is never repaired; one unstat-able image (:104) abandons the whole folder. | Reproduced: a dangling symlink in `assets/` throws `ENOENT` out of `screenshots()`. |
| R-50 | `server/catalogueFs.ts:90-106` (`readLayout`: `positions` taken as is), :285-298 (`serialiseLayout` reads `p.x`); `catalogueApi.ts:385-391` (delete's layout cleanup) and :567-596 (layout PUT spreads the on-disk positions). A top-level `null` or array is reported as "not valid JSON", which is misleading. | Reproduced: `{"positions":{"US-01.1.1":null}}` reads with no error, then `serialiseLayout` throws. |
| R-51 | `src/diff/viewedStore.ts:15-23` (only parse errors caught), :25-36 (`writeViewed` throws on a `null` store inside its catch, so the value is never repaired). `tests/viewedStore.test.ts` covers unparseable text only. The same pattern (valid JSON spread or used without a shape check) is in the board's view preferences (`store.ts:648-656`), artifact preferences (`artifactIndex.ts:130-140`), the board viewport (`BoardView.tsx:57-65`) and the Outline collapse set (`OutlineView.tsx:11-17`, which survives only because its `catch` covers the throw); `usePersistentState.ts` already accepts only listed values. | Read. |
| R-52 | `src/artifacts/find.ts:52-58` (one `at` entry per source character, but "İ" lower-cases to two code units); used by `CanvasViewer`, `MarkdownReader`, `PdfReader` and `CardFind`. No test file for `find.ts`. | Read (FINDINGS reproduced it in jsdom). |
| R-53 | `shared/remove.ts:22-35` (the guard checks `out`, which never holds the root); `planDelete` at :57. | Reproduced: a self-parented story gives `doomed: [US-01.0.1, US-01.0.1]`. A two-card cycle also lists the root twice. |
| R-65 | `server/catalogueFs.ts:72-83` (`listMd` keeps any `.md`); also feeds `takenIds` (:88), so a dotfile claims an ID. The git-side reader (`catalogueDiff.ts:143`) already uses a strict file-name pattern. | Reproduced: `._EP-01.md` gives a "not named after an ID" warning and a "could not be read" error. |
| R-66 | `shared/files.ts:27-29` (`splitFrontmatter`; the BOM is kept, so the fence test fails). | Reproduced: "file must start with a --- frontmatter fence". |
| R-121 | `src/questionWalk.ts:39` (`shownGroups` lists configured codes only), :46-50 (`questionWalk`); `QuestionsView.tsx:21-24`, :117 ("Nothing matches."); masthead count `App.tsx:128` (`isOpenQuestion`, true for any unknown code). The check already errors on an unconfigured question status (`shared/check.ts:382`). | Read. |
| R-122 | `src/views/OutlineView.tsx:50-58` (walk starts at parentless epics only), header counts at :108 (all items by type); the search's ancestor walk (:41-45) is already cycle-safe. | Read. |
| R-160 | `server/artifactFiles.ts:73` (in-process cache only), :81-88 (one `execFileSync` of `pdfFacts.ts` per PDF), :131. | Measured: `node scripts/check.ts` took 8.9 s wall-clock (cold) with 7 PDFs in the catalogue. |

Other facts this specification relies on:

- The check reports at least one error on some member of every parent cycle: a cycle must include
  an epic with a parent or a card whose parent has the wrong type, and both are errors
  (`shared/check.ts:105-116`). It never says "cycle". The real catalogue has no parent cycle today
  (387 items, 0 check errors at HEAD, checked by a scratch walk), so naming cycles adds no issue to it.
- Server-side problems already reach the user one way: `parseIssues` and the check's issues travel
  in the catalogue snapshot and events, and the masthead's problem pill (`ProblemPill.tsx`, DESIGN.md
  "Fixed visual language") lists them under Checks, with Settings listing every error and note.
  Client-side problems (a crash, a damaged browser store) have no surface today.
- Tree walks that start from parentless epics cannot loop (no cycle is reachable from a root). Only
  walks that start from an arbitrary card can: `descendantsOf` in both files, and any walk that
  starts from an unplaced card.
- `?item=` and `?question=` survive a reload, so a crash caused by the open card repeats on every
  load.
- Module-level sheet drafts (`useEditableRecord.ts`) outlive the components that show them.

Assumption (not verified, to confirm in planning): React's error boundaries catch exceptions thrown
while rendering and in effects, including layout effects, but not those in event handlers or
promises. The R-52 crash is in a layout effect; the `ItemModal.tsx:223` throw is in a click handler.

## Detailed requirements

### B03-REQ-01 · A crash is contained, reported and recoverable (systemic issue 5; backstop for R-10, R-11, R-52; D-06)

The boundary is a backstop. Each owned crash is also fixed at its root (REQ-02 to REQ-07), and the
boundary must not be the only fix for any finding.

1. An exception thrown while rendering a protected region replaces that region only with a
   recovery panel. At minimum each routed view (Board, Artifacts list, artifact page, Outstanding
   items, Outline, Diff, Settings, About), the item sheet (modal and docked) and the question sheet
   are protected, each on its own, so a crash in a sheet does not take down the view behind it
   and the reverse.
2. The masthead stays mounted and working through any caught crash: navigation, the problem pill and
   its list, so the user can read the check issue that usually explains the crash.
3. The recovery panel says in plain words that this part of the board failed, and offers a way back
   that does not crash again on reload. When the failing region is the open card's sheet, or a view
   that failed while a card or question was open, one action closes it (clears the open-card
   parameter). Moving to another view, or opening another card, gives the new region a fresh start.
4. A caught crash never discards unsaved sheet drafts and never stops the leave-page prompt
   protecting them. How a draft is recovered after its sheet crashes is B06's (consistent with D-06).
5. A caught crash is never silent: the error and where it happened are kept in the browser console at
   least, and reported as D-06 decides.
6. A recovery attempt that fails again shows the panel again; it never loops re-rendering.
7. Data problems the server finds keep reaching the existing issues list unchanged; REQ-02, REQ-04
   and REQ-05 add new issues to that same list.
8. The problem pill (`ProblemPill.tsx`) keeps the behaviour in the issue-surface contract above:
   one pill, shown only while a problem stands, one grouped list, notes never problems, "All clear"
   only when the last problem goes. Whatever D-06 adds (a group for caught crashes, say) follows the
   same rules.

*Conditional on D-06:* where the crash is reported (in place, in the problem pill, or both), the
exact recovery actions, whether a region retries by itself when the catalogue changes, how much
technical detail is shown, and whether uncaught errors from event handlers and promises are
surfaced too.

*Placement:* the boundary round the docked item sheet sits in `BoardView.tsx` and those round routes
and modals in `App.tsx`; B03 is first on both rows of PLAN's shared-files table.

### B03-REQ-02 · Parent cycles never crash, hide or go unnamed (R-10, R-53)

1. Every walk over the parent graph that can start at an arbitrary card visits each card at most
   once and never includes the starting card among its own descendants, for self-parents and
   cycles of any length. This covers both `descendantsOf` functions, the Freeform placement and any
   walk added by REQ-07.
2. With a self-parented card or a member of a two-card cycle in the catalogue: the board renders in
   both modes; clicking the card (from the orphan column, search, or the problem list) opens its
   sheet and draws its lineage; dragging and tidying work or refuse cleanly; the Outline's collapsed
   count is a finite number. Nothing white-screens, on first load or on reload with `?item=` set.
3. Deleting a card in a cycle (`planDelete` and the DELETE route) lists each doomed card once,
   removes each file once, runs the layout clean-up, broadcasts the issues and returns success; the
   confirmation counts what really goes.
4. In Freeform, every card the epic tree does not reach, cycle members included, is placed in the
   orphan stack, each card exactly once, so no card in the catalogue is missing from the Freeform
   board. (R-10's "What")
5. The catalogue check names each parent cycle: an error that lists every member of the cycle, shown
   on those members so the problem list leads to them. A self-parent is a cycle of one. The existing
   wrong-type-parent and epic-with-a-parent errors stay. An acyclic catalogue gains no issue, so the
   real catalogue stays green.
6. Preserved: the deepest-first removal order; delete plans for acyclic trees unchanged
   (`tests/remove.test.ts`); `ancestorsOf`, `isRetiredOrUnder`, `readingWalk` and graph code keep
   their guards; Freeform placement of reachable cards is unchanged (`tests/autoLayout.test.ts`).

### B03-REQ-03 · A card of an unconfigured type never throws (R-11)

1. `canParent` answers false (never throws) for a card or parent whose type is not one of the item
   types. A move of such a card is refused the way other invalid moves are.
2. On the Mapped board such a card is drawn in the column of cards whose parent is missing or of the
   wrong type, as `mappedLayout` already promises; the board, the problem list and the rest of the
   app stay up in every mode.
3. No other lookup keyed by item type on a load, render or user-action path throws for such a card,
   including the delete confirmation (`ItemModal.tsx:223`).
4. Wherever the board shows a card's type in words (card tooltips, the lineage segments, the CSV
   export, the delete confirmation), an unconfigured type shows as stored, never as `undefined`.
   Ordering by type (search results, the minimap) puts such cards in a fixed place after the known
   types rather than sorting by `NaN`.
5. Preserved: every move that is valid today stays valid; the check's own message for an unknown
   type; labels and ordering for the three configured types.

### B03-REQ-04 · One file never stops the catalogue loading (R-47, R-48, R-49, R-65)

Applies to everything that calls `loadCatalogue` (dev server start and every sync, `npm run check`,
the scripts) and to the screenshot scan.

1. An artifact file that cannot be read (permission denied, gone between stat and read, a folder
   where a file was expected) becomes an error issue on that artifact naming the file and the reason.
   Every other record loads. The failure is not cached, so fixing the file is picked up by the next
   sync. Where the file lives is decided by B01's real-path rule (B01-REQ-07), which B03 reuses
   unchanged. (R-47)
2. Deriving facts from one artifact file (SVG, Markdown, image, PDF, mermaid source) never throws out
   of the load. Any failure becomes that artifact's issue. (R-47)
3. A numeric character reference outside the Unicode range (above U+10FFFF, or one that cannot be
   decoded) is left as written, in SVG text and attributes and in Markdown facts. Valid references
   keep decoding as today, including astral ones up to U+10FFFF. (R-48)
4. The screenshot scan never fails API start, a sync or a delete. An entry in `assets/` that cannot
   be stat-ed (a dangling symlink, a folder removed mid-scan) is skipped. One unreadable image
   does not abandon the rest of its folder. A damaged `<id>.shots.json` is treated as no earlier
   record and rewritten, so the folder's history resumes rather than failing on every sync. (R-49)
5. Files whose names start with `.` in the record folders (`stories/`, `questions/`, `artifacts/`)
   are ignored entirely: not loaded, not reported, and they claim no ID. Visible `.md` files that are
   not named after an ID keep their warning. (R-65)
6. If the check itself fails on unexpected data, the load still completes and reports one error
   issue saying the check could not finish and why, rather than throwing. (Systemic issue 5;
   resilience backstop, not tied to a known trigger.)
7. Preserved: every existing issue keeps its wording and severity; `npm run check` exits non-zero
   exactly when there are errors; a failed record still reserves its ID; the per-version artifact
   cache still avoids re-reading unchanged files within a process.

### B03-REQ-05 · Record and layout files parse robustly (R-66, R-50)

1. A record file (item, question, sidecar) that starts with a UTF-8 byte-order mark parses as if the
   mark were absent, on every path that parses records: the live load, the board's own re-reads
   before writes, and the Diff review's git versions. A save may write the file without the mark.
   (R-66) Whether the JSON files get the same tolerance is B03-Q3.
2. `board-layout.json` positions are checked on read. A `positions` value that is not an object, and
   any entry without finite numeric `x` and `y`, never reaches the board, the server's state or a
   written file. The problem is an issue on the layout naming the dropped card IDs. (R-50)
3. No layout save, card delete or lane change returns 500 because of what `board-layout.json` holds.
   A delete that has removed its files reports success. (R-50)
4. A layout whose top level is valid JSON but not an object is reported as that, not as "not valid
   JSON". (R-50)
5. *Conditional on B03-Q2:* while damaged entries stand, either layout saves are refused with a
   clear message (as an unreadable layout is today) until the file is fixed by hand, or the next save
   drops them and the issue clears. Either way the user is told.
6. Preserved: unparseable JSON keeps blocking layout writes with today's message; valid positions,
   `lanes` and `firstLane` read exactly as today; `serialiseLayout` output for a valid layout is
   unchanged byte for byte.

### B03-REQ-06 · Browser-side parsing never crashes a view (R-51, R-52)

1. The Diff tab's Viewed store treats any stored value that is not an object of comparisons (`null`,
   a number, a string, an array) as no ticks, and any comparison whose value is not an object as no
   ticks for that comparison. The Diff tab renders. The next tick replaces the damaged value, so the
   repair sticks. (R-51)
2. Every store that keeps JSON in browser storage reads it through one shared rule: a value that
   does not parse, or parses to the wrong shape (the wrong top-level type, or a field of the wrong
   type), is treated as absent for the parts that are wrong, falling back to that store's defaults,
   and never throws later in a view. This covers the Viewed store, the board's view preferences, the
   artifact preferences (B10 builds its filter work on the same rule), the board viewport and the
   Outline collapse set, and any such store added later. (R-51, root of the pattern; PLAN B03
   territory)
3. Preserved for the Viewed store: unparseable text reads as empty (existing test), only the last
   20 comparisons are kept, and a blocked store still lets ticks last until the page closes. Preserved
   for every store: values that are well formed today read exactly as today; a blocked store keeps
   working for the session; plain-string stores (`usePersistentState`) keep accepting only listed
   values. The rule keeps B02's R-46 rule for the view preferences in `src/store.ts`: the saved
   status filter is never pruned while the status list is momentarily invalid (damaged), and only
   B02's rule decides when pruning may happen; the shape check never drops a status code on its own.
4. Find in an artifact or a card places every match on the right characters, and never throws, when
   the text holds characters whose lower case is longer than the original (U+0130 "İ" is the known
   one). The count shown before a PDF page is drawn (string matching) equals the number of matches
   found once it is drawn (DOM matching) for the same text. (R-52)
5. Preserved for find: case-insensitive matching, whitespace runs as one space, the SVG, PDF and
   document joining rules, and the skip hook for hidden step parts.

### B03-REQ-07 · Everything counted is listed (R-121, R-122)

**Outstanding items (R-121)**

1. A question whose status is not one of the configured question statuses is listed, in a group after
   the configured groups that marks the status as not configured and shows the status as stored.
   Unconfigured statuses are never "answered", so the group shows whether or not Show answered is on.
2. The group obeys the owner, kind and search filters like the others. "Nothing matches." shows only
   when no group has a question.
3. The question sheet's Previous and Next step through these questions in the same order the page
   lists them, so a lone unconfigured question still has a working sheet.
4. With no filters set, the number of not-answered questions the page lists equals the masthead count.
5. Preserved: configured group order and headings, the anchor that keeps an answered question among
   its old neighbours while stepping (`tests/questionWalk.test.ts`), the check's error on the status.

**Outline (R-122)**

6. Every card in the shown index appears exactly once in the Outline. A card the epic tree does not
   reach (parent missing, a non-epic with no parent, members of a parent cycle) is listed in a final
   group, after the epics, that names the reason plainly. The cards under it are listed beneath it
   as usual, so the valid stories of an orphaned feature keep their context.
7. Search covers the group: searching for such a card's ID or title lists it, never "Nothing matches".
   The retired filter applies to it as to the tree.
8. The walk that builds the group terminates and lists no card twice, whatever the cycles (REQ-02).
9. Keyboard movement through the tree (roving tab stop, arrows, Home, End, Enter) reaches the group's
   rows. Collapsing a row in the group works like any other row.
10. Preserved: epic tree order, collapse state kept per browser, the header counts' meaning, search
    expanding matches with their ancestors.

### B03-REQ-08 · PDF facts are not re-extracted for unchanged files (R-160)

1. A PDF whose content has not changed since its facts were last extracted is not re-extracted when
   the dev server starts or `npm run check` runs again, in a new process.
2. The facts used are always those of the file's current content: a change of content, of the
   extractor, or of what is extracted invalidates the stored facts. Time stamps alone are not trusted
   for this.
3. Damaged, partly written or unreadable stored facts are ignored and rebuilt; they never crash the
   load or give wrong facts. Two processes (the dev server and a check, say) running at once never
   leave the store damaged.
4. A failure to run the extractor (a missing Node binary, a timeout) is not stored as the file's
   facts. A file that reliably is not a readable PDF may be remembered as such.
5. When several PDFs need extracting, the cost does not grow by one child-process start per PDF.
   (Candidate: one extractor run for many paths, as FINDINGS proposes.)
6. Stored facts live outside the requirements catalogue and outside git (like `.history/`), are never
   part of a catalogue diff, and tests can run without sharing them with the real board.
7. Preserved: the facts themselves (page sizes, loose text) are identical to today's for every PDF in
   the catalogue; the check's PDF issues keep their wording.

## Dependencies and handoffs

**Inputs:**
- **B01:** the real-path rule in `server/artifactFiles.ts` (B01-REQ-07), which decides where an
  artifact file lives, including the `REPO_ROOT` symlink case of R-47. B03 reuses it unchanged.
- **B02:** B02's shape of `server/catalogueApi.ts` (status guard) and `src/store.ts` (status filter
  persistence), which B03 edits after it in serial order.
- Accepted decisions 1 to 12 in PROGRESS.md; D-06 recorded before build.

**Outputs and handoffs:**

| To | What B03 hands over |
|---|---|
| B04 | B03's shape of `shared/artifacts.ts` (entities), `shared/files.ts` (BOM), `shared/remove.ts` (`descendantsOf`) and `shared/check.ts` (the parent-cycle issue). B04's rule changes keep these behaviours. |
| B08 | A `historyJournal.ts` screenshot scan that skips unstat-able entries and repairs torn `shots.json`; B08 changes hashing on top of it. |
| B05 | A `catalogueFs.ts` whose `loadCatalogue` never throws for one file, a `listMd` that ignores dotfiles (so ID allocation ignores them), and a `readLayout` that returns only valid positions plus a damaged-entries signal; B03's layout and delete handling in `catalogueApi.ts`. B05 builds the write routes on this shape. |
| B07 | Boundary mounts in `App.tsx` and the problem pill's structure; B07's live-update and message-text changes keep them. |
| B06 | The boundary round both sheets, the issue-surface contract and D-06; B06 decides how a crashed sheet's draft is offered back (with R-12, R-42, R-43). B03's minimal `ItemModal.tsx` change for unknown types. |
| B09 | A Viewed store that survives damaged values, on the shared storage reading rule; R-93 (cross-tab ticks) builds on it. |
| B10 | A correct `find.ts`; the shared storage reading rule for its filter preferences (R-106); viewers report failures through the issue-surface contract and D-06. |
| B11 | A `canParent` that never throws (before `planMove` work); an Outline that lists every card (before twisty and search work, R-126); Freeform placement of cycle members in `autoLayout.ts`; the boundary round the docked sheet in `BoardView.tsx`. |
| B14 | The `.gitignore` entry for stored PDF facts; B14 makes sure the kit export neither ships the stored facts nor misses the ignore rule. |
| B15 | Dispositions and proof for all 14 findings. |

**Files outside B03's own territory** (resolved: PLAN's shared-files table lists B03 first on each,
and touch rights, convention 11, cover the minimal edits): `src/App.tsx` (boundary mounts),
`src/views/BoardView.tsx` (docked-sheet boundary), `src/board/autoLayout.ts` (cycle members),
`src/views/QuestionsView.tsx` and `src/questionWalk.ts` (unconfigured statuses),
`src/artifacts/find.ts` (U+0130), `src/diff/viewedStore.ts` (bad JSON), `src/components/ItemModal.tsx`
(unknown type), `server/catalogueApi.ts` (load isolation; layout PUT and delete clean-up if REQ-05
needs them), `shared/check.ts` (cycles), `.gitignore` (PDF facts). Edits for labels and storage
readers in `CardNode.tsx`, `bits.tsx`, `itemSearch.ts`, `BoardMinimap.tsx`, `shared/csv.ts`,
`src/store.ts`, `src/artifactIndex.ts` and `OutlineView.tsx` are minimal and named in the PROGRESS
entry.

Integration proof owner: B03 for its own findings; B15 for the programme.

## Acceptance and evidence

Every proof must fail on the code before the fix and pass after it (convention 13). It is an
automated test where practical (Vitest unit or jsdom test, or a Playwright spec on a free port),
otherwise a recorded manual check with steps and result, run once before and once after. The
execution plan picks the tool and the fixture; the obligations below say what must be shown.

**Unconditional, per finding:**

| Finding | Proof obligation |
|---|---|
| R-10 | With a self-parented card and with a two-card cycle: store `descendantsOf` returns finite, duplicate-free results, never the start card; the board (both modes) and the Outline render with that card open, including on reload with `?item=` set; Freeform places every cycle member in the orphan stack exactly once; the check reports an error naming every member of each cycle, and the real catalogue's check output is unchanged. |
| R-11 | `canParent` returns false for an unknown type as the card and as the parent; `mappedLayout` places an unknown-type card in the orphan column without throwing; the delete confirmation for such a card opens; its tooltip, lineage segment and CSV row show the stored type, not `undefined`; ordering by type puts it after the known types. |
| R-47 | `loadCatalogue` over a catalogue with an unreadable artifact file returns every other record, with an error issue naming the file; making the file readable clears the issue on the next load in the same process. |
| R-48 | Decoding `&#99999999;` and `&#x110000;` leaves them as written; a sidecar's SVG and Markdown file containing them loads with no exception; valid decimal, hex and astral references decode as before. |
| R-49 | The screenshot scan over an `assets/` holding a dangling symlink, a folder with one unreadable image and a torn `shots.json` finishes, records the readable images, and repairs the torn file; API creation and a sync succeed. |
| R-50 | Reading layouts with a `null`, string, array and non-finite entry, and with `positions` not an object, yields only valid positions and an issue naming the dropped IDs; a layout save and a delete over such a file never return 500 and never write junk keys; a top-level `null` gets an accurate message. |
| R-51 | With the stored Viewed value set to `null`, a number, an array and a comparison mapped to a non-object, the Diff tab renders with no ticks, and one tick leaves a well-formed stored value. For each other JSON store (view preferences, artifact preferences, board viewport, Outline collapse set), a stored value of the wrong top-level type and one with a field of the wrong type each read as that store's defaults for the wrong parts, and the view that uses it renders. |
| R-52 | Find over text with "İ" before and after the match places each range on the matched characters, never throws, and its count equals the string count for the same text. |
| R-53 | `planDelete` for a self-parented card and for a member of a two-card cycle lists each card once; the DELETE route over that catalogue removes every doomed file, cleans the layout and returns success. |
| R-65 | A catalogue holding `._EP-01.md` and `.#US-01.1.1.md` loads with no issue for them, and neither name is offered as a taken ID. |
| R-66 | An item, a question and a sidecar saved with a BOM parse identically to the same files without it, live and as a git version. |
| R-121 | With a question whose status is unconfigured: it is listed after the configured groups, is reachable by Previous and Next, shows with Show answered off, and the listed not-answered count equals the masthead count; alone, the page does not say "Nothing matches.". |
| R-122 | A story with a parent typo, a feature with no parent and its valid stories, and a cycle pair are each listed once in the Outline's final group; searching each one's ID finds it; keyboard focus reaches the rows. |
| R-160 | A second check (new process) over an unchanged catalogue starts no PDF extraction; changing one PDF re-extracts only that one; a damaged stored-facts file is rebuilt; facts are identical to today's for every catalogue PDF. Record before and after wall-clock times for `npm run check`. |

**Unconditional, boundary (REQ-01):** a render-time exception thrown in a test region inside each kind
of protected region (a view, the docked sheet, a modal sheet) shows the recovery panel there while the
masthead and the other regions keep working; leaving or closing recovers; an unsaved draft survives
the crash; a reload after closing the failed card does not crash again; a recovery attempt that
fails again shows the panel rather than looping.

**Unconditional, issue surface:** the problem pill still appears only while a problem stands, lists
Connection, Card moves and Checks as today, never counts notes, and shows "All clear" only after the
last problem goes (the existing behaviour, proved unchanged).

**Prohibited regressions:** `npm run verify:board` green; the existing suites for store, remove,
move, autoLayout, mappedLayout, questionWalk, viewedStore, artifacts, catalogue and api pass unchanged
except where a test encoded the defect; `npm run check` on the real catalogue gives the same issues
as before the phase (compare the output); the board's e2e specs that touch Board, Outline, Questions
and Diff pass on a free port; no requirement file changes.

**Awaiting a named decision:** the recovery panel's exact actions, where the crash is reported and
whether handler and promise errors are surfaced (D-06); whether damaged layout entries block saves or
are dropped (B03-Q2); BOM in JSON files (B03-Q3).

## Deferred decisions for execution planning

Register: [PROGRESS.md "Deferred decisions"](../../PROGRESS.md). Resolve each with the user in B03's
implementation-planning conversation and record the answer there before building.

### D-06 · How bad data and a caught crash are reported and recovered (owned)

- **Source/gap:** systemic issue 5 asks for an error boundary and for problems to "become issues";
  nothing says where a client-side failure shows or how the user gets back.
- **Affects:** REQ-01 (all, including the problem pill's groups in REQ-01.8), REQ-06.1 and REQ-06.2
  (whether a repaired store is mentioned), the issue-surface contract in the header, and how B06,
  B10, B11 report their own failures.
- **Owner:** B03. **Dependents:** B06 (sheet crash and draft recovery), B10 (viewer load failures),
  B11 (canvas and view crashes). **Gate:** before B03 builds.
- **Options:**
  1. *In place only.* The failed region shows a recovery panel; the problem pill is unchanged. Simple
     and local; a crash in a region the user then leaves leaves no trace.
  2. *Problem list only.* The region shows a minimal placeholder, and the pill gains a group (beside
     Connection, Card moves, Checks) naming what failed, with the recovery actions there. One place
     for every problem, as DESIGN.md's single-pill rule wants; the region itself says little.
  3. *Both.* A recovery panel in place, and an entry in the pill until the region recovers. Most
     visible; two surfaces to keep in step, and the pill's "All clear" must wait for recovery.
- **Sub-choices under any option:** the recovery actions (try again, close the open card, go to the
  board, reload); whether a failed region retries by itself when the catalogue changes (an agent fixes
  the file); how much technical detail shows (message only, or a copyable component stack: it is a
  dev tool); whether uncaught errors in event handlers and promises are also caught page-wide and
  shown; how far down boundaries go (per view and sheet as REQ-01 requires, or also per viewer or
  canvas, which B10 and B11 would then use); whether a silently repaired browser store is mentioned.
- **Boundary impact:** none on territories; it completes the issue-surface contract B06, B10 and
  B11 follow.

**Answered 2026-11-19** (accepted decision 17, PROGRESS.md): D-06 both surfaces (recovery panel in
place and a "This page" group in the problem pill; auto-retry on a catalogue change; copyable
details; page-wide capture of uncaught errors; a reset browser preference mentioned), B03-Q2 the next
save drops damaged layout entries, B03-Q3 a byte-order mark is tolerated in records and all three JSON
files and kept on rewrite. B03-Q1, Q4, Q5 and Q6 were answered earlier.

### B03-Q1 · Freeform placement of cycle members

Answered (accepted decision 10, 2026-11-18): B03 delivers it (B03-REQ-02.4, proof in the R-10 row).

### B03-Q2 · Damaged layout entries: block saves or drop them (open)

- **Source:** R-50's proposed fix says both "keep only entries with finite x and y" and "return 422
  while it stands".
- **Affects:** REQ-05.5. **Owner:** B03 (with the user). **Options:** refuse layout saves until the
  file is fixed by hand (consistent with an unparseable layout today; every drag fails until then), or
  let the next save drop the damaged entries and clear the issue (self-healing; the dropped entries
  are rewritten without asking, though they are junk, not requirement content). **Gate:** B03 build.

### B03-Q3 · BOM tolerance in JSON files (open)

- **Source:** R-66 covers record files. `board-layout.json`, `board.config.json` and
  `status-recodes.json` fail the same way with a BOM (as "not valid JSON").
- **Affects:** REQ-05.1. **Owner:** B03; `board.config.json`'s format is B02's (D-02), so B02 must
  agree. **Options:** extend tolerance to all three, to the layout only, or leave them. **Gate:** B03
  build.

### B03-Q4 · Labels for an unconfigured item type

Answered (accepted decision 10, 2026-11-18): unknown-type labels are B03's; they fall back to the
stored type (B03-REQ-03.4, proof in the R-11 row).

### B03-Q5 · Other browser stores with valid JSON of the wrong shape

Answered (accepted decision 10, 2026-11-18): B03 hardens the shared browser-storage reading rule so
every JSON store rejects valid JSON of the wrong shape; B10's artifact preferences use it
(B03-REQ-06.2, proof in the R-51 row).

### B03-Q6 · Should the check name parent cycles

Answered (accepted decision 10, 2026-11-18): B03 names parent cycles in the check (B03-REQ-02.5,
proof in the R-10 row); B04 builds its rule changes in `shared/check.ts` after it.

## Risks and recovery requirements

- **A boundary that hides bugs.** A caught crash must stay visible (REQ-01.5) and every known crash
  path must be fixed at the root; reviewers check that no finding is closed by the boundary alone.
- **Recovery loops.** Retrying straight into the same crash, or a reload with the failed card still
  open, must end at the panel, never in a render loop or a white screen.
- **Lost edits.** Unmounting a crashed sheet must not drop or orphan drafts beyond what B06 can
  recover; the leave prompt must still protect them.
- **Stale or wrong PDF facts.** A cache that keys on anything weaker than content and extractor
  version can make the check pass or fail wrongly. Damage and concurrent writers must degrade to a
  re-extraction, never to wrong facts. The store must be deletable at any time with no effect but
  speed.
- **Silent data change.** Dropping layout entries (B03-Q2) or rewriting a BOM file on save changes
  files the user did not edit. Both are limited to non-requirement bytes; neither may touch
  requirement content (PROGRESS convention 7). Show the user before any rewrite of the real catalogue
  runs.
- **Live lanes.** Build lanes merge board changes from master; nothing here changes catalogue formats
  or agent tools, so lanes need no migration. A new git-ignored folder must be ignored in every
  worktree (it ships in the board's own `.gitignore`).
- **Performance.** Per-record guards and position checks must not slow the load measurably; record
  before and after timings for `npm run check` on the real catalogue.
- **Rollback.** Each requirement is independently revertible; the stored-facts location can be deleted
  to return to today's behaviour.

## Execution and handoff obligations

1. Read PROGRESS.md, PLAN.md, this SPEC and the 14 findings in full before acting. Confirm B01 and
   B02 are recorded as done. Reconfirm HEAD and re-verify each finding still reproduces; mark any that
   no longer do as "Not reproducible at HEAD" with evidence.
2. Resolve D-06, B03-Q2 and B03-Q3 with the user (B03-Q3 with B02's agreement for
   `board.config.json`), and record the answers in PROGRESS.md before building.
3. Write `phases/B03-load-resilience/IMPLEMENTATION.md` before building: the chosen approach per
   requirement, the decisions inherited, the execution bites, the tests that prove each finding, and
   recovery steps.
4. Build test first: each fixable finding gets a regression proof that fails before the fix and passes
   after (convention 13), as a test where practical, otherwise a recorded manual check.
5. Finish green: `npm run verify:board` from the repo root; touched Playwright specs on a free port.
6. Bump the board version (`requirements-board/package.json` and its lock file; minor, since users
   see new list groups, a new check issue and a recovery panel) and add a `CHANGELOG.md` entry in the
   existing style.
7. Update the doc lines that describe behaviour B03 changes (convention 12): for example the problem
   pill's lines in `DESIGN.md` if D-06 adds a group, the About page if it describes the Outline,
   Questions or check behaviour changed here, and any SCHEMA line on the check's parent rules. List
   every doc line changed under "Doc facts" in the PROGRESS entry.
8. Run the three review lenses as independent reviewers: quality and maintainability; completeness
   against this SPEC (every REQ and finding); bugs and correctness (cycles, races, cache validity,
   recovery loops). Verify their findings, fix the confirmed ones, rerun verification.
9. Give every owned finding one disposition (Fixed with its test, Not reproducible at HEAD with
   evidence, Won't fix with the user's acceptance and reason, or Moved to a named owner, recorded in
   PROGRESS.md and both SPECs).
10. Write the PROGRESS.md phase entry last: what was delivered, decisions taken, dispositions,
    timings, the minimal edits made in other phases' files (convention 11), the Doc facts list, and
    facts later phases need (the issue-surface contract as D-06 settled it, the shape of the layout
    read, the storage reading rule, the stored-facts location). Commit only this phase's files,
    staged by path at commit time; never push.
