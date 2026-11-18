# Phase B10: Artifact viewers release what they open, show what is current, and say what went wrong

**Status:** PLANNED

**Requirements:** ten findings from [FINDINGS.md](../../FINDINGS.md), "Findings in detail":
R-13 (Medium, pdf.js documents and workers never destroyed), R-33 (Medium, card find re-scrolls on
every DOM change), R-98 (Low, "highlight could not be found" flag wiped), R-99 (Low, region
requests snap instead of easing), R-100 (Low, Markdown and PDF readers keep a stale red box),
R-103 (Low, history compare calls every failure "never committed"), R-104 (Low, screenshot URLs
carry no version), R-105 (Low, lightbox sits under the New card button and divider), R-106 (Low,
saved Kind or Area filter hides everything with no way back), R-163 (Low, mermaid blob URLs never
revoked). Systemic context: FINDINGS "Other themes", Performance (R-13, R-163) and Sheet, board
and diff UI state (R-33, R-98 to R-106).
**Plus one addition found while authoring B09:** the screenshot `Shot` in the card timeline
(`src/components/HistoryView.tsx`) labels every load failure "never committed", the same flaw as
R-103. PLAN.md (B10 row and territory), PROGRESS accepted decision 5 and "Discovered for later"
assign it to B10. It has no R-id and is closed as B10-REQ-11.

**Owns:** the observable behaviour and the proof for those ten findings and the addition, within
B10's territory (PLAN.md, "Territory and exclusions"):
- `src/artifacts/*` except `sanitise.ts` and the B04 helper adoption;
- `src/components/Screenshots.tsx`, `src/components/CardFind.tsx` and `src/views/ArtifactsView.tsx`;
- filter prefs in `src/artifactIndex.ts`;
- its own `.lightbox` styles;
- the screenshot failure label in `HistoryView`.

In shared files (PLAN "Shared files and sequencing") B10 owns:
- the region refresh in `MarkdownReader.tsx` (after B04);
- the placement logic in `CanvasViewer.tsx` (after B01);
- its own changes in `ArtifactPanel.tsx` (after B06);
- the `Shot` label in `HistoryView.tsx` (after B09);
- its own changes in `find.ts` (after B03).

**Excludes (owner):**
- SVG sanitising, `src/artifacts/sanitise.ts` (B01, R-03) and link interception in `CanvasViewer`,
  including fragment links (B01, R-102).
- The 404 for a missing artifact file or history blob, `server/cataloguePlugin.ts` (B01, R-22).
  B10's truthful labels depend on it.
- Heading slugs from the source in `MarkdownReader` (B04, R-28) and NFC on both sides of a quote
  match in `regionsDom.ts` (B04, R-101).
- The U+0130 crash in `find.ts` (B03, R-52) and PDF facts extraction on the server (B03, R-160).
- The error boundary and the bad-data issue surface (B03, D-06).
- The `ArtifactPage` draft and save flows and the artifact details form in `ArtifactPanel` (B06).
  Note: `ArtifactPage.tsx:53` builds the `focusKey` that R-99 trips on. B10 fixes R-99 inside the
  viewer (see B10-REQ-04).
- The asset version and change signal, D-10 (B07). B10 consumes it for R-104.
- The rest of `HistoryView.tsx` (B09) and `src/diff/*`, which also uses `useLoaded` from
  `content.ts` (B09). See "Dependencies".
- Asset and screenshot history hashing in `server/historyJournal.ts` and `server/gitHistory.ts`
  (B08 for hash width and clean form, B03 for load isolation).

**Depends on:** B01, B03, B04, B07 (D-10), per PLAN.md. Gate (PROGRESS phase status): D-01c,
B01-Q2 and D-10 must be recorded before B10 builds. Serial order: B01, B02, B03, B04, B08, B05, B07,
B06, B09, **B10**, B11, B14, B15. B06 and B09 therefore finish before B10 starts.
- **B01:**
  - R-22 makes a missing file or blob a real 404. B10-REQ-05 and B10-REQ-11 need it to tell
    "not kept" from other failures.
  - R-102 changes the click handling in `CanvasViewer`, which B10-REQ-04 must not undo.
  - D-01 (origin security model) decides which `/requirements/` URL forms are served. The asset
    version token (B10-REQ-06) must work within that model.
  - **D-01c** (page CSP): any page CSP must admit B10's pdf.js workers, `blob:` image URLs and
    `data:` thumbnails. B10's proofs are re-run under it.
  - **B01-Q2** (fragment links in drawings, inert or reveal): if the answer is "reveal", B10-REQ-04's
    placement rework keeps the reveal path working.
- **B03:**
  - the error boundary and D-06 (how bad data and caught crashes are reported). B10's labels and
    release logic sit inside it.
  - B03's shared browser-storage reading rule (B03-REQ-06.2). The artifact preferences in
    `src/artifactIndex.ts` are read through it. B10-REQ-08 builds on that rule and adds no second
    reader.
- **B04:** the shared slug and NFC helpers adopted in `MarkdownReader` and `regionsDom`. B10's
  region refresh (B10-REQ-03) works on top of them.
- **B07 (D-10):** the asset version and change signal. B10-REQ-06 consumes it.
- **Earlier in the serial order:**
  - B06 finishes `ArtifactPanel` (details form) and `ArtifactPage`;
  - B09 finishes `HistoryView.tsx` and may reshape `src/diff/DiffFile.tsx`, which calls `useLoaded`.

  B10 inherits those shapes.

**Unblocks:** B15 (closing audit), which re-checks these dispositions. No other phase consumes a B10
output.

**Binding constraints:** PLAN.md "Binding constraints (every phase)" and PROGRESS.md conventions 1
to 14. In particular:
- Convention 11 (touch rights): B10 delivers each fix whole, editing other phases' files minimally
  where needed and naming them in its entry.
- Convention 12 (doc lines): B10 updates the doc lines that describe behaviour it changes.
- Convention 13 (proof fails first): every regression proof fails before the fix and passes after.
- Existing stack only. `pdfjs-dist` 5.7.x stays the PDF engine. Any new dependency needs a
  recorded reason.
- Visual changes follow `requirements-board/DESIGN.md`: the artifact viewer sections (red highlight
  box, region ease, find, history compare), the light table, status as pills, names over IDs.
- `npm run verify:board` is green at the end. Touched Playwright specs (at least
  `e2e/artifacts.spec.ts`) pass on a free port, never 5173, 5174, 5180 or 5181.
- Board version bump and a `CHANGELOG.md` entry: minor, because users can see the change.
- Never stage mid-phase. Commit only this phase's files.

## Objective and outcomes

The artifact viewers are where a reader checks a requirement against its evidence. A long session
spent moving between PDFs, diagrams and history should cost no more memory than a short one. What
the viewer shows (red box, warning flag, screenshot, failure label) must describe the file as it
is now. When the board can't show something, it should say why, and the reader should always
have a way back.

When B10 is delivered:

1. **Viewers release what they open.** Every PDF document and its worker, and every object URL
   for a drawn mermaid diagram, is released once nothing shows it. That includes loads that
   finish after their viewer has gone, loads that fail partway, and viewers torn down by the error
   boundary. Live resources stay bounded however many artifacts the reader opens.
2. **The highlight is true to the spot and the file.** The red box and the "highlight could not be
   found" flag always describe the spot being asked for, as its region reads on disk right now.
3. **Region requests move the way DESIGN.md says.** Asking for another region in a drawing that is
   already open eases the view onto it. Opening a drawing places the view at once.
4. **History compare and the card timeline's screenshots say why a version is not shown.** They
   never call a committed but unreadable version "never committed".
5. **Screenshots show the current file** after re-capture, and the lightbox sits above everything
   on the page.
6. **The reader can always undo a filter.** No saved Artifacts-tab filter can hide everything
   without a visible control to clear it.
7. **Card find scrolls only when the reader asks it to.** Changes inside the card do not yank the
   reader back to the match or quietly change which match is current.

## Sources and current-state evidence

Every finding below was checked by reading the code at HEAD `d4341735` (board 1.12.3), the review
baseline, with no uncommitted changes in the territory. **All ten, and the addition, still
reproduce by code reading. None is "not reproducible at HEAD".** Line numbers are as of that commit. B01, B03 and B04
run first and will move some of them, so the execution agent re-verifies line numbers at its own
start.

| Finding | Verified at HEAD (`requirements-board/`) | Notes |
|---|---|---|
| R-13 | `src/artifacts/PdfReader.tsx:24-46`: `loadPdfJs` sets only `GlobalWorkerOptions.workerSrc`. `loadPdf` calls `getDocument({ url })` with no shared worker. No `destroy()` anywhere in `src/`. Callers: `PdfReader.tsx:195`, `Thumb.tsx:57-67` (PdfThumb), `VisualCompare.tsx:33` (once per version *and per page change*, since the page number is part of the load key at `:81-82`). | Refines the finding: the `texts` and `thumbs` WeakMaps (`PdfReader.tsx:49`, `:621`) do hit *within* one mounted reader. They miss across mounts, because every mount makes a new `LoadedPdf`. `loadPdf` also leaks the document if a `getPage` call throws after `getDocument` succeeds, and `useLoaded` (`content.ts:54-69`) drops a value that resolves after its key changed or its viewer unmounted, without releasing it. |
| R-33 | `src/components/CardFind.tsx:42-53`: a MutationObserver re-runs `findRanges` on any mutation. `:67-80`: the scroll effect depends on `[current, ranges]`, so every new ranges array scrolls. `active` is an index (`:22`, `:56`). Used by `ItemModal.tsx:173`. | As described. |
| R-98 | `src/artifacts/ArtifactViewer.tsx:54-55`: the parent's passive `useEffect(() => setFound(null), [spot, rec.rev, rec.meta.fileRev])` runs after the viewers' layout effects report `false`: `CanvasViewer.tsx:282`, `MarkdownReader.tsx:117`, `PdfReader.tsx:393-436`. | As described. |
| R-99 | `src/artifacts/CanvasViewer.tsx:305` joins the placement key with `\|`. `:315-316` splits it and reads `prev[2]` as the image URL. `ArtifactPage.tsx:53` passes `focusKey = "<spot>\|<asks>"`, so `first` is always true and every request jumps. `:327` reads `prev[3]` as the previous follow key, which is misread the same way when `focusKey` contains `\|`. | Today the step-follow path passes `focusKey="steps"` (`ArtifactViewer.tsx:105`), so the follow misread does not bite yet. The fix must keep it correct. |
| R-100 | `src/artifacts/MarkdownReader.tsx:87` and `:133`: key `region.id\|auto\|focusKey`, effect deps `[key, text]`. The ResizeObserver and `fonts.ready` callbacks (`:126-127`) close over the old `spot`. `PdfReader.tsx:388`: same key. `:436`: deps `[key, page, rendered, scale]`. `CanvasViewer.tsx:273-289` depends on the `region` object, so a drawing re-measures. Only the document readers are stale. | Combined with R-98: a fixed quote clears the flag (rev reset) but draws no box. |
| R-103 | `src/artifacts/VisualCompare.tsx:22-42` (`pictureOf`), `:84-89`: every load error shows "Not kept: this version was never committed". `ArtifactHistory.tsx:75`: a mermaid source added from nothing passes `{ source: '' }` as "before", which fails to draw and reads "never committed". | Today a missing blob is a 200 `index.html` (R-22), so `res.ok` (`:30`) passes for non-PDFs. A PDF fails as "Invalid PDF structure", which is also labelled "never committed". |
| R-104 | `src/components/Screenshots.tsx:66`, `:99` use `assetUrl(img.src)`. `src/api.ts:91` builds an unversioned URL. `scripts/capture.ts:619-629` overwrites changed files in place. The server's watcher sees the write (`server/cataloguePlugin.ts:105-117`), and `syncFromDisk` fingerprints screenshots in the journal (`server/catalogueApi.ts:607`). But no item rev changes and no event reaches the client. | The version and change signal come from B07 (D-10). B10 consumes them. |
| Addition (HistoryView `Shot`) | `src/components/HistoryView.tsx:295-310`: `Shot` sets `gone` on any `<img>` `onError` and shows "Not kept: this version was never committed". A 404, a decode failure and a server error all read the same. Today a missing blob is a 200 `index.html` (R-22), which fails to decode and also lands here. | Found while authoring B09 (PROGRESS "Discovered for later"). It has no R-id. |
| R-105 | `Screenshots.tsx:74`, `:80-111`: the lightbox renders inside the gallery. `styles.css:622-627`: `.dock` has `z-index: 5`, making a stacking context. `.dock-resizer` is `z-index: 6` (`:648`), `.new-card` is `z-index: 8` (`:2167`), `.lightbox` is `z-index: 70` (`:2096-2099`), but trapped inside `.dock`. | As described (stacking analysis; no browser run yet). |
| R-106 | `src/views/ArtifactsView.tsx:28-29`: `kindsPresent` and `componentsPresent` list only values on show. Statuses keep picked values (`:31`). The Area select shows only when more than one area is present (`:59`). The Status select likewise (`:51`). Prefs persist in localStorage (`src/artifactIndex.ts:126-157`). `readPrefs` prunes unknown statuses only, not kinds or components. Empty state "Nothing matches." (`ArtifactsView.tsx:93-94`) offers no action. | A broader gap than the finding states: even with picked values included, a select with one option is hidden. An area later removed from `board.config.json` can never be listed. |
| R-163 | `src/artifacts/content.ts:41-44` creates an object URL for each mermaid load. `VisualCompare.tsx:23-25` creates one for each history picture. No `revokeObjectURL` in `src/`. Consumers: the canvas minimap (`CanvasContent.imageUrl`), `MermaidPicture` thumbnails on the light table (`Thumb.tsx:50-53`), history compare. | As described. |

Other evidence read: `requirements-board/DESIGN.md` (artifact viewer sections, lines about 285 to
352), `CHANGELOG.md` (1.12.3 head), `e2e/artifacts.spec.ts` (fixture catalogue on port 5182, with
an SVG, PNG, mermaid, Markdown and two-page PDF, and the history compare test at `:750-777`), the
B01, B04 and B03 findings named above, and refuted finding A-7 (PdfPage render cancellation is not
a defect; do not re-litigate).

**Assumptions:**
- "Live resources" means pdf.js workers and documents and object URLs the board created. Data URLs
  and ordinary cached image responses are left to the browser.
- Jsdom is available for Vitest (`package.json`), but the Vitest default environment is `node`
  (`vite.config.ts:26`). Worker and stacking behaviour can only be observed in a real browser.

## Detailed requirements

### B10-REQ-01 · PDF documents and their workers are released (R-13)

1. Each pdf.js document the board opens, whether for the PDF reader, a light-table thumbnail or
   a history compare picture, is released (destroyed, ending its worker) once no mounted view
   needs it.
2. Release also happens when:
   - a load finishes after its view has unmounted or moved to another URL or version;
   - a load fails partway (the document opened, then reading a page failed);
   - the error boundary (B03) unmounts a viewer.
3. A document still used by a mounted view is never released under it. The reader's pages, text
   layer, find counts and page thumbnails keep working. No "worker destroyed" or "transport
   destroyed" error reaches the reader.
4. The number of live pdf.js workers and documents is bounded by a small constant that does not
   grow with the number of PDF views, thumbnails, compare pages or Artifacts-tab visits in a
   session. Whether recently used documents are cached for quick return, and the size of any
   cache, is an implementation choice recorded in IMPLEMENTATION.md. Whatever the choice, it is
   bounded and documents leaving the cache are released.
5. Changing the page in a PDF history compare does not open the version's document again for
   each page.
6. Per-document caches (page texts for find, page thumbnails) go when their document is released.
   They never keep a released document reachable.
7. Whatever page CSP D-01c adopts, PDFs still open, draw and show thumbnails under it.

Candidate (FINDINGS): memoise `loadPdf` by URL in a small LRU and destroy evicted documents,
destroy after one-shot renders, optionally share one `PDFWorker`. A release step in the
`useLoaded` lifecycle would also serve B10-REQ-02.

### B10-REQ-02 · Object URLs for drawn diagrams are released (R-163)

1. Each object URL the board creates for a drawn mermaid diagram is revoked once nothing shows
   it. That covers the canvas minimap image, light-table thumbnails and history compare pictures.
   It includes a load that resolves after its view has gone or its source has changed.
2. Editing a mermaid source many times, or opening many mermaid artifacts in turn, does not grow
   the number of outstanding object URLs. Outstanding URLs match what is currently on screen,
   plus any bounded cache recorded in IMPLEMENTATION.md.
3. No image the reader is looking at goes blank or broken because its URL was revoked. That
   includes the minimap, a thumbnail scrolled back into view and the swipe compare.
4. URLs the board did not create as object URLs (file URLs, data URLs) are not affected.
5. Whatever page CSP D-01c adopts, drawn mermaid images (`blob:`) and PDF thumbnails (`data:`)
   still show under it.

Candidate (FINDINGS): a dispose hook in `useLoaded`, or one cached URL per (seed, source).

### B10-REQ-03 · The red box and the "not found" flag describe the current spot and region (R-98, R-100)

1. In an artifact that is already open, the reader may ask for a new spot through the panel, a
   link, the URL or the step bar. If that spot names a region, page, heading or line range the
   artifact has but the viewer cannot locate, "The highlight could not be found in the …" is shown.
   This applies in drawings, Markdown and PDFs alike. If the spot is found, no flag shows. While the
   viewer is still loading or measuring, no stale flag from the previous spot shows.
2. Suppose a region's content changes on disk while its viewer is open, keeping its ID: its
   anchors (`quote=`, `heading=`, `text=` and so on), `box`, `page` or `pad` change. Then the
   Markdown and PDF readers locate it again from the new content:
   - the box is redrawn where the new content puts it;
   - a box left over from the old content is removed;
   - the flag reflects whether the new content was found.

   The drawing viewer already behaves this way and must keep doing so.
3. Later reflows (fonts loading, the frame resizing, PDF pages drawing at a new scale) re-measure
   the region as it is now, never an earlier version.
4. A refresh that corrects a region does not yank the reader's view if the region was already
   brought into view for the current request. If the request had not yet been placed (for example
   because it was not found before), the corrected region is brought into view as for a new
   request.
5. Preserved:
   - an unknown spot still says `<title> has no spot called "<spot>"`;
   - a step spot never shows the red box or the flag (e2e "a link to a step opens on it: no red
     box, no flag");
   - a whole-artifact view (no spot) never shows the flag;
   - the box's arrival animation still plays once per request.

Candidate (FINDINGS): key the found state by spot, or reset it during render. Add the region's
content to the effect keys and read the spot through a ref inside the observers.

### B10-REQ-04 · A region request in an open drawing eases, as DESIGN.md says (R-99)

1. With a drawing already shown, asking for a different region, or the same region again (a
   repeated request changes `focusKey`), eases the view onto it over the documented 420 ms
   (`EASE_MS`), and the box closes in. Reduced motion jumps.
2. The view is placed at once, with no ease, in three cases only: when the drawing first opens,
   when its image changes (a new file version or mermaid source), and when the viewer has no
   camera yet.
3. Placement decisions read the previous request's parts (focus, region, image, follow state) as
   separate values. No value that contains a separator, whether a `focusKey`, region ID or URL,
   can shift them. The followed-step logic (`step_view: follow`, DESIGN.md) keeps its present
   behaviour: it frames a step when its focus is out of view, it frames on arrival from the whole
   drawing, and Whole drawing fits again.
4. This is fixed within the viewer. It does not depend on how `ArtifactPage` formats `focusKey`
   (B06's file).
5. Preserved: a flight in progress is cancelled cleanly by a jump or refresh, and the B01 link
   interception added to the same component stays intact (non-record anchors never navigate).
   If B01-Q2 is answered "reveal", a fragment link in a drawing still brings its target into view
   after the placement rework. If it is answered "inert", it still does nothing.

Candidate (FINDINGS): store the previous placement as an object, or keep separate refs.

### B10-REQ-05 · History compare says truthfully why a version is not shown (R-103)

Each side of a picture compare (side by side or swipe) that cannot show an image shows one label
for its actual state:

| State | Label (wording may be refined to DESIGN.md voice; no en or em dashes needed) |
|---|---|
| Loading | "Loading" (as today) |
| No version on this side (`null`), or an empty mermaid source on the before side | "Not there yet" (before) |
| No version, or an empty mermaid source, on the after side | "Removed" (after) |
| The server reports the blob is not kept (404, available once B01's R-22 lands) | "Not kept: this version was never committed" |
| The version was read but could not be drawn (a mermaid parse error, a pdf.js parse error) | "Could not be drawn:" plus the reason |
| Any other read failure (a non-404 HTTP status, a network failure) | "Could not be read:" plus the status or reason |

1. "Never committed" is used only for a confirmed missing blob.
2. A committed but invalid source never reads as never committed.
3. The Source mode's existing "A version could not be read: <error>" stays as is. If B03's D-06
   sets a convention for client-side "could not show" messages, follow it.
4. Preserved: side by side, swipe and source modes; page selection for PDFs; old versions shown
   only as images, so nothing in an old SVG runs (`VisualCompare.tsx` header). The e2e history
   test still passes.

### B10-REQ-06 · Screenshots show the current file after re-capture (R-104)

1. When a screenshot file listed in an item's `images` changes on disk (for example after
   `npm run capture`), an open card's gallery and any open lightbox show the new picture without
   a page reload. The delay should be about the same as the board's other live updates.
2. A screenshot whose file has not changed keeps its cached image. No cache-busting on every
   render or every catalogue event.
3. The version token D-10 defines is accepted by the `/requirements/` asset route as B01 left it
   (D-01). It must not open a way past B01's guard or change which files are served.
4. Screenshots in item history, which are served by blob hash and so never change, are unaffected.
5. **This requirement consumes D-10, which B07 produces:** the asset change signal and the
   per-asset version token. B10 does not build a second signal. It uses B07's delivery and token
   in the gallery and lightbox URLs. REQ-06 cannot be built until D-10 is recorded in PROGRESS and
   B07's signal has shipped (B07 comes before B10 in the serial order).

### B10-REQ-07 · The lightbox sits above everything on the page (R-105)

1. A lightbox opened from a card's gallery covers the whole page and receives all pointer input
   while open. That applies whether the card is docked beside the board, a modal sheet, or on
   another page that shows the gallery. The New card button, the dock divider, the board and the
   sheet beneath cannot be clicked, dragged or hovered through it.
2. Preserved:
   - Esc closes the lightbox and not the sheet;
   - left and right step through all the item's screenshots, wrapping, and closing lands on the
     tab of the last screenshot seen;
   - a click on the backdrop closes it;
   - the board's arrow-key walk does not see those keys;
   - the count label (`<app> · n of N`).
3. Its look follows the existing `.lightbox` styling and DESIGN.md.

Candidate (FINDINGS): portal the lightbox to `document.body`.

### B10-REQ-08 · A saved Artifacts-tab filter can always be seen and cleared (R-106)

1. While any Kind, Status or Area filter is in effect, the toolbar shows a control for each picked
   value, so the reader can turn it off. This holds even when no artifact on show has that value,
   when it is the only value that would be listed, and (for Area) when the value is no longer in
   `board.config.json`.
2. When filters are the reason nothing shows, the empty state says so and offers a way to clear
   them. "Every artifact is retired" and "No artifacts yet" keep their present meaning.
3. Saved prefs are read through B03's shared browser-storage reading rule (B03-REQ-06.2), not a
   separate parse or prune in B10's code. A pref of the wrong shape falls back to its default
   there. A value the board no longer knows (an unknown kind) is handled one of two ways: dropped
   by that shared rule's per-store shape check (as unknown statuses already are), or shown
   clearable. Either way it never filters invisibly.
4. Preserved: filters and layout persist per browser; statuses keep their present picked-but-absent
   behaviour; Show retired clears a picked Retired status when turned off; counts beside the kind
   toggles.
5. The form of the recovery control is B10-Q3. Candidate (FINDINGS): include picked values in
   `kindsPresent` and `componentsPresent`, as statuses do.

### B10-REQ-09 · Card find scrolls only when the reader asks (R-33)

1. Card find brings the current match into view only on these events:
   - the query changes;
   - the reader steps to the next or previous match (arrows, Enter, Shift Enter, the buttons);
   - find opens with a query;
   - another card or view takes the card's place (`resetKey`).
2. Changes inside the card's DOM do not scroll the card. Examples: the "Link copied" label and
   its revert, a history disclosure opening, a live refetch, a saved edit.
3. After such a change the matches are found again: the tints and the count update, as today.
   The current match stays the same match when its text is still there, even if matches were added
   or removed above it. If the current match is gone, the next match after where it was becomes
   current, without scrolling.
4. Preserved:
   - Ctrl F or Cmd F opens find only while a card is open (and not under a modal sheet over a
     docked card);
   - Esc closes find, not the card, and returns focus to the sheet;
   - a modal card scrolls as a whole;
   - matches are tinted through the CSS Custom Highlight API without touching the DOM;
   - "n of N" and "No matches".

Candidate (FINDINGS): a "scroll requested" ref set only by explicit steps and query changes.
Optionally keep the current match by position rather than index.

### B10-REQ-10 · Preserved behaviour across the territory

Nothing else in the viewers changes. In particular these behaviours stay as DESIGN.md and
`e2e/artifacts.spec.ts` describe them:
- pan and zoom;
- text selection in drawings;
- the minimap;
- stepped diagrams: steps, flights, follow and Replay;
- find in drawings, Markdown and PDFs (counts across undrawn PDF pages);
- PDF fits, page thumbnails and arrow keys;
- full screen;
- record-ID links in drawings;
- the light table's lazy thumbnails;
- the Linked and History tabs.

Loading is no slower when an artifact is opened for the first time.

These also hold under B01's settled answers:
- non-record anchors in a drawing never navigate (B01-REQ-03);
- fragment links behave as B01-Q2 decided;
- if D-01c adopts a page CSP, every viewer above (pdf.js workers, `blob:` and `data:` images,
  mermaid, the shadow-root styles) still works under it.

### B10-REQ-11 · Card timeline screenshots say truthfully why a version is not shown (addition found while authoring B09)

Source: PLAN.md B10 row and territory, PROGRESS accepted decision 5 and "Discovered for later".
This is the same flaw as R-103, in `HistoryView.tsx`'s `Shot` (B09's file; B10 changes only this
label, after B09).

1. A screenshot version in a card's history timeline that cannot be shown displays one label for
   its actual state, matching the B10-REQ-05 wording:
   - "Not kept: this version was never committed" only when the server confirms the blob is not
     kept (404, available once B01's R-22 lands);
   - "Could not be drawn" when the file was read but the browser cannot decode it as an image;
   - "Could not be read" (with the status where known) for any other failure.
2. Preserved:
   - a working version still shows its image, linked to open full size in a new tab;
   - the Before and After captions;
   - lazy loading.

## Dependencies and handoffs

- **Consumes B01:**
  - R-22's 404 for missing artifact files and history blobs. B10-REQ-05 and B10-REQ-11 need it
    for their "Not kept" label.
  - R-102's link interception in `CanvasViewer`. B10-REQ-04 edits the same component and must
    keep it.
  - D-01's answer on how `/requirements/` asset URLs are matched. B10-REQ-06's version token must
    fit it.
  - D-01c's answer on a page CSP. B10-REQ-01, REQ-02 and REQ-10 must work under it, and their
    proofs are re-run under it.
  - B01-Q2's answer on fragment links. B10-REQ-04 keeps a "reveal" path working.

  If B01 shipped differently from its SPEC, B10's plan follows what PROGRESS.md records.
- **Consumes B03:** the error boundary and D-06. B10's release logic must also run when the
  boundary unmounts a viewer. Its failure labels follow any client-message convention D-06 sets.
  B10-REQ-08 reads the artifact preferences through B03's shared browser-storage rule
  (B03-REQ-06.2). Any pruning of unknown saved values is expressed through that rule's shape check
  for this store, never in a separate reader.
  R-52 (find crash) is B03's, so B10 does not touch it.
- **Consumes B04:**
  - source-derived heading slugs in `MarkdownReader` (R-28);
  - NFC matching in `regionsDom` (R-101).

  B10-REQ-03's re-locating must use those helpers, not reintroduce DOM-text slugs or one-sided
  normalisation.
- **Consumes B07 (D-10):** the asset change signal on B07's delivery and the per-asset version
  token. B10-REQ-06 uses both as B07 shipped them and builds no second signal.
- **Shared files, in PLAN's order:**
  - `MarkdownReader.tsx`: B04, then B10.
  - `CanvasViewer.tsx`: B01, then B10.
  - `ArtifactPanel.tsx`: B06 (details form), then B10.
  - `HistoryView.tsx`: B09, then B10 (the `Shot` label only).
  - `find.ts`: B03, then B10.
  - `src/artifactIndex.ts`: B04 (text joins), then B10 (filter prefs).

  The `.lightbox` styles in `src/styles.css` are B10's. Under convention 11, any other minimal edit
  outside the territory is named in the PROGRESS entry.
- **Shared module:** `useLoaded` in `src/artifacts/content.ts` is also used by
  `src/diff/DiffFile.tsx` (B09). Any change to its contract keeps DiffFile working unchanged, or
  updates the call within B10 with a note in the PROGRESS entry.
- **Integration proof owner:** B10 proves its own findings. B15 re-checks the dispositions and runs
  the e2e suite.

## Acceptance and evidence

Every owned finding ends with one disposition in the PROGRESS entry: Fixed (with its proof), Not
reproducible at HEAD (with evidence), Won't fix (user accepted, with reason) or Moved (named owner,
recorded in both SPECs and PROGRESS). The addition (B10-REQ-11) gets a disposition the same way.
The execution agent picks the concrete test tools. **Convention 13: every proof below must fail on
the code before the fix and pass after it.** Where only a manual check is practical, it is recorded
before and after.

| Req | Finding | Proof obligation |
|---|---|---|
| REQ-01 | R-13 | **Measurable leak check, in a real browser on the fixture catalogue:** count live Web Workers in the page and, if instrumented, live pdf.js documents. Take a baseline, then repeat 10 times: open the Artifacts tab (PDF thumbnail drawn), open the PDF artifact, go back. Then open a PDF history compare and step through 5 pages. The worker count afterwards must not exceed baseline plus the documented cache bound, and must not grow between 5 and 10 repetitions. At HEAD it grows by at least one worker per view (FINDINGS: 50 after 10 visits). Also prove: (a) a late load (view gone before the document resolves) is released; (b) a partway failure is released; (c) a mounted reader still draws, finds and shows thumbnails after other views of the same file released theirs. If D-01c adopts a page CSP, re-run under it with no CSP violation reported. |
| REQ-02 | R-163 | **Measurable leak check:** count object URLs created and revoked by the page, through test-only instrumentation. Open mermaid artifacts, the light table and a mermaid source compare, and change a mermaid source N times (N at least 5). Outstanding URLs (created minus revoked) must end within the number of mermaid images on screen plus the documented cache bound, and must not grow with N. Also prove a late-resolving load is revoked, and that the minimap and on-screen thumbnails still show their image (no broken image) afterwards. If D-01c adopts a page CSP, re-run under it with no CSP violation reported. |
| REQ-03 | R-98, R-100 | Asking for a stale or unfindable region in an already-loaded drawing, Markdown and PDF viewer shows the flag (fails at HEAD, which reproduces in React 18.3.1 jsdom per FINDINGS). Changing a region's quote on disk with the viewer open moves the box to the new passage and removes the old box. Fixing a broken quote on disk draws the box. Step spots and whole-artifact views show no flag (existing e2e). |
| REQ-04 | R-99 | Asking for region B while region A is shown eases: the viewBox takes intermediate values over about 420 ms, not one jump. Under reduced motion it jumps. A fresh open is placed at once. Followed-step e2e tests still pass. If B01-Q2 is "reveal", a fragment link in a drawing still brings its target into view (B01's proof re-run after the rework). |
| REQ-05 | R-103 | Each label row in the table is shown for its state: a committed invalid mermaid source reads "Could not be drawn", a missing blob (404) reads "Not kept", a mermaid source added from nothing reads "Not there yet" on the before side, and a non-404 failure reads "Could not be read". The existing e2e history test passes. |
| REQ-06 | R-104 | **Uses D-10 as B07 shipped it; the criterion is unconditional.** With a card's gallery open, rewrite one of its screenshot files on disk with different content. The gallery and an open lightbox show the new image without a reload. An unchanged screenshot's URL stays the same across catalogue events. A request with the D-10 version token is served by the guarded asset route, and the B01 guard tests still pass. |
| REQ-07 | R-105 | With a lightbox open from a docked card, the topmost element at the New card button's and the divider's positions is the lightbox, and a click there closes the lightbox instead of acting on the control. The same holds from a modal sheet. Esc and arrow behaviour unchanged. |
| REQ-08 | R-106 | Save a Kind filter and an Area filter for values no artifact on show has (and an Area no longer in config), then reload. A control for each picked value is visible, clearing it restores the list, and the empty state offers a clear action. Unknown saved kinds never filter invisibly. Malformed saved prefs (wrong type for `kinds` or `components`, unparseable JSON) load the defaults without a crash. Code review and a test confirm the prefs pass through B03's shared storage reader, with no second parse in `artifactIndex.ts`. |
| REQ-09 | R-33 | With find open on a match, scroll elsewhere in the card and trigger a DOM change (copy the ID, open a history disclosure, live refetch). The card does not scroll, including after the label reverts. Insert matching text above the current match: the same match stays current. Stepping and typing still scroll to the match. |
| REQ-10 | (preserved) | `e2e/artifacts.spec.ts` passes in full on a free port, and under D-01c's page CSP if one was adopted. `npm run verify:board` passes. |
| REQ-11 | Addition (HistoryView `Shot`) | In a card's history timeline: a screenshot version whose blob the server reports missing (404) reads "Not kept". A version whose bytes are not a decodable image reads "Could not be drawn". A non-404 server failure reads "Could not be read". A working version still shows its image and full-size link. At HEAD all three failures read "Not kept". |

**Prohibited regressions:**
- a blank PDF page, broken thumbnail or broken minimap image caused by early release;
- a red box or flag on a step spot;
- a jump where DESIGN.md promises an ease, or an ease on first open;
- any route by which the version token reaches files B01 refuses;
- a viewer that breaks under D-01c's page CSP;
- the lightbox losing its capture-phase key handling;
- card find losing re-measurement on DOM change.

**Manual checks to record, where a browser test is impractical:** the stacking check from a docked
card, and the leak counts if the worker count cannot be read through the test runner. In that case
use the browser's own task or memory tools and record the numbers.

## Deferred decisions for execution planning

Shared register: [PROGRESS.md](../../PROGRESS.md), "Deferred decisions".

**Consumed (not owned):**
- **D-01** (B01): origin security model. It affects B10-REQ-06, because the asset URL form must be
  served by the guarded route. Resolved before B01 builds, so it is settled before B10.
- **D-01c** (B01): page CSP. It affects B10-REQ-01, REQ-02 and REQ-10. Any CSP must admit pdf.js
  workers, `blob:` images and `data:` thumbnails, and the proofs are re-run under it. It must be
  recorded before B10 builds (PROGRESS phase-status gate).
- **B01-Q2** (B01): fragment links in drawings, inert or reveal. It affects B10-REQ-04 and REQ-10.
  It must be recorded before B10 builds.
- **D-10** (B07): asset version and change signal. It affects B10-REQ-06. It must be recorded, and
  B07's signal shipped, before B10 builds.
- **B03-REQ-06.2** (B03's build): the shared browser-storage reading rule. It affects B10-REQ-08.
- **D-06** (B03): bad-data issue surface and error-boundary recovery. It affects B10-REQ-01 and
  B10-REQ-02 (release on boundary unmount) and the B10-REQ-05 label conventions. Settled before
  B03 builds.
- **B04's helpers** (outcome of B04's build; D-03 does not concern the client). They affect
  B10-REQ-03.

**B10's questions:**

| ID | Question / gap | Affects | Owner | Dependents | Resolve before | Boundary / acceptance impact |
|---|---|---|---|---|---|---|
| B10-Q1 | **Answered (accepted decisions 9 and 10, 2026-11-18): D-10 is B07's.** B07 produces the asset version and change signal, and B10-REQ-06 consumes it. B10 builds no server-side version source. | B10-REQ-06 | closed | none | n/a | REQ-06 waits only on D-10 being recorded and B07's signal shipping. |
| B10-Q2 | Should a compare version that loads but fails to decode as an image (a corrupt PNG, an SVG the browser rejects) show "Could not be drawn" instead of a broken-image icon? FINDINGS does not raise this. B10-REQ-11 already requires that label for the timeline's screenshots, so consistency argues for yes. | B10-REQ-05 | B10 execution planner (user if in doubt) | none | B10 implementation plan | If yes, add a row to REQ-05's proof. If no, record it under "Discovered for later". |
| B10-Q3 | What form does filter recovery take on the Artifacts tab: picked-but-absent values kept as toggles and select options (as statuses do today, with selects shown whenever a value is picked), a "Clear filters" action in the empty state, or both? This is a DESIGN.md question: quiet pills, laptop first. | B10-REQ-08 | B10 execution planner, against DESIGN.md (user if the look changes) | none | B10 implementation plan | Acceptance is unchanged: a visible control per picked value, plus a clear action from the empty state. |

## Risks and recovery requirements

- **Releasing too early.** Destroying a pdf.js document or revoking a URL that a mounted view still
  uses blanks pages or images. This is the main correctness risk. Ownership of each resource must
  be explicit (who opened it, who still uses it) and proven by the "still works after other views
  released" checks.
- **React effect order.** R-98 is itself an effect-order bug. Fixes to the found flag, placement
  and release must hold under React 18 StrictMode double effects in dev, which can double-open or
  double-release.
- **e2e timing.** Easing (REQ-04) adds about 420 ms of motion where tests may have relied on an
  instant snap. Existing e2e assertions on boxes and viewBoxes after a region request may need to
  wait for the view to settle. They must not be weakened to hide a real regression.
- **Asset version and the guard.** D-10's version token on `/requirements/` URLs interacts with
  B01's path guard. Prove it with B01's tests.
- **Page CSP.** If D-01c adopts a page CSP, pdf.js workers, `blob:` images or mermaid may be blocked.
  Re-run the leak and viewer proofs under it.
- **Shared `useLoaded`.** A contract change ripples into B09's DiffFile. Keep it backward
  compatible.
- **Recovery.** Every change is client-side and stateless, apart from the per-browser prefs
  (REQ-08). A bad build is reverted by reverting the phase's commit.
  Saved prefs must stay readable by both the old and new code.

## Execution and handoff obligations

1. Read root `CLAUDE.md`, PROGRESS.md in full (conventions 1 to 14 and the accepted decisions),
   the FINDINGS entries above and this SPEC. Confirm that B01, B03, B04 and B07 are recorded as
   done, along with everything earlier in the serial order (including B06 and B09). Confirm that
   D-01c, B01-Q2 and D-10 are recorded. Re-verify each finding and
   its line numbers at the then-current HEAD, and record any that no longer reproduce.
2. Resolve the open questions B10-Q2 and B10-Q3 (with the user where noted). Inherit D-01, D-01c,
   B01-Q2, D-06, D-10 and B04's helpers as recorded. Record accepted answers in PROGRESS.md before dependent building.
3. Write `docs/board-fixes/phases/B10-artifact-viewers/IMPLEMENTATION.md` before building. It
   covers resolved questions, the chosen approach (including any cache bounds for REQ-01 and
   REQ-02), small verifiable bites, the concrete tests and leak measurements, risks and recovery.
4. Build in bites. Never stage mid-phase (use `mv` and `rm`, not `git mv` and `git rm`).
5. Finish green: `npm run verify:board` from the repo root, and `e2e/artifacts.spec.ts`, plus any
   other touched spec, on a free port.
6. Bump the board version (minor) in `requirements-board/package.json` and its lock file, and add
   a `CHANGELOG.md` entry describing the visible changes in plain words (convention 5).
   Under convention 12, update any doc line (DESIGN.md, About, README) that describes behaviour
   B10 changes, such as the history compare labels or filter recovery. DESIGN.md already
   promises the ease that REQ-04 delivers.
7. Run the three review lenses in parallel (A quality, B completeness against this SPEC, C bugs and
   correctness). Verify, fix and re-run checks on confirmed findings.
8. Write the PROGRESS.md phase entry last. It covers:
   - what shipped, and deviations;
   - measured leak numbers before and after;
   - manual checks and review results;
   - a disposition for each of R-13, R-33, R-98, R-99, R-100, R-103, R-104, R-105, R-106, R-163
     and the HistoryView `Shot` addition (B10-REQ-11);
   - minimal edits made in other phases' files (convention 11);
   - every doc line changed, listed under "Doc facts" (convention 12);
   - any later work discovered. Commit only
   this phase's files, by path. Never push.
