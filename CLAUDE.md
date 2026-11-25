# CLAUDE.md

Project guidance for Claude Code and other coding agents working in this repo.

## Project

A demo **prototype** of the Booking & Billing system for Anaesthesia Associates (AA), a Christchurch,
NZ company that handles booking and billing for ~85 independent anaesthetists. It is a fully
interactive React front end over a fake in-browser backend (no servers, APIs or real data), used in
live vendor workshops. It is **not** production software.

Three apps sit behind one app switcher (**Anaesthetist Mobile App**, **Anaesthetist Web App**,
**Admin Web App**), plus demo-only simulators (Xero, HL7/FHIR integrations, a demo control panel).

## How to work here

**The app matches the requirements catalogue.** The original build (July 2026) and the requirements
catch-up (phases 14 to 44, finished November 2026) are complete. The code is the truth about what the
app does; the catalogue is the truth about what it should do.

- **Routine work (fixes, UI/UX polish, small features, demo prep):** use the `app-change` skill (a
  project skill, `.claude/skills/app-change/`, not part of the board kit). **Speed matters most:** the
  owner watches changes live on the dev servers and iterates. Read only the code the change needs,
  build it, run the quick checks, commit by path, say where to look. No progress log, plan page or
  phase doc. Work in the main checkout on `master`; no worktrees or branches unless the owner asks.
- **The owner never opens the app from a worktree.** Anything done in a worktree or branch (a sweep,
  or work the owner asked to isolate) merges into `master` as soon as it is finished and the full
  gate is green, without waiting to be tested; the owner tests it on `master`. Then remove the
  worktree and branch.
- **Phases 46 to 57 run in build lanes, in waves** (owner, 25 Nov 2026): Wave 1 is Lane A (46, 49) and
  Lane B (47, 48), joined onto `master` first; Wave 2 is Lane A (50, 52, 53) with Lane B (51); Wave 3 is
  Lane A (54), Lane B (55, 56) and Lane C (57). Each lane builds in its own worktree, and each wave is
  joined onto `master` when green. `docs/build-plan/LANES.md` overrides this file for a lane session; its
  prompts are in `docs/build-plan/lanes/`. Outside a lane, work stays in the main checkout.
- **Screenshots and the demo guide are caught up in a sweep, not per change.** A version of the demo
  guide (`docs/demo-guide/`, incl. `master-demo-guide.html`) and the catalogue screenshots goes to AA
  for testing and approvals; the owner brings both in step when they choose with `/sweep`
  (`.claude/skills/sweep/`; last run in `docs/SWEEP.md`). Routine changes and plan phases don't edit
  the capture recipes, ATLAS or the demo guide, and **never run the capture, even `--dry`**. Only
  keep green the tests that read them (`demoGuideSync.test.ts`).
- **Before "fixing" something that looks wrong,** check `docs/DECISIONS.md`: it lists the prototype's
  settled rulings (things that look like bugs but were chosen on purpose).
- **Known open work** is in `docs/BACKLOG.md`. Pick from it when asked; delete an item's line when you
  finish it, and add a line for anything you knowingly leave unfinished. No other upkeep.
- **When requirements change:** `/update-requirements` records the evidence and updates the catalogue;
  after a commit, `/update-build-plan <commit>` turns the changes into new phases in `docs/build-plan/`
  (numbered from 45), and each phase runs in a fresh session from its kick-off prompt (the
  `run-build-phase` skill). Only phases write `docs/build-plan/PROGRESS.md`.
- `docs/archive/` holds the finished build's record (PROGRESS.md, the catch-up plan, reviews, UI
  research). Don't read it unless a task needs history.

## Requirements: where they live

**The system's requirements live in `requirements-board/requirements/`** (the requirements
catalogue; `REQ` below): one Markdown file per epic, feature and story (`REQ/stories/`) and per
outstanding item (`REQ/questions/`: open questions, missing sources), plus artifacts
(`REQ/artifacts/AR-nn.md` sidecars: the diagrams, transcripts, notes and documents requirements link
to, or to a spot in; the files themselves in `REQ/artifacts/files/`), meeting notes (`REQ/notes/`)
and change logs (`REQ/changes/`). Format in `REQ/SCHEMA.md`; folder guide and conventions in
`REQ/README.md`. To add, change, retire or answer a requirement, edit those files (or use the
Requirements Board, which edits the same files), then run `npm run check` from the repo root.
`REQ/domain-model.md` holds the narrative model; update it when a change alters the model. The
catalogue supersedes the RFP wherever they differ. Every file the catalogue cites (transcripts,
pricing documents, the RVG, the RFP PDF as AR-15, our RFP response as AR-36, the flat Contract
model's full design as AR-58) lives in `REQ/artifacts/files/`.

**Before writing any requirement text, read `REQ/VOICE.md`, its model story included.** Stories are
the only cards that hold requirements; epics and features give only the broad theme of what sits
under them, never a list of their stories. A story's description says what the system does, for
whom, and a short why, as if it had always worked this way: history, who decided what, dates,
decision numbers and "our reading" markers go in Notes and `sources`, never the description. When a
decision changes a story, rewrite it; never add an "Update" paragraph. Brief any subagent that writes
requirement text with this rule.

`REQ/reference/RFP.md` is the original RFP: historical input, read-only.

## Where things live

- **The app**: `aa-prototype/`. Never create a second prototype folder. Its `README.md` is the
  developer entry point: scripts, stack versions and a `src/` folder map.
- **Two build targets, one `src/`**: `npm run build` → `dist/` is the framed all-apps prototype;
  `npm run build:pwa` → `dist-pwa/` is the Anaesthetist Mobile App alone as an installable PWA (from
  `vite.pwa.config.ts` + `pwa/`). Anything under `src/apps/mobile/`, `src/shared/` or `src/theme/`
  ships to both.
- **Root scripts**: `npm run setup` installs every folder; `npm run dev` starts the prototype (5173),
  its PWA (5174) and the Requirements Board (5180); `AA_PROTO_PORT`, `AA_PWA_PORT` and `BOARD_PORT`
  override the ports. The prototype's harness bar links to the board only when launched this way.
- **Demo guide**: `docs/demo-guide/` (personas, workflows, the S1 to S5 run sheet, presenter cheat
  sheet; `master-demo-guide.html` is the single-page version). `src/shared/demoTriggers/demoGuideSync.test.ts`
  keeps it in step with the demo triggers.
- **Design**: `docs/design/`, the authoritative visual reference (below).
- **Component catalogue**: the demo-only `/demo/catalogue/admin|web|mobile` (URL only, code in
  `aa-prototype/src/apps/demo/catalogue/`): every shared component, one per row, grouped by family.
- **Contract picker mock**: `contract-picker-mock/` (port 5181, `npm run dev:picker`), a deliberate,
  throwaway exception to the one-prototype rule for stakeholder workshops. The prototype conventions
  don't apply to it; see its `README.md`.
- **Discovery evidence not cited by the catalogue** (contract fee schedules, surgeon room PDFs):
  `docs/discovery-reference/`. **Assets** (the AA logo): `docs/assets/`.
- **Requirements Board**: `requirements-board/`, a separate local dev tool (Vite + React, port 5180)
  for reading, editing and arranging the catalogue. Not part of the prototype, never deployed; its dev
  server is the file API; the prototype conventions don't apply to it. It is a **portable kit**: the
  app, its data folder `requirements/` and its agent skills in `agent/` (`update-requirements`,
  `update-build-plan`, `run-build-phase`, `add-artifact`, `svg-diagram`, `transcript-reconciler`,
  `consistency-review`, and the `link-requirements` workflow), exposed to Claude Code by symlinks in
  `.claude/skills/` and `.claude/workflows/` (`npm --prefix requirements-board run install-skills --
  --link`); edit the files in `requirements-board/agent/`. Each skill keeps its repo-specific facts in
  one "This repo" block; this project's board vocabulary is `REQ/board.config.json` and the
  screenshot recipes are in `REQ/capture/` (`steps.ts`, `ATLAS.md`). The build plan's settings are
  `docs/build-plan/plan.config.json`.
  - Its design rules are in `requirements-board/DESIGN.md` (names over IDs, fixed type colours, status
    as pills): read it before any visual change to the board. Its About page (`/about`) is the user
    guide: keep it in step with the skills.
  - **Artifacts**: a sidecar `REQ/artifacts/AR-nn.md` each (its file in `REQ/artifacts/files/`), with
    named highlight regions that items link to (`artifacts: [AR-01#price-rules]`, or a
    `[words](AR-01#price-rules)` text link); an SVG diagram's sidecar can list steps the board plays
    through. The board edits only their details and never the artifact itself; agents add them with
    the `add-artifact` skill (`npm --prefix requirements-board run artifact:new`), and `svg-diagram`
    saves new diagrams as artifacts.
  - **To share the kit**, `npm --prefix requirements-board run kit:export -- --to "<folder>"` writes a
    clean kit from HEAD (commit first; `--uncommitted` to try work). Build anything new for the board
    here first, bump its `package.json` version and `CHANGELOG.md`, then export.
    `requirements-board/ADOPTING.md` is the checklist for another repo.
  - **To share the catalogue with people outside the team**, `npm --prefix requirements-board run snapshot
    -- --out "<folder>"` writes a read-only static copy of the board (screenshots and artifacts
    included) to host behind a sign-in. Readers' answers, comments and suggested edits come back as a
    downloaded Markdown file: evidence for `/update-requirements`, never edits.
  - **Finish green on board work:** `npm run verify:board` from the repo root.

## Working in the app

- **Mock backend only.** No `fetch`, no endpoints. Components never own domain state: they read and
  write through typed store hooks, and every mutation goes through the audited `mutate()` wrapper and
  the lifecycle guards in `src/store/`. Simulated external systems are store actions; simulated
  events are `DemoTrigger` entries in `src/shared/demoTriggers/registry.ts`, shown only on their own
  screen.
- **Determinism.** Never `Date.now()`, `new Date()` or `Math.random()`. Time comes from the demo
  clock (`src/domain/clock.ts`; `DEMO_TODAY` = 2026-11-24), randomness from the seeded RNG. Same seed
  → identical data.
- **The everyday data is AA's whole practice**: `freshAppState()` is the core seed (the scripted cast of 14,
  `domain/seed/`) plus the 71 colleagues of `domain/seed/fullScale/names.ts`
  (`buildFullScaleDataset(core, { scope: 'practice' })`), built once per page and shared. The store saves
  only a delta against it (`store/persistDelta.ts`), so never edit a state record in place. Under Vitest
  `freshAppState()` is the core seed; `everydayPractice.test.ts` holds the practice to the same invariants.
- **Bump `PERSIST_VERSION`** (`src/store/appStore.ts`) whenever the seed's shape or content changes,
  or stale persisted state survives the reload.
- **Billing maths is pure**: all fee/unit/route/split logic lives in `src/domain/billing/` with
  Vitest tests; UI only formats results.
- **A check that should alert, not stop, is a warning rule** in `src/domain/warnings/rules/`, never a
  blocker in `lifecycle.ts`.
- **Stack is fixed** (React 18, TypeScript strict, Vite, Zustand, React Router, Tailwind v4,
  lucide-react, date-fns, Vitest, Playwright). No new runtime dependency or UI library without the
  owner's say.
- **Tests**: colocated `*.test.ts(x)` for changed behaviour, especially domain, billing, lifecycle and
  store invariants. Playwright specs in `visual/` are a review aid (`npm run shots`).
- **Checks come in two tiers** (`T` = `requirements-board/agent/skills/run-build-phase/tools/`, run
  from the repo root):
  - **Per change (quick, about a minute):** `node T/phase-check.mjs --changed` (typecheck, the Vitest
    tests related to uncommitted changes, catalogue check) and `npm run lint` in `aa-prototype/`.
    That is all a routine change needs before its commit.
  - **Full gate (about 11 minutes):** `node T/phase-check.mjs` (both builds, all of Vitest,
    verify-board, all Playwright) plus lint: in every sweep, before merging a branch, at the end of a
    plan phase, or when the owner asks. Not after routine changes.

## Design: follow the design files

The `docs/design/` mockups are the **authoritative visual reference**. Do not invent a separate visual
language; extend the design's own patterns to any screen it doesn't cover.

- `docs/design/Design Language.dc.html` is the **token source of truth**: palette and neutrals, the
  six status colours (with tint / on-tint values, the hatched Unavailable and dashed Free
  treatments), type (Schibsted Grotesk UI + Spline Sans Mono data, tabular-nums), 4pt spacing,
  radii, elevations, and the six named motion patterns. It is transcribed into `src/theme/`, which
  is what components read; keep the two in step.
- The six sample pages (Mobile App, Mobile Availability, Web Dashboard, Web Availability, Admin Day,
  Admin Review) are the **layout reference** for their screens.
- **Two hard rules:**
  1. AA crimson `#A91E3E` is **identity only** (masthead, active nav, avatars, and the mobile
     canvas's faint atmospheric wash): never buttons, never status. Deep teal `#0D6E63` is the only
     action colour.
  2. Where a mockup simplified a business rule for demo purposes, **the catalogue's rule wins**.
- Aesthetic: slick, clean, calm clinical confidence; **ease of use is the headline requirement**.
  Mobile is genuinely mobile-first (bottom sheets and slide-in cards, not desktop modals); the two
  web apps are proper desktop layouts.
- The mobile atmosphere ships from `AA_DEFAULT_GRADIENT` (`src/theme/mobileGradient.ts`). The Gradient
  Lab that tunes it sits behind `GRADIENT_LAB_ENABLED` (`src/theme/gradientLabGate.ts`), the
  prototype's only feature flag.

## One component per job

- **Before writing a new button, pill, chip, field, select, search box, sheet, dialog, notice, table,
  card or tab, use the shared one.** Shared UI lives in `src/shared/ui/` (controls and feedback; its
  `README.md` lists what exists), `src/shared/surface/` (sheets, dialogs, modal behaviour),
  `src/shared/table/` and `src/shared/calendar/`.
- **If the shared component cannot do what you need, extend it with a variant or prop; never copy it
  into a screen file.** A variant must match a pattern in `docs/design/`; name the mockup in the commit
  message.
- **No private component may repeat a shared one's job or name.** No local `Pill`, `TextAction`,
  `Th`/`Td`, `BackLink`, `Section`, `Row`, `Card` or `Avatar` in a screen file.
- **No raw `<button>`, `<input>`, `<select>` or `<textarea>` with its own style object in a screen**
  unless the element is part of a stays-custom surface (DayGrid, SlideStack, the invoice document, the
  phone frame). `src/apps/oneComponentPerJob.test.ts` enforces this; its allow-list only shrinks.
- **Tokens only.** No hex, radius, font size, shadow or z-index literal where a token exists
  (`src/theme/tokens.ts`). A new value needs a token and a design source.
- **Formatting has one home.** Money through `formatMoney`, dates and timestamps through the helpers
  in `shared/format.ts`, person names through `drSurname` and friends. No `toFixed(2)` or
  `format(..., 'EEE d MMM')` in a component.
- **A shared component keeps its hooks.** Every shared component takes `shot` and emits `data-shot`
  on the element capture recipes target; pass `data-*` attributes through.
- **Keep the catalogue in step.** Adding, renaming or removing a shared component updates its row in
  `/demo/catalogue/*` in the same change.

## Copy & typography

- **No en dashes or em dashes in app-facing copy.** Never use `–` or `—` in any user-visible text in
  `aa-prototype/` (rendered strings, labels, placeholders, alt text, tooltips). Use a middot `·`, a
  comma, or the word "to" for ranges; a plain hyphen `-` is fine where a joiner is genuinely needed.
  Docs are exempt.
- **Catalogue vocabulary, in identifiers as well as copy**: Booking (never Card), no "slot", "swap"
  or "timesheet" in copy, no phase numbers or build scaffolding. `src/appCopy.test.ts` enforces this
  and the dash rule.
- The wordmark is never re-typeset by hand. The cropped logo (`aa-prototype/src/assets/aa-logo.png`)
  renders through the shared `Logo` component on light surfaces; the admin dark side nav uses the
  shared `Wordmark` text component instead, because crimson-on-ink doesn't read.
- Person names have one home: `src/shared/format.ts` (`drSurname`, `surnameOf`, `initialsOf`,
  `nameWithoutTitle`), so the three apps can't drift on the same person.

## Git: commit and merge, never push

**Agents may commit and merge; only the user pushes.** Agents may run `git commit` and `git merge`
(and create or switch local branches) when the work is ready and green, but must **never** run
`git push` or any command that writes to a remote (including tag pushes, `--force`, or PR creation).

- Commit only your own changes: stage files by path, and leave out anything another session or the
  user has changed but not committed.
- Never rewrite history that is already on the remote (no `rebase`, `commit --amend` or `reset` of
  pushed commits).
- Short, sentence-case commit messages. When work is committed, tell the user what was committed and
  on which branch; they push.
