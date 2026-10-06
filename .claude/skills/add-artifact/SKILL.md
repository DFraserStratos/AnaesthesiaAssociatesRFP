---
name: add-artifact
description: Register a diagram, image, mermaid diagram, transcript, note or PDF as a catalogue artifact - the next AR-nn with a sidecar naming it, its kind, sources and highlighted regions - then link the requirements it illustrates to it or to a spot in it, and check. Use when the user wants a file shown on the Requirements Board's Artifacts tab, wants requirements to point at a document or a spot in one, or hands over a diagram, transcript or document as evidence.
argument-hint: "<the file or mermaid source> [what it is, who made it, which requirements it supports]"
---

# Add an artifact

An artifact is anything requirements point at: a diagram, a mockup, a screenshot, a photo, a
transcript, a note, a document. The Requirements Board shows it on its Artifacts tab (read only:
artifacts are written as files, by agents) and draws a red box round any spot a requirement links
to. The format is under **Artifact file** in `CAT/SCHEMA.md`; read it first. `CAT` =
`docs/discovery-reference/Updated Requirements/catalogue`.

## 1. Register it

From the repo root:

```
npm --prefix requirements-board run artifact:new -- <file> --title "<name>" --kind <kind> --date <YYYY-MM-DD> [--author "..."] [--source "..."]
npm --prefix requirements-board run artifact:new -- --mermaid <file.mmd> --title "<name>" --date <YYYY-MM-DD>
```

- `--kind`: `diagram`, `mockup`, `screenshot`, `photo`, `transcript`, `note` or `document`.
- `--date`: when the artifact itself was made, not today: the meeting a transcript or note records,
  a document's publication date, the day a diagram was drawn. `YYYY-MM` or `YYYY` when that is all
  that is known (the RVG guide is `2021`).
- `--title`: what it shows, in plain words and sentence case ("How the system works out a price",
  not the file name).
- `--source`, repeatable: where it came from, in the requirements' sources convention
  (`"Notes 2026-10-02 · AA meeting with Greg #11"`, `"Q&A 2026-09-24 #2"`, `"Recording 2026-10-01 · ..."`).
- An SVG or image is copied into `CAT/artifacts/AR-nn.<ext>` (`--keep` leaves it in place). A
  Markdown file or a PDF stays where it lives and the sidecar points at it (a `/`-rooted path is
  from the repository root). A mermaid diagram lives in the sidecar under `## Source`.

The script prints what the file holds: an SVG's texts and element ids, a document's headings and
line count, a PDF's page count, a diagram's node ids. Choose anchors from that.

## 2. Fill in the sidecar (`CAT/artifacts/AR-nn.md`)

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

## 3. Link requirements to it

Read each candidate item first. Add the artifact to the item's frontmatter, just before `images:`:

```yaml
artifacts:
  - AR-07#rate-lookup
```

Link the most specific item (a story over its feature over its epic), and the spot that shows what
the item says (or the whole artifact when the item is about all of it). Don't link Retired items.
A text link works too, inside a description or answer: `[the pricing steps](AR-01#price-rules)`.
Insert the lines as text; don't re-save other people's files through a formatter.

## 4. Check and look

- `npm run check` from the repo root: every anchor must match (it says which don't), every link
  must name an artifact and spot that exist. Fix until there are no errors and no new warnings.
- Optionally open `http://localhost:5180/#/artifacts/AR-nn?region=<spot>` to see the red box land
  (the dev server must be running: `npm run dev`). For many regions, the read-only spec
  `requirements-board/e2e/artifacts-real.spec.ts` opens every one.
- Report the new ID, its regions and the items linked, briefly.

## Replacing or retiring one

Never delete an artifact or reuse its ID. A new version of the same file: overwrite the file in place
(history shows the before and after). Something different that replaces it: register the new one,
then set the old one's `status: Superseded` and `superseded_by: AR-nn`, and move the item links over.
