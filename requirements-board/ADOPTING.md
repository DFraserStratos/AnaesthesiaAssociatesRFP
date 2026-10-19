# Adopting the Requirements Board in another repo

A checklist for an agent (or a person) setting the board up in a new repo. Work through it in
order and finish with the checks at the end. The board's code is generic. Everything that belongs to
one project lives in its `requirements/` folder, and in the "This repo" block of each skill.

Below, `BOARD` is where the board's folder lands in the new repo, `requirements-board/` unless
there is a reason to choose another name.

## 1. Copy the kit

Copy the board's folder into the new repo as `BOARD/`, leaving out what is generated or local:
`node_modules/`, `dist/`, `.history/`, `.links/`, `test-results/`, `playwright-report/` and
`shots/`. Then `npm --prefix BOARD install`. The scripts need Node 22.18 or newer, for its built-in
TypeScript support.

## 2. Empty `requirements/` down to a skeleton

`BOARD/requirements/` is the old project's data. Keep only:

- `SCHEMA.md` (the file format). Its examples are the old project's; reword them later if they mislead;
- `notes/README.md` and `changes/README.md` (folder conventions);
- `README.md`, after rewriting its **This project** section and its conventions to the new
  project. Drop the old project's status meanings, owners and component list.

Delete everything else: `stories/`, `questions/`, `notes/` and `changes/` entries, `artifacts/`
and `artifacts/files/`, `assets/`, `capture/`, `domain-model.md`, `reference/`,
`board-layout.json`, `board.config.json` and `exports/`. Start `domain-model.md` afresh when there
is a model to describe.

## 3. Write `requirements/board.config.json`

The project's vocabulary. The format is in `SCHEMA.md` ("Board config file") and the board's
README ("Project config"). Ask the user for anything you can't infer:

- `project.name`: shown beside the board's name and in the browser tab. `project.locale` is optional.
- `components`: the system's areas, each with a three-letter `code`. Leave the list empty to accept
  any component until the areas are settled.
- `statuses`: help text that names who signs requirements off, e.g.
  `{ "Proposed": { "help": "Needs sign-off from <client>" }, "Verify": { "help": "Question answered, the whole item still to check with <client>" }, "Confirmed": { "help": "Agreed with <client>" } }`.
- `questionKinds["missing-source"].help`: the kinds of source this project cites.
- `screenshotApps` and `capture`: only if the project has an app to screenshot (step 6).

## 4. Rewrite the skills' "This repo" blocks

Each skill in `BOARD/agent/skills/` keeps its repo-specific facts in one block near the top. Rewrite
each block, and change nothing else unless it is plainly wrong:

- `update-requirements`: the board folder and `REQ` path, the check command, who signs off, any
  folders that are out of bounds (other apps, build plans), any follow-on skill that reads the change
  logs (or "none"), and the shape precedent for notes (the first note written sets it).
- `add-artifact`: the board folder, the check command, the dev server's URL.
- `svg-diagram`: the board folder and the check command. Its reference diagrams and `examples/` are
  another project's. Keep them as style references until this project has its own diagrams.
- `transcript-reconciler`: the default output path.

The `link-requirements` workflow takes the board folder as its `board` argument (default
`requirements-board`), so it needs no edit.

## 5. Wire it into the repo

From the repo root:

```
mkdir -p .claude/skills .claude/workflows
for s in update-requirements add-artifact svg-diagram transcript-reconciler; do
  mkdir .claude/skills/$s
  for f in BOARD/agent/skills/$s/*; do ln -s ../../../$f .claude/skills/$s/$(basename $f); done
done
ln -s ../../BOARD/agent/workflows/link-requirements.js .claude/workflows/link-requirements.js
```

Each skill gets a real folder in `.claude/skills/` holding a symlink per file. Don't symlink the skill
folder itself: Claude Code still loads it, but leaves it out of the `/` menu.

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
- `npm --prefix BOARD run test:e2e` passes. It runs on a fixture catalogue. `BOARD_E2E_REAL=1` adds
  the specs that read the project's own catalogue; `e2e/artifacts-real.spec.ts` names the old
  project's artifacts, so rewrite or delete its second test.
- `npm --prefix BOARD run dev` opens the board on http://localhost:5180 with the project's name in
  the masthead. Create one epic to prove that saving works.
- Search the copy for the old project's name, outside `requirements/` and the svg-diagram examples.
  Nothing should turn up.
