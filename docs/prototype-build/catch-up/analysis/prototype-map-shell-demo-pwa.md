# Prototype map: shell, demo surfaces, PWA, router

Scope: `aa-prototype/src/shell`, `src/apps/demo`, `src/pwa`, `aa-prototype/pwa`, `src/router.tsx`, `src/App.tsx` (plus the two entry files `src/main.tsx` and `pwa/main.tsx` that wire them). All paths below are relative to `aa-prototype/` unless absolute. Written from the code, not the build docs.

**Orientation.** `src/App.tsx` (5 lines) renders `AppRouter` (`src/router.tsx`). A single layout route mounts `AppShell` (`src/shell/AppShell.tsx`): a 48px dark "harness bar" (product name, "Prototype" pill, persona chip, app switcher, demo clock menu, Reset button) above an `<Outlet/>`. The outlet shows one of three product apps (`/mobile`, `/web`, `/admin`; their internal routes are mapped by other files) or one of four demo-only "surfaces" (`/demo/control`, `/demo/xero`, `/demo/integrations`, `/demo/data`). The URL is the source of truth for the current app; the shell mirrors it into `store.shell.currentApp`. There is NO screen-contextual demo control anywhere in the harness bar today: the bar is global and static; every scenario trigger lives on the `/demo/control` page (or on other demo surfaces). The PWA (`pwa/main.tsx`) is a separate entry that mounts only the Mobile App with no AppShell; its presenter controls are a `PwaDemoPanel` injected into the More tab. All state is the zustand store in `src/store`; nothing here does `fetch`.

## Contents
1. Router and URL map
2. AppShell / harness bar (extension points)
3. App switcher and app registry
4. Global demo controls in the bar (clock, reset)
5. Demo surfaces: Control Panel (every trigger), Xero sim, Integrations sim, Data Inspector
6. Phone frame, Gradient Lab
7. PWA target (entry, panel, office simulation, other modules)
8. Where demo affordances exist outside this area
9. Extension points for screen-contextual demo triggers
10. Stubbed / hardcoded / visual-only

---

## 1. Router and URL map (`src/router.tsx`)

`BrowserRouter` with v7 future flags. One parent `<Route element={<AppShell/>}>` holds everything. Index and `*` render `RootRedirect` (`router.tsx:43-46`), which navigates to `APP_CONFIG[store.shell.currentApp].path` (default `mobile`, `src/store/appStore.ts:169`).

| Path | Component (file) | Notes |
|---|---|---|
| `/web` (layout `WebApp`) | index `WebDashboardRoute`; `lists` `WebListsRoute`; `lists/:listId` `WebListDetailRoute`; `lists/:listId/cards/:cardId` `WebCardDetailRoute`; `availability` `WebAvailabilityRoute`; `accounts` -> redirect `accounts/overdue`; `accounts/:subTab` `WebAccountsRoute`; `*` -> `/web` | components in `src/apps/web/routes` (other map) |
| `/admin` (layout `AdminApp`) | index `AdminIndexRedirect`; `day/:dateISO` `AdminDayRoute`; `day/:dateISO/cards/:cardId` `AdminCardDetailRoute`; `review` `AdminReviewQueueRoute`; `review/:listId` `AdminReviewRoute`; `invoices` and `invoices/:invoiceId` both `AdminInvoicesRoute`; `billing` `AdminBillingRoute`; `integrations` `AdminIntegrationsRoute`; `masters` `AdminMastersRoute`; `audit` `AdminAuditRoute`; `*` -> `/admin` | `src/apps/admin/routes` |
| `/mobile` (layout `MobileApp host={PhoneFrame}`) | index -> `lists`; `lists/*` `MobileListsRoute` (single splat so the slide stack keeps layers mounted); `availability` `MobileAvailabilityRoute`; `balances` `MobileBalancesRoute`; `more` `MobileMoreRoute`; `*` -> `/mobile` | `src/apps/mobile/routes.tsx` |
| `/demo/control` | `DemoControlPanel` | section 5.1 |
| `/demo/xero`, `/demo/xero/invoices`, `/demo/xero/invoices/:accRecId` | `DemoXero` (same component, three URLs) | 5.2 |
| `/demo/integrations` | `DemoIntegrations` | 5.3 |
| `/demo/data` | `DemoData` | 5.4 |

Conventions: path segments = navigation, query params = view prefs (`?week=`, `?sort=`, `?invoice=`); overlays are local state, not URL. `src/shell/RequireEntity.tsx`: `exists ? children : <Navigate to=".."/>` (route-relative) so stale bookmarked IDs bounce to the collection. `src/shell/routeParams.ts` `isISODate()` validates `:dateISO` / `?week=`.

`src/main.tsx` (framed prototype entry) wires four store jobs once for the singleton store: `wireBillingRun`, `wireReconciliationPoll`, `wireArchiveJob`, `wireIntegrationRetry` (order matters: billing run consumes `listAuthorised`; poll runs before archive on `dayAdvanced`). It does NOT wire `wireOfficeSimulation`.

## 2. AppShell / harness bar (`src/shell/AppShell.tsx`, 137 lines)

- `useLocation` + `appIdForPath(pathname)` (`appConfig.ts:104`) give `routeApp`; effect at `:26-28` calls `store.setCurrentApp(routeApp)` when it differs (persisted in the store `shell` slice).
- Persona chip: `APP_CONFIG[activeApp].persona` (initials avatar, name, role). Display only, not a login.
- Layout: outer `div` `height:100dvh`, flex column; `<header>` height 48, `neutral.ink` bg; `<main>` flex:1, `overflow:auto`, holds `<Outlet/>`.
- Header left group (`:59-101`): "AA Booking & Billing" text, "Prototype" pill, and a "Requirements ↗" link shown only when `import.meta.env.DEV && VITE_REQUIREMENTS_URL` (set by root `npm run dev`; never in a build).
- Header right group (`:103-131`), in this order: persona chip, `<AppSwitcher/>`, `<DemoClockMenu/>`, `<DemoResetButton/>`. Each is a 34px-high pill button (`border 1px rgba(255,255,255,.22)`, `bg rgba(255,255,255,.08)`, white text 13px/600) with a dropdown/popover anchored `top: calc(100% + 8px); right:0; zIndex 120`.
- `handleSelect(id)`: `setCurrentApp(id); navigate(APP_CONFIG[id].path)`.
- The bar receives NO props from the routed app and reads NO screen context other than `location.pathname`. There is no slot, context, portal or registry through which a screen can add controls.

## 3. App switcher and registry

`src/shell/appConfig.ts`: `AppId = mobile | web | admin | demo-xero | demo-integrations | demo-control | demo-data`. `PERSONAS`: `souter` (Dr Melanie Souter, MS, Anaesthetist, anaesthetistId `34821`), `kirsty` (Kirsty W., KW, Office). `APP_CONFIG[id] = {id,label,path,persona,group:'apps'|'demo'}`: mobile/web -> Souter; admin and all four demo surfaces -> Kirsty. Labels: "Anaesthetist Mobile App", "Anaesthetist Web App", "Admin Web App", "Demo: Billing Monitor & Xero", "Demo: Integrations", "Demo: Control Panel", "Demo: Data Inspector". `APP_ORDER` is the iteration order; `appIdForPath` matches `path` or `path + '/'` prefix.

`src/shell/AppSwitcher.tsx`: trigger button shows active label + chevron; menu (`role=menu`, 300px, click-away backdrop) lists group "Apps" (3), divider, "Demo surfaces" (4, amber heading), each row with a lucide icon (Smartphone, Monitor, Building2, Receipt, Cable, SlidersHorizontal, Database) and a check on the active one. `choose(id)` closes and calls `onSelect` only if different. Adding a new top-level surface = add to `AppId`, `APP_CONFIG`, `APP_ORDER`, `ICONS` (AppSwitcher), and a router entry.

## 4. Global demo controls in the bar

**Demo clock menu** (`src/shell/DemoClockMenu.tsx`): trigger shows clock icon + mono time label (`useClockTimeLabel()`); popover (344px) shows `EEEE d MMMM yyyy · time` (`useToday()`), a 2-col grid of shortcut buttons from `demoClockShortcuts(useAppStore, todayISO)`, and the note "Updates apply immediately and keep this screen open." Esc/outside-click close. Route and screen state are untouched.

**Shortcut definitions** (single source, `src/shared/demoClockShortcuts.ts`; also used by the Control Panel and the PWA panel): `+15 min` -> `advanceClockMinutes(api,15)`; `+1 hour` -> `advanceClockMinutes(60)`; `Next day` -> `advanceClockDays(1)`; `Next morning` -> `advanceClockToNextMorning`; `+7 days` -> `advanceClockDays(7)`; `Procedure day · 28 Jul` -> `advanceClockToDate('2026-07-28')` (const `S1_PROCEDURE_DAY`), disabled when `todayISO >= 2026-07-28` (clock is forward-only). All from `src/store/clockActions.ts`; `applyClock` (`:66-71`) sets `clock`, and on a date change calls `rollCanvasForward` (generates Lists for new far-edge days from Permanent Lists via `generateListsForDates`, audited as `canvas.rollForward`) and `emitAppEvent({type:'dayAdvanced'})` which triggers the reconciliation poll then the archive job (wired in `main.tsx`).

**Reset button** (`src/shell/DemoResetButton.tsx`): "Reset" pill opens a confirm dialog ("Reset all demo data?", restores pristine seed and clock to Tue 21 July 2026 08:00, "current app and display choices are preserved"). Confirm -> `resetDemo(useAppStore)` (`clockActions.ts:110` -> `resetDomainState`, `src/store/mutate.ts:218`, which rebuilds seed and replaces `clock, masters, schedule, audit, settings, dayNotes, counters, billing, xero, integrations`; `shell` is kept). Persisted key `aa-demo`, `PERSIST_VERSION = 13` (`src/store/appStore.ts:95,130`).

## 5. Demo surfaces (`src/apps/demo`)

All wrap content in `DemoSurface` (`DemoSurface.tsx`): `DemoBadge` ("demo simulation", from `src/shared/DemoBadge.tsx`), h1 title, subtitle, max-width 1080 (Xero 1440). All are Kirsty-persona pages in the shell; none is product UI.

### 5.1 Control Panel `/demo/control` (`DemoControlPanel.tsx`, 830 lines) - the presenter cockpit

Constants: `OFFICE` actor `{who:'Kirsty W.',role:'office',source:'office'}`; `SOUTER` actor `{Dr Melanie Souter, anaesthetist, anaesthetistId ANAE.souter}` (`:38-39`). Helper components `ControlCard`, `SectionHeading`, `actionButtonStyle`/`primaryButtonStyle`. Every trigger card shows a `DemoBadge` ("Demo trigger" or "Resets data") and an inline result message state. Sections and triggers, in render order:

| Section / card | Control(s) | What it does (store call) |
|---|---|---|
| Clock & reset: Demo clock | same 6 buttons as the bar (`demoClockShortcuts`) | clock actions above |
| Clock & reset: Seed data | "Reset demo data" -> "Confirm reset"/Cancel | `resetDemo` |
| Scenario jumps S1-S5 (`SCENARIOS` `:360`, `ScenarioJumps` `:458`) | per-scenario "Jump" -> "Confirm jump"/Cancel; after run: message + `nav` buttons (`navigate(path)`) | each `run()` starts with `resetDemo` (see below) |
| Booking & integration events: `IntegrationTriggerCard` `:633` | select from `CANNED_MESSAGES` (`domain/integrations`), "Fire message", "Replay last (dedupe)" | `processMessage(useAppStore, id)`; outcome text (`res.value.outcome`, `duplicate`) |
| `PdfArrivalCard` `:693` | "Ingest PDF row" | takes `SURGEON_PDFS[0]` row `R2`, `ingestPdfRow(useAppStore, OFFICE, listIdForSlot(target anaesthetist,date,session), row)` -> creates/updates a Card on Souter Mon 27 Jul AM |
| Billing: "Trigger billing failure" `:155` | "Trigger failure" | `editContract(OFFICE, CONTRACT.cosAcc, {effectiveToISO:'2026-07-15'})`, `submitList` if DRAFT, `authoriseList(SEED_LIST_IDS.billingFailure)`; the wired billing run fails the COS card, its sibling invoices; guarded by `list.billedAtISO` ("Already triggered") |
| "Stage post-op scenario" `:179` | "Stage scenario" | Sharma Tue 14 Jul AM (`listIdForSlot(ANAE.sharma,'2026-07-14','AM')`): `submitList` if DRAFT then `authoriseList`, so the locked original can take "Add post-op event" (lands on her free Tue 21 PM session) |
| `PaymentReceivedCard` `:538` | select from `openAccRecs(state)`, toggle Full / Half (partial), "Record payment", "Replay last event" | `receivePayment(useAppStore,{accRecId,amount,idempotencyKey:'WEBHOOK-<id>-<n>',source:'webhook'})`; half = `roundToCents(remaining/2)`; replay reuses the key to show idempotency |
| `HandoffFaultCard` `:734` | "Arm handoff failure" (shows "Armed" from `settings.failNextHandoff`) | `armHandoffFault(useAppStore, OFFICE)`: next Xero handoff faults once |
| `AutomatedJobsCard` `:767` | "Run reconciliation poll", "Run archive job", "Run payables" | `runReconciliationPoll`, `runArchiveJob`, `runPayables(OFFICE)` |
| Static note | "Billing assumption" callout (partial intervals round up per started 15 min first 2h, then 10 min) | text only |

Scenario jump contents (`:360-455`), all `resetDemo` first:
- S1 Booking to theatre: reset only; nav buttons Mobile, Integrations. Message tells presenter to fire `MSG-STG-1001` (Sarah Mitchell arrives as 4th Card on Souter Tue 28 Jul).
- S2 Office day: reset only; nav Admin. Beats are narrated (phone-book Sharma Tue 21 PM Free List; reassign Rutherford's conflicted Wed 22 AM List to Sharma; authorise).
- S3 Money end-to-end: reset; checks `SEED_LIST_IDS.souterMon20Am` and `souterMon20Pm` are `SUBMITTED` (else `ok:false`); nav Admin.
- S4 Exceptions: reset only; nav Mobile. Message walks Souter Fri 24 AM Annette Riley pre-payment gate, stage post-op, billing failure, dead-letter, partial payment.
- S5 Compliance tour: reset; via `SEED_MARKERS.overriddenTimeUnitsCard` finds David Chen's card; stages 3 audited edits (`editProcedure` asaClass AS2 then AS1 as SOUTER, `editCard` notes as OFFICE); `authoriseList(SEED_LIST_IDS.whitakerFri17)` to raise invoices under the agreed-rate contract snapshot; nav Admin, Xero sim.

There are NO fields for choosing a specific screen/entity to act on: triggers act on hardcoded seeded IDs.

### 5.2 Xero simulation `/demo/xero[/invoices[/:accRecId]]` (`DemoXero.tsx` 761 lines, `xeroPairView.ts`)

Reads `xero, billing, schedule, masters, settings` slices. Two tabs via `TabLink`: Contacts (table, sorted by `contactNumber`, archived flag, type chip) and Invoices (table of ACCREC/ACCPAY pairs from `xeroInvoicePairViews`, click row -> `/demo/xero/invoices/:accRecId`; unknown id redirects to `/demo/xero/invoices`). Callouts: "NHI never resides in Xero" (App. 2 vs App. 1 unresolved), "Duplicate-invoice-number-prevention" (open item), "Contact archiving & volume" (uses `settings.volumeStory`: softLimit, invoicesPerYear, oneTimePct, activeContacts; narrated counters, not simulated records). `PairDetail` (`:222`): ACCREC card (invoice no., lines, subtotal/GST/total, amount received/balance), ACCPAY card (bill number `<invoice>-P`, gross, service fee rate/amount, total payable, authorised/disbursed/remaining), `MoneyFlowCard`, "Linked Billing Engine case" callout (case reference; NHI not stored on contact), incomplete-pair warning. **Demo action**: "Simulate payment and payout" / "Pay <anaesthetist> now" (`settleInvoice` `:236`): `receivePayment(... amount: balance, idempotencyKey 'DEMO-INVOICE-SETTLEMENT-<id>', source 'webhook')` then `disbursePayable(useAppStore, OFFICE, accPay.id)`; disabled when fully settled. Link "View in Dr Souter's account" -> `/web/accounts/payments?invoice=<no>` shown when received > 0 and anaesthetist is Souter. `xeroPairView.ts` is pure (joins xero+billing+schedule+masters; tested by `xeroPairView.test.ts`, `DemoXero.test.tsx`).

### 5.3 Integration simulator `/demo/integrations` (`DemoIntegrations.tsx`, 582 lines)

State: `feeds`, `messages` (integrations slice), cards, lists, patients, anaesthetists. Feed picker over `[FEED.stg, FEED.cph, FEED.sx]` (St George's HL7, Christchurch Public HL7, Southern Cross FHIR-native; `FEED_META`). Message library filtered by feed (`CANNED_MESSAGES`); per-row status pill from the message log (`processed | retrying | deadLetter | manualIntervention | duplicate`, `statusSentence` `:552`). Panes: HL7 feeds show 1 raw HL7 (segment-highlighted) -> 2 translated FHIR R4 bundle (`toFhirBundle(parsed, practitioner)` using the LIVE feed `fieldMapping`, so a mapping fix in Admin changes it) -> 3 schedule change (result Card, list, anaesthetist, from message-log `resultCardId`); FHIR feed shows 2 panes. Field-mapping chips (`k ← v`). Controls: "Replay" (selected) -> `processMessage(useAppStore, id)`; per-row replay; "Live drip" toggle (`setInterval` 1000ms processes the feed's messages in order then stops, `:57-74`); "Reset" (confirm) -> `resetDemo` + local state reset. Callout: FHIR-first, Digital Services Hub, NHI FHIR lookup, Keycloak "referenced, not implemented".

### 5.4 Data inspector `/demo/data` (`DemoData.tsx`, 641 lines)

Subscribes to the whole store. Panels: demo clock + entity counts (`entityCounts`) + persisted payload size/limit (`persistedBytes`, `persistStatus`, `STORAGE_BUDGET_BYTES`); "Today's Lists" table (click row -> audit); "Seeded scenario finder" (`SEED_MARKERS` select, loads audit trail); "Audit trail" (pick a Card, append-only history: At, Action, Who); "Lifecycle states" (filter DRAFT/SUBMITTED/AUTHORISED with counts); **Guard console** (`:170-186`): choose persona (souter / kirsty / integration feed), action (`completeCard`, `cancelCard` [reason "Guard console test cancellation"], `editCard` notes, `submitList`, `authoriseList`), a card or list, "Run" -> calls the real store action and prints the `Outcome` (refusal messages from lifecycle guards). This is the only place a guard failure can be provoked by hand.

## 6. Phone frame and Gradient Lab

`src/shell/PhoneFrame.tsx` (320 lines): the `host` for `MobileApp` in the framed prototype. 390x844 device (bezel, dynamic island, fake status bar showing `useClockTimeLabel()`, home indicator) centred on grey backdrop. Presenter zoom toolbar (`ZoomControl`: -, %, +, Fit; scale 0.5-1.3, persisted in `localStorage['aa-phone-scale']`). Sets CSS vars `--aa-inset-*` (fake 54/34), atmosphere vars from `useMobileGradient()`; renders `<GradientLab/>` when the controller is non-null. This is the only mobile emulation; content scrolls inside.

`src/shell/gradientLab/` (`GradientLab.tsx` 497, `useGradientLab.ts`, `AtmosphereLayer.tsx`, `index.ts`): temporary tuning panel for the mobile atmosphere gradient, docked in the grey gutter left of the phone (300px, narrow viewports collapse to a toggle), persisted under its own localStorage key; gated by `GRADIENT_LAB_ENABLED = true` (`src/theme/gradientLabGate.ts`). Purely decorative (`--aa-atmos-*` vars). `gradientLabPurity.test.ts` keeps it isolated. Not domain-relevant.

## 7. PWA target

Build: `vite.pwa.config.ts` -> `dist-pwa/`, entry `pwa/index.html` + `pwa/main.tsx`. Manifest `display: standalone`, `start_url: /mobile/lists`, `scope: /`, `registerType: 'prompt'`. URLs stay `/mobile/*`.

`pwa/main.tsx` (94 lines): `StrictMode` > `BrowserRouter` > routes `/mobile` (`MobileApp host={MobileViewport} moreExtra={<PwaDemoPanel/>}`) with the same four child routes as section 1 (lists/*, availability, balances, more), `*` -> `/mobile/lists`. Wires `wireBillingRun`, `wireReconciliationPoll`, `wireArchiveJob`, `wireIntegrationRetry` AND `wireOfficeSimulation`. Imports `installPrompt` for its side effect (early `beforeinstallprompt` capture), calls `markBootStart()`, renders `<BootMark/>` last. No `AppShell`: no harness bar, no web/admin/demo surfaces (enforced by `src/pwa/pwaPurity.test.ts`, which walks the import graph from `pwa/main.tsx`).

Files in `src/pwa`:
- `MobileViewport.tsx`: host replacing PhoneFrame; safe-area vars from `env(safe-area-inset-*)`, atmosphere via `useMobileGradient`, publishes `--aa-viewport-shortfall` (iOS standalone height correction) in `useLayoutEffect`; mounts `UpdatePrompt`.
- `PwaDemoPanel.tsx` (568 lines): rendered at the bottom of the More tab via `MobileApp`'s `moreExtra` -> `MoreScreen extra` (`src/apps/mobile/screens/MoreScreen.tsx:66-72`, which also shows a "Demo prototype" badge). Cards in order: `InstallCoach` (install instructions/Android prompt replay; iOS Add-to-Home-Screen text; hidden when standalone/installed/dismissed), **Demo clock** (big time + date, "Start now and Finish now stamp from this clock", same 6 `demoClockShortcuts` buttons), **Office simulation** (toggle "Play the office"), **Demo data** (Reset demo data -> `BottomSheet` confirm; confirm does `resilientLocalStorage.removeItem(PERSIST_KEY)` then `resetDemo`, then `clearInstallCoachDismissal()`), **Build** (`__BUILD_ID__`, `__BUILD_DATE__`, cold launch ms from `bootMetrics`, offline-ready via `serviceWorkerReady()`, saved-data size/paused state from `persistStatus`/`persistedBytes`, "Check for updates" -> `checkForUpdate()`), **Viewport** (diagnostics rows from `readViewportMetrics`, "Show shortfall band" probe toggle, "Copy diagnostics" to clipboard; documented as deletable). The PWA panel therefore has clock + reset + office sim only: NO scenario jumps, NO integration/payment/failure triggers.
- `officeSimulation.ts`: `wireOfficeSimulation(api)` subscribes to the store; on a live DRAFT -> SUBMITTED transition it arms a 4000 ms (`OFFICE_SIM_DELAY_MS`) timer, then (if enabled) calls `authoriseList` as actor `{who:'AA office (simulated)', role:'office', source:'office'}`; the wired billing run then invoices and hands off to Xero (fallback: `runBillingForList` + `handoffListCases`, guarded by `isListBilled`). Toggle in `localStorage['aa-office-simulation']`, default ON; when OFF the timer re-arms so switching ON later picks the List up. Seeded SUBMITTED Lists are untouched. PWA only; explicitly not the RFP flow (real flow = office reviews in the Admin Review queue). Tested by `officeSimulation.test.ts`.
- `UpdatePrompt.tsx` (`useRegisterSW`, 60 s poll, teal "reload" pill), `swRegistration.ts` (`rememberRegistration`, `serviceWorkerReady`, `checkForUpdate`), `installPrompt.ts` (captured install event, `promptInstall`, coach dismissal key), `InstallCoach.tsx`, `bootMetrics.ts`, `BootMark.tsx`, `viewportMetrics.ts` (+ tests). All device/plumbing; no domain behaviour.

## 8. Demo affordances outside this area (for completeness)

- `DemoBadge` (`src/shared/DemoBadge.tsx`) is used in: `apps/mobile/screens/MoreScreen.tsx:62` ("Demo prototype"), `shared/flows/ManualCardForm.tsx:152` ("NHI FHIR lookup · Digital Services Hub"), `shared/flows/PhotoCaptureFlow.tsx:35,77,85` ("Simulated capture · sample cards", "Simulated OCR · no real processing"), `apps/admin/screens/InvoiceDocument.tsx:264,271` ("Simulated portal handoff", "Simulated send"). These are in-screen simulated features, not harness triggers.
- Admin app hosts product homes of some jobs (payables run, archive job, billing monitor Resolve & retry) - see the admin map.
- Mobile "Start now"/"Finish now" stamp from the demo clock, so the clock menu affects capture timestamps.

## 9. Extension points for screen-contextual demo triggers

What exists to build on:
1. **Bar slot.** `AppShell.tsx:103-131` right-hand flex group (`gap:14`). New controls should be inserted between `<AppSwitcher/>` and `<DemoClockMenu/>` (or before the clock) as a new `DemoContextMenu`/button component. Styling template: copy `DemoResetButton`/`DemoClockMenu` (34px pill, popover with outside-click + Esc, `role=dialog`, `aria-expanded/controls`). Bar is `height:48`, `flex:none`; with several buttons on narrow widths it will overflow (no responsive handling today).
2. **Context source.** `AppShell` already has `useLocation()`; route matching can use `matchPath` against the patterns in section 1 (`/admin/day/:dateISO`, `/admin/review/:listId`, `/admin/invoices/:invoiceId`, `/web/accounts/:subTab`, `/mobile/lists/*`, etc.). Entity params (`listId`, `cardId`, `invoiceId`, `dateISO`) are in the URL, so a trigger can be scoped to the entity on screen without new plumbing. Mobile list/card routes are one splat; `listsStackLocation` (`src/apps/mobile`, uses `matchPath('/mobile/lists/:listId/cards/:cardId')`) already parses it. Screen state that is NOT in the URL (open sheets, drawers, selected tab in local state) is invisible to the shell; exposing it would need a small context/store slice (`shell` slice in `src/store/appStore.ts:72-84` currently holds only `currentApp`).
3. **Trigger implementation pattern.** Store actions are imported from `src/store` and called with `useAppStore` (the api) plus an `Actor` (`OFFICE`/`SOUTER` consts defined locally in `DemoControlPanel.tsx:38-39`; not exported - a shared actor module would avoid a third copy). Available demo-grade actions: `processMessage`, `ingestPdfRow`, `receivePayment`, `disbursePayable`, `armHandoffFault`, `runReconciliationPoll`, `runArchiveJob`, `runPayables`, `editContract`, `submitList`, `authoriseList`, `completeCard`, `cancelCard`, `editCard`, `editProcedure`, clock actions, `resetDemo`. Audit is automatic through `mutate()`. Any new trigger that changes seed shape needs `PERSIST_VERSION` bump (13 today).
4. **Registry idea consistent with existing code.** Model on `demoClockShortcuts` (`src/shared/demoClockShortcuts.ts`): a pure module returning `{id,label,icon,run,disabled}` given `(api, context)`, consumed by the bar menu, the Control Panel (for discoverability) and the PWA panel. That is the established shared-definition pattern and keeps the three surfaces in step.
5. **PWA equivalent.** The PWA has no bar; its slot is `PwaDemoPanel` (More tab). Contextual triggers there would need a card inside More or a per-screen affordance in the mobile app (the panel is bundled only into `dist-pwa` via `moreExtra`, and `pwaPurity.test.ts` forbids importing `shell` harness/demo/web/admin code into the closure, so any shared trigger module must live in `src/shared` or `src/store`, not `src/apps/demo` or `src/shell`).
6. **Badging rule.** Every demo-only control is badged via `DemoBadge` (convention 13) and demo surfaces never look like product UI; new bar buttons should be visually harness chrome (white-on-ink), not product styling. Crimson identity-only; teal is the only action colour in popovers.
7. **Tests.** Only `DemoResetButton.test.tsx`, `DemoXero.test.tsx`, `xeroPairView.test.ts` exist for this area; there are no tests for `DemoControlPanel` scenarios (Playwright specs under `aa-prototype/visual`/e2e may cover them via `data-shot` hooks such as `scenario-s1`, `scenario-confirm`, `control-payment-webhook`, `control-integration-message`, `control-scheduled-jobs`).

## 10. Stubbed / hardcoded / visual-only

- All Control Panel triggers use hardcoded seed IDs/dates (`SEED_LIST_IDS.*`, `ANAE.sharma` Tue 14 Jul, `SURGEON_PDFS[0]` row `R2`, COS ACC contract end date `2026-07-15`, `S1_PROCEDURE_DAY 2026-07-28`); they do nothing sensible after a clock advance or on a non-pristine seed (guarded by "not present in this seed" / "Already triggered" messages).
- S2 and S4 jumps only reset and narrate; no preparation beyond the seed. Scenario messages are hardcoded strings that mirror the run sheet (behaviour changes must be mirrored in `docs/demo-guide`).
- Persona chip and persona switching: display only; persona is derived from the app, no auth. Guard console personas are the only way to act as someone else.
- Requirements link in the bar: DEV-only.
- Xero sim, Integrations sim and Data Inspector are demo-only fakes; Xero "volume story" (soft limit, invoices per year, active contacts) is narrated counters, not real records; Keycloak, Digital Services Hub NHI lookup are referenced text only.
- Office simulation (PWA only) is a deliberate non-RFP shortcut (auto-authorise 4 s after submit).
- PhoneFrame status bar signal/wifi/battery icons and notch are decorative; safe-area insets are hardcoded 54/34 in the frame.
- `PwaDemoPanel` Viewport card is a temporary diagnostic ("safe to delete").
- Gradient Lab is a temporary flagged tool.
- Billing rounding "assumption" callout is static text (rule lives in `src/domain/billing/`).
