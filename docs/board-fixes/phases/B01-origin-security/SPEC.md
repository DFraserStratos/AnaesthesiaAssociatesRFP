# Phase B01: Origin security

**Status:** PLANNED

**Requirements:** R-03, R-04, R-22, R-35, R-36, R-63, R-102, from [FINDINGS.md](../../FINDINGS.md)
("Findings in detail": R-03, R-04 and R-22 under Medium; R-35, R-36, R-63 and R-102 under Low; the
"Security (local origin)" theme; systemic issue 5 for R-22 and R-63). Also the REPO_ROOT symlink
"also" merged into R-47 (PROGRESS.md accepted decision 11: B01 delivers the path rule, B03 reuses it;
R-47 itself stays B03's). Programme outcome 6 in [PLAN.md](../../PLAN.md): "nothing rendered from
catalogue content can run script or reach other hosts from the board's origin; no other page, path
spelling or symlink reaches the file API or raw files".

**Owns:**
- The request guard and the static-file, missing-file and symlink rules in
  `requirements-board/server/cataloguePlugin.ts` (the middleware and the `serveAsset`,
  `serveArtifactFile` and `serveHistoryBlob` routes), excluding its watcher.
- The containment and real-path rule of `artifactPath` in `server/artifactFiles.ts` (path
  resolution only; R-35 names it), including the REPO_ROOT symlink case of R-47 (accepted
  decision 11).
- The Vite server options in `vite.config.ts` (static-file boundary, CORS, and any page-wide
  security header D-01 selects).
- ID path decoding in `server/catalogueApi.ts` (every route that takes an ID from the URL).
- `src/artifacts/sanitise.ts`, and link interception in `src/artifacts/CanvasViewer.tsx` (the click
  handling of anchors inside a drawing).
- Deferred decision D-01 and its record in PROGRESS.md.
- The `README.md` lines that describe how the server serves files (about lines 190 to 196 at HEAD),
  updated to match and listed under "Doc facts" (convention 12).
- The proof and disposition of all seven owned findings.

**Excludes:**
- Consistency-review `apply.mjs` path safety, R-34: **B13**.
- The file watcher and event batching in `cataloguePlugin.ts` (R-158): **B07**.
- Per-record load isolation in `artifactInfo` (`server/artifactFiles.ts`, R-47 apart from its
  REPO_ROOT symlink "also") and cached PDF facts (R-160): **B03**, which reuses B01's real-path rule.
- Placement keys, region refresh and every other viewer behaviour in `CanvasViewer.tsx` (R-99 and
  the rest of `src/artifacts/*`): **B10**. The client-side "file is missing" and "Not kept" branches
  stay as they are; B01 makes them reachable.
- Write-route semantics in `catalogueApi.ts` (field patches, conflicts, ID allocation): **B05**.
  The status in-use guard: **B02**.
- The whole-file docs truth pass (`README.md`, `ADOPTING.md`, SCHEMA, About) and Playwright port
  assignments: **B14**. B01 still updates its own README serving lines (convention 12).

**Depends on:** none (first in the serial order B01, B02, B03, B04, B08, B05, B07, B06, B09, B10,
B11, B14, B15). Decision gate: D-01 resolved and recorded in PROGRESS.md "Accepted decisions" before
B01 builds.

**Unblocks:**
- **B10** (Artifact viewers; Depends on B01, B03, B04, B07) consumes the link-handling outcome
  (B01-REQ-03), the B01-Q2 answer on fragment links and the D-01c answer on page CSP. B10's later
  edits to `CanvasViewer.tsx` build on B01's click handling.
- **B05** and **B02** edit `catalogueApi.ts` after B01 and inherit the ID-decoding rule (B01-REQ-09)
  for every route they add or change.
- **B07** edits `cataloguePlugin.ts` after B01 and inherits the guard and route shape.
- **B03** (Depends on B01: `artifactFiles.ts` real-path rule) edits `artifactFiles.ts` after B01 and
  reuses the containment rule (B01-REQ-07) rather than adding a second one.
- **B08** edits the history-blob route in `cataloguePlugin.ts` after B01 (if its reader signatures
  change) and keeps B01's guards, 404s and real-path rule.
- **B07** (D-10) produces an asset version token for asset URLs; B01's guarded asset route must accept
  it (B01 preserves query-string tokens on asset URLs, P-05).

**Binding constraints:** PROGRESS.md conventions 1 to 14 apply; the ones that shape this phase are
named here. Existing stack only (Vite 8.3, React 18, TypeScript, Node >= 22.18, Vitest, Playwright);
a new dependency needs a recorded reason (convention 3). The board
stays project-generic: the catalogue folder is whatever `REQUIREMENTS_DIR` (or the default
`requirements/`) names, never a project path written into code (convention 4). Drawings render
inline in a shadow root so their text selects and anchors find elements (`README.md` "Artifacts";
`sanitise.ts` header). Finish green with `npm run verify:board`; touched Playwright specs pass on a
free port, never 5173, 5174, 5180 or 5181 (convention 6). Board version bump and CHANGELOG entry
(convention 5). No catalogue content changes (convention 7). Git: commit and merge, never push;
no staging mid-phase (convention 9). App phases run one at a time in the serial order (convention 10).
Touch rights: B01 delivers each owned fix whole, with minimal named edits in other phases' files where
needed (convention 11). Doc lines it changes are updated and listed under "Doc facts" (convention 12).
Every proof fails before the fix and passes after (convention 13).

## Objective and outcomes

The board's dev server is also its read/write file API: any script that runs in its origin can
delete or rewrite requirement files, and any page that can read its responses can read the whole
catalogue, including repository-rooted PDFs. This phase closes that origin.

When B01 is delivered:

1. **No catalogue content runs script or navigates the board.** A drawing, however its links are
   spelled, cannot run script when shown or clicked; a link inside a drawing never moves the board
   to another route. Inline drawings make no requests to other hosts.
2. **Raw catalogue files are reachable only through the board's own routes.** No spelling of a
   path (percent-encoding, letter case, `/@fs/`, dot segments, doubled slashes) reaches Vite's raw
   file serving for the catalogue folder, and every SVG the server sends carries the no-script CSP.
3. **A miss is a miss.** A file route that cannot serve answers with a 4xx, never the SPA's
   `index.html` with 200, and never a 500 or a hung request.
4. **Containment survives symlinks.** No file route or file reader follows a symbolic link to a
   file outside its base.
5. **Other origins cannot read the board.** A page on another localhost port or host cannot read
   any board response; writes stay refused as today.
6. **Malformed URLs are client errors.** A bad percent-escape gives 400 or 404, never 500.

## Sources and current-state evidence

Verified at HEAD d4341735 (board 1.12.3). Paths are relative to `requirements-board/`. All seven
findings still reproduce or still hold by code reading; line moves are noted.

| Finding | HEAD location | Status at HEAD |
|---|---|---|
| R-03 | `src/artifacts/sanitise.ts:29-35` (href test at :33) | **Reproduces.** A jsdom run of the real `sanitiseSvg` keeps `<a x:href="javascript:alert(1)">` with `xmlns:x` bound to the XLink namespace (`getAttributeNS(XLINK,'href')` returns `javascript:alert(1)`); the literal `xlink:href` and plain `href` controls are stripped. |
| R-04 | `server/cataloguePlugin.ts:120-129` (guard at :122) | **Holds by code reading.** The guard tests the undecoded, case-sensitive pathname. Vite 8.3.0's static middleware decodes the pathname (`node.js:17440-17452`); `/@fs/` (`serveRawFsMiddleware`, `node.js:17469-17491`) is a third bypass, as the refuting verifier noted. Not re-run on a live server (no dev servers in authoring). |
| R-22 | `server/cataloguePlugin.ts:130-137` | **Holds.** Both branches call `next()` on a miss; `serveHistoryBlob`'s promise has no rejection handler (:135). The client already maps 404 to "the file is missing" (`ArtifactViewer.tsx:42-45`, `content.ts:46-47`) and a failed HEAD to "not kept" (`VisualCompare.tsx:29-30`), so the server fix alone makes those branches live. |
| R-35 | `server/cataloguePlugin.ts:285-299` (`serveAsset`); `server/artifactFiles.ts:61-66` (`artifactPath`, cited as 63-68) | **Holds.** Containment is a string prefix test on the resolved path; `statSync`, `createReadStream` and `readFileSync` follow links. `find requirements -type l` finds no symlinks in this catalogue today. |
| R-36 | `vite.config.ts:20` | **Holds.** No `cors` option, so Vite's default applies: origins matching `^https?://((.+\.)?localhost|127\.0\.0\.1|\[::1\])(:\d+)?$` (`node.js:781`, applied at `:24511`, before plugin middleware). |
| R-63 | `server/catalogueApi.ts:295, 308, 327, 345, 356, 456, 464`; `server/cataloguePlugin.ts:167, 286` | **Holds; lines unchanged.** `decodeURIComponent('%E0%A4%A')` throws URIError. In the API it becomes a 500 (`cataloguePlugin.ts:150-153`); in the file routes it escapes the middleware to Vite's error handler. |
| R-102 | `src/artifacts/CanvasViewer.tsx:186-196` (cited as :188); `sanitise.ts:33`; `svgLinks.ts:63`; `src/main.tsx:22` (HashRouter) | **Holds.** `onClick` returns early unless the target is a `.record-id` link, so a kept `href="#..."` navigates `location.hash`, which the HashRouter treats as a route. |

Further facts found while verifying (evidence, not findings; they shape the requirements below):

- **E1. Network reach survives the sanitiser** (R-03's "also"). In the same jsdom run, these
  survive unchanged: `fill="url(https://...)"` and `filter="url(https://...)"` presentation
  attributes; `image-set('https://...')` in a `style` attribute and in a `<style>` element; an
  HTML-namespaced `<img src="https://...">` placed directly in the SVG. Whether each one fetches in
  every browser is not proven; the sanitiser's own contract (`sanitise.ts:1-6`) says nothing in a
  drawing "may run or reach out".
- **E2. Vite serves any `.html` file under its root as a page.** `indexHtmlMiddleware`
  (`node.js:17747-17797`) decodes the path and serves an existing `.html` file (also under
  `/@fs/`), subject only to `fs.allow`/`fs.deny`. The catalogue holds no `.html` file today (survey:
  png, md, json, svg, pdf, docx, ts, py, csv), but a bypass spelling to one would run its script in
  the board's origin.
- **E3. The guard misreads a doubled leading slash.** `new URL('//requirements/a.svg',
  'http://local')` gives host `requirements` and pathname `/a.svg`, so the guard does not match.
  Vite's static middleware skips URLs starting `//` (`node.js:17439`), so this is not a proven
  bypass; it belongs in the spellings the proof covers.
- **E4. How Vite's deny list matches.** `fsDenyGlob` is case-insensitive (`nocase: true`) and
  matches absolute file paths; a pattern containing `/` is not prefixed with `**/`
  (`node.js:37196-37200`). It is checked by the root static middleware, `/@fs/` and the HTML
  middleware through `shouldServe`/`checkLoadingAccess` (`node.js:17389-17410`, `:17532`).
- **E5. The catalogue folder can sit outside Vite's root.** The e2e fixture sets
  `REQUIREMENTS_DIR` to a temp folder (`playwright.config.ts`); the in-tree `requirements/` folder is
  then still under Vite's root and still reachable by a bypass spelling. No client code imports from
  the catalogue folder (only `CHANGELOG.md?raw`), so refusing it to Vite's module serving breaks no
  import.
- **E6. Write protection today.** `refuseCrossSite` (`catalogueApi.ts:252-260`) requires
  `application/json` and refuses an `Origin` that differs from `Host`. It relies on Vite's host
  validation (`allowedHosts`, default on, `node.js:24513`) to stop DNS rebinding, where `Origin` and
  `Host` would both name the attacker's host. Tests: `tests/api.test.ts:190-196`.
- **E7. Other readers follow links too.** `artifactInfo` reads through `artifactPath` and ships
  facts (Markdown headings, sizes, PDF page sizes) in `/api/catalogue`; `serveHistoryBlob`'s disk
  fallback (:206-209) and `blobWasAt` (:262) read through `statSync`/`readFileSync`, gated by a blob
  hash match (so they disclose nothing the caller cannot already name).
- **E7a. Real and unreal paths are mixed** (R-47's REPO_ROOT "also", accepted decision 11).
  `REPO_ROOT` comes from `git rev-parse --show-toplevel`, which reports the real path
  (`artifactFiles.ts:21, 29-35`), while the requirements folder is used as given (`cataloguePlugin.ts:80`
  `rootAbs`, `artifactPath`'s plain-path base). Where the two differ by a symlink (a macOS temp folder
  under `/var`, a checkout reached through a linked folder), prefix tests that compare one kind of path
  with the other (`artifactPath`, the watcher's inside/outside split at `cataloguePlugin.ts:89, 106`,
  `meta.path` at `artifactFiles.ts:114`) can misclassify a `/`-rooted artifact's file.
- **E8. A decoded ID can carry a path.** `/api/items/..%2F..%2Fx` decodes to `../../x`, which
  `itemPath` joins into a filesystem path. `checked()` (`catalogueApi.ts:174-179`) then refuses it
  because the file's own `id` does not match, so it is not exploitable today, but the read happens
  before the refusal.
- **E9. Surfaces already safe** (preserve them): Markdown renders through react-markdown 10 with its
  default URL transform and no raw HTML (`src/components/Prose.tsx`, `MarkdownReader.tsx`); mermaid
  runs with `securityLevel: 'strict'` and its output goes through `sanitiseSvg`
  (`src/artifacts/mermaid.ts:23`, `content.ts:42-44`); pdf.js 5.7 renders the canvas and text layer
  only, no annotation layer (`PdfReader.tsx:39, :598`).
- **Existing tests to keep green and extend:** `tests/api.test.ts` (`serveAsset` containment at
  :379-387, cross-site refusals at :190-196, `serveHistoryBlob` at :561 and :629);
  `tests/artifacts.test.ts:744-753` (artifact file through its sidecar, SVG CSP);
  `tests/svgLinks.test.ts`, `tests/stepsDom.test.ts`, `tests/stepMoves.test.ts` (sanitised drawings).
- **No other HTTP clients.** No script, skill or tool fetches the board from another origin or
  writes over HTTP; `shoot-steps.ts` and the agent skills open board pages or read from Node. Only
  `src/api.ts` writes.

## Detailed requirements

### B01-REQ-01 · A drawing's links cannot run script, whatever their spelling (R-03)

- After sanitising, no attribute on any element, in any namespace and under any prefix, whose value
  a browser resolves as a link or resource reference (`href` resolved by namespace and local name,
  so XLink href under any prefix; `src`, `srcset`, `action`, `formaction`, `data`, and the like) may
  hold anything other than a same-document fragment (`#...`) or a data URL for a raster image of the
  kinds already allowed (PNG, JPEG, GIF, WebP).
- The rule is decided by what the browser will resolve, not by the attribute's written name. This
  is a security boundary: it is mandatory, not a candidate.
- Candidate (FINDINGS): match on `localName` with a null or XLink namespace; or, stronger, an
  allowlist of attributes and values that drops every URL-bearing attribute in any namespace. The
  implementation plan chooses.
- Elements and handlers already dropped stay dropped (script, foreignObject, iframe, object, embed,
  audio, video, canvas, the animation elements, `on*` attributes).

### B01-REQ-02 · Inline drawings make no outside requests (R-03 "also", E1)

- A sanitised drawing references nothing outside itself: no `url(...)` to another document in a
  presentation attribute (`fill`, `stroke`, `filter`, `mask`, `clip-path`, `marker-*` and the
  like), a `style` attribute or a `<style>` element; no `image-set(...)` or other CSS image function
  that loads from a URL; no HTML-namespaced element that loads a resource.
- Same-document references keep working: `url(#gradient)`, `<use href="#symbol">`, markers, masks
  and filters that point at elements in the drawing, and data URLs for allowed raster images.

### B01-REQ-03 · Clicking a link in a drawing never navigates the board (R-102, defence in depth for R-03)

- A record link (`.record-id`, added by `linkRecordIds`) behaves exactly as today: a plain click or
  Enter opens that record's sheet or artifact page; a modified click (Cmd, Ctrl, Shift, middle
  button) opens its `#/board?...` or `#/artifacts/...` href in a new tab; hover shows the tooltip;
  Tab focus reveals it; a drag that selects text is not a click.
- Every other anchor in a drawing, whatever its href, is inert as a navigation: a plain, modified
  or keyboard activation never changes `location.hash` or the route, never opens a tab or window,
  and never runs anything.
- What a same-document fragment link does instead (bring its target into view, or nothing) is
  B01-Q2. Either answer satisfies this requirement as long as the route does not change.

### B01-REQ-04 · Raw catalogue files are served only by the board's own routes, under any spelling (R-04, E2, E3, E5)

Scope note: the `/@fs/` route is in R-04's own evidence. The `.html` page case (E2), the doubled-slash
spelling (E3) and the in-tree folder under a fixture (E5) are **extensions** in the same defect class
(raw catalogue files reached around the guard), so a gap there is not read as R-04 failing.

- Every request whose path, once decoded and resolved the way Vite would resolve it (percent
  escapes, letter case on a case-insensitive file system, dot segments, backslashes, doubled
  slashes, and the `/@fs/<absolute path>` form), lands inside the catalogue folder is answered only
  by the board's own routes. Vite's static, raw-file, HTML-page and module-transform serving never
  serve a file from it.
- "The catalogue folder" means the folder the board is serving (`REQUIREMENTS_DIR` when set) **and**
  the in-tree `requirements/` folder whenever that sits under Vite's root, so a fixture run cannot
  expose the real catalogue (E5). The rule names no project path in code.
- The board's own `/requirements/` route recognises its prefix under the same spellings, so a
  spelling either reaches `serveAsset` (and its assets-only containment) or a 404; it never falls
  through.
- Screenshots keep loading at the URLs `assetUrl` builds (`src/api.ts:91`), including names with
  spaces, `#`, `%` or non-ASCII characters.
- How the boundary is enforced (a Vite deny rule, normalising in the plugin, or both) is D-01a.

### B01-REQ-05 · Every SVG response is no-script, and no file response is sniffed (R-04)

- Every response the server sends with type `image/svg+xml`, from any route, carries the no-script
  `Content-Security-Policy` (`SVG_CSP`, `cataloguePlugin.ts:163`, or a policy at least as strict).
- **Hardening (addition beyond R-04's proposed fix, same defect class: files opened as pages):** every
  file the board's routes serve (assets, artifact files, history blobs) declares its type and disables
  MIME sniffing, so a Markdown or image file opened in its own tab can never be treated as HTML.
  (`serveHistoryBlob` already does; `serveAsset` and `serveArtifactFile` do not.)

### B01-REQ-06 · A file route that cannot serve answers with a 4xx (R-22)

- `/artifact-file/<ID>`: an unknown ID, an artifact with no file, a file outside its base, an
  unsupported type, a missing file or a read error ends with 404 (or 400 for a malformed ID, per
  B01-REQ-09); never `index.html`, never 200.
- `/history-blob/<sha>`: a malformed hash, an unknown artifact, a path outside `assets/`, a blob git
  does not have and the disk does not match, or any failure inside the lookup ends with 404 (or
  400); a rejected lookup never leaves the request hanging and never surfaces as an unhandled
  rejection.
- GET and HEAD behave alike (VisualCompare probes with HEAD).
- Consequence to prove, not build: the viewer then shows "the file is missing" for a moved file,
  VisualCompare shows its "not kept" state, and no viewer renders `<!doctype html>` as a document.

### B01-REQ-07 · No file route or reader follows a link out of its base (R-35, R-47 REPO_ROOT "also", E7, E7a)

- A path is inside its base only if its real location (all symbolic links resolved) is inside the
  base's real location. Bases: the requirements folder's `assets/` for screenshots and asset
  history blobs; the requirements folder for a plain artifact path; the repository root for an
  artifact path starting `/`.
- Applies to every place that resolves such a path and then reads the file: `serveAsset`,
  `serveArtifactFile`, `serveHistoryBlob` (including its disk fallback), and `artifactPath`'s
  callers (artifact facts for `/api/catalogue` and the check, the watcher's list of outside files).
  A file refused here is treated as missing by its caller (404 for a route; the existing "missing"
  or "outside" issue for the check), never a crash.
- A base that is itself reached through a symlink keeps working (the macOS temp folder sits under
  `/var -> /private/var`).
- **REPO_ROOT symlink case (accepted decision 11).** When `REPO_ROOT` (or the git top-level) and the
  requirements folder differ by a symlink, a `/`-rooted artifact still resolves to its file, is served,
  read for facts, reported with the right repository-relative path, and classified correctly as inside
  or outside the requirements folder. Every containment comparison compares real paths on both sides
  (E7a). This is the one rule; B03's `artifactInfo` isolation and B07's watcher reuse it.
- Whether a symlink that stays inside its base is allowed is B01-Q1.

### B01-REQ-08 · Other origins cannot read board responses (R-36, E6)

- A browser page served from any other origin (another localhost port, a `*.localhost` host,
  `127.0.0.1`, `[::1]`, or any other site) cannot read the response of any board route: `/api/*`
  (catalogue, diff, history), `/artifact-file/`, `/history-blob/`, `/requirements/`.
- The board's own page, its HMR channel (`catalogue:changed`), and non-browser clients (Node
  `fetch`, Playwright's `request`, curl, scripts) keep working unchanged.
- Write refusals stay exactly as today: non-JSON writes 415, a foreign `Origin` 403.
- Vite's host validation stays on (never `allowedHosts: true`), since the Origin check depends on it.
- Whether no-cors embedding by another origin (an `<img>` or `<iframe>` pointing at a board URL)
  must also be refused is part of D-01b.

### B01-REQ-09 · Malformed URLs give client errors, and a decoded ID never names a path (R-63, E8)

- Every ID taken from a URL path is decoded through one rule. A malformed percent-escape gives 400
  with the API's JSON error body on `/api/*` routes, and 400 or 404 (no stack trace, no Vite error
  page) on file routes. No request with a bad escape produces a 500.
- A decoded ID that could name a different file (it contains a path separator, a `..` segment, a
  NUL or other control character) is refused with 400 before any file is read. The rule must never
  refuse an ID the catalogue can hold; it encodes no project ID pattern. (**Hardening, addition
  beyond R-63**, within B01's ID-decoding territory; B01-Q3 records the exact shape.)
- Applies to all current ID routes (artifact history and details, item history, item PUT and
  DELETE, question PUT and DELETE) and to any route B02 or B05 adds later.

### B01-REQ-10 · Write protection follows D-01d (conditional)

- Unconditional: writes keep today's protections (B01-REQ-08) and every existing write path from
  the board's page keeps working.
- **If D-01d selects a per-session write token:** every non-GET API request without the current
  token is refused with a 4xx that names the reason; the board's own page obtains and sends it
  without user action; a tab left open across a server restart recovers (reload or re-fetch) with a
  clear message rather than silently failing saves; Node-side tests and tools that write keep a
  documented way to do so. If D-01d selects no token, this requirement adds nothing.

### Preserved behaviour (must not regress)

- **P-01** Inline drawings: text selection and copy, `text=` and `node=` anchors, find, region
  boxes, stepped-diagram state, minimap thumbnails, mermaid rendering, raster artifacts wrapped as
  SVG (`rasterSvg`, whose `href` is board-built, not catalogue content).
- **P-02** Record links in drawings, as described in B01-REQ-03.
- **P-03** `/artifact-file/<ID>` serves only through the sidecar (existing test rejects
  `..%2F...`); repository-rooted artifacts (a `/`-prefixed `file`, for example the RFP PDFs) still
  open same-origin, including in a new tab from prose.
- **P-04** History blobs for moved and renamed files (existing tests at `tests/api.test.ts:561`,
  `:629`), uncommitted versions served from disk, and their immutable caching.
- **P-05** Screenshots with encoded names, and asset URLs carrying a query-string version token (the
  form B07 chooses under D-10), keep loading; `serveAsset` refuses anything outside `assets/` (existing
  test at `tests/api.test.ts:379-387`).
- **P-06** Markdown link handling (E9): bare IDs open sheets, artifact links open their page,
  external links open in a new tab with `rel="noreferrer"`, unsafe schemes stay neutralised.
- **P-07** The dev page loads and hot-reloads as today; lane ports (`BOARD_PORT`, `.lane.env`) and
  `strictPort` unchanged; `optimizeDeps` unchanged.
- **P-08** `npm run check` output for this catalogue is unchanged (no new issues), since no
  catalogue file is a symlink.

## Dependencies and handoffs

- **Inputs:** none from other phases. D-01 answered and recorded in PROGRESS.md "Accepted
  decisions" before build.
- **Outputs and their consumers:**
  - B10: the rule that non-record anchors in a drawing never navigate (B01-REQ-03), the B01-Q2
    answer on fragment links, and the D-01c answer on page CSP (which constrains anything B10 loads,
    for example pdf.js workers or blob images). B01 records these in its PROGRESS entry.
  - B05, B02: one ID-decoding rule in `catalogueApi.ts` that new or changed routes must use.
  - B07: the middleware's route shape after B01 (guards first, misses end in 4xx); B07 changes only
    the watcher's batching. B01's only watcher edit is the minimal one its real-path rule needs (the
    inside/outside comparison and the list of outside files: a symlinked outside target stops being
    watched), named in its entry (convention 11).
  - B03: the containment and real-path rule in `artifactPath`, including the REPO_ROOT symlink case
    (accepted decision 11). B03's per-record isolation in `artifactInfo` uses it, not a second one.
  - B08: the history-blob route as B01 leaves it (4xx on every miss, real-path rule on disk reads), if
    B08 changes reader signatures there.
  - B07: D-10's asset URL token must pass B01's guard (P-05).
  - B15: integration proof re-runs B01's spellings, cross-origin and symlink checks.
- **Shared files** (PLAN.md shared-files table): `server/artifactFiles.ts` (B01 real paths, then B03);
  `server/cataloguePlugin.ts` (B01, then B08 if needed, then B07); `server/catalogueApi.ts` (B01 first);
  `src/artifacts/CanvasViewer.tsx` (B01 link interception only, then B10). Any minimal edit outside
  B01's territory is named in its PROGRESS entry (convention 11).
- **Docs:** B01 updates the `README.md` serving lines (about 190 to 196: "The server serves a file
  only through its sidecar ... SVGs with a no-script CSP") to state what the server now refuses and
  sends, and lists them under "Doc facts" (convention 12). B14's whole-file pass follows.
- **Integration proof owner:** B01 proves its own requirements; B15 owns programme integration.

## Acceptance and evidence

Every proof must fail on the code before the fix and pass after it (convention 13). It is an
automated test where practical, otherwise a recorded manual check, with its command and its before
and after results in IMPLEMENTATION.md and the PROGRESS entry. Live-server checks run
on a free port (never 5173, 5174, 5180, 5181).

### Unconditional

| Proof | Requirement | Finding | What must be demonstrated |
|---|---|---|---|
| PR-01 | REQ-01 | R-03 | The sanitiser's output for `<a x:href="javascript:...">` (XLink bound to a non-`xlink` prefix) has no XLink href by namespace lookup; the same holds for other URL-bearing attributes under odd prefixes and the HTML namespace; `#frag` and `data:image/png` survive. Run against the real `sanitiseSvg`. |
| PR-02 | REQ-02 | R-03 also | Each E1 vector (external `url()` in presentation attributes, `image-set` in attribute and `<style>`, HTML-namespaced `src`) is gone from the output; `url(#id)`, `<use href="#id">` and data rasters remain. |
| PR-03 | REQ-03 | R-102, R-03 | In a browser: clicking, modified-clicking and pressing Enter on a non-record anchor in a drawing leaves `location.hash` and the route unchanged and opens no tab; record links still open their sheet, artifact page or new tab as before. |
| PR-04 | REQ-04 | R-04 | On a live board: `/requirements/<svg>` (outside `assets/`), `/%72equirements/...`, `/REQUIREMENTS/...`, `//requirements/...`, a dot-segment spelling and `/@fs/<absolute catalogue path>/...` each return a 4xx and never the file; the same for a temporary `.html` file in the catalogue folder (removed afterwards); with `REQUIREMENTS_DIR` pointing at a fixture, the in-tree folder is refused too. A screenshot with an encoded name still loads. |
| PR-05 | REQ-05 | R-04 | Every `image/svg+xml` response from every route carries the no-script CSP; asset and artifact-file responses carry `X-Content-Type-Options: nosniff`. |
| PR-06 | REQ-06 | R-22 | `/artifact-file/` for a missing file and an unknown ID, and `/history-blob/` for a bad hash, an unknown blob and a failing lookup, return 404 (GET and HEAD), with no unhandled rejection; in the browser, a sidecar naming a moved file shows "the file is missing". |
| PR-07 | REQ-07 | R-35 | With a symlink in `assets/` (and in an artifact's file path) pointing outside its base, the route returns 404 and the catalogue facts do not include the target's content; a requirements folder reached through a symlinked parent (temp folder) still serves; with `REPO_ROOT` (or the git top-level) and the requirements folder differing by a symlink, a `/`-rooted artifact resolves, is served, gets the right repository-relative `meta.path`, and is classified correctly as inside or outside the requirements folder (R-47 REPO_ROOT "also"). |
| PR-08 | REQ-08 | R-36 | A request carrying another localhost `Origin` gets no permissive CORS header on `/api/catalogue`, `/artifact-file/` and `/history-blob/` (and a page on another port cannot read them); the board's own page, HMR updates and Node-side `request.get` still work; the existing 415 and 403 tests pass. |
| PR-09 | REQ-09 | R-63 | `PUT /api/items/%E0%A4%A` and each other ID route with a bad escape return 400 with a JSON error; `/artifact-file/%E0%A4%A` and `/requirements/%E0%A4%A` return 4xx without reaching Vite's error page; `/api/items/..%2F..%2Fx` is refused 400 without a file read; every ID in this catalogue and the test fixtures still routes. |
| PR-10 | P-01 to P-08 | all | `npm run verify:board` green (existing sanitiser, svgLinks, steps, api and artifacts tests unchanged in meaning); the touched Playwright specs (at least `artifacts.spec.ts`, `diff.spec.ts`) pass; `npm run check` reports the same issues as before. |

### Awaiting D-01

- PR-04's mechanism follows D-01a; the behaviour proved is the same either way.
- If D-01b refuses no-cors embedding: a page on another origin cannot display board files in an
  `<img>`, `<iframe>` or `<object>`.
- If D-01c adopts a page CSP: an inline `javascript:` navigation and an injected inline handler are
  blocked on the board page, while the dev page, HMR, mermaid, pdf.js and blob thumbnails still work.
- If D-01d adopts a write token: a write without the token is refused; the board's page saves
  normally; a restart with a tab open recovers as B01-REQ-10 states.

### Prohibited regressions

No drawing loses selectable text, anchors, record links or steps; no legitimate screenshot,
artifact file or history blob stops loading; no write from the board's own page is refused; no
change to catalogue files.

## Deferred decisions for execution planning

Shared register: [PROGRESS.md "Deferred decisions"](../../PROGRESS.md). Resolve with the user in
B01's implementation-planning conversation; record answers in PROGRESS.md "Accepted decisions"
before building. B10 builds only after D-01c and B01-Q2 are recorded (PROGRESS.md B10 gate, with
B07's D-10). Open items: D-01 (four parts) and B01-Q1 to B01-Q3, all owned by B01 and gated on B01
build; B01-Q4 is answered.

**D-01 · Origin security model.** Owner B01; waits on it: B10 (link handling, CSP); resolve before
B01 build. Four parts:

- **D-01a · Raw-file boundary** (REQ-04, PR-04).
  - *Vite deny rule* for the catalogue folder(s): covers static, `/@fs/` and HTML serving under any
    spelling, case-insensitively (E4). The patterns must match absolute paths and must follow
    `REQUIREMENTS_DIR` as the plugin does, plus the in-tree folder (E5). The board's own routes run
    before Vite's and are unaffected.
  - *Normalise in the plugin's guard* (decode, case-fold, handle `//` and dot segments): fixes the
    board's own prefix test but leaves `/@fs/` and the HTML middleware open unless the plugin also
    guards those.
  - *Both:* the deny rule as the boundary, normalisation so every spelling of the board's own
    prefix reaches `serveAsset` or a 404. Consequence of every option: the proof set in PR-04.
- **D-01b · CORS policy** (REQ-08, PR-08).
  - *Turn Vite's CORS off:* other origins get no CORS headers; preflights for writes already fail
    (non-JSON OPTIONS gets 415). Simplest; no legitimate cross-origin reader exists.
  - *Same-origin allowlist:* explicit origin list equal to the board's own; more configuration to
    keep in step with `BOARD_PORT`.
  - *Optional addition:* refuse cross-site reads server-side (fetch-metadata headers or a
    same-origin resource policy), which also stops no-cors embedding by other pages. Consequence:
    must not block the board's own new-tab links to files or its HEAD probes.
- **D-01c · CSP for inline SVG** (REQ-01 to REQ-03 defence in depth).
  - *Sanitiser and click interception only:* no page CSP; REQ-01 to REQ-03 carry the boundary.
  - *Page-wide CSP on the board page* (a CSP cannot be scoped to a shadow root): blocks
    `javascript:` navigations and inline handlers even if the sanitiser misses one. Consequences:
    Vite's dev page injects an inline React refresh preamble (needs a nonce or hash), the shadow
    root and drawings use `<style>` (so styles need inline allowance), thumbnails use `blob:` and
    `data:` images, mermaid and pdf.js (workers) must still load. Risk of breaking the dev page.
  - *Isolate drawings* (sandboxed frame or `<img>`): rejected in effect by P-01 (no selection,
    anchors, record links or steps); listed for completeness.
- **D-01d · Per-session write token** (REQ-10).
  - *No token:* rely on JSON-only writes, the Origin check and Vite's host validation (E6). A
    same-origin script (the R-03/R-04 threat) is stopped by REQ-01 to REQ-05, not by a token.
  - *Token on every non-GET:* closes requests that carry no `Origin`, at the cost of client and
    test changes, restart handling, and documenting how a Node tool writes. It does not stop script
    already running in the origin, which can read the token.

**B01-Q1 · Symlinks inside a base.** Source: R-35 fix offers "realpath compare" or "reject symlinks
via lstat". Affects REQ-07, PR-07. Owner B01; no dependants. Options: refuse every symlink (simplest,
blocks a deliberate in-repo link, none exist today) or allow links whose real target stays inside
the base. Resolve before B01 build.

**B01-Q2 · What a fragment link in a drawing does.** Source: R-102 fix ("pan to the target
instead"). Affects REQ-03, PR-03. Owner B01; dependant B10 (camera and placement). Options: inert
(no navigation, nothing else) or bring the referenced element into view with the viewer's existing
reveal behaviour (missing target: nothing). Resolve before B01 build.

**B01-Q3 · The exact "path-safe ID" rule.** Source: E8 (no finding; hardening of R-63's decoding).
Affects REQ-09, PR-09. Owner B01; dependants B02, B05 (they inherit it). Which characters and shapes
are refused, given the kit is generic and IDs come from `shared/ids.ts` rules. Resolve before B01
build.

**B01-Q4 · Who edits the README line on serving.** Answered (accepted decision 10, 2026-11-18):
under convention 12, B01 updates the README serving lines itself and lists them under "Doc facts" in
its PROGRESS entry; B14 does the whole-file pass.

## Risks and recovery requirements

- **Breaking the dev page.** A deny rule that matches too much (the board's own source, the
  CHANGELOG import, `node_modules`) or a page CSP that blocks Vite's preamble leaves a blank board.
  Recovery: the change is configuration and server code only; reverting the phase commit restores
  the board. The implementation plan must prove the board loads on a free port before review.
- **Deny patterns that silently match nothing** (E4: relative patterns against absolute paths).
  PR-04 must hit the live server, not only unit-test the guard.
- **Over-eager sanitising.** Dropping same-document references would blank gradients, markers or
  step highlighting in existing diagrams. P-01 and the existing steps tests guard this; the
  real-catalogue e2e (`BOARD_E2E_REAL=1`, run on a free port, not 5181) is the fuller check if used.
- **Real-path comparison on macOS** (`/var` versus `/private/var`, git's real paths): a naive
  comparison would refuse every file in a temp-folder fixture. PR-07 covers it.
- **Residual, out of scope:** Vite's dev server still serves the board's own source, `node_modules`
  files and any `.html` outside the catalogue folder as same-origin pages; this is Vite's normal dev
  model, not catalogue content. If the implementation finds a practical way to narrow it within D-01,
  record it; otherwise note it in "Discovered for later" for B15.
- **Data protection:** no catalogue file is changed by this phase.

## Execution and handoff obligations

1. Read PROGRESS.md, PLAN.md, this SPEC and the seven findings in full; reconfirm each at HEAD and
   note any drift.
2. Resolve D-01 (all four parts) and B01-Q1 to B01-Q3 with the user; record the answers in
   PROGRESS.md "Accepted decisions" before building.
3. Write `docs/board-fixes/phases/B01-origin-security/IMPLEMENTATION.md` before building: the chosen
   approach per requirement, the proof plan per PR row, the execution bites and the recovery plan.
4. Build in bites, each with a proof shown failing on the code before the fix and passing after it
   (convention 13). Do not build B07's watcher batching, B03's `artifactInfo` isolation, B10's viewer
   behaviour or B13's `apply.mjs`; any minimal edit in another phase's file that a B01 fix needs (for
   example the watcher's inside/outside comparison) is kept to that need and named in the entry
   (convention 11).
5. Finish green: `npm run verify:board` from the repo root; touched Playwright specs on a free port.
6. Bump the board version in `requirements-board/package.json` and its lock file (minor: users and
   agents can see the changed refusals) and add a `CHANGELOG.md` entry.
7. Run the three review lenses (quality and maintainability; completeness against this SPEC;
   bugs and correctness, including an attempt to bypass each boundary), verify their findings, fix
   confirmed ones and re-run step 5.
8. Give every owned finding a disposition: **Fixed** (with its PR row), **Not reproducible at HEAD**
   (evidence), **Won't fix** (user accepted, reason) or **Moved** (named owner, recorded in
   PROGRESS.md and both SPECs).
9. Update the `README.md` serving lines (about 190 to 196) and any other doc line that describes
   behaviour B01 changed (convention 12).
10. Write the PROGRESS.md phase entry last: what shipped, the D-01 and B01-Q answers, the facts B10,
   B05, B02, B03, B07 and B08 inherit, the minimal edits made in other phases' files, the doc lines
   changed listed under "Doc facts", and anything discovered for later.
11. Commit only this phase's files, staged by path at commit time; never push.
