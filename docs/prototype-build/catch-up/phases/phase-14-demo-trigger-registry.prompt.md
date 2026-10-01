Please run catch-up Phase 14 (Screen-contextual demo triggers) of the Anaesthesia Associates prototype.

Repo root: /Users/d.fraser/Local Dev/Anaesthesia Associates RFP (the folder name has spaces, so quote paths). The app is aa-prototype/; every path below is relative to the repo root. Follow CLAUDE.md. Do not commit or push.

Before doing anything else, read these in order:
1. docs/prototype-build/catch-up/ROADMAP.md - the sequencing rules and the "Demo triggers", "PWA parity" and "Demo guide" sections (this phase builds the mechanism every later phase registers into).
2. docs/prototype-build/catch-up/phases/phase-14-demo-trigger-registry.md - your detailed plan.
3. docs/prototype-build/catch-up/GAP-ANALYSIS.md - "Demo-trigger buttons", "Remove or rework" and "Demo impact (S1 to S5)"; then docs/prototype-build/catch-up/epics/EP-13.md (FT-13.5) and docs/prototype-build/catch-up/analysis/reverse-check.md (RV-05, RV-06, RV-22).
4. The catalogue items: "docs/discovery-reference/Updated Requirements/catalogue/requirements/FT-13.5.md", US-13.5.1.md and US-13.5.2.md in the same folder.
5. docs/prototype-build/catch-up/analysis/prototype-map-shell-demo-pwa.md (all of it: every Control Panel trigger, the PWA panel and office simulation, the extension points) and the Audit, Billing monitor, Invoices and Integrations sections of prototype-map-admin.md.
6. docs/design/Design Language.dc.html (tokens, badge tints, sheet-in motion) and docs/design/Mobile App.dc.html (the bottom-sheet pattern, and the header and dock positions the PWA chip must clear). The harness bar has no mockup: copy aa-prototype/src/shell/DemoClockMenu.tsx.
7. docs/prototype-build/PROGRESS.md - binding conventions (especially 4, 12, 13, 16, 17, 18) and the Decisions log entries "2026-07-28 Demo clock promoted into the global harness" and "2026-09-28 Anaesthetist Card shows no calculation" (the precedent for harness-bar and PWA-panel controls), plus the Phase 12 entry (how the Control Panel was finished). Then aa-prototype/README.md's Office simulation section and the "Demo control panel" section of requirements-board/capture/ATLAS.md.

Then do the drift check in the phase doc (git diff 501b0b8 for FT-13.5, its two stories, US-07.2.2, US-07.3.1 and FT-14.1 to 14.6), and report what changed. Enter plan mode: confirm the registry contract (types, surfaces, when, choices, disabledReason, indexPath, indexHint, memory, context keys), map each Control Panel handler to its registry entry (and say which one, "Run payables", is dropped because the Billing monitor's product button is its home), split the work into the two sessions the doc describes, and wait for my approval. Do not edit any file before I approve.

While working:
- Re-home first, then re-green, then add the new pieces. Every re-homed body does exactly what its Control Panel card did (same store calls, actors, guards and idempotency keys); only where it shows and how it finds its target change.
- The registry, useDemoTriggerContext, the replay memory, the shared OFFICE_ACTOR / SOUTER_ACTOR / OFFICE_SIMULATION_ACTOR constants and the office stand-in live in src/shared or src/store. The registry has its own index under src/shared/demoTriggers and is not re-exported from the src/shared/index.ts component barrel. Nothing in the PWA closure may import src/apps/*, src/shell/AppShell.tsx or the bar menu; pwaPurity.test.ts must stay green.
- A trigger acts on the entity in the URL or on published screen state wherever it can; a seed-scoped entry names its seed constant and is gated with when. No Date.now(), new Date() or Math.random().
- One "Demo actions" pill in the 48px bar, hidden on screens with no entries; never a row of buttons. Harness chrome is white-on-ink with amber demo badges; teal only for Run; crimson never. Every trigger is badged (convention 13).
- Office stand-ins declare the PWA surface only. "Play the office" defaults OFF (fresh or corrupt storage reads OFF) and is badged when on. The PWA sheet is a bottom sheet with tappable choices, not a dropdown (convention 16).
- The Control Panel keeps scenario jumps, clock and reset, and lists every trigger under its screen with an "Open screen" link. No trigger buttons remain on it.
- Playwright specs (admin-phase09, admin-phase08, phase12, then pwa-device), data-shot hooks and the 18 board capture recipes move with their triggers in the same session.
- Product actions stay in the product UI: no bar entry duplicates a button the screen already has.
- No en or em dashes in any app copy. PERSIST_VERSION stays at 13 unless the seed or persisted shape changes.
- Keep npm run build, npm run build:pwa and npx vitest run green throughout (run them from aa-prototype/). Do not commit.

When done:
- Run the manual test checklist and report each item; npm run build, npm run build:pwa, npx vitest run and npm run shots green (in aa-prototype/), and npm run verify:board green (from the repo root) after the recipe edits.
- Run the adversarial review-and-fix pass (convention 18: a few Opus review subagents for quality, bugs and plan adherence, steered by the phase doc's bullets; independently verify each finding, fix the confirmed ones, re-green).
- Update PROGRESS.md: status row, a "Catch-up Phase 14" entry (drift-check result, the registry contract as the seam later phases use, the registered entries, tests, the review pass), the four Decisions-log entries and the convention 4 and 13 wording the phase doc lists.
- Patch docs/demo-guide (03-demo-script.md setup, S1 caveat and Beat 1, S4 Beats 2 to 5, S5 Beat 2, recovery; 04-presenter-cheat-sheet.md; README.md), the same passages of master-demo-guide.html, the Control Panel scenario text and aa-prototype/README.md.
- Give me short, clear notes: what moved where, what is new, anything deferred and why.

Phase goal: every demo action on the screen it belongs to, in the harness bar and on a handset, with the Control Panel as the index, the office stand-in replacing auto-authorise, and HL7/FHIR honestly badged Future scope.
