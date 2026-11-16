Please run catch-up Phase 25 (Contract history and the AUTHORISED lock) of the Anaesthesia Associates prototype.

Load the run-build-phase skill and follow it for this phase. The phase doc holds the reads, drift-check stops, work items, checklist, screenshots, demo guide and progress updates; below is only what the doc does not already say.

Also read:
- ROADMAP.md: the owner decisions as re-read on 2026-11-10 against catalogue efe123c, above all D17, D77, D34, D78, D79, D82, D38, D26, D57 and D47; the Contracts track order (18, 18a, 19, 19a, 19b, 20, 20a, 21, 21a, 22, 23, 24, then 25); "Pricing model in one place"; the BCTI granularity note; the "After 25" milestone.
- PROGRESS.md Decisions log: the 2026-07-23 Phase 08 build decisions (Contract resolution at billing time, the default fallback), the Phase 09 readings and failure demo, and the Phase 07 build decisions (flags are advisory). Read the 18 to 24 entries closely.
- Maps in analysis/: prototype-map-store-seed, -domain, -admin and -shell-demo-pwa.

Hold to these above all:
- One place: the snapshot, buildBookingLock, priceBookingFromLock, invoiceDraftsFromLock, compareInvoice and lockViewFor in src/domain/billing/lock.ts, History rows in contractHistory.ts; never a second resolver or precedence; screens read lockViewFor, never raw snapshot fields.
- Figures pinned first and never moved: phase-25-invoices.json is never run with -u; S3, S4 and S5 figures and 16's BCTI counts match Phase 24 exactly. Money integrity is a review lens of its own.
- The engine, retry and regenerate read only the lock, never state.masters. Grep gate: contractIneffective, billedAs and defaultContractFor return nothing. The payee is the stamped one, never a Booking-to-List join (pre-payment cases keep the join until 27 and 41).
- "Needs a price" is the only authorise blocker; warnings never block; failure stays per Booking and a List never fails.
- No "slot" in app copy (say session, AM or PM); "Booking", never "card". Never edit catalogue images by hand.

Phase goal: at authorise, every Procedure gets a pricing snapshot (the Contract's settings as then and only the range in force, the Procedure's values and recorded units, the unit rate, the price, who is billed, plus the split and the payee), and a Procedure that still needs a price blocks AUTHORISED; the billing run prices only from the snapshot, with no fallback; a Booking the engine cannot bill is held back whole while the rest of the List bills; any invoice can be produced again exactly after a Contract edit, a backdated price range or a unit-value edit; and each Contract shows its audited history with values before and after, beside the Procedures locked against it.
