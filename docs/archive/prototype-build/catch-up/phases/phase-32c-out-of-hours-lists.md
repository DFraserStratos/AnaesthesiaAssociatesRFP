# Phase 32c · Out-of-hours Lists

> **Superseded in part on 2026-11-10.** The owner answered D84 after this plan was written: an
> out-of-hours List sits in a third kind of Slot, an out-of-hours session the office opens for an
> anaesthetist on a day (one a day, 18:00 to 21:00 by default); any List goes in it, a new one or a Draft
> List for the evening; once open it is a full session for availability and the finders. The phase was
> rebuilt that way (see PROGRESS.md, catch-up Phase 32c). Where this plan says "a List held outside the
> Slots", an `outOfHours` marker, no own moves or the finders ignoring it, the decision replaces it.

**Requirements covered:**
[US-01.1.6](../../../../requirements-board/requirements/stories/US-01.1.6.md) Out-of-hours Lists (new at `efe123c`, status 5 Confirmed, design still to do; Vanessa and Ben, 5 November) ·
[DM-66](../analysis/domain-model-delta.md#dm-66) an out-of-hours List after the PM session with its own start time, a List that does not fit the AM and PM Slots.
Read alongside, not closed here: [US-01.1.1](../../../../requirements-board/requirements/stories/US-01.1.1.md) (two Slots a day, AM and PM only; reworded at `efe123c`, Phase 28 owns it), [US-01.1.4](../../../../requirements-board/requirements/stories/US-01.1.4.md) (default times), [US-01.4.2](../../../../requirements-board/requirements/stories/US-01.4.2.md) (the availability finder), [FT-01.3](../../../../requirements-board/requirements/stories/FT-01.3.md) (one surgeon, one hospital), and [US-01.1.5](../../../../requirements-board/requirements/stories/US-01.1.5.md) (the A and B split of a session, Proposed: parked, build nothing for it).
**Working design, built as set (D84, 5 November):** the catalogue says "accepted, not yet designed", so this is our reading, labelled provisional once in code and once in the app, kept in one module, and listed for the owner. No question of its own exists.

**Depends on:** 32b (conflicts are hospital closures only; the office's move and notice paths; `markUnavailableAndMoveList`), 38a (the anaesthetist's main view and its leave-at-AUTHORISED rule; use the names it shipped). Built: 28 (Slots, `listIndexBySlot`, `placeListOnSlot`, `timesForList`), 31 (the no-Slot Draft List path), 14 (the registry, PWA sheet, `OFFICE_SIMULATION_ACTOR`). Runs straight after 32b.
**Estimated:** 2 sessions. Session 1: items 1 to 5 (model, the one module and helper, store, reader sweep, persistence), green checkpoint. Session 2: items 6 to 9 (anaesthetist apps, Admin Day, triggers, guide, shots).

## Goal

The office can add an **out-of-hours List** for an anaesthetist on any day from today on, after the PM session, with a surgeon, a hospital and its own start time (6:00pm by default, editable), for emergency or late cases in any specialty. It is a List held **outside the AM and PM Slots** (no third kind of Slot; DM-66's second option), at most one an evening. It shows after the AM and PM Lists on the anaesthetist's day on mobile, web and the PWA (and in 38a's main view), and as an evening block after PM on the Admin Day grid. Its Bookings are captured, completed, submitted, authorised and billed as on any List (our reading). The availability finders and the conflict rules ignore it; the anaesthetist never creates one; the office may reassign or remove it.

"Which Lists are on this anaesthetist's day, in order" lives in **one helper with tests**, because `Session` is read in about 36 files and an assigned List has always named its Slot. Nothing is built for the A and B split.

## Before you start

1. **Drift check** against the plan baseline `fbdd555`:

   ```
   node requirements-board/agent/skills/update-build-plan/tools/plan-state.mjs --diff US-01.1.6,US-01.1.1,US-01.1.4,US-01.4.2,US-01.1.5,FT-01.3
   ```

   Re-read anything changed after `efe123c`. If US-01.1.6 is Retired or Future, stop and tell the owner. If it now says a third kind of Slot, or more than one an evening, build that instead (the module is the contained change); if US-01.1.5 is confirmed, log it and still build nothing for it.
2. **Confirm 32b and 38a are DONE**; read their PROGRESS entries for the names used below (`markUnavailableAndMoveList`, `MoveListSheet`, the notification pool, 38a's main-view selector and search). Run `grep -rn "slotId\|state !== 'DRAFT'\|\.session" aa-prototype/src --include='*.ts' --include='*.tsx'` for every reader to check (about 36 files read `Session`, 123 lines test `slotId` or Draft state). Note `PERSIST_VERSION` (26 at `efe123c`; bump by one from whatever it is).
3. **Open points and the defaults built** (one `OUT_OF_HOURS_DESIGN` block in `domain/outOfHours.ts`, one mist caption in the sheet "How an out-of-hours List works is a working design, to confirm with AA", the PROGRESS owner list):
   - **Start time:** 18:00 by default, editable, 17:00 to 23:30 (`OUT_OF_HOURS_EARLIEST`, `_LATEST`). The grid block's length is start plus three hours; no end time is stored or shown.
   - **Session recorded:** `session: 'PM'` (it follows PM; `Session` stays `'AM' | 'PM'`) and an `outOfHours` marker with its own start time; every reader that groups by Slot or session selects on the marker.
   - **How many an evening:** one per anaesthetist per day (`OUT_OF_HOURS_MAX_PER_EVENING = 1`), refused with a plain reason.
   - **Who creates:** the office only, on any day from today, with no horizon limit (it needs no Slot) but the anaesthetist must have a row that day (`rosterForDate`). When the office is closed, nobody: the anaesthetist rings the office. The PWA stand-in is the office.
   - **The finders and conflicts:** both ignore it. It never makes a PM session non-free and the PM session's status never blocks or warns on it; a hospital closure does not flag it; no pairing-preference warning, though the office path still records `list.pairingAcknowledged` as for any assign.
   - **Moves:** the anaesthetist's own List and Booking moves (32, 32a) are not offered on it; the office reassigns it to another anaesthetist with a row that day and no evening List, or removes it when it holds no active Bookings. No notice is posted.
   - **Not a landing List:** hospital rows (33, 34), recurring bookings and the canvas never land on or remove it; a Draft List stays AM or PM.
   - **Billing as on any List** is our reading: no after-hours pricing.

## Reference

- **Catalogue:** US-01.1.6 (its Technical discussion lists the open points), US-01.1.1, US-01.1.4, US-01.4.2; the 5 November meeting note (`npm --prefix requirements-board run source -- --item US-01.1.6 --text`); [domain-model.md](../../../../requirements-board/requirements/domain-model.md) (Slot, List).
- **Plan:** `gaps.json` entries for DM-66 and US-01.1.6; ROADMAP D14 and D84; [domain-model-delta.md](../analysis/domain-model-delta.md#dm-66).
- **Design** (convention 17): [Admin Day](../../../design/Admin%20Day.dc.html) (the grid, blocks, drawer, the sheet anatomy), [Mobile App](../../../design/Mobile%20App.dc.html) (List rows and the day group), [Web Dashboard](../../../design/Web%20Dashboard.dc.html), [Design Language](../../../design/Design%20Language.dc.html) (a List's kind colours, pills, mono time). No mockup has an evening block: extend the PM block's pattern.
- **Code** (grep first): `src/domain/types.ts` (`Session`, `ListBase`, `AssignedList`, `DraftList`, `List`, `Slot`), `src/domain/listPairing.ts` (`isActivePairing`, `pairingIssues`), `conflicts.ts`, `listMoves.ts`, `recurringBookingProjection.ts`, `draftLists.ts`; `src/store/selectors.ts` (`listIndexBySlot`, `timesForList`, `slotViewsForAnaesthetist`, `rosterForDate`, the calendar rows near `:1602`), `slotActions.ts` (`placeListOnSlot`, `assignListToSlot`, the horizon change), `conflictReconcile.ts`, `lifecycle.ts`, `billingRun.ts`, `mastersActions.ts` (the List edit action), `appStore.ts`; `src/apps/admin/AdminApp.tsx`, `components/DayGrid.tsx` (`RULER_LABELS`, `slotSpan`, `segmentsFor`), `SlotDrawer.tsx`, `flows/EditListSheet.tsx`, `AssignListFields.tsx`; `src/apps/mobile/screens/ForwardListsScreen.tsx`, `ListDetailScreen.tsx`; `src/apps/web/screens/ListsScreen.tsx`, `ListDetailView.tsx`, `DashboardScreen.tsx`, `components/WeekStrip.tsx`; `src/shared/flows/MoveListSheet.tsx`, `useListMoves.ts`, `src/shared/scheduleTerms.ts`, `src/shared/demoTriggers/registry.ts`, `src/shared/audit/actionLabels.ts`, `fieldLabels.ts`; `src/apps/demo/DemoData.tsx` (its "every List placed" check).

## Work items

1. **Model** (`src/domain/types.ts`). A third member of the List union beside `AssignedList` and `DraftList`: `OutOfHoursList extends ListBase { state: AssignedListState; anaesthetistId; slotId?: undefined; session: 'PM'; outOfHours: { startTime: WallTime; createdAtISO; createdBy } }`, with `outOfHours?: undefined` added to `AssignedList` so the union narrows. `List = AssignedList | DraftList | OutOfHoursList`. Let `tsc` list every reader that narrowed on `state !== 'DRAFT'` and read `slotId` (the first is `listIndexBySlot`, which must skip it); fix each deliberately. Ids come from the existing `LG####` counter.
2. **The one module and helper** (new `src/domain/outOfHours.ts`, PWA-safe, with `outOfHours.test.ts`): `OUT_OF_HOURS_DESIGN` (item 3 of Before you start, the one provisional marker), `isOutOfHours(list)`, `outOfHoursTimes(list)` (own start, end = start plus three hours, so `timesForList` keeps its shape), `outOfHoursRefusal(input, facts)` (pure: office only, not before today, a row that day, none already that evening, start in range, `pairingIssues` for hospital and surgeon), `eveningListFor(lists, anaesthetistId, dateISO)`, and **`listsOnDay(lists, slots, anaesthetistId, dateISO)`**: the AM List, the PM List, then the evening List, each by its own rule, as the single answer every day view uses; `dayOrderKey(list)` for rows that mix Lists. No React, store, `Date.now()` or `new Date()`.
3. **Store** (new `src/store/outOfHoursActions.ts`, PWA-safe, with tests): `addOutOfHoursList(api, actor, fields)` (builds the List with a pure `placeOutOfHoursList` beside `placeListOnSlot`, records `list.pairingAcknowledged` on the office path, meta `list.outOfHoursAdd`), `reassignOutOfHoursList(api, actor, listId, anaesthetistId)`, `removeOutOfHoursList(api, actor, listId, reason)` (refused while it holds an active Booking). Office actors only. The existing List edit action gains `startTime` for an out-of-hours List (hospital and surgeon edit as today). Selectors: `outOfHoursListsFor(state, anaesthetistId, dateISO)`. Labels in `actionLabels.ts` and `fieldLabels.ts`.
4. **Reader sweep** (tests, one file `outOfHoursReaders.test.ts`; fix what fails). With an out-of-hours List standing, prove: `listIndexBySlot`, `slotViewsFor*`, `openSlotViews` and every finder never see it; the PM session is still free and still offered; `timesForList` returns its own start; `isActivePairing` and the store-wide List invariant accept it (a branch, not a loosened rule); `deriveConflicts`, `conflictReconcile` and the Conflicts screen ignore it, also on a hospital closure that day; marking the PM session unavailable (`markUnavailableAndMoveList`) leaves it in place; recurring-booking projection and a horizon shrink neither remove nor duplicate it; the 33 and 34 matcher never lands a row on it; the single-Booking move and the own-List move refuse it; `DemoData`'s placed-List check passes. Then prove the Bookings path: capture, complete, `submitList`, `authoriseList`, the billing run, BCTI records, completion blockers, warnings and the to-do list, 38a's search and the audit viewer behave as on a PM List.
5. **Persistence.** No seeded out-of-hours List: the demo creates it live, so S1 to S5 and every canvas golden are untouched (assert it). Bump `PERSIST_VERSION` by one with a `persistMigrate` test (old state loads, no out-of-hours List). **Green checkpoint:** build, build:pwa, vitest.
6. **Anaesthetist apps** (mobile, web, PWA by shared `src/apps/mobile`). Every day view reads `listsOnDay`: `ForwardListsScreen` (Week and Month rows after PM; To-Do and Done already list by List), web `ListsScreen`, `WeekStrip` and the `DashboardScreen` summary, and 38a's main view (it leaves at AUTHORISED like any List). The row reads "Out-of-hours" with its start time in place of an AM or PM badge; List detail on both apps shows the same label and no session control, and offers no move or return. Copy through `scheduleTerms.ts` (`OUT_OF_HOURS_LIST = 'Out-of-hours List'`); never "slot".
7. **Admin Day.** `AdminApp` passes each row's evening List to `DayGrid`: an evening block after PM on the same row, the ruler extending past 18:00 only on a day that holds one (every existing day and shot is unchanged), kind colour and Booking count as any block, a small "Out-of-hours" marker. The block opens the List drawer (follow the List by id as `SlotDrawer` already can; if that does not fit, a small drawer composing the shared List sections) with Edit (start time, hospital, surgeon, `EditListSheet`'s no-Slot branch), Reassign and Remove. **"Add out-of-hours List"** on each anaesthetist's row label (shown on row hover and keyboard focus, always in the DOM) opens `OutOfHoursSheet` (new, `src/apps/admin/flows/`): `AssignListFields` (hospital, surgeon, kind, note) plus a start time defaulting to 18:00, the mist caption, plain refusals; it works for today. Hooks: `out-of-hours-add`, `out-of-hours-sheet`, `daygrid-evening-block`, `out-of-hours-row`, `out-of-hours-start`.
8. **Triggers** (below), PWA sheet entry, Reset and reload.
9. **Guide, shots, review pass, PROGRESS.**

## Demo triggers

| id | Label | Screen | Surfaces | Effect | Disabled when |
|---|---|---|---|---|---|
| (product) | Add out-of-hours List | Admin Day, an anaesthetist's row | none | `addOutOfHoursList`, any day, today included | as `outOfHoursRefusal` |
| `office-adds-out-of-hours-list` | The office adds an out-of-hours List for me tonight | Mobile · Lists (the day) | pwa | `addOutOfHoursList` as `OFFICE_SIMULATION_ACTOR` for the viewing anaesthetist, today at 18:00, at the hospital and with the surgeon of their latest List; message "The office added an out-of-hours List for tonight at 6:00pm." `badge: 'office-stand-in'` | one already stands that evening |

## Out of scope

- The A and B split of a session (US-01.1.5); a third kind of Slot; more than one an evening; a recurring out-of-hours List; a Draft out-of-hours List.
- Evening availability for the anaesthetist or the finders; an anaesthetist creating, moving or returning one; a notice on creation.
- After-hours pricing or fee rules; hospital rows (33, 34) or recurring bookings landing on one.
- The Future Work lane.

## Manual test checklist

Run these yourself in the running app and report pass or fail with evidence.

- [ ] Reset: Admin Day, Tue 21 Jul looks as before (ruler to 18:00, no evening block); the S1 to S5 data is untouched.
- [ ] Admin Day, Dr Souter's row, Add out-of-hours List for today: surgeon, hospital, start 18:00; refused with a plain reason for a start of 16:00 and for a second one that evening; saved, the evening block shows after PM on a ruler extended past 18:00, and the PM block is unchanged.
- [ ] The block's drawer: change the start time, hospital and surgeon; Reassign to another anaesthetist (one with an evening List is refused); Remove with no Bookings; Remove with a Booking is refused.
- [ ] Mobile as Dr Souter: the Lists screen shows the Out-of-hours row after PM with its start time; open it, add a Booking, capture and complete it, submit; no move or return control.
- [ ] Web as Dr Souter: Lists, WeekStrip, Dashboard and the main view show it after PM; it leaves the main view at AUTHORISED.
- [ ] Admin Review authorises it and the billing run bills it as any List; the audit shows `list.outOfHoursAdd`.
- [ ] Availability: Admin and anaesthetist finders still offer Dr Souter's PM session as free; marking PM unavailable leaves the evening List where it is; no conflict appears.
- [ ] PWA: "The office adds an out-of-hours List for me tonight" on the Lists screen; reload keeps it; Reset removes it.
- [ ] No "slot", no en or em dashes, no crimson on controls; mobile at 390px; keyboard reaches the row control and the sheet; build, build:pwa and vitest green.
- [ ] Catalogue screenshots: the recipe below created, a full `npm run capture` with no failed recipe, shots checked by eye, `npm run verify:board` green.

## Demo guide updates

Locate by text in `docs/demo-guide/`. `03-demo-script.md`, S2: a new optional **Beat 3d, an emergency case after hours** after Beat 3c (Admin Day, Add out-of-hours List on Dr Souter's row for today at 6:00pm; then her phone shows it after PM; Say: "Late and emergency cases go through a List like everything else; this is a working design we will confirm with you"); a discovery point for the open points (start time, who creates when the office is closed, more than one an evening, the finders). `04-presenter-cheat-sheet.md`: "What about cases after six?" and the new trigger. `02-workflows-and-handoffs.md` Workflow 3: the office's evening List. `01-personas-and-responsibilities.md`: the office adds one; the anaesthetist sees it. `master-demo-guide.html`: the same passages. The Control Panel S2 text only if it lists the optional beats.

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19), after the review pass. Run `node requirements-board/agent/skills/update-build-plan/tools/recipe-status.mjs 32c` first. The plan update never touches recipes or images.

| Item | Recipe now | When this phase is done |
|---|---|---|
| [US-01.1.6](../../../../requirements-board/requirements/stories/US-01.1.6.md) | none (create it) | `captured`. Admin `out-of-hours` on Tue 21 Jul: states `sheet` (`out-of-hours-sheet`, start 18:00) and `block` (the evening block after PM, highlight `[data-shot=daygrid-evening-block]`), staged with the product control; Mobile, Dr Souter, Lists, staged with `office-adds-out-of-hours-list`, state `day` (the row after PM, highlight `[data-shot=out-of-hours-row]`); web Lists the same. Caption "The office adds an out-of-hours List after the PM session with its own start time; it shows after PM on the anaesthetist's day and as an evening block on Admin Day (a working design)". |
| [US-01.1.1](../../../../requirements-board/requirements/stories/US-01.1.1.md), [US-01.1.4](../../../../requirements-board/requirements/stories/US-01.1.4.md), [US-01.4.2](../../../../requirements-board/requirements/stories/US-01.4.2.md) | | No change here (Phase 28 owns them; the evening is outside the Slots and the finders). |

**Recipes this phase breaks.** None expected: nothing is seeded and the evening block and row control appear only on use. Confirm with `node scripts/capture.ts --dry`, and re-check any recipe whose Admin Day row region now contains the add control. Keep shot `name`s.

**ATLAS.md.** Seed data (no seeded out-of-hours List; how to stage one), Overlays (`OutOfHoursSheet`), Demo actions (`office-adds-out-of-hours-list`), Existing hooks (item 7's).

## Adversarial review (after build)

Standard pass (convention 18); do not re-raise the Decisions log.

- **Every reader.** No reader assumes an assigned List has a Slot: the grid, generation, recurring painting, availability, moves, conflicts, finders, submit, matching and the horizon change; the sweep covers each, and `tsc` has no unchecked `state !== 'DRAFT'` narrowing left.
- **One helper, one module.** Day views all read `listsOnDay`; the design lives only in `outOfHours.ts` and `OUT_OF_HOURS_DESIGN`; the provisional wording appears once in code and once in the sheet.
- **Finders and conflicts ignore it,** and the PM session is unaffected both ways; no third Slot kind and no `Session` widening.
- **Office only, one an evening,** validated in the store, never only in the sheet; refusals are plain.
- **Billing as any List,** no after-hours special case; the A and B split is absent.
- **Display and seed.** Teal the only action colour, no crimson; no "slot", no en or em dashes; Admin Day unchanged on a day without one; no seed change, `PERSIST_VERSION` bumped once with a migrate test.

## PROGRESS.md updates

- **For the owner's review** (route and persona each): the working design in Before you start item 3 (start 18:00 and its range, one an evening, office only, the finders and conflicts ignoring it, no moves, no notice, billed as usual), the provisional caption, and that nothing is seeded.
- Status row and phase entry: drift check against `fbdd555`, names 32b and 38a shipped, tests added, `PERSIST_VERSION` old to new, the checklist with evidence, review pass, catalogue screenshot result (REPORT.md counts before and after). Handoffs: 33 and 34 (rows never land on it), 38b and 39b (events on a Procedure of an evening List), 44 (Beat 3d, the cheat-sheet line, the PWA parity audit).
- Decisions log: D84 built as a working design, provisional; the session recorded as `'PM'` with an `outOfHours` marker (`Session` unchanged).
