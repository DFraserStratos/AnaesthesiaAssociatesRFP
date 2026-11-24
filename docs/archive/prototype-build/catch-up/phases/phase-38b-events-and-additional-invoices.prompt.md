Please run requirements catch-up Phase 38b (Events on a Procedure and the additional invoice) of the Anaesthesia Associates (AA) prototype.

Load the run-build-phase skill and follow it for this phase (two sessions, track: catch-up). The phase doc's Before you start, Reference, Work items, Demo triggers, Manual test checklist, Demo guide updates, Catalogue screenshots, Adversarial review (after build) and PROGRESS.md updates sections hold the phase's reads, drift-check stops, rules and finish items; below is only what the doc does not already say.

Override: bump PERSIST_VERSION once per session that changes the state's shape or the seed, or once for the phase, with persistMigrate tests including a stale payload that still holds an addendum Booking.

Hold to these above all:
- One element, thin: one ProcedureEvent record in schedule.procedureEvents, one store action per step, the kind's rules only in EVENT_KINDS, status derived and never stored, and every word, "event" and both button labels included, from src/shared/procedureEventCopy.ts.
- Only runEventInvoicing raises an event's invoice, exactly once; runBillingForList is not changed, so S3 and S5 invoice numbers never move. OQ-121 (D69) lives in eventInvoicing alone, with no UI chip.
- The original Booking, its Procedures, its lock, its payer and the original invoice are never written (deep-equal in tests); the anaesthetist acts only on a Procedure they own, ruled only in mayRaise, mayEditEvent and procedureOwner.
- An event's party defaults to its Procedure's own payer (22a) and the picker is 22a's PartyPicker; no private copy.
- Remove, do not hide, the addendum Booking; the seeded event is RNG-free and moves no seeded figure.

Phase goal: "event" becomes the one element for everything recorded against a Procedure after setup: a thin record with an invoice tick, a "same as" billable party, one standard review step in Admin and invoicing in the next billing run, listed on every Procedure in all three apps. Its first kind is the free-form additional invoice to any party, raised from a button on the Procedure's Contract row by the office on any invoiced Procedure or by the anaesthetist on their own (reached through Phase 38a's search; the by-hand route after a prepaid or fixed-price procedure, since nothing is raised automatically). It replaces the post-op addendum Booking and, once reviewed and run, is its own invoice with its own number, ledger pair, Xero pair, payable and BCTI, linked both ways to the unchanged original.
