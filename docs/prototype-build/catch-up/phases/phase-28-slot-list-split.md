# Phase 28 · Slot and List split

**Requirements covered:**
[FT-01.1](../../../../requirements-board/requirements/stories/FT-01.1.md) Rolling canvas generation (a configurable horizon, four months in current practice; only active anaesthetists) ·
[US-01.1.1](../../../../requirements-board/requirements/stories/US-01.1.1.md) Two Slots per anaesthetist per day (every Slot stored and free by default, the calendar painted before recurring bookings; the recurring clash becoming a Draft List is Phase 31) ·
[FT-01.2](../../../../requirements-board/requirements/stories/FT-01.2.md) Slot availability status (a status on the Slot, one mechanism with the calendar) ·
[US-01.2.3](../../../../requirements-board/requirements/stories/US-01.2.3.md) Status is independent of bookings, and a List shows in place of the status ·
[US-01.3.3](../../../../requirements-board/requirements/stories/US-01.3.3.md) Manual List assignment ·
[US-01.1.4](../../../../requirements-board/requirements/stories/US-01.1.4.md) Slot default times ·
[US-01.1.3](../../../../requirements-board/requirements/stories/US-01.1.3.md) Slots from the anaesthetist's start date ·
[US-01.4.2](../../../../requirements-board/requirements/stories/US-01.4.2.md) Availability finder (every anaesthetist on the Admin Day grid; a session holding a List is never offered as free; the office's finder lists the available anaesthetists through Phase 17's helper, by priority tier and shuffled within a tier, with not-preferred pairings apart, per US-01.3.5 and US-01.3.6; the anaesthetists' own finders stay untiered) ·
[DM-02](../analysis/domain-model-delta.md#dm-02) Slot, List and Draft List are three things (the Slot and List half, with the start date and the horizon setting; Draft List is Phase 31) ·
[DM-04](../analysis/domain-model-delta.md#dm-04) Availability is a status on the Slot, not a second record reconciled into the List (the model half; the calendar and the editable status master are Phase 29) ·
[RV-14](../analysis/reverse-check.md#rv-14-list-and-slot-are-one-record-a-free-list-that-gains-a-booking-still-reads-free-and-is-unreachable-to-the-anaesthetist-statuses-are-a-fixed-enum) List and Slot are one record; a Free List that gains a booking still reads Free.
Read alongside (not closed here):
[EP-01](../../../../requirements-board/requirements/stories/EP-01.md) (the settled logical model, and its note that "slot" is never shown in the UI),
[US-01.1.2](../../../../requirements-board/requirements/stories/US-01.1.2.md) (horizon rolls forward daily: Matches today, kept green by the re-pointed roll-forward),
[FT-01.3](../../../../requirements-board/requirements/stories/FT-01.3.md) and
[US-01.3.1](../../../../requirements-board/requirements/stories/US-01.3.1.md) (the pairing rule: Phase 31),
[US-01.3.2](../../../../requirements-board/requirements/stories/US-01.3.2.md) (recurring bookings, the catalogue's name for Permanent Lists: Phase 30 renames them),
[US-01.3.5](../../../../requirements-board/requirements/stories/US-01.3.5.md) and
[US-01.3.6](../../../../requirements-board/requirements/stories/US-01.3.6.md) (the not-preferred pairing warning on every office assign or move, and the admin-only priority tiers: Phase 17 builds the helper, the pickers and the privacy boundary and closes both; this phase wires them into the new Assign List sheet, the Slot-based reassign and the office's availability finder),
[US-01.4.5](../../../../requirements-board/requirements/stories/US-01.4.5.md) (no preference warning when an anaesthetist moves their own List: Phases 32 and 32a; nothing here reaches the anaesthetist apps),
[EP-07](../../../../requirements-board/requirements/stories/EP-07.md) and
[FT-07.1](../../../../requirements-board/requirements/stories/FT-07.1.md) (the List states DRAFT, ACTIVE, SUBMITTED, AUTHORISED: 15b renamed the assigned List's state to ACTIVE; Phase 31 adds DRAFT for Draft Lists; here an empty session stops carrying a state at all),
[US-06.3.5](../../../../requirements-board/requirements/stories/US-06.3.5.md) and
[US-06.5.4](../../../../requirements-board/requirements/stories/US-06.5.4.md) (a move is an honour system: no logic detects it and nothing re-checks a prepayment; the payable's payee repoint on a move is Phase 41's, OQ-80 and D38),
[US-01.4.1](../../../../requirements-board/requirements/stories/US-01.4.1.md) (reassign: its technical discussion is the mechanism this phase builds; the update email is Phase 35's on-demand button),
[US-01.2.1](../../../../requirements-board/requirements/stories/US-01.2.1.md),
[US-01.2.2](../../../../requirements-board/requirements/stories/US-01.2.2.md) and
[US-01.5.3](../../../../requirements-board/requirements/stories/US-01.5.3.md) (the calendar and the user-maintained status master: Phase 29),
[US-01.5.5](../../../../requirements-board/requirements/stories/US-01.5.5.md) (marking a booked Slot unavailable offers return to the office or assign to a colleague: Phase 32),
[FT-01.6](../../../../requirements-board/requirements/stories/FT-01.6.md) (Draft Lists, including a recurring booking that lands on an unavailable Slot: Phase 31),
[OQ-17](../../../../requirements-board/requirements/questions/OQ-17.md),
[OQ-27](../../../../requirements-board/requirements/questions/OQ-27.md) and
[OQ-64](../../../../requirements-board/requirements/questions/OQ-64.md) (answered: the status lives on the Slot; a Slot is a box a List goes into; every Slot stored; no "slot" in the UI),
[OQ-81](../../../../requirements-board/requirements/questions/OQ-81.md) (open; part 1, the generation order, settled in the room and built here; part 2 is Phase 31; part 3, short-notice sickness, is open),
[OQ-84](../../../../requirements-board/requirements/questions/OQ-84.md) (open: the vacated Slot's status after a move; its recommendation is built here for the office reassign),
[OQ-43](../../../../requirements-board/requirements/questions/OQ-43.md) (answered 2026-10-07, D44: private two-way preferences, an admin warning only) and
[OQ-102](../../../../requirements-board/requirements/questions/OQ-102.md) (open, D36: "Not preferred", "Preferred", Tier 1 to Tier 4, one label set in Phase 17),
the meeting notes [2026-10-01 · AA meeting with Greg](../../../../requirements-board/requirements/notes/2026-10-01-aa-meeting-with-greg.md) (#9, #13, #42),
[2026-10-02 · AA meeting with Greg](../../../../requirements-board/requirements/notes/2026-10-02-aa-meeting-with-greg.md) (#5, #27, #29, #30),
[2026-10-02 · AA requirements review with Greg](../../../../requirements-board/requirements/notes/2026-10-02-aa-requirements-review-with-greg.md) (#1, #20, #21, #22, #23, #24, #51, #82),
[2026-10-07 · AA client meeting](../../../../requirements-board/requirements/notes/2026-10-07-aa-client-meeting.md) (#4, #20 to #23: preferences and tiers) and
[2026-10-07 · List lifecycle states](../../../../requirements-board/requirements/notes/2026-10-07-list-lifecycle-states.md) (#1 to #3), and the
"Slot, List and Draft List" section of [domain-model.md](../../../../requirements-board/requirements/domain-model.md) (including its "whoever submits a List did its procedures" and honour-system bullets).
**Depends on:** 15b (the List state `DRAFT` renamed `ACTIVE` everywhere, `ListState = 'ACTIVE' | 'SUBMITTED' | 'AUTHORISED'`, the drawer and Move picker printing the catalogue's state names, and an empty free session's drawer already showing no state) and 17 (the pairing preferences and priority tiers: the pure `src/domain/pairingPreferences.ts` with `rankAnaesthetistCandidates`, `groupSurgeonsForAnaesthetist`, `notPreferredWarning` and `notPreferredEntryIds`; the Admin-only `src/apps/admin/components/pairing/` pieces `SurgeonPicker`, `AnaesthetistCandidates`, `NotPreferredWarning` and `useNotPreferredWarning`; the office-only `officePrivate` slice and `store/officePrivate.ts`; the shell's `suggestionSeq`; the `*.pairingAcknowledged` meta on `editList` and `reassignList`; and the `officePrivacy.test.ts` boundary). Built before it and relied on: 14 (the demo-trigger registry, `useDemoTriggerContext`, `OFFICE_SIMULATION_ACTOR` in `store/demoActors.ts`, `store/officeStandIn.ts` and the PWA sheet `src/pwa/PwaDemoActions.tsx`), 15 (Booking vocabulary: `bookingsForList`, `createBooking`, `schedule.bookings`) and 15a's session 1 (the `appSettings` slice this phase extends). By the roadmap order 16 to 27 have also run; they touch `Anaesthetist` (26's profile), `types.ts` and the persist version, not this model. First phase of the Schedule track; 29 to 32a build on it.
**Estimated:** 2 sessions, and full ones: this is the largest structural change on the schedule side. Session 1 is the model, store and seed with every reader re-pointed (work items 1 to 12), re-greened and demoable with no visible change except the fixed behaviours (free-by-default far edge, the Admin roster, the finders). Deleting `listForSlot`, `List.statusKey` and `ListPatch`'s times forces a minimal re-point of the drawer, phone advice, Edit list and Reassign in session 1 (work item 12, "compile-forced minimums"); session 2 finishes them. Session 2 adds the new office flows, the Schedule settings editor (horizon and default times), the start-date and active handling in the anaesthetist sheets, the office availability finder on 17's tier and preference helper, the stand-in trigger and the demo guide (work items 13 to 24). If session 1 runs long, keep the golden test and the green gate and move the README paragraph (24) and the capture-recipe edits (23, the Catalogue screenshots step) to the end of session 2 rather than cutting tests.

## Goal

The catalogue separates three things the prototype welds into one. A **Slot** is the AM or PM
half-day every active anaesthetist has on every day of the schedule horizon, from their start date;
it is a box with a status, free by default, and can be empty. A **List** is assigned to an
anaesthetist, is put into exactly one Slot and holds Bookings. A Draft List is a List with no
anaesthetist yet (Phase 31). Today an empty Slot *is* a List (`statusKey: 'free'`, and since 15b `state: 'ACTIVE'`),
the List id is derived from the Slot, one six-value `statusKey` mixes availability (free,
unavailable, holiday) with what is booked (private, public, pre-op), and availability is a second
record (`masters.availability`) reconciled into the Lists. The generator also invents bookings and
unavailability with a slot RNG on every rolled day and every new anaesthetist, runs for inactive
anaesthetists too, and the horizon is a code constant. The admin grid paints a phone-booked Free
List as Private while both anaesthetist apps and the finders still say Free, and the Admin Day grid
never shows an anaesthetist added after the seed. Nothing in the office's tools lists the available
anaesthetists for a session in any order but the roster's.

**OQ-64 is answered** (2026-10-02), on top of OQ-17 and OQ-27 (2026-10-01): a day holds an AM and a
PM Slot for every active anaesthetist; a Slot is a box, or container, with a status; a List is put
into it and then shows in place of the status; **every Slot is created and stored** across the
rolling horizon; how it is stored is for the developers; and **the word "slot" never reaches the
UI** (users see Lists, and free or unavailable sessions look much as they do today). The status
values start from free, on holiday and unavailable ("you decide for now"); Phase 29 makes them a
user-maintained list. **US-01.1.1** (Confirmed) sets the generation run, and **OQ-81 part 1** was
settled in the room: write an AM and a PM Slot, as free, for every active anaesthetist; then paint
the anaesthetist's own calendar; then paint the surgeons' recurring bookings on top. **FT-01.1**
makes the horizon a setting, four months in current practice: shortening it drops the far-edge days
and extending it fills them. These are built as answered, not as defaults.

This phase introduces:

- a **Slot** record for each **active** anaesthetist, day and session **from the anaesthetist's
  start date** to the horizon end, with a deterministic id (`S-<reg>-<date>-<AM|PM>`), holding the
  Slot's **status** (free by default), an optional note, optional start and end time **overrides**
  and (until Phase 32 removes it) the cover-request marker;
- **generation in the catalogue's order** (US-01.1.1): every new Slot starts free (the RNG fill of
  private, public and unavailable sessions goes, on rolled days, on new anaesthetists and on a
  horizon extension), then the calendar, then the recurring bookings; a recurring booking that
  meets an unavailable Slot is not projected and is traced for Phase 31, which turns it into a Draft
  List (OQ-81 part 2). The seed keeps a plausible demo window by recording the office assignments
  and availability already made in it (work item 6);
- a **start date** on the anaesthetist (US-01.1.3), set in the Add flow and editable afterwards, so
  a new anaesthetist's Slots begin on that date, not on the demo clock's today; and the **active**
  flag read at last: an inactive anaesthetist gets no new Slots;
- one **schedule-settings record** (`appSettings.schedule`): the **horizon in months** (4, FT-01.1)
  and the default AM and PM start and end times (US-01.1.4), both editable by the office, with
  per-Slot time overrides;
- the **List** as its own record with a `slotId` and a `kind` (private, public, pre-op), created only
  on assignment, in the state **`ACTIVE`** (15b's name; it has its anaesthetist, surgeon, hospital,
  day and session, FT-01.3 and FT-07.1): by the office (**Assign List**, which requires a surgeon and
  a hospital and turns a free session into an ad hoc List, or **Book (phone advice)**, which assigns
  and then adds a Booking), or by the recurring-booking projection when the canvas is generated. The
  office's surgeon picker is Phase 17's `SurgeonPicker`, and a not-preferred pairing gets 17's soft
  warning and acknowledgement, never a block (US-01.3.5 "Every office path");
- a **displayed status** that is the List's kind when a List is in the Slot and the Slot's status
  otherwise, never derived from bookings, computed by one pure function and read identically by
  mobile, web, admin and the **availability finders** (US-01.4.2), so a phone-booked session no
  longer reads Free anywhere. The six-colour design language stays, because the derived key is the
  same six keys behind one lookup;
- the **Admin Day grid's roster from the anaesthetist master** (every anaesthetist with a Slot on
  that day), so added anaesthetists appear and the grid matches the finders;
- an **office availability finder** on the Admin Day view ("Find available"): for a day and session
  it lists every anaesthetist whose session is open, through Phase 17's `rankAnaesthetistCandidates`
  and `AnaesthetistCandidates`, **ordered by priority tier, shuffled within a tier, with a tier
  filter, and with the not-preferred pairings for a chosen surgeon in their own labelled group**
  (US-01.3.5, US-01.3.6, US-01.4.2); picking a row opens that session ready for Assign List. The
  anaesthetists' own finders on mobile and web stay name-ordered and show no tier or preference
  (US-01.3.6 "Admin only", 17's privacy boundary);
- **Reassign** as a move of the List between Slots: the List keeps its id, Bookings and history, the
  target Slot must be empty and free, and the vacated Slot returns to free unless the office marks it
  otherwise. Its candidates stay in 17's grouped, tier-ordered picker and a not-preferred target keeps
  17's acknowledgement. A move re-checks **no** prepayment and recalculates no invoice (US-06.3.5,
  US-06.5.4: an honour system); Phase 41 hangs the payable's payee repoint on `moveListToSlot`
  (OQ-80, D38).

Every reader is re-pointed: the canvas generator, the clock roll-forward, selectors, the Admin Day
grid and drawer, the mobile schedule and availability screens, the web Lists, week strip,
availability grid and dashboard, the Phase 14 registry and the demo inspector. **No new app copy
says "slot"** (OQ-64): the UI says session, AM or PM, and "Slot" stays a code and planning word.
Empty Slots stop carrying a List state at all, which makes 15b's "no state on a free session" rule
structural and leaves `DRAFT` free for Phase 31's Draft Lists. `PERSIST_VERSION` is bumped.

## Before you start: drift check

1. Diff the covered and read-alongside items against the plan's snapshot (catalogue commit
   `60e2d1e`, the 2026-10-07 meetings and the 2026-10-08 plan update):

   ```
   node docs/prototype-build/catch-up/tools/plan-state.mjs --diff FT-01.1,US-01.1.1,FT-01.2,US-01.2.3,US-01.3.3,US-01.1.4,US-01.1.3,US-01.4.2,US-01.1.2,EP-01,EP-07,FT-07.1,FT-01.3,US-01.3.1,US-01.3.2,US-01.3.5,US-01.3.6,US-01.4.1,US-01.4.5,US-01.2.1,US-01.2.2,US-01.5.3,US-01.5.5,FT-01.6,US-06.3.5,US-06.5.4,OQ-17,OQ-27,OQ-43,OQ-44,OQ-64,OQ-80,OQ-81,OQ-84,OQ-86,OQ-102
   ```

   Also run the whole-catalogue diff from ROADMAP.md "When the catalogue changes" and scan it for new
   items that name Slot, List, availability, status, horizon, start date, active or default times.
   (At plan update, 2026-10-08, this doc is current at `60e2d1e`. What `60e2d1e` changed, and this
   plan already reflects: the covered items moved to `requirements-board/requirements/` and gained
   artifact links only (AR-17, AR-18, AR-19), with no change of substance; EP-01, FT-01.3 and FT-01.6
   name the List states DRAFT, ACTIVE, SUBMITTED and AUTHORISED (EP-07, FT-07.1: a List with all five
   of its pairing is ACTIVE; 15b renamed the state, Phase 31 adds DRAFT); US-01.2.2 now says "List
   state"; US-01.3.5 is widened to every office assign or move, with grouped pickers, tier order and
   preferred pairings shown, and US-01.3.6 (priority tiers, Verify) is new, both built by Phase 17
   and consumed here by the Assign List sheet, the reassign and the office's availability finder;
   US-01.4.5 is now **no** warning on an anaesthetist's own move; US-06.3.5 and US-06.5.4 make a move
   an honour system with no prepayment re-check; OQ-43 and OQ-86 are answered; OQ-81, OQ-84 and
   OQ-102 are still open. Earlier, at `60e2d1e`: OQ-64 answered; FT-01.1's configurable horizon;
   US-01.1.1's "every Slot stored" and generation order; US-01.1.4's and US-01.3.3's notes.)
2. If an item changed, re-read it and adjust the work items. Things to look for:
   - **FT-01.1**: if the horizon becomes something other than whole months (weeks, a date), the
     setting in work item 5 takes that shape; if shortening is ruled to keep Lists with Bookings, the
     `listsBeyondHorizon` refusal in work item 9 becomes a keep.
   - **US-01.1.1 / OQ-81**: if part 1's order is reversed (recurring bookings before the calendar),
     swap the two painting steps in work item 4 (the clash trace then runs the other way); if part 2
     changes from "becomes a Draft List", the clash trace still stands and Phase 31's handoff
     changes.
   - **US-01.3.3**: if manual assignment no longer requires a surgeon (for example "surgeon or
     hospital"), relax the Assign List validation to match. Its note says anaesthetists are not
     expected to turn a free Slot into a List; if that changes, the anaesthetist apps gain an assign
     path, which is a new work item.
   - **US-01.3.5 / US-01.3.6 / OQ-102**: if the tier order and the not-preferred grouping are ruled to
     combine differently (for example one tier-ordered list with not-preferred rows flagged in
     place), change it in 17's helper, never in the finder; if tiers become visible to anaesthetists,
     stop (the privacy boundary is 17's). New tier or pairing names come through 17's label set.
   - **US-06.3.5 / US-06.5.4 / OQ-80**: if a move is again ruled to re-check a prepayment, the hook
     goes in `moveListToSlot`, after the commit, never inline in the flow.
   - **US-01.1.3**: if Slots are to start from something other than the start date, change the
     generator gate in work item 4 to match.
   - **US-01.1.4**: if default times become per hospital or per anaesthetist, the settings record in
     work item 5 takes that shape instead.
   - **US-01.4.1 / OQ-84**: if the vacated-Slot default for an office reassign changes from free,
     change the reassign default to match; if OQ-84 is answered, drop its provisional label.
   - **domain-model.md** "Slot, List and Draft List": if the hierarchy or the Slot's contents change,
     stop and re-plan work items 2 to 4 before building.
   - Any covered item now Retired or Future leaves the covers; record that in the PROGRESS entry.
3. **Decisions and open questions** (ROADMAP D14 and the "Confirm before building" row for 28 to 31):
   - **OQ-17, OQ-27 and OQ-64 are answered (D14).** Build them, with no provisional label: the status
     belongs to the Slot, is free by default and is the one mechanism the calendar edits; a List in
     the Slot shows in place of the status; every Slot is stored; the starting status values are
     free, unavailable and holiday (shown Free, Unavailable and Holiday), chosen for now and made a
     user-maintained list in Phase 29 (keep the keys behind one lookup so 29 can swap it); "slot"
     never appears in app copy; "Draft List" stays reserved for Phase 31.
   - **A Slot holding a List that is marked unavailable** keeps the List and its conflict flag in this
     phase, as today. OQ-64's answer (3) and US-01.5.5 replace that with return to the office or
     assign to a colleague, which Phase 32 builds (it needs 31's Draft Lists). Label it interim in
     code and the Decisions log.
   - **OQ-81 is open, but part 1 was settled in the room** (US-01.1.1, Confirmed): the calendar is
     painted before recurring bookings. Build it. Part 2 (the clash becomes a Draft List) is Phase 31;
     this phase only traces the clash. Part 3 (short-notice sickness) does not touch this phase.
   - **OQ-84 is open**: build its recommendation for the office reassign (the vacated Slot returns to
     free), keeping the office's option to mark it Unavailable or Holiday instead (US-01.4.1 "or is
     marked unavailable if more appropriate"). Label it provisional in one place, the Decisions log
     entry, and list it for the owner. The anaesthetist's own move (asked, defaulting to free) is
     Phase 32.
   - **OQ-44** (Draft List contents, answered) and **OQ-86** (anaesthetists never pull Draft Lists,
     answered no, D46) do not gate this phase. Do not add Draft Lists or the `DRAFT` state here.
   - **OQ-43 is answered (D44)**: preferences are private and two-way, the office gets a soft warning
     on every assign or move, never a block, and anaesthetists see nothing. Build it through 17's
     pieces, with no provisional label. **OQ-102 is open (D36)**: the names come from 17's one label
     set ("Not preferred", "Preferred", Tier 1 to Tier 4); this phase adds no pairing or tier word of
     its own.
   - **A move is an honour system** (US-06.3.5, US-06.5.4; D20 superseded 2026-10-08): no prepayment
     re-check and no invoice recalculation on a reassign. **OQ-80 is open (D38)**: its default, the
     payable's payee repointed on a move, is Phase 41's, which hangs it on this phase's
     `moveListToSlot`; build nothing for it here.
4. **Check the neighbours:**
   - Phases 14 and 15 are DONE (look for `src/shared/demoTriggers/`, `useDemoTriggerContext`,
     `OFFICE_SIMULATION_ACTOR` in `src/store/demoActors.ts`, and `schedule.bookings` / `bookingsForList`).
     If 15 has not run, stop: this phase is written against the Booking names. 15a's `appSettings`
     slice (`domain/warnings/types.ts` `AppSettings`, seeded by `defaultAppSettings()`, merged in
     `store/appStore.ts`) is where the schedule settings go.
   - **Phase 15b is DONE** (`ListState` is `'ACTIVE' | 'SUBMITTED' | 'AUTHORISED'`, `listNotActive`
     is the refusal code, the drawer header prints `ACTIVE`, and the free-session drawer hides the
     state). If 15b has not run, stop: this phase writes `'ACTIVE'` on every List it creates.
   - **Phase 17 is DONE** (`src/domain/pairingPreferences.ts`, `src/store/officePrivate.ts`, the
     `officePrivate` slice, `suggestionSeq` in the shell slice, `src/apps/admin/components/pairing/`
     with `SurgeonPicker`, `AnaesthetistCandidates`, `NotPreferredWarning` and
     `useNotPreferredWarning`, and `src/apps/officePrivacy.test.ts`). If it has not run, stop: the
     Assign List sheet, the reassign and the office finder are written on its helper. Read how 17
     wired `EditListSheet`, `PhoneAdviceBooking` and `ReassignListFlow`, its `*.pairingAcknowledged`
     meta in `editList` and `reassignList`, and its privacy allowlist (which files may name the
     slice), before rewriting any of them.
   - Whether Phase 26 added fields to `Anaesthetist`, `AnaesthetistPatch` or the Add and Edit
     anaesthetist sheets (the anaesthetist profile, and 22's GST number): add `startDateISO` beside
     them, not in a parallel form.
   - Whether Phase 27 left any prepayment re-check on `reassignList` or `reassignBooking`. Under the
     2026-10-08 plan it does not (a move re-checks nothing, US-06.3.5). If one is there, do not carry
     it into `moveListToSlot`: remove it with its tests and log it in the PROGRESS entry.
   - Whether 15b removed Copy and any seed content: the golden fixture (work item 1) is captured from
     whatever the seed is when this phase starts.
   - Note the current `PERSIST_VERSION` (16 at plan update, after 15a's session 1; phases 15b to 27
     may raise it).
5. Record the drift-check result in the PROGRESS entry.

## Reference

**Design files (convention 17).** The six status colours do not change; this phase changes where
the key comes from, not what it looks like. US-01.1.4's note ("a Slot keeps its standard default
shape on screen, even when its List holds only one Booking") is today's grid behaviour: keep it.

- `docs/design/Design Language.dc.html`: the six status colours with tint and on-tint, the dashed Free
  and hatched Unavailable treatments, the warning tint for conflict flags, radii, the sheet motion.
  Teal `#0D6E63` for Assign List, Save and Confirm; crimson never.
- `docs/design/Admin Day.dc.html`: the day grid (block anatomy, dashed Free block with its "open for
  cover" subtitle, merged full-day leave block), the right-hand drawer and the header summary line.
  The empty-session drawer extends the List drawer's anatomy (header, sections, action row); it is
  not a new pattern.
- `docs/design/Mobile App.dc.html` and `docs/design/Mobile Availability.dc.html`: the Forward Lists
  rows (booked, Free "Offer cover", leave) and the availability strip with "My availability".
- `docs/design/Web Dashboard.dc.html` and `docs/design/Web Availability.dc.html`: the week strip
  (dashed Free block, merged holiday block), "Who's free", and the availability grid cells.
- No mockup covers the Schedule settings view, the Assign List sheet, the office availability
  finder, the beyond-horizon day or the start-date field. Extend the Admin master-data table and
  sheet patterns (`useSurface().Overlay`, `FieldLabel`, `TextField type="date"` as in
  `ContractEditSheet`, the Phase 17 sheets and its `AnaesthetistCandidates` rows with neutral tier
  pills, the calm Preferred pill and the warning-tint not-preferred group) and the Day view's
  existing empty state. Tiers and preferences never get a status colour, and crimson never marks
  them.

**Catalogue items:** the eight covered files above; read EP-01, FT-01.3, US-01.3.1 and US-01.4.1 for
the rules this phase must not break or pre-empt, US-01.3.5 and US-01.3.6 for what the office's
pickers and finder must show (17 closes both), and US-01.5.3, US-01.5.5 and FT-01.6 for what 29,
31 and 32 build on this model. US-01.1.4's second sentence ("a booking that runs all day simply uses
both the AM and PM Slot") is already true: there is no all-day type, and the grid's merged full-day
leave block is display only. US-01.1.3's note ("Once created, the Slots can be edited freely") is met
by the Slot status, times and assignment actions below. US-01.3.3's new note (a List made by finding
an anaesthetist on a day) is met by the Admin Day grid: its legend filter is the admin finder, and
Assign List works from any free session on it.

**Analysis files:**

- `docs/prototype-build/catch-up/gaps.json`: items `FT-01.1`, `US-01.1.1`, `FT-01.2`, `US-01.2.3`,
  `US-01.3.3`, `US-01.1.4`, `US-01.1.3`, `US-01.4.2` (re-graded at `60e2d1e`: unchanged in substance),
  and `US-01.3.5` and `US-01.3.6` (Missing at `60e2d1e`; 17 builds them, and the "no admin list of
  available anaesthetists to order or filter" bullet of US-01.3.6 is closed here); `dataModelDeltas`
  DM-02, DM-04 and DM-54 (17's); `reverseFindings` RV-14.
- `docs/prototype-build/catch-up/epics/EP-01.md`: the header note (the structural notes, the "DRAFT"
  collision, the S2 impact list) and the eight covered sections, plus US-01.3.1, US-01.5.4, US-01.5.5,
  US-01.2.1 and US-01.5.3 for what is deliberately left to 29 to 32.
- `docs/prototype-build/catch-up/GAP-ANALYSIS.md`: theme 4 (Slot, List and Draft List) and the DM-02,
  DM-04 and RV-14 rows.
- `docs/prototype-build/catch-up/analysis/domain-model-delta.md` (DM-02, DM-03, DM-04, DM-05) and
  `reverse-check.md` (RV-14, RV-15).
- `docs/prototype-build/catch-up/analysis/prototype-map-store-seed.md` (sections 2, 6, 7 and 9),
  `prototype-map-domain.md` (the `List`, `PermanentList`, `Anaesthetist`, availability and status types, `clock.ts`),
  `prototype-map-shared.md` (`format.ts`, `ListRow`, `StatusLegend`, `RequestCoverSheet`, the audit labels),
  `prototype-map-admin.md` (Day grid, DayNav, ListDrawer, EditListSheet, PhoneAdviceBooking,
  ReassignListFlow, Master data, Add and Edit anaesthetist), `prototype-map-apps-mobile-web.md` (Forward Lists, Availability,
  web Lists, WeekStrip, Availability grid, Dashboard, the "Session model" notes) and
  `prototype-map-shell-demo-pwa.md` (section 7, the PWA, and section 9, extension points). The maps
  predate Phases 14 to 27: Phase 17's and 15b's PROGRESS entries name what they added or renamed.
- `requirements-board/capture/ATLAS.md` and the recipes for US-01.x: they hard-code List ids,
  `[data-testid=admin-list-drawer]` and the "open for cover" text (work item 23).

**Code entry points** (paths under `aa-prototype/src/`; names follow Phase 15's Card to Booking rename map, so where a file kept its old name, use that; line numbers are at plan update and drift):

- **Model:** `domain/types.ts`: `ListStatusKey` and `LIST_STATUS_KEYS` (L53 to 61), `Anaesthetist`
  (L141, `active` at L150, no start date today), `CoverRequest` (L277), `List` (L301),
  `PermanentList` (L585), `AnaesthetistAvailability` (L603, the "reconciled into the canvas" comment
  the catalogue now rejects), `ListStatus` master row (L620); `domain/statusKeyParity.test.ts`;
  `theme/statusColours.ts` (`StatusKey`, `STATUS_ORDER`, the Free, Unavailable and Holiday labels;
  stays as is); `domain/warnings/types.ts` (`AppSettings`, 15a) and `domain/warnings/settings.ts`
  (`defaultAppSettings()`, called by `domain/seed/index.ts`).
- **Horizon:** `domain/clock.ts` (`HORIZON_PAST_DAYS` 14, `HORIZON_FUTURE_MONTHS` 4 at L88, `horizonFor(todayISO)` at L100,
  `enumerateDatesISO`), called by `domain/seed/index.ts` (L365), `store/clockActions.ts` (L30 to 31) and
  `store/mastersActions.ts` (L257).
- **Generator and seed:** `domain/seed/canvas.ts` (`listIdForSlot`, `defaultTimes`, the RNG fill
  branch, `generateListsForDates`, `CanvasMasters` with `anaesthetistIds`), `domain/seed/slotHash.ts` (unchanged),
  `domain/seed/cast.ts` (`ANAESTHETISTS`, all `active: true`, which gain a start date),
  `domain/seed/index.ts` (`patchSlot`, `FREE`, `applyDesignFixups`, `applyPhase06Conflicts`,
  `applyPhase09Slots`, `SEED_LIST_IDS`, `SEED_MARKERS`, the masters and schedule assembly),
  `domain/seed/availabilityAndHolidays.ts` (`AVAILABILITY`, with leave windows out to 2026-09-16), `domain/seed/permanentLists.ts`,
  `domain/seed/history.ts` (the `L-HIST-*` backdrop Lists), `domain/seed/bookings.ts` (the scenario Bookings target Lists by `listIdForSlot`, the filler's
  `bookable` filter at L1186 is keyed on `statusKey`, its slot RNG on `list.id`, and it books only 2026-07-07 to 2026-07-31), `domain/seed/seed.test.ts`.
- **Store:** `store/appStore.ts` (`PERSIST_VERSION`, the `appSettings` merge at L205, `resetDomainState` via `mutate.ts`),
  `store/mutate.ts` (`ID_FORMATS`: `availability` `AV`, `list` `LG`),
  `store/lifecycle.ts` (`ListPatch` and `editList` L491, `reassignList` L543 with `VACATED_STATUSES`,
  `setAvailability` L698, `requestCover` L843, `editRefusal`),
  `store/selectors.ts` (`listForSlot` L39, `listsForDate` L61, `bookingsForList`, `entityCounts`,
  `isBackdropList`), `store/clockActions.ts` (`rollCanvasForward`, which feeds every anaesthetist and `masters.availability` to the generator), `store/mastersActions.ts`
  (`AnaesthetistPatch` and `editAnaesthetist` L185, `NewAnaesthetistFields` and `addAnaesthetist` L241, which generates from the clock's today and reads `masters.availability`; `addPermanentList` L398 and `editPermanentList` with their `statusKey` field; `addHospitalHoliday` and its closed-hospital conflict stamp),
  `store/bookingActions.ts` (`addPostOpAddendum`'s free-session target),
  `store/integrationActions.ts` (S12 target via `listForSlot`, S13 cross-List reschedule,
  `ingestPdfRow`), `store/officeStandIn.ts` (Phase 14), `store/index.ts`.
- **Tests that pin today's behaviour:** `store/lifecycle.test.ts` (reassign, availability),
  `store/canvasRoll.test.ts`, `store/mastersActions.test.ts` (addAnaesthetist canvas),
  `store/phase06Actions.test.ts`, `store/postOpAddendum.test.ts`, `store/integrationActions.test.ts`,
  `store/demoScenarios.test.ts`, `store/persistMigrate.test.ts`, `store/attachmentActions.test.ts`
  and `store/bookingSource.test.ts` (both resolve Lists through `listForSlot`/`listIdForSlot`),
  `domain/domainPurity.test.ts` (reads `statusKey`),
  `apps/admin/components/DayGrid.test.tsx`, `apps/admin/flows/ReassignListFlow.test.tsx`,
  `apps/demo/xeroPairView.test.ts`, `pwa/pwaPurity.test.ts`,
  `shared/audit/auditNarrative.test.ts`.
- **Admin:** `apps/admin/AdminApp.tsx` (the roster built from the static `ANAESTHETISTS` cast array at
  L120 to 129, `dayLists`, `listsByAnaesthetist`, `activeBookingCounts`, the header `summary` with
  `effectivelyBooked`, `drawerListId`), `apps/admin/components/DayNav.tsx` (the unbounded date input
  at L44), `apps/admin/outlet.ts`, `apps/admin/routes.tsx`, `apps/admin/util.ts` (`defaultSpan`, `listSpan`,
  `displayStatusKeyForList`, `isBooked`, `attentionReasons`),
  `apps/admin/components/DayGrid.tsx` (`segmentsFor`, `GridBlock`, the "open for cover" subtitle at L303), `components/ListDrawer.tsx`
  (header prints `list.state`, which 15b hides on a free session through `isFreeEmpty`; the action row),
  `components/RightRail.tsx` (the Day view's rail of cards: mini calendar, internal notes, awaiting
  review) and `components/DayNav.tsx` (the header with the sort toggle), where the office finder's
  entry goes,
  `flows/EditListSheet.tsx`, `flows/PhoneAdviceBooking.tsx` (`isScriptedS2Booking`, the 08:00 to
  12:00 / 13:00 to 17:00 defaults, surgeon "Not assigned yet"), `flows/ReassignListFlow.tsx`
  (`freeTargets` via `listForSlot`, vacated-status picker, "proposed reading" copy), `flows/MoveBookingFlow.tsx` (prints
  `l.state`; its targets are every non-AUTHORISED List on the date, free ones included), `flows/PermanentListSheet.tsx`
  (the `statusKey` select), `flows/AddAnaesthetistFlow.tsx` (L16 and L58: "2 Lists per day across the horizon")
  and `flows/EditAnaesthetistSheet.tsx` (the Active toggle at L23, no start-date field today),
  `screens/MasterData.tsx` or, after 17, `screens/masters/` (the entity sub-nav at L38 to 51,
  `AnaesthetistsView` with its Active column at L185 and its "Adding one extends the canvas forward"
  sub-line; the "List statuses" view at L454; the Permanent Lists table prints `p.statusKey`),
  `screens/ReviewScreen.tsx`, `screens/AdminBookingDetail.tsx`, `screens/IntegrationMonitorScreen.tsx` (PDF target picker).
- **Mobile:** `apps/mobile/screens/ForwardListsScreen.tsx` (`toRow` by `statusKey`),
  `screens/AvailabilityScreen.tsx` (strip dots L51, "N free sessions" L65, the cover chips L74 to 84,
  Free only L116, the "My availability" Free and Block calling `setAvailability` with `'available'`
  or `'unavailable'`; every free test is `statusKey === 'free'`),
  `screens/ListDetailScreen.tsx`, `screens/BookingDetailScreen.tsx`, `apps/mobile/routes.tsx`,
  `components/SlideStack.tsx`.
- **Web:** `apps/web/screens/ListsScreen.tsx`, `components/WeekStrip.tsx`,
  `screens/AvailabilityGrid.tsx` (`hasFree` at L62 on `statusKey === 'free'`), `screens/DashboardScreen.tsx` (day summary, offer cover, "Who's
  free"), `screens/ListDetailView.tsx`, `screens/BookingDetailView.tsx`, `apps/web/WebApp.tsx`.
- **Phase 17 (read, reuse, do not fork):** `domain/pairingPreferences.ts` (`rankAnaesthetistCandidates`,
  `groupSurgeonsForAnaesthetist`, `notPreferredWarning`, `notPreferredEntryIds`, `PAIRING_LABELS`,
  `TIER_LABELS`), `store/officePrivate.ts` (`selectPairingPreferences`, `selectPriorityTiers`; not in
  the store barrel), `apps/admin/components/pairing/` (`SurgeonPicker`, `AnaesthetistCandidates`,
  `NotPreferredWarning`, `useNotPreferredWarning`), the shell's `suggestionSeq`, the
  `*.pairingAcknowledged` meta in `lifecycle.ts`, and `apps/officePrivacy.test.ts` (its allowlist of
  files that may name the slice gains `store/slotActions.ts`).
- **Shared:** `shared/format.ts` (`sessionTimeRange`), `shared/schedule/ListRow.tsx`,
  `shared/StatusLegend.tsx`, `shared/flows/RequestCoverSheet.tsx` (`listId`),
  `shared/audit/actionLabels.ts`, `shared/audit/fieldLabels.ts` (`statusKey`),
  `shared/demoTriggers/registry.ts` and `context.ts` (Phase 14).
- **Demo:** `apps/demo/DemoData.tsx` (the "2 Lists per anaesthetist" invariant banner, the
  state filter), `apps/demo/DemoControlPanel.tsx` (`SCENARIOS` S2 text).
- **PWA:** `pwa/PwaDemoActions.tsx` (Phase 14), `pwa/officeSimulation.ts`, `pwa/pwaPurity.test.ts`;
  and, outside `src/`, `aa-prototype/visual/pwa-device.spec.ts` and `aa-prototype/visual/admin-phase06.spec.ts`.

## Work items

### Session 1: the model, the store and the seed, every reader re-pointed

1. **Baseline and a golden fixture of today's canvas.** Run `npm run build`, `npm run build:pwa`,
   `npx vitest run` and `npm run shots`; record the counts and keep `visual/shots/` as the before set.
   Then, **before changing the generator**, add `domain/seed/canvasGolden.test.ts` with a committed
   fixture (`domain/seed/__fixtures__/canvas-golden.json`) captured from today's `buildSeed()`:
   - **the demo window**, every anaesthetist and session over 2026-07-07 (the horizon start) to
     2026-08-16: `{ statusKey, hospitalId, surgeonId, notes, startTime, endTime, conflicts }` keyed by
     the slot;
   - every seeded Booking's `{ id, listId, patientId }` and every `SEED_LIST_IDS` value;
   - **the far edge**, the last seven days of the horizon, in a separate fixture section.
   After the split, the test maps each Slot and its List through `displayStatusKey` and
   `effectiveSlotTimes` (work item 3) and **must reproduce the demo window and the Bookings exactly**:
   `notes` reads the List's `notes` when the Slot holds a List and `slot.note` when it does not;
   `hospitalId`, `surgeonId` and `conflicts` read the List (absent and `[]` on an empty Slot); times
   are compared only where today's List carried them (free, unavailable and holiday rows carry none
   today). This proves the split and the seed's recorded office assignments (work item 6) kept every
   RNG draw, every placement and every Booking the demo uses. **The far-edge section is the one
   deliberate change**: in the commit that removes the RNG fill (work item 4), regenerate it once,
   say so in the commit notes and the PROGRESS entry, and assert beside it that every far-edge Slot is
   free unless the seed calendar (`SEED_LEAVE`) or a recurring booking painted it. Every seeded
   anaesthetist's start date precedes the horizon (work item 6), so the start-date gate changes
   nothing. Later phases that deliberately change seed content regenerate the fixture and say so.

2. **Types** (`domain/types.ts`). DM-02, DM-04, US-01.1.3, FT-01.1.
   - `SlotId = string`. `SlotStatus = 'free' | 'unavailable' | 'holiday'` (`SLOT_STATUSES`), the
     starting values the OQ-64 answer settled for now (US-01.2.1's note: free by default, on holiday,
     unavailable). Its doc comment says the status belongs to the Slot, is the one mechanism the
     calendar edits (FT-01.2, OQ-27), and that Phase 29 turns the set into a user-maintained master
     list (US-01.2.2), so every reader goes through the one label and colour lookup (work item 3).
   - `interface Slot { id; anaesthetistId; dateISO; session; status; note?; startTime?; endTime?; coverRequest? }`.
     `startTime`/`endTime` are the per-Slot overrides (US-01.1.4 "each Slot can override");
     `coverRequest` moves here from `List` until Phase 32 removes it (the anaesthetist then moves
     their own List instead).
   - `ListKind = 'private' | 'public' | 'preop'` (`LIST_KINDS`). The catalogue models no List kind
     (DM-04: private, public and pre-op appear only as RFP candidate statuses); it is kept as a List
     attribute so the six-colour design language and the seed's acute and pre-op Lists still read.
     Phase 29 keeps it closed and outside the status master. List it for the owner.
   - `List`: add `slotId: SlotId` and `kind: ListKind`; remove `statusKey`, `startTime`, `endTime` and
     `coverRequest`. Keep `anaesthetistId`, `dateISO` and `session` on the List as **denormalised
     copies of its Slot's**, written only by the store actions that set `slotId` (work item 9), so the
     hundreds of existing `l.anaesthetistId === ...` filters keep working. The invariant test in work
     item 6 checks they never drift.
   - `Anaesthetist` gains **`startDateISO: IsoDate`** (required), with a comment citing US-01.1.3
     ("creates their Slots from their start date"). `NewAnaesthetistFields` and `AnaesthetistPatch`
     gain it. Its `active` comment now says it gates Slot generation (FT-01.1, US-01.1.1 "every
     active anaesthetist").
   - Rename the six-key union to `DisplayStatusKey` / `DISPLAY_STATUS_KEYS` (same six strings, same
     order) and delete `ListStatusKey`, so the compiler finds every reader. `ListStatus` master rows
     are keyed by `DisplayStatusKey`. Rename `statusKeyParity.test.ts`'s subject accordingly; parity
     with the theme's `StatusKey` still holds, and a second parity line checks `SLOT_STATUSES` and
     `LIST_KINDS` together are exactly the six keys.
   - `interface ScheduleSettings { horizonMonths: number; defaultTimes: Record<Session, { startTime: WallTime; endTime: WallTime }> }`,
     held as `AppSettings.schedule` (15a's slice, `domain/warnings/types.ts`; move `AppSettings` to
     `domain/types.ts` or a `domain/settings.ts` if it reads better, keeping its export).
   - `PermanentList` (the recurring-booking template; Phase 30 renames it): `statusKey` becomes
     `kind: ListKind`; add optional `startTime`/`endTime` (the pre-op templates carry 09:00 to 12:00
     and 13:00 to 17:00, which the projection writes as Slot overrides).
   - `AnaesthetistAvailability` leaves the masters, and with it the "reconciled into the canvas"
     model. Keep the shape only as the seed's calendar input (rename to `SeedLeaveWindow`, with
     `status: SlotStatus`), consumed by the generator.

3. **The pure Slot module** (`domain/slots.ts`, no React, exported from `domain/index.ts`) with
   `domain/slots.test.ts`:
   - `slotIdFor(anaesthetistId, dateISO, session)` returns `S-<reg>-<date>-<AM|PM>`. (Surgeon ids
     also start `S-`, for example `S-HALE`; the registration-and-date shape keeps them distinct, and
     no code may infer an entity's type from an id prefix.)
   - `projectedListId(anaesthetistId, dateISO, session)` returns today's `L-<reg>-<date>-<AM|PM>`
     (renamed from `listIdForSlot`). Its doc comment says it names the Slot the List was **born**
     in, is used only by the projection and the seed, and must never be parsed to find a List's
     current Slot. Keeping this form keeps every seeded List id, every `SEED_LIST_IDS` value, the demo
     guide's direct URLs and the capture recipes' URLs valid. Lists created at runtime take `LG####`
     from the counter (work item 9).
   - `displayStatusKey(slot: Slot, list: List | undefined): DisplayStatusKey`: a List present returns
     `list.kind` (the List shows in place of the status, US-01.2.3 and FT-01.2); otherwise it returns
     `slot.status`. **It takes no Bookings**, which is how US-01.2.3 ("never derives a Slot's status
     from its booking activity") is guaranteed by the signature. A List on an unavailable Slot shows
     its kind plus its conflict flag, as today (the colour change is Phase 30; return-or-assign is
     Phase 32).
   - `displayStatusLabel(key)`: the one label lookup every screen uses (today it reads the theme's
     labels); Phase 29 points it at the status master.
   - `effectiveSlotTimes(slot, settings)` returns `{ startTime, endTime, overridden }`: the Slot's
     override where set, else the settings default for its session (US-01.1.4).
   - `isOpenSlot(slot, list)`: status free and no List (the "Free" the finders, cover chips and "Free
     only" filters mean, US-01.4.2).
   - `slotDatesFor(startDateISO, datesISO)`: the subset on or after the start date (one helper for the
     generator, roll-forward and the start-date edit).
   - `domain/clock.ts`: `horizonFor(todayISO, horizonMonths)` takes the setting (the constant
     `HORIZON_FUTURE_MONTHS` becomes `DEFAULT_HORIZON_MONTHS = 4`, used only to seed the setting);
     add `horizonDatesBetween(oldEndISO, newEndISO)` for extend and roll-forward.
   - Tests: the full `displayStatusKey` table (three statuses with no List, and every kind on every
     status); `effectiveSlotTimes` with and without overrides and after a settings change;
     `slotDatesFor` at, before and after the start date; `horizonFor` at 1, 3, 4 and 12 months.

4. **Generator** (`domain/seed/canvas.ts`): `generateCanvasForDates(masters, datesISO)` returns
   `{ slots: Slot[]; lists: List[]; clashes: RecurringClash[] }` and replaces `generateListsForDates`.
   It is the one generation path for the seed, roll-forward, `addAnaesthetist`, a start-date edit,
   reactivation and a horizon extension.
   - `CanvasMasters` becomes `{ anaesthetists: readonly { id; startDateISO; active }[], permanentLists, leave, holidays }`
     (replacing `anaesthetistIds`; the RNG seed leaves it, because generation draws nothing).
   - **The US-01.1.1 order, per Slot** (OQ-81 part 1, settled in the room):
     1. an **inactive** anaesthetist, or a date before the start date (US-01.1.3), gets no Slot;
     2. every other Slot is written **free** (EP-01, US-01.1.1 "each new Slot starts as free");
     3. the **anaesthetist's calendar** is painted: a leave window sets the status and note;
     4. the **recurring bookings** are painted on top: a template on a free Slot creates a List
        `{ id: projectedListId(...), slotId, kind, hospitalId?, surgeonId?, notes?, state: 'ACTIVE', conflicts: [] }`,
        and its template times become Slot overrides; a template on an unavailable or holiday Slot
        creates nothing and is returned as a `RecurringClash { permanentListId, slotId }` (today it
        vanishes with no trace; Phase 31 turns each clash into a Draft List, OQ-81 part 2).
   - **The RNG fill goes** (US-01.1.1 "Each new Slot starts as free"; the gap's "WRONG: Slots are not
     all created free"): no private, public or unavailable sessions are invented on any generated
     date, weekday or weekend. `slotHash.ts` stays for the seed's recorded window (work item 6) and
     the filler Bookings.
   - Keep today's `!isWeekend` guard on recurring bookings (a template is not projected onto a
     Saturday or Sunday). Phase 30 drops it with weekend patterns (the gap's "Recurring templates
     skipped on weekends silently"); no seeded recurring booking is on a weekend.
   - Hospital holidays flag Lists exactly as today, through one exported helper
     (`closedHospitalConflict(list, holidays)`) that the seed's `placeList` (work item 6) and work
     item 9's `assignListToSlot` reuse, so a recorded-window List on a closed hospital carries the
     same conflict the golden fixture pins.
   - Delete `defaultTimes`. The generator reads no default times at all.
   - Today `rollCanvasForward` and `addAnaesthetist` pass `masters.availability` as the leave input;
     once it leaves the masters they pass the seed constant `SEED_LEAVE` (work item 6), so the far
     edge still deep-equals a fresh generation. Leave set at runtime already lives on the Slots it
     covers (every date it can target is inside the horizon); Phase 29 owns leave and series beyond
     it.

5. **One schedule-settings record** (FT-01.1 "flexible enough to have any number of months";
   US-01.1.4 "Admins set default start and end times for AM and PM Slots"). Seed
   `appSettings.schedule = { horizonMonths: 4, defaultTimes: { AM: 07:30 to 12:30, PM: 13:00 to 17:30 } }`
   (today's generated values) through `defaultAppSettings()`, and extend the `appSettings` merge in
   `appStore.ts` so a store without `schedule` gains the seeded record. Remove the four default-time
   duplicates the gap found: `canvas.ts` `defaultTimes`, `apps/admin/util.ts` `defaultSpan`, the
   fallback in `shared/format.ts` `sessionTimeRange`, and `PhoneAdviceBooking`'s 08:00 to 12:00 /
   13:00 to 17:00. Every time label and the grid geometry read `effectiveSlotTimes`. Every horizon
   reader (`clockActions.ts`, `mastersActions.ts`, the Day view's date bounds, the stand-in's scan)
   reads `horizonFor(today, settings.horizonMonths)`; the seed uses the default.

6. **Seed assembly** (`domain/seed/index.ts`, `cast.ts`, `history.ts`, `availabilityAndHolidays.ts`):
   - `schedule.slots: Record<SlotId, Slot>` beside `schedule.lists` (Lists only).
   - Each `ANAESTHETISTS` row in `cast.ts` gets a fixed `startDateISO` before the canvas horizon and
     the `L-HIST-*` backdrop (staggered joining dates, for example 2009 to 2024, so the Master data
     column reads true to life). All stay active. No seeded anaesthetist starts inside the horizon,
     which keeps the golden fixture exact.
   - **The recorded demo window** (`seedRecordedWindow`, seed only, over 2026-07-07 to 2026-08-16,
     the fixture window): the seed is a snapshot of a practice that has been running, so inside that
     fixed window it records the office's ad hoc assignments and the anaesthetists' marked
     unavailability that today's slot RNG produced, **with the same per-slot draws**
     (`slotRng(SEED, 'fill', ...)` on exactly the Slots today's RNG branch reached: not painted by
     leave, and with no template or on a weekend; today's weekday thresholds (private, public,
     unavailable) and weekend threshold (unavailable only) unchanged): a private or
     public draw becomes a List placed with `placeList` (kept on its `projectedListId`), an
     unavailable draw sets the Slot's status and note ("Not available"). Its doc comment says this is
     seeded history, not generation: nothing outside the window, and nothing at runtime, is filled.
     This keeps the Admin Day grid, S2, every scenario List and every filler Booking exactly as
     today, so the golden window holds. If the demo grid four weeks out reads too empty once built,
     add recurring bookings in `permanentLists.ts` (a deliberate fixture change) rather than widening
     the window.
   - Rewrite the fixups over the two records. `patchSlot` splits into `setSlot(slots, a, d, s, { status?, note?, startTime?, endTime? })`,
     `placeList(lists, slots, a, d, s, { kind, hospitalId, surgeonId?, notes? })` (creates or patches
     the List with `projectedListId`) and `clearSlot(lists, slots, a, d, s, note?)` (removes any List
     and leaves a free Slot; this is today's `FREE`, and the "Free / open for cover" style notes
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
     The clashes the seed's generation returns (for example a template under Ropata's 24 to 28 Aug
     leave) are kept nowhere yet; a seed test pins their count so Phase 31 starts from a known set.
   - Audit every `SEED_LIST_IDS` and `SEED_MARKERS` entry and every scenario Booking in
     `domain/seed/bookings.ts` (they target Lists by `listIdForSlot`, renamed `projectedListId`): each
     List id must resolve to a List. At plan review every one of them resolved to a booked List and
     no seeded Booking sat on a free List; if a later phase has added a marker or Booking on a free
     session, re-point the marker to its Slot id (and teach `/demo/data` to open a Slot marker) or
     `placeList` a List there.
   - `PermanentList` seed rows (`permanentLists.ts`) take `kind`; the pre-op rows carry today's
     09:00 to 12:00 / 13:00 to 17:00 as template times.
   - Seed tests (`seed.test.ts`): exactly two Slots per active anaesthetist per day across the horizon
     from the later of their start date and the horizon start, and none before the start date;
     outside the recorded window every Slot is free, calendar-painted or holds a projected List
     (no invented sessions); every non-backdrop List's `slotId` resolves and its `anaesthetistId`,
     `dateISO` and `session` match the Slot's; no Slot holds two Lists; no empty Slot has a List-only
     field; every seeded Booking's `listId` resolves to a List; two builds deep-equal. Remove
     `counters.availability` from the seed.

7. **Store core** (`appStore.ts`, `mutate.ts`): add `schedule.slots` and `appSettings.schedule`, drop
   `masters.availability`; `resetDomainState` restores both. **Bump `PERSIST_VERSION` by one** with a
   comment line ("Phase 28: Slot and List split; the canvas is two records; schedule settings;
   anaesthetists have a start date") and extend `persistMigrate.test.ts`. In `ID_FORMATS`, remove
   `availability` and keep `list` (`LG`) for runtime-created Lists; update its comment (Lists are no
   longer "regenerated").

8. **Selectors** (`store/selectors.ts`):
   - **Delete `listForSlot`** rather than re-implementing it, so the compiler lists every caller and
     each one is revisited (its callers expected a free List where there will now be none).
   - Add `slotFor(state, anaesthetistId, dateISO, session)`, `listInSlot(state, slotId)` (through a
     `listIndexBySlot(lists)` index memoised on the `schedule.lists` record reference, so a 20,000-Slot
     grid does not scan Lists per cell), and `slotViewsForDate(state, dateISO)`,
     `slotViewsForAnaesthetist(state, anaesthetistId, fromISO, toISO)` and `slotView(state, slotId)`
     returning `{ slot, list?, displayKey, times }`. Components that need arrays select the stable
     records and derive with `useMemo`, as the file's header comment requires.
   - **`rosterForDate(state, dateISO)`** (US-01.4.2, US-01.1.3): every anaesthetist in
     `masters.anaesthetists` with a Slot on that date, seeded cast order first, then added ones by
     surname. An anaesthetist before their start date, or inactive from today on, has no Slot and so
     no row; past days keep their rows.
   - `scheduleHorizon(state)`: `horizonFor(clock today, appSettings.schedule.horizonMonths)`.
   - `entityCounts` gains `slots` and loses `availability`.

9. **Store actions** (every write through `mutate()` with before and after, timestamps from the
   clock). A new `store/slotActions.ts`, exported from `store/index.ts`, holds `placeListOnSlot`,
   `assignListToSlot`, `moveListToSlot` and `reassignList`, `setAvailability`, `setSlotTimes`,
   `setSlotDefaultTimes`, `setHorizonMonths` and `requestCover` (moved out of `lifecycle.ts`, keeping
   their public names and the `store/index.ts` exports). The other actions below are amended where
   they live today (`lifecycle.ts`, `mastersActions.ts`, `clockActions.ts`, `bookingActions.ts`,
   `integrationActions.ts`):
   - **Internal `placeListOnSlot`** (not exported from the package index): the one place a List is
     created at runtime. It allocates `LG####`, sets `slotId`, the denormalised fields, `kind`,
     hospital, surgeon and notes, `state: 'ACTIVE'` (15b's name for an assigned List; `DRAFT` is Phase
     31's, for a List with no anaesthetist), `conflicts` from `closedHospitalConflict`, and emits
     `list.create`.
   - **`assignListToSlot(api, actor, slotId, { hospitalId, surgeonId, kind, notes? })`**
     (US-01.3.3: an admin assigns a surgeon and a hospital to an available Slot, which creates its
     List; anaesthetists do not). Office only (`officeOnly`); refuses `notFound`, `slotOccupied` (the
     Slot already holds a List), `hospitalRequired`, `surgeonRequired`, `invalidKind`, and
     `slotNotAvailable` for an unavailable or holiday Slot. That last refusal matches the story's
     "available Slot" and is an **interim**: Phase 30 turns it into accept-and-flag (US-01.5.2
     "Nothing in the flow blocks the admin from continuing"). A hospital closed that day is flagged on the new List, as the
     generator does (the regraded gap's "no conflict flag on closed hospital"). A not-preferred
     pairing of the surgeon and the Slot's anaesthetist (either side, US-01.3.5 "Every office path",
     OQ-43) is never refused: when the actor is the office, the same commit adds 17's
     `list.pairingAcknowledged` meta through `notPreferredEntryIds` from `domain/pairingPreferences.ts`
     (never inline), exactly as 17 does in `editList`; a preferred pairing writes nothing. Add
     `store/slotActions.ts` to `officePrivacy.test.ts`'s allowlist of office write paths. Returns
     `{ listId }`.
   - **`reassignList(api, actor, listId, toAnaesthetistId, vacatedStatus = 'free')`**,
     re-implemented over **`moveListToSlot(api, actor, listId, toSlotId, vacatedStatus)`**
     (US-01.4.1's technical discussion: change the owner reference, consume the covering
     anaesthetist's Slot, return the vacated Slot to available). The default `'free'` is OQ-84's
     recommendation for the office reassign (provisional, logged); the office may pass
     `'unavailable'` or `'holiday'` instead (US-01.4.1 "or is marked unavailable if more
     appropriate"). The List keeps its id, Bookings, phone notes and history; `slotId` and the
     denormalised fields change; availability conflicts drop and holiday conflicts stay (as today);
     the source Slot's time override moves to the target Slot and is cleared from the vacated one.
     Refuses `officeOnly`, `listAuthorised`, `notFound`, `sameSlot`, `differentSession` (a move stays
     on the same day and session), `slotOccupied` and `targetNotOpen`. The outcome becomes
     `{ listId, vacatedSlotId }` (today's `{ movedListId, regeneratedListId }` goes). Audits one
     `list.reassign` (before and after `{ slotId, anaesthetistId }`) plus `slot.status` on the vacated
     Slot when the office picks Unavailable or Holiday. **No more absorb and regenerate**: no List is
     deleted, none is allocated, and `list.absorb` and `list.regenerate` are no longer written.
     Phase 32 reuses `moveListToSlot` for the anaesthetist's own move into a colleague's free Slot,
     and 32a extends it to a single Booking.
     **Keep what Phase 17 hung on today's `reassignList`** (read the function before rewriting it):
     its `list.pairingAcknowledged` meta for an office move onto a not-preferred pairing (the List's
     surgeon against the target anaesthetist), written in the same commit through 17's helper (warn,
     never refuse; US-01.3.5 "moving or reassigning a List"). Put it in `reassignList`, the office
     entry point, **not** in `moveListToSlot`: Phase 32's and 32a's anaesthetist moves reuse
     `moveListToSlot` and must read, check and log no preference (US-01.4.5, D44). Pass the
     acknowledgement in as an optional `extraMetas` argument, or check `actor` is the office; pick one
     and test that an anaesthetist actor's move logs none.
     **No prepayment re-check on a move** (US-06.3.5, US-06.5.4: an honour system, "the system has no
     logic that detects the move"; D20 superseded 2026-10-08): `moveListToSlot` touches no invoice, no
     prepayment and no billing case. If Phase 27's build left a re-check on `reassignList` or
     `reassignBooking`, remove it with its tests and log it. `moveListToSlot` is the seam where Phase
     41 adds the payable's payee repoint for a prepaid Booking (OQ-80's default, D38); leave a
     one-line comment saying so and build nothing for it.
   - **`setAvailability(api, actor, anaesthetistId, dateISO, session, status, note?)`** keeps its
     shape (the mobile screen calls it; its Free button now passes `'free'`) and writes `Slot.status`
     and `Slot.note` directly, audited `slot.status`. This is the one mechanism (FT-01.2): no second
     record, nothing reconciled. The same refusals as today (anaesthetist own only, integration
     forbidden), plus `noSlot` before the anaesthetist's start date or past the horizon. Outcome
     `{ result: 'updated' | 'conflictFlagged' | 'noChange' }`:
     - an empty Slot is simply updated;
     - a Slot holding a List, marked unavailable or holiday, keeps the List and its kind and flags an
       availability `ListConflict` as today ("replace, never stack"). This is the **interim** until
       Phase 32 offers return to the office (a Draft List) or assign to a colleague (US-01.5.5, the
       OQ-64 answer); label it so in the code comment;
     - marking a Slot holding a List **free** updates the Slot and writes **no** conflict. Today's
       "Marked available, but this List carries booking context" conflict is a symptom of the welded
       model and goes. An earlier availability conflict on that List stays until Phase 30 adds
       clearing;
     - the status never touches `List.kind`, and nothing about Bookings is read (US-01.2.3, FT-01.2).
   - **`setSlotTimes(api, actor, slotId, { startTime?, endTime? })`**: office only; `HH:mm`, start
     before end; an empty string clears the override; refuses when the Slot's List is AUTHORISED
     (`listAuthorised`, mirroring `editRefusal`). Audit `slot.times`. US-01.1.4 "each Slot can
     override".
   - **`setSlotDefaultTimes(api, actor, defaultTimes)`**: office only; validates both sessions; audit
     `settings.scheduleDefaults` (entity type `settings`, id `schedule`). Slots without an override
     follow at once; Slots with one keep it. US-01.1.4.
   - **`setHorizonMonths(api, actor, months)`** (FT-01.1): office only; a whole number from 1 to 24
     (the long-horizon scale question is Phase 43's; FT-01.1's note: "we don't have to worry about it
     for now"). One commit, audit `settings.horizon` with `{ fromMonths, toMonths, fromEndISO, toEndISO, slots, lists }`:
     - **extending** generates the new far-edge dates through `generateCanvasForDates` (free Slots,
       the calendar, then recurring bookings), exactly what roll-forward would have produced;
     - **shortening** drops every Slot after the new end, with the Lists in them; it refuses
       `listsBeyondHorizon` ("N Lists after <date> hold Bookings. Move them first.") when any of those
       Lists holds a Booking. Projected and office-assigned Lists with no Bookings are dropped
       (shortening then extending re-projects the recurring ones; an office-assigned empty List is
       lost, which the confirm step says);
     - `noChange` for the same value.
   - **`editList`**: `ListPatch` loses `startTime` and `endTime` (they belong to the Slot); `kind`,
     `slotId` and the anaesthetist stay out of it. Clearing a hospital or surgeon is left as today
     (Phase 31 enforces the pairing rule).
   - **`requestCover(api, actor, slotId, kind, message?, targetAnaesthetistId?)`**: the marker is
     written on the Slot, and the action refuses unless `isOpenSlot` (`notFree`). Audit
     `slot.coverRequest`. Phase 32 removes it.
   - **`addAnaesthetist`** (US-01.1.3) takes `startDateISO` (required, a valid ISO date; refuses
     `invalidStartDate`) and generates the new anaesthetist's Slots (all free, plus any projected
     Lists) through `generateCanvasForDates` for the horizon dates from the later of the start date
     and the demo clock's today. A start date beyond the horizon end generates none; roll-forward
     creates them when the horizon reaches it. Audit `canvas.generate` with
     `{ slots, lists, fromISO, toISO }`; the result copy reads "N forward sessions created from
     <date>" (or "Sessions start on <date>, when the schedule horizon reaches it").
   - **`editAnaesthetist`** accepts `startDateISO` and `active` changes (US-01.1.3's note: "Once
     created, the Slots can be edited freely"; FT-01.1 "every active anaesthetist"). Only dates from
     the clock's today are touched:
     - moving the start date earlier generates the missing Slots up to the old start; moving it later
       removes the now-early Slots, refusing `listsBeforeStart` ("Dr X has Lists before that date.
       Reassign them first.") when any of them holds a List;
     - making an anaesthetist **inactive** removes their Slots from today on, refusing `listsAhead`
       ("Dr X has N Lists from today. Reassign them first.") when any holds a List; past Slots and
       Lists stay, so history still reads. Making them **active** again generates their Slots from the
       later of today and the start date;
     - one commit: `anaesthetist.update` plus `canvas.generate` or `canvas.trim`.
   - **`rollCanvasForward`** (`clockActions.ts`) passes every anaesthetist with their start date and
     active flag and the horizon setting, appends Slots and Lists (free plus calendar plus recurring;
     no RNG), and `canvas.rollForward` records `{ slots, lists }` per day. Far-edge output still
     deep-equals a fresh generation. `addPermanentList` and `editPermanentList` take
     `kind: ListKind` (private, public or pre-op) in place of `statusKey`, plus optional
     `startTime`/`endTime`, and keep their no-retro-projection behaviour (Phase 30 repopulates the
     canvas). `addHospitalHoliday` flags Lists as today, through `closedHospitalConflict`.
   - **`addPostOpAddendum`** (interim until Phase 38b replaces the addendum Booking with an additional
     invoice): its target becomes today's open Slot for that anaesthetist; it creates the List there
     with `placeListOnSlot`, copying the original List's hospital, surgeon and kind, then the Booking,
     in one audited mutation. The refusal copy becomes "No free session today for this anaesthetist
     ...".
   - **`reassignBooking`** (the Admin Move flow): unchanged in behaviour, but its targets are now Lists
     only. Moving a Booking into an empty session means assigning a List there first; the move picker
     says so in one line ("To move into a free session, assign a List to it first.").
   - **Integrations** (`integrationActions.ts`, interim until Phase 33 replaces auto-apply): S12 and
     S13 resolve their target with `slotFor` then `listInSlot`. A message whose target Slot holds no
     List is **parked** (`noTargetList`, manual intervention, "The target session has no List yet.
     Parked for the office."), never silently retimed in place. Check the canned messages: if S1's
     S12 or S13 targets a Slot the seed leaves empty, `placeList` a List there in the seed so the S1
     beats are unchanged, and prove it in `demoScenarios.test.ts`. `ingestPdfRow` and the PDF target
     picker offer Lists only.
   - **Audit labels** (`shared/audit/actionLabels.ts`; these render in the Audit viewer, so no
     "slot"): `list.create` "List assigned", `slot.status` "Availability set", `slot.times` "Session
     times changed", `slot.coverRequest` "Cover requested", `settings.scheduleDefaults` "Default
     session times changed", `settings.horizon` "Schedule horizon changed", `canvas.trim` "Sessions
     removed"; `fieldLabels.ts` gains `kind`, `status` ("Availability"), `slotId` ("Session"),
     `startTime`, `endTime`, `startDateISO` ("Start date"), `horizonMonths` ("Horizon (months)"). Keep
     the old `list.absorb`, `list.regenerate`, `list.restatus` and `availability.*` labels so any older
     persisted history still reads. `auditNarrative.test.ts` must pass.

10. **Store tests** (`store/slotActions.test.ts`, updated `lifecycle.test.ts`, `canvasRoll.test.ts`,
    `mastersActions.test.ts`, `postOpAddendum.test.ts`, `integrationActions.test.ts`):
    - **Generation (US-01.1.1, FT-01.1):** a generated date has exactly two Slots per active
      anaesthetist, none for an inactive one; every Slot is free unless the calendar or a recurring
      booking painted it; a recurring booking under a leave window produces no List and one clash;
      the calendar wins over the template in every case (OQ-81 part 1).
    - `assignListToSlot`: every refusal; success creates exactly one `LG` List in that Slot, flips its
      display key from `free` to the kind, writes one `list.create`, and carries a holiday conflict
      when the hospital is closed that day.
    - **Status independence (US-01.2.3):** for a sample of seeded Slots, create, complete, cancel and
      move Bookings, and assert `displayStatusKey` never changes; set a Slot to holiday with and
      without a List and assert it reads holiday when empty and keeps the List's kind (plus a conflict)
      when not.
    - **One mechanism (FT-01.2):** after `setAvailability`, the only changed record is the Slot
      (plus a conflict on its List where one applies); no availability master exists to read.
    - **One status in three apps and the finders (US-01.4.2):** the phone-advice path (assign, then a
      Booking) gives the same display key through `slotView`, `slotViewsForDate` (Admin) and
      `slotViewsForAnaesthetist` (mobile and web), and `isOpenSlot` is false for it, so no finder
      offers it. There is no second derivation anywhere (the `displayStatusKeyForList` and
      `effectivelyBooked` helpers are deleted; the reviewers check for stragglers).
    - **Roster:** `rosterForDate` includes an anaesthetist added in the store from their start date,
      excludes them before it, and drops an inactive one from today while keeping past days.
    - Reassign: the List id, Bookings and history are unchanged; the target Slot holds it; the vacated
      Slot is free by default and unavailable or holiday on request; no List is deleted or
      allocated; time overrides travel; each refusal. An office move onto a not-preferred pairing
      succeeds with exactly one `list.pairingAcknowledged` (17's existing `reassignList` tests still
      pass unchanged in intent); `moveListToSlot` called with an anaesthetist actor writes none. A
      move of a List holding a prepaid Booking changes no invoice, billing case or prepayment record
      (deep-equal before and after, US-06.3.5).
    - `assignListToSlot` onto a not-preferred pairing as the office: succeeds with one
      acknowledgement; a preferred pairing writes none; an ended entry writes none.
    - `setAvailability`: marking a booked Slot free writes no conflict (the gap's "bogus
      conflict"); repeated toggles leave at most one availability conflict.
    - `setSlotTimes` and `setSlotDefaultTimes`, including "an override survives a default change".
    - **Horizon (FT-01.1):** 4 to 3 months drops exactly the far-edge dates and their empty Lists;
      3 back to 4 deep-equals the original far edge; shortening over a List with a Booking refuses
      `listsBeyondHorizon` and changes nothing; roll-forward after a change extends by the new
      setting.
    - **Start date (US-01.1.3):** `addAnaesthetist` with a start date of today, a future date inside
      the horizon, and a date beyond it (Slots only from the start date, all free; none, then created
      by roll-forward); `editAnaesthetist` moving the date earlier (Slots filled in) and later (empty
      Slots removed; `listsBeforeStart` when one holds a List; nothing before today touched); active
      off and on (`listsAhead`; Slots back from today).
    - Roll-forward and `addAnaesthetist`: two Slots per day for every active anaesthetist on or after
      their start date, deep-equal to a fresh generation, and no invented sessions.

11. **Registry and context** (Phase 14's `src/shared/demoTriggers/`):
    - Re-point every entry that resolved a List through `listForSlot` or `listIdForSlot`
      (`stage-post-op`'s `when` compares the URL's List id with `projectedListId(ANAE.sharma,
      '2026-07-14', 'AM')`; `ingest-pdf-row` resolves `SURGEON_PDFS[0].targetList` with
      `slotFor` + `listInSlot` in place of `listIdForSlot`, and is disabled with "The PDF's target
      session has no List" when the Slot is empty; `billing-failure` uses `SEED_LIST_IDS` and is
      unchanged). Grep the registry for `listIdForSlot`, `listForSlot` and `statusKey` so none is
      missed. Bodies stay in `src/shared` or `src/store`.
    - Add the context key `'adminDay.selectedSlotId'` to `DemoContextValues`, published by the Admin
      Day drawer (work item 13). Nothing consumes it yet; Phase 30's "Simulate sickness" acts on it.

12. **Re-point every reader to Slot views** (no new UI yet; the app must look as it does today apart
    from the fixed behaviours). Each reads `displayKey`, `slot.note`, `slot.coverRequest` and
    `effectiveSlotTimes` where it read `statusKey`, `list.notes` on a free row, `list.coverRequest` and
    `list.startTime`:
    - **Admin:** `AdminApp` builds its roster from `rosterForDate` (not the static cast array) and
      `slotViewsByAnaesthetist` for the selected date, and passes them to `DayGrid` (blocks keyed and
      clicked by Slot id: `onSelectSlot`); `segmentsFor` merges a both-sessions leave or unavailable
      pair from Slot views; `util.ts` loses `defaultSpan` and `displayStatusKeyForList`, and
      `listSpan` becomes `slotSpan(view)`, which keeps the default session shape even for a one-Booking
      List (US-01.1.4's note); the header summary counts Lists as sessions and open Slots as free;
      `attentionReasons` reads `list.kind`; `ReviewScreen`, `AdminBookingDetail` and `MoveBookingFlow`
      read `list.kind` and the approval label (below); the PDF target picker offers Lists only.
      `DayNav`'s date input gets `max` = the horizon end, and a day past it (reached by +4w or a URL)
      shows the Day view's empty state "Beyond the schedule horizon, which ends <date>." in place of
      an empty grid.
    - **Mobile:** `ForwardListsScreen` builds rows from `slotViewsForAnaesthetist` (free rows from open
      Slots with "Offer cover" or "Requested", leave rows from holiday Slots, unavailable collapses,
      booked rows from Lists); `AvailabilityScreen` iterates the roster from Slot views, and its strip
      dots, "N free sessions", Free only and the cover chips use `isOpenSlot` (US-01.4.2); "My
      availability" reads the persona's Slots and its Free and Block buttons write the Slot status;
      `ListDetailScreen` and `BookingDetailScreen` chips read `list.kind` and times from the Slot.
    - **Web:** `ListsScreen`, `WeekStrip`, `AvailabilityGrid` (its `hasFree` and Free only through
      `isOpenSlot`, its rows from Slot views) and `DashboardScreen` (day summary, offer cover, "Who's
      free") use Slot views; `ListDetailView` and `BookingDetailView` as mobile.
    - **Shared:** `shared/format.ts` gains `slotTimeRange(view)` (replacing `sessionTimeRange(list)`).
      **The List state is printed as 15b left it** (`ACTIVE`, `SUBMITTED`, `AUTHORISED`, the
      catalogue's names, EP-07): no "Open" label and no second state vocabulary. Empty Slots no
      longer carry a state at all, so 15b's `isFreeEmpty` guard that hid the state on a free session
      goes (the empty-session drawer has no List to print a state for), and "Draft List" and `DRAFT`
      stay reserved for Phase 31.
    - `RequestCoverSheet` takes a `slotId`.
    - **Permanent Lists** (recurring bookings; the rename is Phase 30's): `PermanentListSheet`'s select
      offers the three kinds (Private, Public, Pre-op) and gains optional start and end ("Leave blank
      for the default session times"); the Master data table prints the kind's label, not the raw key.
    - **Add anaesthetist, compile-forced:** `AddAnaesthetistFlow` passes the demo clock's today as
      `startDateISO` until item 18 adds the field.
    - **Compile-forced minimums** (finished in session 2, but working at the end of session 1 so the
      app stays demoable): clicking an empty session on the grid opens the drawer in a plain
      empty-session form with today's Book (phone advice) action (item 13 completes it);
      `PhoneAdviceBooking` calls `assignListToSlot` and then opens `AddBookingFlow` on the new List
      (item 15 adds the required surgeon, the prefill from settings and the copy); `EditListSheet`
      saves changed times through `setSlotTimes` (item 16 adds the hints); `ReassignListFlow`'s
      candidates come from `slotFor` + `isOpenSlot` and it passes the vacated value through (item 17
      changes the default and copy). Any Vitest or Playwright spec these break is fixed in session 1,
      not left for item 22.
    - **Demo inspector** (`DemoData.tsx`): the banner becomes "Canvas invariant holds: an AM and a PM
      session per active anaesthetist per day from their start date, every List in one session";
      counts show Slots and Lists (the inspector may name the code collections).
    - Re-green all four commands. Compare screenshots with the baseline: expected differences are the
      drawer header's approval label and nothing else inside the recorded window. **Session 1 ends
      here, green and demoable.**

### Session 2: the office flows, the settings editor, the stand-in and the docs

13. **The Admin Day drawer opens a session** (`components/ListDrawer.tsx` becomes `SlotDrawer.tsx`;
    keep `data-testid="admin-list-drawer"` on it for the capture recipes and add `data-slot-id`). It
    publishes `'adminDay.selectedSlotId'`.
    - **A session holding a List:** today's drawer (header name, date, session, the List state as 15b
      prints it,
      `StatusChip` of the kind; Needs attention; Session with times, hospital, surgeon, note;
      Bookings; actions Edit list, Reassign list, History). The List shows in place of the status;
      where the Slot's own status is not free (the anaesthetist marked it unavailable), the Needs
      attention section says so beside the existing conflict flag. Reassign is offered for every List,
      not only "booked" status keys.
    - **An empty session:** header with the anaesthetist, date, session and the status chip (Free,
      Unavailable or Holiday); a "Session" section with the status, times (with "Default" or
      "Own times") and note; actions **Assign List** (teal primary, free sessions only),
      **Book (phone advice)** (free sessions only), **Edit times** and **History** (the Slot's audit,
      `entityIds={[slotId]}`). An unavailable or holiday session shows a one-line note that it is not
      open for assignment in this build (Phase 30 relaxes it).

14. **Assign List sheet** (`apps/admin/flows/AssignListSheet.tsx`, `useSurface().Overlay`), US-01.3.3:
    hospital (required), surgeon (required: Phase 17's `SurgeonPicker` for the session's anaesthetist,
    with the not-preferred surgeons in their own labelled optgroup and preferred ones marked; choosing
    a not-preferred surgeon shows `NotPreferredWarning` above the save button, which reads "Assign
    anyway" while it shows), kind as a segmented control
    (Private, Public; default Private; pre-op Lists come only from recurring bookings until the pairing
    decision in Phase 31), and an optional note. Errors inline ("Choose the hospital." / "Choose the
    surgeon."). A closed hospital shows the amber flag on the new List, not a block. Saving calls
    `assignListToSlot`; the drawer switches to the new List. Copy states the rule plainly: "Assigning
    a surgeon and hospital turns this free session into a List." The sheet takes an optional
    `initialSurgeonId`, so the office finder (item 20) can open it with the surgeon already chosen.

15. **Book (phone advice)** (`flows/PhoneAdviceBooking.tsx`), rebuilt on the same assignment step:
    - Step 1 is the Assign List fields plus start and end times, prefilled from `effectiveSlotTimes`
      (so 13:00 to 17:30 for a PM session, from the settings record). The surgeon is required, through
      17's `SurgeonPicker`; its "Not assigned yet" empty option goes (pass no `emptyLabel`, or a
      placeholder that cannot be saved). 17's warning stays, and "Continue to add booking" reads
      "Continue anyway" while it shows.
    - "Continue to add booking" calls `assignListToSlot`, then `setSlotTimes` only if the times were
      changed, then opens the shared `AddBookingFlow` on the new List id. Abandoning step 2 leaves an
      assigned List with no Bookings, which the catalogue allows; the docblock says so and the old
      "write context only after the Booking" workaround goes. 17's acknowledgement therefore lands at
      assignment (in `assignListToSlot`), not in `onBookingCreated`; move it, so it is written once.
    - `isScriptedS2Booking` keys on the Slot (Sharma, 2026-07-21, PM) plus St George's and Mr T. Hale,
      and the lookup prefill works unchanged.
    - The docblock's "anaesthetist views still show Free (P5)" note is deleted: the session now reads
      as a Private List everywhere.

16. **Times editing.** `EditListSheet` keeps hospital, surgeon and notes (through `editList`) and
    shows the session's times with a "Default" hint and a "Use default" link; changed times save
    through `setSlotTimes`, only when they changed. The empty-session drawer's **Edit times** opens a
    small `EditSlotTimesSheet` with the same fields.

17. **Reassign** (`flows/ReassignListFlow.tsx`), US-01.4.1:
    - candidates are other active anaesthetists whose session on the same day is open
      (`isOpenSlot`, replacing 17's free-List `freeTargets` filter), still fed to 17's
      `AnaesthetistCandidates` for `list.surgeonId` (clear group first, the not-preferred group apart,
      tier order shuffled within a tier from `suggestionSeq`, the tier filter, Preferred pills), and
      17's "Confirm reassignment anyway" and warning are kept;
    - the confirm step's vacated picker reads **Free (default)**, Unavailable, Holiday, with the
      line "Dr X's session returns to Free unless you mark it otherwise.";
    - the "free-target, absorb and regenerate ... proposed reading" copy is removed; the confirm text
      says the List moves with its Bookings and history to the colleague;
    - no update email here: Phase 35 builds the on-demand update email on any Booking, picked from
      the change history (D19, OQ-69);
    - update `ReassignListFlow.test.tsx` (the default, the open-session candidates still grouped and
      tier-ordered, the move).

18. **Master data: Schedule settings, the anaesthetist start date and active flag.**
    - **Schedule settings** (a new entry in the sub-nav, placed beside "List statuses"; hook
      `admin-schedule-settings`): two blocks in the master-data table pattern.
      - **Horizon** (FT-01.1): "Schedule horizon: 4 months, to Sat 21 Nov 2026" with Edit opening a
        sheet (`admin-horizon-months`) holding a whole-number months field (1 to 24) and a live
        preview line from the pure helper ("Adds 30 days, to Mon 21 Dec 2026." or "Removes 31 days
        after Wed 21 Oct 2026, with N Lists that hold no Bookings."); shortening needs a second,
        explicit Confirm; the `listsBeyondHorizon` refusal shows inline. Hint: "Four months is
        current practice."
      - **Session times** (US-01.1.4): a small two-row table (AM, PM) with start and end, Edit opening
        a sheet that calls `setSlotDefaultTimes`, and the line "Sessions with their own times keep
        them."
    - **List statuses:** unchanged in this phase apart from reading labels through
      `displayStatusLabel`; Phase 29 turns the view into the user-maintained status editor. No
      provisional line (OQ-64 is answered).
    - **Start date** (US-01.1.3): `AddAnaesthetistFlow` gains a required "Start date" field
      (`TextField type="date"`, default the demo clock's today) with the hint "Sessions are created
      from this date to the end of the schedule horizon."; `EditAnaesthetistSheet` gains the same
      field, saving through `editAnaesthetist` and showing its `listsBeforeStart` refusal inline. Its
      existing Active toggle now shows `listsAhead` inline and, when switched off, the line "Their
      sessions from today are removed." The Anaesthetists table gains a "Start date" column, and its
      sub-line becomes "Adding one creates their sessions from their start date."

19. **Anaesthetist apps and finders, the fixed behaviour** (US-01.2.3, US-01.3.3 and US-01.4.2's gap
    bullets). Check, and fix any straggler, that after an office assignment or a phone-advice
    booking:
    - mobile Forward Lists shows the session as a booked List row (hospital, surgeon, time, Booking
      count), not "Free session / Offer cover";
    - the mobile availability strip, "Free only" and the cover chips no longer offer that session,
      and `requestCover` refuses it;
    - the web week strip block is booked and clickable, the web Lists row opens the List, the web
      Availability grid's Free only drops it, and the dashboard day summary and "Who's free" count it
      as booked;
    - an anaesthetist added in Admin appears on the Admin Day grid, the web Availability grid and the
      mobile Availability list from their start date, all free;
    - `StatusChip`, `ListRow` and `StatusLegend` still take a `StatusKey` from the theme, fed by
      `displayKey` or `list.kind`.

20. **The office availability finder** (US-01.4.2 for the office; US-01.3.5 and US-01.3.6 on 17's
    helper). A "Find available" action in the Admin Day header (`DayNav`, beside the sort toggle;
    hook `admin-availability-finder-open`) opens a sheet (`apps/admin/flows/AvailabilityFinderSheet.tsx`,
    `useSurface().Overlay`, hook `admin-availability-finder`) for the selected day:
    - a session control (AM, PM; default the session of the selected empty session, else AM) and an
      optional surgeon (17's surgeon list; "Any surgeon" by default) for the List the office wants
      to fill;
    - the candidates are every active anaesthetist whose session that day is open (`isOpenSlot`, from
      `slotViewsForDate`), rendered by 17's `AnaesthetistCandidates` from `rankAnaesthetistCandidates`:
      with a surgeon chosen, the clear group first and the "Not preferred with Ms Reid" group apart
      and still clickable; with none, one group. Each group is ordered by priority tier, Tier 1
      first, shuffled within a tier from a request key of `dateISO + ':' + session + ':' +
      suggestionSeq` (bumped once per opening, so reopening reshuffles and Reset replays), with 17's
      tier filter and Preferred pills. The tier names come from 17's `TIER_LABELS`;
    - a count line ("7 anaesthetists free this PM") and an empty state ("No one is free this PM.");
    - picking a row closes the sheet, selects that anaesthetist's session on the grid and opens the
      empty-session drawer with the Assign List sheet ready, carrying the chosen surgeon as
      `initialSurgeonId` (the not-preferred warning then shows there as usual);
    - the Day grid itself (the legend filter to Free, the roster) keeps roster or A to Z order: it is
      the day canvas, not a candidate list. No ordering or grouping logic in the sheet: everything
      goes through 17's helper (one rule, one place);
    - Admin only: the sheet lives in `apps/admin`, and the anaesthetists' own finders (mobile
      Availability, web Availability grid, the dashboard's "Who's free") stay name-ordered, read no
      tier and no preference, and are untouched by this item; 17's `officePrivacy.test.ts` must stay
      green;
    - Vitest (`AvailabilityFinderSheet.test.tsx`): only open sessions are listed (an assigned or
      unavailable session is not); tier order in each group; the not-preferred group appears only
      with a surgeon; the same key replays the same order and a reopen bumps it; the tier filter;
      picking a row opens Assign List with the surgeon prefilled.

21. **PWA office stand-in: "Office assigns a List to my next free session"** (see Demo triggers).
    Store body `assignNextFreeSlotAsSimulatedOffice(api, anaesthetistId, pairingId?)` in
    `store/officeStandIn.ts` (beside Phase 14's `authoriseAsSimulatedOffice`), acting as
    `OFFICE_SIMULATION_ACTOR` (`store/demoActors.ts`) through `assignListToSlot`. "From today" means
    the demo clock's today (`src/domain/clock.ts`), never `new Date()`; the scan walks Slots in
    date then session order up to the horizon end, so the pick is deterministic. Registry entry in
    `shared/demoTriggers/registry.ts`. Vitest: it picks the earliest open Slot from today; refuses
    with "No free session before the schedule horizon ends" when none; a second run takes the next
    open Slot. The store body never reads the `officePrivate` slice or 17's helper (it is in the PWA
    closure, and 17's privacy test forbids it): its three fixed choices are checked instead by a seed
    test outside the PWA closure that asserts none of them is a not-preferred pairing with Dr Souter,
    so the stand-in never needs to skip one. `assignListToSlot` still runs its own office check.

22. **Playwright and shot hooks.** `data-shot` hooks `admin-slot-drawer`, `admin-assign-list`,
    `admin-schedule-settings`, `admin-horizon-months`, `admin-add-anaesthetist-start`,
    `admin-day-beyond-horizon`, `admin-availability-finder-open`, `admin-availability-finder`,
    `mobile-lists-assigned`. Add a Playwright step that opens the office finder, with Ms Reid chosen, on
    a day and session where Dr Sharma's session is open (17 seeds Reid not preferred with Sharma; pick
    the session from the seed and name it in the spec), and asserts Sharma sits in the not-preferred
    group apart from the clear group, each in tier order. Update the admin specs that open a Free
    List, book by phone, reassign and add an anaesthetist (`visual/admin-phase06.spec.ts` and any spec
    relying on `admin-list-drawer`); extend `visual/pwa-device.spec.ts` to open the Demo chip on
    Lists, run the stand-in and assert a new booked row appears. Keep `pwaPurity.test.ts` green (the
    stand-in body lives in `src/store`, the entry in `src/shared`). Add one Vitest or Playwright check
    that greps the rendered admin, mobile and web screens touched here for `\bslots?\b`
    (case-insensitive) and finds none.

23. **Capture recipes** (`requirements-board/capture/recipes/`): done in the "Catalogue screenshots"
    step below, after the review pass. Find the recipes this phase breaks by grepping them for the
    free-session List ids (for example `L-41267-2026-07-21-PM`, `L-47733-2026-07-21-PM`,
    `L-34821-2026-07-22-PM`), "open for cover", "Offer cover", "Book (phone advice)", "Reassign",
    "Free only", "Add anaesthetist", "Slot" in captions and raw "DRAFT" text; at plan update that set
    is mainly the US-01.x recipes (US-01.1.1, US-01.1.3, US-01.1.4, US-01.2.1, US-01.2.3, US-01.3.1,
    US-01.3.3, US-01.4.1, US-01.4.2, US-01.4.3, US-01.5.2, US-01.5.3) plus US-02.3.1. Recipes that only
    use booked `L-...` ids or `admin-list-drawer` keep working (both are kept). Update the ATLAS id
    table (Slots `S-...`, projected Lists keep `L-...`, runtime Lists `LG####`). In session 1 only the
    hooks move with the code (`data-testid` kept), so the recipes need nothing until session 2.

24. **Docs inside the app and close-out.** `aa-prototype/README.md` folder map: `domain/slots.ts`,
    `store/slotActions.ts`, and one paragraph on the Slot and List model (Slot id and status, the
    generation order, the start date and active flag, the horizon setting, projected List id, runtime
    `LG` ids, the derived display key, the settings record, the seed's recorded window, and "Slot is a
    code word; the UI says session"). Then finish green, run the adversarial review, patch the demo
    guide and write the PROGRESS entry.

## Demo triggers

Everything in this phase is demonstrable through normal use in the framed build: the office assigns
a List, books by phone, finds available anaesthetists in tier order, edits times, defaults and the
horizon, adds an anaesthetist with a start date, and reassigns in Admin, and the result shows in the
mobile and web apps. So the harness bar gains
**no** new entry. The PWA has no Admin app, so the mobile side of "the office assigned me a List"
needs a stand-in:

| Label | Screen | Surface | Effect |
|---|---|---|---|
| Office assigns a List to my next free session | Mobile · Lists (`/mobile/lists`) | PWA only, badged "office stand-in" | Finds Dr Souter's earliest open Slot from today and assigns a List there as the simulated office. `choices`: St George's · Mr T. Hale (default), Southern Cross · Ms K. Patel, Forte Health · Mr C. Okafor (a seed test pins that none is a not-preferred pairing with Dr Souter; the body reads no preference). The message names the session ("Assigned St George's · Mr T. Hale to your Wed 22 Jul PM session", hospital names as the hospital master reads them) and the row appears as a Private List. Disabled with "No free session before the schedule horizon ends" |
| (product, no button) Find available | Admin · Day (`/admin/day/:date`) | Framed build | "Find available" in the Day header lists the anaesthetists free in the chosen session by priority tier, shuffled within a tier, with a tier filter and, once a surgeon is chosen, the not-preferred pairings in their own group (US-01.3.5, US-01.3.6, US-01.4.2). Product UI, no harness entry |
| (product, no button) Schedule horizon | Admin · Master data · Schedule settings | Framed build | Changing the horizon months visibly fills or drops far-edge days: the Day view's date picker bound moves, and a dropped day shows "Beyond the schedule horizon". This is the FT-01.1 demo; no harness entry is needed |

Re-pointed, not added: `stage-post-op` (its `when` uses `projectedListId`) and `ingest-pdf-row`
(`slotFor` + `listInSlot`). The new context key `'adminDay.selectedSlotId'` is published for
Phase 30.

## Out of scope

- **Draft Lists** (FT-01.6, DM-03): a recurring booking that lands on an unavailable Slot becoming a
  Draft List (OQ-81 part 2; this phase only traces the clash), the Day dashboard and the **pairing
  rule** enforcement (US-01.3.1, FT-01.3): Phase 31. The Fitzgerald "Surgeon TBC" List and the
  hospital-less pre-op and surgeon-less acute Lists stay as seeded.
- **Return or assign** when an anaesthetist marks a booked session unavailable (US-01.5.5, the OQ-64
  answer), and the anaesthetist moving their own List (US-01.4.3, US-01.4.6, DM-05, RV-15), which
  removes the cover-request marker: Phase 32. Moving a single Booking to a colleague: Phase 32a.
- **The availability calendar** (days off ahead, a series, editing or deleting one instance), web
  availability controls, a holiday control on mobile and **the user-maintained status master**
  (US-01.2.1, US-01.2.2, US-01.5.3): Phase 29, on the Slot status this phase stores.
- **Conflicts on every path**, the List colour change, clearing a conflict, holiday edit and delete,
  the conflict dashboard, **assigning onto an unavailable session** (the interim refusal here), and
  **recurring-booking edits repopulating the canvas**, weekend recurring bookings (the `!isWeekend`
  guard stays here) and the rename from Permanent Lists (US-01.5.2, US-01.5.4, US-01.3.2): Phase 30.
- The update email (US-02.3.3, US-02.3.4): Phase 35's on-demand button.
- Any prepayment or invoice work on a move: none (US-06.3.5, US-06.5.4); the payable's payee repoint
  on a move of a prepaid Booking is Phase 41's (OQ-80, D38).
- New preference or tier behaviour: the data, labels, helper, profile screens and privacy boundary are
  Phase 17's; Draft List assignment on the same helper is Phase 31's; anaesthetist moves (with no
  warning, US-01.4.5) are 32 and 32a.
- Hospital download rows creating Lists and the no-silent-apply matching screen: Phase 33 (the
  integration parking rule here is an interim).
- The post-op addendum's replacement by an admin additional invoice: Phase 38b.
- Un-assigning a List back to an empty session: not planned; raise with the owner if a beat needs it.
- The 85-anaesthetist scale demo and long horizons at scale (Phase 43). `canvasRoll.test.ts`'s scale
  test must stay inside its time budget with Slots.

## Manual test checklist

The agent runs every item itself in the running app and reports it with evidence; none is handed
to the owner (ROADMAP.md "Owner review: agents test themselves").

- [ ] Reset. Admin Day, Tue 21 Jul looks as before: same blocks, colours, labels, times and flags; the
      header summary reads the same counts.
- [ ] Open a Free block: the drawer shows the session (Free chip, default or own times, note) with
      Assign List, Book (phone advice), Edit times and History, and no List state, no "Open" and no
      "slot" anywhere.
- [ ] Assign List on Strand Tue 21 PM (St George's, Mr T. Hale, Private): the block turns Private; the
      drawer shows the List with `ACTIVE` and no Bookings; the Audit viewer shows "List assigned".
      Saving with no surgeon shows "Choose the surgeon." The surgeon picker shows any not-preferred
      surgeon for Strand in its own group; choosing one shows the warning and "Assign anyway", and
      going ahead assigns it with one acknowledgement in the List's History (Admin only).
- [ ] Find available (Admin Day header) on Wed 22 Jul, PM: only anaesthetists with an open PM session
      are listed, Tier 1 first; closing and reopening reshuffles within a tier but never across one;
      the tier filter narrows the list; choosing Ms Reid as surgeon moves Dr Sharma (if free then) into
      a separate "Not preferred" group that is still clickable. Picking a row opens that session's
      drawer with Assign List and the surgeon prefilled. Mobile and web Availability for the same day
      list the same free people by name, with no tier, pill or preference anywhere.
- [ ] Book (phone advice) on Sharma Tue 21 PM with St George's and Mr T. Hale: times prefill 13:00 to
      17:30; the lookup prefill works; after saving, the block is Private with one Booking. In the web
      app the Availability grid for Tue 21 shows Sharma PM booked, not Free, and Free only drops it;
      the session is gone from "Free only" in mobile Availability.
- [ ] Mobile (Dr Souter) and web Lists and week strip: after assigning Souter Wed 22 PM in Admin, both
      show it as a booked List row that opens; neither offers cover on it.
- [ ] Status independence: add, complete and cancel a Booking on a List; its colour and label never
      change. Mobile Availability: Block, then Free, on a session holding a List: the List keeps its
      colour, Block raises the amber flag, Free adds no new flag. Block on an empty session: Admin Day
      shows it Unavailable (hatched) at once, with no second record in `/demo/data`.
- [ ] Free by default: Admin Day on a date past the recorded window (for example Mon 7 Sep) shows
      only recurring-booking Lists, the seed calendar's leave and Free sessions; no invented ad hoc
      Lists or unavailability.
- [ ] Schedule settings, Session times: change PM to 13:30 to 17:30. Every PM block without its own
      times moves on the grid, mobile and web; Rutherford Tue 21 PM (13:30 to 17:00, own times) does
      not. Change it back.
- [ ] Schedule settings, Horizon: change 4 months to 3. The preview names the days removed; Confirm.
      The Day view's date picker stops at 21 Oct; Sat 7 Nov (by URL) shows "Beyond the schedule
      horizon". Change back to 4: the days return with the same recurring Lists; the Audit viewer
      shows "Schedule horizon changed" twice.
- [ ] Edit list on a List with its own times: "Use default" restores the default; the audit shows
      "Session times changed".
- [ ] Reassign Rutherford Wed 22 AM to Sharma: the candidates are only open sessions, in 17's tier
      order with Sharma's Preferred pill; the picker defaults the vacated session to Free;
      choose Unavailable and confirm. The List keeps its id (the URL on Review or the drawer History
      shows the same List), its Bookings and its history, now under Sharma; Rutherford's AM session is
      Unavailable (hatched); nothing reads "regenerated".
- [ ] Reassign a List that holds a prepaid Booking (Phase 27's seed): the Booking's prepayment invoice,
      amount and status are exactly as before, and nothing says the prepayment was re-checked
      (US-06.3.5's honour system).
- [ ] Next day (clock) and "Next morning" twice: the far edge gains an AM and a PM session per active
      anaesthetist per day, free unless a recurring booking or the calendar painted it; `/demo/data`
      shows the invariant holding.
- [ ] Add an anaesthetist in Master data with start date Mon 3 Aug 2026: "N forward sessions created
      from 3 Aug"; Admin Day on Fri 31 Jul has no row for them, Mon 3 Aug shows a row of Free
      sessions, and they appear in the web Availability grid and mobile Availability for that day.
      Edit their start date to Wed 29 Jul: their row appears on 29 Jul. Assign a List on 3 Aug, then
      try a start date of 4 Aug: refused with "Reassign them first". Switch them inactive: refused
      with "Reassign them first" while the List stands; reassign it, switch inactive, and their row is
      gone from today on. The Anaesthetists table shows the start date column.
- [ ] Master data, Permanent Lists: the sheet offers Private, Public and Pre-op only, with optional times;
      the table shows the kind's label. Master data, List statuses reads as before, with no
      provisional line.
- [ ] Move a Booking in Admin: the picker lists Lists only and carries the "assign a List to it first"
      line; an empty session is not a target.
- [ ] S1 on the framed build (Fire hospital message and its modify and move messages) behaves exactly as
      before; S4 Beat 2 (stage post-op, Add post-op event) still creates the addendum Booking.
- [ ] PWA (`npm run dev:pwa`, fresh storage): on Lists the Demo chip offers "Office assigns a List to my
      next free session"; running it adds a booked row on the named session; running it again takes
      the next one. The chip is absent on More.
- [ ] No "slot" in any app copy touched here (grep the rendered strings and the audit and field
      labels); no en or em dashes in any new copy; teal is the only action colour; crimson unused on
      the new sheets.
- [ ] Catalogue screenshots: the recipes for the covered items above are created or updated, any recipe this phase broke is re-pointed, a full `npm run capture` ends with no failed recipe and no story without a recipe, the covered items' new shots are checked by eye, and `npm run verify:board` is green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots` and `npm run verify:board` all green.

## Demo guide updates

This phase breaks S2 Beats 1 to 3 and touches S4 Beat 2. Patch, in the same session. The Say lines
use "session", not "slot", as the app does (OQ-64):

- **`docs/demo-guide/03-demo-script.md`:**
  - S2 Beat 1, Say: "Every active anaesthetist has an AM and a PM session every day, four months
    ahead, from their start date, whether or not anything is booked. A session is free until the
    anaesthetist marks it otherwise, and when the office puts a List in it, the List shows instead."
  - S2 Beat 2: the click path becomes "Open Dr Priya Sharma's Tue 21 PM **Free session** → Book
    (phone advice) → St George's Hospital, Mr T. Hale; keep the default times (13:00 to 17:30) →
    Continue to add booking → ...". Expected: "The session now holds a Private List with the new
    Booking, and the anaesthetist's web and mobile views and the availability finders show it as
    booked." Delete the "still label the session Free, an open polish item" caveat. Add an optional
    one-liner: "Assign List does the same without a patient, for a session booked ahead."
  - S2 Beat 3: keep "Reassign list → Dr Priya Sharma" and Phase 17's lines (the candidates in tier
    order, Sharma's Preferred pill, no warning), then "the vacated session defaults to Free; choose
    **Unavailable** because Dr Rutherford is ill → Confirm reassignment". Say: "The List moves with its
    Bookings and history to Dr Sharma; nothing is re-keyed, and nothing about billing is recalculated."
    Expected: "Dr Rutherford's session shows Unavailable; History records one reassignment." Remove
    the "free-target, absorb and regenerate is the prototype's proposal" line.
  - S2, optional beat after Beat 3 (Admin Day, **Find available**, PM; then choose Ms Reid as the
    surgeon): Say: "When the office has a List to fill, it sees who is free that session, best-placed
    tier first and shuffled within a tier so the same person is not always on top, and any pairing a
    surgeon or anaesthetist has asked to avoid sits apart. Only the office sees this; the anaesthetists'
    own finders are plain." Name tiers and pairings with 17's labels; never "blacklist".
  - S2, optional beat (Master data, Schedule settings): "The horizon is a setting, four months as
    today; default session times are one setting too."
  - Any line that shows the drawer's state as "Draft" or "Open" for an assigned List reads `ACTIVE`
    (15b's wording, kept); an empty session shows no state.
  - S4 Beat 2: add to Expected: "the addendum sits on a List created in today's free session"
    (interim until 38b).
  - Discovery points or direct URLs that call an empty session a "List"; drop "the exact
    List-reassignment mechanics" and the logical-model question from S2's discovery points (US-01.4.1
    and OQ-64 settle them); keep "what the vacated session shows after a move" (OQ-84) as a
    discovery point.
- **`docs/demo-guide/02-workflows-and-handoffs.md`:** Workflow 3 steps 5 to 9 (target a free session;
  the List moves into it; the vacated session returns to free or is marked unavailable; no absorb or
  regenerate); the "Prototype readiness" note stops calling the mechanism a prototype proposal and cites
  US-01.4.1; line 78's "displayed consistently in all apps" is now true, including after a phone booking.
- **`docs/demo-guide/04-presenter-cheat-sheet.md`:** item 5 "List reassignment mechanics" rewritten to the
  move between sessions; add a short "Sessions and Lists" line (a status on the session, free by
  default, the List shown in its place, sessions from the start date, a configurable four-month
  horizon) and the default-times setting; a "Find available" line (office only: tier order, shuffled
  within a tier, not-preferred apart); a reminder that the app never says "slot".
- **`docs/demo-guide/master-demo-guide.html`:** the same S2 Beats 1 to 3, the optional finder beat and
  S4 Beat 2 rows, the workflow 3 summary and the cheat-sheet items (the sections near "phone advice",
  "Reassign list" and "vacated slot").
- **Control Panel** `SCENARIOS` S2 text (`apps/demo/DemoControlPanel.tsx`): "Free session", "Assign
  List", "Find available", and the vacated-session default (Free).

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19),
run after the review pass and before the PROGRESS.md entry. Re-run
`node docs/prototype-build/catch-up/tools/recipe-status.mjs 28` first: earlier phases may have
changed these recipes since this plan was written. This replaces work item 23's capture note: the
re-pointing described there is part of this step, and the captures are re-run. No recipe caption
says "slot"; say session.

**Covered items.** When the phase is done, each recipe in `requirements-board/capture/recipes/`
matches what was built (FT-01.1 brings US-01.1.1 to US-01.1.4; FT-01.2 brings US-01.2.1 to US-01.2.3):

| Item | Recipe at plan time | When this phase is done |
|---|---|---|
| [US-01.1.1](../../../../requirements-board/requirements/stories/US-01.1.1.md) Two Slots per anaesthetist per day | captured · admin-day-grid, web-my-lists, mobile-my-lists | captured. Re-shoot all three (captions say session: "Every anaesthetist has an AM and a PM session, booked or not"). Add an admin `day-grid` state `free-by-default` at `/admin/day/2026-09-07` (past the recorded window: recurring Lists, leave and Free sessions only) captioned "New sessions start free; recurring bookings are painted on". |
| [US-01.1.2](../../../../requirements-board/requirements/stories/US-01.1.2.md) Horizon rolls forward daily | partial · admin-permanent-lists | partial, unless the runner can drive the clock. Keep `permanent-lists` and add `schedule-settings` (admin Master data, Schedule settings, `admin-schedule-settings`) showing the horizon end date. If the runner can press the harness clock's Next day, add an Audit viewer state showing "canvas.rollForward" and mark captured; otherwise update the reason: "The daily roll-forward is a background job; Schedule settings shows the horizon it extends, and the clock's Next day demonstrates it." |
| [US-01.1.3](../../../../requirements-board/requirements/stories/US-01.1.3.md) New anaesthetist gets a populated canvas | partial · admin-add-anaesthetist | captured. Re-shoot `add-anaesthetist` (keep the name): `form` with the required Start date field (`admin-add-anaesthetist-start`, hint "Sessions are created from this date to the end of the schedule horizon."), `added` ("N forward sessions created from 3 Aug"), `listed` (the Anaesthetists table with the Start date column) and a new `day-grid` state at `/admin/day/2026-08-03` showing the new row of Free sessions (and the day before showing none). Fill start date 2026-08-03 in the steps. Drop the partial reason about the new rows not showing. |
| [US-01.1.4](../../../../requirements-board/requirements/stories/US-01.1.4.md) Slot default times | partial · admin-list-times | captured. Keep `list-times` (Edit list, with the Default hint and "Use default" link) and add admin Master data, Schedule settings (`admin-schedule-settings`): states `table` (AM and PM defaults, "Sessions with their own times keep them.") and `edit` (the sheet changing PM to 13:30). Caption: "Admins set default start and end times for AM and PM sessions". Drop the partial reason. |
| [US-01.2.1](../../../../requirements-board/requirements/stories/US-01.2.1.md) Anaesthetist sets half-day availability | partial · mobile-my-availability, web-availability-grid | partial. The Slot now holds the status (one mechanism), but the mobile app still offers Free or Block only and the web app cannot change availability: Phase 29 builds the calendar. Re-shoot `my-availability` (mobile) with a new state `list-session`: a session that holds a List keeps the List's colour and label when blocked, with the amber flag (interim until Phase 32's return-or-assign). Re-shoot `availability-grid` (web) and add a state where a session assigned by the office reads booked, not Free. Update the reason to name Phase 29 and drop the stale "second record" wording. |
| [US-01.2.2](../../../../requirements-board/requirements/stories/US-01.2.2.md) Slot status master data | partial · admin-list-statuses | partial. Re-shoot `list-statuses` (admin Master data, List statuses) to confirm it still renders through the one label lookup. Reason: "Still view only: statuses cannot be added or renamed and colour is not editable; Phase 29 turns this view into the user-maintained status list." |
| [US-01.2.3](../../../../requirements-board/requirements/stories/US-01.2.3.md) Status is independent of bookings | captured · admin-status-without-bookings, web-status-without-bookings | captured. Keep `status-without-bookings` (admin day grid, web Lists), re-shot on the split model and recaptioned, since an empty session is no longer a List: admin "Unavailable and holiday sessions with no bookings" (was "Unavailable and holiday Lists with no bookings"), web "Leave sessions with no bookings" (was "Leave sessions on my Lists with no bookings"). Add: a `list-in-place` state on admin after Assign List (the block turns Private and the drawer shows the List), a web Lists row for the assigned session, and a mobile `mobile-lists-assigned` shot at `/mobile/lists` where the session shows as a booked List row, not "Free session / Offer cover". Stage the mobile state through the PWA "Office assigns a List to my next free session" sheet on :5174, or with a seeded assigned session if the runner cannot drive the sheet. Caption: "A List shows in place of the session's status, on all three apps". |
| [US-01.3.3](../../../../requirements-board/requirements/stories/US-01.3.3.md) Manual List assignment | captured · admin-assign-free-list | captured. Re-shoot `assign-free-list` (keep the name): the "Free List" drawer goes (the grid's dashed Free block and its "open for cover" subtitle stay, read from the session's note, so the recipe's click still finds it). States `drawer` (empty-session drawer with Assign List, Book (phone advice), Edit times, History, and no List state; `admin-slot-drawer`), `assign` (the Assign List sheet with hospital, surgeon and kind, the surgeon picker showing the not-preferred group apart; `admin-assign-list`), `assigned` (the block turns Private; the drawer shows the List as `ACTIVE`) and `book` (phone advice, times prefilled 13:00 to 17:30, surgeon required). Replace any caption that says "Free List" or shows a state on an empty session. Caption: "Assigning a surgeon and hospital turns a free session into a List". Add the mobile and web assigned-row states shared with US-01.2.3. |
| [US-01.4.2](../../../../requirements-board/requirements/stories/US-01.4.2.md) Availability finder | captured · admin-availability-finder, web-availability-finder, mobile-availability-finder | captured. Re-shoot all three; add an admin state after Assign List on Strand Tue 21 PM with the legend filtered to Free (the session is gone), and a web `free-only` state after the same assignment (the session is not listed). **Add the office finder** (`admin-availability-finder`): state `tiers` (Find available for a PM session, anaesthetists listed Tier 1 first with neutral tier pills and the tier filter) and `not-preferred` (Ms Reid chosen as surgeon, Dr Sharma in the separate "Not preferred" group, still selectable), on a day where Sharma's session is open; captioned "The office sees who is free by priority tier, with not-preferred pairings apart". The mobile and web shots stay name-ordered with no tier or pill (their captions say nothing about tiers). If the recipe runner can add an anaesthetist first, add a `new-anaesthetist` state on the admin grid at 2026-08-03; otherwise US-01.1.3's `day-grid` state covers it. Caption for the set: "Free sessions across every anaesthetist; a session holding a List is never offered as free". |

**Recipes this phase breaks.** Work item 23 lists how to find them; the plan-time set is:
- `US-01.3.3` and `US-02.3.1` (`phone-advice-booking`, `amend-booking`): click `[data-day-grid-row]
  button:has-text("open for cover")` (or `text="open for cover"`) and "Book (phone advice)". The Free
  block and its subtitle stay, but the click now opens the empty-session drawer, and the Phone
  advice flow needs a surgeon and hospital first and prefills 13:00 to 17:30 for PM. Re-point the
  steps after the click, fill the surgeon, and keep the shot names.
- `US-01.4.1` (`reassign`): "Reassign list" and its confirm step lose the "free target, absorb and
  regenerate" wording and gain the vacated-session picker (Free default); 17's tier-ordered candidate
  groups stay. Re-point and recaption.
- `US-01.3.5` and `US-01.3.6` (Phase 17's recipes on Edit list, Book (phone advice) and Reassign list):
  the phone-advice step now assigns first and the reassign candidates are open sessions; check each
  still lands, and add the Assign List sheet's not-preferred group to US-01.3.5's set and the office
  finder to US-01.3.6's (the finder is the catalogue's own example, "for example in the availability
  finder").
- `US-01.4.1`, `US-01.3.1` and `US-01.5.2` (`holiday-conflict`, `unavailable-conflict`) click day-grid
  blocks by position (`[data-day-grid-row="34821"] button >> nth=0`, `[data-day-grid-row="29104"] ...`),
  and `US-01.4.3` (`cover-request`) clicks mobile "Open for booking" and "Tap to ask". Blocks are now
  keyed by Slot and the roster comes from `rosterForDate`: check each click still lands on the
  intended block (a booked List, not an empty session) and re-point by `data-slot-id` where it does
  not. Any recipe or hook that used a free session's List id (for example `L-41267-2026-07-21-PM`,
  `L-47733-2026-07-21-PM`, `L-34821-2026-07-22-PM`) has no List to open now: point it at the drawer
  by `data-slot-id`.
- `US-01.3.1` (`list-pairing`): "Edit list" is kept; check the sheet's new times row.
- `US-01.5.3` (`my-availability`). (`US-02.5.4`'s raw state text was re-pointed to `ACTIVE` by 15b;
  check it still finds an assigned List, since free sessions no longer carry a state.)
- `US-12.1.4` (`anaesthetist-record`, state `add`) and `US-12.1.2`: the Add and Edit anaesthetist
  dialogs gain a required Start date; the steps still pass if the default is accepted, but re-shoot
  to include the field. Phase 26 also changes these dialogs.
- Any recipe that navigates past 2026-08-16 and expected an ad hoc List or unavailability there:
  generation no longer invents them; re-point to a date inside the recorded window or to a recurring
  booking.
- Recipes for Lists of the seeded days are unaffected: booked `L-...` ids and the
  `[data-testid=admin-list-drawer]` hook are kept.

**ATLAS.md.** Personas and IDs: Slot ids `S-<reg>-<date>-<session>`, projected Lists keep `L-...`,
runtime Lists `LG####`. Seed data: which sessions are now empty Slots rather than Free Lists
(the "open for cover" blocks are empty sessions with a note, not Lists), the recorded window (2026-07-07 to 2026-08-16) and the
free-by-default canvas beyond it. Routes: none expected. Existing hooks: add `admin-slot-drawer`,
`admin-assign-list`, `admin-schedule-settings`, `admin-horizon-months`,
`admin-add-anaesthetist-start`, `admin-day-beyond-horizon`, `admin-availability-finder-open`,
`admin-availability-finder`, `mobile-lists-assigned`. Overlays: the Assign List sheet, the Find
available sheet, the Schedule settings sheets, the Edit times sheet. Gotcha: the finder's order is
shuffled within a tier from `suggestionSeq`, so a recipe asserts tier order, not exact row order, and
starts from a fresh Reset. Gotchas: a Free block ("open
for cover") opens the empty-session drawer, not a Free List, and has no `L-` id; the UI never says
"slot".

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
- **One derivation, one mechanism.** The displayed status comes only from `displayStatusKey(slot, list)`,
  and availability lives only on `Slot.status`. Hunt for any surviving derivation from Bookings,
  hospital or surgeon (`displayStatusKeyForList`, `effectivelyBooked`, `statusKey === 'free' && cards`),
  any leftover availability record or reconcile step, any screen or finder that reads `list.kind` or
  a status for a free test instead of `isOpenSlot`, and any app whose label or colour for the same
  session differs from the others.
- **Generation (US-01.1.1, FT-01.1).** No RNG draw outside the seed's recorded window; the calendar
  is painted before recurring bookings and a clash is traced, not dropped silently; inactive
  anaesthetists get no Slots on any path; the horizon is read from the setting everywhere (no
  surviving `HORIZON_FUTURE_MONTHS` reader); extending deep-equals roll-forward; shortening never
  drops a List with Bookings.
- **No caller left behind.** Every former `listForSlot` caller now handles "no List in this Slot"
  correctly: the integration targets park instead of silently retiming, the addendum creates its List,
  the PDF picker offers Lists only, the finders and cover chips use open Slots, the Admin roster comes
  from `rosterForDate`, and no code parses a List id to find its Slot.
- **Identity.** Projected Lists keep `L-<reg>-<date>-<session>` ids, runtime Lists take `LG####`, and a
  reassigned List keeps its id; Slot ids are deterministic; the denormalised `anaesthetistId`,
  `dateISO` and `session` on a List always equal its Slot's after every action (assign, reassign,
  roll-forward, horizon change, addendum, stand-in). Roll-forward and `addAnaesthetist` read the same
  leave input (`SEED_LEAVE`), start dates and active flags as the seed build, so the far edge matches
  a fresh generation.
- **Start date and active.** No Slot exists before an anaesthetist's start date, or from today for an
  inactive one, after any path (seed, add, edit, roll-forward, horizon extension); editing either
  never touches a date before today and never deletes a List.
- **Determinism.** The golden test reproduces the demo window and Bookings exactly, and the far-edge
  fixture was regenerated once, deliberately; the RNG draw order per slot is unchanged inside the
  window; roll-forward deep-equals a fresh generation; no `Date.now()`, `new Date()` or
  `Math.random()` (the start-date default comes from the demo clock); `PERSIST_VERSION` bumped and the
  migrate test extended.
- **Audit and guards.** Every new write goes through `mutate()` with before and after; reassign writes
  one `list.reassign` and no absorb or regenerate; the office-only and AUTHORISED guards hold on assign,
  move, times, defaults and the horizon; the new action codes are labelled; a not-preferred pairing
  on assign or reassign warns and never refuses, writing exactly one 17-style
  `list.pairingAcknowledged` and only for an office actor; `moveListToSlot` with an anaesthetist actor
  reads, checks and logs no preference; a move recalculates no prepayment or invoice (US-06.3.5).
- **Tiers and preferences: 17's helper, office only.** The office finder, the Assign List sheet and
  the reassign picker order, group, shuffle and filter only through `rankAnaesthetistCandidates` and
  `groupSurgeonsForAnaesthetist`, never inline; the shuffle key is deterministic
  (`suggestionSeq`, no `Math.random`, no wall clock); no tier, pill or preference reaches a mobile,
  web, PWA or shared file (17's `officePrivacy.test.ts` green, its allowlist widened only by
  `store/slotActions.ts`); the stand-in body reads no preference; tier and pairing words come only
  from 17's label set, and no "blacklist" or "whitelist" anywhere.
- **Scope discipline.** No Draft Lists, no pairing enforcement, no availability calendar or status
  editor, no conflict clearing or colour change, no return-or-assign, no anaesthetist move flow. The
  interim refusals (assign onto an unavailable session) and interim behaviours (conflict flag on an
  unavailable Slot holding a List until 32, addendum List until 38b, integration parking until 33) are
  labelled as such in code comments and the Decisions log. OQ-84's default is labelled provisional in
  the Decisions log only.
- **Design and copy.** The six colours and treatments are unchanged; the empty-session drawer extends
  the List drawer; teal-only actions; no en or em dashes; **no "slot" in any app copy, audit label or
  field label**; an assigned List shows `ACTIVE` as 15b prints it, an empty session shows no state,
  and no "Open" or "Draft" label is introduced; `pwaPurity`
  holds and the stand-in is PWA-only and badged.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry; ROADMAP.md "Owner review: agents test
  themselves"): the defaults built for open questions and readings, anything logged rather than
  fixed, and the screens worth a look, each with its route and persona. At least: the vacated session
  returns to Free on an office reassign, with Unavailable or Holiday on request (OQ-84
  recommendation); the List kinds (private, public, pre-op) kept as a List attribute outside the
  status list (DM-04: the catalogue has no List kind); the seed's recorded window (2026-07-07 to
  2026-08-16) and the free-by-default canvas beyond it (Admin Day, Mon 7 Sep); the horizon range 1 to
  24 months and shortening dropping empty Lists (Admin, Master data, Schedule settings); deactivation
  refused while Lists stand (Admin, Master data, Anaesthetists); assign onto an unavailable session
  refused until 30; a booked session marked unavailable keeps a conflict flag until 32; the office
  finder's placement ("Find available" in the Admin Day header, a sheet) and its request key
  (date, session and `suggestionSeq`) (Admin, Day, Wed 22 Jul); the acknowledgement written at
  assignment rather than when the phone-advice Booking is created.
- **Status row** for catch-up Phase 28, and a phase entry with:
  - the drift-check result (items changed or not against `60e2d1e`; OQ-81, OQ-84, OQ-80 and OQ-102
    still open or answered; that 15b and 17 had run; how 17's acknowledgement was carried into
    `assignListToSlot` and `reassignList` while `moveListToSlot` stays preference-free; whether any
    prepayment re-check on a move was found and removed);
  - what was built, with the name map for later phases: `listForSlot` removed in favour of `slotFor` +
    `listInSlot`; `listIdForSlot` renamed `projectedListId`; `ListStatusKey` renamed
    `DisplayStatusKey`; `List.statusKey` replaced by `List.kind` plus `Slot.status`;
    `List.startTime`/`endTime`/`coverRequest` moved to the Slot; `generateListsForDates` renamed
    `generateCanvasForDates` (now taking start dates and active flags, drawing no RNG, returning
    clashes); `masters.availability` removed; `Anaesthetist.startDateISO` added;
    `appSettings.schedule` (`horizonMonths`, `defaultTimes`) and `horizonFor(today, months)`;
    `rosterForDate`; `displayStatusLabel`; `AvailabilityFinderSheet` on 17's
    `AnaesthetistCandidates`; `assignListToSlot` writing `state: 'ACTIVE'`;
  - the `PERSIST_VERSION` bump (from and to);
  - tests added (the golden fixture, `slots.test.ts`, `slotActions.test.ts`, the generation,
    independence, one-mechanism, horizon, start-date, active, roster and three-app parity tests) and
    the before and after Vitest and Playwright counts;
  - the review pass;
  - the Catalogue screenshots result: the recipes created or changed (US-01.1.1, US-01.1.2, US-01.1.3,
    US-01.1.4, US-01.2.1, US-01.2.2, US-01.2.3, US-01.3.3, US-01.4.2 and the recipes this phase broke),
    the REPORT.md counts (captured, partial, absent, failed) before and after, and any partial reason
    handed to Phase 29; plus the states added to 17's US-01.3.5 and US-01.3.6 recipes.
- **Decisions log:**
  1. **Superseded:** 2026-07-23 "Availability reconciliation, both directions". Availability is a
     status held on the Slot, the one mechanism the calendar edits (OQ-17, OQ-27 and OQ-64,
     answered); nothing is "restatused" or reconciled; a Slot holding a List keeps the List's kind
     and is conflict-flagged when marked unavailable or holiday (interim until Phase 32 offers return
     or assign, US-01.5.5); marking it free writes no conflict.
  2. **Superseded:** the reassign mechanism (4th review #6 and the Phase 06 entry: free target, absorb,
     regenerate the vacated slot, default Unavailable). The List moves between Slots, keeps its id, and
     the vacated Slot returns to free by default (US-01.4.1; OQ-84's recommendation, **provisional**
     until OQ-84 is answered, this entry being its one place).
  3. **Superseded:** Phase 06 decision (5), the grid display-status derivation from cards or a hospital.
     One pure `displayStatusKey(slot, list)` for all three apps and the finders: the List's kind in
     place of the Slot's status (US-01.2.3). Handoff item P5 is closed.
  4. **Superseded:** 2026-07-23 "Slot-hashed generator randomness" as a generation rule. Generation
     writes free Slots, then the calendar, then recurring bookings (US-01.1.1, OQ-81 part 1) and draws
     nothing; the slot RNG survives only for the seed's recorded window and the filler Bookings.
  5. **Superseded:** the fixed horizon constant (`HORIZON_FUTURE_MONTHS`). The horizon is a setting
     (FT-01.1), four months by default; shortening drops far-edge Slots and empty Lists, extending
     generates them.
  6. **Amended:** 2026-07-23 "Deterministic IDs". Slots `S-<reg>-<date>-<session>`; projected Lists keep
     the birth-slot `L-...` form (never parsed); runtime Lists `LG####`; no regenerated Lists. The
     Phase 02 entry's "always resolve slots via `listForSlot`" note is replaced by `slotFor` +
     `listInSlot`.
  7. **New (OQ-64, answered):** every Slot is stored; the Slot status values start as free,
     unavailable and holiday behind one label lookup (Phase 29 makes them a user-maintained list); the
     List kinds private, public and pre-op stay a List attribute, so the six-colour design language
     holds; "Slot" is a code and planning word and never appears in app copy (the UI says session).
  8. **New:** default AM and PM times and the horizon are one schedule-settings record
     (`appSettings.schedule`); time overrides live on the Slot and travel with a reassigned List.
  9. **New:** an empty session carries no List state; every List created by assignment or projection
     is `ACTIVE` (15b's rename, EP-07); `DRAFT` and "Draft List" are reserved for Phase 31.
  10. **New, interim:** assignment onto an unavailable or holiday session is refused until Phase 30; the
      post-op addendum creates its List in today's open session until Phase 38b; a hospital message
      whose target session holds no List parks for the office until Phase 33; a recurring booking on an
      unavailable Slot is traced, not projected, until Phase 31 makes it a Draft List.
  11. **New:** List keeps denormalised `anaesthetistId`, `dateISO` and `session`, kept equal to its Slot's
      by the store and checked by an invariant test.
  12. **New:** an anaesthetist's Slots start on their start date (US-01.1.3) and exist only while they are
      active; a start-date or active edit adds or removes Slots from today on and never removes a List.
  13. **New:** the office availability finder ("Find available" on Admin Day) lists open sessions
      through 17's helper, by tier and shuffled within a tier, with not-preferred pairings apart
      (US-01.3.5, US-01.3.6); the anaesthetists' finders stay untiered. The pairing acknowledgement is
      written by the office entry points (`assignListToSlot`, `reassignList`), never by
      `moveListToSlot`, so the anaesthetist's own moves log none (US-01.4.5).
  14. **New (US-06.3.5, US-06.5.4):** a reassign recalculates no prepayment or invoice; the payee
      repoint on a move is Phase 41's (OQ-80).
  Convention 10 ("six statuses ... used by all three apps") stands; note that the key is now derived.
- **Handoff notes:**
  - For **29**: the calendar edits `Slot.status` directly (one mechanism, nothing to reconcile);
    `SlotStatus` is the set to turn into the user-maintained master, and `displayStatusLabel` is the
    one lookup to point at it; `setAvailability` already writes the Slot; web gets the same control;
    series and single-instance edits write the same field, bounded by `scheduleHorizon`.
  - For **30**: `assignListToSlot`'s `slotNotAvailable` refusal becomes accept-and-flag; availability
    conflicts are not cleared yet; `'adminDay.selectedSlotId'` is ready for "Simulate sickness";
    recurring-booking edits need a projection over existing Slots (`generateCanvasForDates` is pure and
    reusable), and the Permanent List rename is still to do.
  - For **31**: `generateCanvasForDates` returns `clashes` (a recurring booking on an unavailable Slot;
    the seed test pins their count): turn each into a Draft List (OQ-81 part 2) on the seed, roll-forward
    and horizon-extension paths; `placeListOnSlot` is the one creation path a Draft List assignment
    should reuse (it writes `ACTIVE`; a Draft List needs the `DRAFT` state 31 adds and no anaesthetist);
    the office finder and `AnaesthetistCandidates` with an open-session filter are what the Draft List
    picker reuses; the pairing rule has three seeded exceptions to resolve (Fitzgerald TBC, pre-op,
    acute).
  - For **32**: `setAvailability`'s conflict path on a Slot holding a List is where return-or-assign
    (US-01.5.5) starts; `Slot.coverRequest` is the marker to remove; `moveListToSlot` is the move into
    a colleague's free Slot; the vacated default (OQ-84) is asked of the anaesthetist there.
  - For **32a**: `moveListToSlot` (no preference check, no prepayment re-check) is what the
    single-Booking move extends, and the internal `placeListOnSlot` (an `ACTIVE` List, `LG####`,
    one `list.create`) is the one way to create the colleague's List when the session is empty; the
    payable follows the anaesthetist who does it.
  - For **41**: `moveListToSlot` is the one seam for the payable's payee repoint on a move of a prepaid
    Booking (OQ-80's default, D38); it carries a comment marking the spot.
  - For **33**: the integration parking rule is the seam for "no silent apply".
  - For **35**: the reassign confirm and the List's change history are what the on-demand update email
    picks from (D19).
  - For **38a**: the Slot views and `slotViewsForAnaesthetist` are what the anaesthetist's main view
    (today onward plus earlier un-invoiced Lists, OQ-31) builds on.
  - For **38b**: remove the addendum's List creation with the addendum.
  - For **43**: long horizons at full scale (`setHorizonMonths` caps at 24; the scale test runs at 4).
  - For **44**: S2 Beats 1 to 3 were patched here; re-read them in the rewrite.
