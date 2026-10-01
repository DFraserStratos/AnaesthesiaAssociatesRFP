# Phase 38 · Web accounts, outstanding list and GST schedule

**Requirements covered:**
[US-12.2.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-12.2.3.md) Dashboard ·
[FT-12.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-12.2.md) Reporting for anaesthetists (both reports read the engine's own ledger) ·
[US-12.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-12.2.1.md) Outstanding balances list (Confirmed; a flat list of unpaid payables, oldest first, no ageing, owner decision **D8**) ·
[US-12.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-12.2.2.md) GST schedule (Verify; cash basis of payables actually paid, with a balance check) ·
[US-12.1.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-12.1.2.md) GST period (the aligned window and the label drift; Phase 26 already lets the anaesthetist set it) ·
[US-07.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-07.2.1.md) Anaesthetist loses edit access (the web "completed, unbilled" marker) ·
[DM-29](../analysis/domain-model-delta.md#dm-29) GST schedule on a cash basis of payables actually paid ·
[DM-36](../analysis/domain-model-delta.md#dm-36) List visibility after invoicing: unbilled to billed, not vanished ·
[RV-18](../analysis/reverse-check.md#rv-18-dashboard-productivity-and-leave-panels) Dashboard Productivity and Leave panels ·
[RV-19](../analysis/reverse-check.md#rv-19-receivables-aging-buckets-and-overdue-rollups) Receivables aging buckets and "overdue" rollups.
Read alongside (not closed here):
[US-08.3.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.3.5.md) (the per-anaesthetist ledger position: owed, collected, paid out; Phase 36 builds it, this phase puts it on the dashboard),
[US-08.3.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.3.1.md) (the linked receivable and payable, which "unpaid payables" names),
[US-10.1.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-10.1.2.md) (paid in and disbursed are two states; US-12.2.2 now relates to it),
[US-05.2.7](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.2.7.md) (the GST component),
[FT-07.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-07.4.md) and
[US-07.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-07.4.1.md) (Open: when a List leaves the view),
[US-11.3.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.3.2.md) (the 90-day threshold is a mild or strong patient alert, Phase 40, not an ageing view),
[OQ-59](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-59.md) (answered: the flat list),
[OQ-31](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-31.md) (Open: the billed event),
[OQ-29](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-29.md) and
[OQ-60](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-60.md) (GST agency treatment and the AA fee basis, both with AA's accountant),
[OQ-33](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-33.md),
the 2026-10-01 meeting note ([2026-10-01-aa-meeting-with-greg.md](../../../discovery-reference/Updated%20Requirements/catalogue/notes/2026-10-01-aa-meeting-with-greg.md), points 33, 40, 41 and 66), and the
"Internal ledger" section of [domain-model.md](../../../discovery-reference/Updated%20Requirements/domain-model.md).
**Depends on:** 28 (Lists are their own records; `slotViewsForAnaesthetist`, `list.kind`,
`approvalStateLabel`) and 36 (the internal ledger: receivable and payable legs, `LedgerDisbursement`
entries, and the per-anaesthetist position). By the roadmap order 14 (the demo-trigger registry and
its payment entries), 15 (Booking vocabulary), 16 (payable equals receivable, the monthly AA fee
invoice and the AA fees tab), 21 (the billable party), 22 (the Contract's `gstTreatment`, which
changes only how an invoice presents GST, never its stored amounts), 25,
26 (the profile's GST period and the shared `gstPeriodLabel`) and 27 have also run. 37 and 39 may run
before or after this phase. Ben called the GST schedule "one of the deliverables needed very early in
the piece" (note point 40): if AA needs it sooner, this phase can run straight after 36.
**Estimated:** 2 sessions. Session 1: work items 1 to 8 (the pure modules, the outstanding rework,
ageing and seed removal, the dashboard and the Outstanding tab), green at the end. Session 2: items 9
to 16 (the GST schedule screens, the label sweep, Balances, billed Lists, triggers, tests, the demo
guide and the review pass).

## Goal

The web dashboard is the anaesthetist's one overview of their week, their money and who can cover
(US-12.2.3). Today its money panel is a receivables-ageing chart with invented buckets, and two of
its five panels (Productivity and Leave) are hardcoded seed constants for Dr Souter only. The
catalogue asks for the **financial position** instead: what the anaesthetist is **owed**, what has
been **collected** and what has been **paid out** (US-08.3.5), read from the engine's ledger, which
Phase 36 made the system of record. FT-12.2 gives the anaesthetist two reports of their own, both
from that ledger: a flat list of what is owed to them and a GST schedule of what AA paid them.

This phase:

- replaces "Receivables aging" with a **Financial position** panel over Phase 36's
  per-anaesthetist ledger position, and removes the seeded **Productivity** and **Leave** panels and
  their seed slice (RV-18). The Web Dashboard mockup's layout and panel anatomy are kept for what
  remains;
- turns the Accounts **Overdue** tab into a flat **Outstanding** list on web and mobile, per owner
  decision **D8** (OQ-59, answered): one row per unpaid payable, oldest first, with no ageing
  buckets, no bucket totals, no age chips, no Overdue tab or route and no dashboard ageing panel
  (US-12.2.1, Confirmed; RV-19). A row is the **unpaid payable** (US-12.2.1's words): it stays until
  AA has paid the anaesthetist, not only until the payer has paid AA;
- turns the receipts-based **GST activity** report into the catalogue's **GST schedule** on a cash
  basis (US-12.2.2, DM-29): the payables AA actually paid the anaesthetist in their GST period (from
  the ledger's disbursement entries), the sale AA made for them and its GST component, and a check
  that it balances with what they were paid. A receipt alone adds nothing; anything collected but not
  yet paid out falls into the period it is paid in. The schedule follows the saved GST period
  (monthly, two-monthly or six-monthly) as aligned periods with previous and next navigation on the
  web, and the mobile peek shows the current period (US-12.1.2). One period label is used on every
  surface, fixing the "biMonthly" / "Bi-monthly" / "Two-monthly" drift;
- keeps billed Lists visible: a List reads **"Done · unbilled"** once submitted and **"Done · billed"**
  once its invoices are generated, on web and mobile, instead of vanishing (DM-36, owner decision
  **D9**, still open: the default, labelled provisional while OQ-31 is open). The web Lists table and
  week strip get the marker US-07.2.1 asks for.

No new stored entity. The seed loses the `dashboards` slice, so `PERSIST_VERSION` is bumped.

## Before you start: drift check

1. Run the drift check against the plan's catalogue snapshot:

   ```
   git diff 501b0b8 -- "docs/discovery-reference/Updated Requirements/catalogue" "docs/discovery-reference/Updated Requirements/domain-model.md"
   ```

   Read the diff for US-12.2.3, FT-12.2, US-12.2.1, US-12.2.2, US-12.1.2, US-07.2.1, the context
   items US-08.3.5, US-08.3.1, US-10.1.2, FT-07.4, US-07.4.1, US-11.3.2, and OQ-31, OQ-29 and OQ-60. If
   an item changed, re-read it and adjust the work items. If an item is now Retired or Future, drop
   its work items and record that in the PROGRESS entry. At plan time (501b0b8) US-12.2.1 was
   **Confirmed**, US-12.2.2 **Verify** (its release slot unconfirmed), US-07.4.1 **Open**, and
   US-12.2.3, US-12.1.2 and US-07.2.1 **Proposed**; OQ-59 was answered and OQ-31, OQ-29 and OQ-60
   were open.
2. **Owner decisions** (the ROADMAP decisions table):
   - **D8 (ageing and an "Overdue" view): answered** at the 2026-10-01 meeting (OQ-59, "let's go with
     your recommendation for now"). Build the flat list, oldest first, no buckets, no age chips, no
     Overdue view. Nothing in the UI is labelled provisional for it. If the drift check shows OQ-59
     reopened, stop and ask the owner.
   - **D9 (do billed Lists vanish): still open** (OQ-31). Build the default: they stay, shown as
     "Done · unbilled" and then "Done · billed", labelled provisional in the UI (work item 13). If it
     has been answered **they vanish**: keep the `isListBilled` filters in the anaesthetist views,
     still build the web "Done · unbilled" marker and the web Completed view for submitted and
     authorised Lists (US-07.2.1 needs both), and skip the "Done · billed" row kind. Record which
     branch was built.
3. **Open question OQ-31** (the event that removes a List from the view). If still open, the safe
   interim is the one the prototype already has: the billing run's `billedAtISO` stamp is the
   "billed" event. Nothing in this phase moves that trigger; the List changes label instead of
   disappearing, and the Done filter and Completed view label the behaviour provisional.
4. **US-12.2.2 is Verify.** Build its text as written (cash basis of payouts, the sale and its GST,
   a balance check). Two points stay with AA's accountant and are not built: whether the BCTI is one
   per procedure rather than one per receivable invoice (the plan's one provisional place; see
   ROADMAP "BCTI granularity") and GST agency treatment (OQ-29). The schedule has one row per payable
   (BCTI) so a flip changes only the row grain.
5. **Prerequisite names.** Confirm Phases 28 and 36 are DONE in PROGRESS.md and read their handoff
   notes:
   - from **36**: the name and shape of the per-anaesthetist position selector (planned as
     `anaesthetistLedgerPosition(state, id)` over `anaesthetistPosition(pairs, id)`, returning
     `dueNow`, `awaitingCollection`, `owedToThem`, `collected`, `paidOut`, `theyOweAa`), and whether it
     applies the next-day rule to invoices raised today. The ledger shapes: `LedgerPair` by `kind`
     (`procedure`, `prePayment`, `aaFee`), `PayableLeg` (`amount`, `releasedAmount`,
     `disbursedAmount`, `paidOutAtISO`), `LedgerDisbursement` (`pairId`, `anaesthetistId`, `amount`,
     `atISO`, `payablesRunId`) in `billing.disbursements`, and `incomeReceiptsFor`. Also 36's renames
     (planned: `accpayInvoicesFor` to `payableRowsFor`, `outstandingAccpayInvoicesFor` to
     `outstandingPayableRowsFor`, `casesForList` to `pairsForList`, `failedCases` to
     `openBillingExceptions`, `MirrorState` to `LedgerState`, with `BillingCase` gone by its gate
     grep), the **"Your position" strip** above the Accounts sub-tabs
     (`data-shot="web-accounts-position"`), the "Collected $X · Paid out $Y" line on mobile Balances,
     and the PWA "Office runs payables" stand-in on Balances. This doc uses the pre-36 names in the
     code entry points below; use whatever 36 actually shipped;
   - from **28**: `slotViewsForAnaesthetist`, `list.kind`, `approvalStateLabel`, and its "38: billed
     Lists and the Slot views are ready for stay visible" note;
   - from **26**: `gstPeriodLabel` and the GST period options in `src/domain/anaesthetistProfile.ts`,
     the profile route that edits the GST period, and whether the admin Master data table already
     uses the label;
   - from **22**: where an invoice's GST lives (today `Invoice.gst` and `Invoice.total`); 22 planned
     `gstTreatment` as presentation only (amounts stay GST exclusive, totals never differ), so the
     schedule reads the stored GST and never recomputes it;
   - from **21**: the billable party label the money rows use (it replaces "payer");
   - from **14**: the ids and bodies of `payment-full` / `payment-half` and `pwa-payment-full` /
     `pwa-payment-half`, and `office-authorises-list`;
   - from **16**: the `fees` Accounts sub-tab and the AA fee invoice (AA's own invoice to the
     anaesthetist: never income, never on the GST schedule, never in the outstanding list).
   - if **39** or **39a** has run: credit legs and negative invoices, and whether 39a nets them in the
     payables run (work item 2's balance check must then show the netting).
6. Note the current `PERSIST_VERSION`.

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

**Catalogue items:** the covered and context files listed above. The US-12.2.2 images still show the
old screens ("GST activity, defaulting to the anaesthetist's GST period"; mobile "Amounts received
this month with their GST component"); the body text governs, so the schedule lists payouts, not
receipts. US-07.2.1 images show the web submitted List read-only and the mobile "Done · unbilled"
rows. US-12.2.1's Note records that "oldest first" and "no age chips" come from the recommendation
AA accepted. US-12.2.3's image caption still reads "week calendar, receivables, productivity and
cover", and US-08.3.5's says "aged": the item text governs (calendar, financial position, locum
availability; RV-18 and D8), so Productivity and ageing go.

**Analysis files:**

- `docs/prototype-build/catch-up/GAP-ANALYSIS.md`: theme 11 (flat outstanding list, payout-basis GST
  schedule), "Remove or rework" (ageing, receipts-based GST), the EP-12 and EP-07 tables; the DM-29,
  DM-36, RV-18 and RV-19 rows.
- `docs/prototype-build/catch-up/epics/EP-12.md` (FT-12.2, US-12.2.1, US-12.2.2, US-12.2.3,
  US-12.1.2) and `epics/EP-07.md` (US-07.2.1, US-07.4.1).
- `analysis/domain-model-delta.md` DM-29 and DM-36 (and DM-22, DM-23 for the ledger this phase
  reads); `analysis/reverse-check.md` RV-18, RV-19 (and the dropped RV-16 note).
- `analysis/prototype-map-apps-mobile-web.md` (Dashboard, Lists, Accounts, Balances, Forward Lists,
  "Billed = gone", "Next-day handover", "Aging buckets"), `prototype-map-store-seed.md` (selectors,
  the `dashboards` seed, the backdrop disbursements), `prototype-map-shell-demo-pwa.md` (routes, the
  PWA).

**Code entry points** (line numbers are from 501b0b8, where the prototype is unchanged from
501b0b8; phases 14 to 36 will have moved them):

- Web: `src/apps/web/screens/DashboardScreen.tsx` (`AGING_ROWS` 26, receivables 62, `daySummary`
  71 with its `billedAtISO === undefined` filter, Receivables panel 183, Productivity 220, Leave 255,
  `StatTile` 347, `leaveRange` 377); `src/apps/web/useDashboardFigures.ts`;
  `src/apps/web/screens/AccountsScreen.tsx` (`AccountsSubTab` 19, `AGING_COLS` 28, local `GstPeriod`
  35, `OverdueTable` 80, `PaymentsTable` 174, `periodWindow` 266, `GstReport` 272);
  `src/apps/web/screens/AccountsScreen.test.tsx`; `src/apps/web/routes.tsx` (`ACCOUNTS_SUB_TABS` 28,
  `onViewOverdue` 57, `WebAccountsRoute` 133) and the `/web/accounts` redirect in `src/router.tsx`;
  `src/apps/web/screens/ListsScreen.tsx` (`!isListBilled` 63, From defaults to today 45);
  `src/apps/web/components/WeekStrip.tsx` (`!isListBilled` 40); `src/apps/web/screens/ListDetailView.tsx`
  ("Submitted to office" pill ~277).
- Mobile: `src/apps/mobile/screens/BalancesScreen.tsx` (outstanding 35, aging total 39, "GST this
  month" `monthStart` 43, GST section ~108, `AgeChip` 140); `src/apps/mobile/screens/ForwardListsScreen.tsx`
  (`!isListBilled` 65, Done filter 78, `doneUnbilled` 135); `src/apps/mobile/screens/ListDetailScreen.tsx`;
  `src/shared/schedule/ListRow.tsx` (`ListRowRight`, `RightCluster`). The mobile List detail also has
  its own "Submitted to office" line (~303).
- Store (pre-36 names; Phase 36 renames most of these and adds `src/store/ledgerSelectors.ts`):
  `src/store/selectors.ts` (`isListBilled` 118, `dashboardFiguresFor` 128, `isBackdropList`
  141, `invoicesForList`, `casesForList` (36: `pairsForList`), `AccpayInvoiceRow` ~595 with
  `agingDays` and `bucket`, `accpayRowForCase` 618 (outstanding is `invoice.total - receivedAmount`
  today), `accpayInvoicesFor` 649 (36: `payableRowsFor`), `outstandingAccpayInvoicesFor` 663
  (36: `outstandingPayableRowsFor`), `overdueAccountsFor` 668, `receivablesAgingFor` 679,
  `gstActivityFor` 709 (over `billing.receipts`, receipt date), `paymentHistoryFor` 763);
  `src/store/dashboard.test.ts`; `src/store/billingRun.ts` (header comment 1 to 13);
  `src/store/payablesActions.ts` (`runPayables`, the disbursement writes);
  `src/store/appStore.ts` (`PERSIST_VERSION` 130, currently 13 before the catch-up; `AppState
  extends SeedState`, so `dashboards` comes from the seed type; there is no `partialize`, the whole
  store persists, and `migrate` reseeds on a version mismatch); `src/store/mutate.ts`
  (`resetDomainState`, which does not copy `dashboards`); `src/store/persistMigrate.test.ts`.
- Only non-anaesthetist caller of `isListBilled`: the PWA office stand-in `src/pwa/officeSimulation.ts`
  (153). The admin Review queue, Invoices, Billing monitor and the Control Panel read `billedAtISO`
  directly.
- Domain and seed: `src/domain/dateDays.ts` (`AgingBucketKey`, `bucketForAgingDays`);
  `src/domain/types.ts` (`GstPeriod` 153, `Invoice.gst` and `total` ~672, `BillingReceipt.gstAmount`
  742, `Disbursement.atISO` 809, `List.billedAtISO` comment ~320); `src/domain/billing/` (pure money
  maths: `GST_RATE` in `invoiceBuild.ts`, 36's `ledger.ts`); `src/domain/seed/anaesthetistDashboard.ts`;
  `src/domain/seed/index.ts` (imports 61, re-exports 71 to 78, `SeedState.dashboards` 122,
  `dashboards: ANAESTHETIST_DASHBOARD` 432); `src/domain/seed/history.ts` (~317, the backdrop
  `DSBH` disbursements with their `disbursedAtISO`, which give June and earlier periods real rows);
  `src/domain/seed/billing.ts` (~218, the seeded prepayment disbursement);
  `src/domain/anaesthetistProfile.ts` (Phase 26: `gstPeriodLabel`, period options).
- Admin: `src/apps/admin/screens/MasterData.tsx` (GST column ~180, raw enum today),
  `src/apps/admin/flows/fieldChrome.ts` (`GST_OPTIONS`), `EditAnaesthetistSheet.tsx`,
  `AddAnaesthetistFlow`; `src/apps/admin/screens/BillingMonitorScreen.tsx` (the product "Run
  payables" button, `data-shot="billing-payables-run"`).
- Demo: `src/shared/demoTriggers/registry.ts` (Phase 14), `src/apps/demo/DemoData.tsx` (the guard
  console), `src/apps/demo/DemoXero.tsx` ("Simulate payment and payout"), `src/shared/DemoBadge.tsx`.
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
     "April to September 2026" (no dashes). Offsets above 0 clamp to 0.
   - Pure date arithmetic on ISO strings through `date-fns` as the rest of the app does; no
     `Date.now()` or `new Date()`; today always comes in as an argument from the demo clock.
   - No free date range: US-12.2.2 no longer asks for a "date-ranged" summary, only one aligned to
     the anaesthetist's GST period.
   - Vitest (`gstPeriod.test.ts`): for demo today Tue 21 Jul 2026, monthly is 1 to 31 Jul, two-monthly
     1 Jun to 31 Jul, six-monthly 1 Apr to 30 Sep, each `inProgress` with `throughISO` 2026-07-21;
     offset -1 gives June, 1 Apr to 31 May, and 1 Oct 2025 to 31 Mar 2026; year rollover (two-monthly
     1 Dec to 31 Jan); February in a leap year; every day of 2026 falls in exactly one period of each
     kind; two calls deep-equal.

2. **The GST schedule as pure billing maths** (`src/domain/billing/gstSchedule.ts`, exported from the
   billing index; US-12.2.2, DM-29, FT-12.2). It replaces the receipts-based `gstActivityFor`.
   - `gstScheduleFrom({ pairs, invoices, disbursements, anaesthetistId, fromISO, toISO })`, over 36's
     ledger shapes only (never `state.xero`, never receipts):
     - **Rows: one per payable leg (one BCTI) with disbursement entries to this anaesthetist dated
       in the window** (inclusive date bounds on `atISO`'s date). Pair kinds `procedure` and
       `prePayment` count, and any later kind 39 adds that pays the anaesthetist; `aaFee` never
       (it has no payable leg, and AA's fee is not a sale AA made for them).
     - Each row: `pairId`, `invoiceNumber`, `payableNumber` (36's `-P` number), `paidOnISO` (the
       latest disbursement date in the window), `paidToYou` (the sum of that pair's disbursement
       amounts in the window), `saleInclGst` (the part of the invoice those payments cover:
       `paidToYou × invoice.total / payable.amount`, which is `paidToYou` while the payable equals the
       receivable, Phase 16, but stays correct if that ever changes), `gst` (that part's share of the
       invoice's own GST, `saleInclGst × invoice.gst / invoice.total`, read from the stored invoice and
       never recomputed as a flat 3/23 of the gross: 22's `gstTreatment` changes only presentation, but
       an invoice whose stored GST is not 3/23 of its total, from line rounding or a fixture, must still
       show its own figure) and `saleExGst`.
     - **Rounding:** cents throughout; when a payable is paid in parts across periods, the part that
       completes it takes the invoice's remaining GST, so the parts always sum to the invoice's GST
       exactly.
     - Rows sorted by `paidOnISO`, then invoice number.
     - **Totals:** `salesInclGst`, `gst`, `salesExGst`, `paidToYou`.
     - **Balance check** (`check`): `paymentsMade` is summed independently, straight from every
       disbursement entry to this anaesthetist in the window (including any whose pair or invoice
       cannot be found); `difference = paymentsMade - totals.paidToYou`; `issues` lists
       `orphanDisbursement` (no pair or invoice), `paidAboveInvoice` (a payable disbursed beyond its
       invoice total) and `feePairDisbursed` (a disbursement on an `aaFee` pair); `balances` is true
       when `difference` is 0 to the cent, sales incl. GST equal paid to you, and there are no issues.
   - Selector `gstScheduleFor(state, anaesthetistId, window)` in `store/ledgerSelectors.ts` adds the
     billable party label (21's) and patient name, and, only when the window is the current period,
     `notYetPaid`: the anaesthetist's `dueNow` from 36's position (collected by AA, not yet paid out,
     so it falls into a later period).
   - Delete `gstActivityFor`, `GstActivity` and `GstActivityRow` (and `incomeReceiptsFor`'s GST
     caller; the selector itself stays for payment history and `uncoveredCollectionsFor`).
     `BillingReceipt.gstAmount` (36's `LedgerReceipt`) is then read by nothing that calls itself GST:
     keep the field, fix its comment.
   - Vitest (`gstSchedule.test.ts` for the pure function, `accountsViews.test.ts` for the selector):
     - a full payment received on AA-2026-0005 adds **no** row; the payables run then adds one row
       dated the run's date, with sale incl. GST and paid to you equal (Phase 16's $152.38) and the
       invoice's own GST;
     - a payable half paid out in July and the rest in August appears in both periods, and the two GST
       parts sum to the invoice's GST to the cent;
     - a fixture invoice whose stored GST is not 3/23 of its total (for example a zero-GST fixture)
       shows its own GST, not 3/23;
     - an AA fee payment and another anaesthetist's payout add nothing;
     - the fresh seed balances for Dr Souter in June and in July 2026, and the backdrop history's
       payouts land in the periods of their disbursement dates;
     - an orphan disbursement fixture and a disbursement on an `aaFee` pair each give
       `balances: false` with the issue named;
     - two fresh stores deep-equal.

3. **List billing status as a pure derivation** (`src/domain/listBilling.ts`; DM-36, US-07.2.1).
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

4. **Outstanding is the unpaid payable, with no ageing** (US-12.2.1, RV-19, D8).
   - **Row meaning.** 36's `outstandingPayableRowsFor` today keeps the pre-36 reading (invoice total
     minus what the payer paid), so a row vanishes once the payer pays even though AA has not yet
     paid the anaesthetist. US-12.2.1 says "unpaid payables": the row's amount becomes
     `outstandingToYou = payable.amount - payable.disbursedAmount`, and the row stays until that is 0.
     Record this reading in the Decisions log (the gap analysis flagged it as ambiguous).
   - Each row carries a `stage` from one label map, `OUTSTANDING_STAGE_LABEL`: `awaitingPayment`
     ("Awaiting payment": nothing received), `partPaidIn` ("Part paid in") and `dueToYou` ("Paid in,
     due to you": released, not yet paid out). A per-row word is not a rollup or grouping; there are
     no subtotals by stage.
   - Rows come from **issued** pairs only, exactly the set 36's `anaesthetistPosition` sums: a held
     (not yet approved and sent) or withdrawn prepayment pair (27, 36) is never a row, or Owed to you
     and the Outstanding total would differ.
   - Rows keep the next-day rule (an invoice shows from the day after it is raised), sort oldest
     first by invoice date, then invoice number, and use `raisedAtISO` labelled **Invoice date**
     (note point 33: Greg asked that "first notice" read "invoice date").
   - Add `outstandingTotalFor(rows)` (a pure sum in cents) if Phase 36 did not.
   - Delete `receivablesAgingFor`, `ReceivablesAging`, `AgingBuckets`, `accountsOver60` and the
     `overdueAccountsFor` alias (under whatever names 36 left them) from `store/selectors.ts`,
     `store/ledgerSelectors.ts` and `store/index.ts`; drop `bucket` and `agingDays` from the payable
     row type (`AccpayInvoiceRow` before 36); delete `AgingBucketKey` and `bucketForAgingDays` from
     `domain/dateDays.ts` and any re-export. Keep `epochDayOf` and `daysBetween`. The compiler lists
     every caller (all anaesthetist-side: web Dashboard, Accounts, mobile Balances, the dashboard
     test); each moves to the reworked rows. Update any 36 test that asserted aging buckets or the
     receivable-based outstanding amount.
   - AA fee invoices (16) never appear: AA's fee is what the anaesthetist owes AA, shown on the AA
     fees tab and 36's "You owe AA".
   - The 90-day unpaid threshold (OQ-33, US-11.3.2's mild or strong alert) belongs to Phase 40's
     patient alert, not to this list; do not keep a bucket for it.
   - Vitest: one row per unpaid payable, oldest first; a payment received keeps the row with stage
     "Paid in, due to you" and the same `outstandingToYou`; the payables run removes it; a half
     payout leaves half; the next-day rule holds before and after "Next morning"; no row for an AA fee
     invoice.

5. **The financial position** (US-12.2.3 with US-08.3.5; DM-23 anaesthetist scope).
   - **One definition on the web.** Phase 36 already shows these figures in its Accounts "Your
     position" strip through `anaesthetistLedgerPosition`. The dashboard panel uses the **same
     selector, the same figures and the same labels**, so the dashboard, the strip and mobile
     Balances can never disagree. Do not define a second "Owed". Only if 36's selector lacks a figure
     below, add a thin selector beside it that derives it from the ledger legs; never from
     `state.xero` (convention 9) or from `BillingCase` fields.
   - The figures (36's names in brackets), stated in a comment and in the Decisions log:
     - **Owed to you** (`owedToThem` = `awaitingCollection` + `dueNow`, that is, every payable not yet
       paid out). With work item 4's reading it **equals the Outstanding list's total to the cent**;
     - **Awaiting collection** (`awaitingCollection`): billed but not yet received;
     - **Due to you now** (`dueNow`): collected, released and not yet paid out;
     - **Collected** (`collected`) and **Paid out to you** (`paidOut`; 36's strip label), to date.
   - **Next-day rule.** The Outstanding list shows an invoice from the day after it is raised
     (US-07.4.1's "the next day the new invoices appear"). If 36's position counts today's invoices,
     apply the same visibility rule to the anaesthetist-facing figures in one place (a thin wrapper
     used by both the dashboard and 36's strip), so Owed to you always equals the Outstanding total.
     Record which way it went.
   - AA fee invoices (Phase 16) are AA's income, not the anaesthetist's: they are excluded from all
     the figures above (36's `theyOweAa` stays on its strip and the AA fees tab only). Backdrop history
     is included (it is the anaesthetist's real history in the demo).
   - Vitest in the renamed `src/store/accountsViews.test.ts` (was `dashboard.test.ts`): Owed to you
     equals the Outstanding total to the cent, before and after a payment, a payables run and "Next
     morning"; Owed to you equals Awaiting collection plus Due to you now; Collected equals the sum of
     the anaesthetist's income receipts; Paid out equals the sum of their disbursements and equals the
     GST schedule's paid to you summed over every period to date; a full payment on AA-2026-0005
     (after S3's authorise) raises Collected by $152.38 at once, and running payables raises Paid out
     by the same; another anaesthetist's figures do not move; an AA fee payment moves nothing; figures
     are deterministic across two fresh stores.

6. **Remove the seeded dashboard figures** (RV-18).
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

7. **Web dashboard** (`DashboardScreen.tsx`; US-12.2.3).
   - Replace the Receivables panel with **Financial position** (`data-shot="web-financial-position"`),
     in the Receivables slot (span 7). Title row: "Financial position" with the Owed total in mono on
     the right. Body: three stat tiles in one row, reusing the Productivity tile anatomy without the
     pill: **OWED TO YOU**, **COLLECTED**, **PAID OUT TO YOU**. Footer line (top border, as the
     mockup): "N unpaid invoices · $X awaiting collection · $Y due to you now · View outstanding
     invoices · View payments",
     the two links teal text buttons to `/web/accounts/outstanding` and `/web/accounts/payments`.
     Caption under the tiles: "To date, from the Billing Engine's ledger. New invoices appear the day
     after billing." Empty state when there is nothing at all: "No billed work yet."
   - The tiles show Owed to you, Collected and Paid out to you; the footer's figures are Awaiting collection
     and Due to you now, with the same labels as 36's strip. Reuse the strip's component if 36 built
     one that fits the panel anatomy.
   - Delete the Productivity and Leave panels, `leaveRange` and the `useDashboardFigures` call. Leave
     stays visible where it belongs: holiday blocks in the week strip and the Availability screens.
   - "Who's free · next 5 days" moves up beside Financial position (span 5), so the page is the week
     strip plus one row of two panels. Check the chips wrap cleanly at the web app's 1240px minimum;
     if they do not, use 6 and 6. Keep the panel anatomy, order and spacing of the mockup otherwise.
   - `daySummary` stops filtering billed Lists: a billed List today is still one of today's Lists.
   - Rename the `onViewOverdue` prop to `onViewOutstanding` and add `onViewPayments` in
     `routes.tsx`. Update the component's header comment (no seeded figures remain).

8. **Web Accounts: Outstanding** (`AccountsScreen.tsx`, `routes.tsx`, `router.tsx`; US-12.2.1, RV-19).
   - `AccountsSubTab`: `'overdue'` becomes `'outstanding'` (keep `'payments'`, `'gst'` and Phase 16's
     `'fees'`). The first sub-tab reads **Outstanding**. `/web/accounts` redirects to
     `/web/accounts/outstanding` (the index `Navigate` in `router.tsx`), and `/web/accounts/overdue`
     redirects there too, so old links and bookmarked guide URLs keep working. `WebAccountsRoute` wraps
     the screen in `RequireEntity`, so once `'overdue'` leaves `ACCOUNTS_SUB_TABS` it would render
     not-found: add an explicit `<Route path="overdue" element={<Navigate to="../outstanding" replace />} />`
     before `:subTab` (keeping any `?invoice=` query), or map it inside `WebAccountsRoute`.
   - Phase 36's "Your position" strip above the sub-tabs stays, with the labels of work item 5.
   - `OutstandingTable` (`data-shot="web-accounts-outstanding"`): one row per unpaid payable, oldest
     first, no grouping. Columns: Invoice date, Invoice (mono), Patient, Billable party, Stage (the
     `OUTSTANDING_STAGE_LABEL` word, plain text), Outstanding to you (mono, right). Leave any ACC
     marker exactly as Phase 18 left it (RV-20 is not this phase's). Footer: one "Total outstanding"
     row with the count ("N invoices") and the sum, equal to "Owed to you". No bucket columns or
     totals.
   - Caption: "One row per invoice not yet paid to you, oldest first. A row stays until AA pays you.
     For a question about a line, contact the office." (US-12.2.1: queries go to office staff.) No
     provisional badge: D8 is answered.
   - Empty state: "Nothing outstanding. New invoices appear here the day after billing."
   - Header subline: "Outstanding invoices, payments, your GST schedule and AA fees."
   - The Payments tab is unchanged (Phase 16 reshaped it); its caption's "after they leave Overdue"
     becomes "once they are paid to you".

9. **Web Accounts: GST schedule** (`GstReport` becomes `GstSchedule`; US-12.2.2, US-12.1.2, DM-29).
   The sub-tab reads **GST schedule**; the route stays `/web/accounts/gst`.
   - Delete the local `GstPeriod` type, `periodWindow` and the local label map. The window comes from
     `gstPeriodView(period, offset, today)`.
   - **The period is the saved one.** Remove the "View by" Segmented (it let the window drift from the
     record, a US-12.1.2 gap). A line under the title reads "Your GST period: Two-monthly · Change in
     your profile", the link a teal text button to Phase 26's profile. The offset resets when the
     saved period changes.
   - A period stepper (`data-shot="web-gst-period-nav"`): previous and next buttons around the
     period label ("June to July 2026"), with "In progress, to 21 Jul" under the current period. Next is
     disabled on the current period. "Current period" returns to offset 0.
   - Table (`data-shot="web-gst-schedule"`): Date paid, Invoice (mono), Billable party, Sale incl. GST,
     GST, Paid to you (mono, right). Footer: "Period total" with the four totals.
   - **Balance check** under the table (`data-shot="web-gst-balance-check"`): success tint with a tick,
     "Balances · sales of $X incl. GST match the $X AA paid you in this period", or warning tint,
     "Does not balance · $D difference", listing each issue in words. Never crimson.
   - On the current period only, when `notYetPaid` is above zero: "$Y collected by AA is not yet paid
     to you. It falls into the period AA pays it in."
   - The caption states the basis and the window in words: "Two-monthly period, 1 June to 31 July 2026
     · GST on a cash basis: one row per invoice AA paid you in this period, with the sale and its GST
     component". A short footnote states the balance-date assumption ("Periods assume a 31 March
     balance date") and that AA fee invoices are on the AA fees tab.
   - Empty state: "AA has not paid you anything in this period."

10. **One GST period label everywhere** (US-12.1.2 label drift). Phase 26 planned the Master data
    label and the GST tab's shared label; this item confirms that and closes whatever is left.
    - Every surface that shows or edits a GST period reads `gstPeriodLabel` and the shared options from
      `src/domain/anaesthetistProfile.ts`: the admin Master data Anaesthetists table (no raw enum), the
      Edit and Add anaesthetist sheets (`fieldChrome.ts` `GST_OPTIONS` imports them), the web and mobile
      profile, the web GST schedule and the mobile peek. "Bi-monthly" disappears from the app.
    - Vitest: `GST_OPTIONS` labels equal `gstPeriodLabel` for every value; a render test of the Master
      data Anaesthetists table shows "Six-monthly" for Dr Whitaker, never `sixMonthly`.

11. **Mobile Balances** (`BalancesScreen.tsx`; US-12.2.1, US-12.2.2, RV-19).
    - The total card reads `outstandingTotalFor` over the reworked rows (not `aging.total`), labelled
      "Outstanding to you"; the subline keeps "N unpaid invoices". Phase 36's "Collected $X · Paid out
      $Y" line stays and reads the same selector as the web figures.
    - Delete `AgeChip`. Each row's second line becomes "<invoice number> · <billable party> · Invoice
      date 14 Jul", with the stage word under the amount when it is not "Awaiting payment". Keep any
      ACC marker as Phase 18 left it. One caption line under the list, as on web: "A row stays until AA
      pays you. For a question about a line, contact the office." (US-12.2.1 covers mobile too.)
    - The GST section follows the profile's period: the segment reads **GST this period**, the header
      reads "July 2026 · paid to you" for a monthly anaesthetist or "June to July 2026 · paid to you"
      for a two-monthly one, with the period's paid-to-you total, and the window is
      `gstPeriodView(period, 0, today)` through `gstScheduleFor`. Rows: amount paid to you, "<date
      paid> · <billable party>", and GST on the right. Footer: the GST total and a one-line balance
      check ("Balances with what AA paid you" with a tick, or the difference). Empty copy: "AA has not
      paid you anything this period yet."
    - Header comment updated (flat list of unpaid payables, no ageing, period-aligned cash-basis GST).

12. **Billed Lists stay visible** (DM-36, US-07.2.1, D9 default, provisional while OQ-31 is open).
    - **Shared row** (`ListRow.tsx`): add `ListRowRight` kind `doneBilled`, the same tick cluster as
      `doneUnbilled` with the label `LIST_BILLING_LABEL.billed` in a neutral slate tone, so "billed"
      reads as settled rather than as a new success state. Both labels come from
      `LIST_BILLING_LABEL`.
    - **Mobile Forward Lists** (`ForwardListsScreen.tsx`): drop the `!isListBilled` filter; exclude
      backdrop Lists (`isBackdropList`, as Phase 28 left it; today an `L-HIST` id prefix) instead, so
      the seeded history does not flood the view. Week and Month stay forward-only. **Done** shows
      every SUBMITTED or AUTHORISED List, billed or not, newest first, with `doneUnbilled` or
      `doneBilled`. Add a one-line caption on the Done filter while D9 and OQ-31 are open: "Billed
      Lists stay here once invoiced (provisional)".
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

13. **Provisional labels** (one place each). Only D9 and OQ-31 remain provisional in this phase: the
    Done caption (mobile) and the Completed caption (web). D8 is answered, so the Outstanding tab
    carries no badge. The GST schedule carries the balance-date footnote only; the BCTI-granularity
    point lives in the ROADMAP and the PROGRESS entry, not in the UI.

14. **Demo triggers** (the registry, `src/shared/demoTriggers/registry.ts`; see the next section).
    Re-point and re-word, do not add behaviour: put the chooser payment entries on the web money
    screens, and reword the PWA stand-ins' result messages.

15. **Copy and comment sweep.** Grep `src/` for `Overdue`, `overdue`, `aging`, `Aging`,
    `Receivables`, `productivity`, `vanish`, `Bi-monthly`, `GST activity`, `amounts received`,
    `No rollup (per the RFP)` and `payer` in the anaesthetist money views; every user-visible string
    is reworded to the new vocabulary ("GST schedule", "Outstanding", "billable party"), and stale
    comments are fixed. The admin Billing monitor's "Prior balance" tooltip keeps its own wording
    (Phase 40's). Do not use "timesheet" anywhere. No en or em dashes in any string added or changed.

16. **Tests and shots.**
    - `AccountsScreen.test.tsx`: Outstanding renders one row per unpaid payable oldest first with a
      stage word, a single total equal to Owed to you, and no bucket headers; a received payment keeps
      the row as "Paid in, due to you"; GST schedule previous and next change the window and the
      totals; Next is disabled on the current period; the period follows the profile and there is no
      View by control; the balance check shows "Balances" on the seed.
    - A Forward Lists or ListRow test: after authorising Souter's Mon 20 AM List, Done shows it with
      "Done · billed"; a SUBMITTED List shows "Done · unbilled"; no backdrop List appears.
    - A ListsScreen test: Completed lists the billed Mon 20 List with its marker; Upcoming is unchanged.
    - A BalancesScreen test: no age chip; "GST this period" with the period label; a payment received
      adds no GST row.
    - Playwright: `visual/routing.spec.ts` (bare `/web/accounts` and `/web/accounts/overdue` both land on
      `/web/accounts/outstanding`; the dashboard's "View outstanding invoices" link goes there);
      `visual/web-phase05.spec.ts` shots renamed `w-09-outstanding.png` and `w-10-gst-schedule.png`
      (with the stepper and the balance check), plus `w-01` dashboard re-shot; a new shot of mobile
      Done with a billed row and one of mobile Balances on "GST this period". `data-shot` hooks as
      named above.

## Demo triggers

Everything this phase shows is reachable by normal use in the framed build: the office authorises a
List (the billing run marks it billed), the Xero simulator's "Simulate payment and payout" or a
payment followed by the Billing monitor's product "Run payables" button moves Collected and Paid out
and adds the GST schedule row on the payout date, and the demo clock's "Next morning" brings
yesterday's invoices into Outstanding. So there is **no new trigger**. Existing entries are
re-pointed or re-worded so the money beat can be driven from the screen being presented:

| Label | Screen | Surface | Effect |
|---|---|---|---|
| Payment received · full / half (re-pointed) | Web · Dashboard (`/web`) and Web · Accounts (`/web/accounts/:subTab`) | bar | Phase 14's `choices` is per entry, so the URL-driven `payment-full` / `payment-half` (Admin Invoice, Xero pair) stay exactly as they are. Instead the chooser entries `pwa-payment-full` / `pwa-payment-half` gain the web patterns and the `bar` surface on those patterns only (or, if the registry cannot scope a surface per pattern, two `web-payment-full` / `web-payment-half` entries calling the same shared body). The chooser lists the open ACCRECs from `openAccRecs` whose invoice belongs to the current persona (`ctx`), not a hardcoded Souter. The webhook lands: Collected rises at once, the Outstanding row turns "Paid in, due to you", and the GST schedule gains **no** row. Result message: "Payment received. It reaches your GST schedule when AA pays you". Disabled with "No open invoices yet" when empty |
| Office runs payables (re-worded) | Mobile · Balances (`/mobile/balances`) | PWA only, badged office stand-in | Phase 36's body, unchanged. Its result message now reads "Paid out $X to Dr Souter. It leaves Outstanding and shows under GST this period" |
| Office authorises this List (re-worded) | Mobile · List (`/mobile/lists/:listId`) | PWA only, badged office stand-in | Unchanged body. Its result message now reads "Authorised and billed. The List shows Done · billed; its invoices reach Balances tomorrow (Next morning on More)" |

"Run payables" in the framed build stays the Billing monitor's own product button (Phase 14's
ruling); the S3 path to show "a receipt adds no GST row, a payout does" is the web bar's "Payment
received · full", then Admin → Billing monitor → Run payables, then back to Web → Accounts → GST
schedule.

PWA parity: the mobile beats are Done (billed marker) and Balances (flat list of unpaid payables,
period GST schedule). The List's move to billed on a handset comes from "Office authorises this
List", the payment from Phase 14's `pwa-payment-*` on Balances, the payout (which now changes the
mobile GST section and removes the Outstanding row) from Phase 36's "Office runs payables", and the
next-day handover from the clock on More. The Financial position is web only (US-12.2.3 is the web
dashboard). The Control Panel page gains nothing; its index picks up the re-pointed routes
automatically.

## Out of scope

- The ledger itself, the Admin whole-ledger and per-anaesthetist screens and the imbalance indicator
  (Phase 36). This phase only reads the anaesthetist's position and disbursements.
- Disbursement detected from Xero, bulk remittance and voids (Phase 37); credit notes and rebills
  leaving or joining the outstanding list (Phase 39); the payables run record, BCTI approval for a
  period (US-10.2.6), negative invoices netted against payments and the remittance advice (Phase
  39a). Each changes the figures through the ledger; 39a's netting must also appear in the GST
  schedule's balance check (handoff note).
- One BCTI per procedure rather than per receivable invoice (the plan's provisional point with AA's
  accountant, beside OQ-29 and OQ-60): the schedule's row grain follows 16's count if it flips.
- GST agency treatment and BCTI presentation (OQ-29, Phase 22's wording).
- Netting the AA fee against payables (OQ-60 part 3, open; the plan keeps the fee a separate
  receivable, Phase 16). If AA chooses netting, a netted fee is a named reconciling item in the
  balance check, never a lower sale.
- The patient unpaid alert and its 90-day threshold (Phase 40, OQ-33, US-11.3.2).
- A mobile dashboard or a mobile financial position (US-12.2.3 is the web app's dashboard); a mobile
  AA fee view (Phase 16 recorded it as a candidate; not built).
- AA fee invoices on the dashboard, the outstanding list or the GST schedule: they stay on Phase 16's
  Accounts AA fees tab.
- A leave request workflow or "Request leave" button (US-01.5.3 is Open; Phases 29 and 30 own
  availability and leave).
- A per-anaesthetist GST balance date: one labelled assumption (31 March) until AA says otherwise.
- A free date range on the GST schedule (no longer in US-12.2.2).
- Export, print or download of any accounts view, including the GST schedule.
- Changing the billed trigger (OQ-31): the billing run's stamp stays the event.
- The "Done · unbilled" marker on a DRAFT List whose Bookings are all complete: the mobile mockup
  shows it that way and it is unchanged.
- The ~100-row scale of the outstanding list (Phase 43).
- Productivity reporting of any kind. If AA asks for it, it becomes a new catalogue item first.
- Finding past work by calendar or search (Phase 38a, which builds on the billed Lists staying
  visible).

## Manual test checklist

The agent runs every item itself in the running app and reports it with evidence; none is handed
to the owner (ROADMAP.md "Owner review: agents test themselves").

- [ ] Reset. Web → Dashboard: the greeting, day summary, Offer cover and week strip are as before;
      below them, one row of two panels, Financial position and Who's free. No Productivity, no Leave,
      no ageing bars. Leave still shows as holiday blocks in the week strip.
- [ ] Financial position shows Owed to you, Collected and Paid out in mono, with the unpaid count, the
      awaiting-collection and due-now figures and two teal links. Its figures equal the Accounts "Your
      position" strip; Owed to you equals the Outstanding tab's total to the cent.
- [ ] Web → Accounts opens on **Outstanding** at `/web/accounts/outstanding`; `/web/accounts/overdue`
      redirects there (no not-found page). One row per unpaid payable, oldest first, an Invoice date
      column, a stage word, a single total, no bucket columns, the office-contact caption and no
      provisional badge. The sub-tabs read Outstanding, Payments, GST schedule, AA fees.
- [ ] S3: authorise both Mon 20 Jul Lists in Admin. Mobile → Lists → Done shows both with
      "Done · billed"; the List detail shows "Invoiced · ..." with the invoice numbers and no edit
      controls. Web → Lists → Completed shows both with the Progress marker; the week strip's Mon 20
      blocks carry the tick.
- [ ] Submit a List without authorising it: mobile Done and web Completed show "Done · unbilled"; the
      Demo Data guard console still refuses an anaesthetist edit on it.
- [ ] Next morning (clock): yesterday's new invoices join Outstanding on web and mobile, and Owed to
      you still equals the Outstanding total.
- [ ] On Web → Accounts → GST schedule, note the July rows. Harness bar → Demo actions → "Payment
      received · full" on AA-2026-0005: Collected rises by $152.38, the Outstanding row stays as
      "Paid in, due to you", and the GST schedule gains **no** row; its current-period line shows
      $152.38 collected, not yet paid to you. Admin → Billing monitor → Run payables, back to the GST
      schedule: one new row dated today, sale incl. GST $152.38, the invoice's own GST, paid to you
      $152.38; the balance check still reads "Balances". The Outstanding row is gone and Paid out
      rose by $152.38.
- [ ] The bar's payment entries show on Web · Dashboard and Web · Accounts with a chooser of the
      current persona's open invoices; on Admin · Invoice the URL-driven entries behave as before.
      The entries do not show on Web → Lists or Availability.
- [ ] Open another pair in the Xero simulator, Simulate payment and payout, return to the web
      dashboard: Collected and Paid out have each risen by the invoice total, Owed to you has fallen
      by the same amount, and the GST schedule has the row.
- [ ] GST schedule (Dr Souter, monthly): "July 2026", in progress to 21 Jul; Previous shows June 2026
      with its backdrop payouts and totals and "Balances"; Next is disabled on July. There is no View
      by control; the "Change in your profile" link opens the profile.
- [ ] Change the GST period on the web profile to Two-monthly: the GST schedule reads "June to July
      2026"; Six-monthly reads "April to September 2026" and Previous gives "October 2025 to March
      2026". Mobile Balances reads "GST this period" with "June to July 2026 · paid to you" when
      two-monthly. Set it back to Monthly.
- [ ] Admin → Master data → Anaesthetists: the GST column reads Monthly and Six-monthly (Dr Whitaker),
      never a raw code; the Edit sheet uses the same words. "Bi-monthly" appears nowhere.
- [ ] Mobile → Balances: a flat list with "Invoice date <date>" on each row and no age chips; the
      total equals the web Outstanding total.
- [ ] PWA (`npm run dev:pwa`, fresh storage): submit a List, open it, Demo chip → "Office authorises
      this List": the message names Done · billed; the List stays under Done with "Done · billed".
      Next morning, then Balances → "Payment received · full": the row stays as paid in and GST this
      period does not change; "Office runs payables": the message names GST this period, the row
      leaves Outstanding and a GST row appears. No other new entries.
- [ ] No en or em dashes in any new or changed string; teal is the only action colour; crimson unused
      in the new panel and the balance check.
- [ ] Catalogue screenshots: the recipes for US-12.2.1, US-12.2.2, US-12.2.3, US-12.1.2 and US-07.2.1, plus US-07.4.1, US-08.3.5, US-08.3.2 and US-07.1.1 re-pointed are created or updated, any recipe this phase broke is re-pointed, a full `npm run capture` ends with no failed recipe and no story without a recipe, the covered items' new shots are checked by eye, and `npm run verify:board` is green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots` and `npm run verify:board` are all green.

## Demo guide updates

Patch in the same session (`docs/demo-guide/`, the same sections of `master-demo-guide.html`, and the
Control Panel scenario text if it names Overdue, ageing, GST activity or the List vanishing):

- `03-demo-script.md`:
  - **Direct URLs**: "Accounts, outstanding" becomes `/web/accounts/outstanding`; "Accounts, GST
    activity" becomes "Accounts, GST schedule" (`/web/accounts/gst`); add `/web/accounts/payments`.
  - **S3 Beat 1** (after authorising the Mon 20 Lists): an optional aside, "on the phone or the web the
    Lists now read Done · billed instead of disappearing (provisional, OQ-31)".
  - **S3 Beat 3** (payment, balances and disbursement): Expected gains "the web dashboard's Collected
    and Paid out each rise by $152.38, and the GST schedule for July gains AA-2026-0005 on today's
    date, balanced"; "It does not remain under Overdue because it is no longer outstanding" becomes
    "It leaves Outstanding because AA has now paid Dr Souter". Add an optional two-step aside: a
    payment alone keeps the row as "Paid in, due to you" and adds no GST row; the payables run adds
    it (GST is on a cash basis of what AA pays out).
  - **S3 discovery points**: "the exact List-disappearance trigger" becomes "whether billed Lists stay
    visible (the prototype keeps them under Done · billed) and which event marks them billed (OQ-31)";
    add "whether the GST schedule's balance check is what AA's accountant expects, and whether a BCTI
    is one per invoice or one per procedure". Drop any "aged or Overdue view" question (D8 answered).
- `02-workflows-and-handoffs.md`: workflow step 10 ("stamps billedAt and removes the List") becomes
  "marks the List billed; it stays visible as Done · billed"; the balances step (step 8) names the
  financial position, the flat list of unpaid payables and the period-aligned GST schedule of what AA
  paid out; the sequence diagram's "Update balance and GST views" stays.
- `01-personas-and-responsibilities.md`: "GST-period activity" becomes "their GST schedule" (lines
  35 and 103); the anaesthetist money paragraph (113 to 115) drops "receivables aging" and the
  "GST transaction list" and names the financial position (owed, collected, paid out), the outstanding
  list and the cash-basis GST schedule.
- `04-presenter-cheat-sheet.md`: section 2 "Exact List disappearance trigger" becomes "Billed Lists
  stay visible (OQ-31, provisional)"; the "Built and clickable" line "billed-List disappearance
  (Phase 08)" names billed Lists staying visible; section 11 drops the derived-ageing line; "What each app is for"
  (Anaesthetist Web) reads "Dashboard with your financial position" and "Accounts and GST schedule".
- `master-demo-guide.html`: the same sections (the SUBMITTED line, the balances note, the Direct URLs
  rows, S3 Beat 3 Expected and its discovery callout, cheat-sheet cards 2 and 11, the two "GST
  activity" mentions).
- No S1, S2, S4 or S5 beat changes. Phase 44 rewrites S3 around the ledger and regenerates the guide.

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19),
run after the review pass and before the PROGRESS.md entry. Re-run
`node docs/prototype-build/catch-up/tools/recipe-status.mjs 38` first: earlier phases may have
changed these recipes since this plan was written.

**Covered items.** When the phase is done, each recipe in `requirements-board/capture/recipes/`
matches what was built:

| Item | Recipe at plan time | When this phase is done |
|---|---|---|
| [US-12.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-12.2.1.md) Outstanding balances list | captured · web-outstanding, mobile-outstanding | captured. Re-point the web shot's `start` from `/web/accounts/overdue` to `/web/accounts/outstanding` (the old path now redirects); keep the shot names. Web: the flat table, oldest first, with the Invoice date, Stage and Outstanding to you columns, highlight on `[data-shot=web-accounts-outstanding]`, caption "Flat list of unpaid payables, oldest first, no ageing". Mobile (`/mobile/balances`): total card plus rows with "Invoice date" and no age chips, caption "Outstanding to you, one row per unpaid invoice". Add a web `paid-in` state after the "Payment received · full" demo action (or the Xero simulator payment on AA-2026-0005) showing the row turn "Paid in, due to you" and stay in the list |
| [US-12.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-12.2.2.md) GST schedule | captured · web-gst-activity, mobile-gst-activity | captured. Keep the shot names `web-gst-activity` and `mobile-gst-activity` and change the captions. Web `/web/accounts/gst`: the schedule table with the "Period total" footer, highlight on `[data-shot=web-gst-balance-check]`, caption "GST schedule on a cash basis: one row per invoice AA paid you in the period, with the sale, its GST and a balance check". Add a `previous-period` state clicking the stepper's previous button (`[data-shot=web-gst-period-nav]`). Mobile: the recipe's click text `GST this month` becomes `GST this period`; highlight the period header "July 2026 · paid to you" and the balance line |
| [US-12.2.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-12.2.3.md) Dashboard | captured · web-dashboard | captured. Re-shoot `/web`: the week strip, then Financial position (`[data-shot=web-financial-position]`, the highlight) beside Who's free; no Productivity, Leave or ageing panels. Caption "Web dashboard: week calendar, financial position (owed, collected, paid out) and cover". Add a `paid-out` state after "Payment received · full" and Admin Run payables if a recipe step chain can stage it, else leave the single state |
| [US-12.1.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-12.1.2.md) GST period | partial · admin-gst-period-setting, web-gst-period-view | captured if Phase 26 (anaesthetist sets the period in their profile) is done at build time and this phase removed the "View by" control; check the recipe's `absentReason` against the code first. Web `web-gst-period-view`: the old highlight `[data-sliding-segmented-control]:has-text("Six-monthly")` matches nothing once View by is gone, so re-point to the "Your GST period: Two-monthly · Change in your profile" line and the stepper, and show the period following the saved setting. Admin shot: the Master data Edit sheet must read the shared label (Monthly, Two-monthly, Six-monthly, never `sixMonthly`). Add a web profile shot if Phase 26 left one out. Drop the partial reason; if the mobile app still shows the current period only, say that in the caption, not as a reason |
| [US-07.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-07.2.1.md) Anaesthetist loses edit access | captured · web-submitted-list, web-read-only-card, mobile-done-unbilled, mobile-read-only-card, simulator-edit-refused | captured. Re-shoot all five. The List header pill no longer reads "Submitted to office" but `Done · unbilled` (and `Done · billed` once authorised), so re-point the web highlight `span:has-text("Submitted to office")` to the pill by its new text or a `data-shot` hook added in `ListDetailView.tsx`. Add a `billed` state on web and mobile: authorise the List in admin first (use the recipe step chain or the PWA stand-in) and show `Done · billed` with the read-only "Invoiced · AA-2026-..." line. Mobile `done-unbilled` highlight stays `button:has-text("Done · unbilled")`; add a `done-billed` state beside it. Captions in the catalogue's words, using "Booking" for Card |

**Recipes this phase breaks.** Work item 16 lists the Playwright shots; the capture recipes are separate. Found at plan time:
- `/web/accounts/overdue` is the start of `US-07.4.1` (shot `invoices-in-balances`), `US-08.3.5` (`web-overdue`) and `US-08.3.2` (`web-accounts`). The route redirects to `/web/accounts/outstanding`, so they still load, but re-point each `start` to the new path. The `US-08.3.5` caption "What is still owed to the anaesthetist, aged" is no longer true: reword to "One row per unpaid payable, oldest first".
- `US-07.4.1` is the main casualty: its shots `list-drops-off` (mobile and web) and `list-drops-off-invoiced` show a List vanishing once invoiced, with captions "List leaves the anaesthetist's view when its invoices are generated". Billed Lists now stay as `Done · billed` (D9, provisional). Keep the shot `name`s, change the captions and the highlight to the `Done · billed` row (mobile Done filter, web Lists Completed segment `[data-shot=web-lists-completed]`). The recipe stays `captured` or `partial`; the item's text and status are not edited here.
- `US-07.1.1` (`submit-list`, web and mobile) highlights `span:has-text("Submitted to office")`: re-point to the new pill text.
- `US-12.2.2` mobile click `GST this month` and `US-12.1.2` highlight `Six-monthly` segmented control, covered in the table above.
- Re-grep before capture: `grep -lE 'accounts/overdue|GST this month|Submitted to office|Receivables|Productivity|Done · unbilled' requirements-board/capture/recipes/*.json`.

**ATLAS.md.** Routes: `/web/accounts/overdue` becomes `/web/accounts/outstanding` (note the redirect) and the GST tab is the GST schedule; `/mobile/balances` description ("Outstanding and GST this period"). Overlays/Existing hooks: add the new `data-shot` hooks (`web-financial-position`, `web-accounts-outstanding`, `web-gst-period-nav`, `web-gst-schedule`, `web-gst-balance-check`, `web-lists-completed`). Seed data: the dashboards seed slice and the Productivity and Leave panels are gone.

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
  figures from one selector; Owed to you equals the Outstanding total to the cent; Collected and Paid
  out match the income receipts and disbursements; AA fee invoices and fee payments move none of
  them. Hunt for any path where the Payments tab, the dashboard, the GST schedule and mobile Balances
  disagree.
- **Unpaid payables.** An Outstanding row is the payable not yet paid out, not the receivable: a
  payer's payment keeps the row (stage "Paid in, due to you"), a payout removes it, a half payout
  halves it. No subtotal by stage.
- **Cash-basis GST.** A receipt alone never adds a schedule row; a payout adds it on the payout
  date; a payable paid across two periods splits correctly and its GST parts sum to the invoice's GST
  to the cent; GST comes from the invoice's own GST, not a flat 3/23; `aaFee` pairs never appear; the
  balance check sums disbursements independently of the rows and genuinely fails on an orphan or a
  fee-pair disbursement; nothing reads receipts for GST any more. The maths lives in
  `src/domain/billing/` with tests; the UI only formats.
- **No ageing left behind.** No bucket, "over 60 days", age chip, "overdue" copy or `AgingBucketKey`
  survives. The old `/web/accounts/overdue` URL redirects rather than 404s. No provisional badge for
  D8.
- **GST alignment.** Period boundaries are correct for all three kinds, across year ends and leap
  years, with the balance-date assumption in one constant and labelled; the in-progress period stops
  at the demo clock's today; Next never passes the current period; the window always follows the
  saved period (no View by override left); no `Date.now()` or `new Date()`.
- **Billed Lists.** One derivation (`listBillingStatus`) and one label source (`LIST_BILLING_LABEL`)
  on both apps; no anaesthetist view still filters on `isListBilled`; backdrop Lists stay out; a
  billed List is read only everywhere (no add, copy, capture, photo or edit reachable, and the store
  refuses it); the PWA office stand-in's `isListBilled` use and the admin `billedAtISO` reads are
  untouched; the next-day rule for Outstanding still holds; the D9 provisional captions are present.
- **Scope and triggers.** No Productivity or Leave remnants (components, seed, selectors, tests); no
  new Control Panel entry; the re-pointed payment entries show only on their routes and the PWA
  stand-ins stay PWA-only; bodies live in `src/shared` or `src/store` so `pwaPurity` holds.
- **Persistence.** `PERSIST_VERSION` bumped, the migrate test discards a stale `dashboards` key, and
  two fresh seeds deep-equal.
- **Design and copy.** The dashboard keeps the Web Dashboard mockup's panel anatomy and rhythm; stat
  tiles in mono; teal-only actions; no crimson in panels or the balance check; "billable party" not
  "payer"; no en or em dashes.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry; ROADMAP.md "Owner review: agents test
  themselves"): the defaults built for open questions, provisional readings, anything logged
  rather than fixed, and the screens worth a look, each with its route and persona.
- **Status row** for catch-up Phase 38, and a phase entry with:
  - the drift-check result (items changed or not; OQ-31 status; D8 built as answered; D9 built as
    the provisional default, or which branch if answered; US-12.2.2's status);
  - what was built, with the name map for later phases: `receivablesAgingFor`, `overdueAccountsFor`,
    `AgingBucketKey`, `bucketForAgingDays`, `gstActivityFor`, `dashboardFiguresFor`,
    `useDashboardFigures`, `SeedState.dashboards` and `anaesthetistDashboard.ts` removed;
    `gstPeriodView` and `GST_BALANCE_MONTH` in `src/domain/gstPeriod.ts`; `gstScheduleFrom` in
    `src/domain/billing/gstSchedule.ts` and `gstScheduleFor`; the reworked `outstandingPayableRowsFor`
    (`outstandingToYou`, `OUTSTANDING_STAGE_LABEL`) and `outstandingTotalFor`; `listBillingStatus`,
    `LIST_BILLING_LABEL` and `listBillingSummaryFor`; the Outstanding sub-tab and its redirects; the
    Phase 36 position selector actually used;
  - the `PERSIST_VERSION` bump (from and to);
  - tests added and the before and after Vitest and Playwright counts;
  - the review pass.
- **Catalogue screenshots result:** recipes created or changed (US-12.2.1, US-12.2.2, US-12.2.3, US-12.1.2, US-07.2.1 and the re-pointed US-07.4.1, US-08.3.5, US-08.3.2, US-07.1.1), the `capture/REPORT.md` counts (captured, partial, absent, failed) before and after, and any partial reason handed to a later phase.
- **Decisions log:**
  1. **Superseded:** the 2026-07-22 third external plan review, finding #12, and the Phase 08 reading
     that the `billedAtISO` stamp removes the List from the anaesthetist's views (the "billed = gone"
     rule, M10). Billed Lists stay visible as "Done · billed" (D9 default, provisional while OQ-31 is
     open); the stamp is still the event.
  2. **Superseded:** 2026-07-23 "Seeded anaesthetist-dashboard figures". The Productivity and Leave
     panels and their seed are removed (RV-18); the dashboard is calendar, financial position and cover.
  3. **Superseded:** the 2026-07-22 seventh external plan review, A17/B16 ("GST report is a
     transaction list of amounts received"). Per US-12.2.2 (2026-10-01) the GST schedule is on a cash
     basis of payables AA actually paid the anaesthetist, dated by the disbursement, with the sale, its
     GST from the invoice and a balance check; receipts no longer feed it.
  4. **Amended:** 2026-07-21 "Navigation structures from the design" and the Phase 05 Overdue anatomy.
     Accounts houses Outstanding (flat, no ageing: D8, answered), Payments, GST schedule and AA fees.
  5. **New:** an Outstanding row is the unpaid payable (`payable.amount - disbursedAmount`), so it
     stays after the payer pays until AA pays the anaesthetist (US-12.2.1 "unpaid payables"; the
     earlier receivable reading was ambiguous). The column reads "Invoice date" (note point 33).
  6. **New:** the financial position on the dashboard uses Phase 36's anaesthetist position (Owed to
     you, Awaiting collection, Collected, Paid out, Due to you now), to date, AA fees excluded, with
     the next-day rule applied so Owed to you equals the Outstanding total.
  7. **New:** GST periods are aligned periods computed from one assumed 31 March balance date
     (`GST_BALANCE_MONTH`), always the saved period (no on-screen override), with previous and next
     navigation; mobile shows the current period.
- **Handoff notes:**
  - For **39**: a credited invoice must leave Outstanding and a rebill join it through the ledger; a
    credit or negative invoice paid back or netted shows on the GST schedule in the period it moves
    money, and the balance check must still balance.
  - For **39a**: the payables run record and BCTI approval sit before the disbursement this schedule
    reads; netting a negative invoice makes payments differ from sales, so add the netted amount as
    its own schedule line (or a named reconciling item) so the check still balances, and show the
    remittance figures equal to the period's paid to you.
  - For **37**: a disbursement detected from Xero must raise Paid out and add its GST schedule row on
    its own date.
  - For **40**: the anaesthetist ageing view is gone; the 90-day patient threshold is Phase 40's own
    mild or strong alert on patient invoices.
  - For **41**: a prepayment held in trust adds no GST schedule row until it is disbursed after the
    procedure, and a refund on cancellation adds none; a held or withdrawn prepayment pair never
    appears in Outstanding.
  - For **43**: the flat Outstanding list must stay usable at about 100 rows per anaesthetist, and the
    GST schedule at a six-monthly period's volume.
  - For **38a**: billed Lists now stay reachable (Done and Completed), which the past-work calendar
    and search build on.
  - For **44**: S3 Beats 1 and 3 and the discovery points were patched here; re-read them in the
    rewrite. If D9 is answered, or the BCTI grain flips to one per procedure, the provisional captions
    and the schedule's row grain are the places to change.
