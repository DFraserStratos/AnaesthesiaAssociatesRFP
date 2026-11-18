# Changelog

Bump `version` in `package.json` and add an entry here before each kit export.

## 1.15.0 · 2026-11-19

- **Bad data never white-screens the board.** A card that is its own parent, or in a parent cycle, opens, draws its lineage, drags and deletes like any other (each card is walked once); the check names the cycle on every card in it. A card whose `type` is not an item type is drawn in the column of cards without a valid parent, its sheet and delete question open, and its type shows as stored (never `undefined`), sorted after the known types.
- **A crash stays in its part of the page.** Each view and each sheet (modal and docked) has an error boundary: a part that fails to draw shows a recovery panel in its place (what failed, Close card, Try again, Go to board, Details to copy) while the masthead and the rest keep working, and the problem pill lists it under "This page" until it recovers. It tries once more by itself when the catalogue changes, and never loops. Close card clears the card from the address, so a reload does not reopen it. Unsaved drafts survive and the leave prompt still protects them. Uncaught errors from clicks and promises are listed under "This page" too (dismissable), and a saved browser preference that could not be read, and was reset, under "Saved preferences".
- **Nothing counted is hidden.** The Outline lists every card: a last group, "Not under an epic", holds cards whose parent is missing, non-epics with no parent and parent cycles, each with its reason, searchable and reachable by keyboard. Outstanding items lists a question whose status is not configured in a group of its own after the others, steppable from its sheet, so the list matches the masthead count.
- **One file never stops the catalogue loading.** An artifact file that can't be read, or whose contents can't be made sense of (a character reference past U+10FFFF), is an issue on that artifact, retried on the next load; the rest loads. A screenshot folder with a dangling link, an unreadable image or a torn record no longer stops the dev server starting, a sync or a delete. If the check itself fails, one error says so. Files whose names start with `.` in the record folders (`._EP-01.md`, `.#US-01.1.1.md`) are ignored and claim no ID.
- **Files are read the way editors write them.** A byte-order mark at the start of a record, `board-layout.json`, `board.config.json` or `status-recodes.json` is read past, and kept when the board or `statuses:recode` rewrites the file. Layout positions that are not `{ x, y }` numbers are ignored and named in an error on `layout`; the next card move writes the file without them, and a delete over such a file succeeds. A layout that is valid JSON but not an object says so.
- **Deleting a card in a parent cycle works:** each card goes once, the layout is tidied, and the request succeeds (it used to fail part way).
- **Saved browser preferences can't break a view.** Every preference kept as JSON (board view, Artifacts view, board position, Outline folds, the Diff review's Viewed ticks) is read through one rule: a value of the wrong shape reads as the defaults for the wrong parts. The next tick repairs the Viewed store.
- **Find keeps its matches on the right letters** after a character whose lower case is longer ("İ"), and counts the same before and after a PDF page is drawn; a word-final sigma finds a capital one.
- **PDFs are read once.** Their facts are kept in `.pdf-facts/` beside the board (gitignored; `PDF_FACTS_DIR` overrides), keyed by the file's content and the extractor's version, so starting the board or running the check again does not re-read an unchanged PDF; every PDF that does need reading is read in one child process. A damaged entry is rebuilt, two processes can write at once, and a failed run is never kept. `npm run check` on this catalogue: 2.3 s before, 0.55 s once the facts are kept.

## 1.14.0 · 2026-11-19

- **A status number means what the project's list says, or nothing.** A status list with a problem is never swapped for the built-in lists, whose numbers mean different things (built-in 5 is Retired; a project's 5 may be Confirmed). A bad `tone` falls back for that status alone and the list stays usable (*degraded*). A structural problem (a missing or doubled code, a role or settle rule broken, a config file that does not parse) makes the list *damaged*: the board reads only what it can of the project's own list (a role two statuses claim counts for neither, so nothing is hidden as retired on a guess), the check reports the list once instead of flagging every card, and the server refuses status saves for that list, leaving the file untouched. New cards are refused while the default status can't be told; a card's status can change only to one the project's list defines. Each list's state reaches the client as `config.statusState` (`healthy`, `degraded`, `damaged`, its problems and high-water mark), ready for Settings to lock a damaged list.
- **A status number is never handed out twice.** Removing a status in Settings records it under `removedStatuses` in `board.config.json` (code and last label); old versions storing it read as that label, marked removed, and the check says when a card still holds one. A new status takes a number past every code the list has used: live, removed, in a recode, or on a card. The server refuses a list that reuses one. Whether a status is in use is judged against the file on disk, not the server's copy.
- **`statuses:recode` is safe to renumber with.** It refuses a map that would merge statuses silently (a live status left out while others are renumbered), a target that it or an earlier recode moves away, or one used before, so following the recorded recodes always reads a version saved before or after a recode right; to merge on purpose, name the status kept too (`3=4,4=4`), and the dry run lists merges. It now also moves the codes in `board.config.json`. It records the run first and writes each file whole (temp file, then rename); a journal line it can't read is kept byte for byte, and if a step fails it names the file and step, and the same command run again finishes the recode without recording it twice. It refuses to run while a board watches the same catalogue (the board keeps a lock in its journal folder; a stale one is ignored), which used to leave journal entries for status changes that never happened. The journal pass also runs on a scratch catalogue (`HISTORY_DIR`). It refuses, writing nothing, when `status-recodes.json` can't be read (it used to replace it), and appends to it with every earlier entry kept as written. An old name (from before statuses were codes) may map to a live code or a fresh one, never a spent one. The check reports an overlapping recode history, and a live status whose code a recode moved away.
- A status's `label`, `help` or `heading` that is not text is reported (the list stays usable). A Settings save over a `board.config.json` that is not an object is refused with 422 instead of failing with 500.
- **The CSV export shows status labels**, from the project's list, in place of bare numbers; a code the list does not define is written as stored. Columns are unchanged.
- **A saved status filter survives a config that is broken for a moment.** It is pruned only when a status is really gone, never while a list is damaged or the file can't be read.

## 1.13.0 · 2026-11-19

- **Drawings cannot run script or reach out.** The SVG sanitiser judges links by what a browser resolves, not how they are written: any URL-bearing attribute (`href` under any prefix, `src`, `action`, `data` and the like, in any namespace) keeps only `#id` (not a board route, `#/...`) or a picture as data; `url()`, `image-set()`, `@import` and the like that load from elsewhere go from presentation attributes, `style` attributes and `<style>` elements, read as a browser reads them (newlines normalised, escapes undone, a `/*` inside a string no comment). A `<style>` loses only the declarations that reach out, the rest kept exactly as written, in linear time whatever it holds (a large embedded font included). Elements from other vocabularies (HTML, MathML) go, and so does a drawing whose root is not an SVG element. References to the drawing's own elements (`url(#id)`, `<use href="#id">`, gradients, markers) stay, now including `url( "#id" )` written with spaces and quotes, which was blanked before.
- **A link in a drawing never moves the board.** Only the board's own record links open anything (a click opens the record, a modified click a new tab). A drawing's own link to one of its spots (`#id`) brings that spot into view; any other link does nothing, plain, modified, middle-clicked or by keyboard.
- **Raw catalogue files are served only by the board's routes.** The plugin adds a Vite `server.fs.deny` rule for the catalogue folder being served and the one beside the board (as written and as real paths), and answers 404 itself for any path into them, decided by what the file system opens (folders compared by identity), so no spelling gets through: `%72equirements`, upper case, `requirementſ` (Unicode case folding), decomposed accents, `//`, dot segments, `/@fs/`, `/@id/`. Its own `/requirements/` route reads every spelling the same way and serves only image files under `assets/`.
- **Misses are 404s.** `/artifact-file/` and `/history-blob/` answer 404 (GET and HEAD) when they cannot serve, never the app's page; a failing history lookup no longer leaves an unhandled rejection, which could stop the dev server. The viewer's "the file is missing" now shows.
- **Other origins cannot read the board.** CORS is off, and a read another site's page asks for (fetch metadata `cross-site` or `same-site`, other than a top-level visit) is refused 403 on every route, Vite's own included (so another page can no longer trigger `/__open-in-editor`); the API and file routes also send `Cross-Origin-Resource-Policy: same-origin`. Every file sent carries `X-Content-Type-Options: nosniff`; every SVG the no-script CSP.
- **Malformed URLs are client errors.** One decode rule (`idFromPath`) for every ID taken from a URL: a bad `%` escape is 400, and so is an ID with a path separator, `.` or `..`, or a control character, refused before any file is read. A bad escape on any other path is 400. A name every object inherits (`__proto__`, `constructor`) is a 404 on the history routes, not a 500.
- **Symbolic links that lead out of their folder** (a screenshot, an artifact file) are still served, with a warning in the server log and a check warning naming where they lead. Paths are compared as real folders, so a requirements folder or repository reached through a link (a macOS temp folder under `/var`) gets the right repository-relative path for its artifacts.

## 1.12.3 · 2026-11-18

- Build lanes on the plan page: `status.json` `guidance.lanes` (name, where, queue, prompt file) lists each lane under "Start now" with its queue and a button copying its prompt, and a queued phase's card copies its lane's prompt in place of its own kick-off prompt (update-build-plan's `build-index.mjs`).
- A worktree's git-ignored `.lane.env` (KEY=value lines) at the repo root fills unset variables for `phase-check.mjs`, the capture runner and the board's dev server, so a session's ports follow the worktree without any session setup.

## 1.12.2 · 2026-11-18

- Ports for a second worktree. A capture app in `board.config.json` may name `"portEnv"`: when that environment variable is set, it replaces the port in the app's `url`. The run-build-phase `phase-check.mjs` reads the same key on each `runner.devServers` entry (the probe, the start and the capture all use it). Set nothing and every URL is as written. This lets two build sessions in two git worktrees run their own dev servers, Playwright and capture side by side.
- The board's own dev server takes its port from `BOARD_PORT` when set (default 5180, still strict).

## 1.12.1 · 2026-11-18

- The project accent fills only the board's mark and the tab icon. The underline under the open view no longer takes it.
- The underline under the open view is ink, not teal: showing the open view is not an action, and a coloured underline clashed with the docked sheet's top rule right under it.
- An item's sheet is ruled in its type's colour (orange epic, purple feature, blue story), as its card is, in place of its status colour. Only the rule changes: artifact marks inside the sheet keep their own colour. A question's sheet keeps its status colour.
- The tab icon's grid lines are a little darker and heavier, so they still show at tab-icon size. The masthead mark is unchanged.

## 1.12.0 · 2026-11-18

- The masthead shows status only when something is wrong. "Live" and "Checks pass" are gone; one **problem pill** appears while there is a problem: amber "Offline" when the board has lost its dev server (nothing is being saved), red for catalogue errors, card moves not saved or a refused move. One problem names itself, more say "2 problems"; it opens one list grouped as Connection, Card moves and Checks, offline first, with the command to restart the server. When the last problem clears, a green "All clear" shows for about three seconds and fades. The "Card moves not saved" and refused-move pills are folded into it.
- Check notes no longer show in the masthead. Settings has a new **Checks** section listing every error and note; the pill's list shows notes under the errors.

## 1.11.0 · 2026-11-18

- Settings: the Board section is now **Project**, with the project's name and a new **accent colour** (`project.accent` in `board.config.json`, `#rrggbb`): nine presets, None, or any other colour. With one set, the board's mark in the masthead and the browser tab icon are filled with it and the project's name turns bold, so boards for different projects open side by side tell apart at a glance.
- The board's name is fixed as "Requirements board" (`board.name` is no longer read, and saving Settings drops it from the file), and dates and times are always New Zealand English (`project.locale` is no longer read). `capture.locale` for screenshots is unchanged.

## 1.10.1 · 2026-11-18

- The board opens in Mapped mode by default, and Mapped is now the left-hand option of the mode switch. A browser that has already saved a mode keeps it.

## 1.10.0 · 2026-11-17

- `run-build-phase`: a two-session phase runs in one session by default. The doc's session boundary is now a checkpoint, not a stop. There the session runs the full gate, writes the `IN PROGRESS` status row and a short `**Session 1**` paragraph (so a session that ends unexpectedly can be resumed), then carries on with the rest. It stops at the checkpoint only when the prompt says so (a session-1-only run), when its context has already been compacted, or when the context or a usage limit warns it is near its end. A stop updates the plan page so the same prompt resumes the phase. A phase finished in one session gets one full entry in place of the `**Session 1**` paragraph. The running log gains a `Checkpoint:` line after each work item, and a resumed session starts from the last one.
- `phase-context.mjs`: an `IN PROGRESS` pack points to the log's last `Checkpoint:` line as well as the progress entry.
- `build-index.mjs`: the plan page counts phases, not sessions. Under the progress bar it reads "<n> phases to go", and Every phase reads "<done> done, <left> to go". Phases are the unit the plan runs in; a session estimate is only a size.

## 1.9.0 · 2026-11-16

- `run-build-phase`, a new skill: builds one phase of a plan made by `update-build-plan`, start to finish, in a fresh session. It orients from a context pack and the phase doc, runs the drift check, writes a step plan and builds straight on (in plan mode, one approval at the plan), gates on the plan's checks, compares each changed screen with its design file, runs the manual checklist, then the review, the catalogue screenshots and the demo guide side by side, writes a short progress entry and updates the plan page so it names the next phase. A kick-off prompt says "Load the run-build-phase skill and follow it for Phase <id>" and adds only what the phase doc does not say. Its "This repo" block holds the project's rules, app, design references, progress file and tracks; the starter has one.
- `phase-context.mjs <id>` writes the context pack: one compact file with what the phase needs from the plan's large documents (its plan entry and dependencies, the drift check already run since its doc's baseline, the owner decisions that gate it, its catalogue items and questions, the progress file's conventions and its dependencies' handoffs, ROADMAP's standing and sequencing rules, and pointers to the rest), trimmed to a budget. `--stdout` writes nothing, for plan mode. Tested by `phase-context.test.mjs`.
- `phase-check.mjs` runs the phase's finishing checks in one command, side by side where that is safe, one line each with the tail of any failure: `--changed` for the quick inner loop, `--only`, `--failed`, `--list`, and `--capture <IDs|all>`, which brings the dev servers up and captures the phase's recipes (a dry run first) or runs one full capture. A lock stops two runs at once.
- A `runner` key in the plan's `plan.config.json` drives both: `skill`, `checks`, `maxParallel`, `logDir`, `concurrency`, `devServers`, `devCommand`, `startTimeout`, `capture` and `context`. ADOPTING.md says what an adopter sets; without it, plans work as before.
- `update-build-plan`: with `runner.skill` set, the workflows write slim, doc-first kick-off prompts: the opening line, "Load the <runner> skill and follow it for this phase", an Override only where a phase departs from the runner's flow, reads the doc does not list, the few rules to hold above all, and the phase goal. The phase doc's "Before you start" holds the reads and stops the prompt used to carry, and a phase the skill updates has its prompt rewritten to that shape. Reviewers check it. Without a runner, prompts are written as before.
- `recipe-status.mjs --check` passes a prompt that loads the runner skill, since the runner runs the capture step, and notes (without failing) prompts that name a home-folder path outside this checkout: a stale repo root. The catalogue screenshot step is now the phase's own recipes first, then one full capture at the end.
- `plan-docs.mjs`, new and shared with the runner's tools: the owner decision rows and the phases they gate, the drift-check baseline lines, and the kick-off prompt checks, tested by `plan-docs.test.mjs`. `config.mjs` resolves `runner.skill` as `runnerSkill`. SKILL.md documents the prompt shape, the `runner` key, the shared modules and the Stage 3 checks.
- The About page has a `/run-build-phase` card, and step 6 of the loop links to it.

## 1.8.1 · 2026-11-12

- `update-build-plan`: a plan can hold an owner-added track whose phase numbers are a capital letter and digits (`U1`), beside the numbered run. The tools read such a phase's DONE or IN PROGRESS row and its `### [<word>] Phase U1` entry in the progress file, and always count it as the plan's own (it is not compared with `firstPhase`). Before, only two-digit numbers (`15`, `15a`) were read, so such a phase could never show as built. SKILL.md says so.

## 1.8.0 · 2026-11-10

- Stepped diagrams can follow their steps: `step_view: follow` in the sidecar (beside `steps`) makes the view frame each step as the reader arrives at it, by the step bar, the arrow keys, the Steps tab or a link. `fixed`, the default and the same as leaving it out, keeps today's behaviour: the view stays where it is, right for a diagram that fits one screen. Follow is for a wide flow that does not.
- The framing: a step's focus is what it highlights (else what it reveals) plus both ends of its moves. When the focus is already in view, clear of the find bar, step bar and view bar, nothing moves; otherwise the view centres it, at the zoom it has if the focus fits there, else the zoom that fits it, never closer in than the drawing's own size. Arriving from the whole drawing, a focus in view but too small to read (under three quarters of its framing size) is framed too, so a long strip fitted whole zooms in on its first step. The view eases there over 560ms and the step's moves fly once it settles; reduced motion jumps and flies nothing. A link or URL at a step opens framed. Whole drawing fits the whole again. Panning and zooming by hand still work at any time, and the next step moves the view only if its focus is out of view.
- `check` errors on a `step_view` other than `fixed` or `follow`, and on `step_view` on an artifact with no steps. The board keeps the field when it rewrites a sidecar; History and the Diff review show a change to it. It is not in Edit details: agents set it.
- `artifact:steps` shoots each step as a reader opening its link sees it: the whole drawing for a fixed diagram, each step framed for a following one. `00-whole` is always the whole drawing.
- Full screen for an artifact: the last button of the view bar, bottom right of the artifact page (a Markdown document gets a one-button bar for it), hides the masthead and the panel and asks the browser to fill the screen (the window alone where it refuses). Esc, the browser's own exit or the button comes back, the panel's tab and any edit kept. Opening another artifact from a link stays in full screen. The artifact page has no new-card plus (nor its `n` key), so its view bar sits in the corner. DESIGN.md and the About page say so.
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
