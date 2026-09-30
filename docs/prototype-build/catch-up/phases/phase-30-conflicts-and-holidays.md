# Phase 30 · Conflicts, holidays and the conflict dashboard

**Requirements covered:**
[FT-01.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-01.5.md) Hospital holiday calendar and conflicts ·
[US-01.5.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.5.1.md) Hospital holiday calendar ·
[US-01.5.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.5.2.md) Conflict flagging (Confirmed) ·
[US-01.5.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.5.4.md) Availability conflict dashboard ·
[US-01.3.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.3.2.md) Permanent Lists drive most assignments.
Also touches, without closing:
[US-01.5.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.5.3.md) (the availability calendar, Phase 29; this phase re-homes its conflict writes),
[US-01.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.4.1.md) (reassign, Phase 28's `moveListToSlot`; the dashboard launches it),
[US-13.1.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.1.1.md) (the Day view, related to US-01.5.4; Phase 31 owns its dashboard changes),
[DM-04](../analysis/domain-model-delta.md#dm-04) (its "reconcile logic in setAvailability, conflict flagging and canvas generation change" clause: this phase makes conflicts one derived rule),
[DM-32](../analysis/domain-model-delta.md#dm-32) (the hospital-calendar half only; the statutory holiday master and loads are Phase 42).
No RV finding is closed here. **Open questions:** none blocking.
[OQ-09](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-09.md) (hard block or soft warning) is **Answered: soft warning**, which this phase builds.
[OQ-17](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-17.md) and
[OQ-27](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-27.md) stay open; this phase only reads Phase 29's `isClosed` helper, so their answers do not change it.
**Depends on:** Phase 29 (the Slot status master, `domain/slotStatus.ts` with `isClosed` / `isOpenForBooking`, `setAvailabilityRange`, the mobile and web calendars), and through it Phase 28 (the `Slot` record, Lists created on assignment, `assignListToSlot`, `moveListToSlot`, `placeListOnSlot`, `generateCanvasForDates`, the golden canvas fixture, the `'adminDay.selectedSlotId'` context key). Also Phase 14 (the demo-trigger registry, `useDemoTriggerContext`, `store/demoActors.ts` with `OFFICE_ACTOR` and `OFFICE_SIMULATION_ACTOR` (Phase 28's doc calls the latter `SIMULATED_OFFICE_ACTOR`; use the name the code has), `store/officeStandIn.ts` and the PWA sheet `pwa/PwaDemoActions.tsx`) and Phase 17 (the Master data `?view=` param, the blacklist helper already wired into the reassign picker).
**Estimated:** 1 session nominally, but this is at the top of the one-session range (a `mutate()` change, two pure engines, a new screen, a calendar and two triggers): plan for the split. Session 1 is items 1 to 10 plus the minimal consumer switch named in item 10 (model, rules, seed, store and selectors, with every screen still compiling and rendering), and stops green. Session 2 is items 11 to 19 (screens, triggers, shots, demo guide).

## Goal

Today a conflict is a message stamped onto a List by three code paths: canvas generation and
`addHospitalHoliday` stamp a `holiday` conflict, and `setAvailability` stamps an `availability`
one. Every other path is blind. `editList` and the phone-advice flow set a hospital without checking
its closures, Phase 28 refuses to assign a List onto an unavailable Slot, and "Book (phone advice)"
is offered only on a free empty session. A flag never clears: holidays cannot be edited or deleted,
and there is no clear action. The flag is an amber border and "!" on a block that keeps its status
colour, visible one day at a time. The two seeded Wed 22 conflicts are fabricated messages with no
closure or unavailability behind them. Permanent List edits change nothing on the existing
four-month canvas, weekend templates are silently dropped, and a template cannot be ended.

This phase:

- makes a conflict **one derived rule**, not a stamp. A List conflicts when its hospital is closed on
  its date (a hospital holiday) or its Slot carries a closed availability status (Phase 29's
  `isClosed`). One pure function computes a List's conflicts from those facts, and `mutate()`
  re-runs it for every List whose facts a mutation touched. So **every path raises a conflict**:
  assigning a List, a phone-advice Booking, an edit of the List's hospital, a move, availability set
  on mobile or web, a holiday added or edited, a template projection, a roll-forward, and any path a
  later phase adds (US-01.5.2, AC1 and AC2);
- keeps the warning **soft** (OQ-09): nothing refuses. Assigning or phone-booking onto an unavailable
  Slot, or at a closed hospital, is accepted, flagged, and warned about inline before confirming
  ("Nothing in the flow blocks the admin");
- **clears a conflict** when its clash goes: the hospital's holiday is deleted or moved, the List's
  hospital changes, the anaesthetist marks the Slot available again, or the List is reassigned to an
  available anaesthetist. The office can also **clear it explicitly** with an optional note, and the
  clear holds only while that cause stands (US-01.5.4 "clears once the List is covered or the clash
  is removed");
- **changes the List's colour**. A conflicted block takes the design's amber attention treatment (the
  warning tint and border plus "!"), keeping the List kind's left bar and label so the status still
  reads. There is no new status colour and no new hex (US-01.5.2 "the List changes colour");
- lets the office **edit and delete hospital holidays** (stale flags clear) and see each hospital's
  closures on a **month calendar** as well as the list (US-01.5.1, FT-01.5);
- adds an Admin **Conflicts** screen: every conflict across dates, grouped by day and coloured, with
  reason, anaesthetist, hospital, Slot status and Booking count, filterable, with Reassign, Clear and
  Open actions on each row, and a warn badge in the side nav (US-01.5.4);
- makes **Permanent List edits visibly repopulate the canvas**. Adding, editing, ending or removing a
  template projects it over the existing canvas from tomorrow to the horizon, never disturbing a List
  that carries Bookings or an office edit. The result line counts what changed and links to the next
  affected day. Weekend templates work, and a template can carry an end date (US-01.3.2);
- adds **"Simulate sickness"** to the Demo actions menu on the Admin Day view and the Conflicts
  screen, so a short-notice sickness conflict appears without switching persona, and a PWA-only
  **"Office reassigns this List"** stand-in on the mobile List detail.

## Before you start: drift check

1. Diff the catalogue for this phase's items against the plan's snapshot:

   ```
   git diff 1f067a8 -- "docs/discovery-reference/Updated Requirements/catalogue/requirements/FT-01.5.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-01.5.1.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-01.5.2.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-01.5.4.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-01.3.2.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-01.5.3.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-01.4.1.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/FT-01.3.md" "docs/discovery-reference/Updated Requirements/catalogue/questions/OQ-09.md" "docs/discovery-reference/Updated Requirements/catalogue/questions/OQ-17.md" "docs/discovery-reference/Updated Requirements/catalogue/questions/OQ-27.md" "docs/discovery-reference/Updated Requirements/domain-model.md"
   ```

   If an item changed, re-read it and adjust the work items before planning. If a covered item is now
   Retired or Future, drop it from this phase and say so in the PROGRESS entry. Watch in particular
   for: a definition of "booked List" (this doc reads it as any assigned List, see work item 2), a
   rule for Draft Lists at a closed hospital, a requirement to capture a reason when clearing, and any
   change to US-01.3.2 on how far ahead templates apply.
2. **OQ-09.** Answered "soft warning" at the snapshot. If it has been re-opened or changed to a hard
   block, stop and raise it with the owner before planning: the accept-and-flag paths in work item 6
   invert. If the answer now asks for a captured reason on override (the RFP response's original
   proposal), make the note on "Clear conflict" and the inline assign warning's acknowledgement
   required, and say so in the Decisions log.
3. **OQ-17 / OQ-27.** Nothing to decide here. Conflicts read only Phase 29's `isClosed(status)`, so a
   new vocabulary or a Model B answer does not change this phase's rule. If 29's drift check stopped
   on Model B and availability moved off the Slot, point the conflict facts at wherever availability
   now lives; the rule and the rest of this doc are unchanged.
4. **Baseline.**
   - Confirm Phases 28 and 29 are DONE in PROGRESS.md.
   - From their entries and Decisions-log rows, note the names actually chosen: the Slot type and
     collection (expected `Slot` in `schedule.slots`), the Slot's availability field (expected a
     `SlotStatusKey`), `masters.slotStatuses`, the helpers in `domain/slotStatus.ts`, the display
     helper that replaced `displayStatusKeyForList` (expected `displayStatusKey(slot, list)` in
     `domain/slots.ts`), `listIndexBySlot` / `listInSlot` / `slotViewsForDate` in
     `store/selectors.ts`, `assignListToSlot` and its interim `slotNotAvailable` refusal,
     `moveListToSlot` and its `vacatedAvailability` argument, `placeListOnSlot`,
     `generateCanvasForDates`, `setAvailability` and `setAvailabilityRange`, and 29's
     `describeAvailabilityOutcome`. Use those names throughout; this doc's code references are as at
     the snapshot or as 28 and 29 planned them.
   - Find every place that writes `List.conflicts` today
     (`grep -rn "conflicts" src/store src/domain/seed`): expected `setAvailability` /
     `setAvailabilityRange` (flag and 29's bookable-status clear), `addHospitalHoliday`, the
     reassign/move filter, the generator's holiday stamp and `applyPhase06Conflicts`. Every one of
     them goes in work items 4 and 5.
   - Note the audit codes 29 emits for conflicts. 29's plan writes `list.conflict` on a flag and
     `list.conflictCleared` on its automatic bookable-status clear. This phase reserves
     `list.conflictCleared` for the **office** clear and uses `list.conflictResolved` for an automatic
     one (item 5), so 29's automatic emission (which item 5 removes anyway) and its label are re-pointed
     at `list.conflictResolved`. Grep tests and specs for `conflictCleared` and update them.
   - Note which bar-trigger bodies Phase 14 put where (`store/officeStandIn.ts` for office stand-ins,
     and any file for bar-only simulations), and whether an actor helper for an arbitrary anaesthetist
     exists (14 ships only `SOUTER_ACTOR`).
   - Count the Lists the seed flags today (at the snapshot: Wed 22 Jul 2, Mon 26 Oct 10, Fri 13 Nov
     6) and note which Lists they are, so the seed test in work item 4 can prove the flagged set.
   - Note the current `PERSIST_VERSION` in `src/store/appStore.ts` (13 at the snapshot; 14 to 29 will
     have bumped it) and bump it by one from whatever it is now.

## Reference

**Design files (convention 17):**
- `docs/design/Admin Day.dc.html`: the day grid, the block anatomy (tint background, 3px left bar in
  the status solid, two text lines), the "!" attention badge at the block's top right and the legend's
  "! Needs attention" entry. The mockup draws the badge in the pre-op hue; the build uses
  `semantic.warning` (`#A16207`, tint `#F9F0DC`, on-tint `#7C4D08`) by the Phase 06 decision, so a
  flagged pre-op block stays distinguishable. The conflict colour change extends this treatment: it
  is not a seventh status.
- `docs/design/Design Language.dc.html`: §02 the status colours and "colour is never the only signal",
  the semantic warning trio, §01 teal the only action colour and crimson identity only, radii, pills,
  table and sheet rules.
- `docs/design/Admin Review.dc.html`: the Admin table and header anatomy (title, subtitle, count,
  filter chips, row actions) the Conflicts screen follows.
- `docs/design/Web Availability.dc.html` and `Web Dashboard.dc.html`: the month and day cell
  anatomy Phase 29's calendars used; the hospital holiday calendar reuses it in the Admin chrome.

**Catalogue:** the covered items above; `domain-model.md`, the "Availability conflicts" row of the
changes table (soft warning, the Booking stays, flagged and coloured) and "Slot, List and Draft
List".

**Analysis:**
- `docs/prototype-build/catch-up/GAP-ANALYSIS.md`: theme 4 (Slot, List and Draft List, which includes
  US-01.5.4), the demo-trigger list ("Schedule: Simulate sickness"), and the EP-01 table.
- `docs/prototype-build/catch-up/epics/EP-01.md`: FT-01.5, US-01.5.1, US-01.5.2, US-01.5.4 and
  US-01.3.2 (US-01.3.2 was corrected from Matches to Partial by the verifier; US-01.5.4 is a
  Contradicts because un-blocking wrote a new conflict instead of clearing).
- `docs/prototype-build/catch-up/analysis/domain-model-delta.md` (DM-04, DM-32).
- `analysis/prototype-map-admin.md` (Day grid, List drawer, Master data, flows),
  `prototype-map-store-seed.md` (mutate, lifecycle, masters actions, canvas generator, seed fixups),
  `prototype-map-domain.md`, `prototype-map-shared.md` and `prototype-map-shell-demo-pwa.md` (router,
  side nav, the PWA entry and the registry's PWA sheet).

**Code entry points (as at the snapshot; use 28's and 29's names where they differ):**
- `aa-prototype/src/domain/types.ts`: `ListConflict` (:265, `{ kind: 'availability' | 'holiday';
  message }`), `List.conflicts`, `PermanentList` (:575; `dayOfWeek` 0 to 6, `statusKey` which 28 turns
  into `kind`), `HospitalHoliday` (:602).
- `aa-prototype/src/store/mutate.ts`: `mutate(api, actor, metas, recipe)` (returns `void`; the recipe
  returns a `DomainPatch`; metas may be pushed inside the recipe), `MutationMeta`, `allocateId`,
  `ID_FORMATS` (`holiday: HHN`, `permanentList: PLN`, `list: LG`). `storeDiscipline` enforces that
  only this module raw-writes domain slices.
- `aa-prototype/src/store/lifecycle.ts`: `setAvailability` (:703-830, the flag and the snapshot's
  "Marked available, but ..." conflict, which 28 removes), `reassignList` (:540-630, the
  `retainedConflicts` filter at :583-588, which 28 moves into `moveListToSlot`), `editList` (:490-540).
- `aa-prototype/src/store/mastersActions.ts`: `addHospitalHoliday` (:320-378, the per-path stamp),
  `addPermanentList` / `editPermanentList` (:380-470, "does NOT retro-regenerate", :394-396).
- `aa-prototype/src/store/clockActions.ts`: `rollCanvasForward` (goes through `mutate`, one summary
  audit entry per day).
- `aa-prototype/src/domain/seed/canvas.ts`: the template branch `template !== undefined &&
  !isWeekend` (:119) and the holiday stamp (:155-166); `domain/seed/index.ts`: `applyPhase06Conflicts`
  (:245-290, the two fabricated Wed 22 messages on Rutherford Wed 22 AM at Christchurch Eye Surgery
  and Morrison Wed 22 PM at Southern Cross); `domain/seed/availabilityAndHolidays.ts`
  (`HOSPITAL_HOLIDAYS`: Labour Day Mon 26 Oct and Canterbury Anniversary Fri 13 Nov per hospital);
  `domain/seed/permanentLists.ts` (52 templates at the snapshot, none on a weekend).
- `aa-prototype/src/apps/admin/util.ts`: `attentionReasons(list)` (:111, conflict messages plus
  "Surgeon not yet assigned"), `isBooked`.
- `aa-prototype/src/apps/admin/components/DayGrid.tsx`: `ATTENTION = semantic.warning.solid` (:32),
  the focus filters including "Needs attention" (:105, :216), `GridBlock` (:278-360: background,
  border, the "!" badge, tooltip), the legend. `DayGrid.test.tsx`.
- `aa-prototype/src/apps/admin/components/ListDrawer.tsx`: the "Needs attention" box (:61), the action
  row (Edit list, Reassign list, History, "Book (phone advice)" only when `isFreeEmpty`).
- `aa-prototype/src/apps/admin/flows/`: `AddHolidaySheet.tsx`, `PermanentListSheet.tsx` (offers
  Saturday and Sunday), `ReassignListFlow.tsx` ("Vacated slot becomes", default Unavailable in the UI),
  `PhoneAdviceBooking.tsx`, `EditListSheet.tsx`, `MoveCardFlow.tsx` (28 and 15 rename these; use the
  current names).
- `aa-prototype/src/apps/admin/screens/MasterData.tsx`: `NAV` (:41), `PermanentListsView` (:244,
  subtitle "Edits apply to future generated days"), `HospitalsView` (:274, holiday pills).
- `aa-prototype/src/apps/admin/components/SideNav.tsx` (`NavSection`, warn badges),
  `apps/admin/AdminApp.tsx` (`sectionForPath`, the drawer's local `drawerListId` state),
  `apps/admin/routes.tsx`, `aa-prototype/src/router.tsx` (the `admin` routes, :88-106).
- Other conflict readers: `apps/mobile/screens/AvailabilityScreen.tsx` (:110, the outcome line), 29's
  mobile and web calendars (the amber "!"), `apps/demo/DemoData.tsx` (:336-360, the inspector
  column), `shared/audit/actionLabels.ts` (`list.conflict` "Conflict flagged", `holiday.create`,
  `permanentList.*`) and `fieldLabels.ts` (`conflicts`).
- `aa-prototype/src/shared/demoTriggers/` (Phase 14: `types.ts`, `registry.ts`, `match.ts`,
  `context.ts`), its test (`demoTriggers.test.ts` asserts `/admin/day/2026-07-21` returns no entries,
  which this phase changes), and `src/pwa/pwaPurity.test.ts`.
- Tests to extend: `store/phase06Actions.test.ts` ("Wed-22 advisory conflicts"),
  `domain/seed/seed.test.ts` (:203, holiday flags), 28's `domain/seed/canvasGolden.test.ts` and its
  fixture, `store/lifecycle.test.ts`, 28's `store/slotActions.test.ts`, `store/mastersActions.test.ts`,
  `store/persistMigrate.test.ts`, `shared/audit/auditNarrative.test.ts`; Playwright
  `visual/admin-phase06.spec.ts` (Wed 22 conflicts, :57 and :137) and `visual/admin-phase07.spec.ts`
  (Hospitals & holidays, :100).

## Work items

Build in this order: types, pure rules, seed, store, selectors, then screens. Stop green after item
10 if the phase runs over one session.

1. **Types** (`src/domain/types.ts`):
   - `ListConflict` becomes a fact-based record:
     `{ kind: 'availability' | 'holiday'; cause: string; raisedAtISO: IsoDateTime; holidayId?: string; slotId?: SlotId; statusKey?: SlotStatusKey }`.
     `cause` is a stable key: `holiday:<holidayId>` or `availability:<slotId>:<statusKey>`. The
     stored `message` goes; text is derived (item 2), so renaming a holiday or a status updates every
     flag without a write.
   - `ConflictClear { cause: string; by: string; role: ActorRole; atISO: IsoDateTime; note?: string }`
     and `List.conflictClears?: ConflictClear[]`: an office clear. It holds only while its cause
     stands (item 2).
   - `List.permanentListId?: string`: provenance. The projection (item 3) sets it; any office edit of
     the List's hospital, surgeon, kind or notes through `editList` removes it, so a hand-edited List
     is never overwritten by a template.
   - `PermanentList` gains `effectiveFromISO?: IsoDate` and `effectiveToISO?: IsoDate` (the end date
     of a standing arrangement; US-01.3.2 gap bullet 3).
   - `HospitalHoliday` is unchanged.
2. **Pure conflict rules** (`src/domain/conflicts.ts`, new, no React; Vitest `conflicts.test.ts`):
   - `conflictFactsFor(list, { slot, statuses, holidaysByDateHospital })`: the inputs for one List.
   - `expectedConflicts(list, facts)`: returns the conflicts the List should carry:
     - `holiday` for each hospital holiday matching the List's `hospitalId` and `dateISO`;
     - `availability` when the List's Slot status `isClosed` (29's helper; Available and Available for
       emergency never conflict);
     - none for an AUTHORISED List (locked; nothing left to resolve) or a backdrop List
       (`isBackdropList`), and no `availability` conflict for a List with no Slot (Phase 31's Draft
       Lists, which can still carry a `holiday` one).
     Reading, recorded in the Decisions log: the catalogue's "booked List" is any assigned List,
     with or without Bookings, because under Phase 28 a List exists only once it is assigned. The
     office still has to cover it; the dashboard shows the Booking count so an empty List reads as
     lower priority.
   - `reconcileListConflicts(list, expected, atISO)`: returns `{ next, raised, resolved }`. It keeps
     the `raisedAtISO` of a conflict that persists, stamps new ones, drops any `ConflictClear` whose
     cause is no longer expected (so a clash that goes and comes back flags again), and hides expected
     conflicts that carry a live clear. It returns the same List object when nothing changed.
   - `describeConflict(conflict, lookups)`: `{ reason: 'Hospital closed' | 'Anaesthetist unavailable', detail }`
     for display and audit, for example "Southern Cross is closed: Theatre maintenance closure." and
     "Dr Rutherford is Unavailable for this session. Note: unwell, short notice." Names come
     through a `lookups` argument the caller fills (the store passes `drSurname` from
     `shared/format.ts`, so the domain never imports `shared`). No en or em dashes.
   - `conflictPreview({ dateISO, hospitalId, slot, statuses, holidays })`: the conflicts an
     assignment or phone booking would raise, for the inline warnings in item 15.
   - Tests: each rule and exclusion; emergency and free raise nothing; two holidays at one hospital
     give two conflicts; a clear hides its conflict, survives an unrelated change, and is dropped when
     the cause goes; the cause changes when the status changes from Unavailable to On leave (so a clear
     of one does not hide the other); `reconcileListConflicts` is referentially stable when nothing
     changed.
3. **Pure Permanent List projection** (`src/domain/permanentListProjection.ts`, new; Vitest
   `permanentListProjection.test.ts`; US-01.3.2):
   - `activeOn(template, dateISO)`: honours `effectiveFromISO` / `effectiveToISO`.
   - `projectTemplateChange({ before?, after?, fromISO, toISO, slots, lists, bookingsByList, statuses })`
     returns a plan `{ create, update, remove, kept }`, each entry naming the Slot and List:
     - **create**: a date in range where `after` is active on its weekday, the Slot is empty and
       `isOpenForBooking`. Unavailable, leave and emergency Slots are skipped, matching the
       generator's "leave wins" precedence;
     - **update**: a List with `permanentListId === before.id` (or `after.id`), no active Bookings,
       state DRAFT, and still in a Slot `after` covers: hospital, surgeon, kind, notes and times follow
       `after`;
     - **remove**: a List projected from `before` with no active Bookings and state DRAFT, whose date
       `after` no longer covers (a template ended, removed, or moved to another day, session or
       anaesthetist). Its Slot is left empty and available;
     - **kept**: any List in a covered Slot that carries Bookings, is SUBMITTED or AUTHORISED, has no
       `permanentListId` (office-assigned or hand-edited), or came from another template. Kept Lists
       are never touched, and the plan says why ("has Bookings", "edited by the office").
   - The generator (`domain/seed/canvas.ts`, 28's `generateCanvasForDates`) uses `activeOn`, sets
     `permanentListId` on projected Lists, and **drops the `!isWeekend` guard for templates** (the
     weekend RNG fill is unchanged). No seeded template is on a weekend, so the golden canvas does not
     move for this.
   - Tests: add, edit (hospital change updates empty projected Lists and keeps a booked one), move to
     another weekday (removes and creates), end date (removes after it), a Saturday template projects
     onto Saturdays, leave and unavailable Slots are skipped, an office-edited List is kept, and the
     plan is deterministic.
4. **Seed** (`domain/seed/index.ts`, `availabilityAndHolidays.ts`, `canvas.ts`; US-01.5.2):
   - **Replace `applyPhase06Conflicts` with real facts**, so the seeded conflicts are true and clear
     the way live ones do:
     - Dr Rutherford Wed 22 AM: set the Slot's status to Unavailable with the note "Unwell, short
       notice". His Christchurch Eye Surgery List stays and is flagged. This is the S2 Beat 3 illness
       story, now with a cause behind it;
     - Southern Cross Wed 22 Jul: add a hospital holiday row `{ id: 'HH900', name: 'Theatre maintenance closure' }`
       (a seed id outside the runtime `HHN` prefix). Every non-AUTHORISED List at Southern Cross that
       day is flagged, including Dr Morrison's PM. The seed test pins the exact set (expected
       Morrison PM plus any other Southern Cross List that day; if more than two Lists are hit, name
       them in the PROGRESS entry and the S2 notes).
     Keep Tue 21 pristine (asserted) and every Souter Slot untouched.
   - The generator stops stamping messages. `buildSeed` ends with `reconcileAllConflicts(schedule, masters, atISO)`
     (a pure helper beside item 2 that maps `reconcileListConflicts` over every List), so seeded
     conflicts come from the same rule as runtime ones.
   - Regenerate 28's golden canvas fixture for the `conflicts` column only (shape change) and add an
     assertion that the set of flagged List ids equals the pre-phase set, apart from the Wed 22
     Southern Cross additions. Every other field is unchanged.
   - Seed tests: every seeded conflict equals `expectedConflicts` for its List (no fabricated flag);
     Labour Day and Canterbury Anniversary still flag the same Lists; Rutherford Wed 22 AM and
     Morrison Wed 22 PM are flagged; Tue 21 has none; two builds deep-equal.
   - Bump `PERSIST_VERSION` by one with a comment line ("Phase 30: conflicts derived from facts; Wed
     22 conflicts re-seeded as real facts; Permanent List provenance") and extend
     `persistMigrate.test.ts`.
5. **Store: conflicts are reconciled inside `mutate()`** (`src/store/conflictReconcile.ts`, new, called
   only from `mutate.ts`; US-01.5.2 AC1 and AC2, US-01.5.4 AC2):
   - After the recipe runs, `mutate()` works out which Lists' facts the patch touched: Lists whose
     record changed; Lists in Slots whose record changed (through `listIndexBySlot`); Lists at the
     `(dateISO, hospitalId)` pairs of any holiday added, removed or changed (old and new values);
     every List if `masters.slotStatuses` changed (a status's bookable flag may have moved). It runs
     `reconcileListConflicts` over them, folds the changed Lists into the patch, and appends one meta
     per change to the same commit: `list.conflict` (raised; `after` carries the cause and the
     described detail) and `list.conflictResolved` (the cause went; `after` carries the cause and
     which fact changed). The actor is the mutation's actor.
   - `mutate()` now returns `MutationResult { conflictsRaised: ListId[]; conflictsResolved: ListId[] }`
     instead of `void` (existing callers ignore it), so actions can report counts without computing
     them.
   - **Remove every per-path conflict write** found in the baseline: the flag branch in
     `setAvailability` / `setAvailabilityRange` (29's `flagged` and `cleared` results now come from
     the `MutationResult`, so `describeAvailabilityOutcome` keeps its line), the `retainedConflicts`
     filter in `moveListToSlot` (the availability conflict now resolves because the target Slot is
     available, and a holiday conflict stays because the date and hospital move with the List), and
     the stamp in `addHospitalHoliday`. Keep the outcome shapes callers read.
   - `rollCanvasForward` already goes through `mutate`, so new days reconcile with no extra code; its
     generator output must already agree (item 4), which a test asserts (no `list.conflict` meta on a
     roll unless a fact changed).
   - **Invariant test** (`store/conflictReconcile.test.ts`): run a scripted sequence (block a booked
     Slot, phone-book onto an unavailable Slot, add a holiday, edit it to another date, change a List's
     hospital, reassign, un-block, delete the holiday, roll the clock, edit a Permanent List) and after
     every step assert that every List's stored conflicts equal `expectedConflicts` minus its live
     clears. This is the "no stale flag anywhere" proof. Write it here with the steps today's actions
     support, and extend it as items 6 to 9 land (phone-book onto an unavailable Slot needs item 6,
     holiday edit and delete need item 8, the Permanent List edit needs item 9).
   - Tests: each path raises exactly once and never stacks; un-blocking resolves the conflict (the
     gap's Contradicts case) and writes no new one; reassigning to an available anaesthetist resolves
     the availability conflict and keeps a holiday one; the `MutationResult` counts match; a mutation
     that touches no conflict fact appends no conflict meta; `storeDiscipline` still passes.
6. **Store: accept and flag, never refuse** (28's `slotActions.ts`, `lifecycle.ts`; US-01.5.2 AC1 and
   AC3):
   - `assignListToSlot` loses 28's interim `slotNotAvailable` refusal. Assigning onto an Unavailable,
     On leave (or any closed) Slot creates the List and the reconcile flags it. The phone-advice path
     (assign, then a Booking) inherits this. `slotOccupied` and the other refusals stay.
   - `createBooking` and the Booking move (15's names for `addCard` and `reassignCard`) onto a
     conflicted List are accepted as today; the List stays flagged and the Booking stays (AC1).
   - `editList` removes `permanentListId` when the patch changes hospital, surgeon, kind, notes or
     times (the fields the projection would otherwise overwrite; item 1).
   - Tests: assign onto an unavailable Slot succeeds and flags; phone-book onto it flags once; assign
     at a hospital closed that day flags a `holiday` conflict; each returns `ok`.
7. **Store: office clear and flag again** (`src/store/slotActions.ts` or a new `conflictActions.ts`,
   exported from `store/index.ts`; US-01.5.4 "the conflict clears"):
   - `clearListConflict(api, actor, listId, cause, note?)`: office only; refuses `notFound`,
     `conflictNotFound` (no live conflict with that cause), `alreadyCleared`. Writes a
     `ConflictClear` (clock timestamp) and audits `list.conflictCleared` with the cause, the described
     detail and the note. No reason is required (OQ-09: plain soft warning).
   - `restoreListConflict(api, actor, listId, cause)`: office only; removes the clear so the conflict
     shows again. Audit `list.conflictRestored`.
   - Tests: office-only refusal; clear hides the conflict from the grid selector and the dashboard;
     restore brings it back; a clear is dropped when its cause goes, and the re-raised conflict is
     visible.
8. **Store: hospital holidays can be edited and deleted** (`src/store/mastersActions.ts`; US-01.5.1,
   FT-01.5):
   - `addHospitalHoliday` keeps its signature and refusals, loses its own stamping (item 5), and takes
     `flaggedListCount` from the `MutationResult`.
   - `editHospitalHoliday(api, actor, id, { dateISO?, name? })`: office only; refuses `notFound`,
     `nameRequired`, `dateRequired`, `duplicateHoliday` (same hospital and date as another row).
     The hospital is fixed; moving a closure to another hospital is delete and add. Audit
     `holiday.update` with before and after. Returns `{ flagged, resolved }` from the result.
   - `deleteHospitalHoliday(api, actor, id)`: office only; refuses `notFound`. Removes the row
     (audit keeps its history as `holiday.delete` with the full before), and the reconcile resolves
     every flag it caused. Returns `{ resolved }`.
   - Tests: edit to another date resolves the old date's flags and raises the new date's; rename
     changes the described detail with no conflict meta; delete resolves every flag; each refusal.
9. **Store: Permanent Lists repopulate the canvas** (`src/store/mastersActions.ts`; US-01.3.2):
   - `addPermanentList`, `editPermanentList`, new `endPermanentList(api, actor, id, endISO)` and new
     `removePermanentList(api, actor, id)` each compute `projectTemplateChange` over tomorrow (the day
     after the demo clock's today) to the horizon end, then apply the template change and the plan in
     **one** `mutate()`:
     - created Lists go through 28's `placeListOnSlot` (audit `list.create` with
       `after.source: 'permanentList'`);
     - updates audit `list.update`;
     - removals audit `list.remove` (a new action code; the List record is deleted and its Slot left
       empty). Only projected, empty, DRAFT Lists are ever removed;
     - the template change audits `permanentList.create`, `.update`, `.end` or `.remove`.
     The reconcile then flags any projected List at a closed hospital.
   - Each returns `{ created, updated, removed, kept: { listId, reason }[], firstAffectedDateISO? }`.
   - Validation: the refusals already in place, plus `invalidRange` (end before start) and
     `endInPast` (an end date before today). `removePermanentList` removes the template row; its
     audit history stays.
   - Delete the "does NOT retro-regenerate" comments and replace them with the new rule.
   - Tests: editing a Monday template's surgeon updates every future empty projected Monday List and
     keeps the one with Bookings (Bookings, List id and history unchanged); moving it to Tuesday
     removes the empty Monday Lists and creates Tuesday ones; ending it removes the empty Lists after
     the end date; a Saturday template creates Saturday Lists; nothing before tomorrow changes; one
     audit batch per call.
10. **Selectors** (`src/store/selectors.ts`):
    - `conflictRows(state, { fromISO, toISO, reason?, hospitalId?, anaesthetistId?, includeCleared? })`:
      one row per live conflict (and per cleared one when asked), with List, Slot, anaesthetist,
      hospital, surgeon, Slot status key, active Booking count, cause, described reason and detail,
      and the clear if any. Sorted by date, session, then anaesthetist roster order. Memoised on the
      `schedule.lists`, `schedule.slots` and `masters` record references, like 28's indexes.
    - `openConflictCount(state, fromISO)`: live conflicts from today to the horizon, for the side-nav
      badge.
    - `hospitalMonth(state, hospitalId, monthISO)`: each date with its closures, the number of Lists
      at that hospital and how many are conflicted, for the calendar in item 13.
    - Tests for the filters, the sort, the cleared toggle and the counts.
    - **Minimal consumer switch (so session 1 stops green):** item 1 removes `ListConflict.message`,
      so every reader must move to `describeConflict` in this session: `attentionReasons` in
      `apps/admin/util.ts` (hiding cleared conflicts), `AvailabilityScreen.tsx`, 29's mobile and web
      calendars, `DemoData.tsx`, and the `list.conflictResolved` / `list.conflictCleared` /
      `list.conflictRestored` labels in `actionLabels.ts`. Items 11 and 17 then finish the visual and
      copy work on top.
11. **Admin Day grid and List drawer** (`apps/admin/components/DayGrid.tsx`, `ListDrawer.tsx`,
    `apps/admin/util.ts`; US-01.5.2 "the List changes colour"):
    - `attentionReasons` reads `describeConflict` for conflicts (hidden when cleared) and keeps
      "Surgeon not yet assigned".
    - **Conflict colour.** A block with a live conflict takes `semantic.warning.tint` as its background
      and a 1.5px `semantic.warning.solid` border. The left bar stays the List kind's solid, l1 stays
      the hospital, and l2 becomes the short reason ("Hospital closed" or "Anaesthetist unavailable";
      the surgeon moves to the tooltip and the drawer). The "!" badge stays. A block that needs
      attention only for a missing surgeon keeps today's border and badge on its status tint, so the
      two read differently. No new token and no new hex.
    - **Legend.** Add "Conflict" (a warning-tint swatch with the "!" badge) beside "Needs attention".
      The "Needs attention" focus filter still includes conflicts; add a "Conflicts" focus chip that
      shows only conflicted blocks.
    - **Drawer.** The attention box lists each conflict with its reason and detail and, for the office,
      a "Clear conflict" link per conflict that opens a small sheet (optional note, teal "Clear"). A
      cleared conflict shows as one muted line ("Cleared by Kirsty, 10:40: theatre confirmed running")
      with "Flag again". The drawer header shows the Slot's availability chip beside the List's kind
      when the Slot is closed.
    - **Book on a closed Slot.** "Book (phone advice)" is offered on any empty Slot, not only a free
      one. On an unavailable, leave or emergency Slot, the phone-advice sheet opens with an inline
      warning ("Dr Sharma is Unavailable for this session. The Booking will be accepted and flagged
      as a conflict.").
    - **Reassign from a conflict.** When the source Slot is closed, `ReassignListFlow`'s "Vacated Slot
      becomes" defaults to **Keep as is** (the sick anaesthetist stays Unavailable), passed to
      `moveListToSlot` as the Slot's current status. The targets stay 28's available empty Slots, with
      17's blacklist warning.
    - `DayGrid.test.tsx`: a conflicted block renders the warning tint and the reason line; a
      surgeon-only block does not; the Conflicts chip filters.
12. **Admin Conflicts screen** (`apps/admin/screens/ConflictsScreen.tsx`, new; route
    `/admin/conflicts` in `router.tsx` and `AdminConflictsRoute` in `apps/admin/routes.tsx`; US-01.5.4):
    - **Side nav:** a "Conflicts" item after "Day view", with an amber warn badge from
      `openConflictCount` (the billing-monitor badge tone). `NavSection` and `sectionForPath` gain it.
    - **Header:** "Conflicts" with the subtitle "Booked Lists where the hospital is closed or the
      anaesthetist is unavailable. Bookings stay in place; reassign to cover, or clear." and the live
      count.
    - **Filters** (chips and selects in the Admin Review header pattern): Reason (All · Hospital closed
      · Anaesthetist unavailable), When (From today · Next 2 weeks · Whole canvas · Include past),
      Hospital, Anaesthetist, and a "Show cleared" toggle. Filter state lives in the URL
      (`?reason=&when=&hospital=&anaesthetist=&cleared=1`, replace navigation, like the Day view's
      `?sort=`).
    - **Body:** grouped by date ("Wed 22 Jul · 3 conflicts"), a table per group in `tableChrome`: a
      3px warning left bar on each row; Session; Anaesthetist; Hospital; Surgeon; Reason as a warning
      pill with "!" and the detail beneath; Slot status chip; Bookings (mono count); actions. Cleared
      rows sit muted with the clear's who, when and note.
    - **Row actions** (teal text actions): **Reassign** opens `ReassignListFlow` in place (disabled
      with the reason on an AUTHORISED List); **Clear** opens the clear sheet; **Open** opens the same
      `ListDrawer` over the screen (the drawer stays local state, as in the Day view); **Day** navigates
      to `/admin/day/<date>`. A reassign or a clear updates the table in place, and a resolved row
      leaves it with a short confirmation line ("Conflict cleared: Dr Sharma now covers Wed 22 AM").
    - **Empty state:** "No conflicts in this range." with the filters still showing.
    - Desktop layout inside the Admin content width; no responsive work.
13. **Master data: holiday edit, delete and calendar** (`apps/admin/screens/MasterData.tsx`,
    `AddHolidaySheet.tsx` renamed `HolidaySheet.tsx`; US-01.5.1, FT-01.5):
    - `HospitalsView`:
      - holiday pills become buttons that open `HolidaySheet` in edit mode;
      - the subtitle becomes "Each hospital keeps its own closure calendar. A closure flags every List
        at that hospital on that date; editing or deleting it clears the flags.";
      - a "List · Calendar" segmented control switches the view.
    - **Calendar mode:** a hospital select, then a Monday-first month grid bounded by the canvas
      horizon, with previous and next controls. Reuse Phase 29's web month-grid cell anatomy if it
      factored into a shared piece; otherwise add `apps/admin/components/MonthGrid.tsx`. Each cell
      shows:
      - the date numeral (mono);
      - a closure as a `status/holiday` tint block carrying its name;
      - the number of Lists at that hospital that day, and a warning "!" with the conflict count when
        closed.
      Clicking an open day opens `HolidaySheet` in add mode for that date; clicking a closure opens it
      in edit mode.
    - **`HolidaySheet`** (through `useSurface().Overlay`):
      - add mode: hospital, date, name, as today;
      - edit mode: hospital shown fixed, date and name editable, a teal "Save changes" and a secondary
        "Delete holiday" behind a confirmation that states the flag count ("Deleting Theatre
        maintenance closure clears 2 flagged Lists.");
      - result lines from the outcomes: "Holiday updated. 1 List flagged, 2 flags cleared." or
        "Holiday deleted. 2 flags cleared."
14. **Master data: Permanent lists** (`MasterData.tsx` `PermanentListsView`, `PermanentListSheet.tsx`;
    US-01.3.2):
    - The table gains "Runs" (from and to dates, or "Ongoing") and an "Ended" state for past-ended
      templates (muted, below the active ones). The Status column shows the kind as a `StatusChip`,
      not the raw key.
    - The sheet gains optional "Starts" and "Runs until" dates. Saturday and Sunday now work. Edit mode
      gains "End arrangement" (date, default today) and "Remove" (confirmation states how many empty
      Lists go and that Lists with Bookings stay).
    - Subtitle: "Weekly templates. Saving applies to the canvas from tomorrow: empty Lists are added or
      updated, and Lists with Bookings or office edits are left as they are."
    - After a save, the sheet shows the result: "Applied to 17 future Mondays: 14 Lists added, 1
      updated, 2 kept (have Bookings)." and a "Show on day grid" link to `firstAffectedDateISO`. The
      kept rows expand to list their dates and reasons.
15. **Inline conflict warnings in the office pickers** (the Assign List, phone-advice, Edit list and
    Move Booking flows; US-01.5.2 AC3):
    - Each flow calls `conflictPreview` for its target and shows a warning callout
      (`semantic.warning` tint) before confirm, for example "Southern Cross is closed on Wed 22 Jul
      (Theatre maintenance closure). The List will be flagged." In hospital selects, a closed
      hospital's option reads "Southern Cross · closed".
    - Confirm stays enabled; nothing blocks.
16. **Demo triggers** (`src/shared/demoTriggers/registry.ts`; bodies in `src/store` so the PWA import
    closure stays pure):
    - `simulate-sickness` and the PWA stand-in `office-reassigns-list`, as specified in "Demo
      triggers" below.
    - Bodies: `simulateSickness(api, listId)` (new, beside Phase 14's other bar-only simulation bodies,
      or a new `store/demoSimulations.ts` if 14 has none) and `reassignAsSimulatedOffice(api, listId)`
      in `store/officeStandIn.ts` beside `authoriseAsSimulatedOffice`. Both return an `Outcome` and go
      through the existing store actions (`setAvailability`, `moveListToSlot`), so the reconcile and
      audit need no extra code.
    - The sickness actor is the List's anaesthetist (role anaesthetist, source `mobile`). If 14 ships
      only `SOUTER_ACTOR`, add `anaesthetistActor(anaesthetistId)` to `store/demoActors.ts` (name from
      the roster via `shared/format.ts`, no new identity data).
    - After the stand-in runs, the mobile List detail must not strand the user on a List that is no
      longer theirs: the sheet's success message shows, then the screen returns to the Lists tab (or
      shows the screen's existing "not on your schedule" state if it has one). Check the handset
      route's behaviour and test it.
    - Update `demoTriggers.test.ts`: `/admin/day/2026-07-21` now includes `simulate-sickness` (alongside any entry earlier phases put
      there, such as 27's "Move to 2 days before procedure"; the Phase 14 "returns none" assertion
      is already gone or goes now);
      `/admin/conflicts` returns it; the stand-in is PWA-only and visible only on a conflicted List.
    - A test per body: sickness on a booked Slot raises one availability conflict with the note and
      appears in `conflictRows`; a second press on the same List is disabled ("Already unavailable");
      the stand-in resolves the conflict and the List leaves the anaesthetist's schedule.
17. **Other consumers and audit copy**:
    - `AvailabilityScreen.tsx` and 29's calendars read the new conflict shape (a live, uncleared
      conflict shows the amber "!"); the outcome copy keeps "a conflict was flagged for the office".
    - `DemoData.tsx` shows cause, reason and any clear in its conflicts column.
    - `actionLabels.ts`:
      - `list.conflict` "Conflict raised";
      - `list.conflictResolved` "Conflict resolved";
      - `list.conflictCleared` "Conflict cleared by the office" (29 used this code for its automatic
        clear; that case is now `list.conflictResolved`, see the baseline);
      - `list.conflictRestored` "Conflict flagged again";
      - `list.remove` "List removed";
      - `holiday.update` "Holiday changed";
      - `holiday.delete` "Holiday deleted";
      - `permanentList.end` "Permanent list ended";
      - `permanentList.remove` "Permanent list removed".
    - `fieldLabels.ts`: `conflictClears`, `permanentListId`, `effectiveFromISO`, `effectiveToISO`.
      `auditNarrative.test.ts` must pass.
    - Check for stragglers: `grep -rn "\.message" src | grep -i conflict` and
      `grep -rn "conflicts:" src/store src/domain` return only the reconcile module, the seed helper
      and tests.
18. **Playwright** (`npm run shots`):
    - Re-point `visual/admin-phase06.spec.ts` at the Wed 22 facts (the drawer names the Southern
      Cross closure and Rutherford's unavailability) and `admin-phase07.spec.ts` at the new Hospitals
      view.
    - Add `visual/conflicts-phase30.spec.ts` with `data-shot` hooks for:
      - the Wed 22 Day grid showing the conflict colour and legend;
      - the Conflicts screen with its default filter;
      - the drawer's Clear sheet;
      - Simulate sickness from the Demo actions menu, then the new row on the Conflicts screen;
      - reassign from a row, and the row leaving;
      - the hospital calendar with a closure;
      - the holiday edit sheet;
      - the Permanent List result line.
    - Keep `pwa-device.spec.ts` passing, and add the stand-in to it if that spec opens the PWA demo
      sheet.
19. **Finish green:**
    - `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots`;
    - `pwaPurity.test.ts` still passes (`domain/conflicts.ts`, `domain/permanentListProjection.ts` and
      the trigger bodies import nothing from `apps/admin`, `apps/demo` or `shell`);
    - `persistMigrate.test.ts` covers the bumped version.

## Demo triggers

| id | Label | Screen (routes) | Surfaces | Effect | Disabled when |
|---|---|---|---|---|---|
| `simulate-sickness` | Simulate sickness | Admin · Day view (`/admin/day/:dateISO`) and Admin · Conflicts (`/admin/conflicts`) | bar | `choices`: the viewed day's non-AUTHORISED, non-backdrop Lists (the day in the URL; on Conflicts, the demo clock's today), labelled "Dr Rutherford · AM · Christchurch Eye Surgery", Lists with Bookings first. 28's published `'adminDay.selectedSlotId'` preselects the open drawer's List. `run`: `simulateSickness(api, listId)`, which calls `setAvailability` as that anaesthetist (actor source `mobile`, so the audit reads as the anaesthetist calling in sick) to the seeded Unavailable status with the note "Unwell, short notice (simulated)". The reconcile raises the conflict. Message: "Dr Rutherford marked Unavailable for Wed 22 AM. 1 conflict raised; it is on the Conflicts screen." | no eligible List that day ("No Lists on this day"); the chosen List's Slot already closed (`isClosed`) ("Already unavailable") |
| `office-reassigns-list` | Office reassigns this List | Mobile · List detail (`/mobile/lists/:listId`) | pwa | `badge: 'office-stand-in'`. `when`: the List in the URL has a live availability conflict. `run`: `reassignAsSimulatedOffice(api, listId)`, which calls `moveListToSlot` as `OFFICE_SIMULATION_ACTOR` to the first colleague (roster order) with an open (`isOpenForBooking`) Slot that day and session, skipping a pairing 17's blacklist helper warns on, and keeping the vacated Slot's status. Message: "The office reassigned this List to Dr Hughes. It has left your schedule." | no open colleague Slot that session ("No colleague is free for this session") |

**Normal use, no button:** adding, editing and deleting a hospital holiday (Admin · Master data ·
Hospitals & holidays), a Permanent List change, the office clear, reassigning from the Conflicts
screen, and an anaesthetist blocking a booked session on mobile or web (29's calendar). Nothing is
added to the Control Panel page. Its "Demo actions by screen" index picks up `simulate-sickness`
automatically. `indexPath` is `/admin/day/2026-07-22` (the Wed 22 conflicts day) for sickness and
`null` for the PWA stand-in, which is listed as "Shown in the installed PWA".

**PWA:** the handset's only office-dependent beat is "I blocked a booked session; now what?", and
the office's answer is a reassignment. `office-reassigns-list` stands in for it on the List detail,
where the blocked List is. It is off unless its `when` holds, and it carries the office-stand-in
badge. It is not added to the framed build's bar, because the presenter can switch to Admin there.

## Out of scope

- **Draft Lists**, their waiting flag and assignment to a free Slot, and the pairing rule: Phase 31.
  The engine already handles a List with no Slot (holiday conflicts only); 31 decides whether a Draft
  List at a closed hospital shows on the Conflicts screen.
- **The Day dashboard's booking counts and Draft List panel** (US-13.1.1): Phase 31. This phase only
  adds the conflict colour, the legend entry and the Conflicts chip to the grid.
- **Swap requests** and the anaesthetist's own cover flow: Phase 32.
- **Hospital-download changes** (a message that sets a hospital) raise conflicts automatically
  through `mutate()`, but the matching screen is Phase 33.
- **A statutory public-holiday master** shared by every hospital, bulk holiday loads, and editing
  hospitals themselves: Phase 42 (DM-32). Each hospital keeps its own rows here.
- **A captured reason on clearing or on an accept-and-flag assignment**: OQ-09 answered "plain soft
  warning"; the note is optional.
- **Notifying the anaesthetist or surgeon** of a conflict, and the update email: Phase 35 (the mailto
  draft) and the Future notification items.
- **Recurring or fortnightly template patterns**, template approval, and the "80%" measurement: the
  catalogue asks for a weekly pattern only.
- **Conflict presentation in the anaesthetist apps** beyond Phase 29's calendar "!" and the existing
  outcome line. The requirement is office-facing.
- **Retroactive changes to AUTHORISED Lists**: the engine skips them.

## Manual test checklist

- [ ] Reset. Admin, Day view, Tue 21 Jul: no conflicts. The Demo actions pill shows "Simulate
  sickness". Dr Fitzgerald's PM "Surgeon TBC" block (attention only, no conflict) keeps its status
  tint with the "!" and border, as before.
- [ ] Wed 22 Jul: Dr Rutherford's AM Christchurch Eye Surgery block and Dr Morrison's PM Southern
  Cross block (and any other Southern Cross List that day) draw in the amber conflict colour with the
  kind's left bar, a "!" and a reason line. The legend shows "Conflict", and the Conflicts chip shows
  only those blocks.
- [ ] Open Rutherford's drawer: the conflict reads "Dr Rutherford is Unavailable for this session.
  Note: unwell, short notice." and the header shows the Unavailable Slot chip.
- [ ] Conflicts in the side nav, with an amber badge: the screen groups Wed 22, Mon 26 Oct and Fri 13
  Nov by date, each row with reason, anaesthetist, hospital, Slot status and Booking count. The
  filters narrow the rows and survive a reload (URL).
- [ ] From Rutherford's row, Reassign to Dr Sharma. The vacated Slot defaults to "Keep as is". The
  row leaves the screen and the badge drops by one. On the Day grid the List sits in Sharma's AM with
  its Bookings and no conflict, and Rutherford's AM reads Unavailable.
- [ ] Clear Morrison's conflict with the note "Theatre confirmed running". It leaves the default view,
  shows under "Show cleared" with who, when and the note, and "Flag again" restores it.
- [ ] Master data, Hospitals & holidays: click Southern Cross's "Theatre maintenance closure" pill and
  move it to Thu 23 Jul. The Wed 22 Southern Cross flags clear (including the cleared one), Thu 23's
  Southern Cross Lists are flagged, and the result line counts both. Delete it: every one of its
  flags clears.
- [ ] Switch to Calendar, Southern Cross, October: Labour Day shows as a holiday block with its List
  and conflict counts. Click an open day and add a closure: its Lists flag at once on the Day grid
  and the Conflicts screen.
- [ ] Demo actions, Simulate sickness on Wed 22, pick a booked List: a new conflict appears on the
  grid and on Conflicts, with "(simulated)" in the note and the audit reading as the anaesthetist. A
  second press on the same List is disabled.
- [ ] As Souter on mobile (or web), block a booked session, then set it back to Available: the
  conflict appears, then resolves, with no leftover message and one audit entry for each.
- [ ] Phone advice on Sharma's Unavailable Slot (after the step above, or any Unavailable Slot):
  "Book (phone advice)" is offered, the warning says the Booking will be flagged, the Booking saves,
  and the List is flagged.
- [ ] Edit list on a flagged List and change its hospital to one not closed that day: the holiday
  conflict resolves. Pick a closed hospital: the select says "closed" and the save flags it.
- [ ] Permanent lists: change a Monday template's surgeon. The result line counts the added, updated
  and kept Lists, and "Show on day grid" opens Mon 27 Jul with the new surgeon on an empty projected
  List, while a Monday List with Bookings is unchanged. Add a Saturday template: Saturdays fill. End a
  template next month: its empty Lists after the end date go.
- [ ] PWA build (`npm run build:pwa`, preview at phone size): block a booked session, open that List,
  and the demo sheet offers "Office reassigns this List" with the office-stand-in badge. Running it
  moves the List to a colleague and it leaves the schedule.
- [ ] S2 Beats 1 to 4 still run (Beat 3 now resolves a visible conflict).
- [ ] No en or em dash in any new copy, no crimson on any new control, teal the only action colour,
  and every conflicted block still carries its label.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots` are all green.

## Demo guide updates

In the same session (each phase patches the beats it touches):
- `docs/demo-guide/03-demo-script.md`:
  - **S2 Beat 3 (illness cover):** start on **Conflicts**. Rutherford's Wed 22 AM row shows
    "Anaesthetist unavailable, unwell, short notice". Reassign from the row to Dr Sharma, keeping the
    vacated Slot Unavailable. The row leaves and the badge drops. Then open Sharma AM, then History.
    Update Click, Say ("A sickness is a conflict, not a crisis. The Bookings stay, the List turns
    amber, and the office covers it from one screen instead of a printed report.") and Expected.
    Retire the "free-target, absorb and regenerate" sentence if Phase 28 has not already.
  - **S2, optional Beat 3a:** Demo actions, Simulate sickness on today's grid, then show the new row
    on Conflicts. Then Master data, Hospitals & holidays, and move or delete the Southern Cross
    closure to show the flags clearing.
  - **S2 Discovery points:** replace "whether availability/holiday conflicts are hard constraints or
    warnings" with "settled: soft warning (OQ-09); open: whether a clear should need a reason, and
    whether an empty List counts as a conflict".
  - **Direct URLs:** add `/admin/conflicts`.
- `docs/demo-guide/04-presenter-cheat-sheet.md`:
  - section 6 (availability and holiday conflicts): answered soft warning; the List changes colour;
    it clears when the clash goes or the office clears it; the Conflicts screen spans every date;
  - one line on Permanent Lists repopulating the canvas.
- `docs/demo-guide/02-workflows-and-handoffs.md`:
  - the canvas workflow (lines 70 to 79): a Permanent List or holiday change now reapplies at once,
    and conflicts clear;
  - the cover workflow step 3 ("Kirsty sees the conflict"): on the Conflicts screen.
- `docs/demo-guide/01-personas-and-responsibilities.md`: Kirsty's "reconcile conflicts" duty (line 132)
  names the Conflicts screen, and the holiday-maintenance duty names edit and delete.
- `docs/demo-guide/master-demo-guide.html`: mirror the same S2 edits, discovery points, Direct URLs
  row and cheat-sheet lines, word for word.
- **Control Panel scenario text** (`apps/demo/DemoControlPanel.tsx`, the S2 blurb, :387): "reassign Dr
  Rutherford's conflicted AM ..." becomes "from Conflicts, reassign Dr Rutherford's AM ... to Dr Sharma
  (vacated Slot kept Unavailable)". No trigger is added to the page.
- Not a milestone phase, so no full consistency read. Check the patched sections match the run sheet.

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
- **One rule, every path.** No store action writes `List.conflicts` itself; only the reconcile inside
  `mutate()` and the seed helper do. Hunt for a path that changes a List's hospital, date or Slot, a
  Slot's status, a holiday or the status master without the reconcile seeing it, including
  roll-forward, the integration interim, 15's Booking paths and 28's move. The invariant test must
  cover them.
- **Soft means soft.** Nothing refuses because of a closure or unavailability: assign, phone advice,
  Booking create and move, edit and reassign all return `ok` and flag. Warnings appear before
  confirm and never disable it.
- **Clearing is correct.** Un-blocking, deleting or moving a holiday, changing the hospital and
  reassigning to an available anaesthetist each resolve exactly the right conflict. A holiday
  conflict survives a reassign. An office clear holds only while its cause stands; a clash that goes
  and comes back flags again. No stale message survives anywhere (grid, drawer, dashboard, mobile,
  web, inspector).
- **Templates never disturb booked work.** The projection never touches a List with Bookings, a
  SUBMITTED or AUTHORISED List, an office-edited List, or anything before tomorrow. Removals are only
  of empty projected DRAFT Lists. Weekend templates and end dates work. The generator and the
  projection agree (a fresh generation equals a projection over empty Slots).
- **The colour change stays in the design language.** Only `semantic.warning` tokens; no new hex; the
  kind's left bar and label remain; the attention-only case reads differently; crimson and teal never
  mark a conflict; the Conflicts screen is a real desktop table in the Admin chrome.
- **Seed truth and determinism.** Every seeded conflict has a fact behind it. The flagged set is
  unchanged apart from the documented Wed 22 additions. Tue 21 and Souter are pristine. Timestamps
  come from the clock. The golden fixture moved only in its conflicts column. `PERSIST_VERSION` is
  bumped.
- **Trigger scope.** "Simulate sickness" appears only on the Day view and Conflicts, acts on the
  day's real Lists, and is disabled with a reason. The PWA stand-in is PWA-only, badged, visible only
  on a conflicted List, and its body sits inside the PWA import closure.

## PROGRESS.md updates

- **Status row** for catch-up Phase 30, and a phase entry with:
  - the drift-check result (items changed or not, OQ-09 still answered, the 28 and 29 names used);
  - what was built, per work item;
  - the seed's flagged-List set before and after;
  - the `PERSIST_VERSION` bump (from and to);
  - tests added (including the invariant test);
  - the review pass.
- **Decisions log:**
  1. **Conflicts are derived from facts and reconciled inside `mutate()`.** `ListConflict` holds a
     cause and references, not a message. This supersedes the per-path stamping of the 2026-07-23
     "Availability reconciliation, both directions" entry and the Phase 06 decision (1)'s seeding. The
     soft-warning reading of Phase 06 (1) is now the catalogue's answer (OQ-09).
  2. **A conflicted List changes colour:** the warning tint and border, keeping the kind's left bar and
     label. This amends Phase 06 decision (1) (border and badge only).
  3. **"Booked List" means any assigned List**, with or without Bookings. AUTHORISED and backdrop Lists
     never conflict.
  4. **An office clear holds only while its cause stands**, needs no reason (OQ-09), and can be undone
     with "Flag again".
  5. **Assigning or phone-booking onto a closed Slot is accepted and flagged.** This supersedes 28's
     interim `slotNotAvailable` refusal.
  6. **Reassigning from a closed Slot keeps the vacated Slot's status by default.**
  7. **The Wed 22 seeded conflicts are real facts** (Rutherford Unavailable, a Southern Cross closure).
     This replaces `applyPhase06Conflicts`.
  8. **Permanent List changes project over the existing canvas from tomorrow**, never touching Lists
     with Bookings or office edits. Weekend templates and end dates are supported. This supersedes the
     Phase 07 "edits apply to future generated days, no retro-regeneration" behaviour.
  9. **Hospital holidays can be edited and deleted.** The hospital of a holiday row is fixed.
- **Handoff notes:**
  - For **31**: Draft Lists get `holiday` conflicts from the same engine; decide whether they show on
    Conflicts. Draft List assignment onto a closed Slot is accept-and-flag, like `assignListToSlot`.
    The Day dashboard can reuse `conflictRows` for a count.
  - For **32**: a confirmed swap goes through `moveListToSlot`, so its conflicts reconcile with no
    extra code.
  - For **33**: hospital rows that set a hospital or date raise conflicts through `mutate()`; the
    matching screen can show `conflictPreview` before applying a row.
  - For **35**: the update email could list a conflict; nothing is wired.
  - For **42**: `HolidaySheet`, `editHospitalHoliday` and `deleteHospitalHoliday` are the pattern for
    the statutory holiday master; a loader row is one `addHospitalHoliday`.
  - For **44**: S2 Beat 3 now starts on Conflicts, and optional Beat 3a uses Simulate sickness.
