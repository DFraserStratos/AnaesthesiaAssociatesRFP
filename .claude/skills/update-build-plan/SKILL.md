---
name: update-build-plan
description: Update (or remake) the prototype's catch-up build plan in docs/prototype-build/catch-up from requirements changes committed to the repo. It re-grades the changed requirements against the prototype, re-plans and triages the affected phases, updates their phase docs and kick-off prompts from per-phase briefs, moves the drift-check baseline, and regenerates the HTML plan. Use after a requirements update has been committed. Pass the commit, a GitHub commit link, or nothing for HEAD.
argument-hint: "<commit sha or GitHub commit link> (default: HEAD)"
---

# Update the build plan from requirements changes

The catch-up plan (`docs/prototype-build/catch-up/`, start at its `README.md`) is a verified gap analysis
plus phases numbered from 14, each with a plan doc and a kick-off prompt. It records the catalogue commit
it matches in `plan.json` `"commit"`. This skill brings it up to a newer commit.

Paths below are relative to the repo root (`git rev-parse --show-toplevel`); `CU` =
`docs/prototype-build/catch-up`. Pass Workflow script paths as absolute paths. Run the tools with
Node 24: agent shells default to an older Node, so prefix commands with
`PATH="$HOME/.nvm/versions/node/v24.20.0/bin:$PATH"`.

## Ground rules

- You are the orchestrator: plumbing and decisions only. The scripts in `CU/tools/` do the
  deterministic work. The workflows do the judgement: Sonnet grades the gaps, Opus outlines and
  critiques the plan, and Sonnet writes and reviews the phase docs. Opus writes only the few phases
  the outline marks hard. This skill authorises the Workflow tool; load `workflow-authoring` first if
  you need to adapt a script.
- **Spend where judgement is needed** (see "Cost" at the end). A plan update should cost a fraction of
  a weekly budget, not a third of it. Never send every phase through a writer and a reviewer by
  default.
- Phases already built are frozen. Never rewrite them; follow-up work goes to a later phase.
- A phase **in progress** (PROGRESS.md row `IN PROGRESS`, for example 15a after its session 1) is
  partly built. Its built part is frozen. Its doc keeps its own drift-check baseline, and gains a
  dated "Requirements changed since <the built part> (<date>)" section saying what the unbuilt part
  must now build differently. If a change would undo built work, stop and ask the user.
- **Screenshots match the app after every phase.** Every unbuilt phase doc and prompt carries the
  Catalogue screenshots step (see "Catalogue screenshots in the plan" below). Any phase you add,
  change or re-scope has that section brought in step with its new covered items.
- **Agents test themselves; the owner reviews once at the end** (ROADMAP.md "Owner review: agents
  test themselves"). Any phase doc or prompt you add or change keeps that rule:
  - no plan-approval stop;
  - the agent runs the manual test checklist itself in the running app;
  - "ask the owner" becomes a built default, logged on the phase's "For the owner's review" list;
  - stops are kept only for the cases that section names.

  Tell any writer or reviewer agent you start the same.
- The plan edits plan files only. Never create, edit or delete capture recipes
  (`requirements-board/capture/recipes/`), catalogue images or `capture/REPORT.md` while updating the
  plan: the build phases do that, and verify it with a capture run. Tell any agent you start the same.
- Do not commit or push.

## Stage 0: scope (yourself)

1. **Resolve the target.**
   - Take the sha from the argument (strip a GitHub link down to the sha), or use HEAD.
   - Get the full sha with `git rev-parse`, running `git fetch` first if needed.
   - If the working tree has uncommitted catalogue changes, say so and ask whether to commit them
     first: the plan should match a real commit.
2. **Read the plan state.** Run `node CU/tools/plan-state.mjs --to <sha>`. It gives:
   - the baseline;
   - the changed items (with current status) and changed questions;
   - the notes and change logs added (`changeLogsAdded`);
   - `domainModelChanged` and `prototypeCodeChanged`;
   - `builtPhases` and `inProgressPhases`;
   - the current coverage.

   It reads the catalogue in every place it has lived, with rename detection, so a moved file counts
   only if its content changed. Never diff the catalogue by hand with a plain `git diff`. If the
   baseline equals the target, or nothing in the catalogue changed, stop and say so.
3. **Pick the items to re-grade.** Run `node CU/tools/regrade-ids.mjs <sha>`. It keeps:
   - items changed in substance or added (`req-changes.mjs` `substance()`). It ignores changes only
     to `artifacts:`, `related:`, `sources:`, `order:`, `swimlane:`, `images:` or link markup; a
     status change counts;
   - the `affects` of questions changed in substance.

   It drops Retired, Future and Future Work items, and reports the counts and the share of in-scope
   items. Tell the user the counts.
4. **Read the change logs.** Read the files in `changeLogsAdded` and skim the diffs you need
   (`plan-state.mjs --to <sha> --diff <IDs>`). Then write `changeNotes`: **at most about 40 lines**,
   because every outline agent carries them. Include:
   - the questions answered, with the gist of each;
   - the items added, changed, retired or moved, with the change-log paths;
   - any owner directives the user gave for this update.
5. **Choose the mode.**
   - **Update** is the default.
   - **Fresh plan** if every catch-up phase is built, if `regrade-ids` reports more than about 60% of
     in-scope items, or if the user asks. A fresh plan runs `CU/tools/workflow-gap-analysis.js` in
     full, then `CU/tools/workflow-dev-plan.js`, adapted so the first phase number follows the last
     built phase. Confirm with the user first: it is the most expensive path.
   - For a **small update** (a handful of items touching one or two phases), use "Small updates"
     below.

## Stage 1: re-grade the changed requirements (Workflow, Sonnet)

1. Build the epics argument: `node CU/tools/build-args.mjs $(node CU/tools/regrade-ids.mjs <sha> --ids-only)`.
   When a grading turns on why a requirement says what it says, the agents follow its `sources:`
   with `npm --prefix requirements-board run source -- --item <ID> --text` (the workflow prompts
   already say so).
2. Run `Workflow({ scriptPath: "<repo>/CU/tools/workflow-gap-analysis.js", args })` with:
   - `root`: the repo root;
   - `commit`: the full sha;
   - `baseline`: `plan.json` `commit`. The data-model delta then updates the existing
     `analysis/domain-model-delta.md` from the domain model's diff and **keeps DM ids stable**. The
     plan cites deltas by number, so a renumbered delta file silently scrambles coverage;
   - `epics`: the parsed JSON from step 1;
   - `reuseMaps`: `!prototypeCodeChanged`;
   - `runDelta`: `domainModelChanged`;
   - `runReverse`: true if any changed item is now Retired or Future;
   - `runThemes`: true only if you re-grade more than about 40% of in-scope items.
3. Check the DM ids before merging. Compare the delta file's index with the committed one
   (`git diff CU/analysis/domain-model-delta.md`). If continuing deltas changed number, map them back
   with one agent and remap the journal before assembling. The 2026-10-08 update shows how
   (README.md, "Update history").
4. Merge: `node CU/tools/assemble-gaps.mjs <transcript dir>/journal.jsonl <sha> <today> --merge`.
   The transcript dir is in the Workflow tool's result. Check that `problems` is empty, and note how
   the verdict counts moved. This rewrites `gaps.json`, `GAP-ANALYSIS.md`, `epics/` and
   `tools/units.json`.

## Stage 2: re-plan (two workflows and a brief builder)

### 2a. Outline and triage (Workflow, Opus)

Run `Workflow({ scriptPath: "<repo>/CU/tools/workflow-plan-outline.js", args })` with:
- `root`, `baseline` (`plan.json` `commit`) and `commit` (the full sha);
- `units`: the contents of `CU/tools/units.json`;
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

Run `node CU/tools/phase-briefs.mjs <outline transcript dir>/journal.jsonl <sha> --out <scratchpad>/briefs --built <builtPhases>`.
Do not list in-progress phases under `--built`: they get a brief. It writes:
- one brief per phase to write (`<num>.md`). It holds:
  - the phase's outline entry;
  - the covers that joined or left;
  - the substantive catalogue diff of each covered item;
  - its gap entries;
  - the owner decisions that gate it;
  - the changed questions and change-log rows that name its items;
  - its catalogue screenshot rows (`recipe-status.mjs --plan`, against the new covers);
- `outline.md`, one line per phase, which is the writers' view of their neighbours;
- `detail-args.json`.

Writers read their brief and their own doc instead of ROADMAP.md, `gaps.json` and the change logs
whole. That context, re-read on every turn, is most of what a plan update costs.

### 2c. Phase docs (Workflow, Sonnet)

Run `Workflow({ scriptPath: "<repo>/CU/tools/workflow-plan-detail.js", args })` with:
- `root`, `baseline` and `commit`;
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

1. **Apply.** Run `node CU/tools/apply-plan-update.mjs <outline journal> <detail journal> [<re-run journals> ...] <sha>`.
   - It rebuilds `plan.json` exactly from the runs; later journals win for a phase.
   - It moves the drift-check baseline only on baseline lines, never in ranges, history or README.md.
   - It keeps the baseline of phases PROGRESS.md marks DONE or IN PROGRESS.
   - It regenerates `index.html`. Its output must show no `indexWarnings`.
2. **Coverage.** `node CU/tools/plan-state.mjs --coverage` must report ok, with no `unknown`. Ids only
   on built phases that now Match are listed as `delivered`.
3. **Screenshot check.** `node CU/tools/recipe-status.mjs --check` must pass:
   - every unbuilt phase doc has a `## Catalogue screenshots` section naming each story it owns
     screenshots for, including every story under a covered epic or feature;
   - every kick-off prompt runs `npm run capture`.

   Fix any phase it names yourself. These are usually rows for an epic's or feature's other stories:
   one line each saying which phase owns it.
4. **Consistency.** Run one fresh Sonnet agent, at `medium` effort. Use Opus only when more than
   about 15 phases changed. It fixes problems in place:
   - every relative link in `CU/` resolves (use a script, not reading);
   - the `ROADMAP.md` table, `plan.json` and the phase doc headers agree;
   - no unbuilt phase still names the old baseline, except a partly built one, or builds a default
     for a decision `ROADMAP.md` records as answered;
   - kick-off prompts reference files that exist;
   - every unbuilt phase that touches UI has the frontend-design bullet in its prompt's "While
     working:" list (`CU/ROADMAP.md`, "Front-end design");
   - each updated phase's "Catalogue screenshots" rows match its covered items;
   - `node CU/tools/build-index.mjs` is re-run if it changed anything.

   Point it at the changed phases only (`git diff --stat CU/phases`).
5. **Update records.**
   - Add a line to "Update history" at the end of `CU/README.md`: date, `old..new` commit, items
     re-graded, phases changed or added.
   - Change the "Catalogue snapshot" line in that README.
   - Change the baseline commit and phase count in `CLAUDE.md`'s "Current state" paragraph.
6. **Report briefly.**
   - The re-grade counts, and how the verdicts moved.
   - The tier tally, and the phases changed (one line each, with why), added or merged.
   - That `recipe-status.mjs --check` passes, and any phase whose screenshot rows changed.
   - The decisions now built as answered, and the decision rows added.
   - The new session estimate.
   - Anything left for the user.
   - A reminder to commit.

## Small updates

If only a few items changed and they touch one or two phases, skip the workflows after Stage 1:
1. Re-grade the items as in Stage 1. For five items or fewer, one Sonnet agent can grade them
   directly against the prototype maps.
2. Update `ROADMAP.md` and those phase docs and prompts yourself, each with one fresh Sonnet reviewer
   subagent. Keep each phase's "Catalogue screenshots" section in step with its covered items.
3. Update `plan.json` with a short node script, not by retyping it.
4. Run `CU/tools/build-index.mjs`, then the Stage 3 checks.

## Cost

What the 2026-10-08 update (133 items re-graded, 40 phases rewritten) taught. Most of the cost was
cache reads: each turn re-reads the agent's whole context, so **context size × turns × model price**
is the bill.

| What drove it | Share then | What to do now |
|---|---|---|
| An Opus writer for every affected phase, at about 250k context and 45 turns each | about 46% | Triage. Sonnet writers working from briefs; Opus only for phases marked hard |
| An Opus reviewer for every phase, reading the whole doc | about 40% | Reviewers only on substantive phases, Sonnet at `medium`, reading the diff |
| Resume re-running 19 reviewers that had already finished, after a usage limit | about 11% | Re-run the `failed` and `reviewFailed` lists; never resume a pipeline |
| A consistency agent repairing the baseline tool's damage | about 2% | Fixed: `apply-plan-update.mjs` now moves baseline lines only |
| Stage 1 grading (Sonnet, with verifiers) | about 8% | Keep it. It is cheap, and it catches real problems |

Rules of thumb:
- **Never let an agent read `gaps.json` (200k tokens) whole.** Query it by id. The same goes for
  ROADMAP.md, PROGRESS.md and the change logs when a brief or a grep will do.
- **Phase docs average 25k tokens**, and every writer, reviewer and build session pays for that
  length. Writers keep them lean: link, don't restate; one or two lines per screenshot row; cut what
  is superseded when adding.
- **Smaller, more frequent updates are cheaper** than one large one: run this skill after each
  requirements change log, not after several.

## Catalogue screenshots in the plan

The screenshots on catalogue stories come from the Requirements Board's capture runner
(`requirements-board/scripts/capture.ts`). It works from one recipe per item
(`requirements-board/capture/recipes/<ID>.json`; the format, routes, seed ids and hooks are in
`requirements-board/capture/ATLAS.md`). `npm run capture` in `requirements-board/` drives the
prototype (5173) and the PWA (5174), and writes
`requirements-board/requirements/assets/<ID>/<app>-<name>[-<state>].png`. It links the images into
each item's `images`, rewrites only the images that changed, and writes `capture/REPORT.md`.

The standing rule is "Catalogue screenshots" in `CU/ROADMAP.md` (PROGRESS convention 19). Keep it in
`ROADMAP.md` when the architect rewrites it, including the bullet in "Every phase closes the same
way". Each unbuilt phase must carry it in four places:

1. **A `## Catalogue screenshots` section** in the phase doc, after "Demo guide updates":
   - one table row per item that `node CU/tools/recipe-status.mjs <num>` lists, each ID linked. Each
     row gives its recipe at plan time, and what it must be when the phase is done: status; shots
     and states per app (web and mobile both, where both have it); what the highlight boxes; and the
     caption in the catalogue's words. Keep each row to one or two lines; an item the phase does not
     change gets "no change here (Phase NN owns it)";
   - "Recipes this phase breaks": other recipes whose route, seed id, text or selector the phase
     changes, found by grepping the recipes for what it renames or removes;
   - the `ATLAS.md` sections to update.
2. **A Manual test checklist item**: a full `npm run capture` with no failed recipe and no story
   without a recipe, the new shots checked by eye, and `npm run verify:board` green.
3. **A PROGRESS.md updates bullet**: recipes created or changed, and the REPORT.md counts before and
   after.
4. **The kick-off prompt**:
   - `requirements-board/capture/ATLAS.md` and the ROADMAP rule in the read-first list;
   - a "When done:" bullet after the adversarial review that runs the step. In
     `requirements-board/`, run `node scripts/capture.ts --dry`, then a full `npm run capture`,
     starting root `npm run dev` in the background if a server is down;
   - `npm run verify:board` in the green line.

Rules to keep when re-planning:
- An item that moves to another phase takes its row with it. A new story with no recipe gets a
  "create" row, because Phase 14's baseline sweep gives every live story a recipe.
- An item the phase builds only in part stays `partial`, and its reason names the later phase that
  finishes it. Phase 44's final sweep leaves no reason naming a later phase.
- When a phase removes a screen that a Retired or Future item's recipe shoots, that recipe becomes
  `absent`.
- Shot `name`s stay stable when a recipe is re-pointed. Rename a shot only when the old name
  describes retired behaviour; the runner deletes the old generated image, so nothing goes stale.
- A caption that describes superseded behaviour is replaced by the phase that re-points its recipe.
- Shots hide the harness bar, so recipes stage demo triggers with the runner's `trigger` step
  (Phase 14 adds it), not by clicking the hidden bar. Anything that would appear in every fresh
  browser context, such as a first-run welcome card, needs the runner to preset it (Phase 43a).
- Earlier advice in a phase doc to leave screenshots stale, or for the owner to re-shoot them, is
  replaced by the step.

`node CU/tools/recipe-status.mjs --check` is the mechanical guard. It fails if:
- an unbuilt phase lacks the section;
- the section misses one of its stories;
- the prompt never runs `npm run capture`.

The detail workflow's writer and reviewer prompts already ask for the section, and the briefs carry
the rows, so check that their output does too.
