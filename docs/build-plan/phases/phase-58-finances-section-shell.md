# Phase 58 · The Finances section shell

**Requirements covered:**
[US-13.3.3](../../../requirements-board/requirements/stories/US-13.3.3.md) The Finances section (status 3 Verify, graded **Missing**, size L: separate Invoices, Billing monitor and Ledger nav items, no tabbed section, no tab counts, no single badge, records not under their tabs). This phase builds all of it except the record pages' rebuilds (63, 65, 66) and the Billing count's re-base (60) (D114).
[FT-13.3](../../../requirements-board/requirements/stories/FT-13.3.md) Billing flow monitoring (status 4 Agreed, graded **Partial**, size S: the monitoring lives on a stand-alone screen that also carries the payment cycle, AA fee and Holding account panels).
No DM or RV row is closed here. No seed change, no `PERSIST_VERSION` bump.
**Answered, built as answered** (owner, 26 November, for the build, not yet seen by AA): D107 (the section's shape), D108 (old links redirect and stay), D109 (counts and one amber badge), D110 (panels move first, unchanged), D111 (triggers re-homed once, here).
**Open, built to its default:** none in the catalogue; the built defaults are in Before you start 4.

**Depends on:** none (45 to 57 DONE on `master`). 59 builds beside it in Lane B and shares no file.
**Estimated:** 1 to 2 sessions. **Checkpoint** after Work item 6: the nav entry and badge, the route block, every redirect, `financePaths.ts` and every link, `financeCounts.ts`, the frame and the tab and record files, each tab hosting today's whole screen. Session 2: items 7 to 12.

**Runs in:** Lane A of the build lanes, Wave 4, alone in Lane A's queue (Lane B builds 59 beside it): built in the `AnaesthesiaAssociatesRFP-laneA` worktree, committed on `lane/a` with a `58 complete:` commit (and `58 checkpoint:` at the checkpoint), and joined with 59 on `wave/4` on the quick checks only. [LANES.md](../LANES.md) overrides this doc's and the skill's commit, port, gate, review, owner-review and plan-page steps for a lane session. The owner tests 58 once, with 59 to 67, from `TEST-58-67.md` after Wave 5's join.

## Goal

Invoices, the Billing monitor and the Ledger become one **Finances** section of the Admin app: this phase builds the shell and moves today's panels in unchanged; Wave 5 rebuilds each tab in its own files.

- **Side nav:** one Finances entry after Review queue, replacing Invoices, Billing monitor and Ledger (13 entries become 11), with one amber badge (billing problems plus failed ledger checks), never crimson.
- **Frame and routes (D107):** `AdminPage` titled Finances with six routed `LineTabs` (a `CountBadge` only where something needs doing), opening on Billing; the records under their tabs. Every old URL redirects with replace, query kept (D108); every link goes through `financePaths.ts`.
- **Moves (`#moves`, D110):** each panel to its tab, the four tiles and AA fee strip dropped; every trigger on the three screens to one Finances screen, labels unchanged (D111). Detail in Work items 5, 7 and 8.

## Before you start

**Test once, at the very end (D113).** This phase finishes on the quick checks only (`phase-check.mjs --changed` and `npm run lint` in `aa-prototype/`). It skips the full gate, the screen-proof against the design, the manual test checklist run and the adversarial review: Wave 5's join runs them once for 58 to 67. Update the Playwright specs this phase moves without running them.

**Subagents as much as possible (D112),** each told its own files; the session keeps the decisions below, the shell files and the joins. Session 1: three readers in parallel (the shell files; the five screens' frames and props; the link grep), then builders for `financePaths.ts`, `financeCounts.ts` and the link sweep while the session builds the frame, nav and route block. Session 2: one builder per destination of the monitor split, one for the triggers, one for Vitest, one for the Playwright specs.

1. **Drift check** against the plan baseline `f885f67`:

   ```
   node requirements-board/agent/skills/update-build-plan/tools/plan-state.mjs --diff US-13.3.3,FT-13.3
   ```

   Re-read anything changed after `f885f67`. If US-13.3.3 is Retired or Future, or its six tabs, Opens on Billing, Counts what needs doing, One badge or Record page criteria change, stop and tell the user. A wording change to FT-13.3 is not a stop: log it.
2. **Confirm** 45 to 57 DONE on `master` and Wave 4 started (LANES.md "Waves"). Read their PROGRESS entries for the patterns this phase copies, and note:
   - **45:** the section pattern (`ContractsSection.tsx`, `contractsTabs.ts`, the `LineTabLink` strip, `contractsPaths.ts`, `mastersRedirect.ts`) and the record frame.
   - **47:** the one-row toolbar at 1280 (so the frame leaves room for it).
   - **53:** `PeopleSection.tsx` (`PeoplePage`, the strip's `CountBadge`s, `adminPeople.tab`), `peoplePaths.ts`, the route block with records nested so `RequireEntity`'s `..` falls back to the tab, `AdminPersonRedirect` and its test, the Patients tab's `FilterPills` switch, the registry's literal People route patterns.
3. **Built as answered, no label:** the section, tabs, routes and records (D107), the redirects (D108), the counts and badge (D109), the moves (D110), the triggers (D111). No on-screen caption.
4. **Built defaults** (each a line on the owner's review list):
   - **The badge until 60** (D109): `billingAttentionCount` + `ledgerAttentionCount`; 60 re-bases the billing part to D109's unit inside `financeCounts.ts`.
   - **Tab counts:** Billing, Lists with a problem from today's monitor logic (`billingMonitorView(…).totals.withProblems`); Invoices, today's Awaiting approval count (`pendingPrepayments(…).length`; if that counts payer groups rather than invoices, note it for 62); Ledger, `ledgerAttentionCount`; Xero, alerted queue items plus open divergences (`openXeroQueueItems`, `openXeroDivergences`); Payments and AA fees have no number at all (owner rule: no count function, no `CountBadge`); Contracts' and People's tabs keep counting what they list.
   - **Each tab keeps its screen's mode and sub line** (Billing fluid; Invoices fit, its approval view fluid; Ledger and AA fees as today; Payments and Xero fluid) under the one title, Finances. The mock's per-tab ledes are Wave 5's.
   - **Inner switches become `FilterPills`** in the tab's toolbar, as 53's Patients switch: Invoices' "All invoices · Awaiting approval" (`?view=approval`, written with replace, keeping the `invoices-tabs` hook and `data-view`) and AA fees' "Fee invoices · Fee settings" (navigating to `/aa-fees` and `/aa-fees/settings`). 62 and 67 replace them.
   - **Placement until Wave 5:** `XeroConnectionLine` above the two Xero panels, which show unfiltered; `HoldingAccountPanel` below the Ledger's tables; `EventsAwaitingRunPanel` below the payment cycle.
   - **Record frames:** the invoice and credit note keep `AdminPage mode="document"` with a back link "Invoices"; the payment run's back link reads "Payments"; the remittance's back link stays its run; an anaesthetist's account renders today's one-anaesthetist Ledger view with a back link "Ledger" (its scope switch and select stay until 65). An unknown id falls back to its tab.
   - **Copy that names a gone screen** names its tab ("Open Billing monitor" reads "Open Billing", the Review back link "Billing", the reconciliation card's Xero links "Xero"); every `data-shot` keeps its old name. Trigger labels never change.
   - **Trigger headings:** one per Finances screen ("Admin · Finances · Billing" and so on, "Admin · Finances · Invoice" for the page) in place of `BILLING_MONITOR_SCREEN`; the Control Panel's Run payables note moves to Payments.
   - **Names:** `screens/finances/FinancesSection.tsx` (`FinancesPage`, `FINANCE_TABS`), `financePaths.ts`, `financeCounts.ts`, `BillingTab.tsx`, `InvoicesTab.tsx`, `PaymentsTab.tsx`, `LedgerTab.tsx`, `XeroTab.tsx`, `AaFeesTab.tsx`, and the record pages `InvoicePage.tsx`, `CreditNotePage.tsx`, `PaymentRunPage.tsx`, `RemittancePage.tsx`, `AnaesthetistAccountPage.tsx`; the trigger context key `adminFinances.tab`.
5. **Reads beyond the run-build-phase standard list:**
   - **Design:** [finances-section.html](../../explorations/finances-section.html): `#url` (the nav entry, badge, frame and strip; only these are built here), `#p-billing` to `#p-aafees` (each tab's dashed note, only for where each moved panel lands), `#records` (the record routes and back links), `#kit` (build nothing new) and `#moves` (followed row by row). `#billing-table` version C is 60's.
   - **ROADMAP.md:** D107 to D111 (above), D112 (58 owns every shell file), D113, D114 (58 holds US-13.3.3's and FT-13.3's units), D115 (no new component or variant); sequencing rules "58 first, the only Finances phase that touches the shell" and "59 beside 58".
   - **LANES.md:** "The file contract 58 sets up" and both "Who owns what" tables (Wave 5's owners decide which file each panel lands in).
   - **Catalogue:** US-13.3.3 in full (rules, six criteria, Technical discussion); FT-13.3; [the 26 November note](../../../requirements-board/requirements/notes/2026-11-26-donald-finances-section.md) #1, #2, #6, #7, #13 to #15.
   - **DECISIONS.md:** honour "Real routing in all three apps" (redirects kept), "Controls stay buttons; only page switches are links" (tabs are `LineTabLink`s, the inner switches controls), "Demo-only surfaces are badged" (Finances is product UI), and 53's "People is its own Admin section" (the same shape). Supersedes none; add one ruling (item 12).
   - **BACKLOG.md:** closes none; the lines on Run payables, the Ledger's load time and the Billing monitor's length stay for 60, 64 and 66.

## Reference

- **Shell:** `src/router.tsx` (the admin `invoices`, `credit-notes`, `billing`, `ledger` blocks; `people` as the pattern), `shell/RequireEntity.tsx`, `apps/admin/AdminApp.tsx` (`sectionForPath`, the path map, `exceptionCount`, `ledgerCount`), `components/SideNav.tsx`, `routes.tsx` (the nine finance route components, the Review's `from: 'billing'` state), `peoplePaths.ts`, `screens/people/PeopleSection.tsx`.
- **Screens and panels:** `screens/BillingMonitorScreen.tsx`, `InvoicesScreen.tsx`, `InvoiceDocument.tsx` (`CreditNoteDocument` too), `LedgerScreen.tsx`, `AaFeesScreen.tsx`, `PaymentRunScreen.tsx` (`RemittanceAdviceScreen` too); `components/XeroPanels.tsx`, `PaymentCyclePanel.tsx`, `HoldingAccountPanel.tsx`, `ReconciliationCard.tsx`, `AdminPage.tsx`.
- **Counts:** `store/ledgerSelectors.ts` (`billingAttentionCount`, `ledgerAttentionCount`, `openXeroQueueItems`, `openXeroDivergences`), `store/billingMonitorView.ts`, `store/prepaymentSelectors.ts` (`pendingPrepayments`), `store/paymentCycleActions.ts` (`openCycle`), the AA fee run selectors `AaFeesScreen.tsx` reads.
- **Triggers:** `shared/demoTriggers/registry.ts` (`BILLING_MONITOR`, `BILLING_MONITOR_SCREEN`, `LEDGER`, `onLedger`, `INVOICE_PAGES`, `PAYMENT_PAGES`, `AA_FEE_INVOICES`, `firstOpenInvoicePath`), `context.ts`, `index.ts`; `apps/demo/DemoControlPanel.tsx`, `demoScenarios.ts`; `apps/demo/catalogue/AdminCatalogue.tsx`.

## Work items

**Session 1 (to the checkpoint)**

1. **`financePaths.ts`** (new, `screens/finances/`, with `financePaths.test.ts`): `FinanceTab` (`'billing' | 'invoices' | 'payments' | 'ledger' | 'xero' | 'aa-fees'`), `FINANCES_BASE`, `financePath(tab, query?)`, `invoicePath(id)`, `creditNotePath(id)`, `paymentRunPath(runId)`, `remittancePath(runId, anaesthetistId)`, `anaesthetistAccountPath(id)`, `aaFeeSettingsPath()`, and the fixed query shapes Wave 5 reads but never changes: `awaitingApprovalPath()` (`?view=approval`), `billingProblemsPath()` (`?problems=1`), `billingListPath(listId)` (`?list=`), `ledgerPairPath(pairId)` (`?pair=`). One pure `financePathFromLegacy(pathname, search)` maps every D108 path to its home, query kept, unknown shapes to the tab. Tests: every helper; every legacy path with and without its query.
2. **`financeCounts.ts`** (new, with `financeCounts.test.ts`; pure, reads state slices, nothing under `domain/billing/`): one exported function per count (Before you start 4), `financeTabCounts(state)` for the strip, `badgeBillingPart(state)` (today `billingAttentionCount`) and `financeBadge(state)` = `badgeBillingPart` + the Ledger count. The badge reads only what it sums, so the nav never builds the monitor view. Tests: US-13.3.3's example (one billing exception, two failed ledger checks: 3, then 2 once the exception resolves), a Booking stuck at Xero counted once, Invoices counting only what awaits approval, `financeTabCounts` has no Payments or AA fees entry (those tabs never show a number).
3. **The frame and the nav.** New `FinancesSection.tsx`: `FINANCE_TABS` (label and path per tab), `FinancesPage({ tab, sub, mode, actions?, toolbar…, testId?, children })` wrapping `AdminPage` titled Finances with the `LineTabs` strip (`data-shot="finances-tabs"`, `data-finances-tab`), each tab's `CountBadge` hidden at zero, and `useDemoTriggerContext('adminFinances.tab', tab)` (add the key to `context.ts`). `SideNav.tsx`: `NavSection` drops `invoices`, `billing`, `ledger` for `finances`, labelled Finances, after Review queue, with `financesBadge` in the warn tone (`nav-badge-finances`); `billingBadge` and `ledgerBadge` go. `AdminApp.tsx`: `sectionForPath` maps `finances` and the redirecting `invoices`, `credit-notes`, `billing` and `ledger` to `'finances'`; the path map gets `finances: '/admin/finances'`; the badge is `financeBadge(…)`, memoised on the slices it reads.
4. **The Finances route block** in `router.tsx`, in this fixed order (Wave 5 edits none of it): `finances` index redirecting to `billing`; `billing`; `invoices` with `credit-notes/:creditNoteId` (`CreditNotePage`) and `:invoiceId` (`InvoicePage`); `payments` with `:runId` (`PaymentRunPage`) and `:runId/remittance/:anaesthetistId` (`RemittancePage`), siblings so both fall back to Payments; `ledger` with `anaesthetists/:anaesthetistId` (`AnaesthetistAccountPage`); `xero`; `aa-fees` with `settings`. Each record route (invoice, credit note, payment run, remittance, anaesthetist's account) renders a component in its own file outside `routes.tsx` and `router.tsx` (`InvoicePage.tsx`, `CreditNotePage.tsx`, `PaymentRunPage.tsx`, `RemittancePage.tsx`, `AnaesthetistAccountPage.tsx`), so 63, 65 and 66 rebuild their pages inside those files and never touch a route file. Each element is its file's export, mounted directly; each record page reads its own params and does its own exists check, so no Wave 5 phase needs `routes.tsx`. The old blocks become redirects (D108): one `FinanceLegacyRedirect` in `routes.tsx` navigating with replace to `financePathFromLegacy(location)`, keeping router state, on every D108 path (the old `invoices`, `credit-notes`, `billing` and `ledger` blocks' routes). The old route components in `routes.tsx` go.
5. **Tab and record files** host today's screens whole (session 1): `BillingTab` renders `BillingMonitorScreen`, `InvoicesTab` `InvoicesScreen`, `LedgerTab` `LedgerScreen`, `AaFeesTab` `AaFeesScreen` (its `tab` from the route), `PaymentsTab` and `XeroTab` their panels (item 7 removes them from Billing). Each screen swaps its own `AdminPage` for `FinancesPage`, keeping its `sub`, `mode`, `testId`, toolbar and body; Invoices' and AA fees' strips become the `FilterPills` switches. `InvoicesScreen` loses its `selectedInvoiceId` branch and `onSelect` prop to `InvoicePage` (`testId="invoice-detail-screen"` kept); `CreditNotePage` takes `AdminCreditNoteRoute`'s body; `PaymentRunPage` and `RemittancePage` wrap today's screens; `AnaesthetistAccountPage` renders `LedgerScreen` with `anaesthetistId` and its back link.
6. **Every in-app link through `financePaths.ts`** (one subagent): grep `/admin/(invoices|billing|ledger|credit-notes)`; about 18 files, the five screens and four panels, `ReviewScreen.tsx` (the no-address notice; its back to Billing with the search, via `routes.tsx`'s `from: 'billing'` state), `PatientRecord.tsx`, `ReconciliationCard.tsx` (Xero links to the Xero tab), `AnaesthetistHistoryCard.tsx`, `ContractHistory.tsx`, `EventReviewSheet.tsx` and `demoScenarios.ts` (paths only). The Xero simulator has none. Copy naming a gone screen follows Before you start 4 (`procedureEventCopy.ts`, `InvoiceDocument.tsx`, the back labels). No live link to an old route remains outside the redirects and their tests.

   **Checkpoint:** the quick checks green, a `58 checkpoint:` commit, the `**Session 1**` paragraph (run-build-phase "Two-session phases").

**Session 2**

7. **Split `BillingMonitorScreen.tsx` by moving, never copying** (one subagent per destination, each told its files): `XeroConnectionLine`, `XeroQueuePanel`, `XeroDivergencePanel` to `XeroTab.tsx`; `PaymentCyclePanel` and `EventsAwaitingRunPanel` (cut into `PaymentsTab.tsx`, still reading `approvedEventsAwaitingRun`) to Payments; `HoldingAccountPanel` to `LedgerTab.tsx`. Delete the four tiles (`billing-monitor-tiles`, `billing-tile-*`) and `AaFeePanel` (`billing-aa-fee-invoices`). The pipeline, toolbar, filters, awaiting rows, pager, groups and `CorrectionRetry` stay as Billing. Every moved component keeps its export and props, so `/demo/catalogue/admin` compiles unchanged (reword its rows' "Billing monitor" to the tab). Check the hooks with `git diff` of removed and added `data-shot` and `data-` lines: only the tiles', the AA fee strip's and the two old nav badges' may go (about 60 carried). Record each tab's `useScreenTiming` before and after for the progress entry.
8. **Re-home the triggers** (D111; one subagent; table under Demo triggers): each trigger's `screen`, `routes` and `indexPath` move to one Finances screen; route patterns stay literal constants in the registry (`shared/` does not import `apps/`), rewritten to `/admin/finances/...`. Drop `alsoScreens` from `stage-refund-after-payout`. Drop the Ledger routes and the `onLedger` branches that only served them from the payment triggers. Labels untouched; `demoGuideSync.test.ts` stays green.
9. **Vitest follows the moves:** every test naming an old route, screen or heading (grep; about 20, from `BillingMonitorScreen` and `InvoicesSearch` to `demoTriggers`, `DemoActionsMenu`, `appCopy` and `oneComponentPerJob`, whose allow-list only shrinks). New `financesSection.test.tsx`: the nav (one entry, 11 items, the amber badge reading `financeBadge`), `/admin/finances` landing on Billing, each tab's own address on reload, the counts on the strip, every legacy path landing with replace and its query (no Back loop), unknown record ids falling back to their tab.
10. **Playwright specs re-pointed, not run** (one subagent): the 18 specs in `visual/` naming an old route (grep; `billing-monitor`, `admin-ledger`, `admin-phase39a`, `aa-fee`, `routing` among them): new URLs, the moved panels' tabs, the dropped tiles' steps removed. Note any suspected to break under "For the merge".
11. **Build on the shared components (D115).** Every new surface (the frame, the strip, the `FilterPills` switches, the record back links, the nav badge) is built from the mock's `#kit` table: `AdminPage`, `LineTabs` with `CountBadge`, `FilterPills`, `Pill`, `TextAction` and the existing record frame. No new shared component or variant, no private copy of one (`oneComponentPerJob.test.ts`), tokens only, no dash in copy. Layout per mock section: the frame and strip `#url`; each tab's moved panels `#p-billing`, `#p-invoices`, `#p-payments`, `#p-ledger`, `#p-xero`, `#p-aafees` (placement only; `#billing-table` version C is 60's); the record pages `#records`; the moves `#moves`.
12. **Finish.** DECISIONS.md gains one ruling: "Finances is its own Admin section: one nav entry with one amber badge (billing problems plus failed ledger checks), six routed tabs opening on Billing, records under their tab; every in-app link goes through `financePaths.ts`, each count lives in `financeCounts.ts`; the old Invoices, Billing monitor, credit note, payment run and Ledger links redirect and stay. Build plan Phase 58 (D107 to D109)." Write the file contract as shipped (files, exports, helpers, query shapes, counts, context key, trigger headings) in `notes.md` and the progress entry.

## Demo triggers

Each keeps its id, label and effect; only its heading, routes and `indexPath` move.

| id | Label | New home | Kept beside it |
|---|---|---|---|
| `billing-failure`, `run-next-billing-run` | Trigger billing failure · Run the next billing run | Finances · Billing | Review queue (`run-next-billing-run`) |
| `arm-handoff-fault`, `xero-outage-start`, `xero-outage-restore`, `run-reconciliation-poll`, `run-archive-job` | Arm handoff failure · Simulate Xero outage · Restore Xero · Run reconciliation poll · Run archive job | Finances · Xero | the Xero simulator's routes |
| `stage-payment-week`, `stage-bank-mismatch` | Stage a payment week · Stage a bank mismatch | Finances · Payments | |
| `inject-unmatched-receipt` | Inject unmatched receipt | Finances · Ledger | Day view |
| `stage-combined-procedure`, `load-full-scale` | Stage combined procedure · Load full-scale data | Finances · Invoices | Day view (`load-full-scale`) |
| `regenerate-invoice`, `payment-full`, `payment-half`, `payment-replay`, `stage-refund-after-payout` | Regenerate from locked data · Payment received · full · Payment received · half · Replay last payment event · Stage refund after payout | an invoice's page | Booking detail and the Xero simulator's invoice (the payment triggers); the Ledger routes dropped |
| `seed-month-of-bctis`, `run-scheduled-fee-run` | Seed a month of BCTIs · Run scheduled month-end fee run | Finances · AA fees | |
| PWA | none (Admin only); the PWA payment and prepayment stand-ins unchanged | | |

## Out of scope

- Any tab's rebuild: Billing's version C and the badge's re-base (60), Xero (61), Invoices (62), the invoice and credit note pages (63), Ledger (64), the anaesthetist's account page (65), Payments and the run pages (66), AA fees (67).
- Anything under `domain/billing/` or in `domain/types.ts` (59's); the billing run; a seed change.
- New shared components or variants (D115); capture recipes, ATLAS and the demo guide (the owner's sweep).

## Manual test checklist

Material Wave 5's join walks for the owner's test sheet `TEST-58-67.md`. Do not run it in this phase (D113).

- [ ] Admin side nav: Finances after Review queue with one amber badge; Invoices, Billing monitor and Ledger gone; 11 entries; Finances opens on Billing.
- [ ] The strip: six tabs, a number only where something needs doing (Payments and AA fees never show one); each tab reloads on its own address.
- [ ] Badge: Trigger billing failure raises it by one; Inject unmatched receipt raises it by one; resolving each lowers it; Simulate Xero outage then a failed hand-off counts once.
- [ ] Billing: today's pipeline, filters, pager, Retry and Open in Review (Back returns to Billing with the filters); no tiles, no AA fee strip, no Xero or cycle panels.
- [ ] Payments: the cycle, its runs, Run payables, the events awaiting the run; a run opens under Payments, its remittance under the run.
- [ ] Ledger: today's ledger and the AA Holding account; an anaesthetist opens `/admin/finances/ledger/anaesthetists/<id>` with a back link.
- [ ] Xero: the connection line, the sync queue (Retry now) and Changed directly in Xero (Resolve).
- [ ] Invoices: the list and the Awaiting approval switch; an invoice and a credit note open under Invoices with a back link.
- [ ] AA fees: fee invoices and Fee settings switch; `/aa-fees/settings` opens settings.
- [ ] Redirects land, keep the query and Back does not loop: `/admin/invoices?view=approval`, `/admin/invoices/<id>`, `/admin/credit-notes/<id>`, `/admin/billing?problems=1`, `/admin/billing/aa-fees/settings`, `/admin/billing/payment-runs/<id>/remittance/<id>`, `/admin/ledger?pair=<id>`, `/admin/ledger/anaesthetists/<id>`; unknown ids fall back to the tab.
- [ ] In-app links (the reconciliation card, Review's no-address notice, invoice and credit note links, the patient page) open the new routes directly.
- [ ] Each re-homed trigger shows on its one screen in Demo actions, label unchanged, and works there.

## Demo guide updates

None by this phase: the owner's `/sweep` re-points the guide, the recipes and ATLAS; the redirects keep them loading. Keep `demoGuideSync.test.ts` green. **For the sweep**, list in the progress entry: about 76 capture recipes (32 Billing, 38 Invoices, 6 Ledger) to new URLs and the Finances entry, and those that targeted the dropped hooks (`billing-monitor-tiles`, `billing-tile-*`, `billing-aa-fee-invoices`, `nav-badge-billing`, `nav-badge-ledger`); ATLAS's routes; the guide's 48 "Billing monitor" mentions, S3 Beats 6 and 7, and the "Demo actions by screen" headings; `demoScenarios.ts`'s "Beat 4 · Billing monitor" labels.

## Review steer for Wave 5's join

The prompt's rules held: moved not redesigned (every hook on the same element); one amber badge from `financeCounts.ts`, 1 + 2 = 3 then 2; every link through `financePaths.ts` and every D108 path redirecting with replace; the file contract (`screens/finances/`, nothing in `domain/billing/` or `domain/types.ts`); each trigger on one screen, no dead `onLedger` branch.

## PROGRESS.md updates

- **For the owner's review:** the built defaults of Before you start 4.
- **For the sweep:** the recipes, hooks, ATLAS rows and guide lines under Demo guide updates.
- **For the merge:** files this phase touches that LANES.md does not list for Lane A: `shared/demoTriggers/context.ts` (the key), `shared/procedureEventCopy.ts` (copy), `apps/demo/DemoControlPanel.tsx`, `apps/demo/demoScenarios.ts`, `apps/demo/catalogue/` rows, and the link-only edits in Wave 5's files (`XeroPanels.tsx`, `PaymentCyclePanel.tsx`, `HoldingAccountPanel.tsx`, `LedgerPaymentRuns.tsx`, `ReconciliationCard.tsx`, `InvoiceDocument.tsx`), so the plan maker can update LANES.md; any Playwright spec suspected to break.
- Status row and phase entry: drift check against `f885f67`; D107 to D111 built; the file contract as shipped (also in `notes.md`) for 60 to 67; the screen timings before and after; tests added; `PERSIST_VERSION` unchanged. Handoffs: 60 re-bases the Billing count and the badge's billing part in `financeCounts.ts`; 62 and 67 replace the inner switches; 63, 65 and 66 rebuild their record files in place.
- Decisions log: the Finances section, its redirects and its badge (also in `docs/DECISIONS.md`).
