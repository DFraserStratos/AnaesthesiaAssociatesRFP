Please run requirements catch-up Phase 17b (Surgeon contacts on the surgeon, and no surgeons' rooms) of the Anaesthesia Associates (AA) prototype.

Load the run-build-phase skill and follow it for this phase (2 sessions, Master data track). The phase doc's Before you start, Reference, Work items, Demo triggers, Manual test checklist, Demo guide updates, Catalogue screenshots, Adversarial review (after build) and PROGRESS.md updates sections hold the phase's reads, drift-check stops, rules and finish items; below is only what the doc does not already say.

Also read:
- The Phase 34, 35 and 40 docs, only the lines that name 17b's helper, so `officeAddressFor`'s shape fits 34's sender in front and 35's and 40's drafts.

Hold to these above all:
- One email helper, `officeAddressFor` in `domain/surgeonContacts.ts`: the first office contact with an email, the others offered, never every contact, never the personal contact; the guard test keeps every other reader out (doc item 3).
- The surgeon's HPI CPN goes optional only through `surgeonHpiCpnRequired()` (OQ-143's default); the anaesthetist's stays mandatory as 26 left it. Split a shared guard, never loosen it.
- Re-seed from the pinned rooms only, never the real `Christchurch_Specialists.xlsx`; names, specialties, pairings, groups, Lists and every S1 to S5 figure stay put; one `PERSIST_VERSION` bump.
- No room survives: the item 1 grep ends at zero, and no "provisional" label or caption is left (OQ-127 is answered).
- The plus and minus form is built on the shared `TextField`, `AddRowButton` and `IconButton`; one set always shows, and only extra sets carry a minus.

Phase goal: take out the surgeons' room record that Phases 17 and 17a built (the rooms master and its view, room contacts, a surgeon's rooms, the room card and 17a's room-email helper) and put on each surgeon a practice name as text, one personal contact and one or more office contacts entered on a plus and minus form, and an HPI CPN that admin staff fill in, saved without one and unique when held. The surgeon list becomes AA's address book. One helper gives the office's emails the first office contact, with the others offered, and 34 extends it. The fictional directory is re-seeded to match, with nothing else in the demo moving.
