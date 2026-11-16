# Prototype map: shell, demo surfaces, PWA, router

Paths are under `aa-prototype/` unless absolute. Line numbers are from the code as read on 2026-11-17 (master, c9b65ad8).

**Orientation.** This area is the prototype's chrome, not its product screens. `src/router.tsx` defines every URL: three layout routes (`/web`, `/admin`, `/mobile`) nested under one `AppShell` (the 48px dark harness bar plus an `<Outlet>`), and five demo-only pages under `/demo/*`. The harness bar holds, right to left: Reset, Demo clock, **Demo actions** (screen-contextual), the app switcher, and the persona chip. **Screen-contextual demo triggers already exist** (catch-up Phase 14): a typed registry `src/shared/demoTriggers/registry.ts` (about 45 entries, each with route patterns, `when`, choices, `disabledReason`, `run`), rendered by the bar's `DemoActionsMenu` (framed build) and the installed PWA's `PwaDemoActions` bottom sheet, and indexed (never fired) by the Control Panel page. The PWA entry (`pwa/main.tsx`) mounts only the mobile app inside `MobileViewport`, with a presenter panel behind the More tab. All store access goes through hooks or `useAppStore` actions; nothing here uses `fetch`. Demo triggers write through the audited store actions with a demo or stand-in `Actor`.

## Contents
1. Routes (`router.tsx`) and entry points
2. Harness bar: AppShell, app switcher, persona chip, clock, reset
3. Demo actions: the contextual-trigger system (registry, menu, PWA sheet, inline, context publishing) and the full entry table
4. Extension points for new screen-contextual triggers
5. Demo pages: Control Panel, Xero, Integrations, Data inspector, Component catalogue
6. PWA target (`pwa/`, `src/pwa/`) and its demo panel
7. Simulated phone frame and Gradient Lab
8. Store-side demo actions and actors
9. Stubbed, hardcoded or visual-only items
10. Tests that guard this area

---

## 1. Routes and entry points

`src/App.tsx` (5 lines) renders `AppRouter`. `src/main.tsx` renders `App` and wires four store jobs once: `wireBillingRun` (consumes `listAuthorised`), `wireReconciliationPoll`, `wireArchiveJob` (both on `dayAdvanced`, in that order), `wireIntegrationRetry` (timer). It does NOT wire `wireOfficeSimulation`.

`src/router.tsx` (`BrowserRouter`, v7 future flags). Everything sits under `<Route element={<AppShell/>}>` (line 78). `RootRedirect` (line 51) sends `/` and any unknown path to `APP_CONFIG[shell.currentApp].path` (the persisted last app).

| Path | Component (file) | Notes |
|---|---|---|
| `/web` | `WebApp` layout; index `WebDashboardRoute` | `src/apps/web/routes` |
| `/web/lists`, `/web/lists/:listId`, `/web/lists/:listId/bookings/:bookingId` | `WebListsRoute`, `WebListDetailRoute`, `WebBookingDetailRoute` | `cards/:cardId` -> `LegacyBookingRedirect` (`shared/legacy`) |
| `/web/availability`, `/web/availability/mine` | `WebAvailabilityRoute`, `WebMyAvailabilityRoute` | |
| `/web/accounts/:subTab` | `WebAccountsRoute` | `/web/accounts` redirects to `overdue` |
| `/admin` | `AdminApp` layout; index `AdminIndexRedirect` | `src/apps/admin/routes` |
| `/admin/day/:dateISO`, `/admin/day/:dateISO/bookings/:bookingId` | `AdminDayRoute`, `AdminBookingDetailRoute` | `cards/:cardId` legacy redirect |
| `/admin/conflicts`, `/draft-lists`, `/notifications` | `AdminConflictsRoute`, `AdminDraftListsRoute`, `AdminNotificationsRoute` | |
| `/admin/review`, `/admin/review/:listId` | `AdminReviewQueueRoute`, `AdminReviewRoute` | |
| `/admin/invoices`, `/admin/invoices/:invoiceId` | `AdminInvoicesRoute` (both) | |
| `/admin/billing`, `/billing/aa-fees`, `/billing/aa-fees/settings` | `AdminBillingPage`, `AdminAaFeesRoute`, `AdminAaFeeSettingsRoute` | Billing monitor is the index |
| `/admin/integrations` | `AdminIntegrationsRoute` | |
| `/admin/masters`, `/masters/surgeons/:surgeonId`, `/masters/anaesthetists/:anaesthetistId` | `AdminMastersRoute`, `AdminSurgeonProfileRoute`, `AdminAnaesthetistRecordRoute` | |
| `/admin/audit` | `AdminAuditRoute` | |
| `/mobile` | `MobileApp host={PhoneFrame}`; index redirects to `lists` | |
| `/mobile/lists/*`, `/mobile/availability/*` | `MobileListsRoute`, `MobileAvailabilityRoute` | single splat route each (slide stack keeps layers mounted) |
| `/mobile/balances`, `/mobile/more` | `MobileBalancesRoute`, `MobileMoreRoute` | More hosts `moreExtra` (PWA panel) |
| `/demo/control` | `DemoControlPanel` | section 5 |
| `/demo/xero`, `/demo/xero/invoices`, `/demo/xero/invoices/:accRecId` | `DemoXero` (all three) | |
| `/demo/integrations` | `DemoIntegrations` | |
| `/demo/data` | `DemoData` | |
| `/demo/catalogue` -> `/demo/catalogue/admin`; `/demo/catalogue/:app` | `ComponentCatalogue` | URL only; not in switcher |

Each app has a `*` child redirecting to its root. Principle in the comment (lines 56-73): path = navigation, query = view prefs, transient overlays are local state. `RequireEntity` (`shell/RequireEntity.tsx`) turns a missing entity id into `<Navigate to=".." replace/>`. `shell/routeParams.ts` `isISODate` guards `:dateISO` / `?week=`.

PWA routes (`pwa/main.tsx:74-89`): only `/mobile/*` (same child routes, host `MobileViewport`, `moreExtra={<PwaDemoPanel/>}`); everything else redirects to `/mobile/lists`. No AppShell, no admin/web, no demo pages.

## 2. Harness bar

`src/shell/AppShell.tsx` (118 lines). Root `div` is `100dvh` flex column; `<header>` 48px, ink background (lines 48-109); `<main data-aa-modal-scope>` holds `<Outlet/>` (an open dialog makes `main` inert, never the bar; line 113).
- Left: "AA Booking & Billing", "Prototype" pill, and (DEV only, only when `VITE_REQUIREMENTS_URL` is set) a "Requirements" link to the board (lines 82-99).
- Right (lines 102-108), in order: `PersonaChip` (`shared/PersonaChip`, persona from `APP_CONFIG[activeApp].persona`), `AppSwitcher`, `DemoActionsMenu`, `DemoClockMenu`, `DemoResetButton`.
- Route to store sync: `appIdForPath(pathname)` picks the active app; an effect calls `setCurrentApp(routeApp)` when it differs (lines 26-32). `handleSelect` calls `setCurrentApp(id)` then `navigate(APP_CONFIG[id].path)`. `shell.currentApp` is persisted (`store/appStore.ts:355`) so a refresh returns to the same app.

`src/shell/appConfig.ts`: `AppId` = mobile, web, admin, demo-xero, demo-integrations, demo-control, demo-data. `PERSONAS`: `souter` (Dr Melanie Souter, MS, Anaesthetist, id 34821) and `kirsty` (Kirsty W., KW, Office). Personas: mobile and web run as Souter; admin and all demo surfaces as Kirsty. `APP_ORDER`, `group: 'apps' | 'demo'`, `appIdForPath` (prefix match; `/demo/catalogue/*` matches none, so the bar keeps the last app's persona and label).

`src/shell/AppSwitcher.tsx`: a dropdown (`usePopover`, `PopoverPanel` width 300, placement end). Lists "Apps" (Mobile, Web, Admin) then divider then "Demo surfaces" (Billing Monitor & Xero, Integrations, Control Panel, Data Inspector), icons per id (lines 18-26), active item ticked. Selecting calls `onSelect(id)`.

`src/shell/DemoClockMenu.tsx`: pill showing `useClockTimeLabel()` (mono). Popover: date and time, a 2-column grid of the six `demoClockShortcuts` buttons (`+15 min`, `+1 hour`, `Next day`, `Next morning`, `+7 days`, `Procedure day 28 Jul`, the last spanning both columns and disabled once today >= 2026-07-28). "Updates apply immediately and keep this screen open." Shortcut definitions live in `shared/demoClockShortcuts.ts:27-72` (also used by the Control Panel and the PWA panel) and call `advanceClockMinutes/Days/ToNextMorning/ToDate` in `store/clockActions.ts:78-110`. A day change runs `rollCanvasForward` (generates AM+PM Slots and Lists for each new horizon day through the seed generator, audit `canvas.rollForward`, actor "Demo control") then `emitAppEvent({type:'dayAdvanced'})`, which fires the reconciliation poll then the archive job. The clock is forward-only; reset is the only rewind.

`src/shell/DemoResetButton.tsx`: "Reset" pill; popover "Reset all demo data?" with Confirm reset / Cancel; confirm calls `resetDemo(useAppStore)` (`clockActions.ts:113` -> `resetDomainState`, `store/mutate.ts:267`: rebuilds seed, clock to `INITIAL_CLOCK` = Tue 21 Jul 2026 08:00, preserves the `shell` slice). Copy is hardcoded to that date.

## 3. Demo actions: the contextual-trigger system

### 3.1 Mechanism (all in `src/shared/demoTriggers/`)
- `types.ts`: `DemoTrigger` = `id` (kebab, becomes `data-shot="demo-action-<id>"`), `label`, `description`, `screen` (Control Panel group heading), `routes` (react-router `matchPath` patterns, `end: true`, full pathname), `surfaces: ('bar'|'pwa')[]`, optional `badge` (`'future-scope' | 'office-stand-in' | 'colleague-stand-in'`), optional `when(state, ctx)`, `choices(state, ctx)`, `defaultChoice`, required `disabledReason(state, ctx, choiceId)` (null = runnable), `run(api, ctx, choiceId) -> {ok, message}`, `indexPath(state)` (Control Panel "Open screen" target, or null), optional `indexEmptyReason`, `indexHint`. `DemoTriggerCtx` = `{pathname, params (from matched pattern), published}`.
- `match.ts` `demoTriggersFor(state, pathname, surface, published)`: pure; filters registry by surface, route match, `when`; `initialChoice` = `defaultChoice` if offered else first choice.
- `useDemoTriggers.ts`: `useDemoTriggers(surface)` subscribes to location, whole app store, published context, trigger memory; `useDemoTriggerRows(surface)` adds per-row choice and result state (reset on every pathname change; results keyed `pathname|id`), computes `reason = disabledReason(...)`, `run = trigger.run(useAppStore, ctx, chosen)`. Both surfaces only render these rows.
- `context.ts`: `useDemoContextStore` (own zustand store, UI-only, not persisted, no audit). `DemoContextValues` keys: `integrations.tab`, `integrationsSim.selectedMessageId`, `aaFees.month`, `adminDay.selectedSlotId`, `adminDraftLists.openListId`, `adminMasters.view`, `adminPicker.listId`. Screens publish via `useDemoTriggerContext(key, value)` (while mounted) or `useDemoTriggerContextWhile(key, value, active)` (while a sheet is open). Publishers today: `apps/admin/screens/IntegrationMonitorScreen.tsx:49`, `AaFeesScreen.tsx:101`, `masters/MasterData.tsx:34`, `components/DraftListDrawer.tsx:59`, `components/SlotDrawer.tsx:71`, `flows/AssignDraftListSheet.tsx:67`, `flows/SessionStatusSheet.tsx:83`, `flows/ReassignListFlow.tsx:59`, `apps/demo/DemoIntegrations.tsx:55`. Consumers: `when`/`choices`/`defaultChoice` in the registry (`ctx.published[...]`). Note `adminDraftLists.openListId` has a publisher but the registry reads of it should be checked by anyone relying on it.
- `memory.ts`: `useDemoTriggerMemory` (UI-only): `lastMessageId`, `lastWebhook`, `webhookCounter` (replay entries) and `photoCaptureRequest` (the photo trigger asks; `apps/mobile/routes.tsx:74-82` opens the Add a booking sheet on the photo prong and clears it).
- `InlineDemoTrigger.tsx`: runs one registry entry by `id` and `choiceId` from inside a product sheet (dashed teal button plus badge, `data-shot=demo-action-<id>-inline`). Used once: `apps/admin/components/pairing/AnaesthetistCandidates.tsx:214` (`ask-colleague-make-available`, per unavailable colleague row, because the picker scrim covers the bar).
- `procedureTextTriggers.ts`: pure helpers for `fire-hospital-message` default on a Booking (`cannedMessageForBooking`, order S14, S13, S15) and `hospital-description-arrives` (AR-35 wordings; `replacesProcedureText`).
- `DemoTriggerBadge.tsx`, `shared/DemoBadge.tsx`: badges "Demo trigger", future scope, "Office stand-in", "Colleague stand-in".
- `index.ts` exports all of it (deliberately NOT in the `src/shared/index.ts` barrel).

### 3.2 Bar renderer: `src/shell/DemoActionsMenu.tsx`
Uses `useDemoTriggerRows('bar')`; returns null when no rows (bar never grows). Pill "Demo actions" with warning `CountBadge` (label hidden below 1280px by `.aa-demo-actions-label`, `theme/global.css:728`). Popover (width min(360px,...), `role=dialog`): "Demo trigger" badge, "On this screen", then per row: label, optional badge, a **Run** button (disabled with the `disabledReason` text under it), description, a `<select>` when the entry has choices, and an `aria-live` result block (ok = sunken, refusal = warning tint). Stays open after a run; closes on pathname change.

### 3.3 PWA renderer: `src/pwa/PwaDemoActions.tsx`
Mounted by `MobileViewport` (line 171), so the framed build never shows it. Floating amber "Demo" chip (absolute, bottom above the tab bar / booking dock; hidden while any sheet is open via `useAnySheetOpen`), only on screens with `'pwa'` entries; "Office auto" marker when the office simulation toggle is on. Tapping opens a `BottomSheet` with the same rows (choices as radio buttons, big Run button, result). `data-shot=pwa-demo-actions`, `pwa-demo-action-<id>`.

### 3.4 Registry entries (`registry.ts`, `DEMO_TRIGGERS` from line 429)
Route constants at lines 124-155: `BILLING_MONITOR=/admin/billing`, `XERO_SIM` (3 demo/xero paths), `INVOICE_PAGES` (/admin/invoices/:invoiceId + /demo/xero/invoices/:accRecId), `MOBILE_LISTS` (lists, lists/:listId, .../bookings/:bookingId), `ADMIN_DAY`, `ADMIN_BOOKING` (/admin/day/:dateISO/bookings/:bookingId), `MOBILE_BOOKING`, `WEB_BOOKING`. "bar" = framed harness; "pwa" = installed PWA sheet. Store calls are named store actions (section 8); all fire as an Actor (`OFFICE_ACTOR` Kirsty, `DEMO_TRIGGER_ACTOR` "Demo actions", `OFFICE_SIMULATION_ACTOR`, `HOSPITAL_DOWNLOAD_ACTOR`).

| id (line) | Where (routes) | Surf. | What it does (store calls) |
|---|---|---|---|
| `billing-failure` (431) | /admin/billing; `when` seed list exists | bar | submit (if ACTIVE) Dr Ropata Thu 16 Jul list, `setProcedureContract` Losa Tuilagi -> COS fixed fees (`demoStage`), `authoriseList` as office; her Booking fails "Needs a price", sibling bills |
| `arm-handoff-fault` (473) | /admin/billing | bar | `armHandoffFault` (settings.failNextHandoff) |
| `run-reconciliation-poll` (488) | billing + /demo/xero* | bar | `runReconciliationPoll` |
| `run-archive-job` (509) | billing + /demo/xero* | bar | `runArchiveJob` |
| `simulate-sign-in` (533) | /admin/audit | bar | `simulateSignInAttempts`: 5 audited account rows |
| `hospital-description-arrives` (555) | Admin Booking detail | bar | choice of AR-35 wordings; `replaceProcedureText` (source hospitalDownload) |
| `stage-post-op` (590) | /admin/review/:listId, Admin Booking detail; `when` the Sharma Tue 14 Jul list | bar | submit + `authoriseList` so "Add post-op event" can run |
| `ingest-pdf-row` (626) | /admin/integrations; `when` published `integrations.tab==='pdfs'` | bar | `ingestPdfRow` row R2 onto Souter Mon 27 Jul AM |
| `payment-full` / `payment-half` (659/674) | INVOICE_PAGES; `when` not an AA-fee pair | bar | `sendPaymentWebhook` -> `receivePayment` (key `WEBHOOK-<accRecId>-<n>`) |
| `payment-replay` (689) | INVOICE_PAGES | bar | re-send last webhook (idempotency) from `useDemoTriggerMemory` |
| `run-scheduled-fee-run` (715) | /admin/billing/aa-fees (month from `aaFees.month`) | bar | `runMonthlyFeeInvoices` as `AA_FEE_RUN_ACTOR` |
| `seed-month-of-bctis` (738) | aa-fees; `when` Rutherford exists | bar | `seedMonthOfBctis` to 40 BCTIs |
| `record-fee-payment` (760) | /demo/xero/invoices/:accRecId; `when` fee pair | bar | `recordAaFeePayment` |
| `office-authorises-list` (780) | /mobile/lists/:listId (+booking) | pwa | `authoriseAsSimulatedOffice` |
| `office-assigns-next-free` (803) | /mobile/lists | pwa | choices `STAND_IN_ASSIGN_CHOICES`; `assignNextFreeSlotAsSimulatedOffice` |
| `office-adds-out-of-hours-list` (833) | /mobile/lists | pwa | `addOutOfHoursListAsSimulatedOffice` |
| `office-assigns-draft-list` (852) | /mobile/lists | pwa | `assignDraftListAsSimulatedOffice` |
| `simulate-sickness` (880) | /admin/day/:dateISO, /admin/conflicts | bar | choices per List "to the office" or "to Dr X" (`sicknessChoices`); default = List in published `adminDay.selectedSlotId`; `simulateSickness` (`store/demoSimulations.ts`) |
| `ask-colleague-make-available` (922) | day, draft-lists, conflicts; `when` published `adminPicker.listId`; also inline | bar (badge colleague) | `makeSessionAvailableAsColleague` on a closed colleague session |
| `office-resolves-alert` (952) | /mobile/lists/:listId, MOBILE_BOOKING | pwa | `officeResolvesAlert` |
| `office-approves-contract-change` (975) | MOBILE_BOOKING | pwa | `approveContractChangeAsSimulatedOffice` |
| `colleague-moves-list-to-office` (999) | day, /admin/notifications | bar | choice one move or busy morning (8); `stageColleagueMoveToOffice` / `stageBusyMorning` |
| `colleague-moves-list-to-me` (1030) | /mobile/availability | pwa | `stageColleagueMoveToPersona` (Souter) |
| `colleague-hands-booking-to-souter` (1054) | day | bar | `stageColleagueBookingMove(..., {tellOffice:true})` |
| `colleague-moves-booking-to-me` (1075) | MOBILE_LISTS | pwa | choices `bookingMoveCandidates`; `stageColleagueBookingMove` |
| `simulate-incoming-request` (1111) | /admin/draft-lists | bar | choices `CANNED_DRAFT_LIST_REQUESTS`; `simulateIncomingDraftListRequest` |
| `add-draft-list-for-day` (1137) | day | bar | choices `CANNED_DAY_DRAFT_LISTS`; `addDraftListForDay` |
| `stage-recurring-clash` (1157) | /admin/masters; `when` published `adminMasters.view==='recurringBookings'` | bar | `stageRecurringClash` (marks the anaesthetist Unavailable on the first day past the schedule) |
| `raise-sample-warnings` / `clear-sample-warnings` (1193/1218) | ADMIN_DAY, ADMIN_BOOKING, MOBILE_BOOKING | bar+pwa | `raiseDaySamples` / `raiseSamplesOn`; `clearAllSamples` / `clearSamplesFor` (warning rule samples) |
| `office-clears-warning` (1236) | MOBILE_BOOKING | pwa | choices `openWarningChoices`; `clearWarning` |
| `office-sets-booking-contract` (1265) | MOBILE_BOOKING | pwa | `setProcedureContract` as office stand-in, hospital's first Contract on offer else No contract RVG |
| `photo-capture-future` (1293) | /mobile/lists/:listId | bar+pwa, future-scope | memory request; opens Add a booking on photo prong |
| `fire-hospital-message` (1313) | MOBILE_LISTS, WEB_BOOKING, ADMIN_BOOKING, /admin/integrations, /demo/integrations | bar+pwa, future-scope | choices all `CANNED_MESSAGES`; default = message addressed to the Booking on screen, else simulator's selected, else first; `processMessage`; remembers id |
| `replay-hospital-message` (1344) | MOBILE_LISTS, integrations pages | bar+pwa, future-scope | `processMessage(last)` (dedupe demo) |
| `pwa-payment-full` / `pwa-payment-half` (1372/1384) | /mobile/balances | pwa | choices Souter's open ACCREC; `sendPaymentWebhook` |

Which are contextual to an entity in the URL: payment-*, record-fee-payment, office-authorises-list, office-resolves-alert, office-approves-contract-change, office-clears-warning, office-sets-booking-contract, hospital-description-arrives, photo-capture-future, fire-hospital-message (on Bookings), raise/clear samples, add-draft-list-for-day, simulate-sickness (day in URL). Seed-scoped (hardcoded seed constants, gated by `when`/`disabledReason`): billing-failure, stage-post-op, ingest-pdf-row, seed-month-of-bctis, office-adds-out-of-hours-list.

Not registered: "Run payables" (product button on the Billing monitor; test enforces this, `demoTriggers.test.ts:57`).

## 4. Extension points for new screen-contextual demo triggers

1. **Add an entry** to `DEMO_TRIGGERS` in `src/shared/demoTriggers/registry.ts` (append inside the array; registry order is menu order). Set `routes` to the screen's pattern (must match `router.tsx` or `pwa/main.tsx` exactly; add a route constant near line 124), `surfaces: ['bar']` for framed, `['pwa']` for the handset sheet, both if it works on `/mobile/*` in both. Implement `run` via an existing or new audited store action (never raw `setState`); return `{ok, message}`. Provide `disabledReason` (required), and `indexPath` for the Control Panel listing (a test checks the Open screen link lands where the entry is visible, `demoTriggers.test.ts:61`). No en or em dashes in label, description, screen, hints (test, line 49).
2. **Screen state the URL lacks** (selected row, open drawer, tab): add a key to `DemoContextValues` in `context.ts`, call `useDemoTriggerContext` / `...While` in the screen component, and read `ctx.published[key]` in `when`/`choices`/`defaultChoice`.
3. **Trigger beside a control inside a dialog** (scrim covers the bar): render `<InlineDemoTrigger id choiceId label onRan/>` in the sheet.
4. **Cross-screen memory or a UI request** (replay, "open sheet X"): add fields to `memory.ts` and consume them in the target route as `mobile/routes.tsx:74` does.
5. **Bar layout**: the menu is one pill that lists everything matching the current pathname, so more triggers on a screen need no new button; the bar is fixed at 48px (`AppShell.tsx:48`), and only the pill's label collapses below 1280px. A new bar control must be added to the right cluster in `AppShell.tsx:102-108`; keep `triggerStyle` in step with `DemoClockMenu.tsx` / `DemoActionsMenu.tsx:11`.
6. **PWA**: `PwaDemoActions.tsx` renders `'pwa'` entries; `pwaPurity.test.ts` forbids the PWA closure from reaching `shell/DemoActionsMenu.tsx`, `apps/*`, router. The registry itself must stay free of `src/apps/*` and `src/shell/*` imports (file header, lines 12-13).
7. **Control Panel index** updates automatically (groups by `screen`); the page fires nothing.
8. If a trigger changes seed shape or content, bump `PERSIST_VERSION` (currently 44 per `store/appStore.ts:266`; CLAUDE.md still says 13, stale). Mirror scripted beats in `docs/demo-guide/`.

## 5. Demo pages (`src/apps/demo/`)

`DemoSurface.tsx`: layout wrapper for demo pages (title, subtitle, "Demo simulation" badge, optional Future scope badge and line; max width 1080 default).

**Control Panel** `/demo/control`, `DemoControlPanel.tsx` (496 lines). Three groups:
- Clock & reset: live date and time card with the same six `demoClockShortcuts` buttons; "Reset demo data" with inline confirm -> `resetDemo`.
- Scenario jumps S1 to S5 (`SCENARIOS`, line 163; each Jump asks Confirm jump, then calls `resetDemo` plus staging, shows a message and nav buttons): S1 reset only (HL7 booking beat, Future scope note); S2 reset (Office day); S3 reset and checks that Souter's Mon 20 Jul AM and PM Lists are SUBMITTED; S4 reset; S5 reset, then stages on David Chen's Booking `claimModifier` AS3 (Souter), `editBooking` notes (office), `removeModifier`, then `authoriseList` of `SEED_LIST_IDS.whitakerFri17`. Messages are long walkthrough scripts, hardcoded.
- "Demo actions by screen" index (`DemoActionsIndex`): the registry grouped by `screen`, each with description, "Shows in" surfaces, "Open screen" (`indexPath(state)`), hints; PWA-only rows say "Shown in the installed PWA". Nothing fired here.

**Xero simulation** `/demo/xero[/invoices[/:accRecId]]`, `DemoXero.tsx` (935 lines), view helper `xeroPairView.ts` (`xeroInvoicePairViews` joins xero, billing, schedule, masters). Callouts (no personal information in Xero, duplicate-invoice-number setting, contact archiving and volume narrated from `settings.volumeStory`). Tabs: Contacts table, Invoices table of ACCREC/ACCPAY pairs; unknown `:accRecId` redirects to the list. `PairDetail` (procedure pairs): ACCREC and ACCPAY cards, money flow, buyer-created tax invoice block; its settle button calls `receivePayment` (key `DEMO-INVOICE-SETTLEMENT-<id>`, source webhook) then `disbursePayable(OFFICE_ACTOR)`; link to the web Accounts tab only for Souter's. `FeePairDetail` (`kind:'aaFee'`): ACCREC only, "Record payment" calls `recordFeePaymentFor` (shared with the registry). Bar entries here: reconciliation poll, archive job, `record-fee-payment`, payment-* (INVOICE_PAGES includes the pair route).

**Integration simulator** `/demo/integrations`, `DemoIntegrations.tsx` (588 lines): feed picker (`FEED_ORDER` STG, CPH, SX), message library from `CANNED_MESSAGES`, three panes (raw HL7 v2, translated FHIR R4 via `toFhirBundle` or native FHIR, schedule change effect from the message-log row), Replay button -> `processMessage`, "Live feed" drip (1 message per second), reset with confirm. Uses the live feed field mapping (`extractViaMapping` / `extractFromFhir`). Publishes `integrationsSim.selectedMessageId`. Callout: target state FHIR-first via the Digital Services Hub. Future-scope banner via `DemoSurface`.

**Data inspector** `/demo/data`, `DemoData.tsx` (661 lines): entity counts, persisted payload size and persist status (`persistedBytes`, `persistStatus`), today's sessions (`slotViewsForDate`) with the canvas invariant (AM and PM per active anaesthetist, every non-Draft List in exactly one Slot), seeded scenario finder (`SEED_MARKERS`), per-entity audit trail, Lists by lifecycle state, and the **Guard console**: choose persona (Souter, Kirsty, HL7 feed), action (`completeBooking`, `cancelBooking`, `editBooking`, `submitList`, `authoriseList`), target; Attempt calls the store action as that actor and shows Allowed or "Refused (code)". Direct store calls, not registry entries.

**Component catalogue** `/demo/catalogue/:app` (`catalogue/ComponentCatalogue.tsx` -> `AdminCatalogue`, `WebCatalogue`, `MobileCatalogue`): demo-only inventory of hand-built components, each row a live example (`CatalogueRow` in `CatalogueKit.tsx`: name, source file, used-in, replacement library group). Admin examples in `admin/basicExamples.tsx`, `admin/storeExamples.tsx`; web in `web/*`; mobile in `mobile/*`; plus `procedureStackExample`, `payerExamples`, `splitExamples`, `contractApprovalExample`. Smoke tests per app. CLAUDE.md requires rows to stay in step with component changes.

## 6. PWA target

- `pwa/index.html`: title "AA Booking & Billing", theme colour, iOS web-app metas, font preloads; loads `pwa/main.tsx`. Built by `vite.pwa.config.ts` (VitePWA, `registerType:'prompt'`, `generateSW`, manifest name "AA Booking & Billing", `display: standalone`, portrait, `start_url /mobile/lists`, `scope /`, id `/aa-booking-billing`). `public/` holds icons, fonts, `_headers`, `_redirects`.
- `pwa/main.tsx` (above): wires billing run, reconciliation poll, archive job, integration retry, and **`wireOfficeSimulation`**; imports `installPrompt` for its side effect; `markBootStart()`; `BootMark` rendered last; routes only `/mobile/*`.
- `src/pwa/MobileViewport.tsx`: host replacing `PhoneFrame`: relative box, `--aa-inset-*` from `env(safe-area-inset-*)`, the atmosphere (`useMobileGradient`, `AtmosphereLayer`), publishes `--aa-viewport-shortfall` (iOS standalone height fix; `viewportMetrics.ts`), mounts `UpdatePrompt` and `PwaDemoActions`.
- `UpdatePrompt.tsx` (service worker "update ready" pill, `useRegisterSW`, never auto-reload), `swRegistration.ts` (`checkForUpdate`, `serviceWorkerReady`), `installPrompt.ts` (captures `beforeinstallprompt`, `promptInstall`, coach dismissal key), `InstallCoach.tsx` (More-tab card), `BootMark.tsx` + `bootMetrics.ts` (cold-launch ms).
- **PWA demo panel** `src/pwa/PwaDemoPanel.tsx` (574 lines), injected into the More tab via `moreExtra` (`MobileApp.tsx:104-128`, `outlet.ts:20`, `routes.tsx:305`). Cards: **Demo clock** (time, date, the six clock shortcuts as 44px pills; text says Start now and Finish now stamp from this clock); **Office simulation** (toggle "Play the office", `localStorage aa-office-simulation`, default OFF, badge "Simulated office", copy `OFFICE_SIM_COPY`); **Demo data** (Reset demo data with bottom-sheet confirm: removes the persisted key first via `resilientLocalStorage.removeItem(PERSIST_KEY)`, `resetDemo`, `clearInstallCoachDismissal`); **Viewport** (diagnostic rows, shortfall probe toggle, copy button); **Build** (version `__BUILD_ID__`, release date, cold launch ms, offline ready, saved data size, "Check for updates"); `InstallCoach`. Per-screen actions are NOT here: they are the floating Demo chip (`PwaDemoActions`).
- `src/pwa/officeSimulation.ts`: `wireOfficeSimulation(api)` subscribes to the store; on a live ACTIVE -> SUBMITTED transition, after `OFFICE_SIM_DELAY_MS` = 4000 it calls `authoriseAsSimulatedOffice` if the toggle is on and the List is complete (`officeStandInRefusal` not `STAND_IN_INCOMPLETE`), else re-arms. Seeded SUBMITTED Lists are untouched. Explicitly "not the RFP flow".
- Purity: `pwaPurity.test.ts` walks imports from `pwa/main.tsx` and fails if the closure reaches web, admin, demo, `AppShell`, router, `PhoneFrame`, `GradientLab`, `DemoActionsMenu`.

## 7. Phone frame and Gradient Lab
`src/shell/PhoneFrame.tsx` (320 lines): iOS device frame (390x844 logical) used as the mobile host in the framed build only: bezel, island, fake status bar showing `useClockTimeLabel()`, home indicator, zoom toolbar (zoom in/out, Fit; auto-fit on resize; scale persisted `aa-phone-scale`), the atmosphere, and the Gradient Lab. Gradient Lab (`shell/gradientLab/`, `GradientLab.tsx` 497 lines, `useGradientLab.ts`) tunes the mobile background wash (config stored `aa-gradient-lab`); gated by `GRADIENT_LAB_ENABLED = true` (`theme/gradientLabGate.ts`), the prototype's only feature flag. Visual-only, no domain effect.

## 8. Store-side demo actions and actors
`store/demoActors.ts`: `OFFICE_ACTOR` (Kirsty W., office), `SOUTER_ACTOR`, `OFFICE_SIMULATION_ACTOR` ("AA office (simulated)"), `DEMO_TRIGGER_ACTOR` ("Demo actions", system, source demo). `store/clockActions.ts` (clock, reset, canvas roll). `store/officeStandIn.ts` (authorise, assign next free, out-of-hours list, assign Draft List as office; refusals `officeStandInRefusal`, `STAND_IN_INCOMPLETE`). `store/demoSimulations.ts` (`simulateSickness`, candidates, refusal). `store/draftListDemo.ts` (incoming request, day Draft List, recurring clash). `store/listMoveDemo.ts` (colleague moves, busy morning x8, make session available). `store/authDemoActions.ts` (`simulateSignInAttempts`). `store/demoSettingsActions.ts` (`armHandoffFault`, `setArchiveWindowDays`). `store/demoBctiSeed.ts` (40 BCTIs for Rutherford). Every one goes through the audited `mutate()` path.

## 9. Stubbed, hardcoded or visual-only
- All demo-page content is simulated: Xero is the in-store `xero` slice; HL7/FHIR messages are canned (`domain/integrations` `CANNED_MESSAGES`, `SURGEON_PDFS`); identity service for sign-in is simulated; "Photo capture" is a UI-only simulation flagged Future scope; hospital messages flagged Future scope.
- Seed-pinned triggers: billing-failure (Losa Tuilagi, Ropata Thu 16 Jul), stage-post-op (Sharma Tue 14 Jul), ingest-pdf-row (row R2, Souter Mon 27 Jul AM), BCTI seed (Rutherford), `office-adds-out-of-hours-list` and PWA stand-ins (Souter), `indexPath` constants (`/admin/day/2026-07-21`, `/2026-07-22`, `/admin/day/2026-07-21/bookings/BK0006`). They break silently if the seed changes (their `when` hides them).
- Reset and scenario copy hardcode "Tuesday 21 July 2026, 8:00"; `S1_PROCEDURE_DAY = 2026-07-28`.
- Persona is by app, not switchable (no persona switch in the bar); mobile and web both are Souter.
- Control Panel scenarios S1, S2, S4 only reset; their long walkthrough text is the "script".
- Gradient Lab, phone zoom, viewport/build diagnostic cards are presenter chrome only.
- Requirements link in the bar appears only in DEV with an env var.

## 10. Tests in this area
`shell/DemoActionsMenu.test.tsx`, `shell/DemoResetButton.test.tsx`, `shared/demoTriggers/demoTriggers.test.ts` (744 lines: registry shape, dash ban, index links, per-entry behaviour), `procedureTextTriggers.test.ts`, `context.test.tsx`, `apps/demo/DemoXero.test.tsx`, `xeroPairView.test.ts`, catalogue smoke tests (`AdminCatalogue`, `WebCatalogue`, `MobileCatalogue`), `shell/gradientLab/gradientLabPurity.test.ts`, `pwa/pwaPurity.test.ts`, `officeSimulation.test.ts` (498 lines), `installPrompt.test.ts`, `viewportMetrics.test.ts`.
