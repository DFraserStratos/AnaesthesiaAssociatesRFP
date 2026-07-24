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
integrations, a demo control panel). The build is organised into 14 phases (00–13).

## Where things live

- **Build plan** — `docs/prototype-build/`
  - `PROGRESS.md` — the living record: binding conventions, phase status, decisions log.
    **Read it first and update it last, every session.**
  - `REQUIREMENTS.md` — the numbered requirements catalogue (P/D/M/W/A/B/X/I/N).
  - `ROADMAP.md` — the 14-phase sequence, dependencies and milestone demos.
  - `index.html` — a styled build page with a copy-paste kick-off prompt per phase.
  - `phases/phase-00…13.md` — one detailed plan per phase.
- **RFP & data model** — `docs/rfp-reference/`
  - `RFP.md` — full RFP text (the source of truth for requirements); the RFP PDF sits alongside it.
  - `Data-Model-and-Flow.md` / `.html` — our reading of the candidate data model, the List/Card
    lifecycle, and the end-to-end booking → billing → payment flow.
- **Design** — `docs/design/` (the authoritative visual reference — see below).
- **Assets** — `docs/assets/` (the AA logo).
- **The app** — `aa-prototype/` at the repo root. It is created in Phase 00 and does not exist
  before then. Never create a second app folder.

## Design — follow the design files

The `docs/design/` mockups are the **authoritative visual reference** (PROGRESS.md convention 17).
Do not invent a separate visual language — extend the design's own patterns to any screen it
doesn't already cover.

- `docs/design/Design Language.dc.html` is the **token source of truth**: palette and neutrals, the
  six status colours (with tint / on-tint values, the hatched Unavailable and dashed Free
  treatments), type (Schibsted Grotesk UI + Spline Sans Mono data, tabular-nums), 4pt spacing,
  radii, elevations, and the four named motion patterns. Transcribe tokens from it verbatim.
- The six sample pages — Mobile App, Mobile Availability, Web Dashboard, Web Availability,
  Admin Day, Admin Review — are the **layout reference** for their screens.
- **Two hard rules:**
  1. AA crimson `#A91E3E` is **identity only** (masthead, active nav, avatars) — never buttons,
     never status. Deep teal `#0D6E63` is the only action colour.
  2. Where a mockup simplified a business rule for demo purposes, **the RFP rule wins** (see
     PROGRESS.md's Decisions log).
- Aesthetic: slick, clean, calm clinical confidence; **ease of use is the headline requirement**.
  Mobile is genuinely mobile-first (bottom sheets and slide-in cards, not desktop modals); the two
  web apps are proper desktop layouts.

## Copy & typography

- **No en dashes or em dashes in app-facing copy.** Never use `–` (en dash) or `—` (em dash) in any
  user-visible text in `aa-prototype/` — rendered strings, labels, placeholders, alt text, tooltips.
  Use a middot `·`, a comma, or the word "to" for ranges (e.g. "Phases 03 to 04"); a plain hyphen
  `-` is fine where a joiner is genuinely needed. (The planning docs under `docs/` are exempt — this
  rule is about the prototype UI.)
- The AA logo (`docs/assets/Anasthesia-logo-1.png`, copied to `aa-prototype/src/assets/aa-logo.png`)
  is the wordmark everywhere a masthead appears — use the `Logo` component, not re-typeset text.

## Git — do not commit or push

**The user handles all commits and pushes themselves.** Coding agents must **not** run
`git commit`, `git push`, or any command that creates commits or writes to a remote (including
`git commit --amend`, `git rebase`, `git merge`, tag pushes, or PR creation).

Make and stage file changes as needed, but stop there — leave the working tree and index for the
user to review and commit. When work is ready, tell the user what changed. Do not commit it
yourself.
