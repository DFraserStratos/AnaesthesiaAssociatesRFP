Please run catch-up Phase 21a (RVG detail by pricing kind, completion and office review) of the Anaesthesia Associates prototype.

Load the run-build-phase skill and follow it for this phase. The phase doc holds the reads, drift-check stops, work items, checklist, screenshots, demo guide and progress updates; below is only what the doc does not already say.

Also read:
- ROADMAP.md: D58 (32b builds the alerts, 21a shows them at review) and the Contracts track sequencing rules.
- PROGRESS.md Decisions log: the 2026-07-22 reviews on the completion gate, beside the Phase 04 and Phase 07 rulings the doc names. Catch-up entries 14, 15a and 18 as well as those the doc's drift-check step 3 lists.
- Maps in analysis/: prototype-map-domain, -shared, -admin, -store-seed and -shell-demo-pwa.

Hold to these above all (the doc's Goal and items 1 to 14 give the detail):
- One place each, in src/domain/billing: asksRvgDetail (rvgDetail.ts, 20's helper renamed in place), priceStatusFor (priceStatus.ts), completionFailuresFor (completion.ts), the review-flag list (reviewFlags.ts, replacing src/apps/admin/reviewFlags.ts). Never a second copy of 20's helper or 19b's explanation check.
- Completion is exactly three conditions and never calls validateBookingForBilling; flags never block (authoriseBlockersFor stays an empty seam); times are "start" and "finish", never "handover"; no money on mobile.
- A moved Booking keeps its Contracts on every move path, proven by one table-driven test.
- S3 stays $396.18, $152.38, $91.43; S1 Beat 3 gains one "None apply" tap.
- Hand any rename of US-03.3.3's state ids to /update-requirements in the PROGRESS entry.

Phase goal: what a Procedure asks for follows its Contract's pricing kind (RVG code, times and a completed modifiers step on RVG kinds; a fixed or open price collapsing to an optional RVG code for reference); a Booking is complete with exactly a Contract, the RVG detail on RVG kinds and a price, split from the billing validator; office review shows each Procedure's text, Contract and RVG code, the payer, insurer or funder and approval number, 32b's alerts and 38a's late edits with flags that never block (a Contract the anaesthetist changed, a typed price beside the computed one, a Contract that no longer fits after a move, anything needing an invoice destination or a price), and the office approves or corrects each Contract change; a moved Booking keeps its Contracts.
