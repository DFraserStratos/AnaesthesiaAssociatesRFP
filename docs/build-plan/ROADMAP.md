# AA Prototype · Build plan roadmap

The requirements catch-up (phases 14 to 44 and the UI unification track U1 to U7, archived in
`docs/archive/prototype-build/`) left the prototype matching the requirements catalogue at commit
`64b3dff7` (24 November 2026). This plan starts empty there. Phases come only from requirement changes
committed after it: `/update-requirements` records a change, the owner commits it, and
`/update-build-plan` grades only the changed items and appends phases here, numbered upward from 45.
Most are expected to be UI and UX improvements. Routine fixes and polish are not phases: they use the
`app-change` skill. Neither phases nor routine changes touch the screenshots or the demo guide: the
owner brings both in step with one sweep (`/sweep`, last run in `docs/SWEEP.md`).

Settled prototype rulings are in `docs/DECISIONS.md`; known open work is in `docs/BACKLOG.md`. The
archived catch-up ROADMAP, PROGRESS and phase docs are history: read them as leads, never as rules.

## Owner decisions

| ID | Decision | Gates | Source |
|---|---|---|---|

## Phases

| Phase | Title | Track | Depends on | Sessions | Delivers |
|---|---|---|---|---|---|

## Open questions

None.

## Sequencing rules

- **Every phase** runs as one ordinary session (two at most) in the main folder on `master`: one
  track, no lanes, no worktrees. A phase starts only when every phase in its `depends_on` is DONE and
  committed, and the owner has tested the phase before it.
- **Run order.** No phases yet.

## Milestones

None yet.

## Parked

None.

## Standing rules

The rules every phase follows. The `run-build-phase` context pack quotes these sections to each phase.

### Running a phase

Every kick-off prompt is short: it names the phase, tells the agent to load the `run-build-phase`
skill (`requirements-board/agent/skills/run-build-phase/`), and adds only what the phase doc does not
already say. Every prompt carries the same Override block: commit when green (stage by path, never
push); skip the screenshot recipes, the demo guide and the capture (the owner's sweep does them). The
skill holds the rest, the same for every phase: a context pack (`phase-context.mjs`); the drift check;
plan and build; quick partial checks while building and the full green set at gates
(`phase-check.mjs`); the design-fidelity check and the manual checklist; the review; a short PROGRESS entry with a Handoffs block; and updating `status.json` and the plan page
so it names the next phase. A prompt line wins over the skill; the phase doc wins over the skill for
what to build.

### Owner review: agents test themselves

- **No plan-approval stop.** After the drift check, the agent writes its step plan and starts building
  straight away. It never enters plan mode itself. When the owner starts a session in plan mode, the
  agent does all its reading and the drift check first and presents the plan once; after approval it
  builds to the end without further stops.
- **The agent is the tester.** It runs the phase's manual test checklist itself, in the running app
  (start root `npm run dev` in the background if 5173 or 5174 is down), driving it with Playwright or
  the `/run` skill and checking screenshots by eye. "Handset" checks use the emulated mobile viewport
  unless a real phone is attached. Each item is reported pass or fail with its evidence.
- **Defaults over questions.** Where a phase doc says "ask the owner" about a product choice, the agent
  builds the stated default, labels it provisional where the doc says so, and logs it on the phase's
  "For the owner's review" list instead of asking.
- **Stop and ask only when it is very needed:** a drift-check stop the phase doc names, a blocker no
  documented default resolves, or an action that is destructive or hard to undo.
- **Then the owner tests.** The phase commits when green and hands over: what changed, where to try
  it and the "For the owner's review" list. The owner tests the phase.

### Front-end design

Before building or reshaping any screen, sheet, dialog, panel, row, banner or state, the agent loads
the `frontend-design` skill (the `run-build-phase` skill holds this step). It works inside the design
system, not over it: the `docs/design` files and `src/theme` tokens stay authoritative (PROGRESS
binding convention 17, CLAUDE.md "Design"), so it shapes layout, hierarchy, spacing, states and finish,
never a new palette, typeface or visual language, and the two hard rules (crimson identity only, teal
the only action colour) hold. Each changed screen is screenshotted beside its mockup at the same
viewport and compared before the phase is called done. A phase that touches UI names, in its doc, the
design page and screen for each screen it changes. Store, seed and pure-domain steps do not need it.

### One component per job

- UI in a phase is built from the shared components: `src/shared/ui/` (controls and feedback),
  `src/shared/surface/` (sheets, dialogs, modal behaviour), `src/shared/table/` (tables) and
  `src/shared/calendar/`. `src/shared/ui/README.md` lists what exists and how to add a variant.
- If a shared component cannot do what a phase needs, the phase extends it with a variant or prop that
  defaults to today's look and matches a pattern in `docs/design/`; it never copies the component into
  a screen file. A new private copy of a shared component is a review finding, and
  `src/apps/oneComponentPerJob.test.ts` enforces it (its allow-list only shrinks).
- A phase that rebuilds a screen also migrates any remaining copies on that screen.
- A shared component keeps its hooks: it takes `shot`, emits `data-shot` on the element recipes
  target, and passes `data-*` attributes through.
- The catalogue rows (`/demo/catalogue/*`) change in the same session as the component.
- A phase that touches UI carries the "Build on the shared components" work item and the review line.

### Demo triggers

The mechanism exists (`src/shared/demoTriggers`). A phase registers new entries or re-points existing
ones; none adds a trigger to the Control Panel page. Each entry declares:

- the route patterns it belongs to;
- the surfaces it shows on: harness bar, PWA sheet, or both;
- a `run(api, ctx)` that acts on the entity in the URL (`listId`, `bookingId`, `invoiceId`,
  `dateISO`) or on screen state published through `useDemoTriggerContext`, not a hardcoded seed id
  wherever possible;
- a disabled state.

The harness bar shows a trigger only on its screen. The Control Panel keeps the scenario jumps, the
clock and reset, and lists every trigger under its screen. Trigger bodies, the context hook and the
shared actor constants live in `src/shared` or `src/store`, so the PWA purity test holds. Product
actions stay in the product UI, not the bar. A trigger added or renamed keeps
`src/shared/demoTriggers/demoGuideSync.test.ts` green.

### PWA parity

The PWA has no harness bar and no Admin app, so a handset demo cannot switch to the office. A phase
whose beat has a mobile side that waits on the office, a colleague or a backend event registers a
PWA-surface entry for the mobile screen concerned (an office stand-in, run as
`OFFICE_SIMULATION_ACTOR`). These stand-ins show on the PWA only: in the framed build the presenter
plays the office in Admin.

### Demo guide and catalogue screenshots

A version of the demo guide (`docs/demo-guide/`, with `master-demo-guide.html`) and the catalogue
screenshots goes to Anaesthesia Associates for testing and approvals. They are brought in step with
the app in one **sweep the owner triggers** (`/sweep`, the project skill `.claude/skills/sweep/`),
which takes everything changed since the last sweep (`docs/SWEEP.md`), updates the recipes, ATLAS and
the guide, runs the full gate and the capture, and commits.

- **Phases do not touch** the capture recipes, `ATLAS.md` or the demo guide, and never run the
  capture, not even `--dry`. A phase doc may note, under "For the sweep", anything new worth a
  screenshot or a guide beat.
- A phase keeps tests that read the guide green: `src/shared/demoTriggers/demoGuideSync.test.ts`
  (a renamed or new demo trigger fixes the guide line the test names, nothing more).
- Recipes and images are never touched while updating the plan.

### Confirm before building

Phases that carry unresolved open questions (OQ) or Verify, Open or Proposed items are listed here.
Each checks them at its drift check, and if they are still open builds the owner-decision default or
the recommended reading and labels it provisional in the UI.

| Phase | Items | Open questions |
|---|---|---|
