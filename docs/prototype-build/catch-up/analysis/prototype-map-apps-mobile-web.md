# Prototype map: Anaesthetist Mobile App and Anaesthetist Web App

Paths are relative to `aa-prototype/src/` unless stated. Line numbers read from the code at HEAD c9b65ad8 (17 Nov 2026), after catch-up phases 15 to 22, 32, 38a and UI phases U1 to U3. This replaces the 4 Nov map (stale: it described List attachments, a "billed Lists vanish" rule and `accRelated`, none of which are in this code now).

## Orientation

Both apps are the same single persona, Dr Melanie Souter (registration `34821`, `shell/appConfig.ts` `APP_CONFIG.mobile.persona` / `.web.persona`), as an `Actor {role:'anaesthetist', source:'anaesthetist', anaesthetistId}` built in `apps/mobile/MobileApp.tsx:112` and `apps/web/WebApp.tsx:40`. There is no login, persona switch, role model, profile, settings or notification preference inside either app. They are thin screen layers: they read store selectors and render; nothing in `apps/mobile` or `apps/web` calls a store mutation directly (verified by grep: no `submitList`, `moveList`, `alertOffice`, `authoriseList`, `mutate(`, `getState()` except `useDemoTriggerMemory.getState().clearPhotoCaptureRequest()` at `apps/mobile/routes.tsx:80`). All writes (add booking, capture, complete, submit, move List, alert office, availability edit) happen inside `src/shared/flows`, `shared/booking`, `shared/availability`, which these screens mount. Mobile = 4 bottom tabs inside a phone frame (`MobileApp host={PhoneFrame}`, `router.tsx:138`; the PWA mounts the same app in `MobileViewport`). Web = 4 top-nav tabs, desktop, min width 1240 (`router.tsx:82`). The anaesthetist sees ONLY her own Lists, her own Bookings, her own money, and colleagues' session STATUS (A8). No authorise, pricing/fee-schedule view, contract view, patient master search or export exists here. Money views read the billing mirror (`state.billing`), never Xero (`apps/moneyViewPurity.test.ts`).

## Contents
1. Shell, outlet, frames
2. Mobile routes and screens (2.1 Lists stack; 2.2 Forward Lists; 2.3 look-back; 2.4 List detail; 2.5 Booking detail; 2.6 Availability; 2.7 My calendar; 2.8 Balances; 2.9 More)
3. Web routes and screens (3.1 Dashboard; 3.2 Lists; 3.3 look-back; 3.4 List detail; 3.5 Booking detail; 3.6 Find cover; 3.7 My availability; 3.8 Accounts)
4. Rules, statuses, calculations (with files and lines)
5. src/shared and store pieces these screens use
6. Demo, test and simulator affordances
7. Stubbed, hardcoded, visual-only, absent
8. Tests in this area

## 1. Shell, outlet, frames
- `apps/mobile/MobileApp.tsx` (159 lines): layout route. `SurfaceProvider variant="mobile"` (sheets are bottom sheets), `data-aa-modal-scope` (U2: an open sheet makes screens inert), `MoveListPromptProvider actor` (the one "Move this List" sheet, `shared/flows/MoveListPrompt`). `BottomTabBar` (:26) Lists / Availability / Balances / More, shown only when both stacks are at depth 0 (:134); List, Booking and My calendar layers are full-bleed. Outlet context in `outlet.ts`: actor, anaesthetistId, personaName/Role, initials, optional `moreExtra` slot (PWA injects presenter controls).
- `apps/mobile/navigation.ts`: pure URL parsing. `listsStackLocation` :53 (depth 0 Forward Lists / 1 List / 2 Booking), `availabilityStackLocation` :49 (0 Find cover / 1 My calendar), `mobileTabForPath` :18.
- `apps/mobile/components/SlideStack.tsx` (349): layered push/pop, all layers stay mounted, edge-swipe-back (28px zone, axis lock 10px, commit at 0.35 width or 0.5 px/ms; touch only, never mouse; parked layers `inert`). `MobileHeader` (eyebrow, 26px title, avatar). `ListOptionsSheet` (bottom sheet menu of rows icon/label/hint/disabled). `components/index.ts` re-exports shared primitives under mobile names.
- `apps/web/WebApp.tsx` (70): `SurfaceProvider variant="web"` (centred dialogs), `WebNav` (Logo, tabs Dashboard / Lists / Availability / Accounts, persona name + avatar, not clickable), `MoveListPromptProvider`, max-width 1320. Outlet context adds `todayISO` from `useToday()`. `components/Panel.tsx` (white card), `AvailabilityPageSwitch.tsx` (Find cover | My availability), `useDashboardFigures.ts` (memoised `deriveDashboardFigures` over `state.dashboards` seed).
- Identity: anaesthetistId fallback `'34821'`. Colleague data is status-only everywhere (comments cite A8, US-01.3.6).

## 2. Mobile routes and screens

| Route | Element | File |
|---|---|---|
| `/mobile` | redirect to `lists` | router.tsx:139 |
| `/mobile/lists/*` (also `/mobile/lists?q=` or `?day=`) | `MobileListsRoute`, 3 layers | apps/mobile/routes.tsx:35 |
| `/mobile/lists/:listId` | layer 2 | same |
| `/mobile/lists/:listId/bookings/:bookingId` | layer 3 | same |
| `/mobile/availability/*` | `MobileAvailabilityRoute` | routes.tsx:233 |
| `/mobile/availability/calendar` | layer 2 (My calendar) | same |
| `/mobile/balances` | `MobileBalancesRoute` | routes.tsx:299 |
| `/mobile/more` | `MobileMoreRoute` | routes.tsx:304 |

### 2.1 `MobileListsRoute` (routes.tsx:35-215)
- Home view state in URL: `?q=` search and `?day=` picked date, written with `navigate(...,{replace:true})` (:55-61); last home search remembered in `homeSearch` ref so pops restore it (:47-51, :120). Junk `?day=` ignored (`isISODate`).
- Stale-id guards (:95-108): a List that is missing, `DRAFT`, or `anaesthetistId !== hers` (moved away) redirects to `/mobile/lists`; a Booking not hers (`useOwnBookingInView`, shared/flows/useListMoves.ts:144, with a latch so a just-moved Booking stays until its done step is left) redirects to its List. Legacy `/cards/` URLs go to `LegacyBookingRedirect`.
- Both pops use replace (comment :112-123 explains the dead-press tradeoff). Edge swipe wired to the same handlers (:134).
- Hosts shared `AddBookingFlow` (:199; `initialMode` manual, or `photo` from the demo trigger :74-81) and `LookbackDateSheet` (:187, local `dateSheetOpen` state).

### 2.2 `ForwardListsScreen` (screens/ForwardListsScreen.tsx) "main view" (US-07.4.2, US-07.4.1, US-07.2.1, US-15.0.2)
Header "Kia ora, Dr Souter" (`drSurname`), eyebrow day heading, search row, then (mode `main` only) chips Week / Month / To-Do / Done (:39, default Week). Mode = search (query parses to nhi or name, :136) > day (`?day=`) > main (:137).
- Data: `mainViewFor(slotState, id, today, today+7|31 days)` (store/lookback.ts:52): `earlier` = her Lists dated before today, assigned, not AUTHORISED, not backdrop, holding at least one active Booking, any distance back, oldest first; `upcoming` = `slotViewsForAnaesthetist` from today to bound minus Lists that `hasLeftMainView` (state AUTHORISED only, domain/listProgress.ts:18).
- Earlier group renders above Today under "Earlier, not yet authorised" (:348); a "N earlier Lists not yet authorised" chevron button under the Today heading scrolls back up (:367, `showEarlier`). On mount and chip change the scroller is placed with the Today heading at its top (:238-248). Rows: one per List, grouped by date, AM then PM then OOH (`sessionRank`, :103).
- `viewRow` (:164): a session with a List shows `listRow`; an empty open session shows "<status> session / Open for bookings" chip, not tappable; a closed status shows a day-off row (title = note or status long label). Week/Month show these via Slot views (Phase 28). To-Do/Done use all her assigned future Lists regardless of window (:219-225).
- `inChip` (:211): To-Do = ACTIVE or SUBMITTED List with any non-cancelled Booking not `completed` (so a reopened Booking on a submitted List appears under To-Do); Done = `listProgress === 'submitted'`; authorised Lists appear under no chip. Earlier group is filtered by the same chip.
- `listRowModel` (screens/listRowModel.ts:29): title = hospital name or "Pre-op assessment"; subtitle = surgeon + specialty (private; `surgeonSpecialtyLabel`) or the template note (public/preop keep `list.notes`), plus "N bookings"/"N appointments" count unless upcoming; right side from `listProgress`: `toFinish {count}`, `count`+statusKey (upcoming), or `progress` pill (readyToSubmit, submitted, invoiced, authorised); `quiet` for submitted. Labels from `LIST_PROGRESS_LABEL` (listProgress.ts:42): "To finish", "Ready to submit", "Done · unbilled", "Invoiced", "Authorised".
- "New" badge on a List a colleague moved to her, or one made for a single Booking handed to her (`useMovedToMe`, `useBookingsMovedToMe`, :125, :275).
- Tapping a List row opens List detail; open-session rows are inert (no self-booking).

### 2.3 Look-back: search and date lookup (screens/ListsLookback.tsx; US-03.1.6, US-03.1.7, FT-07.4)
- `LookbackSearchRow`: `type=search` field "Search patient name or NHI" (`data-testid mobile-lists-search`; `useFieldText` keeps caret by typing into local state), clear button, and a calendar icon button "Go to a date".
- Search (`useBookingSearch` -> `searchBookingsFor`, store/lookback.ts:326; parser domain/bookingSearch.ts): min 2 significant chars (`BOOKING_QUERY_MIN_CHARS`); NHI form (via `validateNhi`) matches exact NHI, otherwise name tokens folded (accents, macrons, hyphens, case) all contained in the patient name. Own non-cancelled Bookings only, assigned Lists, any state incl. authorised and invoiced; Upcoming (today on, soonest first) then Past (most recent first); cap `BOOKING_SEARCH_CAP` 50 with `total` shown via `searchCountLine`. Result row = session, time, patient (+WarningTriangle), "date · session · hospital · first procedure", NHI, `ProgressPill`; tap opens the Booking (`/mobile/lists/:l/bookings/:b`).
- Date lookup: `LookbackDateSheet` bottom sheet "Go to a date" with shared `MonthGrid` (dot = a day holding one of her Lists via `listDaysFor`, store/lookback.ts:284), bounds from `lookbackBoundsFor` (her earliest List, seed history back to Jan 2026, to schedule horizon end; :219). Picking sets `?day=`; a `DayChip` (teal, dismissible) replaces the filter chips; `LookbackDayView` lists `listsOnDayFor` (:265; every state incl. backdrop/authorised, AM before PM) as `ListRow`s.
- Empty copy: `DAY_EMPTY`, `SEARCH_EMPTY` (shared/schedule/lookbackCopy.ts).

### 2.4 `ListDetailScreen` (screens/ListDetailScreen.tsx)
Nav row: back "Lists" and a "..." List options button (only when options exist). Title "<hospital> <AM|PM|Out-of-hours>" (`sessionText`), or "Pre-op assessment"; subline surgeon · specialty · Today/date · time range (`useListTimes`, `slotTimeRange`); list-kind `StatusChip`; "Moved to you by ..." line (`useMovedToMeNotice`, `movedToYouByLine`); `AlertOfficeEntry compact statusOnly` (open or resolved alert shown as status; action lives in options); progress bar "n of m complete" (cancelled excluded, :106-108, :161).
- List options sheet (:132-157, `ListOptionsSheet`): "Move this List" if `useIsMovable` (owner, ACTIVE, dated today or later: domain/listMoves.ts:132 `ownMoveRefusal`) -> `movePrompt.openMove(listId)`; "Alert the office" (or disabled "The office has been alerted") when `officeAlertRefusal` (store/officeAlertActions.ts:40) is null or `alreadyAlerted` -> `AlertOfficeSheet` (note required, max 300, US-03.6.3).
- Booking rows sorted by `scheduledTime` then id: time, patient, NHI mono, first Procedure label `procedureLabel(first, rvgGroups, 1)` (first = lowest procedure id, :86) or "Procedure to capture", a contract cue line from `bookingContractCue` (store/selectors.ts:2070: "Needs an invoice destination" if any Procedure lacks `governingContractId`, else "RVG code to fill in"), WarningTriangle (`useListWarnings`), then Cancelled (strikethrough), TickBadge (animates only for Bookings completed since the screen first showed, :64-77), or "Capture" pill.
- Authorised List: an Invoices card from `useListInvoices` -> `invoicesForListView` (store/lookback.ts:386: number, party, issue date, total, paid/part/outstanding), no Add a booking, footer shows lock "<Invoiced|Authorised> · read only" (:384-391).
- "Add a booking" dashed button when `editRefusal(actor,list)===null` (lifecycle.ts:60: own List, state ACTIVE or SUBMITTED, i.e. editable until AUTHORISED, D63) -> shared `AddBookingFlow` (routes.tsx).
- Sticky footer (:384-469): AUTHORISED lock; else not ACTIVE: green "Submitted to office" (also shown for a SUBMITTED List with a reopened Booking, no resubmit control); incomplete>0: grey "Mark list completed · n to finish / Tap to see what is left" -> `SubmitListSheet mode="blockers"`; else teal "Mark list completed" -> `mode="confirm"`. On submit a 1050 ms `SuccessOverlay` "List submitted / Sent to the office for review" (:494). Completion gate (every non-cancelled Booking completed, blockers from `completionBlockersFor`, lifecycle.ts) is enforced in the store/shared sheet, not the screen.
- Returns null for a Draft List (`isAssignedList`, domain/draftLists.ts).
- No List attachments UI exists in this screen any more (grep: attachments only in `shared/flows/AddBookingFlow.tsx` and `shared/booking`).

### 2.5 `BookingDetailScreen` (screens/BookingDetailScreen.tsx)
Phone chrome only: folding masthead (name collapses to a 44px nav row after 24px scroll), back "List", list-kind chip, WarningTriangle, History control passed in by the body, "first procedure · hospital". NHI/DOB are in the shared Patient card, not here. Everything else (capture, procedure stack, contract/rail, modifiers, price, split, validation, complete, cancel, amend, history, move Booking, alert office on a Booking) is `shared/booking` `BookingDetailBody` (not mapped here). Null for a Draft List.

### 2.6 `MobileAvailabilityRoute` + `AvailabilityScreen` (Find cover; routes.tsx:233, screens/AvailabilityScreen.tsx)
- Route hosts Find cover + My calendar in a `SlideStack`, and one `Overlay` bottom sheet holding shared `AvailabilityEditor` (`shot="mobile-availability-sheet"`). "Add days off" opens the editor with `formPreset {sessions:'both', span:'week', statusKey}` where status = `SEED_STATUS.holiday` if offered to anaesthetists else the first non-bookable choice (`useAnaesthetistStatusChoices`, :241-242).
- Screen: 6-day strip from today (dot if any open session that day via `isOpenSlotView`, :63-71), Everyone / Free only toggle (`SlidingSegmentedControl`), "N free sessions on <date>" (count over ALL views that day, including her own), `MovedToYouPanel` (-> list/booking), "My availability" card (her AM, PM and, only when the office opened one, OOH cells; status chip + note or List title; per-session "Move" button when `useMovableSessions` has a movable List -> `movePrompt.openMove(listId)`; "Change <date>" -> editor sheet, disabled with no AM/PM session; "My calendar" -> slide in). Colleague cards: `rosterForDate` minus herself, name order, no tiers; AM/PM(/OOH) cells show status or hospital + surgeon, "Free" badge if any open; a free cell is a button "Tap to move your List here" only when `mine.targetSlotIds` has that slot (domain/listMoves receive rule) -> `openMove(listId,{toSlotId})`. No phone or contact on mobile.

### 2.7 `MyAvailabilityCalendarScreen` (screens/MyAvailabilityCalendarScreen.tsx)
Month grid from current month to horizon end (`useAvailabilityBounds`; month nav clamped). Each day = AM half block over PM (`blockFill` of the status visual, or the List), repeat glyph for series instances, `AttentionDot` for `session.conflict` (a List hit by sickness/closure, Phase 32b). Only AM/PM drawn, OOH is not on this calendar (`hasSessions` = AM or PM, :92). Past and session-less days disabled; tap a day -> editor sheet. Legend = `useAnaesthetistStatusChoices` chips (statuses she may set). "Your series" = shared `SeriesList` (repeating days off). Sticky "Add days off" (from today, or the 1st of a later month). Data: `useAvailabilityMonth(id, month)`.

### 2.8 `BalancesScreen` (screens/BalancesScreen.tsx)
"Your account / Balances". Card "Outstanding to you" = `receivablesAgingFor(...).aging.total` + count of unpaid invoices. Toggle Outstanding / GST this month. Outstanding: flat card list from `outstandingAccpayInvoicesFor`: patient, outstanding amount, "invoice no · counterparty label", age chip `Nd` (warning tint when >60), "ACC" chip when `accFunded`. GST: calendar month from the 1st to today via `gstActivityFor`: each receipt gross + GST, total gross, GST component. Empty copy "No outstanding invoices. A List's invoices show here once the office authorises it." Read only. No payment history, AA fee invoices or export on mobile.

### 2.9 `MoreScreen` (screens/MoreScreen.tsx)
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
| `/web/accounts/:subTab` (overdue, payments, gst, fees; `?invoice=` highlights a row) | `WebAccountsRoute` (invalid sub-tab not found) | :199 |

Back navigation carries router state `{from, listFrom}` so Back from List or Booking returns to the same search or day (`lookbackState`, routes.tsx:76-89; deep links fall back to the plain parent). `?week=` is a Monday anchor (`mondayOf`), stepping uses replace.

### 3.1 `DashboardScreen` (screens/DashboardScreen.tsx)
"Kia ora, Dr Souter" + summary line: date · n lists today · n bookings · n awaiting submission (:90-102: today's Lists not yet authorised (`hasLeftMainView`), non-cancelled bookings, "awaiting" = ACTIVE with bookings all complete). "Move a List" button (disabled when none movable) -> "Which List?" overlay of `useMovableLists(id,6)` -> `movePrompt.openMove`. Panels:
- `WeekStrip` (components/WeekStrip.tsx): 7 Monday-anchored days, AM/PM (+ opened OOH) from `slotViewsForAnaesthetist`; a List block shows hospital + surgeon (or template note) + session + time range and clicks through to List detail; empty sessions show status (Free dashed); a whole-day closed status merges into one tall block (`mergedHoliday` :102); today outlined crimson; a submitted List keeps its block, quieter, with tick and accessible name "Done · unbilled" (`submittedDone` :64); an authorised List disappears (`slotFor` :56). Prev/next week.
- Receivables aging (7 cols): `receivablesAgingFor`; four bars Current / 31 to 60 / 61 to 90 / 90+ (`AGING_ROWS` :31), total, "n accounts over 60 days" + link to `/web/accounts/overdue`.
- Productivity (5 cols) and Leave (5 cols): SEEDED figures (`useDashboardFigures`): units, % change pill, lists, avg units per list, fees invoiced, 6-month units and % vs last year; leave ranges with Approved/Pending pill. Not derived from bookings or availability.
- Who's free next 5 days (7 cols, live): colleagues' open sessions per day+session (`openSlotViews`, AM/PM/OOH), chips by surname; a chip is a button when her List that session can move there (`useMoveTargets`, :76) -> `openMove(listId,{toSlotId})`; the title attribute carries the colleague's phone (`masters.anaesthetists.phone`). Link "Full availability grid".

### 3.2 `ListsScreen` (screens/ListsScreen.tsx; W2, US-07.4.2, US-03.1.4)
Header, `WebSearchField` ("Search patient name or NHI"), `WebGoToDate` (native `type=date`, bounded by `useLookbackBounds`; partial-year typing ignored), and a "To" date input (main mode, default today +28 days; empty means unbounded, :112). Same `mainViewFor` and `listProgress` as mobile. Table columns Date, Session, From, To, Description, Status (`StatusChip`), Progress (`ProgressPill`). Earlier group "Earlier, not yet authorised" then "From today". Times shown only when a List exists or times are overridden. Rows with a List are clickable (date cell is also a button for keyboard); a submitted List row is `data-quiet`; an OOH row has `data-shot="out-of-hours-row"`. Empty sessions: `emptySessionLine`. Description = hospital · surgeon · specialty (public/preop use `notes`).

### 3.3 `ListsLookback.tsx` (web)
`WebResultsTable` (columns Date, Session(+time), Patient(+warning), NHI, Hospital, Procedure, Progress; Upcoming then Past groups; `data-booking-id`), `WebDayTable` (Session, Time, Location, Bookings count, Status, Progress via `listsOnDayFor`), `WebDayChip`. Same store selectors as mobile; search count "N matches" via `searchCountLine`; "Clear search" button.

### 3.4 `ListDetailView` (screens/ListDetailView.tsx)
Back "Lists", H1 "<hospital> <session>" + kind chip, subline, moved-to-you line, `AlertOfficeEntry compact` (action visible on web), "Move this List" button (`useIsMovable`), `SubmitAction` (:355: AUTHORISED lock "<Invoiced|Authorised> · read only"; not ACTIVE green "Submitted to office"; blocked "n to finish before submitting" -> blockers sheet; else "Mark list completed" -> confirm; same `SubmitListSheet`). Bookings Panel: progress bar; table Time, Patient (+NHI or "NHI pending" + warning), Procedure (+"+n more", + contract cue), then for non-authorised Units and Fee per Booking from `bookingFee(procs, list, masters, billingLines, patientId)` (shared/capture/feeContext.ts:81; cancelled shows "·"; no price on the date shows `NEEDS_PRICE_LABEL` "Needs a price", domain/billing/priceRanges), for AUTHORISED an "Invoiced" column from `useListInvoices` sums instead (not a recomputed fee); Status Cancelled / Complete+tick / Capture; Totals row. "Add a booking" (when `editRefusal` null) opens shared `AddBookingFlow` as a dialog. AUTHORISED shows an Invoices Panel. Route guards the Draft/colleague case (`WebListDetailRoute`); the view itself returns null for DRAFT. No attachments panel.

### 3.5 `BookingDetailView` (screens/BookingDetailView.tsx)
Back "List"; H1 patient name + warning triangle; mono `nhiBadge` + "DOB <date> (<age>y)" (`ageYears(dob, todayISO)`); first procedure · hospital; kind chip + History (from body). Body is shared `BookingDetailBody`.

### 3.6 `AvailabilityGrid` (Find cover, W3)
Title, `AvailabilityPageSwitch`, day prev/next/Today (initial `?date=` ignored if before today; no limit forward), `MovedToYouPanel`, chips All anaesthetists / "Free only · count" (count of open sessions, `isOpenSlotView`, AM+PM+OOH), `NameSearchBox` (`matchesNameQuery`), `StatusLegend`. Rows = `rosterForDate` sorted by name including her own (`availability-row-mine`, "(you)" and a "Change" link to `/web/availability/mine?date=`). Columns AM, PM and an "Out-of-hours" column only when someone has an OOH session that day. Cell: status + "Open for booking", hospital + surgeon (or template note), "Pre-op clinic". A cell is actionable only for move: her own List cell ("Move") or a colleague's free session her List can receive into ("Move here") -> `openMove`. Status only for colleagues; no booking or patient detail.

### 3.7 `MyAvailabilityCalendar` (web)
Month Panel clamped to today..horizon (+ "Today" button), click a day, shift-click extends a range (`pick`/`anchor`), per-day AM/PM cells (label, hospital or series line or note, repeat glyph, `AttentionDot` conflict); right rail 340px: empty prompt or shared `AvailabilityEditor` (`shot="web-availability-rail"`) for the range, "Your series" `SeriesList`, Legend. Past and session-less days disabled. OOH not shown here either. Copy: "Every session is <default status> until you change it".

### 3.8 `AccountsScreen` (screens/AccountsScreen.tsx)
URL-driven sub-tabs:
- Overdue: `receivablesAgingFor` rows, one per outstanding ACCPAY invoice (no rollup), ordered by `raisedAtISO`; amount in its bucket column (Current / 31-60 / 61-90 / 90+), ACC flag from `accFunded`, totals row, Outstanding total. Empty: "No outstanding accounts. A List's invoices show here once the office authorises it."
- Payments: `paymentHistoryFor` (selectors.ts:1114): date received, invoice, patient, payer, "Received by AA", "Released to you" (`authorisedAmount`), "Paid to you" (`disbursedAmount`), status chip (`PAYMENT_STATUS_LABEL` :175: Part payment received / Customer paid / Part paid to you / Paid to you). `?invoice=` highlights `payment-history-row-<no>`. Caption says AA releases everything it receives in full and links to the AA fees tab.
- GST activity: `Segmented` Monthly / Bi-monthly / Six-monthly, default from `masters.anaesthetists[id].gstPeriod`; window = rolling N calendar months ending today (`periodWindow` :385, not GST filing periods); rows (date, invoice, payer, gross, GST) + period total.
- AA fees (US-10.3.2): `aaFeeInvoicesFor` (selectors.ts:1582): invoice no., month, BCTI count, fixed charges (`aaFeeFixedTotal`), per-BCTI charge (subtotal minus fixed), fee ex GST, GST, total, Paid <date>/Unpaid, footer unpaid total incl GST. `?invoice=` highlights `aa-fee-history-row-<no>`. Read only, no pay action.
No statements, PDFs, invoice download or dispute actions in either app.

## 4. Rules, statuses, calculations
- List lifecycle visible: DRAFT (office only, never shown: `isAssignedList`, route guards, `apps/draftListBoundary.test.ts`) -> ACTIVE -> SUBMITTED -> AUTHORISED. The anaesthetist submits (ACTIVE only) and edits Bookings while ACTIVE or SUBMITTED (`editRefusal`, store/lifecycle.ts:60-81); AUTHORISED is locked and read only; no authorise anywhere in these apps.
- Main view exit = office AUTHORISE, not billing stamp (`hasLeftMainView`, domain/listProgress.ts:18; OQ-31, D9 as changed 16 Oct). Authorised Lists then reachable only by search or day lookup.
- `listProgress` (domain/listProgress.ts:55): AUTHORISED -> invoiced (billedAtISO) or authorised; SUBMITTED -> toFinish if any Booking incomplete else submitted; ACTIVE with no Bookings -> upcoming; all complete -> readyToSubmit; else toFinish only if dated today or earlier, otherwise upcoming. Read by mobile rows, web table, week strip, search rows, `ProgressPill`.
- Slot views (store/selectors.ts:140-260): `SlotView {slot, list?, displayKey, times, open}`; a session holding a List shows the List kind (private/public/preop) in place of the status; `open` = open-for-bookings status and no List. Statuses are a master (`domain/slotStatus.ts`, `SEED_STATUS.holiday`); an anaesthetist can set only the statuses `useAnaesthetistStatusChoices` returns. Sessions are AM, PM and OOH (`domain/outOfHours.ts`; OOH appears only on days the office opened one; Phase 32c).
- Moving a List (Phase 32): owner only, ACTIVE, today or later (`ownMoveRefusal`, domain/listMoves.ts:132); targets are colleagues' free sessions passing the receive rule (`receiveRefusal` :101, `pushTargets` :169); notice windows via `movedToMe` (store/notifications.ts:208) and audit-based `bookingsMovedToMe`. A moved List leaves her schedule (route guards compare `anaesthetistId`).
- Office alert (US-03.6.3): `officeAlertRefusal` (store/officeAlertActions.ts:40): only the owner, not Draft, not AUTHORISED, one active alert per target, note 1 to 300 chars.
- Money: `accpayRowForCase` (selectors.ts:969) builds a row only for a case with `invoiceId` and `accRecId`, an invoice with `raisedAtISO`; `agingDays` = days since raised; buckets `bucketForAgingDays`; outstanding = total minus received; an authorised List's invoices appear at once (Phase 38a). "Over 60" count uses `agingDays > 60` (:1030-1040). `accFunded` comes from `archivedAccRelated` or the Procedure's Contract tag (`procedureAccFunded`).
- Per-Booking units/fee (web List detail only): `bookingFee` (shared/capture/feeContext.ts:81) wraps the pure billing maths in `domain/billing/`; cancelled = 0; unpriced -> "Needs a price".
- Search folding and NHI detection: domain/bookingSearch.ts (`parseBookingQuery`, `patientMatches`, `foldName`).
- Format: names via `shared/format` (`drSurname`, `initialsOf`, `nhiBadge`, `formatCurrency`, `dayWithYear`); copy uses `·` and "to"; time from `useToday()` (demo clock), never `new Date()`.

## 5. src/shared and store pieces used (not documented here)
- Lists/List/Booking: `shared/flows` (AddBookingFlow, SubmitListSheet, MoveListPromptProvider/useMoveListPrompt, useIsMovable, useMovableSessions, useMovableLists, useMoveTargets, useMovedToMe, useBookingsMovedToMe, useMovedToMeNotice, useOwnBookingInView, movedToYouByLine, MovedToYouPanel, AlertOfficeEntry/AlertOfficeSheet), `shared/booking` (BookingDetailBody), `shared/schedule` (ListRow, ProgressPill, ListInvoices/useListInvoices, useBookingSearch, useLookbackBounds, useFieldText, lookbackCopy, OutOfHoursMoon), `shared/calendar` (MonthGrid), `shared/warnings` (WarningTriangle, useListWarnings, useBookingWarnings, AttentionDot), `shared/ui` (TickBadge, DockSpacer, SuccessOverlay, EmptyState, SlidingSegmentedControl, NameSearchBox, Segmented), `shared/surface` (BottomSheet, OverlayHeader, SheetActions, useSurface Overlay), `shared` (StatusChip, StatusLegend, resolveDisplayStatus, useDisplayStatus, useDefaultStatus, blockFill, Avatar, DemoBadge, Logo, emptySessionLine).
- Availability (both apps): `shared/availability` (AvailabilityEditor, SeriesList, monthCells, useAvailabilityMonth, useAvailabilityBounds, describeDayForScreenReaders).
- Web: `shared/capture` (`bookingFee`), `shell/RequireEntity`, `shell/routeParams` (`isISODate`).
- Store reads: `store/selectors.ts` (`slotViewsForAnaesthetist`, `slotViewsForDate`, `openSlotViews`, `rosterForDate`, `timesForList`, `receivablesAgingFor`, `outstandingAccpayInvoicesFor`, `gstActivityFor`, `paymentHistoryFor`, `aaFeeInvoicesFor`, `bookingContractCue`), `store/lookback.ts` (`mainViewFor`, `listsOnDayFor`, `listDaysFor`, `lookbackBoundsFor`, `searchBookingsFor`, `invoicesForListView`; `changedSinceSubmitted` exists there but is NOT used by these screens), `store/lifecycle.ts` (`editRefusal`), `store/officeAlertActions.ts` (`officeAlertRefusal`).

## 6. Demo, test and simulator affordances
- Photo capture demo trigger (routes.tsx:74-81): `useDemoTriggerMemory.photoCaptureRequest {listId,n}` (set from the demo panel, `shared/demoTriggers/memory.ts:21`) opens Add a booking in `photo` mode for the List currently open (only when the URL's List matches). The List's own "Add a booking" never reaches photo (US-02.4.4 is Future Work).
- More tab `moreExtra` slot gives the PWA its clock/reset/office-simulation controls (`pwa/PwaDemoPanel.tsx`); the framed prototype uses the harness bar.
- Screenshot and test hooks: `data-shot` and `data-testid` attributes throughout (grep `data-shot=` in each screen; notable: `mobile-lists-search`, `mobile-lists-day-chip`, `mobile-main-view-earlier`, `list-options`, `list-move`, `list-alert-office`, `list-row-contract-cue`, `list-authorised-status`, `list-submission-overlay`, `availability-move-to-<id>`, `dashboard-move-list`, `web-lists-search`, `web-lookback-search`, `out-of-hours-row`, `payment-history-row-<inv>`, `aa-fee-history-row-<inv>`).
- Boundary tests in `apps/`: `draftListBoundary.test.ts`, `moneyViewPurity.test.ts`, `noSlotCopy.test.ts` (no "slot" in copy, no pairing fallback), `officePrivacy.test.ts` (allowlist scan; mobile and web open history only through shared Booking detail), `outOfHoursScreens.test.tsx`.

## 7. Stubbed, hardcoded, visual-only, absent
- Persona hardcoded to Dr Souter in both apps; no auth, profile, preferences, notification centre, sign-out. More tab = persona card + demo note. WebNav avatar and name are decorative.
- Dashboard Productivity and Leave are seeded demo figures (`state.dashboards`; `deriveDashboardFigures` ages them with the demo clock); no link to bookings or availability changes; Approved/Pending is seeded text with no leave-request workflow.
- GST report window is rolling months, not tax periods; `gstPeriod` only sets the default tab.
- Mobile Balances has no history, AA fees or export; web Accounts has no statements, PDFs, downloads or disputes. Overdue/aging only counts ACCPAY rows with `accRecId`.
- Phone numbers of colleagues appear only in a Dashboard chip tooltip (web).
- Open-session rows on mobile Forward Lists and the web Lists table are not actionable (no self-booking, no "add a List"); a Booking can only be created inside an existing assigned ACTIVE/SUBMITTED List. Photo capture is demo-only.
- A SUBMITTED List shows "Submitted to office" in the footer even when a Booking was reopened (the To finish status is on rows and chips, not the footer); no explicit "resubmit".
- My calendar (mobile and web) ignores OOH sessions; OOH shows on Find cover, Forward Lists, Dashboard strip only.
- Search is client-side over the whole in-memory schedule; no pagination beyond the 50 cap; no calendar sync, printing or messaging.
- Absent here: List attachments (removed from List detail), contract or fee-schedule viewer, patient master search, ward/theatre detail, profile editing.
- Comment drift: some comments still cite old phase numbers (e.g. "Phase 10 replaces receivables" in DashboardScreen.tsx header); MoreScreen comment "deeper settings are out of prototype scope".

## 8. Tests in this area
- `apps/mobile/components/SlideStack.test.tsx` (17 tests, edge-swipe: mouse ignored, edge zone, axis lock, velocity commit, pointercancel, reduced motion, inert parked layers).
- `apps/mobile/screens/ForwardListsScreen.test.tsx`: main view earlier group above Today (quiet, "Done · unbilled"), Today anchor and scroll-back hint, reopened Booking under To-Do not Done, Done chip and authorised in no chip, `?q=` search (Upcoming/Past, replace), tap result -> Booking, back to List then results, `?day=` day view and chip, junk `?day=`, date sheet, submitted List stays editable (Add a booking, Amend), colleague's Booking falls back, authorised List shows Invoices and no Add a booking.
- `apps/web/screens/ListsScreen.test.tsx`: earlier group + Progress column, NHI search and Clear, day view and Back, Back from search result, authorised List detail Invoices, colleague Booking not found, week strip "Done · unbilled" and authorised leaves the strip.
- `apps/web/screens/AccountsScreen.test.tsx`: S3 payment stays in Payments after `receivePayment` + `disbursePayable`; AA fees tab rows and focus; caption link to fees.
- No unit tests for Dashboard, AvailabilityGrid, My availability, Balances, ListDetail screens, or the web ListDetailView; behaviour covered by shared and store tests and Playwright.
