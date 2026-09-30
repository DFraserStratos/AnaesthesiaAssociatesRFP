# Phase 38 · Web accounts and dashboard

**Requirements covered:**
[US-12.2.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-12.2.3.md) Dashboard ·
[US-12.1.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-12.1.2.md) GST period (the aligned window and the label drift; Phase 26 already lets the anaesthetist set it) ·
[US-12.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-12.2.2.md) Activity summary for GST ·
[US-07.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-07.2.1.md) Anaesthetist loses edit access (the web "completed, unbilled" marker) ·
[DM-30](../analysis/domain-model-delta.md#dm-30) List visibility after invoicing: unbilled to billed, not vanished ·
[RV-18](../analysis/reverse-check.md#rv-18-dashboard-productivity-and-leave-panels) Dashboard Productivity and Leave panels ·
[RV-19](../analysis/reverse-check.md#rv-19-receivables-aging-buckets-and-overdue-rollups) Receivables aging buckets and "overdue" rollups.
Read alongside (not closed here):
[US-08.3.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.3.5.md) (the per-anaesthetist ledger position: owed, collected, paid out; Phase 36 builds it, this phase puts it on the dashboard),
[US-12.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-12.2.1.md) (the flat outstanding list, already a Match; this phase strips the buckets off it),
[FT-12.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-12.2.md) (both reports read the engine's own ledger),
[FT-07.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-07.4.md) and
[US-07.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-07.4.1.md) (Open: when a List leaves the view),
[US-08.3.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.3.1.md),
[US-11.3.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.3.2.md) (the 90-day threshold is a patient alert, Phase 40, not an ageing view),
[OQ-31](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-31.md),
[OQ-33](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-33.md), and the
"Internal ledger" section of [domain-model.md](../../../discovery-reference/Updated%20Requirements/domain-model.md).
**Depends on:** 28 (Lists are their own records; `slotViewsForAnaesthetist`, `list.kind`,
`approvalStateLabel`) and 36 (the internal ledger: receivable and payable legs, and the
per-anaesthetist position). By the roadmap order 14 (the demo-trigger registry and its payment
entries), 15 (Booking vocabulary), 16 (payable equals receivable, the AA fees tab), 22, 25, 26 (the
profile's GST period and the shared `gstPeriodLabel`) and 27 have also run. 37 and 39 may run before
or after this phase.
**Estimated:** 1 session.

## Goal

The web dashboard is the anaesthetist's one overview of their week, their money and who can cover
(US-12.2.3). Today its money panel is a receivables-ageing chart with invented buckets, and two of
its five panels (Productivity and Leave) are hardcoded seed constants for Dr Souter only. The
catalogue asks for the **financial position** instead: what the anaesthetist is **owed**, what has
been **collected** and what has been **paid out** (US-08.3.5), read from the engine's ledger, which
Phase 36 made the system of record.

This phase:

- replaces "Receivables aging" with a **Financial position** panel over Phase 36's
  per-anaesthetist ledger position, and removes the seeded **Productivity** and **Leave** panels and
  their seed slice (RV-18). The Web Dashboard mockup's layout and panel anatomy are kept for what
  remains;
- turns the Accounts **Overdue** tab into a flat **Outstanding** list, oldest first, with no ageing
  buckets, no bucket totals and no age chips on mobile (RV-19, owner decision **D8**, default reading);
- aligns the **GST activity** summary to the anaesthetist's own GST period (monthly, two-monthly or
  six-monthly) as real periods, with previous and next navigation and a free date range, on the web,
  and aligns the mobile peek to the current period (US-12.1.2, US-12.2.2). One period label is used on
  every surface, fixing the "biMonthly" / "Bi-monthly" / "Two-monthly" drift;
- keeps billed Lists visible: a List reads **"Done · unbilled"** once submitted and **"Done · billed"**
  once its invoices are generated, on web and mobile, instead of vanishing (DM-30, owner decision
  **D9**, default reading, provisional while OQ-31 is open). The web Lists table and week strip get
  the marker US-07.2.1 asks for.

No new stored entity. The seed loses the `dashboards` slice, so `PERSIST_VERSION` is bumped.

## Before you start: drift check

1. Run the drift check against the plan's catalogue snapshot:

   ```
   git diff 1f067a8 -- "docs/discovery-reference/Updated Requirements/catalogue" "docs/discovery-reference/Updated Requirements/domain-model.md"
   ```

   Read the diff for US-12.2.3, US-12.1.2, US-12.2.2, US-07.2.1, the context items US-08.3.5,
   US-12.2.1, FT-12.2, FT-07.4, US-07.4.1, US-11.3.2, and OQ-31. If an item changed, re-read it and
   adjust the work items. If an item is now Retired or Future, drop its work items and record that in
   the PROGRESS entry. At plan time US-07.4.1 was **Open** and the four covered stories were
   **Proposed**.
2. **Owner decisions.** Confirm with the owner (or the ROADMAP decisions table) whether D8 and D9 have
   been answered:
   - **D8 (ageing and an "Overdue" view).** Default: a flat outstanding list, oldest first, no buckets,
     no age chips. The evidence conflicts (RFP p.49 "Overdue" and the US-08.3.5 screenshot caption
     "aged", against US-12.2.1's "flat list, no rollup or grouping"). If the owner says **keep ageing**:
     keep the flat list and its one-row-per-invoice shape, but keep the bucket columns and totals on the
     Outstanding table, show an ageing strip inside the Financial position panel, and keep the mobile age
     chip; everything else in this phase proceeds. Record which branch was built.
   - **D9 (do billed Lists vanish).** Default: they stay, shown as "Done · unbilled" and then
     "Done · billed". If the owner says **they vanish**: keep the `isListBilled` filters in the
     anaesthetist views, still build the web "Done · unbilled" marker and the web Completed view for
     submitted and authorised Lists (US-07.2.1 needs both), and skip the "Done · billed" row kind.
   - If neither has been answered, build the defaults and label them provisional in the UI (work
     items 7 and 11).
3. **Open question OQ-31** (the event that removes a List from the view). If still open, the safe
   interim is the one the prototype already has: the billing run's `billedAtISO` stamp is the
   "billed" event. Nothing in this phase moves that trigger; the List changes label instead of
   disappearing, and the Done filter and Completed view label the behaviour provisional.
4. **Prerequisite names.** Confirm Phases 28 and 36 are DONE in PROGRESS.md and read their handoff
   notes:
   - from **36**: the name and shape of the per-anaesthetist position selector (planned as
     `anaesthetistLedgerPosition(state, id)` over `anaesthetistPosition(pairs, id)`, returning
     `dueNow`, `awaitingCollection`, `owedToThem`, `collected`, `paidOut`, `theyOweAa`), and whether it
     applies the next-day rule to invoices raised today. Also 36's renames (planned: `accpayInvoicesFor`
     to `payableRowsFor`, `outstandingAccpayInvoicesFor` to `outstandingPayableRowsFor`,
     `casesForList` to `pairsForList`, `failedCases` to `openBillingExceptions`, `MirrorState` to
     `LedgerState`, with `BillingCase` gone by its gate grep), and the **"Your position" strip** 36 put
     above the Accounts sub-tabs (`data-shot="web-accounts-position"`) and the "Collected $X · Paid out
     $Y" line it added to mobile Balances. This doc uses the pre-36 names in the code entry points
     below; use whatever 36 actually shipped;
   - from **28**: `slotViewsForAnaesthetist`, `list.kind`, `approvalStateLabel`, and its "38: billed
     Lists and the Slot views are ready for stay visible" note;
   - from **26**: `gstPeriodLabel` and the GST period options in `src/domain/anaesthetistProfile.ts`,
     and whether the admin Master data table already uses it;
   - from **14**: the ids and bodies of `payment-full` / `payment-half` and `pwa-payment-full` /
     `pwa-payment-half`, and `office-authorises-list`;
   - from **16**: the `fees` Accounts sub-tab and `AA_FEE_BASIS` (fee payments are never income and
     never in GST activity).
5. Note the current `PERSIST_VERSION`.

## Reference

**Design files (convention 17):**

- `docs/design/Web Dashboard.dc.html`: the dashboard's anatomy. The greeting and day-summary line,
  "Offer cover", the week strip (its Tue 21 "St George's ✓" block is the completed marker this phase
  adds), the 12-column panel grid, the Receivables panel (title row with a mono total on the right, a
  top-bordered footer line with a teal text link), the Productivity stat tiles (micro-caps label, mono
  number) and "Who's free". The Financial position panel takes the Receivables slot and reuses the
  stat-tile anatomy; nothing new is invented.
- `docs/design/Mobile App.dc.html`: the Forward Lists row and its "Done · unbilled" tick cluster, the
  pattern the "Done · billed" cluster extends.
- `docs/design/Design Language.dc.html`: tokens (teal action colour, crimson identity only, the
  success and warning tints, mono tabular numbers, pills).
- No mockup covers Accounts or Balances; extend the web app's panels and tables and the mobile card
  list as they stand.

**Catalogue items:** the covered and context files listed above. US-12.1.2 and US-12.2.2 images:
"GST activity, defaulting to the anaesthetist's GST period"; US-12.2.2 mobile: "Amounts received this
month with their GST component". US-07.2.1 images show the web submitted List read-only and the
mobile "Done · unbilled" rows.

**Analysis files:**

- `docs/prototype-build/catch-up/GAP-ANALYSIS.md`: theme 12 (small parity items) and the EP-12 and
  EP-07 tables; the DM-30, RV-18 and RV-19 rows.
- `docs/prototype-build/catch-up/epics/EP-12.md` (US-12.2.3, US-12.1.2, US-12.2.2) and
  `epics/EP-07.md` (US-07.2.1, US-07.4.1).
- `analysis/domain-model-delta.md` DM-30 (and DM-18, DM-19 for the ledger this phase reads);
  `analysis/reverse-check.md` RV-18, RV-19 (and the dropped RV-16 note).
- `analysis/prototype-map-apps-mobile-web.md` (Dashboard, Lists, Accounts, Balances, Forward Lists,
  "Billed = gone", "Next-day handover", "Aging buckets"), `prototype-map-store-seed.md` (selectors,
  the `dashboards` seed), `prototype-map-shell-demo-pwa.md` (routes, the PWA).

**Code entry points** (line numbers are from 1f067a8; phases 14 to 36 will have moved them):

- Web: `src/apps/web/screens/DashboardScreen.tsx` (`AGING_ROWS` 26, receivables 62, `daySummary`
  71 with its `billedAtISO === undefined` filter, Receivables panel 183, Productivity 220, Leave 255,
  `StatTile` 347, `leaveRange` 377); `src/apps/web/useDashboardFigures.ts`;
  `src/apps/web/screens/AccountsScreen.tsx` (`AccountsSubTab` 19, `AGING_COLS` 28, local `GstPeriod`
  35, `OverdueTable` 80, `PaymentsTable` 174, `periodWindow` 266, `GstReport` 272);
  `src/apps/web/screens/AccountsScreen.test.tsx`; `src/apps/web/routes.tsx` (`ACCOUNTS_SUB_TABS` 28,
  `onViewOverdue` 57, `WebAccountsRoute` 131) and the `/web/accounts` redirect in `src/router.tsx`;
  `src/apps/web/screens/ListsScreen.tsx` (`!isListBilled` 63, From defaults to today 45);
  `src/apps/web/components/WeekStrip.tsx` (`!isListBilled` 40); `src/apps/web/screens/ListDetailView.tsx`
  ("Submitted to office" pill ~277).
- Mobile: `src/apps/mobile/screens/BalancesScreen.tsx` (aging total 38, "GST this month" 43, `AgeChip`
  140); `src/apps/mobile/screens/ForwardListsScreen.tsx` (`!isListBilled` 65, Done filter 78,
  `doneUnbilled` 135); `src/apps/mobile/screens/ListDetailScreen.tsx`;
  `src/shared/schedule/ListRow.tsx` (`ListRowRight`, `RightCluster`). The mobile List detail also has
  its own "Submitted to office" line (~303).
- Store (pre-36 names; Phase 36 renames most of these and adds `src/store/ledgerSelectors.ts`):
  `src/store/selectors.ts` (`isListBilled` 118, `dashboardFiguresFor` 128, `isBackdropList`
  141, `invoicesForList`, `casesForList` (36: `pairsForList`), `accpayRowForCase` 618,
  `accpayInvoicesFor` 649 (36: `payableRowsFor`), `outstandingAccpayInvoicesFor` 663
  (36: `outstandingPayableRowsFor`), `overdueAccountsFor` 668, `receivablesAgingFor` 679,
  `gstActivityFor` 709, `paymentHistoryFor` 763); `src/store/dashboard.test.ts`;
  `src/store/billingRun.ts` (header comment 1 to 13); `src/store/appStore.ts` (`PERSIST_VERSION`;
  `AppState extends SeedState`, so `dashboards` comes from the seed type; there is no `partialize`,
  the whole store persists, and `migrate` reseeds on a version mismatch); `src/store/mutate.ts`
  (`resetDomainState`, which does not copy `dashboards`); `src/store/persistMigrate.test.ts`.
- Only non-anaesthetist caller of `isListBilled`: the PWA office stand-in `src/pwa/officeSimulation.ts`
  (153). The admin Review queue, Invoices, Billing monitor and the Control Panel read `billedAtISO`
  directly.
- Domain and seed: `src/domain/dateDays.ts` (`AgingBucketKey`, `bucketForAgingDays`);
  `src/domain/seed/anaesthetistDashboard.ts`; `src/domain/seed/index.ts` (imports 61, re-exports 71 to
  78, `SeedState.dashboards` 122, `dashboards: ANAESTHETIST_DASHBOARD` 432);
  `src/domain/types.ts` (`List.billedAtISO` comment 320); `src/domain/anaesthetistProfile.ts`
  (Phase 26: `gstPeriodLabel`, period options).
- Admin: `src/apps/admin/screens/MasterData.tsx` (GST column ~183), `src/apps/admin/flows/fieldChrome.ts`
  (`GST_OPTIONS`), `EditAnaesthetistSheet.tsx`, `AddAnaesthetistFlow`.
- Demo: `src/shared/demoTriggers/registry.ts` (Phase 14), `src/apps/demo/DemoData.tsx` (the guard
  console), `src/shared/DemoBadge.tsx`.
- Playwright: `visual/routing.spec.ts` (49 to 60 and 85: the Overdue redirect and the dashboard link),
  `visual/web-phase05.spec.ts` (59 to 68: `w-09-overdue.png`, `w-10-gst.png`), `visual/screens.spec.ts`.

## Work items

Model, store and seed first, then UI. Keep the four commands green after each group.

### Domain and store

1. **GST periods as a pure module** (`src/domain/gstPeriod.ts`, exported from `src/domain/index.ts`;
   US-12.1.2, US-12.2.2). The period itself stays on the profile (`Anaesthetist.gstPeriod`); this
   module only computes windows.
   - `GST_BALANCE_MONTH = 3` (31 March balance date), one labelled demo assumption: NZ GST periods end
     on a cycle fixed by the balance date, which the prototype does not capture per anaesthetist. With
     a March balance date, two-monthly periods end in January, March, May, July, September and
     November, and six-monthly periods end in March and September.
   - `gstPeriodContaining(period, dateISO)` returns `{ fromISO, toISO }` for the aligned period that
     contains the date; `shiftGstPeriod(period, window, n)` steps whole periods; `gstPeriodView(period,
     offset, todayISO)` returns `{ fromISO, toISO, throughISO, inProgress, label }`, where `throughISO`
     is the earlier of `toISO` and today and `label` reads "July 2026", "June to July 2026" or
     "April to September 2026" (no dashes).
   - Pure date arithmetic on ISO strings through `date-fns` as the rest of the app does; no
     `Date.now()` or `new Date()`; today always comes in as an argument from the demo clock.
   - Vitest (`gstPeriod.test.ts`): for demo today Tue 21 Jul 2026, monthly is 1 to 31 Jul, two-monthly
     1 Jun to 31 Jul, six-monthly 1 Apr to 30 Sep, each `inProgress` with `throughISO` 2026-07-21;
     offset -1 gives June, 1 Apr to 31 May, and 1 Oct 2025 to 31 Mar 2026; year rollover (two-monthly
     1 Dec to 31 Jan); February in a leap year; every day of 2026 falls in exactly one period of each
     kind; two calls deep-equal.

2. **List billing status as a pure derivation** (`src/domain/listBilling.ts`; DM-30, US-07.2.1).
   - `listBillingStatus(list)` returns `'open'` (DRAFT), `'unbilled'` (SUBMITTED, or AUTHORISED with
     no `billedAtISO`) or `'billed'` (`billedAtISO` set). No stored field: `billedAtISO` remains the one
     stamp, written only by the billing run.
   - `LIST_BILLING_LABEL = { unbilled: 'Done · unbilled', billed: 'Done · billed' }`, the single
     source of the two markers for mobile, web and the tests.
   - Selector `listBillingSummaryFor(state, listId)` in `store/selectors.ts`: `{ status, invoiceNumbers,
     heldCount }`, where `invoiceNumbers` are the List's invoices read through the ledger (36's
     `pairsForList` or equivalent; non-backdrop, sorted) and `heldCount` counts Bookings on the List
     with an open billing exception (36's `openBillingExceptions`), that is, with the office.
   - Vitest: DRAFT, SUBMITTED, AUTHORISED unbilled and billed; a billed List with one failed Booking
     reports `heldCount` 1; a backdrop invoice is never listed.
   - Rewrite the "Lists vanish" comments in `store/billingRun.ts` (header), `domain/types.ts`
     (`billedAtISO`) and `isListBilled`: the stamp now marks the List billed. Keep `isListBilled` for
     the PWA office stand-in (`src/pwa/officeSimulation.ts`); the admin screens and the Control Panel
     read `billedAtISO` directly and are unchanged.

3. **The financial position** (US-12.2.3 with US-08.3.5; DM-19 anaesthetist scope).
   - **One definition on the web.** Phase 36 already shows these figures in its Accounts "Your
     position" strip through `anaesthetistLedgerPosition`. The dashboard panel uses the **same
     selector, the same figures and the same labels**, so the dashboard, the strip and mobile
     Balances can never disagree. Do not define a second "Owed". Only if 36's selector lacks a figure
     below, add a thin selector beside it that derives it from the ledger legs; never from
     `state.xero` (convention 9) or from `BillingCase` fields.
   - The figures (36's names in brackets), stated in a comment and in the Decisions log:
     - **Owed to you** (`owedToThem` = `awaitingCollection` + `dueNow`);
     - **Awaiting collection** (`awaitingCollection`): billed but not yet received. It reconciles to
       the flat Outstanding list's total (work item 4) to the cent;
     - **Collected** (`collected`) and **Paid out** (`paidOut`), to date;
     - **Due to you now** (`dueNow`): collected, released and not yet paid out.
   - **Next-day rule.** The Outstanding list shows an invoice from the day after it is raised
     (US-07.4.1's "the next day the new invoices appear"). If 36's position counts today's invoices
     in `awaitingCollection`, apply the same visibility rule to the anaesthetist-facing figures in one
     place (a thin wrapper used by both the dashboard and 36's strip), so Awaiting collection always
     equals the Outstanding total. Record which way it went.
   - AA fee invoices (Phase 16) are AA's income, not the anaesthetist's: they are excluded from all
     the figures above (36's `theyOweAa` stays on its strip and the AA fees tab only). Backdrop history
     is included (it is the anaesthetist's real history in the demo).
   - Vitest in the renamed `src/store/accountsViews.test.ts` (was `dashboard.test.ts`): Awaiting
     collection equals the Outstanding list's total to the cent, before and after "Next morning";
     Owed to you equals Awaiting collection plus Due to you now; Collected equals the sum of the
     anaesthetist's receipts; Paid out equals the sum of their disbursements; a full payment on
     AA-2026-0005 (after S3's authorise) raises Collected by $152.38 at once, and running payables
     raises Paid out by the same; another anaesthetist's figures do not move; an AA fee payment moves
     nothing; figures are deterministic across two fresh stores.

4. **Remove the ageing** (RV-19, D8 default).
   - Delete `receivablesAgingFor`, `ReceivablesAging`, `AgingBuckets`, `accountsOver60` and the
     `overdueAccountsFor` alias (under whatever names 36 left them) from `store/selectors.ts`,
     `store/ledgerSelectors.ts` and `store/index.ts`; drop `bucket` (and `agingDays`, unless another
     caller reads it) from the payable row type (`AccpayInvoiceRow` before 36); delete `AgingBucketKey`
     and `bucketForAgingDays` from `domain/dateDays.ts` and any re-export. Keep `epochDayOf` and
     `daysBetween`. The compiler lists every caller; each moves to 36's outstanding-rows selector
     (`outstandingPayableRowsFor`, was `outstandingAccpayInvoicesFor`). Update any 36 test that
     asserted aging buckets.
   - Add `outstandingTotalFor(rows)` (a pure sum in cents) if Phase 36 did not.
   - The 90-day unpaid threshold (OQ-33, answered) belongs to Phase 40's patient alert, not to this
     list; do not keep a bucket for it.
   - If D8 comes back "keep ageing", skip this item and keep the helpers (see the drift check).

5. **Remove the seeded dashboard figures** (RV-18).
   - Delete `src/domain/seed/anaesthetistDashboard.ts`, `SeedState.dashboards`, the
     `dashboards: ANAESTHETIST_DASHBOARD` seed line, the seed index imports and re-exports,
     `dashboardFiguresFor`, `deriveDashboardFigures`, `DashboardFigures` and
     `src/apps/web/useDashboardFigures.ts`. `AppState extends SeedState`, so the `dashboards` key
     leaves the store with the seed type; check `freshAppState` and any test fixture that builds a
     state by hand (`resetDomainState` never copied it, and there is no `partialize`).
   - **Bump `PERSIST_VERSION` by one** with a comment line ("Phase 38: seeded dashboard figures
     removed; ageing buckets gone") and extend `persistMigrate.test.ts` so a stale state with a
     `dashboards` key is discarded cleanly.
   - Seed determinism test still passes (two builds deep-equal).

### UI

6. **Web dashboard** (`DashboardScreen.tsx`; US-12.2.3).
   - Replace the Receivables panel with **Financial position** (`data-shot="web-financial-position"`),
     in the Receivables slot (span 7). Title row: "Financial position" with the Owed total in mono on
     the right. Body: three stat tiles in one row, reusing the Productivity tile anatomy without the
     pill: **OWED TO YOU**, **COLLECTED**, **PAID OUT**. Footer line (top border, as the mockup):
     "N unpaid invoices · $X awaiting collection · $Y collected, due to you · View outstanding invoices
     · View payments",
     the two links teal text buttons to `/web/accounts/outstanding` and `/web/accounts/payments`.
     Caption under the tiles: "To date, from the Billing Engine's ledger. New invoices appear the day
     after billing." Empty state when there is nothing at all: "No billed work yet."
   - The tiles show Owed to you, Collected and Paid out; the footer's figures are Awaiting collection
     ("N unpaid invoices · $X awaiting collection") and Due to you now ("$Y collected, due to you"),
     with the same labels as 36's strip. Reuse the strip's component if 36 built one that fits the
     panel anatomy.
   - Delete the Productivity and Leave panels, `leaveRange` and the `useDashboardFigures` call. Leave
     stays visible where it belongs: holiday blocks in the week strip and the Availability screens.
   - "Who's free · next 5 days" moves up beside Financial position (span 5), so the page is the week
     strip plus one row of two panels. Check the chips wrap cleanly at the web app's 1240px minimum;
     if they do not, use 6 and 6. Keep the panel anatomy, order and spacing of the mockup otherwise.
   - `daySummary` stops filtering billed Lists: a billed List today is still one of today's Lists.
   - Rename the `onViewOverdue` prop to `onViewOutstanding` and add `onViewPayments` in
     `routes.tsx`. Update the component's header comment (no seeded figures remain).

7. **Web Accounts: Outstanding** (`AccountsScreen.tsx`, `routes.tsx`, `router.tsx`; US-12.2.1, RV-19).
   - `AccountsSubTab`: `'overdue'` becomes `'outstanding'` (keep Phase 16's `'fees'`). The first
     sub-tab reads **Outstanding**. `/web/accounts` redirects to `/web/accounts/outstanding` (the
     index `Navigate` in `router.tsx`), and `/web/accounts/overdue` redirects there too, so old links
     and bookmarked guide URLs keep working. `WebAccountsRoute` wraps the screen in `RequireEntity`,
     so once `'overdue'` leaves `ACCOUNTS_SUB_TABS` it would render not-found: add an explicit
     `<Route path="overdue" element={<Navigate to="../outstanding" replace />} />` before `:subTab`
     (keeping any `?invoice=` query), or map it inside `WebAccountsRoute`.
   - Phase 36's "Your position" strip above the sub-tabs stays, with the labels of work item 3.
   - `OutstandingTable` (`data-shot="web-accounts-outstanding"`): one row per unpaid invoice, oldest
     first, no grouping. Columns: Invoice (mono), Patient, Payer, Raised, Outstanding (mono, right).
     Leave any ACC column exactly as Phase 18 left it (RV-20 is not this phase's). Footer: one
     "Total outstanding" row with the count ("N invoices") and the sum. No bucket columns or totals.
   - Caption: "One row per unpaid invoice, oldest first. For a question about a line, contact the
     office." (US-12.2.1: queries go to office staff.) With D8 unanswered, add a `DemoBadge`
     "Provisional · no ageing until AA confirms".
   - Empty state: "No outstanding invoices. New invoices appear here the day after billing."
   - Header subline: "Outstanding invoices, payments and your GST activity."
   - The Payments tab is unchanged (Phase 16 reshaped it); its caption's "after they leave Overdue"
     becomes "after they leave Outstanding".

8. **Web Accounts: GST activity** (`GstReport`; US-12.1.2, US-12.2.2).
   - Delete the local `GstPeriod` type, `periodWindow` and the local label map. The window comes from
     `gstPeriodView(period, offset, today)`.
   - Keep the "View by" Segmented (Monthly, Two-monthly, Six-monthly through `gstPeriodLabel`),
     defaulting to the profile's period and resetting when it changes, as Phase 26 left it. Changing it
     resets the offset to the current period.
   - Add a period stepper (`data-shot="web-gst-period-nav"`): previous and next buttons around the
     period label ("June to July 2026"), with "In progress, to 21 Jul" under the current period. Next is
     disabled on the current period. "Current period" returns to offset 0.
   - Add **Custom range**: a text button that swaps the stepper for From and To date inputs (the Lists
     screen's input style, "to" between them, To capped at today), with "Back to GST periods" to
     return. The table and totals follow whichever window is active. This is the "date-ranged" half
     of US-12.2.2.
   - The caption states the window in words: "Two-monthly period, 1 June to 31 July 2026 · one row per
     amount received, each with its GST component". A short footnote states the balance-date
     assumption ("Periods assume a 31 March balance date").
   - Rows, columns and totals are unchanged (`gstActivityFor` over the ledger's receipts).

9. **One GST period label everywhere** (US-12.1.2 label drift). Phase 26 planned the Master data
   label and the GST tab's shared label; this item confirms that and closes whatever is left.
   - Every surface that shows or edits a GST period reads `gstPeriodLabel` and the shared options from
     `src/domain/anaesthetistProfile.ts`: the admin Master data Anaesthetists table (no raw enum), the
     Edit and Add anaesthetist sheets (`fieldChrome.ts` `GST_OPTIONS` imports them), the web and mobile
     profile, the web GST tab and the mobile peek. "Bi-monthly" disappears from the app.
   - Vitest: `GST_OPTIONS` labels equal `gstPeriodLabel` for every value; a render test of the Master
     data Anaesthetists table shows "Six-monthly" for Dr Whitaker, never `sixMonthly`.

10. **Mobile Balances** (`BalancesScreen.tsx`; US-12.2.1, US-12.2.2, RV-19).
    - The total card reads the outstanding list's total (not `aging.total`); the subline keeps
      "N unpaid invoices". Phase 36's "Collected $X · Paid out $Y" line stays and reads the same
      selector as the web figures.
    - Delete `AgeChip`. Each row's second line becomes "<invoice number> · <payer> · Raised 14 Jul". Keep any ACC
      chip as Phase 18 left it.
    - The GST section follows the profile's period: the segment reads **GST this period**, the header
      reads "July 2026 received" for a monthly anaesthetist (so Dr Souter's view matches the catalogue's
      "this month" image) or "June to July 2026 received" for a two-monthly one, and the window is
      `gstPeriodView(period, 0, today)`. Empty copy: "No payments received this period yet."
    - Header comment updated (flat list, no ageing, period-aligned GST).

11. **Billed Lists stay visible** (DM-30, US-07.2.1, D9 default).
    - **Shared row** (`ListRow.tsx`): add `ListRowRight` kind `doneBilled`, the same tick cluster as
      `doneUnbilled` with the label `LIST_BILLING_LABEL.billed` in a neutral slate tone, so "billed"
      reads as settled rather than as a new success state. Both labels come from
      `LIST_BILLING_LABEL`.
    - **Mobile Forward Lists** (`ForwardListsScreen.tsx`): drop the `!isListBilled` filter; exclude
      backdrop Lists (`isBackdropList`, as Phase 28 left it; today an `L-HIST` id prefix) instead, so
      the seeded history does not flood the view. Week
      and Month stay forward-only. **Done** shows every SUBMITTED or AUTHORISED List, billed or not,
      newest first, with `doneUnbilled` or `doneBilled`. Add a one-line caption on the Done filter
      while D9 and OQ-31 are open: "Billed Lists stay here once invoiced (provisional)".
    - **Mobile and web List detail** (`ListDetailScreen.tsx`, `ListDetailView.tsx`): the header state
      pill reads `LIST_BILLING_LABEL` for unbilled and billed Lists (replacing "Submitted to office" on
      both). A billed List shows one read-only line under the header: "Invoiced · AA-2026-0005,
      AA-2026-0006", plus "1 Booking with the office" when `heldCount` is above zero. Bookings stay read
      only (the store's `editRefusal` already refuses anaesthetist edits on SUBMITTED and AUTHORISED
      Lists); check no add, copy, capture or photo control appears on a billed List on either app.
    - **Web Lists** (`ListsScreen.tsx`): drop `!isListBilled`. Add a Segmented above the table:
      **Upcoming** (today's behaviour, From and To shown, default today to four weeks) and
      **Completed** (`data-shot="web-lists-completed"`: every SUBMITTED or AUTHORISED List of the
      persona, billed or not, newest first, backdrop excluded, no date inputs). Add a **Progress**
      column showing the `LIST_BILLING_LABEL` marker (blank for open Lists and empty Slots), so a
      submitted List from Monday is one click away instead of hidden behind the From date. Completed
      rows drill into List detail. Same provisional caption as mobile on Completed.
    - **Web week strip** (`WeekStrip.tsx`): drop `!isListBilled`; an unbilled or billed List's block
      gets the mockup's "✓" after its first label line, with a `title` of the marker text.
    - With D9 answered "vanish", apply only the web marker and the Completed view for unbilled Lists
      (see the drift check).

12. **Demo triggers** (the registry, `src/shared/demoTriggers/registry.ts`; see the next section).
    Re-point, do not add behaviour: put the chooser payment entries on the web money screens, and
    reword the PWA stand-in's result message.

13. **Copy and comment sweep.** Grep `src/` for `Overdue`, `overdue`, `aging`, `Aging`,
    `Receivables`, `productivity`, `vanish`, `Bi-monthly` and `No rollup (per the RFP)`; every
    user-visible string is reworded to the new vocabulary, and stale comments are fixed. The admin
    Billing monitor's "Prior balance" tooltip keeps its own wording (Phase 40's). No en or em dashes in
    any string added or changed.

14. **Tests and shots.**
    - `AccountsScreen.test.tsx`: Outstanding renders one row per unpaid invoice oldest first with a
      single total and no bucket headers; GST previous and next change the window and the totals; Next
      is disabled on the current period; Custom range filters to the entered dates; the default period
      follows the profile.
    - A Forward Lists or ListRow test: after authorising Souter's Mon 20 AM List, Done shows it with
      "Done · billed"; a SUBMITTED List shows "Done · unbilled"; no backdrop List appears.
    - A ListsScreen test: Completed lists the billed Mon 20 List with its marker; Upcoming is unchanged.
    - Playwright: `visual/routing.spec.ts` (bare `/web/accounts` and `/web/accounts/overdue` both land on
      `/web/accounts/outstanding`; the dashboard's "View outstanding invoices" link goes there);
      `visual/web-phase05.spec.ts` shots renamed `w-09-outstanding.png` and `w-10-gst.png` (with the
      stepper), plus `w-01` dashboard re-shot; a new shot of mobile Done with a billed row. `data-shot`
      hooks as named above.

## Demo triggers

Everything this phase shows is reachable by normal use in the framed build: the office authorises a
List (the billing run marks it billed), the Xero simulator's "Simulate payment and payout" or the
Billing monitor's payables run moves Collected and Paid out, and the demo clock's "Next morning"
brings yesterday's invoices into Outstanding. So there is **no new trigger**. Two existing Phase 14
entries are re-pointed so the money beat can be driven from the screen being presented:

| Label | Screen | Surface | Effect |
|---|---|---|---|
| Payment received · full / half (re-pointed) | Web · Dashboard (`/web`) and Web · Accounts (`/web/accounts/:subTab`) | bar | Phase 14's `choices` is per entry, so the URL-driven `payment-full` / `payment-half` (Admin Invoice, Xero pair) stay exactly as they are. Instead the chooser entries `pwa-payment-full` / `pwa-payment-half` gain the web patterns and the `bar` surface on those patterns only (or, if the registry cannot scope a surface per pattern, two `web-payment-full` / `web-payment-half` entries calling the same shared body). The chooser lists the open ACCRECs from `openAccRecs` whose invoice belongs to the current persona (`ctx`), not a hardcoded Souter. The webhook lands, Collected rises at once and the Payments tab shows the row. Disabled with "No open invoices yet" when empty |
| Office authorises this List (re-worded) | Mobile · List (`/mobile/lists/:listId`) | PWA only, badged office stand-in | Unchanged body. Its result message now reads "Authorised and billed. The List shows Done · billed; its invoices reach Balances tomorrow (Next morning on More)" |

PWA parity: the mobile beats are Done (billed marker), Balances (flat list, period GST). The List's
move to billed on a handset comes from "Office authorises this List", the payment from Phase 14's
`pwa-payment-*` on Balances, and the next-day handover from the clock on More. The Financial position
is web only (US-12.2.3 is the web dashboard), so no PWA payout stand-in is needed: a payout does not
change anything the mobile app shows. The Control Panel page gains nothing; its index picks up the
re-pointed routes automatically.

## Out of scope

- The ledger itself, the Admin whole-ledger and per-anaesthetist screens and the imbalance indicator
  (Phase 36). This phase only reads the anaesthetist's position.
- Disbursement detected from Xero, bulk remittance and voids (Phase 37); credit notes and rebills
  leaving or joining the outstanding list (Phase 39). Both change the figures through the ledger with
  no change here.
- The patient unpaid alert and its 90-day threshold (Phase 40, OQ-33).
- A mobile dashboard or a mobile financial position (US-12.2.3 is the web app's dashboard); a mobile
  AA fee view (Phase 16 recorded it as a candidate; not built).
- AA fee invoices on the dashboard: they stay on Phase 16's Accounts AA fees tab.
- A leave request workflow or "Request leave" button (US-01.5.3 is Open; Phases 29 and 30 own
  availability and leave).
- A per-anaesthetist GST balance date: one labelled assumption (31 March) until AA says otherwise.
- Export, print or download of any accounts view.
- Changing the billed trigger (OQ-31): the billing run's stamp stays the event.
- The "Done · unbilled" marker on a DRAFT List whose Bookings are all complete: the mobile mockup
  shows it that way and it is unchanged.
- The ~100-row scale of the outstanding list (Phase 43).
- Productivity reporting of any kind. If AA asks for it, it becomes a new catalogue item first.

## Manual test checklist

- [ ] Reset. Web → Dashboard: the greeting, day summary, Offer cover and week strip are as before;
      below them, one row of two panels, Financial position and Who's free. No Productivity, no Leave,
      no ageing bars. Leave still shows as holiday blocks in the week strip.
- [ ] Financial position shows Owed to you, Collected and Paid out in mono, with the unpaid count, the
      awaiting-collection and due-now figures and two teal links. Its figures equal the Accounts "Your
      position" strip; Awaiting collection equals the Outstanding tab's total to the cent.
- [ ] Web → Accounts opens on **Outstanding** at `/web/accounts/outstanding`; `/web/accounts/overdue`
      redirects there (no not-found page). One row per unpaid invoice, oldest first, a single total, no bucket columns, the
      office-contact caption and the provisional badge.
- [ ] S3: authorise both Mon 20 Jul Lists in Admin. Mobile → Lists → Done shows both with
      "Done · billed"; the List detail shows "Invoiced · ..." with the invoice numbers and no edit
      controls. Web → Lists → Completed shows both with the Progress marker; the week strip's Mon 20
      blocks carry the tick.
- [ ] Submit a List without authorising it: mobile Done and web Completed show "Done · unbilled"; the
      Demo Data guard console still refuses an anaesthetist edit on it.
- [ ] Open AA-2026-0005 in the Xero simulator, Simulate payment and payout, return to the web
      dashboard: Collected and Paid out have each risen by $152.38; after the payout Owed to you is
      back to its starting figure.
- [ ] On Web → Accounts → Payments, the harness bar's Demo actions shows "Payment received · full /
      half" with a chooser of Dr Souter's open invoices; a half payment raises Collected by that
      amount and Due to you now by the same. On Admin · Invoice the URL-driven entries behave as before. The entries do not show on Web → Lists or Availability.
- [ ] Next morning (clock): yesterday's new invoices join Outstanding on web and mobile, and Awaiting
      collection still equals the Outstanding total.
- [ ] Web → Accounts → GST activity (Dr Souter, monthly): "July 2026", in progress to 21 Jul; Previous
      shows June 2026 with its receipts and totals; Next is disabled on July. View by Two-monthly:
      "June to July 2026"; Six-monthly: "April to September 2026"; Previous gives "October 2025 to
      March 2026". Custom range 1 May to 21 Jul filters the rows and totals.
- [ ] Change the GST period on the web profile to Two-monthly: GST activity defaults to it; mobile
      Balances reads "GST this period" with "June to July 2026 received". Set it back to Monthly.
- [ ] Admin → Master data → Anaesthetists: the GST column reads Monthly and Six-monthly (Dr Whitaker),
      never a raw code; the Edit sheet uses the same words. "Bi-monthly" appears nowhere.
- [ ] Mobile → Balances: a flat list with "Raised <date>" on each row and no age chips; the total equals
      the web Outstanding total.
- [ ] PWA (`npm run dev:pwa`, fresh storage): submit a List, open it, Demo chip → "Office authorises this
      List": the message names Done · billed; the List stays under Done with "Done · billed". Balances →
      "Payment received · full" still applies. No other new entries.
- [ ] No en or em dashes in any new or changed string; teal is the only action colour; crimson unused
      in the new panel.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots` are all green.

## Demo guide updates

Patch in the same session (`docs/demo-guide/`, the same sections of `master-demo-guide.html`, and the
Control Panel scenario text if it names Overdue, ageing or the List vanishing):

- `03-demo-script.md`:
  - **Direct URLs**: "Accounts, outstanding" becomes `/web/accounts/outstanding`; add
    `/web/accounts/payments`.
  - **S3 Beat 1** (after authorising the Mon 20 Lists): an optional aside, "on the phone or the web the
    Lists now read Done · billed instead of disappearing (provisional, OQ-31)".
  - **S3 Beat 3** (payment, balances and disbursement): Expected gains "the web dashboard's Collected
    and Paid out each rise by $152.38"; "It does not remain under Overdue" becomes "under Outstanding".
  - **S3 discovery points**: "the exact List-disappearance trigger" becomes "whether billed Lists stay
    visible (the prototype keeps them under Done · billed) and which event marks them billed (OQ-31)";
    add "whether AA wants an aged or Overdue view (D8; the prototype shows a flat list)".
- `02-workflows-and-handoffs.md`: workflow step 10 ("stamps billedAt and removes the List") becomes
  "marks the List billed; it stays visible as Done · billed"; the balances step names the financial
  position, the flat outstanding list and period-aligned GST.
- `01-personas-and-responsibilities.md`: the anaesthetist money paragraph drops "receivables aging"
  and names the financial position (owed, collected, paid out).
- `04-presenter-cheat-sheet.md`: section 2 "Exact List disappearance trigger" becomes "Billed Lists
  stay visible (OQ-31, provisional)"; section 11 drops the derived-ageing line; "What each app is for"
  (Anaesthetist Web) reads "Dashboard with your financial position".
- `master-demo-guide.html`: the same sections (the SUBMITTED line, the balances note, the Direct URLs
  row, S3 Beat 3 Expected and its discovery callout, cheat-sheet cards 2 and 11).
- No S1, S2, S4 or S5 beat changes. Phase 44 rewrites S3 around the ledger and regenerates the guide.

## Adversarial review (after build)

Once the manual test checklist and `npm run build`, `npm run build:pwa`, `npx vitest run` and
`npm run shots` are green, and before writing the PROGRESS entry, run the standard **adversarial
review-and-fix pass (PROGRESS convention 18)**:

- fan out three independent Opus review subagents, one each for **quality**, **bugs/correctness** and
  **plan adherence**, each given the covered catalogue files, this doc and the diff;
- this session then independently verifies every finding against the catalogue, this doc and the
  code, fixes the confirmed ones (with a test wherever a bug had none), re-greens, and records the pass
  in the phase entry;
- do not re-raise anything already settled in the Decisions log (as amended by this phase).

**Steer this phase's reviewers at:**

- **Ledger truth.** Every dashboard and Accounts figure reads the engine's ledger (Phase 36), never
  `state.xero` and never a seeded constant. The dashboard and 36's "Your position" strip show the same
  figures from one selector; Awaiting collection equals the Outstanding total to the cent; Collected
  and Paid out match the receipts and disbursements; AA fee invoices and fee payments move none of
  them. Hunt for any path where the Payments tab, the dashboard and mobile Balances disagree.
- **No ageing left behind.** No bucket, "over 60 days", age chip, "overdue" copy or `AgingBucketKey`
  survives (unless D8 was answered "keep"). The old `/web/accounts/overdue` URL redirects rather than
  404s.
- **GST alignment.** Period boundaries are correct for all three kinds, across year ends and leap
  years, with the balance-date assumption in one constant and labelled; the in-progress period stops
  at the demo clock's today; Next never passes the current period; the custom range is inclusive of
  both ends and matches `gstActivityFor`'s bounds; no `Date.now()` or `new Date()`.
- **Billed Lists.** One derivation (`listBillingStatus`) and one label source (`LIST_BILLING_LABEL`)
  on both apps; no anaesthetist view still filters on `isListBilled`; backdrop Lists stay out; a
  billed List is read only everywhere (no add, copy, capture, photo or edit reachable, and the store
  refuses it); the PWA office stand-in's `isListBilled` use and the admin `billedAtISO` reads are
  untouched; the next-day rule for Outstanding still holds.
- **Scope and triggers.** No Productivity or Leave remnants (components, seed, selectors, tests); no
  new Control Panel entry; the re-pointed payment entries show only on their routes and the PWA
  stand-in stays PWA-only; bodies live in `src/shared` or `src/store` so `pwaPurity` holds.
- **Persistence.** `PERSIST_VERSION` bumped, the migrate test discards a stale `dashboards` key, and
  two fresh seeds deep-equal.
- **Design and copy.** The dashboard keeps the Web Dashboard mockup's panel anatomy and rhythm; stat
  tiles in mono; teal-only actions; no crimson in panels; provisional labels present where D8 and D9
  are unanswered; no en or em dashes.

## PROGRESS.md updates

- **Status row** for catch-up Phase 38, and a phase entry with:
  - the drift-check result (items changed or not; OQ-31 status; D8 and D9 answered or built as
    provisional defaults, and which branch);
  - what was built, with the name map for later phases: `receivablesAgingFor`, `overdueAccountsFor`,
    `AgingBucketKey`, `bucketForAgingDays`, `dashboardFiguresFor`, `useDashboardFigures`,
    `SeedState.dashboards` and `anaesthetistDashboard.ts` removed; `gstPeriodView` and
    `GST_BALANCE_MONTH` in `src/domain/gstPeriod.ts`; `listBillingStatus`, `LIST_BILLING_LABEL` and
    `listBillingSummaryFor`; the Outstanding sub-tab and its redirects; the Phase 36 position selector
    actually used;
  - the `PERSIST_VERSION` bump (from and to);
  - tests added and the before and after Vitest and Playwright counts;
  - the review pass.
- **Decisions log:**
  1. **Superseded:** the 2026-07-22 third external plan review, finding #12, and the Phase 08 reading
     that the `billedAtISO` stamp removes the List from the anaesthetist's views (the "billed = gone"
     rule, M10). Billed Lists stay visible as "Done · billed" (D9 default, provisional while OQ-31 is
     open); the stamp is still the event.
  2. **Superseded:** 2026-07-23 "Seeded anaesthetist-dashboard figures". The Productivity and Leave
     panels and their seed are removed (RV-18); the dashboard is calendar, financial position and cover.
  3. **Amended:** 2026-07-21 "Navigation structures from the design" and the Phase 05 Overdue anatomy.
     Accounts houses Outstanding (flat, no ageing: D8 default or the owner's answer), Payments, GST
     activity and AA fees.
  4. **New:** the financial position on the dashboard uses Phase 36's anaesthetist position (Owed to
     you, Awaiting collection, Collected, Paid out, Due to you now), to date, AA fees excluded, with
     the next-day rule applied so Awaiting collection equals the Outstanding total.
  5. **New:** GST periods are aligned periods computed from one assumed 31 March balance date
     (`GST_BALANCE_MONTH`), with previous and next navigation and a custom range; mobile shows the
     current period.
- **Handoff notes:**
  - For **39**: a credited invoice must leave Outstanding and a rebill join it through the ledger; the
    financial position then moves with no screen change.
  - For **37**: a disbursement detected from Xero must raise Paid out on the dashboard.
  - For **40**: the anaesthetist ageing view is gone; the 90-day patient threshold is Phase 40's own
    rule on patient invoices.
  - For **43**: the flat Outstanding list must stay usable at about 100 rows per anaesthetist.
  - For **44**: S3 Beats 1 and 3 and the discovery points were patched here; re-read them in the
    rewrite. If D8 or D9 is answered later, the provisional labels and branches listed above are the
    places to change.
