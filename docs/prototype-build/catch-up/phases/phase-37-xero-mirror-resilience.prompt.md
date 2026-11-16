Please run catch-up Phase 37 (Xero mirror resilience and the processing monitor) of the Anaesthesia Associates prototype.

Load the run-build-phase skill and follow it for this phase. The phase doc holds the reads, drift-check stops, work items, checklist, screenshots, demo guide and progress updates; below is only what the doc does not already say.

Overrides:
- Two sessions as the doc's Estimated line splits them. Session 1 ends green and demoable with the PROGRESS entry marked part 1.

Also read:
- ROADMAP.md: the placement notes for the 2026-10-03 update (37 takes the processing monitor restyle, US-13.3.1, with "Open in Review", and is 2 sessions).
- PROGRESS.md: conventions 4, 5, 7, 8, 9, 13, 17 and 18 especially.
- Recipes US-09.2.4.json, US-13.3.1.json and FT-13.3.json.

Hold to these above all:
- The engine never performs a disbursement: an ACCPAY is paid in Xero and only recordDisbursement records it (via 36's applyDisbursement, no second disbursement map). AA Holding account payables are never paid by the run: a leg not yet released is skipped, with a test.
- Every engine-to-Xero call goes through one gate and a durable keyed queue with backoff on the demo clock: no timers (never copy wireIntegrationRetry's setTimeout); authorising a List is never blocked by Xero; restore drains with no duplicates.
- Remove LedgerPair.handoffFailure and the handoff Resolve & retry. Grep gate: aa-prototype/src and aa-prototype/visual have zero hits for handoffFailure.
- Bulk remittance matching lives only in src/domain/xeroSim, fenced by a source-scan test.
- Nothing on the monitor authorises a List: approval stays on Review, one path. Filter, sort and expand state lives only in URL search params.
- "Run payables in Xero" is not a registry entry. The six new entries are bar-only. Phase 36's PWA stand-in "Office runs payables" (Mobile · Balances) stays: rename it "Office runs payables in Xero" and point its body at the same simulated Xero payables run as the monitor's button, so "Paid out" still moves; pwaPurity.test.ts stays green.
- Review adds a money conservation lens, with idempotency.

Phase goal: the engine detects disbursements from Xero instead of performing them, leaves bulk remittance matching to Xero, keeps working through a Xero outage with a visible retrying queue that drains without duplicates, and flags an invoice voided or amended directly in Xero for the office to resolve; and the Billing monitor becomes a processing monitor for a large list, grouped by anaesthetist with sorting, filtering and Problems only, showing each anaesthetist's Lists awaiting approval with "Open in Review" while approval stays on Review; and the Admin Day dashboard says at a glance whether the books are square, listing what is left to resolve.
