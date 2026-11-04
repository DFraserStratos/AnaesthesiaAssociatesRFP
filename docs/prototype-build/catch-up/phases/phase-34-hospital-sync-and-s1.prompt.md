Please run catch-up Phase 34 (Hospital sync, the rooms' PDF lists and the S1 rebuild) of the Anaesthesia Associates prototype. It is two sessions with a cut line; say at the start which session this is.

Before doing anything else, read these in order:
1. docs/prototype-build/catch-up/ROADMAP.md: the owner decisions table (D51 answered 4 November: both intake sources in the first release on one matching screen; D52 part 2 assumed, part 1 open; D16 extended by 20's step rail, a working direction; D33; D66), the phase list and sequencing rules (34 runs after 33 and 33a), the demo-trigger, PWA-parity and demo-guide rules, the "Catalogue screenshots" rule and "Owner review: agents test themselves".
2. docs/prototype-build/catch-up/phases/phase-34-hospital-sync-and-s1.md: your detailed plan, including the session cut line.
3. docs/prototype-build/catch-up/GAP-ANALYSIS.md before "## By epic" (theme 8, "Remove or rework", the intake cluster under "Demo-trigger buttons"), then the EP-02 and EP-14 tables; docs/prototype-build/catch-up/epics/EP-02.md and EP-14.md; DM-61, DM-34, DM-51 and DM-58 in analysis/domain-model-delta.md; RV-12 to RV-16 in analysis/reverse-check.md.
4. The catalogue files the phase doc covers, in requirements-board/requirements/ (stories/US-02.1.5.md, EP-14.md, FT-02.2.md, US-02.2.1.md with their 4 November notes; for context FT-02.1, US-02.1.1 to US-02.1.4, US-02.2.3, US-02.5.4, US-02.5.7, US-03.1.9, US-04.3.3, US-04.3.4, FT-02.6 and US-02.6.1; questions/OQ-108.md, OQ-109.md, OQ-13.md, OQ-118.md, OQ-99.md, OQ-78.md), and artifacts/AR-35.md with its note's "Illustrative source wording" heading (AI-made, not from AA). Read cited passages with npm --prefix requirements-board run source -- --item <ID> --text (Node 22.18 or newer).
5. The prototype maps the phase doc's Reference names, and requirements-board/requirements/capture/ATLAS.md.
6. docs/design/Admin Review.dc.html, Admin Day.dc.html and Design Language.dc.html (the AUTHORITATIVE visual reference, convention 17).
7. docs/prototype-build/PROGRESS.md: the binding conventions (4, 5, 7, 13, 15 to 19), the Phase 11 and Phase 14 Decisions-log entries this phase supersedes (the monitor as product UI, Christchurch Public as a live feed, Surgeon PDFs in scope with its direct ingest), and the entries for Phases 14, 15, 17a, 20, 20a, 21, 33 and 33a for their real names.

Then do the drift check in the phase doc: run node requirements-board/agent/skills/update-build-plan/tools/plan-state.mjs --diff with the IDs it lists, against baseline a68f09b; stop and tell me in the cases it names (a sync mechanism returning, a third integrated hospital, US-02.2.1 back in Future Work, OQ-108 reversed, a hospital default Contract); confirm 33 and 33a are DONE and take their real names (the row source for rooms rows, stageImportRows, correctImportRow, the Stub and its resolve path), and 20's step rail names. Then plan the session's steps and start building without waiting for my approval.

While working:
- Invoke the /frontend-design:frontend-design skill before building or reshaping any UI, inside this repo's design system (docs/design and src/theme stay authoritative).
- Mock backend only; every write a store action through mutate() with demo-clock timestamps; components own no domain state.
- No silent apply and no direct write: synced rows, PDF list rows and fired HL7 messages reach a Booking, List or Patient only through 33's decision or 33a's resolve. ingestPdfRow and its callers go.
- No invented sync mechanics: a Simulate sync demo action per integrated hospital; no schedule, pull on open, Sync button, last-synced time or persisted sync state. The two hospitals are named once, in INTEGRATED_HOSPITALS (OQ-109 part 1 open; part 2 assumed, labelled once). Christchurch Public stops being a live feed.
- The rooms' PDF lists are product, unbadged: stored SurgeonPdfList records (seeded deterministically, one PERSIST_VERSION bump), Upload PDF list with a badged sample picker (simulated reading, no OCR, no mailbox), corrections kept with who and when, the wording kept as read, Send to matching through stageImportRows with the rooms as source; a re-sent List matched by surgeon, hospital, date and session (our reading, one pure function, labelled); removed-patient detection is Future Work.
- Do not extend the HL7/FHIR simulator; move the log and mapping to the Future-scope surface unchanged.
- Wording as received and the Contract by the office: rows carry AR-35 wording verbatim; nothing picks a Contract except the stand-in's scripted rail answer (the patient, not prepaid: No contract (RVG)); no "default Contract" anywhere.
- Demo triggers in Phase 14's registry only, bodies in src/store or src/shared (pwaPurity holds).
- Session 1 ends green (build, build:pwa, vitest) with a short PROGRESS note. If it runs long, the re-sent-differences trigger opens session 2. Session 2 never squeezes the S1 rebuild: the Intake home shrinks to a plain grouping first.
- No en or em dashes in app copy, never the word "slot", teal the only action colour, no crimson on rows, pills or banners.
- Do not commit or push.

When done (end of session 2):
- run the manual test checklist yourself in the running app (Playwright or the /run skill, screenshots checked by eye) and report each item pass or fail with evidence;
- confirm npm run build, npm run build:pwa, npx vitest run, npm run shots and npm run verify:board are green;
- run the adversarial review-and-fix pass (convention 18) steered by the phase doc's bullets; re-green;
- run the catalogue screenshot step as the phase doc's "Catalogue screenshots" section sets out (recipes, node scripts/capture.ts --dry, then a full npm run capture with no failed recipe, ATLAS.md, npm run verify:board);
- patch the demo guide as the phase doc lists (S1 rebuilt with the sync, the stub, the step rail and the PDF beat; S4 Beat 4 and S5 Beat 2 if 33 did not; the cheat sheet, workflows, personas, README, master-demo-guide.html and the Control Panel text), finishing with the S1 consistency read;
- update PROGRESS.md (status row, phase entry, Decisions log, convention 4, handoffs) as the phase doc lists;
- give me short notes on what changed and anything open, ending with the "For the owner's review" list.

Phase goal: rows from St George's and Southern Cross arrive on the matching screen through Simulate sync, and the rooms' PDF lists are uploaded, corrected and sent there as rows, a re-sent List showing its differences, nothing applied until the office decides; Christchurch Public stops being a live feed and the HL7/FHIR tooling moves to a Future-scope surface; and S1 tells the sync-then-match story with the wording kept as received, a no-NHI booking waiting as a stub, and the office answering who pays through the step rail.
