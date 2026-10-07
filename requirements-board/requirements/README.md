# Requirements

The requirements catalogue for this project: everything the Requirements Board (`../`) reads and
writes, and nothing else. The board, its scripts and its agent skills are generic; this folder is
the project's data. To start the board on another project, copy `requirements-board/` and empty
this folder down to `SCHEMA.md`, `README.md` (rewrite **This project**) and `notes/README.md`
(see "Bring the board to another repo" in `../README.md`).

## This project

Source of truth for the AA Booking and Billing system's **future state**, superseding the RFP
where they differ. Started 2026-09-24 from the RFP, the six future-state diagrams, meeting notes
with AA's lead administrator, and the Q&A that followed.

## Files

| File | What it is | Edit it? |
| --- | --- | --- |
| `stories/`, `questions/` | The catalogue: one Markdown file per epic, feature, story (`stories/`) and outstanding item (`questions/`: open questions and missing sources). Format in `SCHEMA.md`. | Yes, this is the editing surface: in the Requirements Board or directly in the files. |
| `domain-model.md` | Narrative: what changed since the RFP, entity model, recommended Contract structure, calculation rules, glossary. | Yes. |
| `notes/` | Meeting notes and Q&A behind the catalogue, one dated file each (`2026-09-24-source-notes.md` is the first). Conventions in `notes/README.md`. | Add new files; existing ones append only. |
| `artifacts/` | Artifacts: one sidecar per diagram, transcript, note or document (`AR-nn.md`: name, kind, highlighted spots). Requirements link to them, or to a spot in one; the board's Artifacts tab shows them. Format in `SCHEMA.md`. | Yes, as files (agents, the `add-artifact` skill); the board edits only their details (name, kind, status, date, author, area, sources, description). |
| `artifacts/files/` | The artifact files themselves: the diagrams drawn for the catalogue (`AR-nn.svg`), the meeting transcripts, the pricing model documents, NZSA RVG 2021 and its modifiers, the RFP PDF. | Add new files with the artifact; transcripts and documents are never rewritten. |
| `changes/` | One change log per requirements update; `/update-build-plan` reads them. | Add new files. |
| `assets/`, `board-layout.json` | Item screenshots and the board's card positions and lanes. | Through the board (screenshots also by `npm --prefix requirements-board run capture`). |
| `reference/RFP.md` | The original RFP. Historical reference. | No. |
| `reference/rfp-source-trace-2026-09-24.md` | One-off trace of the catalogue's RFP sources, 2026-09-24. | No. |
| `reference/build_requirements.py` | The retired Python generator the catalogue was migrated from. Not used any more. | No. |
| `exports/` | `npm run export:csv` output. Not committed. | No. |
| `../../docs/discovery-reference/Data files/` | Real contract fee schedules (SXAP, CES HNZ, Merivale). Evidence for the Contract model, not registered as artifacts. | No. |

## Requirements Board

A local app over this folder (`../README.md` has the detail): story-map board (drag cards, trace lineage, filter), outstanding
items list (open questions and missing sources) with the answer flow, outline view, and an item sheet for reading and editing.

```
npm run setup               # once, from the repo root: installs the root, aa-prototype/ and requirements-board/
npm run dev                 # prototype (5173) and board (5180) together
npm run dev:board           # the board alone: http://localhost:5180
npm run check               # validate the catalogue
npm run export:csv          # requirements.csv + open-questions.csv in exports/, for Miro or a spreadsheet
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
| Verify | Its open question is answered, but the item as a whole still needs checking with AA before it is Confirmed. |
| Retired | No longer wanted. Kept for traceability. |

**Component.** Scheduling Engine · Billing/Invoice Engine · Anaesthetist App (mobile + web) ·
Admin App · Xero Integration · Health Integration · Master Data · Cross-cutting.

**Source.** Where the requirement came from, as an ordered list, oldest first: the RFP page(s)
(`RFP p.24 · Billing Engine › The three components`), then later notes, Q&A, diagrams or data files.
An item with no known source has an empty list and a `missing-source` outstanding item. See
`notes/README.md`.

## Updating

1. Change or add items in the board, or edit / add files in `stories/` and `questions/` (see `SCHEMA.md`).
2. Run `npm run check` if you edited files by hand. The board checks on every save.
3. If the change alters the model (an entity, a rule, a superseded RFP reading), update
   `domain-model.md` too, including the "What changed since the RFP" table.
4. When an open question is answered, set its status to `Answered`, add `## Answer`, and move each
   affected item off `Open`: to `Confirmed` if the answer settles it, or to `Verify` if the item still
   needs checking with AA. When you answer, the board offers Verify or Confirmed for every item the
   question affects, whatever its status.

## Miro

Run `npm run export:csv`, then Miro's Import → CSV. Suggested mapping: Title → card title,
Description → card description, Type / Status / Component → tags, ID → title prefix or a custom
field. The Parent column gives the connector relationships.
