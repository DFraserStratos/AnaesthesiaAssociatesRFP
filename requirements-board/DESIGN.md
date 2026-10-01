# Requirements Board: design north star

Read this before changing anything visual in `requirements-board/`. These are settled decisions
from working with the product owner; extend them, don't relitigate them. (The prototype's own
design rules in `docs/design/` govern `aa-prototype/`, not this tool.)

## Philosophy

- **A working wall, not a database.** The job is to see the shape of the requirements, read them,
  and fix them fast. One analyst plus AI agents use it. Calm, clean, quick.
- **Names over codes.** People think in titles, not IDs. The title is always the first and
  biggest thing. IDs exist for agents, files and citations, so they stay out of the way: in the
  bottom right of the item sheet, in tooltips, and searchable, but never as a label.
- **Every mark earns its place.** If a detail doesn't help someone decide or act at a glance, it
  moves into the item sheet or goes. Cards carry the least; the sheet carries the rest.
- **Show only what's worth noticing.** Baseline states stay unmarked (a Proposed status, the baseline,
  shows no pill on a card). A mark should mean "look at this".
- **Hierarchy by colour and size together.** Epic, feature and story must read differently from
  across the room: colour says the type, size says the level.

## Fixed visual language

**Type colours (after Azure DevOps). Used everywhere an item is named.**

| Type | Accent | Where it shows |
| --- | --- | --- |
| Epic | orange `#E06C00` | card top rule (thickest), type icon, lineage pill, minimap |
| Feature | purple `#773B93` | card top rule, type icon, lineage pill, minimap |
| Story | blue `#009CCC` | card top rule (thinnest), type icon, lineage pill, minimap |

Tokens live in `src/styles.css` (`--ty-*`, set per element by the `ty-epic|feature|story`
classes). Always pair an item's title with its `TypeIcon` (or use `ItemName`) outside its own sheet.

**Status is always a labelled pill, never an item's main colour.** The type owns the card's colour;
status is a small tinted pill (`StatusLabel`). No status colour may share a hue with a type:
Future was moved off purple for this reason. Proposed, the baseline, takes the calm neutral grey
(`BASELINE_STATUS` in `src/vocab.ts`). Verify (answered, still to check) takes olive, between Open's
amber and Confirmed's green. Where an item came from is its sources, never its status.

**Sizes carry level.** Epics are wide bars spanning their features; features are taller cards
(168px); stories are compact (112px). Keep features visibly taller than stories.

**Other fixed choices:** the Freeform canvas is the faint teal-grey grid of an anaesthetic chart, one 80px
ruling kept low enough in contrast that cards read cleanly over it (Mapped uses the same paper without the ruling: see Board modes); type is
Hanken Grotesk for everything, JetBrains Mono only for genuine codes; sentence case; teal
`#0D6E63` is the only action colour; AA crimson only for the wordmark; no en or em dashes in any
UI copy (use a middot, a comma or "to").

## Cards

- Top line: the title. No ID, no component codes.
- Description excerpt below (always on features and epics; stories show it when zoomed in).
- Bottom left: open-question badge and screenshot badge; epics also show their item count.
- Bottom right: status pill, only when the status is not the Proposed baseline.
- Semantic zoom keeps cards readable: far out shows bigger titles only; the overview shows epic
  names large and stories as status-tinted blocks.

## Item sheet

The same sheet serves as the board's docked panel (its head and foot stay put while the body
scrolls) and as the modal elsewhere.

- Top: the lineage as arrow pills that slot into each other (epic, then feature), in type colours,
  titles only, clickable. The current item is not in the chain; its title is the heading.
- Then the title, description, acceptance criteria, technical discussion, notes, open questions,
  children, screenshots, related. Empty sections are not shown. Cards never show acceptance criteria or
  technical discussion; their excerpt is the description only.
- **Links in the text** to another card keep the author's words in ink with a teal underline
  (teal is the action colour) and open that card in place. A bare ID in the text reads as the
  card's type icon and title, never the code; a question's shows the question mark in Open amber.
  A link to a retired card is muted with a dotted underline; one to nothing is grey with a dotted
  red underline and says so in its tooltip.
- **Related** sits under the screenshots: the relations either card stores, as the same rows as
  the children list (name, then status pill), then a quiet "Mentioned in" subhead over the cards
  whose text mentions this one. Outgoing text links are not repeated there, since the text already
  shows them.
- Footer (read mode): Find on board, **History**, Retire, Delete, then Edit on the right. Delete asks
  over the veil, naming what goes with the card (its features and stories) and the records whose links
  to it are removed, and points at Retire for keeping a record. History swaps the
  body for the card's timeline, read like the chart's time column: times in a left gutter, a
  trace beside them with one mark per change (filled: the board, ring: an edit on disk, square: a
  git commit), commits ruled across like hour lines, day headings on the trace. Changes not
  committed yet turn the trace amber under one "Not committed yet" label. Rows are sentences
  ("Moved from <feature> to <feature>" with type-coloured item chips, status pill to pill), and
  Markdown fields are a "+2 −1 lines" disclosure over a line diff; a re-captured screenshot is a
  "Screenshot updated" disclosure over its before and after, side by side, each opening full size.
  The footer then holds only Back to card.
- Bottom: **Status** (the pill alone, pressable without Edit: a quiet chevron in the pill, and a
  small menu opens upward listing each status pill beside a line on what it means; picking one
  saves at once, and Retired still asks first, as the Retire button does), **Swimlane** (stories in a named lane only; Unassigned is the
  baseline and stays hidden), **Area** (component), **Sources**, and the ID quietly in the bottom right. Clicking the ID copies
  a link to the card ("Link copied" for a moment); pasted over selected words in any Markdown field
  it makes them a link to that card, and Cmd+K over a selection picks the card by title. The
  question sheet's ID does the same.

## Interaction

- One click opens a card: its sheet docks as a panel on the left (a third of the width by
  default, the board two thirds; resizable, width kept per browser) and the board stays live on the right with the card's
  lineage lit. The panel floats over the board rather than narrowing it, so opening or closing a
  card never moves the map; the board's search and lane names step right to clear it. Clicking another card, or walking with the arrow keys, swaps the panel; Esc or a
  click on empty canvas closes it. No double-click anywhere.
- **Search** (Ctrl F, Cmd F or `/`) fades the board to the matches and lists them under the box,
  title matches first, each row the name with the words found, then where it sits (or, when only its
  text matched, the line it was found in). The arrow keys walk the list and the board finds each card
  without opening it: it pans the card clear of the panel and the list, and a teal ring closes in on
  it. Enter or a click opens it; Esc takes the board back to where it was and clears the search (on
  the board too, with the card closing as usual).
- One round teal plus, bottom right of every view (or `n`), makes any card: epic, feature, story or
  outstanding item. It asks only for the type, the title and where it sits (a searchable parent, or
  what an outstanding item affects), starting from the open card, then opens the new card in Edit.
- Outline and Outstanding items open the same sheet as a centred modal. A question opened from the
  board's panel sits over the panel as a modal and closing it returns to the panel.
- A question opened from Outstanding items steps `‹ n of N ›` through the list as filtered, in its
  group order. One answered in the sheet keeps its old place while open, so Next goes to the next
  question still open.
- Unsaved edits are never lost silently: every way out of a sheet asks, and drafts survive
  navigation.
- The board never raises a browser dialog. A sheet asks in its own frame: it veils its content
  (`SheetConfirm`) and puts the question there, with the safe answer as the filled teal button
  that holds focus and the consequence named on the other ("Discard changes", "Retire item"). On
  the canvas the question is a popover under the button that raised it ("Tidy all"). Escape
  withdraws the question either way.
- Navigating the canvas: two fingers on a trackpad pan it, a pinch zooms; a mouse wheel zooms (the
  board tells them apart itself: `src/board/trackpad.ts`); dragging empty canvas pans. A pinch
  never zooms the page itself, wherever it lands (masthead, panel, list views): only the board
  zooms. Keyboard zoom (Cmd plus, Cmd minus) is left to the browser.
- **The board is bounded, not an infinite whiteboard.** However it is panned, a map edge comes in no
  further than the middle of the visible board (right of the docked panel), at every zoom, so the map
  can never be scrolled off screen (`src/board/panLimits.ts`).
- **View controls**, bottom right in both modes, beside the new-card plus (never up in the toolbar,
  so the pointer stays in one corner): a small bar of two buttons centred on the plus. The **map
  button** opens the minimap to the left of the bar while the pointer rests on it; the pointer can
  slide straight across onto the minimap without it closing (the two are one hover zone with no
  gap), and it closes a moment after the pointer leaves both, with short open and close delays so it
  never flickers. Pressing the map button pins it open (pressed state) or unpins it. The **zoom
  toggle**: a zoom-out glass fits the whole map, then, until the view moves, a zoom-in glass takes it
  back to where it was (or to 100% if it was no closer in). No other zoom buttons: the trackpad,
  wheel and pinch zoom. The minimap is the whole map in a frame that is the map's own bounds, so it
  holds still while panning, shaped like the map (a strip for Mapped). Cards are blocks in their
  type colours, lanes faint rules, the open card ringed teal, search misses faded. The part on
  screen is outlined in teal and the rest lightly veiled. Press anywhere to jump the view there;
  hold and drag to sweep along. Undo and redo are keyboard only (Cmd Z, Cmd Shift Z), with no
  toolbar buttons.
- Motion only on action (sheet open, lineage fade, pan to card); respect reduced motion. Stepping
  between records (prev/next sibling, a lineage pill, an open question) swaps the sheet's contents
  in place and skips the entrance, so the page behind never flashes through a re-fading scrim.
- Mobile is out of scope: this is a desktop tool.

## Board modes

A two-segment switch at the head of the board's right-hand controls: **Freeform · Mapped**.

- **Freeform** is the wall described above: the chart grid, connector lines, cards dragged anywhere,
  Tidy to put them back.
- **Mapped** is a user story map, read left to right in one strip, with no grid and no connector
  lines (position shows the hierarchy), except the open card's lineage: while a card is open, teal lines
  join it to its feature and epic (and to what sits under it), and they drop away during a drag. It is an open canvas of the same teal-grey chart
  paper as Freeform (bounded, like Freeform: see the pan limits under Interaction), edge to edge, without the ruling: no sheet, no tinted bands, no texture. White
  cards lift off the paper; lanes are separated by a thin rule and their headers. The backbone is the epic row, each
  epic spanning its feature columns, with the feature row beneath. Below it the swim lanes run
  across the whole map; every column stacks the stories it has in each lane.
- **Lanes are neutral bands, never a type or status colour**: a thin rule across the map and a
  small header at its top left, the name then a muted count ("MVP | 67"). Headers are part of the
  map: they zoom with it (with the same semantic-zoom steps as card titles, so they stay readable
  far out, capped at a feature title's size so they never outgrow the cards), and they stay pinned just inside the board's left edge while
  panning. Clicking a lane's name turns it into a text box to rename it (Enter
  keeps, Esc drops). The first lane holds stories with no lane: while it is the only lane it has no
  header, so the board reads as a plain map; once a lane is named it shows first, as
  **Unassigned** until renamed like any other. A story naming a lane the board doesn't have gets its own lane, flagged
  "not a lane". Lane actions (rename, move, delete) sit in a quiet menu on the header; deleting asks
  in a popover, with Keep lane as the safe, focused answer. Tidy doesn't apply and is hidden.
- **Drag feedback**: the dragged card lifts and carries everything under it; the other cards ease
  aside into their new slots as you move, and a thin teal bar marks where it will land. A drop
  nowhere valid (a feature over a lane, a story on the backbone) springs back. Click still opens;
  motion respects reduced motion.
- A faint plus sits at the foot of every column in every lane, stronger on hover: it makes an
  untitled story right there and opens it in Edit. The round teal plus still makes a story in
  Unassigned.

## Before shipping a visual change

Take Playwright screenshots of the board (near, mid and fit zoom), an item sheet, Outline and
Outstanding items (`shots/` holds local scratch scripts), and check them against this page.
