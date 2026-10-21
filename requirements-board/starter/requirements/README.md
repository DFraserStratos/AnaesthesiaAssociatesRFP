# Requirements

The requirements catalogue for this project: everything the Requirements Board (`../`) reads and
writes, and nothing else. The board, its scripts and its agent skills are generic; this folder is
the project's data.

## This project

Rewrite this section: what system these requirements describe, for whom, who signs them off, and
where the catalogue started (an RFP, a workshop, a set of notes).

## Files

| File | What it is | Edit it? |
| --- | --- | --- |
| `stories/`, `questions/` | The catalogue: one Markdown file per epic, feature, story (`stories/`) and outstanding item (`questions/`: open questions and missing sources). Format in `SCHEMA.md`. | Yes, this is the editing surface: in the board or directly in the files. |
| `domain-model.md` | The narrative model: entities, rules, glossary. | Yes. |
| `notes/` | Meeting notes and Q&A behind the catalogue, one dated file each. Conventions in `notes/README.md`. | Add new files; existing ones are append only. |
| `artifacts/` | One sidecar per diagram, transcript, note or document (`AR-nn.md`: name, kind, highlighted regions). Requirements link to them, or to a region in one. Format in `SCHEMA.md`. | As files (agents, the `add-artifact` skill); the board edits only their details. |
| `artifacts/files/` | The artifact files themselves. | Add new files with the artifact; transcripts and documents are never rewritten. |
| `changes/` | One change log per requirements update; `/update-build-plan` reads them. | Add new files. |
| `VOICE.md` | How requirements are written: the words, not the format. The skills follow it. | Yes: on the board's Settings page, or as a file. |
| `board.config.json` | Board and project name, components, statuses. | On the board's Settings page, or by hand. |
| `board-layout.json` | The board's swimlanes and any card positions set by hand. | Through the board. |
| `exports/` | `npm --prefix requirements-board run export:csv` output. Not committed. | No. |

## Conventions

**IDs.** `EP-nn` epic, `FT-nn.m` feature under epic nn, `US-nn.m.k` story under feature nn.m
(`US-nn.0.k` for a story directly under an epic), `OQ-nn` outstanding item, `AR-nn` artifact. IDs
are stable; retire an item by setting it to the Retired status rather than deleting it.

**Status.** Files store a status code, a whole number (`status: 2`); labels, help, colour, role and
order live in `board.config.json` (`statuses`, edited on the Settings page). **A number means only
what that config says**: never infer a status from its number. Scope is carried by the swimlanes,
not by a status.

**Source.** Where a requirement came from, as an ordered list, oldest first: document pages, then
later notes, Q&A, diagrams or data files. An item with no known source has an empty list and a
`missing-source` outstanding item. See `notes/README.md`.

## Updating

1. Change or add items on the board, or edit and add files in `stories/` and `questions/` (see `SCHEMA.md`).
2. Run `npm --prefix requirements-board run check` if you edited files by hand. The board checks on every save.
3. If the change alters the model, update `domain-model.md` too.
4. When a question is answered, set it to the Answered status and add `## Answer`; the board then
   offers the settle statuses for every item it affects.
