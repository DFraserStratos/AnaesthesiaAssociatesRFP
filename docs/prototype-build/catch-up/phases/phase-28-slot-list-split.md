# Phase 28 · Slot and List split

**Requirements covered:**
[FT-01.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-01.2.md) Slot availability status ·
[US-01.2.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.2.3.md) Status is independent of bookings ·
[US-01.3.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.3.3.md) Manual List assignment ·
[US-01.1.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.1.4.md) Slot default times ·
[DM-02](../analysis/domain-model-delta.md#dm-02) Slot, List and Draft List are three things (the Slot and List half; Draft List is Phase 31) ·
[DM-04](../analysis/domain-model-delta.md#dm-04) Slot availability held on the Slot, independent of bookings (the model half; the editable status master is Phase 29) ·
[RV-14](../analysis/reverse-check.md#rv-14-list-status-mixes-availability-with-booking-type-empty-slot-modelled-as-a-list) List status mixes availability with booking type; empty Slot modelled as a List.
Read alongside (not closed here):
[EP-01](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/EP-01.md),
[FT-01.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-01.1.md) and
[US-01.1.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.1.1.md) (two Slots per anaesthetist per day, already met by the canvas),
[FT-01.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-01.3.md) and
[US-01.3.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.3.1.md) (the pairing rule: Phase 31),
[US-01.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.4.1.md) (reassign: its technical discussion is the mechanism this phase builds),
[US-01.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.2.1.md),
[US-01.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.2.2.md) and
[US-01.5.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.5.3.md) (Phase 29),
[OQ-17](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-17.md),
[OQ-27](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-27.md), and the
"Slot, List and Draft List" section of [domain-model.md](../../../discovery-reference/Updated%20Requirements/domain-model.md).
**Depends on:** 14 (the demo-trigger registry, `useDemoTriggerContext`, `OFFICE_SIMULATION_ACTOR` in `store/demoActors.ts`, `store/officeStandIn.ts` and the PWA sheet `src/pwa/PwaDemoActions.tsx`) and 15 (Booking vocabulary: `bookingsForList`, `createBooking`, `schedule.bookings`). By the roadmap order 16 to 27 have also run; if 17 has, reuse its blacklist helper and `SurgeonSelect` in every picker this phase rewrites. First phase of the Schedule track; 29 to 32 build on it.
**Estimated:** 2 sessions, and full ones: this is the largest structural change on the schedule side. Session 1 is the model, store and seed with every reader re-pointed (work items 1 to 12), re-greened and demoable with no visible change except the fixed behaviours. Deleting `listForSlot`, `List.statusKey` and `ListPatch`'s times forces a minimal re-point of the drawer, phone advice, Edit list and Reassign in session 1 (work item 12, "compile-forced minimums"); session 2 finishes them. Session 2 adds the new office flows, the settings editor, the stand-in trigger and the demo guide (work items 13 to 23). If session 1 runs long, keep the golden test and the green gate and move the README paragraph (23) and the capture-recipe edits (22) to the end of session 2 rather than cutting tests.

## Goal

The catalogue separates three things the prototype welds into one. A **Slot** is the AM or PM
half-day every active anaesthetist has on every day of the canvas, and it can be empty. A **List**
is assigned to an anaesthetist, sits in exactly one Slot and holds Bookings. A Draft List is a List
not yet assigned to anybody (Phase 31). Today an empty Slot *is* a List (`statusKey: 'free'`,
`state: 'DRAFT'`), the List id is derived from the Slot, and one six-value `statusKey` mixes
availability (free, unavailable, holiday) with what is booked (private, public, pre-op). The admin
grid then paints a phone-booked Free List as Private while both anaesthetist apps still say Free.

This phase introduces:

- a **Slot** record for each anaesthetist, day and session, with a deterministic id
  (`S-<reg>-<date>-<AM|PM>`), holding the Slot's **availability**, an optional note, optional
  start and end time **overrides** and (until Phase 32) the cover marker;
- the **List** as its own record with a `slotId` and a `kind` (private, public, pre-op), created only
  on assignment: by the office (**Assign List**, which requires a surgeon and a hospital, or
  **Book (phone advice)**, which assigns and then adds a Booking), or by the Permanent List
  projection when the canvas is generated;
- a **displayed status derived from the Slot's availability plus the kind of any List in it**, never
  from bookings, computed by one pure function and read identically by mobile, web and admin. The
  six-colour design language stays, because the derived key is the same six keys;
- **one settings record** for the default AM and PM start and end times, editable by the office, with
  per-Slot overrides;
- **Reassign** as a move of the List between Slots: the List keeps its id, Bookings and history, the
  target Slot must be empty and available, and the vacated Slot returns to available unless the
  office marks it otherwise.

Every reader is re-pointed: the canvas generator, the clock roll-forward, selectors, the Admin Day
grid and drawer, the mobile schedule and availability screens, the web Lists, week strip,
availability grid and dashboard, the Phase 14 registry and the demo inspector. Empty Slots stop
carrying an approval state, which settles the "DRAFT" label collision. `PERSIST_VERSION` is bumped.

## Before you start: drift check

1. Diff the covered and read-alongside items against the plan's snapshot:

   ```
   git diff 1f067a8 -- "docs/discovery-reference/Updated Requirements/catalogue/requirements/FT-01.2.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-01.2.3.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-01.3.3.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-01.1.4.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/EP-01.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/FT-01.1.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/FT-01.3.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-01.1.1.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-01.3.1.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-01.4.1.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-01.2.1.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-01.2.2.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-01.5.3.md" "docs/discovery-reference/Updated Requirements/catalogue/questions/OQ-17.md" "docs/discovery-reference/Updated Requirements/catalogue/questions/OQ-27.md" "docs/discovery-reference/Updated Requirements/catalogue/questions/OQ-44.md" "docs/discovery-reference/Updated Requirements/domain-model.md"
   ```

   Also run the whole-catalogue diff from ROADMAP.md "When the catalogue changes" and scan it for new
   items that name Slot, List, availability or default times. (At plan time, 2026-09-30, the catalogue
   had no diff against `1f067a8`.)
2. If an item changed, re-read it and adjust the work items. Things to look for:
   - **FT-01.2 / US-01.2.3** (both Proposed): if either is now Retired or Future, keep the Slot record
     (DM-02 still needs it) but drop the "independent of bookings" tests' requirement link and note it.
   - **US-01.3.3**: if manual assignment no longer requires a surgeon (for example "surgeon or
     hospital"), relax the Assign List validation to match.
   - **US-01.1.4**: if default times become per hospital or per anaesthetist, the settings record in
     work item 5 takes that shape instead.
   - **US-01.4.1**: if the vacated-Slot default changes from "returns to available", change the
     reassign default to match.
   - **domain-model.md** "Slot, List and Draft List": if the hierarchy or the Slot's contents change,
     stop and re-plan work items 2 to 4 before building.
   - Any covered item now Retired or Future leaves the covers; record that in the PROGRESS entry.
3. **Open questions** (the ROADMAP "Confirm before building" row for 28):
   - **OQ-17** (the status vocabulary) and **OQ-27** (is List status the same thing as the
     anaesthetist availability calendar) are Open at `1f067a8`. If still open, build this safe interim
     and label it provisional:
     - Slot availability keeps today's three values (`available`, `unavailable`, `holiday`, shown as
       Free, Unavailable and Holiday or On leave as today). Phase 29 adds "available for emergency" and
       makes the status set editable master data.
     - The List's `kind` keeps the p.17 booking values (private, public, pre-op). This is OQ-27's
       Model B reading for the List and its Model A reading for availability (held on the Slot, not
       merged into the List). Both are compatible with either answer at the model level, because the
       displayed key is derived and the Slot and List stay separate records.
     - The Admin "List statuses" master view carries the line "Provisional: AA to confirm the status
       set (OQ-17, OQ-27)".
     If either is answered, follow the answer: a Model A ruling changes nothing structural here; a
     Model B ruling that keeps a separate availability calendar is Phase 29's job, and this phase's
     Slot availability becomes the reconciled projection of it.
   - **OQ-44** (Draft List contents) does not gate this phase. Do not add Draft Lists here.
4. **Check the neighbours:**
   - Phases 14 and 15 are DONE (look for `src/shared/demoTriggers/`, `useDemoTriggerContext`,
     `OFFICE_SIMULATION_ACTOR` in `src/store/demoActors.ts`, and `schedule.bookings` / `bookingsForList`). If 15 has not run, stop:
     this phase is written against the Booking names.
   - Whether Phase 17 is DONE (`src/domain/blacklist.ts`, `SurgeonSelect` and `BlacklistWarning` in
     `src/shared/schedule`). If it is, the Assign List sheet, the phone-advice step and the reassign
     picker use them exactly as 17 wired `EditListSheet`, `PhoneAdviceBooking` and `ReassignListFlow`.
     If it is not, use plain selects and leave a handoff note for 17.
   - Note the current `PERSIST_VERSION` (13 at plan time; phases 15 to 27 raise it).
5. Record the drift-check result in the PROGRESS entry.

## Reference

**Design files (convention 17).** The six status colours do not change; this phase changes where
the key comes from, not what it looks like.

- `docs/design/Design Language.dc.html`: the six status colours with tint and on-tint, the dashed Free
  and hatched Unavailable treatments, the warning tint for conflict flags, radii, the sheet motion.
  Teal `#0D6E63` for Assign List, Save and Confirm; crimson never.
- `docs/design/Admin Day.dc.html`: the day grid (block anatomy, dashed Free block with its "open for
  cover" subtitle, merged full-day leave block), the right-hand drawer and the header summary line.
  The empty-Slot drawer extends the List drawer's anatomy (header, sections, action row); it is not a
  new pattern.
- `docs/design/Mobile App.dc.html` and `docs/design/Mobile Availability.dc.html`: the Forward Lists
  rows (booked, Free "Offer cover", leave) and the availability strip with "My availability".
- `docs/design/Web Dashboard.dc.html` and `docs/design/Web Availability.dc.html`: the week strip
  (dashed Free block, merged holiday block), "Who's free", and the availability grid cells.
- No mockup covers the Session times editor or the Assign List sheet. Extend the Admin master-data
  table and sheet patterns (`useSurface().Overlay`, `FieldLabel`, the Phase 17 sheets).

**Catalogue items:** the four covered files above; read EP-01, FT-01.3, US-01.3.1 and US-01.4.1 for
the rules this phase must not break or pre-empt. US-01.1.4's second sentence ("a booking that runs
all day simply uses both the AM and PM Slot") is already true: there is no all-day type, and the
grid's merged full-day leave block is display only.

**Analysis files:**

- `docs/prototype-build/catch-up/gaps.json`: items `FT-01.2`, `US-01.2.3`, `US-01.3.3`, `US-01.1.4`;
  `dataModelDeltas` DM-02 and DM-04; `reverseFindings` RV-14.
- `docs/prototype-build/catch-up/epics/EP-01.md`: the header note (the structural notes, the "DRAFT"
  collision, the S2 impact list) and the four covered sections, plus US-01.3.1, US-01.5.4 and
  US-01.2.1 for what is deliberately left to 29 to 31.
- `docs/prototype-build/catch-up/GAP-ANALYSIS.md`: theme 4 (Slot, List and Draft List) and the DM-02,
  DM-04 and RV-14 rows.
- `docs/prototype-build/catch-up/analysis/domain-model-delta.md` (DM-02, DM-03, DM-04, DM-05) and
  `reverse-check.md` (RV-14, RV-15).
- `docs/prototype-build/catch-up/analysis/prototype-map-store-seed.md` (sections 2, 6, 7 and 9),
  `prototype-map-domain.md` (the `List`, `PermanentList`, availability and status types),
  `prototype-map-shared.md` (`format.ts`, `ListRow`, `StatusLegend`, `RequestCoverSheet`, the audit labels),
  `prototype-map-admin.md` (Day grid, ListDrawer, EditListSheet, PhoneAdviceBooking,
  ReassignListFlow, Master data), `prototype-map-apps-mobile-web.md` (Forward Lists, Availability,
  web Lists, WeekStrip, Availability grid, Dashboard, the "Session model" notes) and
  `prototype-map-shell-demo-pwa.md` (section 7, the PWA, and section 9, extension points).
- `requirements-board/capture/ATLAS.md` and the recipes for US-01.x: they hard-code List ids,
  `[data-testid=admin-list-drawer]` and the "open for cover" text (work item 22).

**Code entry points** (paths under `aa-prototype/src/`; names follow Phase 15's Card to Booking rename map, so where a file kept its old name, use that):

- **Model:** `domain/types.ts`: `List` (L~301), `ListStatusKey` and `LIST_STATUS_KEYS` (L53),
  `CoverRequest` (L277), `PermanentList` (L575), `AnaesthetistAvailability` (L593), `ListStatus`
  master row (L610); `domain/statusKeyParity.test.ts`; `theme/statusColours.ts` (`StatusKey`,
  `STATUS_ORDER`, stays as is).
- **Generator and seed:** `domain/seed/canvas.ts` (`listIdForSlot`, `defaultTimes`,
  `generateListsForDates`, `CanvasMasters`), `domain/seed/slotHash.ts` (unchanged),
  `domain/seed/index.ts` (`patchSlot`, `FREE`, `applyDesignFixups`, `applyPhase06Conflicts`,
  `applyPhase09Slots`, `SEED_LIST_IDS`, `SEED_MARKERS`, the masters and schedule assembly),
  `domain/seed/availabilityAndHolidays.ts` (`AVAILABILITY`), `domain/seed/permanentLists.ts`,
  `domain/seed/history.ts` (the `L-HIST-*` backdrop Lists), `domain/seed/bookings.ts` (`cards.ts` before Phase 15; the scenario Bookings target Lists by `listIdForSlot`, the filler's
  `bookable` filter is keyed on `statusKey`, and its slot RNG on `list.id`), `domain/seed/seed.test.ts`.
- **Store:** `store/appStore.ts` (`PERSIST_VERSION`, `resetDomainState` via `mutate.ts`),
  `store/mutate.ts` (`ID_FORMATS`: `availability` `AV`, `list` `LG`),
  `store/lifecycle.ts` (`editList` + `ListPatch` L~490, `reassignList` L~550 with `VACATED_STATUSES`,
  `setAvailability` L~703, `requestCover` L~844, `editRefusal`),
  `store/selectors.ts` (`listForSlot` L39, `listsForDate`, `bookingsForList`, `entityCounts`,
  `isBackdropList`), `store/clockActions.ts` (`rollCanvasForward`, which feeds `masters.availability` to the generator), `store/mastersActions.ts`
  (`addAnaesthetist`, which does the same; `addPermanentList` and `editPermanentList` with their `statusKey` field; `addHospitalHoliday`),
  `store/bookingActions.ts` (`cardActions.ts` before Phase 15; `addPostOpAddendum`'s free-session target, L~290),
  `store/integrationActions.ts` (S12 target via `listForSlot`, S13 cross-List reschedule,
  `ingestPdfRow`), `store/officeStandIn.ts` (Phase 14), `store/index.ts`.
- **Tests that pin today's behaviour:** `store/lifecycle.test.ts` (reassign, availability),
  `store/canvasRoll.test.ts`, `store/mastersActions.test.ts` (addAnaesthetist canvas),
  `store/phase06Actions.test.ts`, `store/postOpAddendum.test.ts`, `store/integrationActions.test.ts`,
  `store/demoScenarios.test.ts`, `store/persistMigrate.test.ts`,
  `apps/admin/components/DayGrid.test.tsx`, `apps/admin/flows/ReassignListFlow.test.tsx`,
  `apps/demo/xeroPairView.test.ts`, `pwa/pwaPurity.test.ts`,
  `shared/audit/auditNarrative.test.ts`.
- **Admin:** `apps/admin/AdminApp.tsx` (`dayLists`, `listsByAnaesthetist`, `activeCardCounts`,
  the header `summary` with `effectivelyBooked`, `drawerListId`), `apps/admin/outlet.ts`,
  `apps/admin/routes.tsx`, `apps/admin/util.ts` (`defaultSpan`, `listSpan`,
  `displayStatusKeyForList`, `isBooked`, `attentionReasons`),
  `apps/admin/components/DayGrid.tsx` (`segmentsFor`, `GridBlock`), `components/ListDrawer.tsx`
  (header prints `list.state`; `isFreeEmpty`; the action row),
  `flows/EditListSheet.tsx`, `flows/PhoneAdviceBooking.tsx` (`isScriptedS2Booking`, the 08:00 to
  12:00 / 13:00 to 17:00 defaults, surgeon "Not assigned yet"), `flows/ReassignListFlow.tsx`
  (`freeTargets` via `listForSlot`, vacated-status picker, "proposed reading" copy), `flows/MoveBookingFlow.tsx` (prints
  `l.state`; its targets are every non-AUTHORISED List on the date, free ones included), `flows/PermanentListSheet.tsx`
  (the `statusKey` select), `screens/MasterData.tsx` or, after 17, `screens/masters/` (the "List statuses" view,
  L~458; the Permanent Lists table prints `p.statusKey`, L~260), `screens/ReviewScreen.tsx`, `screens/AdminBookingDetail.tsx`,
  `screens/IntegrationMonitorScreen.tsx` (PDF target picker L~238).
- **Mobile:** `apps/mobile/screens/ForwardListsScreen.tsx` (`toRow` by `statusKey`),
  `screens/AvailabilityScreen.tsx` (strip dots, "My availability", Free only, cover chips),
  `screens/ListDetailScreen.tsx`, `screens/BookingDetailScreen.tsx`, `apps/mobile/routes.tsx`,
  `components/SlideStack.tsx`.
- **Web:** `apps/web/screens/ListsScreen.tsx`, `components/WeekStrip.tsx`,
  `screens/AvailabilityGrid.tsx`, `screens/DashboardScreen.tsx` (day summary, offer cover, "Who's
  free"), `screens/ListDetailView.tsx`, `screens/BookingDetailView.tsx`, `apps/web/WebApp.tsx`.
- **Shared:** `shared/format.ts` (`sessionTimeRange` L~68), `shared/schedule/ListRow.tsx`,
  `shared/StatusLegend.tsx`, `shared/flows/RequestCoverSheet.tsx` (`listId`),
  `shared/audit/actionLabels.ts`, `shared/audit/fieldLabels.ts` (`statusKey`),
  `shared/demoTriggers/registry.ts` and `context.ts` (Phase 14).
- **Demo:** `apps/demo/DemoData.tsx` (the "2 Lists per anaesthetist" invariant banner L~320, the
  state filter), `apps/demo/DemoControlPanel.tsx` (`SCENARIOS` S2 text).
- **PWA:** `pwa/PwaDemoActions.tsx` (Phase 14), `pwa/officeSimulation.ts`, `pwa/pwaPurity.test.ts`;
  and, outside `src/`, `aa-prototype/visual/pwa-device.spec.ts` and `aa-prototype/visual/admin-phase06.spec.ts`.

## Work items

### Session 1: the model, the store and the seed, every reader re-pointed

1. **Baseline and a golden fixture of today's canvas.** Run `npm run build`, `npm run build:pwa`,
   `npx vitest run` and `npm run shots`; record the counts and keep `visual/shots/` as the before set.
   Then, **before changing the generator**, add `domain/seed/canvasGolden.test.ts` with a committed
   fixture (`domain/seed/__fixtures__/canvas-golden.json`) captured from today's `buildSeed()`:
   - for every anaesthetist and session over 2026-07-07 to 2026-08-16 plus the last seven days of the
     horizon: `{ statusKey, hospitalId, surgeonId, notes, startTime, endTime, conflicts }` keyed by the
     slot;
   - every seeded Booking's `{ id, listId, patientId }` and every `SEED_LIST_IDS` value.
   After the split, the same test maps each Slot and its List through `displayStatusKey` and
   `effectiveSlotTimes` (work item 3) and must reproduce the fixture exactly: `notes` reads the List's
   `notes` when the Slot holds a List and `slot.note` when it does not; `hospitalId`, `surgeonId` and
   `conflicts` read the List (absent and `[]` on an empty Slot); times are compared only where today's
   List carried them (free, unavailable and holiday rows carry none today). This proves the
   generator and the fixups kept every RNG draw, every placement and every Booking. Later phases that
   deliberately change seed content regenerate the fixture and say so.

2. **Types** (`domain/types.ts`). DM-02, DM-04.
   - `SlotId = string`. `SlotAvailability = 'available' | 'unavailable' | 'holiday'` with a comment
     that the set is provisional (OQ-17, OQ-27) and that Phase 29 extends it.
   - `interface Slot { id; anaesthetistId; dateISO; session; availability; note?; startTime?; endTime?; coverRequest? }`.
     `startTime`/`endTime` are the per-Slot overrides (US-01.1.4 "each Slot can override");
     `coverRequest` moves here from `List` until Phase 32 replaces it with swap requests.
   - `ListKind = 'private' | 'public' | 'preop'` (`LIST_KINDS`).
   - `List`: add `slotId: SlotId` and `kind: ListKind`; remove `statusKey`, `startTime`, `endTime` and
     `coverRequest`. Keep `anaesthetistId`, `dateISO` and `session` on the List as **denormalised
     copies of its Slot's**, written only by the store actions that set `slotId` (work item 9), so the
     hundreds of existing `l.anaesthetistId === ...` filters keep working. The invariant test in work
     item 6 checks they never drift.
   - Rename the six-key union to `DisplayStatusKey` / `DISPLAY_STATUS_KEYS` (same six strings, same
     order) and delete `ListStatusKey`, so the compiler finds every reader. `ListStatus` master rows
     are keyed by `DisplayStatusKey`. Rename `statusKeyParity.test.ts`'s subject accordingly; parity
     with the theme's `StatusKey` still holds.
   - `interface SlotSettings { defaultTimes: Record<Session, { startTime: WallTime; endTime: WallTime }> }`.
   - `PermanentList`: `statusKey` becomes `kind: ListKind`; add optional `startTime`/`endTime` (the
     pre-op templates carry 09:00 to 12:00 and 13:00 to 17:00, which the projection writes as Slot
     overrides).
   - `AnaesthetistAvailability` leaves the masters. Keep the shape only as the seed's leave-window
     input (rename to `SeedLeaveWindow`), consumed by the generator.

3. **The pure Slot module** (`domain/slots.ts`, no React, exported from `domain/index.ts`) with
   `domain/slots.test.ts`:
   - `slotIdFor(anaesthetistId, dateISO, session)` returns `S-<reg>-<date>-<AM|PM>`.
   - `projectedListId(anaesthetistId, dateISO, session)` returns today's `L-<reg>-<date>-<AM|PM>`
     (renamed from `listIdForSlot`). Its doc comment says it names the Slot the List was **born**
     in, is used only by the projection and the seed, and must never be parsed to find a List's
     current Slot. Keeping this form keeps every seeded List id, every `SEED_LIST_IDS` value, the demo
     guide's direct URLs and the capture recipes' URLs valid. Lists created at runtime take `LG####`
     from the counter (work item 9).
   - `displayStatusKey(slot: Slot, list: List | undefined): DisplayStatusKey`: a List present returns
     `list.kind`; otherwise `holiday` returns `holiday`, `unavailable` returns `unavailable`,
     `available` returns `free`. **It takes no Bookings**, which is how US-01.2.3 ("never derives a
     Slot's status from its booking activity") is guaranteed by the signature. A List on an
     unavailable Slot shows its kind plus its conflict flag, as today (the colour change is Phase 30).
   - `effectiveSlotTimes(slot, settings)` returns `{ startTime, endTime, overridden }`: the Slot's
     override where set, else the settings default for its session (US-01.1.4).
   - `isOpenSlot(slot, list)`: available and no List (the "Free" the finders, cover chips and "Free
     only" filters mean).
   - Tests: the full `displayStatusKey` table (three availabilities with no List, and every kind on
     every availability); `effectiveSlotTimes` with and without overrides and after a settings change.

4. **Generator** (`domain/seed/canvas.ts`): `generateCanvasForDates(masters, datesISO)` returns
   `{ slots: Slot[]; lists: List[] }` and replaces `generateListsForDates`.
   - `CanvasMasters` becomes `{ seed, anaesthetistIds, permanentLists, leave, holidays }`. Today
     `rollCanvasForward` and `addAnaesthetist` pass `masters.availability` as the leave input; once it
     leaves the masters they pass the seed constant `SEED_LEAVE` (work item 6), so the far edge still
     deep-equals a fresh generation. Leave set at runtime already lives on the Slots it covers (every
     date it can target is inside the horizon); Phase 29 owns leave set beyond it.
   - Same precedence and **the same RNG draws per slot** as today (leave window, then weekday
     template, then the slot RNG), so the golden test holds:
     - a leave window or an RNG "unavailable" draw sets the Slot's availability and note ("Not
       available") and creates no List;
     - an unused slot is an `available` Slot with no List;
     - a template or an RNG private or public draw creates a List `{ id: projectedListId(...), slotId,
       kind, hospitalId?, surgeonId?, notes?, state: 'DRAFT', conflicts: [] }`;
     - template times become Slot overrides; RNG private and public Lists stamp no times (they take
       the settings default, so a changed default reaches them: US-01.1.4's third gap bullet);
     - hospital holidays flag Lists exactly as today.
   - Delete `defaultTimes`. The generator reads no default times at all.

5. **One settings record for default times** (US-01.1.4: "Admins set default start and end times for
   AM and PM Slots"). Seed `SLOT_SETTINGS = { defaultTimes: { AM: 07:30 to 12:30, PM: 13:00 to 17:30 } }`
   (today's generated values) as `masters.slotSettings`. Remove the four duplicates the gap found:
   `canvas.ts` `defaultTimes`, `apps/admin/util.ts` `defaultSpan`, the fallback in
   `shared/format.ts` `sessionTimeRange`, and `PhoneAdviceBooking`'s 08:00 to 12:00 / 13:00 to 17:00.
   Every time label and the grid geometry read `effectiveSlotTimes`.

6. **Seed assembly** (`domain/seed/index.ts`, `history.ts`, `availabilityAndHolidays.ts`):
   - `schedule.slots: Record<SlotId, Slot>` beside `schedule.lists` (Lists only).
   - Rewrite the fixups over the two records. `patchSlot` splits into `setSlot(slots, a, d, s, { availability?, note?, startTime?, endTime? })`,
     `placeList(lists, slots, a, d, s, { kind, hospitalId, surgeonId?, notes? })` (creates or patches
     the List with `projectedListId`) and `clearSlot(lists, slots, a, d, s, note?)` (removes any List
     and leaves an available Slot; this is today's `FREE`, and the "Free / open for cover" style notes
     move to `Slot.note`). The design times pinned today (for example Rutherford Tue 21 AM 08:00 to
     13:00) become Slot overrides.
   - `applyPhase06Conflicts` selects booked Lists by `kind`; ids are unchanged, so it picks the same two
     Lists. `applyPhase09Slots` uses `placeList`.
   - The filler's `bookable` filter reads `list.kind` (private or public); its RNG is keyed on
     `list.id`, which is unchanged, so every Booking is reproduced (the golden test proves it).
   - The Fitzgerald Tue 21 PM "Surgeon TBC" List stays as is: the pairing rule is Phase 31.
   - The `L-HIST-*` backdrop Lists get `slotId: slotIdFor(...)` and `kind: 'private'` but no Slot
     record, because they sit before the canvas horizon; `isBackdropList` already fences them.
   - `masters.availability` is removed; `AVAILABILITY` becomes `SEED_LEAVE` (generator input only).
   - Audit every `SEED_LIST_IDS` and `SEED_MARKERS` entry and every scenario Booking in
     `domain/seed/bookings.ts` (they target Lists by `listIdForSlot`, renamed `projectedListId`): each
     List id must resolve to a List. At plan review (2026-10-01) every one of them resolves to a booked
     List and no seeded Booking sits on a free List, so nothing needs re-pointing; if a later phase has
     added a marker or Booking on a free session, re-point the marker to its Slot id (and teach
     `/demo/data` to open a Slot marker) or `placeList` a List there.
   - `PermanentList` seed rows (`permanentLists.ts`) take `kind`; the pre-op rows carry today's
     09:00 to 12:00 / 13:00 to 17:00 as template times.
   - Seed tests (`seed.test.ts`): exactly two Slots per anaesthetist per day across the horizon; every
     non-backdrop List's `slotId` resolves and its `anaesthetistId`, `dateISO` and `session` match the
     Slot's; no Slot holds two Lists; no empty Slot has a List-only field; every seeded Booking's
     `listId` resolves to a List; two builds deep-equal. Remove `counters.availability` from the seed.

7. **Store core** (`appStore.ts`, `mutate.ts`): add `schedule.slots` and `masters.slotSettings`, drop
   `masters.availability`; `resetDomainState` restores both. **Bump `PERSIST_VERSION` by one** with a
   comment line ("Phase 28: Slot and List split; the canvas is two records") and extend
   `persistMigrate.test.ts`. In `ID_FORMATS`, remove `availability` and keep `list` (`LG`) for
   runtime-created Lists; update its comment (Lists are no longer "regenerated").

8. **Selectors** (`store/selectors.ts`):
   - **Delete `listForSlot`** rather than re-implementing it, so the compiler lists every caller and
     each one is revisited (its callers expected a free List where there will now be none).
   - Add `slotFor(state, anaesthetistId, dateISO, session)`, `listInSlot(state, slotId)` (through a
     `listIndexBySlot(lists)` index memoised on the `schedule.lists` record reference, so a 20,000-Slot
     grid does not scan Lists per cell), and `slotViewsForDate(state, dateISO)`,
     `slotViewsForAnaesthetist(state, anaesthetistId, fromISO, toISO)` and `slotView(state, slotId)`
     returning `{ slot, list?, displayKey, times }`. Components that need arrays select the stable
     records and derive with `useMemo`, as the file's header comment requires.
   - `entityCounts` gains `slots` and loses `availability`.

9. **Store actions** (a new `store/slotActions.ts`, exported from `store/index.ts`; every write through
   `mutate()` with before and after, timestamps from the clock):
   - **Internal `placeListOnSlot`** (not exported from the package index): the one place a List is
     created at runtime. It allocates `LG####`, sets `slotId`, the denormalised fields, `kind`,
     hospital, surgeon and notes, `state: 'DRAFT'`, `conflicts: []`, and emits `list.create`.
   - **`assignListToSlot(api, actor, slotId, { hospitalId, surgeonId, kind, notes? })`**
     (US-01.3.3). Office only (`officeOnly`); refuses `notFound`, `slotOccupied` (the Slot already
     holds a List), `hospitalRequired`, `surgeonRequired`, `invalidKind`, and `slotNotAvailable` for an
     unavailable or holiday Slot. That last refusal is an **interim**: Phase 30 turns it into
     accept-and-flag (US-01.5.2 "nothing blocks the admin"). If Phase 17 is done, a blacklisted
     pairing is warned and acknowledged exactly as 17 does in `editList` (its `*.blacklistAcknowledged`
     entry); never refused. Returns `{ listId }`.
   - **`reassignList(api, actor, listId, toAnaesthetistId, vacatedAvailability = 'available')`**,
     re-implemented over **`moveListToSlot(api, actor, listId, toSlotId, vacatedAvailability)`**
     (US-01.4.1's technical discussion: change the owner reference, consume the covering
     anaesthetist's Slot, return the vacated Slot to available). The List keeps its id, Bookings,
     phone notes and history; `slotId` and the denormalised fields change; availability conflicts drop
     and holiday conflicts stay (as today); the source Slot's time override moves to the target Slot
     and is cleared from the vacated one. Refuses `officeOnly`, `listAuthorised`, `notFound`,
     `sameSlot`, `differentSession` (a move stays on the same day and session), `slotOccupied`
     and `targetNotAvailable`. The outcome becomes `{ listId, vacatedSlotId }` (today's
     `{ movedListId, regeneratedListId }` goes). Audits one `list.reassign` (before and after `{ slotId, anaesthetistId }`)
     plus `slot.availability` on the vacated Slot when the office picks Unavailable or Holiday. **No
     more absorb and regenerate**: no List is deleted, none is allocated, and `list.absorb` and
     `list.regenerate` are no longer written.
   - **`setAvailability(api, actor, anaesthetistId, dateISO, session, kind, note?)`** keeps its
     signature (the mobile screen calls it) and now writes `Slot.availability` and `Slot.note`, audited
     `slot.availability`. The same refusals as today (anaesthetist own only, integration forbidden).
     Outcome `{ reconciled: 'updated' | 'conflictFlagged' | 'noChange' }`:
     - an empty Slot is simply updated (no List to "restatus");
     - a Slot holding a List, marked unavailable or holiday, keeps the List and its kind and flags an
       availability `ListConflict` as today ("replace, never stack");
     - marking a Slot holding a List **available** updates the Slot and writes **no** conflict. Today's
       "Marked available, but this List carries booking context" conflict is a symptom of the welded
       model and goes. An earlier availability conflict on that List stays until Phase 30 adds
       clearing;
     - availability never touches `List.kind`, and nothing about Bookings is read (US-01.2.3, FT-01.2).
   - **`setSlotTimes(api, actor, slotId, { startTime?, endTime? })`**: office only; `HH:mm`, start
     before end; an empty string clears the override; refuses when the Slot's List is AUTHORISED
     (`listAuthorised`, mirroring `editRefusal`). Audit `slot.times`. US-01.1.4 "each Slot can
     override".
   - **`setSlotDefaultTimes(api, actor, defaultTimes)`**: office only; validates both sessions; audit
     `settings.slotDefaults` (entity type `settings`, id `slotSettings`). Slots without an override
     follow at once; Slots with one keep it. US-01.1.4.
   - **`editList`**: `ListPatch` loses `startTime` and `endTime` (they belong to the Slot); `kind`,
     `slotId` and the anaesthetist stay out of it. Clearing a hospital or surgeon is left as today
     (Phase 31 enforces the pairing rule).
   - **`requestCover(api, actor, slotId, kind, message?, targetAnaesthetistId?)`**: the marker is
     written on the Slot, and the action refuses unless `isOpenSlot` (`notFree`). Audit
     `slot.coverRequest`. Phase 32 replaces it.
   - **`addAnaesthetist`** generates the new anaesthetist's Slots (and any projected Lists) through
     `generateCanvasForDates`; its result copy says "N forward Slots generated".
     `addPermanentList` and `editPermanentList` take `kind: ListKind` (private, public or pre-op) in
     place of `statusKey`, plus optional `startTime`/`endTime`, and keep their no-retro-projection
     behaviour (Phase 30 repopulates the canvas). `addHospitalHoliday` flags Lists as today.
   - **`rollCanvasForward`** (`clockActions.ts`) appends Slots and Lists; `canvas.rollForward`
     records `{ slots, lists }` per day. Far-edge output still deep-equals a fresh generation.
   - **`addPostOpAddendum`** (interim until Phase 39 replaces the addendum Booking): its target becomes
     today's open Slot for that anaesthetist; it creates the List there with `placeListOnSlot`, copying
     the original List's hospital, surgeon and kind, then the Booking, in one audited mutation. The
     refusal copy becomes "No free Slot is open today for this anaesthetist ...".
   - **`reassignBooking`** (`reassignCard` before Phase 15; the Admin Move flow): unchanged in
     behaviour, but its targets are now Lists only. Moving a Booking into an empty Slot means assigning
     a List there first; the move picker says so in one line ("To move into a free Slot, assign a List
     to it first.").
   - **Integrations** (`integrationActions.ts`, interim until Phase 33 replaces auto-apply): S12 and
     S13 resolve their target with `slotFor` then `listInSlot`. A message whose target Slot holds no
     List is **parked** (`noTargetList`, manual intervention, "The target session has no List yet.
     Parked for the office."), never silently retimed in place. Check the canned messages: if S1's
     S12 or S13 targets a Slot the seed leaves empty, `placeList` a List there in the seed so the S1
     beats are unchanged, and prove it in `demoScenarios.test.ts`. `ingestPdfRow` and the PDF target
     picker offer Lists only.
   - **Audit labels** (`shared/audit/actionLabels.ts`): `list.create` "List assigned",
     `slot.availability` "Availability set", `slot.times` "Session times changed",
     `slot.coverRequest` "Cover requested", `settings.slotDefaults` "Default session times changed";
     `fieldLabels.ts` gains `kind`, `availability`, `slotId`, `startTime`, `endTime`. Keep the old
     `list.absorb`, `list.regenerate`, `list.restatus` and `availability.*` labels so any older
     persisted history still reads. `auditNarrative.test.ts` must pass.

10. **Store tests** (`store/slotActions.test.ts`, updated `lifecycle.test.ts`, `canvasRoll.test.ts`,
    `mastersActions.test.ts`, `postOpAddendum.test.ts`, `integrationActions.test.ts`):
    - `assignListToSlot`: every refusal; success creates exactly one `LG` List in that Slot, flips its
      display key from `free` to the kind, and writes one `list.create`.
    - **Status independence (US-01.2.3):** for a sample of seeded Slots, create, complete, cancel and
      move Bookings, and assert `displayStatusKey` never changes; set a Slot to holiday with and
      without a List and assert it reads holiday when empty and keeps the List's kind (plus a conflict)
      when not.
    - **One status in three apps:** the phone-advice path (assign, then a Booking) gives the same
      display key through `slotView`, `slotViewsForDate` (Admin) and `slotViewsForAnaesthetist`
      (mobile and web). There is no second derivation anywhere (the `displayStatusKeyForList` and
      `effectivelyBooked` helpers are deleted; the reviewers check for stragglers).
    - Reassign: the List id, Bookings and history are unchanged; the target Slot holds it; the vacated
      Slot is available by default and unavailable or holiday on request; no List is deleted or
      allocated; time overrides travel; each refusal.
    - `setAvailability`: marking a booked Slot available writes no conflict (the gap's "bogus
      conflict"); repeated toggles leave at most one availability conflict.
    - `setSlotTimes` and `setSlotDefaultTimes`, including "an override survives a default change".
    - Roll-forward and `addAnaesthetist`: two Slots per day for everyone, deep-equal to a fresh
      generation.

11. **Registry and context** (Phase 14's `src/shared/demoTriggers/`):
    - Re-point every entry that resolved a List through `listForSlot` or `listIdForSlot`
      (`stage-post-op`'s `when` compares the URL's List id with `projectedListId(ANAE.sharma,
      '2026-07-14', 'AM')`; `ingest-pdf-row` resolves `SURGEON_PDFS[0].targetList` with
      `slotFor` + `listInSlot` in place of `listIdForSlot`, and is disabled with "The PDF's target
      session has no List" when the Slot is empty; `billing-failure` uses `SEED_LIST_IDS` and is
      unchanged). Grep the registry for `listIdForSlot`, `listForSlot` and `statusKey` so none is missed.
      Bodies stay in `src/shared` or `src/store`.
    - Add the context key `'adminDay.selectedSlotId'` to `DemoContextValues`, published by the Admin
      Day drawer (work item 13). Nothing consumes it yet; Phase 30's "Simulate sickness" acts on it.

12. **Re-point every reader to Slot views** (no new UI yet; the app must look as it does today apart
    from the fixed behaviours). Each reads `displayKey`, `slot.note`, `slot.coverRequest` and
    `effectiveSlotTimes` where it read `statusKey`, `list.notes` on a free row, `list.coverRequest` and
    `list.startTime`:
    - **Admin:** `AdminApp` builds `slotViewsByAnaesthetist` for the selected date and passes it to
      `DayGrid` (blocks keyed and clicked by Slot id: `onSelectSlot`); `segmentsFor` merges a
      both-sessions leave or unavailable pair from Slot views; `util.ts` loses `defaultSpan` and
      `displayStatusKeyForList`, and `listSpan` becomes `slotSpan(view)`; the header summary counts
      Lists as sessions and open Slots as free; `attentionReasons` reads `list.kind`;
      `ReviewScreen`, `AdminBookingDetail` and `MoveBookingFlow` read `list.kind` and the approval
      label (below); the PDF target picker offers Lists only.
    - **Mobile:** `ForwardListsScreen` builds rows from `slotViewsForAnaesthetist` (free rows from open
      Slots with "Offer cover" or "Requested", leave rows from holiday Slots, unavailable collapses,
      booked rows from Lists); `AvailabilityScreen` strip dots, "N free sessions", Free only and the
      cover chips use `isOpenSlot`; "My availability" reads the persona's Slots; `ListDetailScreen`
      and `BookingDetailScreen` chips read `list.kind` and times from the Slot.
    - **Web:** `ListsScreen`, `WeekStrip`, `AvailabilityGrid` and `DashboardScreen` (day summary,
      offer cover, "Who's free") use Slot views; `ListDetailView` and `BookingDetailView` as mobile.
    - **Shared:** `shared/format.ts` gains `slotTimeRange(view)` (replacing `sessionTimeRange(list)`)
      and **`approvalStateLabel(state)`**: `DRAFT` reads "Open", `SUBMITTED` "Submitted",
      `AUTHORISED` "Authorised". Wherever the raw `list.state` was printed to a user (the drawer
      header, the move picker) it goes through the helper. This settles the "DRAFT" label collision:
      empty Slots no longer carry a state at all, assigned Lists never show the word "Draft", and the
      phrase "Draft List" is reserved for Phase 31. The domain value stays `DRAFT` (EP-07). The
      `/demo/data` inspector may keep raw codes.
    - `RequestCoverSheet` takes a `slotId`.
    - **Permanent Lists:** `PermanentListSheet`'s select offers the three kinds (Private, Public, Pre-op)
      and gains optional start and end ("Leave blank for the default session times"); the Master data
      table prints the kind's label, not the raw key.
    - **Compile-forced minimums** (finished in session 2, but working at the end of session 1 so the
      app stays demoable): clicking an empty Slot on the grid opens the drawer in a plain empty-Slot
      form with today's Book (phone advice) action (item 13 completes it); `PhoneAdviceBooking` calls
      `assignListToSlot` and then opens `AddBookingFlow` on the new List (item 15 adds the required
      surgeon, the prefill from settings and the copy); `EditListSheet` saves changed times through
      `setSlotTimes` (item 16 adds the hints); `ReassignListFlow`'s candidates come from `slotFor` +
      `isOpenSlot` and it passes the vacated value through (item 17 changes the default and copy). Any
      Vitest or Playwright spec these break is fixed in session 1, not left for item 21.
    - **Demo inspector** (`DemoData.tsx`): the banner becomes "Canvas invariant holds: exactly 2 Slots
      per anaesthetist today, every List in one Slot"; counts show Slots and Lists.
    - Re-green all four commands. Compare screenshots with the baseline: expected differences are the
      drawer header's approval label and nothing else. **Session 1 ends here, green and demoable.**

### Session 2: the office flows, the settings editor, the stand-in and the docs

13. **The Admin Day drawer opens a Slot** (`components/ListDrawer.tsx` becomes `SlotDrawer.tsx`; keep
    `data-testid="admin-list-drawer"` on it for the capture recipes and add `data-slot-id`). It
    publishes `'adminDay.selectedSlotId'`.
    - **A Slot holding a List:** today's drawer (header name, date, session, `approvalStateLabel`,
      `StatusChip` of the kind; Needs attention; Session with times, hospital, surgeon, note; Bookings;
      actions Edit list, Reassign list, History). Reassign is offered for every List, not only
      "booked" status keys.
    - **An empty Slot:** header with the anaesthetist, date, session and the Slot's status chip (Free,
      Unavailable or Holiday); a "Slot" section with availability, times (with "Default" or
      "Overridden") and note; actions **Assign List** (teal primary, open Slots only),
      **Book (phone advice)** (open Slots only), **Edit times** and **History** (the Slot's audit,
      `entityIds={[slotId]}`). An unavailable or holiday Slot shows a one-line note that it is not
      open for assignment in this build (Phase 30 relaxes it).

14. **Assign List sheet** (`apps/admin/flows/AssignListSheet.tsx`, `useSurface().Overlay`), US-01.3.3:
    hospital (required), surgeon (required: `SurgeonSelect` for the Slot's anaesthetist with the
    blacklisted group and `BlacklistWarning` if Phase 17 is done), kind as a segmented control
    (Private, Public; default Private; pre-op Lists come only from Permanent Lists until the pairing
    decision in Phase 31), and an optional note. Errors inline ("Choose the hospital." / "Choose the
    surgeon."). Saving calls `assignListToSlot`; the drawer switches to the new List. Copy states the
    rule plainly: "Assigning a surgeon and hospital creates the List in this Slot."

15. **Book (phone advice)** (`flows/PhoneAdviceBooking.tsx`), rebuilt on the same assignment step:
    - Step 1 is the Assign List fields plus start and end times, prefilled from `effectiveSlotTimes`
      (so 13:00 to 17:30 for a PM Slot, from the settings record). The surgeon is required; the "Not
      assigned yet" option goes.
    - "Continue to add booking" calls `assignListToSlot`, then `setSlotTimes` only if the times were
      changed, then opens the shared `AddBookingFlow` on the new List id. Abandoning step 2 leaves an
      assigned List with no Bookings, which the catalogue allows; the docblock says so and the old
      "write context only after the card" workaround goes.
    - `isScriptedS2Booking` keys on the Slot (Sharma, 2026-07-21, PM) plus St George's and Mr T. Hale,
      and the lookup prefill works unchanged.
    - The docblock's "anaesthetist views still show Free (P5)" note is deleted: the session now reads
      as a Private List everywhere.

16. **Times editing.** `EditListSheet` keeps hospital, surgeon and notes (through `editList`) and
    shows the Slot's times with a "Default" hint and a "Use default" link; changed times save through
    `setSlotTimes`, only when they changed. The empty-Slot drawer's **Edit times** opens a small
    `EditSlotTimesSheet` with the same fields.

17. **Reassign** (`flows/ReassignListFlow.tsx`), US-01.4.1:
    - candidates are other anaesthetists whose Slot on the same day and session is open
      (`isOpenSlot`), partitioned by Phase 17's `partitionAnaesthetistsForSurgeon` if present;
    - the confirm step's vacated picker reads **Available (default)**, Unavailable, On leave, with the
      line "The vacated Slot returns to available unless you mark it otherwise.";
    - the "free-target, absorb and regenerate ... proposed reading" copy is removed; the confirm text
      says the List moves with its Bookings and history into the colleague's Slot;
    - update `ReassignListFlow.test.tsx` (the default, the candidates, the move).

18. **Session times master** (Admin > Master data, a new "Session times" entry in the sub-nav, placed
    beside "List statuses"): a small two-row table (AM, PM) with start and end, Edit opening a sheet
    that calls `setSlotDefaultTimes`, and the line "Slots with their own times keep them." US-01.1.4
    "Admins set default start and end times". Add the provisional OQ-17 / OQ-27 line to the "List
    statuses" view's header (see the drift check); Phase 29 turns that view into an editor.

19. **Anaesthetist apps, the fixed behaviour** (US-01.2.3 and US-01.3.3's third gap bullet). Check, and
    fix any straggler, that after an office assignment or a phone-advice booking:
    - mobile Forward Lists shows the session as a booked List row (hospital, surgeon, time, Booking
      count), not "Free session / Offer cover";
    - the mobile availability strip, "Free only" and the cover chips no longer offer that session;
    - the web week strip block is booked and clickable, the web Lists row opens the List, and the
      dashboard day summary counts it;
    - `StatusChip`, `ListRow` and `StatusLegend` still take a `StatusKey` from the theme, fed by
      `displayKey` or `list.kind`.

20. **PWA office stand-in: "Office assigns a List to my next free Slot"** (see Demo triggers). Store
    body `assignNextFreeSlotAsSimulatedOffice(api, anaesthetistId, pairingId?)` in
    `store/officeStandIn.ts` (beside Phase 14's `authoriseAsSimulatedOffice`), acting as
    `OFFICE_SIMULATION_ACTOR` (`store/demoActors.ts`) through `assignListToSlot`. "From today" means
    the demo clock's today (`src/domain/clock.ts`), never `new Date()`; the scan walks Slots in
    date then session order, so the pick is deterministic. Registry entry in
    `shared/demoTriggers/registry.ts`. Vitest: it picks the earliest open Slot from today; refuses
    with "No free Slot in the next four months" when none; skips a pairing that `blacklistWarning`
    warns on (if 17 is done); a second run takes the next open Slot.

21. **Playwright and shot hooks.** `data-shot` hooks `admin-slot-drawer`, `admin-assign-list`,
    `admin-session-times`, `mobile-lists-assigned`. Update the admin specs that open a Free List,
    book by phone and reassign (`visual/admin-phase06.spec.ts` and any spec relying on
    `admin-list-drawer`); extend `visual/pwa-device.spec.ts` to open the Demo chip on Lists, run the
    stand-in and assert a new booked row appears. Keep `pwaPurity.test.ts` green (the stand-in body
    lives in `src/store`, the entry in `src/shared`).

22. **Capture recipes** (`requirements-board/capture/recipes/`): re-point only the selectors and
    captions the change breaks. Find them by grepping the recipes for the free-session List ids
    (for example `L-41267-2026-07-21-PM`, `L-47733-2026-07-21-PM`, `L-34821-2026-07-22-PM`),
    "open for cover", "Offer cover", "Book (phone advice)", "Reassign", "Free only" and raw "DRAFT"
    text; at plan review that set is mainly the US-01.x recipes (US-01.1.4, US-01.2.1, US-01.2.3,
    US-01.3.1, US-01.3.3, US-01.4.1, US-01.4.2, US-01.4.3, US-01.5.2, US-01.5.3) plus US-02.3.1.
    Recipes that only use booked `L-...` ids or `admin-list-drawer` keep working (both are kept).
    Update the ATLAS id table (Slots `S-...`, projected Lists keep `L-...`, runtime Lists `LG####`). Do not re-run the captures unless
    the owner asks.

23. **Docs inside the app and close-out.** `aa-prototype/README.md` folder map: `domain/slots.ts`,
    `store/slotActions.ts`, and one paragraph on the Slot and List model (Slot id, projected List id,
    runtime `LG` ids, the derived display key, the settings record). Then finish green, run the
    adversarial review, patch the demo guide and write the PROGRESS entry.

## Demo triggers

Everything in this phase is demonstrable through normal use in the framed build: the office assigns
a List, books by phone, edits times and defaults, and reassigns in Admin, and the result shows in the
mobile and web apps. So the harness bar gains **no** new entry. The PWA has no Admin app, so the
mobile side of "the office assigned me a List" needs a stand-in:

| Label | Screen | Surface | Effect |
|---|---|---|---|
| Office assigns a List to my next free Slot | Mobile · Lists (`/mobile/lists`) | PWA only, badged "office stand-in" | Finds Dr Souter's earliest open Slot from today and assigns a List there as the simulated office. `choices`: St George's Hospital · Mr T. Hale (default), Southern Cross · Ms K. Patel, Forte Health · Mr C. Okafor, with any blacklisted pairing left out. The message names the Slot ("Assigned St George's Hospital · Mr T. Hale to your Wed 22 Jul PM Slot") and the row appears as a Private List. Disabled with "No free Slot in the next four months" |

Re-pointed, not added: `stage-post-op` (its `when` uses `projectedListId`). The new context key
`'adminDay.selectedSlotId'` is published for Phase 30.

## Out of scope

- **Draft Lists** (FT-01.6, DM-03) and the **pairing rule** enforcement (US-01.3.1, FT-01.3): Phase 31.
  The Fitzgerald "Surgeon TBC" List and the hospital-less pre-op and surgeon-less acute Lists stay as
  seeded.
- **The availability calendar**, "available for emergency", leave set weeks ahead, web availability
  controls and **editable Slot statuses** (US-01.2.1, US-01.2.2, US-01.5.3): Phase 29.
- **Conflicts on every path**, the List colour change, clearing a conflict, holiday edit and delete,
  the conflict dashboard, **assigning onto an unavailable Slot** (the interim refusal here), and
  **Permanent List edits repopulating the canvas** (US-01.5.2, US-01.5.4, US-01.3.2): Phase 30.
- **Swap requests** replacing the cover marker (US-01.4.3, DM-05, RV-15): Phase 32.
- Hospital download rows creating Lists and the no-silent-apply matching screen: Phase 33 (the
  integration parking rule here is an interim).
- The post-op addendum's replacement by additional invoices: Phase 39.
- `Anaesthetist.active` having a canvas effect, and un-assigning a List back to an empty Slot: not
  planned; raise with the owner if a beat needs them.
- The 85-anaesthetist scale demo (Phase 43). `canvasRoll.test.ts`'s scale test must stay inside its
  time budget with Slots.

## Manual test checklist

- [ ] Reset. Admin Day, Tue 21 Jul looks as before: same blocks, colours, labels, times and flags; the
      header summary reads the same counts.
- [ ] Open a Free block: the drawer shows a Slot (Free chip, default or overridden times, note) with
      Assign List, Book (phone advice), Edit times and History, and no "DRAFT" anywhere.
- [ ] Assign List on Strand Tue 21 PM (St George's, Mr T. Hale, Private): the block turns Private; the
      drawer shows the List with "Open" and no Bookings; the Audit viewer shows "List assigned".
      Saving with no surgeon shows "Choose the surgeon."
- [ ] Book (phone advice) on Sharma Tue 21 PM with St George's and Mr T. Hale: times prefill 13:00 to
      17:30; the lookup prefill works; after saving, the block is Private with one Booking. In the web
      app the Availability grid for Tue 21 shows Sharma PM booked, not Free, and the session is gone
      from "Free only" in mobile Availability.
- [ ] Mobile (Dr Souter) and web Lists and week strip: after assigning Souter Wed 22 PM in Admin, both
      show it as a booked List row that opens; neither offers cover on it.
- [ ] Status independence: add, complete and cancel a Booking on a List; its colour and label never
      change. Mobile Availability: Block, then Free, on a session holding a List: the List keeps its
      colour, Block raises the amber flag, Free adds no new flag.
- [ ] Session times: Master data, Session times, change PM to 13:30 to 17:30. Every PM block without its
      own times moves on the grid, mobile and web; Rutherford Tue 21 PM (13:30 to 17:00, overridden)
      does not. Change it back.
- [ ] Edit list on a List with an overridden time: "Use default" restores the default; the audit shows
      "Session times changed".
- [ ] Reassign Rutherford Wed 22 AM to Sharma: the picker defaults the vacated Slot to Available;
      choose Unavailable and confirm. The List keeps its id (the URL on Review or the drawer History
      shows the same List), its Bookings and its history, now under Sharma; Rutherford's AM Slot is
      Unavailable (hatched); nothing reads "regenerated".
- [ ] Next day (clock) and "Next morning" twice: the far edge gains two Slots per anaesthetist per day;
      `/demo/data` shows the Slot invariant holding.
- [ ] Add an anaesthetist in Master data: "N forward Slots generated", and their row shows Free Slots
      across the horizon.
- [ ] Master data, Permanent Lists: the sheet offers Private, Public and Pre-op only, with optional times;
      the table shows the kind's label.
- [ ] Move a Booking in Admin: the picker lists Lists only and carries the "assign a List to it first"
      line; an empty Slot is not a target.
- [ ] S1 on the framed build (Fire hospital message and its modify and move messages) behaves exactly as
      before; S4 Beat 2 (stage post-op, Add post-op event) still creates the addendum Booking.
- [ ] PWA (`npm run dev:pwa`, fresh storage): on Lists the Demo chip offers "Office assigns a List to my
      next free Slot"; running it adds a booked row on the named Slot; running it again takes the next
      one. The chip is absent on More.
- [ ] No en or em dashes in any new copy; teal is the only action colour; crimson unused on the new
      sheets.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots` all green.

## Demo guide updates

This phase breaks S2 Beats 1 to 3 and touches S4 Beat 2. Patch, in the same session:

- **`docs/demo-guide/03-demo-script.md`:**
  - S2 Beat 1, Say: "Every active anaesthetist has two half-day **Slots** a day, whether or not a List
    sits in them. A List is what the office assigns into a Slot."
  - S2 Beat 2: the click path becomes "Open Dr Priya Sharma's Tue 21 PM **Free Slot** → Book (phone
    advice) → St George's Hospital, Mr T. Hale; keep the default times (13:00 to 17:30) → Continue to
    add booking → ...". Expected: "The Slot now holds a Private List with the new Booking, and the
    anaesthetist's web and mobile views show it as booked." Delete the "still label the session Free,
    an open polish item" caveat. Add an optional one-liner: "Assign List does the same without a
    patient, for a session booked ahead."
  - S2 Beat 3: keep "Reassign list → Dr Priya Sharma", then "the vacated Slot defaults to Available;
    choose **Unavailable** because Dr Rutherford is ill → Confirm reassignment". Say: "The List moves
    with its Bookings and history into Dr Sharma's Slot; nothing is re-keyed." Expected: "the vacated
    Slot shows Unavailable; History records one reassignment." Remove the "free-target, absorb and
    regenerate is the prototype's proposal" line.
  - S4 Beat 2: add to Expected: "the addendum sits on a List created in today's free Slot" (interim
    until 39).
  - Discovery points or direct URLs that call an empty session a "List".
- **`docs/demo-guide/02-workflows-and-handoffs.md`:** Workflow 3 steps 5 to 9 (target a free Slot; the
  List moves into it; the vacated Slot returns to available or is marked unavailable; no absorb or
  regenerate); the "Prototype readiness" note stops calling the mechanism a prototype proposal and cites
  US-01.4.1; line 78's "displayed consistently in all apps" is now true, including after a phone booking.
- **`docs/demo-guide/04-presenter-cheat-sheet.md`:** item 5 "List reassignment mechanics" rewritten to the
  Slot move; add a short "Slots and Lists" line and the default-times setting; a note that the status
  vocabulary is provisional (OQ-17, OQ-27).
- **`docs/demo-guide/master-demo-guide.html`:** the same S2 Beats 1 to 3 and S4 Beat 2 rows, the
  workflow 3 summary and the cheat-sheet item (the sections near "phone advice", "Reassign list" and
  "vacated slot").
- **Control Panel** `SCENARIOS` S2 text (`apps/demo/DemoControlPanel.tsx`): "Free Slot", "Assign List",
  and the vacated-Slot default.

## Adversarial review (after build)

Once the manual test checklist and `npm run build`, `npm run build:pwa`, `npx vitest run` and
`npm run shots` are green, and before writing the PROGRESS entry, run the standard **adversarial
review-and-fix pass (PROGRESS convention 18)**:
- fan out three independent Opus review subagents, one each for **quality**, **bugs/correctness** and
  **plan adherence**, with the catalogue files, this doc and the diff;
- this session then independently verifies every finding against the catalogue, this doc and the
  code, fixes the confirmed ones (with a test wherever a bug had none), re-greens, and records the
  pass in the phase entry;
- do not re-raise anything already settled in the Decisions log (as amended by this phase).

**Steer this phase's reviewers at:**
- **One derivation.** The displayed status comes only from `displayStatusKey(slot, list)`. Hunt for
  any surviving derivation from Bookings, hospital or surgeon (`displayStatusKeyForList`,
  `effectivelyBooked`, `statusKey === 'free' && cards`), any screen that reads `list.kind` for a free
  test instead of `isOpenSlot`, and any app whose label or colour for the same session differs from the
  others.
- **No caller left behind.** Every former `listForSlot` caller now handles "no List in this Slot"
  correctly: the integration targets park instead of silently retiming, the addendum creates its List,
  the PDF picker offers Lists only, the finders and cover chips use open Slots, and no code parses a
  List id to find its Slot.
- **Identity.** Projected Lists keep `L-<reg>-<date>-<session>` ids, runtime Lists take `LG####`, and a
  reassigned List keeps its id; Slot ids are deterministic; the denormalised `anaesthetistId`,
  `dateISO` and `session` on a List always equal its Slot's after every action (assign, reassign,
  roll-forward, addendum, stand-in). Roll-forward and `addAnaesthetist` read the same leave input
  (`SEED_LEAVE`) as the seed build, so the far edge matches a fresh generation.
- **Determinism.** The golden test reproduces today's canvas and Bookings exactly; the RNG draw order
  per slot is unchanged; roll-forward deep-equals a fresh generation; no `Date.now()`, `new Date()` or
  `Math.random()`; `PERSIST_VERSION` bumped and the migrate test extended.
- **Audit and guards.** Every new write goes through `mutate()` with before and after; reassign writes
  one `list.reassign` and no absorb or regenerate; the office-only and AUTHORISED guards hold on assign,
  move and times; the new action codes are labelled; blacklist handling (if 17 is done) warns and never
  refuses.
- **Scope discipline.** No Draft Lists, no pairing enforcement, no availability calendar, no conflict
  clearing or colour change, no swap flow. The interim refusals (assign onto an unavailable Slot) and
  interim behaviours (addendum List, integration parking) are labelled as such in code comments and
  the Decisions log.
- **Design and copy.** The six colours and treatments are unchanged; the empty-Slot drawer extends the
  List drawer; teal-only actions; no en or em dashes; no "DRAFT" or "Draft" shown on an assigned List
  or an empty Slot; `pwaPurity` holds and the stand-in is PWA-only and badged.

## PROGRESS.md updates

- **Status row** for catch-up Phase 28, and a phase entry with:
  - the drift-check result (items changed or not; OQ-17, OQ-27 and OQ-44 status; whether 17 had run);
  - what was built, with the name map for later phases: `listForSlot` removed in favour of `slotFor` +
    `listInSlot`; `listIdForSlot` renamed `projectedListId`; `ListStatusKey` renamed
    `DisplayStatusKey`; `List.statusKey` replaced by `List.kind` plus the Slot's `availability`;
    `List.startTime`/`endTime`/`coverRequest` moved to the Slot; `generateListsForDates` renamed
    `generateCanvasForDates`; `masters.availability` removed;
  - the `PERSIST_VERSION` bump (from and to);
  - tests added (the golden fixture, `slots.test.ts`, `slotActions.test.ts`, the independence and
    three-app parity tests) and the before and after Vitest and Playwright counts;
  - the review pass.
- **Decisions log:**
  1. **Superseded:** 2026-07-23 "Availability reconciliation, both directions". Availability is held on
     the Slot; nothing is "restatused"; a Slot holding a List keeps the List's kind and is
     conflict-flagged when marked unavailable or on leave; marking it available writes no conflict.
  2. **Superseded:** the reassign mechanism (4th review #6 and the Phase 06 entry: free target, absorb,
     regenerate the vacated slot, default Unavailable). The List moves between Slots, keeps its id, and
     the vacated Slot returns to available by default (US-01.4.1).
  3. **Superseded:** Phase 06 decision (5), the grid display-status derivation from cards or a hospital.
     One pure `displayStatusKey(slot, list)` for all three apps (US-01.2.3). Handoff item P5 is closed.
  4. **Amended:** 2026-07-23 "Deterministic IDs". Slots `S-<reg>-<date>-<session>`; projected Lists keep
     the birth-slot `L-...` form (never parsed); runtime Lists `LG####`; no regenerated Lists. The
     Phase 02 entry's "always resolve slots via `listForSlot`" note is replaced by `slotFor` +
     `listInSlot`.
  5. **New:** the status vocabulary is a labelled simplification until OQ-17 and OQ-27 are answered
     (availability: available, unavailable, holiday; List kind: private, public, pre-op); the six-colour
     design language is kept by deriving the display key.
  6. **New:** default AM and PM times are one settings record (`masters.slotSettings`); overrides live on
     the Slot and travel with a reassigned List.
  7. **New:** the approval state `DRAFT` is shown as "Open"; "Draft List" is reserved for Phase 31.
  8. **New, interim:** assignment onto an unavailable or holiday Slot is refused until Phase 30; the
     post-op addendum creates its List in today's open Slot until Phase 39; a hospital message whose
     target Slot holds no List parks for the office until Phase 33.
  9. **New:** List keeps denormalised `anaesthetistId`, `dateISO` and `session`, kept equal to its Slot's
     by the store and checked by an invariant test.
  Convention 10 ("six statuses ... used by all three apps") stands; note that the key is now derived.
- **Handoff notes:**
  - For **29**: `SlotAvailability` is the set to extend (emergency; on leave vs holiday) and to turn into
    master data; `setAvailability` already writes the Slot; web gets the same control.
  - For **30**: `assignListToSlot`'s `slotNotAvailable` refusal becomes accept-and-flag; availability
    conflicts are not cleared yet; `'adminDay.selectedSlotId'` is ready for "Simulate sickness";
    Permanent List edits need a projection over existing Slots (`generateCanvasForDates` is pure and
    reusable).
  - For **31**: `placeListOnSlot` is the one creation path a Draft List assignment should reuse; the
    pairing rule has three seeded exceptions to resolve (Fitzgerald TBC, pre-op, acute).
  - For **32**: `Slot.coverRequest` is the marker to replace; `moveListToSlot` is the confirm step's move.
  - For **33**: the integration parking rule is the seam for "no silent apply".
  - For **38**: billed Lists and the Slot views are ready for "stay visible".
  - For **39**: remove the addendum's List creation with the addendum.
  - For **44**: S2 Beats 1 to 3 were patched here; re-read them in the rewrite.
