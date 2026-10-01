# Phase 31 · Draft Lists and the day dashboard

**Requirements covered:**
[FT-01.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-01.6.md) Draft Lists (Verify) ·
[US-01.6.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.6.1.md) Create a Draft List (Verify) ·
[US-01.6.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.6.2.md) See Draft Lists flagged in the Admin App ·
[US-01.6.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.6.3.md) Assign a Draft List to an anaesthetist (Verify) ·
[US-01.6.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.6.4.md) Remove or re-date an unfilled Draft List (Verify, new at `501b0b8`) ·
[US-13.1.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.1.1.md) One-day dashboard ·
[US-01.3.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.3.1.md) Assigned List pairing rule ·
[FT-01.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-01.3.md) List assignment (Verify) ·
[EP-01](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/EP-01.md) Schedule canvas, Slots and Lists (its last open strands here: the Draft List, the pairing rule, the "Surgeon TBC" state and the unavailable-anaesthetist route) ·
[DM-03](../analysis/domain-model-delta.md#dm-03) Draft List: a List created with no anaesthetist, which can hold Bookings.
No RV items.
Read alongside (not closed here):
[DM-02](../analysis/domain-model-delta.md#dm-02) (Phase 28; this phase builds its Draft List third),
[DM-04](../analysis/domain-model-delta.md#dm-04) (Phase 29; its "add the Draft List route behind DM-03" is built here),
[US-01.5.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.5.2.md) and
[US-01.5.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.5.3.md) (both Verify: the conflict flag versus Draft List alternative for an unavailable anaesthetist, OQ-64),
[US-01.5.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.5.4.md) (Phase 30's conflict dashboard; its AC1, "the List appears as a conflict and its Bookings are still in place", must keep holding for a List that unavailability returns to the office),
[US-01.3.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.3.5.md) (blacklist warning; its "Both paths" criterion is checked here, on the Draft List path Phase 17 left for this phase),
[US-01.3.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.3.3.md) (manual List assignment, Phase 28),
[US-01.4.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.4.2.md) (availability finder: the assign picker is its Draft List view),
[US-01.4.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.4.3.md) (an anaesthetist moves a List to the office, Phase 32, which reuses this phase's detach helper),
[US-02.1.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.1.2.md) (the matching screen, Phase 33; whether a row may create a Draft List is not settled),
[US-13.5.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.5.2.md) (audit),
[OQ-44](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-44.md) (Draft List contents and lifecycle, **Answered** at `501b0b8`),
[OQ-27](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-27.md) and
[OQ-17](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-17.md) (Answered: a Slot holds a status or a List; an unavailable anaesthetist's Lists become Draft Lists),
[OQ-64](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-64.md) (Open: the logical model, Draft List versus conflict flag for unavailability, the user-facing names),
[OQ-43](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-43.md) (Open, deferred to Ben: blacklist wording, one list or two), and the "Slot, List and Draft List" section of
[domain-model.md](../../../discovery-reference/Updated%20Requirements/domain-model.md).
**Depends on:** 17 (the blacklist helper `src/domain/blacklist.ts`: `partitionAnaesthetistsForSurgeon`, `blacklistWarning`; `SurgeonSelect`, `BlacklistWarning` and `useBlacklistWarning` in `src/shared/schedule/`; the `*.blacklistAcknowledged` audit rule) and 30 (and through it 28 and 29: Slot records and Slot views, the internal `placeListOnSlot`, `moveListToSlot`, `assignListToSlot`, `setAvailability` writing the Slot, the Slot status master in `domain/slotStatus.ts` with `isOpenForBooking`, `isClosed`, `isOpenSlot` and the one clash rule `availabilityClash` (whose `'flag'` branch 29 left for this phase to replace), 29's `setAvailabilityRange` and `createAvailabilitySeries`, and Phase 30's conflict reconcile inside `mutate()` with its `holiday` conflict for a List with no Slot, its Conflicts screen and `conflictRows`, its seeded Rutherford Wed 22 AM sickness, and its rename of Permanent Lists to recurring bookings: `RecurringBooking`, `seed/recurringBookings.ts`, `addRecurringBooking` / `editRecurringBooking`, `RecurringBookingSheet.tsx`). Phase 29 seeds **no emergency-only status and has no `isEmergencyOnly`** (its Decisions log 8). Also uses 14 (the registry, `useDemoTriggerContext`, `OFFICE_SIMULATION_ACTOR` and `OFFICE_ACTOR` in `store/demoActors.ts`, the PWA sheet `src/pwa/PwaDemoActions.tsx`), 15 (Booking names), 15a (the warning routine `evaluateWarnings` and the To-do rail card the Draft Lists rail card sits beside), 20 (the default Contract for an AA-rooms List, which this phase re-points to the AA rooms location) and 27 (its prepayment sync `syncPrepayment(api, bookingId, cause)`, run after commit on a change of date or anaesthetist, when DONE). Phase 32 follows and reuses `detachListToDraft`; 33 may call `createDraftList`.
**Estimated:** 2 sessions. Session 1 is the model, the pairing rule, the seed, the store and the unavailability route (work items 1 to 13), ending green and demoable with the seed changes visible (the Fitzgerald block gone, AA rooms as a location, Draft Lists in the store). Session 2 is the Admin screens, the Day dashboard, the demo triggers, the PWA stand-in and the demo guide (work items 14 to 25). Both are full. Session 1's risk is the compiler fallout from making the anaesthetist optional and the hospital and surgeon required on `List`; if it runs long, keep the seed proof, the store tests and the green gate, and move work item 19 (Assign List and phone advice kinds) and the non-Admin reader tidy-ups beyond the compile-forced minimum to the start of session 2 rather than cutting tests. Session 2's slack is work item 24 (capture recipes).

## Goal

The catalogue has three schedule things, and after Phases 28 to 30 the prototype has two of them.
This phase adds the third, the **Draft List**. OQ-44 is answered: a Draft List is **a List created
with no anaesthetist**. Its **hospital, surgeon, day and session are always known and all four are
required** (the hospital booking always comes first). It takes **no Slot**, so creating one changes
nobody's schedule, and it **may hold Bookings** before an anaesthetist is assigned. It is **never
offered to anaesthetists; only the office assigns it**. A request the surgeon's office cancels, or
that is never filled, is **removed, or its date is changed** (US-01.6.4).

Because a Draft List is a List, the prototype models it as one: a `List` record with no anaesthetist
and no Slot, carrying a small "draft trail" (where it came from, since when, by whom). Its Bookings
hang off its List id exactly as on any List, and assigning it keeps the same id, so "keeping anything
already recorded" is true by construction.

The office sees every Draft List **flagged "Unassigned", with how long it has been waiting**, and
prominently in the core planning view (US-01.6.2, "quite a big flaw" today):

- a **Draft Lists rail card** in the Day view's right rail, beside the day, designed together with
  Phase 15a's To-do card;
- a **Draft Lists band** at the top of the Day grid for the day it falls on (US-13.1.1);
- its own **Draft Lists page** in the Admin side nav, with an amber count badge;
- the Day header's summary line.

The office **assigns** one by choosing an anaesthetist. The Slot is fixed by the Draft List's day and
session (to use another day, change its date first). The picker is the availability finder for that
half-day: free, not available (unavailable or holiday), blacklisted with the surgeon (a labelled
group), and Slots that already hold a List (not selectable). An unavailable Slot or a blacklisted
pairing shows a **soft warning** and can still go ahead. The assignment is audited, and the List,
with its Bookings, now sits in that Slot.

Draft Lists have three origins in the catalogue. This phase builds two and leaves the seam for the
third:

1. **A request from a surgeon's room** (phone, email, PDF): the office creates it.
2. **An anaesthetist marking themselves unavailable while they hold Lists** (the OQ-27 answer, and
   OQ-64's recommendation, which is still open): their open Lists leave their Slots and become Draft
   Lists for the office to resolve, Bookings intact. This is built **provisional**, as one store
   helper behind one rule constant, so Phase 30's conflict flag comes back if OQ-64 flips. Because
   US-01.5.4 still expects the office to see such a List "as a conflict, Bookings in place", Phase
   30's Conflicts screen keeps a row for it (Phase 30's handoff asked this phase to decide where it
   shows).
3. **An anaesthetist moving a List to the office** (US-01.4.3): Phase 32, through this phase's
   `detachListToDraft`.

The phase also **enforces the pairing rule everywhere** (US-01.3.1, Confirmed): every List, Draft
Lists included, has exactly one surgeon and one hospital.

- The seeded Fitzgerald Tue 21 PM "Surgeon TBC" List goes; St George's request becomes a seeded
  Draft List with its surgeon named.
- The pre-op clinic Lists at AA's rooms get a real **location record** (AA rooms).
- Every public List (acute theatre and the public "Elective ortho" templates) and every pre-op List
  names a surgeon.
- `List.hospitalId` and `List.surgeonId` become required and `List.anaesthetistId` and
  `List.slotId` become optional, so the compiler finds every path that could break the rule or
  assume an anaesthetist.

Last, the Day dashboard shows each List block's **booking count** (US-13.1.1).

## Before you start: drift check

1. Diff the covered and read-alongside items against the plan's snapshot:

   ```
   git diff 501b0b8 -- "docs/discovery-reference/Updated Requirements/catalogue/requirements/FT-01.6.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-01.6.1.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-01.6.2.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-01.6.3.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-01.6.4.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-13.1.1.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-01.3.1.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/FT-01.3.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/EP-01.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-01.5.2.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-01.5.3.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-01.5.4.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-01.3.5.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-01.3.3.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-01.4.2.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-01.4.3.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-02.1.2.md" "docs/discovery-reference/Updated Requirements/catalogue/questions/OQ-44.md" "docs/discovery-reference/Updated Requirements/catalogue/questions/OQ-64.md" "docs/discovery-reference/Updated Requirements/catalogue/questions/OQ-27.md" "docs/discovery-reference/Updated Requirements/catalogue/questions/OQ-17.md" "docs/discovery-reference/Updated Requirements/catalogue/questions/OQ-43.md" "docs/discovery-reference/Updated Requirements/domain-model.md"
   ```

   Also run the whole-catalogue diff from ROADMAP.md "When the catalogue changes" and scan it for new
   items that name Draft List, unassigned, pairing, day dashboard, booking count, AA rooms, pre-op or
   acute Lists. (At plan time, 2026-10-01, the catalogue had no diff against `501b0b8`.)
2. If an item changed, re-read it and adjust the work items. Things to look for:
   - **FT-01.6 and US-01.6.1 to 01.6.4** (Verify): if any is now Retired or Future, drop the matching
     work (the Draft List model in items 2, 3 and 8, the views in 15 to 18, the triggers in 22), keep
     the pairing rule and the booking count, and decide with the owner what the St George's request
     becomes instead. Record it in PROGRESS.md.
   - **US-01.6.1**: if creation from a hospital row on the matching screen is now settled either way,
     update the handoff to Phase 33 (the `origin: 'hospitalRow'` seam stays either way).
   - **US-01.6.3**: if assigning may now pick any Slot (not the one its day and session fix), or an
     occupied Slot may be taken over, change `assignDraftList` and the picker to match.
   - **US-01.6.4**: if removal now needs a recorded reason, make the reason required in
     `removeDraftList` and the Remove sheet.
   - **US-01.3.1 / FT-01.3**: if the pairing rule gains exceptions (for example "a pre-op clinic has
     no surgeon" or "acute theatre names the service, not a surgeon"), implement the exception in the
     one pure `pairingIssues` helper (work item 3) and drop the matching seed change in work item 4.
     FT-01.3 is **Verify**: if its text now differs from US-01.3.1, follow the Confirmed story.
   - **US-13.1.1**: if the dashboard gains other per-block figures, add them in work item 20.
   - **domain-model.md** "Slot, List and Draft List": if a Draft List now sits in a Slot, or the day
     becomes the parent with Slots only a view, stop and re-plan work items 2 and 8 with the owner.
   - Any covered item now Retired or Future leaves the covers; record that in the PROGRESS entry.
3. **Open questions** (the ROADMAP "Confirm before building" row for 28 to 31: FT-01.6, US-01.6.1,
   US-01.6.3, US-01.6.4 and FT-01.3 Verify; OQ-64):
   - **OQ-44 is Answered** at `501b0b8`; build the answer, not an interim: four required fields,
     Bookings allowed before assignment, office only, removed or re-dated. Nothing about it is
     labelled provisional.
   - **OQ-64** (Open, with a recommendation) touches this phase twice:
     - **Unavailability.** The recommendation (and the OQ-27 answer) is that an anaesthetist who marks
       themselves unavailable while holding Lists loses those Lists to Draft Lists; US-01.5.2 and
       US-01.5.3 still hold the conflict flag open. Build the recommendation, **labelled provisional
       in one place** (work item 9): one rule constant, one pure decision helper (the replacement for
       29's `availabilityClash` `'flag'` branch, not a second clash rule), one store helper. If OQ-64
       is answered "conflict flag", set the constant off; Phase 30's flag path runs unchanged and the
       seed follows the constant. Either way US-01.5.4 AC1 holds: the Conflicts screen lists the
       returned List (work item 13).
     - **Names.** "Slot" and "Draft List" (or "unassigned list") are not settled. Put every
       user-facing Draft List term in **one module** (work item 3, `shared/scheduleTerms.ts`) so a
       rename is one edit. Use "Draft List" for the thing and "Unassigned" for its flag, the words the
       catalogue uses now (the catalogue dropped "a List being prepared"; never use it for a Draft
       List. The demo guide's "work is still being prepared" describes the approval state DRAFT and
       stays).
   - **OQ-43** (what an anaesthetist sees of the blacklist; deferred to Ben, one list or two) stays as
     Phase 17 left it: Admin only. The PWA stand-in in work item 22 skips blacklisted pairings
     silently and never names the blacklist.
   - **Pre-op and acute pairings (no OQ exists).** The catalogue has no exception for the pre-op
     clinic at AA's rooms (no hospital, no surgeon) or for public acute theatre (no named surgeon).
     The reading, recorded in the Decisions log, has two parts:
     - AA rooms is a location record in the hospitals master;
     - a pre-op clinic names the surgeon whose patients it assesses, and an acute List names the
       on-call surgeon.
     Tell the owner at the start of the session and suggest they raise it with AA. Do not edit the
     catalogue.
   - **Emergency-only Slots** (OQ-17 and OQ-64 leave the final status values unnamed). Phase 29
     seeds no "Available for emergency" status and built no `isEmergencyOnly` (its Decisions log 8),
     so the picker has no emergency group: an admin-added status lands in Free or Not available by
     its bookable flag, and the row shows its own label. If a later phase or the owner has added an
     emergency-only behaviour by now, ask the owner whether it gets its own labelled group with a
     soft warning and no conflict, and record the answer.
4. **Check the neighbours:**
   - Phases 17, 28, 29 and 30 are DONE. Confirm the names in their PROGRESS entries, because this doc
     uses the planned names and the build may have renamed them:
     - 17: `blacklistWarning`, `partitionAnaesthetistsForSurgeon`, `SurgeonSelect`,
       `BlacklistWarning`;
     - 28: `placeListOnSlot`, `moveListToSlot`, `assignListToSlot`, `slotFor`, `listInSlot`,
       `slotViewsForDate`, `effectiveSlotTimes`, `approvalStateLabel`, the List drawer and the Assign
       List sheet, `setAvailability` and its outcome values;
     - 29: `SlotStatus`, `statusFor`, `isOpenForBooking`, `isClosed`, `isOpenSlot`,
       `availabilityClash` (and whether 30 kept it after moving the conflict writes into the
       reconcile), and the calendar's single and series actions (`setAvailabilityRange`,
       `createAvailabilitySeries`, the series roll forward: every path that can close a Slot);
     - 30: the conflict reconcile (`store/conflictReconcile.ts`, run inside `mutate()`), the engine
       in `domain/conflicts.ts` (`expectedConflicts`, which allows a `holiday` conflict for a List
       with no Slot), the Conflicts screen route, columns and `conflictRows`, `simulateSickness` and
       its `choices`, the PWA stand-in `office-reassigns-list`, how the List colour change is drawn,
       the seeded Rutherford Wed 22 AM sickness (which replaced `applyPhase06Conflicts`),
       `List.recurringBookingId` and the recurring-booking projection, and the rename's final names.
       Read 30's handoff note for 31.
   - Phase 15a's To-do card in `RightRail.tsx` and its warning routine: which rules read the List's
     anaesthetist (they must tolerate a Draft List, work item 13).
   - Phase 20's default-Contract resolver: `defaultContractForBooking(contracts, ctx)` in
     `domain/billing/contractSelection.ts` (planned name), whose "no hospital (an AA-rooms List)"
     branch returns `CT-RVG-POSTPAID`, and the Contract picker's "Default for AA rooms" heading.
     Work item 10 re-points both to the AA rooms location.
   - Phase 27 (normally DONE first, since phases run upward): its prepayment sync on a changed Booking
     (US-06.3.5), planned as `syncPrepayment(api, bookingId, cause)` with causes such as `listMoved`.
     Assigning, re-dating and the unavailability return call it. Check how it behaves for a Booking
     whose List has no anaesthetist (work item 8). If 27 is not DONE, leave a marked seam and a
     handoff for 27.
   - Phase 28's PWA stand-in `assignNextFreeSlotAsSimulatedOffice` ("Office assigns a List to my next
     free Slot", Mobile · Lists). It stays; work item 22's entry sits beside it and reuses its Slot
     scan.
   - Note the current `PERSIST_VERSION` (13 at the snapshot; phases 15 to 30 raise it).
5. Record the drift-check result in the PROGRESS entry.

## Reference

**Design files (convention 17).** No mockup shows a Draft List, so extend the existing patterns
rather than invent a look:

- `docs/design/Design Language.dc.html`:
  - the six status colours are **not** used for a Draft List, because it has no Slot status of its
    own;
  - use the **warning tint and on-tint** for the "Unassigned" flag and the long-wait emphasis;
  - use the status-as-pill pattern, the micro caps label style, and Spline Sans Mono with
    tabular-nums for the waiting time and the booking count;
  - radii `ctl 10` and `card 14`, the sheet motion, and the scrim;
  - teal `#0D6E63` for New Draft List, Assign, Add Booking, Save, Change date and Remove; crimson
    never;
  - the amber nav badge tone the Billing monitor already uses (not the crimson Review badge).
- `docs/design/Admin Day.dc.html`:
  - the grid block anatomy (left status bar, two text lines, corner flags);
  - the right rail's card anatomy (the Draft Lists card is one more rail card, like 15a's To-do);
  - the right-hand drawer (header, sections, action row), the header summary line and the dark side
    nav with its badges.
  The Draft Lists band is a row above the anaesthetist rows that uses the same ruler. Its blocks are
  white with a lineStrong border, a warning-solid left bar and a micro caps "UNASSIGNED" line, so they
  look different from every status tint and never from colour alone. Note the design shows
  Fitzgerald PM as "St George's, surgeon TBC" with an amber flag. The catalogue rule wins
  (US-01.3.1, OQ-44): that request now draws in the band, with its surgeon, not on her row.
- `docs/design/Admin Review.dc.html`: the table and row rhythm the Draft Lists page follows (with
  `apps/admin/tableChrome.ts`).
- `docs/design/Mobile App.dc.html`: the PWA stand-in's message, the new booked row, and the
  availability confirm copy (Phase 14, 28 and 29 patterns).

**Catalogue items:** the covered files above. The rules this phase must not break: US-01.3.5 (the
blacklist warns and never blocks; separated, labelled groups), US-01.5.2 (conflicts warn, never
block), US-13.5.2 (every change audited), FT-01.6 (never offered to anaesthetists), and the approval
state DRAFT, which "belongs to assigned Lists and is unrelated to a Draft List" (domain-model.md).

**Analysis files:**

- `docs/prototype-build/catch-up/gaps.json`: items `FT-01.6`, `US-01.6.1`, `US-01.6.2`, `US-01.6.3`,
  `US-01.6.4`, `US-13.1.1`, `US-01.3.1`, `FT-01.3`, `EP-01`, and `dataModelDeltas` DM-02, DM-03 and
  DM-04.
- `docs/prototype-build/catch-up/epics/EP-01.md`: the header note (the DRAFT collision, the S2 impact
  list) and the sections for the items above plus US-01.5.2 and US-01.2.3 (the unavailable-with-Lists
  strand); `epics/EP-13.md` for US-13.1.1.
- `docs/prototype-build/catch-up/GAP-ANALYSIS.md`: theme 1 (Schedule rebuilt on Slot, List and Draft
  List), the DM-03 row and its "Structural changes" note, "Demo impact" S2, "Demo-trigger buttons"
  (Intake and drafts) and "Uncertainty" (OQ-64).
- `docs/prototype-build/catch-up/analysis/domain-model-delta.md` (DM-02, DM-03, DM-04, DM-26).
- `docs/prototype-build/catch-up/analysis/prototype-map-admin.md` (sections 1 to 4: routes and nav,
  shell derivations, Day view, the List flows), `prototype-map-store-seed.md` (sections 2, 3, 6, 7,
  8), `prototype-map-apps-mobile-web.md` (the "AA rooms" fallbacks in Forward Lists, List detail,
  week strip and availability grid; the availability confirm copy) and
  `prototype-map-shell-demo-pwa.md` (section 7, the PWA, and section 9, extension points).
- The phase docs for 15a (the To-do rail card), 17, 28, 29 and 30 (their handoff notes for 31), and 32
  (it moves a List to the office through this phase's helper).
- `requirements-board/capture/ATLAS.md` (line ~304 describes "Fitzgerald PM is at St George's with
  the surgeon TBC") and the US-01.3.1 and US-13.1.1 recipes.

**Code entry points** (paths under `aa-prototype/src/`; names are as planned by 14, 15, 15a, 17 and
28 to 30, so check the PROGRESS name maps first):

- **Model:** `domain/types.ts`: `List` (`anaesthetistId`, `slotId`, `hospitalId?`, `surgeonId?`,
  `notes?`, `kind`, `state`, `conflicts`, 30's `recurringBookingId?` and `conflictClears?`), `Hospital`
  (L~155), `Surgeon`, `RecurringBooking` (`PermanentList` at the snapshot; `hospitalId: HospitalId |
  null`, `surgeonId`), the Slot types from 28, `SlotStatus` from 29;
  `domain/index.ts` exports.
- **Seed:** `domain/seed/cast.ts` (`HOSP`, `HOSPITALS`, `SURG`, the status description "Pre-op
  assessment clinic at AA rooms." L~145), `domain/seed/recurringBookings.ts` (Phase 30's rename of
  `permanentLists.ts`: `PREOP_NOTE`, `ACUTE_NOTE`, the template rows with `null` hospital or surgeon), `domain/seed/canvas.ts` (the RNG
  `public` branch that sets `HOSP.cph` and no surgeon; `GENERAL_SURGEONS`, `CES_SURGEONS`; `slotRng`
  from `slotHash.ts`), `domain/seed/index.ts` (the Fitzgerald Tue 21 PM fixup L~214; Phase 30's
  seeded sickness, Dr Rutherford's Wed 22 AM Slot set Unavailable with his Christchurch Eye Surgery
  List flagged, which replaced Phase 06's `applyPhase06Conflicts` L~253; `SEED_MARKERS`; the masters
  and schedule assembly), Phase 30's `domain/seed/availabilityAndHolidays.ts`, `domain/seed/dayNotes.ts` (L~34,
  "Fitzgerald PM surgeon unconfirmed ..."), `domain/seed/history.ts` (the `L-HIST-*` backdrop Lists,
  some with no `hospitalId`), `domain/seed/contracts.ts` (Doyle holds a surgeon Contract), Phase 17's
  surgeon, room and blacklist seed, the seeded Bookings file (Phase 15's successor to `cards.ts`),
  `domain/seed/seed.test.ts`, Phase 28's `domain/seed/__fixtures__/canvas-golden.json`.
- **Store:** `store/appStore.ts` (`PERSIST_VERSION`, `AppState.schedule`), `store/mutate.ts`
  (`ID_FORMATS`, `resetDomainState`, multi-meta `mutate`), `store/slotActions.ts` (28:
  `placeListOnSlot`, `moveListToSlot`, `assignListToSlot`, `setAvailability`), Phase 29's calendar
  actions, `store/lifecycle.ts` (`editList` and `ListPatch`, `editRefusal`, `submitList`,
  `authoriseList`), the Booking actions after Phase 15 (`createBooking`, `reassignBooking`,
  `cancelBooking`; `createCard`, `reassignCard`, `cancelCard` today), `store/mastersActions.ts`
  (30's `addRecurringBooking`, `editRecurringBooking`, `applyRecurringBookingsToCanvas`; hospital
  actions), `store/integrationActions.ts` (S12 and
  S13 targets, `ingestPdfRow`), `addPostOpAddendum`, `store/billingRun.ts` (skips Lists with no
  anaesthetist), `store/selectors.ts` (`entityCounts`, `slotViewsForDate`, `bookingsForList`),
  `store/officeStandIn.ts` (14 and 28: `authoriseAsSimulatedOffice`,
  `assignNextFreeSlotAsSimulatedOffice`), `store/demoActors.ts` (14: `OFFICE_ACTOR`,
  `OFFICE_SIMULATION_ACTOR`), Phase 30's `store/conflictReconcile.ts`, `domain/conflicts.ts`, the recurring-booking
  projection and `simulateSickness`, Phase 29's `domain/slotStatus.ts` (`availabilityClash`),
  Phase 15a's warning routine, Phase 27's `syncPrepayment`, Phase 20's
  `domain/billing/contractSelection.ts` (`defaultContractForBooking`, with its test),
  `store/index.ts`.
- **Admin:** `router.tsx` (admin routes L~89), `apps/admin/routes.tsx`, `apps/admin/AdminApp.tsx`
  (section derivation L~28, `dayLists`, `activeCardCounts`, the header `summary` L~148, the review
  rows' "Unassigned" hospital fallback L~174), `apps/admin/outlet.ts`, `components/SideNav.tsx`
  (`NavSection`, the badge props and `badgeTone`), `components/DayGrid.tsx` (`GridBlock` L~250: the
  "Surgeon TBC" subtitle L~300, the flags, the footer counts), `components/DayGrid.test.tsx` (five
  "Surgeon TBC" assertions), `components/DayNav.tsx`, `components/RightRail.tsx` (`MiniCalendar`,
  15a's To-do card, `InternalNotes`, `AwaitingReview`), `components/ListDrawer.tsx` (its "Unassigned"
  hospital fallback L~37) or Phase 28's successor drawer, `util.ts` (`attentionReasons` "Surgeon not
  yet assigned" L~114, the "Unassigned" labels L~66 and L~81), `flows/AssignListSheet.tsx` (28),
  `flows/EditListSheet.tsx` ("None (AA rooms / unassigned)" L~79), `flows/PhoneAdviceBooking.tsx`,
  `flows/RecurringBookingSheet.tsx` (30's rename of `PermanentListSheet.tsx`, "None (AA rooms)"
  L~113), `flows/ReassignListFlow.tsx`,
  `flows/MoveBookingFlow.tsx` (`MoveCardFlow.tsx` today, "Unassigned" L~80), Phase 15's add-Booking
  flow, `screens/ReviewQueue.tsx` (the table pattern), `screens/MasterData.tsx` or 17's
  `screens/masters/` (Hospitals, 30's `RecurringBookingsView`), Phase 30's
  `screens/ConflictsScreen.tsx`,
  `screens/IntegrationMonitorScreen.tsx` (L~291), `screens/BillingMonitorScreen.tsx` (L~161),
  `tableChrome.ts`.
- **Mobile and web readers of the "AA rooms" fallback and the availability outcome:**
  `apps/mobile/screens/ForwardListsScreen.tsx` (L~130, L~145), `ListDetailScreen.tsx` (L~91),
  `BookingDetailScreen.tsx`, `AvailabilityScreen.tsx` (L~77; the `conflictFlagged` message L~110) or
  Phase 29's calendar; `apps/web/screens/ListsScreen.tsx` (L~53), `ListDetailView.tsx` (L~94),
  `BookingDetailView.tsx`, `AvailabilityGrid.tsx` (L~82) or Phase 29's web calendar,
  `components/WeekStrip.tsx` (L~48); `apps/admin/screens/ReviewScreen.tsx` (L~104),
  `AdminBookingDetail.tsx` (L~43).
- **Shared:** `shared/format.ts` (name helpers, `slotTimeRange`, `approvalStateLabel`),
  `shared/schedule/` (17's `SurgeonSelect`, `BlacklistWarning`), `shared/audit/actionLabels.ts`,
  `shared/audit/fieldLabels.ts`, `shared/audit/auditNarrative.ts`, `shared/demoTriggers/registry.ts`
  and `context.ts` (14), `shared/DemoBadge.tsx`.
- **Demo and PWA:** `apps/demo/DemoControlPanel.tsx` (`SCENARIOS` S2 text; the trigger index is
  generated from the registry), `apps/demo/DemoData.tsx` (entity counts), `pwa/PwaDemoActions.tsx`
  (14), `pwa/pwaPurity.test.ts`; outside `src/`: `aa-prototype/visual/admin-phase06.spec.ts`,
  `aa-prototype/visual/pwa-device.spec.ts`.

## Work items

### Session 1: the model, the pairing rule, the seed, the store and the unavailability route

1. **Baseline.** Run `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots`, and
   record the counts. Keep `visual/shots/` as the before set.

2. **Types** (`domain/types.ts`). DM-03, US-01.3.1, US-01.6.1.
   - A Draft List **is a List**: no separate collection, so Bookings attach through the List id
     unchanged and assignment keeps the id. Split the List type:

     ```ts
     type DraftOrigin = 'request' | 'unavailable' | 'movedToOffice' | 'hospitalRow'
     type RequestSource = 'phone' | 'email' | 'pdf' | 'other'

     interface DraftTrail {
       origin: DraftOrigin
       source?: RequestSource            // origin 'request' only
       sinceISO: IsoDateTime             // created, or returned to the office; drives waiting time
       by: string                        // actor.who
       fromAnaesthetistId?: AnaesthetistId // origin 'unavailable' or 'movedToOffice'
       assignedAtISO?: IsoDateTime       // set on assignment; the trail is kept
       assignedBy?: string
     }

     interface ListBase {               // today's List fields, less the anaesthetist and Slot
       id: ListId
       hospitalId: HospitalId            // now required (US-01.3.1)
       surgeonId: SurgeonId              // now required (US-01.3.1)
       dateISO: IsoDate
       session: Session
       kind: ListKind
       state: ListState                  // approval state; DRAFT reads "Open"
       conflicts: ListConflict[]
       notes?: string
       draft?: DraftTrail                // present on a Draft List, kept after assignment
       removedAtISO?: IsoDateTime        // a removed Draft List (US-01.6.4); soft, audited
       removedBy?: string
       removeReason?: string
     }
     interface AssignedList extends ListBase { anaesthetistId: AnaesthetistId; slotId: SlotId }
     interface DraftList extends ListBase { anaesthetistId?: undefined; slotId?: undefined; draft: DraftTrail }
     type List = AssignedList | DraftList
     ```

     The `DraftList` doc comment states the rules: no anaesthetist, no Slot, hospital, surgeon, day
     and session required, may hold Bookings, office only (OQ-44).
   - Guards in `domain/draftLists.ts`: `isDraftList(list)` (no anaesthetist and not removed),
     `isAssignedList(list)`, `isRemoved(list)`. Phase 28's Slot views (`listInSlot`,
     `slotViewsForDate`, `slotViewsForAnaesthetist`) return `AssignedList`, so the anaesthetist apps
     never meet a Draft List.
   - **Do not use "draft" or "open" as a status value.** The approval state `DRAFT` already reads
     "Open" through Phase 28's `approvalStateLabel`, and the domain model says the two are unrelated.
     Whether a List is a Draft List is derived from the missing anaesthetist, not stored as a state.
   - `RecurringBooking.hospitalId` and `surgeonId` (Phase 30's rename of `PermanentList`) become
     non-null. A template projects Lists, so it must satisfy the rule too.
   - `Hospital` gains `locationType: 'hospital' | 'aaRooms'`. Its doc comment: a List's location is a
     hospital or AA's own rooms. The pre-op clinic is held at AA rooms, which is a location, not a
     hospital, and is never a Contract holder, a hospital feed or a sync target.
   Let the compiler list every reader that relied on the optional hospital and surgeon or on a
   present anaesthetist; work item 13 fixes them.

3. **Pure rules and terms** (`domain/pairing.ts`, `domain/draftLists.ts`, and Phase 29's
   `domain/slotStatus.ts` for the unavailability rule, no React, exported from `domain/index.ts`;
   `shared/scheduleTerms.ts`), with `domain/pairing.test.ts`, `domain/draftLists.test.ts` and
   29's `slotStatus.test.ts`:
   - `pairingIssues({ hospitalId, surgeonId }, masters)` returns plain-language issues:
     - "Choose the hospital." when the hospital is missing;
     - "Choose the surgeon." when the surgeon is missing;
     - "That hospital is not in the master data." and "That surgeon is not in the master data." for
       unknown ids.
     It returns an empty array when the pairing is complete. This is the **one** implementation of
     US-01.3.1, for Lists and Draft Lists alike. Every store path in work items 8 and 10 calls it,
     and nothing checks the pairing inline.
   - `waitingMinutes(list, nowISO)` returns whole minutes from `draft.sinceISO` to `nowISO`, or to
     `draft.assignedAtISO` or `removedAtISO` once it is no longer waiting (so a finished one shows how
     long it waited, and that figure never grows). Parse ISO strings with date-fns; never `new Date()`.
   - `draftListCandidates({ list, anaesthetists, slotViews, statuses, blacklist })` returns groups for
     the picker, each sorted in roster order:
     - `free`: the Slot for the List's day and session is empty and `isOpenForBooking` (29's
       `isOpenSlot`);
     - `notAvailable`: empty and `isClosed` (the seeded Unavailable and Holiday, or any closed status
       an admin adds); each row keeps its status label;
     - `blacklisted`: either of the two above whose pairing with the List's surgeon is actively
       blacklisted (through 17's `partitionAnaesthetistsForSurgeon`). They move to this group and keep
       their availability label;
     - `occupied`: the Slot already holds a List, with that List's id.
     There is no emergency group (Phase 29 has no emergency-only status; see the drift check).
     Only active anaesthetists are included. A List made from unavailability does not offer its
     `fromAnaesthetistId` in `free` (their Slot is now closed, so they fall in `notAvailable`).
   - `unavailabilityOutcome(list, newStatus, todayISO)` (in 29's `domain/slotStatus.ts`, beside
     `availabilityClash`) returns `'toDraftList' | 'conflictFlag' | 'none'`. It **replaces 29's
     `availabilityClash` `'flag'` branch** (29's doc comment and handoff reserve that for this
     phase): if `availabilityClash` survived Phase 30, it delegates its closed-status case to this
     function, so there is still one clash rule, not two. Its branches:
     - `'none'` when the new status is not `isClosed`;
     - `'toDraftList'` when `UNAVAILABLE_LISTS_BECOME_DRAFT_LISTS` is true, the List's approval state
       is `DRAFT` and its date is today or later;
     - `'conflictFlag'` otherwise (a SUBMITTED or AUTHORISED List, a past List, or the constant off),
       which is Phase 30's existing path.
     `UNAVAILABLE_LISTS_BECOME_DRAFT_LISTS = true` sits beside it, with the comment "Provisional:
     OQ-64's recommendation and the OQ-27 answer. Set false if OQ-64 settles on the conflict flag
     (US-01.5.2)." It is a named domain rule, not a UI toggle or a feature flag.
   - `shared/scheduleTerms.ts` holds every user-facing Draft List word, because the names are not
     settled (OQ-64): `DRAFT_LIST` ("Draft List"), `DRAFT_LISTS` ("Draft Lists"), `UNASSIGNED`
     ("Unassigned"), `ORIGIN_LABELS` ("Request", "Anaesthetist unavailable", "Moved to the office",
     "Hospital row"), `SOURCE_LABELS` (Phone, Email, PDF, Other), and the provisional line for the
     unavailability route. Every screen, pill, nav item, audit label and message reads from it. A
     test greps `src/apps` and `src/shared` for the literal strings "Draft List" and "Unassigned"
     outside this module and expects none.
   - Tests:
     - `pairingIssues` covers every case;
     - waiting minutes before and after assignment and removal;
     - the candidate groups are exhaustive with nobody lost or duplicated, in stable roster order;
     - a blacklisted anaesthetist on an unavailable Slot lands in `blacklisted` with the
       "Unavailable" label;
     - an admin-added closed status lands in `notAvailable` and a bookable one in `free`, each with
       its own label;
     - an occupied Slot is never in a selectable group;
     - `unavailabilityOutcome` for every branch, with the constant on and off;
     - no message contains an en or em dash.
   - `shared/format.ts` gains `waitingLabel(minutes)`:
     - under an hour: "45 min";
     - under a day: "16 h", whole hours;
     - otherwise: "3 d 22 h", dropping "0 h".
     Also add `locationName(hospitalId, masters)`, which returns the record's name ("AA rooms" for the
     location), and `pairingLine(list, masters)` ("Forte Health · Mr C. Okafor"). Test all three in
     `format.test.ts`.

4. **Location record and a complete pairing on every seeded List** (US-01.3.1, FT-01.3). This is a
   deliberate seed content change.
   - `cast.ts`: `HOSP.aaRooms = 'H-AAROOMS'` and a `HOSPITALS` row
     `{ id: 'H-AAROOMS', name: 'AA rooms', locationType: 'aaRooms', contactEmail: 'rooms@aa.example' }`
     (fictional `.example` address, as Phase 17 did). Every other hospital gets
     `locationType: 'hospital'`.
   - `recurringBookings.ts` (Phase 30's rename of `permanentLists.ts`):
     - each pre-op template takes `HOSP.aaRooms`;
     - every template with a `null` surgeon names one. At the snapshot that is 16 rows: 4 pre-op, 8
       public "Acute theatre" and Dr Ropata's 4 public "Elective ortho" rows (no safe surgeon is
       orthopaedic, since Mr T. Hale is excluded below; pick one and record it). Pick existing
       surgeons that sit outside every Contract's surgeon or surgeon-group scope (not Mr T. Hale, in
       the COS group; not Mr P. Doyle, a surgeon Contract holder) and outside the active blacklist
       (not Mr C. Okafor with Dr Sharma): Ms K. Patel, Mr S. Tan, Mr V. Nand or Ms H. Cameron.
     `PREOP_NOTE` and `ACUTE_NOTE` stay as the Lists' notes.
   - `canvas.ts`: the RNG `public` (acute) branch picks its on-call surgeon from a new
     `ACUTE_SURGEONS` constant through a **separate** stream, `slotRng(seed, 'acute', ...)`, so the
     `'fill'` stream's draws, and so every other placement and every Booking, are unchanged. Do not
     touch `GENERAL_SURGEONS` or `CES_SURGEONS`.
   - `history.ts`: every `L-HIST-*` backdrop List gets a hospital. Use the account's `hospitalId`
     where it has one. For the patient-, billable-party- and COS-counterparty rows that have none, use
     the hospital the procedure plausibly ran at (the implementer picks and lists them), or AA rooms.
     Backdrop invoices must not change amounts.
   - **Proof:**
     - regenerate Phase 28's golden fixture, and diff old against new with a small script. The only
       differences are: pre-op Lists gain the AA rooms hospital and a surgeon; public (acute and
       elective) Lists gain a surgeon; Fitzgerald Tue 21 PM becomes an empty Slot (work item 5); the
       one unavailability List leaves its Slot (work item 5);
     - every Booking id, List id and every other placement is unchanged;
     - the existing fee and billing tests (`seedBilling.test.ts`, the Phase 18 to 25 fee parity and
       lock tests, `demoScenarios.test.ts`) pass with **no amount moving**. If a Contract resolution
       changes, the surgeon pick was wrong: choose another.

5. **The seed's Draft Lists** (US-01.6.1, US-01.6.2, OQ-27).
   - `seed/index.ts`: delete the Fitzgerald Tue 21 PM fixup (Phase 28's successor to `patchSlot`), so
     that Slot is empty and available (no note).
   - A new `domain/seed/draftLists.ts` exports `SEED_DRAFT_LIST_IDS` and `SEED_DRAFT_LISTS`: Lists with
     no anaesthetist and no Slot, `state: 'DRAFT'`, `kind: 'private'`, `draft.origin: 'request'`,
     `draft.by: 'Kirsty W.'`, fixed ISO timestamps (never the clock):

     | id | Hospital | Surgeon | Day, session | Source | Since | Waiting at 08:00 | Bookings | Note |
     |---|---|---|---|---|---|---|---|---|
     | `LD-001` | St George's | Mr S. Tan | Tue 21 Jul PM | phone | 2026-07-20 15:40 | 16 h | 0 | "St George's booking office needs an anaesthetist" |
     | `LD-002` | Southern Cross | Ms K. Patel | Wed 22 Jul PM | email | 2026-07-21 07:20 | 40 min | 2 | "Emailed by Ms Patel's secretary" |
     | `LD-003` | Christchurch Eye Surgery | Ms A. Reid | Mon 27 Jul AM | pdf | 2026-07-17 09:50 | 3 d 22 h | 0 | "PDF from the rooms, cataract list" |

     `LD-002` holds **two seeded Bookings** (US-01.6.1 "Bookings allowed"), appended after every
     existing seeded Booking with pinned ids, on the hospital's default Contract, with procedures that
     are on no anaesthetist's prepaid set, so no prepayment, warning or fee figure elsewhere moves.
     `LD-002` must fit Dr Souter's pinned free Wed 22 PM Slot (the PWA stand-in's first pick);
     `LD-003` is the long-wait example. If Phase 28's or 30's seed changed which Slots are free, pick
     days and sessions that keep these properties and record them.
   - **The unavailability origin in the seed.** Phase 30 replaced Phase 06's `applyPhase06Conflicts`
     with a real fact: Dr Rutherford's Wed 22 AM Slot is Unavailable ("Unwell, short notice") and his
     Christchurch Eye Surgery List there (`L-29104-2026-07-22-AM` at the snapshot, the List S2 Beat 3
     covers) stays and is flagged. Route that seeded write through `unavailabilityOutcome`, so the
     seed follows the same rule as the store: with the constant on, the List leaves its Slot and
     becomes a Draft List (`origin: 'unavailable'`, `fromAnaesthetistId` Rutherford, `sinceISO:
     '2026-07-20T18:05'`, its Bookings and id kept), and the Slot keeps Phase 30's status and note;
     with it off, Phase 30's flagged List stays. It is an AM List, so `LD-002` stays the only Draft
     List on Wed 22 PM. Phase 30's Southern Cross holiday closure stays the Conflicts screen's seeded
     holiday example, and the returned List is its seeded unavailability row (work item 13).
   - `dayNotes.ts`: the Fitzgerald note becomes "St George's PM request, no anaesthetist yet (Draft
     List)." (through the terms module where it renders).
   - `SEED_MARKERS` gains the Draft Lists, so `/demo/data` can find them.
   - Seed tests (`seed.test.ts`):
     - every Draft List's hospital and surgeon resolve, and none has an anaesthetist or a Slot;
     - the request Draft Lists change no Slot: the Slots are identical with or without
       `SEED_DRAFT_LISTS`;
     - Fitzgerald Tue 21 PM is an empty, open Slot;
     - `LD-002` holds two active Bookings and fits Souter's open Slot;
     - with the constant on, the Wed 22 unavailability List is a Draft List with its Bookings and no
       availability conflict, and its Slot is closed; with it off, the seed matches Phase 30's;
     - **every** List, Draft Lists and backdrop included, has a hospital and a surgeon that resolve
       (the pairing invariant);
     - the S2 blacklist beat is reachable: the canned Okafor request in work item 22 falls on a day
       where Dr Sharma's Slot is open, so Sharma appears in the blacklisted group;
     - two builds deep-equal.

6. **Store core** (`appStore.ts`, `mutate.ts`):
   - no new collection: Draft Lists live in `schedule.lists`. Runtime Draft Lists take ids from the
     existing List allocator (`LG####`); the seed's `LD-` ids never collide with it;
   - **bump `PERSIST_VERSION` by one**, with the comment line "Phase 31: Draft Lists are Lists with no
     anaesthetist; every List carries a hospital and a surgeon; AA rooms is a location", and extend
     `persistMigrate.test.ts` (an older payload reseeds rather than loading Lists without a hospital
     or surgeon);
   - `entityCounts` gains `draftLists` (live Draft Lists).

7. **Selectors** (`store/selectors.ts`), memoised on the `schedule.lists` record reference as the
   file's header requires:
   - `waitingDraftLists(state)`: live Draft Lists, oldest first by `draft.sinceISO`, then id
     (US-01.6.2 "nothing waits unnoticed");
   - `draftListsForDate(state, dateISO)` (US-13.1.1);
   - `waitingDraftListCount(state)` (the nav badge and the rail card heading);
   - `finishedDraftLists(state)`: Lists with a `draft` trail that were assigned, and removed Draft
     Lists, newest first, for the page's History tab;
   - `draftListCandidatesFor(state, listId)`, which feeds work item 3's pure function from the Slot
     views, statuses, anaesthetists and blacklist;
   - `bookingCountsByList(state)`: active (not cancelled) Bookings per List id, for the grid, the band
     and the rail card;
   - every existing selector that iterates `schedule.lists` for an anaesthetist, a day grid row or a
     review queue skips removed Lists and, where it needs an anaesthetist, Draft Lists. A test asserts
     no anaesthetist-scoped selector ever returns a Draft List or a removed List.

8. **Draft List actions** (a new `store/draftListActions.ts`, exported from `store/index.ts`, plus
   two internal helpers in `store/slotActions.ts`). Every write goes through `mutate()` with before
   and after, timestamps from the clock, office only (`officeOnly`) and refused for the integration
   actor.
   - **Internal helpers in `slotActions.ts`** (not exported from the package index):
     - `attachListToSlot(s, listId, slotId)`: sets `slotId` and the denormalised `anaesthetistId`,
       `dateISO` and `session` from the Slot (Phase 28's invariant), and returns the draft for the
       caller's meta. The List keeps its id, Bookings, notes and conflicts.
     - `detachListToDraft(s, listId, { origin, by, fromAnaesthetistId })`: clears `slotId` and
       `anaesthetistId`, writes a fresh `draft` trail (`sinceISO` from the clock), moves any Slot time
       override back to the Slot's defaults, drops availability conflicts and keeps holiday ones. The
       vacated Slot keeps whatever status the caller set. A List projected from a recurring booking
       keeps its `recurringBookingId` (Phase 30's provenance) on the Draft List. **This is the one
       way a List becomes a Draft List**: the unavailability route here and Phase 32's move to the
       office both call it. Its callers run Phase 27's `syncPrepayment(api, bookingId, 'listMoved')`
       for each Booking after the commit.
   - **`createDraftList(api, actor, { hospitalId, surgeonId, dateISO, session, kind?, note?, source? }, origin = 'request')`**
     (US-01.6.1). `source` (phone, email, PDF, other) is required for origin `'request'` only, so
     Phase 33's `'hospitalRow'` call passes none. It refuses:
     - `pairingIncomplete`, carrying `pairingIssues`' messages (AC "Required": hospital and surgeon);
     - `invalidSession` and `dateRequired` (AC "Required": day and session);
     - `datePassed`, for a day before today;
     - `outsideCanvas`, for a day beyond the four-month horizon ("That day is beyond the four-month
       schedule.").
     `kind` defaults to private; pre-op defaults the location to AA rooms in the sheet. It allocates
     `LG####`, sets `state: 'DRAFT'`, `conflicts: []` and the `draft` trail, audits `draftList.create`
     and returns `{ listId }`. **It never touches `schedule.slots` or any other List** (AC "Takes no
     Slot"), and it needs no anaesthetist (AC "No anaesthetist needed"). Phase 30's reconcile raises a
     `holiday` conflict if its hospital is closed that day, as on any List.
   - **Editing.** Hospital, surgeon, kind and note go through the existing `editList` (a Draft List is
     a List); the pairing refusal in work item 10 applies.
   - **Bookings on a Draft List** (US-01.6.1 "Bookings allowed"). Phase 15's `createBooking`,
     `reassignBooking` and `cancelBooking` already work on any List id for the office. Check they do
     for a Draft List: `editRefusal` lets the office through and refuses an anaesthetist
     (`notOwnList`), which is right. `reassignBooking` may move a Booking to or from a Draft List
     (office only). Nothing new is written except tests, with one check: Phase 27's
     `syncPrepayment` runs on `bookingCreated` for a Booking whose List has no anaesthetist, so no
     prepaid set is known yet. It must treat that as "not known yet": no invoice generated, nothing
     withdrawn, and a sent invoice keeps its agreed amount (OQ-70). If 27's routine throws or
     withdraws there, guard it in 27's code and test it. Phase 15a's rules that need the
     anaesthetist skip the Booking until assignment (work item 13).
   - **`redateDraftList(api, actor, listId, { dateISO, session })`** (US-01.6.4 "edits its date ...
     shows on the new day"). Refuses `notDraftList`, `datePassed`, `outsideCanvas`, `invalidSession`
     and `sameDay`. The waiting time is unchanged (`sinceISO` stays). Its Bookings go with it; each
     goes through `syncPrepayment(api, bookingId, 'listMoved')` after the commit if 27 is DONE. Audits `draftList.redate` with before
     and after `{ dateISO, session }`; Phase 30's reconcile re-evaluates its holiday conflict.
   - **`removeDraftList(api, actor, listId, reason?)`** (US-01.6.4 "it no longer shows and the
     removal is recorded"). Refuses `notDraftList` and `hasBookings` while it holds an active Booking
     ("Move or cancel its 2 Bookings first."), so no Booking is ever orphaned. The reason is optional
     (closing with a reason was not discussed); the sheet offers chips. It soft-removes
     (`removedAtISO`, `removedBy`, `removeReason`), audits `draftList.remove`, and the List leaves
     every view except the page's History tab.
   - **`assignDraftList(api, actor, listId, { anaesthetistId })`** (US-01.6.3). The Slot is
     `slotFor(anaesthetistId, list.dateISO, list.session)`. It refuses:
     - `notFound`, `notDraftList`, `anaesthetistNotFound` and `anaesthetistInactive`;
     - `datePassed` ("This Draft List's day has passed. Change its date or remove it.");
     - `pairingIncomplete` (defensive; a Draft List cannot be saved without both);
     - `slotOccupied` ("Dr X already has a List in that Slot. Resolve it first.") (AC "Slot must be
       free").
     It **never refuses** a closed Slot (Unavailable, Holiday or any closed status) or a blacklisted
     pairing. Those are soft warnings (US-01.6.3, US-01.3.5, US-01.5.2). On success, in **one** `mutate()`
     commit with these metas:
     - `draftList.assign`: before `{ anaesthetistId: null, slotId: null }`, after
       `{ anaesthetistId, slotId }`, through `attachListToSlot`; the `draft` trail gains
       `assignedAtISO` and `assignedBy` and is kept;
     - `list.blacklistAcknowledged`, when `blacklistWarning` returns an entry (17's rule);
     - on a closed Slot, Phase 30's availability conflict on the List, and at a hospital with a
       holiday that day, its `holiday` conflict (already there from creation). Both come from 30's
       reconcile inside `mutate()`, not from code in this action. A bookable Slot writes no
       conflict.
     Then each of its Bookings goes through `syncPrepayment(api, bookingId, 'listMoved')` (the payee
     and the prepaid set are now known), and 15a's warning routine re-runs for them. The List leaves every
     "Unassigned" view (AC "stops being shown as unassigned"). Returns `{ listId, warnings: string[] }`.
   - **Guards elsewhere.** `submitList` and `authoriseList` refuse a Draft List (`unassigned`: "Assign
     an anaesthetist first."). The billing run skips any List with no anaesthetist, with a dev
     assertion that none is ever SUBMITTED.
   - **Projection never overwrites.** Phase 28's projected List ids are derived from the Slot. A List
     that became a Draft List keeps that id, so a later projection into the same Slot (Phase 30's
     repopulation, `rollCanvasForward`, `addAnaesthetist`) must allocate `LG####` when the derived id
     is taken, never overwrite. Add the check in the projection path and a test.
   - **No double projection.** A Draft List returned from a projected List keeps its
     `recurringBookingId`. Phase 30's projection (`projectRecurringBookingChange`,
     `projectAllRecurringBookings`, so also "Apply to canvas now") counts any live List with that id
     on that day and session, a Draft List or one since assigned to a colleague, as the template's
     List for that day, so it never projects a second List for the same surgeon if the original
     anaesthetist opens the Slot again. Assigning keeps the id (it is not one of 30's id-clearing
     edits); a removed Draft List no longer counts. Test both.

9. **The unavailability route** (OQ-27 answer, OQ-64 recommendation, provisional; FT-01.6 origin 3).
   - Every path that can close a Slot for an anaesthetist calls `unavailabilityOutcome` for the List
     in each affected Slot: Phase 28's `setAvailability`, Phase 29's `setAvailabilityRange` and
     `createAvailabilitySeries` (and the series roll forward onto new days, through 29's shared
     per-Slot write helper, which is where `availabilityClash` runs today). `'toDraftList'` calls
     `detachListToDraft(s, listId, { origin: 'unavailable', by: actor.who, fromAnaesthetistId })` in
     the same commit as the Slot write, audited `draftList.fromUnavailable`, then
     `syncPrepayment(api, bookingId, 'listMoved')` per Booking after the commit; `'conflictFlag'`
     leaves the List in place and Phase 30's reconcile flags it, unchanged. Phase 30's projection
     already skips closed Slots, so roll forward never puts a new List into one.
   - The outcome gains `'returnedToOffice'` with a count (a series edit can return several Lists).
     The mobile and web messages (Phase 29's calendar confirm and result) read, through the terms
     module: before saving, "This half-day holds your List at Forte Health · Mr C. Okafor
     (3 bookings). Marking it unavailable sends it back to the office to reassign."; after, "PM marked
     unavailable. Your List has gone back to the office." A small provisional badge (`DemoBadge`,
     "Provisional: OQ-64") sits on that confirm. The anaesthetist never sees the words "Draft List".
   - The List leaves the anaesthetist's mobile and web schedule at once (their Slot shows its closed
     status), and appears on the office's Draft Lists views as "Anaesthetist unavailable · Dr
     Rutherford".
   - **Phase 30's sickness trigger and stand-in.** `simulateSickness` calls `setAvailability`, so it
     now returns the List to the office; update its message and test (work item 22). Its `choices`
     must skip Draft Lists (they have no anaesthetist to fall sick). Phase 30's PWA
     stand-in `office-reassigns-list` acts on a List with a live availability conflict, which an open
     List no longer gets: leave it for the conflict-flag path (submitted Lists, or the constant off)
     and confirm its `when` stays false otherwise. This phase's "Office assigns a Draft List to me"
     covers the office's answer on a handset.
   - Tests (`slotActions.test.ts`, the calendar tests, `draftListActions.test.ts`): an open booked List
     marked unavailable becomes a Draft List with its id, Bookings and holiday conflicts, no
     availability conflict, and a closed Slot; a SUBMITTED List keeps Phase 30's conflict; a series
     edit over three booked days returns three Lists; with the constant off, every Phase 30 test
     passes unchanged; marking the Slot available again later leaves the Draft List where it is.

10. **The pairing rule on every other path** (US-01.3.1 "The Scheduling Engine enforces"). Each goes
    through `pairingIssues`:
    - `editList`: a patch that clears or blanks `hospitalId` or `surgeonId` refuses
      `pairingRequired` ("A List needs a hospital and a surgeon."). Changing either to another valid id
      is allowed, as today, including 17's blacklist acknowledgement (on a Draft List there is no
      anaesthetist, so no blacklist check until assignment).
    - `assignListToSlot` (28) keeps its `hospitalRequired` and `surgeonRequired` refusals. Re-implement
      them through `pairingIssues`, so there is one rule.
    - Phase 30's `addRecurringBooking` and `editRecurringBooking` refuse a template without both
      (`pairingRequired`), as 30's handoff asks. Phase 30's projection paints whatever the row holds,
      so refusing at save is what guarantees complete projected Lists.
    - The generator and `rollCanvasForward`: a template or RNG placement always carries both (work item
      4). Add a dev assertion in `placeList` and `placeListOnSlot` that throws in tests if either is
      missing. It is a programming error, not a user refusal.
    - `integrationActions.ts` (S12, S13, `ingestPdfRow`, interim until Phase 33): a hospital message or
      PDF row that would create or retarget a List without a resolvable hospital and surgeon **parks**
      for the office (Phase 28's parking seam, `pairingIncomplete`, "The message has no surgeon for
      this List. Parked for the office."). It never writes a partial List. Check that S1's canned
      messages still apply exactly as before, and prove it in `demoScenarios.test.ts`.
    - `addPostOpAddendum` (28's interim) copies the original List's hospital and surgeon, so it already
      complies. Assert it in `postOpAddendum.test.ts`.
    - **Phase 20's default Contract.** In `defaultContractForBooking`
      (`domain/billing/contractSelection.ts`), the "no hospital" branch becomes a location branch:
      `ContractSelectionContext` gains `locationType` (filled from the hospital record by the store
      caller), and an `aaRooms` location has no hospital default Contract, so it gets RVG Default
      Post-paid. Keep it pure; update `contractSelection.test.ts` (AA rooms reaches `CT-RVG-POSTPAID`;
      no test passes an undefined hospital any more). The Contract picker's "Default for AA rooms"
      heading now reads through `locationName`. The pre-op Bookings' Contracts and invoice amounts must
      not change (the fee parity tests from work item 4).
    - Phase 18's Contract-holder pickers, Phase 17's hospital contact list, the integration feeds and
      hospital holidays: AA rooms is not offered as a Contract holder or a feed. It may take a holiday
      like any location.

11. **Audit reading layer** (`shared/audit/actionLabels.ts`, `fieldLabels.ts`, `auditNarrative.ts`),
    through the terms module:
    - action labels: `draftList.create` "Draft List created", `draftList.assign` "Draft List assigned
      to a Slot", `draftList.redate` "Draft List date changed", `draftList.remove` "Draft List
      removed", `draftList.fromUnavailable` "List returned to the office (anaesthetist unavailable)";
    - field labels: `draft`, `source`, `origin`, `removeReason`, `locationType`;
    - the narrative renders hospital, surgeon and anaesthetist ids as names, and a null anaesthetist
      as "Unassigned";
    - `auditNarrative.test.ts` must pass.

12. **Store tests** (`store/draftListActions.test.ts`, plus updates to `lifecycle.test.ts`,
    `slotActions.test.ts`, `mastersActions.test.ts`, `integrationActions.test.ts`, the Booking action
    tests and `demoScenarios.test.ts`):
    - `createDraftList`:
      - every refusal, including each of the four required fields;
      - success; `schedule.slots` and every other List deep-equal before and after (AC "Takes no
        Slot").
    - Bookings: the office adds a Booking to a Draft List and moves one off it; an anaesthetist actor
      is refused; submitting or authorising a Draft List refuses `unassigned`.
    - `assignDraftList` success:
      - the same List id now has the anaesthetist and the Slot, with its Bookings, hospital, surgeon
        and note unchanged;
      - the Slot's display turns to the List's kind;
      - the `draft` trail is kept with `assignedAtISO`;
      - on a free, non-blacklisted Slot at an open hospital, the metas are exactly `draftList.assign`
        (AC "Audited") plus any Phase 27 re-check entries; the soft-warning cases below add only 17's
        acknowledgement or 30's reconcile meta.
    - `assignDraftList` refusals: every one, including an occupied Slot and a passed day.
    - Soft warnings:
      - onto an Unavailable or Holiday Slot, it assigns **and** raises a conflict through Phase
        30's path;
      - with a blacklisted pairing (Sharma with Okafor), it assigns and writes one
        `list.blacklistAcknowledged`. Neither refuses.
    - `redateDraftList`: refusals; the Bookings follow; waiting time unchanged; the List shows on the
      new day's band.
    - `removeDraftList`: refused with an active Booking; succeeds when empty or all cancelled; gone
      from every view but History; cannot then be assigned.
    - Projection: a projected id already held by a Draft List allocates `LG####` instead, and a
      recurring booking whose day's List is a live Draft List (or was assigned from one) projects no
      second List when the Slot reopens.
    - Prepayment: `syncPrepayment` on a Booking on a Draft List generates and withdraws nothing;
      assigning runs it with `listMoved`.
    - Pairing:
      - `editList` clearing either field refuses;
      - one anaesthetist's AM and PM Lists on the same day keep different hospitals and surgeons
        (US-01.3.1 AC "AM and PM can differ", already met; the rule must not break it);
      - template actions refuse incomplete templates;
      - a surgeon-less integration message parks;
      - a store-wide invariant after a sweep of actions (create, assign, re-date, remove, reassign,
        roll forward, addendum, the unavailability route, the stand-ins): every live List has a
        resolvable hospital and surgeon, and every List with an anaesthetist has a Slot.
    - The Fitzgerald test at `lifecycle.test.ts:~455` ("conflict-flags an empty-but-reserved list",
      which relies on her TBC List; Phase 30 may have moved it) is retargeted to another seeded List
      with no Bookings, since her Tue 21 PM Slot is now empty. If the case it proves is now the Draft
      List route, assert that instead and say so.
    - A Draft List at a hospital with a holiday: `createDraftList` succeeds and the List carries
      Phase 30's `holiday` conflict; assigning keeps it.

13. **Re-point the readers the type change broke** (no new UI yet):
    - Replace every "AA rooms", "Unassigned", "Not assigned" and "Surgeon TBC" fallback with
      `locationName` and the surgeon's name. "Unassigned" now means only the Draft List flag, so no
      hospital fallback may say it. The locations are listed in Reference (Admin `util.ts`,
      `AdminApp.tsx`, `ListDrawer.tsx`, the review screen, the monitors, Move Booking, and the mobile
      and web readers, plus `MasterData.tsx`'s recurring bookings table, L~261, or its Phase 17
      successor).
    - Readers that index the anaesthetist from a List narrow with `isAssignedList`, or read through
      the Slot views. Admin Booking detail and review rows show "Unassigned" (terms module) for a
      Booking on a Draft List.
    - Phase 15a's warning rules that read the List's anaesthetist skip a Draft List's Bookings until
      assignment (the routine re-runs on assign); rules that do not need it (for example the child
      billable party) still run.
    - Pre-op rows and blocks keep the design's first line, "Pre-op clinic", with "AA rooms" coming from
      the location record.
    - In `DayGrid.tsx`'s `GridBlock`:
      - the "Surgeon TBC" subtitle branch goes;
      - public and pre-op blocks keep their template label ("Acute theatre", "Pre-op clinic / AA
        rooms") as the subtitle, and the surgeon moves to the tooltip, to limit visual churn against
        the design;
      - private blocks show the surgeon as today.
    - `attentionReasons` loses "Surgeon not yet assigned".
    - `EditListSheet` and `RecurringBookingSheet` lose their "None (AA rooms ...)" options: the hospital
      select lists AA rooms like any location, and the surgeon is required with the inline error
      "Choose the surgeon.".
    - Phase 30's Conflicts screen shows a Draft List's holiday conflict with "Unassigned" in the
      anaesthetist column and opens the Draft List drawer.
    - **US-01.5.4 AC1 under the provisional route.** A List returned by unavailability carries no
      stored availability conflict any more (the reconcile resolved it when it left the Slot), yet
      the office must still see it "as a conflict, Bookings in place". Phase 30's `conflictRows`
      gains a derived row for each live Draft List with `draft.origin === 'unavailable'`: reason
      "Anaesthetist unavailable", the anaesthetist column "Unassigned · was Dr Rutherford" (terms
      module), the hospital, surgeon and booking count, the provisional badge, and a click that opens
      the Draft List drawer. It counts in the Conflicts badge, and it leaves when the Draft List is
      assigned or removed (AC2: "when the List is reassigned to an available anaesthetist, then the
      conflict clears"). With the constant off nothing changes, because no List is returned. Test
      it in 30's `conflictRows` tests and `demoScenarios.test.ts` (the seeded Rutherford row is on
      Conflicts before and gone after assigning it to Dr Sharma).
    - The `DayGrid.test.tsx` "Surgeon TBC" assertions become "the Fitzgerald Tue 21 PM block is Free"
      and "no block reads Surgeon TBC".
    - Re-green all four commands. Compare screenshots with the baseline. The expected differences are:
      Fitzgerald Tue 21 PM is Free, the Wed 22 unavailability List's Slot reads Unavailable, acute and
      pre-op tooltips and drawers name a surgeon, and the header summary reads one more free session.
      **Session 1 ends here, green and demoable.**

### Session 2: the Admin screens, the Day dashboard, the triggers and the docs

14. **Draft Lists in the Admin nav and router** (US-01.6.2 "One visible place").
    - `router.tsx` and `apps/admin/routes.tsx`: `/admin/draft-lists`, with an `AdminDraftListsRoute`
      wrapper. The search param `?open=<listId>` opens that Draft List's drawer on arrival, for the
      band, the rail card and the demo guide's direct URLs. `?tab=history` selects the history tab.
    - `SideNav.tsx`:
      - `NavSection` gains `'draftLists'`;
      - add the item **"Draft Lists"** (terms module) directly below "Day view" (or beside Phase 30's
        Conflicts entry, if 30 put one there);
      - its badge is `waitingDraftListCount` in the **amber** `badgeTone: 'warn'` (an attention count,
        like the Billing monitor; crimson stays the Review queue's identity badge).
    - `AdminApp.tsx` derives the section from the path and passes the count.

15. **The Draft Lists page** (`apps/admin/screens/DraftListsScreen.tsx`, the Review queue's table
    pattern and `tableChrome.ts`):
    - **Header:**
      - the title "Draft Lists";
      - the line "Lists with no anaesthetist yet. Assign each one to a free Slot.";
      - the teal **New Draft List** button (a product action, not a demo trigger).
    - **Tabs:** Unassigned (default, with its count) and History (assigned and removed).
    - **Unassigned table,** oldest first. Columns:
      - Waiting: mono `waitingLabel`; at 24 h or more it takes the warning on-tint with a "Waiting over
        a day" title. This is a display emphasis, not a rule;
      - Day: "Thu 23 Jul";
      - Session;
      - Hospital;
      - Surgeon;
      - Bookings: mono count;
      - Origin: "Request · Email", "Anaesthetist unavailable · Dr Rutherford" (with the provisional
        badge and the OQ-64 line in its tooltip), later "Moved to the office" (Phase 32);
      - Note;
      - Since: "20 Jul 15:40 · KW";
      - an "Unassigned" pill on every row (AC "Flagged ... wherever it appears").
      A Draft List whose day has passed shows a "Day passed" warning pill, and its Assign button is
      disabled with the reason. A Draft List carrying Phase 30's holiday conflict shows the conflict's
      amber flag. The row actions are **Assign** (teal), **Change date** and **Remove**. A whole-row
      click opens the drawer.
    - **History table:**
      - the outcome: "Assigned to Dr Chen, Thu 23 Jul PM", with an "Open List" link to the Day view
        drawer, or "Removed" with the reason if one was given;
      - how long it waited;
      - who did it and when.
    - Empty state: "No Draft Lists are waiting. New requests appear here until they are assigned."
    - The page reads the clock through the store, so advancing the demo clock updates every waiting
      time live (US-01.6.2 "how long it has been waiting").
    - It publishes the open drawer's List id to the demo-trigger context (`'adminDraftLists.openListId'`).

16. **Draft List drawer and sheets.** A Draft List is a List, so the Admin List drawer
    (`components/ListDrawer.tsx` or Phase 28's successor) gains an **unassigned mode** when
    `isDraftList`, used on the Draft Lists page, the band, the rail card and the Conflicts screen. All
    sheets go through `useSurface().Overlay`.
    - **Drawer:**
      - header: the "Unassigned" pill, the day and session, "Waiting 16 h", the booking count;
      - a "Request" section: hospital, surgeon, kind, note, origin and source, since and by;
      - a one-line reminder: "No anaesthetist yet. This takes no Slot until it is assigned.";
      - the **Bookings** section the List drawer already has, with **Add Booking** (Phase 15's office
        add-Booking flow on this List id) and each Booking's Move and Cancel;
      - actions: **Assign** (teal primary), Edit (the existing `EditListSheet`), Change date, Remove,
        and History (`HistorySheet` with `entityIds={[listId]}`).
    - **New Draft List sheet** (`flows/DraftListSheet.tsx`):
      - hospital: required, with AA rooms listed as a location;
      - surgeon: required, 17's `SurgeonSelect` with no anaesthetist yet, so a plain grouped list;
      - day: a date input, defaulting to the Day view's date when opened from there, or `?date=`;
      - session: an AM/PM segmented control;
      - kind: Private (default), Public, Pre-op; Pre-op defaults the location to AA rooms;
      - source: a segmented control, Phone, Email, PDF, Other;
      - note.
      Inline errors come from the store refusals. The save copy says "Saving does not change anyone's
      schedule. You can add Bookings before an anaesthetist is assigned."
    - **Change date sheet** (`flows/RedateDraftListSheet.tsx`): date and session, with "Its N Bookings
      move with it." when it holds any.
    - **Remove sheet** (`flows/RemoveDraftListSheet.tsx`): optional reason chips ("Request cancelled
      by the rooms", "No anaesthetist found", "Duplicate request") and free text. With active Bookings
      the button is disabled and the sheet says "Move or cancel its 2 Bookings first."

17. **Assign Draft List sheet** (`flows/AssignDraftListSheet.tsx`), US-01.6.3 and US-01.3.5 "Both
    paths". Two steps, the same shape as Phase 28's Assign List and 17's reassign picker:
    - **Step 1, choose the anaesthetist.** A header gives the Draft List's day, session, hospital,
      surgeon and booking count. The groups come from `draftListCandidatesFor`, and each row shows the
      anaesthetist's name, the Slot's status chip and times:
      - "Free" (selectable);
      - "Not available" (selectable, with an amber note; each row shows its own status, for example
        Unavailable or Holiday);
      - "Blacklisted with Mr C. Okafor" (a separately headed, labelled group; rows still selectable,
        with a warning pill);
      - "Already has a List": rows disabled, each reading "Holds <hospital> · <surgeon>. Resolve it in
        the Day view first", with a link that opens that Slot's drawer on the Day view. This satisfies
        "an occupied Slot is not offered without the admin resolving it".
      This grouped half-day view is the availability finder (US-01.4.2) for the Draft List. A "Show
      only free" toggle collapses the other groups. A line under the header reads "To use another day,
      change the Draft List's date first."
    - **Step 2, confirm:** the hospital, surgeon, kind and note read-only with an Edit link, and the
      chosen anaesthetist and Slot. The warnings stack above the button, each naming its cause:
      - 17's `BlacklistWarning`;
      - "Dr Hughes is on Holiday for this session. Assigning flags a conflict on the List." (the
        status label comes from the master);
      - "St George's is closed that day (hospital holiday). The List keeps its conflict." when the List
        carries a holiday conflict.
      The button reads "Assign Draft List", or "Assign anyway" while any warning shows.
    - **Success:**
      - a short "Draft List assigned" success moment (the reassign flow's 1050 ms pattern);
      - on the Day view, the drawer switches to the List in its Slot;
      - on the Draft Lists page, the row leaves Unassigned and the success moment offers "Open List".
    - RTL test `AssignDraftListSheet.test.tsx`:
      - the groups render with their headings;
      - an occupied row is disabled;
      - choosing a blacklisted anaesthetist shows the warning and the "Assign anyway" label;
      - a passed day disables Assign with the reason.

18. **The Draft Lists rail card** (US-01.6.2 "prominently in the core planning view ... in space
    reserved beside the day view"). A new `DraftListsCard` in `RightRail.tsx`, designed **together
    with Phase 15a's To-do card**:
    - order: `MiniCalendar`, then **Draft Lists**, then 15a's To-do, then the notes and Awaiting
      review cards. This moves 15a's To-do one card down from "directly under the mini calendar",
      which 15a built as a provisional placement (US-13.7.2's note says where the to-do list sits is
      not settled); record it in the PROGRESS entry and keep 15a's "Provisional" pill. Both attention cards share the rail-card anatomy, a heading with a mono count, at
      most five rows each, and a "See all N" link; neither pushes the calendar off screen;
    - rows: all waiting Draft Lists (every day, not just the viewed one), oldest first: "Tue 21 PM ·
      St George's · Mr S. Tan", mono waiting time and booking count, the Unassigned pill; a row opens
      the drawer; "See all" goes to `/admin/draft-lists`;
    - empty state: "No Draft Lists waiting.";
    - `data-shot="admin-draft-lists-rail"`. Check the rail at 1280 px and 1440 px widths with the
      seeded To-do entries and three or more Draft Lists.

19. **Kind and location on Phase 28's Assign List** (`AssignListSheet.tsx`) and phone advice
    (`PhoneAdviceBooking.tsx`). Phase 28 left pre-op "only from Permanent Lists until the pairing
    decision in Phase 31". Now:
    - the kind control offers every active booking-scope status (Private, Public, Pre-op);
    - Pre-op defaults the location to AA rooms;
    - the hospital select lists AA rooms;
    - the surgeon is required in phone advice (its "Not assigned yet" option goes).
    Keep `isScriptedS2Booking` and the S2 prefill unchanged.

20. **The Day dashboard** (US-13.1.1, US-01.6.2 "On the day view"):
    - **Draft Lists band** (`components/DraftListBand.tsx`, rendered by `DayGrid` above the first
      anaesthetist row):
      - it appears only when `draftListsForDate` is non-empty;
      - its row label is "Draft Lists" with the count and a micro caps "UNASSIGNED" line;
      - blocks sit on the same ruler at the session's default times (`effectiveSlotTimes`' defaults,
        since a Draft List has no Slot), stacked in lanes when two share a session;
      - the treatment is the one described in Reference (white, lineStrong border, warning-solid left
        bar, "Unassigned" line, "St George's · Mr S. Tan", mono "16 h" and the booking count);
      - a click opens the drawer in unassigned mode;
      - the band ignores the status and focus filters (it is always shown), and the footer counts read
        "... · 1 Draft List unassigned".
    - **Booking count on every List block:**
      - the count from `bookingCountsByList` (active Bookings only);
      - drawn as a small mono tabular-nums pill in the block's bottom-left corner (the flags stay
        top-right and "$" bottom-right);
      - it reads "0" muted when empty;
      - the block tooltip and `aria-label` gain "N bookings".
      Empty Slots show no count.
    - **Header summary** (`AdminApp.tsx` `summary`): it appends "· N Draft Lists" when the day has any,
      for example "14 anaesthetists · 21 sessions · 6 free · 2 submitted · 1 Draft List".
    - The drawer's List header also shows "N bookings".
    - `DayGrid.test.tsx`:
      - the band renders with the flag, the waiting label and the count, and is absent on a day
        without Draft Lists;
      - a block shows its booking count and ignores cancelled Bookings;
      - "Surgeon TBC" never renders.

21. **Mobile and web: no Draft Lists, one new message.** A Draft List never reaches the anaesthetist
    apps or the PWA UI (FT-01.6 "never offered to anaesthetists"; US-01.6.3 "Office assigns"). A List
    assigned from a Draft List appears in the assigned anaesthetist's mobile Forward Lists, web Lists
    and week strip as a normal booked List with its Bookings, location and surgeon (Phase 28's Slot
    views). The only anaesthetist-facing change is work item 9's availability confirm and result copy
    on mobile and web. A grep or selector test checks that nothing under `apps/mobile`, `apps/web` or
    `src/pwa` imports the Draft List selectors or actions.

22. **Demo triggers** (the table below). Registry entries go in `shared/demoTriggers/registry.ts`, with
    bodies in `src/store` and canned data in `src/domain/seed/draftLists.ts`:
    - `CANNED_DRAFT_LIST_REQUESTS`: three requests, each with hospital, surgeon, kind, source and a day
      **relative to the demo clock** ("the next Thursday after today", and so on) through a pure
      `nextWeekday(todayISO, weekday)`;
    - `simulateIncomingDraftListRequest(api, requestId)` and `addDraftListForDay(api, dateISO,
      choiceId)` in `store/draftListDemo.ts`, both calling `createDraftList` as
      `OFFICE_SIMULATION_ACTOR` (Phase 14's `store/demoActors.ts`; some plans call it
      `SIMULATED_OFFICE_ACTOR`, use the name the code has);
    - **`assignDraftListAsSimulatedOffice(api, anaesthetistId)`** in `store/officeStandIn.ts`, beside
      14's and 28's stand-ins. It chooses deterministically:
      1. walking this anaesthetist's **open** Slots from today (Phase 28's date-then-session scan,
         shared, not copied), the first Slot that some waiting Draft List falls on and is not
         blacklisted with them (`blacklistWarning` returns null); within that Slot, the oldest-waiting
         one (by `sinceISO`, then id);
      2. if none fits in four months, it logs a canned request for the anaesthetist's next open Slot
         (a hospital and surgeon from the canned set, skipping blacklisted pairings) and assigns that.
      Phase 28's "Office assigns a List to my next free Slot" stays on Mobile · Lists; register this
      entry after it. On a fresh seed both target Souter's Wed 22 PM, so whichever runs second takes
      her next open Slot. Both writes are audited. Its message never mentions the blacklist (OQ-43) or
      the words "Draft List" (terms: "a waiting request").
    - **Phase 30's `simulate-sickness`** keeps its entry and disabled states; its `choices` skip
      Draft Lists. Its message becomes, for example, "Dr Hughes marked Unavailable for Tue 21 AM.
      Their List went back to the office (Draft Lists)." when the route returns the List, and stays
      Phase 30's conflict message on the flag path. (Rutherford's Wed 22 AM is already Unavailable on
      a fresh seed, so it is never the example.) Its test asserts both.
    - Vitest (`draftListDemo.test.ts`, `officeStandIn.test.ts`):
      - the canned days follow the clock after "Next day";
      - the duplicate guard works;
      - the stand-in picks `LD-002` (with its two Bookings) on a fresh seed and falls back to logging
        a request once no Draft List fits;
      - it never picks a blacklisted pairing;
      - it refuses with "No free Slot in the next four months" when the anaesthetist has none;
      - after Phase 28's stand-in has taken Wed 22 PM, it falls back cleanly (either order works).
    - `pwaPurity.test.ts` stays green: the entries live in `src/shared`, the bodies in `src/store`.

23. **Playwright and shot hooks:**
    - `data-shot` hooks: `admin-draft-lists`, `admin-draft-list-drawer`, `admin-draft-lists-rail`,
      `admin-assign-draft-list`, `admin-assign-draft-list-blacklist`, `daygrid-draft-band`,
      `daygrid-block-count`;
    - a new `visual/admin-draft-lists.spec.ts`: open Draft Lists, see four rows oldest first, assign
      `LD-001` to Dr Fitzgerald, see the band empty and her PM block booked "St George's · Mr S. Tan"
      on Tue 21 Jul; change `LD-003`'s date and see it on the new day's band; remove an empty Draft
      List and see it in History;
    - update the specs that asserted the Fitzgerald TBC block and the Wed 22 availability conflict;
    - extend `visual/pwa-device.spec.ts`: open the Demo chip on Lists, run "Office assigns a Draft
      List to me", and assert a new booked row on Wed 22 PM showing 2 bookings; mark a booked Slot
      unavailable and see the List leave the schedule with the "gone back to the office" message.

24. **Capture recipes** (`requirements-board/capture/`): re-point only the captions and selectors the
    change breaks. That is the ATLAS line about "Fitzgerald PM ... surgeon TBC" and the US-01.3.1 and
    US-13.1.1 recipes (the drawer shows one hospital and one surgeon; the day view gains the band,
    the rail card and counts). Add recipe stubs for US-01.6.1 to US-01.6.4 only if the owner asks, and
    do not re-run the captures unless asked.

25. **Docs inside the app and close-out.** In `aa-prototype/README.md`'s folder map, add
    `domain/pairing.ts`, `domain/draftLists.ts`, `shared/scheduleTerms.ts`, `store/draftListActions.ts`, `store/draftListDemo.ts`, and one paragraph
    on the Draft List (a List with no anaesthetist and no Slot, four required fields, may hold
    Bookings, assigned into the Slot its day and session fix; the unavailability route behind one
    provisional rule) and the pairing rule (AA rooms is a location). Then finish green, run the
    adversarial review, patch the demo guide and write the PROGRESS entry.

## Demo triggers

Creating, editing, adding Bookings to, assigning, re-dating and removing a Draft List are product
actions in the Admin app, and an anaesthetist marking a booked Slot unavailable is a product action on
mobile and web. What cannot be shown through normal use is **a request arriving from outside** (a
surgeon's secretary's email or PDF, a phone call before the presenter is ready), **an anaesthetist
going sick** while the presenter is in Admin, and, on a handset, **the office doing the assigning**.
Waiting time needs no trigger: the existing demo clock advances it.

| Label | Screen | Surface | Effect |
|---|---|---|---|
| Simulate incoming request | Admin · Draft Lists (`/admin/draft-lists`) | bar | Logs a Draft List as if a surgeon's secretary emailed it, created by `OFFICE_SIMULATION_ACTOR` with the source shown. `choices` (days relative to the clock): **Forte Health · Mr C. Okafor · next Thu PM · email** (default; on the pristine seed this is Thu 23 Jul PM, where Dr Sharma's open Slot lands in the "Blacklisted with Mr C. Okafor" group), Christchurch Eye Surgery · Mr J. Whitford · next Mon AM · PDF, and St George's · Mr S. Tan · next Fri AM · phone. The new row appears at the bottom of Unassigned (the table is oldest first) with "0 min" and 0 bookings. Disabled with "Already waiting on Draft Lists" while the same canned request is still unassigned, and with "That day is beyond the four-month schedule" if the clock has run far ahead |
| Add Draft List for this day | Admin · Day view (`/admin/day/:dateISO`) | bar | Creates a Draft List for the URL's day, which appears in the grid's Draft Lists band and the rail card at once. `choices`: AM · St George's · Mr S. Tan, and PM · Southern Cross · Ms K. Patel. Disabled with "This day has passed" before today, "Beyond the four-month schedule" past the horizon, and "Already added" if the same one is unassigned for that day |
| (product) Add Booking, Change date, Remove | Admin · Draft List drawer (`/admin/draft-lists?open=<listId>`, the band, the rail card) | product | Not triggers; listed so the presenter knows they are real actions. Remove is disabled while the Draft List holds an active Booking |
| (Phase 30, re-pointed) Simulate sickness | Admin · Day view and Admin · Conflicts | bar | Same entry; its `choices` skip Draft Lists. On an open List it now returns the List to the office: it leaves the anaesthetist's row, the Slot reads Unavailable, and the List appears in the band (if on the viewed day), the rail card and Draft Lists as "Anaesthetist unavailable" (provisional, OQ-64), and as a row on Conflicts (US-01.5.4). On a submitted List, or with the rule off, Phase 30's conflict as before |
| (existing) +1 hour, Next day, Next morning | Harness bar clock menu; PWA More clock card | bar and PWA | Unchanged. Every waiting time on the Draft Lists page, the rail card, the band and the drawer moves with the clock (US-01.6.2) |
| Office assigns a Draft List to me | Mobile · Lists (`/mobile/lists`) | PWA only, badged "office stand-in" | Acts as the simulated office for Dr Souter. It assigns the waiting request that falls on her soonest open Slot and is not blacklisted with her (on a fresh seed, Southern Cross · Ms K. Patel with 2 bookings into Wed 22 Jul PM). If none fits, it first logs a request for her next open Slot and assigns that. The message names what happened ("The office assigned a waiting request to your Wed 22 Jul PM Slot: Southern Cross · Ms K. Patel, 2 bookings"), and the booked row appears. Never mentions the blacklist (OQ-43). Disabled with "No free Slot in the next four months" |

Nothing is added to the Control Panel page. Its generated index lists the new entries under their
screens. In the framed build, the presenter plays the office in Admin, so the stand-in is PWA only.

## Out of scope

- **Offering a Draft List to anaesthetists**, or showing one on the mobile, web or PWA surfaces
  (FT-01.6 rules it out).
- **An anaesthetist moving their own List to the office or a colleague** (US-01.4.3, US-01.4.6):
  Phase 32, through `detachListToDraft` with `origin: 'movedToOffice'`.
- **Creating a Draft List from a hospital row on the matching screen** (US-02.1.2; not settled in
  US-01.6.1): Phase 33 may call `createDraftList(..., 'hospitalRow')`.
- **The update email** after an assignment (US-02.3.3, OQ-46, OQ-69): Phase 35.
- **Repointing a prepaid Booking's payee** when a Draft List made from unavailability is assigned to
  someone else (US-06.5.4): Phase 41. This phase runs Phase 27's re-check only.
- **The conflict dashboard and conflict clearing** (US-01.5.2, US-01.5.4): Phase 30. This phase only
  shows a Draft List's holiday conflict there as "Unassigned", and adds the derived row for a List
  returned by unavailability.
- **Reopening a removed Draft List** and **assigning into a Slot on another day** without changing the
  date first. Neither is in the catalogue; raise with the owner if a beat needs it.
- **Editing the AA rooms location** and deactivating hospitals: Phase 42 (every master editable).
- **Paging and virtualising the Day grid** for 85 anaesthetists (the footer narration stays): Phase 43.
- **A Draft List threshold rule** ("alert after N hours"). None exists in the catalogue; the
  over-a-day emphasis is display only. A Draft List warning in 15a's routine is not added either.

## Manual test checklist

- [ ] Reset. The Admin side nav shows **Draft Lists 4** in amber, below Day view.
- [ ] Admin Day, Tue 21 Jul:
  - the right rail shows a **Draft Lists** card under the calendar, four rows oldest first, then 15a's
    To-do card, with neither crowding the other;
  - a Draft Lists band sits above the rows, holding "St George's · Mr S. Tan", PM, "16 h", 0 bookings,
    flagged "Unassigned", drawn differently from every status colour;
  - Dr Fitzgerald's PM is a Free Slot;
  - the header reads "... · 1 Draft List";
  - every List block shows a booking count, and a List with a cancelled Booking does not count it;
  - no block anywhere reads "Surgeon TBC", and no hospital reads "Unassigned".
- [ ] Advance the clock "+1 hour": the rail card, the band, the drawer and the Draft Lists page read
      "17 h". Advance "Next day": the St George's request shows "Day passed" and Assign is disabled
      with the reason; Change date and Remove still work. (Reset afterwards.)
- [ ] Draft Lists page:
  - four rows oldest first: Christchurch Eye Surgery "3 d 22 h" (warning emphasis), St George's
    "16 h", Dr Rutherford's Wed 22 AM Christchurch Eye Surgery List "Anaesthetist unavailable · Dr
    Rutherford" with its Bookings and the provisional badge, Southern Cross "40 min" with 2 bookings;
  - every row carries "Unassigned".
- [ ] New Draft List with no surgeon: refused with "Choose the surgeon.". With Forte Health, Mr C.
      Okafor, Fri 24 Jul AM, Phone: it appears at "0 min". Mobile and web views of every anaesthetist
      are unchanged (it takes no Slot), and the Audit viewer shows "Draft List created".
- [ ] Open that Draft List and **Add Booking**: it saves, the count reads 1, and the Booking shows
      "Unassigned" as its anaesthetist in Admin Booking detail. Remove is now disabled with "Move or
      cancel its 1 Booking first."
- [ ] Assign the St George's request:
  - step 1 lists Dr Fitzgerald under Free, anyone Unavailable or on Holiday that half-day under "Not
    available" with their status, and Slots that hold a List as disabled with "Resolve it in the Day
    view first";
  - choose Fitzgerald and Assign;
  - the band empties, Fitzgerald's PM block shows St George's · Mr S. Tan with "0" bookings, and the
    drawer's History shows the Draft List's creation and assignment on the same List.
- [ ] Assign Southern Cross (2 bookings) to a free anaesthetist: their block shows "2", and their
      mobile or web schedule shows the List with both Bookings.
- [ ] Harness bar on Draft Lists: "Simulate incoming request" (Okafor, Forte, next Thu PM). Assign it:
  - Dr Sharma sits in "Blacklisted with Mr C. Okafor";
  - choosing her shows the blacklist warning and "Assign anyway";
  - pick Dr Chen instead: no warning. Run the trigger again: it is disabled with "Already waiting".
    Repeat once and assign to Sharma anyway: the audit shows the acknowledgement.
- [ ] Assign a Draft List onto a Holiday or Unavailable Slot: an amber warning names the status, and it
      assigns. The List carries a conflict and appears on Phase 30's Conflicts screen.
- [ ] Conflicts (US-01.5.4 AC1, provisional route): Rutherford's Wed 22 AM row reads "Anaesthetist
      unavailable", "Unassigned · was Dr Rutherford", with its Bookings and the provisional badge.
      Open it: the Draft List drawer. Assign it to Dr Sharma (Free): the row leaves and the Conflicts
      badge drops; Sharma's AM block shows the List with its booking count.
- [ ] Add a hospital holiday (Phase 30's Holidays) for a Draft List's hospital and day: the row, the
      drawer and the band block show the conflict flag; the Conflicts screen lists it as "Unassigned";
      assigning it warns, goes ahead, and the List keeps its holiday conflict.
- [ ] Change date on Christchurch Eye Surgery to another day: it leaves the old day's band and shows on
      the new day's; its waiting time is unchanged.
- [ ] Remove an empty Draft List with "Duplicate request": it leaves Unassigned, the rail card and the
      band, and shows in History as "Removed: Duplicate request".
- [ ] Admin Day on another day: "Add Draft List for this day" from the harness bar adds a band block
      for that day. The menu shows no Draft List entries on the Billing monitor.
- [ ] Unavailability (provisional): Demo actions, Simulate sickness on Wed 22, pick an open booked
      List: it leaves the anaesthetist's row, the Slot reads Unavailable, and the List appears in the
      band, on Draft Lists and on Conflicts as "Anaesthetist unavailable" with its Bookings. The
      trigger offers no Draft List as a choice. On a submitted List the Phase 30 conflict appears
      instead. On mobile (Dr Souter), marking a booked PM unavailable shows
      the "sends it back to the office" confirm with the provisional badge, and the List leaves her
      schedule.
- [ ] Pairing:
  - Edit list cannot clear the hospital or surgeon;
  - a recurring booking needs both;
  - the Pre-op kind on Assign List defaults to AA rooms, and phone advice requires a surgeon;
  - pre-op Lists read "Pre-op clinic · AA rooms" in mobile, web and admin, and their drawer names a
    surgeon;
  - acute blocks keep "Acute theatre" and name a surgeon in the tooltip.
- [ ] S1 on the framed build (Fire hospital message and its modify and move messages), S2 Beats 2 and
      4 and S3 behave exactly as before, with the same figures; S2 Beat 3 matches its patched text.
- [ ] PWA (`npm run dev:pwa`, fresh storage): on Lists the Demo chip offers "Office assigns a Draft
      List to me", badged. Running it adds Wed 22 Jul PM Southern Cross · Ms K. Patel with 2 bookings;
      running it again logs and assigns a request into the next open Slot. It never mentions a
      blacklist or a Draft List.
- [ ] No en or em dashes in any new copy; teal is the only action colour; crimson unused on the new
      screens, sheets, rail card and band; the nav badge is amber; every Draft List word comes from
      the terms module.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots` all green.

## Demo guide updates

This phase changes S2 (a new beat, Beat 3's sickness outcome and new Expected lines) and the office
workflows. Patch, in the same session:

- **`docs/demo-guide/03-demo-script.md`:**
  - S2 **Time**: "7 to 9 minutes" (the new beat adds about 90 seconds). Update the timing table rows
    that include S2.
  - S2 Beat 1, add to Say: "Requests that arrive before an anaesthetist is found wait here as Draft
    Lists, flagged unassigned, right beside the day, so nothing sits on a pile of paper." Add to
    Expected: "a Draft Lists card in the right rail and a Draft Lists band above the grid hold St
    George's PM, Mr S. Tan, waiting 16 h; every List block shows its booking count; the nav shows
    Draft Lists 4."
  - **New S2 Beat 1b, "a List with no anaesthetist yet"** (lettered, so later beat numbers and
    cross-references hold until Phase 44 renumbers):
    - Click: open the band's St George's block → **Assign** → **Dr Emma Fitzgerald** (Free) →
      **Assign Draft List**.
    - Optional, if time allows: **Draft Lists** → open **Southern Cross** (2 bookings) to show
      Bookings already on a Draft List; or Demo actions → **Simulate incoming request** (Forte
      Health, Mr C. Okafor, Thu 23 Jul PM) → **Assign** → point at Dr Sharma in "Blacklisted with Mr
      C. Okafor" → pick **Dr Chen** instead.
    - Say: "A Draft List has its hospital, surgeon, day and session, and can already hold Bookings,
      but has no anaesthetist and takes no one's Slot. Only the office assigns it, into the Slot for
      its day and session. An unavailable Slot or a blacklisted pairing warns, and never blocks. A
      cancelled request is removed, or its date changed."
    - Expected: "the band empties; Fitzgerald's PM shows St George's, Mr S. Tan; History shows the
      Draft List created and assigned on the same List."
  - S2 **Beat 3** (as Phase 30 left it: start on Conflicts, Rutherford's Wed 22 AM row, reassign to
    Dr Sharma; optional 3a Simulate sickness). Rutherford's Christchurch Eye Surgery List is now a
    Draft List returned by his sickness, still on Conflicts as "Anaesthetist unavailable ·
    Unassigned". Click: **Conflicts** → Rutherford's Wed 22 AM row → the Draft List drawer →
    **Assign** → **Dr Priya Sharma** (Free) → **Assign Draft List**, then Sharma AM → **History**.
    Say: "When an anaesthetist goes sick, their open Lists come back to the office as Draft Lists,
    Bookings intact, and the office assigns them from the same conflict view. This follows AA's
    answer and is provisional until the logical model is settled." Expected: the row leaves and the
    Conflicts badge drops; Sharma's AM shows the List with its booking count; History shows the
    List's return to the office and its assignment. Beat 3a: Simulate sickness on an open List sends
    it to Draft Lists and Conflicts the same way. The Southern Cross holiday rows stay as Phase 30
    left them.
  - S2 **Discovery points**: drop OQ-44 (answered). Add OQ-64 (what users call a Slot and a Draft
    List; whether unavailability makes Draft Lists or a conflict flag), whether a matching-screen row
    may create a Draft List, and the pre-op and acute pairing reading (AA rooms as a location; a named
    surgeon on pre-op and acute Lists).
- **`docs/demo-guide/02-workflows-and-handoffs.md`:**
  - Workflow 1 "Manual fallback paths": a request with no anaesthetist yet becomes a Draft List, which
    can take Bookings before it is assigned.
  - Workflow 2 "plan the day": the Draft Lists rail card and band, and the booking counts.
  - The availability or sickness workflow: an anaesthetist who goes unavailable returns their open
    Lists to the office (provisional, OQ-64).
  - "The two kinds of state": one line saying a Draft List is not the approval state DRAFT (shown as
    "Open").
- **`docs/demo-guide/04-presenter-cheat-sheet.md`:**
  - "The five nouns to remember" or its Slot and List line: add the Draft List ("a List with no
    anaesthetist yet"), and "every List has exactly one hospital and one surgeon; AA rooms is a
    location";
  - "Admin Web" under "What each app is for": Draft Lists;
  - "Prototype readiness": Draft Lists built and clickable, with the unavailability route named as
    provisional (OQ-64);
  - "Terms not to use": "Surgeon TBC List", and "a List being prepared" for a Draft List (the
    approval state DRAFT keeps its "work is still being prepared" description).
- **`docs/demo-guide/master-demo-guide.html`:** the same S2 Beat 1, new Beat 1b, Beat 3, the S2
  discovery points, the workflow summaries and the cheat-sheet lines (the sections near "Office day",
  "phone advice" and "Workflow 2").
- **Control Panel** `SCENARIOS` S2 text (`apps/demo/DemoControlPanel.tsx`): "Assign the St George's
  Draft List to Dr Fitzgerald; optionally open Southern Cross to show Bookings on a Draft List, or
  simulate an incoming request to show the blacklist warning. For illness cover, assign Dr
  Rutherford's returned Wed 22 AM List to Dr Sharma from Conflicts."

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
- **A Draft List is a List with no anaesthetist and no Slot.** `createDraftList` touches no Slot and
  no other List. Assigning keeps the List id and its Bookings, through `attachListToSlot`, in the Slot
  the day and session fix. A List only becomes a Draft List through `detachListToDraft`. Every live
  Draft List has hospital, surgeon, day and session. No anaesthetist-scoped selector, screen or PWA
  surface ever shows one; an anaesthetist cannot add a Booking to one; it cannot be submitted,
  authorised or billed.
- **The unavailability route is one provisional rule.** Only `unavailabilityOutcome` decides it (29's
  `availabilityClash`, if it survived 30, delegates its closed-status case to it; there is no second
  clash rule), only `UNAVAILABLE_LISTS_BECOME_DRAFT_LISTS` switches it, the seed follows the same
  function, and every Phase 30 test passes with the constant off. Only open (DRAFT), today-or-later
  Lists convert, on every Slot-closing path (`setAvailability`, `setAvailabilityRange`,
  `createAvailabilitySeries`, the series roll forward); series edits convert each affected List;
  holiday conflicts survive, availability conflicts do not. A returned List still shows on the
  Conflicts screen until it is assigned or removed (US-01.5.4 AC1 and AC2), and Simulate sickness
  never offers a Draft List.
- **One pairing rule.** Every write path (create, assign, Assign List, phone advice, edit, templates,
  generator, roll-forward, integrations, addendum, stand-ins) goes through `pairingIssues`, with no
  inline checks. No List anywhere, Draft Lists and backdrop included, lacks a resolvable hospital or
  surgeon. Hunt for surviving "AA rooms", "Not assigned" and "Surgeon TBC" fallbacks and any
  "Unassigned" that is not the Draft List flag.
- **Warn, never block, except the real guards.** A closed Slot (Unavailable, Holiday or any closed
  status) or a blacklisted choice is selectable, warned before save, and assigned (with a Phase 30 conflict on a
  closed Slot, and 17's acknowledgement on a blacklisted pairing). The only hard refusals are an
  occupied Slot, an incomplete pairing, a missing day or session, a passed day, removing a Draft List
  that holds active Bookings, and the office-only guard.
- **Identity and projection.** No projection, roll-forward or new-anaesthetist path overwrites a List
  id held by a Draft List, and no recurring booking projects a second List for a day whose List was
  returned to the office. Runtime ids are `LG####` and never collide with the seed's `LD-`.
- **Prepayment.** A Booking on a Draft List never generates or withdraws a prepayment invoice;
  assigning, re-dating and the unavailability return run `syncPrepayment` with `listMoved`.
- **Audit.** Create, assign, re-date, remove and the unavailability return are each audited with
  before and after; every new action code is labelled; the List's History shows its whole trail,
  including the time it was a Draft List.
- **Determinism and seed hygiene.** The golden-fixture diff shows only the stated changes, with no
  Booking id, List id or other placement moved. The acute surgeon comes from its own RNG stream. No
  fee, invoice or Contract resolution changed (AA rooms reaches RVG Default Post-paid as before;
  `LD-002`'s Bookings touch no existing figure). The canned request days derive from the clock with no
  `new Date()`. `PERSIST_VERSION` is bumped and the migrate test extended.
- **Time waiting.** It is computed from the demo clock, updates on every clock move, freezes at
  assignment or removal, survives a date change, and is formatted in one helper.
- **Vocabulary.** Every Draft List word comes from `shared/scheduleTerms.ts`. "Draft List" never
  labels the approval state (which reads "Open"), no status value is `DRAFT` or `open` for a Draft
  List, and no Draft List surface says "being prepared".
- **Design and copy.** The band, rail card and pills use the warning tint and never a status colour,
  so a Draft List never reads as a booked List. The rail card and 15a's To-do card share one anatomy
  and fit together. Teal is the only action colour, the nav badge is amber, and crimson is unused.
  Admin sheets go through `useSurface().Overlay`. No en or em dashes. `pwaPurity` holds, and the
  stand-in is PWA only, badged, and silent about the blacklist.

## PROGRESS.md updates

- **Status row** for catch-up Phase 31, and a phase entry with:
  - the drift-check result: items changed or not since `501b0b8`; OQ-64 and OQ-43 status; the owner's
    answer on the pre-op and acute pairing reading, and on emergency Slots if any status now has an
    emergency-only behaviour; the names 15a, 17, 27, 28, 29 and 30 actually used (including what
    became of `availabilityClash`);
  - what was built, with a name map for later phases: `DraftList`, `AssignedList`, `DraftTrail`,
    `isDraftList`, `createDraftList`, `assignDraftList`, `redateDraftList`, `removeDraftList`,
    `attachListToSlot`, `detachListToDraft`, `unavailabilityOutcome`,
    `UNAVAILABLE_LISTS_BECOME_DRAFT_LISTS`, `pairingIssues`, `draftListCandidates`, `waitingLabel`,
    `locationName`, `shared/scheduleTerms.ts`, `HOSP.aaRooms`, and the now-required
    `List.hospitalId` and `List.surgeonId`;
  - the `PERSIST_VERSION` bump (from and to);
  - the golden-fixture diff summary;
  - the tests added, and the before and after Vitest and Playwright counts;
  - the review pass.
- **Decisions log:**
  1. **Superseded:** 2026-07-23 "PermanentList type gains `hospitalId: HospitalId | null`". The pre-op
     clinic is held at the **AA rooms location** (`Hospital.locationType: 'aaRooms'`). Templates
     (`RecurringBooking` since Phase 30) and Lists always carry a hospital and a surgeon (US-01.3.1).
  2. **Superseded:** the Phase 02 and 06 "surgeon TBC" design state (the Fitzgerald Tue 21 PM List
     with an amber "Surgeon not yet assigned" flag, reproduced from `Admin Day.dc.html`). It is now a
     Draft List with its surgeon named; the catalogue rule wins over the mockup (convention 17's rule
     2, OQ-44).
  3. **Superseded:** Phase 28's interim "pre-op Lists come only from Permanent Lists" (recurring
     bookings since Phase 30). Assign List and
     phone advice offer every booking-scope kind, and phone advice requires a surgeon.
  4. **Superseded, provisional (OQ-64 recommendation, OQ-27 answer):** the Phase 06 and Phase 28/30
     ruling that an anaesthetist marking a booked Slot unavailable keeps the List and flags a
     conflict. Open, today-or-later Lists now return to the office as Draft Lists; submitted and past
     Lists keep the conflict. One rule constant; the seed follows it.
  5. **New (OQ-44 answered):** a Draft List is a List with no anaesthetist and no Slot. Hospital,
     surgeon, day and session are required; it may hold Bookings; it is office only; it is removed or
     re-dated, not closed. Our reading: removal is refused while it holds an active Booking, and the
     reason is optional.
  6. **New, reading (no OQ, owner told):** pre-op clinics name the surgeon whose patients they assess,
     and acute Lists name the on-call surgeon. The acute pick comes from its own RNG stream.
  7. **New:** assigning a Draft List fixes the Slot by its day and session (change the date to use
     another day). Only an occupied Slot, an incomplete pairing, a passed day or the office-only guard
     refuse. Closed (Unavailable, Holiday) and blacklisted choices warn and go ahead (US-01.5.2,
     US-01.3.5). The picker has no emergency group because no emergency-only status exists; record
     the owner's answer if one has been added.
  8. **New:** a Draft List at a hospital with a holiday carries Phase 30's `holiday` conflict like any
     List and shows on the Conflicts screen as "Unassigned" (answers Phase 30's handoff). A List
     returned by unavailability shows there too, as a derived "Anaesthetist unavailable" row, until
     it is assigned or removed, so US-01.5.4 AC1 holds under the provisional route (answers Phase
     30's other handoff question).
  9. **New:** user-facing Draft List words ("Draft List", "Unassigned") live in one module until
     OQ-64 names them.
  10. **New:** the "over a day" waiting emphasis is display only, not a rule.
  11. **New:** the PWA stand-in logs a request for the persona's next open Slot when no Draft List
      fits, so the handset beat never dead-ends.
  12. **New:** the Admin Day rail order is calendar, Draft Lists, To-do, notes, Awaiting review. 15a's
      To-do card moves one place down from its provisional spot under the calendar.
  13. **New:** a List returned to the office keeps its `recurringBookingId`, and the projection
      treats it (and its later assignment) as that day's instance, so a reopened Slot is never
      re-filled from the same recurring booking.
- **Handoff notes:**
  - For **32**: `detachListToDraft(s, listId, { origin: 'movedToOffice', ... })` is the move to the
    office; `assignDraftList`'s refusals and `draftListCandidates` are the pattern for the colleague
    picker; a Draft List has no owner, so it cannot be "moved" by an anaesthetist.
  - For **33**: call `createDraftList(api, actor, input, 'hospitalRow')` from the matching screen if
    US-01.6.1's open point is settled that way (no `source`: it belongs to origin `'request'` only);
    add a source reference field then if the row needs one. The interim `pairingIncomplete` park in
    `integrationActions.ts` is what 33 replaces.
  - For **34**: per-hospital sync skips the AA rooms location (`locationType: 'aaRooms'`); it has no
    feed.
  - For **35**: assigning a Draft List is a cover change, a natural update-email moment to the
    hospital (OQ-46); a Draft List's Bookings may already have come from the rooms.
  - For **41**: a Draft List made from unavailability keeps any prepaid Bookings; when it is assigned
    to someone else, US-06.5.4's payee repoint applies.
  - For **42**: AA rooms is a hospital-master row with `locationType: 'aaRooms'`. The Hospitals editor
    must keep it non-deletable and out of the Contract-holder and feed pickers. The request sources
    are a candidate master.
  - For **43**: the day band, the rail card and the booking counts must stay fast at 85 anaesthetists.
  - For **43a**: point-of-need help on Admin Day should explain the Draft Lists card and band.
  - For **44**: S2 Beat 1b is lettered; renumber it in the rewrite, and re-read the Draft List
    discovery points and the unavailability beat against OQ-64.
