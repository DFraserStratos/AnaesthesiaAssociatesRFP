# Phase 38a · Find past work: calendar and search

**Requirements covered:**
[US-03.1.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.1.6.md) Find past work from a calendar (Proposed) ·
[US-03.1.7](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.1.7.md) Search Bookings by NHI or patient name (Proposed).
Treated here without closing it: [DM-39](../analysis/domain-model-delta.md#dm-39) (its last
sentence only, "search and calendar navigation are selectors and UI only"; the attachments and
skeleton-Copy parts are Phase 15's).
Read alongside (not closed here):
[FT-03.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-03.1.md) (the feature),
[US-03.1.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.1.1.md) (the schedule to List to Booking to Procedure drill-down both entry points land on),
[US-03.1.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.1.4.md) (web parity: the web gets the same capability, not a cut-down one),
[US-15.0.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-15.0.2.md) (mobile-first),
[US-03.7.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.7.1.md) (the post-op event that needs a past Procedure; Phase 39b),
[FT-07.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-07.4.md) and
[US-07.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-07.4.1.md) (Open: when a List leaves the to-do view; Phase 38 keeps billed Lists visible),
[DM-17](../analysis/domain-model-delta.md#dm-17) (the event record 39b adds, "reachable from past Procedures"),
and the evidence, points 35 and 36 of
[the 2026-10-01 meeting note](../../../discovery-reference/Updated%20Requirements/catalogue/notes/2026-10-01-aa-meeting-with-greg.md)
("a way back beyond the four-month rolling view without infinite scroll").
No open question is linked to either story.
**Depends on:** 38 (billed Lists stay visible and read only: `listBillingStatus`,
`LIST_BILLING_LABEL`, `listBillingSummaryFor`, the web Lists Upcoming and Completed views, and the
mobile Done filter). By the roadmap order 14 (the trigger registry), 15 (Booking vocabulary and the
`…/bookings/:bookingId` routes), 15a (the warning triangle on Booking rows), 28 (Slots, `list.kind`,
`slotViewsForAnaesthetist`, `isBackdropList` fencing the `L-HIST-*` Lists), 29 (the month grid of My
calendar), 30 (recurring-booking edits that repopulate the canvas), 32 (a Booking done by another
anaesthetist moves to their List) and 36 (the ledger the backdrop history is seeded into) have also
run. 39 may run before or after; 39b runs after this phase and builds on it.
**Estimated:** 1 session.

## Goal

The anaesthetist apps only look forward today. Mobile Forward Lists offers Week, Month, To-Do and
Done; the web Lists table has From and To inputs; the canvas starts 14 days before the demo's today;
and the only older work is thirteen single-Booking backdrop Lists that exist to feed the money views.
There is no way back to a day in March, and no way to find a patient's Booking without knowing its
date. AA asked for both at the 2026-10-01 meeting: a calendar that jumps to a day and drills down to
List, Booking and Procedure, and a search by NHI or patient name.

This phase:

- adds a **calendar** to the anaesthetist apps (US-03.1.6). On mobile a calendar button beside the
  Lists filters opens a bottom sheet with a month grid that goes back to the anaesthetist's first
  List and forward to the canvas horizon, with a month and year jump so a day five months back is
  three taps, not a scroll. Picking a day shows that day's Lists in the Lists tab under a dismissible
  day chip. On the web, the Lists page gains a **Calendar** view: a desktop month grid with each
  day's List blocks and a right rail listing the picked day's Lists and their Bookings;
- adds a **search** (US-03.1.7): one field on the mobile Lists tab and on the web Lists page that
  finds the anaesthetist's own Bookings by an exact NHI or by part of a name, across every List,
  past and upcoming, billed or not, and opens the Booking;
- lands both on the **existing drill-down** (List detail, Booking detail and its Procedures), so a
  billed List opened from the calendar reads exactly as Phase 38 left it: "Done · billed", read only;
- seeds **six months of browsable history** for Dr Souter: about twelve new multi-Booking backdrop
  Lists from January to March 2026, settled in full before 1 April, so the calendar has real days to
  land on and a search for a repeat patient returns Bookings months apart, without moving any money
  figure the demo shows.

Both features are pure selectors and screens over the store. No new stored entity and no new
mutation; the seed grows, so `PERSIST_VERSION` is bumped. This is the entry point Phase 39b's pre-op
and post-op events use.

## Before you start: drift check

1. Run the catalogue diff since the plan's baseline:

   ```
   git diff 501b0b8 -- "docs/discovery-reference/Updated Requirements/catalogue" "docs/discovery-reference/Updated Requirements/domain-model.md"
   ```

   Read the hunks for US-03.1.6, US-03.1.7, FT-03.1, US-03.1.1, US-03.1.4, US-03.7.1, FT-07.4,
   US-07.4.1 and OQ-31, and any domain-model lines on looking back or search. At plan time both
   covered stories were **Proposed**, US-07.4.1 **Open**, and no OQ was linked.
2. If an item changed, re-read it in full and adjust the work items. Specifically:
   - **Which apps.** Both stories' notes leave it open ("the admin app was not mentioned"; "which
     apps besides the anaesthetist's offer this search is not stated"). This phase builds the
     anaesthetist apps only. If the catalogue now names the Admin App, stop and tell the owner: an
     office-wide search over every anaesthetist is a different selector and a different privacy
     reading, not a flag on this one.
   - **Matching.** If US-03.1.7 now names the "three-way match" (name, date of birth and NHI) or a
     date-of-birth field, add date of birth as a third query kind in work item 1 and show it on the
     result rows; if it names partial NHI matching, add an NHI prefix rule beside the exact one.
   - **The four-month view.** If US-03.1.6 or FT-03.1 now changes the rolling horizon, do not change
     `HORIZON_FUTURE_MONTHS` here; follow the new wording only in the calendar's forward bound.
   - **US-07.4.1 or OQ-31 answered as "vanish".** The calendar and search still reach billed Lists:
     US-03.1.6 is the catalogue's own route back to past work, independent of the to-do view. Keep
     this phase as written and record the reading.
3. If a covered item is now Retired or Future, drop its work items and say so in the PROGRESS entry.
4. **Open questions: none block this phase.** Three readings are built as stated, recorded in
   PROGRESS and shown once in the UI with the small neutral "Provisional" pill (tooltip naming the
   point):
   - the anaesthetist apps only (the pill sits beside the search field's helper line on web, and in
     the calendar sheet's footer on mobile: "Anaesthetist apps only, to confirm with AA");
   - search matches an exact NHI (current or new format, spaces ignored) or every word of the query
     inside the patient's name, ignoring case and accents; cancelled Bookings are left out;
   - the history goes back to January 2026 for Dr Souter only (the persona the anaesthetist apps run
     as; EP-03 structural note 7).
5. **Prerequisite names.** Confirm Phase 38 is DONE in PROGRESS.md and read its handoff notes and
   name map, and the entries for 15, 28, 29, 30 and 36:
   - from **38**: `listBillingStatus`, `LIST_BILLING_LABEL`, `listBillingSummaryFor` (and whether it
     lists a backdrop List's own invoice numbers; planned not to, see work item 3), the Upcoming and
     Completed Segmented on `ListsScreen.tsx` and how its state is held (URL or component), and the
     backdrop exclusion on Forward Lists' Done (`isBackdropList`);
   - from **15**: the Booking routes (`/mobile/lists/:listId/bookings/:bookingId`,
     `/web/lists/:listId/bookings/:bookingId`), `bookingsForList`, `schedule.bookings`, the history
     Booking ids (`HC${n}` renamed `HBK${n}` in `history.ts`), and the mobile stack's `listsStackLocation` return shape (`bookingId`);
   - from **28**: `slotViewsForAnaesthetist`, `isBackdropList` and its note that backdrop Lists carry a
     `slotId` but no Slot record;
   - from **29**: whether the My calendar month grid was extracted as a shared component (planned
     inside `MyAvailabilityCalendarScreen.tsx` and `MyAvailabilityCalendar.tsx`; its handoff says 38a
     "can reuse the month grid");
   - from **30**: which actions repopulate the canvas after a recurring-booking edit, and their date
     bounds;
   - from **36**: how the backdrop history is seeded into the ledger (planned: `history.ts` building
     receivable and payable legs and receipts in an `H` or `LDH` namespace), the parity test, and
     16's per-month BCTI count for the AA fee run.
6. Note the current `PERSIST_VERSION`.

## Reference

**Design files (convention 17):**

- `docs/design/Mobile App.dc.html`: the Forward Lists header, the Week, Month, To-Do and Done filter
  chips (38px pills, teal when active), the day headings (11px micro-caps, mist) and the List row.
  Its Procedure code sheet has the one mobile search field the design draws (48px, radius `ctl`,
  `neutral.bg` fill, "Search code or name"): the Lists search field uses that anatomy.
- `docs/design/Mobile Availability.dc.html`: the date strip and day cells, the pattern for the
  calendar's day cells and today marker.
- `docs/design/Web Availability.dc.html`: the "Search name" pill input with its leading search glyph
  (built in `AvailabilityGrid.tsx`), the pattern for the web search field; and the cell anatomy for
  the web month grid's List blocks.
- `docs/design/Web Dashboard.dc.html`: the week strip's AM and PM blocks and the "✓" completed
  marker, reused in the web month cells.
- `docs/design/Design Language.dc.html`: tokens. Teal is the only action colour (the calendar button,
  Go, Today, the result links); crimson never appears in the calendar or search (today is marked as
  the week strip marks it, not with a crimson fill); List blocks keep their status colours; mono
  tabular numerals for dates and NHIs; `sheet-in` motion for the calendar sheet.
- No mockup draws a month calendar or a search result list. Extend Phase 29's month grid (if it
  shipped) and the List row; do not invent new chrome.

**Catalogue items:** the covered and context files above. Neither story has images.

**Analysis files:**

- `docs/prototype-build/catch-up/GAP-ANALYSIS.md`: Summary theme 8 ("Events replace the post-op
  addendum; look-back and search"), the EP-03 table rows for US-03.1.6 (Partial, corrected from
  Contradicts) and US-03.1.7 (Missing), and the DM-39 row.
- `docs/prototype-build/catch-up/epics/EP-03.md`: the header's structural note (2) on "billed = gone"
  and the seeded history as the shared prerequisite, note (7) on the Souter-only persona, and the
  US-03.1.6 and US-03.1.7 entries.
- `analysis/domain-model-delta.md` DM-39 (last sentence) and DM-17;
  `analysis/prototype-map-apps-mobile-web.md` (Forward Lists "No search, no date picker", Lists, "Billed
  = gone", and section 8 "Not present in these apps"); `prototype-map-store-seed.md` (selectors, the
  history seed, the canvas horizon); `prototype-map-shell-demo-pwa.md` (routes and `pwa/main.tsx`).

**Code entry points** (paths under `aa-prototype/src/`, except `pwa/main.tsx` and `visual/*.spec.ts`,
which sit under `aa-prototype/` itself; `pwa/pwaPurity.test.ts` is `src/pwa/`; line numbers from
501b0b8, pre-15 names in brackets; phases 14 to 38 will have moved them):

- Clock and canvas: `domain/clock.ts` (`HORIZON_PAST_DAYS` 86, `HORIZON_FUTURE_MONTHS` 88,
  `horizonFor` 100); `store/clockActions.ts` (`rollCanvasForward` 29, append-only: it never prunes
  past dates); `store/mastersActions.ts` (`horizonFor` use ~257, Add anaesthetist's canvas fill) and 30's repopulate path.
- History seed: `domain/seed/history.ts` (`ACCOUNTS` 92 to 113, 13 Souter accounts from 18 Mar to
  30 Jun 2026, one AM List and one Booking each; `buildHistory` 145; ids `L-HIST-nn`, `HC` (`HBK` after Phase 15),
  `HP`, `HINV`, `HBC`, `XRH`/`XPH`, `PMTH`, `RCTH`, `DSBH`); `domain/seed/billing.ts`
  (`buildSeedBillingSlice` ~114, which rebuilds the same graph); `domain/seed/index.ts` (merges
  `history.lists`, `.cards` and `.procedures` ~378 to 392); `domain/seed/patients.ts` (`PAT`, the
  pinned rows, `genericPatientIds()`); `domain/seed/seed.test.ts`.
- Repeat patients for the search beat: Sarah Mitchell (`PAT.mitchell`, CQY9304) has backdrop `oa07`
  (Souter, 14 Apr), a live Souter Booking on Mon 27 Jul and a Booking on **Dr Sharma's** Tue 14 Jul
  List (`cards.ts` ~763, ~839); Wiremu Tane (ZBC1123) has `oa01` (26 Jun) and a design-day PM
  Booking; Noah Prescott (`PAT.provisional`) has no NHI (Souter, Mon 27 Jul).
- Selectors: `store/selectors.ts` (`isListBilled` 118, `isBackdropList` 141, `billedLists` 149,
  `invoicesForList`, `cardsForList` (`bookingsForList`), `cardsOnListByNhi` 926, the only NHI lookup
  today, single List); 38's `listBillingStatus` in `domain/listBilling.ts`.
- NHI: `domain/nhi.ts` (`validateNhi` 54, `CURRENT_SHAPE` and `NEW_SHAPE`, the normalisation).
- Mobile: `apps/mobile/routes.tsx` (`MobileListsRoute`, the `seen` ref ~46, `backToLists` and
  `backToList` ~68, the `SlideStack` layers, the home layer always mounted);
  `apps/mobile/navigation.ts` (`listsStackLocation`); `apps/mobile/screens/ForwardListsScreen.tsx`
  (`Filter` 10, `FILTERS` 12, the `mine` filter 65, `inWindow` 73, `toRow` 96, the filter chips ~184);
  `apps/mobile/MobileApp.tsx` (`showTabBar` 132); `shared/schedule/ListRow.tsx`;
  `shared/surface/BottomSheet.tsx`; `shared/capture/CodePickerSheet.tsx` (the search input ~52);
  `pwa/main.tsx` (the PWA reuses `MobileListsRoute`, so no route change there).
- Web: `apps/web/screens/ListsScreen.tsx` (the From and To inputs, 38's Segmented, `Th`, `Td`);
  `apps/web/routes.tsx` (`WebListsRoute` 68, `WebListDetailRoute` 80 with `onBack` to `/web/lists`,
  `WebCardDetailRoute` (`WebBookingDetailRoute`) 99); `apps/web/screens/AvailabilityGrid.tsx` (the
  "Search name" input ~131); `apps/web/components/WeekStrip.tsx` (block anatomy);
  `apps/web/components/Panel.tsx`; `apps/web/WebApp.tsx` (`tabForPath`: `/web/lists` prefix already
  covers query strings).
- Admin reference only: `apps/admin/components/RightRail.tsx` (`MiniCalendar` 48: Monday-first grid,
  arrow, Home, End and PageUp keyboard handling), the keyboard model to copy if 29 did not build one.
- Tests and shots: `pwa/pwaPurity.test.ts`, `domain/domainPurity.test.ts`, `visual/routing.spec.ts`,
  `visual/mobile-interactions.spec.ts`, `visual/mobile-insets.spec.ts`, `visual/pwa-device.spec.ts`,
  `visual/web-phase05.spec.ts`.

## Work items

Domain and seed first, then selectors, then UI. Keep the three commands green after each group.

### Domain, seed and store

1. **Search as a pure module** (`src/domain/bookingSearch.ts`, exported from `src/domain/index.ts`;
   US-03.1.7). Pure, no store or React imports (`domainPurity.test.ts` holds).
   - `parseBookingQuery(raw)` returns `{ kind: 'empty' }`, `{ kind: 'tooShort' }` (fewer than two
     letters or digits), `{ kind: 'nhi', nhi }` or `{ kind: 'name', tokens }`. A query whose
     spaces-removed, uppercased form fits the current or new NHI shape (reuse `validateNhi`'s
     normalisation and shape test; do not duplicate the regexes) is an NHI query, matched exactly,
     whether or not its check digit passes, so a mistyped NHI finds nothing rather than erroring.
     Anything else is a name query.
   - `foldName(s)`: lower case, Unicode NFD with combining marks removed, the ʻokina and apostrophes
     removed, runs of spaces and hyphens collapsed. So "faaoso" matches "Faʻaoso" and "maori"
     matches "Māori".
   - `patientMatches(query, patient)`: an NHI query matches `patient.nhi` exactly; a name query
     matches when **every** folded token is a substring of the folded name ("sar mit" and "mitch"
     both find Sarah Mitchell). A patient with no NHI is found by name only.
   - Vitest (`bookingSearch.test.ts`): both NHI formats, with and without spaces and in lower case;
     a seven-character name ("Prescot") is a name query; one- and two-token partial names; accent and
     ʻokina folding; no NHI on the patient; "a" is `tooShort`; two calls deep-equal.

2. **Six months of browsable history** (`domain/seed/history.ts`, or wherever Phase 36 left the
   backdrop builder; US-03.1.6 "a day months in the past").
   - Give the account rows a `listKey` and a `session`, so several accounts share one List
     (today one account is one List, one Booking, AM). Existing accounts get `listKey` equal to their
     own key and `session: 'AM'`, so **every existing id, invoice number, amount and date is
     unchanged** (`L-HIST-01` to `L-HIST-13`, `AA-2026-H01` to `H13`, the `oa02` missed webhook,
     Mitchell's prior balance, Riley's archived contact).
   - Append, after the existing rows, a hand-written table (no RNG draws, so no other seed stream
     shifts) of about **12 new Lists with 2 to 4 Bookings each (about 30 Bookings)**, Monday 12
     January to Friday 27 March 2026, AM and PM, at Souter's usual hospitals (St George's, Southern
     Cross, Christchurch Private Hospital) with their surgeons, one Procedure per Booking with an RVG
     base code from the seeded master, and at least one ACC account (organisation counterparty).
     No two backdrop Lists share a date and session: Wed 18 March AM is already `L-HIST-08` (`oa08`).
     The new Lists take the same `slotId` and `kind` the existing backdrop Lists got in Phase 28 (no
     Slot record).
     Patients: Sarah Mitchell once more (on the pinned 13 March List below, so a search for her
     returns March, April and her upcoming July Booking), Wiremu Tane and Coral Bennett once each, the rest from
     `genericPatientIds()` by fixed index.
   - Pin one of them as the demo day: **Fri 13 March 2026, AM, St George's, three Bookings**, one of
     them Sarah Mitchell's. Export its date and List id as `SEED_LOOKBACK` (`{ dateISO, listId }`)
     from `domain/seed/index.ts` beside `SEED_LIST_IDS`, for the tests, the shots and the guide.
   - **Money stays where it is.** Every new account is `paid`, received and disbursed **before 1 April
     2026**. So nothing new is outstanding (Outstanding, Awaiting collection, Balances and the S3 and S4
     figures do not move), and no current GST period changes (Souter's July, the two-monthly June to
     July, the six-monthly April to September); the receipts appear only when the GST tab steps back.
     Collected and Paid out to date rise by the new totals: they are derived, so check that no test,
     guide line or Control Panel text pins them, and update any that does.
   - New ids continue each namespace from the existing seq (`L-HIST-14` on; Bookings, Procedures,
     invoices, ledger legs and Xero rows likewise), through the same builder, so Phase 36's ledger
     seeding, its one-payable-leg-per-receivable parity test and 38's GST balance check cover them
     with no special case. Phase 16's per-month BCTI count gains January to March BCTIs; no seeded AA
     fee invoice is for those months, so assert that the seeded fee invoices and their totals are
     unchanged.
   - The audit seeding (`seed/audit.ts`) gives the new Bookings the same short history the existing
     backdrop Bookings have.
   - Seed tests (`seed.test.ts`): two builds deep-equal; every existing backdrop id and amount is
     unchanged (pin `L-HIST-07`, `AA-2026-H07` and its total); the new Lists all fall before the canvas
     start (`horizonFor(DEMO_TODAY).startISO`), are AUTHORISED and billed, carry 2 to 4 Bookings, and
     all their accounts are settled before 2026-04-01; Souter has backdrop Lists in each month from
     January to June.
   - **Bump `PERSIST_VERSION` by one** with a comment line ("Phase 38a: browsable history January to
     March 2026") and extend `persistMigrate.test.ts` only if the shape changed (it should not).

3. **Look-back selectors** (`store/selectors.ts`, or a new `store/lookback.ts` re-exported from
   `store/index.ts`; PWA-safe).
   - `lookbackBoundsFor(state, anaesthetistId)`: `{ firstMonthISO, lastMonthISO }`, the month of the
     anaesthetist's earliest List (January 2026 for Souter after item 2) to the month of the canvas
     horizon's end (`horizonFor(today).endISO`).
   - `listsMonthFor(state, anaesthetistId, monthISO)`: for each date of the month, the anaesthetist's
     Lists by session (`listId`, session, `kind` or status key for the colour, hospital short name,
     active Booking count, and 38's `listBillingStatus`). It reads **Lists, not Slots**, because the
     backdrop Lists have no Slot record (Phase 28) and this calendar is about work, not availability.
     Free, Holiday and Unavailable sessions are not shown here; that is Phase 29's calendar.
   - `listsOnDayFor(state, anaesthetistId, dateISO)`: the Lists on one date, AM before PM, including
     backdrop and billed Lists, each with its Bookings (patient name, NHI or the app's NHI-missing
     label, scheduled time, primary Procedure description first) for the web rail.
   - `searchBookingsFor(state, anaesthetistId, rawQuery)`: `{ query, upcoming, past, total }`. Rows are
     the anaesthetist's own non-cancelled Bookings (the List's `anaesthetistId` is the persona; a
     Booking 32 moved to a colleague's List is theirs, not the persona's) whose patient matches item
     1, each with `bookingId`, `listId`, date, session, patient name, NHI, hospital short name, the
     Procedure descriptions (primary first), the List's billing status and its warning count (15a).
     `upcoming` (today and later) is soonest first; `past` is most recent first; at most 50 rows in
     all, `total` the full count. If Phase 40 has run and patients can be merged, resolve through its
     patient resolver so a merged patient's Bookings appear once.
   - Phase 38's `listBillingSummaryFor` leaves backdrop invoices out. If it does so for a backdrop
     List's **own** invoices, change it to include them when the List itself is a backdrop List (the
     exclusion exists to keep backdrop invoices out of the office's live views, not to blank a
     history List's "Invoiced · AA-2026-H07" line), and adjust 38's test that says a backdrop invoice
     is never listed to say so for live Lists only.
   - Vitest: Mitchell by "mitchell" and by "CQY9304" returns her March, April and July Souter
     Bookings and never her Sharma Booking; "tane" finds Wiremu Tane; Noah Prescott is found by name;
     a cancelled Booking is never returned; upcoming and past order; the 50-row cap with the true
     total; `listsMonthFor` for March 2026 shows the new history Lists and for July 2026 the canvas
     Lists; `lookbackBoundsFor` is January to November 2026 at the demo's today; all deterministic.

4. **History survives the clock and the canvas** (the risk this phase owns).
   - Read `rollCanvasForward` (append-only) and every path that regenerates or repopulates Lists:
     Phase 30's recurring-booking edits, Phase 29's series apply, Add anaesthetist
     (`mastersActions.ts`) and any holiday reconcile. Each must be bounded to today or the canvas
     horizon, never to dates before it, and must skip `isBackdropList` Lists.
   - Vitest (`store/lookback.test.ts`): after "Next morning", a 30-day clock jump, a recurring-booking
     edit (30) and a series save (29), every backdrop List, Booking and Procedure deep-equals the seed;
     the canvas Lists that fall behind the horizon start as the clock advances are still there and
     still reachable through `listsMonthFor`; Reset restores the seed.

### UI

5. **A shared month grid** (`src/shared/calendar/MonthGrid.tsx`, PWA-safe). If Phase 29 extracted a
   month grid, reuse it and add only what is missing; if it built two screen-local grids, extract
   their common part here and point both 29 screens at it (no visual change to them).
   - Monday-first seven columns, a month title with previous and next controls bounded by
     `lookbackBoundsFor`, a **month and year jump** (tapping the title opens a year stepper over twelve
     month chips; on web a compact popover with the same content), and a **Today** text button.
   - A `renderDay(dateISO)` slot so each app draws its own cell; the grid owns layout, bounds,
     today's marker and keyboard movement (arrows, Home, End, PageUp and PageDown, as `MiniCalendar`).
   - Every day is a real `<button>` with an accessible label ("Friday 13 March 2026, 2 Lists"); days
     outside the bounds are inert.

6. **Mobile: calendar and search on the Lists tab** (`ForwardListsScreen.tsx`, `routes.tsx`,
   `navigation.ts`; US-03.1.6, US-03.1.7, US-15.0.2).
   - **URL state.** The home layer reads `?day=YYYY-MM-DD` and `?q=` from the URL. `MobileListsRoute`
     remembers the home layer's search string beside its `seen` ids, and `backToLists` and
     `backToList` restore it, so a pop from List or Booking detail returns to the same day or the same
     results. Drill-ins stay pushes. Per the 2026-07-27 routing ruling, `?q=` and `?day=` are view
     state written with `replace` (no history entry per keystroke or picked day), and the calendar
     sheet's open state stays local `useState`, never in the URL. A junk `?day=` is ignored through
     `isISODate` (`shell/routeParams.ts`). `pwa/main.tsx` needs no change.
   - **Header row.** Under the greeting, a search field in the Procedure code sheet's anatomy (48px,
     radius `ctl`, `neutral.bg`, a leading search glyph, placeholder "Search patient name or NHI",
     a clear button when not empty), and to its right a 48px square teal-outline calendar button
     (lucide `CalendarDays`, label "Go to a day"). The filter chips stay below.
   - **Calendar sheet** (`BottomSheet`, `data-shot="mobile-lookback-calendar"`): `MonthGrid` with
     each day cell showing its date numeral (mono) and two small half-bars, AM over PM, in the List's
     status colour where a List sits, blank where none. The sheet opens on the month of `?day=` or
     today. Tapping a day closes the sheet and sets `?day=`. Footer: the Provisional pill and its
     line, in mist.
   - **Day view.** With `?day=` set, the filter chips are replaced by one teal day chip
     ("Fri 13 Mar 2026" with a close glyph) and the list shows that date's rows: for a date inside the
     canvas, Forward Lists' own row builder for that date (so Free and Holiday rows read as they do in
     Week); for an earlier date, its Lists only. Billed rows carry 38's "Done · billed" cluster. Empty:
     "No Lists on this day." Closing the chip clears `?day=` and returns to the last filter.
   - **Results view** (`data-shot="mobile-lookback-search"`). With two or more characters typed, the
     sections are replaced by results: an "Upcoming" and a "Past" heading (micro-caps), each row a
     `ListRow`-anatomy button with the patient name as the title, "Fri 13 Mar · AM · St George's ·
     Knee arthroscopy" as the subtitle, the NHI in mono on the right (or the NHI-missing label), the
     billed marker and the warning triangle where they apply. Tapping opens
     `/mobile/lists/:listId/bookings/:bookingId` (depth 2; the List layer mounts from the URL, so
     back goes to the List, then to the results). Above the rows, one line: "3 Bookings for
     Mitchell" or, past the cap, "Showing 50 of 64. Add more of the name or the NHI." Empty: "No
     Bookings match. Try part of the name or the full NHI." Debounce is not needed at seed scale;
     filter on every keystroke through `useMemo`.
   - Search and day view are exclusive: typing clears `?day=`; picking a day clears `?q=`.
   - The tab bar stays visible on the home layer (depth 0) in all three states.
   - Mobile-first throughout: a bottom sheet, chips and a full-width field; no native date input, no
     centred modal, nothing below 44px tap height.

7. **Web: Calendar view and search on the Lists page** (`ListsScreen.tsx`, `routes.tsx`; US-03.1.4,
   US-03.1.6, US-03.1.7).
   - **URL state.** `/web/lists?view=calendar&month=2026-03&day=2026-03-13` and `/web/lists?q=mitchell`.
     If 38 kept Upcoming and Completed in component state, move them to `?view=` too (`upcoming`
     default, `completed`, `calendar`) so every view is addressable. Unknown values fall back to
     Upcoming, and a junk `?day=` or `?month=` falls back to today through `isISODate`
     (`shell/routeParams.ts`). All of these are written with `replace`, as the 2026-07-27 routing
     ruling has it for view state; only drill-ins push.
   - **Back returns to where you were.** Drill-ins from the Lists page pass
     `state: { from: pathname + search }`; `WebListDetailRoute` and the Booking detail route's back
     use it, falling back to `/web/lists` (and to the List for Booking detail) when absent, so a
     refresh or a deep link still works.
   - **Header.** The page title row gains the search field on the right, in the "Search name" pill
     anatomy widened to 280px (placeholder "Search patient name or NHI"), beside 38's Segmented, which
     gains a third option **Calendar**.
   - **Calendar view** (`data-shot="web-lookback-calendar"`): a two-column layout inside the 1320px
     content width: `MonthGrid` in a `Panel` (each day cell shows up to two List blocks, AM over PM, in
     the week strip's block anatomy: status colour bar, hospital short name, the "✓" for done Lists)
     and a 340px right rail for the picked day: the date heading, then each List as a card (session,
     times, hospital and surgeon, 38's marker) with a "View List" link, and under it its Bookings as
     rows (time, patient, NHI in mono, primary Procedure) linking to Booking detail. Empty rail: "Pick
     a day to see its Lists." Shift-select and ranges are not needed.
   - **Search results** (`data-shot="web-lookback-search"`): while `?q=` has two or more characters,
     the table area shows a results table in the Lists table's anatomy (`Th`, `Td`): Date, Session,
     Patient, NHI (mono), Hospital, Procedure, Progress (38's marker) and the warning triangle; Upcoming
     rows first then Past, separated by a group row; each row opens Booking detail. The count line and
     the empty and capped copy match mobile. A "Clear search" text button returns to the previous
     view. The helper line under the field carries the Provisional pill.
   - The web app stays desktop width (min-width 1240); no responsive work.

8. **Drill-down on history Lists** (both apps).
   - Open a backdrop List from the calendar on mobile and web: List detail and Booking detail render
     with no missing-data placeholders (hospital, surgeon, Procedure, invoice line). Fix any reader
     that assumed a backdrop List is never shown (for example a missing `startTime` showing a raw
     "undefined", or a Slot lookup on a List with no Slot record).
   - A billed List stays read only everywhere, as Phase 38 left it: no add, copy, capture, photo or
     edit control appears, and the store's `editRefusal` still refuses. Check the Booking detail's
     history and its Procedures section render for a backdrop Booking.

9. **Tests and shots.**
   - Component tests: `ForwardListsScreen` with `?day=2026-03-13` shows that day's history List;
     typing "mitch" shows three rows in Upcoming and Past; tapping a result navigates to the Booking
     route; closing the day chip restores the filter. `ListsScreen` Calendar view: picking 13 March
     fills the rail; a search for "CQY9304" lists the same three Bookings; Clear search restores the
     view.
   - A `MonthGrid` test: bounds disable previous on January 2026 and next on the horizon's month; the
     month and year jump lands on the chosen month; arrow keys move focus; the accessible labels count
     Lists.
   - Playwright: a new `visual/lookback.spec.ts` with the four `data-shot` hooks (mobile calendar sheet
     on March 2026, mobile results for "Mitchell", web Calendar with 13 March picked, web results); a
     routing case in `visual/routing.spec.ts` (`/web/lists?view=calendar&day=2026-03-13` loads the
     rail; back from List detail returns to it; `/mobile/lists?day=2026-03-13` back from a List
     returns to the day). Keep `mobile-insets.spec.ts`, `mobile-interactions.spec.ts` and
     `pwa-device.spec.ts` passing (the search row and sheet respect the insets and the `DockSpacer`
     rule).

10. **Copy and comment sweep.** Update the header comments of `ForwardListsScreen.tsx` and
    `ListsScreen.tsx`, the `isBackdropList` comment (backdrop Lists are now browsable from the
    calendar and search, still excluded from office surfaces and from Forward Lists' Week, Month and
    Done). Leave `analysis/prototype-map-apps-mobile-web.md` as it is: it is the plan-time snapshot.
    No en or em dash in any new string; ranges read "January to March".

## Demo triggers

**None needed.** The seeded months of history for Dr Souter make both features demoable through
normal use on every surface: open the calendar, jump to March, pick a day; or type "Mitchell" or
"CQY9304". Nothing waits on the office, a colleague or a backend event, so there is no PWA stand-in
either: the PWA reuses `MobileListsRoute` and gets the calendar and search unchanged. The Control
Panel page gains nothing. If the registry's audit (Phase 44) wants a jump, the Direct URLs below are
enough.

## Out of scope

- The Admin App: no office calendar of past work and no office search across anaesthetists
  (both stories leave it open; the drift check stops if that changes).
- Pre-op and post-op events on a past Procedure (Phase 39b builds them on the Booking detail reached
  here), and any edit of a billed or backdrop Booking.
- A patient record or patient view, merging patients, the missing-NHI problem list (Phase 40) and NHI
  lookup against the register (Phase 40a). The "three-way match" (name, date of birth, NHI) Greg
  mentioned and did not take further.
- Search by anything other than NHI or patient name (surgeon, hospital, Procedure code, invoice
  number, date of birth), fuzzy or sound-alike matching, recent searches, and cancelled Bookings.
- History for any anaesthetist but Dr Souter, history before January 2026, and unpaid or part-paid
  history accounts.
- Changing the canvas horizon (`HORIZON_PAST_DAYS`, `HORIZON_FUTURE_MONTHS`) or rolling it backwards.
- Draft Lists (no anaesthetist; Phase 31) and Lists moved to a colleague (they leave the persona's
  results by design).
- Availability statuses in this calendar (Phase 29's My calendar shows them).
- Search at full scale and its timings (Phase 43).

## Manual test checklist

- [ ] Reset. Mobile → Lists: the search field and the calendar button sit under the greeting; Week,
      Month, To-Do and Done work as before; Done still shows no backdrop Lists.
- [ ] Tap the calendar button: the sheet opens on July 2026 with today marked and half-bars on days
      with Lists. Tap the title, pick 2026 and March: March shows the new history Lists. Previous stops
      at January 2026; next stops at the horizon's month.
- [ ] Pick Fri 13 Mar: the sheet closes, the day chip shows and the
      day's List reads "Done · billed". Open it: List detail shows its Bookings, read only, with
      "Invoiced · AA-2026-H.." numbers. Open a Booking: its Procedure and history render. Back twice
      returns to the same day chip.
- [ ] Close the chip: the last filter returns. Pick a July canvas day: Free and Holiday rows read as
      they do in Week.
- [ ] Type "mitch": Upcoming shows Mon 27 Jul; Past shows April and March; her Booking on
      Dr Sharma's List does not appear. Type "CQY9304" and "cqy 9304": the same three. Type "Prescott":
      Noah Prescott with the NHI-missing label. Type "zzz9999": the empty copy.
- [ ] Tap a past result: Booking detail opens; back goes to its List, then to the results with the
      query kept.
- [ ] Web → Lists: the Segmented reads Upcoming, Completed and Calendar; the search field sits at the
      right. Calendar: step back to March, pick 13 March: the rail lists the List and its Bookings;
      "View List" opens List detail and Back returns to the calendar on 13 March.
- [ ] Web search "Mitchell": the results table shows the three Bookings with the Progress marker;
      Clear search returns to the previous view. `/web/lists?q=tane` loads with results.
- [ ] Next morning, then a 30-day jump on the clock: March history is unchanged; days that slid behind
      the canvas start are still in the calendar with their Lists.
- [ ] Web → Accounts: Outstanding, Awaiting collection and the July GST period are unchanged from
      before this phase; GST Previous to March 2026 shows the new receipts. Admin Billing monitor and
      Invoices show no backdrop rows.
- [ ] PWA (`npm run dev:pwa`, fresh storage): the search row and the calendar sheet clear the insets;
      the calendar, day view, search and back behave as in the framed build.
- [ ] Keyboard: the web month grid moves with the arrows; every day and result is reachable by Tab and
      has a readable label.
- [ ] No en or em dashes in any new string; teal the only action colour; no crimson in the calendar or
      results; the Provisional pill shows once per app.
- [ ] Catalogue screenshots: the recipes for US-03.1.6 and US-03.1.7 are created or updated, any recipe this phase broke is re-pointed, a full `npm run capture` ends with no failed recipe and no story without a recipe, the covered items' new shots are checked by eye, and `npm run verify:board` is green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots` and `npm run verify:board` are all green.

## Demo guide updates

Patch in the same session (`docs/demo-guide/`, the same sections of `master-demo-guide.html`):

- `03-demo-script.md`:
  - **Direct URLs:** add "Lists, one day" `/mobile/lists?day=2026-03-13`, "Lists, search"
    `/mobile/lists?q=Mitchell`, "Lists, calendar" `/web/lists?view=calendar&day=2026-03-13` and
    "Lists, search" `/web/lists?q=Mitchell` (13 March is `SEED_LOOKBACK`).
  - **S3, an optional closing moment** after Beat 3: "Finding past work. On the phone, tap the
    calendar, jump to March, open a day's List and a Booking. Then search 'Mitchell': her March and
    April work and her July Booking, and nothing from Dr Sharma's List." Say: "Anaesthetists asked to
    look back past the four-month view without scrolling. It is their own work only." Expected: as in
    the checklist. Add to the S3 discovery points: "whether the office also needs this search, and
    whether date of birth joins name and NHI (the three-way match)".
  - If Phase 39b has not run yet, add nothing to S4 Beat 2; 39b ties its post-op event to this entry
    point.
- `04-presenter-cheat-sheet.md`: "What each app is for" (Anaesthetist Mobile and Web) gains "find past
  work by calendar or by patient name or NHI"; the readiness section's "Built and clickable" lists it.
- `02-workflows-and-handoffs.md`: a short "Looking back" workflow (calendar to day to List to Booking;
  search by NHI or name; own Bookings only; billed Lists read only).
- `01-personas-and-responsibilities.md`: the anaesthetist's paragraph mentions looking back at past
  work.
- `master-demo-guide.html`: the same passages (the Direct URLs tables, S3's closing moment and
  discovery callout, the cheat-sheet app cards and readiness list).
- Control Panel scenario text: no change.

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19),
run after the review pass and before the PROGRESS.md entry. Re-run
`node docs/prototype-build/catch-up/tools/recipe-status.mjs 38a` first: earlier phases may have
changed these recipes since this plan was written.

**Covered items.** When the phase is done, each recipe in `requirements-board/capture/recipes/`
matches what was built:

| Item | Recipe at plan time | When this phase is done |
|---|---|---|
| [US-03.1.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.1.6.md) Find past work from a calendar | absent · stub, no shots | create the shots in `recipes/US-03.1.6.json` (replace the stub), status `captured` (Proposed in the catalogue, but fully built on both apps; the admin app is not in scope per the story's note). Mobile `/mobile/lists`: shot `lookback-calendar`, open the calendar sheet (`[aria-label="Go to a day"]`, or its text) and highlight `[data-shot=mobile-lookback-calendar]`; a second state taps the title, picks March 2026 and Fri 13 Mar, and shows the day chip with that day's `Done · billed` List. Web `/web/lists?view=calendar&month=2026-03&day=2026-03-13` (or click the Calendar segment): shot `lookback-calendar`, highlight `[data-shot=web-lookback-calendar]` with the day rail beside it. A `drill` state on each opens the history List, then a Booking and its Procedures. Captions: "Calendar jumps to any day back to January 2026" and "Pick a past day to see its Lists, then a Booking and its Procedures" |
| [US-03.1.7](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.1.7.md) Search Bookings by NHI or patient name | absent · stub, no shots | create the shots in `recipes/US-03.1.7.json` (replace the stub), status `captured`. Mobile `/mobile/lists?q=mitchell` (or fill the search field, placeholder "Search patient name or NHI"): shot `lookback-search`, highlight `[data-shot=mobile-lookback-search]` with the Upcoming and Past headings and the "3 Bookings for Mitchell" line; a state typing the NHI `CQY9304` shows the same three. Web `/web/lists?q=mitchell`: shot `lookback-search`, highlight `[data-shot=web-lookback-search]`, the results table with the NHI and Progress columns. Captions: "Search finds a patient's Bookings by NHI or part of a name" |

**Recipes this phase breaks.** None found at plan time; the `--dry` run is the check. The Lists page and the mobile Lists tab gain a search field, a calendar button and a Calendar segment, and the seed gains Jan to Mar 2026 backdrop Lists, but no recipe depends on text those change: `US-03.1.1` (`drill-down`, `/web/lists` and `/mobile/lists`), `US-07.4.1` and `US-07.2.1` click rows by hospital or surgeon text and fill the first date input, which stay. Their new shots will show the extra header controls on the next full capture; look at them once. If Phase 38's `?view=` change moved Upcoming and Completed to the URL, re-check any recipe that clicks those segments.

**ATLAS.md.** Routes: add `?day=`, `?q=` (mobile and web Lists) and `?view=calendar&month=` (web Lists). Personas and IDs / Seed data: the new Dr Souter backdrop Lists, the pinned `SEED_LOOKBACK` List (Fri 13 Mar 2026) and the search examples (Mitchell, `CQY9304`, Prescott). Existing hooks: the four `data-shot` hooks `mobile-lookback-calendar`, `mobile-lookback-search`, `web-lookback-calendar`, `web-lookback-search`.

## Adversarial review (after build)

Once the manual test checklist and `npm run build`, `npm run build:pwa`, `npx vitest run` and
`npm run shots` are green, and before writing the PROGRESS entry, run the standard **adversarial
review-and-fix pass (PROGRESS convention 18)**: three independent Opus review subagents, one each for
**quality**, **bugs/correctness** and **plan adherence**, each given the covered catalogue files, this
doc and the diff. This session verifies every finding against the catalogue, this doc and the code,
fixes the confirmed ones (with a test wherever a bug had none), re-greens and records the pass. Do not
re-raise anything settled in the Decisions log.

**Steer this phase's reviewers at:**

- **Own work only.** Search and calendar return only Lists whose `anaesthetistId` is the persona's;
  hunt for any path (the Sharma Mitchell Booking, a List reassigned or moved in 28 or 32, a Draft
  List) that leaks another anaesthetist's patient into the results or the rail.
- **History is untouched.** No clock advance, canvas roll, recurring-booking edit, series save,
  holiday reconcile or Add anaesthetist writes, drops or regenerates a List before the canvas start;
  `isBackdropList` Lists stay out of the office surfaces and of Forward Lists' Week, Month and Done.
- **Money is unchanged.** The new history moves no outstanding figure, no current GST period, no S3
  or S4 number and no seeded AA fee invoice; the ledger parity and GST balance checks still pass; every
  existing backdrop id and amount is the same.
- **Matching.** NHI exact in both formats with spaces and case ignored, reusing `validateNhi`'s
  normalisation; partial names by every token; accent and ʻokina folding; cancelled excluded; the cap
  reports the true total; the module is pure and deterministic.
- **Navigation.** Back from List and Booking detail returns to the same day or results on both apps,
  a refresh or deep link still works, the mobile stack's pops keep the home query, no nested
  interactive elements, and the PWA routes are unchanged.
- **Read only.** A billed or backdrop List and its Bookings expose no edit control on either app and
  the store refuses edits.
- **Design and copy.** Mobile-first sheet and field, the design's search anatomy, teal-only actions,
  no crimson, status colours only for List blocks, mono dates and NHIs, the Provisional pill once per
  app, no en or em dashes.
- **Persistence.** `PERSIST_VERSION` bumped; two fresh seeds deep-equal; no new store slice.

## PROGRESS.md updates

- **Status row** for catch-up Phase 38a, and a phase entry with:
  - the drift-check result (items changed or not; whether the Admin App or date of birth came into
    scope; the provisional readings built);
  - what was built, with the name map for later phases: `parseBookingQuery`, `foldName` and
    `patientMatches` in `src/domain/bookingSearch.ts`; `lookbackBoundsFor`, `listsMonthFor`,
    `listsOnDayFor` and `searchBookingsFor`; `src/shared/calendar/MonthGrid.tsx` (and whether 29's
    screens now use it); the `?day=`, `?q=` and `?view=` URL state and the back-to-referrer rule; any
    change to 38's `listBillingSummaryFor`;
  - the history added (Lists, Bookings, months, totals) and the money figures checked unchanged;
  - the `PERSIST_VERSION` bump (from and to);
  - tests added and the before and after Vitest and Playwright counts;
  - the review pass.
- **Catalogue screenshots result:** recipes created (US-03.1.6, US-03.1.7) or changed, the `capture/REPORT.md` counts (captured, partial, absent, failed) before and after, and any partial reason handed to a later phase.
- **Decisions log:**
  1. **Amended:** the Phase 10 entry on the seeded historical backdrop ("office surfaces exclude
     them"). The backdrop is also the anaesthetist's browsable history (January to June 2026 for
     Dr Souter, multi-Booking Lists, the new months settled before 1 April); office surfaces and
     Forward Lists' Week, Month and Done still exclude it; the calendar and search include it.
  2. **New:** find-past-work reads Lists, not Slots; it is a work calendar, separate from Phase 29's
     availability calendar, bounded by the anaesthetist's first List and the canvas horizon.
  3. **New (provisional):** search covers the anaesthetist's own non-cancelled Bookings, matching an
     exact NHI in either format or every word of a partial name, ignoring case and accents; the Admin
     App is not included until AA says otherwise.
  4. **Upheld with an addition:** the 2026-07-27 real-routing ruling (the mobile Lists tab is one
     splat route hosting the slide stack; query params carry view state, written with `replace`;
     transient sheets stay local state); the home layer now carries `?day=` and `?q=`, which the pops
     restore.
- **Handoff notes:**
  - For **39b**: the Booking detail reached from the calendar or search is the entry point for adding
    a pre-op or post-op event to a past Procedure; on a billed List that action is the one control
    that may appear, and the store's edit refusal must allow the event and nothing else.
  - For **40**: search rows can link to the patient view; merged patients must resolve through one
    resolver so search shows a patient's Bookings once.
  - For **40a**: the search field may show NHI validation feedback once lookup exists; matching stays
    exact.
  - For **43**: `searchBookingsFor` and `listsMonthFor` must stay usable at full scale; index by
    anaesthetist if timings demand it.
  - For **44**: S3's optional closing moment and the Direct URLs were added here; re-read them in the
    rewrite and audit that no trigger is needed.
