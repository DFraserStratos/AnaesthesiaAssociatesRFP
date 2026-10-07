# Catalogue format

The requirements catalogue: one Markdown file per epic, feature, story and outstanding item (an
open question or a missing source), plus artifacts (the diagrams, transcripts, notes and documents
behind them). Humans
edit it in the Requirements Board (`requirements-board/`, `npm run dev:board` from the repo root);
agents and people edit the files directly. Both are first-class: the board watches this folder and
picks up file edits live.

```
catalogue/
  requirements/EP-01.md  FT-01.1.md  US-01.1.1.md ...   one file per epic / feature / story (flat)
  questions/OQ-01.md ...                           one file per outstanding item (question or missing source)
  artifacts/AR-01.md  AR-01.svg ...                one sidecar per artifact (name, metadata, highlights), and the files drawn for the catalogue
  notes/YYYY-MM-DD-<slug>.md                       meeting notes, transcripts, Q&A: the evidence sources cite (see notes/README.md)
  board-layout.json                                Freeform card positions and the Mapped board's lane list (written by the board)
  assets/<ID>/<name>.png                           screenshots for an item
  SCHEMA.md                                        this file
```

The file name is the ID. Requirement files are flat on purpose: the parent is a field, so reparenting never
moves a file.

## Item file

```md
---
id: US-01.1.1
type: story
parent: FT-01.1
title: Two Lists per anaesthetist per day
status: Proposed
components:
  - Scheduling Engine
sources:
  - "RFP p.14 · Schedule Management › List"
  - "Q&A 2026-09-24 #7"
order: 1
swimlane: MVP
related:
  - US-01.2.1
images: []
---

The Scheduling Engine creates exactly two Lists, an AM and a PM List, for every active anaesthetist ...

This is so the admin team always have somewhere to make bookings.

## Acceptance criteria

- Given an active anaesthetist, when a day is generated, then they have one AM and one PM List.

## Technical discussion

Lists are generated ahead by the Scheduling Engine, not on first view.

## Notes

About 85 x 120 x 2 = 20,000 List records at current roster size.
```

| Field | Rule |
| --- | --- |
| `id` | `EP-nn` epic, `FT-nn.m` feature, `US-nn.m.k` story (`US-nn.0.k` for a story directly under an epic). Must match the file name. Never reused, never renumbered. |
| `type` | `epic`, `feature` or `story`. Cannot change. |
| `parent` | Omitted for epics. A feature's parent is an epic; a story's parent is a feature or an epic. Reparenting keeps the ID. |
| `title` | Short name, sentence case. |
| `status` | `Confirmed`, `Proposed`, `Future`, `Open`, `Verify`, `Retired` (meanings in `../README.md`). Where a requirement came from is not a status: that is `sources`. |
| `components` | Should list one or more of (an empty list is a warning): Scheduling Engine, Billing/Invoice Engine, Anaesthetist App (mobile + web), Admin App, Xero Integration, Health Integration, Master Data, Cross-cutting. |
| `sources` | Where it came from, as an **ordered list, oldest origin first**. RFP entries come first, one per page, as `"RFP p.<printed page> · <Section> › <subheading>"` (the page number from the PDF footer, the subheading as the RFP words it). Later inputs follow in date order: `"Notes 2026-10-02 · stakeholder workshop"` (a file in `notes/`), `"Q&A 2026-09-24 #n"`, a diagram, data files. Quote each entry. An empty list means the origin is unknown: `check` warns, and a `missing-source` outstanding item should affect the item. |
| `order` | Sort position among siblings (1-based). Gaps are fine. The board's Mapped mode rewrites it when a card is dragged: the destination siblings are renumbered 1..n, the ones left behind keep their gaps. |
| `swimlane` | Stories only, optional: the name of the Mapped board's swim lane the story sits in (MVP, Phase 2, Out of scope, or any label). It must be one of `lanes` in `board-layout.json` (`check` warns otherwise). Omitted means the first lane (Unassigned unless renamed via `firstLane`). Independent of `status` and of the parent: a story keeps its feature whatever lane it is in. Renaming a lane on the board rewrites every story in it. |
| `related` | Optional: items this one is related to, by ID (epics, features, stories; never an `OQ-nn`). A relation is **stored on one side only** and the board shows it on both cards, so list it on whichever card you are editing and never on both (`check` warns). Omitted when empty. For couplings the text doesn't name (a setting and the rule that reads it, a UI story and its engine story, the step before or after); a card the text already links to needs no entry. See Links below. |
| `artifacts` | Optional: artifacts this item points at, as `AR-nn` (the whole artifact) or `AR-nn#spot` (a highlighted spot in it: a named region, a PDF page `p27`, a Markdown heading slug, or a line range `L27-33`). Shown on the item's sheet under Artifacts, and on the artifact's Linked tab. Each must exist (`check` errors otherwise); linking to a Superseded artifact warns. Agents add these; the board keeps them on every save. Omitted when empty. See Artifact file below. |
| `images` | Screenshots, each `{src: assets/US-01.1.1/dashboard.png, viewport: desktop, app: web, caption: Dashboard}`. `viewport` is `desktop` or `mobile`; `app` (optional) is `admin`, `web`, `mobile` or `simulator` and groups the board's gallery; a `mobile` app shot should have `viewport: mobile`. `src` must be under `assets/` and the file must exist. Files named `assets/<ID>/<app>-<name>[-<state>].png` are written by the capture runner (`requirements-board/scripts/capture.ts`) and replaced on each run; any other image is kept. |

Body: the description (plain language: who or what acts and what happens, then why in its own
paragraph, a blank line between paragraphs, bullets instead of long comma chains; not the "As a ...,
I ..., so that ..." template), then up to three optional
sections, written in this order: `## Acceptance criteria` (one criterion per list item, Given/When/Then
where it helps), `## Technical discussion`, `## Notes`. Every type (epic, feature, story) may have
them; an empty section is not written. The board reads the sections in any order, but writes them in
this one. Markdown is fine and multi-line is fine, but no part of the body can itself contain one of
those three heading lines (each heading is what starts its section; use `###` or other wording).

**Quote strings in frontmatter.** YAML reads an unquoted ` #` as the start of a comment and
silently drops the rest (`- Q&A 2026-09-24 #7` becomes `Q&A 2026-09-24`), turns bare numbers into
numbers (`title: 1.10` becomes `1.1`), and rejects an unquoted `: ` inside a value. Wrap any value
containing `#`, `: ` or that looks like a number in double quotes, and leave every other value
bare (`- OQ-70`, not `- "OQ-70"`). The board writes files this way, `check` warns when a hand edit
trips over it, and the board's round-trip test fails on a value quoted when it needn't be.

Any other frontmatter key is kept as-is by the board, so you can add fields without breaking it.

## Links

Any Markdown text (an item's description and sections, a question and its answer) can link to
another record:

- **A text link**: `[the anaesthetist's prepaid set](US-06.1.1)`, standard Markdown whose target
  is a record ID. The words stay as written; the board makes them open that card. Link the words
  that name the thing, not a whole sentence, and don't reword the text to fit a link.
- **A bare ID** in running text, `(OQ-25)`, is a link too: the board shows it as the record's
  title. A title in brackets straight after the ID, as in `the former US-01.3.4 (AM and PM can
  differ)`, is folded into it.

An artifact links the same ways: `[the pricing steps](AR-01#price-rules)` opens the artifact at
that spot in its red box, and a bare `AR-01` reads as the artifact's name. A link to a missing
artifact or spot is an error, as for a card.

Neither counts inside code (backticks or a fenced block). The board lists, under **Related** on each
card, the `related` entries from both sides and then the cards whose text mentions it ("Mentioned
in"), leaving out its own lineage and children, which the card already shows.

When adding links (by hand or by an agent):

- Link a phrase when another item **defines** the rule, concept or behaviour it names. US-06.2.1's
  "RVG code in the anaesthetist's prepaid set" is defined by US-06.1.1, so it links there.
- Link the most specific item (a story over its feature over its epic). Don't link an item to
  itself, its own parent or epic, or its own children. Don't link to a Retired item, and don't edit
  Retired items.
- Link the first mention in each section only, and keep it to about four text links per item.
- Leave everyday domain nouns (Booking, List, Procedure, Contract, anaesthetist) unlinked unless
  the sentence relies on the specific rule a particular item states.
- Use `related` for items that are coupled but not named in the text: a setting and the rule that
  reads it (US-06.1.1 and US-06.2.1), a UI story and its engine story, one step and the step after it.
  About four per item at most; being siblings is not enough.
- In the board, copy a card's link by clicking its ID (bottom right of its sheet), then select
  words in any Markdown field and paste. Cmd+K over a selection picks the card by title instead.

## Outstanding item file

```md
---
id: OQ-06
kind: question
title: Base units on RVG code or on Contract
status: Proposed
owner: Donald
affects:
  - US-04.2.3
  - US-05.1.1
sources:
  - "Q&A 2026-09-24 #2 #3"
---

Recommendation: base units live on the RVG code master ...

## Answer

(when answered)
```

`kind` is `question` (a decision or fact that blocks or shapes requirements) or `missing-source`
(an item whose origin is unknown; resolve it by adding the item's source, then answer it with where it
came from). A file with no `kind` reads as `question`. `status` is `Open`, `Confirm`, `Proposed` or `Answered`. `affects` lists item IDs
that must exist. The body is the question (which cannot itself contain a `## Answer` line);
`## Answer` holds the answer once there is one.

## Artifact file

An artifact is a diagram, mockup, screenshot, transcript, note or document that requirements point
at. Its sidecar `artifacts/AR-nn.md` holds its name and facts; the file it shows sits beside the
sidecar (a diagram drawn for the catalogue: `artifacts/AR-nn.svg`) or stays where it already lives
(a transcript, a note, a PDF). The board shows artifacts on its Artifacts tab, and its Edit details
changes only the sidecar's `title`, `kind`, `status`, `superseded_by`, `date`, `author`,
`components`, `sources` and description; agents write everything else (the file, `regions`, the
mermaid source) and register new artifacts.

```md
---
id: AR-01
title: How the system works out a price
kind: diagram
status: Current
date: 2026-10-06
author: Donald Fraser, drawn with the aa-svg-diagram skill
components:
  - Billing/Invoice Engine
sources:
  - "Q&A 2026-09-24 #2"
file: artifacts/AR-01.svg
regions:
  - id: price-rules
    name: Work out the price
    around:
      - rect[x="900"][y="78"]
    note: Override, typed price, fixed price, then calculate
  - id: rejected
    name: Rejected, never guessed
    around:
      - text=Rejected, never guessed
      - text=• the contract is not valid on the procedure date
    pad: 10
---

The four steps from a Procedure's inputs to a priced, invoiced line ...
```

| Field | Rule |
| --- | --- |
| `id` | `AR-nn`. Must match the file name. Never reused, never renumbered. |
| `title` | The artifact's name, independent of its file's name. Sentence case. |
| `kind` | `diagram`, `mockup`, `screenshot`, `photo`, `transcript`, `note` or `document`: what it is, for its icon and for filtering. |
| `status` | `Current` (the baseline, unmarked on the board), `Draft`, or `Superseded`. |
| `superseded_by` | Superseded only: the `AR-nn` that replaced it. |
| `date` | When the artifact itself was made, not when it was filed: a meeting's date for its transcript and notes, a document's publication, a diagram's drawing. `YYYY-MM-DD`, or `YYYY-MM` or `YYYY` (quoted, `"2021"`) when that is all that is known. Shown on the Artifacts tab, which lists each kind newest first. `check` warns when it is missing. |
| `author` | Optional: who made it. |
| `components` | Optional: the same vocabulary as an item's. |
| `sources` | Where it came from, as for an item (`check` warns when empty). |
| `file` | The file it shows. A plain path is relative to this catalogue folder (`artifacts/AR-01.svg`, `notes/2026-10-01-aa-meeting-with-greg.md`); a path starting `/` is relative to the repository root (`/docs/rfp-reference/Anaesthesia Associates Request for Proposal[Final].pdf`). It must stay inside its base. `.svg`, `.png`, `.jpg`, `.jpeg`, `.webp`, `.md` or `.pdf`; a Markdown document never lives in `artifacts/`, where every `.md` is a sidecar. Omit it for a mermaid diagram. |
| `regions` | Optional: the named spots items can link to, each drawn as a red box. See below. |

Body: the description (Markdown, links work), then for a mermaid diagram a `## Source` section
holding one fenced ` ```mermaid ` block, which the board draws.

**Regions.** Each has an `id` (lower-case words joined by hyphens, unique in the artifact), a
`name`, and either anchors (`around`) or a `box`:

- `around` lists anchors, and the box goes round all their matches together, plus `pad` (8 by
  default, in the artifact's units), the way a capture recipe's highlight does:
  - `text=<exact text>`: an SVG `<text>` element whose whole text is this (whitespace collapsed;
    `check` warns when it matches more than one);
  - a CSS selector, run inside the drawing: `rect[x="460"][y="78"]`, `#stage-2`, `g.panel`;
  - `node=<id>`: a mermaid flowchart node;
  - `quote=<passage>`: a passage in a Markdown or PDF document (spacing, line breaks and emphasis
    marks ignored), quoted as the document reads;
  - `heading=<title>`: a Markdown section, its heading and everything under it.
- `box: [x, y, width, height]` in the artifact's own units: SVG viewBox units (a viewBox can start
  away from 0), image pixels, or PDF points from the page's top left. For an image it is the only
  way; for a drawing it is the fallback when nothing can be anchored.
- `page`: required for a PDF region, the page the anchors or box are on (from 1).
- `note`: optional, a line on what the spot shows.

Prefer anchors to boxes: they follow the drawing when it is redrawn, and `check` says when one stops
matching. Documents also have spots of their own, which need no region: each PDF page (`p27`), each
Markdown heading (its GitHub slug, `prepayment-cancellation-and-anaesthetist-reassignment`) and any
range of lines (`L27-33`, or `L27` for one). A named region's id can't take one of those.

## Board layout file (`board-layout.json`)

Written by the board; safe to hand-edit while it is closed.

```json
{
  "positions": {
    "US-01.1.1": {"x":120,"y":480}
  },
  "firstLane": "Backlog",
  "lanes": [
    "MVP",
    "Phase 2"
  ]
}
```

`positions`: cards dragged off the computed layout in the board's Freeform mode, one per line.
`lanes` (omitted while empty): the Mapped board's named swim lanes, top to bottom. The first lane
(stories with no `swimlane`) is implicit and always first; `firstLane` (omitted until renamed) is
what it is called, `Unassigned` by default. Renaming it changes no story. All lane names, the first
lane's included, are unique regardless of case.

## Rules the tools enforce

`npm run check` (from the repo root) and every save in the board run the same checks: unique IDs,
ID shape per type, file name matches ID, parent exists and has the right type, vocabulary values,
`affects` targets exist, `related` entries are existing items (not the item itself, not a question),
a text link to an epic, feature or story names one that exists, image files exist under `assets/`,
every artifact's sidecar is well formed, its file exists and reads as its format, every region's
anchors match (a text, a simple selector, a node, a quote, a heading) and its box and page lie inside the
artifact, an item's `artifacts` and any `AR-` link name an artifact and spot that exist,
and (as warnings) a `swimlane` sits only on a story and names a lane in `board-layout.json`; a
relation listed on both cards or twice; a link or relation to a Retired item; a bare ID, or a link
to a question, that names nothing (questions can be deleted, so this never blocks a delete). The board refuses a save that would add
an error. A file that fails to parse, or whose `id:` differs from its file name, is left out of the board and
listed under Checks until fixed; its ID stays reserved, so nothing new is ever written
over it.

## Conventions

- **No deletes for items.** Retire an item by setting `status: Retired`; the ID stays taken.
- **No deletes for artifacts.** Replace one by setting `status: Superseded` and `superseded_by`;
  the ID stays taken. The board never creates artifacts and never changes their files or
  regions, only their details: add them and change those as files (the `add-artifact` skill, or
  `npm --prefix requirements-board run artifact:new`).
- **Questions can be deleted** (the board's Delete, or remove the file): no other file changes. A
  text link to the deleted question becomes a `check` warning, and the board shows it as a
  broken link until the text is fixed. Deleting the highest `OQ-nn` frees that number for the next
  new question, so prefer answering one that was simply settled.
- **New IDs**: next free number under the parent (the board assigns them). By hand: look at the
  highest sibling ID and add one.
- **Answering a question**: set `status: Answered`, add `## Answer`, then move the affected items
  off `Open`: to `Confirmed` where the answer settles them, to `Verify` where the item still needs
  checking with AA (the board offers this for every item the question affects, whatever its status).
- Keep the serialised shape (key order, block lists, blank line after the fence) so diffs stay
  small; the board rewrites files in exactly this shape.
- CSV for Miro or a spreadsheet: `npm run export:csv` writes `requirements.csv` and
  `open-questions.csv` next to this folder in the old column shape. They are outputs, not sources.
