# Prototype map: Anaesthetist Mobile App and Anaesthetist Web App

Paths are relative to `aa-prototype/src/` unless stated. Line numbers were read from the code at HEAD d4369476.

## Orientation

Both apps are the same persona, Dr Melanie Souter (registration `34821`, `shell/appConfig.ts` PERSONAS.souter), as an `Actor {role:'anaesthetist', source:'anaesthetist', anaesthetistId}` built in `apps/mobile/MobileApp.tsx:112` and `apps/web/WebApp.tsx:36`. There is no login, no persona switching, no role model inside these apps: identity is hardcoded per app. Both are thin screen layers: the screens read store selectors (`store/selectors.ts`) and render; almost all capture, booking, submit, availability-edit, move-List and attachment UI is in `src/shared/` (flows, booking, capture, availability, attachments, warnings), only named here. Mobile = 4 bottom tabs inside a phone frame (`PhoneFrame` host; the PWA build mounts the same `MobileApp` in `MobileViewport`). Web = a 4-tab top nav desktop app (min width 1240). Routes are registered in `router.tsx:81-97` (web) and `:137-145` (mobile). Only the screens that are unique to these two apps live in `apps/mobile` and `apps/web`; nothing here calls `fetch`. Money views (Balances, Accounts) read the billing MIRROR (`state.billing`), never `state.xero`. There is NO authorise, no pricing/fee-schedule view, no ward/patient-search, no profile/settings editing in either app.

## Contents
1. Shared plumbing (outlet, actor, frames)
2. Mobile routes and screens
3. Web routes and screens
4. Cross-cutting rules and calculations (with lines)
5. src/shared pieces used by each screen (not documented here)
6. Demo / test / simulator affordances
7. Stubbed, hardcoded or visual-only
8. Tests in this area

## 1. Shared plumbing
- `apps/mobile/MobileApp.tsx`: layout route. Wraps in `SurfaceProvider variant="mobile"` (sheets are bottom sheets) and `MoveListPromptProvider` (the one "Move this List" sheet, shared/flows). Bottom tab bar (`BottomTabBar` :26) Lists / Availability / Balances / More; shown only when both stacks are at depth 0 (:134), so List detail, Booking detail and My calendar are full-bleed. Outlet context (`outlet.ts`): actor, anaesthetistId, personaName/Role, initials, optional `moreExtra` slot (PWA injects presenter controls there).
- `apps/mobile/navigation.ts`: pure URL parsing. `listsStackLocation` (:53) depth 0/1/2 = Forward Lists / List / Booking; `availabilityStackLocation` (:49) depth 0/1 = Find cover / My calendar; `mobileTabForPath`.
- `apps/mobile/components/SlideStack.tsx` (348 lines): iOS-style layered push/pop; every layer stays mounted; edge-swipe-back (28px edge zone, 0.35 width or 0.5 px/ms velocity commit; touch only, never mouse). `MobileHeader` (eyebrow/title/avatar). `components/index.ts` re-exports shared primitives under mobile names.
- `apps/web/WebApp.tsx`: layout; `WebNav` (Logo, Dashboard / Lists / Availability / Accounts, crimson active underline, persona name + avatar; no menu, no logout, avatar is not clickable); `MoveListPromptProvider`; outlet context adds `todayISO` (`useToday()` demo clock). `components/Panel.tsx` white card. `components/AvailabilityPageSwitch.tsx` toggles Find cover / My availability. `useDashboardFigures.ts` memoises `deriveDashboardFigures` over `state.dashboards` seed (`domain/seed/anaesthetistDashboard.ts:76`).
- Persona is single: both apps filter on `anaesthetistId`; colleague data is always status-only (A8 rule, comments in AvailabilityScreen/Grid).

## 2. Mobile routes and screens

| Route | Element | File |
|---|---|---|
| `/mobile` | redirect to `lists` | router.tsx:138 |
| `/mobile/lists/*` | `MobileListsRoute` (one splat route, 3 layers) | apps/mobile/routes.tsx:33 |
| `/mobile/lists/:listId` | layer 2 | same |
| `/mobile/lists/:listId/bookings/:bookingId` | layer 3 | same |
| `/mobile/availability/*` | `MobileAvailabilityRoute` | routes.tsx:183 |
| `/mobile/availability/calendar` | layer 2 (My calendar) | same |
| `/mobile/balances` | `MobileBalancesRoute` | routes.tsx:249 |
| `/mobile/more` | `MobileMoreRoute` | routes.tsx:254 |

### 2.1 `MobileListsRoute` (routes.tsx:33-165)
Reads URL depth/ids; stale-id guards (:68-77): a List that is missing, `DRAFT` (office-only, OQ-86), or `anaesthetistId !== hers` (moved away, Phase 32) redirects to `/mobile/lists`; a missing booking redirects to its List. Legacy `/cards/` URLs hand to `LegacyBookingRedirect`. Both pops use `navigate(..., {replace:true})`. Hosts shared `AddBookingFlow` (mode manual, or `photo` when the demo trigger fires, see section 6). Back handlers wired to SlideStack edge swipe.

### 2.2 `ForwardListsScreen` (screens/ForwardListsScreen.tsx)
Header "Kia ora, Dr Souter" (`drSurname`), eyebrow = day heading. Filter pills (:14) Week (today to +7 days), Month (+31 days), To-Do, Done. Reads `schedule.lists/slots/bookings`, `masters.hospitals/surgeons/slotStatuses`, `appSettings`, `useMovedToMe`.
- Week/Month (:176-): `slotViewsForAnaesthetist` (selectors.ts:183) → `viewRow` (:114). A session holding a List shows as a List row (`listRow` :142); an empty open session shows "<status label> session / Open for bookings" chip; a closed status (holiday etc.) shows as a day-off row labelled from the status master (`resolveDisplayStatus`). Billed Lists (`isListBilled` = `billedAtISO` set, selectors.ts:389) are removed from every forward view (:79,:115).
- To-Do (:87): `state==='ACTIVE'` with any non-cancelled booking not `completed`. Done: `state` SUBMITTED or AUTHORISED (unbilled). Both ignore the date window.
- List row right-side status (:153-160): `doneUnbilled` (SUBMITTED/AUTHORISED or all bookings complete), `toFinish {count}` (List date <= today and not all complete), else `count` (statusKey = List kind private/public/preop). Title = hospital name or "Pre-op assessment"; subtitle = surgeon + specialty (private) or template label from `list.notes` (public); preop shows "appointments" not "bookings". Times via `timesForList` (selectors.ts:199).
- "New" badge on Lists a colleague moved to her (`movedToMeIds`, :53, :271).
- Grouped by date then AM before PM. Empty states per filter.
- Tap a List row → `/mobile/lists/:id`. Rows with no List are not tappable (no "book this session" here).

### 2.3 `ListDetailScreen` (screens/ListDetailScreen.tsx)
Header: back "Lists", "<hospital> <AM|PM>", subline surgeon · specialty · "Today"/ISO date · time range (`useListTimes`, `slotTimeRange`), list-kind `StatusChip`. "Move this List" pill when `useIsMovable` (and moved-to-you byline when `useMovedToMeNotice`) → `movePrompt.openMove(listId)`. Progress bar "n of m complete" (cancelled bookings excluded, :84-87). Booking rows sorted by `scheduledTime` then id; show time, patient name, NHI (mono), first procedure description (lowest procedure id, :63) or "Procedure to capture", `WarningTriangle` per booking (`useListWarnings`), cancelled (strikethrough + "Cancelled"), completed (`TickBadge`, animates only for bookings completed since the screen last showed, :56), else a "Capture" pill. Tap row → booking detail.
- List attachments section (US-03.1.3) shown if `canEdit` (state ACTIVE) or already has attachments; add via `AddAttachmentSheet`, remove via `removeAttachment(useAppStore, actor, {kind:'list', id}, attId)` (store/attachmentActions.ts:115). Locked Lists are read-only.
- "Add a booking" dashed button only when `state==='ACTIVE'` → opens shared `AddBookingFlow` (routes.tsx).
- Sticky footer, 3 states: state != ACTIVE → green "Submitted to office"; incomplete>0 → grey "Mark list completed · n to finish / Tap to see what is left" (still tappable, opens `SubmitListSheet mode="blockers"`); else teal "Mark list completed" → `SubmitListSheet mode="confirm"`. On submit a 1050 ms `SuccessOverlay` "List submitted / Sent to the office for review". Completion gate is enforced in the store (`submitList` via the shared sheet), not here.
- Returns null for a non-assigned (DRAFT) List (`isAssignedList`, domain/draftLists.ts:45).

### 2.4 `BookingDetailScreen` (screens/BookingDetailScreen.tsx)
Phone chrome only: back "List", folding patient masthead (large name collapses to a 44px nav row after 24px scroll), `StatusChip` list kind, `WarningTriangle`, operation · hospital. NHI/DOB are deliberately not in the masthead (shown by the shared Patient card). All capture/validation/lifecycle/history lives in `shared/booking` `BookingDetailBody` (header function receives `collapsed` and the History control). Null for missing booking or Draft List.

### 2.5 `MobileAvailabilityRoute` + `AvailabilityScreen` (Find cover)
Route (routes.tsx:183): hosts Find cover + My calendar in a `SlideStack`, and one `Overlay` bottom sheet containing shared `AvailabilityEditor` (a day's sessions then the form; `shot="mobile-availability-sheet"`). "Add days off" opens the form preset to sessions both, span week, status = SEED_STATUS.holiday if offered to anaesthetists, else first non-bookable choice (`useAnaesthetistStatusChoices`, :190-192).
`AvailabilityScreen`: 6-day date strip from today (:61, dot = any open session that day), Everyone / Free only toggle, "n free sessions on <date>", `MovedToYouPanel`, a "My availability" card (her AM/PM status chips, per-session "Move" button when she has a movable List (`useMovableSessions`), "Change <date>" → editor sheet (disabled if she has no sessions that day), "My calendar" → slide in), then colleague cards (roster via `rosterForDate`, excluding herself, name order, no tiers/ranking; AM and PM cells with status or hospital + surgeon; "Free" badge if any open session). A colleague's free cell is tappable ("Tap to move your List here") only when her List that session can move into it (`mine.targetSlotIds`) → `movePrompt.openMove(listId,{toSlotId})`. No phone/contact action on mobile.
### 2.6 `MyAvailabilityCalendarScreen`
Month grid (7 columns) from the current month to `horizonEndISO` (`useAvailabilityBounds`; month nav clamped). Each day = AM half-block over PM (status fill via `blockFill`, or the List); repeat glyph for series instances; amber "!" for a conflict (`session.conflict`, a List hit by a recorded sickness or closure). Past days and days with no sessions are disabled; tap a day → editor sheet. Status legend chips from `useAnaesthetistStatusChoices` (the statuses an anaesthetist may set). "Your series" = shared `SeriesList` (repeating days off). Sticky "Add days off" button (from today, or the 1st of a later month). Data: `useAvailabilityMonth(anaesthetistId, month)`.
### 2.7 `BalancesScreen` (screens/BalancesScreen.tsx)
"Your account / Balances". Card "Outstanding to you" = `receivablesAgingFor(...).aging.total` plus count of unpaid invoices. Toggle Outstanding / GST this month. Outstanding: flat list of ACCPAY invoice rows (`outstandingAccpayInvoicesFor`, selectors.ts:929): patient, outstanding amount, invoice number · counterparty label, age chip `Nd` (warning tint if >60, :141), "ACC" chip if `accRelated`. GST: this calendar month from the 1st to today via `gstActivityFor` (selectors.ts:975): each receipt gross + GST, totals. Empty copy "Balances appear the day after billing". Read-only; no payment history, no AA fee invoices, no export on mobile.
### 2.8 `MoreScreen`
Persona card (name, role), "Demo prototype" badge and note, `extra` slot (PWA presenter controls). No settings, no notification preferences, no sign-out, no profile.

## 3. Web routes and screens

| Route | Element | File |
|---|---|---|
| `/web` (`?week=<ISO>`) | `WebDashboardRoute` | apps/web/routes.tsx:27 |
| `/web/lists` | `WebListsRoute` | :64 |
| `/web/lists/:listId` | `WebListDetailRoute` (404 via `RequireEntity` if not assigned/hers) | :77 |
| `/web/lists/:listId/bookings/:bookingId` | `WebBookingDetailRoute` | :100 |
| `/web/lists/:listId/cards/:cardId` | legacy redirect | router.tsx:88 |
| `/web/availability` (`?date=`) | `WebAvailabilityRoute` (Find cover) | :120 |
| `/web/availability/mine` (`?date=`) | `WebMyAvailabilityRoute` | :135 |
| `/web/accounts` | redirect `overdue` | router.tsx:92 |
| `/web/accounts/:subTab` (overdue, payments, gst, fees; `?invoice=` highlights a row) | `WebAccountsRoute` | :148 |

`?week=` is a Monday anchor (`mondayOf`), stepping uses replace.

### 3.1 `DashboardScreen` (screens/DashboardScreen.tsx)
"Kia ora, Dr Souter" + summary line: date · n lists today · n bookings · n awaiting submission (:86-99: today's Lists not billed; bookings non-cancelled; "awaiting" = ACTIVE List with bookings all complete). "Move a List" button (disabled when none movable, :64) → picker overlay of her movable Lists in the next 6 days (`useMovableLists(id,6)`) → `movePrompt.openMove`. Panels:
- `WeekStrip` (components/WeekStrip.tsx): 7 Monday-anchored days, AM/PM per day from `slotViewsForAnaesthetist`; List shown as hospital + surgeon (or template note) + session; empty shows status; full-day holiday merged into one tall block (`mergedHoliday` :87); today outlined crimson; billed Lists vanish; click a List → List detail; prev/next week.
- Receivables aging (7 cols): `receivablesAgingFor` over the billing mirror; four bars Current / 31 to 60 / 61 to 90 / 90+ (`AGING_ROWS` :27), total, "n accounts over 60 days" + link to `/web/accounts/overdue`.
- Productivity (5 cols): SEEDED figures (`useDashboardFigures`): units, % change pill, lists, avg units per list, fees invoiced, 6-month units and % vs last year. Not derived from bookings.
- Leave panel: SEEDED list of leave ranges with Approved/Pending pill (`figures.leave`). Display only; no way to request leave (leave is set via Availability).
- Who's free next 5 days (live): open sessions of colleagues grouped by day+session (`openSlotViews`), chips by surname; chip is a button when her List that session can move there (`useMoveTargets` :72) → `openMove(listId,{toSlotId})`; hover title shows colleague phone number (from `masters.anaesthetists.phone`). Link "Full availability grid" → `/web/availability`.

### 3.2 `ListsScreen` (W2)
Table Date, Session, From, To, Description, Status for her sessions between From/To date inputs (default today to +28 days; a cleared input = unbounded). Same `slotViewsForAnaesthetist` source as mobile; billed Lists filtered; rows with a List are clickable → List detail; empty sessions show `emptySessionLine`; status via `StatusChip` + `StatusLegend`. Times shown only when a List exists or times are overridden (`times.overridden`).
### 3.3 `ListDetailView`
Back, title `<hospital> <session>` + kind chip, subline, moved-to-you line, "Move this List" button, `SubmitAction` (:~320: submitted green / "n to finish before submitting" opens blockers sheet / "Mark list completed" opens confirm; same `SubmitListSheet`). Bookings table: time, patient + NHI ("NHI pending" if none), procedure (+n more), UNITS and FEE per booking from `bookingFee(procs, list, masters, billingLines)` (shared/capture; the Phase 01 calculator) – cancelled bookings show "·" – status Cancelled / Complete+tick / Capture; totals row (units, fee). Progress bar. "Add a booking" (ACTIVE only) → `AddBookingFlow` as a dialog. List attachments panel (same rules as mobile). Unlike mobile, this view does NOT check `isAssignedList` itself (the route does; `list.state==='DRAFT'` returns null in the model).
### 3.4 `BookingDetailView`
Back "List"; h1 patient name + warning triangle; mono line `nhiBadge` · DOB (age from `ageYears(dob, todayISO)`); operation · hospital; list-kind chip + History control (from body). Body is shared `BookingDetailBody` (same behaviour as mobile; dialogs on web).
### 3.5 `AvailabilityGrid` (Find cover, W3)
Title, `AvailabilityPageSwitch` (Find cover | My availability), day prev/next/Today (cannot start before today when `?date=`), `MovedToYouPanel`, All anaesthetists / Free only · count chips, name search (client-side substring), `StatusChipsLegend`. Rows = `rosterForDate` for the day sorted by name, including her own row (data-shot `availability-row-mine`, with "Change" → `/web/availability/mine?date=`). AM/PM `Cell` per anaesthetist: status label + "Open for booking", hospital + surgeon (public List: template note), "Pre-op clinic". A cell is actionable for move: own cell (`own`) or a colleague's free cell she can receive into (`receive`) → `openMove`. Count of free = open session views (`isOpenSlotView`: open status and no List). Status only for colleagues (A8): no booking/patient detail.
### 3.6 `MyAvailabilityCalendar`
Month panel clamped to today..horizon, click a day, shift-click extends to a range (`pick`, anchor), per-day AM/PM cell with status fill, repeat glyph, amber conflict flag; right rail 340px: empty prompt or shared `AvailabilityEditor` (`shot="web-availability-rail"`) for the selected range, then `SeriesList` ("Your series"), legend. Past or session-less days disabled. Copy states every session is the default status label until changed.
### 3.7 `AccountsScreen`
Sub-tabs (URL driven):
- Overdue: `receivablesAgingFor` rows, one per outstanding ACCPAY invoice ordered by `raisedAtISO` (no rollup), amount placed in its aging bucket column (Current / 31-60 / 61-90 / 90+), ACC flag, totals row and Outstanding total.
- Payments: `paymentHistoryFor`: date received, invoice, patient, payer, "Received by AA", "Released to you", "Paid to you", status (`PAYMENT_STATUS_LABEL`: Part payment received / Customer paid / Part paid to you / Paid to you); `?invoice=` highlights a row (data-testid `payment-history-row-<no>`); copy says everything AA receives is released in full and AA's fee is invoiced monthly.
- GST activity: Segmented Monthly / Bi-monthly / Six-monthly (default from `masters.anaesthetists[id].gstPeriod`); window is a ROLLING N calendar months ending today (`periodWindow` :385, 1/2/6 months, not GST-filing periods); `gstActivityFor` rows (date, invoice, payer, gross, GST) + period total.
- AA fees (catch-up Phase 16, US-10.3.2): `aaFeeInvoicesFor` (selectors.ts:1410): invoice no., month, BCTI count, fixed charges (`aaFeeFixedTotal`), per-BCTI charge (subtotal minus fixed), fee ex GST, GST, total, Paid <date>/Unpaid, footer unpaid total incl GST. Read only; no pay action.
No statements, PDFs, invoice download or dispute actions in either app.

## 4. Cross-cutting rules and calculations
- Slot views: every app reads one `SlotView {slot, list?, displayKey, times, open}` (selectors.ts:140-157). `open` = `isOpenSlot(slot, list, statuses)`: open-for-bookings status AND no List. A session holding a List displays the List kind (private/public/preop) in place of status. Default (free) status label comes from `useDefaultStatus`/`defaultSlotStatus` of the slot-status master (statuses are a master, `domain/slotStatus.ts`; `SEED_STATUS.holiday`).
- Draft Lists are office-only: guarded by `isAssignedList` in mobile routes/screens and web routes (OQ-86 / D46).
- Billed Lists vanish from anaesthetist forward views when `billedAtISO` is stamped by the billing run (not at AUTHORISED): selectors.ts:389; used ForwardLists:79,115, ListsScreen, WeekStrip, Dashboard summary (`billedAtISO === undefined`).
- List lifecycle visible here: ACTIVE (editable: add booking, attachments) → SUBMITTED/AUTHORISED (read-only, "Submitted to office"). The anaesthetist can only submit; no authorise anywhere (verified, nothing in `apps/web` or `apps/mobile` calls `authoriseList`). Submit requires every non-cancelled booking `completed` (gate in the shared sheet/store).
- Per-booking fee/units: only in web ListDetailView via `bookingFee` (cancelled = 0). Mobile never shows fees or units except inside the shared booking dock/body.
- Moving a List (Phase 32): `useIsMovable`, `useMovableSessions` (per day), `useMovableLists` (next N days), `useMoveTargets`, `useMovedToMe`/`useMovedToMeNotice`, `MoveListPromptProvider` (all `shared/flows`). A moved List leaves her schedule (route guards compare `anaesthetistId`). The "cover marker" was retired.
- Receivables aging: buckets by `agingDays` (days since raised): current, 31-60, 61-90, 90+; "over 60" count uses `agingDays > 60` (selectors.ts:952). Balances appear "the day after billing" (copy; handover logic is in the selector).
- Format rules: names via `shared/format` (`drSurname`, `initialsOf`), currency `formatCurrency`; copy uses `·` and "to" (no dashes).
- Dates: demo clock via `useToday()` (`DEMO_TODAY` 2026-07-21 by default); `todayISO` comes from the clock, never `new Date()`.

## 5. src/shared pieces used (not documented here)
- Mobile Lists/List/Booking: `shared/flows` (AddBookingFlow, SubmitListSheet, MoveListPromptProvider, useIsMovable, useMovedToMe, useMovedToMeNotice, movedToYouByLine), `shared/booking` (BookingDetailBody), `shared/attachments` (AddAttachmentButton/Sheet, AttachmentStrip), `shared/warnings` (WarningTriangle, useListWarnings, useBookingWarnings), `shared/ui` (TickBadge, DockSpacer, SuccessOverlay, SlidingSegmentedControl), `shared/schedule` (ListRow), `shared` (StatusChip, resolveDisplayStatus, useDefaultStatus, Avatar, DemoBadge, SurfaceProvider/useSurface).
- Availability (both apps): `shared/availability` (AvailabilityEditor, SeriesList, monthCells, useAvailabilityMonth, useAvailabilityBounds, describeDayForScreenReaders), `shared` (useAnaesthetistStatusChoices, blockFill, useSlotStatusRecords, StatusLegend, emptySessionLine), `shared/flows` (MovedToYouPanel, useMovableSessions, useMoveTargets, useMovableLists).
- Web: `shared/capture` (`bookingFee`), `shared` (Segmented, Logo), `shell/RequireEntity`, `shell/routeParams` (`isISODate`).
- Store: `store/selectors.ts` (`slotViewsFor*`, `rosterForDate`, `timesForList`, `receivablesAgingFor`, `outstandingAccpayInvoicesFor`, `gstActivityFor`, `paymentHistoryFor`, `aaFeeInvoicesFor`), `store/attachmentActions.ts`, `domain/billing/aaFee.ts`, `domain/billing/money.ts`.

## 6. Demo / test / simulator affordances in this area
- Photo capture demo trigger (routes.tsx:47-54): `useDemoTriggerMemory.photoCaptureRequest {listId,n}` (set from the demo panel, `shared/demoTriggers`) opens Add a booking on the `photo` prong for that open List. The List's own "Add a booking" never reaches photo (Future Work US-02.4.4).
- Demo triggers read screen state published by these screens' routes (`shared/demoTriggers/memory.ts`, `registry.ts` reference `MobileListsRoute`/`WebDashboardRoute` names).
- `data-shot`/`data-testid` hooks for screenshot capture: `mobile-lists-header`, `mobile-lists-scroll`, `mobile-list-header`, `mobile-list-scroll`, `mobile-list-footer`, `mobile-booking-header`, `mobile-tab-bar`, `list-moved-to-you`, `list-move`, `list-attachments`, `availability-mine(-am|-pm)`, `availability-change`, `availability-open-calendar`, `availability-move-<am|pm>`, `availability-move-to-<id>`, `mobile-availability-calendar/-grid/-sheet/-series`, `mobile-add-days-off`, `dashboard-move-list`, `dashboard-move-picker`, `dashboard-move-to-<id>`, `web-availability-mine/-rail/-rail-empty/-series`, `availability-row-mine`, `availability-change-mine`, `web-accounts-aa-fees`, `payment-history-row-<inv>`, `aa-fee-history-row-<inv>`, `web-booking-header`, `list-submission-overlay`.
- More tab: `moreExtra` slot gives the PWA its clock/reset/office-simulation controls (`pwa/PwaDemoPanel.tsx`); the framed prototype uses the harness bar instead.
- Boundary tests: `apps/draftListBoundary.test.ts`, `moneyViewPurity.test.ts`, `noSlotCopy.test.ts`, `officePrivacy.test.ts` (under `apps/`, cover these apps' reads).

## 7. Stubbed, hardcoded or visual-only
- Persona: hardcoded Dr Souter in both apps; fallback id `'34821'`. No auth, profile, preferences, notifications, sign-out. More tab is a persona card and a demo note.
- Dashboard Productivity and Leave panels are seeded demo figures (`state.dashboards`, `deriveDashboardFigures` ages them against the demo clock); they do not reflect bookings or availability changes. Leave Approved/Pending is seeded text, no workflow.
- GST window is rolling months, not tax periods; `gstPeriod` only picks the default tab.
- WebNav avatar and persona name are decorative. "Who's free" phone numbers appear only in a chip tooltip (web dashboard).
- Mobile Balances has no history/AA fees (web only); web has no balances shortcut to outstanding total except the Overdue tab.
- No search by patient/NHI, no booking search, no calendar sync/export, no printing, no messaging in either app (nothing found).
- Time on mobile List rows shows only when a List exists or times are overridden; otherwise sessions have no times shown.
- `ForwardListsScreen` open-session rows are not tappable (no self-booking); creating a booking is only possible inside an existing assigned ACTIVE List.
- "Pending" copy and some comments still cite old phases; `MoreScreen` comment "deeper settings are out of prototype scope".

## 8. Tests in this area
- `apps/mobile/components/SlideStack.test.tsx` (edge-swipe gestures: mouse ignored, edge zone, axis lock, velocity commit, reduced motion, inert parked layers).
- `apps/web/screens/AccountsScreen.test.tsx`: S3 nib invoice stays visible in Payments with received/released/paid-to-you after `receivePayment` + `disbursePayable` (uses `wireBillingRun`, `authoriseList`, Xero pair view from `apps/demo/xeroPairView`).
- No unit tests for the other screens here; behaviour is covered by shared/store tests and Playwright.
