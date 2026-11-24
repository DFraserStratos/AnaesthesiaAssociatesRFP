Please run requirements catch-up Phase 43 (Scale and privacy) of the Anaesthesia Associates (AA) prototype.

Load the run-build-phase skill and follow it for this phase (two sessions, track: catch-up). The phase doc's Before you start, Reference, Work items, Demo triggers, Manual test checklist, Demo guide updates, Catalogue screenshots, Adversarial review (after build) and PROGRESS.md updates sections hold the phase's reads, drift-check stops, rules and finish items; below is only what the doc does not already say.

Also read:
- PROGRESS binding conventions, weighing 3, 4, 5, 7, 8, 13, 17 and 18 above the rest; the Decisions-log entries this phase touches: 2026-07-23 "Deterministic IDs, no UUIDs" and "One store, versioned persistence", 2026-07-24 Phase 10 settled reading (1) "NHI never resides in Xero", and the 2026-07-27 audit history presentation entry.

Hold to these above all:
- Measure first: time Admin Day, Invoices, Audit and the Billing monitor on the pristine seed before writing the generator, so the demo-scale baseline is real.
- The full-scale set is built in memory and deterministically (slotRng streams off SEED and the demo clock) on top of the untouched pristine seed: 71 synthetic anaesthetists (85 in all), about 21,000 Slots across the horizon setting and about 28,000 invoices in the last 12 months, every figure in the one FULL_SCALE block, the setting or counted. App copy says sessions, never "slot".
- One billing module: the generator builds the flat model only through src/domain/billing and the seed's builders (22a's payer builder and copy rule included), never a copied shape or rule, proven by a source-scan test; a payer on each Procedure with a copied payer keeping its BP id, invoices grouped by payer identity, two 'No contract' backstops per destination and no 'Other price' toggle; no surgeons' rooms (17b), no public-kind List (32d, Public is a Slot status), a List origin on every List (34), no Procedure hospital reference (25a).
- performance.now() only in src/store/scaleMode.ts and src/shared/scale/, never in AppState; while full scale is loaded nothing is saved, and a reload returns the pristine seed; S3 figures do not move.
- Review: four lenses, the fourth privacy with determinism (no NHI or personal value ever shown unmasked or sent to Xero; the raw row office-only, reasoned, audited without its value; two builds identical).

Phase goal: a presenter can load the whole practice (85 anaesthetists, about 21,000 sessions over the scheduling horizon, about 28,000 invoices) in memory and see Admin Day, Invoices, Audit and the restyled Billing monitor page, sort and filter at that scale with measured timings, and can show the privacy policy working: a restricted, audited, masked raw hospital row, a leak scan that finds no NHI outside the core platform and no personal information in Xero, and a Synthetic data only badge on every app.
