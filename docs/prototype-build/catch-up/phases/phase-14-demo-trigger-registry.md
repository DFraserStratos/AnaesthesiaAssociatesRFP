# Phase 14 · Screen-contextual demo triggers

**Requirements covered:** [FT-13.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-13.5.md) (Roles, permissions and audit: the "Simulate sign-in attempts" beat), with its children [US-13.5.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.5.1.md) and [US-13.5.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.5.2.md) (already Matches; must stay green). Also treated here, without closing them: [RV-22](../analysis/reverse-check.md) (PWA "Play the office": kept as a signposted scaffold, default OFF, badged, plus a per-List stand-in), and interim Future-scope badges for [RV-05](../analysis/reverse-check.md) and [RV-06](../analysis/reverse-check.md) (closed in Phase 34). No DM items.
**Depends on:** none. Runs first alongside Phase 15, in either order. If 15 has not run yet, 15's Card to Booking rename also covers this phase's registry labels, route patterns and result messages.
**Estimated:** 2 sessions, and full ones. Session 1 re-homes every existing trigger and re-greens (three existing Playwright specs plus a new one, 18 capture recipes and ATLAS); session 2 adds the new pieces (sign-in trigger, PWA sheet, office stand-in, Future-scope badges, demo guide, review pass). If session 1 runs long, move the capture-recipe and ATLAS edits to the start of session 2 rather than cutting tests.

## Goal

Every demo action moves to the screen it belongs to. One shared, pure trigger registry in
`src/shared/demoTriggers/`, modelled on `src/shared/demoClockShortcuts.ts`, describes each trigger:
the route patterns it belongs to, the surfaces it shows on (harness bar, PWA sheet, or both), a
`run(api, ctx)` that acts on the entity in the URL or on screen state published through a small
`useDemoTriggerContext` hook, and a disabled state. The harness bar gains one "Demo actions" pill that
lists only the current screen's triggers; the installed PWA gets the same list as a badged bottom
sheet. The Control Panel stops carrying triggers and becomes the index (scenario jumps, clock and
reset stay; every trigger is listed under its screen with a link that opens it). The PWA's
"Play the office" defaults to OFF and is badged when on, replaced in the story by a per-List
"Office authorises this List". The HL7/FHIR tooling gets interim "Future scope" badges and S1 gets a
caveat, until Phase 34 rebuilds S1. The first new trigger is FT-13.5's "Simulate sign-in attempts"
on the Admin Audit screen.

This is plumbing that every later phase registers into (16's AA fee run, 21's contract approval
stand-in, 27's prepayment stand-in, 31 to 33's schedule and intake stand-ins, 39, 40). Get the
contract right; do not build their triggers here.

## Before you start: drift check

1. Run:

   ```
   git diff 501b0b8 -- "docs/discovery-reference/Updated Requirements/catalogue/requirements/FT-13.5.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-13.5.1.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-13.5.2.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-07.2.2.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/US-07.3.1.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/FT-14.1.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/FT-14.2.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/FT-14.3.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/FT-14.5.md" "docs/discovery-reference/Updated Requirements/catalogue/requirements/FT-14.6.md"
   ```

   (At plan time, 2026-09-30, the whole catalogue had no diff against `501b0b8`.)
2. **FT-13.5** (Proposed): if its technical discussion no longer proposes MFA for Admin, self-service
   password reset or logged login attempts, adjust the sign-in trigger's rows to match. If it is now
   Retired or Future, drop work item 9 and note it in PROGRESS.md; the rest of the phase stands (it is
   demo plumbing, not a requirement).
3. **FT-14.1, 14.2, 14.3, 14.5** (all Future at `501b0b8`): if any came back into scope, remove that
   part of the Future-scope badge and the S1 caveat, and tell the owner, because Phase 34's plan
   changes too.
4. **US-07.2.2 / US-07.3.1** (office review before authorise): if the catalogue now allows an
   anaesthetist submit to authorise directly, raise it with the owner before changing RV-22 handling.
5. **Open questions:** none block this phase. No owner decision (D1 to D11) gates it.
6. Record the drift-check result in the PROGRESS entry.

## Reference

**Design files (convention 17):**
- `docs/design/Design Language.dc.html`: tokens for the popover and sheet (neutrals, radii `ctl 10` /
  `card 14` / `sheet 24-top`, elevation e-2 for the popover, scrim, the `sheet-in` 320/260ms motion,
  reduced-motion 80ms fades). Teal `#0D6E63` for the Run buttons; crimson never.
- `docs/design/Mobile App.dc.html`: the bottom-sheet pattern the PWA sheet follows, and the header
  and dock positions its floating chip must clear.
- The harness bar has no mockup: it is prototype chrome. Copy `src/shell/DemoClockMenu.tsx` exactly
  (34px white-on-ink pill, popover anchored `top: calc(100% + 8px); right: 0; zIndex 120`, Esc and
  outside-click close, `role="dialog"`, `aria-expanded` / `aria-controls`).

**Catalogue:** FT-13.5, US-13.5.1, US-13.5.2 (above). Context only: US-07.2.2, US-07.3.1 (why
"Play the office" is a scaffold), FT-14.1, FT-14.2, FT-14.3, FT-14.5 (Future), FT-14.6.

**Analysis:**
- `../analysis/prototype-map-shell-demo-pwa.md`: the whole file, especially section 5.1 (every
  Control Panel trigger and its store call), section 7 (PWA entry, `PwaDemoPanel`, office simulation)
  and section 9 (extension points).
- `../analysis/prototype-map-admin.md` sections 6, 7, 10 and the Integrations section (tabs are local
  state, not URL-routed).
- `../analysis/reverse-check.md`: RV-05, RV-06, RV-22.
- `../GAP-ANALYSIS.md`: "Demo-trigger buttons", "Remove or rework", "Demo impact (S1 to S5)";
  `../epics/EP-13.md#ft-13.5`.
- `../ROADMAP.md`: "Demo triggers", "PWA parity", "Demo guide".

**Code entry points:**
- `aa-prototype/src/shared/demoClockShortcuts.ts`: the pattern to copy (pure, returns `{id, label,
  icon, run, disabled}`; consumed by the bar, the Control Panel and the PWA panel).
- `aa-prototype/src/shell/AppShell.tsx` (right-hand group, about `:100-128`: persona, `AppSwitcher`,
  `DemoClockMenu`, `DemoResetButton`), `DemoClockMenu.tsx`,
  `DemoResetButton.tsx`, `appConfig.ts`.
- `aa-prototype/src/apps/demo/DemoControlPanel.tsx`: local `OFFICE` / `SOUTER` actors (`:49-50`; the
  prototype map's `:38-39` is stale),
  `triggerBillingFailure` (`:155`), `stagePostOpScenario` (`:179`), `SCENARIOS` (`:360`),
  `PaymentReceivedCard` (`:538`), `IntegrationTriggerCard` (`:633`), `PdfArrivalCard` (`:693`),
  `HandoffFaultCard` (`:734`), `AutomatedJobsCard` (`:767`).
- `aa-prototype/src/apps/demo/DemoXero.tsx` (`/demo/xero/invoices/:accRecId`, `settleInvoice`, its own
  local `OFFICE` actor at `:12`),
  `DemoIntegrations.tsx` (`selectedId` local state, `:44`).
- `aa-prototype/src/apps/admin/screens/AuditViewer.tsx` (entity filter derived from the data, `:47`),
  `BillingMonitorScreen.tsx` (its own product "Run payables" button, `data-shot="billing-payables-run"`,
  `:124-141`),
  `IntegrationMonitorScreen.tsx` (`Tab` type `:25`, `tab` state `:40`, header comment `:31`,
  `SurgeonPdfsTab` with its own product "Ingest row" / "Ingest all rows" buttons `:205`),
  `InvoicesScreen.tsx` / `InvoiceDocument.tsx`, `ReviewScreen.tsx`, `AdminCardDetail.tsx`;
  `aa-prototype/src/apps/admin/routes.tsx` (route elements) and `aa-prototype/src/router.tsx` (the URL
  map every pattern below is checked against); `AdminApp.tsx:25` (the office actor).
- `aa-prototype/src/apps/mobile/MobileApp.tsx`, `navigation.ts` (`listsStackLocation`),
  `screens/BalancesScreen.tsx`.
- `aa-prototype/src/pwa/PwaDemoPanel.tsx` (`OfficeSimulationCard` `:191`), `officeSimulation.ts`
  (`OFFICE_SIMULATION_ACTOR`, `playTheOffice`, `isOfficeSimulationEnabled`; + test), `MobileViewport.tsx`
  (host chrome seat beside `UpdatePrompt`, inside the `position: relative` root that `BottomSheet`
  needs), `pwaPurity.test.ts` (`FORBIDDEN`), `aa-prototype/pwa/main.tsx`.
- Store: `mutate.ts`, `demoSettingsActions.ts` (`armHandoffFault`, the audited demo-action pattern),
  `paymentActions.ts` (`receivePayment`), `integrationActions.ts` (`processMessage`, `ingestPdfRow`),
  `selectors.ts` (`openAccRecs`), `clockActions.ts` (`DEMO_ACTOR`), `index.ts` exports.
- `aa-prototype/src/shared/audit/actionLabels.ts`, `fieldLabels.ts` and `auditNarrative.test.ts` (a
  source scan of `src/store/**` for `action: '<code>'` literals: every emitted code needs a label, and
  no label may be unused), `src/shared/DemoBadge.tsx`, `src/shared/surface/BottomSheet.tsx`.
- Seed constants: `SEED_LIST_IDS`, `listIdForSlot`, `ANAE`, `CONTRACT` (`src/domain/seed`),
  `CANNED_MESSAGES`, `SURGEON_PDFS` (`src/domain/integrations`).
- Tests that drive the Control Panel triggers today: `aa-prototype/visual/admin-phase09.spec.ts`
  ("Trigger failure", `:12-14`), `visual/admin-phase08.spec.ts` ("Arm handoff failure", `:308-311`),
  `visual/phase12.spec.ts` (asserts the four Control Panel group headings `:20-23`, then "Ingest PDF
  row" and "Run reconciliation poll" `:37-43`). `mobile-phase04`, `card-calculation-display`,
  `xero-pair` and `admin-phase08` also visit `/demo/control` for the clock only (unchanged);
  `screens.spec.ts` screenshots the page. The PWA project matches only `visual/pwa-device.spec.ts`
  (`playwright.config.ts`).
- Outside the app, consumers of the Control Panel triggers: 18 capture recipes in
  `requirements-board/capture/recipes/` (for example US-09.2.1, US-09.2.2, US-09.2.3, US-09.2.4 and
  US-14.5.1 use `[data-shot=control-payment-webhook]`, `control-scheduled-jobs`,
  `control-integration-message`; others click "Trigger failure", "Stage scenario" or "Record payment")
  and the "Demo control panel" section of `requirements-board/capture/ATLAS.md`.

## Work items

### Session 1: the registry, the bar menu, and every existing trigger re-homed

1. **Shared actors** (new `src/store/demoActors.ts`, exported from `src/store/index.ts`):
   `OFFICE_ACTOR` (`Kirsty W.`, office), `SOUTER_ACTOR` (Dr Melanie Souter, `ANAE.souter`) and
   `OFFICE_SIMULATION_ACTOR` (`AA office (simulated)`, office role and source; today a private const in
   `officeSimulation.ts`, moved with its name and comment). Delete the local copies in
   `DemoControlPanel.tsx`, `DemoXero.tsx` and `officeSimulation.ts` so there is one of each;
   `AdminApp.tsx` and `DemoData.tsx` may import `OFFICE_ACTOR` too, with no behaviour change.
2. **Office stand-in store action** (`src/store/officeStandIn.ts`):
   `authoriseAsSimulatedOffice(api, listId): Outcome<{ billed: boolean }>`, lifted from
   `playTheOffice` in `officeSimulation.ts`: refuse unless the List exists and is SUBMITTED; call
   `authoriseList` as `OFFICE_SIMULATION_ACTOR`; if the wired billing run has not billed it
   (`isListBilled`), fall back to `runBillingForList` + `handoffListCases`. `officeSimulation.ts` calls
   it (keeping its silent, try/catch timer behaviour). Vitest: refuses DRAFT and AUTHORISED; with and
   without `wireBillingRun` the List ends AUTHORISED and billed exactly once.
3. **Registry types, matcher, memory and context** (new folder `src/shared/demoTriggers/`, pure
   TypeScript with no React except `context.ts`; its own `index.ts`, imported by path like
   `demoClockShortcuts.ts`, and **not** re-exported from the `src/shared/index.ts` component barrel, so
   every screen that imports a shared component does not also pull in the store and seed):
   - `types.ts`:

     ```ts
     type DemoTriggerSurface = 'bar' | 'pwa'
     interface DemoTriggerCtx {
       pathname: string
       params: Readonly<Record<string, string>>      // from the matched route pattern
       published: Readonly<Partial<DemoContextValues>> // from useDemoTriggerContext
     }
     interface DemoTrigger {
       id: string                    // stable, kebab-case; also the data-shot suffix
       label: string                 // button text; no en or em dashes
       description: string           // one line: what it will do, stated before firing
       screen: string                // index heading, e.g. 'Admin · Billing monitor'
       routes: readonly string[]     // react-router matchPath patterns
       surfaces: readonly DemoTriggerSurface[]
       badge?: 'future-scope' | 'office-stand-in'
       when?: (state: AppState, ctx: DemoTriggerCtx) => boolean       // visibility on a matched route
       choices?: (state: AppState, ctx: DemoTriggerCtx) => readonly { id: string; label: string }[]
       disabledReason: (state: AppState, ctx: DemoTriggerCtx, choiceId?: string) => string | null
       run: (api: AppStoreApi, ctx: DemoTriggerCtx, choiceId?: string) => { ok: boolean; message: string }
       indexPath: (state: AppState) => string | null  // where the Control Panel's "Open screen" goes
       indexHint?: string            // shown beside "Open screen" when the entry also needs a step
                                     // the URL cannot carry, e.g. 'Then open the Surgeon PDFs tab'
     }
     ```

   - `match.ts`: `demoTriggersFor(state, pathname, surface, published)` returns the visible entries
     with their resolved `ctx`, in registry order. Matching uses `matchPath` from `react-router-dom`
     against the full pathname; the mobile Lists splat is registered as explicit patterns
     (`/mobile/lists`, `/mobile/lists/:listId`, `/mobile/lists/:listId/cards/:cardId`), consistent
     with `listsStackLocation`.
   - `memory.ts`: a tiny non-persisted zustand store (`create`, no `persist`) for per-trigger memory
     that "Replay" needs (last fired message id; last webhook `{accRecId, key, amount}`; the webhook key
     counter). Memory is shared across screens, so a message fired on mobile can be replayed from Admin.
     A replay against an entity a reset has removed refuses with a readable message rather than
     throwing.
   - `context.ts`: `useDemoTriggerContext(key, value)` sets `value` under a typed key on mount and on
     change, and deletes it on unmount; `DemoContextValues` is the typed map of keys
     (`'integrations.tab'` and `'integrationsSim.selectedMessageId'` in this phase; later phases add
     keys). A non-persisted zustand store, so no `PERSIST_VERSION` change, and it
     holds only UI state, never domain state.
   - The registry module imports store actions from `src/store` and seed constants from
     `src/domain`, and nothing from `src/apps/*` or `src/shell/*` (the PWA closure will contain it).
     No `Date.now()`, `new Date()` or `Math.random()`; time comes from the demo clock via the store.
     Prefer the entity in the URL or the published context over a hardcoded seed id; where an entry is
     inherently tied to a seeded scenario, name the seed constant and gate it with `when`.
4. **Re-home every Control Panel trigger into the registry** (`src/shared/demoTriggers/registry.ts`).
   Bodies move verbatim from `DemoControlPanel.tsx`, then read their target from `ctx` where the brief
   says so. Messages keep today's wording except where it tells the presenter to go to the Control
   Panel.

   | id | Label | Screen (routes) | Surfaces | Acts on | Disabled when |
   |---|---|---|---|---|---|
   | `billing-failure` | Trigger billing failure | Admin · Billing monitor (`/admin/billing`) | bar | `SEED_LIST_IDS.billingFailure` (seeded scenario): `editContract(CONTRACT.cosAcc, effectiveTo 2026-07-15)`, submit if DRAFT, `authoriseList` | List missing, or `billedAtISO` set ("Already triggered") |
   | `arm-handoff-fault` | Arm handoff failure | Admin · Billing monitor | bar | `armHandoffFault` | `settings.failNextHandoff` ("Armed") |
   | `run-reconciliation-poll` | Run reconciliation poll | Admin · Billing monitor; Xero sim (`/demo/xero`, `/demo/xero/invoices`, `/demo/xero/invoices/:accRecId`) | bar | `runReconciliationPoll` | never |
   | `run-archive-job` | Run archive job | Admin · Billing monitor; Xero sim | bar | `runArchiveJob` | never |
   | `stage-post-op` | Stage post-op scenario | Admin · Review (`/admin/review/:listId`) and Admin · Card detail (`/admin/day/:dateISO/cards/:cardId`) | bar | `when`: the URL's List (or the Card's List) is `listIdForSlot(ANAE.sharma, '2026-07-14', 'AM')`; submit if DRAFT, then authorise | List already AUTHORISED ("Already staged: use Add post-op event on the Card") |
   | `ingest-pdf-row` | Ingest PDF row | Admin · Integrations (`/admin/integrations`) | bar | `when`: published `integrations.tab === 'pdfs'`; exactly today's body: `SURGEON_PDFS[0]` row `R2` onto `listIdForSlot(pdf.targetList...)` via `ingestPdfRow(OFFICE_ACTOR, ...)`; `indexHint` "Then open the Surgeon PDFs tab" | sample row missing |
   | `payment-full` / `payment-half` | Payment received · full / Payment received · half | Admin · Invoice (`/admin/invoices/:invoiceId`) and Xero sim pair (`/demo/xero/invoices/:accRecId`) | bar | the ACCREC for the invoice in the URL (`xero.accRecs` where `invoiceId` matches) or the `accRecId` in the URL; `receivePayment` with key `WEBHOOK-<accRecId>-<n>`, `source: 'webhook'`; half = `roundToCents(remaining / 2)`, falling back to the full remaining when that rounds to 0, exactly as today | no ACCREC yet ("Not handed off to Xero"), or nothing remaining ("Fully paid") |
   | `payment-replay` | Replay last payment event | same as above | bar | reuses the remembered key; shows the idempotent no-op | nothing remembered |
   | `fire-hospital-message` | Fire hospital message | Integrations sim (`/demo/integrations`), Admin · Integrations, Mobile · Lists (the three `/mobile/lists` patterns) | bar and pwa | `choices`: `CANNED_MESSAGES` (default MSG-STG-1001; on the simulator the published `integrationsSim.selectedMessageId` preselects); `processMessage` | never |
   | `replay-hospital-message` | Replay last message (dedupe) | same | bar and pwa | the remembered message id | nothing remembered |

   **"Run payables" is not registered.** The Control Panel's button called the same
   `runPayables(OFFICE)` that the Billing monitor's own product "Run payables" button already calls, and
   the ROADMAP rule is that product actions stay in the product UI, not the bar. Its re-homed home is
   that existing button; the Control Panel copy is simply deleted, and the index notes it in one line
   ("Run payables: the Billing monitor's own button"). Nothing is wired to a clock tick, so there is no
   scheduled run to simulate.

   `fire-hospital-message` and `replay-hospital-message` carry `badge: 'future-scope'`. Their
   `indexPath` values give the Control Panel a concrete destination (for example
   `/admin/review/<Sharma Tue 14 AM id>`, `/admin/invoices/<first open non-backdrop invoice>` via
   `openAccRecs`, or `null` with the reason shown when there is none yet).
5. **Harness-bar menu** (`src/shell/DemoActionsMenu.tsx`, inserted in `AppShell.tsx` between
   `<AppSwitcher/>` and `<DemoClockMenu/>`):
   - One pill, "Demo actions" with a count and the `FlaskConical` icon, styled like the clock pill.
     It is **not rendered** on a screen with no bar entries, so the 48px bar never grows where it has
     nothing to offer. It never wraps or overflows at 1280px wide; below that its label may collapse to
     icon plus count.
   - Popover (about 360px, `role="dialog"`, e-2, radius `card`): a `DemoBadge label="Demo trigger"`
     heading, then one row per entry: label, one-line description, a "Future scope" badge where set, a
     native `select` when the entry has `choices`, and a teal Run button (disabled with the reason
     shown beneath). A `role="status"` result line under the row shows `run`'s message. The popover
     stays open after a run (like the clock menu), and Esc or an outside click closes it.
   - It reads `useLocation().pathname`, the store state and the published context; it re-evaluates
     `when` / `disabledReason` live as the store changes.
   - Hooks: `data-shot="demo-actions"` on the pill, `data-shot="demo-action-<id>"` on each row.
6. **Publish screen state the URL cannot carry** (`useDemoTriggerContext`):
   `IntegrationMonitorScreen` publishes its `tab` as `integrations.tab`; `DemoIntegrations` publishes
   `selectedId` (`:44`) as `integrationsSim.selectedMessageId`. Nothing else in this phase.
7. **Control Panel becomes the index** (`DemoControlPanel.tsx`):
   - Remove `IntegrationTriggerCard`, `PdfArrivalCard`, the billing-failure and post-op cards,
     `PaymentReceivedCard`, `HandoffFaultCard`, `AutomatedJobsCard` and their handlers and state, and the
     imports they leave unused.
   - Keep "Clock & reset", "Scenario jumps · S1 to S5" and the billing-assumption callout unchanged in
     behaviour.
   - Add "Demo actions by screen": `DEMO_TRIGGERS` grouped by `screen`, each row with its label,
     description, badges, where it shows ("Harness bar", "Installed PWA", or both) and an "Open screen"
     button that navigates to `indexPath(state)` (disabled with the reason when `null`). PWA-only
     entries are listed with "Shown in the installed PWA" and no link. An `indexHint` shows beside its
     button.
   - Update the subtitle and the scenario-jump messages: S1 points at Mobile Lists, Demo actions,
     Fire hospital message; S4 names each beat's screen and its Demo actions entry; S5 fires
     MSG-STG-1002 from Admin Integrations. The S1 message carries the Future-scope caveat (work item 12).
8. **Tests and hooks move with the triggers, then re-green** (end of session 1):
   - Vitest `src/shared/demoTriggers/demoTriggers.test.ts`: ids unique; every label and description
     free of `–` and `—`; every bar entry's `indexPath` (on the pristine seed, where non-null) makes
     `demoTriggersFor(state, indexPath, 'bar', published)` include that entry (with `published`
     `{ 'integrations.tab': 'pdfs' }` for the entry whose `indexHint` names that tab), which also proves
     `when` passes there; `demoTriggersFor(state, '/admin/billing', 'bar')` returns exactly the four
     billing-monitor entries; `/admin/day/2026-07-21` returns none; `stage-post-op` is visible on
     Sharma's Tue 14 AM review URL and absent on another List; `ingest-pdf-row` appears only when
     `integrations.tab` is `pdfs`; pwa-only entries never appear for `'bar'`; each re-homed body
     reproduces the Control Panel's effect (billing failure fails the COS Card and bills its sibling;
     PDF ingest creates then updates the same Card; half then replay applies once; poll and archive
     return their counts).
   - Vitest for `useDemoTriggerContext` (renderHook: set on mount, updated on change, removed on
     unmount) and a component test for `DemoActionsMenu` (hidden on a route with no entries; lists
     entries on `/admin/billing`; Esc closes; a run shows its result).
   - Playwright: re-point `visual/admin-phase09.spec.ts` (billing failure from the Billing monitor
     menu), `visual/admin-phase08.spec.ts` (arm the handoff fault from the Billing monitor menu, then
     the same Review walk) and `visual/phase12.spec.ts` (replace the four group-heading assertions with
     the index's headings; PDF ingest from Admin Integrations, Surgeon PDFs; poll from the Billing
     monitor). Add `visual/demo-actions.spec.ts`: the pill is absent on the Day view, present with four
     entries on the Billing monitor, and a half payment from an invoice page moves that invoice's money
     chip (`data-shot="invoice-money-states"`).
   - Capture runner: the runner hides the whole harness bar with CSS (`HIDE_HARNESS` in
     `requirements-board/scripts/capture.ts`), so a recipe cannot click the "Demo actions" pill. Add a
     `{ "trigger": "<id>", "choice"?: "<value>" }` step type: it lifts the hide style, opens
     `[data-shot=demo-actions]`, sets the row's `select` if `choice` is given, clicks the Run button in
     `[data-shot=demo-action-<id>]`, waits for the row's `role="status"` line, closes the popover with
     Esc and restores the hide style, failing the recipe if the row is missing or disabled. Document it
     in ATLAS.md's recipe format and add it to `validate()`. Recipes then stage every per-screen trigger
     with this step, never with a `/demo/control` click.
   - Capture recipes: update each of the 18 `requirements-board/capture/recipes/*.json` that clicks a
     Control Panel trigger (scenario jumps, clock and reset steps stay as they are): `goto` the
     trigger's screen, then a `trigger` step for the entry; move `highlight` selectors to the new hooks. A recipe that clicked
     the Control Panel's "Run payables" clicks the Billing monitor's own button
     (`[data-shot=billing-payables-run]`) instead. Rewrite the "Demo
     control panel" section of `requirements-board/capture/ATLAS.md` to describe the index and the
     per-screen menu. The catalogue images are re-captured in the Catalogue screenshots step. Run `npm run verify:board`.
   - `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots` green before session 2.

### Session 2: the new pieces

9. **FT-13.5 "Simulate sign-in attempts"** (`src/store/authDemoActions.ts`, exported from the store):
   `simulateSignInAttempts(api)` appends audit rows through `mutate()` only (several `mutate` calls,
   one per actor), with no change to any domain slice:
   - `account.provisioned`: Kirsty W. (office) provisions Dr Souter's account;
     `after: { credentialsVisibleToAdmin: false, provider: 'Identity provider (simulated)' }`.
   - `auth.signIn`: Kirsty W. signs in to the Admin app; `after: { mfa: 'passed', ... }`.
   - `auth.signInFailed`: a failed Admin attempt for Kirsty W. (`after: { reason: 'Incorrect password' }`).
   - `auth.passwordReset`: Dr Souter resets her own password (self-service; source anaesthetist or
     system as the session judges, stated in the PROGRESS entry).
   - `auth.signIn`: Dr Souter signs in to the mobile app with social login
     (`after: { provider: 'Apple (social login)', app: 'Mobile' }`), so the log shows FT-13.5's
     Google/Apple one-tap path too.
   Entity type `account` (`MutationMeta.entityType` is a plain string, so no type change); entity id
   `ANAE.souter` for Dr Souter and a fixed `OFFICE_ACCOUNT_ID` constant in `demoActors.ts` for
   Kirsty W., who has no seeded id. Each recipe returns `{}`, so only `audit` and `counters` change.
   Write each code as an `action: '<code>'` literal (the label scan in `auditNarrative.test.ts` reads
   store sources for that form). Add the four codes to `ACTION_LABELS` ("Account provisioned", "Signed
   in", "Sign-in failed", "Password reset by user"; the MFA result reads from the `mfa` field), and
   labels for the new `after` keys (`mfa`, `reason`, `provider`, `app`, `credentialsVisibleToAdmin`) to
   `FIELD_LABELS`, so the viewer's Change column reads as English. Register `simulate-sign-in` on Admin · Audit (`/admin/audit`),
   bar only. The Audit viewer's entity filter picks up `account` from the data; nothing else in the
   viewer changes. Vitest: five rows with the expected actions, roles and sources; domain slices
   referentially unchanged; repeat runs append again. Satisfies FT-13.5's "every login attempt is
   logged", "MFA for Admin", "self-service reset, admins never see credentials" and "social login on
   mobile" as demonstrable audit rows; the real IDaaS is not built.
10. **"Play the office" defaults OFF and is badged when on** (RV-22): `isOfficeSimulationEnabled()`
    returns `true` only for the stored `'on'` (absent, corrupt or unreadable storage reads OFF);
    `OFFICE_SIM_COPY` and the `PwaDemoPanel` Office simulation card say it is a scaffold, not the
    proposed flow, and point to "Office authorises this List"; the card shows a
    `DemoBadge label="Simulated office"` while on. Update `officeSimulation.test.ts` (default OFF;
    toggling ON still picks up a List submitted while OFF) and the comments in `pwa/main.tsx` and
    `officeSimulation.ts` that say "on by default".
11. **PWA demo-actions sheet** (`src/pwa/PwaDemoActions.tsx`, mounted in `MobileViewport.tsx` in the
    same host-chrome seat as `UpdatePrompt`, so the framed build never sees it):
    - A small `DemoBadge`-styled floating chip ("Demo", `FlaskConical`, amber warning tint, never
      teal or crimson), shown only when `demoTriggersFor(..., 'pwa', ...)` is non-empty for the current
      route. Place it where it clears the Lists header avatar, the card dock and the tab bar on both the
      emulated and the real inset floors (it reads `--aa-inset-*` and `--aa-dock-height`). While
      "Play the office" is on, the chip carries a second marker, "Office auto".
    - Tapping opens the shared `BottomSheet` (`sheet-in` motion, scrim): a "Demo trigger" badge
      heading, one row per entry (label, description, badges), `choices` as tappable rows, not a
      dropdown (convention 16), a teal Run button, and the result line. The sheet stays open after a run.
    - Register the PWA entries:
      - `office-authorises-list`, "Office authorises this List" (Mobile · List, patterns
        `/mobile/lists/:listId` and `/mobile/lists/:listId/cards/:cardId`; `surfaces: ['pwa']`,
        `badge: 'office-stand-in'`): `authoriseAsSimulatedOffice(api, params.listId)`. Disabled unless
        the List is SUBMITTED ("Submit the List first" / "Already authorised"). The message says the
        invoices are raised and that Balances moves the next day (advance the clock from More).
      - `pwa-payment-full` / `pwa-payment-half`, "Payment received · full / half" (Mobile · Balances,
        `/mobile/balances`, pwa only): `choices` are the open ACCRECs from `openAccRecs` whose invoice's
        Card sits on a Souter List; same body as work item 4's payment entries (share one function).
        Disabled with "No open invoices yet" when empty. Reading `state.xero` here is the demo-surface
        exemption `openAccRecs` already documents (convention 9); `BalancesScreen` itself is not
        touched.
      - `fire-hospital-message` / `replay-hospital-message` already declare `pwa` on the Lists patterns
        (work item 4), so S1 can run on a handset.
    - `pwaPurity.test.ts`: add `/shell/DemoActionsMenu.tsx` to `FORBIDDEN`; confirm the closure now
      contains `src/shared/demoTriggers/` and still reaches none of the forbidden surfaces.
    - `visual/pwa-device.spec.ts`: after the existing submit walk, open the chip on the List, run
      "Office authorises this List", and assert the List leaves "Submitted to office"; assert the chip is
      absent on More.
12. **Interim Future-scope badges and the S1 caveat** (RV-05, RV-06; Phase 34 finishes the job):
    - Add a `tone` prop to `DemoBadge` (`'demo'` default, `'future'` in neutral sunken and slate, with
      its own icon) rather than a second component, so the badge vocabulary stays in one file.
    - Apply "Future scope" to: the `DemoIntegrations` surface header (with one line: "HL7 v2, FHIR R4
      and near real time are Future scope. In scope today is the St George's and Southern Cross download
      into a matching screen."); the Admin Integrations **Messages** and **Feed config** tabs (a badge
      beside the tab label and at the top of each panel); the two hospital-message registry entries.
      The Surgeon PDFs, Data quality and Validators tabs stay unbadged (in scope). The Integrations monitor
      header comment "proposed product UI, NOT demo-badged" is corrected.
    - The S1 scenario-jump message in the Control Panel gains the same caveat.
13. **Docs inside the app**: `aa-prototype/README.md` (the Control Panel paragraph becomes "the
    index"; a short "Demo actions" section on the registry, the context hook and how a phase registers
    an entry; the Office simulation section says default OFF and names the per-List stand-in).
14. **Close-out**: finish-green, the adversarial review, the demo guide (below) and PROGRESS.md.

`PERSIST_VERSION` stays at 13: nothing here changes the seed or the persisted shape (the trigger
memory and context stores are not persisted; sign-in rows are ordinary `AuditEntry` rows). If the
session does change either, bump it and say why.

## Demo triggers

Everything this phase adds to the harness bar (framed build) and the PWA sheet:

| Label | Screen | Surface | Effect |
|---|---|---|---|
| Simulate sign-in attempts | Admin · Audit | bar | Appends five audited rows: account provisioned without credential access, Admin sign-in with MFA passed, a failed sign-in, an anaesthetist self-service password reset, and an anaesthetist social-login sign-in on mobile |
| Trigger billing failure | Admin · Billing monitor | bar | Dates out the COS ACC contract and authorises Ropata Thu 16; the COS Card fails, its sibling bills (re-homed) |
| Arm handoff failure | Admin · Billing monitor | bar | The next Xero handoff faults once (re-homed) |
| Run reconciliation poll | Admin · Billing monitor; Xero sim | bar | Applies any missed webhook payments (re-homed) |
| Run archive job | Admin · Billing monitor; Xero sim | bar | Archives inactive Xero contacts (re-homed) |
| Stage post-op scenario | Admin · Review and Card detail, Dr Sharma's Tue 14 Jul AM List only | bar | Submits and authorises that List so "Add post-op event" can run (re-homed) |
| Ingest PDF row | Admin · Integrations, Surgeon PDFs tab (via the context hook) | bar | Ingests reviewed row R2 of the sample surgeon PDF onto its target List, as today (re-homed) |
| Payment received · full / half, Replay last payment event | Admin · Invoice document; Xero sim pair detail | bar | A Xero payment webhook for the invoice in the URL; replay shows idempotency (re-homed) |
| Fire hospital message, Replay last message (dedupe) | Integrations sim; Admin · Integrations; Mobile · Lists | bar and PWA | Processes a canned HL7/FHIR message; badged Future scope (re-homed; S1 fires it from the mobile screen) |
| Office authorises this List | Mobile · List | PWA only | The office stand-in: authorises the SUBMITTED List in the URL and bills it; badged office stand-in |
| Payment received · full / half | Mobile · Balances | PWA only | A payment webhook on one of Dr Souter's open invoices, chosen in the sheet |

"Run payables" is not a bar entry: its home is the Billing monitor's existing product button (work
item 4).

PWA equivalents: the mobile screens with a waiting office or backend side (List, Balances, Lists)
have their PWA entries above. Admin, Xero sim and Integrations sim screens do not exist in the PWA.

## Out of scope

- Any trigger belonging to a later phase (AA fee invoices, Contract approval, prepayment, Draft Lists,
  swaps, hospital download and sync, additional invoices, NHI). They register into this registry in
  their own phases; none is added to the Control Panel page.
- A sign-in splash, MFA screen or Google/Apple buttons (the gap analysis marks the splash optional; the
  product is IDaaS). Revisit only if the owner asks.
- Rebuilding S1 or demoting the HL7/FHIR simulator further (Phase 34), hiding the Integrations monitor's
  Future tabs (34), and the S1 to S5 rewrite (44).
- Scenario jumps, the clock and reset: they stay where they are (the clock in the bar and the Control
  Panel; the PWA keeps its clock and reset on More).
- Changing any billing, lifecycle or integration behaviour. Bodies move; semantics do not.
- Web app screens: no triggers are registered on `/web/*` in this phase.

## Manual test checklist

- [ ] On `/admin/day/2026-07-21` the harness bar shows no "Demo actions" pill; on `/admin/billing` it shows four entries (billing failure, handoff failure, reconciliation poll, archive job), each with a description and a Demo trigger badge; the screen's own "Run payables" button is unchanged.
- [ ] "Trigger billing failure" from the Billing monitor menu fails the COS Card while its sibling bills, the monitor updates without leaving the screen, and a second press shows "Already triggered" disabled.
- [ ] "Arm handoff failure" shows "Armed" disabled after one press; authorising a List then shows the handoff fault in the monitor.
- [ ] On `/admin/review/<Sharma Tue 14 AM>` "Stage post-op scenario" appears and works; on any other List it does not appear. From Sarah Mitchell's Card on Tue 14 it also appears, and "Add post-op event" then runs.
- [ ] Admin Integrations: "Ingest PDF row" appears only on the Surgeon PDFs tab (the menu updates when the tab changes, without reopening); re-firing updates the same Card.
- [ ] On an open invoice page, "Payment received · half" then "Replay last payment event" applies once; the invoice's money chip and the Xero sim pair agree. On a fully paid invoice both payment entries are disabled with "Fully paid".
- [ ] "Fire hospital message" (MSG-STG-1001) from Mobile Lists in the framed build adds Sarah Mitchell to Souter's Tue 28 Jul AM List; replay from Admin Integrations dedupes. Both entries show "Future scope".
- [ ] Admin Audit: "Simulate sign-in attempts" adds five labelled rows whose Change column reads as English; the entity filter offers `account`.
- [ ] The Control Panel shows Clock & reset, Scenario jumps and "Demo actions by screen"; every "Open screen" link (plus its hint, where shown) lands on a screen whose menu contains that entry; no trigger buttons remain on the page.
- [ ] S1, S4 and S5 scenario-jump messages name the right screens and menus; S1 carries the Future-scope caveat.
- [ ] Integrations simulator header, Admin Integrations Messages and Feed config tabs show "Future scope"; Surgeon PDFs, Data quality and Validators do not.
- [ ] PWA (`npm run dev:pwa`, fresh storage): "Play the office" is OFF; a submitted List waits. The "Demo" chip on that List opens the sheet; "Office authorises this List" authorises and bills it; after "Next morning" (More), Balances moves. With the toggle ON the chip shows "Office auto".
- [ ] PWA Balances: "Payment received · half" on a chosen invoice applies; the chip is absent on More and Availability.
- [ ] The PWA chip and sheet clear the header avatar, the card dock and the tab bar at the `pwa-device` viewport (393x660) and on a real handset if available; the harness bar never overflows at 1280px.
- [ ] Keyboard: the bar pill opens with Enter, Esc closes, focus returns to the pill.
- [ ] No en or em dash in any new app copy (labels, descriptions, messages, badges).
- [ ] Catalogue screenshots: the recipes for US-13.5.1 and US-13.5.2 are created or updated, the 4 failing recipes (US-03.5.2, US-05.2.1, US-05.3.5, US-05.4.1) are fixed, every live story has a recipe ("No recipe" is 0), every recipe this phase broke is re-pointed, a full `npm run capture` ends with no failed recipe and no story without a recipe, the covered items' new shots are checked by eye, and `npm run verify:board` is green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots` green; `npm run verify:board` green after the recipe edits.

## Demo guide updates

Patch the beats this phase moves, in the same session, in `docs/demo-guide/` and the same sections of
`master-demo-guide.html`:

- `03-demo-script.md`: "Pre-demo setup" (the Control Panel is the index; demo actions live under
  "Demo actions" in the bar on each screen, and in a "Demo" sheet on a handset); **S1** caveat at the
  top ("HL7 v2 and FHIR are Future scope; present Beat 1 as an illustration of intake. The in-scope
  path, a hospital download matched by the office, arrives in a later build.") and Beat 1's click path
  (Mobile Lists, Demo actions, Fire hospital message, MSG-STG-1001; the simulator path stays as an
  alternative); **S4** Beat 2 (Sarah Mitchell's Tue 14 Card, Demo actions, Stage post-op scenario),
  Beat 3 (Billing monitor, Demo actions, Trigger billing failure), Beat 4 (Admin Integrations, Demo
  actions, Fire hospital message MSG-CPH-2001; say that the Feed config tab is badged Future scope),
  Beat 5 (Hemi Walker's invoice, Demo actions, Payment received · half, then the Billing monitor's
  own Run payables button); **S5** Beat 2 (MSG-STG-1002 from Admin Integrations' Demo actions); "Recovery from demo
  accidents" (the Control Panel's "Open screen" links).
- `04-presenter-cheat-sheet.md`: "Present but honestly demo-only" gains the Demo actions menu, the
  handset Demo sheet, "Future scope" badges and "Play the office" (off by default; use "Office
  authorises this List"). Add "Simulate sign-in attempts" as an optional Admin Audit aside.
- `README.md` (demo guide): the readiness row for the control panel.
- `master-demo-guide.html`: the same setup, S1, S4, S5, recovery and readiness passages.
- Control Panel scenario text (work item 7).

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19),
run after the review pass and before the PROGRESS.md entry. Re-run
`node docs/prototype-build/catch-up/tools/recipe-status.mjs 14` first: earlier phases may have
changed these recipes since this plan was written.

**Covered items.** When the phase is done, each recipe in `requirements-board/capture/recipes/`
matches what was built:

| Item | Recipe at plan time | When this phase is done |
|---|---|---|
| [US-13.5.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.5.1.md) Role-based access | captured · admin-roles, simulator-role-refused | stays captured. Neither shot touches a trigger, so only confirm they still render; no new shot |
| [US-13.5.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.5.2.md) Audit trail of all actions | captured · admin-audit-viewer | stays captured. Add an admin shot `sign-in-attempts` on `/admin/audit`: open Demo actions, run "Simulate sign-in attempts", highlight the new `account` rows (signed in, sign-in failed, password reset by user). Caption: "Every sign-in attempt is an audit row, with who, role, source and what changed". Keep `audit-viewer` as it is |

**Baseline sweep (Phase 14 only).** This is the first catch-up phase, so it also brings the whole
capture set to a clean baseline, whatever the stories it covers:

1. **Fix the 4 recipes that fail today** (`requirements-board/capture/REPORT.md`, "Failed recipes":
   US-03.5.2, US-05.2.1, US-05.3.5 and US-05.4.1). All four highlight
   `[data-testid=card-calculation]`, which the 2026-09-28 decision removed from the anaesthetist
   Booking (PROGRESS Decisions log, "Anaesthetist Card shows no calculation"). Each is re-pointed to
   what the screen shows now, or set partial with a reason. Done at plan time: US-03.5.2 web highlights
   the Base and Modifier unit rows, US-05.2.1 and US-05.3.5 show the fee on the admin Booking
   (`/admin/day/<date>/cards/<id>`) instead of web and mobile, and US-05.4.1 highlights the adjustment
   block and its partial reason now says the anaesthetist sees no total. Confirm each with the
   `--dry` run and look at the shots; fix any that still fail.
2. **Every live story has a recipe.** Every story that is not Retired or Future now has one, so the
   runner's "No recipe" count is 0 from this phase on. 47 placeholder `absent` recipes were added at
   plan time: "Not built yet: catch-up Phase NN builds this" for the phase that builds the story, and
   "Not planned: ..." for US-04.3.6, US-14.6.1 and US-14.6.2 (Future Work, in no phase). The phase that
   builds a story upgrades its placeholder. If the catalogue gained live stories since, add the same
   kind of placeholder (find them with `node docs/prototype-build/catch-up/tools/recipe-status.mjs`
   for every phase and look for "none (create it)").
3. **Then the full capture run**, so `REPORT.md` is a true baseline: record its counts (captured,
   partial, absent, failed, no recipe) in the PROGRESS entry as the "before" figures that later phases
   compare against.

**Recipes this phase breaks.** The Control Panel triggers move, so every recipe that clicks one is
re-pointed. At plan time these recipes use `/demo/control` for a trigger: FT-08.5, US-06.3.4,
US-06.4.1, US-07.4.1, US-08.3.3, US-08.3.4, US-08.5.1, US-08.5.2, US-08.6.1, US-09.2.1, US-09.2.2,
US-09.2.3, US-09.2.4, US-10.1.2, US-10.2.1, US-10.2.2, US-10.2.3, US-13.3.2 and US-14.5.1 (US-07.4.1 and
US-08.3.3 may use the clock only, which does not move). Work item 7 (session 1, "Capture recipes") says
how: `goto` the trigger's screen, then the new `trigger` step for the entry (the runner lifts its
harness-bar hide to open `[data-shot=demo-actions]` and run `[data-shot=demo-action-<id>]`); scenario
jumps, clock and reset steps stay. Keep every shot `name`.
Recipes that click "Run payables" use `[data-shot=billing-payables-run]`. Re-capture them in this step.

**ATLAS.md.** Rewrite "Demo control panel" (the index and the per-screen "Demo actions" menu with its
`data-shot` hooks), update the Routes row for `/demo/control`, and add the new hooks under "Existing
hooks".

## Adversarial review (after build)

After the manual test checklist and `npm run build` / `npm run build:pwa` / `npx vitest run` /
`npm run shots` are green, and before writing the PROGRESS entry, run the standard **adversarial
review-and-fix pass (PROGRESS convention 18)**: fan out a few independent Opus review subagents (one
each for **quality**, **bugs/correctness** and **plan adherence**), then this session independently
verifies every finding against the source docs and the code, fixes the confirmed ones, re-greens,
and records the pass in the phase entry. Do not re-raise anything already settled in the Decisions log.

**Steer this phase's reviewers at:**
- Behaviour parity: every re-homed body does exactly what the Control Panel card did (same store
  calls, same actors, same guards, same idempotency keys); only its location and target resolution
  changed. Diff the old handlers against the new entries line by line.
- PWA purity: the registry, context hook, memory store, actors and office stand-in live in
  `src/shared` or `src/store`; nothing in the PWA closure imports `src/apps/*`, `src/shell/AppShell.tsx`
  or `DemoActionsMenu.tsx`; `pwaPurity.test.ts` walks the new modules and stays green.
- Route scoping: no entry leaks onto a screen it does not belong to; `when` and `disabledReason`
  re-evaluate live after a store change and after a reset; replay after a reset refuses cleanly.
- Office stand-ins declare the PWA surface only; the framed build never auto-authorises; "Play the
  office" is OFF on fresh or corrupt storage and badged when on.
- Harness chrome stays harness chrome: white-on-ink pill, amber demo badges, teal only for Run, no
  crimson; every trigger is badged (convention 13); the bar does not overflow; no en or em dashes.
- Audit completeness: sign-in rows go through `mutate()`, have labels, touch no domain slice; the
  Audit viewer and HistorySheet still read cleanly.
- The Control Panel index is complete: every `DEMO_TRIGGERS` entry is listed and every "Open screen"
  link lands where the entry is visible. The 18 capture recipes and ATLAS match the new hooks.
- Determinism: no `Date.now()`, `new Date()` or `Math.random()` in the new modules; no `PERSIST_VERSION`
  change unless the persisted shape changed.

## PROGRESS.md updates

- A catch-up status row for Phase 14 and an entry `### Catch-up Phase 14 · Screen-contextual demo
  triggers (date)`: the drift-check result; the registry contract (types, surfaces, `when`, memory,
  context keys) as the seam later phases register into; the list of registered entries; test counts;
  the review pass.
- **Decisions log:**
  - "Demo triggers live on their screen; the Control Panel is the index" (amends the Phase 12
    control-panel layout; clock and reset remain as the 2026-07-28 entry says; the Control Panel's
    duplicate "Run payables" is dropped because the Billing monitor's product button is its home).
  - "'Play the office' defaults OFF, badged when on; 'Office authorises this List' is the handset
    stand-in" (RV-22).
  - "HL7/FHIR tooling carries interim Future-scope badges until Phase 34" (RV-05, RV-06).
  - "FT-13.5 is demonstrated as simulated audit rows; no sign-in splash".
- **Binding conventions:** convention 4's "store actions triggered from the demo control panel or demo
  screens" becomes "registered in `src/shared/demoTriggers` and shown on their screen (harness bar or
  PWA sheet)"; convention 13 adds the Demo actions menu and the PWA sheet to the badged surfaces.
- **Catalogue screenshots:** the baseline sweep (the 4 failing recipes fixed, the placeholder recipes
  added so "No recipe" is 0), recipes created or changed (the sign-in shot, the re-pointed trigger
  recipes), the `REPORT.md` counts before and after (captured, partial, absent, failed, no recipe), and
  any partial reason handed to a later phase.
