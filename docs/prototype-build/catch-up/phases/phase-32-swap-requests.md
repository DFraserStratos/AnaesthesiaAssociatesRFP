# Phase 32 · Swap requests

**Requirements covered:**
[US-01.4.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.4.3.md) Anaesthetist requests a swap (Proposed) ·
[US-01.4.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.4.5.md) Blacklist warning when an anaesthetist reassigns their own List (Proposed) ·
[DM-05](../analysis/domain-model-delta.md#dm-05) Swap request between anaesthetists, confirmed by the office ·
[RV-15](../analysis/reverse-check.md#rv-15-cover-flow-puts-the-request-on-the-colleagues-free-session-with-no-office-confirmation) Cover flow puts the request on the colleague's free session, with no office confirmation (Rework).
Also touches, without closing:
[US-01.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.4.1.md) (the office reassign that a confirmed swap runs; closed in Phase 28),
[US-01.4.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.4.2.md) (the availability view the request starts from; Phase 29's calendar),
[US-01.3.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.3.5.md) (the office-side blacklist warning, shown again at confirmation; closed in Phase 17),
[US-13.6.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.6.3.md) (the blacklist master; Phase 17).
**Open questions:** [OQ-39](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-39.md) (a handover without office confirmation; owner decision **D7**),
[OQ-43](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-43.md) (what the blacklist warning shows an anaesthetist).
**Depends on:** Phase 17 (the pure blacklist helper `src/domain/blacklist.ts`, `BlacklistWarning` and the seeded pairings), Phase 29 (the availability calendar on mobile and web, which is where the request starts) and, through 29, Phase 28 (a List is its own record in a Slot, and reassign moves it between Slots). Phase 14's trigger registry and Phase 15's Booking vocabulary are assumed throughout. This is the last phase of the Schedule track and a **milestone** phase (it ends with a consistency read of the master demo guide).
**Estimated:** 1 session in the outline, but realistically **2**: the store work, the Admin queue, a shared three-step sheet on two apps, three triggers, Playwright, a five-file demo-guide patch and a milestone consistency read do not fit one session. Plan for the split up front. **Session 1** ends green at work item 8: model, seed, pure helpers, store actions with tests, audit labels, and the cover marker retired. At that point the anaesthetist has no request entry point at all (the cover affordances are simply gone, and no scripted beat uses them), so the app is still demoable for S1 to S5. **Session 2** builds items 9 to 15 (the Admin queue, the shared swap sheet and availability entry points, the Swaps panel, the dashboard re-pointing, the triggers, Playwright and capture recipes), then the demo guide, the review pass and the PROGRESS entry.

## Goal

Replace the cover-request marker with a real swap request.

Today an anaesthetist can put a `coverRequest` marker on a **free** session: "offer" on her own
empty session, or "request" on a colleague's. The marker stays `pending` forever, the office never
sees it and nothing moves (RV-15). The catalogue asks for the reverse: an anaesthetist asks for one
of **her own Lists** to go to a named colleague, and the office confirms the reassignment before it
takes effect.

This phase:

- adds a `SwapRequest` record (List, from, to, status, who requested and who decided, and when) in
  the schedule slice, and retires `CoverRequest`, `List.coverRequest` and `requestCover`;
- lets the anaesthetist raise it from the availability view on mobile and web. She picks one of her
  own upcoming Lists and a colleague whose Slot can take it, or taps a colleague's free cell in a
  session where she has a List (the mockup's gesture, kept). If the colleague is on the blacklist for
  the List's surgeon, she sees a short prompt worded per the OQ-43 recommendation (no reason, no
  "blacklist" word), and can still send;
- gives the office an Admin **Swap requests** queue with Confirm and Decline. Confirming runs the
  same reassign core the office's own Reassign list uses (Phase 28), in one audited commit, and
  shows the office the full blacklist warning (with reason) if it applies;
- notifies both anaesthetists (simulated: audit rows plus a derived "Swaps" panel on the
  availability view and a line on the List), and lets the requester withdraw a pending request;
- adds two kinds of demo trigger: an Admin-bar "Colleague requests a swap", and PWA-only office
  stand-ins "Office confirms this swap" and "Office declines this swap".

Owner decision **D7** (OQ-39) gates the shape. The default, used if no answer has come in, is the
catalogue as written: the office confirms. The transition lives in one store function so that a
"direct handover" answer is a small switch (see the risk note in work item 5).

## Before you start: drift check

1. Diff the catalogue for this phase's items against the plan's snapshot:

   ```
   git diff 1f067a8 -- "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-01.4.3.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-01.4.5.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-01.4.1.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-01.4.2.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-01.3.5.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-13.6.3.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/FT-01.4.md" "docs/discovery-reference/Updated Requirements/catalogue/questions/OQ-39.md" "docs/discovery-reference/Updated Requirements/catalogue/questions/OQ-43.md" "docs/discovery-reference/Updated Requirements/catalogue/questions/OQ-08.md" "docs/discovery-reference/Updated Requirements/domain-model.md"
   ```

   If an item changed, re-read it and adjust the work items below before planning. If US-01.4.3 or
   US-01.4.5 is now Retired or Future, drop it from this phase and say so in the PROGRESS entry
   (dropping US-01.4.3 drops the whole phase except the RV-15 removal of the cover marker). If
   acceptance criteria have been added to either story (neither has any at the snapshot), map each
   one to a work item. A new swap item on the same surfaces (for example a colleague accepting before
   the office sees it) comes in only if it is small; otherwise note it for Phase 44's sweep.
2. **D7 / OQ-39 (office confirmation).** Check the ROADMAP decisions table and OQ-39's status.
   - **No answer, or "office confirms":** build this doc as written. If no answer has come in, show a
     small provisional hint in the request sheet ("The office confirms each swap. Whether short-notice
     handovers can skip that step is still being agreed with AA.") and in the Admin queue header.
   - **"Direct handover, office notified"** (OQ-39's recommendation): the request completes at once
     through the same transition (work item 5, `SWAP_NEEDS_OFFICE_CONFIRMATION = false`). The Admin
     screen becomes a **Swap log** (no Confirm or Decline; a "New" pill on rows the office has not
     opened, from a non-persisted seen set, is optional), the PWA office stand-ins are not registered,
     the sheet's button reads "Hand over this List", and the Admin trigger's message says the handover
     happened. Everything else (model, warning, notification, audit) is unchanged. Record the answer
     in the Decisions log.
3. **OQ-43 (what the anaesthetist sees).** If still open, build the recommendation: a short prompt
   without the reason, and without naming the blacklist or who asked. Wording (one constant, work
   item 2): "Check with the office before handing this List to Dr Sharma. You can still send the
   request." with a provisional hint beside it while OQ-43 is open. If answered "say the surgeon has
   asked not to work with this colleague", change only the constant. If answered "show the reason",
   the anaesthetist-facing helper returns the reason too; say so in the PROGRESS entry. OQ-43's second
   question (the anaesthetist does not want the surgeon) is out of scope here (see Out of scope).
4. **Baseline.** Confirm Phases 14, 15, 17, 28, 29 (and, in practice, 30 and 31) are DONE in
   PROGRESS.md. Then read what they left, because this doc names today's files:
   - Phase 28: the `Slot` record and `List.slotId`; `moveListToSlot(api, actor, listId, toSlotId,
     vacatedAvailability)` and `reassignList(api, actor, listId, toAnaesthetistId,
     vacatedAvailability)` over it (Phase 28's handoff: "`moveListToSlot` is the confirm step's
     move"); its refusals (`officeOnly`, `listAuthorised`, `notFound`, `sameSlot`,
     `differentSession`, `slotOccupied`, `targetNotAvailable`), which are the receive rule this
     phase reuses; whether it self-commits or already has a pure core; and where the cover marker
     now lives (Phase 28 moved it to `Slot.coverRequest`, `requestCover(api, actor, slotId, ...)`,
     audit `slot.coverRequest`). The Admin Day drawer is now `components/SlotDrawer.tsx` (was
     `ListDrawer.tsx`).
   - Phase 29: the vacated-Slot status type (`SlotStatusKey`) and the reassign default
     (`defaultSlotStatus`); `isOpenForBooking` in `domain/slotStatus.ts`; the mobile Availability
     tab as a splat `availability/*` with the **Find cover** layer at `/mobile/availability`
     (`AvailabilityScreen.tsx`) and My calendar at `/mobile/availability/calendar`; the web **Find
     cover** grid at `/web/availability` (`AvailabilityGrid.tsx`, whose "(you)" row cells carry a
     "Change" link) and My availability at `/web/availability/mine`.
   - Phase 30: which conflicts `moveListToSlot` raises or clears (its handoff says a confirmed swap
     reconciles with no extra code), and its PWA stand-in "Office reassigns this List" on
     `/mobile/lists/:listId`, which the stand-ins here sit beside.
   - Phase 31: `schedule.draftLists` (a Draft List id must be refused) and `draftListCandidates` /
     `assignDraftList`, the pattern for the target picker.
   - Phase 17: the exact exports of `src/domain/blacklist.ts` (`blacklistWarning`,
     `partitionAnaesthetistsForSurgeon`), `BlacklistWarning` (with its `showReason` prop, default
     false) and `useBlacklistWarning` in `src/shared/schedule/`, and the seeded pairings (Sharma with
     Okafor active, Hughes with Tan ended, as planned). Note two Phase 17 rulings this phase
     **amends** because US-01.4.5 asks for it: "an anaesthetist actor's store writes never check or
     log the blacklist" (now `requestSwap` does check and acknowledge), and Decisions-log item 4 "the
     blacklist is Admin only until OQ-43 is answered" (now the anaesthetist sees the reason-free
     prompt). Record both in the Decisions log.
   - Phase 14: the registry's types (`DemoTrigger`, `choices`, `when`, `surfaces`, `badge:
     'office-stand-in'`), `demoTriggersFor(state, pathname, surface, published)`, the PWA sheet
     (`src/pwa/PwaDemoActions.tsx`), and the actors in `src/store/demoActors.ts`: `OFFICE_ACTOR`,
     `SOUTER_ACTOR` and the simulated office actor. Phase 14 names it `OFFICE_SIMULATION_ACTOR`;
     several later phase docs call it `SIMULATED_OFFICE_ACTOR`. Use whatever `demoActors.ts` exports.
   - Run `grep -rn "coverRequest\|requestCover\|RequestCoverSheet\|CoverTarget\|onCover\|offerCover\|Tap to ask\|Offer cover\|Ask to cover\|Cover requested" aa-prototype/src aa-prototype/visual requirements-board/capture/recipes`
     to see every place the cover marker reaches after 28 and 29.
   - Read the current `PERSIST_VERSION` in `src/store/appStore.ts` (13 at the snapshot; 15 to 31
     will have bumped it) and bump it by one from whatever it is now.

## Reference

**Design files (convention 17):**
- `docs/design/Mobile Availability.dc.html` is the layout reference for the mobile request: tap a
  free session, the request sheet slides up (avatar header, slot line, a short explanation, "Add a
  message", a teal send button), then the completion tick and "Request sent". Keep that anatomy; the
  content changes from "cover this free session" to "take my List".
- `docs/design/Web Availability.dc.html` (the grid and the "Cover requested ✓" confirmed cell state)
  and `docs/design/Web Dashboard.dc.html` (the header "Offer cover" button slot and the "Who's free,
  next 5 days" chips with "Ask to cover") are the web references.
- `docs/design/Admin Review.dc.html` is the pattern for the Admin queue: a table of items awaiting
  the office, row actions, the authorised-state choreography (tick, row dims, badge decrements).
- `docs/design/Design Language.dc.html` gives the tokens: warning `#A16207` with tint `#F9F0DC` and
  on-tint `#7C4D08` for the pairing prompt and the "Warning acknowledged" pill; success for
  Confirmed; neutral sunken and slate for Declined and Withdrawn; pills (radius 999); the `sheet-in`
  and `complete-tick` motions.
- Teal is the only action colour. Crimson stays identity only; the side-nav badge follows the Review
  queue badge that already exists. The pairing prompt is attention (warning tint), never error red.

**Catalogue:** the covered items above; the narrative in
`docs/discovery-reference/Updated Requirements/domain-model.md` ("Slot, List and Draft List",
"Surgeon, surgeons' room and blacklist": the blacklist "warns ... when an anaesthetist hands their
own List to a colleague (swap request) but never blocks"); US-01.4.1's technical discussion (the
move is one temporal event: from, to, by, when); OQ-08 (answered: the owner reference on the List
changes).

**Analysis:**
- `docs/prototype-build/catch-up/GAP-ANALYSIS.md`: theme 4 (Slot, List and Draft List, which
  "includes the swap-request flow"), the open-question line for OQ-39 and OQ-43, the "new beats
  likely" line (swap with office confirm), and the EP-01 table rows for US-01.4.3 and US-01.4.5;
- `docs/prototype-build/catch-up/epics/EP-01.md` (#us-01.4.3, #us-01.4.5);
- `docs/prototype-build/catch-up/analysis/domain-model-delta.md` (#dm-05; also DM-02 and DM-26,
  which this phase builds on);
- `docs/prototype-build/catch-up/analysis/reverse-check.md` (RV-15; the per-scenario line says S2 is
  affected);
- `analysis/prototype-map-apps-mobile-web.md`, `prototype-map-admin.md`,
  `prototype-map-store-seed.md`, `prototype-map-shared.md` and `prototype-map-shell-demo-pwa.md`.

**Code entry points (as at the snapshot; Phases 28 and 29 will have moved some of them):**
- `aa-prototype/src/domain/types.ts`: `CoverRequest` (:277, with its doc comment :273) and
  `List.coverRequest` (:315; Phase 28 moves it to `Slot.coverRequest`), all retired here;
  `ListConflict` (:265); `AuditEntry` (:645).
- `aa-prototype/src/store/lifecycle.ts`: `requestCover` (:844, retired), `reassignList` (:550; Phase
  28 re-implements it over `moveListToSlot`, the core a confirmed swap runs), `VACATED_STATUSES`
  (:541; Phase 29 replaces it with the status master). `listForSlot` and `cardsForList` are in
  `store/selectors.ts` (:39, :71), not `lifecycle.ts`; Phase 15 renames the latter
  `bookingsForList`, and Phase 28 adds `slotFor` and `listInSlot`.
- Layering: `src/domain` imports neither `src/store` nor `src/shared` (checked at the snapshot).
- `aa-prototype/src/store/mutate.ts`: `mutate`, `MutationMeta`, `ID_FORMATS` (:61), `allocateId`,
  `clockISO`, `refuse`, `ok`.
- `aa-prototype/src/store/appStore.ts` (`PERSIST_VERSION`, :130) and
  `aa-prototype/src/domain/seed/index.ts` (`SeedSchedule`, :105, and its assembly).
- `aa-prototype/src/shared/flows/RequestCoverSheet.tsx` (reworked into the swap sheet) and
  `shared/flows/index.ts` (:11).
- `aa-prototype/src/shared/schedule/ListRow.tsx`: the `{ kind: 'offerCover' }` trailing variant
  (:12), its "Offer cover" pill (:82-96) and the doc comment (:102). Retired here.
- Mobile: `apps/mobile/screens/AvailabilityScreen.tsx` (its **own** local `CoverTarget` :19, the
  `cover` state :44, "Tap to ask" :74, "Cover requested" :230, and the `RequestCoverSheet` it renders
  itself, :246-260; the "Find cover" eyebrow :121 stays), `apps/mobile/screens/ForwardListsScreen.tsx`
  (free row "Cover request sent" / "Open for bookings or cover" and `{ kind: 'offerCover' }`,
  :105-120), `apps/mobile/routes.tsx` (`offerCover` :84, `onOfferCover` :101, the `offer` state and
  its `RequestCoverSheet` :144-155), `apps/mobile/screens/ListDetailScreen.tsx`.
- Web: `apps/web/WebApp.tsx` (`cover` state :52, `onCover` in the outlet value :55, the
  `RequestCoverSheet` :74), `apps/web/outlet.ts` (`onCover` in the outlet type, :12),
  `apps/web/routes.tsx` (passes `onCover` to the dashboard and the grid, :31-59 and :118-124),
  `apps/web/types.ts` (`CoverTarget`), `apps/web/screens/DashboardScreen.tsx` (`myFreeList`,
  `offerCover`, `askCover`, the "Who's free" chips, :85-170 and :295-335),
  `apps/web/screens/AvailabilityGrid.tsx` ("Cover requested" :79, the free-cell click :89, the
  subtitle "Find cover fast. Free sessions are clickable." :109, the requested cell :180),
  `apps/web/screens/ListDetailView.tsx`.
- Admin: `router.tsx` (the admin children, :88-106), `apps/admin/routes.tsx`,
  `apps/admin/AdminApp.tsx` (`sectionForPath` :28, `SECTION_PATH` :226, the badge counts),
  `apps/admin/components/SideNav.tsx` (`NavSection`, the items :33-36; the default badge is the
  crimson Review-queue badge, `badgeTone: 'warn'` the amber one), `apps/admin/screens/ReviewQueue.tsx`
  (the queue pattern), `apps/admin/components/SlotDrawer.tsx` (Phase 28's rename of `ListDrawer.tsx`),
  `apps/admin/flows/ReassignListFlow.tsx` (the vacated-status choice and the success moment),
  `apps/admin/tableChrome.ts`.
- Audit reading layer: `shared/audit/actionLabels.ts` (`'list.coverRequest'` :49, and Phase 28's
  `'slot.coverRequest'`), `shared/audit/fieldLabels.ts` (`coverRequest`, :75),
  `shared/audit/auditNarrative.ts` (pure; it has no access to the masters, so it cannot turn ids into
  names). The Audit viewer's entity filter (`apps/admin/screens/AuditViewer.tsx` :47) is derived from
  the entries, so `swapRequest` appears there with no change.
- Demo triggers: `src/shared/demoTriggers/registry.ts`, `types.ts`, `match.ts`,
  `demoTriggers.test.ts` (Phase 14); `src/store/demoActors.ts`; `src/pwa/PwaDemoActions.tsx`
  (Phase 14's sheet; the folder has `PwaDemoPanel.tsx` at the snapshot).
- Tests to change: `store/lifecycle.test.ts` (`describe('requestCover')`, :513-580, removed),
  `store/persistMigrate.test.ts`, `domain/seed/seed.test.ts`, `pwa/pwaPurity.test.ts`,
  `visual/web-phase05.spec.ts` (:48-56 click "Send cover request", shots `w-07-cover-dialog`,
  `w-08-cover-sent`), `visual/mobile-phase03.spec.ts` (:60-67, the "mobile: request cover sheet" test
  that clicks "Tap to ask", shot `m-07-cover`), `visual/pwa-device.spec.ts`.
- **Keep, not part of RV-15:** the free-session note "Free / open for cover" in the seed
  (`domain/seed/index.ts` :210-231, now `Slot.note`) and the matching fallbacks in
  `apps/admin/components/DayGrid.tsx` :303, `apps/web/components/WeekStrip.tsx` :45 and
  `apps/web/screens/ListsScreen.tsx` :50. They describe an open Slot the office can fill, not the
  retired marker, and the capture recipes `US-01.3.3.json` and `US-02.3.1.json` click "open for
  cover". Changing them would change seed content for no requirement.
- Outside the app: `requirements-board/capture/recipes/US-01.4.3.json` (captures the old cover sheet
  on web and mobile) and `US-01.4.2.json` (clicks free cells).

## Work items

Build in this order: model, seed, pure helpers, store, audit labels, retirement, then the Admin
queue, then the anaesthetist surfaces, then triggers and shots.

1. **Domain types** (`src/domain/types.ts`) (DM-05; US-01.4.3):
   - New id alias `SwapRequestId`.
   - `SwapRequestStatus = 'PENDING' | 'CONFIRMED' | 'DECLINED' | 'WITHDRAWN'`. Upper case, like
     `ListState`, and never confused with it.
   - `SwapRequest`:

     ```ts
     interface SwapRequest {
       id: SwapRequestId
       listId: ListId
       fromAnaesthetistId: AnaesthetistId   // the List's owner when requested
       toAnaesthetistId: AnaesthetistId     // the named colleague
       status: SwapRequestStatus
       requestedBy: string                  // actor.who
       requestedAtISO: IsoDateTime
       message?: string
       /** Set when the colleague was actively blacklisted with the List's surgeon at request time. */
       pairingWarningEntryId?: BlacklistEntryId
       decidedBy?: string
       decidedAtISO?: IsoDateTime
       declineReason?: string
       /** Stamped on CONFIRMED: the Slot the List moved out of, and the status that Slot took. */
       vacatedSlotId?: SlotId
       vacatedStatus?: SlotStatusKey        // Phase 29's status-master key (28 called it SlotAvailability)
     }
     ```

   - Remove `CoverRequest` and `Slot.coverRequest` (Phase 28 moved the marker there from
     `List.coverRequest`; remove whichever exists) (RV-15).
   - The date, session, hospital and surgeon are **not** copied onto the request: they are read from
     the List, so the queue always shows the List as it is now. `fromAnaesthetistId` is kept because
     the List's owner changes on confirmation.
2. **Pure helpers** (`src/domain/swaps.ts`, no React, PWA-safe; Vitest in `src/domain/swaps.test.ts`):
   - **Layering.** `src/domain` imports neither `src/store` nor `src/shared`. The helpers below take
     domain-typed inputs (the schedule slice's `lists`, `slots` and `swapRequests`, the masters, and a
     `todayISO` string), never `AppState`, and write names from the master records as they are ("Dr
     Priya Sharma"), never through `shared/format.ts` (Phase 17's rule for `blacklistWarning`). Where
     the state argument is written `state` below, read it as that structural input. If Phase 28 left
     its receive rule inside `src/store`, either move the pure predicate into `src/domain` or put
     `swapTargets` and `swapValidity` in a pure `src/store/swapSelectors.ts` instead; either is
     PWA-safe.
   - `SWAP_NEEDS_OFFICE_CONFIRMATION = true`, with a doc comment naming D7 and OQ-39.
   - `pendingSwapForList(swaps, listId)`: the one PENDING request on a List, or undefined.
   - `swapsInvolving(swaps, anaesthetistId)`: requests where the person is `from` or `to`, newest
     first (the "Swaps" panel).
   - `swapTargets(state, listId, requesterId)`: the colleagues who can receive the List, sorted by
     display name. It uses **the same receive rule Phase 28's `moveListToSlot` uses** (extract it as a
     pure predicate, for example `canReceiveList(state, anaesthetistId, dateISO, session)`, if 28 did
     not; `moveListToSlot` then calls it too): an active anaesthetist other than the requester whose
     Slot for the same date and session (`differentSession` is a refusal) holds no List
     (`slotOccupied`) and is open (`targetNotAvailable`, today `isOpenForBooking`). Whatever the office's reassign would accept, the request accepts, so a
     confirmation never fails on a rule the request passed. Colleagues who fail the rule are not
     offered.
   - `swapValidity(state, swap)`: `null` if the request can still be confirmed, else a plain reason:
     "The List has been cancelled", "The List now belongs to Dr X", "The List has been submitted",
     "The List's day has passed", "Dr Y's session is no longer free", "The colleague is no longer
     active". Confirm and the queue both read it, so a request overtaken by events is shown, not
     silently applied. It is derived, never stored.
   - Anaesthetist-facing prompt, in `src/domain/blacklist.ts` beside Phase 17's helpers:
     `pairingPromptForAnaesthetist(masters, toAnaesthetistId, surgeonId)` returns
     `{ message } | null`. It uses `blacklistWarning` underneath but returns **only** the OQ-43 wording
     (the constant `ANAESTHETIST_PAIRING_PROMPT`, a template filled with the colleague's name from
     the master record, as `blacklistWarning` does): no reason, no surgeon name, no entry id, no
     "blacklist" word. A List with no surgeon
     returns null. Keeping the reason out of the return value means no anaesthetist component can leak
     it through props.
   - Tests:
     - `swapTargets` excludes the requester, inactive anaesthetists and colleagues whose Slot holds a
       List, and matches Phase 28's reassign rule on the same fixtures;
     - `swapValidity` returns each reason for its case and null for a clean request;
     - `pairingPromptForAnaesthetist` returns a message for an active entry, null for an ended one or a
       List with no surgeon, and the message contains neither the recorded reason, the surgeon's name,
       the word "blacklist", nor an en or em dash;
     - `pendingSwapForList` ignores decided requests.
3. **Seed** (`src/domain/seed/index.ts`):
   - `SeedSchedule` gains `swapRequests: Record<SwapRequestId, SwapRequest>`, seeded **empty**, so no
     scenario starts with an item in the queue and S2 Beat 1's side nav is unchanged. The Admin
     trigger (Demo triggers) stages one when the presenter wants it.
   - Remove any seeded `coverRequest` (none at the snapshot).
   - Because the collection sits in `schedule`, `resetDomainState` (`store/mutate.ts` :218) restores
     it from `seed.schedule` with no extra line; check that, and add `swapRequests` to the Demo data
     inspector's entity counts beside Phase 31's `draftLists`.
   - Do not touch the canvas generator or its inputs.
   - **Bump `PERSIST_VERSION` by one.** Extend `persistMigrate.test.ts` for the new version (an old
     persisted blob with `coverRequest` on a Slot, or on a List from before Phase 28, reseeds
     cleanly).
   - Seed tests (`seed.test.ts`), which protect the demo beats rather than patch data:
     - **Souter can request:** on the pristine seed at `DEMO_TODAY`, Dr Souter has at least one DRAFT
       List with a surgeon in the next six days whose `swapTargets` is non-empty. Record which one in
       a comment; the demo guide names it.
     - **The trigger has candidates:** the two Admin trigger choices (Demo triggers) each find a
       candidate on the pristine seed.
     - **The blacklist choice is reachable:** some future DRAFT List's surgeon has an active blacklist
       entry with an anaesthetist in `swapTargets` for that List (Phase 17 seeds Sharma with Okafor).
       If the canvas never produces one, add a second active seed blacklist entry for a pairing that
       does occur (Phase 17's rule: change the blacklist seed, never the Lists), and say so in the
       PROGRESS entry.
     - None of the candidates is a List a scripted beat uses (S2's Rutherford Wed 22 AM and Sharma
       Tue 21 PM, S1's Souter Mon 27 AM, S3's Souter Mon 20 Lists, and `SEED_LIST_IDS`), and none
       would move a List **into** a Slot a scripted beat needs open: S2 Beat 3 reassigns Rutherford's
       Wed 22 AM List to **Dr Sharma's Wed 22 AM** Slot and Beat 2 books Sharma's Tue 21 PM, so
       neither Slot is ever a swap target the seed test or the trigger picks. Hold both lists (Lists
       and target Slots) as one exported constant the trigger also reads.
4. **Runtime ids** (`src/store/mutate.ts` `ID_FORMATS`): add `swapRequest` (`SWN`, pad 3). There is
   no seed prefix, because the seed has none.
5. **Store actions** (new `src/store/swapActions.ts`, exported from `src/store/index.ts`):
   - Common rules: one `mutate()` commit per action with before and after metas, entity type
     `swapRequest`, timestamps from `clockISO(s.clock)`, plain-English refusals with no dashes.
   - `requestSwap(api, actor, { listId, toAnaesthetistId, message? })` (US-01.4.3, US-01.4.5):
     - anaesthetist actor only; the List exists and belongs to the actor (`notOwnList` otherwise; the
       store is the guard, not the UI);
     - the List is DRAFT and its date is today or later ("A submitted List cannot be swapped");
     - refuses a Draft List id (Phase 31's collection) and the requester as the target;
     - refuses a second PENDING request on the same List ("A swap is already waiting for the office
       on this List. Withdraw it first.");
     - the target must be in `swapTargets` ("Dr X's session cannot take a List");
     - **never refuses on the blacklist.** If `blacklistWarning(masters, to, list.surgeonId)` is
       non-null, stamp `pairingWarningEntryId` and add a second meta in the same commit,
       `swap.pairingWarningAcknowledged`, with `after: { toAnaesthetistId, surgeonId, blacklistEntryId }`
       (the Phase 17 acknowledgement pattern, on the anaesthetist's path). This amends Phase 17's
       rule that an anaesthetist actor's writes never check or log the blacklist, because US-01.4.5
       asks for exactly that check; the acknowledgement row sits in the Admin audit only and no
       anaesthetist surface reads it;
     - metas: `swap.request` on the request, and `list.swapRequested` on the List (`after:
       { swapRequestId, toAnaesthetistId }`) so the List's own History tells the story;
     - if `SWAP_NEEDS_OFFICE_CONFIRMATION` is false (D7 direct), call the same transition as
       `confirmSwap` in the same commit, with `decidedBy` = the requester and a `swap.directHandover`
       meta. Build and test this branch only if D7 came back "direct".
   - `confirmSwap(api, actor, swapId, { vacatedStatus? })` (US-01.4.3 "the office confirms the
     reassignment before it takes effect"). `vacatedStatus` is a `SlotStatusKey` and defaults to
     whatever Phase 29 made the reassign default (`defaultSlotStatus`):
     - office actor only; the request is PENDING; `swapValidity` is null (else refuse with its reason);
     - runs **Phase 28's `moveListToSlot` core** in the same commit, so the List moves Slots with its
       Bookings, status history and audit trail intact (US-01.4.1) and Phase 30's conflict rules apply
       exactly as they do on the office's own Reassign list. If `moveListToSlot` self-commits through
       `mutate()`, first split it into a pure core (`moveListToSlotCore(s, actor, listId, toSlotId,
       vacatedStatus)` returning the next state and its metas) called by `moveListToSlot` (and so by
       `reassignList`) and by `confirmSwap`. One source of truth for the move; `ReassignListFlow.test.tsx`
       and the existing reassign tests must pass unchanged after the split;
     - the `list.reassign` meta carries `swapRequestId` in `after`, so the move is one event (from,
       to, by, when) that points at the request;
     - stamps `status: 'CONFIRMED'`, `decidedBy`, `decidedAtISO`, `vacatedSlotId`, `vacatedStatus`;
     - adds `swap.confirm`, plus two `swap.notify` metas, one per anaesthetist (`after:
       { anaesthetistId, role: 'requester' | 'colleague', channel: 'simulated' }`). These are the
       notification (see item 11);
     - if the pairing is blacklisted **now** (re-evaluated, since the blacklist may have changed),
       the Phase 17 `list.blacklistAcknowledged` meta is written by the reassign core as it would be
       for the office's own reassign. Never refuse on it.
   - `declineSwap(api, actor, swapId, reason?)`: office only; PENDING only; stamps DECLINED,
     `decidedBy`, `decidedAtISO`, `declineReason`; metas `swap.decline` plus one `swap.notify` for the
     requester. A request that `swapValidity` rejects can still be declined, which is how the office
     clears one overtaken by events.
   - `withdrawSwap(api, actor, swapId)`: the requesting anaesthetist only; PENDING only; stamps
     WITHDRAWN; meta `swap.withdraw`.
   - **One transition, one place** (the D7 risk): the state change from PENDING to CONFIRMED,
     including the reassign core and the notify metas, is one internal function
     (`applySwapConfirmation(s, swap, decidedBy)`) that `confirmSwap` and the direct branch of
     `requestSwap` both call.
   - Tests (`store/swapActions.test.ts`):
     - every refusal, including the office actor on `requestSwap`, the anaesthetist on `confirmSwap`
       and `declineSwap`, another anaesthetist on `withdrawSwap`, and a second pending request;
     - `requestSwap` onto a blacklisted colleague succeeds, stamps `pairingWarningEntryId` and writes
       exactly one acknowledgement; an ended entry writes none;
     - `confirmSwap` moves the List exactly as `reassignList` does on the same fixture (same List id,
       same Bookings, the vacated Slot per `vacatedStatus`), writes `swap.confirm`, one
       `list.reassign` with `swapRequestId`, and two `swap.notify` rows, all in one commit;
     - `confirmSwap` refuses after the List was reassigned directly, cancelled or submitted, or the
       target Slot was filled; `declineSwap` still works on it;
     - after confirmation, a new request on the same List by its new owner is allowed;
     - determinism: the same actions on the same seed give identical ids and state.
6. **Audit reading layer.**
   - `shared/audit/actionLabels.ts`: "Swap requested", "Swap requested despite a pairing prompt"
     (`swap.pairingWarningAcknowledged`), "Swap requested on this List" (`list.swapRequested`), "Swap
     confirmed by the office", "Swap declined by the office", "Swap request withdrawn", "Anaesthetist
     notified of a swap (simulated)" and, only if D7 is direct, "List handed over directly". Remove
     `'list.coverRequest'` and Phase 28's `'slot.coverRequest'` (the version bump reseeds, so no
     persisted history carries them).
   - `fieldLabels.ts`: add `toAnaesthetistId`, `fromAnaesthetistId`, `swapRequestId`,
     `pairingWarningEntryId`, `declineReason`, `vacatedStatus`; remove `coverRequest`.
   - `auditNarrative.ts` is pure and has no access to the masters, so it shows anaesthetist ids as
     raw values, exactly as it does for `list.reassign`'s `anaesthetistId` today; do not add a lookup
     there. The Audit viewer's entity filter is derived from the entries, so `swapRequest` appears
     with no change. `auditNarrative.test.ts` passes.
7. **Retire the cover marker (RV-15).**
   - Delete `requestCover` from `store/lifecycle.ts` and `store/index.ts`, and its tests in
     `lifecycle.test.ts`.
   - Replace `shared/flows/RequestCoverSheet.tsx` with `shared/flows/SwapRequestSheet.tsx` (item 10);
     update `shared/flows/index.ts`.
   - Mobile `ForwardListsScreen`: the free-session row loses "Offer cover" (`{ kind: 'offerCover' }`)
     and its `onOfferCover` prop; its subtitle becomes "Open for bookings". Remove the
     `offerCover` function, the `offer` state and its sheet from `apps/mobile/routes.tsx`. Nothing in
     the catalogue describes offering an empty session.
   - `shared/schedule/ListRow.tsx`: remove the `offerCover` trailing variant, its pill and the doc
     comment line.
   - Mobile `AvailabilityScreen`: remove its local `CoverTarget`, the `cover` state and the
     `RequestCoverSheet` it renders (item 10 adds the swap entry points).
   - Web: remove `CoverTarget` (`types.ts`), `onCover` from the outlet type (`outlet.ts`), the outlet
     value and the `cover` sheet (`WebApp.tsx`), and the `onCover` props `routes.tsx` passes to
     `DashboardScreen` and `AvailabilityGrid` (item 12 re-points the dashboard). The grid subtitle
     "Find cover fast. Free sessions are clickable." becomes "Find cover fast. Tap your own List to
     ask for a swap."
   - Every "Cover requested", "Cover request sent" or "Tap to ask" string on the availability and
     Forward Lists screens goes (item 10).
   - Grep for `cover` across `src`, `visual` and `requirements-board/capture/recipes` at the end: only
     unrelated uses may remain (for example "covered amount" from Phase 22, "Find cover" as the
     finder's name, and the kept "open for cover" free-Slot notes listed under Code entry points).
8. **Checkpoint: green. Session 1 ends here.** `npm run build`, `npm run build:pwa` and
   `npx vitest run`. `npm run shots` is not expected to pass yet: the cover beats in
   `web-phase05.spec.ts` and `mobile-phase03.spec.ts` are re-pointed in item 14. Say so in the
   hand-over note.
9. **Admin Swap requests queue** (US-01.4.3 "the office confirms"):
   - Route `/admin/swaps` in `router.tsx`, rendered by a new `AdminSwapsRoute` in
     `apps/admin/routes.tsx`; the screen is `apps/admin/screens/SwapQueue.tsx`.
   - Side nav: `NavSection` gains `'swaps'`, labelled "Swap requests", placed after "Review queue",
     with a badge of PENDING requests using the same default badge the Review queue uses.
     `sectionForPath` and `SECTION_PATH` in `AdminApp.tsx` learn the new section.
   - **Pending table** (the `ReviewQueue` pattern, `tableChrome` cells), oldest request first:
     Requested (date and time, mono) · List (date, session, hospital, surgeon, number of Bookings) ·
     From · To · Message · Flags · Actions.
     - Flags: a warning pill "Pairing warning acknowledged" when `pairingWarningEntryId` is set, or
       when the pairing is blacklisted now; a neutral pill with the `swapValidity` reason when the
       request is no longer valid.
     - Actions: **Confirm** (teal; disabled with the reason when invalid) and **Decline** (secondary).
     - The List cell links to that day's Day view with the List drawer's List (the existing Day route).
   - **Confirm sheet** (`apps/admin/flows/ConfirmSwapSheet.tsx`, through `useSurface().Overlay`):
     - a summary line read from the List, for example "Move Dr Souter's Thu 23 Jul AM List (St
       George's, Mr T. Hale, 3 Bookings) to Dr Hughes" (illustrative values);
     - the vacated-Slot status choice, reusing whatever `ReassignListFlow` offers (Phase 28), with the
       same default;
     - Phase 17's `BlacklistWarning` (Admin, with the recorded reason) when the pairing is
       blacklisted; the button then reads "Confirm swap anyway";
     - on success, the same brief success moment as Reassign list ("Swap confirmed"), then the row
       dims and leaves the pending table (the Admin Review choreography), and the badge decrements.
   - **Decline sheet**: optional reason, then "Decline swap".
   - **Decided section** below: the last 20 decided requests with a status pill (Confirmed success,
     Declined and Withdrawn neutral), who decided and when, and the decline reason.
   - Provisional hint in the header while D7 is unanswered (drift check step 2).
   - **SlotDrawer** (Phase 28's rename of `ListDrawer`): when the Slot's List has a pending request, a
     line in the drawer's attention area,
     "Swap requested to Dr Sharma, waiting for the office", with an "Open swap requests" link. The
     office's own **Reassign list** on such a List stays allowed; the request then shows as no longer
     valid in the queue.
10. **Anaesthetist request flow on the availability view** (US-01.4.3 "from the availability view";
    US-01.4.5). Build it on the screens Phase 29 left, one shared sheet for both apps.
    - `shared/flows/SwapRequestSheet.tsx` (through `useSurface().Overlay`, so it is a bottom sheet on
      mobile and a dialog on web, convention 16). Props: `actor`, an optional preselected `listId` and
      an optional preselected `toAnaesthetistId`. Steps inside one sheet:
      1. **Your List:** the actor's own upcoming DRAFT Lists for the chosen day (or the next six days
         when opened without a day), each as a tappable row: date, session, hospital, surgeon, number
         of Bookings. Lists with a pending request show "Waiting for the office" and are not
         selectable. Skipped when a List is preselected.
      2. **Colleague:** `swapTargets` for that List, as tappable rows (name and phone, the
         Who's-free style), not a dropdown. Skipped when a colleague is preselected; if the
         preselected colleague is not a valid target, say why and show the list.
      3. **Confirm:** the header in the mockup's anatomy (colleague's avatar and full name; the slot
         line, for example "Thu 23 Jul · AM · St George's"); the explanation "Ask the office to move this List and
         its Bookings to Dr Sharma. The office confirms each swap." (plus the D7 provisional hint);
         the pairing prompt from `pairingPromptForAnaesthetist` in the warning tint when it applies;
         "Add a message"; and the teal **Send swap request** button, reading "Send request anyway"
         while the prompt shows.
      - Sent state: the completion tick, "Request sent" and "The office will confirm, and you and
        Dr Sharma will both be notified." Refusals show inline in the error tint, as today.
      - The sheet imports nothing from `apps/*` or `shell`, and never receives the blacklist reason.
    - **Mobile availability**: Phase 29's **Find cover** layer (`AvailabilityScreen.tsx` at
      `/mobile/availability`), the finder US-01.4.2 names as the availability view. My calendar
      (`/mobile/availability/calendar`) is for setting one's own availability and gets no swap entry:
      - the persona's own booked List in the "My availability" card (beside Phase 29's "Change"
        button) gains a "Swap" affordance that opens the sheet with that List preselected;
      - a colleague's Free cell is tappable **only** when the persona has a List in that same session
        and the colleague is in `swapTargets`; it opens the sheet with both preselected and the line
        "Ask Dr Ngatai to take your St George's PM List". Otherwise the cell is status only (A8
        unchanged), with no "Tap to ask";
      - a **Swaps** panel at the top when `swapsInvolving` is non-empty (item 11).
    - **Web availability**: the **Find cover** grid (`AvailabilityGrid.tsx` at `/web/availability`),
      not `/web/availability/mine`. The same two entry points: a "Swap" link on the persona's own
      booked cells in the "(you)" row, beside Phase 29's "Change" link, and a colleague's matching
      Free cell. The confirmed-cell treatment of the
      mockup ("Cover requested ✓") becomes "Swap requested ✓" on the persona's own cell while PENDING.
      The same Swaps panel sits above the grid.
    - **List detail** on mobile (`ListDetailScreen`) and web (`ListDetailView`): a read-only line when
      the List has a pending request ("Swap to Dr Sharma requested, waiting for the office" with a
      "Withdraw" link), and the Forward Lists row subtitle gains "Swap requested" while PENDING. No
      new request entry point here; the catalogue puts it on the availability view.
11. **Notification, simulated** (US-01.4.3 goal: both anaesthetists hear the outcome):
    - There is no notification entity. The `swap.notify` audit rows are the record, and the
      **Swaps** panel is the in-app notice, derived from `swapsInvolving` for the persona:
      - as requester: "Waiting for the office" (with Withdraw), "Confirmed: Dr Hughes now has your
        Thu 23 AM List", "Declined by the office" (with the reason), "Withdrawn";
      - as colleague: "Dr Hughes asked the office to hand you Thu 23 AM" while PENDING (date,
        session and hospital only; no patient detail until the List is hers), and "Confirmed: Thu 23
        AM, St George's, is now on your schedule" after.
      - Decided rows show for seven days of demo clock after `decidedAtISO`, then drop off.
    - A received List shows "Handed over by Dr Hughes, confirmed by the office" on its List detail,
      derived from the CONFIRMED request whose `toAnaesthetistId` is the owner.
    - Copy says "simulated" once, in the panel's caption, as the old sheet did.
12. **Web dashboard re-pointed** (`DashboardScreen.tsx`):
    - The header's "Offer cover" button becomes **Request a swap** (the same teal slot) and opens
      `SwapRequestSheet` with no preselection; it is disabled with "No upcoming Lists to swap" when
      the persona has none.
    - "Who's free, next 5 days" stays the finder (US-01.4.2). A colleague chip opens the sheet with
      both preselected when the persona has a List in that session and the colleague is a valid target;
      otherwise the chip is display only (its title says "You have no List in this session"). The
      row's "Ask to cover" link becomes "Request a swap" and shows only when a chip in the row is
      actionable. Remove `myFreeList`, `offerCover` and `askCover`.
13. **Demo triggers** (registry entries; see the next section for labels and effects):
    - Bodies in `src/store/demoSwaps.ts` (exported from the store) so the registry stays thin and
      the PWA closure stays pure: `stageColleagueSwapRequest(api, variant)` and the stand-ins, which
      call `confirmSwap` / `declineSwap` as Phase 14's simulated office actor
      (`OFFICE_SIMULATION_ACTOR`, or whatever `demoActors.ts` exports).
    - The requester in the staged request is the List's owner, as an anaesthetist actor built by a
      small `anaesthetistActor(state, anaesthetistId)` helper in `src/store/demoActors.ts`, so the
      audit reads truthfully.
    - Candidate choice is deterministic: the earliest future DRAFT List (by date, then session, then
      List id) that meets the variant, is not the persona's, has no pending request, is not a
      scripted-beat List and does not target a scripted-beat Slot (the exclusion constant the seed
      test uses, item 3). The target is the first valid colleague by the same order.
    - `demoTriggers.test.ts`: the new ids are unique and dash-free; `demoTriggersFor(state,
      '/admin/swaps', 'bar')` returns the Admin entry and no PWA entry; the PWA entries appear for
      `'pwa'` on the mobile availability route and never for `'bar'`; each variant stages exactly one
      PENDING request; the stand-ins confirm and decline the chosen request; disabled reasons fire
      when there is nothing to act on.
14. **Playwright and capture recipes** (`npm run shots`):
    - `visual/web-phase05.spec.ts`: re-point the old cover beat to the swap sheet (own List cell,
      pick a colleague, "Send swap request", "Request sent"); rename its shots (`w-07-swap-dialog`,
      `w-08-swap-sent`) and its header comment.
    - `visual/mobile-phase03.spec.ts`: the "mobile: request cover sheet" test (it clicks "Tap to ask")
      becomes "mobile: swap request sheet", opened from the persona's own List's Swap affordance on
      Find cover; shot `m-07-swap`.
    - New `visual/swaps-phase32.spec.ts` with `data-shot` hooks for: the web availability swap sheet
      with the pairing prompt showing; the Admin Swap requests queue with one pending row (staged
      with the Demo actions menu) and its warning pill; the confirm sheet with `BlacklistWarning`;
      the Day view afterwards showing the List on the colleague's row; the web Swaps panel with a
      Confirmed row.
    - `visual/pwa-device.spec.ts`: on Mobile Availability, send a request from Souter's own List,
      open the Demo chip, run "Office confirms this swap", and assert the Swaps panel reads
      Confirmed and the List has left Forward Lists.
    - `requirements-board/capture/recipes/US-01.4.3.json`: re-point both shots to the swap sheet
      (own List cell, not "Tap to ask" or "Open for booking"), update `absentReason`/`status` to match,
      and add an Admin shot of the queue. Check `US-01.4.2.json` still finds its cells, and that
      `US-01.3.3.json` and `US-02.3.1.json` still find "open for cover" on the Admin Day grid (kept,
      see Code entry points). Re-capturing the catalogue images is not required; run
      `npm run verify:board` from the repo root.
15. **Finish green:** `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots`;
    `persistMigrate.test.ts` covers the bump; `pwaPurity.test.ts` passes (the sheet, helpers and
    trigger bodies import nothing from `apps/admin`, `apps/demo` or `shell`).

## Demo triggers

The office's side of a swap is normal Admin use (the queue), and the anaesthetist's side is normal
mobile or web use, so neither needs a button in the framed build. Two things do: showing the office
side without first playing an anaesthetist, and completing the mobile side on a handset, where there
is no Admin app. All entries register in Phase 14's registry; nothing is added to the Control Panel
page, which lists them under their screens.

| id | Label | Screen (routes) | Surfaces | Effect | Disabled when |
|---|---|---|---|---|---|
| `swap-colleague-request` | Colleague requests a swap | Admin · Swap requests (`/admin/swaps`) | bar | `choices`: **"To Dr Souter"** (a colleague asks to hand one of their Lists to Souter, so the receiving side then shows on her mobile and web apps) and **"To a colleague blacklisted with the surgeon"** (a List whose surgeon has an active blacklist entry with a valid target, so the queue row carries the warning pill and the confirm sheet shows `BlacklistWarning`). Runs `stageColleagueSwapRequest`, which calls `requestSwap` as the List's owner. Message: "Dr Hughes asked to hand Thu 23 AM (St George's) to Dr Souter. It is waiting in the queue." | no candidate for that choice ("No List on the canvas fits this choice"); D7 direct: the message says it was handed over |
| `swap-office-confirms` | Office confirms this swap | Mobile · Availability (Phase 29's Find cover layer, `/mobile/availability`) and Mobile · List (`/mobile/lists/:listId`, `when` that List has a pending request; it sits beside Phase 30's "Office reassigns this List", whose `when` differs) | pwa | `choices` on Availability: the persona's PENDING requests as requester or colleague ("Thu 23 AM · St George's · to Dr Hughes"); on the List route, that List's request. `confirmSwap` as the simulated office actor with the default vacated status. Message, filled from the request: "The office confirmed the swap. Dr Hughes now has the List." `badge: 'office-stand-in'` | none pending ("No swap requests waiting for the office"), or `swapValidity` gives a reason (shown) |
| `swap-office-declines` | Office declines this swap | same as above | pwa | `declineSwap` as the simulated office actor with the reason "Declined by the office (simulated)". `badge: 'office-stand-in'` | none pending |

The PWA entries are office stand-ins: they show only in the installed PWA's demo sheet, never in the
harness bar, because in the framed build the presenter plays the office in Admin. If D7 comes back
"direct handover", do not register `swap-office-confirms` or `swap-office-declines`; the handset beat
then completes without the office.

## Out of scope

- **A colleague accepting or declining before the office sees the request.** The catalogue has only
  the office confirming. The colleague's agreement is assumed to have happened by phone; record it as
  a discovery point.
- **The office reassigning a List** (US-01.4.1) and its mechanics: Phase 28. This phase only calls
  that core.
- **The office-side blacklist pickers** (US-01.3.5) and the blacklist master (US-13.6.3): Phase 17.
  The anaesthetist's colleague list is **not** split into a blacklisted group, because the group
  label would itself disclose the blacklist (OQ-43); the prompt appears on choosing.
- **OQ-43's second question** (warning the anaesthetist about a surgeon she herself does not want):
  the swap check evaluates only the named colleague against the List's surgeon.
- **Swapping a Draft List** (it has no owner; Phase 31) or a SUBMITTED or AUTHORISED List.
- **Two-way swaps** (each anaesthetist takes the other's List in one step). "Swap" in the catalogue
  is one List to one colleague; a two-way exchange is two requests.
- **A real notification channel** (push, SMS, email) and a notification entity. The Swaps panel and
  audit rows are the simulation.
- **Auto-expiring or auto-declining** stale requests. They show as no longer valid and the office
  declines them.
- **"Play the office" auto-confirming swaps** (RV-22 scaffold): unchanged; it still only authorises
  submitted Lists.
- The full S2 rewrite: Phase 44. This phase adds one beat.

## Manual test checklist

- [ ] Reset. Admin side nav shows "Swap requests" with no badge; the queue is empty with an honest
  empty state; the D7 provisional hint shows if D7 is unanswered.
- [ ] Web, Availability (as Dr Souter): open the day of the seed test's Souter List. Her own List cell
  shows a Swap affordance. A colleague's Free cell in that session opens the swap sheet with both
  preselected; a colleague's Free cell in a session where Souter has no List is status only.
- [ ] In the sheet, choose a colleague blacklisted with the List's surgeon (if the seed offers one for
  Souter; otherwise use the Admin trigger's second choice below for the office side): the warning-tint
  prompt reads "Check with the office before handing this List to Dr ..." and shows no reason, no
  surgeon name and no "blacklist" word; the button reads "Send request anyway". Choose a clean
  colleague: the prompt goes and the button reads "Send swap request".
- [ ] Send. The tick and "Request sent" show; the cell reads "Swap requested ✓"; the Swaps panel shows
  "Waiting for the office"; List detail shows the waiting line with Withdraw. Sending a second request
  on the same List is not offered.
- [ ] Withdraw from List detail: the Swaps panel shows "Withdrawn" and the List can be requested again.
- [ ] Send again, then Admin, Swap requests: the badge shows 1; the row shows the List, From, To, the
  message and no warning pill. Day view: the List drawer shows "Swap requested to Dr ..., waiting for
  the office" with the link.
- [ ] Confirm, keeping the default vacated status: the success moment shows, the row leaves Pending
  and appears under Decided as Confirmed, and the badge clears. Day view: the List and its Bookings
  sit on the colleague's row and the vacated Slot shows the chosen status. The List's History shows
  "Swap requested on this List", the reassignment and "Swap confirmed by the office"; Audit shows two
  "Anaesthetist notified of a swap (simulated)" rows.
- [ ] Back in the web app as Souter: the Swaps panel reads "Confirmed: Dr ... now has your ... List",
  and the List has left her Lists.
- [ ] Admin, Swap requests, Demo actions, **Colleague requests a swap, To Dr Souter**: a pending row
  appears. Confirm it. Web and mobile as Souter: the List is on her schedule, its List detail reads
  "Handed over by Dr ..., confirmed by the office", and her Swaps panel shows the colleague-side row.
- [ ] Demo actions, **To a colleague blacklisted with the surgeon**: the row carries "Pairing warning
  acknowledged"; the confirm sheet shows the amber `BlacklistWarning` with the recorded reason and
  "Confirm swap anyway"; confirming succeeds. Decline instead on a second staging: Decided shows the
  reason, and the requester's Swaps panel shows "Declined by the office".
- [ ] Stage a request, then reassign the same List directly from the Day view: the queue row shows
  "The List now belongs to Dr ...", Confirm is disabled with that reason, and Decline clears it.
- [ ] The Demo actions pill is absent on other Admin screens that have no entries, and the Control
  Panel lists "Colleague requests a swap" under Admin · Swap requests with an Open screen link, and the
  two stand-ins as "Shown in the installed PWA".
- [ ] PWA (`npm run build:pwa` and preview): Mobile Availability, request a swap from Souter's own List;
  the Demo chip shows; **Office confirms this swap** confirms it and the Swaps panel updates; repeat
  with **Office declines this swap**. The chip is absent where no entry applies.
- [ ] Mobile Forward Lists: free rows no longer offer cover and read "Open for bookings"; nothing
  anywhere says "Cover requested", "Offer cover" or "Tap to ask".
- [ ] S2 Beats 1 to 4 run unchanged from a reset (the queue starts empty; Rutherford's Wed 22 AM
  reassignment to Sharma is untouched).
- [ ] The mobile app, the web app and the PWA never show a blacklist reason, a surgeon name in the
  prompt, or the word "blacklist".
- [ ] No en or em dash in any new copy; teal is the only action colour; no crimson on any new control,
  pill or warning.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots` are all green.

## Demo guide updates

In the same session (ROADMAP rule), and this is a **milestone** phase ("After 32: ... swaps with
office confirmation. S2 is re-scripted"):
- `docs/demo-guide/03-demo-script.md`:
  - **S2:** add **Beat 3b: a swap request, confirmed by the office**, after Beat 3.
    - **Click:** Web Availability as Dr Souter, open the seed test's day, tap her List's Swap, choose
      the colleague, Send swap request; then Admin, Swap requests, Confirm, keep the default, Confirm
      swap; then Day view on that date. The optional variant: Demo actions, Colleague requests a
      swap, To a colleague blacklisted with the surgeon, to show the warning pill and "Confirm swap
      anyway".
    - **Say:** "Anaesthetists usually find their own cover. The app lets them ask for it from the
      availability view, and the office confirms, so the schedule stays true. The List moves with its
      Bookings and history, exactly like the office's own reassignment."
    - **Expected:** the queue badge, the confirm moment, the List on the colleague's row, and the
      Swaps panel on both anaesthetists' apps.
    - Beat 3's Say line gains one clause: the office-led reassign is for illness; Beat 3b is the
      anaesthetist-led path.
  - **S2 Discovery points:** add OQ-39 (can a short-notice handover skip the office; the D7 answer if
    in) and OQ-43 (what the anaesthetist is told), and the colleague-acceptance point. Drop "the
    exact List-reassignment mechanics" if Phase 28 already settled it (OQ-08 is answered).
  - **Direct URLs:** add Swap requests `/admin/swaps`.
  - The "Sheets and drawers are deliberately not in the URL" line: "the cover request" becomes "the
    swap request".
- `docs/demo-guide/02-workflows-and-handoffs.md`: **Workflow 3** becomes "find cover: swap request or
  office reassignment". Step 1 changes from "offers a Free session for cover" to "asks for one of her
  Lists to go to a colleague from the availability view"; add the office confirm step and the
  notification handoff; replace the "What not to say" line (no clinician claims an open shift; the
  anaesthetist requests, the office confirms); update the readiness table row "Cover request and
  office List reassignment" to "Swap request with office confirmation, and office List reassignment",
  Phases 28 and 32.
- `docs/demo-guide/01-personas-and-responsibilities.md`: the anaesthetist lines "Use Availability to
  offer a Free session or request cover" and "Find Free anaesthetists and request cover" become "ask
  for one of your Lists to be swapped to a colleague"; the office gains "Confirm or decline swap
  requests".
- `docs/demo-guide/04-presenter-cheat-sheet.md`: the "Claim/sign up for a shift" row now reads "Ask
  for a swap of your own List; the office confirms"; RFP ambiguity 5 gains the swap path and OQ-39;
  one line for the Admin trigger and the two PWA stand-ins.
- `docs/demo-guide/master-demo-guide.html`: mirror every edit above (S2 Beat 3 and the new Beat 3b,
  the discovery points, Direct URLs, Workflow 3, personas, cheat sheet).
- **Control Panel scenario text** (`apps/demo/DemoControlPanel.tsx`, S2): the blurb adds "a swap
  request"; the message adds "then ask for a swap from Web Availability and confirm it in Admin, Swap
  requests".
- **Milestone consistency read:** read `master-demo-guide.html` end to end against the run sheet and
  the cheat sheet, and fix any drift the Schedule track (28 to 32) left, not only this phase's.

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
- **Nothing takes effect before the office confirms** (unless D7 said direct). `requestSwap` changes
  no List, Slot or Booking; only `confirmSwap` moves anything, and only through Phase 28's reassign
  core. There is no second copy of the move logic.
- **Request and confirm agree.** `swapTargets` uses the same receive rule as reassign; `confirmSwap`
  re-checks with `swapValidity`, so a request overtaken by events is refused with its reason, never
  half-applied. Look for races: a direct reassign, a cancel, a submit, a clock advance past the date,
  a filled target Slot.
- **The blacklist never leaks and never blocks.** The mobile app, web app and PWA receive only
  `pairingPromptForAnaesthetist`'s message: no reason, surgeon name, entry id or "blacklist" word, in
  the DOM, props, titles or aria labels. No path refuses or hides a colleague for being blacklisted.
  The Admin side still shows the full warning with the reason at confirmation.
- **Ownership is enforced in the store.** An anaesthetist cannot request a swap of someone else's
  List, confirm, decline, or withdraw another's request, even by calling the action directly.
- **Audit tells one story.** Request, acknowledgement, confirm (with the single `list.reassign`
  carrying `swapRequestId`), decline, withdraw and the two notify rows are each written once, in the
  right commit, with labels; the List's own History shows the swap.
- **RV-15 is fully gone.** No `coverRequest`, `requestCover`, `RequestCoverSheet`, "Offer cover",
  "Cover requested" or "Tap to ask" remains in `src`, `visual` or the capture recipes; free sessions
  are no longer offered for cover.
- **Determinism and seed hygiene.** Swap requests are seeded empty; `PERSIST_VERSION` is bumped; the
  trigger picks candidates deterministically and never a scripted-beat List; the canvas is unchanged.
- **Layering.** `src/domain/swaps.ts` and the new `blacklist.ts` helper import nothing from
  `src/store` or `src/shared`; the reassign receive rule exists once and both `moveListToSlot` and
  `swapTargets` call it.
- **Triggers and PWA purity.** The Admin entry is bar only and scoped to `/admin/swaps`; the stand-ins
  are PWA only; bodies live in `src/store`; the new shared sheet and helpers import nothing from
  `apps/admin`, `apps/demo` or `shell`.
- **Design and copy.** The sheet keeps the Mobile Availability anatomy and is a bottom sheet on mobile
  and a dialog on web; the queue follows Admin Review; warning tint for the prompt and the pill;
  teal-only actions; no crimson on controls or pills; no en or em dashes.

## PROGRESS.md updates

- **Status row** for catch-up Phase 32, and a phase entry with:
  - the drift-check result (items changed or not; D7 / OQ-39 and OQ-43 status and which branch was
    built);
  - what was built, and what was removed (the cover marker, its action, sheet, labels and tests);
  - the `PERSIST_VERSION` bump (from and to);
  - the Souter List and trigger candidates the seed tests pin, for the demo guide;
  - tests added (domain, store, triggers, Playwright);
  - the review pass;
  - the milestone consistency read of the master guide.
- **Decisions log:**
  1. **Supersedes** the 2026-07-21 "New interactions the design added" entry's mobile request-cover
     flow and web "Ask to cover" links: a request now attaches to the requester's own List and ends in
     an office reassignment; offering an empty free session is removed (RV-15). The mockup's "tap a
     colleague's free session" gesture is kept as an entry point where the persona has a List in that
     session.
  2. Office confirms each swap (D7 default, or the owner's answer); the transition is one function so
     a direct-handover answer is a switch.
  3. The anaesthetist sees the OQ-43 recommended prompt only (no reason, no surgeon, no "blacklist"),
     and her colleague list is not split into a blacklisted group; the office sees the full Phase 17
     warning at confirmation. Going ahead is acknowledged in the audit on both sides. **Amends** Phase
     17's Decisions-log item 4 ("the blacklist is Admin only until OQ-43 is answered") and its rule
     that an anaesthetist actor's writes never check or log the blacklist: US-01.4.5 needs both on
     the swap path. The list itself and its reasons stay Admin only.
  4. A swap's target follows the office reassign's receive rule; validity is re-checked at confirm and
     derived in the queue, never stored; stale requests are declined by the office, not auto-closed.
  5. Notification is simulated: `swap.notify` audit rows and a derived Swaps panel; no notification
     entity.
  6. No colleague-acceptance step; the colleague's agreement is assumed to be off-line (discovery
     point).
- **Handoff notes:**
  - For **44**: S2 Beat 3b and Workflow 3 are patched, not rewritten; the PWA parity audit should walk
    the swap beat on a handset with the two stand-ins.
  - For **42**: nothing here is master data; the blacklist remains Phase 17's.
  - If D7 or OQ-43 is answered later: the switch points are `SWAP_NEEDS_OFFICE_CONFIRMATION` and
    `ANAESTHETIST_PAIRING_PROMPT`, plus the queue-to-log change described in the drift check.
