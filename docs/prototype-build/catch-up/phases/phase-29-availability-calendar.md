# Phase 29 · Availability calendar and status master

**Requirements covered:**
[US-01.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.2.1.md) Anaesthetist sets half-day availability (Verify) ·
[US-01.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.2.2.md) Slot status master data (Verify) ·
[US-01.5.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.5.3.md) Anaesthetist availability calendar (Verify) ·
[US-03.1.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.1.4.md) Web app parity ·
[US-15.0.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-15.0.2.md) Mobile-first for anaesthetists.
Also touches, without closing:
[FT-01.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-01.2.md) (the feature, now "one mechanism": the Slot status and the calendar are the same thing; Phase 28 put the status on the Slot, this phase gives it the calendar),
[US-01.2.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.2.3.md) (closed in 28: the List shows in place of the status; this phase must not regress it),
[US-01.5.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.5.2.md) and
[US-01.5.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.5.4.md) (conflict flagging and the dashboard; Phase 30),
[FT-01.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-01.6.md) (Draft Lists, including Lists an unavailable anaesthetist leaves behind; Phase 31),
[DM-04](../analysis/domain-model-delta.md#dm-04) (availability is a status on the Slot, kept from one calendar with series, and the status set is editable master data: this phase delivers the calendar, the series and the master on top of 28's Slot),
[RV-14](../analysis/reverse-check.md#rv-14-list-status-mixes-availability-with-booking-type-empty-slot-modelled-as-a-list) (28 split the model; this phase takes the availability values out of the List-type set for good).
**Open questions:** [OQ-64](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-64.md) (the logical model: the final status values, their colours and names, and whether an unavailable anaesthetist's Lists become Draft Lists or carry a conflict flag). Its recommendation (keep the working model, Draft Lists for unavailability, names settled with AA's users) is built across 28 to 31.
[OQ-17](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-17.md) and
[OQ-27](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-27.md) are **Answered** (2026-10-01): availability values belong to the Slot, not the List; the calendar edits the Slot status directly (one mechanism, nothing to reconcile); the anaesthetist marks days off ahead, creates a series and edits or deletes one instance. Both hand their remaining parts to OQ-64.
**Depends on:** Phase 28 (the Slot record holds the availability status and default times from each anaesthetist's start date, a List has its own id and sits in a Slot and shows in place of the status, and status no longer derives from bookings). Also Phase 14 (the demo-trigger registry; this phase registers nothing, but its new routes must fit the route matcher) and Phase 17 (the Master data `?view=` param, the `apps/admin/screens/masters/` split and the editable-master sheet pattern). 17 is not a hard dependency in the outline: if it is not DONE, build the editor inside `MasterData.tsx` and add the `?view=` search param the way 17's plan describes (read from and written to the query), so 17 can adopt it.
**Estimated:** 2 sessions. Session 1 is work items 1 to 10 (model, pure status and series rules, seed, palette, shared status UI, the store actions and the Admin status editor) and stops green; if it runs long, move item 10 (the Admin editor) to the start of session 2. Session 2 is items 11 to 17 (the shared availability pieces, the mobile and web calendars, the finders, removals, shots and the demo guide).

## Goal

At the snapshot an anaesthetist can mark a session Free or Block, on mobile only, for the next six
days only. There is no holiday button, no range, no repeating days off, and no control at all on the
web app. Availability is a separate master row reconciled into the List, and pressing Free on a
session that already holds a List raises a false conflict ("Marked available, but this List carries
booking context"). Phase 28 moves the status onto the Slot (`Slot.status`, written directly by
`setAvailability`) and stops raising that false conflict, but it keeps the six-day Free and Block
screen, leaves an earlier availability conflict in place when the session is set back to Free, and
keeps the statuses closed: 28's `SlotStatus` union (`free`, `unavailable`, `holiday`) plus `ListKind`
(private, public, pre-op) make up the six-key `DisplayStatusKey`, kept identical to the theme's
`StatusKey` by a parity test, and the Admin "List statuses" master is view only with no colour.

This phase:

- gives the anaesthetist a **month calendar of their own half-day Slots**, weeks ahead to the canvas
  horizon (four months), on mobile and on web. Every Slot is Free by default. From the calendar they
  **mark days off ahead** (one Slot, both Slots of a day, or a date range, to any status they may set,
  for example Holiday or Unavailable, with an optional note), **create a series** (repeating days off:
  a status on chosen weekdays and sessions, every week or every few weeks, until a date), and **edit or
  delete one instance** of a series. A day off that is not in a series can be removed (back to Free).
  The office sees each change on its Day grid at once (US-01.2.1, US-01.5.3);
- makes the calendar **edit the Slot status directly** (OQ-27 answered, FT-01.2): there is no second
  availability record. A series is a rule that writes the status onto its Slots, and records each
  single-instance edit or delete as an exception so it is never overwritten; nothing reads
  availability from the series, only from Slots. Where a Slot already holds a List, the List keeps
  showing in place of the status (28's rule). A closed status over a List flags the List for the
  office and never changes it; a bookable status over a List raises nothing and clears an earlier
  availability flag, which finishes the false-conflict fix 28 started. How the clash is finally handled is OQ-64 (its
  recommendation, Draft Lists, is built in Phase 31), so the clash rule lives in one pure function
  that 31 replaces;
- brings the web app to parity: everything the mobile availability screen does, the web app now does
  too, through the same shared form and the same store actions (US-03.1.4, US-15.0.2);
- turns the Slot status set into **editable master data** (US-01.2.2). Admins add, rename, recolour
  and retire statuses without code. Each status has a description, a colour chosen from the design's
  six status colour tokens (never a free hex) and a fill treatment, and says whether it is open for
  bookings and whether anaesthetists may set it. The master holds **availability values only**: the
  OQ-17 answer put them on the Slot, not the List, so the List types (private, public, pre-op) leave
  the status set and stay a fixed, design-coloured List attribute. The design's three availability
  statuses (Free, Holiday, Unavailable) are the seeded values. Their final names and colours are
  OQ-64, so they are labelled provisional in one place, the Admin Slot statuses header. Every app's
  chips, blocks, legends and grids read the records, so a rename or recolour shows everywhere
  immediately.

The design language survives intact: the six palette tokens, the hatched and dashed treatments, and
"colour is never the only signal" all stay in `src/theme/`. What moves is the list of availability
statuses, not the palette.

## Before you start: drift check

1. Diff the catalogue for this phase's items against the plan's snapshot:

   ```
   git diff 501b0b8 -- "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-01.2.1.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-01.2.2.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-01.5.3.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-03.1.4.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-15.0.2.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/FT-01.2.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-01.2.3.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-01.5.2.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-01.5.4.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/FT-01.6.md" "docs/discovery-reference/Updated Requirements/catalogue/questions/OQ-64.md" "docs/discovery-reference/Updated Requirements/catalogue/questions/OQ-17.md" "docs/discovery-reference/Updated Requirements/catalogue/questions/OQ-27.md" "docs/discovery-reference/Updated Requirements/domain-model.md"
   ```

   If an item changed, re-read it and adjust the work items before planning. If a covered item is now
   Retired or Future, drop it from this phase and say so in the PROGRESS entry. A new item on the
   same surfaces (for example leave approval, or a config page for availability) comes in only if it is
   small and on these screens; otherwise note it for the owner.
2. **OQ-64 (the logical model).**
   - **Still open (expected):** build as this doc describes. The status values are seeded from the
     design and labelled provisional in one place only: the Admin Slot statuses header ("Status values,
     names and colours are provisional until AA names them (OQ-64)."). No anaesthetist-facing copy
     mentions it. A closed status over a List raises a conflict flag through the one clash function
     (work item 2); Phase 31 builds the recommendation (the Lists become Draft Lists).
   - **Answered with named values and colours:** seed AA's values instead, still choosing colours from
     the six design tokens, and drop the provisional header line. If AA's list needs a colour the design
     does not have, do not invent a hex: reuse a token (the label always disambiguates) and raise it
     with the owner for a Design Language change.
   - **Answered that an unavailable anaesthetist's Lists stay theirs with a conflict flag:** same build;
     tell the owner, because Phase 31's unavailability route then goes.
   - **Answered that an unavailable half-day is a List (Greg's "unavailable list"), or that the day is
     the parent and Slots are only a view:** stop at the drift check and raise it with the owner before
     planning. It reverses part of Phase 28 and changes what the calendar writes. The calendar UI, the
     series rules and the shared form in this doc survive; the storage does not.
3. **Baseline.**
   - Confirm Phase 28 is DONE in PROGRESS.md.
   - Read its entry and Decisions-log rows for the names it chose. Phase 28's plan expects, and this
     doc assumes where it says "28's":
     - `Slot` in `schedule.slots` (id `S-<reg>-<date>-<AM|PM>`), created from each anaesthetist's start
       date, with `status: SlotStatus` (the union `'free' | 'unavailable' | 'holiday'`, const
       `SLOT_STATUSES`, free by default) and `note?`;
     - `List.kind: ListKind` (`'private' | 'public' | 'preop'`, `LIST_KINDS`) replacing
       `List.statusKey`, and `PermanentList.kind` (recurring bookings after Phase 30's rename);
     - the six-key display union (`DisplayStatusKey` / `DISPLAY_STATUS_KEYS`, the same six strings as
       today), derived by `displayStatusKey(slot, list)` in `domain/slots.ts` (a List present returns
       its kind in place of the status, otherwise `slot.status` as it is: no remap), and
       `isOpenSlot(slot, list)` (status free and no List) in the same module;
     - `statusKeyParity.test.ts` kept with a second line checking `SLOT_STATUSES` and `LIST_KINDS`
       together are the six keys;
     - `ListStatus` master rows keyed by the display union, with 28's provisional line on the view;
     - `masters.availability` removed, `AnaesthetistAvailability` renamed `SeedLeaveWindow` and the seed
       constant `SEED_LEAVE` (generator input only);
     - in `store/slotActions.ts`: `setAvailability(api, actor, anaesthetistId, dateISO, session, status,
       note?)` (refusals include `noSlot` before the start date; outcome `{ result: 'updated' |
       'conflictFlagged' | 'noChange' }`; audit `slot.status`), `assignListToSlot` (`invalidKind`,
       `slotNotAvailable`), `moveListToSlot` / `reassignList` (`targetNotOpen`, `vacatedStatus` defaulting
       to `'free'`) and `requestCover` (`notFree`); `slotViewsForDate` and `slotViewsForAnaesthetist` in
       `store/selectors.ts`; `rollCanvasForward` in `store/clockActions.ts` calling
       `generateCanvasForDates`;
     - the golden canvas fixture: `domain/seed/canvasGolden.test.ts` over
       `domain/seed/__fixtures__/canvas-golden.json` (display keys per Slot).
     Use 28's actual names wherever they differ; this doc's code references are as at the snapshot.
   - Check whether 28 already stopped a bookable status from flagging a conflict on a Slot that holds a
     List (its plan says it does, but leaves an earlier availability conflict in place). If it did,
     keep its test; work item 7 still adds the clearing.
   - Check how 28 generates Slots on a clock advance (`rollCanvasForward`): work item 8 applies active
     series to the new far-edge Slots there.
   - Note the current `PERSIST_VERSION` in `src/store/appStore.ts` (13 at `501b0b8`; 14 to 28 will
     have bumped it) and bump it by one from whatever it is now.

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

**Catalogue:** the covered items above; `docs/discovery-reference/Updated Requirements/domain-model.md`,
"Slot, List and Draft List" (a Slot defaults to free and holds an availability status, which belongs
to the Slot, until a List is put in it; the anaesthetist keeps it from a calendar with days off ahead,
a series and single-instance edits; one mechanism, not two to reconcile) and the "Availability
conflicts" row of the changes table (soft warning, flagged and coloured). The meeting note
`catalogue/notes/2026-10-01-aa-meeting-with-greg.md` points 9, 13, 42 and 44 ("recurring days off
are a rule on the anaesthetist's calendar").

**Analysis:**
- `docs/prototype-build/catch-up/GAP-ANALYSIS.md`: theme 1 (schedule rebuilt on Slot, List and Draft
  List; "availability becomes a status on the Slot, kept from one calendar with series") and theme 12
  (small parity items), the Uncertainty bullet on OQ-64, the DM-04 row, and the EP-01, EP-03 and EP-15
  tables.
- `docs/prototype-build/catch-up/epics/EP-01.md` (FT-01.2, US-01.2.1, US-01.2.2, US-01.5.3, and the
  EP-01 structural note), `epics/EP-03.md` (US-03.1.4), `epics/EP-15.md` (US-15.0.2).
- `docs/prototype-build/catch-up/analysis/domain-model-delta.md` (DM-02, DM-04) and
  `analysis/reverse-check.md` (RV-14).
- `analysis/prototype-map-apps-mobile-web.md` (Availability sections), `prototype-map-admin.md`
  (Master data, Day grid), `prototype-map-domain.md`, `prototype-map-store-seed.md`,
  `prototype-map-shared.md` and `prototype-map-shell-demo-pwa.md` (router and the PWA entry).

**Code entry points (as at the snapshot; use Phase 28's names where they differ):**
- `aa-prototype/src/domain/types.ts`: `LIST_STATUS_KEYS` and `ListStatusKey` (:53-61),
  `ListConflict` (:265), `List.statusKey` (:307), the Permanent List template's `statusKey` (:583),
  `AnaesthetistAvailability` (:593, kinds `available | unavailable | holiday`), `ListStatus` (:610).
- `aa-prototype/src/theme/statusColours.ts`: the `StatusKey` union (:12), `StatusTreatment` (:20),
  `STATUS_ORDER` (:39), `statusColours` (:48, labels "Holiday", "Unavailable", "Free"),
  `unavailableHatchTint` (:112), `unavailableHatchSolid`, `freeDashedBorder` (:120), `getStatus`.
  Tests: `theme/statusColours.test.ts` and `domain/statusKeyParity.test.ts`. `theme/global.css`
  mirrors the six hexes as `--color-status-*` (unused by components; leave it).
- `aa-prototype/src/shared/StatusChip.tsx`, `StatusBlock.tsx`, `StatusLegend.tsx` (with its `SAMPLE`
  text keyed by the six keys) and `shared/schedule/ListRow.tsx`.
- Every other reader of the union or the colour map: `apps/admin/components/DayGrid.tsx`,
  `ListDrawer.tsx`, `apps/admin/flows/PermanentListSheet.tsx`, `ReassignListFlow.tsx`,
  `apps/admin/screens/AdminCardDetail.tsx` (Booking detail after Phase 15), `ReviewScreen.tsx`,
  `IntegrationMonitorScreen.tsx`, `apps/admin/util.ts`, `apps/demo/DemoData.tsx`, `DemoXero.tsx`,
  `apps/mobile/screens/AvailabilityScreen.tsx`, `BalancesScreen.tsx`, `CardDetailScreen.tsx`,
  `ListDetailScreen.tsx`, `apps/web/components/WeekStrip.tsx` (:46, "On leave" fallback copy),
  `apps/web/screens/AvailabilityGrid.tsx`, `CardDetailView.tsx`, `DashboardScreen.tsx`,
  `ListDetailView.tsx`, `ListsScreen.tsx`, `shared/flows/RequestCoverSheet.tsx`, `store/lifecycle.ts`,
  `store/mastersActions.ts`, `domain/seed/cast.ts`, `domain/seed/index.ts`. Literal-key comparisons with
  no union import also sit in `apps/admin/AdminApp.tsx` (:152-155, the day free count),
  `apps/mobile/screens/ForwardListsScreen.tsx` (:97-129), `store/cardActions.ts` (:295) and
  `domain/seed/cards.ts` (:1168, seed, may stay). After 28, add its `domain/slots.ts`
  (`displayStatusKey`, `isOpenSlot`), `store/slotActions.ts` and the `slotView*` selectors. About 55
  literal comparisons exist at the snapshot
  (`grep -rnE "=== '(free|holiday|unavailable|private|public|preop)'" src`); 28 will have changed some.
- `aa-prototype/src/store/lifecycle.ts`: `setAvailability` (:703-830): the reconciliation, the false
  conflict for `kind: 'available'` on a List with booking context (:797-815), the per-slot audit
  metas. Phase 28 moves it to `store/slotActions.ts` (writing `slot.status`) and removes the
  false conflict; `store/mastersActions.ts` (:277, `masters.availability`) and
  `domain/seed/canvas.ts` also reference availability.
- `aa-prototype/src/store/clockActions.ts`: `rollCanvasForward` (:29, the far-edge generation on a
  clock advance, today fed `masters.availability`), where active series are applied (work item 8).
- `aa-prototype/src/store/mastersActions.ts`: `createHospital`, `editAnaesthetist`,
  `addPermanentList`, `editPermanentList` (the office-only, `mutate()`-with-metas pattern to copy).
- `aa-prototype/src/domain/seed/cast.ts`: `LIST_STATUSES` (:142); `domain/seed/availabilityAndHolidays.ts`:
  `AVAILABILITY` (:42) windows (Souter on leave Fri 24 to Sun 26 Jul, Beaumont, Ngatai, Ngata, Delaney,
  Ropata, Sharma); `domain/seed/canvas.ts` (availability rows take their Slot cleanly; the RNG fill is
  hashed per slot by `slotRng`, so a change to one Slot changes only that Slot); `domain/seed/index.ts`
  (`SeedMasters.listStatuses` :97, the masters assembly :412).
- `aa-prototype/src/domain/clock.ts`: `horizonFor` (:100, 14 days back, 4 months forward),
  `enumerateDatesISO` (:109).
- `aa-prototype/src/apps/admin/screens/MasterData.tsx`: the `NAV` entry `listStatuses` (:51) and
  `ListStatusesView` (:453, view only). Phase 17 splits this file into `apps/admin/screens/masters/`
  and adds the `?view=` param; build the editor in 17's structure.
- `aa-prototype/src/apps/mobile/screens/AvailabilityScreen.tsx` (six-day strip :47-55, the My
  availability card :182-202 with Free and Block, `setMine` :101-116);
  `apps/mobile/routes.tsx` (`MobileAvailabilityRoute` :163, and `MobileListsRoute` as the SlideStack
  pattern); `apps/mobile/navigation.ts` (`mobileTabForPath`, `listsStackLocation`);
  `apps/mobile/MobileApp.tsx` (`showTabBar`, :132).
- `aa-prototype/src/apps/web/screens/AvailabilityGrid.tsx` (no set-own control; own Free cell only
  offers cover), `apps/web/routes.tsx` (`WebAvailabilityRoute` :117), `apps/web/WebApp.tsx` (tab
  matching :16-22, min-width 1240), `apps/web/screens/DashboardScreen.tsx` ("Who's free", :90).
- `aa-prototype/src/router.tsx` (`availability` leaf routes for web and mobile) and
  `aa-prototype/pwa/main.tsx` (:78, the PWA's own `availability` route).
- `aa-prototype/src/shared/surface/` (`useSurface().Overlay`: a bottom sheet on mobile, a dialog on
  web), `shared/ui/SlidingSegmentedControl.tsx`, `shared/ui/Button.tsx`, `shared/ui/Field.tsx`.
- `aa-prototype/src/shared/audit/actionLabels.ts` and `fieldLabels.ts`; `auditNarrative.test.ts`
  fails if an emitted action code has no label.
- Tests to extend: `store/lifecycle.test.ts` and 28's `store/slotActions.test.ts` (wherever the
  setAvailability tests live), 28's `domain/slots.test.ts` (the `displayStatusKey` table),
  `store/canvasRoll.test.ts` (roll forward), `store/mastersActions.test.ts`,
  `domain/seed/seed.test.ts`, 28's `domain/seed/canvasGolden.test.ts` (the golden fixture),
  `store/persistMigrate.test.ts`,
  `domain/domainPurity.test.ts`, `apps/admin/components/DayGrid.test.tsx`,
  `apps/admin/flows/ReassignListFlow.test.tsx`, `src/pwa/pwaPurity.test.ts`; Playwright
  `visual/routing.spec.ts` (expects `/web/availability$` from the dashboard link; keep Find cover
  there), `visual/mobile-phase03.spec.ts` (`m-05-availability`),
  `visual/web-phase05.spec.ts` (`w-06-availability`), `visual/mobile-insets.spec.ts` (finds the "My
  availability" text), `visual/mobile-interactions.spec.ts` (the "Availability view" segmented group
  and its "Free only" button), `visual/pwa-device.spec.ts` (expects `/mobile/availability$`, so Find
  cover stays at the bare path), `visual/admin-phase07.spec.ts` (the master-data shot).

## Work items

Build in item order: model and pure rules, seed, palette, shared status UI, store, the Admin editor,
then the availability screens. Session 1 ends green after item 10 (the app builds, every existing
screen renders from the records, and the store actions are tested); session 2 is items 11 to 17.

1. **Domain types** (`src/domain/types.ts`) (US-01.2.2 "statuses can be added or renamed without any
   code changes"; US-01.5.3; DM-04):
   - `StatusColourToken`: the union of the design's six token names (`'private' | 'public' | 'preop'
     | 'holiday' | 'unavailable' | 'free'`, the `status/<name>` tokens of Design Language §02) and a
     `STATUS_COLOUR_TOKENS` const. Its doc comment says this is the palette, not a vocabulary.
   - `StatusTreatment`: `'solid' | 'hatched' | 'dashed'` (moved from the theme so the domain can
     store it; the theme re-exports it).
   - `SlotStatusKey = string` replaces 28's closed `SlotStatus` union and its `SLOT_STATUSES` const.
     Do this rename first, so the compiler lists every reader, and only then reuse the name `SlotStatus`
     for the master record below. `Slot.status` (28's field) is typed `SlotStatusKey`, validated
     against active records by the store, not by the type; `SeedLeaveWindow.status` likewise.
   - **List types stay closed and leave the status set.** `ListKind` / `LIST_KINDS` (private, public,
     pre-op) remain a fixed List attribute (the OQ-17 answer: availability values belong to the Slot,
     not the List), with a fixed `LIST_KIND_LABELS` (Private, Public, Pre-op; long label "Pre-op
     Assessment") moved out of the theme map. They are not master data in this phase.
   - **One display key space.** 28's `displayStatusKey(slot, list)` already returns `list.kind` when a
     List is in the Slot (the List shows in place of the status, US-01.2.3) and otherwise
     `slot.status` unchanged; it is retyped `ListKind | SlotStatusKey`, and 28's closed
     `DisplayStatusKey` / `DISPLAY_STATUS_KEYS` union goes. Status keys may never equal a List kind
     (the validator reserves them), so the space cannot collide. 28's `slots.test.ts` table keeps its
     rows (the keys do not change).
   - `SlotStatus` replaces `ListStatus`:
     - `key: SlotStatusKey`: a lowercase slug, immutable once created (Slots and series store it);
     - `label: string`: the chip label, at most 16 characters;
     - `longLabel: string`: headers and pickers, at most 32 characters;
     - `description: string` (US-01.2.2 "each status with its own description");
     - `colour: StatusColourToken` and `treatment: StatusTreatment` (US-01.2.2 "and colour");
     - `bookable: boolean`: open for bookings (the office may place a List and the finders count it as
       free); drives the finders and the clash rule, so no code compares literal keys;
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
     28's Decisions log keeps it on purpose, raise it with the owner: the OQ-27 answer rules out a
     second record.
2. **Pure status rules** (`src/domain/slotStatus.ts`, new, no React; Vitest `slotStatus.test.ts`):
   - `SEED_STATUS`: the three seeded keys as constants (28's stored `free`, `holiday`,
     `unavailable`). Literal availability keys may appear only here and in the seed.
   - Lookups: `statusFor(statuses, key)` (undefined-safe), `activeStatuses(statuses)` (ordered,
     retired excluded), `anaesthetistChoices(statuses)` (active, `anaesthetistCanSet`, ordered),
     `defaultSlotStatus(statuses)`.
   - Behaviour: `isOpenForBooking(status)` (bookable) and `isClosed(status)` (not bookable). Every
     finder, filter and clash rule in the app goes through these.
   - **The clash rule, in one place:** `availabilityClash(list, newStatus)` returns `'flag'` (a closed
     status over a List), `'clear'` (a bookable status over a List with an availability conflict) or
     `'none'`. Every path that changes a Slot status (one-off, series, instance edit or delete, roll
     forward) calls it. Its doc comment says it is the interim for OQ-64 and that Phase 31 replaces
     `'flag'` with turning the List into a Draft List.
   - `validateSlotStatusDraft(draft, existing, ctx)` returns a list of plain-language issues:
     - key: slug `^[a-z][a-z0-9-]{1,23}$`, unique, unchangeable on edit, and not a List kind
       (`private`, `public`, `preop` are reserved);
     - label 1 to 16 characters, longLabel 1 to 32, description 1 to 160; no en or em dash in any of
       them (the copy rule applies to admin-entered labels too, since they render in every app);
     - colour in `STATUS_COLOUR_TOKENS`; treatment one of three;
     - exactly one active default; the default cannot be retired or made not bookable;
     - a status used by an active series cannot be retired (the issue names the count); `ctx` carries
       those counts so the function stays pure.
   - `validateAvailabilityRange({ fromISO, toISO, sessions, todayISO, horizonEndISO })`: refuses
     `to` before `from`, any date before today, and any date past the horizon end. `slotsInRange`
     enumerates `{dateISO, session}` pairs with `enumerateDatesISO`.
   - Tests cover every rule above, plus: the seed has exactly one default and it is Free; every seeded
     status's colour is a palette token; `anaesthetistChoices` of the seed is exactly Free, Holiday,
     Unavailable, in that order; the clash table (closed over a List, bookable over a flagged List,
     either over an empty Slot).
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
     every 2 weeks, until 25 Sep". No en or em dashes.
   - Tests: weekly and fortnightly rules across a month boundary and a daylight-saving change; a
     deleted and an edited instance; a series that starts mid-week; `planSeriesWrite` leaves a seeded
     holiday Slot and a Slot in another series alone and skips dates with no Slot; same inputs give the
     same output.
4. **Seed** (`domain/seed/cast.ts`, `domain/seed/index.ts`; US-01.2.2, US-01.2.1):
   - `LIST_STATUSES` becomes `SEED_SLOT_STATUSES`, three records, keyed by the values 28 stores on Slots, with
     today's labels and colours, so every seeded Slot and test keeps working with no data rewrite:

     | key | label | longLabel | colour | treatment | bookable | anaesthetist sets |
     |---|---|---|---|---|---|---|
     | `free` (default) | Free | Free | free | dashed | yes | yes |
     | `holiday` | Holiday | On holiday | holiday | solid | no | yes |
     | `unavailable` | Unavailable | Unavailable | unavailable | hatched | no | yes |

     Descriptions come from the Design Language §02 captions and the catalogue wording ("free by
     default", "on holiday", "unavailable for an undefined reason").
   - The List types (private, public, pre-op) are no longer master rows; their labels move to
     `LIST_KIND_LABELS` (work item 1).
   - `masters.listStatuses` becomes `masters.slotStatuses`, keyed by `key`; `schedule.availabilitySeries`
     starts empty and the series counter at zero. No series is seeded.
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
     neutral chip with the key as text (never a crash); a retired status still renders on the Slots that
     carry it.
   - `StatusLegend` lists the three List types, then the active Slot statuses in `order`, with an
     optional `only: 'list' | 'slot'` filter. Its `SAMPLE` text stays for the six seeded keys (the Design
     Language samples, same keys); any other status uses its longLabel and
     description.
   - Migrate every call site in the reference list. Replace literal availability-key comparisons with
     the `slotStatus.ts` helpers, so no app file compares a Slot status to a literal string.
   - RTL test `StatusChip.test.tsx`: renders a renamed label, a recoloured token, a List kind, and the
     unknown-key fallback.
7. **Store: days off ahead and single-instance edits** (28's `src/store/slotActions.ts`, beside
   `setAvailability`; `store/lifecycle.ts` at the snapshot; US-01.2.1, US-01.5.3):
   - New `setAvailabilityRange(api, actor, { anaesthetistId, fromISO, toISO, sessions: 'AM' | 'PM' |
     'both', statusKey, note? })`. 28's `setAvailability` keeps its signature, outcome and `slot.status`
     audit, so existing callers, tests and Phase 30's "Simulate sickness" keep working; it shares the
     per-Slot write helper below, so it validates against the records and runs the same clash rule.
   - Refusals, before any write (all or nothing): `notFound`, `integrationForbidden`,
     `notOwnAvailability` (an anaesthetist sets only their own; the office may set anyone's, as
     today), `statusNotFound`, `statusRetired`, `statusNotSettable` (`anaesthetistCanSet: false` when
     the actor is an anaesthetist), `noSlot` (any date in the range before the anaesthetist's start
     date, as 28's `setAvailability` refuses), and the range issues from `validateAvailabilityRange`.
   - One `mutate()` for the whole range. For each Slot, write the status and note directly on the Slot,
     then apply `availabilityClash` to any List in it:
     - `'flag'`: an `availability` conflict on the List ("Dr Souter set Holiday for this session; the
       List still stands. Review and reassign or clear."), replacing any earlier one, never stacking;
     - `'clear'`: remove that List's `availability` conflict, because its cause is gone (28 stopped
       raising the false conflict but left an earlier one in place; Phase 30 generalises clearing to
       every path);
     - in every case the List's surgeon, hospital, Bookings, times and List type are untouched, and the
       List still shows in place of the status (US-01.2.3, US-01.5.3 "for the anaesthetist this is a
       status, not a List").
   - **Editing one instance:** a Slot with a `seriesId` that the range covers is an edit of that
     instance: the store also writes an `edited` exception on the series (status and note), so a later
     series write or roll forward never overwrites it. The Slot keeps its `seriesId`.
   - **`clearAvailability(api, actor, slotId)`**, the "Remove" and "Delete this one" action: the Slot
     returns to the default status (Free) with no note, and `availabilityClash` runs. If the Slot is a
     series instance, the store writes a `deleted` exception on the series and clears the Slot's
     `seriesId`. Same refusals, same audit pattern.
   - Audit: one `availability.setRange` entry on the anaesthetist (from, to, sessions, before and after
     status counts, note, series instances edited), one `availability.cleared` entry for a removal, plus
     one `list.conflict` or `list.conflictCleared` entry per List affected. Add the labels to
     `actionLabels.ts` and `fieldLabels.ts`.
   - Returns `{ set, unchanged, flagged: ListId[], cleared: ListId[], seriesEdited }` for the UI's result
     line.
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
   - **Roll forward:** 28's `rollCanvasForward` (`store/clockActions.ts`) applies every active series to
     the new far-edge Slots after `generateCanvasForDates`, through `planSeriesWrite` and the clash rule,
     inside the same `mutate()`. The generator and its RNG draws are untouched, so the golden fixture
     holds. An open-ended series therefore keeps filling as the horizon moves.
   - Audit: `availability.seriesCreated` and `availability.seriesDeleted` on the anaesthetist (the rule
     in words via `describeSeries`, counts), the roll forward's existing `canvas.rollForward` entry
     gains the series count, plus one conflict entry per List affected. Labels added.
   - Tests: a fortnightly Friday PM series to the horizon sets the right Slots and leaves a seeded
     holiday alone; a series over a booked Free Slot flags that List once; delete one instance, then roll
     the clock forward a week: the deleted instance stays Free and the new far-edge Fridays fill;
     deleting the series returns its future instances to Free, keeps an edited instance, and leaves past
     ones; an anaesthetist cannot create a series for a colleague; determinism.
9. **Store: status master actions** (`src/store/mastersActions.ts`; US-01.2.2):
   - `addSlotStatus`, `editSlotStatus`, `retireSlotStatus` and `restoreSlotStatus`: office only, each
     through `mutate()` with before and after metas and a clock timestamp, validated by
     `validateSlotStatusDraft` (the store computes the active-series usage counts for `ctx`).
   - No delete: retiring keeps history, and existing Slots keep the key.
   - Audit labels ("Slot status added", "Slot status updated", "Slot status retired", "Slot status
     restored").
   - Tests: office-only refusal, each validator refusal surfaces its message (including a reserved List
     kind key), the edit round-trips every field, and retire then restore.
10. **Admin: Slot statuses editor** (17's `apps/admin/screens/masters/` split, `MasterData.tsx` at the
    snapshot; US-01.2.2). It replaces 28's view-only "List statuses" view and its provisional line:
    - The nav entry becomes "Slot statuses" (view param `slot-statuses`, via 17's `?view=`).
    - Header copy: "The availability anaesthetists set on their Slots. A Slot is Free until changed, and a
      List placed in it shows instead. This is availability, not the Draft, Submitted and Authorised
      approval state." Then the one provisional line: "Status values, names and colours are provisional
      until AA names them (OQ-64)."
    - Table: preview chip (live `StatusChip`) · Key (mono) · Long label · Open for bookings ·
      Anaesthetists can set · Default · Description · state (Active, or Retired with date). Retired rows
      sit below the active ones, in mist. A short footnote names the three List types as fixed List
      attributes with their chips, so the office sees the whole legend.
    - "Add status" and a row "Edit" open `SlotStatusSheet` through `useSurface().Overlay`:
      - fields for key (create only), label, long label and description;
      - "Open for bookings", "Anaesthetists can set this" and "Default for new Slots" toggles;
      - colour as six swatches, one per design token, each carrying its token name;
      - treatment as a segmented control;
      - a live preview of the chip and a sample block;
      - validator messages inline.
    - "Retire" and "Restore" row actions. Retiring asks for confirmation and says how many future Slots
      carry the status ("They keep it until changed").
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
      for example "10 sessions set to Holiday. 1 List flagged for the office." or "Series saved:
      Unavailable, Friday PM, every 2 weeks. 9 sessions set, 1 already set left as it is." Refusals show
      the store's message.
    - `AvailabilitySlotPanel`: what a tapped Slot shows before the form. A one-off day off offers
      "Change" and "Remove". A series instance shows the series line and offers "Change this one",
      "Delete this one" and "Delete the series" (with a confirm that says future sessions return to
      Free). A Slot holding a List shows the List (it is in place of the status) and still lets the
      anaesthetist change the status, with the line "The office is told if you mark this session
      unavailable." A past Slot is read only.
    - `describeAvailabilityOutcome(outcome, statusLabel)`, a pure helper that writes the result line
      (tested). No en or em dashes; ranges read "24 Jul to 7 Aug".
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
      - remove the Free and Block buttons and the `setMine` branch that produced the false-conflict
        message;
      - colleague cells and the date-strip dot read records through the helpers. Only `isOpenSlot`
        Slots (no List and `isOpenForBooking`) are tappable for cover and counted as free. Cover is
        reworked in Phase 32.
    - **My calendar screen** (`screens/MyAvailabilityCalendarScreen.tsx`, new):
      - a back row "Availability", then a month title with previous and next controls, bounded by the
        current month and the horizon's last month;
      - a Monday-first seven-column grid. Each day is a cell with its date numeral (mono) and two
        stacked half-blocks, AM over PM, in the status visual (or the List's, where one sits). A series
        instance carries a small repeat glyph with an accessible label. Today is marked the way the web
        week strip marks it. Past days are dimmed and inert, and a Slot with an availability conflict
        carries the amber "!" used on the Admin grid;
      - under the grid, a legend of the anaesthetist-settable statuses, then "Your series" listing each
        active series by its `describeSeries` line with a "Delete" action;
      - tapping a day opens the bottom sheet for that day (`AvailabilitySlotPanel`, then the form);
      - a sticky, thumb-reachable teal "Add days off" action opens the form preset to Holiday, both
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
    - Phase 28's reassign default for a vacated Slot (`vacatedStatus`, `'free'` in 28) uses `defaultSlotStatus`,
      and its "mark the vacated session" picker lists the active closed statuses.
    - Permanent List templates (`PermanentListSheet.tsx`) keep picking their `kind` from `LIST_KINDS`.
    - Check `grep -rnE "'(free|available|holiday|unavailable)'" src` outside `domain/slotStatus.ts`,
      `domain/seed/` and tests: the only matches left should be unrelated strings (for example cover or
      audit copy, or the Slot status value passed to the seed).
15. **Remove the superseded behaviour**:
    - the false conflict on a bookable status (item 7);
    - the view-only "A fixed enumerated set" master (item 10);
    - the availability values in the closed status union (28's `SlotStatus` union and
      `SLOT_STATUSES`, and the `DisplayStatusKey` union; the theme's `StatusKey`), and
      `statusKeyParity.test.ts` (items 1 and 5);
    - the fixed six-day limit on setting one's own availability (the Find cover date strip may stay six
      days, because it is the corridor finder; setting availability now happens in the calendar).
16. **Playwright** (`npm run shots`):
    - Update `m-05-availability`, `w-06-availability` and the Admin master-data shot.
    - Add `visual/availability-phase29.spec.ts` with `data-shot` hooks for:
      - the mobile calendar (July, showing Souter's seeded leave 24 to 26 Jul);
      - the mobile sheet with Holiday and "1 week" selected, and the same sheet with "Every 2 weeks",
        Friday and PM selected;
      - a series instance's panel ("Change this one", "Delete this one", "Delete the series"), after the
        spec creates a series through the store action;
      - the web My availability page with a range selected and the rail showing;
      - the Admin Slot statuses table and `SlotStatusSheet` with the live preview.
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
far-edge Slots happens on the existing clock advance (the harness bar clock menu, also on the Control Panel index),
not on a new trigger. Register nothing in Phase 14's registry and add nothing to the Control Panel.

**PWA:** nothing on the handset waits on the office or on a backend event. The office sees the change
on its Day grid, and in a framed demo the presenter switches to Admin to show it. The new mobile route
(`/mobile/availability/calendar`) is URL-addressable, so a later phase can scope a PWA entry to it if it
needs one.

## Out of scope

- **Conflicts beyond this phase's clash rule:** the List colour change, clearing on every path,
  hospital-holiday edits and the cross-date conflict dashboard are Phase 30's (US-01.5.4). This phase
  only raises a conflict when a closed status lands on a List, and clears it when a bookable status
  replaces it, through `availabilityClash`.
- **Draft Lists**, including an unavailable anaesthetist's Lists becoming Draft Lists (the OQ-64
  recommendation): Phase 31 replaces the clash rule's `'flag'`. Assigning a Draft List to a free Slot is
  31's too (it uses `isOpenSlot`).
- **The anaesthetist moving their own List** and any rework of cover offers and requests: Phase 32. The
  existing cover flow keeps working on `isOpenSlot` Slots.
- **Editing a whole series' rule** (change the weekdays or the interval of every instance): the
  catalogue asks for create, and edit or delete one instance. Delete the series and create a new one.
- **Leave approval or a leave balance.** The catalogue asks for neither. Recurring bookings
  (Permanent Lists until Phase 30's rename) remain the office's weekly List pattern; a series is the
  anaesthetist's own days off and never makes a List.
- **The List types as master data** (private, public, pre-op). They are a List attribute, not a Slot
  status, and nothing asks for them to be edited.
- **The web Dashboard's seeded Leave and Productivity panels:** Phase 38 removes them (RV-18). Do not
  link them to the calendar.
- **Office-side bulk availability** (an admin setting a colleague's days off from the Day grid). The
  store actions allow the office, but no Admin UI is added.
- **Hospitals, insurers and public holidays as editable masters, and spreadsheet loads:** Phase 42.
  The Slot statuses editor built here is its pattern.
- **A config page for warnings and thresholds** (US-13.7.4, Future).
- **A responsive or tablet web layout** (noted in US-15.0.2's gap; not required).

## Manual test checklist

- [ ] Mobile, Availability: the "My availability" card shows today's AM and PM as chips (or the List
  where one sits). "Change" opens a bottom sheet whose status choices are exactly the active,
  anaesthetist-settable statuses (Free, Holiday, Unavailable).
- [ ] From the card, "My calendar" slides in the calendar with no tab bar. July shows Souter's seeded
  leave on Fri 24 to Sun 26 as Holiday half-blocks, and booked sessions show their List. Paging forward
  stops at the horizon month, and back stops at the current month.
- [ ] Days off ahead: "Add days off", then 1 week from Mon 10 Aug: the result line counts the sessions
  set and names any flagged List. The Admin Day grid for those days shows Holiday at once, and any
  booked List there carries the amber conflict with its surgeon, hospital and Bookings unchanged.
- [ ] Series: set Unavailable, PM, every 2 weeks on Friday, no end date. The result line counts the
  sessions set and those left as they are; Souter's seeded Fri 24 Jul holiday is untouched. Each
  instance shows the repeat glyph, and "Your series" lists the rule in words.
- [ ] One instance: tap a series Friday and "Change this one" to Holiday: only that Friday changes. Tap
  another and "Delete this one": it returns to Free. Advance the demo clock a week (the harness bar clock menu):
  the edited and deleted instances stay as set, and the new far-edge Fridays fill.
- [ ] "Delete the series": future instances return to Free, the edited one keeps Holiday, past ones are
  unchanged. Audit shows the create, the two instance edits and the delete, each once.
- [ ] Set a booked session of Souter's (for example Tue 21 AM) to Free: no conflict is raised and the
  result line says so. Set it to Unavailable: one conflict. Set it back to Free: the conflict is gone.
  Reset before the S2 checks below.
- [ ] A range ending before it starts, a past date, or a series with no weekday is refused with a plain
  message and nothing changes.
- [ ] Web, Availability: the "Find cover" and "My availability" switch works. On My availability,
  click then shift-click selects a range, the rail's form sets it, a series can be created and an
  instance changed or deleted, and the mobile calendar shows the same result (same store). The "(you)"
  row's "Change" link on Find cover opens that date.
- [ ] Admin, Master data, Slot statuses: three rows, each with a live chip, the List-type footnote, and
  the OQ-64 provisional line.
  - Rename Unavailable to "Blocked": the chip, the legends, the Day grid, the mobile colleague cells and
    calendar, and the web grid all read "Blocked" without a reload.
  - Change its colour to another token and back: every surface follows.
- [ ] Add a status "Sick leave" (not open for bookings, holiday token, solid, anaesthetists can set): it
  appears in the mobile and web choices and in the legends. Use it in a series, and retiring it is
  refused with the count. Delete the series, retire it: it leaves the choices and the legends, a Slot
  already carrying it still renders it, and restoring it brings it back.
- [ ] Trying to retire Free (the default), a key of `private`, or a label with an em dash is refused
  with the reason.
- [ ] S2 runs unchanged: Beat 1's Tue 21 grid is identical; Beat 2's phone-advice booking on Sharma Tue
  21 PM; Beat 3's reassignment of Rutherford Wed 22 AM to Sharma.
- [ ] PWA build (`npm run build:pwa`, then preview on a phone-sized viewport): the calendar route, the
  sheet, "Add days off" and the series controls work and clear the insets and tab bar.
- [ ] No en or em dash in any new copy, no crimson on any new control, and teal is the only action
  colour.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots` are all green.

## Demo guide updates

In the same session (the ROADMAP rule: each phase patches the beats it touches). S2 is re-scripted
after Phase 32, so keep these edits small:
- `docs/demo-guide/03-demo-script.md`:
  - **S2 Beat 1:** the legend now reads the three List types, then the Slot statuses from master data
    (same six labels as before). Update the Expected line only if its wording names the legend order.
  - **S2, an optional opening moment** before Beat 1: on mobile, My calendar, "Add days off" for a week
    in August; then a series (Unavailable, Friday PM, every 2 weeks) and "Delete this one" on one
    Friday; then switch to Admin and show both on the Day grid. Add Click, Say ("Availability is the
    Slot's own status. Anaesthetists mark days off weeks ahead from the phone or the web, set repeating
    days off, and change or delete one occurrence. The office sees it straight away, and a booked List
    is flagged, never silently changed.") and Expected lines, and a reset note before Beat 1.
  - **S2 Discovery points:** the run sheet has no OQ-17 or OQ-27 point to replace; it opens with
    "whether availability/holiday conflicts are hard constraints or warnings". Leave that point to
    Phase 30 (the settled soft-warning reading) and add, as settled context rather than a question,
    that availability is a status on the Slot kept from the anaesthetist's calendar (one mechanism,
    OQ-17 and OQ-27 answered), plus one open point, OQ-64 (the final status values, names and colours,
    now editable master data; and whether a newly unavailable anaesthetist's Lists become Draft
    Lists, the recommendation built in Phase 31). If Phase 28 already added an OQ-64 line, extend it
    rather than adding a second.
  - **Direct URLs:** add `/mobile/availability/calendar`, `/web/availability/mine` and
    `/admin/masters?view=slot-statuses`.
- `docs/demo-guide/04-presenter-cheat-sheet.md`:
  - section 6 (availability and holiday conflicts): a bookable status never conflicts, and a closed one
    flags the List, which stays unchanged;
  - one line on the editable status master ("rename or add a status and every app follows");
  - add "mark days off ahead, repeating days off, change or delete one occurrence" to the mobile and web
    feature lists.
- `docs/demo-guide/02-workflows-and-handoffs.md`:
  - the cover workflow's steps 1 and 2 (keep availability in the calendar, which sets the Slot status;
    a clash with a List is a conflict flag for the office);
  - line 78's status list (List types plus Slot statuses from master data).
- `docs/demo-guide/01-personas-and-responsibilities.md`:
  - Dr Souter's mobile duty ("use Availability to mark days off weeks ahead, including repeating days
    off, or to request cover");
  - replace "submitting leave requests is outside this prototype" with the calendar, noting the seeded
    Leave panel stays until Phase 38.
- `docs/demo-guide/master-demo-guide.html`: mirror the same S2 edits, discovery points, Direct URLs
  table and cheat-sheet lines, word for word.
- **Control Panel scenario text** (`apps/demo/DemoControlPanel.tsx`, the S2 blurb): mention the
  optional days-off moment only if the blurb lists beat content. No trigger is added.
- This is not a milestone phase, so no full consistency read. Check the patched sections match the run
  sheet.

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
- **No closed availability vocabulary left.** No app, shared or store file compares a Slot status to a
  literal key. Every finder, filter, count and clash rule goes through `domain/slotStatus.ts`. Adding a
  status in Admin, with no code change, makes it selectable, rendered and correctly bookable or closed
  everywhere. The List types stay a separate fixed set and cannot collide with a status key.
- **Series integrity.** Occurrences are pure and deterministic on the demo clock; a single-instance
  edit or delete is recorded as an exception and survives a later series write and a clock roll
  forward; a series never overwrites a Slot the anaesthetist already set; deleting a series reverts only
  its own untouched future instances.
- **The design language holds.** The palette is exactly the six Design Language tokens, and no new hex
  appears. The seeded statuses and every List render exactly as before (hatch and dashed strings
  identical). Every chip and block carries its label. Crimson and teal are never a status colour.
- **Availability never merges into the List.** No action edits a List's surgeon, hospital, Bookings,
  times or List type. A bookable status on a List raises nothing and clears its availability conflict.
  A closed status flags once and replaces rather than stacks. The clash outcome comes from the one
  `availabilityClash` function.
- **Range integrity.** Each action is all or nothing on refusal, with one `mutate()` and one audit entry
  plus one entry per List affected. Past and beyond-horizon dates are refused. Timestamps come from the
  clock. Determinism holds, and the golden canvas fixture is unchanged.
- **Master-data safety.** Keys are immutable and never a List kind; there is exactly one default and it
  is bookable; the default and statuses used by an active series cannot be retired; retire keeps
  history and existing Slots still render; the validator rejects en and em dashes in admin-entered
  labels.
- **Parity.** The web app can do everything the mobile availability screen can (single Slot, both
  sessions, range, series, edit or delete one instance, note) through the same `AvailabilityForm`,
  `AvailabilitySlotPanel` and store actions, in a real desktop layout. The mobile calendar is
  mobile-first (slide-in layer, bottom sheet, chips), and the PWA route, insets and import closure are
  intact.
- **Honest labelling.** The OQ-64 line sits only in the Admin Slot statuses header; no OQ-17 or OQ-27
  caption remains anywhere. S2 is unchanged.

## PROGRESS.md updates

- **Status row** for catch-up Phase 29, and a phase entry with:
  - the drift-check result (items changed or not; OQ-64 status and which branch was built);
  - what was built, per work item;
  - the `PERSIST_VERSION` bump (from and to);
  - tests added;
  - the review pass.
- **Decisions log:**
  1. **The Slot status set is master data** (`masters.slotStatuses`, `SlotStatus`), availability values
     only. This amends convention 10 and supersedes the 2026-07-21 "Status colour mapping" as a closed
     six-key set: the palette stays in `src/theme/statusColours.ts` as the six Design Language tokens,
     statuses reference a token, and the List types (private, public, pre-op) are a fixed List
     attribute mapped to their own tokens (the OQ-17 answer).
  2. **One mechanism** (the OQ-27 answer): the calendar writes the Slot status directly, and a series is
     a rule that writes Slots, with instance edits and deletes kept as exceptions. This supersedes item
     (2) of the 2026-07-22 external plan review (availability writes a master).
  3. **A series fills only Free Slots in no other series**, and an open-ended series keeps filling on
     the clock's roll forward. Deleting a series ends it and returns its untouched future instances to
     Free.
  4. **A bookable status over a List raises no conflict and clears the availability conflict.** This
     supersedes the 2026-07-23 "Availability reconciliation, both directions" ruling for the un-block
     direction. The restatus half was already superseded by Phase 28.
  5. **The clash with a List is a conflict flag, in one function (`availabilityClash`)**, the interim
     for OQ-64; Phase 31 builds the recommendation (the List becomes a Draft List).
  6. **Statuses are retired, never deleted.** Keys are immutable and never a List kind, and one bookable
     default (Free) is required.
  7. **One display key space:** the display key is the List's kind when a List is in the Slot, otherwise
     the Slot's status key unchanged (the Free record's key is 28's `free`).
  8. **"Available for emergency" is not seeded.** The 2026-10-01 rewrite of US-01.2.1 dropped the fixed
     four-value list; an admin can add it as a status if AA names it (OQ-64).
  9. **One availability store:** record what happened to `masters.availability` (folded into Slots).
- **Handoff notes:**
  - For **30**: use `isClosed`, `isOpenForBooking` and `availabilityClash` for conflict raising, the
    List colour change and clearing. This phase clears only on a bookable status replacing a closed one.
    There is no emergency status, so no `isEmergencyOnly`.
  - For **31**: replace `availabilityClash`'s `'flag'` with turning the List into a Draft List (the
    OQ-64 recommendation); every status path (one-off, series, instance edit, roll forward) already goes
    through it. Draft List assignment targets `isOpenSlot` Slots.
  - For **32**: the anaesthetist's own List move can be reached from the calendar's Slot panel (it shows
    the List); the mobile calendar route and the web `/web/availability/mine` exist. Cover still runs on
    `isOpenSlot` Slots until 32 removes it.
  - For **38**: the calendar holds real days off, so the seeded Leave panel can go without loss; 38a's
    find-past-work calendar is a different calendar (List, Booking, Procedure) and can reuse the month
    grid.
  - For **42**: the Slot statuses editor and `validateSlotStatusDraft` are the pattern for the other
    masters, and a loader target.
  - For **44**: S2's optional days-off and series moment, and the legend's List types then Slot
    statuses.
