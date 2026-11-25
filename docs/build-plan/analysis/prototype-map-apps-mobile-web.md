# Prototype map: Anaesthetist Mobile App and Anaesthetist Web App

Orientation. `aa-prototype/src/apps/mobile/` (Anaesthetist Mobile App, `/mobile/*`) and `aa-prototype/src/apps/web/` (Anaesthetist Web App, `/web/*`) are two thin view layers for one persona, Dr Melanie Souter (`anaesthetistId '34821'`, `shell/appConfig.ts:27`). Both are read-only views over the Zustand store plus the shared flows in `src/shared/` (AddBookingFlow, SubmitListSheet, MoveListPrompt, BookingDetailBody, AvailabilityEditor, SupportHosts). Almost no domain logic lives in these two folders: screens pick selectors (`store/selectors.ts`, `store/lookback.ts`, `store/ledgerSelectors.ts`, `store/remittanceSelectors.ts`), format with `shared/format.ts`, and delegate every write to a shared flow or store action under the actor `{role:'anaesthetist', source:'anaesthetist', anaesthetistId}`. Both apps are strictly own-work: other anaesthetists' sessions appear only as status (no patient detail), and Draft Lists never appear. Neither app has anything about Contracts, Funding tags, Parties management or contract admin: the only Contract trace is the quiet row cue "Needs an invoice destination" / "RVG code to fill in" (`bookingContractCue`, `store/selectors.ts:2146`), shown on List-detail rows in both apps. The Booking-detail capture body (patients, procedures, RVG, contract/billing-party choice, calculation, completion) is the SHARED `BookingDetailBody` (`shared/booking/BookingDetailBody.tsx:147`), not in these folders: the shared-mapper's job.

## Contents
1. Routing and shells (mobile, web)
2. Mobile screens (Lists stack, Availability stack, Balances, More, Sign in, shared mobile components)
3. Web screens (Dashboard, Lists, List detail, Booking detail, Availability, My availability, Accounts, Profile, nav, support)
4. Domain rules visible in this area (with file:line)
5. Store/selectors/hooks called, by feature
6. Demo, test and simulator affordances
7. Stubbed, hardcoded, visual-only, and gaps
8. Mobile vs web parity table
9. Tests in this area

---

## 1. Routing and shells

Router: `src/router.tsx` (outside this area). Mobile mount `router.tsx:181`: `<MobileApp host={PhoneFrame} sessionDefault="signed-in">`; the PWA entry (`src/pwa/`) mounts the same `MobileApp` with host `MobileViewport` and `sessionDefault="signed-out"`. Web mount `router.tsx:97`.

### Mobile routes (`apps/mobile/routes.tsx`, `MobileApp.tsx`, `navigation.ts`)
| Path | Element | Notes |
|---|---|---|
| `/mobile` | redirect to `lists` | |
| `/mobile/lists/*` | `MobileListsRoute` (routes.tsx:23) | ONE splat route hosting a 3-layer `SlideStack`: depth 0 Forward Lists, 1 List detail `/mobile/lists/:listId`, 2 Booking detail `/mobile/lists/:listId/bookings/:bookingId`. Depth read from URL by `listsStackLocation` (navigation.ts:48). Home view state in URL: `?q=` search, `?day=` ISO date (written with replace; junk `?day=` ignored via `isISODate`). Legacy `/cards/` links redirect (`LegacyBookingRedirect`). |
| `/mobile/availability/*` | `MobileAvailabilityRoute` (routes.tsx:223) | 2-layer stack: Find cover (`/mobile/availability`), My calendar slid in (`/mobile/availability/calendar`, depth 1). A bottom `Overlay` hosts `AvailabilityEditor` (a day's sessions and the form). |
| `/mobile/balances` | `MobileBalancesRoute` | `onOpenBooking` -> `/mobile/lists/:l/bookings/:b` |
| `/mobile/more` | `MobileMoreRoute` | |
| `*` | redirect `/mobile` | |

Shell (`MobileApp.tsx`): builds the persona `actor` (:114ish); sign-in gate `useAnaesthetistSession(sessionDefault)` (:123) renders `SignInScreen` in place of Outlet and tab bar when signed out (URL untouched); `MoveListPromptProvider` wraps outlet (the one Move sheet); `BottomTabBar` (4 tabs Lists, Availability, Balances, More; `aria-current`) shown only when both stacks are at depth 0 (`showTabBar`, :151); `SurfaceProvider variant="mobile"` (sheets are bottom sheets). `moreExtra` slot lets PWA inject presenter controls into More; `supportApp` ('mobile'|'pwa') tags support requests.

Stale-id guards (routes.tsx:96-109): a List missing, DRAFT, or not hers falls back to `/mobile/lists`; a Booking not on her own List (`useOwnBookingInView`, `shared/flows/useListMoves.ts:145`) falls back to the List. A popped layer stays mounted (`seen` ref) so it can slide out. Pops use `navigate(..., {replace:true})`; edge-swipe-back (`SlideStack.tsx`, EDGE_ZONE 28px, commit at 35% width or 0.5 px/ms) wired per depth. Photo-capture demo request (routes.tsx:75-82): `useDemoTriggerMemory.photoCaptureRequest` for the open List opens `AddBookingFlow` on the `photo` prong. "Go to date" sheet `LookbackDateSheet` rendered at route level, only at depth 0.

### Web routes (`apps/web/routes.tsx`, `WebApp.tsx`)
| Path | Element | Notes |
|---|---|---|
| `/web` | `WebDashboardRoute` | `?week=<ISO>` Monday anchor via `mondayOf`; stepping uses replace |
| `/web/lists` | `WebListsRoute` | `?q=`, `?day=`; drill-ins pass `location.state.from` so Back returns to results/day |
| `/web/lists/:listId` | `WebListDetailRoute` | `RequireEntity` guard: assigned List and hers |
| `/web/lists/:listId/bookings/:bookingId` | `WebBookingDetailRoute` | `useOwnBookingInView` guard; `state.from`/`listFrom` restore |
| `/web/lists/:l/cards/:c` | `LegacyBookingRedirect` | |
| `/web/availability` | `WebAvailabilityRoute` | Find cover grid; `?date=` opens a day (>= today) |
| `/web/availability/mine` | `WebMyAvailabilityRoute` | My availability calendar; `?date=` opens that day |
| `/web/accounts` | redirect `outstanding` | |
| `/web/accounts/overdue` | `WebAccountsOverdueRedirect` | keeps `?invoice=` |
| `/web/accounts/:subTab` | `WebAccountsRoute` | subTab in outstanding, payments, remittances, gst, fees; else `RequireEntity` not-found. `?invoice=` and `?run=` focus a row |
| `/web/profile` | `WebProfileRoute` | persona block in nav |
| `*` | redirect `/web` | |

Shell (`WebApp.tsx`): `SurfaceProvider variant="web"` (dialogs/side panel), `minWidth 1240`, content `maxWidth 1320`; `WebNav`; `MoveListPromptProvider`; `SupportSidePanel` (Help in nav). Outlet context `{anaesthetistId, personaName, actor, todayISO}` (`outlet.ts`). `tabForPath` underlines Dashboard/Lists/Availability/Accounts; null on profile.

---

## 2. Mobile screens

### 2.1 Forward Lists (Lists home) `screens/ForwardListsScreen.tsx` (Phase 38a; US-07.4.2, 07.4.1, 07.2.1, 03.1.6, 03.1.7)
Sees: "Kia ora, Dr Souter" header (`MobileHeader`, `drSurname`), search box + calendar button (`LookbackSearchRow`), chips Week | Month | To-Do | Done (`FilterPills`), then a scroller that opens at the Today heading: an "Earlier, not yet authorised" group above (with a "N earlier Lists not yet authorised" jump link), Today, later days. Rows via shared `ListRow`.
- Data: `mainViewFor(state, anaesthetistId, today, forwardTo)` (`store/lookback.ts:52`). Forward window = today +7 (Week) or +31 (Month) (:162). To-Do/Done ignore the window (any date from today on, own assigned Lists not left main view). Earlier = own assigned Lists dated before today, not AUTHORISED, not backdrop, holding at least one Booking (lookback.ts:60-68).
- Chip rules (:218-222): To-Do = ACTIVE or SUBMITTED with an incomplete active Booking; Done = `listProgress==='submitted'` and zero stubs. Authorised Lists are in no chip (left main view).
- Row content: a booked session shows the List (title hospital or "Pre-op assessment"; subtitle surgeon · specialty or template label; count/progress right) via `listRowModel` (`listRowModel.ts`); an empty open session shows "<Status> session / Open for bookings"; a closed status shows long label + note ("Public hospital", "CPH") with status chip. "New" badge on Lists moved to her by a colleague (`useMovedToMe`, `useBookingsMovedToMe`); stub marker count per List (`useStubCountsByList`) never in the booking count. Rows sorted by `sessionRank` (AM, PM, OOH).
- Modes (exclusive): main | day (`?day=`, `DayChip`, `LookbackDayView`) | search (>= 2 chars name or NHI, `useBookingSearch`, `searchCountLine`, `LookbackResults` Upcoming then Past). NHI-shape hint via `searchNhiReason` (`domain/bookingSearch.ts:50`).
- Actions: open List, open Booking from a result, open date sheet. No writes.

### 2.2 List detail `screens/ListDetailScreen.tsx` (US-07.x, 03.6.3, 11.3.3, 01.4.x)
Sees: back link "Lists", `...` List options, title (hospital/Pre-op) + session text, subline surgeon · specialty · Today/date · time range (`useListTimes`, `slotTimeRange`), kind `StatusChip`, "Moved to you by ..." line, alert status (`AlertOfficeEntry statusOnly`), "X of Y complete" + `ProgressBar` (tone `held` when stubs), booking rows (time, patient, warning triangle, `BalanceAlertPill`, NHI, primary procedure label via `procedureLabel`, contract cue, then Capture pill / `TickBadge` / "Cancelled"), stub rows (`StubRow`, `StubSheet`), Invoices panel when AUTHORISED (`useListInvoices`/`ListInvoices`), "Add a booking" when `editRefusal(actor,list)===null`, "Shared notes" card (`SharedNotes`), sticky footer.
- Footer states (:343-): AUTHORISED -> lock "<Invoiced|Authorised> · read only" (`LIST_PROGRESS_LABEL[listProgress(list,[],today)]`); state not ACTIVE (SUBMITTED) -> green "Submitted to office"; incomplete>0 -> grey "Mark list completed · N to finish / Tap to see what is left" (opens `SubmitListSheet mode='blockers'`); else teal "Mark list completed" (`mode='confirm'`). After submit: `SuccessOverlay` "List submitted" 1050ms.
- List options sheet (`ListOptionsSheet`): "Move this List" (`useIsMovable` + `useMoveListPrompt().openMove(listId)`), "Alert the office" (shown unless `officeAlertRefusal` returns something other than alreadyAlerted; disabled "The office has been alerted" when already). `AlertOfficeSheet` collects the note.
- Rows include cancelled Bookings (struck through, 0.6 opacity), excluded from counts. Draft List returns null (`isAssignedList`).

### 2.3 Booking detail `screens/BookingDetailScreen.tsx`
Phone chrome only: folding masthead (back link "List", patient name, `WarningTriangle`, kind chip, primary procedure · hospital), wrapping shared `BookingDetailBody` (`shared/booking`) which owns all capture/validation/lifecycle. Booking on Draft List returns null. NHI and DOB are deliberately not in the masthead (Patient card in the body).

### 2.4 Availability (Find cover) `screens/AvailabilityScreen.tsx` (Phase 28/29/32; US-01.4.2, 03.1.4)
Sees: header "Find cover / Availability"; a 6-day strip from today (dot if any open session that day); segmented Everyone | Free only; "N free sessions on <day>"; `MovedToYouPanel`; "My availability" card (AM, PM, and OOH only if she has an opened OOH slot that day; `StatusChip`; her List's title; "Move" mini-button when movable; "Change <day>" opens editor sheet (disabled if she has no AM/PM slot); "My calendar >"); then one card per colleague (roster minus self, name order, no tiers) with AM/PM(/OOH) cells coloured from the status master (`blockFill`), subtitle "Open for bookings" / status line / hospital · surgeon. A free colleague cell is tappable ("Tap to move your List here") when her List that session can move there (`useMovableSessions`, `mine.targetSlotIds`) -> `movePrompt.openMove(list.id,{toSlotId})`.
- "Free" = open session holding no List (`isOpenSlotView`, `store/selectors.ts:221`). Data: `slotViewsForDate`, `rosterForDate` (`selectors.ts:233,275`).

### 2.5 My calendar `screens/MyAvailabilityCalendarScreen.tsx` (Phase 29; US-01.2.1, 01.5.3)
Month grid (today to schedule-horizon end, `useAvailabilityBounds`; month steppers disabled at bounds), each day a button with AM over PM `HalfBlock`s in status colours (the List replaces status), repeat glyph for series instance, amber `AttentionDot` for a List with a conflict (`session.conflict`). Past days and days without sessions are disabled. Legend of status choices (`useAnaesthetistStatusChoices`), "Your series" (`SeriesList`), sticky "Add days off" (`addFrom` = today in current month else the 1st) opens the editor preset (both sessions, span week, status = On holiday ID `SEED_STATUS.holiday` if offered else first closed choice; routes.tsx:239). Editing is the shared `AvailabilityEditor` in an `Overlay` (shot `mobile-availability-sheet`). `lastDayISO` published as demo context `mobileCalendar.day`.

### 2.6 Balances `screens/BalancesScreen.tsx` (US-12.2.1, 12.2.2, 08.3.5)
Total card "Outstanding to you" (`outstandingTotalFor`), count of unpaid invoices, Collected / Paid out lines and "You owe AA" (only if > 0) from `anaesthetistLedgerPosition` (`store/ledgerSelectors.ts:236`, labels `POSITION_LABEL`). Toggle Outstanding | "GST this month". Outstanding: flat list oldest first, no ageing, `OutstandingCard` (patient, invoice number, counterparty label, invoice date, ACC pill, stage label `OUTSTANDING_STAGE_LABEL` unless awaitingPayment, amount); tap opens the Booking. GST: current demo month only (`gstReportFor`, ledger disbursements, cash basis, `store/ledgerSelectors.ts:268`), rows paid-to-you + GST, total; text points to web for past months/download/print/email. All from the ledger, never Xero.

### 2.7 More `screens/MoreScreen.tsx` (US-12.1.1, 12.1.4, 13.5.3, 15.0.8)
Persona card; Profile card (`profileFor`, `store/selectors.ts:2249`): rate per unit with Change (opens `EditRateSheet` -> `useRateEditor`, `shared/profile/useRateEditor.ts:14`; amount-validated, store permission check is the gate, refusal shown verbatim), phone/email/registration/HPI CPN (`HPI_CPN_LABEL`)/masked bank (all with lock glyph = office-held); account row "Signed in as <email>" + Sign out (`recordAnaesthetistSignIn(...,'signedOut')` then `signOutSession()`; one tap, no confirm); Help card (support phone `SUPPORT_CONFIG.phone` `0800 787 286`, "Get help" opens `SupportSheet`, `shared/support/SupportHosts.tsx:14`); "Demo prototype" badge + synthetic-data note; `extra` slot (PWA presenter controls).

### 2.8 Sign in `screens/SignInScreen.tsx` (US-13.5.3, OQ-83 provisional)
Simulated: email prefilled with the demo account, password prefilled `'demo-account'`; any non-empty password with the demo email signs in; another email -> "No account with that email. Use the demo account." (writes audited `refused` row); blank fields caught client-side (no audit row). Audited via `recordAnaesthetistSignIn` (`store/authDemoActions.ts:98`); session in localStorage `aa-anaesthetist-session` (`shared/session/anaesthetistSession.ts`), host default decides initial state; Reset of demo data never clears it. A "Provisional" pill cites OQ-83 (`SIGN_IN_PROVISIONAL`). No forgot-password, social, biometrics.

### 2.9 Shared mobile components (`apps/mobile/components/`)
`SlideStack` (depth-driven transform stack, parked layers `inert`/`aria-hidden`, edge swipe), `MobileHeader` (eyebrow, 26px title, avatar), `ListOptionsSheet`, `EditRateSheet`, barrel `index.ts` re-exporting shared `BottomSheet`, `ListRow`, `TickBadge`, form primitives. `screens/ListsLookback.tsx`: `LookbackSearchRow`, `LookbackDateSheet` (month grid with a dot on days having a List, bounded by `useLookbackBounds` = earliest own List to horizon end), `LookbackDayView` (`listsOnDayFor`, `store/lookback.ts:259`), `LookbackResults`/`ResultRow` (warnings triangle, NHI badge, progress pill).

---

## 3. Web screens

### 3.1 Dashboard `screens/DashboardScreen.tsx` (W1; US-12.2.3)
Header "Kia ora, Dr Souter" with summary line "<long date> · N lists today · N bookings · N awaiting submission" (today's own Lists not left main view; awaiting = ACTIVE, has active Bookings, all complete); primary "Move a List" (disabled "No upcoming Lists to move" when none; opens a picker dialog of her `useMovableLists(…, 6)` -> `movePrompt.openMove`). `WeekStrip` (below). Two panels: "Financial position" (owed to you, collected, paid out via `anaesthetistLedgerPosition`; plus unpaid invoice count, awaiting collection, due now, links to Outstanding/Payments; "No billed work yet." when all zero) and "Who's free · next 5 days" (open sessions from `openSlotViews` per day and session AM/PM/OOH, name order, surnames as chips; a chip is a button that moves her List into that colleague's session when `useMoveTargets` allows; link to the full grid). No seeded figures remain (Productivity and Leave panels removed).

### 3.2 Week strip `components/WeekStrip.tsx`
Seven Monday-anchored columns, AM/PM(/OOH if opened) blocks per day from `slotViewsForAnaesthetist`; List blocks show hospital / surgeon · session and times (office overrides included) and click through to List detail; empty sessions show status (Free dashed; a whole closed day merges into one tall block); today outlined crimson; submitted List quieter with a check and "Done · unbilled" in its accessible name (`listProgress==='submitted'`, none if stubs); AUTHORISED Lists are not shown (session reads empty); stub marker. Prev/next week.

### 3.3 Lists `screens/ListsScreen.tsx` (+ `ListsLookback.tsx`) (W2; US-07.4.2, 03.1.4, 03.1.6, 03.1.7)
Table with columns Date, Session, From, To, Description, Status, Progress. Groups "Earlier, not yet authorised" then "From today". Window: `To` date input default today +28 (`ListsScreen.tsx:86`), clearing it means unbounded (`9999-12-31`); same `mainViewFor`. Rows: date open-button, `Today` marker, kind colour bar, status chip, `ProgressPill` (`LIST_PROGRESS_LABEL`), stub marker, quiet row when submitted; empty sessions show an `emptySessionLine`. Search (`?q=`, box width 280 + NHI hint), "Go to date" (`DateJumpInput`, `?day=`, bounded by `useLookbackBounds`), `StatusLegend`, `DayChip`, results table (Upcoming/Past; columns Date, Session, Patient, NHI, Hospital, Procedure, Progress) and day table (Session, Time, Location, Bookings, Status, Progress). Search and date exclusive.

### 3.4 List detail `screens/ListDetailView.tsx`
Back "Lists"; header with title, kind chip, subline, "Moved to you by", `AlertOfficeEntry` (with its action, unlike mobile where the action is in List options); actions: "Move this List" (outline, if `useIsMovable`) and `SubmitAction` (:357; same 4 states as mobile: authorised "<label> · read only", submitted, "N to finish before submitting" opens blockers sheet, "Mark list completed" opens confirm). Bookings card with `ProgressBar` and table: Time, Patient (warning triangle, `BalanceAlertPill`, NHI), Procedure (+ "+N more", contract cue), then Units and Fee (not authorised) or Invoiced (authorised), Status (Cancelled / Complete tick / Capture pill), totals row. Fee/units per Booking come from the pure calculator `bookingFee` (`shared/capture`, via :109, with held prices and lock if locked); "Needs a price" (`NEEDS_PRICE_LABEL`) when no price on the List's date. Authorised: "Invoiced" = sum of that Booking's invoice lines (`useListInvoices`), not a recompute. Invoices card, "Shared notes" card, `AddBookingFlow` dialog, `SubmitListSheet`. Differs from mobile: has units/fee columns and totals; mobile has none.

### 3.5 Booking detail `screens/BookingDetailView.tsx`
Back "List"; `PageHeader` (patient, warning triangle, NHI badge · DOB (age via `ageYears`), primary procedure · hospital, kind chip, History) around shared `BookingDetailBody`. Web shows DOB/age in header; mobile masthead does not.

### 3.6 Availability (Find cover) `screens/AvailabilityGrid.tsx` (W3; US-01.4.2, 01.3.6) and `components/AvailabilityPageSwitch.tsx`
Tabs Find cover | My availability. Day nav (prev/next/Today; `?date=`), `MovedToYouPanel`, filter All | "Free only · N", name search (`matchesNameQuery`), status legend, grid: 220px name column + AM, PM (+ OOH column only if any row has an opened OOH session). Rows = day's roster INCLUDING herself ("(you)" + Change link to `/web/availability/mine?date=`). Cells: status bar + two lines; Free dashed; `Move` on her own movable List cell, `Move here` on a colleague's free cell her List can take (`useMovableSessions`). Session status only; no patient detail.

### 3.7 My availability `screens/MyAvailabilityCalendar.tsx` (Phase 29; US-03.1.4, 01.5.3)
Month calendar (today to horizon), click a day, shift-click extends a range (anchor kept), right rail 340px: `AvailabilityEditor` for the selection (day or range, shot `web-availability-rail`) or empty prompt, "Your series" (`SeriesList`), Legend. Each cell shows AM/PM with label, note ("CPH") or series line, repeat icon, conflict `AttentionDot`. Subtitle says every session is "<default status label>" until changed (`defaultSlotStatus`).

### 3.8 Accounts `screens/AccountsScreen.tsx` + `RemittancesTab.tsx` (W4; FT-12.2, US-12.2.1/2, 10.2.5, 10.2.7, 10.3.2, 08.3.5)
"Your position" strip (4 tiles: owed to you with awaiting collection and due now, collected, paid out, you owe AA with link to fees; `anaesthetistLedgerPosition`). Sub-tabs (real links `LineTabLink`): 
- Outstanding: `outstandingPayableRowsFor` (`selectors.ts:1115`): one row per unpaid payable, oldest first, no grouping/ageing; columns Invoice date, Invoice, Patient, Billable party, Stage, ACC, Outstanding to you; total foot (`outstandingTotalFor`); row opens Booking.
- Payments: `paymentHistoryFor` (`selectors.ts:1150`); columns Date received, Invoice, Patient, Billable party, Received by AA, Released to you, Paid to you (+ payment week via `paymentWeeksForPair`, "Held out of <run>" via `heldOutRunFor`), Status pill (`held` = `HELD_UNTIL_AUTHORISED`, partPayment, customerPaid, partPaidOut, paidOut). `?invoice=` focuses a row.
- Remittances (`RemittancesTab`): `remittancesFor` (`remittanceSelectors.ts:131`): Week, Paid on ("Awaiting Xero" if unpaid), BCTIs, Netted, Paid to you, status; row opens a read-only `RemittanceAdviceDocument` dialog; `StillToNetPanel` (`stillToNetFor`, :143) when a negative invoice awaits netting. `?run=` focuses a row.
- GST report: month picker (`gstReportMonthsFor`, newest first), `gstReportFor` (payments passed to her, cash basis, GST component, paid ex GST, totals), "not yet paid" note for current month, Download (CSV `gstReportCsv`/`downloadTextFile`), Print (`window.print()` with print classes), "Email to me" (demo confirmation only; no mail, no store write); actions disabled when the month is empty.
- AA fees: `aaFeeInvoicesFor` (`selectors.ts:1643`): Invoice, Month, BCTIs, Fixed charges (`aaFeeFixedTotal`), Per-BCTI charge, Fee ex GST, GST, Total, Paid/Unpaid pill; unpaid total foot. `?invoice=` focuses a row.
All read the ledger (`state.billing`), never `state.xero`.

### 3.9 Profile `screens/ProfileScreen.tsx` (US-12.1.1, 12.1.4)
"Billing" panel: rate per unit (`useRateEditor`, Save enabled only when `rate.dirty`, "Rate saved." line); read-only locked panels Contact (phone, email), Identity (registration, HPI CPN), Bank account (name, masked number). Same `profileFor` source as mobile. Web has account name; mobile does not.

### 3.10 Nav `components/WebNav.tsx`
Logo, four tabs, Help (`TextAction`, opens `SupportSidePanel`), persona block (profile link, crimson underline when on profile). Web has no sign-in, no sign-out and no account row.

---

## 4. Domain rules visible here
- Main-view exit predicate: `hasLeftMainView(list) = state==='AUTHORISED'` (`domain/listProgress.ts:18`). Not at submit, not at billing stamp, not on payment. Found afterwards by search/date.
- `listProgress` (`domain/listProgress.ts:55`): AUTHORISED -> invoiced (billedAtISO set) | authorised; SUBMITTED -> toFinish if any active Booking incomplete (a reopened/added Booking blocks authorise) else submitted; ACTIVE -> upcoming if no Bookings; readyToSubmit if all complete; toFinish if dated today or earlier and incomplete; else upcoming. Labels `LIST_PROGRESS_LABEL`: To finish, Ready to submit, "Done · unbilled", Invoiced, Authorised.
- Edit rights (`store/lifecycle.ts:68`): anaesthetist may edit own List while ACTIVE or SUBMITTED; never DRAFT (office only), never AUTHORISED (locked), never a colleague's. "Add a booking" shown only when this returns null.
- Submit is completion-gated in the store; the greyed footer stays tappable and opens a blockers sheet (`SubmitListSheet`, shared). Warnings never block (D5).
- Alert the office (`store/officeAlertActions.ts:40`): own non-Draft non-authorised List only; one open alert per target (`alreadyAlerted`); note required, max `OFFICE_ALERT_NOTE_MAX`.
- Move a List (shared `useListMoves.ts`, `isMovableByOwner`, `pushTargets`): her own Lists from today, to the office or a colleague; also single-Booking moves (Phase 32a); notices "Moved to you by" within a notice window (`movedToMe`); Move surfaces: List options (mobile), List detail header (web), Dashboard "Move a List" and Who's-free chips (web), Find cover cells (both).
- Free session = open session holding no List (`isOpenSlotView`); colleague cells show status only; OOH column/row only where an OOH slot was opened (`domain/outOfHours.ts`, `SESSIONS_IN_ORDER`).
- Closed statuses (Holiday, Public, etc.) come from the status master (`masters.slotStatuses`, `resolveDisplayStatus`); notes ("CPH") show as second line.
- Own work only: Booking/List routes guard on ownership; Draft Lists return null; colleague Booking falls back like a stale id (exception: Booking just moved to a colleague stays until she leaves the done step).
- Ledger-sourced money (no Xero): position (`anaesthetistLedgerPosition`), Outstanding (flat, oldest first, total = "Owed to you"), Payments, GST on cash basis (disbursements), Remittances, AA fees. Rate change applies to Bookings on Lists not yet authorised; authorised keep locked rate (`RATE_NOTE`, `shared/profile/profileCopy.ts:16`).
- Contract cue (`selectors.ts:2146`): any Procedure without `governingContractId` -> "Needs an invoice destination"; else any needing an RVG code -> "RVG code to fill in". Only Contract-related UI in these apps.
- Lookback bounds: earliest own List (or horizon start) to schedule horizon end (`store/lookback.ts:216`); calendars bounded today to horizon end (`useAvailabilityBounds`).
- Search: name or NHI, >= 2 chars, own Bookings only, Upcoming then Past; NHI that cannot be one gets an inline reason (`searchNhiReason`), matching exact.

## 5. Store/selectors/hooks by feature
Reads: `useAppStore` slices `schedule.{lists,slots,bookings,procedures}`, `masters.{hospitals,surgeons,specialties,patients,anaesthetists,slotStatuses,rvgGroups}`, `appSettings`, `billing`, `clock`/`useToday`. Selectors: `mainViewFor`, `listsOnDayFor`, `slotViewsForDate`, `slotViewsForAnaesthetist`, `openSlotViews`, `rosterForDate`, `timesForList`/`useListTimes`, `bookingContractCue`, `heldPricesForBooking`, `outstandingPayableRowsFor`, `outstandingTotalFor`, `paymentHistoryFor`, `paymentWeeksForPair`, `heldOutRunFor`, `aaFeeInvoicesFor`, `gstReportFor`, `gstReportMonthsFor`, `anaesthetistLedgerPosition`, `remittancesFor`, `remittanceAdviceFor`, `stillToNetFor`, `profileFor`, `useStubCountsByList`, `useListStubs`. Hooks: `useBookingSearch`, `useLookbackBounds`, `useFieldText`, `useListWarnings`, `useBookingWarnings`, `useListInvoices`, `useMovedToMe`, `useBookingsMovedToMe`, `useMovedToMeNotice`, `useMovableSessions`, `useMovableLists`, `useMoveTargets`, `useIsMovable`, `useMoveListPrompt`, `useOwnBookingInView`, `useAvailabilityMonth`, `useAvailabilityBounds`, `useAnaesthetistStatusChoices`, `useRateEditor`, `useAnaesthetistSession`.
Writes from these folders: only `recordAnaesthetistSignIn` (SignInScreen, MoreScreen), `signInSession`/`signOutSession` (localStorage), and `useDemoTriggerMemory.clearPhotoCaptureRequest`. Everything else is delegated: `AddBookingFlow` (`shared/flows/AddBookingFlow.tsx:49`), `SubmitListSheet` (:34), `MoveListPromptProvider` (`MoveListPrompt.tsx:48`), `AlertOfficeSheet`, `AvailabilityEditor` (`shared/availability/AvailabilityEditor.tsx:37`), `useRateEditor.save()`, `SharedNotes`, `SupportSheet`/`SupportSidePanel`, `BookingDetailBody`.

## 6. Demo, test and simulator affordances
- Demo triggers (registry `shared/demoTriggers/registry.ts`) that act on these screens (shown in the harness/PWA demo chip, only on their own route): `office-authorises-list` (Mobile List, :1443), `office-reviews-additional-invoice`/`-credit` (Mobile Booking), `office-assigns-next-free` (Lists, :1503), `office-adds-out-of-hours-list` (:1533), `availability-office-sets-public` (My calendar, needs published context `mobileCalendar.day`, :1556), `office-assigns-draft-list` (:1580), `office-resolves-alert` (:1680), `office-approves-contract-change` (:1703), `colleague-moves-list-to-me` (Availability, :1758), `colleague-moves-booking-to-me` (:1803), `prepayment-two-days-before`, `pwa-office-approves-prepayment`, `pwa-office-sends-prepayment-reminder`, `raise-sample-warnings`/`clear-sample-warnings`/`office-clears-warning`, `office-sets-booking-contract` (:2208), `photo-capture-future` (:2235, sets `photoCaptureRequest` consumed at `routes.tsx:75`), `matching-office-matches-row`, `stub-office-adds-nhi`/`pwa-office-adds-nhi`, `pwa-office-runs-payables` (Balances), `pwa-payment-full`/`-half`, `office-edits-booking`, `pwa-sign-out` and `support-help-line-responds` (any mobile screen), plus Web dashboard/Accounts ACCREC triggers (:621-644), `stage-post-op` (Mobile and Web Lists/Booking, :1018).
- Persona hardcoded: `APP_CONFIG.mobile/web.persona = PERSONAS.souter` (`shell/appConfig.ts`); id fallback `'34821'` in both shells.
- PWA hosting: `MobileApp` takes `host`, `sessionDefault`, `moreExtra`, `supportApp`; PWA injects its clock/Reset/office-simulation into More (`pwa/PwaDemoPanel.tsx`). Framed prototype's More says "Use the demo control panel ...".
- Sign-in password and email are prefilled demo values (`SignInScreen.tsx:14`).
- `data-shot` attributes everywhere for capture recipes; `data-testid`s e.g. `mobile-tab-bar`, `mobile-lists-search`, `web-lists-go-to-date`, `outstanding-row-<inv>`, `payment-history-row-<inv>`, `gst-report-row-<inv>`, `aa-fee-history-row-<inv>`, `remittance-row-<runId>`.

## 7. Stubbed, hardcoded, visual-only, gaps
- No contract management, funding tags, Parties tabs, replace-from-date or any Contracts/Admin content exists in either anaesthetist app (those are Admin). Contract appears only as the cue text.
- GST "Email to me" is a UI confirmation only (no store write, `AccountsScreen.tsx` GstReport). Download/Print are real (CSV blob, `window.print`).
- Mobile GST shows the current month only; past months and export are web-only (text says so).
- Sign-in is simulated (OQ-83): no password check, no lockout, no identity provider.
- Photo capture is Future Work (US-02.4.4): reachable only via the demo trigger; List's own "Add a booking" never reaches it.
- Mobile Find cover strip is fixed at 6 days from today; Who's free on web is 5 days; no date picker beyond that on mobile Find cover.
- Mobile 'My availability' card hides the Change button when she has no AM or PM slot that day; calendar day button disabled for past/no-session days.
- Support phone `0800 787 286` is fictional (`domain/support.ts:43`).
- Week-strip OOH, Who's free OOH and Find cover OOH only appear when the office has opened an OOH session (Phase 32c).
- `ListDetailView` (web) and `BookingDetailView` rely on route guards for ownership/Draft; they themselves only null-check undefined (mobile checks `isAssignedList`).
- Mobile List detail shows no units/fee/totals; fee display is web-only (and inside the shared Booking body).
- `drSurname` greeting; "Kia ora" copy hardcoded in both Forward Lists and Dashboard.

## 8. Mobile vs web parity (anaesthetist side)
| Capability | Mobile | Web |
|---|---|---|
| Main list view | Forward Lists with Week/Month/To-Do/Done chips, earlier group above Today | Lists table with earlier group, From/To dates, no To-Do/Done chips |
| Search / go to date | Search + date bottom sheet, `?q=`/`?day=` | Search + date input, `?q=`/`?day=` |
| List detail | Cards, Capture pill, no fees | Table with Units, Fee, totals, Invoiced |
| Submit | Sticky footer + sheets | Header action + same sheets |
| Move / Alert office | In `...` List options | Move button in header; alert entry inline |
| Find cover | 6-day strip, per-person cards | Day nav grid incl. self row, search by name |
| My availability | Month grid + bottom-sheet editor, Add days off | Month + range select (shift-click) + right-rail editor |
| Money | Balances: Outstanding, GST this month | Dashboard position + Accounts: Outstanding, Payments, Remittances, GST report, AA fees |
| Profile | More: rate editable, office-held rows locked | Profile page: Billing, Contact, Identity, Bank (with name) |
| Sign in/out | Yes (PWA signed out by default) | None |
| Help | Sheet from More | Side panel from nav |
| Dashboard / week strip | None | Yes |

## 9. Tests in this area
`mobile/screens/`: `BalancesScreen.test.tsx`, `ListDetailStubs.test.tsx`, `SignInScreen.test.tsx`, `ForwardListsScreen.test.tsx`, `MoreScreen.test.tsx`, `BalanceAlertAndNotes.test.tsx`; `mobile/components/SlideStack.test.tsx`; `web/screens/ListsScreen.test.tsx`, `AccountsScreen.test.tsx`; `web/components/navState.test.tsx`. Playwright specs relevant (repo `aa-prototype/visual/`): `mobile-phase03/04/13`, `mobile-interactions`, `mobile-insets`, `lookback`, `availability-phase29`, `list-moves-phase32`, `booking-moves-phase32a`, `out-of-hours-phase32c`, `phase28`, `contracts-phase19a`, `contract-warnings-phase25a`, `ease-of-use`.
