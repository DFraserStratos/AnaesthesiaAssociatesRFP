---
name: app-change
description: Make a change to the AA prototype (aa-prototype/) outside a build-plan phase - a fix, UI/UX polish, a small feature or demo prep - fast, so the owner can see it and iterate - read only what the change needs, build on the shared components and the design files, run the quick checks, commit, and say where to look. Screenshots, capture recipes and the demo guide are left to the owner's sweep. Use for any edit to the app that is not a plan phase.
---

# App change

Speed matters most: the owner watches the change live and iterates. No progress log, no plan page,
no screenshots, recipes or demo guide (the owner's `/sweep` catches those up later, in one go).

Paths: `APP` = `aa-prototype/`, `T` = `requirements-board/agent/skills/run-build-phase/tools/`.

## 1. Orient (only what the change needs)

- Read the code for the screens involved, not the whole app. `APP/README.md` has the `src/` map.
- Check `docs/DECISIONS.md` for the area: don't "fix" a settled ruling.
- New or reshaped UI: load the `frontend-design` skill, look at the `docs/design/` page for the screen,
  and use the shared components (CLAUDE.md "One component per job"; `src/shared/ui/README.md`).
  Extend a shared component with a variant rather than copying it.
- A pick from `docs/BACKLOG.md`: read that line; if it needs an owner decision, ask first.

## 2. Build

- Work in the main checkout on `master`. No worktree or branch unless the owner asks.
- Keep to CLAUDE.md's rules (mock backend, `mutate()`, determinism, tokens, formatting helpers, no
  dashes in copy, `PERSIST_VERSION` on seed changes).
- The owner sees it through the running dev servers (5173 web/admin, 5174 PWA, hot reload). If none is
  running, start `npm run dev` at the root in the background.
- For a layout change, take one Playwright screenshot of the changed screen at the size it ships
  (390x844 mobile/PWA, 1440x900 web/admin) into the scratchpad and compare it with the design page.
  Skip this for copy and small tweaks.

## 3. Quick checks only

From the repo root: `node T/phase-check.mjs --changed` (typecheck, the Vitest tests related to
uncommitted changes, catalogue check), and `npm run lint` in `APP/`. Add or update colocated tests
for changed behaviour (domain, billing, store). No full gate, no Playwright suite, no capture: the
full gate runs at a sweep, before a branch merge, or when the owner asks. If another chat is working
in the same checkout and a failure is in its files, leave it and mention it.

Keep green what reads the app's copy: `src/appCopy.test.ts`, `oneComponentPerJob.test.ts`, and
`demoGuideSync.test.ts` (a new or renamed demo trigger fixes only the guide line that test names). A
shared component added, renamed or removed updates its row in `/demo/catalogue/*`.

## 4. Commit and hand over

1. Commit by path straight away (only your files; short sentence-case message; never push). The owner
   iterates with follow-up commits; nothing waits for approval.
2. Delete the `docs/BACKLOG.md` line of an item this finished; add a line for anything knowingly left.
3. Tell the owner in two to four lines: what changed and where to look (URL, persona or scenario).
