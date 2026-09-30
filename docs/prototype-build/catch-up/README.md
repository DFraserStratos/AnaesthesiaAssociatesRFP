# Requirements catch-up

The prototype was built in July 2026 against the original RFP (phases 00 to 13 in `../phases/`).
Since then the requirements catalogue (`docs/discovery-reference/Updated Requirements/catalogue/`)
has moved a long way. This folder holds the gap analysis between the two and the build plan to close
it: catch-up phases numbered from 14.

Catalogue snapshot: `1f067a8` (2026-09-30).

## Start here

- **[index.html](index.html)** is the build plan page: themes, the gap at a glance, every phase with
  its kick-off prompt (copy, paste into a fresh Claude Code session).
- **[ROADMAP.md](ROADMAP.md)** is the phase list, dependencies and milestones.
- **[phases/](phases/)** has one detailed plan per phase (`phase-NN-<slug>.md`) and its kick-off prompt
  (`phase-NN-<slug>.prompt.md`).
- **[GAP-ANALYSIS.md](GAP-ANALYSIS.md)** is the verified gap analysis: summary, counts, everything Missing,
  structural (data model) changes, prototype behaviour to remove, and per-epic gap tables.
  **[epics/](epics/)** has the full detail for every gap, one file per epic.

## Files

| Path | What it is |
|---|---|
| `gaps.json` | Machine-readable gap data: every in-scope item's verdict, what is missing or wrong, evidence, demo trigger, size; plus `dataModelDeltas` (DM-nn), `reverseFindings` (RV-nn), `themes`. |
| `analysis/prototype-map-*.md` | An index of the prototype's code by area (screens, store actions, domain types, seed, harness bar). Useful to any build session. |
| `analysis/domain-model-delta.md` | DM-nn: structural differences between the catalogue's model and the prototype's. |
| `analysis/reverse-check.md` | RV-nn: retired or superseded behaviour the prototype still has, and old Decisions-log rulings the catalogue now overrides. |
| `plan.json` | The phase outline as data (feeds `index.html`). |
| `tools/` | The scripts and workflows that produced all of the above. |

## How it was made

1. **Gap analysis** (`tools/workflow-gap-analysis.js`, Sonnet): six agents mapped the prototype code; one
   compared the data model; one reviewer per epic graded every in-scope item (272; Retired and Future
   excluded) against the maps and the code; a separate adversarial verifier re-checked each epic's
   gradings from scratch (34 corrected); a reverse check looked for retired or superseded behaviour;
   a themes agent wrote the summary. `tools/assemble-gaps.mjs` then built `gaps.json`,
   `GAP-ANALYSIS.md` and `epics/` directly from the agents' results.
2. **Development plan** (`tools/workflow-dev-plan.js`, Opus): an architect outlined the phases, a script
   checked that every gap, DM and RV item lands in exactly one phase (or is parked with a reason), a
   critic challenged the outline, then one writer and one reviewer per phase produced the phase docs and
   prompts, and `tools/build-index.mjs` renders `index.html` from `plan.json`.

## When the catalogue changes

Every phase starts with a drift check (`git diff 1f067a8 -- "docs/discovery-reference/Updated Requirements/catalogue"`
for its items) and adapts. When the changes are big enough to re-grade:

1. List the changed items: `git diff --name-only 1f067a8 -- "docs/discovery-reference/Updated Requirements/catalogue/requirements"`.
2. Build the workflow args for just those: `node docs/prototype-build/catch-up/tools/build-args.mjs US-01.1.1 US-02.3.1 ...`
   (no IDs means everything).
3. Ask Claude Code to run `tools/workflow-gap-analysis.js` as a workflow with those epics, the repo root and
   the new commit as args.
4. Merge the results: `node docs/prototype-build/catch-up/tools/assemble-gaps.mjs <journal.jsonl> <commit> <date> --merge`
   (items the re-run did not cover keep their earlier grading).
5. Update the affected phase docs, or re-run the plan workflow for the phases not yet built.
