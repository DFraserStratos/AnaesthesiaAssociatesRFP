# Prototype map: shell, demo surfaces, PWA, router

Paths are relative to `aa-prototype/` unless noted. Line numbers from the code at HEAD (3d3a18c). `PERSIST_VERSION` is 16 (`src/store/appStore.ts:136`).

**Orientation.** Two entry points share `src/`. The framed all-apps prototype (`src/main.tsx` -> `App.tsx` -> `AppRouter` in `src/router.tsx`) wraps every route in `AppShell`: a 48px dark harness bar (title, persona, app switcher, Demo actions menu, demo clock menu, Reset) above a routed `<Outlet/>`. The installable PWA (`pwa/main.tsx`) mounts only the Anaesthetist Mobile App in `MobileViewport` with NO AppShell/harness bar; its presenter controls live on the More tab (`PwaDemoPanel`) and a floating "Demo" chip (`PwaDemoActions`). Since catch-up Phase 14 the demo triggers are a screen-contextual registry (`src/shared/demoTriggers/registry.ts`) shown in the bar menu and the PWA sheet; the `/demo/control` page is now only an index plus clock/reset/scenario jumps. The extension point for new screen-contextual demo buttons already exists (section 5). Four demo-only surfaces sit behind the switcher: Xero sim, Integrations sim, Control Panel, Data Inspector.

## Contents
1. Entry points and wiring (main.tsx, App, router, PWA main)
2. Route table (every route)
3. Harness bar and app switcher
4. Clock menu, Reset, shared clock shortcuts
5. Demo-trigger registry: contract, existing triggers, where they render, how they call the store, extension points
6. Demo surfaces (`/demo/*`)
7. PWA (`src/pwa`, `pwa/`): host, demo panel, demo sheet, office simulation, install/update
8. PhoneFrame and Gradient Lab
9. Stubbed / hardcoded / visual-only
10. Quick index of "where would I look for..."

---

## 1. Entry points and wiring

- `src/App.tsx:1-5` renders `<AppRouter/>` only.
- `src/main.tsx:16-25` wires store jobs once for the singleton store, in order: `wireBillingRun` (consumes `listAuthorised`, runs billing, hands cases to Xero), `wireReconciliationPoll` then `wireArchiveJob` (both on `dayAdvanced`, poll before archive), `wireIntegrationRetry` (timer auto-retry of `retrying` integration messages). Not wired here: `wireOfficeSimulation` (PWA only).
- `pwa/main.tsx:46-52` wires the same four, plus `wireOfficeSimulation(useAppStore)` (off by default). Imports `src/pwa/installPrompt` for its side effect (captures `beforeinstallprompt` early). `markBootStart()` + `<BootMark/>` (cold-launch metric).
- `pwa/index.html`: title "AA Booking & Billing", iOS standalone metas, theme-color #F3EAEC, font preloads. `vite.pwa.config.ts`: VitePWA `registerType: 'prompt'`, manifest `start_url: '/mobile/lists'`, `display: standalone`, injects `__BUILD_ID__` / `__BUILD_DATE__`.
- Import-closure rule enforced by `src/pwa/pwaPurity.test.ts:40-49`: the PWA must never reach `apps/web`, `apps/admin`, `apps/demo`, `shell/AppShell.tsx`, router, `PhoneFrame`, `GradientLab`, or `shell/DemoActionsMenu.tsx`; it MUST reach `shared/demoTriggers/registry.ts` and `pwa/PwaDemoActions.tsx` (test at :155). Consequence: registry code must stay pure TS over `store` + `domain`, no `apps/*` or `shell/*` imports.

## 2. Route table

Router: `BrowserRouter` (v7 future flags), `src/router.tsx:94-172`. All routes nested under `<Route element={<AppShell/>}>`. URL is source of truth for the active app; `AppShell` mirrors it into `store.shell.currentApp` (`AppShell.tsx:201-203`). Path = navigation, query = view prefs (`?week=`, `?sort=`); overlays (sheets, add-booking flow, admin list drawer) are local state, not URLs.

| Path | Element | Notes |
|---|---|---|
| `/` and `*` (unknown) | `RootRedirect` (router.tsx:73) | `Navigate` to `APP_CONFIG[currentApp].path` (last app, persisted) |
| `/web` (layout `WebApp`) | index `WebDashboardRoute` | apps/web/routes |
| `/web/lists` | `WebListsRoute` | |
| `/web/lists/:listId` | `WebListDetailRoute` | |
| `/web/lists/:listId/bookings/:bookingId` | `WebBookingDetailRoute` | |
| `/web/lists/:listId/cards/:cardId` | `LegacyBookingRedirect` (shared/legacy) | rewrites old `cards` URL to `bookings` |
| `/web/availability` | `WebAvailabilityRoute` | |
| `/web/accounts` -> `/web/accounts/overdue`; `/web/accounts/:subTab` | `WebAccountsRoute` | (`payments?invoice=` used by Xero sim deep link) |
| `/web/*` | Navigate `/web` | |
| `/admin` (layout `AdminApp`) | index `AdminIndexRedirect` | |
| `/admin/day/:dateISO` ; `/admin/day/:dateISO/bookings/:bookingId` ; `.../cards/:cardId` (legacy) | `AdminDayRoute`; `AdminBookingDetailRoute`; redirect | |
| `/admin/review` ; `/admin/review/:listId` | `AdminReviewQueueRoute`; `AdminReviewRoute` | |
| `/admin/invoices` ; `/admin/invoices/:invoiceId` | `AdminInvoicesRoute` (both) | |
| `/admin/billing` | `AdminBillingRoute` | Billing monitor; four demo triggers |
| `/admin/integrations` | `AdminIntegrationsRoute` | publishes `integrations.tab` |
| `/admin/masters` | `AdminMastersRoute` | |
| `/admin/audit` | `AdminAuditRoute` | demo trigger: simulate sign-in |
| `/admin/*` | Navigate `/admin` | |
| `/mobile` (layout `MobileApp host={PhoneFrame}`) | index -> `lists` | |
| `/mobile/lists/*` | `MobileListsRoute` | ONE splat route; slide stack keeps layers mounted. Layers (`listsStackLocation`): `/mobile/lists`, `/mobile/lists/:listId`, `/mobile/lists/:listId/bookings/:bookingId` |
| `/mobile/availability`, `/mobile/balances`, `/mobile/more` | `MobileAvailabilityRoute`, `MobileBalancesRoute`, `MobileMoreRoute` | |
| `/mobile/*` | Navigate `/mobile` | |
| `/demo/control` | `DemoControlPanel` | |
| `/demo/xero`, `/demo/xero/invoices`, `/demo/xero/invoices/:accRecId` | `DemoXero` (same element x3) | tab and detail derived from pathname/param |
| `/demo/integrations` | `DemoIntegrations` | |
| `/demo/data` | `DemoData` | |

PWA routes (`pwa/main.tsx:67-85`): `/mobile` layout (`MobileApp host={MobileViewport} moreExtra={<PwaDemoPanel/>}`) with the same `lists/*`, `availability`, `balances`, `more` children; `/` and everything else redirect to `/mobile/lists`. URLs stay `/mobile/*` (hard-coded prefixes in shared mobile code).

Helpers: `src/shell/RequireEntity.tsx` (redirect `..` when an id from the URL no longer exists, e.g. after `PERSIST_VERSION` bump); `src/shell/routeParams.ts:8` `isISODate` (validates `:dateISO`/`?week=`).

## 3. Harness bar and app switcher (framed build only)

`src/shell/AppShell.tsx` (139 lines). Layout: full-height `100dvh` flex column, `overflow:hidden`; `<header>` 48px, `neutral.ink` background (:219-303); `<main>` scrolls, hosts `<Outlet/>` (:306).

Header left (:233-271): "AA Booking & Billing" + "Prototype" pill; a dev-only "Requirements ↗" link shown only when `import.meta.env.DEV && VITE_REQUIREMENTS_URL` (opens the Requirements Board).
Header right (:273-302), in DOM order: persona avatar+name+role (from `APP_CONFIG[activeApp].persona`) -> `<AppSwitcher/>` -> `<DemoActionsMenu/>` -> `<DemoClockMenu/>` -> `<DemoResetButton/>`. Each is a self-contained button+popover (`position:absolute; top:calc(100%+8px); right:0; zIndex 100-120`), outside-click/Escape closes (except the switcher: backdrop click only). Any new bar control should follow this pattern; the bar is `justify-content:space-between` with `gap:14` and fixed 48px height (hence the label-collapse rule below).

- Persona: `src/shell/appConfig.ts:25-28` `PERSONAS` souter (Dr Melanie Souter, MS, Anaesthetist, id 34821) and kirsty (Kirsty W., KW, Office). Mobile/Web -> souter; Admin and all four demo surfaces -> kirsty. No persona picker, persona follows the active app. `AppShell` calls `setCurrentApp` on route change; switcher selection calls `setCurrentApp` + `navigate(path)` (:207-210).
- `src/shell/appConfig.ts`: `AppId` = mobile | web | admin | demo-xero | demo-integrations | demo-control | demo-data; `APP_CONFIG` (label, path, persona, group 'apps'|'demo'); `APP_ORDER`; `appIdForPath` (prefix match; `/demo/...` each maps to its own id).
- `src/shell/AppSwitcher.tsx`: dropdown (300px) with "Apps" group (Anaesthetist Mobile App, Anaesthetist Web App, Admin Web App), divider, "Demo surfaces" group (Demo: Billing Monitor & Xero, Demo: Integrations, Demo: Control Panel, Demo: Data Inspector). lucide icons per id (:17-25). Pure navigation, no store domain calls.
- `src/shell/DemoActionsMenu.tsx` (204 lines): the contextual trigger menu, see section 5. Not rendered when 0 rows (so the bar never grows). Pill label collapses to icon+count below 1280px (`theme/global.css:711-716`, class `aa-demo-actions-label`). `data-shot="demo-actions"`; rows `data-shot="demo-action-<id>"`.
- Responsive: bar has no mobile layout; the framed build is a desktop harness (shell uses `100dvh` so it is not broken on a phone browser).

## 4. Demo clock, Reset, shared clock shortcuts

- `src/shared/demoClockShortcuts.ts:27-71` is the single definition used by `DemoClockMenu` (bar), `DemoControlPanel` and `PwaDemoPanel`. Shortcuts: `plus-15-minutes` (`advanceClockMinutes(api,15)`), `plus-1-hour` (60), `next-day` (`advanceClockDays(api,1)`), `next-morning` (`advanceClockToNextMorning`), `plus-7-days`, `procedure-day` "Procedure day · 28 Jul" (`advanceClockToDate(api, S1_PROCEDURE_DAY='2026-07-28')`, disabled when `todayISO >= 2026-07-28`). Clock is forward-only.
- `src/store/clockActions.ts`: `applyClock` (:65) writes `clock` directly, and on a day change calls `rollCanvasForward` (:29; generates far-edge Lists from Permanent Lists via `generateListsForDates`, one audit entry per rolled day, actor `Demo control`, source 'demo', action `canvas.rollForward`) then `emitAppEvent({type:'dayAdvanced'})` (which triggers poll + archive jobs). `advanceClockToNextMorning` = 08:00 next day (:91). `resetDemo` (:110) = `resetDomainState(api)` (clock included; `shell` slice preserved).
- `src/shell/DemoClockMenu.tsx`: pill shows `useClockTimeLabel()` (mono) with aria "Demo clock, <date> at <time>"; popover shows long date + time and a 2-col grid of the six shortcuts; note "Updates apply immediately and keep this screen open." Does not navigate.
- `src/shell/DemoResetButton.tsx`: "Reset" pill -> confirm popover ("Reset all demo data?... returns the demo clock to Tuesday 21 July 2026, 8:00. Your current app and display choices are preserved.") -> `resetDemo(useAppStore)` (:42). Note the framed Reset does NOT clear localStorage first (the PWA Reset does, section 7).
- Reset also exists on: Control Panel (confirm), Integrations sim ("Reset demo data", also resets feed selection), PWA More, and every S1 to S5 scenario jump.

## 5. Demo-trigger registry (screen-contextual demo actions)

Location: `src/shared/demoTriggers/` (index.ts barrel; deliberately NOT re-exported from `src/shared/index.ts`). Built in catch-up Phase 14.

**Contract** (`types.ts`): `DemoTrigger { id (kebab, also data-shot suffix), label, description (stated before firing), screen (Control Panel index heading), routes[] (react-router `matchPath` patterns, `end:true`, on full pathname), surfaces: ('bar'|'pwa')[], badge?: 'future-scope'|'office-stand-in', when?(state,ctx), choices?(state,ctx), defaultChoice?, disabledReason(state,ctx,choiceId)->string|null, run(api,ctx,choiceId)->{ok,message}, indexPath(state)->string|null, indexEmptyReason?, indexHint? }`. `DemoTriggerCtx { pathname, params (from the matched route pattern), published (screen state the URL cannot carry) }`.

**Matching** (`match.ts`): `demoTriggersFor(state, pathname, surface, published)` is pure; filters by surface, route pattern, then `when`. `initialChoice` = `defaultChoice` if offered else first choice.

**Hooks** (`useDemoTriggers.ts`): `useDemoTriggers(surface)` subscribes to the whole store (`useAppStore()`), route, published context, memory. `useDemoTriggerRows(surface)` adds per-row choice state, last-result state (keyed `pathname|id`, cleared on route change), `reason = disabledReason(...)`, and `run()` = `trigger.run(useAppStore, ctx, chosen)` with the result shown inline. Both renderers only render these rows.

**Published screen state** (`context.ts`): small zustand store (UI-only, not persisted, no PERSIST_VERSION effect). Typed keys in `DemoContextValues`: `'integrations.tab'` ('messages'|'feeds'|'pdfs'|'quality'|'validators'), `'integrationsSim.selectedMessageId'`. A screen calls `useDemoTriggerContext(key, value)` (publishes while mounted, withdraws on unmount). Current publishers: `apps/admin/screens/IntegrationMonitorScreen.tsx:48` (tab) and `apps/demo/DemoIntegrations.tsx:54` (effective selected message). Only these two screens publish anything today.

**Memory** (`memory.ts`): zustand store of `lastMessageId`, `lastWebhook {accRecId,key,amount}`, `webhookCounter`, so Replay triggers work across screens. Not persisted; replays refuse after a reset (`replayDisabledReason` registry.ts:139, `messageReplayDisabledReason` :175).

**Where triggers render**
- Bar: `DemoActionsMenu` (`useDemoTriggerRows('bar')`): "Demo actions" pill with a count chip, popover (360px) titled with `DemoBadge "Demo trigger"` and "On this screen"; each row: label, optional badge (`DemoTriggerBadge`), Run button (disabled with the reason shown under it), description, `<select>` if `choices`, result line (`role=status`). Popover stays open after a run; closes on navigation (`useEffect` on pathname :59), Escape, outside click.
- PWA: `src/pwa/PwaDemoActions.tsx` (`useDemoTriggerRows('pwa')`): amber "Demo" chip (`data-shot="pwa-demo-actions"`) pinned bottom-right above the tab bar/dock, opens a `BottomSheet` with the same rows (choices as a radiogroup, 44px+ rows). "Office auto" marker while the office simulation toggle is on. Chip absent on More and Availability (test demoTriggers.test.ts:292). Mounted by `MobileViewport` (:168-171), so framed build never shows it.
- Index: `DemoControlPanel > DemoActionsIndex` lists every trigger grouped by `screen`, with surfaces and an "Open screen" link (`indexPath(state)`; PWA-only entries show "Shown in the installed PWA"). Nothing is fired from the Control Panel.

**Registered triggers (registry.ts:194-525, in order)**

| id | Label | Routes | Surfaces | Gate / disabled reason | Store call (actor) |
|---|---|---|---|---|---|
| `billing-failure` | Trigger billing failure | `/admin/billing` | bar | `when` seed list `SEED_LIST_IDS.billingFailure` exists; disabled "Already triggered" if `billedAtISO` set | `editContract(cosAcc, {effectiveToISO:'2026-07-15'})`, `submitList` if DRAFT, `authoriseList` (OFFICE_ACTOR) :210-226 |
| `arm-handoff-fault` | Arm handoff failure | `/admin/billing` | bar | disabled "Armed" when `settings.failNextHandoff` | `armHandoffFault(api, OFFICE_ACTOR)` (store/demoSettingsActions.ts:42) |
| `run-reconciliation-poll` | Run reconciliation poll | `/admin/billing` + 3 `/demo/xero*` | bar | always | `runReconciliationPoll(api)` returns count |
| `run-archive-job` | Run archive job | same | bar | always | `runArchiveJob(api)` |
| `simulate-sign-in` | Simulate sign-in attempts | `/admin/audit` | bar | always | `simulateSignInAttempts(api)` adds 5 audit rows (store/authDemoActions.ts:24) |
| `stage-post-op` | Stage post-op scenario | `/admin/review/:listId`, `/admin/day/:dateISO/bookings/:bookingId` | bar | `when` the list/booking's list is `POST_OP_ORIGINAL_LIST_ID` (Sharma Tue 14 Jul AM); disabled when already AUTHORISED | `submitList` + `authoriseList` (OFFICE_ACTOR) |
| `ingest-pdf-row` | Ingest PDF row | `/admin/integrations` | bar | `when` `published['integrations.tab']==='pdfs'` | `ingestPdfRow(api, OFFICE_ACTOR, listId, row R2 of SURGEON_PDFS[0])` |
| `payment-full` / `payment-half` | Payment received full / half | `/admin/invoices/:invoiceId`, `/demo/xero/invoices/:accRecId` | bar | `paymentDisabledReason`: "Not handed off to Xero", "Fully paid", "Seeded history invoice" (must be an `openAccRecs` row) | `sendPaymentWebhook` -> `receivePayment(api,{accRecId,amount,idempotencyKey:'WEBHOOK-<accRecId>-<n>',source:'webhook'})`; ACCREC resolved from URL |
| `payment-replay` | Replay last payment event | same | bar | memory + receipts check | `receivePayment` same key (expects `applied:false`) |
| `office-authorises-list` | Office authorises this List | `/mobile/lists/:listId` (+ booking layer) | pwa (badge office-stand-in) | `officeStandInRefusal` (store/officeStandIn.ts:20): not in data / DRAFT "Submit the List first" / "Already authorised" | `authoriseAsSimulatedOffice` (actor OFFICE_SIMULATION_ACTOR "AA office (simulated)") authorises + billing run + Xero handoff |
| `fire-hospital-message` | Fire hospital message | 3 mobile Lists layers + `/admin/integrations` + `/demo/integrations` | bar + pwa (badge future-scope) | `choices` = `CANNED_MESSAGES`; default = published sim selection | `processMessage(api, cannedId)` (store/integrationActions.ts:309); remembers id |
| `replay-hospital-message` | Replay last message (dedupe) | same routes | bar + pwa | needs last message still in integration log | `processMessage(api, last)` -> outcome 'duplicate' |
| `pwa-payment-full` / `pwa-payment-half` | Payment received full / half | `/mobile/balances` | pwa | `choices` = Dr Souter's open invoices (`souterOpenAccRecs`); reasons "No open invoices yet", "Choose an invoice" | `sendPaymentWebhook(api, choiceId, mode)` |

Rules visible here: payment webhooks are idempotent by key; half = `roundToCents(remaining/2)`; the next webhook `n` skips keys already in `billing.receipts`; paired ACCPAY is authorised pro-rata; Run payables is deliberately NOT a demo trigger (it is product UI in the Billing monitor; test at demoTriggers.test.ts:54).

**Screen-contextual? Yes.** Every trigger is route-scoped; only 2 are state-scoped (`ingest-pdf-row` via published tab; `stage-post-op` via seed list id). Screens with registered triggers today: Admin Billing monitor, Admin Audit, Admin Review (one list) and Booking detail (one list), Admin Integrations, Admin Invoice detail, Xero sim (3 routes), Integrations sim, Mobile Lists (3 layers, PWA+bar), Mobile Balances (PWA). NO triggers on: Admin Day view, Admin Masters, Admin Review queue, all `/web/*` screens, Mobile Availability/More, Control Panel, Data Inspector.

**Extension points for new screen-contextual buttons**
1. Add a `DemoTrigger` object to `DEMO_TRIGGERS` (registry.ts:194). Set `routes` to the pattern(s) (params arrive in `ctx.params`), `surfaces` ['bar'] and/or ['pwa'], `screen` heading, `indexPath`. It then appears in the bar menu, PWA sheet (if 'pwa') and Control Panel index with no UI change. Test conventions to satisfy (demoTriggers.test.ts:40-80): unique kebab ids, no en/em dashes in label/description/screen/hint, every bar entry's `indexPath` must land on a route where it is visible, pwa-only entries must not appear in the bar.
2. Need screen state the URL lacks (tab, selected row, draft)? Add a key to `DemoContextValues` (context.ts:10) and call `useDemoTriggerContext(key,value)` from the screen; read it in `when`/`choices`/`run` via `ctx.published`.
3. Cross-screen replay/last-fired state: extend `DemoTriggerMemory` (memory.ts).
4. Actor for domain writes: `OFFICE_ACTOR`, `SOUTER_ACTOR`, `OFFICE_SIMULATION_ACTOR` (store/demoActors.ts); always go through store actions (`mutate()`), never set state directly (clock writes are the one exception).
5. A visible always-on bar control (not per-screen) would be a new sibling component in `AppShell.tsx:298-301` following the `DemoClockMenu` pill style (`triggerStyle`), height 34, `zIndex 120` popover; PWA equivalents go into `PwaDemoPanel` (More) or `PwaDemoActions`.
6. Limits: one bar menu only (no grouping inside it; rows ordered by registry order); no per-trigger confirm step; run results are transient strings; `when` and `disabledReason` are re-evaluated on each store change (whole-store subscription). Registry must stay free of `apps/*` and `shell/*` imports (PWA purity).

## 6. Demo surfaces (`src/apps/demo`)

All use `DemoSurface.tsx` (title, subtitle, optional `futureScope` second badge+line; always a `DemoBadge`). Persona on all four: Kirsty.

**DemoControlPanel.tsx** (`/demo/control`, 510 lines). Sections: (a) Clock & reset: live date/time, the six `demoClockShortcuts` buttons, "Reset demo data" with confirm (`resetDemo`). (b) Scenario jumps S1 to S5 (:250-348; `ScenarioJumps` :351): each "Jump" confirms, calls `resetDemo(useAppStore)` then stages, shows message + nav buttons:
 - S1 booking to theatre: reset only; message directs to Fire hospital message MSG-STG-1001 then Procedure day 28 Jul (HL7 flagged Future scope). nav Mobile, Integrations.
 - S2 office day: reset only; nav Admin.
 - S3 money: reset; verifies seed lists `souterMon20Am`/`souterMon20Pm` are SUBMITTED; nav Admin.
 - S4 exceptions: reset only; text walks prepayment warning, Stage post-op, billing failure, MSG-CPH-2001 + feed fix, half payment. nav Mobile, `/admin/billing`.
 - S5 compliance tour: reset, then `editProcedure` x2 (SOUTER_ACTOR asaClass AS2 then AS1), `editBooking` (OFFICE_ACTOR note) on seed marker `overriddenTimeUnitsBooking`, `authoriseList(whitakerFri17)`; nav Admin, Xero sim.
 (c) Demo actions index by screen (`DemoActionsIndex` :448): lists `DEMO_TRIGGERS` grouped by `screen`; "Open screen" button -> `navigate(indexPath)`; note under Billing monitor that Run payables is product UI. (d) Static callout: billing rounding assumption (partial intervals round up per started interval; 15 min then 10 min after 2h; "to confirm with AA").

**DemoXero.tsx** (`/demo/xero[/invoices[/:accRecId]]`, 759 lines + `xeroPairView.ts`). Simulated Xero org, read-only except the settle button. Two callouts: NHI never resides in Xero (Appendix 2 vs Appendix 1 contradiction, flagged unresolved) and duplicate-invoice-number prevention org setting (open item). Tabs: Contacts (ContactID, ContactNumber, Name, Type chip, Archived; empty note if none) and Invoices (pairs table; row click -> detail). Pair detail: ACCREC card (amounts, balance, status, lines) and ACCPAY card (gross, service fee rate/amount, total payable, authorised, disbursed, remaining), engine-link callout (case ref, booking id, billing invoice id; patient NAME only, no NHI), money-flow cards ("ACCREC money into AA", "ACCPAY money out of AA"), incomplete-pair warning. Button "Simulate payment and payout" / "Pay <anaesthetist> now" (`settleInvoice` :230-258): `receivePayment(useAppStore,{accRecId, amount: balance, idempotencyKey:'DEMO-INVOICE-SETTLEMENT-<accRecId>', source:'webhook'})` then `disbursePayable(useAppStore, OFFICE_ACTOR, accPayId)`; this is a demo action NOT in the registry (a second payment path next to the `payment-*` triggers). "View in Dr Souter's account" link to `/web/accounts/payments?invoice=<number>` only when payment received and anaesthetist is Souter. Volume callout: `settings.volumeStory` (soft limit, invoices/year, one-time %, active contacts, nightly archive; "scale is narrated with counters, not simulated"). `xeroPairView.ts:74` `xeroInvoicePairViews` joins xero.accRecs/accPays/contacts + billing invoices/cases + schedule/masters; marks `incomplete`; ACCPAY bill number = `<invoiceNumber>-P`.

**DemoIntegrations.tsx** (`/demo/integrations`, 587 lines; badged Future scope, `futureScope` text: HL7 v2, FHIR R4, near real time are Future scope; in scope is the St George's / Southern Cross download into a matching screen). Feed tabs STG / CPH / SX (`FEED_ORDER`), message library from `CANNED_MESSAGES` per feed, three panes for the selected message: raw HL7 (`Hl7View`) or FHIR native, translated FHIR R4 (`extractViaMapping`/`extractFromFhir`/`toFhirBundle` using the LIVE feed mapping + Souter HPI), schedule-change effect from the integration-log row (status sentence, failure reason, resulting booking). Actions calling the store: per-row Replay and header Replay -> `processMessage(useAppStore, id)`; "Start live feed" drips one canned message per second via `setInterval` (:62-77); "Reset demo data" (confirm) -> `resetDemo` + local state reset. Feed mapping reference list; callout "Target state: FHIR-first via the Digital Services Hub" (Keycloak, NHI FHIR API referenced, not implemented). Publishes `integrationsSim.selectedMessageId`. Fire/replay via the bar menu also work here (routes include `/demo/integrations`).

**DemoData.tsx** (`/demo/data`, 643 lines). Data inspector: entity counts, persisted payload size vs `STORAGE_BUDGET_BYTES`, `persistStatus()` (latched-off writes), "Today's Lists" with "two Lists per anaesthetist per day" check (`twoPerDayOk` :163), seeded scenario finder (`SEED_MARKERS` select, shows entity), audit trail by entity id (`audit` filter), lifecycle states table (DRAFT/SUBMITTED/AUTHORISED filter), and a Guard console: choose persona (souter / kirsty / integration feed), action (complete/cancel/edit booking, submit/authorise list), target; `runGuard` (:244-270) calls `completeBooking`, `cancelBooking`, `editBooking`, `submitList`, `authoriseList` and renders the Outcome (ok + audited, or refusal message). Audit/diagnostic tool; not contextual.

Tests: `DemoXero.test.tsx`, `xeroPairView.test.ts`.

## 7. PWA (`src/pwa`, `pwa/`)

- **Host** `MobileViewport.tsx`: replaces PhoneFrame. Full-size box, `position:relative`, `overflow:hidden`, real `env(safe-area-inset-*)` via `aa-inset-device`, `--aa-viewport-shortfall` correction (`viewportMetrics.ts`, iOS standalone height bug), atmosphere via `useMobileGradient` + `AtmosphereLayer` (imports Gradient Lab hook files directly, not the lab), mounts `UpdatePrompt` + `PwaDemoActions` as host chrome.
- **Demo panel** `PwaDemoPanel.tsx` (574 lines), injected through `MobileApp`'s `moreExtra` slot (`apps/mobile/routes.tsx:177`, `outlet.ts:20`, `MoreScreen.tsx:72`), so it shows only under More. Order (:563-573): `InstallCoach`, `DemoClockCard` (big clock + same six `demoClockShortcuts`; "Start now and Finish now stamp from this clock"), `OfficeSimulationCard` ("Play the office" switch; copy `OFFICE_SIM_COPY`; `DemoBadge "Simulated office"` while on), `ResetCard` (bottom-sheet confirm; first `resilientLocalStorage.removeItem(PERSIST_KEY)`, then `resetDemo(useAppStore)`, then `clearInstallCoachDismissal()`), `BuildCard` (build id, release date, cold launch ms, offline-ready via service worker, saved data MB / "paused after a storage error", "Check for updates"), `ViewportCard` (iOS viewport diagnostics, shortfall probe band, copy diagnostics; marked deletable). MoreScreen itself shows `DemoBadge "Demo prototype"` and copy (`MoreScreen.tsx:62-68`; without `extra` it says "Use the demo control panel").
- **Demo sheet** `PwaDemoActions.tsx`: section 5.
- **Office simulation** `officeSimulation.ts` (216 lines): PWA-only; localStorage flag `aa-office-simulation` (default OFF; only 'on' reads as on). `wireOfficeSimulation(api)` subscribes to the store, detects DRAFT -> SUBMITTED transitions on a List (so the seeded SUBMITTED review queue is untouched), after `OFFICE_SIM_DELAY_MS = 4000` calls `authoriseAsSimulatedOffice` (store/officeStandIn.ts), re-arming while the toggle is off. Documented as explicitly NOT the RFP flow (real flow: submit goes to the office review queue). Per-List "Office authorises this List" trigger is the preferred handset story (stage: submit on phone, then Demo chip, then Next morning on More to move Balances).
- **Install / update** `installPrompt.ts` (module-level `beforeinstallprompt` capture, dismissal key), `InstallCoach.tsx` (iOS/Android Add-to-Home-Screen coaching, hidden when standalone), `UpdatePrompt.tsx` (`useRegisterSW`, 60s poll, "reload" pill, never auto-reloads), `swRegistration.ts`, `bootMetrics.ts`, `BootMark.tsx`. Platform plumbing, no domain logic.
- Tests: `officeSimulation.test.ts`, `installPrompt.test.ts`, `viewportMetrics.test.ts`, `pwaPurity.test.ts`.

## 8. PhoneFrame and Gradient Lab (framed build)

- `src/shell/PhoneFrame.tsx` (320 lines): simulated iOS device, fixed 390x844 logical, bezel, dynamic island, fake status bar showing the DEMO clock (`useClockTimeLabel`), home indicator; presenter zoom control (50-130%, +/-/Fit; scale in localStorage `aa-phone-scale`; auto-fit on resize until user zooms). Supplies the `--aa-inset-*` vars (54/34 fake). Renders `<GradientLab/>` when `labController !== null`. Passed to `MobileApp` as `host` in router.tsx:146.
- `src/shell/gradientLab/` (GradientLab.tsx 497 lines, `useGradientLab.ts`, `AtmosphereLayer.tsx`): presenter tool tuning the mobile background gradient; behind `GRADIENT_LAB_ENABLED = true` (`src/theme/gradientLabGate.ts`); tested by `gradientLabPurity.test.ts`. Visual only, no domain data.

## 9. Stubbed, hardcoded, visual-only

- Personas hardcoded (2); no sign-in/role switching UI. Sign-in/MFA/reset only exist as the "Simulate sign-in attempts" trigger adding audit rows.
- Seed-scoped triggers hardcoded to seed ids: billing failure (`SEED_LIST_IDS.billingFailure`, COS ACC contract end-dated `2026-07-15`), post-op (Sharma 14 Jul AM), ingest-PDF (PDF row R2 -> Souter Mon 27 Jul AM), PWA payments limited to Souter's invoices, S1 procedure day `2026-07-28`, scenario text refers to specific seeded patients (Sarah Mitchell, Losa Tuilagi, Hemi Walker, David Chen). Any seed change needs `PERSIST_VERSION` bump and these checked.
- Scenario jumps S1, S2, S4 only reset and print instructions; they stage nothing (S3 only verifies, S5 stages edits).
- HL7/FHIR simulator: canned messages (`domain/integrations`), "live feed" is a 1 msg/sec timer; FHIR translation is local; Keycloak/Hub/NHI API are text only.
- Xero sim: entirely in-store mirror; `settleInvoice` demo path bypasses the trigger registry; NHI-in-Xero policy shown as an unresolved callout, billing rounding assumption is a static note.
- Office simulation and "Office authorises this List" are stand-ins (audit actor "AA office (simulated)"), explicitly not RFP behaviour.
- PhoneFrame chrome (status bar, island, battery) and Gradient Lab are visual only. Demo clock label is shown but real time is never used.
- Trigger memory and published context are in-memory only; a reload forgets "Replay" targets.
- Requirements Board link is dev-only.

## 10. Where to look for...

- Add a demo button on a screen: `src/shared/demoTriggers/registry.ts` (+ `context.ts` for screen state).
- Bar layout/controls: `src/shell/AppShell.tsx:219-303`; persona/app list: `src/shell/appConfig.ts`.
- Clock behaviour: `src/store/clockActions.ts`, `src/domain/clock.ts`, `src/shared/demoClockShortcuts.ts`.
- Reset: `resetDemo` (`clockActions.ts:110`) -> `resetDomainState` (`store/mutate.ts`); PWA also clears `PERSIST_KEY`.
- Payment/billing demo flow: `sendPaymentWebhook` (registry.ts:112), `store/paymentActions.ts:78`, `store/payablesActions.ts:160`, `store/billingRun.ts`, `store/xeroHandoff.ts`.
- Office stand-in: `src/store/officeStandIn.ts`, `src/store/demoActors.ts`.
- Scenario scripts: `DemoControlPanel.tsx:250-348` (docs mirror: `docs/demo-guide/`).
- Existing tests for this area: `src/shell/*.test.tsx`, `src/shared/demoTriggers/demoTriggers.test.ts`, `src/pwa/*.test.ts`, `src/apps/demo/*.test.*`.
