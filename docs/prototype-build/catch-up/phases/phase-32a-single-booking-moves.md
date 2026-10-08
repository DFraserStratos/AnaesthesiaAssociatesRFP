# Phase 32a · Anaesthetist moves a single Booking

**Requirements covered:**
[US-01.4.7](../../../../requirements-board/requirements/stories/US-01.4.7.md) Anaesthetist moves a single Booking (Verify; text unchanged at `60e2d1e`, now linked to [AR-22](../../../../requirements-board/requirements/artifacts/AR-22.md) region `booking-editable`: "Amended or moved by the anaesthetist, the office or a hospital feed until the List is submitted") ·
[US-01.4.6](../../../../requirements-board/requirements/stories/US-01.4.6.md) The List's anaesthetist did its procedures (Verify; unchanged at `60e2d1e`, but its AC3 "prepayments are re-checked" is overtaken by the newer US-06.3.5, see below) ·
[FT-01.4](../../../../requirements-board/requirements/stories/FT-01.4.md) List reassignment and locum search (Confirmed; graded Partial, and its last strand, "or a single Booking from it", closes here) ·
[DM-42](../analysis/domain-model-delta.md#dm-42) A single Booking moves to a colleague, and whoever submits a List did its procedures: a receiver marked unavailable first sets themselves available; a Booking done by someone else moves to a List of theirs, even a one-Booking List, and its payable follows with no recalculation.
DM-06 (whoever submits a List did its procedures) is no longer a separate delta: the 2026-10-08 gap
analysis merged it into DM-42 (DM ids are stable), so this phase builds it as part of DM-42.
Also touches, without closing:
[US-01.4.3](../../../../requirements-board/requirements/stories/US-01.4.3.md) (the whole-List move, Phase 32; this phase reuses its helpers),
[US-01.4.5](../../../../requirements-board/requirements/stories/US-01.4.5.md) (Confirmed at `60e2d1e` and reversed: **no** preference warning when an anaesthetist moves their own work, nothing revealed to either anaesthetist, colleagues offered by availability alone; Phase 32 closes it for the List, and this phase applies the same rule to a single Booking under D44),
[US-13.8.2](../../../../requirements-board/requirements/stories/US-13.8.2.md) and [US-13.8.1](../../../../requirements-board/requirements/stories/US-13.8.1.md) (Phase 32's shared notification pool, which Vanessa agreed on 2026-10-07; a single-Booking move posts to it under OQ-85's recommendation),
[US-01.4.1](../../../../requirements-board/requirements/stories/US-01.4.1.md) (the office's own moves, Phase 28; the office's `MoveBookingFlow` stays),
[US-01.4.2](../../../../requirements-board/requirements/stories/US-01.4.2.md), [US-01.2.1](../../../../requirements-board/requirements/stories/US-01.2.1.md) and [US-01.5.3](../../../../requirements-board/requirements/stories/US-01.5.3.md) (the receiver sets their own session available from Phase 29's calendar, which is their acceptance),
[US-01.3.1](../../../../requirements-board/requirements/stories/US-01.3.1.md) (Phase 31's pairing rule, which decides whether a Booking can join the receiver's List),
[US-06.3.5](../../../../requirements-board/requirements/stories/US-06.3.5.md) (Verify, rewritten at `60e2d1e`: a move is **not** one of the changes that re-check a prepayment; "when it or its List moves to another anaesthetist, then no prepayment or invoice calculation is re-triggered". This phase proves its AC2 for the single-Booking move),
[US-06.5.4](../../../../requirements-board/requirements/stories/US-06.5.4.md) (Verify, rewritten at `60e2d1e`: an honour system; the new anaesthetist claims no more than was prepaid; no logic detects the move. Its AC1 "no new prepayment invoice, the patient not billed again" and AC3 "the payable is to B for the prepaid amount" are proved here; its AC2, the payable half of the draft pair repointed, is Phase 41's one store action, called from this move's hook, D38),
[US-02.3.3](../../../../requirements-board/requirements/stories/US-02.3.3.md) (the update email the office may send after the move, manual only per OQ-82; Phase 35 hangs it on the pool row).
**Answered and built as answered (no provisional label):**
[OQ-39](../../../../requirements-board/requirements/questions/OQ-39.md) (**D7**): no acceptance by a colleague who is available and no office confirmation, a high-trust system.
[OQ-43](../../../../requirements-board/requirements/questions/OQ-43.md) (**D44**, answered 2026-10-07): pairing preferences are private and two-way, admin only; there is no warning at all when an anaesthetist hands on their own work, and nothing is revealed to either anaesthetist. The Booking-subject prompt the earlier plan gave this phase is dropped.
[OQ-70](../../../../requirements-board/requirements/questions/OQ-70.md) (**D20, superseded 2026-10-08**): the anaesthetist who does a moved prepaid Booking keeps the agreed amount and claims no more (an honour system); the system detects nothing on a move and re-checks or recalculates nothing. The earlier reading, "the move re-checks the prepayment through Phase 27's `syncPrepayment(..., 'bookingMoved')`", is gone.
[OQ-65](../../../../requirements-board/requirements/questions/OQ-65.md) (**D15**): the shared notification pool.
**Open, built as the default, labelled provisional in one place each:**
[OQ-85](../../../../requirements-board/requirements/questions/OQ-85.md) (the single-Booking experience: search by anaesthetist; only receivers whose session is available are offered; a List is created in the receiver's session when none exists; the move notifies as a List move does. Its part 4, "whether the blacklist warning applies", is overtaken by OQ-43's answer: it does not. The constant `SINGLE_BOOKING_MOVE_RULE`, and one caption on the move sheet),
[OQ-80](../../../../requirements-board/requirements/questions/OQ-80.md) (**D38**, refreshed 2026-10-08: the pair is created when the prepayment invoice is generated, Phase 27, and on a move before the procedure only the payable's payee is repointed, by Phase 41's one store action, with no recalculation. This phase builds nothing of the pair: it leaves one named, empty after-commit hook that 41 fills, and one doc comment naming D38 and OQ-80),
[OQ-79](../../../../requirements-board/requirements/questions/OQ-79.md) (what posts to the pool: still open after 2026-10-07; its recommendation, which Phase 32 builds as `NOTIFICATION_POOL_RULE.sources: ['listMoved']`, is "List moves only for now"; OQ-85's recommendation adds the single-Booking move as a second source, and this phase records that on the owner's review list).
**Depends on:** Phase 32 (the anaesthetist's move helpers in `src/domain/listMoves.ts`, the store actions in `src/store/listMoveActions.ts`, any after-commit move hook it left for Phase 41, the shared notification pool and its writer, the colleague's "Moved to you" notice, `SCRIPTED_BEAT_SCHEDULE`, `anaesthetistActor(state, id)` in `src/store/demoActors.ts` and the trigger bodies in `src/store/listMoveDemo.ts`; all are planned names, so use what 32 delivered). Through 32: Phase 31 (the pairing rule `pairingIssues`, Draft Lists in the DRAFT state), 29 (Slot statuses as a master, `isOpenForBooking`, the availability calendar the receiver uses), 28 (`Slot`, `slotFor`, `listInSlot`, the internal `placeListOnSlot`), 27 (the prepayment invoice, its ledger pair and draft Xero pair, created at generation, and a prepaid Procedure priced at the prepaid amount, locked: this phase reads them only in tests), 25 (the payee fixed by the pricing snapshot at authorise), 17 (the privacy boundary: preferences and tiers in an office-only slice, `src/domain/pairingPreferences.ts`, `store/officePrivate.ts` and `src/apps/officePrivacy.test.ts`), 15b (the List state ACTIVE, was DRAFT), 15a (the warning routine; `SubmitListSheet` left with no confirm step added), 15 (`reassignBooking`, `BookingDetailBody`) and 14 (the trigger registry). Phase 27 is not a dependency for behaviour: a move re-checks no prepayment. This is the last phase of the Schedule track and a **milestone** phase: it ends with a consistency read of the master demo guide. Phase 41 follows and needs it (it fills this phase's hook with the payee repoint).
**Estimated:** 1 session. Order: helpers and their tests, seed tests, the store action and its tests, labels and the pool row, then the sheet, the entry points, the colleague's and office's views, the triggers and the shots. If the session runs long, cut the receiving Booking's "Moved to you by" line on Booking detail (work item 9b) before anything else; the colleague's notice panel row stays.

**Open questions in one place.** US-01.4.7 and US-01.4.6 are Verify because OQ-85 and OQ-80 are open.
D7, D15, D20 (as superseded) and D44 are answered and built with no provisional label. OQ-85's
recommendation is built behind one rule constant and one caption, so a different answer is a change
to `SINGLE_BOOKING_MOVE_RULE`, the receiver helper and that caption. OQ-80's default (D38) is a single
empty hook here; Phase 41 fills it.

## Goal

Let an anaesthetist move one Booking as well as a whole List (US-01.4.7, DM-42; Greg: "at the list
level or at the booking level"), and build the doer rule on the same move (US-01.4.6, DM-42, which
now holds what DM-06 was).

Today only the office can move a Booking to another anaesthetist (Admin `MoveBookingFlow` over
`reassignBooking`). For an anaesthetist actor, `reassignBooking` refuses any move to someone else's
List (`notOwnList`, "Anaesthetists can only move Bookings between their own Lists.",
`store/lifecycle.ts:659` at `60e2d1e`), which is the opposite of the catalogue's rule, and no
anaesthetist screen calls it. Nothing finds the receiver and nothing creates a List for them.

This phase:

- adds **Move to a colleague** on a Booking in the mobile and web apps, for the List's owner while
  the List is ACTIVE and its day is today or later ("before the procedure"). The sheet finds the
  receiver **by searching by anaesthetist** (OQ-85's recommendation). Only colleagues whose session
  (same day, same AM or PM) is available are offered, sorted by name: availability alone, never
  grouped or ordered by a pairing preference or a priority tier (US-01.4.5, D44; tiers are admin
  only). A colleague on leave or unavailable shows when searched for, but cannot be picked: they first
  set that session available in their own app, which is their acceptance of the work (the office does
  not hand work to someone unavailable without them knowing);
- lands the Booking on the receiver's List in that session, or **creates a List there** when the
  session holds none, even a one-Booking List, copying the source List's hospital, surgeon and kind
  so the pairing rule holds. Greg's favour List (a one-Booking List nobody else may add to) is not
  built;
- makes the move at once, as one audited from, to, by, when event (D7: no acceptance and no office
  confirmation). **No preference warning** is shown to either anaesthetist, and the move path never
  reads the office-only preference slice (D44, US-01.4.5);
- **the payable follows the Booking, with no recalculation** (US-01.4.6 AC2, DM-42): it is derived
  from the List's owner until Phase 25's snapshot fixes it at authorise. **Nothing about a
  prepayment is re-checked or recalculated** on the move (US-06.3.5 AC2, US-06.5.4, D20's honour
  system): no `syncPrepayment` call, no new invoice, the prepaid amount and Phase 27's locked prepaid
  price unchanged. An already-created prepayment pair's payable payee is repointed by **Phase 41's one
  store action**, called from this move's single named after-commit hook once 41 lands (OQ-80's
  default, D38); until then the hook is empty, the pair is left as it is, and the handoff says so;
- posts to Phase 32's notification pool, as a List move does (OQ-85's recommendation). The receiver
  sees the Booking with a "Moved to you" notice;
- **is the doer rule.** Whoever submits a List did every procedure on it, so a Booking a colleague
  will do is moved to the colleague first. The submit sheet says so in one sentence and adds no step.
  There is one action for both readings (hand a case on, and move it to the one who does it);
- replaces the anaesthetist guard in `reassignBooking`: an anaesthetist's move to a colleague now
  has exactly one path, the new action with its receiver rule. The office's `MoveBookingFlow` stays
  as it is;
- registers one Admin Day bar trigger and one PWA stand-in, so the office's side and the receiving
  side can be shown without switching persona.

FT-01.4 then holds in full: a List (Phases 28 and 32) or a single Booking from it (this phase) moves
between anaesthetists at short notice with its bookings, status history and audit trail intact.

## Before you start: drift check

1. Run the catalogue diff since this plan's baseline (catalogue commit `60e2d1e`, the 2026-10-08 plan
   update):

   ```
   node docs/prototype-build/catch-up/tools/plan-state.mjs --diff US-01.4.7,US-01.4.6,FT-01.4,US-01.4.3,US-01.4.5,US-13.8.1,US-13.8.2,US-06.3.5,US-06.5.4,OQ-85,OQ-80,OQ-43,OQ-70,OQ-79,OQ-84,OQ-39,OQ-65,OQ-82
   ```

   Read the hunks, and the "Slot, List and Draft List" section of `domain-model.md` (the
   single-Booking sentence and "Whoever submits a List did its procedures", which now ends "the
   system detects nothing and recalculates nothing").
2. If an item changed, re-read it and adjust the work items before building. If a covered story is
   now Retired or Future, drop it and say so in the PROGRESS entry. Specifically:
   - **US-01.4.7 gone** (Retired or Future): drop the move sheet, its entry points and both triggers,
     and keep only the doer rule's submit sentence and the replaced guard. Tell the owner.
   - **US-01.4.7 gains acceptance criteria** (it has two at `60e2d1e`): map each to a work item and a
     test. US-01.4.6 has three; work item 5's tests map them.
   - **US-01.4.6 AC3 reworded** to match US-06.3.5 (no re-check on a move): nothing to change; drop
     the contradiction from the owner's review list. **US-06.3.5 or US-06.5.4 bring a re-check on a
     move back:** stop and tell the owner (it reverses D20 and 41's plan).
3. **OQ-85 (the experience).** If it is still open, build the recommendation exactly as work items 2
   and 7 describe, with the rule in `SINGLE_BOOKING_MOVE_RULE` and one provisional caption on the
   sheet's search step ("How a single Booking is moved is still being confirmed with AA."). If it is
   answered:
   - **"Pick from the receiver's Lists" or "the availability view" instead of a search:** change the
     sheet's search step only; the receiver helper stays;
   - **"No List created; the receiver must already have one":** set `createListIfNone: false`; the
     helper then marks an empty session `noList` ("Dr X has no List in this session");
   - **"No notification":** set `notifyPool` to false (leave `'bookingMoved'` out of
     `NOTIFICATION_POOL_RULE.sources` and have the colleague's notice read the
     `booking.movedToAnaesthetist` meta instead of a pool record);
   - **OQ-79 answered "List moves only"** (no other source posts): treat it as "no notification" above;
   - **a warning wanted after all:** stop and tell the owner; it contradicts OQ-43's answer and
     US-01.4.5;
   - **the favour List is wanted now:** stop and tell the owner; it is new scope for a later phase.
4. **OQ-80 (D38).** Nothing of the pair is built here. If OQ-80 is answered "no payable update on a
   move" (the honour system read strictly), the hook stays empty for good: note it for Phase 41 and
   change nothing here. If answered "create the pair when the money is received", note it for 41 and
   change nothing here.
5. **OQ-43 (D44).** Answered. If it was reopened with a prompt for anaesthetists, stop and tell the
   owner.
6. **OQ-70 (D20).** If it has been reopened ("credit and re-prepay at the new rate"), stop and tell
   the owner, because it changes Phases 27 and 41.
7. **Baseline.** Confirm Phases 14 to 32 (with 15a, 15b, 19a, 19b and 20a) are DONE in
   PROGRESS.md, then read what Phases 25 to 32 left, because this doc names planned files and
   functions:
   - **Phase 32:** the pure helpers in `src/domain/listMoves.ts` (planned: `ownMoveRefusal`,
     `pushTargets`, a shared receive predicate such as `canReceiveList`), the store actions in
     `src/store/listMoveActions.ts` (moving to the office and into a colleague's session), **whether it
     left an after-commit hook for Phase 41's payee repoint on its List moves** (and its name), the
     **notification pool** (planned: the `Notification` record with `kind: 'listMoved'`, `route`,
     `cause` and a snapshot of date, session, hospital and surgeon; the one writer
     `postNotification(s, input)` in `src/store/notifications.ts`; `NOTIFICATION_POOL_RULE` and
     `notificationText` in `src/domain/notifications.ts`; `notificationPool`, the Admin pool card and
     page and its route, and how a row links to its List), the colleague's "Moved to you" notice and
     its selector (planned `movedToMe(state, anaesthetistId, todayISO)`, `MOVED_TO_ME_DAYS`), the shared
     move sheet `shared/flows/MoveListSheet.tsx`, `SCRIPTED_BEAT_SCHEDULE`, `anaesthetistActor`,
     `src/store/listMoveDemo.ts`, and the action labels it added. Phase 32's earlier plan held a
     `moveBookingToDoer` action and a "Move to the anaesthetist who did it" sheet; the 2026-10-03 plan
     moved both here. If 32 built them anyway, fold them into this phase's one action and one sheet
     (one path only), and record it. If 32 still calls a prepayment re-check on its moves, that is
     32's drift: record it for the owner, do not copy it.
   - **Phase 31:** `pairingIssues` (one hospital and one surgeon per List) and whether
     `reassignBooking` checks it for the office; `shared/scheduleTerms.ts` (the anaesthetist never
     sees "Draft List").
   - **Phase 29:** the Slot status master, `isOpenForBooking(status)` (which statuses count as
     available), `defaultSlotStatus`, and the calendar routes (`/mobile/availability/calendar`,
     `/web/availability/mine`) where the receiver sets a session available.
   - **Phase 28:** `Slot`, `List.slotId`, `slotFor(state, anaesthetistId, dateISO, session)`,
     `listInSlot`, the internal `placeListOnSlot` (does it commit, and which audit row it writes), the
     horizon, and whether `reassignBooking` moved out of `lifecycle.ts`.
   - **Phase 27:** `Booking.prepayment`, the prepayment invoice with its ledger pair and draft Xero
     pair (created at generation), and how a prepaid Procedure is priced at the prepaid amount and
     locked. Read only, for this phase's tests.
   - **Phase 25:** where the payee is fixed (the pricing snapshot reads the List's owner at authorise).
   - **Phase 17:** `src/apps/officePrivacy.test.ts` (the allowlist scan, the PWA closure check and the
     vocabulary check). No file this phase adds may need an allowlist entry.
   - **Phase 15b:** the List state `ACTIVE` (was DRAFT); `DRAFT` now means a Draft List with no
     anaesthetist.
   - **Phase 15a:** the warning routine (a moved Booking's warnings are derived, so nothing to write)
     and `SubmitListSheet`, which 15a left with no confirm step added.
   - Run `grep -rn "notOwnList\|reassignBooking\|moveBookingToDoer\|movedToDoer\|syncPrepayment" aa-prototype/src aa-prototype/visual`
     to see every caller and test of the guard this phase replaces, and every move path that still
     calls a prepayment re-check.
   - Read the current `PERSIST_VERSION` in `src/store/appStore.ts` (16 at `60e2d1e`, after Phase 15a
     session 1; later phases bump it) and bump it by one from whatever it is now.
8. Record the result (changed items, the OQ-85, OQ-80, OQ-79 and OQ-43 states, the names delivered by
   25 to 32) in the PROGRESS entry.

## Reference

**Design files (convention 17):**
- `docs/design/Mobile Availability.dc.html` is the layout reference for the mobile sheet: a bottom
  sheet with an avatar header, a short explanation, "Add a message", one teal action and the
  completion tick. Phase 32's `MoveListSheet` already follows it; this sheet is its sibling and should
  look like it.
- `docs/design/Mobile App.dc.html` screen 3 (the Booking detail and its action stack) is where the
  mobile entry point sits, below the procedures and above Cancel booking.
- `docs/design/Web Dashboard.dc.html` ("Who's free" rows: avatar, name, a short status line) is the
  reference for the receiver rows; on web the sheet is a dialog.
- `docs/design/Admin Day.dc.html` is the reference for the receiving List on the colleague's row and
  the attention line in the drawer.
- `docs/design/Design Language.dc.html` gives the tokens: neutral for a receiver who cannot be picked
  (never error red; being on leave is not an error), info or neutral for the honour-system line,
  success for the done state, the `sheet-in` and `complete-tick` motions, pills at radius 999, and
  the 4pt spacing.
- Teal is the only action colour. Crimson stays identity only (avatars).

**Catalogue:** the covered items above; `domain-model.md` ("Slot, List and Draft List": the
single-Booking sentence and "Whoever submits a List did its procedures"); [AR-22](../../../../requirements-board/requirements/artifacts/AR-22.md)
region `booking-editable` (the Booking is amended or moved until the List is submitted) and
[AR-04](../../../../requirements-board/requirements/artifacts/AR-04.md) region
`reassignment-difference` (the replacement anaesthetist wears the difference); the evidence notes
`requirements-board/requirements/notes/2026-10-02-aa-requirements-review-with-greg.md` items #3, #24,
#26, #50 and #76, `notes/2026-10-02-aa-meeting-with-greg.md` item #11, `notes/2026-10-06-aa-directors-meeting.md`
item #10 (the honour system and "no logic to detect any of these flows") and
`notes/2026-10-07-aa-client-meeting.md` items #19 and #36 (no warning on an anaesthetist's own
hand-over); the change log `changes/2026-10-07-requirements-update.md` (section 9, the directors'
run) and `changes/2026-10-07-list-lifecycle-states.md` (ACTIVE and DRAFT).

**Analysis:**
- `docs/prototype-build/catch-up/GAP-ANALYSIS.md`: theme 4 ("Slot, Draft List and List lifecycle",
  DM-42), the OQ-85 line under "Unsafe or provisional to build until answered", the DM-42 row, and
  the EP-01 table (FT-01.4, US-01.4.5, US-01.4.6, US-01.4.7; the EP-01 "Net" line notes US-01.4.6's
  AC3 against US-06.3.5);
- `epics/EP-01.md` (#ft-01.4, #us-01.4.5, #us-01.4.6, #us-01.4.7) and `epics/EP-06.md` (US-06.3.5,
  US-06.5.4: the re-grade notes that US-01.4.6's AC3 now conflicts with US-06.3.5, and that the
  prototype's lack of a re-check on a move is consistent with the newer rule);
- `analysis/domain-model-delta.md` (#dm-42, which now holds DM-06; DM-41 for the pool, DM-05 for the
  List move, DM-54 for the private preferences);
- `analysis/prototype-map-store-seed.md`, `prototype-map-shared.md`,
  `prototype-map-apps-mobile-web.md`, `prototype-map-admin.md` and `prototype-map-shell-demo-pwa.md`.

**Code entry points (as at `60e2d1e`, after Phases 14, 15 and 15a session 1; Phases 15b to 32 will
have moved some, so find each by name):**
- `aa-prototype/src/store/lifecycle.ts`: `reassignBooking` (:635). Its anaesthetist branch
  (:654-663) refuses `notOwnList` when either List is not the actor's and `listSubmitted` unless both
  are in the editable state (`'DRAFT'` at `60e2d1e`, `'ACTIVE'` after 15b). It writes one
  `booking.reassign` meta and self-commits through `mutate`. Phase 28 may have moved it to
  `store/slotActions.ts`.
- `aa-prototype/src/apps/admin/flows/MoveBookingFlow.tsx`: the office's move (target day, then any
  non-authorised List, with an advisory pairing mismatch). It stays.
- `aa-prototype/src/shared/booking/BookingDetailBody.tsx`: the `actions` block (:643-664: "Copy
  booking", which Phase 15b removes, and "Cancel booking"), shared by mobile
  (`apps/mobile/screens/BookingDetailScreen.tsx`), web (`apps/web/screens/BookingDetailView.tsx`)
  and Admin. Its `canEdit` gate (:313) and the actor prop decide who sees what.
- Routes: mobile `/mobile/lists/:listId/bookings/:bookingId` (`apps/mobile/routes.tsx`, which
  redirects to `/mobile/lists` when the List is missing, :58); web
  `/web/lists/:listId/bookings/:bookingId` (`apps/web/routes.tsx`); Admin
  `/admin/day/:dateISO/bookings/:bookingId`.
- `aa-prototype/src/shared/flows/SubmitListSheet.tsx`: the `confirm` mode's body ("Submitting sends
  every booking on this list to the office ...", :108-112). Phase 15a left it as it is.
- `aa-prototype/src/store/mutate.ts` (`mutate`, `refuse`, `ok`, `clockISO`, `ID_FORMATS`),
  `aa-prototype/src/store/selectors.ts` (`bookingsForList`, `auditForEntity`, the payee derived from
  the List's owner, `anaesthetistIdForCase` :611), `aa-prototype/src/store/xeroHandoff.ts` (the
  ACCPAY payee read from the List at handoff, :166-202), `aa-prototype/src/store/prepaymentActions.ts`
  (today's prepayment pair, with the payee fixed to the original anaesthetist; Phase 27 rebuilds it).
- `aa-prototype/src/store/demoActors.ts` (`OFFICE_ACTOR`, `SOUTER_ACTOR`, and 32's
  `anaesthetistActor`), `aa-prototype/src/shared/demoTriggers/registry.ts` (`MOBILE_LISTS`, :54) and
  `types.ts` (`DemoTrigger` with `routes`, `surfaces`, `badge: 'office-stand-in'`, `when`,
  `choices`, `defaultChoice`, `disabledReason`, `run`, `indexPath`), `aa-prototype/src/pwa/PwaDemoActions.tsx`.
- Audit reading layer: `shared/audit/actionLabels.ts`, `shared/audit/fieldLabels.ts`,
  `shared/audit/auditNarrative.ts` (pure, ids shown raw).
- Tests that pin the old guard: `store/lifecycle.test.ts` (:558, the anaesthetist `notOwnList` case
  for `reassignBooking`), plus `captureActions.test.ts`, `phase06Actions.test.ts` and
  `attachmentActions.test.ts`, which use `notOwnList` for other actions and must not change.
- `aa-prototype/src/domain/seed/index.ts` and `seed.test.ts`, `store/persistMigrate.test.ts`,
  `pwa/pwaPurity.test.ts`, Phase 17's `apps/officePrivacy.test.ts`, `visual/pwa-device.spec.ts`.

## Work items

1. **Rule constant and types** (`src/domain/bookingMoves.ts`, new, beside 32's `listMoves.ts`; no
   React, PWA-safe; `src/domain` imports neither `src/store` nor `src/shared`, and this file never
   imports `domain/pairingPreferences.ts`):
   - `SINGLE_BOOKING_MOVE_RULE = { search: 'byAnaesthetist', availableOnly: true,
     createListIfNone: true, notifyPool: true }`, with a doc comment naming OQ-85 as open, listing
     what each flag switches, and saying that its part 4 (a warning) is settled by OQ-43: none. This is
     the one switch point. There is no `pairingPrompt` flag.
   - `type BookingMoveOffer = { kind: 'existingList'; slotId; listId } | { kind: 'newList'; slotId }`.
   - `type BookingMoveBlock = 'notAvailable' | 'listLocked' | 'differentList' | 'noSlot' | 'noList'`
     (the last only when `createListIfNone` is false).
2. **Pure helpers** (same file; Vitest in `src/domain/bookingMoves.test.ts`). They take domain-typed
   inputs (the schedule's `lists`, `slots` and `bookings`, the anaesthetist, hospital and surgeon
   masters, the Slot status master, `todayISO`), never `AppState` and never the office-only
   preference or tier slice, and use master-record names as they are ("Dr Rawiri Hughes"), never
   `shared/format.ts`.
   - **`bookingMoveRefusal(input, bookingId, actorAnaesthetistId, todayISO)`** returns `null` or
     `{ code, message }`, plain English, no dashes. It checks the Booking itself (`notFound`,
     `cancelled`) and then calls Phase 32's `ownMoveRefusal` on the Booking's List for the List-level
     codes, rewording each message for a Booking subject, so ownership, state and date are judged by
     one rule:
     - `notFound`; `cancelled` ("This Booking is cancelled.");
     - `notOwnList` ("You can only move Bookings from your own Lists."). A Booking on a Draft List
       (DRAFT, no anaesthetist) falls here: the anaesthetist never owns one, and never sees the words
       "Draft List";
     - `listSubmitted` ("This List has been submitted. Only the office can move its Bookings now.");
     - `listAuthorised`;
     - `pastDate` ("This List's day has passed. Ask the office to move it."). The move is made before
       the procedure (US-01.4.6, AR-22 `booking-editable`); a correction after the day is the office's
       `MoveBookingFlow`.
   - **`bookingMoveReceivers(input, bookingId, moverId, query)`** returns every **active**
     anaesthetist except the mover whose display name matches `query` (case-insensitive, on the full
     name and on the surname; an empty query matches everyone), **sorted by display name only**, each
     as `{ anaesthetistId, name, offer: BookingMoveOffer | null, block?: BookingMoveBlock, line }`.
     Nothing is grouped, ordered or marked by a pairing preference or a priority tier (US-01.4.5
     "Availability only", US-01.3.6 tiers admin only). The rule, for the receiver's Slot on the
     Booking's date and session (Phase 28's `slotFor`):
     - **no Slot** (outside the horizon, or before their start date): `noSlot`;
     - **the Slot's status is not available** (`!isOpenForBooking(status)`, from Phase 29's master:
       on leave, unavailable, a holiday): `notAvailable`, line "Not available this session. They can
       set it available in their app, then you can move it." This is US-01.4.7 AC2: never offered;
     - **the Slot holds a List:**
       - not ACTIVE: `listLocked` ("Their List for this session is already submitted");
       - ACTIVE, but with a different hospital or surgeon from the Booking's List: `differentList`
         ("Has a List at {hospital} this session"). A Booking takes its List's hospital and surgeon,
         so joining it would break Phase 31's pairing rule (US-01.3.1). Use `pairingIssues` or the
         same comparison 31 uses, not a second rule;
       - ACTIVE with the same hospital and surgeon: offered, `existingList`, line "Joins their {AM}
         List at {hospital}";
     - **the Slot is available and holds no List:** offered, `newList`, line "Free this session. A
       List is created for it" (or `noList` when `createListIfNone` is false).
     The receive predicate is written once: if Phase 32's `listMoves.ts` already holds "is this Slot
     open and empty for a colleague", call it rather than re-deriving it.
   - **`offeredReceivers(...)`**, the same rows filtered to `offer !== null`, which the sheet shows
     before anything is typed. Unavailable colleagues appear only when searched for by name, and then
     as rows that cannot be picked, so the presenter can show AC2.
   - **`bookingPlacement(input, bookingId, toAnaesthetistId)`** returns the one receiver row's offer
     or its block. The store action calls it; there is no second placement rule.
   - Tests: each refusal code (including a Booking on a Draft List); each block and offer on
     hand-built fixtures (no Slot, on leave, unavailable, holiday, SUBMITTED List, different hospital,
     different surgeon, same pairing, empty available Slot, inactive anaesthetist excluded, the mover
     excluded); the name search (full name, surname, case, no match); the `createListIfNone: false`
     variant; sort order by name only; no row text contains an en or em dash; the input type has no
     preference or tier field.
3. **No preference warning, nothing revealed** (US-01.4.5, D44, OQ-43 answered; replaces the earlier
   plan's Booking-subject prompt). There is no prompt helper to extend. The helpers, the sheet, the
   store action and the trigger bodies import nothing from `domain/pairingPreferences.ts` or
   `store/officePrivate.ts`, write no pairing acknowledgement, and add no allowlist entry to Phase 17's
   `officePrivacy.test.ts`, which must pass unchanged. Phase 17's vocabulary check ("blacklist",
   "whitelist") passes too. A store test (work item 5) moves a Booking to a receiver who has a
   not-preferred pairing with the Booking's surgeon (either way round) and asserts the move goes ahead
   as any other, with the same audit rows as a clean move.
4. **Seed and seed tests** (`src/domain/seed/index.ts`, `seed.test.ts`). The move must be demoable
   through normal use:
   - **A movable Souter Booking, not scripted:** on the pristine seed at `DEMO_TODAY`, Dr Souter has an
     ACTIVE List in the next six days that is not in `SCRIPTED_BEAT_SCHEDULE`, holding a non-cancelled
     Booking whose `offeredReceivers` includes at least one `newList` offer, and whose session has at
     least one active colleague who is **not available** (on leave or unavailable). Pin the Booking,
     the offered colleague and the unavailable colleague in a comment; the demo guide names them. It
     is not on the List Phase 32 pinned for S2 Beat 3b, so Beats 3b and 3c run one after the other
     from a single reset.
   - **The no-warning check has a case, without touching the preference seed:** if an offered receiver
     of some movable Souter Booking already has a not-preferred pairing with that Booking's surgeon in
     Phase 17's seed (or the pairing Phase 32 pinned for its own no-warning check fits), pin it for the
     checklist; otherwise the store test's fixture covers it and the checklist says so. Never change
     the preference seed or the Lists to make one.
   - **The PWA stand-in has a candidate:** some colleague's ACTIVE List in the next six days, not
     scripted, holds a non-cancelled Booking for which Dr Souter is an offered receiver.
   - **The acceptance beat is reachable:** some colleague Booking in the next six days, not scripted,
     falls in a session where Dr Souter is **not** available, so that setting the session available
     in her calendar makes her a receiver (and the stand-in offers it).
   - **A prepaid Booking for the honour-system check:** name, in a comment, a Souter Booking that
     Phase 27's seed leaves with a prepayment invoice (S4 Beat 1's Annette Riley, if 27 kept her) and
     whether a colleague is offered in its session. Add nothing for it.
   - If the canvas already gives these, add no seed records. If not, add the fewest: a Booking on a
     non-scripted List through the seed's existing Booking builder, appended after every existing id,
     or a leave status on one non-scripted colleague Slot through Phase 29's availability seed. Draw
     nothing from the seeded RNG, and do not touch the canvas generator. The golden or parity tests
     that guard S1 to S5 must pass unchanged.
   - **Extend `SCRIPTED_BEAT_SCHEDULE`** (Phase 32 left it for 32a to extend) with the Beat 3c List and
     the receiving colleague's session once they are pinned (they are chosen from what was not
     scripted before this phase), so neither Phase 32's triggers nor this phase's pick them. The
     stand-in and acceptance-beat candidates stay unscripted, because the triggers use them.
   - **Bump `PERSIST_VERSION` by one** (the seed or the pool's kind union changes). Extend
     `persistMigrate.test.ts` so a blob from before the bump reseeds cleanly.
5. **The store action** (`src/store/listMoveActions.ts`, beside 32's actions, exported from
   `src/store/index.ts`):
   - **`moveBookingToAnaesthetist(api, actor, bookingId, toAnaesthetistId, { message? })`**
     (US-01.4.7; US-01.4.6; DM-42):
     - anaesthetist actor only (`ownerOnly` otherwise: the office has `MoveBookingFlow`);
       `bookingMoveRefusal` must be null; `bookingPlacement` must be an offer, or the action refuses
       with the block's code and line (`notAvailable` reads "Dr X is not available this session. They
       need to set it available first.");
     - **one `mutate()` commit**, timestamps from `clockISO(s.clock)`:
       - for `newList`, create the List in the receiver's Slot through **Phase 28's internal
         `placeListOnSlot`** (no second List maker), copying the source List's hospital, surgeon and
         kind (the pattern 28 and 31 kept), so the pairing rule holds by construction. The new List
         is ACTIVE and owned by the receiver;
       - move the Booking through **`reassignBooking`'s core**. If `reassignBooking` self-commits, split
         a draft-level `reassignBookingCore(s, bookingId, toListId)` out of it with no actor guards,
         called by `reassignBooking` and by this action. The office's and the integration's
         `reassignBooking` tests pass unchanged;
       - audit: one `booking.movedToAnaesthetist` meta on the Booking, `before: { listId,
         anaesthetistId }`, `after: { listId, anaesthetistId, createdListId?, message?,
         notificationId? }`, and **not** a second `booking.reassign`. If a List was created, its
         creation is recorded in the same commit the way `placeListOnSlot` records it. No pairing
         acknowledgement is written (work item 3);
       - if `SINGLE_BOOKING_MOVE_RULE.notifyPool`, post one row to **Phase 32's notification pool**
         through its one writer (planned `postNotification(s, input)`), inside the same commit. The
         `Notification` kind union gains `'bookingMoved'`, with `bookingId` and `createdList` added to
         the record (`listId` is the receiving List, `route: 'colleague'`, `cause: 'move'`, both
         anaesthetists and the same date, session, hospital and surgeon snapshot), and
         `NOTIFICATION_POOL_RULE.sources` gains `'bookingMoved'` (OQ-85's recommendation beside OQ-79's
         "List moves only"; its doc comment says so). The row carries no preference flag, as 32's List
         rows carry none. `notificationText` gains the Booking sentence: "Dr Souter moved a Booking
         (Riley, A., Thu 23 Jul AM, St George's) to Dr Hughes", plus "A new List was created" when it
         was, and the message if one was typed. The row links to the Admin Booking detail. The move's
         meta carries `after.notificationId`, as 32's do. Phase 35 adds the update email to it;
     - the source List stays, even if it is now empty: moving its last Booking does not move or
       withdraw the List (that is Phase 32's whole-List move);
     - **the payable follows the Booking, with no recalculation** (US-01.4.6 AC2, DM-42). The payee is
       derived from the List's owner until Phase 25's snapshot fixes it at authorise, so no payee field
       is written and no price is touched;
     - **no prepayment logic** (US-06.3.5 AC2, US-06.5.4, D20): the action never calls Phase 27's
       re-check, never reads or writes `Booking.prepayment`, a prepayment invoice, a ledger pair or a
       Xero record, and raises nothing;
     - after commit, the **one named hook for Phase 41**: if Phase 32 left an after-commit move hook
       for its List moves, call it once with `([bookingId], 'bookingMoved')`; if it left none, add
       `afterAnaesthetistMove(api, bookingIds, cause)` in `listMoveActions.ts`, empty, call it from
       this action and from 32's List moves (one place for 41), and record that in the PROGRESS entry.
       One doc comment on it names D38 and OQ-80 (when the pair is amended: on a move before the
       procedure, the payable's payee only, Phase 41's `repointPrepaymentPayable`), D20 (nothing is
       recalculated) and that until 41 lands a moved prepaid Booking's pair keeps its original payee;
     - returns `ok({ listId, createdListId? })`, which the sheet shows.
   - **Replace the old guard** (`reassignBooking`'s anaesthetist branch): an anaesthetist's move to a
     colleague now has one path. The branch keeps the code `notOwnList` for a target List the actor
     does not own (its tests and the other actions' `notOwnList` stay), but the message becomes "To
     hand a Booking to a colleague, use Move to a colleague." Moves between the actor's own ACTIVE
     Lists are unchanged.
   - Tests (`store/listMoveActions.test.ts`, extended):
     - every refusal: the office actor; another anaesthetist's Booking; a cancelled Booking; a Booking
       on a Draft List, a SUBMITTED List and a past day; each receiver block, including a receiver on
       leave (AC2) and a receiver whose List has a different hospital;
     - **US-01.4.7 AC1 and US-01.4.6 AC1:** onto the receiver's existing List, and into a new List in
       the receiver's empty available Slot (a one-Booking List with the source's hospital, surgeon
       and kind); the source List no longer holds it and still exists;
     - **AC2 for a receiver on leave:** refused before; after the receiver sets that session available
       (Phase 29's action, as the receiver), the same call succeeds;
     - **US-01.4.6 AC2:** after the move and the receiver's List is authorised, the payable (Phase 25's
       snapshot, or the billing run) is to the receiver, and the Procedure's price is what it was
       before the move (no recalculation);
     - **US-06.3.5 AC2 and US-06.5.4 AC1 (the honour system):** on a Booking with a sent prepayment
       invoice, `Booking.prepayment`, its invoices, its ledger pair and its Xero records are deep-equal
       before and after the move; no invoice is raised; no prepayment audit row is written; Phase 27's
       re-check is not called (spy); after authorise the prepaid Procedure is still priced at the
       prepaid amount, locked, and its payable is to the receiver for that amount (US-06.5.4 AC3).
       One assertion pins that the pair's payable payee is still the original
       anaesthetist, with a comment that Phase 41 flips it when it fills the hook;
     - **US-01.4.6 AC3** is read through US-06.3.5 (the newer rule): the test above is its test, and
       the contradiction goes on the owner's review list;
     - **no warning (US-01.4.5, D44):** a receiver with a not-preferred pairing with the surgeon, either
       way round, is offered in its name order and the move succeeds with exactly the audit rows of a
       clean move;
     - the hook runs exactly once per move with `'bookingMoved'`;
     - one commit, one `booking.movedToAnaesthetist`, no `booking.reassign`; exactly one pool row (none
       with `notifyPool` false), read back through `notificationPool` with both anaesthetists named,
       and still never on 15a's to-do selector;
     - the replaced guard: `reassignBooking` by an anaesthetist to a colleague's List still refuses
       `notOwnList`, with the new message;
     - determinism: the same calls on the same seed give identical ids and state.
6. **Audit and notice reading layer.**
   - `shared/audit/actionLabels.ts`: "Booking moved to a colleague by its anaesthetist"
     (`booking.movedToAnaesthetist`). `fieldLabels.ts`: `createdListId` ("New List") and `message`
     ("Message") if Phase 32 did not add them. `auditNarrative.ts` stays pure.
   - **The receiver's notice.** Extend Phase 32's "Moved to you" selector (planned
     `movedToMe(state, anaesthetistId, todayISO)`) with single-Booking rows, read from the same
     notification records 32's rows read (`kind: 'bookingMoved'`, `toAnaesthetistId` the persona):
     "Dr Souter moved a Booking to you: Thu 23 Jul AM, St George's". Same window
     (`MOVED_TO_ME_DAYS`), same panel, no new store. Tapping the row opens the Booking on the
     receiving List. Nothing in it hints at a preference.
   - **The pool row** renders through Phase 32's pool screen with the new kind's label; if 32 keys
     its row component by kind, add the case there. The pool is Admin only.
7. **The move sheet** (`shared/flows/MoveBookingToColleagueSheet.tsx`, through
   `useSurface().Overlay`, so a bottom sheet on mobile and a dialog on web, convention 16; it imports
   nothing from `apps/*`, `shell`, `domain/pairingPreferences.ts` or `store/officePrivate.ts`):
   - **Header:** the Booking as it is now: patient, its primary procedure, and "Thu 23 Jul · AM · St
     George's · Mr T. Hale".
   - **Find a colleague:** a search field, "Search anaesthetists", over `bookingMoveReceivers`. Before
     anything is typed, the rows are `offeredReceivers` under the heading "Available this session",
     in name order. Each row: avatar, full name and its `line`. Offered rows are tappable; a blocked
     row is shown in neutral with its line and is not a button (`aria-disabled`, no hover). An empty
     result reads "No anaesthetist matches". The OQ-85 provisional caption sits under the field, once.
   - **Confirm:** the receiver's avatar and name, then:
     - where it lands, from the offer: "Joins Dr Hughes's Thu 23 Jul AM List at St George's" or "A new
       List is created in Dr Hughes's Thu 23 Jul AM session at St George's";
     - "Dr Hughes is paid for it." and, only when the Booking is prepaid, the honour-system line "This
       Booking is prepaid. The prepaid amount stays as agreed, and Dr Hughes claims no more than
       that." (D20, US-06.5.4; never "estimate" or "deposit"; no provisional hint);
     - "Add a message" (optional) for the office and the colleague, stored on the meta;
     - the teal button **Move Booking**, and a secondary **Back**. No warning, no "anyway" variant.
   - **Done:** the completion tick and "Moved to Dr Hughes. The office has been told." Then **Back to
     your List**, which closes the sheet and returns to the source List (the Booking is no longer on
     it, so the Booking route must not be left open on a List the persona no longer owns). Refusals
     show inline in the error tint.
   - **Keep the sheet mounted through the commit.** Once the move commits, `bookingMoveRefusal` for the
     Booking is `notOwnList`, so the entry point disappears. Hold the sheet's open state and render it
     outside the gated actions block (or pass the outcome down), so the done state is not unmounted
     the moment the store changes. A component test covers it.
   - No "slot" and no "Draft List" in any of this copy; no en or em dashes.
8. **Entry points** (US-01.4.7 "In their app"):
   - `BookingDetailBody`'s actions block, on mobile and web, for an **anaesthetist actor** when
     `bookingMoveRefusal` is null: a secondary **Move to a colleague** button above Cancel booking,
     with one line under it: "Hand this Booking to a colleague. If someone else is doing it, move it
     to them before the procedure." The button does not show for the office (Admin keeps its Move in
     the List drawer) or where the Booking cannot move.
   - Mobile and web route handling after the move (work item 7's Back to your List): mobile
     `navigate('/mobile/lists/<sourceListId>', { replace: true })`, web
     `/web/lists/<sourceListId>`. Check the mobile route's `listMissing` redirect does not fire first.
   - **The doer sentence** (US-01.4.6): `SubmitListSheet`'s confirm body gains one sentence: "Submitting
     says you did every procedure on this List. If a colleague is doing one, move it to them first."
     It adds no step and no warnings section (15a's "no confirm step at submit" holds). If Phase 32
     already added a sentence like it, keep one.
9. **The colleague's and the office's side:**
   - a. The receiver's "Moved to you" panel (Phase 32, mobile and web) shows the single-Booking row;
     the new List, when one was created, appears on their Lists like any other.
   - b. The received Booking's detail shows "Moved to you by Dr Souter on Tue 21 Jul" for the
     notice window (cut this first if the session runs long).
   - c. Admin Day: the receiving List shows on the colleague's row (a created List is an ordinary
     ACTIVE List); its drawer's attention area gains "Booking moved here by Dr Souter, Tue 21 Jul 09:12"
     beside 32's List-move line; the Booking's History shows the new action label.
   - d. The pool row (work item 6). No badge, no queue, nothing to approve.
10. **Demo triggers** (registry entries; see the next section): bodies in `src/store/listMoveDemo.ts`
    beside 32's, so the registry stays thin and the PWA closure stays pure:
    `stageColleagueBookingMove(api, personaId, { dateISO?, choiceId? })`, which acts as the
    colleague through `anaesthetistActor` and calls `moveBookingToAnaesthetist`, so the audit and the
    pool row read truthfully. It never sets anyone's availability: if Dr Souter is not available in
    a candidate's session, that candidate is not offered. Candidates are deterministic (date, then
    session, then Booking id), non-cancelled, on a colleague's ACTIVE List dated today or later, not in
    `SCRIPTED_BEAT_SCHEDULE`, and only where `bookingPlacement` offers Dr Souter. Tests in
    `demoTriggers.test.ts`: ids unique with no dash other than the hyphen; the Admin entry shows for
    `'bar'` on `/admin/day/:dateISO` and never for `'pwa'`; the stand-in shows for `'pwa'` on the
    mobile Lists routes and never for `'bar'`; each run makes exactly one move; the choices update
    when Dr Souter sets a session available; the disabled reasons fire when nothing fits.
11. **Playwright and hooks** (`npm run shots`):
    - new `visual/booking-moves-phase32a.spec.ts` with `data-shot` hooks for: the Booking's Move to a
      colleague button (`move-booking-action`), the sheet's search step with an unavailable row
      searched for (`move-booking-sheet`, `move-booking-receiver`, `move-booking-unavailable`), the
      confirm step with the landing and payable lines (`move-booking-confirm`) and, on a prepaid
      Booking, the honour-system line (`move-booking-honour`), the done state (`move-booking-done`), the
      Admin pool row after the bar trigger, and Admin Day with the new List on the colleague's row;
    - the submit confirm sentence (`submit-doer-note`);
    - `visual/pwa-device.spec.ts`: on mobile Lists, open the Demo chip, run **Colleague moves a
      Booking to me**, and assert the Moved to you row and the Booking on Dr Souter's List. Then, as
      Souter, move the pinned Booking to the pinned colleague and assert it has left her List.
    The recipes, the capture run and the ATLAS edits are the standing step in "Catalogue screenshots",
    after the review pass.
12. **Finish green:** `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots`, then
    the Catalogue screenshots step and `npm run verify:board`. `pwaPurity.test.ts` and Phase 17's
    `officePrivacy.test.ts` pass with no new allowlist entry: the sheet, helpers and trigger bodies
    import nothing from `apps/admin`, `apps/demo`, `shell` or the office-only preference slice.

## Demo triggers

The move itself is normal mobile and web use, and nothing waits on the office (D7). Two things still
need a button, because the anaesthetist apps run only as Dr Souter: the office's side of a colleague's
move, and the receiving side on the handset. Register both in Phase 14's registry; add nothing to the
Control Panel page, which lists them under their screens.

| id | Label | Screen (routes) | Surfaces | Effect | Disabled when |
|---|---|---|---|---|---|
| (product, not registered) | Move to a colleague | Mobile · Booking (`/mobile/lists/:listId/bookings/:bookingId`), Web · Booking (`/web/lists/:listId/bookings/:bookingId`) | product UI | Work items 7 and 8. A real user action, so it stays in the product. | not shown when `bookingMoveRefusal` is not null |
| `colleague-hands-booking-to-souter` | Colleague hands a Booking to Dr Souter | Admin · Day (`/admin/day/:dateISO`) | bar | `stageColleagueBookingMove` for Dr Souter on the date in the URL, or the next date with a candidate. A colleague moves one of their Bookings to her; the pool row and the moved Booking (on her List, created if needed) show without switching persona. Message filled from the move: "Dr Hughes moved a Booking (Thu 23 Jul AM, St George's) to Dr Souter. A new List was created." | no candidate ("No colleague Booking fits a session Dr Souter is available in") |
| `colleague-moves-booking-to-me` | Colleague moves a Booking to me | Mobile · Lists (`MOBILE_LISTS`) | pwa | Phase 14's stand-in badge. `choices` lists the candidates ("Dr Hughes · Thu 23 Jul AM · St George's"), earliest first. Running one moves it to Dr Souter as that colleague: the Booking appears on her List (created if needed) with the Moved to you notice. A session she is not available in is not offered until she sets it available in My calendar, which is the acceptance beat. | no candidate ("No colleague Booking fits a session you are available in. Set a session available first.") |

There are no office stand-ins: nothing in this phase waits for the office.

## Out of scope

- **Greg's favour List** (a one-Booking List nobody else may add to, and a status for "I've got a
  Booking but I'm still not available"): not built now (US-01.4.7 note, point #50).
- **Moving a whole List**, returning it to the office, and the vacated session (OQ-84): Phase 32.
- **Changes to the office's `MoveBookingFlow`.** It stays the office's path, including a correction
  after the day and a move onto a SUBMITTED List. The office's soft not-preferred warning on its own
  moves is Phase 17's helper, unchanged here.
- **An anaesthetist moving a past day's Booking**, or one on a submitted List: the office's.
- **Moving several Bookings at once**, or pulling a Booking from a colleague (the receiver starting the
  move): not in the catalogue.
- **Any preference warning, prompt, grouping or tier order** on the anaesthetist's move (D44,
  US-01.4.5), and any acknowledgement record for it.
- **A prepayment re-check or recalculation on a move** (US-06.3.5, US-06.5.4, D20): none, by any path.
- **Repointing the payable half of a moved prepaid Booking's pair**, the trust account and refunds
  (US-06.5.4 AC2, FT-06.5, D38): Phase 41, through this phase's hook.
- **The update email** after the move (US-02.3.3, D19, manual only per OQ-82): Phase 35, from the
  pool row.
- **Silently setting anyone available.** Only the receiver's own action does it; no trigger does.
- **A real notification channel** (push, SMS, email).

## Manual test checklist

The agent runs every item itself in the running app and reports it with evidence; none is handed
to the owner (ROADMAP.md "Owner review: agents test themselves").

- [ ] Reset. Web, as Dr Souter, open the pinned Booking: **Move to a colleague** shows with its line.
  It does not show on a SUBMITTED List, a past day's List, a cancelled Booking, or in Admin.
- [ ] The sheet opens on "Available this session" with only offered colleagues, in name order. Type
  the pinned unavailable colleague's surname: the row shows, neutral, "Not available this session.
  They can set it available in their app, then you can move it.", and cannot be picked. The OQ-85
  caption shows once. Nothing says "slot".
- [ ] Pick the pinned clean colleague: the landing line reads "A new List is created in Dr ...'s ...
  session at ...", "Dr ... is paid for it." shows, and there is no warning or "anyway" button. If a
  not-preferred pairing was pinned (work item 4), pick that colleague too: the confirm step is
  identical, with no warning; otherwise say so and cite the store test.
- [ ] Move Booking: the tick and "Moved to Dr ... The office has been told." show at once. Back to
  your List: the Booking has left Souter's List, which still exists.
- [ ] Admin Day on that date: a new ACTIVE List on the colleague's row, same hospital and surgeon,
  holding the Booking; its drawer reads "Booking moved here by Dr Souter"; the Booking's History
  shows "Booking moved to a colleague by its anaesthetist" and no pairing acknowledgement anywhere.
  The pool shows the row, and it is not on the to-do list.
- [ ] Mobile, the same flow from the Booking sheet as a bottom sheet, onto a colleague who already has
  a matching List in that session if the seed has one (otherwise skip and say so; the unit test
  covers it).
- [ ] The pinned prepaid Booking (S4 Beat 1's Annette Riley, if Phase 27 kept her): the confirm step
  shows the honour-system line, never "estimate" or "deposit". Move it if a colleague is offered in
  its session: its prepayment, invoice and amount in Admin are unchanged and no invoice is raised.
  Reset afterwards. If no colleague is offered there, say so and cite the store test; never set a
  colleague available to make the beat work.
- [ ] Submit a Souter List: the submit sheet carries the "you did every procedure" sentence and adds
  no step.
- [ ] Admin Day, Demo actions, **Colleague hands a Booking to Dr Souter**: the pool row and the moved
  Booking on Souter's row show. Switch to the mobile app: Souter's Moved to you panel shows it.
- [ ] PWA (`npm run build:pwa` and preview), mobile Lists: the Demo chip offers **Colleague moves a
  Booking to me** with its badge and choices. Pick the pinned acceptance session: it is not offered.
  Set that session available in My calendar, reopen the chip: it is offered, and running it puts the
  Booking on Souter's List with the notice.
- [ ] The Control Panel lists the Admin trigger under Admin · Day with an Open screen link, and the
  stand-in as "Shown in the installed PWA".
- [ ] S1 to S5 run unchanged from a reset, including S2's Beat 3 reassignment and Phase 32's Beat 3b.
- [ ] No en or em dash in any new copy; teal is the only action colour; no crimson on any new
  control, row or notice; the anaesthetist apps show no preference, tier or "blacklist" word.
- [ ] Catalogue screenshots: the recipes for US-01.4.7 and US-01.4.6 are created or updated, any
  recipe this phase broke is re-pointed, a full `npm run capture` ends with no failed recipe and no
  story without a recipe, the covered items' new shots are checked by eye, and `npm run verify:board`
  is green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots` and `npm run
  verify:board` are all green.

## Demo guide updates

Patch these in the same session (ROADMAP rule). This is a **milestone** phase ("After 32a: ...
anaesthetists returning or handing on their own Lists ... and moving single Bookings, and the office's
shared notification pool. S2 is re-scripted"):
- `docs/demo-guide/03-demo-script.md`, **S2**: add **Beat 3c, "she hands one Booking to a
  colleague"**, after Phase 32's Beat 3b.
  - **Click:** Web, as Dr Souter, the pinned Booking → Move to a colleague → search the pinned
    unavailable colleague (not offered) → pick the pinned clean colleague → Move Booking. Then Admin
    Day on that date: the new List on the colleague's row, and the pool row. Optional: Admin Day,
    Demo actions, Colleague hands a Booking to Dr Souter.
  - **Say:** "Sometimes it is one case, not the whole List. She finds the colleague by name and hands
    it on, straight away, with no pop-ups: who works with whom is the office's business, not hers.
    Someone on leave is not offered until they mark themselves available, which is how they say yes.
    Whoever does a Booking is the one paid for it. If it was prepaid, the amount stays as agreed: the
    colleague claims no more, and nothing is recalculated."
  - **Expected:** the done state, the Booking on the colleague's List, and the pool row.
- **S2 Discovery points:** add OQ-85 (how a single Booking is moved) and OQ-80 (whether the
  prepayment's payable follows a move); OQ-43 is answered (no warning on an anaesthetist's own move),
  so remove it from the S2 open points if Phase 32 left it there.
- `docs/demo-guide/02-workflows-and-handoffs.md`, **Workflow 3**: add the single-Booking path and the
  doer rule ("a Booking someone else does moves to their List before the procedure"; "a prepaid
  Booking keeps its agreed amount, on trust"); the readiness row gains "single-Booking moves, Phase
  32a".
- `docs/demo-guide/01-personas-and-responsibilities.md`: the anaesthetist gains "hand one Booking to a
  colleague who is available".
- `docs/demo-guide/04-presenter-cheat-sheet.md`: one line for the single-Booking move and its two
  triggers; RFP ambiguity 5 (cover) gains the Booking-level move. Any line that says a move re-checks
  a prepayment, or that the anaesthetist sees a pairing prompt, goes.
- `docs/demo-guide/master-demo-guide.html`: mirror every edit above.
- **Control Panel scenario text** (`apps/demo/DemoControlPanel.tsx`, S2): the message adds "then hand
  one Booking to a colleague from its Booking screen".
- **Milestone consistency read:** read `master-demo-guide.html` end to end against the run sheet and
  the cheat sheet, and fix any drift the Schedule track (28 to 32a) left, not only this phase's:
  in particular any "blacklist" wording, any anaesthetist-side pairing prompt, any "re-check on a move"
  narration, and any "DRAFT" for an assigned List.

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19),
run after the review pass and before the PROGRESS.md entry. Re-run
`node docs/prototype-build/catch-up/tools/recipe-status.mjs 32a` first: earlier phases (28 to 32)
will have changed these recipes since this plan was written. Work item 11 only adds the Playwright
spec and the `data-shot` hooks. The plan update itself never touches recipes or images.

**Covered items.** When the phase is done, each recipe in `requirements-board/capture/recipes/`
matches what was built:

| Item | Recipe at plan time | When this phase is done |
|---|---|---|
| [US-01.4.7](../../../../requirements-board/requirements/stories/US-01.4.7.md) Anaesthetist moves a single Booking | none (create it; Phase 32 may have added an absent stub naming 32a) | create, status captured. Shot `move-booking` on web (`/web/lists/<pinned List>/bookings/<pinned Booking>`) and mobile (the Booking sheet), states `action` (the Move to a colleague button, highlighted), `search` (the sheet with the unavailable colleague searched for, highlight the sheet), `confirm` (the landing and payable lines, no warning) and `done`. Add an admin state on `/admin/day/<date>` after the `Colleague hands a Booking to Dr Souter` trigger, highlighting the pool row or the new List. Caption in the catalogue's words: "Move a single Booking to a colleague found by name; someone unavailable is not offered until they set themselves available". Empty `absentReason` |
| [US-01.4.6](../../../../requirements-board/requirements/stories/US-01.4.6.md) The List's anaesthetist did its procedures | absent ("Not built yet: catch-up Phase 32 builds this."; Phase 32 rewords it to 32a) | captured. Shot `doer-rule`: web and mobile state `submit` (the submit sheet with the "you did every procedure" sentence, highlighted), and an admin state `after` (Admin Day on the trigger's date after a `trigger` step runs `Colleague hands a Booking to Dr Souter`, the receiving List's drawer open, highlighting the moved Booking's row). Caption: "Whoever submits a List did its procedures: a Booking a colleague does moves to their List, and its payable follows with nothing recalculated". It must not say the prepayment is re-checked. Empty `absentReason` |
| [US-01.4.1](../../../../requirements-board/requirements/stories/US-01.4.1.md) Reassign a List with its bookings | partial · `admin-reassign` | Phase 28 owns it; no change expected. Check the admin Reassign still opens on the same List after this phase's seed changes |
| [US-01.4.2](../../../../requirements-board/requirements/stories/US-01.4.2.md) Availability finder | captured · `admin-availability-finder`, `web-availability-finder`, `mobile-availability-finder` | Phase 29 owns it; no change expected. If work item 4 added a leave status on a colleague Slot, check the finder shots still show what their captions say |
| [US-01.4.3](../../../../requirements-board/requirements/stories/US-01.4.3.md) Anaesthetist moves their own List | partial · `web-cover-request`, `mobile-cover-request` (the old cover sheet) | Phase 32 rebuilds it (planned shot `move-list`); no change here. Check its click targets still resolve with this phase's seed |
| [US-01.4.5](../../../../requirements-board/requirements/stories/US-01.4.5.md) No preference warning when an anaesthetist moves their own List | absent ("Not built yet: catch-up Phase 32 builds this.") | Phase 32 creates it (the List move with no warning). Optionally add a `booking` state: this phase's confirm step for a receiver with a not-preferred pairing, showing no warning, only if work item 4 pinned one. Its caption must not describe a warning or prompt |

**Recipes this phase breaks.** Found by grep at plan time:
- `US-07.1.1.json` and `US-07.4.1.json` (web and mobile) click "Submit to office" and shoot the
  submit sheet, which gains one sentence: no step to fix, but the image changes. `US-06.4.1.json`,
  `US-08.2.2.json` and `US-08.6.1.json` also click "Submit to office"; check them (their own
  captions are re-stated by Phases 27, 38a and 41, not here).
- The anaesthetist Booking detail recipes that shoot the action stack (for example `US-03.2.3.json`'s
  `add-procedure` and any recipe highlighting "Cancel booking"): a new button sits above Cancel
  booking; check highlights and scroll targets.
- Any recipe on Admin Day or Dr Souter's Lists whose seed Booking, List or Slot work item 4 changed:
  the `--dry` run is the final check.

**ATLAS.md.** Update Routes (the Move to a colleague sheet on the mobile and web Booking routes),
Seed data worth shooting (the pinned movable Souter Booking, the offered and unavailable colleagues,
any pinned not-preferred receiver, the prepaid Booking, the stand-in and acceptance-beat candidates),
Overlays that need clicks (Move to a colleague, then the search field, then a row, then Move Booking),
Demo actions (the Admin Day trigger and the PWA stand-in) and Existing hooks (the `move-booking-*`
and `submit-doer-note` hooks).

## Adversarial review (after build)

Once the manual test checklist and `npm run build`, `npm run build:pwa`, `npx vitest run` and
`npm run shots` are green, and before writing the PROGRESS entry, run the standard **adversarial
review-and-fix pass (PROGRESS convention 18)**:
- fan out three independent Opus review subagents, one each for **quality**, **bugs/correctness** and
  **plan adherence**, with the catalogue files, this doc and the diff;
- this session then independently verifies every finding against the catalogue, this doc and the
  code. It fixes the confirmed ones (with a test wherever a bug had none), re-greens, and records the
  pass in the phase entry;
- do not re-raise anything already settled in the Decisions log.

**Steer this phase's reviewers at:**
- **US-01.4.7's two criteria.** The Booking leaves the mover's List and lands on a List of the
  receiver's; a receiver who is not available is never offered and the store refuses them even when
  the action is called directly. Nothing sets anyone available except their own action.
- **US-01.4.6's criteria.** A List of B's holds the Booking and A's does not; the payable is to B
  through the List and Phase 25's snapshot, with the price unchanged. AC3 is read through US-06.3.5:
  no re-check.
- **The honour system (US-06.3.5 AC2, US-06.5.4, D20).** No path in the move calls a prepayment
  re-check, touches `Booking.prepayment`, an invoice, a ledger pair or a Xero record, or raises
  anything; the prepaid price stays locked; the only prepayment-related code is the one empty,
  documented hook for Phase 41 (D38).
- **One move, one place.** One store action for both the hand-on and the doer rule; it uses
  `reassignBooking`'s core and 28's `placeListOnSlot`, with no second List maker, mover or receive
  rule. One `booking.movedToAnaesthetist`, no extra `booking.reassign`, one pool row, all in one
  commit.
- **The pairing rule holds.** A Booking never joins a List with another hospital or surgeon; a created
  List copies the source's hospital, surgeon and kind.
- **The guard replaced, not removed.** An anaesthetist still cannot move a Booking onto a colleague's
  List through `reassignBooking`; the other actions' `notOwnList` refusals are unchanged; the office's
  `MoveBookingFlow` is untouched.
- **OQ-85 in one place.** `SINGLE_BOOKING_MOVE_RULE`, the receiver helper and one caption are the only
  switch points; each flag is tested.
- **Preferences stay private (D44, US-01.4.5).** No warning, no acknowledgement, no grouping or tier
  order; nothing from the office-only slice in the anaesthetist apps' DOM, props, titles or aria
  labels; `officePrivacy.test.ts` passes with no new allowlist entry.
- **Triggers and PWA purity.** The Admin entry is bar only on Admin Day; the stand-in is PWA only with
  its badge; bodies live in `src/store`; candidates are deterministic and never scripted; no trigger
  touches availability.
- **Determinism and seed hygiene.** `PERSIST_VERSION` bumped; any seed addition appended, RNG-free,
  and not in `SCRIPTED_BEAT_SCHEDULE`; S1 to S5 unchanged.
- **Design and copy.** The sheet keeps the Mobile Availability anatomy (bottom sheet on mobile, dialog
  on web); a blocked receiver is neutral, not error red; teal only; no "slot", no "Draft List" to the
  anaesthetist, no "timesheet", no "estimate" or "deposit" for the prepaid amount, no en or em dashes.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry; ROADMAP.md "Owner review: agents test
  themselves"): the defaults built for open questions and the readings picked, each with its route and
  persona:
  - OQ-85's recommendation as built (search by name, available only, a List created when none exists,
    a pool row as for a List move, and no warning per OQ-43), and showing an unavailable colleague as
    a row that cannot be picked when searched for (Web, Dr Souter, the pinned Booking, Move to a
    colleague);
  - OQ-80's default (D38): the hook is empty until Phase 41; until then a moved prepaid Booking's pair
    keeps its original payable payee (store test only);
  - the catalogue contradiction: US-01.4.6 AC3 still says "prepayments are re-checked" on the move,
    while the newer US-06.3.5 AC2 and US-06.5.4 say a move re-triggers nothing. This phase follows
    US-06.3.5 (D20); a catalogue point for the requirements owner;
  - the honour-system line on the confirm step for a prepaid Booking (Web, Dr Souter, the pinned
    prepaid Booking, Move to a colleague);
  - an anaesthetist moves only Bookings dated today or later on an ACTIVE List; after the day, or once
    submitted, it is the office's `MoveBookingFlow`;
  - a Booking joins the receiver's List only when the hospital and surgeon match, else the receiver is
    shown as "Has a List at ... this session" (Phase 31's pairing rule);
  - the source List stays when its last Booking leaves;
  - a single-Booking move posts to the shared pool, a second source beside OQ-79's "List moves only"
    recommendation (Admin, the pool card on the Day rail, after the Admin Day trigger);
  - a catalogue point for the requirements owner (the 2026-10-08 gap analysis no longer lists it as a
    contradiction, but the wording still differs): US-01.6.3 lets the office assign a Draft List onto
    an unavailable session with a soft warning, while US-01.4.7 says the office does not assign work
    to someone marked unavailable without them knowing. This phase applies US-01.4.7's receiver rule
    to the anaesthetist's move only and leaves the office's paths as Phase 31 built them.
- **Status row** for catch-up Phase 32a, and a phase entry with:
  - the drift-check result against `60e2d1e`: items changed or not, and the state of OQ-85, OQ-80,
    OQ-79 and OQ-43;
  - the names Phases 25 to 32 delivered that this phase used, anything folded in from 32, and the
    hook's name (32's, or `afterAnaesthetistMove` added here);
  - what was built; the `PERSIST_VERSION` bump (from and to); any seed record added and why;
  - the Booking, colleagues, prepaid Booking and trigger candidates the seed tests pin, for the demo
    guide;
  - the checklist item by item with evidence; the tests added (domain, store, triggers, Playwright);
  - the review pass;
  - the Catalogue screenshots result: recipes created or changed, the REPORT.md counts (captured,
    partial, absent, failed) before and after;
  - the milestone consistency read of the master guide.
- **Decisions log:**
  1. **US-01.4.7 and US-01.4.6 are one move** (DM-42, which absorbed DM-06). An anaesthetist hands a
     Booking to a colleague found by name, only onto a session the colleague has available, onto
     their matching List or a new List there; the same action is the doer rule. It replaces the
     earlier plan's separate "move to the anaesthetist who did it" (never built), which created a List
     even in a closed session.
  2. **The anaesthetist guard is replaced:** `reassignBooking`'s `notOwnList` for an anaesthetist now
     points at the one sanctioned path, `moveBookingToAnaesthetist`.
  3. **OQ-85, open, recommendation built:** the switch point is `SINGLE_BOOKING_MOVE_RULE`; its part 4
     is settled by OQ-43 (no warning).
  4. **D20 superseded 2026-10-08 (OQ-70, US-06.3.5, US-06.5.4):** a move re-checks and recalculates
     nothing; the earlier plan's `syncPrepayment(api, bookingId, 'bookingMoved')` after the move is
     dropped (never built). **D38 (OQ-80)** stays open: one empty hook for Phase 41's payee repoint.
  5. **D44 (OQ-43 answered):** no pairing prompt on an anaesthetist's single-Booking move; the earlier
     plan's Booking-subject prompt and its acknowledgement are dropped (never built).
  6. **OQ-79:** the pool gains a second source, `'bookingMoved'`, under OQ-85's recommendation.
- **Handoff notes:**
  - For **35**: the pool's single-Booking row is one place the on-demand update email starts (D19: a
    button on any Booking, the change picked from its history, manual only); `booking.movedToAnaesthetist`
    is a change kind for US-02.3.4's per-kind templates (a cover change for the rooms or the
    hospital); use the typed message.
  - For **41**: fill the hook (its name as built) with `repointPrepaymentPayable(api, bookingIds,
    cause)` (41's signature; this move passes `([bookingId], 'bookingMoved')`); key the audit on `booking.movedToAnaesthetist`; flip the one store-test
    assertion that pins the original payee. Nothing in 32a calls a prepayment re-check, and the
    earlier plan's `moveBookingToDoer` does not exist.
  - For **38a**: the search should find a moved Booking on the List it moved to.
  - For **44**: S2 Beat 3c and Workflow 3 are patched, not rewritten; the PWA parity audit walks the
    receiving side with the stand-in, including the acceptance beat.
  - If OQ-85 is answered later, the switch points are `SINGLE_BOOKING_MOVE_RULE`, the receiver helper
    and the sheet's caption.
