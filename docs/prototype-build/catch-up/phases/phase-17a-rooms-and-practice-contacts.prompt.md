Please run catch-up Phase 17a (Rooms without an email, surgeons at more than one room, and practice manager and PA contacts) of the Anaesthesia Associates prototype.

Load the run-build-phase skill and follow it for this phase. The phase doc holds the reads, drift-check stops, work items, checklist, screenshots, demo guide and progress updates; below is only what the doc does not already say. It runs after Phases 17 and 18a and, in plan order, after 26.

Also read:
- ROADMAP.md: D74 (OQ-127 parts 1 and 5, open, with its default) and D75 (OQ-128, answered 4 November by Donald for the build: no label); the phase list (17a after 17; 35 and 40 read its helper; 42 loads through its shapes).
- The Phase 35 and Phase 40 docs, only the parts that name 17a's helper, so its shape fits both.
- ATLAS.md: the Master data overlays and the surgeon hooks.
- PROGRESS.md: the Phase 17 entry (SurgeonRoomSheet, cleanRoomFields, SurgeonProfile, the Master data views, the directory seed's PERSIST_VERSION).
- Maps in analysis/: prototype-map-store-seed, -admin and -domain.

Stop if: a surgeon's own email field is now wanted, or OQ-128 now says one room per surgeon.

Hold to these above all:
- Never read or seed from docs/discovery-reference/Other docs/Christchurch_Specialists.xlsx: it names real people. The only source is Christchurch_Specialists_fictional.xlsx beside it; every name, phone and email stays invented, .example domains only; match practices by the workbook's Practice column, never guess.
- One helper, the pure src/domain/roomContacts.ts: roomEmailForSurgeon returns the main room's contact email, an empty string when none is held, never a contact and never throws; otherRoomsForSurgeon is the one place OQ-127 part 5 is decided; a source-scan test keeps 35 and 40 from growing a second lookup.
- roomsForSurgeon, mainRoomOf and surgeonsInRoom are the only readers of roomIds; no roomIds[0] outside mainRoomOf; 18a's specialties survive the migration (every surgeon keeps at least one).
- Pins that must not move: the directory's 40 rooms and 131 surgeons, every other surgeon's room, the five cast rooms' emails, the canvas fingerprint and golden tests.
- Admin desktop only: nothing in src/apps/mobile, src/apps/web or pwa/ names contacts or room emails. Say "surgeons' room", "practice manager" and "PA".

Phase goal: a surgeons' room can be held, and later loaded, with no email or phone, shown plainly as such, and the specialist directory seed no longer invents reception@ placeholders; a surgeon belongs to one or more rooms (D75, answered), the first their main room, through the type, form, profile, rooms view, audit labels, lookups and seed (the four two-practice surgeons at both); the office records practice manager and PA contacts (name, email, role) on the room, each optionally named for one surgeon (OQ-127's default, D74, provisional), shown on the surgeon's profile for each room; one helper returns the main room's contact email, empty when none is held, and the surgeon's other rooms, for 35's update email and 40's NHI request; nothing is built for an address book, a street address or a surgeon's own email.
