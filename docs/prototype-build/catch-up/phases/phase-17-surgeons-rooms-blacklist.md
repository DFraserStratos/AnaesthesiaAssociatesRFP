# Phase 17 · Surgeons, rooms and blacklist

**Requirements covered:**
[FT-13.6](../../../../requirements-board/requirements/stories/FT-13.6.md) Surgeons and surgeons' rooms (Confirmed 2026-10-02; closes here with its three stories, while its "loaded from controlled spreadsheets" sentence is [US-13.4.3](../../../../requirements-board/requirements/stories/US-13.4.3.md)'s, in Phase 42) ·
[US-13.6.1](../../../../requirements-board/requirements/stories/US-13.6.1.md) Surgeons' rooms master record (Confirmed) ·
[US-13.6.2](../../../../requirements-board/requirements/stories/US-13.6.2.md) Surgeon profile, one HPI CPN as the surgeon's unique index (Confirmed) ·
[US-13.6.3](../../../../requirements-board/requirements/stories/US-13.6.3.md) Blacklist of anaesthetist and surgeon pairings (Proposed; accepted in the room on 2026-10-02, with Greg's design view of two lists; its "Warns, never blocks" criterion is met here for the office assigning a List in a session, and its Draft List and own-List paths are finished by Phases 31 and 32 on this phase's helper) ·
[US-01.3.5](../../../../requirements-board/requirements/stories/US-01.3.5.md) Blacklist warning when assigning a List (Confirmed) ·
[DM-32](../analysis/domain-model-delta.md#dm-32) Surgeon profile, surgeons' rooms, blacklist (both directions), surgeon groups and hospital contact email.
Also touches, without closing:
[US-13.4.1](../../../../requirements-board/requirements/stories/US-13.4.1.md) (the hospital contact email, surgeons, surgeon groups and rooms rows of "maintain reference tables"; Greg calls these master data, which is how they are built; the rest of US-13.4.1 closes in Phase 42, and its "recurring bookings" rename is Phase 30's),
[US-01.4.5](../../../../requirements-board/requirements/stories/US-01.4.5.md) (now Verify: the warning when an anaesthetist moves their own List into a colleague's free session; built in Phase 32 on this phase's helper),
[US-01.4.7](../../../../requirements-board/requirements/stories/US-01.4.7.md) (new: an anaesthetist moves a single Booking to a colleague; DM-42 applies the blacklist warning as for a List move; built in Phase 32a on this phase's helper),
[US-01.6.3](../../../../requirements-board/requirements/stories/US-01.6.3.md) (now Confirmed: the Draft List path of the warning, the session predefined on the Draft List; wired in Phase 31).
No RV finding is in scope.
**Answered and built as answered:** [OQ-52](../../../../requirements-board/requirements/questions/OQ-52.md) (2026-10-01: the HPI number and the CPN are one identifier, called the **HPI CPN**, the surgeon's unique index; the other numbers on the profile are for information).
**Built from the meeting's design view:** [OQ-43](../../../../requirements-board/requirements/questions/OQ-43.md) is still Open (with Ben), but at the 2026-10-02 review Greg said the design should allow two lists, because a surgeon may refuse an anaesthetist as well as the reverse ("We'll call it two lists... It's more flexible"). This phase builds that: one blacklist model in which **every entry records which side raised it**, so the surgeon's list and the anaesthetist's list are two views of one store. Still open, and not gating this phase because nothing here is anaesthetist-facing: what an anaesthetist sees of either side (Donald wants Ben's view on how sensitive it is), whether each side learns of the other's entry (Greg: "Implementation detail"; deferred), and a possible rename to "block list". They shape Phases 32 and 32a only.
**Depends on:** Phase 14 (screen-contextual demo triggers; this phase adds none, but the new profile route must fit its route-scoped registry) and Phase 15 (Card becomes Booking; every flow touched here, such as phone advice, is post-rename). In run order it follows 15a, 15b and 16, which also edit some files this phase touches (15a: `ListDrawer`'s Booking rows and the shared barrel; 15b: `PhoneAdviceBooking`, `actionLabels.ts` and `fieldLabels.ts`; 16: `types.ts`, `ID_FORMATS`, `router.tsx` and `apps/admin/routes.tsx`, for its own fee-settings route) and bump `PERSIST_VERSION`, so the line numbers below are as at `3d3a18c`: find each entry point by name.
**Estimated:** 1 session (a full one, likely to spill into a short second). If it runs long, stop green after work item 9 (model, seed, store, helper and pickers) and build the master-data screens and profile page (items 10 to 13) in a short second session.

## Goal

Make surgeons real master data. Today a Surgeon is `{ id, name, specialty? }` in a view-only table,
and nothing knows who a surgeon's rooms are, how to reach a hospital, or which pairings the office
keeps in its head. This phase:

- extends Surgeon into a profile with **one HPI CPN field**, the surgeon's unique index on the
  Health Provider Index (OQ-52 answered: the HPI number and the CPN are the same identifier; the
  equivalent of the NHI for a patient), an NZ medical registration number held for information, and
  a link to its surgeons' room;
- adds surgeons' rooms with a contact email and phone, surgeon groups with member surgeons (so
  Phase 18 has a Surgeon Group holder), and a contact email on every hospital;
- adds an audited, **two-sided** blacklist of anaesthetist and surgeon pairings, maintained by the
  office on the surgeon profile. Each entry records which side raised it: the surgeon will not work
  with the anaesthetist, or the anaesthetist will not work with the surgeon (Greg's 2026-10-02
  design view on OQ-43: "We'll call it two lists... It's more flexible"). Both lists share one
  model, and both sides of one pairing can be active at once. An entry can be ended, and its history
  is kept. Who learns of the other side's entry stays open (OQ-43), so the office sees both sides
  and nothing reaches an anaesthetist here. The name lives in one label, so a rename to "block
  list" is a one-line change;
- gives Admin editors for all of these and a URL-addressable surgeon profile page.

FT-13.6 (surgeons and surgeons' rooms, Confirmed on 2026-10-02) closes here with US-13.6.1 to
US-13.6.3; its spreadsheet-load sentence is US-13.4.3's, in Phase 42.

The first consumer is the office assigning a List. Every picker that pairs a surgeon with an
anaesthetist shows blacklisted options, whichever side raised the entry, in their own labelled
group. Choosing one shows a soft warning that names the pairing and the side, and saving still
works. The rule lives in one pure helper (`src/domain/blacklist.ts`) plus shared UI pieces, so
Phase 28's rewrite of the assignment flows, Phase 31's Draft List assignment, Phase 32's own-List
move (into a colleague's free session, including the hand-on when an anaesthetist marks a booked
session unavailable) and Phase 32a's single-Booking move to a colleague reuse it rather than
re-implementing it.

## Before you start: drift check

1. Diff the catalogue for this phase's items against the plan's snapshot (catalogue commit
   `3d3a18c`, the three 2026-10-02 meetings with Greg):

   ```
   node docs/prototype-build/catch-up/tools/plan-state.mjs --diff FT-13.6,US-13.6.1,US-13.6.2,US-13.6.3,US-01.3.5,US-13.4.1,US-01.4.5,US-01.4.7,US-01.6.3,OQ-52,OQ-43
   ```

   If an item changed, re-read it and adjust the work items below before planning. If a covered item
   is now Retired or Future, drop it from this phase and say so in the PROGRESS entry. A new item on
   the same surface (for example a room with several contacts, or surgeons in more than one room)
   comes into this phase only if it is small and on these screens; otherwise note it for Phase 42.
   What `3d3a18c` already changed, and this plan already reflects: FT-13.6, US-13.6.1, US-13.6.2 and
   US-01.3.5 are Confirmed; US-13.6.3 stays Proposed with the two-lists design view in its notes;
   US-13.6.1 gains Greg's picture of the room record (a short contact list with its surgeons as
   children, or an actor-and-role relationship; "whichever the relationship may look like"), which
   item 1's room with derived surgeons satisfies; US-13.4.1 notes that these are master data;
   US-01.4.5 is Verify and notifies the office through the shared notification pool (Phase 32);
   US-01.4.7 is new (Phase 32a); US-01.6.3 is Confirmed with the session predefined on the Draft
   List (Phase 31).
2. **OQ-52 (HPI CPN), answered 2026-10-01 and unchanged at `3d3a18c`.** Build one required field,
   `hpiId`, labelled **"HPI CPN"** everywhere. If the answer has since been reopened or reworded,
   stop and say so before building item 1.
3. **OQ-43 (what an anaesthetist sees, two lists, the name), Open with Ben.** Greg's 2026-10-02
   design view is built as stated: the blacklist allows both directions, so every entry carries the
   side that raised it (item 1). Nothing in this phase is anaesthetist-facing, so the open parts do
   not gate the build: keep the blacklist, its sides, its reasons and its warnings out of the mobile
   app, the web app and the PWA entirely. If OQ-43 has since been answered with a new name, use it in
   the single label of item 2 (and in the audit labels of item 7). If it now says who learns of the
   other side's entry, or what an anaesthetist sees, record that in the PROGRESS handoff for 32 and
   32a; build nothing anaesthetist-facing here. Record OQ-43's status in the PROGRESS entry. The
   ROADMAP's "Confirm before building" rule labels provisional readings in the UI; no such label is
   needed here, because the two lists are Greg's stated design and the open parts are not built.
   Log the two-sided model on the "For the owner's review" list instead.
4. **Baseline.** Confirm Phases 14 and 15 are DONE in PROGRESS.md; if either is not, stop and say
   so. Phase 15 landed the post-rename names this plan uses: `AddBookingFlow`
   (`src/shared/flows/AddBookingFlow.tsx`), `onBookingCreated` in `PhoneAdviceBooking`, the button
   "Continue to add booking", `stampBookingId` in `MutationMeta`, the Booking id prefix `BK`, and
   `shared/booking/BookingDetailBody.tsx`. Read the current `PERSIST_VERSION` in
   `src/store/appStore.ts` (16 at `3d3a18c`, after 15a session 1; 15a session 2, 15b and 16 may have
   bumped it) and bump it by one from whatever it is now. 15a's pure warning routine is in
   `src/domain/warnings/`; if its session 2 has landed, note what its `src/shared/warnings/` module
   exports (planned: `useBookingWarnings`, `WarningTriangle` and `WarningsPanel`; there is no tap-to-read details sheet, because US-13.7.3 removed it) for item 8.

## Reference

**Design files (convention 17).** No mockup covers master data or a surgeon profile, so extend the
existing Admin patterns rather than inventing new ones:
- `docs/design/Admin Day.dc.html` and `docs/design/Admin Review.dc.html` give the Admin chrome: the
  dark side nav, the white content surface, table rows, the list drawer, and the amber attention
  treatment used for advisory conflicts.
- `docs/design/Design Language.dc.html` gives the tokens: warning `#A16207` with tint `#F9F0DC` and
  on-tint `#7C4D08` (the soft warning, the same as the advisory-conflict box), pills, radii
  (ctl 10, card 14), and Spline Sans Mono for identifiers.
- Teal is the only action colour. Crimson never marks a blacklisted row. The blacklist is attention
  (warning tint), not an error.

**Catalogue:** the covered items above; the narrative in
`requirements-board/requirements/domain-model.md` ("Surgeon, surgeons' room and
blacklist", now naming the HPI CPN and the one-list-or-two question; the ER diagram lines
`SURGEON }o--|| SURGEON_ROOM` and `ANAESTHETIST }o--o{ SURGEON : blacklist`; the "No surgeon master
data beyond a name" row of the RFP-delta table; and the glossary rows for Surgeons' room and
Blacklist). The change logs `requirements-board/requirements/changes/2026-10-01-requirements-update.md`
and `changes/2026-10-02-aa-requirements-review-with-greg.md`, and the notes
`requirements-board/requirements/notes/2026-10-01-aa-meeting-with-greg.md` (#19, #26) and
`requirements-board/requirements/notes/2026-10-02-aa-requirements-review-with-greg.md` (#13 surgeons and rooms confirmed,
#23 US-01.3.5 confirmed, #25 US-01.4.5 to Verify, #43 the room record, #44 two lists, #66 for Ben,
#87 the blacklist accepted in the room) give the meetings' words.

**Analysis:**
- `docs/prototype-build/catch-up/GAP-ANALYSIS.md`: theme 11 (master data and profiles), the DM-32
  line under "Structural first", and the EP-13 and EP-01 tables;
- `docs/prototype-build/catch-up/epics/EP-13.md` (#us-13.6.1, #us-13.6.2, #us-13.6.3, #us-13.4.1)
  and `epics/EP-01.md` (#us-01.3.5);
- `docs/prototype-build/catch-up/analysis/domain-model-delta.md` (#dm-32, re-graded at `3d3a18c`:
  "BlacklistEntry (allow both directions)"; also DM-03 Draft List, DM-05 own-List move, DM-42
  single-Booking move, DM-41 the notification pool, DM-07 the Surgeon Group holder, DM-35 the
  update email and DM-40 estimated duration, which consume this phase);
- `analysis/prototype-map-admin.md`, `analysis/prototype-map-store-seed.md`,
  `analysis/prototype-map-domain.md` and `analysis/prototype-map-shared.md`.

**Code entry points (as at `3d3a18c`, after Phases 14, 15 and 15a session 1):**
- `aa-prototype/src/domain/types.ts`: `Anaesthetist.hpiId` (:149), `Hospital` (:155), `Surgeon`
  (:160), `ContractHolderOrganisation` (:180), `AuditEntry` (:655).
- `aa-prototype/src/domain/seed/cast.ts`: `ANAESTHETISTS` (:44-58, each with a fictional `hpiId` such
  as `10SOUM`), `SURG` (:65), `SURGEONS` (:78), `HOSP`, `HOSPITALS`, `ORG`, `ORGANISATIONS`.
- `aa-prototype/src/domain/seed/index.ts`: `SeedMasters` (:91) and the `masters` assembly (:432).
- `aa-prototype/src/domain/seed/canvas.ts`: `CES_SURGEONS` and `GENERAL_SURGEONS` (:62-64, picked at
  :139). These are the slot RNG's pick arrays. **Do not change them**, or every generated List moves.
- `aa-prototype/src/store/mastersActions.ts`: `createHospital`, `editAnaesthetist`,
  `addPermanentList` and `editPermanentList` (the patterns to copy: office-only refusal,
  `mutate()` with before/after metas, `allocateId`).
- `aa-prototype/src/store/mutate.ts`: `ID_FORMATS` (:61), `allocateId`, `clockISO`.
- `aa-prototype/src/store/lifecycle.ts`: `editList` (:491) and `reassignList` (:543).
- `aa-prototype/src/store/appStore.ts`: `PERSIST_VERSION` (:136, 16 at `3d3a18c`).
- `aa-prototype/src/shared/audit/actionLabels.ts`, `fieldLabels.ts` (`hpiId: 'HPI id'` at :125) and
  `auditNarrative.ts` (`COUNTERPARTY_KINDS`). `auditNarrative.test.ts` scans every `action: '...'` in
  `store/` and `domain/seed/` and fails if any code has no label. The reading layer is deliberately
  pure: it renders ids as ids ("Surgeon S-HALE") and never resolves them to names (see the
  `fieldLabels.ts` header).
- `aa-prototype/src/apps/admin/screens/MasterData.tsx` (553 lines): the `Entity` union and `NAV`
  (:28-52), `HospitalsView` (:275), `AddHospitalSheet` (:313), `SurgeonsView` (:349, view only today)
  and `OrganisationsView` (:396).
- `aa-prototype/src/apps/admin/flows/EditListSheet.tsx` (plain surgeon select, :87-95),
  `PhoneAdviceBooking.tsx` (surgeon select :128-131, `onBookingCreated` at :81, the
  `isScriptedS2Booking` prefill at :88 that S2 Beat 2 relies on, and the "Continue to add booking"
  button at :150), `ReassignListFlow.tsx` (the `freeTargets`
  button list, :50 and :83) and `PermanentListSheet.tsx` (the "Usual surgeon" select, :120; the save
  button, :132).
- `aa-prototype/src/apps/admin/components/ListDrawer.tsx` (the surgeon name at :39, the advisory-conflict box at :62, the surgeon row at
  :71) and
  `apps/admin/flows/EditAnaesthetistSheet.tsx`.
- `aa-prototype/src/router.tsx` (the `masters` leaf route, :107), `apps/admin/routes.tsx`
  (`AdminMastersRoute`, :205), `shell/RequireEntity.tsx` (`to=".."` is route-relative), and
  `apps/admin/AdminApp.tsx` (`sectionForPath`, :27, which picks the active side-nav section from the
  first path segment, so `/admin/masters/...` already lights Master data).
- Tests to extend: `store/mastersActions.test.ts`, `domain/seed/seed.test.ts`,
  `store/persistMigrate.test.ts`, `apps/admin/flows/ReassignListFlow.test.tsx`, and
  `visual/admin-phase07.spec.ts` (the master-data shot).

## Work items

Build in this order: model, then seed, then store, then the helper and pickers, then screens.

1. **Domain types** (`src/domain/types.ts`) (DM-32; US-13.6.1, US-13.6.2, US-13.6.3):
   - New id aliases: `SurgeonRoomId`, `SurgeonGroupId`, `BlacklistEntryId`.
   - `Hospital` gains `contactEmail?: string` (US-13.4.1: "hospitals, each with a contact email for
     booking updates"). It is optional because a newly added hospital may not have one yet.
   - `Surgeon` gains:
     - `roomId: SurgeonRoomId`, **required** (US-13.6.1: "a surgeon is linked to a room"; one room
       per surgeon, the catalogue's recommendation). Making it required lets the compiler find every
       place that builds a Surgeon, including fixtures;
     - `hpiId: string`, **required**: the **HPI CPN**, the surgeon's unique index (US-13.6.2; OQ-52
       answered). It uses the same field name as `Anaesthetist.hpiId`, so one field label and Phase
       40a's consistency pass serve both. Its doc comment says it is the HPI Common Person Number,
       unique across every practitioner, and not the patient's NHI. The internal `Surgeon.id`
       (`S-HALE`) stays the record key, so no List or Contract is re-keyed;
     - `medicalRegistrationNumber?: string`, held for information (US-13.6.2: "other numbers on the
       profile are for information").
   - `SurgeonRoom { id, name, contactEmail, phone }`. The room's surgeons are **derived** from
     `Surgeon.roomId` and never stored on the room, so the link has one source of truth.
   - `SurgeonGroup { id, name, description?, memberSurgeonIds: SurgeonId[] }` (US-13.4.1 "surgeons and
     surgeon groups"; DM-32).
   - `BlacklistEntry { id, raisedBy, anaesthetistId, surgeonId, reason?, addedAtISO, addedBy,
     endedAtISO?, endedBy?, endReason? }`:
     - `raisedBy: BlacklistSide`, where `type BlacklistSide = 'SURGEON' | 'ANAESTHETIST'`: which
       side does not want the pairing (US-13.6.3 notes; DM-32 "allow both directions"). Its doc
       comment cites Greg's 2026-10-02 design view on OQ-43 ("We'll call it two lists"): the
       surgeon's list and the anaesthetist's list are the two values of this field over one store,
       not two stores. Both sides of one pairing may be active at once;
     - `addedBy` records who keyed it in. Here that is always an office user, for either side. If
       anaesthetists later keep their side on their own screen (Greg's picture), those entries are
       `ANAESTHETIST` entries added by the anaesthetist, with no reshape and no migration;
     - an entry is active while `endedAtISO` is absent. Ending an entry never deletes it (US-13.6.3
       "Remove a pairing ... the history of who changed it is kept").
2. **Pure helpers** (both files new). Keep them in `src/domain` with no React, so the store, Admin, and later mobile
   (Phase 32) and the PWA closure can import them. Cover them with Vitest.
   - `src/domain/blacklist.ts`:
     - **the one label:** `BLACKLIST_TERM = { noun: 'blacklist', title: 'Blacklist', adjective:
       'blacklisted' }`. Every user-facing string in this phase that names the list (picker groups,
       pills, the warning, the profile section, the add and end sheets, the audit action labels)
       builds from it, because OQ-43 may rename it ("block list"). It lives in `src/domain`
       because the helper's own warning message needs it and `src/domain` never imports from
       `src/shared`; `shared/` and the audit labels import it from here;
     - **the side wording, also in one place:** `blacklistSideSentence(side, anaesthetistName,
       surgeonName)` returns "<surgeon> will not work with <anaesthetist>" for `SURGEON` and
       "<anaesthetist> will not work with <surgeon>" for `ANAESTHETIST`. The profile headings, the
       add sheet's side choice, the ended-entry rows and the warning all build from it;
     - `activeBlacklistEntries(entries)`;
     - `blacklistEntriesFor(entries, anaesthetistId, surgeonId)`: the active entries for the pair,
       zero, one or two (one per side), in a stable order (`SURGEON` first);
     - `partitionSurgeonsForAnaesthetist(surgeons, entries, anaesthetistId)` returns
       `{ available, blacklisted }`, each sorted by display name (US-01.3.5, first picker bullet);
     - `partitionAnaesthetistsForSurgeon(anaesthetists, entries, surgeonId)`, the same shape
       (US-01.3.5, second picker bullet; used now by the reassign picker and by Phase 31's Draft List
       picker);
     - a pairing counts as blacklisted in the partitions and the warning when **either** side has an
       active entry;
     - `blacklistWarning(masters, anaesthetistId, surgeonId)` returns
       `{ anaesthetistName, surgeonName, entries: { entryId, raisedBy, reason? }[], message } | null`,
       where `message` names both people and the side (US-01.3.5 "a warning names the pairing"):
       "Ms A. Reid has asked not to work with Dr Priya Sharma.", the reverse for an anaesthetist-side
       entry, and "Dr Priya Sharma and Ms A. Reid have each asked not to work with the other." when
       both sides are active. `src/domain` never imports from `src/shared` (`shared/format.ts`
       itself imports domain), so the message uses the master records' names as they are. Any
       surname shaping, such as `drSurname`, happens in the shared UI pieces of item 8;
     - every helper takes the entries it is given and does not filter by side. Callers pass the
       store's whole blacklist, so the office sees both sides, and Phases 32 and 32a decide, with
       OQ-43, which sides an anaesthetist is warned about and what the prompt says.
   - `src/domain/surgeons.ts`:
     - `surgeonsInRoom(surgeons, roomId)` and `groupsForSurgeon(groups, surgeonId)`;
     - `isPlausibleEmail(value)`, a deliberately loose `something@something.tld` check, shared by
       rooms and hospitals;
     - `normaliseHpiCpn(value)` (trim, upper-case) and `isPlausibleHpiCpn(value)`: two digits then
       four letters, the shape Health NZ publishes (for example `12ABCD`) and the shape the seed's
       anaesthetists already use. No check-character validation and no register lookup: those are
       Phase 40a's (HPI CPN shown consistently, lookup and validation).
   - `src/domain/blacklist.test.ts` and `src/domain/surgeons.test.ts`:
     - an active entry warns and an ended one does not, on either side;
     - a surgeon-side entry, an anaesthetist-side entry, and both together each give the right
       message and entries, and each puts the option in the blacklisted group once (never twice);
     - re-adding after ending warns again;
     - the partitions are stable and exhaustive, with no surgeon lost or duplicated;
     - a missing surgeon or anaesthetist id returns null, never a throw;
     - the message names both people and the side, and no message or side sentence contains an en
       or em dash;
     - `normaliseHpiCpn(' 12abcd ')` is `12ABCD`; `isPlausibleHpiCpn` accepts every seeded
       anaesthetist `hpiId` and rejects blank, `1ABCDE` and `12ABC`.
3. **Seed** (in `src/domain/seed/cast.ts`, or a new `seed/surgeonMasters.ts` re-exported from it). All
   of it is fictional, so use `.example` email domains and `03 555 ####` phones:
   - `ROOMS`: five or six fictional rooms (for example "Avonside Surgical Rooms" or "Riccarton
     Orthopaedic Rooms"; avoid real Christchurch practice names), each with a contact email and
     phone. Every seeded surgeon gets a `roomId`, and every room has at least one surgeon; share
     rooms where the specialties match (for example Whitford and Reid in one eye rooms).
   - Every `SURGEONS` row gains `roomId`, a fictional HPI CPN `hpiId` in the `NNAAAA` shape (for
     example `40HALT` for Mr T. Hale), distinct from every other surgeon's and from every anaesthetist
     `hpiId` (`10SOUM` to `23STRO`), and a fictional `medicalRegistrationNumber` (5 or 6 digits).
   - `HOSPITALS` gain `contactEmail` (for example `bookings@stgeorges.example`).
   - `SURGEON_GROUPS`:
     - "Canterbury Orthopaedic Surgeons" (`SG-COS`) with Mr T. Hale as a member, matching the
       existing `ORG.cos` contract-holder organisation by name. Phase 18 re-points the COS Contract to
       this group; leave `organisations` and the COS Contract untouched here;
     - one more group, for example an eye group with Mr J. Whitford and Ms A. Reid.
   - `BLACKLIST`, with two entries, one per side, so one profile shows both lists:
     - **One active pairing that S2 can reach without blocking it**, raised by the surgeon
       (`raisedBy: 'SURGEON'`): Dr Priya Sharma with a surgeon who is not Mr T. Hale. **Ms A. Reid**
       (`S-REID`) is the candidate, with reason "Surgeon's preference". A probe of the seed at this plan's update found Reid is the only surgeon the
       generated canvas never pairs with Sharma; Mr C. Okafor, the obvious pick, has a generated
       Sharma List on 2026-10-19 AM, which would fail the "no seeded List" test below. Reid is also on
       Dr Alistair Chen's Tue 21 PM Christchurch Eye Surgery List, which gives the reassign picker
       its blacklisted beat (item 13), and she shares an eye room and group with Mr J. Whitford, so
       her profile shows room colleagues and a group chip. In S2 Beat 2 (Sharma's Tue 21 PM, St
       George's, Hale) the surgeon picker then shows Reid in the labelled blacklisted group, and the
       scripted Hale path is unchanged. Give it fixed `addedAtISO` and `addedBy` values (for example
       `2026-03-10T10:00:00`, "Kirsty W.").
     - **One ended entry, for history, on the same surgeon and the other side**, so one profile
       shows an active and an ended entry and both directions: Dr Rawiri Hughes with Ms A. Reid,
       raised by the anaesthetist (`raisedBy: 'ANAESTHETIST'`, "Dr Rawiri Hughes will not work with
       Ms A. Reid"), added 2025-11-03 and ended 2026-05-12 by "Kirsty W." with end reason "Resolved
       with the surgeon's rooms". Hughes's later generated Reid Lists (for example Wed 22
       PM) then read as the resolved pairing at work, and the ended entry never warns.
     - Use fixed ISO timestamps, never the clock.
   - Wire three new masters into `SeedMasters` and the assembled state: `surgeonRooms`,
     `surgeonGroups` and `blacklist`, each a `Record` keyed by id. Seed ids are `RM-...`, `SG-...` and
     `BLK-...` (not `BL`, which is the billing-line prefix, and not `BK`, which Phase 15 gives
     Bookings). **Do not add surgeons, and do not touch `CES_SURGEONS`, `GENERAL_SURGEONS` or any
     generator input**, so the canvas is identical to before.
   - **Bump `PERSIST_VERSION` by one** (from 16 at `3d3a18c`, or whatever 15a, 15b and 16 left).
   - Seed tests (`seed.test.ts`):
     - **write the canvas fingerprint test first, before any seed edit**, so the "unchanged" check
       below compares against the real pre-phase canvas;
     - every surgeon's `roomId` resolves and every room has at least one surgeon;
     - every surgeon has a plausible HPI CPN, and HPI CPNs are unique across surgeons and
       anaesthetists together;
     - every group member and blacklist reference resolves;
     - hospital and room emails pass `isPlausibleEmail`;
     - every entry has a valid `raisedBy`, and the seed holds one entry of each side;
     - no seeded List or Permanent List pairs an active blacklisted anaesthetist and surgeon (either
       side). Re-run this before choosing: if Phases 14 to 16 (with 15a and 15b) have shifted the
       canvas and the slot RNG now pairs Sharma with Reid, pick another surgeon for the seed entry (and re-point the item 13 shots and
       the checklist) rather than patching Lists;
     - the S2 path stays clear: Sharma and Hale are not blacklisted, and Sharma is not blacklisted
       with the surgeon on Rutherford's Wed 22 AM List (the S2 Beat 3 reassignment);
     - the generated canvas is unchanged: list ids, `surgeonId` and `hospitalId` match a snapshot
       taken before the change, or an equivalent fingerprint.
4. **Runtime ids** (`src/store/mutate.ts` `ID_FORMATS`): add `surgeon` (`SN`, pad 3),
   `surgeonRoom` (`RMN`, pad 3), `surgeonGroup` (`SGN`, pad 3) and `blacklistEntry` (`BLKN`, pad 3).
   These prefixes are distinct from the seed's `S-`, `RM-`, `SG-` and `BLK-`, the same rule Phase 07
   used for `CPN`, `PLN` and `HHN`, and from every existing runtime prefix (`BL` is the billing
   line's).
5. **Master-data store actions.** Put them in a new `src/store/surgeonActions.ts`, exported from
   `src/store/index.ts`. The hospital ones go in `mastersActions.ts`.
   - Common rules for every action:
     - office-only (`refuse('officeOnly', ...)` otherwise);
     - validated, with plain-English refusals and no dashes in the copy;
     - one `mutate()` commit with before and after metas and `stampBookingId` (Phase 15's name for
       `stampCardId`) set to `null`;
     - timestamps from `clockISO(s.clock)`.
   - Surgeons:
     - `createSurgeon(api, actor, { name, specialty?, roomId, hpiId, medicalRegistrationNumber? })`
       stores `normaliseHpiCpn(hpiId)` and refuses a blank name, an unknown room, a blank or
       implausible HPI CPN, or one already held by another surgeon or by an anaesthetist ("That HPI
       CPN already belongs to Dr Priya Sharma"): it is a unique index across practitioners;
     - `editSurgeon(api, actor, surgeonId, patch)` takes the same fields with the same rules, and the
       id is immutable;
     - they audit `surgeon.create` and `surgeon.update`.
   - Rooms:
     - `createSurgeonRoom(api, actor, { name, contactEmail, phone })` and
       `editSurgeonRoom(api, actor, roomId, patch)` refuse a blank name or an implausible email, and
       the phone is free text;
     - they audit `surgeonRoom.create` and `surgeonRoom.update`.
   - Groups:
     - `createSurgeonGroup(api, actor, { name, description?, memberSurgeonIds })` and
       `editSurgeonGroup(api, actor, groupId, patch)` refuse unknown member ids and de-duplicate the
       members;
     - they audit `surgeonGroup.create` and `surgeonGroup.update`.
   - Hospitals:
     - `createHospital` gains an optional `contactEmail` argument. It stays atomic with its default
       contract, and today's contract behaviour does not change;
     - new `editHospital(api, actor, hospitalId, { name?, contactEmail? })` refuses a duplicate name
       or an implausible email, and audits `hospital.update`.
   - Blacklist:
     - `addBlacklistEntry(api, actor, { raisedBy, anaesthetistId, surgeonId, reason? })` requires
       `raisedBy` and refuses an unknown side, anaesthetist or surgeon, or an already active entry
       for the same pair **and the same side**. The other side of an already listed pair can be
       added: both may be active. Re-adding after an end creates a new entry. It audits
       `blacklist.add` with entity type `blacklistEntry`. (US-13.6.3 "Record a pairing".)
     - `endBlacklistEntry(api, actor, entryId, endReason?)` refuses an entry that is unknown or
       already ended. It sets `endedAtISO` and `endedBy`, keeps the record, and audits
       `blacklist.end` with before and after. (US-13.6.3 "Remove a pairing"; US-13.5.2 history.)
     - The audit codes stay `blacklist.*` even if OQ-43 renames the list; only the labels follow
       `BLACKLIST_TERM`.
   - No delete actions for any of these masters. Masters are referenced by id; Phase 42 owns
     deactivation and controlled loads.
   - Tests: add `store/surgeonActions.test.ts` and extend `mastersActions.test.ts`. They cover:
     - the anaesthetist actor is refused on every action;
     - each validation refusal, including a duplicate HPI CPN against a surgeon and against an
       anaesthetist, and a lower-case CPN stored upper-case;
     - audit entries with the right action, entity and before/after;
     - end keeps the entry and a second end is refused;
     - a duplicate active pair on the same side is refused, and the other side of that pair is
       accepted;
     - `editHospital` round-trips `contactEmail`.
6. **The warning on the store's write paths, which never block** (US-01.3.5 "Still selectable",
   US-13.6.3 "Warns, never blocks").
   - The paths: `editList` (surgeon change on an anaesthetist's List), `reassignList` (the List's
     surgeon against the target anaesthetist), and `addPermanentList` / `editPermanentList` (a usual
     surgeon on an anaesthetist's recurring booking template; the "recurring booking" rename itself
     is Phase 30's).
   - None of them refuses on a blacklisted pairing.
   - When the resulting pairing is actively blacklisted and the pairing actually changed, they add a
     second meta in the same commit: `list.blacklistAcknowledged` or
     `permanentList.blacklistAcknowledged`, with `after: { anaesthetistId, surgeonId,
     blacklistEntryIds }` (one or both sides' entries). A notes-only edit does not re-log it. This makes the office's decision to go ahead visible in
     History and the Audit viewer. It is the one extra rule this phase adds, and it is cheap, so name
     it in the Decisions log.
   - Only an office actor gets the check. `editList` also lets an anaesthetist edit their own DRAFT
     List; that path never checks or logs the blacklist (OQ-43). The acknowledgement's entity is the
     List or Permanent List, never a Booking, so it never enters the Booking History the
     anaesthetist sees (`shared/booking/BookingDetailBody.tsx`).
   - Add the check through the helper from item 2, not inline, so Phase 28's rewrite, Phase 31's
     `assignDraftList`, Phase 32's own-List move into a colleague's session and Phase 32a's
     single-Booking move to a colleague call the same function.
   - Tests:
     - `editList` to a blacklisted surgeon succeeds and writes exactly one acknowledgement, also
       when both sides are active (one acknowledgement naming both entries);
     - the same save again writes none;
     - `reassignList` onto a blacklisted anaesthetist succeeds with an acknowledgement;
     - an anaesthetist-side entry acknowledges the same way as a surgeon-side one;
     - an ended entry writes none;
     - an anaesthetist's own DRAFT `editList` to a blacklisted surgeon writes none.
7. **Audit reading layer.**
   - `shared/audit/actionLabels.ts` gets a label for every new code, the list's name built from
     `BLACKLIST_TERM`:
     - "Surgeon added", "Surgeon updated";
     - "Surgeons' room added", "Surgeons' room updated";
     - "Surgeon group added", "Surgeon group updated";
     - "Hospital updated";
     - "Blacklist entry added", "Blacklist entry ended";
     - "Blacklisted pairing assigned (warning acknowledged)".
   - `fieldLabels.ts` already has `anaesthetistId`, `surgeonId`, `hospitalId`, `name`, `phone`,
     `reason`, `description` and `hpiId`. **Relabel `hpiId` from "HPI id" to "HPI CPN"** (OQ-52); the
     one key serves surgeons and anaesthetists, and that is the label both should read. Add the
     missing keys: `contactEmail`, `specialty`, `roomId` ("Surgeons' room"),
     `medicalRegistrationNumber` ("NZ medical registration number"), `memberSurgeonIds`, `raisedBy`
     ("Raised by"), `addedAtISO`, `addedBy`, `endedAtISO`, `endedBy`, `endReason` and
     `blacklistEntryIds`. If the reading layer maps enum values to words, map `SURGEON` and
     `ANAESTHETIST` to "Surgeon" and "Anaesthetist"; if it does not, the raw code is acceptable. One map
     serves every entity, so do not add a second meaning to an existing key.
   - Leave `auditNarrative.ts` rendering ids as ids. It is pure by design and does not resolve names
     for any entity today; adding name resolution is not this phase's job.
   - The existing `auditNarrative.test.ts` scan must pass.
8. **Shared UI pieces** (all three new, in the existing `src/shared/schedule/` folder and exported from its `index.ts`, so Phases 32 and 32a's mobile and web flows can reuse them;
   no Admin imports, which keeps pwaPurity safe):
   - `SurgeonSelect`: a native `<select>` that takes `anaesthetistId` and renders two `<optgroup>`s
     from `partitionSurgeonsForAnaesthetist`:
     - "Surgeons";
     - "Blacklisted with Dr <surname>" (the adjective from `BLACKLIST_TERM`, the surname from the
       shared name helper), holding the surgeons blacklisted with that anaesthetist on either side.
       Each option in it reads "<name> · blacklisted", so the closed select still shows it;
     - the empty option stays first, with its label as a prop (`emptyLabel`), because today's pickers
       differ ("Not assigned" in `EditListSheet`, "Not assigned yet" in `PhoneAdviceBooking`);
     - option text keeps each picker's current form through a prop (`EditListSheet` shows
       "Name (Specialty)", the others the name alone).
     The optgroup is the "clearly labelled group" of US-01.3.5.
   - `BlacklistWarning`: an inline callout in `semantic.warning.tint` and `.onTint` from
     `theme/tokens.ts` (the advisory-conflict box treatment in `ListDrawer.tsx` :62). If Phase 15a
     has landed, its `src/shared/warnings/` pieces render Booking Warning records
     (`WarningsPanel` rows with a Mild pill); they take a Booking, not free text, so do not wrap
     them. Match their mild row's amber treatment instead, so the two read as one family, and
     never draw it in the strong-warning red. It is an assignment-time callout, not a Warning
     record (see Out of scope). It names the pairing and
     says the office can still go ahead. Two props, both defaulting to false, gate what OQ-43 leaves
     open: `showSide` adds which side raised it (the helper's `message`, or both sides), and
     `showReason` adds each recorded reason. With neither, it reads only "Dr Sharma and Ms Reid are
     blacklisted. You can still go ahead." Every Admin caller passes both, so the office sees the
     side and the reason, and Phases 32 and 32a cannot leak another side's entry or a reason to an
     anaesthetist by default. It carries `role="status"` and a `data-shot` hook.
   - A small hook, `useBlacklistWarning(anaesthetistId, surgeonId)`, reads the store and returns the
     helper's result.
9. **Admin assignment pickers** (US-01.3.5 "Separated", "Still selectable", and "Warned ... before the
   assignment is saved"):
   - `EditListSheet`:
     - the surgeon select becomes `SurgeonSelect` for `list.anaesthetistId`;
     - choosing a blacklisted surgeon shows `BlacklistWarning` above the save button, and the button
       reads "Save list anyway" while the warning shows.
   - `PhoneAdviceBooking` step 1:
     - the same `SurgeonSelect` and warning;
     - the continue button (post-15 "Continue to add booking") reads "Continue anyway" while warned;
     - the List context, surgeon included, is still written by `editList` only once the Booking is
       created (`onBookingCreated`), so the acknowledgement lands then and an abandoned flow
       writes none;
     - keep `isScriptedS2Booking` and the Hale prefill working unchanged.
   - `ReassignListFlow`:
     - split `freeTargets` with `partitionAnaesthetistsForSurgeon(list.surgeonId)` into the normal
       list and a separately headed "Blacklisted with <surgeon>" section, whose rows are still
       clickable and carry a warning pill;
     - the confirm step shows `BlacklistWarning`, and the confirm button reads "Confirm reassignment
       anyway";
     - with no surgeon on the List, there is no split;
     - update `ReassignListFlow.test.tsx`.
   - `PermanentListSheet`:
     - the usual-surgeon select becomes `SurgeonSelect` for the chosen anaesthetist, re-partitioning
       when the anaesthetist changes;
     - the same warning, and while it shows the button reads "Save anyway" (for "Save changes") or
       "Add anyway" (for "Add permanent list"). Add no new "permanent list" wording; Phase 30
       renames the existing copy to "recurring booking".
   - The Draft List picker does not exist yet. Phase 31 builds it with
     `partitionAnaesthetistsForSurgeon` and `BlacklistWarning`, and its AC check ("Both paths")
     happens there.
10. **Master data screens** (US-13.4.1 rows; US-13.6.1 "Room record"). Split the new views out of
    the 553-line `MasterData.tsx` into a new `apps/admin/screens/masters/` folder, with the new
    sheets (`EditHospitalSheet`, `SurgeonEditSheet`, `SurgeonRoomSheet`, `SurgeonGroupSheet`,
    `BlacklistAddSheet`, `BlacklistEndSheet`) in `apps/admin/flows/`.
    - The sub-nav (`Entity`, `NAV`) becomes:
      Anaesthetists · Contracts · Permanent lists · Hospitals & holidays · **Surgeons** ·
      **Surgeons' rooms** · **Surgeon groups** · Insurers · Organisations · RVG codes ·
      Modifier codes · List statuses · Xero & archiving.
      ("Permanent lists" keeps its label until Phase 30's rename.)
    - The selected view is read from and written to a `?view=` search param (the router already keeps
      transient view state in the query), so a profile page can link back to `?view=surgeons`.
    - **Hospitals & holidays:**
      - each hospital card shows its contact email, or "No contact email" in mist;
      - an "Edit" link opens `EditHospitalSheet` (name and contact email);
      - `AddHospitalSheet` gains an optional contact email field;
      - update the header copy.
    - **Surgeons:**
      - an editable table with columns Name · Specialty · Room · HPI CPN (mono) · Blacklist (count
        of active entries, as a warning pill when there are any; the column title from
        `BLACKLIST_TERM`);
      - a row click navigates to the profile page;
      - "Add surgeon" opens `SurgeonEditSheet`: name, specialty, room select, **HPI CPN (required)**
        with the helper line "The surgeon's unique number on the Health Provider Index, for example
        12ABCD", and NZ medical registration number (optional, "for information");
      - drop "view only in this prototype" from the subtitle.
    - **Surgeons' rooms:**
      - a table with columns Name · Contact email · Phone · Surgeons, where Surgeons lists the
        derived members as links to their profiles;
      - "Add room" and a row "Edit" open `SurgeonRoomSheet`;
      - membership is changed from the surgeon side (its room select), and the sheet says so in one
        line.
    - **Surgeon groups:**
      - a table with columns Name · Members · Description;
      - "Add group" and "Edit" open `SurgeonGroupSheet` (name, description, member checkboxes).
    - **Organisations** stays as it is (Phase 18 decides its fate).
11. **Surgeon profile page** (US-13.6.2; US-13.6.1 "the room's contacts are shown on the surgeon's
    profile"; US-13.6.3 "Record a pairing" and "Remove a pairing"):
    - **Route and screen:**
      - nest the `masters` route in `router.tsx` as an index plus `surgeons/:surgeonId`, rendered by a
        new `AdminSurgeonProfileRoute` in `apps/admin/routes.tsx` inside `RequireEntity`;
      - keep `surgeons/:surgeonId` as one child route (not `surgeons` > `:surgeonId`), so the
        route-relative `to=".."` of `RequireEntity` falls back to `/admin/masters` for an unknown id
        rather than to a missing `/admin/masters/surgeons` that the `*` route bounces to the Day
        view; check that `sectionForPath` keeps Master data active on the nested path;
      - the screen is a new `apps/admin/screens/SurgeonProfile.tsx`, with a back link to
        `/admin/masters?view=surgeons`.
    - **Header:** the name, the specialty, the HPI CPN as a mono chip beside the name (it is the
      surgeon's identity, as the NHI is a patient's), and an "Edit details" button that opens
      `SurgeonEditSheet`.
    - **Identifiers card:**
      - **HPI CPN** first, mono, captioned "Unique index on the Health Provider Index. Not the
        patient's NHI.";
      - NZ medical registration number, mono, captioned "For information".
    - **Room card:** the room's name, contact email and phone, and the other surgeons in the room.
      Show the email as text. The mailto drafting is Phase 35's.
    - **Groups:** membership chips.
    - **Blacklist section** (heading and copy from `BLACKLIST_TERM`), showing **both sides** (Greg's
      two lists over one model):
      - two labelled groups of active entries, headed from `blacklistSideSentence` with the
        surgeon's shaped name: "Ms Reid will not work with" (surgeon-side entries) and "Will not
        work with Ms Reid" (anaesthetist-side entries). An empty group says so in one mist line
        ("No entries");
      - each active row: the anaesthetist's name, the reason or "No reason recorded", and "Added by
        Kirsty W. on 10 Mar 2026";
      - each row has an "End" action that opens `BlacklistEndSheet` (the side sentence, an optional
        end reason, then confirm);
      - an "Add to blacklist" button opens `BlacklistAddSheet`: first the side, as two radio
        options worded from `blacklistSideSentence` ("Ms A. Reid will not work with the
        anaesthetist" or "The anaesthetist will not work with Ms A. Reid"), then an anaesthetist
        select in which anaesthetists already listed **on that side** are disabled (the other side
        stays open), then an optional reason;
      - below the active groups, a collapsed "Ended entries" disclosure shows each ended entry with
        its side sentence and who ended it, when, and why;
      - one mist line under the heading: "Recorded by the office. Each entry says which side asked."
    - **Layout:** a proper desktop layout (convention 16), with sheets through `useSurface().Overlay`
      as the existing Admin sheets do.
12. **Admin cross-links:**
    - `ListDrawer`: the surgeon row links to that surgeon's profile, and following the link closes
      the drawer.
    - `EditAnaesthetistSheet`: a read-only "Blacklisted with" line lists the anaesthetist's active
      entries, either side, as links to the surgeon profiles, each with a short side tag ("surgeon
      asked" or "anaesthetist asked"). This satisfies US-13.6.3's conditional "if the
      blacklist is also shown on the anaesthetist's profile, the entry appears there too" on the
      Admin side only. Leave the anaesthetist's own HPI CPN field as Phase 26 and 40a have it; only
      the audit label changes here (item 7).
    - Nothing on the mobile, web or PWA anaesthetist profile (OQ-43; Greg's picture of the
      anaesthetist keeping their side on their own screen, beside their holidays, is not built here:
      the office records that side for them on the surgeon profile).
13. **Playwright** (`npm run shots`):
    - add a new `aa-prototype/visual/admin-phase17.spec.ts` with `data-shot` hooks for:
      - the Surgeons table;
      - the Surgeons' rooms table;
      - Ms A. Reid's profile (`/admin/masters/surgeons/S-REID`, or whichever surgeon the seed
        pairs), with the HPI CPN, the room and its other surgeon, the group chip, both side groups
        (the surgeon-side Sharma entry under "Ms Reid will not work with", the other group empty)
        and the "Ended entries" disclosure opened on the anaesthetist-side Hughes entry;
      - `BlacklistAddSheet` open on that profile, with the side choice and, on the surgeon side,
        Dr Sharma disabled;
      - EditListSheet on Dr Sharma's Tue 21 AM List with the blacklisted surgeon selected and the
        warning showing (a closed native select cannot be screenshotted open, so shoot the selected
        "· blacklisted" option plus the warning);
      - the reassign picker's blacklisted section, from Dr Chen's Tue 21 PM Christchurch Eye
        Surgery List (Ms A. Reid), where Dr Sharma's Free Tue 21 PM puts her under "Blacklisted with
        Ms A. Reid". Open the picker only; do not confirm, because that would consume the S2 Beat 2
        Free session;
    - keep `admin-phase07.spec.ts`'s master-data shot passing.
14. **Finish green:**
    - `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots`;
    - `persistMigrate.test.ts` covers the bumped version;
    - `pwaPurity.test.ts` still passes (the new domain helpers are pure, and the shared pieces import
      nothing from `apps/admin`, `apps/demo` or `shell`).

## Demo triggers

**None.** Everything in this phase is an office action done through normal Admin use: editing
masters, adding or ending a blacklist entry on either side, and picking a surgeon or an
anaesthetist. None of it is
automatic, scheduled or external, so it needs no harness-bar button. It is also Admin only, so it
needs no PWA equivalent. The anaesthetist-facing warning is Phase 32's (own-List move) and
32a's (single-Booking move), and needs no office stand-in there: both moves take effect at once with
no office confirmation (D7); their colleague-move PWA stand-ins are listed in those phases.
Register nothing in Phase 14's registry and add nothing to the Control Panel. The profile route is
URL-addressable (`/admin/masters/surgeons/:surgeonId`), so a later phase can scope a trigger to it if
one is ever needed.

## Out of scope

- **The anaesthetist's own-List move warning** (US-01.4.5, now Verify) and any anaesthetist-facing
  view of the blacklist: Phase 32, with OQ-43; the single-Booking move's warning (US-01.4.7):
  Phase 32a.
- **An anaesthetist-side editor** on the anaesthetist's own screen (Greg's picture, beside their
  holidays): not built. The two lists are modelled here (`raisedBy`), and the office records the
  anaesthetist's side on the surgeon profile. Whether each side learns of the other's entry, and
  what an anaesthetist sees, stay with OQ-43.
- **The Draft List assignment path** of US-01.3.5: Phase 31 wires the helper built here.
- **The blacklist as a Booking warning.** FT-13.7's warning routine (Phase 15a, in
  `src/domain/warnings/`) checks Bookings, and its to-do list is for warnings that need action on
  the thing they flag; the blacklist is a check on a List's pairing at assignment, US-01.3.5 asks
  for it before the assignment is saved, and US-13.7.1 does not list it. Register no warning rule
  for it, and post nothing to the to-do list or (Phase 32's) notification pool.
- **The Surgeon Group as a Contract holder:** Phase 18 adds it, re-points the COS Contract and
  decides whether Organisations are retired or relabelled.
- **Using the contact emails:**
  - the update email: Phase 35, an on-demand button on any Booking with the changes picked from its
    change history (OQ-69), addressed to the surgeon's room for a Booking change and to the hospital
    contact for a cover change (OQ-46), including from a List-move notification in Phase 32's pool;
  - emailing the rooms about a missing NHI: Phase 40;
  - estimated durations from the rooms: Phase 27 (stored per Procedure); surgeon PDF ingest is
    Future Work.
- **Deleting or deactivating** surgeons, rooms, groups or hospitals, spreadsheet loads of this
  reference data, and editable insurers: Phase 42.
- **The "recurring booking" rename** of Permanent Lists in copy: Phase 30.
- **Existing Lists that already pair a blacklisted anaesthetist and surgeon:** they are not
  re-flagged on the Day grid. The warning fires at assignment. A cross-date view is Phase 30's
  conflict dashboard territory, if AA wants it.
- **A surgeon in more than one room, several contacts per room, or a generic actor-and-role
  relationship.** The catalogue recommends one room per surgeon, the meetings did not settle it, and
  Greg left the room record's shape to the developers (US-13.6.1 notes: "whichever the relationship
  may look like"). One room, one contact email and phone, with derived surgeons, is built.
- **HPI CPN check-character validation, register lookup and showing the anaesthetist's HPI CPN
  consistently** on their own profile: Phase 40a (and 26 for the profile field). This phase checks
  the shape and uniqueness only.

## Manual test checklist

The agent runs every item itself in the running app and reports it with evidence; none is handed
to the owner (ROADMAP.md "Owner review: agents test themselves").

- [ ] Admin, Master data:
  - Surgeons lists every seeded surgeon with a room and an HPI CPN;
  - Surgeons' rooms shows each room's email, phone and derived surgeons;
  - Surgeon groups shows Canterbury Orthopaedic Surgeons with Mr T. Hale;
  - Hospitals & holidays shows a contact email on every seeded hospital.
- [ ] Add a surgeon with a room and an HPI CPN typed in lower case. The new surgeon appears in the
  Surgeons table (CPN upper-cased) and in that room's surgeon list, and Audit shows "Surgeon added"
  by Kirsty W. with an "HPI CPN" field row.
- [ ] Adding a surgeon with no HPI CPN, a malformed one, or Dr Sharma's (`12SHAP`) is refused with a
  plain message naming the problem.
- [ ] Editing a room's email to an implausible value is refused with a plain message. A valid edit
  saves and appears in Audit with before and after values.
- [ ] Edit a hospital's contact email. It shows on the hospital card and in Audit ("Hospital
  updated").
- [ ] Open the seeded blacklisted surgeon's profile from the Surgeons table:
  - the HPI CPN beside the name and on the identifiers card, with the registration number marked
    "For information", and no provisional hint anywhere;
  - the room's contact email and phone;
  - group chips;
  - both side groups: Dr Sharma under "Ms Reid will not work with" with her reason, the other group
    empty, the line "Recorded by the office. Each entry says which side asked.", and the
    anaesthetist-side Hughes entry under "Ended entries" with its side sentence;
  - the back link returns to the Surgeons view.
- [ ] Add an anaesthetist-side entry from a profile ("The anaesthetist will not work with ..."). It
  appears at once in the "Will not work with" group, that anaesthetist is disabled on that side of
  the add sheet but not on the other, and it shows on that anaesthetist's Admin edit sheet under
  "Blacklisted with" with its side tag. Audit shows "Blacklist entry added" with a "Raised by" row.
- [ ] On Ms Reid's add sheet, Dr Sharma is disabled on the surgeon side (already listed; the store
  refusal is covered by a test) but open on the anaesthetist side. Add that side: accepted, and
  the warning for the pairing in Edit list now says each has asked not to work with the other. End
  it again so the seed state returns.
- [ ] End an entry with a reason. It moves to "Ended entries" with who and when. It no longer
  warns, and Audit shows "Blacklist entry ended".
- [ ] Day view, Tue 21 July, Dr Priya Sharma's PM Free List, **Book (phone advice)**:
  - the surgeon picker shows the blacklisted surgeon in a separate "Blacklisted with Dr Sharma"
    group, and Mr T. Hale in the main group;
  - choosing the blacklisted surgeon shows the amber warning naming both people and the side ("Ms A.
    Reid has asked not to work with Dr Priya Sharma"), with the reason, and the button reads
    "Continue anyway";
  - switching back to Hale clears the warning;
  - the scripted S2 Beat 2 (St George's, Hale, Look up, Save) runs exactly as before.
- [ ] **Edit list** on Dr Sharma's Tue 21 AM List: selecting the blacklisted surgeon warns and "Save list anyway"
  saves. The List's History shows "Blacklisted pairing assigned (warning acknowledged)", and a
  following notes-only edit does not repeat it.
- [ ] **Reassign list** from Dr Chen's Tue 21 PM Christchurch Eye Surgery List (Ms A. Reid), or
  whichever List pairs the seeded blacklisted surgeon with a Free session on the same day:
  - Dr Sharma appears under a separate "Blacklisted with Ms A. Reid" heading and can still be
    chosen; an anaesthetist added on the anaesthetist side with Reid in an earlier step (if they have
    a Free Tue 21 PM) appears there too;
  - confirming warns and succeeds, and the List's History shows the acknowledgement;
  - reset the demo data afterwards, because this uses Sharma's S2 Beat 2 Free session.
  S2 Beat 3 (Rutherford Wed 22 AM to Sharma) shows no warning and runs unchanged.
- [ ] Permanent list sheet: choosing a blacklisted usual surgeon for that anaesthetist warns and saves
  anyway.
- [ ] Changing `BLACKLIST_TERM` locally to "block list" renames every picker group, pill, warning,
  profile heading, sheet and audit label in one edit (then revert it).
- [ ] The mobile app, the web app and the PWA show no blacklist, side, reason or warning anywhere.
- [ ] The Day grid and every seeded List look identical to before the phase (the canvas is
  unchanged).
- [ ] No en or em dash in any new copy, and no crimson on any new control or warning.
- [ ] Catalogue screenshots: the recipes for US-13.6.1, US-13.6.2, US-13.6.3 and US-01.3.5 are created or updated (US-13.6.3 showing both sides), any recipe this phase broke is re-pointed, a full `npm run capture` ends with no failed recipe and no story without a recipe, the covered items' new shots are checked by eye, and `npm run verify:board` is green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots` and `npm run verify:board` are all green.

## Demo guide updates

In the same session, following the ROADMAP's rule that each phase patches the beats it touches:
- `docs/demo-guide/03-demo-script.md`:
  - **S2 Beat 2:** add an optional pointer. On the surgeon picker, show the "Blacklisted with Dr
    Sharma" group and, if time allows, select it to show the soft warning, then return to Mr T. Hale.
    Add an **Expected** line for the grouped picker and the warning naming the side, and a **Say**
    line: "The office's naughty list is now data, from either side: the surgeon who won't work with
    an anaesthetist, or the reverse. It warns, it never blocks."
  - **S2 Discovery points:** add OQ-43 (what an anaesthetist sees of the list, whether each side
    learns of the other's entry, and whether it becomes the "block list"; the two lists themselves
    are built, per Greg's design view). Do not list OQ-52: it is answered; if the beat mentions the
    surgeon profile, say "each surgeon is keyed on their HPI CPN".
  - **Direct URLs:** add Surgeon profile `/admin/masters/surgeons/<surgeonId>` and Master data views
    `/admin/masters?view=surgeons`.
  - S2 Beat 3 is unchanged, and the seed test protects it.
- `docs/demo-guide/04-presenter-cheat-sheet.md`: one line for the surgeon profile and blacklist
  (where it lives, the HPI CPN as the surgeon's unique index, the two sides on one profile, the
  seeded Sharma and Reid pairing, "warns, never blocks").
- `docs/demo-guide/02-workflows-and-handoffs.md`: under the office's master-data work, note that
  rooms, surgeon groups, hospital contact emails and the blacklist are maintained in Admin, and that
  the office records both sides of the blacklist on the surgeon profile; anaesthetists see none of
  it yet (OQ-43).
- `docs/demo-guide/master-demo-guide.html`: mirror the same S2 Beat 2 edit (the "Beat 2 · a
  phone-advice booking" block), the discovery points, the Direct URLs table and the cheat-sheet line.
- **Control Panel scenario text** (`apps/demo/DemoControlPanel.tsx`, the S2 blurb): no change needed.
  Mention the optional blacklist moment only if the blurb lists the beats' content.
- This is not a milestone phase, so no full consistency read is needed. Do check that the patched
  sections of the master guide match the run sheet word for word.

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19),
run after the review pass and before the PROGRESS.md entry. Re-run
`node docs/prototype-build/catch-up/tools/recipe-status.mjs 17` first: earlier phases may have
changed these recipes since this plan was written.

**Covered items.** When the phase is done, each recipe in `requirements-board/capture/recipes/`
matches what was built:

| Item | Recipe at plan time | When this phase is done |
|---|---|---|
| [US-13.6.1](../../../../requirements-board/requirements/stories/US-13.6.1.md) Surgeons' rooms master record (Confirmed) | absent · placeholder, no shots | Add the shots, `captured`. Admin shots: `surgeons-rooms` (Master data, "Surgeons' rooms" tab: name, contact email, phone and the derived Surgeons column), highlight the table, caption "Each room holds its contact email, phone and surgeons"; and a `room-card` state on the surgeon profile (`/admin/masters/surgeons/S-REID`) highlighting the Room card with its other surgeon (Mr J. Whitford). Add a state with `SurgeonRoomSheet` open if it fits |
| [US-13.6.2](../../../../requirements-board/requirements/stories/US-13.6.2.md) Surgeon profile (Confirmed) | absent · placeholder, no shots | Add the shots, `captured`. Admin shots: `surgeons-table` (Surgeons tab with Room, HPI CPN and the blacklist-count pill), and `surgeon-profile` at `/admin/masters/surgeons/S-REID` with states `profile` (header HPI CPN chip, Identifiers card with the registration number marked "For information", room card, group chip, blacklist section) and `edit` (`SurgeonEditSheet` with the required HPI CPN field). Highlight the HPI CPN chip and Identifiers card. Caption "One identified record per surgeon, keyed on the HPI CPN" |
| [US-13.6.3](../../../../requirements-board/requirements/stories/US-13.6.3.md) Blacklist of anaesthetist and surgeon pairings (Proposed) | absent · placeholder, no shots | Add the shots, `captured`. Admin shots on `/admin/masters/surgeons/S-REID`: `blacklist` with states `active` (both side groups: Dr Sharma under "Ms Reid will not work with" with her reason, the "Will not work with Ms Reid" group empty, and the "Each entry says which side asked" line), `ended` (the "Ended entries" disclosure opened on the anaesthetist-side Hughes entry) and `add` (`BlacklistAddSheet` with the side choice and, on the surgeon side, Dr Sharma disabled). Highlight the Blacklist section. Caption "Either side can refuse a pairing; the office records both and the history is kept". Admin only: no mobile or web shot, because OQ-43 keeps the list off those apps. Build the labels from `BLACKLIST_TERM`, so a rename needs the captions checked |
| [US-01.3.5](../../../../requirements-board/requirements/stories/US-01.3.5.md) Blacklist warning when assigning a List (Confirmed) | absent · placeholder, no shots | Add the shots, `partial`. `absentReason`: "The warning and the separated picker group work when assigning a List in a session (edit list, reassign, phone advice booking, recurring booking). Assigning a Draft List does not exist yet; Phase 31 builds that picker and adds its shot." Admin shots: `edit-list-warning` (Dr Sharma's Tue 21 AM List, the "Blacklisted with Dr Sharma" group, the "Ms A. Reid · blacklisted" option selected, the amber warning naming the side ("Ms A. Reid has asked not to work with Dr Priya Sharma") and "Save list anyway"; highlight the warning) and `reassign-picker` (Dr Chen's Tue 21 PM Christchurch Eye Surgery List, Dr Sharma under "Blacklisted with Ms A. Reid"; open the picker only and never confirm). Caption "A blacklisted pairing is grouped apart and warns, it never blocks". Phase 31 turns it `captured` |

**Recipes this phase breaks.**
- `US-13.4.1` (also covered by Phase 42): its `surgeons` state clicks `role=button[name="Surgeons"]`
  and is captioned "Master data, surgeons (view only)". Playwright's name match is a substring, so
  the new tabs "Surgeons' rooms" and "Surgeon groups" also match it; `capture.ts` takes the first
  match, which works only while "Surgeons" sits first and no other button on the page contains the
  word. Make the click exact (`role=button[name="Surgeons"s]`, Playwright's exact-match suffix, or a
  `data-shot` hook on the tab), and re-caption the state (editable
  surgeons with room and HPI CPN). The `absentReason` still lists surgeons as view only and having no
  surgeon groups: update it, leaving what is still true (insurers, organisations and the rest are
  view only until Phase 42).
- `US-04.4.1` (add hospital): it fills `[role=dialog] input`, the first input. Keep the hospital name
  as the first field of `AddHospitalSheet` when the contact email field is added, or point the recipe
  at the named field.
- Other recipes that open `/admin/masters` (`FT-13.4`, `US-04.1.1`, `US-04.1.2`, `US-04.2.1`,
  `US-05.1.1`, `US-12.1.1` and similar): the split of `MasterData.tsx` into `masters/` and the
  `?view=` param keep the tab button names, so the `--dry` run is the check. Re-point any that fail.
- `US-01.3.1` (edit list, list drawer) and `US-12.1.1`, `US-12.1.4` (edit anaesthetist sheet): the
  surgeon select gains a group, the drawer's surgeon row becomes a link and the sheet gains a
  "Blacklisted with" line. Their selectors should still match; check the highlights by eye.

**ATLAS.md.** Routes (`/admin/masters?view=...` views and `/admin/masters/surgeons/:surgeonId`),
Personas and IDs (surgeon ids such as `S-REID`, the seeded `BLK-` entries, room and group ids),
Seed data (the seeded Sharma and Reid pairing and its ended entry), Overlays (the new Admin sheets)
and Existing hooks (the Phase 17 `data-shot` hooks).

## Adversarial review (after build)

Once the manual test checklist and `npm run build`, `npm run build:pwa`, `npx vitest run` and
`npm run shots` are green, and before writing the PROGRESS entry, run the standard **adversarial
review-and-fix pass (PROGRESS convention 18)**:
- fan out three independent Opus review subagents, one each for **quality**, **bugs/correctness** and
  **plan adherence**, with the catalogue files, this doc and the diff;
- this session then independently verifies every finding against the catalogue, this doc and the
  code, fixes the confirmed ones (with a test wherever a bug had none), re-greens, and records the
  pass in the phase entry;
- do not re-raise anything already settled in the Decisions log.

**Steer this phase's reviewers at:**
- **Never a block.** No store action or UI path refuses, disables or hides a blacklisted option. It is
  grouped and labelled, selectable, and warned before save, on every picker listed in item 9.
- **One rule, one place.** Every warning and partition goes through `src/domain/blacklist.ts`, with
  no inline pairing checks in `EditListSheet`, `PhoneAdviceBooking`, `ReassignListFlow`,
  `PermanentListSheet` or the store actions. That is what lets Phases 28, 31, 32 and 32a reuse it.
- **One name, one place.** Every user-facing mention of the list builds from `BLACKLIST_TERM`; grep
  for a hard-coded "blacklist" or "Blacklisted" in `apps/` and `shared/` copy.
- **HPI CPN is one identifier and a unique index.** One required `hpiId` field labelled "HPI CPN"
  everywhere (no "HPI number", no separate "CPN", no provisional hint); stored normalised; refused
  when blank, malformed or already held by any surgeon or anaesthetist; never presented as, or
  confused with, the patient NHI. The registration number is labelled for information.
- **History is kept.** Ending an entry never deletes it; re-adding creates a new entry; each add, end
  and acknowledged assignment is audited once with before and after, labelled, and readable in the
  Audit viewer. A notes-only List edit must not re-log the acknowledgement.
- **Determinism and seed hygiene.** The generated canvas is byte-for-byte unchanged (no new surgeons,
  pick arrays untouched); the seeded active pairing does not collide with any seeded List or with the
  S2 Beat 2 and Beat 3 paths; seeded HPI CPNs are unique across surgeons and anaesthetists;
  timestamps come from the clock or fixed seed strings; `PERSIST_VERSION` is bumped.
- **Privacy of the list.** The blacklist, its sides, its reasons and its warnings appear only in
  Admin. Nothing reaches the mobile, web or PWA surfaces or the PWA bundle's UI (OQ-43).
  `BlacklistWarning` hides the side and the reason unless `showSide` and `showReason` are set, and an
  anaesthetist actor's store writes never check or log the blacklist.
- **Model shape.** Room membership has a single source (`Surgeon.roomId`, derived on the room);
  every blacklist entry carries `raisedBy` (two lists, one model), either side's active entry warns,
  both sides of one pair can be active, a duplicate is refused only on the same side, and the
  helpers never filter by side; the side wording comes from `blacklistSideSentence` alone;
  surgeon groups are a separate master with members and do not silently replace `organisations`
  (Phase 18's job); `Hospital.contactEmail` round-trips through create and edit.
- **Design and copy.** Warning tint for the warning and never error red; teal-only actions; crimson
  unused; no en or em dashes in any new string; no new "permanent list" wording; Admin sheets
  through `useSurface().Overlay`; the profile is a real desktop page, not a modal.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry; ROADMAP.md "Owner review: agents test
  themselves"): the defaults built for open questions, provisional readings, anything logged
  rather than fixed, and the screens worth a look, each with its route and persona.
- **Catalogue screenshots result:** the recipes filled in (US-13.6.1, US-13.6.2, US-13.6.3, US-01.3.5) and changed (US-13.4.1 and any other recipe re-pointed), the `requirements-board/capture/REPORT.md` counts (captured, partial, absent, failed) before and after, and the partial reason handed to Phase 31 (US-01.3.5, Draft List path).
- **Status row** for catch-up Phase 17, and a phase entry with:
  - the drift-check result against 3d3a18c (items changed or not; OQ-43 status);
  - what was built;
  - the `PERSIST_VERSION` bump (from and to);
  - tests added;
  - the review pass.
- **Decisions log:**
  1. One room per surgeon (`Surgeon.roomId` required, room members derived), the catalogue's
     recommendation; Greg left the room record's shape to the developers on 2026-10-02.
  2. The surgeon's HPI CPN (OQ-52 answered 2026-10-01) is one required field, `hpiId`, shared in
     name and label with the anaesthetist's, unique across practitioners and shape-checked only. The
     audit field label "HPI id" becomes "HPI CPN".
  3. The blacklist warns and never blocks. Going ahead writes a `*.blacklistAcknowledged` audit entry.
     This is a new, cheap rule; name it as such.
  4. The blacklist is two-sided (Greg's 2026-10-02 design view on OQ-43, "two lists"): each entry
     carries `raisedBy` (`SURGEON` or `ANAESTHETIST`) over one store, the office records both sides
     on the surgeon profile, and both are Admin only until OQ-43 settles what an anaesthetist sees
     and whether each side learns of the other's. The name lives in `BLACKLIST_TERM` and the side
     wording in `blacklistSideSentence`, so a rename is one edit.
  5. Surgeon groups are a new master beside `organisations`, and Phase 18 re-points the COS Contract.
  6. The reassign picker counts as "assigning a List" for US-01.3.5.
  No July ruling is superseded. The Phase 06 advisory-conflict reading (amber, never a hard block) is
  extended, not changed.
- **Handoff notes:**
  - For **18**: `surgeonGroups` and `SG-COS` are ready as a holder.
  - For **26** and **40a**: the anaesthetist's HPI CPN uses the same field and the "HPI CPN" label;
    `normaliseHpiCpn` and `isPlausibleHpiCpn` are in `src/domain/surgeons.ts`, and 40a adds any check
    character and the register lookup there.
  - For **28**: re-home the helper calls when the assignment flows are rewritten.
  - For **30**: the Permanent List sheet now has blacklist-aware copy ("Save anyway", "Add anyway")
    to keep when it renames the sheet to recurring bookings.
  - For **31**: use `partitionAnaesthetistsForSurgeon` and `BlacklistWarning` (with `showSide` and
    `showReason`) in the Draft List picker, which shows everybody potentially available (US-01.6.3
    notes), and check US-01.3.5 "Both paths" there.
  - For **32** and **32a**: the helper is pure and PWA-safe; `BlacklistWarning` hides the side and
    the reason by default (`showSide`, `showReason`); the entries carry `raisedBy`, and OQ-43 decides
    which sides an anaesthetist is warned about, what the prompt says (recommendation: a short prompt
    with no reason), and whether anaesthetists edit their own side. 32's own-List move into a
    colleague's free session (and the hand-on when a booked session is marked unavailable) and 32a's
    single-Booking move call `blacklistWarning` for the receiving colleague and the List's surgeon.
    The blacklist posts nothing to the notification pool; the move does.
  - For **35**: the room email is the To address for a Booking change and the hospital contact email
    for a cover change, on the on-demand update email, including from a List-move notification
    (OQ-46, OQ-69).
  - For **27** and **40**: the room is who sends estimated durations and who is emailed about a
    missing NHI.
  - For **42**: no delete or deactivate yet, and loader targets for these masters (HPI CPN as the
    surgeon row's match key).
