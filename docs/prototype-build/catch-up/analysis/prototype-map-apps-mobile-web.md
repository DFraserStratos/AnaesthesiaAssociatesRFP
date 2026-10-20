# Prototype map: Anaesthetist Mobile App and Anaesthetist Web App

All paths relative to `aa-prototype/src/` unless stated. Re-verified against the code at HEAD `d4db277` (after catch-up Phases 28 to 32; this REPLACES the earlier 3d3a18c map, which was stale: no Slots, no `ACTIVE` state, no cover requests now). The code is the truth; comments cite old phases and are not proof. Vocabulary in code: **Booking** (was Card), **List** (`kind` private|public|preop; `state` DRAFT|ACTIVE|SUBMITTED|AUTHORISED), **Slot/session** (UI says "session"; AM/PM half-day per anaesthetist per day), **Draft List** (office only).

**Orientation.** Both apps run as ONE persona, Dr Melanie Souter (reg no `34821`, initials MS; `shell/appConfig.ts:27`, `APP_CONFIG.mobile.persona` / `.web.persona`). Each layout builds `Actor {who, role:'anaesthetist', source:'anaesthetist', anaesthetistId}` (`apps/mobile/MobileApp.tsx:~92`, `apps/web/WebApp.tsx:~42`) and hands it to screens via router outlet context (`mobile/outlet.ts`, `web/outlet.ts`). No login, no other anaesthetist persona, no role switching. Screens read `useAppStore` slices and write only through store actions (audited `mutate()`). Reads are scoped to her own Lists/Bookings, except the two Find-cover/availability views which show ALL anaesthetists' session STATUS only (hospital and surgeon appear on a colleague's booked session; no patient data). All "Slot" reads go through the one set of selectors `slotViewsForAnaesthetist/slotViewsForDate/openSlotViews/rosterForDate` (`store/selectors.ts:172-214`), so every view agrees on what "free" means. Mobile = 4 tabs (Lists = 3-layer slide stack, Availability = 2-layer stack, Balances, More). Web = 4 nav tabs (Dashboard, Lists with List/Booking drill-down, Availability with two pages, Accounts with 4 sub-tabs). **Booking capture itself (patient, procedures, BTM, times, units, billing lines, validation, complete/amend/cancel/copy, history, prepayment banner, post-op addendum) is NOT in these folders**: both apps wrap the same `shared/booking/BookingDetailBody.tsx` (774 lines), so behaviour is identical on both. The anaesthetist-side availability editor, series, List-move flow and sheets are also shared (`shared/availability/`, `shared/flows/`); entry points noted below.

## Contents
1. Routes at a glance
2. Mobile app (shell, Forward Lists, List detail, Booking detail, Availability, My calendar, Balances, More)
3. Web app (shell, Dashboard, Lists, List detail, Booking detail, Availability: Find cover, My availability, Accounts)
4. Shared components/flows used here (entry points only)
5. Store actions, selectors and hooks called from this area
6. Business rules and calculations visible here
7. Demo and simulator affordances
8. Stubbed, hardcoded, seeded, visual-only
9. Not present in these apps

## 1. Routes at a glance

Route table: `router.tsx:81-98` (web), `:137-145` (mobile). Transient sheets/dialogs are local state, not routes.

| App | Route | Component (file) | Notes |
|---|---|---|---|
| Mobile | `/mobile` | `<Navigate to="lists">` | `MobileApp host={PhoneFrame}` layout; PWA mounts same app with `MobileViewport` (`host` prop required) |
| Mobile | `/mobile/lists/*` | `MobileListsRoute` (`mobile/routes.tsx:28`) | ONE splat route hosting 3-layer `SlideStack`; depth from URL via `listsStackLocation` (`navigation.ts:50`) |
| Mobile | `/mobile/lists/:listId` | same route, depth 1 = `ListDetailScreen` | stale/DRAFT/not-own list redirects to `/mobile/lists` (`routes.tsx:55-61`) |
| Mobile | `/mobile/lists/:listId/bookings/:bookingId` | same route, depth 2 = `BookingDetailScreen` | missing booking redirects to the list; old `/cards/` URL via `LegacyBookingRedirect` |
| Mobile | `/mobile/availability` | `MobileAvailabilityRoute` (`routes.tsx:~140`) depth 0 = `AvailabilityScreen` ("Find cover") | |
| Mobile | `/mobile/availability/calendar` | same route, depth 1 = `MyAvailabilityCalendarScreen` | `availabilityStackLocation` (`navigation.ts:~44`); day sheet = shared `AvailabilityEditor` in a bottom sheet |
| Mobile | `/mobile/balances` | `MobileBalancesRoute` -> `BalancesScreen` | |
| Mobile | `/mobile/more` | `MobileMoreRoute` -> `MoreScreen` | |
| Web | `/web` (`?week=<ISO>`) | `WebDashboardRoute` (`web/routes.tsx:~30`) -> `DashboardScreen` | week anchor Monday-normalised; stepping uses `replace` |
| Web | `/web/lists` | `WebListsRoute` -> `ListsScreen` | |
| Web | `/web/lists/:listId` | `WebListDetailRoute` -> `ListDetailView` | `RequireEntity`: not-found unless assigned (non-DRAFT) AND `anaesthetistId` = hers |
| Web | `/web/lists/:listId/bookings/:bookingId` | `WebBookingDetailRoute` -> `BookingDetailView` | exists-check is only "booking exists and its List is assigned" (does NOT check it is her List); `/cards/:cardId` -> `LegacyBookingRedirect` |
| Web | `/web/availability` (`?date=`) | `WebAvailabilityRoute` -> `AvailabilityGrid` ("Find cover") | `?date` only honoured if >= today |
| Web | `/web/availability/mine` (`?date=`) | `WebMyAvailabilityRoute` -> `MyAvailabilityCalendar` | `?date` opens that day selected in the right rail |
| Web | `/web/accounts` | redirects to `/web/accounts/overdue` | |
| Web | `/web/accounts/:subTab` | `WebAccountsRoute` -> `AccountsScreen` | subTab `overdue|payments|gst|fees`, else not-found; `?invoice=<invoiceNumber>` highlights a Payments or AA fees row |

## 2. Mobile (`apps/mobile/`)

### Shell: `MobileApp.tsx`, `navigation.ts`, `outlet.ts`, `routes.tsx`, `components/`
- `MobileApp` layout: `SurfaceProvider variant="mobile"` (shared sheets render as bottom sheets), `<Host>`, `MoveListPromptProvider actor` (the ONE List-move sheet, rendered above screens and tab bar; `shared/flows/MoveListPrompt.tsx`), `Outlet` context `{actor, anaesthetistId, personaName, personaRole, initials, moreExtra}`.
- `BottomTabBar` (`MobileApp.tsx:25`): Lists, Availability, Balances, More. Hidden when Lists stack depth > 0 or Availability stack depth 1 (`showTabBar`, ~L132). No badges/counts.
- `MobileListsRoute` owns `AddBookingFlow` open state (+ mode `manual|photo`, resetKey). Pops use `navigate(..., {replace:true})`; edge-swipe-back wired to same handlers (`popLayer`).
- `MobileAvailabilityRoute`: owns the day bottom-sheet `{fromISO, addDaysOff?}` rendering shared `AvailabilityEditor` (`shot="mobile-availability-sheet"`). "Add days off" presets `{sessions:'both', span:'week', statusKey}` where statusKey = the status with fixed id `holiday` if offered, else first non-bookable choice (`useAnaesthetistStatusChoices`).
- `SlideStack.tsx`: all layers stay mounted, transform-animated; edge-swipe-back (28px edge zone, 10px axis lock, commit at 35% width or 0.5px/ms). Test `SlideStack.test.tsx`.
- `components/index.ts` re-exports shared primitives under mobile names; mobile-only: `SlideStack`, `MobileHeader` (eyebrow, 26px title, MS avatar).

### Forward Lists: `screens/ForwardListsScreen.tsx` (Lists tab, depth 0)
- Greeting "Kia ora, Dr Souter" (`drSurname`), eyebrow `dayHeading(today)`. Filter pills Week | Month | To-Do | Done (L13-19, default Week).
- **Week / Month** walk her SESSIONS (Slots) via `slotViewsForAnaesthetist(..., today, today+7d | today+31d)` (L174-179): a session holding a List shows as a booked row (`listRow`, L142), an open session shows `"<Free> session"` / "Open for bookings" with a status chip (not tappable), a closed session (any status not open for bookings, e.g. holiday, unavailable) shows a row titled by the slot note or status long label with a chip, not tappable (`viewRow` L114-140). So days off ARE shown on mobile now.
- **To-Do**: Lists with `state==='ACTIVE'` and any active (non-cancelled) booking not completed; **no date limit** (L88-90). **Done**: `state` SUBMITTED or AUTHORISED, no date limit (L93). To-Do/Done use `mine.filter(listInFilter)` over unbilled Lists, not sessions.
- Billed Lists (`isListBilled`, `billedAtISO` set; `store/selectors.ts:389`) are removed from every filter (L78-80, L115).
- `listRow` (L142-171): title hospital name or "Pre-op assessment"; subtitle surgeon name . specialty (a public List with `notes` shows the notes/template label instead); right slot = `doneUnbilled` (SUBMITTED/AUTHORISED or all active bookings complete), `toFinish N` (date <= today and incomplete), else `count`; preop counts "appointments"; start time from `timesForList` (session defaults 07:30/13:00 or slot override, `domain/slots.ts:25`).
- "New" badge on a List a colleague moved to her in the last 7 demo days (`useMovedToMe`, L52-53, L271; window `MOVED_TO_ME_DAYS = 7`, `domain/notifications.ts:36`).
- Grouped by date, AM before PM. Empty copy per filter (L235-241). No search, no date picker, no patient detail here. Writes: none.

### List detail: `screens/ListDetailScreen.tsx` (depth 1)
- Returns null for a DRAFT/undefined List (`isAssignedList`, L99).
- Header: back "Lists"; "<Hospital|Pre-op assessment> AM|PM"; subline surgeon . specialty . "Today"/ISO date . `slotTimeRange(times)` (`useListTimes`, slot override aware); `StatusChip` of `list.kind`; "N of M complete" bar (cancelled excluded; L91-115).
- **Move this List** button (L151-169) shown when `useIsMovable(listId, anaesthetistId)` (owner, `ACTIVE`, date >= today; `domain/listMoves.ts:ownMoveRefusal`); opens `movePrompt.openMove(listId)`. "Moved to you by Dr X on <date>" line when a colleague moved it (`useMovedToMeNotice`, L153-157).
- Booking rows sorted by `scheduledTime` then id: time, patient name, NHI, primary operation (lowest-id procedure description else "Procedure to capture"), `WarningTriangle` (`useListWarnings`; only rule today is `prepaymentUnpaid`, `domain/warnings/rules/prepaymentUnpaid.ts`). Right: "Cancelled" (struck, 0.6 opacity), animated `TickBadge` if completed (animates only for bookings completed after mount, L56-68), else "Capture" pill.
- **List attachments** panel (L266-283, US-03.1.3): shown when `canEdit` (`list.state==='ACTIVE'`) or list already has attachments; `AddAttachmentButton` -> `AddAttachmentSheet target {kind:'list'}`; remove via `removeAttachment`. Read-only otherwise.
- "Add a booking" dashed row, ACTIVE only (L285-307) -> routes.tsx `AddBookingFlow`.
- Sticky footer (L315-410): `state !== 'ACTIVE'` green "Submitted to office"; incomplete>0 grey "Mark list completed . N to finish / Tap to see what is left" (still tappable, opens blockers sheet); else teal "Mark list completed" (confirm sheet). Both use shared `SubmitListSheet` (mode blockers|confirm), which calls `submitList`. On success `SuccessOverlay` "List submitted / Sent to the office for review", auto-dismiss 1050ms (L47-51) or tap.
- `canEdit` is UI-only; the store re-checks (`editRefusal`, `store/lifecycle.ts:50`).

### Booking detail: `screens/BookingDetailScreen.tsx` (depth 2)
- Phone chrome only; null if booking missing or its List is DRAFT. Back "List"; folding masthead (collapses after 24px scroll into a nav row with name + warning triangle + chip); patient name, `StatusChip` of `list.kind`, History link (supplied by body), "<primary op or 'Operation to capture'> . <hospital>". NHI/DOB are in the body's Patient section, not here. Renders shared `BookingDetailBody` with a `header(collapsed, history)` render prop; `onBack` also fires after the completion overlay. `useBookingWarnings`.
- Body highlights (shared; see shared map): edit rights `canEdit = !cancelled && state !== 'AUTHORISED' && (state==='ACTIVE' || office)` (`BookingDetailBody.tsx:313`); fee/calculation hidden from anaesthetist actors (`showBookingTotal = actor.role !== 'anaesthetist'`, L133); calls `editBooking`, `addProcedure`, `completeBooking`, `uncompleteBooking`, `addPostOpAddendum` (L327-431), `CancelBookingSheet`, `EditPatientSheet`, `EditProcedureSheet`, `RemoveProcedureSheet`, `HistorySheet`.

### Availability ("Find cover"): `screens/AvailabilityScreen.tsx`
- Header eyebrow "Find cover", title "Availability". 6-day strip today..+5 (L58-66), a dot on a day when ANY anaesthetist has an OPEN session (`slotViewsForDate(...).some(isOpenSlotView)`). Segmented Everyone | Free only; summary "N free sessions on <date>" (all anaesthetists, any open session = status open for bookings AND no List; `domain/slotStatus.ts:131 isOpenSlot`).
- Top of scroll: `MovedToYouPanel` (shared; Lists colleagues moved to her in the last 7 days, with message; tap opens the List).
- **My availability** card (L165-205): AM and PM rows each show her session's `StatusChip` + hospital (if List) or slot note, "No session" when no Slot; a **Move** mini-button when she has a movable List that session (`useMovableSessions`); buttons **Change <date>** (opens the day sheet; disabled with no sessions) and **My calendar >** (slides in calendar). The old Free/Block buttons are gone; all edits go through the shared `AvailabilityEditor`.
- Colleague cards (roster of the selected day = anaesthetists with a Slot that day, `rosterForDate`, minus herself, name-sorted): AM/PM cell styled from the status master (`resolveDisplayStatus(...).visual`), title hospital / "Pre-op" / status label / "No session"; subtitle hospital . surgeon, "Open for bookings", or the note/long label. A colleague's OPEN cell becomes a button "Tap to move your List here" when she holds a movable List in that same day+session and the cell is in `targetSlotIds` (the receive rule) -> `movePrompt.openMove(listId, {toSlotId})`. Other cells inert. No cover-request marker (retired by Phase 32; `requestCover`/`coverRequest` no longer exist in code except a persist migration).
- "Free only" filters colleague rows to those with an open AM or PM. Window fixed today..+5; no calendar picker here (My calendar covers months).

### My calendar: `screens/MyAvailabilityCalendarScreen.tsx` (Availability stack depth 1)
- Month grid of her own sessions, bounded today's month to the schedule horizon's last month (`useAvailabilityBounds`; default horizon 4 months, `DEFAULT_HORIZON_MONTHS`, setting `horizonMonths`; `domain/slots.ts:23`). Prev/next month buttons.
- Each day = AM over PM half-blocks (`HalfBlock`, L160) in the status colour (`blockFill`), or the List's kind in place of the status; Repeat glyph on a series instance; amber "!" when the List has a conflict (`session.conflict`). Past days and days without sessions disabled. Tap day -> day bottom sheet (shared `AvailabilityEditor`). Legend of status choices (`useAnaesthetistStatusChoices`, only statuses she may set). "Your series" = shared `SeriesList` (rule in words + Delete). Sticky "Add days off" (preset form; start = today or first of month).
- Data: `useAvailabilityMonth` -> `availabilityMonthFor` (`store/selectors.ts:257`).
- Rules in the shared editor (entry): `AvailabilityForm` -> `setAvailabilityRange` / `createAvailabilitySeries`; `AvailabilitySlotPanel` -> `clearAvailability` / `deleteAvailabilitySeries` (see section 6).

### Balances: `screens/BalancesScreen.tsx`
- Source: billing MIRROR (`store.billing`), never Xero. Header "Your account / Balances".
- Total card: `receivablesAgingFor(...).aging.total` and `outstandingAccpayInvoicesFor(...).length` ("N unpaid invoices").
- Segmented **Outstanding** | **GST this month**:
  - Outstanding: flat card list (no rollup), patient name, outstanding amount, `invoiceNumber . counterpartyLabel`, `AgeChip` (L128: "Nd", amber when `days > 60`; "ACC" chip when `accRelated`). Empty: "No outstanding invoices. Balances appear the day after billing."
  - GST this month: `gstActivityFor(state, id, firstOfMonth, today)` (L40-44): each receipt gross, `d MMM . payer`, GST; footer "GST component"; header "<Month yyyy> received" with `totalGross`. Empty: "No payments received this month yet."
- Nothing tappable. No payment history, invoice detail, payout status, AA fee invoices, or other GST periods on mobile (web has them).

### More: `screens/MoreScreen.tsx`
- Persona card (avatar, name, role), "Demo prototype" `DemoBadge` + fictional-data note, then `extra` slot (PWA injects clock, Reset, office simulation from `pwa/`; the prototype passes nothing). No settings, profile, notification prefs, logout: visual-only.

## 3. Web (`apps/web/`)

### Shell: `WebApp.tsx`, `components/`, `routes.tsx`, `outlet.ts`
- `WebApp`: `SurfaceProvider variant="web"` (shared sheets render as centred dialogs); `minWidth:1240`, content max 1320 (desktop only); wraps `Outlet` in `MoveListPromptProvider`. Context `{anaesthetistId, personaName, actor, todayISO}`. No cover state any more.
- `WebNav` (4 tabs: Dashboard, Lists, Availability, Accounts; crimson underline = identity; persona name + MS avatar, static, no menu/logout/notifications). `Panel` (white card). `WeekStrip` (dashboard week grid). `AvailabilityPageSwitch` (segmented "Find cover" | "My availability", navigates between the two Availability routes).
- `useDashboardFigures.ts`: memoised `deriveDashboardFigures(state.dashboards[id])` (seeded figures; undefined for non-Souter).

### Dashboard: `screens/DashboardScreen.tsx` (+ `WeekStrip`)
- Header "Kia ora, Dr Souter" + summary line (L116): `EEEE d MMMM . N list(s) today . N booking(s) . N awaiting submission`. `daySummary` (L88-100): her Lists dated today with `billedAtISO===undefined` (any state), active bookings, "awaiting" = `ACTIVE` lists whose active bookings are all complete.
- **Move a List** button (L123-143): enabled when she has movable Lists in the next 6 days (`useMovableLists(id, 6)`); opens a picker dialog ("Which List?" with date/session, hospital, surgeon) -> `movePrompt.openMove(listId)`. (Replaces the old "Offer cover".)
- **This week** `WeekStrip` (`components/WeekStrip.tsx`): 7 Monday-anchored columns, AM/PM blocks from her Slots (`slotViewsForAnaesthetist`, same view everywhere); billed Lists hidden (`slotFor` L42-46); colours from the status master (`useDisplayStatus`); labels hospital/surgeon + session, "Pre-op clinic", or status ("Free . AM", long label for closed); time range from `slotTimeRange(view.times)` for Lists and open sessions with overridden times (not for closed days); open/free block dashed; both sessions same closed status with no Lists merge into one tall block; today outlined crimson; prev/next week (URL `?week`). Only a block holding a List is clickable -> `/web/lists/:id` (free/closed blocks inert, a change from the old map).
- **Receivables aging** (L186-220): `receivablesAgingFor`; bars Current / 31 to 60 / 61 to 90 / 90+ with % and amounts; "N accounts over 60 days . view overdue accounts" -> `/web/accounts/overdue`; empty text if no rows. Live from billing mirror.
- **Productivity** (L224-253): seeded tiles UNITS (always-plus `+N%` pill), LISTS, AVG UNITS / LIST, FEES INVOICED, "6 months: N units . +/-N% vs last year" (delta computed in the component). Seed: `domain/seed/anaesthetistDashboard.ts:48-58` (period label "July so far", 274 units, 21 lists, $7,261, 6-month 1542 vs 1455), Souter only; "No productivity history yet" for others. NOT derived from bookings.
- **Leave** (L256-277): seeded rows (24-26 Jul "Annual leave" Approved; 14-16 Sep "NZSA conference" Pending); read-only; no request/approve action; not linked to availability statuses or Slots (that is My availability).
- **Who's free . next 5 days** (L101-120, L279-345): live `openSlotViews` per day+session for OTHER anaesthetists (name order, no tiers); chip per colleague (surname). Chip becomes a button when she has a movable List in that day+session and the slot is in her `useMoveTargets` (`moveTargets`) -> `movePrompt.openMove(listId, {toSlotId})`, tooltip "Move your PM List to Dr X . phone"; otherwise an inert chip with tooltip "You have no List in this session". Link "Full availability grid ->" -> `/web/availability`.

### Lists: `screens/ListsScreen.tsx`
- Table of her sessions (Slots) in a From/To native date range (default today to +28d; cleared input = unbounded) via `slotViewsForAnaesthetist` (L69-77): Date (status colour bar, "Today"), Session, From, To (session times, shown only when a List is present or times overridden; else a dot), Description (`describe` L54-63: `emptySessionLine` for empty sessions, "Pre-op assessment clinic . location" or notes for preop, hospital . surgeon . specialty), `StatusChip` (displayKey = List kind or slot status). Billed Lists filtered out. `StatusLegend variant="chips"`. Only rows holding a List are clickable -> `/web/lists/:id`. No status/hospital filter, no search. Shows free and closed sessions too (the "two per day rhythm").

### List detail: `screens/ListDetailView.tsx`
- Header (title AM|PM, `StatusChip` of kind, subline incl. `slotTimeRange`), "Moved to you by ..." line, top-right **Move this List** (`useIsMovable`) and `SubmitAction` (L271+): non-ACTIVE "Submitted to office" / `N to finish before submitting` (opens blockers `SubmitListSheet`) / "Mark list completed" (confirm). No success overlay on web.
- Model is undefined (renders null) for DRAFT lists (L77). Route layer also blocks other people's Lists.
- "Bookings" panel: progress bar + table Time, Patient (+NHI or "NHI pending", `WarningTriangle`), Procedure ("+N more"), **Units**, **Fee**, Status (Cancelled / Complete + tick / Capture pill); totals row over non-cancelled bookings (L215-229). Units and fee per booking from `bookingFee(procs, list, masters, billingLines)` (`shared/capture`): a LIVE calculation shown to the anaesthetist. NOTE `BookingDetailBody` hides the fee from anaesthetist actors (`showBookingTotal`), but this table does not, so the web list view exposes fees the booking view hides.
- "Add a booking" (ACTIVE only) -> `AddBookingFlow` dialog. **List attachments** panel same rules as mobile (`AddAttachmentSheet`, `removeAttachment`).

### Booking detail: `screens/BookingDetailView.tsx`
- Page header: patient name + warning triangle, mono line `nhiBadge(nhi).text . DOB dd/mm (age y)` (`formatDob`, `ageYears(dob, todayISO)`), primary op . hospital, `StatusChip` (list kind), History action (from body), back "List". Then `BookingDetailBody` (full width). Unlike mobile, returns null only if booking/List missing (route layer handles DRAFT).

### Availability, page 1 "Find cover": `screens/AvailabilityGrid.tsx`
- Page title "Availability" with `AvailabilityPageSwitch`; day nav (prev/next/"Today", weekday label); `MovedToYouPanel`; filters "All anaesthetists" | "Free only . N" (N = open sessions across the roster that day), name search, `StatusLegend` chips.
- Rows = `rosterForDate` (anaesthetists with a Slot that day, seeded cast order then surname; sorted by name in the grid) x AM/PM cells (`Cell`, L214). Cell label: hospital + surgeon (or public template notes), "Pre-op clinic", status label + "Open for booking", or closed long label + note, "No session". Open cells dashed.
- Her own row marked "(you)" with a **Change** link -> `/web/availability/mine?date=<selected>`. Cell actions (the only clickable cells): her own movable List cell = "Move"; a colleague's open cell that is in her List's `targetSlotIds` = "Move here" (`movePrompt.openMove(listId, own ? undefined : {toSlotId})`). Other cells disabled.
- All reads status only (no booking/patient detail leak). Name order only, no tiers (US-01.3.6 office ranking is Admin only).

### Availability, page 2 "My availability": `screens/MyAvailabilityCalendar.tsx`
- Month calendar (today's month to horizon month; prev/next/"This month") of her sessions, each day AM+PM `DayCell` (status bar, label, series line or note or hospital, Repeat icon, amber "!" for a List conflict). Click a day to select; shift-click extends to a range (`selection`, `anchor`). Past/empty days disabled.
- Right rail (340px): `AvailabilityEditor` for the selection (single day opens on the session panel; range opens the form with `toISO`), else a hint; `SeriesList` "Your series"; Legend of statuses she may set (`useAnaesthetistStatusChoices`) with default status label ("Every session is Free until you change it").

### Accounts: `screens/AccountsScreen.tsx` (test `AccountsScreen.test.tsx`)
- Sub-tabs Overdue / Payments / GST activity / AA fees (route-driven; `AccountsSubTab`).
- **Overdue** `OverdueTable` (L84): `receivablesAgingFor`: one row per outstanding ACCPAY invoice, oldest first, no rollup: Invoice, Patient, Payer, Raised date, amount in its aging bucket column (Current / 31 to 60 / 61 to 90 / 90 +), ACC flag; footer per-bucket totals + grand total. Empty: "...appear here the day after they are billed."
- **Payments** `PaymentsTable` (L178): `paymentHistoryFor` (`selectors.ts:1029`): Date received, Invoice, Patient, Payer, **Received by AA**, **Released to you** (`releasedAmount` = `authorisedAmount`, "exactly what it received"), **Paid to you** (`disbursedAmount`), status pill (`partPayment` "Part payment received", `customerPaid`, `partPaidOut` "Part paid to you", `paidOut` "Paid to you"). Newest first; `?invoice=` highlights a row (`data-testid payment-history-row-<inv>`). Footnote: AA's own fee is invoiced monthly separately (link to AA fees). NO fee deduction column any more (AA fee is a separate monthly invoice, never netted).
- **GST activity** `GstReport`: Segmented Monthly / Bi-monthly / Six-monthly, default from `masters.anaesthetists[id].gstPeriod` (Souter `monthly`, `domain/seed/cast.ts`); rolling window start of month (N-1 months ago) to today (`periodWindow`); rows from `gstActivityFor`: date received, invoice, payer, amount received, GST component, period totals. Switching period is local state only (not saved).
- **AA fees** `AaFeesTable` (catch-up Phase 16; US-10.3.2; `data-shot web-accounts-aa-fees`): `aaFeeInvoicesFor` (`selectors.ts:1410`): Invoice, Month, BCTIs, Fixed charges (`aaFeeFixedTotal(settings)`), Per-BCTI charge (subtotal minus fixed), Fee ex GST, GST, Total, status Paid <date> | Unpaid; footer "Unpaid AA fees (incl GST)". Shows as soon as raised (no next-day delay). Explanatory copy: fixed charges plus a charge per BCTI paid that month; a separate invoice paid into AA's account, never deducted. Reads mirror only.

## 4. Shared components/flows used here (entry points only)
- `shared/booking/BookingDetailBody.tsx`: both apps (see section 2 Booking detail). Prepayment is a warning, never a block (`domain/warnings`, `useBookingWarnings`).
- `shared/flows/SubmitListSheet.tsx`: blockers mode lists each incomplete non-cancelled booking with `completionBlockersFor` messages; confirm mode; calls `submitList`.
- `shared/flows/AddBookingFlow.tsx`: manual form (`ManualBookingForm`, NHI lookup via `domain/nzhis`) -> `createBooking`. Photo prong (`PhotoCaptureFlow`, canned `sampleExtractions.ts`, fake processing) is reachable ONLY via `initialMode="photo"` from the demo action; the List's own "Add a booking" always opens manual.
- `shared/flows/MoveListPrompt.tsx` (provider), `MoveListSheet.tsx`, `useListMoves.ts`, `MovedToYouPanel.tsx`: anaesthetist's own List move (catch-up Phase 32). Sheet steps: where (office | colleague, colleagues from `pushTargets`), vacated-session choice (Free default | Unavailable; `VACATED_SESSION_CHOICES`, OQ-84 marked provisional in `domain/listMoves.ts`), optional message, confirm, done ("Returned to the office" | "Moved to Dr X"). Actions: `moveListToOffice`, `pushListToSlot`, `markUnavailableAndMoveList` (`store/listMoveActions.ts:208,222,240`).
- `shared/availability/`: `AvailabilityEditor` (day panel then form, both apps), `AvailabilityForm` (status choice, sessions AM|PM|Both, date range with quick chips Day/Week/2 weeks, Repeat none | every week | every 2 weeks | more with weekdays and Until date, optional note), `AvailabilitySlotPanel` (Change / Remove for one-offs; Change this one / Delete this one / Delete the series for series instances), `SeriesList`, `describeAvailabilityOutcome`, `monthCells`, hooks `useAvailability*`.
- `shared/attachments/` (`AttachmentStrip`, `AddAttachmentSheet`, `AddAttachmentButton`): simulated picker (bundled sample files).
- Primitives: `StatusChip`, `StatusLegend`, `emptySessionLine`, `useDisplayStatus`, `resolveDisplayStatus`, `useDefaultStatus`, `useAnaesthetistStatusChoices`, `blockFill`, `WarningTriangle`, `Avatar`, `Logo`, `DemoBadge`, `DockSpacer`, `SuccessOverlay`, `TickBadge`, `SlidingSegmentedControl`, `Segmented`, `ListRow`, `SurfaceProvider`/`useSurface`, `shared/format.ts` (`dayHeading`, `drSurname`, `slotTimeRange`, `mondayOf`, `weekDays`, `nhiBadge`, `formatCurrency`, `initialsOf`, `locationName`), `shared/legacy` redirect.

## 5. Store actions, selectors and hooks called from this area
| Name | File:line | Caller here |
|---|---|---|
| `submitList` | store/lifecycle.ts:221 | SubmitListSheet (both apps) |
| `completeBooking` / `uncompleteBooking` / `completionBlockersFor` | lifecycle.ts:121 / ~170 / 100 | via BookingDetailBody, SubmitListSheet |
| `editRefusal` (guard) | lifecycle.ts:50 | all booking writes |
| `createBooking` / `copyBooking` / `editBooking` / `addProcedure` / `cancelBooking` / `addPostOpAddendum` | store/bookingActions.ts, lifecycle.ts | AddBookingFlow, BookingDetailBody |
| `addAttachment` / `removeAttachment` | store/attachmentActions.ts | list attachment panels (direct `removeAttachment`), body |
| `setAvailabilityRange` / `createAvailabilitySeries` / `clearAvailability` / `deleteAvailabilitySeries` | store/availabilityActions.ts:355 / 546 / 433 / 626 | shared AvailabilityForm / SlotPanel / SeriesList (both apps) |
| `moveListToOffice` / `pushListToSlot` / `markUnavailableAndMoveList` | store/listMoveActions.ts:208 / 222 / 240 | MoveListSheet (both apps) |
| `slotViewsForAnaesthetist` / `slotViewsForDate` / `openSlotViews` / `isOpenSlotView` / `rosterForDate` / `timesForList` / `useListTimes` | store/selectors.ts:183 / 172 / 178 / 160 / 214 / 199 / 1423 | all schedule screens |
| `availabilityMonthFor` | selectors.ts:257 | both My-calendar screens (via hook) |
| `isListBilled` | selectors.ts:389 | ForwardLists, WeekStrip, ListsScreen |
| `outstandingAccpayInvoicesFor` / `receivablesAgingFor` / `accpayInvoicesFor` | selectors.ts:929 / 945 / 915 | Balances, Dashboard, Overdue |
| `gstActivityFor` | selectors.ts:975 | Balances, GstReport |
| `paymentHistoryFor` | selectors.ts:1029 | PaymentsTable |
| `aaFeeInvoicesFor` | selectors.ts:1410 | AaFeesTable |
| `movedToMe` / `movedToMeForList` | store/notifications.ts:110 / 118 | useMovedToMe, MovedToYouPanel, "New" badge |
| `useToday` (demo clock) | selectors.ts:1300 | most screens |
| `deriveDashboardFigures` | domain/seed/anaesthetistDashboard.ts | Dashboard via `useDashboardFigures` |
| `useDemoTriggerMemory.photoCaptureRequest` | shared/demoTriggers/memory.ts:21 | MobileListsRoute (photo demo) |

## 6. Business rules and calculations visible here
- **Model** (`domain/types.ts:530-700`): `Slot {id, anaesthetistId, dateISO, session, status (fixed id: free|holiday|unavailable|admin-added), note?, startTime?, endTime?, seriesId?}`; every active anaesthetist has AM+PM Slots across the schedule horizon (4 months default, plus 14 past days: `domain/clock.ts:86`). A `List` sits in a Slot (`slotId`) and shows in place of the status. `List.kind` private|public|preop (chip/colour); `List.state` DRAFT|ACTIVE|SUBMITTED|AUTHORISED. Draft Lists never appear on any anaesthetist surface (`isAssignedList` guards; OQ-86 answered no).
- **Display key**: a session's colour/label is the List kind when a List is present, else the Slot status (`domain/slots.ts:55 displayStatusKey`). Seeded statuses: Free (open), On holiday, Unavailable (closed); admin may add more (`domain/seed/cast.ts:203`, `anaesthetistCanSet` flag decides what the anaesthetist can choose; the office-only ones are refused `statusNotSettable`).
- **Open slot** = no List AND status open for bookings (`domain/slotStatus.ts:131`). Used for every "free" count, dot, Free-only filter and move target.
- **Billed = gone**: `isListBilled` keys on `billedAtISO`, not AUTHORISED. Applied on mobile Forward Lists, WeekStrip, web Lists. Dashboard `daySummary` also excludes billed. Availability screens ignore it (a billed List's session still shows via Slot in Find cover).
- **Edit rights** (`editRefusal`, lifecycle.ts:50): AUTHORISED locked for all; anaesthetist only own List and only `ACTIVE`; office DRAFT/ACTIVE/SUBMITTED; integration only ACTIVE.
- **Completion/submission**: `completeBooking` blocked by `completionBlockersFor` = `validateBookingForBilling` failures (not by warnings; prepayment is a warning only). `submitList` (lifecycle.ts:221): ACTIVE only, not integration/system, own List, every non-cancelled Booking completed else "(N to finish)"; cancelled bookings never block; ACTIVE -> SUBMITTED.
- **Own List move** (`domain/listMoves.ts`): `ownMoveRefusal` = owner only, `ACTIVE` only (SUBMITTED/AUTHORISED are the office's), date >= today. `receiveRefusal`: same day and session, target session holds no List, and (own move) the colleague is active and the session is open. `pushTargets` = flat surname-ordered colleague list, availability only (no pairing preference or tier; privacy rule US-01.4.5). Move to office makes the List a Draft List (origin `movedToOffice`); the vacated session takes Free (default) or Unavailable. Receiving colleague sees the notice for 7 days (`MOVED_TO_ME_DAYS`).
- **Marking unavailable over a List** (US-01.5.5): `applySessionWrites` (`store/availabilityActions.ts:190`) refuses with `holdsList` when an anaesthetist closes a session that holds a List; `AvailabilityForm.refused` (L75-95) then prompts per List via `promptUnavailable` (office or colleague) and saves again. SUBMITTED/AUTHORISED Lists refuse outright (`holdsLockedList`: "ask the office"). The office path instead keeps the List and flags a conflict (shown as amber "!" in My calendar).
- **Availability writes**: status must exist, not be retired, and be anaesthetist-settable (`statusRefusal`); an office-set status in the slot cannot be replaced (`replacedStatusRefusal`); range must be within today..horizon (`validateAvailabilityRange`); series via `createAvailabilitySeries`; deleting a series returns sessions from today to Free and keeps individually changed days.
- **Next-day handover**: `accpayInvoicesFor` excludes invoices raised on or after today (`selectors.ts:~934`), so Balances, Overdue and dashboard aging show an invoice the day AFTER billing. Payments, GST and AA fees read receipts/fee invoices and show immediately.
- **Aging**: `bucketForAgingDays` (<=30 current, <=60, <=90, else 90+); over-60 counts and the mobile amber chip use `> 60`; outstanding = invoice total minus received, only > 0 cents.
- **Payment history status**: fullyReceived+fullyDisbursed -> paidOut; any disbursed -> partPaidOut; fullyReceived -> customerPaid; else partPayment. Released = authorisedAmount, shown equal to received in copy.
- **GST**: sum of receipts' `gstAmount`/gross for her within the window; period defaults from master.
- **Fee display on web list view**: `bookingFee()` units and total over active bookings (note the inconsistency above).

## 7. Demo and simulator affordances
- Demo clock `useToday()` (DEMO_TODAY 2026-07-21, `domain/clock.ts:32`) drives all "today" logic; advanced from the harness bar or, in the PWA, `moreExtra` on More (`pwa/PwaDemoPanel.tsx`). Nothing in these folders advances it.
- "Photo capture (Future scope)": a registry demo action (`shared/demoTriggers/registry.ts:~1000`, routes `/mobile/lists/:listId`, surfaces bar + pwa) sets `photoCaptureRequest`; `MobileListsRoute` (routes.tsx:35-46) opens `AddBookingFlow` on the photo prong and clears it. Mobile-only.
- Badges: "Demo prototype" (More); "NHI FHIR lookup . Digital Services Hub" (ManualBookingForm); "Simulated capture / OCR" (photo flow); simulated attachment picker.
- No other per-screen demo trigger in these folders. Balances/Accounts depend on the admin billing run and Xero/integration simulators elsewhere; "Moved to you" notices depend on a colleague's move (seeded or via admin/demo triggers elsewhere).
- Phone chrome: `PhoneFrame` host (prototype) vs `MobileViewport` (PWA), inset CSS vars `--aa-inset-*`. `data-shot` attributes (e.g. `availability-mine`, `list-move`, `list-attachments`, `dashboard-move-list`, `mobile-availability-calendar`, `web-availability-mine`) are hooks for the capture recipes.

## 8. Stubbed, hardcoded, seeded, visual-only
- Productivity and Leave panels: seeded constants, Souter only, not derived from bookings or Slots; Leave has no request/approve path and is independent of the leave statuses in My availability.
- More tab persona card; web nav name/avatar: static.
- Attachments: bundled sample files; photo OCR is canned `SAMPLE_EXTRACTIONS`; NHI lookup is local `domain/nzhis`, not FHIR.
- Mobile Find cover window fixed today..+5; web Lists default +28d is UI only; web Find cover `?date` ignored if past.
- Vacated-session choice in the move sheet is a provisional reading (OQ-84 open, `domain/listMoves.ts` comment).
- Web is fixed desktop width (min 1240), no responsive layout. `AaFeesTable` and GST period selector are read-only reports.
- Web booking route does not verify the List belongs to her (route-level check only on the List route); mobile does verify via `listMissing`.

## 9. Not present in these apps (search elsewhere first)
- Cover request/offer (`requestCover`, `coverRequest`, "Offer cover", Free/Block buttons): REMOVED; replaced by own-List move and Draft-List return (Phase 32). Nothing notifies, accepts or declines.
- Any notification centre (in-app, push, email, SMS) for the anaesthetist; the only notice is the 7-day "Moved to you" panel/line and "New" badge.
- Leave request/approval workflow; setting availability from Forward Lists; patient or booking search; archive/history of billed Lists; export/print/download of any account view; invoice detail, remittance advice, per-invoice drill-down (`?invoice=` only highlights); web/mobile access to Draft Lists; profile/settings, multi-persona, role switching; any authorise/approve control.
- Booking-level features (procedure coding, BTM rules, times, modifiers, route/funder allocation, prepayment, post-op addendum, cancellation, history) live in `shared/booking`, `shared/capture`, `shared/flows`, `domain/billing`, not here.
