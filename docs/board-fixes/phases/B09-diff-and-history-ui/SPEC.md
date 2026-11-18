# Phase B09: Diffs and timelines show what really changed

**Status:** PLANNED

**Requirements:** R-25, R-32, R-87, R-88, R-89, R-90, R-91, R-92, R-93, R-94, R-95, R-96, R-97
([FINDINGS.md](../../FINDINGS.md): "Findings in detail", entries `#### R-25`, `#### R-32` (Medium) and
`#### R-87` to `#### R-97` (Low)). Systemic context: none of the five systemic issues is owned here;
R-25 sits under the Performance theme and the rest under "Sheet, board and diff UI state".

**Owns:**
- Block pairing, word marking, folding and the shared longest-common-subsequence primitive:
  `shared/proseDiff.ts`, `shared/textCompare.ts` (accepted decision 5).
- The minor-change rule, the line diff, and the card and artifact timeline builders in
  `shared/history.ts`.
- The Diff review's entry model (`shared/diffModel.ts`, accepted decision 5), the R-91 data it needs
  from `server/catalogueDiff.ts` if any (PLAN.md shared-files row "B09 (R-91 data)"), and every file
  under `src/diff/` (including `viewedStore.ts`'s cross-tab write; B03 owns its parse crash, R-51).
- The card timeline, its line diff and the shared `HistoryTimeline` and `Diff` it exports
  (`src/components/HistoryView.tsx`), which the artifact timeline also draws with.
- First-sight journal records for R-87 in `server/historyJournal.ts` (PLAN.md B09 territory).
- The disposition and proof of each of the 13 owned findings.

**Excludes:**
- Reading git: log flags, renames, deletion and rename bounds, hash widths, caches and the git side
  of `server/catalogueDiff.ts` (B08: R-23, R-24, R-69 to R-74, R-161, R-162; D-07).
- History inheritance across a reused ID: R-54 is B05's, applying B08's deletion bound in
  `buildTimeline` (accepted decision 4); ID reuse policy (D-05, B05).
- The asset version and change signal (D-10): B07 produces it; B09 consumes it for R-96 (accepted
  decision 9).
- Artifact viewers and the artifact timeline's own rows (`src/artifacts/*`, including
  `ArtifactHistory.tsx`'s per-change rows and `VisualCompare.tsx`), versioned asset URLs in the
  gallery (R-104), compare-failure labels (R-103), blob URL release (R-163), and the screenshot
  failure label in `HistoryView`'s `Shot` (all B10; accepted decision 5).
- The viewed store's crash on valid non-object JSON (R-51, B03; same file, B03 builds first).
- The live-update path itself (`src/store.ts`, `src/useCatalogueRefresh.ts`), `syncFromDisk`, event
  sending and the event shape (B07); write routes (B05); the error boundary and issue surface (B03,
  D-06).
- The timeline's lineDiff re-running on card moves (refuted appendix item A-5): B15 confirms it.

**Depends on:** B08, B07 (D-10) (PLAN.md "Depends on"). In the serial order (B01, B02, B03, B04,
B08, B05, B07, B06, B09, B10, B11, B14, B15) B09 builds after B06, so B03's R-51 repair, B05's R-54
cut and B07's event shape are already in place as inputs.
- **B08** (hard): the shared git reader and decision **D-07** (cache key and bounds, SHA-256,
  unstaged moves, deletion and rename bounds). B09 consumes the timeline inputs B08 delivers,
  including any optional fields it adds to `shared/history.ts`, and does not re-implement git
  reading.
- **B07** (hard): decision **D-10**, the asset version and change signal on B07's
  `catalogue:changed` delivery, which B09-REQ-13 consumes.

**Unblocks:**
- **B10**: edits the screenshot failure label in `HistoryView.tsx` after B09 (shared-files row
  `HistoryView.tsx`: B09, then B10). The `HistoryTimeline` and `Diff` fixes (R-95, R-97) reach the
  artifact timeline without B10 work.
- **B15**: 13 dispositions with evidence.

**Binding constraints** (PLAN.md "Binding constraints", PROGRESS.md conventions 1 to 14):
existing stack only (Vite, React 18, zustand, TypeScript, Node >= 22.18, Vitest, Playwright), new
dependencies only with a recorded reason; visual changes follow `requirements-board/DESIGN.md`
("Diff review" and the card sheet's History paragraph); board code stays project-generic; fixes do
not change requirement content; finish green with `npm run verify:board`; touched Playwright specs
pass on a free port (never 5173, 5174, 5180 or 5181); board version bump plus `CHANGELOG.md` entry;
git: commit and merge, never push, stage by path at commit time only, never mid-phase. Touch rights
(convention 11): B09 delivers its whole fix, with minimal edits in other phases' files named in its
entry. Doc lines (convention 12): B09 updates the DESIGN.md lines that describe behaviour it
changes. Proof fails first (convention 13). The Diff review stays read-only: it never writes to the
catalogue (DESIGN.md "Diff review").

## Objective and outcomes

The Diff review and the History timeline are how a person and an agent see what changed in the
catalogue. Today they misreport in edge cases that real data already reaches: a long transcript shows
every paragraph edited, an inserted list item marks every later item edited, a joined pair of
acceptance bullets hides as "minor", a timeline lists one change twice, keyboard landings drag the
reader back, and stale messages sit under newly picked versions.

When B09 is delivered:

1. **A diff marks exactly what changed**, at every size the catalogue holds: a one-word change in a
   long document is one edited row with the rest folded, and in a long paragraph is one marked word.
2. **No row claims a change it cannot show.** An edited row always carries a visible mark or the
   "rewritten" tint; marker-only list changes that render the same are not changes.
3. **"Minor" means nothing a reader would notice**, and nothing structural hides behind it.
4. **Marks start and end where the change does**, whatever Markdown the boundary falls in.
5. **Artifact files compare by what they are on each side**, mermaid drawings included.
6. **The page and its controls tell the truth while it works**: no stale message under new refs, no
   Open for a record that is not there now, no landing that outlives the reader's next move.
7. **Viewed ticks from every tab survive.**
8. **The timeline shows each change once, keeps its open state on the right entry, shows only real
   context, and goes live for re-captured screenshots.**

## Sources and current-state evidence

Sources: FINDINGS.md entries named above; `requirements-board/DESIGN.md` ("Diff review",
lines 355 to 431; card sheet History, lines 117 to 127; artifact History, lines 351 to 353);
`CHANGELOG.md` 1.5.0 (the Diff review's promises: "keys step through the changes", "the comparison on
the page dims ('Reading git') until the new one arrives", Viewed "kept per browser until it changes
again"); tests `tests/proseDiff.test.ts`, `tests/diffModel.test.ts`, `tests/diffMarks.test.ts`,
`tests/diffPage.test.ts`, `tests/history.test.ts`, `tests/viewedStore.test.ts`, `e2e/diff.spec.ts`.

HEAD is d4341735 (board 1.12.3), the commit the review ran against, and no board file has changed
since, so every location in FINDINGS.md still holds. Each finding was re-checked at HEAD by reading
the code, and where noted reproduced with the real functions under Node (scratch scripts only):

| Finding | Location at HEAD | Re-check |
|---|---|---|
| R-25 | `shared/textCompare.ts:11-12` (cap, no end trimming); `shared/proseDiff.ts:174` (`?? []` turns "over the cap" into "nothing in common"), `:212` (400k cap on tokens that include spaces and punctuation); `shared/history.ts:176` (`lineDiff` bails at 400 lines a side before the LCS runs) | Reproduced: 1,100 and 2,000 paragraph documents with one word changed give 1,100 and 2,000 `edited` rows, 0 `same`. Two wholly different 900-block documents take about 920 ms in `pairBlocks`. A 320-word paragraph (640 tokens) with one word changed comes back `rewritten: true`. |
| R-32 | `src/diff/scroll.ts:23-26` (glide adds a `{once:true}` scrollend listener unconditionally), `:28-37` (jump loop, 6 calm or 61 frames, never cancelled); callers `useDiffKeys.ts:72`, `DiffView.tsx:114` | Confirmed by reading: no token, no cancel on a new call or on reader input, no "did the write move the page" exit. Not run in a browser. |
| R-87 | `shared/history.ts:255` (`start` from the first collapsed journal entry); `server/historyJournal.ts:84`, `:128-136` (first sight writes `.last.json` with no entry; an offline change is stamped at start-up) | Reproduced: a card first seen before a git retitle, then started after it, shows the retitle twice (a `disk` offline entry and a `git` entry). A card first seen while uncommitted and never in git has no entry at all. |
| R-88 | `shared/history.ts:143`; `shared/textCompare.ts:30` | Reproduced: `- one\n- two` to `- one - two`, and two paragraphs joined into one, both report minor. The same rule covers a mermaid `source`, where line breaks are syntax. |
| R-89 | `shared/proseDiff.ts:107` (key includes the list marker), `:326-336` (`markPair` strips it) | Reproduced: inserting item 2 in a five-item numbered list gives four `edited` rows, each with no mark and `rewritten: false`, and no folds. Changing `-` bullets to `*` gives `edited` rows too. |
| R-90 | `src/diff/diffMarks.ts:53` (leaf values stripped of sentinels without updating `on`); `shared/proseDiff.ts:199` (code span token stops at a newline), `:280-300` | Reproduced through remark: a change that ends inside a code span that crosses a line leaves " and the rest stays." marked. |
| R-91 | `shared/diffModel.ts:84` (`fileChanged` compares file blobs, both null for mermaid); `src/diff/DiffCard.tsx:322`, `:374`, `:382`; `src/diff/DiffFile.tsx:66`; `src/diff/DiffCard.tsx:324` (Open shown whenever the After side exists) | Confirmed by reading. A mermaid source edit shows only the source line diff; Whole card tags the drawings "File, unchanged". Open is offered from the After side, not from whether the record exists on the board now. |
| R-92 | `src/diff/DiffFile.tsx:67-77` (only both-Markdown goes to documents), `:35-51` (`Picture` falls to `<img>`) | Confirmed by reading. |
| R-93 | `src/diff/viewedStore.ts:25-36` (writes this tab's whole entry), `:46-66`; no `storage` listener | Confirmed by reading. |
| R-94 | `src/diff/DiffView.tsx:164-176` (error and empty states tested before `stale`), `:179`; `src/diff/useDiffData.ts:60`, `:85` (error cleared only on a successful load), `:116` | Confirmed by reading. |
| R-95 | `src/components/HistoryView.tsx:94` (day key `d${i}`), `:97`, `:109` (entry keys by index); shared by `src/artifacts/ArtifactHistory.tsx:44` | Confirmed by reading. |
| R-96 | `src/components/HistoryView.tsx:26-35` (refetch on rev and position only); `server/catalogueApi.ts:604-608` (`journal.screenshots` logs, nothing is emitted); `shared/types.ts:115-121` (no event kind for assets) | Confirmed by reading. The watcher already covers `assets/` (it watches the whole catalogue folder), so the gap is the missing signal, which B07 supplies as D-10; B09 fixes the timeline side. |
| R-97 | `src/components/HistoryView.tsx:351` (`undefined !== 'same'` at the edges) | Reproduced: a one-line change in 60 lines shows lines 1 and 60 as context beside 30 and 32. |

None of the 13 findings fails to reproduce at HEAD.

Facts that shape the requirements:

- `lcsPairs` has three callers besides the two in R-25: `lineDiff` (history line diffs and the
  artifact source diff via `VisualCompare.tsx`) and `shared/steps.ts:72` (which steps a stepped
  diagram kept in place). Its doc comment promises a tie rule ("a removal is listed before the
  addition beside it") and a fallback ("everything removed, then everything added").
- `isMinorChange` feeds the Diff review's Minor tag and filter, the tab's count (`countChanges`), the
  card height guess and the shown-fields set.
- `HistoryTimeline` and `Diff` are exported from `HistoryView.tsx` and drawn by the artifact
  timeline, so fixes there reach both timelines.
- Assumption (to confirm in planning): DESIGN.md's "Open (not for a removed one)" is the rule, and a
  record that is gone from the board now has no Open whatever the comparison shows.

## Detailed requirements

Each requirement states what a reader must see after the fix. Candidates quote FINDINGS.md and are
options, not mandates.

### B09-REQ-01 Long documents and long paragraphs diff by what changed (R-25)

1. Two versions of a Markdown field or Markdown artifact file that share most of their blocks pair
   those blocks as unchanged at any length the catalogue holds. A one-word change anywhere in a
   document of up to at least 2,000 blocks a side (about 2.5 times the largest transcript today,
   798 blocks, and above the 1,538-block joined case in R-25) shows exactly one edited row; the
   unchanged runs fold with one row of context, as for short documents.
2. A one-word change in a paragraph of up to at least 5,000 tokens (above the 2,211-token case in
   R-25) marks that word on each side. A paragraph is tinted whole as rewritten only when too little
   of it was kept (the existing kept-share rule), never because of its length.
3. When the part of two versions that actually differs is still too large to compare in full, the
   result is the documented fallback: blocks whose keys match read as unchanged where that can be
   decided cheaply, and the rest show as removed, then added. Identical blocks are never shown as
   edited, and the result is never "every block edited".
4. Every caller of the shared comparison gets the same behaviour, including the history line diff: a
   one-line change in a Markdown field or diagram source of up to at least 2,000 lines shows as that
   one line removed and added, not the whole text.
5. Performance targets (non-gating; recorded, not required). The sizes in rules 1, 2 and 4 are
   requirements because they are the round figures just above the real cases R-25 cites (798 and
   1,538 blocks, 2,211 tokens). The timings are an addition beyond FINDINGS.md: measured in Node on
   the development machine and recorded in the phase entry, they aim at pairing two 2,000-block
   documents with up to 50 changed blocks in under 100 ms, no input (two wholly different 1,000-block
   documents included; about 920 ms today for 900 blocks) holding the page more than 250 ms in the
   pairing step, and word marking of one 5,000-token paragraph pair in under 50 ms. R-25 closes on
   rules 1 to 4 and 6; a missed target is recorded, with the measured figure, and does not block the
   disposition (B09-Q2).
6. The shared primitive keeps its promises to every caller: its tie rule (a removal listed before the
   addition beside it), or a documented replacement that every caller's tests still pass under, and
   unchanged results for `shared/steps.ts` and for inputs that were under the cap before.

Candidate (FINDINGS.md): "Trim the common prefix and suffix inside `lcsPairs` (fixing every caller),
and apply the cap only to the middle. Past the cap, fall back to the documented all-removed-then-
all-added, or emit 'same' when keys match." For R-25(b), count only words, not spaces and
punctuation, against the cap.

### B09-REQ-02 List markers are not content, and no edited row is blank (R-89)

1. Inserting, removing or moving one item in a numbered list shows that one item as added, removed
   or moved. The items after it, whose only difference is their number, read as unchanged: they sit
   level and fold like any unchanged row.
2. A list whose bullet character changes (`-`, `*`, `+`) with the text the same reads as unchanged.
3. A change between a bulleted and a numbered item, which changes what the reader sees, shows as an
   edited row with the marker itself marked.
4. Invariant for every edited row in the Diff review: at least one side carries a visible mark, or
   both sides carry the rewritten tint. An edited row with nothing marked on either side never shows.
5. A list's starting number (its first item's number, which Markdown renders) is decided in planning
   (B09-Q3); until then it follows rule 3 (shown as a marked change).

Candidate (FINDINGS.md): "Normalise markers in keyOf, or treat lead-only differences as 'same'."

### B09-REQ-03 Minor means nothing a reader would notice (R-88)

1. A change to a Markdown field is minor only when its block structure is the same on both sides and
   each block differs only in spacing. Joining or splitting paragraphs, merging or splitting list
   items or acceptance criteria, changing a list item's depth, or turning a line into a heading is
   not minor: the card shows, is counted in the tab's count, and carries no Minor tag.
2. Re-wrapping a paragraph across lines, trailing whitespace and doubled spaces stay minor, as now.
3. A diagram source (`source`) compares line by line: adding, removing, joining or splitting lines is
   not minor.
4. A Markdown field whose only differences are the marker-only list changes of B09-REQ-02 rules 1
   and 2 is minor, so no edited card shows with no visible change.
5. The other minor rules stay as they are: a reorder among siblings, a Freeform position, and a list
   field reordered with nothing added or removed.

Candidate (FINDINGS.md): "Compare block structure (splitBlocks) as well as the squashed text."

### B09-REQ-04 Marks end where the change ends (R-90)

1. In the Diff review's word marks, a change that starts or ends inside a code span (including one
   that crosses a line), an image, raw HTML or any other leaf the renderer cannot split, opens or
   closes the mark at that leaf. The unchanged text after the change is never struck or tinted.
2. A leaf a change touches is marked whole, as now, and no sentinel character ever reaches the page.
3. The same holds for the sentence fold (`…`), which decides what to keep from the same marks.

Candidate (FINDINGS.md): "Walk the leaf's sentinels to set `on` before stripping."

### B09-REQ-05 Artifact files compare by what each side is (R-91, R-92)

1. An edited mermaid diagram whose source changed shows both drawings, Before and After, in the
   changes-only view, beside or with its source line diff, with a seam tag that says the drawing
   changed. Whole card tags the drawings "unchanged" only when the source is unchanged.
2. A mermaid source change counts as a drawing change wherever a file change counts: the card is
   never hidden as minor for it (subject to B09-REQ-03 rule 3), and it stays on the page when the
   source is its only change.
3. An artifact whose file changes format between the two sides (Markdown on one, an image, SVG,
   PDF or mermaid on the other) shows each side as what it is: the Markdown side typeset as a
   document (its opening only, past the existing length limit, with the existing note), the other as
   its picture or first page. No side ever shows a broken image.
4. Both-Markdown, both-picture, PDF and one-sided (added or removed) behaviour stays as DESIGN.md
   describes.

Candidates (FINDINGS.md): "Treat a `source` change as a drawing change for mermaid." "Render the
Markdown side with OneDocument."

### B09-REQ-06 Open opens what is on the board now (R-91, merged "the Open button assumes After is now")

1. A Diff review card offers Open only when its record exists on the board now, and never for a
   Removed card or one marked "Could not be read" on its After side (DESIGN.md). A record deleted
   after the After version, in a commit-to-commit comparison, has no Open.
2. Open always opens the record as it is now, and its title says so (as today: "Open it as it is
   now").

### B09-REQ-07 While a new comparison loads, nothing from the old one speaks for it (R-94)

1. From the moment new From and To are picked until their comparison arrives, the bar names the new
   versions and the page shows only "Reading git", over the old cards dimmed and out of reach where
   there were cards (as now). The old comparison's "No card ... differs", "Nothing matches the
   filters" or "Git could not be read" message is never shown under the new versions.
2. An error belongs to the request that raised it: picking another comparison clears it, and an error
   for the new comparison shows only once that comparison has failed.
3. The "Nothing is uncommitted" note keeps its current rule (never while stale).

Candidate (FINDINGS.md): "Check stale first, and clear error on a key change."

### B09-REQ-08 One landing at a time, and the reader's own scroll always wins (R-32)

1. The Diff review has at most one landing (from j, k, Shift J, Shift K, v or the jump list) in
   progress at a time. A new landing cancels the one before it.
2. The reader's own wheel, touch, mouse press or scroll key cancels any landing in progress at once.
   After the reader starts scrolling, the page is never moved again by an earlier landing.
3. A landing that cannot move the page (the target is already in place, or out of reach at the top
   or bottom of the page) ends at once and leaves nothing waiting. Reaching the last change with k and
   then pressing j, or scrolling up by hand, moves the page where the reader asked, never back.
4. Under reduced motion, a landing still jumps and corrects as cards lay out, and stops as soon as a
   correction no longer moves the page. Nothing keeps writing the scroll position for a target it
   cannot reach.
5. Leaving the Diff tab cancels any landing in progress.
6. Preserved: every landing puts its target 12px under the bar wherever it is on the page, and the
   ring flashes as now (DESIGN.md "Keys"; e2e `keys step through changes and cards ...`).

Candidate (FINDINGS.md): "Keep one landing token per page ... Add the listener only when the clamped
destination differs by more than 1 px, with a timeout fallback. End the loop when a write does not
move the page."

### B09-REQ-09 A Viewed tick in one tab keeps the ticks of another (R-93)

1. Ticking or unticking a card in one tab changes only that card's tick in the stored comparison.
   Ticks made in another tab for the same or another comparison are never erased or restored by it.
2. The store still keeps the 20 comparisons last ticked, and a tick still clears itself when the
   record changes again.
3. Optional (decide in the implementation plan): an open tab shows ticks made in another tab without
   a reload.
4. Builds on B03's R-51 repair: valid JSON that is not an object never crashes the tab, and the write
   path repairs it.

Candidate (FINDINGS.md): "Merge only the changed key, and optionally listen for storage events."

### B09-REQ-10 Timeline entries keep their identity across a refresh (R-95)

1. In the card timeline and the artifact timeline, an entry's open disclosure, its "Not kept" state
   and any other per-entry state stay with that entry when a refresh adds, removes or reorders
   entries around it.
2. Keys are unique even when two entries share a time, and do not assume a commit hash width (40 or
   64 hex, per D-07). Day headings are keyed by day, not by position.
3. The artifact timeline's per-change rows inside an entry are B10's (`ArtifactHistory.tsx`); this
   requirement covers the timeline frame they sit in.

Candidate (FINDINGS.md): "Key by type, time and sha."

### B09-REQ-11 A line diff shows only real context (R-97)

1. In the card timeline's text disclosure (and everywhere the shared `Diff` draws, including the
   artifact timeline), an unchanged line shows as context only when a changed line is next to it.
   The first and last lines of a text are not context unless a change touches them.
2. Unchanged runs fold to "N unchanged lines" as now.

Candidate (FINDINGS.md): "Treat a missing neighbour as unchanged."

### B09-REQ-12 Each change appears once in the timeline, and a first-seen card has a beginning (R-87)

1. A change made while the board was off, and committed before the board started again, appears once
   in the card's timeline: as the "On disk, while the board was off" entry with the commit as a
   divider, or as the git entry, never both.
2. The point from which the journal's detail takes over from git is when the journal first saw the
   card, not its first logged change.
3. A card the journal first sees while it is uncommitted and has no git history shows an entry for its
   creation (with "Not committed yet" while that holds), never "No changes recorded yet".
4. Journals written before this phase still read: a card with no recorded first sight behaves as
   today until it gains one. No journal is rewritten.
5. Preserved: commits before the journal's start show as field diffs, newer ones as dividers, and
   the "not committed yet" rules for card files, layout and screenshots (tests/history.test.ts).

Candidate (FINDINGS.md): "Record a baseline timestamp and use it as `start`."

### B09-REQ-13 Re-captured screenshots appear in an open timeline (R-96)

1. With a card's History open, re-capturing one of its screenshots on disk while the board runs
   (`npm run capture`, or any rewrite in place) adds the "Screenshot updated" entry without
   reopening the card, as fast as other on-disk edits arrive.
2. Only timelines of cards whose screenshots changed are re-read.
3. The timeline learns of the change from D-10, the asset version and change signal B07 produces
   on its `catalogue:changed` delivery (accepted decision 9). B09 consumes it and builds no signal of
   its own; a delivery that does not name the open card's assets leaves its timeline alone.

Blocked on: D-10 recorded by B07 (its event and token form). FINDINGS.md's "Emit an assets event or
fingerprint, shared with R-104" is B07's to choose; B09's part is the consumer in `HistoryView`.

### Preserved behaviour (must not regress)

- P-01 Everything DESIGN.md "Diff review" and CHANGELOG 1.5.0 describe: pairing by paragraph, word
  marks, the rewritten tint, sentence folds, "N unchanged paragraphs" folds and their Hide label,
  one-line previews, Whole card, filters and counts, the sticky bar and its fold, progressive drawing,
  a refresh that finds nothing new drawing nothing, the kept comparison on return.
- P-02 Keys rest while typing, with a sheet, picker, popover or dialog open, and while a new
  comparison is read; v ticks and moves on.
- P-03 No sentinel character ever reaches the page, in text, code, addresses, URLs or autolinks;
  tables stay tables; quotes and lists keep their markers outside marks (tests/proseDiff,
  diffMarks, diffPage).
- P-04 "Could not be read" cards, removed records named as they were, sources named against each
  side's artifacts (e2e/diff.spec.ts).
- P-05 Timeline rendering, sources, marks, the amber uncommitted run, screenshot pairs and day
  headings (DESIGN.md card sheet History).
- P-06 `shared/steps.ts` results and the artifact source diff are unchanged for every input below the
  old cap.
- P-07 No file in the catalogue changes; no journal file is rewritten.

## Dependencies and handoffs

| Input | From | B09 needs |
|---|---|---|
| Shared git reader and D-07 | B08 | The final shape of `GitFileHistory`, screenshot and asset histories that `buildTimeline` and `buildArtifactTimeline` take, including any optional fields B08 adds to `shared/history.ts` (first-parent ordering for R-23, deletion and rename bounds); hash widths for keys (B09-REQ-10). |
| R-54 in `buildTimeline` | B05 | B05 applies B08's deletion bound in `buildTimeline`; B09 keeps it (B09-REQ-12 must not undo the cut). |
| R-51 in `viewedStore.ts` | B03 | Safe reads before B09-REQ-09 changes the write. |
| `server/historyJournal.ts` | B03 (unstat-able entries), B08 (hashing), B05 (ID reuse), B07 (sync) | B09-REQ-12 adds a first-sight record to the file in the shape they leave; B09 does not change hashing, reuse handling or sync. |
| D-10: asset version and change signal | B07 | B09-REQ-13 reads it from B07's `catalogue:changed` delivery to refresh an open timeline. |
| Live-update path and event shape | B07 | The delivery D-10 rides on; B09 adds no event kind. |

Outputs B09 owns: the behaviours above, and the fixes in `HistoryTimeline` and `Diff` that the
artifact timeline inherits. B09 proves its own findings; B15 owns integration proof.

### Boundaries (settled by PLAN.md and accepted decisions)

1. `shared/history.ts`: shared-files row B08 (optional fields), B05 (ID reuse), then B09.
2. `server/historyJournal.ts`: row B03, B08, B05, B07, then B09 (first sight).
3. The asset change signal is B07's (D-10, accepted decision 9); B09 and B10 consume it and run in
   the serial order (B09 before B10), never in parallel.
4. `shared/textCompare.ts` and `shared/diffModel.ts` are B09's (accepted decision 5).
   `shared/steps.ts` consumes `lcsPairs` and its results stay unchanged (P-06).
5. `HistoryView.tsx`'s exports are drawn by `ArtifactHistory.tsx` (B10). B09 changes their behaviour
   (R-95, R-97), not their props; if the props must change, B09 updates the call site under touch
   rights (convention 11) and names it in its entry.
6. `HistoryView.tsx`'s screenshot `Shot` failure label ("Not kept: this version was never committed"
   for every load failure) is assigned to B10 (accepted decision 5), which edits it after B09
   (shared-files row `HistoryView.tsx`: B09, then B10). B09 leaves it unchanged.

## Acceptance and evidence

Unconditional proof obligations, one per finding. The execution agent picks the test form. Every
proof must fail on the code before the fix and pass after it (convention 13); where no automated
test is practical, the recorded manual check shows the failure before and its absence after.

| Finding | Proof |
|---|---|
| R-25 | Real-size inputs (a long transcript, two joined, a long paragraph) with one change: one edited row, the rest folded; one marked word; a one-line change in a long field's line diff is one line. Timings for B09-REQ-01 rule 5 measured and recorded (non-gating). Existing `lcsPairs` callers' tests, `steps.ts` included, pass. |
| R-89 | Inserted numbered item: one added row, later items unchanged and folded. Bullet character change: unchanged. Bulleted to numbered: marked. The "no blank edited row" invariant checked over the existing fixtures and the new cases. |
| R-88 | Joined paragraphs, merged bullets, split criteria, changed depth, mermaid line joins: not minor and counted. Re-wrap and spacing: still minor. Marker-only list changes: minor. |
| R-90 | A change ending inside a multi-line code span, and one starting inside it: the text after (or before) the change is unmarked; no sentinel left. |
| R-91 | Mermaid source edit: both drawings shown, seam tag says changed, Whole card does not say "unchanged"; source-only change keeps the card on the page and not minor. Open absent for a record gone from the board now. |
| R-92 | Markdown to SVG and SVG to Markdown: the Markdown side typeset, the other a picture; no broken image. |
| R-93 | Two writers to the same comparison (two tabs, or two hook instances over one storage): both ticks survive; untick in one leaves the other's tick. Eviction of the 21st comparison still works. |
| R-94 | With a slow comparison request: after picking new refs, no old empty-state, filter or error message is shown; an old error is cleared on the pick. |
| R-95 | A refresh that inserts a newer entry keeps an opened disclosure open on the same entry, and "Not kept" on the same version. Duplicate timestamps give unique keys. |
| R-96 | With a card's History open, rewriting one of its screenshots on disk adds the entry without reopening, driven by B07's D-10 signal (e2e or a recorded manual check); a delivery naming other cards does not re-read this timeline. |
| R-97 | One-line change in 60 lines: only lines adjacent to the change shown as context. |
| R-87 | First sight before a committed offline change: the change appears once. First sight of an uncommitted card with no git history: a creation entry. An old journal with no first-sight record reads as before. |
| R-32 | Scripted page (unit test with a controlled scroll container, or e2e): k to the end, then j or a wheel scroll, is not pulled back; under emulated reduced motion, nothing writes the scroll position after an unreachable landing or after reader input; a second landing cancels the first. Existing e2e key test passes. |

Prohibited regressions: anything in P-01 to P-07; `npm run verify:board` red; `e2e/diff.spec.ts`
failing; any sentinel visible on the page; any change to catalogue files.

Criteria awaiting a decision: the list starting number case in B09-REQ-02 rule 5 (B09-Q3); the
form of B07's D-10 signal, which R-96's proof drives (blocked until D-10 is recorded). The timings in
B09-REQ-01 rule 5 are recorded, not gating (B09-Q2).

## Deferred decisions for execution planning

No decisions are owned from the shared register. Consumed: **D-07** (B08: git reader contract,
including deletion and rename bounds; resolve before B08 build), **D-10** (B07: asset version and
change signal; resolve before B07 build; B09-REQ-13 is blocked until it is recorded), and **D-06**
(B03: issue surface, only if B09 must report bad data). See
[PROGRESS.md](../../PROGRESS.md) "Deferred decisions".

| ID | Question | Affects | Owner | Dependent phases | Resolve before | Boundary / acceptance impact |
|---|---|---|---|---|---|---|
| B09-Q1 | Who produces the screenshot change signal R-96 and R-104 need. **Answered (accepted decisions 5 and 9, 2026-11-18):** B07 produces it as D-10; B09 and B10 consume it. | B09-REQ-13 | answered | none | none | B09-REQ-13 consumes D-10 |
| B09-Q2 | The timing targets in B09-REQ-01 rule 5 (100 ms, 250 ms, 50 ms) are an addition beyond FINDINGS.md and are non-gating. Keep them as recorded targets, tighten them, or drop them? | B09-REQ-01 rule 5 | B09 planning (user) | none | B09 build | None on R-25's disposition, which closes on rules 1 to 4 and 6 |
| B09-Q3 | When only a numbered list's starting number changes (which Markdown renders), is it a marked change or unchanged? | B09-REQ-02 rule 5, B09-REQ-03 rule 4 | B09 planning | none | B09 build | One test case |
| B09-Q4 | Should an open Diff tab reflect another tab's Viewed ticks live (B09-REQ-09 rule 3), or only on the next read? | B09-REQ-09 | B09 planning | none | B09 build | Optional proof |

## Risks and recovery requirements

- **Shared LCS change ripples.** `lcsPairs` serves the Diff review, both timelines, the artifact
  source diff and stepped-diagram steps. Trimming the ends can pick a different but equally long
  pairing on ties. Required: the documented tie rule holds or is replaced with every caller's tests
  passing; P-06 proven by a test over the existing fixtures.
- **Minor rule change moves counts.** B09-REQ-03 changes which cards the tab counts and hides. That is
  intended; the CHANGELOG entry must say so, so nobody reads a higher count as a regression.
- **Journal compatibility.** The first-sight record must be additive: old journals read unchanged, a
  journal that cannot be written never fails a save (the journal's own rule), and nothing in the
  catalogue changes.
- **Consuming D-10.** The timeline reacts only to deliveries that name its card's assets, and a
  delivery it does not recognise changes nothing; reacting must not trigger a catalogue reload or
  re-read every open timeline (B07's burst outcome).
- **Scroll cancellation in a real browser.** Unit tests of landing logic cannot see browser
  `scrollend` timing; at least one e2e or recorded manual check in Chromium is required for R-32,
  with reduced motion emulated.
- **Recovery.** Each requirement can land and be reverted on its own commit; no data migration.

## Execution and handoff obligations

1. Read PROGRESS.md (conventions 1 to 14 and accepted decisions), PLAN.md, this SPEC and the
   FINDINGS.md entries for the 13 findings. Confirm the phases before B09 in the serial order (B01,
   B02, B03, B04, B08, B05, B07, B06) are recorded DONE, D-07 and D-10 are recorded, and read their
   entries for the shapes left in `shared/history.ts`, `server/historyJournal.ts`, `viewedStore.ts`
   and the `catalogue:changed` delivery. Re-check each finding at the new HEAD; record any that no
   longer reproduce.
2. Resolve the open questions (B09-Q2 to B09-Q4, with the user where marked) and record accepted
   answers in PROGRESS.md before building anything they affect.
3. Write `docs/board-fixes/phases/B09-diff-and-history-ui/IMPLEMENTATION.md` before building: chosen
   approach per requirement, execution bites, checks per bite, recovery.
4. Build and verify each bite; each regression proof fails before its fix and passes after
   (convention 13). Finish with `npm run verify:board` green from the repo root and
   `e2e/diff.spec.ts` (plus any touched spec) passing on a free port.
5. Bump the board version (`requirements-board/package.json` and its lock file; minor, since readers
   see the changes) and add a `CHANGELOG.md` entry that names the visible changes, the count change
   from B09-REQ-03 included. Update the doc lines (DESIGN.md's Diff review and History text, README or
   About where they describe it) only where behaviour they describe changed (convention 12).
6. Run the three review lenses (quality and maintainability; completeness against this SPEC;
   bugs and correctness) as independent reviewers, verify their findings, fix confirmed ones, rerun
   verification.
7. Give every owned finding one disposition: **Fixed** (with its regression proof), **Not
   reproducible at HEAD** (with evidence), **Won't fix** (user accepted, with reason) or **Moved**
   (named owner, recorded in PROGRESS.md and both SPECs).
8. Record the PROGRESS.md entry last: what shipped, dispositions, accepted answers, the recorded
   timings for B09-REQ-01 rule 5, any edits made in other phases' files under touch rights
   (convention 11), the doc lines changed listed under "Doc facts" (convention 12), and new facts for
   later phases. Commit by path on master. Never push.
