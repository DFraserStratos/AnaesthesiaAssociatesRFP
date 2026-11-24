# Repository Guidelines

**`CLAUDE.md` is the full guide for this repo; read it first.** It wins wherever this file differs.
This file is the short version for agents that don't load `CLAUDE.md` automatically.

## Communication

When reporting information to me, be extremely concise and sacrifice grammar for the sake of
concision.

## What this is

`aa-prototype/` is a finished demo prototype of the Anaesthesia Associates Booking & Billing system:
three React apps (Anaesthetist Mobile, Anaesthetist Web, Admin) over a fake in-browser backend, plus
demo simulators. It matches the requirements catalogue in `requirements-board/requirements/` (format
in its `SCHEMA.md`; read its `VOICE.md` before writing requirement text). `requirements-board/` is a
separate local dev tool and portable skills kit over that catalogue.

## How to work

- Routine changes (fixes, UI/UX polish, small features): speed first. Change the app in the main
  checkout on `master`, run the quick checks, commit by path, say where to look. No progress log, no
  worktrees. Check `docs/DECISIONS.md` before "fixing" something that looks wrong; open work is in
  `docs/BACKLOG.md` (delete a line when you finish it).
- Don't edit the capture recipes (`requirements-board/requirements/capture/`) or the demo guide
  (`docs/demo-guide/`), and never run the capture, even `--dry`: the owner catches both up with
  `/sweep` (`docs/SWEEP.md`). Keep `demoGuideSync.test.ts` green.
- Requirement changes become build-plan phases in `docs/build-plan/` (skills `update-requirements`,
  `update-build-plan`, `run-build-phase`). `docs/archive/` is the finished build's record: read it only
  for history.

## Code rules (details in CLAUDE.md)

- Mock backend only: no `fetch`; components use typed store hooks; every write goes through
  `src/store/mutate.ts` and the lifecycle guards. Simulated events are demo triggers on their screen.
- Determinism: demo clock and seeded RNG, never `Date.now()`, `new Date()` or `Math.random()`. Bump
  `PERSIST_VERSION` (`src/store/appStore.ts`) when the seed's shape or content changes.
- Billing maths is pure, in `src/domain/billing/`, with Vitest tests.
- Follow `docs/design/` and the tokens in `src/theme/`: crimson `#A91E3E` is identity only, teal
  `#0D6E63` the only action colour. Use the shared components in `src/shared/{ui,surface,table,calendar}`;
  extend them, never copy them.
- No en or em dashes in app-facing copy. Formatting through `src/shared/format.ts` helpers.
- TypeScript, two-space indent, single quotes, no semicolons; components in `PascalCase` files.
- Colocated `*.test.ts(x)` for changed behaviour; Playwright specs in `aa-prototype/visual/`.

## Commands

From `aa-prototype/`: `npm run dev` (5173), `npm run dev:pwa` (5174), `npm run build`,
`npm run build:pwa`, `npx vitest run`, `npm run lint`, `npm run shots` (Playwright),
`npm run affected`. From the root: `npm run setup`, `npm run dev` (prototype, PWA and board),
`npm run check` (catalogue), `npm run verify:board` (board work).

**Checks, two tiers** (tools in `requirements-board/agent/skills/run-build-phase/tools/`): per change,
`phase-check.mjs --changed` plus `npm run lint`, nothing more; the full `phase-check.mjs` plus lint
only in a sweep, before a branch merge, at the end of a plan phase, or when the owner asks. Board work
also `npm run verify:board`.

## Git

Agents may commit and merge (and create local branches) when work is green; never push or write to a
remote. Stage by path, commit only your own changes, never rewrite pushed history. Short sentence-case
commit messages.
