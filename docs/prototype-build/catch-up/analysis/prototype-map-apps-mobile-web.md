# Prototype map: Anaesthetist Mobile App and Anaesthetist Web App

All paths relative to `aa-prototype/src/`. Verified against code at HEAD `3d3a18c` (after Phases 14, 15, 15a). The code is the truth; code comments cite old phases and are not proof. Naming is post-Phase-15: **Booking** (was Card), `schedule.bookings`, `bookingId`, `BookingDetail*`. Old `/cards/` URLs only redirect (`shared/legacy`).

**Orientation.** Both apps are React front ends that run as ONE persona, Dr Melanie Souter (`shell/appConfig.ts:27`, registration no `34821`, initials MS), via `APP_CONFIG.mobile.persona` / `APP_CONFIG.web.persona`. Each layout builds an `Actor {who, role:'anaesthetist', source:'anaesthetist', anaesthetistId}` (`apps/mobile/MobileApp.tsx:~108`, `apps/web/WebApp.tsx:44`) and passes it down through router outlet context. There is no login, no other anaesthetist persona, no role switching. Screens read `useAppStore` slices and write only through store actions (audited `mutate()`). Reads are filtered to the persona's own lists except the two availability screens, which show ALL anaesthetists' session STATUS only (no patient detail). Mobile = 4 tabs (Lists slide-stack of 3 layers, Availability, Balances, More). Web = 4 nav tabs (Dashboard, Lists with list and booking drill-down, Availability grid, Accounts with 3 sub-tabs). **Booking capture itself (patient, procedures, BTM, times, units, billing lines, validation, complete/amend/cancel/copy, history, prepayment banners) is NOT in these folders**: both apps wrap the same `shared/booking/BookingDetailBody.tsx`, so behaviour is identical on both. Route table: `router.tsx:70-125`.

## Contents
1. Routes at a glance
2. Mobile (shell, Forward Lists, List detail, Booking detail, Availability, Balances, More)
3. Web (shell, Dashboard, Lists, List detail, Booking detail, Availability grid, Accounts)
4. Shared components/flows used here (entry points only)
5. Store actions and selectors called from this area (with lines)
6. Business rules and calculations visible here
7. Demo and simulator affordances
8. Stubbed, hardcoded, seeded, visual-only
9. Not present in these apps (check here before reporting a gap)

## 1. Routes at a glance

| App | Route | Component (file) | Notes |
|---|---|---|---|
| Mobile | `/mobile` | `<Navigate to="lists">` (router.tsx:116) | `MobileApp host={PhoneFrame}` layout; PWA mounts same app with `MobileViewport` |
| Mobile | `/mobile/lists/*` | `MobileListsRoute` (mobile/routes.tsx:33) | ONE splat route hosting 3-layer `SlideStack`; depth read from URL by `listsStackLocation` (navigation.ts:38) |
| Mobile | `/mobile/lists/:listId` | same route, depth 1 = `ListDetailScreen` | stale listId redirects to `/mobile/lists` (routes.tsx:55) |
| Mobile | `/mobile/lists/:listId/bookings/:bookingId` | same route, depth 2 = `BookingDetailScreen` | stale bookingId redirects to list (routes.tsx:56); `/cards/` URL handled by `LegacyBookingRedirect` (routes.tsx:54) |
| Mobile | `/mobile/availability` | `MobileAvailabilityRoute` -> `AvailabilityScreen` | |
| Mobile | `/mobile/balances` | `MobileBalancesRoute` -> `BalancesScreen` | |
| Mobile | `/mobile/more` | `MobileMoreRoute` -> `MoreScreen` | |
| Web | `/web` (`?week=<ISO>`) | `WebDashboardRoute` (web/routes.tsx:30) -> `DashboardScreen` | week anchor Monday-normalised URL param (routes.tsx:39-46); stepping uses `replace` |
| Web | `/web/lists` | `WebListsRoute` -> `ListsScreen` | |
| Web | `/web/lists/:listId` | `WebListDetailRoute` -> `ListDetailView` | `RequireEntity` shows not-found for unknown id |
| Web | `/web/lists/:listId/bookings/:bookingId` | `WebBookingDetailRoute` -> `BookingDetailView` | `/cards/:cardId` -> `LegacyBookingRedirect` |
| Web | `/web/availability` | `WebAvailabilityRoute` -> `AvailabilityGrid` | |
| Web | `/web/accounts` | redirects to `/web/accounts/overdue` | |
| Web | `/web/accounts/:subTab` | `WebAccountsRoute` -> `AccountsScreen` | subTab in `overdue|payments|gst`, else not-found; `?invoice=<invoiceNumber>` highlights a Payments row (routes.tsx:139) |

Cover dialogs are local state, not routes, on both apps (so Back does not just close a sheet).

## 2. Mobile (`apps/mobile/`)

### Shell: `MobileApp.tsx`, `navigation.ts`, `outlet.ts`, `routes.tsx`, `components/`
- `MobileApp` = layout: `SurfaceProvider variant="mobile"` (all shared sheets render as bottom sheets), `<Host>` (`PhoneFrame` in prototype, `MobileViewport` in PWA), `Outlet` with context `{actor, anaesthetistId, personaName, personaRole, initials, moreExtra}` (outlet.ts). `moreExtra` = PWA presenter controls slot injected into More.
- Bottom tab bar (MobileApp.tsx:25-85): Lists, Availability, Balances, More (lucide icons). Shown only at depth 0 of the Lists stack and on the other tabs (`showTabBar`, ~L140); List and Booking layers are full-bleed. No badges or counts.
- `MobileListsRoute` (routes.tsx:33): owns `AddBookingFlow` (open state) and `RequestCoverSheet kind='offer'` (state `offer`). Pops use `navigate(..., {replace:true})` (routes.tsx:68-70). Edge-swipe-back wired to the same handlers (`popLayer`, routes.tsx:83).
- `SlideStack.tsx`: all layers stay mounted, transform-animated; edge swipe back (28px edge zone, 10px axis lock, commit at 35% width or 0.5px/ms, L28-40). Test `SlideStack.test.tsx`.
- `components/index.ts` re-exports shared primitives under mobile names (BottomSheet, MobileButton, TickBadge, FieldLabel, TextField, TextArea, Segmented, ListRow). Mobile-only: `SlideStack`, `MobileHeader` (eyebrow, 26px title, persona avatar).

### Forward Lists: `screens/ForwardListsScreen.tsx` (Lists tab, depth 0)
- Greeting "Kia ora, Dr Souter" (`drSurname`), eyebrow `dayHeading(today)`.
- Filter pills (L10-17): **Week** (today to +7d), **Month** (to +31d), **To-Do**, **Done**. Logic `inWindow` L72-81:
  - To-Do: `list.state==='DRAFT'` and any non-cancelled booking not completed; NO date limit (includes past).
  - Done: `state` SUBMITTED or AUTHORISED (still unbilled); no date limit.
  - Week/Month: `dateISO >= today` only.
- Billed lists (`isListBilled`: `billedAtISO` set, selectors.ts:118) vanish from every filter (L64-66).
- Row building `toRow` L95-152, grouped by date, AM before PM (L156-168):
  - holiday: title = notes or "On leave", chip "Holiday", not tappable.
  - free: "Free session"; if `coverRequest` set shows "Cover request sent" + "Requested" (not tappable) else "Offer cover" affordance -> `onOfferCover` opens `RequestCoverSheet(kind='offer')`.
  - unavailable: omitted (`return null` L123).
  - booked (private/public/preop): title hospital name or "AA rooms"; preop title "Pre-op assessment", subtitle "AA rooms"; subtitle surgeon name . specialty (or list notes); right = `doneUnbilled` (submitted/authorised/all bookings done), `toFinish N` (date <= today and incomplete), else `count`. Preop counts "appointments" not "bookings" (L146).
- Empty texts per filter (L210-217). No search, no date picker, no patient detail on this screen.
- Reads `schedule.lists/bookings`, `masters.hospitals/surgeons`, `useToday()`. Writes: none.

### List detail: `screens/ListDetailScreen.tsx` (depth 1)
- Header: back "Lists", "<Hospital|Pre-op assessment> AM|PM", subline surgeon . specialty . Today/ISO date . `sessionTimeRange(list)` (office-overridden times show), `StatusChip` (list.statusKey), "N of M complete" bar (cancelled bookings excluded, L85-106).
- Booking rows (L72-84) sorted by `scheduledTime` then id: time, patient name (selectable), NHI (mono), primary operation (lowest-id procedure description else "Procedure to capture"). Right side: "Cancelled" (strikethrough, 0.6 opacity), animated `TickBadge` if completed (animates only for bookings completed after mount, L47-61), else "Capture" pill. Tap -> booking layer.
- **List attachments panel** (L232-252, US-03.1.3): shown when `list.state==='DRAFT'` or list already has attachments; `AttachmentStrip` + `AddAttachmentButton` -> `AddAttachmentSheet target {kind:'list'}`; remove via `removeAttachment(useAppStore, actor, {kind:'list', id}, attId)`. Read-only when not DRAFT.
- "Add a booking" dashed row, DRAFT only (L254-276), opens shared `AddBookingFlow` (owned by routes.tsx).
- Sticky footer (L284-379), states: `list.state !== 'DRAFT'` green "Submitted to office"; `incomplete>0` grey "Mark list completed . N to finish / Tap to see what is left" (still tappable, opens blockers sheet); all done teal "Mark list completed" (opens confirm). Both open shared `SubmitListSheet` (mode blockers|confirm) which calls `submitList`. Success: `SuccessOverlay` "List submitted / Sent to the office for review", auto-dismiss 1050ms (L41-45).
- `canEdit = list.state==='DRAFT'` is UI-only; the store re-checks (`editRefusal`).

### Booking detail: `screens/BookingDetailScreen.tsx` (depth 2)
- Phone chrome only: back "List", folding masthead (collapses after 24px scroll to a nav row with name + status chip), patient name, `StatusChip` (the LIST's status), History link (supplied by body), "<primary op or 'Operation to capture'> . <hospital|AA rooms>" (L111-113). NHI/DOB are in the body's Patient section, not the masthead.
- Renders shared `BookingDetailBody` with `header` render-prop; `onBack` also fires after the completion overlay; `onCopied(newId)` navigates to the copy's URL (routes.tsx:~126). See section 4.

### Availability: `screens/AvailabilityScreen.tsx`
- Header "Find cover / Availability". 6-day strip today..+5 (L47-55); a dot on a day when ANY anaesthetist has a `free` list. Segmented Everyone / Free only (`mode`); summary "N free sessions on <date>" (all anaesthetists, L65).
- **My availability** card (L182-202): AM and PM rows with current own status label (`cellTitle`) and buttons **Free** (`'available'`) and **Block** (`'unavailable'`) only. Calls `setAvailability(useAppStore, actor, id, date, session, kind)` (L100-114). Result line by `reconciled`: restatused "AM session updated on the canvas." / conflictFlagged "... has bookings; a conflict was flagged and the office notified." / noChange "unchanged". The action supports `'holiday'` (and a `note`) but the screen has NO Leave button and no note field, no recurring/range/bulk.
- Colleague cards (all other anaesthetists, name-sorted, L61-64): AM/PM cell shows `statusColours`-styled status only: title hospital / "Free" / "Leave" / "Unavailable" / "Pre-op" / "No session"; subtitle hospital . surgeon (L72-88). Free cell without pending request is tappable -> `RequestCoverSheet(kind='request', targetAnaesthetistId)`; pending shows "Cover requested". "Free only" mode filters colleague rows to any free slot.
- Selecting a day clears the result message. Window is fixed to today +5; no calendar picker.

### Balances: `screens/BalancesScreen.tsx`
- Source: billing MIRROR (`store.billing`), never Xero. Header "Your account / Balances".
- Total card (L61-70): `receivablesAgingFor(...).aging.total` and count of rows from `outstandingAccpayInvoicesFor`.
- Segmented **Outstanding** | **GST this month**:
  - Outstanding: flat card list (no rollup): patient name, outstanding amount, `invoiceNumber . counterpartyLabel`, `AgeChip` (L124-136: "Nd", amber when `days > 60`, plus "ACC" chip when `accRelated`). Empty: "No outstanding invoices. Balances appear the day after billing."
  - GST this month: `gstActivityFor(state, id, firstOfMonth, today)` (L43-47): each receipt gross, `d MMM . payer`, GST; footer "GST component" total; header "<Month yyyy> received" gross total. Empty: "No payments received this month yet."
- Nothing is tappable. No payment history, invoice detail, payout status or other GST periods on mobile (web has them).

### More: `screens/MoreScreen.tsx`
- Persona card (avatar, name, "Anaesthetist"), "Demo prototype" `DemoBadge` plus fictional-data note, then `extra` slot (PWA: clock, Reset, office simulation; see shell-demo-pwa map). No settings, profile, notification prefs, logout. Effectively visual-only.

## 3. Web (`apps/web/`)

### Shell: `WebApp.tsx`, `components/`, `routes.tsx`, `outlet.ts`, `types.ts`
- `WebApp`: `SurfaceProvider variant="web"` (shared sheets render as centred dialogs), `min-width:1240`, content max 1320 (desktop only, no responsive). Outlet context `{anaesthetistId, personaName, actor, todayISO, onCover}`. Owns the single `RequestCoverSheet` (state `cover: CoverTarget`, `types.ts`).
- `components/WebNav.tsx`: AA `Logo`, tabs Dashboard / Lists / Availability / Accounts (crimson underline = identity), persona name + MS avatar, static (no menu, no logout, no notifications).
- `components/Panel.tsx`: white card wrapper. `components/WeekStrip.tsx`: dashboard week grid.
- `useDashboardFigures.ts`: memoised `deriveDashboardFigures(state.dashboards[id])` (seeded figures; undefined for non-Souter).

### Dashboard: `screens/DashboardScreen.tsx` (+ `WeekStrip`)
- Header "Kia ora, Dr Souter" + summary (L139): `EEEE d MMMM . N lists today . N bookings . N awaiting submission`. `daySummary` (L71-84): today's own lists with `billedAtISO===undefined` and status private/public/preop, active (non-cancelled) bookings, and DRAFT lists whose active bookings are all completed ("awaiting").
- **Offer cover** button (L151-170): own next free list today or later with no `coverRequest` (L87-93); disabled with tooltip when none. -> `onCover({kind:'offer'})`.
- **This week** `WeekStrip` (components/WeekStrip.tsx): 7 Monday-anchored columns (`weekDays`), AM/PM block from own non-billed lists (`slotFor` L36-42), coloured by `statusColours`, shows `sessionTimeRange` (not for holiday/unavailable), free = dashed, both-session holiday merges into one tall block, today highlighted, prev/next week (URL `?week`). Every block (including free/holiday/unavailable) clicks through to `/web/lists/:id` (differs from Lists table).
- **Receivables aging** (L184-218): `receivablesAgingFor(billing/schedule/masters)`; bars Current / 31 to 60 / 61 to 90 / 90+ with % and amounts; "N accounts over 60 days . view overdue accounts" -> `/web/accounts/overdue`. Live from mirror; empty text if no rows.
- **Productivity** (L221-253): seeded tiles UNITS (with always-plus `+N%` pill), LISTS, AVG UNITS/LIST, FEES INVOICED, "6 months: N units . +/-N% vs last year" (delta computed in the component from seeded six-month vs prior year). Seed: `domain/seed/anaesthetistDashboard.ts:48-57`, Souter only; "No productivity history yet" for others. Not derived from bookings.
- **Leave** (L256-277): seeded rows (`anaesthetistDashboard.ts:58-60`; e.g. 24-26 Jul "Annual leave" Approved, a later Pending row); read-only; no request/approve action; not linked to availability or holiday lists.
- **Who's free . next 5 days** (L96-114, 280-341): live scan of OTHER anaesthetists' `free` lists per day+session; chip per anaesthetist (surname) -> `onCover({kind:'request', targetAnaesthetistId})`; chip disabled with tick when `coverRequest` already set; "Ask to cover" asks the first unrequested; "Full availability grid ->" link; phone number only in tooltip.

### Lists: `screens/ListsScreen.tsx`
- Table of own, unbilled (`isListBilled`) lists in a From/To native date range (default today to +28d; cleared input = unbounded; L45-46, 59-74). Columns Date (status colour bar, "Today"), Session, From, To (list `startTime`/`endTime`, "." when unset), Description (`describe` L49-58: hospital . surgeon . specialty, or notes, or defaults), `StatusChip`. `StatusLegend variant="chips"`. Only private/public/preop rows clickable (L72) -> `/web/lists/:id`. No status/hospital filter, no search.

### List detail: `screens/ListDetailView.tsx`
- Page header (title AM|PM, `StatusChip`, subline), top-right `SubmitAction` (L271-320): non-DRAFT "Submitted to office" / `N to finish before submitting` (opens blockers `SubmitListSheet`) / "Mark list completed" (confirm). No success overlay on web.
- "Bookings" panel: progress bar + table Time, Patient (+NHI, "NHI pending" if absent), Procedure ("+N more"), **Units**, **Fee**, Status (Cancelled / Complete + tick / Capture pill) (L150-226); totals row over non-cancelled bookings (L212-223). Units and fee per booking come from `bookingFee(procs, list, masters, billingLines)` (`shared/capture`), a LIVE calculation shown to the anaesthetist (note `BookingDetailBody` hides the fee from anaesthetist actors, `showBookingTotal = actor.role !== 'anaesthetist'` L135; this table does not, so the web list view exposes fees the booking view hides).
- "Add a booking" (DRAFT only) -> `AddBookingFlow` dialog. **List attachments** panel (L240-254) same rules as mobile, via `AddAttachmentSheet`/`removeAttachment`.

### Booking detail: `screens/BookingDetailView.tsx`
- Page header: patient name, mono line `nhiBadge(nhi).text . DOB dd/mm (age y)` (`formatDob`, `ageYears`), primary op . hospital, `StatusChip` (list status), History action (from body), back "List". Then `BookingDetailBody`.

### Availability grid: `screens/AvailabilityGrid.tsx`
- ALL anaesthetists (including self, marked "(you)") x AM/PM for one day; prev/next day, "Today", chips "All anaesthetists" / "Free only . N", name search, six-status legend (`StatusChip` x6). Cells (L174-213): status label + hospital/surgeon or notes; free cells show "Book" (dashed); after a request is sent (list.coverRequest) the cell becomes solid green "Cover requested" with a tick and is disabled. Free cell click -> `onCover`: own = `offer`, others = `request` with `targetAnaesthetistId` (L88-98). Non-free cells inert.
- Web has NO control to set the persona's own availability (Free/Block/Leave) or request leave; only mobile can set Free/Block.

### Accounts: `screens/AccountsScreen.tsx` (test `AccountsScreen.test.tsx`)
- Sub-tabs Overdue / Payments / GST activity (route-driven).
- **Overdue** `OverdueTable` (L80-165): `receivablesAgingFor(...)`: one row per outstanding ACCPAY invoice, oldest first, no rollup: Invoice, Patient, Payer, Raised date, amount placed in its aging bucket column (Current / 31 to 60 / 61 to 90 / 90+), ACC flag; footer per-bucket totals + grand total. Empty: "...appear here the day after they are billed."
- **Payments** `PaymentsTable` (L174-263): `paymentHistoryFor` (selectors.ts:762): Date received, Invoice, Patient, Payer, Customer paid, AA fee (shown negative: `receivedAmount - authorisedAmount`), Net to you (`authorisedAmount`), Paid to you (`disbursedAmount`), status pill (`partPayment` "Part payment received", `customerPaid`, `partPaidOut` "Part paid to you", `paidOut` "Paid to you"; L167-172). Newest first. `?invoice=` highlights a row. Footnote calls the AA service fee "illustrative".
- **GST activity** `GstReport` (L272+): Segmented Monthly / Bi-monthly / Six-monthly, default from `masters.anaesthetists[id].gstPeriod` (Souter `monthly`, `seed/cast.ts:45`); rolling window = start of month (N-1 months ago) to today (`periodWindow` L266-270); rows from `gstActivityFor`: date received, invoice, payer, amount received, GST component, with totals. Switching period is local state only (not saved to the master).

## 4. Shared components/flows used here (entry points only)
- `shared/booking/BookingDetailBody.tsx` (787 lines; both apps). Sections: banners (cancelled, copied-from, post-op addendum, prepayment required/outstanding/paid with text "A warning, never a block: this Booking can still be completed and submitted", L462-530; raise-pre-procedure-invoice and `OfficeBillingSetup` are office-only), Patient (NHI, DOB, contact, edit link, `EditPatientSheet`), scheduled-time stepper +/-5 min (`editBooking`), Attachments (`AttachmentStrip`, `AddAttachmentSheet target booking`), Notes for the office (`editBooking`), per-procedure `BtmCaptureBlock` (`shared/capture`), Add another procedure (`addProcedure`), Copy booking (`copyBooking`), Cancel booking (`CancelBookingSheet` -> `cancelBooking`), Post-op addendum on AUTHORISED bookings (`addPostOpAddendum`), `CompleteBar` (Mark complete / Amend) + `CompletionOverlay`, `HistorySheet` ("Booking history", audit-derived). Edit rights mirror store: `canEdit = !cancelled && list.state!=='AUTHORISED' && (DRAFT || office)` (L313), so an anaesthetist edits only own DRAFT lists.
- `shared/flows/SubmitListSheet.tsx`: blockers mode lists each incomplete non-cancelled booking with `completionBlockersFor` messages (validation failures verbatim); confirm mode explains SUBMITTED; calls `submitList`.
- `shared/flows/AddBookingFlow.tsx`: chooser "Enter manually" / "Photo of paper list (demo)". Manual = `ManualBookingForm` (NHI + "Look up NHI" via `domain/nzhis` `lookupNhi`, name, DOB, operation required; also procedure code, billing route/insurer/billable party fields) -> `createBooking` (store/bookingActions.ts:78). Photo = `PhotoCaptureFlow`: pick one of canned `SAMPLE_EXTRACTIONS`, 900ms fake processing (PhotoCaptureFlow.tsx:29), prefilled review form.
- `shared/flows/RequestCoverSheet.tsx`: optional message -> `requestCover`; success tick "Request sent".
- `shared/attachments/` (`AttachmentStrip`, `AddAttachmentSheet`, `AddAttachmentButton`): picker is SIMULATED (bundled sample files only, no real camera/file input), badged as such.
- Other shared primitives used by screens: `StatusChip`, `StatusLegend`, `Avatar`, `Logo`, `DemoBadge`, `DockSpacer`, `SuccessOverlay`, `TickBadge`, `SlidingSegmentedControl`/`Segmented`, `ListRow`, `SurfaceProvider`, `format.ts` helpers (`dayHeading`, `drSurname`, `sessionTimeRange`/`sessionStart`, `mondayOf`, `weekDays`, `nhiBadge`, `formatCurrency`, `initialsOf`), `shared/legacy` redirect.

## 5. Store actions and selectors called from this area
| Name | File:line | Caller here |
|---|---|---|
| `submitList` | store/lifecycle.ts:210 | SubmitListSheet (both apps) |
| `completeBooking` / `uncompleteBooking` | lifecycle.ts:115 / 164 | via BookingDetailBody |
| `completionBlockersFor` | lifecycle.ts:~93 | SubmitListSheet, body |
| `cancelBooking` | lifecycle.ts:348 | via CancelBookingSheet |
| `setAvailability` | lifecycle.ts:698 | mobile AvailabilityScreen only |
| `requestCover` | lifecycle.ts:843 | RequestCoverSheet (both) |
| `editRefusal` (guard) | lifecycle.ts:48 | all writes above |
| `createBooking` / `copyBooking` | store/bookingActions.ts:78 / 196 | AddBookingFlow / body |
| `addAttachment` / `removeAttachment` | store/attachmentActions.ts:69 / 115 | list attachment panels (direct), body |
| `isListBilled` | store/selectors.ts:118 | ForwardLists, WeekStrip, ListsScreen |
| `accpayInvoicesFor` / `outstandingAccpayInvoicesFor` / `receivablesAgingFor` | selectors.ts:648 / 662 / 678 | Balances, Dashboard, Overdue |
| `gstActivityFor` | selectors.ts:708 | Balances, GstReport |
| `paymentHistoryFor` | selectors.ts:762 | PaymentsTable |
| `useToday` (demo clock) | selectors.ts:1030 | most screens |
| `dashboardFiguresFor` / `deriveDashboardFigures` | selectors.ts:128 / seed | Dashboard via hook |

## 6. Business rules and calculations visible here
- **List model**: `dateISO`, `session` AM|PM, `statusKey` private|public|preop|holiday|unavailable|free, `state` DRAFT|SUBMITTED|AUTHORISED, optional `startTime`/`endTime`, `billedAtISO`, `coverRequest`, `conflicts`, `attachments?`. Two lists per anaesthetist per day; screens assume at most one list per slot (`find`).
- **Billed = gone**: `isListBilled` keys on `billedAtISO` (stamped by billing run), not AUTHORISED. Applied: mobile Forward Lists, web WeekStrip, web Lists, web `daySummary`. Availability screens ignore it.
- **Edit rights** (`editRefusal` lifecycle.ts:48): AUTHORISED locked for all; anaesthetist only own list and only DRAFT; office DRAFT and SUBMITTED; integration only DRAFT.
- **Completion/submission gate**: `completeBooking` refuses on cancelled, integration actor, edit rights, already complete, and `completionBlockersFor` = `validateBookingForBilling` failures (domain/billing). Prepayment is NOT a blocker since Phase 15a (it is a warning banner only, lifecycle.ts comment ~L80). `submitList` (L210): DRAFT only; not integration/system; own list; every non-cancelled booking completed else "(N to finish)". Cancelled bookings never block.
- **setAvailability reconciliation** (L698-800): writes the availability master row, then restatuses the slot's list only if "unreserved" (no hospital, no surgeon, no active bookings, no list attachments) and DRAFT; otherwise adds an `availability` conflict on the list for the office ("never a silent change"); un-block is symmetric. Anaesthetist can only set own; integration forbidden.
- **requestCover rules** (L843-895): actor role anaesthetist; list `statusKey==='free'`; `offer` only on own list; `request` not on own list; refuses if `coverRequest` already set. Sets `coverRequest {by, kind, atISO, status:'pending', message?, targetAnaesthetistId?}` + audit `list.coverRequest`. Nothing here or anywhere in src (grep) ever changes `status` from pending, accepts, declines, notifies, or converts to a booking.
- **Next-day handover**: `accpayInvoicesFor` excludes invoices raised on or after today (selectors.ts:~655 `epochDayOf(raisedAtISO) >= todayDay`), so Balances, Overdue and dashboard aging show an invoice the day AFTER billing. Payments and GST read receipts and show immediately.
- **Aging**: `bucketForAgingDays` (domain/dateDays.ts:21): <=30 current, <=60, <=90, else 90+. `accountsOver60` and the mobile amber chip use `> 60`. Outstanding = invoice total minus received, filtered to > 0 cents.
- **Payment history** (selectors.ts:762-830): service fee = received - authorised; net = authorised; status: fullyDisbursed and fullyReceived -> paidOut; any disbursed -> partPaidOut; fullyReceived -> customerPaid; else partPayment.
- **GST**: sum of receipts (`gstAmount`, gross) for the anaesthetist in the window.
- **Fee display on web list view**: `bookingFee()` calculator (domain/billing via shared/capture), units and total over active bookings.
- Formatting helpers: `shared/format.ts` (`drSurname` L149, `sessionTimeRange` L68, `mondayOf` L100).

## 7. Demo and simulator affordances in this area
- Demo clock: `useToday()` drives all "today" logic here; controlled by the harness bar or, in the PWA, `moreExtra` (More tab) via `pwa/PwaDemoPanel.tsx`. Nothing in mobile/web screens advances it.
- Badges: "Demo prototype" (More), "NHI FHIR lookup . Digital Services Hub" (ManualBookingForm), "Simulated capture . sample paper cards" / "Simulated OCR . no real processing" (photo flow), simulated attachment picker.
- No per-screen demo trigger, simulator button or "demonstrate" control in these folders. Balances/Accounts content depends on admin billing run and Xero/integration simulators elsewhere.
- Phone chrome: `PhoneFrame` host (prototype) vs `MobileViewport` (PWA), inset CSS vars `--aa-inset-*`.

## 8. Stubbed, hardcoded, seeded, visual-only
- Productivity and Leave panels: seeded constants, Souter only, not derived from bookings or availability; Leave has no request path.
- More tab: static persona card.
- Web nav name/avatar: static label.
- Add photo / attachments: bundled sample files; photo-of-paper OCR is canned `SAMPLE_EXTRACTIONS`; NHI lookup is local table `domain/nzhis`, not FHIR.
- Cover offer/request: marker + audit only; no notification, response, acceptance, or resulting booking; target's phone appears only in a dashboard tooltip.
- AA service fee on Payments labelled "illustrative"; fee is data-derived (received minus authorised), not a configured rate here.
- Mobile availability window fixed today..+5; web Lists default +28d is UI only.
- Web app is fixed desktop width (min 1240), no responsive layout.

## 9. Not present in these apps (search elsewhere first)
- Anaesthetist-side leave request/approval, recurring/range/bulk availability, availability editing on web, Leave button on mobile.
- Any notification (in-app, push, email, SMS), cover acceptance flow, messaging with office.
- Patient or booking search, history/archive view for billed lists, reports beyond dashboard tiles and the GST table, export/print/download of any account view.
- Invoice detail, remittance advice, per-invoice drill-down on mobile or web (`?invoice=` only highlights).
- Any authorise/approve control, fee schedule or billing-route admin, profile/settings, multi-persona or role switching, offline beyond the PWA build.
- Booking-level features (procedure coding, BTM rules, times, modifiers, route/funder allocation, prepayment, post-op addendum, cancellation, history) live in `shared/booking`, `shared/capture`, `shared/flows` and `domain/billing`, not here.
