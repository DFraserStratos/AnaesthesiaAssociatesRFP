# Prototype map: shell, demo surfaces, PWA, router

All paths are under `aa-prototype/` unless absolute. Verified against the code on master (after commit 63a44902); line numbers are approximate.

**Orientation.** `src/main.tsx` renders `App.tsx`, which renders only `AppRouter` (`src/router.tsx`). One layout route, `AppShell` (`src/shell/AppShell.tsx`), wraps every URL: a 48px dark harness bar (title, "Prototype" pill, optional Requirements link, persona chip, app switcher, "Demo actions" menu, demo clock menu, Reset) above an `<Outlet/>`. Beneath it sit the three apps (`/web`, `/admin`, `/mobile`, each a nested layout route) and four demo-only surfaces (`/demo/*`). **Screen-contextual demo triggers already exist** (catch-up Phase 14): a registry `src/shared/demoTriggers/registry.ts` (`DEMO_TRIGGERS`, 42 entries) is matched against the current URL and rendered by `DemoActionsMenu` in the harness bar (framed build) and `PwaDemoActions` as a "Demo" chip plus bottom sheet (installed PWA). The Control Panel page is only an index of them. A second, separate PWA entry (`pwa/main.tsx`) mounts the Mobile App alone with a "Demo" panel on the More tab. No fetch anywhere: every trigger calls store actions.

## Contents
1. Router and URL map
2. Harness bar (AppShell, AppSwitcher, DemoClockMenu, DemoResetButton, PersonaChip)
3. Demo-trigger framework (types, matching, context, memory, inline) and extension points
4. DemoActionsMenu (bar) and its rows
5. Registry: every trigger (id, label, routes, surface, store call)
6. Demo surfaces: Control Panel, Xero, Integrations, Data inspector, Component catalogue
7. PhoneFrame, Gradient Lab
8. PWA build (entry, host, demo panel, demo chip, office simulation, install/update)
9. Stubs, hardcoded and visual-only items
10. Tests that pin this area

---

## 1. Router and URL map (`src/router.tsx`, `src/App.tsx`, `src/shell/appConfig.ts`, `routeParams.ts`, `RequireEntity.tsx`)
`BrowserRouter` (v7 future flags). Single parent `<Route element={<AppShell/>}>`; index and `*` use `RootRedirect` (router.tsx ~L62) which navigates to `APP_CONFIG[store.shell.currentApp].path` (last app, persisted).

| Path | Component | Notes |
|---|---|---|
| `/web` (+ `lists`, `lists/:listId`, `lists/:listId/bookings/:bookingId`, `lists/:listId/cards/:cardId`, `availability`, `availability/mine`, `accounts/:subTab`, `accounts` -> `overdue`) | `WebApp` layout; `Web*Route` from `apps/web/routes` | `cards/:cardId` -> `LegacyBookingRedirect` (`shared/legacy`) |
| `/admin` (+ `day/:dateISO`, `day/:dateISO/bookings/:bookingId`, `conflicts`, `draft-lists`, `notifications`, `review`, `review/:listId`, `invoices`, `invoices/:invoiceId`, `billing`, `billing/aa-fees`, `billing/aa-fees/settings`, `integrations`, `masters`, `masters/surgeons/:surgeonId`, `masters/anaesthetists/:anaesthetistId`, `audit`) | `AdminApp` layout; `Admin*Route` from `apps/admin/routes`; index = `AdminIndexRedirect` | master pages are single child routes so unknown ids fall back to `/admin/masters` |
| `/mobile` (+ `lists/*`, `availability/*`, `balances`, `more`) | `MobileApp host={PhoneFrame}`; `MobileListsRoute`, `MobileAvailabilityRoute`, `MobileBalancesRoute`, `MobileMoreRoute` | splat routes: slide stack keeps layers mounted; deeper URLs `/mobile/lists/:listId`, `/mobile/lists/:listId/bookings/:bookingId` are parsed inside `apps/mobile/routes.tsx` |
| `/demo/control` | `DemoControlPanel` | |
| `/demo/xero`, `/demo/xero/invoices`, `/demo/xero/invoices/:accRecId` | `DemoXero` | unknown accRecId redirects to `/demo/xero/invoices` |
| `/demo/integrations` | `DemoIntegrations` | |
| `/demo/data` | `DemoData` | |
| `/demo/catalogue` -> `/demo/catalogue/admin`; `/demo/catalogue/:app` (admin|web|mobile) | `ComponentCatalogue` | URL only, not in switcher |

- `routeParams.ts`: `isISODate` guards `:dateISO` / `?week=`. `RequireEntity` turns a missing entity into `<Navigate to=".." replace/>`.
- Principle in router comment: path = navigation, query = view preference (`?week=`, `?sort=`, `?view=` on masters), overlays are local state.
- `appConfig.ts`: `AppId` = mobile|web|admin|demo-xero|demo-integrations|demo-control|demo-data; `APP_CONFIG[id]` = {label, path, persona, group 'apps'|'demo'}; `APP_ORDER`; `appIdForPath()` (prefix match). `PERSONAS`: souter (Dr Melanie Souter, MS, Anaesthetist, anaesthetistId 34821) and kirsty (Kirsty W., KW, Office). Mobile and Web run as Souter; Admin and all demo surfaces as Kirsty. Only two personas exist; there is no persona picker (persona is derived from the app).

## 2. Harness bar (`src/shell/AppShell.tsx`)
- Layout: `height:100dvh` flex column; `<header>` 48px, ink background; `<main data-aa-modal-scope>` scrolls (modal scope makes an open dialog inert but never the bar).
- URL is truth: `routeApp = appIdForPath(pathname)`; effect mirrors it into `store.shell.currentApp` via `setCurrentApp`. `handleSelect` calls `setCurrentApp` then `navigate(APP_CONFIG[id].path)` (always to the app ROOT, not remembering sub-screens).
- Left cluster: "AA Booking & Billing", "Prototype" pill, and a "Requirements ↗" link rendered only if `import.meta.env.DEV && VITE_REQUIREMENTS_URL` (never in builds).
- Right cluster, in order, all in the same `div` (this is the insertion point for further bar controls, AppShell.tsx ~L108): `PersonaChip` (shared/PersonaChip, display only), `AppSwitcher`, `DemoActionsMenu`, `DemoClockMenu`, `DemoResetButton`. The pill style (34px high, `rgba(255,255,255,.08)` fill, white text) is copy-pasted in `DemoActionsMenu.tsx`, `DemoClockMenu.tsx`, `DemoResetButton.tsx` ("kept in step").
- **AppSwitcher** (`AppSwitcher.tsx`): `usePopover` + `PopoverPanel` (300 wide). Section "Apps" (Mobile, Web, Admin), divider, "Demo surfaces" (Xero, Integrations, Control Panel, Data Inspector) with icons. Pure navigation; no store write except via `onSelect`.
- **DemoClockMenu** (`DemoClockMenu.tsx`): pill shows `useClockTimeLabel()`; popover shows long date + time and a 2-column grid of the six `demoClockShortcuts` (shared/demoClockShortcuts.ts): +15 min, +1 hour, Next day, Next morning, +7 days (all `advanceClockMinutes/Days/ToNextMorning` from `store/clockActions.ts`), and "Procedure day · 28 Jul" (`advanceClockToDate(api,'2026-07-28')`, `S1_PROCEDURE_DAY`; disabled when today >= that date). Clock is forward-only. Stays on the current route. Same shortcuts appear in Control Panel and the PWA panel.
- **DemoResetButton** (`DemoResetButton.tsx`): "Reset" pill, confirm popover ("Reset all demo data?"), calls `resetDemo(useAppStore)` (`store/clockActions.ts` L113 -> `resetDomainState`): restores seed and clock (Tue 21 Jul 2026 08:00), preserves `shell` slice (current app). Does not navigate.
- CSS: `.aa-demo-actions-label` hides the "Demo actions" text under 1280px (`theme/global.css` ~L804) so the bar never wraps.

## 3. Demo-trigger framework (`src/shared/demoTriggers/`) and extension points
Not exported from `shared/index.ts` on purpose (imports store + seed). Files:
- `types.ts`: `DemoTrigger` {id (kebab-case; also `data-shot="demo-action-<id>"`), label, description, `screen` (Control Panel group heading), `routes` (react-router `matchPath` patterns, `end:true`, against full pathname), `surfaces: ('bar'|'pwa')[]`, optional `badge` ('future-scope'|'office-stand-in'|'colleague-stand-in'), `when(state,ctx)` visibility, `choices(state,ctx)` / `defaultChoice` (picker options), `disabledReason(state,ctx,choiceId)` (null = runnable; else text under disabled Run), `run(api,ctx,choiceId) -> {ok,message}`, `indexPath(state)` (Control Panel "Open screen"), `indexEmptyReason`, `indexHint`}. `DemoTriggerCtx` = {pathname, params (route params), published (screen state)}.
- `match.ts`: `demoTriggersFor(state, pathname, surface, published)` pure; `initialChoice`.
- `useDemoTriggers.ts`: `useDemoTriggers(surface)` subscribes to location, whole app store, published context and trigger memory (re-evaluates live); `useDemoTriggerRows(surface)` adds per-row chosen option, disabled reason, result line (results keyed `pathname|id`, cleared on route change), `run` = `trigger.run(useAppStore, ctx, chosen)`.
- `context.ts`: a tiny UI-only zustand store (not the app store, not persisted, no audit). Screens publish state the URL cannot carry with `useDemoTriggerContext(key,value)` (while mounted) or `useDemoTriggerContextWhile(key,value,active)` (sheet open). Keys (`DemoContextValues`): `integrations.tab`, `integrationsSim.selectedMessageId`, `aaFees.month`, `adminDay.selectedSlotId`, `adminDraftLists.openListId`, `adminMasters.view`, `adminPicker.listId`, `adminContracts.openContractId`. Publishers: `apps/admin/screens/IntegrationMonitorScreen.tsx:49`, `apps/demo/DemoIntegrations.tsx:55`, `AaFeesScreen.tsx:80`, `masters/MasterData.tsx:34`, `components/SlotDrawer.tsx:72`, `components/DraftListDrawer.tsx:60`, `flows/ContractEditSheet.tsx:82`, `SessionStatusSheet.tsx:84`, `AssignDraftListSheet.tsx:67`, `ReassignListFlow.tsx:59`.
- `memory.ts`: `useDemoTriggerMemory` (zustand, not persisted): `lastMessageId`, `lastWebhook`, `webhookCounter`, `photoCaptureRequest` (consumed by `apps/mobile/routes.tsx:74-80`, opens Add-a-booking sheet on photo prong), `regenerated[invoiceId]` (read by `apps/admin/screens/InvoiceDocument.tsx:516`). A reload or reset forgets it.
- `InlineDemoTrigger.tsx`: runs a registry entry (by `id` + fixed `choiceId`) as a dashed-teal button inside a product sheet where the harness bar is covered by a scrim. Used once: `apps/admin/components/pairing/AnaesthetistCandidates.tsx:214` (`ask-colleague-make-available`). Safe outside a router (tests).
- `DemoTriggerBadge.tsx`, `procedureTextTriggers.ts` (pure helpers for `hospital-description-arrives` and `fire-hospital-message`'s default).
- `registry.ts` (1492 lines, `DEMO_TRIGGERS` from ~L440).

**To add a screen-contextual trigger (the pattern every phase uses):** append a `DemoTrigger` to `DEMO_TRIGGERS` with the route patterns where it should show and `surfaces`. No change to AppShell or the menu is needed: `DemoActionsMenu` appears automatically, with a count badge, on any route with at least one `bar` entry. Needed state beyond URL: publish it via a new `DemoContextKey` in `context.ts` and a `useDemoTriggerContext` call in the screen. Mutations must go through a store action (as `DEMO_TRIGGER_ACTOR` / `OFFICE_SIMULATION_ACTOR` from `store/demoActors.ts`) so they are audited. Add a `screen` label so the Control Panel index lists it. Registry tests (demoTriggers.test.ts) enforce unique kebab-case ids, no en/em dashes, no Run-payables duplicate, and that each bar entry's `indexPath` lands where the entry shows. If a different surface is wanted (a button directly in the bar rather than inside the "Demo actions" popover), the slot is the right-cluster div in `AppShell.tsx`; the popover is one pill, not one button per action.

## 4. DemoActionsMenu (`src/shell/DemoActionsMenu.tsx`)
Rendered from `useDemoTriggerRows('bar')`; returns `null` when no rows. Pill: FlaskConical icon, "Demo actions" label (hidden under 1280px), amber `CountBadge`; `data-shot="demo-actions"`, aria-label "Demo actions for this screen, N". Popover (360px, `PopoverPanel`, stays open after a run, closes on pathname change/Esc/outside click): `DemoBadge "Demo trigger"`, "On this screen", then per row (`data-shot="demo-action-<id>"`): label, badge, teal Run button (disabled with `reason` shown underneath), description, `<select>` if `choices` exist, and a `role=status` result line (ok = grey, not ok = warning tint). The PWA never renders this file (`pwaPurity.test.ts` lists it as excluded).

## 5. Registry: every trigger (`registry.ts`; store call in brackets; "bar"/"pwa" = surfaces)
All run against the singleton store; outcome message returned as `{ok,message}`.

**Admin · Billing monitor** (`/admin/billing`, bar):
- `billing-failure` "Trigger billing failure" [`stageBillingFailure` store/demoStaging.ts: arms hand-off fault for Losa Tuilagi's Booking and authorises Ropata's Thu 16 Jul List; disabled `BILLING_FAILURE_ALREADY`]
- `arm-handoff-fault` "Arm handoff failure" [`armHandoffFault` store/demoSettingsActions.ts; sets `settings.failNextHandoff`; disabled when armed]
- `run-reconciliation-poll` [`runReconciliationPoll`] also on `/demo/xero*`; `run-archive-job` [`runArchiveJob`] also on `/demo/xero*`.
  (Run payables is deliberately NOT a trigger; it is the monitor's own product button.)

**Admin · Audit** `/admin/audit` bar: `simulate-sign-in` [`simulateSignInAttempts` store/authDemoActions.ts: five audited account rows].

**Admin · Booking detail** `/admin/day/:dateISO/bookings/:bookingId` bar: `hospital-description-arrives` [`replaceProcedureText` via procedureTextTriggers; choices from `hospitalDescriptionChoices`; AR-35 wording].

**Admin · Review and Booking detail** `/admin/review/:listId`, admin booking, bar: `stage-post-op` [`submitList` + `authoriseList` on Dr Sharma Tue 14 Jul AM, `POST_OP_ORIGINAL_LIST_ID`].

**Admin · Integrations** `/admin/integrations` bar: `ingest-pdf-row` [`ingestPdfRow` for surgeon PDF row R2 onto Souter Mon 27 Jul AM; dedupe by NHI]; the `integrations.tab` context is published but only used by `when`/disabled logic.

**Admin · Invoice** `/admin/invoices/:invoiceId` (+ `/demo/xero/invoices/:accRecId` for payments) bar: `regenerate-invoice` [`regenerateInvoiceFromLock` store/locks.ts, read-only, result to `memory.regenerated`]; `payment-full`, `payment-half` [`sendPaymentWebhook` -> `receivePayment`, key `WEBHOOK-<accRecId>-<n>`]; `payment-replay` [replays `memory.lastWebhook`, idempotent].

**Admin · AA fee invoices** `/admin/billing/aa-fees` bar: `run-scheduled-fee-run` [`runMonthlyFeeInvoices`, month from published `aaFees.month`, actor `AA_FEE_RUN_ACTOR`]; `seed-month-of-bctis` [`seedMonthOfBctis` for Rutherford, `BCTI_SEED_TARGET`]. Xero AA fee pair `/demo/xero/invoices/:accRecId` bar: `record-fee-payment` [`recordAaFeePayment` via `recordFeePaymentFor`].

**Admin · Day and Conflicts** bar: `simulate-sickness` [`simulateSickness` store/demoSimulations.ts; choices per List and route "to the office" or "to Dr X"] on `/admin/day/:dateISO`, `/admin/conflicts`; `add-draft-list-for-day` [`addDraftListForDay` store/draftListDemo.ts; Day only]; `colleague-hands-booking-to-souter` [`stageColleagueBookingMove`, Day only]; `colleague-moves-list-to-office` ("One move" or "busy morning", `stageColleagueMoveToOffice`/`stageBusyMorning`) on Day and Notifications; `simulate-incoming-request` [`simulateIncomingDraftListRequest`] on `/admin/draft-lists`; `ask-colleague-make-available` [`makeSessionAvailableAsColleague` store/listMoveDemo.ts; badge colleague-stand-in] routes Day, Draft lists, Conflicts, `when` an Assign/Reassign picker has published `adminPicker.listId`; also rendered inline (section 3).

**Admin · Master data** `/admin/masters` bar: `demo-backdated-range` [`addBackdatedRangeDemo` store/demoBackdatedRange.ts; disabled once added]; `stage-recurring-clash` [`stageRecurringClash`; `adminMasters.view` gates recurring view].

**Warning samples** `/admin/day/:dateISO`, admin booking, `/mobile/lists/:listId/bookings/:bookingId`, bar+pwa: `raise-sample-warnings` [`raiseDaySamples`/`raiseSamplesOn`, store/warningSamples.ts], `clear-sample-warnings` [`clearAllSamples`/`clearSamplesFor`].

**Hospital feed** bar+pwa, badge future-scope: `photo-capture-future` (`/mobile/lists/:listId`; writes `memory.requestPhotoCapture`, no domain write); `fire-hospital-message` [`processMessage` store/integrationActions.ts; choices = all `CANNED_MESSAGES` incl. MSG-CPH-2001 dead-letter; default is the Booking's own message on Booking routes or the Integrations simulator's published selection; routes: mobile lists layers, web and admin booking, `/admin/integrations`, `/demo/integrations`]; `replay-hospital-message` [replays `memory.lastMessageId`, dedupe]; `load-multi-procedure-booking` [`stageMultiProcedureBooking`, store/demoMultiProcedure.ts; mobile lists deeper layers, `/web/lists/:listId`, web and admin booking]; `feed-changes-primary` [`feedChangesPrimary`; booking routes]. Note: `fire-hospital-message` has `choices` driven by `CANNED_MESSAGES` in `domain/integrations`.

**PWA only stand-ins** (surface 'pwa', badges office-stand-in unless noted): `office-authorises-list` (`/mobile/lists/:listId` and booking; `authoriseAsSimulatedOffice` store/officeStandIn.ts); `office-assigns-next-free`, `office-adds-out-of-hours-list`, `office-assigns-draft-list` (`/mobile/lists`; `assignNextFreeSlotAsSimulatedOffice`, `addOutOfHoursListAsSimulatedOffice`, `assignDraftListAsSimulatedOffice`); `office-resolves-alert` (`officeResolvesAlert`); `office-approves-contract-change` (`approveContractChangeAsSimulatedOffice`); `office-clears-warning` (`clearWarning`); `office-sets-booking-contract` (`setProcedureContract` with `contractCandidatesFor`); `colleague-moves-list-to-me` (`/mobile/availability`; `stageColleagueMoveToPersona`), `colleague-moves-booking-to-me` (`/mobile/lists*`; `stageColleagueBookingMove`) both badge colleague-stand-in; `pwa-payment-full`, `pwa-payment-half` (`/mobile/balances`; choices = Souter's open ACCRECs; `sendPaymentWebhook`).

Surface totals: bar-only, pwa-only and both are as above; `DemoControlPanel` lists pwa-only entries as "Shown in the installed PWA" with no link.

**Screen-contextual status:** yes for all, matched by route pattern. Screens that have NO bar triggers today: `/web/*` except booking detail and `lists/:listId` (multi-procedure), `/admin/review` queue (only `/admin/review/:listId` stage-post-op), `/admin/billing/aa-fees/settings`, `/admin/invoices` index, masters sub-pages, web availability and accounts, all of `/mobile/more`. Any web-app screen has no demo-actions pill until an entry matches.

## 6. Demo surfaces (`src/apps/demo/`)
All wrapped in `DemoSurface.tsx` (title, subtitle, "demo simulation" `DemoBadge`, optional Future-scope badge and line, `data-shot="demo-surface-future-scope"`).

**DemoControlPanel** (`/demo/control`, `DemoControlPanel.tsx`) in three groups:
1. Clock & reset: shows clock; the six `demoClockShortcuts` buttons; "Reset demo data" with inline confirm -> `resetDemo`.
2. Scenario jumps S1-S5 (`SCENARIOS`, Jump -> "Confirm jump" -> `run()`; `data-shot=scenario-s1..s5`): every one calls `resetDemo` first and then returns a guidance message plus `nav` buttons (`navigate`). S1: reset only, nav to Mobile and Integrations (notes HL7/FHIR as Future scope). S2: reset, nav Admin. S3: reset and verifies Souter's Mon 20 Jul AM/PM Lists (`SEED_LIST_IDS.souterMon20Am/Pm`) are SUBMITTED, nav Admin. S4: reset, nav Mobile and `/admin/billing`. S5: reset then stages audit via `claimModifier` (AS3 on David Chen's overridden-time Booking, `SEED_MARKERS.overriddenTimeUnitsBooking`), `editBooking` (office note), `removeModifier`, then `authoriseList` for Whitaker Fri 17 Jul (`SEED_LIST_IDS.whitakerFri17`); nav Admin and Xero.
3. "Demo actions by screen": `DemoActionsIndex` groups `DEMO_TRIGGERS` by `screen`, shows label, badge, description, "Shows in: Harness bar / Installed PWA", and an "Open screen" button to `trigger.indexPath(state)` (disabled with `indexEmptyReason` when null). Nothing is fired from the panel.

**DemoXero** (`/demo/xero[/invoices[/:accRecId]]`, 935 lines, view model `xeroPairView.ts` `xeroInvoicePairViews`): tabs (Contacts, Invoices) via `TabLink`. Callouts "No personal information in Xero" and "Duplicate-invoice-number-prevention", contact archiving and volume story (`settings.volumeStory`). `ContactsTable`, `InvoicesTable`, `PairDetail` (ACCREC card, ACCPAY card, buyer-created tax invoice, money-flow card, engine link) and `FeePairDetail` for AA fee invoices (`kind:'aaFee'`, no ACCPAY, with `recordPayment` -> `recordFeePaymentFor`). Interactive: "Settle invoice" `settleInvoice` calls `receivePayment` then `disbursePayable(useAppStore, OFFICE_ACTOR, accPay.id)` (L236-255); disabled if no ACCPAY or fully settled. Reads `xero`, `billing`, `schedule`, `masters`, `settings`. Per-pair "Fire payment" triggers are in the bar menu (`payment-full/half/replay`).

**DemoIntegrations** (`/demo/integrations`): feed picker (STG/CPH/SX via `FEED`), message library (`CANNED_MESSAGES` filtered by feed), source pane (HL7 `Hl7View` or FHIR JSON through `extractViaMapping`/`extractFromFhir`/`toFhirBundle`), effect pane (message-log row, resulting Booking), feed mapping reference, "Target state: FHIR-first via the Digital Services Hub" callout. Actions: Replay (`processMessage(useAppStore, id)`), "Live" drip (1 message/sec via `setInterval` + `processMessage`), local Reset confirm (`resetDemo` and local state). Publishes `integrationsSim.selectedMessageId`.

**DemoData** (`/demo/data`): entity counts, persisted payload size and `persistStatus()`, today's sessions (`slotViewsForDate`, canvas invariant check "two sessions per active anaesthetist"), seeded scenario finder (`SEED_MARKERS`) loading audit trail, per-booking audit viewer, lifecycle state counts and filter, and a **Guard console**: persona (souter, kirsty, integration) x action (`completeBooking`, `cancelBooking`, `editBooking`, `submitList`, `authoriseList`) x target, "Attempt" runs the real store action and shows allowed/refused with code. This is the one place a demo surface mutates domain state outside a trigger.

**Component catalogue** (`/demo/catalogue/:app`; `catalogue/{Admin,Web,Mobile}Catalogue.tsx`, `CatalogueKit.tsx`, per-app example files, tests per app): demo-only inventory of every hand-built UI component with source path, `usedIn`, `replaceWith` library, notes, mounting real components with fixtures (`admin/adminData.ts`, `web/fixtures.ts`, `mobile/persona.ts`). Presentation only; CLAUDE.md requires keeping its rows in step with components.

## 7. PhoneFrame and Gradient Lab (`src/shell/`)
- `PhoneFrame.tsx` (host of the mobile app in the framed build): simulated device with fake status bar (`StatusBar`, time = `useClockTimeLabel()`), dynamic island, home indicator, auto-fit scale or persisted zoom (`SCALE_STORAGE_KEY` localStorage; `ZoomControl`: Zoom in/out, Fit), atmosphere from `useMobileGradient()`; renders `GradientLab` outside the frame when enabled. No demo triggers here (the framed build uses the harness bar).
- `gradientLab/`: `GradientLab.tsx` (tuning panel: intensity, base colour, radial fields, presets, copy CSS), `useGradientLab.ts` (state; key `aa-gradient-lab`), `AtmosphereLayer.tsx`, gated by `theme/gradientLabGate.ts` `GRADIENT_LAB_ENABLED = true`. Decorative only.

## 8. PWA build (`pwa/`, `src/pwa/`, `vite.pwa.config.ts`)
- `pwa/index.html` (manifest/theme/apple meta, splash) and `pwa/main.tsx`: same store wiring as `src/main.tsx` (`wireBillingRun`, `wireReconciliationPoll`, `wireArchiveJob`, `wireIntegrationRetry`) PLUS `wireOfficeSimulation`; side-effect `import installPrompt`; `markBootStart`; routes only `/mobile/*` (same four child routes as router.tsx) with `<MobileApp host={MobileViewport} moreExtra={<PwaDemoPanel/>}/>`; `*` -> `/mobile/lists`. No `AppShell`, no web/admin/demo surfaces (bundle purity enforced by `pwaPurity.test.ts`).
- `MobileViewport.tsx`: host replacing PhoneFrame: safe-area insets (`--aa-inset-*`), atmosphere, `--aa-viewport-shortfall` (iOS viewport correction, `viewportMetrics.ts`), renders `<UpdatePrompt/>` and `<PwaDemoActions/>` (L168-171).
- **`PwaDemoActions.tsx`** (the PWA's equivalent of the Demo actions menu): `useDemoTriggerRows('pwa')`; renders nothing if no row; absolute amber "Demo" chip (`data-shot="pwa-demo-actions"`, zIndex 55, bottom offset clears tab bar and booking dock), hidden while any sheet is open (`useAnySheetOpen`); tap opens a `BottomSheet` with each row (`data-shot="pwa-demo-action-<id>"`): label, badge, description, choices as `role=radiogroup` tappable rows, Run (48px), reason, result. Shows "Office auto" marker when the office simulation toggle is on. Not on More (no matching routes).
- **`PwaDemoPanel.tsx`** (More tab, via `moreExtra`): cards in order: `InstallCoach`, Demo clock (time, date, same `demoClockShortcuts` grid), Office simulation ("Play the office" toggle, `setOfficeSimulationEnabled`, badge "Simulated office"), Demo data (Reset -> confirm bottom sheet -> `resetDemo`), Build (build id, boot ms via `bootMs`, "Check for updates" via `checkForUpdate`, service worker status, clear install-coach dismissal), Viewport (metrics via `readViewportMetrics`, copy to clipboard).
- `officeSimulation.ts`: `wireOfficeSimulation(api)` subscribes to ACTIVE -> SUBMITTED transitions; after `OFFICE_SIM_DELAY_MS` = 4s authorises as `OFFICE_SIMULATION_ACTOR` (`authoriseAsSimulatedOffice`), default OFF, localStorage `aa-office-simulation`. Explicitly not the RFP flow.
- `installPrompt.ts` (captures `beforeinstallprompt`), `InstallCoach.tsx`, `UpdatePrompt.tsx` + `swRegistration.ts` (vite-plugin-pwa), `bootMetrics.ts`, `BootMark.tsx`: device plumbing with no domain impact.

## 9. Stubs, hardcoded, visual-only
- Personas are two hardcoded constants; no real login or persona switch. Persona chip is display only.
- App switcher always lands on the app root (does not preserve screen). Selecting an app does not carry a date or entity.
- Hardcoded demo anchors in the registry: `indexPath` values like `/admin/day/2026-07-21`, `/admin/day/2026-07-22`, `/admin/day/2026-07-21/bookings/BK0006`; seed-bound triggers (Losa Tuilagi, Dr Sharma Tue 14 Jul AM, Souter Mon 27 Jul AM, Rutherford Tue 21 Jul, Face lift on Merivale's contract at $3,300.00) depend on seed ids in `domain/seed` and break silently if the seed changes. S1 procedure day `2026-07-28` is hardcoded in `demoClockShortcuts.ts`.
- Control Panel scenarios S1-S5 are guidance text plus reset, not scripted flows (S5 stages audit rows). The S1 note says the in-scope hospital-download match path comes "in a later build".
- `fire-hospital-message` and `photo-capture-future` are badged Future scope (HL7 v2/FHIR and photo capture are out of first-release scope); photo trigger only opens a UI sheet ("simulated photo").
- `feed-changes-primary` is "applied directly until the matching screen exists (Phase 33)".
- Trigger memory, published context and per-row results are in-memory only; a reload loses "Replay last" state.
- Xero, Integrations and Data inspector are simulators reading store state; no real integration. `DemoIntegrations` live drip and `DemoXero` settle are demo-only.
- Gradient Lab is a temporary feature-flagged tuning tool.

## 10. Tests pinning this area
`shell/DemoActionsMenu.test.tsx`, `shell/DemoResetButton.test.tsx`, `shared/demoTriggers/demoTriggers.test.ts` (784 lines: registry shape, route scoping per trigger, bodies), `context.test.tsx`, `procedureTextTriggers.test.ts`, `apps/demo/DemoXero.test.tsx`, `xeroPairView.test.ts`, catalogue tests (Admin/Web/Mobile), `pwa/pwaPurity.test.ts` (bundle closure; names which shell files must stay out), `officeSimulation.test.ts`, `installPrompt.test.ts`, `viewportMetrics.test.ts`, `shell/gradientLab/gradientLabPurity.test.ts`. Store-side trigger bodies: `store/demoSimulations.test.ts`, `draftListDemo.test.ts`, `listMoveDemo.test.ts`, `officeStandIn.test.ts`, `demoMultiProcedure.test.ts`, `demoScenarios.test.ts`.
