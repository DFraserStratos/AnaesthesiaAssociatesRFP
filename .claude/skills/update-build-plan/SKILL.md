---
name: update-build-plan
description: Update (or remake) the prototype's catch-up build plan in docs/prototype-build/catch-up from requirements changes committed to the repo. It re-grades the changed requirements against the prototype, re-plans the affected phases, updates their phase docs and kick-off prompts, moves the drift-check baseline, and regenerates the HTML plan. Use after a requirements update has been committed. Pass the commit, a GitHub commit link, or nothing for HEAD.
argument-hint: "<commit sha or GitHub commit link> (default: HEAD)"
---

# Update the build plan from requirements changes

The catch-up plan (`docs/prototype-build/catch-up/`, start at its `README.md`) is a verified gap analysis
plus phases numbered from 14, each with a plan doc and a kick-off prompt. It records the catalogue commit
it matches in `plan.json` `"commit"`. This skill brings it up to a newer commit.

Paths below are relative to the repo root (`git rev-parse --show-toplevel`); `CU` =
`docs/prototype-build/catch-up`. Pass Workflow script paths as absolute paths.

## Ground rules

- You are the orchestrator: plumbing and decisions only. The scripts in `CU/tools/` do the deterministic
  work, and the workflows do the judgement, with Sonnet for grading and Opus for planning, each step
  adversarially reviewed. This skill authorises the Workflow tool; load `workflow-authoring` first if you
  need to adapt a script.
- Phases already built are frozen. Never rewrite them; follow-up work goes to a later phase.
- **Screenshots match the app after every phase.** The outcome the owner wants is that, when a phase is
  done, the screenshots on its user stories show what was built. So every unbuilt phase doc and prompt
  carries the Catalogue screenshots step (see "Catalogue screenshots in the plan" below), and any phase
  you add, change or re-scope has that section brought in step with its new covered items.
- **Agents test themselves; the owner reviews once at the end** (ROADMAP.md "Owner review: agents test
  themselves"). Any phase doc or prompt you add or change keeps that rule: no plan-approval stop, the
  agent runs the manual test checklist itself in the running app, "ask the owner" becomes a built default
  logged on the phase's "For the owner's review" list, and stops are kept only for the cases that section
  names. Tell any writer or reviewer agent you start the same.
- The plan edits plan files only. Never create, edit or delete capture recipes
  (`requirements-board/capture/recipes/`), catalogue images or `capture/REPORT.md` while updating the
  plan: the build phases do that, and they verify it with a capture run. Tell any agent you start the
  same.
- Do not commit or push.

## Stage 0: scope (yourself)

1. Resolve the target: take the sha from the argument (strip a GitHub link down to the sha) or use
   HEAD. Get the full sha with `git rev-parse`, running `git fetch` first if needed. If the working tree
   has uncommitted catalogue changes, say so and ask whether they should be committed first: the plan
   should match a real commit.
2. Run `node CU/tools/plan-state.mjs --to <sha>`. It gives the baseline, changed items (with current
   status), changed questions, notes added, change logs added (`changeLogsAdded`), `domainModelChanged`,
   `prototypeCodeChanged`, `builtPhases` and the current coverage. It reads the catalogue in every place
   it has lived (`tools/req-changes.mjs`: `requirements-board/requirements/` now, `docs/discovery-reference/
   Updated Requirements/` before 2026-10-08) with rename detection, so a moved file counts only if its
   content changed: never diff the catalogue by hand with a plain `git diff`. If the baseline equals the
   target, or nothing in the catalogue changed, stop and say so.
3. Read the change logs in `changeLogsAdded` and skim the diff (`node CU/tools/plan-state.mjs --to <sha>
   --diff <IDs>` for the items you need). Write a `changeNotes`
   summary of about 10 lines: the questions answered (with the gist of each), and items added, changed,
   retired or moved, with the change-log paths.
4. Choose the mode:
   - **Update** (the default).
   - **Fresh plan**, if every catch-up phase is built, or more than about 60% of in-scope items changed,
     or the user asks. A fresh plan runs `CU/tools/workflow-gap-analysis.js` in full, then
     `CU/tools/workflow-dev-plan.js`. Adapt a copy so the first phase number follows the last built
     phase, then assemble as below. Confirm with the user before a fresh plan; it costs about 15M tokens.

## Stage 1: re-grade the changed requirements (Workflow, Sonnet)

1. Pick the IDs to re-grade:
   - the changed and added items whose status is not Retired or Future;
   - every item listed in `affects` of a changed question;
   - the parent epic and feature of a changed story only when their own text changed.
   Retired and Future items need no grading: they drop out of the plan on assembly.
   Leave out items whose only change is their `artifacts:` field (a link to a diagram, transcript or
   document): artifacts are evidence the Requirements Board shows, not requirements, and the
   prototype has nothing to build for them. Changes under `requirements-board/requirements/artifacts/`
   and `requirements-board/requirements/notes/` alone never call for re-grading either.
   When a grading (yours, or an agent's) turns on why a requirement says what it says, follow its
   `sources:` into the cited spots rather than reading whole notes or transcripts:
   `npm --prefix requirements-board run source -- --item <ID> --text` prints, for each source, the
   artifact, its file and the cited page or lines, then the passage itself (a note's point, an RFP
   page's text). `-- "<source string>"` resolves one. It needs Node 22.18 or newer (agent shells
   often default older: put one first on `PATH`, e.g. from `~/.nvm/versions/node/`). The workflow
   prompts already tell the grading agents this.
2. Build the epics argument: `node CU/tools/build-args.mjs <IDs...>`.
3. Run `Workflow({ scriptPath: "<repo>/CU/tools/workflow-gap-analysis.js", args })` with these args:
   - `root`: the repo root;
   - `commit`: the full sha;
   - `epics`: the parsed JSON from step 2;
   - `reuseMaps`: `!prototypeCodeChanged`;
   - `runDelta`: `domainModelChanged`;
   - `runReverse`: true if any changed item is now Retired or Future;
   - `runThemes`: true only if you re-grade more than about 40% of in-scope items.
4. Merge the results: `node CU/tools/assemble-gaps.mjs <transcript dir>/journal.jsonl <sha> <today> --merge`.
   The transcript dir is in the Workflow tool's result. Check that `problems` is empty, and note how the
   verdict counts moved. This rewrites `gaps.json`, `GAP-ANALYSIS.md`, `epics/` and `tools/units.json`.

## Stage 2: re-plan (Workflow, Opus)

1. Run `Workflow({ scriptPath: "<repo>/CU/tools/workflow-plan-update.js", args })` with these args:
   - `root`: the repo root;
   - `baseline`: `plan.json` `commit`;
   - `commit`: the full sha;
   - `today`: today's date;
   - `units`: the contents of `CU/tools/units.json`;
   - `oldPhases`: from `plan-state.mjs` (`num`, `title`, `file`, `covers`);
   - `builtPhases`;
   - `changeNotes`.
2. The workflow then:
   - has an architect update the outline and `ROADMAP.md`: answered decisions are built as answered,
     new gaps get placed, and stale items are removed;
   - checks coverage in code;
   - runs a critic, with one revision if the critic asks for it;
   - for each affected phase, has a writer update the phase doc and prompt, then an independent
     reviewer check them.
3. Read its result: coverage must be `ok`. Note the list of updated phases.

## Stage 3: publish and check

1. Run `node CU/tools/apply-plan-update.mjs <transcript dir>/journal.jsonl <sha> [--built 14,15]`. It
   rebuilds `plan.json` exactly from the run, moves the drift-check baseline in the plan docs (built
   phases keep theirs), and regenerates `index.html`. Its output must show no `indexWarnings`.
2. Run `node CU/tools/plan-state.mjs --coverage`. It must pass.
   Then `node CU/tools/recipe-status.mjs --check`. It must pass: every unbuilt phase doc has a
   `## Catalogue screenshots` section naming each story it owns screenshots for, and every kick-off
   prompt runs `npm run capture` (the standing step in `CU/ROADMAP.md`, "Catalogue screenshots").
3. **Final consistency check (one fresh Opus agent).** It fixes problems in place:
   - every relative link in `CU/` resolves;
   - the `ROADMAP.md` table, `plan.json` and the phase doc headers agree;
   - no unbuilt phase still names the old baseline, or builds a default for a decision `ROADMAP.md`
     records as answered;
   - kick-off prompts reference files that exist;
   - every unbuilt phase that touches UI has the frontend-design bullet in its prompt's "While
     working:" list (`CU/ROADMAP.md`, "Front-end design");
   - each updated phase's "Catalogue screenshots" rows match its covered items and say what the
     recipe must show once built (`node CU/tools/recipe-status.mjs <num>` lists them);
   - `node CU/tools/build-index.mjs` is re-run if it changed anything.
4. Update records:
   - add a line to an "Update history" section at the end of `CU/README.md`: date, `old..new` commit,
     items re-graded, phases changed or added (create the section if it is missing);
   - change the "Catalogue snapshot" line in that README;
   - change the baseline commit named in `CLAUDE.md`'s "Current state" paragraph.
5. Report briefly:
   - items re-graded, and how the verdicts moved;
   - phases changed (one line each, with why), and phases added or merged;
   - that `recipe-status.mjs --check` passes, and any phase whose screenshot rows changed;
   - decisions now built as answered;
   - the new session estimate;
   - anything left for the user.
   Remind them to commit.

## Catalogue screenshots in the plan

The screenshots on catalogue stories come from the Requirements Board's capture runner
(`requirements-board/scripts/capture.ts`). It works from one recipe per item
(`requirements-board/capture/recipes/<ID>.json`; the format, routes, seed ids and hooks are in
`requirements-board/capture/ATLAS.md`). `npm run capture` in `requirements-board/` drives the prototype
(5173) and the PWA (5174) and writes `requirements-board/requirements/assets/<ID>/<app>-<name>[-<state>].png`. It links the
images into each item's `images`, rewrites only the images that changed, and writes `capture/REPORT.md`.

The standing rule is "Catalogue screenshots" in `CU/ROADMAP.md` (PROGRESS convention 19). Keep it in
`ROADMAP.md` when the architect rewrites it, including the bullet in "Every phase closes the same way".
Each unbuilt phase must carry it in four places:

1. **A `## Catalogue screenshots` section** in the phase doc, after "Demo guide updates":
   - one table row per item that `node CU/tools/recipe-status.mjs <num>` lists, each ID linked, giving
     its recipe at plan time and what it must be when the phase is done (status; shots and states per
     app, web and mobile both where both have it; what the highlight boxes; caption in the catalogue's
     words);
   - "Recipes this phase breaks": other recipes whose route, seed id, text or selector the phase changes,
     found by grepping the recipes for what it renames or removes;
   - the `ATLAS.md` sections to update.
2. **A Manual test checklist item**: a full `npm run capture` with no failed recipe and no story without
   a recipe, the new shots checked by eye, and `npm run verify:board` green.
3. **A PROGRESS.md updates bullet**: recipes created or changed, and the REPORT.md counts before and
   after.
4. **The kick-off prompt**:
   - `requirements-board/capture/ATLAS.md` and the ROADMAP rule in the read-first list;
   - a "When done:" bullet after the adversarial review that runs the step. In `requirements-board/`, run
     `node scripts/capture.ts --dry`, then a full `npm run capture`, starting root `npm run dev` in the
     background if a server is down;
   - `npm run verify:board` in the green line.

Rules to keep when re-planning:
- An item that moves to another phase takes its row with it. A new story with no recipe gets a "create"
  row, because Phase 14's baseline sweep gives every live story a recipe.
- An item the phase builds only in part stays `partial`, and its reason names the later phase that
  finishes it. Phase 44's final sweep leaves no reason naming a later phase.
- When a phase removes a screen that a Retired or Future item's recipe shoots, that recipe becomes
  `absent`.
- Shot `name`s stay stable when a recipe is re-pointed. Rename a shot only when the old name describes
  retired behaviour; the runner deletes the old generated image, so nothing goes stale.
- Shots hide the harness bar, so recipes stage demo triggers with the runner's `trigger` step
  (Phase 14 adds it), not by clicking the hidden bar. Anything that would appear in every fresh browser
  context, such as a first-run welcome card, needs the runner to preset it (Phase 43a).
- Earlier advice in a phase doc to leave screenshots stale, or for the owner to re-shoot them, is
  replaced by the step.

`node CU/tools/recipe-status.mjs --check` is the mechanical guard: it fails if an unbuilt phase lacks
the section, if the section misses one of its stories, or if the prompt never runs `npm run capture`.
The workflows' writer and reviewer prompts (`tools/workflow-plan-update.js`, `tools/workflow-dev-plan.js`)
already ask for the section, so check that their output does too. If `--check` fails, fix the named
phases yourself (or with one Sonnet agent per few phases) before Stage 3's final consistency check.

## Small updates

If only a few items changed and they touch one or two phases, you can skip the Stage 2 workflow:
1. Re-grade the items as in Stage 1.
2. Update `ROADMAP.md` and those phase docs and prompts yourself, each with one fresh reviewer subagent.
   Keep each phase's "Catalogue screenshots" section in step with its covered items (see "Catalogue
   screenshots in the plan"), then run `node CU/tools/recipe-status.mjs --check`.
3. Update `plan.json` by hand (or with a short node script), not by retyping it.
4. Run `CU/tools/build-index.mjs`, then the Stage 3 checks.
