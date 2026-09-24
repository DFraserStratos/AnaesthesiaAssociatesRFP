# Requirements Board

A local dev tool for reading, editing and arranging the future-state requirements catalogue
(`docs/discovery-reference/Updated Requirements/catalogue/`). Not part of the prototype and never
deployed: its dev server is its file API.

**No requirements live in this folder.** They are the Markdown files in the catalogue folder above;
this app and any agent edit those same files.

```
npm install
npm run dev          # http://localhost:5180
npm test             # Vitest: file round-trip, check rules, IDs, the file API, auto-layout
npm run build        # typecheck + bundle (sanity only; the app needs the dev server)
npm run check        # validate the catalogue, exit 1 on errors
npm run export:csv   # regenerate the Miro CSVs (-- --out <dir> to write elsewhere)
```

From the repo root, `npm run dev` starts this and the prototype together.

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
  csv.ts         CSV export in the old generator's shape
server/
  catalogueFs.ts     load the folder, atomic / exclusive writes, layout file
  catalogueApi.ts    the /api routes as a plain function (no Vite), so tests drive it directly
  cataloguePlugin.ts Vite dev-server plugin: wires the API, serves assets, folder watcher → HMR events
scripts/       check, export-csv
src/
  store.ts       catalogue mirror + derived index + view prefs
  views/         BoardView, QuestionsView, OutlineView
  board/         autoLayout (story map, pure), CardNode
  components/    ItemModal, QuestionModal, Sheet, useEditableRecord (shared edit/conflict/draft logic), bits
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
- Unsaved edits in a sheet survive leaving it (browser Back, a link) and are restored on return;
  closing it from the app asks first, and reloading the tab warns.
- The board's default arrangement is computed (`autoLayout`): epics as column heads wrapping into
  bands, features beneath, stories stacked. Only cards you drag are stored, in
  `board-layout.json`, sent as patches; "Tidy" removes those overrides. Moves that fail to save
  are retried on reconnect. The viewport is per-browser (localStorage).
- Semantic zoom bands: overview (epic names, stories as status blocks), far (ID + title), mid, near
  (description excerpt).

Screenshots: put files under `catalogue/assets/<ID>/` and list them in the item's `images`. A
Playwright capture step that fills these from the prototype is the intended next step.
