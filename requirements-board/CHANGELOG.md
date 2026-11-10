# Changelog

Bump `version` in `package.json` and add an entry here before each kit export.

## 1.8.0 · 2026-11-10

- Stepped diagrams can follow their steps: `step_view: follow` in the sidecar (beside `steps`) makes the view frame each step as the reader arrives at it, by the step bar, the arrow keys, the Steps tab or a link. `fixed`, the default and the same as leaving it out, keeps today's behaviour: the view stays where it is, right for a diagram that fits one screen. Follow is for a wide flow that does not.
- The framing: a step's focus is what it highlights (else what it reveals) plus both ends of its moves. When the focus is already in view, clear of the find bar, step bar and view bar, nothing moves; otherwise the view centres it, at the zoom it has if the focus fits there, else the zoom that fits it, never closer in than the drawing's own size. Arriving from the whole drawing, a focus in view but too small to read (under three quarters of its framing size) is framed too, so a long strip fitted whole zooms in on its first step. The view eases there over 560ms and the step's moves fly once it settles; reduced motion jumps and flies nothing. A link or URL at a step opens framed. Whole drawing fits the whole again. Panning and zooming by hand still work at any time, and the next step moves the view only if its focus is out of view.
- `check` errors on a `step_view` other than `fixed` or `follow`, and on `step_view` on an artifact with no steps. The board keeps the field when it rewrites a sidecar; History and the Diff review show a change to it. It is not in Edit details: agents set it.
- `artifact:steps` shoots each step as a reader opening its link sees it: the whole drawing for a fixed diagram, each step framed for a following one. `00-whole` is always the whole drawing.
- SCHEMA.md (a `step_view` row and a paragraph under Steps), DESIGN.md, the About page and the svg-diagram skill (when to choose follow; keep each step's highlight compact, since the view frames it) say so. The e2e fixture has a wide following strip.

## 1.7.0 · 2026-11-10

- One past status for artifacts: Superseded is folded into Retired. A retired artifact may name its replacement in `superseded_by` (Replaced by in Edit details, "Nothing replaces it" otherwise); with one, the panel shows "by" its title and sources citing it hand on to the replacement, as before. Show retired now hides every past artifact, replaced or not.
- `check` errors on `status: Superseded` and says what to write instead, and warns on `superseded_by` on an artifact that is not Retired. SCHEMA.md, DESIGN.md, the About page and the add-artifact skill say Retired is the only past status.
- A saved Artifacts status filter naming a status that no longer exists is dropped on load, so it cannot hide everything.

## 1.6.0 · 2026-11-10

- Stepped diagrams: an SVG drawing's sidecar can list `steps`, and the board plays them in order. Each step reveals more of the drawing (reveal is cumulative, nothing is hidden again), highlights what it is about while the rest dims, and shows a caption and a small balances table, the rows that changed since the step before marked. With no step chosen the board shows the whole drawing, nothing dimmed; thumbnails, the minimap, visual compare and the Diff review show that finished picture.
- A slim step bar on the canvas, bottom left, level with the view bar: "3 of 8" with previous and next, the step's name, and Whole drawing; with no step chosen it offers Step through. It never covers the drawing: the step is read in the panel. The left and right arrow keys step while the drawing or the bar has focus. The fade between steps is skipped under reduced motion. What dims is washed half way to white and stays opaque, so nothing behind it shows through; on a dark panel it fades into the panel instead.
- A Steps tab in the artifact panel, first when an artifact has steps: the steps under their groups, a click to go, a link to copy; the step shown opens in place to its caption and balances. The Artifacts tab counts an artifact's steps beside its highlights.
- Moves: a step can list `moves`, each `from` and `to` anchors, for something that travels at that step. Stepping forward onto the step, each `to` element flies from the `from` element's place and size to its own (about 700ms each, a stagger apart), drawn above the rest of the drawing on the way, and lands exactly on the static drawing. Jumping to a step, stepping back, the whole drawing and reduced motion skip the flight; a Replay button in the step bar plays it again. The check errors on a move missing `from` or `to` or an anchor that matches nothing, and warns on a `from` matching several elements and on a `from` or `to` a later step reveals.
- A step is a spot, like a region: `AR-nn#step-id` in an item's `artifacts` and in text links, `?region=step-id` in the board's address. Steps and regions share one set of ids.
- Check rules: steps only on an SVG drawing; a step's id shaped like a region's, listed once, not a region's id, not shaped like a page or line spot; a name; an account on every balance row; every `show` and `highlight` anchor matching something in the drawing (errors); a highlight on something a later step reveals (a warning); links in captions checked as a description's are. SCHEMA.md has a Steps section.
- History and the Diff review show a change to an artifact's steps as named steps added, removed, changed or moved, not raw data.
- svgkit: `with d.group(id=..., cls=...)` wraps a part's primitives in one `<g>`, so a region or a step can name a whole card with its texts. Groups nest. Existing generators draw exactly as before.
- `npm run artifact:steps -- AR-nn [--out <dir>] [--url <base>]` screenshots a stepped diagram in the running board, the whole drawing and then each step (`00-whole.png`, `01-<step-id>.png` ...), at a laptop size, to check every step by eye. It says so plainly when the board is not running.
- The svg-diagram skill has a Stepped diagrams section (when one earns its place, draw the finished picture first, group each step's marks, write `steps`, check every step); the add-artifact skill covers steps beside regions.
- The starter's loop diagram is the worked example: its cards are grouped and its sidecar steps through the loop in two groups, with running balances. `__pycache__` folders stay out of git and out of the exported kit.
- The consistency review checks a stepped diagram's steps too (names, captions, running balances, their order), never edits an id or an anchor, and a redraw keeps the steps and their links.

## 1.5.1 · 2026-11-10

- Diff review: each card's title row shows the record's ID, quiet beside the title; a click copies the ID.

## 1.5.0 · 2026-11-06

- Diff review, a new tab after Outline: the catalogue compared between two versions in git. Every changed epic, feature, story, outstanding item and artifact is a card with before on the left and after on the right, paired paragraph by paragraph, the changed words struck on a rose tint or set on a green one, status, lineage, area and link rows drawn as on the sheet. A paragraph mostly rewritten is tinted whole.
- It starts on the last commit that changed the catalogue against the files on disk, and refreshes as they change; with nothing uncommitted, on what that last commit changed. The From and To pickers list only commits that changed records as the page reads them (a status renumbering alone is left out), by date and message, each with the number of records that commit changed. The tab counts the records changed since the last commit.
- Cards sit as on the Mapped view (each epic, its features, each feature's stories), unchanged parents as headings (a changed epic or feature the filters hide is a heading too, marked "Changed, hidden by the filters"), then outstanding items and artifacts. Filters by type and by added, edited or removed; reorders and spacing-only edits hide behind Show minor changes. Whole card shows every field; Viewed folds a card, kept per browser until it changes again; a jump list finds any change.
- An artifact's file compares by kind: drawings and images side by side, Markdown documents paired by paragraph, a PDF by its first page.
- Fits more on a laptop: once the page heading scrolls away the bar folds to one line ("Change or filter" opens it); field names are tags on the seam rather than rows; status, area and the other short fields sit on one line under the card's title; the paragraph kept beside a change is a one-line preview that opens on a click; an edited paragraph shows only its changed sentences, the rest a "…" that opens it; a Compact density (the default) with Comfortable a click away, kept per browser.
- An opened fold reads "Hide 3 unchanged paragraphs" and folds again.
- Keys: j and k step up and down through the changes, Shift J and Shift K through the cards, v ticks the card in view Viewed and goes on. They rest while typing, with a sheet, picker or popover open, and while a new comparison is being read. In the pickers' and the jump list's search, the arrow keys move a highlighted row and Enter picks it.
- A record whose file does not parse on one side (a hand edit, a merge conflict) is a card marked "Could not be read", with the parser's message and the file's text on that side, never shown as added or removed. An artifact's file still compares under it.
- Picking commits names them in the bar at once; the comparison on the page dims ("Reading git") until the new one arrives.
- Fast on a big catalogue: the first cards draw at once and the rest a few at a time, nearest the view first; folding the bar, ticking Viewed, filtering and opening a sheet redraw only what changed; a refresh that finds nothing new draws nothing; coming back to the tab shows the last comparison at once, then refreshes it. The tab's code and styles load the first time it is opened.
- `GET /api/diff/commits`, `GET /api/diff?from=&to=`, `GET /api/diff/auto` (the default in one request) and `GET /api/diff/count` (the tab's count, a few bytes), in `server/catalogueDiff.ts`, cached until HEAD moves or a record changes. Artifact files are compared wherever their sidecar points, a moved requirements folder is followed (each record folder on its own, so one renamed in the move is followed too), and SHA-256 repositories work. Sources are read against the artifacts of each side, so one citing an artifact since removed keeps its name. Outside git the tab says there is nothing to compare.
- `/history-blob/<sha>?artifact=<ID>&file=<path>` serves an earlier version of an artifact's file as the type it had then.
- A change to an artifact's Cited as list now shows in its history and in the Diff review.

## 1.4.0 · 2026-11-06

- Voice check: `board.config.json` can list `voice.descriptionWarnings`, project patterns (`{ pattern, flags, message }`) for provenance and decision history that belong in Notes. The check warns once per rule when one is found in the description of a live epic, feature or story, quoting the match; Notes, questions and artifacts are not checked. A pattern that does not compile is a config error and is dropped. The Settings page keeps the block as written.
- SCHEMA.md, the README, ADOPTING.md and About describe it; the starter config carries a generic "our reading" rule.

## 1.3.0 · 2026-11-05

- Artifacts can be Retired: one that no longer reflects the design and has nothing to replace it keeps its record and ID for traceability, with no `superseded_by` and nothing handed on (a source citing it still opens it).
- The Artifacts tab hides retired artifacts, and leaves them out of its counts, until Show retired is on (kept per browser). Shown, they are muted like a superseded one; a link or URL opens one either way.
- Links to a retired artifact show muted, as to a superseded one, and the masthead's artifact count leaves it out.
- The check warns when a live card lists or links a retired artifact, or a live artifact's description links one. A retired artifact needs no source, and links in its own description are not held to the live rules.
- About lists the artifact statuses; SCHEMA.md and the `add-artifact` skill say when to retire an artifact rather than supersede it.
- PDFs still read after Node is upgraded under a running dev server: the PDF reader runs with whichever `node` is on the PATH when the server's own binary has gone, instead of failing every PDF and every `#pN` page link.

## 1.2.0 · 2026-11-04

- The build plan page (`update-build-plan`'s `build-index.mjs`) is cut to the essentials: a headline saying what to start, a map of every phase by track and wave (done, safe to start, safe once its dependencies land, wait, later), "Start now" cards with the kick-off prompt one click away, and an "Unblocked, but wait" list. Every phase, the sequencing rules, how a phase runs, milestones, parked items and the gap analysis sit behind collapsed sections.
- Phases in the same wave do not depend on each other, so the map shows what can run side by side. A phase whose blocking questions were answered after the plan's baseline is marked "re-plan first".
- The owner's safe and wait calls live in the plan's `status.json` `guidance`; the skill reviews them after each update.

## 1.1.0 · 2026-11-03

- Tables in Markdown text now render (GitHub-flavoured Markdown); a single tilde, as in "~85", stays literal rather than striking text through.
- Find in the open card: Ctrl F (Cmd F on a Mac) opens a find bar for the card, tints the matches and steps through them; the board's own search takes Ctrl F once the card is closed.
- Search finds items by ID the way people type them: `4.1.1`, `us 4.1.1` and `US-04.1.1` all find US-04.1.1, and `4.1` lists what sits under it first.

## 1.0.0 · 2026-10-21

- First shared release of the board as a kit.
- Settings: name the board and the project, set the locale, and edit the components.
- About page: the requirements loop, every skill, what is on the board, files and commands.
- A starter catalogue that explains the board, and the `update-build-plan` skill in the kit.
- Writing voice: `requirements/VOICE.md` says how requirements are written; the skills follow it, and Settings shows and edits it.
- `START-HERE.html`: a static setup guide with one prompt that has Claude Code set the board up.
- `install-skills` copies the skills into the repo's `.claude/` (or links them with `-- --link`), next to any skills the repo already has.
