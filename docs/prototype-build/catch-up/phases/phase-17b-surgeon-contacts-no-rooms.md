# Phase 17b · Surgeon contacts on the surgeon, and no surgeons' rooms

**Requirements covered:**
[RV-42](../analysis/reverse-check.md#rv-42-the-surgeons-rooms-master-record-is-built-in-full-new) (Rework, M: built 17 and 17a made the surgeons' rooms master that [US-13.6.1](../../../../requirements-board/requirements/stories/US-13.6.1.md) now Retires).
Follows up, **on their own phases' covers**: built 17's [FT-13.6](../../../../requirements-board/requirements/stories/FT-13.6.md) (now "Surgeons") and [US-13.6.2](../../../../requirements-board/requirements/stories/US-13.6.2.md) (the practice name as text, an HPI CPN that may be blank, the address book), built 17a's [US-13.6.5](../../../../requirements-board/requirements/stories/US-13.6.5.md) (one personal and one or more office contacts on a plus and minus form) and [DM-60](../analysis/domain-model-delta.md#dm-60), and the surgeons part of [US-13.4.1](../../../../requirements-board/requirements/stories/US-13.4.1.md) (no "Surgeons' rooms" master). This phase builds them and recaptures their recipes.
Context only, built elsewhere: [US-02.2.4](../../../../requirements-board/requirements/stories/US-02.2.4.md) (a List's origin and sender, 34), [US-02.3.3](../../../../requirements-board/requirements/stories/US-02.3.3.md) (the update email, 35), [US-11.1.5](../../../../requirements-board/requirements/stories/US-11.1.5.md) (the missing-NHI request, 40) and [US-13.4.3](../../../../requirements-board/requirements/stories/US-13.4.3.md) (the cutover load, 42): each reads this phase's one email helper or loads into its shapes. [US-13.6.6](../../../../requirements-board/requirements/stories/US-13.6.6.md) (specialties, 18a) and the pairings (17) are kept, not built.

**Depends on:** Phase 17a (the rooms, contacts and helper this phase removes), Phase 26 (the anaesthetist's HPI CPN made mandatory: it stays mandatory, so the surgeon's optional HPI CPN must not loosen it) and UI unification Phase U6 (and through it U1 to U5): `Card`, `DefRow`, `PageHeader`, the table kit (`src/shared/table/`) and `AddRowButton`, with U4's `TextField` and U5's `Button`, `IconButton` and `TextAction`. It may run beside 32d in its own worktree if the owner sets that up (ROADMAP "Run order"); the two meet only in `types.ts`, `seed/index.ts`, `PERSIST_VERSION`, the audit label files and the catalogue: add lines, never rewrite.
**Estimated:** 2 sessions. Session 1: items 1 to 7 (pin, model, domain and the one helper, store guards, re-seed, the room screens taken out), green; the checkpoint. Session 2: items 8 to 14 (contact fields, the edit sheet's plus and minus form, the profile, the surgeons table, re-pointing, shared components, tests), then the recaptures, the demo guide and the review. Admin desktop only: nothing reaches the anaesthetist apps or the PWA.

## Goal

The system keeps **no record of surgeons' rooms** (D74; US-13.6.1 Retired). Built 17 and 17a made one: `SurgeonRoom` with email, phone and `RoomContact[]`, `Surgeon.roomIds`, a "Surgeons' rooms" Master data view, room and contact sheets, a room card per room on the profile, `domain/roomContacts.ts` and a required room and HPI CPN per surgeon. About 22 non-test files read them. Unwind all of it and put what the office needs on the surgeon:

1. **The practice name** as plain text (US-13.6.2): for the office to read; nothing depends on it.
2. **One personal contact** (the surgeon's own name, email and phone) and **one or more office contacts** (a practice manager, PA or shared inbox; name, email, phone; blanks allowed), entered on a form that always shows one office set, a plus adding a set and a minus on extra sets only (US-13.6.5). A surgeon at two practices holds an office contact for each.
3. **An HPI CPN admin staff fill in** (D76): a surgeon saves, and is booked, without one ("No HPI CPN yet"), and the number is unique across practitioners when held. Whether it ever becomes required is OQ-143: the default (D89) is never, through one predicate.
4. **The surgeon list is AA's address book** (OQ-126): surgeons and how to reach them, people only, kept by admin staff. No separate address book, no hospital or insurer contacts here.
5. **One helper for the office's emails**, replacing 17a's: the surgeon's first office contact with an email is the To, the other office contacts are offered, never all of them at once. 34 puts the List's sender in front of it; 35 and 40 read it and nothing else.
6. **The fictional directory re-seeded** with practice names and contacts in place of rooms, a few surgeons with no HPI CPN, and the two-practice surgeons holding an office contact for each practice.

17's pairings and tiers and 18a's specialties are untouched. No S1 to S5 figure moves.

## Before you start

**1. Drift check against `63a4490`.** The context pack runs:

```
node requirements-board/agent/skills/update-build-plan/tools/plan-state.mjs --diff FT-13.6,US-13.6.1,US-13.6.2,US-13.6.5,US-13.6.6,US-13.4.1,US-13.4.3,US-02.2.4,US-02.3.3,US-11.1.5,OQ-126,OQ-127,OQ-128,OQ-129,OQ-143
```

Adjust the work items to any change in substance. Nothing listed had changed at plan time beyond `63a4490`.

**2. Questions and decisions.** Built as answered, no provisional label anywhere (Donald for the build, not yet confirmed by AA):

- [OQ-127](../../../../requirements-board/requirements/questions/OQ-127.md) (D74): contacts on the surgeon, no room record; the office's emails to the List's sender, else the first office contact, others offered, never every contact. 17a's `ROOM_CONTACTS_PROVISIONAL_NOTE` and every "provisional" caption go.
- [OQ-128](../../../../requirements-board/requirements/questions/OQ-128.md) (D75): superseded. No surgeon is attached to a room; 17a's rooms list goes.
- [OQ-126](../../../../requirements-board/requirements/questions/OQ-126.md): the surgeon list is the address book, people only. Nothing new is built for it beyond the table's sub-line.
- [OQ-129](../../../../requirements-board/requirements/questions/OQ-129.md) (D76): admin staff fill the HPI CPN in; saved without one; unique when held.

Open, built as its default:

- [OQ-143](../../../../requirements-board/requirements/questions/OQ-143.md) (D89) part 1: the surgeon's HPI CPN **never** becomes required: saved and booked without one, shown as "No HPI CPN yet", no warning rule. One predicate, `surgeonHpiCpnRequired()` returning `false`, pinned by a test, so "required before the first Booking" is a small change. Part 2 (rows with no title or surname) is 42's.

Build choices US-13.6.5 leaves open, built as defaults and put on the "For the owner's review" list: an office set with all three fields blank is dropped on save (any one field keeps it); the personal contact is always held, any field blank; office contacts carry no label (a shared inbox's contact is named for its practice); the helper never offers the personal contact; a two-practice surgeon's practice name holds both names ("Upper GI Partners and Hillsborough Surgical"), one office contact per practice, the main practice's first.

**3. Stops.** Stop and tell the owner if: Phase 26 is not DONE (the anaesthetist's mandatory HPI CPN must be in the code before the surgeon's goes optional, so the split is tested); a covered item now brings back a room record or ties a surgeon to a practice record; or the grep in item 1 finds a room reader in billing, Booking, intake or the anaesthetist apps that needs more than a re-point (record it; do not redesign that screen).

**4. Confirm DONE and note the names each shipped** (from its PROGRESS entry and handoff):

- **17a**: `SurgeonRoom`, `RoomContact`, `RoomContactRole`, `Surgeon.roomIds`; `surgeonsInRoom`, `roomsForSurgeon`, `mainRoomOf` (`domain/surgeons.ts`); `domain/roomContacts.ts` (all of it); `store/roomContactActions.ts`; `ID_FORMATS.surgeonRoom` (`RMN`) and `.roomContact` (`RCN`); `ChipMultiSelect`'s `ordered` variant; `RoomContactsList`, `RoomContactSheet`; `apps/roomContactsGuard.test.ts`, `store/phase17aSeed.test.ts` and its `__parity__/phase-17a-baseline.json`, `visual/admin-phase17a.spec.ts`; the directory seed's `DIRECTORY_ROOM_CONTACTS` (RC-001 to RC-009) and the four two-practice surgeons (Winslow, Wainwright, Morland, Vaughan).
- **26**: the anaesthetist's required-HPI refusal and its code name in `store/mastersActions.ts`, and the Profile card on the record page. Leave both alone.
- **U6**: `Card`, `DefRow`, `PageHeader`, `Th`/`Td` and the table kit, `AddRowButton` (its `size`), and how `ProfileChrome` sits on them.
- Note the current `PERSIST_VERSION` (50 at plan time; 26 and others may have bumped it).

**5. Reads beyond the skill's standard list** (each by section):

- **Design.** No mockup has a surgeon screen. `docs/design/Admin Review.dc.html`: its side sheet (field stack, section labels, footer actions) for the edit sheet and its plus and minus sets; the profile and the Master data table extend `ProfileChrome` and the table kit as U6 left them.
- **ROADMAP.md** owner decisions: D74 (contacts on the surgeon, no rooms, the To order), D75 (superseded, rooms list removed), D76 (HPI CPN filled in by admin staff, blank allowed, unique), D89 (OQ-143 default: never required, one predicate). Sequencing: "Run order" (17b after 26; optionally beside 32d) and the U-dependency rule.
- **GAP-ANALYSIS.md**: the EP-13 section summary (the "STRUCTURAL" paragraph) and its FT-13.6 row; the DM-60 row; RV-42 in `analysis/reverse-check.md` (its prototype evidence, with file and line).
- **Catalogue**: US-13.6.2 and US-13.6.5 whole (they are the spec); FT-13.6; US-13.6.1 (Retired: what goes); US-13.4.1 (the surgeons bullet only); US-02.2.4 and US-11.1.5 (the To rule the helper serves); OQ-143. `domain-model.md` "Surgeon, contacts, preferences and priority tiers". AR-67 (the 18 November note), points 6 to 11.
- **PROGRESS.md** Decisions log: 2026-10-09 "One room per surgeon" and "The HPI CPN is one required `hpiId` on a surgeon" (both superseded here, the surgeon half only for the second); 2026-11-17 Phase 17a (1), (2) and (3) (superseded). Catch-up entries: 17 (the sheets, the profile, `surgeonMasters.test.ts`), 17a (everything listed in step 4, its test files and seed facts), 18a (the specialties field to keep), 26 (the anaesthetist HPI guard), U6 (the shared parts).
- **Maps** in `analysis/`: `prototype-map-admin` (Master data and the surgeon profile), `-store-seed` and `-domain`.

## Reference

- `src/domain/types.ts`: `Surgeon` (346 to 371: `roomIds` 362, `hpiId` 369), `SurgeonRoom` 375, `RoomContactRole` 391, `RoomContact` 400; the `masters.surgeonRooms` slice.
- `src/domain/surgeons.ts`: `surgeonsInRoom` 28, `roomsForSurgeon` 41, `mainRoomOf` 51, `isPlausibleEmail` 66, `normaliseHpiCpn` 71, `isPlausibleHpiCpn` 76, `hpiCpnHolder` 86 (blank never clashes; keep). `src/domain/roomContacts.ts` (delete).
- `src/store/surgeonActions.ts`: the surgeon field cleaner (`roomRequired` 53, `hpiCpnRequired` 58, `invalidHpiCpn`, `duplicateHpiCpn` 63), `createSurgeon` 89, `editSurgeon` 106, `createSurgeonRoom` 205, `editSurgeonRoom` 224; `store/roomContactActions.ts` (delete); `store/mastersActions.ts` `hpiCpnClash` 188 (the anaesthetist's; do not touch); `store/mutate.ts` `ID_FORMATS` 92 and 96; `store/index.ts` 243 to 252.
- `src/shared/audit/actionLabels.ts` 130 to 135, `fieldLabels.ts` 189 to 197.
- Admin: `screens/masters/view.ts` 13 and 37, `MasterData.tsx` 7 and 74, `SurgeonsView.tsx` (table 53, `data-rooms` 67, `SurgeonRoomsView` 88), `screens/SurgeonProfile.tsx` (header 46 and 47, Identifiers 63, room rows 85 to 110, `RoomCard` 110), `flows/SurgeonEditSheet.tsx` (rooms field 61 to 69, HPI CPN 71), `flows/SurgeonRoomSheet.tsx`, `flows/RoomContactSheet.tsx`, `components/RoomContactsList.tsx` (delete the three), `components/ChipMultiSelect.tsx` (`ordered`), `components/ProfileChrome.tsx`.
- Seed: `seed/cast.ts` (`ROOM` 104, `SURGEON_ROOMS` 112, ten surgeons 128 on), `seed/specialistDirectory.ts` (header 1 to 30, `DIRECTORY_ROOM_CONTACTS`, 40 rooms, 131 surgeons), `seed/index.ts` 42 and 64, `store/appStore.ts` (`PERSIST_VERSION` 297, history 133 to 135).
- Catalogue code: `apps/demo/catalogue/AdminCatalogue.tsx` (rows `ChipMultiSelect` 226, `RoomContactsList` 230, `ProfileChrome` 257), `admin/storeExamples.tsx`.
- Tests that read rooms: `domain/roomContacts.test.ts`, `store/roomContactActions.test.ts`, `apps/roomContactsGuard.test.ts`, `store/phase17aSeed.test.ts` (delete or replace); `domain/surgeons.test.ts`, `store/surgeonActions.test.ts`, `seed/surgeonMasters.test.ts`, `domain/pairingPreferences.test.ts`, `store/phase18aSeed.test.ts`, `store/specialtyTagActions.test.ts`, `store/persistMigrate.test.ts`, `screens/masters/mastersPages.test.tsx` (re-express); `visual/admin-phase17.spec.ts`, `visual/admin-phase17a.spec.ts`.

## Work items

**Session 1: model, guards, helper, seed, rooms out.**

1. **Pin first.** Before any edit, write `__parity__/phase-17b-baseline.json`: the 10 cast and 131 directory surgeon ids, names, specialties, HPI CPNs and registration numbers; every room's name, email, phone and contacts and its surgeons in `roomIds` order (the re-seed's source); the pairing, tier and group records; the canvas fingerprint and golden values. Run the room grep (`SurgeonRoom|RoomContact|roomIds|surgeonRooms|roomContacts|roomEmailForSurgeon|otherRoomsForSurgeon|surgeonsInRoom|roomsForSurgeon|mainRoomOf|roomRequired|NO_ROOM_EMAIL|ROOM_CONTACT_ROLE`) and record every file in the log (34 files, 22 non-test at plan time, all in admin Master data, the seed, the store, the domain and the catalogue; Phases 18 to 26 added none). Only rooms, contacts, the practice names, the chosen blank HPI CPNs and the new contact fields may change; names, specialties, pairings, tiers, groups and every List may not.
2. **Model** (`types.ts`; DM-60).
   - Remove `SurgeonRoom`, `SurgeonRoomId`, `RoomContact`, `RoomContactRole`, `Surgeon.roomIds` and `masters.surgeonRooms`; `ID_FORMATS.surgeonRoom` and `.roomContact`.
   - New `SurgeonContact { name?: string; email?: string; phone?: string }`, each field absent when blank, never `''`.
   - `Surgeon` gains `practiceName?: string`, `personalContact: SurgeonContact` (always present, any field blank) and `officeContacts: SurgeonContact[]` (in order, the first with an email the default To; empty when none; never an all-blank set). `hpiId` becomes `hpiId?: string`, absent when blank. `Anaesthetist.hpiId` is untouched.
3. **Domain** (`domain/surgeons.ts` and new `domain/surgeonContacts.ts`, pure, with tests).
   - Delete `surgeonsInRoom`, `roomsForSurgeon`, `mainRoomOf` and `domain/roomContacts.ts`.
   - `NO_HPI_CPN = 'No HPI CPN yet'` and `surgeonHpiCpnRequired()` (OQ-143's default, D89: `false`; the one place the rule lives, with a comment naming OQ-143). `hpiCpnHolder` unchanged (blank never clashes).
   - `cleanContact(c)` (trim, drop blank fields) and `isBlankContact(c)`.
   - **The one email helper**: `officeAddressFor(masters, surgeonId): { to: OfficeAddress | null; others: OfficeAddress[] }`, with `OfficeAddress { email: string; name?: string; source: 'officeContact' }`. `to` is the first office contact with a non-blank email; `others` the remaining office contacts with an email, in order, de-duplicated by email (case-insensitive), never including `to`. Never the personal contact, never every contact as the To, never throws (an unknown surgeon or none held gives `{ to: null, others: [] }`). The `source` union is where 34 adds `'listSender'` in front; its header says so.
   - Replace `apps/roomContactsGuard.test.ts` with `apps/officeAddressGuard.test.ts`: a source scan that no file outside `surgeonContacts.ts`, `surgeonActions.ts`, the seed and the three surgeon screens reads `officeContacts`, so 34, 35 and 40 use the helper.
4. **Store** (`surgeonActions.ts`).
   - `SurgeonFields` drops `roomIds` and gains `practiceName`, `personalContact`, `officeContacts`. Remove `roomRequired`. The HPI CPN: blank is saved as absent unless `surgeonHpiCpnRequired()`; non-blank must pass `invalidHpiCpn` and `duplicateHpiCpn` (across surgeons and anaesthetists, as now). The anaesthetist's guard in `mastersActions.ts` stays separate and mandatory (26): if any required-HPI code is shared, split it; never loosen the anaesthetist's.
   - Contacts: each cleaned; a non-blank email must pass `isPlausibleEmail` (`invalidEmail`, naming the contact: "Personal contact" or "Office contact 2"); all-blank office sets dropped; order kept. The practice name trimmed, absent when blank.
   - Remove `createSurgeonRoom`, `editSurgeonRoom` and the contact clearing; delete `roomContactActions.ts`; trim the barrel.
   - Audit: `editSurgeon` diffs `practiceName`, `personalContact`, `officeContacts` and `hpiId`, printing a contact as "name · email · phone" (blanks left out) and a blank HPI CPN as "None", never `undefined`. Labels in `fieldLabels.ts`: "Practice", "Personal contact", "Office contacts"; remove `roomId` and `rooms`. Remove the `surgeonRoom.*` and `roomContact.*` action labels after grepping the seed's audit for them.
5. **Re-seed** (`cast.ts`, `specialistDirectory.ts`, `seed/index.ts`), deterministic, from the pinned rooms only (never `Christchurch_Specialists.xlsx`, which names real people; `.example` domains only).
   - Practice name: the surgeon's room name; a two-practice surgeon both, main first, joined with " and ".
   - Office contacts, per practice in order: the PA named for the surgeon (17a's `forSurgeonId`), then the practice's whole-room contacts (Nicola Holloway, Rosalind Pemberton), then the shared inbox named for the practice (e.g. "Merivale Eye Rooms", its email and phone) where it held either. A practice with none gives no set (the form shows one empty set). Wainwright, Morland, Winslow and Vaughan hold a contact for each practice.
   - Personal contact: the surgeon's name; the cast ten get an invented `.example` email and a 021 555 phone; the directory's carry the name only (the list gives none).
   - HPI CPN: three directory surgeons held blank, chosen from those no List, Contract, pairing or group names; name them in the log and ATLAS.
   - Rewrite the directory header (no rooms; where contacts come from, our reading; the blank three). Remove `ROOM`, `SURGEON_ROOMS`, `DIRECTORY_ROOMS`, `DIRECTORY_ROOM_CONTACTS`.
   - Bump `PERSIST_VERSION` once, with a history line, and add its `persistMigrate.test.ts` case.
6. **Room screens out** (so session 1 ends green; the new contact UI is session 2).
   - `view.ts` and `MasterData.tsx`: no `surgeonRooms` view or sub-nav button; an old `?view=surgeonRooms` URL opens Surgeons, as the other renamed views do.
   - Delete `SurgeonRoomSheet.tsx`, `RoomContactSheet.tsx`, `RoomContactsList.tsx` and `SurgeonRoomsView`. `SurgeonProfile`: the room rows and `RoomCard` go. `SurgeonEditSheet`: the rooms field goes; "HPI CPN (required)" becomes "HPI CPN" with the hint "Leave blank until known. No two practitioners share one."
   - `ChipMultiSelect`'s `ordered` variant: remove it, its test and its catalogue sentence if nothing else uses it.
   - Catalogue rows: remove `RoomContactsList` and its `storeExamples` entry; trim the `ChipMultiSelect` and `ProfileChrome` sentences.
7. **Tests, session 1.** New `store/phase17bSeed.test.ts` (from the baseline: counts, names, specialties, pairings and groups unchanged; every surgeon's practice name and office contacts as item 5 says; the four at two practices; exactly three blank HPI CPNs; no `''` field anywhere). `surgeonContacts.test.ts` (the helper: first with an email, a blank email skipped, others de-duplicated and in order, personal contact never offered, unknown surgeon). `surgeonActions.test.ts`: blank HPI CPN saves; a duplicate and a malformed one refused; an anaesthetist with a blank HPI CPN still refused (26); all-blank sets dropped; a bad contact email refused by name; the audit labels. Delete the four room test files; re-express the others in the Reference list. Grep gate: zero room-symbol hits in `src` outside `appStore.ts`'s history comments. **Checkpoint**: green, log line.

**Session 2: the form, the profile, the table.**

8. **`ContactFields`** (new, `apps/admin/components/ContactFields.tsx`, used twice on the sheet): Name, Email (`type=email`, mono) and Phone (`type=tel`) on U4's `TextField` in one row group with a legend; an optional remove `IconButton` (lucide `Minus`, label "Remove office contact 2"); `data-shot` from its caller. Add its catalogue row.
9. **The edit sheet** (`SurgeonEditSheet.tsx`, Admin Review's sheet): Name; Practice (`TextField`, optional, hint "As the office knows it"); Specialties (18a's, unchanged); HPI CPN (optional); registration; then a "Personal contact" section (`surgeon-personal-contact`; on add, Name prefilled from the surgeon's name) and an "Office contacts" section (`surgeon-office-contacts`): always at least one set; U6's `AddRowButton` "Add office contact" (`office-contact-add`) appends an empty set and focuses its Name; a minus on sets 2 and on (`office-contact-remove`) removes that set whole and focuses the set above; one set left shows no minus. Inline `FormError` per contact. No new field primitive: a missing variant goes on the shared component.
10. **The profile** (`SurgeonProfile.tsx`): header sub "specialties · practice name"; the HPI CPN chip and Identifiers row show the number, or "No HPI CPN yet" in mist; one "Practice and contacts" card (keeps the `surgeon-contacts` shot) beside Specialties and Groups: the practice name, the personal contact, then each office contact (name, mono email, phone, "Not recorded" in mist for a blank), the first with an email marked by a neutral `Pill` "Office emails go here first". Pairing preferences unchanged. Layout per `ProfileChrome` and U6's `Card` and `DefRow`.
11. **The surgeons table** (`SurgeonsView.tsx`, U6's table kit): columns Name, Specialties, Practice, Office contact (the helper's `to`: name and mono email, or mist "None held"), HPI CPN (mono, or mist "No HPI CPN yet"), Pairings; hooks `data-practice`, `data-hpi` on the row, `masters-surgeons` kept; sub-line "AA's address book of surgeons. Open a surgeon for their contacts, groups and pairing preferences."
12. **Re-point any other reader.** Re-run item 1's grep; any surgeon-address reader goes through `officeAddressFor`. None existed at plan time; record the result.
13. **Build on the shared components.** Everything new or rebuilt in items 8 to 12 uses `src/shared/ui`, `src/shared/surface` and `src/shared/table` (`TextField`, `AddRowButton`, `IconButton`, `Card`, `DefRow`, `PageHeader`, the table kit); a component that cannot do the job gets a variant or prop that defaults to today's look, never a copy in a screen file; migrate any private copy on the surgeon sheet, profile and table; keep shot and `data-*` hooks; update the catalogue rows in the same session (docs/ui-unification/README.md section 8).
14. **Tests, session 2.** A component test for the plus and minus form (one set always shown; plus adds an empty set; minus only on extra sets and removes it whole; focus after each); `mastersPages.test.tsx` (no rooms view, the old URL falls back, the new columns, "No HPI CPN yet"); replace `visual/admin-phase17a.spec.ts` with `admin-phase17b.spec.ts` and update `admin-phase17.spec.ts`.

## Demo triggers

None new: all three beats are product.

- Admin Master data, Surgeons, Edit details: "Add office contact" adds a set, the minus removes an extra one.
- A seeded surgeon with "No HPI CPN yet", opened and saved as normal, and picked for a List.
- Mr N. Wainwright's profile: the practice name, the personal contact and an office contact for each practice.

## Out of scope

A List's origin and sender (34); the update email (35) and the NHI request (40), which read the helper; the cutover loader (42); a practice or room record of any kind; hospital or insurer contacts; a label or role on an office contact; search by specialty; any "required before the first Booking" rule (OQ-143 stays its default); the anaesthetist's HPI CPN and profile (26).

## Manual test checklist

1. Master data sub-nav has no "Surgeons' rooms"; `/admin/masters?view=surgeonRooms` opens Surgeons.
2. Surgeons table: Practice, Office contact and HPI CPN columns; Wainwright's practice reads both names; the three blank surgeons read "No HPI CPN yet".
3. Edit a surgeon with no office contact: one empty set, no minus.
4. Plus twice: three sets; focus on the new Name each time; minus on the third removes it whole; minus on the second leaves one set with no minus.
5. Save with an empty extra set: it is dropped; the profile shows only filled contacts.
6. A bad email in office contact 2 is refused inline, naming it; nothing saved.
7. Clear a surgeon's HPI CPN and save: saved, "No HPI CPN yet" on the profile chip, Identifiers and table; History shows "HPI CPN" from the number to "None".
8. Enter another surgeon's HPI CPN: refused with the holder's name; enter an anaesthetist's: refused.
9. Add an anaesthetist with no HPI CPN: still refused (26 unchanged).
10. Wainwright's profile: practice name, personal contact, an office contact per practice, the first marked; no room card and no provisional line.
11. Assign a List to a blank-HPI surgeon on the Day grid: no warning, no block.
12. History on an edited surgeon: "Practice", "Personal contact", "Office contacts" entries read cleanly, no `undefined`.
13. The S1 to S5 figures and the anaesthetist apps unchanged (spot-check S2's pairing beat with Ms A. Reid).

## Demo guide updates

- `04-presenter-cheat-sheet.md`: the "Surgeon profiles" bullet (about line 399): practice name, personal and office contacts on the plus and minus form, "No HPI CPN yet", the list as AA's address book; discovery item 15 ("Surgeons' rooms and practice contacts", about line 677) rewritten: OQ-127 and OQ-126 answered for the build, OQ-128 superseded, OQ-143 open with its default.
- `03-demo-script.md` Direct URLs (about lines 85 and 93): drop `?view=surgeonRooms` and the "Surgeons' rooms" row.
- `02-workflows-and-handoffs.md` master data (about lines 100 to 104): no rooms; contacts on the surgeon.
- Mirror all three in `master-demo-guide.html`. No scripted beat changes.

## Catalogue screenshots

Standing step: ROADMAP.md "Catalogue screenshots". This phase covers RV-42 only, so `recipe-status.mjs 17b` lists no stories; these are the recipes it breaks and must bring back to captured.

- **FT-13.6** `surgeon-profile` (S-WAINWRIGHT): re-point the wait and highlights from `surgeon-room-card` to `surgeon-specialties` and `surgeon-contacts`; caption "Each surgeon holds one or more specialties, a practice name and their contacts on a profile page". Captured.
- **US-13.6.2** `surgeons-table`: highlight Wainwright's row and a blank-HPI row; caption names the practice, office contact and "No HPI CPN yet". `surgeon-profile` `profile` (S-REID): `surgeon-contacts` in place of the room card. `edit` (S-WAINWRIGHT): highlight `surgeon-practice-field` and the HPI CPN field, the rooms field gone. Captured.
- **US-13.6.5** `surgeon-contacts` `profile` (S-DALGETY, Bev the first office contact) and `add` (Edit details, click `office-contact-add`, highlight `surgeon-office-contacts`); rename `whole-room` (retired behaviour) to `two-practices` on S-WAINWRIGHT. No "provisional" in any caption. Captured.
- **US-13.4.1**: the `surgeons` state caption (practice, office contact, HPI CPN); remove the `surgeon-rooms` state. Its other captions are other phases'.
- **US-13.6.1**: `status: absent`, "Retired: removed in Phase 17b".
- **US-13.6.3, US-13.6.4, US-13.6.6**: no change here (17 and 18a own them); re-run, as the profile layout moved.
- **ATLAS.md**: Routes (`/admin/masters` `?view=` list and the "Surgeons also matches Surgeons' rooms" note; `/admin/masters/surgeons/:surgeonId`), Personas and IDs (the Surgeons bullet's `RM-*` rooms), Seed data worth shooting (17a's rooms block rewritten: the blank three, the two-practice four, Dalgety's Bev, Burnside's PAs), Overlays that need clicks (the room and contact sheets out, the plus and minus form in) and Existing hooks.

## Adversarial review (after build)

Four lenses:

1. **The unwind is complete**: the item 1 grep returns nothing outside history comments; no dead export, label, ID format, catalogue row, ATLAS hook or demo-guide line names a room; `PERSIST_VERSION` bumped once.
2. **The HPI CPN guards**: blank saves for a surgeon only through `surgeonHpiCpnRequired()`; uniqueness holds across practitioners; the anaesthetist's is still mandatory and untouched; nothing prints `undefined` or `''`.
3. **The helper**: one function, pure, never every contact, never the personal contact, blank emails skipped, shaped so 34 can put a sender first without a second lookup; the guard test catches a new reader.
4. **Seed and screens**: deterministic, fictional only, pins hold (names, specialties, pairings, Lists); the plus and minus form is keyboard and screen-reader sound (labels, focus, no minus on the last set); built on `TextField`, `AddRowButton`, `IconButton`, `Card`, `DefRow` and the table kit, with no private copy: a new private copy of a shared component is a finding.

## PROGRESS.md updates

- Status row 17b DONE.
- Decisions log: mark 2026-10-09 "One room per surgeon" SUPERSEDED, and "The HPI CPN is one required `hpiId` on a surgeon" AMENDED (surgeons: optional, unique when held; anaesthetists unchanged); mark 2026-11-17 Phase 17a (1) to (3) SUPERSEDED. New entries: no room record, contacts on the surgeon (D74, D75 superseded); the surgeon's HPI CPN optional through one predicate (D76, D89 default); the one helper and its order.
- Handoffs: **34** adds `'listSender'` to `OfficeAddress.source` and puts the List's sender first inside `officeAddressFor`; **35** and **40** call it and show `others` to switch to; **42** loads `practiceName`, `personalContact`, `officeContacts` and a blank `hpiId`.
- For the owner's review: the build choices in "Before you start" step 2, the "Office emails go here first" pill, and the three blank-HPI surgeons.
