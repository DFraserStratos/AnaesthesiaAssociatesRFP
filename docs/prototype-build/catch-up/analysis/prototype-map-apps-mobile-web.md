# Prototype map: Anaesthetist Mobile App and Anaesthetist Web App

All paths relative to `aa-prototype/src/`. Line numbers verified against the code on 2026-09-30. The code is the truth; comments in it cite old phases and are not proof.

**Orientation.** Both apps are React front ends run as one persona, Dr Melanie Souter (`shell/appConfig.ts:27`, registration no. `34821`, initials MS). Both read the in-memory store (`useAppStore`, `store/`) and write only through store actions with an `Actor` `{who, role:'anaesthetist', source:'anaesthetist', anaesthetistId}` built in `MobileApp.tsx:111` / `WebApp.tsx:44`. There is no login, no other anaesthetist persona and no real notification. Every read is filtered to `anaesthetistId` except the availability screens, which show all anaesthetists' session STATUS only. Mobile = 4 tabs (Lists slide-stack of 3 layers, Availability, Balances, More). Web = 4 nav tabs (Dashboard, Lists with list and card drill-down, Availability, Accounts with 3 sub-tabs). Card capture (procedure codes, BTM, times, units, billing lines, validation, complete/amend/cancel/copy) is NOT in these folders: both apps embed the same `shared/card/CardDetailBody.tsx`, so card behaviour is identical on both. Route table is in `router.tsx:70-120`.

## Contents
1. Routes at a glance
2. Mobile screens (Forward Lists, List detail, Card detail, Availability, Balances, More, shell/nav)
3. Web screens (Dashboard, Lists, List detail, Card detail, Availability grid, Accounts)
4. Shared flows both apps call (card body, submit, add card, cover)
5. Business rules and calculations (with lines)
6. Demo and simulator affordances
7. Stubbed, hardcoded, seeded or visual-only
8. Not present in these apps (gaps a reviewer may hit)

## 1. Routes at a glance

| App | Route | Component (file) | Notes |
|---|---|---|---|
| Mobile | `/mobile` | redirects to lists (router.tsx ~L113) | `MobileApp` layout, `host={PhoneFrame}` |
| Mobile | `/mobile/lists/*` | `MobileListsRoute` (mobile/routes.tsx:33) | ONE route hosting a 3-layer `SlideStack`; depth from URL |
| Mobile | `/mobile/lists/:listId` | same, depth 1 → `ListDetailScreen` | `listsStackLocation` navigation.ts:38 |
| Mobile | `/mobile/lists/:listId/cards/:cardId` | same, depth 2 → `CardDetailScreen` | stale ids redirect back a layer (routes.tsx:55-56) |
| Mobile | `/mobile/availability` | `MobileAvailabilityRoute` → `AvailabilityScreen` | |
| Mobile | `/mobile/balances` | `MobileBalancesRoute` → `BalancesScreen` | |
| Mobile | `/mobile/more` | `MobileMoreRoute` → `MoreScreen` | |
| Web | `/web` (`?week=<ISO>`) | `WebDashboardRoute` (web/routes.tsx:30) → `DashboardScreen` | week anchor is a URL param, Monday-normalised (routes.tsx:39-46) |
| Web | `/web/lists` | `WebListsRoute` → `ListsScreen` | |
| Web | `/web/lists/:listId` | `WebListDetailRoute` → `ListDetailView` | `RequireEntity` 404s unknown id |
| Web | `/web/lists/:listId/cards/:cardId` | `WebCardDetailRoute` → `CardDetailView` | |
| Web | `/web/availability` | `WebAvailabilityRoute` → `AvailabilityGrid` | |
| Web | `/web/accounts/:subTab` | `WebAccountsRoute` → `AccountsScreen` | subTab in `overdue|payments|gst`; invalid → not-found; `?invoice=<no>` highlights a payments row (routes.tsx:139) |

Web layout `WebApp.tsx`: min-width 1240 (desktop only, no responsive), max content 1320; nav `components/WebNav.tsx` (Dashboard/Lists/Availability/Accounts, crimson underline, persona name + avatar, no dropdown/logout). Cover dialog is local state, not a route (`WebApp.tsx:52`).

## 2. Mobile

### Shell: `mobile/MobileApp.tsx`, `navigation.ts`, `outlet.ts`
- Bottom tab bar (`MobileApp.tsx:25`): Lists, Availability, Balances, More. Hidden when Lists stack depth > 0 (L132), so List and Card layers are full-bleed.
- Outlet context (`outlet.ts`): actor, anaesthetistId, personaName, personaRole, initials, `moreExtra` slot (PWA presenter controls injected here).
- `host` prop required: `PhoneFrame` in the prototype, `MobileViewport` in the PWA (`src/pwa/`). Uses `SurfaceProvider variant="mobile"` (sheets are bottom sheets).
- `components/SlideStack.tsx`: keeps all layers mounted, transform-animated; edge-swipe-back (28px edge zone, 10px axis lock, commit at 35% width or 0.5 px/ms, L31-42). `onPop` wired to the same handlers as on-screen back (routes.tsx:82). Pops use `navigate(..., {replace:true})` (routes.tsx:68-70). Test: `SlideStack.test.tsx`.
- `MobileHeader` (eyebrow, 26px title, MS avatar) used by tab screens.

### Forward Lists: `screens/ForwardListsScreen.tsx` (Lists tab, depth 0)
- Header: `dayHeading(today)` eyebrow, "Kia ora, Dr Souter" (`drSurname`).
- Filter pills L10-17: **Week** (today to +7d), **Month** (to +31d), **To-Do**, **Done**. Filtering in `inWindow` L72-81:
  - To-Do: `state==='DRAFT'` and any non-cancelled card not completed (no date limit, includes past).
  - Done: `state` SUBMITTED or AUTHORISED (still unbilled), no date limit.
  - Week/Month: `dateISO >= today` only.
- Billed lists (`isListBilled`: `billedAtISO` set, store/selectors.ts:118) vanish from every view (L64-66).
- Row types (`toRow` L95-152), grouped by date, AM before PM:
  - holiday: "On leave" chip; free: "Free session" + "Offer cover" affordance, or "Requested" if `coverRequest` set; tap opens `RequestCoverSheet(kind='offer')` via route `offerCover` (routes.tsx:84); unavailable: hidden (`return null` L123).
  - booked (private/public/preop): title = hospital or "AA rooms" (preop → "Pre-op assessment"); subtitle = surgeon · specialty (or list notes); right side: `doneUnbilled` (submitted/authorised/all cards done), `toFinish N` (list date <= today and cards incomplete), else card count. Preop counts "appointments" not "cards".
- Empty states per filter. Reads: `schedule.lists/cards`, `masters.hospitals/surgeons`, `useToday()` (demo clock).
- No search, no date picker, no list history beyond Done.

### List detail: `screens/ListDetailScreen.tsx` (depth 1)
- Header: back "Lists", "<Hospital|Pre-op assessment> AM/PM", subline surgeon · specialty · Today/ISO date · `sessionTimeRange` (shows office-overridden times), `StatusChip` (list statusKey), progress "N of M complete" bar (cancelled cards excluded).
- Card rows sorted by `scheduledTime` then id (L73): time, patient name, NHI (mono), primary operation (lowest-id procedure description, else "Procedure to capture"). Right: "Cancelled" (strikethrough, 0.6 opacity), animated `TickBadge` if completed (only animates for cards completed after the screen mounted, L49-61), else "Capture" pill.
- "Add a card" dashed row, only when `list.state==='DRAFT'` (L102, L230). Opens shared `AddCardFlow` (routes.tsx:133).
- Sticky footer (L260-355): state != DRAFT → green "Submitted to office"; incomplete>0 → grey "Mark list completed · N to finish / Tap to see what is left" (still tappable, opens blockers sheet); all done → teal "Mark list completed" (opens confirm). Both open shared `SubmitListSheet` (mode blockers|confirm). On success, `SuccessOverlay` "List submitted / Sent to the office for review", auto-dismiss 1050ms.
- Calls: `submitList` via the sheet only. Nothing else writes here.

### Card detail: `screens/CardDetailScreen.tsx` (depth 2)
- Phone chrome only: back "List", folding masthead (collapses past 24px scroll into a nav row with inline name + status chip, L34-40), patient name, `StatusChip`, History link, "<primary op> · <hospital>". Then `CardDetailBody` (shared, see §4). NHI/DOB deliberately not in masthead; they are in the body's Patient section.
- `onBack` also fired after completion overlay dismisses; `onCopied` after Card Copy returns to list.

### Availability: `screens/AvailabilityScreen.tsx`
- Header "Find cover / Availability". 6-day strip from today (L47-55) with dot when any list that day is `free` (across ALL anaesthetists). Segmented: Everyone / Free only. Summary "N free sessions on <date>" (all anaesthetists).
- "My availability" card (L182-202): AM and PM rows showing own slot status, buttons **Free** and **Block** only. Calls `setAvailability(useAppStore, actor, id, date, session, 'available'|'unavailable')` (L100-114). Result message from `reconciled`: restatused → "session updated on the canvas"; conflictFlagged → "has bookings; a conflict was flagged and the office notified"; else "unchanged". The 'holiday' kind is supported by the action but has NO button here.
- Colleague cards (all other anaesthetists, sorted by name): AM/PM cells with status only (A8: no patient detail): title = hospital / Free / Leave / Unavailable / Pre-op / "No session"; subtitle hospital · surgeon. Free cell (no pending request) is tappable → `RequestCoverSheet(kind='request', targetAnaesthetistId)`; pending shows "Cover requested". Cells use `statusColours` (free = dashed, unavailable = hatch).
- Selecting a different day clears the result message. Dates limited to today +5.

### Balances: `screens/BalancesScreen.tsx`
- Source: billing-engine MIRROR only (never Xero). Header "Your account / Balances".
- Total card: `receivablesAgingFor(...).aging.total` and count of unpaid invoices.
- Segmented: **Outstanding** (flat list of ACCPAY invoices from `outstandingAccpayInvoicesFor`: patient name, outstanding amount, invoice number · payer, age chip `Nd`, amber if > 60 days, "ACC" chip if any procedure `accRelated`) and **GST this month** (`gstActivityFor` from first of current month to today: each receipt gross, date · payer, GST; footer "GST component" total; header "<Month yyyy> received" gross total).
- Empty text: "No outstanding invoices. Balances appear the day after billing." (next-day visibility is real logic, see §5).
- No payment history, no invoice detail, no pay-out status on mobile (web has these).

### More: `screens/MoreScreen.tsx`
- Persona card (avatar, name, role), a "Demo prototype" badge with fictional-data note, and `extra` slot (PWA: clock, Reset, office simulation). No settings, profile, notification prefs, logout. Effectively visual-only.

## 3. Web

### Dashboard: `web/screens/DashboardScreen.tsx` (+ `components/WeekStrip.tsx`, `useDashboardFigures.ts`)
- Header "Kia ora, Dr Souter" and summary line (L139): date · N lists today · N cards · N ready to submit. `daySummary` L71-84: today's unbilled booked lists (private/public/preop), active cards, and lists in DRAFT whose active cards are all completed ("awaiting").
- **Offer cover** button: the persona's NEXT free session (today or later, no pending cover request, L87-93); disabled with tooltip if none. Opens `RequestCoverSheet(kind='offer')` through outlet `onCover`.
- **This week** `WeekStrip`: 7 Monday-anchored columns, AM/PM block per day from own lists excluding billed (`isListBilled`), colour by `statusColours`, actual `sessionTimeRange`, free = dashed, both-sessions holiday merges to one tall block, today outlined crimson, prev/next week (URL `?week`), blocks click through to `/web/lists/:id` (including free/holiday/unavailable blocks, unlike the Lists table which restricts to booked). Note the Lists route for a free list still renders `ListDetailView`.
- **Receivables aging** panel: `receivablesAgingFor` buckets Current / 31-60 / 61-90 / 90+ with bars and %, "N accounts over 60 days · view overdue accounts" → `/web/accounts/overdue`. Live from billing mirror.
- **Productivity** panel: units (+% pill), lists, avg units/list, fees invoiced, six-month units and delta vs last year. SEEDED constants (`domain/seed/anaesthetistDashboard.ts:44-52`, period label "July so far"); not derived from cards; only Souter has a set, others honest-empty. `+${unitsChangePct}%` pill is always shown with a plus sign.
- **Leave** panel: seeded rows (`anaesthetistDashboard.ts:53-56`): 24-26 Jul annual leave Approved; 14-16 Sep NZSA conference Pending. Read-only; there is no leave request action anywhere and these rows are not linked to availability/holiday lists.
- **Who's free · next 5 days**: live scan of other anaesthetists' free lists per day/session (L96-114); chip per anaesthetist (surname) → `RequestCoverSheet(kind='request')`; already-requested chip disabled with tick; "Ask to cover" link asks the first unrequested; "Full availability grid →" link. Phone number is only in the tooltip.

### Lists: `screens/ListsScreen.tsx`
- Table of own, unbilled lists in a From/To range (defaults today to +28 days; native date inputs; cleared input = unbounded). Columns Date (with status colour bar, "Today"), Session, From, To (list `startTime`/`endTime`, "·" when unset), Description (hospital · surgeon · specialty or notes), `StatusChip`. `StatusLegend` chips above. Only private/public/preop rows are clickable (L72) → `/web/lists/:id`. Past lists appear if the From date is moved back and they are unbilled. No filter by status, hospital or search.

### List detail: `screens/ListDetailView.tsx`
- Same rules as mobile list detail plus desktop columns: Time, Patient + NHI ("NHI pending" if missing), Procedure ("+N more"), **Units** and **Fee** per card via `cardFee(procs, list, masters, billingLines)` (shared/capture), Status (Cancelled / Complete tick / Capture pill). Totals row (units, fee) over non-cancelled cards (L209-220). Progress bar. "Add a card" (DRAFT only) → `AddCardFlow` dialog. Top-right `SubmitAction` (L251): Submitted (state != DRAFT) / "N to finish before submitting" (opens blockers sheet) / "Mark list completed" (confirm). No success overlay on web (sheet just closes).
- Fee shown here is a live calculation, not an invoice figure; no GST or route split shown.

### Card detail: `screens/CardDetailView.tsx`
- Page header: patient name, NHI badge text (`nhiBadge`), DOB and age (`formatDob`, `ageYears`), primary op · hospital, `StatusChip`, History link. Then shared `CardDetailBody`.

### Availability grid: `screens/AvailabilityGrid.tsx`
- All anaesthetists (including self, marked "(you)") x AM/PM for one day; prev/next day, Today, All / "Free only · N" filter, name search, six-status legend. Cell shows status label plus hospital/surgeon or notes; Free cells: "Book" (dashed) → cover dialog; own free cell → `kind='offer'`, others → `'request'` with `targetAnaesthetistId`; after send the cell turns solid green "Cover requested ✓" and is disabled. Non-free cells are inert.
- The web app has NO control to set the persona's own availability (Free/Block/Leave); only mobile can. Web cannot request leave.

### Accounts: `screens/AccountsScreen.tsx` (test: `AccountsScreen.test.tsx`)
- **Overdue** (`OverdueTable`): `receivablesAgingFor(...).rows`, one row per outstanding ACCPAY invoice, oldest first, no rollup: Invoice no., Patient, Payer, Raised date, amount placed in its aging column (Current, 31-60, 61-90, 90+), ACC flag; footer per-bucket totals and grand total.
- **Payments** (`PaymentsTable`): `paymentHistoryFor` (selectors.ts:763): Date received, Invoice, Patient, Payer, Customer paid (gross), AA fee (gross minus authorisedAmount), Net to you (authorisedAmount), Paid to you (disbursedAmount), Status pill (`partPayment`, `customerPaid`, `partPaidOut`, `paidOut`; L167). Newest first. `?invoice=` highlights a row (green tint). Footnote says the AA service fee is "illustrative".
- **GST activity** (`GstReport`): period Segmented Monthly / Bi-monthly / Six-monthly, default from `masters.anaesthetists[id].gstPeriod`; rolling window = start of month (N-1 months ago) to today (L266-270); rows from `gstActivityFor` (receipt date, invoice, payer, gross, GST) with period totals. Period switch is local state only (not saved to the master).

## 4. Shared flows both apps call (entry points only; internals are in `shared/`)
- `shared/card/CardDetailBody.tsx`: sections Patient (NHI, DOB, contact, edit link), scheduled-time stepper (+/-5 min, `editCard`), Attachments ("Add photo" adds a canned `PAPER_CARD_A` image, L340-350), Notes for the office, per-procedure `BtmCaptureBlock` (code, times, ASA, modifiers, units, billing lines, override; see `shared/capture/`), "Add another procedure", Cancel card, Card total, `CompleteBar` (Mark complete / Amend), `CompletionOverlay` (1050ms), Copy card (`copyCard`), Post-op addendum (`addPostOpAddendum`, locked cards), pre-payment banners with "raise pre-procedure invoice" (`raisePreProcedureInvoice`), office-only pre-payment override and `OfficeBillingSetup` (hidden from anaesthetists). Edit rights mirror the store: `canEdit = !cancelled && list.state !== 'AUTHORISED' && (DRAFT || office)` (L314), so an anaesthetist edits only own DRAFT lists.
- `completeCard` (store/lifecycle.ts:130) refuses on: cancelled, integration actor, edit rights, already complete, validation failures (`validateCardForBilling`, domain/billing), pre-payment unpaid (`completionBlockersFor` L93-125). `uncompleteCard` L179 (Amend).
- `submitList` (lifecycle.ts:225): DRAFT only, not integration, must own list, every non-cancelled card completed else refuses "(N to finish)". `SubmitListSheet` blockers mode lists each incomplete card with the validation messages.
- `AddCardFlow` (`shared/flows`): chooser "Enter manually" or "Photo of paper list (demo)". Manual = `ManualCardForm` (NHI + "Look up NHI" simulated FHIR lookup via `domain/nzhis` `lookupNhi`, name, DOB, phone, operation, scheduled time, payment category segmented, billing reference; name, DOB, operation required) → `createCard`. Photo = pick one of 2 canned sample cards, 900ms fake processing, prefilled review form.
- `RequestCoverSheet`: optional message → `requestCover` (lifecycle.ts:844). Rules: actor must be anaesthetist; list must be `free`; offer only on own list; request not on own list; refuses if a `coverRequest` is already pending. Sets `list.coverRequest {by, kind, atISO, status:'pending', message?, targetAnaesthetistId?}` and writes an audit entry. Nothing is ever accepted, declined or notified; status stays `pending` (check for a demo/office response in `apps/demo` or admin, outside this map).
- Cancel card sheet (`cancelCard` lifecycle.ts:363), Edit patient (`editPatient` store/intake.ts:145), edit/remove procedure, funder allocation sheets are reachable from the card body.

## 5. Business rules and calculations visible here
- **Session model**: each list has `dateISO`, `session` AM|PM, `statusKey` in private|public|preop|holiday|unavailable|free, `state` DRAFT|SUBMITTED|AUTHORISED, optional `startTime`/`endTime` overrides, `billedAtISO`, `coverRequest`, `conflicts`. Two lists per anaesthetist per day.
- **Billed = gone** (M10): `isListBilled` (selectors.ts:118) keys on `billedAtISO` (stamped by the billing run at invoice generation), not AUTHORISED. Applied in mobile Forward Lists, web WeekStrip, web Lists. Also applied in web Dashboard `daySummary` (`l.billedAtISO === undefined`, DashboardScreen.tsx:73). Availability screens include all lists regardless.
- **setAvailability reconciliation** (lifecycle.ts:703-800): writes the availability master row, then restatuses the slot's list only if it is truly empty (Free, no hospital/surgeon, no active cards, DRAFT); otherwise flags a conflict for the office ("never a silent change"). Unblock symmetric. Anaesthetists can only set their own; integrations forbidden.
- **Completion gate**: submit requires all non-cancelled cards completed; completion requires billing validation to pass and pre-payment not blocking.
- **Next-day handover**: `accpayInvoicesFor` (selectors.ts:649) excludes invoices whose `raisedAtISO` day >= today, and requires `invoiceId` + `accRecId`. So Balances, Overdue and dashboard aging appear the day AFTER billing. Payments/GST use receipts and appear immediately.
- **Aging buckets** `bucketForAgingDays` (domain/dateDays.ts:21): <=30 current, <=60, <=90, else 90+. `agingDays` = today minus invoice raised date. `outstanding = max(0, invoice.total - receivedAmount)`. "Over 60 days" count and the mobile amber chip use `> 60`.
- **Payment history maths** (selectors.ts:763-830): service fee = receivedAmount - authorisedAmount; net = authorisedAmount; status from received vs invoice total and disbursed vs authorised.
- **GST**: receipts carry `gstAmount`; report is sum of receipts in window filtered to the anaesthetist (selectors.ts:709).
- **Names**: `drSurname`, `initialsOf`, `nameWithoutTitle` in `shared/format.ts:138-155`. Date helpers `mondayOf`, `weekDays`, `dayHeading`, `sessionTimeRange`, `sessionStart` there too. Currency `formatCurrency` L116.

## 6. Demo and simulator affordances in this area
- Demo clock: `useToday()` (store/selectors.ts:1031) drives all "today" logic; controlled from the harness bar or, in the PWA, `moreExtra` (`pwa/PwaDemoPanel.tsx`: Demo clock card, Reset card, office simulation via `pwa/officeSimulation.ts`).
- Demo badges (`shared/DemoBadge`): "Demo prototype" on More; "NHI FHIR lookup · Digital Services Hub" in ManualCardForm; "Simulated capture · sample cards" and "Simulated OCR · no real processing" in photo flow.
- Cover requests are markers only (see §4). No demo button here to accept one.
- Balances/Accounts data depends on the office actions in admin and the Xero simulator (`apps/demo`) to produce invoices, receipts and disbursements; nothing in mobile/web triggers billing.
- No screen-specific demo button exists in mobile or web (any "demonstrate this function" button would be new work in the harness/control panel).

## 7. Stubbed, hardcoded, seeded, or visual-only
- Productivity and Leave panels: seeded numbers/dates only (`anaesthetistDashboard.ts`), Souter only.
- More tab: static persona card, no settings.
- "Add photo" on a card attaches the same fixed sample image; photo-of-paper is canned OCR.
- NHI lookup is a local table (`domain/nzhis`), not FHIR.
- Cover offer/request: marker + audit only; no target notification, response or resulting booking; contact phone appears only in a tooltip.
- Web nav avatar/name is a static label; no menu.
- Web pages are fixed-width desktop (min-width 1240).
- Sessions: mobile availability strip is fixed today..+5; web Lists default window +28d is UI only.
- AA service fee in Payments is called "illustrative" in the UI copy; computed from data but fee rule itself is not a configured rate here.
- `WebNav`/`MobileApp` tab bars are pure navigation; no badge counts, unread markers or notifications.

## 8. Not present in these apps (search here first when a requirement seems missing)
- Anaesthetist-side leave request/approval, recurring availability, availability in the web app, bulk availability.
- Notifications (in-app, push, email, SMS), acceptance flow for cover, messaging with office.
- Patient search or cross-list card search, list history/archive view for billed lists, reports beyond dashboard tiles and the GST table, exports/downloads/print of any account view.
- Any invoice detail view, payment remittance advice, or per-invoice drill-down on mobile or web (Payments deep-link via `?invoice=` only highlights a row).
- Any authorise/approve control (comments state none exist on web), any billing-route or fee-schedule administration, user/profile settings, multi-persona or role switching, offline behaviour beyond the PWA build.
- Card-level features to check in `shared/`: coding/procedure capture, BTM rules, times, modifiers, route and funder allocation, prepayment, post-op addendum, cancellation, history timeline.
