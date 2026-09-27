# Requirements Board

A local dev tool for reading, editing and arranging the future-state requirements catalogue
(`docs/discovery-reference/Updated Requirements/catalogue/`). Not part of the prototype and never
deployed: its dev server is its file API.

**No requirements live in this folder.** They are the Markdown files in the catalogue folder above;
this app and any agent edit those same files.

```
npm install
npm run dev          # http://localhost:5180
npm test             # Vitest: file round-trip, check rules, IDs, the file API, store (incl. undo), board graph, both layouts, move planner
npm run test:e2e     # Playwright: edges on the real catalogue (5181, read-only); Mapped drags on a fixture (5182)
npm run build        # typecheck + bundle (sanity only; the app needs the dev server)
npm run typecheck    # tsc -b over the app, server, scripts and tests (plain `tsc -p .` checks nothing)
npm run verify       # typecheck + unit tests + catalogue check: run before handing work back
npm run check        # validate the catalogue, exit 1 on errors
npm run export:csv   # regenerate the Miro CSVs (-- --out <dir> to write elsewhere)
```

From the repo root, `npm run dev` starts this, the prototype and the mobile PWA together.

**Design:** `DESIGN.md` is the north star for anything visual (names over IDs, type colours, status
pills, card and sheet anatomy). Read it before changing the UI.

## Stack

Vite 8, React 18, TypeScript (strict), Zustand, React Router (hash), `@xyflow/react` for the
canvas, `yaml` for frontmatter, `react-markdown`, lucide icons, Hanken Grotesk + JetBrains Mono
via `@fontsource` (offline). Scripts run on Node's built-in TypeScript support (Node 22.18+).

## Layout

```
shared/        code shared by server, scripts and browser
  types.ts       record shapes and vocabularies
  files.ts       parse / serialise one catalogue file (deterministic, round-trips byte for byte)
  check.ts       integrity rules
  ids.ts         next-ID assignment, sibling order
  move.ts        Mapped board moves (pure): planMove / applyMove, lane-name rules
  csv.ts         CSV export in the old generator's shape
server/
  catalogueFs.ts     load the folder, atomic / exclusive writes, layout file
  catalogueApi.ts    the /api routes as a plain function (no Vite), so tests drive it directly
  cataloguePlugin.ts Vite dev-server plugin: wires the API, serves assets, folder watcher → HMR events
scripts/       check, export-csv, capture (+ captureFiles: generated-file naming, testable)
src/
  store.ts       catalogue mirror + derived index + view prefs
  nav.ts         URL-driven sheets (?item, ?question, one-shot ?edit=<id>), the docked panel's leave guard
  useDismiss.ts  Esc / outside-press close for popovers
  views/         BoardView, QuestionsView, OutlineView
  board/         autoLayout (Freeform, pure), mappedLayout (Mapped + drop hit-test, pure), graph (nodes + edges
                 from the catalogue, pure), cardData, CardNode, LaneNode (lane rule, add slot, drop bar), LaneHeaders
  components/    ItemModal, QuestionModal, Screenshots (gallery, lightbox, image editor), Sheet,
                 useEditableRecord (edit/conflict/draft logic) + EditChrome (its banners, footer, orphaned draft), bits
tests/         Vitest, on a synthetic fixture catalogue (plus one test that the real catalogue is valid)
shots/         local-only Playwright scratch scripts (gitignored; some mutate the real catalogue)
```

## How it works

- `GET /api/catalogue` returns every record with a `rev` (content hash). Saves must send `baseRev`;
  the server re-reads the file from disk and answers 409 (with the current copy) if it changed,
  and the sheet offers keep mine / load theirs.
- Every write normalises the record, refuses one that would not survive a round trip, and runs
  `checkCatalogue` on exactly what will be written (422 if it adds an error). Files are written via
  temp file + rename in a fixed key order, so a one-field edit is a one-line diff. Creates use an
  exclusive link, and new IDs come from the file names on disk, so a new item never overwrites a
  file, even one that fails to parse.
- Writes must be `application/json` from the board's own origin, so another web page cannot write
  to the catalogue while the board is running.
- The server watches the catalogue folder (debounced, at most 600ms behind) and pushes
  `catalogue:changed` events over Vite's HMR socket, so agent edits appear live.
- On the board, `?item=ID` docks the item sheet as a left-hand panel beside the map (one click on
  a card opens it); elsewhere it is a modal. The board switches cards through the panel's
  unsaved-edit guard (`guarded` in `src/nav.ts`).
- Unsaved edits in a sheet survive leaving it (browser Back, a link) and are restored on return;
  closing it from the app asks first, and reloading the tab warns.
- The board has two modes, switched top right (per browser, each with its own viewport):
  - **Freeform** (the original view): the arrangement is computed (`autoLayout`): epics as column
    heads wrapping into bands, features beneath, stories stacked. Only cards you drag are stored,
    in `board-layout.json`, sent as patches; "Tidy" removes those overrides. Moves that fail to
    save are retried on reconnect. It ignores `swimlane`.
  - **Mapped**: a user story map in one strip (`mappedLayout`): epics, features, then swim lanes
    across the whole map. Dragging an epic or feature carries everything under it and the others
    bump aside live; a story can be dragged within a column, into another feature and into another
    lane. A drop rewrites catalogue fields, never positions: `planMove` works out the `parent`,
    `order` and `swimlane` changes, and `POST /api/items/batch` writes them all or none (each
    record checked against its `baseRev`, the integrity rules run once over the result). The store
    applies the move at once and rolls it back if the server refuses. The lane list is
    `lanes` in `board-layout.json`; a story names its lane in its own `swimlane` field, so renaming
    a lane rewrites its stories in one batch; the first lane (stories with no `swimlane`) is renamed
    through `firstLane` instead, so no story changes. Collapsed lanes are a per-browser preference.
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

Screenshots: put files under `catalogue/assets/<ID>/` and list them in the item's `images`, each
with a `viewport` and optionally an `app` (`admin`, `web`, `mobile`, `simulator`). The item sheet's
gallery has one tab per app present, in that order; untagged images fall back to Desktop / Mobile.

### Capturing prototype screenshots

`npm run capture` takes screenshots of the prototype from recipes and links them to the catalogue:

- Recipes: one JSON file per item in `capture/recipes/<ID>.json` (format and screen atlas in
  `capture/ATLAS.md`). Each recipe lists shots, each with an app, a start route, optional setup,
  and one or more states (steps plus the selectors to box in red).
- Needs the prototype on `localhost:5173` and the mobile PWA dev server on `localhost:5174`; root
  `npm run dev` starts both. The runner stops if either is down. VS Code task: **Screenshot Update**.
- `node scripts/capture.ts --only US-03.2.4,EP-03` limits the run (an epic or feature ID takes its
  descendants); `--dry` checks recipes and selectors without writing anything.
- Output: `catalogue/assets/<ID>/<app>-<name>[-<state>].png`, linked into the item's `images`
  (hand-added images are kept; stale generated files are deleted), and `capture/REPORT.md`.
  A file counts as generated when its name starts with an app and a dash (`scripts/captureFiles.ts`),
  so give hand-added screenshots another prefix (`hand-dashboard.png`, not `web-dashboard.png`).
