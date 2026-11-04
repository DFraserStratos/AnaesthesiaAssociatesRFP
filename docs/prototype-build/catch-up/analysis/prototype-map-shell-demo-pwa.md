# Prototype map: shell, demo surfaces, PWA, router

All paths are under `aa-prototype/` unless absolute. Line numbers are from the working tree at HEAD d4369476.

## Orientation

This area is the prototype's chrome, not product UI. `src/main.tsx` mounts `src/App.tsx` -> `src/router.tsx` (`AppRouter`), a single `BrowserRouter` with one layout route, `AppShell` (`src/shell/AppShell.tsx`). `AppShell` renders a 48px dark "harness bar" (product name, Prototype pill, persona chip, app switcher, **Demo actions menu**, **Demo clock menu**, **Reset button**) above an `<Outlet/>` holding one of three apps (`/mobile` in a simulated phone, `/web`, `/admin`) or four demo-only surfaces (`/demo/control|xero|integrations|data`). Screen-contextual demo triggers ALREADY EXIST (built in catch-up Phase 14): a registry `src/shared/demoTriggers/registry.ts` (`DEMO_TRIGGERS`, 33 entries) is matched against the current pathname by `matchPath`, and rendered by the bar's `DemoActionsMenu` (surface `'bar'`) and, in the installed PWA, by `PwaDemoActions` bottom sheet (surface `'pwa'`). The Control Panel page is now only clock, reset, S1 to S5 scenario jumps and an index of the registry; it fires no triggers itself. The PWA (`pwa/main.tsx`, entry for `dist-pwa/`) mounts only the Mobile app in `MobileViewport`, with no AppShell, so none of the bar, web, admin or demo pages ship there; its presenter controls are `PwaDemoPanel` (More tab) and `PwaDemoActions` (floating "Demo" chip).

## Table of contents
1. Router and route table
2. Shell: harness bar, app switcher, personas
3. Demo clock menu, Reset, Control Panel
4. Demo trigger registry (the screen-contextual mechanism) and full trigger list
5. Extension points for adding new screen-contextual triggers
6. Demo-only pages: Xero sim, Integrations sim, Data inspector
7. PWA target: entry, demo panel, demo sheet, office simulation, plumbing
8. Stubbed / hardcoded / visual-only notes

## 1. Router and route table (`src/router.tsx`, `src/App.tsx`)

`App.tsx` is just `<AppRouter/>`. `BrowserRouter` with v7 future flags. Every route is a child of `<Route element={<AppShell/>}>` (router.tsx:77). `RootRedirect` (index and `*`) navigates to `APP_CONFIG[store.shell.currentApp].path` (last-selected app, persisted).

| Path | Element | Notes |
|---|---|---|
| `/web` (index) | `WebApp` > `WebDashboardRoute` | `apps/web/routes` |
| `/web/lists`, `/web/lists/:listId`, `.../bookings/:bookingId`, `.../cards/:cardId` | `WebListsRoute`, `WebListDetailRoute`, `WebBookingDetailRoute`, `LegacyBookingRedirect` | |
| `/web/availability`, `/web/availability/mine` | `WebAvailabilityRoute`, `WebMyAvailabilityRoute` | |
| `/web/accounts` -> `overdue`; `/web/accounts/:subTab` | `WebAccountsRoute` | |
| `/admin` (index) | `AdminIndexRedirect` | |
| `/admin/day/:dateISO` (+ `bookings/:bookingId`, `cards/:cardId`) | `AdminDayRoute`, `AdminBookingDetailRoute`, `LegacyBookingRedirect` | |
| `/admin/conflicts`, `/admin/draft-lists`, `/admin/notifications` | `AdminConflictsRoute`, `AdminDraftListsRoute`, `AdminNotificationsRoute` | |
| `/admin/review`, `/admin/review/:listId` | `AdminReviewQueueRoute`, `AdminReviewRoute` | |
| `/admin/invoices`, `/admin/invoices/:invoiceId` | `AdminInvoicesRoute` (both) | |
| `/admin/billing`, `/admin/billing/aa-fees`, `/admin/billing/aa-fees/settings` | `AdminBillingRoute`, `AdminAaFeesRoute`, `AdminAaFeeSettingsRoute` | |
| `/admin/integrations` | `AdminIntegrationsRoute` | |
| `/admin/masters`, `.../surgeons/:surgeonId`, `.../anaesthetists/:anaesthetistId` | `AdminMastersRoute`, `AdminSurgeonProfileRoute`, `AdminAnaesthetistRecordRoute` | |
| `/admin/audit` | `AdminAuditRoute` | |
| `/mobile` -> `lists`; `lists/*`, `availability/*`, `balances`, `more` | `MobileApp host={PhoneFrame}` with `MobileListsRoute`, `MobileAvailabilityRoute`, `MobileBalancesRoute`, `MobileMoreRoute` | splat routes so slide stack keeps layers mounted; detail is path-driven (`/mobile/lists/:listId/bookings/:bookingId`) |
| `/demo/control` | `DemoControlPanel` | |
| `/demo/xero`, `/demo/xero/invoices`, `/demo/xero/invoices/:accRecId` | `DemoXero` (all three) | |
| `/demo/integrations` | `DemoIntegrations` | |
| `/demo/data` | `DemoData` | |
| `*` (web, admin, mobile subtrees and top level) | redirect to the app root / `RootRedirect` | |

Support: `src/shell/RequireEntity.tsx` (redirect `..` when entity id no longer exists, so stale bookmarks survive `PERSIST_VERSION` bumps; currently 26 at `src/store/appStore.ts:194`); `src/shell/routeParams.ts` `isISODate` (validates `:dateISO` / `?week=`). Convention: path = navigation, query = view prefs, overlays = local state (router.tsx header comment).

## 2. Shell (`src/shell/`)

- `appConfig.ts`: `AppId` = mobile | web | admin | demo-xero | demo-integrations | demo-control | demo-data. `PERSONAS`: `souter` (Dr Melanie Souter, Anaesthetist, id `34821`) and `kirsty` (Kirsty W., Office). `APP_CONFIG[id]` {label, path, persona, group 'apps'|'demo'}: mobile and web run as Souter; admin and all demo surfaces as Kirsty. `APP_ORDER`, `appIdForPath(pathname)`. Persona is fixed per app; there is NO persona/anaesthetist picker anywhere in the framed build (web+mobile always Dr Souter, admin always Kirsty).
- `AppShell.tsx`: derives the active app from the URL (`appIdForPath`), mirrors it into the store via `setCurrentApp` in an effect (:28), shows the persona avatar+name+role (:107-128), then in this order (:129-132) `AppSwitcher`, `DemoActionsMenu`, `DemoClockMenu`, `DemoResetButton`. Left side: "AA Booking & Billing", a "Prototype" pill, and (DEV only, when `VITE_REQUIREMENTS_URL` set) a "Requirements" link to the board (:70-86). Shell is `100dvh` flex column, header `flex:none; height:48`, `<main>` scrolls. `handleSelect` = `setCurrentApp(id)` + `navigate(path)`.
- `AppSwitcher.tsx`: dropdown (width 300) with group "Apps" (3 entries) and a "Demo surfaces" group (4). Icons: Smartphone, Monitor, Building2, Receipt, Cable, SlidersHorizontal, Database. Selecting routes to the app root path (not deep link). Not screen-contextual.
- `PhoneFrame.tsx`: the host for the mobile app in the framed build (390x844 iOS bezel, fake status bar showing the demo clock via `useClockTimeLabel`, zoom -/+/fit controls persisted in localStorage `SCALE_STORAGE_KEY`; renders `AtmosphereLayer` and, when `GRADIENT_LAB_ENABLED` (`theme/gradientLabGate.ts`, currently `true`), the temporary `GradientLab` tuning panel beside the phone (:317). Gradient lab files: `shell/gradientLab/*`.
- Persona / role / actor for audited writes: not in shell; see `src/store/demoActors.ts` (`OFFICE_ACTOR` Kirsty, `SOUTER_ACTOR`, `OFFICE_SIMULATION_ACTOR` "AA office (simulated)", `DEMO_TRIGGER_ACTOR` "Demo actions" source 'demo', `anaesthetistActor()`).

## 3. Demo clock, Reset, Control Panel

**`DemoClockMenu.tsx`** (bar; always shown): pill with CalendarClock icon + `useClockTimeLabel()`; popover shows "<Weekday d Month yyyy> · HH:MM" and a 2-column grid of buttons from `demoClockShortcuts(useAppStore, todayISO)` (`src/shared/demoClockShortcuts.ts`): `+15 min`, `+1 hour`, `Next day`, `Next morning` (08:00 next day), `+7 days`, `Procedure day · 28 Jul` (full width; disabled when today >= `S1_PROCEDURE_DAY` 2026-07-28). They call `advanceClockMinutes|Days|ToNextMorning|ToDate` (`src/store/clockActions.ts:78-110`). `applyClock` sets `clock`, and on a day change rolls the canvas forward (`rollCanvasForward`: new AM+PM free sessions per active anaesthetist, calendar/recurring painted) and emits `dayAdvanced` (consumed by wired `reconciliation poll`, `archive job`). Clock is forward-only. Leaves route and screen state alone. The same shortcuts appear on Control Panel (Clock card) and the PWA More tab (`DemoClockCard`).

**`DemoResetButton.tsx`** (bar; always): "Reset" pill, inline confirm popover ("Reset all demo data?") with Confirm/Cancel; `resetDemo(useAppStore)` (`clockActions.ts:113` -> `resetDomainState`): restores pristine seed and clock (Tue 21 Jul 2026 08:00), preserves the `shell` slice (current app). Same control also on Control Panel and PWA More.

**`apps/demo/DemoControlPanel.tsx`** (`/demo/control`, in `DemoSurface` chrome with Demo-simulation badge). Sections:
1. Clock and reset: live clock card, same shortcut buttons; "Reset demo data" with confirm.
2. `ScenarioJumps` (:~200-400): S1..S5, each "Jump" -> "Confirm jump" (`data-shot=scenario-s1..s5`, `scenario-confirm`), which calls `resetDemo` then stages, shows a green/amber result with nav buttons. S1 Booking to theatre (reset only; nav Mobile, Integrations; notes HL7 is Future scope). S2 Office day (reset only; nav Admin). S3 Money (reset; checks `SEED_LIST_IDS.souterMon20Am/Pm` are SUBMITTED; nav Admin). S4 Exceptions (reset; nav Mobile, `/admin/billing`). S5 Compliance tour (reset; `editProcedure` asaClass AS2 -> `editBooking` notes -> `editProcedure` AS1 on the `SEED_MARKERS.overriddenTimeUnitsBooking` booking as Souter/Office actors; then `authoriseList(OFFICE_ACTOR, SEED_LIST_IDS.whitakerFri17)` to raise invoices under the Health NZ contract snapshot; nav Admin, Xero sim). Scenario text mentions things like draft-list assignment, S2 "optional opening on days off"; it is narration, only S3 and S5 stage anything.
3. `DemoActionsIndex` (`data-shot=control-demo-index`): groups `DEMO_TRIGGERS` by `screen`, shows label, badge, description, "Shows in: Harness bar / Installed PWA", and an "Open screen" button navigating to `trigger.indexPath(state)` (disabled with `indexEmptyReason` when null; PWA-only entries show "Shown in the installed PWA"); `indexHint` text. NO trigger is fired from this page. A note under Billing monitor: "Run payables" is product UI.
4. Static "Billing assumption" note (partial time intervals round up per started interval).

## 4. Demo trigger registry: how screen-contextual demo actions work

Files in `src/shared/demoTriggers/` (deliberately NOT exported from `src/shared/index.ts`; PWA closure includes it, so it must not import `src/apps/*` or `src/shell/*`):
- `types.ts` `DemoTrigger`: `id` (kebab; becomes `data-shot=demo-action-<id>` on bar, `pwa-demo-action-<id>` in sheet), `label`, `description`, `screen` (Control Panel grouping heading), `routes` (react-router `matchPath` patterns, `end:true`, on full pathname), `surfaces` (`'bar'|'pwa'`), optional `badge` (`future-scope`|`office-stand-in`|`colleague-stand-in`), `when(state, ctx)` visibility gate, `choices(state, ctx)` + `defaultChoice` (select in bar, radio rows in PWA), `disabledReason(state, ctx, choiceId)` (null = runnable; string shown under disabled Run), `run(api, ctx, choiceId) -> {ok,message}`, `indexPath(state)`, `indexEmptyReason`, `indexHint`. `DemoTriggerCtx` = {`pathname`, `params` from the matched pattern (e.g. listId, bookingId, invoiceId, dateISO, accRecId), `published`}.
- `match.ts` `demoTriggersFor(state, pathname, surface, published)` filters registry (order preserved); `initialChoice`.
- `context.ts`: `useDemoContextStore` (own zustand store, UI-only, not persisted, no audit) + `useDemoTriggerContext(key, value)` hook a screen calls to publish state the URL cannot carry (withdrawn on unmount). Current keys (`DemoContextValues`) and publishers: `integrations.tab` (`apps/admin/screens/IntegrationMonitorScreen.tsx:48`), `integrationsSim.selectedMessageId` (`apps/demo/DemoIntegrations.tsx:54`), `aaFees.month` (`apps/admin/screens/AaFeesScreen.tsx:98`), `adminDay.selectedSlotId` (`apps/admin/components/SlotDrawer.tsx:62`), `adminDraftLists.openListId` (`apps/admin/components/DraftListDrawer.tsx:56`; no trigger consumes it yet), `adminMasters.view` (`apps/admin/screens/masters/MasterData.tsx:33`).
- `memory.ts` `useDemoTriggerMemory` (UI-only, not persisted): `lastMessageId`, `lastWebhook` + `webhookCounter` (for Replay), and `photoCaptureRequest` (consumed by `apps/mobile/routes.tsx:47-55`, which opens the Add-a-booking sheet on its photo prong and clears the request).
- `useDemoTriggers.ts`: `useDemoTriggers(surface)` re-evaluates on route, store, published-context and memory changes; `useDemoTriggerRows(surface)` adds per-row choice and result state (reset on pathname change; results keyed `pathname|id`) and `run` = `trigger.run(useAppStore, ctx, chosen)`. Both the bar menu and the PWA sheet only render these rows.
- `DemoTriggerBadge.tsx`; `shared/DemoBadge.tsx` (amber "Demo simulation" / neutral "Future scope" badge; `tone='future'`).

**Where they render.** Bar: `shell/DemoActionsMenu.tsx`: a "Demo actions <n>" pill (FlaskConical, amber count; label hidden below 1280px by `theme/global.css:713`; `data-shot=demo-actions`); returns `null` (renders nothing) when the current route has zero bar entries; popover (width 360, z-index 120) with, per row: label, badge, Run button (disabled with reason text), description, a `<select>` for choices, an aria-live result line. Popover stays open after a run; closes on route change, Esc, outside click. PWA: `pwa/PwaDemoActions.tsx` (floating amber "Demo" chip, hidden if no PWA entries, plus an "Office auto" marker when the office simulation is on; opens `BottomSheet`).

**Every registered trigger** (registry.ts line = `id:` line; all call store actions through `api` = `useAppStore`, i.e. via `mutate()`):

| id (line) | Label | Routes | Surf | Calls |
|---|---|---|---|---|
| billing-failure (364) | Trigger billing failure | `/admin/billing` | bar | `editContract(COS ACC, effectiveToISO 2026-07-15)`, `submitList`, `authoriseList` on `SEED_LIST_IDS.billingFailure`; `when` list exists; disabled once billed |
| arm-handoff-fault (397) | Arm handoff failure | `/admin/billing` | bar | `armHandoffFault` (`store/demoSettingsActions.ts:42`, sets `settings.failNextHandoff`) |
| run-reconciliation-poll (412) | Run reconciliation poll | `/admin/billing`, `/demo/xero*` | bar | `runReconciliationPoll` |
| run-archive-job (433) | Run archive job | same | bar | `runArchiveJob` |
| simulate-sign-in (457) | Simulate sign-in attempts | `/admin/audit` | bar | `simulateSignInAttempts` (`store/authDemoActions.ts:24`; 5 audited account rows) |
| stage-post-op (479) | Stage post-op scenario | `/admin/review/:listId`, `/admin/day/:dateISO/bookings/:bookingId` | bar | `submitList`+`authoriseList` on Dr Sharma Tue 14 Jul AM (`POST_OP_ORIGINAL_LIST_ID`); `when` the screen is that list |
| ingest-pdf-row (515) | Ingest PDF row | `/admin/integrations` | bar | `ingestPdfRow` (`SURGEON_PDFS` sample row R2 onto Souter Mon 27 Jul AM); `when` published `integrations.tab==='pdfs'` |
| payment-full (548) / payment-half (563) | Payment received full / half | `/admin/invoices/:invoiceId`, `/demo/xero/invoices/:accRecId` | bar | `sendPaymentWebhook` -> `receivePayment` (idempotency key `WEBHOOK-<accRecId>-<n>`); hidden on AA-fee pairs |
| payment-replay (578) | Replay last payment event | same | bar | `receivePayment` with last key (duplicate ignored) |
| run-scheduled-fee-run (604) | Run scheduled month-end fee run | `/admin/billing/aa-fees` | bar | `runMonthlyFeeInvoices(AA_FEE_RUN_ACTOR, {monthISO})`; month from published `aaFees.month` |
| seed-month-of-bctis (627) | Seed a month of BCTIs | `/admin/billing/aa-fees` | bar | `seedMonthOfBctis` (`store/demoBctiSeed.ts`; Dr Rutherford to 40 paid BCTIs in July) |
| record-fee-payment (649) | Record fee payment | `/demo/xero/invoices/:accRecId` (fee pair only) | bar | `recordFeePaymentFor` -> `recordAaFeePayment` |
| office-authorises-list (669) | Office authorises this List | `/mobile/lists/:listId[/bookings/:bookingId]` | pwa | `authoriseAsSimulatedOffice` (`store/officeStandIn.ts:32`) |
| office-assigns-next-free (692) | Office assigns a List to my next free session | `/mobile/lists` | pwa | `assignNextFreeSlotAsSimulatedOffice` (3 fixed hospital/surgeon pairings, `STAND_IN_ASSIGN_CHOICES`) |
| office-assigns-draft-list (722) | Office assigns a Draft List to me | `/mobile/lists` | pwa | `assignDraftListAsSimulatedOffice` |
| simulate-sickness (750) | Simulate sickness | `/admin/day/:dateISO`, `/admin/conflicts` | bar | `simulateSickness` (`store/demoSimulations.ts:49`); choice = a List that day, default = published `adminDay.selectedSlotId` list |
| colleague-moves-list-to-office (787) | Colleague moves a List to the office | `/admin/day/:dateISO`, `/admin/notifications` | bar | `stageColleagueMoveToOffice` or `stageBusyMorning` (8 moves) (`store/listMoveDemo.ts`) |
| colleague-moves-list-to-me (818) | Colleague moves a List into my free session | `/mobile/availability` | pwa | `stageColleagueMoveToPersona(ANAE.souter)` |
| simulate-incoming-request (842) | Simulate incoming request | `/admin/draft-lists` | bar | `simulateIncomingDraftListRequest` (`CANNED_DRAFT_LIST_REQUESTS`; `store/draftListDemo.ts`) |
| add-draft-list-for-day (868) | Add Draft List for this day | `/admin/day/:dateISO` | bar | `addDraftListForDay` (`CANNED_DAY_DRAFT_LISTS`) |
| stage-recurring-clash (888) | Stage recurring clash | `/admin/masters` | bar | `stageRecurringClash`; `when` published `adminMasters.view==='recurringBookings'` |
| raise-sample-warnings (924) / clear-sample-warnings (947) | Raise / Clear sample warnings | `/admin/day/:dateISO`, `.../bookings/:bookingId`, `/mobile/lists/:listId/bookings/:bookingId` | bar+pwa | `raiseDaySamples`/`raiseSamplesOn`, `clearAllSamples`/`clearSamplesOn` (`store/warningSamples.ts:207,295`) |
| office-clears-warning (965) | Office clears this warning | `/mobile/lists/:listId/bookings/:bookingId` | pwa | `clearWarning(OFFICE_SIMULATION_ACTOR, bookingId, key)`; choice = open warning |
| photo-capture-future (997) | Photo capture (Future scope) | `/mobile/lists/:listId` | bar+pwa | memory `requestPhotoCapture` (UI-only; no store write) |
| fire-hospital-message (1017) | Fire hospital message | `/mobile/lists*`, `/admin/integrations`, `/demo/integrations` | bar+pwa | `processMessage(api, id)` from `CANNED_MESSAGES` (default from published `integrationsSim.selectedMessageId`) |
| replay-hospital-message (1042) | Replay last message (dedupe) | same | bar+pwa | `processMessage` (outcome `duplicate`) |
| pwa-payment-full (1070) / pwa-payment-half (1082) | Payment received full / half | `/mobile/balances` | pwa | `sendPaymentWebhook` on a chosen Dr Souter open ACCREC |

Notes: bar entries that appear on the framed `/mobile/*` routes: only `raise/clear-sample-warnings`, `photo-capture-future`, `fire/replay-hospital-message` (others are pwa-only). On web app routes (`/web/*`) NO trigger is registered, so the Demo actions pill is absent there. Bar entries on `/admin/day/*` therefore: simulate-sickness, colleague-moves-list-to-office, add-draft-list-for-day, raise/clear-sample-warnings. Helper exports from the registry used elsewhere: `recordFeePaymentFor` (also used by `DemoXero.tsx:414`), `sendPaymentWebhook`, `paymentDisabledReason`, `BILLING_MONITOR_SCREEN`, `POST_OP_ORIGINAL_LIST_ID`. Tests: `shared/demoTriggers/demoTriggers.test.ts` (571 lines), `context.test.tsx`, `shell/DemoActionsMenu.test.tsx`, `shell/DemoResetButton.test.tsx`.

## 5. Extension points for new screen-contextual triggers

1. Add one `DemoTrigger` object to `DEMO_TRIGGERS` (registry.ts:361 array). Pick `routes` patterns (copy the consts at :96-125, e.g. `ADMIN_DAY`, `MOBILE_BOOKING`), `surfaces` (`'bar'` for framed prototype; `'pwa'` for the handset sheet; both allowed), `screen` heading, and put the logic in a store function (`src/store/*Demo*.ts`, as the existing ones do) using `DEMO_TRIGGER_ACTOR` or `OFFICE_ACTOR`/`OFFICE_SIMULATION_ACTOR`; the run body gets `api` (bound store) and ctx params. Registry must stay free of `src/apps/*` and `src/shell/*` imports (PWA closure).
2. Screen state not in the URL: add a key to `DemoContextValues` (`context.ts:10`) and call `useDemoTriggerContext('key', value)` in the screen; read it via `ctx.published[...]` in `when`/`choices`/`defaultChoice`/`run`.
3. Multi-option triggers: supply `choices`, optionally `defaultChoice`; bar renders a `<select>`, PWA radio rows.
4. Gating: `when` hides the entry (and the pill count) on a matched route; `disabledReason` greys Run with explanation text.
5. No UI change is needed: bar pill, PWA chip, Control Panel index all render from the array. The pill appears automatically only on routes with at least one entry; the bar has no per-screen buttons rendered inline in the apps, only the single pill and popover. Layout limits: bar height fixed at 48px (pill collapses to icon+count below 1280px); the popover is a 360px scrolling list; there is no grouping, tabs or sub-headings inside the popover (flat list, registry order).
6. If a trigger should be fireable from the Control Panel: it cannot be today (index lists only; `indexPath`).
7. For triggers on the mobile route in the framed build, `/mobile/*` routes already match `'bar'`; the bar sits outside the phone frame.
8. Reset behaviour: all store changes are wiped by `resetDemo`; `useDemoTriggerMemory` and `useDemoContextStore` are NOT reset by it (memory replay refuses readably if the entity is gone).
9. Any seed-shape change needs a `PERSIST_VERSION` bump (currently 26); UI-only demo context/memory need none.

## 6. Demo-only pages (`src/apps/demo/`)

All use `DemoSurface.tsx` (title, subtitle, "Demo simulation" badge, optional Future-scope badge and `futureScope` line; max width 1080 default).

**`DemoXero.tsx`** (`/demo/xero`, `/invoices`, `/invoices/:accRecId`; 914 lines; view model `xeroPairView.ts` `xeroInvoicePairViews`): simulated Xero org. Callouts: "No personal information in Xero" (contacts carry only a hidden ContactNumber; NHI never in Xero) and "Duplicate-invoice-number-prevention" mandated org setting (open item). Tabs: Contacts (read-only table `ContactsTable`, `data-shot=xero-contact-<number>`; type chip organisation/individual, archived flag) and Invoices (`InvoicesTable` of ACCREC/ACCPAY pairs; row click navigates to the pair; unknown `accRecId` redirects to the list). `PairDetail` (procedure pair): ACCREC card (invoice number, Reference = case reference, amounts, lines, status awaitingPayment/paid/voided), ACCPAY card, money-flow card, and one button "settle" that calls `receivePayment(useAppStore, {accRecId, amount: balance, idempotencyKey 'DEMO-INVOICE-SETTLEMENT-<id>', source 'webhook'})` then `disbursePayable(OFFICE_ACTOR, accPayId)` (a screen-local demo action not in the registry); link to the web account when the pair belongs to Souter. `FeePairDetail` (kind `aaFee`, no ACCPAY; AA's monthly fee invoice): "Record fee payment" button via `recordFeePaymentFor` (same function as the trigger; this one IS an inline button). A "Contact archiving and volume" callout shows `settings.volumeStory` (soft limit, invoices/year, one-time %) and active/archived contact counts; scale is narrated, not simulated.

**`DemoIntegrations.tsx`** (`/demo/integrations`; Future-scope line: HL7 v2, FHIR R4 and near real time are Future scope; in scope is the St George's and Southern Cross download into a matching screen). Left rail: feed picker (`FEED.stg`, `cph`, `sx`; `FEED_META`), "Replay" (`processMessage(useAppStore, selected.id)`, `data-shot=integrations-replay`), "Live" drip (every 1s processes each library message once via `setInterval`), reset-with-confirm (`resetDemo`, resets whole data), message library (click to select, row replay at :291). Right: three panes (raw HL7 with segments, translated FHIR R4 bundle built from the LIVE feed mapping via `extractViaMapping`/`toFhirBundle`, schedule change from the message-log row and resulting booking); Southern Cross FHIR-native shows two panes (`extractFromFhir`). Domain: `src/domain/integrations` (`CANNED_MESSAGES`, `FEED`, `FEED_META`). Publishes `integrationsSim.selectedMessageId`.

**`DemoData.tsx`** (`/demo/data`, "Data inspector"): panels: demo clock + entity counts and persisted payload size (`entityCounts`, `persistedBytes`, `persistStatus`, `STORAGE_BUDGET_BYTES`); Today's sessions (checks the canvas invariant, AM+PM per active anaesthetist per day, via `slotViewsForDate`, `listIndexBySlot`); Seeded scenario finder (buttons from `SEED_MARKERS`; selecting loads its audit trail); Audit trail (entity picker, append-only history); Lifecycle states (filter by DRAFT/ACTIVE/SUBMITTED/AUTHORISED list state, counts); Guard console (`data-shot=data-guard-console`): choose persona (Souter, Kirsty, "HL7 feed" integration actor), action (`completeBooking`, `cancelBooking`, `editBooking`, `submitList`, `authoriseList`) and a booking/list, runs it with that actor and shows the Outcome, so lifecycle guard refusals are visible. It performs real store mutations (it can change data).

## 7. PWA target

**Entry `pwa/main.tsx`** (+ `pwa/index.html`, `pwa/vite-env.d.ts` declaring `__BUILD_ID__`, `__BUILD_DATE__`; build config `vite.pwa.config.ts`: standalone, `start_url '/mobile/lists'`, `scope '/'`). Wires `wireBillingRun`, `wireReconciliationPoll`, `wireArchiveJob`, `wireIntegrationRetry` (same as `src/main.tsx`) plus `wireOfficeSimulation`, `markBootStart`, side-effect `src/pwa/installPrompt`. Router: `/mobile` -> `MobileApp host={MobileViewport} moreExtra={<PwaDemoPanel/>}` with the same four child routes as the framed build; `/` and unknown -> `/mobile/lists`. No `AppShell`: no harness bar, no web/admin/demo pages, no Demo actions menu. The persona is fixed (Dr Souter). `src/pwa/pwaPurity.test.ts` walks the import closure and fails if it reaches `apps/web`, `apps/admin`, `apps/demo`, `AppShell`, `router`, `PhoneFrame`, `GradientLab`, `DemoActionsMenu`; asserts it contains `demoTriggers/registry.ts` and `PwaDemoActions.tsx`.

**`MobileViewport.tsx`**: host (replaces `PhoneFrame`) filling the device viewport; measures `visualViewport`, safe-area insets and keyboard shortfall (`viewportMetrics.ts`, `--aa-viewport-shortfall`); mounts `UpdatePrompt` (:168, reload pill via `virtual:pwa-register/react`, auto-check each minute, `swRegistration.ts`) and `PwaDemoActions` (:171).

**`PwaDemoPanel.tsx`** (rendered in the Mobile More tab through `moreExtra`, `apps/mobile/outlet.ts` -> `MobileMoreRoute` -> `MoreScreen extra`). Cards in order: `InstallCoach` (`InstallCoach.tsx`, `installPrompt.ts`: captures `beforeinstallprompt`, Android install button, iOS Add-to-Home-Screen instructions, dismissal remembered in localStorage); **Demo clock** (same `demoClockShortcuts` buttons as the bar menu); **Office simulation** (toggle "Play the office", `OfficeSimulationCard`); **Demo data** (Reset demo data with confirm sheet, `resetDemo`); **Viewport** (diagnostic rows: host box, layout/visual viewport, safe insets, mode; correction toggle "Show shortfall band"; "Copy diagnostics"); **Build** (Version `__BUILD_ID__`, Release Date, Cold launch ms from `bootMetrics.ts`/`BootMark.tsx`, Offline ready from service worker, Saved data MB/paused from `persistStatus`, "Check for updates").

**`PwaDemoActions.tsx`**: floating "Demo" chip, bottom sheet of `useDemoTriggerRows('pwa')`; see section 4. Handset entries: office-authorises-list, office-assigns-next-free, office-assigns-draft-list, colleague-moves-list-to-me, office-clears-warning, pwa-payment-full/half, plus shared raise/clear sample warnings, photo capture, fire/replay hospital message. These "stand in" for the office/colleagues/hospital systems that have no app on the phone and carry `Office stand-in` / `Colleague stand-in` badges.

**`officeSimulation.ts`**: `wireOfficeSimulation(api)` subscribes to the store; when a List goes ACTIVE -> SUBMITTED it schedules (`OFFICE_SIM_DELAY_MS` 4000) `authoriseAsSimulatedOffice`, only if localStorage `aa-office-simulation` is `on` (default OFF; re-checks every 4s). Copy says it is a demo scaffold, not the proposed flow. Not wired in the framed build (`src/main.tsx`), where Kirsty uses the Admin app.

## 8. Stubbed, hardcoded, visual-only

- Personas hardcoded (Souter / Kirsty); no real auth or user switching in the framed build. Audit rows for sign-in are simulated by the `simulate-sign-in` trigger.
- Many triggers are seed-scoped to named entities (Dr Ropata billing failure `SEED_LIST_IDS.billingFailure`, Dr Sharma Tue 14 Jul AM, Dr Rutherford for BCTI and sample warnings, Souter Mon 27 Jul AM for PDF ingest, fixed hospital/surgeon pairings for stand-in assignment); they refuse or hide when the seed differs. Some `indexPath`s hardcode dates (`/admin/day/2026-07-21|22`).
- Scenario jumps S1, S2, S4 only reset; their guidance is text. S2 text refers to features (days off, availability status list) it does not stage.
- Hospital HL7/FHIR, photo capture, Xero, identity provider (Auth0/Entra) are simulated or labelled Future scope; Xero sim state is read only by the Billing Engine mirror, never by the apps.
- Xero sim "settle" and DemoData guard console and DemoIntegrations Replay/Live/Reset are inline demo actions outside the registry (they are on demo-only pages).
- `useDemoTriggerMemory`/`useDemoContextStore` are not persisted, not reset by `resetDemo`.
- PhoneFrame fake status bar, battery and signal icons are visual only; GradientLab is a temporary tuning flag (`GRADIENT_LAB_ENABLED = true`).
- Billing monitor "Run payables" is product UI (`apps/admin/screens`), not a demo action.
