# Phase 31 · Draft Lists and the day dashboard

**Requirements covered (status at `60e2d1e`):**
[EP-07](../../../../requirements-board/requirements/stories/EP-07.md) List approval workflow (Confirmed; four states since 2026-10-07: DRAFT, a Draft List with no anaesthetist, then ACTIVE, SUBMITTED and AUTHORISED; an ACTIVE List that goes back to the office is DRAFT again. Phase 15b renamed the old DRAFT to ACTIVE; this phase adds DRAFT with its new meaning and the two transitions) ·
[FT-07.1](../../../../requirements-board/requirements/stories/FT-07.1.md) ACTIVE (Proposed; a List is ACTIVE once it has all five of its pairing, anaesthetist, surgeon, hospital, day and session, whether assigned from a Draft List or set up with its anaesthetist) ·
[FT-01.6](../../../../requirements-board/requirements/stories/FT-01.6.md) Draft Lists (Confirmed; the DRAFT state of a List; never offered to anaesthetists, OQ-86 answered no) ·
[US-01.6.1](../../../../requirements-board/requirements/stories/US-01.6.1.md) Create a Draft List (Confirmed; the four fields stay required) ·
[US-01.6.2](../../../../requirements-board/requirements/stories/US-01.6.2.md) See Draft Lists flagged in the Admin App (Confirmed; one place, sorted in ascending date order: Vanessa, 7 October, "sorted by how close they are to the procedure date") ·
[US-01.6.3](../../../../requirements-board/requirements/stories/US-01.6.3.md) Assign a Draft List to an anaesthetist (Confirmed; the admin chooses only the anaesthetist, the session is fixed on the Draft List, the List **becomes active**, and opening one shows everybody potentially available; an unavailable session or a not-preferred pairing warns softly) ·
[US-01.6.4](../../../../requirements-board/requirements/stories/US-01.6.4.md) Remove or re-date an unfilled Draft List (Confirmed) ·
[US-13.1.1](../../../../requirements-board/requirements/stories/US-13.1.1.md) One-day dashboard (Confirmed) ·
[US-01.3.1](../../../../requirements-board/requirements/stories/US-01.3.1.md) Assigned List pairing rule (Confirmed) ·
[FT-01.3](../../../../requirements-board/requirements/stories/FT-01.3.md) List assignment (Confirmed; "with all five it is an active List") ·
[EP-01](../../../../requirements-board/requirements/stories/EP-01.md) Schedule canvas, Slots and Lists (Confirmed; its last open strands here: the Draft List in the DRAFT state, the pairing rule of one surgeon, one anaesthetist and one hospital, the "Surgeon TBC" state and the recurring clash) ·
[DM-52](../analysis/domain-model-delta.md#dm-52) List lifecycle DRAFT, ACTIVE, SUBMITTED, AUTHORISED (its second half: the DRAFT state for Draft Lists, DRAFT to ACTIVE on assignment, ACTIVE back to DRAFT through `detachListToDraft` for Phase 32's callers; 15b did the rename) ·
[DM-03](../analysis/domain-model-delta.md#dm-03) Draft List: a List created with no anaesthetist, which can hold Bookings and is assigned by the office.
No RV items.
**Closed here, owned elsewhere:** the recurring-clash criteria of
[US-01.3.2](../../../../requirements-board/requirements/stories/US-01.3.2.md) (Verify, AC2),
[US-01.5.2](../../../../requirements-board/requirements/stories/US-01.5.2.md) (Verify, AC3),
[US-01.5.4](../../../../requirements-board/requirements/stories/US-01.5.4.md) (Proposed, AC3: it shows as a Draft List, not as a conflict on the anaesthetist) and
[US-01.1.1](../../../../requirements-board/requirements/stories/US-01.1.1.md) (its last paragraph); the Draft List path of
[US-01.3.5](../../../../requirements-board/requirements/stories/US-01.3.5.md) (Confirmed, "Every office path": assigning a Draft List) and
[US-01.3.6](../../../../requirements-board/requirements/stories/US-01.3.6.md) (Verify, new at `60e2d1e`: the tier order when the office asks who can fill an extra List), both built by Phase 17 on its helper. Phase 28's generator and Phase 30's projection report the sessions they skip because the anaesthetist's session is closed; this phase turns each one into a Draft List (OQ-81 part 2, settled in the room).
Read alongside (not closed here):
[DM-02](../analysis/domain-model-delta.md#dm-02) (Phase 28; this phase builds its Draft List third),
[DM-04](../analysis/domain-model-delta.md#dm-04) (Phases 29 and 32; return-or-assign from an unavailable session is Phase 32's, not this phase's),
[DM-54](../analysis/domain-model-delta.md#dm-54) (Phase 17: private pairing preferences and priority tiers, reused here),
[US-01.5.5](../../../../requirements-board/requirements/stories/US-01.5.5.md) (Confirmed, Phase 32: an anaesthetist marking a booked session unavailable chooses to return the List to the office, which lands here as a Draft List through `detachListToDraft`, or to assign it to a colleague),
[US-01.4.3](../../../../requirements-board/requirements/stories/US-01.4.3.md) (Confirmed, Phase 32: an anaesthetist moves a List to the office, or withdraws from it, through the same helper; it goes back to DRAFT),
[US-01.4.5](../../../../requirements-board/requirements/stories/US-01.4.5.md) (Confirmed, Phase 32: no preference warning on an anaesthetist's own hand-on),
[US-01.4.7](../../../../requirements-board/requirements/stories/US-01.4.7.md) (Verify, Phase 32a; its sentence "the office does not assign work to someone marked unavailable without them knowing" bears on this phase's soft warning),
[US-01.5.3](../../../../requirements-board/requirements/stories/US-01.5.3.md) (Confirmed; the calendar is painted before recurring bookings),
[US-01.3.3](../../../../requirements-board/requirements/stories/US-01.3.3.md) (Confirmed; manual List assignment, Phase 28; its note names the Draft List as the other way to make a List),
[US-01.4.2](../../../../requirements-board/requirements/stories/US-01.4.2.md) (Confirmed; availability finder, Phase 28: the assign picker is its Draft List view),
[US-13.6.3](../../../../requirements-board/requirements/stories/US-13.6.3.md) and
[US-13.6.4](../../../../requirements-board/requirements/stories/US-13.6.4.md) (Phase 17: not-preferred and preferred pairings, admin only),
[US-02.1.2](../../../../requirements-board/requirements/stories/US-02.1.2.md) (the matching screen, Phase 33: "create a Draft List when nobody is assigned yet"),
[US-02.5.2](../../../../requirements-board/requirements/stories/US-02.5.2.md) (Future Work swimlane: an automated reschedule clash that makes a Draft List; not built),
[US-06.3.5](../../../../requirements-board/requirements/stories/US-06.3.5.md) and
[US-06.5.4](../../../../requirements-board/requirements/stories/US-06.5.4.md) (the honour system: no logic detects a move or re-triggers a prepayment calculation; D20),
[US-13.5.2](../../../../requirements-board/requirements/stories/US-13.5.2.md) (audit),
[OQ-44](../../../../requirements-board/requirements/questions/OQ-44.md) (Draft List contents and lifecycle, **Answered**),
[OQ-86](../../../../requirements-board/requirements/questions/OQ-86.md) (**Answered 2026-10-07: no**, D46; anaesthetists never browse or pull Draft Lists),
[OQ-43](../../../../requirements-board/requirements/questions/OQ-43.md) (**Answered**, D44: private two-way preferences, admin only, a soft admin warning, none on an anaesthetist's own hand-on),
[OQ-27](../../../../requirements-board/requirements/questions/OQ-27.md) and
[OQ-17](../../../../requirements-board/requirements/questions/OQ-17.md) (Answered: a Slot holds a status or a List),
[OQ-64](../../../../requirements-board/requirements/questions/OQ-64.md) (**Answered**, owner decision D14: a Slot is a box with a status that a List goes into; "slot" is never said in the UI; the name Draft List is kept; marking a booked Slot unavailable offers return or assign, Phase 32),
[OQ-81](../../../../requirements-board/requirements/questions/OQ-81.md) (Open: parts 1 and 2 settled in the room, the anaesthetist's calendar is painted first and a recurring booking on an unavailable session becomes a Draft List; part 3, short-notice sickness, is open),
[OQ-84](../../../../requirements-board/requirements/questions/OQ-84.md) (what a session shows after its List moves away; Phase 32),
[OQ-102](../../../../requirements-board/requirements/questions/OQ-102.md) (open, D36: "Not preferred", "Preferred", Tier 1 to Tier 4, held in Phase 17's one label set), the AR-22 Booking and List lifecycle diagram ([AR-22](../../../../requirements-board/requirements/artifacts/AR-22.md) regions `draft`, `draft-arises`, `draft-flagged`, `draft-removed`, `draft-assigned`, `active` and `active-list`), and the "Slot, List and Draft List" section and the List state bullet of
[domain-model.md](../../../../requirements-board/requirements/domain-model.md).
**Depends on:** 17 (the pairing preferences and priority tiers: the pure `src/domain/pairingPreferences.ts` with `rankAnaesthetistCandidates`, `notPreferredWarning`, `notPreferredEntryIds`, `PAIRING_LABELS` and `TIER_LABELS`; the Admin-only `src/apps/admin/components/pairing/` pieces `SurgeonPicker`, `AnaesthetistCandidates`, `NotPreferredWarning` and `useNotPreferredWarning`; the office-only `officePrivate` slice, `store/officePrivate.ts`, the shell's `suggestionSeq` and the `src/apps/officePrivacy.test.ts` boundary; the `*.pairingAcknowledged` meta) and 30 (and through it 28 and 29: Slot records and Slot views, the internal `placeListOnSlot`, `moveListToSlot`, `assignListToSlot`, 28's horizon setting, `rollCanvasForward` and `generateCanvasForDates` with its `clashes` (`RecurringClash`), `setAvailability` writing the Slot, the Slot status master in `domain/slotStatus.ts` with `isOpenForBooking`, `isClosed` and `isOpenSlot`, 29's `setAvailabilityRange`, `createAvailabilitySeries` and `seriesCalendarFor`, which paints a series onto new Slots in the generator's calendar step **before** recurring bookings, and Phase 30's conflict reconcile inside `mutate()` with its `holiday` conflict for a List with no Slot, its Conflicts screen and `conflictRows`, its seeded Rutherford Wed 22 AM sickness, its recurring bookings (`RecurringBooking`, `seed/recurringBookings.ts`, `addRecurringBooking` / `editRecurringBooking` / `retireRecurringBooking`, `applyRecurringBookingsToCanvas`, `RecurringBookingSheet.tsx`) and its pure projection `projectRecurringBookingChange` / `projectAllRecurringBookings`, whose `skipped` entries are the recurring clashes this phase turns into Draft Lists). Phase 29 seeds **no emergency-only status and has no `isEmergencyOnly`**. Also uses 14 (the registry, `useDemoTriggerContext`, `OFFICE_SIMULATION_ACTOR`, `OFFICE_ACTOR` and the engine actor in `store/demoActors.ts`, the PWA sheet `src/pwa/PwaDemoActions.tsx`), 15 (Booking names), 15a (the warning routine `evaluateWarnings` and the To-do rail card the Draft Lists rail card sits under), **15b** (`ListState = 'ACTIVE' | 'SUBMITTED' | 'AUTHORISED'`, `listNotActive`, and the one label home `LIST_STATE_LABELS` in `shared/format.ts`, to which this phase adds DRAFT), 18 and 20 (contract holders and the Contract picker: AA rooms is a location, never a Contract holder; No contract (RVG) is the one default, with no hospital default), 20a and 21 (the seeded Bookings on a Draft List carry source wording and a payer on the Booking) and 27 (its prepayment routine, planned `syncPrepayment(api, bookingId, cause)`, which re-checks only on a change of Procedures, Contract or payer, never on a move, D20). Phase 32 follows and reuses `detachListToDraft` (a List moved or returned to the office goes back to DRAFT); 33 calls `createDraftList`.
**Estimated:** 2 sessions. Session 1 is the model and the DRAFT state, the pairing rule, the seed, the store and the recurring clash (work items 1 to 13), ending green and demoable with the seed changes visible (the Fitzgerald block gone, AA rooms as a location, request and recurring-clash Draft Lists in the store). Session 2 is the Admin screens, the Day dashboard, the demo triggers, the PWA stand-in and the demo guide (work items 14 to 25). Both are full. Session 1's risk is the compiler fallout from making the anaesthetist optional, the hospital and surgeon required and the List type a union on its state; if it runs long, keep the seed proof, the store tests and the green gate, and move work item 19 (Assign List and phone advice kinds) and the non-Admin reader tidy-ups beyond the compile-forced minimum to the start of session 2 rather than cutting tests. Session 2's slack is work item 24 (capture hooks).

## Goal

The catalogue has three schedule things, and after Phases 28 to 30 the prototype has two of them.
This phase adds the third, the **Draft List** (the name is kept, OQ-64), and with it the first state
of a List's lifecycle (EP-07, FT-07.1, DM-52): **DRAFT → ACTIVE → SUBMITTED → AUTHORISED**. Phase 15b
renamed the prototype's old DRAFT (an assigned List being worked) to ACTIVE and removed `'DRAFT'` from
the union; this phase adds `'DRAFT'` back with its catalogue meaning: **a List with no anaesthetist**.

OQ-44 is answered: a Draft List's **hospital, surgeon, day and session are always known and all four
are required** (the hospital booking always comes first; Greg: "in practice they are required"). It
takes **no Slot**, so creating one changes nobody's schedule, and it **may hold Bookings** before an
anaesthetist is assigned. It is **never offered to anaesthetists; only the office assigns it**
(OQ-86 answered no on 2026-10-07, D46: "it's an office job"). A request the surgeon's office cancels,
or that is never filled, is **removed, or its date is changed** (US-01.6.4).

The lifecycle, built here as the answer:

- a List set up with its anaesthetist (Assign List, phone advice, a recurring booking, the seed)
  starts **ACTIVE**, as it does since 15b;
- a Draft List is **DRAFT**; assigning it an anaesthetist makes it **ACTIVE** in that anaesthetist's
  session, keeping its id, Bookings and notes (US-01.6.3 "Becomes active"); only an ACTIVE List can
  be completed and submitted, so a Draft List cannot be submitted, authorised or billed;
- an ACTIVE List that goes back to the office becomes **DRAFT** again through one helper,
  `detachListToDraft`, built and tested here; its callers are Phase 32's (the anaesthetist moves the
  List to the office, withdraws, or returns it when marking the session unavailable). The automated
  reschedule clash (US-02.5.2) is Future Work;
- a List is ACTIVE exactly when it has all five of its pairing (FT-07.1): an anaesthetist and its
  Slot (day and session), a surgeon and a hospital. A store-wide invariant test holds it.

Because a Draft List is a List, the prototype models it as one: a `List` record in state DRAFT with
no anaesthetist and no Slot, carrying a small "draft trail" (where it came from, since when, by whom).
Its Bookings hang off its List id exactly as on any List, and assigning it keeps the same id, so
"keeping anything already recorded" is true by construction.

The office sees every Draft List **flagged "Unassigned", with how long it has been waiting, in one
place sorted in ascending date order** (US-01.6.2; Vanessa on 7 October: "a clear place to see all
draft lists ... sorted by how close they are to the procedure date"), prominently in the core planning
view ("a major feature for AA staff", OQ-64):

- a **Draft Lists rail card** in the Day view's right rail, under Phase 15a's To-do card, designed
  together with it and with the space Phase 32's notification pool takes;
- a **Draft Lists band** at the top of the Day grid for the day it falls on (US-13.1.1);
- its own **Draft Lists page** in the Admin side nav, with an amber count badge (the one place,
  US-01.6.2 "One visible place");
- the Day header's summary line.

The office **assigns** one by choosing **only the anaesthetist**: the session is fixed on the Draft
List (to use another day, change its date first). Opening a Draft List shows **everybody potentially
available** for that half-day (US-01.6.3's note, US-01.4.2), through **Phase 17's helper**, the one
every office pairing path uses (US-01.3.5, US-01.3.6, D44): the free anaesthetists without a
not-preferred pairing apart from those with one (a separately labelled group, still selectable),
preferred pairings marked, each group **ordered by priority tier and shuffled within a tier**, with a
tier filter; then the anaesthetists whose session is closed (Unavailable, Holiday or any closed
status), and those who already hold a List then (not selectable). An unavailable session or a
not-preferred pairing shows a **soft warning** and can still go ahead. The assignment is audited, and
the List, with its Bookings, now sits ACTIVE in that anaesthetist's session. Preferences and tiers are
office-only (Phase 17's privacy boundary): no anaesthetist surface ever shows them, and no Draft List
reaches an anaesthetist surface at all.

Draft Lists have five origins in the catalogue. This phase builds two and leaves the seams for the
rest:

1. **A request from a surgeon's room** (phone, email, PDF): the office creates it.
2. **A surgeon's recurring booking that lands on a session the anaesthetist has already marked
   unavailable** (OQ-81 part 2, settled in the room: "the system should automatically create that
   list as a draft rather than assigning it to an anaesthetist"). Generation paints the
   anaesthetist's calendar first, series included (OQ-81 part 1; Phases 28 and 29), so the generator
   and Phase 30's projection already skip a closed session; this phase turns each skipped session into
   a Draft List, at generation, at every roll forward and whenever a recurring booking is added,
   edited or applied. It is **not** a conflict on the anaesthetist (US-01.5.4 AC3) and it is built as
   the answer, with no provisional label.
3. **An anaesthetist moving a List to the office, or withdrawing from it** (US-01.4.3), **including
   when they mark a booked session unavailable and choose "return to the office"** (US-01.5.5):
   Phase 32, through this phase's `detachListToDraft` (ACTIVE back to DRAFT). This phase does not
   convert an anaesthetist's unavailability into Draft Lists on its own: the anaesthetist chooses.
   Until Phase 32, marking a booked session unavailable keeps Phase 30's conflict flag, and
   **office-recorded sickness stays a conflict** (OQ-81 part 3 is open), so Phase 30's seeded
   Rutherford sickness and its "Simulate sickness" trigger are unchanged.
4. **A hospital row on the matching screen** (US-02.1.2): Phase 33, through
   `createDraftList(..., 'hospitalRow')`.
5. **An automated reschedule clash** (US-02.5.2): Future Work, not built.

The phase also **enforces the pairing rule everywhere** (US-01.3.1, FT-01.3; EP-01: an active List
has exactly one surgeon, one anaesthetist and one hospital). Every List, Draft Lists included, has
exactly one surgeon and one hospital, and every ACTIVE, SUBMITTED or AUTHORISED List has its
anaesthetist and Slot.

- The seeded Fitzgerald Tue 21 PM "Surgeon TBC" List goes; St George's request becomes a seeded
  Draft List with its surgeon named.
- The pre-op clinic Lists at AA's rooms get a real **location record** (AA rooms), which is never a
  Contract holder.
- Every public List (acute theatre and the public "Elective ortho" recurring bookings) and every
  pre-op List names a surgeon.
- `List.hospitalId` and `List.surgeonId` become required and `List.anaesthetistId` and `List.slotId`
  become optional, keyed by the state (an ACTIVE, SUBMITTED or AUTHORISED List has both; a DRAFT List
  has neither), so the compiler finds every path that could break the rule or assume an anaesthetist.

Last, the Day dashboard shows each List block's **booking count** (US-13.1.1).

Vocabulary: the word "slot" never reaches app copy (OQ-64; say session, AM or PM). Slot stays a code
and planning word, so this doc still says Slot for the record. "Not preferred" and "Preferred", never
"blacklist" or "whitelist". DRAFT is shown only on a Draft List; an assigned List is never labelled
"DRAFT" or "Open".

## Before you start: drift check

1. Diff the covered and read-alongside items against the plan's snapshot (baseline `60e2d1e`):

   ```
   node docs/prototype-build/catch-up/tools/plan-state.mjs --diff EP-07,FT-07.1,FT-01.6,US-01.6.1,US-01.6.2,US-01.6.3,US-01.6.4,US-13.1.1,US-01.3.1,FT-01.3,EP-01,US-01.3.2,US-01.5.2,US-01.5.3,US-01.5.4,US-01.5.5,US-01.1.1,US-01.3.5,US-01.3.6,US-01.3.3,US-01.4.2,US-01.4.3,US-01.4.5,US-01.4.7,US-02.1.2,US-02.5.2,US-13.6.3,US-13.6.4,US-13.5.2,US-06.3.5,US-06.5.4,OQ-44,OQ-64,OQ-81,OQ-86,OQ-84,OQ-27,OQ-17,OQ-43,OQ-102
   ```

   Also run the whole-catalogue diff from ROADMAP.md "When the catalogue changes" and scan it for new
   items that name Draft List, DRAFT, ACTIVE, unassigned, pairing, preference, tier, day dashboard,
   booking count, recurring booking, AA rooms, pre-op or acute Lists.
   What `60e2d1e` already changed, and this plan already reflects: the four List states (EP-07,
   FT-07.1, FT-01.6, US-01.6.3 "Becomes active", domain-model.md); OQ-86 answered no; OQ-43
   answered (the blacklist became private two-way preferences with an admin-only warning, US-01.3.5,
   US-13.6.3, US-13.6.4) and the new priority tiers (US-01.3.6); US-01.6.2's soonest-first note; the
   honour system on a move (US-06.3.5, US-06.5.4).
2. If an item changed since `60e2d1e`, re-read it and adjust the work items. Things to look for:
   - **FT-01.6 and US-01.6.1 to 01.6.4** (Confirmed): if any is now Retired or Future, drop the
     matching work (the Draft List model in items 2, 3 and 8, the views in 15 to 18, the triggers in
     22), keep the pairing rule and the booking count, and build a sensible default for what the St
     George's request becomes instead, logged on the "For the owner's review" list.
   - **EP-07 and FT-07.1**: if a state is added (a Returned state, say) or a transition changes (for
     example a SUBMITTED List going back to the office), change the `ListState` union, the
     `AssignedList` and `DraftList` keys and `detachListToDraft`'s refusal, and log it.
   - **US-01.6.2**: if a different order or a grouping is now asked for, change the one comparator
     `compareDraftLists` (work item 3).
   - **US-01.6.3**: if assigning may now pick any session (not the one the Draft List fixes), or an
     occupied session may be taken over, change `assignDraftList` and the picker to match.
   - **US-01.6.4**: if removal now needs a recorded reason, make the reason required in
     `removeDraftList` and the Remove sheet.
   - **US-01.3.1 / FT-01.3**: if the pairing rule gains exceptions (for example "a pre-op clinic has
     no surgeon" or "acute theatre names the service, not a surgeon"), implement the exception in the
     one pure `pairingIssues` helper (work item 3) and drop the matching seed change in work item 4.
   - **US-01.3.5 and US-01.3.6**: if the grouping or tier order changes, it changes in Phase 17's
     helper, never here; this phase only feeds it.
   - **US-01.3.2, US-01.5.2, US-01.5.4 and OQ-81**: if part 2 flips back to "create the List and flag
     a conflict", drop work item 9 and leave the `clashes` and `skipped` paths alone; if part 3
     settles that an anaesthetist-marked sickness takes the return-or-assign path, that is Phase 32's
     and changes nothing here; if it settles that the office records sickness as a Draft List, add
     that to Phase 30's `simulateSickness` here through `detachListToDraft` and log it.
   - **US-06.3.5 and US-06.5.4**: if a move or a first assignment now re-triggers a prepayment
     calculation, change work item 8's prepayment step to match and log it.
   - **US-13.1.1**: if the dashboard gains other per-block figures, add them in work item 20.
   - **domain-model.md** "Slot, List and Draft List": if a Draft List now sits in a Slot, stop and
     re-plan work items 2 and 8.
   - Any covered item now Retired or Future leaves the covers; record that in the PROGRESS entry.
3. **Answered decisions and open questions** (the ROADMAP owner-decisions table: D14, D20, D36, D38
   (OQ-80, the payee repoint, Phase 41's), D44, D46; the "Confirm before building" row for 28 to 31: US-01.3.2 and US-01.5.2 Verify, OQ-81). Build
   the answers, with no provisional labels:
   - **OQ-44 is Answered**: four required fields, Bookings allowed before assignment, office only,
     removed or re-dated.
   - **EP-07 (2026-10-07)**: the DRAFT state is a Draft List; ACTIVE on assignment; ACTIVE back to
     DRAFT when a List goes back to the office (Phase 32's callers).
   - **OQ-86 is Answered no (D46)**: no Draft List on any anaesthetist surface, ever. State it in the
     `DraftList` type's doc comment, and keep the selector test that no anaesthetist-scoped selector
     returns one. It is not a default and goes on no review list.
   - **OQ-43 is Answered (D44)**: the office gets a soft not-preferred warning and the grouped,
     tier-ordered picker through Phase 17's helper; nothing about preferences or tiers reaches an
     anaesthetist surface, and the PWA office stand-in never names them.
   - **OQ-64 is Answered (D14)**. Build it:
     - the name **Draft List** is kept, and "Unassigned" is its flag;
     - **"slot" is never said in the UI**: every new string says session, AM or PM, or names the
       anaesthetist's List;
     - marking a booked session unavailable offers return or assign (US-01.5.5): that is **Phase 32's**
       and is not built here. This phase does not touch 29's `availabilityClash` (or whatever Phase 30
       left in its place) and does not convert an anaesthetist's unavailability into Draft Lists.
   - **OQ-81** (Open; parts 1 and 2 settled in the room, which is how D14 records them): build part 2
     as the answer (work item 9). Confirm part 1 in the code: generation and roll forward paint the
     anaesthetist's availability (29's statuses and series, through `seriesCalendarFor` in the
     generator's calendar step) before any recurring booking. Part 3 (short-notice sickness) is open:
     Phase 30's office-recorded sickness stays a conflict and its seed and trigger are unchanged here;
     log that on the "For the owner's review" list.
   - **OQ-102 (D36, open)**: every pairing and tier word comes from Phase 17's `PAIRING_LABELS` and
     `TIER_LABELS`; this phase adds none.
   - **D20 (the honour system)**: assigning, re-dating or returning a List re-triggers no prepayment
     calculation for a Booking that already had an anaesthetist. A Booking created on a Draft List has
     never had one; work item 8 sets the built default for its first assignment.
   - **Names.** Put every user-facing Draft List word in **one module** (work item 3,
     `shared/scheduleTerms.ts`), so the three apps cannot drift and the "no slot in app copy" check has
     one place to look. Use "Draft List" for the thing, "Unassigned" for its flag and "DRAFT" for its
     state chip (through 15b's `LIST_STATE_LABELS`); never "a List being prepared".
   - **Pre-op and acute pairings (no OQ exists).** The catalogue has no exception for the pre-op
     clinic at AA's rooms (no hospital, no surgeon) or for public acute theatre (no named surgeon).
     The reading, recorded in the Decisions log, has two parts:
     - AA rooms is a location record in the hospitals master, never a Contract holder;
     - a pre-op clinic names the surgeon whose patients it assesses, and an acute List names the
       on-call surgeon.
     Build it and put it on the "For the owner's review" list (to raise with AA). Do not edit the
     catalogue.
   - **Emergency-only sessions** (no status value is named for it). Phase 29 seeds no "Available for
     emergency" status and built no `isEmergencyOnly`, so the picker has no emergency group: an
     admin-added status lands in Free or Not available by its bookable flag, and the row shows its own
     label. If a later phase or the owner has added an emergency-only behaviour by now, give it its own
     labelled group with a soft warning and no conflict, and log that reading on the "For the owner's
     review" list rather than asking.
4. **Check the neighbours:**
   - Phases 15b, 17, 28, 29 and 30 are DONE. Confirm the names in their PROGRESS entries, because
     this doc uses the planned names and the build may have renamed them:
     - 15b: `ListState` (`'ACTIVE' | 'SUBMITTED' | 'AUTHORISED'`), `listNotActive`,
       `LIST_STATE_LABELS`; grep for any surviving `'DRAFT'` with the old meaning before adding the
       new one (work item 2);
     - 17: `rankAnaesthetistCandidates`, `notPreferredWarning`, `notPreferredEntryIds`,
       `PAIRING_LABELS`, `TIER_LABELS`, `AnaesthetistCandidates`, `NotPreferredWarning`,
       `useNotPreferredWarning`, `SurgeonPicker`, `suggestionSeq`, the `list.pairingAcknowledged` meta,
       and the allowlist in `src/apps/officePrivacy.test.ts` (work item 8 adds
       `store/draftListActions.ts` to it);
     - 28: `placeListOnSlot`, `moveListToSlot`, `assignListToSlot`, `slotFor`, `listInSlot`,
       `slotViewsForDate`, `effectiveSlotTimes`, the state label it uses (if it shipped an
       `approvalStateLabel` that prints "Open", re-point it to `LIST_STATE_LABELS`: no "Open" label for
       a List), the horizon setting and its reader, `rollCanvasForward` and `generateCanvasForDates`
       with its `clashes` (`RecurringClash`), the List drawer and the Assign List sheet,
       `setAvailability` and its outcome values, the office availability finder ("Find available") and
       its use of `AnaesthetistCandidates`, and how 28 kept "slot" out of app copy (reuse any check it
       added);
     - 29: `SlotStatus`, `statusFor`, `isOpenForBooking`, `isClosed`, `isOpenSlot`, the calendar's
       single and series actions (`setAvailabilityRange`, `createAvailabilitySeries`,
       `seriesCalendarFor` feeding the generator's calendar step) and how availability is held for a
       day beyond the horizon (work item 22's "Stage recurring clash" writes one). Confirm that no path
       paints a series **after** placing recurring-booking Lists on new Slots; 29's plan paints first,
       so a series-closed session comes out as a `RecurringClash`. If the build left an after-the-fact
       flag on a recurring-booking List anywhere, work item 9 replaces it with a Draft List;
     - 30: the conflict reconcile (`store/conflictReconcile.ts`, run inside `mutate()`), the engine in
       `domain/conflicts.ts` (`expectedConflicts`, which allows a `holiday` conflict for a List with no
       Slot), the Conflicts screen route, columns and `conflictRows`, `simulateSickness` and its
       `choices`, the PWA stand-in `office-reassigns-list`, how the List colour change is drawn, the
       seeded Rutherford Wed 22 AM sickness and the Southern Cross Wed 22 closure (`HH900`),
       `List.recurringBookingId`, the projection (`projectRecurringBookingChange`,
       `projectAllRecurringBookings`, `activeOn`, the plan's `skipped` entries and their shape), the
       store actions that apply it (`addRecurringBooking`, `editRecurringBooking`,
       `retireRecurringBooking`, `applyRecurringBookingsToCanvas`, and the generator and roll forward
       path), the sheet's preview and result wording for skipped sessions, and the rename's final
       names. Read 30's handoff note for 31; where it still asks for the unavailability conversion,
       that is superseded by D14 (Phase 32 builds the anaesthetist's choice).
   - Phase 15a's To-do card in `RightRail.tsx` (planned as `WarningsToDo`, directly under the mini
     calendar, with room left below for this phase's card and Phase 32's pool) and its warnings.
     Warnings are **derived on read** (`domain/warnings` `evaluateWarnings`, selectors in
     `store/warnings.ts`; only office clearances are stored), so nothing "re-runs" on a change. Note
     which rules read the List's anaesthetist, and that `OpenWarningRow.anaesthetistId` is a required
     string today: both must tolerate a Draft List (work item 13).
   - Phases 18 and 20: the contract-holder master and its hospital-holder picker (AA rooms must never
     appear there), and the Contract picker's fitting filter (No contract (RVG) first, holder-fit
     Contracts under holder headings, no hospital default). Note how a Procedure's Contract is held,
     because the seeded Bookings in work item 5 set one.
   - Phases 20a and 21: the Procedure's source wording field and the payer on the Booking, which the
     seeded Bookings in work item 5 fill.
   - Phase 27: its prepayment routine (planned `syncPrepayment(api, bookingId, cause)`), the causes it
     shipped (27's plan exports a `listAssigned` cause for this phase's Draft List assignment, which
     it calls the setup of a List that had no anaesthetist, not a move), and how it behaves for a
     Booking whose List has no anaesthetist (27's `prepaymentBasisAnaesthetist` gives none, so nothing
     is required or generated; work item 8). Since 2026-10-08 it re-checks only on a change of Procedures,
     Contract or payer, never on a move.
   - Phase 28's PWA stand-in `assignNextFreeSlotAsSimulatedOffice` ("Office assigns a List to my next
     free session", Mobile · Lists). It stays; work item 22's entry sits beside it and reuses its
     session scan.
   - Phase 32's plan (`phase-32-swap-requests.md`): which `detachListToDraft` origins and options it
     expects (the move to the office, the withdrawal and the return from an unavailable session).
   - Note the current `PERSIST_VERSION` (16 after Phase 15a session 1; phases up to 30 raise it).
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
  - the right rail's card anatomy (the Draft Lists card is one more rail card, like 15a's To-do and
    Phase 32's notification pool);
  - the right-hand drawer (header, sections, action row), the header summary line and the dark side
    nav with its badges.
  The Draft Lists band is a row above the anaesthetist rows that uses the same ruler. Its blocks are
  white with a lineStrong border, a warning-solid left bar and a micro caps "UNASSIGNED" line, so they
  look different from every status tint and never from colour alone (US-01.6.2 "looks different from
  an active List"). Note the design shows Fitzgerald PM as "St George's, surgeon TBC" with an amber
  flag. The catalogue rule wins (US-01.3.1, OQ-44): that request now draws in the band, with its
  surgeon, not on her row.
- `docs/design/Admin Review.dc.html`: the table and row rhythm the Draft Lists page follows (with
  `apps/admin/tableChrome.ts`).
- `docs/design/Mobile App.dc.html`: the PWA stand-in's message and the new booked row (Phase 14 and
  28 patterns).

**Catalogue items:** the covered files above, and AR-22's DRAFT regions for the lifecycle. The rules
this phase must not break: US-01.3.5 (not preferred warns and never blocks; separated, labelled
groups; every office path), US-01.3.6 (tier order, shuffled within a tier, filter, admin only),
US-01.4.5 (no warning on an anaesthetist's own hand-on), US-01.5.2 (conflicts warn, never block),
US-01.5.4 AC3 (a recurring clash shows as a Draft List, not as a conflict on the anaesthetist),
US-06.3.5 and US-06.5.4 (no prepayment calculation re-triggered by a move), US-13.5.2 (every change
audited), FT-01.6 (never offered to anaesthetists), OQ-64 ("slot" never in the UI), and EP-07's four
states (the anaesthetist edits and submits only while ACTIVE).

**Analysis files:**

- `docs/prototype-build/catch-up/gaps.json`: items `EP-07`, `FT-07.1`, `FT-01.6`, `US-01.6.1`,
  `US-01.6.2`, `US-01.6.3`, `US-01.6.4`, `US-13.1.1`, `US-01.3.1`, `FT-01.3`, `EP-01`, `US-01.3.2`,
  `US-01.5.2`, `US-01.5.4` (the recurring-clash strands), and `dataModelDeltas` DM-02, DM-03, DM-04,
  DM-52 and DM-54.
- `docs/prototype-build/catch-up/epics/EP-01.md`: the header note (the DRAFT collision, the S2 impact
  list) and the sections for the items above plus US-01.3.2, US-01.5.2 and US-01.5.4 (the recurring
  clash) and US-01.5.5 (Phase 32's return-or-assign, for the boundary); `epics/EP-07.md` (EP-07,
  FT-07.1); `epics/EP-13.md` for US-13.1.1.
- `docs/prototype-build/catch-up/GAP-ANALYSIS.md`: theme 1 (Schedule rebuilt on Slot, List and Draft
  List), the DM-03 and DM-52 rows and their "Structural changes" notes, "Demo impact" S2,
  "Demo-trigger buttons" (Intake and drafts) and "Uncertainty" (OQ-81).
- `docs/prototype-build/catch-up/analysis/domain-model-delta.md` (DM-02, DM-03, DM-04, DM-26, DM-52,
  DM-54).
- `docs/prototype-build/catch-up/analysis/prototype-map-admin.md` (sections 1 to 4: routes and nav,
  shell derivations, Day view, the List flows), `prototype-map-store-seed.md` (sections 2, 3, 6, 7,
  8), `prototype-map-apps-mobile-web.md` (the "AA rooms" fallbacks in Forward Lists, List detail,
  week strip and availability grid; the availability confirm copy) and
  `prototype-map-shell-demo-pwa.md` (section 7, the PWA, and section 9, extension points).
- The phase docs for 15a (the To-do rail card), 15b (the rename and `LIST_STATE_LABELS`), 17 (the
  helper, the pieces and the privacy boundary), 27 (the prepayment routine), 28, 29 and 30 (their
  handoff notes for 31; 28's `clashes` and 30's `skipped` entries), and 32 (it moves a List to the
  office, and returns one from an unavailable session, through this phase's helper).
- `requirements-board/capture/ATLAS.md` (it still describes "Fitzgerald PM is at St George's with
  the surgeon TBC") and the US-01.3.1 and US-13.1.1 recipes.

**Code entry points** (paths under `aa-prototype/src/`; names are as planned by 14, 15, 15a, 15b, 17
and 28 to 30, so check the PROGRESS name maps first):

- **Model:** `domain/types.ts`: `ListState` (15b's `'ACTIVE' | 'SUBMITTED' | 'AUTHORISED'`), `List`
  (`anaesthetistId`, `slotId`, `hospitalId?`, `surgeonId?`, `notes?`, `kind`, `state`, `conflicts`,
  30's `recurringBookingId?` and `conflictClears?`), `Hospital`, `Surgeon`, `RecurringBooking`
  (`hospitalId: HospitalId | null`, `surgeonId`), the Slot types from 28, `SlotStatus` from 29;
  `domain/index.ts` exports.
- **Seed:** `domain/seed/cast.ts` (`HOSP`, `HOSPITALS`, `SURG`, the status description "Pre-op
  assessment clinic at AA rooms."), `domain/seed/recurringBookings.ts` (Phase 30's rename of
  `permanentLists.ts`: `PREOP_NOTE`, `ACUTE_NOTE`, the template rows with `null` hospital or surgeon),
  `domain/seed/canvas.ts` and Phase 28's `seedRecordedWindow` (the RNG `public` branch that sets
  `HOSP.cph` and no surgeon, kept for the seed's recorded window only; `GENERAL_SURGEONS`,
  `CES_SURGEONS`; `slotRng` from `slotHash.ts`), `domain/seed/index.ts` (the Fitzgerald Tue 21 PM
  fixup; Phase 30's seeded sickness; `SEED_MARKERS`; the masters and schedule assembly), Phase 30's
  `domain/seed/availabilityAndHolidays.ts`, `domain/seed/dayNotes.ts` ("Fitzgerald PM surgeon
  unconfirmed ..."), `domain/seed/history.ts` (the `L-HIST-*` backdrop Lists, some with no
  `hospitalId`), Phase 18's contract holders and Contracts seed (Doyle holds a surgeon Contract, the
  COS surgeon group), Phase 17's surgeon, room, pairing-preference and tier seed, the seeded Bookings
  file (`domain/seed/bookings.ts`), `domain/seed/seed.test.ts`, Phase 28's
  `domain/seed/__fixtures__/canvas-golden.json`.
- **Store:** `store/appStore.ts` (`PERSIST_VERSION`, `AppState.schedule`), `store/mutate.ts`
  (`ID_FORMATS`, `resetDomainState`, multi-meta `mutate`), `store/slotActions.ts` (28:
  `placeListOnSlot`, `moveListToSlot`, `assignListToSlot`, `setAvailability`), Phase 29's calendar
  actions and `seriesCalendarFor`, `store/lifecycle.ts` (`editList` and `ListPatch`, `editRefusal`,
  `submitList`, `authoriseList` with 15b's `listNotActive`, plus `reassignBooking` and
  `cancelBooking`), `store/bookingActions.ts` (`createBooking`, `addPostOpAddendum`),
  `store/mastersActions.ts` (30's recurring-booking actions; hospital actions; 28's horizon-extend
  setting action), `store/clockActions.ts` (`rollCanvasForward`), `store/integrationActions.ts` (S12
  and S13 targets, `ingestPdfRow`), `store/billingRun.ts` (skips Lists with no anaesthetist),
  `store/selectors.ts` (`entityCounts`, `slotViewsForDate`, `bookingsForList`),
  `store/officeStandIn.ts` (14 and 28: `authoriseAsSimulatedOffice`,
  `assignNextFreeSlotAsSimulatedOffice`), `store/demoActors.ts` (14: `OFFICE_ACTOR`,
  `OFFICE_SIMULATION_ACTOR`), `store/officePrivate.ts` (17), Phase 30's `store/conflictReconcile.ts`,
  `domain/conflicts.ts`, the recurring-booking projection and `simulateSickness`, Phase 29's
  `domain/slotStatus.ts` (`isClosed`), Phase 15a's warnings (`domain/warnings/`, `store/warnings.ts`:
  derived, `OpenWarningRow`), Phase 27's prepayment routine, `store/index.ts`.
- **Admin:** `router.tsx`, `apps/admin/routes.tsx`, `apps/admin/AdminApp.tsx` (section derivation,
  `dayLists`, the header `summary`, the review rows' "Unassigned" hospital fallback),
  `apps/admin/outlet.ts`, `components/SideNav.tsx` (`NavSection`, the badge props and `badgeTone`),
  `components/DayGrid.tsx` (`GridBlock`: the "Surgeon TBC" subtitle, the flags, the footer counts),
  `components/DayGrid.test.tsx` ("Surgeon TBC" assertions), `components/DayNav.tsx`,
  `components/RightRail.tsx` (`MiniCalendar`, 15a's To-do card, `InternalNotes`, `AwaitingReview`),
  `components/ListDrawer.tsx` (its "Unassigned" hospital fallback and the state chip that reads
  `LIST_STATE_LABELS`) or Phase 28's successor drawer, `components/pairing/` (17's pieces), `util.ts`
  (`attentionReasons` "Surgeon not yet assigned", the "Unassigned" labels), `flows/AssignListSheet.tsx`
  (28), `flows/EditListSheet.tsx` ("None (AA rooms / unassigned)"), `flows/PhoneAdviceBooking.tsx`,
  `flows/RecurringBookingSheet.tsx` (30's rename, "None (AA rooms)"), `flows/ReassignListFlow.tsx`,
  `flows/MoveBookingFlow.tsx` ("Unassigned"), the office add-Booking flow (as Phases 15, 19, 20, 20a and
  21 left it), `screens/ReviewQueue.tsx` (the table pattern), 17's `screens/masters/` (Hospitals,
  30's `RecurringBookingsView`), Phase 30's `screens/ConflictsScreen.tsx`,
  `screens/IntegrationMonitorScreen.tsx`, `screens/BillingMonitorScreen.tsx`, `tableChrome.ts`.
- **Mobile and web readers of the "AA rooms" fallback:**
  `apps/mobile/screens/ForwardListsScreen.tsx`, `ListDetailScreen.tsx`, `BookingDetailScreen.tsx`,
  `AvailabilityScreen.tsx` or Phase 29's calendar; `apps/web/screens/ListsScreen.tsx`,
  `ListDetailView.tsx`, `BookingDetailView.tsx`, `AvailabilityGrid.tsx` or Phase 29's web calendar,
  `apps/web/components/WeekStrip.tsx`; `apps/admin/screens/ReviewScreen.tsx`,
  `AdminBookingDetail.tsx`.
- **Shared:** `shared/format.ts` (name helpers, `sessionTimeRange`, 15b's `LIST_STATE_LABELS`),
  `shared/audit/actionLabels.ts`, `shared/audit/fieldLabels.ts`, `shared/audit/auditNarrative.ts`,
  `shared/demoTriggers/registry.ts` and `context.ts` (14), `shared/DemoBadge.tsx`.
- **Demo and PWA:** `apps/demo/DemoControlPanel.tsx` (`SCENARIOS` S2 text; the trigger index is
  generated from the registry), `apps/demo/DemoData.tsx` (entity counts and 15b's state filter chips),
  `pwa/PwaDemoActions.tsx` (14), `pwa/pwaPurity.test.ts`, `apps/officePrivacy.test.ts` (17); outside
  `src/`: `aa-prototype/visual/admin-phase06.spec.ts`, `aa-prototype/visual/pwa-device.spec.ts`.

## Work items

### Session 1: the model and the DRAFT state, the pairing rule, the seed, the store and the recurring clash

1. **Baseline.** Run `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots`, and
   record the counts. Keep `visual/shots/` as the before set. Grep `src` for `'DRAFT'`: after 15b the
   only hits should be the Xero ACCPAY "DRAFT" status and similar non-List uses. Any List-state
   `'DRAFT'` left with the old meaning is a bug to fix before work item 2.

2. **Types and the DRAFT state** (`domain/types.ts`). DM-52, DM-03, EP-07, FT-07.1, US-01.3.1,
   US-01.6.1.
   - `ListState` becomes `'DRAFT' | 'ACTIVE' | 'SUBMITTED' | 'AUTHORISED'`, with the comment: the
     catalogue's lifecycle (EP-07, FT-07.1, AR-22): DRAFT is a Draft List (no anaesthetist, no Slot);
     ACTIVE is a List with all five of its pairing, where the anaesthetist completes and submits; a
     List set up with its anaesthetist starts ACTIVE; an ACTIVE List that goes back to the office is
     DRAFT again; no Returned state.
   - A Draft List **is a List**: no separate collection, so Bookings attach through the List id
     unchanged and assignment keeps the id. Split the List type on its state:

     ```ts
     type DraftOrigin =
       | 'request'          // the office logs a surgeon's room request (this phase)
       | 'recurringClash'   // a recurring booking on a closed session (this phase, OQ-81 part 2)
       | 'movedToOffice'    // an anaesthetist moves or withdraws their List to the office (Phase 32)
       | 'unavailableReturn' // they mark a booked session unavailable and return it (Phase 32, US-01.5.5)
       | 'hospitalRow'      // a matching-screen row (Phase 33)
     type RequestSource = 'phone' | 'email' | 'pdf' | 'other'

     interface DraftTrail {
       origin: DraftOrigin
       source?: RequestSource            // origin 'request' only
       sinceISO: IsoDateTime             // created, or returned to the office; drives waiting time
       by: string                        // actor.who
       fromAnaesthetistId?: AnaesthetistId // 'recurringClash' (the recurring booking's anaesthetist), 'movedToOffice', 'unavailableReturn'
       projectedFor?: { recurringBookingId: RecurringBookingId; dateISO: IsoDate; session: Session }
                                         // 'recurringClash' only: the day it stands for; never changed by a re-date
       assignedAtISO?: IsoDateTime       // set on assignment; the trail is kept
       assignedBy?: string
     }

     interface ListBase {               // today's List fields, less the anaesthetist, Slot and state
       id: ListId
       hospitalId: HospitalId            // now required (US-01.3.1)
       surgeonId: SurgeonId              // now required (US-01.3.1)
       dateISO: IsoDate
       session: Session
       kind: ListKind
       conflicts: ListConflict[]
       notes?: string
       draft?: DraftTrail                // present on a Draft List, kept after assignment
       removedAtISO?: IsoDateTime        // a removed Draft List (US-01.6.4); soft, audited
       removedBy?: string
       removeReason?: string
     }
     interface AssignedList extends ListBase {
       state: 'ACTIVE' | 'SUBMITTED' | 'AUTHORISED'
       anaesthetistId: AnaesthetistId
       slotId: SlotId
     }
     interface DraftList extends ListBase {
       state: 'DRAFT'
       anaesthetistId?: undefined
       slotId?: undefined
       draft: DraftTrail
     }
     type List = AssignedList | DraftList
     ```

     The `DraftList` doc comment states the rules: state DRAFT, no anaesthetist, no Slot; hospital,
     surgeon, day and session required; may hold Bookings; never offered to anaesthetists and assigned
     only by the office (OQ-44; FT-01.6; OQ-86 answered no, D46). A recurring-clash Draft List keeps
     Phase 30's `recurringBookingId` as its provenance. The `AssignedList` doc comment states EP-01's
     and FT-07.1's rule: exactly one surgeon, one anaesthetist and one hospital, plus the day and
     session of its Slot; with all five it is ACTIVE.
   - Guards in `domain/draftLists.ts`: `isDraftList(list)` (state DRAFT and not removed),
     `isAssignedList(list)` (state is not DRAFT), `isRemoved(list)`. Phase 28's Slot views
     (`listInSlot`, `slotViewsForDate`, `slotViewsForAnaesthetist`) return `AssignedList`, so the
     anaesthetist apps never meet a Draft List.
   - **One label home.** 15b's `LIST_STATE_LABELS` in `shared/format.ts` gains `DRAFT: 'DRAFT'`
     (read from the terms module, work item 3), shown only on a Draft List beside its "Unassigned"
     flag. 15b's Data Inspector chips and counts gain DRAFT from the union. No List is ever labelled
     "Open".
   - `RecurringBooking.hospitalId` and `surgeonId` (Phase 30's rename of `PermanentList`) become
     non-null. A template projects Lists, so it must satisfy the rule too.
   - `Hospital` gains `locationType: 'hospital' | 'aaRooms'`. Its doc comment: a List's location is a
     hospital or AA's own rooms. The pre-op clinic is held at AA rooms, which is a location, not a
     hospital, and is never a Contract holder, a hospital feed or a sync target.
   Let the compiler list every reader that relied on the optional hospital and surgeon, on a present
   anaesthetist, or on a three-value `ListState`; work item 13 fixes them.

3. **Pure rules and terms** (`domain/listPairing.ts`, `domain/draftLists.ts`, no React, exported from
   `domain/index.ts`; `shared/scheduleTerms.ts`), with `domain/listPairing.test.ts` and
   `domain/draftLists.test.ts`. The file is `listPairing.ts`, not `pairing.ts`, so it is never
   confused with Phase 17's `pairingPreferences.ts`; neither imports the other.
   - `pairingIssues({ hospitalId, surgeonId }, masters)` returns plain-language issues:
     - "Choose the hospital." when the hospital is missing;
     - "Choose the surgeon." when the surgeon is missing;
     - "That hospital is not in the master data." and "That surgeon is not in the master data." for
       unknown ids.
     It returns an empty array when the pairing is complete. This is the **one** implementation of
     US-01.3.1, for Lists and Draft Lists alike. Every store path in work items 8 to 10 calls it, and
     nothing checks the pairing inline. Beside it, `isActivePairing(list)` (anaesthetist, Slot, day,
     session, hospital and surgeon all present) is the one FT-07.1 test the store invariant uses.
   - `compareDraftLists(a, b)`: the one order for Draft Lists everywhere (US-01.6.2 "sorted in
     ascending date order", soonest first): date ascending, then AM before PM, then `draft.sinceISO`
     (the longer wait first), then id. The page, the rail card, the band's lanes and the PWA stand-in's
     pick all sort through it.
   - `waitingMinutes(list, nowISO)` returns whole minutes from `draft.sinceISO` to `nowISO`, or to
     `draft.assignedAtISO` or `removedAtISO` once it is no longer waiting (so a finished one shows how
     long it waited, and that figure never grows). Parse ISO strings with date-fns; never `new Date()`.
   - `draftListAvailability({ list, anaesthetists, slotViews, statuses })` returns **everybody
     potentially available** for the Draft List's day and session by availability only (US-01.6.3's
     note, the same reading as the availability finder, US-01.4.2), with no preference or tier
     knowledge (so this file stays outside Phase 17's privacy allowlist):
     - `free`: the Slot for the List's day and session is empty and `isOpenForBooking` (29's
       `isOpenSlot`);
     - `notAvailable`: empty and `isClosed` (the seeded Unavailable and Holiday, or any closed status
       an admin adds); each row keeps its status label;
     - `occupied`: the Slot already holds a List, with that List's id.
     Only active anaesthetists are included. There is no emergency group (see the drift check). A
     recurring-clash Draft List's `fromAnaesthetistId` appears where their session puts them
     (normally `notAvailable`). The not-preferred grouping, preferred marks and tier order are applied
     on top of `free` and `notAvailable` by Phase 17's `rankAnaesthetistCandidates` in the Admin sheet
     (work item 17), never here.
   - `recurringClashDraft(clash, recurringBooking, nowISO, by)`: turns one clash (Phase 28's
     generator `RecurringClash` or Phase 30's `skipped` plan entry, normalised to one shape: a session
     the recurring booking covers whose Slot is closed) into the fields of a Draft List: state DRAFT,
     the recurring booking's hospital, surgeon, kind, notes and times, the day and session,
     `recurringBookingId`, no anaesthetist, no Slot, and a `draft` trail with
     `origin: 'recurringClash'`, `fromAnaesthetistId` the recurring booking's anaesthetist,
     `projectedFor` (the recurring booking, day and session it stands for), `sinceISO` and `by`. Its id
     is derived and stable, `recurringClashListId(recurringBookingId, dateISO, session)` (for example
     `LD-RB014-2026-07-22-AM`), so running the projection twice never makes a second Draft List. It
     returns `null` for a day before today (history is never rewritten) and when the recurring booking
     is not `activeOn` that day. This is the one rule for OQ-81 part 2; there is no constant and no
     switch.
   - `shared/scheduleTerms.ts` holds every user-facing Draft List word, so the three apps cannot drift:
     `DRAFT_LIST` ("Draft List"), `DRAFT_LISTS` ("Draft Lists"), `UNASSIGNED` ("Unassigned"),
     `DRAFT_STATE` ("DRAFT", which `LIST_STATE_LABELS` reads), `ORIGIN_LABELS` ("Request", "Recurring
     booking, anaesthetist unavailable", "Moved to the office", "Returned: anaesthetist unavailable",
     "Hospital row"), `SOURCE_LABELS` (Phone, Email, PDF, Other). Every screen, pill, nav item, audit
     label and message reads from it. A test greps `src/apps` and `src/shared` for the literal strings
     "Draft List" and "Unassigned" outside this module and expects none, and checks that no string in
     the module, or in the new Draft List screens and sheets, contains "slot" in any case (OQ-64). If
     Phase 28 added a wider "no slot in app copy" check, extend it instead of adding a second one.
     Pairing and tier words stay in Phase 17's `PAIRING_LABELS` and `TIER_LABELS`.
   - Tests:
     - `pairingIssues` covers every case; `isActivePairing` is true only with all five;
     - `compareDraftLists` orders by date, then session, then wait, then id, and is stable;
     - waiting minutes before and after assignment and removal;
     - the availability groups are exhaustive with nobody lost or duplicated, in stable roster order;
     - an admin-added closed status lands in `notAvailable` and a bookable one in `free`, each with
       its own label;
     - an occupied session is never in a selectable group;
     - `recurringClashDraft`: state DRAFT, the fields copy the recurring booking, the id is stable, a
       past day and an inactive recurring booking give `null`, and a generator clash and a projection
       `skipped` entry for the same session give the same record;
     - no message contains an en or em dash, or the word "slot".
   - `shared/format.ts` gains `waitingLabel(minutes)`:
     - under an hour: "45 min";
     - under a day: "16 h", whole hours;
     - otherwise: "3 d 22 h", dropping "0 h".
     Also add `locationName(hospitalId, masters)`, which returns the record's name ("AA rooms" for the
     location), and `pairingLine(list, masters)` ("Forte Health · Mr V. Nand"). Test all three in
     `format.test.ts`.

4. **Location record and a complete pairing on every seeded List** (US-01.3.1, FT-01.3). This is a
   deliberate seed content change.
   - `cast.ts`: `HOSP.aaRooms = 'H-AAROOMS'` and a `HOSPITALS` row
     `{ id: 'H-AAROOMS', name: 'AA rooms', locationType: 'aaRooms', contactEmail: 'rooms@aa.example' }`
     (fictional `.example` address, as Phase 17 did). Every other hospital gets
     `locationType: 'hospital'`. AA rooms is not a contract holder: Phase 18's holder seed and picker
     never list it.
   - `recurringBookings.ts` (Phase 30's rename of `permanentLists.ts`):
     - each pre-op template takes `HOSP.aaRooms`;
     - every template with a `null` surgeon names one. At plan time that is 16 rows: 4 pre-op, 8
       public "Acute theatre" and Dr Ropata's 4 public "Elective ortho" rows (no safe surgeon is
       orthopaedic, since Mr T. Hale is excluded below; pick one and record it). Pick existing
       surgeons that are no Contract holder and in no holder group (not Mr T. Hale, in the COS group;
       not Mr P. Doyle, a surgeon Contract holder) and in no active pairing preference (not Ms A.
       Reid, not preferred with Dr Sharma; not Mr J. Whitford, preferred with Dr Sharma): Ms K. Patel,
       Mr S. Tan, Mr V. Nand or Ms H. Cameron, as long as Phase 17's seed left them clear.
     `PREOP_NOTE` and `ACUTE_NOTE` stay as the Lists' notes.
   - The RNG `public` (acute) placements: since Phase 28 the slot RNG runs only in the seed's
     recorded demo window (`seedRecordedWindow`), and generation draws nothing. There, an acute
     placement picks its on-call surgeon from a new `ACUTE_SURGEONS` constant through a **separate**
     stream, `slotRng(seed, 'acute', ...)`, so the `'fill'` stream's draws, and so every other
     placement and every Booking, are unchanged. Do not touch `GENERAL_SURGEONS` or `CES_SURGEONS`.
   - `history.ts`: every `L-HIST-*` backdrop List gets a hospital. Use the account's `hospitalId`
     where it has one. For the patient-, billable-party- and COS-counterparty rows that have none, use
     the hospital the procedure plausibly ran at (the implementer picks and lists them), or AA rooms.
     Backdrop invoices must not change amounts.
   - **Proof:**
     - regenerate Phase 28's golden fixture, and diff old against new with a small script. The only
       differences are: pre-op Lists gain the AA rooms hospital and a surgeon; public (acute and
       elective) Lists gain a surgeon; Fitzgerald Tue 21 PM becomes an empty Slot (work item 5); the
       recurring-clash Draft Lists appear (work item 5), with no Slot changed by them;
     - every Booking id, List id and every other placement is unchanged;
     - the existing fee and billing tests (`seedBilling.test.ts`, the Phase 18 to 25 fee parity, price
       precedence and snapshot tests, `demoScenarios.test.ts`) pass with **no amount moving**. A
       pre-op Booking's Contract is held on its Procedure (Phase 20), so moving its List from a null
       hospital to AA rooms changes no Contract and no price; if Phase 20's picker test shows a
       different candidate set for a pre-op Booking, AA rooms was wrongly treated as a hospital
       holder: fix that, not the seed. If a surgeon pick changes a Contract's fit, choose another.

5. **The seed's Draft Lists** (US-01.6.1, US-01.6.2, US-01.3.2 AC2).
   - `seed/index.ts`: delete the Fitzgerald Tue 21 PM fixup (Phase 28's successor to `patchSlot`), so
     that Slot is empty and available (no note).
   - A new `domain/seed/draftLists.ts` exports `SEED_DRAFT_LIST_IDS` and `SEED_DRAFT_LISTS`: request
     Draft Lists in `state: 'DRAFT'` with no anaesthetist and no Slot, `kind: 'private'`,
     `draft.origin: 'request'`, `draft.by: 'Kirsty W.'`, fixed ISO timestamps (never the clock):

     | id | Hospital | Surgeon | Day, session | Source | Since | Waiting at 08:00 | Bookings | Note |
     |---|---|---|---|---|---|---|---|---|
     | `LD-001` | St George's | Mr S. Tan | Tue 21 Jul PM | phone | 2026-07-20 15:40 | 16 h | 0 | "St George's booking office needs an anaesthetist" |
     | `LD-002` | Forte Health | Mr V. Nand | Wed 22 Jul PM | email | 2026-07-20 17:10 | 14 h | 2 | "Emailed by Mr Nand's secretary" |
     | `LD-003` | Christchurch Eye Surgery | Ms A. Reid | Mon 27 Jul AM | pdf | 2026-07-17 09:50 | 3 d 22 h | 0 | "PDF from the rooms, cataract list" |

     `LD-002` holds **two seeded Bookings** (US-01.6.1 "Bookings allowed"), appended after every
     existing seeded Booking with pinned ids, in the shapes the earlier phases left: each Procedure
     has a procedure from Phase 19's list, its source wording as received from the secretary's email
     (Phase 20a's field), and a Contract (No contract (RVG), Phase 20); the payer on the Booking is the
     patient (Phase 21). Choose procedures that are in no anaesthetist's prepaid set, so no
     prepayment, warning or fee figure elsewhere moves. `LD-002` must fit Dr Souter's pinned free Wed
     22 PM (the PWA stand-in's first pick) and is at Forte Health, not Southern Cross, so it neither
     duplicates Dr Beaumont's recurring-clash Draft List that afternoon nor sits in Phase 30's
     Southern Cross Wed 22 closure. `LD-003` is the long-wait example; its surgeon, Ms A. Reid, is not
     preferred with Dr Sharma (Phase 17's seed), so assigning it also shows the not-preferred group. If
     Phase 28's or 30's seed changed which sessions are free, pick days and sessions that keep these
     properties and record them.
   - **Recurring-clash Draft Lists in the seed** (OQ-81 part 2). The seed's generation runs Phase 28's
     generator and Phase 30's projection and turns every clash from today onward into a Draft List
     through `recurringClashDraft`, with `by: 'System'` (the engine actor's name) and `sinceISO` the
     seed's notional overnight paint run, `'2026-07-21T00:05'` (a fixed constant beside the other seed
     stamps, never the clock), so they read "7 h" at 08:00 and sort after the request Draft Lists on
     the same session. Days before today get none (the backdrop is history; their Slots keep their
     status, as today). The seed follows exactly the rule the store follows (work item 9), so
     `projectAllRecurringBookings` over a fresh seed creates nothing new. At plan time today's
     availability windows and recurring bookings give **12** of them (recompute after Phases 28 to
     30 and record the list):

     | Anaesthetist (status) | Days and sessions | Hospital · surgeon |
     |---|---|---|
     | Ngata (Unavailable, ICU on call) | Tue 21 Jul AM | Christchurch Public · acute theatre, its named on-call surgeon (work item 4) |
     | Beaumont (Holiday to Sun 26) | Wed 22 Jul AM and PM | Southern Cross · Ms K. Patel (both carry Phase 30's `HH900` holiday conflict) |
     | Beaumont | Fri 24 Jul AM | Christchurch Eye Surgery · Mr J. Whitford |
     | Ngatai (Holiday to Tue 28) | Wed 22 Jul AM | Christchurch Eye Surgery · Ms A. Reid |
     | Ngatai | Mon 27 Jul PM | Southern Cross · Ms K. Patel |
     | Ropata (Holiday 24 to 28 Aug) | Tue 25 and Thu 27 Aug, AM and PM | Christchurch Public · Elective ortho, its named surgeon |
     | Sharma (Holiday 14 to 16 Sep) | Tue 15 Sep AM; Wed 16 Sep PM | Christchurch Public · acute; Southern Cross · Ms K. Patel |

     With the three requests that is **15 seeded Draft Lists** (the nav badge), two on Tue 21 Jul (the
     band and the header) and four on Wed 22 Jul. Their Slots keep their closed status, and none
     carries an availability conflict (US-01.5.4 AC3).
   - **Phase 30's seeded sickness stays as Phase 30 left it.** Dr Rutherford's Wed 22 AM Slot is
     Unavailable ("Unwell, short notice"), recorded by the office after the List existed, and his
     Christchurch Eye Surgery List stays in it, ACTIVE and flagged, on the Conflicts screen
     (office-recorded sickness stays a conflict while OQ-81 part 3 is open). It is not from a
     recurring booking, so the clash rule never touches it; a seed test proves it.
   - `dayNotes.ts`: the Fitzgerald note becomes "St George's PM request, no anaesthetist yet (Draft
     List)." (through the terms module where it renders).
   - `SEED_MARKERS` gains the Draft Lists, so `/demo/data` can find them.
   - Seed tests (`seed.test.ts`):
     - every Draft List is state DRAFT, its hospital and surgeon resolve, and none has an anaesthetist
       or a Slot; every other List is ACTIVE, SUBMITTED or AUTHORISED with an anaesthetist and a Slot;
     - the request Draft Lists change no Slot: the Slots are identical with or without
       `SEED_DRAFT_LISTS`;
     - Fitzgerald Tue 21 PM is an empty, open Slot;
     - `LD-002` holds two active Bookings, each Procedure with its source wording, a procedure, a
       Contract and the patient as payer, and fits Souter's open Wed 22 PM;
     - every recurring booking `activeOn` a today-or-later day whose Slot is closed has exactly one
       Draft List for that day and session, with its `recurringBookingId`, and none has an
       availability conflict; no past day has one;
     - Rutherford's Wed 22 AM List is still in his Slot and flagged, as Phase 30 seeded it;
     - **every** List, Draft Lists and backdrop included, has a hospital and a surgeon that resolve,
       and every List with an anaesthetist has a Slot (the pairing invariant);
     - the S2 not-preferred beat is reachable: the canned Reid request in work item 22 falls on a day
       where Dr Sharma's session is open, so Sharma appears in the "Not preferred with Ms Reid" group;
     - two builds deep-equal.

6. **Store core** (`appStore.ts`, `mutate.ts`):
   - no new collection: Draft Lists live in `schedule.lists`. Runtime Draft Lists take ids from the
     existing List allocator (`LG####`); the seed's `LD-` ids never collide with it;
   - **bump `PERSIST_VERSION` by one**, with the comment line "Phase 31: the DRAFT state; Draft Lists
     are Lists with no anaesthetist (requests and recurring clashes); every List carries a hospital and
     a surgeon; AA rooms is a location", and extend `persistMigrate.test.ts` (an older payload reseeds
     rather than loading Lists without a hospital or surgeon);
   - `entityCounts` gains `draftLists` (live Draft Lists).

7. **Selectors** (`store/selectors.ts`), memoised on the `schedule.lists` record reference as the
   file's header requires:
   - `waitingDraftLists(state)`: live Draft Lists in `compareDraftLists` order, ascending date
     (US-01.6.2 "Sorting"; "nothing waits unnoticed");
   - `draftListsForDate(state, dateISO)` (US-13.1.1), in the same order;
   - `waitingDraftListCount(state)` (the nav badge and the rail card heading);
   - `finishedDraftLists(state)`: Lists with a `draft` trail that were assigned, and removed Draft
     Lists, newest first, for the page's History tab;
   - `draftListAvailabilityFor(state, listId)`, which feeds work item 3's pure function from the Slot
     views, statuses and anaesthetists (no preferences);
   - `bookingCountsByList(state)`: active (not cancelled) Bookings per List id, for the grid, the band
     and the rail card;
   - every existing selector that iterates `schedule.lists` for an anaesthetist, a day grid row or a
     review queue skips removed Lists and, where it needs an anaesthetist, Draft Lists. A test asserts
     no anaesthetist-scoped selector ever returns a Draft List or a removed List (OQ-86, D46).

8. **Draft List actions** (a new `store/draftListActions.ts`, exported from `store/index.ts`, plus
   internal helpers in `store/slotActions.ts`). Every write goes through `mutate()` with before and
   after, timestamps from the clock, office only (`officeOnly`) and refused for the integration actor.
   `store/draftListActions.ts` is an office write path that records the not-preferred
   acknowledgement, so add it to the allowlist in Phase 17's `officePrivacy.test.ts` beside
   `store/lifecycle.ts`; it reads the office slice through the pure helper and never imports
   `store/officePrivate.ts`, so the PWA closure check stays green.
   - **Internal helpers in `slotActions.ts`** (not exported from the package index):
     - `attachListToSlot(s, listId, slotId)`: sets `slotId` and the denormalised `anaesthetistId`,
       `dateISO` and `session` from the Slot (Phase 28's invariant) and the state **ACTIVE**, and
       returns the draft for the caller's meta. The List keeps its id, Bookings, notes and conflicts.
     - `insertDraftList(s, fields, trail)`: the one way a new Draft List record is written (state
       DRAFT), used by `createDraftList` and by the recurring clash (work item 9). It never touches
       `schedule.slots` or another List.
     - `detachListToDraft(s, listId, { origin, by, fromAnaesthetistId })`: the one **ACTIVE to DRAFT**
       transition (EP-07). It refuses `notActive` for a SUBMITTED or AUTHORISED List (only an ACTIVE
       List goes back to the office); otherwise it sets the state DRAFT, clears `slotId` and
       `anaesthetistId`, writes a fresh `draft` trail (`sinceISO` from the clock), moves any Slot time
       override back to the Slot's defaults, drops availability conflicts and keeps holiday ones. The
       vacated Slot keeps whatever status the caller set. A List projected from a recurring booking
       keeps its `recurringBookingId` (Phase 30's provenance) on the Draft List. **This is the one way
       an assigned List becomes a Draft List**: Phase 32's move or withdrawal to the office
       (`origin: 'movedToOffice'`) and its "return to the office" choice when a booked session is
       marked unavailable (`origin: 'unavailableReturn'`, US-01.5.5) both call it. No screen in this
       phase does; it is built and unit-tested here for 32. It re-triggers no prepayment calculation
       (US-06.3.5, D20).
   - **`createDraftList(api, actor, { hospitalId, surgeonId, dateISO, session, kind?, note?, source? }, origin = 'request')`**
     (US-01.6.1). `source` (phone, email, PDF, other) is required for origin `'request'` only, so
     Phase 33's `'hospitalRow'` call passes none. It refuses:
     - `pairingIncomplete`, carrying `pairingIssues`' messages (AC "Required": hospital and surgeon);
     - `invalidSession` and `dateRequired` (AC "Required": day and session);
     - `datePassed`, for a day before today;
     - `outsideCanvas`, for a day beyond Phase 28's horizon setting ("That day is beyond the
       schedule, which runs 4 months ahead.", the figure read from the setting).
     `kind` defaults to private; pre-op defaults the location to AA rooms in the sheet. It allocates
     `LG####`, writes through `insertDraftList` with `state: 'DRAFT'`, `conflicts: []` and the `draft`
     trail, audits `draftList.create` and returns `{ listId }`. **It never touches `schedule.slots` or
     any other List** (AC "Takes no Slot"), and it needs no anaesthetist (AC "No anaesthetist
     needed"). Phase 30's reconcile raises a `holiday` conflict if its hospital is closed that day, as
     on any List.
   - **Editing.** Hospital, surgeon, kind and note go through the existing `editList` (a Draft List is
     a List); the pairing refusal in work item 10 applies. `editRefusal` lets the office edit a DRAFT
     List and refuses an anaesthetist (`notOwnList`).
   - **Bookings on a Draft List** (US-01.6.1 "Bookings allowed"). The office add-Booking flow,
     `createBooking`, `reassignBooking` and `cancelBooking` already work on any List id for the office.
     Check they do for a DRAFT List: `editRefusal` lets the office through and refuses an anaesthetist,
     which is right. `reassignBooking` may move a Booking to or from a Draft List (office only).
     Nothing new is written except tests. Phase 15a's rules that need the anaesthetist skip the
     Booking until assignment (work item 13).
   - **Prepayment on a Draft List** (US-06.2.1, US-06.3.5, US-06.5.4, D20). A Booking on a Draft List
     has no anaesthetist, so no prepaid set is known: Phase 27's routine must treat it as "not known
     yet" (no invoice generated, nothing withdrawn); if it throws there, guard it in 27's code and
     test it. **Built default, logged for the owner:** assigning a Draft List gives a Booking that has
     **never had an anaesthetist** its first one, which is its setup, not a move; for each such Booking
     `assignDraftList` runs 27's routine once after the commit with 27's `listAssigned` cause (use the
     name 27 shipped; so a prepaid procedure on a person-paid Booking generates its invoice and draft pair at
     the new anaesthetist's own price, as at any setup). A Booking that already had an anaesthetist (a
     List Phase 32 returned to the office and the office reassigns) is a move: nothing is
     re-triggered (honour system); its payee repoint is Phase 41's (OQ-80, D38). Re-dating a Draft
     List changes no Procedure, Contract or payer, so it runs nothing.
   - **`redateDraftList(api, actor, listId, { dateISO, session })`** (US-01.6.4 "edits its date ...
     shows on the new day"). Refuses `notDraftList`, `datePassed`, `outsideCanvas`, `invalidSession`
     and `sameDay`. The waiting time is unchanged (`sinceISO` stays). Its Bookings go with it. Audits
     `draftList.redate` with before and after `{ dateISO, session }`; Phase 30's reconcile
     re-evaluates its holiday conflict.
   - **`removeDraftList(api, actor, listId, reason?)`** (US-01.6.4 "it no longer shows and the
     removal is recorded"). Refuses `notDraftList` and `hasBookings` while it holds an active Booking
     ("Move or cancel its 2 Bookings first."), so no Booking is ever orphaned. The reason is optional
     (closing with a reason was not discussed); the sheet offers chips. It soft-removes
     (`removedAtISO`, `removedBy`, `removeReason`; the state stays DRAFT), audits `draftList.remove`,
     and the List leaves every view except the page's History tab.
   - **`assignDraftList(api, actor, listId, { anaesthetistId })`** (US-01.6.3). The Slot is
     `slotFor(anaesthetistId, list.dateISO, list.session)`. It refuses:
     - `notFound`, `notDraftList`, `anaesthetistNotFound` and `anaesthetistInactive`;
     - `datePassed` ("This Draft List's day has passed. Change its date or remove it.");
     - `pairingIncomplete` (defensive; a Draft List cannot be saved without both);
     - `slotOccupied` ("Dr X already has a List that session. Resolve it first.") (AC "Slot must be
       free").
     It **never refuses** a closed Slot (Unavailable, Holiday or any closed status) or a not-preferred
     pairing. Those are soft warnings (US-01.6.3, US-01.3.5, US-01.5.2). On success, in **one**
     `mutate()` commit with these metas:
     - `draftList.assign`: before `{ state: 'DRAFT', anaesthetistId: null, slotId: null }`, after
       `{ state: 'ACTIVE', anaesthetistId, slotId }`, through `attachListToSlot`; the `draft` trail
       gains `assignedAtISO` and `assignedBy` and is kept (US-01.6.3 "Becomes active", "Audited");
     - `list.pairingAcknowledged`, when Phase 17's `notPreferredWarning` returns an entry (17's rule,
       `after: { anaesthetistId, surgeonId, pairingPreferenceIds }` from `notPreferredEntryIds`); a
       preferred pairing writes nothing;
     - on a closed session, Phase 30's availability conflict on the List (a Booking landing on a
       session already marked unavailable, US-01.5.2 AC1), and at a hospital with a holiday that day,
       its `holiday` conflict (already there from creation). Both come from 30's reconcile inside
       `mutate()`, not from code in this action. A bookable Slot writes no conflict.
     Then the prepayment step above runs for its never-assigned Bookings. 15a's warnings are derived
     on read, so they pick up the anaesthetist with no extra call. The List leaves every "Unassigned"
     view (AC "stops being shown as unassigned"). Returns `{ listId, warnings: string[] }`.
   - **`draftListFitsAnaesthetist(state, listId, anaesthetistId)`** (exported from this file): true when
     the session is free and the pairing has no active not-preferred entry. It returns a boolean and
     no names, so the PWA stand-in (work item 22) can skip a not-preferred pairing without ever seeing
     one.
   - **Guards elsewhere.** `submitList` and `authoriseList` refuse a DRAFT List through 15b's
     `listNotActive` with the Draft List message "Assign an anaesthetist first.". The billing run skips
     any List with no anaesthetist, with a dev assertion that none is ever SUBMITTED.
   - **Projection never overwrites.** Phase 28's projected List ids are derived from the Slot. A List
     that becomes a Draft List (Phase 32's detach) keeps that id, so a later projection into the same
     Slot (Phase 30's repopulation, `rollCanvasForward`, `addAnaesthetist`) must allocate `LG####`
     when the derived id is taken, never overwrite. Add the check in the projection path and a test.
   - **No double projection.** A recurring-clash Draft List, and a Draft List detached from a
     projected List, keep their `recurringBookingId`. Phase 30's projection
     (`projectRecurringBookingChange`, `projectAllRecurringBookings`, so also "Apply to canvas now")
     counts any live List with that id on that day and session, a Draft List or one since assigned to
     anyone, as the recurring booking's List for that day, so it never projects a second List for the
     same surgeon when the anaesthetist opens the session again. Assigning keeps the id (it is not one
     of 30's id-clearing edits). A recurring-clash Draft List also answers for the day in its
     `draft.projectedFor`, even after the office re-dates it or removes it, so neither "Apply to
     canvas now" nor a roll forward brings a second one back for that day. Any other removed Draft
     List no longer counts. Test each.

9. **The recurring clash** (OQ-81 part 2, settled in the room; US-01.3.2 AC2, US-01.5.2 AC3,
   US-01.5.4 AC3, US-01.1.1; FT-01.6's recurring-booking origin). Built as the answer: no constant, no provisional
   label.
   - **Painting order** (OQ-81 part 1): confirm, and assert in a test, that generation, the roll
     forward, the horizon extend, an earlier start date and Phase 30's projection paint the
     anaesthetist's availability (29's statuses, with `seriesCalendarFor` passing the series onto the
     new days in the generator's calendar step) before any recurring booking, so a closed session
     comes out as Phase 28's `RecurringClash` or Phase 30's `skipped` entry and is never placed and
     flagged. If the build left any path that places a recurring-booking List and then closes the
     session over it (an after-the-fact `'flag'`), fix it at the source (paint first) or replace that
     branch with the Draft List (drop the placed List, which has no Bookings yet, and insert the clash
     Draft List).
   - **Every path that yields clashes turns them into Draft Lists**, in the same `mutate()` commit,
     through `recurringClashDraft` and `insertDraftList`, each audited `draftList.fromRecurringClash`
     (after: the recurring booking, day, session, hospital, surgeon and the anaesthetist who is
     unavailable):
     - `addRecurringBooking`, `editRecurringBooking` and `applyRecurringBookingsToCanvas` (Phase 30's
       "Apply to canvas now"), over tomorrow to the horizon's far end, so **adding or editing a
       recurring booking for an anaesthetist who is already on leave produces Draft Lists through
       normal use**;
     - the roll forward on every clock advance (`rollCanvasForward`, through 28's
       `generateCanvasForDates` and its `clashes`), as the actor the clock already uses for
       generation, with one batch meta per roll rather than one per Draft List when several land;
     - 28's horizon-extend setting action (FT-01.1, "extending fills them in") and 29's earlier start
       date on `editAnaesthetist`, which generate new Slots the same way;
     - the seed's generation (work item 5), through the same function.
     A session already answered for (a live Draft List, or one the office re-dated or removed, whose
     `draft.projectedFor` matches; work item 8) is not re-created.
   - **What a clash Draft List is not:** it writes no availability conflict and never reaches Phase
     30's Conflicts screen for the anaesthetist (US-01.5.4 AC3: "it shows as a Draft List, not as a
     conflict on the anaesthetist"); the anaesthetist's Slot keeps its closed status and their mobile
     and web schedule are unchanged. A hospital closure that day still raises Phase 30's `holiday`
     conflict on it, like any List.
   - **When the recurring booking changes later** (Phase 30's update, remove and retire):
     - a clash Draft List with no active Bookings is treated like an empty projected List: an edit
       updates its hospital, surgeon, kind and notes; a retire or a move to another weekday, session
       or anaesthetist soft-removes it (`removeReason: 'Recurring booking changed'`, audited
       `draftList.remove`, actor the office user who changed it);
     - one holding Bookings is kept, and the plan's kept line says why ("has Bookings").
   - **When the session reopens** (the anaesthetist marks it available again): the Draft List stays
     where it is, for the office to resolve; it may assign it back to the same anaesthetist, who now
     shows as Free. Nothing reverses on its own.
   - **Phase 30's skipped wording.** The recurring-booking sheet's preview and result lines (which
     Phase 30 left neutral, "not painted: the anaesthetist is unavailable") now say "2 sessions go to
     Draft Lists: the anaesthetist is unavailable", each date listed with a link to the Draft List.
     No "slot" in the copy.
   - **Not here:** an anaesthetist marking a booked session unavailable keeps Phase 30's conflict flag
     until Phase 32 offers return or assign (US-01.5.5); Phase 30's `simulateSickness` (an
     office-recorded short-notice sickness, OQ-81 part 3 open) keeps its conflict, and only its
     `choices` change: they skip Draft Lists, which have no anaesthetist to fall sick (work item 22).
   - Tests (Phase 30's projection tests, `mastersActions.test.ts`, a new `clockActions.test.ts` (none
     exists today; Phase 28 or 30 may have added one),
     `draftListActions.test.ts`):
     - adding a recurring booking for Dr Beaumont on Thursday AM while she is on Holiday makes a Draft
       List for Thu 23 Jul and ACTIVE Lists for the later Thursdays, in one commit;
     - a roll forward onto a day whose session is already closed (a series day, or a one-off set
       ahead) makes one Draft List with `sinceISO` from the clock, and no List flagged on the
       anaesthetist; a second roll or an "Apply to canvas now" makes no second one;
     - a horizon extend over a series-closed recurring-booking day does the same;
     - re-dating or removing a clash Draft List does not bring it back on the next apply;
     - an edit updates an empty clash Draft List and keeps one with Bookings; a retire removes the
       empty one;
     - no clash Draft List carries an availability conflict or shows in `conflictRows`; one at a
       closed hospital carries the `holiday` conflict;
     - no past day ever gets one;
     - marking a booked session unavailable still gives Phase 30's conflict (unchanged here).

10. **The pairing rule on every other path** (US-01.3.1 "The Scheduling Engine enforces"). Each goes
    through `pairingIssues`:
    - `editList`: a patch that clears or blanks `hospitalId` or `surgeonId` refuses
      `pairingRequired` ("A List needs a hospital and a surgeon."). Changing either to another valid id
      is allowed, as today, including 17's acknowledgement (on a Draft List there is no anaesthetist,
      so no preference check until assignment).
    - `assignListToSlot` (28) keeps its `hospitalRequired` and `surgeonRequired` refusals. Re-implement
      them through `pairingIssues`, so there is one rule, and confirm it writes ACTIVE.
    - Phase 30's `addRecurringBooking` and `editRecurringBooking` refuse a template without both
      (`pairingRequired`), as 30's handoff asks. Phase 30's projection paints whatever the row holds,
      so refusing at save is what guarantees complete projected Lists.
    - The generator and `rollCanvasForward`: a template or RNG placement always carries both (work item
      4). Add a dev assertion in `placeList` and `placeListOnSlot` that throws in tests if either is
      missing or the state is not ACTIVE. It is a programming error, not a user refusal.
    - `integrationActions.ts` (S12, S13, `ingestPdfRow`, interim until Phase 33): a hospital message or
      PDF row that would create or retarget a List without a resolvable hospital and surgeon **parks**
      for the office (Phase 28's parking seam, `pairingIncomplete`, "The message has no surgeon for
      this List. Parked for the office."). It never writes a partial List. Check that S1's canned
      messages still apply exactly as before, and prove it in `demoScenarios.test.ts`.
    - `addPostOpAddendum` (28's interim) copies the original List's hospital and surgeon, so it already
      complies. Assert it in `postOpAddendum.test.ts`.
    - **Contracts.** AA rooms is a location, never a Contract holder: Phase 18's holder picker and
      seed exclude `locationType: 'aaRooms'`, and Phase 20's fitting filter offers no hospital-holder
      Contract at AA rooms, so a pre-op Booking's picker shows No contract (RVG) first and the surgeon,
      rooms and insurer Contracts that fit, exactly as when its hospital was null. Update Phase 20's
      picker test to pass AA rooms (no test passes an undefined hospital any more). The pre-op
      Bookings' Contracts and invoice amounts must not change (the fee parity tests from work item 4).
    - Phase 17's hospital contact list, the integration feeds and hospital holidays: AA rooms is not a
      feed. It may take a holiday like any location.

11. **Audit reading layer** (`shared/audit/actionLabels.ts`, `fieldLabels.ts`, `auditNarrative.ts`),
    through the terms module:
    - action labels: `draftList.create` "Draft List created", `draftList.assign` "Draft List
      assigned", `draftList.redate` "Draft List date changed", `draftList.remove` "Draft List
      removed", `draftList.fromRecurringClash` "Draft List created from a recurring booking
      (anaesthetist unavailable)"; 17's "Not preferred pairing assigned (warning acknowledged)" covers
      the acknowledgement;
    - field labels: `draft`, `source`, `origin`, `projectedFor`, `removeReason`, `locationType`; the
      `state` values read through `LIST_STATE_LABELS`, DRAFT included;
    - the narrative renders hospital, surgeon and anaesthetist ids as names, and a null anaesthetist
      as "Unassigned";
    - `auditNarrative.test.ts` must pass.

12. **Store tests** (`store/draftListActions.test.ts`, plus updates to `lifecycle.test.ts`,
    `slotActions.test.ts`, `mastersActions.test.ts`, `integrationActions.test.ts`, the Booking action
    tests, the prepayment tests and `demoScenarios.test.ts`):
    - `createDraftList`:
      - every refusal, including each of the four required fields;
      - success, state DRAFT; `schedule.slots` and every other List deep-equal before and after (AC
        "Takes no Slot").
    - Bookings: the office adds a Booking to a Draft List and moves one off it; an anaesthetist actor
      is refused; submitting or authorising a Draft List refuses with "Assign an anaesthetist first.".
    - `assignDraftList` success:
      - the same List id is now ACTIVE with the anaesthetist and the Slot, with its Bookings, hospital,
        surgeon and note unchanged;
      - the Slot's display turns to the List's kind;
      - the `draft` trail is kept with `assignedAtISO`;
      - on a free Slot with no not-preferred pairing at an open hospital, the metas are exactly
        `draftList.assign` (AC "Audited") plus any prepayment entries for never-assigned Bookings; the
        soft-warning cases below add only 17's acknowledgement or 30's reconcile meta.
    - `assignDraftList` refusals: every one, including an occupied Slot and a passed day.
    - Soft warnings:
      - onto an Unavailable or Holiday Slot, it assigns **and** raises a conflict through Phase 30's
        path;
      - with a not-preferred pairing (Dr Sharma with Ms A. Reid's `LD-003`), it assigns and writes one
        `list.pairingAcknowledged`; a preferred pairing (Sharma with Mr J. Whitford) writes none.
        Neither refuses.
    - `redateDraftList`: refusals; the Bookings follow; waiting time unchanged; state stays DRAFT; the
      List shows on the new day's band; no prepayment entry is written.
    - `removeDraftList`: refused with an active Booking; succeeds when empty or all cancelled; gone
      from every view but History; cannot then be assigned.
    - Projection: a projected id already held by a Draft List allocates `LG####` instead, and a
      recurring booking whose day's List is a live Draft List (or was assigned from one) projects no
      second List when the session reopens.
    - `detachListToDraft` (built for Phase 32, no screen here): an ACTIVE List keeps its id and leaves
      its Slot in state DRAFT with its Bookings, notes and holiday conflicts, loses its availability
      conflicts, gets a fresh `draft` trail with the given origin, and the Slot keeps the status the
      caller set; a SUBMITTED or AUTHORISED List is refused `notActive`; nothing prepayment-related is
      written.
    - Prepayment: 27's routine on a Booking on a Draft List generates and withdraws nothing; assigning
      runs it once for a never-assigned Booking (a prepaid procedure on a person-paid Booking gets its
      invoice at the new anaesthetist's price); assigning a detached List whose Booking already had an
      anaesthetist and a prepayment runs nothing (honour system).
    - Lifecycle invariant: after a sweep of actions (create, assign, re-date, remove, reassign, detach,
      roll forward, recurring-booking add, edit and apply, addendum, the stand-ins), every live List
      has a resolvable hospital and surgeon; every DRAFT List has no anaesthetist and no Slot; every
      ACTIVE, SUBMITTED or AUTHORISED List satisfies `isActivePairing` (FT-07.1).
    - Pairing:
      - `editList` clearing either field refuses;
      - one anaesthetist's AM and PM Lists on the same day keep different hospitals and surgeons
        (US-01.3.1 AC "AM and PM can differ", already met; the rule must not break it);
      - template actions refuse incomplete templates;
      - a surgeon-less integration message parks.
    - The Fitzgerald test in `lifecycle.test.ts` ("conflict-flags an empty-but-reserved list", which
      relies on her TBC List; Phase 30 may have moved it) is retargeted to another seeded List with no
      Bookings, since her Tue 21 PM Slot is now empty. If the case it proves is now the Draft List
      route, assert that instead and say so.
    - A Draft List at a hospital with a holiday: `createDraftList` succeeds and the List carries
      Phase 30's `holiday` conflict; assigning keeps it.
    - `officePrivacy.test.ts` passes with `store/draftListActions.ts` on its allowlist, and the PWA
      closure still never reaches `store/officePrivate.ts` or `apps/admin/**`.

13. **Re-point the readers the type change broke** (no new UI yet):
    - Replace every "AA rooms", "Unassigned", "Not assigned" and "Surgeon TBC" fallback with
      `locationName` and the surgeon's name. "Unassigned" now means only the Draft List flag, so no
      hospital fallback may say it. The locations are listed in Reference (Admin `util.ts`,
      `AdminApp.tsx`, `ListDrawer.tsx`, the review screen, the monitors, Move Booking, and the mobile
      and web readers, plus 30's recurring bookings table).
    - Readers that index the anaesthetist from a List narrow with `isAssignedList`, or read through
      the Slot views. Readers that switch on `ListState` handle DRAFT (the compiler lists them):
      anaesthetist screens never meet it; Admin screens show the DRAFT chip and the "Unassigned" flag.
      Admin Booking detail and review rows show "Unassigned" (terms module) for a Booking on a Draft
      List.
    - Phase 15a's warning rules that read the List's anaesthetist skip a Draft List's Bookings until
      assignment (warnings are derived on read, so they appear once it is assigned); rules that do not
      need it (for example the Contract or payer rules later phases registered) still run. In
      `store/warnings.ts`, `OpenWarningRow.anaesthetistId` becomes optional and the To-do row shows
      "Unassigned" (terms module) for a Booking on a Draft List.
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
      select lists AA rooms like any location, and the surgeon (17's `SurgeonPicker`) is required with
      the inline error "Choose the surgeon." (its empty option becomes a placeholder, not a value).
    - Phase 30's Conflicts screen shows a Draft List's holiday conflict with "Unassigned" in the
      anaesthetist column and opens the Draft List drawer.
    - **US-01.5.4 AC3.** A recurring-clash Draft List is never a row on Conflicts for its
      anaesthetist (no availability conflict is written); a test in 30's `conflictRows` tests says
      so. Phase 30's seeded Rutherford row stays as it was.
    - The `DayGrid.test.tsx` "Surgeon TBC" assertions become "the Fitzgerald Tue 21 PM block is Free"
      and "no block reads Surgeon TBC".
    - Re-green all four commands. Compare screenshots with the baseline. The expected differences are:
      Fitzgerald Tue 21 PM is Free, acute and pre-op tooltips and drawers name a surgeon, and the
      header summary reads one more free session. Sessions under a recurring clash (Ngata Tue 21 AM,
      Beaumont and Ngatai Wed 22) still read Unavailable or Holiday, as before.
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
    pattern and `tableChrome.ts`), the one place US-01.6.2 asks for:
    - **Header:**
      - the title "Draft Lists";
      - the line "Lists with no anaesthetist yet, soonest first. Assign each one to an anaesthetist
        for its session.";
      - the teal **New Draft List** button (a product action, not a demo trigger).
    - **Tabs:** Unassigned (default, with its count) and History (assigned and removed).
    - **Unassigned table,** in ascending date order through `compareDraftLists` (US-01.6.2
      "Sorting", soonest first), with a light day divider between dates. Columns:
      - Day: "Thu 23 Jul";
      - Session;
      - Hospital;
      - Surgeon;
      - Bookings: mono count;
      - Waiting: mono `waitingLabel`; at 24 h or more it takes the warning on-tint with a "Waiting over
        a day" title. This is a display emphasis, not a rule;
      - Origin: "Request · Email", "Recurring booking · Dr Beaumont unavailable", later "Moved to the
        office" and "Returned: anaesthetist unavailable" (Phase 32), all from `ORIGIN_LABELS`;
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
      - header: the DRAFT state chip (`LIST_STATE_LABELS`) and the "Unassigned" pill, the day and
        session, "Waiting 16 h", the booking count;
      - a "Request" section: hospital, surgeon, kind, note, origin and source (a recurring clash names
        its recurring booking and the anaesthetist who is unavailable), since and by;
      - a one-line reminder: "No anaesthetist yet. Nobody's schedule changes until it is assigned.";
      - **"Available that session"** (US-01.6.3's note: opening a Draft List shows everybody
        potentially available): the first five rows of the picker's clear Free group (work item 17:
        tier order, shuffled within a tier, tier pill and any Preferred pill), each with an **Assign**
        link that opens item 17's sheet at step 2 for that anaesthetist, then "See everyone (N)" that
        opens it at step 1. Not-preferred candidates are never in this short list; they wait in the
        sheet's labelled group;
      - the **Bookings** section the List drawer already has, with **Add Booking** (the office
        add-Booking flow on this List id) and each Booking's Move and Cancel;
      - actions: **Assign** (teal primary), Edit (the existing `EditListSheet`), Change date, Remove,
        and History (`HistorySheet` with `entityIds={[listId]}`).
      Once assigned, the same drawer shows the ACTIVE chip and the List in the anaesthetist's session.
    - **New Draft List sheet** (`flows/DraftListSheet.tsx`):
      - hospital: required, with AA rooms listed as a location;
      - surgeon: required, a plain grouped list (no anaesthetist yet, so 17's `SurgeonPicker` has no
        preference group to show);
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

17. **Assign Draft List sheet** (`flows/AssignDraftListSheet.tsx`), US-01.6.3, US-01.3.5 "Every office
    path" and US-01.3.6. Two steps, the same shape as Phase 28's Assign List and 17's Reassign list
    picker, built from 17's pieces:
    - **Step 1, choose the anaesthetist** (the only choice; the session is fixed on the Draft List).
      A header gives the Draft List's day, session, hospital, surgeon and booking count. It shows
      **everybody potentially available**, the same view as the office availability finder
      (US-01.4.2), from `draftListAvailabilityFor` ranked once by 17's `rankAnaesthetistCandidates`
      (one `requestKey` from the List id and `suggestionSeq`, bumped once on open), then split so the
      tier order holds within each group. Each row shows the anaesthetist's name, the session's status
      chip and times, a neutral tier pill and, where it applies, a Preferred pill:
      - "Free" (selectable): free sessions with no not-preferred pairing, Tier 1 first, shuffled within
        a tier;
      - "Not preferred with Ms Reid" (17's `PAIRING_LABELS` heading; a separately headed, labelled
        group of free anaesthetists with a not-preferred pairing; rows still selectable, with a warning
        pill), tier-ordered;
      - "Not available" (selectable, with an amber note; each row shows its own status, for example
        Unavailable or Holiday, and a not-preferred row here also carries the not-preferred pill),
        tier-ordered;
      - "Already has a List": rows disabled, each reading "Holds <hospital> · <surgeon>. Resolve it in
        the Day view first", with a link that opens that List's drawer on the Day view. This satisfies
        "an occupied Slot is not offered without the admin resolving it".
      17's tier filter (All, Tier 1 to Tier 4) narrows every group. An "Everyone / Free only" toggle,
      the finder's own control, defaults to Everyone and hides the last two groups. A line under the
      header reads "To use another day, change the Draft List's date first." The way the tier order
      and the grouping combine (tiers order within each group) is Phase 17's assumed reading, reused.
    - **Step 2, confirm:** the hospital, surgeon, kind and note read-only with an Edit link, and the
      chosen anaesthetist, day and session. The warnings stack above the button, each naming its cause:
      - 17's `NotPreferredWarning` (through `useNotPreferredWarning`), naming the pairing and the side;
      - "Dr Hughes is on Holiday for this session. Assigning flags a conflict on the List. Check with
        Dr Hughes first." (the status label comes from the master; the last sentence answers
        US-01.4.7's "the office does not assign work to someone marked unavailable without them
        knowing" while the warning stays soft, US-01.6.3);
      - "St George's is closed that day (hospital holiday). The List keeps its conflict." when the List
        carries a holiday conflict.
      The button reads "Assign Draft List", or "Assign anyway" while any warning shows.
    - **Success:**
      - a short "Draft List assigned" success moment (the reassign flow's 1050 ms pattern);
      - on the Day view, the drawer switches to the List, now ACTIVE, in the anaesthetist's row;
      - on the Draft Lists page, the row leaves Unassigned and the success moment offers "Open List".
    - RTL test `AssignDraftListSheet.test.tsx`:
      - the groups render with their headings, Everyone by default, and Free only hides the rest;
      - each group is tier-ordered, and a reopened sheet reshuffles within a tier;
      - the tier filter narrows every group;
      - an occupied row is disabled;
      - the drawer's "Available that session" lists free, clear anaesthetists and opens step 2;
      - choosing Dr Sharma for Ms Reid's request shows the not-preferred warning and the "Assign
        anyway" label; a Preferred pill shows and never warns;
      - a passed day disables Assign with the reason.

18. **The Draft Lists rail card** (US-01.6.2 "prominently in the core planning view ... in space
    reserved beside the day view"). A new `DraftListsCard` in `RightRail.tsx`, designed **together
    with Phase 15a's To-do card**:
    - order: `MiniCalendar`, then 15a's To-do (where 15a put it, directly under the calendar), then
      **Draft Lists** in the room 15a left below it, then the notes and Awaiting review cards. Leave
      the place Phase 32's notification pool takes (under Draft Lists) in the layout, so 32 adds a card
      without reshuffling. The attention cards share the rail-card anatomy, a heading with a mono
      count, at most five rows each, and a "See all N" link; together they never push the calendar
      off screen;
    - rows: the soonest five waiting Draft Lists in `compareDraftLists` order (every day, not just the
      viewed one; ascending date, US-01.6.2): "Tue 21 AM · Christchurch Public · <surgeon>", then "Tue
      21 PM · St George's · Mr S. Tan", mono waiting time and booking count, the Unassigned pill; a row
      opens the drawer; "See all 15" goes to `/admin/draft-lists`;
    - empty state: "No Draft Lists waiting.";
    - `data-shot="admin-draft-lists-rail"`. Check the rail at 1280 px and 1440 px widths with the
      seeded To-do entries and the full seeded set of Draft Lists.

19. **Kind and location on Phase 28's Assign List** (`AssignListSheet.tsx`) and phone advice
    (`PhoneAdviceBooking.tsx`). Phase 28 left pre-op "only from recurring bookings until the pairing
    decision in Phase 31". Now:
    - the kind control offers every active booking-scope status (Private, Public, Pre-op);
    - Pre-op defaults the location to AA rooms;
    - the hospital select lists AA rooms;
    - the surgeon is required in phone advice (17's `SurgeonPicker` loses its "Not assigned yet" empty
      value; keep its not-preferred group and warning).
    Both write an ACTIVE List. Keep `isScriptedS2Booking` and the S2 prefill unchanged.

20. **The Day dashboard** (US-13.1.1, US-01.6.2 "On the day view"):
    - **Draft Lists band** (`components/DraftListBand.tsx`, rendered by `DayGrid` above the first
      anaesthetist row):
      - it appears only when `draftListsForDate` is non-empty;
      - its row label is "Draft Lists" with the count and a micro caps "UNASSIGNED" line;
      - blocks sit on the same ruler at the session's default times (`effectiveSlotTimes`' defaults,
        since a Draft List has no Slot), stacked in lanes when two share a session;
      - the treatment is the one described in Reference (white, lineStrong border, warning-solid left
        bar, "Unassigned" line, "St George's · Mr S. Tan", mono "16 h" and the booking count); a
        recurring-clash block adds a quiet second line "Dr Ngata unavailable" so the office sees why;
      - lanes and their order follow `compareDraftLists`;
      - a click opens the drawer in unassigned mode;
      - the band ignores the status and focus filters (it is always shown), and the footer counts read
        "... · 2 Draft Lists unassigned" on Tue 21 Jul (St George's PM and Ngata's acute AM).
    - **Booking count on every List block:**
      - the count from `bookingCountsByList` (active Bookings only);
      - drawn as a small mono tabular-nums pill in the block's bottom-left corner (the flags stay
        top-right and "$" bottom-right);
      - it reads "0" muted when empty;
      - the block tooltip and `aria-label` gain "N bookings".
      Empty sessions show no count.
    - **Header summary** (`AdminApp.tsx` `summary`): it appends "· N Draft Lists" when the day has any,
      for example "14 anaesthetists · 21 sessions · 6 free · 2 submitted · 2 Draft Lists".
    - The drawer's List header also shows "N bookings".
    - `DayGrid.test.tsx`:
      - the band renders with the flag, the waiting label and the count, and is absent on a day
        without Draft Lists;
      - a block shows its booking count and ignores cancelled Bookings;
      - "Surgeon TBC" never renders.

21. **Mobile and web: no Draft Lists, no new copy.** A Draft List never reaches the anaesthetist apps
    or the PWA UI (FT-01.6 "never offered to anaesthetists"; US-01.6.3 "Office assigns"; OQ-86
    answered no, D46). A List assigned from a Draft List appears in the assigned anaesthetist's mobile
    Forward Lists, web Lists and week strip as a normal ACTIVE List with its Bookings, location and
    surgeon (Phase 28's Slot views). A recurring clash leaves the anaesthetist's closed session as it
    was. The availability confirm and result copy are Phase 32's (return or assign) and are not
    touched here. A grep or selector test checks that nothing under `apps/mobile`, `apps/web` or
    `src/pwa` imports the Draft List selectors or actions (the PWA stand-in's body lives in
    `src/store`), and Phase 17's `officePrivacy.test.ts` stays green.

22. **Demo triggers** (the table below). Registry entries go in `shared/demoTriggers/registry.ts`, with
    bodies in `src/store` and canned data in `src/domain/seed/draftLists.ts`:
    - `CANNED_DRAFT_LIST_REQUESTS`: three requests, each with hospital, surgeon, kind, source and a day
      **relative to the demo clock** ("the next Thursday after today", and so on) through a pure
      `nextWeekday(todayISO, weekday)`;
    - `simulateIncomingDraftListRequest(api, requestId)` and `addDraftListForDay(api, dateISO,
      choiceId)` in `store/draftListDemo.ts`, both calling `createDraftList` as
      `OFFICE_SIMULATION_ACTOR` (Phase 14's `store/demoActors.ts`; use the name the code has);
    - **`assignDraftListAsSimulatedOffice(api, anaesthetistId)`** in `store/officeStandIn.ts`, beside
      14's and 28's stand-ins, acting as `OFFICE_SIMULATION_ACTOR` through `assignDraftList` (so the
      List becomes ACTIVE and the audit is the office's). It chooses deterministically:
      1. walking this anaesthetist's **open** sessions from today (Phase 28's date-then-session scan,
         shared, not copied), the first one that some waiting Draft List falls on and for which
         `draftListFitsAnaesthetist` is true (so a not-preferred pairing is skipped without the
         stand-in ever reading the office slice); within that session, the first in
         `compareDraftLists` order (so `LD-002` before Dr Beaumont's recurring clash on Souter's Wed
         22 PM);
      2. if none fits within the horizon, it logs a canned request for the anaesthetist's next open
         session (a hospital and surgeon from the canned set, again through
         `draftListFitsAnaesthetist`) and assigns that.
      Phase 28's "Office assigns a List to my next free session" stays on Mobile · Lists; register
      this entry after it. On a fresh seed both target Souter's Wed 22 PM, so whichever runs second
      takes her next open session. Both writes are audited. Its message never mentions a preference or
      a tier (D44), the words "Draft List" (terms: "a waiting request") or "slot".
    - **`stageRecurringClash(api, recurringBookingId)`** in `store/draftListDemo.ts` (US-01.3.2 AC2
      through the roll forward, which a presenter cannot reach by normal use): it finds the chosen
      recurring booking's **first unpainted day**, the first day beyond the horizon's far end that it
      covers, and records its anaesthetist as Unavailable for that session ("Unavailable · staged for
      the demo") through Phase 29's path for a day beyond the horizon (a single-day availability
      record or a one-instance series, whichever 29 built), as `OFFICE_SIMULATION_ACTOR`. The
      clock's "Next day" then paints that day, and the generator's clash becomes a Draft List
      through work item 9 (no special path). The message names the day and how many "Next day"
      presses reach it ("Dr Morrison is marked unavailable for Mon 23 Nov AM. Press Next day twice:
      when the schedule reaches that day, St George's · Mr S. Tan becomes a Draft List."). Its
      `choices` are the active recurring bookings, the soonest first unpainted day first (default),
      labelled "Dr Morrison · Mon AM · St George's · Mr S. Tan". Disabled with "Already staged" while
      that day is staged and still unpainted.
    - **Phase 30's `simulate-sickness`** (office-recorded short-notice sickness, OQ-81 part 3 open)
      keeps its entry, effect, message and disabled states; only its `choices` skip Draft Lists
      (they have no anaesthetist). Its test asserts that.
    - Vitest (`draftListDemo.test.ts`, `officeStandIn.test.ts`):
      - the canned days follow the clock after "Next day";
      - the duplicate guard works;
      - the stand-in picks `LD-002` (with its two Bookings) on a fresh seed, leaves it ACTIVE in
        Souter's session, and falls back to logging a request once no Draft List fits;
      - it never picks a not-preferred pairing, and its message names none;
      - it refuses with "No free session in the schedule" when the anaesthetist has none;
      - after Phase 28's stand-in has taken Wed 22 PM, it falls back cleanly (either order works);
      - `stageRecurringClash` writes only the availability for the first unpainted day, and after the
        named number of "Next day" presses that day holds exactly one recurring-clash Draft List;
        staging twice is refused.
    - `pwaPurity.test.ts` and `officePrivacy.test.ts` stay green: the entries live in `src/shared`,
      the bodies in `src/store`.

23. **Playwright and shot hooks:**
    - `data-shot` hooks: `admin-draft-lists`, `admin-draft-list-drawer`, `admin-draft-lists-rail`,
      `admin-assign-draft-list`, `admin-assign-draft-list-not-preferred`, `daygrid-draft-band`,
      `daygrid-block-count`;
    - a new `visual/admin-draft-lists.spec.ts`: open Draft Lists, see the seeded rows in ascending
      date order (Tue 21 AM first), assign `LD-001` to Dr Fitzgerald, see her PM block booked "St
      George's · Mr S. Tan" (ACTIVE) on Tue 21 Jul and the band keep only Ngata's recurring clash;
      open `LD-003` (Ms Reid) and see Dr Sharma under "Not preferred with Ms Reid"; change `LD-003`'s
      date and see it on the new day's band; remove an empty Draft List and see it in History; add a
      recurring booking for Dr Beaumont on Thursday AM and see a Draft List for Thu 23 Jul (she is
      away) and Lists on the later Thursdays;
    - update the specs that asserted the Fitzgerald TBC block;
    - extend `visual/pwa-device.spec.ts`: open the Demo chip on Lists, run "Office assigns a Draft
      List to me", and assert a new booked row on Wed 22 PM showing 2 bookings.

24. **Capture hooks** (`requirements-board/capture/`): the recipes themselves, the re-captures and
    the ATLAS edits are the standing step in "Catalogue screenshots" below, run after the review
    pass. In this item only make sure the `data-shot` hooks in item 23 exist, and add one on the
    Day grid block that US-13.1.1's `drill-down` clicks, so the recipes can be written without
    brittle selectors.

25. **Docs inside the app and close-out.** In `aa-prototype/README.md`'s folder map, add
    `domain/listPairing.ts`, `domain/draftLists.ts`, `shared/scheduleTerms.ts`,
    `store/draftListActions.ts`, `store/draftListDemo.ts`, and one paragraph on the List lifecycle and
    the Draft List (DRAFT is a List with no anaesthetist and no Slot, four required fields, may hold
    Bookings, assigned by the office into the session its day and session fix and then ACTIVE; a
    recurring booking on a closed session becomes one; `detachListToDraft` is Phase 32's way back) and
    the pairing rule (AA rooms is a location). Then finish green, run the adversarial review, patch the
    demo guide and write the PROGRESS entry.

## Demo triggers

Creating, editing, adding Bookings to, assigning, re-dating and removing a Draft List are product
actions in the Admin app, and so is adding or editing a recurring booking for an anaesthetist who is
already away (its clashes become Draft Lists at once). What cannot be shown through normal use is **a
request arriving from outside** (a surgeon's secretary's email or PDF, a phone call before the
presenter is ready), **the nightly roll forward painting a recurring booking onto a day the
anaesthetist has already blocked out**, and, on a handset, **the office doing the assigning**. Waiting
time needs no trigger: the existing demo clock advances it.

| Label | Screen | Surface | Effect |
|---|---|---|---|
| Simulate incoming request | Admin · Draft Lists (`/admin/draft-lists`) | bar | Logs a Draft List as if a surgeon's secretary emailed it, created by `OFFICE_SIMULATION_ACTOR` with the source shown. `choices` (days relative to the clock): **Christchurch Eye Surgery · Ms A. Reid · next Thu PM · email** (default; on the pristine seed this is Thu 23 Jul PM, where Dr Sharma's open session lands in the "Not preferred with Ms Reid" group), Forte Health · Mr V. Nand · next Mon AM · PDF, and St George's · Mr S. Tan · next Fri AM · phone. The new row takes its place in date order with "0 min" and 0 bookings. Disabled with "Already waiting on Draft Lists" while the same canned request is still unassigned, and with "That day is beyond the schedule" if the clock has run far ahead |
| Add Draft List for this day | Admin · Day view (`/admin/day/:dateISO`) | bar | Creates a Draft List for the URL's day, which appears in the grid's Draft Lists band and the rail card at once. `choices`: AM · St George's · Mr S. Tan, and PM · Forte Health · Mr V. Nand. Disabled with "This day has passed" before today, "Beyond the schedule" past the horizon, and "Already added" if the same one is unassigned for that day |
| Stage recurring clash | Admin · Master data, Recurring bookings (Phase 30's view) | bar | Marks the chosen recurring booking's anaesthetist Unavailable on its first unpainted day (the first day beyond the horizon it covers), as `OFFICE_SIMULATION_ACTOR`, and says how many presses of the clock's **Next day** paint it. When the roll forward reaches that day, the recurring booking lands on a closed session and becomes a Draft List ("Recurring booking · Dr X unavailable"), not a List flagged on the anaesthetist (OQ-81 part 2, US-01.3.2 AC2). `choices`: active recurring bookings, soonest unpainted day first. Disabled with "Already staged" while that day is staged and unpainted |
| (product) Add or edit a recurring booking, Apply to canvas now | Admin · Master data, Recurring bookings | product | Not a trigger; listed so the presenter knows it is real: a recurring booking for an anaesthetist who is on leave in the horizon (Dr Beaumont on Thursday AM, on the pristine seed: Thu 23 Jul falls in her leave) makes Draft Lists for those days in the same save |
| (product) Add Booking, Assign, Change date, Remove | Admin · Draft List drawer (`/admin/draft-lists?open=<listId>`, the band, the rail card) | product | Not triggers; listed so the presenter knows they are real actions. Remove is disabled while the Draft List holds an active Booking |
| (Phase 30, unchanged) Simulate sickness | Admin · Day view and Admin · Conflicts | bar | Same entry and effect: an office-recorded short-notice sickness flags the List as a conflict (OQ-81 part 3 open). Its `choices` now skip Draft Lists |
| (existing) +1 hour, Next day, Next morning | Harness bar clock menu; PWA More clock card | bar and PWA | Unchanged. Every waiting time on the Draft Lists page, the rail card, the band and the drawer moves with the clock (US-01.6.2), and each roll forward paints recurring clashes on the new day as Draft Lists |
| Office assigns a Draft List to me | Mobile · Lists (`/mobile/lists`) | PWA only, badged "office stand-in" | Acts as the simulated office for Dr Souter (PWA parity for the office's Draft List assignment, ROADMAP "Demo triggers"). It assigns the waiting request that falls on her soonest open session and fits her (no not-preferred pairing, checked without revealing one), making it ACTIVE in her session (on a fresh seed, Forte Health · Mr V. Nand with 2 bookings into Wed 22 Jul PM). If none fits, it first logs a request for her next open session and assigns that. The message names what happened ("The office assigned a waiting request to your Wed 22 Jul PM: Forte Health · Mr V. Nand, 2 bookings"), and the booked row appears. Never mentions a preference, a tier, a Draft List or a slot. Disabled with "No free session in the schedule" |

Nothing is added to the Control Panel page. Its generated index lists the new entries under their
screens. In the framed build, the presenter plays the office in Admin, so the stand-in is PWA only;
"Play the office" defaults OFF with a badge.

## Out of scope

- **Offering a Draft List to anaesthetists**, or showing one on the mobile, web or PWA surfaces:
  never (FT-01.6; OQ-86 answered no, D46).
- **An anaesthetist moving their own List to the office or a colleague, or withdrawing** (US-01.4.3),
  and **the return-or-assign choice when they mark a booked session unavailable** (US-01.5.5): Phase
  32, through `detachListToDraft` with `origin: 'movedToOffice'` or `'unavailableReturn'` (ACTIVE back
  to DRAFT), with no preference warning (US-01.4.5). Until then, Phase 30's conflict flag stays on that
  path. A single Booking's move (US-01.4.7) is Phase 32a.
- **Short-notice sickness as a Draft List** (OQ-81 part 3, open): Phase 30's office-recorded
  conflict stays.
- **The automated reschedule clash** (US-02.5.2, Future Work swimlane).
- **Creating a Draft List from a hospital row on the matching screen** (US-02.1.2): Phase 33 calls
  `createDraftList(..., 'hospitalRow')`.
- **The update email** after an assignment (US-02.3.3: an on-demand button picked from the change
  history, manual only per OQ-82): Phase 35.
- **The notification pool** (FT-13.8): Phase 32. A Draft List created here posts nothing to it.
- **Repointing a prepaid Booking's payee** when a List or Booking moves (US-06.5.4, OQ-80, D38):
  Phase 41. This phase re-triggers no prepayment calculation on a move or a re-date (D20).
- **The conflict dashboard and conflict clearing** (US-01.5.2, US-01.5.4): Phase 30. This phase only
  shows a Draft List's holiday conflict there as "Unassigned" and keeps recurring clashes off it.
- **Editing preferences and tiers**: Phase 17. This phase only reads them through 17's helper.
- **Reopening a removed Draft List** and **assigning into a session on another day** without changing
  the date first. Neither is in the catalogue; built defaults, logged if a beat needs them.
- **Editing the AA rooms location** and deactivating hospitals: Phase 42 (every master editable).
- **Paging and virtualising the Day grid** for 85 anaesthetists (the footer narration stays): Phase 43.
- **A Draft List threshold rule** ("alert after N hours"). None exists in the catalogue; the
  over-a-day emphasis is display only. A Draft List warning in 15a's routine is not added either (the
  to-do list is for warnings needing action; Draft Lists have their own card).

## Manual test checklist

The agent runs every item itself in the running app and reports it with evidence; none is handed
to the owner (ROADMAP.md "Owner review: agents test themselves"). Counts below are the plan-time
expectations (15 seeded Draft Lists, work item 5); use the figures the seed test pins.

- [ ] Reset. The Admin side nav shows **Draft Lists 15** in amber, below Day view.
- [ ] Admin Day, Tue 21 Jul:
  - the right rail shows 15a's To-do card under the calendar, then a **Draft Lists** card with the
    soonest five in date order (Tue 21 AM Christchurch Public, Tue 21 PM St George's, then Wed 22)
    and "See all 15", with neither crowding the other;
  - a Draft Lists band sits above the rows, holding Ngata's acute AM ("Dr Ngata unavailable") and
    "St George's · Mr S. Tan" PM, "16 h", 0 bookings, both flagged "Unassigned", drawn differently
    from every status colour;
  - Dr Fitzgerald's PM is free; Dr Ngata's row still reads Unavailable;
  - the header reads "... · 2 Draft Lists";
  - every List block shows a booking count, and a List with a cancelled Booking does not count it;
  - no block anywhere reads "Surgeon TBC", no hospital reads "Unassigned", no assigned List reads
    "DRAFT" or "Open", and no new copy says "slot".
- [ ] Advance the clock "+1 hour": the rail card, the band, the drawer and the Draft Lists page read
      "17 h" for St George's. Advance "Next day": the Tue 21 Draft Lists show "Day passed" at the top
      and Assign is disabled with the reason; Change date and Remove still work. (Reset afterwards.)
- [ ] Draft Lists page:
  - every seeded row in ascending date order, AM before PM: Tue 21 (Ngata's clash, St George's), Wed
    22 (Beaumont's and Ngatai's AM, then Forte Health · Mr V. Nand PM with 2 bookings, Beaumont PM),
    Fri 24, Mon 27 (Christchurch Eye Surgery "3 d 22 h" with the warning emphasis, Ngatai PM), then
    August and September;
  - recurring clashes read "Recurring booking · Dr Beaumont unavailable", requests "Request · Email";
  - Beaumont's Wed 22 Southern Cross rows carry the hospital-holiday flag (Phase 30's `HH900`);
  - every row carries "Unassigned".
- [ ] New Draft List with no surgeon: refused with "Choose the surgeon.". With Forte Health, Mr V.
      Nand, Fri 24 Jul AM, Phone: it appears in date order at "0 min". Mobile and web views of every
      anaesthetist are unchanged (it takes no session), and the Audit viewer shows "Draft List
      created".
- [ ] Open that Draft List: the drawer header shows DRAFT and "Unassigned", and "Available that
      session" lists free anaesthetists with tier pills. **Add Booking**: it saves, the count reads 1,
      and the Booking shows "Unassigned" as its anaesthetist in Admin Booking detail. Remove is now
      disabled with "Move or cancel its 1 Booking first."
- [ ] Assign the St George's request:
  - step 1 shows Everyone: Dr Fitzgerald under Free with her tier pill, Tier 1 rows before Tier 2,
    anyone Unavailable or on Holiday that half-day under "Not available" with their status, and
    anaesthetists who already hold a List then as disabled with "Resolve it in the Day view first";
    the tier filter narrows every group; Free only hides the last two; close and reopen: the order
    within a tier changes;
  - choose Fitzgerald and Assign;
  - the band keeps only Ngata's clash, Fitzgerald's PM block shows St George's · Mr S. Tan with "0"
    bookings, the drawer now shows ACTIVE, and its History shows the Draft List's creation and
    assignment on the same List.
- [ ] Assign Forte Health · Mr V. Nand (2 bookings) to a free anaesthetist from the drawer's
      "Available that session": their block shows "2", and their mobile or web schedule shows the
      List with both Bookings, each with its source wording, procedure and Contract.
- [ ] Open Christchurch Eye Surgery · Ms A. Reid (`LD-003`) → Assign: Dr Sharma sits in "Not preferred
      with Ms Reid" (if her Mon 27 AM is open; otherwise use the trigger below). Choosing her shows the
      warning naming the side and "Assign anyway"; pick a Free anaesthetist instead: no warning.
- [ ] Harness bar on Draft Lists: "Simulate incoming request" (Reid, Christchurch Eye Surgery, next
      Thu PM). Assign it: Dr Sharma is in the not-preferred group; assign her anyway: the audit shows
      "Not preferred pairing assigned (warning acknowledged)". Run the trigger again: it is disabled
      with "Already waiting" until the request is assigned.
- [ ] Assign Ngata's Tue 21 AM clash back to Dr Ngata (Not available, Unavailable): an amber warning
      names the status and says to check with him, and it assigns. The List carries a conflict and
      appears on Phase 30's Conflicts screen.
- [ ] Conflicts: Beaumont's Wed 22 Southern Cross Draft Lists show as hospital-closed rows with
      "Unassigned" in the anaesthetist column and open the Draft List drawer; no recurring clash shows
      as an "Anaesthetist unavailable" row (US-01.5.4 AC3); Dr Rutherford's seeded sickness row is
      there exactly as Phase 30 left it.
- [ ] Recurring bookings (Phase 30's view): add a recurring booking for Dr Beaumont on Thursday AM,
      Christchurch Eye Surgery, Mr J. Whitford. The preview says one session goes to a Draft List;
      after "Apply to canvas now" Thu 23 Jul is a Draft List ("Recurring booking · Dr Beaumont
      unavailable") and the later Thursdays are ACTIVE Lists in her row. Press "Apply to canvas now"
      again: nothing new.
- [ ] Demo actions on Recurring bookings: "Stage recurring clash" on the default choice; the message
      names the day and the presses. Press Next day that many times: the day holds a new Draft List
      from that recurring booking, waiting from the roll, and the anaesthetist's session reads
      Unavailable. Running the trigger again for the same choice is disabled. (Reset afterwards.)
- [ ] Change date on Christchurch Eye Surgery (`LD-003`) to another day: it leaves the old day's band
      and shows on the new day's in date order; its waiting time is unchanged.
- [ ] Remove an empty Draft List with "Duplicate request": it leaves Unassigned, the rail card and the
      band, and shows in History as "Removed: Duplicate request". Remove an empty recurring clash and
      press "Apply to canvas now": it does not come back.
- [ ] Admin Day on another day: "Add Draft List for this day" from the harness bar adds a band block
      for that day. The menu shows no Draft List entries on the Billing monitor.
- [ ] Simulate sickness (Phase 30) on Wed 22: its choices offer no Draft List, and the picked List is
      flagged exactly as before. On mobile (Dr Souter), marking a booked PM unavailable still gives
      Phase 30's result (Phase 32 adds the choice).
- [ ] Pairing:
  - Edit list cannot clear the hospital or surgeon;
  - a recurring booking needs both;
  - the Pre-op kind on Assign List defaults to AA rooms, and phone advice requires a surgeon;
  - pre-op Lists read "Pre-op clinic · AA rooms" in mobile, web and admin, and their drawer names a
    surgeon; a pre-op Booking's Contract picker offers the same Contracts as before, with no AA rooms
    holder;
  - acute blocks keep "Acute theatre" and name a surgeon in the tooltip.
- [ ] S1 on the framed build (Fire hospital message and its modify and move messages), S2 Beats 2 to
      4 and S3 behave exactly as before, with the same figures.
- [ ] PWA (`npm run dev:pwa`, fresh storage): on Lists the Demo chip offers "Office assigns a Draft
      List to me", badged. Running it adds Wed 22 Jul PM Forte Health · Mr V. Nand with 2 bookings;
      running it again assigns the next waiting request on her next open session, or logs one. It
      never mentions a preference, a tier, a Draft List or a slot, and no PWA screen shows a Draft
      List.
- [ ] No en or em dashes in any new copy; no "slot", "blacklist" or "whitelist" in app copy; teal is
      the only action colour; crimson unused on the new screens, sheets, rail card and band; the nav
      badge is amber; every Draft List word comes from the terms module and every pairing or tier word
      from Phase 17's label set.
- [ ] Catalogue screenshots: the recipes for FT-07.1, FT-01.6, US-01.6.1 to US-01.6.4, US-13.1.1,
      US-01.3.1, US-01.3.2, US-01.3.3, US-01.3.5, US-01.3.6, US-01.4.2, US-01.5.2, US-01.5.4 and the
      other EP-01 items in the table are created or updated, any recipe this phase broke is
      re-pointed, a full `npm run capture` ends with no failed recipe and no story without a recipe,
      the covered items' new shots are checked by eye, and `npm run verify:board` is green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots` and `npm run verify:board` all green.

## Demo guide updates

This phase changes S2 Beat 1 (the "Surgeon TBC" block it implies becomes a Draft List, assigned with
the grouped, tier-ordered picker), adds S2 Expected lines and the office workflows. S2 Beat 3 (Dr
Rutherford's sickness on Conflicts, reassigned with Phase 17's grouped, tier-ordered picker) stays
exactly as Phases 17 and 30 left it: an office-recorded sickness is still a conflict. Patch, in the
same session:

- **`docs/demo-guide/03-demo-script.md`:**
  - S2 **Time**: "7 to 9 minutes" (the new beat adds about 90 seconds). Update the timing table rows
    that include S2.
  - S2 Beat 1, add to Say: "Requests that arrive before an anaesthetist is found wait here as Draft
    Lists, flagged unassigned and soonest first, right beside the day, so nothing sits on a pile of
    paper. When a surgeon's recurring booking lands on a day the anaesthetist has already blocked
    out, the system makes it a Draft List too, rather than leaving it on someone who will not be
    there." Replace any "every active anaesthetist has exactly two half-day Lists" wording with
    "two sessions a day". Add to Expected: "a Draft Lists card in the right rail and a Draft Lists
    band above the grid hold Dr Ngata's acute AM (he is unavailable) and St George's PM, Mr S. Tan,
    waiting 16 h; every List block shows its booking count; the nav shows Draft Lists 15."
  - **New S2 Beat 1b, "a List with no anaesthetist yet"** (lettered, so later beat numbers and
    cross-references hold until Phase 44 renumbers):
    - Click: open the band's St George's block → point at "Available that session" and the tier pills
      → **Assign** → **Dr Emma Fitzgerald** (Free) → **Assign Draft List**.
    - Optional, if time allows: **Draft Lists** → show the date order and Dr Beaumont's Wednesday
      Lists waiting while she is on leave, then open **Forte Health · Mr V. Nand** (2 bookings) to
      show Bookings already on a Draft List; or Demo actions → **Simulate incoming request**
      (Christchurch Eye Surgery, Ms A. Reid, Thu 23 Jul PM) → **Assign** → point at Dr Sharma in "Not
      preferred with Ms Reid" → pick a Free anaesthetist instead.
    - Say: "A Draft List has its hospital, surgeon, day and session, and can already hold Bookings,
      but has no anaesthetist and changes nobody's schedule. Only the office assigns it, by picking
      the anaesthetist; the session is already set. Everyone who could take it is shown, ordered by
      the office's priority tiers, with any not-preferred pairing set apart. Those warn, and never
      block, and anaesthetists never see them. Once assigned, it is an active List in that
      anaesthetist's day. A cancelled request is removed, or its date changed."
    - Expected: "the band keeps only Dr Ngata's acute AM; Fitzgerald's PM shows St George's, Mr S.
      Tan; the drawer shows ACTIVE and its History shows the Draft List created and assigned on the
      same List."
  - S2 **Discovery points**: drop OQ-44, OQ-64 and OQ-86 (answered). Add OQ-81 part 3 (does a
    short-notice sickness go to the office as a Draft List, or stay a conflict) and the pre-op and
    acute pairing reading (AA rooms as a location; a named surgeon on pre-op and acute Lists).
- **`docs/demo-guide/02-workflows-and-handoffs.md`:**
  - Workflow 1 "Manual fallback paths": a request with no anaesthetist yet becomes a Draft List, which
    can take Bookings before it is assigned.
  - Workflow 2 "plan the day": the Draft Lists rail card and band, soonest first, the grouped,
    tier-ordered assign picker, and the booking counts.
  - The availability workflow: a recurring booking that lands on a day the anaesthetist has already
    blocked out becomes a Draft List for the office (the calendar is painted first). Leave the
    anaesthetist's own "mark a booked session unavailable" line for Phase 32.
  - "The two kinds of state": a List's state is DRAFT (a Draft List, no anaesthetist), ACTIVE,
    SUBMITTED or AUTHORISED; a session's availability is separate.
- **`docs/demo-guide/04-presenter-cheat-sheet.md`:**
  - "The five nouns to remember" or its Slot and List line: add the Draft List ("a List with no
    anaesthetist yet, state DRAFT"), and "every List has exactly one hospital and one surgeon; AA rooms
    is a location";
  - "Admin Web" under "What each app is for": Draft Lists;
  - "Prototype readiness": Draft Lists built and clickable, including recurring clashes;
  - "Terms not to use": "Surgeon TBC List", "slot" (say session), "blacklist" (say not preferred),
    "Open" or "DRAFT" for an assigned List (say active), and "a List being prepared" for a Draft List.
- **`docs/demo-guide/01-personas-and-responsibilities.md`:** the office persona's day gains "assigns
  Draft Lists" if it lists the office's jobs.
- **`docs/demo-guide/master-demo-guide.html`:** the same S2 Beat 1, new Beat 1b, the S2 discovery
  points, the workflow summaries and the cheat-sheet lines (the sections near "Office day", "phone
  advice" and "Workflow 2").
- **Control Panel** `SCENARIOS` S2 text (`apps/demo/DemoControlPanel.tsx`): "Assign the St George's
  Draft List to Dr Fitzgerald; optionally show Dr Beaumont's recurring Lists waiting as Draft Lists
  while she is on leave, open Forte Health to show Bookings on a Draft List, or simulate an incoming
  request to show the not-preferred group and the tier order." Phase 30's illness-cover sentence stays.

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19),
run after the review pass and before the PROGRESS.md entry. Re-run
`node docs/prototype-build/catch-up/tools/recipe-status.mjs 31` first: earlier phases (17, 28, 29, 30)
change several of these recipes before this one runs. This phase covers all of EP-01 and EP-07 (the
List lifecycle), so the table lists every EP-01 and EP-07 story the tool lists (EP-07's are owned by
later phases or already match, and only need the ACTIVE wording checked), plus FT-07.1 and FT-01.6 (features the tool does not list;
EP-07 and FT-01.3 get no recipe of their own: their states and the pairing show through FT-07.1's,
US-01.6.3's and US-01.3.1's shots). Only the Draft List, lifecycle, Day dashboard, pairing and
recurring-clash items change much here. Captions are catalogue text, but keep "slot" and "blacklist"
out of any app copy a shot shows.

**Covered items.** When the phase is done, each recipe in `requirements-board/capture/recipes/`
matches what was built:

| Item | Recipe at plan time | When this phase is done |
|---|---|---|
| [FT-07.1](../../../../requirements-board/requirements/stories/FT-07.1.md) ACTIVE | none (features are not listed by the tool) | create, status captured. Admin `draft-to-active` on `/admin/draft-lists?open=LD-001`: state `draft` (the drawer header with the DRAFT chip and "Unassigned") and state `active` (after assigning Dr Fitzgerald, the same List's drawer on the Day view with the ACTIVE chip). Highlight the header chip. Caption: "A Draft List becomes ACTIVE once the office assigns its anaesthetist" |
| [FT-01.6](../../../../requirements-board/requirements/stories/FT-01.6.md) Draft Lists | none (features are not listed by the tool) | create, status captured. Admin `draft-list-origins` on `/admin/draft-lists`: the Unassigned table showing a request row and a recurring-clash row with their origins. Highlight the Origin column. Caption: "Draft Lists from a surgeon's room request and from a recurring booking on an unavailable day" |
| [US-01.6.1](../../../../requirements-board/requirements/stories/US-01.6.1.md) Create a Draft List | absent stub ("Not built yet: catch-up Phase 31 builds this.") | fill it, status captured. Admin `new-draft-list` on `/admin/draft-lists`: state `form` (the New Draft List sheet filled: hospital, surgeon, day, session, source, with the "Saving does not change anyone's schedule" line) and state `with-booking` (the new Draft List's drawer after Add Booking). Highlight the sheet, then the Bookings section. Caption: "A Draft List needs no anaesthetist, changes nobody's schedule and can hold Bookings" |
| [US-01.6.2](../../../../requirements-board/requirements/stories/US-01.6.2.md) See Draft Lists flagged in the Admin App | absent stub | fill it, status captured. Admin shots: `draft-lists` (the Draft Lists page, Unassigned tab, the seeded rows in ascending date order with the "Unassigned" pill, waiting time and origin; highlight the table and the nav badge), `draft-lists-day` on `/admin/day/2026-07-21` (states `band` and `rail`, highlighting `[data-shot=daygrid-draft-band]` and `[data-shot=admin-draft-lists-rail]`). Caption: "Every Draft List is flagged Unassigned, soonest first, with how long it has waited" |
| [US-01.6.3](../../../../requirements-board/requirements/stories/US-01.6.3.md) Assign a Draft List to an anaesthetist | absent stub | fill it, status captured. Admin `assign-draft-list`: state `drawer` (a Draft List's drawer with "Available that session" and tier pills), state `pick` (step 1 on Everyone with the Free, Not preferred, Not available and Already has a List groups, tier-ordered), state `warning` (step 2 with the stacked warnings and "Assign anyway"; stage it with the Reid request from the `Simulate incoming request` trigger and Dr Sharma) and state `assigned` (the St George's block in Dr Fitzgerald's row with its booking count, the drawer showing ACTIVE). Highlight the drawer section, then the dialog. Caption: "The office picks only the anaesthetist; the session is set on the Draft List, which then becomes active" |
| [US-01.6.4](../../../../requirements-board/requirements/stories/US-01.6.4.md) Remove or re-date an unfilled Draft List | absent stub | fill it, status captured. Admin `redate-remove` on `/admin/draft-lists`: states `change-date` (the sheet with "Its N Bookings move with it"), `remove` (the Remove sheet with reason chips) and `history` (the History tab row "Removed: Duplicate request"). Highlight the dialog or the history row. Caption: "Remove a cancelled request or change its date" |
| [US-13.1.1](../../../../requirements-board/requirements/stories/US-13.1.1.md) One-day dashboard | captured · `day-view` (day, drill-down) | stays captured. Re-shoot `day` on `/admin/day/2026-07-21` with the Draft Lists band (Ngata's acute AM and St George's PM), the rail card, the booking count on every block and the "2 Draft Lists" header summary (highlight the band and a count pill); caption "One-day view of every anaesthetist's Lists, Draft Lists and booking counts". The `drill-down` click `text="Southern Cross" >> nth=0` may now hit the rail card or band: move it to a `data-shot` on the block |
| [US-01.3.1](../../../../requirements-board/requirements/stories/US-01.3.1.md) Assigned List pairing rule | captured · `list-pairing` (drawer, edit) | stays captured. Keep `drawer` and `edit` (check the rows they open still exist after Phase 28). Add an `am-pm` state highlighting one anaesthetist's AM and PM Lists at different hospitals and surgeons, for "AM and PM can differ", and an `incomplete` state showing Edit list refusing to clear the surgeon ("Choose the surgeon."). Caption: "Every List has exactly one hospital and one surgeon" |
| [US-01.3.2](../../../../requirements-board/requirements/stories/US-01.3.2.md) Recurring bookings drive most assignments | captured · `permanent-lists` (table, add) | Phase 30 owns the recipe (renamed for recurring bookings). Add an `incomplete` state on the `add` sheet (refused without a hospital or surgeon, the pairing rule) and a `clash` state for AC2: after adding Dr Beaumont on Thursday AM, the result line "1 session goes to a Draft List" and the Draft Lists row "Recurring booking · Dr Beaumont unavailable". Stays captured; caption "A recurring booking on a day the anaesthetist is away becomes a Draft List" |
| [US-01.3.3](../../../../requirements-board/requirements/stories/US-01.3.3.md) Manual List assignment | captured · `assign-free-list` (drawer, book) | stays captured. Re-point `book` to the changed phone-advice sheet (surgeon now required, no "Not assigned yet", the kind control and AA rooms in the hospital select) and its index-based `select ... nth=0/1` steps; add a state for the Assign List sheet offering Pre-op defaulting to AA rooms. Caption: "Booking a free session needs a hospital and a surgeon" |
| [US-01.3.5](../../../../requirements-board/requirements/stories/US-01.3.5.md) Not-preferred pairing warning when assigning or moving a List | absent stub at plan time ("Not built yet: catch-up Phase 17 builds this."); Phase 17 makes it partial with `edit-list-warning` and `reassign-warning` | captured. Keep 17's shots and add `assign-draft-list-not-preferred` (admin), states `group` (Dr Sharma under "Not preferred with Ms Reid", selectable) and `warning` (the warning naming the pairing and the side, and "Assign anyway"), staged from the `Simulate incoming request` trigger. Highlight the labelled group, then the warning. Drop 17's partial reason ("Assigning a Draft List does not exist yet"). Caption: "A not-preferred pairing is grouped apart and warns on every office path, a Draft List included" |
| [US-01.3.6](../../../../requirements-board/requirements/stories/US-01.3.6.md) Anaesthetist priority tiers for assignment | none at plan time (Phase 17 creates it partial: `tier-record`, `tier-order`, `tier-filter`; Phase 28 adds the finder) | captured if 28 covered the finder; otherwise keep partial with 28's reason. Add a `draft-list-tiers` state: the Assign Draft List sheet's step 1 with tier pills and the tier filter set to one tier. Caption: "Who can fill a Draft List, ordered by tier and shuffled within a tier, seen only by the office" |
| [US-01.1.1](../../../../requirements-board/requirements/stories/US-01.1.1.md) Two Slots per anaesthetist per day | captured · `day-grid`, `my-lists` (web, mobile) | stays captured. Re-shoot the admin `day-grid` (band, counts, Fitzgerald Tue 21 PM now free) with the same highlight; its last paragraph (Draft Lists show too; a recurring clash becomes one) is what the band shows. Web and mobile `my-lists` should not change: confirm in the `--dry` run |
| [US-01.1.2](../../../../requirements-board/requirements/stories/US-01.1.2.md) Horizon rolls forward daily | partial · `permanent-lists` | no change here. Stays partial (the daily roll forward has no screen; its recurring clash is shown under US-01.3.2). Phase 30 re-points the nav click to "Recurring bookings"; this phase only keeps the recipe running |
| [US-01.1.3](../../../../requirements-board/requirements/stories/US-01.1.3.md) New anaesthetist gets a populated canvas | partial · `add-anaesthetist` (form, added, listed) | no change here (Phase 28 owns it). Check the `listed` state still holds after the grid gains the band |
| [US-01.1.4](../../../../requirements-board/requirements/stories/US-01.1.4.md) Slot default times | partial · `list-times` | no change here. Check the Edit list sheet still opens and highlights the time field after the pairing rule makes hospital and surgeon required |
| [US-01.2.1](../../../../requirements-board/requirements/stories/US-01.2.1.md) Anaesthetist sets half-day availability | partial · `my-availability` (before, pm-blocked), `availability-grid` (web) | no change here (Phases 29 and 32 own it; the booked-session choice is 32's) |
| [US-01.2.2](../../../../requirements-board/requirements/stories/US-01.2.2.md) Slot status master data | partial · `list-statuses` | no change here; a Draft List adds a List state, not a status value, so Phase 29's table is unchanged (its guard already refuses "Draft" as a status label) |
| [US-01.2.3](../../../../requirements-board/requirements/stories/US-01.2.3.md) Status is independent of bookings | captured · `status-without-bookings` (admin, web) | no change here. Stays captured; Tue 21 Ngata and Beaumont rows keep their status (Ngata's acute clash sits in the band, not on his row). Confirm in the `--dry` run |
| [US-01.4.1](../../../../requirements-board/requirements/stories/US-01.4.1.md) Reassign a List with its bookings | partial · `reassign` (pick, done, after) | no change here (Phases 17 and 28 own it). Check the picker still finds its target after the seed change |
| [US-01.4.2](../../../../requirements-board/requirements/stories/US-01.4.2.md) Availability finder | captured · `availability-finder` (admin, web, mobile) | stays captured. Re-shoot the admin day grid shot (Fitzgerald PM is now free) and add an admin `draft-list-finder` state: the Assign Draft List sheet as the finder's Draft List view, Everyone then Free only. Web and mobile unchanged apart from Fitzgerald's free PM, and never tier-ordered |
| [US-01.4.3](../../../../requirements-board/requirements/stories/US-01.4.3.md) Anaesthetist moves their own List | partial · `cover-request` (web, mobile) | Phase 32 owns this. No change here; Phase 31 only provides `detachListToDraft`, which no screen in this phase calls |
| [US-01.4.5](../../../../requirements-board/requirements/stories/US-01.4.5.md) No preference warning when an anaesthetist moves their own List | absent stub (Phase 32) | Phase 32 builds this. No change here |
| [US-01.4.6](../../../../requirements-board/requirements/stories/US-01.4.6.md) The List's anaesthetist did its procedures | absent stub (Phase 32) | Phase 32a builds this. No change here |
| [US-01.4.7](../../../../requirements-board/requirements/stories/US-01.4.7.md) Anaesthetist moves a single Booking | none (create it) | Phase 32a builds this. No change here; if the `--dry` run reports a story without a recipe, add the absent stub "Not built yet: catch-up Phase 32a builds this." |
| [US-01.5.1](../../../../requirements-board/requirements/stories/US-01.5.1.md) Hospital holiday calendar | captured · `hospital-holidays` (list, add) | Phase 30 owns it. No change here beyond the check that a Draft List's holiday flag does not alter the Hospitals view |
| [US-01.5.2](../../../../requirements-board/requirements/stories/US-01.5.2.md) Conflict flagging | partial · `holiday-conflict`, `unavailable-conflict` (admin, mobile) | Phase 30 owns the recipe and left AC3 (a recurring clash becomes a Draft List) to this phase. Add a `recurring-clash` state: the Draft Lists page row "Recurring booking · Dr Beaumont unavailable" for Wed 22 AM, highlighted. If AC3 was Phase 30's only remaining partial reason, change it to captured; the mobile `unavailable-conflict` shot (an anaesthetist marking a booked session unavailable) is US-01.5.5's change in Phase 32, so leave it and its reason to 32. Caption for the new state: "A recurring booking on an unavailable session goes to the office as a Draft List" |
| [US-01.5.3](../../../../requirements-board/requirements/stories/US-01.5.3.md) Anaesthetist availability calendar | partial · `my-availability` (before, blocked) | Phase 29 owns it. No change here |
| [US-01.5.4](../../../../requirements-board/requirements/stories/US-01.5.4.md) Availability conflict dashboard | absent stub (Phase 30 creates `conflicts-screen`) | Phase 30 creates it. Add a `draft-list-holiday` state: Dr Beaumont's Wed 22 Southern Cross Draft List on Conflicts as a hospital-closed row with "Unassigned" in the anaesthetist column; its absence as an "Anaesthetist unavailable" row is AC3. Caption: "A recurring clash is a Draft List, not a conflict on the anaesthetist" |
| [US-01.5.5](../../../../requirements-board/requirements/stories/US-01.5.5.md) Mark unavailable while holding a List | none (create it) | Phase 32 builds this. No change here; if the `--dry` run reports a story without a recipe, add the absent stub "Not built yet: catch-up Phase 32 builds this." |
| [US-07.1.1](../../../../requirements-board/requirements/stories/US-07.1.1.md) Submit a List | captured · `submit-list` (web, mobile: ready, confirm, submitted) | no change here (Matches; no phase owns it). The submit flow is unchanged; check in the `--dry` run that the `ready` state reads ACTIVE (15b's rename), never DRAFT, for the List being submitted |
| [US-07.2.1](../../../../requirements-board/requirements/stories/US-07.2.1.md) Anaesthetist loses edit access | captured · `submitted-list`, `read-only-card` (web, mobile), `done-unbilled`, `simulator-edit-refused` | Phase 38a owns it. No change here |
| [US-07.2.2](../../../../requirements-board/requirements/stories/US-07.2.2.md) Office review of Contracts and references | captured · `review-contracts`, `correct-contract` (setup, edit) | Phase 21 owns it (the three-part stack and the insurance warning at review). No change here |
| [US-07.2.3](../../../../requirements-board/requirements/stories/US-07.2.3.md) Office corrections | captured · `price-override` (override, saved), `phone-note` | no change here (Matches; Phase 24 re-checks the override sits at the top of the precedence) |
| [US-07.3.1](../../../../requirements-board/requirements/stories/US-07.3.1.md) Authorise the List | captured · `authorise` (confirm, authorised) | Phase 25 owns it (the snapshot at AUTHORISED). No change here |
| [US-07.3.2](../../../../requirements-board/requirements/stories/US-07.3.2.md) Immutable after AUTHORISED | captured · `locked-cards`, `simulator-edit-refused` | no change here (Matches) |
| [US-07.4.1](../../../../requirements-board/requirements/stories/US-07.4.1.md) List leaves the main view once invoiced | captured · `list-drops-off` (mobile: submitted, invoiced; web), `list-drops-off-invoiced`, `invoices-in-balances` | Phase 38a owns it (finalised and sent to invoicing, OQ-31; the current caption describes the old trigger and 38a replaces it). No change here |
| [US-07.4.2](../../../../requirements-board/requirements/stories/US-07.4.2.md) Anaesthetist's main view | none (new at 60e2d1e) | Phase 38a creates it. No change here; if the `--dry` run reports a story without a recipe, add the absent stub "Not built yet: catch-up Phase 38a builds this." |

**Recipes this phase breaks.** Found by grep at plan time:
- `US-01.3.3.json` and `US-02.3.1.json` click `open for cover >> nth=0` and then "Book (phone advice)" and pick by `select ... nth=0/1`. Fitzgerald Tue 21 PM becomes a free session and the phone-advice sheet gains a kind control, so the first free session and the select order may change. Re-point to a `data-shot` on a named free session and select by label, keeping shot names.
- `US-13.1.1.json` (`drill-down`) clicks `text="Southern Cross" >> nth=0`, which the rail card or band (Dr Beaumont's Southern Cross Draft Lists) can now match first. Add a `data-shot` hook on the block.
- `US-01.1.4.json` and `US-01.3.1.json` open a List row and "Edit list": the sheet now requires hospital and surgeon, so check the highlights.
- `US-01.4.1.json` picks a named anaesthetist in the reassign picker; check it after the seed change.
- `US-02.5.4.json` still names "DRAFT" (15b's rename re-pointed it): check it never reads DRAFT for an assigned List after this phase adds the state.
- No recipe names Fitzgerald or "Surgeon TBC". `capture/ATLAS.md` does (see below).
The `--dry` run is the final check.

**ATLAS.md.** Update Seed data worth shooting (Admin day, Tue 21: Fitzgerald PM is free, not "surgeon TBC"; the three request Draft Lists `LD-001` to `LD-003` and the recurring-clash Draft Lists, `LD-<recurring booking>-<date>-<session>`, with Ngata Tue 21 AM and Beaumont and Ngatai on Wed 22; the List states DRAFT, ACTIVE, SUBMITTED, AUTHORISED), Routes (add `/admin/draft-lists`, `?open=`, `?tab=history`), Personas and IDs (Draft List ids `LD-` and runtime `LG####`), and Existing hooks (the new `data-shot` hooks: `admin-draft-lists`, `admin-draft-list-drawer`, `admin-draft-lists-rail`, `admin-assign-draft-list`, `admin-assign-draft-list-not-preferred`, `daygrid-draft-band`, `daygrid-block-count`).

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
- **The lifecycle.** `ListState` is DRAFT, ACTIVE, SUBMITTED, AUTHORISED (EP-07). DRAFT means a Draft
  List only: no anaesthetist, no Slot. Every List set up with its anaesthetist is ACTIVE; only
  `assignDraftList` (through `attachListToSlot`) takes DRAFT to ACTIVE, and only `detachListToDraft`
  takes ACTIVE back to DRAFT (refusing SUBMITTED and AUTHORISED). No code still reads `'DRAFT'` with
  its July meaning; no assigned List is labelled "DRAFT" or "Open". Only an ACTIVE List can be
  completed and submitted.
- **A Draft List is a List with no anaesthetist and no Slot.** `createDraftList` and the recurring
  clash write through `insertDraftList` and touch no Slot and no other List. Assigning keeps the List
  id and its Bookings, in the session the Draft List fixes; the admin picks only the anaesthetist.
  Every live Draft List has hospital, surgeon, day and session. No anaesthetist-scoped selector,
  screen or PWA surface ever shows one (OQ-86 answered no); an anaesthetist cannot add a Booking to
  one; it cannot be submitted, authorised or billed.
- **The recurring clash is one rule, built as the answer.** Only `recurringClashDraft` turns the
  generator's clashes and Phase 30's `skipped` entries into Draft Lists, on every path that yields
  them (add, edit and apply, the roll forward, the horizon extend, an earlier start date, the seed's
  generation), with the anaesthetist's calendar, series included, painted first (no recurring-booking
  List is ever left flagged on the anaesthetist). It writes no availability conflict and never reaches
  Conflicts for the anaesthetist (US-01.5.4 AC3); a holiday conflict still applies. It is idempotent:
  `draft.projectedFor` answers for the day even after a re-date or a removal, so no apply or roll
  brings a second one back. No past day gets one. There is no rule constant, no provisional badge,
  and nothing converts an anaesthetist's own unavailability (that choice is Phase 32's); Phase 30's
  sickness trigger and seed are unchanged.
- **One pairing rule.** Every write path (create, assign, Assign List, phone advice, edit, recurring
  bookings, generator, roll forward, integrations, addendum, stand-ins) goes through `pairingIssues`,
  with no inline checks. No List anywhere, Draft Lists and backdrop included, lacks a resolvable
  hospital or surgeon, and every ACTIVE, SUBMITTED or AUTHORISED List has its anaesthetist and Slot
  (FT-07.1). Hunt for surviving "AA rooms", "Not assigned" and "Surgeon TBC" fallbacks and any
  "Unassigned" that is not the Draft List flag. AA rooms is never a Contract holder.
- **Phase 17's helper, privately.** The Draft List picker groups, marks, tier-orders, shuffles and
  filters only through 17's `rankAnaesthetistCandidates` and pieces; no inline sort or preference
  check. `assignDraftList` writes `list.pairingAcknowledged` only for a not-preferred pairing. The
  privacy boundary holds: `officePrivacy.test.ts` passes, nothing outside the Admin app and the
  allowlisted store files reads preferences or tiers, and the PWA stand-in skips a not-preferred
  pairing through a boolean without revealing it.
- **Warn, never block, except the real guards.** A closed session (Unavailable, Holiday or any closed
  status) or a not-preferred choice is selectable, warned before save, and assigned (with a Phase 30
  conflict on a closed session, and 17's acknowledgement on a not-preferred pairing). The only hard
  refusals are an occupied session, an incomplete pairing, a missing day or session, a passed day,
  removing a Draft List that holds active Bookings, detaching a List that is not ACTIVE, and the
  office-only guard.
- **Order and visibility.** Every Draft List view (page, rail card, band lanes, stand-in pick) sorts
  through `compareDraftLists` in ascending date order (US-01.6.2). Opening a Draft List shows everybody
  potentially available (US-01.6.3), and the picker's Everyone and Free only match the availability
  finder.
- **Identity and projection.** No projection, roll forward or new-anaesthetist path overwrites a List
  id held by a Draft List, and no recurring booking projects a second List for a day whose List is a
  Draft List or was assigned from one. Runtime ids are `LG####`, recurring-clash ids are derived and
  stable, and neither collides with the seed's `LD-00n`.
- **Prepayment.** A Booking on a Draft List never generates or withdraws a prepayment invoice;
  assigning runs 27's routine once only for a Booking that never had an anaesthetist (its setup);
  re-dating, detaching and reassigning a returned List re-trigger nothing (US-06.3.5, D20).
- **Audit.** Create, the recurring clash, assign (with the DRAFT to ACTIVE before and after), re-date
  and remove are each audited with before and after; every new action code is labelled; the List's
  History shows its whole trail, including the time it was a Draft List.
- **Determinism and seed hygiene.** The golden-fixture diff shows only the stated changes, with no
  Booking id, List id or other placement moved. The acute surgeon comes from its own RNG stream. No
  fee, invoice or Contract resolution changed (a pre-op Booking's Contract candidates are unchanged at
  AA rooms; `LD-002`'s Bookings touch no existing figure). Seed timestamps are constants; the canned
  request days and the staged clash day derive from the clock with no `new Date()`.
  `PERSIST_VERSION` is bumped and the migrate test extended.
- **Time waiting.** It is computed from the demo clock, updates on every clock move, freezes at
  assignment or removal, survives a date change, and is formatted in one helper.
- **Vocabulary.** Every Draft List word comes from `shared/scheduleTerms.ts`, every pairing and tier
  word from Phase 17's label set. No new app copy says "slot" (OQ-64), "blacklist" or "whitelist". No
  Draft List surface says "being prepared".
- **Design and copy.** The band, rail card and pills use the warning tint and never a status colour,
  so a Draft List never reads as an active List. The rail card sits under 15a's To-do card with the
  same anatomy and leaves room for Phase 32's pool. Teal is the only action colour, the nav badge is
  amber, and crimson is unused. Admin sheets go through `useSurface().Overlay`. No en or em dashes.
  `pwaPurity` holds, and the stand-in is PWA only, badged, and silent about preferences and tiers.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry; ROADMAP.md "Owner review: agents test
  themselves"): the defaults and readings built (OQ-81 part 3 left as Phase 30's conflict; the pre-op
  and acute pairing reading; prepayment on a Draft List's first assignment treated as the Booking's
  setup, nothing on a reassignment of a returned List; seed clash Draft Lists stamped at the notional
  overnight run; no clash Draft List for a past day; the "check with Dr X first" wording on the
  unavailable-anaesthetist warning, against US-01.4.7's "not without them knowing"; the picker's
  group order, Free, Not preferred, Not available, with tiers ordering within each group, Phase 17's
  assumed reading), anything logged rather than fixed, and the screens worth a look, each with its
  route and persona.
- **Status row** for catch-up Phase 31, and a phase entry with:
  - the drift-check result against `60e2d1e`: items changed or not; OQ-81 status; the reading built
    on pre-op and acute pairing, and on emergency sessions if any status now has an emergency-only
    behaviour; the names 15b, 15a, 17, 27, 28, 29 and 30 actually used (including 28's `clashes` and
    30's `skipped` shapes, and the `listAssigned` cause 27 shipped);
  - what was built, with a name map for later phases: `ListState` with DRAFT, `DraftList`,
    `AssignedList`, `DraftTrail` (with `projectedFor`), `DraftOrigin`, `isDraftList`,
    `isActivePairing`, `createDraftList`, `assignDraftList`, `redateDraftList`, `removeDraftList`,
    `insertDraftList`, `attachListToSlot`, `detachListToDraft`, `draftListFitsAnaesthetist`,
    `recurringClashDraft`, `recurringClashListId`, `compareDraftLists`, `pairingIssues`,
    `draftListAvailability`, `waitingLabel`, `locationName`, `shared/scheduleTerms.ts`,
    `HOSP.aaRooms`, `stageRecurringClash`, and the now-required `List.hospitalId` and
    `List.surgeonId`;
  - the seeded Draft Lists (the requests and the recurring clashes, with the count the seed test
    pins);
  - the `PERSIST_VERSION` bump (from and to);
  - the golden-fixture diff summary;
  - the tests added, and the before and after Vitest and Playwright counts;
  - the review pass;
  - the Catalogue screenshots result: recipes created or changed, the REPORT.md counts (captured, partial, absent, failed) before and after, and any partial reason handed to a later phase (US-01.4.3, US-01.4.5 and US-01.5.5 to Phase 32; US-01.4.6 and US-01.4.7 to Phase 32a; US-01.1.2 to Phase 44).
- **Decisions log:**
  1. **Superseded:** 2026-07-23 "PermanentList type gains `hospitalId: HospitalId | null`". The pre-op
     clinic is held at the **AA rooms location** (`Hospital.locationType: 'aaRooms'`), never a
     Contract holder. Templates (`RecurringBooking` since Phase 30) and Lists always carry a hospital
     and a surgeon (US-01.3.1).
  2. **Superseded:** the Phase 02 and 06 "surgeon TBC" design state (the Fitzgerald Tue 21 PM List
     with an amber "Surgeon not yet assigned" flag, reproduced from `Admin Day.dc.html`). It is now a
     Draft List with its surgeon named; the catalogue rule wins over the mockup (convention 17's rule
     2, OQ-44).
  3. **Superseded:** Phase 28's interim "pre-op Lists come only from recurring bookings". Assign List
     and phone advice offer every booking-scope kind, and phone advice requires a surgeon.
  4. **Superseded (OQ-81 part 2, settled in the room):** the generator's silent drop of a recurring
     booking under an unavailable session (Phase 06's canvas, traced as `clashes` and `skipped` by
     Phases 28 and 30). From today on, such a session becomes a Draft List with no anaesthetist, not a
     List flagged on the anaesthetist. The anaesthetist's calendar (series included) is painted
     first.
  5. **Superseded plan reading (D14):** this phase's earlier plan to turn an anaesthetist's
     unavailability into Draft Lists automatically. The anaesthetist chooses to return or assign
     (US-01.5.5, Phase 32); office-recorded sickness stays Phase 30's conflict (OQ-81 part 3 open).
  6. **Superseded plan reading (EP-07, 2026-10-07):** this phase's earlier plan that a Draft List is
     derived from the missing anaesthetist and never a state, with the approval state DRAFT shown as
     "Open". DRAFT is now the Draft List's state, ACTIVE the assigned List's (15b's rename), and no
     List is labelled "Open".
  7. **New (OQ-44 answered; EP-07):** a Draft List is a List in state DRAFT with no anaesthetist and
     no Slot. Hospital, surgeon, day and session are required; it may hold Bookings; it is office only
     (OQ-86 answered no, D46); it is removed or re-dated, not closed. Assigning makes it ACTIVE; only
     an ACTIVE List goes back to DRAFT. Our reading: removal is refused while it holds an active
     Booking, and the reason is optional.
  8. **New, reading (no OQ):** pre-op clinics name the surgeon whose patients they assess, and acute
     Lists name the on-call surgeon. The acute pick comes from its own RNG stream.
  9. **New:** assigning a Draft List means choosing only the anaesthetist; the session is fixed by its
     day and session (change the date to use another day), and the picker shows everybody potentially
     available through Phase 17's helper: Free, Not preferred (labelled), Not available, each ordered
     by tier and shuffled within a tier, then Already has a List (disabled). Only an occupied session,
     an incomplete pairing, a passed day or the office-only guard refuse. Closed (Unavailable,
     Holiday) and not-preferred choices warn and go ahead (US-01.6.3, US-01.3.5), the closed one
     telling the office to check with the anaesthetist. The picker has no emergency group because no
     emergency-only status exists.
  10. **New:** Draft Lists sort in ascending date order everywhere, through one comparator
      (US-01.6.2).
  11. **New:** a Draft List at a hospital with a holiday carries Phase 30's `holiday` conflict like
      any List and shows on the Conflicts screen as "Unassigned" (answers Phase 30's handoff). A
      recurring clash is never an "Anaesthetist unavailable" row there (US-01.5.4 AC3).
  12. **New:** user-facing Draft List words ("Draft List", "Unassigned", "DRAFT", the origin labels)
      live in one module; "slot" is never in app copy (OQ-64).
  13. **New:** the "over a day" waiting emphasis is display only, not a rule.
  14. **New:** the PWA stand-in logs a request for the persona's next open session when no Draft List
      fits, so the handset beat never dead-ends; it skips not-preferred pairings through a boolean.
  15. **New:** the Admin Day rail order is calendar, To-do (15a), Draft Lists, then Phase 32's pool,
      notes, Awaiting review.
  16. **New:** a recurring-clash Draft List answers for its day through `draft.projectedFor`, even
      after it is re-dated or removed, and a List detached to the office keeps its
      `recurringBookingId`, so a recurring booking never re-creates either for that day.
  17. **New, built default (US-06.3.5, D20):** a Booking created on a Draft List gets its prepayment
      evaluated when the Draft List is first assigned (its setup); a reassignment of a List that
      already had an anaesthetist re-triggers nothing.
- **Handoff notes:**
  - For **32**: `detachListToDraft(s, listId, { origin: 'movedToOffice' | 'unavailableReturn', ... })`
    is the ACTIVE to DRAFT transition for the move or withdrawal to the office and the "return to the
    office" choice of US-01.5.5 (the origin labels are in `ORIGIN_LABELS`); it refuses a SUBMITTED or
    AUTHORISED List and re-triggers no prepayment; a Draft List has no owner, so it cannot be moved by
    an anaesthetist. `assignDraftList` calls 27's `syncPrepayment` with `listAssigned` **only** for a
    Booking that never had an anaesthetist (its setup, built default 17 above); for a List 32 returned
    to the office, whose Bookings already had one, it calls nothing. 32's "no re-check on a move"
    check must keep that setup call and confirm only that no Booking that already had an anaesthetist
    is re-checked. The anaesthetist's colleague picker gets no grouping, tier order or warning
    (US-01.4.5): never reuse the office picker there. The rail has room for the notification pool under
    the Draft Lists card. Phase 30's conflict flag is still what an anaesthetist marking a booked
    session unavailable gets until 32 replaces it.
  - For **33**: call `createDraftList(api, actor, input, 'hospitalRow')` from the matching screen
    (US-02.1.2; no `source`: it belongs to origin `'request'` only); add a source reference field then
    if the row needs one. The interim `pairingIncomplete` park in `integrationActions.ts` is what 33
    replaces. Bookings created on a Draft List from a row keep their wording and wait for the office's
    Contract like any other.
  - For **34**: per-hospital sync skips the AA rooms location (`locationType: 'aaRooms'`); it has no
    feed.
  - For **35**: assigning a Draft List is a cover change in the List's change history, which 35's
    on-demand update email can pick; a Draft List's Bookings may already have come from the rooms.
  - For **41**: a Draft List's Bookings have no payee until assignment; the first assignment is their
    setup (27's routine runs then). Assigning a Draft List that Phase 32 returned, whose Bookings
    already carry a prepayment, is a move for D38: 41 adds the payee repoint there as on 32's and
    32a's moves.
  - For **42**: AA rooms is a hospital-master row with `locationType: 'aaRooms'`. The Hospitals editor
    must keep it non-deletable and out of the Contract-holder and feed pickers. The request sources
    are a candidate master.
  - For **43**: the day band, the rail card and the booking counts must stay fast at 85 anaesthetists,
    the recurring clash must stay cheap on a full-scale roll forward, and the generated history uses
    the four List states.
  - For **43a**: point-of-need help on Admin Day should explain the Draft Lists card and band.
  - For **44**: S2 Beat 1b is lettered; renumber it in the rewrite, and re-read the Draft List
    discovery points against OQ-81 part 3.
