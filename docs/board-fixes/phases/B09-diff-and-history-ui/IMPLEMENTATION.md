# B09 implementation plan: Diff and history UI

Board 1.20.0 to 1.21.0 (minor: readers see the changes). Programme branch `board-fixes`, worktree
`AnaesthesiaAssociatesRFP-board`. No master merge needed at start (master had no commits the branch lacked).

## Starting point (2026-11-20, HEAD `f7edee77`)

- Prerequisites COMPLETE: B08 (1.17.0), B07 (1.19.0); B03's R-51 repair, B05's `currentLife` cut and B07's
  delivery shape with `assets` (D-10) are in place; B06 left the History view untouched.
- Working tree: `docs/board-fixes/index.html` carries another session's uncommitted edits (counts spans, footer).
  Left alone; at commit time only the PHASE STATUS block line for B09 is staged (`git apply --cached` of that hunk).
- Every finding reproduced at HEAD with the real functions (scratch `repro.ts`): R-25 (1,100 paragraphs, one word
  changed: 1,100 `edited` rows; a 320-word paragraph with one word changed: `rewritten`; 500-line text, one
  line changed: 1,000 changed lines), R-89 (insert numbered item 2: `same,added,edited x4`), R-88 (`- one\n- two`
  to `- one - two` minor). The rest by reading at their current lines (line drift only):
  `shared/textCompare.ts:11`, `shared/proseDiff.ts:107,174,212,326`, `shared/history.ts:154,187,321`,
  `server/historyJournal.ts:230-238`, `src/diff/diffMarks.ts:51-53`, `src/diff/scroll.ts:20-38`,
  `src/diff/viewedStore.ts:51-58`, `src/diff/DiffView.tsx:164-176`, `src/diff/useDiffData.ts:60,85`,
  `src/diff/DiffCard.tsx:324`, `src/diff/DiffFile.tsx:66-77`, `src/components/HistoryView.tsx:26-35,94-109,351`.

## Decisions consumed

Accepted decision 23 (B09-Q2 recorded timings, B09-Q3 start number is a marked change, B09-Q4 live ticks,
the Open rule). D-07 (B08 contract: newest first, first parents, full-width shas), D-10 (B07: the store's
`assets` slice, `src → git blob hash`), `currentLife` kept in both builders (B05).

## Technical choices per requirement

**REQ-01 (R-25), `lcsPairs` keeps its signature** (`x, y, eq, maxCells`; `shared/steps.ts` untouched):
1. Common prefix matched first (provably what the old backtrack does: it always takes an equal pair at the cursor).
2. Rest under `maxCells`: the old table and backtrack on the rest, so every input under the old cap gives
   exactly the old pairs (P-06; proven against a copy of the old function over random inputs).
3. Over the cap: common suffix trimmed too, the middle compared by the table when it fits; otherwise anchored
   on values that occur once on each side (patience: longest increasing run of such pairs), each gap between
   anchors compared the same way, recursively. Every returned pair satisfies `eq`, in order. Never null now;
   the "everything removed then added" fallback is what a gap with nothing in common gives.
4. `pairBlocks`: rows whose keys match are `same` even when paired inside a removed/added run (identical blocks
   never `edited`); `pairRun` pre-reads each block's words once and, past 250,000 comparisons in one run, looks
   only a bounded window ahead (`PAIR_WINDOW`), so wholly different documents stay fast.
5. `wordDiff`: the cap counts the middle after trimming; anchors keep long scattered edits marked by word.
6. `lineDiff(a, b, max)`: no line-count bail; `max` becomes the table budget `(max+1)^2` for the middle.

**REQ-02 (R-89):** `splitBlocks` gives an ordered list's first item `start` (its number). `keyOf` keys an item by
depth, its visible marker (`bullet`, `ordered`, or `ordered:<start>` on a list's first item) and its text without
the marker. `markPair`: when the visible markers differ (bullet to numbered, a new start), each side becomes a
paragraph with its marker marked (`• text` / `3. text`), so the marker itself is marked.
Invariant: an edited pair with no mark on either side comes back `rewritten` (heading level change, a delimiter
row), so no edited row is blank.

**REQ-03 (R-88):** `isMinorChange` for Markdown fields (`description`, `acceptance`, `technical`, `notes`,
`question`, `answer`): minor only when `sameBlocks(a, b)` (same block count, each block's key equal; keys are
REQ-02's, so marker-only list changes are minor and a new start is not). `source`: line by line (non-blank lines,
each squashed, equal). `title`, `author`: squashed text as now.

**REQ-04 (R-90):** `diffMarks.ts` leaves: walk the leaf value's sentinels; marked whole when a change was open at
its start or opens inside it; `on` left as the last sentinel leaves it; sentinels stripped.

**REQ-05/06 (R-91, R-92):** `diffModel.entryOf`: for a mermaid artifact (either side), `fileChanged` also when the
`source` change is not minor (REQ-03 rule 3), so the card is not minor and shows its drawings. `FileRows`: tag
"Drawing changed" / "Drawing, unchanged" for mermaid; sides of different formats each drawn as what they are
(Markdown side through `OneDocument`, opening only). `DiffCard`: Open only when the record is in the store now
(and not removed, not unreadable after). No server data needed.

**REQ-07 (R-94):** `useDiffData` keeps the error with the key that raised it and returns it only for the current
key. `DiffView` checks the current error, then "Reading git" whenever stale with no cards to dim, before any
empty-state message.

**REQ-08 (R-32):** `land(page, target, barHeight)` returns a cancel. One landing per page (a `WeakMap`); a new one
cancels the old; wheel, touchstart, mousedown and scroll keys on the page cancel. Glide only when the clamped
destination differs by more than 1 px, with a `scrollend` listener plus a 900 ms timeout fallback, one correction
at most. Jump loop ends after a write that does not move the page (unreachable) or calm frames. `cancelLanding(page)`
on leaving the tab (DiffView unmount).

**REQ-09 (R-93, Q4):** `writeViewed(comparison, key, fingerprint | null)` merges the one key into the stored entry
(read fresh), moves the comparison last, evicts past 20. The hook listens to `storage` for its key and re-reads.

**REQ-10 (R-95):** `HistoryTimeline` keys: entry `type|at|sha|source|kind` with a repeat counter; day `d:<day>`.

**REQ-11 (R-97):** `Diff`'s `near` treats a missing neighbour as unchanged.

**REQ-12 (R-87):** new journal line kind `seen` (`{ at, source: 'disk', kind: 'seen', rev, changes: [] }`), appended by
`baseline` at first sight. `buildTimeline`: `start` is the earlier of the first `seen` and the first collapsed entry
(to the second); `seen` is never shown; when the journal saw the card first (a `seen`, no `created`, no git version
before `start`), a `created` entry at the `seen` time, "Not committed yet" while git has no version. Old journals
(no `seen`) read as before. `collapse` already drops a line with no changes that is not `created`, so an older board
reading a newer journal ignores it.

**REQ-13 (R-96):** `HistoryView` adds to its effect's deps a key built from `useCatalogue((s) => s.assets)` entries
under `assets/<ID>/` (selector returns a string, so other cards' deliveries do not re-render or refetch).

**Discovered row for B09** (`catalogueDiff.ts` mixed real and given paths): `fileInRepo` resolves the repository
root through `realPath` (`server/realPaths.ts`). Discovered row for `proseDiff.ts`' own fence heuristics: not taken
(not needed by any finding; recorded).

## Execution bites and checks

1. `textCompare.ts` + `proseDiff.ts` + `lineDiff` (R-25, R-89, REQ-02 invariant): `tests/diffTruth.test.ts` (new)
   real-size cases, marker cases, invariant over existing fixtures; reference-equality property test vs the old
   `lcsPairs`; `tests/proseDiff.test.ts`, `stepMoves.test.ts`, `history.test.ts` still pass.
2. `isMinorChange` (R-88) and `diffModel` mermaid (R-91 data): tests in `diffTruth`.
3. `diffMarks.ts` (R-90): jsdom/remark test in `diffTruth` (or `diffMarks.test.ts`).
4. Diff page: `DiffFile.tsx`, `DiffCard.tsx` Open, `DiffView.tsx` + `useDiffData.ts` (R-91 UI, R-92, R-94):
   jsdom tests `tests/diffUi.test.ts` (new); `e2e/diff.spec.ts` R-94 with `hold`.
5. `scroll.ts` (R-32): `tests/diffScroll.test.ts` (controlled container, fake rAF); e2e in `diff.spec.ts` with
   reduced motion emulated (k to the end, then a wheel up, not pulled back).
6. `viewedStore.ts` (R-93): `tests/viewedStore.test.ts` additions (two hook instances, storage event).
7. `HistoryView.tsx` (R-95, R-96, R-97): `tests/historyUi.test.ts` (new, jsdom, mocked `api.itemHistory`).
8. Journal and timeline (R-87): `tests/history.test.ts` additions and a `historyJournal` test for `seen`.
9. `catalogueDiff.ts` realPath: a test in `tests/catalogueDiff.test.ts` if the fixture allows (REPO_ROOT through a link).

Before-proofs: each new test run against `git archive f7edee77` of the board in the scratchpad (with this phase's
test files copied in); expected failing there, passing after. Timings: a scratch Node script, recorded in the entry.

Final: `npm run verify:board`; `e2e/diff.spec.ts` on port 5482 (`.lane.env` board port is 5480; the fixture config's
own port where it is fixed: run with an override if needed, never 5173/5174/5180/5181); `npm run check` byte-identical.

## Recovery

Each bite is independent (separate files apart from `history.ts`); revert a bite's files to `f7edee77` to back it
out. No data migration; the journal change is additive (`seen` lines), old journals untouched, and an old board
ignores `seen` lines. Nothing under `requirements/` changes.

## As built (2026-11-20)

Changes from the plan:
- **Start numbers live outside the key** (review). The plan put `ordered:<start>` in the first item's key; an insert or
  removal at the top of a list then paired the old first item wrongly. Keys carry only bullet or number;
  `markerChanged` (both sides list starts at different numbers, or bullet against number) turns a `same` row into an
  edit, drives `markPair`'s marker path and is part of `sameBlocks`. Word counts for pairing leave the marker out.
- **`pairRun`'s window** is 100 blocks past 40,000 comparisons (planned 200 past 250,000), from the review's timings.
- **Viewed, blocked storage:** a write counts as stored only when the comparison reads back from the store (an untick
  on a blocked store keeps the tab's own ticks). **Diff errors** are dropped as soon as another comparison is named.
- `lcsPairs` pushes the trimmed end with a loop (no argument spread on long inputs).
- `tests/writeModel.test.ts`' no-op test now compares the journal file before and after (it holds the start's `seen` line).

Before-proofs: the new tests ran on `git archive f7edee77` in the scratchpad (new symbols stubbed: `cancelLanding` as a
no-op, `entryKeys` as the old index keys). The e2e proofs ran with the pre-B09 `scroll.ts`, `DiffView.tsx` and
`useDiffData.ts` swapped in, then restored. Results and timings are in the PROGRESS entry.

## Handoff

- B10: `HistoryView.tsx`'s `Shot` label untouched; `HistoryTimeline` keys and `Diff` context fixed for the artifact
  timeline; `land()` now returns a cancel.
- B14: README / DESIGN lines listed under Doc facts.
- B15: rerun the new tests and `e2e/diff.spec.ts`.
