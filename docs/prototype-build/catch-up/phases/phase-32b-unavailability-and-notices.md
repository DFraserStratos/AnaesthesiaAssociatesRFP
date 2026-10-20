# Phase 32b · Unavailability without conflicts, notices that resolve, and alerting the office

**Requirements covered:**
[US-13.8.3](../../../../requirements-board/requirements/stories/US-13.8.3.md) Resolve a notice (new, Confirmed; the "show resolved" filter is Claude's proposal) ·
[US-03.6.3](../../../../requirements-board/requirements/stories/US-03.6.3.md) Ask the office to check a Booking or List (new, Confirmed) ·
[DM-56](../analysis/domain-model-delta.md#dm-56) An anaesthetist's unavailability is never a conflict: conflicts cover hospital closures only ·
[RV-25](../analysis/reverse-check.md#rv-25-unavailability-including-sickness-still-produces-a-conflict-flag-and-the-office-path-keeps-the-list) unavailability, sickness included, still produces a conflict flag and the office path keeps the List ·
[RV-26](../analysis/reverse-check.md#rv-26-provisional-readings-answered-on-19-october-are-still-built-as-provisional) the vacated-session and notice readings answered on 19 October are still built as provisional.
Also reworks, without closing them (each stays with its own phase):
[US-01.5.2](../../../../requirements-board/requirements/stories/US-01.5.2.md) and [US-01.5.4](../../../../requirements-board/requirements/stories/US-01.5.4.md) (conflicts are hospital closures only; built in 30),
[US-01.5.5](../../../../requirements-board/requirements/stories/US-01.5.5.md) (return or assign, now for the office too, with the vacated-session choice; built in 32),
[US-01.6.3](../../../../requirements-board/requirements/stories/US-01.6.3.md) (no Draft List onto an unavailable session; built in 31),
[US-01.4.1](../../../../requirements-board/requirements/stories/US-01.4.1.md) and [US-01.4.3](../../../../requirements-board/requirements/stories/US-01.4.3.md) (the vacated-session question; 28 and 32),
[US-13.6.4](../../../../requirements-board/requirements/stories/US-13.6.4.md) and [US-01.4.2](../../../../requirements-board/requirements/stories/US-01.4.2.md) (the office's order: tier, then preferred pairing; 17 and 28),
[US-13.8.1](../../../../requirements-board/requirements/stories/US-13.8.1.md) (Verify: the panel's place is our design) and [US-13.8.2](../../../../requirements-board/requirements/stories/US-13.8.2.md) (the pool and its sources; 32 and 32a),
[US-13.7.2](../../../../requirements-board/requirements/stories/US-13.7.2.md) (the same tick as a to-do's Clear; 15a),
[DM-41](../analysis/domain-model-delta.md#dm-41) (the Notification record, now with a resolved state).
**Answered and built as answered (no provisional label):** [OQ-81](../../../../requirements-board/requirements/questions/OQ-81.md) part 3 (**D59**), [OQ-84](../../../../requirements-board/requirements/questions/OQ-84.md) (**D60**), [OQ-79](../../../../requirements-board/requirements/questions/OQ-79.md) (**D58**).
**Open, built as the default:** [OQ-113](../../../../requirements-board/requirements/questions/OQ-113.md) (**D54**: the anaesthetist apps order colleagues by availability alone), [OQ-102](../../../../requirements-board/requirements/questions/OQ-102.md) (**D36**: the tier and pairing names stay the plain labels).
**Depends on:** Phase 32a (the `'bookingMoved'` notice kind and the pool row it posts; the single-Booking move). Through it: 32 (`listMoveActions.ts`, `MoveListSheet`, `notifications.ts` and the Admin pool card and page), 31 (Draft Lists, `detachListToDraft`, `assignDraftList`, `shared/scheduleTerms.ts`), 30 (conflicts), 29 (the Slot status master, `isOpenForBooking`), 28 (`moveListToSlotCore`, `reassignList`), 17 (`rankAnaesthetistCandidates`, the privacy boundary), 15a (`ClearWarningButton`, the To-do card), 14 (the trigger registry, stand-in badges). Phase 21 follows and shows the alerts at review.
**Estimated:** 2 sessions. **Session 1** ends green at work item 6: unavailability never a conflict, the office's forced return or hand-on, no assign onto an unavailable session, the vacated-session choice on every path, the seed and the sickness trigger. **Session 2** builds items 7 to 11: resolvable notices, "Alert the office", the office's order, the triggers. Then the demo guide, the screenshots, the review pass and the PROGRESS entry. If session 2 runs long, cut the optional Admin side-nav count badge (item 8) first.

## Goal

Follow up the built Schedule track (28 to 32) for the 19 October answers (D58, D59, D60):

- **Unavailability is never a conflict** (DM-56, RV-25). Remove the `'availability'` conflict kind and its derivation, so conflicts and the conflict dashboard cover hospital closures only. The office marking a session unavailable, sickness included, on a session that holds a List must return the List to the office (a Draft List, origin "Returned: anaesthetist unavailable") or assign it to an available colleague there and then, exactly as the anaesthetist's own path already does. The office never assigns or reassigns a List onto an unavailable session: it is made available first, with the anaesthetist's agreement (US-01.6.3).
- **The vacated-session question has no provisional label** (RV-26, D60). Whoever moves a List, the office or the anaesthetist, chooses whether the vacated session becomes free or unavailable, on every path, marking unavailable included.
- **Notices are active or resolved** (US-13.8.3, D58, RV-26). A tick resolves a notice for every admin, who and when are kept, a "Show resolved" filter brings it back, a count shows how many are active, nothing expires, and it is the same tick as 15a's to-do Clear.
- **Alert the office** (US-03.6.3). An anaesthetist, on mobile and web, alerts the office to a List or Booking with a note; it posts an active notice that stays until ticked. Whether such a Booking may still be submitted is undecided: submit stays allowed.
- **The office's finders order available colleagues by tier, then preferred pairing** (US-13.6.4, US-01.4.2, OQ-102's 19 October note): ordering only, nothing assigned. The anaesthetist apps stay availability-only (D54).

## Before you start: drift check

Baseline `d4db277`.

1. Run `node docs/prototype-build/catch-up/tools/plan-state.mjs --diff US-13.8.3,US-03.6.3,US-01.5.2,US-01.5.4,US-01.5.5,US-01.6.3,US-01.4.1,US-01.4.3,US-13.6.4,US-13.8.1,US-13.8.2,US-13.7.2,OQ-79,OQ-81,OQ-84,OQ-102,OQ-113`, re-read what changed, adjust the work items, and drop and log anything now Retired or Future (if US-13.8.3 or US-03.6.3 went, stop and tell the owner).
2. Confirm Phases 14 to 32a are DONE; read what 32 and 32a delivered, because this doc names some planned code: the `Notification` kind union and `postNotification` (32a adds `'bookingMoved'`), `notificationText`, `NOTIFICATION_POOL_RULE`, `moveListToOffice`, `pushListToSlot`, `markUnavailableAndMoveList`, `MoveListSheet`, `anaesthetistActor`, and 32a's pinned Souter Booking (reuse it for the alert shots).
3. Run `grep -rn "'availability'\|availabilityCause\|VACATED_SESSION_DEFAULT\|requireOpen\|closedSession\|OQ-81\|OQ-84\|OQ-79" aa-prototype/src aa-prototype/visual` for every site to change. Read the current `PERSIST_VERSION` (25 at `d4db277` before 32a; bump by one from whatever it is now).
4. Open questions and the defaults built (each goes on the PROGRESS owner list):
   - **Submit while an alert is open** (US-03.6.3, undecided): submit stays allowed; an alert never changes the submit rules, and the app says nothing about it.
   - **OQ-113 / D54 and OQ-102 / D36** (open): the anaesthetist sheets stay availability-only and name-ordered; the office order uses the plain tier labels and "Preferred".
   - **US-13.8.3's filter** is Claude's proposal: a "Show resolved" switch on the Notifications page and the rail card.
   - **No un-tick.** A resolved notice stays resolved (the catalogue has a tick and a filter, no re-open).
   - **The vacated question on marking unavailable.** The session being marked is the vacated one, so the control pre-selects the status being set and offers Free as the alternative. On any other move it pre-selects Free. Both are ordinary defaults, not labelled provisional.
   - **Office hand-on posts no notice** (the pool is the anaesthetists' moves and alerts); the colleague sees the List arrive as for any office reassignment.
   - **A SUBMITTED List** on a session the office marks unavailable can only be handed on (the office Reassign path); an AUTHORISED List refuses with "authorised and locked", as in 32.

## Reference

- Catalogue: the stories above; `questions/OQ-79.md`, `OQ-81.md`, `OQ-84.md`; `notes/2026-10-19-aa-meeting-with-greg.md` (items #3, #7, #16). To see why an item says what it says: `npm --prefix requirements-board run source -- --item <ID> --text`.
- Plan: ROADMAP.md owner decisions D14, D36, D54, D58, D59, D60 and the "Front-end design", "Owner review: agents test themselves" and "Catalogue screenshots" sections; [reverse-check.md](../analysis/reverse-check.md) RV-25, RV-26; [domain-model-delta.md](../analysis/domain-model-delta.md) DM-41, DM-56.
- Design: `docs/design/Mobile Availability.dc.html` (sheet anatomy), `Admin Day.dc.html` (the rail cards), `Design Language.dc.html` (neutral rows, pills, the complete-tick motion).
- Code (grep before editing, names move): `domain/types.ts` (`ListConflict`, `Notification`, `NotificationKind`), `domain/conflicts.ts`, `store/conflictReconcile.ts`, `store/selectors.ts` (session `conflict` flag), `domain/listMoves.ts` (`receiveRefusal`, `VACATED_SESSION_*`), `store/slotActions.ts` (`moveListToSlotCore`, `reassignList`, `assignListToSlot`, `detachListToDraft`), `store/availabilityActions.ts` (`applySessionWrites`, `holdsListRefusal`), `store/listMoveActions.ts`, `store/draftListActions.ts` (`assignDraftList`), `domain/draftLists.ts` (`draftListAvailability`, `DRAFT_ASSIGN_WARNINGS`), `store/demoSimulations.ts`, `domain/seed/index.ts` (`SEED_SICKNESS`, `applyWed22Facts`), `domain/notifications.ts`, `store/notifications.ts`, `apps/admin/screens/NotificationsScreen.tsx`, `apps/admin/components/NotificationsCard.tsx`, `apps/admin/flows/ReassignListFlow.tsx`, `AssignDraftListSheet.tsx`, `SlotStatusSheet.tsx`, `shared/flows/MoveListSheet.tsx`, `shared/warnings/WarningsPanel.tsx` (`ClearWarningButton`), `domain/pairingPreferences.ts` (`rankAnaesthetistCandidates`), `shared/demoTriggers/registry.ts`, `pwa/PwaDemoActions.tsx`.

## Work items

### Session 1: unavailability and the vacated choice

1. **Drop the availability conflict.**
   - `types.ts`: `ListConflict.kind` becomes `'holiday'` only. `conflicts.ts`: delete `availabilityCause`, the `'availability'` branch of the cause parser and `expectedConflicts`' closed-session derivation (about `:114` to `:126`), and the "Anaesthetist unavailable" label; keep `isBackdropList` and the holiday rule. `store/selectors.ts` (`:306`, the session's `conflict` flag) reads holiday only. `ConflictsScreen`, the Day grid's conflict colour and `ReassignListFlow`'s `targetConflicts` filter lose their availability cases; `ConflictCallout` says closure only.
   - Tests: update `conflicts.test.ts`, `conflictReconcile.test.ts`, `seed.test.ts`, `canvasGolden.test.ts` fixtures, `availabilityActions.test.ts`, `slotActions.test.ts`, `draftListActions.test.ts`, `listMoveActions.test.ts`, `demoSimulations.test.ts`, `phase06Actions.test.ts`; add: a List can never be derived in conflict by a closed session; persisted `'availability'` conflicts do not survive the version bump.
2. **No assign onto an unavailable session (US-01.6.3, D59).**
   - `domain/listMoves.ts`: `receiveRefusal` always requires an active colleague and an open session (drop the `requireOpen` option; the office's accept-and-flag of a closed target goes). `moveListToSlotCore` and `reassignList` refuse `targetNotOpen`; `assignDraftList` and `assignListToSlot` refuse `sessionNotOpen` ("Dr X has marked this session not available. They need to make it available first.").
   - `draftLists.ts`: `draftListAvailability` keeps `notAvailable` rows but they are never selectable; delete `DRAFT_ASSIGN_WARNINGS.closedSession`. `AssignDraftListSheet` and `ReassignListFlow` show a closed colleague as a neutral, unselectable row ("Not available this session") with the demo button of work item 6; the collapsed "Not available" group in the reassign picker stays only as that read-only list.
3. **The office is forced to return or hand on (D59, US-01.5.5).**
   - `availabilityActions.ts`: `applySessionWrites` reports `heldListIds` for any actor (the `actor.role === 'anaesthetist'` condition goes); `holdsListRefusal` words are actor-neutral where needed. Every office writer of a session status therefore refuses a closed status on a session that holds a List.
   - Extend 32's `markUnavailableAndMoveList` (`store/listMoveActions.ts`) to both actors (the anaesthetist keeps her own-session check; the office may act on any anaesthetist's session): same choice `{ route: 'office' } | { route: 'colleague'; toSlotId }`, same one commit (List leaves, then the session takes the closed status), `detachListToDraft` origin `unavailableReturn` for the return, `moveListToSlotCore` for the hand-on, and the new `vacatedStatus` (item 5). Anaesthetist calls still post the pool notice (32); an office call posts none and writes `list.unavailableReturn` or `list.reassign` audit rows with the office as actor.
   - Admin UI: wherever the office writes a status (`SlotStatusSheet` from the Day grid and drawer; find callers of `setAvailability`): choosing a closed status on a session holding a List opens a "Where does this List go?" step in the same sheet: "Return to the office" (primary) or a colleague picker ordered as in item 10 with open sessions only. Sheet anatomy per Mobile Availability; no crimson, teal only.
4. **Re-point "Simulate sickness".** `store/demoSimulations.ts` `simulateSickness` calls the new action as `OFFICE_ACTOR` with a route, not `setAvailability` alone. Registry entry `simulate-sickness` (Admin Day and Conflicts, bar): its choices become one row per candidate List ending "to the office", plus a "to a colleague" row when an open colleague exists (the first by item 10's order). Description and result message say the List went to the Draft Lists or to Dr X, "no conflict". `sicknessRefusal` keeps its checks. Update `demoSimulations.test.ts` and `demoTriggers.test.ts`.
5. **The vacated-session choice, everywhere (D60, RV-26).**
   - `listMoves.ts`: delete `VACATED_SESSION_DEFAULT`'s "open, provisional" docs; keep `VACATED_SESSION_CHOICES` (free, unavailable) and one `defaultVacated(onUnavailablePath, statusBeingSet)` helper (Free, or the status being set).
   - One shared control `shared/flows/VacatedSessionChoice.tsx` (the radiogroup now in `MoveListSheet`, minus the "still being confirmed" hint) used by `MoveListSheet` (every step that vacates, **and** the unavailable prompt, which no longer silently takes the status), `ReassignListFlow` (the "Keep as is" default goes: the List never leaves a closed session now), and item 3's office step. The "Your session stays ..." branch of `MoveListSheet` (a List moved out of an already closed session) is dead: remove it.
   - `markUnavailableAndMoveList` and `reassignList` take and validate `vacatedStatus` (an in-use status the actor may set; for an anaesthetist only statuses she may set).
6. **Seed and PERSIST_VERSION.** Re-seed `SEED_SICKNESS` (Rutherford, Wed 22 Jul AM): the session stays Unavailable ("Unwell, short notice", recorded 07:40 by the office) but its Christchurch Eye Surgery List is **returned**: a Draft List (same List id, state DRAFT, origin `unavailableReturn`, `draft` trail by the office at `recordedAtISO`), with no conflict; the Southern Cross closure conflicts stay. Update `applyWed22Facts`, the seed audit rows (`seed/index.ts` about `:440`), `seed/draftLists.ts` ordering and the Draft List counts in `seed.test.ts`, `listMoveSeed.test.ts` and `officePrivate.ts`'s comment. Confirm Dr Sharma's Wed 22 AM is Free and that Rutherford's Draft List is the S2 Beat 3 target. Bump `PERSIST_VERSION` (add a `persistMigrate` test).

### Session 2: notices, alerts and the order

7. **Resolvable notices (US-13.8.3, DM-41, D58).**
   - `types.ts` `Notification` gains `resolvedAt?: IsoDateTime` and `resolvedBy?: string` (the office actor's `who`); `domain/notifications.ts` gains `isActive(n)`, `activeCount`, and `NOTIFICATION_POOL_RULE` becomes: sources `['listMoved', 'bookingMoved', 'officeAlert']`, `expiresAfterDays: null`, `actionable: true`, `pageSize: 6`; its provisional doc and the "still being confirmed" caption on the Notifications page (hook `admin-notifications-provisional`) go.
   - `store/notifications.ts`: `postNotification` stays the only creator; one new action `resolveNotification(api, actor, id)` is the only updater (office only; refuses an unknown or already resolved id; writes the two fields once; audit `notification.resolve` with before and after). Rewrite the header ("nothing updates or deletes a notification" bends for this one tick) and flip the matching assertion in `notifications.test.ts`. Selectors: `notificationPool(state, { page, showResolved })` (active by default, newest first; with `showResolved` all, resolved rows marked), `activeNotificationCount`. No per-user state: one admin's tick hides it for all.
   - The colleague's "Moved to you" notice (`movedToMe`) ignores the office's tick: it is the colleague's own notice.
8. **The panel and page.**
   - Extract `ClearWarningButton`'s tick into one shared control (`shared/ui/TickButton.tsx`, labelled per use) used by the To-do card and here, so the affordance is the same (US-13.7.2).
   - `NotificationsCard` (Admin Day rail): heading "Notifications" with the active count, each row with the tick (office only) and its message; ticking uses the complete-tick motion and the row leaves. `NotificationsScreen`: a tick column, a "Show resolved" switch (`?resolved=1`, kept in the URL with `?page=`), resolved rows muted with "Resolved by Kirsty W., Tue 21 Jul 09:14"; empty-state copy covers alerts as well as moves. Optional: the count as a badge on the Notifications side-nav item (cut first if short of time).
   - New `NotificationRow.target` kind `{ kind: 'booking', listId, bookingId, dateISO }` opens the Admin Booking detail for an alert on a Booking.
9. **Alert the office (US-03.6.3).**
   - Types: `NotificationKind` gains `'officeAlert'`; the record carries `bookingId?`, the required `message` (the note), `fromAnaesthetistId`, and the snapshot fields; `route` and `cause` become optional (move records keep them). `notificationText` reads "Dr Hughes asked the office to check Thu 23 Jul AM (St George's, Ms A. Reid)" with the note beneath, or "... a Booking for Hemi Walker on ..." for a Booking.
   - Store: `alertOffice(api, actor, { listId, bookingId?, note })` in a new `store/officeAlertActions.ts`: anaesthetist only; the actor's own ACTIVE or SUBMITTED List (or a Booking on it); a non-blank note of 1 to 300 characters; refuses a second alert while one for the same List or Booking is still active ("The office already has an alert on this."). One commit through `mutate()` posting through `postNotification`, audit `notification.alert` on the List or Booking. It touches no Booking state, warning or submit rule.
   - UI (frontend-design applies): "Alert the office" in `BookingDetailBody`'s action stack and on `ListDetailScreen`/`ListDetailView`, mobile and web, for the owner only; a bottom sheet on mobile and a dialog on web (`useSurface().Overlay`) with a required note field and "Send to the office"; once sent, the entry shows "The office has been alerted" with the note and, when it is ticked, "The office has dealt with this". Words: "alert the office", never "flag" or "slot"; never "Draft List" to the anaesthetist.
   - Admin: an active alert shows on the Admin List drawer and Booking detail as "Alert from Dr X: note" with the tick, so the office sees it where it works; Phase 21 adds it to review.
10. **The office's order: tier, then preferred pairing (US-13.6.4, US-01.4.2, D36, D54).**
   - `domain/pairingPreferences.ts` `rankAnaesthetistCandidates`: sort by tier, then preferred before not-marked within a tier, then the seeded shuffle; update its doc ("preferred pairings are marked, not lifted" goes) and tests. Consumers keep the Not-preferred group apart and the tier filter: `AssignDraftListSheet`, `AvailabilityFinderSheet`, `ReassignListFlow`, item 3's office picker, and `simulateSickness`'s colleague choice.
   - The anaesthetist apps (`pushTargets`, `MoveListSheet`, 32a's move sheet) stay availability-only, name order, no tier or preference (D54); `apps/officePrivacy.test.ts` passes with no new allowlist entry. Name-ordered office surfaces (the Day grid's "Who's free") stay so.
11. **Demo triggers** (Phase 14's registry only; bodies in `src/store`; see the next section) and the **tests** listed under the checklist: domain (conflicts, receive rule, rank order, notice helpers), store (the forced office choice, vacated choice, resolve, alert, refusals), UI (Notifications tick and filter, alert sheet), registry, seed pins, PWA purity.

## Demo triggers

Registry entries only, never on the Control Panel page; "Alert the office", the tick and "Show resolved" are product actions, not triggers.

- **Simulate sickness** (re-pointed, Admin Day and Conflicts, bar): the List goes to Draft Lists or to a colleague, no conflict.
- **Ask Dr X to make this session available** (Admin, Assign Draft List picker row and the reassign picker row for a closed colleague; `colleague-stand-in` badge, bar): runs `setAvailability` as `anaesthetistActor` to set that colleague's session Free; the row becomes assignable. Disabled with a reason when the session holds a List or the colleague is not closed.
- **Office resolves this alert** (PWA sheet, Mobile Booking and List, `office-stand-in` badge): ticks the viewed Booking or List's active alert as `OFFICE_SIMULATION_ACTOR` so the PWA can show the resolved line; it also appears on the bar where the screen can host it. Disabled when there is no active alert.
- Existing **Colleague moves a List to the office** creates notices to tick; no new trigger is needed for the Admin tick.

## Out of scope

- A hospital closure: still a conflict, still a soft warning, still reassigned from Conflicts (US-01.5.2).
- Un-ticking, archiving, deleting or expiring a notice; a per-user read state.
- Letting a Booking move post an optional notice (32a owns the single-Booking pool row); an alert's effect on submit; the alert at review (Phase 21).
- Tier or preference ordering in the anaesthetist apps (D54) and any tier or pairing renaming (D36).
- Several Lists at once on an office range of days off beyond one List per prompt, as in 32.
- Sending the update email from a pool row (Phase 35).
- The Future Work lane.

## Manual test checklist

The agent runs every item itself in the running app and reports it with evidence; none is handed to the owner.

- [ ] Reset. Admin Day, Wed 22 Jul: Rutherford's AM reads Unavailable with no flag and his List waits in Draft Lists ("Returned: anaesthetist unavailable"); Conflicts lists only the Southern Cross closure rows.
- [ ] Admin Day, open a booked session, set its status to Unavailable: the sheet forces "Return to the office" or a colleague (open sessions only, in tier then preferred order, Not preferred apart); the vacated-session choice shows with no "still being confirmed" text; confirm each route, check Draft Lists or the colleague's row, and that no conflict appears.
- [ ] **Simulate sickness** on a List with Bookings: the result line says where the List went; no Conflicts row.
- [ ] Assign Draft List and Reassign: an unavailable colleague shows but cannot be picked; **Ask Dr X to make this session available** frees the row, then assign works. Preferred sorts first within a tier.
- [ ] Web and mobile as Dr Souter: mark a booked session unavailable: return or hand on, then the vacated choice (pre-selected Unavailable); the pool gets one notice.
- [ ] Notifications (rail and page): active count; tick a notice and it leaves for every admin (reload as another persona); **Show resolved** brings it back with who and when; the count drops; the same tick shape as the To-do Clear.
- [ ] Web and mobile as Dr Souter: **Alert the office** on a List and on a Booking with a note: the notice (with the note) is active in Admin, opens the List or Booking, and stays until ticked; submitting the List still works while it is open; PWA **Office resolves this alert** shows the resolved line.
- [ ] No "slot", no en or em dashes, no crimson on controls; mobile at 390px; keyboard reaches the tick and the sheets.

## Demo guide updates

- `docs/demo-guide/03-demo-script.md`, **S2**:
  - **Beat 3** (illness cover): rewrite. The sick anaesthetist's List is already in Draft Lists; Click: Draft Lists, Rutherford's returned List, Assign, pick Dr Sharma by name (tier order, Preferred pill); Say: "Sickness is never left as a flag. The List comes straight back to the office and is handed on from one screen"; Expected: the List on Sharma's row, Rutherford's AM Unavailable, no conflict. The closure conflicts stay on Conflicts for the Southern Cross rows.
  - **Beat 3a**: Simulate sickness now sends the List to Draft Lists or a colleague; drop the "Conflicts shows Anaesthetist unavailable" step and keep the closure move.
  - **Beat 3c**: the unavailable prompt gains the vacated-session choice; add an optional pointer: **Alert the office** on a Booking, then Admin **Notifications**: tick it, **Show resolved**.
  - **Discovery points**: OQ-81 part 3, OQ-84 and OQ-79 are answered (remove them as open); add OQ-113 and OQ-102 (open ordering and names) and US-13.8.1's panel placement.
- `02-workflows-and-handoffs.md` (Workflow 3 and the office sickness line near `:229` to `:246`): sickness returns or hands on; the vacated session is always asked; notices resolve by tick; alerts.
- `01-personas-and-responsibilities.md`: the anaesthetist gains "alert the office about a Booking or List"; the office item 13 gains "tick notices resolved".
- `04-presenter-cheat-sheet.md` (the OQ-84 and OQ-81 lines near `:309` to `:326`, the Demo actions line near `:253`): answered, not open; the two new triggers.
- `master-demo-guide.html`: mirror every edit above. **Control Panel S2 text** (`apps/demo/DemoControlPanel.tsx`): sickness returns the List; no availability conflict.

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19), after the review pass and before the PROGRESS entry. Re-run `node docs/prototype-build/catch-up/tools/recipe-status.mjs 32b` first. The plan update never touches recipes or images.

| Item | Recipe now | When done |
|---|---|---|
| [US-13.8.3](../../../../requirements-board/requirements/stories/US-13.8.3.md) | none (create it) | captured. Shot `resolve-notice` (admin, start `/admin/notifications`, a notice staged with `colleague-moves-list-to-office`): states `active` (the tick, highlighted), `resolved` (after the tick: gone, count down), `show-resolved` (the switch on; who and when). Caption: "An admin ticks a notice resolved; it is hidden for everyone and kept". |
| [US-03.6.3](../../../../requirements-board/requirements/stories/US-03.6.3.md) | none (create it) | captured. Shot `alert-office`: web and mobile on 32a's pinned Souter Booking, states `action` (button, highlighted), `note` (the sheet with a note), `sent`; plus an admin state `notice` (the pool row with the note, then ticked). Caption: "Alert the office with a note; it stays until someone ticks it". |
| [US-01.5.2](../../../../requirements-board/requirements/stories/US-01.5.2.md) | captured · `unavailable-conflict` shows the L-29104 flag | rename to `unavailable-draft`: Admin Day Wed 22, Rutherford's AM Unavailable, no flag, the Draft Lists band; caption says unavailability is never a conflict. Keep `holiday-conflict`; check `phone-advice-warning`, `recurring-clash`. |
| [US-01.5.4](../../../../requirements-board/requirements/stories/US-01.5.4.md) | captured · `conflicts-screen`, `conflict-reassigned` (L-29104), `simulate-sickness` | closure rows only; `conflict-reassigned` re-pointed to a Southern Cross row; `simulate-sickness` stages the re-pointed trigger and shows Draft Lists, not Conflicts. Captions say "Closed hospitals" only. |
| [US-01.5.5](../../../../requirements-board/requirements/stories/US-01.5.5.md) | captured · `unavailable-prompt` (mobile, web, admin) | add a `vacated` state (the free or unavailable choice, no provisional text) on mobile and web, and an admin state for the office's forced choice in `SlotStatusSheet`. |
| [US-01.6.3](../../../../requirements-board/requirements/stories/US-01.6.3.md) | captured · `assign-draft-list` (`pick`, `warning`) | `pick`: unavailable colleagues unselectable with the demo button, tier then Preferred order; `warning`: no closed-session warning left (not-preferred stays). |
| [US-13.6.4](../../../../requirements-board/requirements/stories/US-13.6.4.md) | captured · `preferred-picker` (L-29104 reassign) | re-point to Assign Draft List on Rutherford's returned List; Preferred first within the tier. |
| [US-13.8.1](../../../../requirements-board/requirements/stories/US-13.8.1.md) | captured · `notification-pool` | card shows the active count and ticks; page has no "still being confirmed" caption; caption mentions active notices. |
| [US-13.8.2](../../../../requirements-board/requirements/stories/US-13.8.2.md) | captured · `move-notification` | rows carry the tick; check `NT` ids still resolve. |
| [US-13.7.2](../../../../requirements-board/requirements/stories/US-13.7.2.md) | captured · `todo-list` | no change expected; check the shared tick still resolves its click target. |
| [US-01.4.1](../../../../requirements-board/requirements/stories/US-01.4.1.md), [US-01.4.2](../../../../requirements-board/requirements/stories/US-01.4.2.md), [US-01.4.3](../../../../requirements-board/requirements/stories/US-01.4.3.md) | `admin-reassign`, the finders, `move-list` | reassign picker is open-only and shows the vacated choice; finders ordered tier then Preferred; `move-list` shows the unlabelled vacated choice. |

**Recipes this phase breaks** (grep at plan time, confirm with `--dry`): every recipe that names `L-29104-2026-07-22-AM`, Rutherford's Wed 22 AM, `/admin/conflicts`, `admin-notifications-provisional` or `move-vacated`: among them `US-01.3.2`, `US-01.3.5`, `US-01.3.6`, `US-01.4.1`, `US-01.4.3`, `US-05.2.4`, `US-10.3.1`, `US-13.6.3` as well as those in the table; plus recipes shooting the Booking action stack or the List actions (a new button).

**ATLAS.md.** Update Routes (`/admin/notifications?resolved=1`, the tick and count), Seed data (Rutherford's returned Draft List; no availability conflict; the provisional caption row removed), Overlays (Alert the office, the office's forced choice step, the vacated choice), Demo actions (the three triggers above), Existing hooks (`resolve-notice-*`, `alert-office-*`, `vacated-choice-*`).

## Adversarial review (after build)

The standard pass (PROGRESS convention 18): three independent Opus reviewers (quality, bugs/correctness, plan adherence), this session verifies every finding and fixes the confirmed ones with a test, then re-greens. Do not re-raise anything in the Decisions log.

**Steer reviewers at:**
- **No availability conflict anywhere.** The kind, derivation, label, colour, selectors and recipes are gone; a closed session never derives a conflict; stale persisted conflicts are dropped by the version bump; holiday conflicts unchanged.
- **Forced choice for every actor and every writer.** No status write path (office sheet, series, range, sickness trigger, demo clock) leaves a List on a closed session; the commit is one: List leaves, then the status; locked Lists refuse as designed.
- **No assign onto a closed session** through `assignDraftList`, `assignListToSlot`, `moveListToSlot`, `reassignList` or the store directly; the only route is "made available first".
- **One vacated control.** No path keeps a default hint or a "Keep as is"; the choice is validated in the store; `VACATED_SESSION_DEFAULT`'s provisional text is gone.
- **One tick.** `resolveNotification` is the only updater, office only, audited, idempotent; hidden for every admin; resolved fields never rewritten; the To-do Clear shares the control; nothing expires.
- **Alert integrity.** Owner only; a note is required; no effect on submit, warnings or Booking state; the duplicate rule; the notice opens the right target; the colleague's "Moved to you" is unaffected by ticks.
- **The order is ordering only, office only.** Tier then Preferred within a tier, Not preferred still apart; nothing from the office-only slice reaches the anaesthetist apps' DOM, props, titles or aria labels; `officePrivacy.test.ts` has no new allowlist entry; name-ordered surfaces unchanged.
- **Triggers and PWA purity.** Registry only; bodies in `src/store`; stand-ins badged; the colleague stand-in only sets that anaesthetist's session free and never one holding a List; PWA closure stays pure.
- **Determinism and seed.** `PERSIST_VERSION` bumped with a migrate test; the seed's Rutherford change RNG-free and pinned; S1 to S5 still run; canvas goldens updated deliberately.
- **Design and copy.** Sheets keep the Mobile Availability anatomy; teal only; neutral not red for blocked rows; no "slot", "swap", "flag" for the alert, no en or em dashes; anaesthetists never see "Draft List".

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry; each with route and persona): the defaults in "Before you start" item 4 (submit while alerted, no un-tick, the vacated control pre-selected, the office hand-on posting no notice, SUBMITTED and AUTHORISED Lists), the "Show resolved" proposal (Admin, Notifications), the panel's place and count (US-13.8.1, Verify), the seeded Rutherford change (Admin, Draft Lists), the alert limit (one active per target), and OQ-113 and OQ-102 still open.
- **Status row** for Phase 32b and a phase entry: the drift-check result against `d4db277`; the names 32 and 32a delivered that this used; what was built; `PERSIST_VERSION` from and to; the seed pins; the checklist with evidence; tests added; the review pass; the catalogue screenshot result with REPORT.md counts before and after.
- **Decisions log:**
  1. **Unavailability is never a conflict (D59, OQ-81 part 3)**: supersedes Phase 30's office-recorded sickness keeping its conflict and Phase 31's reassign-from-a-closed-session; the office is forced to return or hand on.
  2. **No assign onto an unavailable session (D59, US-01.6.3)**: supersedes 31's accept-and-warn for a closed session.
  3. **The vacated-session choice is asked on every path (D60, OQ-84)**: supersedes 28's and 32's provisional default and the "Keep as is" reassign default.
  4. **Notices are active or resolved (D58, OQ-79)**: supersedes 32's keep-every-notice pool and its "append-only, no actioned state" rule; one tick, audited, nothing expires.
  5. **Alert the office (US-03.6.3)**: a new notice kind; submit unaffected.
  6. **The office's order is tier, then preferred pairing (OQ-102's 19 October note)**: supersedes 17's "preferred marked, not lifted"; anaesthetist apps stay availability-only (D54).
- **Handoff notes:** for **21**: show active alerts at review and add the alert tick there; for **35**: alert and resolved rows are further inputs to the update email; for **44**: S2 Beats 3, 3a and 3c are patched here, and the PWA parity audit walks the alert and its stand-in.
