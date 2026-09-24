# Catalogue format

The requirements catalogue: one Markdown file per epic, feature, story and open question. Humans
edit it in the Requirements Board (`requirements-board/`, `npm run dev:board` from the repo root);
agents and people edit the files directly. Both are first-class: the board watches this folder and
picks up file edits live.

```
catalogue/
  items/EP-01.md  FT-01.1.md  US-01.1.1.md ...   one file per epic / feature / story (flat)
  questions/OQ-01.md ...                           one file per open question
  board-layout.json                                card positions moved off the story map (written by the board)
  assets/<ID>/<name>.png                           screenshots for an item
  SCHEMA.md                                        this file
```

The file name is the ID. Items are flat on purpose: the parent is a field, so reparenting never
moves a file.

## Item file

```md
---
id: US-01.1.1
type: story
parent: FT-01.1
title: Two Lists per anaesthetist per day
status: RFP
components:
  - Scheduling Engine
sources:
  - "RFP: Schedule Management"
order: 1
images: []
---

As the system, I create exactly two Lists (AM and PM) for every active anaesthetist ...

## Notes

About 85 x 120 x 2 = 20,000 List records at current roster size.
```

| Field | Rule |
| --- | --- |
| `id` | `EP-nn` epic, `FT-nn.m` feature, `US-nn.m.k` story (`US-nn.0.k` for a story directly under an epic). Must match the file name. Never reused, never renumbered. |
| `type` | `epic`, `feature` or `story`. Cannot change. |
| `parent` | Omitted for epics. A feature's parent is an epic; a story's parent is a feature or an epic. Reparenting keeps the ID. |
| `title` | Short name, sentence case. |
| `status` | `Confirmed`, `RFP`, `Proposed`, `Future`, `Open`, `Retired` (meanings in `../README.md`). |
| `components` | Should list one or more of (an empty list is a warning): Scheduling Engine, Billing/Invoice Engine, Anaesthetist App (mobile + web), Admin App, Xero Integration, Health Integration, Master Data, Cross-cutting. |
| `sources` | Where it came from: RFP section, diagram, meeting notes, `"Q&A 2026-09-24 #n"`, data files. Quote each entry. |
| `order` | Sort position among siblings (1-based). Gaps are fine. |
| `images` | Screenshots, each `{src: assets/US-01.1.1/dashboard.png, viewport: desktop, caption: Dashboard}`. `viewport` is `desktop` or `mobile`; `src` must be under `assets/` and the file must exist. |

Body: the description (stories use "As a ..., I ..., so that ..."), then an optional `## Notes`
section. Markdown is fine and multi-line is fine, but the description cannot itself contain a
`## Notes` line (that heading is what starts the Notes section; use `### Notes` or other wording).

**Quote strings in frontmatter.** YAML reads an unquoted ` #` as the start of a comment and
silently drops the rest (`- Q&A 2026-09-24 #7` becomes `Q&A 2026-09-24`), turns bare numbers into
numbers (`title: 1.10` becomes `1.1`), and rejects an unquoted `: ` inside a value. Wrap any value
containing `#`, `: ` or that looks like a number in double quotes. The board writes files this way,
and `check` warns when a hand edit trips over it.

Any other frontmatter key is kept as-is by the board, so you can add fields without breaking it.

## Question file

```md
---
id: OQ-06
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

`status` is `Open`, `Open (from RFP)`, `Confirm`, `Proposed` or `Answered`. `affects` lists item IDs
that must exist. The body is the question (which cannot itself contain a `## Answer` line);
`## Answer` holds the answer once there is one.

## Rules the tools enforce

`npm run check` (from the repo root) and every save in the board run the same checks: unique IDs,
ID shape per type, file name matches ID, parent exists and has the right type, vocabulary values,
`affects` targets exist, image files exist under `assets/`. The board refuses a save that would add
an error. A file that fails to parse, or whose `id:` differs from its file name, is left out of the board and
listed under Checks until fixed; its ID stays reserved, so nothing new is ever written
over it.

## Conventions

- **No deletes.** Retire an item by setting `status: Retired`; the ID stays taken.
- **New IDs**: next free number under the parent (the board assigns them). By hand: look at the
  highest sibling ID and add one.
- **Answering a question**: set `status: Answered`, add `## Answer`, then flip the affected items
  from `Open` to `Confirmed` where the answer settles them (the board offers this).
- Keep the serialised shape (key order, block lists, blank line after the fence) so diffs stay
  small; the board rewrites files in exactly this shape.
- CSV for Miro or a spreadsheet: `npm run export:csv` writes `requirements.csv` and
  `open-questions.csv` next to this folder in the old column shape. They are outputs, not sources.
