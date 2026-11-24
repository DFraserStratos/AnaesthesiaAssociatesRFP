# B01 Origin security: implementation plan and record

Paths are relative to `requirements-board/` unless they start with `docs/`. Board 1.12.3 to 1.13.0.

## Starting point (reverified at HEAD c75c7394)

- Prerequisites: none. Working tree clean at start.
- Decisions: D-01a to D-01d and B01-Q1 to B01-Q3 were already accepted (PROGRESS.md accepted
  decision 13, 2026-11-19, user). B01-Q4 answered (decision 10). Nothing was asked again.
- Every SPEC location still held at HEAD (`cataloguePlugin.ts:120-137, 163-299`, `artifactFiles.ts:61-66, 114`,
  `catalogueApi.ts` seven `decodeURIComponent` sites, `sanitise.ts:29-37`, `CanvasViewer.tsx:186-196`,
  `vite.config.ts:20`). No drift.
- Reproduced live (scratch Vite on a free port, `tests/originLive.test.ts` before the fix): 35 of 44
  probes failed. `/%72equirements/`, `/REQUIREMENTS/`, `//requirements/`, `/requirements%2f...`,
  `?raw`, `?url`, `/@fs/` and `/@id/` all returned the in-tree `README.md` with 200 (`?import` a 500);
  the fixture catalogue inside Vite's root was served raw (SVG with script, `.md`, `.html` page);
  misses answered 200 with `index.html`; a CORS grant went to other localhost origins; bad escapes
  gave 500. **New fact:** a failing `/history-blob/` lookup (an unreadable file) raised an unhandled
  rejection that stopped the whole dev server (every later request failed).

## Decisions applied

| Decision | Applied as |
|---|---|
| D-01a both | `server.fs.deny` globs from the plugin's `config` hook (root folder and in-tree folder, as written and as real path, glob characters escaped, Vite's defaults kept), plus a plugin 404 (`namesFolder`) for any request whose named file (Vite root path, `/@fs/`, `/@id/`) sits in a catalogue folder, decided by folder identity (device and inode of each existing folder above it), so case, Unicode case folding, normalisation and links all count; the plugin's own prefixes matched on the decoded, normalised path |
| D-01b | `server.cors: false` in `vite.config.ts`; fetch-metadata refusal (`crossSiteRead`) for GET/HEAD on every route (Vite's own included) when `Sec-Fetch-Site` is `cross-site` or `same-site`, except a top-level navigation (`navigate` + `document`); `Cross-Origin-Resource-Policy: same-origin` on board routes. Writes keep the API's 415/403 |
| D-01c | No page CSP. Sanitiser plus click interception carry the boundary; raw SVG keeps `SVG_CSP` |
| D-01d | No token. REQ-10 adds nothing |
| B01-Q1 | Escaping symlinks served and warned: server log once per message (`[catalogue] ... served anyway`), check warning for an item image and for an artifact file. R-35 is Won't fix (warned instead) |
| B01-Q2 | A drawing's own `#id` link brings that element into view with the viewer's existing reveal; a missing target does nothing |
| B01-Q3 | `idFromPath`: refuses `/`, `\`, `.` and `..` (dot segments), NUL and other control characters (and empty), 400; no ID pattern. `Object.hasOwn` on the history routes, so `__proto__` is a 404 |

## Technical choices

- **One path rule module**, `server/realPaths.ts`: `realPath` (moved from the plugin), `realEntry`,
  `under`, `inside` (as written or as real folders), `linkOut`. B03 and B07 reuse it.
- **`artifactFiles.ts`**: `artifactBase`, `repoRelative` (real repository root against the real
  folder of the file) for `meta.path`, `facts.linkOut`. `artifactPath` stays lexical: a `..` spelling
  is refused; a link is followed and named.
- **Plugin middleware order**: parse the raw target (no `new URL` on the path, which reads `//x` as a
  host), decode and `posix.normalize` it; malformed outside `/api/` is 400; route by lower-cased
  prefix; outside the board's routes, the catalogue-folder 404 then `next()`; inside, CORP, the
  cross-site refusal, then the route with a URL rebuilt from the normalised path. Every file route
  ends 404 on a miss; the history-blob promise has a `.catch`.
- **Serve functions** keep their URL signatures (existing tests unchanged in meaning) and gain an
  optional `warn`. `serveAsset` serves only image types (`MIME`) under `assets/`. A shared `sendFile`
  sets type, `nosniff`, SVG CSP and no-cache. `Object.hasOwn` guards artifact lookups.
- **Sanitiser**: the root must be an SVG-namespace `svg`; drop every non-SVG-namespace element and
  the old DROP list; judge attributes by `localName` in any namespace; URL attributes keep only
  `#...` (not `#/...`) or a raster data URL (whitespace and controls stripped before the test);
  every other attribute except text ones (`id`, `class`, `role`, `lang`, `tabindex`, `aria-*`,
  `data-*`) is dropped if its CSS reaches out, read as a browser reads it (CRLF, CR and FF as LF,
  escapes undone, tested both with comments removed and left in); `<style>` is cut at `;`, `{`, `}`
  as written and loses each part that reaches out, the rest kept exactly as written (linear), or all
  its text if the rest could still reach out; `target`, `download`, `data-record` stripped (so a
  drawing cannot forge a record link). The root is processed like any element.
- **CanvasViewer**: every anchor click is prevented unless it is a record link opened with Cmd,
  Ctrl, Shift or a non-primary button (Alt is not a modifier there, as before); plain record clicks
  open the record as before; a non-record `#id` link reveals its target; `auxclick` prevented on
  non-record anchors; a click that came through a `<use>` copy (whose tree is closed to the page) is
  prevented too. `svgLinks.ts` gains `anchorFromEvent` (stops at the drawing's shadow root),
  `isRecordLink` (requires `data-record`) and `fromUseCopy`.

## Execution bites (as run)

1. Live probe written and run on HEAD (fails, above). 2. Sanitiser proofs written and run on HEAD
(21 fail). 3. `realPaths.ts`, check warnings, `artifactFiles.ts`. 4. `idFromPath` in `catalogueApi.ts`.
5. Plugin: deny hook, guard, routes, CORS off. Live probe found the deny rule alone left Vite's
page fallback (200 `index.html`, no file) for the fixture inside the root and for `/@id/`: added the
plugin 404 (`namesFolder`). 6. Sanitiser. 7. CanvasViewer and svgLinks. 8. Rules tests, e2e spec.
9. Docs, version, CHANGELOG. 10. Review (four reviewers) and fixes, below.

## Proofs (each failed on HEAD, passes after)

| PR | Test | Before | After |
|---|---|---|---|
| PR-01, PR-02 | `tests/sanitise.test.ts` (+ every real catalogue SVG keeps elements, ids, `#` refs and styles) | 21 of 49 fail at HEAD (first version); review additions: 6 of 12 fail at HEAD, the other 6 failed on the first B01 version (reviewer repros) | 61 pass |
| PR-03 | `e2e/origin.spec.ts` first two tests | hash changes; no reveal | pass |
| PR-04, PR-05, PR-06, PR-08, PR-09 (live) | `tests/originLive.test.ts`, scratch Vite on a free port, fixture with `( ) [ ] + { }` in its folder name, inside Vite's root | 35 of 44 fail | 50 pass (after review additions) |
| PR-04 (deny rule itself) | `tests/originRules.test.ts` "Vite's deny rule" via `resolveConfig` | (no deny) | pass, incl. real path and case |
| PR-06 (browser) | `e2e/origin.spec.ts` moved file | renders `index.html` | "the file is missing" |
| PR-07 | `tests/originRules.test.ts` symlink and REPO_ROOT cases on `/var` temp folders | `meta.path` wrong both ways; no warning | pass |
| PR-08 (browser) | `e2e/origin.spec.ts` from the other loopback name | catalogue and image readable | refused |
| PR-09 | `tests/originRules.test.ts` decode rule | 500 / 422 | 400 |
| PR-10 | `npm run verify:board` (617); full fixture e2e (100); `npm run check` byte-identical to HEAD; 15 real drawings and 3 region/step views rendered on port 5393, PNGs byte-identical before and after (drawings re-compared after the review fixes) | | pass |

Before-runs: the source files were stashed (`git stash push server shared src vite.config.ts`) and
the untracked `server/realPaths.ts` moved aside, tests kept, then both restored. The live probe, the
sanitiser proofs and the e2e spec fail on behaviour at HEAD. `tests/originRules.test.ts` imports
functions that do not exist at HEAD, so at HEAD it fails on import; its behaviour was shown failing
separately with a self-contained copy of the REPO_ROOT `meta.path` and image-link-warning cases
(3 of 3 fail at HEAD, pass after), and the decode and deny behaviour by the live probe (bad escapes
500, every bypass spelling 200 at HEAD).

## Review round (2026-11-19)

Four independent reviewers (quality, completeness, correctness, security). Verified and fixed:

| Finding | By | Fix | Proof |
|---|---|---|---|
| `requirementſ` (Unicode case folding) and NFD spellings read raw catalogue files past both guards | security (reproduced) | `namesFolder` by folder identity | live probe: `ſ` spellings and an NFD fixture name, 4xx |
| CSS read differently from the browser: `/*` inside a string, escaped `\2f*`, CRLF after an escape hid `url(http...)` (7 payloads fetched in Chromium) | security (reproduced) | `outsideCss` normalises newlines and tests with and without comments | 7 payloads in `sanitise.test.ts` |
| `<style>` cleaner quadratic: a 120 KB embedded font took 19 s (regression from the first B01 version) | correctness (reproduced) | linear cut at `;{}` | 400 KB font under 2 s |
| `<style>` cleaner rewrote the kept CSS (escapes, comments), breaking `content:"\""` and `.a\:b` | correctness, quality | the rest kept exactly as written | "keeps the rest of a <style> exactly as written" |
| Every attribute read as CSS: `aria-label="Upload image(s)"` dropped | correctness | text attributes skipped | "keeps text attributes" |
| Alt+click on a record link no longer opened the record | completeness, correctness | Alt not a modifier for record links | e2e clicks with Alt on drawing links; record behaviour by code (as at HEAD) |
| `anchorFromEvent` walked past the shadow root | correctness | stops at the shadow root | by code |
| Links inside `<use>` copies (not activated in Chromium; untested elsewhere) | security (plausible) | `#/` hrefs dropped; clicks through a `<use>` prevented | "drops a link shaped like a board route" |
| Vite's own routes (`/__open-in-editor`) open to another site's page | security | refusal on every route | live probe: three Vite routes 403 cross-site |
| `GET /api/artifacts/__proto__/history` 500 | completeness, correctness | `Object.hasOwn` | rules test, 404 |
| `.` accepted as an ID | correctness, security | refused | rules test |
| Check called `assets/../x` a symbolic link | correctness | `linkOut` only below its base as written | rules test |
| XHTML-namespace root accepted | quality, security | root must be SVG | sanitiser test |
| Windows `/@fs/C:/` missed by the guard | correctness | drive form handled | by code (Vite's deny still covered it) |
| Live probe could test another server; fixture in `test-results/` (cleared by Playwright); tight timeouts | correctness, quality | ready only on our own child's log line; `.origin-fixture/` (git-ignored); 20 s per test; `afterAll` awaits exit | |
| Missing proofs: REPO_ROOT served and an outside file; record link new tab; artifact ID link; Vite defaults copy | completeness, quality | added | rules and e2e tests |
| Real catalogue loaded to list IDs (6 s); test name over-claimed "once per file"; `getByText('doctype')` could never match | quality | file names; renamed with header checks; asserts no `@vite/client` text | |
| Comments: `cleanStyle`, `Warn`, `FILE_ROUTES`; `under()` reused in `artifactPath`, `serveAsset`, `serveHistoryBlob`; `linkOut?: string`; `linkOutOf` alias | quality | done | |

Not taken, with reason: duplicated `IN_TREE` path (N2: two lines, kept local to the plugin); moving
`spotOf` to `svgLinks.ts` (N7: B10's territory decides); passing decoded paths to handlers instead of
URLs (S3: kept URL signatures so existing tests keep their meaning; comment added). Recorded for
later in PROGRESS: history-blob `?src=` serving any blob by full sha (B08), `catalogueDiff.ts:135`
mixed real and given paths (B09), a base folder that is itself an escaping link is not warned
(B03), a top-level visit from another site can still open `/__open-in-editor` (B15).

## Recovery

Configuration and server code only; no catalogue file changes. Reverting the phase commit restores
the board. If the dev page ever goes blank, check the plugin's deny globs first
(`resolveConfig(...).server.fs.deny`) and the 404 guard (`namesFolder`).

## Handoff

See the B01 entry in `docs/board-fixes/PROGRESS.md`.
