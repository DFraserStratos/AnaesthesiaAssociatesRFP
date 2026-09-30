Please run catch-up Phase 36 (Internal ledger and balance views) of the Anaesthesia Associates prototype.

Before doing anything else, read these in order:
1. docs/prototype-build/catch-up/ROADMAP.md: the Money track sequencing (36 runs after 16, 22, 25 and 27; then 37, 38 and 39 in any order), the demo-trigger and PWA parity rules, and the demo-guide rules.
2. docs/prototype-build/catch-up/phases/phase-36-internal-ledger.md: your detailed plan.
3. docs/prototype-build/catch-up/GAP-ANALYSIS.md: everything before "## By epic" (Summary sizing, themes 8 and 10, "Structural first" step 5, the Money trigger cluster, the DM-18 and DM-19 rows). Then docs/prototype-build/catch-up/epics/EP-08.md (the header note, and the EP-08, FT-08.3 and US-08.3.x sections), the US-13.2.1 section of epics/EP-13.md, and analysis/domain-model-delta.md (DM-18, DM-19, DM-22).
4. The covered catalogue files in "docs/discovery-reference/Updated Requirements/catalogue/requirements/": EP-08, FT-08.3, US-08.3.1, US-08.3.2, US-08.3.4, US-08.3.5, US-13.2.1. For context: US-08.3.3, US-08.4.3, US-09.1.1, US-09.2.1, US-10.1.2, US-10.2.1, FT-10.3, US-10.3.2, FT-13.2, US-13.2.2, US-11.3.1 and US-05.3.5. Also the open questions OQ-02, OQ-29, OQ-40 and OQ-47 in "docs/discovery-reference/Updated Requirements/catalogue/questions/", and the "Internal ledger" section and glossary of "docs/discovery-reference/Updated Requirements/domain-model.md".
5. The design files, the authoritative visual reference (convention 17). No mockup covers a ledger screen, so extend the Admin Review tiles and table.
   - docs/design/Design Language.dc.html: semantic tints, mono amounts, teal-only actions.
   - Admin Review.dc.html: the stat tiles and table.
   - Admin Day.dc.html: the side nav and the right-rail cards.
   - Mobile App.dc.html: the Balances header card.
   - Web Dashboard.dc.html: web panel anatomy.
6. docs/prototype-build/PROGRESS.md:
   - the binding conventions;
   - the PROGRESS entries of catch-up Phases 14, 16, 22, 23, 24, 25, 26 and 27. These cover the trigger registry, its actors (OFFICE_SIMULATION_ACTOR) and the ruling that "Run payables" stays the Billing monitor's own button, the payable release rule, the AA fee invoices and their Xero records, the invoice fields, per-Procedure units and the layered total on invoice lines, the lock, the payables destination and bank hold, and the reworked prepayment status and excess;
   - the Decisions-log entries this phase supersedes: the 2026-07-24 Phase 10 build decisions (1) and (2) (money on BillingCase; a handoff fault leaves "no pair"), the 2026-07-24 Phase 09 build decision (1) ("paid-state = the billing mirror"), and Phase 16's reading that the AA fee invoice sits outside billing.cases.
7. docs/prototype-build/catch-up/analysis/prototype-map-store-seed.md (sections 4, 6 and 7), prototype-map-admin.md (sections 1, 6 and 7), prototype-map-apps-mobile-web.md (Accounts, Balances, Dashboard) and prototype-map-shell-demo-pwa.md (the Xero simulation and the PWA sheet). Then read the code files the plan names.

Then do the drift check in the plan (git diff 1f067a8 on the catalogue and domain model for the covered IDs and the items the phase leans on), check that US-13.2.3 is still Retired, check which open questions are still open (build the plan's interims if so), and confirm what Phases 16 to 27 delivered. Then enter plan mode (do not edit code before approval): turn the work items into steps across the two sessions (session 1: items 1 to 11, ending green; session 2: items 12 to 19), and wait for my approval.

While working:
- Pin the figures first (item 1). ledgerParity.test.ts, keyed on invoice numbers and Booking ids, must pass unchanged at the end. No presenter-visible figure in S3, S4 or S5 may move.
- Evolve BillingCase into a ledger pair; do not build a second ledger. BillingCase is deleted, not wrapped. Case references keep the BC prefix. Phase 16's AaFeeInvoice keeps its document fields and loses its money fields to an aaFee pair with a receivable leg and no payable.
- Every invoice creator makes its pair in the same mutate() that raises the invoice: the billing run, the retry, the prepayment raise and the AA fee run. The Xero handoff only reads the legs and stamps mirror ids. A handoff fault leaves a complete pair marked "Not yet in Xero".
- Both legs move together. A receipt updates received and released in one commit, through Phase 16's payableReleasedFor, never a second copy. Nothing disburses above released, and cumulative leg amounts always equal the sums of their entries.
- The ledger maths is pure, in src/domain/billing/ledger.ts, with Vitest tests. The imbalance is receipts held less payables due, exact to the cent. AA fee money and the prepaid-above-final excess are never part of it. The per-anaesthetist positions sum to the whole ledger, and the seed is in balance.
- No app money view (web, mobile, admin, shared) reads state.xero. Only the Xero simulation and the webhook picker do. payablesDue and the payables run work from the ledger alone. Fee payments never reach GST activity, payment history or the next fee run.
- A billing-run failure becomes a BillingException, not a ledger pair. An unmatched receipt is held in the ledger, and only the office clears it, by allocating or refunding it.
- Every write goes through mutate() with an audit entry naming the right actor. Time comes from the demo clock only: no Date.now(), new Date() or Math.random(). The NHI never appears in the ledger table, the Xero sim or any new Xero field.
- Bump PERSIST_VERSION by one, and keep the filler generator's rng() draw order unchanged.
- The Admin Ledger screen follows the design files. Teal is the only action colour. Crimson appears only in the side nav and avatars, never on the balance indicator or the tiles. The indicator uses semantic success and error tints, never the six status colours. Amounts and numbers are in mono with tabular-nums. There are no en or em dashes in app copy. No app screen calls the ledger a mirror, and no anaesthetist screen says ACCREC or ACCPAY.
- Demo triggers go in the Phase 14 registry only, never on the Control Panel page, with bodies in src/store or src/shared so pwaPurity passes.
  - Bar: "Inject unmatched receipt" on Admin Ledger (disabled while a receipt is held); the payment half, full and replay entries re-pointed and also shown on the Ledger; and, only if time allows, "Parallel run variance" on the Billing monitor. "Run payables" is not a bar entry (Phase 14's ruling): the Billing monitor's own product button runs over payable legs, and the Ledger's Payables due tile links to it.
  - PWA: the office stand-in "Office runs payables" on Mobile Balances (OFFICE_SIMULATION_ACTOR, badged office stand-in).
- Rename the handoff helpers everywhere they are called, including Phase 14's officeStandIn.ts and src/pwa/officeSimulation.ts. MasterData.tsx's Xero archiving view keeps reading Xero; it is not a money view.
- Do not commit or push.

When done: run the manual test checklist and report each item. Confirm npm run build, npm run build:pwa, npx vitest run and npm run shots are all green. Run the adversarial review-and-fix pass (convention 18): Opus subagents for quality, bugs/correctness and plan adherence, plus a money lens; independently verify each finding, fix the confirmed ones, and re-green. Patch the demo guide in the same session:
- 03-demo-script.md: the S3 Beat 3 Say line, a new closing S3 Beat 5 "The ledger balances", the S4 Beat 5 Expected line, and the S3 discovery points;
- 04-presenter-cheat-sheet.md, 02-workflows-and-handoffs.md, 01-personas-and-responsibilities.md and the README status row;
- the matching sections of master-demo-guide.html, then reread its S3 section against the Markdown;
- the Control Panel S3 scenario text.
Update PROGRESS.md: the status row; a phase entry with the drift-check result, the OQ interims, the renames, the review pass, the tests added, the PERSIST_VERSION change, any case-reference shift, whether the optional item 18 was built, and the capture recipes that can now be shot; Decisions-log entries for the superseded rulings and the new provisional readings; and the handoff notes for Phases 37 to 41 and 43. Then give me short, clear notes.

Phase goal: BillingCase becomes a ledger pair with linked receivable and payable legs, created at invoice time. The ledger is AA's system of record that every money view reads, and Xero mirrors it. A new Admin Ledger screen shows the whole ledger and each anaesthetist, in balance or out of balance.
