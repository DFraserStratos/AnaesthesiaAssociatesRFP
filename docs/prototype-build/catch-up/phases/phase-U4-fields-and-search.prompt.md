Please run UI unification Phase U4 (Fields and search) of the Anaesthesia Associates prototype.

Paths below are from the repo root, /Users/d.fraser/Development/Stratos Dev/AnaesthesiaAssociatesRFP (folder names contain spaces, so quote them). The app is aa-prototype/; run npm commands there. CLAUDE.md at the repo root holds the project rules. Do not commit or push.

It is two sessions (session 1: the fill rule and focus ring, TextField, TextArea, FieldHint, Checkbox, Switch, SelectField and the search box; session 2: date and time fields, NumberStepper, the radio keyboard, ChipMultiSelect, the calendar keys and the Contract chooser parts), run after U3 and Phases 21a and 22 and before U5 and Phase 23.

Before doing anything else, read these in order:
1. docs/ui-unification/README.md: sections 1, 4 to 8, and the section 3 entries for U15, U07, U06, U27, U34, U33 and U24. Then docs/ui-unification/PLAN.md in full (section 1's "must land before" table, section 2 "U4", section 3, section 4's done criteria). The 27 answers in README section 6 are settled; this phase puts questions 4, 5 and 6 into effect.
2. docs/prototype-build/catch-up/phases/phase-U4-fields-and-search.md: your detailed plan.
3. The detail sections, in full: docs/ui-unification/detail/C-fields-search.md G1, G3, G4, G5, G6, G7, G8, G10, G11, G12, G13 (and its "Intended differences to keep"); D-dates-formatting.md G1a, G1b, G2, G3, G5; E-segmented-tabs-nav.md G7, G8. Then detail/I-context.md Part 3 ("What must not break"). Where a detail file and the README disagree, the README wins (the phase doc marks each place).
4. docs/design/Design Language.dc.html (the focus ring, teal accent), Mobile App.dc.html (the code picker search and the notes field as grey wells on white, StepperButton, the "−5" nudge), Mobile Availability.dc.html, Admin Day.dc.html (the 36px toolbar, the rail calendar) and Web Availability.dc.html (the 38px web toolbar). These are the AUTHORITATIVE layout reference (convention 17).
5. requirements-board/requirements/capture/ATLAS.md (the Contract rail overlay lines, "Existing hooks", the /web/lists and /mobile/lists routes, "Selector tips") and the "Catalogue screenshots" rule in docs/prototype-build/catch-up/ROADMAP.md.
6. docs/prototype-build/PROGRESS.md: the binding conventions (especially 16 to 19), the Decisions log, and the entries for U1, U2, U3, 21, 21a and 22 (what they left in ContractRail.tsx, BillingCard.tsx, the capture cards, PayerSheet and SplitFeeSheet).
7. aa-prototype/README.md and aa-prototype/src/shared/ui/README.md (how to add a variant).
8. ROADMAP.md "Owner review: agents test themselves" and the Sequencing rule for the UI unification track.

Then do the drift check in the phase doc: confirm U3, 21a and 22 are DONE and 23 has not started (stop and tell me if it has); re-run the counts with the rg commands it lists and add any new copy of this phase's components that 21, 21a or 22 added, unless a later phase rebuilds that screen; read what U1 to U3 left; take the "before" pins (the baseline shots in docs/ui-unification/shots/, the Vitest and Playwright counts, the capture dry run); and write down the deliberate visible changes list. 
Then write a plan from the work items and start building without waiting for my approval (ROADMAP.md "Owner review: agents test themselves").

While working:
- Invoke the /frontend-design:frontend-design skill before building or reshaping any component, and only inside the existing design system (docs/design/ and src/theme stay authoritative): never for a new palette, typeface or visual language.
- Default props keep today's look: no existing call site changes appearance unless the phase doc lists the change.
- Never drop a hook: every shot prop, data-shot, data-testid, data-validation-* and row data-* attribute stays on the element recipes and specs target. SelectField's shot lands on the <select> itself; NameSearchBox's testId on the input; the Other price switch keeps role="switch" inside contract-rail-other-price.
- No redesign. A visible change must cite the README question that approved it (4 the fill rule, 5 the heights, 6 the focus ring; bug 8 for the blue checkboxes; the README U24 canonical look for the rail); anything else that moves in the screenshot comparison is fixed, not kept.
- Do not re-open the 27 answers (README section 6) or the intended differences (section 5).
- Do not migrate a screen a later catch-up phase rebuilds (the phase doc's "Not migrated here" item): UnitsCard and the other capture card internals (23, 24), BookingDetailBody's notes and time stepper (35), the hospital calendar and its "Hospital" select (42), the Billing monitor select (37), the Integration monitor (34), the demo simulators. FunderAllocationSheet is already gone (22).
- Selects stay native <select> (58 capture steps call selectOption) and keep their DOM order and label text; date inputs keep their order (five specs read input[type="date"] by position); segmented controls, tabs and nav items stay buttons (question 3).
- Keep the web Lists X labelled "Clear the search field" (ListsScreen.test.tsx:69) and the test ids mobile-lists-search, web-lists-search and web-lists-go-to-date.
- The focus rule must hold under the PWA 16px input rule; anything mobile uses lives in src/shared (pwaPurity.test.ts).
- PERSIST_VERSION does not change. No seed or store change.
- House rules: mock backend only and every write through mutate(); time from the demo clock, never Date.now(), new Date() or Math.random(); bottom sheets on mobile, dialogs on web and admin; teal is the only action colour and crimson identity only (the admin calendar keeps its crimson ring); no en or em dashes in app copy; never commit.
- Session 1 is items 1 to 6 and must end green (build, build:pwa, vitest, shots) with its screenshot comparison before session 2 starts.
- If session 2 runs long, finish item 11 (the Contract chooser parts, which 23 needs) first, then items 7 and 8; item 10 (calendars) is the tail.

When done:
- Run the manual test checklist yourself in the running app (Playwright or the /run skill, screenshots checked by eye; never hand it to me) and report each item pass or fail with its evidence, keyboard, focus, Escape and ARIA included.
- Confirm npm run build, npm run build:pwa, npx vitest run and npm run shots (from aa-prototype/) and npm run verify:board (repo root) are green, with pwaPurity.test.ts passing.
- Retake the catalogue shots with node docs/ui-unification/shots/shoot.mjs <aa-prototype path> <out folder> (dev server running) and compare with the 12 November baseline in docs/ui-unification/shots/: every change is on the phase doc's list with its question, or fixed.
- Check no hook was lost (git diff for removed data- lines) and that the copies are deleted, with before and after counts.
- Run the adversarial review-and-fix pass (convention 18: Opus reviewers for quality, bugs and plan adherence, steered by the phase doc, with the added lens "find a private copy of a shared component that this phase left or added"; verify each finding, fix the confirmed ones, re-green).
- Run the catalogue screenshot step: in requirements-board/ run node scripts/capture.ts --dry, fix what fails, then npm run capture (start root npm run dev in the background if 5173 or 5174 is down) with no failed recipe; look at the shots of the recipes the phase doc lists under "Recipes this phase breaks"; update ATLAS.md only where a hook moved; npm run verify:board green. Never edit a story's caption or status.
- Update the catalogue rows in aa-prototype/src/apps/demo/catalogue/ and their three tests, as the phase doc lists.
- Update PROGRESS.md: the status row starting "| U4 |", the entry "### Catch-up Phase U4 · Fields and search" with before and after copy counts, Decisions-log entries for questions 4, 5 and 6 and the readings, the handoff list (23, 24, 27, 33, 35, 36, 37, 39b, 40, 42, U5, U7) and the capture REPORT.md counts before and after.
- Patch the demo guide in the same session if any label, figure or control changed (none expected; "Other price", "Show resolved", "Tell the office", "Go to date" stay), in the Markdown and in master-demo-guide.html.
- Give me short, clear notes, ending with the "For the owner's review" list (also in the PROGRESS entry).

Phase goal: one field chrome, one fill rule (a grey well inside white sheets, cards and drawers, white on the page or phone canvas), one teal focus ring on every field and one height pair (48px in admin sheets, a compact 36px toolbar size), with SelectField, Checkbox, Switch, FieldHint and the extended TextField and TextArea migrated across the stable screens, NameSearchBox filled by the rule and replacing both Lists searches, shared date, jump-to-date and time parts, NumberStepper, a roving radio hook, ChipMultiSelect in the Contract panel, one calendar key model and month header, and the Contract chooser parts (OtherPriceCard, RailOptionGroup, StepRail) built once for ContractRail and the Billing card, so Phases 23, 24, 27, 36, 37 and 39b build on them, with every hook kept, no seed change and every visible change approved by a README question.
