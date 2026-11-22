# B11 · Board canvas and views · implementation plan

Starting point: `board-fixes` at `30e2155f` (board 1.22.0), clean tree, master merged (nothing to take).
Prerequisites B03, B05, B07 COMPLETE; D-06 accepted (decision 17). Questions B11-Q1 to Q5 answered in
accepted decision 25 (PROGRESS.md).

## Evidence at HEAD (reconfirmed by reading; each becomes a failing test before its fix)

| Finding | Where at `30e2155f` | Still holds |
|---|---|---|
| R-29 | `src/board/mappedLayout.ts:92-98` files an orphan's children under `kids`; `:129` gives the orphan column only `orphans` | yes |
| R-86 | `shared/move.ts:73-82` (`siblings` file order, `peers` live first; `lo`/`hi` mix them) | yes |
| R-113 | `src/board/graph.ts:31` (`isShown` exempts the open card only); `mappedLayout.ts:111-115`; drag rest layout `BoardView.tsx:253-256` loses the only direct column | yes |
| R-114 | `mappedLayout.ts:142-166` (`collapsed` set has no exemption) | yes |
| R-115 | `BoardView.tsx:413` (`onCanvas` is any element in `.react-flow`) | yes |
| R-116 | `BoardView.tsx:323-336` (`centreOn`), `:363-370` (selection effect retargets at 80 ms with the mid-ease zoom), `:420`, `:526` | yes |
| R-117 | `BoardView.tsx:332` centres the midpoint; `inView` `:339-351` counts `CARD_PEEK` | yes |
| R-118 | `BoardView.tsx:422-430` (one sibling list per parent, file order) | yes |
| R-119 | `mappedLayout.ts:135-137`; `LaneHeaders.tsx:123` (Add as a lane appends a duplicate); `store.ts:415-445` (`renameLane` refuses); `server/catalogueApi.ts:989-995` (route refuses) | yes |
| R-120 | `LaneHeaders.tsx:83`, `:165`; `store.ts` `collapsedLanes` never follows | yes |
| R-126 | `OutlineView.tsx:66-71` (`toggle`), row twisty `:247-254` | yes |
| R-127 | `AboutView.tsx:19-22` (effect keyed on `s` only) | yes |
| R-128 | `QuestionsView.tsx:20`, `:107-112` | yes |

## Approach per requirement

**REQ-01, R-29 (orphans).** `mappedLayout` builds the orphan column from a depth-first sequence: each
orphan followed by everything under it (via `kids`, cycle-safe), then any card still unreached and not
under a hidden card (a cycle member, as autoLayout does). Per lane the column stacks that sequence's
cards in the lane (non-stories in the first lane), hidden cards at the foot as elsewhere. No add slot,
not a drop column (parent null), as today.

**REQ-02, R-113 and R-114 (the open card).**
- `graph.ts`: `isShown` takes the open card's ancestors as shown too (a `keep` set built once: the open card
  and its ancestors, cycle-safe). `BoardView`'s `visible` uses the same, so Mapped gives a hidden ancestor
  its column. Descendants of the open card stay hidden when retired.
- `mappedLayout` option `open`: in a collapsed lane the open story is placed at the strip's top, drawn (not
  in `collapsed`), and the strip's body is one card plus padding (Q1). Other cards in the lane stay placed
  and hidden. No add slots in a collapsed lane.

**REQ-03, R-86 and the merged sub-finding (drops).**
- `planMove`: the slot index is counted among the moving card's own segment of the drawn stack: live peers
  for a live card (index clamped to the live count), retired peers for a retired card (index less the live
  count). Its neighbours are then in one segment, so `lo <= hi` in file order and a drop between them
  whatever sits between keeps the card (`stays`).
- `mappedLayout` option `keepDirect` (epic IDs whose direct column stays while empty). A drag of a direct
  story holds its epic's column in both the hit-test layout and the drawn preview, so they agree and a drop
  back writes nothing. The hit-test layout is built by one exported function (`dragLayout`) used by
  `BoardView` and the tests.

**REQ-04, R-115 (keys on controls).** The walk and Enter run only when focus is on the page, the canvas pane
or a card: a target inside `.react-flow` that is (or is inside) a button, link, input, select, textarea,
menu or menu item is left alone.

**REQ-05, R-116 and R-117 (camera).** New pure module `src/board/camera.ts`: `centreViewport(place, pane,
clearLeft, zoom)` (centre a card that fits; a wider one with its left edge 24 px right of `clearLeft`) and
`cardInView(place, vp, pane, dock)` (the old `inView` rule). `BoardView` reads card geometry from its own
layout (a ref set in render), not React Flow's node store, so a centring that runs in the same commit as a
selection uses the new layout (collapsed strip, a newly drawn ancestor). Board-initiated moves (walk, search
open, Show on board) are an **aim** (`aim(id, zoom?, clearLeft?)`): one effect on `[selected, aimTick]`
performs it once the pane is measured; the plain-selection pan (a click, a panel link) runs only when no aim
is pending, after 80 ms as today, at the current zoom, only if the card is out of view. Search peeks keep
calling `centreOn` directly.

**REQ-06, R-118 (walk).** Pure `src/board/walk.ts` `walkStep(key, id, ctx)`: Left and Right among cards of the
same type under the same parent in drawn order (live first); Up and Down from a story through its column as
drawn (Mapped: lanes top to bottom from the layout's stacks, collapsed lanes skipped but the open card;
Freeform: the same parent's stories live first); Up from the top story to its parent; Down from a feature to
its first story drawn, from an epic to its first feature drawn (else its first direct story).

**REQ-07, R-119 (lane merge).**
- Server (`POST /api/lanes`, touch rights on B05's route): a rename whose `to` names another lane in any case
  merges: the stories take that lane's exact name (or `null` for the first lane's name), `from` leaves the
  list, all or nothing through `writeAll`, the same `lanesRev` and story-rev checks. A rename onto the source
  itself in another case stays a rename.
- Store: `renameLane` detects the merge target, skips its local duplicate check and sends the rename.
- `LaneHeaders`: a "not a lane" band that matches a lane except in case, or the first lane's name, offers
  **Move into ‹lane›** instead of "Add as a lane"; its rename merges as above.
- `setLanes` sends `layout.lanesRev` (B05/B07 handoff). It was the last caller of a base-less `lanes` write,
  so the layout PUT now requires `lanesRev` with `lanes` or `firstLane` (400), retiring D-04e's last legacy
  shape (decision 20); the tests that sent base-less lane lists send the rev.

**REQ-08, R-120 (collapsed state).** On a successful rename the source's collapsed key moves to the new name
(the new name's state becomes the source's); a merge or removal drops the source's key; a lane added on the
board drops any key of its name. Written through `useView.set` (B03's `writeJson`), read through its shape
check; no reader of B11's own; no pruning (Q4).

**REQ-09, R-126 (Outline).** While searching the twisty is a disabled, inert mark (no click handler, dimmed)
and the three bulk buttons are disabled with a title (Q5).

**REQ-10, R-127 (About).** The scroll effect is keyed on `location.key` as well as `s`, so a TOC link to the
section already in the URL (a new location) scrolls; Back and Forward land too.

**REQ-11, R-128 (owner filter).** The owner select lists a picked owner even when no question names them
(decision 25), so it shows the filter in force and All owners fires a change. The stepper reads the same store.

## Bites (each: failing test first, fix, focused tests, then the next)

1. Layout and graph: R-29, R-113, R-114 (`mappedLayout`, `graph.ts`, `BoardView` `visible`), `keepDirect` and
   `dragLayout`. Tests: `tests/boardCanvas.test.ts` (layout and graph cases).
2. Moves: R-86 and the direct-column drop. Tests in `tests/boardCanvas.test.ts` against `dragLayout`.
3. Walk and camera: `walk.ts`, `camera.ts`, BoardView keys and aims (R-115 to R-118). Unit tests for both
   modules; e2e for R-115, R-116, R-117 and the walk in `e2e/board-canvas.spec.ts` (new, fixture project).
4. Lanes: server merge, store, headers, collapsed keys, `setLanes` rev and the PUT's retirement (R-119,
   R-120). Tests: `tests/laneMerge.test.ts` (API: merges, all-or-nothing with an injected failure, B05's
   tests still green), store tests for collapsed keys; e2e for the band fix and rename keeping collapse.
5. List views: Outline, About, Questions (R-126 to R-128). jsdom tests `tests/listViews.test.ts`.
6. Docs (DESIGN Interaction and Board modes, README Mapped), version 1.23.0, CHANGELOG, SPEC answers.
7. Verify, review (convention 15), fix, re-verify, PROGRESS entry, plan page status, commit.

## Checks

- Before-proofs: every new unit test run on a `git archive 30e2155f` copy in the scratchpad (new modules
  stubbed where a test imports them), and the new e2e specs run against the pre-B11 `src/` swapped in.
- `npm run verify:board` from the repo root; touched e2e specs (`board-mapped`, `board-search`,
  `question-step`, new `board-canvas`) on the fixture board (5182).
- Manual keyboard walk on 5480 (scratch copy of the real catalogue): epics, features, stories, a collapsed
  lane, Enter on lane controls, search Enter from zoom 0.3, ArrowUp to a wide epic, Show on board into a
  collapsed lane and under a retired feature. Before and after recorded.
- `npm run check` on the real catalogue unchanged; no file under `requirements/` changes.

## Risks and recovery

- Camera timing: the aim path replaces the post-walk `centreOn` call; if an e2e camera test proves flaky,
  fall back to the old immediate `centreOn` plus the aim skip (the minimal R-116 fix) and record it.
- Layout ripples: every drop test uses `dragLayout`, the function the board uses. `board-mapped.spec.ts`
  covers the drags in the browser.
- Lane merge: one `writeAll`; a failure part way puts every file back (B05's mechanism), proven by test.
- Rollback: the phase is one commit on `board-fixes`; nothing is staged mid-phase.

## Handoff

B14: the DESIGN and README lines named in the PROGRESS entry; B15: rerun the new tests and e2e spec.

## As built (2026-11-20)

Differences from the plan above, all recorded in the PROGRESS entry:

- **Lane floors (`dragHold`).** A second hit-test fault beside the SPEC's: lifting the bottom card of a
  lane's tallest stack shrank that lane in the hit-test map, so a drop back in place landed in the next
  lane (or sprang back in the last). `dragHold` keeps every lane at its drag-start body height in both the
  hit-test map and the drawn preview; `dragLayout(items, dragged, subtree, opts, hold?)` builds the
  hit-test map from it.
- **Lane read from the map as drawn (review).** `dropTarget(L, point, dragged, drawn?)`: the lane under
  the pointer comes from the drawn preview, the slot from `L` with that lane shifted to where it is drawn.
  Only the pointer's own lane grows, so the target cannot flip between lanes.
- **Aim lifecycle (review).** An aim is skipped only on re-runs for the same selection (its own render,
  StrictMode); any selection change, closing the panel included, forgets it. A pane never measured gets
  no move.
- **Typed merges ask (review).** A rename onto another lane's name opens a popover (Keep lane focused,
  Merge); "Move into" from a band's menu does not ask (it is the named fix).
- **Outline bulk buttons** are `aria-disabled` (still focusable) with an `aria-describedby` note.
- **Modified arrows** (Alt, Shift, Ctrl, Cmd) never walk.
- **D-04e retirement**: `PUT /api/layout` with `lanes` or `firstLane` needs `lanesRev` (400 without).

## Manual keyboard walk (5480, scratch copy of the real catalogue)

Scripted in Playwright Chromium (`walk.mjs` in the session scratchpad), Mapped, starting at zoom 0.3 on
EP-13: Down to FT-13.1, its stories, Up back to the epic, Right and Left among epics, then FT-02.2's column
with Future Work collapsed, keys on the lane toggle and Add lane.

| Step | Before (pre-B11 code swapped in) | After |
|---|---|---|
| Up to EP-13, Right/Left among EP-01, EP-02 | title **not in view** each time; zoom drifted 0.90, 0.86, 0.83, 0.81, 0.79, 0.76 | title in view; zoom 0.90 every step |
| Down FT-02.2's column, Future Work collapsed | stepped onto US-02.2.3 (hidden in the collapsed lane), title not in view | US-02.2.1 then US-02.2.4 (US-02.2.2 is retired, hidden; US-02.2.3 skipped) |
| Arrows on the lane toggle, then Enter | open card kept; Enter **did not** expand the lane | open card kept; Enter expanded the lane |
| Enter on Add lane | box **not** opened | box opened, focused |

## Recovery

Each bite left the board green. To back the phase out, revert the B11 commit on `board-fixes`; nothing
outside the board changed, no catalogue data was migrated, and saved browser preferences keep their shape.
