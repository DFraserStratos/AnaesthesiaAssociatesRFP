# B03 · Load resilience: implementation plan

Decisions: accepted decision 17 (PROGRESS.md). Base: HEAD `277e8381` (board 1.14.0). Recovery and
handoff are at the end.

## Context

Phase B03 of the Board fixes programme (branch `board-fixes`, worktree
`/Users/d.fraser/Development/Stratos Dev/AnaesthesiaAssociatesRFP-board`; already on it, tree clean, master
has nothing board-fixes lacks). Prerequisites B01 and B02 are COMPLETE. Today one bad file (a
self-parented card, an unknown type, an unreadable SVG, a stray `._EP-01.md`, a BOM, a junk layout
entry, a bad browser-storage value) can white-screen the board, stop the dev server or make
`npm run check` stack-trace, and some cards and questions are counted but never listed. B03 fixes each
at the root, adds an error boundary as the safety net, and makes PDF facts survive a restart.

**Reverified at HEAD 277e8381 (board 1.14.0):** all 14 findings still present. Line drift only (e.g.
`artifactFiles.ts` read at :124, `historyJournal.ts` scan :92-119, DELETE route `catalogueApi.ts`
:384-426, layout PUT :631-663). Extra facts found: `deleteItemFile` is a bare `unlinkSync`; `readPdf`
has no timeout; `issuesFor` runs the check unguarded; `scripts/resolve-source.ts` also runs
`pdfFacts.ts` with one path; drafts in `useEditableRecord.ts` are module-level and survive an unmount;
`beforeunload` is in `App.tsx:62-69`; whole-string `toLowerCase` differs from per-character for final
sigma too (find counts).

## Decisions (user, this session) → PROGRESS "Accepted decisions" item 17, D-06 row Accepted

- **D-06: both.** A crashed region shows a recovery panel in place, and the problem pill gains a
  **This page** group naming it until it recovers ("All clear" waits). Extras, all chosen:
  auto-retry once per catalogue change; copyable details (message, collapsed stack, Copy);
  page-wide capture of uncaught handler and promise errors, listed in the pill and dismissable;
  a reset (repaired) browser preference is mentioned in the pill, dismissable.
- **B03-Q2: next save drops** damaged layout entries; until then an error issue on `layout` names
  them. Only layout bytes change.
- **B03-Q3: tolerate a BOM everywhere** (records, `board-layout.json`, `board.config.json`,
  `status-recodes.json`), and **keep the mark** when the board or its scripts rewrite such a file.
  (B02's config format is unchanged; the user is B02's owner.)
- Boundary depth: per view and per sheet; B10 and B11 reuse the same component for viewers/canvas.

## Approach per requirement

**REQ-01 boundary and issue surface** (new `src/components/RegionBoundary.tsx`, `src/clientProblems.ts`)
- `clientProblems.ts`: dependency-free zustand store: `crashes` (by region: label, message, stack,
  closable, retry nonce), `errors` (uncaught, deduped by message, last 5), `repairs` (storage keys reset).
  Actions: report, clear, dismiss, retry.
- `RegionBoundary` class (`getDerivedStateFromError` + `componentDidCatch`): `console.error` with region
  and component stack, adds a WeakSet mark on the error, reports the crash; panel: plain sentence,
  message, **Close card** (clears `?item`/`?question` via `useOpen`) when a card or question is open,
  **Try again**, **Go to board** for non-board views, `Details` (stack + Copy). Resets when its
  `resetKeys` change (route, open id, catalogue rev, retry nonce); a reset that fails again just shows
  the panel again (reset only on key change, so no loop). Unmount clears its crash entry.
- Mounts: each `<Route>` element in `App.tsx` (keyed by pathname), `ItemModal` and `QuestionModal` in
  `App.tsx`, the docked `ItemModal` in `BoardView.tsx:446`. Masthead stays outside every boundary.
- `main.tsx`: `window` `error` / `unhandledrejection` listeners report to `errors`, deferred one tick
  and skipped when the error carries the boundary's mark (React dev re-dispatches caught errors);
  ignore `ResizeObserver loop` noise.
- `ProblemPill.tsx`: groups Connection, Card moves, **This page** (crashes with Try again / Close card,
  uncaught errors with Dismiss), **Saved preferences** (repairs, Dismiss), Checks. Notes still never
  problems; single-problem labels "Part of the page failed", "Page error", "Saved preferences reset".
- Drafts: untouched by unmount (module map); `beforeunload` still sees them. Proved by e2e.
- Test hook: a dev-only `CrashProbe` inside each boundary throws when
  `window.__BOARD_CRASH_TEST__` names that region (set by Playwright `addInitScript`).

**REQ-02 cycles** — `store.ts descendantsOf` with `seen = new Set([id])`; `shared/remove.ts` seeds
the visited set with the root (and builds `kids` linearly); `deleteItemFile` uses `rmSync(force)`;
`autoLayout.ts` places every card not placed by the epic walk into the orphan stack once (placed set,
cycle-safe `stack`); `shared/check.ts` names each cycle: one error per member, `parent cycle: A, B`
(self-parent a cycle of one); acyclic catalogues gain nothing.

**REQ-03 unknown types** — `shared/types.ts` `typeLabel(t)` (label or stored text) and `typeRank(t)`
(known index, else after them); `canParent` guards both lookups. Used at `ItemModal.tsx:223`,
`CardNode.tsx:21`, `bits.tsx:82/86`, `itemSearch.ts:91`, `BoardMinimap.tsx:187/205` (colour fallback),
`shared/csv.ts:55`, `DiffFields.tsx:76`.

**REQ-04 load isolation** — `artifactInfo`: everything after the stat in one try; a read error →
`file X could not be read (CODE)`, a facts error → `file X: its facts could not be read (msg)`;
neither cached. `withMeta` per-artifact try. `issuesFor`: check in a try → one error issue
`the check could not finish (msg)`. `listMd`: skip names starting with `.`. `decodeEntities`: decode
only integers 0 to 0x10FFFF. `historyJournal.screenshots`: each entry's stat inside `quietly`
(skipped), each image's stat/read in its own try, unparseable or wrong-shape `shots.json` read as
none and rewritten.

**REQ-05 parsing** — new `shared/bom.ts` (`stripBom`, `hasBom`); `splitFrontmatter`, `parseConfig`,
`parseRecodes`, `readLayout`, the config PUT read and `recode-statuses.ts` strict reader strip it;
a server helper `withBomOf(path, text)` keeps the mark on `writeItem`/`writeQuestion`/`writeArtifact`,
`writeLayout`, the config PUT and the recode script's writes. `readLayout` returns
`{ layout, error?, damaged?: string[] }`: top level not an object → error "does not hold an object"
(blocks writes, as unparseable does); `positions` not an object, or entries without finite `x`/`y`,
dropped and named in an error issue on `layout` ("…ignored; the next card move drops them"); layout
PUT and delete clean-up write only valid positions and refresh the issue; `serialiseLayout` unchanged.

**REQ-06 browser parsing** — new `src/storage.ts`: `readJson(key, coerce)` (parse, then a per-store
coerce that keeps well-formed parts and drops wrong ones; reports a repair once per key and warns in
the console) and `writeJson`; helpers `isPlainObject`, field pickers. Used by `viewedStore.ts`
(`null`/array/number → empty; non-object comparison dropped; `writeViewed` never throws on it), view
prefs in `store.ts` (types only; never prunes status codes, B02's R-46 rule untouched),
`artifactIndex.ts` prefs, `BoardView.tsx` viewport, `OutlineView.tsx` collapse set. `find.ts`: one
`at` entry per lowered code unit, and `normText` lowercases per character so string and DOM counts agree.

**REQ-07 listing** — `questionWalk.ts`: `questionGroups(config, questions, filters)` = configured
groups then unconfigured statuses present (as stored, always shown); `questionWalk` and
`QuestionsView` use it; heading "<status> · not a configured status". `OutlineView.tsx`: after the epic
walk, a final "Not under an epic" group: roots are unreached cards whose parent is missing, absent
(non-epic) or of the wrong place, then remaining cycle members (lowest ID first), each walked with a
seen set; each root row tags its reason (parent missing, no parent, parent cycle); same rows,
search, retired filter, collapse and roving focus as the tree.

**REQ-08 PDF facts** — new `server/pdfFactsCache.ts`: folder `PDF_FACTS_DIR` or
`requirements-board/.pdf-facts/` (git-ignored; vitest sets a temp dir); entry
`<sha256 of content>.json` holding `{ extractor, facts }`, extractor = sha256 of `pdfFacts.ts`
source + pdfjs-dist version + schema number; written temp-then-rename (pid + counter names), read
with a shape check (damaged → ignored and rebuilt). `pdfFacts.ts --batch a.pdf b.pdf` prints results
per path (single-path output unchanged for `resolve-source.ts`); timeout scales with file count. An
exec failure or timeout is never stored; a pdf.js error per file is. `withMeta` primes all PDF misses
in one batch before `artifactInfo` reads the cache.

## Execution bites

0. Record decision 17 and the D-06 row in PROGRESS (status IN PROGRESS on the plan page), save
   `phases/B03-load-resilience/IMPLEMENTATION.md`. Baseline: `npm run check` output and cold/warm
   timings; `git archive HEAD` of the board into the scratchpad for before-proofs (B02's method).
1. Server: R-48, R-47 (+ check backstop), R-65, R-66 + JSON BOM, R-49, R-50, R-53, check cycles.
2. R-160 cache and batch extractor.
3. Client data: R-10 store + autoLayout, R-11 helpers, R-52 find, R-51 storage rule.
4. Lists: R-121, R-122.
5. Boundary, client problems store, pill groups, window capture, CrashProbe.
6. e2e: new `e2e/bad-data.spec.ts` on a second fixture project (port 5183, temp dir
   `requirements-board-e2e-bad`, built by `fixtureCatalogue.ts --bad`: self-parent, two-card cycle,
   unknown type, parent typo, unconfigured question status, junk layout entry, BOM record); plus
   boundary probes in a view, the docked sheet and a modal sheet.
7. Docs (Doc facts), version 1.15.0 + lock, CHANGELOG.
8. `npm run verify:board`; touched e2e on 5182/5183; real check compared; light review
   (two Sonnet reviewers in parallel: completeness+correctness, quality+robustness); fix, rerun.
9. PROGRESS entry and status row, `index.html` PHASE STATUS (COMPLETE), commit by path on
   `board-fixes`. Never push.

## Tests (each run against the pre-B03 archive first: must fail there)

Vitest: `store.test.ts` (descendantsOf self/2-cycle), `remove.test.ts` (planDelete once),
`api.test.ts` (DELETE over a cycle; layout PUT/delete over junk positions, no 500, junk dropped, issue
cleared; BOM record round-trip keeps mark; API start with dangling asset link), `catalogue.test.ts`
(unreadable SVG then readable in same process; dotfiles; BOM item/question/sidecar/JSON; check names
cycles; check backstop), `artifacts.test.ts` (entities), `historyJournal.test.ts` (dangling link, one
unreadable image, torn shots.json), `move.test.ts`, `mappedLayout.test.ts`, `autoLayout.test.ts`,
`csv`/`itemSearch` ordering, `questionWalk.test.ts`, new `find.test.ts` (jsdom, İ and final sigma),
`viewedStore.test.ts` + new `storage.test.ts` (each store, wrong top-level and wrong field),
new `regionBoundary.test.ts` (jsdom: panel, no loop, reset on key, crash reported and cleared),
new `pdfFactsCache.test.ts` (second process no extraction via a counting stub, changed PDF only
re-extracted, damaged entry rebuilt, concurrent writers, exec failure not stored, facts equal for
every catalogue PDF), `catalogueDiff` git-version BOM parse.
e2e: `bad-data.spec.ts` (manual-check items automated: board both modes, Outline, Questions with the
bad cards open and on reload, boundary panels, masthead live, draft survives, close then reload clean).

## Verification

- `npm run verify:board` (repo root) green; `npm run test:e2e` fixture projects on 5182 and 5183.
- `npm run check` on the real catalogue: output identical to baseline; timings cold vs second run.
- Manual on the lane port 5480 with a scratch catalogue copy: add a self-parented card and an
  unknown-type card; board, Outline and sheet do not white-screen; record before (pre-B03) and after.

## Touch-rights files (named in the entry)

`App.tsx`, `main.tsx`, `BoardView.tsx`, `ItemModal.tsx`, `CardNode.tsx`, `bits.tsx`, `itemSearch.ts`,
`BoardMinimap.tsx`, `DiffFields.tsx`, `shared/csv.ts`, `shared/config.ts`, `shared/statuses.ts`,
`catalogueApi.ts`, `scripts/recode-statuses.ts`, `server/pdfFacts.ts`, `playwright.config.ts`,
`e2e/fixtureCatalogue.ts`, `vite.config.ts` (test env), `.gitignore`, `docs/board-fixes/index.html`.

## Doc lines expected

`DESIGN.md` masthead paragraph (new groups); `README.md` (server/load behaviour, `.pdf-facts/`,
`PDF_FACTS_DIR`, BOM, dotfiles); `SCHEMA.md` check rules (parent cycle) if it lists parent rules;
About page (Outline final group, Outstanding unconfigured group) if described; CHANGELOG 1.15.0.

## Recovery

- Every bite is independent and revertible by file. The PDF facts store (`.pdf-facts/` or
  `PDF_FACTS_DIR`) can be deleted at any time; the only effect is a slower next load.
- Before-proofs run against an archive of `277e8381`'s `requirements-board/` unpacked in the session
  scratchpad (its `node_modules` linked), with the new tests copied in.
- If the window-error capture double-reports errors React already caught (dev re-dispatch), the
  boundary's WeakSet mark plus a one-tick deferral filters them; if that proves unreliable, record
  only errors with no boundary mark after the tick and note it here.
- No catalogue data migration: nothing under `requirements/` is rewritten. The real `npm run check`
  output is compared byte for byte with the baseline.

## Handoff (recorded at the end in PROGRESS.md)

Issue-surface contract (D-06 as built), `readLayout` shape, the storage reading rule
(`src/storage.ts`), the stored-facts location and key, the boundary component and its mount points.
