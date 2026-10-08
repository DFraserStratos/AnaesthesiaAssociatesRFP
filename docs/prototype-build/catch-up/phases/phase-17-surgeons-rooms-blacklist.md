# Phase 17 · Surgeons, rooms, pairing preferences and priority tiers

(The file name keeps the old "blacklist" slug because the plan tools pin an existing phase's doc
path; the title and every word of app-facing copy use the current names.)

**Requirements covered:**
[FT-13.6](../../../../requirements-board/requirements/stories/FT-13.6.md) Surgeons and surgeons' rooms (Confirmed; closes here with its four stories, while its "loaded from controlled spreadsheets" sentence is [US-13.4.3](../../../../requirements-board/requirements/stories/US-13.4.3.md)'s, in Phase 42) ·
[US-13.6.1](../../../../requirements-board/requirements/stories/US-13.6.1.md) Surgeons' rooms master record (Confirmed) ·
[US-13.6.2](../../../../requirements-board/requirements/stories/US-13.6.2.md) Surgeon profile, one HPI CPN as the surgeon's unique index, private pairings seen only by admin (Confirmed) ·
[US-13.6.3](../../../../requirements-board/requirements/stories/US-13.6.3.md) Not-preferred pairings of surgeons and anaesthetists (Confirmed 2026-10-07; OQ-43 answered: private, two-way, admin only, kept on both profiles; its "Warns admin" criterion is met here for the office's paths that exist today, and its "No warning on an anaesthetist's own hand-over" criterion is honoured by building nothing anaesthetist-facing, then proved by Phases 32 and 32a) ·
[US-13.6.4](../../../../requirements-board/requirements/stories/US-13.6.4.md) Preferred pairings (Verify, new) ·
[US-01.3.5](../../../../requirements-board/requirements/stories/US-01.3.5.md) Not-preferred pairing warning when assigning or moving a List (Confirmed; widened to every office path with grouped pickers and tier order; its Draft List path is wired by Phase 31 on this phase's helper) ·
[US-01.3.6](../../../../requirements-board/requirements/stories/US-01.3.6.md) Anaesthetist priority tiers for assignment (Verify, new; built on the office's Reassign list picker here, reused by Phase 28's availability finder and Phase 31's Draft List assignment) ·
[DM-32](../analysis/domain-model-delta.md#dm-32) Surgeons' rooms, surgeon profile, hospital contact email and the fuller anaesthetist profile (this phase builds the surgeon, room, group and hospital parts and the tier; the anaesthetist's bank details, GST number and prepaid settings are Phase 26's, and the start date Phase 28's; DM-33 is merged into it) ·
[DM-54](../analysis/domain-model-delta.md#dm-54) Private two-way pairing preferences and an admin-only anaesthetist priority tier (new; closes here, with its Draft List and finder consumers in 31 and 28).
Also touches, without closing:
[US-13.4.1](../../../../requirements-board/requirements/stories/US-13.4.1.md) (the hospital contact email, surgeons, surgeon groups and rooms rows of "maintain reference tables"; the rest closes in Phase 42, and its "recurring bookings" rename is Phase 30's),
[US-12.1.4](../../../../requirements-board/requirements/stories/US-12.1.4.md) (the Admin anaesthetist record gains its pairing preferences and tier, and "HPI id" becomes "HPI CPN"; bank details and the rest are Phase 26's),
[US-01.4.1](../../../../requirements-board/requirements/stories/US-01.4.1.md) (the office's Reassign list picker gains the groups, the tier order and the warning; Phase 28 rewrites the move between Slots on the same helper),
[US-01.4.2](../../../../requirements-board/requirements/stories/US-01.4.2.md) (the availability finder, Phase 28, orders by this phase's helper),
[US-01.6.3](../../../../requirements-board/requirements/stories/US-01.6.3.md) (Draft List assignment, Phase 31, on this phase's helper),
[US-01.4.5](../../../../requirements-board/requirements/stories/US-01.4.5.md) (now Confirmed and reversed: **no** preference warning when an anaesthetist moves their own List, nothing revealed, colleagues by availability alone; Phase 32 builds the move and this phase's privacy boundary is what keeps it true) and
[US-01.4.7](../../../../requirements-board/requirements/stories/US-01.4.7.md) (Phase 32a's single-Booking move, likewise with no warning).
No RV finding is in scope.
**Answered and built as answered:**
[OQ-52](../../../../requirements-board/requirements/questions/OQ-52.md) (2026-10-01: the HPI number and the CPN are one identifier, the **HPI CPN**, the surgeon's unique index) and
[OQ-43](../../../../requirements-board/requirements/questions/OQ-43.md) (answered 2026-10-07, owner decision D44: preferences are private and two-way, the admin team sees and updates them, anaesthetists never see them and neither side learns of the other's entry; admin get a soft warning when assigning or moving a List; there is no warning at all when an anaesthetist hands on their own List; positive preferences are wanted too; the name "blacklist" goes).
**Open, built as the owner-decision default:** [OQ-102](../../../../requirements-board/requirements/questions/OQ-102.md) (D36: "Not preferred" and "Preferred" for the pairings, and Tier 1 to Tier 4 for the tiers, Tier 4 the default, until AA picks names). The names live in one label set; the tier control carries one mist line saying the tier names are provisional, and the reading is logged for the owner. Also an assumed reading, logged: how tiers and the not-preferred grouping combine (tiers order the anaesthetists **within** each group; US-01.3.5 and US-01.3.6 notes).
**Depends on:** Phase 14 (screen-contextual demo triggers; this phase adds none, but its new routes must fit the route-scoped registry) and Phase 15 (Card becomes Booking; every flow touched here is post-rename). In run order it follows 15a, 15b and 16, which also edit files this phase touches (15a: `ListDrawer`'s Booking rows and the shared barrel; 15b: `PhoneAdviceBooking`, `actionLabels.ts`, `fieldLabels.ts`, and the List state `DRAFT` renamed `ACTIVE`, which `ReassignListFlow`'s free-target filter reads; 16: `types.ts`, `ID_FORMATS`, `router.tsx` and `apps/admin/routes.tsx`, for its own fee-settings route) and bump `PERSIST_VERSION`, so the line numbers below are as at `60e2d1e` (the code as 15a session 1, commit `b342a7d`, left it): find each entry point by name.
**Estimated:** 2 sessions. **Session 1** (work items 1 to 9): the model, the seed, the store actions, the pure helper, the privacy boundary and its test, the acknowledgement on the store's write paths, the audit labels and the Admin pickers; it ends green and demoable (the seeded pairings and tiers show in Edit list, Book (phone advice) and Reassign list). **Session 2** (work items 10 to 15): the master-data screens, the surgeon profile page, the Admin anaesthetist record page with its tier and pairings, the cross-links, Playwright, then the demo guide, the catalogue screenshots and the PROGRESS entry. If session 1 runs long, keep the seed proof, the privacy test and the store tests, and move the `PermanentListSheet` picker (part of item 9) to the start of session 2 rather than cutting tests.

## Goal

Make surgeons real master data, and give the office a private record of who works well, or not,
with whom. Today a Surgeon is `{ id, name, specialty? }` in a view-only table, and nothing knows
who a surgeon's rooms are, how to reach a hospital, which pairings the office keeps in its head, or
which anaesthetists the directors want offered extra work first. This phase:

- extends Surgeon into a profile with **one HPI CPN field**, the surgeon's unique index on the
  Health Provider Index (OQ-52 answered: the equivalent of the NHI for a patient), an NZ medical
  registration number held for information, and a link to its surgeons' room;
- adds surgeons' rooms with a contact email and phone, surgeon groups with member surgeons (US-13.4.1
  lists them; Phase 18's COS rooms holder links to a group, since the catalogue's third-party
  holders are an insurer, a hospital, a surgeon or a surgeon's rooms, US-04.1.5), and a contact
  email on every hospital;
- adds **private, two-way pairing preferences** (OQ-43 answered 2026-10-07, D44; US-13.6.3,
  US-13.6.4, DM-54). Each entry is one surgeon and one anaesthetist, says **which side asked**, is
  either **not preferred** or **preferred**, carries an optional reason, and is recorded and ended
  (audited, history kept) by the office from either the surgeon profile or the Admin anaesthetist
  record, showing on both;
- adds an **admin-only priority tier** on each anaesthetist (US-01.3.6): four tiers, highest first,
  the lowest the default for a new anaesthetist, labelled per OQ-102's default (D36: Tier 1 to
  Tier 4, Tier 4 the default);
- enforces a **privacy boundary**: preferences and tiers live in their own office-only state slice,
  are read only by Admin, and never reach a mobile, web or PWA screen or selector; the PWA's import
  closure never reaches the office-only store module or the Admin pieces. A source-scan test in the
  style of the PWA purity test proves it. This is the point of the stories: "Definitely don't want
  either side to know" (OQ-43). (The fake backend runs in the browser, so the seeded slice and the
  store's acknowledgement check still ship inside every build's in-memory store; in the real system
  the server enforces it. Say so on the owner's review list rather than contorting the seed.);
- gives Admin editors for all of these, a URL-addressable surgeon profile page and an Admin
  anaesthetist record page.

The consumer is the office pairing a surgeon with an anaesthetist. **One shared pure helper**
(`src/domain/pairingPreferences.ts`, never inline in a sheet) serves every office pairing path:
given a List and the candidate anaesthetists (or the candidate surgeons for an anaesthetist's
session), it separates candidates with a not-preferred pairing into their own labelled group, still
selectable, with a soft warning naming the pairing before saving (US-01.3.5); marks preferred
pairings (US-13.6.4); and orders each group by tier, highest first, shuffled within a tier from the
seeded RNG with a per-request key, with a tier filter (US-01.3.6). It is wired into today's office
paths: Edit list's surgeon choice, the phone-advice assignment, the Permanent List sheet's usual
surgeon, and Reassign list (US-01.4.1, the office's move). Phase 28's availability finder and
Phase 31's Draft List assignment reuse it. There is **no** warning, grouping or tier order when an
anaesthetist hands on their own List or Booking (US-01.4.5, US-01.4.7; Phases 32 and 32a), and the
anaesthetists' view of available colleagues is never tier-ordered.

FT-13.6 closes here with US-13.6.1 to US-13.6.4; its spreadsheet-load sentence is US-13.4.3's, in
Phase 42. DM-54 closes here; US-01.3.5 stays partial until Phase 31's Draft List path, and US-01.3.6
until Phase 28's finder.

## Before you start: drift check

1. Diff the catalogue for this phase's items against the plan's snapshot (catalogue commit
   `60e2d1e`, the 2026-10-07 client meeting and the 2026-10-08 plan update):

   ```
   node docs/prototype-build/catch-up/tools/plan-state.mjs --diff FT-13.6,US-13.6.1,US-13.6.2,US-13.6.3,US-13.6.4,US-01.3.5,US-01.3.6,US-13.4.1,US-12.1.4,US-01.4.1,US-01.4.2,US-01.4.5,US-01.4.7,US-01.6.3,OQ-52,OQ-43,OQ-102
   ```

   If an item changed, re-read it and adjust the work items below before planning. If a covered item
   is now Retired or Future, drop it from this phase and say so in the PROGRESS entry. A new item on
   the same surface (for example a room with several contacts, or surgeons in more than one room)
   comes into this phase only if it is small and on these screens; otherwise note it for Phase 42.
   What `60e2d1e` already changed, and this plan already reflects: US-13.6.3 is Confirmed and
   rewritten (private two-way not-preferred pairings, admin only, on both profiles, no warning on an
   anaesthetist's own hand-on); US-01.3.5 is widened to every office assign or move with grouped
   pickers, tier order and preferred pairings shown; FT-13.6 and US-13.6.2 name preferences in
   place of the blacklist; US-13.6.1 drops the room's estimated durations (prepayment is a fixed
   amount now, OQ-38); US-13.6.4 (preferred pairings) and US-01.3.6 (priority tiers) are new;
   US-01.4.5 is Confirmed as **no** warning; DM-54 is new and DM-32 now also holds the anaesthetist
   profile (DM-33 merged).
2. **OQ-52 (HPI CPN), answered 2026-10-01 and unchanged at `60e2d1e`.** Build one required field,
   `hpiId`, labelled **"HPI CPN"** everywhere. If the answer has since been reopened or reworded,
   stop and say so before building item 1.
3. **OQ-43 (answered 2026-10-07, D44).** Build it as answered: private, two-way, admin only, a
   soft admin warning on assign or move, none on an anaesthetist's own hand-on. If the answer has
   since been reopened, stop and say so.
4. **OQ-102 (names), Open; D36 default.** If AA has since picked names, put them in the one label
   set of item 2 (`PAIRING_LABELS`, `TIER_LABELS`), drop the "provisional" line on the tier control,
   and say so in the PROGRESS entry. If it is still open, build the default and log it on the "For
   the owner's review" list. Either way, "blacklist" and "whitelist" never appear in app copy.
5. **Baseline.** Confirm Phases 14 and 15 are DONE in PROGRESS.md; if either is not, stop and say
   so. Phase 15 landed the post-rename names this plan uses: `AddBookingFlow`
   (`src/shared/flows/AddBookingFlow.tsx`), `onBookingCreated` in `PhoneAdviceBooking`, the button
   "Continue to add booking", `stampBookingId` in `MutationMeta`, the Booking id prefix `BK`, and
   `shared/booking/BookingDetailBody.tsx`. Read the current `PERSIST_VERSION` in
   `src/store/appStore.ts` (16 at `60e2d1e`, after 15a session 1; 15a session 2, 15b and 16 may
   have bumped it) and bump it by one from whatever it is now. Note whether 15b has landed (the List
   state `ACTIVE` in place of `DRAFT` for an assigned List): use whichever name the code has.

## Reference

**Design files (convention 17).** No mockup covers master data, a profile page or a candidate
picker with tiers, so extend the existing Admin patterns rather than inventing new ones:
- `docs/design/Admin Day.dc.html` and `docs/design/Admin Review.dc.html` give the Admin chrome: the
  dark side nav, the white content surface, table rows, the list drawer, and the amber attention
  treatment used for advisory conflicts.
- `docs/design/Design Language.dc.html` gives the tokens: warning `#A16207` with tint `#F9F0DC` and
  on-tint `#7C4D08` (the soft warning, the same as the advisory-conflict box), pills, radii
  (ctl 10, card 14), and Spline Sans Mono for identifiers.
- Teal is the only action colour. Crimson never marks a not-preferred row or a tier. A
  not-preferred pairing is attention (warning tint), never an error; a preferred pairing is a calm
  neutral or teal-tint pill, never a status colour; tiers are plain neutral pills.

**Catalogue:** the covered items above; the narrative in
`requirements-board/requirements/domain-model.md` ("Surgeon, surgeons' room, preferences and
priority tiers"; the ER lines `SURGEON }o--|| SURGEON_ROOM`, `ANAESTHETIST }o--o{ SURGEON : "private
preferences (not wanted, preferred)"` and `ANAESTHETIST }o--|| PRIORITY_TIER : "admin only (Bronze default)"`, where Bronze is
Vanessa's provisional name for the lowest tier, built as Tier 4 under D36; the
"No surgeon master data beyond a name" row of the RFP-delta table; and the glossary rows for
Preferences and Priority tier). The meeting's words: `requirements-board/requirements/notes/2026-10-07-aa-client-meeting.md`
items #4 (OQ-43), #19 (no warning on an own hand-on), #20 (positive preferences, a better name),
#21 to #23 (tiers: admin only, pools shuffled within a tier, four tiers with the lowest the
default) and #36; and the change log `requirements-board/requirements/changes/2026-10-07-requirements-update.md`.
Earlier context: `notes/2026-10-01-aa-meeting-with-greg.md` (#19, #26) and
`notes/2026-10-02-aa-requirements-review-with-greg.md` (#13 surgeons and rooms, #43 the room
record, #44 two lists). To read why an item says what it says, run
`npm --prefix requirements-board run source -- --item <ID> --text` and read only the cited passages.

**Analysis:**
- `docs/prototype-build/catch-up/GAP-ANALYSIS.md`: theme 11 (master data and profiles), and the
  EP-13 and EP-01 tables;
- `docs/prototype-build/catch-up/epics/EP-13.md` (#us-13.6.1 to #us-13.6.4, #us-13.4.1) and
  `epics/EP-01.md` (#us-01.3.5, #us-01.3.6, #us-01.4.5);
- `docs/prototype-build/catch-up/analysis/domain-model-delta.md` (#dm-32 and #dm-54; also DM-03
  Draft List, DM-05 own-List move, DM-42 single-Booking move, DM-41 the notification pool, DM-48
  the contract holder and DM-35 the update email, which consume this phase);
- `analysis/prototype-map-admin.md`, `analysis/prototype-map-store-seed.md`,
  `analysis/prototype-map-domain.md` and `analysis/prototype-map-shared.md`.

**Code entry points (as at `60e2d1e`, after Phases 14, 15 and 15a session 1):**
- `aa-prototype/src/domain/types.ts`: `Anaesthetist` (:141, with `hpiId`), `Hospital` (:155),
  `Surgeon` (:160), `ContractHolderOrganisation` (:180), `AuditEntry` (:655).
- `aa-prototype/src/domain/rng.ts`: `mulberry32`, the seeded RNG the shuffle uses.
- `aa-prototype/src/domain/seed/cast.ts`: `ANAESTHETISTS` (:44-58, each with a fictional `hpiId`
  such as `10SOUM`), `SURG` (:65), `SURGEONS` (:78), `HOSP`, `HOSPITALS`, `ORG`, `ORGANISATIONS`.
- `aa-prototype/src/domain/seed/index.ts`: `SeedMasters` (:91), the `masters` assembly and
  `buildSeed` (:523); the seed state's top-level keys are `masters`, `schedule`, `audit`,
  `settings`, `appSettings`, `dashboards`, `dayNotes`, `counters`.
- `aa-prototype/src/domain/seed/canvas.ts`: `CES_SURGEONS` and `GENERAL_SURGEONS` (:62-64, picked at
  :139). These are the slot RNG's pick arrays. **Do not change them**, or every generated List moves.
- `aa-prototype/src/store/mastersActions.ts`: `createHospital`, `addAnaesthetist`,
  `editAnaesthetist`, `addPermanentList` and `editPermanentList` (the patterns to copy: office-only
  refusal, `mutate()` with before/after metas, `allocateId`).
- `aa-prototype/src/store/mutate.ts`: `ID_FORMATS` (:61), `allocateId`, `clockISO`.
- `aa-prototype/src/store/lifecycle.ts`: `editList` (:491) and `reassignList` (:543).
- `aa-prototype/src/store/appStore.ts`: `AppState`, `ShellSlice` (:71, the non-domain slice beside
  `currentApp`), `PERSIST_VERSION` (:136, 16 at `60e2d1e`).
- `aa-prototype/src/shared/audit/actionLabels.ts`, `fieldLabels.ts` (`hpiId: 'HPI id'`) and
  `auditNarrative.ts`. `auditNarrative.test.ts` scans every `action: '...'` in `store/` and
  `domain/seed/` and fails if any code has no label. The reading layer renders ids as ids.
- `aa-prototype/src/shared/booking/HistorySheet.tsx` and `HistoryTimeline.tsx`: the history views
  both the Admin and the anaesthetist apps open, by entity id.
- `aa-prototype/src/apps/admin/screens/MasterData.tsx` (553 lines): the `Entity` union and `NAV`
  (:28-52), `AnaesthetistsView` (:171), `HospitalsView` (:275), `AddHospitalSheet` (:313),
  `SurgeonsView` (:349, view only today) and `OrganisationsView` (:396).
- `aa-prototype/src/apps/admin/flows/EditListSheet.tsx` (plain surgeon select, :87-95),
  `PhoneAdviceBooking.tsx` (surgeon select :127-131, `onBookingCreated`, the `isScriptedS2Booking`
  prefill around :88-93 that S2 Beat 2 relies on, and the "Continue to add booking" button),
  `ReassignListFlow.tsx` (the `freeTargets` button list, :49-56 and :83-93, in master order today),
  `PermanentListSheet.tsx` (the "Usual surgeon" select, :120), `EditAnaesthetistSheet.tsx` (the
  "HPI" line, :61) and `AddAnaesthetistFlow.tsx` (the "HPI id (optional)" field, :72).
- `aa-prototype/src/apps/admin/components/ListDrawer.tsx` (the surgeon name at :39, the
  advisory-conflict box, the surgeon row at :71).
- `aa-prototype/src/router.tsx` (the `masters` leaf route, :107), `apps/admin/routes.tsx`
  (`AdminMastersRoute`), `shell/RequireEntity.tsx` (`to=".."` is route-relative), and
  `apps/admin/AdminApp.tsx` (`sectionForPath`, which picks the active side-nav section from the
  first path segment, so `/admin/masters/...` already lights Master data).
- Purity tests to copy: `src/pwa/pwaPurity.test.ts` (walks the PWA import closure from
  `pwa/main.tsx`) and `src/apps/moneyViewPurity.test.ts` (a source scan of `apps/mobile` and
  `apps/web` with comments stripped).
- Tests to extend: `store/mastersActions.test.ts`, `domain/seed/seed.test.ts`,
  `store/persistMigrate.test.ts`, `apps/admin/flows/ReassignListFlow.test.tsx`, and
  `visual/admin-phase07.spec.ts` (the master-data shot).

## Work items

Build in this order: model, then seed, then store, then the helper, the privacy test and the
pickers (session 1); then screens (session 2).

1. **Domain types** (`src/domain/types.ts`) (DM-32, DM-54; US-13.6.1 to US-13.6.4, US-01.3.6):
   - New id aliases: `SurgeonRoomId`, `SurgeonGroupId`, `PairingPreferenceId`.
   - `Hospital` gains `contactEmail?: string` (US-13.4.1: "hospitals, each with a contact email for
     booking updates"). Optional, because a newly added hospital may not have one yet.
   - `Surgeon` gains:
     - `roomId: SurgeonRoomId`, **required** (US-13.6.1: "a surgeon is linked to a room"; one room
       per surgeon, the catalogue's recommendation). Required, so the compiler finds every place
       that builds a Surgeon, including fixtures;
     - `hpiId: string`, **required**: the **HPI CPN**, the surgeon's unique index (US-13.6.2;
       OQ-52). The same field name as `Anaesthetist.hpiId`, so one field label and Phase 40a's
       consistency pass serve both. Its doc comment says it is the HPI Common Person Number, unique
       across every practitioner, and not the patient's NHI. `Surgeon.id` (`S-HALE`) stays the
       record key, so no List or Contract is re-keyed;
     - `medicalRegistrationNumber?: string`, held for information.
   - `SurgeonRoom { id, name, contactEmail, phone }`. The room's surgeons are **derived** from
     `Surgeon.roomId` and never stored on the room, so the link has one source of truth.
   - `SurgeonGroup { id, name, description?, memberSurgeonIds: SurgeonId[] }` (US-13.4.1; Phase 18
     points its surgeon-group holder at it).
   - `PairingPreference { id, kind, raisedBy, anaesthetistId, surgeonId, reason?, addedAtISO,
     addedBy, endedAtISO?, endedBy?, endReason? }` (US-13.6.3, US-13.6.4, DM-54):
     - `kind: PairingKind`, `'NOT_PREFERRED' | 'PREFERRED'`;
     - `raisedBy: PairingSide`, `'SURGEON' | 'ANAESTHETIST'`: which side asked (US-13.6.3 "says
       which side asked"). Both kinds and both sides are one model over one store;
     - `addedBy` is always an office user here: only admin staff maintain the record;
     - an entry is active while `endedAtISO` is absent. Ending never deletes (US-13.6.3 "Remove a
       pairing ... the history of who changed it is kept").
   - `PriorityTier = 1 | 2 | 3 | 4` (1 the highest). **Not a field on `Anaesthetist`**: the
     `Anaesthetist` record flows into the anaesthetist apps (colleague names, availability), so a
     tier on it would leak the moment any screen spread the record. It lives in the office-only slice
     below, keyed by anaesthetist id; an anaesthetist with no entry is at `DEFAULT_PRIORITY_TIER`.
   - **`OfficePrivateSlice { pairingPreferences: Record<PairingPreferenceId, PairingPreference>;
     priorityTiers: Record<AnaesthetistId, PriorityTier> }`**, a new top-level seed-state slice
     (`officePrivate`, beside `masters` and `schedule`), not inside `masters`, so `masters` stays
     safe to hand to any screen. Its doc comment states the privacy rule (OQ-43, US-01.3.6 "Admin
     only") and names the test that enforces it (item 6).
2. **Pure helpers** (all new, in `src/domain`, no React, covered by Vitest; `domainPurity.test.ts`
   must still pass).
   - `src/domain/pairingPreferences.ts` (one rule, one place; never inline in a sheet or a store
     action):
     - **the one label set** (OQ-102, D36): `PAIRING_LABELS` (`notPreferred: 'Not preferred'`,
       `preferred: 'Preferred'`, the section title `'Pairing preferences'`, the group heading
       builder "Not preferred with Dr Sharma", the option suffixes "· not preferred" and
       "· preferred") and `TIER_LABELS` (`{ 1: 'Tier 1', 2: 'Tier 2', 3: 'Tier 3', 4: 'Tier 4' }`)
       with `DEFAULT_PRIORITY_TIER = 4` and `tierLabel(t)`. Every user-facing string in this phase
       that names a pairing kind or a tier (picker groups, pills, the warning, the profile sections,
       the sheets, the tier control, the audit labels) builds from these, so AA's names are one
       edit. It lives in `src/domain` because the warning message needs it and `src/domain` never
       imports from `src/shared`;
     - **the side wording, also in one place:** `pairingSentence(kind, side, anaesthetistName,
       surgeonName)`: "Ms A. Reid prefers not to work with Dr Priya Sharma" (not preferred, surgeon
       asked), "Dr Priya Sharma prefers not to work with Ms A. Reid" (not preferred, anaesthetist
       asked), "Mr J. Whitford prefers to work with Dr Priya Sharma" (preferred, surgeon asked), and
       the reverse. The profile rows, the add sheet's choices, the ended-entry rows and the warning
       build from it;
     - `activePairings(entries)` and `pairingsFor(entries, anaesthetistId, surgeonId)` (the active
       entries for the pair, any kind, either side, in a stable order);
     - `pairingStatus(entries, anaesthetistId, surgeonId)` returns `'NOT_PREFERRED' | 'PREFERRED' |
       'NONE'`. A pairing is not preferred when **either side** has an active not-preferred entry;
       that wins over any preferred entry on the other side;
     - `groupSurgeonsForAnaesthetist({ surgeons, entries, anaesthetistId })` returns `{ clear,
       notPreferred }`, each sorted by display name, each item `{ surgeon, preferred: boolean }`
       (US-01.3.5 first picker bullet; US-13.6.4 "admin see both kinds");
     - `rankAnaesthetistCandidates({ candidates, entries, tiers, surgeonId, requestKey, tierFilter })`
       returns `{ clear, notPreferred }`, each item `{ anaesthetistId, tier, preferred,
       notPreferredEntries }` (US-01.3.5 second bullet; US-01.3.6):
       - with a `surgeonId`, candidates with a not-preferred pairing go to `notPreferred`; with none
         (a List with no surgeon yet), everyone is `clear`;
       - **each group is ordered by tier, Tier 1 first, and shuffled within a tier** by a seeded
         shuffle: `mulberry32(hashString(requestKey))` with a small pure string hash in this file,
         never `Math.random` and never the wall clock (convention 5);
       - `tierFilter` (a set of tiers, or all) narrows both groups;
       - preferred pairings are **marked**, not re-ordered (US-13.6.4's "can inform the order" is an
         inference the room did not say; log "float preferred pairings to the top of their tier" as
         an option for the owner);
     - `notPreferredWarning(masters, entries, anaesthetistId, surgeonId)` returns `{ anaesthetistName,
       surgeonName, entries: { entryId, raisedBy, reason? }[], message } | null`, where `message`
       names both people and the side ("Ms A. Reid prefers not to work with Dr Priya Sharma.", the
       reverse, or "Dr Priya Sharma and Ms A. Reid have each asked not to be paired." when both
       sides are active). Only not-preferred entries warn; a preferred pairing never does. It uses
       the master records' names; surname shaping happens in the Admin UI pieces;
     - `notPreferredEntryIds(...)` for the write paths' acknowledgement (item 7).
   - `src/domain/surgeons.ts`: `surgeonsInRoom`, `groupsForSurgeon`, `isPlausibleEmail` (a
     deliberately loose `something@something.tld` check, shared by rooms and hospitals),
     `normaliseHpiCpn` (trim, upper-case) and `isPlausibleHpiCpn` (two digits then four letters, the
     shape the seed's anaesthetists already use, for example `12ABCD`; no check character and no
     register lookup, which are Phase 40a's).
   - Tests (`pairingPreferences.test.ts`, `surgeons.test.ts`):
     - an active not-preferred entry warns and groups, an ended one does not, on either side;
     - a surgeon-side, an anaesthetist-side, and both together each give the right message and put
       the candidate in `notPreferred` once, never twice;
     - a preferred entry marks and never warns; not preferred on one side and preferred on the other
       is not preferred;
     - re-adding after ending warns again;
     - the groups are exhaustive and disjoint: no candidate lost or duplicated, whatever the filter
       leaves;
     - **tier order:** every Tier 1 before every Tier 2, and so on, in each group; an anaesthetist
       with no tier entry ranks as Tier 4;
     - **shuffle:** the same `requestKey` gives the same order (replays after Reset); across a run of
       keys, two same-tier candidates appear in both orders; no key ever moves a candidate across a
       tier;
     - the tier filter narrows both groups and keeps the order;
     - a missing surgeon or anaesthetist id returns null, never a throw;
     - no label, message or sentence contains an en or em dash, or the words "blacklist" or
       "whitelist";
     - `normaliseHpiCpn(' 12abcd ')` is `12ABCD`; `isPlausibleHpiCpn` accepts every seeded
       anaesthetist `hpiId` and rejects blank, `1ABCDE` and `12ABC`.
3. **Seed** (in `src/domain/seed/cast.ts`, or a new `seed/surgeonMasters.ts` and
   `seed/officePrivate.ts` re-exported from it). All fictional: `.example` email domains and
   `03 555 ####` phones.
   - `ROOMS`: five or six fictional rooms (for example "Avonside Surgical Rooms", "Riccarton
     Orthopaedic Rooms"; no real Christchurch practice names), each with a contact email and phone.
     Every seeded surgeon gets a `roomId`, and every room has at least one surgeon; share rooms
     where the specialties match (Whitford and Reid in one eye rooms).
   - Every `SURGEONS` row gains `roomId`, a fictional HPI CPN `hpiId` in the `NNAAAA` shape (for
     example `40HALT` for Mr T. Hale), distinct from every other surgeon's and from every
     anaesthetist `hpiId` (`10SOUM` to `23STRO`), and a fictional `medicalRegistrationNumber`.
   - `HOSPITALS` gain `contactEmail` (for example `bookings@stgeorges.example`).
   - `SURGEON_GROUPS`: "Canterbury Orthopaedic Surgeons" (`SG-COS`) with Mr T. Hale, matching the
     existing `ORG.cos` organisation by name (Phase 18's COS rooms holder links to it;
     leave `organisations` and the COS Contract untouched here), and one eye group with Mr J.
     Whitford and Ms A. Reid.
   - **`PAIRING_PREFERENCES`** (fixed ISO timestamps, never the clock; `addedBy` "Kirsty W."). A
     probe of the seed at `60e2d1e` found: Ms A. Reid is the one surgeon the generated canvas never
     pairs with Dr Priya Sharma; Dr Alistair Chen's Tue 21 PM Christchurch Eye Surgery List is
     Reid's, with Free PM sessions that day for Sharma, Delaney, Hughes and Strand; Dr James
     Rutherford's Wed 22 AM Christchurch Eye Surgery List (S2 Beat 3) is Mr J. Whitford's, with Free
     AM sessions for Sharma, Ngata, Ropata, Delaney, Morrison and Whitaker. Seed:
     - **one active not-preferred pairing, surgeon side:** Ms A. Reid with Dr Priya Sharma, reason
       "Surgeon's preference", added `2026-03-10T10:00:00`. In S2 Beat 2 (Sharma's Tue 21 PM,
       St George's, Hale) the surgeon picker shows Reid in the "Not preferred with Dr Sharma" group,
       and the scripted Hale path is unchanged; Reassign list from Chen's Tue 21 PM List shows Sharma
       apart, under "Not preferred with Ms Reid";
     - **one ended not-preferred pairing, anaesthetist side, on the same surgeon:** Dr Rawiri Hughes
       with Ms A. Reid, added 2025-11-03, ended 2026-05-12 with end reason "Resolved with the
       surgeon's rooms", so Reid's profile shows both sides and the history, and Hughes stays clear
       in the Chen reassign picker;
     - **one active preferred pairing, surgeon side, that S2 Beat 3 shows:** Mr J. Whitford with Dr
       Priya Sharma, reason "Asks for Dr Sharma on long eye lists", so Sharma carries a Preferred
       pill in the Rutherford reassign picker;
     - optionally one anaesthetist-side preferred pairing elsewhere, so both kinds show both sides.
   - **`PRIORITY_TIERS`**, demo-plausible (the 2026-10-07 meeting: the directors highest, five of
     them): Tier 1 for five directors (for example Souter, Rutherford, Morrison, Delaney and
     Strand), Tier 2 for two or three (for example Sharma, Chen, Fitzgerald), Tier 3 for a few (for
     example Ngata, Beaumont, Hughes), and the rest left at the Tier 4 default with **no entry**
     (so the default path is exercised). Check that the Wed 22 AM free candidates span several tiers
     with at least two in one tier (with the example: Morrison and Delaney Tier 1, Sharma Tier 2,
     Ngata Tier 3, Ropata and Whitaker Tier 4), so S2 Beat 3 shows the order and the shuffle.
   - Wire `surgeonRooms` and `surgeonGroups` into `SeedMasters`, and the new `officePrivate` slice
     into `SeedState` and `buildSeed`. Seed ids are `RM-...`, `SG-...` and `PP-...` (not `BL`, the
     billing-line prefix, and not `BK`, the Booking prefix). **Do not add surgeons, and do not
     touch `CES_SURGEONS`, `GENERAL_SURGEONS` or any generator input**, so the canvas is identical
     to before.
   - **Bump `PERSIST_VERSION` by one** (from 16 at `60e2d1e`, or whatever 15a, 15b and 16 left),
     with its history comment.
   - Seed tests (`seed.test.ts`):
     - **write the canvas fingerprint test first, before any seed edit**, so "unchanged" compares
       against the real pre-phase canvas;
     - every surgeon's `roomId` resolves and every room has a surgeon;
     - every surgeon has a plausible HPI CPN, unique across surgeons and anaesthetists together;
     - every group member and pairing reference resolves; every tier key is an anaesthetist;
     - hospital and room emails pass `isPlausibleEmail`;
     - the seed holds an active not-preferred entry, an ended one, an active preferred one, and both
       sides;
     - no seeded List or Permanent List pairs an anaesthetist and surgeon with an active
       not-preferred entry. Re-run before choosing: if earlier phases shifted the canvas and the slot
       RNG now pairs Sharma with Reid, pick another surgeon (and re-point the shots and the
       checklist) rather than patching Lists;
     - the S2 path stays clear: Sharma and Hale are not "not preferred"; Sharma is not "not
       preferred" with the surgeon on Rutherford's Wed 22 AM List (the S2 Beat 3 reassignment);
     - the generated canvas is unchanged (list ids, `surgeonId` and `hospitalId` match the
       fingerprint).
4. **Runtime ids** (`src/store/mutate.ts` `ID_FORMATS`): add `surgeon` (`SN`, pad 3),
   `surgeonRoom` (`RMN`, pad 3), `surgeonGroup` (`SGN`, pad 3) and `pairingPreference` (`PPN`, pad 3),
   distinct from the seed's `S-`, `RM-`, `SG-` and `PP-` and from every existing runtime prefix.
5. **Store actions.**
   - Common rules: office-only (`refuse('officeOnly', ...)` otherwise); validated, with
     plain-English refusals and no dashes; one `mutate()` commit with before and after metas and
     `stampBookingId: null`; timestamps from `clockISO(s.clock)`.
   - **Masters** in a new `src/store/surgeonActions.ts`, exported from `src/store/index.ts`; the
     hospital ones in `mastersActions.ts`:
     - `createSurgeon(api, actor, { name, specialty?, roomId, hpiId, medicalRegistrationNumber? })`
       stores `normaliseHpiCpn(hpiId)` and refuses a blank name, an unknown room, a blank or
       implausible HPI CPN, or one already held by another surgeon or an anaesthetist ("That HPI CPN
       already belongs to Dr Priya Sharma"); `editSurgeon` takes the same fields and rules, the id
       immutable; audits `surgeon.create` and `surgeon.update`;
     - `addAnaesthetist` and `editAnaesthetist` (in `mastersActions.ts`) keep the anaesthetist's
       `hpiId` optional, but store a typed one through `normaliseHpiCpn` and refuse one already held
       by a surgeon or another anaesthetist, so the HPI CPN is unique across practitioners whichever
       record is saved first (no shape check on the anaesthetist here, so no existing record is
       refused; Phase 40a adds validation);
     - `createSurgeonRoom` and `editSurgeonRoom` refuse a blank name or an implausible email; the
       phone is free text; audit `surgeonRoom.create` and `surgeonRoom.update`;
     - `createSurgeonGroup` and `editSurgeonGroup` refuse unknown members and de-duplicate them;
       audit `surgeonGroup.create` and `surgeonGroup.update`;
     - `createHospital` gains an optional `contactEmail` (today's contract behaviour on hospital add
       is untouched here; Phase 18 owns it); new `editHospital(api, actor, hospitalId, { name?,
       contactEmail? })` refuses a duplicate name or an implausible email; audits `hospital.update`.
   - **Office-private actions and selectors** in a new `src/store/officePrivate.ts`, **not**
     re-exported from the `src/store/index.ts` barrel (the PWA imports that barrel); Admin imports
     it by path:
     - `addPairingPreference(api, actor, { kind, raisedBy, anaesthetistId, surgeonId, reason? })`
       requires `kind` and `raisedBy`, refuses an unknown kind, side, anaesthetist or surgeon, an
       active entry for the same pair **on the same side and of the same kind** (a duplicate), and
       an active entry for the same pair on the same side **of the other kind** ("Ms A. Reid already
       has a Preferred entry with Dr Sharma. End it first."). The other side of a pair may be added:
       both sides may be active. Re-adding after an end creates a new entry. Audits `pairing.add`
       with entity type `pairingPreference`;
     - `endPairingPreference(api, actor, entryId, endReason?)` refuses an unknown or already ended
       entry, sets `endedAtISO` and `endedBy`, keeps the record, audits `pairing.end`;
     - `setPriorityTier(api, actor, anaesthetistId, tier)` refuses an unknown anaesthetist or a tier
       outside 1 to 4, writes the entry (setting Tier 4 may delete the key or store 4: pick one and
       test it), and audits `anaesthetist.tierSet` with before and after on the anaesthetist entity;
     - the selectors Admin reads: `selectPairingPreferences(s)`, `selectPairingsForSurgeon`,
       `selectPairingsForAnaesthetist`, `selectPriorityTier(s, id)` (default 4) and
       `selectPriorityTiers(s)`;
     - a new anaesthetist (`addAnaesthetist`) writes no tier, so they read as Tier 4 until the office
       changes it (US-01.3.6 "Default"); test it.
   - **The shuffle's request key.** Add a non-domain counter, `suggestionSeq`, to the shell slice
     (beside `currentApp`, set by a plain action like `setCurrentApp`; it is UI state, not a domain
     mutation, so it is not audited), bumped by one each time an office candidate picker opens, and
     zeroed by Reset. The pickers pass `requestKey = listId + ':' + suggestionSeq`, so reopening the
     picker reshuffles within a tier, and a fresh Reset replays the same orders.
   - No delete actions for any of these masters; Phase 42 owns deactivation and controlled loads.
   - Tests (`store/surgeonActions.test.ts`, `store/officePrivate.test.ts`, `mastersActions.test.ts`):
     the anaesthetist actor refused on every action; each validation refusal, including a duplicate
     HPI CPN against a surgeon and against an anaesthetist, `addAnaesthetist` refusing a surgeon's
     HPI CPN, and a lower-case CPN stored upper-case;
     audit entries with the right action, entity and before/after; end keeps the entry and a second
     end is refused; a same-side duplicate refused, the other side accepted, a same-side opposite
     kind refused; tier set, re-set and default; `editHospital` round-trips `contactEmail`.
6. **The privacy boundary** (US-13.6.3 "Admin only", US-01.3.6 "Admin only", US-01.4.5 "Nothing
   revealed"). Add `src/apps/officePrivacy.test.ts`, in the style of `moneyViewPurity.test.ts` and
   `pwaPurity.test.ts`:
   - **an allowlist source scan** (comments stripped): the identifiers `officePrivate`,
     `pairingPreferences`, `priorityTiers`, `PairingPreference`, `PriorityTier` and imports of
     `store/officePrivate` or `domain/pairingPreferences` appear only in `domain/types.ts`,
     `domain/pairingPreferences.ts`, `domain/seed/**`, `store/officePrivate.ts`, `store/appStore.ts`
     and the persist files, the store's office write paths that record the acknowledgement
     (`store/lifecycle.ts`, `store/mastersActions.ts`), `shared/audit/**` (labels only), tests, and
     `apps/admin/**`. Any hit in `apps/mobile`, `apps/web`, `pwa/`, `shared/` outside the audit
     labels, `shell/` or `apps/demo` fails with a message naming the file and the rule;
   - **a closure check** reusing `pwaPurity.test.ts`'s resolver: the PWA import closure from
     `pwa/main.tsx` never reaches `store/officePrivate.ts` or `apps/admin/**`;
   - **a history check:** the pairing and tier audit codes (`pairing.*`, `anaesthetist.tierSet`,
     `*.pairingAcknowledged`) never render in a history the anaesthetist apps open. Find which
     entities the mobile and web apps open `HistorySheet` for (Bookings and Procedures today; check
     for Lists). The acknowledgement sits on the List or Permanent List, the pairing entries on their
     own entity, and the tier on the anaesthetist entity: if any anaesthetist-app history reads one
     of those entities, filter those codes out there through one exported set
     (`OFFICE_PRIVATE_AUDIT_ACTIONS` in `domain/pairingPreferences.ts`) and test it;
   - **a vocabulary check:** no string in `src/` outside comments contains "blacklist" or
     "whitelist" (case-insensitive).
7. **The acknowledgement on the store's write paths, which never block** (US-01.3.5 "Still
   selectable", US-13.6.3 "Warns admin, never blocks"):
   - The paths: `editList` (surgeon change on an anaesthetist's List), `reassignList` (the List's
     surgeon against the target anaesthetist), and `addPermanentList` / `editPermanentList` (a usual
     surgeon on an anaesthetist's recurring template; the "recurring booking" rename is Phase 30's).
   - None of them refuses on a not-preferred pairing.
   - When the resulting pairing is not preferred and the pairing actually changed, they add a second
     meta in the same commit: `list.pairingAcknowledged` or `permanentList.pairingAcknowledged`, with
     `after: { anaesthetistId, surgeonId, pairingPreferenceIds }` (one or both sides' entries). A
     notes-only edit does not re-log it. This is the one extra rule this phase adds, and it is cheap:
     name it in the Decisions log. A preferred pairing writes nothing.
   - **Only an office actor gets the check.** `editList` also lets an anaesthetist edit their own
     List; that path never reads the slice, never checks and never logs (US-01.4.5: nothing
     revealed). The acknowledgement's entity is the List or Permanent List, never a Booking.
   - Through the helper of item 2, never inline, so Phase 28's rewrite and Phase 31's
     `assignDraftList` call the same function.
   - Tests: `editList` to a not-preferred surgeon succeeds with exactly one acknowledgement, also
     when both sides are active (one naming both entries); the same save again writes none;
     `reassignList` onto a not-preferred anaesthetist succeeds with one; an anaesthetist-side entry
     acknowledges like a surgeon-side one; an ended entry and a preferred entry write none; an
     anaesthetist's own `editList` to a not-preferred surgeon writes none.
8. **Audit reading layer.**
   - `shared/audit/actionLabels.ts`: a label for every new code, the kind words from
     `PAIRING_LABELS`: "Surgeon added", "Surgeon updated", "Surgeons' room added", "Surgeons' room
     updated", "Surgeon group added", "Surgeon group updated", "Hospital updated", "Pairing
     preference added", "Pairing preference ended", "Priority tier changed" and "Not preferred
     pairing assigned (warning acknowledged)".
   - `fieldLabels.ts`: **relabel `hpiId` from "HPI id" to "HPI CPN"** (OQ-52; one key for surgeons
     and anaesthetists). Add the missing keys: `contactEmail`, `specialty`, `roomId` ("Surgeons'
     room"), `medicalRegistrationNumber` ("NZ medical registration number"), `memberSurgeonIds`,
     `raisedBy` ("Asked by"), `addedAtISO`, `addedBy`, `endedAtISO`, `endedBy`, `endReason`,
     `tier` ("Priority tier") and `pairingPreferenceIds`. `kind` already exists ("Kind", at
     `60e2d1e`) and serves the pairing's kind as it is: do not relabel it. If the reading
     layer maps enum values to words, map `NOT_PREFERRED`, `PREFERRED`, `SURGEON` and `ANAESTHETIST`
     from the label set; if not, the raw code is acceptable. One map serves every entity: no second
     meaning for an existing key.
   - Leave `auditNarrative.ts` rendering ids as ids. The existing `auditNarrative.test.ts` scan must
     pass.
9. **Admin pairing UI pieces and the pickers** (US-01.3.5 "Separated", "Still selectable",
   "Warned", "Every office path"; US-01.3.6 "Ordered by tier", "Shuffled within a tier", "Filter";
   US-13.6.4 "admin see both kinds"). The pieces are **Admin only**, in a new
   `src/apps/admin/components/pairing/` folder (not `src/shared`: no anaesthetist surface ever shows
   them), so Phase 28's finder and Phase 31's Draft List picker reuse them:
   - `SurgeonPicker`: a native `<select>` for an anaesthetist's session, from
     `groupSurgeonsForAnaesthetist`: a main group "Surgeons" (preferred ones read "Mr J. Whitford ·
     preferred") and a separate optgroup "Not preferred with Dr Sharma" whose options read "Ms A.
     Reid · not preferred", so the closed select still shows it. The empty option stays first with
     its label as a prop (`emptyLabel`: "Not assigned" in `EditListSheet`, "Not assigned yet" in
     `PhoneAdviceBooking`); option text keeps each picker's current form through a prop.
   - `AnaesthetistCandidates`: the grouped candidate list for a List's surgeon, from
     `rankAnaesthetistCandidates`: the clear group first, then a separately headed "Not preferred
     with Ms Reid" group whose rows stay clickable and carry a warning pill; every row carries a
     neutral tier pill and, where it applies, a Preferred pill; a tier filter (a small segmented
     control or chip row: All, Tier 1 to Tier 4) above both groups; it bumps `suggestionSeq` once on
     open (item 5). With no surgeon on the List, there is one group, still tier-ordered.
   - `NotPreferredWarning`: an inline callout in `semantic.warning.tint` and `.onTint` (the
     advisory-conflict box in `ListDrawer.tsx`), never the strong-warning red. If 15a's
     `src/shared/warnings/` pieces have landed, match their mild row's amber treatment so the two
     read as one family, but do not wrap them (they render Booking Warning records). It names the
     pairing and the side, shows each recorded reason, and says the office can still go ahead. It is
     an assignment-time callout, not a Warning record: register nothing in 15a's warning routine, and
     post nothing to the to-do list or the notification pool. `role="status"` and a `data-shot` hook.
   - `useNotPreferredWarning(anaesthetistId, surgeonId)` reads the office slice through
     `store/officePrivate.ts` and returns the helper's result.
   - The pickers:
     - `EditListSheet`: the surgeon select becomes `SurgeonPicker` for `list.anaesthetistId`;
       choosing a not-preferred surgeon shows the warning above the save button, which reads "Save
       list anyway" while it shows.
     - `PhoneAdviceBooking` step 1: the same picker and warning; "Continue to add booking" reads
       "Continue anyway" while warned; the List context, surgeon included, is still written by
       `editList` only once the Booking is created (`onBookingCreated`), so the acknowledgement lands
       then and an abandoned flow writes none; keep `isScriptedS2Booking` and the Hale prefill
       working unchanged.
     - `ReassignListFlow` (the office's move, US-01.4.1): `freeTargets` (same free-session filter as
       today) feeds `AnaesthetistCandidates` for `list.surgeonId`; the confirm step shows the warning
       for a not-preferred target, and the confirm button reads "Confirm reassignment anyway"; update
       `ReassignListFlow.test.tsx` (groups, tier order, filter, warning, a reopened picker
       reshuffling within a tier).
     - `PermanentListSheet`: the usual-surgeon select becomes `SurgeonPicker` for the chosen
       anaesthetist, re-grouping when the anaesthetist changes; the same warning, with "Save anyway"
       or "Add anyway" while it shows. No new "permanent list" wording.
   - Not here: the Draft List picker (Phase 31) and the availability finder (Phase 28) reuse
     `AnaesthetistCandidates`; the office's single-Booking move (`MoveBookingFlow`) changes no
     List's pairing, so it gets no warning.
10. **Master data screens** (session 2; US-13.4.1 rows; US-13.6.1 "Room record"). Split the new
    views out of the 553-line `MasterData.tsx` into a new `apps/admin/screens/masters/` folder, with
    the new sheets (`EditHospitalSheet`, `SurgeonEditSheet`, `SurgeonRoomSheet`,
    `SurgeonGroupSheet`) in `apps/admin/flows/`.
    - The sub-nav (`Entity`, `NAV`) becomes: Anaesthetists · Contracts · Permanent lists · Hospitals
      & holidays · **Surgeons** · **Surgeons' rooms** · **Surgeon groups** · Insurers ·
      Organisations · RVG codes · Modifier codes · List statuses · Xero & archiving. ("Permanent
      lists" keeps its label until Phase 30's rename.)
    - The selected view is read from and written to a `?view=` search param, so a profile page can
      link back to `?view=surgeons` or `?view=anaesthetists`.
    - **Anaesthetists:** add a Tier column (neutral pill from `TIER_LABELS`) and make the row open
      the anaesthetist record page (item 12); keep the row's "Edit" link and the "Add anaesthetist"
      button exactly as named (recipes click them).
    - **Hospitals & holidays:** each hospital card shows its contact email, or "No contact email" in
      mist; an "Edit" link opens `EditHospitalSheet`; `AddHospitalSheet` gains an optional contact
      email field after the name.
    - **Surgeons:** an editable table, Name · Specialty · Room · HPI CPN (mono) · Pairings (counts
      of active not-preferred and preferred entries, as small pills); a row opens the profile;
      "Add surgeon" opens `SurgeonEditSheet` (name, specialty, room, **HPI CPN (required)** with the
      helper line "The surgeon's unique number on the Health Provider Index, for example 12ABCD",
      and the NZ medical registration number, optional, "for information"); drop "view only in this
      prototype" from the subtitle.
    - **Surgeons' rooms:** Name · Contact email · Phone · Surgeons (the derived members as profile
      links); "Add room" and "Edit" open `SurgeonRoomSheet`, which says in one line that membership
      is changed from the surgeon.
    - **Surgeon groups:** Name · Members · Description; "Add group" and "Edit" open
      `SurgeonGroupSheet` (name, description, member checkboxes).
    - **Organisations** stays as it is (Phase 18 decides its fate).
11. **Surgeon profile page** (US-13.6.2; US-13.6.1 "the room's contacts are shown on the surgeon's
    profile"; US-13.6.3 and US-13.6.4 "Record a pairing, either direction", "Remove a pairing"):
    - **Route:** nest the `masters` route in `router.tsx` as an index plus `surgeons/:surgeonId` and
      `anaesthetists/:anaesthetistId`, each one child route (not `surgeons` > `:surgeonId`), so the
      route-relative `to=".."` of `RequireEntity` falls back to `/admin/masters` for an unknown id;
      a new `AdminSurgeonProfileRoute` in `apps/admin/routes.tsx` inside `RequireEntity`; check
      `sectionForPath` keeps Master data lit; the screen is `apps/admin/screens/SurgeonProfile.tsx`
      with a back link to `/admin/masters?view=surgeons`.
    - **Header:** name, specialty, the HPI CPN as a mono chip, and "Edit details" (opens
      `SurgeonEditSheet`).
    - **Identifiers card:** HPI CPN first, mono, captioned "Unique index on the Health Provider
      Index. Not the patient's NHI."; the NZ medical registration number, mono, "For information".
    - **Room card:** the room's name, contact email (as text; the mailto drafting is Phase 35's) and
      phone, and the room's other surgeons.
    - **Groups:** membership chips.
    - **Pairing preferences section**, a shared Admin component `PairingSection` (in
      `apps/admin/components/pairing/`, with a `perspective` prop of `'surgeon'` or
      `'anaesthetist'`, so both profiles show the same record):
      - one mist line under the heading: "Private to the office. Anaesthetists never see these.";
      - two groups of active entries, "Not preferred" and "Preferred" (from `PAIRING_LABELS`), each
        row the counterpart's name, the side sentence from `pairingSentence` (so either direction
        reads plainly), the reason or "No reason recorded", "Added by Kirsty W. on 10 Mar 2026", and
        an "End" action opening `PairingEndSheet` (the sentence, an optional end reason, confirm); an
        empty group says so in one mist line;
      - "Add pairing" opens `PairingAddSheet`: the kind (Not preferred or Preferred), the side as two
        radio options worded from `pairingSentence` ("Ms A. Reid asked" or "The anaesthetist asked"),
        the counterpart select (anaesthetists here, surgeons on the anaesthetist record), in which a
        counterpart that already has an active entry **on that side** is disabled with the reason,
        and an optional reason;
      - a collapsed "Ended entries" disclosure: each ended entry with its sentence, who ended it,
        when and why.
    - **Layout:** a proper desktop page (convention 16), sheets through `useSurface().Overlay`.
12. **Admin anaesthetist record page** (US-12.1.4 Admin side; US-13.6.3 "shows on both profiles";
    US-01.3.6 "Admin staff set each anaesthetist's priority tier on the anaesthetist's record"):
    - `/admin/masters/anaesthetists/:anaesthetistId`, `AdminAnaesthetistRecordRoute`, screen
      `apps/admin/screens/AnaesthetistRecord.tsx`, back link to `?view=anaesthetists`. Keep it
      lean: Phase 26 extends this page with the profile fields (bank details, GST number, prepaid
      settings), so build it as the Admin anaesthetist record, not a one-off.
    - **Header:** name, registration number, HPI CPN chip, "Edit details" (opens the existing
      `EditAnaesthetistSheet`, whose "HPI" line now reads "HPI CPN").
    - **Relabel the anaesthetist's field everywhere in Admin:** `AddAnaesthetistFlow`'s "HPI id
      (optional)" becomes "HPI CPN (optional)". It stays optional on the anaesthetist (US-12.1.4
      "HPI CPN ... where available"); only the surgeon's is required (US-13.6.2, its unique index).
      If a value is typed, it is stored through `normaliseHpiCpn` and must not already be held by a
      surgeon (the uniqueness rule of item 5 runs both ways).
    - **Priority tier card:** the current tier and a control to change it (Tier 1 to Tier 4 from
      `TIER_LABELS`, calling `setPriorityTier`), with two mist lines: "Only the office sees this. It
      orders the suggestions when you assign or move a List." and "Tier names are provisional."
      (drop the second if OQ-102 has been answered).
    - **Pairing preferences:** `PairingSection` with `perspective="anaesthetist"`.
13. **Admin cross-links:**
    - `ListDrawer`: the surgeon row links to the surgeon's profile, closing the drawer.
    - `EditAnaesthetistSheet`: a link "Open record" to the anaesthetist record page (the pairings
      and tier live there, not in the sheet).
    - Nothing on the mobile, web or PWA anaesthetist profile, List, Booking or colleague views (the
      privacy boundary, item 6).
14. **Playwright** (`npm run shots`): a new `aa-prototype/visual/admin-phase17.spec.ts` with
    `data-shot` hooks for:
    - the Surgeons table and the Surgeons' rooms table;
    - Ms A. Reid's profile (`/admin/masters/surgeons/S-REID`): the HPI CPN, the room and its other
      surgeon, the group chip, the Pairing preferences section with Dr Sharma under "Not preferred"
      (surgeon asked) and the "Ended entries" disclosure opened on the anaesthetist-side Hughes
      entry;
    - `PairingAddSheet` open on that profile, with the kind and side choices and Dr Sharma disabled
      on the surgeon side;
    - Dr Priya Sharma's anaesthetist record (`/admin/masters/anaesthetists/41267`, her id at `60e2d1e`): the tier
      card and both pairings (Reid not preferred, Whitford preferred);
    - EditListSheet on Dr Sharma's Tue 21 AM List with Ms Reid selected and the warning showing (a
      closed native select cannot be shot open, so shoot the selected "· not preferred" option plus
      the warning);
    - the reassign picker from Dr Chen's Tue 21 PM Christchurch Eye Surgery List (Ms Reid): Delaney
      and Strand in Tier 1, Hughes below them, Dr Sharma under "Not preferred with Ms Reid". Open the
      picker only; never confirm, because that consumes the S2 Beat 2 Free session;
    - the reassign picker from Dr Rutherford's Wed 22 AM List with a tier filter applied;
    - keep `admin-phase07.spec.ts`'s master-data shot passing.
15. **Finish green:** `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots`;
    `persistMigrate.test.ts` covers the bumped version; `pwaPurity.test.ts`, `domainPurity.test.ts`
    and the new `officePrivacy.test.ts` pass.

## Demo triggers

**None needed.** Everything here is office work done through normal Admin use: editing masters,
adding or ending a pairing on either profile, setting a tier, and picking a surgeon or an
anaesthetist. The seeded pairings (one not preferred, one preferred) and tiers show in Admin's
Reassign list and Edit list flows through normal use; reopening the Reassign list picker reshuffles
within a tier, deterministically from the seeded request key. Adding and ending a pairing are product
actions on the surgeon profile and the anaesthetist record. Nothing is automatic, scheduled or
external, and nothing is anaesthetist-facing (there is deliberately nothing to see on the PWA), so
there is no harness-bar entry and no PWA equivalent. Register nothing in Phase 14's registry and add
nothing to the Control Panel. The new routes are URL-addressable, so a later phase can scope a
trigger to them if one is ever needed.

## Out of scope

- **The anaesthetist's own List move and single-Booking move** (US-01.4.5, US-01.4.7): Phases 32 and
  32a. They show **no** warning and offer colleagues by availability alone, never grouped or
  tier-ordered; they must not call this phase's helper for the anaesthetist's view. Nothing here is
  for them to reuse except the privacy boundary.
- **The Draft List assignment path** of US-01.3.5 and US-01.3.6: Phase 31 wires
  `AnaesthetistCandidates` and the warning.
- **The availability finder** (US-01.4.2) and the Slot-based reassign: Phase 28, on the same helper.
- **Preferences as a Booking warning.** FT-13.7's routine (Phase 15a) checks Bookings; a pairing
  preference is an assignment-time check on a List. Register no warning rule, and post nothing to
  the to-do list or the notification pool.
- **Preferred pairings changing the order** of candidates: marked only (an inference the room did
  not make; logged for the owner).
- **The surgeon group as a contract holder:** Phase 18.
- **Using the contact emails:** the update email (Phase 35, manual only per OQ-82) and the
  missing-NHI email to the rooms (Phase 40). The rooms no longer send estimated durations (OQ-38).
- **Deleting or deactivating** surgeons, rooms, groups or hospitals, spreadsheet loads (including
  preferences and tiers), and editable insurers: Phase 42.
- **The "recurring booking" rename** of Permanent Lists in copy: Phase 30.
- **Existing Lists that already pair a not-preferred anaesthetist and surgeon:** not re-flagged on
  the Day grid; the warning fires at assignment.
- **A surgeon in more than one room, several contacts per room, or an actor-and-role model:** one
  room, one email and phone, derived surgeons (Greg left the shape to the developers).
- **HPI CPN check-character validation, register lookup and the anaesthetist's own HPI CPN on their
  profile:** Phase 40a (and 26 for the profile field).
- **The anaesthetist's bank details, GST number and prepaid settings** (DM-32's anaesthetist
  profile): Phase 26, on the record page built here. **The start date:** Phase 28.

## Manual test checklist

The agent runs every item itself in the running app and reports it with evidence; none is handed
to the owner (ROADMAP.md "Owner review: agents test themselves").

- [ ] Admin, Master data:
  - Surgeons lists every seeded surgeon with a room, an HPI CPN and pairing counts;
  - Surgeons' rooms shows each room's email, phone and derived surgeons;
  - Surgeon groups shows Canterbury Orthopaedic Surgeons with Mr T. Hale;
  - Hospitals & holidays shows a contact email on every seeded hospital;
  - Anaesthetists shows a Tier column; unseeded anaesthetists read Tier 4.
- [ ] Add a surgeon with a room and an HPI CPN typed in lower case: it appears in Surgeons
  (upper-cased) and in that room, and Audit shows "Surgeon added" by Kirsty W. with an "HPI CPN" row.
- [ ] Adding a surgeon with no HPI CPN, a malformed one, or Dr Sharma's (`12SHAP`) is refused with a
  plain message naming the problem.
- [ ] Editing a room's email to an implausible value is refused; a valid edit saves and appears in
  Audit with before and after.
- [ ] Edit a hospital's contact email: it shows on the card and in Audit ("Hospital updated").
- [ ] Ms A. Reid's profile, opened from the Surgeons table:
  - the HPI CPN beside the name and on the identifiers card, the registration number marked "For
    information";
  - the room's email and phone, and Mr J. Whitford as a room colleague; group chips;
  - Pairing preferences: "Private to the office" line; Dr Sharma under "Not preferred" with "Ms A.
    Reid prefers not to work with Dr Priya Sharma" and her reason; the Hughes entry under "Ended
    entries" with "Dr Rawiri Hughes prefers not to work with Ms A. Reid";
  - the back link returns to the Surgeons view.
- [ ] Dr Priya Sharma's anaesthetist record: her tier; Ms Reid under "Not preferred" and Mr
  Whitford under "Preferred", each with its side sentence; the same entries as on the surgeon
  profiles. Change her tier: it saves, shows in the Anaesthetists table, and Audit shows "Priority
  tier changed". Restore it.
- [ ] Add a pairing from the anaesthetist record (Preferred, the anaesthetist asked, a surgeon): it
  appears at once there and on that surgeon's profile. Audit shows "Pairing preference added" with
  "Asked by". End it with a reason: it moves to "Ended entries" on both pages, and Audit shows
  "Pairing preference ended".
- [ ] On Ms Reid's add sheet, Dr Sharma is disabled for "Ms A. Reid asked" but open for "The
  anaesthetist asked". Add that side (Not preferred): accepted, and the Edit list warning for the
  pair now says each has asked not to be paired. End it again.
- [ ] Day view, Tue 21 July, Dr Priya Sharma's PM Free List, **Book (phone advice)**:
  - the surgeon picker shows Ms Reid in a separate "Not preferred with Dr Sharma" group, and Mr T.
    Hale in the main group;
  - choosing Ms Reid shows the amber warning naming both people and the side, with the reason, and
    the button reads "Continue anyway"; switching back to Hale clears it;
  - the scripted S2 Beat 2 (St George's, Hale, Look up, Save) runs exactly as before.
- [ ] **Edit list** on Dr Sharma's Tue 21 AM List: Ms Reid warns, "Save list anyway" saves, the
  List's History shows "Not preferred pairing assigned (warning acknowledged)", and a following
  notes-only edit does not repeat it.
- [ ] **Reassign list** from Dr Chen's Tue 21 PM Christchurch Eye Surgery List (Ms Reid):
  - the clear group lists Tier 1 candidates before the Tier 3 one (Hughes), each with a tier pill;
  - Dr Sharma sits under "Not preferred with Ms Reid", still clickable, with a warning pill;
  - close and reopen the picker a few times: same-tier candidates change order, and no one crosses
    a tier; Reset, then repeat: the same sequence of orders replays;
  - the tier filter narrows both groups;
  - choosing Sharma warns on the confirm step and "Confirm reassignment anyway" succeeds, with the
    acknowledgement in the List's History; Reset afterwards (this uses Sharma's S2 Beat 2 Free
    session).
- [ ] S2 Beat 3 (Rutherford Wed 22 AM to Sharma): candidates in tier order, Sharma in the clear group
  with a Preferred pill, no warning, and the reassignment runs as before.
- [ ] Permanent list sheet: choosing a not-preferred usual surgeon for that anaesthetist warns and
  saves anyway.
- [ ] Changing `PAIRING_LABELS` and `TIER_LABELS` locally (for example "Avoid", "Gold") renames every
  picker group, pill, warning, profile section, sheet, tier control and audit label in one edit
  (then revert it).
- [ ] **Privacy:** as Dr Sharma on the mobile app, the web app and the PWA (profile, Lists, a
  Booking, its History, colleague availability), no pairing, side, reason, tier or warning shows
  anywhere, and the colleague list is not tier-ordered; `officePrivacy.test.ts` passes.
- [ ] The Day grid and every seeded List look identical to before the phase (the canvas is
  unchanged).
- [ ] No en or em dash in new copy, no "blacklist" or "whitelist" anywhere in the app, and no
  crimson on any new control, pill or warning.
- [ ] Catalogue screenshots: the recipes for US-13.6.1, US-13.6.2, US-13.6.3, US-13.6.4, US-01.3.5
  and US-01.3.6 are created or updated as the table below says, the recipes this phase broke are
  re-pointed, a full `npm run capture` ends with no failed recipe and no story without a recipe, the
  covered items' new shots are checked by eye, and `npm run verify:board` is green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots` and
  `npm run verify:board` are all green.

## Demo guide updates

In the same session, following the ROADMAP's rule that each phase patches the beats it touches:
- `docs/demo-guide/03-demo-script.md`:
  - **S2 Beat 3 (illness cover, reassign a whole List):** the beat this phase changes. Update the
    **Click** line (Reassign list now shows candidates in tier order with tier pills, Dr Priya Sharma
    in the clear group with a Preferred pill; pick her by name, since the order within a tier
    varies), the **Expected** line (the grouped, tier-ordered picker, no warning for Sharma, then the
    unchanged success and History), and add a **Say** line: "The office's private knowledge is now
    data: who works well with whom, either way round, and the directors' priority tiers. It orders
    the suggestions, shuffled within a tier so no one is always on top. Only the office ever sees
    it." Add an optional pointer: open the tier filter, or show the Chen Tue 21 PM List's picker with
    Sharma apart under "Not preferred with Ms Reid" (open only; never confirm).
  - **S2 Beat 2:** add an optional pointer: on the surgeon picker, show the "Not preferred with Dr
    Sharma" group and, if time allows, select Ms Reid to show the soft warning, then return to Mr T.
    Hale. The scripted path is unchanged.
  - **S2 Discovery points:** add OQ-102 (names for the pairings and tiers) and whether preferred
    pairings should also lift a candidate within their tier; drop any OQ-43 or "blacklist" wording.
  - **Direct URLs:** add Surgeon profile `/admin/masters/surgeons/<surgeonId>`, Anaesthetist record
    `/admin/masters/anaesthetists/<anaesthetistId>`, and Master data views
    `/admin/masters?view=surgeons`.
- `docs/demo-guide/04-presenter-cheat-sheet.md`: one line for surgeon profiles (HPI CPN as the
  unique index, rooms, groups) and one for pairing preferences and tiers (on both profiles, admin
  only, warns never blocks, tier order shuffled within a tier, the seeded Reid and Sharma, Whitford
  and Sharma pairings).
- `docs/demo-guide/02-workflows-and-handoffs.md`: under the office's master-data work, rooms, surgeon
  groups, hospital contact emails, pairing preferences and tiers are maintained in Admin;
  anaesthetists never see preferences or tiers, and their own hand-on of a List gets no warning.
- `docs/demo-guide/01-personas-and-responsibilities.md`: if the office persona lists what Kirsty or Vanessa maintain, add
  the pairings and tiers; remove any "blacklist" wording.
- `docs/demo-guide/master-demo-guide.html`: mirror the S2 Beat 2 and Beat 3 edits, the discovery
  points, the Direct URLs table, the cheat-sheet lines and the workflows note, word for word.
- **Control Panel scenario text** (`apps/demo/DemoControlPanel.tsx`, the S2 blurb): if it lists Beat
  3's content, add "tier-ordered cover suggestions"; otherwise no change.
- Not a milestone phase: no full consistency read, but check the patched sections of the master
  guide match the run sheet word for word, and grep the guide for "blacklist".

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19),
run after the review pass and before the PROGRESS.md entry. Re-run
`node docs/prototype-build/catch-up/tools/recipe-status.mjs 17` first: earlier phases may have
changed these recipes since this plan was written.

**Covered items.** When the phase is done, each recipe in `requirements-board/capture/recipes/`
matches what was built (all Admin only: the stories forbid a mobile or web shot of preferences or
tiers):

| Item | Recipe at plan time | When this phase is done |
|---|---|---|
| [US-13.6.1](../../../../requirements-board/requirements/stories/US-13.6.1.md) Surgeons' rooms master record (Confirmed) | absent · placeholder, no shots | `captured`. Admin shots: `surgeons-rooms` (Master data, "Surgeons' rooms" tab: name, contact email, phone and the derived Surgeons column), caption "Each room holds its contact email, phone and surgeons"; and a `room-card` state on `/admin/masters/surgeons/S-REID` highlighting the Room card with Mr J. Whitford. Add a `SurgeonRoomSheet` state if it fits. No caption mentions estimated durations |
| [US-13.6.2](../../../../requirements-board/requirements/stories/US-13.6.2.md) Surgeon profile (Confirmed) | absent · placeholder, no shots | `captured`. Admin shots: `surgeons-table` (Room, HPI CPN and the pairing counts), and `surgeon-profile` at `/admin/masters/surgeons/S-REID` with states `profile` (HPI CPN chip, Identifiers card with the registration number "For information", room card, group chip, the Pairing preferences section) and `edit` (`SurgeonEditSheet` with the required HPI CPN). Caption "One identified record per surgeon, keyed on the HPI CPN, with private pairings only the office sees" |
| [US-13.6.3](../../../../requirements-board/requirements/stories/US-13.6.3.md) Not-preferred pairings (Confirmed) | absent · placeholder, no shots | `captured`. Admin shots: `pairings-surgeon` on `/admin/masters/surgeons/S-REID` with states `active` (Dr Sharma under "Not preferred", "Ms A. Reid prefers not to work with Dr Priya Sharma", the "Private to the office" line), `ended` (the "Ended entries" disclosure on the anaesthetist-side Hughes entry) and `add` (`PairingAddSheet`, kind and side choices, Sharma disabled on the surgeon side); `pairings-anaesthetist` on Dr Sharma's record showing the same entry from her side; and `reassign-apart` (Dr Chen's Tue 21 PM List, Sharma under "Not preferred with Ms Reid", open only). Caption "A private record, either way round, on both profiles; it informs the office and never blocks". No caption says "blacklist" |
| [US-13.6.4](../../../../requirements-board/requirements/stories/US-13.6.4.md) Preferred pairings (Verify; new) | none (create it) | Create the recipe, `captured`. Admin shots: `preferred-profile` (Dr Sharma's record: Mr Whitford under "Preferred" beside Ms Reid under "Not preferred") and `preferred-picker` (Dr Rutherford's Wed 22 AM List, Reassign list: Sharma with a Preferred pill in the clear group). Caption "The office sees who works well together as well as who does not" |
| [US-01.3.5](../../../../requirements-board/requirements/stories/US-01.3.5.md) Not-preferred pairing warning when assigning or moving a List (Confirmed) | absent · placeholder, no shots | `partial`. `absentReason`: "The warning and the separated group work when the office assigns a List in a session (Edit list, phone advice booking, Permanent List) and when it reassigns a List. Assigning a Draft List does not exist yet; Phase 31 builds that picker and adds its shot." Admin shots: `edit-list-warning` (Dr Sharma's Tue 21 AM List, the "Not preferred with Dr Sharma" group, "Ms A. Reid · not preferred" selected, the amber warning naming the side, "Save list anyway") and `reassign-warning` (Dr Chen's Tue 21 PM List, Sharma chosen from "Not preferred with Ms Reid", the confirm step's warning and "Confirm reassignment anyway"; shoot without confirming). Caption "A not-preferred pairing is grouped apart and warns the office, it never blocks". Phase 31 turns it `captured` |
| [US-01.3.6](../../../../requirements-board/requirements/stories/US-01.3.6.md) Anaesthetist priority tiers (Verify; new) | none (create it) | Create the recipe, `partial`. `absentReason`: "Tiers are set on the anaesthetist record and order, shuffle and filter the office's Reassign list picker. The availability finder (Phase 28) and Draft List assignment (Phase 31) reuse the same ordering." Admin shots: `tier-record` (Dr Sharma's record, the tier card with "Only the office sees this"), `tier-order` (Dr Rutherford's Wed 22 AM List, Reassign list: Tier 1 candidates first, tier pills) and `tier-filter` (the same picker filtered to one tier). Caption "Cover suggestions ordered by tier, shuffled within a tier, seen only by the office" |

**Recipes this phase breaks.**
- `US-13.4.1` (also Phase 42's): its `surgeons` state clicks `role=button[name="Surgeons"]` and is
  captioned "Master data, surgeons (view only)". The new tabs "Surgeons' rooms" and "Surgeon groups"
  also match a substring click; make it exact (`role=button[name="Surgeons"s]` or a `data-shot`
  hook), re-caption it (editable surgeons with room and HPI CPN), and update its `absentReason`
  (surgeons and surgeon groups no longer view only or missing; insurers, organisations and the rest
  still view only until Phase 42).
- `US-12.1.1`, `US-12.1.2`, `US-12.1.4` (Anaesthetists view): the table gains a Tier column and the
  row opens the record page; their clicks (`tr:has-text("Souter") >> text="Edit"`, "Add
  anaesthetist") must still hit the Edit link and the button, not the row. Check by eye.
  Re-caption `US-12.1.4`'s `add` state ("... contact and HPI") to "... contact and HPI CPN", the
  label the sheet now shows.
- `US-01.4.1` (reassign): the picker is now grouped and tier-ordered with a shuffle; its click on
  `text="Hughes, Rawiri"` still matches (keep the row's surname-first name), and "Confirm
  reassignment" still matches. Re-caption "Choose an anaesthetist whose session is free" to say the
  list is in tier order.
- `US-04.4.1` (add hospital) is Retired at `60e2d1e`; if its recipe still runs, keep the hospital
  name the first field of `AddHospitalSheet` so it does not fail, and leave its retirement to the
  board and Phase 18.
- Other recipes that open `/admin/masters` (`FT-13.4`, `US-04.1.1`, `US-04.1.2`, `US-04.2.1`,
  `US-05.1.1` and similar) and the List-drawer and Edit-list recipes (`US-01.3.1`, `US-01.3.2`): the
  split into `masters/`, the `?view=` param and the grouped surgeon select keep their tab and
  button names, so the `--dry` run is the check. Re-point any that fail.

**ATLAS.md.** Routes (`/admin/masters?view=...`, `/admin/masters/surgeons/:surgeonId`,
`/admin/masters/anaesthetists/:anaesthetistId`), Personas and IDs (surgeon ids such as `S-REID`, the
seeded `PP-` entries, room and group ids, the seeded tiers), Seed data (the Reid and Sharma, Hughes
and Reid, Whitford and Sharma pairings), Overlays (the new Admin sheets) and Existing hooks (the
Phase 17 `data-shot` hooks).

## Adversarial review (after build)

Once the manual test checklist and `npm run build`, `npm run build:pwa`, `npx vitest run` and
`npm run shots` are green, and before writing the PROGRESS entry, run the standard **adversarial
review-and-fix pass (PROGRESS convention 18)**: three independent Opus review subagents (quality,
bugs/correctness, plan adherence) with the catalogue files, this doc and the diff; this session
independently verifies every finding, fixes the confirmed ones (with a test wherever a bug had none),
re-greens, and records the pass; nothing already settled in the Decisions log is re-raised.

**Steer this phase's reviewers at:**
- **Privacy is the point.** No file under `apps/mobile`, `apps/web`, `pwa/`, `shell/` or `shared/`
  (outside the audit labels) reads `officePrivate`, a pairing or a tier; the PWA closure never
  reaches `store/officePrivate.ts`; tiers are not on the `Anaesthetist` record; no anaesthetist-app
  history renders a pairing or tier audit entry; an anaesthetist actor's store writes never read,
  check or log preferences; the anaesthetists' colleague lists are not tier-ordered.
- **Never a block.** No store action or UI path refuses, disables or hides a not-preferred option on
  an office path. It is grouped, labelled, selectable and warned before save, on every picker in
  item 9.
- **One rule, one place.** Every grouping, ordering, shuffle and warning goes through
  `src/domain/pairingPreferences.ts`; no inline pairing checks or sorts in the sheets or store
  actions. That is what lets Phases 28 and 31 reuse it.
- **One name set, one place.** Every user-facing kind and tier word builds from `PAIRING_LABELS` and
  `TIER_LABELS`; no "blacklist" or "whitelist" anywhere; the side wording comes from
  `pairingSentence` alone.
- **Determinism.** The shuffle uses `mulberry32` keyed on the List id and the stored request counter:
  no `Math.random`, no wall clock; the same key gives the same order; Reset replays; tiers never
  cross.
- **Model shape.** Room membership has one source (`Surgeon.roomId`); every entry carries `kind` and
  `raisedBy`; either side's active not-preferred entry groups and warns; not preferred wins over
  preferred; both sides of one pair can be active; a duplicate or contradictory entry is refused
  only on the same side; the tier default is Tier 4 with no entry; surgeon groups do not replace
  `organisations`; `Hospital.contactEmail` round-trips.
- **HPI CPN is one identifier and a unique index.** One required `hpiId` labelled "HPI CPN"
  everywhere; stored normalised; refused when blank, malformed or already held by any surgeon or
  anaesthetist; never presented as the patient NHI.
- **History is kept.** Ending never deletes; re-adding creates a new entry; each add, end, tier
  change and acknowledged assignment is audited once with before and after; a notes-only List edit
  does not re-log the acknowledgement.
- **Seed hygiene.** The generated canvas is unchanged; the seeded not-preferred pairing collides with
  no seeded List or S2 path; seeded HPI CPNs are unique; `PERSIST_VERSION` is bumped.
- **Design and copy.** Warning tint for the warning, never error red; teal-only actions; crimson
  unused; no en or em dashes; no new "permanent list" wording; sheets through
  `useSurface().Overlay`; the profile and record are real desktop pages.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry; ROADMAP.md "Owner review: agents test
  themselves"): the D36 names (Not preferred, Preferred, Tier 1 to Tier 4, Tier 4 the default, the
  "provisional" line) pending OQ-102; tiers ordering within each group (the assumed combination);
  preferred pairings marked, not lifted; the shuffle keyed on a per-open counter; tiers held off the
  anaesthetist record for privacy; the seeded tiers (which five are the directors); Vanessa's
  provisional tier names (Gold Elite, Gold, Silver, Bronze, US-01.3.6) as the one-edit alternative to
  D36's Tier 1 to Tier 4; the privacy limit of an in-browser backend (the seeded slice ships in every
  build's store, never read by an anaesthetist screen; a real server enforces it); and the screens
  worth a look with route and persona (Ms Reid's profile, Dr Sharma's record, Reassign list from
  Chen Tue 21 PM and Rutherford Wed 22 AM).
- **Catalogue screenshots result:** the recipes filled in or created (US-13.6.1 to US-13.6.4,
  US-01.3.5, US-01.3.6) and changed (US-13.4.1, US-01.4.1 and any re-pointed), the
  `requirements-board/capture/REPORT.md` counts before and after, and the partial reasons handed to
  Phase 31 (US-01.3.5) and Phase 28 (US-01.3.6).
- **Status row** for catch-up Phase 17, and a phase entry with the drift-check result against
  `60e2d1e` (OQ-43 answered, OQ-102 status), the session split, what was built, the `PERSIST_VERSION`
  bump, tests added and the review pass.
- **Decisions log:**
  1. One room per surgeon (`Surgeon.roomId` required, members derived).
  2. The surgeon's HPI CPN is one required `hpiId`, shared in name and label with the
     anaesthetist's, unique across practitioners, shape-checked only; "HPI id" becomes "HPI CPN".
  3. Pairing preferences (OQ-43 answered, D44): one model with `kind` and `raisedBy`, kept by the
     office on both profiles, in an office-only state slice enforced by `officePrivacy.test.ts`;
     not preferred warns and never blocks, and going ahead writes `*.pairingAcknowledged` (a new,
     cheap rule); preferred is marked only; nothing anaesthetist-facing, and no warning on an
     anaesthetist's own hand-on (US-01.4.5).
  4. Priority tiers (US-01.3.6, D36): four, held in the office slice keyed by anaesthetist, Tier 4
     the default with no entry; candidates grouped by not preferred, ordered by tier within each
     group, shuffled within a tier from `mulberry32` keyed on the List and a per-open counter.
  5. Surgeon groups are a new master beside `organisations`; Phase 18's COS rooms holder links to
     `SG-COS`.
  6. The reassign picker counts as "moving a List" for US-01.3.5 and "cover" for US-01.3.6.
  This phase supersedes no July ruling; it extends the Phase 06 advisory reading (amber, never a
  hard block).
- **Handoff notes:**
  - For **18**: `surgeonRooms`, `surgeonGroups` and `SG-COS` are ready for its holders to link to
    (the COS rooms holder links to `SG-COS`); `organisations` and the COS Contract are untouched.
  - For **26** and **40a**: the anaesthetist record page (`/admin/masters/anaesthetists/:id`) is
    where 26 adds the profile fields; the HPI CPN shares the field and the label;
    `normaliseHpiCpn` and `isPlausibleHpiCpn` are in `src/domain/surgeons.ts`.
  - For **28**: the availability finder and the Slot-based reassign use `AnaesthetistCandidates`
    and `rankAnaesthetistCandidates` (groups, tier order, shuffle, filter) and keep the
    `reassignList` acknowledgement; the anaesthetists' own availability views stay untiered.
  - For **30**: the Permanent List sheet has "Save anyway" and "Add anyway"; keep them when renaming
    to recurring bookings.
  - For **31**: the Draft List picker uses `AnaesthetistCandidates`, `NotPreferredWarning` and the
    acknowledgement in `assignDraftList`, and checks US-01.3.5 "Every office path" and US-01.3.6
    there.
  - For **32** and **32a**: no warning, no grouping and no tier order on an anaesthetist's own move
    (US-01.4.5, US-01.4.7); never import `store/officePrivate.ts` or the pairing helper into a
    mobile, web or PWA flow (the privacy test will fail); the moving anaesthetist's store path must
    not log an acknowledgement.
  - For **35**: the room email is the To address for a Booking change and the hospital contact email
    for a cover change.
  - For **40**: the room is who the office emails about a missing NHI.
  - For **42**: no delete or deactivate yet; loader targets for rooms, surgeons (HPI CPN as the match
    key), groups, and possibly preferences and tiers.
  - For **43**: the generator gives every anaesthetist a tier and a few pairings through the same
    module.
