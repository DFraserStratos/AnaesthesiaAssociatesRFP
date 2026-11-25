# Build plan

The build plan that keeps the Anaesthesia Associates (AA) prototype in step with the requirements
catalogue. The requirements catch-up (phases 14 to 44 and U1 to U7, archived in
`docs/archive/prototype-build/`) left the prototype matching the catalogue at `64b3dff`, so this plan
was seeded empty there, with no gap analysis. Each requirements change, once committed, is brought in
with the `update-build-plan` skill, which grades only the changed items and adds phases for them,
numbered from 45. Each phase runs in a fresh session from its kick-off prompt, with the
`run-build-phase` skill. Routine fixes and polish are not phases: they use the `app-change` skill.

Catalogue snapshot: `5f87781` (the Contracts section, 25 November 2026).

Start at [index.html](index.html) (the plan page) or [ROADMAP.md](ROADMAP.md).

| File | What it is |
|---|---|
| `plan.config.json` | The plan's settings: rules for the planners, the phase runner's checks, dev servers and capture |
| `ROADMAP.md` | Owner decisions, phases, sequencing rules and the standing rules every phase follows |
| `PROGRESS.md` | Written by phases only: status rows, binding conventions, phase entries |
| `phases/` | One plan doc and one kick-off prompt per phase (none yet) |
| `plan.json`, `status.json`, `index.html` | The plan as data, the owner's run guidance, and the generated plan page |
| `gaps.json`, `units.json`, `GAP-ANALYSIS.md`, `analysis/` | The gap analysis of the items changed since the seed |

Settled prototype rulings: `docs/DECISIONS.md`. Known open work: `docs/BACKLOG.md`.

## Update history

- 2026-11-24 · seeded empty at `64b3dff` (plan-init.mjs); no gap analysis, no phases.
- 2026-11-25 · `64b3dff..5f87781` (the Contracts section, change log 2026-11-25-donald-contracts-section): 12 items re-graded (1 Contradicts, 7 Partial, 3 Matches, 1 Grouping) and 4 model deltas (DM-01 to DM-04); first code maps made; phases 45 to 49 added (the section and the Contract page, New contract page, grouped catalogue, Parties and Funding tags tabs, Replace from a date); decisions D90 to D96.
