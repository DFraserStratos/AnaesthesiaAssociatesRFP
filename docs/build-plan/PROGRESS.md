# AA Prototype · Build plan progress

The record of this plan's phases (45 on), written by phases only: routine fixes and polish (the
`app-change` skill) never touch it. The plan's tools parse the status rows, the phase entry headings
and the Decisions-log lines, so keep their formats exact. The build record of phases 00 to 44 and U1 to
U7 is archived in `docs/archive/prototype-build/PROGRESS.md` (large: grep it, never read it whole).

## Status

| # | Phase | Status | Session date | Notes |
|---|-------|--------|--------------|-------|

Rows: `| <id> | <title> | DONE | <YYYY-MM-DD> | <one-sentence summary> |`, or `IN PROGRESS` at a
checkpoint, in run order.

## Binding conventions (all phases)

Copied from the archived PROGRESS with their numbers kept, the dated amendments folded in. Conventions
marked *Process* are now carried by the `run-build-phase` skill and this plan's ROADMAP standing rules.

1. **App location.** The app lives in `aa-prototype/` at the repo root. This plan lives in `docs/build-plan/`; the earlier build record in `docs/archive/prototype-build/`. Never create a second app folder.
2. **Stack is fixed.** Vite + React 18 + TypeScript (strict, no `any`), React Router, Zustand for the store, Tailwind CSS + a design-token layer (`src/theme/`), lucide-react icons, date-fns, Vitest for unit tests. No additional UI framework without a `docs/DECISIONS.md` entry.
3. **Folder shape.** `src/domain/` (types, seed, billing maths, validators: pure, no React), `src/store/` (Zustand slices, lifecycle guards, audit writer), `src/apps/mobile/`, `src/apps/web/`, `src/apps/admin/`, `src/apps/demo/` (demo-only surfaces: control panel, Xero sim, integrations, billing monitor), `src/shared/` (cross-app components), `src/shell/` (app switcher, phone frame, layout).
4. **Mock backend only.** Components never own domain state; they read/write through typed store hooks. No `fetch`, no real endpoints. Simulated external systems (Xero, the HL7 and FHIR simulator on the Future-scope surface `/demo/integrations`, the rooms' PDF sample upload with its simulated reading) are store actions, registered in `src/shared/demoTriggers` and shown on their screen (harness bar "Demo actions" menu or the PWA's Demo sheet); the demo control panel is their index, and demo screens may also host them.
5. **Deterministic seed.** All seed data generated from a seeded RNG + pinned demo date (`DEMO_TODAY`, 2026-07-21, the design mockups' content date). Same seed, identical data. Reset restores the pristine seed. Never call `Date.now()`/`new Date()` for domain logic: use the demo clock.
6. **Lifecycle rules live in the store.** ACTIVE, SUBMITTED, AUTHORISED transitions are guarded functions; SUBMITTED strips anaesthetist edit rights; AUTHORISED locks Bookings immutable; there is **no Returned state**. DRAFT means a Draft List with no anaesthetist. UI can never bypass a guard.
7. **Audit is append-only.** Every Booking/Procedure mutation (and List reassignment/state change) writes an audit entry `{who, role, source, action, before→after, at}`. No mutation without one. A save (and a create, cancel, move, List reassignment or applied hospital row) groups its audit entries under one change-set id (`AuditEntry.changeSetId`, `CS` ids, the kind on the first entry) through `mutate`'s `changeSet` option or `withChangeSet`.
8. **NHI never crosses to Xero.** Xero-sim screens and data show only the hidden internal ID (ContactNumber) and ContactID, checked by tests.
9. **Billing maths is pure and tested.** All fee/unit/route/split logic lives in `src/domain/billing/` as pure functions with Vitest tests. UI only formats results.
10. **Catalogue vocabulary, one palette.** Domain terms follow the requirements catalogue, which supersedes the RFP: Booking (not Card) in identifiers and copy, Lists reassigned or moved (never swapped), no "timesheet". The six status colours are the palette (`STATUS_PALETTE`, six Design Language tokens, defined once in `src/theme/statusColours.ts`); the availability statuses are a user-maintained master (`masters.slotStatuses`) that picks a token and treatment, and the List types map to their own tokens. The legend is built from the List types plus the active statuses, in all three apps.
11. **Ease of use wins arguments.** When choosing between fidelity to the legacy screenshot and a simpler modern pattern, choose simpler, but keep the information architecture recognisable.
12. **Two mobile hosts, one layout.** The mobile app renders under `PhoneFrame` (the prototype's only emulation: the fixed phone frame on a grey backdrop) and `MobileViewport` (`src/pwa/`, the installed PWA on a real handset). Neither the screens nor the shared surfaces read the viewport or `env()` directly: they read the four `--aa-inset-*` custom properties the mounting host supplies (`src/theme/global.css`, the `host` prop on `MobileApp`, `aa-prototype/README.md`). The framed pixels are locked by `visual/mobile-insets.spec.ts`. Web and admin are desktop layouts.
13. **Demo-only surfaces are visibly demo-only.** Xero sim, integration simulator, billing monitor internals, the control panel, the harness bar's "Demo actions" menu and the PWA's Demo chip and sheet carry a demo badge ("demo simulation" / "Demo trigger") so audiences don't mistake them for proposed product UI. (The billing monitor itself IS proposed product UI: badge only its simulation triggers.) Tooling the catalogue marks Future is badged "Future scope" (`DemoBadge tone="future"`).
14. *Process.* **Every phase ends the same way:** the full gate green (`npm run build`, `npm run build:pwa`, `npx vitest run`, the board check, and `npm run shots` for UI work), the manual test checklist run, the adversarial review-and-fix pass (18), the recipes and demo guide in step, this file updated (status row, phase entry, any Decisions-log lines), a commit when green (never a push), and the app runnable with `npm run dev`. The `run-build-phase` skill, Stages 4 to 7.
15. **Don't gold-plate ahead.** Build only what the current phase's doc lists; later phases depend on the seams described in their docs, not on speculative extras.
16. **Mobile is mobile-first, not a web app in a phone shell.** Bottom sheets and slide-in cards, never centred desktop modals; bottom tab bar; thumb-reachable and sticky contextual actions; steppers, chips and segmented controls over dropdowns and free text. Micro-delight lives in action feedback and never delays a task. The two web apps are proper desktop layouts (hover states, keyboard-friendly tables).
17. **The `docs/design/` mockups are the authoritative visual reference.** `Design Language.dc.html` is the token source of truth: palette, neutrals, the six status colours (with tint/on-tint values and the hatched Unavailable / dashed Free treatments), type (Schibsted Grotesk UI + Spline Sans Mono data with tabular-nums), 4pt spacing, radii (ctl 10 / card 14 / panel 20 / sheet 24-top / pill 999), elevations e-0 to e-3, scrim rgba(23,35,32,0.32), and the six named motion patterns (control-press, selection-slide, sheet-in 320/260ms, card-advance 260/240ms with −24% parallax, complete-tick, value-tick; reduced-motion gives 80ms fades). The six sample pages are the layout reference for their screens; each phase doc names its pages. Two hard rules: (a) AA crimson #A91E3E is identity only (masthead, active nav, avatars), never buttons, never status; deep teal #0D6E63 is the only action colour. (b) **Where a mockup simplified a business rule for demo purposes, the catalogue's rule wins** (`docs/DECISIONS.md`). Extend the design's patterns to screens it doesn't cover; don't invent a second visual language.
18. *Process.* **Adversarial review-and-fix pass after every phase.** About three independent Opus reviewers in parallel, one per lens: quality (conventions, design tokens, one component per job, no gold-plating), bugs and correctness (guards, lifecycle, determinism, purity, audit, maths) and plan adherence (every work item, checklist item and covered item delivered; scope fences; `docs/DECISIONS.md` rulings honoured), plus the lenses the phase doc steers. The phase's session verifies each finding against the code and the catalogue before touching anything (never fix on a paraphrase, never re-raise a settled ruling), fixes the confirmed ones with a test where a bug had none, re-greens, and records the pass in the phase entry. The `run-build-phase` skill, Stage 5.
19. **Catalogue screenshots match the app, captured on approval.** A phase creates or updates the capture recipes (`requirements-board/requirements/capture/recipes/`) for every item it covers and every recipe its changes broke, keeps `capture/ATLAS.md` current, and hands over with the recipe IDs. The capture (even `--dry`) runs only after the owner has tested and approved the phase: then `phase-check.mjs --capture <IDs>` (or `--capture all` for a broad change), the shots checked by eye, `npm run verify:board` green, and the capture committed. ROADMAP.md "Catalogue screenshots" spells it out; record the recipe IDs and, after capture, the REPORT.md counts in the phase entry.
20. **A check that should alert, not stop, is a warning rule.** It is a rule in `src/domain/warnings/rules/` (registered in `WARNING_RULES`, its id in `WarningRuleId`, its facts from `store/warnings.ts`'s `warningFactsFor`, its parameters in `appSettings`) with a sample in `src/store/warningSamples.ts`. It never becomes a blocker in `lifecycle.ts`, a confirm step at submit or a tap-to-read popover: the shared triangle, the Booking's warnings panel, the Day view outline and the To-do card show it with no UI change.
21. **One component per job.** UI is built from `src/shared/{ui,surface,table,calendar}`; a shared component that cannot do the job gets a variant or prop that defaults to today's look, never a copy in a screen file; shared components keep their `shot` and `data-*` hooks; the `/demo/catalogue/*` rows change with them. `src/apps/oneComponentPerJob.test.ts` enforces it (CLAUDE.md "One component per job").
22. **The demo guide matches the app.** Each phase brings `docs/demo-guide/` and the hand-maintained `master-demo-guide.html` in step for exactly what it changed, with figures read from the running app (ROADMAP.md "Demo guide").

## Decisions log

Settled prototype rulings live in `docs/DECISIONS.md`: read it before "fixing" anything that looks
wrong, and never re-litigate a ruling there. The archived catch-up Decisions log
(`docs/archive/prototype-build/PROGRESS.md`, `## Decisions log`) is history only.

This section holds the rulings this plan's phases make, one line each, in this format (the tools parse
it): `- **<YYYY-MM-DD> · Phase <id> (<n>): <title>** (<ids>; supersedes ...). <body>`. A phase also adds
each lasting ruling to `docs/DECISIONS.md`.

## Discovered for later

Known open work lives in `docs/BACKLOG.md`: a phase adds there what it discovers and leaves undone,
and deletes the line of anything it finishes. Items here are only those a later phase of this plan must
pick up by name.

## Phase entries

Each entry is headed `### Phase <id> · <title> (<YYYY-MM-DD>)`, after the last one.
