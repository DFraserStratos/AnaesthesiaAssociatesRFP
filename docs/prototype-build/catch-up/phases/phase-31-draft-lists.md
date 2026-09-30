# Phase 31 · Draft Lists and the day dashboard

**Requirements covered:**
[FT-01.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-01.6.md) Draft Lists ·
[US-01.6.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.6.1.md) Create a Draft List ·
[US-01.6.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.6.2.md) See Draft Lists flagged in the Admin App ·
[US-01.6.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.6.3.md) Assign a Draft List to an anaesthetist ·
[US-13.1.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.1.1.md) One-day dashboard ·
[US-01.3.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.3.1.md) Assigned List pairing rule ·
[FT-01.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-01.3.md) List assignment (Verify) ·
[EP-01](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/EP-01.md) Schedule canvas, Slots and Lists (its last open strands: Draft List, the pairing rule, the "Surgeon TBC" state) ·
[DM-03](../analysis/domain-model-delta.md#dm-03) Draft List (prepared, not yet assigned to any anaesthetist).
No RV items.
Read alongside (not closed here):
[DM-02](../analysis/domain-model-delta.md#dm-02) (counted under Phase 28; this phase builds its Draft List third),
[US-01.3.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.3.5.md) (blacklist warning; its "Both paths" acceptance criterion is checked here, on the Draft List path Phase 17 left for this phase),
[US-01.3.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.3.3.md) (manual List assignment, Phase 28),
[US-01.4.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.4.2.md) (availability finder: the assign picker is its Draft List view),
[US-01.5.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.5.2.md) (conflict flagging, Phase 30: "soft warning, can still go ahead"),
[US-02.1.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.1.2.md) (the matching screen, Phase 33: the second way a Draft List is created),
[US-13.5.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.5.2.md) (audit),
[OQ-44](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-44.md) (Draft List contents and lifecycle, Open), and the "Slot, List and Draft List" section of
[domain-model.md](../../../discovery-reference/Updated%20Requirements/domain-model.md).
**Depends on:** 17 (the blacklist helper `src/domain/blacklist.ts`: `partitionAnaesthetistsForSurgeon`, `blacklistWarning`; `SurgeonSelect`, `BlacklistWarning` and `useBlacklistWarning` in `src/shared/schedule/`; the `*.blacklistAcknowledged` audit rule) and 30 (and through it 28 and 29: Slot records and Slot views, the internal `placeListOnSlot`, `assignListToSlot`, the Slot status master with `isOpenForBooking`, `isEmergencyOnly` and `isClosed`, and Phase 30's accept-and-flag conflict path for assigning onto a closed Slot). Also uses 14 (the registry, `useDemoTriggerContext`, `OFFICE_SIMULATION_ACTOR` and `OFFICE_ACTOR` in `store/demoActors.ts`, the PWA sheet `src/pwa/PwaDemoActions.tsx`), 15 (Booking names) and 20 (the default Contract for a List with no hospital, which this phase re-points to the AA rooms location). Phase 32 follows; 33 calls this phase's `createDraftList`.
**Estimated:** 2 sessions. Session 1 is the model, the pairing rule, the seed and the store (work items 1 to 12), ending green and demoable with the seed changes visible (the Fitzgerald block gone, AA rooms as a location). Session 2 is the Admin screens, the Day dashboard, the demo triggers, the PWA stand-in and the demo guide (work items 13 to 23). Both are full. Session 1's risk is the compiler fallout from the required `hospitalId` and `surgeonId`; if it runs long, keep the seed proof, the store tests and the green gate, and move work item 17 (Assign List and phone advice kinds) and the non-Admin reader tidy-ups beyond the compile-forced minimum to the start of session 2 rather than cutting tests. Session 2's slack is work item 22 (capture recipes).

## Goal

The catalogue has three schedule things, and after Phases 28 to 30 the prototype has two of them.
This phase adds the third, the **Draft List**: a request for a List that has arrived (by phone,
email or a surgeon's PDF) before anyone knows which anaesthetist will do it. It records the
**hospital, surgeon, day, session, a note, how it arrived and when it was created**. It has **no
anaesthetist and takes no Slot**, so saving one changes nobody's schedule. Following OQ-44, it holds
no Bookings.

The office sees every Draft List **flagged "Being prepared", with how long it has been waiting**, in
three places:

- a **Draft Lists** view in the Admin side nav, with an amber count badge;
- a **"Draft Lists · being prepared" band** on the Day dashboard for the day it falls on;
- the Day header's summary line.

It **assigns** one by choosing an anaesthetist. The Slot is then fixed by the Draft List's day and
session. The picker is the availability finder for that half-day, with these groups:

- anaesthetists whose Slot is free;
- those available for emergency only;
- those unavailable or on leave;
- those blacklisted with the surgeon, in a labelled group;
- those whose Slot already holds a List, which cannot be picked until the office resolves it.

An unavailable Slot or a blacklisted pairing shows a **soft warning** and can still go ahead. The
assignment is audited, and the Draft List becomes a List in that Slot, keeping its hospital,
surgeon, note and history.

The phase also **enforces the pairing rule everywhere** (US-01.3.1, Confirmed): an assigned List
has exactly one surgeon and one hospital.

- The seeded Fitzgerald Tue 21 PM "Surgeon TBC" List becomes a Draft List.
- The pre-op clinic Lists at AA's rooms get a real **location record** (AA rooms) in place of a
  missing hospital.
- Every public List (acute theatre and the public "Elective ortho" templates) and every pre-op
  List names a surgeon.
- `List.hospitalId` and `List.surgeonId` become required, so the compiler finds every path that
  could break the rule.

Last, the Day dashboard shows each List block's **booking count** (US-13.1.1).

## Before you start: drift check

1. Diff the covered and read-alongside items against the plan's snapshot:

   ```
   git diff 1f067a8 -- "docs/discovery-reference/Updated Requirements/catalogue/requirements/FT-01.6.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-01.6.1.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-01.6.2.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-01.6.3.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-13.1.1.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-01.3.1.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/FT-01.3.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/EP-01.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-01.3.5.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-01.3.3.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-01.4.2.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-01.5.2.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-02.1.2.md" "docs/discovery-reference/Updated Requirements/catalogue/questions/OQ-44.md" "docs/discovery-reference/Updated Requirements/catalogue/questions/OQ-43.md" "docs/discovery-reference/Updated Requirements/domain-model.md"
   ```

   Also run the whole-catalogue diff from ROADMAP.md "When the catalogue changes" and scan it for new
   items that name Draft List, pairing, day dashboard, booking count, AA rooms, pre-op or acute Lists.
   (At plan time, 2026-10-01, the catalogue had no diff against `1f067a8`.)
2. If an item changed, re-read it and adjust the work items. Things to look for:
   - **FT-01.6 and US-01.6.1 to 01.6.3** (all Proposed): if they are now Retired or Future, drop the
     Draft List entity, views and triggers (work items 2 to 8, 13 to 17 and 20), keep the pairing rule and the
     booking count, and decide with the owner what the Fitzgerald TBC List becomes instead. Record
     it in PROGRESS.md.
   - **US-01.6.3**: if assigning a Draft List may now pick any Slot (not the one its day and session
     fix), or an occupied Slot may be taken over, change `assignDraftList` and the picker to match.
   - **US-01.3.1 / FT-01.3**: if the pairing rule gains exceptions (for example "a pre-op clinic has
     no surgeon" or "acute theatre names the service, not a surgeon"), implement the exception in
     the one pure `pairingIssues` helper (work item 3) and drop the matching seed change in work item 4.
     FT-01.3 is **Verify**: if its text now differs from US-01.3.1, follow the Confirmed story.
   - **US-13.1.1**: if the dashboard gains other per-block figures, add them in work item 18.
   - **domain-model.md** "Slot, List and Draft List": if a Draft List now sits in a Slot, or holds
     Bookings, stop and re-plan work items 2 and 8 before building.
   - Any covered item now Retired or Future leaves the covers; record that in the PROGRESS entry.
3. **Open questions** (the ROADMAP "Confirm before building" row for 31: FT-01.3 Verify, OQ-44):
   - **OQ-44** (what a Draft List holds, Bookings on it, cancellation, offering it to anaesthetists) is
     Open at `1f067a8`. If still open, build this safe interim and label it provisional in the UI
     ("Provisional: AA to confirm what a Draft List holds (OQ-44)" under the Draft Lists view title):
     - **hospital, day and session required; surgeon optional** until assignment, shown as
       "Surgeon to confirm". The OQ-44 recommendation makes the surgeon required. The seeded St
       George's request (the old Fitzgerald TBC List) is exactly the "surgeon not yet known" case
       OQ-44 asks about, so the interim keeps it creatable. Both are required to assign (US-01.3.1);
     - **no Bookings on a Draft List** (the recommendation allows them; the minimal, reversible choice
       is none, per the gap analysis). A Booking can be added only once the List is assigned;
     - **office only**: the Draft List is never shown to anaesthetists and is never offered to them;
     - **closed by an admin with a reason** when the request is cancelled or never filled (the OQ-44
       recommendation). A closed Draft List stays in the view's history.
     If OQ-44 is answered, follow the answer: "surgeon always known" makes the surgeon required on
     create (and the seeded St George's request gets a surgeon); "Bookings may be added before
     assignment" is a separate, larger change: raise it with the owner, do not build it here.
   - **OQ-43** (what an anaesthetist sees of the blacklist) stays Admin only, as Phase 17 left it. The
     PWA stand-in in work item 20 skips blacklisted pairings silently and never names the blacklist.
   - **Pre-op and acute pairings (no OQ exists).** The catalogue has no exception for the pre-op
     clinic at AA's rooms (no hospital, no surgeon) or for public acute theatre (no named surgeon).
     The default reading, labelled provisional in the Decisions log, has two parts:
     - AA rooms is a location record in the hospitals master;
     - a pre-op clinic names the surgeon whose patients it assesses, and an acute List names the
       on-call surgeon.
     Tell the owner at the start of the session and suggest they raise it with AA. Do not edit the
     catalogue.
   - **Emergency-only Slots** (Phase 29's handoff). The default: offer them in their own labelled
     group "Available for emergency" with a soft warning and no conflict. Confirm with the owner if
     they are present.
4. **Check the neighbours:**
   - Phases 17, 28, 29 and 30 are DONE. Confirm the names in their PROGRESS entries, because this doc
     uses the planned names and the build may have renamed them:
     - 17: `blacklistWarning`, `partitionAnaesthetistsForSurgeon`, `SurgeonSelect`,
       `BlacklistWarning`;
     - 28: `placeListOnSlot`, `assignListToSlot`, `slotFor`, `listInSlot`, `slotViewsForDate`,
       `effectiveSlotTimes`, `approvalStateLabel`, the Assign List sheet;
     - 29: `SlotStatus`, `statusFor`, `isOpenForBooking`, `isEmergencyOnly`, `isClosed`, the
       booking-scope statuses;
     - 30: the conflict-raising helper for a List placed on a closed Slot, the conflict dashboard
       route, and how the List colour change is drawn.
     If 30 has not run, the assign sheet refuses closed Slots the way Phase 28's `assignListToSlot`
     does (interim), and says so.
   - Phase 20's default-Contract resolver: `defaultContractForBooking(contracts, ctx)` in
     `domain/billing/contractSelection.ts` (planned name), whose "no hospital (an AA-rooms List)"
     branch returns `CT-RVG-POSTPAID`, and the Contract picker's "Default for AA rooms" heading.
     Work item 9 re-points both to the AA rooms location.
   - Phase 30's conflict engine: `domain/conflicts.ts` (`expectedConflicts`, which already allows a
     `holiday` conflict for a List with no Slot, planned with Draft Lists in mind) and
     `store/conflictReconcile.ts` (reconciliation runs **inside `mutate()`**, so a List created on a
     closed Slot or at a closed hospital is flagged with no explicit call). Read 30's handoff note
     for 31 on Draft Lists at a closed hospital.
   - Phase 28's PWA stand-in `assignNextFreeSlotAsSimulatedOffice` ("Office assigns a List to my
     next free Slot", Mobile · Lists). It stays; work item 20's entry sits beside it and reuses its
     Slot scan.
   - Note the current `PERSIST_VERSION` (13 at plan time; phases 15 to 30 raise it).
5. Record the drift-check result in the PROGRESS entry.

## Reference

**Design files (convention 17).** No mockup shows a Draft List, so extend the existing patterns
rather than invent a look:

- `docs/design/Design Language.dc.html`:
  - the six status colours are **not** used for a Draft List, because it has no status of its own;
  - use the **warning tint and on-tint** for the "Being prepared" flag and the long-wait emphasis;
  - use the status-as-pill pattern, the micro caps label style, and Spline Sans Mono with
    tabular-nums for the waiting time and the booking count;
  - radii `ctl 10` and `card 14`, the sheet motion, and the scrim;
  - teal `#0D6E63` for New Draft List, Assign, Save and Close; crimson never;
  - the amber nav badge tone the Billing monitor already uses (not the crimson Review badge).
- `docs/design/Admin Day.dc.html`:
  - the grid block anatomy (left status bar, two text lines, corner flags);
  - the right-hand drawer (header, sections, action row), the header summary line and the dark side
    nav with its badges.
  The Draft Lists band is a row above the anaesthetist rows that uses the same ruler. Its blocks are
  white with a lineStrong border, a warning-solid left bar and a micro caps "BEING PREPARED" line,
  so they look different from every status tint and never from colour alone. Note the design shows
  Fitzgerald PM as "St George's, surgeon TBC" with an amber flag. The catalogue rule wins
  (US-01.3.1): that request now draws in the band, not on her row.
- `docs/design/Admin Review.dc.html`: the table and row rhythm the Draft Lists view follows (with
  `apps/admin/tableChrome.ts`).
- `docs/design/Mobile App.dc.html`: only for the PWA stand-in's message and the new booked row, which
  are Phase 14 and 28 patterns.

**Catalogue items:** the covered files above. The rules this phase must not break: US-01.3.5 (the
blacklist warns and never blocks; separated, labelled groups), US-01.5.2 (conflicts warn, never
block), US-13.5.2 (every change audited), and the approval state DRAFT, which "belongs to assigned
Lists and is unrelated to a Draft List" (domain-model.md).

**Analysis files:**

- `docs/prototype-build/catch-up/gaps.json`: items `FT-01.6`, `US-01.6.1`, `US-01.6.2`, `US-01.6.3`,
  `US-13.1.1`, `US-01.3.1`, `FT-01.3`, `EP-01` (its `observations` note on the epic), and
  `dataModelDeltas` DM-03 and DM-02.
- `docs/prototype-build/catch-up/epics/EP-01.md`: the header note (the DRAFT collision, the S2 impact
  list) and the sections for the items above; `epics/EP-13.md` for US-13.1.1.
- `docs/prototype-build/catch-up/GAP-ANALYSIS.md`: theme 4 (Slot, List and Draft List), the DM-03 row,
  "Demo impact" S2, "Demo-trigger buttons" (Schedule cluster) and "Uncertainty" (OQ-44).
- `docs/prototype-build/catch-up/analysis/domain-model-delta.md` (DM-02, DM-03, DM-26).
- `docs/prototype-build/catch-up/analysis/prototype-map-admin.md` (sections 1 to 4: routes and nav,
  shell derivations, Day view, the List flows), `prototype-map-store-seed.md` (sections 2, 3, 6, 7,
  8), `prototype-map-apps-mobile-web.md` (the "AA rooms" fallbacks in Forward Lists, List detail,
  week strip and availability grid) and `prototype-map-shell-demo-pwa.md` (section 7, the PWA, and
  section 9, extension points).
- The phase docs for 17, 28, 29 and 30 (their handoff notes for 31), and 32 (it refuses a Draft List
  id in its swap action).
- `requirements-board/capture/ATLAS.md` (line ~304 describes "Fitzgerald PM is at St George's with
  the surgeon TBC") and the US-01.3.1 and US-13.1.1 recipes.

**Code entry points** (paths under `aa-prototype/src/`; names are as planned by 14, 15, 17 and 28 to
30, so check the PROGRESS name maps first):

- **Model:** `domain/types.ts`: `List` (`hospitalId?`, `surgeonId?`, `notes?`), `Hospital` (L~155),
  `Surgeon`, `PermanentList` (`hospitalId: HospitalId | null`, `surgeonId`), the Slot types from 28,
  `SlotStatus` from 29; `domain/index.ts` exports.
- **Seed:** `domain/seed/cast.ts` (`HOSP`, `HOSPITALS`, `SURG`, the `listStatuses` or
  `slotStatuses` description "Pre-op assessment clinic at AA rooms." L~145),
  `domain/seed/permanentLists.ts` (`PREOP_NOTE`, `ACUTE_NOTE`, the `pl(...)` rows with `null`
  hospital or surgeon), `domain/seed/canvas.ts` (the RNG `public` branch that sets `HOSP.cph` and
  no surgeon; `GENERAL_SURGEONS`, `CES_SURGEONS`; `slotRng` from `slotHash.ts`),
  `domain/seed/index.ts` (the Fitzgerald Tue 21 PM fixup L~214, `SEED_MARKERS`, the masters and
  schedule assembly), `domain/seed/dayNotes.ts` (L~34, "Fitzgerald PM surgeon unconfirmed ..."),
  `domain/seed/history.ts` (the `L-HIST-*` backdrop Lists, some with no `hospitalId`),
  `domain/seed/contracts.ts` (Doyle holds a surgeon Contract), Phase 17's surgeon, room and
  blacklist seed, `domain/seed/seed.test.ts`, Phase 28's `domain/seed/__fixtures__/canvas-golden.json`.
- **Store:** `store/appStore.ts` (`PERSIST_VERSION`, `AppState.schedule`), `store/mutate.ts`
  (`ID_FORMATS`, `resetDomainState`, multi-meta `mutate`), `store/slotActions.ts` (28:
  `placeListOnSlot`, `assignListToSlot`), `store/lifecycle.ts` (`editList` and `ListPatch`,
  `editRefusal`), `store/mastersActions.ts` (`addPermanentList`, `editPermanentList`, hospital
  actions), `store/integrationActions.ts` (S12 and S13 targets, `ingestPdfRow`),
  `store/bookingActions.ts` (`addPostOpAddendum`), `store/selectors.ts` (`entityCounts`,
  `slotViewsForDate`, `bookingsForList`), `store/officeStandIn.ts` (14 and 28: `authoriseAsSimulatedOffice`,
  `assignNextFreeSlotAsSimulatedOffice`), `store/demoActors.ts` (14: `OFFICE_ACTOR`,
  `OFFICE_SIMULATION_ACTOR`), Phase 30's `store/conflictReconcile.ts` and `domain/conflicts.ts`,
  Phase 20's `domain/billing/contractSelection.ts` (`defaultContractForBooking`, with its test),
  `store/index.ts`.
- **Admin:** `router.tsx` (admin routes L~89), `apps/admin/routes.tsx`, `apps/admin/AdminApp.tsx`
  (section derivation L~28, `dayLists`, `activeCardCounts`, the header `summary` L~148, the review
  rows' "Unassigned" L~174), `apps/admin/outlet.ts`, `components/SideNav.tsx` (`NavSection`, the
  badge props and `badgeTone`), `components/DayGrid.tsx` (`GridBlock` L~250: the "Surgeon TBC"
  subtitle L~300, the flags, the footer counts), `components/DayGrid.test.tsx` (five "Surgeon TBC"
  assertions), `components/DayNav.tsx`, `components/RightRail.tsx`, Phase 28's `SlotDrawer.tsx`,
  `util.ts` (`attentionReasons` "Surgeon not yet assigned" L~111, the "Unassigned" labels L~66 and
  L~81), `flows/AssignListSheet.tsx` (28), `flows/EditListSheet.tsx` ("None (AA rooms / unassigned)"
  L~79), `flows/PhoneAdviceBooking.tsx`, `flows/PermanentListSheet.tsx` ("None (AA rooms)" L~113),
  `flows/ReassignListFlow.tsx`, `flows/MoveBookingFlow.tsx`, `screens/ReviewQueue.tsx` (the table
  pattern), `screens/MasterData.tsx` or 17's `screens/masters/` (Hospitals, Permanent lists),
  `screens/IntegrationMonitorScreen.tsx` (L~291), `screens/BillingMonitorScreen.tsx` (L~161),
  `tableChrome.ts`.
- **Mobile and web readers of the "AA rooms" fallback:** `apps/mobile/screens/ForwardListsScreen.tsx`
  (L~130, L~145), `ListDetailScreen.tsx` (L~91), `BookingDetailScreen.tsx`, `AvailabilityScreen.tsx`
  (L~77); `apps/web/screens/ListsScreen.tsx` (L~53), `ListDetailView.tsx` (L~94),
  `BookingDetailView.tsx`, `AvailabilityGrid.tsx` (L~82), `components/WeekStrip.tsx` (L~48);
  `apps/admin/screens/ReviewScreen.tsx` (L~104), `AdminBookingDetail.tsx` (L~43).
- **Shared:** `shared/format.ts` (name helpers, `slotTimeRange`, `approvalStateLabel`),
  `shared/schedule/` (17's `SurgeonSelect`, `BlacklistWarning`), `shared/audit/actionLabels.ts`,
  `shared/audit/fieldLabels.ts`, `shared/audit/auditNarrative.ts`, `shared/demoTriggers/registry.ts`
  and `context.ts` (14), `shared/DemoBadge.tsx`.
- **Demo and PWA:** `apps/demo/DemoControlPanel.tsx` (`SCENARIOS` S2 text; the trigger index is
  generated from the registry), `apps/demo/DemoData.tsx` (entity counts), `pwa/PwaDemoActions.tsx`
  (14), `pwa/pwaPurity.test.ts`; outside `src/`: `aa-prototype/visual/admin-phase06.spec.ts`,
  `aa-prototype/visual/pwa-device.spec.ts`.

## Work items

### Session 1: the model, the pairing rule, the seed and the store

1. **Baseline.** Run `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots`, and
   record the counts. Keep `visual/shots/` as the before set.

2. **Types** (`domain/types.ts`). DM-03, US-01.3.1.
   - `DraftListId = string`. `DraftListSource = 'phone' | 'email' | 'pdf' | 'hospitalRow' | 'other'`.
     `hospitalRow` is reserved for Phase 33's matching screen; nothing in this phase creates one.
   - `DraftListStatus = 'preparing' | 'assigned' | 'closed'`. **Do not use the word "draft" or
     "open" as a status value**: the List's approval state `DRAFT` already reads "Open" through
     Phase 28's `approvalStateLabel`, and the domain model says the two are unrelated.
   - The Draft List record:

     ```ts
     interface DraftList {
       id: DraftListId
       hospitalId: HospitalId          // required (OQ-44 interim)
       surgeonId?: SurgeonId           // optional until assignment (OQ-44 interim)
       dateISO: IsoDate
       session: Session
       note?: string
       source: DraftListSource
       createdAtISO: IsoDateTime       // from the demo clock; drives "time waiting"
       createdBy: string               // actor.who
       status: DraftListStatus
       assignedListId?: ListId         // set on assignment
       assignedAtISO?: IsoDateTime
       assignedBy?: string
       closedAtISO?: IsoDateTime
       closedBy?: string
       closeReason?: string
     }
     ```

     Its doc comment states the three rules: no anaesthetist, no Slot, no Bookings (OQ-44).
   - `List` gains `draftListId?: DraftListId`, the provenance of a List made from a Draft List.
   - **`List.hospitalId: HospitalId` and `List.surgeonId: SurgeonId` become required** (US-01.3.1
     "exactly one surgeon and exactly one hospital"). `ListPatch` can still change them, but cannot
     clear them.
   - `PermanentList.hospitalId` and `surgeonId` become non-null. A template projects Lists, so it
     must satisfy the rule too.
   - `Hospital` gains `locationType: 'hospital' | 'aaRooms'`. Its doc comment: a List's location is a
     hospital or AA's own rooms. The pre-op clinic is held at AA rooms, which is a location, not a
     hospital, and is never a Contract holder, a hospital feed or a sync target.
   Let the compiler list every reader that relied on the optional fields; work item 12 fixes them.

3. **Pure rules** (`domain/pairing.ts` and `domain/draftLists.ts`, no React, exported from
   `domain/index.ts`), with `domain/pairing.test.ts` and `domain/draftLists.test.ts`:
   - `pairingIssues({ hospitalId, surgeonId }, masters)` returns plain-language issues:
     - "Choose the hospital." when the hospital is missing;
     - "Choose the surgeon." when the surgeon is missing;
     - "That hospital is not in the master data." and "That surgeon is not in the master data." for
       unknown ids.
     It returns an empty array when the pairing is complete. This is the **one** implementation of
     US-01.3.1. Every store path in work items 8 and 9 calls it, and nothing checks the pairing
     inline.
   - `isPreparing(draft)`; `waitingMinutes(draft, nowISO)` returns whole minutes from `createdAtISO`
     to `nowISO`, or to `assignedAtISO` or `closedAtISO` once it is no longer preparing (so a
     finished Draft List shows how long it waited, and that figure never grows). Parse ISO strings
     with date-fns; never `new Date()`.
   - `draftListCandidates({ draft, anaesthetists, slotViews, statuses, blacklist, surgeonId })`
     returns groups for the picker, each sorted in roster order:
     - `free`: the Slot for the draft's day and session is empty and `isOpenForBooking`;
     - `emergency`: empty and `isEmergencyOnly`;
     - `notAvailable`: empty and `isClosed` (unavailable, on leave);
     - `blacklisted`: any of the three above whose pairing with `surgeonId` is actively
       blacklisted (through 17's `partitionAnaesthetistsForSurgeon`). They move to this group and
       keep their availability label;
     - `occupied`: the Slot already holds a List, with that List's id.
     Only active anaesthetists are included. With no surgeon yet there is no `blacklisted` split
     (the picker re-partitions once a surgeon is chosen).
   - `draftListHospitalClosed(draft, holidaysByDateHospital)` (Phase 30's handoff: Draft Lists at
     a closed hospital). A Draft List is not a List, so it carries no `conflicts` and never appears
     on Phase 30's Conflicts screen. This derived flag instead drives a warning pill, "Hospital
     closed that day", on its row, drawer and band block and in the assign sheet. It is a soft
     warning: creating and assigning still go ahead, and on assignment 30's reconcile raises the
     `holiday` conflict on the new List.
   - Tests:
     - `pairingIssues` covers every case;
     - waiting minutes before and after assignment and close;
     - the candidate groups are exhaustive with nobody lost or duplicated, in stable roster order;
     - a blacklisted anaesthetist on an unavailable Slot lands in `blacklisted` with the
       "Unavailable" label;
     - an occupied Slot is never in a selectable group;
     - `draftListHospitalClosed` is true only for a holiday at the draft's hospital on its date;
     - no message contains an en or em dash.
   - `shared/format.ts` gains `waitingLabel(minutes)`:
     - under an hour: "45 min";
     - under a day: "16 h", whole hours;
     - otherwise: "3 d 22 h", dropping "0 h".
     Also add `locationName(hospitalId, masters)`, which returns the record's name ("AA rooms" for
     the location), and `pairingLine(list, masters)` ("Forte Health · Mr C. Okafor"). Test all
     three in `format.test.ts`.

4. **Location record and a complete pairing on every seeded List** (US-01.3.1, FT-01.3). This is
   deliberate seed content change.
   - `cast.ts`: `HOSP.aaRooms = 'H-AAROOMS'` and a `HOSPITALS` row
     `{ id: 'H-AAROOMS', name: 'AA rooms', locationType: 'aaRooms', contactEmail: 'rooms@aa.example' }`
     (fictional `.example` address, as Phase 17 did). Every other hospital gets
     `locationType: 'hospital'`.
   - `permanentLists.ts`:
     - each pre-op template takes `HOSP.aaRooms`;
     - every template with a `null` surgeon names one. At `1f067a8` that is 16 rows: 4 pre-op, 8
       public "Acute theatre" and Dr Ropata's 4 public "Elective ortho" rows (no safe surgeon is
       orthopaedic, since Mr T. Hale is excluded below; pick one and record it). Pick existing
       surgeons that sit outside
       every Contract's surgeon or surgeon-group scope (not Mr T. Hale, in the COS group; not Mr P.
       Doyle, a surgeon Contract holder) and outside the active blacklist (not Mr C. Okafor with Dr
       Sharma): Ms K. Patel, Mr S. Tan, Mr V. Nand or Ms H. Cameron.
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
     - regenerate Phase 28's golden fixture, and diff old against new with a small script. The
       only differences are: pre-op Lists gain the AA rooms hospital and a surgeon; public (acute and
       elective) Lists gain a surgeon; Fitzgerald Tue 21 PM becomes an empty Slot (work item 5);
     - every Booking id, List id and placement is unchanged;
     - the existing fee and billing tests (`seedBilling.test.ts`, the Phase 18 to 25 fee parity and
       lock tests, `demoScenarios.test.ts`) pass with **no amount moving**. If a Contract resolution
       changes, the surgeon pick was wrong: choose another.

5. **The Fitzgerald TBC List becomes a Draft List, and the seed gets its Draft Lists** (US-01.6.1,
   US-01.6.2).
   - `seed/index.ts`: delete the Fitzgerald Tue 21 PM `placeList` fixup (Phase 28's successor to
     `patchSlot`), so that Slot is empty and available (`clearSlot`, no note).
   - A new `domain/seed/draftLists.ts` exports `DRAFT_LIST_IDS` and `SEED_DRAFT_LISTS`, all
     `status: 'preparing'`, `createdBy: 'Kirsty W.'`, with fixed ISO timestamps (never the clock):

     | id | Hospital | Surgeon | Day, session | Source | Created | Waiting at 08:00 | Note |
     |---|---|---|---|---|---|---|---|
     | `DL-001` | St George's | none ("Surgeon to confirm") | Tue 21 Jul PM | phone | 2026-07-20 15:40 | 16 h | "Surgeon TBC, chasing St George's booking office" |
     | `DL-002` | Southern Cross | Ms K. Patel | Wed 22 Jul PM | email | 2026-07-21 07:20 | 40 min | "Emailed by Ms Patel's secretary" |
     | `DL-003` | Christchurch Eye Surgery | Ms A. Reid | Mon 27 Jul AM | pdf | 2026-07-17 09:50 | 3 d 22 h | "PDF from the rooms, cataract list" |

     `DL-002` must fit Dr Souter's pinned free Wed 22 PM Slot (the PWA stand-in's first pick);
     `DL-003` is the long-wait example. If Phase 28's or 30's seed changed which Slots are free, pick
     days and sessions that keep these properties and record them.
   - `dayNotes.ts`: the Fitzgerald note becomes "St George's PM request, surgeon unconfirmed, chasing
     their booking office (Draft List)."
   - `SEED_MARKERS` gains the three Draft Lists, so `/demo/data` can find them.
   - Seed tests (`seed.test.ts`):
     - every Draft List's hospital and surgeon resolve;
     - no Draft List changes a Slot: the Slots and Lists are identical with or without
       `SEED_DRAFT_LISTS`;
     - Fitzgerald Tue 21 PM is an empty, open Slot;
     - `DL-002` fits Souter's open Slot;
     - **every** List, backdrop included, has a hospital and a surgeon that resolve (the pairing
       invariant);
     - the S2 blacklist beat is reachable: the canned Okafor request in work item 20 falls on a day
       where Dr Sharma's Slot is open, so Sharma appears in the blacklisted group;
     - two builds deep-equal.

6. **Store core** (`appStore.ts`, `mutate.ts`):
   - add `schedule.draftLists: Record<DraftListId, DraftList>`, restored by `resetDomainState`;
   - `ID_FORMATS` gains `draftList: { prefix: 'DLN', pad: 3 }`, a runtime prefix distinct from the
     seed's `DL-`, the same rule as Phases 07 and 17;
   - **bump `PERSIST_VERSION` by one**, with the comment line "Phase 31: Draft Lists; every List
     carries a hospital and a surgeon; AA rooms is a location", and extend `persistMigrate.test.ts`
     (an older payload reseeds rather than loading Lists without a hospital or surgeon);
   - `entityCounts` gains `draftLists`.

7. **Selectors** (`store/selectors.ts`), memoised on the `schedule.draftLists` record reference as
   the file's header requires:
   - `preparingDraftLists(state)`, oldest first by `createdAtISO` (US-01.6.2 "nothing waits
     unnoticed");
   - `draftListsForDate(state, dateISO)` (preparing only; US-13.1.1);
   - `preparingDraftListCount(state)` (the nav badge);
   - `finishedDraftLists(state)` (assigned and closed, newest first, for the view's history tab);
   - `draftListCandidatesFor(state, draftListId, surgeonId?)`, which feeds work item 3's pure function
     from the Slot views, statuses, anaesthetists and blacklist.

8. **Draft List actions** (a new `store/draftListActions.ts`, exported from `store/index.ts`). Every
   write goes through `mutate()` with before and after, timestamps from the clock, office only
   (`officeOnly`) and refused for the integration actor.
   - **`createDraftList(api, actor, { hospitalId, surgeonId?, dateISO, session, note?, source })`**
     (US-01.6.1). It refuses:
     - `hospitalRequired`, and `hospitalNotFound` or `surgeonNotFound` for unknown ids;
     - `invalidSession`;
     - `datePassed`, for a day before today;
     - `outsideCanvas`, for a day beyond the four-month horizon ("That day is beyond the four-month
       schedule.").
     It allocates `DLN###`, stamps `createdAtISO` and `createdBy`, sets `status: 'preparing'`, audits
     `draftList.create` and returns `{ draftListId }`. **It never touches `schedule.slots` or
     `schedule.lists`** (AC "Takes no Slot"), and it needs no anaesthetist (AC "No anaesthetist
     needed").
   - **`editDraftList(api, actor, id, patch)`**: hospital, surgeon (clearable, since it is optional),
     day, session and note, with the same refusals, plus `notPreparing` once it is assigned or
     closed. Audits `draftList.update` with only the changed keys.
   - **`assignDraftList(api, actor, id, { anaesthetistId, hospitalId?, surgeonId?, kind, notes? })`**
     (US-01.6.3). Hospital and surgeon default to the draft's, and the sheet may set or change
     them, which is how "Surgeon to confirm" is resolved at the moment of assignment. The Slot is
     `slotFor(anaesthetistId, draft.dateISO, draft.session)`. It refuses:
     - `notFound`, `notPreparing` and `anaesthetistNotFound`, or `anaesthetistInactive`;
     - `datePassed` ("This Draft List's day has passed. Change its day or close it.");
     - `pairingIncomplete`, carrying `pairingIssues`' messages (AC "Becomes a List ... exactly one
       surgeon and one hospital");
     - `slotOccupied` ("Dr X already has a List in that Slot. Resolve it first.") (AC "Slot must be
       free");
     - `invalidKind`, for a kind that is not an active booking-scope status.
     It **never refuses** an unavailable, on-leave or emergency-only Slot, or a blacklisted pairing.
     Those are soft warnings (US-01.6.3, US-01.3.5, US-01.5.2). On success, in **one** `mutate()`
     commit with these metas:
     - `draftList.assign`: before `{ status: 'preparing' }`, after `{ status: 'assigned',
       assignedListId, anaesthetistId, slotId }`;
     - `list.create`: through Phase 28's internal `placeListOnSlot`, imported from `slotActions.ts`
       directly, not from the package index. The List's `draftListId` is set and its `notes` default
       to the draft's note;
     - `list.blacklistAcknowledged`, when `blacklistWarning` returns an entry (17's rule);
     - on a closed Slot, Phase 30's availability conflict on the new List, and at a hospital with a
       holiday that day, 30's `holiday` conflict. Both come from 30's reconcile inside `mutate()`
       (it appends its own meta), not from code in this action, so the List's colour change and the
       conflict dashboard pick them up. An emergency-only Slot writes no conflict.
     The Draft List keeps its record, with `status: 'assigned'`, `assignedListId`, `assignedAtISO`
     and `assignedBy`. It leaves every "preparing" view and stops being flagged (AC "stops being
     flagged"). Returns `{ listId, warnings: string[] }`.
   - **`closeDraftList(api, actor, id, reason)`**: requires a non-empty reason (`reasonRequired`)
     and refuses `notPreparing`. Audits `draftList.close`. Provisional, following the OQ-44
     recommendation.
   - Nothing in this file writes a Booking.

9. **The pairing rule on every other path** (US-01.3.1 "The Scheduling Engine enforces"). Each goes
   through `pairingIssues`:
   - `editList`: a patch that clears or blanks `hospitalId` or `surgeonId` refuses
     `pairingRequired` ("A List needs a hospital and a surgeon."). Changing either to another valid
     id is allowed, as today, including 17's blacklist acknowledgement.
   - `assignListToSlot` (28) keeps its `hospitalRequired` and `surgeonRequired` refusals. Re-implement
     them through `pairingIssues`, so there is one rule.
   - `addPermanentList` and `editPermanentList` refuse a template without both (`pairingRequired`).
     Phase 30's canvas repopulation projects only complete templates, which this guarantees.
   - The generator and `rollCanvasForward`: a template or RNG placement always carries both (work
     item 4). Add a dev assertion in `placeList` and `placeListOnSlot` that throws in tests if
     either is missing. It is a programming error, not a user refusal.
   - `integrationActions.ts` (S12, S13, `ingestPdfRow`, interim until Phase 33): a hospital message
     or PDF row that would create or retarget a List without a resolvable hospital and surgeon
     **parks** for the office (Phase 28's parking seam, `pairingIncomplete`, "The message has no
     surgeon for this List. Parked for the office."). It never writes a partial List. Check that S1's
     canned messages still apply exactly as before, and prove it in `demoScenarios.test.ts`.
   - `addPostOpAddendum` (28's interim) copies the original List's hospital and surgeon, so it
     already complies. Assert it in `postOpAddendum.test.ts`.
   - **Phase 20's default Contract.** In `defaultContractForBooking`
     (`domain/billing/contractSelection.ts`), the "no hospital" branch becomes a location branch:
     `ContractSelectionContext` gains `locationType` (filled from the hospital record by the store
     caller), and an `aaRooms` location has no hospital default Contract, so it gets RVG Default
     Post-paid. Keep it pure; update `contractSelection.test.ts` (AA rooms reaches
     `CT-RVG-POSTPAID`; no test passes an undefined hospital any more). The Contract picker's
     "Default for AA rooms" heading now reads through `locationName`. The pre-op Bookings'
     Contracts and invoice amounts must not change (the fee parity tests from work item 4).
   - Phase 18's Contract-holder pickers, Phase 17's hospital contact list, the integration feeds and
     hospital holidays: AA rooms is not offered as a Contract holder or a feed. It may take a holiday
     like any location.

10. **Audit reading layer** (`shared/audit/actionLabels.ts`, `fieldLabels.ts`,
    `auditNarrative.ts`):
    - action labels: `draftList.create` "Draft List created", `draftList.update` "Draft List
      updated", `draftList.assign` "Draft List assigned to a Slot", `draftList.close` "Draft List
      closed";
    - field labels: `source`, `closeReason`, `draftListId`, `assignedListId`, `locationType`;
    - the narrative renders hospital, surgeon and anaesthetist ids as names, as it already does for
      Lists;
    - `auditNarrative.test.ts` must pass.

11. **Store tests** (`store/draftListActions.test.ts`, plus updates to `lifecycle.test.ts`,
    `slotActions.test.ts`, `mastersActions.test.ts`, `integrationActions.test.ts` and
    `demoScenarios.test.ts`):
    - `createDraftList`:
      - every refusal;
      - success with and without a surgeon;
      - `schedule.slots` and `schedule.lists` deep-equal before and after (AC "Takes no Slot").
    - `assignDraftList` success:
      - exactly one new `LG` List, in the right Slot, with the chosen or inherited hospital and
        surgeon, the draft's note and `draftListId`;
      - the Slot's display key turns to the kind;
      - the Draft List is `assigned` with `assignedListId`;
      - on a free, non-blacklisted Slot at an open hospital, the metas are exactly
        `draftList.assign` plus `list.create` (AC "Audited"); the soft-warning cases below add only
        17's acknowledgement or 30's reconcile meta.
    - `assignDraftList` refusals: every one, including "Surgeon to confirm" with no surgeon given,
      an occupied Slot, and a passed day.
    - Soft warnings:
      - onto an unavailable Slot, it assigns **and** raises a conflict through Phase 30's path;
      - onto an emergency Slot, it assigns with no conflict;
      - with a blacklisted pairing (Sharma with Okafor), it assigns and writes one
        `list.blacklistAcknowledged`. None of the three refuses.
    - `closeDraftList`: needs a reason, and a closed Draft List cannot be assigned.
    - Pairing:
      - `editList` clearing either field refuses;
      - template actions refuse incomplete templates;
      - a surgeon-less integration message parks;
      - a store-wide invariant after a sweep of actions (create, assign, reassign, roll forward,
        addendum, the stand-ins): every List has a resolvable hospital and surgeon.
    - The Fitzgerald test at `lifecycle.test.ts:~455` ("conflict-flags an empty-but-reserved list",
      which relies on her TBC List; Phase 30 may have moved it) is retargeted to another seeded List
      with no Bookings, since her Tue 21 PM Slot is now empty. The case it proves still holds.
    - A Draft List at a hospital with a holiday: `createDraftList` succeeds, the draft reads
      `hospitalClosed`, and assigning it gives the new List a `holiday` conflict.

12. **Re-point the readers the required fields broke** (no new UI yet):
    - Replace every "AA rooms", "Unassigned", "Not assigned" and "Surgeon TBC" fallback with
      `locationName` and the surgeon's name. The locations are listed in Reference (Admin `util.ts`,
      `AdminApp.tsx`, the drawer, the review screen, the monitors, Move Booking, and the mobile and
      web readers, plus `MasterData.tsx`'s Permanent lists table, L~261, or its Phase 17 successor).
    - Pre-op rows and blocks keep the design's first line, "Pre-op clinic", with "AA rooms" coming
      from the location record.
    - In `DayGrid.tsx`'s `GridBlock`:
      - the "Surgeon TBC" subtitle branch goes;
      - public and pre-op blocks keep their template label ("Acute theatre", "Pre-op clinic / AA
        rooms") as the subtitle, and the surgeon moves to the tooltip, to limit visual churn
        against the design;
      - private blocks show the surgeon as today.
    - `attentionReasons` loses "Surgeon not yet assigned".
    - `EditListSheet` and `PermanentListSheet` lose their "None (AA rooms ...)" options: the hospital
      select lists AA rooms like any location, and the surgeon is required with the inline error
      "Choose the surgeon.".
    - The `DayGrid.test.tsx` "Surgeon TBC" assertions become "the Fitzgerald Tue 21 PM block is
      Free" and "no block reads Surgeon TBC".
    - Re-green all four commands. Compare screenshots with the baseline. The expected differences
      are: Fitzgerald Tue 21 PM is Free, acute and pre-op tooltips and drawers name a surgeon, and
      the header summary reads one more free session. **Session 1 ends here, green and demoable.**

### Session 2: the Admin screens, the Day dashboard, the triggers and the docs

13. **Draft Lists in the Admin nav and router** (US-01.6.2 "One visible place").
    - `router.tsx` and `apps/admin/routes.tsx`: `/admin/draft-lists`, with an `AdminDraftListsRoute`
      wrapper. The search param `?open=<draftListId>` opens that Draft List's drawer on arrival, for
      the Day band and the demo guide's direct URLs. `?tab=history` selects the history tab.
    - `SideNav.tsx`:
      - `NavSection` gains `'draftLists'`;
      - add the item **"Draft Lists"** directly below "Day view" (or beside Phase 30's conflict
        dashboard entry, if 30 put one there);
      - its badge is `preparingDraftListCount` in the **amber** `badgeTone: 'warn'` (an attention
        count, like the Billing monitor; crimson stays the Review queue's identity badge).
    - `AdminApp.tsx` derives the section from the path and passes the count.

14. **The Draft Lists view** (`apps/admin/screens/DraftListsScreen.tsx`, the Review queue's table
    pattern and `tableChrome.ts`):
    - **Header:**
      - the title "Draft Lists";
      - the line "Requests waiting for an anaesthetist. Assign each one to a free Slot.";
      - the OQ-44 provisional line;
      - the teal **New Draft List** button (a product action, not a demo trigger).
    - **Tabs:** Being prepared (default, with its count) and History (assigned and closed).
    - **Being prepared table,** oldest first. Columns:
      - Waiting: mono `waitingLabel`; at 24 h or more it takes the warning on-tint with a
        "Waiting over a day" title. This is a display emphasis, not a rule;
      - Day: "Thu 23 Jul";
      - Session;
      - Hospital;
      - Surgeon: or a warning pill "Surgeon to confirm";
      - Note;
      - Source: Phone, Email, PDF, Hospital row;
      - Created: "20 Jul 15:40 · KW";
      - a "Being prepared" pill on every row (AC "Flagged ... wherever it appears").
      A Draft List whose day has passed shows a "Day passed" warning pill, and its Assign button is
      disabled with the reason. The row actions are **Assign** (teal), **Edit** and **Close**. A
      whole-row click opens the drawer.
    - **History table:**
      - the outcome: "Assigned to Dr Chen, Thu 23 Jul PM", with an "Open List" link to the Day
        view drawer (`state.openListId`), or "Closed: <reason>";
      - how long it waited;
      - who did it and when.
    - Empty states: "No Draft Lists are waiting. New requests appear here until they are assigned."
    - The view reads the clock through the store, so advancing the demo clock updates every waiting
      time live (US-01.6.2 "how long it has been waiting").
    - It publishes nothing to the demo-trigger context; the triggers in work item 20 act on the route.

15. **Draft List drawer and sheets** (`components/DraftListDrawer.tsx`; `flows/DraftListSheet.tsx`
    for New and Edit; `flows/CloseDraftListSheet.tsx`; all through `useSurface().Overlay`). The same
    drawer is used on the Draft Lists view and the Day view.
    - **Drawer:** it extends the Slot drawer's anatomy:
      - header: the "Being prepared" pill, the day and session, "Waiting 16 h";
      - a "Request" section: hospital, surgeon or "Surgeon to confirm", note, source, created by and
        at;
      - a one-line reminder: "No anaesthetist yet. This takes no Slot until it is assigned.";
      - actions: **Assign** (teal primary), Edit, Close, and History (`HistorySheet` (`shared/booking/` after Phase 15) with
        `entityIds={[draftListId]}`).
    - **New and Edit sheet:**
      - hospital: required, with AA rooms listed as a location;
      - surgeon: 17's `SurgeonSelect` with no anaesthetist yet, so a plain grouped list, and a
        "Surgeon to confirm" empty option;
      - day: a date input, defaulting to the Day view's date when opened from there, or
        `?date=`;
      - session: an AM/PM segmented control;
      - source: a segmented control, Phone, Email, PDF, Other; Hospital row is not offered, because
        Phase 33 creates those;
      - note.
      Inline errors come from the store refusals. The save copy says "Saving does not change anyone's
      schedule."
    - **Close sheet:** the reason is required. Suggested chips: "Request cancelled by the rooms",
      "Booked elsewhere", "Duplicate request". Free text is allowed.

16. **Assign Draft List sheet** (`flows/AssignDraftListSheet.tsx`), US-01.6.3 and US-01.3.5 "Both
    paths". Two steps, the same shape as Phase 28's Assign List and 17's reassign picker:
    - **Step 1, choose the anaesthetist.** A header gives the draft's day, session, hospital and
      surgeon. The groups come from `draftListCandidatesFor`, and each row shows the anaesthetist's
      name, the Slot's status chip and times:
      - "Free" (selectable);
      - "Available for emergency" (selectable, with an amber note);
      - "Unavailable or on leave" (selectable, with an amber note);
      - "Blacklisted with Mr C. Okafor" (a separately headed, labelled group; rows still selectable,
        with a warning pill);
      - "Already has a List": rows disabled, each reading "Holds <hospital> · <surgeon>. Resolve it
        in the Day view first", with a link that opens that Slot's drawer on the Day view. This
        satisfies "an occupied Slot is not offered without the admin resolving it".
      This grouped half-day view is the availability finder (US-01.4.2) for the Draft List. A
      "Show only free" toggle collapses the other groups.
    - **Step 2, confirm:**
      - hospital (prefilled);
      - surgeon: 17's `SurgeonSelect` for the chosen anaesthetist, prefilled and **required** if the
        draft had none, so "Surgeon to confirm" is resolved here;
      - kind: the active booking-scope statuses, default Private; Pre-op defaults the location to
        AA rooms;
      - note (prefilled).
      The warnings stack above the button, each naming its cause:
      - 17's `BlacklistWarning`;
      - "Dr Hughes is On leave for this session. Assigning flags a conflict on the List.";
      - "Dr Hughes is available for emergency only.";
      - "St George's is closed that day (hospital holiday). Assigning flags a conflict on the List."
        when `draftListHospitalClosed`.
      The button reads "Assign Draft List", or "Assign anyway" while any warning shows.
    - **Success:**
      - a short "Draft List assigned" success moment (the reassign flow's 1050 ms pattern);
      - on the Day view, the drawer switches to the new List in its Slot;
      - on the Draft Lists view, the row leaves Being prepared and the success moment offers
        "Open List".
    - RTL test `AssignDraftListSheet.test.tsx`:
      - the groups render with their headings;
      - an occupied row is disabled;
      - choosing a blacklisted anaesthetist shows the warning and the "Assign anyway" label;
      - a missing surgeon blocks step 2 with "Choose the surgeon.".

17. **Kind and location on Phase 28's Assign List** (`AssignListSheet.tsx`) and phone advice
    (`PhoneAdviceBooking.tsx`). Phase 28 left pre-op "only from Permanent Lists until the pairing
    decision in Phase 31". Now:
    - the kind control offers every active booking-scope status (Private, Public, Pre-op);
    - Pre-op defaults the location to AA rooms;
    - the hospital select lists AA rooms.
    Keep `isScriptedS2Booking` and the S2 prefill unchanged.

18. **The Day dashboard** (US-13.1.1, US-01.6.2 "On the day view"):
    - **Draft Lists band** (`components/DraftListBand.tsx`, rendered by `DayGrid` above the first
      anaesthetist row):
      - it appears only when `draftListsForDate` is non-empty;
      - its row label is "Draft Lists" with the count and a micro caps "BEING PREPARED" line;
      - blocks sit on the same ruler at the session's default times (`effectiveSlotTimes`'
        defaults, since a Draft List has no Slot), stacked in lanes when two share a session;
      - the treatment is the one described in Reference (white, lineStrong border, warning-solid
        left bar, "Being prepared" line, "St George's · Surgeon to confirm", mono "16 h");
      - a click opens `DraftListDrawer`;
      - the band ignores the status and focus filters (it is always shown), and the footer counts
        read "... · 1 Draft List being prepared".
    - **Booking count on every List block:**
      - the count of active (not cancelled) Bookings from the counts `AdminApp` already derives
        (after 28, keyed by List);
      - it is drawn as a small mono tabular-nums pill in the block's bottom-left corner (the flags
        stay top-right and "$" bottom-right);
      - it reads "0" muted when empty;
      - the block tooltip and `aria-label` gain "N bookings".
      Empty Slots show no count.
    - **Header summary** (`AdminApp.tsx` `summary`): it appends "· N Draft Lists" when the day has
      any, for example "14 anaesthetists · 21 sessions · 6 free · 2 submitted · 1 Draft List".
    - The drawer's List header also shows "N bookings".
    - `DayGrid.test.tsx`:
      - the band renders with the flag and the waiting label, and is absent on a day without Draft
        Lists;
      - a block shows its booking count and ignores cancelled Bookings;
      - "Surgeon TBC" never renders.

19. **Mobile and web: nothing new, one check.** A List made from a Draft List appears in the assigned
    anaesthetist's mobile Forward Lists, web Lists and week strip as a normal booked List (Phase 28's
    Slot views), with its location and surgeon. Draft Lists themselves never reach the anaesthetist
    apps or the PWA UI (OQ-44 interim; FT-01.6 names the Admin App only). A grep or selector test
    checks that nothing under `apps/mobile` or `apps/web` imports the Draft List selectors.

20. **Demo triggers** (the table below). Registry entries go in `shared/demoTriggers/registry.ts`,
    with bodies in `src/store` and canned data in `src/domain/seed/draftLists.ts`:
    - `CANNED_DRAFT_LIST_REQUESTS`: three requests whose day is **relative to the demo clock** ("the
      next Thursday after today", and so on) through a pure `nextWeekday(todayISO, weekday)`;
    - `simulateIncomingDraftListRequest(api, requestId)` and `addDraftListForDay(api, dateISO,
      choiceId)` in `store/draftListDemo.ts`, both calling `createDraftList` as
      `OFFICE_SIMULATION_ACTOR` (Phase 14's `store/demoActors.ts`; some plans call it
      `SIMULATED_OFFICE_ACTOR`, use the name the code has);
    - **`assignDraftListAsSimulatedOffice(api, anaesthetistId)`** in `store/officeStandIn.ts`,
      beside 14's and 28's stand-ins. It chooses deterministically:
      1. the **oldest** preparing Draft List (by `createdAtISO`, then id) that has a surgeon, falls
         today or later, lands on an **open** Slot of this anaesthetist, and is not blacklisted with
         them (`blacklistWarning` returns null);
      2. if none fits, it first logs a canned request for the anaesthetist's next open Slot (found
         with the same date-then-session scan as Phase 28's `assignNextFreeSlotAsSimulatedOffice`,
         shared, not copied; a hospital and surgeon from the canned set, skipping blacklisted
         pairings), then assigns it.
      Phase 28's "Office assigns a List to my next free Slot" stays on Mobile · Lists; register
      this entry after it. On a fresh seed both target Souter's Wed 22 PM, so whichever runs second
      takes her next open Slot.
      Both writes are audited. Its message never mentions the blacklist (OQ-43).
    - Vitest (`draftListDemo.test.ts`, `officeStandIn.test.ts`):
      - the canned days follow the clock after "Next day";
      - the duplicate guard works;
      - the stand-in picks `DL-002` on a fresh seed and falls back to logging a request once no
        Draft List fits;
      - it never picks a blacklisted pairing;
      - it refuses with "No free Slot in the next four months" when the anaesthetist has none;
      - after Phase 28's stand-in has taken Wed 22 PM, it falls back cleanly (either order works).
    - `pwaPurity.test.ts` stays green: the entries live in `src/shared`, the bodies in `src/store`.

21. **Playwright and shot hooks:**
    - `data-shot` hooks: `admin-draft-lists`, `admin-draft-list-drawer`,
      `admin-assign-draft-list`, `admin-assign-draft-list-blacklist`, `daygrid-draft-band`,
      `daygrid-block-count`;
    - a new `visual/admin-draft-lists.spec.ts`: open Draft Lists, see three rows oldest first,
      assign `DL-001` to Dr Fitzgerald with Mr S. Tan, see the band empty and her PM block booked on
      Tue 21 Jul;
    - update the specs that asserted the Fitzgerald TBC block;
    - extend `visual/pwa-device.spec.ts`: open the Demo chip on Lists, run "Office assigns a Draft
      List to me", and assert a new booked row on Wed 22 PM.

22. **Capture recipes** (`requirements-board/capture/`): re-point only the captions and selectors
    the change breaks. That is the ATLAS line about "Fitzgerald PM ... surgeon TBC" and the US-01.3.1
    and US-13.1.1 recipes (the drawer shows one hospital and one surgeon; the day view gains the
    band and counts). Add recipe stubs for US-01.6.1 to US-01.6.3 only if the owner asks, and do not
    re-run the captures unless asked.

23. **Docs inside the app and close-out.** In `aa-prototype/README.md`'s folder map, add
    `domain/pairing.ts`, `domain/draftLists.ts`, `store/draftListActions.ts`,
    `store/draftListDemo.ts`, and one paragraph on the Draft List (no anaesthetist, no Slot, no
    Bookings; assigned into the Slot its day and session fix) and the pairing rule (AA rooms is a
    location). Then finish green, run the adversarial review, patch the demo guide and write the
    PROGRESS entry.

## Demo triggers

Creating, editing, assigning and closing a Draft List are product actions in the Admin app. So are
New Draft List and Assign. What cannot be shown through normal use is **a request arriving from
outside** (a surgeon's secretary's email or PDF, a phone call before the presenter is ready) and, on
a handset, **the office doing the assigning**. Waiting time needs no trigger: the existing demo
clock advances it.

| Label | Screen | Surface | Effect |
|---|---|---|---|
| Simulate incoming request | Admin · Draft Lists (`/admin/draft-lists`) | bar | Logs a Draft List as if a surgeon's secretary emailed it, created by `OFFICE_SIMULATION_ACTOR` with the source shown. `choices` (days relative to the clock): **Forte Health · Mr C. Okafor · next Thu PM · email** (default; on the pristine seed this is Thu 23 Jul PM, where Dr Sharma's open Slot lands in the "Blacklisted with Mr C. Okafor" group), Christchurch Eye Surgery · Mr J. Whitford · next Mon AM · PDF, and St George's · surgeon to confirm · next Fri AM · phone. The new row appears at the bottom of Being prepared (the table is oldest first) with "Waiting 0 min". Disabled with "Already waiting on Draft Lists" while the same canned request is still preparing, and with "That day is beyond the four-month schedule" if the clock has run far ahead |
| Add Draft List for this day | Admin · Day view (`/admin/day/:dateISO`) | bar | Creates a Draft List for the URL's day, which appears in the grid's "Draft Lists · being prepared" band at once. `choices`: AM · St George's · Mr S. Tan, and PM · Southern Cross · surgeon to confirm. Disabled with "This day has passed" before today, "Beyond the four-month schedule" past the horizon, and "Already added" if the same one is preparing for that day |
| (existing) +1 hour, Next day, Next morning | Harness bar clock menu; PWA More clock card | bar and PWA | Unchanged. Every waiting time on the Draft Lists view, the band and the drawer moves with the clock (US-01.6.2) |
| Office assigns a Draft List to me | Mobile · Lists (`/mobile/lists`) | PWA only, badged "office stand-in" | Acts as the simulated office for Dr Souter. It assigns the oldest waiting Draft List that fits one of her open Slots and is not blacklisted with her (on a fresh seed, Southern Cross · Ms K. Patel into Wed 22 Jul PM). If none fits, it first logs a request for her next open Slot and assigns that. The message names what happened ("The office assigned a waiting request to your Wed 22 Jul PM Slot: Southern Cross · Ms K. Patel"), and the booked row appears. Never mentions the blacklist (OQ-43). Disabled with "No free Slot in the next four months" |

Nothing is added to the Control Panel page. Its generated index lists the three new entries under
their screens. In the framed build, the presenter plays the office in Admin, so the stand-in is PWA
only.

## Out of scope

- **Bookings on a Draft List**, offering Draft Lists to anaesthetists, and anything about a Draft
  List on the mobile, web or PWA surfaces (OQ-44 interim). Raise with the owner if OQ-44 is answered
  that way.
- **Creating a Draft List from a hospital row on the matching screen** (US-02.1.2): Phase 33 calls
  `createDraftList` with `source: 'hospitalRow'`.
- **The booking update email** after an assignment (US-02.3.3, OQ-46): Phase 35.
- **Swap requests** (US-01.4.3): Phase 32, which refuses a Draft List id.
- **The conflict dashboard and conflict clearing** (US-01.5.2, US-01.5.4): Phase 30. This phase only
  raises a conflict through 30's path when a Draft List is assigned onto a closed Slot.
- **Un-assigning a List back into a Draft List**, and **reopening** an assigned or closed Draft List.
  Neither is in the catalogue; raise with the owner if a beat needs it.
- **Editing the AA rooms location** and deactivating hospitals: Phase 42 (every master editable).
- **Paging and virtualising the Day grid** for 85 anaesthetists (the footer narration stays): Phase 43.
- **A Draft List threshold rule** ("alert after N hours"). None exists in the catalogue; the
  over-a-day emphasis is display only.

## Manual test checklist

- [ ] Reset. The Admin side nav shows **Draft Lists 3** in amber, below Day view.
- [ ] Admin Day, Tue 21 Jul:
  - a "Draft Lists · being prepared" band sits above the rows, holding "St George's · Surgeon to
    confirm", PM, "16 h", drawn differently from every status colour;
  - Dr Fitzgerald's PM is a Free Slot;
  - the header reads "... · 1 Draft List";
  - every List block shows a booking count, and a List with a cancelled Booking does not count it;
  - no block anywhere reads "Surgeon TBC".
- [ ] Advance the clock "+1 hour": the band, the drawer and the Draft Lists view read "17 h". Advance
      "Next day": the St George's request shows "Day passed" and Assign is disabled with the reason.
      (Reset afterwards.)
- [ ] Draft Lists view:
  - three rows oldest first: Christchurch Eye Surgery "3 d 22 h" (warning emphasis), St George's
    "16 h", Southern Cross "40 min";
  - every row carries "Being prepared";
  - the OQ-44 provisional line shows.
- [ ] New Draft List (Forte Health, no surgeon, Fri 24 Jul AM, Phone): it appears at "0 min". Mobile
      and web views of every anaesthetist are unchanged (it takes no Slot), and the Audit viewer shows
      "Draft List created".
- [ ] Assign the St George's request:
  - step 1 lists Dr Fitzgerald under Free, anyone on leave under "Unavailable or on leave", and
    Slots that hold a List as disabled with "Resolve it in the Day view first";
  - choose Fitzgerald; step 2 insists on a surgeon ("Choose the surgeon."); choose Mr S. Tan and
    Assign;
  - the band empties, Fitzgerald's PM block shows St George's · Mr S. Tan with "0" bookings, and the
    drawer's History shows the Draft List's creation and assignment.
- [ ] Harness bar on Draft Lists: "Simulate incoming request" (Okafor, Forte, next Thu PM). Assign it:
  - Dr Sharma sits in "Blacklisted with Mr C. Okafor";
  - choosing her shows the blacklist warning and "Assign anyway";
  - pick Dr Chen instead: no warning. Run the trigger again: it is disabled with "Already waiting".
    Repeat once and assign to Sharma anyway: the audit shows the acknowledgement.
- [ ] Assign a Draft List onto an on-leave Slot: an amber warning names the leave, and it assigns. The
      new List carries a conflict and appears on Phase 30's conflict dashboard.
- [ ] Add a hospital holiday (Phase 30's Holidays) for a Draft List's hospital and day: the row, the
      drawer and the band block show "Hospital closed that day"; the Conflicts screen does not list
      the Draft List; assigning it warns, goes ahead, and the new List carries a holiday conflict.
- [ ] Close a Draft List with no reason: refused. With "Duplicate request": it moves to History as
      "Closed: Duplicate request".
- [ ] Admin Day on another day: "Add Draft List for this day" from the harness bar adds a band
      block for that day. The menu shows no Draft List entries on the Billing monitor.
- [ ] Pairing:
  - Edit list cannot clear the hospital or surgeon;
  - a Permanent List needs both;
  - the Pre-op kind on Assign List defaults to AA rooms;
  - pre-op Lists read "Pre-op clinic · AA rooms" in mobile, web and admin, and their drawer names a
    surgeon;
  - acute blocks keep "Acute theatre" and name a surgeon in the tooltip.
- [ ] S1 on the framed build (Fire hospital message and its modify and move messages), S2 Beats 2 to
      4 and S3 behave exactly as before, with the same figures.
- [ ] PWA (`npm run dev:pwa`, fresh storage): on Lists the Demo chip offers "Office assigns a Draft
      List to me", badged. Running it adds Wed 22 Jul PM Southern Cross · Ms K. Patel; running it
      again logs and assigns a request into the next open Slot. It never mentions a blacklist.
- [ ] No en or em dashes in any new copy; teal is the only action colour; crimson unused on the new
      screens, sheets and band; the nav badge is amber.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots` all green.

## Demo guide updates

This phase changes S2 (a new beat and new Expected lines) and the office workflows. Patch, in the
same session:

- **`docs/demo-guide/03-demo-script.md`:**
  - S2 **Time**: "7 to 9 minutes" (the new beat adds about 90 seconds). Update the timing table rows
    that include S2.
  - S2 Beat 1, add to Say: "Requests that arrive before an anaesthetist is found wait here, flagged as
    being prepared, so nothing is lost between an email and a Slot." Add to Expected: "a 'Draft Lists ·
    being prepared' band above the grid holds St George's PM, surgeon to confirm, waiting 16 h; every
    List block shows its booking count; the nav shows Draft Lists 3."
  - **New S2 Beat 1b, "a request with no anaesthetist yet"** (lettered, so later beat numbers and
    cross-references hold until Phase 44 renumbers):
    - Click: open the band's St George's block → **Assign** → **Dr Emma Fitzgerald** (Free) →
      surgeon now confirmed, **Mr S. Tan** → **Assign Draft List**.
    - Optional, if time allows: **Draft Lists** → Demo actions → **Simulate incoming request**
      (Forte Health, Mr C. Okafor, Thu 23 Jul PM) → **Assign** → point at Dr Sharma in "Blacklisted
      with Mr C. Okafor" → pick **Dr Chen** instead.
    - Say: "A Draft List has a hospital and a surgeon, but no anaesthetist, and takes no one's Slot.
      Assigning it drops it into the Slot for its day and session. An unavailable Slot or a blacklisted
      pairing warns, and never blocks."
    - Expected: "the band empties; Fitzgerald's PM shows St George's, Mr S. Tan; History shows the
      Draft List created and assigned."
  - S2 **Discovery points**: add OQ-44 (what a Draft List holds, whether it can take Bookings, whether
    anaesthetists see it) and the pre-op and acute pairing reading (AA rooms as a location; a named
    surgeon on pre-op and acute Lists).
- **`docs/demo-guide/02-workflows-and-handoffs.md`:**
  - Workflow 1 "Manual fallback paths": a request with no anaesthetist yet becomes a Draft List.
  - Workflow 2 "plan the day": the Draft Lists band and the booking counts.
  - "The two kinds of state": one line saying a Draft List is not the approval state DRAFT (shown as
    "Open").
- **`docs/demo-guide/04-presenter-cheat-sheet.md`:**
  - "The five nouns to remember" or its Slot and List line: add the Draft List, and "every List has
    exactly one hospital and one surgeon; AA rooms is a location";
  - "Admin Web" under "What each app is for": Draft Lists;
  - "Prototype readiness": Draft Lists built and clickable, with the OQ-44 interim named;
  - "Terms not to use": "Surgeon TBC List".
- **`docs/demo-guide/master-demo-guide.html`:** the same S2 Beat 1 and new Beat 1b, the S2 discovery
  points, the workflow 1 and 2 summaries and the cheat-sheet lines (the sections near "Office day",
  "phone advice" and "Workflow 2").
- **Control Panel** `SCENARIOS` S2 text (`apps/demo/DemoControlPanel.tsx`): "Assign the St George's
  Draft List to Dr Fitzgerald; optionally simulate an incoming request to show the blacklist
  warning."

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
- **Takes no Slot, holds no Booking.** `createDraftList`, `editDraftList` and `closeDraftList` never
  touch `schedule.slots`, `schedule.lists` or Bookings. A preparing Draft List is invisible to every
  anaesthetist-facing selector and screen. Only `assignDraftList` creates a List, through
  `placeListOnSlot`, in the Slot the draft's day and session fix.
- **One pairing rule.** Every write path (assign, Assign List, phone advice, edit, templates,
  generator, roll-forward, integrations, addendum, stand-ins) goes through `pairingIssues`, with no
  inline checks. No List anywhere, backdrop included, lacks a resolvable hospital or surgeon. Hunt
  for surviving "AA rooms", "Unassigned", "Not assigned" and "Surgeon TBC" fallbacks.
- **Warn, never block, except the two real guards.** An unavailable, on-leave, emergency-only or
  blacklisted choice is selectable, warned before save, and assigned (with a Phase 30 conflict on a
  closed Slot, and 17's acknowledgement on a blacklisted pairing). The only hard refusals are an
  occupied Slot, a missing surgeon or hospital, a passed day and the office-only guard. A Draft List at a
  closed hospital warns (derived flag) and never becomes a conflict row until it is a List.
- **Audit and identity.** Assignment is one commit with `draftList.assign` plus `list.create`
  metas. The Draft List record is kept with `assignedListId`, and the List carries `draftListId`.
  Runtime ids are `DLN###` and never collide with the seed's `DL-`. Every new action code is
  labelled. The List's History shows the Draft List's trail.
- **Determinism and seed hygiene.** The golden-fixture diff shows only the stated changes, with no
  Booking, List id or placement moved. The acute surgeon comes from its own RNG stream. No fee,
  invoice or Contract resolution changed (AA rooms reaches RVG Default Post-paid as before). The
  canned request days derive from the clock with no `new Date()`. `PERSIST_VERSION` is bumped and
  the migrate test extended.
- **Time waiting.** It is computed from the demo clock, updates on every clock move, freezes at
  assignment or close, and is formatted in one helper.
- **Vocabulary.** "Draft List" never labels the approval state (which reads "Open"), and the Draft
  List's status values are not `DRAFT` or `open`. "Being prepared" appears on every Draft List
  surface.
- **Design and copy.** The band and pills use the warning tint and never a status colour, so a Draft
  List never reads as a booked List. Teal is the only action colour, the nav badge is amber, and
  crimson is unused. Admin sheets go through `useSurface().Overlay`. No en or em dashes. `pwaPurity`
  holds, and the stand-in is PWA only, badged, and silent about the blacklist.

## PROGRESS.md updates

- **Status row** for catch-up Phase 31, and a phase entry with:
  - the drift-check result: items changed or not; OQ-44 and OQ-43 status; the owner's answer on the
    pre-op and acute pairing reading and on emergency Slots; the names 17, 28, 29 and 30 actually
    used;
  - what was built, with a name map for later phases: `DraftList`, `schedule.draftLists`,
    `createDraftList`, `editDraftList`, `assignDraftList`, `closeDraftList`, `pairingIssues`,
    `draftListCandidates`, `waitingLabel`, `locationName`, `HOSP.aaRooms`, `List.draftListId`, and
    the now-required `List.hospitalId` and `List.surgeonId`;
  - the `PERSIST_VERSION` bump (from and to);
  - the golden-fixture diff summary;
  - the tests added, and the before and after Vitest and Playwright counts;
  - the review pass.
- **Decisions log:**
  1. **Superseded:** 2026-07-23 "PermanentList type gains `hospitalId: HospitalId | null`". The pre-op
     clinic is held at the **AA rooms location** (`Hospital.locationType: 'aaRooms'`). Templates and
     Lists always carry a hospital and a surgeon (US-01.3.1).
  2. **Superseded:** the Phase 02 and 06 "surgeon TBC" design state (the Fitzgerald Tue 21 PM List
     with an amber "Surgeon not yet assigned" flag, reproduced from `Admin Day.dc.html`). It is now
     a Draft List; the catalogue rule wins over the mockup (convention 17's rule 2).
  3. **Superseded:** Phase 28's interim "pre-op Lists come only from Permanent Lists". Assign List
     and phone advice offer every booking-scope kind.
  4. **New, provisional (OQ-44):** a Draft List has a required hospital, day and session, and an
     optional surgeon until assignment. It holds no Bookings, is office only, and is closed with a
     reason when a request dies.
  5. **New, provisional (no OQ, owner told):** pre-op clinics name the surgeon whose patients they
     assess, and acute Lists name the on-call surgeon. The acute pick comes from its own RNG stream.
  6. **New:** assigning a Draft List fixes the Slot by its day and session. Only an occupied Slot, an
     incomplete pairing, a passed day or the office-only guard refuse. Unavailable, on-leave,
     emergency-only and blacklisted choices warn and go ahead (US-01.5.2, US-01.3.5). Record the
     owner's answer on emergency Slots.
  7. **New:** the "over a day" waiting emphasis is display only, not a rule.
  8. **New:** the PWA stand-in logs a request for the persona's next open Slot when no Draft List
     fits, so the handset beat never dead-ends.
  9. **New (answers Phase 30's handoff):** a Draft List at a hospital with a holiday shows a derived
     "Hospital closed that day" warning, not a conflict, and is not on the Conflicts screen. The
     `holiday` conflict is raised on the List it becomes.
- **Handoff notes:**
  - For **32**: `assignDraftList` and `draftListCandidates` are the pattern for the swap target
    picker. A Draft List id must still be refused by the swap action.
  - For **33**: call `createDraftList(..., { source: 'hospitalRow' })` from the matching screen's
    "Create Draft List" action. Add a source reference field then if the row needs one.
  - For **35**: an assignment is a natural "update email" moment (to the rooms and the hospital),
    if OQ-46 includes it.
  - For **34**: per-hospital sync skips the AA rooms location (`locationType: 'aaRooms'`); it has
    no feed.
  - For **42**: AA rooms is a hospital-master row with `locationType: 'aaRooms'`. The Hospitals
    editor must keep it non-deletable and out of the Contract-holder and feed pickers. The Draft
    List source list is a candidate master.
  - For **43**: the day band and the booking counts must stay fast at 85 anaesthetists.
  - For **44**: S2 Beat 1b is lettered; renumber it in the rewrite, and re-read the Draft List
    discovery points against OQ-44.
