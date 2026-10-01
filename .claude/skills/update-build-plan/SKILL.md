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
- Do not commit or push.

## Stage 0: scope (yourself)

1. Resolve the target: take the sha from the argument (strip a GitHub link down to the sha) or use
   HEAD. Get the full sha with `git rev-parse`, running `git fetch` first if needed. If the working tree
   has uncommitted catalogue changes, say so and ask whether they should be committed first: the plan
   should match a real commit.
2. Run `node CU/tools/plan-state.mjs --to <sha>`. It gives the baseline, changed items (with current
   status), changed questions, notes added, `domainModelChanged`, `prototypeCodeChanged`, `builtPhases` and
   the current coverage. If the baseline equals the target, or nothing in the catalogue changed, stop and
   say so.
3. Read the change logs added in that range (`git diff --name-only <baseline> <sha> --
   "docs/discovery-reference/Updated Requirements/changes"`) and skim the diff. Write a `changeNotes`
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
3. **Final consistency check (one fresh Opus agent).** It fixes problems in place:
   - every relative link in `CU/` resolves;
   - the `ROADMAP.md` table, `plan.json` and the phase doc headers agree;
   - no unbuilt phase still names the old baseline, or builds a default for a decision `ROADMAP.md`
     records as answered;
   - kick-off prompts reference files that exist;
   - `node CU/tools/build-index.mjs` is re-run if it changed anything.
4. Update records:
   - add a line to an "Update history" section at the end of `CU/README.md`: date, `old..new` commit,
     items re-graded, phases changed or added (create the section if it is missing);
   - change the "Catalogue snapshot" line in that README;
   - change the baseline commit named in `CLAUDE.md`'s "Current state" paragraph.
5. Report briefly:
   - items re-graded, and how the verdicts moved;
   - phases changed (one line each, with why), and phases added or merged;
   - decisions now built as answered;
   - the new session estimate;
   - anything left for the user.
   Remind them to commit.

## Small updates

If only a few items changed and they touch one or two phases, you can skip the Stage 2 workflow:
1. Re-grade the items as in Stage 1.
2. Update `ROADMAP.md` and those phase docs and prompts yourself, each with one fresh reviewer subagent.
3. Update `plan.json` by hand (or with a short node script), not by retyping it.
4. Run `CU/tools/build-index.mjs`, then the Stage 3 checks.
