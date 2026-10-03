# Phase 30 · Conflicts, holidays and the conflict dashboard

**Requirements covered:**
[FT-01.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-01.5.md) Hospital holiday calendar and conflicts (Confirmed) ·
[US-01.5.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.5.1.md) Hospital holiday calendar (Confirmed) ·
[US-01.5.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.5.2.md) Conflict flagging (Verify, OQ-81) ·
[US-01.5.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.5.4.md) Availability conflict dashboard (Proposed, OQ-81) ·
[US-01.3.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.3.2.md) Recurring bookings drive most assignments (Verify, OQ-81).
At `3d3a18c` US-01.5.2, US-01.5.4 and US-01.3.2 were rewritten (the 2026-10-02 meetings with Greg):
the conflict flag now covers **hospital closures** and **Bookings that land on a session already
marked unavailable**; a recurring booking that lands on an unavailable session becomes a **Draft
List** with no anaesthetist (OQ-81 part 2, built in Phase 31); an anaesthetist who marks a booked
session unavailable **returns the List to the office or assigns it to a colleague** (US-01.5.5, built
in Phase 32), so it is no longer a conflict. Short-notice sickness is the one case still open (OQ-81
part 3). US-01.3.2 adds that a recurring booking creates its List across the horizon before any
Bookings exist, and that the anaesthetist's calendar is painted first. FT-01.5 and US-01.5.1 are now
Confirmed.
Also touches, without closing:
[US-01.5.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.5.3.md) (the availability calendar, Phase 29; this phase re-homes its conflict writes),
[US-01.5.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.5.5.md) (mark unavailable while holding a List: return or assign, **Phase 32**; until then an anaesthetist blocking a booked session is flagged by this phase's rule, an interim),
[US-01.1.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.1.1.md) and [FT-01.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-01.1.md) (Phase 28's stored Slots and configurable horizon, which the recurring-booking projection reads; the painting order is asserted here),
[US-01.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.4.1.md) (reassign, Phase 28's `moveListToSlot`; the dashboard launches it; the on-demand update email picked from the change history is Phase 35's, D19),
[FT-01.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-01.6.md) and [US-01.6.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.6.1.md) (Draft Lists, Phase 31, which also turns a recurring clash into a Draft List: this phase's projection hands it the skipped closed sessions),
[US-01.3.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.3.1.md) (the pairing rule, Phase 31, which refuses an incomplete recurring booking at save),
[US-13.1.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.1.1.md) (the Day view, related to US-01.5.4; Phase 31 owns its dashboard changes),
[DM-04](../analysis/domain-model-delta.md#dm-04) (its "reconcile logic in setAvailability, conflict flagging and canvas generation change" clause: this phase makes conflicts one derived rule),
[DM-32](../analysis/domain-model-delta.md#dm-32) (the hospital-calendar half only; the statutory holiday master and loads are Phase 42).
No RV finding is closed here.
**Open questions:**
[OQ-09](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-09.md) (hard block or soft warning) is **answered: soft warning**, which this phase builds.
[OQ-17](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-17.md) and
[OQ-27](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-27.md) are **answered** (2026-10-01): every active anaesthetist has AM and PM Slots and the Slot holds the availability status. This phase reads only Phase 29's `isClosed` helper.
[OQ-64](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-64.md) (the logical model) is **answered** (owner decision D14, 2026-10-02): a Slot is a status container a List goes into; every Slot is stored across the horizon; statuses are a user-maintained list with a fixed ID and an editable label and colour (Phase 29), so the conflict rule keys on the status's ID and closed flag and the copy reads its label; "slot" is never said in the UI (say session, AM or PM); and marking unavailable a Slot that holds a List offers return to the office or assign to a colleague (Phase 32), not a conflict.
[OQ-81](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-81.md) (which calendar wins when Lists are generated) is **open, parts 1 and 2 settled in the room**: (1) the anaesthetist's availability is painted first, then the surgeons' recurring bookings, which this phase's generator and projection follow and a test asserts; (2) a recurring booking on an unavailable session becomes a Draft List, which is **Phase 31's** (until then it is not painted, today's behaviour); (3) short-notice sickness is **still open**. Its recommendation for an anaesthetist-marked sickness is the return-or-assign path (Phase 32); a sickness the **office records** (the anaesthetist phones in) is built here as a conflict with the Bookings left in place, as the 2026-09-29 meeting said. That one reading is provisional and sits on the "For the owner's review" list.
**Depends on:** Phase 29 (the Slot status master, `domain/slotStatus.ts` with `isClosed` / `isOpenForBooking`, `setAvailabilityRange`, the mobile and web calendars), and through it Phase 28 (the `Slot` record, Lists created on assignment, `assignListToSlot`, `moveListToSlot`, `placeListOnSlot`, `generateCanvasForDates`, the horizon setting, the golden canvas fixture, the `'adminDay.selectedSlotId'` context key). Also Phase 14 (the demo-trigger registry, `useDemoTriggerContext`, `store/demoActors.ts` with `OFFICE_ACTOR`), Phase 15a (the Admin Day right rail's To-do card and the Booking warning outline) and Phase 17 (the Master data `?view=` param, the blacklist helper already wired into the reassign picker).
**Estimated:** 1 session nominally, but this is at the top of the one-session range (a mechanical rename, a `mutate()` change, two pure engines, a new screen, a calendar and a trigger): plan for the split. Session 1 is items 1 to 11 plus the minimal consumer switch named in item 11 (the rename, model, rules, seed, store and selectors, with every screen still compiling and rendering), and stops green. Session 2 is items 12 to 20 (screens, trigger, shots, demo guide).

## Goal

Today a conflict is a message stamped onto a List by three code paths: canvas generation and
`addHospitalHoliday` stamp a `holiday` conflict, and `setAvailability` stamps an `availability`
one. Every other path is blind. `editList` and the phone-advice flow set a hospital without checking
its closures, Phase 28 refuses to assign a List onto an unavailable Slot, and "Book (phone advice)"
is offered only on a free empty session. A flag never clears: holidays cannot be edited or deleted,
and there is no clear action. The flag is an amber border and "!" on a block that keeps its status
colour, visible one day at a time. The two seeded Wed 22 conflicts are fabricated messages with no
closure or unavailability behind them. The office's standing arrangements are still called
"Permanent lists" (the catalogue says **recurring bookings**), their edits change nothing on the
existing canvas, weekend patterns are silently dropped, and one cannot be retired.

At `3d3a18c` the catalogue narrowed what a conflict is (US-01.5.2, US-01.5.4): a **booked List whose
hospital is closed**, or a **Booking that lands on a session its anaesthetist has already marked
unavailable**. Two clashes are no longer conflicts and are not built here: a recurring booking
landing on an unavailable session becomes a Draft List (OQ-81 part 2, Phase 31), and an anaesthetist
marking a booked session unavailable chooses to return the List to the office or hand it to a
colleague (US-01.5.5, Phase 32). Short-notice sickness is still open (OQ-81 part 3): when the
**office** records it, the List keeps its Bookings and shows as a conflict.

This phase:

- makes a conflict **one derived rule**, not a stamp. A List conflicts when its hospital is closed on
  its date (a hospital holiday) or it sits in a Slot whose status is closed (Phase 29's `isClosed`,
  keyed on the status's fixed ID). One pure function computes a List's conflicts from those facts, and
  `mutate()` re-runs it for every List whose facts a mutation touched. So **every path that can put a
  List or a Booking on a clash raises it**: assigning a List, a phone-advice Booking, a Booking
  create or move, an edit of the List's hospital, a reassign, the office recording a sickness, a
  holiday added or edited, a recurring-booking projection, a roll-forward, and any path a later phase
  adds (US-01.5.2 AC1 and AC2);
- keeps the warning **soft** (OQ-09): nothing refuses. Assigning or phone-booking onto an unavailable
  session, or at a closed hospital, is accepted, flagged, and warned about inline before confirming
  ("Nothing in the flow blocks the admin");
- **clears a conflict** when its clash goes: the hospital's holiday is deleted or moved, the List's
  hospital changes, the session is marked available again, or the List is reassigned to an
  available anaesthetist. The office can also **clear it explicitly** with an optional note, and the
  clear holds only while that cause stands (US-01.5.4 "clears once the List is covered or the clash
  is removed");
- **changes the List's colour**. A conflicted block takes the design's amber attention treatment (the
  warning tint and border plus "!"), keeping the List kind's left bar and label so the status still
  reads. There is no new status colour and no new hex (US-01.5.2 "the List changes colour");
- lets the office **edit and delete hospital holidays** (stale flags clear) and see each hospital's
  closures on a **month calendar** as well as the list (US-01.5.1, FT-01.5, both Confirmed);
- adds an Admin **Conflicts** screen: every conflict across dates, grouped by day and coloured, with
  reason, anaesthetist, hospital, session status and Booking count, filterable, with Reassign, Clear
  and Open actions on each row, and a warn badge in the side nav. It lists exactly the two kinds the
  catalogue keeps: hospital closures, and Bookings on an unavailable anaesthetist's List (including an
  office-recorded sickness). Recurring clashes and returned Lists are Draft Lists and show on Phase
  31's Draft List view, not here (US-01.5.4 AC3);
- **renames Permanent Lists to recurring bookings** in code and copy (US-01.3.2): the standing
  intersection of a hospital, an anaesthetist and a surgeon on a day of the week and a session, all
  five making the arrangement (Phase 31's pairing rule refuses an incomplete one at save). A
  recurring booking is a pattern of Lists, not a Booking for one patient, and the copy says so;
- makes a recurring booking **create its Lists across the horizon before any Bookings exist**: on
  each roll-forward the new far-edge day gets its recurring Lists, empty, and an add or edit projects
  over the existing canvas from tomorrow to the far end of Phase 28's configurable horizon (four
  months in current practice) through **"Apply to canvas now"**, never disturbing a List that
  carries Bookings or an office edit. The anaesthetist's calendar is painted first (OQ-81 part 1): a
  session already closed is skipped, and the plan names those sessions so Phase 31 can turn them into
  Draft Lists. A view-level "Apply to canvas now" re-paints every active recurring booking onto
  sessions that have come free. The result line counts what changed and links to the next affected
  day. Weekend patterns work, a recurring booking can carry start and end dates, and one can be
  **retired** (US-01.3.2);
- adds **"Simulate sickness"** to the Demo actions menu on the Admin Day view and the Conflicts
  screen: the anaesthetist phones in sick and the office records it, so a sickness conflict appears
  with its Bookings in place (OQ-81 part 3, provisional).

## Before you start: drift check

1. Diff the catalogue for this phase's items against the plan's snapshot:

   ```
   git diff 3d3a18c -- "docs/discovery-reference/Updated Requirements/catalogue/requirements/FT-01.5.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-01.5.1.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-01.5.2.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-01.5.4.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-01.3.2.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-01.5.3.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-01.5.5.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-01.1.1.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/FT-01.1.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-01.4.1.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/FT-01.3.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-01.3.1.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/FT-01.6.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-01.6.1.md" "docs/discovery-reference/Updated Requirements/catalogue/questions/OQ-09.md" "docs/discovery-reference/Updated Requirements/catalogue/questions/OQ-17.md" "docs/discovery-reference/Updated Requirements/catalogue/questions/OQ-27.md" "docs/discovery-reference/Updated Requirements/catalogue/questions/OQ-64.md" "docs/discovery-reference/Updated Requirements/catalogue/questions/OQ-81.md" "docs/discovery-reference/Updated Requirements/domain-model.md"
   ```

   If an item changed, re-read it and adjust the work items before planning. If a covered item is now
   Retired or Future, drop it from this phase and say so in the PROGRESS entry. Watch in particular
   for: a change to what counts as a conflict (US-01.5.2 and US-01.5.4 now keep hospital closures and
   Bookings on an unavailable anaesthetist's List only), a rule for Draft Lists at a closed hospital,
   a requirement to capture a reason when clearing, a change to who may edit a recurring arrangement
   (US-01.3.2's note says it is not settled; this phase builds office editing in Admin Master data
   only), and the title's "most" (Donald doubted it; the title is unchanged at `3d3a18c`).
2. **OQ-09.** Answered "soft warning" at the snapshot. If it has been re-opened or changed to a hard
   block, stop and raise it with the owner before planning: the accept-and-flag paths in work item 7
   invert. If the answer now asks for a captured reason on override (the RFP response's original
   proposal), make the note on "Clear conflict" and the inline assign warning's acknowledgement
   required, and say so in the Decisions log.
3. **OQ-81.** Open at the snapshot, with parts 1 (calendar first) and 2 (recurring clash becomes a
   Draft List, Phase 31) settled in the room and part 3 (short-notice sickness) open. If part 3 is now
   answered:
   - "the office records it as a conflict, Bookings in place": build as planned and drop the
     provisional label on `simulate-sickness` and the owner's-review line;
   - "it takes the return-or-assign path whoever marks it": the office-recorded sickness is still an
     office write of the Slot status, so the conflict rule is unchanged; re-word `simulate-sickness`
     to stage the anaesthetist's own unavailability and leave the outcome to Phase 32 (until 32 lands
     it flags, as every closed-Slot List does), and say so in the Decisions log.
   If part 2 has been reversed (a recurring clash is accepted and flagged after all), the projection
   paints closed sessions instead of skipping them and the reconcile flags them; tell Phase 31 in the
   handoff.
4. **OQ-64** is Answered (D14) at the snapshot. Conflicts read only Phase 29's `isClosed(status)` on
   the status's fixed ID, so a renamed or recoloured status changes only the described text. If
   availability has moved off the Slot, point the conflict facts at wherever it now lives; the rule
   and the rest of this doc are unchanged.
5. **Baseline.**
   - Confirm Phases 28 and 29 are DONE in PROGRESS.md.
   - From their entries and Decisions-log rows, note the names actually chosen: the Slot type and
     collection (expected `Slot` in `schedule.slots`), the Slot's availability field (expected a
     `SlotStatusKey`, the status's fixed ID), `masters.slotStatuses`, the helpers in
     `domain/slotStatus.ts`, the seeded Unavailable status's fixed ID, the display helper that
     replaced `displayStatusKeyForList` (expected `displayStatusKey(slot, list)` in
     `domain/slots.ts`), `listIndexBySlot` / `listInSlot` / `slotViewsForDate` in
     `store/selectors.ts`, `assignListToSlot` and its interim `slotNotAvailable` refusal,
     `moveListToSlot` with its `vacatedStatus` argument and its `targetNotOpen` refusal of a closed
     target, `placeListOnSlot`, `isOpenSlot`, `generateCanvasForDates`, 28's horizon setting and its
     reader (the far end of the canvas), `setAvailability` and `setAvailabilityRange` (and whether
     they accept an office actor; Phase 29 allowed it in the store with no Admin UI), 29's
     `clearAvailability`, `createAvailabilitySeries`, `deleteAvailabilitySeries`, `availabilityClash`
     and `describeAvailabilityOutcome`, and 29's shared per-Slot write helper. Use those names
     throughout; this doc's code references are as at the plan's code snapshot or as 28 and 29
     planned them.
   - List every Permanent List identifier and string for the rename in work item 1:
     `grep -rniE "permanent ?lists?|permanentList|PERMANENT_LISTS" src visual` (the bare word
     "permanent" also hits unrelated comments in `DockSpacer.tsx`, `ReviewScreen.tsx` and
     `theme/global.css`; leave those). When this plan was written: `domain/types.ts` (`PermanentList`
     :585), `domain/clock.ts`, `domain/seed/canvas.ts`, `domain/seed/index.ts`,
     `domain/seed/permanentLists.ts`, `domain/seed/seed.test.ts` (:159), `store/mastersActions.ts`
     and its test, `store/mutate.ts` (`ID_FORMATS.permanentList: PLN`, :77), `store/index.ts`,
     `store/selectors.ts` (the master counts, :862 and :882), `store/clockActions.ts`,
     `store/canvasRoll.test.ts`, `shared/audit/actionLabels.ts` (:59 to :60),
     `apps/admin/screens/MasterData.tsx`, `apps/admin/flows/PermanentListSheet.tsx` and
     `apps/demo/DemoControlPanel.tsx` (:137); plus what 28 and 29 added (`PermanentList.kind`, 29's
     usage count in `validateSlotStatusDraft`).
   - Find every place that writes `List.conflicts` today
     (`grep -rn "conflicts" src/store src/domain`): expected 29's `availabilityClash` and every
     Slot-status path that calls it (`setAvailability`, `setAvailabilityRange`, `clearAvailability`,
     `createAvailabilitySeries`, `deleteAvailabilitySeries`, instance edits, and the roll-forward
     series write), 28's `placeListOnSlot` (`closedHospitalConflict`), `addHospitalHoliday`, the
     reassign/move filter, the generator's holiday stamp and `applyPhase06Conflicts`. Every one of
     them goes in work items 5 and 6.
   - Note the audit codes 29 emits for conflicts. 29's plan writes `list.conflict` on a flag and
     `list.conflictCleared` on its automatic bookable-status clear. This phase reserves
     `list.conflictCleared` for the **office** clear and uses `list.conflictResolved` for an automatic
     one (item 6), so 29's automatic emission (which item 6 removes anyway) and its label are re-pointed
     at `list.conflictResolved`. Grep tests and specs for `conflictCleared` and update them.
   - Note which bar-trigger bodies Phase 14 put where (`store/officeStandIn.ts` for office stand-ins,
     and any file for bar-only simulations).
   - Note where 15a's To-do card sits in the Admin Day right rail and its component name (expected
     `WarningsToDo` in `RightRail.tsx`), for the conflicts line in item 13, and how 15a draws its
     Booking-warning outline on a Day-grid block (item 12 layers on it).
   - Count the Lists the seed flags today (when this plan was written: Wed 22 Jul 2, Mon 26 Oct 10,
     Fri 13 Nov 6) and note which Lists they are, so the seed test in work item 5 can prove the
     flagged set.
   - Note the current `PERSIST_VERSION` in `src/store/appStore.ts` (16 when this plan was updated,
     after 15a session 1; later phases will have bumped it) and bump it by one from whatever it is
     now.

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

**Catalogue:** the covered items above, plus US-01.5.5 and OQ-81; `domain-model.md`, the
"Availability conflicts" row of the changes table (soft warning; a hospital closure, or a Booking on a
Slot already marked unavailable; a recurring clash becomes a Draft List; return-or-assign for the
anaesthetist; the calendar painted first; sickness open), the "Permanent Lists and List templates" row
(recurring bookings), the "Two Lists per active anaesthetist" row, "Slot, List and Draft List" (a
recurring booking creates its List at the far end of the rolling schedule, before any Bookings), and
the glossary's "Recurring booking" entry; the notes `catalogue/notes/2026-10-01-aa-meeting-with-greg.md`
points 42 to 44, `2026-10-02-aa-meeting-with-greg.md` points 5, 27, 28 and 45 (Slots stored and
painted, recurring bookings creating empty Lists, return or assign) and
`2026-10-02-aa-requirements-review-with-greg.md` point 1 (OQ-81: painting order and the recurring
clash) and the US-01.3.2 and US-01.5.4 points it cites.

**Analysis:**
- `docs/prototype-build/catch-up/GAP-ANALYSIS.md`: theme 1 (Schedule rebuilt on Slot, List and Draft
  List), the "Demo-trigger buttons" list ("Other: ... Apply to canvas now (US-01.3.2)"; "Simulate
  sickness" comes from US-01.5.4's gap entry in `gaps.json` and EP-01), the "Remove or rework"
  stale-copy line ("Permanent lists"), and the EP-01 table.
- `docs/prototype-build/catch-up/epics/EP-01.md` and `gaps.json`: FT-01.5 and US-01.5.1 (Partial: no
  holiday edit or delete, so a flag never clears; no re-check when a Booking or hospital is added),
  US-01.5.2 (Contradicts: no flag on a Booking or hospital edit, no colour change, a recurring clash
  silently overridden, block-while-booked leaving a flagged List; the last two are 31's and 32's),
  US-01.5.4 (Partial: no cross-date view, holiday flags never clear, the Draft List hand-off absent,
  which is 31's) and US-01.3.2 (Contradicts: the wrong term, no painting of the existing horizon, no
  retire, hospital and surgeon optional, weekday only, and no Draft List for a recurring clash, which
  is 31's). US-01.5.5 (Contradicts, Phase 32) for the block-while-booked copy this phase corrects.
- `docs/prototype-build/catch-up/analysis/domain-model-delta.md` (DM-04, DM-32).
- `analysis/prototype-map-admin.md` (Day grid, List drawer, Master data, flows),
  `prototype-map-store-seed.md` (mutate, lifecycle, masters actions, canvas generator, seed fixups),
  `prototype-map-domain.md`, `prototype-map-shared.md` and `prototype-map-shell-demo-pwa.md` (router,
  side nav, the PWA entry and the registry's PWA sheet).

**Code entry points (as at the plan's code snapshot; use 28's and 29's names where they differ):**
- `aa-prototype/src/domain/types.ts`: `ListConflict` (:265, `{ kind: 'availability' | 'holiday';
  message }`), `List.conflicts` (:313), `PermanentList` (:585; `dayOfWeek` 0 to 6, nullable
  `hospitalId` and `surgeonId`, `statusKey` which 28 turns into `kind`), `HospitalHoliday` (:612).
- `aa-prototype/src/store/mutate.ts`: `mutate(api, actor, metas, recipe)` (returns `void`; the recipe
  returns a `DomainPatch`; metas may be pushed inside the recipe), `MutationMeta`, `allocateId`,
  `ID_FORMATS` (`holiday: HHN`, `permanentList: PLN` at :77, `list: LG`). `storeDiscipline` enforces that
  only this module raw-writes domain slices.
- `aa-prototype/src/store/lifecycle.ts`: `setAvailability` (:698-830, the flag at :810 and the
  snapshot's "Marked available, but ..." conflict, which 28 removes), `reassignList` (:543-630, the
  `retainedConflicts` filter at :583, which 28 moves into `moveListToSlot`), `editList` (:491-541).
- `aa-prototype/src/store/mastersActions.ts`: `addHospitalHoliday` (:320-385, the per-path stamp at
  :342 to :360), `addPermanentList` / `editPermanentList` (:394-470, "it does NOT retro-regenerate",
  :394).
- `aa-prototype/src/store/clockActions.ts`: `rollCanvasForward` (goes through `mutate`, one summary
  audit entry per day; it reads `masters.permanentLists`).
- `aa-prototype/src/domain/seed/canvas.ts`: the precedence comment (:7 to :18: availability rows
  take the Slot first, which is OQ-81 part 1's order), the template branch `template !== undefined &&
  !isWeekend` (:119) and the holiday stamp (:156-168); `domain/seed/index.ts`: `applyPhase06Conflicts`
  (:269, called at :370; the two fabricated Wed 22 messages on Rutherford Wed 22 AM at Christchurch
  Eye Surgery and Morrison Wed 22 PM at Southern Cross); `domain/seed/availabilityAndHolidays.ts`
  (`HOSPITAL_HOLIDAYS`: Labour Day Mon 26 Oct and Canterbury Anniversary Fri 13 Nov per hospital);
  `domain/seed/permanentLists.ts` (`PERMANENT_LISTS`, rows with ids `PL001` up, none on a weekend;
  several acute public rows have no surgeon and the pre-op rows no hospital, which Phase 31's pairing
  rule completes).
- `aa-prototype/src/apps/admin/util.ts`: `attentionReasons(list)` (:111, conflict messages plus
  "Surgeon not yet assigned"), `isBooked` (:101).
- `aa-prototype/src/apps/admin/components/DayGrid.tsx`: `ATTENTION = semantic.warning.solid` (:32),
  the focus filters including "Needs attention" (:216), `GridBlock` (:278-360: background, the border
  at :289, the "!" badge at :349, the "$" prepayment badge at :355, tooltip), the legend.
  `DayGrid.test.tsx`.
- `aa-prototype/src/apps/admin/components/ListDrawer.tsx`: `isFreeEmpty` (:41), the "Needs attention"
  box (:63), the action row (Edit list, Reassign list, History, "Book (phone advice)" only when
  `isFreeEmpty`, :110).
- `aa-prototype/src/apps/admin/flows/`: `AddHolidaySheet.tsx`, `PermanentListSheet.tsx` (offers
  Saturday and Sunday; titles "Add permanent list" / "Edit permanent list"), `ReassignListFlow.tsx`
  ("Vacated slot becomes", default Unavailable in the UI at the snapshot; 28 makes it Free and 29
  reads `defaultSlotStatus`; its "slot" copy becomes "session" here if 28 has not already),
  `PhoneAdviceBooking.tsx`, `EditListSheet.tsx`, `MoveBookingFlow.tsx` (28 may rename these; use the
  current names).
- `aa-prototype/src/apps/admin/screens/MasterData.tsx`: `NAV` (the entity `permanentLists` at :31,
  labelled "Permanent lists" at :44), `PermanentListsView` (:244, subtitle at :253 "... Edits apply to
  future generated days.", button "Add permanent list"), `HospitalsView` (:275, holiday pills).
- `aa-prototype/src/apps/admin/components/SideNav.tsx` (`NavSection`, warn badges),
  `apps/admin/AdminApp.tsx` (`sectionForPath`, the drawer's local `drawerListId` state),
  `apps/admin/routes.tsx`, `aa-prototype/src/router.tsx` (the `admin` routes, :88-106),
  `apps/admin/components/RightRail.tsx` (15a's To-do card).
- Other conflict readers: `apps/mobile/screens/AvailabilityScreen.tsx` (:110 to :111, the outcome
  line "a conflict was flagged and the office notified", which claims a notification that does not
  exist; US-01.5.5's gap), 29's mobile and web calendars (the amber "!"), `apps/demo/DemoData.tsx`
  (:338-360, the inspector column), `shared/audit/actionLabels.ts` (`list.conflict` "Conflict flagged"
  at :52, `permanentList.create` / `.update` at :59 to :60, `holiday.create` at :61) and
  `fieldLabels.ts` (`conflicts`).
- `aa-prototype/src/apps/demo/DemoControlPanel.tsx` (:137, "new far edge days generate from
  Permanent Lists").
- `aa-prototype/src/shared/demoTriggers/` (Phase 14: `types.ts`, `registry.ts`, `match.ts`,
  `context.ts`), its test (`demoTriggers.test.ts` :89 asserts `/admin/day/2026-07-21` returns no
  entries, which this phase changes), `store/demoActors.ts` (`OFFICE_ACTOR` :13,
  `OFFICE_SIMULATION_ACTOR` :30) and `src/pwa/pwaPurity.test.ts`.
- Tests to extend: `store/phase06Actions.test.ts` ("Wed-22 advisory conflicts", :281),
  `domain/seed/seed.test.ts` (:159, the 80% share; :203, holiday flags), 28's
  `domain/seed/canvasGolden.test.ts` and its fixture, `store/lifecycle.test.ts`, 28's
  `store/slotActions.test.ts`, `store/mastersActions.test.ts`, `store/canvasRoll.test.ts`,
  `store/persistMigrate.test.ts`, `shared/audit/auditNarrative.test.ts`; Playwright
  `visual/admin-phase06.spec.ts` (Wed 22 conflicts, :57 and :137) and `visual/admin-phase07.spec.ts`
  (Hospitals & holidays, :100, and any Permanent lists step).

## Work items

Build in this order: the rename, types, pure rules, seed, store, selectors, then screens. Stop green
after item 11 if the phase runs over one session.

1. **Rename Permanent List to recurring booking** (code and copy; US-01.3.2, domain model "Permanent
   Lists and List templates").
   Do it first, alone, as a mechanical rename with no behaviour change, and re-green
   (`npm run build`, `npx vitest run`) before item 2 so the diff stays reviewable:
   - type `PermanentList` → `RecurringBooking`; `masters.permanentLists` → `masters.recurringBookings`;
     `CanvasMasters.permanentLists` → `recurringBookings`; the selectors' master count;
   - seed file `domain/seed/permanentLists.ts` → `recurringBookings.ts`, `PERMANENT_LISTS` →
     `RECURRING_BOOKINGS`, seed ids `PL001` up → `RB001` up; `ID_FORMATS.permanentList: PLN` →
     `recurringBooking: RBN` and its counter (check `ID_FORMATS` for a clash first and pick another
     pair if `RB` / `RBN` is taken);
   - store actions and types `addPermanentList`, `editPermanentList`, `NewPermanentListFields`,
     `PermanentListPatch` → `addRecurringBooking`, `editRecurringBooking`,
     `NewRecurringBookingFields`, `RecurringBookingPatch`, re-exported from `store/index.ts`;
   - audit codes `permanentList.create` / `.update` → `recurringBooking.create` / `.update`
     ("Recurring booking added", "Recurring booking updated"); the `PERSIST_VERSION` bump in item 5
     reseeds, so no old audit row needs mapping;
   - admin: `PermanentListSheet.tsx` → `RecurringBookingSheet.tsx`, `PermanentListsView` →
     `RecurringBookingsView`, the Master data entity key `permanentLists` → `recurringBookings`
     (and its `?view=` value in whatever form 17 chose), nav label "Recurring bookings", sheet
     titles "Add recurring booking" / "Edit recurring booking";
   - copy: `DemoControlPanel.tsx` :137 ("new far edge days generate from recurring bookings"), every
     doc comment (`types.ts`, `clock.ts`, `canvas.ts`, `clockActions.ts`, the seed header), test
     names (the seed's "roughly 80% ... from recurring bookings");
   - wherever the word could be read as a patient Booking, the copy names it in full ("recurring
     booking", never "booking" alone), and the Master data subtitle says it is a pattern of Lists,
     not a Booking for one patient.
   Done when `grep -rniE "permanent ?lists?|permanentList|PERMANENT_LISTS" src visual` and
   `grep -rn "'PLN'" src` find nothing but this phase's Decisions-log pointer comment (if any).
2. **Types** (`src/domain/types.ts`):
   - `ListConflict` becomes a fact-based record:
     `{ kind: 'availability' | 'holiday'; cause: string; raisedAtISO: IsoDateTime; holidayId?: string; slotId?: SlotId; statusKey?: SlotStatusKey }`.
     `cause` is a stable key: `holiday:<holidayId>` or `availability:<slotId>:<statusKey>`. The
     stored `message` goes; text is derived (item 3), so renaming a holiday or a status updates every
     flag without a write.
   - `ConflictClear { cause: string; by: string; role: ActorRole; atISO: IsoDateTime; note?: string }`
     and `List.conflictClears?: ConflictClear[]`: an office clear. It holds only while its cause
     stands (item 3).
   - `List.recurringBookingId?: string`: provenance. The projection (item 4) sets it; any office edit
     of the List's hospital, surgeon, kind, notes or times through `editList` removes it, so a
     hand-edited List is never overwritten by a recurring booking.
   - `RecurringBooking` gains `effectiveFromISO?: IsoDate` and `effectiveToISO?: IsoDate` (the start
     and end dates of a standing arrangement) and `retiredAtISO?: IsoDateTime` (set by
     `retireRecurringBooking`, item 10, with `effectiveToISO` its last date). A retired recurring
     booking stays in the master for its history and never projects again.
   - `HospitalHoliday` is unchanged.
3. **Pure conflict rules** (`src/domain/conflicts.ts`, new, no React; Vitest `conflicts.test.ts`):
   - `conflictFactsFor(list, { slot, statuses, holidaysByDateHospital })`: the inputs for one List.
   - `expectedConflicts(list, facts)`: returns the conflicts the List should carry:
     - `holiday` for each hospital holiday matching the List's `hospitalId` and `dateISO`;
     - `availability` when the List's Slot status `isClosed` (29's helper; a bookable status, the
       seeded Free or any bookable status an admin adds, never conflicts);
     - none for an AUTHORISED List (locked; nothing left to resolve) or a backdrop List
       (`isBackdropList`, which lives in `store/selectors.ts`: the domain may not import the store,
       so move the predicate into `domain/` and re-export it from `selectors.ts`, or pass the flag in
       through the facts), and no `availability` conflict for a List with no Slot (Phase 31's Draft
       Lists, which can still carry a `holiday` one).
     Reading, recorded in the Decisions log: the catalogue's "booked List" (US-01.5.2 AC2, US-01.5.4
     AC1) is any assigned List, with or without Bookings, because under Phase 28 a List exists only
     once it is assigned and a recurring booking creates its List before any Bookings exist
     (US-01.3.2). The office still has to cover or cancel it; the dashboard shows the Booking count so
     an empty List reads as lower priority.
   - `reconcileListConflicts(list, expected, atISO)`: returns `{ next, raised, resolved }`. It keeps
     the `raisedAtISO` of a conflict that persists, stamps new ones, drops any `ConflictClear` whose
     cause is no longer expected (so a clash that goes and comes back flags again), and hides expected
     conflicts that carry a live clear. It returns the same List object when nothing changed.
   - `describeConflict(conflict, lookups)`: `{ reason: 'Hospital closed' | 'Anaesthetist unavailable', detail }`
     for display and audit, for example "Southern Cross is closed: Theatre maintenance closure." and
     "Dr Rutherford is marked Unavailable for this session. Note: unwell, short notice." The status word is
     the status's current label from Phase 29's master (the cause keeps its fixed ID), so relabelling
     a status updates every line. Names come through a `lookups` argument the caller fills (the store
     passes `drSurname` from `shared/format.ts`, so the domain never imports `shared`). No en or em
     dashes, and never the word "slot".
   - `conflictPreview({ dateISO, hospitalId, slot, statuses, holidays })`: the conflicts an
     assignment or phone booking would raise, for the inline warnings in item 16.
   - Tests: each rule and exclusion; Free and any other bookable status raise nothing; two holidays at one hospital
     give two conflicts; a clear hides its conflict, survives an unrelated change, and is dropped when
     the cause goes; the cause changes when the status changes from Unavailable to Holiday (so a clear
     of one does not hide the other); `reconcileListConflicts` is referentially stable when nothing
     changed.
4. **Pure recurring-booking projection** (`src/domain/recurringBookingProjection.ts`, new; Vitest
   `recurringBookingProjection.test.ts`; US-01.3.2):
   - `activeOn(recurringBooking, dateISO)`: honours `effectiveFromISO` / `effectiveToISO` (a retired
     one is inactive after its last date).
   - `projectRecurringBookingChange({ before?, after?, fromISO, toISO, slots, lists, bookingsByList, statuses })`
     returns a plan `{ create, update, remove, kept, skipped }`, each entry naming the Slot and List.
     `toISO` is the far end of Phase 28's horizon setting (four months in current practice), never a
     constant:
     - **create**: a date in range where `after` is active on its weekday, the Slot is empty and
       `isOpenForBooking`. The new List holds no Bookings (US-01.3.2 AC1);
     - **skipped**: a date `after` covers whose Slot is closed (Unavailable, Holiday or any other
       closed status). The anaesthetist's calendar is painted first (OQ-81 part 1), so the recurring
       booking does not paint there. Each entry carries the Slot and its status key. This is the
       recurring clash that becomes a Draft List with no anaesthetist (OQ-81 part 2, US-01.3.2 AC2,
       US-01.5.2 AC3): **Phase 31** turns `skipped` entries into Draft Lists; here they are counted
       in the preview and result lines and nothing else happens;
     - **update**: a List with `recurringBookingId === before.id` (or `after.id`), no active
       Bookings, state DRAFT, and still in a Slot `after` covers: hospital, surgeon, kind, notes and
       times follow `after`;
     - **remove**: a List projected from `before` with no active Bookings and state DRAFT, whose date
       `after` no longer covers (retired, ended, or moved to another day, session or anaesthetist).
       Its Slot is left empty and available;
     - **kept**: any List in a covered Slot that carries Bookings, is SUBMITTED or AUTHORISED, has no
       `recurringBookingId` (office-assigned or hand-edited), or came from another recurring
       booking. Kept Lists are never touched, and the plan says why ("has Bookings", "edited by the
       office").
   - `projectAllRecurringBookings({ recurringBookings, fromISO, toISO, slots, lists, bookingsByList, statuses })`:
     the plan for the view-level "Apply to canvas now" (item 10). For every active recurring booking
     it creates onto empty open Slots it covers and updates its own untouched projected Lists that
     have drifted from it; it never removes; it reports `skipped` the same way. It is the union of
     `projectRecurringBookingChange` with `before === after` for each, so the two cannot disagree.
   - The generator (`domain/seed/canvas.ts`, 28's `generateCanvasForDates`) uses `activeOn`, sets
     `recurringBookingId` on projected Lists, paints the anaesthetist's availability before
     recurring bookings (today's "availability rows take the Slot first" precedence, now named as
     OQ-81 part 1 in its header comment), and **drops the `!isWeekend` guard for recurring bookings**
     (the weekend RNG fill is unchanged). So the roll-forward creates each recurring booking's List
     on the new far-edge day, empty, before any Bookings exist (US-01.3.2, domain model "Slot, List
     and Draft List"). No seeded recurring booking is on a weekend, so the golden canvas does not
     move for this.
   - Tests: add, edit (hospital change updates empty projected Lists and keeps a booked one), move to
     another weekday (removes and creates), retire (removes the empty projected Lists after its last
     date, keeps booked ones), a Saturday recurring booking projects onto Saturdays, Holiday and
     Unavailable Slots are `skipped` (never created), an office-edited List is kept, the painting
     order (a session marked unavailable before the projection runs stays unavailable and is
     skipped), every created List has no Bookings, `toISO` follows the horizon setting,
     `projectAllRecurringBookings` over a freshly generated canvas is empty apart from `skipped`
     (generator and projection agree), and the plan is deterministic.
5. **Seed** (`domain/seed/index.ts`, `availabilityAndHolidays.ts`, `canvas.ts`; US-01.5.2):
   - **Replace `applyPhase06Conflicts` with real facts**, so the seeded conflicts are true and clear
     the way live ones do:
     - Dr Rutherford Wed 22 AM: set the Slot's status to the seeded Unavailable status with the note
       "Unwell, short notice", as a sickness **the office recorded** after he phoned in (if 29's Slot
       records who set its status, the office). His Christchurch Eye Surgery List stays with its
       Bookings and is flagged. This is the S2 Beat 3 illness story, now with a cause behind it, and
       the seeded example of OQ-81 part 3 as built here (an office-recorded sickness is a conflict);
     - Southern Cross Wed 22 Jul: add a hospital holiday row `{ id: 'HH900', name: 'Theatre maintenance closure' }`
       (a seed id outside the runtime `HHN` prefix). Every non-AUTHORISED List at Southern Cross that
       day is flagged, including Dr Morrison's PM. The seed test pins the exact set (expected
       Morrison PM plus any other Southern Cross List that day; if more than two Lists are hit, name
       them in the PROGRESS entry and the S2 notes).
     Keep Tue 21 pristine (asserted) and every Souter Slot untouched.
   - The generator stops stamping messages. `buildSeed` ends with `reconcileAllConflicts(schedule, masters, atISO)`
     (a pure helper beside item 3 that maps `reconcileListConflicts` over every List), so seeded
     conflicts come from the same rule as runtime ones.
   - Regenerate 28's golden canvas fixture for the `conflicts` column and the new
     `recurringBookingId` provenance only (shape change; item 1's id rename shows there too) and add
     an assertion that the set of flagged List ids equals the pre-phase set, apart from the Wed 22
     Southern Cross additions. Every other field is unchanged.
   - Seed tests: every seeded conflict equals `expectedConflicts` for its List (no fabricated flag);
     Labour Day and Canterbury Anniversary still flag the same Lists; Rutherford Wed 22 AM and
     Morrison Wed 22 PM are flagged; Tue 21 has none; two builds deep-equal; the 80% share test still
     passes under its new name.
   - Bump `PERSIST_VERSION` by one with a comment line ("Phase 30: conflicts derived from facts; Wed
     22 conflicts re-seeded as real facts; Permanent Lists renamed recurring bookings, with
     provenance") and extend `persistMigrate.test.ts`.
6. **Store: conflicts are reconciled inside `mutate()`** (`src/store/conflictReconcile.ts`, new, called
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
   - **Remove every per-path conflict write** found in the baseline:
     - 29's `availabilityClash` and every call to it (`setAvailability`, `setAvailabilityRange`,
       `clearAvailability`, `createAvailabilitySeries`, `deleteAvailabilitySeries`, instance edits and
       the roll-forward series write). Each of those changes a Slot record, so the reconcile sees it;
       its `'clear'` case is now the reconcile's resolve. 29's `flagged` and `cleared` results now come
       from the `MutationResult`, so `describeAvailabilityOutcome` keeps its line. Keep 29's shared
       per-Slot write helper: it is where Phase 32 puts its return-or-assign guard for an anaesthetist
       actor (its `holdsList` refusal);
     - 28's `closedHospitalConflict` in `placeListOnSlot`;
     - the `retainedConflicts` filter in `moveListToSlot` (the availability conflict now resolves
       because the target Slot is available, and a holiday conflict stays because the date and
       hospital move with the List);
     - the stamp in `addHospitalHoliday`.
     Keep the outcome shapes callers read.
   - **A closed status written over a List keeps the List in its Slot and the reconcile flags it.**
     Two callers reach this:
     - the **office** recording a short-notice sickness (the store's availability action with an
       office actor; Phase 29 allows it, with no Admin UI, and this phase's `simulate-sickness` drives
       it). This is the built answer for an office-recorded sickness: a conflict with the Bookings in
       place (US-01.5.2's note, OQ-81 part 3, provisional);
     - the **anaesthetist** blocking a booked session on mobile or web. The catalogue answer is
       return or assign (US-01.5.5, OQ-64), which is **Phase 32's**: it puts the choice in front of
       the write, in 29's shared per-Slot write helper, so a List never stays with an unavailable
       anaesthetist. Until 32 lands the List is flagged here, an interim the PROGRESS entry names.
     Build no Draft List conversion and no return-or-assign prompt here. Keep 29's per-Slot write
     helper as the one place both callers pass through, so 32 can branch on the actor's role there
     and the office path stays accept-and-flag.
   - `rollCanvasForward` already goes through `mutate`, so new days reconcile with no extra code; its
     generator output must already agree (item 5), which a test asserts (no `list.conflict` meta on a
     roll unless a fact changed).
   - **Invariant test** (`store/conflictReconcile.test.ts`): run a scripted sequence (block a booked
     Slot, phone-book onto an unavailable Slot, add a holiday, edit it to another date, change a List's
     hospital, reassign, un-block, delete the holiday, roll the clock, edit a recurring booking and
     apply it, retire one, record an office sickness over a booked Slot, create an availability series
     over a booked Slot, clear one instance) and after every step assert that every List's stored conflicts equal
     `expectedConflicts` minus its live clears. This is the "no stale flag anywhere" proof. Write it
     here with the steps today's actions support, and extend it as items 7 to 10 land (phone-book onto
     an unavailable Slot needs item 7, holiday edit and delete need item 9, the recurring-booking
     edit and retire need item 10).
   - Tests: each path raises exactly once and never stacks; un-blocking resolves the conflict (the
     gap's Contradicts case) and writes no new one; reassigning to an available anaesthetist resolves
     the availability conflict and keeps a holiday one; the `MutationResult` counts match; a mutation
     that touches no conflict fact appends no conflict meta; `storeDiscipline` still passes.
7. **Store: accept and flag, never refuse** (28's `slotActions.ts`, `lifecycle.ts`; US-01.5.2 AC1 and
   AC3):
   - `assignListToSlot` loses 28's interim `slotNotAvailable` refusal. Assigning onto an Unavailable,
     Holiday (or any closed) Slot creates the List and the reconcile flags it. The phone-advice path
     (assign, then a Booking) inherits this. `slotOccupied` and the other refusals stay.
   - `moveListToSlot` (and `reassignList` over it) stops refusing a closed target with
     `targetNotOpen`: the move is accepted and the reconcile flags the List (OQ-09 covers assigning
     Lists). It still refuses an occupied target, and `isOpenSlot` still drives the default picker
     (item 12).
   - `createBooking` and the Booking move (15's names for `addCard` and `reassignCard`) onto a
     conflicted List are accepted as today; the List stays flagged and the Booking stays (AC1).
   - `editList` removes `recurringBookingId` when the patch changes hospital, surgeon, kind, notes or
     times (the fields the projection would otherwise overwrite; item 2).
   - Tests: assign onto an unavailable Slot succeeds and flags; phone-book onto it flags once; assign
     at a hospital closed that day flags a `holiday` conflict; a reassign onto a Holiday Slot succeeds
     and flags; each returns `ok`.
8. **Store: office clear and flag again** (`src/store/slotActions.ts` or a new `conflictActions.ts`,
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
9. **Store: hospital holidays can be edited and deleted** (`src/store/mastersActions.ts`; US-01.5.1,
   FT-01.5):
   - `addHospitalHoliday` keeps its signature and refusals, loses its own stamping (item 6), and takes
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
10. **Store: recurring bookings repopulate the canvas, "Apply to canvas now", and retire**
    (`src/store/mastersActions.ts`; US-01.3.2):
    - `addRecurringBooking`, `editRecurringBooking` and new `retireRecurringBooking(api, actor, id,
      lastDateISO)` each compute `projectRecurringBookingChange` over tomorrow (the day after the demo
      clock's today) to the far end of 28's horizon, then apply the recurring-booking change and the
      plan in **one** `mutate()`:
      - created Lists go through 28's `placeListOnSlot` (audit `list.create` with
        `after.source: 'recurringBooking'`), each with no Bookings;
      - updates audit `list.update`;
      - removals audit `list.remove` (a new action code; the List record is deleted and its Slot left
        empty). Only projected, empty, DRAFT Lists are ever removed;
      - `skipped` sessions (closed when the recurring booking reaches them) write nothing here; Phase
        31 makes them Draft Lists;
      - the recurring-booking change audits `recurringBooking.create`, `.update` or `.retire`.
      The reconcile then flags any projected List at a closed hospital.
    - `retireRecurringBooking` sets `effectiveToISO` to `lastDateISO` (default today; refuses a date
      before today, `endInPast`) and `retiredAtISO` from the clock. There is no hard delete: a retired
      row stays in the master, muted, with its history (US-01.3.2 "can be retired").
    - New `applyRecurringBookingsToCanvas(api, actor)`: office only; runs
      `projectAllRecurringBookings` over tomorrow to the horizon's far end and applies it in one
      `mutate()` (audit `recurringBooking.apply` with the counts, plus the per-List metas above). It
      re-paints sessions that have come free since the last projection (leave cancelled, a List
      removed, an anaesthetist made active) and never removes or touches a kept List. A second press
      with nothing to do returns zero counts and writes no List meta.
    - Each returns `{ created, updated, removed, skipped, kept: { listId, reason }[], firstAffectedDateISO? }`.
    - A pure `previewRecurringBookingChange(state, before?, after?)` selector wraps the same plan for
      the sheet's live preview line (item 15), so the preview and the apply cannot disagree.
    - Validation: the refusals already in place, plus `invalidRange` (end before start), `endInPast`
      and `alreadyRetired`. The five fields (hospital, anaesthetist, surgeon, day, session) are the
      arrangement; refusing an incomplete one at save is Phase 31's pairing rule (US-01.3.1), which
      also completes the seeded rows with no surgeon or hospital. Editing is the office's, in Admin
      Master data only (who else may edit is not settled, US-01.3.2's note).
    - Delete the "does NOT retro-regenerate" comments and replace them with the new rule.
    - Tests: editing a Monday recurring booking's surgeon updates every future empty projected Monday
      List and keeps the one with Bookings (Bookings, List id and history unchanged); moving it to
      Tuesday removes the empty Monday Lists and creates Tuesday ones; retiring it removes the empty
      Lists after its last date and keeps booked ones, and a retired row never projects again (also
      on a roll-forward); a Saturday recurring booking creates Saturday Lists; a session already
      marked unavailable is counted in `skipped` and left unavailable; nothing before tomorrow
      changes; the projection stops at the horizon setting's far end; after freeing a projected Slot
      (remove its List), `applyRecurringBookingsToCanvas` fills it again and a second call is a no-op;
      a roll-forward creates the recurring booking's List on the new far-edge day, empty; one audit
      batch per call.
11. **Selectors** (`src/store/selectors.ts`):
    - `conflictRows(state, { fromISO, toISO, reason?, hospitalId?, anaesthetistId?, includeCleared? })`:
      one row per live conflict (and per cleared one when asked), with List, Slot, anaesthetist,
      hospital, surgeon, Slot status key, active Booking count, cause, described reason and detail,
      and the clear if any. Sorted by date, session, then anaesthetist roster order. Memoised on the
      `schedule.lists`, `schedule.slots` and `masters` record references, like 28's indexes.
    - `openConflictCount(state, fromISO)`: live conflicts from today to the horizon, for the side-nav
      badge and the To-do line.
    - `hospitalMonth(state, hospitalId, monthISO)`: each date with its closures, the number of Lists
      at that hospital and how many are conflicted, for the calendar in item 14.
    - Tests for the filters, the sort, the cleared toggle and the counts.
    - **Minimal consumer switch (so session 1 stops green):** item 2 removes `ListConflict.message`,
      so every reader must move to `describeConflict` in this session: `attentionReasons` in
      `apps/admin/util.ts` (hiding cleared conflicts), `AvailabilityScreen.tsx`, 29's mobile and web
      calendars, `DemoData.tsx`, and the `list.conflictResolved` / `list.conflictCleared` /
      `list.conflictRestored` labels in `actionLabels.ts`. Items 12 and 18 then finish the visual and
      copy work on top.
12. **Admin Day grid and List drawer** (`apps/admin/components/DayGrid.tsx`, `ListDrawer.tsx`,
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
      when the Slot is closed. A List projected from a recurring booking shows "From a recurring
      booking" in its detail lines.
    - **Book on a closed session.** "Book (phone advice)" is offered on any empty Slot, not only a
      free one. On a closed (Unavailable, Holiday or other closed status) Slot, the phone-advice sheet
      opens with an inline warning ("Dr Sharma is marked Unavailable for this session. The Booking will be
      accepted and flagged as a conflict."). This is US-01.5.2's "a Booking lands on a session already
      marked unavailable".
    - **Reassign from a conflict.** When the source Slot is closed, `ReassignListFlow`'s "Vacated
      session becomes" (its copy never says "slot") defaults to **Keep as is** (the sick anaesthetist
      stays Unavailable), passed to `moveListToSlot` as the Slot's current status. The targets stay 28's available empty Slots
      (`isOpenSlot`), with 17's blacklist warning, followed by a collapsed "Not available" group of
      empty closed Slots, each with its status chip; picking one shows item 16's warning ("Dr Ngata is marked
      Holiday for this session. The List will be flagged.") and confirm stays enabled. Phase 31's
      grouped picker supersedes this group.
    - **15a's outline.** The conflict tint is the block background; 15a's open-warning outline and
      triangle draw on top as 15a defines them (the error outline when a strong warning is open), so
      a conflicted block with a Booking warning shows both.
    - `DayGrid.test.tsx`: a conflicted block renders the warning tint and the reason line; a
      surgeon-only block does not; the Conflicts chip filters.
13. **Admin Conflicts screen** (`apps/admin/screens/ConflictsScreen.tsx`, new; route
    `/admin/conflicts` in `router.tsx` and `AdminConflictsRoute` in `apps/admin/routes.tsx`; US-01.5.4):
    - **Side nav:** a "Conflicts" item after "Day view", with an amber warn badge from
      `openConflictCount` (the billing-monitor badge tone). `NavSection` and `sectionForPath` gain it.
    - **To-do line:** 15a's To-do rail card on the Day view gains one summary line, "3 open
      conflicts", that opens Conflicts (hidden at zero). It is a link, not a warning: `ListConflict`
      stays List-level and out of 15a's routine (15a's ruling).
    - **Header:** "Conflicts" with the subtitle "Lists at a closed hospital, and Lists whose
      anaesthetist is unavailable for the session. Bookings stay in place; reassign to cover, or
      clear." and the live count. The screen lists only these two kinds (US-01.5.4): a recurring
      clash or a List an anaesthetist returns is a Draft List, which Phase 31's Draft List view shows.
    - **Filters** (chips and selects in the Admin Review header pattern): Reason (All · Hospital closed
      · Anaesthetist unavailable), When (From today · Next 2 weeks · Whole canvas · Include past),
      Hospital, Anaesthetist, and a "Show cleared" toggle. Filter state lives in the URL
      (`?reason=&when=&hospital=&anaesthetist=&cleared=1`, replace navigation, like the Day view's
      `?sort=`).
    - **Body:** grouped by date ("Wed 22 Jul · 3 conflicts"), a table per group in `tableChrome`: a
      3px warning left bar on each row; Session; Anaesthetist; Hospital; Surgeon; Reason as a warning
      pill with "!" and the detail beneath; Availability (the session's status chip, its master
      label); Bookings (mono count); actions. No header or cell says "slot". Cleared
      rows sit muted with the clear's who, when and note.
    - **Row actions** (teal text actions): **Reassign** opens `ReassignListFlow` in place (disabled
      with the reason on an AUTHORISED List); **Clear** opens the clear sheet; **Open** opens the same
      `ListDrawer` over the screen (the drawer stays local state, as in the Day view); **Day** navigates
      to `/admin/day/<date>`. A reassign or a clear updates the table in place, and a resolved row
      leaves it with a short confirmation line ("Conflict cleared: Dr Sharma now covers Wed 22 AM").
    - **Empty state:** "No conflicts in this range." with the filters still showing.
    - Desktop layout inside the Admin content width; no responsive work.
14. **Master data: holiday edit, delete and calendar** (`apps/admin/screens/MasterData.tsx`,
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
15. **Master data: Recurring bookings** (`MasterData.tsx` `RecurringBookingsView`,
    `RecurringBookingSheet.tsx`; US-01.3.2):
    - The table gains "Runs" (from and to dates, or "Ongoing") and a "Retired" state (muted, below the
      active ones, with the last date). The Status column shows the kind as a `StatusChip`, not the
      raw key.
    - Subtitle: "Recurring bookings are standing arrangements of hospital, anaesthetist and surgeon on
      a day and session. Each one creates its Lists across the schedule ahead, before any Bookings
      (they are not Bookings for a patient). Applying changes the canvas from tomorrow: empty Lists
      are added or updated, and Lists with Bookings or office edits are left as they are."
    - **Header action "Apply to canvas now"** (teal, beside the secondary "Add recurring booking"):
      runs `applyRecurringBookingsToCanvas` and shows the result line ("Applied to the canvas: 3 Lists
      added on sessions that had come free, 0 updated, 5 kept (have Bookings), 2 not painted
      (anaesthetist unavailable).") with "Show on day grid" to `firstAffectedDateISO`. With nothing to
      do it says "The canvas already matches every recurring booking."
    - **The sheet** gains optional "Starts" and "Runs until" dates. Saturday and Sunday now work. Edit
      mode gains **"Retire"** (last date, default today; the confirmation states how many empty Lists
      after it go and that Lists with Bookings stay). Above the actions, a live preview line from
      `previewRecurringBookingChange` ("Applying adds 14 Lists on future Mondays, updates 1, keeps 2
      (have Bookings) and skips 1 (anaesthetist unavailable).") updates as the fields change. The
      primary teal button reads **"Apply to canvas now"** in both add and edit mode: it saves the
      recurring booking and projects it in one action, so an edit is never saved without reaching the
      canvas.
    - After applying, the sheet shows the result: "Applied to 17 future Mondays: 14 Lists added, 1
      updated, 2 kept (have Bookings)." and a "Show on day grid" link to `firstAffectedDateISO`. The
      kept and skipped rows expand to list their dates and reasons. The skipped wording stays neutral
      ("not painted: the anaesthetist is unavailable"); Phase 31 re-words it when those sessions become
      Draft Lists.
16. **Inline conflict warnings in the office pickers** (the Assign List, phone-advice, Edit list,
    Reassign List and Move Booking flows; US-01.5.2 AC3):
    - Each flow calls `conflictPreview` for its target and shows a warning callout
      (`semantic.warning` tint) before confirm, for example "Southern Cross is closed on Wed 22 Jul
      (Theatre maintenance closure). The List will be flagged." In hospital selects, a closed
      hospital's option reads "Southern Cross · closed".
    - Confirm stays enabled; nothing blocks.
17. **Demo trigger** (`src/shared/demoTriggers/registry.ts`; body in `src/store` so the PWA import
    closure stays pure):
    - `simulate-sickness`, as specified in "Demo triggers" below. "Apply to canvas now" is a product
      button (item 15), not a registry entry.
    - Body: `simulateSickness(api, listId)` (new, beside Phase 14's other bar-only simulation bodies,
      or a new `store/demoSimulations.ts` if 14 has none). It returns an `Outcome` and goes through the
      existing availability store action (29's per-Slot write helper) as `OFFICE_ACTOR`: the
      anaesthetist phones in and the office records it, so the reconcile flags the List and the audit
      needs no extra code. Because it is an office write, Phase 32's return-or-assign (an anaesthetist
      choice) never applies to it.
    - Update `demoTriggers.test.ts`: `/admin/day/2026-07-21` now includes `simulate-sickness`
      (alongside any entry earlier phases put there, such as 15a's "Raise sample warnings" or 27's
      "Move to 2 days before procedure"; the Phase 14 "returns none" assertion at :89 is already gone
      or goes now; assert inclusion, not exactness); `/admin/conflicts` returns it; it is bar-only.
    - A test for the body: sickness on a booked Slot raises one availability conflict with the note,
      keeps the List and its Bookings in the Slot, and appears in `conflictRows`; the audit names the
      office; a second press on the same List is disabled ("Already unavailable").
18. **Other consumers and audit copy**:
    - `AvailabilityScreen.tsx` and 29's calendars read the new conflict shape (a live, uncleared
      conflict shows the amber "!"). The outcome copy becomes "{session} has Bookings; a conflict was
      flagged for the office.", dropping "and the office notified" (nothing notifies; Phase 32's
      notification pool and return-or-assign replace this line).
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
      - `recurringBooking.retire` "Recurring booking retired";
      - `recurringBooking.apply` "Recurring bookings applied to the canvas".
    - `fieldLabels.ts`: `conflictClears`, `recurringBookingId`, `effectiveFromISO`, `effectiveToISO`,
      `retiredAtISO`.
      `auditNarrative.test.ts` must pass.
    - Check for stragglers: `grep -rn "\.message" src | grep -i conflict` and
      `grep -rn "conflicts:" src/store src/domain` return only the reconcile module, the seed helper
      and tests; item 1's rename greps return nothing; `grep -rni "slot" src/apps` finds no new
      user-visible string (identifiers and comments are fine).
19. **Playwright** (`npm run shots`):
    - Re-point `visual/admin-phase06.spec.ts` at the Wed 22 facts (the drawer names the Southern
      Cross closure and Rutherford's unavailability) and `admin-phase07.spec.ts` at the new Hospitals
      view and the "Recurring bookings" nav label.
    - Add `visual/conflicts-phase30.spec.ts` with `data-shot` hooks for:
      - the Wed 22 Day grid showing the conflict colour and legend;
      - the Conflicts screen with its default filter;
      - the drawer's Clear sheet;
      - Simulate sickness from the Demo actions menu, then the new row on the Conflicts screen;
      - reassign from a row, and the row leaving;
      - the hospital calendar with a closure;
      - the holiday edit sheet;
      - the Recurring bookings view with its "Apply to canvas now" action, the sheet's preview and
        result lines, and a retired row.
    - Keep `pwa-device.spec.ts` passing.
20. **Finish green:**
    - `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots`;
    - `pwaPurity.test.ts` still passes (`domain/conflicts.ts`, `domain/recurringBookingProjection.ts`
      and the trigger bodies import nothing from `apps/admin`, `apps/demo` or `shell`);
    - `persistMigrate.test.ts` covers the bumped version.

## Demo triggers

| id | Label | Screen (routes) | Surfaces | Effect | Disabled when |
|---|---|---|---|---|---|
| `simulate-sickness` | Simulate sickness | Admin · Day view (`/admin/day/:dateISO`) and Admin · Conflicts (`/admin/conflicts`) | bar | `choices`: the viewed day's non-AUTHORISED, non-backdrop Lists (the day in the URL; on Conflicts, the demo clock's today), labelled "Dr Rutherford · AM · Christchurch Eye Surgery", Lists with Bookings first. 28's published `'adminDay.selectedSlotId'` preselects the open drawer's List. `run`: `simulateSickness(api, listId)`: the anaesthetist phones in sick and the office records it, writing the seeded Unavailable status (by its fixed ID) with the note "Unwell, short notice (phoned in, simulated)" as `OFFICE_ACTOR`. The List and its Bookings stay; the reconcile raises the conflict (OQ-81 part 3, provisional). Message: "Dr Rutherford recorded as Unavailable for Wed 22 AM. The List keeps its Bookings and is on the Conflicts screen." | no eligible List that day ("No Lists on this day"); the chosen List's Slot already closed (`isClosed`) ("Already unavailable") |

**Normal use, no button:** adding, editing and deleting a hospital holiday (Admin · Master data ·
Hospitals & holidays, the existing "Add holiday" and the new calendar), a recurring-booking add, edit
or retire and the view-level **"Apply to canvas now"** (Admin · Master data · Recurring bookings;
product actions, not demo triggers), the office clear, reassigning from the Conflicts screen,
phone advice onto an unavailable session, and an anaesthetist blocking a booked session on mobile or
web (29's calendar; flagged here as an interim until Phase 32's return-or-assign). Nothing is added
to the Control Panel page. Its "Demo actions by screen" index picks up `simulate-sickness`
automatically, with `indexPath` `/admin/day/2026-07-22` (the Wed 22 conflicts day).

**PWA:** none. The office-recorded sickness is an Admin beat with nothing on the handset waiting on
the office. The handset's one related beat, blocking a booked session, does not wait on the office in
the target design: the anaesthetist returns the List or hands it on (US-01.5.5), which Phase 32 builds
with its own PWA stand-ins. The earlier plan's "Office reassigns this List" stand-in is dropped
because 32 would retire it; this is logged on the "For the owner's review" list.

## Out of scope

- **Draft Lists**, their waiting flag and assignment to a free Slot, and the pairing rule: Phase 31.
  The engine already handles a List with no Slot (holiday conflicts only); 31 decides whether a Draft
  List at a closed hospital shows on the Conflicts screen.
- **A recurring booking on an unavailable session becoming a Draft List** (OQ-81 part 2, US-01.3.2
  AC2, US-01.5.2 AC3, US-01.5.4 AC3): Phase 31, from the projection's and the generator's `skipped`
  sessions. Here such a session is not painted (today's behaviour) and is counted in the preview and
  result lines.
- **Return or assign when an anaesthetist marks a booked session unavailable** (US-01.5.5, OQ-64,
  D14): Phase 32, with the shared notification pool (FT-13.8). Here that path is flagged by the one
  rule, an interim.
- **Requiring a hospital and a surgeon on a recurring booking** (the five fields of the arrangement):
  Phase 31's pairing rule refuses an incomplete one on add and edit and completes the seeded rows.
  This phase renames, projects and retires what is there.
- **Who else may edit a recurring arrangement** (from the surgeon's end; US-01.3.2's note, not
  settled): the office edits in Admin Master data only.
- **The Day dashboard's booking counts and Draft List panel** (US-13.1.1): Phase 31. This phase only
  adds the conflict colour, the legend entry, the Conflicts chip and the To-do line.
- **An anaesthetist moving their own List** to the office or into a colleague's free session (D7, no
  confirmation), which replaces the cover-request flow: Phase 32.
- **Hospital-download changes** (a message that sets a hospital) raise conflicts automatically
  through `mutate()`, but the matching screen is Phase 33.
- **A statutory public-holiday master** shared by every hospital, bulk holiday loads, date-range
  closures (a Christmas shutdown is one row per day here), and editing hospitals themselves: Phase 42
  (DM-32). Each hospital keeps its own rows here.
- **A captured reason on clearing or on an accept-and-flag assignment**: OQ-09 answered "plain soft
  warning"; the note is optional.
- **Notifying the anaesthetist or surgeon** of a conflict, and the update email (on demand from a
  Booking's change history, D19): Phase 35, and the notification pool is Phase 32's.
- **Fortnightly or other non-weekly recurring-booking patterns**, approval, and the "80%"
  measurement: the catalogue asks for a weekly pattern only. Recurring days off are the
  anaesthetist's calendar series (Phase 29); the surgeon's own blockouts (US-01.3.2's note) are not
  catalogued as a feature.
- **Conflict presentation in the anaesthetist apps** beyond Phase 29's calendar "!" and the corrected
  outcome line. The requirement is office-facing.
- **Retroactive changes to AUTHORISED Lists**: the engine skips them.

## Manual test checklist

The agent runs every item itself in the running app and reports it with evidence; none is handed
to the owner (ROADMAP.md "Owner review: agents test themselves").

- [ ] Reset. Admin, Day view, Tue 21 Jul: no conflicts. The Demo actions pill shows "Simulate
  sickness". Dr Fitzgerald's PM "Surgeon TBC" block (attention only, no conflict) keeps its status tint with the "!" and border, as before.
- [ ] Wed 22 Jul: Dr Rutherford's AM Christchurch Eye Surgery block and Dr Morrison's PM Southern
  Cross block (and any other Southern Cross List that day) draw in the amber conflict colour with the
  kind's left bar, a "!" and a reason line. The legend shows "Conflict", and the Conflicts chip shows
  only those blocks.
- [ ] Open Rutherford's drawer: the conflict reads "Dr Rutherford is marked Unavailable for this session.
  Note: unwell, short notice." and the header shows the Unavailable Slot chip.
- [ ] Conflicts in the side nav, with an amber badge, and the To-do card's "open conflicts" line
  opens it: the screen groups Wed 22, Mon 26 Oct and Fri 13 Nov by date, each row with reason,
  anaesthetist, hospital, availability and Booking count, and only the two kinds (hospital closed,
  anaesthetist unavailable). The filters narrow the rows and survive a reload (URL).
- [ ] From Rutherford's row, Reassign to Dr Sharma. "Vacated session becomes" defaults to "Keep as
  is". The
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
- [ ] Demo actions, Simulate sickness on Wed 22, pick a booked List: the List keeps its Bookings and a
  new conflict appears on the grid and on Conflicts, with "(phoned in, simulated)" in the note and the
  audit reading as the office (Kirsty). A second press on the same List is disabled.
- [ ] As Souter on mobile (or web), block a booked session, then set it back to Available: the
  conflict appears (the interim until Phase 32's return-or-assign), then resolves, with no leftover
  message and one audit entry for each. The outcome line says "a conflict was flagged for the office"
  and no longer claims the office was notified.
- [ ] Phone advice on Dr Rutherford's now-empty Wed 22 AM (Unavailable after the reassign above, or
  any empty Unavailable session):
  "Book (phone advice)" is offered, the warning says the Booking will be flagged, the Booking saves,
  and the List is flagged.
- [ ] Edit list on a flagged List and change its hospital to one not closed that day: the holiday
  conflict resolves. Pick a closed hospital: the select says "closed" and the save flags it.
- [ ] Master data shows "Recurring bookings" (no "Permanent" anywhere in the app: nav, titles,
  buttons, audit labels, Control Panel copy, the inspector). The subtitle says they are patterns of
  Lists, not patient Bookings.
- [ ] Recurring bookings: edit a Monday recurring booking's surgeon. The preview line counts what
  will change before you press "Apply to canvas now"; the result line then counts the added, updated
  and kept Lists, and "Show on day grid" opens Mon 27 Jul with the new surgeon on an empty projected
  List, while a Monday List with Bookings is unchanged. Add a Saturday recurring booking: Saturdays
  fill. Retire one with a last date next month: its empty Lists after that date go, its booked ones
  stay, and the row shows Retired, muted, below the active ones.
- [ ] Mark one future session unavailable as the anaesthetist of a recurring booking, then edit that
  recurring booking: the preview and result lines count it as not painted (anaesthetist unavailable)
  and the session stays unavailable on the Day grid (Phase 31 makes it a Draft List).
- [ ] Advance the demo clock one day (Control Panel): the new far-edge day carries each recurring
  booking's List for that weekday, empty, with no conflict meta written unless a fact changed.
- [ ] As an anaesthetist with a seeded Holiday Slot on a weekday a recurring booking covers, mark that
  Slot Available (29's calendar), then in Recurring bookings press the view's "Apply to canvas now":
  the freed Slot fills and the result line says so. Press it again: "The
  canvas already matches every recurring booking."
- [ ] PWA build (`npm run build:pwa`, preview at phone size): block a booked session; the calendar shows
  the amber "!" and the corrected outcome line. The PWA demo sheet gains no entry from this phase.
- [ ] S2 Beats 1 to 4 still run (Beat 3 now resolves a visible conflict).
- [ ] No en or em dash and no "slot" in any new copy, no crimson on any new control, teal the only
  action colour, and every conflicted block still carries its label.
- [ ] Catalogue screenshots: the recipes for US-01.5.1, US-01.5.2, US-01.5.4 and US-01.3.2 are created or updated (US-01.5.3 checked, an `absent` US-01.5.5 recipe created for Phase 32), any recipe this phase broke is re-pointed, a full `npm run capture` ends with no failed recipe and no story without a recipe, the covered items' new shots are checked by eye, and `npm run verify:board` is green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots` and `npm run verify:board` are all green.

## Demo guide updates

In the same session (each phase patches the beats it touches):
- `docs/demo-guide/03-demo-script.md`:
  - **S2 Beat 3 (illness cover):** start on **Conflicts**. Rutherford's Wed 22 AM row shows
    "Anaesthetist unavailable, unwell, short notice" (he phoned in and the office recorded it).
    Reassign from the row to Dr Sharma, keeping the vacated session Unavailable. The row leaves and
    the badge drops. Then open Sharma AM, then History. Update Click, Say ("A sickness the office
    records is a conflict, not a crisis. The Bookings stay, the List turns amber, and the office
    covers it from one screen instead of a printed report.") and Expected. Retire the "free-target,
    absorb and regenerate" sentence if Phase 28 has not already. (Phase 32 adds the anaesthetist's
    own return-or-assign beat beside it; this beat stays the office-recorded case.)
  - **S2, optional Beat 3a:** Demo actions, Simulate sickness on today's grid, then show the new row
    on Conflicts. Then Master data, Hospitals & holidays, and move or delete the Southern Cross
    closure to show the flags clearing.
  - **S2, optional Beat 3b:** Master data, Recurring bookings: change a surgeon, read the preview,
    press "Apply to canvas now", and follow "Show on day grid". Say: "A recurring booking creates its
    Lists across the schedule ahead before any Bookings exist; a change reaches every future empty
    List at once and never touches booked work." Optionally retire one.
  - **S2 Discovery points:** replace "whether availability/holiday conflicts are hard constraints or
    warnings" with "settled: soft warning (OQ-09); settled: the anaesthetist's calendar is painted
    before recurring bookings, a recurring booking on an unavailable session becomes a Draft List
    (Phase 31), and an anaesthetist who marks a booked session unavailable returns the List to the
    office or hands it to a colleague (Phase 32) (OQ-64, OQ-81); open: short-notice sickness (OQ-81
    part 3), shown here as a conflict the office records".
  - **Direct URLs:** add `/admin/conflicts`.
- `docs/demo-guide/04-presenter-cheat-sheet.md`:
  - section 6 (availability and holiday conflicts): answered soft warning; a conflict is a closed
    hospital or a Booking on an unavailable anaesthetist's List (including a sickness the office
    records); the List changes colour; it clears when the clash goes or the office clears it; the
    Conflicts screen spans every date; recurring clashes and returned Lists are Draft Lists, not
    conflicts;
  - "Who creates the shifts?" (:317, the line at :319): "Recurring bookings supply recurring defaults, painted after
    the anaesthetist's own calendar", and one line on "Apply to canvas now" repopulating the canvas.
- `docs/demo-guide/02-workflows-and-handoffs.md`:
  - the canvas workflow (lines 66 to 79): "A recurring booking or hospital holiday changes", step 2
    "Recurring bookings project ..." (after the anaesthetist's calendar; a closed session is not
    painted), and a change now reapplies at once through "Apply to canvas now", and conflicts clear;
  - the triggers list (:106): "A recurring booking creates the standing pairing";
  - the coverage table row (:465): "Fixed canvas and recurring bookings";
  - the cover workflow step 3 ("Kirsty sees the conflict"): on the Conflicts screen.
- `docs/demo-guide/01-personas-and-responsibilities.md`: Kirsty's "reconcile conflicts" duty (line
  134) names the Conflicts screen, the holiday-maintenance duty names edit and delete, and "Permanent
  Lists" becomes "recurring bookings" (lines 149 and 172).
- `docs/demo-guide/README.md` (:49): "Recurring bookings, availability, hospital ...".
- `docs/demo-guide/master-demo-guide.html`: mirror the same S2 edits, discovery points, Direct URLs
  row, cheat-sheet lines and the four "Permanent" mentions (:482, :686, :691, :1145; line numbers as at this update, find them by text), word for word.
- **Control Panel scenario text** (`apps/demo/DemoControlPanel.tsx`, the S2 blurb, :277): "reassign Dr
  Rutherford's conflicted AM ..." becomes "from Conflicts, reassign Dr Rutherford's AM ... to Dr Sharma
  (vacated session kept Unavailable)"; the clock note at :137 is item 1's rename. No trigger is added
  to the page.
- Not a milestone phase, so no full consistency read. Check the patched sections match the run sheet,
  that `grep -rni "permanent list" docs/demo-guide` returns nothing, and that no patched app-facing
  quote says "slot".

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19),
run after the review pass and before the PROGRESS.md entry. Re-run
`node docs/prototype-build/catch-up/tools/recipe-status.mjs 30` first: earlier phases may have
changed these recipes since this plan was written.

**Covered items.** When the phase is done, each recipe in `requirements-board/capture/recipes/`
matches what was built:

| Item | Recipe at plan time | When this phase is done |
|---|---|---|
| [US-01.5.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.5.1.md) Hospital holiday calendar (Confirmed) | captured · `hospital-holidays` (list, add) | stays captured. Re-shoot `list` on the new Hospitals view (pills are buttons, new subtitle); keep `add` and click the "Add holiday" button as before. Add a `calendar` state (Calendar mode, Southern Cross, a month with a closure block and its conflict count) and an `edit` state (the holiday sheet in edit mode with "Delete holiday"). Highlight the calendar grid and the sheet. Captions: "Each hospital keeps its own closure calendar", "Edit or delete a closure and its flags clear" |
| [US-01.5.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.5.2.md) Conflict flagging (Verify) | partial · `holiday-conflict` (grid, reason), `unavailable-conflict` (admin and mobile) | stays partial, with the reason rewritten to the `3d3a18c` text: "A recurring booking that lands on a session already marked unavailable is not painted yet; Phase 31 makes it a Draft List. An anaesthetist marking a booked session unavailable is still flagged until Phase 32's return-or-assign." Drop the OQ-09 and "web shows no conflict" wording. Re-shoot `holiday-conflict` `grid` to show the amber conflict colour, "!" and reason line (the seeded Wed 22 Southern Cross closure is now real, so drop the add-holiday setup or add a second closure on another date), and `reason` on the drawer's conflict text. Re-point the admin `unavailable-conflict` shot to the seeded office-recorded sickness (Rutherford Wed 22 AM drawer, "Unwell, short notice") and caption it "A Booking on an unavailable anaesthetist's List is accepted and flagged". Drop the mobile `unavailable-conflict` shot (blocking a booked session is no longer a conflict in the catalogue; Phase 32 shoots return-or-assign). Add an admin `phone-advice-warning` shot (the inline "will be flagged" warning when phone-booking onto an unavailable session). Caption in the catalogue's words: "Booking accepted, List flagged as a conflict" |
| [US-01.5.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.5.3.md) Anaesthetist availability calendar | partial · `my-availability` (before, blocked) | Phase 29 owns this recipe. Here only check that the `blocked` state still shows the conflict "!" from the reconcile and the corrected outcome line ("flagged for the office", no "notified"), and that its caption is true. Stays partial for Phase 29's reason |
| [US-01.5.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.5.4.md) Availability conflict dashboard (Proposed) | absent · "Not built yet: catch-up Phase 30 builds this." | becomes captured. Admin shots on `/admin/conflicts`: `conflicts-screen` (default filter, grouped by day, rows with reason, anaesthetist, hospital, availability, Bookings; highlight the table), `conflict-clear` (the Clear sheet from a row), `conflict-reassigned` (after Reassign, the row has left and the count dropped), and a `simulate-sickness` state staged by the Demo actions menu or by the seeded Wed 22 rows. Add a `data-shot` hook on the Conflicts table and the side-nav badge. Captions: "Closed hospitals and unavailable anaesthetists, Bookings still in place", "Reassign to an available anaesthetist and the conflict clears". AC3 (a recurring clash shows as a Draft List) is Phase 31's; if the capture marks partial stories, say so in a note, otherwise leave it to 31's recipe update |
| [US-01.5.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.5.5.md) Mark unavailable while holding a List | none | not built here (Phase 32). Create an `absent` recipe, "Not built yet: catch-up Phase 32 builds this.", so the full capture has no story without a recipe |
| [US-01.3.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.3.2.md) Recurring bookings drive most assignments (Verify) | captured · `permanent-lists` (table, add) | becomes partial, reason: "A recurring booking that lands on a session already marked unavailable is not painted yet; Phase 31 makes it a Draft List. Hospital and surgeon are not yet required (Phase 31's pairing rule)." Keep the shot `name` `permanent-lists`; re-point the clicks to the "Recurring bookings" nav label and "Add recurring booking" button, and rewrite captions ("Recurring bookings: hospital, day, anaesthetist, session and surgeon"). Add an `apply` state (sheet with the live preview line and the "Apply to canvas now" result line, with "Show on day grid") and a `retired` state (a retired row, muted, with its last date). Highlight the table, then the sheet |

**Recipes this phase breaks.** Found by grep at plan time:
- Re-grep first (`grep -li "Permanent\|Hospitals & holidays\|vacated" requirements-board/capture/recipes/*.json`): later phases may have added recipes that click these labels, and the reassign flow's "Vacated session becomes" copy may break a text selector.
- `US-01.1.2.json` and `US-13.4.1.json` click the "Permanent lists" nav label (and `US-13.4.1` the "Permanent Lists" caption and `absentReason`): re-point to "Recurring bookings", keep shot and state names. `US-01.1.2` keeps its partial reason (the roll-forward has no screen).
- `US-13.4.1.json` and `US-04.4.1.json` click "Hospitals & holidays" (`role=button`): check the label survives the Hospitals view change.
- `US-01.4.1.json` (`reassign`) drives `ReassignListFlow` from `/admin/day/2026-07-21`; the new collapsed "Not available" group sits after the open Slots, so "Hughes, Rawiri" should still resolve. Confirm in the `--dry` run.
- `US-01.2.1.json` and `US-01.5.3.json` (mobile, `availability-block-pm`) show the conflict "!" via 29's calendar: re-check the highlight and captions after the reconcile moves into `mutate()`.
- Any recipe that opens a Wed 22 List drawer or highlights its "Needs attention" box (`US-01.5.2`) needs the drawer's new conflict lines and Clear link; add a `data-shot` hook on the attention box rather than the text selector.
- `US-01.2.3.json` uses Tue 21 rows only and is not affected.
The `--dry` run is the final check.

**ATLAS.md.** Update Routes (add `/admin/conflicts`), Seed data worth shooting (Wed 22 now has real facts: Rutherford AM Unavailable, an office-recorded sickness, and the Southern Cross closure `HH900`, not advisory stamps), the Master data tab labels ("Recurring bookings") and Existing hooks (new `data-shot` hooks added for the Conflicts table, nav badge, drawer attention box, hospital calendar and holiday sheet).

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
  roll-forward, "Apply to canvas now", the integration interim, 15's Booking paths and 28's move. The
  invariant test must cover them.
- **Soft means soft.** Nothing refuses because of a closure or unavailability: assign, phone advice,
  Booking create and move, edit and reassign all return `ok` and flag. Warnings appear before
  confirm and never disable it.
- **Clearing is correct.** Un-blocking, deleting or moving a holiday, changing the hospital and
  reassigning to an available anaesthetist each resolve exactly the right conflict. A holiday
  conflict survives a reassign. An office clear holds only while its cause stands; a clash that goes
  and comes back flags again. No stale message survives anywhere (grid, drawer, dashboard, mobile,
  web, inspector).
- **The catalogue's two conflicts, and no more.** A conflict is a List at a closed hospital or a List
  in a closed Slot. A recurring booking on an unavailable session is skipped and counted, never
  created and flagged (OQ-81 part 2 is a Draft List, Phase 31's). No Draft List conversion and no
  return-or-assign prompt here (Phase 32's); the anaesthetist's block of a booked session is flagged
  only as the named interim, through 29's per-Slot write helper, which stays the one place 32 hooks
  in. An office-recorded sickness keeps the List and its Bookings and flags it (OQ-81 part 3,
  provisional in one place). No copy promises a notification.
- **Recurring bookings never disturb booked work.** The projection never touches a List with
  Bookings, a SUBMITTED or AUTHORISED List, an office-edited List, or anything before tomorrow.
  Removals are only of empty projected DRAFT Lists; the view-level "Apply to canvas now" never
  removes. The anaesthetist's calendar is painted first; created Lists hold no Bookings; the
  projection runs to the horizon setting's far end, not a constant; a roll-forward paints the new
  far-edge day. Weekend patterns, start and end dates, and retire work, and a retired row never
  projects again. The generator and the projection agree (a fresh generation gives a
  `projectAllRecurringBookings` plan with nothing but `skipped`), and the sheet's preview equals
  what applying does.
- **The rename is complete and unambiguous.** No "Permanent List" survives in code, copy, audit
  labels, tests or specs; no copy says "booking" alone where it means a recurring booking; ids and
  the `ID_FORMATS` prefix do not clash. No new user-visible string says "slot" (OQ-64): session, AM
  or PM.
- **The colour change stays in the design language.** Only `semantic.warning` tokens; no new hex; the
  kind's left bar and label remain; the attention-only case reads differently; crimson and teal never
  mark a conflict; the Conflicts screen is a real desktop table in the Admin chrome.
- **Seed truth and determinism.** Every seeded conflict has a fact behind it. The flagged set is
  unchanged apart from the documented Wed 22 additions. Tue 21 and Souter are pristine. Timestamps
  come from the clock. The golden fixture moved only in its conflicts and provenance columns (and
  the renamed ids). `PERSIST_VERSION` is bumped.
- **Trigger scope.** "Simulate sickness" appears only on the Day view and Conflicts, acts on the
  day's real Lists as the office, keeps the List's Bookings, and is disabled with a reason. Its body
  sits in `src/store`, inside the PWA import closure. No PWA entry is added.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry; ROADMAP.md "Owner review: agents test
  themselves"): the defaults built for open questions, provisional readings, anything logged
  rather than fixed, and the screens worth a look, each with its route and persona. At least:
  - OQ-81 part 3 (short-notice sickness) built as: a sickness the office records is a conflict with
    the Bookings in place; one the anaesthetist marks follows return-or-assign (Phase 32). The one
    provisional reading, kept on `simulate-sickness` and the seeded Rutherford Wed 22 AM sickness;
  - the anaesthetist's block of a booked session is flagged here as an interim until Phase 32;
  - the earlier plan's PWA "Office reassigns this List" stand-in dropped (Phase 32's return-or-assign
    replaces the beat);
  - US-01.3.2: office-only editing of recurring bookings (who else may edit is not settled), and the
    title's "most" left as catalogued;
  - screens: Admin · Conflicts (`/admin/conflicts`), the Wed 22 Day grid, Master data · Hospitals &
    holidays (calendar) and Recurring bookings, as Kirsty.
- **Status row** for catch-up Phase 30, and a phase entry with:
  - the drift-check result against 3d3a18c (items changed or not, OQ-09 still answered, OQ-81's
    state, the 28 and 29 names used);
  - what was built, per work item;
  - the seed's flagged-List set before and after;
  - the `PERSIST_VERSION` bump (from and to);
  - tests added (including the invariant test);
  - the review pass.
  - the Catalogue screenshots result: recipes created or changed, the REPORT.md counts (captured, partial, absent, failed) before and after, and the partial reasons handed to later phases (US-01.5.2 and US-01.3.2 to Phases 31 and 32; US-01.5.5's absent recipe to 32).
- **Decisions log:**
  1. **Conflicts are derived from facts and reconciled inside `mutate()`.** `ListConflict` holds a
     cause and references, not a message. This supersedes the per-path stamping of the 2026-07-23
     "Availability reconciliation, both directions" entry (availability reconciliation's conflict
     flag) and the Phase 06 decision (1)'s seeding. The soft-warning reading of Phase 06 (1) is now
     the catalogue's answer (OQ-09). It also supersedes Phase 29's decision 5 (`availabilityClash` as
     the one clash function) and 28's `closedHospitalConflict` stamp in `placeListOnSlot`.
  2. **A conflicted List changes colour:** the warning tint and border, keeping the kind's left bar and
     label. This amends Phase 06 decision (1) (border and badge only).
  3. **"Booked List" means any assigned List**, with or without Bookings (a recurring booking creates
     its List before any Bookings). AUTHORISED and backdrop Lists never conflict.
  4. **An office clear holds only while its cause stands**, needs no reason (OQ-09), and can be undone
     with "Flag again".
  5. **Assigning, phone-booking or reassigning onto a closed Slot is accepted and flagged.** This
     supersedes 28's interim `slotNotAvailable` refusal and the closed-target half of
     `moveListToSlot`'s `targetNotOpen`.
  6. **Reassigning from a closed Slot keeps the vacated Slot's status by default.**
  7. **The Wed 22 seeded conflicts are real facts** (Rutherford Unavailable, recorded by the office; a
     Southern Cross closure). This replaces `applyPhase06Conflicts`.
  8. **Permanent Lists are renamed recurring bookings** in code and copy (the standing intersection
     of hospital, anaesthetist and surgeon on a day and session, a pattern of Lists, not a patient
     Booking).
  9. **Recurring bookings create their Lists across the horizon, painted after the anaesthetist's
     calendar (OQ-81 part 1), and changes project over the existing canvas from tomorrow through
     "Apply to canvas now"**, never touching Lists with Bookings or office edits; a view-level "Apply
     to canvas now" re-paints sessions that have come free; a session already closed is skipped and
     counted for Phase 31's Draft List. Weekend patterns, start and end dates and retire are
     supported. This supersedes the Phase 07 "edits apply to future generated days, no
     retro-regeneration" behaviour.
  10. **Hospital holidays can be edited and deleted.** The hospital of a holiday row is fixed.
  11. **What a conflict is follows the catalogue at `3d3a18c`:** a closed hospital, or a List in a
      closed Slot (US-01.5.2, US-01.5.4). A recurring clash is a Draft List (Phase 31) and an
      anaesthetist marking a booked session unavailable is return-or-assign (Phase 32, US-01.5.5,
      OQ-64); until 32 the latter is flagged as an interim. An office-recorded sickness stays a
      conflict (OQ-81 part 3, provisional).
- **Handoff notes:**
  - For **31**:
    - The projection's and the generator's `skipped` entries (a recurring booking's day whose
      session is already closed) are the recurring clash: turn each into a Draft List with no
      anaesthetist, keeping `recurringBookingId` (OQ-81 part 2, US-01.3.2 AC2, US-01.5.2 AC3), and
      re-word the "not painted" preview and result lines. The Conflicts screen must not list them
      (US-01.5.4 AC3).
    - Draft Lists get `holiday` conflicts from the same engine; decide whether they show on
      Conflicts. Draft List assignment onto a closed Slot is accept-and-flag, like `assignListToSlot`.
      The Day dashboard can reuse `conflictRows` for a count.
    - The pairing rule on recurring bookings goes on `addRecurringBooking` / `editRecurringBooking`
      (renamed here from `addPermanentList` / `editPermanentList`); the projection paints whatever
      the row holds, so an incomplete row must be refused at save, and the seeded acute and pre-op
      rows completed.
    - `applyPhase06Conflicts` is gone: the seeded sickness is Dr Rutherford's Wed 22 AM Slot set
      Unavailable by the office ("Unwell, short notice") with his List flagged in it, and the
      Southern Cross Wed 22 closure (`HH900`) is the seeded holiday example. Neither becomes a Draft
      List.
  - For **32**: return-or-assign goes in front of 29's shared per-Slot write helper for an
    **anaesthetist** actor only (mobile and web); the office path (`simulate-sickness`, an office
    sickness record) stays accept-and-flag. Once the List leaves its Slot (returned as a Draft List
    or moved to a colleague through `moveListToSlot`), the reconcile resolves its availability
    conflict with no extra code. Replace the availability outcome line ("a conflict was flagged for
    the office") with the choice, and post the move to the notification pool.
  - For **33**: hospital rows that set a hospital or date raise conflicts through `mutate()`; the
    matching screen can show `conflictPreview` before applying a row.
  - For **35**: a reassign from the Conflicts screen is a cover change; the on-demand update email
    (D19, picked from the change history) can list it; nothing is wired.
  - For **42**: `HolidaySheet`, `editHospitalHoliday` and `deleteHospitalHoliday` are the pattern for
    the statutory holiday master; a loader row is one `addHospitalHoliday`. The recurring-bookings
    master is `masters.recurringBookings`, and its regenerate is `applyRecurringBookingsToCanvas`.
  - For **44**: S2 Beat 3 now starts on Conflicts (an office-recorded sickness), optional Beat 3a uses
    Simulate sickness, and optional Beat 3b shows "Apply to canvas now".
