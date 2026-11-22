# Closing review: systemic regression lens

Reviewer: independent, read-only. Range `d4341735..HEAD` (HEAD `d5499c70`). Searched `server/`, `shared/`,
`src/`, `scripts/`, `agent/` for paths that bypass the root fix of each systemic issue, plus origin security.
Targeted reading only; no suites run, no servers started. Paths are under `requirements-board/`.

## Verdicts

| Issue | One mechanism used by every consumer? | Notes |
|---|---|---|
| 1 Writes | Yes, with config and layout as documented exceptions | Every client record save goes through `api.patchItem/patchQuestion/patchArtifact/batchItems` (`src/store.ts:280-303,374`); the server refuses a whole record (`server/catalogueApi.ts:403 requirePatch`) and every record route runs `staleness`/`checkBase`. Config needs per-section `bases` (`catalogueApi.ts:826-832`), lane writes need `lanesRev` (`:938-941`, `:983`). Scripts write through `writeItem` or in-place paths. Config and layout are re-serialised as whole JSON files (by design: JSON, not YAML), still base-checked. No bypass found. |
| 2 Status | Mostly. The board (server, client, scripts) uses one registry; the build-plan tools do not | Board: `parseConfig` damaged/degraded state, `shared/check.ts:86-91`, `src/store.ts:943`, config PUT judges the disk copy (`catalogueApi.ts:846-880`), `normaliseStatus` on the history and diff paths (`catalogueApi.ts:602`, `catalogueDiff.ts:520,622`), journal rewritten by the recode script. Bypasses: plan tools (SY-1) and an unreadable recodes file (SY-4). |
| 3 Git | Yes for history readers | All history reads go through `server/gitCore.ts` (`PRE`, `gitEnv()` with `GIT_OPTIONAL_LOCKS=0`) with `-z --first-parent --diff-merges=first-parent` (`gitHistory.ts:91`, `gitRenames.ts:43`, `catalogueDiff.ts:371`). Caches are `Lru`-bounded; `shared()` holds in-flight promises only; the two plain `Map`s (`catalogueDiff.ts:60`, `:223`) clear at a size cap. Stragglers are non-history plumbing calls (SY-6). |
| 4 One rule | Yes inside `shared/`; small second copies remain | Slugs, code masking, NFC, spot parsing, note cites and mermaid ids each have one home (`shared/artifacts.ts`, `markdownCode.ts`, `sources.ts`); `src/artifacts/MarkdownReader.tsx:80-89` takes slugs from source headings; agent tools import `shared/sources.ts` (`agent/skills/consistency-review/scripts/board-kit.mjs`). Residual copies: SY-3, SY-5, and `scope.mjs` (SY-1). |
| 5 Bad data | Mostly | Tree walks have visited sets (`store.ts:789,840,855`, `shared/remove.ts:23`, `OutlineView.tsx:57`, `board/graph.ts:41`, `itemSearch.ts:78`, `scripts/linkProposals.ts:63`) except `scripts/capture.ts:557` (SY-7). Misses answer 404 on every file route and under `/api/` (`catalogueApi.ts:1022`, `cataloguePlugin.ts:222-246`). Error boundaries wrap each view and sheet but not the masthead (SY-2). |
| Origin security | Yes | `crossSiteRead` (`cataloguePlugin.ts:116`) runs first for every request, so the API, the three file routes and Vite's own serving are refused cross-site; `cors: false` (`vite.config.ts:20`); writes need `application/json` and a same-host Origin (`catalogueApi.ts:509-518`), so a preflight gets 415; `routeTarget` decodes, folds `\`, `//` and `..` before matching, prefixes match case-insensitively; `namesFolder` plus `fs.deny` close `/@fs/`, `/@id/` and root-relative spellings by file identity; `idFromPath` refuses separators and control characters; raw SVG gets the CSP and `nosniff` in both `sendFile` and `serveHistoryBlob`; only `ARTIFACT_MIME` types are served (no HTML). The sanitiser (`src/artifacts/sanitise.ts`) judges attributes by local name in any namespace, drops non-SVG elements, `on*`, animation elements and `url()` outside `#id`; Markdown uses react-markdown with no raw HTML and the default URL transform; mermaid is `securityLevel: 'strict'` and its SVG is either sanitised (`content.ts:47`) or shown through `<img>` (`VisualCompare.tsx:34`), where script cannot run. No bypass found. Symlinks, no write token and no page CSP are accepted (decision 13) and not reported. |

## Findings

### SY-1 (important) Build-plan tools read statuses from a hard-coded default list and treat an unreadable config as "no lists"
Evidence: `agent/skills/update-build-plan/tools/config.mjs:117-129` (`readBoardConfig` returns `{}` on any parse error; `STATUS_DEFAULTS` is a second copy of the built-in lists; `statusListsOf` checks only `Array.isArray`, so a list with bad entries is used as is and a non-array is replaced by the defaults); `scope.mjs:15-21` (`loadStatuses` swallows a bad config, then derives the `retired` and `answered` roles from the defaults); `scope.mjs:36-53` (own `loadRecodes` returning `[]` on any error, own `normaliseStatus`).
Scenario: `board.config.json` has a merge-conflict marker or a damaged `statuses` list. The board shows "damaged" and refuses saves (decision 16), but `update-build-plan` and `run-build-phase` silently take the built-in roles (Retired = 5, Answered = 4), so `outOfScopeRule` and `answeredCodes` (`build-index.mjs:146`) grade the wrong cards as retired or answered and drop or keep phases without a word. An unreadable `status-recodes.json` does the same: every stored code is read as today's.
It also cuts across decision 18 (one shared helper; agent tools import `shared/*.ts`): `normaliseStatus` and the defaults exist twice. Decisions 3 and 16 left the plan-tool half to B12 ("scope.mjs normaliseStatus as it is"), so the duplicate was chosen; the silent fallback was not.
Origin: pre-existing (blame `b2e579d01`, 2026-10-21). B12 touched `loadStatuses` (`23c122c3`) without adding a refuse-on-damaged path. Not a programme regression; a remaining bypass of root fix 2.

### SY-2 (minor) No page-level boundary: the masthead, problem pill and new-card button sit outside every `RegionBoundary`
Evidence: `src/App.tsx:112` (`<Masthead>`, which holds `ProblemPill`) and `:151` (`<NewCardButton />`) render outside the `RegionBoundary` at `:123-149`; `src/main.tsx:26-32` mounts `App` with no boundary; `RegionBoundary.tsx:100-104` is the only error boundary.
Scenario: a render error in `Masthead`/`ProblemPill` (both read the whole index, config and client problems) or in `NewCardButton` (`ancestorsOf` plus config roles, `NewCardButton.tsx:31`) unmounts the whole tree: a white screen, and the pill, where decision 17 says crashes are reported, is the part that failed. Root fix 5 said "around the board and the sheets", which is met; this is the remaining hole.
Origin: new surface from B03; nothing that worked before regressed.

### SY-3 (minor) Mermaid fence extraction is a second fence rule
Evidence: `shared/files.ts:456` (`/^(```|~~~)\s*mermaid[^\n]*\n([\s\S]*?)^\1\s*$/m`) against the board's one fence rule in `shared/markdownCode.ts:18-19` (up to three spaces of indent, three or more fence characters, a closing fence at least as long).
Scenario: a sidecar whose `## Source` block is fenced with four backticks (to hold a nested fence) or indented one to three spaces reads as an empty source: no diagram drawn, `mermaidNodeIds` is null, `node=` anchors go unchecked. The same text is a valid fenced block everywhere else.
Origin: pre-existing (`75d9bfaa7`, 2026-10-06); B04 did not fold it into `markdownCode.ts`.

### SY-4 (minor) An unreadable `status-recodes.json` reads as "no recodes", silently, and shrinks the high-water mark
Evidence: `server/catalogueFs.ts:188-194` (`readRecodes` catches everything and returns `[]`); `shared/statuses.ts:289-303` (`parseRecodes` returns `[]` on bad JSON or a non-array and reports no problem; `shared/config.ts:287` reports only history problems of what parsed). Only the script refuses (`scripts/recode-statuses.ts:187`).
Scenario: the file gets a merge marker. The board reports nothing; history and Diff stop normalising old codes (every recoded card shows a status change); and `highWater` (`config.ts:285`, built from `recodedCodes(recodes, kind)`) forgets the recoded numbers, so Settings (`catalogueApi.ts:869-875`) lets a new status take a code a recode moved away: the reuse root fix 2 exists to prevent.
Origin: pre-existing read path (`d4db2772a`); the high-water rule that depends on it is B02's, so B02 could have closed it. Fix shape: report an unparseable file as an issue and treat the lists as damaged while it is.

### SY-5 (nit) The Diff block splitter has its own fence test
Evidence: `shared/proseDiff.ts:22,47-54` (`/^\s*(```|~~~)/`, closes at the first line starting with the same three characters); `markdownCode.ts` is stricter (indent limit, a longer fence closes only with an equal or longer one).
Scenario: a four-backtick fence holding a three-backtick line is cut in two in the Diff review, and the first inner fence line ends the "code" block early; wording changes after it are marked as prose. Display only.
Origin: pre-existing (`7c93ceca0`); B09 owned `proseDiff.ts` and kept the local rule.

### SY-6 (nit) Two plain `git` spawns outside the shared reader
Evidence: `server/catalogueDiff.ts:187` (`spawn('git', ['cat-file', '--batch-check=...'])` with the inherited environment: no `PRE`, no `gitEnv()`); `server/artifactFiles.ts:34` (`rev-parse --show-toplevel`, inherited env; `server/laneEnv.ts:16` sets only `GIT_OPTIONAL_LOCKS`).
Scenario: board started with `GIT_DIR` exported (a hook or worktree tool): these calls read another repository than every other reader, so `artifactFiles.repoOf` and the type probe can disagree with the history readers. `cat-file` and `rev-parse` take no optional lock, so no lock contention.
Origin: pre-existing (`7c93ceca0`); B08 moved the readers to `gitCore.ts` but left these.

### SY-7 (nit) `capture.ts --only` recurses without a cycle guard
Evidence: `scripts/capture.ts:553-558` (`add` recurses over `c.parent === id` with no visited set; the check is meant to name cycles, per R-53).
Scenario: `npm run capture -- --only X` with X self-parented or in a parent cycle ends in `RangeError: Maximum call stack size exceeded` instead of a message. Script only.
Origin: pre-existing (`6c9da4e05`).

### SY-8 (nit) `/api` spelling variants fall through to Vite's page fallback
Evidence: `server/cataloguePlugin.ts:222` `const isApi = url.startsWith('/api/')` is case-sensitive and exact, unlike the file routes (lower-cased, prefix without the slash tolerated).
Scenario: `GET /API/catalogue` or `GET /api` returns the SPA `index.html` with 200, not a 404. No security effect (the API is reached only by the exact spelling and `crossSiteRead` runs first) and the client never sends those spellings; noted against root fix 5 ("answer misses with 404").
Origin: pre-existing in shape; B01 built the surrounding routing and left this prefix as is.

## Checked and clean
- Server record routes (item, question, artifact PUT; batch; delete; lanes; layout; config; voice) merge or 409 against the disk copy; creates use an exclusive claim.
- Client: no `fetch` for writes outside `src/api.ts:53`; `putLayout` positions carry no base by decision 20; lane-list writers send `lanesRev` (`store.ts:411,432,474`).
- Scripts that write catalogue files: `apply-links.ts:67` and `capture.ts:473` use in-place `writeItem`; `recode-statuses.ts` rewrites in place and refuses overlapping maps; `consistency-review/scripts/apply.mjs` is exact-string replacement confined by `guard.mjs`.
- Status code allocation uses only `nextStatusCode`/`highestCode` (`shared/statuses.ts:92`, `SettingsView.tsx:605`, config PUT `:869`); no `max + 1` copies.
- Git: `blobWasAt`'s `git log --all --find-object` (`cataloguePlugin.ts:416`) is an existence probe, not a history walk.
