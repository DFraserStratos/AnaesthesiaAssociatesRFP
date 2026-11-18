# CLAUDE.md

Project guidance for Claude Code and other coding agents working in this repo.

## Project

A demo **prototype** of the Booking & Billing system described in the Anaesthesia Associates (AA)
RFP (Peritia Ltd, July 2026). AA is a Christchurch, NZ company that handles booking and billing for
~85 independent anaesthetists.

The prototype is a fully interactive, true-to-life **React front end over a fake in-browser
backend** — no real servers, APIs, or data. It exists to demonstrate every major feature of the
RFP's Candidate Architecture during vendor presentation workshops; it is **not** production
software. It presents three apps behind one app-switcher — **Anaesthetist Mobile App**,
**Anaesthetist Web App**, **Admin Web App** — plus demo-only simulators (Xero, HL7/FHIR
integrations, a demo control panel).

## Current state

**The original build is finished.** All 14 phases (00 to 13) are DONE, the app runs end to end, and
the Vitest + Playwright suites are green.

**The requirements catch-up is next.** `docs/prototype-build/catch-up/` holds a verified gap analysis
between the prototype and the catalogue (at commit `63a4490`) and a build plan of phases 14 to 44 (55 phases, some lettered such as 15a, plus the UI unification track U1 to U7) to
close it: start at its `README.md`, `ROADMAP.md` or `index.html` (kick-off prompts). From Phase 26 on it
is built in two lanes (two git worktrees, two sessions) in waves: `catch-up/LANES.md` holds the current
wave, the lane rules and the lane prompts, and overrides this file for a lane session. A catch-up phase
session follows its kick-off prompt, which loads the `run-build-phase` skill (the lifecycle every
phase shares: context pack, drift check, build, checks, review, screenshots, PROGRESS entry, and
updating the plan page to name the next phase) and its phase doc; other work is still fixes, polish
and demo preparation.
When requirements change, the `/update-requirements` skill records the evidence and updates the
catalogue, then (after a commit) `/update-build-plan <commit>` updates the plan.

Routine fixes and polish do not require reading or updating `PROGRESS.md`. Consult its build history,
open-items handoff and Decisions log only when they are relevant to the task. Consult
`docs/prototype-build/prototype-review/00-SUMMARY.md` for RFP-wide conformance work or related review
findings.

## Requirements: where they live

**The system's requirements live in `requirements-board/requirements/`** (the requirements
catalogue; `REQ` below): one Markdown file per epic, feature and story (`REQ/stories/`) and per
outstanding item (`REQ/questions/`: open questions, missing sources), plus artifacts
(`REQ/artifacts/AR-nn.md` sidecars: the diagrams, transcripts, notes and documents requirements link
to, or to a spot in; the files themselves in `REQ/artifacts/files/`), meeting notes (`REQ/notes/`)
and change logs (`REQ/changes/`). Format in `REQ/SCHEMA.md`; folder guide and conventions in
`REQ/README.md`. To add, change, retire or answer a requirement, edit those files (or use the
Requirements Board, which edits the same files), then run `npm run check` from the repo root.
`REQ/domain-model.md` holds the narrative model; update it when a change alters the model. This
catalogue supersedes the RFP wherever they differ. Every file the catalogue cites (transcripts,
pricing documents, the RVG, the RFP PDF) lives in `REQ/artifacts/files/`, not elsewhere in `docs/`.

**Before writing any requirement text, read `REQ/VOICE.md`, its model story included.** Stories are
the only cards that hold requirements; epics and features give only the broad theme of what sits
under them, never a list of their stories. A story's description says what the system does, for
whom, and a short why, as if it had always worked this way: history, who decided what, dates,
decision numbers and "our reading" markers go in Notes and `sources`, never the description. When a
decision changes a story, rewrite it; never add an "Update" paragraph. Brief any subagent that writes
requirement text with this rule.

Not the place to edit requirements:
- `requirements-board/` outside `requirements/` is the app, its scripts and its agent skills.
- `REQ/reference/RFP.md` is the original RFP: historical input, read-only.
- `docs/prototype-build/REQUIREMENTS.md` is the prototype's build checklist against the RFP, used only
  for prototype work.

## Where things live

- **The app** — `aa-prototype/` at the repo root. Never create a second prototype folder. Its
  `README.md` is the developer entry point: scripts, stack versions and a `src/` folder map.
- **Contract picker mock** — `contract-picker-mock/` (port 5181, `npm run dev:picker`): a deliberate,
  throwaway exception to the one-prototype rule. It is a single AA Admin booking screen comparing six (billable party first and price first)
  ways of choosing a Contract, seeded from the real fee files, for stakeholder workshops. The prototype
  conventions (store, demo clock, `PERSIST_VERSION`) do not apply to it; see its `README.md`.
- **Requirements Board** — `requirements-board/`: a separate local dev tool (Vite + React, port
  5180) for reading, editing and arranging the future-state requirements catalogue in
  `requirements-board/requirements/` (format: `REQ/SCHEMA.md`). It is a **portable kit**: the app,
  its data folder `requirements/` and its agent skills in `agent/` (`update-requirements`,
  `update-build-plan` (its tools in `agent/skills/update-build-plan/tools/`; the catch-up plan's
  settings in `docs/prototype-build/catch-up/plan.config.json`), `run-build-phase` (runs one plan
  phase; its `phase-context.mjs` and `phase-check.mjs` in `agent/skills/run-build-phase/tools/`, set
  up by the `runner` key of the same config), `add-artifact`, `svg-diagram`,
  `transcript-reconciler`, `consistency-review`, and the `link-requirements` workflow),
  exposed to Claude Code by symlinks in `.claude/skills/` and `.claude/workflows/` (`npm --prefix
  requirements-board run install-skills -- --link`; a shared kit gets copies instead); edit the files in
  `requirements-board/agent/`. The board's code is project-generic: this project's vocabulary
  (components, screenshot apps, status wording, capture settings) is `REQ/board.config.json`, the
  screenshot recipes, atlas and report are in `REQ/capture/` (its prototype-specific capture steps in
  `REQ/capture/steps.ts`), and each skill keeps its repo-specific facts in one "This repo" block.
  `requirements-board/ADOPTING.md` is the checklist for setting it up in another repo. **To share it**,
  `npm --prefix requirements-board run kit:export -- --to "<folder>"` writes a clean kit (starter
  catalogue from `requirements-board/starter/`, starter "This repo" sections, leak check against
  `starter/deny.txt`); build anything new for the board here first, bump its `package.json` version and
  `CHANGELOG.md`, then export. Its About page (`/about`) is the user guide: keep it in step with the skills. Not
  part of the prototype, never deployed; its dev server is the file API. The prototype conventions
  below (mock backend, determinism, `PERSIST_VERSION`) do not apply to it. Root `npm run dev` starts
  the prototype, its mobile PWA (5174) and the board (`npm run setup` installs all three folders); `npm run check` validates the catalogue. The
  prototype harness bar links to the board only when launched that way (it sets `VITE_REQUIREMENTS_URL`),
  so a presenter running `aa-prototype` on its own never sees the link.
  **Its design rules are in `requirements-board/DESIGN.md`** (names over IDs, fixed type colours, status
  as pills): read it before any visual change to the board.
  **Artifacts** (its Artifacts tab) are the diagrams, transcripts, notes and documents behind the
  requirements: a sidecar `REQ/artifacts/AR-nn.md` each (its file in `REQ/artifacts/files/`), with named highlight regions that
  items link to (`artifacts: [AR-01#price-rules]`, or a `[words](AR-01#price-rules)` text link); an SVG
  diagram's sidecar can also list steps the board plays through (stepped diagrams), linkable like regions. The
  board edits only their details (name, kind, status, date, author, area, sources, description) and
  never makes or edits the artifact itself; agents add them, and write their files and regions, with the `add-artifact` skill
  (`npm --prefix requirements-board run artifact:new`), and the `svg-diagram` skill saves new
  diagrams as artifacts. A new transcript or note filed by `update-requirements` is registered as one. **Finish green on board work:**
  `npm run verify:board` from the repo root (typecheck, Vitest, catalogue check) passes before handing back.
- **Two build targets, one `src/`** — `npm run build` → `dist/` is the framed all-apps prototype;
  `npm run build:pwa` → `dist-pwa/` is the Anaesthetist Mobile App alone as an installable PWA, built
  from `vite.pwa.config.ts` + `pwa/`. Anything under `src/apps/mobile/`, `src/shared/` or `src/theme/`
  ships to both. The README's "Second build target" section is the full account.
- **Build record** — `docs/prototype-build/`
  - `PROGRESS.md` — the historical build record: binding conventions, phase status, decisions log,
    per-phase entries and open-items handoff. Reference it selectively; routine tweak sessions do
    not need to read or update it.
  - `REQUIREMENTS.md` — the prototype's numbered build checklist against the RFP (P/D/M/W/A/B/X/I/N).
    Not the system's requirements; those are the catalogue above.
  - `prototype-review/` — the 2026-07-27 whole-RFP conformance review; start at `00-SUMMARY.md`.
  - `contract-model-proposal.md` — the working copy of the flat Contract model's full design (5 November
    2026): entities, step rail, fallbacks, worked examples, seed mapping, Donald's decisions D1 to D11,
    the section 11.1 assumptions (our reading, not decisions) and open points. Read it for the why behind
    EP-04 and the domain model's contract sections. The catalogue cites its snapshot, artifact AR-58.
  - `ROADMAP.md`, `phases/phase-00…13.md`, `index.html` — the build plan (historical, but the phase
    docs remain the best account of why each surface is the way it is).
- **Demo guide** — `docs/demo-guide/`: personas, workflows, the S1 to S5 run sheet and the presenter
  cheat sheet; `master-demo-guide.html` is the self-contained single-page version. Behaviour changes
  that affect a scripted beat must be mirrored here.
- **RFP** — `REQ/reference/RFP.md` (the original RFP the prototype was built against, superseded by
  the catalogue for the real system's requirements); its PDF is `REQ/artifacts/files/` (artifact
  AR-15). Our Stratos response PDF is artifact AR-36, also in `REQ/artifacts/files/` (sources cite it as
  `RFP response p.N`). Other evidence not cited by
  the catalogue (contract fee schedules) is in `docs/discovery-reference/Contract Files/`.
- **Design** — `docs/design/` (the authoritative visual reference — see below).
- **UI library research** — `docs/ui-library-research/` (parked until late in the prototype build): research
  and component inventories for replacing the hand-built UI with standard libraries (shadcn/ui on Base UI
  and others) for unification, not flourish. Start at its `README.md`. Its live companion is the demo-only
  component catalogue in the prototype (`/demo/catalogue/admin|web|mobile`, URL only, code in
  `aa-prototype/src/apps/demo/catalogue/`): every hand-built component, one per row, grouped by replacement
  library. Keep its rows in step when components are added, renamed or removed.
- **Assets** — `docs/assets/` (the AA logo).

## Working in the app

These core conventions govern routine changes. `PROGRESS.md` contains the fuller historical set:

- **Mock backend only.** No `fetch`, no endpoints. Components never own domain state — they read and
  write through typed store hooks, and every mutation goes through the audited `mutate()` wrapper
  and the lifecycle guards in `src/store/`. Simulated external systems are store actions.
- **Determinism.** Never `Date.now()`, `new Date()` or `Math.random()`. Time comes from the demo
  clock (`src/domain/clock.ts`; `DEMO_TODAY` = 2026-07-21), randomness from the seeded RNG. Same
  seed → identical data.
- **Bump `PERSIST_VERSION`** (`src/store/appStore.ts`, currently 13) whenever the seed's shape or
  content changes, or stale persisted state survives the reload.
- **Billing maths is pure** — all fee/unit/route/split logic lives in `src/domain/billing/` with
  Vitest tests; UI only formats results.
- **Finish green:** `npm run build`, `npm run build:pwa` and `npx vitest run` all pass before handing
  work back.
- **Don't re-litigate.** The Decisions log records the readings we picked and why, across eight
  review rounds. Several plausible-looking "bugs" are settled rulings — check there first.

## Design — follow the design files

The `docs/design/` mockups are the **authoritative visual reference** (PROGRESS.md convention 17).
Do not invent a separate visual language — extend the design's own patterns to any screen it
doesn't already cover.

- `docs/design/Design Language.dc.html` is the **token source of truth**: palette and neutrals, the
  six status colours (with tint / on-tint values, the hatched Unavailable and dashed Free
  treatments), type (Schibsted Grotesk UI + Spline Sans Mono data, tabular-nums), 4pt spacing,
  radii, elevations, and the six named motion patterns. It is transcribed into `src/theme/`, which
  is what components read — keep the two in step.
- The six sample pages — Mobile App, Mobile Availability, Web Dashboard, Web Availability,
  Admin Day, Admin Review — are the **layout reference** for their screens.
- **Two hard rules:**
  1. AA crimson `#A91E3E` is **identity only** (masthead, active nav, avatars, and the mobile
     canvas's faint atmospheric wash) — never buttons, never status. Deep teal `#0D6E63` is the only
     action colour.
  2. Where a mockup simplified a business rule for demo purposes, **the RFP rule wins** (see
     PROGRESS.md's Decisions log).
- Aesthetic: slick, clean, calm clinical confidence; **ease of use is the headline requirement**.
  Mobile is genuinely mobile-first (bottom sheets and slide-in cards, not desktop modals); the two
  web apps are proper desktop layouts.
- The mobile atmosphere ships from `AA_DEFAULT_GRADIENT` (`src/theme/mobileGradient.ts`). The
  temporary Gradient Lab that tunes it sits behind `GRADIENT_LAB_ENABLED`
  (`src/theme/gradientLabGate.ts`) — the prototype's only feature flag, removable after sign-off
  without touching the shipped look.

## Copy & typography

- **No en dashes or em dashes in app-facing copy.** Never use `–` (en dash) or `—` (em dash) in any
  user-visible text in `aa-prototype/` — rendered strings, labels, placeholders, alt text, tooltips.
  Use a middot `·`, a comma, or the word "to" for ranges (e.g. "Phases 03 to 04"); a plain hyphen
  `-` is fine where a joiner is genuinely needed. (The planning docs under `docs/` are exempt — this
  rule is about the prototype UI.)
- The wordmark is never re-typeset by hand. The cropped logo image
  (`docs/assets/Anasthesia-logo-Short.png`, copied to `aa-prototype/src/assets/aa-logo.png`) renders
  through the shared `Logo` component on light surfaces; the admin dark side nav uses the shared
  `Wordmark` text component instead, because crimson-on-ink doesn't read.
- Person names have one home: `src/shared/format.ts` (`drSurname`, `surnameOf`, `initialsOf`,
  `nameWithoutTitle`), so the three apps can't drift on the same person.

## Git — commit and merge, never push

**Agents may commit and merge; only the user pushes.** Coding agents may run `git commit` and
`git merge` (and create or switch local branches) when the work is ready, but must **never** run
`git push` or any command that writes to a remote (including tag pushes, `git push --force`, or PR
creation).

- Commit only your own changes: stage files by path, and leave out anything another session or the
  user has changed but not committed.
- Never rewrite history that is already on the remote (no `git rebase`, `git commit --amend` or
  `git reset` of pushed commits).
- When work is committed, tell the user what was committed and on which branch; they push.
