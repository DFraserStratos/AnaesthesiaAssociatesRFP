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
(`BASELINE_STATUS` in `src/vocab.ts`). Where an item came from is its sources, never its status.

**Sizes carry level.** Epics are wide bars spanning their features; features are taller cards
(168px); stories are compact (112px). Keep features visibly taller than stories.

**Other fixed choices:** the canvas is the faint teal-grey grid of an anaesthetic chart, one 80px
ruling kept low enough in contrast that cards read cleanly over it; type is
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
- Then the title, description, notes, open questions, children, screenshots.
- Bottom: **Status** (the pill alone), **Area** (component), **Sources**, and the
  ID quietly in the bottom right.

## Interaction

- One click opens a card: its sheet docks as a panel on the left (a third of the width by
  default, the board two thirds; resizable, width kept per browser) and the board stays live on the right with the card's
  lineage lit. Clicking another card, or walking with the arrow keys, swaps the panel; Esc or a
  click on empty canvas closes it. No double-click anywhere.
- One round teal plus, bottom right of every view (or `n`), makes any card: epic, feature, story or
  outstanding item. It asks only for the type, the title and where it sits (a searchable parent, or
  what an outstanding item affects), starting from the open card, then opens the new card in Edit.
- Outline and Outstanding items open the same sheet as a centred modal. A question opened from the
  board's panel sits over the panel as a modal and closing it returns to the panel.
- Unsaved edits are never lost silently: every way out of a sheet asks, and drafts survive
  navigation.
- The board never raises a browser dialog. A sheet asks in its own frame: it veils its content
  (`SheetConfirm`) and puts the question there, with the safe answer as the filled teal button
  that holds focus and the consequence named on the other ("Discard changes", "Retire item"). On
  the canvas the question is a popover under the button that raised it ("Tidy all"). Escape
  withdraws the question either way.
- Motion only on action (sheet open, lineage fade, pan to card); respect reduced motion. Stepping
  between records (prev/next sibling, a lineage pill, an open question) swaps the sheet's contents
  in place and skips the entrance, so the page behind never flashes through a re-fading scrim.
- Mobile is out of scope: this is a desktop tool.

## Before shipping a visual change

Take Playwright screenshots of the board (near, mid and fit zoom), an item sheet, Outline and
Outstanding items (`shots/` holds local scratch scripts), and check them against this page.
