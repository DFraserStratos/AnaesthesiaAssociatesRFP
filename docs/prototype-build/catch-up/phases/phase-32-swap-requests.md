# Phase 32 · Anaesthetist moves their own List, and the notification pool

> The file keeps its historical name (`phase-32-swap-requests.md`) because the plan tools pin the doc
> path in `plan.json`. "Swap" is no longer catalogue vocabulary. It must not appear in app copy,
> store action names, audit codes, type names or test names. Use "move", "return to the office" and
> "hand on". Per OQ-64, "slot" never reaches app copy either: say session, AM or PM. Slot stays a
> code and planning word.

**Requirements covered:**
[US-01.4.3](../../../../requirements-board/requirements/stories/US-01.4.3.md) Anaesthetist moves their own List (Confirmed at 3d3a18c, with two new acceptance criteria: the move posts to the pool, the colleague sees it with a notice) ·
[US-01.4.5](../../../../requirements-board/requirements/stories/US-01.4.5.md) Blacklist warning when an anaesthetist reassigns their own List (Verify) ·
[US-01.5.5](../../../../requirements-board/requirements/stories/US-01.5.5.md) Mark unavailable while holding a List (Confirmed, new at 3d3a18c, three acceptance criteria) ·
[FT-13.8](../../../../requirements-board/requirements/stories/FT-13.8.md) Shared notification pool (Confirmed, new) ·
[US-13.8.1](../../../../requirements-board/requirements/stories/US-13.8.1.md) See the team's notifications (Confirmed, new, three acceptance criteria) ·
[US-13.8.2](../../../../requirements-board/requirements/stories/US-13.8.2.md) Notify the team when an anaesthetist moves a List (Verify, new, two acceptance criteria) ·
[DM-05](../analysis/domain-model-delta.md#dm-05) An anaesthetist moves their own List with no request and no office confirmation (replaces the cover request) ·
[DM-41](../analysis/domain-model-delta.md#dm-41) Shared notification pool in the Admin App: one append-only pool for the whole team, newest first ·
[RV-15](../analysis/reverse-check.md#rv-15-cover-flow-is-a-request-or-offer-marker-on-a-free-session-that-nobody-ever-resolves) The cover flow is a request or offer marker on a free session that nobody resolves (Rework) ·
[RV-30](../analysis/reverse-check.md#rv-30-availability-reconciliation-conflict-flags-a-booked-session-and-claims-the-office-notified-the-catalogue-asks-the-anaesthetist-to-return-or-assign-it) Availability reconciliation conflict-flags a booked session and claims "the office notified"; the catalogue asks the anaesthetist to return or hand it on (Rework; the anaesthetist's half is this phase's, Phases 29 to 31 kept the flag for the office's and the hospital's cases).
Also touches, without closing:
[FT-01.4](../../../../requirements-board/requirements/stories/FT-01.4.md) (now Confirmed and widened to "a List, or a single Booking from it": the single-Booking half, [US-01.4.7](../../../../requirements-board/requirements/stories/US-01.4.7.md), and the doer rule, [US-01.4.6](../../../../requirements-board/requirements/stories/US-01.4.6.md) with DM-06 and DM-42, are **Phase 32a**, which extends this phase's helpers),
[US-01.4.1](../../../../requirements-board/requirements/stories/US-01.4.1.md) (the office reassignment and its one from/to/by/when event; Phase 28 built the move core this phase reuses. Its note now says the email after a cover change is the on-demand button, Phase 35, and that the vacated session is OQ-84),
[US-01.4.2](../../../../requirements-board/requirements/stories/US-01.4.2.md) (the availability view a move to a colleague starts from; Phases 28 and 29),
[FT-01.6](../../../../requirements-board/requirements/stories/FT-01.6.md) and [US-01.6.1](../../../../requirements-board/requirements/stories/US-01.6.1.md) (the Draft List a return to the office creates; Phase 31),
[US-01.5.2](../../../../requirements-board/requirements/stories/US-01.5.2.md) (the conflict flag now covers hospital closures and Bookings landing on a session already marked unavailable; an anaesthetist marking a booked session unavailable is US-01.5.5 here, and a recurring booking onto an unavailable session is Phase 31's Draft List),
[US-01.3.5](../../../../requirements-board/requirements/stories/US-01.3.5.md) and [US-13.6.3](../../../../requirements-board/requirements/stories/US-13.6.3.md) (the office-side warning and the blacklist master; Phase 17),
[US-06.3.5](../../../../requirements-board/requirements/stories/US-06.3.5.md) (the prepayment re-check, built in Phase 27; this phase calls it from every move),
[US-06.5.4](../../../../requirements-board/requirements/stories/US-06.5.4.md) (a moved prepaid Booking: the agreed amount stands here; updating the payable half of its draft pair is Phase 41's),
[US-02.3.3](../../../../requirements-board/requirements/stories/US-02.3.3.md) (the on-demand update email; Phase 35 offers the cover-change email from this phase's notification),
[FT-13.7](../../../../requirements-board/requirements/stories/FT-13.7.md) and [US-13.7.2](../../../../requirements-board/requirements/stories/US-13.7.2.md) (Phase 15a's to-do list, which holds warnings that need action; a notification never appears on it).
**Answered and built as answered (no provisional hint in the UI):**
- [OQ-39](../../../../requirements-board/requirements/questions/OQ-39.md) (owner decision **D7**): in their app the anaesthetist picks one of their Lists and starts a move, to the AA office (it becomes a Draft List) or into a colleague's free session from the availability view. The colleague does not accept and the office does not confirm ("a high-trust system"). Withdrawing is the same return to the office. [OQ-08](../../../../requirements-board/requirements/questions/OQ-08.md): the owner reference on the List changes.
- [OQ-65](../../../../requirements-board/requirements/questions/OQ-65.md) (**D15**, answered "yes on all of your recommendations", plus a new feature): every move posts to a **shared notification pool** in the Admin App, one pool for the whole admin team and not per user, separate from the to-do list ([FT-13.8](../../../../requirements-board/requirements/stories/FT-13.8.md)); the office sends the cover-change email from the on-demand button (Phase 35); the colleague sees the List appear with a notice.
- [OQ-64](../../../../requirements-board/requirements/questions/OQ-64.md) (**D14**), part 3: marking a session unavailable while it holds a List offers "return to the office" or "assign to another anaesthetist" ([US-01.5.5](../../../../requirements-board/requirements/stories/US-01.5.5.md)); part 5: "slot" stays out of the UI.
- [OQ-70](../../../../requirements-board/requirements/questions/OQ-70.md) (**D20**): a moved prepaid Booking keeps its agreed amount, the anaesthetist who does it wears or benefits from the difference, and only the payable half of the draft pair is updated (Phase 41; when the pair is amended is OQ-80).
**Open, built as the recommendation, labelled provisional in one place each:**
- [OQ-43](../../../../requirements-board/requirements/questions/OQ-43.md) (what the anaesthetist's warning says: a short prompt with no reason; the constant `ANAESTHETIST_PAIRING_PROMPT`. Greg now pictures two lists, a surgeon's and an anaesthetist's; Phase 17's `keptBy` is the seam and building the anaesthetist's own list is not in scope),
- [OQ-84](../../../../requirements-board/requirements/questions/OQ-84.md) (what the vacated session becomes: ask the anaesthetist, defaulting to Free; the constant `VACATED_SESSION_DEFAULT`. The office's reassign keeps Phase 28's behaviour),
- [OQ-79](../../../../requirements-board/requirements/questions/OQ-79.md) (what posts to the pool and how long notices last: List moves only, every notice kept, newest first and paged, no expiry and no actioned or read state; the constant `NOTIFICATION_POOL_RULE`. Greg's "it need only hold what has not been seen, the rest is a log file" is a later archive rule).
**Not here:** [OQ-85](../../../../requirements-board/requirements/questions/OQ-85.md) (moving a single Booking, and whether that posts to the pool) is Phase 32a's. [OQ-82](../../../../requirements-board/requirements/questions/OQ-82.md) (an automatic email after an anaesthetist's move) is Phase 35's. [OQ-81](../../../../requirements-board/requirements/questions/OQ-81.md) part 3 (short-notice sickness recorded by the office) stays a conflict, as Phases 29 to 31 left it.
**Depends on:** Phase 17 (the pure blacklist helper `src/domain/blacklist.ts`, `BLACKLIST_TERM`, `BlacklistWarning` with `showReason` off by default, the `list.blacklistAcknowledged` rule and the seeded pairings). Phase 27 (the prepayment re-check `syncPrepayment(api, bookingId, cause)`, run as `ENGINE_ACTOR` after commit, which a move must call, and its agreed-amount rule: a sent prepayment keeps its amount, a held one is withdrawn and regenerated). Phase 29 (the availability calendar, its `AvailabilitySlotPanel`, `isOpenSlot`, the Slot status master in `domain/slotStatus.ts`, `setAvailability`, `setAvailabilityRange` and the series actions, and the Find cover layers on mobile and web). Phase 31 (Draft Lists that hold Bookings, a Draft List being a List with a `draft` trail; the internal `detachListToDraft`; `assignDraftList`; the Day view's rail order and its Draft Lists card; and `shared/scheduleTerms.ts`, the one home of every user-facing Draft List word). Through them it also depends on Phase 28 (a List is its own record in a Slot; `moveListToSlot`, `placeListOnSlot` and the receive rule in `store/slotActions.ts`, with 17's acknowledgement and 27's sync already hung on `moveListToSlot`) and Phase 30 (conflicts reconcile on a move). Phase 14's trigger registry, Phase 15's Booking vocabulary and Phase 15a's To-do card on the Admin Day rail (the pool card sits below it) are assumed throughout. **Phase 32a** follows and extends this phase's helpers, sheet and pool posting to a single Booking; **Phase 35** reads the pool. This is no longer a milestone phase: the Schedule milestone consistency read is 32a's.
**Estimated:** 2 sessions. **Session 1** ends green at work item 9: model (with the `Notification` record), pure helpers, seed tests, the three store actions with tests, the unavailability guard, the pool's posting and selectors, audit labels, and the cover marker retired. The cover affordances are gone at that point and no scripted beat uses them, so S1 to S5 still run. **Session 2** builds items 10 to 16: the shared move sheet, the unavailable prompt, the entry points on mobile and web, the colleague's notice, the Admin pool card and page, the triggers, Playwright and capture recipes. Then the demo guide, the review pass and the PROGRESS entry.

## Goal

Replace the cover-request marker with the catalogue's move, as owner decisions D7, D14 and D15
answered it, and give the office its shared notification pool.

Today an anaesthetist can put a `coverRequest` marker on a **free** session. It is an "offer" on
their own empty session or a "request" on a colleague's. The marker stays `pending` forever, the
office never sees it, and nothing moves (RV-15). The success copy says "You will be notified when
someone accepts", which the catalogue rules out. Marking a booked session unavailable on mobile
flags a conflict, leaves the List with an anaesthetist who will not be there, and says "the office
notified", though nothing notifies anyone (RV-30). The Admin App has no notifications at all.

This phase:

- lets an anaesthetist pick one of **their own** upcoming DRAFT Lists, from the List itself or from
  the availability view on mobile and web, and **move** it:
  - **return to the office**: it becomes a Draft List (Phase 31) with its hospital, surgeon and
    Bookings, waiting for the office to assign it. This is also how an anaesthetist withdraws;
  - **hand on to a colleague**: into a colleague's free session for that day, picked from the
    availability view. If the colleague is blacklisted with the List's surgeon, the anaesthetist sees
    a short warning with no reason (OQ-43's recommendation) and can still go ahead;
  - either way the anaesthetist is asked what their own session becomes, Free by default (OQ-84's
    recommendation).
- makes marking a booked session unavailable ask the same question (US-01.5.5): "Return to the
  office" or "Hand on to a colleague". The List goes first and the session takes the closed status
  in the same commit, so a List is never left with an anaesthetist who will not be there. This
  replaces the anaesthetist's conflict flag (RV-30). The office's sickness entry and hospital
  closures keep the flag (US-01.5.2, OQ-81 part 3).
- makes every move take effect at once. There is no request record, no acceptance and no office
  confirmation. Each is one audited from/to/by/when event through the same cores the office uses
  (Phase 28's move, Phase 31's conversion), so Bookings, history and conflicts behave as they do for
  the office;
- posts every move to a new **shared notification pool** (FT-13.8): one append-only record per move,
  written in the move's own commit by one store helper, saying which List moved, from whom and to
  whom (or to the office), and when. The Admin App shows the pool newest first and paged, the same
  for every admin, on a Notifications card on the Day view's rail and a Notifications page. It is not
  the to-do list. Phase 35 adds the cover-change email to each notification;
- shows the colleague the List with a "Moved to you by Dr ..." notice, read from the same record;
- retires `CoverRequest`, `List.coverRequest` (or `Slot.coverRequest`, wherever Phase 28 left it),
  `requestCover`, `RequestCoverSheet`, and every "Offer cover", "Tap to ask", "Cover requested",
  "notified when someone accepts" and "the office notified" string;
- registers two demo triggers. The Admin Day trigger "Colleague moves a List to the office" stages
  another anaesthetist's move (and, as a choice, a busy morning of moves to show the pool paging).
  The PWA-only stand-in "Colleague moves a List into my free session" shows the receiving side on the
  handset.

Moving a **single Booking**, the doer rule and the Booking's "Move to the anaesthetist who did it"
are Phase 32a.

## Before you start: drift check

1. Diff the catalogue for this phase's items against the plan's snapshot:

   ```
   node docs/prototype-build/catch-up/tools/plan-state.mjs --diff US-01.4.3,US-01.4.5,US-01.5.5,FT-13.8,US-13.8.1,US-13.8.2,FT-01.4,US-01.4.1,US-01.4.2,US-01.4.7,US-01.5.2,US-01.3.5,US-13.6.3,FT-01.6,US-01.6.1,US-02.3.3,US-06.3.5,US-06.5.4,FT-13.7,US-13.7.2,OQ-39,OQ-43,OQ-64,OQ-65,OQ-70,OQ-79,OQ-81,OQ-84,OQ-85,OQ-08
   ```

   If an item changed, re-read it and adjust the work items before planning. If a covered story is
   now Retired or Future, drop it and say so in the PROGRESS entry. If US-01.4.3 goes, the whole
   move goes, but the RV-15 removal of the cover marker stays. If acceptance criteria were added or
   changed, map each one to a work item. At 3d3a18c the mapping is: US-01.4.3's two criteria (pool
   post; colleague notice) to items 4, 5 and 13; US-01.5.5's three (the offer; return keeps
   hospital, surgeon and Bookings as a Draft List; assign moves into an available colleague's
   session) to items 4 and 11; US-13.8.1's three ("Appears", "Not a to-do", "Shared") to items 5 and
   13; US-13.8.2's two (moved to a colleague names both anaesthetists; returned to the office shows a
   Draft List) to items 4 and 5.
2. **D7 / OQ-39, D15 / OQ-65 and D14 / OQ-64 are answered: build them.** There is no office
   confirmation, no acceptance step and no request entity; the pool exists and is shared; a booked
   session marked unavailable offers return or hand-on. The UI carries no provisional hint about any
   of them. If one has been reopened or reworded, stop and say so before building item 4.
3. **OQ-43 (the anaesthetist's warning).** If it is still open, build the recommendation: a short
   prompt with no reason, no surgeon name and no "blacklist" word, in one constant
   `ANAESTHETIST_PAIRING_PROMPT`, with the provisional hint beside it. Possible answers:
   - "say the surgeon has asked not to work with this colleague": change only the constant;
   - "show the reason": the anaesthetist helper returns the reason too; say so in the PROGRESS entry;
   - "two lists, anaesthetists keep their own" (Greg's picture on 2026-10-02): Phase 17's `keptBy` is
     the seam. Building the anaesthetist's own list is new scope, so note it for a follow-up phase
     and do not build it here.
   OQ-43's other question (the anaesthetist does not want the surgeon) stays out of scope.
4. **OQ-84 (the vacated session).** If it is still open, build the recommendation: the anaesthetist
   who moves the List is asked, Free by default, in one constant `VACATED_SESSION_DEFAULT` with a
   small provisional hint beside the choice. If it is answered "always Free" or "always Not
   available", drop the choice and set the constant. The unavailable path (US-01.5.5) never asks: the
   session takes the status being set.
5. **OQ-79 (the pool's lifecycle).** If it is still open, build the recommendation exactly as work
   item 5 describes: `NOTIFICATION_POOL_RULE = { sources: ['listMoved'], expiresAfterDays: null,
   actionable: false, pageSize: 6 }`, and one small provisional caption on the Notifications page
   ("What else shows here, and for how long, is still being confirmed with AA"). If it is answered,
   change only the rule and the selectors behind it: an expiry becomes a filter on `atISO` against
   the demo clock (the records stay); "mark as seen" becomes new scope, because it needs per-user
   state the pool deliberately does not have, so note it for a follow-up phase.
6. **OQ-70 (D20) is answered.** The agreed amount stands and the doer is paid; the payable half of
   the draft pair is Phase 41's. If it has been reopened as "credit and re-prepay", stop and say so,
   because that changes 27's re-check and 41.
7. **OQ-81 part 3 and US-01.5.2.** If short-notice sickness marked by the anaesthetist has been
   settled as "the office records it as a conflict", the anaesthetist's unavailable prompt still
   stands (US-01.5.5 is Confirmed); only the office's path is affected, and it already keeps the
   flag. If US-01.5.5 has changed, re-read it before item 4.
8. **Baseline.** Confirm Phases 14, 15, 15a, 15b, 17, 27, 28, 29, 30 and 31 are DONE in PROGRESS.md.
   Then read what they left, because this doc names planned files and functions:
   - Phase 28: `Slot`, `List.slotId`, `slotFor`, `listInSlot`, the internal `placeListOnSlot`, and
     `moveListToSlot(api, actor, listId, toSlotId, vacatedStatus)` with `reassignList` over it. Note
     its refusals (`officeOnly`, `listAuthorised`, `notFound`, `sameSlot`, `differentSession`,
     `slotOccupied`, `targetNotOpen`), which are the receive rule this phase reuses. Note whether it
     self-commits or already has a pure core. Its plan moves all of these, and `requestCover`, from
     `lifecycle.ts` to `store/slotActions.ts`, and puts Phase 17's `list.blacklistAcknowledged` and
     Phase 27's `syncPrepayment` call inside `moveListToSlot`; note exactly where each sits (inside
     the commit or after it), because `pushListToSlot` inherits them and must not repeat them. Note
     where the cover marker lives now (`Slot.coverRequest` or `List.coverRequest`, `requestCover`,
     audit `slot.coverRequest` or `list.coverRequest`). The Admin Day drawer is
     `components/SlotDrawer.tsx` (today `ListDrawer.tsx`).
   - Phase 29: `SlotStatusKey`, `defaultSlotStatus`, `isOpenForBooking` and `isClosed` in
     `domain/slotStatus.ts` (statuses are a user-maintained master with fixed ids, D14), `isOpenSlot`
     (no List and open for booking, the only Slots its finder makes tappable),
     `AvailabilitySlotPanel` (a tapped Slot that holds a List shows the List), `AvailabilityForm`,
     `describeAvailabilityOutcome`, `setAvailability`, `setAvailabilityRange` (whose result carries
     `flagged: ListId[]`), `createAvailabilitySeries`, `clearAvailability` and the instance edit, the
     shared per-Slot write helper they all pass through, and the routes. Mobile Find cover is
     `/mobile/availability` (`AvailabilityScreen.tsx`): 29 removed its Free and Block buttons, the
     `availability-block-*` hooks and `setMine`, so its "My availability" card shows the day's AM and PM
     with a **Change** button that opens `AvailabilitySlotPanel` then `AvailabilityForm`. My calendar is
     `/mobile/availability/calendar`. Web Find cover is `/web/availability` (`AvailabilityGrid.tsx`,
     whose "(you)" row has a "Change" link to My availability) and My availability is
     `/web/availability/mine`. Note 29's interim copy, which this phase replaces: the panel's "This
     session holds a List. If you mark it unavailable, the List stays in place and is flagged on the
     office's Day view." and the form's "1 List is flagged on the office's Day view." result clause.
   - Phase 30: conflicts are derived from facts and reconciled inside `mutate()` (its
     `MutationResult` with `conflictsRaised` and `conflictsResolved`). It removed 29's
     `availabilityClash` and every per-path conflict write, and kept 29's shared per-Slot write helper
     as the one place this phase's `holdsList` guard goes. Note what the reconcile does on a move (an
     availability conflict resolves because the target is open; a holiday conflict travels with the
     List), its `simulateSickness` office body (an office write, untouched here), and its interim
     outcome copy "{session} has Bookings; a conflict was flagged for the office.", which this phase
     replaces for the anaesthetist.
   - Phase 31: a Draft List **is a List** with no `slotId` or anaesthetist and a `draft` trail
     (`DraftOrigin`, `sinceISO`, `by`, `fromAnaesthetistId`). The one conversion is the internal
     `detachListToDraft(s, listId, { origin, by, fromAnaesthetistId })` in `slotActions.ts`, a
     draft-level helper that does not commit; it leaves the vacated Slot's status to the caller. A
     plain return to the office **must** call it with `origin: 'movedToOffice'` (labelled "Moved to the
     office" in `ORIGIN_LABELS`), and a return from the unavailable prompt with 31's
     `'unavailableReturn'` (labelled "Returned: anaesthetist unavailable"); 31's plan declares both
     origins for this phase. Use the names 31 delivered. Also note what 31 left on the anaesthetist's
     unavailability path: its plan no longer turns an anaesthetist's unavailability into a Draft List
     (that choice is this phase's) and leaves Phase 30's derived conflict there. Also `assignDraftList`
     (31's plan runs Phase 27's re-check per Booking after it; confirm), the Day view's rail order
     (calendar, 15a's To-do, Draft Lists, then the room 31 left for this phase's pool, then notes and
     Awaiting review, in 31's plan), and `shared/scheduleTerms.ts` with its test that no literal
     "Draft List" or "Unassigned" appears in `src/apps` or `src/shared` outside it. The anaesthetist
     never sees the words "Draft List" (31's rule).
   - Phase 27: the exact name and causes of the re-check (`syncPrepayment(api, bookingId, cause)`,
     run as `ENGINE_ACTOR` after commit and idempotent, in its plan), which actions already call it
     (its plan lists `reassignBooking` and `reassignList`, and exports it for 32), and
     `prepaymentBasisAnaesthetist`: before an invoice is sent the List's anaesthetist decides (a
     move withdraws a held invoice and regenerates it at the new anaesthetist's rate, or clears it);
     once sent, the agreed amount stands (D20). Phase 41 keys its payable update on the cause
     `listMoved`, so use it (or tell 41 the name delivered).
   - Phase 17: the exports of `src/domain/blacklist.ts` (`blacklistWarning`,
     `partitionAnaesthetistsForSurgeon`, `BLACKLIST_TERM`), `BlacklistWarning` and
     `useBlacklistWarning` in `src/shared/schedule/`, and the seeded pairings (as planned: Dr Priya
     Sharma with Ms A. Reid active, Dr Rawiri Hughes with Ms A. Reid ended; use what 17 actually
     seeded). This phase **amends** two Phase 17 rulings, because US-01.4.5 asks for it. The first is
     "an anaesthetist actor's store writes never check or log the blacklist": `pushListToSlot` now
     does both. The second is "keep the blacklist out of the mobile app, the web app and the PWA":
     the anaesthetist now sees the reason-free prompt. Record both in the Decisions log.
   - Phase 15a: the To-do card on the Admin Day rail and the to-do selector behind it (the pool must
     never feed it), and `Warning` (a notification is not a Warning).
   - Phase 15: `reassignBooking` (its anaesthetist `notOwnList` refusal stays; 32a adds the
     sanctioned exception), `BookingDetailBody`, `bookingsForList`.
   - Phase 14: the registry types (`DemoTrigger`, `choices`, `when`, `surfaces`, the stand-in
     `badge`), `demoTriggersFor(state, pathname, surface, published)`, `src/pwa/PwaDemoActions.tsx`,
     and the actors in `src/store/demoActors.ts` (`OFFICE_ACTOR`, `SOUTER_ACTOR`,
     `OFFICE_SIMULATION_ACTOR`).
   - Run `grep -rn "coverRequest\|requestCover\|RequestCoverSheet\|CoverTarget\|onCover\|offerCover\|onOfferCover\|askCover\|myFreeList\|Tap to ask\|Offer cover\|Ask to cover\|Cover requested\|Cover request sent\|someone accepts\|office notified\|when they respond" aa-prototype/src aa-prototype/visual requirements-board/capture/recipes`
     to see every place the cover marker and the false "office notified" copy reach after 28 to 31.
   - Read the current `PERSIST_VERSION` in `src/store/appStore.ts` (16 after Phase 15a session 1;
     later phases will have bumped it) and bump it by one from whatever it is now.

## Reference

**Design files (convention 17):**
- `docs/design/Mobile Availability.dc.html` is the layout reference for the mobile move sheet and
  the unavailable prompt. Tap a free session and the sheet slides up, with an avatar header, a
  session line, a short explanation, "Add a message" and a teal action button, then the completion
  tick. Keep that anatomy; the content becomes "move my List here".
- `docs/design/Web Availability.dc.html` (the grid and its confirmed-cell state) and
  `docs/design/Web Dashboard.dc.html` (the header button slot and the "Who's free, next 5 days"
  chips) are the web references.
- `docs/design/Admin Day.dc.html` is the reference for the Notifications rail card (the right rail's
  card anatomy) and the drawer's attention line. The Notifications page extends the Admin table
  chrome (`apps/admin/tableChrome.ts`) used by the Audit screen.
- `docs/design/Design Language.dc.html` gives the tokens. Use warning `#A16207` (tint `#F9F0DC`,
  on-tint `#7C4D08`) for the pairing prompt, info or neutral for notifications and the colleague's
  notice (a notification needs no action, so never warning or error), success for the done state,
  the `sheet-in` and `complete-tick` motions, and pills (radius 999).
- Teal is the only action colour. Crimson stays identity only. The pairing prompt is attention
  (warning tint), never error red.

**Catalogue:** the covered items above; `domain-model.md` ("Slot, List and Draft List", "Surgeon,
surgeons' room and blacklist", the warnings section's notification-pool paragraph, the glossary's
"Shared notification pool", and the prepayment text on a moved Booking); the evidence notes
`requirements-board/requirements/notes/2026-10-02-aa-meeting-with-greg.md` items #5, #6, #10, #18, #35, #43 and #45 and
`requirements-board/requirements/notes/2026-10-02-aa-requirements-review-with-greg.md` items #3, #17, #18, #24, #25, #48,
#56, #60, #74 and #76 (and, for D7, `2026-10-01-aa-meeting-with-greg.md` #15, #19, #22); the change
logs `changes/2026-10-02-requirements-update.md` and
`changes/2026-10-02-aa-requirements-review-with-greg.md`.

**Analysis:**
- `docs/prototype-build/catch-up/GAP-ANALYSIS.md`: theme 2 ("Anaesthetist moves own List, no
  request"), "Remove or rework" (the CoverRequest line and the availability-reconciliation line), the
  OQ-43, OQ-79 and OQ-84 uncertainty lines, the DM-05, DM-41, RV-15 and RV-30 rows, and the EP-01 and
  EP-13 tables;
- `epics/EP-01.md` (#us-01.4.3, #us-01.4.5, #us-01.5.5) and `epics/EP-13.md` (FT-13.8, US-13.8.1,
  US-13.8.2);
- `analysis/domain-model-delta.md` (#dm-05, #dm-41; also DM-02, DM-03 and DM-32, which this phase
  builds on, and DM-42, which 32a builds on this phase);
- `analysis/reverse-check.md` (RV-15 and RV-30; S2 is the affected scenario);
- `analysis/prototype-map-apps-mobile-web.md`, `prototype-map-admin.md`,
  `prototype-map-store-seed.md`, `prototype-map-shared.md` and `prototype-map-shell-demo-pwa.md`.

**Code entry points (as at 3d3a18c, after Phases 14, 15 and 15a session 1; Phases 15a session 2 and
16 to 31 will have renamed or moved some):**
- `aa-prototype/src/domain/types.ts`: `CoverRequest` (:277) and `List.coverRequest` (:315; Phase 28
  moves it to `Slot.coverRequest`), both retired here; `List` (:301); `DayNote` (:635, the nearest
  thing to a notice today, which stays a per-day office note); `AuditEntry` (:645).
- `aa-prototype/src/store/lifecycle.ts`: `requestCover` (:843, retired; its refusal "use Offer cover
  instead" :865; Phase 28 moves it to `store/slotActions.ts`); `reassignList` (:543; Phase 28
  re-implements it over `moveListToSlot`); `setAvailability` (:698-822, whose booked-Slot branch
  :799-820 raised the availability conflict; Phase 29 moves it onto Slots and Phase 30 replaces the
  branch with the derived reconcile, so this phase adds a refusal rather than removing a branch); `reassignBooking` (:635, out of scope here, 32a's).
- `aa-prototype/src/store/selectors.ts`: `listForSlot`, `bookingsForList`, `auditForEntity`.
- `aa-prototype/src/store/mutate.ts`: `mutate`, `MutationMeta`, `ID_FORMATS` (:61, add
  `notification: { prefix: 'NT', pad: 4 }`), `clockISO`, `refuse`, `ok`.
- `aa-prototype/src/store/events.ts`: the app-event emitter. It is not persisted and is not the pool.
- `aa-prototype/src/store/appStore.ts` (`PERSIST_VERSION`, :136, 16 today; the merge of nested
  slices at :205 is the pattern for a new top-level slice) and `aa-prototype/src/domain/seed/index.ts`
  (`SEED_LIST_IDS`).
- `aa-prototype/src/shared/flows/RequestCoverSheet.tsx`, replaced by the move sheet. Its done-state
  copy is ":102 You will be notified when someone accepts" and ":103 ... when they respond". Also
  `shared/flows/index.ts` (:10).
- `aa-prototype/src/shared/schedule/ListRow.tsx`: the `{ kind: 'offerCover' }` trailing variant
  (:12), its "Offer cover" pill (:82-96) and the doc comment (:102). All retired.
- Mobile:
  - `apps/mobile/screens/AvailabilityScreen.tsx`: its own local `CoverTarget` (:19), the `cover`
    state (:44), "Tap to ask" (:74), the pending cell (:220-230) and the `RequestCoverSheet` (:247).
    `setMine` and its line ":111 ... a conflict was flagged and the office notified" are Phase 29's to
    remove (its "Change" button replaces Free and Block); check they are gone;
  - `apps/mobile/screens/ForwardListsScreen.tsx`: `onOfferCover` (:35), and the free row's "Cover
    request sent" / "Open for bookings or cover" with `{ kind: 'offerCover' }` (:108-119);
  - `apps/mobile/routes.tsx`: `offerCover` (:87), `onOfferCover` (:104), and the `RequestCoverSheet`
    (:147);
  - `apps/mobile/screens/ListDetailScreen.tsx`, and `apps/mobile/components/SlideStack.tsx` (:132, a
    doc comment naming `RequestCoverSheet`).
- Web:
  - `apps/web/WebApp.tsx`: the `cover` state (:52), `onCover` in the outlet value (:55), and the
    `RequestCoverSheet` (:74);
  - `apps/web/outlet.ts` (`onCover`, :11-12), `apps/web/routes.tsx` (`onCover` at :31, :59, :118 and
    :124), and `apps/web/types.ts` (`CoverTarget`, :2);
  - `apps/web/screens/DashboardScreen.tsx`: `myFreeList` (:86-90), `offerCover` (:116), `askCover`
    (:126), the "Offer cover" header button (:151-169) and the "Who's free" chips with "Ask to cover"
    (:295-335);
  - `apps/web/screens/AvailabilityGrid.tsx`: "Cover requested" (:79), the free-cell click (:89-91),
    the requested cell (:180) and the doc comment (:34-35);
  - `apps/web/screens/ListDetailView.tsx`.
- Admin:
  - `apps/admin/components/SlotDrawer.tsx` (Phase 28's rename of `ListDrawer.tsx`), for the
    "Moved here by ..." attention line;
  - `apps/admin/components/RightRail.tsx` (its `Card` :36; 15a's To-do card and 31's Draft Lists
    card sit here), for the Notifications card;
  - `apps/admin/components/SideNav.tsx` (the `section` entries :32-38) and `apps/admin/routes.tsx`,
    for the Notifications page at `/admin/notifications`;
  - Phase 31's Draft List page, which shows a returned List's origin.
- Audit reading layer: `shared/audit/actionLabels.ts` (`'list.coverRequest'` :53, and Phase 28's
  `'slot.coverRequest'`), `shared/audit/fieldLabels.ts` (`coverRequest`, :79), and
  `shared/audit/auditNarrative.ts` (pure, no master lookups).
- Demo triggers: `src/shared/demoTriggers/` (registry, types, match, tests; Phase 14),
  `src/store/demoActors.ts`, `src/pwa/PwaDemoActions.tsx`.
- Tests to change:
  - `store/lifecycle.test.ts` (`describe('requestCover')`, removed; the availability-conflict tests
    for an anaesthetist actor on a booked session, which now expect the `holdsList` refusal);
  - `store/persistMigrate.test.ts`, `domain/seed/seed.test.ts` and `pwa/pwaPurity.test.ts`;
  - `visual/web-phase05.spec.ts` (which clicks "Send cover request"; shots `w-07-cover-dialog` and
    `w-08-cover-sent`; its header comment);
  - `visual/mobile-phase03.spec.ts` (the "mobile: request cover sheet" test that clicks "Tap to ask";
    shot `m-07-cover`; and any step that blocks a booked session);
  - `visual/pwa-device.spec.ts`.
- **Keep, not part of RV-15:** the free-Slot note "Free / open for cover" in the seed (now
  `Slot.note`) and the matching fallbacks in `apps/admin/components/DayGrid.tsx`,
  `apps/web/components/WeekStrip.tsx` and `apps/web/screens/ListsScreen.tsx`. They describe an open
  session the office can fill. The capture recipes `US-01.3.3.json` and `US-02.3.1.json` click them.
  Also keep "Find cover" as the finder's name.
- Outside the app: `requirements-board/capture/recipes/US-01.4.3.json` (captures the old cover sheet
  on web, "Open for booking", and on mobile, "Tap to ask"; its `absentReason` describes swaps),
  `US-01.4.2.json` (clicks free cells), and `US-01.5.2.json` (Phase 30's partial reason names this
  phase's return-or-assign). Phase 29 drops `US-01.2.1`'s `pm-blocked` and `US-01.5.3`'s `blocked`
  states and the mobile `unavailable-conflict` shot with the Block button; confirm they are gone.

## Work items

Build in this order: model, helpers, seed tests, store, pool, audit labels, retirement (session 1);
then sheets, the unavailable prompt, entry points, the colleague's notice, the Admin pool, triggers
and shots (session 2).

1. **Domain types** (`src/domain/types.ts`) (DM-05, DM-41; RV-15):
   - Remove `CoverRequest` and `Slot.coverRequest` (or `List.coverRequest`, whichever still exists).
   - Add **no** request or offer entity. D7 needs none.
   - Add `type OwnMoveRoute = 'office' | 'colleague'` and `type OwnMoveCause = 'move' |
     'unavailable'` (the second is US-01.5.5's hand-on from a session being marked not available).
   - Add the **`Notification`** record (DM-41), append-only, with no per-user or read state:
     `{ id: 'NT####', atISO, kind: 'listMoved', byActor, listId, route, cause, fromAnaesthetistId,
     toAnaesthetistId?, dateISO, session, hospitalId, surgeonId, message? }`. The date, session,
     hospital and surgeon are a **snapshot at the move**, so the notice still says what happened after
     the List moves again or is re-dated. `kind` is a union of one member today, so OQ-79's later
     sources add members. Add `notifications: Record<string, Notification>` to `AppState`, beside the
     schedule, not inside it (it is not schedule data), and `ID_FORMATS.notification = { prefix:
     'NT', pad: 4 }`.
2. **Pure helpers** (no React, PWA-safe; Vitest beside each):
   - **Layering:** `src/domain` imports neither `src/store` nor `src/shared`. The helpers take
     domain-typed inputs (the schedule's `lists`, `slots` and `bookings`, the masters, `todayISO`),
     never `AppState`. They use master-record names as they are ("Dr Priya Sharma"), never
     `shared/format.ts`.
   - `src/domain/listMoves.ts` (`listMoves.test.ts`):
     - Build on Phase 29's `isOpenSlot`. If Phase 28 left its receive rule inside `src/store`, move
       the pure predicate here (for example `canReceiveList(input, anaesthetistId, dateISO,
       session)`) and have `moveListToSlot` call it too. Then the rule exists once. Phase 32a's
       single-Booking receiver rule builds on it.
     - `ownMoveRefusal(input, listId, actorAnaesthetistId, todayISO)` returns `null` or `{ code,
       message }`. It covers: `notFound`; `draftList` ("This List has no anaesthetist yet. Only the
       office can assign it."); `notOwnList`; `listSubmitted` ("This List has been submitted. Only
       the office can move it now."); `listAuthorised`; and `pastDate` ("This List's day has
       passed").
     - `pushTargets(input, listId, ownerId)`: the colleagues whose Slot for the same date and session
       would receive the List under **the same receive rule as Phase 28's `moveListToSlot`** (active,
       not the owner, Slot open and empty). A colleague marked unavailable or on holiday is not
       offered (US-01.5.5 "an available colleague"). The result is sorted by display name, each with
       its `slotId`. Whatever the office's reassignment accepts, the move accepts, and nothing else.
   - In `src/domain/blacklist.ts`, beside Phase 17's helpers, add
     `pairingPromptForAnaesthetist(masters, entries, toAnaesthetistId, surgeonId)`. It returns
     `{ message } | null`. It uses `blacklistWarning` underneath but returns **only**
     `ANAESTHETIST_PAIRING_PROMPT` filled with the colleague's master-record name: "Check with the
     office before moving this List to Dr Priya Sharma. You can still go ahead." There is no reason,
     no surgeon name, no entry id, and no `BLACKLIST_TERM` word. A List with no surgeon returns null.
     Because the reason never leaves the helper, no anaesthetist component can leak it through
     props. The doc comment names OQ-43 as open.
   - `src/domain/notifications.ts` (`notifications.test.ts`):
     - `NOTIFICATION_POOL_RULE` (work item 5's values), with a doc comment naming OQ-79 as open;
     - `notificationText(n, masters)`: "Dr Hughes moved Thu 23 Jul AM (St George's, Ms A. Reid) to Dr
       Sharma", "Dr Hughes returned Thu 23 Jul AM (St George's, Ms A. Reid) to the office", and, for
       `cause: 'unavailable'`, "... when marking the session not available". It names both
       anaesthetists on a colleague move (US-13.8.2 AC "Moved to a colleague"). Pure, so the Admin
       card, the page and the colleague's notice read one sentence;
     - `pageOf(notifications, page, pageSize)`: newest first by `atISO`, then id descending, with
       `pageCount`.
   - Tests:
     - `ownMoveRefusal` returns each code for its case and null for a clean List;
     - `pushTargets` excludes the owner, inactive anaesthetists, closed Slots and Slots holding a
       List, and agrees with Phase 28's reassign rule on the same fixtures;
     - `pairingPromptForAnaesthetist` returns a message for an active entry and null for an ended
       entry or a List with no surgeon. The message contains neither the recorded reason, the
       surgeon's name, any `BLACKLIST_TERM` word, nor an en or em dash;
     - `notificationText` for each route and cause, with both names on a colleague move, no dash
       characters other than the hyphen, and no "slot";
     - `pageOf` orders newest first, breaks ties by id and pages exactly.
3. **Seed** (`src/domain/seed/index.ts`, `seed.test.ts`):
   - `notifications: {}`: the pool starts empty. No other new seed records. Remove any seeded
     `coverRequest` (none at the snapshot). Do not touch the canvas generator or its inputs.
   - **Bump `PERSIST_VERSION` by one** (the seed's shape gains a slice). Extend
     `persistMigrate.test.ts` so an old blob carrying `coverRequest` on a Slot (or on a List from
     before Phase 28), or lacking `notifications`, reseeds cleanly.
   - Hold the scripted-beat schedule as one exported constant, `SCRIPTED_BEAT_SCHEDULE = { listIds,
     slotIds }`. The seed tests and both triggers read it, and Phase 32a extends it. Build it from
     `SEED_LIST_IDS` and the run sheet as it stands, at least:
     - S1's Souter Tue 28 Jul St George's AM List;
     - S2's Rutherford Wed 22 AM List and its target, **Dr Sharma's Wed 22 AM Slot** (Beat 3), and
       Sharma Tue 21 PM (Beat 2);
     - S3's Souter Mon 20 Lists;
     - S4 Beat 1's Souter Fri 24 AM List (Annette Riley) and Phase 27's Fri 24 PM (Nair);
     - S5's Souter Tue 21 PM and the Fri 17 and Tue 14 Lists;
     - any List or Slot Phases 29 to 31 scripted into S2 (their PROGRESS entries name them).
   - Seed tests, which protect the demo beats rather than patch data:
     - **Souter can move:** on the pristine seed at `DEMO_TODAY`, Dr Souter has a DRAFT List with a
       surgeon in the next six days that is not in `SCRIPTED_BEAT_SCHEDULE` and whose `pushTargets`
       is non-empty. Record which one in a comment; the demo guide names it;
     - **The prompt is reachable:** some Souter List of that kind has an active blacklist entry
       between its surgeon and a colleague in `pushTargets`. If the canvas never produces one, add
       an active seed blacklist entry for a pairing that does occur. That follows Phase 17's rule:
       change the blacklist seed, never the Lists. Say so in the PROGRESS entry;
     - **The unavailable prompt is demoable:** a second, different non-scripted Souter booked session
       in the next six days has a non-empty `pushTargets`, so marking it not available can show both
       choices. Record it;
     - **The triggers have candidates:** both triggers (Demo triggers) find one on the pristine seed,
       the Admin trigger's busy-morning choice finds eight, and none of them picks anything in
       `SCRIPTED_BEAT_SCHEDULE`.
4. **Store actions** (new `src/store/listMoveActions.ts`, exported from `src/store/index.ts`):
   - Common rules:
     - one `mutate()` commit per action, with before and after metas;
     - timestamps from `clockISO(s.clock)`;
     - plain-English refusals with no dashes and no "slot";
     - anaesthetist actor only (`ownerOnly` otherwise; the office has Reassign and its Draft List
       tools), and `ownMoveRefusal` must be null: ownership is enforced in the store, never only in
       the UI;
     - **one internal core**, `ownMoveCore(s, actor, listId, route, { toSlotId?, vacatedStatus,
       cause, message? })`, does the move, the audit meta and the pool post for all three actions, so
       the rules exist once;
     - **the pool post is inside the commit**: the core calls one draft-level helper,
       `postNotification(s, input)` (in `src/store/notifications.ts`), which allocates the `NT` id
       and appends the record. It is the only writer of `notifications`, nothing updates or deletes a
       notification, and no other action posts in this phase (OQ-79's recommendation). The move's
       meta carries `after.notificationId`;
     - after commit, Phase 27's `syncPrepayment(api, bookingId, 'listMoved')` runs exactly once for
       every Booking that moved (once in total, even where a reused core already calls it). Under D20
       a sent prepayment keeps its agreed amount; a held one follows 27's rule; updating the payable
       half of a raised pair is Phase 41's.
   - **`moveListToOffice(api, actor, listId, { vacatedStatus?, message? })`** (US-01.4.3, first
     bullet; also "withdraws"; US-13.8.2 AC "Returned to the office"):
     - the core calls **Phase 31's `detachListToDraft(s, listId, { origin: 'movedToOffice', by:
       actor.who, fromAnaesthetistId })`**, the one conversion, in its one commit, so the List keeps
       its id, hospital, surgeon, Bookings, notes and history and becomes a Draft List. It is not a
       second copy; 31's tests pass unchanged;
     - the vacated Slot takes `vacatedStatus`, which defaults to `VACATED_SESSION_DEFAULT` (Phase
       29's `defaultSlotStatus`, Free; OQ-84), audited `slot.status` when it changes, as Phase 28's
       move does;
     - audit: one `list.ownerMove` meta, `before: { slotId, anaesthetistId }`, `after: { slotId:
       null, anaesthetistId: null, route: 'office', cause: 'move', notificationId }`. That is the
       from/to/by/when event;
     - after commit, the re-check per Booking. A held prepayment has no basis anaesthetist now, so
       27's sync withdraws it, and it is regenerated when the office assigns the Draft List. Make sure
       the re-check runs on that assignment: add the call to `assignDraftList` if Phase 31 did not.
   - **`pushListToSlot(api, actor, listId, toSlotId, { vacatedStatus?, message? })`** (US-01.4.3,
     second bullet; US-01.4.5; US-13.8.2 AC "Moved to a colleague"):
     - the target Slot's anaesthetist must be in `pushTargets` (`targetNotOpen`, "Dr X's session
       cannot take a List");
     - the core runs **Phase 28's `moveListToSlot` core** in the same commit, so the List moves with
       its Bookings, status history and audit intact and Phase 30's conflict rules apply exactly as
       for the office. `moveListToSlot` stays office-only. If it self-commits, split
       `moveListToSlotCore(s, actor, listId, toSlotId, vacatedStatus)` out of it, called by
       `moveListToSlot` (and so `reassignList`) and by the own-move core. `ReassignListFlow.test.tsx`
       and the reassign tests must pass unchanged;
     - audit: `list.ownerMove` with `after: { slotId, anaesthetistId, route: 'colleague', cause,
       notificationId }`, and **not** a second `list.reassign`. The core takes the action code, so
       the move is still one event;
     - it **never refuses on the blacklist.** If `blacklistWarning` is active for the colleague and
       the List's surgeon, Phase 17's `list.blacklistAcknowledged` meta is written in the same
       commit, `after: { anaesthetistId, surgeonId, blacklistEntryId }`. Phase 28's plan already
       writes it inside `moveListToSlot`: if it sits in the shared core, the move inherits it; if it
       sits in the office wrapper, move it into the core. Either way exactly one is written. Its
       entity is the List, so it stays in the Admin audit and never reaches the Booking History an
       anaesthetist sees. The notification carries no blacklist fact;
     - after commit, the re-check with cause `listMoved`, once (if `moveListToSlot`'s sync call lives
       in its wrapper, lift it into a shared after-commit step both paths call). A different
       anaesthetist means a different prepaid set and unit value: a held prepayment is withdrawn and
       regenerated at the colleague's rate, and a sent one keeps its agreed amount (D20).
   - **`markUnavailableAndMoveList(api, actor, slotId, statusKey, choice, message?)`** (US-01.5.5;
     RV-30), where `choice` is `{ route: 'office' }` or `{ route: 'colleague', toSlotId }`:
     - `statusKey` must be a closed status (`isClosed`; `notClosedStatus` otherwise) and the Slot
       must be the actor's and hold their movable List (`noList`);
     - in **one commit** the own-move core runs with `cause: 'unavailable'` and `vacatedStatus:
       statusKey`, so the List leaves first and the session takes the closed status. A return uses
       `detachListToDraft` with Phase 31's origin `'unavailableReturn'` (the plain return uses
       `'movedToOffice'`); AC "return to the office" holds because the conversion keeps hospital,
       surgeon and Bookings. A hand-on uses the push path, so AC "assign" holds only
       for a colleague in `pushTargets`;
     - the blacklist prompt and the pool post apply exactly as on the plain move. That is an assumed
       reading (US-01.5.5's note); log it for the owner;
     - one List per call. A range or series that covers several booked sessions is resolved one List
       at a time (work item 11).
   - **The unavailability guard** (RV-30): in Phase 29's shared per-Slot write helper (Phase 30
     kept it as the place for this), so `setAvailability`, `setAvailabilityRange`, the series create
     and the instance edit all get it: for an **anaesthetist actor**, a closed status on a Slot
     holding their List is refused, before any write, with `holdsList` ("This session has a List.
     Choose whether it goes back to the office or to a colleague first."), and the refusal carries
     `listIds` (every affected List in a range or series) so the UI can prompt per List. Phase 30's
     reconcile then never sees an anaesthetist's closed status over her List, so the interim conflict
     on that path ends without touching the conflict rule. Unchanged: the office's paths (sickness
     entry, `simulateSickness`, office availability edits) keep the derived conflict (US-01.5.2, OQ-81
     part 3), hospital closures keep it, and a recurring booking onto an unavailable session stays
     Phase 31's Draft List. A future Slot a series rolls forward onto, with no List yet, is
     unaffected.
   - Tests (`store/listMoveActions.test.ts`):
     - every refusal, including the office actor on all three actions; another anaesthetist's List; a
       Draft List, a SUBMITTED List and a past date; a closed or occupied target Slot; a
       non-closed status and an empty Slot on `markUnavailableAndMoveList`;
     - `moveListToOffice` produces a Draft List with the same id, hospital, surgeon and Bookings, the
       vacated Slot per `vacatedStatus` (Free by default), one `list.ownerMove` and one notification,
       all in one commit;
     - `pushListToSlot` moves the List exactly as `reassignList` does on the same fixture (same List
       id, same Bookings, the same conflicts raised and cleared). It writes one `list.ownerMove`, no
       `list.reassign`, and one notification naming both anaesthetists. A blacklisted colleague
       succeeds with exactly one acknowledgement; an ended entry writes none;
     - `markUnavailableAndMoveList` covers each of US-01.5.5's three criteria: the guard refuses the
       plain status change with `holdsList` (so the offer is the only way through); "return" leaves a
       Draft List with hospital, surgeon and Bookings and the session at the closed status, in one
       commit; "assign" puts the List in the colleague's session and the session at the closed
       status. Both post one notification with `cause: 'unavailable'`;
     - the guard: a range over two booked sessions refuses with both `listIds`; after both Lists are
       moved the range applies; the office's sickness entry on a booked session still raises the
       conflict and keeps the List;
     - the re-check ran once per moved Booking: on a Booking with a sent prepayment invoice the
       agreed amount is unchanged and no new invoice is raised; on one with a held invoice it is
       regenerated at the colleague's rate (push) or withdrawn (return);
     - determinism: the same actions on the same seed give identical ids and state.
5. **The notification pool** (`src/store/notifications.ts`, pure selectors plus the one draft-level
   writer, PWA-safe) (FT-13.8, US-13.8.1, DM-41):
   - `NOTIFICATION_POOL_RULE = { sources: ['listMoved'], expiresAfterDays: null, actionable: false,
     pageSize: 6 }` lives in `src/domain/notifications.ts` (OQ-79's recommendation, provisional,
     one place).
   - `postNotification(s, input)`: the draft-level writer (work item 4).
   - `notificationPool(state, { page })`: `{ rows, page, pageCount }`, newest first through
     `pageOf`, each row with `text` (from `notificationText`), `atISO`, the actor's name, and a link
     target (the List in its drawer, or the Draft List page when the List is a Draft List now). It
     **takes no user or actor argument**: the pool is one for the whole team (AC "Shared").
   - `latestNotifications(state, n)`: the rail card's rows.
   - `movedToMe(state, anaesthetistId, todayISO)`: notifications with `route: 'colleague'` and
     `toAnaesthetistId` equal to the persona, from the last `MOVED_TO_ME_DAYS = 7` demo days (a
     display window for the colleague's panel; the records stay), for the colleague's notice
     (US-01.4.3 AC2).
   - Tests: each action produces exactly one row (AC "Appears"); 15a's to-do selector returns no
     notification and no Warning is written by a move (AC "Not a to-do"); `notificationPool` returns
     identical rows read after an `OFFICE_ACTOR` action and after a second office actor's action, and
     has no user parameter (AC "Shared"); paging over thirteen rows gives three pages; the colleague
     window follows the demo clock; a return to the office gives no colleague row.
6. **Audit reading layer.**
   - `shared/audit/actionLabels.ts`: add "List moved by its anaesthetist" (`list.ownerMove`). Remove
     `'list.coverRequest'` and Phase 28's `'slot.coverRequest'`. The version bump reseeds, so no
     persisted history carries them.
   - `fieldLabels.ts`: add `route` ("Moved to"), `cause` ("Why", with "Marked not available") and
     `notificationId` ("Notification"); remove `coverRequest`.
   - `auditNarrative.ts` stays pure and shows ids raw, as it does for `list.reassign`.
     `auditNarrative.test.ts` passes. The Audit viewer's entity filter is derived, so it needs no
     change.
7. **Retire the cover marker (RV-15) and the false notice (RV-30).**
   - Delete `requestCover` from the store and its index, and its tests.
   - Delete `shared/flows/RequestCoverSheet.tsx` (item 10 adds the move sheet) and update
     `shared/flows/index.ts` and the `SlideStack.tsx` comment.
   - `shared/schedule/ListRow.tsx`: remove the `offerCover` variant, its pill and the comment line.
   - Mobile:
     - `ForwardListsScreen`: the free row loses "Offer cover" and `onOfferCover`, and its subtitle
       becomes "Open for bookings";
     - `apps/mobile/routes.tsx`: remove `offerCover`, the `offer` state and its sheet;
     - `AvailabilityScreen`: remove its `CoverTarget`, the `cover` state, "Tap to ask", the pending
       cell and its sheet, and any "the office notified" line Phase 29 left (item 11 replaces the
       booked-session path with the prompt).
   - The interim booked-session copy from Phases 29 and 30 goes for the anaesthetist:
     `AvailabilitySlotPanel`'s "If you mark it unavailable, the List stays in place and is flagged on
     the office's Day view", `describeAvailabilityOutcome`'s "is flagged on the office's Day view"
     clause and 30's "a conflict was flagged for the office" outcome line. After the guard an
     anaesthetist's write never flags a List, so the outcome helper drops the flagged clause for her
     (keep it for an office actor if 30's office paths read it) and its test changes with it.
   - Web:
     - remove `CoverTarget` (`types.ts`) and `onCover` (`outlet.ts`, `WebApp.tsx`, `routes.tsx`);
     - remove `DashboardScreen`'s `myFreeList`, `offerCover` and `askCover`;
     - remove the grid's free-cell cover click and "Cover requested". The grid subtitle "Find cover
       fast. Free sessions are clickable." becomes "Find cover fast. Move one of your Lists into a
       colleague's free session."
   - Every "Cover requested", "Cover request sent", "Tap to ask", "Offer cover", "Ask to cover",
     "notified when someone accepts", "when they respond" and "the office notified" string goes, and
     so does every anaesthetist-facing "flagged on the office's Day view" or "flagged for the office"
     line.
   - At the end, grep for `cover`, `swap` and `slot` across `src/apps`, `src/shared`, `visual` and
     the capture recipes. Only unrelated uses may remain: "Find cover", the kept "open for cover"
     notes, the "covered amount" from Phase 22, and `slot` in identifiers, never in rendered copy. No
     `swap` may remain in app copy or new identifiers.
8. **Interim surface for the guard.** Until item 11 builds the prompt, Phase 29's status controls
   (`AvailabilityForm`, the panel's Change) show the `holdsList` refusal inline, as they show other
   store refusals, so session 1 never leaves a control that silently fails. Item 11 replaces it.
9. **Checkpoint: green. Session 1 ends here.** Run `npm run build`, `npm run build:pwa` and
   `npx vitest run`. `npm run shots` is not expected to pass yet, because
   the two cover beats and the booked-session block are re-pointed in item 15. Say so in the
   hand-over note.
10. **The shared move sheet** (`shared/flows/MoveListSheet.tsx`, through `useSurface().Overlay`, so
    it is a bottom sheet on mobile and a dialog on web, convention 16):
    - Props: `actor`, `listId`, an optional preselected `toSlotId`, and an optional
      `unavailable: { statusKey }` for the US-01.5.5 mode. The sheet imports nothing from `apps/*`
      or `shell` and never receives a blacklist reason.
    - **Header:** the List as it is now: date, session, hospital, surgeon and the number of Bookings
      ("Thu 23 Jul · AM · St George's · 3 Bookings"). In the unavailable mode a line above it reads
      "You are marking this session <status label>. Its List needs someone else.", with the label
      from the status master.
    - **Choose where** (skipped when `toSlotId` is preselected), the same two choices in both modes:
      - **Return to the office**, with the line "The office will find someone for it. Its Bookings
        go with it." (and, in the plain mode, "Use this to withdraw from the List.");
      - **Hand on to a colleague**: the availability view for that day and session, that is
        `pushTargets` as tappable rows (avatar, name, phone, the Who's-free style), not a dropdown.
        The list is never split into a blacklisted group, because the group label would itself
        disclose the blacklist (OQ-43). An empty list reads "No colleague is free in this session",
        and in the unavailable mode the return stays available.
    - **Confirm:**
      - for a colleague, the mockup's header (the colleague's avatar and full name, and the session
        line), the explanation "Dr Sharma gets this List and its Bookings straight away. There is no
        need for Dr Sharma or the office to accept.", and the pairing prompt from
        `pairingPromptForAnaesthetist` in the warning tint (with OQ-43's provisional hint) when it
        applies;
      - in the plain mode only, "Your session after the move", offering the default status (Free)
        or Unavailable as status chips, with `VACATED_SESSION_DEFAULT` (Free) selected and OQ-84's
        provisional hint. Labels and colours come from Phase 29's status master by fixed id, never
        hard-coded (D14). The unavailable mode shows "Your session: <the status being set>" instead;
      - "Add a message" for the office and the colleague, stored on the notification's `message` and
        shown on its rows;
      - the teal button reads **Move List**, or **Move List anyway** while the prompt shows.
    - **Done:** the completion tick and either "Returned to the office. The office can see it in
      its notifications." or "Moved to Dr Sharma. Dr Sharma and the office can see it now." No
      provisional caption (D15 is answered). Refusals show inline in the error tint, as today. The
      anaesthetist's sheets never say "Draft List" (Phase 31's rule) or "slot"; any Draft List word on
      an Admin surface comes from `shared/scheduleTerms.ts`, so 31's literal-string test still passes.
      The sheet calls `moveListToOffice` or `pushListToSlot`, or `markUnavailableAndMoveList` in the
      unavailable mode, never a mix.
11. **The unavailable prompt** (US-01.5.5; RV-30): every anaesthetist control that sets a closed
    status checks the target Slot first, and a Slot holding the persona's List opens the move sheet
    in its unavailable mode instead of writing:
    - mobile Find cover's "My availability" card: its "Change" (Phase 29's replacement for Free and
      Block), through `AvailabilitySlotPanel` and `AvailabilityForm`;
    - Phase 29's `AvailabilitySlotPanel` status change and `AvailabilityForm` on My calendar (mobile
      `/mobile/availability/calendar` and web `/web/availability/mine`, which web Find cover's
      "(you)" row "Change" link opens);
    - Phase 29's range and series sheets: before applying, a short step lists the affected Lists
      ("2 of your sessions have Lists") and opens the prompt for each in turn ("1 of 2"). Each
      resolution is its own move and its own notification; once every List is moved the range or
      series applies. Cancel at any step leaves the range unapplied and the Lists already moved
      where they went (each move stands on its own). One List per prompt is the reading for a series
      of days off, which was not discussed; log it for the owner.
    The office's availability edits are untouched (they keep the conflict).
12. **Anaesthetist entry points** (US-01.4.3 "selects one of their Lists and starts a move"; "uses the
    availability view"). Build them on the screens Phase 29 left:
    - **List detail** on mobile (`ListDetailScreen`) and web (`ListDetailView`): a secondary **Move
      this List** action for a DRAFT List dated today or later, which opens the sheet. Lists that
      cannot move show no action.
    - **Mobile Find cover** (`/mobile/availability`):
      - the persona's own List in the "My availability" card (beside Phase 29's "Change") gains a
        **Move** affordance;
      - a colleague's Free cell is tappable **only** when the persona has a List in that session and
        the colleague is in `pushTargets`. It opens the sheet with `toSlotId` preselected and the line
        "Move your St George's PM List to Dr Ngatai". Otherwise the cell is status only.
    - **My calendar** (mobile `/mobile/availability/calendar` and web `/web/availability/mine`):
      Phase 29's `AvailabilitySlotPanel`, on a Slot that shows a movable List, gains a **Move this
      List** row that opens the sheet (Phase 29's handoff names this entry), beside the status change
      that item 11 routes through the prompt.
    - **Web Find cover** (`/web/availability`): a "Move" link on the persona's own booked cells in
      the "(you)" row, beside "Change", and the same colleague Free-cell gesture.
    - **Web dashboard** (`DashboardScreen`): the header's "Offer cover" button becomes **Move a
      List** in the same teal slot. It opens a short picker of the persona's movable Lists for the
      next six days, then the sheet. It is disabled with "No upcoming Lists to move" when there are
      none. In "Who's free, next 5 days", a colleague chip opens the sheet preselected when the
      persona has a List in that session and the colleague is a move target. Otherwise the chip is
      display only (title "You have no List in this session"). The row's "Ask to cover" link goes.
    - **Mobile Forward Lists:** no new entry point. List detail is one tap away.
13. **The colleague's notice and the Admin pool** (read from item 5's selectors):
    - **Colleague** (US-01.4.3 AC2): a **Moved to you** panel at the top of Find cover on mobile and
      web while `movedToMe` is non-empty, for example "Dr Hughes moved Thu 23 AM, St George's, to
      you", with the message if one was typed. The received List's detail shows "Moved to you by Dr
      Hughes on Tue 21 Jul". Its Forward Lists row shows a "New" pill for the window. Info tint, not
      warning.
    - **Office, Notifications card** (US-13.8.1) on the Admin Day rail, below 15a's To-do card and
      31's Draft Lists card, in the room 31 left for it (rail order: calendar, To-do, Draft Lists,
      Notifications, notes, Awaiting review; record it). It shares the attention cards' anatomy but
      not their count: no mono count in its heading, because the pool has no read state. It shows `latestNotifications(state, 3)`, each as its sentence, its time
      and a link to the List drawer or the Draft List, and "See all notifications". Empty state: "No
      notifications yet. When an anaesthetist moves a List, it shows here." No count badge and no
      unread dot: the pool has no read state (OQ-79).
    - **Office, Notifications page** (`/admin/notifications`, a SideNav section "Notifications" with
      no badge): the whole pool, newest first, `NOTIFICATION_POOL_RULE.pageSize` per page with
      Newer and Older, in the Admin table chrome (when, what happened, by, open). It is the same for
      every admin. OQ-79's one provisional caption sits under the title. It is not the Audit screen
      and not the to-do list: a notification needs no action, so the rows carry no Clear or Done.
      Phase 35 adds "Draft update email" to each row.
    - **SlotDrawer** attention line, read from the latest notification for that List: "Moved here by
      Dr Souter (her own move), Tue 21 Jul 09:12", or "Returned to the office by Dr Souter" on a
      Draft List's page (beside 31's origin line).
14. **Demo triggers** (registry entries; see the next section for labels and effects):
    - Bodies go in `src/store/listMoveDemo.ts` (exported from the store), so the registry stays thin
      and the PWA closure stays pure: `stageColleagueMoveToOffice(api, dateISO?)`,
      `stageBusyMorning(api, dateISO?)` and `stageColleagueMoveToPersona(api, personaId)`.
    - Each acts as the List's owner, through a small `anaesthetistActor(state, anaesthetistId)`
      helper in `src/store/demoActors.ts`, so the audit and the notification read truthfully. Phase
      32a reuses the helper.
    - Candidate choice is deterministic: the earliest future DRAFT List (by date, then session, then
      id) that is not the persona's, has a surgeon, is not in `SCRIPTED_BEAT_SCHEDULE` and, for the
      PWA entry, lands in a persona Slot that is not in `SCRIPTED_BEAT_SCHEDULE`. The busy morning
      takes the first eight candidates, alternating a return to the office and a move into a
      colleague's free session where a target exists, each its own commit and notification.
    - `demoTriggers.test.ts`:
      - ids are unique and contain no dash characters other than the hyphen;
      - the Admin entry appears for `'bar'` on `/admin/day/:dateISO` and `/admin/notifications`, and
        never for `'pwa'`;
      - the PWA entry appears for `'pwa'` on `/mobile/availability` and never for `'bar'`;
      - "One move" makes exactly one move and one notification; the busy morning makes eight and the
        Notifications page then has two pages;
      - the disabled reasons fire when nothing fits.
15. **Playwright and capture recipes** (`npm run shots`):
    - `visual/web-phase05.spec.ts`: re-point the cover beat to the move sheet (own List cell → Move
      → a colleague → Move List → done). Rename the shots to `w-07-move-sheet` and `w-08-move-done`
      and update the header comment.
    - `visual/mobile-phase03.spec.ts`: "mobile: request cover sheet" becomes "mobile: move List
      sheet", opened from the persona's own List's Move affordance on Find cover. The shot becomes
      `m-07-move`. Any step that blocks a booked session now meets the prompt: re-point it.
    - New `visual/list-moves-phase32.spec.ts` with `data-shot` hooks for:
      - the web move sheet with the pairing prompt showing;
      - the return-to-office done state;
      - the mobile unavailable prompt (Change on a booked session → Unavailable → Save → the two
        choices);
      - the Admin Day rail's Notifications card and the new Draft List, staged with the Demo actions
        menu;
      - the Notifications page after the busy morning, on page 1 and page 2;
      - the Day view afterwards with the moved List on the colleague's row.
    - `visual/pwa-device.spec.ts`: on Mobile Availability, open the Demo chip, run "Colleague moves
      a List into my free session", and assert the Moved to you panel and the List on Forward Lists.
      Then return one of Souter's Lists to the office from List detail and assert it has left Forward
      Lists.
    - `data-shot` hooks for the capture recipes (Move affordance, Move sheet, pairing prompt,
      unavailable prompt, Moved to you panel, Notifications card, Notifications page). The recipes,
      the re-capture and the ATLAS edits are the standing step in "Catalogue screenshots" below, run
      after the review pass.
16. **Finish green:** `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots`,
    then the Catalogue screenshots step (after the review pass) and `npm run verify:board`.
    `persistMigrate.test.ts` covers the bump. `pwaPurity.test.ts` passes: the sheets, helpers,
    selectors and trigger bodies import nothing from `apps/admin`, `apps/demo` or `shell`.

## Demo triggers

The anaesthetist's move and the unavailable prompt are normal mobile and web use, and nothing waits
on the office. Two things still need a button. The office side needs a colleague's move (and a
pool with enough rows to page) to look at without first playing that colleague. The handset needs to
show the receiving side, because the anaesthetist apps run only as Dr Souter. Register both in Phase
14's registry. Add nothing to the Control Panel page, which lists them under their screens.

| id | Label | Screen (routes) | Surfaces | Effect | Disabled when |
|---|---|---|---|---|---|
| `colleague-moves-list-to-office` | Colleague moves a List to the office | Admin · Day (`/admin/day/:dateISO`) and Admin · Notifications (`/admin/notifications`) | bar | Choices: **One move** runs `stageColleagueMoveToOffice` on the date in the URL, or the next date with a candidate: `moveListToOffice` as the List's owner, with the vacated session set to Unavailable. The new Draft List and its notification show on the Day rail without switching persona. Message, filled from the move: "Dr Hughes returned Thu 23 AM (St George's) to the office. It is now a Draft List." (the Draft List word from `scheduleTerms`). **A busy morning (8 moves)** runs `stageBusyMorning`: eight colleagues' moves, alternating returns and hand-ons, so the Notifications page shows newest first over two pages | no candidate ("No List on the schedule fits") |
| (product, not registered) | Mark a booked session not available | Mobile · Availability and My calendar, Web · My availability | product UI | Work item 11: the prompt "Return to the office" or "Hand on to a colleague". It stays in the product because it is a real user action. | the session holds no List of the persona's |
| `colleague-moves-list-to-me` | Colleague moves a List into my free session | Mobile · Availability (Phase 29's Find cover layer, `/mobile/availability`) | pwa | `stageColleagueMoveToPersona` for Dr Souter. It picks a colleague's List in a session where Souter's Slot is open and empty, then runs `pushListToSlot` as that colleague. Souter sees the Moved to you panel and the List on her schedule. Use Phase 14's stand-in badge. Message: "Dr Hughes moved Thu 23 AM (St George's) into your free session." | no candidate ("No colleague List fits one of your free sessions") |

There are no office stand-ins: nothing in this phase waits for the office (D7). Phase 32a adds the
single-Booking stand-in beside the PWA entry.

## Out of scope

- **Any acceptance or confirmation step**, by the colleague or the office. D7 ruled both out.
- **Moving a single Booking**, the doer rule and "Move to the anaesthetist who did it" (US-01.4.6,
  US-01.4.7, DM-06, DM-42, OQ-85): Phase 32a, on this phase's helpers and pool.
- **Anaesthetists creating ad hoc Lists from a free session.** They only move Lists.
- **The update email** after a move (US-02.3.3, US-02.3.4, OQ-46, OQ-69, OQ-82): Phase 35, from the
  notification.
- **Updating the payable half of a moved prepaid Booking's draft pair**, the trust account and
  refunds (US-06.5.4, FT-06.5): Phase 41. This phase keeps the agreed amount and runs the re-check.
- **The office reassigning a List** (US-01.4.1): Phase 28. **Draft List assignment**: Phase 31.
- **An anaesthetist-kept blacklist** (OQ-43's "two lists") and **OQ-43's other question**.
- **Notification read state, marking actioned, expiry or archiving**, other sources posting to the
  pool, and a real channel (push, SMS, email) (OQ-79).
- **Several Lists in one prompt**: one List per prompt (work item 11).
- **The office's sickness entry**: stays a conflict (OQ-81 part 3).
- **Moving a SUBMITTED or AUTHORISED List**: the office's Reassign. **Two-way exchanges**: two
  moves.
- **"Play the office"** (RV-22 scaffold): unchanged.
- The full S2 rewrite: Phase 44. The Schedule milestone read: Phase 32a.

## Manual test checklist

The agent runs every item itself in the running app and reports it with evidence; none is handed
to the owner (ROADMAP.md "Owner review: agents test themselves").

- [ ] Reset. Admin Day's Notifications card shows its empty state. Nothing anywhere says "Cover
  requested", "Offer cover", "Tap to ask", "swap", "slot", "notified when someone accepts" or "the
  office notified".
- [ ] Web, Availability (as Dr Souter), the seed test's day:
  - her own List cell shows Move;
  - a colleague's Free cell in that session opens the sheet preselected;
  - a colleague's Free cell in a session where she has no List is status only.
- [ ] In the sheet, choose the colleague blacklisted with the List's surgeon. The warning-tint prompt
  reads "Check with the office before moving this List to Dr ..." and shows no reason, no surgeon
  name and no blacklist word, and the button reads "Move List anyway". Choose a clean colleague: the
  prompt goes.
- [ ] Move to the clean colleague, keeping Free (the default). The tick and "Moved to Dr ..." show at
  once. The List has left Souter's Lists, and her old cell shows Free.
- [ ] Admin Day on that date:
  - the List and its Bookings sit on the colleague's row;
  - the Notifications card's top row names both anaesthetists, and the drawer line reads "Moved here
    by Dr Souter";
  - the List's History shows "List moved by its anaesthetist", plus the blacklist acknowledgement
    when the prompt was shown;
  - 15a's To-do card shows nothing new for the move.
- [ ] Mobile, List detail on another Souter List → Move this List → Return to the office →
  Unavailable → Move List. Admin Day: a Draft List with its hospital, surgeon and Bookings, flagged
  unassigned, with origin "Moved to the office", and a notification. Souter's session shows
  Unavailable. The sheet never says "Draft List".
- [ ] Mobile Find cover, My availability: Change on the seed test's booked session → Unavailable →
  Save. The prompt offers Return to the office and Hand on to a colleague; nothing changes until one
  is chosen. Choose Hand on: the List is on the colleague's row in Admin Day, Souter's session is
  Unavailable, and the notification says it was handed on when marking the session not available. No
  conflict is raised, and no "flagged for the office" line shows. Repeat on My calendar with Return
  to the office: the Draft List's origin reads "Returned: anaesthetist unavailable".
- [ ] Web My availability, set a short range of days off that covers two booked sessions: the step
  lists both, and the prompt runs "1 of 2" then "2 of 2"; the range applies after both.
- [ ] Admin, office side: marking Souter sick on a booked session (the office's path) still raises the
  conflict and keeps the List.
- [ ] My calendar (mobile and web), tap a day holding a movable Souter List: the panel offers
  **Move this List**, which opens the same sheet.
- [ ] Admin Day, Demo actions, **Colleague moves a List to the office**, One move: a colleague's List
  becomes a Draft List and its notification tops the card. Then **A busy morning (8 moves)**: the
  Notifications page shows the newest first over two pages, Older and Newer work, and the page reads
  the same after switching to another Admin screen and back.
- [ ] PWA (`npm run build:pwa` and preview), Mobile Availability: the Demo chip offers **Colleague
  moves a List into my free session**. Running it shows the Moved to you panel and the List on
  Forward Lists with "New". The chip is absent where no entry applies.
- [ ] The Control Panel lists the Admin trigger under Admin · Day with an Open screen link, and the
  PWA entry as "Shown in the installed PWA".
- [ ] S2 Beats 1 to 4 run unchanged from a reset (Rutherford's Wed 22 AM reassignment to Sharma is
  untouched).
- [ ] The mobile app, web app and PWA never show a blacklist reason, a surgeon name in the prompt, or
  the blacklist word.
- [ ] No en or em dash in any new copy. Teal is the only action colour, and there is no crimson on
  any new control, pill or notice.
- [ ] Catalogue screenshots: the recipes for US-01.4.3, US-01.4.5, US-01.5.5, US-13.8.1 and
  US-13.8.2 are created or updated, any recipe this phase broke is re-pointed, a full
  `npm run capture` ends with no failed recipe and no story without a recipe, the covered items' new
  shots are checked by eye, and `npm run verify:board` is green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots` and `npm run verify:board` are all green.

## Demo guide updates

Patch these in the same session (ROADMAP rule). The Schedule milestone ("After 32a") and its
consistency read are Phase 32a's; this phase patches its own beats:
- `docs/demo-guide/03-demo-script.md`:
  - **S2:** add **Beat 3b, "an anaesthetist moves her own List"**, after Beat 3.
    - **Click:** Web Availability as Dr Souter, the seed test's day → her List's Move → the
      colleague → Move List. Then Admin Day on that date: the List on the colleague's row and the
      notification on the rail. Optional variants:
      - pick the blacklisted colleague to show the prompt;
      - on mobile, mark the second seed-test session Unavailable (Change) and choose Return to the
        office, to show the prompt and the Draft List;
      - Admin Day, Demo actions, Colleague moves a List to the office, then A busy morning, to show
        the Notifications page paging.
    - **Say:** "Anaesthetists usually find their own cover. Here she moves her List herself, to a
      colleague who is free or back to the office, and it happens at once: AA runs a high-trust
      system. The List moves with its Bookings and history, exactly like the office's own
      reassignment. If she marks a booked session off, the app asks where its List goes, so no List
      is left with someone who will not be there. Every move lands in the office's shared
      notifications, which are not to-dos: nothing needs approving."
    - **Expected:** the done state, the List on the colleague's row, and the notification.
    - Beat 3's Say line gains one clause: the office-led reassignment is for when nobody has arranged
      cover; Beat 3b is the anaesthetist-led path.
  - **S2 Discovery points:** add OQ-43 (what the anaesthetist's warning says, and one blacklist or
    two), OQ-84 (what the vacated session becomes) and OQ-79 (what else posts to the pool, and how
    long notices last). Drop "the exact List-reassignment mechanics" (OQ-08 is answered) and any
    OQ-65 point (answered).
  - The "Sheets and drawers are deliberately not in the URL" line (:89): "the cover request" becomes
    "the move sheet".
  - Any S2 line from Phases 29 to 31 that says blocking a booked session flags a conflict or "the
    office notified": it now asks where the List goes.
- `docs/demo-guide/02-workflows-and-handoffs.md`, **Workflow 3**, becomes "find cover: the
  anaesthetist's own move, or the office's reassignment":
  - step 1 changes from "offers a Free session for cover" to "moves one of her Lists to a free
    colleague or returns it to the office, also when she marks a booked session off";
  - add the handoff: the move posts to the office's shared notifications;
  - replace the "What not to say" line: there is no claiming of open shifts, no acceptance step, and
    notifications are not tasks;
  - the readiness row "Cover request and office List reassignment" becomes "Anaesthetist's own List
    move, the notification pool, and office List reassignment", Phases 28 and 32 (32a adds the
    single-Booking move).
- `docs/demo-guide/01-personas-and-responsibilities.md`: "See availability for possible cover or
  swaps", "Use Availability to offer a Free session or request cover" and "Find Free anaesthetists
  and request cover" become "move one of your Lists to a free colleague or back to the office". The
  office gains "See the team's notifications of Lists anaesthetists have moved, and assign the Draft
  Lists they return".
- `docs/demo-guide/04-presenter-cheat-sheet.md`:
  - the "Claim/sign up for a shift" row now reads "Move your own List to a colleague's free session or
    back to the office, at once";
  - RFP ambiguity 5 gains the own-move path, D7 and D15;
  - add one line for the Admin trigger (with its busy-morning choice) and the PWA stand-in.
- `docs/demo-guide/README.md`: "find Free sessions and request or offer cover" becomes "find Free
  colleagues and move a List to them".
- `docs/demo-guide/master-demo-guide.html`: mirror every edit above (S2 Beats 3 and 3b, discovery
  points, Workflow 3, personas, cheat sheet).
- **Control Panel scenario text** (`apps/demo/DemoControlPanel.tsx`, S2): the blurb adds "an
  anaesthetist moving her own List, and the office's notifications"; the message adds "then, as Dr
  Souter on Web Availability, move a List to a colleague and see it on Admin Day's notifications".
- Read the S2 section of `master-demo-guide.html` once against the run sheet after the edits; the
  full milestone read is 32a's.

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19),
run after the review pass and before the PROGRESS.md entry. Re-run
`node docs/prototype-build/catch-up/tools/recipe-status.mjs 32` first: earlier phases may have
changed these recipes since this plan was written. Work item 15 only re-points the Playwright specs
and makes sure the `data-shot` hooks exist. The recipes and the capture run belong to this step.

**Covered items.** When the phase is done, each recipe in `requirements-board/capture/recipes/`
matches what was built:

| Item | Recipe at plan time | When this phase is done |
|---|---|---|
| [US-01.4.3](../../../../requirements-board/requirements/stories/US-01.4.3.md) Anaesthetist moves their own List | partial · `cover-request` (web, mobile; the old cover sheet) | captured. Rename the shot to `move-list` (the old name describes the retired cover flow; say so in the PROGRESS entry). Web: `/web/availability`, states `sheet` (the Move sheet from the persona's own List cell) and `done` (the "Moved to Dr ..." tick); highlight the dialog. Mobile: `/mobile/availability`, states `sheet` (the bottom sheet opened from the own List's Move) and `to-office` (the "Return to the office" confirm with the vacated-session choice); highlight `[data-aa-mobile-product] [role=dialog]`. Add a `moved-to-you` state on mobile after the `Colleague moves a List into my free session` stand-in (AC2, the notice). Caption in the catalogue's words: "Move your own List to the office or into a colleague's free session, with no acceptance and no confirmation". Empty `absentReason`, set `status` captured |
| [US-01.4.5](../../../../requirements-board/requirements/stories/US-01.4.5.md) Blacklist warning when an anaesthetist reassigns their own List | absent (stub: "Not built yet") | captured. Shot `move-pairing-prompt` on web and mobile: the Move sheet with a colleague blacklisted with the List's surgeon chosen (the seed test pins the Souter List and colleague), the warning-tint prompt "Check with the office before moving this List to Dr ..." and the "Move List anyway" button. Highlight the prompt. The shot must show no reason, surgeon name or blacklist word. Caption: "The anaesthetist is warned before moving a List to a colleague the office has flagged, and can still go ahead" |
| [US-01.5.5](../../../../requirements-board/requirements/stories/US-01.5.5.md) Mark unavailable while holding a List | absent stub (Phase 30 creates it: "Not built yet: catch-up Phase 32 builds this."), or none | fill it in, status captured, empty `absentReason`. Shot `unavailable-prompt` on mobile (`/mobile/availability`, the My availability card's Change on the seed test's booked session → Unavailable → Save) and web (`/web/availability/mine`, the panel's status change to Unavailable), states `prompt` (the two choices) and `returned` (after Return to the office: the session Unavailable and the List gone from the persona's schedule). Add an admin state on `/admin/day/<date>` showing the new Draft List with its Bookings. Highlight the sheet, then the session. Caption: "Marking a booked session not available asks whether its List returns to the office or goes to a colleague" |
| [US-13.8.1](../../../../requirements-board/requirements/stories/US-13.8.1.md) See the team's notifications | none (create it) | create, status captured. Admin only. Shot `notification-pool`: `/admin/day/2026-07-21` after the `Colleague moves a List to the office` trigger, highlighting the Notifications card; then `/admin/notifications` after the busy-morning choice, states `page-1` and `page-2` (Older), highlighting the table. Caption: "One shared pool of notifications for the admin team, newest first, separate from the to-do list" |
| [US-13.8.2](../../../../requirements-board/requirements/stories/US-13.8.2.md) Notify the team when an anaesthetist moves a List | none (create it) | create, status captured. Admin shot `move-notification` on `/admin/notifications`: states `to-colleague` (staged with the busy-morning choice of the Admin trigger, or by an earlier web step moving a Souter List; highlight a row naming both anaesthetists) and `to-office` (a return row, with its link opening the Draft List). Caption: "Every List an anaesthetist moves posts a notification naming who moved it and to whom" |

**Recipes this phase breaks.** Found by grep at plan time:
- `US-01.4.3.json` is the old cover sheet ("Open for booking", "Tap to ask"): rebuilt in the table above.
- `US-01.2.1.json`: Phase 29 drops its mobile `pm-blocked` state (the Block button and `availability-block-pm` go) and re-shoots `my-availability` with the Change button. If `pm-blocked` or its caption "a conflict is flagged and the office notified" survives, drop it (the booked-session case is US-01.5.5's shot now). Check its `my-availability`, `calendar`, `sheet` and web `availability-grid` states still pass with the Move affordance and the Moved to you panel on the page.
- `US-01.4.2.json` (admin, web and mobile finder) clicks free cells and "Free only". The web grid subtitle changes to "Find cover fast. Move one of your Lists into a colleague's free session." and free cells become tappable only with a movable List. Re-check the highlights and captions.
- `US-01.5.2.json`: Phase 30 left it partial with the reason "... An anaesthetist marking a booked session unavailable is still flagged until Phase 32's return-or-assign." Remove that sentence now it is built; if no other reason remains, set `status` captured. Phase 29 dropped its mobile `unavailable-conflict` shot; if it survives, drop it. Its admin shots (the office-recorded sickness and the hospital closure) stay.
- `US-01.5.3.json` (`my-availability`: `month`, `series-sheet`, `instance` after Phase 29) sits on the calendar that gains Move this List and the prompt. Check the click targets, and that no caption claims a conflict for the anaesthetist's own unavailability.
- `US-01.3.3.json` and `US-02.3.1.json` click "open for cover", which this phase keeps. No change expected.
- `US-01.1.1.json` (mobile `my-lists`) shows the free row that loses "Offer cover" and gains "Open for bookings": no step to fix, but the image changes.
- `US-01.4.6.json` (absent stub, "Not built yet: catch-up Phase 32 builds this.") is Phase 32a's now: change only its `absentReason` to "Not built yet: catch-up Phase 32a builds this." so the catalogue does not claim this phase built it. Add the same stub for `US-01.4.7` if the `--dry` run reports it without a recipe.
The `--dry` run is the final check.

**ATLAS.md.** Update Routes (the Move affordance, the prompt and the Moved to you panel on
`/web/availability`, `/mobile/availability` and the calendar routes; the new `/admin/notifications`),
Seed data worth shooting (the pinned movable Souter List, the pairing-prompt List and colleague, and
the unavailable-prompt session from the seed tests; the pool starts empty, so a recipe stages it with
the trigger) and Existing hooks (new `data-shot` hooks for the Move sheet, the pairing prompt, the
unavailable prompt, the Moved to you panel, the Notifications card and the Notifications page).

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
- **D7 as answered.** There is no request record, acceptance, office confirmation or pending state.
  Every move takes effect in one commit, and nothing waits for anyone.
- **One move, one place.** All three actions run one own-move core; a hand-on runs Phase 28's move
  core and a return runs Phase 31's conversion. There is no second copy of either. Each move writes
  exactly one `list.ownerMove` (no extra `list.reassign`) and exactly one notification. The receive
  rule exists once, and `pushTargets` and `moveListToSlot` agree on it.
- **Ownership is enforced in the store.** An anaesthetist cannot move someone else's List, a Draft
  List, a SUBMITTED List or a past List, even by calling the action directly.
- **US-01.5.5 holds on every path.** No anaesthetist control (one-off, panel, range, series, the
  instance edit) can leave a booked session at a closed status with its List still there: the store
  refuses with `holdsList`, and the prompt is the only way through. The office's sickness entry and
  hospital closures still raise the conflict. A return keeps hospital, surgeon and Bookings.
- **The pool (FT-13.8).** One append-only record per move, written inside the move's commit by
  `postNotification` alone; nothing updates or deletes one. No per-user or read state, no badge, no
  Clear. The selectors take no user. Notifications never reach 15a's to-do list, and moves write no
  Warning. The snapshot fields keep old notices true after later moves. Paging is exact on the demo
  clock.
- **The blacklist never leaks and never blocks.** The mobile app, web app and PWA receive only
  `pairingPromptForAnaesthetist`'s message: no reason, surgeon name, entry id or blacklist word in
  the DOM, props, titles or aria labels. No path refuses or hides a colleague for being blacklisted.
  The colleague list is not grouped. The acknowledgement is written once, on the List, and the
  notification carries no blacklist fact.
- **Re-check coverage.** Every Booking moved by any of the three actions gets `syncPrepayment`
  exactly once, after commit (not twice through `moveListToSlot`'s own call), and a Draft List
  assignment re-checks too. A sent prepayment keeps its amount (D20); a held one follows 27's rule.
- **RV-15 and RV-30 are fully gone, and so are "swap" and "slot" in copy.** No `coverRequest`,
  `requestCover`, `RequestCoverSheet`, "Offer cover", "Cover requested", "Tap to ask", "someone
  accepts" or "the office notified" remains, and "swap" appears in no app copy, identifier or test
  name.
- **Determinism and seed hygiene.** `PERSIST_VERSION` is bumped. The canvas is unchanged and the pool
  seeds empty. The triggers pick deterministically and never touch `SCRIPTED_BEAT_SCHEDULE`.
- **Triggers and PWA purity.** The Admin entry is bar only, on Admin Day and Notifications. The
  stand-in is PWA only. Bodies live in `src/store`. The new sheets, helpers and selectors import
  nothing from `apps/admin`, `apps/demo` or `shell`.
- **Design and copy.** The sheet keeps the Mobile Availability anatomy and is a bottom sheet on
  mobile and a dialog on web. The prompt uses the warning tint; notifications and the colleague's
  notice use info or neutral. Actions are teal only, with no crimson on controls or pills, and there
  are no en or em dashes.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry; ROADMAP.md "Owner review: agents test
  themselves"): the defaults built for open questions (OQ-43's reason-free prompt, OQ-84's ask with
  Free as default, OQ-79's keep-everything pool with no read state and a page size of six), the
  assumed readings (the blacklist prompt and the notification on a hand-on from a session being
  marked not available; one List per prompt for a range of days off; the Notifications card's place
  on the Day rail), anything logged rather than fixed, and the screens worth a look, each with its
  route and persona (Web Availability and My availability as Dr Souter; Mobile Find cover; Admin
  Day's Notifications card; `/admin/notifications`).
- **Status row** for catch-up Phase 32, and a phase entry with:
  - the drift-check result: items changed or not, and the status of OQ-43, OQ-79 and OQ-84 (built as
    recommendations or as answered), with D7, D14, D15 and D20 built as answered;
  - what was built, and what was removed (the cover marker, its action, sheet, labels and tests, and
    the anaesthetist's conflict flag on a booked session);
  - the `PERSIST_VERSION` bump (from and to);
  - the Souter List, pairing-prompt List, unavailable-prompt session and trigger candidates the seed
    tests pin, for the demo guide;
  - the tests added (domain, store, pool, triggers, Playwright);
  - the review pass;
  - the Catalogue screenshots result: recipes created or changed, the REPORT.md counts (captured, partial, absent, failed) before and after, and any partial reason handed to a later phase.
- **Decisions log:**
  1. **Supersedes** the 2026-07-21 "New interactions the design added" entry's mobile request-cover
     flow and web "Ask to cover" links. An anaesthetist now moves one of her own Lists. Offering an
     empty free session is removed (RV-15). The mockup's "tap a colleague's free session" gesture is
     kept where the persona has a List in that session. Also supersedes the July cover-request flow
     generally, and RV-15's planned office confirmation.
  2. **D7 (OQ-39, answered 2026-10-01):** the anaesthetist returns her own List to the office (a
     Draft List) or moves it into a colleague's free session, at once. There is no acceptance and no
     office confirmation. Withdrawing is the return to the office.
  3. **D14 (OQ-64 part 3) and US-01.5.5:** marking a booked session not available asks "Return to
     the office" or "Hand on to a colleague"; the store refuses the plain status change for an
     anaesthetist, in 29's shared per-Slot write helper. **Supersedes** the interim of Phases 29 and
     30 (an anaesthetist's closed status over her List is flagged until Phase 32) and what remained
     of the 2026-07-22/23 availability-reconciliation rulings for the anaesthetist's block (RV-30);
     the office's sickness entry and hospital closures keep the derived conflict (US-01.5.2, OQ-81
     part 3). One List per prompt.
  4. **D15 (OQ-65, answered 2026-10-02):** every move posts one append-only notification to the
     Admin App's shared pool, one for the whole team, newest first and paged, separate from the to-do
     list and from the audit trail; the colleague sees the List with a notice read from the same
     record. **OQ-79, open, recommendation built:** List moves only, every notice kept, no expiry and
     no read or actioned state; the switch point is `NOTIFICATION_POOL_RULE`.
  5. **OQ-43, open, recommendation built:** the anaesthetist sees a reason-free prompt, and her
     colleague list is not grouped. **Amends** Phase 17's rulings that the blacklist stays out of the
     anaesthetist apps and that an anaesthetist actor's writes never check or log it: US-01.4.5 needs
     both on the move path. The list itself and its reasons stay Admin only.
  6. **OQ-84, open, recommendation built:** the anaesthetist who moves a List chooses what her
     session becomes, Free by default; the switch point is `VACATED_SESSION_DEFAULT`. The office's
     reassign is unchanged.
  7. **D20 (OQ-70):** a moved prepaid Booking keeps its agreed amount and the doer is paid. The
     re-check runs on every move. Updating the payable half of a raised pair is Phase 41's.
- **Handoff notes:**
  - For **32a**: `canReceiveList` and `pushTargets` are the receiver rule to extend to a single
    Booking found by search; `ownMoveCore`, `postNotification`, `pairingPromptForAnaesthetist`,
    `MoveListSheet`'s anatomy, `anaesthetistActor`, `SCRIPTED_BEAT_SCHEDULE` and the colleague's
    `movedToMe` panel are there to reuse. Add a `bookingMoved` notification kind (OQ-85's
    recommendation) as a new member of `Notification.kind`, posted through `postNotification`. The
    Schedule milestone read is 32a's.
  - For **35**: each notification row (card and page) is where "Draft update email" goes; the row's
    `listId` and the move's audit entry are the change to pick from the history. A move to a
    colleague is a cover change, so the email goes to the hospital contact (OQ-46). Use the message
    the anaesthetist typed. Whether the email should go automatically is OQ-82.
  - For **41**: `pushListToSlot`, `moveListToOffice` and `markUnavailableAndMoveList` already
    re-check with cause `listMoved`. The payable-half update of a raised pair (US-06.5.4) hooks onto
    `list.ownerMove`.
  - For **38a**: the calendar search should find a Booking on the List it moved to.
  - For **44**: S2 Beat 3b and Workflow 3 are patched, not rewritten. The PWA parity audit should
    walk the receiving side with the stand-in.
  - If OQ-43, OQ-79 or OQ-84 is answered later, the switch points are `ANAESTHETIST_PAIRING_PROMPT`,
    `NOTIFICATION_POOL_RULE` and `VACATED_SESSION_DEFAULT`.
