Please run catch-up Phase 38b (Events on a Procedure and the additional invoice) of the Anaesthesia Associates prototype.

Load the run-build-phase skill and follow it for this phase (track: catch-up, two sessions). The phase doc holds the reads, drift-check stops, work items, checklist, screenshots, demo guide and progress updates; below is only what the doc does not already say.

Overrides:
- PERSIST_VERSION: bump once per session that changes the state's shape or the seed, or once for the phase, with persistMigrate tests including a stale payload that still holds an addendum Booking.

Stop if: only the doc's one stop, OQ-63 reopened to "an event is a Procedure added to the Booking". Its three fallbacks (US-08.6.3 drops the review step, goes back to admin only, or "event" is renamed) are not stops: make the doc's one-place change and carry on.

Hold to these above all:
- One element, thin: one ProcedureEvent record in schedule.procedureEvents, one store action per step, the kind's rules only in EVENT_KINDS, status derived by eventStatus and never stored, nothing kind-specific outside the detail union and additionalInvoice.ts, and no modifier, ASA, base-unit, RVG or Contract field on the record. Every word, "event" and both button labels included, comes from src/shared/procedureEventCopy.ts.
- Only runEventInvoicing raises an event's invoice, exactly once. runBillingForList is not changed, never sweeps or creates an event, so the S3 and S5 invoice numbers never shift and nothing is raised automatically after a prepaid or fixed-price procedure. OQ-121 (D69) lives in eventInvoicing alone, commented "OQ-121, D69", with no UI chip.
- Immutability: the original Booking, its Procedures, its lock and the original invoice are never written (assert deep-equal in tests); 38a's read-only rule for an invoiced List gains only this button.
- Own Procedure only: the anaesthetist raises, edits or removes only on a Procedure whose procedureOwner (the locked payee) is them, ruled only in mayRaise, mayEditEvent and procedureOwner; a colleague is refused by the store as well as the UI, with a test.
- Remove, do not hide, the addendum Booking (the doc's list). The seeded event on Dr Souter's oa03 Procedure (David Chen, Mon 22 Jun) is RNG-free, at a fixed instant, raises no invoice and is pinned in seed.test.ts; no seeded figure moves.
- Review: add a fourth lens, money integrity (each additional invoice's own number, a pair with payable equal to receivable to the original's payee, a Xero pair with no NHI or patient name, exactly one BCTI through bctiRecordsOf).
- Words: Booking, not Card; never "slot" or "timesheet" in app copy; no "DRAFT" for an assigned List.

Phase goal (the Booking total with each Procedure's price and events joins, US-03.1.10): "event" becomes the one element for everything recorded against a Procedure after setup: a thin record with an invoice tick, a "same as" billable party, one standard review step in Admin and invoicing in the next billing run, listed on every Procedure in all three apps. Its first kind is the free-form additional invoice to any party, raised from a button on the Procedure's Contract row by the office on any invoiced Procedure or by the anaesthetist on their own (reached through Phase 38a's search; the by-hand route after a prepaid or fixed-price procedure, since nothing is raised automatically). It replaces the post-op addendum Booking and, once reviewed and run, is its own invoice with its own number, ledger pair, Xero pair, payable and BCTI, linked both ways to the unchanged original.
