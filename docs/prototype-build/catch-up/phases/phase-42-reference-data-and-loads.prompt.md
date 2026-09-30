Please run catch-up Phase 42 (Reference data and controlled loads) of the Anaesthesia Associates prototype.

Before doing anything else, read these in order:
1. docs/prototype-build/catch-up/ROADMAP.md: the phase list, the sequencing rules (42 runs after every master-data phase: 17, 18, 19, 29 and 30; 43 follows it), and the demo-trigger and demo-guide rules.
2. docs/prototype-build/catch-up/phases/phase-42-reference-data-and-loads.md: your detailed plan.
3. docs/prototype-build/catch-up/GAP-ANALYSIS.md: everything before "## By epic" (especially theme 9, master data and surgeon model, and the "Oversight/NFR" demo-trigger line), then the EP-13 and EP-11 tables. Then docs/prototype-build/catch-up/epics/EP-13.md (US-13.4.1, US-13.4.2, US-13.4.3) and epics/EP-11.md (US-11.4.1), plus DM-32 in analysis/domain-model-delta.md.
4. The catalogue files this phase covers, in docs/discovery-reference/Updated Requirements/catalogue/:
   - requirements/US-13.4.1.md and US-11.4.1.md (Confirmed), US-13.4.2.md and US-13.4.3.md (Proposed);
   - for context, requirements/FT-13.4.md, US-01.5.1.md, US-05.1.6.md, US-05.1.5.md and US-04.2.4.md;
   - questions/OQ-51.md (Open: the Solutions Plus identifiers).
   Also read sections "1. What changed since the RFP" (the clean-cut row), "Surgeon, surgeons' room and blacklist", "RVG code and modifier master" and "Reference data and go-live" of docs/discovery-reference/Updated Requirements/domain-model.md.
5. docs/prototype-build/catch-up/analysis/prototype-map-admin.md (section 9, Master data), prototype-map-store-seed.md (mutate, allocateId, the masters actions, the seed) and prototype-map-shell-demo-pwa.md (the trigger registry and the PWA import closure): the code index for the files you will change.
6. docs/design/Design Language.dc.html (tokens; teal the only action colour, crimson identity only; the semantic success, warning and error trios; pills, tables and sheets; colour is never the only signal), docs/design/Admin Review.dc.html (the Admin table, header and four-tile summary the result panel and go-live view follow), docs/design/Admin Day.dc.html (the side nav and page chrome) and docs/design/Web Availability.dc.html (the month cell anatomy 30's hospital calendar reuses). These are the AUTHORITATIVE visual reference (convention 17). No mockup shows Master data, a loader or a go-live screen, so extend these patterns.
7. docs/prototype-build/PROGRESS.md:
   - the binding conventions (especially 4, 5, 7, 13 to 15, 17 and 18);
   - the Decisions-log entries this phase supersedes or amends: the Phase 07 master-data readings (several masters view only), Phase 17's "no delete or deactivate actions; Phase 42 owns them", and Phase 30's decision 9 (hospital holidays edited and deleted per hospital) together with the seed's per-hospital statutory holiday rows;
   - the catch-up Phase 14, 17, 18, 19, 23, 25, 29, 30 and 34 entries and their handoff notes for 42: the trigger registry, useDemoTriggerContext and the shared actor constants (14); the ?view= param, the masters/ folder split, editHospital and isPlausibleEmail (17); the Contract record, FeeScheduleLine, Contract retire and the protected-default minting (18); ProcedureType, rvgGroups and the modifier master (19); Contract base-unit overrides (23); Contract versions (25); the Slot status master (29); the conflict reconcile in mutate(), HolidaySheet, editHospitalHoliday and deleteHospitalHoliday (30); 31's Draft List holiday warning; the hospitals 34 appended and its INTEGRATED_HOSPITALS / HOSPITAL_SYNC_SCHEDULE. Note that 19's and 23's handoffs ask 42 to make modifier groups editable and to load Contract rules; the phase doc declines both (Out of scope, Decisions 8 and 9).

Then do the drift check in the phase doc:
- run git diff 1f067a8 over the covered catalogue files, OQ-51 and domain-model.md;
- adjust the work items if anything changed, and drop and log anything now Retired or Future;
- check US-13.4.3's re-load question and OQ-51, and apply the interim or the answer as the doc says;
- confirm Phases 17, 18, 19, 29 and 30 are DONE (and note 23, 25 and 34), and note the names they chose;
- record the seed's flagged-List set, grep every picker that offers hospitals, surgeons, rooms, groups or insurers, grep every reader of hospital holidays (masters.holidays and 30's index), and grep for stored copies of master names;
- note the current PERSIST_VERSION.
Then enter plan mode, turn the work items into a plan (two sessions: session 1 is items 1 to 10 and stops green; session 2 is items 11 to 19; the doc's size warning gives the fallback split and the trim order), and wait for my approval.

While working:
- Mock backend only. Every write goes through a store action and the audited mutate(), with before and after metas and demo-clock timestamps. Components never own domain state; the file input only hands CSV text to a store action.
- Loads never go around the guards. Stage validates and reports without touching masters. Commit re-validates, then loads exactly the valid rows in one mutate(), through the same create planners and validators the manual Add uses. A rejected row never reaches master data, and nothing loads partially. A load adds and never overwrites (the provisional US-13.4.3 reading).
- One set of rules: every rejected-row reason is word for word the manual action's refusal, proven by a parity test.
- Clean cut: Solutions Plus supplies operation names only. Its units are never read, junk such as "10% discount" is excluded and cannot be approved, only AA-approved names load, and loaded values come from the controlled spreadsheets. No Solutions Plus identifier is carried while OQ-51 is open.
- Masters referenced by identity retire, never delete. Retire needs a reason and refuses while upcoming work depends on the record. Pickers hide retired records; every display keeps resolving them. Protected default Contracts are never retired.
- Public holidays are one master calendar that raises conflicts through 30's derived rule, with no stamping. Every holiday reader (canvas generator, horizon advance, Permanent List regenerate, conflict preview, 31's Draft List warning) goes through closuresFor / closuresIndex, so none loses Labour Day when the per-hospital rows go. The migration from per-hospital rows must not move the flagged-List set. Regenerate only the golden fixture's conflicts column and bump PERSIST_VERSION by one.
- Demo triggers: register "Load sample spreadsheet" and "Go-live data load (demo)" in Phase 14's registry, bar only, on Admin Master data only. They stage and never load by themselves. Keep the bodies in src/shared and the sample fixtures in src/domain, so pwaPurity.test.ts holds. Add nothing to the Control Panel page. There is no PWA stand-in: nothing here is mobile.
- Design: one pattern across every Master data view (grouped sub-nav, the shared header, Show retired, edit sheet with Retire and Reinstate, Load from spreadsheet); admin sheets go through useSurface().Overlay; the result panel is an Admin Review style table; teal the only action colour; every outcome pill carries its word; no en or em dashes in any app copy.
- Keep npm run build, npm run build:pwa and npx vitest run green as you go. Add Vitest tests for the CSV parser, validateSheet and every spec, the rule-parity test, masterLifecycle and retire blockers, holidays and the conflict extension, the load and go-live store actions (including stale re-validation and no partial load), the Solutions Plus rules, the US-13.4.1 coverage test, the pickers, the triggers and the seed invariants.
- Do not commit or push.

When done:
- run the manual test checklist and report each item;
- confirm npm run build, npm run build:pwa, npx vitest run and npm run shots are green, and that pwaPurity.test.ts still passes;
- run the adversarial review-and-fix pass (convention 18: fan out three Opus review subagents for quality, bugs and plan adherence, steered by the phase doc's bullets; independently verify each finding; fix the confirmed ones; re-green);
- update PROGRESS.md:
  - the status row and a phase entry, including the drift-check result, the flagged-List set before and after, the stored-name copies found, the PERSIST_VERSION from/to, the tests added and the review pass;
  - the Decisions-log entries listed in the phase doc (the master public-holiday calendar, retire never delete, rename follow-through, insurers in full, check-then-commit loads, add-only CSV loads, Solutions Plus names only, modifier groups kept in code, overrides read as base-unit overrides and the sync set-up kept in code);
  - the handoff notes for 43 and 44;
- patch the demo guide in the same session:
  - 03-demo-script.md: the optional S5 Beat 5, the S5 discovery points and the Direct URLs;
  - the cheat-sheet, persona and workflow lines;
  - the same sections of master-demo-guide.html, word for word;
  - the Control Panel's S5 scenario text;
- give me short, clear notes on what changed and anything left open.

Phase goal: every reference table is maintained in Admin Master data in one consistent pattern, including hospitals, insurers and a master public-holiday calendar; controlled spreadsheets load with row validation and rejected rows listed with reasons; and a clean-cut go-live demo loads only AA-approved data, never Solutions Plus junk or unit values.
