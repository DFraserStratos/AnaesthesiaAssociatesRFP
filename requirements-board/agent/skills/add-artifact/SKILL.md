---
name: add-artifact
description: Register a diagram, image, mermaid diagram, transcript, note or PDF as a catalogue artifact - the next AR-nn with a sidecar naming it, its kind, sources and highlighted regions - then link the requirements it illustrates to it or to a spot in it, and check. Use when the user wants a file shown on the Requirements Board's Artifacts tab, wants requirements to point at a document or a spot in one, or hands over a diagram, transcript or document as evidence.
argument-hint: "<the file or mermaid source> [what it is, who made it, which requirements it supports]"
---

# Add an artifact

An artifact is anything requirements point at: a diagram, a mockup, a screenshot, a photo, a
transcript, a note, a document. The Requirements Board shows it on its Artifacts tab (agents write
artifacts as files; the board's Edit details changes only the sidecar's title, kind, status, date,
author, components, sources and description, never the file, its regions or its steps) and draws a red box round any spot a requirement links
to. The format is under **Artifact file** in `REQ/SCHEMA.md`; read it first. Sidecars live in
`REQ/artifacts/`, the artifact files themselves in `REQ/artifacts/files/` (notes stay in `REQ/notes/`).

## This repo

The only repo-specific facts this skill uses; rewrite them when the board moves (see its `ADOPTING.md`).

- `BOARD` = `requirements-board` (the board's folder); `REQ` = `requirements-board/requirements`.
- Check: `npm --prefix requirements-board run check` (the root `npm run check` runs the same).
- The board's dev server: `http://localhost:5180` (`npm --prefix requirements-board run dev`).

## 1. Register it

From the repo root:

```
npm --prefix BOARD run artifact:new -- <file> --title "<name>" --kind <kind> --date <YYYY-MM-DD> [--author "..."] [--source "..."] [--cited-as "..." [--page-offset n] [--within <heading-slug>]]
npm --prefix BOARD run artifact:new -- --mermaid <file.mmd> --title "<name>" --date <YYYY-MM-DD>
```

- `--kind`: `diagram`, `mockup`, `screenshot`, `photo`, `transcript`, `note` or `document`.
- `--date`: when the artifact itself was made, not today: the meeting a transcript or note records,
  a document's publication date, the day a diagram was drawn. `YYYY-MM` or `YYYY` when that is all
  that is known (a 2021 price guide is `2021`).
- `--title`: what it shows, in plain words and sentence case ("How the system works out a price",
  not the file name).
- `--source`, repeatable: where it came from, in the requirements' sources convention
  (`"Notes 2026-10-02 · Client meeting #11"`, `"Q&A 2026-09-24 #2"`, `"Recording 2026-10-01 · ..."`).
- `--cited-as`, repeatable: how requirements' `sources:` cite it, so each source opens it at the spot
  it names (SCHEMA's `cited_as`). A source that starts with these words resolves here; after them it
  may give `p.27` (a page, PDFs only), `#2 #3` (numbered points, also `#2#3` or `#2, #3`) or `L27-33`
  (lines, Markdown only). Which artifacts need it:
  - a **note** in `REQ/notes/` needs none: `Notes <date> · <slug words>` resolves by its file name
    (the words after its date, hyphens as spaces, not its title: `2026-10-16-sam-pricing-call.md`,
    titled "Sam's pricing call", is `Notes 2026-10-16 · Sam pricing call`);
  - a **transcript**: `--cited-as "Transcript <date> · <name>" --cited-as "Recording <date> · <name>"`,
    the names its note and the requirements use;
  - a **document** sources cite by page: its short name (`--cited-as "RFP"`), plus `--page-offset 1`
    when sources cite the printed page and it runs one behind the PDF's (the RFP's printed p.27 is
    PDF p.28; measure it on the document, don't assume);
  - a **diagram** that is the latest drawing of something sources already cite by name
    (`"Diagram: Billing route"`): that name. When a diagram is replaced (retired with
    `superseded_by`), sources citing the old one follow it to the new one by themselves.
  `--within <heading-slug>` makes points count only under that heading (for a note that numbers each
  section from 1). For a cited name that should open one spot, add `spot: <spot>` to the entry in
  the sidecar by hand: a region or step ID, a page `p27`, a line range `L1-10` or a heading slug. Then check a few with `npm --prefix BOARD run source -- "<source>"`.
- The file comes into `REQ/artifacts/files/`: an SVG or image is copied in as `AR-nn.<ext>`; a
  transcript, document or PDF from elsewhere in the repo keeps its name and is moved in (not staged:
  add both paths when you commit; fix any links to its old place). A file already in the requirements folder stays put.
  `--keep` leaves it where it is, with a `/`-rooted path from the repository root; use it only for a
  file that must stay outside. A mermaid diagram lives in the sidecar under `## Source`.

The script prints what the file holds: an SVG's texts and element ids, a document's headings and
line count, a PDF's page count, a diagram's node ids. Choose anchors from that.

## 2. Fill in the sidecar (`REQ/artifacts/AR-nn.md`)

- A description of a sentence or three: what it shows and what it is for.
- `components` where it clearly belongs to one or more areas.
- **Regions**, one per spot a requirement might point at. Drawings: each panel, stage, group or
  note. Documents: the passages requirements rest on (a quote), not every paragraph. Each region:
  `id` (lower-case words joined by hyphens), `name` (plain words), then anchors in `around` (the
  box goes round all their matches together) or a `box`:
  - SVG: `#id` where the drawing has ids, else `text=<exact text of a heading in it>` or a
    `rect[x="..."][y="..."]` selector for the panel's rectangle;
  - mermaid: `node=<node id>`;
  - Markdown: `quote=<the passage, as it reads>` or `heading=<a heading's text>`;
  - PDF: `page: <n>` plus `quote=<text on that page>`, or a `box` in points from the page's top left;
  - image: a `box: [x, y, width, height]` in pixels (render it and look to find the numbers).
  - `note:` a line on what the spot shows, when the name alone doesn't say.
- Documents need no region for a whole section, page or line range: those are spots already
  (`#<heading-slug>`, `#p27`, `#L27-33`).
- **Steps**, for an SVG drawing of a flow that unfolds: a `steps` list (after `regions`) makes it a
  stepped diagram the board plays one step at a time, each step revealing and highlighting more of
  the drawing, with a caption and running balances. A step is a spot like a region (`AR-nn#step-id`;
  the two share one set of ids), and a drawing can have both: regions for its standing parts, steps
  for what happens. A step can also list `moves`, `from` and `to` anchors for something that
  travels at that step, which the board flies from one to the other. The format is Steps under
  Artifact file in `REQ/SCHEMA.md`; the `svg-diagram` skill says how to draw one so that its steps
  and moves work (each step's marks grouped under an id).

## 3. Link requirements to it

Read each candidate item first. Add the artifact to the item's frontmatter, just before `images:`:

```yaml
artifacts:
  - AR-07#rate-lookup
```

Link the most specific item (a story over its feature over its epic), and the spot that shows what
the item says (or the whole artifact when the item is about all of it). Don't link retired items (the status with role `retired`).
A text link works too, inside a description or answer: `[the pricing steps](AR-01#price-rules)`.
Insert the lines as text; don't re-save other people's files through a formatter. Always use this
block form, one link per line, never the inline `artifacts: [AR-07#rate-lookup]`: the board writes
the block form, so an inline list fails its byte-for-byte round-trip test.

## 4. Check and look

- Run the check ("This repo"): every anchor must match (it says which don't), every link
  must name an artifact and spot that exist, and every `cited_as` entry be well formed and claimed by
  this artifact alone. Sources that now resolve to nothing, or to a point or page that isn't there,
  are warnings. Fix until there are no errors and no new warnings.
- Optionally open `<dev server>/#/artifacts/AR-nn?region=<spot>` to see the red box land (the
  board's dev server must be running; "This repo"). For many regions, the read-only spec
  `BOARD/e2e/artifacts-real.spec.ts` opens every one (`BOARD_E2E_REAL=1 npx playwright test` in BOARD).
- A stepped diagram: with the dev server running, `npm --prefix BOARD run artifact:steps -- AR-nn`
  screenshots the whole drawing and then each step (`00-whole.png`, `01-<step-id>.png` ...) and
  prints where; read every one.
- Report the new ID, its regions and the items linked, briefly.

## Replacing or retiring one

Never delete an artifact or reuse its ID. A new version of the same file: overwrite the file in place
(history shows the before and after). Something different that replaces it: register the new one,
then set the old one's `status: Retired` and `superseded_by: AR-nn`, and move the item links over;
sources citing the old one hand on to the new. One that no longer reflects the design, with nothing
to replace it: set `status: Retired` and leave out `superseded_by`; sources citing it still open it
(nothing hands on). Either way the board hides it on the Artifacts tab unless retired artifacts are
shown; take it out of live items' `artifacts:` and text links, since `check` warns on those.
Retired is the only past status: there is no `Superseded` status (`check` errors on one), because
whether something replaced it is what `superseded_by` says.
