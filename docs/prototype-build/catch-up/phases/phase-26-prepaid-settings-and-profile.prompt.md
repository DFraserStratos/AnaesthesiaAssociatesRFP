Please run catch-up Phase 26 (Anaesthetist profile and bank details) of the Anaesthesia Associates prototype.

The app is aa-prototype/ (the phase doc's src/ paths are relative to aa-prototype/, and its Playwright specs live in aa-prototype/visual/). Paths below are relative to the repo root.

Before doing anything else, read these in order:
1. docs/prototype-build/catch-up/ROADMAP.md: the owner decisions table (D64: prepaid is a Contract setting, nothing about prepayment on the profile, the GST period goes too), the Profile track, the sequencing note "26 needs nothing unbuilt" (before 38 and 40a), the PWA parity section and the "Catalogue screenshots" rule.
2. docs/prototype-build/catch-up/phases/phase-26-prepaid-settings-and-profile.md: your detailed plan.
3. docs/prototype-build/catch-up/analysis/reverse-check.md (RV-02), domain-model-delta.md (DM-32, the anaesthetist half; DM-33 was merged into it; DM-19 is gone) and the GAP-ANALYSIS.md and epics/EP-12.md rows for FT-12.1, US-12.1.1 and US-12.1.4.
4. The catalogue, in requirements-board/requirements/:
   - stories/FT-12.1.md, US-12.1.4.md and US-12.1.1.md (covered or built here);
   - for context, stories/US-12.1.2.md (Retired: the GST period), US-12.2.2.md (the monthly GST report, Phase 38), US-08.4.5.md (the GST number, Phase 22's, office-held) and FT-06.1.md (Retired: no prepaid settings on the profile);
   - questions/OQ-14.md (bank details in the system, on the profile) and OQ-52.md (one identifier, the HPI CPN);
   - domain-model.md: the anaesthetist profile and the HPI CPN glossary row;
   - To see why an item says what it says, run npm --prefix requirements-board run source -- --item <ID> --text and read only the cited passages (needs Node 22.18 or newer on PATH).
5. The analysis maps for the code you will change: docs/prototype-build/catch-up/analysis/prototype-map-apps-mobile-web.md (More tab, web routes, Accounts GST tab), prototype-map-admin.md section 9 (Master data), prototype-map-store-seed.md (masters and the seed cast) and prototype-map-shell-demo-pwa.md (the PWA More panel and pwaPurity).
6. requirements-board/requirements/capture/ATLAS.md (the recipe format, routes, ids and hooks the catalogue's screenshot recipes depend on) and the "Catalogue screenshots" rule in docs/prototype-build/catch-up/ROADMAP.md.
7. Design: docs/design/Design Language.dc.html (tokens, pills, mono data), Mobile App.dc.html (card and row anatomy, bottom sheets, sticky primary action), Web Dashboard.dc.html (top nav, panels) and Admin Review.dc.html (table anatomy). No mockup has a profile screen: extend these patterns, do not invent new ones.
8. docs/prototype-build/PROGRESS.md:
   - the binding conventions;
   - the Decisions log entries this phase supersedes or must honour: 2026-07-21 (navigation structures: the web app keeps its four tabs), 2026-07-23 Phase 07 build decisions (office-only master data), 2026-07-24 Phase 13 (the persona avatar treatment on More), 2026-09-28 (the anaesthetist's Booking shows no calculation), and the entries Phases 17 to 25 wrote;
   - the PROGRESS entries for catch-up Phases 14 (where the PWA demo-actions chip landed), 17 (the HPI CPN helpers, label and duplicate refusal, the Admin anaesthetist record page, the officePrivate slice and officePrivacy.test.ts) and 28 (the start date on the record page and add form), and for 22 and 25 if they have landed (Anaesthetist.gstNumber; the pricing snapshot that copies the unit value).

Then do the drift check in the phase doc:
- Run node docs/prototype-build/catch-up/tools/plan-state.mjs --diff <IDs> (baseline d4db277) for the IDs the doc lists, re-read anything changed, and drop anything now Retired or Future (noting it for PROGRESS.md).
- Build the answers as answered, with no provisional label: OQ-14, OQ-52 and D64.
- Confirm US-12.1.4 (Verify) still puts bank details in the system and names one HPI CPN, and that US-12.1.1 still lets the anaesthetist set their own rate. If any reading changed, apply the "If it has changed" column of the phase doc's table; anything that changes the shape of the work, build the doc's default and log it.
- Check whether Phases 22 and 25 have landed and apply the doc's drift-check step 4 (the rate note and the lock test; gstNumber left alone).
- Run grep -rn gstPeriod aa-prototype/src and list every hit before you start removing it.
- Record the current PERSIST_VERSION (25 at plan time).

Then write a plan: map the phase doc's work items onto the files as the earlier phases actually left them, then start building without waiting for my approval (ROADMAP.md "Owner review: agents test themselves").

While working:
- Invoke the /frontend-design:frontend-design skill before building or reshaping any UI (screens, sheets, panels, rows, pills, empty and error states), and apply it inside this repo's design system: the docs/design files and src/theme tokens stay authoritative (convention 17, ROADMAP.md "Front-end design"), so use the skill for layout, hierarchy, spacing, states and finish, never for a new palette, typeface or visual language. Store, seed and pure-domain steps do not need it.
- The profile holds the dollar value per unit, contact details, registration, HPI CPN and the bank account, nothing else. There is no GST period, no GST number (Phase 22's field stays office-held in Master data), no prepaid setting, tick list or own-price-list view, and no "on behalf of" audit field. Never write "estimate" or "deposit" anywhere.
- Remove the GST period completely (RV-02): the type, the seed (Whitaker's six-monthly), fixtures, the store patch and add fields, the Add and Edit forms, the record page, the Master data column, GST_OPTIONS, the audit label and the web GST report's period switch, which now shows the calendar month until Phase 38 rebuilds it. Bump PERSIST_VERSION once.
- One Anaesthetist record, one unit value, one identifier. The profile edits Anaesthetist.unitValue, the field fees read and Phase 25's snapshot copies. The HPI CPN stays the one hpiId field, labelled "HPI CPN" everywhere, checked with Phase 17's helpers.
- Permissions are enforced in the store. The anaesthetist edits only their own rate; the office edits everything (bank, HPI CPN, contact, active); nobody edits the registration number; any role 'system' actor edits nothing. Refusals render verbatim. Every write goes through mutate() and is audited, the bank number masked in the audit. A no-change save writes no audit entry.
- Bank details are display-only: masked on the anaesthetist's screens and in the audit, full only in the office's edit field. The payables run shows each destination (or a warning-tone "No bank account on file") and snapshots it on the disbursement; it holds, reroutes or re-amounts nothing. No seeded payout changes. Seeded numbers are built from the registration number on non-issued bank code 99, and nothing draws from the seeded RNG.
- Privacy: the profile and its selectors read masters only, never the officePrivate slice or a tier or pairing audit entry. Phase 17's officePrivacy.test.ts and pwaPurity.test.ts stay green; the shared ProfileRow lives in src/shared/profile and imports nothing from apps/.
- Admin: extend Phase 17's anaesthetist record page with a Profile card; do not build a second editor. Keep Unit $ the third column of the Master data table.
- Design: mobile edits the rate in a bottom sheet with a sticky teal Save, never a desktop form; the web profile is a desktop layout reached from the persona block, and the four nav tabs are unchanged. Teal is the only action colour, crimson is identity only, "Not on file" is a neutral or warning-tone pill, and account numbers, the HPI CPN and registration are mono.
- No en dashes or em dashes in any app-facing copy.
- Mock backend only, deterministic (no Date.now, new Date or Math.random).
- Demo triggers: none. Add no trigger-registry entry and leave the Control Panel alone.
- Build nothing ahead of the plan: no prepayment (Phase 27), GST schedule or report rebuild (38), payout history, payout hold, bank verification or modulus check, HPI CPN register lookup (40a only unifies the label), login (43a) or notifications.
- Keep npm run build, npm run build:pwa and npx vitest run green at the end of the session.

When done:
- Run the manual test checklist yourself in the running app (Playwright or the /run skill, screenshots checked by eye; never hand it to me) and report each item pass or fail with its evidence.
- Run npm run build, npm run build:pwa, npx vitest run, npm run shots and npm run verify:board, all green, with no S1 to S5 figure moved and PERSIST_VERSION bumped once.
- Run the adversarial review-and-fix pass (PROGRESS convention 18): fan out Opus review subagents for quality, bugs/correctness and plan adherence, using the phase doc's steer list. Independently verify each finding, fix the confirmed ones with tests, and re-green.
- Run the catalogue screenshot step (ROADMAP.md "Catalogue screenshots", PROGRESS convention 19): run node docs/prototype-build/catch-up/tools/recipe-status.mjs 26, then update the capture recipes for US-12.1.4 and US-12.1.1 as the phase doc's table says, set the recipes for the Retired US-06.1.1, US-06.1.2, US-12.1.3 and US-12.1.2 absent with the reason "Retired", update every recipe this phase touched (US-01.1.3, the payables recipes, 17's record-page recipes); in requirements-board/ run node scripts/capture.ts --dry, fix what fails, then a full npm run capture (start root npm run dev in the background if 5173 or 5174 is down) with no failed recipe; look at the covered items' new shots; update requirements-board/requirements/capture/ATLAS.md where routes, ids or hooks changed; npm run verify:board green.
- Update PROGRESS.md: status row, phase entry with the drift-check result, the review pass and the catalogue screenshot result (REPORT.md counts before and after), DM-32's anaesthetist half recorded as built, the Decisions-log entries listed in the phase doc, and the handoff notes for 25, 36, 37, 38, 39a, 40a and 42.
- Patch the demo guide sections the phase doc names (personas and permissions with "HPI CPN" and the profile, the workflows profile case, the cheat sheet permission matrix row and payables and GST notes, the README feature row) and the same sections of master-demo-guide.html.
- Do not commit. Give me short, clear notes on what changed and the "For the owner's review" list (also in the PROGRESS entry): readings logged for my end-of-catch-up review rather than asked now.

Phase goal: give each anaesthetist a profile they can see on mobile and web (contact details, registration, HPI CPN, a masked display-only bank account and the dollar value per unit, which is the only setting they edit), let the office hold and edit it on the Admin record page with every edit audited, show the destination account on the payables run, and remove the GST period from the prototype everywhere, leaving the GST report in calendar months for Phase 38.
