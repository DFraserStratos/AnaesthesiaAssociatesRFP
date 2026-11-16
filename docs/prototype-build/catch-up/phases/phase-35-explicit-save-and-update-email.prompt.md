Please run requirements catch-up Phase 35 (Explicit save and the update email) of the Anaesthesia Associates (AA) prototype.

Load the run-build-phase skill and follow it for this phase (2 sessions, Intake track). The phase doc's Before you start, Reference, Work items, Demo triggers, Manual test checklist, Demo guide updates, Catalogue screenshots, Adversarial review (after build) and PROGRESS.md updates sections hold the phase's reads, drift-check stops, rules and finish items; below is only what the doc does not already say.

Override:
- This phase rewrites PROGRESS binding convention 7 (change sets), as the doc's "PROGRESS.md updates" says.

Also read:
- PROGRESS.md: conventions 4, 5, 7 and 13 to 19 especially.

Hold to these above all:
- Draft-then-save is Admin only: mobile, web and the PWA mount no draft provider and keep their immediate saves; the anaesthetist never calls saveBookingChanges.
- Nothing on the Admin Booking detail bypasses the draft: drafted edits through the booking-store context, commands on the real store and disabled while dirty, enforced by a source-scanning test; a drafted action never emits an app event.
- One save is one change set (one id, a booking.save header, the office as actor); a save that changed Procedures, a Contract or a payer runs 27's re-check once on the real store; a move never re-checks (D20). No versions, merge or clash prompt.
- The payer is on each Procedure (22a, D85): drafted through setProcedurePayer with its offer to the Booking's other Procedures, shown per Procedure in the as-at view; never read or write Booking.payer or setBookingPayer.
- The text as received is never edited; the NHI is never cleared.
- The update email is a mailto on demand only: never a prompt after a save or reassignment, never sent automatically, nothing stored as sent; at most 2,000 encoded characters in one labelled constant; only allowlisted fields (never payer, insurance, NHI, notes or money). Never read Surgeon.roomId: only 17a's helper.

Phase goal: Admin Booking editing becomes draft-then-save, with one change set per save, grouped history and an as-at view, and the office can edit every field (the NHI, never cleared; the RVG code, Contract, each Procedure's payer and invoice description until AUTHORISED; never the text as received) and add a Booking to a booked List with an optional Procedure description. An on-demand update email on every Admin Booking, the List drawer and each List-move notification lets the office pick changes from the history and opens a mailto from the template for that kind of change, to the surgeon's main room (the others offered) for a Booking change and the hospital for a cover change; it is manual only, with nothing sent automatically (OQ-82). Anaesthetists keep immediate saves.
