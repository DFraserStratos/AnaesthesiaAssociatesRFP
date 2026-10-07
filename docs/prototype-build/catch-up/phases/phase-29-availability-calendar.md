# Phase 29 · Availability calendar and status master

**Requirements covered:**
[US-01.2.1](../../../../requirements-board/requirements/stories/US-01.2.1.md) Anaesthetist sets half-day availability ·
[US-01.2.2](../../../../requirements-board/requirements/stories/US-01.2.2.md) Slot status master data ·
[US-01.5.3](../../../../requirements-board/requirements/stories/US-01.5.3.md) Anaesthetist availability calendar ·
[US-03.1.4](../../../../requirements-board/requirements/stories/US-03.1.4.md) Web app parity (Proposed) ·
[US-15.0.2](../../../../requirements-board/requirements/stories/US-15.0.2.md) Mobile-first for anaesthetists (Proposed).
US-01.2.1, US-01.2.2 and US-01.5.3 are Confirmed at `3d3a18c` (2026-10-02 requirements review with
Greg); US-01.2.2 gained two acceptance criteria (a rename or recolour shows in every view with rules
unchanged; a new status is usable without a code change).
Also touches, without closing:
[FT-01.2](../../../../requirements-board/requirements/stories/FT-01.2.md) (Confirmed: a Slot is a box with a status and a List goes into it; the values are a user-maintained list, not a fixed set; Phase 28 put the status on the Slot, this phase gives it the calendar and the master),
[FT-01.1](../../../../requirements-board/requirements/stories/FT-01.1.md) (the horizon, four months in current practice and configurable; Phase 28 builds the setting, and the calendar's bounds read it),
[US-01.2.3](../../../../requirements-board/requirements/stories/US-01.2.3.md) (Confirmed, closed in 28: the List shows in place of the status; this phase must not regress it),
[US-01.5.5](../../../../requirements-board/requirements/stories/US-01.5.5.md) (new, Confirmed: marking unavailable a session that holds a List offers return to the office or assign to a colleague; Phase 32 builds it and replaces this phase's interim flag),
[US-01.5.2](../../../../requirements-board/requirements/stories/US-01.5.2.md) and
[US-01.5.4](../../../../requirements-board/requirements/stories/US-01.5.4.md) (conflict flagging and the dashboard, Phase 30; at `3d3a18c` they no longer cover an anaesthetist marking a booked session unavailable, only a hospital closure and a Booking landing on a session already marked unavailable),
[FT-01.6](../../../../requirements-board/requirements/stories/FT-01.6.md) (Draft Lists, Phase 31, which now arise from a List returned to the office and from a recurring booking landing on an unavailable session),
[DM-04](../analysis/domain-model-delta.md#dm-04) (availability is a status on the Slot, kept from one calendar with series, and the status set is master data with fixed IDs: this phase delivers the calendar, the series and the master on top of 28's Slot; return-or-assign is 32's),
[RV-14](../analysis/reverse-check.md#rv-14-list-and-slot-are-one-record-a-free-list-that-gains-a-booking-still-reads-free-and-is-unreachable-to-the-anaesthetist-statuses-are-a-fixed-enum) (28 split the model; this phase takes the availability values out of the List-type set for good and makes them a user-maintained list).
**Open questions:** [OQ-64](../../../../requirements-board/requirements/questions/OQ-64.md) is **Answered** (2026-10-02, owner decision D14): a Slot is a container with a status that a List goes into; every Slot is created and stored across the horizon; the statuses are a user-maintained list (a fixed internal ID that rules read, an editable label and an editable colour), starting from the values in use (free by default, on holiday, unavailable), with the final values to be defined later with AA's users; "slot" never appears in the UI; and marking unavailable a session that holds a List offers return to the office (a Draft List) or assign to a colleague (US-01.5.5, Phase 32). This phase builds parts 1, 2 (with 28), 4 and 5 as answered, not provisional.
[OQ-17](../../../../requirements-board/requirements/questions/OQ-17.md) and
[OQ-27](../../../../requirements-board/requirements/questions/OQ-27.md) are **Answered** (2026-10-01): availability values belong to the Slot, not the List; the calendar edits the Slot status directly (one mechanism, nothing to reconcile); the anaesthetist marks days off ahead, creates a series and edits or deletes one instance.
[OQ-81](../../../../requirements-board/requirements/questions/OQ-81.md) parts 1 and 2 are settled in the room: generation paints the anaesthetist's calendar first, then surgeons' recurring bookings, and a recurring booking on an unavailable session becomes a Draft List (Phase 31). Part 3 (short-notice sickness) is open and not this phase's.
[OQ-84](../../../../requirements-board/requirements/questions/OQ-84.md) (what a session shows after its List is moved away) is open and belongs to 32 and 32a; this phase only makes the vacated status read the default status record.
**Depends on:** Phase 28 (the Slot record holds the availability status and default times for every active anaesthetist from their start date across the configurable horizon, a List has its own id and sits in a Slot and shows in place of the status, and status no longer derives from bookings). Also Phase 14 (the demo-trigger registry; this phase registers nothing, but its new routes must fit the route matcher) and Phase 17 (the Master data `?view=` param, the `apps/admin/screens/masters/` split and the editable-master sheet pattern). 17 is not a hard dependency in the outline: if it is not DONE, build the editor inside `MasterData.tsx` and add the `?view=` search param the way 17's plan describes (read from and written to the query), so 17 can adopt it.
**Estimated:** 2 sessions. Session 1 is work items 1 to 10 (model, pure status and series rules, seed, palette, shared status UI, the store actions and the Admin status editor) and stops green; if it runs long, move item 10 (the Admin editor) to the start of session 2. Session 2 is items 11 to 17 (the shared availability pieces, the mobile and web calendars, the finders, removals, shots and the demo guide).

## Goal

At the snapshot an anaesthetist can mark a session Free or Block, on mobile only, for the next six
days only. There is no holiday button, no range, no repeating days off, and no control at all on the
web app. Availability is a separate master row reconciled into the List; pressing Free on a session
that already holds a List raises a false conflict ("Marked available, but this List carries booking
context"), and pressing Block on one says "a conflict was flagged and the office notified", although
no notification exists. Phase 28 moves the status onto the Slot (`Slot.status`, written directly by
`setAvailability`) and stops raising the false conflict, but it keeps the six-day Free and Block
screen, leaves an earlier availability conflict in place when the session is set back to Free, and
keeps the statuses closed: 28's `SlotStatus` union (`free`, `unavailable`, `holiday`) plus `ListKind`
(private, public, pre-op) make up the six-key `DisplayStatusKey`, kept identical to the theme's
`StatusKey` by a parity test, and the Admin statuses master is view only with no colour.

This phase:

- gives the anaesthetist a **month calendar of their own AM and PM sessions**, weeks ahead to the
  horizon (four months in current practice, Phase 28's setting), on mobile and on web. Every session
  is Free by default. From the calendar they **mark days off ahead** (one session, both sessions of a
  day, or a date range, to any status they may set, for example On holiday or Unavailable, with an
  optional note), **create a series** (repeating days off: a status on chosen weekdays and sessions,
  every week or every few weeks, until a date), and **edit or delete one instance** of a series. A day
  off that is not in a series can be removed (back to Free). The office sees each change on its Day
  grid at once (US-01.2.1, US-01.5.3);
- makes the calendar **edit the Slot status directly** (OQ-27, OQ-64 answered, FT-01.2): there is no
  second availability record. A series is a rule that writes the status onto its Slots, and records
  each single-instance edit or delete as an exception so it is never overwritten; nothing reads
  availability from the series, only from Slots. Where a Slot already holds a List, the List keeps
  showing in place of the status (28's rule). A bookable status over a List raises nothing and clears
  an earlier availability flag, which finishes the false-conflict fix 28 started;
- keeps one **interim** for a closed status over a session that holds a List. The settled rule is
  return-or-assign (US-01.5.5), which needs Draft Lists (31) and the anaesthetist's own move (32), so
  until Phase 32 the List stays in place and is flagged on the office's Day view, through one pure
  clash function that 31 and 32 replace. The **false "the office was notified" copy goes**: every
  line says only what happens (the List is flagged on the office's Day view);
- brings the web app to parity: everything the mobile availability screen does, the web app now does
  too, through the same shared form and the same store actions (US-03.1.4, US-15.0.2);
- turns the Slot status set into a **user-maintained master list** (US-01.2.2, OQ-64). Each status has
  a **fixed internal ID** that rules read (assigned when it is created, never edited), an editable
  label and description, and an editable colour chosen from the design's six status colour tokens
  (never a free hex) with a fill treatment, and says whether it is open for bookings and whether
  anaesthetists may set it. Admins add, rename, recolour and retire statuses without code; a renamed
  or recoloured status shows everywhere at once and every rule behaves as before. The list is seeded
  with the owner's starting values, Free (default), On holiday and Unavailable. Greg's "several
  versions of unavailable ... all of which have the same effect ... it's for information" is exactly
  what an admin can add (for example Public hospital or Annual leave, closed, same effect as
  Unavailable). The master holds **availability values only**: the List types (private, public,
  pre-op) leave the status set and stay a fixed, design-coloured List attribute, so a session holding
  a List shows the List in its place with the design's List colours.
- keeps "slot" out of every word of app copy (OQ-64 part 5): users read session, AM or PM, day off and
  availability. Slot stays a code and planning word.

The design language survives intact: the six palette tokens, the hatched and dashed treatments, and
"colour is never the only signal" all stay in `src/theme/`. What moves is the list of availability
statuses, not the palette.

## Before you start: drift check

1. Diff the catalogue for this phase's items against the plan's snapshot:

   ```
   node docs/prototype-build/catch-up/tools/plan-state.mjs --diff US-01.2.1,US-01.2.2,US-01.5.3,US-03.1.4,US-15.0.2,FT-01.1,FT-01.2,US-01.2.3,US-01.5.2,US-01.5.4,US-01.5.5,FT-01.6,OQ-64,OQ-81,OQ-84,OQ-17,OQ-27
   ```

   If an item changed, re-read it and adjust the work items before planning. If a covered item is now
   Retired or Future, drop it from this phase and say so in the PROGRESS entry. A new item on the
   same surfaces comes in only if it is small and on these screens; otherwise note it for the owner.
   A config page for warnings and thresholds is US-13.7.4 (Future): not here.
2. **OQ-64 (answered at `3d3a18c`).** Build the answer as this doc describes, with no provisional
   label anywhere: statuses as a user-maintained list seeded from Free, On holiday and Unavailable,
   colours chosen from the design tokens, no "slot" in app copy.
   - **If AA's users have since named the final values and colours** (US-01.2.1 and US-01.2.2 say they
     will be defined with Vanessa and AA's users): seed those instead, still choosing colours from the
     six design tokens. If AA's list needs a colour the design does not have, do not invent a hex: reuse
     a token (the label always disambiguates) and raise it with the owner for a Design Language change.
   - **If the catalogue has reopened the model** (an unavailable half-day as a List, or the day as the
     parent with Slots only a view): stop at the drift check and raise it with the owner before
     planning. It reverses part of Phase 28 and changes what the calendar writes.
   - **US-01.5.5 is settled (return-or-assign) but is Phase 32's.** Do not build the prompt here; keep
     the interim flag in the one clash function (work item 2). If Phase 32 is somehow already DONE,
     route the calendar's closed-over-a-List case through its return-or-assign sheet instead and say
     so in the PROGRESS entry.
   - **OQ-81 part 3 (short-notice sickness) and OQ-84 (the vacated session)** stay open; neither
     changes this phase.
3. **Baseline.**
   - Confirm Phase 28 is DONE in PROGRESS.md.
   - Read its entry and Decisions-log rows for the names it chose. Phase 28's plan expects, and this
     doc assumes where it says "28's":
     - `Slot` in `schedule.slots` (id `S-<reg>-<date>-<AM|PM>`), created for every active anaesthetist
       from their start date across the horizon, with `status: SlotStatus` (the union `'free' |
       'unavailable' | 'holiday'`, const `SLOT_STATUSES`, free by default) and `note?`;
     - the horizon as a setting (FT-01.1: "four months in the current practice", any number of months;
       shortening drops future days, extending fills them), planned as `appSettings.schedule.horizonMonths`,
       read through `scheduleHorizon(state)` (`horizonFor(today, months)`), and changed by
       `setHorizonMonths`;
     - `List.kind: ListKind` (`'private' | 'public' | 'preop'`, `LIST_KINDS`) replacing
       `List.statusKey`, and `PermanentList.kind` (recurring bookings after Phase 30's rename);
     - the six-key display union (`DisplayStatusKey` / `DISPLAY_STATUS_KEYS`, the same six strings as
       today), derived by `displayStatusKey(slot, list)` in `domain/slots.ts` (a List present returns
       its kind in place of the status, otherwise `slot.status` as it is: no remap), and
       `isOpenSlot(slot, list)` (status free and no List) and `displayStatusLabel(key)` (the one label
       lookup every screen uses, which 28 left reading the theme's labels for this phase to point at
       the master) in the same module;
     - `statusKeyParity.test.ts` kept with a second line checking `SLOT_STATUSES` and `LIST_KINDS`
       together are the six keys;
     - `ListStatus` master rows keyed by the display union, and whatever header line 28 put on the
       view (if it is a provisional OQ-64 line, it goes here: OQ-64 is answered);
     - `masters.availability` removed, `AnaesthetistAvailability` renamed `SeedLeaveWindow` and the seed
       constant `SEED_LEAVE` (generator input only);
     - in `store/slotActions.ts`: `setAvailability(api, actor, anaesthetistId, dateISO, session, status,
       note?)` (refusals include `noSlot` before the start date; outcome `{ result: 'updated' |
       'conflictFlagged' | 'noChange' }`; audit `slot.status`), `assignListToSlot` (`invalidKind`,
       `slotNotAvailable`), `moveListToSlot` / `reassignList` (`targetNotOpen`, `vacatedStatus` defaulting
       to `'free'`) and `requestCover` (`notFree`); `slotViewsForDate` and `slotViewsForAnaesthetist` in
       `store/selectors.ts`; `rollCanvasForward` in `store/clockActions.ts` calling
       `generateCanvasForDates(masters, datesISO)` (no RNG), which per Slot writes free, paints the
       calendar input (`leave`, the seed's `SEED_LEAVE`) and only then the recurring-booking templates;
       a template on a closed Slot is not projected and comes back in `clashes` as a `RecurringClash`
       (28's interim; Phase 31 turns each into a Draft List);
     - the golden canvas fixture: `domain/seed/canvasGolden.test.ts` over
       `domain/seed/__fixtures__/canvas-golden.json` (display keys per Slot).
     Use 28's actual names wherever they differ; this doc's code references are as at `3d3a18c`.
   - Check whether 28 already stopped a bookable status from flagging a conflict on a Slot that holds a
     List (its plan says it does, but leaves an earlier availability conflict in place). If it did,
     keep its test; work item 7 still adds the clearing.
   - List every path through which 28 creates Slots (roll forward, the horizon-extend setting, a new
     anaesthetist, an earlier start date, a reactivation): work item 8 feeds active series into the
     generator's calendar input on each.
   - Check that 28 removed the mobile "a conflict was flagged and the office notified" line
     (`AvailabilityScreen.tsx:111` at `3d3a18c`); if it survived, work item 12 removes it.
   - Note the current `PERSIST_VERSION` in `src/store/appStore.ts` (16 at `3d3a18c`; 15b to 28 may have
     bumped it) and bump it by one from whatever it is now.

## Reference

**Design files (convention 17):**
- `docs/design/Design Language.dc.html` §02, **the six status colours**: `status/private`,
  `status/public`, `status/preop`, `status/holiday`, `status/unavailable` (hatched) and `status/free`
  (dashed), each with solid, tint and on-tint, and "colour is never the only signal". These six are
  the whole palette a status record may use. Also §01 (teal is the only action colour, crimson is
  identity only) and the pill, chip, radius and sheet rules.
- `docs/design/Mobile Availability.dc.html`: the Find cover screen (date strip, Everyone / Free only
  segmented control, colleague cards, the request-cover bottom sheet). No mockup shows a calendar, the
  set-availability sheet or a series control, so extend this screen's date-strip cells, chips and sheet
  anatomy.
- `docs/design/Web Availability.dc.html`: the locum-finder grid (day nav, filter chips, inline legend,
  220px name column, AM and PM cells with a status bar and two lines). The web "My availability"
  calendar reuses these cells, chips and panel surfaces in a desktop layout.
- `docs/design/Web Dashboard.dc.html`: the week strip's AM/PM block pair per day, the nearest existing
  pattern for a calendar day cell.
- `docs/design/Admin Day.dc.html`: the Admin chrome, the day grid legend and blocks (where a renamed
  or added status must read correctly).

**Catalogue:** the covered items above; `requirements-board/requirements/domain-model.md`,
"Slot, List and Draft List" (a Slot is a box with a status, free by default, and a List is put into
it; every Slot is stored across the horizon; generation paints the anaesthetist's calendar first,
then recurring bookings; the status values are master data with fixed internal IDs, editable labels
and colours, starting from free, on holiday and unavailable; "slot" never appears in the UI; marking
a session unavailable while it holds a List asks return to the office or assign to a colleague) and
the "Availability conflicts" row of the changes table. The meeting notes:
- `requirements-board/requirements/notes/2026-10-01-aa-meeting-with-greg.md` points 9, 13, 42 and 44 ("recurring days off
  are a rule on the anaesthetist's calendar");
- `requirements-board/requirements/notes/2026-10-02-aa-meeting-with-greg.md` points 5 (the OQ-64 answer), 27 (the generation
  order), 29 (Slot or List with a status), 30 (statuses as a user-maintained list), 38, 45 and 46;
- `requirements-board/requirements/notes/2026-10-02-aa-requirements-review-with-greg.md` points 1, 20 (the horizon), 22
  (FT-01.2, US-01.2.1, US-01.2.2 confirmed), 55 (the master endorsed over an enum) and 56 (several
  kinds of unavailable, same effect).

**Analysis:**
- `docs/prototype-build/catch-up/GAP-ANALYSIS.md`: theme 1 (Slot, List and Draft List: status as
  editable master data), the DM-04 and RV-14 rows, and the EP-01, EP-03 and EP-15 tables.
- `docs/prototype-build/catch-up/epics/EP-01.md` (FT-01.2, US-01.2.1, US-01.2.2, US-01.5.3, US-01.5.5,
  and the EP-01 structural note), `epics/EP-03.md` (US-03.1.4), `epics/EP-15.md` (US-15.0.2).
- `docs/prototype-build/catch-up/analysis/domain-model-delta.md` (DM-02, DM-04) and
  `analysis/reverse-check.md` (RV-14).
- `analysis/prototype-map-apps-mobile-web.md` (Availability sections), `prototype-map-admin.md`
  (Master data, Day grid), `prototype-map-domain.md`, `prototype-map-store-seed.md`,
  `prototype-map-shared.md` and `prototype-map-shell-demo-pwa.md` (router and the PWA entry).

**Code entry points (as at `3d3a18c`, the prototype as Phases 14, 15 and 15a session 1 left it; use
Phase 28's names where they differ):**
- `aa-prototype/src/domain/types.ts`: `LIST_STATUS_KEYS` and `ListStatusKey` (:53-61),
  `ListConflict` (:265), `List.statusKey` (:307), the Permanent List template's `statusKey` (:593),
  `AnaesthetistAvailability` (:603, kinds `available | unavailable | holiday`), `ListStatus` (:620).
- `aa-prototype/src/theme/statusColours.ts`: the `StatusKey` union (:12), `StatusTreatment` (:20),
  `STATUS_ORDER` (:39), `statusColours` (:48, labels "Holiday", "Unavailable", "Free"),
  `unavailableHatchTint` (:112), `unavailableHatchSolid`, `freeDashedBorder` (:120), `getStatus`
  (:123). Tests: `theme/statusColours.test.ts` and `domain/statusKeyParity.test.ts`.
  `theme/global.css` mirrors the six hexes as `--color-status-*` (unused by components; leave it).
- `aa-prototype/src/shared/StatusChip.tsx`, `StatusBlock.tsx`, `StatusLegend.tsx` (with its `SAMPLE`
  text keyed by the six keys, :18) and `shared/schedule/ListRow.tsx`.
- Every other reader of the union or the colour map: `apps/admin/components/DayGrid.tsx`,
  `ListDrawer.tsx`, `apps/admin/flows/PermanentListSheet.tsx`, `ReassignListFlow.tsx`,
  `apps/admin/screens/AdminBookingDetail.tsx`, `ReviewScreen.tsx`, `IntegrationMonitorScreen.tsx`,
  `apps/admin/util.ts`, `apps/demo/DemoData.tsx`, `DemoXero.tsx`,
  `apps/mobile/screens/AvailabilityScreen.tsx`, `BalancesScreen.tsx`, `BookingDetailScreen.tsx`,
  `ListDetailScreen.tsx`, `apps/web/components/WeekStrip.tsx` (:46, "On leave" fallback copy),
  `apps/web/screens/AvailabilityGrid.tsx`, `BookingDetailView.tsx`, `DashboardScreen.tsx`,
  `ListDetailView.tsx`, `ListsScreen.tsx`, `shared/flows/RequestCoverSheet.tsx`, `store/lifecycle.ts`,
  `store/mastersActions.ts`, `domain/seed/cast.ts`, `domain/seed/index.ts`. Literal-key comparisons with
  no union import also sit in `apps/admin/AdminApp.tsx` (:151-154, the day free count),
  `apps/mobile/screens/ForwardListsScreen.tsx` (:97-123), `store/bookingActions.ts` (:315) and
  `domain/seed/bookings.ts` (:1187, seed, may stay). After 28, add its `domain/slots.ts`
  (`displayStatusKey`, `isOpenSlot`), `store/slotActions.ts` and the `slotView*` selectors. About 76
  literal comparisons exist at `3d3a18c`
  (`grep -rnE "=== '(free|holiday|unavailable|private|public|preop)'" src`); 28 will have changed some.
- `aa-prototype/src/store/lifecycle.ts`: `setAvailability` (:698-829): the reconciliation, the false
  conflict for `kind: 'available'` on a List with booking context (:797-815, copy at :802), the
  per-slot audit metas. Phase 28 moves it to `store/slotActions.ts` (writing `slot.status`) and
  removes the false conflict; `store/mastersActions.ts` (:277, `masters.availability`) and
  `domain/seed/canvas.ts` also reference availability.
- `aa-prototype/src/store/clockActions.ts`: `rollCanvasForward` (:29, the far-edge generation on a
  clock advance, today fed `masters.availability` at :44), where active series are painted (work
  item 8).
- `aa-prototype/src/store/mastersActions.ts`: `createHospital`, `editAnaesthetist`,
  `addPermanentList`, `editPermanentList` (the office-only, `mutate()`-with-metas pattern to copy).
- `aa-prototype/src/domain/seed/cast.ts`: `LIST_STATUSES` (:142); `domain/seed/availabilityAndHolidays.ts`:
  `AVAILABILITY` (:42) windows (Souter on leave Fri 24 to Sun 26 Jul, Beaumont, Ngatai, Ngata, Delaney,
  Ropata, Sharma); `domain/seed/canvas.ts` (availability rows take their Slot cleanly; the RNG fill is
  hashed per slot by `slotRng`, so a change to one Slot changes only that Slot); `domain/seed/index.ts`
  (`SeedMasters.listStatuses` :101, the masters assembly :442).
- `aa-prototype/src/domain/clock.ts`: `HORIZON_FUTURE_MONTHS` (:88), `horizonFor` (:100, 14 days back,
  4 months forward), `enumerateDatesISO` (:109). Phase 28 turns the forward months into a setting.
- `aa-prototype/src/apps/admin/screens/MasterData.tsx`: the `NAV` entry `listStatuses` (:51, label
  "List statuses") and `ListStatusesView` (:453, header "A fixed enumerated set (view only)", :458).
  Phase 17 splits this file into `apps/admin/screens/masters/` and adds the `?view=` param; build the
  editor in 17's structure.
- `aa-prototype/src/apps/mobile/screens/AvailabilityScreen.tsx` (six-day strip :47-55, `setMine`
  :100-114 with the false "office notified" line at :111, the My availability card :181-200 with Free
  and Block and the `availability-block-*` hooks at :196-197); `apps/mobile/routes.tsx`
  (`MobileAvailabilityRoute` :166, and `MobileListsRoute` :34 as the SlideStack pattern);
  `apps/mobile/navigation.ts` (`mobileTabForPath`, `listsStackLocation`); `apps/mobile/MobileApp.tsx`
  (`showTabBar`, :132).
- `aa-prototype/src/apps/web/screens/AvailabilityGrid.tsx` (no set-own control; own Free cell only
  offers cover), `apps/web/routes.tsx` (`WebAvailabilityRoute` :117), `apps/web/WebApp.tsx` (tab
  matching :16-22, min-width 1240 at :61), `apps/web/screens/DashboardScreen.tsx` ("Who's free", :95
  and :279).
- `aa-prototype/src/router.tsx` (`availability` leaf routes for web :81 and mobile :120) and
  `aa-prototype/pwa/main.tsx` (:79, the PWA's own `availability` route).
- `aa-prototype/src/shared/surface/` (`useSurface().Overlay`: a bottom sheet on mobile, a dialog on
  web), `shared/ui/SlidingSegmentedControl.tsx`, `shared/ui/Button.tsx`, `shared/ui/Field.tsx`.
- `aa-prototype/src/shared/audit/actionLabels.ts` and `fieldLabels.ts`; `auditNarrative.test.ts`
  fails if an emitted action code has no label.
- Tests to extend: `store/lifecycle.test.ts` and 28's `store/slotActions.test.ts` (wherever the
  setAvailability tests live), 28's `domain/slots.test.ts` (the `displayStatusKey` table),
  `store/canvasRoll.test.ts` (roll forward), `store/mastersActions.test.ts`,
  `domain/seed/seed.test.ts`, 28's `domain/seed/canvasGolden.test.ts` (the golden fixture),
  `store/persistMigrate.test.ts`, `domain/domainPurity.test.ts` (`RELATIVE_BRIDGE_FILES`, :41),
  `apps/admin/components/DayGrid.test.tsx`, `apps/admin/flows/ReassignListFlow.test.tsx`,
  `src/pwa/pwaPurity.test.ts`; Playwright `visual/routing.spec.ts` (expects `/web/availability$` from
  the dashboard link; keep Find cover there), `visual/mobile-phase03.spec.ts` (`m-05-availability`),
  `visual/web-phase05.spec.ts` (`w-06-availability`), `visual/mobile-insets.spec.ts` (finds the "My
  availability" text), `visual/mobile-interactions.spec.ts` (the "Availability view" segmented group
  and its "Free only" button), `visual/pwa-device.spec.ts` (expects `/mobile/availability$`, so Find
  cover stays at the bare path), `visual/admin-phase07.spec.ts` (the master-data shot).

## Work items

Build in item order: model and pure rules, seed, palette, shared status UI, store, the Admin editor,
then the availability screens. Session 1 ends green after item 10 (the app builds, every existing
screen renders from the records, and the store actions are tested); session 2 is items 11 to 17.

1. **Domain types** (`src/domain/types.ts`) (US-01.2.2 "each status has a fixed internal ID, an
   editable label and an editable colour. Any rule that depends on a status reads its ID, not its
   label"; US-01.5.3; DM-04):
   - `StatusColourToken`: the union of the design's six token names (`'private' | 'public' | 'preop'
     | 'holiday' | 'unavailable' | 'free'`, the `status/<name>` tokens of Design Language §02) and a
     `STATUS_COLOUR_TOKENS` const. Its doc comment says this is the palette, not a vocabulary.
   - `StatusTreatment`: `'solid' | 'hatched' | 'dashed'` (moved from the theme so the domain can
     store it; the theme re-exports it).
   - `SlotStatusKey = string` replaces 28's closed `SlotStatus` union and its `SLOT_STATUSES` const. It
     is the status's **fixed internal ID**: rules, Slots and series store and compare it, never the
     label. Do this rename first, so the compiler lists every reader, and only then reuse the name
     `SlotStatus` for the master record below. `Slot.status` (28's field) is typed `SlotStatusKey`,
     validated against active records by the store, not by the type; `SeedLeaveWindow.status`
     likewise. (Downstream plans, 30 to 32, already call it `SlotStatusKey`; keep the name.)
   - **List types stay closed and leave the status set.** `ListKind` / `LIST_KINDS` (private, public,
     pre-op) remain a fixed List attribute (the OQ-17 answer: availability values belong to the Slot,
     not the List), with a fixed `LIST_KIND_LABELS` (Private, Public, Pre-op; long label "Pre-op
     Assessment") moved out of the theme map. They are not master data. The catalogue has no List kind
     (DM-04): they stay because the design's six colours and every existing screen use them, and that
     is logged for the owner's review.
   - **One display key space.** 28's `displayStatusKey(slot, list)` already returns `list.kind` when a
     List is in the Slot (the List shows in place of the status, US-01.2.3) and otherwise
     `slot.status` unchanged; it is retyped `ListKind | SlotStatusKey`, and 28's closed
     `DisplayStatusKey` / `DISPLAY_STATUS_KEYS` union goes. A status key can never equal a List kind
     (seeded keys are fixed and generated keys follow a pattern no List kind matches; the seed test
     asserts it), so the space cannot collide. 28's `slots.test.ts` table keeps its rows (the keys do
     not change).
   - `SlotStatus` replaces `ListStatus`:
     - `key: SlotStatusKey`: the fixed internal ID. Seeded statuses keep 28's stored values (`free`,
       `holiday`, `unavailable`), so no Slot is rewritten; a status an admin adds gets a generated ID
       from a new store counter (`ST0001`, `ST0002`, following the app's ID formats), shown read only
       and never edited;
     - `label: string`: the chip label, at most 16 characters, editable;
     - `longLabel: string`: headers and pickers, at most 32 characters, editable;
     - `description: string`, editable (what the status means, shown in the legend and the editor);
     - `colour: StatusColourToken` and `treatment: StatusTreatment`, editable (US-01.2.2 "an editable
       colour");
     - `bookable: boolean`: open for bookings (the office may place a List and the finders count it as
       free); drives the finders and the clash rule, so no code compares literal keys. Several closed
       statuses therefore have "the same effect" (Greg, US-01.2.1 note) and differ only for information;
     - `anaesthetistCanSet: boolean`;
     - `isDefault?: true`: the status every new Slot takes and a cleared or vacated Slot returns to
       (exactly one, and it must be bookable): "a Slot is free by default" (US-01.2.1);
     - `order: number`;
     - `retiredAtISO?: IsoDateTime`.
   - **Series** (US-01.5.3 "they can create a series (recurring days off are a rule on the calendar);
     they can edit or delete one instance of a series"): `AvailabilitySeries` in a new
     `schedule.availabilitySeries: Record<SeriesId, AvailabilitySeries>` (id `AS####` from the store
     counter):
     - `anaesthetistId`, `statusKey`, `sessions: 'AM' | 'PM' | 'both'`, `note?`;
     - `weekdays: Weekday[]` (Monday first, at least one) and `everyWeeks: 1 | 2 | 3 | 4`;
     - `startISO` and `untilISO?` (no until date means it runs with the horizon);
     - `exceptions: Record<string, SeriesException>`, keyed `<dateISO>-<AM|PM>`, where a
       `SeriesException` is `{ kind: 'deleted' }` or `{ kind: 'edited'; statusKey; note? }`;
     - `createdAtISO`, `endedAtISO?` (a deleted series is ended, not removed, so audit and history
       still read).
     `Slot.seriesId?: SeriesId` marks a Slot whose status a series set. It is a pointer, not a second
     status: the Slot's own status is still the only thing anything reads.
   - If 28 kept `AnaesthetistAvailability` as a parallel master (its plan removes it), fold it into
     Slot status here so there is one store for availability (the calendar reads and writes Slots). If
     28's Decisions log keeps it on purpose, raise it with the owner: the OQ-27 and OQ-64 answers rule
     out a second record.
2. **Pure status rules** (`src/domain/slotStatus.ts`, new, no React; Vitest `slotStatus.test.ts`):
   - `SEED_STATUS`: the three seeded IDs as constants (28's stored `free`, `holiday`, `unavailable`).
     Literal availability keys may appear only here and in the seed.
   - Lookups: `statusFor(statuses, key)` (undefined-safe), `activeStatuses(statuses)` (ordered,
     retired excluded), `anaesthetistChoices(statuses)` (active, `anaesthetistCanSet`, ordered),
     `defaultSlotStatus(statuses)`.
   - Behaviour: `isOpenForBooking(status)` (bookable) and `isClosed(status)` (not bookable). Every
     finder, filter and clash rule in the app goes through these, by ID, never by label.
   - **The clash rule, in one place:** `availabilityClash(list, newStatus)` returns `'flag'` (a closed
     status over a List), `'clear'` (a bookable status over a List with an availability conflict) or
     `'none'`. Every action that changes the status of an existing Slot (one-off, range, series
     create or delete, instance edit or delete) calls it. Its doc comment says `'flag'` is the interim
     for one settled rule: an anaesthetist marking a session that holds a List closed becomes the
     return-or-assign choice in Phase 32 (US-01.5.5). It also says why generation never reaches it:
     new Slots get the calendar (series included) before any recurring booking, so a recurring
     booking on a closed session is never placed; 28's generator traces it as a `RecurringClash`,
     which Phase 31 turns into a Draft List (OQ-81 parts 1 and 2, US-01.5.2).
   - `validateSlotStatusDraft(draft, existing, ctx)` returns a list of plain-language issues:
     - on edit, the key is unchanged (the ID is fixed); on create, the store assigns it, so a draft
       carries none;
     - label 1 to 16 characters, longLabel 1 to 32, description 1 to 160; labels unique among active
       statuses (case-insensitive); no en or em dash in any of them (the copy rule applies to
       admin-entered labels too, since they render in every app); and no "slot" in them (OQ-64:
       the word stays out of the UI);
     - colour in `STATUS_COLOUR_TOKENS`; treatment one of three;
     - exactly one active default; the default cannot be retired or made not bookable;
     - a status used by an active series cannot be retired (the issue names the count); `ctx` carries
       those counts so the function stays pure.
   - `validateAvailabilityRange({ fromISO, toISO, sessions, todayISO, horizonEndISO })`: refuses
     `to` before `from`, any date before today, and any date past the horizon end (Phase 28's
     setting). `slotsInRange` enumerates `{dateISO, session}` pairs with `enumerateDatesISO`.
   - Tests cover every rule above, plus: the seed has exactly one default and it is Free; every seeded
     status's colour is a palette token; no status key equals a List kind; `anaesthetistChoices` of the
     seed is exactly Free, On holiday, Unavailable, in that order; the clash table (closed over a List,
     bookable over a flagged List, either over an empty Slot); a renamed or recoloured status gives
     the same `isClosed`, `isOpenForBooking` and clash results (US-01.2.2 criterion 1).
3. **Pure series rules** (`src/domain/availabilitySeries.ts`, new, no React, demo-clock dates only;
   Vitest `availabilitySeries.test.ts`; US-01.5.3):
   - `validateSeriesDraft(draft, { todayISO, horizonEndISO, statuses })`: at least one weekday;
     `everyWeeks` 1 to 4; `startISO` not before today and not past the horizon; `untilISO`, if set, on
     or after the start; the status active and settable; plain-language issues as above.
   - `seriesOccurrences(series, fromISO, toISO)`: every `{dateISO, session}` the rule produces in the
     window (weekday match, and whole weeks since the start's week divisible by `everyWeeks`), before
     exceptions. Pure and deterministic; no `Date.now()`.
   - `seriesInstances(series, fromISO, toISO)`: the occurrences with exceptions applied: a `deleted`
     instance is dropped, an `edited` one carries its own status and note.
   - `planSeriesWrite(series, slots, window)`: which Slots a series write sets, and which it leaves.
     A series fills only Slots that are at the default status and in no other series; a Slot the
     anaesthetist already set (a one-off day off, a seeded leave window, another series) is left as it
     is and counted, so a series never silently overwrites an earlier choice. Occurrences with no Slot
     (before the anaesthetist's start date, or past the horizon) are skipped.
   - `describeSeries(series, statusLabel)`: one line for the UI, for example "Unavailable, Friday PM,
     every 2 weeks, until 25 Sep". No en or em dashes, no "slot".
   - Tests: weekly and fortnightly rules across a month boundary and a daylight-saving change; a
     deleted and an edited instance; a series that starts mid-week; `planSeriesWrite` leaves a seeded
     holiday Slot and a Slot in another series alone and skips dates with no Slot; same inputs give the
     same output.
4. **Seed** (`domain/seed/cast.ts`, `domain/seed/index.ts`; US-01.2.2, US-01.2.1):
   - `LIST_STATUSES` becomes `SEED_SLOT_STATUSES`, the owner's three starting values (OQ-64 "you decide
     for now"; US-01.2.1 "start from the values already in use"), keyed by the IDs 28 stores on Slots,
     with today's colours, so every seeded Slot and test keeps working with no data rewrite:

     | key (fixed ID) | label | longLabel | colour | treatment | bookable | anaesthetist sets |
     |---|---|---|---|---|---|---|
     | `free` (default) | Free | Free | free | dashed | yes | yes |
     | `holiday` | Holiday | On holiday | holiday | solid | no | yes |
     | `unavailable` | Unavailable | Unavailable | unavailable | hatched | no | yes |

     Descriptions come from the Design Language §02 captions and the catalogue wording ("free by
     default", "on holiday", "unavailable"; for Unavailable, "Not available for Lists. Add other kinds
     of unavailable here if they help, with the same effect.").
   - The List types (private, public, pre-op) are no longer master rows; their labels move to
     `LIST_KIND_LABELS` (work item 1).
   - `masters.listStatuses` becomes `masters.slotStatuses`, keyed by `key`; a `counters.slotStatus`
     starts at zero; `schedule.availabilitySeries` starts empty and the series counter at zero. No
     series is seeded, and no extra kind of unavailable is seeded.
   - **The generated canvas is unchanged.** No Slot, List or Booking changes. Prove it with 28's golden
     canvas fixture (`canvasGolden.test.ts`): the stored keys do not change, so it passes with no diff
     beyond the type renames of work item 1, and say so in the PROGRESS entry.
   - Bump `PERSIST_VERSION` by one; extend `persistMigrate.test.ts`.
5. **Theme reads records, not a union** (`src/theme/statusColours.ts`; convention 10 amended):
   - Replace the `StatusKey`-keyed `statusColours` with `STATUS_PALETTE: Record<StatusColourToken,
     { solid, tint, onTint }>`, same hexes, same Design Language comment. `STATUS_ORDER` goes (order
     lives on the records; List kinds keep `LIST_KINDS` order).
   - `resolveStatusVisual({ colour, treatment })` returns everything a chip, block or cell needs:
     solid, tint, onTint, block background, border and left bar. It generalises today's two special
     cases with tokens only:
     - hatched is the token's tint striped with `neutral.line`, which is exactly today's Unavailable
       hatch (`#ECEFEE` / `#E2E7E5`); the grey token keeps its own hatched solid header;
     - dashed is a 1.5px dashed border in the token's solid, which is exactly today's Free border.
     No new hex anywhere. Keep `unavailableHatchTint` and `freeDashedBorder` only as aliases if
     removing them makes the diff noisy.
   - `LIST_KIND_VISUAL: Record<ListKind, { colour: StatusColourToken; treatment: 'solid' }>` maps each
     List type to its own token (private, public, preop), so a List renders exactly as today.
   - Replace `domain/statusKeyParity.test.ts` with a token parity test (`domain/statusTokenParity.test.ts`):
     `StatusColourToken` (domain) and the `STATUS_PALETTE` keys (theme) are mutually assignable and
     equal as sets. The domain still never imports the theme outside that one test: update
     `domain/domainPurity.test.ts`'s `RELATIVE_BRIDGE_FILES` (and its comment) to the new filename.
     Update `theme/statusColours.test.ts` (six tokens, exact hexes, the two treatments resolve to
     today's exact strings, every List kind resolves to today's colours).
     `shell/gradientLab/gradientLabPurity.test.ts` asserts the gradient files never use
     `statusColours`; keep the name it greps for accurate (grep `STATUS_PALETTE` too).
6. **Shared status UI** (`src/shared/`; US-01.2.2):
   - `src/shared/status/useSlotStatuses.ts`: `useSlotStatuses()` and `useSlotStatus(key)` over
     `masters.slotStatuses` (memoised). PWA-safe: store and theme only.
   - `StatusChip`, `StatusBlock` and `StatusLegend` take the display key (`ListKind | SlotStatusKey`): a
     List kind resolves through `LIST_KIND_VISUAL` and `LIST_KIND_LABELS`; anything else resolves the
     status record and `resolveStatusVisual`, and renders the record's label. An unknown key renders a
     neutral chip with the text "Unknown status" (never a crash, never the raw ID); a retired status
     still renders on the Slots that carry it.
   - `StatusLegend` lists the three List types, then the active statuses in `order`, with an
     optional `only: 'list' | 'slot'` filter. Its `SAMPLE` text stays for the six seeded keys (the Design
     Language samples, same keys); any other status uses its longLabel and description.
   - 28's `displayStatusLabel(key)` (the one label lookup) now reads the records: it takes the status
     records (`displayStatusLabel(key, statuses)`, or a hook wrapper in `useSlotStatuses.ts`), returns
     `LIST_KIND_LABELS` for a List kind, the record's label otherwise, and "Unknown status" for an
     unknown key. No screen keeps its own label map.
   - Migrate every call site in the reference list. Replace literal availability-key comparisons with
     the `slotStatus.ts` helpers, so no app file compares a Slot status to a literal string.
   - RTL test `StatusChip.test.tsx`: renders a renamed label, a recoloured token, a List kind, and the
     unknown-key fallback.
7. **Store: days off ahead and single-instance edits** (28's `src/store/slotActions.ts`, beside
   `setAvailability`; `store/lifecycle.ts` at `3d3a18c`; US-01.2.1, US-01.5.3):
   - New `setAvailabilityRange(api, actor, { anaesthetistId, fromISO, toISO, sessions: 'AM' | 'PM' |
     'both', statusKey, note? })`. 28's `setAvailability` keeps its signature, outcome and `slot.status`
     audit, so existing callers, tests and Phase 30's sickness trigger keep working; it shares the
     per-Slot write helper below, so it validates against the records and runs the same clash rule.
   - Refusals, before any write (all or nothing): `notFound`, `integrationForbidden`,
     `notOwnAvailability` (an anaesthetist sets only their own; the office may set anyone's, as
     today), `statusNotFound`, `statusRetired`, `statusNotSettable` (`anaesthetistCanSet: false` when
     the actor is an anaesthetist), `noSlot` (any date in the range before the anaesthetist's start
     date, as 28's `setAvailability` refuses), and the range issues from `validateAvailabilityRange`.
     Refusal messages say "session", never "slot".
   - One `mutate()` for the whole range. For each Slot, write the status and note directly on the Slot,
     then apply `availabilityClash` to any List in it:
     - `'flag'` (the interim until Phase 32): an `availability` conflict on the List ("Dr Souter marked
       this session Unavailable; the List is still in place. Reassign it or clear the flag."),
       replacing any earlier one, never stacking;
     - `'clear'`: remove that List's `availability` conflict, because its cause is gone (28 stopped
       raising the false conflict but left an earlier one in place; Phase 30 generalises clearing to
       every path);
     - in every case the List's surgeon, hospital, Bookings, times and List type are untouched, and the
       List still shows in place of the status (US-01.2.3, US-01.5.3 "for the anaesthetist this is a
       status, not a List").
   - **Editing one instance:** a Slot with a `seriesId` that the range covers is an edit of that
     instance: the store also writes an `edited` exception on the series (status and note), so a later
     series write or new Slot never overwrites it. The Slot keeps its `seriesId`.
   - **`clearAvailability(api, actor, slotId)`**, the "Remove" and "Delete this one" action: the Slot
     returns to the default status (Free) with no note, and `availabilityClash` runs. If the Slot is a
     series instance, the store writes a `deleted` exception on the series and clears the Slot's
     `seriesId`. Same refusals, same audit pattern.
   - Audit: one `availability.setRange` entry on the anaesthetist (from, to, sessions, before and after
     status counts, note, series instances edited), one `availability.cleared` entry for a removal, plus
     one `list.conflict` or `list.conflictCleared` entry per List affected. Add the labels to
     `actionLabels.ts` and `fieldLabels.ts` ("Availability set", "Day off removed"; no "slot").
   - Returns `{ set, unchanged, flagged: ListId[], cleared: ListId[], seriesEdited }` for the UI's result
     line. `flagged` is also what Phase 32's return-or-assign will act on, List by List.
   - Tests: a two-week holiday range writes 28 Slots in one audit entry; a range over a booked Slot flags
     exactly that List and leaves it byte-identical otherwise; Free over a booked Slot flags nothing and
     clears an earlier Unavailable conflict; a range over a series instance writes an `edited`
     exception; clearing a series instance writes `deleted` and returns the Slot to Free; each refusal;
     past and beyond-horizon dates; an anaesthetist cannot set a colleague's Slot or an office-only
     status; same inputs give the same state (determinism, clock timestamps only).
8. **Store: series** (`src/store/slotActions.ts`; US-01.5.3):
   - `createAvailabilitySeries(api, actor, draft)`: refusals as in item 7 plus `validateSeriesDraft`'s
     issues. One `mutate()`: store the series, then apply `planSeriesWrite` from its start to the horizon
     end: set each planned Slot's status, note and `seriesId`, and run `availabilityClash` on each.
     Returns `{ seriesId, set, leftAsIs, flagged, cleared }`.
   - `deleteAvailabilitySeries(api, actor, seriesId)`: ends the series from today (`endedAtISO`); every
     future Slot that still points at it and still carries the series status returns to Free (clash
     rule applied); an edited instance keeps its edited status as a one-off and loses its `seriesId`.
     Past instances are untouched. Returns the same counts.
   - **Series on new Slots (one helper, every generating path), painted as the calendar before
     recurring bookings** (the settled order, OQ-81 part 1, domain model: the anaesthetist's calendar
     first, then recurring bookings). `seriesCalendarFor(state, datesISO)` (store helper over the pure
     `seriesInstances`) returns each active series' instances on the dates being generated, as calendar
     entries `{ anaesthetistId, dateISO, session, status, note?, seriesId }` (an `edited` exception
     carries its own status; a `deleted` one is absent). Every generating path passes them to 28's
     `generateCanvasForDates` beside `SEED_LEAVE` in its calendar input: `rollCanvasForward`
     (`store/clockActions.ts`), `setHorizonMonths` when extending (FT-01.1: "extending fills them in"),
     an earlier start date or a reactivation on `editAnaesthetist` (and `addAnaesthetist`, harmlessly:
     a new anaesthetist has no series yet). The generator paints them in its calendar step after the
     seed leave windows, with `planSeriesWrite`'s fill rule (only a Slot still at the default status),
     and sets `Slot.seriesId`.
     - The generator's "is this Slot closed" test (where 28 compares to `unavailable` or `holiday`)
       reads `isClosed` over the status records passed in its masters, so a series using an
       admin-added closed status also stops a recurring booking.
     - A recurring booking whose session a series closes is therefore **never placed**: 28's generator
       returns it in `clashes` as a `RecurringClash`, exactly as for a seeded leave window. That is
       28's interim until Phase 31 turns each clash into a Draft List (OQ-81 part 2, US-01.5.2); no
       List is created and no availability conflict is raised on this path.
     - The generator still draws no RNG and no series is seeded, so the golden fixture holds. An
       open-ended series keeps filling as the horizon moves. Shortening the horizon drops the far Slots
       (28's rule) and leaves the series as a rule, so extending again repaints them.
   - Audit: `availability.seriesCreated` and `availability.seriesDeleted` on the anaesthetist (the rule
     in words via `describeSeries`, counts) plus one conflict entry per List those two affect; the roll
     forward's existing `canvas.rollForward` entry and 28's generate entries gain the count of sessions
     series painted (their clash count is 28's). Labels
     added ("Repeating days off added", "Repeating days off deleted").
   - Tests: a fortnightly Friday PM series to the horizon sets the right Slots and leaves a seeded
     holiday alone; a series over a booked Free Slot flags that List once; delete one instance, then roll
     the clock forward a week: the deleted instance stays Free and the new far-edge Fridays fill; a
     horizon extend paints the series onto the added months; a recurring booking whose far-edge Friday a
     series closes (including one using an added closed status) is not placed, comes back as one
     `RecurringClash`, and the Slot carries the series status and `seriesId`; deleting the series returns its future instances to Free,
     keeps an edited instance, and leaves past ones; an anaesthetist cannot create a series for a
     colleague; determinism.
9. **Store: status master actions** (`src/store/mastersActions.ts`; US-01.2.2):
   - `addSlotStatus` (assigns the next `ST####` ID from `counters.slotStatus`), `editSlotStatus` (label,
     long label, description, colour, treatment, the two flags, default, order; never the key),
     `retireSlotStatus` and `restoreSlotStatus`: office only, each through `mutate()` with before and
     after metas and a clock timestamp, validated by `validateSlotStatusDraft` (the store computes the
     active-series usage counts for `ctx`).
   - No delete: retiring keeps history, and existing Slots keep the key.
   - Audit labels ("Availability status added", "Availability status updated", "Availability status
     retired", "Availability status restored").
   - Tests: office-only refusal, each validator refusal surfaces its message, the edit round-trips every
     editable field and cannot change the key, an added status gets `ST0001` and is immediately usable
     by `setAvailabilityRange` (US-01.2.2 criterion 2), a rename leaves every rule's result unchanged
     (criterion 1), and retire then restore.
10. **Admin: Availability statuses editor** (17's `apps/admin/screens/masters/` split, `MasterData.tsx`
    at `3d3a18c`; US-01.2.2). It replaces 28's view-only "List statuses" view and any provisional line
    on it:
    - The nav entry becomes "Availability statuses" (view param `availability-statuses`, via 17's
      `?view=`). The word "slot" appears nowhere on the screen (OQ-64).
    - Header copy: "The availability anaesthetists set on their AM and PM sessions. Every session is
      Free until changed, and a List placed in it shows instead. Rules use each status's ID, so you can
      rename or recolour a status, or add one, without changing how it behaves. This is availability,
      not the Draft, Submitted and Authorised approval state." No provisional line (OQ-64 is answered).
    - Table: preview chip (live `StatusChip`) · ID (mono, read only) · Long label · Open for bookings ·
      Anaesthetists can set · Default · Description · state (Active, or Retired with date). Retired rows
      sit below the active ones, in mist. A short footnote names the three List types as fixed List
      attributes with their chips, so the office sees the whole legend.
    - "Add status" and a row "Edit" open `SlotStatusSheet` through `useSurface().Overlay`:
      - the ID shown read only on edit ("Assigned when saved" on create);
      - fields for label, long label and description;
      - "Open for bookings", "Anaesthetists can set this" and "Default for new sessions" toggles;
      - colour as six swatches, one per design token, each carrying its token name;
      - treatment as a segmented control;
      - a live preview of the chip and a sample block;
      - validator messages inline.
    - "Retire" and "Restore" row actions. Retiring asks for confirmation and says how many future
      sessions carry the status ("They keep it until changed").
    - The Day grid's legend and status filter (`DayGrid.tsx`) read the active records, so a renamed or
      added status shows correctly.
    - Teal actions only. No crimson on any swatch, preview or control.
11. **Shared availability pieces** (`src/shared/availability/`, PWA-safe; US-03.1.4 "the same
    capability, not a cut-down version"):
    - `availabilityMonthFor(state, anaesthetistId, monthISO)`, a pure selector in `store/selectors.ts`:
      each date of the month with, per session, the Slot's status key and note, the List in it (kind,
      hospital short name) if any, its series (id and `describeSeries` line) if any, and any availability
      conflict. It reads Slots only (series only for the description). It powers both calendars.
    - `AvailabilityForm`, one component for both apps:
      - status choices as chips from `anaesthetistChoices`, each rendered as its `StatusChip` with its
        long label;
      - sessions as a segmented control: AM · PM · Both;
      - From and To dates, with quick chips "Just this day", "1 week" and "2 weeks" (From is prefilled
        from the tapped day or selection);
      - **Repeat** as a segmented control: "Does not repeat" · "Every week" · "Every 2 weeks" (3 and 4
        weeks under a "More" chip); when repeating, weekday chips (Mon to Sun, prefilled from the
        start day) and an "Until" date with a "No end date" chip; the From date is the series start and
        To is hidden;
      - an optional note;
      - one teal "Save" action.
      It calls `setAvailabilityRange` or `createAvailabilitySeries` and shows the result in one line,
      for example "10 sessions set to On holiday." or "Series saved: Unavailable, Friday PM, every 2
      weeks. 9 sessions set, 1 already set left as it is." Where Lists were flagged it adds "1 List is
      flagged on the office's Day view." Refusals show the store's message. Nothing says the office was
      notified or told.
    - `AvailabilitySlotPanel` (code name; the UI calls it the session): what a tapped session shows
      before the form. A one-off day off offers "Change" and "Remove". A series instance shows the series
      line and offers "Change this one", "Delete this one" and "Delete the series" (with a confirm that
      says future sessions return to Free). A session holding a List shows the List (it is in place of
      the status) and still lets the anaesthetist change the status, with the honest interim line "This
      session holds a List. If you mark it unavailable, the List stays in place and is flagged on the
      office's Day view." (Phase 32 replaces this with the return-or-assign choice.) A past session is
      read only.
    - `describeAvailabilityOutcome(outcome, statusLabel)`, a pure helper that writes the result line
      (tested). No en or em dashes, no "slot"; ranges read "24 Jul to 7 Aug".
12. **Mobile: My calendar** (`apps/mobile/`; US-01.2.1, US-01.5.3, US-15.0.2):
    - **Routing:**
      - the Availability tab becomes a splat route `availability/*` hosting a two-layer `SlideStack`
        (Find cover, then My calendar at `/mobile/availability/calendar`), on the `MobileListsRoute`
        pattern;
      - add `availabilityStackLocation` to `navigation.ts`;
      - change the route in both `src/router.tsx` and `pwa/main.tsx`;
      - `showTabBar` also hides the tab bar on the calendar layer (full bleed, like List detail).
    - **Find cover screen** (`AvailabilityScreen.tsx`):
      - the "My availability" card keeps its title (`mobile-insets.spec.ts` looks for it), and the
        "Availability view" segmented group keeps its "Free only" button (`mobile-interactions.spec.ts`);
      - it shows the selected day's AM and PM as status chips (or the List where one sits), with a
        "Change" button that opens the set-availability bottom sheet (`AvailabilitySlotPanel` then
        `AvailabilityForm` for that day) and a "My calendar" row that pushes the calendar layer;
      - remove the Free and Block buttons, the `availability-block-*` hooks and the `setMine` branch,
        with its false-conflict message and the false "a conflict was flagged and the office notified"
        line;
      - colleague cells and the date-strip dot read records through the helpers. Only `isOpenSlot`
        sessions (no List and `isOpenForBooking`) are tappable for cover and counted as free. Cover is
        reworked in Phase 32.
    - **My calendar screen** (`screens/MyAvailabilityCalendarScreen.tsx`, new):
      - a back row "Availability", then a month title with previous and next controls, bounded by the
        current month and the horizon's last month (Phase 28's setting);
      - a Monday-first seven-column grid. Each day is a cell with its date numeral (mono) and two
        stacked half-blocks, AM over PM, in the status visual (or the List's, where one sits). A series
        instance carries a small repeat glyph with an accessible label. Today is marked the way the web
        week strip marks it. Past days are dimmed and inert, and a session with an availability conflict
        carries the amber "!" used on the Admin grid;
      - under the grid, a legend of the anaesthetist-settable statuses, then "Your series" listing each
        active series by its `describeSeries` line with a "Delete" action;
      - tapping a day opens the bottom sheet for that day (`AvailabilitySlotPanel`, then the form);
      - a sticky, thumb-reachable teal "Add days off" action opens the form preset to On holiday, both
        sessions, with the "1 week" chip ready; "Repeat" sits in the same sheet.
    - Mobile-first throughout: a bottom sheet, chips and segmented controls, no centred modal, and no
      dropdown for the status.
13. **Web: My availability** (`apps/web/`; US-03.1.4, US-15.0.2):
    - **Routing:** a nested route `/web/availability/mine` (`WebMyAvailabilityRoute` in
      `apps/web/routes.tsx`). `WebApp`'s tab matching already covers the prefix.
    - **Page header:** both availability pages get a two-option segmented control, "Find cover" and
      "My availability", under the page title. The locum-finder grid is otherwise as today.
    - **The grid's own row:** the "(you)" row's cells get a small "Change" link that opens My
      availability on that date (`?date=`).
    - **`screens/MyAvailabilityCalendar.tsx`, a desktop layout inside the 1320px content width:**
      - a month grid (Monday first) in a `Panel`, each day showing AM and PM as the Web Availability
        cell anatomy (status bar and label, with the note or the series line as the second line where it
        fits), the repeat glyph on series instances;
      - previous and next month controls, with the same horizon bounds as mobile;
      - clicking a day selects it, and shift-clicking extends the selection to a range;
      - a 340px right rail holds `AvailabilitySlotPanel` and `AvailabilityForm` (panel variant) for the
        selection, then "Your series" and the legend.
      The web app stays desktop-width (min-width 1240); no responsive work.
    - **Dashboard:** "Who's free" and the week strip read records through the helpers. The seeded Leave
      panel is untouched; Phase 38 removes it.
14. **Finders and other consumers read the helpers**:
    - Mobile and web "Free only" filters and free counts, the mobile Forward Lists rows, the web
      Dashboard "Who's free", the Admin Day free count (`AdminApp.tsx`) and the Admin
      `ReassignListFlow` free-target list use `isOpenSlot` over `isOpenForBooking`.
    - 28's `isOpenSlot(slot, list)` takes the status records (or a resolved status) and means "no List
      and `isOpenForBooking`"; `requestCover`'s `notFree` refusal reads it.
    - 28's store refusals read the helpers, not keys: `assignListToSlot`'s `slotNotAvailable` and
      `moveListToSlot`'s `targetNotOpen` refuse `isClosed` Slots; `invalidKind` checks `LIST_KINDS`.
      (Phase 30 turns `slotNotAvailable` into accept-and-flag.)
    - Phase 28's reassign default for a vacated Slot (`vacatedStatus`, `'free'` in 28) uses
      `defaultSlotStatus`, and its "mark the vacated session" picker lists the active statuses, so an
      added kind of unavailable appears there too. Whether the anaesthetist is asked, and what the office
      reassign leaves, is OQ-84 (Phases 32 and 32a); this phase changes only where the values come from.
    - Permanent List templates (`PermanentListSheet.tsx`) keep picking their `kind` from `LIST_KINDS`.
    - Check `grep -rnE "'(free|available|holiday|unavailable)'" src` outside `domain/slotStatus.ts`,
      `domain/seed/` and tests: the only matches left should be unrelated strings (for example cover or
      audit copy, or the Slot status value passed to the seed).
15. **Remove the superseded behaviour**:
    - the false conflict on a bookable status (item 7);
    - the false "the office was notified" copy (item 12), and any other line claiming a notification
      that does not exist (the notification pool is Phase 32's);
    - the view-only "A fixed enumerated set" master and any provisional OQ-64 line (item 10);
    - the availability values in the closed status union (28's `SlotStatus` union and
      `SLOT_STATUSES`, and the `DisplayStatusKey` union; the theme's `StatusKey`), and
      `statusKeyParity.test.ts` (items 1 and 5);
    - the fixed six-day limit on setting one's own availability (the Find cover date strip may stay six
      days, because it is the corridor finder; setting availability now happens in the calendar).
16. **Playwright** (`npm run shots`):
    - Update `m-05-availability`, `w-06-availability` and the Admin master-data shot.
    - Add `visual/availability-phase29.spec.ts` with `data-shot` hooks for:
      - the mobile calendar (July, showing Souter's seeded leave 24 to 26 Jul);
      - the mobile sheet with On holiday and "1 week" selected, and the same sheet with "Every 2 weeks",
        Friday and PM selected;
      - a series instance's panel ("Change this one", "Delete this one", "Delete the series"), after the
        spec creates a series through the store action;
      - the web My availability page with a range selected and the rail showing;
      - the Admin Availability statuses table and `SlotStatusSheet` with the live preview.
    - Add one assertion that no rendered text on these screens contains "slot" (case-insensitive).
    - Keep `mobile-insets.spec.ts`, `mobile-interactions.spec.ts` and `pwa-device.spec.ts` passing (the
      calendar layer must respect the PWA insets and the `DockSpacer` rule).
17. **Finish green:**
    - `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots`;
    - `pwaPurity.test.ts` still passes (`src/shared/availability/` and `src/shared/status/` import
      nothing from `apps/admin`, `apps/demo` or `shell`);
    - `persistMigrate.test.ts` covers the bumped version.

## Demo triggers

**None.** Marking days off, creating or editing a series and editing a status are all ordinary user
actions: the anaesthetist on mobile or web, the office in Admin master data. A series filling the new
far-edge sessions happens on the existing clock advance (the harness bar clock menu, also on the
Control Panel index), not on a new trigger. Register nothing in Phase 14's registry and add nothing to
the Control Panel.

**PWA:** nothing on the handset waits on the office or on a backend event. The office sees the change
on its Day grid, and in a framed demo the presenter switches to Admin to show it. The new mobile route
(`/mobile/availability/calendar`) is URL-addressable, so a later phase can scope a PWA entry to it if it
needs one (Phase 32's colleague-move stand-ins do).

## Out of scope

- **Return-or-assign** when a session that holds a List is marked unavailable (US-01.5.5, OQ-64 part
  3): Phase 32, with the anaesthetist's own move and the notification pool. This phase keeps the
  interim flag in `availabilityClash` and the honest copy.
- **Conflicts beyond this phase's clash rule:** the List colour change, clearing on every path,
  hospital-holiday edits and the cross-date conflict dashboard are Phase 30's (US-01.5.2, US-01.5.4).
- **Draft Lists**, including a recurring booking on a session a series closed becoming a Draft List
  (OQ-81 part 2): Phase 31 turns 28's traced `RecurringClash` into one; this phase only makes series
  close those sessions before recurring bookings are painted. Assigning a Draft List to a free session is 31's
  too (it uses `isOpenSlot`).
- **Short-notice sickness** (OQ-81 part 3, open) and **what a vacated session shows** (OQ-84, open):
  Phases 30 and 32.
- **The anaesthetist moving their own List** and any rework of cover offers and requests: Phase 32. The
  existing cover flow keeps working on `isOpenSlot` sessions.
- **The horizon setting itself** (FT-01.1): Phase 28. This phase reads it.
- **Editing a whole series' rule** (change the weekdays or the interval of every instance): the
  catalogue asks for create, and edit or delete one instance. Delete the series and create a new one.
- **Leave approval or a leave balance.** The catalogue asks for neither. Recurring bookings
  (Permanent Lists until Phase 30's rename) remain the office's weekly List pattern; a series is the
  anaesthetist's own days off and never makes a List.
- **The List types as master data** (private, public, pre-op). They are a List attribute, not an
  availability status, and nothing asks for them to be edited.
- **The web Dashboard's seeded Leave and Productivity panels:** Phase 38 removes them (RV-18). Do not
  link them to the calendar.
- **Office-side bulk availability** (an admin setting a colleague's days off from the Day grid). The
  store actions allow the office, but no Admin UI is added.
- **Hospitals, insurers and public holidays as editable masters, and spreadsheet loads:** Phase 42.
  The Availability statuses editor built here is its pattern.
- **A config page for warnings and thresholds** (US-13.7.4, Future).
- **A responsive or tablet web layout** (noted in US-15.0.2's gap; not required).

## Manual test checklist

The agent runs every item itself in the running app and reports it with evidence; none is handed
to the owner (ROADMAP.md "Owner review: agents test themselves").

- [ ] Mobile, Availability: the "My availability" card shows today's AM and PM as chips (or the List
  where one sits). "Change" opens a bottom sheet whose status choices are exactly the active,
  anaesthetist-settable statuses (Free, On holiday, Unavailable). No Free or Block buttons remain.
- [ ] From the card, "My calendar" slides in the calendar with no tab bar. July shows Souter's seeded
  leave on Fri 24 to Sun 26 as Holiday half-blocks, and booked sessions show their List. Paging forward
  stops at the horizon month, and back stops at the current month.
- [ ] Days off ahead: "Add days off", then 1 week from Mon 10 Aug: the result line counts the sessions
  set. The Admin Day grid for those days shows Holiday at once.
- [ ] Series: set Unavailable, PM, every 2 weeks on Friday, no end date. The result line counts the
  sessions set and those left as they are; Souter's seeded Fri 24 Jul holiday is untouched. Each
  instance shows the repeat glyph, and "Your series" lists the rule in words.
- [ ] One instance: tap a series Friday and "Change this one" to On holiday: only that Friday changes.
  Tap another and "Delete this one": it returns to Free. Advance the demo clock a week (the harness bar
  clock menu): the edited and deleted instances stay as set, and the new far-edge Fridays fill.
- [ ] "Delete the series": future instances return to Free, the edited one keeps Holiday, past ones are
  unchanged. Audit shows the create, the two instance edits and the delete, each once.
- [ ] Interim on a booked session: set a booked session of Souter's (for example Tue 21 AM) to Free:
  no conflict is raised and the result line says so. Set it to Unavailable: the panel shows the
  interim line before saving, the result line says the List is flagged on the office's Day view, and
  the Admin Day grid shows one amber conflict with the List's surgeon, hospital and Bookings unchanged.
  No line anywhere says the office was notified. Set it back to Free: the conflict is gone. Reset
  before the S2 checks below.
- [ ] A range ending before it starts, a past date, or a series with no weekday is refused with a plain
  message and nothing changes.
- [ ] Web, Availability: the "Find cover" and "My availability" switch works. On My availability,
  click then shift-click selects a range, the rail's form sets it, a series can be created and an
  instance changed or deleted, and the mobile calendar shows the same result (same store). The "(you)"
  row's "Change" link on Find cover opens that date.
- [ ] Admin, Master data, Availability statuses: three rows, each with a live chip and a read-only ID
  (`free`, `holiday`, `unavailable`), the List-type footnote, and no provisional line.
  - Rename Unavailable to "Blocked": the chip, the legends, the Day grid, the mobile colleague cells and
    calendar, and the web grid all read "Blocked" without a reload, and a booked session marked
    Blocked still flags exactly as Unavailable did (rules read the ID).
  - Change its colour to another token and back: every surface follows.
- [ ] Add a status "Public hospital" (not open for bookings, unavailable token, hatched, anaesthetists
  can set): it gets the ID `ST0001`, appears in the mobile and web choices and in the legends, and a
  session set to it is not counted free by the finders (the same effect as Unavailable). Use it in a
  series, and retiring it is refused with the count. Delete the series, retire it: it leaves the
  choices and the legends, a session already carrying it still renders it, and restoring it brings it
  back.
- [ ] Trying to retire Free (the default), a duplicate label, or a label with an em dash or the word
  "slot" is refused with the reason.
- [ ] No rendered text on the mobile and web availability screens, the sheet, or the Admin statuses
  screen contains "slot".
- [ ] S2 runs unchanged: Beat 1's Tue 21 grid is identical; Beat 2's phone-advice booking on Sharma Tue
  21 PM; Beat 3's reassignment of Rutherford Wed 22 AM to Sharma.
- [ ] PWA build (`npm run build:pwa`, then preview on a phone-sized viewport): the calendar route, the
  sheet, "Add days off" and the series controls work and clear the insets and tab bar.
- [ ] No en or em dash in any new copy, no crimson on any new control, and teal is the only action
  colour.
- [ ] Catalogue screenshots: the recipes for the covered items above are created or updated, any recipe this phase broke is re-pointed, a full `npm run capture` ends with no failed recipe and no story without a recipe, the covered items' new shots are checked by eye, and `npm run verify:board` is green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots` and `npm run verify:board` are all green.

## Demo guide updates

In the same session (the ROADMAP rule: each phase patches the beats it touches). S2 is re-scripted
after Phase 32, so keep these edits small:
- `docs/demo-guide/03-demo-script.md`:
  - **S2 Beat 1:** the legend now reads the three List types, then the availability statuses from
    master data (same six labels as before). Update the Expected line only if its wording names the
    legend order.
  - **S2, an optional opening moment** before Beat 1: on mobile, My calendar, "Add days off" for a week
    in August; then a series (Unavailable, Friday PM, every 2 weeks) and "Delete this one" on one
    Friday; then switch to Admin and show both on the Day grid, and Master data, Availability statuses
    (rename one, or add "Public hospital", and show it reach the phone). Add Click, Say ("Availability
    belongs to each session. Anaesthetists mark days off weeks ahead from the phone or the web, set
    repeating days off, and change or delete one occurrence. The office sees it straight away. The
    statuses themselves are a list the office maintains: rename, recolour or add one, and every app
    follows, because the rules read the status, not its name.") and Expected lines, and a reset note
    before Beat 1. Add a presenter note: do not mark a booked session unavailable in this moment
    (until the return-or-assign choice is built it only flags the List).
  - **S2 Discovery points:** the run sheet opens with "whether availability/holiday conflicts are hard
    constraints or warnings"; leave that point to Phase 30. Add, as settled context rather than a
    question, that availability is a status on each session kept from the anaesthetist's calendar (one
    mechanism, OQ-17, OQ-27 and OQ-64 answered) and that the status values are a list AA maintains,
    starting from Free, On holiday and Unavailable, with the final values to be agreed with AA's users.
    If Phase 28 already added an OQ-64 line, rewrite it rather than adding a second.
  - **Direct URLs:** add `/mobile/availability/calendar`, `/web/availability/mine` and
    `/admin/masters?view=availability-statuses`.
- `docs/demo-guide/04-presenter-cheat-sheet.md`:
  - section 6 (availability and holiday conflicts): a bookable status never conflicts; a closed status
    on a booked session flags the List for now, and the settled rule (return it to the office or hand
    it to a colleague) is still to be built, so do not demo that path;
  - one line on the status master ("rename, recolour or add a status and every app follows; rules read
    the status's ID");
  - add "mark days off ahead, repeating days off, change or delete one occurrence" to the mobile and web
    feature lists.
- `docs/demo-guide/02-workflows-and-handoffs.md`:
  - the cover workflow's steps 1 and 2 (lines 194 to 195: keep availability in the calendar, which sets
    the session's status directly; nothing is reconciled);
  - lines 77 and 78 (availability is no longer "reconciled against the canvas": the session's status
    is set directly; the status list reads List types plus availability statuses from master data).
- `docs/demo-guide/01-personas-and-responsibilities.md`:
  - Dr Souter's mobile duty (line 47: "use Availability to mark days off weeks ahead, including
    repeating days off, or to request cover");
  - replace "submitting leave requests is outside this prototype" (line 119) with the calendar, noting
    the seeded Leave panel stays until Phase 38.
- `docs/demo-guide/master-demo-guide.html`: mirror the same S2 edits, discovery points, Direct URLs
  table and cheat-sheet lines, word for word.
- **Control Panel scenario text** (`apps/demo/DemoControlPanel.tsx`, the S2 blurb): mention the
  optional days-off moment only if the blurb lists beat content. No trigger is added.
- This is not a milestone phase, so no full consistency read. Check the patched sections match the run
  sheet, and that no guide line says the office is notified when a booked session is marked unavailable.

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19),
run after the review pass and before the PROGRESS.md entry. Re-run
`node docs/prototype-build/catch-up/tools/recipe-status.mjs 29` first: earlier phases may have
changed these recipes since this plan was written (Phase 28 re-points several of them).

**Covered items.** When the phase is done, each recipe in `requirements-board/capture/recipes/`
matches what was built. Name the new `data-shot` hooks from item 16 (suggested:
`mobile-availability-calendar`, `mobile-availability-sheet`, `web-availability-mine`,
`admin-availability-statuses`) and use them in the highlights. No caption says "slot" except where it
names the requirement itself.

| Item | Recipe at plan time | When this phase is done |
|---|---|---|
| [US-01.2.1](../../../../requirements-board/requirements/stories/US-01.2.1.md) Anaesthetist sets half-day availability | partial · mobile-my-availability (before, pm-blocked), web-availability-grid | captured. Re-shoot `my-availability` (mobile, `/mobile/availability`): the Find cover screen with the "My availability" card, the day's AM and PM chips and a "Change" button. Drop the `pm-blocked` state: its caption claimed "the office notified", which was never true, and the booked-session case is now US-01.5.5 (Phase 32). Add a mobile `calendar` shot at `/mobile/availability/calendar` (July, Souter's seeded leave 24 to 26 Jul) and a state `sheet` with On holiday and "1 week" selected, showing the three seeded choices. Re-shoot `availability-grid` (web) and add web `my-availability` at `/web/availability/mine` with a range selected and the rail form showing; add an admin state where the Day grid shows the change at once (open the anaesthetist's day after saving). The Free and Block buttons and the `availability-block-*` hooks are gone. Caption: "Anaesthetist marks a session Free, On holiday or Unavailable, with an optional note". Drop the partial reason. |
| [US-01.2.2](../../../../requirements-board/requirements/stories/US-01.2.2.md) Slot status master data | partial · admin-list-statuses | captured. Re-shoot `list-statuses` (keep the shot name; the nav entry is now "Availability statuses", so the `text="List statuses"` click changes) with states `table` (live chips, the read-only ID column, Open for bookings, Anaesthetists can set, Default, no provisional line), `sheet` (Edit: read-only ID, label, six colour swatches, treatment, live preview) and `renamed` (the Day grid legend after renaming Unavailable to "Blocked" in the recipe's steps, the criterion that every view shows the new label). Caption: "Admins add, rename and recolour availability statuses without code; rules read each status's fixed ID". Drop the partial reason. |
| [US-01.5.3](../../../../requirements-board/requirements/stories/US-01.5.3.md) Anaesthetist availability calendar | partial · mobile-my-availability (before, blocked) | captured. Re-shoot `my-availability` (keep the name) as the calendar: states `month` (mobile `/mobile/availability/calendar`), `series-sheet` (the form with "Every 2 weeks", Friday and PM selected), `instance` (a series instance's panel: Change this one, Delete this one, Delete the series; stage the series with the form's steps, not a store call). Drop the `blocked` state ("PM blocked while booked: flagged as a conflict for the office"): marking a booked session unavailable is now the return-or-assign choice, US-01.5.5, Phase 32. Web: `/web/availability/mine` with the "Your series" list. The calendar edits the session's status directly, so the "separate calendar independent of Lists" reason (OQ-27) goes. Caption: "Days off marked weeks ahead, a repeating series, and one instance changed or deleted". |
| [US-03.1.4](../../../../requirements-board/requirements/stories/US-03.1.4.md) Web app parity | captured · web-card-capture, mobile-card-capture | captured. Keep `card-capture` (web and mobile) as Phase 15 left it. Add a `my-availability` pair showing the same capability on both apps: mobile `/mobile/availability/calendar` and web `/web/availability/mine`, no highlight. Caption: "The same availability calendar on web and on mobile". |
| [US-15.0.2](../../../../requirements-board/requirements/stories/US-15.0.2.md) Mobile-first for anaesthetists | captured · mobile-lists-home, web-lists | captured. Keep `lists-home` and `lists`. Add a mobile shot of the Add days off bottom sheet (chips and segmented controls, a sticky teal action, no dropdown, no centred modal) at `/mobile/availability/calendar`, highlighting the sheet. Caption: "Availability is set from a bottom sheet with chips, built for one-handed use". |

**Recipes this phase breaks.**
- `US-01.5.2` mobile `unavailable-conflict` ("Blocking a booked session flags a conflict"): clicks
  `[data-shot=availability-block-pm]`, which is removed with the Free and Block buttons. Drop this
  shot rather than re-point it: at `3d3a18c` US-01.5.2 no longer covers an anaesthetist marking a
  booked session unavailable (that is US-01.5.5, Phase 32). Leave its admin shots (the hospital
  closure and the seeded conflict) to Phase 30, which owns that recipe; check they still pass.
- `US-01.2.1` and `US-01.5.3` (`my-availability`): both click `availability-block-pm`; re-pointed
  above.
- `US-13.4.1`: clicks `role=button[name="List statuses"]`; the nav entry is now "Availability
  statuses". Re-point the click and the caption, and update its partial reason (statuses are now
  editable).
- `US-01.4.2` (`availability-finder`) and `US-01.4.3` (`cover-request`): start at the bare
  `/mobile/availability` and `/web/availability`, which stay the Find cover screens, and use "Free only";
  the page gains the "Find cover / My availability" segmented control. The recipes should pass; look
  at the shots, and check that the free counts use `isOpenSlot` (a session holding a List is not free).
- Keep the `availability-mine` hook and the "My availability" card title; recipes rely on them
  (`mobile-insets.spec.ts` does too).

**ATLAS.md.** Routes: add `/mobile/availability/calendar`, `/web/availability/mine` and
`/admin/masters?view=availability-statuses`, and note that the bare availability routes are Find
cover. Existing hooks: drop `availability-block-am` and `availability-block-pm`; add the new calendar,
sheet and statuses hooks. Overlays: the availability bottom sheet, the series-instance panel and the
status sheet. Seed data: Souter's leave 24 to 26 Jul on the calendar; the three seeded status IDs; no
series is seeded.

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
- **One mechanism.** The calendar, the range action, the series and the instance edits all write the
  Slot's own status; nothing reads availability from anywhere but Slots (the series is a rule plus
  exceptions, read only for its description). No second availability record survives.
- **Statuses are a user-maintained list, rules read the ID.** No app, shared or store file compares a
  Slot status to a literal key or a label. Every finder, filter, count and clash rule goes through
  `domain/slotStatus.ts`. Renaming or recolouring a status changes every view and no rule; adding a
  status in Admin, with no code change, makes it selectable, rendered and correctly bookable or closed
  everywhere. IDs are fixed (seeded or generated, never edited) and cannot collide with a List kind.
- **Series integrity.** Occurrences are pure and deterministic on the demo clock; a single-instance
  edit or delete is recorded as an exception and survives a later series write, a clock roll forward
  and a horizon extend; a series never overwrites a session the anaesthetist already set; deleting a
  series reverts only its own untouched future instances; every Slot-generating path feeds series
  into the generator's calendar step through the one helper, before recurring bookings, so a
  recurring booking on a series-closed session is traced as a clash, never placed and flagged.
- **The design language holds.** The palette is exactly the six Design Language tokens, and no new hex
  appears. The seeded statuses and every List render exactly as before (hatch and dashed strings
  identical). Every chip and block carries its label. Crimson and teal are never a status colour.
- **Availability never merges into the List.** No action edits a List's surgeon, hospital, Bookings,
  times or List type. A bookable status on a List raises nothing and clears its availability conflict.
  A closed status flags once and replaces rather than stacks. The clash outcome comes from the one
  `availabilityClash` function, whose doc comment names the settled rule that replaces `'flag'`
  (32's return-or-assign) and why generation never reaches it (31's Draft List takes 28's traced
  clashes).
- **Honest copy.** No line in any app says the office was notified or told; the interim says the List
  is flagged on the office's Day view. No "slot" in any rendered string (OQ-64), including validator
  messages, audit labels and refusals. No provisional label for OQ-64, OQ-17 or OQ-27 remains.
- **Range integrity.** Each action is all or nothing on refusal, with one `mutate()` and one audit entry
  plus one entry per List affected. Past and beyond-horizon dates are refused. Timestamps come from the
  clock. Determinism holds, and the golden canvas fixture is unchanged.
- **Master-data safety.** Exactly one default and it is bookable; the default and statuses used by an
  active series cannot be retired; retire keeps history and existing sessions still render; labels are
  unique; the validator rejects en and em dashes and "slot" in admin-entered labels.
- **Parity.** The web app can do everything the mobile availability screen can (single session, both
  sessions, range, series, edit or delete one instance, note) through the same `AvailabilityForm`,
  `AvailabilitySlotPanel` and store actions, in a real desktop layout. The mobile calendar is
  mobile-first (slide-in layer, bottom sheet, chips), and the PWA route, insets and import closure are
  intact. S2 is unchanged.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry; ROADMAP.md "Owner review: agents test
  themselves"): the readings built, anything logged rather than fixed, and the screens worth a look,
  each with its route and persona. At least:
  - the seeded values (Free, On holiday, Unavailable) and their colours, chosen for now; the final set
    is to be agreed with Vanessa and AA's users (US-01.2.1, US-01.2.2);
  - the List types private, public and pre-op kept as a fixed List attribute with the design's colours,
    although the catalogue has no List kind (DM-04);
  - the Admin nav name "Availability statuses" (the catalogue's "Slot status", kept out of the UI);
  - generated IDs (`ST0001`) for added statuses, shown read only;
  - the interim flag on a booked session marked unavailable (one-off, range or series) until Phase 32,
    and how a series over several Lists will need Phase 32's choice List by List (not discussed,
    US-01.5.5 note);
  - a recurring booking whose generated session a series has closed is not placed and is traced as
    a clash (28's interim) until Phase 31 makes it a Draft List;
  - routes: `/mobile/availability/calendar` (Dr Souter), `/web/availability/mine` (Dr Souter),
    `/admin/masters?view=availability-statuses` (Kirsty).
- **Status row** for catch-up Phase 29, and a phase entry with:
  - the drift-check result (items changed or not against `3d3a18c`; OQ-64 answered, built as
    answered);
  - what was built, per work item;
  - the `PERSIST_VERSION` bump (from and to);
  - tests added;
  - the review pass;
  - the Catalogue screenshots result: the recipes created or changed (US-01.2.1, US-01.2.2, US-01.5.3,
    US-03.1.4, US-15.0.2 and the recipes this phase broke), the REPORT.md counts (captured, partial,
    absent, failed) before and after, and any partial reason handed to a later phase.
- **Decisions log:**
  1. **The Slot status set is a user-maintained master list** (`masters.slotStatuses`, `SlotStatus`),
     availability values only, each with a fixed internal ID that rules read, an editable label and an
     editable colour (OQ-64, US-01.2.2). This amends convention 10 and supersedes the 2026-07-21
     "Status colour mapping" as a closed six-key set: the palette stays in `src/theme/statusColours.ts`
     as the six Design Language tokens, statuses reference a token, and the List types (private,
     public, pre-op) are a fixed List attribute mapped to their own tokens (the OQ-17 answer).
  2. **One mechanism** (the OQ-27 and OQ-64 answers): the calendar writes the Slot status directly, and
     a series is a rule that writes Slots, with instance edits and deletes kept as exceptions. This
     supersedes item (2) of the 2026-07-22 external plan review (availability writes a master).
  3. **A series fills only Free sessions in no other series**, and an open-ended series keeps filling
     wherever Slots are generated (roll forward, horizon extend, an earlier start date, a
     reactivation), painted as the anaesthetist's calendar before recurring bookings (OQ-81 part 1), so
     a recurring booking on a series-closed session is traced as 28's `RecurringClash` for Phase 31.
     Deleting a series ends it and returns its untouched future instances to Free.
  4. **A bookable status over a List raises no conflict and clears the availability conflict.** This
     supersedes the 2026-07-23 "Availability reconciliation, both directions" ruling for the un-block
     direction. The restatus half was already superseded by Phase 28.
  5. **The clash with a List is a flag, in one function (`availabilityClash`)**, the interim for
     Phase 32's return-or-assign (US-01.5.5) when an anaesthetist marks a booked session closed (one-off,
     range, series or instance edit). Generation never reaches it: a recurring booking on a
     series-closed session is not placed and stays 28's traced clash until Phase 31's Draft List (OQ-81
     part 2). The false "office notified" copy is removed.
  6. **Statuses are retired, never deleted.** IDs are fixed (seeded `free`, `holiday`, `unavailable`;
     added `ST####`), never edited and never a List kind, and one bookable default (Free) is required.
  7. **One display key space:** the display key is the List's kind when a List is in the Slot, otherwise
     the Slot's status ID unchanged.
  8. **"Available for emergency" is not seeded**, nor any extra kind of unavailable: the owner's
     starting set is Free, On holiday and Unavailable, and an admin can add more (Greg's "several
     versions of unavailable ... same effect").
  9. **One availability store:** record what happened to `masters.availability` (folded into Slots).
  10. **"Slot" never reaches app copy** (OQ-64 part 5): the master is "Availability statuses" in the UI,
      and the validator refuses the word in admin-entered labels.
- **Handoff notes:**
  - For **30**: use `isClosed`, `isOpenForBooking` and `availabilityClash` for conflict raising, the
    List colour change and clearing. This phase clears only on a bookable status replacing a closed one.
    There is no emergency status, so no `isEmergencyOnly`. Generation never calls `availabilityClash`
    (series are painted before recurring bookings, so nothing generated sits on a closed session). The anaesthetist-marks-a-booked-session case
    is no longer a US-01.5.2 conflict at `3d3a18c` (it is US-01.5.5, Phase 32); the US-01.5.2 mobile
    recipe shot was dropped.
  - For **31**: `seriesCalendarFor` feeds active series into `generateCanvasForDates`' calendar step
    on every generating path, so a recurring booking on a series-closed session comes back in 28's
    `clashes` like one under seeded leave; turn those into Draft Lists (OQ-81 part 2). Availability for
    a day beyond the horizon is held only by a series (one-off ranges stop at the horizon end, and
    `validateSeriesDraft` refuses a start past it): 31's "Stage recurring clash" needs a single-day
    series (start and until the same day), so let the office simulation actor start one past the
    horizon end (a store option, no UI) and record that. Do not turn the anaesthetist's own
    unavailability into a Draft List here (Phase 32 asks them). Draft List assignment targets
    `isOpenSlot` sessions.
  - For **32**: replace the `'flag'` branch for anaesthetist actions (`setAvailability`,
    `setAvailabilityRange`, `createAvailabilitySeries`, instance edits) with the return-or-assign choice
    (US-01.5.5), using the actions' `flagged` List ids; replace the `AvailabilitySlotPanel` interim line
    with that choice. The anaesthetist's own List move can be reached from the panel (it shows the
    List); the mobile calendar route and the web `/web/availability/mine` exist. Cover still runs on
    `isOpenSlot` sessions until 32 removes it. The vacated-session picker reads the status records
    (OQ-84).
  - For **38**: the calendar holds real days off, so the seeded Leave panel can go without loss; 38a's
    find-past-work calendar is a different calendar (List, Booking, Procedure) and can reuse the month
    grid.
  - For **42**: the Availability statuses editor and `validateSlotStatusDraft` are the pattern for the
    other masters, and a loader target.
  - For **44**: S2's optional days-off, series and status-master moment, and the legend's List types
    then availability statuses.
