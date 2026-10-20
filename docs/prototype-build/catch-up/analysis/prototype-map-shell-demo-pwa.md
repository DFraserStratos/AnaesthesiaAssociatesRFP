# Prototype map: shell, demo surfaces, PWA, router

Paths are relative to `aa-prototype/` unless absolute. Code is the truth; line numbers verified in this pass.

**Orientation.** `src/main.tsx` mounts `App` -> `AppRouter` (`src/router.tsx`, BrowserRouter). One layout route renders `AppShell` (`src/shell/AppShell.tsx`): a 48px dark "harness bar" on top plus an `<Outlet>` below. The three product apps (`/web`, `/admin`, `/mobile`) are nested layout routes under it; four demo-only surfaces (`/demo/*`) sit beside them. The bar holds: product name + "Prototype" pill, optional Requirements link (dev only), persona avatar/name, **App switcher**, **Demo actions menu** (screen-contextual, Phase 14), **Demo clock menu**, **Reset**. All demo actions are entries in one registry, `src/shared/demoTriggers/registry.ts` (`DEMO_TRIGGERS`), filtered by route pattern and surface (`'bar'` or `'pwa'`). The installed PWA (`pwa/main.tsx`) mounts the mobile app alone, with no `AppShell` and no bar; its presenter controls are the "Demo" chip + bottom sheet (`src/pwa/PwaDemoActions.tsx`, same registry, `'pwa'` surface) and the panel under More (`src/pwa/PwaDemoPanel.tsx`). Backend is the in-browser zustand store; nothing here does `fetch`.

## Contents
1. Entry, routes, router
2. Harness bar and each control
3. Demo-trigger registry: architecture and extension points
4. Every registered demo trigger (table)
5. Demo surfaces (`/demo/*`) and their in-page actions
6. Scenario jumps S1 to S5
7. PWA target
8. Business rules / validation visible in this area
9. Stubbed, hardcoded, visual-only, gaps

---
## 1. Entry, routes, router

- `src/main.tsx:7-12`: wires four store jobs `wireBillingRun`, `wireReconciliationPoll`, `wireArchiveJob`, `wireIntegrationRetry` (billing run on `listAuthorised`, poll/archive on `dayAdvanced`, integration retry timer). `wireOfficeSimulation` is NOT wired in the framed build (PWA only).
- `src/App.tsx`: `<AppRouter />` only.
- `src/router.tsx` (BrowserRouter, v7 future flags). Path = navigation; query = view prefs (`?week=`, `?sort=`, `?view=`); transient overlays (sheets, drawers, add-booking) are local state, not URL. `RequireEntity` (`src/shell/RequireEntity.tsx`) redirects `..` when an id no longer exists (ids outlive the seed). `isISODate` (`src/shell/routeParams.ts`) validates `:dateISO`/`?week=`.
- `RootRedirect` (router.tsx:50) and `*` -> `APP_CONFIG[shell.currentApp].path` (last app, persisted).

Route table (all under `<AppShell/>`):

| Path | Component (router) | Screen/notes (details in other maps) |
|---|---|---|
| `/` , `*` | RootRedirect | last-selected app |
| `/web` | `WebApp` > `WebDashboardRoute` | Dashboard (`apps/web/screens/DashboardScreen.tsx`) |
| `/web/lists` | `WebListsRoute` | Lists (`ListsScreen`) |
| `/web/lists/:listId` | `WebListDetailRoute` | `ListDetailView`; RequireEntity |
| `/web/lists/:listId/bookings/:bookingId` | `WebBookingDetailRoute` | `BookingDetailView` |
| `/web/lists/:listId/cards/:cardId` | `LegacyBookingRedirect` (`shared/legacy`) | old URL redirect |
| `/web/availability` | `WebAvailabilityRoute` | Find cover grid (`AvailabilityGrid`) |
| `/web/availability/mine` | `WebMyAvailabilityRoute` | `MyAvailabilityCalendar` (`?date=`) |
| `/web/accounts` -> `/web/accounts/overdue`; `/web/accounts/:subTab` | `WebAccountsRoute` | Accounts (`AccountsScreen`); sub-tabs include `overdue`, `payments`, `fees` (`?invoice=` used by Xero deep links, DemoXero.tsx:311,476) |
| `/web/*` | Navigate `/web` | |
| `/admin` | `AdminIndexRedirect` -> `day/<today>` | `apps/admin/routes.tsx:38` |
| `/admin/day/:dateISO` | `AdminDayRoute` | Day grid + right rail; invalid date redirects to today |
| `/admin/day/:dateISO/bookings/:bookingId` | `AdminBookingDetailRoute` | `AdminBookingDetail` |
| `/admin/day/:dateISO/cards/:cardId` | `LegacyBookingRedirect` | |
| `/admin/conflicts` | `AdminConflictsRoute` | `ConflictsScreen` |
| `/admin/draft-lists` | `AdminDraftListsRoute` | `DraftListsScreen` |
| `/admin/notifications` | `AdminNotificationsRoute` | `NotificationsScreen` |
| `/admin/review`, `/admin/review/:listId` | `AdminReviewQueueRoute`, `AdminReviewRoute` | `ReviewQueue`, `ReviewScreen` |
| `/admin/invoices`, `/admin/invoices/:invoiceId` | `AdminInvoicesRoute` (same comp both) | `InvoicesScreen` |
| `/admin/billing` | `AdminBillingRoute` | `BillingMonitorScreen` |
| `/admin/billing/aa-fees`, `/admin/billing/aa-fees/settings` | `AdminAaFeesRoute`, `AdminAaFeeSettingsRoute` | `AaFeesScreen tab=invoices/settings` |
| `/admin/integrations` | `AdminIntegrationsRoute` | `IntegrationMonitorScreen` (tabs messages/feeds/pdfs/quality/validators) |
| `/admin/masters` (+`?view=`), `/masters/surgeons/:surgeonId`, `/masters/anaesthetists/:anaesthetistId` | `AdminMastersRoute`, `AdminSurgeonProfileRoute`, `AdminAnaesthetistRecordRoute` | `MasterData`, `SurgeonProfile`, `AnaesthetistRecord` |
| `/admin/audit` | `AdminAuditRoute` | `AuditViewer` |
| `/admin/*` | Navigate `/admin` | |
| `/mobile` -> `/mobile/lists` | `MobileApp host={PhoneFrame}` | index redirect |
| `/mobile/lists/*` | `MobileListsRoute` (splat; slide stack of Lists > List `:listId` > Booking `.../bookings/:bookingId`) | `apps/mobile/routes.tsx:33` |
| `/mobile/availability/*` | `MobileAvailabilityRoute` (calendar layer) | routes.tsx:183 |
| `/mobile/balances` | `MobileBalancesRoute` | `BalancesScreen` |
| `/mobile/more` | `MobileMoreRoute` | `MoreScreen` (+ `moreExtra` slot, PWA panel) |
| `/demo/control` | `DemoControlPanel` | section 5/6 |
| `/demo/xero`, `/demo/xero/invoices`, `/demo/xero/invoices/:accRecId` | `DemoXero` (one component, three URLs) | contacts tab / invoices tab / pair detail |
| `/demo/integrations` | `DemoIntegrations` | |
| `/demo/data` | `DemoData` | |

Nav labels: web `WebNav` tabs Dashboard/Lists/Availability/Accounts; admin `SideNav` Day view, Draft Lists, Conflicts, Notifications, Review queue, Invoices, Billing monitor, Integrations, Master data, Audit; mobile tab bar Lists/Availability/Balances/More (`apps/mobile/MobileApp.tsx:20-23`). Mobile actor is built from `APP_CONFIG.mobile.persona` (Dr Souter, `anaesthetistId '34821'`), MobileApp.tsx:110-114.

## 2. Harness bar and each control (`src/shell/`)

`AppShell.tsx` (139 lines). Layout `height:100dvh` column; `<header>` 48px, ink background (`neutral.ink`); `<main>` scrolls, hosts `<Outlet/>`. Active app = `appIdForPath(pathname) ?? shell.currentApp`; an effect mirrors the route app into the store (`setCurrentApp`, appStore.ts:281) so persona follows and a refresh returns to the app. Right-hand cluster order (AppShell.tsx:126-129): `AppSwitcher`, `DemoActionsMenu`, `DemoClockMenu`, `DemoResetButton`. Left: "AA Booking & Billing" + "Prototype" pill + `Requirements ↗` link only when `import.meta.env.DEV && VITE_REQUIREMENTS_URL` (AppShell.tsx:81). The bar renders on every route including `/mobile` (PhoneFrame sits below it).

Persona (display only): `PERSONAS` in `appConfig.ts:26`: souter = Dr Melanie Souter (MS, Anaesthetist, reg 34821); kirsty = Kirsty W. (KW, Office). Mobile and Web = souter; Admin and all demo surfaces = kirsty. There is no persona picker; persona is a pure function of the active app.

- **App switcher** (`AppSwitcher.tsx`): dropdown button showing active label + icon; menu 300px wide: "Apps" (Anaesthetist Mobile App, Anaesthetist Web App, Admin Web App) then divider, "Demo surfaces" (Demo: Billing Monitor & Xero, Demo: Integrations, Demo: Control Panel, Demo: Data Inspector). Choosing calls `onSelect` -> `setCurrentApp(id)` + `navigate(APP_CONFIG[id].path)` (AppShell.tsx:35). Registry: `src/shell/appConfig.ts` (`AppId`, `APP_CONFIG`, `APP_ORDER`, `appIdForPath`). To add a surface: add to `AppId`, `APP_CONFIG`, `APP_ORDER`, `ICONS` in AppSwitcher, and a route.
- **Demo actions menu** (`DemoActionsMenu.tsx`): pill with FlaskConical icon, label "Demo actions" (label hidden below 1280px by `.aa-demo-actions-label`, global.css:713) and an amber count badge. **Returns null when the current route has zero `'bar'` entries**, so the bar never grows. Click opens a popover (right-anchored, 360px, z 120) with a "Demo trigger" badge and "On this screen"; one block per entry: label, optional `DemoTriggerBadge` (future-scope / office-stand-in / colleague-stand-in), teal **Run** button (disabled when `disabledReason` non-null, reason text shown), description, `<select>` if the entry has `choices`, and a `role=status` result line (green-neutral if ok, warning tint if not). Popover stays open after a run. Closes on Esc (focus returns to pill), outside pointerdown, and on pathname change. `data-shot="demo-actions"` and `data-shot="demo-action-<id>"`. All behaviour from `useDemoTriggerRows('bar')`. Test: `DemoActionsMenu.test.tsx`.
- **Demo clock menu** (`DemoClockMenu.tsx`): pill with CalendarClock + demo time label (`useClockTimeLabel`). Popover: full date/time and a 2-col grid of shortcuts from `demoClockShortcuts(useAppStore, todayISO)` (`src/shared/demoClockShortcuts.ts`): `+15 min`, `+1 hour`, `Next day`, `Next morning` (08:00 tomorrow), `+7 days`, `Procedure day · 28 Jul` (disabled when today >= `S1_PROCEDURE_DAY = '2026-07-28'`). Calls `src/store/clockActions.ts`: `advanceClockMinutes/Days/ToNextMorning/ToDate`. Clock is forward-only. Stays on the current route; screen state untouched. Same shortcut list also used by Control Panel and PWA Demo clock card.
- **Reset** (`DemoResetButton.tsx`): pill "Reset"; click opens a confirm popover ("Reset all demo data? ... returns clock to Tuesday 21 July 2026, 8:00"); Confirm -> `resetDemo(useAppStore)` (`store/clockActions.ts:113` -> `resetDomainState`, `store/mutate.ts:260`): rebuilds seed masters/schedule/audit/settings/billing/xero/integrations, `INITIAL_CLOCK`; keeps `shell` slice except `suggestionSeq: 0`. Note it does NOT clear `aa-phone-scale`, the demo-trigger memory (`useDemoTriggerMemory`) or published context (UI-only stores).
- **PhoneFrame** (`PhoneFrame.tsx`): the ONLY mobile emulation in the framed build; host for `MobileApp`. 390x844 device with bezel, island, fake status bar (shows demo clock time), home indicator, class `aa-inset-simulated` (54px top / 34px bottom simulated insets), `AtmosphereLayer`. Presenter zoom control (fixed bottom-right: -, %, +, Fit; range 0.5-1.3, step 0.1, auto-fit until user picks; persisted in `localStorage 'aa-phone-scale'`, try/catch). `GradientLab` (tuning panel, `shell/gradientLab/`) mounts only when `GRADIENT_LAB_ENABLED` (`theme/gradientLabGate.ts`, currently `true`; only feature flag in the prototype); lab state in `localStorage 'aa-gradient-lab'`. Visual-only.

## 3. Demo-trigger registry: architecture and extension points

Directory `src/shared/demoTriggers/` (imported by path, NOT via `shared/index.ts` barrel; must stay free of `apps/*` and `shell/*` imports because the PWA closure contains it, enforced by `pwa/pwaPurity.test.ts`).

- `types.ts`: `DemoTrigger { id, label, description, screen, routes[], surfaces[], badge?, when?(state,ctx), choices?(state,ctx), defaultChoice?(...), disabledReason(state,ctx,choiceId), run(api,ctx,choiceId)=>{ok,message}, indexPath(state), indexEmptyReason?, indexHint? }`. `DemoTriggerCtx { pathname, params (from matched pattern), published }`. Surfaces: `'bar' | 'pwa'`. Badges: `'future-scope' | 'office-stand-in' | 'colleague-stand-in'`.
- `registry.ts`: `export const DEMO_TRIGGERS` (line 361, order = display order; 1093 lines). Route patterns are `react-router` `matchPath` with `end:true` against the full pathname, so a nested path needs its own pattern (mobile Lists registers three explicit layers, registry.ts:106).
- `match.ts`: `demoTriggersFor(state, pathname, surface, published)` (pure: surface filter -> route match -> `when`), `initialChoice`.
- `useDemoTriggers.ts`: `useDemoTriggers(surface)` re-renders on route, store, published-context and memory changes; `useDemoTriggerRows(surface)` adds per-row choice + result state (reset on pathname change; results keyed `pathname|id`), `run()` calls `trigger.run(useAppStore, ctx, chosen)`. Shared by bar menu and PWA sheet, which only render.
- `context.ts`: screen state the URL cannot carry. A screen calls `useDemoTriggerContext(key, value)` while mounted; stored in a separate zustand store (`useDemoContextStore`, UI-only, unpersisted). Existing keys (`DemoContextValues`): `integrations.tab` (set by `IntegrationMonitorScreen.tsx:48`), `integrationsSim.selectedMessageId` (`DemoIntegrations.tsx:54`), `aaFees.month` (`AaFeesScreen.tsx:98`), `adminDay.selectedSlotId` (`SlotDrawer.tsx:62`), `adminDraftLists.openListId` (`DraftListDrawer.tsx:56`), `adminMasters.view` (`MasterData.tsx:33`). Note: `adminDraftLists.openListId` is published but no registry entry reads it; `adminDay.selectedSlotId` is read only by `simulate-sickness` `defaultChoice`.
- `memory.ts`: `useDemoTriggerMemory` (not persisted): `lastMessageId`, `lastWebhook`, `webhookCounter`, and the UI-only photo-capture request (`requestPhotoCapture`, consumed by `MobileListsRoute`, `apps/mobile/routes.tsx:47-55`).
- `DemoTriggerBadge.tsx`: badge render (uses `shared/DemoBadge.tsx`, tones `demo`/`future`).

**To add a screen-contextual trigger (the planned extension):** append one `DemoTrigger` object to `DEMO_TRIGGERS` with `routes` (patterns from `router.tsx`/`pwa/main.tsx`), `surfaces: ['bar']` (and/or `'pwa'`), `when` for seed/tab gating, `choices` if a picker is needed, `disabledReason` (null = runnable) and `run` calling an audited store action (use `DEMO_TRIGGER_ACTOR` {who 'Demo actions', role system, source demo}, `OFFICE_ACTOR` {Kirsty W.} or `OFFICE_SIMULATION_ACTOR` {'AA office (simulated)', role office} from `store/demoActors.ts`). If it needs screen state not in the URL, add a key to `DemoContextValues` and call `useDemoTriggerContext` in that screen. No change to `DemoActionsMenu`, `AppShell`, `PwaDemoActions` or the Control Panel is needed: the bar menu and PWA sheet list entries by route; the Control Panel index groups by `screen` and shows `indexPath`. The bar menu needs no new button area: it auto-appears as one pill. Constraints: label/description/screen/hint contain no en/em dashes (tested, `demoTriggers.test.ts:47`); every bar entry's `indexPath` must land where it is visible (test :59); PWA-only entries must not appear in the bar (:74); do not register "Run payables" (product button, :55). Adding a context key requires nothing in persistence (no `PERSIST_VERSION` bump).

Limits of the current mechanism (relevant to extension): the bar has ONE popover that lists all entries for the route in registry order (no grouping, no per-entry inline buttons, no keyboard shortcut); entries are matched by URL only, so a screen-local overlay (drawer/sheet) is visible to triggers only through published context; entry visibility has no "role/persona" concept (bar is persona-agnostic).

## 4. Every registered demo trigger (`registry.ts`; 30 entries, registry order)

Columns: id (line) | label | routes | surf | gate / disabled reason | store call (file:line). "bar"=harness bar menu, "pwa"=installed-PWA sheet.

| id | Label | Routes | Surf | Gate / disabled when | What it does (store call) |
|---|---|---|---|---|---|
| billing-failure (364) | Trigger billing failure | `/admin/billing` | bar | `when` seed list `SEED_LIST_IDS.billingFailure` exists; disabled 'Already triggered' if `billedAtISO` set | `editContract(CONTRACT.cosAcc,{effectiveToISO:'2026-07-15'})` (store editContract), `submitList` if ACTIVE, `authoriseList` as `OFFICE_ACTOR`; wired billing run fails COS booking, sibling invoices |
| arm-handoff-fault (397) | Arm handoff failure | `/admin/billing` | bar | disabled 'Armed' if `settings.failNextHandoff` | `armHandoffFault(api, OFFICE_ACTOR)` (`store/demoSettingsActions.ts:42`) |
| run-reconciliation-poll (412) | Run reconciliation poll | `/admin/billing` + Xero sim URLs | bar | always | `runReconciliationPoll` (`store/reconciliationPoll.ts:19`) |
| run-archive-job (433) | Run archive job | same | bar | always | `runArchiveJob` (`store/archiveActions.ts:66`) |
| simulate-sign-in (457) | Simulate sign-in attempts | `/admin/audit` | bar | always | `simulateSignInAttempts` (`store/authDemoActions.ts:24`) adds 5 audited account rows (provision no-credential, admin MFA, failed sign-in, password reset, social login mobile) |
| stage-post-op (479) | Stage post-op scenario | `/admin/review/:listId`, `/admin/day/:dateISO/bookings/:bookingId` | bar | `when` list is `POST_OP_ORIGINAL_LIST_ID` (Sharma Tue 14 Jul AM, `projectedListId(ANAE.sharma,'2026-07-14','AM')`); disabled if already AUTHORISED | `submitList` + `authoriseList` as OFFICE_ACTOR |
| ingest-pdf-row (515) | Ingest PDF row | `/admin/integrations` | bar | `when` published `integrations.tab==='pdfs'`; disabled if target session has no List | `ingestPdfRow(api, OFFICE_ACTOR, listId, row R2 of SURGEON_PDFS[0])` (`store/integrationActions.ts:453`), dedup by NHI |
| payment-full (548) | Payment received · full | `/admin/invoices/:invoiceId`, `/demo/xero/invoices/:accRecId` | bar | `when` not an AA-fee pair; `paymentDisabledReason` ('Not handed off to Xero', 'Fully paid', 'Seeded history invoice') | `sendPaymentWebhook(...,'full')` -> `receivePayment({source:'webhook', key WEBHOOK-<accRecId>-<n>})` (`store/paymentActions.ts:69`); paired ACCPAY authorised for same amount |
| payment-half (563) | Payment received · half | same | bar | same | same, half of remaining (`roundToCents`) |
| payment-replay (578) | Replay last payment event | same | bar | disabled if no last webhook or its key not in receipts (reset) | re-sends same key; expects idempotent no-op |
| run-scheduled-fee-run (604) | Run scheduled month-end fee run | `/admin/billing/aa-fees` | bar | `aaFeeRunDisabledReason(month)`; month from published `aaFees.month` | `runMonthlyFeeInvoices(AA_FEE_RUN_ACTOR,{monthISO})` (`store/aaFeeActions.ts:192`) |
| seed-month-of-bctis (627) | Seed a month of BCTIs | same | bar | `when` Rutherford exists; `seedBctisDisabledReason` | `seedMonthOfBctis(DEMO_TRIGGER_ACTOR, ANAE.rutherford)` (`store/demoBctiSeed.ts:102`), tops to `BCTI_SEED_TARGET` paid BCTIs in `BCTI_SEED_MONTH` |
| record-fee-payment (649) | Record fee payment | `/demo/xero/invoices/:accRecId` | bar | `when` accRec.kind==='aaFee'; `aaFeePaymentDisabledReason` | `recordFeePaymentFor` -> `recordAaFeePayment` key `FEE-PAY-<id>` (`aaFeeActions.ts:263`) |
| office-authorises-list (669) | Office authorises this List | `/mobile/lists/:listId`, `.../bookings/:bookingId` | pwa | `officeStandInRefusal` | `authoriseAsSimulatedOffice` (`store/officeStandIn.ts:32`), badge office-stand-in |
| office-assigns-next-free (692) | Office assigns a List to my next free session | `/mobile/lists` | pwa | no free session before horizon | choices `STAND_IN_ASSIGN_CHOICES`; `assignNextFreeSlotAsSimulatedOffice` (`officeStandIn.ts:82`) |
| office-assigns-draft-list (722) | Office assigns a Draft List to me | `/mobile/lists` | pwa | no free session | `assignDraftListAsSimulatedOffice` (`officeStandIn.ts:107`); message never names preference/tier (D44, OQ-64) |
| simulate-sickness (750) | Simulate sickness | `/admin/day/:dateISO`, `/admin/conflicts` | bar | choices = `sicknessCandidates(state,dateISO)` (day in URL, else today); default from published `adminDay.selectedSlotId`; `sicknessRefusal` | `simulateSickness(api,listId)` (`store/demoSimulations.ts:49`): slot marked Unavailable by office, List keeps Bookings |
| colleague-moves-list-to-office (787) | Colleague moves a List to the office | `/admin/day/:dateISO`, `/admin/notifications` | bar | choices 'One move' / 'A busy morning (`BUSY_MORNING_MOVES` moves)'; `colleagueMoveRefusal` | `stageColleagueMoveToOffice` (`store/listMoveDemo.ts:86`) / `stageBusyMorning` (:103) |
| colleague-moves-list-to-me (818) | Colleague moves a List into my free session | `/mobile/availability` | pwa | `moveToPersonaRefusal(state, ANAE.souter)` | `stageColleagueMoveToPersona` (`listMoveDemo.ts:154`), badge colleague-stand-in |
| simulate-incoming-request (842) | Simulate incoming request | `/admin/draft-lists` | bar | choices `CANNED_DRAFT_LIST_REQUESTS`; `incomingRequestRefusal` | `simulateIncomingDraftListRequest` (`store/draftListDemo.ts:49`) |
| add-draft-list-for-day (868) | Add Draft List for this day | `/admin/day/:dateISO` | bar | choices `CANNED_DAY_DRAFT_LISTS`; `dayDraftListRefusal` | `addDraftListForDay(api,dateISO,id)` (`draftListDemo.ts:70`) |
| stage-recurring-clash (888) | Stage recurring clash | `/admin/masters` | bar | `when` published `adminMasters.view==='recurringBookings'`; choices `stageableRecurringBookings`; 'Already staged' | `stageRecurringClash` (`draftListDemo.ts:108`): marks anaesthetist Unavailable on first day past schedule; clash materialises when clock reaches it |
| raise-sample-warnings (924) | Raise sample warnings | `/admin/day/:dateISO`, `/admin/day/:d/bookings/:b`, `/mobile/lists/:l/bookings/:b` | bar+pwa | `daySampleRaiseRefusal` / `sampleRaiseRefusal` | `raiseDaySamples` (`store/warningSamples.ts:295`, Rutherford Tue 21 Jul Bookings) or `raiseSamplesOn(bookingId)` (:207); `WARNING_RULE_COUNT` rules (currently note says 1 rule: unpaid prepayment) |
| clear-sample-warnings (947) | Clear sample warnings | same | bar+pwa | `allSampleClearRefusal` / `sampleClearRefusal` | `clearAllSamples` (:309) / `clearSamplesOn` (:226) |
| office-clears-warning (965) | Office clears this warning | `/mobile/lists/:l/bookings/:b` | pwa | choices = open warnings on booking | `clearWarning(api, OFFICE_SIMULATION_ACTOR, bookingId, key)` (`store/warnings.ts:174`) |
| photo-capture-future (997) | Photo capture (Future scope) | `/mobile/lists/:listId` | bar+pwa | List must be ACTIVE | UI only: `useDemoTriggerMemory.requestPhotoCapture(listId)`; `MobileListsRoute` opens Add a booking sheet on the photo prong. No domain mutation |
| fire-hospital-message (1017) | Fire hospital message | 3 mobile Lists layers, `/admin/integrations`, `/demo/integrations` | bar+pwa | always; default = published `integrationsSim.selectedMessageId` | `processMessage(api, messageId)` (`store/integrationActions.ts:328`), choices `CANNED_MESSAGES` (HL7 v2 / FHIR; includes dead-letter MSG-CPH-2001); badge future-scope |
| replay-hospital-message (1042) | Replay last message (dedupe) | same | bar+pwa | needs `lastMessageId` still in `integrations.messages` | `processMessage` again -> outcome 'duplicate' |
| pwa-payment-full (1070) | Payment received · full | `/mobile/balances` | pwa | choices Dr Souter's open ACCRECs; 'No open invoices yet' | `sendPaymentWebhook` |
| pwa-payment-half (1082) | Payment received · half | `/mobile/balances` | pwa | same | `sendPaymentWebhook(...,'partial')` |

(The PWA chip never shows on More: no entry registers `/mobile/more`.)

Where the bar menu is EMPTY (no entry matches): all of `/web/*`, `/mobile/more`, `/mobile/balances` (PWA entries only), `/admin/review` (list, no `:listId`), `/admin/invoices` index, `/admin/billing/aa-fees/settings`, `/admin/masters` (except Recurring bookings view), `/admin/masters/surgeons/*`, `/admin/masters/anaesthetists/*`, `/demo/control`, `/demo/data`. On bar, mobile routes show only hospital messages, photo capture and sample warnings (booking layer).

Control Panel index lists entries grouped by `screen` string; the `screen` heading for sickness/colleague-move entries etc. are free text.

## 5. Demo surfaces (`src/apps/demo/`)

All wrap `DemoSurface.tsx` (title, subtitle, amber "Demo simulation" badge; optional `futureScope` adds second "Future scope" badge + line). No store mutation happens just by viewing.

**`DemoControlPanel.tsx` (`/demo/control`, 512 lines).** Three groups: (a) Clock & reset: clock card with the same six `demoClockShortcuts` buttons; "Reset to pristine seed" with inline confirm -> `resetDemo`. (b) Scenario jumps S1 to S5 (section 6). (c) "Demo actions by screen": index of EVERY `DEMO_TRIGGERS` entry grouped by `screen`, showing label, badge, description, "Shows in: Harness bar / Installed PWA", and "Open screen" -> `navigate(trigger.indexPath(state))` (PWA-only entries say "Shown in the installed PWA"; disabled with `indexEmptyReason` when path null). Nothing is fired from here (since Phase 14). Static note: Billing monitor "Run payables" is product UI. Static note: billing rounding assumption (per started 15 min first 2 h then per started 10 min; flagged to confirm with AA). Hardcoded `indexPath`s in the registry: `/admin/day/2026-07-22` (sickness), `/admin/day/2026-07-21` (colleague move, sample warnings), `/mobile/lists/<souterPm21>` (photo).

**`DemoXero.tsx` (`/demo/xero[/invoices[/:accRecId]]`, 914 lines) + `xeroPairView.ts`.** Simulated Xero org. Callouts: no personal info/NHI in Xero (contact known by hidden ContactNumber); duplicate-invoice-number prevention is a mandated Xero org setting (open item). Tabs: Contacts (read-only table ContactID/ContactNumber/Name/Type/Archived) and Invoices (table of ACCREC/ACCPAY pairs: payer, payee, due/received, authorised/disbursed, status; row click -> pair detail). Pair detail (`PairDetail`, :226): ACCREC card + ACCPAY card, "Linked Billing Engine case" callout (case ref, booking id, billing invoice id, patient name kept under `engine`, not on contacts), "View in Dr Souter's account" link to `/web/accounts/payments?invoice=<number>` when `anaesthetistId` is the web persona. **In-page action (not registry): "Simulate payment and payout"** (`settleInvoice`, :237): `receivePayment({accRecId, amount: balance, idempotencyKey: 'DEMO-INVOICE-SETTLEMENT-<id>', source:'webhook'})` then `disbursePayable(OFFICE_ACTOR, accPayId)` (`store/paymentActions`); button states 'Pay <anaesthetist> now' / 'Payment and payout complete'. Fee pair (`FeePairDetail`, :406): AA's own fee ACCREC, no ACCPAY ("no payable, never netted"), in-page "Record fee payment" calling `recordFeePaymentFor` (same body as registry entry), link to `/web/accounts/fees?invoice=`. Footer callout "Contact archiving & volume" reads `settings.volumeStory` (soft limit, invoices/year, one-time %, narrated active contacts; "Scale is narrated with counters, not simulated"). `xeroPairView.ts` joins `xero.accRecs/accPays`, `billing.cases/invoices/invoiceLines/aaFeeInvoices`, bookings, patients into `XeroInvoicePairView` (`kind 'procedure'|'aaFee'`; `incomplete` flag; balance = `roundToCents(max(0,due-received))`; sorted by invoice number). Unknown `:accRecId` redirects to `/demo/xero/invoices`.

**`DemoIntegrations.tsx` (`/demo/integrations`, 587 lines).** Integration simulator, badged Future scope (HL7 v2, FHIR R4, near-real-time are Future; in scope is the St George's and Southern Cross download into a matching screen). Left rail: feed picker (`FEED.stg`, `FEED.cph`, `FEED.sx` with `FEED_META`; Southern Cross is FHIR-native, others HL7 v2 translated), "Start live feed" (setInterval 1000ms processing each message of the feed in order via `processMessage`, then stops), "Reset demo data" (confirm -> `resetDemo` + local state reset), selected message with **Replay** (`processMessage`), three panes: raw HL7 (segment-highlighted) -> FHIR R4 bundle (`extractViaMapping` / `toFhirBundle` from `domain/integrations`, built from the LIVE `feeds[feedId].fieldMapping`, so an operator's mapping fix changes the output) -> schedule change (`EffectView` from `integrations.messages` row status/failureReason and result booking). Right: message library list (`CANNED_MESSAGES` of feed) with per-row Replay (`processMessage`). Below: feed field-mapping chips; callout on FHIR-first/Digital Services Hub/NHI validation/Keycloak (referenced, not implemented). Publishes `integrationsSim.selectedMessageId` for the registry.

**`DemoData.tsx` (`/demo/data`, 660 lines).** Data inspector: entity counts (`entityCounts`) + persisted payload size vs `STORAGE_BUDGET_BYTES` and `persistStatus()`; today's sessions (Slot views via `slotViewsForDate`) with canvas invariant check (AM+PM for every active anaesthetist whose start date has come; every non-DRAFT List in a Slot; one List per Slot); seeded scenario finder (`SEED_MARKERS`, selects entity + loads audit trail); per-entity audit trail; Lifecycle states filter (DRAFT/ACTIVE/SUBMITTED/AUTHORISED counts); **Guard console** (in-page action, not registry): pick persona (Souter / Kirsty / "HL7 feed" system actor), action (`completeBooking`, `cancelBooking` with fixed reason, `editBooking` notes, `submitList`, `authoriseList`) and target Booking/List, runs the real store function and shows the `Outcome` (refusal messages for forbidden transitions). The only place any actor can be chosen freely.

## 6. Scenario jumps S1 to S5 (`DemoControlPanel.tsx:252-350`, `ScenarioJumps` :353)

Each: Jump -> inline confirm -> `resetDemo(useAppStore)` + scenario preparation -> green/amber result + nav buttons. Not registry entries; not available in the bar or PWA.
- **S1 Booking to theatre**: reset only; message says HL7/FHIR are Future scope, present as illustration. Nav: Mobile, Integrations.
- **S2 Office day**: reset only; message is a script (assign St George's Draft List to Dr Fitzgerald, Dr Beaumont's recurring Lists as Draft Lists on leave, etc.). Nav: Admin.
- **S3 Money end-to-end**: reset; verifies `SEED_LIST_IDS.souterMon20Am` and `souterMon20Pm` are SUBMITTED (else `ok:false`). Nav: Admin.
- **S4 Exceptions**: reset only; script text (prepayment warning on Annette Riley, post-op, billing failure, dead-letter, partial payment). Nav: Mobile, `/admin/billing`.
- **S5 Compliance tour**: reset; three live edits on David Chen's Booking (`editProcedure` asaClass AS2 as SOUTER_ACTOR, `editBooking` notes as OFFICE_ACTOR, `editProcedure` AS1) for `SEED_MARKERS.overriddenTimeUnitsBooking`, then `authoriseList(OFFICE_ACTOR, SEED_LIST_IDS.whitakerFri17)` to raise invoices under the Health NZ agreed-rate contract. Nav: Admin, Xero sim.

## 7. PWA target

Build: `npm run build:pwa` -> `dist-pwa/` from `vite.pwa.config.ts` + `pwa/index.html` + `pwa/main.tsx`. `vite-plugin-pwa` `generateSW`, `registerType:'prompt'` (never autoUpdate), manifest: name 'AA Booking & Billing', short 'AA Booking', standalone, portrait, `start_url '/mobile/lists'`, `scope '/'`, `id '/aa-booking-billing'` (never change), theme `#F3EAEC`, bg `#F6F8F7`, icons 192/512 + maskable; precache `js,css,html,woff2,png,svg,ico,webmanifest`; defines `__BUILD_ID__`, `__BUILD_DATE__`. `pwa/index.html`: `viewport-fit=cover`, `interactive-widget=resizes-content`, iOS `black-translucent` status bar, preloaded self-hosted fonts.

`pwa/main.tsx`: wires the same four store jobs plus `wireOfficeSimulation`; imports `installPrompt` for its side effect (captures `beforeinstallprompt` early); routes only `/mobile` (index -> lists; `lists/*`, `availability/*`, `balances`, `more`) and `*` -> `/mobile/lists`; URLs stay `/mobile/*` (hardcoded prefix in mobile nav). Host: `<MobileApp host={MobileViewport} moreExtra={<PwaDemoPanel/>}/>`. No AppShell, no web/admin/demo code (bundle ~549 KiB vs ~888 KiB). `src/pwa/pwaPurity.test.ts` walks the import graph from `pwa/main.tsx` and fails if it reaches `apps/web`, `apps/admin`, `apps/demo`, `shell/AppShell.tsx`, `router.tsx`, `PhoneFrame.tsx`, `GradientLab.tsx`, `shell/DemoActionsMenu.tsx`.

`src/pwa/`:
- `MobileViewport.tsx`: full-device host; sets `--aa-inset-*` from `env(safe-area-inset-*)` (class `aa-inset-device`); sets `--aa-viewport-shortfall` from `viewportMetrics.ts`; mounts `UpdatePrompt` and **`PwaDemoActions`** in the host-chrome seat.
- `PwaDemoActions.tsx`: amber "Demo" chip (absolute, bottom-right above tab bar/dock `--aa-dock-height`, z 55) shown only when `useDemoTriggerRows('pwa')` is non-empty; shows "Office auto" tag when office sim is on; opens `BottomSheet` with rows: badge, label, description, choices as `role=radio` tappable rows, Run, status result (`data-shot="pwa-demo-action-<id>"`). Sheet closes on route change. PWA entries today: Mobile Lists (office assigns List / Draft List, hospital messages), List (office authorises, photo capture, messages), Booking (sample warnings, office clears warning), Availability (colleague moves List to me), Balances (payment full/half).
- `PwaDemoPanel.tsx` (More tab, via `moreExtra` slot -> `MoreScreen extra`): cards `InstallCoach` (Add-to-Home-Screen coaching, only in a browser tab; iOS instructions, Android one-tap via captured `beforeinstallprompt`; dismissal key managed by `installPrompt.ts`), **Demo clock** (clock readout + `demoClockShortcuts` 2-col grid), **Office simulation** (switch "Play the office", `localStorage 'aa-office-simulation'`, default off), **Demo data** (Reset demo data -> bottom-sheet confirm -> `resilientLocalStorage.removeItem(PERSIST_KEY)` first, then `resetDemo`, then `clearInstallCoachDismissal`), **Build** (`__BUILD_ID__`, release date, cold launch ms from `bootMetrics`, Offline ready from `serviceWorkerReady()`, Saved data size/`persistStatus().disabled`, "Check for update" -> `checkForUpdate()`), **Viewport** diagnostics (`viewportMetrics.ts` readout, copy-to-clipboard, "Show shortfall band" probe toggle).
- `officeSimulation.ts`: `wireOfficeSimulation(api)` subscribes to the store; on an ACTIVE -> SUBMITTED List transition arms a 4s timer (`OFFICE_SIM_DELAY_MS`); if the toggle is on, calls `authoriseAsSimulatedOffice` (actor 'AA office (simulated)'), else re-arms. Explicitly "a demo scaffold, not the proposed flow" (`OFFICE_SIM_COPY`). Seeded SUBMITTED Lists are never touched (only live transitions).
- `UpdatePrompt.tsx` (teal "reload" pill from `useRegisterSW`, polls every 60s), `swRegistration.ts`, `installPrompt.ts`, `InstallCoach.tsx`, `bootMetrics.ts`, `BootMark.tsx`, `viewportMetrics.ts`: device plumbing, no domain logic.

Extension point for the PWA: the same registry drives it. A new trigger with `surfaces:['pwa']` and a mobile route pattern appears automatically in the chip/sheet; the chip is hidden on screens with no entries (including More). The sheet has no grouping.

## 8. Business rules / validation visible in this area

- Clock is forward-only; crossing midnight rolls the canvas forward with the seed generator, one summary audit entry per rolled day (`store/clockActions.ts:46-70`, source 'demo'); a recurring booking landing on a closed session becomes a Draft List (Phase 31, OQ-81). Horizon length is a setting (`appSettings.schedule.horizonMonths`). `DEMO_TODAY` 2026-07-21 08:00; `S1_PROCEDURE_DAY` 2026-07-28.
- Payments: webhook payment idempotent by key (`WEBHOOK-<accRecId>-<n>`, n skips used receipt keys, registry.ts:215); paired ACCPAY authorised for exactly the amount received; only `openAccRecs` can be paid via triggers ('Seeded history invoice' otherwise); AA fee invoices paid only by "Record fee payment" into AA's own account, never netted.
- Xero holds no NHI/personal info; patient identity stays in Billing Engine link (`xeroPairView.ts` header, DemoXero callouts).
- Guards: all triggers mutate via audited store actions with typed actors (office stand-ins use a distinct 'AA office (simulated)' actor, role office so `officeOnly` guards pass).
- Billing rounding (partial intervals round up per started interval) is a documented assumption, DemoControlPanel.tsx:228.
- URL hygiene: `RequireEntity` and `isISODate` as above.

## 9. Stubbed, hardcoded, visual-only, gaps

- Persona is derived from app, not selectable; "Kirsty" for admin and all demo pages.
- Requirements link in bar: dev only; absent from any build.
- PhoneFrame chrome, zoom, Gradient Lab: visual only. `aa-phone-scale` and office-sim keys survive Reset.
- Seed-scoped, hardcoded triggers: billing-failure (COS ACC contract date-out `2026-07-15`, Ropata Thu 16 Jul), stage-post-op (Sharma 14 Jul AM; message text names dates), ingest-pdf-row (Dr Souter Mon 27 Jul AM, row R2), raise-sample-warnings (Dr Rutherford Tue 21 Jul), seed-month-of-bctis (Rutherford, `BCTI_SEED_MONTH`), indexPaths with fixed 2026-07 dates. These break silently (entry hidden or disabled) if the seed changes.
- Trigger "Run" always uses the whole-store hook `useAppStore()` in `useDemoTriggers` (re-renders the bar on every store change; fine for prototype).
- `adminDraftLists.openListId` context key published, no trigger consumes it yet.
- `/demo/xero` pair "Simulate payment and payout" and Data Inspector guard console and Integrations simulator Replay/live feed are in-page demo actions NOT in the registry (so not in the bar menu, not in the Control Panel index).
- Hospital messages: HL7 v2/FHIR intake is labelled Future scope everywhere; the in-scope hospital download is not simulated here (S1 text says "arrives in a later build").
- Photo capture is UI-only (no domain effect) and badged Future scope.
- Playwright selectors: `data-shot` attributes (`demo-actions`, `demo-action-<id>`, `pwa-demo-actions`, `pwa-demo-action-<id>`, `scenario-sN`, `scenario-confirm`, `control-demo-index`, `index-<id>`, `integrations-*`, `xero-*`) are relied on by capture recipes; keep stable when adding triggers.
- Not read in detail: `viewportMetrics.ts`, `swRegistration.ts`, `installPrompt.ts` internals, `GradientLab.tsx` panel UI, `MoreScreen` itself (apps/mobile map covers it).
