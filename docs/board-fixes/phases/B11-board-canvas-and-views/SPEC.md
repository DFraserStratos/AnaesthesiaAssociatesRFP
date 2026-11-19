# Phase B11: The board canvas, Outline, Questions and About always show the open card and every live card, and keyboard paths behave

**Status:** COMPLETE (2026-11-20, board 1.23.0; see PROGRESS.md)
**Requirements:** R-29, R-86, R-113, R-114, R-115, R-116, R-117, R-118, R-119, R-120, R-126, R-127,
R-128 in [FINDINGS.md](../../FINDINGS.md) ("Findings in detail", `#### R-nn`); systemic issue 5
(bad data becomes an issue, never a silent omission) for R-29 and R-113; programme outcome 3 in
[PLAN.md](../../PLAN.md).
**Owns:** Mapped layout completeness, Mapped placement of cycle members included
(`src/board/mappedLayout.ts`, `src/board/graph.ts`); the open card's visibility in Mapped; Mapped
drop planning (`planMove` in `shared/move.ts`) and drop hit-testing; lane fix-ups, including the
lane merge (R-119), which extends B05's lane route in `server/catalogueApi.ts` and the store's lane
actions under touch rights (accepted decision 7); collapsed-lane state in the store's view
preferences and `src/board/LaneHeaders.tsx`; the board keyboard and camera
(`src/views/BoardView.tsx`: Enter, arrow walk, centring, zoom on walk and search); Outline twisty
behaviour while searching (`src/views/OutlineView.tsx`); About table-of-contents scrolling
(`src/views/AboutView.tsx`); the Outstanding items owner filter (`src/views/QuestionsView.tsx`); the
`DESIGN.md` lines describing board behaviour it changes (convention 12). Acceptance and
dispositions for all 13 owned findings.
**Excludes:** cycle-safe tree walks everywhere, Freeform placement of cycle members (R-10), safe type
lookups including `canParent` (R-11), Outline's listing of cards with a missing or wrong-type parent
(R-122), the unknown-status question group (R-121), the error boundary and the issue surface
(`ProblemPill`, D-06): all **B03** (accepted decision 10, B03-Q1). Lane rename and lane delete as one
write, including the store's `renameLane` and `deleteLane` (R-56), and the lane-list rule (R-55):
**B05** (accepted decision 7). The store's live-update path, layout save queue and node and `data`
identity reuse in `graph.ts` and `BoardView` (R-40, R-57 to R-59, R-158, R-159): **B07**. Status
filter persistence (R-46): **B02**. About page install text (R-155) and the whole-file docs pass:
**B14**. Edit sheets, including "Find on board" inside `ItemModal`: **B06**.
**Depends on:** B03, B05, B07 (PLAN.md "Phases"). Concretely: **B03**'s cycle-safe `descendantsOf`,
safe `canParent`, the error boundary round the board and accepted decision **D-06**; **B05**'s
one-write lane route and the store's `renameLane` and `deleteLane` wired to it (R-56), which
B11-REQ-07 extends; **B07**'s final store sync, layout save queue and node identity reuse, which B11
keeps. Serial position: after B10, before B14.
**Unblocks:** B14 (its About page and docs truth pass follow B11's changes to `AboutView.tsx` and
DESIGN.md) and B15 (closing audit), with 13 dispositions and their evidence.
**Binding constraints:** PLAN.md "Binding constraints" and PROGRESS.md conventions 1 to 14, notably:
existing stack (React 18, zustand, @xyflow/react; no new dependency without a recorded reason,
convention 3); `requirements-board/DESIGN.md` governs every visual change (lanes are neutral bands,
motion only on action, reduced motion respected, the board never raises a browser dialog;
convention 4); board code stays project-generic; fixes do not change requirement content
(convention 7); `npm run verify:board` green and touched Playwright specs pass on a free port, never
5173, 5174, 5180 or 5181 (convention 6); board version bump and CHANGELOG entry (convention 5);
never stage mid-phase, never push (convention 9); touch rights (11), doc lines (12), proof fails
first (13).

## Objective and outcomes

The board is where people read and arrange the catalogue, and "the card I asked for is on the
screen" is its most basic promise. The review found ways the Mapped board draws nothing where a card
should be (its parent is missing, a retired ancestor is hidden, its lane is collapsed), a drop that
lands somewhere other than where it was aimed, keyboard paths that swallow keys or step to the wrong
card, and three list views whose controls misstate or forget what they are doing.

When B11 is delivered:

1. **Every live card is on the Mapped board and findable by search**, including cards under an
   orphaned parent, whatever the data's shape.
2. **The open card is always drawn and in view**, whether it was opened by a click, "Show on
   board", the arrow keys or search, even when an ancestor is retired or its lane is collapsed.
3. **A drop lands where the bar showed**, and a drop back in place changes nothing on disk.
4. **Lanes can be repaired on the board**: a band that differs from a lane only in case, or names
   the first lane, has a working fix, and collapsed state follows renames and deletes.
5. **Keyboard paths do what they say**: Enter presses the focused control, the arrow keys walk the
   cards as the board draws them, and every walk and search lands at the same zoom with the card's
   title in view.
6. **List views tell the truth about their state**: Outline's collapse state is not changed by
   clicks that look inert, About's table of contents always scrolls, and the owner filter shows the
   filter that is applied.

## Sources and current-state evidence

All evidence was re-checked at HEAD `d4341735` (board 1.12.3) on 2026-11-18. Every owned finding
still reproduces. Line ranges below are current; where FINDINGS.md's lines differ, the current ones
are given. Five were reproduced by running the pure layout and move functions in a scratch script
(node, test fixtures from `tests/fixtures.ts`, status `5` as retired).

| Finding | Current location | Status at HEAD | Evidence |
|---|---|---|---|
| R-29 | `src/board/mappedLayout.ts:92-98` (filing), `:129` (`storiesOf` returns `orphans` for the orphan column), `:130` | Reproduces | Feature FT-02.1 under a missing EP-02 with two stories: Mapped placed EP-01 and FT-02.1 only; both stories got no placement, so no node and no search hit (`BoardView.tsx:190-200` builds hits from placements). Freeform's `autoLayout.ts:52-62` stacks an orphan's descendants. |
| R-86 | `shared/move.ts:72-81` (`siblings` order-sorted, `peers` live-first), `mappedLayout.ts:204` | Reproduces | Retired US-01.1.1 (order 1), live .2 and .3; dropping a story from another feature at the foot (index 3) wrote order 2 for it and renumbered .2 and .3: it lands above both live stories, 3 files rewritten. Dropping live .3 back in place (index 1) in a stack holding a retired card between them rewrote 2 files. |
| R-113 | `mappedLayout.ts:110-114` (hidden epic or feature gets no column), `graph.ts:31` (`isShown` exempts only the open card), `BoardView.tsx:179` | Reproduces | Live story under a retired feature, open, retired hidden: only the epic was placed. Merged sub-finding: when an epic with features has one direct story, the drag's hit-test layout (`BoardView.tsx:241-244`, without the dragged card) has no direct column (`mappedLayout.ts:115`), so a drop back where it started lands in a feature column. Confirmed by reading. |
| R-114 | `graph.ts:66`, `mappedLayout.ts:142-165`, `BoardView.tsx:343-358` | Reproduces | An MVP story with MVP collapsed is in `collapsed` and drawn hidden; no exemption for the open card, so "Show on board" pans to an empty strip. |
| R-115 | `BoardView.tsx:399-414` | Reproduces | `onCanvas` is true for any element inside `.react-flow`: lane toggles, lane names, lane menu items, Add lane, add slots and the view controls (`BoardMinimap` and `LaneHeaders` render inside `<ReactFlow>`). Enter there is `preventDefault`ed and focus jumps to the panel. Arrow keys on those controls also walk the tree. |
| R-116 | `BoardView.tsx:311-324` (`centreOn`, default zoom `max(zoom, 0.9)`), `:351-358` (selection effect, 80 ms, current zoom), `:405-409`, `:515-519` | Reproduces (by reading) | Arrow walk and search Enter start a 450 ms ease to 0.9; 80 ms later the selection effect sees the card still off screen and re-targets at the mid-ease zoom. |
| R-117 | `BoardView.tsx:320`, `mappedLayout.ts:117` | Reproduces (by reading) | `centreOn` centres the card's midpoint; an epic of eight features is about 2,100 flow px wide, so its title sits under the panel. `inView` (`:327-339`) already counts only `CARD_PEEK` (240 px) of a wide card. |
| R-118 | `BoardView.tsx:410-418`; sibling lists from `store.ts:443-458` | Reproduces (by reading) | One sibling list per parent mixes an epic's features and direct stories, in file order, not the order either mode draws (live first; Mapped by lane). |
| R-119 | `mappedLayout.ts:135-137`, `LaneHeaders.tsx:123`, `store.ts:304-314` (`renameLane`), `shared/move.ts:142-154` | Reproduces | `swimlane: mvp` with lane MVP gives a separate band `mvp` flagged unknown; `swimlane: Unassigned` gives a second "Unassigned" band. "Add as a lane" appends a case-duplicate (refused by `laneListProblem`), and renaming the band onto `MVP` appends `MVP` again (refused). |
| R-120 | `LaneHeaders.tsx:81-84`, `:165`; `store.ts:631` (`collapsedLanes` by name) | Reproduces (by reading) | Rename and delete never touch `collapsedLanes`; the renamed lane reopens and a later lane with the old name starts collapsed. |
| R-126 | `OutlineView.tsx:60-65`, `:139`, `:189-196` | Reproduces (by reading) | While searching rows render expanded, but the twisty still calls `toggle`, which writes the persisted set. Keyboard ArrowLeft/Right already refuse while searching (`:77`). |
| R-127 | `AboutView.tsx:18-22`, `:36-41` | Reproduces (by reading) | The scroll effect is keyed on `s`; a TOC link to the section already in the URL changes nothing, so nothing scrolls. |
| R-128 | `QuestionsView.tsx:20`, `:107-112`; `questionWalk.ts:21-31` | Reproduces (by reading) | When the chosen owner leaves every question, the select shows "All owners" (React shows the first option), the filter still applies, and choosing "All owners" fires no change. |

Related, not owned: R-10 and R-11 (B03) are the crash paths on the same data; B03 also places
Freeform's cycle members in its orphan stack (`src/board/autoLayout.ts`, B03 under touch rights).
R-122 (B03) is Outline's version of R-29.

Assumption: status `5` is retired in the default config, as `tests/move.test.ts` uses it. The
scratch scripts are in the author's scratchpad, not the repo; the execution agent re-runs the
reproductions as failing tests.

## Detailed requirements

### B11-REQ-01 · Every card is placed on the Mapped board (R-29)

- Every item in the catalogue gets a placement in Mapped and so a node, a minimap block and a
  search hit when it matches, whatever its parent chain: a card whose parent is missing or of the
  wrong type, and everything under such a card, at any depth.
- An orphan is drawn with what hangs under it, so the hierarchy still reads (Candidate: stack each
  orphan followed by its descendants, as `autoLayout` does, or give an orphan feature a column of its
  own). How descendants of an orphan relate to lanes is an implementation choice, provided no two
  cards overlap, lane heights and counts stay right, and the add slots stay only on real columns.
- The walk that collects an orphan's descendants is cycle-safe. In Mapped, cards caught in a parent
  cycle that no epic reaches are placed too (Freeform's equivalent is B03's and is preserved).
- Cards in the orphan column stay out of drop targets as today (a drop never gives a card a null
  parent).

### B11-REQ-02 · The open card is always drawn (R-113, R-114)

- The open card (`?item=`) and its ancestors are drawn in both modes whatever the Retired toggle
  says, so a live story under a retired feature has its column in Mapped and "Show on board" lands
  on it. Ancestors drawn this way keep their retired styling. Other retired cards stay hidden, and
  a hidden epic or feature still takes no column when nothing under it is open.
- The open card is drawn when its lane is collapsed. Whether that expands the lane (and whether
  that expansion is remembered) or draws the card alone in the collapsed strip is **B11-Q1**; either
  way the card is visible, centred and hit-testable, and lanes never overlap.
- Opening a card by click, "Show on board" (`?focus=`), the arrow keys and search all satisfy this.

### B11-REQ-03 · A drop lands where the bar showed (R-86, R-113 merged sub-finding)

- The slot a Mapped drop is planned into is counted among the same cards, in the same order, as the
  stack the board draws and the drop bar marks. A card dropped at the foot of a stack holding a
  retired card lands below every live card (and above the retired ones, which stay at the end), with
  or without Show retired.
- A drop that leaves a card in the place it is drawn in writes nothing ("drop back in place"),
  whatever retired cards sit between its neighbours.
- The only direct story of an epic that has features can be dropped back into the epic's own
  column; that drop writes nothing.
- The drag preview (`applyMove`) and the committed change agree.
- Candidate: count slots among live peers only (FINDINGS R-86).

### B11-REQ-04 · Enter and the arrows act on the focused control (R-115)

- While a card is open, Enter, Space and the arrow keys on any button, link, menu item, input or
  other interactive control inside the canvas (lane toggle, lane name, lane menu and its items, Add
  lane, add slots, the view controls and minimap) do that control's own job, and the board neither
  walks the tree nor moves focus to the panel.
- The walk and "Enter moves into the panel" still work when focus is on the page, the canvas pane or
  a card.

### B11-REQ-05 · Walk and search land the card at one zoom, title in view (R-116, R-117)

- An arrow-key step and opening a search hit land the card at the zoom the board promises for them
  (today at least 0.9, or the current zoom if closer in), every time, whatever the starting zoom and
  whether or not the card started on screen. No follow-up pan re-targets a board-initiated ease.
- A card wider than the visible board (a wide epic) is placed so its left edge and title are in view
  right of the panel; a card that fits is centred as today. After any centring, the card counts as
  in view by the board's own test, so no second pan follows.
- Clicking a card never changes the zoom (it only pans when the panel covers the card), and "Show
  on board" keeps its own zoom of 1. Reduced motion jumps rather than eases. Pan limits still apply.

### B11-REQ-06 · The arrow keys walk the cards as drawn (R-118)

- Left and Right step among cards of the same type under the same parent (epics among epics,
  features among an epic's features), in the order the current mode draws them.
- Up and Down from a story step through the stories drawn in its column, in on-screen order: the
  epic's direct stories never mix with its features. In Mapped that order runs lane by lane, top to
  bottom, live first within each lane; in Freeform it is the stack order (live first), not dragged
  positions. Up from the top story goes to its parent; Down from a feature or epic goes to the first
  card drawn under it.
- The walk only steps onto cards on show (retired hidden ones stay skipped). How it treats stories
  in a collapsed lane is **B11-Q3**, consistent with B11-REQ-02.

### B11-REQ-07 · Lanes can be repaired on the board (R-119)

- A band whose name matches a lane except in case, or matches the first lane's name, offers a fix
  that works: its stories join the existing lane in one action (their `swimlane` set to the lane's
  exact name, or removed for the first lane), and the lane list gains no duplicate.
- Renaming any band (named lane or "not a lane" band) onto an existing lane's name, in any case,
  merges into that lane rather than being refused or making a duplicate; renaming onto the first
  lane's name moves its stories to the first lane. A rename to a genuinely new name works as today.
- Whether a case-variant band is still drawn as its own flagged band until fixed, or folded into the
  matching lane on display, is **B11-Q2**. Whatever is chosen must agree with the catalogue check,
  which warns on a `swimlane` that is not exactly a lane name (`shared/check.ts:121`).
- The merge is built on B05's one-write lane route and the store's `renameLane` as B05 wires it
  (R-56). B05's route refuses a rename that breaks a lane rule, and a case-insensitive duplicate is
  such a breach, so B11 extends that route under touch rights (accepted decision 7) with a merge
  form: the stories of the source band move to the target lane and the source name leaves the lane
  list, in one write that succeeds or fails whole. B05's guarantees for every other rename and
  delete stay as B05 leaves them. A refused or failed write leaves stories and lanes as they were
  and shows the existing "Lane not renamed" problem.

### B11-REQ-08 · Collapsed state follows lane renames and deletes (R-120)

- Renaming a collapsed lane on the board keeps it collapsed under its new name; deleting a lane
  drops its collapsed state. A lane later created with an old name starts open.
- Merging per B11-REQ-07 leaves the target lane's state as it was.
- Collapsed lanes stay a per-browser preference (README "Mapped"), not a catalogue fact. They are
  read and written only through B03's shared browser-storage rule for the view preferences
  (B03-REQ-06.2), never a separate reader, parser or fallback of B11's own: a damaged or wrongly
  shaped saved value falls back as that rule says. Whether stale keys left by renames made outside
  the board (an agent editing `board-layout.json`) are pruned is **B11-Q4**; if pruning is chosen,
  it is built on the same rule and keeps B02's R-46 rule for the same preferences (never prune
  while the source list is damaged or not yet loaded).

### B11-REQ-09 · Outline's twisty never changes hidden state while searching (R-126)

- While a search is active, clicking a row's twisty does not change the persisted collapse state.
  It is either hidden or visibly inert (Candidate: FINDINGS R-126); it must not look clickable and
  do nothing.
- After clearing the search, every row's collapse state is what it was before the search began
  (apart from the explicit bulk buttons; see **B11-Q5**).
- Preserved: the search view shows matches and their ancestors fully expanded, ArrowLeft and Right
  stay inert for collapse while searching, and the rule applies equally to the "Without a parent"
  group B03 adds for R-122.
- The Outline collapse set is read and written only through B03's shared browser-storage rule
  (B03-REQ-06.2); B11 adds no reader or writer of its own beside it.

### B11-REQ-10 · About's table of contents always scrolls (R-127)

- Clicking any TOC link scrolls that section into view, including the section already named in the
  URL, after the reader has scrolled away.
- Preserved: `/about?s=<section>` deep links from cards and other views open scrolled to the
  section; Back and Forward keep working; the in-page skill links (`jump`) keep their smooth scroll.

### B11-REQ-11 · The owner filter shows the filter applied (R-128)

- The owner control always displays the owner filter in force. If the chosen owner no longer owns
  any question, the list either keeps showing that owner as the selected value, so choosing "All
  owners" clears it, or resets to all owners; it never shows "All owners" while filtering.
- The question sheet's `‹ n of N ›` stepper (`questionWalk`) follows the same filter as the list.
- Preserved: question filters are not persisted (a reload starts afresh); the kind filter and
  search are unchanged.

### Preserved behaviour (must not regress)

From `DESIGN.md` ("Interaction", "Board modes"), `README.md` ("Mapped"), `CHANGELOG.md` and the
tests named under Acceptance:

- Retired cards keep their place at the foot of their stack, so toggling Retired never reflows the
  rest; a hidden feature gets no column or add slot (`mappedLayout.test.ts`), except as B11-REQ-02
  requires for the open card's lineage.
- `planMove`: only `parent`, `order` and `swimlane` change; IDs never change; the slot counts among
  lane-mates; a lane-only change writes only the lane; destination siblings renumber 1..n and the
  source keeps its gaps; an invalid drop springs back; undo restores every rewritten field
  (`move.test.ts`, `board-mapped.spec.ts`).
- Mapped: one strip; the first lane is headerless while it is the only lane, then shows as
  Unassigned (or its `firstLane` name) first; renaming the first lane rewrites no story; a story
  naming no lane gets a band flagged "not a lane"; lane deletion asks in a popover with Keep lane
  focused; the open card's lineage alone is joined by lines, none mid-drag.
- Keyboard: one window listener for the board's life; `/`, Ctrl F and Cmd F focus board search, and
  Ctrl F finds in the open card instead; Esc clears a standing search and closes the panel; Cmd Z
  and Cmd Shift Z undo card moves except in fields and sheets; nothing walks while typing or while a
  question modal is open; lane name input keeps Enter and Esc for itself.
- Search: arrows find a hit without opening it, clear of the panel and the list; Esc returns the
  board to where it was (`board-search.spec.ts`).
- The panel floats over the board; opening or closing a card never moves the map unless the card
  is covered (`board-mapped.spec.ts`); pan limits hold at every zoom; motion respects reduced motion.
- Outline: roving tabindex, collapse state per browser, search expands matches and ancestors.
- What earlier phases put in the files B11 reworks: B07's node and `data` identity reuse in
  `graph.ts` and `BoardView` (B07's `tests/graph.test.ts` cases stay green, and a catalogue event
  still re-renders only the cards it changed); B03's error boundary, cycle guards and Freeform
  placement of cycle members; B05's lane route guarantees and the store's one-write `renameLane` and
  `deleteLane`; B03's "Without a parent" Outline group and unknown-status Questions group.

## Dependencies and handoffs

**Consumed:**

- **B03:** cycle-safe `descendantsOf` (R-10) and `canParent` that tolerates an unknown type (R-11),
  both used by the board's lineage, drag and layout; Freeform placement of cycle members; the error
  boundary round the board; Outline's orphan group (R-122), which B11-REQ-09 must cover; the
  unknown-status group in Questions (R-121), which B11-REQ-11 sits beside; the shared
  browser-storage rule (B03-REQ-06.2), on which B11 builds the collapsed-lane preference
  (B11-REQ-08), the Outline collapse set (B11-REQ-09) and any change to the board viewport store.
- **D-06 (B03):** where bad data the canvas meets is reported. B11 adds no new issue surface: cards it
  newly places (orphans, cycle members) are already reported by the catalogue check (`check.ts:107-115`,
  and B03's cycle issue). If B11 finds data it still cannot place or walk, it reports it through the
  D-06 surface, never a silent omission or a crash.
- **B05:** the one-write lane route and the store's `renameLane` and `deleteLane` wired to it (R-56),
  and the lane-list rule (R-55). B11-REQ-07's merge form extends that route; it is not a second path
  beside it.
- **B07:** the final store sync, layout save queue and node and `data` identity reuse in `graph.ts`
  and `BoardView`. B11 does not edit the sync or save queue, and keeps the identity reuse wherever it
  changes how nodes are built.

**Owned outputs:** the behaviours above, their tests, the merge form of the lane route with its
all-or-nothing proof, the DESIGN.md lines whose wording a board rule change affects (arrow walk, the
open card in a collapsed lane, lane merge; convention 12), and 13 dispositions.

**Shared files** (PLAN.md "Shared files and sequencing"; touch rights, convention 11): B11 is the
last app phase before B14 in each of these rows and builds on the shape earlier phases leave:
`server/catalogueApi.ts` (lane merge, after B05 and B07), `src/store.ts` (lane merge and collapsed
lanes only; not sync, filters or layout saves), `shared/move.ts` (after B03's `canParent`),
`src/views/BoardView.tsx`, `src/board/graph.ts` and `src/board/autoLayout.ts` (after B03 and B07),
`OutlineView.tsx`, `QuestionsView.tsx` and `questionWalk.ts` (after B03), and `AboutView.tsx`
(before B14). Every edit outside B11's own territory is named in its PROGRESS entry.

**Integration proof owner:** B11 proves its own findings; B15 re-runs the board e2e suite.

## Acceptance and evidence

Unconditional checks. Every proof below must fail on the code before the fix and pass after it
(convention 13): a test is shown failing at the starting HEAD, and a manual check is recorded with
its before and after result. Each fixable finding gets a test where a unit or e2e test is practical;
camera and keyboard behaviour also gets a recorded manual check. The test tooling is the execution
agent's choice within the existing Vitest and Playwright setup.

| Finding | Proof obligation |
|---|---|
| R-29 | A layout test: an orphan feature (missing parent, and wrong-type parent) with stories at two depths and in a named lane; every item is placed, none overlap, lane counts include them. A cycle not reached from an epic is placed too. A search for one of the stories finds it on the board (unit or e2e). |
| R-86 | Move tests: foot drop into a stack holding a low-order retired card lands after every live card, with Show retired on and off; drop back in place with a retired card between neighbours returns no changes; preview equals commit. Existing `move.test.ts` cases still pass. |
| R-113 | Layout or graph test: open live story under a retired feature, retired hidden, gets a placement and its ancestors are drawn; nothing else retired is drawn. Test for the merged sub-finding: dropping an epic's only direct story back writes nothing. Manual: "Show on board" from the sheet on such a story centres it. |
| R-114 | Test: the open card in a collapsed lane is drawn and placed without overlapping the next lane (per B11-Q1's answer). Manual: "Show on board" on an MVP story with MVP collapsed shows the card. |
| R-115 | E2e or manual: with a card open, Tab to "Add lane" and press Enter: the text box opens and focus stays in it; Enter on a lane toggle collapses it; arrows on a lane menu item do not change the open card. Enter with focus on the canvas still moves focus to the panel. |
| R-116 | Manual (and e2e if stable): from zoom 0.3, search a far card and press Enter: the board ends at 0.9. From zoom 0.3, ArrowRight to an off-screen sibling: ends at 0.9. Clicking a card never changes the zoom. With reduced motion, the same end states. |
| R-117 | Manual: ArrowUp from a feature to an epic of eight or more features: the epic's title is visible right of the panel and no second pan follows. A narrow card is still centred. |
| R-118 | Test of the walk order (pure if the planner extracts it, else e2e): an epic with features and direct stories, retired shown, two lanes; ArrowDown from a direct story never reaches a feature; Up and Down follow on-screen order in both modes. Manual keyboard pass in Mapped and Freeform. |
| R-119 | Tests: `swimlane: mvp` with lane MVP, and `swimlane: Unassigned` with the first lane Unassigned: the fix moves the stories into the lane in one write, the lane list has no duplicate, the check is clean afterwards. Renaming a band onto an existing lane in another case merges. API-level and board-level: a merge whose write fails part way (for example a damaged `board-layout.json`) leaves every story file and the lane list unchanged; B05's own lane-route tests still pass. |
| R-120 | Test or e2e: collapse MVP, rename it to Now: Now is collapsed; delete Now; add a lane called MVP: it starts open. The collapsed state survives a reload; a damaged saved value falls back as B03's storage rule says; a code check shows `collapsedLanes` read and written only through that rule. |
| R-126 | Test or e2e: collapse an epic, search, click (or try to click) a twisty, clear the search: collapse state equals the state before the search, in the page and in `localStorage`. A code check shows the Outline collapse set read and written only through B03's storage rule (B03-REQ-06.2). |
| R-127 | E2e or manual: open `/about?s=skills`, scroll to the top, click "Skills" in the TOC: the section scrolls into view. A deep link from a card still lands on its section. |
| R-128 | Test or e2e: choose an owner, then remove that owner from every question (file edit or sheet): the control never reads "All owners" while the list is filtered, and the stepper agrees with the list. |

**Prohibited regressions:** every item under "Preserved behaviour"; the board unit tests
(`autoLayout`, `graph`, `mappedLayout`, `move`, `panLimits`, `trackpad`, `shownIndex`, `camera`,
`questionWalk`, `store`), including the node and `data` identity cases B07 adds to
`tests/graph.test.ts` and the lane-route tests B05 adds, and `e2e/board-mapped.spec.ts`,
`board-search.spec.ts`, `board-edges.spec.ts`, `question-step.spec.ts` still pass, with any changed
expectation justified in IMPLEMENTATION.md against this SPEC. `npm run verify:board` green.

**Awaiting decisions:** R-114's exact observable (B11-Q1), the R-119 display rule (B11-Q2), walk
into collapsed lanes (B11-Q3), stale-key pruning (B11-Q4), bulk buttons while searching (B11-Q5).
Each proof above is written so it holds for either answer except where the question is named.

## Deferred decisions for execution planning

None owned from the shared register. Consumed: **D-06** (B03), which must be recorded under
"Accepted decisions" in [PROGRESS.md](../../PROGRESS.md) before B11 builds.

B11's own questions are all still open (none is answered by PLAN.md or the accepted decisions).
Owner **B11**, resolved with the user in B11's implementation-planning conversation and recorded in
PROGRESS.md; no other phase waits on them. Settled by PLAN.md and so not asked: who places Freeform
cycle members (B03, accepted decision 10), who wires the store's lane rename (B05, accepted decision
7), and whether B11 may extend B05's lane route (yes, accepted decision 7).

| ID | Question | Affects | Gate | Boundary / acceptance impact |
|---|---|---|---|---|
| B11-Q1 | When the open card's lane is collapsed: expand the lane (remembered, or only while the card is open), or draw the card alone in the collapsed strip? | B11-REQ-02, R-114 | Before building REQ-02 | Whether opening a card can change a per-browser preference; R-114's test shape |
| B11-Q2 | A band differing from a lane only in case (or naming the first lane): keep it as its own flagged band until fixed, or fold it into the lane on display? Folding would disagree with the check unless the check changes too. | B11-REQ-07, R-119 | Before building REQ-07 | A display fold also needs a minimal edit to the swimlane rule in `shared/check.ts`, which B11 makes under touch rights (convention 11) on B04's shape; keeping the band needs only the fix action |
| B11-Q3 | Should the arrow walk skip stories in a collapsed lane, or step into them (revealing them per Q1)? Should Left/Right on a story keep stepping within its column, as today, or move to the next column? | B11-REQ-06, R-118 | Before building REQ-06 | Walk test expectations; DESIGN.md wording |
| B11-Q4 | Prune collapsed-lane keys that name no current lane (left by renames outside the board), or keep them? | B11-REQ-08, R-120 | Before building REQ-08 | Pruning loses the state of a lane that is briefly absent during an external edit; any pruning uses B03's storage rule (B03-REQ-06.2) and B02's R-46 guard |
| B11-Q5 | While searching Outline, should "Expand all", "Collapse to epics" and "Features only" still change the hidden collapse state, be disabled, or be hidden? Same class as R-126 but explicit user intent. | B11-REQ-09 | Before building REQ-09 | Scope of R-126's fix; not required to close R-126 |

**Answered 2026-11-20 (PROGRESS.md accepted decision 25):** Q1 the open card is drawn alone in the
collapsed strip (the preference never changes); Q2 the case-variant band stays its own flagged band, with
a "Move into" fix (from evidence; `shared/check.ts` untouched); Q3 the walk skips collapsed lanes (but the
open card drawn there), Left and Right stay in the column; Q4 stale collapsed keys are kept (no pruning);
Q5 the bulk buttons are disabled while searching. R-128's form: a picked owner stays listed.

## Risks and recovery requirements

- **Camera timing is fragile.** R-116 and R-117 touch the selection effect, `centreOn` and `inView`,
  which also serve search peeks, "Show on board" and panel opening. Recovery: the preserved camera
  behaviours above are re-checked by hand after the change, and `board-search.spec.ts` and the
  panel test in `board-mapped.spec.ts` stay green.
- **Layout changes ripple into drops.** REQ-01 to REQ-03 change what `mappedLayout` returns, which
  `dropTarget`, the drag preview and the minimap read. The hit-test layout and the drawn layout must
  agree, or drops land in the wrong slot. Required: every drop test runs against the same layout the
  board draws.
- **Lane merges rewrite many files.** A merge in REQ-07 may rewrite every story in a band. It must be
  one write that succeeds or fails whole (B05's protocol), and undo semantics for lane edits stay as
  documented (lane edits are not in card-move history).
- **Real catalogue.** No fix changes requirement content. A lane merge on the real catalogue is a
  user action on the board, not a migration the phase runs.
- **Undoing earlier phases' work.** `server/catalogueApi.ts`, `src/store.ts`, `graph.ts`,
  `BoardView.tsx`, `QuestionsView.tsx` and the Outline view carry B03, B05 and B07 work. B11 starts
  from their landed shape, keeps their tests green, and runs alone in the serial order (convention
  10: after B10, before B14). Rollback is per commit on a local branch merged to master.

## Execution and handoff obligations

1. Read PROGRESS.md in full (conventions 1 to 14 and the accepted decisions), this SPEC, the owned
   findings in FINDINGS.md, and the B03, B05 and B07 PROGRESS entries. Confirm B03, B05 and B07 are
   COMPLETE and D-06 is accepted; stop if not.
2. Reconfirm the starting point: re-run each reproduction at the current HEAD, update the evidence
   table in IMPLEMENTATION.md, and give any finding that no longer reproduces the disposition **Not
   reproducible at HEAD** with that evidence.
3. Resolve B11-Q1 to B11-Q5 with the user and record the answers in PROGRESS.md before building the
   requirements they gate.
4. Write `phases/B11-board-canvas-and-views/IMPLEMENTATION.md` before building: approach per
   requirement, resolved questions, bites, the tests and manual checks, and recovery.
5. Build and verify in bites; show each proof failing before its fix and passing after it
   (convention 13); never stage mid-phase (`mv`/`rm`, not `git mv`/`git rm`).
6. Bump the board version (minor: user-visible board behaviour) in `requirements-board/package.json`
   and its lock file, and add a CHANGELOG entry describing each behaviour change in user terms
   (convention 5).
7. Update the doc lines that describe behaviour B11 changes (DESIGN.md "Interaction" and "Board
   modes", README "Mapped", and the About page if it states such a rule; convention 12).
8. `npm run verify:board` green; touched Playwright specs pass on a free port (convention 6).
9. Run the three review lenses (quality and maintainability, completeness against this SPEC, bugs and
   correctness) with independent subagents; verify and fix confirmed findings; re-run checks.
10. Record every owned finding's disposition: **Fixed** (with its test or manual check), **Not
    reproducible at HEAD** (evidence), **Won't fix** (user accepted, reason) or **Moved** (named
    owner, recorded in PROGRESS.md and both SPECs).
11. Commit by path on master or a local branch merged back; never push. Write the PROGRESS.md entry
    last: what shipped, dispositions, answers to B11-Q1 to Q5, every edit made in another phase's
    file under touch rights (convention 11: at least `server/catalogueApi.ts` and `src/store.ts`),
    the doc lines changed listed under **Doc facts** (convention 12), and any fact B14 or B15 needs.
