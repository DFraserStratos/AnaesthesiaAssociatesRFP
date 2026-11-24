# B10 · Artifact viewers · implementation plan

Start: HEAD `40d59025` (board 1.21.0), branch `board-fixes`, clean tree, master has nothing new (no merge).
Prerequisites COMPLETE in PROGRESS: B01, B03, B04, B07 (and B06, B09 before it in the serial order).
Gate decisions recorded: D-01c (no page CSP, decision 13), B01-Q2 (reveal, decision 13), D-10 (decision 21).

## Re-verification at HEAD

All ten findings and the addition reproduce by reading; only line numbers moved.

| Finding | At HEAD (`requirements-board/`) |
|---|---|
| R-13 | `PdfReader.tsx:37-46` `loadPdf`: `getDocument({ url })`, no worker, no `destroy()` in `src/`. Callers `PdfReader.tsx:195`, `Thumb.tsx:57`, `VisualCompare.tsx:33` (page in the load key, `:81-82`). A failing `getPage` after the document opened leaks it; `useLoaded` (`content.ts:54-69`) drops late values unreleased. |
| R-163 | `content.ts:44` `URL.createObjectURL` per mermaid load; `VisualCompare.tsx:24`; no `revokeObjectURL` in `src/`. |
| R-98 | `ArtifactViewer.tsx:54-55`: passive `setFound(null)` after the viewers' layout effects report. |
| R-100 | `MarkdownReader.tsx:87` and `:133` (`key` = id, auto, focusKey; deps `[key, text]`); `PdfReader.tsx:388` and `:436`. |
| R-99 | `CanvasViewer.tsx:305` key joined with `|`, `:315-316` `prev[2]`, `:327` `prev[3]`. |
| R-103 | `VisualCompare.tsx:22-42`, `:84-89`; `ArtifactHistory.tsx:75` passes `{ source: '' }`. B01 made a missing blob a 404 (R-22). |
| Addition | `HistoryView.tsx:321-335` `Shot`: any `onError` reads "never committed". |
| R-104 | `Screenshots.tsx:66`, `:99` `assetUrl(img.src)` without a version; `assetUrl(src, version)` and the store's `assets` exist (B07). |
| R-105 | `Screenshots.tsx:74`, `:113` lightbox inside the gallery; `.dock` `z-index: 5` (`styles.css:698`), `.new-card` 8 (`:2253`), `.lightbox` 70 (`:2185`). |
| R-106 | `ArtifactsView.tsx:28-29` (kinds, components on show only), `:51`, `:59` (selects need two options), `:93-94` "Nothing matches."; `artifactIndex.ts:158-162` prunes statuses outside the shape check. |
| R-33 | `CardFind.tsx:42-53` MutationObserver; `:67-80` scroll effect on `[current, ranges]`; `active` an index. |

## Resolved questions

- **B10-Q2, yes** and **B10-Q3, both** (user; accepted decision 24).
- Inherited: D-01c no page CSP, so no CSP re-runs; B01-Q2 reveal (`revealRef` path in `CanvasViewer` kept);
  D-06 (`RegionBoundary` unmount runs effect cleanups, which is where release happens); D-10 (`assets`
  slice and `assetUrl(src, token)`); B03's `readJson`/`fields`; B04's slug and NFC helpers untouched.

## Technical choices

1. **`useLoaded(key, load, dispose?)`** (`content.ts`): optional third argument, called once for every value
   the hook received and no longer shows: on a key change, on unmount, and for a load that resolves after
   its key changed or its view went (StrictMode's first run included). DiffFile's two calls are unchanged.
2. **PDF documents** (`src/artifacts/pdfDocs.ts`, new): one shared `PDFWorker` per page (created on first
   use; a document given a `worker` never destroys it), documents counted by URL. `openPdf(url)` takes a
   reference (sharing a load in flight), `closePdf(pdf)` gives it back. A document with no holder waits in
   an idle list of **3** (so the compare's two versions and a page change, or a return to the same PDF,
   reuse it) and is destroyed (`loadingTask.destroy()`) when pushed out. A load that fails, at the document
   or at any page, is destroyed and forgotten. Bound: live documents = documents shown + at most 3;
   workers = 1. `loadPdf` stays as a thin wrapper for the reader. The reader holds its document for its
   life (dispose = `closePdf`); thumbnails and compare pictures take one, draw, and give it back.
   The `texts` and `thumbs` WeakMaps key by `LoadedPdf`, which the cache drops on destroy.
   Test hooks: `pdfDocStats()` (live, idle, destroyed) for Vitest; `window.__BOARD_PDF__` in development
   for the e2e count.
3. **Object URLs** (`src/artifacts/objectUrls.ts`, new): `ownUrl(blob)` makes and counts one; `dropUrl(url)`
   revokes only a URL it made (file and data URLs untouched). `loadCanvas` (mermaid) and the compare's
   mermaid pictures use it; `CanvasBody`, `MermaidPicture` and `Pictures` pass `dispose`. Bound: one per
   drawn mermaid image on screen, no cache. Hook: `objectUrlCount()`; `window.__BOARD_URLS__` in development.
4. **Found flag**: `ArtifactViewer` keys the found state by the request it describes (spot, file version,
   the region's content) and reads null for any other key: no reset effect, nothing for the parent to wipe.
5. **Region refresh**: Markdown and PDF effects key on the region's content (JSON of the region) besides the
   request; a separate *request* key (spot, auto, focusKey) decides placing, so a corrected region on the same
   request is boxed without scrolling when already placed, and placed as new when it was not.
6. **Placement** (`CanvasViewer`): the previous placement is an object `{ focus, region, image, follow }`
   compared field by field; `first` only for no camera or a new image.
7. **Picture failures** (`src/artifacts/pictureFailure.ts`, new): `{ kind: 'gone' | 'none' | 'drawn' | 'read',
   why? }` and one label function for compare and the timeline. Non-PDF blob: HEAD (404 gone, other status
   read, network read), then decode (`Image.decode`), failure drawn. PDF: pdf.js `ResponseException.status`
   404 gone, other status read, a parse error drawn. Mermaid: an empty source is none; a render error drawn.
   `Shot` probes with HEAD on `onError`.
8. **Screenshots**: `assetUrl(src, assets[src])` in gallery and lightbox; the lightbox goes through
   `createPortal(…, document.body)`.
9. **Filters**: the prefs coerce wraps `fields(...)` and drops unknown kinds and statuses there; `readPrefs`
   is just `readJson`. Picked kinds and areas are listed; selects show when there is a choice or a pick;
   "Nothing matches the filters." with Clear filters.
10. **Card find**: a scroll is asked for only by a query change (find opening with one, `resetKey`) or a step;
    a re-measure after a DOM change keeps the current match by its live `Range` (same start and text), else
    the first match after where it was.

## Bites and checks

1. `useLoaded` dispose + object URLs + PDF cache (REQ-01, 02). Vitest jsdom: `tests/artifactRelease.test.ts`.
2. Found flag and region refresh (REQ-03). e2e in `e2e/artifacts.spec.ts` (B10 block).
3. Placement ease (REQ-04). e2e: viewBox sampled through the ease; reduced motion jumps; fresh open placed.
4. Picture failures (REQ-05, REQ-11). Vitest jsdom `tests/artifactLabels.test.ts`; e2e history test kept.
5. Screenshots (REQ-06, 07). Vitest jsdom (versions), e2e (stacking via `elementFromPoint`, docked and modal).
6. Filters (REQ-08). Vitest (shape check, no second parse) + e2e (saved prefs, reload, clear).
7. Card find (REQ-09). Vitest jsdom `tests/cardFind.test.ts`.
8. Leak counts (REQ-01, 02) in Chromium on the fixture: `page.workers()` and the dev hooks, 10 rounds.

Each proof is run against the pre-B10 code first (a `git archive 40d59025` copy in the scratchpad for Vitest;
the pre-B10 territory files swapped in for e2e) and must fail there.

Final: `npm run verify:board`; `e2e/artifacts.spec.ts` (and every touched spec) on the fixture board, port 5182
(free check first). Board 1.22.0, CHANGELOG entry.

## Risks and recovery

- Early release: every acquire pairs with one release; the reader holds its document for its whole mount;
  the "still works after others released" e2e checks guard it.
- StrictMode: the dispose path covers the double effect; the e2e board runs in development (StrictMode).
- e2e timing: region-request tests wait for the viewBox to settle (`expect.poll`), never weakened.
- Saved prefs: same key and shape, so old and new boards read each other's.
- Recovery: client-only; revert the phase commit.

## Handoff

B15 reruns the new Vitest files and the B10 e2e block. Nothing else consumes a B10 output.
