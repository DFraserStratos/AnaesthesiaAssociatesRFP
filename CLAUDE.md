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

**The build is finished.** All 14 phases (00 to 13) are DONE, the app runs end to end, and the
Vitest + Playwright suites are green. Work from here is fixes, polish and demo preparation for the
vendor workshops — not new phases.

Routine fixes and polish do not require reading or updating `PROGRESS.md`. Consult its build history,
open-items handoff and Decisions log only when they are relevant to the task. Consult
`docs/prototype-build/prototype-review/00-SUMMARY.md` for RFP-wide conformance work or related review
findings.

## Where things live

- **The app** — `aa-prototype/` at the repo root. Never create a second app folder. Its `README.md`
  is the developer entry point: scripts, stack versions and a `src/` folder map.
- **Two build targets, one `src/`** — `npm run build` → `dist/` is the framed all-apps prototype;
  `npm run build:pwa` → `dist-pwa/` is the Anaesthetist Mobile App alone as an installable PWA, built
  from `vite.pwa.config.ts` + `pwa/`. Anything under `src/apps/mobile/`, `src/shared/` or `src/theme/`
  ships to both. The README's "Second build target" section is the full account.
- **Build record** — `docs/prototype-build/`
  - `PROGRESS.md` — the historical build record: binding conventions, phase status, decisions log,
    per-phase entries and open-items handoff. Reference it selectively; routine tweak sessions do
    not need to read or update it.
  - `REQUIREMENTS.md` — the numbered requirements catalogue (P/D/M/W/A/B/X/I/N).
  - `prototype-review/` — the 2026-07-27 whole-RFP conformance review; start at `00-SUMMARY.md`.
  - `ROADMAP.md`, `phases/phase-00…13.md`, `index.html` — the build plan (historical, but the phase
    docs remain the best account of why each surface is the way it is).
- **Demo guide** — `docs/demo-guide/`: personas, workflows, the S1 to S5 run sheet and the presenter
  cheat sheet; `master-demo-guide.html` is the self-contained single-page version. Behaviour changes
  that affect a scripted beat must be mirrored here.
- **RFP & data model** — `docs/rfp-reference/`: `RFP.md` (the source of truth for requirements, PDF
  alongside) and `Data-Model-and-Flow.md` / `.html` (our reading of the data model, the List/Card
  lifecycle, and the booking → billing → payment flow).
- **Design** — `docs/design/` (the authoritative visual reference — see below).
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
  radii, elevations, and the four named motion patterns. It is transcribed into `src/theme/`, which
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

## Git — do not commit or push

**The user handles all commits and pushes themselves.** Coding agents must **not** run
`git commit`, `git push`, or any command that creates commits or writes to a remote (including
`git commit --amend`, `git rebase`, `git merge`, tag pushes, or PR creation).

Make and stage file changes as needed, but stop there. When work is ready, tell the user what
changed — do not commit it yourself.
