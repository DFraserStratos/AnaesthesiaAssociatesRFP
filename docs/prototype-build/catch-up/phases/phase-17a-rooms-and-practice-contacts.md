# Phase 17a · Rooms without an email, and practice manager and PA contacts

**Requirements covered:**
[US-13.6.5](../../../../requirements-board/requirements/stories/US-13.6.5.md) (new at `d436947`, status 2 Open, graded Missing: practice manager and PA contacts, each with a name and an email, shown on the surgeon's profile; where a contact belongs is [OQ-127](../../../../requirements-board/requirements/questions/OQ-127.md)),
[DM-60](../analysis/domain-model-delta.md#dm-60) (new: the surgeons' room master tolerates a missing email or phone and gains the contacts list).
Follows up built Phase 17's [US-13.6.1](../../../../requirements-board/requirements/stories/US-13.6.1.md) (status 4, now graded Contradicts: its Notes say a room may load with no email and some no phone, a drafted update email leaves To empty; the prototype requires an email). It **stays on Phase 17's covers**; this phase fixes the contradiction and updates that story's recipe.
Not here: an address book or street address ([OQ-126](../../../../requirements-board/requirements/questions/OQ-126.md), gates no phase), a surgeon at two rooms ([OQ-128](../../../../requirements-board/requirements/questions/OQ-128.md), D75: one room stays), the HPI CPN source ([OQ-129](../../../../requirements-board/requirements/questions/OQ-129.md): the directory's fictional CPNs stay), the update email and the NHI request themselves (35 and 40 read this phase's helper), loading rooms from a spreadsheet (42).

**Depends on:** Phase 17 (built: `SurgeonRoom`, `Surgeon.roomId`, `store/surgeonActions.ts`, `SurgeonRoomSheet`, `SurgeonProfile`, the Master data views and `seed/surgeonMasters.test.ts`; use its shipped names). The specialist directory seed (`seed/specialistDirectory.ts`, added at `d4369476` after the plan baseline, `PERSIST_VERSION` 26) is already in the tree.
**Estimated:** 1 session: items 1 to 5 (pin, model, pure helper, actions, seed), then 6 to 9 (screens, hooks, tests), then the guide, the review pass and the catalogue screenshots. Admin desktop only: nothing here reaches the anaesthetist apps or the PWA.

## Goal

Ben's specialist list (3 November) is the master list of surgeons and rooms FT-13.6 waited for, and it shows that most practices give one shared inbox, 16 give no email and some no phone, and that at one ENT practice each surgeon has their own PA and inbox. Built Phase 17 cannot hold that: `cleanRoomFields` refuses a blank email (`surgeonActions.ts:115`), `SurgeonRoom.contactEmail` is a required string (`types.ts:281`), and the directory seed writes an invented `reception@` address where the list gives none (its header says so).

1. **A room may hold no email and no phone** (US-13.6.1's new note, DM-60). Both fields become optional, absent when blank (as `Hospital.contactEmail` already is, `types.ts:252`). Every view says so plainly ("No email held"); the directory seed loses its invented placeholders.
2. **Practice manager and PA contacts** (US-13.6.5, OQ-127 default, D74, labelled provisional): a **contacts list on the room**, each `RoomContact { id, name, email, role: 'PRACTICE_MANAGER' | 'PA', forSurgeonId? }`, `forSurgeonId` naming one surgeon of that room. That one optional field is the owner, so moving contacts to the surgeon later is a small change; the room list and `forSurgeonId` are read only through the pure helper. A surgeon's profile shows the room's contacts and those named for them. No surgeon email field. The office adds, edits and removes contacts by hand (Ben does not hold them); a few are seeded on the fictional list's pattern. Office only, audited through `mutate()`.
3. **One room per surgeon stays** (D75, the catalogue's recommendation, as 17 built it): `Surgeon.roomId` is single and required; nothing builds a second room.
4. **One helper for a room's email**, `roomEmailForSurgeon`, returning the room's contact email or an empty string, never throwing. 35's update email and 40's NHI request read it, so a room with no email yields an empty To. Contacts never change the To (the catalogue's address is unchanged).

## Before you start: drift check

1. Diff against the plan baseline `d436947`:

   ```
   node requirements-board/agent/skills/update-build-plan/tools/plan-state.mjs --diff US-13.6.5,US-13.6.1,US-13.6.2,US-13.4.3,US-02.3.3,US-11.1.5,OQ-126,OQ-127,OQ-128,OQ-129
   ```

   If US-13.6.5 is now Retired or Future, drop the contacts (Goal 2, and the contact parts of work items 2 to 5, 7 and 9) and keep the optional email and the one helper. If it is Confirmed, drop the provisional caption.
2. **Open, build the default, label it once, log it:**
   - **OQ-127 / D74.** Default: contacts held on the room, optionally named for one surgeon; both shown on the surgeon's profile. The one provisional caption is a mist line on the profile's contacts card ("Where contacts belong is to be confirmed with AA"), with a code comment naming OQ-127 and D74. If answered "by surgeon", only the owner field and the profile read change; if answered "the emails go to the PA", only `roomEmailForSurgeon` changes; if a surgeon's own email field is wanted, stop and tell the owner.
   - **OQ-128 / D75.** Default: one room per surgeon. The directory seed already holds the four surgeons listed at two practices at one; its header says so, 42's load result notes the other.
   - **OQ-126, OQ-129.** Build nothing for either.
3. Confirm Phase 17 is DONE and read its PROGRESS entry for the names it shipped. Note `PERSIST_VERSION` (26 at `d436947`; later phases may have moved it) and bump it once.
4. **Never read `docs/discovery-reference/Other docs/Christchurch_Specialists.xlsx`** (the real list, real people). The only source is `Christchurch_Specialists_fictional.xlsx` beside it. No generator for the directory is in the repo, so edit the seed in place (item 5); do not script a load from the real file.

## Reference

- **Design** (convention 17): [Design Language](../../../design/Design%20Language.dc.html) (neutral pills, mist text for absent values, mono for emails, teal the only action colour, crimson never), [Admin Day](../../../design/Admin%20Day.dc.html) and [Admin Review](../../../design/Admin%20Review.dc.html) for chrome and sheets. No mockup covers a profile card or contact rows: extend Phase 17's `ProfileCard`, `Fact` and `Table`.
- **Catalogue:** the three items above; [US-13.6.2](../../../../requirements-board/requirements/stories/US-13.6.2.md) (the profile), [US-02.3.3](../../../../requirements-board/requirements/stories/US-02.3.3.md) and [US-11.1.5](../../../../requirements-board/requirements/stories/US-11.1.5.md) (who reads the room's email); the note `requirements/notes/2026-11-03-ben-specialist-list-email.md` (#4 #6 #7; `npm --prefix requirements-board run source -- --item US-13.6.5 --text`); the surgeon and room section of `requirements-board/requirements/domain-model.md`.
- **Plan:** `gaps.json` entries DM-60 and US-13.6.5, ROADMAP D74 and D75; [Phase 35](phase-35-explicit-save-and-update-email.md) and [Phase 40](phase-40-patients-and-alerts.md) (their To address, through this phase's helper), [Phase 42](phase-42-reference-data-and-loads.md) (the surgeons sheet load).
- **Code entry points** (at `d4369476`; line numbers may have shifted):
  - `src/domain/types.ts`: `Surgeon` 260 (`roomId` required), `SurgeonRoom` 278 (`contactEmail`, `phone` required today), `Hospital` 252 (optional email, the pattern).
  - `src/domain/surgeons.ts`: `isPlausibleEmail` 39, `surgeonsInRoom`, `groupsForSurgeon`; new `roomContacts.ts` beside it.
  - `src/store/surgeonActions.ts`: `SurgeonRoomFields` 107, `cleanRoomFields` 112, `createSurgeonRoom` 123, `editSurgeonRoom` 142 (its `keys` diff at 149), `editSurgeon` 75; `src/store/mutate.ts` (`ID_FORMATS`, `surgeonRoom` prefix `RMN`); `src/shared/audit/actionLabels.ts` and `fieldLabels.ts`.
  - `src/apps/admin/flows/SurgeonRoomSheet.tsx`; `screens/SurgeonProfile.tsx` (room card 56 to 60, which reads `room.contactEmail` and `room.phone` directly); `screens/masters/SurgeonsView.tsx` (`SurgeonRoomsView`, the email cell near 101); `components/ProfileChrome` (`ProfileCard`, `Fact`); `mastersPaths.ts`.
  - `src/domain/seed/specialistDirectory.ts` (`DIRECTORY_ROOMS` 40, `DIRECTORY_SURGEONS` 131; its header says "generated", "reception@ placeholder" and "no PA contacts"); `seed/cast.ts` (five cast rooms, all with emails, unchanged); `seed/index.ts` 403 and 471 (where both are merged); `appStore.ts` (`PERSIST_VERSION` 194).
  - Tests: `store/surgeonActions.test.ts` (room refusals, 63 to 75), `seed/surgeonMasters.test.ts` (line 44 requires every room email plausible), `seed/canvasFingerprint.test.ts`, `screens/masters/mastersPages.test.tsx`.

## Work items

1. **Pin first.** Before any seed edit: the directory counts (40 rooms, 131 surgeons), every surgeon's `roomId`, the five cast rooms' emails, the canvas fingerprint and golden tests, and the rule that no directory surgeon is named by a List. Only the directory rooms' `contactEmail` and `phone` values and the new contacts may change.
2. **Model** (`types.ts`; DM-60).
   - `SurgeonRoom.contactEmail?: string` and `phone?: string` (absent when blank, never `''`), plus `contacts?: RoomContact[]` (absent or empty when none).
   - New `RoomContact { id: string; name: string; email: string; role: RoomContactRole; forSurgeonId?: SurgeonId }` and `RoomContactRole = 'PRACTICE_MANAGER' | 'PA'`. The email is required and plausible; the contact carries no phone and no surgeon-side email field exists. `forSurgeonId` names a surgeon whose `roomId` is this room.
   - One label set, `ROOM_CONTACT_ROLE_LABELS` ("Practice manager", "PA"), in the module that holds Phase 17's `PAIRING_LABELS` (grep for it), and one constant for the absent-email wording, `NO_ROOM_EMAIL = 'No email held'`. Id counter `roomContact` in `mutate.ts` `ID_FORMATS` (runtime `RCN###`, seeded `RC-###`, distinct from `RCB`, `RCT`). Check `masters` is persisted whole so `contacts` needs no new slice.
3. **The pure helper** (new `src/domain/roomContacts.ts`, with a test; never imports `src/shared`).
   - `roomContactEmail(room)`: the trimmed contact email, or `''` for an absent room or no email.
   - `roomEmailForSurgeon(masters, surgeonId)`: surgeon to `roomId` to room to `roomContactEmail`, `''` for an unknown surgeon, a missing room or no email. This is the one function 35's update email and 40's NHI request call. A contact is never returned as the To.
   - `contactsForSurgeon(room, surgeonId)`: the room's contacts for the whole room, then those named for that surgeon, each group by role (practice manager first) then name; contacts named for a different surgeon are left out. `contactsForRoom(room)` returns them all, with the surgeon each is named for.
   - Tests: no email, whitespace only, no phone, no room, no contacts, a contact for another surgeon excluded, ordering.
4. **Store** (`surgeonActions.ts`, or a new `roomContactActions.ts` re-exported through the store barrel).
   - `cleanRoomFields`: the email is optional (blank becomes absent; non-blank must pass `isPlausibleEmail` with the existing `invalidEmail` message), the phone is optional, the name still required. `editSurgeonRoom` diffs `existing[k] ?? ''` against the new value so clearing an email audits correctly, and the audit before and after never print `undefined`. Existing refusals (`officeOnly`, `nameRequired`, `notFound`) stay.
   - New `addRoomContact`, `editRoomContact` and `removeRoomContact` (room id, then fields: `name`, `email`, `role`, optional `forSurgeonId`), office only, each through `mutate()` with before and after on the room (`entityType` `surgeonRoom`, actions `roomContact.add`, `.update`, `.remove`; labels in `actionLabels.ts`, field labels in `fieldLabels.ts`). Refusals: `officeOnly`, `notFound` (room or contact), `nameRequired`, `invalidEmail` (required here), `roleRequired`, `surgeonNotInRoom`, and `duplicateContact` (same email, role and named surgeon on one room).
   - `editSurgeon` moving a surgeon to another room clears `forSurgeonId` on the old room's contacts that name them, in the same `mutate()`, one `roomContact.update` meta each, so no contact points at a surgeon outside its room.
   - One room per surgeon (D75): `Surgeon.roomId` stays single and required; add no second-room field or action. A test pins `createSurgeon` and `editSurgeon` refusing a missing room.
5. **Seed** (`specialistDirectory.ts`, edited in place; `PERSIST_VERSION` + 1 with a comment line naming this phase).
   - Correct the header: it is **not** regenerated (no generator is in the repo); it was built from `Christchurch_Specialists_fictional.xlsx` and is now edited by hand, and a regeneration must read only that file. Drop "reception@ placeholder", "since the model requires one" and "no PA contacts"; say a room with no email on any row of the list holds none.
   - Remove every invented `reception@` address and every `phone: ''`. A directory room whose practice has no email on any row of the fictional workbook (16 of the 40, among them General Surgery Partners, Eye Partners, Wigram Orthopaedic Centre and Urology Associates Hornby) holds no `contactEmail`; a practice with no phone holds no `phone`. Match practices to rooms by name against the workbook's `Practice` column; do not guess. A test proves no directory room carries a `reception@` address.
   - Seed contacts on the fictional list's pattern, from that workbook's `PA Contact` and `Email` columns (10 of 137 rows name a PA; Ben holds no practice managers). Default set: Avonhead ENT keeps its shared `info@` and gains Bev for Dr Dalgety; Burnside ENT Surgeons, the practice where each surgeon has their own PA, holds no room email (the workbook's only addresses there are PA inboxes; the old seed took one as the room's) and gains Maree for Mr Forsythe, Dianne for Mr Mallory and Nicola Holloway for the whole room (she serves three surgeons); Redwood Eye Group keeps `info@` and gains Jodie Yamada for Dr Vasquez; Bryndwr Neurosurgery holds no room email and gains Wendy for Mr Mathieson. Add one invented practice manager on a `.example` address (a practice manager is in no row) to General Surgery Partners, a room with no email, so a profile shows a contact beside "No email held". Move the PA email off any room it was standing in for. A comment marks the practice manager as invented.
   - Pins: the five cast rooms keep their emails; `Surgeon.roomId` and the counts are unchanged; every seeded contact's email is plausible, its `forSurgeonId` (where set) resolves to a surgeon of the same room, ids are unique; the canvas is unchanged. Update `surgeonMasters.test.ts` line 44 to "every room email that is held is plausible". No `Date.now()`, no `Math.random()`; seed timestamps stay fixed strings.
6. **Room sheet and views** (frontend-design applies, inside the Admin design system).
   - `SurgeonRoomSheet`: "Contact email (optional)" with the hint "Leave blank where the practice gives no shared inbox", "Phone (optional)". When editing an existing room it also shows the room's contacts (item 7's list) with "Add contact"; a new room adds contacts after it is saved. Check `useSurface().Overlay` stacking; if a second sheet over the first misbehaves, swap the content in place.
   - `SurgeonRoomsView`: the email cell reads `roomContactEmail(room)` and, when empty, shows `NO_ROOM_EMAIL` in mist; add a "Contacts" column ("2 contacts", or a mist dot) so the table shows who is held. Keep `data-room` rows and the `masters-surgeon-rooms` hook.
   - `SurgeonProfile` room card: email and phone read through the helper, "No email held" and "Not recorded" in mist, never a blank fact.
7. **Contacts on the surgeon profile** (US-13.6.5). A new `ProfileCard` "Practice manager and PAs" (`data-shot="surgeon-contacts"`) beside the room card, listing `contactsForSurgeon(room, surgeon.id)`: name, a neutral role pill, the email in mono, and "Whole room" or "For this surgeon" in mist; an empty state ("No practice manager or PA recorded"); the one provisional mist line (OQ-127). The office's **Add contact** opens a new `RoomContactSheet` (`data-shot="room-contact-sheet"`: Name, Email, Role as two choices, "For" as the whole room or one of the room's surgeons, defaulting to this surgeon when opened from their profile); each row has Edit and Remove (Remove asks for a confirm, in Phase 17's "End pairing" pattern). One shared `RoomContactsList` component serves the profile card and the room sheet so they cannot drift. Everything goes through the item 4 actions; no component owns state.
8. **Reads and the guard.** Grep every reader of a room's `contactEmail` and `phone` (the profile, the rooms view, the sheet, tests; hospitals have their own optional field and are untouched) and route display through the helper. Add a small source-scan test that no file outside `domain/roomContacts.ts`, the room actions, the room sheet, the seed and tests reads a `SurgeonRoom`'s `contactEmail` directly, so 35 and 40 cannot grow a second lookup. Nothing in `src/apps/mobile`, `src/apps/web` or `pwa/` names the contacts (`pwaPurity.test.ts` stays green; the office-private slice is untouched).
9. **Tests.** Vitest: the helper (item 3), the actions (an email-less room created and edited, clearing an email, contacts added, edited, removed, every refusal, `editSurgeon` clearing a stale `forSurgeonId`, audit shapes with no `undefined`), the seed invariants (item 5), the profile (a room with no email, a named contact, a whole-room contact, no contact) and the rooms table; extend `mastersPages.test.tsx`. Playwright: add a contact to a room with no email from a surgeon's profile and see it listed. Finish with `npm run build`, `npm run build:pwa` and `npx vitest run` green.

## Demo triggers

None needed: seeded rooms with no email and seeded contacts show through normal use on Admin Master data (Surgeons' rooms tab and a surgeon's profile). "Add contact" on the profile card and in the room sheet is a product control. Add nothing to the registry or the Control Panel, and no PWA stand-in (Admin desktop only).

## Out of scope

- An address book and street address (OQ-126, no phase); a surgeon at two rooms (OQ-128, D75); a surgeon's own email field (OQ-127 question 4, not built); the HPI CPN source (OQ-129); contacts loaded from the surgeons sheet (42; hand it the contact shape).
- The update email and the NHI request (35, 40): this phase only leaves them one helper; the To is never a contact.
- Any change to hospitals' contact email, the cast rooms, a List, a Contract or a price.
- Reading, parsing or seeding from the real `Christchurch_Specialists.xlsx`; a generator script.

## Manual test checklist

Run these yourself in the running app and report pass or fail with evidence.

- [ ] Fresh Reset, Admin Master data, Surgeons' rooms: the directory's no-email rooms (General Surgery Partners, Eye Partners) read "No email held" in mist, no `reception@` anywhere, the rooms with an email unchanged, the Contacts column shows counts.
- [ ] Add a room with no email and no phone: it saves, the row and a surgeon assigned to it read "No email held" and "Not recorded"; a bad email still refuses with the existing message; clearing the email on an existing room saves and History shows before and after.
- [ ] Dr H. Dalgety's profile (Avonhead ENT): the contacts card shows Bev (PA, "For this surgeon") and no contact named for his colleagues; Dr B. Garside's shows none of Bev's; Burnside's Mr Forsythe shows Maree and the whole-room Nicola Holloway.
- [ ] Mr B. Yeoman's profile (General Surgery Partners): the room card says "No email held" and the contacts card shows the practice manager; the provisional line is visible once.
- [ ] Add contact from a profile (name, email, role, whole room or this surgeon), edit it, remove it (with the confirm): each lists and audits; an implausible email, a blank name and a duplicate refuse.
- [ ] Move a surgeon to another room from their edit sheet: contacts that named them become whole-room contacts of the old room.
- [ ] As Dr Sharma on mobile, web and the PWA: no contact and no room email appears anywhere; PWA build unchanged.
- [ ] Reset restores the seed; reload keeps state; `build`, `build:pwa` and `vitest` green.
- [ ] Catalogue screenshots: the recipes below created or updated, a full `npm run capture` with no failed recipe, the covered items' shots checked by eye, `npm run verify:board` green.

## Demo guide updates

Patch in the same session, locating passages by text (`docs/demo-guide/`). Say "surgeons' room", "practice manager" and "PA".

- `04-presenter-cheat-sheet.md`: the "Surgeon profiles" bullet (a room's email and phone are optional; a room may hold none; practice manager and PA contacts shown on the profile); the discovery or open-questions list gains OQ-127 (contacts by room or by surgeon) and OQ-128 (a surgeon at two rooms), if it has one.
- `02-workflows-and-handoffs.md`: the office's master-data passage ("surgeons' rooms ... hospital contact emails") gains the optional room email and the contacts; the update email goes to the room's email when one is held, otherwise nothing, in one line.
- `03-demo-script.md`: Direct URLs add `/admin/masters?view=surgeonRooms` and a surgeon with a PA (`/admin/masters/surgeons/S-DALGETY`). No scripted beat changes; the seeded rooms in S1 and S2 are untouched.
- `01-personas-and-responsibilities.md` only if it lists the contacts the office keeps; `master-demo-guide.html`: the same passages.

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19), run after the review pass and before the PROGRESS entry. Run `node requirements-board/agent/skills/update-build-plan/tools/recipe-status.mjs 17a` first, then `node scripts/capture.ts --dry` in `requirements-board/`, fix what fails, then a full `npm run capture` with no failed recipe. Edit recipes, ATLAS.md and the catalogue's `images` fields only in this step, never by hand-editing images or `REPORT.md`.

| Item | Recipe now | When this phase is done |
|---|---|---|
| [US-13.6.5](../../../../requirements-board/requirements/stories/US-13.6.5.md) Practice manager and PA contacts | none (create it) | `captured` (both criteria shown; Open, so the caption says provisional). Admin `surgeon-contacts` at `/admin/masters/surgeons/S-DALGETY`, highlight `[data-shot=surgeon-contacts]` (Bev, PA, for this surgeon), caption "Practice manager and PA contacts shown on the surgeon's profile"; state `add` after a click on "Add contact", highlight `[role=dialog]`, caption "The office adds a contact with a name, email and role, for the whole room or one surgeon". Admin shot `whole-room` at `/admin/masters/surgeons/S-FORSYTHE` (Maree and the whole-room Nicola Holloway). |
| [US-13.6.1](../../../../requirements-board/requirements/stories/US-13.6.1.md) Surgeons' rooms master record | captured (17's `surgeons-rooms`, `room-card`) | Keep `captured`. Add state `no-email` to `surgeons-rooms` highlighting `[data-room=RM-GENERALSUR]` (caption "A room with no email shows that plainly") and a `room-card` shot at `/admin/masters/surgeons/S-YEOMAN` (room card: "No email held"). Update the `edit` state caption and highlight for "Contact email (optional)". Row ids come from the built seed; re-check them. |
| [US-13.6.2](../../../../requirements-board/requirements/stories/US-13.6.2.md), [US-13.6.3](../../../../requirements-board/requirements/stories/US-13.6.3.md), [US-13.4.1](../../../../requirements-board/requirements/stories/US-13.4.1.md) | captured | Recipes broken only if the profile's new card moves a highlight; re-check `surgeon-profile` framing and keep shot names. |

**ATLAS.md.** "Overlays that need clicks" (Master data): the room sheet's optional email and phone, "Add contact" (`room-contact-sheet`) and a contact row's Edit and Remove. "Existing hooks" (surgeons, pairings and tiers): add `surgeon-contacts` and `room-contact-sheet` beside `surgeon-room-card`. "Seed data worth shooting": the directory rooms with no email, Avonhead ENT and Burnside ENT's contacts, General Surgery Partners' practice manager.

## Adversarial review steer

After the manual test and the commands are green, run the standard pass (PROGRESS convention 18: three Opus subagents for quality, bugs and correctness, plan adherence; verify each finding independently). Steer them at:

- **Optional email, everywhere.** No reader of `SurgeonRoom.contactEmail` or `phone` assumes a string (a `.trim()`, `.length`, mailto or `isPlausibleEmail` on `undefined`); an audit never prints `undefined`; a persisted v26 store is discarded by the version bump; no code path invents an address.
- **One helper.** `roomEmailForSurgeon` is the only way a room's email is resolved for 35 and 40 and never returns a contact; it never throws; the source-scan test is real and not an allowlist of everything.
- **Contacts and D74.** Contacts live on the room, `forSurgeonId` is the only owner field, a contact named for a surgeon outside the room is impossible (add, edit, and a surgeon's move), all reads go through `contactsForSurgeon`, and there is no surgeon email field or second room (D75).
- **Seed.** No `reception@` and no `phone: ''` left; the 16 no-email rooms match the fictional workbook; nothing was read from the real workbook; no real names; counts, cast rooms and the canvas unchanged; the practice manager is marked invented.
- **Privacy, copy, design.** No contact reaches mobile, web or the PWA; no en or em dashes; teal the only action colour, crimson never; the provisional line shows once.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry; ROADMAP "Owner review: agents test themselves"): contacts are held on the room and optionally named for one surgeon, provisional (OQ-127, D74), with the owner in one field; a surgeon moving rooms turns their named contacts into whole-room ones; a contact is never the To address of an email; Burnside ENT and Bryndwr Neurosurgery hold no room email because the list's only addresses there are PA inboxes (to confirm); the one invented practice manager; the Remove confirm; no address book, no surgeon email, no second room (OQ-126, OQ-128, D75). Screens worth a look: Admin Surgeons' rooms, the profiles of Dr Dalgety, Mr Forsythe and Mr Yeoman.
- Status row for 17a and a phase entry: the drift-check result against `d436947`; OQ-127, OQ-128 and OQ-126 status and the defaults built; the shipped helper names (`roomContactEmail`, `roomEmailForSurgeon`, `contactsForSurgeon`, `NO_ROOM_EMAIL`, `RoomContact`, `ROOM_CONTACT_ROLE_LABELS`) for 35, 40 and 42; the `PERSIST_VERSION` from and to; tests added; the review pass; the catalogue screenshot result (recipes created or changed, `REPORT.md` counts before and after).
- Decisions log: **Amended:** Phase 17's required room email and phone (now optional, DM-60). **Superseded:** the directory seed's `reception@` placeholders and its "generated" header. **Provisional:** contacts on the room (OQ-127, D74). **Readings settled here:** one room per surgeon (D75); no contact in a To address; the PA inboxes at Burnside and Bryndwr become contacts, not the room's email.
- Handoffs: **35** and **40** call `roomEmailForSurgeon` and handle `''` (an empty To is valid, shown, not an error); **42** loads rooms with optional email and phone and may load `contacts` in the same shape; **43** generates rooms through the same optional fields.
