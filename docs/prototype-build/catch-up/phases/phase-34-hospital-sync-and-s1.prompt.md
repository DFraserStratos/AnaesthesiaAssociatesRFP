Please run catch-up Phase 34 (Hospital sync, PDF upload and the S1 rebuild) of the Anaesthesia Associates prototype.

Before doing anything else, read these in order:
1. docs/prototype-build/catch-up/ROADMAP.md: the phase list, the sequencing rules (the Intake track 33 to 35; 34 runs after 33), the demo-trigger rules (product actions such as "Sync now" stay on the screen), the PWA-parity rules, the demo-guide rules (14 added an interim Future-scope caveat to S1; 34 rebuilds S1), and the "Confirm before building" row for 33 and 34 (FT-02.1 Verify, OQ-13).
2. docs/prototype-build/catch-up/phases/phase-34-hospital-sync-and-s1.md: your detailed plan.
3. docs/prototype-build/catch-up/GAP-ANALYSIS.md: everything before "## By epic" (especially theme 3, hospital intake; "Remove or rework" for RV-05 and RV-06; "Demo impact (S1 to S5)"; the intake cluster under "Demo-trigger buttons"; the OQ-13 line), then the EP-02 and EP-14 tables. Then docs/prototype-build/catch-up/epics/EP-02.md (US-02.1.5, US-02.2.1, FT-02.1) and epics/EP-14.md (FT-14.6), DM-28 in docs/prototype-build/catch-up/analysis/domain-model-delta.md, and RV-05, RV-06 and RV-13 in docs/prototype-build/catch-up/analysis/reverse-check.md.
4. The catalogue files this phase covers, in docs/discovery-reference/Updated Requirements/catalogue/:
   - requirements/US-02.1.5.md, FT-14.6.md and US-02.2.1.md;
   - for context, requirements/FT-02.1.md, FT-02.2.md, US-02.1.1.md, US-02.1.2.md, US-02.1.4.md, US-14.6.1.md, US-14.6.2.md, US-11.1.2.md, FT-14.4.md, and the Future items FT-14.1.md, FT-14.2.md, FT-14.3.md, FT-14.5.md and US-14.5.1.md;
   - questions/OQ-13.md and OQ-34.md.
   Also read section 1 ("What changed since the RFP"), the Booking "Sources" bullets and the "Matching screen" glossary entry of docs/discovery-reference/Updated Requirements/domain-model.md.
5. docs/prototype-build/catch-up/analysis/prototype-map-admin.md, prototype-map-shell-demo-pwa.md, prototype-map-store-seed.md and prototype-map-domain.md: the code index for the files you will change.
6. docs/design/Admin Review.dc.html (page anatomy, the KPI strip the sync tiles follow, the bannerIn motion), docs/design/Admin Day.dc.html (the side nav and its badge, the right-rail card) and docs/design/Design Language.dc.html (success, warning and error tints, pills, the future badge neutrals, value-tick and selection-slide motion, reduced motion). These are the AUTHORITATIVE visual reference (convention 17).
7. docs/prototype-build/PROGRESS.md:
   - the binding conventions (especially 4, 5, 7, 13 and 15 to 18);
   - the Phase 11 entries and Decisions-log entries on the integration simulation (the three feeds, the message shapes, the monitor as "proposed product UI, not demo-badged"), which this phase SUPERSEDES in part;
   - the entries for catch-up Phases 14, 15, 17, 20, 28, 31 and 33, for the trigger registry and its Future-scope badges, Booking.source, the hospital contact email, the default Contract, Slots and Draft Lists, and the matching screen with its row types, staging and decision actions.

Then do the drift check in the phase doc:
- run git diff 1f067a8 over the covered catalogue files, their context items, OQ-13, OQ-34 and domain-model.md;
- adjust the work items if anything changed, and drop and log anything now Retired or Future;
- confirm OQ-13's status and build the provisional cadence and row shape if it is still open;
- confirm Phases 14, 15, 17, 20, 28, 31 and 33 are DONE, and take the real names from 33 wherever the doc names a planned one (planned: ImportBatch and ImportRow in the intake slice, stageHospitalRows with its dedupe, importHospitalDownload, decideImportRow and suggestDecision, matchingAttentionCount, the /admin/matching route and its 'matching' nav section, HOSPITAL_DOWNLOAD_SAMPLES with SAMPLE_STG, SAMPLE_SX and SAMPLE_FORTE_SHEET, the two matching bar triggers, and the PWA stand-in matching-office-matches-row with officeMatchesHospitalRow in src/store/matchingDemo.ts);
- confirm Phase 14's context keys (integrations.tab and integrationsSim.selectedMessageId only; this phase adds intake.openPdfId);
- check whether 33 already re-pointed S4 Beat 4 and S5 Beat 2;
- note the current PERSIST_VERSION.
Then enter plan mode, turn the work items into session-sized steps, and wait for my approval.

While working:
- Mock backend only. Every write is a store action through the audited mutate(), with timestamps from the demo clock. Components never own domain state.
- No silent apply. A sync, a daily sheet, an uploaded PDF or a fired HL7 message never writes a Booking, List or Patient except through Phase 33's decision action. The only exception is the demo-only auto-match toggle: off by default, badged Future scope, limited to isAutoMatchEligible rows, audited under its own actor.
- Only St George's and Southern Cross sync. The five other providers are daily sheets imported by hand, never labelled a feed. The sync pulls on a schedule, on opening the matching screen and on Sync now; each hospital shows its last successful sync and any failed attempt; a failed sync loses nothing and the next good sync catches up.
- Scheduled pulls run on the demo clock only: a clockAdvanced event and a wired job, no setInterval, no Date.now(), no new Date(), no Math.random(). A clock jump runs one catch-up pull. The on-open pull must be a no-op at the same demo instant so StrictMode does not double it.
- Do not extend the HL7/FHIR simulator, the message model, the retry engine or feed mapping. Move the message log and feed mapping off Admin onto the Future-scope demo surface, unchanged in behaviour. Keep Surgeon PDFs, Data quality and the NHI validators in Admin under Intake, with redirects from the old routes.
- Reuse Phase 33, do not fork it: synced rows and daily sheets enter only through stageHospitalRows (a new 'sync' channel value; sheets use 'manualSheet'), so its dedupe stops a row staged twice by sync and hand import; the S1 sync row is built from SAMPLE_STG R1; Forte's daily sheet is SAMPLE_FORTE_SHEET; Phase 33's Matching and the old Integrations nav items merge into one Intake item under Day view, and every Phase 33 route, trigger, link and spec aimed at /admin/matching follows it to /admin/intake/matching.
- Seed hygiene: append the three new hospitals so the canvas stays byte-identical; keep sync fixtures, sheets and upload samples off every scripted-beat List and Booking, and pin them in demoScenarios.test.ts; never persist PDF facsimiles. Bump PERSIST_VERSION by one (once more in session 2 if it runs separately).
- Pure logic (the schedule, availability windows, auto-match eligibility, PDF row validation) lives in src/domain with Vitest tests.
- Demo triggers go in Phase 14's registry only, never on the Control Panel page: Simulate scheduled pull, Fail next sync, Deliver hospital sheet and Auto-match (Future scope) on the matching screen (harness bar); the HL7 entries only on the Future-scope surface; the PWA-only stand-in "Hospital sync delivers my booking" on Mobile Lists. Sync now and Upload PDF (with its badged sample picker) are product buttons on their screens. Bodies live in src/store or src/shared so pwaPurity holds.
- Design: the sync tiles follow the Admin Review KPI strip; token tints for Synced, Failed and Provisional; teal the only action colour; no crimson on tiles, pills or banners. No en or em dashes in any app copy.
- S1 is the headline scenario: rebuild it in this phase (Control Panel S1 text and nav, the run sheet, the master guide), not later.
- Keep npm run build, npm run build:pwa and npx vitest run green as you go.
- Do not commit or push.

When done:
- run the manual test checklist and report each item;
- confirm npm run build, npm run build:pwa, npx vitest run and npm run shots are green, and npm run verify:board after the capture-recipe changes (session 2, work item 17, including the new US-02.1.5 recipe);
- run the adversarial review-and-fix pass (convention 18: fan out three Opus review subagents for quality, bugs/correctness and plan adherence, steered by the phase doc's bullets; independently verify each finding; fix the confirmed ones; re-green);
- update PROGRESS.md: the status row and a phase entry (drift-check result, OQ-13 status and the provisional cadence, the real Phase 33 names used, what moved to the Future-scope surface, the PERSIST_VERSION from and to, the pinned fixtures, tests added, the review pass), the Decisions-log entries listed in the phase doc (superseding the Phase 11 monitor reading and closing Phase 14's interim badges), the convention 4 amendment, and the handoff notes for 35, 40, 42, 43 and 44;
- patch the demo guide in the same session: S1 rebuilt, S4 Beat 4 and S5 Beat 2 if 33 did not, Direct URLs, run orders, narrate and recovery sections in docs/demo-guide/03-demo-script.md; the cheat sheet, workflows, personas and README; the same sections of master-demo-guide.html; and the Control Panel scenario text. Finish with a consistency read of those master-guide sections against the run sheet;
- give me short, clear notes on what changed and anything left open.

Phase goal: St George's and Southern Cross sync into the matching screen on a schedule, on open and on Sync now, with last-synced and failed-sync state and nothing applied until the office decides; other providers' daily sheets arrive by hand import with a badged auto-match demo; surgeon PDFs can be uploaded and corrected, DOB and ethnicity included; the HL7/FHIR tooling sits on a separate Future-scope surface; and S1 tells the sync-then-match story.
