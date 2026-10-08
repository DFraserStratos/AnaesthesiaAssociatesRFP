# Phase 38a · The anaesthetist's main view, archive and search

(The file keeps its historical slug, `find-past-work`; the plan tools pin it in `plan.json`.)

**Requirements covered:**
[US-07.4.2](../../../../requirements-board/requirements/stories/US-07.4.2.md) Anaesthetist's main view (Verify) ·
[US-07.4.1](../../../../requirements-board/requirements/stories/US-07.4.1.md) List leaves the main view once invoiced (Verify) ·
[FT-07.4](../../../../requirements-board/requirements/stories/FT-07.4.md) List visibility in the anaesthetist app (Proposed) ·
[US-07.2.1](../../../../requirements-board/requirements/stories/US-07.2.1.md) Anaesthetist loses edit access (Proposed; the web "completed, unbilled" marker and the earlier submitted Lists the web default range hides) ·
[US-03.1.6](../../../../requirements-board/requirements/stories/US-03.1.6.md) Find past work and old invoices (Proposed) ·
[US-03.1.7](../../../../requirements-board/requirements/stories/US-03.1.7.md) Search Bookings by NHI or patient name (Proposed).
Owner decision **D9 is answered** by [OQ-31](../../../../requirements-board/requirements/questions/OQ-31.md)
(2026-10-07): a List leaves the anaesthetist's main view once the office has finalised it and sent it
through to invoicing, and old work stays findable by archive or search. Built as answered, with no
provisional label. US-07.4.1 and US-07.4.2 are **Verify** only because the room's words ("finalised
and sent through to invoicing") are close to, not the same as, the RFP's "once its invoices are
generated": the prototype's billing run stamps `billedAtISO` at the office's authorise, which is both,
so one predicate holds the exit and a different reading stays a one-line change.
Treated here without closing it: [DM-39](../analysis/domain-model-delta.md#dm-39) (its last sentence
only: search and calendar navigation are selectors and UI only).
Read alongside (not closed here):
[EP-07](../../../../requirements-board/requirements/stories/EP-07.md) (the four List states: DRAFT,
ACTIVE, SUBMITTED, AUTHORISED; 15b renamed the old DRAFT to ACTIVE, 31 added Draft Lists, which never
reach an anaesthetist's view per OQ-86),
[FT-03.1](../../../../requirements-board/requirements/stories/FT-03.1.md),
[US-03.1.1](../../../../requirements-board/requirements/stories/US-03.1.1.md) (the schedule to List to Booking to Procedure drill-down both entry points land on),
[US-03.1.2](../../../../requirements-board/requirements/stories/US-03.1.2.md) (20a's three-part Procedure stack: what the anaesthetist "entered", seen read only on an invoiced Booking),
[US-03.1.4](../../../../requirements-board/requirements/stories/US-03.1.4.md) (web parity),
[US-15.0.2](../../../../requirements-board/requirements/stories/US-15.0.2.md) (mobile-first),
[US-12.2.1](../../../../requirements-board/requirements/stories/US-12.2.1.md) (outstanding balances, where a departed List's invoices show: Phase 38's flat list),
[US-03.7.1](../../../../requirements-board/requirements/stories/US-03.7.1.md) (the post-op event that needs a past Procedure; Phase 39b),
[US-08.6.3](../../../../requirements-board/requirements/stories/US-08.6.3.md) and
[US-08.6.5](../../../../requirements-board/requirements/stories/US-08.6.5.md) (the anaesthetist's own additional invoice and credit note on invoiced work; Phases 38b and 39 reach it through this phase),
[DM-17](../analysis/domain-model-delta.md#dm-17) (the event record 38b adds),
[AR-22](../../../../requirements-board/requirements/artifacts/AR-22.md) regions
`#edit-access-removed` and `#still-visible` (a submitted List stays visible, completed and unbilled)
and `#invoices-generated`, and
[AR-19](../../../../requirements-board/requirements/artifacts/AR-19.md)`#view-schedule`.
Evidence: points 2, 16 and 41 of
[the 2026-10-07 client meeting note](../../../../requirements-board/requirements/notes/2026-10-07-aa-client-meeting.md)
("Maybe it starts you on whatever today is... and you can scroll back to see other lists that haven't
been invoiced... somewhere else in the app there'd be a deeper search or archive"; "a query about an
invoice you did three months ago: what did I enter?"), and points 35 and 36 of
[the 2026-10-01 meeting note](../../../../requirements-board/requirements/notes/2026-10-01-aa-meeting-with-greg.md)
(the calendar beyond the four-month view, the NHI or name search).
**Depends on:** **28** (its main view lists Phase 28's List records, not Slots:
`slotViewsForAnaesthetist`, `list.kind`, the approval label, and the `L-HIST-*` backdrop Lists with a
`slotId` but no Slot record) and **38** (the flat outstanding list where a departed List's invoices
show, FT-07.4, and the cash-basis GST schedule and its balance check that the seeded history must not
move). By the roadmap order every earlier phase has run, notably 15b (ACTIVE), 15a (the warning
triangle), 20a (the three-part Procedure stack), 21 (the payer on the Booking), 25 (the pricing
snapshot written at authorise), 29 (My calendar's month grid), 30 (recurring bookings repopulating the
canvas), 31 (Draft Lists), 32 and 32a (an anaesthetist's own moves), 36 (the ledger the backdrop
history is seeded into). 38b, 39 and 39b run after this phase and use it as their entry point for
invoiced work.
**Estimated:** 2 sessions. Session 1: work items 1 to 8 (the exit predicate and progress label, the
search module, the history seed, the selectors, the history-survives tests, the main view on mobile and
web with the submitted marker, and the invoices on a billed List). Session 2: work items 9 to 14 (the
month grid, the calendar archive and search on both apps, the drill-down, tests, shots and docs).

## Goal

Per OQ-31 (answered 2026-10-07, D9), a List leaves the anaesthetist's main view once the office has
finalised it and sent it to invoicing (US-07.4.1, FT-07.4), and its invoices show in the
anaesthetist's outstanding balances. The prototype's `billedAtISO` exit already matches that trigger:
the billing run stamps it when the office authorises. What is missing is the rest of the answer.

Today the anaesthetist apps only look forward and lose finished work. Mobile Forward Lists offers
Week, Month, To-Do and Done, Week and Month refuse every date before today, and a past ACTIVE List
whose Bookings are all complete but not yet submitted falls into none of the four filters. The web
Lists table defaults its From input to today, so Monday's submitted Lists are hidden on Tuesday, and
neither the table nor the dashboard week strip carries the "completed, unbilled" marker US-07.2.1 asks
for. Once a List is billed it is gone from every anaesthetist view, reachable only by a typed URL, and
the only older work is thirteen single-Booking backdrop Lists that exist to feed the money views. There
is no way back to a day in March, and no way to find a patient's Booking without its date.

This phase:

- makes the **main view** (US-07.4.2) on mobile, web and the PWA start at today: upcoming work, plus
  any earlier List not yet invoiced, reached by scrolling back from today. One predicate decides
  membership (the anaesthetist's own List, not invoiced) and one derivation labels each List's
  progress, so SUBMITTED Lists (and AUTHORISED ones not yet billed) read "Done · unbilled" and are read
  only on mobile, on the web Lists table and on the dashboard week strip alike (US-07.2.1). Invoiced
  Lists leave it (US-07.4.1, FT-07.4);
- adds the **archive** (US-03.1.6): a calendar on both anaesthetist apps that jumps to any past day,
  including before the rolling view, and drills to List, Booking and Procedure, reaching invoiced Lists
  to see what was entered (the three-part Procedure stack, modifiers, times, the payer) and the
  invoices raised;
- adds a **search** (US-03.1.7, US-03.1.6's "deeper search"): one field on both apps that finds the
  anaesthetist's own Bookings by an exact NHI or by part of a patient name, across every one of their
  Lists, past and upcoming, invoiced included;
- seeds **several months of browsable history** for Dr Souter: about twelve new multi-Booking backdrop
  Lists from January to March 2026, invoiced and settled before 1 April, so the calendar has real days
  to land on and a search for a repeat patient returns Bookings months apart, without moving any money
  figure the demo shows.

The main view, archive and search are selectors and screens over the existing store. No new stored
entity and no new mutation; the seed grows, so `PERSIST_VERSION` is bumped. This is the entry point
Phase 38b's anaesthetist additional invoice, Phase 39's credit note and Phase 39b's events use for
invoiced work.

## Before you start: drift check

1. Diff the covered and read-alongside items against the plan's snapshot (catalogue commit `60e2d1e`,
   the 2026-10-07 meetings and the 2026-10-08 plan update):

   ```
   node docs/prototype-build/catch-up/tools/plan-state.mjs --diff US-07.4.2,US-07.4.1,FT-07.4,US-07.2.1,US-03.1.6,US-03.1.7,EP-07,FT-03.1,US-03.1.1,US-03.1.2,US-03.1.4,US-12.2.1,US-03.7.1,US-08.6.3,US-08.6.5,OQ-31,OQ-86
   ```

   (At plan update, 2026-10-08, this doc is current at `60e2d1e`. What `60e2d1e` changed, and this
   plan already reflects: OQ-31 is answered and D9 with it; US-07.4.1 was rewritten from "List
   disappears on invoice generation" (Open) to "List leaves the main view once invoiced" (Verify), with
   a third criterion that a departed List is still found by search or by opening its day; FT-07.4 now
   says the same and names the archive or search; US-07.4.2 (the main view, Verify) is new; US-03.1.6
   was retitled "Find past work and old invoices" and gained the archive or deeper search criterion for
   invoiced Bookings; US-07.2.1 joined this phase from 38 (its body is unchanged; it gained artifact
   links, AR-22 `#edit-access-removed` and `#still-visible`); EP-07 names the four List states; OQ-86
   is answered no. US-03.1.7 is unchanged.)
2. If an item changed again, re-read it in full and adjust the work items. Specifically:
   - **The exit trigger (US-07.4.1 Verify).** If AA fixes the moment as something other than the
     billing run (for example the office's approval, or the invoices being sent), change only the one
     exit predicate in work item 1; nothing else reads `billedAtISO` for this.
   - **Which apps.** The stories name the Anaesthetist App only and US-03.1.6's note says "the admin
     app was not mentioned". If the catalogue now names the Admin App, stop and tell the owner: an
     office-wide search over every anaesthetist is a different selector and a different privacy
     reading, not a flag on this one.
   - **Matching.** If US-03.1.7 now names the "three-way match" (name, date of birth and NHI) or a
     date-of-birth field, add date of birth as a third query kind in work item 2 and show it on the
     result rows; if it names partial NHI matching, add an NHI prefix rule beside the exact one; if it
     names invoice numbers (the "query about an invoice" use case), add an exact invoice-number query
     kind that returns the invoice's Bookings.
   - **The rolling horizon.** If FT-03.1 or FT-01.1 changes the horizon, do not change it here; follow
     the new bound only in the calendar's forward limit.
3. If a covered item is now Retired or Future, drop its work items and say so in the PROGRESS entry.
4. **Open questions: none block this phase.** D9 is answered. Four plan readings are built as stated
   and logged on the "For the owner's review" list (no UI pill): the anaesthetist apps only; search
   matches an exact NHI (current or new format, spaces ignored) or every word of the query inside the
   patient's name, ignoring case and accents, with cancelled Bookings left out; the history goes back
   to January 2026 for Dr Souter only (the persona the anaesthetist apps run as); and a past List with
   no Bookings is left off the main view's earlier group (work item 4).
5. **Prerequisite names.** Confirm Phases 28 and 38 are DONE in PROGRESS.md and read their handoff
   notes and name maps, and the entries for 15, 15b, 20a, 25, 29, 30, 31, 32, 32a and 36:
   - from **28**: `slotViewsForAnaesthetist`, `slotView`, `list.kind`, the approval label, how
     `ForwardListsScreen`, `ListsScreen` and `WeekStrip` build rows from Slot views, and its note that
     backdrop Lists carry a `slotId` but no Slot record; `scheduleHorizon` and the horizon setting;
   - from **38**: where the flat outstanding list lives (web Accounts Outstanding and mobile Balances)
     and whether a newly billed List's invoices show there at once or the next day; the GST schedule
     and its balance check. **38 no longer touches the List views** (its old billed-Lists work moved
     here). If an earlier build of 38 did add `listBillingStatus`, `LIST_BILLING_LABEL` or an
     Upcoming and Completed segment, reuse them as work item 1's derivation rather than add a second
     one, and drop any "Done · billed" row from the main view;
   - from **15** and **15b**: the Booking routes (`/mobile/lists/:listId/bookings/:bookingId`,
     `/web/lists/:listId/bookings/:bookingId`), `bookingsForList`, the history Booking ids (`HBK${n}`),
     the mobile stack's `listsStackLocation` (`bookingId`), and the `ACTIVE` state name;
   - from **20a** and **25**: the read-only stack component on Booking detail, and the snapshot each
     billed Procedure carries (what an invoiced Booking shows);
   - from **29**: whether My calendar's month grid was extracted as a shared component (its handoff
     says 38a "can reuse the month grid");
   - from **30** and **31**: which actions repopulate the canvas after a recurring-booking edit and
     their date bounds; how a Draft List is held (no `anaesthetistId`), so it never matches the persona;
   - from **32** and **32a**: what a List or Booking moved to a colleague looks like (it is theirs);
     whether the cover-request row and `onOfferCover` are gone from Forward Lists;
   - from **36**: how the backdrop history is seeded into the ledger (receivable and payable legs and
     receipts in an `H` namespace), the parity test, and 16's BCTI count for the AA fee run.
6. Note the current `PERSIST_VERSION` (16 at plan time; later phases will have raised it).

## Reference

**Design files (convention 17):**

- `docs/design/Mobile App.dc.html`: the Forward Lists header, the Week, Month, To-Do and Done filter
  chips (38px pills, teal when active), the day headings (11px micro-caps, mist), the List row and its
  "Done · unbilled" tick cluster. Its Procedure code sheet has the one mobile search field the design
  draws (48px, radius `ctl`, `neutral.bg` fill): the Lists search field uses that anatomy.
- `docs/design/Mobile Availability.dc.html`: the date strip and day cells, the pattern for the
  calendar's day cells and today marker.
- `docs/design/Web Availability.dc.html`: the "Search name" pill input with its leading search glyph
  (built in `AvailabilityGrid.tsx`), the pattern for the web search field; and the cell anatomy for
  the web month grid's List blocks.
- `docs/design/Web Dashboard.dc.html`: the week strip's AM and PM blocks and the "✓" completed marker,
  reused for the submitted marker on the strip and in the web month cells.
- `docs/design/Design Language.dc.html`: tokens. Teal is the only action colour (the calendar button,
  Today, the result links, the "earlier Lists" hint); crimson never appears in the calendar, the main
  view's markers or the search (today is marked as the week strip marks it, not with a crimson fill);
  List blocks keep their status colours; mono tabular numerals for dates, NHIs and invoice numbers;
  `sheet-in` motion for the calendar sheet.
- No mockup draws a scroll-back main view, a month calendar of work or a search result list. Extend the
  Forward Lists list, Phase 29's month grid and the List row; do not invent new chrome.

**Catalogue items:** the covered and context files above. US-07.4.1 and US-07.2.1 carry images from
the old behaviour (see Catalogue screenshots); US-03.1.6, US-03.1.7, US-07.4.2 and FT-07.4 have none.

**Analysis files:**

- `docs/prototype-build/catch-up/GAP-ANALYSIS.md`: Summary theme 9 ("Past work, review and
  anaesthetist app polish"), the EP-03 rows for US-03.1.6 (Partial) and US-03.1.7 (Missing), the EP-07
  rows for FT-07.4, US-07.4.1, US-07.4.2 (all Partial) and US-07.2.1 (Partial), and the DM-39 row.
- `docs/prototype-build/catch-up/epics/EP-07.md`: the FT-07.4, US-07.4.1, US-07.4.2 and US-07.2.1
  entries (the web default range, the missing web marker, the past completed ACTIVE List that falls
  through the mobile filters); `epics/EP-03.md`: the header's note that the seed needs older billed
  Lists, and the US-03.1.6 and US-03.1.7 entries.
- `analysis/domain-model-delta.md` DM-39 (last sentence) and DM-17;
  `analysis/prototype-map-apps-mobile-web.md` (Forward Lists "No search, no date picker", Lists,
  "Billed = gone", and section 8 "Not present in these apps"); `prototype-map-store-seed.md` (selectors,
  the history seed, the canvas horizon); `prototype-map-shell-demo-pwa.md` (routes and `pwa/main.tsx`).

**Code entry points** (paths under `aa-prototype/src/`, except `pwa/main.tsx` and `visual/*.spec.ts`,
which sit under `aa-prototype/` itself; line numbers from `60e2d1e`; phases 15 to 38 will have moved
them):

- The exit: `store/selectors.ts` (`isListBilled` 118, the one `billedAtISO` read for the anaesthetist
  views; `isBackdropList` 141; `billedLists` 149; `invoicesForList` 156, which no anaesthetist screen
  shows today); `store/billingRun.ts` (~251 to 262, the stamp); `store/officeStandIn.ts` (also reads
  `isListBilled`; leave it).
- Clock and canvas: `domain/clock.ts` (`HORIZON_PAST_DAYS` 86, 14 days; `HORIZON_FUTURE_MONTHS` 88;
  `horizonFor` ~100) and 28's `scheduleHorizon`; `store/clockActions.ts` (`rollCanvasForward`,
  append-only: it never prunes past dates); `store/mastersActions.ts` (Add anaesthetist's canvas fill)
  and 30's repopulate path.
- History seed: `domain/seed/history.ts` (`ACCOUNTS` ~92 to 118, 13 Souter accounts from 18 Mar to
  30 Jun 2026, one AM List and one Booking each, `state: 'AUTHORISED'` and `billedAtISO` at ~203 to
  206; ids `L-HIST-nn`, `HBK`, `HP`, `HINV`, `HBC`, `XRH`/`XPH`, `PMTH`, `RCTH`, `DSBH`);
  `domain/seed/billing.ts` (`buildSeedBillingSlice`); `domain/seed/index.ts` (merges the history);
  `domain/seed/patients.ts` (`PAT`, the pinned rows, `genericPatientIds()`); `domain/seed/seed.test.ts`.
- Repeat patients for the search beat: Sarah Mitchell (`PAT.mitchell`, CQY9304) has backdrop `oa07`
  (Souter, 14 Apr), a live Souter Booking on Mon 27 Jul and a Booking on **Dr Sharma's** Tue 14 Jul
  List; Wiremu Tane (ZBC1123) has `oa01` (26 Jun) and a design-day PM Booking; Alan Prentice has `oa04`
  (4 Jun, ACC) and the Mon 20 Jul PM St George's Booking whose two invoices S3 Beat 1 raises live; Noah Prescott
  (`PAT.provisional`) has no NHI (Souter, Mon 27 Jul).
- NHI: `domain/nhi.ts` (`validateNhi` ~54, `CURRENT_SHAPE` and `NEW_SHAPE`, the normalisation).
- Mobile: `apps/mobile/screens/ForwardListsScreen.tsx` (the `mine` filter ~62 with `!isListBilled`,
  `inWindow` ~70 to 80 where Week and Month refuse dates before today, `toRow`, the filter chips, the
  `mobile-lists-scroll` scroller under a fixed header); `apps/mobile/routes.tsx` (`MobileListsRoute`,
  the `seen` ref, `backToLists` and `backToList`, the `SlideStack` layers, the home layer always
  mounted); `apps/mobile/navigation.ts` (`listsStackLocation`); `apps/mobile/MobileApp.tsx`
  (`showTabBar`); `apps/mobile/screens/ListDetailScreen.tsx`; `apps/mobile/screens/BalancesScreen.tsx`;
  `shared/schedule/ListRow.tsx` (`doneUnbilled` and `toFinish` right-hand kinds, ~44 to 60);
  `shared/surface/BottomSheet.tsx`; `shared/capture/ProcedurePickerSheet.tsx` (Phase 19's two-tab picker, which replaced `CodePickerSheet.tsx`: its one search input is the anatomy to copy);
  `pwa/main.tsx` (the PWA reuses `MobileListsRoute`, so no route change there).
- Web: `apps/web/screens/ListsScreen.tsx` (the From and To date inputs ~36, the `!isListBilled`
  filter ~63, the table and its Status column, `Th`, `Td`); `apps/web/components/WeekStrip.tsx`
  (`slotFor` ~40 with `!isListBilled`, the block labels); `apps/web/screens/DashboardScreen.tsx` (the
  day summary's `billedAtISO === undefined` filter); `apps/web/screens/ListDetailView.tsx` (the
  "Submitted to office" pill ~277); `apps/web/routes.tsx` (`WebListsRoute`, `WebListDetailRoute` with
  `onBack` to `/web/lists`, `WebBookingDetailRoute`); `apps/web/screens/AvailabilityGrid.tsx` (the
  "Search name" input); `apps/web/components/Panel.tsx`; `apps/web/WebApp.tsx` (`tabForPath`).
- Admin reference only: `apps/admin/components/RightRail.tsx` (`MiniCalendar`: Monday-first grid,
  arrow, Home, End and PageUp keyboard handling), the keyboard model to copy if 29 did not build one.
- Tests and shots: `pwa/pwaPurity.test.ts`, `domain/domainPurity.test.ts`,
  `shared/demoTriggers/demoTriggers.test.ts` (`office-authorises-list`, PWA only on List and Booking
  detail), `visual/routing.spec.ts`, `visual/mobile-interactions.spec.ts`,
  `visual/mobile-insets.spec.ts`, `visual/pwa-device.spec.ts`, `visual/web-phase05.spec.ts`.

## Work items

Domain and seed first, then selectors, then UI. Keep the three commands green after each group.

### Session 1: the exit, the seed, the selectors and the main view

1. **One exit predicate and one progress label** (`src/domain/listProgress.ts`, pure, exported from
   `src/domain/index.ts`; US-07.4.1, US-07.4.2, US-07.2.1, FT-07.4).
   - `hasLeftMainView(list)`: true once the List has been finalised and sent through to invoicing,
     today `list.billedAtISO !== undefined` (the billing run's stamp at the office's authorise). Its
     doc comment cites OQ-31 and US-07.4.1's Verify note and says that a different exit moment is a
     change here only. `isListBilled` in `store/selectors.ts` stays for the office stand-in and the
     admin, delegating to it; no anaesthetist screen reads `billedAtISO` or `isListBilled` directly
     after this phase (grep proves it).
   - `listProgress(list, activeBookings, todayISO)`: one of `toFinish` (ACTIVE, dated today or earlier,
     with an incomplete Booking), `readyToSubmit` (ACTIVE, every Booking complete), `doneUnbilled`
     (SUBMITTED, or AUTHORISED and not yet left the main view), `invoiced` (left the main view, seen
     only in the archive and search) or `upcoming`. `LIST_PROGRESS_LABEL` is the one label source:
     "Done · unbilled" (the existing mobile wording; US-07.2.1's "completed, unbilled"), "Invoiced",
     "To finish", "Ready to submit". The mobile `ListRow` right-hand kinds, the web table, the week
     strip, the calendar and the search rows all read it.
   - Vitest (`listProgress.test.ts`): each state, the past completed ACTIVE List (`readyToSubmit`),
     an AUTHORISED List before its billing run (`doneUnbilled`), a billing failure that leaves no stamp
     (still on the main view), deterministic.

2. **Search as a pure module** (`src/domain/bookingSearch.ts`, exported from `src/domain/index.ts`;
   US-03.1.7). Pure, no store or React imports (`domainPurity.test.ts` holds).
   - `parseBookingQuery(raw)` returns `{ kind: 'empty' }`, `{ kind: 'tooShort' }` (fewer than two
     letters or digits), `{ kind: 'nhi', nhi }` or `{ kind: 'name', tokens }`. A query whose
     spaces-removed, uppercased form fits the current or new NHI shape (reuse `validateNhi`'s
     normalisation and shape test; do not duplicate the regexes) is an NHI query, matched exactly,
     whether or not its check digit passes, so a mistyped NHI finds nothing rather than erroring.
     Anything else is a name query.
   - `foldName(s)`: lower case, Unicode NFD with combining marks removed, the ʻokina and apostrophes
     removed, runs of spaces and hyphens collapsed. So "faaoso" matches "Faʻaoso" and "maori" matches
     "Māori".
   - `patientMatches(query, patient)`: an NHI query matches `patient.nhi` exactly; a name query matches
     when **every** folded token is a substring of the folded name ("sar mit" and "mitch" both find
     Sarah Mitchell). A patient with no NHI is found by name only.
   - Vitest (`bookingSearch.test.ts`): both NHI formats, with and without spaces and in lower case; a
     seven-character name ("Prescot") is a name query; one- and two-token partial names; accent and
     ʻokina folding; no NHI on the patient; "a" is `tooShort`; two calls deep-equal.

3. **Several months of browsable history** (`domain/seed/history.ts`, or wherever Phase 36 left the
   backdrop builder; US-03.1.6 "a day months in the past", "including ones already invoiced").
   - Give the account rows a `listKey` and a `session`, so several accounts share one List (today one
     account is one List, one Booking, AM). Existing accounts get `listKey` equal to their own key and
     `session: 'AM'`, so **every existing id, invoice number, amount and date is unchanged**
     (`L-HIST-01` to `L-HIST-13`, `AA-2026-H01` to `H13`, the `oa02` missed webhook, Mitchell's prior
     balance, Riley's archived contact).
   - Append, after the existing rows, a hand-written table (no RNG draws, so no other seed stream
     shifts) of about **12 new Lists with 2 to 4 Bookings each (about 30 Bookings)**, Monday 12 January
     to Friday 27 March 2026, AM and PM, at Souter's usual hospitals (St George's, Southern Cross,
     Christchurch Private Hospital) with their surgeons. Each Booking is built **through the same
     builder the existing backdrop uses, in the shapes the earlier phases left** (never a second copy
     of the pricing shapes, which stay in `src/domain/billing`): one or two Procedures each with a
     procedure from 19's list and its RVG code, one Contract (No contract (RVG) or a holder-fit
     Contract, 20), a payer on the Booking (21), source wording where the channel gives one (20a), the
     pricing snapshot written at authorise (25), and at least one ACC account. So an invoiced Booking
     opened from the archive shows a complete "what I entered". No two backdrop Lists share a date and
     session: Wed 18 March AM is already `L-HIST-08` (`oa08`). The new Lists take the same `slotId` and
     `kind` the existing backdrop Lists got in Phase 28 (no Slot record), are AUTHORISED and carry
     `billedAtISO`.
     Patients: Sarah Mitchell once more (on the pinned 13 March List below, so a search for her returns
     March, April and her upcoming July Booking), Wiremu Tane and Coral Bennett once each, the rest from
     `genericPatientIds()` by fixed index.
   - Pin one of them as the demo day: **Fri 13 March 2026, AM, St George's, three Bookings**, one of
     them Sarah Mitchell's. Export its date and List id as `SEED_LOOKBACK` (`{ dateISO, listId }`) from
     `domain/seed/index.ts` beside `SEED_LIST_IDS`, for the tests, the shots and the guide.
   - **Money stays where it is.** Every new account is `paid`, received and disbursed **before 1 April
     2026**. So nothing new is outstanding (38's outstanding list, Awaiting collection, Balances and the
     S3 and S4 figures do not move), and no current GST period changes; earlier periods of 38's GST
     schedule gain rows and its balance check still passes. Collected and Paid out to date rise by the
     new totals: they are derived, so check that no test, guide line or Control Panel text pins them,
     and update any that does.
   - New ids continue each namespace from the existing seq (`L-HIST-14` on; Bookings, Procedures,
     invoices, ledger legs and Xero rows likewise), through the same builder, so Phase 36's ledger
     seeding, its one-payable-leg-per-receivable parity test and 38's GST balance check cover them with
     no special case. Phase 16's BCTI count gains January to March BCTIs; no seeded AA fee invoice is
     for those months, so assert that the seeded fee invoices and their totals are unchanged.
   - The audit seeding (`seed/audit.ts`) gives the new Bookings the same short history the existing
     backdrop Bookings have.
   - Seed tests (`seed.test.ts`): two builds deep-equal; every existing backdrop id and amount is
     unchanged (pin `L-HIST-07`, `AA-2026-H07` and its total); the new Lists all fall before the canvas
     start, are AUTHORISED and `hasLeftMainView`, carry 2 to 4 Bookings each with a Contract, a payer
     and a snapshot on every Procedure, and all their accounts are settled before 2026-04-01; Souter
     has backdrop Lists in each month from January to June.
   - **Bump `PERSIST_VERSION` by one** with a comment line ("Phase 38a: browsable history January to
     March 2026") and extend `persistMigrate.test.ts` only if the shape changed (it should not).

4. **Main-view, look-back and search selectors** (`store/selectors.ts`, or a new `store/lookback.ts`
   re-exported from `store/index.ts`; PWA-safe; arrays derived with `useMemo` in components, as the
   selectors file's header asks).
   - `mainViewFor(state, anaesthetistId, todayISO, forwardToISO)`: `{ earlier, upcoming }`. `upcoming`
     is 28's Slot views from today to `forwardToISO` (booked Lists, Free and Holiday rows, as the
     forward view shows them today), less any List that `hasLeftMainView`. `earlier` is every List of
     the anaesthetist dated before today that has not left the main view **and holds at least one
     active Booking**, at any distance back (not bounded by the canvas start), Lists only (no Free,
     Holiday or Unavailable rows), oldest first. A Draft List (no anaesthetist), a List moved to a
     colleague and a backdrop List never appear. The Booking rule is a plan reading, logged for the
     owner: at `60e2d1e` the seed holds twelve past Souter Lists from 7 to 16 July (recurring private,
     public and pre-op Lists, ACTIVE after 15b) with no Bookings; nothing will ever invoice them, so
     without the rule they would sit on the main view for good. They stay reachable from the
     calendar. With the rule, the earlier group at the demo's today is exactly Mon 20 Jul AM and PM.
   - `lookbackBoundsFor(state, anaesthetistId)`: `{ firstMonthISO, lastMonthISO }`, the month of the
     anaesthetist's earliest List (January 2026 for Souter after item 3) to the month of the schedule
     horizon's end.
   - `listsMonthFor(state, anaesthetistId, monthISO)`: for each date of the month, the anaesthetist's
     Lists by session (`listId`, session, `kind` or status key for the colour, hospital short name,
     active Booking count, and `listProgress`). It reads **Lists, not Slots**, because the backdrop
     Lists have no Slot record (Phase 28) and this calendar is about work, not availability. Free,
     Holiday and Unavailable sessions are not shown; that is Phase 29's calendar.
   - `listsOnDayFor(state, anaesthetistId, dateISO)`: the Lists on one date, AM before PM, including
     backdrop and invoiced Lists, each with its Bookings (patient name, NHI or the app's NHI-missing
     label, scheduled time, the primary Procedure's procedure name first) for the web rail.
   - `searchBookingsFor(state, anaesthetistId, rawQuery, todayISO)`: `{ query, upcoming, past, total }`.
     Rows are the anaesthetist's own non-cancelled Bookings (the List's `anaesthetistId` is the persona;
     a List or Booking 32 or 32a moved to a colleague is theirs, not the persona's) whose patient
     matches item 2, each with `bookingId`, `listId`, date, session, patient name, NHI, hospital short
     name, the Procedures' names (primary first), the List's `listProgress` and its warning count
     (15a). `upcoming` (today and later) is soonest first; `past` is most recent first; at most 50 rows
     in all, `total` the full count.
   - `invoicesForListView(state, listId)`: the invoices raised for a List (number, party, issue date,
     total, paid state), backdrop invoices included when the List itself is a backdrop List, for the
     billed List detail in item 8. The office surfaces keep excluding backdrop invoices.
   - Vitest: `mainViewFor` at the demo's today puts exactly Souter's Mon 20 Jul submitted Lists in
     `earlier` (not the empty 7 to 16 July Lists) and no backdrop List anywhere; after the office authorises one of them (the billing run stamps it),
     it leaves `earlier` and `searchBookingsFor` still finds its Bookings; a past completed ACTIVE List
     is in `earlier`; a Draft List and a List moved to a colleague are absent. Mitchell by "mitchell"
     and by "CQY9304" returns her March, April and July Souter Bookings and never her Sharma Booking;
     "tane" finds Wiremu Tane; Noah Prescott is found by name; a cancelled Booking is never returned;
     upcoming and past order; the 50-row cap with the true total; `listsMonthFor` for March 2026 shows
     the new history Lists and for July 2026 the canvas Lists; `lookbackBoundsFor` runs from January
     2026 to the horizon's month at the demo's today; all deterministic.

5. **History survives the clock and the canvas** (a risk this phase owns).
   - Read `rollCanvasForward` (append-only) and every path that regenerates or repopulates Lists:
     Phase 30's recurring-booking edits, Phase 29's series apply, Add anaesthetist
     (`mastersActions.ts`), 28's horizon change and any holiday reconcile. Each must be bounded to
     today or the canvas horizon, never to dates before it, and must skip `isBackdropList` Lists.
   - Vitest (`store/lookback.test.ts`): after "Next morning", a 30-day clock jump, a recurring-booking
     edit (30) and a series save (29), every backdrop List, Booking and Procedure deep-equals the seed;
     canvas Lists that fall behind the canvas start as the clock advances are still there, still in
     `mainViewFor`'s `earlier` while not invoiced, and still reachable through `listsMonthFor`; Reset
     restores the seed.

6. **Mobile main view: starts at today, scroll back** (`ForwardListsScreen.tsx`; US-07.4.2,
   US-07.4.1, US-07.2.1, US-15.0.2).
   - Rows come from `mainViewFor`. The list in `mobile-lists-scroll` has an **"Earlier, not yet
     invoiced"** group (day headings, oldest first) above a **"Today"** heading, then the upcoming
     days. On first mount, and when a filter chip changes, the scroller is positioned so the Today
     heading sits at its top; scrolling up reveals the earlier Lists. Popping back from List or Booking
     detail keeps the scroll position (the home layer stays mounted). When `earlier` is not empty, a
     one-line teal text button under the Today heading reads "2 earlier Lists not yet invoiced" with an
     up chevron and scrolls them into view (`data-shot="mobile-main-view-earlier"`); with none, nothing
     shows.
   - **Filters.** Week and Month bound the forward part only (today to +7 and +31 days); the earlier
     group shows under both. To-Do shows ACTIVE Lists with an incomplete Booking, earlier ones
     included; Done shows `doneUnbilled` Lists. A past completed ACTIVE List now shows in the earlier
     group with "Ready to submit". Invoiced Lists appear under no chip.
   - Row markers come from `listProgress` and `LIST_PROGRESS_LABEL`: the existing "Done · unbilled"
     tick cluster, "To finish" with its count, "Ready to submit". A SUBMITTED List opens read only, as
     today.
   - Empty copy: "No Lists from today in this window." (Week, Month), "Nothing left to finish.",
     "No submitted Lists waiting to be invoiced." (Done).
   - The PWA reuses `MobileListsRoute`, so it gets the same main view; check it in the PWA build's
     insets.

7. **Web main view and the submitted marker** (`ListsScreen.tsx`, `WeekStrip.tsx`,
   `DashboardScreen.tsx`; US-07.4.2, US-07.2.1, US-03.1.4).
   - **Lists page.** The From date input goes. The table opens with an **"Earlier, not yet invoiced"**
     group row and its Lists (oldest first), then a **"From today"** group row and the upcoming Lists to
     the To bound (the To input stays, default today +28 days, a desktop date input as now). So
     Monday's submitted Lists show on Tuesday without touching a control (US-07.2.1's gap). A new
     **Progress** column carries `LIST_PROGRESS_LABEL` beside the session StatusChip ("Done · unbilled"
     with the "✓", "To finish", "Ready to submit"), and a SUBMITTED row still drills into its read-only
     List detail.
   - **Week strip** (dashboard): blocks for a `doneUnbilled` List carry the design's "✓" and the label
     as their accessible name ("Mon 20 Jul AM, Forte Health, Done · unbilled"); invoiced Lists stay off
     the strip, as now, through `hasLeftMainView` rather than `isListBilled`. Previous week still
     reaches earlier un-invoiced Lists.
   - **Dashboard day summary**: reads `hasLeftMainView` in place of its own `billedAtISO` filter; no
     visual change.
   - The web app stays desktop width (min-width 1240); no responsive work.

8. **What an invoiced List shows** (both apps; US-03.1.6 "see what they entered", OQ-31 "look at old
   invoices").
   - List detail on mobile and web gains, for a List that has left the main view, a read-only
     **Invoices** section from `invoicesForListView`: each invoice's number (mono), party, issue date,
     total and paid state, with the existing invoice view link where the anaesthetist app has one.
     A `doneUnbilled` List shows nothing new.
   - Booking detail for an invoiced Booking shows what was entered, read only: the three-part
     Procedure stack (20a), modifiers and their explanations, times, the payer (21), the warnings
     (15a). Fix any reader that assumed an anaesthetist never sees an invoiced or backdrop List (a
     missing `startTime` showing a raw "undefined", a Slot lookup on a List with no Slot record).
   - A billed List stays read only everywhere: no add, capture or edit control appears, and the store's
     `editRefusal` still refuses. 38b, 39 and 39b later add their own actions here (handoff).

### Session 2: the archive, the search and the finish

9. **A shared month grid** (`src/shared/calendar/MonthGrid.tsx`, PWA-safe). If Phase 29 extracted a
   month grid, reuse it and add only what is missing; if it built screen-local grids, extract their
   common part here and point 29's screens at it (no visual change to them).
   - Monday-first seven columns, a month title with previous and next controls bounded by
     `lookbackBoundsFor`, a **month and year jump** (tapping the title opens a year stepper over twelve
     month chips; on web a compact popover with the same content), and a **Today** text button.
   - A `renderDay(dateISO)` slot so each app draws its own cell; the grid owns layout, bounds, today's
     marker and keyboard movement (arrows, Home, End, PageUp and PageDown, as `MiniCalendar`).
   - Every day is a real `<button>` with an accessible label ("Friday 13 March 2026, 1 List,
     invoiced"); days outside the bounds are inert.

10. **Mobile: calendar archive and search on the Lists tab** (`ForwardListsScreen.tsx`, `routes.tsx`,
    `navigation.ts`; US-03.1.6, US-03.1.7, US-07.4.1's third criterion, US-15.0.2).
    - **URL state.** The home layer reads `?day=YYYY-MM-DD` and `?q=` from the URL. `MobileListsRoute`
      remembers the home layer's search string beside its `seen` ids, and `backToLists` and
      `backToList` restore it, so a pop from List or Booking detail returns to the same day or the same
      results. Drill-ins stay pushes. Per the 2026-07-27 routing ruling, `?q=` and `?day=` are view
      state written with `replace`, and the calendar sheet's open state stays local `useState`, never
      in the URL. A junk `?day=` is ignored through `isISODate` (`shell/routeParams.ts`).
      `pwa/main.tsx` needs no change.
    - **Header row.** Under the greeting, a search field in the Procedure code sheet's anatomy (48px,
      radius `ctl`, `neutral.bg`, a leading search glyph, placeholder "Search patient name or NHI", a
      clear button when not empty), and to its right a 48px square teal-outline calendar button
      (lucide `CalendarDays`, label "Go to a day"). The filter chips stay below. The header stays fixed
      above the scroller, so the Today anchor of item 6 is unaffected.
    - **Calendar sheet** (`BottomSheet`, `data-shot="mobile-lookback-calendar"`): `MonthGrid` with each
      day cell showing its date numeral (mono) and two small half-bars, AM over PM, in the List's status
      colour where a List sits, with a small tick where the List is invoiced, blank where none. The
      sheet opens on the month of `?day=` or today. Tapping a day closes the sheet and sets `?day=`.
    - **Day view.** With `?day=` set, the filter chips are replaced by one teal day chip
      ("Fri 13 Mar 2026" with a close glyph) and the list shows that date's rows: for a date inside the
      canvas, the main view's row builder for that date (so Free and Holiday rows read as they do in
      Week), plus any invoiced List on it; for an earlier date, its Lists only. Invoiced rows carry the
      "Invoiced" marker. Empty: "No Lists on this day." Closing the chip clears `?day=` and returns to
      the last filter, at the Today anchor.
    - **Results view** (`data-shot="mobile-lookback-search"`). With two or more characters typed, the
      sections are replaced by results: an "Upcoming" and a "Past" heading (micro-caps), each row a
      `ListRow`-anatomy button with the patient name as the title, "Fri 13 Mar · AM · St George's ·
      Knee arthroscopy" as the subtitle, the NHI in mono on the right (or the NHI-missing label), the
      `listProgress` marker and the warning triangle where they apply. Tapping opens
      `/mobile/lists/:listId/bookings/:bookingId` (depth 2; the List layer mounts from the URL, so back
      goes to the List, then to the results). Above the rows, one line: "3 Bookings for Mitchell" or,
      past the cap, "Showing 50 of 64. Add more of the name or the NHI." Empty: "No Bookings match. Try
      part of the name or the full NHI." No debounce at seed scale; filter on every keystroke through
      `useMemo`.
    - Search and day view are exclusive: typing clears `?day=`; picking a day clears `?q=`.
    - The tab bar stays visible on the home layer (depth 0) in all states.
    - Mobile-first throughout: a bottom sheet, chips and a full-width field; no native date input, no
      centred modal, nothing below 44px tap height.

11. **Web: Calendar view and search on the Lists page** (`ListsScreen.tsx`, `routes.tsx`; US-03.1.4,
    US-03.1.6, US-03.1.7).
    - **URL state.** `/web/lists?view=calendar&month=2026-03&day=2026-03-13` and `/web/lists?q=mitchell`.
      A Segmented control **Lists | Calendar** sits in the title row (`?view=` absent or `lists` is the
      main view of item 7, `calendar` the archive). Unknown values fall back to the main view, and a
      junk `?day=` or `?month=` falls back to today through `isISODate`. All are written with
      `replace`, as the 2026-07-27 routing ruling has it for view state; only drill-ins push.
    - **Back returns to where you were.** Drill-ins from the Lists page pass
      `state: { from: pathname + search }`; `WebListDetailRoute` and the Booking detail route's back use
      it, falling back to `/web/lists` (and to the List for Booking detail) when absent, so a refresh or
      a deep link still works.
    - **Header.** The title row gains the search field on the right, in the "Search name" pill anatomy
      widened to 280px (placeholder "Search patient name or NHI"), beside the Segmented.
    - **Calendar view** (`data-shot="web-lookback-calendar"`): a two-column layout inside the 1320px
      content width: `MonthGrid` in a `Panel` (each day cell shows up to two List blocks, AM over PM, in
      the week strip's block anatomy: status colour bar, hospital short name, the "✓" for done Lists, a
      small "Invoiced" tag for invoiced ones) and a 340px right rail for the picked day: the date
      heading, then each List as a card (session, times, hospital and surgeon, its `listProgress`
      marker) with a "View List" link, and under it its Bookings as rows (time, patient, NHI in mono,
      primary Procedure) linking to Booking detail. Empty rail: "Pick a day to see its Lists."
    - **Search results** (`data-shot="web-lookback-search"`): while `?q=` has two or more characters,
      the table area shows a results table in the Lists table's anatomy (`Th`, `Td`): Date, Session,
      Patient, NHI (mono), Hospital, Procedure, Progress and the warning triangle; Upcoming rows first
      then Past, separated by a group row; each row opens Booking detail. The count line and the empty
      and capped copy match mobile. A "Clear search" text button returns to the previous view.

12. **Drill-down checks** (both apps). Open an invoiced canvas List (after the S3 authorise) and a
    backdrop List from the calendar and from search on mobile and web: List detail, its Invoices
    section, Booking detail with its stack and Procedures render with no missing-data placeholders,
    read only, and back returns to the day or the results.

13. **Tests and shots.**
    - Component tests: `ForwardListsScreen` at the demo's today renders the earlier group with
      Mon 20 Jul's "Done · unbilled" Lists above Today and positions the scroller at Today; the hint
      scrolls to them; Done lists them; with `?day=2026-03-13` it shows that day's invoiced history
      List; typing "mitch" shows three rows in Upcoming and Past; tapping a result navigates to the
      Booking route; closing the day chip restores the filter. `ListsScreen` main view shows the
      earlier group and the Progress column with no date set; the Calendar view fills the rail on
      13 March; a search for "CQY9304" lists the same three Bookings; Clear search restores the view.
      `WeekStrip` labels a submitted block "Done · unbilled". List detail shows the Invoices section for
      an invoiced List only.
    - A `MonthGrid` test: bounds disable previous on January 2026 and next on the horizon's month; the
      month and year jump lands on the chosen month; arrow keys move focus; the accessible labels count
      Lists and say invoiced.
    - Playwright: a new `visual/lookback.spec.ts` with the `data-shot` hooks (mobile main view with the
      earlier hint, mobile calendar sheet on March 2026, mobile results for "Mitchell", web Lists main
      view with the earlier group, web Calendar with 13 March picked, web results); a routing case in
      `visual/routing.spec.ts` (`/web/lists?view=calendar&day=2026-03-13` loads the rail; back from List
      detail returns to it; `/mobile/lists?day=2026-03-13` back from a List returns to the day). Keep
      `mobile-insets.spec.ts`, `mobile-interactions.spec.ts` and `pwa-device.spec.ts` passing (the
      search row, the hint and the sheet respect the insets and the `DockSpacer` rule).

14. **Copy and comment sweep.** Update the header comments of `ForwardListsScreen.tsx`,
    `ListsScreen.tsx` and `WeekStrip.tsx` (the main view: today onward plus earlier un-invoiced Lists;
    invoiced Lists via the archive and search, OQ-31), the `isListBilled` comment (delegates to
    `hasLeftMainView`; the office reads it), and the `isBackdropList` comment (backdrop Lists are now
    browsable from the calendar and search, still excluded from office surfaces and from the main
    view). Leave `analysis/prototype-map-apps-mobile-web.md` as it is: it is the plan-time snapshot.
    No en or em dash in any new string; ranges read "January to March".

## Demo triggers

**None new.** Several months of seeded history for Dr Souter, invoiced Lists included, make the
scroll-back, the archive and the search demoable through normal use on every surface: the seed's
Mon 20 Jul submitted Lists sit in the earlier group on Tue 21 Jul; open the calendar, jump to March,
pick a day; or type "Mitchell" or "CQY9304".

The one beat that waits on the office, a List leaving the main view once invoiced, already has its
controls: in the framed build the office authorises it on Admin Review (S3 Beat 1), and on the PWA the
existing sheet entry **"Office authorises this List"** (Phase 14, `office-authorises-list`, PWA only on
List and Booking detail) bills it, after which the List is gone from the main view and found by search
or its day. No new button and no new PWA stand-in; the Control Panel page gains nothing. If the
registry's audit (Phase 44) wants a jump, the Direct URLs below are enough.

## Out of scope

- The Admin App: no office calendar of past work and no office search across anaesthetists (the
  stories name the anaesthetist app; the drift check stops if that changes).
- Moving the exit trigger away from the billing run's stamp (US-07.4.1 Verify; one predicate holds it).
- A "Done · billed" row on the main view: invoiced Lists leave it (OQ-31).
- Events, the additional invoice and the credit note on an invoiced Procedure (Phases 38b, 39 and 39b
  add them on the Booking detail reached here), and any edit of a billed or backdrop Booking.
- A patient record or patient view, merging patients, the missing-NHI problem list (Phase 40) and NHI
  lookup against the register (Phase 40a). The "three-way match" (name, date of birth, NHI) Greg
  mentioned and did not take further.
- Search by anything other than NHI or patient name (surgeon, hospital, procedure, invoice number,
  date of birth), fuzzy or sound-alike matching, recent searches, and cancelled Bookings.
- History for any anaesthetist but Dr Souter, history before January 2026, and unpaid or part-paid
  new history accounts.
- Changing the canvas horizon (`HORIZON_PAST_DAYS`, 28's horizon setting) or rolling it backwards.
- Draft Lists (no anaesthetist; Phase 31) and Lists or Bookings moved to a colleague (they leave the
  persona's views and results by design).
- Availability statuses in the archive calendar (Phase 29's My calendar shows them).
- Search at full scale and its timings (Phase 43).

## Manual test checklist

The agent runs every item itself in the running app and reports it with evidence; none is handed
to the owner (ROADMAP.md "Owner review: agents test themselves").

- [ ] Reset. Mobile → Lists: the view opens at the Today heading; the hint "2 earlier Lists not yet
      invoiced" shows; scrolling up (or the hint) reveals Mon 20 Jul AM and PM with "Done · unbilled".
      Week, Month, To-Do and Done work; Done lists the Mon 20 Jul Lists; no backdrop List and none of
      the empty 7 to 16 July Lists appears.
- [ ] Complete every Booking on a past ACTIVE List without submitting (or find one in the seed): it
      shows in the earlier group as "Ready to submit".
- [ ] Web → Lists (no date touched): the "Earlier, not yet invoiced" group shows Mon 20 Jul's Lists
      with "Done · unbilled" in the Progress column; the From input is gone; opening one is read only.
      Dashboard week strip: Mon 20 Jul blocks carry the tick and the label.
- [ ] Admin → Review → authorise Mon 20 Jul PM (S3 Beat 1): on web and mobile it leaves the main view
      and the week strip; its invoices show in 38's outstanding list (note if it is the next day). On
      the PWA, the "Office authorises this List" sheet does the same for a submitted List.
- [ ] Search "Prentice" on mobile and web: the just-invoiced Mon 20 Jul Booking and the June ACC
      Booking show, marked "Invoiced". Open the Mon 20 Jul one: Booking detail shows the stack, payer
      and modifiers read only; back to its List shows the Invoices section with the S3 invoice numbers.
- [ ] Tap the calendar button: the sheet opens on July 2026 with today marked and half-bars on days with
      Lists, Mon 20 Jul now ticked as invoiced. Tap the title, pick 2026 and March: March shows the new
      history Lists. Previous stops at January 2026; next stops at the horizon's month.
- [ ] Pick Fri 13 Mar: the sheet closes, the day chip shows and the day's List reads "Invoiced". Open
      it: List detail shows its Bookings, read only, and its "AA-2026-H.." invoices. Open a Booking: its
      Procedure stack and history render. Back twice returns to the same day chip.
- [ ] Close the chip: the last filter returns at the Today anchor. Pick a July canvas day: Free and
      Holiday rows read as they do in Week.
- [ ] Type "mitch": Upcoming shows Mon 27 Jul; Past shows April and March; her Booking on Dr Sharma's
      List does not appear. Type "CQY9304" and "cqy 9304": the same three. Type "Prescott": Noah
      Prescott with the NHI-missing label. Type "zzz9999": the empty copy.
- [ ] Tap a past result: Booking detail opens; back goes to its List, then to the results with the query
      kept.
- [ ] Web → Lists: the Segmented reads Lists and Calendar; the search field sits at the right. Calendar:
      step back to March, pick 13 March: the rail lists the List and its Bookings; "View List" opens List
      detail and Back returns to the calendar on 13 March.
- [ ] Web search "Mitchell": the results table shows the three Bookings with the Progress marker; Clear
      search returns to the previous view. `/web/lists?q=tane` loads with results.
- [ ] Next morning, then a 30-day jump on the clock: March history is unchanged; un-invoiced Lists that
      slid behind the canvas start are still in the earlier group and in the calendar.
- [ ] Web → Accounts: the outstanding list, Awaiting collection and the current GST period are unchanged
      from before this phase (apart from the S3 authorise just done); an earlier GST period shows the new
      history rows and the balance check passes. Admin Billing monitor and Invoices show no backdrop rows.
- [ ] PWA (`npm run dev:pwa`, fresh storage): the Today anchor, the hint, the search row and the
      calendar sheet clear the insets; the main view, calendar, day view, search and back behave as in
      the framed build.
- [ ] Keyboard: the web month grid moves with the arrows; every day and result is reachable by Tab and
      has a readable label.
- [ ] No en or em dashes in any new string; teal the only action colour; no crimson in the main view's
      markers, the calendar or the results; no "Provisional" pill.
- [ ] Catalogue screenshots: the recipes for US-07.4.2, US-07.4.1, FT-07.4, US-07.2.1, US-03.1.6 and
      US-03.1.7 are created or updated, any recipe this phase broke is re-pointed, a full
      `npm run capture` ends with no failed recipe and no story without a recipe, the covered items' new
      shots are checked by eye, and `npm run verify:board` is green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots` and `npm run verify:board`
      are all green.

## Demo guide updates

Patch in the same session (`docs/demo-guide/`, the same sections of `master-demo-guide.html`):

- `03-demo-script.md`:
  - **Direct URLs:** add "Lists, main view" `/mobile/lists`, "Lists, one day"
    `/mobile/lists?day=2026-03-13`, "Lists, search" `/mobile/lists?q=Mitchell`, "Lists, calendar"
    `/web/lists?view=calendar&day=2026-03-13` and "Lists, search" `/web/lists?q=Mitchell` (13 March is
    `SEED_LOOKBACK`).
  - **S3 Beat 1** ("authorise and generate invoices"): add to Expected that Dr Souter's Mon 20 Jul
    Lists leave her main view once invoiced, and their invoices show in her outstanding balances.
  - **S3, an optional closing moment** after Beat 3: "Finding past work. On the phone, the Lists tab
    starts at today; scroll up for anything not yet invoiced. Search 'Prentice': Monday's Booking,
    invoiced a minute ago, opens read only with exactly what was entered and its invoices. Then tap the
    calendar, jump to March, open a day's List." Say: "Once the office has finalised a List and sent it
    to invoicing it leaves the main view, but nothing is lost: the archive and search find it, so a
    query about an invoice from three months ago is answered from the phone. It is their own work
    only." Expected: as in the checklist.
  - **S3 discovery points:** replace "the exact List-disappearance trigger (the prototype uses
    billing-run completion)" with "the exact moment a List leaves the main view (answered by AA as
    'finalised and sent through to invoicing'; the prototype uses the billing run at authorise), whether
    the office also needs this search, and whether date of birth joins name and NHI (the three-way
    match)".
  - **S2 Beat 4**: no change to the clicks; if the presenter narrates the anaesthetist side, the
    authorised List stays "Done · unbilled" until its billing run, then leaves the main view.
  - If Phase 38b, 39 or 39b has not run yet, add nothing to S4 Beat 2; they tie their actions to this
    entry point.
- `04-presenter-cheat-sheet.md`: "What each app is for" (Anaesthetist Mobile and Web) gains "a main
  view from today with earlier un-invoiced Lists, and past work by calendar or by patient name or NHI";
  the readiness section's "Built and clickable" replaces "billed-List disappearance (Phase 08)" with
  "the main view, archive and search"; the open-items entry **"2. Exact List disappearance trigger"**
  is rewritten as answered (OQ-31: leaves once finalised and sent to invoicing; the exact moment is to
  verify; the prototype uses the billing run at authorise; old work by archive or search); the
  `SUBMITTED` line reads "anaesthetist sees Done · unbilled until invoiced".
- `02-workflows-and-handoffs.md`: step 6 of the submit workflow ("can still see it as
  completed/unbilled") gains "until it is invoiced, when it leaves her main view and is found by
  archive or search"; a short "Looking back" workflow (main view from today; calendar to day to List
  to Booking; search by NHI or name; own Bookings only; invoiced Lists read only with their invoices).
- `01-personas-and-responsibilities.md`: the `SUBMITTED` line and the anaesthetist's paragraph mention
  the main view and looking back at invoiced work.
- `master-demo-guide.html`: the same passages (the Direct URLs tables, S3 Beat 1's Expected, S3's
  closing moment and discovery callout, the cheat-sheet app cards, readiness list and open item 2, the
  workflow and persona lines).
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
| [US-07.4.2](../../../../requirements-board/requirements/stories/US-07.4.2.md) Anaesthetist's main view | absent · no recipe file | create `recipes/US-07.4.2.json`, status `captured`. Mobile `/mobile/lists`: shot `main-view`, state `today` (the Today heading at the top, highlight `[data-shot=mobile-main-view-earlier]`), state `scrolled-back` (click the hint; highlight the Mon 20 Jul "Done · unbilled" rows). Web `/web/lists`: shot `main-view`, highlight the "Earlier, not yet invoiced" group row and its rows. Captions: "The main view starts at today, with earlier Lists not yet invoiced a scroll back" and "On the web, earlier un-invoiced Lists head the table without changing a date" |
| [US-07.4.1](../../../../requirements-board/requirements/stories/US-07.4.1.md) List leaves the main view once invoiced | captured · mobile list-drops-off (submitted, invoiced), web list-drops-off, list-drops-off-invoiced, invoices-in-balances | captured. **Replace the stale captions** ("Once invoices are generated the List is gone from Done"; "After the office authorises and invoices are generated, Monday's Lists are gone"; the shot-level "List leaves the anaesthetist's view when its invoices are generated" and "List leaves the web Lists table when its invoices are generated", which become "List leaves the main view once the office has finalised it and sent it to invoicing"; the web submitted state's date fill). Mobile `list-drops-off`: keep `submitted` (caption "Submitted and not yet invoiced, the List stays on the main view, Done · unbilled"); `invoiced` caption "Once the office has finalised it and sent it to invoicing, the List leaves the main view"; add a state `found` that types the patient's name in the search field and highlights the result marked "Invoiced" ("Still found by search, with what was entered and its invoices"). Web: the From input is gone, so drop the `fill input[type=date]` steps; `submitted` highlights the earlier group's Mon 20 Jul rows; `list-drops-off-invoiced` shows the main view without them and adds a state at `/web/lists?view=calendar&day=2026-07-20` with the rail listing them as Invoiced. Keep `invoices-in-balances`, pointed at 38's outstanding list route and its "the next day" caption corrected if the invoices now show at once |
| [FT-07.4](../../../../requirements-board/requirements/stories/FT-07.4.md) List visibility in the anaesthetist app | absent · no recipe file | create `recipes/FT-07.4.json`, status `captured`: one web shot of an invoiced List's detail reached from search (`/web/lists?q=Prentice`, click the invoiced row's List), highlighting the Invoices section. Caption: "An invoiced List leaves the main view, its invoices show in balances, and it stays findable" |
| [US-07.2.1](../../../../requirements-board/requirements/stories/US-07.2.1.md) Anaesthetist loses edit access | captured · web submitted-list, read-only-card; mobile done-unbilled, read-only-card; simulator edit-refused | captured. Keep the five shots (the guard console state's `editBooking` and `souter` values may have been renamed by earlier phases; re-point if so). Add a web `lists-marker` shot at `/web/lists` highlighting the Mon 20 Jul rows' Progress cell "Done · unbilled" (caption "Submitted Lists stay on the web Lists table, marked Done · unbilled") and a web `week-strip-marker` shot at `/web` highlighting the Mon 20 Jul blocks (caption "The week strip marks them too"). The mobile `done-unbilled` caption stays |
| [US-03.1.6](../../../../requirements-board/requirements/stories/US-03.1.6.md) Find past work and old invoices | absent · stub, no shots | create the shots in `recipes/US-03.1.6.json` (replace the stub), status `captured`. Mobile `/mobile/lists`: shot `lookback-calendar`, open the calendar sheet (`[aria-label="Go to a day"]`) and highlight `[data-shot=mobile-lookback-calendar]`; a second state taps the title, picks March 2026 and Fri 13 Mar, and shows the day chip with that day's "Invoiced" List. Web `/web/lists?view=calendar&month=2026-03&day=2026-03-13`: shot `lookback-calendar`, highlight `[data-shot=web-lookback-calendar]` with the day rail beside it. A `drill` state on each opens the history List (its Invoices section), then a Booking and its Procedures. Captions: "Calendar jumps to any day back to January 2026", "Pick a past day to see its Lists, then a Booking and its Procedures" and "An invoiced List shows what was entered and the invoices raised" |
| [US-03.1.7](../../../../requirements-board/requirements/stories/US-03.1.7.md) Search Bookings by NHI or patient name | absent · stub, no shots | create the shots in `recipes/US-03.1.7.json` (replace the stub), status `captured`. Mobile `/mobile/lists?q=mitchell` (or fill the search field, placeholder "Search patient name or NHI"): shot `lookback-search`, highlight `[data-shot=mobile-lookback-search]` with the Upcoming and Past headings and the "3 Bookings for Mitchell" line; a state typing the NHI `CQY9304` shows the same three. Web `/web/lists?q=mitchell`: shot `lookback-search`, highlight `[data-shot=web-lookback-search]`, the results table with the NHI and Progress columns. Caption: "Search finds a patient's Bookings by NHI or part of a name, invoiced ones included" |

**Recipes this phase breaks.** `US-07.4.1` (the web `fill input[type=date] >> nth=0` steps: the From
input goes) is re-pointed in the table above. The mobile Lists tab now opens scrolled to Today with the
earlier group above, and gains a search row and a calendar button; the web Lists page gains the earlier
group, a Progress column, a Segmented and a search field. Recipes that start at `/mobile/lists` or
`/web/lists` and click rows by hospital or surgeon text (`US-01.1.1`, `US-01.3.4`, `US-03.1.1`,
`US-07.2.1`, `US-15.0.2`) should still pass, since Playwright scrolls to the row; their new shots show
the new header and scroll position on the next full capture, so look at them once. The `--dry` run is
the check. Recipes that deep-link to `/web/lists/<id>` or `/mobile/lists/<id>` are unaffected.

**ATLAS.md.** Routes: add `?day=`, `?q=` (mobile and web Lists) and `?view=calendar&month=` (web
Lists); note the From input is gone. Personas and IDs / Seed data: the new Dr Souter backdrop Lists, the
pinned `SEED_LOOKBACK` List (Fri 13 Mar 2026), the search examples (Mitchell, `CQY9304`, Prentice,
Prescott) and the Mon 20 Jul Lists as the earlier un-invoiced pair. Existing hooks: the new `data-shot`
hooks `mobile-main-view-earlier`, `mobile-lookback-calendar`, `mobile-lookback-search`,
`web-lookback-calendar`, `web-lookback-search`.

## Adversarial review (after build)

Once the manual test checklist and `npm run build`, `npm run build:pwa`, `npx vitest run` and
`npm run shots` are green, and before writing the PROGRESS entry, run the standard **adversarial
review-and-fix pass (PROGRESS convention 18)**: three independent Opus review subagents, one each for
**quality**, **bugs/correctness** and **plan adherence**, each given the covered catalogue files, this
doc and the diff. This session verifies every finding against the catalogue, this doc and the code,
fixes the confirmed ones (with a test wherever a bug had none), re-greens and records the pass. Do not
re-raise anything settled in the Decisions log.

**Steer this phase's reviewers at:**

- **One exit, one label.** No anaesthetist screen reads `billedAtISO` or `isListBilled` directly;
  `hasLeftMainView` decides membership and `LIST_PROGRESS_LABEL` is the only source of "Done ·
  unbilled" and "Invoiced" on mobile, web, the week strip, the calendar and search. A submitted or
  authorised-not-yet-billed List is on the main view; an invoiced one is not; a billing failure keeps
  it on.
- **Starts at today.** Mobile opens at the Today heading and keeps its scroll on a pop; the earlier
  group is unbounded backwards (not cut at the canvas start) and holds only Lists with a Booking; the web table needs
  no date change to show Monday's submitted Lists; the past completed ACTIVE List no longer falls
  through every filter.
- **Own work only.** The main view, search and calendar return only Lists whose `anaesthetistId` is
  the persona's; hunt for any path (the Sharma Mitchell Booking, a List reassigned in 28 or moved in
  32, a Booking moved in 32a, a Draft List) that leaks another anaesthetist's patient.
- **History is untouched.** No clock advance, canvas roll, horizon change, recurring-booking edit,
  series save, holiday reconcile or Add anaesthetist writes, drops or regenerates a List before the
  canvas start; `isBackdropList` Lists stay out of the office surfaces and of the main view.
- **Money is unchanged.** The new history moves no outstanding figure, no current GST period, no S3 or
  S4 number and no seeded AA fee invoice; the ledger parity and GST balance checks still pass; every
  existing backdrop id and amount is the same; the new Bookings are built through the existing builder
  and the billing module, not a second copy of the pricing shapes.
- **What was entered.** An invoiced Booking opened from the archive or search shows the stack, payer,
  modifiers and its List's invoices, read only, with no placeholder text.
- **Matching.** NHI exact in both formats with spaces and case ignored, reusing `validateNhi`'s
  normalisation; partial names by every token; accent and ʻokina folding; cancelled excluded; the cap
  reports the true total; the module is pure and deterministic.
- **Navigation.** Back from List and Booking detail returns to the same day, results or scroll
  position on both apps, a refresh or deep link still works, the mobile stack's pops keep the home
  query, no nested interactive elements, and the PWA routes are unchanged.
- **Design and copy.** Mobile-first sheet, hint and field, the design's search anatomy, teal-only
  actions, no crimson, status colours only for List blocks, mono dates, NHIs and invoice numbers, no
  "Provisional" pill, no en or em dashes, "Done · unbilled" never "Done · billed".
- **Persistence.** `PERSIST_VERSION` bumped; two fresh seeds deep-equal; no new store slice.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry; ROADMAP.md "Owner review: agents test
  themselves"): the plan readings built (anaesthetist apps only; the NHI-or-name matching rule; history
  from January 2026 for Dr Souter only; a past List with no Bookings left off the main view's earlier
  group, since nothing will ever invoice it), the exit moment kept at the billing run while US-07.4.1 is
  Verify, whether search should also take an invoice number for the "query about an invoice" case, and
  the screens worth a look (mobile `/mobile/lists` scrolled back, `/mobile/lists?q=Prentice`, web
  `/web/lists` and `/web/lists?view=calendar&day=2026-03-13`, as Dr Souter).
- **Status row** for catch-up Phase 38a, and a phase entry with:
  - the drift-check result (items changed or not against `60e2d1e`; whether the Admin App, date of
    birth or invoice numbers came into scope; the exit trigger's wording);
  - what was built, with the name map for later phases: `hasLeftMainView`, `listProgress` and
    `LIST_PROGRESS_LABEL` in `src/domain/listProgress.ts`; `parseBookingQuery`, `foldName` and
    `patientMatches` in `src/domain/bookingSearch.ts`; `mainViewFor`, `lookbackBoundsFor`,
    `listsMonthFor`, `listsOnDayFor`, `searchBookingsFor` and `invoicesForListView`;
    `src/shared/calendar/MonthGrid.tsx` (and whether 29's screens now use it); the `?day=`, `?q=` and
    `?view=` URL state and the back-to-referrer rule; the Today anchor;
  - the history added (Lists, Bookings, months, totals) and the money figures checked unchanged;
  - the `PERSIST_VERSION` bump (from and to);
  - tests added and the before and after Vitest and Playwright counts;
  - the review pass.
- **Catalogue screenshots result:** recipes created (US-07.4.2, FT-07.4, US-03.1.6, US-03.1.7) or
  changed (US-07.4.1, US-07.2.1, any re-pointed), the `capture/REPORT.md` counts (captured, partial,
  absent, failed) before and after, and any partial reason handed to a later phase.
- **Decisions log:**
  1. **Superseded:** the Phase 08 build reading and the 2026-07-22 third external plan review #12
     (M10: billed Lists vanish from every anaesthetist view, with nothing to find them by). Now, per
     OQ-31 (answered 2026-10-07): a List leaves the anaesthetist's **main view** once finalised and sent
     to invoicing (the billing run at authorise, one predicate, `hasLeftMainView`), and is found by the
     calendar archive or search; the main view starts at today with earlier un-invoiced Lists above.
     D9's earlier default ("billed Lists stay, Done · billed"), never built, is withdrawn.
  2. **Amended:** the Phase 10 entry on the seeded historical backdrop ("office surfaces exclude them").
     The backdrop is also the anaesthetist's browsable history (January to June 2026 for Dr Souter,
     multi-Booking Lists, the new months settled before 1 April); office surfaces and the main view
     still exclude it; the calendar and search include it.
  3. **New:** the archive calendar reads Lists, not Slots; it is a work calendar, separate from Phase
     29's availability calendar, bounded by the anaesthetist's first List and the schedule horizon.
  4. **New:** search covers the anaesthetist's own non-cancelled Bookings, matching an exact NHI in
     either format or every word of a partial name, ignoring case and accents; the Admin App is not
     included (the stories name the anaesthetist app).
  5. **Upheld with an addition:** the 2026-07-27 real-routing ruling (the mobile Lists tab is one
     splat route hosting the slide stack; query params carry view state, written with `replace`;
     transient sheets stay local state); the home layer now carries `?day=` and `?q=`, which the pops
     restore.
- **Handoff notes:**
  - For **38b** and **39**: the Booking detail reached from the archive or search is the anaesthetist's
    entry point for an additional invoice or a credit note on their own invoiced Procedure; on an
    invoiced List those actions are the only controls that may appear, and the store's edit refusal
    must allow them and nothing else; a new invoice or credit note shows in the List's Invoices section
    (`invoicesForListView`).
  - For **39b**: the same entry point for a pre-op or post-op event on a past Procedure.
  - For **40**: search rows can link to the patient view; merged patients must resolve through one
    resolver so search shows a patient's Bookings once.
  - For **40a**: the search field may show NHI validation feedback once lookup exists; matching stays
    exact.
  - For **43**: `mainViewFor`, `searchBookingsFor` and `listsMonthFor` must stay usable at full scale;
    index by anaesthetist if timings demand it; the generated history builds through the same
    backdrop builder.
  - For **44**: S3's Beat 1 Expected, its optional closing moment, its discovery points and the Direct
    URLs were patched here; re-read them in the rewrite and audit that no trigger is needed.
