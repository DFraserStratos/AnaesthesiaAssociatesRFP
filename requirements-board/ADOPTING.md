# Adopting the Requirements Board in another repo

A checklist for an agent (or a person) setting the board up in a new repo. Work through it in
order and finish with the checks at the end. The board's code is generic. Everything that belongs to
one project lives in its `requirements/` folder, and in the "This repo" block of each skill.

Below, `BOARD` is where the board's folder lands in the new repo, `requirements-board/` unless
there is a reason to choose another name.

**The usual route is the kit.** Whoever shares the board exports it from the repo that has the full
board (its export script lives only there), as a `requirements-board/` folder that has steps 1 to 3
done already: the code as committed, without generated folders, a starter catalogue and
`board.config.json`, starter "This repo" sections (fill-ins marked `<TODO: ...>`), and
`START-HERE.html`. With a kit, open `START-HERE.html` and follow it: put the folder at the repo
root and paste its prompt into Claude Code, which does step 5, adds the CLAUDE.md section and fills
in step 4 with you. Then run the checks in step 7. The steps below are the
whole account, for copying the board by hand.

**Upgrading** a board already in use: get a fresh kit; save a copy of each skill's filled-in "This
repo" section; replace everything in `BOARD/` except `requirements/` (and `node_modules/`) with the
kit's files, so files the new version dropped go too; paste the saved "This repo" sections back over
the kit's starter ones; then run `npm --prefix BOARD install`, `install-skills` and the checks in step
7. An export never writes over a board in use: it refuses any folder that holds one.

## 1. Copy the kit

Copy the board's folder into the new repo as `BOARD/`, leaving out what is generated or local:
`node_modules/`, `dist/`, `.history/`, `.links/`, `.pdf-facts/`, `test-results/`,
`playwright-report/` and `shots/`. Then `npm --prefix BOARD install`. The scripts need Node 22.18 or newer, for its built-in
TypeScript support.

## 2. Empty `requirements/` down to a skeleton

`BOARD/requirements/` is the old project's data. Keep only:

- `SCHEMA.md` (the file format). Its examples are the old project's; reword them later if they mislead;
- `notes/README.md` and `changes/README.md` (folder conventions; drop any table of the old project's
  notes or artifacts);
- `README.md`, after rewriting its **This project** section and its conventions to the new
  project. Drop the old project's status meanings, owners and component list.

Delete everything else: `stories/`, `questions/`, `notes/` and `changes/` entries, `artifacts/`
and `artifacts/files/`, `assets/`, `capture/`, `domain-model.md`, `reference/`,
`board-layout.json`, `board.config.json` and `exports/`. Start `domain-model.md` afresh when there
is a model to describe.

## 3. Write `requirements/board.config.json`

The project's vocabulary. The format is in `SCHEMA.md` ("Board config file") and the board's
README ("Project config"). Ask the user for anything you can't infer:

- `project.name`: beside "Requirements board" in the masthead and the browser tab. `project.accent` (optional, `#rrggbb`, or pick one on the Settings page) fills the board's mark and the tab icon.
  The Settings page edits these, `components`, the status lists and the writing voice.
- `components`: the system's areas, each with a three-letter `code`. Leave the list empty to accept
  any component until the areas are settled.
- `statuses` and `questionStatuses`: ordered lists of `{ code, label, help, tone, role?, settle? }`
  (format in `SCHEMA.md`). Keep the defaults (items 1 Proposed, 2 Open, 3 Verify, 4 Confirmed, 5 Retired;
  questions 1 Open, 2 Confirm, 3 Proposed, 4 Answered) or define the project's own, with help text that names
  who signs requirements off, e.g. `{ "code": 1, "label": "Proposed", "help": "Needs sign-off from <client>", "tone": "neutral", "role": "default" }`.
  Codes are whole numbers from 1, unique per list. A number means only what this config says: files store
  `status: 4`, so agents must look it up here (or on the Settings page) and never infer it. Behaviour
  comes from roles and `settle`, never from a code.
  The lists can also be edited later on the board's Settings page; a removed status is kept under
  `removedStatuses` so its number is never handed out again. To renumber a status in an
  existing catalogue, stop the board and run `npm --prefix requirements-board run statuses:recode -- --items old=new,...
  --questions old=new,...` (add `--dry-run` first): it rewrites only the `status:` lines, the board's
  history and the codes in `board.config.json`, and records the run in `requirements/status-recodes.json` so diffs read a pure relabel as no change.
  Renumber to fresh codes (past every code used so far), mapping every status the files hold: a recode
  refuses to reuse a number, to swap two in place, or to leave a live status out, so no status is merged
  by accident (to merge on purpose, name the one kept too: `3=4,4=4`). An older catalogue whose
  `status-recodes.json` already overlaps (a later recode targets a code an earlier one moved away) is
  reported by the check.
- `questionKinds["missing-source"].help`: the kinds of source this project cites.
- `screenshotApps` and `capture`: only if the project has an app to screenshot (step 6).
- `voice.descriptionWarnings` (optional, edited by hand): patterns the check warns on in a live
  item's description, for provenance and decision history that belong in Notes (decision numbers,
  "our reading", a person's dated remark). Start empty and add a rule when a habit keeps recurring;
  format in `SCHEMA.md`.

## 4. Rewrite the skills' "This repo" blocks

Each skill in `BOARD/agent/skills/` keeps its repo-specific facts in one block near the top. Rewrite
each block, and change nothing else unless it is plainly wrong:

- `update-requirements`: the board folder and `REQ` path, the check command, who signs off, any
  folders that are out of bounds (other apps, build plans), any follow-on skill that reads the change
  logs (or "none"), and the shape precedent for notes (the first note written sets it).
- `add-artifact`: the board folder, the check command, the dev server's URL
  (`http://localhost:5180` unless `BOARD_PORT` moves it; a worktree's `.lane.env` sets it).
- `svg-diagram`: the board folder, the check command and the dev server's URL (the same). Its reference diagrams and `examples/` are
  another project's. Keep them as style references until this project has its own diagrams.
- `transcript-reconciler`: the default output path.
- `update-build-plan`: the plan folder (created on the first run when there is none), the app's
  folder, any progress file, whether screenshots are captured, and the Node note. Everything else
  project-specific (the app's description and rules for its agents, out-of-scope lanes, the plan
  page's words) goes in the plan folder's `plan.config.json`, which the first run writes; its keys are
  in the skill's "The tools and the plan's config" (with, for a plan built in parallel lanes, the
  `lanes` key naming the lane branches). Its tools are in the skill's `tools/` folder.
- `run-build-phase` (optional: it builds one phase of the plan per session, from a short kick-off
  prompt): the plan folder, the file holding the project's coding rules and the standing rules every
  phase follows, the app's folder, its house rules in brief, the design references and viewports
  (or "none"), whether screenshots are captured, the demo or user guide a phase patches (or "none"),
  the progress file and the exact shape of its status rows and entries (the tools parse them) and its
  decisions and handoff headings, the app's persisted-state version (or "none"), the source rule that
  wins over a simplified mockup (or "none"), the plan page and where the run order lives, and the
  plan's tracks. Then give the plan's
  `plan.config.json` a `runner` key:
  - `skill`: `"run-build-phase"`. With it set, `update-build-plan` writes slim kick-off prompts that
    load this skill and keeps everything else in the phase docs; leave it out and prompts carry the
    whole procedure, as before.
  - `checks`: the project's green commands as named checks (`name`, `cwd`, `cmd`, and where they
    apply `needs`, `after`, `changed` for the quick inner loop, `focus`, `timeout`), with
    `maxParallel` and a `concurrency` note on why they may run side by side.
  - `devServers` (each `name`, `port`, `url`, `cwd`, `cmd`) and `devCommand`, with `startTimeout`;
    and, with screenshot capture, `capture` (`cwd`, `cmd`, `onlyFlag`, `dryFlag`, `report`).
  - `context` (optional): the context pack's budget and the progress-file and `ROADMAP.md` sections
    it quotes, and the project's own words that make a number not a phase (`countNouns`,
    `notPhaseBefore`) and its progress-file headings (`decisionsSection`, `handoffSection`). `logDir` (default `.build-phase`) holds the session's working files and git-ignores
    itself.

  `node BOARD/agent/skills/run-build-phase/tools/phase-check.mjs --help` gives the full shape, and
  `--list` prints the schedule it would run without running anything.
- `consistency-review`: the board folder, `REQ` path and check commands, the run folder (persistent,
  outside `/tmp`), the people and the source ranking, the follow-on skill, and the JSON arguments for
  its two workflows (owner, levels, fixed rulings, project rules, protected artifacts, topic groups).

The `link-requirements` workflow takes the board folder as its `board` argument (default
`requirements-board`), and the `consistency-rulings` and `consistency-changes` workflows take `req`
(default `requirements-board/requirements`), so none of them needs an edit.

## 5. Wire it into the repo

From the repo root:

```
npm --prefix BOARD run install-skills
```

It copies the skills and workflows into `.claude/`, merging with any skills the repo already has
(it never touches a skill folder that is not the board's; `.claude/requirements-board.json` lists
what it installed), and is safe to run again: run it after editing a skill in `BOARD/agent/`.
Afterwards `.claude/` holds exactly the board's current skills: one the board no longer has is
removed, and junk (`.DS_Store`, `__pycache__`) is never installed.
Copies work on any OS, zip or cloud drive. In a repo where the skills are edited often on a Mac or
Linux, `-- --link` makes symlinks instead: a real folder per skill holding a symlink per top-level
entry, file or folder (a symlinked skill folder still loads, but is left out of the `/` menu). A
later run with no flag keeps the mode in use; `-- --copy` switches back.

Add root `package.json` scripts that call the board, for example:

```json
"dev:board": "npm --prefix BOARD run dev",
"check": "npm --prefix BOARD run check",
"verify:board": "npm --prefix BOARD run verify",
"export:csv": "npm --prefix BOARD run export:csv"
```

If the repo has a `CLAUDE.md`, add a short section on where requirements live (`BOARD/requirements/`),
that agents edit them as files or through the board, and that `npm run check` must pass.

## 6. Screenshot capture (optional)

Set this up only if the project has a web app whose screens should illustrate its stories.

1. In `board.config.json`, list the apps in `screenshotApps` (a stable lower-case `key`, a `label`,
   and a `viewport` of `desktop` or `mobile`). Add a `capture` section that gives each app its dev
   server `url`, a `setupRoute`, and `hideCss` for any demo-only chrome. Add `locale`, `timezone`
   and a `startHint` that says how to start the servers.
2. Write recipes in `requirements/capture/recipes/<ID>.json`. The board's README ("Capturing
   screenshots") gives the format and the built-in steps.
3. Steps that drive app-specific controls (seeding a scenario, opening a demo menu) go in
   `requirements/capture/steps.ts`. Name it in `capture.steps`; `StepContext` in
   `BOARD/scripts/capture.ts` is its interface.
4. Start the app, then run `npm --prefix BOARD run capture -- --only <ID> --dry`, then a real run.

## 7. Check

- `npm --prefix BOARD run verify` (typecheck, unit tests and the catalogue check) passes. On an
  empty catalogue, the tests that read the live catalogue are skipped.
- `npm --prefix BOARD run test:e2e` passes. It runs on a fixture catalogue, on `BOARD_PORT` + 2
  (5182). `BOARD_E2E_REAL=1` adds the specs that read the project's own catalogue, on `BOARD_PORT` + 3
  (5183): `e2e/artifact-regions.spec.ts` opens every named region and heading of every artifact. A
  project may add its own content checks beside it (a spec listed in the `real` project of
  `playwright.config.ts`). `BOARD_E2E_PORT` and `BOARD_E2E_REAL_PORT` move the two boards.
- `npm --prefix BOARD run dev` opens the board on http://localhost:5180 (or `BOARD_PORT`) with the
  project's name in the masthead. Create one epic to prove that saving works.
- Search the copy for the old project's name, outside `requirements/` and the svg-diagram examples.
  Nothing should turn up (a kit export checks this itself, against the exporting repo's deny list).
