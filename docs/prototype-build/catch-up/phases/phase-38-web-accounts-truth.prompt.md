Please run catch-up Phase 38 (Web accounts and dashboard) of the Anaesthesia Associates prototype.

Before doing anything else, read these in order:
1. docs/prototype-build/catch-up/ROADMAP.md: the phase list, the owner decisions table (D8 ageing and an "Overdue" view, D9 whether billed Lists vanish), the sequencing rules (38 runs after 28 and 36, in any order with 37 and 39), the demo-trigger, PWA-parity and demo-guide rules, and the "Confirm before building" row for 38 (OQ-31).
2. docs/prototype-build/catch-up/phases/phase-38-web-accounts-truth.md: your detailed plan.
3. docs/prototype-build/catch-up/GAP-ANALYSIS.md: everything before "## By epic" (especially theme 12, the DM-30 row and the RV-18 and RV-19 rows), then the EP-12 and EP-07 tables. Then docs/prototype-build/catch-up/epics/EP-12.md (US-12.2.3, US-12.1.2, US-12.2.2) and epics/EP-07.md (US-07.2.1, US-07.4.1), DM-30 (and DM-18, DM-19 for the ledger you read) in docs/prototype-build/catch-up/analysis/domain-model-delta.md, and RV-18, RV-19 and the dropped RV-16 note in analysis/reverse-check.md.
4. The catalogue files this phase covers, in docs/discovery-reference/Updated Requirements/catalogue/:
   - requirements/US-12.2.3.md, US-12.1.2.md, US-12.2.2.md and US-07.2.1.md;
   - for context, requirements/US-08.3.5.md (owed, collected, paid out), US-12.2.1.md (the flat outstanding list), FT-12.2.md, FT-07.4.md, US-07.4.1.md, US-08.3.1.md and US-11.3.2.md;
   - questions/OQ-31.md and OQ-33.md.
   Also read the "Internal ledger" section of docs/discovery-reference/Updated Requirements/domain-model.md.
5. docs/prototype-build/catch-up/analysis/prototype-map-apps-mobile-web.md (Dashboard, Lists, Accounts, Balances, Forward Lists, "Billed = gone", "Next-day handover", "Aging buckets"), prototype-map-store-seed.md (selectors and the dashboards seed) and prototype-map-shell-demo-pwa.md (routes and the PWA): the code index for the files you will change.
6. docs/design/Web Dashboard.dc.html (the panel grid, the Receivables panel whose slot Financial position takes, the stat tiles, the week strip's tick marker, Who's free), docs/design/Mobile App.dc.html (the Forward Lists row and its "Done, unbilled" cluster) and docs/design/Design Language.dc.html (tokens, tints, mono numbers, pills). These are the AUTHORITATIVE visual reference (convention 17). No mockup covers Accounts or Balances: extend the existing panels, tables and mobile cards.
7. docs/prototype-build/PROGRESS.md:
   - the binding conventions (especially 4, 5, 9, 10, 13 to 18);
   - the Decisions-log entries this phase supersedes or amends: the 2026-07-22 third external plan review finding #12 and the Phase 08 build reading that billedAtISO removes a List from the anaesthetist's views (M10); 2026-07-23 "Seeded anaesthetist-dashboard figures"; 2026-07-21 "Navigation structures from the design" (Accounts houses Overdue and the GST summary); the Phase 05 entry's Overdue anatomy;
   - the Phase 10 entries (the billing mirror, receipts, next-day handover);
   - the catch-up Phase 14, 16, 26, 28 and 36 entries and handoff notes, for the registry's payment entries and "Office authorises this List", the AA fees tab, gstPeriodLabel, the Slot views and approvalStateLabel, and the per-anaesthetist ledger position selector.

Then do the drift check in the phase doc:
- run git diff 1f067a8 over the covered and context catalogue files, OQ-31 and domain-model.md;
- adjust the work items if anything changed, and drop and log anything now Retired or Future;
- confirm whether the owner has answered D8 (default: a flat outstanding list, oldest first, no buckets, no age chips) and D9 (default: billed Lists stay, shown as "Done, unbilled" then "Done, billed" (the app labels use a middot)); if not, build the defaults and label them provisional;
- confirm Phases 28 and 36 are DONE and note the exact names 36 shipped (its position selector, planned as anaesthetistLedgerPosition with owedToThem / awaitingCollection / dueNow / collected / paidOut; its renames such as outstandingPayableRowsFor, pairsForList and openBillingExceptions; its Accounts "Your position" strip and mobile "Collected · Paid out" line) and 26's gstPeriodLabel. The phase doc's code entry points use pre-36 names: use what 36 actually shipped;
- note the current PERSIST_VERSION.
Then enter plan mode, turn the work items into ordered steps (domain and store first, then the dashboard, Accounts, Balances and the billed-List views, then triggers, tests and docs), and wait for my approval.

While working:
- Mock backend only, and the ledger is the truth. Every money figure on the dashboard, Accounts and Balances reads Phase 36's ledger through store selectors, never state.xero and never a seeded constant. The dashboard's Financial position uses the same selector, figures and labels as 36's Accounts "Your position" strip (one definition of "Owed", never two). Awaiting collection equals the Outstanding total to the cent (apply the next-day rule in one place if 36's position does not); Collected and Paid out match receipts and disbursements; AA fee invoices move none of them. Every write stays inside the audited mutate() store actions; this phase adds no new mutation.
- Remove, do not hide. Delete the Productivity and Leave panels, the dashboards seed slice, dashboardFiguresFor, useDashboardFigures and the ageing helpers (receivablesAgingFor, overdueAccountsFor, AgingBucketKey, bucketForAgingDays), unless D8 was answered "keep ageing". Bump PERSIST_VERSION by one and extend the migrate test.
- Keep the Web Dashboard mockup's layout: Financial position takes the Receivables slot with the stat-tile anatomy; Who's free moves up beside it; leave stays visible in the week strip.
- Outstanding is a flat list, one row per unpaid invoice, oldest first, one total, no rollup. /web/accounts and /web/accounts/overdue both redirect to /web/accounts/outstanding (WebAccountsRoute's RequireEntity would otherwise show not-found for "overdue", so add an explicit redirect route).
- GST periods are pure and tested in src/domain/gstPeriod.ts: aligned monthly, two-monthly and six-monthly periods from one labelled 31 March balance-date constant, previous and next navigation that never passes the current period, and a custom date range. Time comes from the demo clock only; no Date.now(), new Date() or Math.random(). One period label (gstPeriodLabel) on every surface; "Bi-monthly" and raw enum codes disappear.
- Billed Lists stay visible through one derivation (listBillingStatus) and one label source (LIST_BILLING_LABEL) on mobile and web. No anaesthetist view filters on isListBilled (keep it for the PWA office stand-in in src/pwa/officeSimulation.ts; admin reads billedAtISO directly and is unchanged); backdrop Lists stay out; a billed List is read only everywhere. The billing run's stamp remains the billed event while OQ-31 is open.
- Demo triggers: no new behaviour and nothing added to the Control Panel page. Put Phase 14's chooser payment entries ("Payment received, full / half", pwa-payment-full / pwa-payment-half) on the web Dashboard and Accounts routes in the harness bar, listing the current persona's open invoices; leave the URL-driven payment-full / payment-half on Admin Invoice and the Xero pair unchanged. If the registry cannot scope a surface per route, add web-payment-full / web-payment-half calling the same shared body. Reword the PWA "Office authorises this List" message. Triggers show only on their routes; bodies stay in src/shared or src/store so pwaPurity holds.
- Design and copy: teal the only action colour, crimson unused in the new panel, mono tabular numbers, provisional labels where D8 or D9 is unanswered, and no en or em dashes in any app copy.
- Keep npm run build, npm run build:pwa and npx vitest run green as you go. Add Vitest tests for gstPeriod, listBillingStatus, the financial position figures, the Accounts Outstanding and GST tabs, and the billed rows on Forward Lists and web Lists.
- Do not commit or push.

When done:
- run the manual test checklist and report each item;
- confirm npm run build, npm run build:pwa, npx vitest run and npm run shots are green;
- run the adversarial review-and-fix pass (convention 18: fan out three Opus review subagents for quality, bugs and plan adherence, steered by the phase doc's bullets; independently verify each finding; fix the confirmed ones; re-green);
- update PROGRESS.md:
  - the status row and a phase entry, including the drift-check result, which D8 and D9 branches were built, the name map for later phases, the PERSIST_VERSION from/to, the tests added and the review pass;
  - the Decisions-log entries listed in the phase doc (two superseded, one amended, two new);
  - the handoff notes for 37, 39, 40, 43 and 44;
- patch the demo guide in the same session: the Direct URLs table, S3 Beats 1 and 3 and the S3 discovery points in 03-demo-script.md, the billing and balances steps in 02-workflows-and-handoffs.md, the money paragraph in 01-personas-and-responsibilities.md, cheat-sheet sections 2 and 11 and "What each app is for", the same sections of master-demo-guide.html, and the Control Panel scenario text if it names Overdue, ageing or the List vanishing;
- give me short, clear notes on what changed and anything left open.

Phase goal: the web dashboard shows the anaesthetist's real financial position (owed, collected, paid out) from the ledger with the seeded Productivity and Leave panels gone, outstanding balances are one flat list with no ageing, GST activity follows the anaesthetist's own aligned GST period with previous, next and a date range, and a List reads "Done, unbilled" and then "Done, billed" on web and mobile instead of vanishing.
