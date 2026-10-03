# Requirements catch-up

The prototype was built in July 2026 against the original RFP (phases 00 to 13 in `../phases/`).
Since then the requirements catalogue (`docs/discovery-reference/Updated Requirements/catalogue/`)
has moved a long way. This folder holds the gap analysis between the two and the build plan to close
it: catch-up phases numbered from 14.

Catalogue snapshot: `3d3a18c` (2026-10-03).

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

Two project skills (in `.claude/skills/`) run the whole loop:

1. **`/update-requirements`** after a meeting or a round of board answers: files transcripts and notes as
   a catalogue note, completes answers that point at the evidence, updates the requirements, and writes a
   change log in `docs/discovery-reference/Updated Requirements/changes/`. Then commit and push.
2. **`/update-build-plan <commit or link>`** then re-grades the changed items against the prototype,
   re-plans the affected phases, updates their docs and prompts, moves the drift-check baseline and
   regenerates `index.html`.

Every phase also starts with its own drift check against the plan's baseline commit, so small changes are
caught at build time.

The tools the second skill drives, all run from the repo root:

| Tool | What it does |
|---|---|
| `tools/plan-state.mjs [--to <ref>] [--coverage]` | Baseline, what changed since, built phases, coverage check. |
| `tools/build-args.mjs [ID ...]` | The `epics` args for the gap-analysis workflow (all in-scope items, or just those IDs). |
| `tools/workflow-gap-analysis.js` | Sonnet reviewers + adversarial verifiers; `reuseMaps`, `runDelta`, `runReverse`, `runThemes` switches for partial re-runs. |
| `tools/assemble-gaps.mjs <journal> <commit> <date> [--merge]` | Builds `gaps.json`, `GAP-ANALYSIS.md`, `epics/`, `tools/units.json` from a run; `--merge` keeps earlier gradings for items not re-run. |
| `tools/workflow-dev-plan.js` | Opus planners for a plan from scratch. |
| `tools/workflow-plan-update.js` | Opus planners for an update: outline, coverage, critic, affected phase docs and prompts. |
| `tools/apply-plan-update.mjs <journal> <commit> [--built ..]` | Rebuilds `plan.json` exactly from an update run, moves the baseline, regenerates `index.html`. |
| `tools/build-index.mjs` | Renders `index.html` from `plan.json`, `gaps.json` and the prompt files. |
| `tools/recipe-status.mjs [<phase> ...] [--check]` | The capture recipes behind each phase's catalogue screenshots; `--check` confirms every unbuilt phase doc and prompt carries the Catalogue screenshots step (ROADMAP.md). |

## Update history

- 2026-10-01 · `1f067a8..501b0b8` (AA meeting with Greg, D1 to D8 and D10 answered): 142 items re-graded; all 31 phases kept, 28 updated (14, 37, 43 baseline only); 6 phases added (15a warnings, 38a find past work, 39a payment runs, 39b pre/post-op events, 40a NHI lookup, 43a ease of use); US-08.6.4 unparked into 39. 37 phases, about 63 sessions (was 52).
- 2026-10-03 · `501b0b8..3d3a18c` (three AA meetings with Greg on 2026-10-02, OQ-62 to OQ-75 answered): 164 items re-graded (Contradicts 55 to 62, Partial 102 to 105, Missing 33 to 41, Matches 72 to 61); all 35 existing unbuilt phases updated (15a session 2 only, its session 1 being built); 4 phases added (15b Copy and photo capture out, 19a default RVG Contracts hold the base units, 32a anaesthetist moves a single Booking, 38b events on a Procedure and the additional invoice). 41 phases, about 69 sessions (was 63).
