Please run requirements catch-up Phase 37 (Xero mirror resilience and the processing monitor) of the Anaesthesia Associates (AA) prototype.

Load the run-build-phase skill and follow it for this phase (two sessions, as the doc's Estimated line splits them). The phase doc's Before you start, Reference, Work items, Demo triggers, Manual test checklist, Demo guide updates, Catalogue screenshots, Adversarial review (after build) and PROGRESS.md updates sections hold the phase's reads, drift-check stops, rules and finish items; below is only what the doc does not already say.

Override: session 1 ends green and demoable with the PROGRESS entry marked part 1.

Also read:
- ROADMAP.md: the placement notes for the 2026-10-03 update (37 takes the processing monitor restyle, US-13.3.1, with "Open in Review").
- PROGRESS.md: conventions 4, 5, 7, 8, 9, 13, 17 and 18.
- Recipes US-09.2.4.json, US-13.3.1.json and FT-13.3.json.

Hold to these above all:
- The engine never performs a disbursement: an ACCPAY is paid in Xero and only recordDisbursement records it (36's applyDisbursement, no second disbursement map); AA Holding account payables are never paid by the run.
- Every engine-to-Xero call goes through one gate and a durable keyed queue with backoff on the demo clock: no timers; authorising a List is never blocked by Xero.
- Remove LedgerPair.handoffFailure: zero grep hits in aa-prototype/src and aa-prototype/visual.
- Bulk remittance matching lives only in src/domain/xeroSim, fenced by a source-scan test.
- Nothing on the monitor authorises a List (approval stays on Review); filter, sort and expand state lives only in URL search params.
- The reconciliation status (US-13.2.4, DM-67) is derived, never stored; its checks are one data table and ages come from the demo clock. "Run payables in Xero" is not a registry entry.

Phase goal: the engine detects disbursements from Xero instead of performing them, leaves bulk remittance matching to Xero, keeps working through a Xero outage with a visible retrying queue that drains without duplicates, and flags an invoice voided or amended directly in Xero for the office to resolve; the Billing monitor becomes a processing monitor for a large list, grouped by anaesthetist with sorting, filtering and Problems only, showing each anaesthetist's Lists awaiting approval with "Open in Review" while approval stays on Review; and the Admin Day dashboard says at a glance whether the books are square (a status derived from the ledger and the Xero mirror, never stored), listing each unresolved item by amount and age.
