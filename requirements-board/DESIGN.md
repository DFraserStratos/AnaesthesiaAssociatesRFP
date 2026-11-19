# Requirements Board: design north star

Read this before changing anything visual in the board. These are settled decisions from working
with the product owner; extend them, don't relitigate them. The board carries no project's
branding: a project's own design rules govern its own app, not this tool, and its name appears
only beside the board's fixed name, "Requirements board" (`project.name` in `board.config.json`).
That name is quiet grey text unless the project has an **accent** (`project.accent`, picked in
Settings). Then two marks take it, and nothing else: the masthead mark's card and the tab icon's
card are filled with it. The name itself turns bold, in ink, never in the accent. The open view's
underline is ink, neither teal nor the accent: it sits right on the docked sheet's coloured top
rule, and a second colour there clashes with it. The accent is a way to tell apart
boards for different projects open side by side, not branding, and it is never a pill or chip.
Its presets stay clear of the action teal.

## Philosophy

- **A working wall, not a database.** The job is to see the shape of the requirements, read them,
  and fix them fast. One analyst plus AI agents use it. Calm, clean, quick.
- **Names over codes.** People think in titles, not IDs. The title is always the first and
  biggest thing. IDs exist for agents, files and citations, so they stay out of the way: in the
  bottom right of the item sheet, in tooltips, and searchable, but never as a label.
- **Every mark earns its place.** If a detail doesn't help someone decide or act at a glance, it
  moves into the item sheet or goes. Cards carry the least; the sheet carries the rest.
- **Show only what's worth noticing.** Baseline states stay unmarked (the default-role status, the baseline,
  shows no pill on a card). A mark should mean "look at this".
- **Hierarchy by colour and size together.** Epic, feature and story must read differently from
  across the room: colour says the type, size says the level.

## Fixed visual language

**Type colours (after Azure DevOps). Used everywhere an item is named.**

| Type | Accent | Where it shows |
| --- | --- | --- |
| Epic | orange `#E06C00` | card top rule (thickest), item sheet top rule, type icon, lineage pill, minimap |
| Feature | purple `#773B93` | card top rule, item sheet top rule, type icon, lineage pill, minimap |
| Story | blue `#009CCC` | card top rule (thinnest), item sheet top rule, type icon, lineage pill, minimap |
| Artifact | indigo `#4B56B0` | kind icon (plates, list rows, the artifact page, item sheets, links) |
| Outstanding item | Open's amber `#C0851B` | question mark (`q-mark`), a Diff review card's top rule |

Tokens live in `src/styles.css` (`--ty-*`, set per element by the `ty-epic|feature|story|artifact|question`
classes; an outstanding item is not a work-item type, so the new card picker shows it neutral). Artifacts took indigo because it is clear of every type, every status, the action teal,
and above all the red highlight box, which must stay the one red mark on an artifact. Always pair an item's title with its `TypeIcon` (or use `ItemName`) outside its own sheet.

**Status is always a labelled pill, never an item's main colour.** The type owns the card's colour;
status is a small tinted pill (`StatusLabel`). No status colour may share a hue with a type.
Colour is a status's `tone` from `board.config.json`: neutral, amber, olive, green, forest, sand or
hatched. The default-role status (Proposed here), the baseline, takes the calm neutral grey. Verify
(answered, still to check) takes olive, between Open's amber and Agreed's green; Confirmed (the client's
final sign-off) takes the deeper forest green, so Agreed and Confirmed read as steps of one family.
Where an item came from is its sources, never its status. Scope is a swim lane, not a status.

**Sizes carry level.** Epics are wide bars spanning their features; features are taller cards
(168px); stories are compact (112px). Keep features visibly taller than stories.

**Other fixed choices:** the Freeform canvas is the faint teal-grey grid of recorder chart paper, one 80px
ruling kept low enough in contrast that cards read cleanly over it (Mapped uses the same paper without the ruling: see Board modes); type is
Hanken Grotesk for everything, JetBrains Mono only for genuine codes; sentence case; teal
`#0D6E63` is the only action colour; the masthead mark is the board's own card-on-a-grid drawing,
never a project's logo (its card and the tab icon's take the project's accent, if one is set); no en or em dashes in any
UI copy (use a middot, a comma or "to").

**The masthead shows status only when something is wrong.** No "Live", no "Checks pass": one
problem pill appears at the right while there is a problem, naming it ("Offline", "3 errors", "Card
moves not saved") or, with more than one, counting them ("2 problems"). Amber while offline, since
nothing reaches the files (card moves are kept and sent when the server answers), and offline leads
its list; when the server answers again it reads "Server is back", its Connection line offering
Reload; red otherwise. It opens one list grouped as
Connection, Card moves, This page (a part of the page that failed to show, with Try again and Close
card, and uncaught errors, dismissable), Saved preferences (a browser preference that was reset,
dismissable) and Checks. A part of the page that fails shows its own quiet recovery panel in its
place too; nothing else (no toast, no banner) reports a problem. When the last problem clears, a
green "All clear" shows for about three seconds and fades. Check notes are not problems: they never raise the pill and are read under
Checks on Settings (and under the errors in the pill's list).

## Cards

- Top line: the title. No ID, no component codes.
- Description excerpt below (always on features and epics; stories show it when zoomed in).
- Bottom left: open-question badge and screenshot badge; epics also show their item count.
- Bottom right: status pill, only when the status is not the default one.
- Semantic zoom keeps cards readable: far out shows bigger titles only; the overview shows epic
  names large and stories as status-tinted blocks.

## Item sheet

The same sheet serves as the board's docked panel (its head and foot stay put while the body
scrolls) and as the modal elsewhere. Its 4px top rule is the item's type colour, as on its card; a
question's sheet, which has no type, takes its status colour. Only the rule takes the type: the sheet
carries no `ty-*` class, which would recolour the artifact marks inside it.

- Top: the lineage as arrow pills that slot into each other (epic, then feature), in type colours,
  titles only, clickable. The current item is not in the chain; its title is the heading.
- Then the title, description, acceptance criteria, technical discussion, notes, open questions,
  children, screenshots, diagrams, sources, related. Empty sections are not shown. Cards never show acceptance criteria or
  technical discussion; their excerpt is the description only.
- **Links in the text** to another card keep the author's words in ink with a teal underline
  (teal is the action colour) and open that card in place. A bare ID in the text reads as the
  card's type icon and title, never the code; a question's shows the question mark in Open amber.
  A link to a retired card is muted with a dotted underline; one to nothing is grey with a dotted
  red underline and says so in its tooltip.
- **Every artifact behind the card is grouped by what it is for**, from both its `artifacts` links and
  its `sources` (each source resolved to the spot it cites), in three sections under the text:
  **Screenshots** (the gallery), then **Diagrams** (pictures: diagrams, mockups, screenshot and photo
  artifacts; where the card sits in the wider workflow), then **Sources** (the evidence: RFP pages,
  note points, transcript lines, documents). Diagrams lists the card's `artifacts` pictures, then
  pictures its sources cite. Sources lists the source lines in the order written (oldest origin
  first), then its `artifacts` links to documents, notes and transcripts. The same spot shows once,
  and a whole artifact gives way to a spot in it already shown.
- **Rows, never chips.** Each is the artifact's kind icon and name, then the spot's name after a
  middot ("Page 27" as printed, "Point 16", a heading or region), status pill only when not Current;
  the words the card cites it by are its tooltip. A row opens the artifact at that spot, in the red
  box. A source citing several points is one row whose name opens the first and each "Point n" after
  it is its own link (teal underline). A bare `OQ-nn` is the question's row (amber question mark,
  title, status). A source that cites nothing the catalogue holds (a typed decision, an audit) is its
  words as plain text, not pressable. One that should open an artifact but finds none, or a missing
  artifact or spot, is muted with "Not found".
- **Related** sits under the sources: the relations either card stores, as the same rows as
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
- The question sheet lists its sources the same way, under **Sources**, in the order written (no
  Diagrams split).
- Bottom: **Status** (the pill alone, pressable without Edit: a quiet chevron in the pill, and a
  small menu opens upward listing each status pill beside a line on what it means; picking one
  saves at once, and Retired still asks first, as the Retire button does), **Swimlane** (stories in a named lane only; Unassigned is the
  baseline and stays hidden), **Area** (component), and the ID quietly in the bottom right (Sources
  moved up into its own section). Clicking the ID copies
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
- One round teal plus, bottom right of every view but an artifact's page (or `n`), makes any card: epic, feature, story or
  outstanding item. It asks only for the type, the title and where it sits (a searchable parent, or
  what an outstanding item affects), starting from the open card, then opens the new card in Edit.
- Outline and Outstanding items open the same sheet as a centred modal. A question opened from the
  board's panel sits over the panel as a modal and closing it returns to the panel.
- A question opened from Outstanding items steps `‹ n of N ›` through the list as filtered, in its
  group order. One answered in the sheet keeps its old place while open, so Next goes to the next
  question still open.
- Unsaved edits are never lost silently: every way out of a sheet asks, and drafts survive
  navigation. While a question sheet covers the docked panel, a way out from it goes ahead and the
  panel keeps its draft (a question it could not show is never left waiting).
- A file changed on disk while a sheet is being edited is taken in quietly when it touches only what
  the user has not changed; a field changed on both sides puts **Keep mine** and **Load theirs** in a
  banner, naming the fields. A record that vanishes with unsaved edits shows every changed field,
  readable (cards by title, statuses by name, a cleared field as "Cleared"), asks before any way out,
  and its edits come back with it. A sheet opened on a record not there yet says so without guessing
  why (and names the check's error for it) and shows the record when it appears.
- Focus: a modal sheet opened in Edit starts in its first field (the title; the answer when
  answering), otherwise on the sheet itself, which takes it back whenever what had it goes (leaving
  Edit); answering its question returns focus to where it was; closing gives focus back to what had it before (the
  first sheet's opener, after stepping through siblings), or to the page. The docked panel takes no
  focus on open.
- The board never raises a browser dialog. A sheet asks in its own frame: it veils its content
  (`SheetConfirm`) and puts the question there, with the safe answer as the filled teal button
  that holds focus and the consequence named on the other ("Discard changes", "Retire item"). The
  safe answer takes focus once, when the question appears; a file changing meanwhile moves nothing,
  and the veiled content stays unreachable. On the canvas the question is a popover under the button
  that raised it ("Tidy all"). Escape withdraws the question either way.
- Navigating the canvas: two fingers on a trackpad pan it, a pinch zooms; a mouse wheel zooms (the
  board tells them apart itself: `src/board/trackpad.ts`); dragging empty canvas pans. A pinch
  never zooms the page itself, wherever it lands (masthead, panel, list views): only the board and
  the artifact viewers zoom. Keyboard zoom (Cmd plus, Cmd minus) is left to the browser.
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
- Motion only on action (sheet open, lineage fade, pan to card, a stepped diagram's move when the
  reader steps forward, a following diagram's view framing its step); respect reduced motion. Stepping
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

## Artifacts

The diagrams, transcripts, notes and documents behind the requirements, on their own tab between
Board and Outstanding items (the count leaves out Retired ones). Agents write them; the board
edits only their details (below), never the file, its highlights or the links to it.

- **Two layouts, one switch** (Grid · List, kept per browser), both grouped by kind with a count,
  and in both one click opens the artifact's own page: the list and the grid are only ways to find
  one, never a place to read it. **Grid** is a light table: each artifact a white plate showing the
  thing itself, never cropped (a drawing whole, a PDF's first page, a Markdown document's opening
  set as a little page), its name under it, then the kind icon, a link count and a highlight
  count, its date on the right ("1 Oct 2026", "July 2026", "2021": as much as is known), and a
  status pill only when it is not Current. **List** is one row per artifact: the same picture
  small on the left, the name and up to two lines of its description, then its date, kind, the
  counts and the status pill in a fixed column on the right. Within each kind, newest first. The
  date is when the artifact was made (the meeting, the publication, the drawing), not when it was
  filed. No row expands and nothing opens beside the list.
- **The artifact page** docks a panel on the left like the item sheet (resizable, width kept per
  browser): Artifacts crumb, the name, kind and status, then tabs: a stepped diagram's **Steps**
  first (below), **Highlights** (the named spots, each marked with a tiny red box; a document's own
  pages or sections below, long lists
  folded; a row's link button copies a link to that spot, to paste over words in any Markdown
  field), **Linked** (cards that list it, with the spot each links to, then "Mentioned in" and
  outstanding items), **Details** (description, its **Sources** as rows like a card's, an artifact's own
  origin naming itself shown plain, then author, area, **Cited as** (the words sources cite it by), file
  path and size, and the ID bottom right, which copies a link), **History**. The artifact fills the rest.
- **No new-card plus on the artifact page**: the bottom right corner is the artifact's view bar
  (a drawing's or a PDF's, and a one-button bar for a Markdown document), 16px in.
- **Full screen**, the last button of that view bar, after a rule: the masthead and the panel go, the artifact fills the window,
  and the browser is asked to fill the screen (where it refuses, the window is enough). The step
  bar, view bar, find and record links all still work; a card opened from a link shows as its sheet
  over the artifact. Esc (or the browser's own exit, or the button, now Leave full screen) comes
  back with the panel as it was, its tab and any edit kept. Opening another artifact stays in full
  screen; leaving the page leaves it.
- **Edit details**, in the panel's footer as on an item sheet, swaps the tabs for a form: name,
  kind, status (and Replaced by, when Retired), date (as written, `2026-10-01`, `2026-10` or
  `2026`, read back beside the label), author, area, sources, description. Save, Cancel, Cmd S and
  Esc, the restored draft, the on-disk conflict and the discard veil all work as they do on a
  card. The file, its highlights and its ID are not in the form. If the artifact goes from disk
  while its details have unsaved edits, the panel shows them (as a card's orphaned sheet does) and
  asks before letting them go; either way full screen is left and the masthead comes back.
- **The red box** is the same mark the screenshots carry (`shared/highlight.ts`): 3px `#E0243A`
  outside the padded spot, 12px radius, soft red glow. It is the only red on an artifact; hovering
  a highlight in the panel previews it as a dashed outline. Asked for (from a card, a link, a
  highlight row), the view eases onto the spot and the box closes in once; reduced motion skips
  both.
- **Drawings** (SVG, image, mermaid) sit on the chart paper as a white sheet and pan and zoom like
  the board, but a plain drag never pans one: it selects text, which copies like any text. Two
  fingers pan, a pinch or the wheel zooms, Space or the middle button and a drag pans (an image,
  having no text, also pans with a plain drag). Unlike the board they have zoom out, zoom in and fit
  buttons, plus + - 0 on the keyboard, beside the minimap button in the same view bar, and a back
  to the highlight button when there is one. The minimap is the drawing itself, the spot outlined
  in red.
- **Stepped diagrams** (a drawing whose sidecar lists `steps`) play a flow that unfolds. The reveal
  is cumulative: each step shows more of the drawing and nothing is hidden again, so the file with
  everything visible is the finished picture, and the minimap, thumbnail, visual compare and Diff
  review always show the whole drawing. What a step highlights stays full strength, with the panel
  it sits on (a shape drawn under it and round it, so lit text on the charcoal panel still reads).
  The rest is set back: washed half way to white by a filter, which looks like 0.5 opacity on the
  white sheet but stays opaque, so a line drawn behind a dimmed card never shows through it. Half
  way, not further: a ledger's earlier entries must still read at 11 to 13px while the current step
  leads. What dims on a dark panel kept as a backdrop fades into that panel at 0.5 opacity instead,
  since a wash toward white would make it stand out. Hidden parts are invisible but still laid out, and find
  skips their text. The change fades over 250ms; reduced motion switches it off, and a drawing opened
  at a step starts there without fading in. **The drawing is never covered**: the step is read in
  the panel. On the canvas only a slim **step bar** sits bottom left, level with the view bar, in its
  style and height: `‹ 3 of 8 ›` as the question stepper, the step's name (cut short with an
  ellipsis, the group and full name in its tooltip), then a quiet Whole drawing. It stops 16px
  short of the view dock; the hover minimap, being passing, opens over its right end, drawn above
  it. With no step chosen it is one quiet control, "Step through · 8 steps". The left and
  right arrows step while the drawing or the bar has focus. A step is a spot like a highlight (in
  the URL, a link, a copy link) but never shows the red box. By default stepping leaves the view
  where it is: a drawing that fits one screen must not move as it steps. A wide flow that does not
  fit one screen opts in to **following** (`step_view: follow` in its sidecar): on arriving at a
  step (the bar, the arrow keys, the Steps tab, a link) the view frames the step's focus (what it
  highlights, else what it reveals, plus both ends of its moves) when that is not already in view,
  padded clear of the find bar, step bar and view bar: centred, at the zoom it already has if the
  focus fits there, else the zoom that fits it, never past the drawing's own size (100%). Coming
  from the whole drawing, a focus in view but under three quarters of that size is framed too, so a
  long strip fitted whole zooms in to read its first step. It eases over 560ms (reduced motion
  jumps); a link or URL at a step opens already framed; Whole drawing fits the whole again. The
  reader still pans and zooms freely, and the next step moves the view only if its focus is out of
  view. A step's moves wait for the view to settle, then fly. A **Steps** tab comes first in the panel: the steps under their group headings, numbered, each
  row a highlight row with its number where the red mark would be. The current one is ruled teal
  and opens in place to its caption as prose (record IDs link) and its balances, a small two-column
  table with amounts in tabular figures, the rows that changed at this step on a quiet teal tint in
  full weight; it is kept in sight in the panel as the steps change. Stepping never switches the
  panel's tab. The Artifacts tab counts steps beside highlights.
  **Moves**: what a step lists under `moves` travels when the reader steps forward onto it (the
  bar's next, or the right arrow), and only then: a jump from the panel or a link, stepping back,
  the whole drawing and reduced motion show the step at once. The travelling mark sets off from its
  origin's place and size and flies to its own in 700ms, eased in and out, each later move 150ms
  after the one before, at full strength and drawn above every panel on the way (its origin stays
  at full strength until it lands). It lands exactly on the static drawing, with nothing left
  behind; panning or zooming mid-flight keeps it on course, and a new step, a jump or a refresh
  cancels it cleanly. A quiet Replay in the step bar, shown only for a step with moves, plays them
  again from the step before. Moves are for what genuinely changes place, not for decoration.
- **Record IDs drawn in a diagram** (`OQ-47`, `US-06.1.1`, `AR-01`) are links, added by the board
  as it shows the drawing (the file stays plain). The ID keeps its drawn text, size and place, with
  an underline in its own ink, turning teal on hover or focus; the tooltip names the record and its
  status. A click (or Tab then Enter, which pans to it) opens the record as a bare ID in Markdown
  does: a card or question as its sheet over the page, an artifact as its page. An ID the catalogue
  doesn't have stays plain text.
- **Documents** (Markdown, PDF) scroll as pages on the chart paper: Markdown typeset like a sheet's
  prose (links to cards work), PDFs as their pages with pdf.js's text layer over them, so their text
  selects too. A PDF's view bar has the page counter, zoom out and zoom in, the two fits, and the
  thumbnails button. **The fits** act on the page in focus (the one filling most of the view, however
  far in): fit width fills the width with it, holding the middle of the view still; fit page shows
  it whole, centred (keys 0 and 9). The fit in use is pressed and follows the frame as it resizes. A
  pinch or a zoom step leaves the fits and zooms about the pointer (or the middle), holding that
  point still; one that comes to rest within a few percent of a fit settles on it. A zoom stretches
  the pages at once and draws them sharp when it holds still. **Page thumbnails** run down the right
  of a PDF of more than one page, on the soft card ground: each page in small with its number, the
  page in focus ringed teal and kept in sight as the pages scroll, a page with find matches carrying
  their count in the find yellow. Press one (or walk them with the arrow keys) to go to that page;
  the thumbnails button hides or shows them, kept per browser. **The arrow keys** go page by page
  wherever the focus is (not while typing, in the thumbnails or under a sheet): down brings the next
  page's top to the top of the view, up the page above (or this one's top, part way down it); left
  and right do too unless the page in focus is wider than the view, when they pan.
- **Find**, top right of every artifact with text (not an image), in the board search's quiet
  box: "Find in this diagram", "in this transcript" and so on, by kind. Matches are tinted the
  board search's yellow (never red, which is the highlight box); the current one is stronger,
  outlined, and brought into view (a drawing pans to it, close enough to read; a document scrolls;
  a PDF goes to its page). "3 of 26" counts them across the whole artifact, a PDF's undrawn pages
  included. The down and up arrows step through the matches, as they walk the board's search
  results (Enter and Shift Enter do too); Ctrl F, Cmd F or / jumps to the box; Esc clears the
  search and leaves the box. Case and
  line breaks don't matter.
- **History** is the card's time column; a new version of the file is a "File updated" disclosure
  over a before and after, side by side or swiped (a teal handle over the two), or as a source diff
  for a text file.

## Diff review

The catalogue compared between two versions in git, on its own tab after Outline (its count: records
changed since the last commit, minor ones left out; hidden at none). Read-only: it never writes to
the catalogue. Laptop first: the width goes to the two columns, the controls to a bar above.

- **The bar**, sticky at the top: From and To pickers (each a popover listing only commits that changed
  a card, outstanding item or artifact as the page reads them, so a commit that only renumbered
  statuses or moved the folder is not there; by date and message, the number of records that commit
  changed and its short hash quiet; To also offers Uncommitted, the files on disk), a swap, the keys
  hint, the Viewed count and a "27 changes" jump list (searchable; a pick scrolls the card in under
  the bar and a teal ring closes on it). In the pickers' and the jump list's search, the arrow keys
  move a highlighted row (a teal ring) and Enter picks it; the first row that can be picked starts
  highlighted. Then the filters as quiet pills with counts: the types, Added, Edited and Removed, Show minor
  changes, and on the right the density switch (Comfortable · Compact, Compact by default, kept per
  browser). Then the two column heads, Before and After, each naming its commit, level with the
  cards' columns. **Once the page heading scrolls away the bar folds to one line**: "From <commit>
  to <commit>", a "Change or filter" link that opens the full bar again (until the reader scrolls
  on a good way, or back to the top), the Viewed count and the jump list, with the column heads
  kept under it.
- **Keys**: j goes up to the previous change and k down to the next (a row, or a summary line),
  ringing it, both cells of a row together; Shift J and Shift K go up and down card by card (n stays
  the board's new card); v ticks the card in view Viewed and goes to the next one not yet viewed.
  Every move lands the target 12px under the bar, however far down the page. Not while typing, with
  a sheet, picker, popover or dialog open, or while a new comparison is being read.
- **Default**: the last commit that changed the catalogue against Uncommitted; with nothing
  uncommitted, what that commit changed, with a quiet line saying so. A pick goes in the URL. While
  To is Uncommitted the page refreshes in place as files change, and when the window regains focus.
  A new pick names its commits in the bar at once; the comparison on the page stays, dimmed and out
  of reach, under a quiet "Reading git" line until the new one arrives, then the page starts from the
  top. The first cards draw at once and the rest fill in a few at a time, nearest the view first;
  until drawn, a card is its head and a quiet space about its size, so the scrollbar holds its place.
- **Order** follows the Mapped view: each epic, its features, each feature's stories (by lane, then
  order). Unchanged parents of changed cards are slim headings (a type-colour rule across, thicker
  for an epic, the title); so is a changed epic or feature whose own card the filters hide, with a
  quiet "Changed, hidden by the filters" pill. Branches with nothing changed don't show. Then Outstanding items (in their
  tab's group order), then Artifacts (by kind).
- **A card** is a white sheet with its type's top rule (artifacts indigo, outstanding items amber).
  Head: type mark, title and the ID quiet in mono (a click copies the ID itself, "Copied" for a
  moment), then only marks worth noticing: Added, Removed, Moved, Minor, as squared
  outlined tags so they never read as a status pill. Right: Whole card, Open (not for a removed one),
  the Viewed tick. Body: a grid of rows, Before | seam | After. The before column sits a shade back
  (`--card-soft`), the after one full white. **The seam** is a hairline with a short band on every row
  that changed: rose over green for an edit, green for an addition, rose for a removal, so changes can
  be found by running an eye down the seam.
- **Only changed fields show.** A field's name is a small tag on the seam at its first row, never a
  row of its own. **Short fields** (status, area, swimlane, type, position among its siblings, owner,
  kind, date, author, replaced by) sit on one line under the card's head, each "Status (Agreed) to (Verify)", an area as its chips
  taken off (struck) and put on (tinted); a card whose only change is its status is just that line.
  Whole card shows every field with something in it, the unchanged short ones quieter on that line.
  Markdown fields pair paragraph by paragraph (list items, criteria, headings each a row; a row with
  no counterpart faces a faint hatch). Unchanged runs fold to "3 unchanged paragraphs", which opens
  and then reads "Hide 3 unchanged paragraphs" to fold it again. The row kept either side of a change
  is a one-line quiet preview (a list item keeps its bullet) that opens on a click or Enter; its
  links are inert until it opens, so a click anywhere on it opens it. An edited
  paragraph shows only the sentences that hold a change; the rest is a small "…" that opens the whole
  paragraph. Changed words: struck on the rose tint (before), on the green tint (after). A paragraph
  mostly rewritten is tinted whole, both sides, rather than marked word by word. Other fields are
  drawn as on the sheet: lineage pills for a move, rows for related cards, artifacts and sources (the
  ones only on one side tinted; each named as it stood at that side, so a source citing an artifact
  since removed still shows its name), screenshots, highlights. Whole card turns off the previews and the
  sentence folding.
- **A file that does not parse** (a hand edit, a merge conflict) is never shown as added or removed:
  the card is marked "Could not be read" (a squared danger tag), its broken side says "This file does
  not parse." with the parser's message and the file's text in a quiet mono box, and the other side is
  the record whole (or the placeholder). It has no Open. An artifact's broken side is its details
  (the seam tag says Details), and its file still compares below, as File.
- **Added or removed** keeps both columns: the whole card on its side, tinted, and a dashed
  placeholder ("Didn't exist yet", "Deleted") opposite that keeps pace as the page scrolls.
- **An artifact's file** by kind: drawings and images as two pictures (each opens full size), a
  mermaid diagram drawn from each source, Markdown paired by paragraph, a PDF by its first page
  ("File replaced").
- **Minor changes** (a reorder among siblings, a list reordered, spacing only) hide behind Show minor
  changes. Status renumbering is no change at all.
- Viewed is per browser, per comparison, and clears itself when the record changes again.
- Outside git, the tab says there is nothing to compare and how to start.

## Settings

The page opens on **Project**: the project's name and its accent colour, as a row of round swatches
(None first, a ring with a slash; then the presets; then a rainbow swatch for any other colour),
the chosen one ringed, and a live preview beside them: the mark and the name, as the masthead will show them. The board's own name
and the date locale are fixed (New Zealand English), so neither is a setting.

The gear at the right of the masthead opens `/settings`: each status list (items, then questions) is a
table, so the column heads say once what every field is: No., Shows as, Name, Group heading
(questions), What it means, Colour, Role, After an answer (items). One line per status, read left to
right. The stored number sits in a quiet mono "No." gutter, never as a label. "Shows as" is the real
pill with how many cards or questions use it. The name field is the heavier one (semibold, full ink)
and what it means the lighter one (regular, secondary ink), so the status and its explanation never
read alike. A legend under each table says what each role does. A new status takes the next free
number, fixed once saved, and its row is tinted teal until then. A status in use or holding a
required role can't be removed. Teal for the actions (Save, Add); no crimson, no status colour
except in the pills and swatches. Below 1000px the table stacks, one block per status.

Each section saves on its own and only what changed (Save is off at rest, whatever spacing or case
the file holds). A section changed in the file while it is being edited says so in a banner with
**Load theirs** and **Keep mine** (as Writing voice does), and Save waits for the answer; Keep mine
keeps every row and field the user changed and everything the file gained, and a quiet note names
anything it had to decide. A section the board cannot read cleanly (a damaged status list, a
components or project section with a problem) shows only a banner naming the problems and saying to
fix `board.config.json`: no rows, no Add, no Save. It comes back as soon as the file reads cleanly. A
status list that reads with lesser problems shows them, and Save writes it as shown. Components
show "Used by" across cards and artifacts; once the list names one component, any in use but
unlisted are named with their counts and an **Add them** button, and Save waits until they are
listed.

## Before shipping a visual change

Take Playwright screenshots of the board (near, mid and fit zoom), an item sheet, Outline,
Outstanding items and Artifacts (grid, list, a drawing at a highlight with the minimap open, a
stepped diagram whole and at a step, a transcript and a PDF at a spot; `shots/artifacts.mjs`) and Diff review (top, an edited card, an
added one, an artifact, the open picker, at 1280 and 1440 wide; `shots/diff.mjs`, `shots/diff2.mjs`)
(`shots/` holds local scratch scripts), and check them against this page.
