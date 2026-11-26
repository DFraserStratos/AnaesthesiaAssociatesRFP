# Prototype map: shell, demo surfaces, demo triggers, PWA, router

Orientation. The framed prototype (`aa-prototype/src/main.tsx` -> `App.tsx` -> `router.tsx`) is one data router (`createBrowserRouter`, router.tsx:285) whose root layout is `AppShell` (the dark 48px **harness bar** plus an `<Outlet/>`). Under it sit the three apps (`/web`, `/admin`, `/mobile`, built elsewhere) and the demo-only surfaces (`/demo/*`). Demo behaviour is not scattered across screens: every simulated event is a `DemoTrigger` entry in `src/shared/demoTriggers/registry.ts` (88 entries), matched by route and shown in the harness bar's **Demo actions** menu (surface `bar`) or the installed PWA's **Demo** sheet (surface `pwa`); the Control Panel is only an index plus the S1 to S5 scenario jumps. The PWA (`aa-prototype/pwa/main.tsx`, built by `vite.pwa.config.ts`) mounts only the Mobile App with `MobileViewport` as host, no AppShell. Paths below are under `aa-prototype/` unless absolute. No product requirement logic lives here (mock backend calls go through store actions in `src/store/*`); this area is chrome and simulators.

Contents
1. Entry, router and route table
2. Harness bar (AppShell, app switcher, Demo actions, clock, reset)
3. Demo-trigger machinery (types, matching, context, memory, inline, surfaces)
4. Trigger registry: every entry by screen
5. Demo control panel and scenario jumps S1 to S5
6. Other demo surfaces (Xero, Integrations/future scope, Data inspector, catalogue)
7. PWA (entry, wiring, Demo sheet, More-tab panel, office simulation)
8. Where to place a new trigger
9. Stubs, hardcoded and visual-only notes

## 1. Entry, router, routes

- `src/main.tsx`: wires store jobs once: `wireDiagnostics`, `wireBillingRun`, `wireReconciliationPoll`, `wireArchiveJob`, `wireInactiveContracts`, `wireXeroQueue`, `wireIntegrationRetry`. `App.tsx` just renders `AppRouter`.
- `src/router.tsx`: data router (for `useBlocker` in Admin Booking detail), future flags v7. `RootRedirect` (router.tsx:~76) sends `/` and unknown paths to `APP_CONFIG[shell.currentApp].path`. `RequireEntity` (`shell/RequireEntity.tsx`) redirects to `..` if an id from the URL no longer exists; `shell/routeParams.ts` `isISODate` guards `:dateISO` / `?week=`.
- Route table (component files are in the app folders, not mapped here):
  - **/web**: index dashboard; `lists`, `lists/:listId`, `lists/:listId/bookings/:bookingId`, `lists/:listId/cards/:cardId` (-> `LegacyBookingRedirect`); `availability`, `availability/mine`; `accounts` (index -> `outstanding`, `overdue` redirect, `:subTab`); `profile`; `*` -> /web.
  - **/admin**: `day/:dateISO` (+ `bookings/:bookingId`, legacy `cards/:cardId`); `intake` (index -> `matching`; `matching`, `waiting`, `pdfs`, `quality`, `validators`); `matching` and `integrations` -> Intake redirect; `conflicts`; `draft-lists`; `notifications`; `review`, `review/:listId`; `finances` (index -> `billing`; `billing`; `invoices`, `invoices/credit-notes/:creditNoteId`, `invoices/:invoiceId`; `payments`, `payments/:runId`, `payments/:runId/remittance/:anaesthetistId`; `ledger`, `ledger/anaesthetists/:anaesthetistId`; `xero`; `aa-fees`, `aa-fees/settings`), files in `apps/admin/screens/finances/`; legacy `invoices/*`, `credit-notes/*`, `billing/*`, `ledger/*` -> `FinanceLegacyRedirect`; `people` (index -> anaesthetists; `anaesthetists[/:anaesthetistId]`, `surgeons[/:surgeonId]`, `specialties[/:specialtyId]`, `patients[/:nhi]`); legacy `patients`, `patients/waiting` (-> /admin/intake/waiting), `patients/follow-up`, `patients/:nhi` redirects; `contracts` (list, `new`, `parties[/:partyId]`, `tags`, `:contractId`); `masters` (+ legacy profile redirects); `audit`; `*` -> /admin.
  - **/mobile**: `MobileApp host={PhoneFrame} sessionDefault="signed-in"`; index -> `lists`; `lists/*`, `availability/*` (splat so the slide stack keeps layers mounted), `balances`, `more`.
  - **Demo**: `/demo/control`; `/demo/xero`, `/demo/xero/invoices`, `/demo/xero/invoices/:accRecId`, `/demo/xero/bank` (all `DemoXero`); `/demo/integrations`, `/log`, `/mapping`; `/demo/data`; `/demo/catalogue` -> `/demo/catalogue/admin`; `/demo/catalogue/:app` (admin|web|mobile; URL only, not in switcher).
- PWA router is separate (`pwa/main.tsx`, `BrowserRouter`): `/mobile` + same four tabs; `/` and unknown -> `/mobile/lists`; no Admin/Web/demo.

## 2. Harness bar

`src/shell/AppShell.tsx` (130 lines). Layout `100dvh` column: `<header class="aa-harness">` 48px ink bar, `<ScaleBanner/>` (`shared/scale/ScaleBanner.tsx`, only while full-scale data generating/loaded/failed; never in PWA), then `<main data-aa-modal-scope>` with the Outlet (an open dialog makes main inert, not the bar).
- Left: "AA Booking & Billing", "Prototype" pill, `SyntheticDataBadge` (US-15.0.6), and a "Requirements ↗" link only when `import.meta.env.DEV && VITE_REQUIREMENTS_URL` (set by repo-root `npm run dev`).
- Right (in order): `PersonaChip` (persona of active app; office persona follows `shell.officeUser`: Kirsty W. default, Sam T. after the "Switch office user" trigger, via `officePersona()` in appConfig.ts:50), `AppSwitcher`, `DemoActionsMenu`, `DemoClockMenu`, `DemoResetButton`.
- URL is truth: `appIdForPath(pathname)` mirrors into store via `setCurrentApp` (persisted last app); selecting in switcher calls `setCurrentApp` and `navigate(path)`.
- `appConfig.ts`: `AppId` = mobile | web | admin | demo-xero | demo-integrations | demo-control | demo-data; `APP_CONFIG` (label, path, persona, group apps|demo); `PERSONAS`: Dr Melanie Souter (anaesthetistId 34821; mobile+web), Kirsty W. (office; admin and all demo), Sam T.
- `AppSwitcher.tsx`: popover "Apps" (Anaesthetist Mobile App, Anaesthetist Web App, Admin Web App) then "Demo surfaces" (Demo: Billing Monitor & Xero, Demo: Future scope, HL7 and FHIR, Demo: Control Panel, Demo: Data Inspector), lucide icons per id.
- `DemoActionsMenu.tsx`: pill "Demo actions" + `CountBadge` of rows (`useDemoTriggerRows('bar')`); returns `null` when no entries for the route (bar never grows). Popover (`data-shot=demo-actions`, rows `demo-action-<id>`) stays open after a run; closes on pathname change. Each row: label, badge, Run (disabled with `reason` text beneath), description, `<select>` for `choices`, `Notice` + Cancel when `confirm` armed (Run turns to "Confirm"), result line with optional `link` ("Open the invoice").
- `DemoClockMenu.tsx`: pill with clock time (`useClockTimeLabel`), popover of `demoClockShortcuts(useAppStore, todayISO)` (`shared/demoClockShortcuts.ts`): +15 min, +1 hour, Next day, Next morning (08:00), +7 days, "Procedure day · 1 Dec" (disabled once today >= `S1_PROCEDURE_DAY` 2026-12-01). Actions in `store/clockActions.ts` (`advanceClockMinutes/Days/ToNextMorning/ToDate`); forward-only; day rollover generates the far-edge sessions (see Control Panel text).
- `DemoResetButton.tsx`: Reset popover "Reset all demo data?" -> `resetFramedDemo()` (`shell/framedReset.ts`: `resetDemo(useAppStore)` + `clearAnaesthetistSession()`). Clock returns to Tue 24 Nov 2026 8:00; current app preserved. Nothing under `shell/` or `apps/demo` calls `resetDemo(` directly (`framedReset.test.ts`).
- `PhoneFrame.tsx`: iOS bezel 390x844, status bar clock from demo clock, presenter zoom (localStorage `aa-phone-scale`), `GradientLab` panel when `GRADIENT_LAB_ENABLED` (`theme/gradientLabGate.ts`, currently `true`) and `AtmosphereLayer`; `shell/gradientLab/*` tunes `AA_DEFAULT_GRADIENT` (visual-only tooling, localStorage `aa-gradient-lab`).
- Tests: `shell/DemoActionsMenu.test.tsx`, `DemoActionsConfirm.test.tsx`, `DemoResetButton.test.tsx`, `framedReset.test.ts`.

## 3. Demo-trigger machinery (`src/shared/demoTriggers/`)

Not re-exported from the shared barrel (imports store + seed). Pure TS: nothing in it imports `src/apps/*` or `src/shell/*` (PWA closure contains it).
- `types.ts` `DemoTrigger`: `id` (kebab; `data-shot=demo-action-<id>`), `label` (no en/em dashes), `description`, `screen` (Control Panel heading), `alsoScreens?`, `routes` (react-router `matchPath` patterns, `end:true`, full pathname), `surfaces: ('bar'|'pwa')[]`, `badge?: 'future-scope'|'office-stand-in'|'colleague-stand-in'`, `overSheet?` (PWA chip lifts above an open sheet), `when?(state, ctx)` visibility, `choices?`, `defaultChoice?`, `disabledReason(state, ctx, choiceId)` (null = runnable), `run(api, ctx, choiceId) -> {ok, message, link?}`, `confirm?` (two-click), `indexPath(state)` (Control Panel "Open screen"; null = nowhere), `indexEmptyReason?`, `indexHint?`. `DemoTriggerCtx = {pathname, params (from matched route), published}`.
- `match.ts`: `demoTriggersFor(state, pathname, surface, published)` (registry order; filters surface, route, `when`), `groupTriggersByScreen` (by `screen`, then `alsoScreens`), `initialChoice`.
- `useDemoTriggers.ts`: `useDemoTriggerRows(surface)` is the shared row logic for bar and PWA: per-row choice/result/armed state reset on pathname change; results keyed `pathname|id`; Run calls `trigger.run(useAppStore, ctx, chosen)` (the real audited store, never a copy). Subscribes to route, whole app store, published context, trigger memory and `useSessionStore` (browser sign-in session).
- `context.ts`: `useDemoContextStore` (UI-only zustand, not persisted, no audit). `useDemoTriggerContext(key, value)` and `useDemoTriggerContextWhile(key, value, active)` publish screen state the URL cannot carry. Keys and publishers: `integrationsSim.selectedMessageId` (DemoIntegrations.tsx:57); `matching.selectedRowId` (admin/screens/MatchingScreen.tsx:62); `aaFees.month` (AaFeesScreen.tsx:86); `adminDay.selectedSlotId` (components/SlotDrawer.tsx:76; no consumer found in registry); `adminDraftLists.openListId` (DraftListDrawer.tsx:66); `adminMasters.view` (masters/MasterData.tsx:45); `adminPicker.listId` (AssignDraftListSheet, SessionStatusSheet, ReassignListFlow); `adminContracts.openContractId` (ContractPage.tsx:72); `adminContracts.tab` (ContractsSection.tsx:27); `adminPeople.tab` (PeopleSection.tsx:29); `adminFinances.tab` (FinancesSection.tsx:26); `mobileCalendar.day` (mobile/routes.tsx:248, "anaesthetistId|dateISO"); `adminBooking.dirtyBookingId` (AdminBookingDetail.tsx:81); `nhiHub.inUse` (ManualBookingForm.tsx:105, patients/RegisterRefresh.tsx:83, intake/AddNhiSheet.tsx:59); `support.tab` and `support.requester` (shared/support/SupportPanel.tsx:42-43); `mobile.signIn` (mobile/screens/SignInScreen.tsx:45).
- `memory.ts` `useDemoTriggerMemory` (UI-only, cleared on reload): `lastMessageId` (replay), `lastWebhook`/`webhookCounter` (payment replay key `WEBHOOK-<accRecId>-<n>`), `photoCaptureRequest` (consumed by `mobile/routes.tsx:75`, opens Add a booking on photo prong), `regenerated` per invoice, `nhiScan` (read by `apps/demo/PrivacyChecks.tsx`; cleared by `onDomainReset`).
- `InlineDemoTrigger.tsx`: runs a registry entry inside a product dialog (dashed button + badge). Only use: `ask-colleague-make-available` on each unavailable colleague row in `apps/admin/components/pairing/AnaesthetistCandidates.tsx:206`.
- `DemoTriggerBadge.tsx`: Future scope / Office stand-in / Colleague stand-in badges. `procedureTextTriggers.ts`: pure helpers for `hospital-description-arrives` (AR-35 wordings from `domain/seed/sourceWording`). `demoGuidePresses.ts`: test-only parser of "Demo actions -> Label" / "Demo sheet -> Label" in the guide HTML (used by `demoGuideSync.test.ts`).
- Tests: `demoTriggers.test.ts` (shape, routes, bodies), `demoTriggerAudit.test.ts` (whole-registry rules, runs S1 to S5 staging), `demoGuideSync.test.ts` (guide vs registry), plus per-phase `*Triggers.test.ts`.

## 4. Trigger registry: every entry (registry.ts, array starts :852; line = entry start)

Route shorthand: `FIN` = `/admin/finances`, `DAY` = `/admin/day/:dateISO`, `BK` = `/admin/day/:dateISO/bookings/:bookingId`, `MB` = `/mobile/lists/:listId/bookings/:bookingId`, `ML` = `/mobile/lists` + `/:listId` + MB. Surface B = harness bar, P = PWA sheet. Every `run` goes through `useAppStore` store actions (files under `src/store/`, named where known). "when" = extra visibility gate.

**Admin · Finances (Billing, Xero, Ledger, Invoices, Payments, AA fees)**
| line | id | label | routes | surf | store call |
|---|---|---|---|---|---|
|855|billing-failure|Trigger billing failure|FIN/billing|B|`stageBillingFailure` (demoStaging.ts); when seed list exists|
|884|arm-handoff-fault|Arm handoff failure|FIN/xero|B|`armHandoffFault` (demoSettingsActions.ts)|
|899|xero-outage-start|Simulate Xero outage|FIN/xero + /demo/xero*|B|`setXeroOutage` (xeroQueue.ts)|
|916|xero-outage-restore|Restore Xero|same|B|`setXeroOutage`|
|933|inject-unmatched-receipt|Inject unmatched receipt|FIN/ledger(+anaesthetists/:id), DAY|B|`injectUnmatchedReceipt` (ledgerDemo.ts); choices|
|954|run-reconciliation-poll|Run reconciliation poll|FIN/xero + /demo/xero*|B|`runReconciliationPoll`|
|969|run-archive-job|Run archive job|same|B|`runArchiveJob` (archiveActions.ts)|
|1093|run-next-billing-run|Run the next billing run|FIN/billing, /admin/review|B|`runNextBillingRun` (eventDemo.ts)|
|1113|stage-combined-procedure|Stage combined procedure|FIN/invoices|B|`stageCombinedProcedure` (creditDemo.ts)|
|1137|stage-payment-week|Stage a payment week|FIN/payments|B|`stagePaymentWeek` (paymentWeekDemo.ts); choices|
|1154|stage-bank-mismatch|Stage a bank mismatch|FIN/payments|B|`stageBankMismatch` (paymentWeekDemo.ts)|
|1169|stage-refund-after-payout|Stage refund after payout|FIN/invoices/:invoiceId|B|`stageRefundAfterPayout` (creditDemo.ts)|
|1223|regenerate-invoice|Regenerate from locked data|FIN/invoices/:invoiceId|B|`regenerateInvoiceFromLock` (locks.ts) + `rememberRegenerate`|
|1245|payment-full|Payment received · full|FIN/invoices/:id, /demo/xero/invoices/:accRecId, BK|B|`sendPaymentWebhook` -> `deliverPaymentWebhook` (paymentActions.ts); when: invoice on screen has open AccRec; choices|
|1262|payment-half|Payment received · half|same|B|same, 50%|
|1279|payment-replay|Replay last payment event|same|B|`deliverPaymentWebhook` with `memory.lastWebhook` key (idempotency demo)|
|1305|run-scheduled-fee-run|Run scheduled month-end fee run|FIN/aa-fees|B|`runMonthlyFeeInvoices` (aaFeeActions.ts), month from `aaFees.month`|
|1328|seed-month-of-bctis|Seed a month of BCTIs|FIN/aa-fees|B|`seedMonthOfBctis` (demoBctiSeed.ts); when seed month|
|2704|load-full-scale|Load full-scale data|FIN/invoices, FIN/invoices/:id, DAY|B|`loadFullScaleData` (fullScaleActions.ts); `confirm` (replaces data)|

**Xero simulation (/demo/xero/invoices/:accRecId and list/bank)**
|1350|record-fee-payment|Record fee payment|pair page|B|`recordFeePaymentFor` -> `recordAaFeePayment` (aaFeeActions.ts); when AA fee pair|
|1370|xero-amend-invoice|Edit this invoice's total in Xero|pair page|B|`amendAccRecInXero` (xeroSimActions.ts)|
|1388|xero-void-invoice|Void this invoice in Xero|pair page|B|`voidAccRecInXero`|
|1406|xero-pay-bill|Pay anaesthetist in Xero (payables run)|pair page|B|`disbursePayable` (payablesActions.ts); needs approved payment run|
|1445|xero-bulk-remittance|Simulate bulk hospital remittance|/demo/xero/invoices, /bank|B|`receiveBulkRemittance` (xeroSimActions.ts)|

**Admin · Audit / Booking / Review / Day / Drafts / Contracts / People / Masters / Intake**
|993|simulate-sign-in|Simulate sign-in attempts|/admin/audit|B|`simulateSignInAttempts` (authDemoActions.ts)|
|1015|hospital-description-arrives|Hospital description arrives|BK|B|`replaceProcedureText` (procedureTextActions.ts); choices = AR-35 rows|
|1050|stage-post-op|Stage post-op scenario|/admin/review/:listId, BK, ML, /web/lists*|B,P|`submitList`+`authoriseList`+`stagePostOpForSouter` (eventDemo.ts); when seed List present|
|1191|pdf-list-resend|Receive updated PDF from rooms|/admin/intake/pdfs|B|`receiveResentPdfList`|
|1634|simulate-sickness|Simulate sickness|DAY, /admin/conflicts|B|`simulateSickness` (demoSimulations.ts); choices by list+route|
|1676|ask-colleague-make-available|Ask a colleague to make their session available|DAY, /admin/draft-lists, /admin/conflicts + inline|B (+inline)|`makeSessionAvailableAsColleague` (listMoveDemo.ts); badge colleague-stand-in; when `adminPicker.listId` published|
|1753|colleague-moves-list-to-office|Colleague moves a List to the office|DAY, /admin/notifications|B|`stageBusyMorning` / `stageColleagueMoveToOffice` (listMoveDemo.ts)|
|1808|colleague-hands-booking-to-souter|Colleague hands a Booking to Dr Souter|DAY|B|`stageColleagueBookingMove`|
|1865|simulate-incoming-request|Simulate incoming request|/admin/draft-lists|B|`simulateIncomingDraftListRequest`|
|1891|add-draft-list-for-day|Add Draft List for this day|DAY|B|`addDraftListForDay`|
|1911|demo-backdated-range|Demo: add a backdated price range|/admin/contracts, /:contractId|B|`addBackdatedRangeDemo`; when contract/seed|
|1935|contract-reach-change-date|Demo: reach the change date|same|B|`moveClockToDate`; when replacement ahead|
|1961|pass-last-day|Demo: pass the last day|/admin/people/anaesthetists/:anaesthetistId|B|`moveClockToDate` past the anaesthetist's last day (statusOn)|
|2005|stage-recurring-clash|Stage recurring clash|/admin/masters|B|`stageRecurringClash` (office actor); when `adminMasters.view==='recurringBookings'`|
|2041|load-sample-spreadsheet|Load sample spreadsheet|/admin/masters, contracts (+parties, tags), people tabs|B|`stageMasterLoad` (masterLoadActions.ts); when a view has a sample sheet (`SEEDED_SHEETS_BY_VIEW` :381); choices|
|2069|go-live-data-load|Go-live data load (demo)|/admin/masters|B|`stageGoLiveLoad` (goLiveActions.ts)|
|2090|stage-longer-prepaid-procedure|Stage longer prepaid procedure|/admin/review/:listId|B|`stageLongerPrepaidProcedure` (prepaymentFollowupDemo.ts)|
|2108|prepayment-late-payment|Payment arrives after the credit note|BK|B|`stageLatePrepaymentPayment`|
|2124|prepayment-contract-changed|Change Contract after prepayment sent|BK|B|`stagePrepaidContractChange`|
|2143|prepayment-two-days-before|Move to 2 days before procedure|DAY, BK, MB|B,P|`moveToTwoDaysBefore`|
|2161|add-prepaid-booking|Add prepaid Booking|DAY, BK|B|`addPrepaidBooking`|
|2229|raise-sample-warnings|Raise sample warnings|DAY, BK, MB|B,P|`raiseDaySamples` / `raiseSamplesOn` (warnings engine)|
|2257|clear-sample-warnings|Clear sample warnings|DAY, BK, MB|B,P|`clearAllSamples` / `clearSamplesFor`|
|2351|matching-receive-theatre-list|Import hospital file|/admin/intake/matching|B|`receiveTheatreList` (matchingDemo.ts); choices = canned files (S1 St George's)|
|2374|matching-send-update|Send update for a matched Booking|/admin/intake/matching|B|`stageUpdateForBooking`; uses `matching.selectedRowId`|
|2456|receive-no-nhi-list|Receive list with a missing NHI|/admin/intake/waiting|B|`importHospitalDownload` (matchingActions.ts)|
|2740|matching-raw-row-other-role|View raw row as another role|/admin/intake/matching|B|`viewRawImportRow` (rawRowActions.ts)|
|2668|switch-office-user|Switch office user|DAY, BK|B|`setOfficeUser` (Kirsty W. <-> Sam T.); blocked while `adminBooking.dirtyBookingId` published|
|2615|load-multi-procedure-booking|Load 3-procedure Booking (7 modifier units)|ML, /web/lists/:listId (+booking), BK|B,P|`stageMultiProcedureBooking`|
|2638|feed-changes-primary|Hospital feed changes the primary|MB, /web/.../bookings/:id, BK|B,P|`feedChangesPrimary`; when Booking has >1 procedure|

**Cross-app / Demo surfaces**
|2720|scan-nhi-leaks|Scan for NHI leaks|/demo/data|B|`scanForNhiLeaks` (privacyScan.ts) + `rememberNhiScan`|
|2768|nhi-hub-mode|Hub: Available / Slow / Unavailable|ML, /web/lists/:listId, DAY, /admin/draft-lists, people/patients(+:nhi), intake/waiting|B,P (`overSheet`)|`setNhiHubMode` (demoSettingsActions.ts); when `nhiHub.inUse`|
|2502|fire-hospital-message|Fire hospital message|/demo/integrations(+log,mapping)|B|`processMessage`; badge future-scope|
|2531|replay-hospital-message|Replay last message (dedupe)|same|B|`processMessage` with `memory.lastMessageId`|
|2331|photo-capture-future|Photo capture (Future scope)|/mobile/lists/:listId|B,P|`requestPhotoCapture` (memory only, no domain write)|

**Mobile / PWA stand-ins (surface P unless noted)**
|1469|office-authorises-list|Office authorises this List|/mobile/lists/:listId(+MB)|P|`authoriseAsSimulatedOffice` (officeStandIn.ts); office-stand-in|
|1492|office-reviews-additional-invoice|Office reviews this event|MB|P|`officeReviewsAdditionalInvoice` (eventDemo.ts)|
|1512|office-reviews-credit|Office reviews this credit|MB|P|`officeReviewsCredit` (creditDemo.ts)|
|1529|office-assigns-next-free|Office assigns a List to my next free session|/mobile/lists|P|`assignNextFreeSlotAsSimulatedOffice`|
|1559|office-adds-out-of-hours-list|The office adds an out-of-hours List for me tonight|/mobile/lists|P|`addOutOfHoursListAsSimulatedOffice`|
|1578|availability-office-sets-public|Office sets this session to Public|/mobile/availability/calendar|P|`setSessionPublicAsSimulatedOffice`; when `mobileCalendar.day`|
|1606|office-assigns-draft-list|Office assigns a Draft List to me|/mobile/lists|P|`assignDraftListAsSimulatedOffice`|
|1706|office-resolves-alert|Office resolves this alert|/mobile/lists/:listId(+MB)|P|`officeResolvesAlert` (officeAlertActions.ts)|
|1729|office-approves-contract-change|Office approves this Contract change|MB|P|`approveContractChangeAsSimulatedOffice` (contractApprovalActions.ts)|
|1784|colleague-moves-list-to-me|Colleague moves a List into my free session|/mobile/availability|P|`stageColleagueMoveToPersona`; colleague-stand-in|
|1829|colleague-moves-booking-to-me|Colleague moves a Booking to me|ML|P|`stageColleagueBookingMove`; colleague-stand-in|
|1985|try-sign-in-after-last-day|Demo: try signing in after the last day|/mobile, /mobile/*|B,P|`tryInactiveSignIn` (anaesthetistStatusActions.ts); when `mobile.signIn`|
|2180|pwa-office-approves-prepayment|Office approves and sends the prepayment invoice|MB|P|`approvePrepaymentAsSimulatedOffice`|
|2208|pwa-office-sends-prepayment-reminder|Office sends a prepayment reminder|MB|P|`sendReminderAsOfficeStandIn` (prepaymentSettlementDemo.ts)|
|2275|office-clears-warning|Office clears this warning|MB|P|`clearWarning`|
|2304|office-sets-booking-contract|Office sets this Booking's Contract|MB|P|`setProcedureContract`|
|2394|matching-office-matches-row|Hospital file imported and my booking matched|ML|P|`officeImportsS1File` + `officeMatchesHospitalRow`|
|2433|stub-office-adds-nhi|Office adds the NHI to this stub|/mobile/lists/:listId|P|`officeAddsNhiToStub` (stubDemo.ts)|
|2474|pwa-office-adds-nhi|Office adds the NHI|/mobile/lists/:listId, MB|P|`addNhiAsSimulatedOffice` (officeStandIn.ts); alsoScreens Mobile · Booking|
|2559|pwa-office-runs-payables|Office runs this week's payment cycle|/mobile/balances|P|`officeRunsWeeksCycle` (ledgerDemo.ts)|
|2575 / 2593|pwa-payment-full / pwa-payment-half|Payment received · full / half|/mobile/balances, MB|P|`sendPaymentWebhook` (persona's open AccRecs)|
|2684|office-edits-booking|Office edits this Booking|MB|P|`officeEditsBooking` (officeSaveDemo.ts)|
|2802|pwa-sign-out|Sign out|/mobile, /mobile/*|P|`recordAnaesthetistSignIn`/`signOutSession` (shared/session/anaesthetistSession)|
|2934|support-help-line-responds|Help line responds to this request|/mobile, /mobile/*|P (`overSheet`)|`advanceSupportTicket` (supportActions.ts); when `support.tab==='helpLine'`|

**Web app (helper `webPaymentEntry`, :670, instantiated :2611-2612)**
|2611|web-payment-full|Payment received · full|/web, /web/accounts/:subTab|B|`paymentWebhook` for persona's open invoices (positionOnly)|
|2612|web-payment-half|Payment received · half|same|B|same, half|

**All apps · Help (routes `/mobile*`, `/web*`, `/admin*`; when `support.tab` published = support panel open)**
|2820|support-advance-ticket|Advance ticket|B|`advanceSupportTicket` (Logged -> Responded to -> Closed)|
|2843|support-raise-out-of-hours|Raise out of hours|B|`moveClockToEvening` (7pm next weekday) + `raiseSupportTicket` (supportActions.ts)|
|2883|support-raise-public-holiday|Raise ticket on a public holiday|B|`moveClockToDate` (next national holiday, 10:00) + `raiseSupportTicket`|
|2915|support-approve-call-out|AA approves call-out|B|`approveCallOut`; badge office-stand-in|

Count: 88 object entries (the extraction above lists 86 plus the 2 `webPaymentEntry` entries; all ids covered). Bar-only entries cannot appear on the PWA; P-only entries are listed in the Control Panel as "Shown in the installed PWA" with no Open screen link.

## 5. Demo control panel and scenario jumps

`src/apps/demo/DemoControlPanel.tsx` (`/demo/control`, wrapped by `DemoSurface.tsx`: "demo simulation" badge on every demo surface; optional `futureScope` second badge). Three groups:
1. **Clock & reset**: live clock card with the same `demoClockShortcuts` buttons; "Reset demo data" with confirm -> `resetFramedDemo()`.
2. **Scenario jumps S1 to S5** (`ScenarioJumps`): per scenario a Jump button (`data-shot=scenario-s1..s5`), Confirm jump (`scenario-confirm`), result `Notice` (`scenario-result`) with numbered beat buttons (`scenario-beat-<n>`, step text `scenario-beat-<n>-steps`) that `navigate()` to a path computed from state at click time (disabled while the target does not exist). Last jump kept in a UI-only zustand store, cleared by `onDomainReset`. Capture recipes click `scenario-sn` then `scenario-confirm`.
3. **Demo actions by screen**: `DemoActionsIndex` lists `groupTriggersByScreen(DEMO_TRIGGERS)`; nothing is fired from here; "Open screen" uses `trigger.indexPath(state)`; PWA-only entries have no link.

`src/apps/demo/demoScenarios.ts` (pure; tested by `demoScenarios.test.ts`): every `stage` first resets (`resetFirst`: `resetFramedDemo` on the app store else `resetDomainState`), then stages through guarded store actions as `OFFICE_ACTOR`/`SOUTER_ACTOR`.
- **S1 Booking to theatre**: stage = reset only. Beats: Mobile sign-in (/mobile/more); Admin Intake (/admin/intake/matching; Demo actions -> Import hospital file, Create Booking on Sarah Mitchell); Admin Day (set Contract); Admin Booking (descriptions, after Create Booking); Mobile List Tue 1 Dec AM (`SEED_LIST_IDS.integrationStgList`; clock "Procedure day · 1 Dec"); Mobile Booking (capture, Mark complete, submit); Mobile search `/mobile/lists?q=Mitchell`.
- **S2 Office day**: reset only. Beats: Admin Day; to-do (Raise sample warnings); Recurring bookings `/admin/masters?view=recurringBookings` (Stage recurring clash, assign Draft List); Day 2026-11-25 (Simulate sickness, Conflicts); Mobile Lists (colleague moves); Mobile Booking (Lachlan Robinson, Move to a colleague); Admin Notifications; Admin Review (Morrison Mon 23 Nov, `SEED_LIST_IDS.morrisonMon20`).
- **S3 Money end to end**: reset, then checks Souter's Mon 23 Nov AM/PM Lists are SUBMITTED. Beats: Review authorise; $0 no-charge Booking; Xero pair (AA-2026-0005, nib share; path via `pairForInvoice`); Finances payments; Stage a payment week; Finances aa-fees (Seed a month of BCTIs, Run monthly fee invoices); Finances ledger (Inject unmatched receipt, Allocate).
- **S4 Exceptions**: reset only. Beats: prepayment Booking (Annette Riley; Payment received · half); Review after Fri 27 Nov PM submitted; cancel prepaid Booking; Stage post-op scenario (Review Tue 17 Nov AM, Dr Sharma `S4_POST_OP_LIST_ID`); additional invoice + Run the next billing run; Billing failure (Finances billing); credit note (Stage refund after payout); Move to 2 days before procedure.
- **S5 Compliance tour**: reset + `stageCompliance`: Souter claims then removes ASA III (AS3) with an explanation, office saves note + time (+15 min) as one change set on David Chen's Booking (`overriddenTimeUnitsBooking` marker), then `authoriseList(whitakerFri17)`. Beats: Booking History; Intake Waiting for NHI (Receive list with a missing NHI; Hub mode); Data inspector (Scan for NHI leaks); Contract Health NZ agreed rate; Review Mon 23 Nov AM (authorise, edit rate per unit, Regenerate from locked data).
Beat `does` strings name triggers by label; `demoGuideSync.test.ts` keeps guide in step with them.

## 6. Other demo surfaces

- **Data inspector** `/demo/data` (`DemoData.tsx`, 695 lines): entity counts (`entityCounts`), persisted-size vs `STORAGE_BUDGET_BYTES` with "Saving paused" (full-scale held in memory) and persistence-disabled notices, `PrivacyChecks` panel (last NHI scan from memory: per-area "n found" / "Held by design"), today's sessions (`isActiveOn`), seeded scenario finder (`SEED_MARKERS` -> open entity), per-Booking audit trail, lifecycle state counts, and a **guard console** calling `completeBooking`, `cancelBooking`, `editBooking`, `submitList`, `authoriseList` as a chosen persona to show refusal messages.
- **Xero simulation** `/demo/xero[/invoices[/:accRecId]|/bank]` (`DemoXero.tsx`, 1559 lines; view model `xeroPairView.ts`): tabs Contacts / Invoices / Bank reconciliation; ACCREC + ACCPAY pair page with the ledger pair box ("system of record"), payable, AA holding account transfer journal, voided/amended banners, NHI-never-in-Xero callout, duplicate-invoice-number callout, outage banner, `matchBankLineInXero` / `unmatchedBankLines`. Volume callout is narrated counters ("Scale is narrated"; full-scale counts come from loaded records). Triggers in section 4 act here.
- **Future scope: HL7 and FHIR** `/demo/integrations` (`DemoIntegrations.tsx`): feed select, message library, 3-pane raw HL7 -> FHIR R4 (mapping-driven from `integrations.feeds`) -> "Sent to matching"; Replay and live drip (~1/sec) via `processMessage`; Southern Cross is FHIR-native (2 panes). Parsed messages only stage an Admin Intake row. `futureScope/MessageLog.tsx` (`/log`, retry and dead-letter), `FeedMapping.tsx` (`/mapping`, mapping fix recovers a dead letter), `FutureScopeChrome.tsx` (route strip + "shown for discussion" line). Badged Future scope.
- **Component catalogue** `/demo/catalogue/{admin,web,mobile}` (`catalogue/*`; ~11k lines of examples, URL-only). Visual/reference only; must be updated with shared components.
- Demo Control, Xero, Integrations, Data are in the switcher as "Demo surfaces" with persona Kirsty W.

## 7. PWA

- Build: `vite.pwa.config.ts` (root `pwa/`, entry `pwa/main.tsx`, port `AA_PWA_PORT` default 5174; `vite-plugin-pwa` `registerType:'prompt'`, manifest name "AA Booking & Billing", short "AA Booking", standalone, portrait, `start_url /mobile/lists`, scope `/`; workbox precache incl. woff2/png; `__BUILD_ID__` / `__BUILD_DATE__` from git or `AA_BUILD_ID`). `pwa/index.html`: `viewport-fit=cover`, iOS standalone meta (black-translucent), icons in `public/`.
- `pwa/main.tsx`: `MobileApp host={MobileViewport} sessionDefault="signed-out" supportApp="pwa" moreExtra={<PwaDemoPanel/>}`; wires `wireDiagnostics`, `wireBillingRun`, `wireReconciliationPoll`, `wireArchiveJob`, `wireIntegrationRetry`, `wireXeroQueue`, `wireOfficeSimulation`. It does NOT wire `wireInactiveContracts` (main.tsx does), so contracts going inactive on day advance are not processed on the handset. Imports `src/pwa/installPrompt` for `beforeinstallprompt`, `BootMark`, `markBootStart`.
- `src/pwa/MobileViewport.tsx`: host box with `--aa-inset-*` from `env(safe-area-inset-*)` (`viewportMetrics.ts` corrections), atmosphere; mounts `UpdatePrompt` (reload pill, `swRegistration.ts`, checks every minute) and **`PwaDemoActions`** (the Demo sheet).
- **PWA Demo sheet** `PwaDemoActions.tsx`: amber "Demo" chip (`data-shot=pwa-demo-actions`), shown only when `useDemoTriggerRows('pwa')` is non-empty; hides while any sheet is open unless a row has `overSheet` (then lifts to top at `zIndex.sheet + 5`); badge "Office auto" while the office simulation is on. Opens `BottomSheet`: per row label, badge, description, radio-group for `choices`, full-width Run, reason text, result line (no `link`, no `confirm` step: PWA rows ignore `confirm`, which only `load-full-scale` uses and that is bar-only). Row ids `pwa-demo-action-<id>`.
- **More-tab panel** `PwaDemoPanel.tsx` (injected through `moreExtra`): `InstallCoach` (Add-to-Home-Screen coaching, browser tab only), Demo clock card (same shortcuts), Office simulation card ("Play the office" toggle; `OFFICE_SIM_STORAGE_KEY` `aa-office-simulation`, default OFF), Reset card ("Reset all demo data?": `resilientLocalStorage.removeItem(PERSIST_KEY)` then `resetDemo(useAppStore)` + `clearInstallCoachDismissal()`; does NOT clear the sign-in session, a handset stays signed in), Build card (version, release date, cold-launch ms from `bootMetrics`, offline ready, saved data size, Check for updates), Viewport card (diagnostic rows, shortfall-band probe).
- `officeSimulation.ts`: store subscription on ACTIVE -> SUBMITTED; after `OFFICE_SIM_DELAY_MS` (4000) and only if the toggle is on and `officeStandInRefusal` is not `STAND_IN_INCOMPLETE`, calls `authoriseAsSimulatedOffice` (=> `listAuthorised` -> billing run -> invoices/Xero). Explicitly not the RFP flow (real flow: Office Review queue). The per-List "Office authorises this List" trigger is the story's stand-in.
- Sign-in: PWA default `signed-out`; framed phone `signed-in` (`framedReset` clears session so jumps never land on login). Not in PWA: AppShell, ScaleBanner, Admin, Web, demo surfaces (`pwaPurity.test.ts` enforces).

## 8. Where to place a new trigger

1. Add a `DemoTrigger` object to `DEMO_TRIGGERS` (registry.ts, array :852; group with its screen's block). Choose `routes` from the route table (section 1) with `matchPath` syntax; use `/*` for splat (e.g. `/mobile/*`); `surfaces: ['bar']` for Admin/Web/demo, `['pwa']` for handset stand-ins, both where a screen exists in both (Mobile lists also framed). Set `screen` (Control Panel heading), `badge` for stand-ins/future scope, `overSheet` if it acts on an open product sheet.
2. Need screen state the URL lacks: add a key to `DemoContextValues` (context.ts) and publish it with `useDemoTriggerContext(While)` in the screen; gate with `when`.
3. `run(api, ctx, choiceId)` must call an audited store action (new ones in `src/store/*Demo.ts` / `*Actions.ts`, actor `OFFICE_ACTOR`, `OFFICE_SIMULATION_ACTOR`, `DEMO_TRIGGER_ACTOR` or a stand-in actor); return `{ok, message, link?}`. Use `disabledReason` for refusals shown under Run; `confirm` for data-replacing entries.
4. Keep `indexPath` (null if none). Update the demo guide only in a sweep, but keep `demoGuideSync.test.ts` and `demoTriggerAudit.test.ts` green. Product dialogs whose scrim covers the bar use `InlineDemoTrigger`.
5. Scenario beats: edit `DEMO_SCENARIOS[].beats[].does` in demoScenarios.ts when a beat should name the trigger.

## 9. Stubs, hardcoded, visual-only

- Hardcoded index paths: `hospital-description-arrives` indexPath `/admin/day/2026-11-24/bookings/BK0006`; `stage-post-op` uses `POST_OP_ORIGINAL_LIST_ID` (Dr Sharma 2026-11-17 AM); S2 beat 4 `/admin/day/2026-11-25`; clock shortcut "Procedure day · 1 Dec" fixed at 2026-12-01 (`S1_PROCEDURE_DAY`); Reset popover and Control Panel text state "Tuesday 24 November 2026, 8:00" (the `DEMO_TODAY` seed).
- `adminDay.selectedSlotId` is published but no registry entry reads it (noted in context.ts).
- Persona is cosmetic chrome: office persona chip only (Kirsty/Sam); Sam T. switch does not change permissions.
- Simulators (all fake): Xero org/contacts/bank lines, HL7/FHIR feeds and "Digital Services Hub" / Keycloak referenced only; support line, office and colleague stand-ins; "Play the office" scaffold.
- Visual-only: PhoneFrame bezel/status bar/zoom, GradientLab (enabled flag `true`), ScaleBanner figures, Xero volume counters narrated not counted, Data Inspector budget meter.
- PWA lacks `wireInactiveContracts` and `ScaleBanner`; `load-full-scale` unavailable on the handset.
- Requirement-relevant but only simulated here: NHI Hub availability (`setNhiHubMode`, settings.nhiHubMode), support tickets out of hours/public holiday and call-out approval, sign-in after last day, Xero outage/handoff failure/queue retry, payment webhooks (idempotent keys), AA fee runs, prepayment flows, hospital feed changes, full-scale data load (reportDiagnostic timings).
