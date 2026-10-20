# Phase 38a · Edit until AUTHORISED, the main view and search

(The file keeps its historical slug, `find-past-work`; the plan tools pin it in `plan.json`.)

**Requirements covered:**
[DM-55](../analysis/domain-model-delta.md#dm-55) (the anaesthetist's edit window and the main view's exit) ·
RV-19 (anaesthetist edit rights no longer end at SUBMITTED; supersedes binding convention 6) ·
[FT-07.2](../../../../requirements-board/requirements/stories/FT-07.2.md) SUBMITTED ·
[US-07.2.1](../../../../requirements-board/requirements/stories/US-07.2.1.md) Anaesthetist can still edit a submitted List ·
[US-07.2.3](../../../../requirements-board/requirements/stories/US-07.2.3.md) Office corrections (the last change stands) ·
[US-07.4.2](../../../../requirements-board/requirements/stories/US-07.4.2.md) Anaesthetist's main view ·
[US-07.4.1](../../../../requirements-board/requirements/stories/US-07.4.1.md) List leaves the main view once authorised ·
[FT-07.4](../../../../requirements-board/requirements/stories/FT-07.4.md) List visibility in the anaesthetist app ·
[US-03.1.6](../../../../requirements-board/requirements/stories/US-03.1.6.md) Find past work and old invoices ·
[US-03.1.7](../../../../requirements-board/requirements/stories/US-03.1.7.md) Search Bookings by NHI or patient name.
All ten are Confirmed (status 4) at `d4db277`. Owner decisions **D9** (answered 2026-10-07, changed
2026-10-16: a List leaves the main view at AUTHORISED, not when billed; invoices show at once; search
on name, NHI or date, no calendar archive) and **D63** (answered 2026-10-16: the anaesthetist can see
and change a submitted List until the office authorises it; changes audited and seen at review; last
change stands; AUTHORISED immutable) are both answered
([OQ-31](../../../../requirements-board/requirements/questions/OQ-31.md), OQ-26, OQ-17). Built as
answered, no provisional label.
Treated here without closing it: [DM-39](../analysis/domain-model-delta.md#dm-39) (its last sentence
only: search is selectors and UI only).
Read alongside (not closed here):
[EP-07](../../../../requirements-board/requirements/stories/EP-07.md) (the four List states),
US-07.3.2 (AUTHORISED stays immutable),
[US-02.5.5](../../../../requirements-board/requirements/stories/US-02.5.5.md) (the audit the edits land in),
[FT-03.1](../../../../requirements-board/requirements/stories/FT-03.1.md),
[US-03.1.1](../../../../requirements-board/requirements/stories/US-03.1.1.md) (the schedule to List to Booking to Procedure drill-down),
[US-03.1.4](../../../../requirements-board/requirements/stories/US-03.1.4.md) (web parity),
[US-15.0.2](../../../../requirements-board/requirements/stories/US-15.0.2.md) (mobile-first),
[US-12.2.1](../../../../requirements-board/requirements/stories/US-12.2.1.md) (outstanding balances, where an authorised List's invoices show),
[US-03.7.1](../../../../requirements-board/requirements/stories/US-03.7.1.md) (post-op event on a past Procedure; Phase 39b),
[US-08.6.3](../../../../requirements-board/requirements/stories/US-08.6.3.md) and
[US-08.6.5](../../../../requirements-board/requirements/stories/US-08.6.5.md) (the anaesthetist's own additional invoice and credit note; Phases 38b and 39 reach them through this phase's search),
[AR-22](../../../../requirements-board/requirements/artifacts/AR-22.md) `#still-visible`,
[AR-24](../../../../requirements-board/requirements/artifacts/AR-24.md) `#list-submitted` and `#edit-until-authorised`,
[AR-19](../../../../requirements-board/requirements/artifacts/AR-19.md)`#view-schedule`.
Evidence: points 26, 33, 49 and 50 of the 2026-10-16 Greg note and point 11 of the 2026-10-19 Greg
note ("Is there any particular reason why the anaesthetist can't edit it again?" "Not particularly."
Cut-off: "Authorised"; "I don't really picture it as an archive, more just a search function";
the new invoices show in the balance quickly, Xero's ID returns at once), and points 2, 16 and 41 of
[the 2026-10-07 client meeting note](../../../../requirements-board/requirements/notes/2026-10-07-aa-client-meeting.md)
(the main view that starts at today).
**Depends on:** **31** only (Draft Lists, which never reach an anaesthetist's view per OQ-86; it
sits behind 28 to 30, so List records, My calendar's month grid and the recurring-booking repopulate
paths are all built). Runs **after 32b, before 20**: the Contracts track opens after it, 20's
Contract change uses its edit window, and 38b, 39 and 39b use its search as their entry point for
authorised and invoiced work. It no longer waits on billing, the ledger (36) or the outstanding list
(38): none is built yet, so the seeded history goes in the shapes the prototype has today and 20 to
25 and 36 carry it over (handoff).
**Estimated:** 2 sessions. Session 1: work items 1 to 5 (the edit window, the exit and label, invoices
at once, the main view on mobile and web). Session 2: items 6 to 11 (search module, history seed,
look-back selectors, search and date lookup on both apps, what a past List shows, tests, shots and
docs).

## Goal

The anaesthetist's side of List approval (EP-07, confirmed 19 October). Today the prototype is the
opposite of the catalogue on three points: a SUBMITTED List is read only for the anaesthetist
(`editRefusal`: "Only the office can change it now"; the submit sheet says they cannot change the
Bookings afterwards); a List leaves the forward views when the billing run stamps `billedAtISO`, not
at AUTHORISED; and Balances hides an invoice raised today until the next day. There is also no search
and no way back to old work, and the main view does not start at today.

This phase:

- **opens the edit window to AUTHORISED** (US-07.2.1, FT-07.2, US-07.2.3, RV-19, D63): the
  anaesthetist can edit ACTIVE and SUBMITTED Lists, AUTHORISED stays immutable (US-07.3.2). Changes
  are audited, the last change stands, the office corrects directly with no "returned" state, and
  Review shows a "Changed since submitted" cue. A Booking reopened on a SUBMITTED List must be
  completed again before the office can authorise it. Submitting only tells the office it has work to
  do and makes the List less prominent;
- **moves the exit to AUTHORISED** (US-07.4.1, FT-07.4, D9): one predicate decides membership of the
  main view; `billedAtISO` stays for the office monitor. Invoices raised at authorise show in
  outstanding balances at once (the next-day rule goes);
- makes the **main view** (US-07.4.2) on mobile, web and the PWA start at today: upcoming work, earlier
  Lists not yet authorised reached by scrolling back, and submitted ones shown less prominently;
- adds **search** (US-03.1.6, US-03.1.7) on both apps over the anaesthetist's own Bookings, authorised
  and invoiced work included: by patient name (loose partial match), NHI (exact) or date (jump to a
  day and drill to List, Booking and Procedure). No calendar archive;
- seeds **several months of browsable history** for Dr Souter, so scroll-back, the date lookup and a
  repeat-patient search have real data, without moving any money figure.

Everything but the edit rules and the audit cue is selectors and screens over the existing store; no
new stored entity. The seed grows, so `PERSIST_VERSION` is bumped.

## Before you start: drift check

1. Diff the covered and read-alongside items against the plan's baseline (catalogue commit `d4db277`):

   ```
   node docs/prototype-build/catch-up/tools/plan-state.mjs --diff FT-07.2,US-07.2.1,US-07.2.3,US-07.3.2,US-07.4.1,US-07.4.2,FT-07.4,US-03.1.6,US-03.1.7,EP-07,FT-03.1,US-03.1.1,US-03.1.4,US-12.2.1,US-02.5.5,FT-03.4,OQ-26,OQ-17,OQ-31,OQ-86
   ```

   (This doc is current at `d4db277`. What changed since `60e2d1e`, already reflected: the edit window
   to AUTHORISED and the "changed since submitted" reading (FT-07.2, US-07.2.1, US-07.2.3); the exit
   at AUTHORISED with invoices at once (US-07.4.1, FT-07.4, US-07.4.2); search on name, NHI or date
   instead of an archive and calendar (US-03.1.6, US-03.1.7); the removal of the "reason" from an
   office price change (US-07.2.3's caption; Phase 24 removes the field).)
2. If an item changed again, re-read it in full and adjust the work items. Specifically:
   - **Which apps.** The stories name the Anaesthetist App only. If the catalogue now names the Admin
     App for the search, stop and tell the owner: an office-wide search across anaesthetists is a
     different selector and a different privacy reading.
   - **Matching.** If US-03.1.7 now names the "three-way match" (name, date of birth, NHI), a partial
     NHI or an invoice number, add that query kind in item 5; otherwise leave them out.
   - **The exit.** It is AUTHORISED (answered). If it moves again, change only the predicate in item 2.
   - **The rolling horizon.** Do not change it here; follow a new bound only for the date lookup's
     forward limit.
3. If a covered item is now Retired or Future, drop its work items and say so in the PROGRESS entry.
4. **Open questions: none block this phase.** Plan readings built as stated and logged on the "For
   the owner's review" list (no UI pill): anaesthetist apps only; search matches an exact NHI (either
   format, spaces ignored) or every word of the query inside the patient's name, ignoring case and
   accents, cancelled Bookings left out; history from January 2026 for Dr Souter only; a past List
   with no Bookings is left off the main view's earlier group; the anaesthetist may also add a Booking
   to a SUBMITTED List, which then blocks authorise until completed; a submitted List keeps the label
   "Done · unbilled" (the existing wording, US-07.2.1's caption).
5. **Prerequisite names.** Confirm 28 to 32b are DONE in PROGRESS.md and read their handoff notes,
   and 14, 15a, 15b and 16:
   - from **28**: `slotViewsForAnaesthetist`, `slotView`, `list.kind`, the approval label, how
     `ForwardListsScreen`, `ListsScreen` and `WeekStrip` build rows, that backdrop Lists carry a
     `slotId` but no Slot record, and `scheduleHorizon`;
   - from **29**: whether My calendar's month grid is a shared component (its handoff says 38a can
     reuse it);
   - from **30** and **31**: which actions repopulate the canvas after a recurring-booking edit and
     their date bounds; how a Draft List is held (no `anaesthetistId`);
   - from **32**, **32a** and **32b**: what a List or Booking moved to a colleague looks like (it is
     theirs), and the vacated-session and notice paths that touch a SUBMITTED List (they stay as built);
   - from **15a** and **15b**: the warning triangle, the Booking routes
     (`/mobile/lists/:listId/bookings/:bookingId`, `/web/lists/:listId/bookings/:bookingId`),
     `bookingsForList`, the history Booking ids (`HBK${n}`), `ACTIVE`;
   - from **14**: the demo-actions registry and `office-authorises-list` (PWA only);
   - from **16**: the BCTI count function: the new history gains BCTIs, no seeded AA fee invoice is for
     January to March.
6. Note the current `PERSIST_VERSION` (later phases raise it).

## Reference

**Design files (convention 17):**

- `docs/design/Mobile App.dc.html`: the Forward Lists header, filter chips (38px pills, teal when
  active), day headings (11px micro-caps, mist), the List row and its "Done · unbilled" tick cluster;
  its Procedure code sheet has the one mobile search field the design draws (48px, radius `ctl`,
  `neutral.bg`): the Lists search field uses that anatomy.
- `docs/design/Mobile Availability.dc.html`: the date strip, day cells and today marker (the date
  sheet's cells).
- `docs/design/Web Availability.dc.html`: the "Search name" pill input with its leading glyph
  (`AvailabilityGrid.tsx`), the pattern for the web search field.
- `docs/design/Web Dashboard.dc.html`: the week strip blocks and the "✓" marker.
- `docs/design/Design Language.dc.html`: tokens. Teal only for actions; crimson never in the main view,
  the search or the date sheet; List blocks keep their status colours; mono tabular numerals for
  dates, NHIs and invoice numbers; `sheet-in` motion.
- No mockup draws a scroll-back main view, a less prominent submitted row, a date sheet of work or a
  search result list. Extend the Forward Lists list, Phase 29's month grid and the List row; do not
  invent new chrome.

**Catalogue items and analysis:** the covered and context files above; `GAP-ANALYSIS.md` Summary theme 9,
the EP-07 rows (DM-55, RV-19, FT-07.2, US-07.2.1, US-07.2.3, US-07.4.1, US-07.4.2, FT-07.4) and EP-03
rows (US-03.1.6, US-03.1.7); `epics/EP-07.md`, `epics/EP-03.md`;
`analysis/domain-model-delta.md` DM-55 and DM-39;
`analysis/prototype-map-apps-mobile-web.md`, `prototype-map-store-seed.md`,
`prototype-map-shell-demo-pwa.md` (plan-time snapshots, `60e2d1e` line numbers; built phases have moved
them, so grep).

**Code entry points** (paths under `aa-prototype/src/`; line numbers approximate):

- Edit rules: `store/lifecycle.ts` (`editRefusal` ~50 to 75, `uncompleteBooking` ~171 to 200,
  `submitList` ~241 completeness check, `authoriseList` ~275 with no completeness check today,
  `reassignBooking` ~574, the "no return" comments ~310 and in `domain/types.ts` ~512);
  `shared/booking/BookingDetailBody.tsx` ~307 to 314 (`canEdit`);
  `shared/flows/SubmitListSheet.tsx` ~108 to 111 ("You will not be able to change these bookings
  afterwards"); `apps/mobile/screens/ListDetailScreen.tsx` (`canEdit` ACTIVE only; "Submitted to
  office"); `apps/web/screens/ListDetailView.tsx` (the "Submitted to office" pill ~277);
  `apps/admin/screens/ReviewQueue.tsx`, `AdminBookingDetail.tsx`, `AdminApp.tsx` ~188 to 211 (the
  cue); `store/lifecycle.test.ts` ~208 and `store/captureActions.test.ts` ~198 (assert the old rule).
  About 16 non-test files name `SUBMITTED`: grep and read each.
- The exit and balances: `store/selectors.ts` (`isListBilled` ~389, `isBackdropList`, `billedLists`,
  `invoicesForList`; the next-day rule at ~845 and ~913 to 922); `store/billingRun.ts` (~252 to 263,
  the stamp); `store/officeStandIn.ts` (reads `isListBilled`; leave it);
  `shared/demoTriggers/registry.ts` ~670 to 690 (`office-authorises-list`, its message says Balances
  moves the next day).
- Clock and canvas: `domain/clock.ts` (`HORIZON_PAST_DAYS`, `horizonFor`) and 28's `scheduleHorizon`;
  `store/clockActions.ts` (`rollCanvasForward`, append-only); `store/mastersActions.ts` and 30's
  repopulate path.
- History seed: `domain/seed/history.ts` (`ACCOUNTS`, 13 Souter accounts from 18 Mar to 30 Jun 2026,
  one AM List and one Booking each, AUTHORISED with `billedAtISO`; ids `L-HIST-nn`, `HBK`, `HP`,
  `HINV`, `HBC`, `XRH`/`XPH`, `PMTH`, `RCTH`, `DSBH`); `domain/seed/billing.ts`;
  `domain/seed/index.ts`; `domain/seed/patients.ts`; `domain/seed/audit.ts`; `domain/seed/seed.test.ts`.
- Repeat patients for the search beat: Sarah Mitchell (`PAT.mitchell`, CQY9304) has backdrop `oa07`
  (Souter, 14 Apr), a live Souter Booking on Mon 27 Jul and a Booking on **Dr Sharma's** Tue 14 Jul
  List; Wiremu Tane (ZBC1123); Alan Prentice (`oa04`, 4 Jun, ACC, and the Mon 20 Jul PM Booking whose
  invoices S3 Beat 1 raises live); Noah Prescott (`PAT.provisional`, no NHI, Souter, Mon 27 Jul).
- NHI: `domain/nhi.ts` (`validateNhi`, `CURRENT_SHAPE`, `NEW_SHAPE`, the normalisation).
- Mobile: `apps/mobile/screens/ForwardListsScreen.tsx` (the `mine` filter with `!isListBilled`,
  `inWindow`, `toRow`, the chips, the `mobile-lists-scroll` scroller); `apps/mobile/routes.tsx`
  (`MobileListsRoute`, `seen`, `backToLists`, `backToList`); `apps/mobile/navigation.ts`;
  `apps/mobile/screens/BalancesScreen.tsx`; `shared/schedule/ListRow.tsx`;
  `shared/surface/BottomSheet.tsx`; `shared/capture/CodePickerSheet.tsx` (the search input
  anatomy); `pwa/main.tsx` (reuses `MobileListsRoute`, no route change).
- Web: `apps/web/screens/ListsScreen.tsx` (From and To inputs, `!isListBilled` filter, the table);
  `apps/web/components/WeekStrip.tsx`; `apps/web/screens/DashboardScreen.tsx` (the day summary's
  `billedAtISO` filter); `apps/web/routes.tsx`; `apps/web/screens/AvailabilityGrid.tsx` ("Search name").
- Admin reference only: `apps/admin/components/RightRail.tsx` (`MiniCalendar` keyboard handling).
- Tests and shots: `pwa/pwaPurity.test.ts`, `domain/domainPurity.test.ts`,
  `shared/demoTriggers/demoTriggers.test.ts`, `visual/routing.spec.ts`, `visual/mobile-interactions.spec.ts`,
  `visual/mobile-insets.spec.ts`, `visual/pwa-device.spec.ts`, `visual/web-phase05.spec.ts`.

## Work items

Store rules and the exit first, then the seed and selectors, then UI. Keep the three commands green
after each group.

### Session 1: the edit window, the exit and the main view

1. **Edit until AUTHORISED** (US-07.2.1, FT-07.2, US-07.2.3, RV-19, D63; `store/lifecycle.ts`,
   the shared booking UI, the submit sheet, the Admin Review).
   - `editRefusal`: an anaesthetist may edit ACTIVE and SUBMITTED Lists of their own; AUTHORISED stays
     refused with its existing message (US-07.3.2); DRAFT, a removed Draft List and not-own refusals
     stay. The integration branch (an integration update cannot change a SUBMITTED List) is unchanged.
     Drop the `listSubmitted` refusal and its "Only the office can change it now" copy. `uncompleteBooking`
     (reopen for amendment), `reassignBooking` and the Booking write paths follow the same gate.
     Update the "no return" comments to say the office corrects directly, the anaesthetist can too until
     AUTHORISED, the last change stands (no lock, neither side outranks the other).
   - UI: `canEdit` in `BookingDetailBody`, mobile `ListDetailScreen` and web `ListDetailView` become
     "ACTIVE or SUBMITTED, own List"; the edit, capture and reopen controls show on a submitted List
     on mobile, web and the PWA (the shared components carry it). The "Submitted to office" pill stays
     as status, not as a lock. `SubmitListSheet` loses "You will not be able to change these bookings
     afterwards" and says the office will review it and the anaesthetist can still change it until it
     is authorised.
   - Audit: every anaesthetist change to a SUBMITTED List's Booking already goes through `mutate()`
     and lands in History; make sure each write path on a SUBMITTED List records the actor and the
     change.
   - **"Changed since submitted" cue.** A pure selector (`changedSinceSubmitted(state, listId)`) from
     the audit log: the anaesthetist's writes to that List's Bookings after the List's `list.submit`
     entry, with how many and when. Admin Review (`ReviewQueue`, the List's review view and
     `AdminBookingDetail`) shows a small pill "Changed since submitted" with the count, and the changed
     Booking marked in the List, linking to its History. It ends when the List is authorised. No new
     stored field unless the audit log cannot answer it.
   - **Reopen and completeness.** A Booking the anaesthetist reopens (or adds) on a SUBMITTED List is
     incomplete again. `authoriseList` gets the same completeness check `submitList` has (it has none
     today): refused while any non-cancelled Booking is incomplete, naming them. The Review action
     bar disables Authorise with that reason; the office can complete the Booking itself (it corrects
     directly) or ring the anaesthetist. The reopen is logged. The List stays SUBMITTED; no return
     state is added (US-07.2.3).
   - Vitest: update `lifecycle.test.ts` and `captureActions.test.ts` (an anaesthetist edit on a
     SUBMITTED List now succeeds and is audited; on AUTHORISED it is refused; another anaesthetist's
     List and a Draft List still refuse); the cue appears after an anaesthetist edit and not after
     an office edit; reopen then authorise is refused until completed; office edit on SUBMITTED
     unchanged; the last write stands; deterministic.
   - Record in the Decisions log that binding convention 6's "only the office after submit" is
     superseded (RV-19, D63), with the Phase 03 and 07 guards it governed.

2. **One exit predicate and one progress label** (`src/domain/listProgress.ts`, pure, exported from
   `src/domain/index.ts`; US-07.4.1, FT-07.4, US-07.4.2, US-07.2.1).
   - `hasLeftMainView(list)`: true when `list.state === 'AUTHORISED'`. Doc comment cites OQ-31 and D9.
     `isListBilled` in `store/selectors.ts` stays for the office stand-in and the admin monitor;
     no anaesthetist screen reads `billedAtISO` or `isListBilled` after this phase (grep proves it).
   - `listProgress(list, activeBookings, todayISO)`: `toFinish` (ACTIVE, dated today or earlier, with an
     incomplete Booking), `readyToSubmit` (ACTIVE, every Booking complete), `submitted` (SUBMITTED;
     shown less prominently), `invoiced` (AUTHORISED with `billedAtISO`), `authorised` (AUTHORISED,
     no stamp, a billing failure) or `upcoming`. `LIST_PROGRESS_LABEL` is the one label source: "To
     finish", "Ready to submit", "Done · unbilled" (submitted), "Authorised", "Invoiced". The mobile
     `ListRow` right-hand kinds, the web table, the week strip and the search rows all read it.
   - Vitest (`listProgress.test.ts`): each state, the past completed ACTIVE List, an AUTHORISED List
     with and without the stamp, deterministic.

3. **Invoices show in balances at once** (US-07.4.1, FT-07.4; `store/selectors.ts` ~845 and ~913 to
   922, `BalancesScreen`, the web Accounts reader of the same selector).
   - Remove the next-day rule: an invoice raised at authorise appears in the anaesthetist's
     outstanding balances straight away (US-12.2.1; Xero's ID returns synchronously). Keep the
     `Next morning` control for the other overnight jobs; correct the `office-authorises-list`
     message in `registry.ts` ("Balances moves the next day" goes) and any guide line that says so.
   - Vitest: authorise a List, then the invoice is in balances the same day, on the persona's
     selector and on the office stand-in path; the seeded figures do not move.

4. **Main-view selector and the mobile main view** (`store/selectors.ts` or a new `store/lookback.ts`
   re-exported from `store/index.ts`, PWA-safe; `ForwardListsScreen.tsx`; US-07.4.2, US-07.2.1,
   US-15.0.2).
   - `mainViewFor(state, anaesthetistId, todayISO, forwardToISO)`: `{ earlier, upcoming }`. `upcoming`
     is 28's Slot views from today to `forwardToISO` (booked Lists, Free and Holiday rows as the
     forward view shows them), less any `hasLeftMainView` List. `earlier` is every List of the
     anaesthetist dated before today that has not left the main view **and holds at least one active
     Booking**, at any distance back (not bounded by the canvas start), Lists only, oldest first. A
     Draft List, a List moved to a colleague and a backdrop List never appear. The Booking rule is a
     plan reading, logged for the owner: the seed holds twelve past Souter Lists from 7 to 16 July
     (recurring, ACTIVE) with no Bookings that nothing will ever authorise. With the rule, the earlier
     group at the demo's today is exactly Mon 20 Jul AM and PM (submitted).
   - **Mobile.** The scroller has an **"Earlier, not yet authorised"** group (day headings, oldest
     first) above a **"Today"** heading, then the upcoming days. On first mount, and when a filter chip
     changes, the scroller is positioned so Today sits at its top; popping back from List or Booking
     detail keeps the scroll. When `earlier` is not empty, a one-line teal text button under Today
     reads "2 earlier Lists not yet authorised" with an up chevron and scrolls them into view
     (`data-shot="mobile-main-view-earlier"`).
   - **Submitted rows less prominent** (US-07.4.2, FT-07.2): a `submitted` row is quieter than active
     work (muted title weight and the "Done · unbilled" tick cluster, no "To finish" count), still a
     normal tap target that opens the List, editable. Design tokens only; no new colour.
   - **Filters.** Week and Month bound the forward part only (today to +7 and +31 days); the earlier
     group shows under both. To-Do shows ACTIVE Lists with an incomplete Booking, earlier ones
     included; Done shows `submitted` Lists. A past completed ACTIVE List shows in the earlier group
     as "Ready to submit". Authorised Lists appear under no chip.
   - Empty copy: "No Lists from today in this window." (Week, Month), "Nothing left to finish.",
     "No submitted Lists waiting for the office." (Done). The PWA reuses `MobileListsRoute`; check it
     in the PWA build's insets.
   - Vitest: `mainViewFor` at the demo's today puts exactly Mon 20 Jul's submitted Lists in `earlier`
     (not the empty 7 to 16 July Lists) and no backdrop List anywhere; authorising one removes it at
     once from `earlier` and the upcoming rows; a past completed ACTIVE List is in `earlier`; a Draft
     List and a moved List are absent; deterministic.

5. **Web main view and the submitted marker** (`ListsScreen.tsx`, `WeekStrip.tsx`,
   `DashboardScreen.tsx`; US-07.4.2, US-07.2.1, US-03.1.4).
   - **Lists page.** The From date input goes. The table opens with an **"Earlier, not yet
     authorised"** group row and its Lists (oldest first), then a **"From today"** group row and the
     upcoming Lists to the To bound (the To input stays, default today +28 days). A **Progress**
     column carries `LIST_PROGRESS_LABEL` beside the session StatusChip; a `submitted` row is quieter
     and drills into its List detail, editable.
   - **Week strip.** Blocks for a `submitted` List carry the design's "✓", the muted treatment and the
     label as their accessible name; authorised Lists stay off the strip through `hasLeftMainView`.
     Previous week still reaches earlier un-authorised Lists.
   - **Dashboard day summary** reads `hasLeftMainView` in place of its own `billedAtISO` filter.
   - The web app stays desktop width; no responsive work.

### Session 2: search, the history and the finish

6. **Search as a pure module** (`src/domain/bookingSearch.ts`, exported from `src/domain/index.ts`;
   US-03.1.7). No store or React imports (`domainPurity.test.ts` holds).
   - `parseBookingQuery(raw)` returns `{ kind: 'empty' }`, `{ kind: 'tooShort' }` (fewer than two
     letters or digits), `{ kind: 'nhi', nhi }` or `{ kind: 'name', tokens }`. A query whose
     spaces-removed, uppercased form fits the current or new NHI shape (reuse `validateNhi`'s
     normalisation; do not duplicate the regexes) is an NHI query, matched exactly whether or not the
     check digit passes. Anything else is a name query.
   - `foldName(s)`: lower case, NFD with combining marks removed, the ʻokina and apostrophes removed,
     runs of spaces and hyphens collapsed ("faaoso" matches "Faʻaoso", "maori" matches "Māori").
   - `patientMatches(query, patient)`: an NHI query matches `patient.nhi` exactly; a name query
     matches when **every** folded token is a substring of the folded name ("sar mit" and "mitch" both
     find Sarah Mitchell). A patient with no NHI is found by name only.
   - Vitest (`bookingSearch.test.ts`): both NHI formats, spaced and lower case; "Prescot" is a name
     query; partial one- and two-token names; accent and ʻokina folding; no NHI; "a" is `tooShort`;
     deterministic.

7. **Several months of browsable history** (`domain/seed/history.ts` and its builder; US-03.1.6, the
   date lookup, "authorised and invoiced work").
   - Give the account rows a `listKey` and a `session` so several accounts share one List (today one
     account is one List, one Booking, AM). Existing accounts keep their own key and `session: 'AM'`,
     so **every existing id, invoice number, amount and date is unchanged** (`L-HIST-01` to `13`,
     `AA-2026-H01` to `H13`, the `oa02` missed webhook, Mitchell's prior balance, Riley's archived
     contact).
   - Append a hand-written table (no RNG draws, so no other seed stream shifts) of about **12 new Lists
     with 2 to 4 Bookings each (about 30 Bookings)**, Monday 12 January to Friday 27 March 2026, AM and
     PM, at Souter's usual hospitals with their surgeons. Each Booking is built **through the same
     builder the existing backdrop uses, in the shapes the prototype has now** (a procedure, billing
     route, pricing as the billing module returns it, never a second copy of the pricing shapes, which
     stay in `src/domain/billing`), with at least one ACC account. Phases 19 to 25 and 36 re-shape the
     backdrop as they re-shape the live data, so build through the builder and nothing hand-rolled
     (handoff). No two backdrop Lists share a date and session (Wed 18 March AM is already
     `L-HIST-08`). The new Lists take the `slotId` and `kind` Phase 28 gave the backdrop (no Slot
     record) and are AUTHORISED with `billedAtISO`.
     Patients: Sarah Mitchell once more (on the pinned 13 March List), Wiremu Tane and Coral Bennett
     once each, the rest from `genericPatientIds()` by fixed index.
   - Pin **Fri 13 March 2026, AM, St George's, three Bookings**, one of them Sarah Mitchell's. Export its
     date and List id as `SEED_LOOKBACK` (`{ dateISO, listId }`) from `domain/seed/index.ts` beside
     `SEED_LIST_IDS`, for tests, shots and the guide.
   - **Money stays where it is.** Every new account is `paid`, received and disbursed **before 1 April
     2026**, so no outstanding figure, Awaiting collection, Balances, S3 or S4 number moves. Collected
     and Paid out to date rise: they are derived, so check that no test, guide line or Control Panel text
     pins them. The BCTI count (16) gains January to March BCTIs; assert the seeded AA fee invoices and
     their totals are unchanged. New ids continue each namespace from the existing seq.
   - `seed/audit.ts` gives the new Bookings the same short history as the existing backdrop Bookings.
   - Seed tests (`seed.test.ts`): two builds deep-equal; every existing backdrop id and amount unchanged
     (pin `L-HIST-07`, `AA-2026-H07` and its total); the new Lists all fall before the canvas start,
     are AUTHORISED, carry 2 to 4 Bookings each, and all their accounts settle before 2026-04-01; Souter
     has backdrop Lists in each month from January to June.
   - **Bump `PERSIST_VERSION` by one** with a comment line ("Phase 38a: browsable history January to
     March 2026"; add a stored submit stamp only if item 1's cue needed one).

8. **Look-back and search selectors, and history survives** (`store/lookback.ts`).
   - `lookbackBoundsFor(state, anaesthetistId)`: `{ firstISO, lastISO }`, the anaesthetist's earliest
     List date to the schedule horizon's end (the date lookup's bounds).
   - `listsOnDayFor(state, anaesthetistId, dateISO)`: the Lists on one date, AM before PM, including
     backdrop and authorised Lists, each with its Bookings (patient, NHI or the app's NHI-missing label,
     scheduled time, primary Procedure's name first) and `listProgress`. It reads **Lists, not Slots**
     (backdrop Lists have no Slot record).
   - `listDaysFor(state, anaesthetistId, monthISO)`: the dates in a month that hold a List, with
     `invoiced` or not (the date sheet's dots).
   - `searchBookingsFor(state, anaesthetistId, rawQuery, todayISO)`: `{ query, upcoming, past, total }`.
     Rows are the anaesthetist's own non-cancelled Bookings (a List or Booking moved to a colleague is
     theirs, not the persona's) whose patient matches item 6, each with `bookingId`, `listId`, date,
     session, patient name, NHI, hospital short name, the Procedures' names (primary first), the List's
     `listProgress` and its warning count (15a). `upcoming` (today and later) soonest first; `past` most
     recent first; at most 50 rows, `total` the full count.
   - `invoicesForListView(state, listId)`: the invoices raised for a List (number, party, issue date,
     total, paid state), backdrop invoices included for a backdrop List; the office surfaces keep
     excluding backdrop invoices.
   - **History survives the clock and the canvas.** Read `rollCanvasForward` (append-only) and every
     path that regenerates or repopulates Lists: 30's recurring-booking edits, 29's series apply, Add
     anaesthetist, 28's horizon change, holiday reconcile. Each must be bounded to today or the
     horizon, never to dates before it, and must skip `isBackdropList` Lists.
   - Vitest (`lookback.test.ts`): Mitchell by "mitchell" and by "CQY9304" returns her March, April and
     July Souter Bookings and never her Sharma Booking; "tane"; Noah Prescott by name; a cancelled
     Booking never returned; upcoming and past order; the 50-row cap with the true total; after the
     office authorises Mon 20 Jul PM its Bookings are still found by search; `listsOnDayFor` for 13
     March 2026; `lookbackBoundsFor` runs from January 2026 to the horizon; after "Next morning", a
     30-day clock jump, a recurring-booking edit and a series save, every backdrop List, Booking and
     Procedure deep-equals the seed and un-authorised Lists that slid behind the canvas start are
     still in `earlier`; Reset restores the seed; all deterministic.

9. **Mobile: search and date lookup on the Lists tab** (`ForwardListsScreen.tsx`, `routes.tsx`,
   `navigation.ts`, a shared `src/shared/calendar/MonthGrid.tsx`; US-03.1.6, US-03.1.7, US-15.0.2).
   - **MonthGrid.** If Phase 29 extracted a month grid, reuse it and add only what is missing;
     otherwise extract the common part here and point 29's screens at it (no visual change). Monday-first,
     previous and next bounded by `lookbackBoundsFor`, a month and year jump (tap the title: a year
     stepper over twelve chips), a Today button, `renderDay` for the app's cell, arrow, Home, End,
     PageUp and PageDown keys, every day a real `<button>` with an accessible label ("Friday 13 March
     2026, 1 List"); days outside the bounds inert. PWA-safe.
   - **URL state.** The home layer reads `?day=YYYY-MM-DD` and `?q=`. `MobileListsRoute` remembers the
     home layer's search string beside its `seen` ids and `backToLists` and `backToList` restore it, so
     a pop returns to the same day or results. `?q=` and `?day=` are view state written with `replace`
     (2026-07-27 routing ruling); the sheet's open state stays local; a junk `?day=` is ignored through
     `isISODate`. `pwa/main.tsx` needs no change.
   - **Header row.** Under the greeting, a search field in the Procedure code sheet's anatomy
     (placeholder "Search patient name or NHI", clear button) and a 48px square teal-outline calendar
     button (lucide `CalendarDays`, label "Go to a date"). The chips stay below; the header stays fixed
     above the scroller.
   - **Date sheet** (`BottomSheet`, `data-shot="mobile-lookback-calendar"`): `MonthGrid`, each cell its
     numeral in mono with a dot where the anaesthetist has a List. Tapping a day closes the sheet and
     sets `?day=`.
   - **Day view.** With `?day=` set the chips are replaced by one teal day chip ("Fri 13 Mar 2026" with a
     close glyph) and the list shows that date's Lists (for a canvas date, the main view's rows for it
     plus any authorised List on it); each opens its List, then Booking, then Procedures. Authorised
     rows carry "Invoiced" (or "Authorised"). Empty: "No Lists on this day." Closing the chip returns to
     the last filter at the Today anchor.
   - **Results** (`data-shot="mobile-lookback-search"`). With two or more characters typed, results
     replace the sections: "Upcoming" and "Past" headings, each row a `ListRow`-anatomy button (patient
     as the title, "Fri 13 Mar · AM · St George's · Knee arthroscopy" as the subtitle, the NHI in mono
     or the NHI-missing label, the progress marker and the warning triangle). Tapping opens the Booking
     route (back goes to the List, then the results). One line above: "3 Bookings for Mitchell" or, past
     the cap, "Showing 50 of 64. Add more of the name or the NHI." Empty: "No Bookings match. Try part
     of the name or the full NHI." Filter on every keystroke through `useMemo`.
   - Search and day view are exclusive. The tab bar stays visible on the home layer. No native date
     input, no centred modal, nothing below 44px tap height.

10. **Web: search and date lookup on the Lists page** (`ListsScreen.tsx`, `routes.tsx`; US-03.1.4,
    US-03.1.6, US-03.1.7).
    - **URL state.** `/web/lists?q=mitchell` and `/web/lists?day=2026-03-13`, written with `replace`;
      a junk `?day=` falls back to the main view. Drill-ins pass `state: { from: pathname + search }`;
      List and Booking detail's back use it, falling back to `/web/lists` (and to the List for Booking
      detail), so a refresh or deep link still works.
    - **Header.** The title row gains the search field on the right (the "Search name" pill anatomy
      widened to 280px, placeholder "Search patient name or NHI") and a "Go to date" desktop date input
      beside it (bounded by `lookbackBoundsFor`).
    - **Results** (`data-shot="web-lookback-search"`): while `?q=` has two or more characters, the table
      area shows a results table in the Lists table's anatomy (Date, Session, Patient, NHI in mono,
      Hospital, Procedure, Progress, the warning triangle), Upcoming rows then Past separated by a group
      row; each row opens Booking detail. Count line, empty and capped copy match mobile. "Clear
      search" returns to the previous view.
    - **Day view** (`data-shot="web-lookback-day"`): with `?day=` set, the table shows that date's Lists
      (session, hospital and surgeon, Progress) with the date as a chip with a close glyph; each row
      opens List detail, and the List's Bookings drill to Booking detail and its Procedures. Search and
      date are exclusive.

11. **What a past List shows, tests, shots and sweep** (both apps).
    - List detail for an authorised List gains a read-only **Invoices** section from
      `invoicesForListView` (number in mono, party, issue date, total, paid state, the invoice link where
      the anaesthetist app has one); a submitted List shows none. Booking detail for an authorised
      Booking shows what was entered, read only: the Procedure stack as it is built then, times, the
      payer, the warnings. Fix any reader that assumed an anaesthetist never sees an authorised or
      backdrop List (a missing `startTime` showing "undefined", a Slot lookup on a List with no Slot
      record). An authorised List stays read only everywhere and `editRefusal` still refuses; 38b, 39
      and 39b add their own actions here.
    - Component tests: `ForwardListsScreen` at the demo's today renders the earlier group with Mon
      20 Jul's "Done · unbilled" Lists above Today, positions the scroller at Today, the hint scrolls
      to them; a submitted List's Booking shows its edit controls; with `?day=2026-03-13` it shows
      that day's History List; typing "mitch" shows three rows in Upcoming and Past; tapping a result
      opens the Booking route; closing the day chip restores the filter. `ListsScreen` shows the
      earlier group and Progress column with no date set; a search for "CQY9304" lists the same
      three; the day view for 13 March lists its List; Clear search restores the view. `WeekStrip`
      labels a submitted block "Done · unbilled". Admin review shows the "Changed since submitted" cue
      after an anaesthetist edit. List detail shows the Invoices section for an authorised List only.
      `MonthGrid`: bounds, month and year jump, arrow keys, labels.
    - Playwright: `visual/lookback.spec.ts` with the `data-shot` hooks (mobile main view with the
      earlier hint, mobile date sheet on March 2026, mobile results for "Mitchell", web Lists main view
      with the earlier group, web day view, web results); a routing case in `visual/routing.spec.ts`
      (`/web/lists?day=2026-03-13` loads the day and back from List detail returns to it;
      `/mobile/lists?day=2026-03-13` back from a List returns to the day). Keep `mobile-insets`,
      `mobile-interactions` and `pwa-device` passing.
    - **Copy and comment sweep.** Update the header comments of `ForwardListsScreen.tsx`,
      `ListsScreen.tsx`, `WeekStrip.tsx`, `lifecycle.ts` (the edit rule), `isListBilled` (the office
      reads it) and `isBackdropList` (browsable by date and search, still out of the office surfaces
      and the main view). No en or em dash in any new string; ranges read "January to March".

## Demo triggers

**None new.** A seeded SUBMITTED List of Dr Souter's (Mon 20 Jul AM and PM) stays editable, and months
of seeded history make the scroll-back, the date lookup and the search demoable through normal use on
every surface: open Mon 20 Jul PM on Tue 21 Jul and change a Booking; type "Mitchell" or "CQY9304";
pick 13 March.

The one beat that waits on the office, a List leaving the main view at AUTHORISED, already has its
controls: in the framed build the office authorises on Admin Review (S3 Beat 1), and on the PWA the
existing sheet entry **"Office authorises this List"** (Phase 14, `office-authorises-list`, PWA only on
List and Booking detail) does it, after which the List is gone from the main view, its invoice is in
Balances at once and search finds it. No new button and no new PWA stand-in; its result message is
corrected (item 3). The Control Panel page gains nothing.

## Out of scope

- The Admin App: no office search across anaesthetists (the stories name the anaesthetist app; the
  drift check stops if that changes).
- A calendar archive (replaced by search; US-03.1.6, 16 October).
- Any lock, merge or conflict screen between the anaesthetist's and the office's edits: the last
  change stands.
- Changing the anaesthetist's Contract on a submitted List: Phase 20 builds it on this window.
- Events, the additional invoice and the credit note on an authorised Procedure (38b, 39, 39b add
  them on the Booking detail reached here), and any edit of an authorised or backdrop Booking.
- A patient record or view, merging patients, the missing-NHI list (Phase 40), NHI lookup against the
  register (Phase 40a), and the "three-way match" Greg mentioned and did not take further.
- Search by anything other than NHI, patient name or date (surgeon, hospital, procedure, invoice number,
  date of birth), fuzzy matching, recent searches, cancelled Bookings.
- History for any anaesthetist but Dr Souter, history before January 2026, unpaid or part-paid new
  history accounts, and seeding the history into Phase 36's ledger (36 does it).
- Changing the canvas horizon or rolling it backwards.
- Draft Lists and Lists or Bookings moved to a colleague (they leave the persona's views by design).
- Search at full scale and its timings (Phase 43).

## Manual test checklist

The agent runs every item itself in the running app and reports it with evidence; none is handed to
the owner (ROADMAP.md "Owner review: agents test themselves").

- [ ] Reset. Mobile → Lists: the view opens at Today; the hint "2 earlier Lists not yet authorised"
      shows; scrolling up (or the hint) reveals Mon 20 Jul AM and PM, quieter, "Done · unbilled". Week,
      Month, To-Do and Done work; no backdrop List and none of the empty 7 to 16 July Lists appears.
- [ ] Open Mon 20 Jul PM (submitted): the Booking's edit and capture controls are live. Change a Booking
      and save; History shows the change. Submit-sheet copy no longer says she cannot change the
      Bookings afterwards. Same on web and in the PWA.
- [ ] Reopen a Booking on the submitted List: Admin → Review shows "Changed since submitted" with the
      count and the Booking marked; Authorise is disabled with the incomplete Booking named; complete
      it (as the office or the anaesthetist) and Authorise works. An office price change and the
      anaesthetist's edit both stand, the last one winning. An authorised List refuses every edit.
- [ ] Complete every Booking on a past ACTIVE List without submitting (or find one in the seed): it
      shows in the earlier group as "Ready to submit".
- [ ] Web → Lists (no date touched): the "Earlier, not yet authorised" group shows Mon 20 Jul's Lists with
      the Progress label; the From input is gone; opening one is editable. Dashboard week strip: Mon
      20 Jul blocks carry the tick and the label.
- [ ] Admin → Review → authorise Mon 20 Jul PM (S3 Beat 1): on web and mobile it leaves the main view and
      the week strip at once, and its invoices are in Balances at once (no Next morning). On the PWA,
      the "Office authorises this List" sheet does the same.
- [ ] Search "Prentice" on mobile and web: the just-authorised Mon 20 Jul Booking and the June ACC
      Booking show, marked "Invoiced". Open the Mon 20 Jul one: Booking detail shows what was entered,
      read only; back to its List shows the Invoices section with the S3 invoice numbers.
- [ ] Mobile: tap the calendar button, the sheet opens on July 2026 with today marked and dots on days
      with Lists; pick 2026 and March; previous stops at January 2026, next at the horizon's month. Pick
      Fri 13 Mar: the day chip shows and the day's List reads "Invoiced"; open List, Booking, Procedures;
      back twice returns to the same day chip. Close the chip: the last filter returns at Today.
- [ ] Type "mitch": Upcoming shows Mon 27 Jul; Past shows April and March; her Booking on Dr Sharma's
      List does not appear. "CQY9304" and "cqy 9304": the same three. "Prescott": Noah Prescott with the
      NHI-missing label. "zzz9999": the empty copy. Tap a past result: back goes to its List, then to
      the results with the query kept.
- [ ] Web: the search field and "Go to date" sit at the right of the title. "Mitchell" shows the results
      table with Progress; Clear search returns. `/web/lists?q=tane` loads with results. Go to 13 March:
      the day view lists the List; open it, Back returns to the day.
- [ ] Next morning, then a 30-day clock jump: March history is unchanged; un-authorised Lists that slid
      behind the canvas start are still in the earlier group.
- [ ] Web → Accounts: the outstanding list, Awaiting collection and Balances are unchanged from before
      this phase (apart from the S3 authorise just done); Admin Billing monitor and Invoices show no
      backdrop rows.
- [ ] PWA (`npm run dev:pwa`, fresh storage): the Today anchor, the hint, the search row and the date
      sheet clear the insets; the main view, edit window, day view, search and back behave as in the
      framed build.
- [ ] Keyboard: the month grid moves with the arrows; every day and result is reachable by Tab with a
      readable label.
- [ ] No en or em dashes in any new string; teal the only action colour; no crimson in the markers, the
      date sheet or the results; no "Provisional" pill.
- [ ] Catalogue screenshots: the recipes below are created or updated, any recipe this phase broke is
      re-pointed, a full `npm run capture` ends with no failed recipe, the new shots are checked by
      eye, and `npm run verify:board` is green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots` and `npm run verify:board`
      are all green.

## Demo guide updates

Patch in the same session (`docs/demo-guide/`, the same sections of `master-demo-guide.html`):

- `03-demo-script.md`:
  - **Direct URLs:** add "Lists, main view" `/mobile/lists`, "Lists, one day" `/mobile/lists?day=2026-03-13`,
    "Lists, search" `/mobile/lists?q=Mitchell`, and web `/web/lists?day=2026-03-13` and
    `/web/lists?q=Mitchell` (13 March is `SEED_LOOKBACK`).
  - **S3 Beat 1:** Expected gains that Dr Souter's Mon 20 Jul Lists leave her main view as soon as the
    office authorises them and their invoices show in her balances at once.
  - **S3, an optional closing moment** after Beat 3: "Finding past work. On the phone, the Lists tab
    starts at today; scroll up for anything not yet authorised. Search 'Prentice': Monday's Booking,
    authorised a minute ago, opens read only with what was entered and its invoices." Say: "Until the
    office authorises a List the anaesthetist can still change it; after that it leaves the main view,
    but nothing is lost: search finds it by patient name, NHI or date. Their own work only."
  - **S3 discovery points:** replace "the exact List-disappearance trigger" with "whether date of
    birth joins name and NHI (the three-way match) and whether the office needs this search too".
  - **S2 Beat 4:** a submitted List stays on the anaesthetist's main view, editable, until authorised.
  - If 38b, 39 or 39b has not run yet, add nothing to S4 Beat 2.
- `04-presenter-cheat-sheet.md`: "What each app is for" (Anaesthetist Mobile and Web) gains "a main view
  from today with earlier un-authorised Lists, and past work by patient name, NHI or date"; readiness
  "Built and clickable" replaces "billed-List disappearance (Phase 08)"; the open item **"2. Exact List
  disappearance trigger"** is rewritten as answered (leaves at AUTHORISED; invoices at once; old work by
  search); the office-only edit lines (about :46, :60, :397) and the `SUBMITTED` line become "the
  anaesthetist sees it less prominent and can still change it until it is authorised".
- `02-workflows-and-handoffs.md`: step 6 of the submit workflow gains "she can still change it until the
  office authorises it, when it leaves her main view and is found by search"; a short "Looking back"
  workflow (main view from today; search by name, NHI or date; own Bookings only).
- `01-personas-and-responsibilities.md`: the `SUBMITTED` line and the anaesthetist's paragraph mention
  the edit window, the main view and search.
- `master-demo-guide.html`: the same passages (Direct URLs, S3 Beat 1's Expected, S3's closing moment
  and discovery callout, the cheat-sheet app cards, readiness list and open item 2, the workflow and
  persona lines).
- Control Panel scenario text: no change beyond any line that says Balances moves the next day.

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19), run
after the review pass and before the PROGRESS.md entry. Re-run
`node docs/prototype-build/catch-up/tools/recipe-status.mjs 38a` first: earlier phases may have changed
these recipes. DM-55 and RV-19 have no catalogue images.

| Item | Recipe now | When this phase is done |
|---|---|---|
| FT-07.2 SUBMITTED | no recipe listed | create `recipes/FT-07.2.json`, `captured`: web, a submitted List's detail with its Booking editable and the "Submitted to office" status. Caption "A submitted List stays visible and editable until the office authorises it" |
| US-07.2.1 Anaesthetist can still edit a submitted List | captured · web submitted-list, read-only-card; mobile done-unbilled, read-only-card; simulator edit-refused | captured. Drop the four read-only shots the catalogue no longer carries (web `submitted-list`, web `read-only-card`, mobile `read-only-card`, simulator `edit-refused`). Keep mobile `done-unbilled` ("Submitted Lists marked Done · unbilled", quieter row). Add mobile and web `edit-submitted`: Booking on a submitted List with the edit controls live and a saved change ("The anaesthetist can still change a submitted List"). Add web `lists-marker` at `/web/lists` highlighting Mon 20 Jul's Progress cell |
| US-07.2.3 Office corrections | captured · admin price-override (override, saved), phone-note | captured. Caption only on the override shot: "Price change on a submitted Booking: a dollar adjustment" (Phase 24 removes the reason field, so leave the steps). Add admin `changed-since-submitted`: Review after an anaesthetist edit, the cue highlighted |
| US-07.4.1 List leaves the main view once authorised | captured · mobile list-drops-off (submitted, invoiced), web list-drops-off, list-drops-off-invoiced, invoices-in-balances | captured. New captions: mobile "Once the office authorises it, the List is gone from Done"; web "After the office authorises them, Monday's Lists are gone"; shot-level "List leaves the main view once the office authorises it". Mobile `list-drops-off`: `submitted` (still on the main view, Done · unbilled), `invoiced` (gone), new `found` (the name typed in search, result marked "Invoiced"). Web: drop the `fill input[type=date]` steps; `submitted` highlights the earlier group's Mon 20 Jul rows; `list-drops-off-invoiced` shows the main view without them plus a state at `/web/lists?day=2026-07-20` listing them. `invoices-in-balances`: invoices there straight after authorise, caption "The new invoices show in the balance at once" (no "the next day", no Next morning step) |
| US-07.4.2 Anaesthetist's main view | absent | create `recipes/US-07.4.2.json`, `captured`. Mobile `/mobile/lists`: `main-view`, state `today` (Today at the top, highlight `[data-shot=mobile-main-view-earlier]`) and `scrolled-back` (highlight Mon 20 Jul's quieter submitted rows). Web `/web/lists`: `main-view`, highlight the "Earlier, not yet authorised" group and its rows. Captions "The main view starts at today, with earlier Lists not yet authorised a scroll back" and "On the web, earlier Lists head the table without changing a date" |
| FT-07.4 List visibility in the anaesthetist app | absent | create `recipes/FT-07.4.json`, `captured`: one web shot of an authorised List's detail reached from search (`/web/lists?q=Prentice`), highlighting the Invoices section. Caption "An authorised List leaves the main view, its invoices show in balances, and it stays findable" |
| US-03.1.6 Find past work and old invoices | stub, no shots | replace the stub, `captured`. Mobile `/mobile/lists`: `lookback-date`, open the date sheet (`[aria-label="Go to a date"]`, highlight `[data-shot=mobile-lookback-calendar]`), then pick Fri 13 Mar and show the day chip with its "Invoiced" List. Web `/web/lists?day=2026-03-13`: `lookback-day`, highlight `[data-shot=web-lookback-day]`. A `drill` state on each opens the History List (Invoices), a Booking and its Procedures. Captions "Jump to any date back to January 2026", "Pick a past day to see its Lists, then a Booking and its Procedures" |
| US-03.1.7 Search Bookings by NHI or patient name | stub, no shots | replace the stub, `captured`. Mobile `/mobile/lists?q=mitchell`: `lookback-search`, highlight `[data-shot=mobile-lookback-search]` (Upcoming and Past, "3 Bookings for Mitchell"), a state typing `CQY9304` shows the same three. Web `/web/lists?q=mitchell`: `lookback-search`, highlight `[data-shot=web-lookback-search]`. Caption "Search finds a patient's Bookings by name or NHI, authorised and invoiced ones included" |

`US-07.2.2` appears under 38a in recipe-status but is not covered here: no change (check it still passes).

**Recipes this phase breaks.** `US-07.4.1` (the web `fill input[type=date] >> nth=0` steps: the From input
goes; its "Next morning" step in `invoices-in-balances`) is re-pointed above. The mobile Lists tab now
opens scrolled to Today with a search row and a calendar button; the web Lists page gains the earlier
group, a Progress column and the search and date controls. Recipes that start at `/mobile/lists` or
`/web/lists` and click rows by text (`US-01.1.1`, `US-01.3.4`, `US-03.1.1`, `US-15.0.2`) should still pass,
since Playwright scrolls to the row; look at their new shots once. Recipes that assume a submitted List
is read only (anything under `US-07.2.x`, `US-03.x`) get the `--dry` run as the check.

**ATLAS.md.** Routes: `?day=` and `?q=` (mobile and web Lists), the From input gone. Seed data: the new
Dr Souter backdrop Lists, the pinned `SEED_LOOKBACK` List (Fri 13 Mar 2026), the search examples
(Mitchell, `CQY9304`, Prentice, Prescott), the Mon 20 Jul Lists as the earlier un-authorised pair.
Hooks: `mobile-main-view-earlier`, `mobile-lookback-calendar`, `mobile-lookback-search`,
`web-lookback-day`, `web-lookback-search`.

## Adversarial review (after build)

Once the manual test checklist and `npm run build`, `npm run build:pwa`, `npx vitest run` and
`npm run shots` are green, and before the PROGRESS entry, run the standard **adversarial
review-and-fix pass (PROGRESS convention 18)**: three independent Opus review subagents (quality,
bugs/correctness, plan adherence), each given the covered catalogue files, this doc and the diff. Verify
every finding against the catalogue, this doc and the code, fix the confirmed ones (with a test wherever
a bug had none), re-green and record the pass. Do not re-raise anything settled in the Decisions log.

**Steer this phase's reviewers at:**

- **The edit window.** An anaesthetist can edit a SUBMITTED List of their own on every path (store,
  mobile, web, PWA, reopen, add, reassign) and never an AUTHORISED one, a Draft List or another
  anaesthetist's; every such edit is audited and raises the "Changed since submitted" cue; the last write
  stands with no lock; a reopened Booking blocks authorise until completed; no "returned" state; the
  submit sheet no longer promises a lock; nothing still says "Only the office can change it now".
- **One exit, one label.** No anaesthetist screen reads `billedAtISO` or `isListBilled` directly;
  `hasLeftMainView` (AUTHORISED) decides membership; `LIST_PROGRESS_LABEL` is the only source of "Done ·
  unbilled" and "Invoiced". A submitted List is on the main view, less prominent; an authorised one is
  not; an authorised List's invoices are in Balances the same day.
- **Starts at today.** Mobile opens at Today and keeps its scroll on a pop; the earlier group is
  unbounded backwards, holds only Lists with a Booking and never an authorised List; the web table needs
  no date change to show Monday's submitted Lists; the past completed ACTIVE List no longer falls through
  every filter.
- **Own work only.** The main view, search and date lookup return only Lists whose `anaesthetistId` is the
  persona's; hunt for any leak (the Sharma Mitchell Booking, a List moved in 32, a Booking moved in 32a,
  a Draft List).
- **History is untouched and money is unchanged.** No clock advance, canvas roll, horizon change,
  recurring-booking edit, series save, holiday reconcile or Add anaesthetist writes, drops or regenerates
  a List before the canvas start; no outstanding figure, S3 or S4 number or seeded AA fee invoice moves;
  every existing backdrop id and amount is the same; the new Bookings go through the existing builder and
  billing module, not a second copy of the pricing shapes.
- **What was entered.** An authorised Booking opened from search or a day shows what was entered, its
  List's invoices, read only, with no placeholder text.
- **Matching.** NHI exact in both formats with spaces and case ignored, reusing `validateNhi`'s
  normalisation; partial names by every token; accent and ʻokina folding; cancelled excluded; the cap
  reports the true total; the module is pure and deterministic.
- **Navigation.** Back from List and Booking detail returns to the same day, results or scroll position
  on both apps, a refresh or deep link still works, no nested interactive elements, the PWA routes
  unchanged.
- **Design and copy.** Mobile-first sheet, hint and field, the design's search anatomy, teal-only
  actions, no crimson, status colours only for List blocks, mono dates, NHIs and invoice numbers, no
  "Provisional" pill, no en or em dashes.
- **Persistence.** `PERSIST_VERSION` bumped; two fresh seeds deep-equal.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry): the plan readings built (anaesthetist apps only;
  the NHI-or-name matching rule; history from January 2026 for Dr Souter only; a past List with no
  Bookings left off the earlier group; the anaesthetist may add a Booking to a submitted List and it
  blocks authorise until completed; the submitted label stays "Done · unbilled"; the cue ends at
  authorise; no calendar archive, the date is a lookup), whether search should also take an invoice
  number, and the screens worth a look (mobile `/mobile/lists` scrolled back, `/mobile/lists?q=Prentice`,
  web `/web/lists` and `/web/lists?day=2026-03-13`, Admin Review after an anaesthetist edit, as Dr Souter).
- **Status row** for catch-up Phase 38a, and a phase entry with: the drift-check result (items changed or
  not against `d4db277`; whether the Admin App, date of birth or invoice numbers came into scope); what was
  built, with the name map for later phases (`editRefusal`'s new rule, `changedSinceSubmitted`,
  `hasLeftMainView`, `listProgress`, `LIST_PROGRESS_LABEL`, `parseBookingQuery`, `foldName`,
  `patientMatches`, `mainViewFor`, `lookbackBoundsFor`, `listsOnDayFor`, `listDaysFor`,
  `searchBookingsFor`, `invoicesForListView`, `MonthGrid`, the `?day=` and `?q=` URL state and the
  back-to-referrer rule, the Today anchor); the history added (Lists, Bookings, months, totals) and the
  money figures checked unchanged; the `PERSIST_VERSION` bump (from and to); tests added and the before
  and after Vitest and Playwright counts; the review pass.
- **Catalogue screenshots result:** recipes created (FT-07.2, US-07.4.2, FT-07.4, US-03.1.6, US-03.1.7) or
  changed (US-07.2.1, US-07.2.3, US-07.4.1, any re-pointed), the `REPORT.md` counts (captured, partial,
  absent, failed) before and after, and any partial reason handed to a later phase.
- **Decisions log:**
  1. **Superseded:** binding convention 6 and the Phase 03 and 07 guards ("only the office after submit";
     RV-19, D63). Now the anaesthetist edits a SUBMITTED List until AUTHORISED, audited, last change
     stands, AUTHORISED immutable, the office still corrects directly with no returned state.
  2. **Superseded:** the Phase 08 reading and the 2026-07-22 third external plan review #12 (M10: billed
     Lists vanish; the RFP's next-day handover). Now (D9, OQ-31 changed 2026-10-16) a List leaves the main
     view at AUTHORISED (one predicate, `hasLeftMainView`), its invoices show in Balances at once, and it is
     found by search on name, NHI or date.
  3. **Amended:** the Phase 10 entry on the seeded historical backdrop ("office surfaces exclude them"). It
     is also the anaesthetist's browsable history (January to June 2026 for Dr Souter, multi-Booking
     Lists, the new months settled before 1 April); office surfaces and the main view still exclude it.
  4. **New:** search covers the anaesthetist's own non-cancelled Bookings, an exact NHI or every word of a
     partial name, plus a date lookup over Lists (not Slots); the Admin App is not included; no calendar
     archive.
  5. **Upheld with an addition:** the 2026-07-27 real-routing ruling; the home layer now carries `?day=`
     and `?q=`, which the pops restore.
- **Handoff notes:**
  - For **20**: the Contract change on a submitted Booking uses the edit window built here (D63).
  - For **19b, 20, 20a, 21, 24, 25 and 36**: the seeded history builds through the backdrop builder
    (about 30 new Bookings, January to March); re-shape it with the live data (Contract, payer, snapshot,
    ledger seeding) and keep the pinned `SEED_LOOKBACK` List.
  - For **38b** and **39**: the Booking detail reached from search is the anaesthetist's entry point for
    an additional invoice or a credit note on their own authorised Procedure; on an authorised List those
    actions are the only controls that may appear, and the store's edit refusal must allow them and
    nothing else; a new invoice shows in the List's Invoices section (`invoicesForListView`).
  - For **39b**: the same entry point for a pre-op or post-op event on a past Procedure.
  - For **38**: the outstanding list must not reintroduce a next-day rule; read the same-day selector.
  - For **40**: search rows can link to the patient view; merged patients resolve through one resolver.
  - For **40a**: the search field may show NHI validation feedback once lookup exists; matching stays exact.
  - For **43**: `mainViewFor`, `searchBookingsFor` and `listDaysFor` must stay usable at full scale; index
    by anaesthetist if timings demand it; the generated history builds through the same backdrop builder.
  - For **44**: S3's Beat 1 Expected, its closing moment, discovery points and the Direct URLs were
    patched here; re-read them in the rewrite and audit that no trigger is needed.
