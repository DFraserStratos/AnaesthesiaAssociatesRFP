Please run UI unification Phase U7 (Close out) of the Anaesthesia Associates prototype.

Paths below are from the repo root, /Users/d.fraser/Development/Stratos Dev/AnaesthesiaAssociatesRFP (folder names contain spaces, so quote them). The app is aa-prototype/; run npm commands there. CLAUDE.md at the repo root holds the project rules. Do not commit or push. It is one session, run after U6 and after every catch-up phase except 44 (the last are 35, 38, 39a, 40a, 41, 43 and 43a), and it must land before Phase 44.

Before doing anything else, read these in order:
1. docs/ui-unification/README.md: sections 1, 3 (the U35 entry, then every group U01 to U36 for the sweep), 4 to 8 and 10; then docs/ui-unification/PLAN.md in full (section 2 U7, section 3 the fold-ins, section 4 the done criteria, section 5 the plan.config.json rule).
2. docs/prototype-build/catch-up/phases/phase-U7-close-out.md: your detailed plan.
3. The detail files in docs/ui-unification/detail/:
   - J-completeness.md N2 to N6, N8 and N9, and B-pills-avatars.md G8 and G11 (the U35 repeats);
   - A-buttons.md to G-tables-cards-chrome.md for each group's members, target and migration notes (the sweep);
   - H-tokens.md "Scope and how to reproduce" and its commands (the counts for RESULTS.md);
   - I-context.md Part 3, all of it (attributes, Vitest suites and source scans, PWA build, demo guide beats, the catalogue and its tests).
4. docs/design/Mobile App.dc.html, Mobile Availability.dc.html, Web Dashboard.dc.html, Admin Day.dc.html and Design Language.dc.html: the AUTHORITATIVE layout reference (convention 17).
5. requirements-board/requirements/capture/ATLAS.md and the "Catalogue screenshots" section of docs/prototype-build/catch-up/ROADMAP.md.
6. docs/prototype-build/PROGRESS.md:
   - the binding conventions (13, 16 to 19) and the Decisions log;
   - the entries of U1 to U6 and their handoff lists;
   - the entries of the catch-up phases in PLAN.md section 3 (what each migrated).
7. aa-prototype/README.md and aa-prototype/src/shared/ui/README.md (the component table and each shared component's home).
8. ROADMAP.md "Owner review: agents test themselves" and the Sequencing rule for the UI unification track.

Then do the drift check in the phase doc: confirm U1 to U6 and every catch-up phase but 44 are DONE (stop and tell me if 44 has started); re-run every group's counts and the U35 members; check each PLAN.md section 3 fold-in was done; take a start-of-U7 catalogue shot set and record the Vitest, Playwright and capture REPORT.md counts; list the expected visible changes. Then write a plan from the work items (the worklist first) and start building without waiting for my approval (ROADMAP.md "Owner review: agents test themselves").

While working:
- Invoke the /frontend-design:frontend-design skill before building or reshaping any component, and only inside the existing design system (docs/design and src/theme stay authoritative, ROADMAP.md "Front-end design"): never for a new palette, typeface or visual language.
- Default props keep today's look: no existing call site changes appearance unless the phase doc lists the change.
- Never drop a hook: every shot prop, data-shot, data-testid, data-validation-* and row data-* attribute stays on the element recipes and specs target.
- No redesign. A visible change must cite the README question that approved it (or, for a U35 repeat, the README U35 "Canonical look"); anything else that moves in the screenshot comparison is fixed, not kept.
- Do not re-open the 27 answers (README section 6) or the intended differences (section 5).
- Do not migrate the stays-custom surfaces (DayGrid, SlideStack, the invoice document, the phone frame) or the demo simulators unless Phases 41 or 43 already moved them (question 2): the phase doc's "Not migrated here" item.
- Write the guardrail test (aa-prototype/src/apps/oneComponentPerJob.test.ts) first and run it red; its failures join the worklist. Its allow-list only shrinks: reasons on every entry, a ceiling, and a stale-entry check.
- Delete every private copy you replace; never leave it beside the shared one. Mobile-used components live in src/shared (pwaPurity.test.ts).
- Keep catalogue row names stable wherever the component did not change (the shots are keyed by name); record every rename in RESULTS.md.
- The CLAUDE.md section is README section 8's approved text, word for word, placed after the design section; diff it against the README. CLAUDE.md is the binding instructions file: change nothing else in it beyond the one-line catalogue and research fixes the doc names.
- PERSIST_VERSION does not change; no seed or store change.
- House rules: mock backend only and every write through mutate(); the demo clock, never Date.now() or new Date(); bottom sheets on mobile, dialogs on web and admin; teal is the only action colour and crimson identity only; no en or em dashes in app copy; never commit.
- If the session runs long, finish the guardrail test, the catalogue, the CLAUDE.md and README updates and RESULTS.md first; record any U35 repeat not reached in RESULTS.md with its reason.

When done:
- Run the manual test checklist yourself in the running app (Playwright or the /run skill, screenshots checked by eye; never hand it to me) and report each item pass or fail with its evidence.
- Confirm npm run build, npm run build:pwa, npx vitest run and npm run shots (from aa-prototype/) and npm run verify:board (repo root) are green.
- Retake the catalogue shots with node docs/ui-unification/shots/shoot.mjs into docs/ui-unification/shots-after/ (dev server on 5173), compare each row with the start-of-U7 set and the 12 November baseline in docs/ui-unification/shots/, and list every intended change.
- Run the adversarial review-and-fix pass (convention 18: Opus reviewers for quality, bugs and correctness, and plan adherence, steered by the phase doc's bullets, with the added lens "find a private copy of a shared component that this phase left or added"; verify each finding, fix the confirmed ones, re-green).
- Run the catalogue screenshot step: in requirements-board/ run node scripts/capture.ts --dry, fix what fails, then npm run capture (start root npm run dev in the background if 5173 or 5174 is down) with no failed recipe; look at the shots of the recipes the phase doc lists; update ATLAS.md if a hook moved; npm run verify:board green.
- Write docs/ui-unification/RESULTS.md (per group: 12 November count, count now, what remains and why; tokens; bugs; catalogue rows; the commands) and update the status lines of docs/ui-unification/README.md and docs/ui-library-research/README.md.
- Update PROGRESS.md as the phase doc's "PROGRESS.md updates" lists: the status row starting | U7 |, the entry headed ### Catch-up Phase U7 · Close out, the Decisions-log entries (and any question 1 to 27 entry that was missing), the handoff to Phase 44, the capture REPORT.md counts before and after.
- Patch the demo guide in the same session if a label, figure or control changed (Markdown and master-demo-guide.html).
- Give me short, clear notes, ending with the "For the owner's review" list (also in the PROGRESS entry).

Phase goal: close the UI unification by migrating every stable call site the earlier phases skipped and the remaining U35 small repeats onto one shared component each (StickyDock, NoticeLine, PickRow, AddRowButton, TickGlyph, Disclosure, TotalsBlock, DayChip and one progress label source), regrouping the live catalogue by family with a "Shared component" column and its three tests in step, adding a source-scan guardrail test whose allow-list can only shrink, writing the approved "One component per job" section into CLAUDE.md word for word with the shared UI README and the plan's standing rules in step, confirming every one of the 27 answers is in the Decisions log, and recording the before and after counts and screenshots in docs/ui-unification/RESULTS.md, all with no redesign, no lost hook and no seed change, before Phase 44 takes the final screenshots.
