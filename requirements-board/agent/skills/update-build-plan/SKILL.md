---
name: update-build-plan
description: Update (or make) the build plan that takes the app to the requirements catalogue, from requirements changes committed to the repo. It re-grades the changed requirements against the app, re-plans and triages the affected phases, updates their phase docs and kick-off prompts from per-phase briefs, moves the drift-check baseline, and regenerates the HTML plan; with no plan yet, it grades the whole catalogue and writes a fresh plan. Use after a requirements update has been committed, or to start a build plan. Pass the commit, a GitHub commit link, or nothing for HEAD.
argument-hint: "<commit sha or GitHub commit link> (default: HEAD)"
---

# Update the build plan from requirements changes

The build plan (the plan folder, `PLAN` below) is a verified gap analysis between the app and the
requirements catalogue, plus numbered phases, each with a plan doc and a kick-off prompt that a fresh
agent session runs. It records the catalogue commit it matches in `PLAN/plan.json` `"commit"`. This
skill brings it up to a newer commit, or makes the plan when there is none yet.

Outputs, all in `PLAN/`:
- `gaps.json`, `GAP-ANALYSIS.md`, `epics/<EP>.md`, `units.json` and `analysis/` (code maps, data-model
  delta, reverse check): the gap analysis;
- `ROADMAP.md` (owner decisions, phase table, sequencing rules, milestones, parked list, standing
  rules), `phases/phase-NN-<slug>.md` and `.prompt.md`: the plan;
- `plan.json` and `index.html` (generated): the plan as data and as a page;
- an "Update history" line in `PLAN/README.md`.

## This repo

The only repo-specific facts this skill uses. When the board moves to another repo, rewrite this
block (the board's `ADOPTING.md` says how) and leave the rest alone.

- `BOARD` = `requirements-board`; `REQ` = `requirements-board/requirements`; `T` =
  `requirements-board/agent/skills/update-build-plan/tools` (the tools below). Paths are relative to
  the repo root.
- `PLAN` = `docs/prototype-build/catch-up`: the prototype's "requirements catch-up" (start at its
  `README.md`). Its config is `PLAN/plan.config.json`, the repo's only one, so the tools find it without
  `--plan`. Phases are numbered from 14; 00 to 13 are the original build (`docs/prototype-build/`).
- The app: the prototype in `aa-prototype/`. Progress file: `docs/prototype-build/PROGRESS.md` (status
  table rows and `### Catch-up Phase NN` entries say which phases are built or in progress).
- Node: agent shells default to Node 22.16, too old for the board's `source` command (22.18 or newer).
  Prefix commands with `PATH="$HOME/.nvm/versions/node/v24.20.0/bin:$PATH"`.
- Standing rules live in `PLAN/ROADMAP.md`: "Owner review: agents test themselves", "Catalogue
  screenshots" (PROGRESS convention 19) and "Front-end design" (every unbuilt phase that touches UI
  has the frontend-design bullet in its prompt's "While working:" list).
- Screenshot capture: on. The runner is `requirements-board/scripts/capture.ts`; recipes are
  `REQ/capture/recipes/<ID>.json` (format, routes, seed ids and hooks in `REQ/capture/ATLAS.md`);
  `npm run capture` in `requirements-board/` drives the prototype (5173) and the PWA (5174) and writes
  `REQ/assets/<ID>/<app>-<name>[-<state>].png` and `REQ/capture/REPORT.md`. Phase 14's baseline sweep
  gives every live story a recipe, and Phase 44's final sweep leaves no "partial" reason naming a later
  phase. Shots hide the harness bar, so recipes stage demo triggers with the runner's `trigger` step
  (Phase 14 adds it); anything every fresh browser context would show, such as a first-run welcome
  card, needs the runner to preset it (Phase 43a).
- After an update, also change the baseline commit and phase count in `CLAUDE.md`'s "Current state"
  paragraph, and the "Catalogue snapshot" line in `PLAN/README.md`.
- Worked example: the 2026-10-08 update (133 items re-graded, 40 phases rewritten; DM ids remapped
  after a renumbering) is in `PLAN/README.md`, "Update history".

## Ground rules

- You are the orchestrator: plumbing and decisions only. The scripts in `T/` do the deterministic
  work. The workflows do the judgement: Sonnet grades the gaps, Opus outlines and critiques the plan,
  and Sonnet writes and reviews the phase docs. Opus writes only the few phases the outline marks
  hard. This skill authorises the Workflow tool; load `workflow-authoring` first if you need to adapt
  a script.
- **Spend where judgement is needed** (see "Cost" at the end). A plan update should cost a fraction of
  a weekly budget, not a third of it. Never send every phase through a writer and a reviewer by
  default.
- Phases already built are frozen. Never rewrite them; follow-up work goes to a later phase.
- A phase **in progress** (progress file row `IN PROGRESS`, for example a phase after its first of two
  sessions) is partly built. Its built part is frozen. Its doc keeps its own drift-check baseline, and
  gains a dated "Requirements changed since <the built part> (<date>)" section saying what the unbuilt
  part must now build differently. If a change would undo built work, stop and ask the user.
- **Agents test themselves; the owner reviews once at the end** (`ROADMAP.md`, "Owner review: agents
  test themselves"). Any phase doc or prompt you add or change keeps that rule:
  - no plan-approval stop;
  - the agent runs the manual test checklist itself in the running app;
  - "ask the owner" becomes a built default, logged on the phase's "For the owner's review" list;
  - stops are kept only for the cases that section names.

  Tell any writer or reviewer agent you start the same.
- **If the plan uses screenshot capture** (config `capture`): screenshots match the app after every
  phase. Every unbuilt phase doc and prompt carries the Catalogue screenshots step (see "Catalogue
  screenshots in the plan" below), and any phase you add, change or re-scope has that section brought
  in step with its new covered items. The plan edits plan files only: never create, edit or delete
  capture recipes, catalogue images or the capture report while updating the plan. The build phases
  do that, and verify it with a capture run. Tell any agent you start the same.
- Do not commit or push.

## The tools and the plan's config

Run every tool from the repo root as `node T/<tool>`. Each finds the plan by itself: `--plan <dir>` if
given, else the `BUILD_PLAN` environment variable, else the repo's only `plan.config.json`, else
`docs/build-plan`. Pass `--plan PLAN` when the repo has more than one plan. `node T/config.mjs --json`
prints the resolved config: pass its output as the `config` argument of every workflow. Workflow
script paths are absolute: `<repo>/T/workflow-<name>.js`. `node --test T/req-changes.test.mjs` tests
the change detection.

`PLAN/plan.config.json` holds everything project-specific the tools and workflows use. Every key is
optional; without the file, defaults apply (a new adopter's plan). The keys:

| Key | What it is (default) |
|---|---|
| `name`, `title` | The plan's name in prompts and pages (`build plan`, `Build plan`) |
| `subject`, `appNoun`, `app`, `appCode`, `appSummary` | What is built (`the app`), the word for it (`app`), its folder, the code paths whose change makes the code maps stale (`[app]`), and one sentence for agents |
| `board`, `requirements`, `boardUrl` | The board folder (`requirements-board`), its requirements folder (`<board>/requirements`), its dev server (`http://localhost:5180`) |
| `progress` | The progress file (none): a status table with rows `\| NN \| <title> \| DONE \| <date> \|` or `IN PROGRESS`, and a `### [<word>] Phase NN` entry per built phase. Without one, `PLAN/status.json` `done` and `in_progress` lists say which phases are built |
| `firstPhase` | The first phase number this plan owns (`01`); phases below it are ignored in the progress file |
| `outOfScopeLanes` | Board swim lanes left out of the plan, e.g. `["Future Work"]` (none) |
| `settledStatuses`, `unsettledStatuses` | Status codes to build first and to flag "confirm before building" (from the board config's `settle` flags) |
| `olderCatalogues` | Earlier locations of the catalogue, `{ root, items, questions, notes }`, so diffs across a move stay rename-aware (none) |
| `capture` | Screenshot capture on or off (on when the board's config has a `capture` section) |
| `standingRules`, `projectRules`, `greenCommands` | Text every agent gets: the plan's standing rules, the project's coding rules, the commands that must pass |
| `gapAnalysis` | `codeGuide`, `history`, `sourcesExample`, `outOfScope`, `outOfScopeShort`, `demoTriggerRule`, `surfaces`, `maps` (`[{ key, scope }]`, one code-mapping agent each), `modelCode`, `decisionsLog`, `demoScript`, `themeBullets` |
| `planning` | Fresh-plan text: `history`, `ownerRules`, `styleRefs`, `guidance`, `research`, `criticChecks` |
| `phaseDoc` | `extraSections` (`afterWorkItems`, `afterChecklist`, `afterScreenshots`: "## Name: what it holds"), `readFirst`, `reference`, `workItemRules`, `promptRules`, `reviewChecks` |
| `index` | The page's words: `title`, `kicker`, `heading`, `intro` (`{phases}`, `{first}`, `{last}`, `{commit}` filled in), `themesHeading`, `howTo`, `callouts`, `footer`, `tracks` (`{ "<track>": "setup" \| "A" … "E" }`) |

`PLAN/units.json` (every gap, DM and RV id to plan) is generated by `assemble-gaps.mjs`; never edit it.
`ROADMAP.md`'s owner decisions are table rows that start `| D<n> |`, with the phases each gates in the
third cell (`15b, 28 to 32`, or `all`): `phase-briefs.mjs` reads them.

## Stage 0: scope (yourself)

1. **Resolve the target.**
   - Take the sha from the argument (strip a GitHub link down to the sha), or use HEAD.
   - Get the full sha with `git rev-parse`, running `git fetch` first if needed.
   - If the working tree has uncommitted catalogue changes, say so and ask whether to commit them
     first: the plan should match a real commit.
   - If `PLAN/plan.json` does not exist, there is no plan yet: go to "Fresh plan" below.
2. **Read the plan state.** Run `node T/plan-state.mjs --to <sha>`. It gives:
   - the baseline;
   - the changed items (with current status) and changed questions;
   - the notes and change logs added (`changeLogsAdded`);
   - `domainModelChanged` and `appCodeChanged`;
   - `builtPhases` and `inProgressPhases`;
   - the current coverage.

   It reads the catalogue in every place it has lived (`olderCatalogues`), with rename detection, so a
   moved file counts only if its content changed. Never diff the catalogue by hand with a plain
   `git diff`. If the baseline equals the target, or nothing in the catalogue changed, stop and say so.
3. **Pick the items to re-grade.** Run `node T/regrade-ids.mjs <sha>`. It keeps:
   - items changed in substance or added (`req-changes.mjs` `substance()`). It ignores changes only
     to `artifacts:`, `related:`, `sources:`, `order:`, `swimlane:`, `images:` or link markup; a real
     status change counts (for example Proposed to Agreed, looked up in `REQ/board.config.json`:
     status files hold numbers), but a pure recode or relabel does not: statuses are normalised
     through `REQ/status-recodes.json` before diffing;
   - the `affects` of questions changed in substance.

   It drops retired items and the out-of-scope lanes, plus features whose live stories are all in
   those lanes, and reports the counts and the share of in-scope items. Tell the user the counts.
4. **Read the change logs.** Read the files in `changeLogsAdded` and skim the diffs you need
   (`plan-state.mjs --to <sha> --diff <IDs>`). Then write `changeNotes`: **at most about 40 lines**,
   because every outline agent carries them. Include:
   - the questions answered, with the gist of each;
   - the items added, changed, retired or moved, with the change-log paths;
   - any owner directives the user gave for this update.
5. **Choose the mode.**
   - **Update** is the default.
   - **Fresh plan** if there is no plan, if every phase is built, if `regrade-ids` reports more than
     about 60% of in-scope items, or if the user asks. Confirm with the user first (except when there
     is no plan): it is the most expensive path.
   - For a **small update** (a handful of items touching one or two phases), use "Small updates"
     below.

## Stage 1: re-grade the changed requirements (Workflow, Sonnet)

1. Build the epics argument: `node T/build-args.mjs $(node T/regrade-ids.mjs <sha> --ids-only)`.
   When a grading turns on why a requirement says what it says, the agents follow its `sources:`
   with `npm --prefix BOARD run source -- --item <ID> --text` (the workflow prompts already say so).
2. Run `Workflow({ scriptPath: "<repo>/T/workflow-gap-analysis.js", args })` with:
   - `root`: the repo root; `config`: the output of `node T/config.mjs --json`;
   - `commit`: the full sha;
   - `baseline`: `plan.json` `commit`. The data-model delta then updates the existing
     `analysis/domain-model-delta.md` from the domain model's diff and **keeps DM ids stable**. The
     plan cites deltas by number, so a renumbered delta file silently scrambles coverage;
   - `epics`: the parsed JSON from step 1;
   - `reuseMaps`: `!appCodeChanged`;
   - `runDelta`: `domainModelChanged`;
   - `runReverse`: true if any changed item is now retired or has moved to an out-of-scope lane;
   - `runThemes`: true only if you re-grade more than about 40% of in-scope items.
3. Check the DM ids before merging. Compare the delta file's index with the committed one
   (`git diff PLAN/analysis/domain-model-delta.md`). If continuing deltas changed number, map them
   back with one agent and remap the journal before assembling.
4. Merge: `node T/assemble-gaps.mjs <transcript dir>/journal.jsonl <sha> <today> --merge`.
   The transcript dir is in the Workflow tool's result. Check that `problems` is empty, and note how
   the verdict counts moved. This rewrites `gaps.json`, `GAP-ANALYSIS.md`, `epics/` and `units.json`.

## Stage 2: re-plan (two workflows and a brief builder)

### 2a. Outline and triage (Workflow, Opus)

Run `Workflow({ scriptPath: "<repo>/T/workflow-plan-outline.js", args })` with:
- `root`, `config`, `baseline` (`plan.json` `commit`) and `commit` (the full sha);
- `units`: the contents of `PLAN/units.json`;
- `oldPhases`: from `plan-state.mjs` (`num`, `title`, `file`, `covers`);
- `builtPhases`;
- `partlyBuilt`: `[{num, note}]` for each in-progress phase. The note says what is built and frozen,
  and what is left;
- `changeNotes`.

The architect updates the outline and `ROADMAP.md`, coverage is fixed in code, and a critic
challenges it, with one revision if the critic asks. The architect also **triages** every unbuilt
phase:
- **left out**: only its drift baseline moves, and a script does that;
- **light**: one Sonnet writer, no reviewer;
- **substantive**: a writer and a reviewer;
- **hard**: at most four substantive phases, which get an Opus writer.

The critic challenges the tiers as well as the plan. Check that the result's coverage is `ok`, and
read the tier tally. If it puts most phases at substantive, ask yourself whether the catalogue change
really rewrote them before you spend on it.

### 2b. Briefs (yourself, a script)

Run `node T/phase-briefs.mjs <outline transcript dir>/journal.jsonl <sha> --out <scratchpad>/briefs --built <builtPhases>`.
Do not list in-progress phases under `--built`: they get a brief. It writes:
- one brief per phase to write (`<num>.md`). It holds:
  - the phase's outline entry;
  - the covers that joined or left;
  - the substantive catalogue diff of each covered item;
  - its gap entries;
  - the owner decisions that gate it;
  - the changed questions and change-log rows that name its items;
  - with screenshot capture, its catalogue screenshot rows (`recipe-status.mjs`, against the new covers);
- `outline.md`, one line per phase, which is the writers' view of their neighbours;
- `detail-args.json`.

Writers read their brief and their own doc instead of `ROADMAP.md`, `gaps.json` and the change logs
whole. That context, re-read on every turn, is most of what a plan update costs.

### 2c. Phase docs (Workflow, Sonnet)

Run `Workflow({ scriptPath: "<repo>/T/workflow-plan-detail.js", args })` with:
- `root`, `config`, `baseline` and `commit`;
- `today`;
- `briefsDir`;
- `phases`: the contents of `detail-args.json`;
- `partlyBuilt`;
- `changeNotes`: only the owner directives the writers need, not the whole summary.

**If agents fail** (a usage limit, an API error), do not resume the run. Resume replays only the
longest unchanged prefix of agent calls, so in a pipeline it re-runs work that had already finished.
Call the workflow again instead:
- set `phases` to the result's `failed` list;
- add `reviewOnly` for its `reviewFailed` list (their writers finished).

For a large update, you may run the phases in batches of about ten, so a limit costs one batch, not
the run. Read the result's `needsOwner`: if a partly built phase would lose built work, ask the user
before going on.

## Stage 3: publish and check

1. **Apply.** Run `node T/apply-plan-update.mjs <outline journal> <detail journal> [<re-run journals> ...] <sha>`.
   - It rebuilds `plan.json` exactly from the runs; later journals win for a phase.
   - It moves the drift-check baseline only on baseline lines, never in ranges, history or README.md.
   - It keeps the baseline of phases the progress file marks DONE or IN PROGRESS.
   - It regenerates `index.html`. Its output must show no `indexWarnings`.
2. **Coverage.** `node T/plan-state.mjs --coverage` must report ok, with no `unknown`. Ids only on
   built phases that now Match are listed as `delivered`.
3. **Screenshot check** (with screenshot capture). `node T/recipe-status.mjs --check` must pass:
   - every unbuilt phase doc has a `## Catalogue screenshots` section naming each story it owns
     screenshots for, including every story under a covered epic or feature;
   - every kick-off prompt runs `npm run capture`.

   Fix any phase it names yourself. These are usually rows for an epic's or feature's other stories:
   one line each saying which phase owns it.
4. **Consistency.** Run one fresh Sonnet agent, at `medium` effort. Use Opus only when more than
   about 15 phases changed. It fixes problems in place:
   - every relative link in `PLAN/` resolves (use a script, not reading);
   - the `ROADMAP.md` table, `plan.json` and the phase doc headers agree;
   - no unbuilt phase still names the old baseline, except a partly built one, or builds a default
     for a decision `ROADMAP.md` records as answered;
   - kick-off prompts reference files that exist;
   - every unbuilt phase keeps the standing rules "This repo" names for phase docs and prompts;
   - with screenshot capture, each updated phase's "Catalogue screenshots" rows match its covered items;
   - `node T/build-index.mjs` is re-run if it changed anything.

   Point it at the changed phases only (`git diff --stat PLAN/phases`).
5. **Update records.**
   - Add a line to "Update history" at the end of `PLAN/README.md`: date, `old..new` commit, items
     re-graded, phases changed or added.
   - Any other record "This repo" names.
6. **Report briefly.**
   - The re-grade counts, and how the verdicts moved.
   - The tier tally, and the phases changed (one line each, with why), added or merged.
   - With screenshot capture, that `recipe-status.mjs --check` passes, and any phase whose screenshot
     rows changed.
   - The decisions now built as answered, and the decision rows added.
   - The new session estimate.
   - Anything left for the user.
   - A reminder to commit.

## Small updates

If only a few items changed and they touch one or two phases, skip the workflows after Stage 1:
1. Re-grade the items as in Stage 1. For five items or fewer, one Sonnet agent can grade them
   directly against the code maps.
2. Update `ROADMAP.md` and those phase docs and prompts yourself, each with one fresh Sonnet reviewer
   subagent. With screenshot capture, keep each phase's "Catalogue screenshots" section in step with
   its covered items.
3. Update `plan.json` with a short node script, not by retyping it.
4. Run `node T/build-index.mjs`, then the Stage 3 checks.

## Fresh plan

For a project with no plan yet, or when the plan is to be remade. Confirm the cost with the user
first when a plan exists.

1. **The plan folder and its config.** If `PLAN/plan.config.json` does not exist, create `PLAN/` and
   write one with what you know and the user confirms, at least: `name`, `subject`, `app`, `appCode`,
   `appSummary`, `progress` (or none), `firstPhase` (after the last phase already built, if a plan is
   being remade), `outOfScopeLanes`, `capture`, `projectRules` and `greenCommands`. For the gap
   analysis, `gapAnalysis.maps` splits the code into areas of about 25KB of map each (one mapping
   agent per area): with one small app, leave it out. Everything else can wait. Run
   `node T/config.mjs` to see the resolved values.
2. **Grade everything.** `node T/build-args.mjs` (no IDs: every in-scope item), then
   `Workflow({ scriptPath: "<repo>/T/workflow-gap-analysis.js", args })` with `root`, `config`,
   `commit` and `epics`, no `baseline` and no switches (maps, delta, reverse check and themes all
   run). Then `node T/assemble-gaps.mjs <transcript dir>/journal.jsonl <sha> <today>` (no `--merge`).
3. **Plan.** `Workflow({ scriptPath: "<repo>/T/workflow-dev-plan.js", args })` with `root`, `config`,
   `commit`, `units` (`PLAN/units.json`), `today` and, when remaking a plan, `firstPhase`. It writes
   `ROADMAP.md` (with the owner decisions table and the standing rules) and every phase doc and
   prompt, each reviewed once.
4. **Publish.** `node T/apply-plan-update.mjs <dev-plan transcript dir>/journal.jsonl <sha>` builds
   `plan.json` and `index.html`. Then run the Stage 3 checks (coverage, screenshot check, consistency).
5. **Records.** Write `PLAN/README.md`: what the plan is, how it was made, the catalogue snapshot,
   where to start, and an "Update history" section with this run as its first line. Add any other
   record "This repo" names (for example a pointer in `CLAUDE.md`).

## Cost

What one large update (133 items re-graded, 40 phases rewritten) taught. Most of the cost was cache
reads: each turn re-reads the agent's whole context, so **context size × turns × model price** is the
bill.

| What drove it | Share then | What to do now |
|---|---|---|
| An Opus writer for every affected phase, at about 250k context and 45 turns each | about 46% | Triage. Sonnet writers working from briefs; Opus only for phases marked hard |
| An Opus reviewer for every phase, reading the whole doc | about 40% | Reviewers only on substantive phases, Sonnet at `medium`, reading the diff |
| Resume re-running 19 reviewers that had already finished, after a usage limit | about 11% | Re-run the `failed` and `reviewFailed` lists; never resume a pipeline |
| A consistency agent repairing the baseline tool's damage | about 2% | Fixed: `apply-plan-update.mjs` now moves baseline lines only |
| Stage 1 grading (Sonnet, with verifiers) | about 8% | Keep it. It is cheap, and it catches real problems |

Rules of thumb:
- **Never let an agent read `gaps.json` (it reaches 200k tokens) whole.** Query it by id. The same
  goes for `ROADMAP.md`, the progress file and the change logs when a brief or a grep will do.
- **Phase docs average 25k tokens**, and every writer, reviewer and build session pays for that
  length. Writers keep them lean: link, don't restate; one or two lines per screenshot row; cut what
  is superseded when adding.
- **Smaller, more frequent updates are cheaper** than one large one: run this skill after each
  requirements change log, not after several.

## Catalogue screenshots in the plan

Only when the plan uses screenshot capture (config `capture`; "This repo" names the runner, the
recipes and what it drives). The screenshots on catalogue stories come from the board's capture
runner, which works from one recipe per item and links the images into each item's `images`.

The standing rule is "Catalogue screenshots" in `PLAN/ROADMAP.md`. Keep it there when the architect
rewrites the roadmap, including its bullet in the list of what every phase closes with. Each unbuilt
phase must carry it in four places:

1. **A `## Catalogue screenshots` section** in the phase doc:
   - one table row per item that `node T/recipe-status.mjs <num>` lists, each ID linked. Each
     row gives its recipe at plan time, and what it must be when the phase is done: status; shots
     and states per app; what the highlight boxes; and the caption in the catalogue's words. Keep each
     row to one or two lines; an item the phase does not change gets "no change here (Phase NN owns
     it)";
   - "Recipes this phase breaks": other recipes whose route, seed id, text or selector the phase
     changes, found by grepping the recipes for what it renames or removes;
   - the recipe guide (`ATLAS.md`) sections to update.
2. **A Manual test checklist item**: a full `npm run capture` with no failed recipe and no story
   without a recipe, the new shots checked by eye, and `npm run verify:board` green.
3. **A progress-file bullet**: recipes created or changed, and the capture report's counts before and
   after.
4. **The kick-off prompt**:
   - the recipe guide and the ROADMAP rule in the read-first list;
   - a "When done:" bullet that runs the step: in `BOARD/`, `node scripts/capture.ts --dry`, then a
     full `npm run capture`, starting the app's dev servers in the background if one is down;
   - `npm run verify:board` in the green line.

Rules to keep when re-planning:
- An item that moves to another phase takes its row with it. A new story with no recipe gets a
  "create" row.
- An item the phase builds only in part stays `partial`, and its reason names the later phase that
  finishes it. The plan's last phase leaves no reason naming a later phase.
- When a phase removes a screen that a retired or out-of-scope item's recipe shoots, that recipe
  becomes `absent`.
- Shot `name`s stay stable when a recipe is re-pointed. Rename a shot only when the old name
  describes retired behaviour; the runner deletes the old generated image, so nothing goes stale.
- A caption that describes superseded behaviour is replaced by the phase that re-points its recipe.
- Earlier advice in a phase doc to leave screenshots stale, or for the owner to re-shoot them, is
  replaced by the step.

`node T/recipe-status.mjs --check` is the mechanical guard. It fails if:
- an unbuilt phase lacks the section;
- the section misses one of its stories;
- the prompt never runs `npm run capture`.

The detail workflow's writer and reviewer prompts already ask for the section, and the briefs carry
the rows, so check that their output does too.
