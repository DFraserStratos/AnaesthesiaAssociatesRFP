---
name: app-change
description: Make a change to the AA prototype (aa-prototype/) outside a build-plan phase - a fix, UI/UX polish, a small feature or demo prep - and finish it properly - build on the shared components and the design files, finish green, then bring the catalogue screenshot recipes and the demo guide in step for exactly what changed, hand over for the owner to test, and capture and commit once they approve. Use for any edit to the app that is not a plan phase (phases use run-build-phase, which does the same close-out). Also use when the owner says a change "looks good" and the pending screenshots should be captured.
---

# App change

The routine way to change the prototype. Lean: no progress log, no plan page. What it never skips is
the close-out, because a version of the demo guide and the catalogue screenshots goes to Anaesthesia
Associates for testing and approvals: they must always match the app.

Paths: `APP` = `aa-prototype/`, `REQ` = `requirements-board/requirements/`, `T` =
`requirements-board/agent/skills/run-build-phase/tools/`.

## 1. Orient (only what the change needs)

- Read the code for the screens involved, not the whole app. `APP/README.md` has the `src/` map.
- Check `docs/DECISIONS.md` for the area: don't "fix" a settled ruling.
- If it changes UI: load the `frontend-design` skill, open the `docs/design/` page for the screen
  (and `Design Language.dc.html` for tokens), and use the shared components (CLAUDE.md "One component
  per job"; `src/shared/ui/README.md`). Extend a shared component with a variant rather than copying it.
- If it is a pick from `docs/BACKLOG.md`, read that line; if it needs an owner decision, ask first.

## 2. Build and look at it

- Make the change. Keep to CLAUDE.md's rules (mock backend, `mutate()`, determinism, tokens,
  formatting helpers, no dashes in copy, `PERSIST_VERSION` on seed changes).
- Look at what you built: with the dev server up (`npm run dev` at the root, or reuse one on 5173 and
  5174), take Playwright screenshots of each changed screen at the size it ships (phone 390x844 for
  mobile and the PWA, 1440x900 for web and admin) and compare them with the design page. Fix what
  doesn't match before moving on. These self-check shots go in the scratchpad, never in the repo.

## 3. Check (two tiers)

- **Per change, quick:** from the repo root `node T/phase-check.mjs --changed` (typecheck, the Vitest
  tests related to uncommitted changes, catalogue check), plus `npm run lint` in `APP/`. That is enough
  to hand over and to commit on a branch.
- **Before it lands on `master`, full, once per batch:** `node T/phase-check.mjs` (both builds, all of
  Vitest, verify-board, all Playwright) plus lint. Run it when merging a branch, or, for small changes
  made directly on `master`, once at the end of the batch before its last commit. Don't run it after
  every small change. Add or update
colocated tests for changed behaviour. Run the Playwright specs in `APP/visual/` that cover the changed
screens (`npx playwright test visual/<spec>`); update their expectations only for intended changes.
Board work: `npm run verify:board` at the root.

## 4. Bring the screenshots and demo guide in step

1. **Find what the change touches:** `npm --prefix aa-prototype run affected` (working tree vs HEAD;
   `-- --base <ref>` for a branch). It lists the capture recipes whose screens or selectors the change
   reaches and the S1 to S5 demo beats whose screens it touches. "Broad change" (shared component,
   tokens, seed) means many shots move: plan a full capture at step 6 instead of a list.
2. **Recipes** (`REQ/capture/recipes/<ID>.json`; format, routes, seed ids and hooks in
   `REQ/capture/ATLAS.md`): for each affected recipe, fix selectors the change broke, rewrite captions
   in current words (no en or em dashes), and add a shot or state for anything new worth showing on that
   story. A new screen or element worth showing gets a `data-shot` hook (shared components take `shot`)
   and, if it is a new pattern, a line in ATLAS. A story the change newly covers gets a recipe
   (`node requirements-board/agent/skills/update-build-plan/tools/recipe-status.mjs` helps find stories
   with none). Edit files only: **never run the capture, even `--dry`, before the owner approves.**
3. **Demo guide** (`docs/demo-guide/`): re-read every passage about the changed screens, not only the
   affected beats: the run sheet `03-demo-script.md`, the workflows and cheat sheet, and
   `master-demo-guide.html` (large: grep it, never read it whole; it is maintained by hand, so patch it
   to match the Markdown). Update wording, clicks, labels and every figure, reading figures from the
   running app, never from memory. Plain words, no dashes in quoted UI text. If the change adds or
   renames a demo trigger or a scenario link, `src/shared/demoTriggers/demoGuideSync.test.ts` must stay
   green.
4. **Component catalogue**: a shared component added, renamed or removed changes its row in
   `/demo/catalogue/*` (`src/apps/demo/catalogue/`).

## 5. Hand over and stop

Tell the owner, briefly: what changed, the URLs to try it (and which persona or scenario jump), the
recipe IDs waiting for capture, and the demo-guide sections you changed. Then wait. Don't commit
before they've tested unless they asked you to.

## 6. When the owner approves

1. Capture the affected recipes: `node T/phase-check.mjs --capture <IDs>` from the repo root (it starts
   the dev servers if needed, dry-runs those recipes, then captures them; `--capture all` for a broad
   change). If a recipe fails, fix it and re-run only the failed IDs. Then
   `node T/phase-check.mjs --stop-servers`.
2. Open each new image and check it shows the change, with a true caption and the right highlight.
3. `npm run verify:board` at the root.
4. Commit by path: the code, the tests, the recipes and ATLAS, the new images and item `images` lines
   the capture wrote, `REQ/capture/REPORT.md`, and the demo guide. Short sentence-case message. Never
   push; tell the owner what was committed.
5. Anything knowingly left unfinished gets a line in `docs/BACKLOG.md`; delete the line of any backlog
   item this change finished.
