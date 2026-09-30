Please run catch-up Phase 40 (Patients: missing NHI, unpaid alert, patient view) of the Anaesthesia Associates prototype.

Repo root: /Users/d.fraser/Local Dev/Anaesthesia Associates RFP (paths below are relative to it; quote them, the folder names contain spaces). The app is aa-prototype/. Follow CLAUDE.md at the repo root.

Before doing anything else, read these in order:
1. docs/prototype-build/catch-up/ROADMAP.md: the phase list, the owner decisions table (D11, whether a Booking can exist without an NHI), the sequencing rules (40 runs after 34 and 36), the demo-trigger, PWA-parity and demo-guide rules, and the "Confirm before building" row for 40 (US-11.1.4 Open, US-11.3.2 Verify, OQ-49, OQ-41, OQ-30).
2. docs/prototype-build/catch-up/phases/phase-40-patients-and-alerts.md: your detailed plan.
3. docs/prototype-build/catch-up/GAP-ANALYSIS.md: everything before "## By epic" (especially the DM-25 row and the RV-21 row), then the EP-11, EP-13 and EP-03 tables. Then docs/prototype-build/catch-up/epics/EP-11.md (US-11.1.1, US-11.1.4, US-11.1.5, US-11.3.1, US-11.3.2, US-11.3.3), epics/EP-13.md (US-13.2.2) and epics/EP-03.md (US-03.1.5); DM-25 (and DM-18, DM-19 for the ledger you read) in docs/prototype-build/catch-up/analysis/domain-model-delta.md; and RV-21 in analysis/reverse-check.md.
4. The catalogue files this phase covers, in docs/discovery-reference/Updated Requirements/catalogue/:
   - requirements/US-11.1.1.md, US-11.1.4.md, US-11.1.5.md, US-11.3.1.md, US-11.3.2.md, US-11.3.3.md, US-13.2.2.md and US-03.1.5.md;
   - for context, requirements/FT-11.1.md, FT-11.3.md and US-11.1.2.md;
   - questions/OQ-49.md, OQ-41.md, OQ-30.md and OQ-33.md.
   Also read the "Patient and billable party" section of docs/discovery-reference/Updated Requirements/domain-model.md. The catalogue images for US-11.1.1, US-11.1.4, US-11.3.2 and US-11.3.3 are screenshots of the current prototype, not the target.
5. docs/prototype-build/catch-up/analysis/prototype-map-admin.md (routes and nav, Card detail, Review, Invoices, Billing monitor and its "Prior balance" tag, Integrations Data quality, Master data), prototype-map-store-seed.md (intake, selectors, the patient and history seed), prototype-map-apps-mobile-web.md (the List and Booking views where the NHI renders) and prototype-map-shell-demo-pwa.md (the PWA closure, pwaPurity and the office simulation): the code index for the files you will change.
6. docs/design/Design Language.dc.html (tokens, the warning and error tints, pills, mono numbers), docs/design/Admin Review.dc.html (the tile and table anatomy the patient record and lists extend, and the flag pills), docs/design/Admin Day.dc.html (the side nav and the List drawer's Needs attention box) and docs/design/Mobile App.dc.html (the List row where "NHI missing" appears). These are the AUTHORITATIVE visual reference (convention 17). No mockup covers a patient record or a problem list: extend these patterns and the existing Data quality list.
7. docs/prototype-build/PROGRESS.md:
   - the binding conventions (especially 4, 5, 8, 9, 10, 13 to 18);
   - the Decisions-log entries this phase supersedes or amends: the 2026-07-22 third external plan review finding #5 (NHI optional, the provisional "NHI pending" patient); the Phase 10 entry's WI2a reading (deviation 3, the intake balance banner on the billing monitor row); the 2026-07-27 pre-workshop fix 10.2 ("Prior balance" reads any open prior episode); Phase 07's "authorise is never gated by flags" as Phase 21 amended it;
   - the catch-up Phase 14, 15, 17, 21, 22, 27, 33, 34, 35 and 36 entries and handoff notes, for the trigger registry and actors, the Booking names, the surgeons' rooms and hospital emails, authoriseBlockersFor, resendInvoice, the alert level vocabulary, the import rows and decisions, the sync and daily sheets and the rebuilt S1, the mailto builder, and patientLedgerPosition.

Then do the drift check in the phase doc:
- run git diff 1f067a8 over the covered and context catalogue files, the four OQs and domain-model.md;
- adjust the work items if anything changed, and drop and log anything now Retired or Future;
- confirm whether the owner has answered D11 (default: the Booking may exist as provisional, it is listed on Missing NHI, and its List cannot be authorised until the NHI is added); if not, build the default and label it provisional; if it was answered, build that branch as the phase doc describes;
- note the status of OQ-41 (default: 90 days counted from the invoice date, provisional) and OQ-30 (the prototype keeps Appendix 2: NHI never in Xero);
- confirm Phases 34 and 36 are DONE, and note the real names of 14's OFFICE_ACTOR, OFFICE_SIMULATION_ACTOR and authoriseAsSimulatedOffice, 33's ImportRow, HOSPITAL_DOWNLOAD_SAMPLES, importHospitalDownload, stageImportRows and decideImportRow (and how its matcher proposes a target for a row whose NHI no Booking holds), 34's deliverDailySheet and daily-sheet fixtures, 36's patientLedgerPosition and its row fields, 21's authoriseBlockersFor, 22's resendInvoice and 35's mailto builder;
- note the current PERSIST_VERSION.
Then enter plan mode, turn the work items into ordered steps (settings, model, pure rules and store first, then the intake hooks, the authorise gate and seed, then the Admin Patients screens, the Booking, review and mobile and web wording, then triggers, tests and docs), and wait for my approval.

While working:
- Mock backend only, and the ledger is the truth. The patient record's invoices and balance read Phase 36's patientLedgerPosition through store selectors, never state.xero. Seeded backdrop history counts on the patient record but stays off the office's Invoices list and monitor.
- One record per NHI. No path may create a second record for an NHI. Only the office (or the PWA stand-in) attaches an NHI, from Missing NHI, the patient record, or a matching-screen apply-to-existing decision on a row that carries it. Attaching an NHI that already exists merges the provisional record into it in one audited mutate: every Booking, ledger pair, alert and follow-up is re-pointed, the provisional row is deleted, and a redirect is kept. Details that differ are held for the office to review, never written over the record.
- The NHI is required (D11). A Booking without one is provisional: it can be created, it is listed on Missing NHI, and authoriseBlockersFor gains an nhiMissing blocker, so the List cannot be authorised. Submission and completion are not blocked. The office simulation and the PWA "Office authorises this List" inherit the refusal.
- "NHI missing" is the only label for the state, from nhiBadge, on every surface. "NHI pending" disappears. The anaesthetist sees the NHI or "NHI missing", and never patient money or the unpaid alert.
- The unpaid alert is raised when a Booking is created or matched (every createBooking path, the matching screen's apply-to-existing decision, PDF update-by-NHI and the NHI attach). It fires for an invoice unpaid strictly longer than the threshold, counted from the invoice date in one function, and is stored as a snapshot with the threshold used. A 30-day-old invoice raises nothing. Remove patientHasOutstandingPriorEpisode and the "Prior balance" pill; the monitor shows an "Unpaid alert" pill from the stored alert.
- The threshold lives in a new appSettings record (seeded 90, office-editable in Master data, audited), not in DemoSettings. A change applies to the next check only.
- Follow-ups (call, note, reminder, resend) are stored, office-only and audited. Resend goes through Phase 22's resendInvoice. The NHI request email is a real mailto link built with Phase 35's builder, allowlisted: no DOB, no NHI, no money, no notes.
- Pure rules (invoiceAgeDays, overdueForAlert, missingNhiLevel, detailDifferences) live in src/domain/patients with Vitest tests. Time comes from the demo clock only; no Date.now(), new Date() or Math.random(); the PWA stand-in's synthetic NHI is deterministic.
- Seed: append Noah Prescott's existing record (NHI ZAP3016) AFTER the generated patient pool, at the next free id (PT0152 unless an earlier phase appended one). Never add it to PINNED: PT0020 is the first generated patient, so a pinned row would renumber 132 patients. Add three Sharma history invoices (Sarah Mitchell paid, Noah paid, Losa Tuilagi unpaid at exactly 30 days) without moving any RNG draw or any pinned Souter figure. Bump PERSIST_VERSION by one and extend the migrate test.
- Demo triggers: register "Simulate NHI arrival (daily hospital list)" (bar, Admin Patients Missing NHI and a provisional patient's record; it imports the new FORTE_DAILY_MON27 sample with 33's importHospitalDownload, not 34's deliverDailySheet, which is fixed to one Forte sample; it stages the row only, and the office's Attach and merge finishes it and marks the row applied) and the PWA-only, badged "Office attaches the NHI" (mobile Booking and List; body in src/store/officeStandIn.ts, acting as OFFICE_SIMULATION_ACTOR). The S1 unpaid alert needs no new trigger. Nothing is added to the Control Panel page. Bodies stay in src/shared or src/store so pwaPurity holds.
- Design and copy: extend the Admin Review tile and table anatomy; teal the only action colour; no crimson on the new screens; warning and error tints for escalation; mono tabular numbers for NHI, dates and money; provisional captions where D11 and OQ-41 are unanswered; no en or em dashes in any app copy.
- Keep npm run build, npm run build:pwa and npx vitest run green as you go.
- Do not commit or push.

When done:
- run the manual test checklist and report each item;
- confirm npm run build, npm run build:pwa, npx vitest run and npm run shots are green;
- run the adversarial review-and-fix pass (convention 18: fan out three Opus review subagents for quality, bugs and plan adherence, steered by the phase doc's bullets; independently verify each finding; fix the confirmed ones; re-green);
- update PROGRESS.md:
  - the status row and a phase entry, including the drift-check result, which D11 branch was built, the open question on which invoices count toward the alert, the name map for later phases, the PERSIST_VERSION from/to, the tests added and the review pass;
  - the Decisions-log entries listed in the phase doc (two superseded, one amended, five new);
  - the handoff notes for 41, 42, 43 and 44;
- patch the demo guide in the same session:
  - 03-demo-script.md: S1 Beat 1's alert line, the new optional Beat 1d, the new optional S5 Missing NHI beat, Direct URLs and Recovery;
  - 04-presenter-cheat-sheet.md: section 11 rewritten, the Booking-without-NHI item, "What each app is for";
  - the intake and follow-up steps in 02-workflows-and-handoffs.md, and the office and anaesthetist lines in 01-personas-and-responsibilities.md;
  - the same sections of master-demo-guide.html;
  - the Control Panel's S1 and S5 scenario text;
- give me short, clear notes on what changed and anything left open.

Phase goal: Admin gets a patient record, found by search, with ethnicity, a details-differ prompt, every invoice across every anaesthetist marked paid, part paid or unpaid with the balance, and a tracked follow-up log. It also gets a Missing NHI problem list showing the surgeon's rooms, which escalates as the date nears; attaching an NHI there merges the provisional record into the existing one. A Booking without an NHI is provisional and blocks its List's authorisation, and the anaesthetist sees "NHI missing". An unpaid alert, with an admin-set 90 day threshold, fires when a Booking is created or matched, replacing the billing monitor's "Prior balance" tag.
