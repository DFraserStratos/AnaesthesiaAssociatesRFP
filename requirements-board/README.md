# Requirements Board

A local dev tool for reading, editing and arranging a requirements catalogue. Not part of any app
the catalogue describes, and never deployed: its dev server is its file API.

This folder is a **portable kit**, three parts:

- **the app** (everything below except `requirements/` and `agent/`): generic. A project's own
  vocabulary (its name, components, screenshot apps, status wording, screenshot capture) is read
  from `requirements/board.config.json`; with none, the board runs on neutral defaults;
- **`requirements/`**: this project's requirements catalogue, the only project data. Stories,
  questions, notes, change logs, artifacts and their files, screenshots and their capture recipes,
  the domain model, `board.config.json`. Its `README.md` is the folder guide and conventions, its
  `SCHEMA.md` the file format. The app and any agent edit those same files;
- **`agent/`**: the agent skills that maintain the catalogue (`skills/update-requirements`,
  `skills/update-build-plan`, `skills/run-build-phase`, `skills/add-artifact`, `skills/svg-diagram`,
  `skills/transcript-reconciler`, `skills/consistency-review`) and the `workflows/link-requirements.js`,
  `workflows/consistency-rulings.js` and `workflows/consistency-changes.js` workflows. Claude Code finds them in the
  host repo's `.claude/skills/` and `.claude/workflows/`, put there by `npm run install-skills`: copies
  (they work on any OS, zip or cloud drive), or relative symlinks (a real folder per skill holding a
  symlink per top-level entry, file or folder, so the `/` menu lists them). An install keeps the mode
  already in use and a repo with none gets copies; `-- --link` or `-- --copy` chooses. It leaves
  `.claude/` holding exactly the board's current skills (one the board no longer has is removed; skills
  of the repo's own are never touched) and never installs junk (dotfiles, `__pycache__`). Edit the
  files here, never in `.claude/`.
  Each skill keeps its few repo-specific facts in one "This repo" block. `update-build-plan` also
  carries its scripts and workflows in `skills/update-build-plan/tools/`; a plan's own settings live
  in its folder's `plan.config.json`, not in the kit.

```
npm install
npm run dev          # http://localhost:5180 (BOARD_PORT moves it; a worktree's .lane.env sets it)
npm test             # Vitest: file round-trip, check rules, IDs, the file API, store (incl. undo), board graph, both layouts, move planner
npm run test:e2e     # Playwright on a fixture catalogue (BOARD_PORT + 2: 5182); BOARD_E2E_REAL=1 adds the live catalogue's checks (BOARD_PORT + 3: 5183, read-only)
npm run build        # typecheck + bundle (sanity only; the app needs the dev server)
npm run typecheck    # tsc -b over the app, server, scripts and tests (plain `tsc -p .` checks nothing)
npm run verify       # typecheck + unit tests + catalogue check + the agent tools' node --test suites: run before handing work back
npm run check        # validate the catalogue, exit 1 on errors
npm run export:csv   # regenerate the Miro CSVs (-- --out <dir> to write elsewhere)
npm run links:index  # compact catalogue index and epic batches for the linking agents (.links/); starts a link run
npm run links:apply  # apply the latest link run's verified proposals (-- --dry-run first; -- <dir> for another run)
npm run artifact:new # register a file or a mermaid diagram as an artifact (-- --help)
npm run artifact:steps # screenshot a stepped diagram in this worktree's running board (BOARD_PORT), whole then each step (-- AR-nn [--out <dir>] [--url <base>])
npm run source       # where a source string points: artifact, file, page or lines (-- --item <ID> --text, -- --report)
npm run capture      # screenshots of the project's app from recipes (optional; see Capturing screenshots)
npm run install-skills # install the skills and workflows into the repo root's .claude/ in the mode in use (merges with others; -- --link or -- --copy to choose)
<!-- kit:omit -->
npm run kit:export   # export the clean, shareable kit (-- --to "<folder>" [--dry-run] [--uncommitted]); see Sharing the board
<!-- /kit:omit -->
```

The board's About page (`/about`, the ⓘ in the masthead) explains the requirements loop and every
skill for a new user; Settings (`/settings`) edits the project's name and accent, the components, the
status lists and the writing voice (`requirements/VOICE.md`).

A host repo usually adds root scripts that call these (`ADOPTING.md`). Run them from the repo root:
a path you give a script (`artifact:new`'s file, `--out`, `--to`, a link run folder) is read from the
folder you ran the command from, also under `npm --prefix requirements-board run ...` (npm passes that
folder as `INIT_CWD`; a root script that calls `npm --prefix` passes the repo root), and the paths a
script prints read from there too. Run directly (`node scripts/<name>.ts`), a script reads paths from where
it was started.

**Environment:** `REQUIREMENTS_DIR` (the catalogue folder; default `requirements/`), `HISTORY_DIR` (the
change journal), `REPO_ROOT` (where a `/`-rooted artifact path starts) and `PDF_FACTS_DIR` (the PDF facts
cache) name folders; a relative value is relative to this board folder, wherever the command runs.
`BOARD_PORT` is the dev server's port (default 5180). A git-ignored `.lane.env` (`KEY=value` lines) at the
repository's top fills in any of these that are not set, so a second worktree's board, capture,
`artifact:steps` and Playwright boards use that worktree's ports.

**Design:** `DESIGN.md` is the north star for anything visual (names over IDs, type colours, status
pills, card and sheet anatomy). Read it before changing the UI.

## Stack

Vite 8, React 18, TypeScript (strict), Zustand, React Router (hash), `@xyflow/react` for the
canvas, `yaml` for frontmatter, `react-markdown` (+ `remark-gfm` for documents), `mermaid` and
`pdfjs-dist` (both loaded only when an artifact needs them), lucide icons, Hanken Grotesk + JetBrains Mono
via `@fontsource` (offline). Scripts run on Node's built-in TypeScript support (Node 22.18+).

## Layout

```
shared/        code shared by server, scripts and browser
  types.ts       record shapes and vocabularies
  config.ts      the project's vocabulary (board.config.json): parse, defaults, lookups
  files.ts       parse / serialise one catalogue file (deterministic, round-trips byte for byte)
  inPlace.ts     a save edits the file in place: only the changed fields' lines change (`editItemText` ...)
  patch.ts       field patches: what a record write may change, how it lays over the file, which fields clash;
                 the client's half too (`changedFields`, `patchBetween`, `overlay`)
  settingsMerge.ts  Settings' Keep mine: a section merged row by row (a status by code, a component by name)
  check.ts       integrity rules
  ids.ts         next-ID assignment, sibling order
  move.ts        Mapped board moves (pure): planMove / applyMove / invertChanges, lane-name rules
  history.ts     card and artifact history (pure): field and line diffs, the journal + git timeline merge
  steps.ts       stepped diagrams (pure): what is hidden and highlighted at a step, groups, changed balances, step changes
  textCompare.ts the one LCS and the one spacing rule that history and the Diff review share
  diff.ts        the Diff review's API types (commits, a comparison, the count)
  diffModel.ts   the Diff review's model (pure, server and page): entries, minor changes, the count, filters, page order
  proseDiff.ts   the Diff review's text comparison (pure): Markdown blocks, paired rows, changed words, sentence folds
  artifacts.ts   reading artifacts without a DOM: anchors, SVG text, mermaid node IDs, image sizes, Markdown headings,
                 heading and quote text as the page reads it (`inlinePlain`, `looseChars`)
  markdownCode.ts what counts as code in Markdown (fences, backtick spans): the one rule for links, delete and headings
  links.ts       links in Markdown bodies: explicit links and bare IDs (`mentions`, per field `mentionsOf`)
  sources.ts     sources to artifact spots: the one spot rule (`spotExists`), `resolveSource`, `resolveNoteCite`
  highlight.ts   the red box, shared by the capture runner and the artifact viewers
  csv.ts         CSV export in the old generator's shape
  delivery.ts    the `catalogue:changed` delivery: one re-sync's or one write's changes in one message
server/
  catalogueFs.ts     load the folder, atomic / exclusive / in-place writes, ID claiming, layout file; REQUIREMENTS_DIR (env override for fixtures)
  boardPaths.ts      the board folder, and the folder-naming environment values (relative to the board folder)
  laneEnv.ts         a worktree's `.lane.env` and `BOARD_PORT`, for the dev server, capture, artifact:steps and Playwright
  junk.ts            the one junk rule (dotfiles, `__pycache__`) the skill install and the kit export share
  skillInstall.ts    the skill install: copy or link mode, the mode in use, stale entries removed, others left alone
  catalogueApi.ts    the /api routes as a plain function (no Vite), so tests drive it directly; its header holds the write protocol
  historyJournal.ts  the per-card change journal (.history/, gitignored); screenshot hashes in the repository's width,
                     which are also the screenshots' versions (D-10)
  gitCore.ts         how every reader calls git: no locks (GIT_OPTIONAL_LOCKS=0), literal paths, NUL output, either hash width, bounded caches
  gitHistory.ts      a card's, sidecar's, artifact file's and screenshot's history (one first-parent walk), read-only and asynchronous
  gitRenames.ts      a file's earlier paths, each bounded by the commit that moved it (committed, staged, and plain `mv` moves)
  catalogueDiff.ts   the Diff review's git reading: commits that changed records, two states compared, cached
  cataloguePlugin.ts Vite dev-server plugin: wires the API, serves assets and artifact files (and guards the origin), folder watcher → HMR deliveries
  watchBatch.ts      the watcher's batching: one re-sync per burst, with the paths that changed
  realPaths.ts       real-path rules: containment across linked folders, symbolic links that lead out
  artifactFiles.ts   an artifact's file: where it is, what it holds (cached per version), for the check and the board
  pdfFacts.ts        PDFs' page sizes and text, in a child process (pdf.js is async; the catalogue loads sync); many per run
  sourceIndex.ts     the source index from a catalogue's sidecars alone (`loadSourceIndex`), for scripts and agent tools
  pdfFactsStore.ts   PDF facts kept between runs in .pdf-facts/ (gitignored; PDF_FACTS_DIR overrides), keyed by content and extractor;
                     never pruned (an old version's entry stays): delete the folder any time, it only costs speed
scripts/       check, export-csv, capture (+ captureFiles: generated-file naming, pruning and `--only`, testable;
               captureReport), link-index, apply-links (+ linkProposals: the applier, linkRuns: run folders, testable),
               new-artifact, shoot-steps, resolve-source, recode-statuses, install-skills, export-kit;
               userPath: a typed path read from the folder the command was run from
src/
  store.ts       catalogue mirror (deliveries in order, never under a snapshot), card-move queue, derived index, view prefs
  artifactIndex.ts  which cards point at each artifact, its spots, the Artifacts view's prefs
  nav.ts         URL-driven sheets (?item, ?question, one-shot ?edit=<id>), the docked panel's leave guard,
                 `hasUnsavedWork` (the reload prompt)
  drafts.ts      unsaved sheet edits, kept in the tab so leaving a sheet never loses them
  useDismiss.ts  Esc / outside-press close for popovers
  useCatalogueRefresh.ts  re-run on a delivery that changes records, or window focus; usePersistentState.ts a per-browser pick
  dates.ts       dates and times, in New Zealand English
  storage.ts     the one rule for JSON kept in browser storage: wrong shapes read as defaults, never a crash
  clientProblems.ts  problems found in the browser (a part of the page that failed, an uncaught error, a reset preference) for the problem pill
  diff/          the Diff review, loaded with its route: DiffView (the page), useDiffData (loading), viewedStore,
                 useProgressiveDraw, useDiffKeys + scroll, DiffBar, DiffCard (typed field definitions),
                 DiffFields, DiffProse, DiffFile, diffMarks (remark plugin), diff.css, useUncommittedCount
  views/         BoardView, ArtifactsView (grid or list; a click opens ArtifactPage), ArtifactPage, QuestionsView, OutlineView
  artifacts/     the viewers: CanvasViewer (SVG, image, mermaid: viewBox pan and zoom, minimap, red box),
                 MarkdownReader, PdfReader, sanitise, camera (pure), regionsDom, stepsDom, stepMoves, StepBar, ArtifactPanel,
                 ArtifactHistory, VisualCompare, Thumb; content (loading, and `useLoaded`, which gives back
                 what a view no longer shows), pdfDocs (PDF documents shared on one pdf.js worker and
                 destroyed once unused), objectUrls (drawn mermaid images' URLs, revoked once unused),
                 pictureFailure (why a version is not shown)
  board/         autoLayout (Freeform, pure), mappedLayout (Mapped + drop hit-test, `dragLayout`, pure), graph (nodes + edges
                 from the catalogue, pure), walk (arrow keys, pure), camera (centring, pure), cardData, CardNode,
                 LaneNode (lane rule, add slot, drop bar), LaneHeaders
  components/    ItemModal, QuestionModal, Screenshots (gallery, lightbox, image editor), Sheet, ProblemPill,
                 RegionBoundary (the error boundary round each view and sheet, with its recovery panel),
                 useEditableRecord (edit/conflict/draft logic) + EditChrome (its banners, footer, orphaned draft), bits
tests/         Vitest, on a synthetic fixture catalogue (plus a few that the project's catalogue, if any, is valid)
requirements/  the project's requirements catalogue and board.config.json (see its README.md and SCHEMA.md)
agent/         the agent skills and workflows that maintain it (installed into the host repo's .claude/)
shots/         local-only Playwright scratch scripts (gitignored; some mutate the real catalogue)
```

## How it works

- `GET /api/catalogue` returns every record with a `rev` (content hash). A save sends the fields it
  changed (`patch`) with the `baseRev` it edited, and may send each field's starting value (`base`).
  The server re-reads the file and lays the patch over it as it is now, so a field the save did not
  touch keeps whatever an agent or a drag wrote there meanwhile. If the file changed since `baseRev`,
  a save with `base` still goes through when none of its own fields changed on disk; otherwise it is a
  409 with the current copy and the fields that clash (`collisions`), and the sheet offers keep mine /
  load theirs. A write of several records names every record that blocked it (`blocked`). A save
  that changes nothing writes nothing. The protocol is at the top of `server/catalogueApi.ts`; a
  whole record (`{ record }`) is refused (400). Settings sections each carry a revision
  (`config.revs`) and a write sends the ones it edited from (`bases`, required), so a section an
  agent changed meanwhile is a 409, never an overwrite.
- The sheets (item, question, artifact details) send only the fields the user changed, with their
  starting values (`useEditableRecord`; nothing at all when nothing changed, Cmd S included). A change
  on disk while a sheet has unsaved edits is taken into the draft quietly when it touches only fields
  the user has not changed (an agent's `artifacts:`, the user's own drag of the card); a field changed
  on both sides raises Keep mine (the user's fields over the file as it is now) or Load theirs. What is
  typed while a save is in flight stays an unsaved change. A sheet opened before its record exists (a
  file that does not parse yet) picks it up when it appears. Settings works the same way per section:
  a section changed on disk while edited shows Load theirs / Keep mine (merged row by row: a status by
  its code, a component by its name; a new status the file has meanwhile given its code takes the next
  free one).
- **One file never stops the load.** A record that can't be read or parsed, an artifact file that
  can't be read (or whose contents can't be made sense of), a junk entry in `board-layout.json`, a
  screenshot folder that can't be fully read: each becomes an issue naming the file, and the rest
  loads (the dev server starts, every sync and `npm run check` finish). If the check itself fails on
  unexpected data, one error says so. Names starting with `.` in the record folders (`._EP-01.md`
  from macOS, `.#US-01.1.1.md` from Emacs) are ignored and claim no ID. A byte-order mark at the
  start of a record or of the JSON files is read past, and kept when the board rewrites the file.
  Layout positions that are not `{ x, y }` numbers are ignored and named (an error on `layout`);
  the next card move writes the file without them. A parent cycle (a card under itself) is named
  by the check on each card in it, and the board still shows every card in it: in the Outline's last
  group "Not under an epic" (with cards whose parent is missing), and below the Freeform map.
- **A crash stays in its part of the page.** Each view and each sheet sits in an error boundary
  (`RegionBoundary`): if one fails to draw, a panel takes its place (what failed, Close card, Try
  again, Go to board, Details to copy), the masthead keeps working, and the problem pill lists it
  under "This page" until it recovers; it tries once more by itself when the catalogue changes.
  Uncaught errors from clicks and promises are listed there too, and a saved browser preference
  that could not be read (and was reset) under "Saved preferences". Unsaved drafts survive.
- Every write normalises the record, refuses one that would not survive a round trip, and runs
  `checkCatalogue` on exactly what will be written (422 if it adds an error). A save edits the file
  in place (`shared/inPlace.ts`): only the lines of the fields it changes are rewritten, and every
  other key, its quoting and style, comments, keys the board does not know, values it cannot read and
  body sections it did not touch stay byte for byte (an artifact's `## Source` is never touched). A
  change that cannot be written without losing something is refused (422), never written. New records
  are written whole in a fixed key order. Files are written via temp file + rename. Creates claim the
  next ID with an exclusive link (on a filesystem without hard links, exFAT or some network mounts, an
  exclusive create then a rename), moving on if another writer took it; new IDs come from the file
  names on disk, so a new item never overwrites a file, even one that fails to parse. A write that
  changes several files (a move, a delete, a lane rename) puts back the files it already wrote if one
  fails, and runs the check and sends the issues once, whatever its size.
- Writes must be `application/json` from the board's own origin, so another web page cannot write
  to the catalogue while the board is running.
- The server watches the requirements folder (debounced, at most 600ms behind) and pushes what
  changed over Vite's HMR socket, so agent edits appear live. A burst of file changes costs one
  re-sync that re-reads only the files that changed (a note, a change log or another file the board
  does not hold costs nothing; a folder added or removed, a watcher error or more than 500 paths at
  once reads the whole folder), and reaches each tab as one `catalogue:changed` delivery
  (`shared/delivery.ts`): its records, layout, config, issues and screenshot versions together,
  numbered, so a tab applies them in order and a snapshot taken earlier never takes it back. A write
  of several records is one delivery too. One delivery is one store update and one board rebuild, and
  only the cards it changed re-render.
- Every screenshot has a version, its git blob hash (`assets` in the snapshot and the store, and in
  a delivery when one is rewritten, added or removed; null for one gone). An image URL carries it as
  `?v=` (`assetUrl(src, version)`), so a re-captured screenshot is fetched afresh (an open card's
  gallery and lightbox show it at once, an unchanged one keeps its cached picture); any version is
  served the current file.
- Card moves not saved yet (waiting, failed or being sent) are kept in the tab's session storage, so a
  reload, including Vite's after the server restarts, shows them and sends them; leaving or reloading
  while any are unsaved asks first. While the server is away the board asks it every 2 s; when it
  answers, kept moves are saved and the problem pill offers a Reload. A Mapped move still saving at a
  reload is checked against the cards afterwards (never sent again) and reported only if it did not
  land. Freeform saves go one at a time, so they reach the file in order; a removed card leaves no
  position in a save, in undo or in the layout file (the server keeps no position for a card with no
  file).
- On the board, `?item=ID` docks the item sheet as a left-hand panel beside the map (one click on
  a card opens it); elsewhere it is a modal. The board switches cards through the panel's
  unsaved-edit guard (`guarded` in `src/nav.ts`); while a modal sheet covers the panel, a way out goes
  ahead at once and the panel's draft is kept.
- Unsaved edits in a sheet survive leaving it (browser Back, a link) and are restored on return
  (`src/drafts.ts`); closing it from the app asks first, and reloading the tab warns (`hasUnsavedWork`
  in `src/nav.ts`, with unsaved card moves). A record that vanishes with unsaved edits shows every
  changed field, asks before any way out, and gets its edits back if it returns; the artifact page
  does the same for its details and leaves full screen. Creating or deleting a card from the board
  clears any draft left under its ID.
- The board has two modes, switched top right (per browser, each with its own viewport):
  - **Freeform** (the original view): the arrangement is computed (`autoLayout`): epics as column
    heads wrapping into bands, features beneath, stories stacked. Only cards you drag are stored,
    in `board-layout.json`, sent as patches, one save at a time; "Tidy" removes those overrides. Moves
    that fail to save are kept in the tab and sent again with the next move, when the layout file
    changes on disk, after a reload, and when the server answers again. It ignores `swimlane`.
  - **Mapped**: a user story map in one strip (`mappedLayout`): epics, features, then swim lanes
    across the whole map. Dragging an epic or feature carries everything under it and the others
    bump aside live; a story can be dragged within a column, into another feature and into another
    lane. A drop rewrites catalogue fields, never positions: `planMove` works out the `parent`,
    `order` and `swimlane` changes, and `POST /api/items/batch` writes them all or none (each
    record checked against its `baseRev`, the integrity rules run once over the result). The store
    applies the move at once and rolls it back if the server refuses. The lane list is
    `lanes` in `board-layout.json`; a story names its lane in its own `swimlane` field, so renaming
    or removing a lane rewrites its stories and the lane list in one request (`POST /api/lanes`, all or
    nothing, refused if a story or the list changed on disk since: `layout.lanesRev`); the first lane
    (stories with no `swimlane`) is renamed through `firstLane` instead, so no story changes. A lane
    name is at most 40 characters, has no spaces around it and repeats no other (case aside, the first
    lane's included); the check reports a list on disk that breaks a rule, and a lane change is
    refused only if it adds a problem, so a card move never is. A rename onto another lane's name
    (case aside, the first lane's included) merges into that lane in the same one write, after the
    board asks: the stories take its exact name (or none) and the old name leaves the list; a "not a
    lane" band that differs from a lane only in case offers this as **Move into**. Every lane-list
    write sends `lanesRev` (adding and reordering lanes too). Collapsed lanes are a per-browser
    preference (`collapsedLanes` in the view settings); a rename, merge or delete made on the board
    carries them along. A drop is hit-tested against `dragLayout` (the map without the dragged card,
    lanes held at their size: `dragHold`), with the lane under the pointer read from the preview as
    drawn; the slot counts the card's own kind, live or retired. Cards no epic reaches get a column of
    their own, each followed by what hangs under it (stories in their own lanes). The arrow-key walk is `src/board/walk.ts`, the centring rules
    `src/board/camera.ts`.
- **Delete** (item sheet footer) removes a card for good, after asking: everything under it goes
  too, and `shared/remove.ts` (`planDelete`) works out the rest, shown in the question and applied
  by `DELETE /api/items/:id`: other cards drop it from `related`, outstanding items from `affects`,
  and `[text](ID)` links to it become plain text; its layout position and `assets/<ID>/` go, and its
  journal is set aside under `.history/deleted/` so a new card given the ID starts clean. The request
  carries the IDs the user was shown and is refused if what sits under the card has changed since.
  Retire is still the way to keep a record. Deleting a file by hand works too (the watcher drops the
  card), but leaves any references to it for `npm run check` to report. A deleted card's ID is
  reissued to the next card created under the same parent when it was the highest; that card's
  History starts with it (a restored card, read as it was, keeps its history). Plain-text mentions of
  a deleted ID in other records stay as written, as history, and name whichever card later takes the
  ID; while none does, the check warns about them.
- Every card has a **History** (sheet footer): a newest-first timeline of its changes. The dev
  server journals every change it sees to a card, its own saves and moves and anyone's edit on
  disk, to `.history/<ID>.jsonl` in this folder (gitignored, per machine; `HISTORY_DIR`
  overrides, relative to this folder; a catalogue other than the real one journals to a temp folder). At start it logs what
  changed while it was off, and a `seen` line for a card it has never seen before (never shown: the
  journal's detail starts there, so a change committed while the board was off shows once, and a card
  first seen uncommitted has a "Created" entry; a journal from before `seen` reads as it did). Commits
  older than a card's first sight (or first journal entry) fill in its past from
  git along HEAD's **first parents**, each commit against its first parent: a lane merged with
  `--no-ff` shows as the merge, never as its lane commits interleaved with master's. The file is
  followed through its renames (committed, staged, or a plain `mv` of an unchanged file not yet
  staged), each earlier path counting only up to the commit that moved it, so a moved folder keeps
  its history and a file later added at an old path never inherits it; a commit that only moved the
  file is left out. A committed deletion stays listed (`deleted: true`), so a consumer can cut a
  reused ID's history there. Any file name works, whatever `core.quotePath`, in SHA-1 and SHA-256
  repositories, and reading never takes git's index lock. Newer commits show as dividers. Changes
  newer than the last commit are marked not committed yet. View only.
  Screenshots count too: a file under `assets/<ID>/` rewritten in place (a `npm run capture` run)
  logs a "Screenshot updated" entry with a before and after; an open History re-reads when the
  card's own screenshot versions change (the store's `assets`), never for another card's. The journal keeps each image's git
  blob hash in the repository's width (`<ID>.shots.json`, rehashed only when size or mtime changes,
  or when a kept hash is in the other width), so the before image is read back out of git
  (`/history-blob/<sha>`); a version that was never committed is not kept. Git backfill follows each
  of the card's screenshot files through its own renames, never another card's file that shared a
  folder with one.
- Card moves undo and redo (⌘Z / ⇧⌘Z, Ctrl+Y, or the toolbar arrows): Freeform drags and Tidy,
  and Mapped drops. History is per tab, in memory, and never covers lane edits or sheet edits. A
  Mapped undo sends back the old `parent` / `order` / `swimlane` of every record the move rewrote,
  as one batch; it is refused (and that history dropped) if any of those fields changed since, so
  it never overwrites an agent's or another tab's edit. Fields and the item panel keep their own
  text undo.
- Trackpad two-finger scroll pans and pinch zooms; a mouse wheel zooms. `src/board/trackpad.ts` tells
  them apart and pans before React Flow's wheel handler (which would zoom) sees the event.
- Semantic zoom bands: overview (epic names, stories as status blocks), far (titles only), mid, near
  (description excerpt).

- **Artifacts** (the Artifacts tab): diagrams, transcripts, notes and documents. The board edits
  only their details (`PUT /api/artifacts/:id` takes the title, kind, status, superseded_by, date,
  author, components, sources and description, and keeps the file, regions, steps and source as on disk). Each
  has a sidecar `requirements/artifacts/AR-nn.md` (format under Artifact file in `requirements/SCHEMA.md`),
  and its file in `requirements/artifacts/files/`;
  items point at one, or at a spot in one, through their `artifacts` field or a text link, and both
  sides show the link. Drawings render inline (sanitised, in a shadow root), so their text selects
  and anchors find their elements; the camera sets the SVG's `viewBox`, so it stays sharp at any
  zoom. A plain drag never pans a drawing (it selects text): Space or the middle button drags, a
  trackpad scroll pans, a pinch or the wheel zooms. Documents scroll as pages (Markdown through the
  same renderer as the sheets, PDFs through pdf.js with its text layer). The server serves a file
  only through its sidecar (`/artifact-file/<ID>`), and screenshots only from `assets/`
  (`/requirements/assets/...`, image files only); every SVG it sends carries a no-script CSP and no file is sniffed as
  another type (`nosniff`). A file it cannot serve is a 404 (never the app's page), and a malformed
  `%` escape is a 400. Vite's own file serving never reads a catalogue folder under any path
  spelling (a `server.fs.deny` rule added by the plugin, plus a 404 from the plugin itself for any
  path the file system opens inside one); CORS is off, and a read another site's page asks for
  (fetch metadata) is refused on every route, so no other page can read or embed what the board
  serves. A file reached through a symbolic link that leads out of its
  folder is still served, with a warning in the server log and in the check. The sanitiser keeps
  only links and references to the drawing's own elements (`#id`, `url(#id)`) and pictures as data,
  in any namespace; a link in a drawing never moves the board (one to `#id` brings that spot into
  view), and only the board's own record links open anything. The check reads
  every file (PDFs in a child process) to hold every region's anchors to account. History comes
  from git: the sidecar's commits as field changes, the file's as before and after (side by side,
  swipe, or a source diff); a side that cannot be shown says why (no version, not kept by git, could
  not be drawn, could not be read). The viewers release what they open: every PDF document runs on
  one shared pdf.js worker and is destroyed once no view needs it (the last three stay open for a
  quick return), and a drawn mermaid image's object URL is revoked when it leaves the screen. Every artifact with text has a find box (`src/artifacts/find.ts`):
  matches across element and line breaks, counted over a whole PDF from pdf.js's page text.
  An SVG drawing's sidecar can also list `steps`, which makes it a stepped diagram: a slim step bar
  on the canvas and a Steps tab play them in order, each step revealing more of the drawing (reveal
  is cumulative; nothing is hidden again), highlighting what it is about, flying its `moves` (what
  travels, from where it was to where it lands) on stepping forward, and showing a caption and a
  balances table in the Steps tab. A step is a spot like a region (`AR-nn#step-id`, `?region=step-id`); thumbnails,
  the minimap, visual compare and the Diff review show the finished picture, everything visible.

- **Diff review** (its tab): the catalogue between two git states (`server/catalogueDiff.ts`,
  read-only git in child processes; statuses read as today's codes; a folder that moved, and each
  record folder (even one renamed in the move), is read at the path it had at each side, so a move
  alone is no change). Outside git every route reports
  `available: false`.
  - `GET /api/diff/commits`: the commits that changed records (cards, outstanding items, artifact
    sidecars, and an artifact's file wherever its sidecar points), newest first along HEAD's first
    parents, merges included; each with its first `parent`, and the resolved `head`. Each commit's
    `records` is counted by comparing it with its parent (kept per commit, counted in the background
    once the board asks for the tab's count), so a commit that changed no record as the page reads
    it (a status renumbering) is left out.
  - `GET /api/diff?from=&to=` (`to=worktree` for the files on disk; refs are `HEAD` or a hash, else
    400): every record that differs with both versions parsed, artifact file and screenshot blob
    hashes, the unchanged epics and features they sit under, and the artifacts that read differently
    at each side than today (slimmed, `context.artifacts`), so citations are named as they stood. A
    side that does not parse comes back as its parser's message and raw text (`beforeError`,
    `beforeText`), never as added or removed; an artifact's file is still compared (`fileNameBefore`).
  - `GET /api/diff/auto`: the page's default in one request: HEAD against the files on disk, or with
    nothing uncommitted what the last record commit changed (`jumped: true`).
  - `GET /api/diff/count?from=&to=`: the tab's count (records changed, minor ones left out), a few bytes.
  - Results are cached (keyed by HEAD, the refs, and a generation the folder watcher and every API
    write bump), and identical requests in flight share one read.
  - `/history-blob/<sha>?artifact=<ID>&file=<path>` serves an artifact file's earlier version as the
    type of `file`, and `?src=assets/<ID>/<name>` a screenshot's (each honoured only when the blob
    was at that path, or an earlier path of the file, in some commit, or is the file on disk now),
    as a checkout would write it (the path's filters and line endings; an LFS version as its pointer). A file on disk is named as
    `git add` would store it (line endings, clean filters, the repository's width), so an unchanged
    file never reads as changed.

  The page pairs Markdown fields paragraph by paragraph and marks changed words
  (`shared/proseDiff.ts`, over `shared/textCompare.ts`'s one comparison: common start and end matched
  at any length, the rest by a table up to a budget and past it cut at lines or words found once each
  side, so long transcripts and paragraphs still mark only what changed); entries, minor changes
  (block structure, not squashed text), filters and order are `shared/diffModel.ts`, so the
  server's count and the page agree. It loads the commit list and the comparison side by side, draws
  the first cards whole and the rest a few at a time (nearest the view first; off-screen cards skip
  layout through `content-visibility`), keeps unchanged cards memoised across refreshes, and keeps
  the last comparison for a return to the tab.

Screenshots: put files under `requirements/assets/<ID>/` and list them in the item's `images`, each
with a `viewport` and optionally an `app`, one of the keys in `screenshotApps`. The item sheet's
gallery has one tab per app present, in that order; untagged images fall back to Desktop / Mobile.
A screenshot whose file name holds a backslash cannot be served (the board reads `\` as `/`, as the
file system on Windows would), so name screenshots without one.

### Project config

`requirements/board.config.json` holds what differs between projects. Every field is optional:

- `project`: `name` (beside the board's name, "Requirements board", and in the tab title) and
  `accent` (optional `#rrggbb`: fills the board's mark and the tab icon, so boards for different projects tell apart; set on the Settings page). Dates and times are always New Zealand English;
- `components`: `[{ "name", "code" }]`, the areas items belong to, in order; `code` is the card
  glyph (unset: the name's first three letters). Listed, the check holds items to them; empty, any
  name goes and the filters offer the ones in use;
- `screenshotApps`: `[{ "key", "label", "viewport" }]`, the apps screenshots come from. Keys are in
  file names and item frontmatter, so keep them stable;
- `statuses` and `questionStatuses`: ordered lists of `{ code, label, help, tone, role?, settle? }`
  (format in `SCHEMA.md`); files store only the number;
- `removedStatuses`: `{ "statuses": [{ "code", "label" }], "questionStatuses": [...] }`, the
  statuses taken off each list, written by Settings when one is removed: their codes are never
  handed out again, and old versions storing one read as its last label, marked removed;
- `questionKinds`: `{ "<kind>": { "label", "help" } }`, the wording beside each question kind;
- `capture`: see Capturing screenshots;
- `voice`: `{ "descriptionWarnings": [{ "pattern", "flags", "message" }] }`, project patterns
  (JavaScript regular expressions, `flags` default `i`) that make the check warn when one is found
  in a live item's description, e.g. a decision number or "our reading" that belongs in Notes.
  Edited by hand (format in `SCHEMA.md`).

The board's own name ("Requirements board") is fixed: there is no `board` key. An older file's
`board` key, and `project.locale`, are dropped the next time Settings saves the project section.

The server reads it with the catalogue and reloads it live; a malformed entry is reported by the
check and left at its default, except in the status lists, which are never swapped for the built-in
ones: a bad tone falls back for that status alone, and a structural problem (a bad or doubled code,
a role or settle rule broken, a file that does not parse) marks the list damaged, the board reads
only its readable part, and status saves are refused until the file is fixed. Each list's state
(`healthy`, `degraded`, `damaged`) reaches the client in the config as `statusState`, and
`project` and `components` each read as `healthy` or `damaged` (any problem) in `sectionState`. The
Settings page edits `project`, `components` and the two status lists, and leaves every other field as
written. A damaged section is shown locked (its problems, no editing, no Save) until the file is fixed,
and the server refuses a save of it; a degraded status list can be saved, which repairs it. Once the
component list names one component it must name every component a card or artifact uses: Settings
lists the missing ones with an "Add them" button, and the server refuses a save that would leave a new
one unlisted.

### Capturing screenshots

`npm run capture` takes screenshots of the project's own app from recipes and links them to the
catalogue. It is optional: a project with no `capture` section in `board.config.json` skips it.

- **Set up** in `board.config.json`: each screenshot app (`screenshotApps`: key, label, viewport) and,
  under `capture.apps`, its dev server's `url`, the `setupRoute` a shot with setup steps loads first,
  `hideCss` that hides demo-only chrome from every shot, and optionally `portEnv`, an environment
  variable that replaces the url's port when set (a second worktree on its own ports). Also `capture.locale`, `timezone`,
  `startHint` (what to tell the user when a server is down) and where `recipes` and the `report` live,
  relative to `requirements/`.
- **Recipes:** one JSON file per item (`<recipes>/<ID>.json`). Each lists shots, each with an app, a
  start route, optional setup steps, and one or more states (steps plus the selectors to box in red).
  Built-in steps are plain browser actions: `click`, `dblclick`, `fill`, `press`, `hover`, `select`,
  `wait`, `scroll`, `goto`.
- **Project steps:** anything app-specific (jumping to a demo scenario, running a demo action) goes in
  the module `capture.steps` names, beside the recipes. Its default export maps a step key to a
  handler, `{ run(page, step, ctx), check?(step) }`; `ctx` gives the app's settings, `setHidden`,
  `mustFind`, `settle` and the timeout (`StepContext` in `scripts/capture.ts`).
- The runner stops if an app's dev server is down. `node scripts/capture.ts --only US-03.2.4,EP-03`
  (or `--only=US-03.2.4,EP-03`) limits the run (an epic or feature ID takes its descendants); `--only`
  with no IDs (missing, empty, another flag, only commas) stops before anything is shot or written, so
  a full run happens only when `--only` is left out. `--dry` runs every step and selector without
  writing anything.
- **Output:** `requirements/assets/<ID>/<app>-<name>[-<state>].png`, linked into the item's `images`
  (hand-added images are kept). A generated file the item's recipe no longer makes is deleted, unless
  another item's `images` still lists it: then it is kept and the run names it with the items that use
  it, so no item is left pointing at a missing image. And the report: a full run writes
  it whole; a run limited with `--only` updates those IDs' rows and the totals, carrying over failures
  recorded for other IDs (`scripts/captureReport.ts`).
  A file counts as generated when its name starts with a screenshot app's key and a dash
  (`scripts/captureFiles.ts`), so give hand-added screenshots another prefix (`hand-dashboard.png`,
  not `web-dashboard.png`).

### Adding artifacts

`npm run artifact:new -- <file> --title "Name" --kind diagram` (or `--mermaid <file.mmd>`) takes the
next `AR-nn`, brings the file into `requirements/artifacts/files/` (a drawing copied in as
`AR-nn.<ext>`, a transcript or document moved in under its own name, never staged; `--keep`
leaves it where it is). The ID is claimed before the file is touched, so two sessions at once get two
IDs; nothing is copied or moved over an existing file (a stray `AR-nn.<ext>` already there makes it take
the next ID). Then it writes the sidecar for you to fill in: regions, sources, description, and
for a stepped diagram its steps. Then link items to it (`artifacts: [AR-nn#spot]`) and run
`npm run check`. The file and `--mermaid` paths are read from the folder the command was run from.
With the board running, `npm run artifact:steps -- AR-nn` screenshots a stepped
diagram, the whole drawing and then each step (`00-whole.png`, `01-<step-id>.png` ...), into a temp
folder it prints (or `--out <dir>`), to check every step by eye. It shoots this worktree's board
(`http://localhost:$BOARD_PORT`, after `.lane.env`, else 5180); `--url` names another. The `add-artifact` skill walks an
agent through it; the `svg-diagram` skill saves new diagrams this way and says how to draw a stepped one.

### Sources open their spot

Each `sources:` string opens the artifact spot it cites, resolved live (`shared/sources.ts`; SCHEMA's
Sources section): a note by its file name and numbered points (`Notes 2026-10-01 · ... #16`), anything
else by the `cited_as` prefixes in its sidecar (`artifact:new --cited-as "Spec" --page-offset 1`). Item
files never change for it. `npm run check` warns on a source that looks like a citation but resolves to
nothing. `npm run source -- --item US-04.2.3 --text` prints each source's file, page or lines and the
cited passage, for an agent that needs the reasoning behind a requirement without reading a whole
transcript; `-- --report` covers the whole catalogue.

### One rule, one implementation (agent tools too)

Each catalogue text rule has one home in `shared/`, used by the check, the server, the viewer and the
scripts alike: what is code (`markdownCode.ts`), links (`links.ts`), heading text, slugs and quote
text (`artifacts.ts`; the document reader gives each heading the slug of the source heading on its
line), spots and sources (`sources.ts`). An agent tool (`agent/**/*.mjs`) uses the same rules by
importing them directly, found from the catalogue path it already takes (the board sits one folder
above it); Node 22.18 or later runs `.ts` with no build step:

```js
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
// req: the catalogue folder the tool takes (requirements-board/requirements here)
const load = (path) => import(pathToFileURL(join(req, '..', path)).href)
const { resolveNoteCite } = await load('shared/sources.ts')
const { loadSourceIndex } = await load('server/sourceIndex.ts')
resolveNoteCite(loadSourceIndex(req), 'Notes 2026-10-01 · Client meeting with Sam #16') // { id, file } or null
```

So `shared/` stays erasable TypeScript (no enums, namespaces or parameter properties), with `.ts`
import extensions and `import type` for types. Code that runs in the workflow runtime or in a
generated browser page cannot import: it resolves in Node first and carries the results.
`agent/shared-rules.test.mjs` proves the import and that agents resolve note cites as the board does.

### Linking requirements

Text links (`[words](US-06.1.1)`), bare IDs and the `related` field are described under Links in
`requirements/SCHEMA.md`; `shared/links.ts` is the one parser the check, the board and the scripts share.
To link the whole catalogue with agents:

1. `npm run links:index` writes `.links/index.md` (gitignored): one line per live item, which every
   agent reads to find targets; and `.links/batches.json`, the epics grouped into batches. It also
   starts a link run in `.links/current/` (the previous run moves to `.links/runs/<its start>/`).
2. Run the workflow **link-requirements** (`agent/workflows/link-requirements.js`) with `batches`:
   the contents of `batches.json`, a list of epic IDs (`["EP-04", "EP-06"]`, one batch each), or
   `[["EP-06"]]` to try one epic first (and `board` when this folder is not `requirements-board`). One
   Sonnet agent per batch proposes links, and a second rejects weak ones. They write
   `<batch>.proposed.json` and `<batch>.verified.json` into the run folder and edit nothing.
3. `npm run links:apply -- --dry-run` checks every accepted proposal of that run (and only that run)
   again against the files and writes `links-report.md` in the run folder, naming the run; without
   `--dry-run` it writes the files through the board's serialiser, refusing if that would add a check
   error. Re-running skips what is already applied. `links:apply -- <dir>` applies another run folder.
   Proposal files left loose in `.links/` by older versions are never applied by default; the output
   lists them for deleting.
   Positions count in each field as the agents read it: a run's links never shift one another, and
   an anchor overlapping an earlier link of the run is skipped.
4. `npm run check`, then review the diff.

### Consistency review

The `consistency-review` skill (`agent/skills/consistency-review/SKILL.md`) checks the whole catalogue
for drift against what was most recently decided. The `consistency-rulings` workflow builds a
newest-wins rulings list from the notes, change logs and answered questions; the user settles its
conflicts; the `consistency-changes` workflow proposes exact edits. The skill's `scripts/` turn the
result into a local review page where the user accepts or rejects each change, then apply the
accepted edits. Its run folder lives outside the repo; nothing changes the catalogue before the
user decides. Each decision is tied to a fingerprint of the change it was made on, so a rebuilt page
never applies it to a different change; the apply step writes only inside the catalogue folder (never
notes, change logs, reference files, question answers, retired records or protected artifacts), and
each change whole or not at all.

<!-- kit:omit -->
## Sharing the board (the kit)

`npm run kit:export -- --to "<folder>"` writes a clean copy for other teams, one folder,
`<folder>/requirements-board/`: the board's code and skills, `START-HERE.html`, and the **starter
catalogue** from `starter/requirements/` (cards that explain the board, a question, the loop diagram and
the `notes/` and `changes/` folder guides) in place of this project's. `SCHEMA.md` is this project's,
shared as it is, so keep it project-neutral: statuses by role, never this project's numbers. Each
skill's "This repo" section is swapped for `starter/this-repo/<skill>.md`, and passages marked
`<!-- kit:omit -->` in the Markdown (this section, for one) are left out.

- **Source:** the board's files as committed at HEAD, so a kit is one commit and nothing uncommitted,
  untracked or ignored can ship; it warns about uncommitted board files it left out. Commit the
  version bump first. `--uncommitted` builds from the tracked files as they are on disk instead (never
  an untracked or ignored file), naming every board file that differs from HEAD, to try out work.
- **Checks**, on the staged kit before the target is touched: no line matches `starter/deny.txt` (this
  project's words and people, status numbers pinned as "N here"), and every `npm run <script>` and board
  path the kit's docs name exists in the kit. `--dry-run` stages and checks only.
- **Target:** `--to` is read from the folder the command was run from. The export refuses, changing
  nothing, when `<folder>/requirements-board/` is this board, inside it or contains it (by real path),
  when the folder has other files and no `requirements-board/`, or when its `requirements-board/` is not
  an untouched earlier kit: each export writes `.kit-export.json` (version, commit, a hash per file), and
  a re-export replaces the folder only while every file matches it (a catalogue edit, a `.history/`
  from opening its board, a new `package-lock.json` all refuse). Its `node_modules` is kept; nothing
  else in the target is touched. There is no override: export into an empty folder.
- **Upgrading a board already in use:** export to a fresh folder, then copy everything in its
  `requirements-board/` except `requirements/` over the adopting repo's board, and run `install-skills`.

`START-HERE.html` (from `starter/START-HERE.html`, the version, source commit and loop diagram filled
in) is a static page the recipient opens before anything runs: where the folder goes, one prompt that
has Claude Code do the whole setup (install, `install-skills`, the CLAUDE.md section, the skills'
`<TODO: ...>` placeholders, start the board), the same by hand, and troubleshooting. Starter "This
repo" sections mark every fill-in as `<TODO: ...>`. `tests/starter.test.ts` keeps the starter valid and
fails when a skill gains a "This repo" section with no starter version; `tests/exportKit.test.ts` proves
the refusals and the source rule on scratch repositories.

Anything new for the board is built here first, then exported. Before each export, bump `version`
in `package.json` (shown on the About and Settings pages), add a line to `CHANGELOG.md`, and commit.
<!-- /kit:omit -->

## Bring the board to another repo

`ADOPTING.md` is the checklist, written for an agent to follow in the new repo: what to copy, the
data-folder skeleton, writing `board.config.json`, the skills' "This repo" blocks, symlinks, root
scripts and checks.
