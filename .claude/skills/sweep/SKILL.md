---
name: sweep
description: The owner-triggered sweep that brings the catalogue screenshots and the demo guide back in step with the AA prototype - everything committed since the last sweep (docs/SWEEP.md) - updating the capture recipes, ATLAS and the demo guide, running the full gate and the capture in a worktree so app work carries on, then committing and merging. Only the owner starts it (/sweep).
disable-model-invocation: true
---

# Sweep

Routine changes and plan phases don't touch screenshots, recipes or the demo guide, so the app can
change fast. This sweep catches them all up in one go, when the owner asks, before a version of the
guide and screenshots goes to Anaesthesia Associates.

Paths: `APP` = `aa-prototype/`, `REQ` = `requirements-board/requirements/`, `T` =
`requirements-board/agent/skills/run-build-phase/tools/`. `W` = the sweep worktree.

## 1. Set up (the owner keeps working in the main checkout)

1. Base: the commit on the last row of `docs/SWEEP.md`. `git log --oneline <base>..master` is the
   work to sweep. The sweep covers committed work only; tell the owner if the main checkout has
   uncommitted app changes, which wait for the next sweep.
2. `git worktree add ../AnaesthesiaAssociatesRFP-sweep -b sweep/<YYYY-MM-DD> master`, then
   `npm run setup` in `W`. Everything below runs in `W` with `AA_PROTO_PORT=5773 AA_PWA_PORT=5774
   BOARD_PORT=5780`, so it never collides with the owner's dev servers or with live edits (a capture
   against a checkout that is being edited goes wrong).

## 2. Find what moved

`npm --prefix aa-prototype run affected -- --base <base> --head HEAD` lists the recipes whose screens
or selectors changed and the S1 to S5 demo beats touched. A "broad" result (shared component, tokens,
seed, store) means capture all. Also read the commit messages and any "For the sweep" notes in phase
docs since the base: new screens or features may need new shots or guide beats that the tool can't
see. `node requirements-board/agent/skills/update-build-plan/tools/recipe-status.mjs` finds stories
with no recipe.

## 3. Update recipes and the guide (two subagents in parallel, both in `W`)

- **Recipes** (`REQ/capture/recipes/<ID>.json`, format in `REQ/capture/ATLAS.md`): fix selectors the
  changes broke (prefer `data-shot` hooks), rewrite captions in current words (no en or em dashes),
  add shots or recipes for new things worth showing, keep ATLAS current. Edit only; no capture yet.
- **Demo guide** (`docs/demo-guide/`): every passage about a changed screen, not only the affected
  beats: `03-demo-script.md`, `02-workflows-and-handoffs.md`, `04-presenter-cheat-sheet.md`,
  `01-personas-and-responsibilities.md`, `README.md`, then the same sections of
  `master-demo-guide.html` (hand-maintained and large: grep it, never read it whole). Figures are read
  from the running app in `W`, never from memory.

## 4. Gate and capture

1. Full gate in `W`: `node T/phase-check.mjs` plus `npm run lint` in `APP/`. Fix what's small; put
   anything bigger in `docs/BACKLOG.md` and tell the owner.
2. Capture in the background: `node T/phase-check.mjs --capture <IDs>` (or `--capture all` for a
   broad sweep; about 25 to 35 minutes). Fix and re-run only failed IDs. Recipes already known to
   fail are listed in `docs/BACKLOG.md`. Then `node T/phase-check.mjs --stop-servers`.
3. Open every changed image for a targeted sweep, or a sample across all three apps for a full one: the shot shows the screen, the highlight lands, the caption is true. A couple of images that
   differ only by anti-aliasing noise are normal.
4. `npm run verify:board`.

## 5. Land it

1. Add a row to `docs/SWEEP.md`: date, the master commit swept to, what was captured (targeted IDs
   count or "all"), failures.
2. Commit by path in `W`: recipes, ATLAS, images and the item `images` lines the runner wrote,
   `REQ/capture/REPORT.md`, the demo guide, `docs/SWEEP.md`, and any fixes.
3. In the main checkout: `git merge sweep/<date>`. If it conflicts with the owner's uncommitted
   files, stop and tell them. Then `git worktree remove ../AnaesthesiaAssociatesRFP-sweep` and
   delete the branch. Never push.
4. Report in a few lines: commits swept, recipes captured and failed, guide sections changed.
