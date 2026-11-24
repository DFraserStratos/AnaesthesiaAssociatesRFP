---
name: run-build-phase
description: Build one phase of a build plan made by update-build-plan, start to finish, in a fresh session - orient from a generated context pack and the phase doc, run the drift check, write a step plan and build straight on (in plan mode, one approval at the plan), gate on the plan's checks, prove the screens against the design files, run the manual checklist, the adversarial review, the catalogue screenshots and the demo guide in parallel, write a short progress entry, and update the plan page so it names the next phase. Use when a kick-off prompt says "Load the run-build-phase skill and follow it for Phase <id>", or when asked to build, run or resume a plan phase.
argument-hint: "<phase id> (e.g. 21a, U4); the kick-off prompt adds what is specific to the phase"
---

# Run a build phase

A build plan (the plan folder, `PLAN` below) splits the work of bringing the app up to the
requirements catalogue into phases. Each phase has a plan doc (`PLAN/phases/phase-<id>-<slug>.md`:
goal, drift check, work items, demo triggers, checklist, screenshots, review steer, progress updates)
and a short kick-off prompt that names the phase, loads this skill and adds only what the doc does
not say. The owner pastes the prompt and comes back when the phase is done. This skill is everything
between: the same for every phase.

**The prompt wins.** Where the kick-off prompt says something different from this skill (commits on
a branch, a worktree root, "When done" after each session, a session-1-only run, a stop the doc does
not name), follow the prompt, and write the override as the first line of the plan file and of your
final notes. The phase doc wins over this skill for what to build; the prompt wins over the doc.

## This repo

The only repo-specific facts this skill uses. When the board moves to another repo, rewrite this
block (the board's `ADOPTING.md` says how) and leave the rest alone. Paths are relative to the repo
root (`git rev-parse --show-toplevel`; folder names contain spaces, so quote every path).

- `PLAN` = `docs/build-plan` (start at its `README.md`); its config is `PLAN/plan.config.json`, key
  `runner` (below). `T` = `requirements-board/agent/skills/run-build-phase/tools`;
  `P` = `requirements-board/agent/skills/update-build-plan/tools`. `REQ` = `requirements-board/requirements`.
  Phases are numbered from 45; 00 to 44 and U1 to U7 are built and archived in
  `docs/archive/prototype-build/` (history only: leads, never rules).
- **Rules:** `CLAUDE.md` (you have it). Standing rules: `PLAN/ROADMAP.md` "Running a phase", "Owner
  review: agents test themselves", "Front-end design", "One component per job", "Demo triggers", "PWA
  parity", "Demo guide", "Catalogue screenshots", "Confirm before building" (the pack quotes them).
  Binding conventions in `PLAN/PROGRESS.md` (the pack quotes them): 17 design, 18 review, 19
  screenshots, 20 warning rules, 21 one component per job, 22 demo guide. Settled rulings:
  `docs/DECISIONS.md` (never re-raise one); known open work: `docs/BACKLOG.md`.
- **Commits and capture (every prompt's Override says the same):** commit when the gate is green,
  staging by path (never `git add -A`; another session may be committing in the same tree); merge
  allowed; never push. Never run the capture, not even `--dry`, before the owner has tested the phase
  and approved it: in Stage 5 step 2 the subagent edits recipes and ATLAS only and you skip the
  `--capture` runs of steps 2, 5 and 6; the phase hands over with the recipe IDs to capture (final
  notes and the entry's `**Catalogue screenshots.**` bullet) and stops. On approval: `node
  T/phase-check.mjs --capture <IDs>` (`--capture all` after a shared component, token or seed change),
  open the new images, `npm run verify:board`, commit the capture by path, and fill the REPORT counts
  into the entry. The `shots` check is the app's Playwright suite, not the capture: it stays in the gate.
- **The app:** `aa-prototype/` (React demo over a fake in-browser backend). A phase doc's `src/` paths
  are relative to it; Playwright specs live in `aa-prototype/visual/`. Its `README.md` has the `src/`
  folder map; `src/shared/ui/README.md` lists the shared components and how to add a variant.
  `npm --prefix aa-prototype run affected` lists the capture recipes and S1 to S5 demo beats a change
  reaches.
- **House rules (brief; CLAUDE.md "Working in the app" is the full set):** every write is a store
  action through the audited `mutate()`, with a label for each new action code in
  `src/shared/audit/actionLabels.ts`; time from the demo clock and randomness from the seeded RNG,
  never `Date.now()`, `new Date()` or `Math.random()`; billing rules pure in `src/domain/billing` with
  Vitest tests; bump `PERSIST_VERSION` (`src/store/appStore.ts`) once per seed or store-shape change
  and extend the migrate test; seed additions go after every existing record with pinned patients,
  never `takePatient()`, no new RNG draws, so no id moves and S1 to S5's figures hold; bottom sheets
  on mobile, dialogs or side panels on web and admin; teal the only action colour, crimson identity
  only; tokens only, formatting through `shared/format.ts`; no en or em dashes in app copy; code the
  PWA uses lives in `src/shared` or `src/store` so `pwaPurity.test.ts` stays green; UI from
  `src/shared/{ui,surface,table,calendar}`, extended by a variant that defaults to today's look, never
  copied (`src/apps/oneComponentPerJob.test.ts`), keeping every `shot`, `data-shot`, `data-testid`
  and `data-*` hook, with the `/demo/catalogue/*` rows changed in the same session.
- **Demo triggers:** registered in `src/shared/demoTriggers` on their screen only (harness bar, the
  PWA's Demo sheet, or both), acting on the entity in the URL or context, bodies in `src/store`,
  deterministic, idempotent, with a disabled state; PWA office stand-ins run as
  `OFFICE_SIMULATION_ACTOR`; nothing new on the Control Panel page; `demoGuideSync.test.ts` stays green.
- **Design:** `docs/design/*.dc.html` mockups, opened straight from disk in a browser (they load
  `support.js` beside them); `Design Language.dc.html` holds the tokens. Viewports: desktop 1440x900,
  mobile 390x844 (the framed phone in the prototype, or the PWA on 5174). Contract screens also
  match `contract-picker-mock/` (`npm run dev:picker`, port 5181). The skill is `frontend-design`.
- **Catalogue:** read evidence with `npm --prefix requirements-board run source -- --item <ID> --text`
  (Node 22.18 or newer: check `node --version`, and put a newer Node first on `PATH` if it is older).
  `phase-check` does this itself for its own children (`runner.node`): when the running node is too
  old it uses the first new-enough Node in `runner.node.paths`, else stops at once and names the fix.
  AR-28, AR-29 and AR-30 are Retired: cite none. A phase never edits a requirement's text or status
  or any artifact: it names the change for `/update-requirements` in its progress entry.
- **Screenshots:** recipes `REQ/capture/recipes/<ID>.json`; their format, routes, seed ids and hooks in
  `REQ/capture/ATLAS.md`; results in `REQ/capture/REPORT.md`; `node P/recipe-status.mjs <id>` lists a
  phase's covered items and recipes. Capture only on approval (above).
- **Demo guide:** a version goes to Anaesthesia Associates for testing and approvals, so every phase
  brings it in step for exactly what it changed: `docs/demo-guide/` (`03-demo-script.md` run sheet,
  `04-presenter-cheat-sheet.md`, `02-workflows-and-handoffs.md`, `01-personas-and-responsibilities.md`,
  `README.md`), the matching sections of `docs/demo-guide/master-demo-guide.html` (maintained by hand:
  patch it to match the Markdown; a large page: grep it, never read it whole), and the Control Panel
  scenario text (`aa-prototype/src/apps/demo/DemoControlPanel.tsx`) when a scenario changed. Every
  figure from the running app.
- **State version:** `PERSIST_VERSION` in `aa-prototype/src/store/appStore.ts` (house rules say when it
  moves). Note it at the drift check, log each move, and write it in the entry's `**Built.**` bullet as
  `PERSIST_VERSION <a> to <b>`. The app's demo clock (`src/domain/clock.ts`) is not today's date.
- **Source rule:** where a design mockup simplified a business rule, the rule as the catalogue now
  states it wins (CLAUDE.md "Design", rule 2); `docs/DECISIONS.md` records the settled readings.
- **Progress file:** `docs/build-plan/PROGRESS.md`, written by phases only. Status rows
  `| <id> | <title> | DONE | <YYYY-MM-DD> | <summary> |` (or `IN PROGRESS`); entries
  `### Phase <id> · <title> (<YYYY-MM-DD>)`; Decisions-log entries (`## Decisions log`)
  `- **<date> · Phase <id> (<n>): <title>** (<ids>; supersedes ...). <body>`, each lasting one also
  added to `docs/DECISIONS.md`; the handoff list is `## Discovered for later`, and work a phase finds
  and leaves undone goes to `docs/BACKLOG.md`. Tools parse all of these: keep them exact.
- **Plan page:** `PLAN/status.json` (`in_progress`, `next`, `guidance`) rendered into
  `PLAN/index.html` by `node P/build-index.mjs`. Run order: `PLAN/ROADMAP.md` "Sequencing rules", the
  "**Run order.**" bullet. In `headline_sub` say the phase is committed and waiting for the owner's
  test and capture approval (not "not yet committed").
- **Tracks:** one, the plan's numbered phases. No lanes, no worktrees ("Phases in a worktree" does not
  apply).

## Ground rules

- **One approval point at most.** Both starts are normal:
  - *Normal mode:* write the plan to `<logDir>/<id>-plan.md` and build to the end without stopping.
    Never call EnterPlanMode yourself.
  - *Plan mode* (the owner often starts the next phase this way while the previous one's tests or
    capture are still running): do everything that can be done read-only first, so the build never
    starts half-oriented: Stage 0, Stage 1 with `node T/phase-context.mjs <id> --stdout` (it writes
    nothing; or read an existing pack), Stage 2 in full, and the plan of Stage 3 step 1. Then call
    ExitPlanMode once with that plan, concise and self-contained so the owner can approve at a
    glance: the phase and session, any prompt override, the drift result and any stop or
    `NEEDS OWNER` in a few lines, the ordered steps, the screens and their design references. That is
    the single approval point. Once approved, write the plan file and build to the end without
    further stops.
- **Never commit or push** unless the prompt allows it, and then only as it says.
- **The agent is the tester.** You run every check and the checklist yourself; nothing is handed to
  the owner per phase. "Ask the owner" in a doc becomes a built default, logged for the owner's review.
- **Stop only** on a stop the doc or prompt names, a dependency not DONE that the doc gives no way
  round, a blocker no documented default resolves, or a destructive or hard-to-undo action.
  Everything else: decide, record in the log, carry on.
- **Wait, never poll.** Run anything over a minute (`phase-check`, capture, a full Vitest) with
  `run_in_background` and act on the notification. No `sleep`, no loops reading a log file. Only one
  `phase-check` runs at a time (it holds a lock); a second one exits at once.
- **Keep the main context small.** Read the pack and the phase doc; grep the big files (the progress
  file, ROADMAP, ATLAS, the gap analysis, any large page "This repo" names) by heading and read the lines you
  need, never whole. Ask an Explore subagent code-map questions ("where is X written, who reads it")
  instead of reading folders. Hand self-contained writing (recipes and ATLAS, the demo guide, the
  progress entry draft) to subagents with a precise brief.
- **Edit with the Edit tool.** Exact edits, not Python or sed rewrites of source files.
- **Working files** go in the runner's `logDir` (`.build-phase/`, git-ignored): the pack `<id>.md`,
  the plan `<id>-plan.md`, a running log `<id>-log.md`, design pairs `<id>-design/`, checklist
  evidence `<id>-checklist/`, throwaway scripts. Never in the app or the plan folder.

## The tools

Run from the repo root as `node T/<tool>` or `node P/<tool>`. Each finds the plan by itself (the
repo's only `plan.config.json`); pass `--plan PLAN` when there are several.

| Tool | What it does |
|---|---|
| `T/phase-context.mjs <id> [--stdout]` | Writes the context pack `<logDir>/<id>.md` (about 60 KB; `--stdout` prints it and writes nothing, for plan mode): the phase's plan entry, built status and dependencies; the drift check already run since the doc's baseline; the owner decisions that gate it; its catalogue items' current text and questions; the progress file's conventions, dependency status rows, their entries trimmed to handoffs, and the Decisions-log entries the doc names; ROADMAP's standing rules and the sequencing rules naming the phase; pointers (anchors, maps, design files, artifacts, recipes) |
| `T/phase-check.mjs` | Every check in `runner.checks`, side by side where safe, one line each, failures' tails, one summary line. `--changed` the quick partial loop; `--only a,b`; `--failed` re-runs every check whose record says failed or skipped (only a full-form pass clears one; a `--changed` pass never does); `--list` the schedule; `--capture <IDs>` dev servers up, dry run of those recipes, then capture; `--capture all` one full capture with no dry pass |
| `P/plan-state.mjs --diff <IDs> [--from <sha>]` | Rename-aware catalogue diff since the plan's baseline, or since `--from` (the pack prints the command with its own baseline); never a plain `git diff` of the catalogue |
| `P/recipe-status.mjs <id>` | The phase's covered items with their recipes and shots |
| `P/build-index.mjs` | Renders `PLAN/index.html` from `plan.json`, `status.json`, the progress file and the prompts |
| `P/config.mjs --json` | The resolved plan config (paths, rules); the tools read `runner` from the file directly |

**The `runner` key** of `plan.config.json` (full shape in `phase-check.mjs --help`): `skill` (this
skill's name: kick-off prompts load it, and update-build-plan writes slim prompts when it is set); `maxParallel`;
`logDir`; `concurrency` (why the schedule is safe); `checks` (each `name`, `aliases`, `cwd`, `cmd`,
`needs` (runs only if those passed), `after` (ordering only), `changed` (its `--changed` form),
`focus`, `timeout`, `equivalent`: the project command it stands for); `devServers` (name, port, url,
cmd) and `devCommand`; `startTimeout`; `capture` (`cwd`, `cmd`, `onlyFlag`, `dryFlag`, `report`);
`context` (the pack's budget, the progress sections and ROADMAP sections it quotes, the sequencing
section and always-on rules, the design folder, `countNouns` and `notPhaseBefore` (the plan's own words
that make a number not a phase), `decisionsSection` and `handoffSection` (the progress file's decisions
log and handoff list headings)). Here the checks are typecheck, build, build-pwa,
vitest, verify-board and shots: together they are the project's green commands.

## Stage 0: which phase, which session

1. The phase id is in the prompt's first line. Note its track ("This repo" names them) and any
   override block.
2. `date +%F` is today for the progress file (any clock the app keeps for demos is something else).
3. The pack (Stage 1) says whether the phase is not built, IN PROGRESS (an earlier session stopped
   at or past the checkpoint: resume) or DONE (stop and say so). Two-session phases normally run
   in one session (see "Two-session phases").

## Stage 1: orient (about 5 minutes)

1. Run `node T/phase-context.mjs <id>` (in plan mode add `--stdout`) and read the pack whole.
2. Read the phase doc whole (it is your plan; 30 to 100 KB, read it by section if larger).
3. Read the prompt's "Also read" items, by section.
4. Nothing else whole. For anything more, follow the pack's pointers to a line range, grep, or ask
   an Explore subagent.
5. Resuming (IN PROGRESS): read your own progress entry (in the pack) and `<logDir>/<id>-log.md` and
   `<id>-plan.md` if they survive; resume where the log's last checkpoint line says, which may be
   past the checkpoint the entry names. Do not redo built work.

## Stage 2: drift check

The pack has already run the catalogue diff since the doc's baseline. Its baseline beats any hash or
version number a doc or prompt quotes as narrative.

1. **Changed in substance:** re-read each item the pack lists and adjust the plan to its current text.
   For a diff the pack trimmed, run the command it prints (`node P/plan-state.mjs --diff <ID> --from
   <the pack's baseline>`): it diffs from the same baseline as the pack.
2. **Now Retired or out of scope:** drop that work; record it for the progress entry.
3. **A change that would undo built work** (an earlier phase's, or session 1's): do not build it.
   Record `NEEDS OWNER: <item>: <what changed>, <what stays built>` and carry on with the rest.
4. **Questions and decisions:** answered ones are built as answered, with no provisional label; open
   ones get the doc's default, labelled provisional where the doc says, pinned by a test where it is
   a rule, and logged for the owner's review.
5. **Dependencies:** each phase in the pack's "Depends on" must be DONE (owner-added phases
   included). If one is not and the doc gives no way round it, stop: say which, and update the plan
   page (Stage 7) with a wait note. Write down the names each built dependency actually shipped
   (functions, selectors, fields, triggers, hooks) from its handoff; plan on those, not the doc's
   guesses.
6. Note the app's state version, if "This repo" names one, and, on a UI-only track, the Vitest and
   Playwright counts.
7. The doc's and prompt's own stops and checks (`rg` counts, baseline shots, grep gates) run here too.

## Stage 3: plan, then build

1. Write `<logDir>/<id>-plan.md`: any prompt override first; the drift result in five lines; then
   the work items as ordered, work-sized steps (domain and store first, UI after), each naming its
   files and tests; the checkpoint (the doc's session boundary) if the phase has two; the screens that change and the
   design reference for each (for Stage 4). In normal mode, do not wait for anyone: start step 1. In
   plan mode, this plan is what ExitPlanMode presents (Ground rules); write the file once approved.
2. Keep `<logDir>/<id>-log.md` as you go, one line per entry: each default or reading built, each
   deviation from the doc with why, each name you ship that a later phase will use, tests added,
   state-version moves, anything for `/update-requirements`. It is the brief for the progress
   entry and what a resumed session starts from: after each work item, a line
   `Checkpoint: items 1 to n built, <inner loop result>`.
3. Build. Follow the house rules ("This repo") and the doc's work items. Before building or
   reshaping any UI (screens, sheets, dialogs, panels, rows, banners, pills, empty and error states)
   load the `frontend-design` skill and apply it inside the design system: the design files and
   theme tokens stay authoritative, so use it for layout, hierarchy, spacing, states and finish,
   never a new palette, typeface or visual language. Store, seed and pure-domain steps do not need it.
4. **Inner loop:** `node T/phase-check.mjs --changed` (partial: typecheck, Vitest related to your
   changes, the catalogue check), or one Vitest file (`npx vitest run <file>` in the app). Never the
   full suite or a build after each edit.
5. **Full gate** (`node T/phase-check.mjs`, in the background) only at: a two-session phase's
   checkpoint, the end of the build, after the review fixes, and the final close. On failure fix and
   run `--failed` (it re-runs every check whose last full run failed or was skipped, however many
   `--changed` loops ran since).

## Stage 4: prove it (UI phases: all three; others: 1 and 3)

1. **Green.** The full gate passes (`phase-check` with no `--changed`): both builds, Vitest, the board
   check and the screenshot suite.
2. **Design fidelity, before calling anything done.** For each screen the phase changed, screenshot
   the running app at the design's viewport and the matching mockup at the same size (a throwaway
   Playwright script in `logDir`, importing Playwright from the app's `node_modules`, or the `run`
   skill), save the pair in `<logDir>/<id>-design/`, and look at both images side by side. Compare
   layout, hierarchy, spacing, type, states and the components used; where the phase doc names
   another reference (a mock app, an earlier screen) compare against that too. Fix what differs,
   unless the source rule ("This repo") or a Decisions-log ruling made the difference on purpose (say which). A screen
   no mockup draws is compared with the nearest one in the same app for the same patterns. Record
   the pairs compared and what you fixed. You may hand the shooting to a subagent; the comparison
   and the call are yours.
3. **Manual checklist.** Run every item of the doc's "Manual test checklist" yourself in the running
   app (start `runner.devCommand` in the background if a dev server is down): Playwright or the `run`
   skill, screenshots checked by eye, "handset" items in the mobile viewport. Record each item pass
   or fail with its evidence (a screenshot path, a value read) in `<logDir>/<id>-checklist/`. A
   subagent may run the clicks from the checklist text; you read its evidence. Fix fails and re-run
   them.

## Stage 5: close out, in parallel

Start these together as soon as Stage 4 is green, each in the background:

1. **Review** (the plan's review convention; "This repo" names it). About three Opus subagents (`model: opus`), one per lens:
   quality (conventions, design tokens, one component per job, no gold-plating), bugs and correctness
   (guards, lifecycle, determinism, purity, audit, maths), plan adherence (every work item, checklist
   item and covered item delivered; scope fences; Decisions-log rulings honoured). Add the lenses the
   doc's "Steer this phase's reviewers at:" and the prompt name (for example money integrity). Give
   each the phase doc path, the pack path, `git diff` as the scope, its lens and the steer bullets,
   and tell it: read-only, no builds, servers or `phase-check`; a new private copy of a shared
   component is a finding; return ranked findings with `file:line` and a concrete failure scenario.
2. **Recipes and ATLAS** (one subagent). Brief: the doc's "Catalogue screenshots" table and "Recipes
   this phase breaks" list, `node P/recipe-status.mjs <id>`, ATLAS's recipe format, the routes, seed
   ids and hooks you shipped (from the log), and the ROADMAP "Catalogue screenshots" rules (status
   `captured`, `partial` with a reason naming the later phase, or `absent`; captions in current words,
   no en or em dashes; keep shot names; stage triggers with the `trigger` step). It edits recipes and
   ATLAS only, then runs nothing. Then you run `node T/phase-check.mjs --capture <those IDs>` (a dry
   run of just those recipes, then their capture), fix what fails, re-run only the failed IDs, and
   open the covered items' new images to check each shows the feature with its highlight and a true
   caption. Never a full dry run.
3. **Demo guide** (one subagent). Brief: the doc's "Demo guide updates" beats, the files in "This
   repo", the changed behaviour from the log, and that every figure comes from the running app (it
   may read it with Playwright). It patches each demo guide file "This repo" names, as it
   says. A milestone phase adds the consistency read. Read its diff when it returns.

Then:

4. **Verify each review finding yourself** against the code and the catalogue before touching
   anything: never fix on a paraphrase, never re-raise a settled Decisions-log ruling. Fix the
   confirmed ones, with a test where a bug had none. Record the rest with why.
5. **Re-gate:** the full `phase-check`. Re-capture only the IDs whose screens the fixes changed.
6. **Final capture:** `node T/phase-check.mjs --capture all` in the background (it prints the
   report's counts before and after). Meanwhile write the progress entry (Stage 6). If a recipe
   fails, fix it and run `--capture <failed IDs>`: that run rewrites those IDs' rows of the report and
   its totals, so the report you leave lists no failure you fixed (check its "Failed recipes" section);
   then `node T/phase-check.mjs --only verify-board`.
7. Stop the dev servers `phase-check` started: `node T/phase-check.mjs --stop-servers` (it stops only
   the ones in `<logDir>/dev-servers.pid` and leaves any it did not start running).

## Stage 6: the progress entry

Short: aim for 40 lines or fewer. A subagent may draft it from `<id>-log.md`, the plan file and the
gate, review and capture results; you check every name and number in it.

1. **Status row** in the status table, in run order after the last row: `DONE` and today, or
   `IN PROGRESS` at a checkpoint; the summary one sentence of what was built.
2. **The entry**, after the last phase entry, headed exactly as "This repo" gives it (a session that resumes on a later day adds its date to the range). Bold-label paragraphs, so the tools can
   find them:
   - `**Drift check against <baseline>.**` what changed, what was dropped, built as answered or default.
   - `**Built.**` three to eight bullets: model, the one place each rule lives, writers, UI, triggers,
     seed (the state version a to b, where "This repo" names one).
   - `**Tests.**` new and re-expressed test files; Vitest and Playwright counts; the gate result.
   - `**Checked.**` checklist n of n pass (evidence folder); design pairs compared and what was fixed.
   - `**Review.**` lenses; findings confirmed and fixed; those declined, with why.
   - `**Catalogue screenshots.**` recipes created and updated; REPORT counts before and after.
   - `**Demo guide.**` files and beats patched.
   - `**Handoffs.**` one bullet per later phase that builds on this: the exact names it will use
     (functions, types, store actions, hooks, seed ids, trigger ids). Later phases' packs read this
     part first, so make it complete.
   - `**Deviations.**` where the build differs from the doc, and why (omit if none).
   - `**For /update-requirements.**` catalogue changes the phase found (omit if none).
   - `**For the owner's review.**` defaults built for open questions, provisional readings, anything
     logged rather than fixed, any `NEEDS OWNER`, the screens worth a look.
3. **Decisions log** (the progress file's decisions section; "This repo" names it): the entries the
   doc's "PROGRESS.md updates" names, one short paragraph each in
   the format in "This repo", pointing to the phase entry for detail.
4. The handoff-list items the doc names, if any.

## Stage 7: the plan page, then the final notes

The owner refreshes the plan page and runs what it says, so it must name the next phase.

1. In `PLAN/status.json` (keep the existing entries' style and length):
   - `in_progress`: this id when stopping at a checkpoint; remove it when DONE.
   - `next`: `phases` (what to run next) and a one-paragraph `note`.
   - `guidance.as_of`: today. `headline`: "Start <next> now. <what this phase built, in a clause>."
     `headline_sub`: what this phase built in one sentence, that it is done and not yet committed,
     and what follows in run order.
   - `safe`: the owner has delegated this call to you. Mark a phase safe only if every phase in its
     plan entry's `depends_on` is DONE (counting this one), it is next in ROADMAP's run order, and no
     sequencing rule bars it; each reason says why and that this phase must be committed first.
     After stopping at a checkpoint the only safe phase is this one, to resume.
   - `wait`: drop entries for phases now DONE or now safe; update reasons that named this phase.
   - `parallel`: which safe phases may run side by side (only where the sequencing rules allow).
2. Run `node P/build-index.mjs`: it must print no index warnings.
3. **Final notes to the owner,** short: any prompt override and any `NEEDS OWNER` first; what was
   built; checks (the gate, the checklist count, design pairs, the review, capture counts); files
   for `/update-requirements`; what you decided on the plan page and why; that nothing is committed.
   End with the "For the owner's review" list, then `Next: <phase> (page updated)`.

## Two-session phases

A doc's "2 sessions" is a size, not a stop. The boundary it names (or the prompt names) is a
**checkpoint**: a green, demoable point to fall back to. One session normally builds the whole phase,
straight through the checkpoint.

- **At the checkpoint:** run the full gate (Stage 3 step 5) and fix it green. Write the status row
  `IN PROGRESS` and the entry with a short `**Session 1 (<date>).**` paragraph: what is built, what
  the rest starts with, and the handoffs so far. If the session ends unexpectedly after this point,
  the next one can resume. Log `Checkpoint: session 1's items built, gate green`. Then **carry
  on** with the remaining items in the same session. No plan page update and no checklist run yet:
  Stage 4 covers the whole phase at the end.
- **Stop at the checkpoint instead** only when one of these is true:
  - the prompt says so (a session-1-only run);
  - this session's context has already been compacted;
  - the context or a usage limit is warning that it is near its end.

  To stop, update the plan page as Stage 7 says (this phase, to resume, is the only safe one) and
  give the final notes: what is built, that the gate is green, and that the same prompt resumes it.
  Review, capture and the demo guide wait for the resumed session unless the prompt says "When done
  at the end of each session".
- **Finishing:** whichever session builds the last item runs Stages 4 to 7 for the whole phase and
  completes the entry: one entry, not two. If the whole phase was built in one session, the full
  entry replaces the `**Session 1**` paragraph.
- If the rest runs long after the checkpoint, stop at the doc's fallback point, never mid-step, as
  if stopping at the checkpoint: green, entry updated, plan page updated.

## Phases in a worktree

When the prompt puts the phase in its own git worktree ("This repo" names which): every path is from the
worktree's root; follow the prompt's branch, commit, port-lock, sync and merge rules exactly; take
the port lock before any `phase-check --capture`, dev server or screenshot suite run. Only the session
that finishes the merge updates the plan page, on the merge branch, for both phases; the first to
finish says in its notes that the other will.
