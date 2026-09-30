# Phase 17 · Surgeons, rooms and blacklist

**Requirements covered:**
[US-13.6.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.6.1.md) Surgeons' rooms master record ·
[US-13.6.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.6.2.md) Surgeon profile ·
[US-13.6.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.6.3.md) Blacklist of anaesthetist and surgeon pairings ·
[US-01.3.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.3.5.md) Blacklist warning when assigning a List ·
[DM-26](../analysis/domain-model-delta.md#dm-26) Surgeon profile, surgeons' rooms, blacklist and hospital contact email.
Also touches, without closing:
[FT-13.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-13.6.md) (the feature, grouping only),
[US-13.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.4.1.md) (the hospital contact email, surgeons, surgeon groups and rooms rows of "maintain reference tables"; the rest of US-13.4.1 closes in Phase 42),
[US-01.4.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.4.5.md) (the anaesthetist hand-over warning; built in Phase 32 on this phase's helper),
[US-01.6.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.6.3.md) (the Draft List path of the warning; wired in Phase 31).
No RV finding is in scope.
**Open questions:** [OQ-52](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-52.md) (what CPN is),
[OQ-43](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-43.md) (what an anaesthetist sees of the blacklist).
**Depends on:** Phase 14 (screen-contextual demo triggers; this phase adds none, but the new profile route must fit its route-scoped registry) and Phase 15 (Card becomes Booking; every flow touched here, such as phone advice, is post-rename).
**Estimated:** 1 session (a full one, likely to spill into a short second). If it runs long, stop green after work item 9 (model, seed, store, helper and pickers) and build the master-data screens and profile page (items 10 to 13) in a short second session.

## Goal

Make surgeons real master data. Today a Surgeon is `{ id, name, specialty? }` in a view-only table,
and nothing knows who a surgeon's rooms are, how to reach a hospital, or which pairings the office
keeps in its head. This phase:

- extends Surgeon into a profile with an NZ medical registration number, a single HPI identifier
  (standing in for "HPI number" and "CPN" until OQ-52 answers) and a link to its surgeons' room;
- adds surgeons' rooms with a contact email and phone, surgeon groups with member surgeons (so
  Phase 18 has a Surgeon Group holder), and a contact email on every hospital;
- adds an audited blacklist of anaesthetist and surgeon pairings, kept on the surgeon profile, where
  an entry can be ended and its history is kept;
- gives Admin editors for all of these and a URL-addressable surgeon profile page.

The first consumer is the office assigning a List. Every picker that pairs a surgeon with an
anaesthetist shows blacklisted options in their own labelled group. Choosing one shows a soft warning
that names the pairing, and saving still works. The rule lives in one pure helper
(`src/domain/blacklist.ts`) plus shared UI pieces, so Phase 28's rewrite of the assignment flows,
Phase 31's Draft List assignment and Phase 32's swap requests reuse it rather than re-implementing it.

## Before you start: drift check

1. Diff the catalogue for this phase's items against the plan's snapshot:

   ```
   git diff 1f067a8 -- "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-13.6.1.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-13.6.2.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-13.6.3.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-01.3.5.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/FT-13.6.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-13.4.1.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-01.4.5.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-01.6.3.md" "docs/discovery-reference/Updated Requirements/catalogue/questions/OQ-52.md" "docs/discovery-reference/Updated Requirements/catalogue/questions/OQ-43.md" "docs/discovery-reference/Updated Requirements/domain-model.md"
   ```

   If an item changed, re-read it and adjust the work items below before planning. If a covered item
   is now Retired or Future, drop it from this phase and say so in the PROGRESS entry. A new item on
   the same surface (for example a room with several contacts, or surgeons in more than one room)
   comes into this phase only if it is small and on these screens; otherwise note it for Phase 42.
2. **OQ-52 (CPN).** If still open, build the recommended reading: one identifier field, `hpiId`,
   labelled "HPI number (CPN)" on the profile, stored as trimmed free text (no format refusal), with a
   small provisional hint beside the label ("CPN taken as the HPI Common Person Number until AA
   confirms"). If answered "CPN is the HPI CPN": same field, drop the hint. If answered "CPN is a
   different number": add `cpnNumber?: string` as a separate free-text field on the same profile card.
3. **OQ-43 (anaesthetist view).** Nothing in this phase is anaesthetist-facing, so it does not gate
   the build. Keep the blacklist, its reasons and its warnings out of the mobile app, the web app and
   the PWA entirely. Phase 32 decides the wording. Record OQ-43's status in the PROGRESS entry so 32
   picks it up.
4. **Baseline.** Confirm Phases 14 and 15 are DONE in PROGRESS.md; if either is not, stop and say
   so. Use the post-15 names throughout. Phase 15's plan renames `AddCardFlow` to `AddBookingFlow`,
   the phone-advice button "Continue to add card" to "Continue to add booking", `stampCardId` in
   `MutationMeta` to `stampBookingId`, and the Card id prefix `C` to `BK`. Check the code for what
   actually landed. Read the current `PERSIST_VERSION` in `src/store/appStore.ts` (13 at the
   snapshot, but 15 and 16 will have bumped it) and bump it by one from whatever it is now.

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
`docs/discovery-reference/Updated Requirements/domain-model.md` ("Surgeon, surgeons' room and
blacklist", the ER diagram lines `SURGEON }o--|| SURGEON_ROOM` and `ANAESTHETIST }o--o{ SURGEON :
blacklist`, and the glossary rows for Surgeons' room and Blacklist).

**Analysis:**
- `docs/prototype-build/catch-up/GAP-ANALYSIS.md`: theme 9 (master data and surgeon model) and the
  EP-13 and EP-01 tables;
- `docs/prototype-build/catch-up/epics/EP-13.md` (#us-13.6.1, #us-13.6.2, #us-13.6.3, #us-13.4.1)
  and `epics/EP-01.md` (#us-01.3.5);
- `docs/prototype-build/catch-up/analysis/domain-model-delta.md` (#dm-26; also DM-03, DM-05, DM-06
  and DM-29, which consume this phase);
- `analysis/prototype-map-admin.md`, `analysis/prototype-map-store-seed.md`,
  `analysis/prototype-map-domain.md` and `analysis/prototype-map-shared.md`.

**Code entry points (as at the snapshot; post-15 names may differ):**
- `aa-prototype/src/domain/types.ts`: `Hospital` (:155), `Surgeon` (:160), `Anaesthetist.hpiId`
  (:149), `ContractHolderOrganisation` (:180), `AuditEntry` (:645).
- `aa-prototype/src/domain/seed/cast.ts`: `SURG`, `SURGEONS`, `HOSP`, `HOSPITALS`, `ORG`,
  `ORGANISATIONS`, `ANAE`.
- `aa-prototype/src/domain/seed/index.ts`: `SeedMasters` (:87) and the `masters` assembly (:402).
- `aa-prototype/src/domain/seed/canvas.ts`: `CES_SURGEONS` and `GENERAL_SURGEONS` (:62-64). These are
  the slot RNG's pick arrays. **Do not change them**, or every generated List moves.
- `aa-prototype/src/store/mastersActions.ts`: `createHospital`, `editAnaesthetist`,
  `addPermanentList` and `editPermanentList` (the patterns to copy: office-only refusal,
  `mutate()` with before/after metas, `allocateId`).
- `aa-prototype/src/store/mutate.ts`: `ID_FORMATS` (:61), `allocateId`, `clockISO`.
- `aa-prototype/src/store/lifecycle.ts`: `editList` (:498) and `reassignList` (:550).
- `aa-prototype/src/store/appStore.ts`: `PERSIST_VERSION` (:130).
- `aa-prototype/src/shared/audit/actionLabels.ts`, `fieldLabels.ts` and `auditNarrative.ts`
  (`COUNTERPARTY_KINDS`). `auditNarrative.test.ts` scans every `action: '...'` in `store/` and
  `domain/seed/` and fails if any code has no label. The reading layer is deliberately pure: it
  renders ids as ids ("Surgeon S-HALE") and never resolves them to names (see the `fieldLabels.ts`
  header).
- `aa-prototype/src/apps/admin/screens/MasterData.tsx`: the `Entity` union and `NAV` (:28-52),
  `HospitalsView` (:275), `AddHospitalSheet` (:313), `SurgeonsView` (:349, view only today) and
  `OrganisationsView` (:396).
- `aa-prototype/src/apps/admin/flows/EditListSheet.tsx` (plain surgeon select, :87-95),
  `PhoneAdviceBooking.tsx` (surgeon select :121-131, and the `isScriptedS2Booking` prefill hook that
  S2 Beat 2 relies on), `ReassignListFlow.tsx` (the `freeTargets` button list) and
  `PermanentListSheet.tsx` (the "Usual surgeon" select, :120).
- `aa-prototype/src/apps/admin/components/ListDrawer.tsx` (:38, the surgeon row) and
  `apps/admin/flows/EditAnaesthetistSheet.tsx`.
- `aa-prototype/src/router.tsx` (the `masters` leaf route, :103), `apps/admin/routes.tsx`
  (`AdminMastersRoute`, :203), `shell/RequireEntity.tsx` (`to=".."` is route-relative), and
  `apps/admin/AdminApp.tsx` (`sectionForPath`, :28, which picks the active side-nav section from the
  first path segment, so `/admin/masters/...` already lights Master data).
- Tests to extend: `store/mastersActions.test.ts`, `domain/seed/seed.test.ts`,
  `store/persistMigrate.test.ts`, `apps/admin/flows/ReassignListFlow.test.tsx`, and
  `visual/admin-phase07.spec.ts` (the master-data shot).

## Work items

Build in this order: model, then seed, then store, then the helper and pickers, then screens.

1. **Domain types** (`src/domain/types.ts`) (DM-26; US-13.6.1, US-13.6.2, US-13.6.3):
   - New id aliases: `SurgeonRoomId`, `SurgeonGroupId`, `BlacklistEntryId`.
   - `Hospital` gains `contactEmail?: string` (US-13.4.1: "hospitals, each with a contact email for
     booking updates"). It is optional because a newly added hospital may not have one yet.
   - `Surgeon` gains:
     - `roomId: SurgeonRoomId`, **required** (US-13.6.1: "a surgeon is linked to a room"; one room
       per surgeon, the catalogue's recommendation). Making it required lets the compiler find every
       place that builds a Surgeon, including fixtures;
     - `medicalRegistrationNumber?: string`;
     - `hpiId?: string`, the single HPI identifier. Its doc comment names OQ-52 and the interim
       reading. It is not the patient's NHI.
   - `SurgeonRoom { id, name, contactEmail, phone }`. The room's surgeons are **derived** from
     `Surgeon.roomId` and never stored on the room, so the link has one source of truth.
   - `SurgeonGroup { id, name, description?, memberSurgeonIds: SurgeonId[] }` (US-13.4.1 "surgeons and
     surgeon groups"; DM-26 verify note).
   - `BlacklistEntry { id, anaesthetistId, surgeonId, reason?, addedAtISO, addedBy, endedAtISO?,
     endedBy?, endReason? }`. An entry is active while `endedAtISO` is absent. Ending an entry
     never deletes it (US-13.6.3 "Remove a pairing ... the history of who changed it is kept").
2. **Pure helpers.** Keep them in `src/domain` with no React, so the store, Admin, and later mobile
   (Phase 32) and the PWA closure can import them. Cover them with Vitest.
   - `src/domain/blacklist.ts`:
     - `activeBlacklistEntries(entries)`;
     - `blacklistEntryFor(entries, anaesthetistId, surgeonId)`, active entries only;
     - `partitionSurgeonsForAnaesthetist(surgeons, entries, anaesthetistId)` returns
       `{ available, blacklisted }`, each sorted by display name (US-01.3.5, first picker bullet);
     - `partitionAnaesthetistsForSurgeon(anaesthetists, entries, surgeonId)`, the same shape
       (US-01.3.5, second picker bullet; used now by the reassign picker and by Phase 31's Draft List
       picker);
     - `blacklistWarning(masters, anaesthetistId, surgeonId)` returns
       `{ entryId, anaesthetistName, surgeonName, reason?, message } | null`, where `message` names
       both people (US-01.3.5 "a warning names the pairing"). `src/domain` never imports from
       `src/shared` (`shared/format.ts` itself imports domain), so the message uses the master
       records' names as they are ("Dr Priya Sharma and Mr C. Okafor"). Any surname shaping, such
       as `drSurname`, happens in the shared UI pieces of item 8.
   - `src/domain/surgeons.ts`: `surgeonsInRoom(surgeons, roomId)`, `groupsForSurgeon(groups,
     surgeonId)`, and `isPlausibleEmail(value)` (a deliberately loose `something@something.tld`
     check, shared by rooms and hospitals).
   - `src/domain/blacklist.test.ts` and `src/domain/surgeons.test.ts`:
     - an active entry warns and an ended one does not;
     - re-adding after ending warns again;
     - the partitions are stable and exhaustive, with no surgeon lost or duplicated;
     - a missing surgeon or anaesthetist id returns null, never a throw;
     - the message names both people and contains no en or em dash.
3. **Seed** (in `src/domain/seed/cast.ts`, or a new `seed/surgeonMasters.ts` re-exported from it). All
   of it is fictional, so use `.example` email domains and `03 555 ####` phones:
   - `ROOMS`: five or six fictional rooms (for example "Avonside Surgical Rooms" or "Riccarton
     Orthopaedic Rooms"; avoid real Christchurch practice names), each with a contact email and
     phone. Every seeded surgeon gets a `roomId`, and every room has at least one surgeon; share
     rooms where the specialties match (for example Whitford and Reid in one eye rooms).
   - Every `SURGEONS` row gains `roomId`, a fictional `medicalRegistrationNumber` (5 or 6 digits) and
     a fictional `hpiId` in the same `NNAAAA` shape the anaesthetists use (`10SOUM`), distinct from
     every anaesthetist `hpiId`.
   - `HOSPITALS` gain `contactEmail` (for example `bookings@stgeorges.example`).
   - `SURGEON_GROUPS`:
     - "Canterbury Orthopaedic Surgeons" (`SG-COS`) with Mr T. Hale as a member, matching the
       existing `ORG.cos` contract-holder organisation by name. Phase 18 re-points the COS Contract to
       this group; leave `organisations` and the COS Contract untouched here;
     - one more group, for example an eye group with Mr J. Whitford and Ms A. Reid.
   - `BLACKLIST`, with two entries:
     - **One active pairing that S2 can reach without blocking it:** Dr Priya Sharma with a surgeon
       who is not Mr T. Hale. Mr C. Okafor is the candidate, with reason "Surgeon's preference". In
       S2 Beat 2 (Sharma's Tue 21 PM, St George's, Hale) the surgeon picker then shows Okafor in the
       labelled blacklisted group, and the scripted Hale path is unchanged. Give it fixed
       `addedAtISO` and `addedBy` values (for example `2026-03-10T10:00:00`, "Kirsty W.").
     - **One ended entry, for history:** for example Dr Rawiri Hughes with Mr S. Tan, added
       2025-11-03 and ended 2026-05-12 by "Kirsty W." with end reason "Resolved with the surgeon's
       rooms".
     - Use fixed ISO timestamps, never the clock.
   - Wire three new masters into `SeedMasters` and the assembled state: `surgeonRooms`,
     `surgeonGroups` and `blacklist`, each a `Record` keyed by id. Seed ids are `RM-...`, `SG-...` and
     `BLK-...` (not `BL`, which is the billing-line prefix, and not `BK`, which Phase 15 gives
     Bookings). **Do not add surgeons, and do not touch `CES_SURGEONS`, `GENERAL_SURGEONS` or any
     generator input**, so the canvas is identical to before.
   - **Bump `PERSIST_VERSION` by one.**
   - Seed tests (`seed.test.ts`):
     - **write the canvas fingerprint test first, before any seed edit**, so the "unchanged" check
       below compares against the real pre-phase canvas;
     - every surgeon's `roomId` resolves and every room has at least one surgeon;
     - every group member and blacklist reference resolves;
     - hospital and room emails pass `isPlausibleEmail`;
     - no seeded List or Permanent List pairs an active blacklisted anaesthetist and surgeon. If the
       slot RNG happens to pair Sharma with Okafor, pick another surgeon for the seed entry rather
       than patching Lists;
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
     - `createSurgeon(api, actor, { name, specialty?, roomId, medicalRegistrationNumber?, hpiId? })`
       refuses a blank name, an unknown room, or a duplicate `hpiId`;
     - `editSurgeon(api, actor, surgeonId, patch)` takes the same fields, and the id is immutable;
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
     - `addBlacklistEntry(api, actor, { anaesthetistId, surgeonId, reason? })` refuses an unknown
       anaesthetist or surgeon, or an already active entry for the same pair. Re-adding after an end
       creates a new entry. It audits `blacklist.add` with entity type `blacklistEntry`. (US-13.6.3
       "Record a pairing".)
     - `endBlacklistEntry(api, actor, entryId, endReason?)` refuses an entry that is unknown or
       already ended. It sets `endedAtISO` and `endedBy`, keeps the record, and audits
       `blacklist.end` with before and after. (US-13.6.3 "Remove a pairing"; US-13.5.2 history.)
   - No delete actions for any of these masters. Masters are referenced by id; Phase 42 owns
     deactivation and controlled loads.
   - Tests: add `store/surgeonActions.test.ts` and extend `mastersActions.test.ts`. They cover:
     - the anaesthetist actor is refused on every action;
     - each validation refusal;
     - audit entries with the right action, entity and before/after;
     - end keeps the entry and a second end is refused;
     - duplicate active pairs are refused;
     - `editHospital` round-trips `contactEmail`.
6. **The warning on the store's write paths, which never block** (US-01.3.5 "Still selectable",
   US-13.6.3 "Warns, never blocks").
   - The paths: `editList` (surgeon change on an anaesthetist's List), `reassignList` (the List's
     surgeon against the target anaesthetist), and `addPermanentList` / `editPermanentList` (a usual
     surgeon on an anaesthetist's recurring template).
   - None of them refuses on a blacklisted pairing.
   - When the resulting pairing is actively blacklisted and the pairing actually changed, they add a
     second meta in the same commit: `list.blacklistAcknowledged` or
     `permanentList.blacklistAcknowledged`, with `after: { anaesthetistId, surgeonId, blacklistEntryId
     }`. A notes-only edit does not re-log it. This makes the office's decision to go ahead visible in
     History and the Audit viewer. It is the one extra rule this phase adds, and it is cheap, so name
     it in the Decisions log.
   - Only an office actor gets the check. `editList` also lets an anaesthetist edit their own DRAFT
     List; that path never checks or logs the blacklist (OQ-43). The acknowledgement's entity is the
     List or Permanent List, never a Booking, so it never enters the Booking History the
     anaesthetist sees (`shared/card/CardDetailBody.tsx` before Phase 15's rename).
   - Add the check through the helper from item 2, not inline, so Phase 28's rewrite, Phase 31's
     `assignDraftList` and Phase 32's swap confirmation call the same function.
   - Tests:
     - `editList` to a blacklisted surgeon succeeds and writes exactly one acknowledgement;
     - the same save again writes none;
     - `reassignList` onto a blacklisted anaesthetist succeeds with an acknowledgement;
     - an ended entry writes none;
     - an anaesthetist's own DRAFT `editList` to a blacklisted surgeon writes none.
7. **Audit reading layer.**
   - `shared/audit/actionLabels.ts` gets a label for every new code:
     - "Surgeon added", "Surgeon updated";
     - "Surgeons' room added", "Surgeons' room updated";
     - "Surgeon group added", "Surgeon group updated";
     - "Hospital updated";
     - "Blacklist entry added", "Blacklist entry ended";
     - "Blacklisted pairing assigned (warning acknowledged)".
   - `fieldLabels.ts` already has `anaesthetistId`, `surgeonId`, `hospitalId`, `name`, `phone`,
     `reason`, `description` and `hpiId` ("HPI id"). Add the missing keys: `contactEmail`,
     `specialty`, `roomId` ("Surgeons' room"), `medicalRegistrationNumber`, `memberSurgeonIds`,
     `addedAtISO`, `addedBy`, `endedAtISO`, `endedBy`, `endReason` and `blacklistEntryId`. One map
     serves every entity, so do not add a second meaning to an existing key.
   - Leave `auditNarrative.ts` rendering ids as ids. It is pure by design and does not resolve names
     for any entity today; adding name resolution is not this phase's job.
   - The existing `auditNarrative.test.ts` scan must pass.
8. **Shared UI pieces** (`src/shared/schedule/`, so Phase 32's mobile and web flows can reuse them;
   no Admin imports, which keeps pwaPurity safe):
   - `SurgeonSelect`: a native `<select>` that takes `anaesthetistId` and renders two `<optgroup>`s
     from `partitionSurgeonsForAnaesthetist`:
     - "Surgeons";
     - "Blacklisted with Dr <surname>" (the label comes from the shared name helper). Each option in
       it reads "<name> · blacklisted", so the closed select still shows it;
     - the empty option stays first, with its label as a prop (`emptyLabel`), because today's pickers
       differ ("Not assigned" in `EditListSheet`, "Not assigned yet" in `PhoneAdviceBooking`);
     - option text keeps each picker's current form through a prop (`EditListSheet` shows
       "Name (Specialty)", the others the name alone).
     The optgroup is the "clearly labelled group" of US-01.3.5.
   - `BlacklistWarning`: an inline callout in `semantic.warning.tint` and `.onTint` from
     `theme/tokens.ts` (the advisory-conflict box treatment in `ListDrawer.tsx` :61). It names the
     pairing and says the office can still go ahead. The recorded reason shows only when a
     `showReason` prop is set. It defaults to false, and every Admin caller passes true, so Phase 32
     cannot leak a reason to an anaesthetist by default (OQ-43). It carries `role="status"` and a
     `data-shot` hook.
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
       created (`onCardCreated` today), so the acknowledgement lands then and an abandoned flow
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
       "Add anyway" (for "Add permanent list").
   - The Draft List picker does not exist yet. Phase 31 builds it with
     `partitionAnaesthetistsForSurgeon` and `BlacklistWarning`, and its AC check ("Both paths")
     happens there.
10. **Master data screens** (US-13.4.1 rows; US-13.6.1 "Room record"). Split the new views out of
    the 553-line `MasterData.tsx` into `apps/admin/screens/masters/`, with sheets in
    `apps/admin/flows/`.
    - The sub-nav (`Entity`, `NAV`) becomes:
      Anaesthetists · Contracts · Permanent lists · Hospitals & holidays · **Surgeons** ·
      **Surgeons' rooms** · **Surgeon groups** · Insurers · Organisations · RVG codes ·
      Modifier codes · List statuses · Xero & archiving.
    - The selected view is read from and written to a `?view=` search param (the router already keeps
      transient view state in the query), so a profile page can link back to `?view=surgeons`.
    - **Hospitals & holidays:**
      - each hospital card shows its contact email, or "No contact email" in mist;
      - an "Edit" link opens `EditHospitalSheet` (name and contact email);
      - `AddHospitalSheet` gains an optional contact email field;
      - update the header copy.
    - **Surgeons:**
      - an editable table with columns Name · Specialty · Room · HPI number (mono) · Blacklist (count
        of active entries, as a warning pill when there are any);
      - a row click navigates to the profile page;
      - "Add surgeon" opens `SurgeonEditSheet` (name, specialty, room select, registration number,
        HPI number (CPN) with the OQ-52 provisional hint);
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
      - the screen is `apps/admin/screens/SurgeonProfile.tsx`, with a back link to
        `/admin/masters?view=surgeons`.
    - **Header:** the name, the specialty, and an "Edit details" button that opens
      `SurgeonEditSheet`.
    - **Identifiers card:**
      - NZ medical registration number and HPI number (CPN), both mono;
      - the provisional hint while OQ-52 is open;
      - the "not the patient's NHI" note from the catalogue as a caption.
    - **Room card:** the room's name, contact email and phone, and the other surgeons in the room.
      Show the email as text. The mailto drafting is Phase 35's.
    - **Groups:** membership chips.
    - **Blacklist section:**
      - active entries as rows: the anaesthetist's name, the reason or "No reason recorded", and
        "Added by Kirsty W. on 3 Nov 2025";
      - each row has an "End" action that opens `BlacklistEndSheet` (optional end reason, then
        confirm);
      - an "Add to blacklist" button opens `BlacklistAddSheet`: an anaesthetist select (already
        blacklisted ones are disabled) and an optional reason;
      - below the active rows, a collapsed "Ended entries" disclosure shows each ended entry with who
        ended it, when, and why.
    - **Layout:** a proper desktop layout (convention 16), with sheets through `useSurface().Overlay`
      as the existing Admin sheets do.
12. **Admin cross-links:**
    - `ListDrawer`: the surgeon row links to that surgeon's profile, and following the link closes
      the drawer.
    - `EditAnaesthetistSheet`: a read-only "Blacklisted with" line lists the anaesthetist's active
      entries as links to the surgeon profiles. This satisfies US-13.6.3's conditional "if the
      blacklist is also shown on the anaesthetist's profile, the entry appears there too" on the
      Admin side only.
    - Nothing on the mobile, web or PWA anaesthetist profile (OQ-43).
13. **Playwright** (`npm run shots`):
    - add `visual/admin-phase17.spec.ts` with `data-shot` hooks for:
      - the Surgeons table;
      - the Surgeons' rooms table;
      - Mr C. Okafor's profile (`/admin/masters/surgeons/S-OKAFOR`, or whichever surgeon the seed
        pairs), with the blacklist and ended history;
      - EditListSheet on Dr Sharma's Tue 21 AM List with the blacklisted surgeon selected and the
        warning showing (a closed native select cannot be screenshotted open, so shoot the selected
        "· blacklisted" option plus the warning);
      - the reassign picker's blacklisted section, from Dr Rutherford's Tue 21 PM Forte List (Mr C.
        Okafor, a design fixup), where Dr Sharma's Free Tue 21 PM puts her under "Blacklisted with
        Mr C. Okafor". Open the picker only; do not confirm, because that would consume the S2
        Beat 2 Free session;
    - keep `admin-phase07.spec.ts`'s master-data shot passing.
14. **Finish green:**
    - `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots`;
    - `persistMigrate.test.ts` covers the bumped version;
    - `pwaPurity.test.ts` still passes (the new domain helpers are pure, and the shared pieces import
      nothing from `apps/admin`, `apps/demo` or `shell`).

## Demo triggers

**None.** Everything in this phase is an office action done through normal Admin use: editing
masters, adding or ending a blacklist entry, and picking a surgeon or an anaesthetist. None of it is
automatic, scheduled or external, so it needs no harness-bar button. It is also Admin only, so it
needs no PWA equivalent: the anaesthetist-side warning is Phase 32's, and so is its PWA office
stand-in, "Office confirms this swap". Register nothing in Phase 14's registry and add nothing to the
Control Panel. The profile route is URL-addressable (`/admin/masters/surgeons/:surgeonId`), so a
later phase can scope a trigger to it if one is ever needed.

## Out of scope

- **The anaesthetist hand-over warning** (US-01.4.5) and any anaesthetist-facing view of the
  blacklist: Phase 32, with OQ-43.
- **The Draft List assignment path** of US-01.3.5: Phase 31 wires the helper built here.
- **The Surgeon Group as a Contract holder:** Phase 18 adds it, re-points the COS Contract and
  decides whether Organisations are retired or relabelled.
- **Using the contact emails:**
  - the mailto booking update email to the rooms or the hospital: Phase 35;
  - emailing the rooms about a missing NHI: Phase 40;
  - estimated durations from the rooms: Phase 27.
- **Deleting or deactivating** surgeons, rooms, groups or hospitals, spreadsheet loads of this
  reference data, and editable insurers: Phase 42.
- **Existing Lists that already pair a blacklisted anaesthetist and surgeon:** they are not
  re-flagged on the Day grid. The warning fires at assignment. A cross-date view is Phase 30's
  conflict dashboard territory, if AA wants it.
- **A surgeon in more than one room.** The catalogue recommends one room per surgeon, and the meeting
  did not settle it.
- Any HPI or CPN format validation beyond trimming (OQ-52).

## Manual test checklist

- [ ] Admin, Master data:
  - Surgeons lists every seeded surgeon with a room and an HPI number;
  - Surgeons' rooms shows each room's email, phone and derived surgeons;
  - Surgeon groups shows Canterbury Orthopaedic Surgeons with Mr T. Hale;
  - Hospitals & holidays shows a contact email on every seeded hospital.
- [ ] Add a surgeon with a room and an HPI number. The new surgeon appears in the Surgeons table and
  in that room's surgeon list, and Audit shows "Surgeon added" by Kirsty W.
- [ ] Editing a room's email to an implausible value is refused with a plain message. A valid edit
  saves and appears in Audit with before and after values.
- [ ] Edit a hospital's contact email. It shows on the hospital card and in Audit ("Hospital
  updated").
- [ ] Open the seeded blacklisted surgeon's profile from the Surgeons table:
  - identifiers (with the provisional CPN hint while OQ-52 is open);
  - the room's contact email and phone;
  - group chips;
  - the active blacklist entry with its reason, and the ended entry under "Ended entries";
  - the back link returns to the Surgeons view.
- [ ] Add a blacklist entry from a profile. It appears at once, the same anaesthetist is disabled in
  the add sheet, and it shows on that anaesthetist's Admin edit sheet under "Blacklisted with".
- [ ] End that entry with a reason. It moves to "Ended entries" with who and when. It no longer
  warns, and Audit shows "Blacklist entry ended".
- [ ] Day view, Tue 21 July, Dr Priya Sharma's PM Free List, **Book (phone advice)**:
  - the surgeon picker shows the blacklisted surgeon in a separate "Blacklisted with Dr Sharma"
    group, and Mr T. Hale in the main group;
  - choosing the blacklisted surgeon shows the amber warning naming both people, and the button reads
    "Continue anyway";
  - switching back to Hale clears the warning;
  - the scripted S2 Beat 2 (St George's, Hale, Look up, Save) runs exactly as before.
- [ ] **Edit list** on Dr Sharma's Tue 21 AM List: selecting the blacklisted surgeon warns and "Save list anyway"
  saves. The List's History shows "Blacklisted pairing assigned (warning acknowledged)", and a
  following notes-only edit does not repeat it.
- [ ] **Reassign list** from Dr Rutherford's Tue 21 PM Forte List (Mr C. Okafor), or whichever List
  pairs the seeded blacklisted surgeon with a Free session on the same day:
  - Dr Sharma appears under a separate "Blacklisted with Mr C. Okafor" heading and can still be
    chosen;
  - confirming warns and succeeds, and the List's History shows the acknowledgement;
  - reset the demo data afterwards, because this uses Sharma's S2 Beat 2 Free session.
  S2 Beat 3 (Rutherford Wed 22 AM to Sharma) shows no warning and runs unchanged.
- [ ] Permanent list sheet: choosing a blacklisted usual surgeon for that anaesthetist warns and saves
  anyway.
- [ ] The mobile app, the web app and the PWA show no blacklist, reason or warning anywhere.
- [ ] The Day grid and every seeded List look identical to before the phase (the canvas is
  unchanged).
- [ ] No en or em dash in any new copy, and no crimson on any new control or warning.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots` are all green.

## Demo guide updates

In the same session, following the ROADMAP's rule that each phase patches the beats it touches:
- `docs/demo-guide/03-demo-script.md`:
  - **S2 Beat 2:** add an optional pointer. On the surgeon picker, show the "Blacklisted with Dr
    Sharma" group and, if time allows, select it to show the soft warning, then return to Mr T. Hale.
    Add an **Expected** line for the grouped picker, and a **Say** line: "The office's naughty list
    is now data. It warns, it never blocks."
  - **S2 Discovery points:** add OQ-43 (what an anaesthetist should see) and OQ-52 (what CPN is).
  - **Direct URLs:** add Surgeon profile `/admin/masters/surgeons/<surgeonId>` and Master data views
    `/admin/masters?view=surgeons`.
  - S2 Beat 3 is unchanged, and the seed test protects it.
- `docs/demo-guide/04-presenter-cheat-sheet.md`: one line for the surgeon profile and blacklist
  (where it lives, the seeded pairing, "warns, never blocks").
- `docs/demo-guide/02-workflows-and-handoffs.md`: under the office's master-data work, note that
  rooms, surgeon groups, hospital contact emails and the blacklist are maintained in Admin.
- `docs/demo-guide/master-demo-guide.html`: mirror the same S2 Beat 2 edit (the "Beat 2 · a
  phone-advice booking" block), the discovery points, the Direct URLs table and the cheat-sheet line.
- **Control Panel scenario text** (`apps/demo/DemoControlPanel.tsx`, the S2 blurb): no change needed.
  Mention the optional blacklist moment only if the blurb lists the beats' content.
- This is not a milestone phase, so no full consistency read is needed. Do check that the patched
  sections of the master guide match the run sheet word for word.

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
  `PermanentListSheet` or the store actions. That is what lets Phases 28, 31 and 32 reuse it.
- **History is kept.** Ending an entry never deletes it; re-adding creates a new entry; each add, end
  and acknowledged assignment is audited once with before and after, labelled, and readable in the
  Audit viewer. A notes-only List edit must not re-log the acknowledgement.
- **Determinism and seed hygiene.** The generated canvas is byte-for-byte unchanged (no new surgeons,
  pick arrays untouched); the seeded active pairing does not collide with any seeded List or with the
  S2 Beat 2 and Beat 3 paths; timestamps come from the clock or fixed seed strings; `PERSIST_VERSION`
  is bumped.
- **Privacy of the list.** The blacklist, its reasons and its warnings appear only in Admin. Nothing
  reaches the mobile, web or PWA surfaces or the PWA bundle's UI (OQ-43). `BlacklistWarning` hides
  the reason unless `showReason` is set, and an anaesthetist actor's store writes never check or log
  the blacklist. The HPI identifier is never
  presented as, or confused with, the patient NHI.
- **Model shape.** Room membership has a single source (`Surgeon.roomId`, derived on the room);
  surgeon groups are a separate master with members and do not silently replace `organisations`
  (Phase 18's job); `Hospital.contactEmail` round-trips through create and edit.
- **Design and copy.** Warning tint for the warning and never error red; teal-only actions; crimson
  unused; no en or em dashes in any new string; Admin sheets through `useSurface().Overlay`; the
  profile is a real desktop page, not a modal.

## PROGRESS.md updates

- **Status row** for catch-up Phase 17, and a phase entry with:
  - the drift-check result (items changed or not; OQ-52 and OQ-43 status);
  - what was built;
  - the `PERSIST_VERSION` bump (from and to);
  - tests added;
  - the review pass.
- **Decisions log:**
  1. One room per surgeon (`Surgeon.roomId` required, room members derived), the catalogue's
     recommendation pending AA.
  2. A single HPI identifier stands in for "HPI number" and "CPN" until OQ-52 answers, labelled
     provisional.
  3. The blacklist warns and never blocks. Going ahead writes a `*.blacklistAcknowledged` audit entry.
     This is a new, cheap rule; name it as such.
  4. The blacklist is Admin only until OQ-43 is answered.
  5. Surgeon groups are a new master beside `organisations`, and Phase 18 re-points the COS Contract.
  6. The reassign picker counts as "assigning a List" for US-01.3.5.
  No July ruling is superseded. The Phase 06 advisory-conflict reading (amber, never a hard block) is
  extended, not changed.
- **Handoff notes:**
  - For **18**: `surgeonGroups` and `SG-COS` are ready as a holder.
  - For **28**: re-home the helper calls when the assignment flows are rewritten.
  - For **31**: use `partitionAnaesthetistsForSurgeon` and `BlacklistWarning` in the Draft List
    picker, and check US-01.3.5 "Both paths" there.
  - For **32**: the helper is pure and PWA-safe, `BlacklistWarning` hides the reason by default
    (`showReason`), and OQ-43 decides the wording.
  - For **35** and **40**: the room and hospital emails are the To addresses.
  - For **42**: no delete or deactivate yet, and loader targets for these masters.
