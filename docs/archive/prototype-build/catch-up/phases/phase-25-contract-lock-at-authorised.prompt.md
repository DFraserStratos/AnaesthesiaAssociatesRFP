Please run requirements catch-up Phase 25 (Contract history and the AUTHORISED lock) of the Anaesthesia Associates (AA) prototype.

Load the run-build-phase skill and follow it for this phase (1 session). The phase doc's Before you start, Reference, Work items, Demo triggers, Manual test checklist, Demo guide updates, Catalogue screenshots, Adversarial review (after build) and PROGRESS.md updates sections hold the phase's reads, drift-check stops, rules and finish items; below is only what the doc does not already say.

Also read:
- ROADMAP.md: the owner decisions D17 (as extended 17 November), D77, D34, D78, D79, D82, D38, D57 and D85; the Contracts track order; "Pricing model in one place"; the "After 25" milestone.
- PROGRESS.md Decisions log: the 2026-07-23 Phase 08 build decisions (Contract resolution at billing time), the Phase 09 failure demo, and the 18 to 24 and 22a entries.

Hold to these above all:
- One place: the snapshot, buildBookingLock, priceBookingFromLock, invoiceDraftsFromLock, compareInvoice and lockViewFor in src/domain/billing/lock.ts, History rows in contractHistory.ts; screens read lockViewFor, never raw snapshot fields.
- Figures pinned first and never moved: phase-25-invoices.json is never run with -u; S3, S4 and S5 figures and 16's BCTI counts match Phase 24 exactly.
- The engine, retry and regenerate read only the lock, never state.masters; the payer is each Procedure's own (22a), copied with its BP id, never read from the Booking; the payee is the stamped one.
- "Needs a price" is the only authorise blocker; warnings never block; failure stays per Booking and a List never fails.
- No "slot" in app copy; "Booking", never "card".

Phase goal: at authorise, every Procedure gets a pricing snapshot (the Contract's settings as then and only the range in force, the Procedure's values and recorded units, the unit rate, the price, who is billed (the holder Party or the Procedure's own payer), plus the split and the payee), and a Procedure that still needs a price blocks AUTHORISED; the billing run prices only from the snapshot, grouping invoices by payer identity, with no fallback; a Booking the engine cannot bill is held back whole while the rest of the List bills; any invoice can be produced again exactly after a Contract edit, a backdated price range or a unit-value edit; and each Contract shows its audited history with values before and after, beside the Procedures locked against it.
