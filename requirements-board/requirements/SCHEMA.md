# Catalogue format

The requirements catalogue: one Markdown file per epic, feature, story and outstanding item (an
open question or a missing source), plus artifacts (the diagrams, transcripts, notes and documents
behind them). Humans
edit it in the Requirements Board (`requirements-board/`, `npm run dev:board` from the repo root);
agents and people edit the files directly. Both are first-class: the board watches this folder and
picks up file edits live.

```
requirements-board/requirements/
  stories/EP-01.md  FT-01.1.md  US-01.1.1.md ...   one file per epic / feature / story (flat)
  questions/OQ-01.md ...                           one file per outstanding item (question or missing source)
  artifacts/AR-01.md ...                           one sidecar per artifact (name, metadata, highlights)
  artifacts/files/AR-01.svg ...                    the artifact files themselves: diagrams, transcripts, documents
  notes/YYYY-MM-DD-<slug>.md                       meeting notes, Q&A: the evidence sources cite (see notes/README.md)
  changes/YYYY-MM-DD-<slug>.md                     one change log per requirements update (see changes/README.md)
  board-layout.json                                Freeform card positions and the Mapped board's lane list (written by the board)
  VOICE.md                                         how requirements are written: the words, not the format (edited on Settings)
  board.config.json                                the project's vocabulary: name, components, screenshot apps, status wording, capture
  capture/                                         screenshot capture: recipes/<ID>.json, the report, project steps (optional)
  assets/<ID>/<name>.png                           screenshots for an item
  domain-model.md                                  the narrative model: entities, rules, what changed since the source documents
  reference/                                       historical inputs kept for reference (not edited)
  exports/                                         CSV exports (`npm run export:csv`), not committed
  README.md                                        what this folder holds, the conventions, how to update it
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
title: Two Pick Lists per warehouse per day
status: 4
components:
  - Scheduling Engine
sources:
  - "RFP p.14 · Fulfilment › Pick List"
  - "Q&A 2026-09-24 #7"
order: 1
swimlane: MVP
related:
  - US-01.2.1
images: []
---

The Scheduling Engine creates exactly two Pick Lists, an AM and a PM Pick List, for every active warehouse ...

This is so the order team always have somewhere to place orders.

## Acceptance criteria

- Given an active warehouse, when a day is generated, then it has one AM and one PM Pick List.

## Technical discussion

Pick Lists are generated ahead by the Scheduling Engine, not on first view.

## Notes

About 85 x 120 x 2 = 20,000 Pick List records at current warehouse count.
```

| Field | Rule |
| --- | --- |
| `id` | `EP-nn` epic, `FT-nn.m` feature, `US-nn.m.k` story (`US-nn.0.k` for a story directly under an epic). Must match the file name. Never reused, never renumbered. |
| `type` | `epic`, `feature` or `story`. Cannot change. |
| `parent` | Omitted for epics. A feature's parent is an epic; a story's parent is a feature or an epic. Reparenting keeps the ID. |
| `title` | Short name, sentence case (`VOICE.md`). |
| `status` | A status code from `statuses` in `board.config.json`: a whole number from 1 (`status: 4`). **The number means whatever `board.config.json` says it means** (label, help, tone, role, settle) and differs between projects: never infer a status from its number, look it up in the config (or the board's Settings page). This project's list is in `README.md`. Labels, help, colour and order are config, so renaming a status touches no file. Where a requirement came from is not a status: that is `sources`. |
| `components` | Should list one or more of the `components` in `board.config.json` (an empty list is a warning; with none configured, any name is accepted). |
| `sources` | Where it came from, as an **ordered list, oldest origin first**. RFP entries come first, one per page, as `"RFP p.<printed page> · <Section> › <subheading>"` (the page number from the PDF footer, the subheading as the RFP words it). Later inputs follow in date order: `"Notes 2026-10-02 · stakeholder workshop #3"` (a file in `notes/`, at a numbered point), `"Q&A 2026-09-24 #n"`, a diagram, data files. Quote each entry. An empty list means the origin is unknown: `check` warns, and a `missing-source` outstanding item should affect the item. Each source opens the artifact spot it cites (see Sources below); one that looks like a citation but resolves to nothing is a `check` warning. |
| `order` | Sort position among siblings (1-based). Gaps are fine. The board's Mapped mode rewrites it when a card is dragged: the destination siblings are renumbered 1..n, the ones left behind keep their gaps. |
| `swimlane` | Stories only, optional: the name of the Mapped board's swim lane the story sits in (MVP, Phase 2, Out of scope, or any label). It must be one of `lanes` in `board-layout.json` (`check` warns otherwise). Omitted means the first lane (Unassigned unless renamed via `firstLane`). Independent of `status` and of the parent: a story keeps its feature whatever lane it is in. Renaming a lane on the board rewrites every story in it. |
| `related` | Optional: items this one is related to, by ID (epics, features, stories; never an `OQ-nn`). A relation is **stored on one side only** and the board shows it on both cards, so list it on whichever card you are editing and never on both (`check` warns). Omitted when empty. For couplings the text doesn't name (a setting and the rule that reads it, a UI story and its engine story, the step before or after); a card the text already links to needs no entry. See Links below. |
| `artifacts` | Optional: artifacts this item points at, as `AR-nn` (the whole artifact) or `AR-nn#spot` (a highlighted spot in it: a named region, a step of a stepped diagram, a PDF page `p27`, a Markdown heading slug, or a line range `L27-33`). Shown on the item's sheet under Artifacts, and on the artifact's Linked tab. Each must exist (`check` errors otherwise); linking to a Retired artifact warns. Agents add these; the board keeps them on every save. Omitted when empty. See Artifact file below. |
| `images` | Screenshots, each `{src: assets/US-01.1.1/dashboard.png, viewport: desktop, app: web, caption: Dashboard}`. `viewport` is `desktop` or `mobile`; `app` (optional) is one of the `screenshotApps` keys in `board.config.json` and groups the board's gallery; a shot's `viewport` should match its app's. `src` must be under `assets/` and the file must exist. Files named `assets/<ID>/<app>-<name>[-<state>].png` are written by the board's capture runner (`scripts/capture.ts`) and replaced on each run; any other image is kept. |

Body: the description, written in the catalogue's voice (`VOICE.md`: who or what acts and what
happens, then why; not the "As a ..., I ..., so that ..." template), then up to three optional
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

- **A text link**: `[the customer's prepaid set](US-06.1.1)`, standard Markdown whose target
  is a record ID. The words stay as written; the board makes them open that card. Link the words
  that name the thing, not a whole sentence, and don't reword the text to fit a link.
- **A bare ID** in running text, `(OQ-25)`, is a link too: the board shows it as the record's
  title. A title in brackets straight after the ID, as in `the former US-01.3.4 (AM and PM can
  differ)`, is folded into it.

An artifact links the same ways: `[the pricing steps](AR-01#price-rules)` opens the artifact at
that spot in its red box (or, for a step of a stepped diagram, at that step), and a bare `AR-01`
reads as the artifact's name. A link to a missing artifact or spot is an error, as for a card.

Neither counts inside code: a backtick span (closed by a run of the same length, never across a
blank line; a lone backtick is plain text) or a fenced block (three or more backticks or tildes,
closed by the same, at least as long). An image `![x](US-01.1.1)` is an image, not a link. The board lists, under **Related** on each
card, the `related` entries from both sides and then the cards whose text mentions it ("Mentioned
in"), leaving out its own lineage and children, which the card already shows.

When adding links (by hand or by an agent):

- Link a phrase when another item **defines** the rule, concept or behaviour it names. US-06.2.1's
  "product code in the customer's prepaid set" is defined by US-06.1.1, so it links there.
- Link the most specific item (a story over its feature over its epic). Don't link an item to
  itself, its own parent or epic, or its own children. Don't link to a retired item, and don't edit
  retired items.
- Link the first mention in each section only, and keep it to about four text links per item.
- Leave everyday domain nouns (Order, Pick List, Order line, Price list, customer) unlinked unless
  the sentence relies on the specific rule a particular item states.
- Use `related` for items that are coupled but not named in the text: a setting and the rule that
  reads it (US-06.1.1 and US-06.2.1), a UI story and its engine story, one step and the step after it.
  About four per item at most; being siblings is not enough.
- In the board, copy a card's link by clicking its ID (bottom right of its sheet), then select
  words in any Markdown field and paste. Cmd+K over a selection picks the card by title instead.

## Sources

The board opens each source, on an item, a question or an artifact, at the artifact spot it cites,
worked out live from the string (`shared/sources.ts`); nothing extra is written in the item. A source
is a **prefix** that names an artifact, then optionally a **spot**, then optionally **words for the
reader** after ` · ` or in brackets:

| Source | Opens |
| --- | --- |
| `"RFP p.27 · Pricing Engine › Price list holders"` | AR-15 at PDF page 28 (the RFP's `cited_as` adds `page_offset: 1`: its printed page runs one behind) |
| `"RFP response p.13 · Detailed Solution Design › ..."` | AR-36, page 13 |
| `"Notes 2026-10-01 · Client meeting #16"` | the note `notes/2026-10-01-client-meeting.md` (its artifact) at point 16 |
| `"Q&A 2026-09-24 #2 #3"` | AR-09, points 2 and 3 of its Q&A section (several points: one row, a link per point) |
| `"Transcript 2026-10-01 · Client meeting (A) L27-33"` | that transcript, lines 27 to 33 |
| `"Diagram: Order route"` | the current drawing of it, AR-24 |
| `OQ-62` | the question |
| `"Typed decision 2026-10-05 · Sam (product owner)"` | nothing: plain text, as is `Audit ...`, a sketch, a decision |

- **Which artifact.** A note answers to `Notes <date> · <words>` when the words slug to its file name
  (`notes/<date>-<slug>.md`), with no setup. Any other artifact lists the prefixes it answers to in
  its `cited_as` (Artifact file below); the longest prefix that fits wins. A retired artifact with a
  `superseded_by` hands on to it; one without hands on to nothing, and a source citing it opens it as it is. A source on an artifact that names that same artifact (a transcript's own
  `Recording ...`) shows plain.
- **Which spot.** `p.<n>`: a page (plus the entry's `page_offset`). `#<n>`, or a list `#2 #16`,
  `#2#16` or `#2, #16`: numbered points, each one checked. `L27-33`: lines. Nothing: the entry's `spot`,
  else its `within` section, else the whole artifact. A retired artifact hands on first, and the spot
  is found in its replacement (one the replacement lacks opens the whole replacement).
- **A note's points** are its numbered list items at the very start of a line (`16. **Title.** ...`,
  continuation lines indented), numbered once across the note; each runs to the next point, heading or
  paragraph at the margin. A point written as a heading or a bold `**16.**` is not one.
- **Check.** A source whose first word is one citations use (`Notes`, or the first word of any
  `cited_as`) but that matches no artifact, or names a point, page or line the file lacks (a page on
  anything but a PDF, lines on anything but a Markdown document, points on a file with none, a
  reversed or zero line range), is a warning naming the artifact and spot; so is an `OQ-nn` (perhaps
  with words after it, `OQ-01 · answered by Sam`) that names no question. A note cite whose words
  name a note but whose tail is no spot says so. They never block a save.
- `npm --prefix requirements-board run source -- "<source>"` (or `-- --item <ID> --text`) prints what
  a source resolves to and the cited passage; `-- --report` lists every source in the catalogue.

## Outstanding item file

```md
---
id: OQ-06
kind: question
title: Base price on product code or on Price list
status: 1
owner: Sam
affects:
  - US-04.2.3
  - US-05.1.1
sources:
  - "Q&A 2026-09-24 #2 #3"
---

Recommendation: base prices live on the product code master ...

## Answer

(when answered)
```

`kind` is `question` (a decision or fact that blocks or shapes requirements) or `missing-source`
(an item whose origin is unknown; resolve it by adding the item's source, then answer it with where it
came from). A file with no `kind` reads as `question`. `status` is a number from `questionStatuses` in `board.config.json` (look it up there; the answered one has role `answered`). `affects` lists item IDs
that must exist. The body is the question (which cannot itself contain a `## Answer` line);
`## Answer` holds the answer once there is one.

## Artifact file

An artifact is a diagram, mockup, screenshot, transcript, note or document that requirements point
at. Its sidecar `artifacts/AR-nn.md` holds its name and facts; the file it shows lives in
`artifacts/files/` (a diagram drawn for the catalogue, `artifacts/files/AR-nn.svg`, or a transcript,
document or PDF under its own name), or in `notes/` for a note. The board shows artifacts on its Artifacts tab, and its Edit details
changes only the sidecar's `title`, `kind`, `status`, `superseded_by`, `date`, `author`,
`components`, `sources` and description; agents write everything else (the file, `regions`, `steps`,
the mermaid source) and register new artifacts.

```md
---
id: AR-01
title: How the system works out a price
kind: diagram
status: Current
date: 2026-10-06
author: Sam Lee, drawn with the svg-diagram skill
components:
  - Pricing/Invoice Engine
sources:
  - "Q&A 2026-09-24 #2"
cited_as:
  - as: "Diagram: Pricing"
    spot: price-rules
file: artifacts/files/AR-01.svg
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
      - text=• the price list is not valid on the order date
    pad: 10
steps:
  - id: line-priced
    name: The order line is priced
    group: One order
    caption: The price comes from the price list; nothing is invoiced yet.
    show:
      - "#stage-1"
    highlight:
      - "#stage-1"
    balances:
      - account: Order total
        amount: $40
  - id: line-invoiced
    name: The line goes on the invoice
    group: One order
    show:
      - "#stage-2"
    moves:
      - from: "#priced-line"
        to: "#invoice-line"
---

The four steps from an Order line's inputs to a priced, invoiced line ...
```

| Field | Rule |
| --- | --- |
| `id` | `AR-nn`. Must match the file name. Never reused, never renumbered. |
| `title` | The artifact's name, independent of its file's name. Sentence case. |
| `kind` | `diagram`, `mockup`, `screenshot`, `photo`, `transcript`, `note` or `document`: what it is, for its icon and for filtering. |
| `status` | `Current` (the baseline, unmarked on the board), `Draft`, or `Retired` (no longer the version to go by, whether a newer artifact replaced it or nothing does; kept for traceability, hidden on the Artifacts tab unless retired artifacts are shown, and still opened by a link or URL). Retired is the only past status: there is no `Superseded` (`check` errors on it), since `superseded_by` already says whether something replaced it. A live item listing or linking a Retired artifact warns; a retired one needs no source, and links in its own description are not held to the live rules. |
| `superseded_by` | Retired only, and optional: the `AR-nn` that replaced it. Sources citing the retired artifact hand on to it, and the board shows "by" its title beside the status. |
| `date` | When the artifact itself was made, not when it was filed: a meeting's date for its transcript and notes, a document's publication, a diagram's drawing. `YYYY-MM-DD`, or `YYYY-MM` or `YYYY` (quoted, `"2021"`) when that is all that is known. Shown on the Artifacts tab, which lists each kind newest first. `check` warns when it is missing. |
| `author` | Optional: who made it. |
| `components` | Optional: the same vocabulary as an item's. |
| `sources` | Where it came from, as for an item (`check` warns when empty). |
| `cited_as` | Optional: how sources cite this artifact, when not by the notes convention. A list of entries, each `as` (the prefix a source starts with) and optionally `page_offset` (a PDF: added to a cited page), `within` (a heading slug: cited points are looked for in that section only) and `spot` (the spot a source with no spot of its own opens: a region, a step, a page `p27`, a line range `L1-10` or a heading slug). Agents write it (`artifact:new --cited-as`); the board keeps it. `check` errors on an entry with no `as`, a prefix two artifacts claim, a `within` or `spot` the file lacks, a `page_offset` off a PDF, and an entry for a note in `notes/` (cited by its file name already); it warns on a prefix one artifact lists twice, on two sidecars with the same `file`, and on a `cited_as` that is not a list or has keys the board ignores (`pageOffset` for `page_offset`), which are dropped on the next board save. See Sources above. |
| `file` | The file it shows. A plain path is relative to this folder (`artifacts/files/AR-01.svg`, `notes/2026-10-01-client-meeting.md`), and is the norm: every artifact file lives here. A path starting `/` is relative to the repository root (`/docs/some-file.pdf`), for a file that has to stay outside. It must stay inside its base. `.svg`, `.png`, `.jpg`, `.jpeg`, `.webp`, `.md` or `.pdf`; a Markdown document never lives directly in `artifacts/`, where every `.md` is a sidecar: it goes in `artifacts/files/`. Omit it for a mermaid diagram. |
| `regions` | Optional: the named spots items can link to, each drawn as a red box. See below. |
| `steps` | Optional, an SVG drawing only: makes it a stepped diagram the board plays one step at a time. Each step is a spot too. See Steps below. |
| `step_view` | Optional, a stepped diagram only: how the view behaves as it steps. `fixed` (the default, the same as leaving it out) leaves the view where it is; `follow` frames each step as the reader arrives at it. See Steps below. `check` errors on any other value, and on `step_view` on an artifact with no `steps`. Agents write it; the board keeps it. |

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
Markdown heading (its GitHub slug, `prepayment-cancellation-and-order-reassignment`) and any
range of lines (`L27-33`, or `L27` for one). A named region's id can't take one of those.

**Steps.** A stepped diagram is an SVG drawing whose sidecar lists `steps`, in order. The board
plays them: each step reveals more of the drawing, highlights what it is about, and shows a caption
and a small balances table. The file with everything visible is the finished picture, which is what
the thumbnail and the Diff review show. Each step has:

- `id`: lower-case words joined by hyphens, as a region's. Steps and regions share one set of spots,
  so a step's id can't be a region's, be listed twice, or look like a page or line spot (`p3`, `L27`).
  A step opens like a region: `AR-01#line-priced` in `artifacts` and in text links, `?region=line-priced`
  in the board's address. It shows no red box.
- `name`: short, shown in the step list and as the spot's name.
- `group`: optional, a section label; consecutive steps with the same label group together.
- `caption`: optional Markdown (links work, and `check` treats them as a description's links).
- `show`: anchors revealed at this step, in the same grammar as a region's `around` (`#id`, `.class`,
  any CSS selector, `text=...`). Reveal is cumulative and nothing is hidden again: anything named in
  any step's `show` starts hidden, and the drawing at a step is everything the steps up to it reveal.
  Anything no step names is always visible. An anchor may match many elements.
- `highlight`: anchors at full strength at this step only; the rest of what is visible dims. No
  `highlight` means nothing dims. Highlighting something a later step reveals is a `check` warning,
  since it is still hidden here.
- `moves`: optional, what travels at this step, in order. Each is a mapping of two anchors (same
  grammar as `show`): `from`, where it sets off (an element visible at this step; its first match is
  used), and `to`, what travels and where it lands (what this step reveals, or something already
  visible; every match travels). Arriving at the step by stepping forward from the step before, each
  `to` element sets off from the `from` element's place and size and flies to its own, a moment after
  the move before it; everything else the step reveals fades in as usual. Jumping to a step, stepping
  back and reduced motion skip the flight, and the finished state is always the static drawing.
  `check` errors on a move missing `from` or `to`, or an anchor that matches nothing, and warns on a
  `from` matching several elements and on a `from` or `to` a later step reveals.
- `balances`: optional rows of `account` and `amount`, both plain text (quote a number, `"0"`, to
  keep it exactly as written). The board marks the rows whose amount changed since the step before.

**The view while stepping** (`step_view`). By default (`fixed`) the view stays where it is as the
reader steps: right for a drawing that fits one screen. A wide flow that does not fit one screen
sets `step_view: follow`: arriving at a step, the view frames the step's focus (its `highlight`
matches, or its `show` matches when it highlights nothing, plus both ends of its moves) unless that
is already in view, never closer in than the drawing's own size; a step's moves fly once the view
settles, and the whole drawing fits everything again. Keep each step's highlight compact, since the
view frames all of it.

With no step chosen the board shows the whole drawing, nothing dimmed. `check` errors on steps on
anything but an SVG drawing, a step with no name, a balance row with no account, and an anchor that
matches nothing in the drawing.

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

## Board config file (`board.config.json`)

The project's own vocabulary, read by the board, the check and the scripts, and reloaded live.
Every field is optional; with no file the board runs on neutral defaults.

```json
{
  "project": { "name": "Acme ordering", "accent": "#2b6cb0" },
  "components": [{ "name": "Order engine", "code": "ORD" }, { "name": "Customer app" }],
  "screenshotApps": [{ "key": "web", "label": "Web", "viewport": "desktop" }, { "key": "phone", "label": "Phone", "viewport": "mobile" }],
  "statuses": [
    { "code": 1, "label": "Proposed", "help": "Needs sign-off from Acme", "tone": "neutral", "role": "default" },
    { "code": 2, "label": "Open", "help": "Waiting on an open question", "tone": "amber", "role": "waiting" },
    { "code": 3, "label": "Agreed", "help": "Agreed with Acme", "tone": "green", "settle": true },
    { "code": 4, "label": "Retired", "help": "No longer wanted", "tone": "hatched", "role": "retired" }
  ],
  "questionStatuses": [
    { "code": 1, "label": "Open", "heading": "Open", "help": "Waiting for an answer", "tone": "amber", "role": "default" },
    { "code": 2, "label": "Answered", "heading": "Answered", "help": "Settled", "tone": "green", "role": "answered" }
  ],
  "questionKinds": { "missing-source": { "help": "..." } },
  "capture": { "recipes": "capture/recipes", "report": "capture/REPORT.md", "steps": "capture/steps.ts", "apps": { "web": { "url": "http://localhost:3000", "setupRoute": "/", "hideCss": "" } } },
  "voice": { "descriptionWarnings": [{ "pattern": "\\bour reading\\b", "flags": "i", "message": "an \"our reading\" marker" }] }
}
```

`project.name` shows beside the board's name (always "Requirements board") in the masthead and the
browser tab; `project.accent` (optional, `#rrggbb`) fills the board's mark and the tab icon, so boards for different projects tell apart. Dates and times are always New Zealand English. `components` and `screenshotApps` are the lists the check
holds items to (empty: anything goes).
`statuses` (items) and `questionStatuses` (questions) are ordered lists; each entry is
`{ code, label, help, tone, role?, settle?, heading? }`. `code` is a whole number from 1, unique within its list. A file stores the `code`; the label, help,
colour (`tone`: neutral, amber, olive, green, forest, sand or hatched) and order are config, so
renaming or recolouring a status touches no file. `heading` (questions only) is the section title on
the Questions tab. Roles replace name checks. Item roles: `default` (new items start here; no pill
on cards), `waiting` (waiting on an open question; answering it pre-selects the first `settle`
status) and `retired` (hidden unless Retired is shown, struck through, skipped by the check and the
linking tools). `settle: true` marks the statuses offered when a question is answered. Question
roles: `default` and `answered`. There must be exactly one default and one retired item status and
at least one `settle`; one default and one answered question status. The board's Settings page
(`/settings`, the gear at the right of the masthead) edits these lists (label, help, heading, tone,
role, settle, order, add, remove) and writes the file; a status in use or holding a required role
can't be removed. A removed status is kept under `removedStatuses` (`{ "statuses": [{ "code": 7,
"label": "On hold" }], "questionStatuses": [] }`): its code is spent, and an old version storing it
reads as its last label, marked removed. A code is never handed out twice: a new status takes a
number past every code the list has ever used (live, removed, in a recode, or on a card), fixed once
saved (the number shows only in a quiet "No." column). The lists are only ever the project's own,
never the built-in ones: a bad `tone` falls back for that status alone, while a structural problem
(a missing or doubled code, a role or settle rule broken, a file that does not parse) is reported,
the board reads only what it can of the list, and status saves are refused until the file is fixed.
To change a code across the files use
`npm --prefix requirements-board run statuses:recode -- --items old=new,... --questions old=new,...` (it rewrites only `status:` lines, the board's history journal and the codes in these lists, and records
the run in `status-recodes.json` so diffs across it read a pure relabel as no change). A recode
renumbers to fresh codes: it refuses a target that it or an earlier recode moves away, or that was
used before, so it can't swap two numbers in place; to merge statuses, name the one kept as well
(`3=4,4=4`). Stop the board before a recode: it refuses to run beside one. `questionKinds`
changes only the wording beside a kind (`help`). `capture` is described in the board's README.
`voice.descriptionWarnings` is the check's backstop for the voice in `VOICE.md`: each entry is
`{ pattern, flags?, message }`, where `pattern` is a JavaScript regular expression (backslashes
doubled in JSON), `flags` defaults to `i`, and `message` is a short noun phrase naming what was
found. The check matches each pattern against the description (the text before the first `## `
section) of every epic, feature and story that is not retired, and warns once per rule per item:
`description has <message> ("<matched text>"): move provenance and history to Notes`. Notes,
acceptance criteria, questions and artifacts are not checked. Use it for provenance and decision
history that keep slipping into descriptions (decision numbers, "our reading", who said what on
which day). The file is edited by hand; the Settings page keeps the block as written. A malformed
entry is a `check` error and is left at its default (a pattern that does not compile is dropped).

## Rules the tools enforce

The check (`npm run check` in the board) and every save in the board run the same checks: unique IDs,
ID shape per type, file name matches ID, parent exists and has the right type, no card is (through its
parents) under itself, vocabulary values
(statuses, and the components and screenshot apps `board.config.json` lists),
`affects` targets exist, `related` entries are existing items (not the item itself, not a question),
a text link to an epic, feature or story names one that exists, image files exist under `assets/`,
every artifact's sidecar is well formed, its file exists and reads as its format, every region's
anchors match (a text, a simple selector, a node, a quote, a heading) and its box and page lie inside the
artifact, an item's `artifacts` and any `AR-` link name an artifact and spot that exist,
every `cited_as` entry is well formed and claimed once, and (as warnings) a source that looks like a
citation resolves to an artifact spot that exists (Sources above), a `swimlane` sits only on a story and names a lane in `board-layout.json`; a
relation listed on both cards or twice; a link or relation to a retired item; a bare ID, or a link
to a question, that names nothing (questions can be deleted, so this never blocks a delete). The board refuses a save that would add
an error. A file that fails to parse, or whose `id:` differs from its file name, is left out of the board and
listed under Checks until fixed; its ID stays reserved, so nothing new is ever written
over it.

## Conventions

- **No deletes for items.** Retire an item by setting its status to the one with role `retired` (6 here); the ID stays taken.
- **No deletes for artifacts.** Set one that is no longer the version to go by to `status: Retired`,
  adding `superseded_by` when a newer artifact replaced it. The ID stays taken. The board never creates artifacts and never changes their files or
  regions, only their details: add them and change those as files (the `add-artifact` skill, or
  the board's `npm run artifact:new`).
- **Questions can be deleted** (the board's Delete, or remove the file): no other file changes. A
  text link to the deleted question becomes a `check` warning, and the board shows it as a
  broken link until the text is fixed. Deleting the highest `OQ-nn` frees that number for the next
  new question, so prefer answering one that was simply settled.
- **New IDs**: next free number under the parent (the board assigns them). By hand: look at the
  highest sibling ID and add one.
- **Answering a question**: set the question to the status with role `answered` (4 here), add `## Answer`, then move the affected items
  off the `waiting` status: to a `settle` status where the answer settles them (Agreed 4 here), or to Verify (3 here) where the item still needs
  checking with whoever signs off. Never the final sign-off status (Confirmed 5 here: that is the client's sign-off, set only on explicit say-so) (the board offers this for every item the question affects, whatever its status).
- Keep the serialised shape (key order, block lists, blank line after the fence) so diffs stay
  small; the board rewrites files in exactly this shape.
- CSV for Miro or a spreadsheet: `npm run export:csv` writes `requirements.csv` and
  `open-questions.csv` next to this folder in the old column shape. They are outputs, not sources.
