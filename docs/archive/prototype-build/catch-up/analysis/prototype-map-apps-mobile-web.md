# Prototype map: Anaesthetist Mobile App and Anaesthetist Web App

Paths are relative to `aa-prototype/src/` unless stated. Line numbers read from the code at HEAD 63a44902 (18 Nov 2026), i.e. after catch-up phases 22a, 23, 24, 25, 17a and UI phases U4 to U6 (earlier maps were taken at c9b65ad8; the apps' behaviour changed little since, mainly the primary-Procedure row text and the UI kit swap).

## Orientation

Both apps are the same single persona, Dr Melanie Souter (registration `34821`, `shell/appConfig.ts` `APP_CONFIG.mobile.persona` / `.web.persona`), as an `Actor {role:'anaesthetist', source:'anaesthetist', anaesthetistId}` built in `apps/mobile/MobileApp.tsx:116` and `apps/web/WebApp.tsx:40`. There is no login, persona switch, role model, profile, settings or notification preference in either app. They are thin screen layers: they read store selectors and render; nothing in `apps/mobile` or `apps/web` calls a store mutation directly (grep: no `mutate(`, `submitList`, `moveList`, `alertOffice`; the one `getState()` use is `useDemoTriggerMemory.getState().clearPhotoCaptureRequest()` at `apps/mobile/routes.tsx:80`). All writes (add booking, capture, complete, submit, move List, alert office, availability edit) happen inside `src/shared/flows`, `shared/booking`, `shared/availability`, which these screens mount. Mobile = 4 bottom tabs inside a phone frame (`router.tsx:138` `MobileApp host={PhoneFrame}`; the PWA mounts the same app in `MobileViewport`). Web = 4 top-nav tabs, desktop, min width 1240 (`apps/web/WebApp.tsx:55`). The anaesthetist sees ONLY her own Lists, Bookings, money, and colleagues' session STATUS (A8). No authorise, pricing/fee-schedule view, contract view, Contract picking, patient master search or export exists here; the Booking's payer, price, contract and Procedure editing are all inside the shared Booking body. Money views read the billing mirror (`state.billing`), never Xero (`apps/moneyViewPurity.test.ts`).

## Contents
1. Shell, outlet, frames
2. Mobile routes and screens (2.1 Lists stack; 2.2 Forward Lists; 2.3 look-back; 2.4 List detail; 2.5 Booking detail; 2.6 Availability; 2.7 My calendar; 2.8 Balances; 2.9 More)
3. Web routes and screens (3.1 Dashboard; 3.2 Lists; 3.3 look-back; 3.4 List detail; 3.5 Booking detail; 3.6 Find cover; 3.7 My availability; 3.8 Accounts)
4. Rules, statuses, calculations
5. src/shared and store pieces these screens use
6. Demo, test and simulator affordances
7. Stubbed, hardcoded, visual-only, absent
8. Tests in this area

## 1. Shell, outlet, frames
- `apps/mobile/MobileApp.tsx` (163 lines): layout route. `SurfaceProvider variant="mobile"` (sheets are bottom sheets), `data-aa-modal-scope` (an open sheet makes screens inert), `MoveListPromptProvider actor` (the one "Move this List" sheet, `shared/flows/MoveListPrompt`). `BottomTabBar` (:26, a `<nav aria-label="Main">`) Lists / Availability / Balances / More, shown only when both stacks are at depth 0 (:138); List, Booking and My calendar layers are full-bleed. Outlet context (`outlet.ts`): actor, anaesthetistId, personaName/Role, initials, optional `moreExtra` slot (PWA injects presenter controls).
- `apps/mobile/navigation.ts`: pure URL parsing: `mobileTabForPath` :18, `availabilityStackLocation` :49 (0 Find cover / 1 My calendar), `listsStackLocation` :53 (0 Forward Lists / 1 List / 2 Booking).
- `apps/mobile/components/SlideStack.tsx` (349): layered push/pop, all layers stay mounted (transform animation), edge-swipe-back (28px zone, axis lock 10px, commit at 0.35 width or 0.5 px/ms; touch only, never mouse; parked layers `inert`). `MobileHeader` (shared `Eyebrow`, 26px title, avatar). `ListOptionsSheet` (bottom-sheet menu: icon/label/hint/disabled). `components/index.ts` re-exports shared primitives under mobile names (`ListRow`, `TickBadge`).
- `apps/web/WebApp.tsx` (70): `SurfaceProvider variant="web"` (centred dialogs), `WebNav` (Logo, `<nav aria-label="Main">` tabs Dashboard / Lists / Availability / Accounts with `aria-current`, persona name + avatar, not clickable), `MoveListPromptProvider`, content max-width 1320. Outlet context adds `todayISO` from `useToday()`. `components/AvailabilityPageSwitch.tsx` (shared `LineTabs`: Find cover | My availability, real links). `useDashboardFigures.ts` (memoised `deriveDashboardFigures` over `state.dashboards`). The old `components/Panel.tsx` is gone (U6): screens use shared `Card`, `PageHeader`, `Button`, and the `shared/table` kit (`TableShell`, `Th`, `Td`, `ClickableRow`, `RowOpenButton`, `GroupRow`).
- Identity fallback `'34821'`. Colleague data is status-only (A8, US-01.3.6).

## 2. Mobile routes and screens

| Route | Element | File |
|---|---|---|
| `/mobile` | redirect to `lists` | router.tsx:139 |
| `/mobile/lists/*` (`?q=`, `?day=`) | `MobileListsRoute`, 3 layers | apps/mobile/routes.tsx:35 |
| `/mobile/lists/:listId` | layer 2 (List) | same |
| `/mobile/lists/:listId/bookings/:bookingId` | layer 3 (Booking) | same |
| `/mobile/availability/*` | `MobileAvailabilityRoute` | routes.tsx:233 |
| `/mobile/availability/calendar` | layer 2 (My calendar) | same |
| `/mobile/balances` | `MobileBalancesRoute` | routes.tsx:299 |
| `/mobile/more` | `MobileMoreRoute` | routes.tsx:304 |
| `*` | redirect `/mobile` | router.tsx:147 |
Legacy `/cards/` URLs: `LegacyBookingRedirect` (routes.tsx:106).

### 2.1 `MobileListsRoute` (routes.tsx:35-215)
- Home view state in URL: `?q=` search and `?day=` picked date, written with `navigate(...,{replace:true})` (:55-61); last home search remembered in a `homeSearch` ref so pops restore it (:47-51, :120). Junk `?day=` ignored (`isISODate`).
- Stale-id guards (:95-108): a List that is missing, `DRAFT`, or `anaesthetistId !== hers` (moved away, Phase 32) redirects to `/mobile/lists`; a Booking not hers (`useOwnBookingInView`, `shared/flows`, latch so a just-moved Booking stays until its done step is left) redirects to its List.
- Both pops use replace (comment :112-123). Edge swipe wired to the same handlers (:134).
- Hosts shared `AddBookingFlow` (:199; `initialMode` `manual`, or `photo` from the demo trigger :74-81) and `LookbackDateSheet` (:187, local `dateSheetOpen`).

### 2.2 `ForwardListsScreen` (screens/ForwardListsScreen.tsx; US-07.4.2, US-07.4.1, US-07.2.1, US-15.0.2)
Header "Kia ora, Dr Souter" (`drSurname`), eyebrow day heading, search row, then (mode `main` only) `FilterPills` Week / Month / To-Do / Done (:43, default Week). Mode = search (query parses to nhi or name, :140) > day (`?day=`) > main (:141).
- Data: `mainViewFor(slotState, id, today, today+7|31 days)` (store/lookback.ts:52): `earlier` = her Lists dated before today, assigned, not AUTHORISED, holding at least one active Booking, any distance back, oldest first; `upcoming` = `slotViewsForAnaesthetist` from today to bound minus Lists that `hasLeftMainView` (state AUTHORISED only, domain/listProgress.ts:18).
- "Earlier, not yet authorised" group renders above Today (:328); a "N earlier Lists not yet authorised" `TextAction` under the Today heading scrolls up (:347). On mount and chip change the scroller puts the Today heading at its top (:242-252). Rows grouped by date, AM then PM then OOH (`sessionRank`, :98-108).
- `viewRow` (:168): a session with a List shows `listRow` (:195); an empty open session shows a "<status> session / Open for bookings" chip row, not tappable; a closed status shows a day-off row (title = note or status long label). To-Do/Done use all her assigned future Lists regardless of window (:223-228).
- `inChip` (:215): To-Do = ACTIVE or SUBMITTED List with any non-cancelled Booking not `completed` (a reopened Booking on a submitted List appears under To-Do); Done = `listProgress === 'submitted'`; authorised Lists under no chip.
- `listRowModel` (screens/listRowModel.ts:29): title = hospital name or "Pre-op assessment"; subtitle = surgeon + specialty (private; `surgeonSpecialtyLabel`) or the template note (public/preop keep `list.notes`), plus "N bookings"/"N appointments" unless upcoming; right side from `listProgress`: `toFinish {count}`, `count`+kind (upcoming), or `progress` pill (readyToSubmit, submitted, invoiced, authorised); `quiet` for submitted. Labels `LIST_PROGRESS_LABEL` (domain/listProgress.ts:42): "To finish", "Ready to submit", "Done · unbilled", "Invoiced", "Authorised".
- "New" badge on a List a colleague moved to her, or one made for a single Booking handed to her (`useMovedToMe`, `useBookingsMovedToMe`, :126-129, :279). Tapping a List row opens List detail; open-session rows are inert (no self-booking).

### 2.3 Look-back (screens/ListsLookback.tsx; US-03.1.6, US-03.1.7, FT-07.4)
- `LookbackSearchRow` (:31): shared `NameSearchBox` "Search patient name or NHI" (`data-testid mobile-lists-search`; `useFieldText` keeps the caret), plus a "Go to a date" calendar button.
- Search (`useBookingSearch` -> `searchBookingsFor`, store/lookback.ts:326; parser domain/bookingSearch.ts): min 2 significant chars; NHI form matches exact NHI, otherwise name tokens folded (accents, macrons, hyphens, case) all contained in the patient name. Own non-cancelled Bookings only, assigned Lists, any state incl. authorised/invoiced; Upcoming (soonest first) then Past (most recent first); cap 50 with `searchCountLine`. `ResultRow` (:217): session, time, patient (+WarningTriangle), "date · session · hospital · first procedure", NHI, `ProgressPill`; tap opens the Booking.
- Date lookup: `LookbackDateSheet` (:72) bottom sheet "Go to a date" with shared `MonthGrid` (dot = a day with one of her Lists via `listDaysFor`, lookback.ts:284), bounds `useLookbackBounds` (`lookbackBoundsFor` :219: her earliest List to horizon end). Picking sets `?day=`; teal `DayChip` replaces the filter chips; `LookbackDayView` (:145) lists `listsOnDayFor` (:265; every state incl. authorised) as `ListRow`s via `listRowModel`. Empty copy `DAY_EMPTY`, `SEARCH_EMPTY` (shared/schedule/lookbackCopy).

### 2.4 `ListDetailScreen` (screens/ListDetailScreen.tsx)
Nav row: back "Lists", and a "..." List options button (only when options exist, :173). Title "<hospital> <AM|PM|Out-of-hours>" (`sessionText`) or "Pre-op assessment"; subline surgeon · specialty · Today/date · time range (`useListTimes`, `slotTimeRange`); list-kind `StatusChip`; "Moved to you by ..." (`useMovedToMeNotice`, `movedToYouByLine`, :207); `AlertOfficeEntry compact statusOnly`; progress bar "n of m complete" (cancelled excluded, :108-109, :218).
- List options (:134-159, `ListOptionsSheet`): "Move this List" if `useIsMovable` (owner, ACTIVE, today or later: `ownMoveRefusal`, domain/listMoves.ts:132) -> `movePrompt.openMove(listId)`; "Alert the office" (or disabled "The office has been alerted") when `officeAlertRefusal` (store/officeAlertActions.ts:40) is null or `alreadyAlerted` -> `AlertOfficeSheet` (note required, max 300, US-03.6.3).
- Booking rows sorted by `scheduledTime` then id (:92): time, patient, NHI mono, operation = the Booking's PRIMARY Procedure (`p.isPrimary`, :88; Phase 23) via `procedureLabel(first, rvgGroups, 1)` or "Procedure to capture", a cue from `bookingContractCue` (store/selectors.ts:2154: "Needs an invoice destination" if a Procedure lacks `governingContractId`, else "RVG code to fill in"; cancelled has none), WarningTriangle (`useListWarnings`), then Cancelled (strikethrough), `TickBadge` (animates only for Bookings completed since the screen first showed, :67-79), or "Capture" pill. No fee or units on mobile.
- AUTHORISED: Invoices card from `useListInvoices` -> `invoicesForListView` (lookback.ts:386: number, party, issue date, total, paid/part/outstanding), no Add a booking, footer lock "<Invoiced|Authorised> · read only" (:335-342).
- "Add a booking" (`AddRowButton`) when `editRefusal(actor,list)===null` (store/lifecycle.ts:64: own List, ACTIVE or SUBMITTED; AUTHORISED refused `listAuthorised`) -> shared `AddBookingFlow`.
- Sticky footer (:318-421): AUTHORISED lock; else not ACTIVE: green "Submitted to office" (also for SUBMITTED with a reopened Booking, no resubmit control); incomplete>0: grey "Mark list completed · n to finish / Tap to see what is left" -> `SubmitListSheet mode="blockers"`; else teal "Mark list completed" -> `mode="confirm"`. On submit a 1050 ms `SuccessOverlay` "List submitted / Sent to the office for review" (:445). The completion gate (`completionBlockersFor`, lifecycle.ts) is enforced in the store/shared sheet, not here. Returns null for a Draft List (`isAssignedList`).

### 2.5 `BookingDetailScreen` (screens/BookingDetailScreen.tsx)
Phone chrome only: folding masthead (name collapses to a 44px nav row after 24px scroll, `FOLD`/`REVEAL` transitions), back "List", list-kind chip, WarningTriangle, History control passed in by the body, "primary procedure · hospital" (primary via `isPrimary`, :59). NHI/DOB are in the shared Patient card. Everything else (capture, Procedure stack, primary Procedure, Contract/payer ("Paid by"), modifiers, price, split, validation, complete, cancel, amend, history, move Booking, alert office on a Booking) is `shared/booking` `BookingDetailBody` (not mapped here). Null for a Draft List.

### 2.6 `MobileAvailabilityRoute` (routes.tsx:233) + `AvailabilityScreen` (Find cover)
- Route hosts Find cover + My calendar in a `SlideStack`, and one `Overlay` bottom sheet holding shared `AvailabilityEditor` (`shot="mobile-availability-sheet"`). "Add days off" opens the editor with `formPreset {sessions:'both', span:'week', statusKey}`, status = `SEED_STATUS.holiday` if offered to anaesthetists else the first non-bookable choice (`useAnaesthetistStatusChoices`, :241-242).
- Screen (screens/AvailabilityScreen.tsx): 6-day strip from today (dot if any open session that day via `isOpenSlotView`, :70), Everyone / Free only `SlidingSegmentedControl` (:153), "N free sessions on <date>" (count over ALL views that day, incl. hers, :85), `MovedToYouPanel` (:175), "My availability" card (:181: her AM, PM and, only when the office opened one, OOH cells; status chip + note or List title; per-session "Move" button when `useMovableSessions` (:53) has a movable List -> `movePrompt.openMove(listId)`; "Change <date>" -> editor sheet, disabled with no AM/PM session (:220); "My calendar" -> slide in (:223)). Colleague cards: `rosterForDate` minus herself, name order, no tiers; cells show status or hospital + surgeon, "Free" badge if open; a free cell is a button "Tap to move your List here" only when `mine.targetSlotIds` has that slot (receive rule, :244) -> `openMove(listId,{toSlotId})`. No phone or contact on mobile.

### 2.7 `MyAvailabilityCalendarScreen`
Month grid from current month to horizon end (`useAvailabilityBounds`, `useAvailabilityMonth(id, month)`; month nav clamped). Each day = AM half over PM (`blockFill` of the status visual, or the List), repeat glyph for series instances, `AttentionDot` for `session.conflict` (a List hit by sickness/closure, Phase 32b). Only AM/PM drawn (`hasSessions` :85; OOH not on this calendar). Past and session-less days disabled; tap a day -> editor sheet. Legend = `useAnaesthetistStatusChoices` chips. "Your series" = shared `SeriesList` (:130, repeating days off). Sticky "Add days off" (:150).

### 2.8 `BalancesScreen`
"Your account / Balances". Card "Outstanding to you" = `receivablesAgingFor(...).aging.total` + count of unpaid invoices. Toggle Outstanding / GST this month. Outstanding: flat list from `outstandingAccpayInvoicesFor` (:36): patient, outstanding amount, "invoice no · counterparty label", `AgeChip` `Nd` (warning tint when >60, :138), "ACC" chip when `accFunded`. GST: calendar month from the 1st to today via `gstActivityFor` (:46): each receipt gross + GST, totals. Empty copy "No outstanding invoices. A List's invoices show here once the office authorises it." Read only. No payment history, AA fee invoices or export on mobile.

### 2.9 `MoreScreen`
Persona card (name, role), "Demo prototype" badge and note, `extra` slot (PWA presenter controls). No settings, sign-out, notifications or profile.

## 3. Web routes and screens

| Route | Element | File |
|---|---|---|
| `/web` (`?week=<ISO>`) | `WebDashboardRoute` | apps/web/routes.tsx:33 |
| `/web/lists` (`?q=`, `?day=`) | `WebListsRoute` | :91 |
| `/web/lists/:listId` | `WebListDetailRoute` (`RequireEntity`: assigned and hers) | :117 |
| `/web/lists/:listId/bookings/:bookingId` | `WebBookingDetailRoute` (`useOwnBookingInView`) | :147 |
| `/web/lists/:listId/cards/:cardId` | `LegacyBookingRedirect` | router.tsx:89 |
| `/web/availability` (`?date=`) | `WebAvailabilityRoute` (Find cover) | :173 |
| `/web/availability/mine` (`?date=`) | `WebMyAvailabilityRoute` | :188 |
| `/web/accounts` | redirect `overdue` | router.tsx:95 |
| `/web/accounts/:subTab` (overdue, payments, gst, fees; `?invoice=`) | `WebAccountsRoute` (invalid sub-tab -> not found) | :199 |
| `*` | redirect `/web` | router.tsx:98 |
Back navigation carries router state `{from, listFrom}` (`lookbackState`, routes.tsx:76-89; must start `/web/`) so Back from List or Booking returns to the same search or day; deep links fall back to the plain parent. `?week=` is a Monday anchor (`mondayOf`); stepping uses replace.

### 3.1 `DashboardScreen`
"Kia ora, Dr Souter" + summary line (:127): date · n lists today · n bookings · n awaiting submission (:90-103: today's Lists not yet authorised, non-cancelled bookings, "awaiting" = ACTIVE with bookings all complete). "Move a List" button (disabled when none movable) -> "Which List?" overlay of `useMovableLists(id,6)` (:71) -> `movePrompt.openMove` (:164). Panels (shared `Card`, `StatTile`):
- `WeekStrip` (components/WeekStrip.tsx): 7 Monday-anchored days, AM/PM (+ opened OOH) from `slotViewsForAnaesthetist`; a List block shows hospital + surgeon (or template note) + session + time and clicks through to List detail; empty sessions show status (Free dashed); a whole-day closed status merges into one tall block (`mergedHoliday` :102); today outlined crimson; a submitted List keeps its block, quieter, tick + accessible name "Done · unbilled" (`submittedDone` :63); an authorised List disappears (`slotFor` :55); fill through `blockFill` (hatched Unavailable). Prev/next week.
- Receivables aging (:188-225, 7 cols): `receivablesAgingFor`; four bars Current / 31 to 60 / 61 to 90 / 90+ (`AGING_ROWS` :32), total, "n accounts over 60 days" + link to `/web/accounts/overdue`. Empty: "No outstanding accounts. Receivables appear here once billed work goes unpaid."
- Productivity (:226, 5 cols) and Leave (:262, 5 cols): SEEDED figures (`useDashboardFigures`): units, % change pill, lists, avg units/list, fees invoiced, 6-month units and % vs last year; leave ranges with Approved/Pending pill. Not derived from bookings or availability.
- Who's free next 5 days (:286, 7 cols, live): colleagues' open sessions per day+session (`openSlotViews`, AM/PM/OOH, :105-122), chips by surname; a chip is a button when her List that session can move there (`useMoveTargets`, :77) -> `openMove(listId,{toSlotId})` (:327); the title carries the colleague's phone (`masters.anaesthetists.phone`, :328). Link "Full availability grid".

### 3.2 `ListsScreen` (W2; US-07.4.2, US-03.1.4)
`PageHeader`, `NameSearchBox` ("Search patient name or NHI"), `WebGoToDate` (native date input, bounded by `useLookbackBounds`), and a "To" `FilterDateInput` (main mode; default today +28 days, :81; cleared = unbounded `9999-12-31`, :106). Same `mainViewFor` and `listProgress` as mobile. Table (`TableShell`) columns Date, Session, From, To, Description, Status (`StatusChip`), Progress (`ProgressPill`) (:231-237). Groups "Earlier, not yet authorised" (:242, `data-shot web-main-view-earlier`) then "From today" (:247). Times only when a List exists or times are overridden. Rows with a List: `ClickableRow` with a single `RowOpenButton` handle named "Open List ..." (U6; row has no tabindex); submitted row `data-quiet`; OOH row `data-shot="out-of-hours-row"` (:148). Empty sessions: `emptySessionLine`. Description = hospital · surgeon · specialty (public/preop use `notes`).

### 3.3 `ListsLookback.tsx` (web)
`WebResultsTable` (Date, Session(+time), Patient(+warning), NHI, Hospital, Procedure, Progress; Upcoming then Past; `data-booking-id`), `WebDayTable` (Session, Time, Location, Bookings count, Status, Progress via `listsOnDayFor`), `WebGoToDate` (`DateJumpInput`). Same selectors as mobile; "N matches" via `searchCountLine`; "Clear search".

### 3.4 `ListDetailView`
`BackLink` "Lists", `PageHeader` "<hospital> <session>" + kind chip, subline, moved-to-you line, `AlertOfficeEntry compact` (action visible on web), "Move this List" button (`useIsMovable`), `SubmitAction` (:338: AUTHORISED lock "<Invoiced|Authorised> · read only"; not ACTIVE green "Submitted to office"; blocked "n to finish before submitting" -> blockers sheet; else "Mark list completed" -> confirm; same `SubmitListSheet`). Bookings `Card` with progress bar; table Time, Patient (+NHI or "NHI pending", warning), Procedure (primary first via `inDisplayOrder`, `procs[0]`, "+n more", contract cue), then for non-authorised Units and Fee per Booking from `bookingFee({procedures, list, masters, billingLines, patientId, held: heldPricesForBooking(...), lock: billing.locks[booking.id]})` (:104; shared/capture/feeContext.ts:82: the whole Booking priced once under the multi-procedure rule, held prices honoured (Phase 24), a locked fee used after authorise (Phase 25); cancelled shows "·"; no price on the date -> `NEEDS_PRICE_LABEL` "Needs a price"); for AUTHORISED an "Invoiced" column from `useListInvoices` sums, not a recomputed fee; Status Cancelled / Complete+tick / Capture; Totals row. "Add a booking" when `editRefusal` null -> shared `AddBookingFlow` (dialog). AUTHORISED shows an Invoices `Card`. Draft/colleague guarded by `WebListDetailRoute`; the view also returns null for DRAFT. No attachments panel.

### 3.5 `BookingDetailView`
Back "List"; `PageHeader` patient name + warning triangle; mono `nhiBadge` + "DOB <date> (<age>y)" (`ageYears`); primary procedure (`isPrimary`, :42) · hospital; kind chip + History (from body). Body is shared `BookingDetailBody`.

### 3.6 `AvailabilityGrid` (Find cover, W3)
`PageHeader`, `AvailabilityPageSwitch`, day prev/next/Today (initial `?date=` ignored if before today), `MovedToYouPanel`, `FilterPills` All anaesthetists / "Free only · count" (open sessions via `isOpenSlotView`, AM+PM+OOH), `NameSearchBox` (`matchesNameQuery`), `StatusLegend`. Rows = `rosterForDate` sorted by name including hers (`availability-row-mine`, "(you)" + "Change" link to `/web/availability/mine?date=`). Columns AM, PM and an "Out-of-hours" column only when someone has an OOH session that day. Cell: status + "Open for booking", hospital + surgeon (or template note), "Pre-op clinic"; fill via `blockFill`. Actionable only for move: her own List cell ("Move") or a colleague's free session her List can receive into ("Move here") -> `openMove`. Status only for colleagues; no booking or patient detail.

### 3.7 `MyAvailabilityCalendar` (web)
Month `Card` clamped to today..horizon (+ "Today"), click a day, shift-click extends a range (`pick`/`anchor` :56-60), per-day AM/PM cells (label, hospital or series line or note, repeat glyph, `AttentionDot`); right rail 340px (:80): empty prompt or shared `AvailabilityEditor` (`shot="web-availability-rail"`) for the range, "Your series" `SeriesList` (:157), Legend. Past and session-less days disabled. OOH not shown.

### 3.8 `AccountsScreen` (URL-driven sub-tabs, own `SubTabButton` :473, local `Th`/`Td` :495-503)
- Overdue (:88): `receivablesAgingFor` rows, one per outstanding ACCPAY invoice (no rollup), ordered by `raisedAtISO`; amount in its bucket column (`AGING_COLS` :32), ACC flag from `accFunded`, totals row. Empty: "No outstanding accounts. A List's invoices show here once the office authorises it."
- Payments (:182): `paymentHistoryFor` (selectors.ts:1170): date received, invoice, patient, payer, "Received by AA", "Released to you" (`authorisedAmount`), "Paid to you" (`disbursedAmount`), status chip (`PAYMENT_STATUS_LABEL` AccountsScreen.tsx:175: Part payment received / Customer paid / Part paid to you / Paid to you). `?invoice=` highlights `payment-history-row-<no>`. Caption says AA releases everything it receives in full and links to the AA fees tab.
- GST activity (:391): `Segmented` Monthly / Bi-monthly / Six-monthly, default from `masters.anaesthetists[id].gstPeriod`; window = rolling N calendar months ending today (`periodWindow` :385, not GST filing periods); rows (date, invoice, payer, gross, GST) + total.
- AA fees (:290; US-10.3.2): `aaFeeInvoicesFor` (selectors.ts:1667): invoice no., month, BCTI count, fixed charges (`aaFeeFixedTotal`), per-BCTI charge, fee ex GST, GST, total, Paid <date>/Unpaid, footer unpaid total. `?invoice=` highlights `aa-fee-history-row-<no>`. Read only.
No statements, PDFs, invoice download or dispute actions in either app.

## 4. Rules, statuses, calculations
- List lifecycle visible: DRAFT (office only, never shown: `isAssignedList`, route guards, `apps/draftListBoundary.test.ts`) -> ACTIVE -> SUBMITTED -> AUTHORISED. The anaesthetist submits (ACTIVE only) and edits Bookings while ACTIVE or SUBMITTED (`editRefusal`, store/lifecycle.ts:64); AUTHORISED is locked and read only; no authorise anywhere here.
- Main view exit = office AUTHORISE, not billing stamp (`hasLeftMainView`, domain/listProgress.ts:18). Authorised Lists then reachable only by search or day lookup.
- `listProgress` (domain/listProgress.ts:55): AUTHORISED -> invoiced (billedAtISO) or authorised; SUBMITTED -> toFinish if any Booking incomplete else submitted; ACTIVE with no Bookings -> upcoming; all complete -> readyToSubmit; else toFinish only if dated today or earlier, otherwise upcoming. Read by mobile rows, web table, week strip, search rows, `ProgressPill`.
- Slot views (store/selectors.ts:210-264): `SlotView {slot, list?, displayKey, times, open}`; a session holding a List shows the List kind in place of the status; `open` = open-for-bookings status and no List. Statuses are a master (`domain/slotStatus.ts`, `SEED_STATUS.holiday`); an anaesthetist sets only those `useAnaesthetistStatusChoices` returns. Sessions AM, PM, OOH (`domain/outOfHours.ts`; OOH only on days the office opened one).
- Primary Procedure (Phase 23): row/masthead operation text = the Booking's `isPrimary` Procedure (mobile ListDetail :88, BookingDetail :59; web `inDisplayOrder`). Fee per Booking via the multi-procedure engine (`bookingFee`), web only.
- Moving a List (Phase 32): owner only, ACTIVE, today or later (`ownMoveRefusal`, domain/listMoves.ts:132); targets are colleagues' free sessions passing `receiveRefusal` (:101), `pushTargets` (:169); notices via `movedToMe` (store/notifications.ts:208) and audit-based `bookingsMovedToMe`. A moved List leaves her schedule (route guards compare `anaesthetistId`).
- Office alert (US-03.6.3): `officeAlertRefusal` (store/officeAlertActions.ts:40): owner only, not Draft, not AUTHORISED, one active alert per target, note 1 to 300 chars.
- Money: `accpayRowForCase` (selectors.ts:1025) builds a row only for a case with `invoiceId` and `accRecId`, and an invoice with `raisedAtISO`; `agingDays` = days since raised; outstanding = total minus received; "over 60" count `agingDays > 60` (:1093). `accFunded` from `archivedAccRelated` or the Procedure's Contract tag.
- Search folding and NHI detection: domain/bookingSearch.ts. Format: names via `shared/format` (`drSurname`, `initialsOf`, `nhiBadge`, `formatCurrency`, `dayWithYear`); copy uses `·` and "to"; time from `useToday()` (demo clock).

## 5. src/shared and store pieces used (not documented here)
- Flows: `shared/flows` (AddBookingFlow, SubmitListSheet, MoveListPromptProvider/useMoveListPrompt, useIsMovable, useMovableSessions, useMovableLists, useMoveTargets, useMovedToMe, useBookingsMovedToMe, useMovedToMeNotice, useOwnBookingInView, movedToYouByLine, MovedToYouPanel, AlertOfficeEntry/AlertOfficeSheet, sessionKey); `shared/booking` (BookingDetailBody); `shared/schedule` (ListRow, ProgressPill, ListInvoices/useListInvoices, useBookingSearch, useLookbackBounds, useFieldText, lookbackCopy); `shared/calendar` (MonthGrid, MonthHeaderRow); `shared/warnings` (WarningTriangle, useListWarnings, useBookingWarnings, AttentionDot); `shared/ui` kit (BackLink, Button, Card, PageHeader, StatTile, TextAction, IconButton, FilterPills, LineTabs/LineTabLink, DayChip, NameSearchBox, Eyebrow, EmptyState, ProgressBar, AddRowButton, TickBadge, DockSpacer, SuccessOverlay, SlidingSegmentedControl, Segmented, DateFields `FilterDateInput`/`DateJumpInput`); `shared/table` (TableShell, Th, Td, ClickableRow, RowOpenButton, GroupRow); `shared/surface` (OverlayHeader, useSurface Overlay); `shared` (StatusChip, StatusLegend, resolveDisplayStatus, useDisplayStatus, blockFill, Avatar, Logo, emptySessionLine, useAnaesthetistStatusChoices); `shared/capture` (`bookingFee`); `shared/availability` (AvailabilityEditor, SeriesList, monthCells, useAvailabilityMonth, useAvailabilityBounds); `shell/RequireEntity`, `shell/routeParams` (`isISODate`).
- Store reads: `store/selectors.ts` (`slotViewsForAnaesthetist`, `slotViewsForDate`, `openSlotViews`, `rosterForDate`, `receivablesAgingFor`, `outstandingAccpayInvoicesFor`, `gstActivityFor`, `paymentHistoryFor`, `aaFeeInvoicesFor`, `bookingContractCue`, `heldPricesForBooking`), `store/lookback.ts` (`mainViewFor`, `listsOnDayFor`, `listDaysFor`, `lookbackBoundsFor`, `searchBookingsFor`, `invoicesForListView`), `store/lifecycle.ts` (`editRefusal`), `store/officeAlertActions.ts`, `billing.locks`.

## 6. Demo, test and simulator affordances
- Photo capture demo trigger (routes.tsx:74-81): `useDemoTriggerMemory.photoCaptureRequest {listId,n}` (set from the demo panel, `shared/demoTriggers/memory.ts`) opens Add a booking in `photo` mode for the List currently open (only when the URL's List matches). The List's own "Add a booking" never reaches photo (US-02.4.4 Future Work).
- More tab `moreExtra` slot gives the PWA its clock/reset/office-simulation controls (`pwa/PwaDemoPanel.tsx`); the framed prototype uses the harness bar.
- Test hooks: `data-shot`/`data-testid` throughout; notable: `mobile-lists-search`, `mobile-lists-day-chip`, `mobile-main-view-earlier`, `list-options`, `list-move`, `list-alert-office`, `list-row-contract-cue`, `list-authorised-status`, `list-submission-overlay`, `availability-move-<session>`, `dashboard-move-list`, `web-lists-search`, `out-of-hours-row`, `payment-history-row-<inv>`, `aa-fee-history-row-<inv>`.
- Boundary tests in `apps/`: `draftListBoundary.test.ts`, `moneyViewPurity.test.ts`, `noSlotCopy.test.ts`, `officePrivacy.test.ts`, `outOfHoursScreens.test.tsx`.

## 7. Stubbed, hardcoded, visual-only, absent
- Persona hardcoded to Dr Souter in both apps; no auth, profile, preferences, notification centre, sign-out. More tab = persona card + demo note. WebNav avatar and name are decorative.
- Dashboard Productivity and Leave are seeded demo figures (`state.dashboards`; `deriveDashboardFigures` ages them with the demo clock); no leave-request workflow, Approved/Pending is seeded text.
- GST report window is rolling months, not tax periods; `gstPeriod` only sets the default.
- Mobile Balances has no history, AA fees or export; web Accounts has no statements, PDFs, downloads or disputes. Aging only counts ACCPAY rows with `accRecId`.
- Colleague phone numbers appear only in a Dashboard "Who's free" chip tooltip (web).
- Open-session rows (mobile Forward Lists, web Lists table) are not actionable (no self-booking, no "add a List"); a Booking is created only inside an existing assigned ACTIVE/SUBMITTED List. Photo capture is demo-only.
- A SUBMITTED List shows "Submitted to office" even with a reopened Booking (To finish shows on rows/chips); no explicit resubmit.
- My calendar (mobile and web) ignores OOH sessions; OOH shows on Find cover, Forward Lists, Dashboard strip only.
- Search is client-side over the in-memory schedule; 50-result cap; no calendar sync, printing or messaging.
- Absent here: List attachments UI, contract or fee-schedule viewer, price/fee on mobile List rows, payer/Contract view outside the shared Booking body, patient master search, ward/theatre detail, profile editing, anaesthetist-facing Contract or price history.
- Comment drift: DashboardScreen header cites "Phase 10 replaces receivables"; MoreScreen comment "deeper settings are out of prototype scope"; web `ListDetailView` docblock still says `Panel flush` (now `Card`).

## 8. Tests in this area
- `apps/mobile/components/SlideStack.test.tsx`: edge-swipe (mouse ignored, edge zone, axis lock, velocity commit, pointercancel, reduced motion, inert parked layers).
- `apps/mobile/screens/ForwardListsScreen.test.tsx`: earlier group above Today (3 earlier Lists incl. Mon 13 Jul AM, Phase 23 seed), Today anchor and scroll-back hint, reopened Booking under To-Do, Done chip, `?q=` search and back, `?day=` view and chip, junk `?day=`, date sheet, submitted List stays editable, colleague's Booking falls back, authorised List shows Invoices and no Add a booking.
- `apps/web/screens/ListsScreen.test.tsx`: earlier group + Progress column, NHI search and Clear, day view and Back, Back from search result, authorised List detail Invoices, colleague Booking not found, week strip "Done · unbilled", authorised leaves the strip, one `Open List` keyboard handle per row (U6), hatched status drawn through `blockFill` in `WeekStrip`.
- `apps/web/screens/AccountsScreen.test.tsx`: S3 payment stays in Payments after `receivePayment` + `disbursePayable`; AA fees rows and focus; caption link.
- `apps/web/components/navState.test.tsx` (U5): WebNav and Admin SideNav each mark exactly one `aria-current="page"` item.
- No unit tests for Dashboard, AvailabilityGrid, My availability, Balances, mobile/web List detail; covered by shared/store tests and Playwright.
