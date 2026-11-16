Please run catch-up Phase 39b (Pre-op, post-op and billing events) of the Anaesthesia Associates prototype.

Load the run-build-phase skill and follow it for this phase (track: catch-up, two sessions). The phase doc holds the reads, drift-check stops, work items, checklist, screenshots, demo guide and progress updates; below is only what the doc does not already say.

Also read: the doc's "Left this phase at d4db277" note at the top (US-03.3.6 Retired, its work now billing events and the BillingLine removal).

Hold to these above all:
- Events are kinds on 38b's record (preOp, postOp, billing, added to EVENT_RULES, EVENT_KINDS and resolveEventParty with mayBundle true), never a Procedure, never primary, on no List or schedule. Never a second routing constant or function, and nothing wired into the List run: every ticked event goes through 38b's review step and only 38b's runEventInvoicing bills it, once. A noEventRate or contractNotInForce event is left for review and priced there with a reason.
- Pricing in one place: pure in src/domain/billing/prePostOpEvent.ts, the rate and discount through one exported helper that 24's pricing also calls, never a second derivation; the Procedure's Contract read live at approval and frozen in the event's pricing, never the lock, a version or a line. ContractEventFee is the one addition to the Contract model.
- No event or review writes the Booking, its Procedures or the lock; editRefusal stays exactly as it is.
- 18's parity fixture and 24's parity must match unchanged: never run them with -u.
- The BillingLine leftovers grep (drift check step 4) is a gate: at the end no BillingLine, billingLines, chargeBasis or billingLine. remains outside history comments, pinned by work item 5's grep test; every seeded line is re-expressed as a billing event at its old figure, so no seeded total moves. No UNIT x RATE, Contract add-on fee, quantity or preset billing-line type anywhere.
- The anaesthetist never sees a calculation or a Booking total (38b's EVENT_RULES.anaesthetistSees), on mobile, web, the sheets or the PWA stand-in's results.
- Review: four reviewers, money integrity the fourth (the doc's steer).

Phase goal: the anaesthetist, or the office on request, adds pre-op and post-op events to a current or past Procedure on mobile, web and Admin, each with its own date and time, a recorded time or a fixed fee and no modifiers, an invoice tick and a "same as" billable party; every billable event goes through one review step and is billed in the next run, never held for the Procedure's invoice, on the same billable party's invoice in that run where there is one, otherwise on its own, traceable to the Procedure; a recorded time is priced at the Procedure's Contract rate or the anaesthetist's own, and a Contract event fee replaces it; the ACC pre-op assessment is a preconfigured pre-op event under the generic rules (codes provisional); a billing event (a free-text charge or a credit) is added to a Procedure the same way and replaces the billing line, whose entity is removed with every seeded line re-expressed at its old figure. No UNIT x RATE or Contract add-on fee line is built.
