Please run requirements catch-up Phase 32d (Public as a Slot status) of the Anaesthesia Associates (AA) prototype.

Load the run-build-phase skill and follow it for this phase (2 sessions, Schedule track). The phase doc's Before you start, Reference, Work items, Demo triggers, Manual test checklist, Demo guide updates, Catalogue screenshots, Adversarial review (after build) and PROGRESS.md updates sections hold the phase's reads, drift-check stops, rules and finish items. Below is only what the doc does not already say.

Hold to these above all:
- Write the parity test before you change the seed, and get it passing against HEAD. Every Booking, every List holding one, every invoice and fee figure, and `POST_OP_ORIGINAL_LIST_ID` with 14's "Stage post-op scenario" must pass unchanged after the re-home. The doc's item 1 lists what may move.
- A public List that holds Bookings becomes an ordinary private List at the same Slot, with the same id. Only bookless sessions become Public with the note "CPH". Never put a closed status under a List, and never renumber an id.
- Keep every `rng()` and `slotRng` draw and the `bookable` selection identical: the public rows still project during the first pass and are re-homed after the last Booking is placed (item 4).
- The status key is `publicHospital`, never a List kind. The "Public · CPH" line comes from one helper, with no List detail.
- Public is closed everywhere through `isOpenSlot` and `isClosed`, never a key compare. Changing it back to Free reopens it.

Phase goal: Public joins the Slot statuses as a value that works like Unavailable. The anaesthetist sets it from their calendar on mobile and web, or the office sets it from the session drawer, each with an optional note such as "CPH". It shows "Public · CPH" with no List detail on the Day grid, the availability grid, the calendars and Find cover, is never open for bookings or cover, and changing it back to Free reopens it. The prototype-only Public List kind is retired. Seeded public Lists that hold Bookings, among them Dr Sharma's Tue 14 Jul AM List (the post-op scenario's anchor), carry on as private Lists with the same ids and figures. The bookless ones become Public sessions, and the recurring public rows become each anaesthetist's weekly Public series.
