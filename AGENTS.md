# Repository Guidelines

## Project Structure & Module Organization

The app lives in `aa-prototype/`; run npm commands there. Under `src/`, `domain/` contains pure
business rules, `store/` owns the Zustand-backed mock backend,
`apps/` contains the mobile, web, admin, and demo surfaces, and `shared/`, `shell/`, and `theme/`
hold reusable UI, routing, and design tokens. Tests are colocated as `*.test.ts(x)`; Playwright
specs live in `visual/`. Requirements, decisions, demo scripts, and mockups live under `docs/`.

Before changing anything, read `docs/prototype-build/PROGRESS.md` (including its open-items handoff) and
`docs/prototype-build/prototype-review/00-SUMMARY.md`. Update `PROGRESS.md` after substantive work,
and mirror changes to scripted demo behavior in `docs/demo-guide/`. Check the decisions log before
revisiting a defect.

## Build, Test, and Development Commands

From `aa-prototype/`:

- `npm install` installs dependencies (Node 20 required).
- `npm run dev` starts Vite at `http://localhost:5173`.
- `npm run build` runs strict TypeScript checks and creates the production bundle.
- `npm run test` runs the Vitest suite once.
- `npm run lint` checks source with oxlint.
- `npm run shots` runs Playwright specs and writes visual artifacts.
- `npm run preview` serves the built bundle locally.

## Coding Style & Naming Conventions

Use TypeScript with two-space indentation, single quotes, and no semicolons, matching existing
files. Name React components and their files in `PascalCase`; use `camelCase` for functions,
hooks, selectors, and store actions. Keep domain calculations pure and UI formatting in
`src/shared/format.ts`.

All domain writes must pass through `src/store/mutate.ts` and lifecycle guards. Do not add real
APIs or `fetch`; integrations are simulations. Preserve determinism: use the demo clock and seeded
RNG instead of `Date.now()`, `new Date()`, or `Math.random()`. Bump `PERSIST_VERSION` when seed
shape or content changes. Follow `docs/design/` and existing theme tokens; app-facing copy must not
contain en or em dashes.

## Testing Guidelines

Add focused, colocated `*.test.ts` or `*.test.tsx` coverage for changed behavior, especially domain,
billing, lifecycle, and store invariants. No numeric coverage threshold is configured. Treat
Playwright as a visual review aid, not the primary correctness gate. Before handoff, run
`npm run build`, `npm run test`, and `npm run lint`.

## Commit & Pull Request Guidelines

History uses short, sentence-case summaries such as `Naming fixes` or `Capture card heights and
removable attachments`; keep commits focused and descriptive. Pull requests should explain the
user-visible effect, cite relevant RFP or decision-log entries, list verification commands, and
include screenshots for UI changes. Do not commit, push, merge, tag, or open PRs on the user's
behalf; leave changes for user review.
