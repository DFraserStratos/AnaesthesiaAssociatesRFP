# Phase 32 · Anaesthetist moves their own List

> The file keeps its historical name (`phase-32-swap-requests.md`) because the plan tools pin the doc
> path in `plan.json`. "Swap" is no longer catalogue vocabulary. It must not appear in app copy,
> store action names, audit codes, type names or test names. Use "move" and "reassignment".

**Requirements covered:**
[US-01.4.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.4.3.md) Anaesthetist moves their own List (Verify) ·
[US-01.4.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.4.5.md) Blacklist warning when an anaesthetist reassigns their own List (Proposed) ·
[US-01.4.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.4.6.md) The List's anaesthetist did its procedures (Verify, new at 501b0b8) ·
[DM-05](../analysis/domain-model-delta.md#dm-05) An anaesthetist moves their own List with no request and no office confirmation (replaces the swap request) ·
[DM-06](../analysis/domain-model-delta.md#dm-06) Whoever submits a List did its procedures: a Booking done by someone else moves to their List, and its payable follows ·
[RV-15](../analysis/reverse-check.md#rv-15-cover-flow-puts-the-request-on-the-colleagues-free-session-with-no-office-confirmation) The cover flow puts a marker on a free session that never completes (Rework). RV-15's "Action" line ("ends in an office reassignment") is out of date: D7 ruled out office confirmation, and this doc builds the answer.
Also touches, without closing:
[US-01.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.4.1.md) (the office reassignment and its one from/to/by/when event; Phase 28 built the move core this phase reuses. Its new note, the update email after a cover change, belongs to Phase 35),
[US-01.4.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.4.2.md) (the availability view a push to a colleague starts from; Phase 29),
[FT-01.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-01.6.md) and [US-01.6.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.6.1.md) (the Draft List a move to the office creates; Phase 31),
[US-01.3.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.3.5.md) and [US-13.6.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.6.3.md) (the office-side warning and the blacklist master; Phase 17),
[US-06.3.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.3.5.md) (the prepayment re-check, built in Phase 27; this phase calls it from both moves),
[US-06.5.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.5.4.md) (a moved prepaid Booking: the agreed amount stands here; repointing the prepayment's draft payable is Phase 41's),
[US-02.3.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-02.3.3.md) (the update email the office is offered after a move; Phase 35 hangs it on this phase's office notice).
**Answered and built as answered:** [OQ-39](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-39.md) (owner decision **D7**, 2026-10-01). In their app the anaesthetist picks one of their Lists and starts a move. They either move it to the AA office, where it becomes a Draft List, or push it into a colleague's free Slot from the availability view. The colleague does not accept and the office does not confirm ("a high-trust system"). Withdrawing from a List is the same move to the office. [OQ-08](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-08.md) (answered: the owner reference on the List changes).
**Open, built as the recommendation, labelled provisional in one place each:**
[OQ-65](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-65.md) (who is told: the office is notified and offered the cover-change email, and the colleague sees the List appear with a notice; the constant `OWN_MOVE_NOTICE_RULE`),
[OQ-43](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-43.md) (what the anaesthetist's warning says: a short prompt with no reason; the constant `ANAESTHETIST_PAIRING_PROMPT`. One blacklist or two is still with Ben),
[OQ-70](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-70.md) (a moved prepaid Booking keeps its agreed amount, and the anaesthetist who does it is paid; the doc comment on `moveBookingToDoer`).
**Depends on:** Phase 17 (the pure blacklist helper `src/domain/blacklist.ts`, `BLACKLIST_TERM`, `BlacklistWarning` with `showReason` off by default, the `list.blacklistAcknowledged` rule and the seeded pairings). Phase 27 (the prepayment re-check `syncPrepayment(api, bookingId, cause)`, run as `ENGINE_ACTOR` after commit, which a move must call, and its agreed-amount rule: a sent prepayment keeps its amount, a held one is withdrawn and regenerated). Phase 29 (the availability calendar, its `AvailabilitySlotPanel`, `isOpenSlot`, and the Find cover layers on mobile and web). Phase 31 (Draft Lists that hold Bookings, a Draft List being a List with a `draft` trail; the internal `detachListToDraft` that unavailability uses; `assignDraftList`; and `shared/scheduleTerms.ts`, the one home of every user-facing Draft List word). Through them it also depends on Phase 28 (a List is its own record in a Slot; `moveListToSlot`, `placeListOnSlot` and the receive rule in `store/slotActions.ts`, with 17's acknowledgement and 27's sync already hung on `moveListToSlot`) and Phase 30 (conflicts reconcile on a move). Phase 14's trigger registry, Phase 15's Booking vocabulary and Phase 15a's `SubmitListSheet` confirm step are assumed throughout. This is the last phase of the Schedule track and a **milestone** phase: it ends with a consistency read of the master demo guide. Phase 35 follows and needs it.
**Estimated:** 2 sessions. **Session 1** ends green at work item 8: model, pure helpers, seed tests, the three store actions with tests, the derived notices, audit labels, and the cover marker retired. The cover affordances are simply gone at that point and no scripted beat uses them, so S1 to S5 still run. **Session 2** builds items 9 to 15: the shared move sheets, the entry points on mobile and web, the Booking action on all three apps, the Admin notices, the triggers, Playwright and capture recipes. Then the demo guide, the milestone read, the review pass and the PROGRESS entry.

## Goal

Replace the cover-request marker with the catalogue's move, as owner decision D7 answered it.

Today an anaesthetist can put a `coverRequest` marker on a **free** session. It is an "offer" on
their own empty session or a "request" on a colleague's. The marker stays `pending` forever, the
office never sees it, and nothing moves (RV-15). The success copy says "You will be notified when
someone accepts", which the catalogue now rules out. Meanwhile a Booking can only change anaesthetist
when the office moves it, and nothing re-checks the prepayment when it does (US-01.4.6).

This phase:

- lets an anaesthetist pick one of **their own** upcoming DRAFT Lists, from the List itself or from
  the availability view on mobile and web, and **move** it:
  - **to the office**: it becomes a Draft List (Phase 31) with its Bookings, waiting for the office
    to assign it. This is also how an anaesthetist withdraws from a List;
  - **into a colleague's free Slot**, picked from the availability view for that day and session.
    If the colleague is blacklisted with the List's surgeon, the anaesthetist sees a short warning
    with no reason (OQ-43's recommendation) and can still go ahead.
- makes both moves take effect at once. There is no request record, no acceptance and no office
  confirmation. Each is one audited from/to/by/when event through the same cores the office uses
  (Phase 28's move, Phase 31's conversion), so Bookings, history and conflicts behave as they do for
  the office;
- tells people as OQ-65 recommends, derived in one place from the move's audit row. The office sees
  a notice on the Day view and in the Slot drawer, which Phase 35 turns into the cover-change email
  offer. The colleague sees the List appear on their schedule with a "Moved to you by Dr ..." notice;
- adds the doer rule (US-01.4.6). Whoever submits a List did every procedure on it. **Move to the
  anaesthetist who did it**, on a Booking in all three apps, moves the Booking onto that colleague's
  List for the same day and session, creating the List in their Slot if needed. The payable follows
  the Booking, and Phase 27's prepayment re-check runs, keeping a sent prepayment's agreed amount
  (OQ-70);
- retires `CoverRequest`, `Slot.coverRequest`, `requestCover`, `RequestCoverSheet` and every "Offer
  cover", "Tap to ask", "Cover requested" and "notified when someone accepts" string;
- registers two demo triggers. The Admin Day trigger "Colleague moves a List to the office" stages
  another anaesthetist's move. The PWA-only stand-in "Colleague pushes a List into my free Slot"
  shows the receiving side on the handset.

## Before you start: drift check

1. Diff the catalogue for this phase's items against the plan's snapshot:

   ```
   git diff 501b0b8 -- "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-01.4.3.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-01.4.5.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-01.4.6.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/FT-01.4.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-01.4.1.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-01.4.2.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-01.3.5.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-13.6.3.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/FT-01.6.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-01.6.1.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-02.3.3.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-06.3.5.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-06.5.4.md" "docs/discovery-reference/Updated Requirements/catalogue/questions/OQ-39.md" "docs/discovery-reference/Updated Requirements/catalogue/questions/OQ-43.md" "docs/discovery-reference/Updated Requirements/catalogue/questions/OQ-65.md" "docs/discovery-reference/Updated Requirements/catalogue/questions/OQ-70.md" "docs/discovery-reference/Updated Requirements/catalogue/questions/OQ-08.md" "docs/discovery-reference/Updated Requirements/domain-model.md"
   ```

   If an item changed, re-read it and adjust the work items before planning. If a covered story is
   now Retired or Future, drop it and say so in the PROGRESS entry. If US-01.4.3 goes, the whole
   move goes, but the RV-15 removal of the cover marker stays. If acceptance criteria were added to
   US-01.4.3 or US-01.4.5 (neither has any at 501b0b8), map each one to a work item. US-01.4.6 has
   three; work item 4 maps them.
2. **D7 / OQ-39 is answered: build it.** There is no office confirmation, no acceptance step and no
   request entity, and the UI carries no provisional hint about it. If OQ-39 has been reopened or
   reworded, stop and say so before building item 4.
3. **OQ-65 (who is told).** If it is still open, build the recommendation exactly as work item 5
   describes: one rule constant `OWN_MOVE_NOTICE_RULE`, and one small provisional caption ("Who is
   told about a move is still being confirmed with AA") on the move sheet's done state only. If it
   is answered:
   - "Office only": drop the colleague's notice and keep the List appearing;
   - "Nobody, audit only": drop both notices and keep the List drawer's history line;
   - "And the hospital is emailed": that is Phase 35's button. Record it for 35.
   Change only `OWN_MOVE_NOTICE_RULE` and the selectors behind it.
4. **OQ-43 (the anaesthetist's warning).** If it is still open, build the recommendation: a short
   prompt with no reason, no surgeon name and no "blacklist" word, in one constant
   `ANAESTHETIST_PAIRING_PROMPT`, with the provisional hint beside it. Possible answers:
   - "say the surgeon has asked not to work with this colleague": change only the constant;
   - "show the reason": the anaesthetist helper returns the reason too; say so in the PROGRESS entry;
   - "two lists, anaesthetists keep their own" (Greg's picture): Phase 17's `keptBy` is the seam.
     Building the anaesthetist's own list is new scope, so note it for a follow-up phase and do not
     build it here.
   OQ-43's second question (the anaesthetist does not want the surgeon) stays out of scope.
5. **OQ-70 (a moved prepaid Booking).** If it is still open, build the recommendation: the agreed
   amount stands, the patient is not billed again, and the doer is the payee. Put it in one doc
   comment on `moveBookingToDoer`. Repointing the prepayment's draft payable is Phase 41's
   (US-06.5.4). If OQ-70 is answered "credit and re-prepay at the new rate", stop and say so, because
   that changes 27's re-check and 41.
6. **Baseline.** Confirm Phases 14, 15, 15a, 17, 27, 28, 29, 30 and 31 are DONE in PROGRESS.md. Then
   read what they left, because this doc names planned files and functions:
   - Phase 28: `Slot`, `List.slotId`, `slotFor`, `listInSlot`, the internal `placeListOnSlot`, and
     `moveListToSlot(api, actor, listId, toSlotId, vacatedStatus)` with `reassignList` over it. Note
     its refusals (`officeOnly`, `listAuthorised`, `notFound`, `sameSlot`, `differentSession`,
     `slotOccupied`, `targetNotOpen`), which are the receive rule this phase reuses. Note whether it
     self-commits or already has a pure core. Its plan moves all of these, and `requestCover`, from
     `lifecycle.ts` to `store/slotActions.ts`, and puts Phase 17's `list.blacklistAcknowledged` and
     Phase 27's `syncPrepayment` call inside `moveListToSlot`; note exactly where each sits (inside
     the commit or after it), because `pushListToSlot` inherits them and must not repeat them. Note
     where the cover marker lives now (`Slot.coverRequest`, `requestCover(api, actor, slotId, ...)`,
     audit `slot.coverRequest`). The Admin Day drawer is `components/SlotDrawer.tsx`.
   - Phase 29: `SlotStatusKey`, `defaultSlotStatus`, `isOpenForBooking` in `domain/slotStatus.ts`,
     `isOpenSlot` (no List and open for booking, the only Slots its finder makes tappable),
     `AvailabilitySlotPanel` (a tapped Slot that holds a List shows the List), and the routes. Mobile Find cover is `/mobile/availability` (`AvailabilityScreen.tsx`) and My
     calendar is `/mobile/availability/calendar`. Web Find cover is `/web/availability`
     (`AvailabilityGrid.tsx`, whose "(you)" row has a "Change" link) and My availability is
     `/web/availability/mine`.
   - Phase 30: which conflicts `moveListToSlot` raises or clears, and the accept-and-flag path for a
     closed Slot.
   - Phase 31: a Draft List **is a List** with no `slotId` or anaesthetist and a `draft` trail
     (`DraftOrigin = 'request' | 'unavailable' | 'movedToOffice' | 'hospitalRow'`, `sinceISO`, `by`,
     `fromAnaesthetistId`). The one conversion is the internal
     `detachListToDraft(s, listId, { origin, by, fromAnaesthetistId })` in `slotActions.ts`, a
     draft-level helper that does not commit; it leaves the vacated Slot's status to the caller. A
     move to the office **must** call it with `origin: 'movedToOffice'` (31 already labels that
     origin "Moved to the office" in `ORIGIN_LABELS`). Also `UNAVAILABLE_LISTS_BECOME_DRAFT_LISTS`,
     `draftListCandidates`, `assignDraftList` (31's plan runs Phase 27's re-check per Booking after
     it; confirm), the Day dashboard's Draft List band, and `shared/scheduleTerms.ts` with its test
     that no literal "Draft List" or "Unassigned" appears in `src/apps` or `src/shared` outside it.
     The anaesthetist never sees the words "Draft List" (31's rule).
   - Phase 27: the exact name and causes of the re-check (`syncPrepayment(api, bookingId, cause)`,
     run as `ENGINE_ACTOR` after commit and idempotent, in its plan), which actions already call it
     (its plan lists `reassignBooking` and `reassignList`, and exports it for 32), and
     `prepaymentBasisAnaesthetist`: before an invoice is sent the List's anaesthetist decides (a
     move withdraws a held invoice and regenerates it at the new anaesthetist's rate, or clears it);
     once sent, the agreed amount stands (OQ-70). Phase 41 keys its payee repoint on the causes
     `listMoved` and `bookingMoved`, so use those (or tell 41 the names delivered).
   - Phase 25: where the payee is fixed (the per-Procedure lock written at authorise reads the
     List's owner), so a Booking moved before authorise pays the doer.
   - Phase 17: the exports of `src/domain/blacklist.ts` (`blacklistWarning`,
     `partitionAnaesthetistsForSurgeon`, `BLACKLIST_TERM`), `BlacklistWarning` and
     `useBlacklistWarning` in `src/shared/schedule/`, and the seeded pairings (as planned: Dr Priya Sharma with Ms A.
     Reid active, Dr Rawiri Hughes with Ms A. Reid ended; use what 17 actually seeded). This phase **amends** two Phase 17 rulings, because
     US-01.4.5 asks for it. The first is "an anaesthetist actor's store writes never check or log the
     blacklist": `pushListToSlot` now does both. The second is "keep the blacklist out of the mobile
     app, the web app and the PWA": the anaesthetist now sees the reason-free prompt. Record both in
     the Decisions log.
   - Phase 15a: `SubmitListSheet`'s confirm step (work item 12 adds one sentence to it).
   - Phase 15: `reassignBooking`, `MoveBookingFlow`, `BookingDetailBody`, `bookingsForList`.
   - Phase 14: the registry types (`DemoTrigger`, `choices`, `when`, `surfaces`, the stand-in
     `badge`), `demoTriggersFor(state, pathname, surface, published)`, `src/pwa/PwaDemoActions.tsx`,
     and the actors in `src/store/demoActors.ts` (`OFFICE_ACTOR`, `SOUTER_ACTOR`,
     `OFFICE_SIMULATION_ACTOR`).
   - Run `grep -rn "coverRequest\|requestCover\|RequestCoverSheet\|CoverTarget\|onCover\|offerCover\|onOfferCover\|askCover\|myFreeList\|Tap to ask\|Offer cover\|Ask to cover\|Cover requested\|Cover request sent\|someone accepts" aa-prototype/src aa-prototype/visual requirements-board/capture/recipes`
     to see every place the cover marker reaches after 28 and 29.
   - Read the current `PERSIST_VERSION` in `src/store/appStore.ts` (13 at the snapshot; 15 to 31
     will have bumped it) and bump it by one from whatever it is now.

## Reference

**Design files (convention 17):**
- `docs/design/Mobile Availability.dc.html` is the layout reference for the mobile move sheet. Tap a
  free session and the sheet slides up, with an avatar header, a slot line, a short explanation, "Add
  a message" and a teal action button, then the completion tick. Keep that anatomy; the content
  becomes "move my List here".
- `docs/design/Web Availability.dc.html` (the grid and its confirmed-cell state) and
  `docs/design/Web Dashboard.dc.html` (the header button slot and the "Who's free, next 5 days"
  chips) are the web references.
- `docs/design/Admin Day.dc.html` is the reference for the office notice: the attention area in the
  day band and the drawer.
- `docs/design/Design Language.dc.html` gives the tokens. Use warning `#A16207` (tint `#F9F0DC`,
  on-tint `#7C4D08`) for the pairing prompt, info or neutral for the move notices, success for the
  done state, the `sheet-in` and `complete-tick` motions, and pills (radius 999).
- Teal is the only action colour. Crimson stays identity only. The pairing prompt is attention
  (warning tint), never error red.

**Catalogue:** the covered items above; `domain-model.md` ("Slot, List and Draft List", "Surgeon,
surgeons' room and blacklist", and the prepayment section on a moved Booking); the evidence note
`catalogue/notes/2026-10-01-aa-meeting-with-greg.md` items #15, #16, #19, #22, #38, #39, #53 and #57;
the change log `changes/2026-10-01-requirements-update.md`.

**Analysis:**
- `docs/prototype-build/catch-up/GAP-ANALYSIS.md`: theme 2 ("Anaesthetist moves own List, no
  request"), "Remove or rework" (the CoverRequest line), the OQ-65, OQ-70 and OQ-43 uncertainty line,
  the DM-05, DM-06 and RV-15 rows, and the EP-01 table;
- `epics/EP-01.md` (#us-01.4.3, #us-01.4.5, #us-01.4.6) and `epics/EP-06.md` (US-06.3.5, US-06.5.4);
- `analysis/domain-model-delta.md` (#dm-05, #dm-06; also DM-02, DM-03 and DM-32, which this phase
  builds on);
- `analysis/reverse-check.md` (RV-15; S2 is the affected scenario);
- `analysis/prototype-map-apps-mobile-web.md`, `prototype-map-admin.md`,
  `prototype-map-store-seed.md`, `prototype-map-shared.md` and `prototype-map-shell-demo-pwa.md`.

**Code entry points (as at 501b0b8; Phases 15 and 28 to 31 will have renamed or moved some):**
- `aa-prototype/src/domain/types.ts`: `CoverRequest` (:277) and `List.coverRequest` (:315; Phase 28
  moves it to `Slot.coverRequest`), both retired here; `List` (:301); `AuditEntry` (:645).
- `aa-prototype/src/store/lifecycle.ts`: `requestCover` (:844, retired; its refusal "use Offer cover
  instead" :866; Phase 28 moves it to `store/slotActions.ts`); `reassignList` (:550; Phase 28
  re-implements it over `moveListToSlot` in `slotActions.ts`);
  `VACATED_STATUSES` (:541; Phase 29 replaces it); `reassignCard` (:640, `reassignBooking` after
  Phase 15). It refuses an anaesthetist moving a Booking to someone else's List (`notOwnList`,
  "Anaesthetists can only move Cards between their own Lists."). `moveBookingToDoer` is the one
  sanctioned exception, so keep that refusal.
- `aa-prototype/src/store/selectors.ts`: `listForSlot` (:39), `cardsForList` (:71, `bookingsForList`
  after 15), `auditForEntity` (:84). The payee is derived from the List's owner (`anaesthetistIdForCase`,
  :612), so an unbilled case follows a moved Booking.
- `aa-prototype/src/store/xeroHandoff.ts` (:166-171) resolves the ACCPAY payee from the List at
  handoff. A pair already handed off before the move keeps its payee, which is Phase 41's repoint
  (US-06.5.4).
- `aa-prototype/src/store/mutate.ts`: `mutate`, `MutationMeta`, `ID_FORMATS` (:61), `clockISO`,
  `refuse`, `ok`.
- `aa-prototype/src/store/appStore.ts` (`PERSIST_VERSION`, :130) and
  `aa-prototype/src/domain/seed/index.ts` (`SEED_LIST_IDS`, :453).
- `aa-prototype/src/shared/flows/RequestCoverSheet.tsx`, replaced by the move sheet. Its done-state
  copy is ":102 You will be notified when someone accepts" and ":103 ... when they respond". Also
  `shared/flows/index.ts` (:11).
- `aa-prototype/src/shared/schedule/ListRow.tsx`: the `{ kind: 'offerCover' }` trailing variant
  (:12), its "Offer cover" pill (:82-96) and the doc comment (:102). All retired.
- `aa-prototype/src/shared/card/CardDetailBody.tsx` (`BookingDetailBody` after 15): the actions block
  (:703-717, "Copy ..." and "Cancel card") is where the Booking's move action sits on mobile and web.
- Mobile:
  - `apps/mobile/screens/AvailabilityScreen.tsx`: its own local `CoverTarget` (:19), the `cover`
    state (:44), "Tap to ask" (:74), the pending cell (:220-230) and the `RequestCoverSheet` (:247);
  - `apps/mobile/screens/ForwardListsScreen.tsx`: `onOfferCover` (:35), and the free row's "Cover
    request sent" / "Open for bookings or cover" with `{ kind: 'offerCover' }` (:105-120);
  - `apps/mobile/routes.tsx`: `offerCover` (:84), `onOfferCover` (:101), and the `RequestCoverSheet`
    (:144);
  - `apps/mobile/screens/ListDetailScreen.tsx`, `CardDetailScreen.tsx`, and
    `apps/mobile/components/SlideStack.tsx` (:132, a doc comment naming `RequestCoverSheet`).
- Web:
  - `apps/web/WebApp.tsx`: the `cover` state (:52), `onCover` in the outlet value (:55), and the
    `RequestCoverSheet` (:74);
  - `apps/web/outlet.ts` (`onCover`, :11-12), `apps/web/routes.tsx` (`onCover` passed at :31-59 and
    :118-124), and `apps/web/types.ts` (`CoverTarget`);
  - `apps/web/screens/DashboardScreen.tsx`: `myFreeList` (:86-90), `offerCover` (:116), `askCover`
    (:126), the "Offer cover" header button (:153-169) and the "Who's free" chips with "Ask to cover"
    (:295-335);
  - `apps/web/screens/AvailabilityGrid.tsx`: "Cover requested" (:79), the free-cell click (:89-91),
    the requested cell (:180) and the doc comment (:34-35);
  - `apps/web/screens/ListDetailView.tsx` and `CardDetailView.tsx`.
- Admin:
  - `apps/admin/components/SlotDrawer.tsx` (Phase 28's rename of `ListDrawer.tsx`, which opens
    `MoveCardFlow` at :110; `MoveBookingFlow` after 15);
  - `apps/admin/screens/AdminCardDetail.tsx` (`AdminBookingDetail` after 15);
  - Phase 31's Day dashboard band and Draft List page.
- Audit reading layer: `shared/audit/actionLabels.ts` (`'list.coverRequest'` :49, and Phase 28's
  `'slot.coverRequest'`), `shared/audit/fieldLabels.ts` (`coverRequest`, :75), and
  `shared/audit/auditNarrative.ts` (pure, no master lookups).
- Demo triggers: `src/shared/demoTriggers/` (registry, types, match, tests; Phase 14),
  `src/store/demoActors.ts`, `src/pwa/PwaDemoActions.tsx`.
- Tests to change:
  - `store/lifecycle.test.ts` (`describe('requestCover')` :513, removed);
  - `store/persistMigrate.test.ts`, `domain/seed/seed.test.ts` and `pwa/pwaPurity.test.ts`;
  - `visual/web-phase05.spec.ts` (:48-56, which clicks "Send cover request"; shots
    `w-07-cover-dialog` and `w-08-cover-sent`; the header comment :5);
  - `visual/mobile-phase03.spec.ts` (:60-67, the "mobile: request cover sheet" test that clicks "Tap
    to ask"; shot `m-07-cover`);
  - `visual/pwa-device.spec.ts`.
- **Keep, not part of RV-15:** the free-Slot note "Free / open for cover" in the seed (now
  `Slot.note`) and the matching fallbacks in `apps/admin/components/DayGrid.tsx`,
  `apps/web/components/WeekStrip.tsx` and `apps/web/screens/ListsScreen.tsx`. They describe an open
  Slot the office can fill. The capture recipes `US-01.3.3.json` and `US-02.3.1.json` click them.
  Also keep "Find cover" as the finder's name.
- Outside the app: `requirements-board/capture/recipes/US-01.4.3.json` (captures the old cover sheet
  on web, "Open for booking", and on mobile, "Tap to ask"; its `absentReason` describes swaps) and
  `US-01.4.2.json` (clicks free cells).

## Work items

Build in this order: model, helpers, seed tests, store, notices, audit labels, retirement (session
1); then sheets, entry points, the Booking action, Admin notices, triggers and shots (session 2).

1. **Domain types** (`src/domain/types.ts`) (DM-05; RV-15):
   - Remove `CoverRequest` and `Slot.coverRequest` (or `List.coverRequest`, whichever still exists).
   - Add **no** request, offer or notification entity. D7 needs none, and OQ-65's notices are
     derived (item 5).
   - Add `type OwnMoveRoute = 'office' | 'colleague'`, used only in audit payloads and notices.
2. **Pure helpers** (`src/domain/listMoves.ts`, no React, PWA-safe; Vitest in
   `src/domain/listMoves.test.ts`):
   - **Layering:** `src/domain` imports neither `src/store` nor `src/shared`. The helpers take
     domain-typed inputs (the schedule's `lists`, `slots` and `bookings`, the masters, `todayISO`),
     never `AppState`. They use master-record names as they are ("Dr Priya Sharma"), never
     `shared/format.ts`. Build on Phase 29's `isOpenSlot`. If Phase 28 left its receive rule inside
     `src/store`, move the pure predicate here (for example `canReceiveList(input, anaesthetistId, dateISO, session)`) and have
     `moveListToSlot` call it too. Then the rule exists once.
   - `ownMoveRefusal(input, listId, actorAnaesthetistId, todayISO)` returns `null` or `{ code,
     message }`. It covers: `notFound`; `draftList` ("This List has no anaesthetist yet. Only the office can assign it.");
     `notOwnList`; `listSubmitted` ("This List has been submitted. Only the office can move it now.");
     `listAuthorised`; and `pastDate` ("This List's day has passed").
   - `pushTargets(input, listId, ownerId)`: the colleagues whose Slot for the same date and session
     would receive the List under **the same receive rule as Phase 28's `moveListToSlot`** (active,
     not the owner, Slot open and empty). The result is sorted by display name, each with its
     `slotId`. Whatever the office's reassignment accepts, the push accepts, and nothing else.
   - `doerPlacement(input, bookingId, doerId)` returns one of:
     - `{ kind: 'existingList', listId }`: the doer's List in the same date and session, if that List
       is not AUTHORISED;
     - `{ kind: 'newList', slotId, closed: boolean }`: the doer's Slot holds no List, so a List is
       created there. `closed` is true when the Slot is unavailable, on leave or a holiday. The work
       was done, so it is created anyway and flagged through Phase 30's accept-and-flag path;
     - a refusal: `sameAnaesthetist`, `doerInactive`, `noSlot` (before the doer's start date), or
       `targetLocked` (the doer's List is AUTHORISED, "Dr X's List for that session is already
       authorised. Ask the office.").
     The new List copies the source List's hospital, surgeon and kind, which is the
     `addPostOpAddendum` pattern from Phase 28.
   - In `src/domain/blacklist.ts`, beside Phase 17's helpers, add
     `pairingPromptForAnaesthetist(masters, entries, toAnaesthetistId, surgeonId)`. It returns
     `{ message } | null`. It uses `blacklistWarning` underneath but returns **only**
     `ANAESTHETIST_PAIRING_PROMPT` filled with the colleague's master-record name: "Check with the
     office before moving this List to Dr Priya Sharma. You can still go ahead." There is no reason,
     no surgeon name, no entry id, and no `BLACKLIST_TERM` word. A List with no surgeon returns null.
     Because the reason never leaves the helper, no anaesthetist component can leak it through
     props. The doc comment names OQ-43 as open.
   - Tests:
     - `ownMoveRefusal` returns each code for its case and null for a clean List;
     - `pushTargets` excludes the owner, inactive anaesthetists, closed Slots and Slots holding a
       List, and agrees with Phase 28's reassign rule on the same fixtures;
     - `doerPlacement` covers each placement and refusal;
     - `pairingPromptForAnaesthetist` returns a message for an active entry and null for an ended
       entry or a List with no surgeon. The message contains neither the recorded reason, the
       surgeon's name, any `BLACKLIST_TERM` word, nor an en or em dash.
3. **Seed** (`src/domain/seed/index.ts`, `seed.test.ts`):
   - No new seed records. Remove any seeded `coverRequest` (none at the snapshot). Do not touch the
     canvas generator or its inputs.
   - **Bump `PERSIST_VERSION` by one.** Extend `persistMigrate.test.ts` so an old blob carrying
     `coverRequest` on a Slot (or on a List from before Phase 28) reseeds cleanly.
   - Hold the scripted-beat schedule as one exported constant, `SCRIPTED_BEAT_SCHEDULE = { listIds,
     slotIds }`. The seed tests and both triggers read it. Build it from `SEED_LIST_IDS` and the run
     sheet as it stands, at least:
     - S1's Souter Tue 28 Jul St George's AM List;
     - S2's Rutherford Wed 22 AM List and its target, **Dr Sharma's Wed 22 AM Slot** (Beat 3), and
       Sharma Tue 21 PM (Beat 2);
     - S3's Souter Mon 20 Lists;
     - S4 Beat 1's Souter Fri 24 AM List (Annette Riley) and Phase 27's Fri 24 PM (Nair);
     - S5's Souter Tue 21 PM and the Fri 17 and Tue 14 Lists.
   - Seed tests, which protect the demo beats rather than patch data:
     - **Souter can move:** on the pristine seed at `DEMO_TODAY`, Dr Souter has a DRAFT List with a
       surgeon in the next six days that is not in `SCRIPTED_BEAT_SCHEDULE` and whose `pushTargets`
       is non-empty. Record which one in a comment; the demo guide names it;
     - **The prompt is reachable:** some Souter List of that kind has an active blacklist entry
       between its surgeon and a colleague in `pushTargets`. If the canvas never produces one, add
       an active seed blacklist entry for a pairing that does occur. That follows Phase 17's rule:
       change the blacklist seed, never the Lists. Say so in the PROGRESS entry;
     - **The doer move is demoable:** a non-scripted Souter DRAFT List holds a Booking whose
       `doerPlacement` for some colleague is `existingList` or `newList` with `closed: false`.
       Record the Booking and the colleague;
     - **The triggers have candidates:** both triggers (Demo triggers) find one on the pristine seed,
       and neither picks anything in `SCRIPTED_BEAT_SCHEDULE`.
4. **Store actions** (new `src/store/listMoveActions.ts`, exported from `src/store/index.ts`):
   - Common rules:
     - one `mutate()` commit per action, with before and after metas;
     - timestamps from `clockISO(s.clock)`;
     - plain-English refusals with no dashes;
     - ownership enforced in the store, never only in the UI;
     - after commit, Phase 27's `syncPrepayment` runs exactly once for every Booking that moved
       (once in total, even where a reused core already calls it).
   - **`moveListToOffice(api, actor, listId, { vacatedStatus? })`** (US-01.4.3, first bullet; also
     "withdraws"):
     - anaesthetist actor only (`ownerOnly` otherwise; the office has its own Draft List tools), and
       `ownMoveRefusal` must be null;
     - it calls **Phase 31's `detachListToDraft(s, listId, { origin: 'movedToOffice', by:
       actor.who, fromAnaesthetistId })`**, the same helper unavailability uses, in its one commit,
       so the List keeps its id, Bookings, notes and history and becomes a Draft List. It is not a
       second copy; 31's tests pass unchanged;
     - the vacated Slot takes `vacatedStatus`, which defaults to Phase 29's `defaultSlotStatus`,
       audited `slot.status` when it changes, as Phase 28's move does;
     - audit: one `list.ownerMove` meta, `before: { slotId, anaesthetistId }`, `after: { slotId:
       null, anaesthetistId: null, route: 'office' }`. That is the from/to/by/when event;
     - after commit, `syncPrepayment(api, bookingId, 'listMoved')` for each Booking. A sent
       prepayment keeps its agreed amount. A held one has no basis anaesthetist now, so 27's sync
       withdraws it, and it is regenerated when the office assigns the Draft List. Make sure the
       re-check runs on that assignment: add the call to `assignDraftList` if Phase 31 did not.
   - **`pushListToSlot(api, actor, listId, toSlotId, { vacatedStatus? })`** (US-01.4.3, second
     bullet; US-01.4.5):
     - anaesthetist actor only; `ownMoveRefusal` must be null; the target Slot's anaesthetist must
       be in `pushTargets` (`targetNotOpen`, "Dr X's session cannot take a List");
     - it runs **Phase 28's `moveListToSlot` core** in the same commit, so the List moves with its
       Bookings, status history and audit intact and Phase 30's conflict rules apply exactly as for
       the office. `moveListToSlot` stays office-only. If it self-commits, split
       `moveListToSlotCore(s, actor, listId, toSlotId, vacatedStatus)` out of it, called by
       `moveListToSlot` (and so `reassignList`) and by `pushListToSlot`. `ReassignListFlow.test.tsx`
       and the reassign tests must pass unchanged;
     - audit: `list.ownerMove` with `after: { slotId, anaesthetistId, route: 'colleague' }`, and
       **not** a second `list.reassign`. The core takes the action code, so the move is still one
       event;
     - it **never refuses on the blacklist.** If `blacklistWarning` is active for the colleague and
       the List's surgeon, Phase 17's `list.blacklistAcknowledged` meta is written in the same
       commit, `after: { anaesthetistId, surgeonId, blacklistEntryId }`. Phase 28's plan already
       writes it inside `moveListToSlot`: if it sits in the shared core, the push inherits it; if it
       sits in the office wrapper, move it into the core. Either way exactly one is written. Its
       entity is the List, so it stays in the Admin audit and never reaches the Booking History an
       anaesthetist sees;
     - after commit, re-check each Booking with cause `listMoved`, once (if `moveListToSlot`'s sync
       call lives in its wrapper, lift it into a shared after-commit step both paths call). A
       different anaesthetist means a different prepaid set and unit value: a held prepayment is
       withdrawn and regenerated at the colleague's rate, and a sent one keeps its agreed amount
       (OQ-70).
   - **`moveBookingToDoer(api, actor, bookingId, doerAnaesthetistId)`** (US-01.4.6; DM-06):
     - actors are the source List's owner (List DRAFT) or the office (List not AUTHORISED). Another
       anaesthetist is refused with `notOwnList`. The Booking must not be cancelled. A past date is
       allowed, because the work is usually already done;
     - `doerPlacement` decides the target. For `newList` it creates the List through Phase 28's
       internal `placeListOnSlot` in the same commit. If `closed`, Phase 30 flags it, and the move is
       not refused. An anaesthetist creating a List in a colleague's Slot is allowed **only** here;
     - the Booking moves through `reassignBooking`'s core, keeping its Procedures and history. It
       writes one `booking.movedToDoer` meta, `before: { listId, anaesthetistId }`, `after: { listId,
       anaesthetistId, createdListId? }`. The source List stays, even if it is now empty;
     - **the payable follows the Booking** (AC2). The payee is derived from the List's owner until
       Phase 25's lock fixes it at authorise, so no payee field is written. Test it through the lock
       or the billing run: after the move and B's authorise, the payable is to B;
     - after commit, `syncPrepayment(api, bookingId, 'bookingMoved')` (AC3). Under OQ-70's
       recommendation a sent prepayment's agreed amount stands and the patient is not billed again;
       a held one is withdrawn and regenerated at B's rate by 27's rule. Repointing an
       already-raised prepayment's draft payable is Phase 41's (US-06.5.4). Say so in the doc
       comment;
     - there is no blacklist check on this path, because the work is done or agreed. Record it in
       the Decisions log.
   - Tests (`store/listMoveActions.test.ts`):
     - every refusal, including:
       - the office actor on `moveListToOffice` and `pushListToSlot`;
       - another anaesthetist's List;
       - a Draft List, a SUBMITTED List and a past date;
       - a closed or occupied target Slot;
       - a third anaesthetist calling `moveBookingToDoer`;
     - `moveListToOffice` produces a Draft List with the same id and Bookings, the vacated Slot per
       `vacatedStatus`, and one `list.ownerMove`, all in one commit;
     - `pushListToSlot` moves the List exactly as `reassignList` does on the same fixture (same List
       id, same Bookings, the same conflicts raised and cleared). It writes one `list.ownerMove` and
       no `list.reassign`. A blacklisted colleague succeeds with exactly one acknowledgement; an ended
       entry writes none;
     - `moveBookingToDoer` covers each of the three acceptance criteria of US-01.4.6:
       - B's existing List, and a new List in B's free Slot (a one-Booking List);
       - A's List no longer holds the Booking;
       - the payable is to B after B's List is authorised;
       - the re-check ran: on a Booking with a sent prepayment invoice the agreed amount is
         unchanged and no new invoice is raised; on one with a held invoice it is regenerated at
         B's rate;
     - determinism: the same actions on the same seed give identical ids and state.
5. **Notices: who is told (OQ-65 recommendation, one place)** (`src/store/listMoveNotices.ts`, pure
   selectors, PWA-safe):
   - `OWN_MOVE_NOTICE_RULE = { office: true, colleague: true, windowDays: 7 }`, with a doc comment
     naming OQ-65 as open.
   - `officeMoveNotices(state, todayISO)`: one row per `list.ownerMove` and `booking.movedToDoer` in
     the window, newest first: who moved what, from whom, to whom (or "to the office"), when, and the
     List or Draft List id. Phase 35 adds "Draft update email" to these rows (a cover change goes to
     the hospital contact, OQ-46).
   - `movedToMeNotices(state, anaesthetistId, todayISO)`: rows where the persona received a List
     (route `colleague`) or a Booking (doer), showing date, session and hospital.
   - Both read the audit, the one record of the move. There is no notification entity and no
     persisted "seen" set. Tests: each route produces the right rows, rows drop off after the window
     on the demo clock, and a move to the office gives no colleague row.
6. **Audit reading layer.**
   - `shared/audit/actionLabels.ts`: add "List moved by its anaesthetist" (`list.ownerMove`) and
     "Booking moved to the anaesthetist who did it" (`booking.movedToDoer`). Remove
     `'list.coverRequest'` and Phase 28's `'slot.coverRequest'`. The version bump reseeds, so no
     persisted history carries them.
   - `fieldLabels.ts`: add `route` ("Moved to") and `createdListId` ("New List"); remove
     `coverRequest`.
   - `auditNarrative.ts` stays pure and shows ids raw, as it does for `list.reassign`.
     `auditNarrative.test.ts` passes. The Audit viewer's entity filter is derived, so it needs no
     change.
7. **Retire the cover marker (RV-15).**
   - Delete `requestCover` from the store and its index, and its tests.
   - Delete `shared/flows/RequestCoverSheet.tsx` (item 9 adds the move sheet) and update
     `shared/flows/index.ts` and the `SlideStack.tsx` comment.
   - `shared/schedule/ListRow.tsx`: remove the `offerCover` variant, its pill and the comment line.
   - Mobile:
     - `ForwardListsScreen`: the free row loses "Offer cover" and `onOfferCover`, and its subtitle
       becomes "Open for bookings";
     - `apps/mobile/routes.tsx`: remove `offerCover`, the `offer` state and its sheet;
     - `AvailabilityScreen`: remove its `CoverTarget`, the `cover` state, "Tap to ask", the pending
       cell and its sheet.
   - Web:
     - remove `CoverTarget` (`types.ts`) and `onCover` (`outlet.ts`, `WebApp.tsx`, `routes.tsx`);
     - remove `DashboardScreen`'s `myFreeList`, `offerCover` and `askCover`;
     - remove the grid's free-cell cover click and "Cover requested". The grid subtitle "Find cover
       fast. Free sessions are clickable." becomes "Find cover fast. Move one of your Lists into a
       colleague's free session."
   - Every "Cover requested", "Cover request sent", "Tap to ask", "Offer cover", "Ask to cover" and
     "notified when someone accepts" string goes.
   - At the end, grep for `cover` and `swap` across `src`, `visual` and the capture recipes. Only
     unrelated uses may remain: "Find cover", the kept "open for cover" notes, and the "covered
     amount" from Phase 22. No `swap` may remain in app copy or new identifiers.
8. **Checkpoint: green. Session 1 ends here.** Run `npm run build`, `npm run build:pwa` and
   `npx vitest run`. `npm run shots` is not expected to pass yet, because the two cover beats are
   re-pointed in item 14. Say so in the hand-over note.
9. **The shared move sheet** (`shared/flows/MoveListSheet.tsx`, through `useSurface().Overlay`, so
   it is a bottom sheet on mobile and a dialog on web, convention 16):
   - Props: `actor`, `listId`, and an optional preselected `toSlotId`. The sheet imports nothing from
     `apps/*` or `shell` and never receives a blacklist reason.
   - **Header:** the List as it is now: date, session, hospital, surgeon and the number of Bookings
     ("Thu 23 Jul · AM · St George's · 3 Bookings").
   - **Choose where** (skipped when `toSlotId` is preselected):
     - **Move to the office**, with the line "The office will find someone for it. Its Bookings go
       with it. Use this to withdraw from the List.";
     - **Move to a colleague**: the availability view for that day and session, that is
       `pushTargets` as tappable rows (avatar, name, phone, the Who's-free style), not a dropdown.
       The list is never split into a blacklisted group, because the group label would itself
       disclose the blacklist (OQ-43). An empty list reads "No colleague is free in this session".
   - **Confirm:**
     - for a colleague, the mockup's header (the colleague's avatar and full name, and the slot
       line), the explanation "Dr Sharma gets this List and its Bookings straight away. There is no
       need for Dr Sharma or the office to accept.", and the pairing prompt from
       `pairingPromptForAnaesthetist` in the warning tint (with OQ-43's provisional hint) when it
       applies;
     - "Your session after the move", offering Phase 29's choice of Free or Not available, with
       `defaultSlotStatus` as the default;
     - "Add a message" for the office and the colleague, shown on the notice rows. Store it on the
       `list.ownerMove` meta's `after.message`;
     - the teal button reads **Move List**, or **Move List anyway** while the prompt shows.
   - **Done:** the completion tick and either "Moved to the office. The office will find someone for
     it." or "Moved to Dr Sharma. The office and Dr Sharma can see it now." Add the OQ-65
     provisional caption. Refusals show inline in the error tint, as today. The anaesthetist's
     sheets never say "Draft List" (Phase 31's rule); any Draft List word on an Admin surface comes
     from `shared/scheduleTerms.ts`, so 31's literal-string test still passes.
10. **Anaesthetist entry points** (US-01.4.3 "selects one of their Lists and starts a move"; "uses the
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
      List** row that opens the sheet (Phase 29's handoff names this entry). It sits beside the
      status change, since moving to the office is the alternative to marking the session
      unavailable.
    - **Web Find cover** (`/web/availability`): a "Move" link on the persona's own booked cells in
      the "(you)" row, beside "Change", and the same colleague Free-cell gesture.
    - **Web dashboard** (`DashboardScreen`): the header's "Offer cover" button becomes **Move a
      List** in the same teal slot. It opens a short picker of the persona's movable Lists for the
      next six days, then the sheet. It is disabled with "No upcoming Lists to move" when there are
      none. In "Who's free, next 5 days", a colleague chip opens the sheet preselected when the
      persona has a List in that session and the colleague is a push target. Otherwise the chip is
      display only (title "You have no List in this session"). The row's "Ask to cover" link goes.
    - **Mobile Forward Lists:** no new entry point. List detail is one tap away.
11. **The colleague's side and the office's side** (OQ-65 recommendation, read from item 5's
    selectors):
    - **Colleague:** a **Moved to you** panel at the top of Find cover on mobile and web while
      `movedToMeNotices` is non-empty, for example "Dr Hughes moved Thu 23 AM, St George's, to you".
      The received List's detail shows "Moved to you by Dr Hughes on Tue 21 Jul". Its Forward Lists
      row shows a "New" pill for the window. The caption says "simulated" once.
    - **Office:**
      - a **Moved by anaesthetists** block on Phase 31's Day dashboard band, showing
        `officeMoveNotices` for the date with links to the List drawer or the Draft List;
      - a line in `SlotDrawer`'s attention area: "Moved here by Dr Souter (her own move), Tue 21 Jul
        09:12" or "Dr Souter moved this List to the office";
      - Draft Lists that came from a move show their source line from Phase 31.
      No badge and no queue: there is nothing to approve.
12. **Move to the anaesthetist who did it** (US-01.4.6, a product action):
    - A shared `shared/flows/MoveBookingToDoerSheet.tsx`: pick the colleague who did it (all active
      anaesthetists except the List's owner, sorted, rows not a dropdown). The sheet shows where the
      Booking lands, from `doerPlacement`:
      - "Lands on Dr Hughes's Tue 21 Jul AM List (St George's)";
      - "A new List is created in Dr Hughes's Tue 21 Jul AM session";
      - plus "That session is marked not available. The office will see a conflict." when `closed`.
      A second line reads "Dr Hughes is paid for it. A prepayment already sent keeps its agreed
      amount." The
      teal button is **Move Booking**.
    - Entry points:
      - `BookingDetailBody`'s actions block on mobile and web, for the List's owner while the List is
        DRAFT;
      - Admin Booking detail for the office while the List is not AUTHORISED, beside the existing
        Move (which stays for routine moves).
    - Phase 15a's `SubmitListSheet` gains one sentence above its button: "Submitting says you did
      every procedure on this List. If a colleague did one, move it to them first." No new step.
13. **Demo triggers** (registry entries; see the next section for labels and effects):
    - Bodies go in `src/store/listMoveDemo.ts` (exported from the store), so the registry stays thin
      and the PWA closure stays pure: `stageColleagueMoveToOffice(api, dateISO?)` and
      `stageColleaguePushToPersona(api, personaId)`.
    - Each acts as the List's owner, through a small `anaesthetistActor(state, anaesthetistId)`
      helper in `src/store/demoActors.ts`, so the audit reads truthfully.
    - Candidate choice is deterministic: the earliest future DRAFT List (by date, then session, then
      id) that is not the persona's, has a surgeon, is not in `SCRIPTED_BEAT_SCHEDULE` and, for the
      push, lands in a persona Slot that is not in `SCRIPTED_BEAT_SCHEDULE`.
    - `demoTriggers.test.ts`:
      - ids are unique and contain no dash characters other than the hyphen;
      - the Admin entry appears for `'bar'` on `/admin/day/:dateISO` and never for `'pwa'`;
      - the PWA entry appears for `'pwa'` on `/mobile/availability` and never for `'bar'`;
      - each body makes exactly one move;
      - the disabled reasons fire when nothing fits.
14. **Playwright and capture recipes** (`npm run shots`):
    - `visual/web-phase05.spec.ts`: re-point the cover beat to the move sheet (own List cell → Move
      → a colleague → Move List → done). Rename the shots to `w-07-move-sheet` and `w-08-move-done`
      and update the header comment.
    - `visual/mobile-phase03.spec.ts`: "mobile: request cover sheet" becomes "mobile: move List
      sheet", opened from the persona's own List's Move affordance on Find cover. The shot becomes
      `m-07-move`.
    - New `visual/list-moves-phase32.spec.ts` with `data-shot` hooks for:
      - the web move sheet with the pairing prompt showing;
      - the move-to-office done state;
      - the Admin Day band's Moved-by-anaesthetists block and the new Draft List, staged with the
        Demo actions menu;
      - the Day view afterwards with the pushed List on the colleague's row;
      - the Booking's Move to the anaesthetist who did it sheet.
    - `visual/pwa-device.spec.ts`: on Mobile Availability, open the Demo chip, run "Colleague pushes
      a List into my free Slot", and assert the Moved to you panel and the List on Forward Lists.
      Then move one of Souter's Lists to the office from List detail and assert it has left Forward
      Lists.
    - `data-shot` hooks for the capture recipes (Move affordance, Move sheet, pairing prompt, Moved to
      you panel, Moved by anaesthetists block, the doer sheet). The recipes, the re-capture and the
      ATLAS edits are the standing step in "Catalogue screenshots" below, run after the review pass.
15. **Finish green:** `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots`, then the Catalogue screenshots step (after the review pass) and `npm run verify:board`.
    `persistMigrate.test.ts` covers the bump. `pwaPurity.test.ts` passes: the sheets, helpers,
    selectors and trigger bodies import nothing from `apps/admin`, `apps/demo` or `shell`.

## Demo triggers

The anaesthetist's move and the Booking move are normal mobile, web or Admin use, and nothing waits
on the office. Two things still need a button. The office side needs a colleague's move to look at
without first playing that colleague. The handset needs to show the receiving side, because the
anaesthetist apps run only as Dr Souter. Register both in Phase 14's registry. Add nothing to the
Control Panel page, which lists them under their screens.

| id | Label | Screen (routes) | Surfaces | Effect | Disabled when |
|---|---|---|---|---|---|
| `colleague-moves-list-to-office` | Colleague moves a List to the office | Admin · Day (`/admin/day/:dateISO`) | bar | `stageColleagueMoveToOffice` on the date in the URL, or the next date with a candidate. It runs `moveListToOffice` as the List's owner, with the vacated Slot set to Not available. The new Draft List and the office notice show on the Day band without switching persona. Message, filled from the move: "Dr Hughes moved Thu 23 AM (St George's) to the office. It is now a Draft List." (the Draft List word from `scheduleTerms`) | no candidate ("No List on the canvas fits") |
| (product, not registered) | Move to the anaesthetist who did it | Mobile · Booking, Web · Booking, Admin · Booking detail | product UI | Work item 12. It stays in the product because it is a real user action. | the List is SUBMITTED for an anaesthetist, or AUTHORISED |
| `colleague-pushes-list-to-me` | Colleague pushes a List into my free Slot | Mobile · Availability (Phase 29's Find cover layer, `/mobile/availability`) | pwa | `stageColleaguePushToPersona` for Dr Souter. It picks a colleague's List in a session where Souter's Slot is open and empty, then runs `pushListToSlot` as that colleague. Souter sees the Moved to you panel and the List on her schedule. Use Phase 14's stand-in badge. Message: "Dr Hughes moved Thu 23 AM (St George's) into your free session." | no candidate ("No colleague List fits one of your free sessions") |

There are no office stand-ins: nothing in this phase waits for the office (D7).

## Out of scope

- **Any acceptance or confirmation step**, by the colleague or the office. D7 ruled both out.
- **Anaesthetists creating ad hoc Lists from a free Slot.** They only move Lists. The doer rule's
  List in the doer's Slot is the one system-created exception.
- **The update email** after a move (US-02.3.3, OQ-46, OQ-69): Phase 35, on this phase's office
  notice.
- **Repointing a moved prepaid Booking's prepayment payable**, the trust account and refunds
  (US-06.5.4, FT-06.5): Phase 41. This phase keeps the agreed amount and runs the re-check.
- **The office reassigning a List** (US-01.4.1): Phase 28. **Draft List assignment**: Phase 31.
- **An anaesthetist-kept blacklist** (OQ-43's "one list or two") and **OQ-43's second question**.
- **A real notification channel** (push, SMS, email) or a notification entity.
- **Moving a SUBMITTED or AUTHORISED List**: the office's Reassign. **Two-way exchanges**: two
  moves.
- **"Play the office"** (RV-22 scaffold): unchanged.
- The full S2 rewrite: Phase 44. This phase adds one beat.

## Manual test checklist

The agent runs every item itself in the running app and reports it with evidence; none is handed
to the owner (ROADMAP.md "Owner review: agents test themselves").

- [ ] Reset. Admin Day shows no Moved-by-anaesthetists block. Nothing anywhere says "Cover
  requested", "Offer cover", "Tap to ask", "swap" or "notified when someone accepts".
- [ ] Web, Availability (as Dr Souter), the seed test's day:
  - her own List cell shows Move;
  - a colleague's Free cell in that session opens the sheet preselected;
  - a colleague's Free cell in a session where she has no List is status only.
- [ ] In the sheet, choose the colleague blacklisted with the List's surgeon. The warning-tint prompt
  reads "Check with the office before moving this List to Dr ..." and shows no reason, no surgeon
  name and no blacklist word, and the button reads "Move List anyway". Choose a clean colleague: the
  prompt goes.
- [ ] Move to the clean colleague, keeping Free. The tick and "Moved to Dr ..." show at once. The
  List has left Souter's Lists, and her old cell shows Free.
- [ ] Admin Day on that date:
  - the List and its Bookings sit on the colleague's row;
  - the band's block and the drawer line read "Moved here by Dr Souter";
  - the List's History shows "List moved by its anaesthetist", plus the blacklist acknowledgement
    when the prompt was shown.
- [ ] Mobile, List detail on another Souter List → Move this List → Move to the office → Not
  available → Move List. Admin Day: a Draft List with its Bookings, flagged unassigned, with the move
  as its source. Souter's Slot shows Not available. The sheet never says "Draft List".
- [ ] My calendar (mobile and web), tap a day holding a movable Souter List: the panel offers
  **Move this List**, which opens the same sheet.
- [ ] Admin Day, Demo actions, **Colleague moves a List to the office**: a colleague's List becomes a
  Draft List and the notice shows.
- [ ] Booking detail (web, as Souter) on the seed test's Booking → **Move to the anaesthetist who did
  it** → the colleague. The sheet says where it lands. After the move, the Booking is on the
  colleague's List (or a new one), Souter's List no longer holds it, and the office notice shows.
  On a Booking with a sent prepayment invoice the re-check runs and the agreed amount is unchanged.
- [ ] Admin Booking detail: the same action works for the office on a SUBMITTED List and is absent
  on an AUTHORISED one.
- [ ] Submit a Souter List: the confirm step carries the "you did every procedure" sentence.
- [ ] PWA (`npm run build:pwa` and preview), Mobile Availability: the Demo chip offers **Colleague
  pushes a List into my free Slot**. Running it shows the Moved to you panel and the List on Forward
  Lists with "New". The chip is absent where no entry applies.
- [ ] The Control Panel lists the Admin trigger under Admin · Day with an Open screen link, and the
  PWA entry as "Shown in the installed PWA".
- [ ] S2 Beats 1 to 4 run unchanged from a reset (Rutherford's Wed 22 AM reassignment to Sharma is
  untouched).
- [ ] The mobile app, web app and PWA never show a blacklist reason, a surgeon name in the prompt, or
  the blacklist word.
- [ ] No en or em dash in any new copy. Teal is the only action colour, and there is no crimson on
  any new control, pill or notice.
- [ ] Catalogue screenshots: the recipes for US-01.4.3, US-01.4.5 and US-01.4.6 are created or updated, any recipe this phase broke is re-pointed, a full `npm run capture` ends with no failed recipe and no story without a recipe, the covered items' new shots are checked by eye, and `npm run verify:board` is green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots` and `npm run verify:board` are all green.

## Demo guide updates

Patch these in the same session (ROADMAP rule). This is a **milestone** phase ("After 32: ...
anaesthetists moving their own Lists to the office or a colleague. S2 is re-scripted"):
- `docs/demo-guide/03-demo-script.md`:
  - **S2:** add **Beat 3b, "an anaesthetist moves her own List"**, after Beat 3.
    - **Click:** Web Availability as Dr Souter, the seed test's day → her List's Move → the
      colleague → Move List. Then Admin Day on that date: the List on the colleague's row and the
      "Moved here by Dr Souter" line. Optional variants:
      - pick the blacklisted colleague to show the prompt;
      - Admin Day, Demo actions, Colleague moves a List to the office, to show the Draft List;
      - on a Booking, Move to the anaesthetist who did it.
    - **Say:** "Anaesthetists usually find their own cover. Here she moves her List herself, to a
      colleague who is free or back to the office, and it happens at once: AA runs a high-trust
      system. The List moves with its Bookings and history, exactly like the office's own
      reassignment, and whoever does a Booking is the one paid for it."
    - **Expected:** the done state, the List on the colleague's row, and the office notice.
    - Beat 3's Say line gains one clause: the office-led reassignment is for when nobody has arranged
      cover; Beat 3b is the anaesthetist-led path.
  - **S2 Discovery points:** add OQ-65 (who is told after a move), OQ-43 (what the anaesthetist's
    warning says, and one blacklist or two) and OQ-70 (prepayment on a moved Booking). Drop "the exact
    List-reassignment mechanics" (OQ-08 is answered).
  - The "Sheets and drawers are deliberately not in the URL" line: "the cover request" becomes "the
    move sheet".
- `docs/demo-guide/02-workflows-and-handoffs.md`, **Workflow 3**, becomes "find cover: the
  anaesthetist's own move, or the office's reassignment":
  - step 1 changes from "offers a Free session for cover" to "moves one of her Lists to a free
    colleague or to the office";
  - add the office notice handoff;
  - replace the "What not to say" line: there is no claiming of open shifts and no acceptance step;
  - the readiness row "Cover request and office List reassignment" becomes "Anaesthetist's own List
    move, the doer rule, and office List reassignment", Phases 28 and 32.
- `docs/demo-guide/01-personas-and-responsibilities.md`: "See availability for possible cover or
  swaps", "Use Availability to offer a Free session or request cover" and "Find Free anaesthetists
  and request cover" become "move one of your Lists to a free colleague or back to the office". The
  office gains "See Lists anaesthetists have moved, and assign the Draft Lists they hand back".
- `docs/demo-guide/04-presenter-cheat-sheet.md`:
  - the "Claim/sign up for a shift" row now reads "Move your own List to a colleague's free session or
    to the office, at once";
  - RFP ambiguity 5 gains the own-move path and D7;
  - add one line for the Admin trigger and the PWA stand-in.
- `docs/demo-guide/README.md` (:64): "find Free sessions and request or offer cover" becomes "find
  Free colleagues and move a List to them".
- `docs/demo-guide/master-demo-guide.html`: mirror every edit above (S2 Beats 3 and 3b, discovery
  points, Workflow 3, personas, cheat sheet).
- **Control Panel scenario text** (`apps/demo/DemoControlPanel.tsx`, S2): the blurb adds "an
  anaesthetist moving her own List"; the message adds "then, as Dr Souter on Web Availability, move a
  List to a colleague and see it on Admin Day".
- **Milestone consistency read:** read `master-demo-guide.html` end to end against the run sheet and
  the cheat sheet. Fix any drift the Schedule track (28 to 32) left, not only this phase's.

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19),
run after the review pass and before the PROGRESS.md entry. Re-run
`node docs/prototype-build/catch-up/tools/recipe-status.mjs 32` first: earlier phases may have
changed these recipes since this plan was written. Work item 14 only re-points the Playwright specs
and makes sure the `data-shot` hooks exist. The recipes and the capture run belong to this step.

**Covered items.** When the phase is done, each recipe in `requirements-board/capture/recipes/`
matches what was built:

| Item | Recipe at plan time | When this phase is done |
|---|---|---|
| [US-01.4.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.4.3.md) Anaesthetist moves their own List | partial · `cover-request` (web, mobile; the old cover sheet) | captured. Rename the shot to `move-list` (the old name describes the retired cover flow; say so in the PROGRESS entry). Web: `/web/availability`, states `sheet` (the Move sheet from the persona's own List cell) and `done` (the "Moved to Dr ..." tick); highlight the dialog. Mobile: `/mobile/availability`, states `sheet` (the bottom sheet opened from the own List's Move) and `to-office` (the "Move to the office" confirm); highlight `[data-aa-mobile-product] [role=dialog]`. Add an admin state on `/admin/day/2026-07-21` after staging the move with the `Colleague moves a List to the office` trigger, highlighting the Moved by anaesthetists block. Caption in the catalogue's words: "Move your own List to the office or a colleague's free Slot, with no request and no confirmation". Empty `absentReason`, set `status` captured |
| [US-01.4.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.4.5.md) Blacklist warning when an anaesthetist reassigns their own List | none (create it; absent stub) | create, status captured. Shot `move-pairing-prompt` on web and mobile: the Move sheet with a colleague blacklisted with the List's surgeon chosen (the seed test pins the Souter List and colleague), the warning-tint prompt "Check with the office before moving this List to Dr ..." and the "Move List anyway" button. Highlight the prompt. The shot must show no reason, surgeon name or blacklist word. Caption: "The anaesthetist is warned before moving a List to a colleague the office has flagged, and can still go ahead" |
| [US-01.4.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.4.6.md) The List's anaesthetist did its procedures | none (create it; absent stub) | create, status captured. Shot `move-to-doer` on web (Booking detail as Souter, the seed test's Booking) and mobile (Booking sheet), states `sheet` ("Move to the anaesthetist who did it", with where it lands and "Dr ... is paid for it") and `after` (the Booking on the colleague's List). Add an admin state on Admin Booking detail. Highlight the sheet, then the Booking row. Caption: "A Booking done by another anaesthetist moves to their List, and the payable and prepayment follow" |

**Recipes this phase breaks.** Found by grep at plan time:
- `US-01.4.3.json` is the old cover sheet ("Open for booking", "Tap to ask"): rebuilt in the table above.
- `US-01.4.2.json` (admin, web and mobile finder) clicks free cells and "Free only". The web grid subtitle changes to "Find cover fast. Move one of your Lists into a colleague's free session." and free cells become tappable only with a movable List. Re-check the highlights and captions.
- `US-01.2.1.json` (web `availability-grid`; mobile `availability-block-pm`), `US-01.5.2.json` and `US-01.5.3.json` (mobile `availability-block-pm`, `my-availability`) sit on the availability screens that gain Move and the Moved to you panel. Check the click targets.
- `US-01.3.3.json` and `US-02.3.1.json` click "open for cover", which this phase keeps. No change expected.
- `US-01.1.1.json` (mobile `my-lists`) shows the free row that loses "Offer cover" and gains "Open for bookings": no step to fix, but the image changes.
The `--dry` run is the final check.

**ATLAS.md.** Update Routes (the Move affordance and the Moved to you panel on `/web/availability`, `/mobile/availability` and the calendar routes), Seed data worth shooting (the pinned movable Souter List, the pairing-prompt List and colleague, and the doer-move Booking from the seed tests) and Existing hooks (new `data-shot` hooks for the Move sheet, the pairing prompt, the Moved by anaesthetists block and the doer sheet).

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
  Both List moves take effect in the same commit, and nothing waits for anyone.
- **One move, one place.** `pushListToSlot` runs Phase 28's move core and `moveListToOffice` runs
  Phase 31's conversion core. There is no second copy of either. Each move writes exactly one
  `list.ownerMove` (no extra `list.reassign`). The receive rule exists once, and `pushTargets` and
  `moveListToSlot` agree on it.
- **Ownership is enforced in the store.** An anaesthetist cannot move someone else's List, a Draft
  List, a SUBMITTED List or a past List, even by calling the action directly. Only the owner or the
  office can move a Booking to its doer. `reassignBooking`'s `notOwnList` still holds elsewhere.
- **The blacklist never leaks and never blocks.** The mobile app, web app and PWA receive only
  `pairingPromptForAnaesthetist`'s message: no reason, surgeon name, entry id or blacklist word in
  the DOM, props, titles or aria labels. No path refuses or hides a colleague for being blacklisted.
  The colleague list is not grouped. The acknowledgement is written once, on the List.
- **The doer rule's three criteria.** The Booking ends on a List of B's and leaves A's. The payable
  is to B, derived through the List and fixed by Phase 25's lock. Prepayment is re-checked and the
  agreed amount kept (OQ-70). Look at the edge cases: a closed Slot, B's AUTHORISED List, a cancelled
  Booking, and a Booking with a raised prepayment.
- **Re-check coverage.** Every Booking moved by any of the three actions gets `syncPrepayment`
  exactly once, after commit (not twice through `moveListToSlot`'s own call), and a Draft List
  assignment re-checks too. A sent prepayment keeps its amount; a held one follows 27's rule.
- **Notices in one place.** `OWN_MOVE_NOTICE_RULE` and the two selectors are the only readers. There
  is no stored notification. The window follows the demo clock.
- **RV-15 is fully gone, and so is "swap".** No `coverRequest`, `requestCover`, `RequestCoverSheet`,
  "Offer cover", "Cover requested", "Tap to ask" or "someone accepts" remains, and "swap" appears in
  no app copy, identifier or test name.
- **Determinism and seed hygiene.** `PERSIST_VERSION` is bumped. The canvas is unchanged. The
  triggers pick deterministically and never touch `SCRIPTED_BEAT_SCHEDULE`.
- **Triggers and PWA purity.** The Admin entry is bar only, on Admin Day. The stand-in is PWA only.
  Bodies live in `src/store`. The new sheets, helpers and selectors import nothing from
  `apps/admin`, `apps/demo` or `shell`.
- **Design and copy.** The sheet keeps the Mobile Availability anatomy and is a bottom sheet on
  mobile and a dialog on web. The prompt uses the warning tint. Actions are teal only, with no
  crimson on controls or pills, and there are no en or em dashes.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry; ROADMAP.md "Owner review: agents test
  themselves"): the defaults built for open questions, provisional readings, anything logged
  rather than fixed, and the screens worth a look, each with its route and persona.
- **Status row** for catch-up Phase 32, and a phase entry with:
  - the drift-check result: items changed or not, and the status of OQ-65, OQ-43 and OQ-70 (built as
    recommendations or as answered);
  - what was built, and what was removed (the cover marker, its action, sheet, labels and tests);
  - the `PERSIST_VERSION` bump (from and to);
  - the Souter List, pairing-prompt List, doer Booking and trigger candidates the seed tests pin, for
    the demo guide;
  - the tests added (domain, store, notices, triggers, Playwright);
  - the review pass;
  - the Catalogue screenshots result: recipes created or changed, the REPORT.md counts (captured, partial, absent, failed) before and after, and any partial reason handed to a later phase;
  - the milestone consistency read of the master guide.
- **Decisions log:**
  1. **Supersedes** the 2026-07-21 "New interactions the design added" entry's mobile request-cover
     flow and web "Ask to cover" links. An anaesthetist now moves one of her own Lists. Offering an
     empty free session is removed (RV-15). The mockup's "tap a colleague's free session" gesture is
     kept where the persona has a List in that session. Also supersedes the July cover-request flow
     generally, and RV-15's planned office confirmation.
  2. **D7 (OQ-39, answered 2026-10-01):** the anaesthetist moves her own List to the office (a Draft
     List) or into a colleague's free Slot, at once. There is no acceptance and no office
     confirmation. Withdrawing is the move to the office.
  3. **OQ-43, open, recommendation built:** the anaesthetist sees a reason-free prompt, and her
     colleague list is not grouped. **Amends** Phase 17's rulings that the blacklist stays out of the
     anaesthetist apps and that an anaesthetist actor's writes never check or log it: US-01.4.5 needs
     both on the push path. The list itself and its reasons stay Admin only.
  4. **OQ-65, open, recommendation built:** the office and the colleague see derived notices, kept
     for seven demo days, read from the move's audit row. There is no notification entity. The
     switch point is `OWN_MOVE_NOTICE_RULE`.
  5. **US-01.4.6 doer rule:** a Booking moves to the doer's List for the same session, created in
     their Slot if needed, even a closed one (flagged, not refused). This is the only way an
     anaesthetist's action creates a List in a colleague's Slot. There is no blacklist check on it.
  6. **OQ-70, open, recommendation built:** a moved prepaid Booking keeps its agreed amount and the
     doer is paid. The re-check runs on every move. Repointing an already-raised prepayment payable
     is Phase 41's.
- **Handoff notes:**
  - For **35**: `officeMoveNotices` rows are where "Draft update email" goes. A push to a colleague
    or a doer move is a cover change, so the email goes to the hospital contact (OQ-46). Use the
    message the anaesthetist typed.
  - For **41**: `moveBookingToDoer` and `pushListToSlot` already re-check. The repoint of a raised
    prepayment's payable (US-06.5.4 AC2) hooks onto `booking.movedToDoer` and `list.ownerMove`.
  - For **38a**: the calendar search should find a Booking on the List it moved to.
  - For **44**: S2 Beat 3b and Workflow 3 are patched, not rewritten. The PWA parity audit should
    walk the receiving side with the stand-in.
  - If OQ-65 or OQ-43 is answered later, the switch points are `OWN_MOVE_NOTICE_RULE` and
    `ANAESTHETIST_PAIRING_PROMPT`.
