# Updated Requirements

Source of truth for the AA Booking and Billing system's **future state**, superseding the RFP
where they differ. Started 2026-09-24 from the RFP, the six future-state diagrams, meeting notes
with AA's lead administrator, and the Q&A that followed.

## Files

| File | What it is | Edit it? |
| --- | --- | --- |
| `catalogue/` | The catalogue: one Markdown file per epic, feature, story (`requirements/`) and outstanding item (`questions/`: open questions and missing sources), the notes that sources cite (`notes/`), plus board layout and screenshots. Format in `catalogue/SCHEMA.md`. | Yes, this is the editing surface: in the Requirements Board or directly in the files. |
| `domain-model.md` | Narrative: what changed since the RFP, entity model, recommended Contract structure, calculation rules, glossary. | Yes. |
| `catalogue/notes/` | Meeting notes, transcripts and Q&A behind the catalogue, one dated file each (`2026-09-24-source-notes.md` is the first). Conventions in `catalogue/notes/README.md`. | Add new files; existing ones append only. |
| `RFP.md`, `...[Final].pdf` | The original RFP. Historical reference. | No. |
| `../Data files/` | NZSA RVG 2021, real contract fee schedules (SXAP, CES HNZ, Merivale). Evidence for the Contract model. | No. |
| `build_requirements.py` | The retired Python generator the catalogue was migrated from. Not used any more. | No. Delete once committed. |

## Requirements Board

A local app over the catalogue folder: story-map board (drag cards, trace lineage, filter), outstanding
items list (open questions and missing sources) with the answer flow, outline view, and an item sheet for reading and editing.

```
npm run setup               # once, from the repo root: installs the root, aa-prototype/ and requirements-board/
npm run dev                 # prototype (5173) and board (5180) together
npm run dev:board           # the board alone: http://localhost:5180
npm run check               # validate the catalogue
npm run export:csv          # requirements.csv + open-questions.csv here, for Miro or a spreadsheet
```

The board reads and writes the files through its dev server; there is no database. Edits made
elsewhere (an agent, a terminal, `git checkout`) show up in the open board within a moment. If an
item you are editing changes on disk, the board asks whether to keep yours or load theirs.

## Conventions

**IDs.** `EP-nn` epic, `FT-nn.m` feature under epic nn, `US-nn.m.k` story under feature nn.m
(`US-nn.0.k` for a story directly under an epic). IDs are stable; retire an item by setting status
to `Retired` rather than deleting it.

**Status.**

| Status | Meaning |
| --- | --- |
| Confirmed | Stated in the 2026-09 meeting notes, diagrams, or Donald's Q&A answers. |
| Proposed | Not yet confirmed with AA: carried from the RFP, or a recommendation to fill a gap. The sources say which. Needs sign-off. |
| Future | RFP scope that does not reflect current reality (hospital integrations). Kept, deferred. |
| Open | Depends on an open question. |
| Retired | No longer wanted. Kept for traceability. |

**Component.** Scheduling Engine · Billing/Invoice Engine · Anaesthetist App (mobile + web) ·
Admin App · Xero Integration · Health Integration · Master Data · Cross-cutting.

**Source.** Where the requirement came from, as an ordered list, oldest first: the RFP page(s)
(`RFP p.24 · Billing Engine › The three components`), then later notes, Q&A, diagrams or data files.
An item with no known source has an empty list and a `missing-source` outstanding item. See
`catalogue/notes/README.md`.

## Updating

1. Change or add items in the board, or edit / add files in `catalogue/` (see `SCHEMA.md`).
2. Run `npm run check` if you edited files by hand. The board checks on every save.
3. If the change alters the model (an entity, a rule, a superseded RFP reading), update
   `domain-model.md` too, including the "What changed since the RFP" table.
4. When an open question is answered, set its status to `Answered`, add `## Answer`, and flip the
   affected items from `Open` to `Confirmed` (the board offers this when you answer).

## Miro

Run `npm run export:csv`, then Miro's Import → CSV. Suggested mapping: Title → card title,
Description → card description, Type / Status / Component → tags, ID → title prefix or a custom
field. The Parent column gives the connector relationships.
