Please run requirements catch-up Phase 38 (Web accounts, outstanding list and monthly GST report) of the Anaesthesia Associates (AA) prototype.

Load the run-build-phase skill and follow it for this phase (2 sessions). The phase doc's Before you start, Reference, Work items, Demo triggers, Manual test checklist, Demo guide updates, Catalogue screenshots, Adversarial review (after build) and PROGRESS.md updates sections hold the phase's reads, drift-check stops, rules and finish items; below is only what the doc does not already say.

Also read:
- ROADMAP.md: D8 and D9; the 2026-10-08 placement notes (38 loses US-07.2.1 and D9's default to 38a and drops its dependency on 28); the "Confirm before building" row for 38 (US-12.2.2 Verify).
- Notes: 2026-10-16-aa-meeting-with-greg.md points 22, 24 and 32 (no GST period; monthly; a payment list showing the GST component), 41 and 66; 2026-10-02-aa-meeting-with-greg.md point 1 (the fee and trust law).
- PROGRESS.md: conventions 4, 5, 9, 10 and 13 to 18 especially; the Phase 10 entries (the billing mirror, receipts, payables runs, next-day handover); the catch-up entries of 14, 16, 20a and 27 beside those the doc names (the registry's payment entries, the AA fee and BCTI count, the prepayment pair's held and sent states).

Hold to these above all:
- The ledger is the truth: every money figure reads 36's ledger through store selectors, never state.xero or a seeded constant; Financial position uses the same selector, figures and labels as 36's "Your position" strip (one "Owed"); no new mutation.
- Outstanding is one flat list of unpaid payables, oldest first by invoice date, whose total equals Owed to you to the cent: no ageing, rollup or grouping, no AA fee invoices.
- Remove, do not hide: the Productivity and Leave panels, the dashboards seed slice, dashboardFiguresFor, useDashboardFigures, the ageing helpers and the receipts-based gstActivityFor.
- The GST report is pure in src/domain/billing/gstReport.ts, cash basis, one row per payment, GST from the invoice's stored foot GST (never a flat 3/23); AA fee pairs never appear.
- Leave the List views alone: they are 38a's.
- Web payment triggers are their own bar entries (web-payment-full, web-payment-half) on the PWA entries' shared body; never add web routes to the PWA entries. Narrate the payout with 37's "Run payables in Xero" if 37 is DONE, else "Run payables", and say which in the PROGRESS entry.
- App copy: "billable party" not "payer" (the payer is each Procedure's since 22a; no Booking-level payer label, rows read the invoice's stored billable party), "GST report" not "GST activity", no "timesheet", no GST period or "Bi-monthly".

Phase goal: the web dashboard shows the anaesthetist's real financial position (owed, collected, paid out) from the ledger with the seeded Productivity and Leave panels gone; outstanding balances are one flat list of unpaid payables, oldest first, with no ageing (D8); the GST report lists, for a chosen calendar month and on a cash basis, the payments AA passed to the anaesthetist with the GST component of each (RV-33), to download, print or email on the web, in place of the old list of money received; all read from the ledger alone, leaving the List views to 38a.
