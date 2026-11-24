Please run catch-up Phase 39a (Payment runs: the weekly cycle, BCTI approval, netting and remittance) of the Anaesthesia Associates prototype.

Load the run-build-phase skill and follow it for this phase (track: catch-up, two sessions). The phase doc holds the reads, drift-check stops, work items, checklist, screenshots, demo guide and progress updates; below is only what the doc does not already say.

Overrides:
- Session 1 is work items 1 to 9 and ends at the green checkpoint in item 9; before stopping there, patch the demo guide's S4 Beat 5 for the cycle's steps (work item 9), so the guide never describes a payables run that no longer exists. Session 2 is items 10 to 15; it starts by reading the PROGRESS note on where session 1 stopped.
- PERSIST_VERSION: bump once for the phase (new slices, the setting, bank lines, the leg field and the backdrop runs).

Also read: gaps.json entries for US-10.2.7, US-10.2.6 and US-10.2.5 (their demo_trigger fields, and US-10.2.7's verify note on the "payables" trigger-label assertion).

Stop if: only the doc's drift step 2 stops (US-10.2.6 made the same step as US-10.2.1's release; the 20th folded into this cycle; OQ-111 reopened; OQ-60 answered that the AA fee nets). Besides 36, 37 and 39, confirm 27a is DONE and note its names (isHeldPayable, HOLDING_ACCOUNT, the transfer's payable).

Hold to these above all:
- The approval gate has no back door: no path pays a payable that is not an unheld line of an approved, scheduled run, and the one-click demo payouts go through approveAndPayPairForDemo. The engine never performs a disbursement: it records Xero's report, idempotent by key.
- Netting uses recoveryDue, never offsetAmount; net per anaesthetist never below zero; the whole ledger balances after every step. runExclusionFor is the only standing exclusion point. The cycle's days are one setting, appSettings.paymentCycle, never code; the demo clock never gates or advances a step.
- No trigger label matches /payables/ in the bar: the PWA stand-in becomes "Office runs this week's payment cycle" and 14's companion assertion in demoTriggers.test.ts is updated to the label set as shipped.
- No seeded figure moves: Dr Souter's position, the whole ledger, the GST schedule and S3's figures identical before and after the backdrop runs. Nothing built for OQ-71 or the 20th beyond the doc's caption and review-list items.
- Review: four reviewers, the fourth money integrity with idempotency, steered at the one-run-per-week and roll-forward rules too.
- This is a milestone phase: finish with the consistency read of master-demo-guide.html against the run sheet.

Phase goal: payments to anaesthetists run on a weekly cycle named by its ISO week, which the office closes (snapshot and bank reconciliation), checks (anomalies held out and rolled into the next week), approves (the week's BCTIs, before anything is paid) and schedules for the accountant, who pays it in Xero; each anaesthetist's negative invoices are netted against their positive payables, paid as one net amount and shown on a remittance advice in Admin and web Accounts; every payment shows the week it was paid in; and a negative with no later payment to net against is left to AA to settle outside the system, visible on the anaesthetist's ledger position.
