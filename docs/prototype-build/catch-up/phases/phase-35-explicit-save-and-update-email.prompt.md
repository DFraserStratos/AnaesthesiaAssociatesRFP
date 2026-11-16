Please run catch-up Phase 35 (Explicit save and the update email) of the Anaesthesia Associates prototype.

Load the run-build-phase skill and follow it for this phase. The phase doc holds the reads, drift-check stops, work items, checklist, screenshots, demo guide and progress updates; below is only what the doc does not already say.

Overrides:
- This phase rewrites PROGRESS binding convention 7 (change sets), as the doc's "PROGRESS.md updates" says.

Also read:
- PROGRESS.md: conventions 4, 5, 7 and 13 to 19 especially.

Hold to these above all:
- Draft-then-save is Admin only: mobile, web and the PWA mount no draft provider and keep their immediate saves; the anaesthetist never calls saveBookingChanges.
- Nothing on the Admin Booking detail bypasses the draft: drafted edits through the booking-store context, commands on the real store and disabled while dirty, enforced by a source-scanning test; a drafted action never emits an app event.
- One save is one change set (one id, a booking.save header, the office as actor); a save that changed Procedures, a Contract or the payer runs 27's re-check once on the real store; a move never re-checks (D20). No versions, merge or clash prompt.
- The text as received is never edited; the NHI is never cleared.
- The update email is a mailto on demand only: never a prompt after a save or reassignment, never sent automatically, nothing stored as sent; at most 2,000 encoded characters in one labelled constant; only allowlisted fields (never an NHI, date of birth, notes, the text as received, invoice description, RVG code, Contract or holder, payer or insurance, modifiers, money or pairing preferences). Never read Surgeon.roomId: only 17a's helper.
- App copy: never "DRAFT" or "Open" for an assigned List (ACTIVE); "Not preferred", never "blacklist"; no "slot".

Phase goal: Admin Booking editing becomes draft-then-save, with one change set per save, grouped history and an as-at view, and the office can edit every field (the NHI, never cleared; the RVG code, Contract and invoice description until AUTHORISED; never the text as received) and add a Booking to a booked List with an optional Procedure description. An on-demand update email on every Admin Booking, the List drawer and each List-move notification lets the office pick changes from the history and opens a mailto from the template for that kind of change, to the surgeon's main room (the others offered) for a Booking change and the hospital for a cover change; it is manual only, with nothing sent automatically (OQ-82). Anaesthetists keep immediate saves.
