# Phase 38 · Web accounts, outstanding list and monthly GST report

**Requirements covered:**
[US-12.2.3](../../../../requirements-board/requirements/stories/US-12.2.3.md) Dashboard (the financial position; RV-34 removes the seeded Productivity and Leave panels) ·
[FT-12.2](../../../../requirements-board/requirements/stories/FT-12.2.md) Reporting for anaesthetists (both reports read the engine's own ledger) ·
[US-12.2.1](../../../../requirements-board/requirements/stories/US-12.2.1.md) Outstanding balances list (Confirmed; a flat list of unpaid payables, oldest first, no ageing, owner decision **D8**) ·
[US-12.2.2](../../../../requirements-board/requirements/stories/US-12.2.2.md) GST report (a monthly list of the [payments AA passed](../../../../requirements-board/requirements/stories/US-10.1.2.md) to the anaesthetist with the GST component of each, to download, email or print on web) ·
[DM-29](../analysis/domain-model-delta.md#dm-29) GST report on payments passed, by calendar month ·
[RV-33](../analysis/reverse-check.md#rv-33-the-gst-report-lists-customer-receipts-not-the-payments-passed-to-the-anaesthetist) GST report lists customer receipts, not the payments passed to the anaesthetist ·
[RV-34](../analysis/reverse-check.md#rv-34-dashboard-productivity-and-leave-panels) Dashboard Productivity and Leave panels ·
[RV-35](../analysis/reverse-check.md#rv-35-receivables-ageing-buckets-age-chips-and-an-overdue-view) Receivables ageing buckets, age chips and an Overdue view.
**Left this phase at d4db277 (2026-10-16 update):** [US-12.1.2](../../../../requirements-board/requirements/stories/US-12.1.2.md) GST period is **Retired** (no GST period on the profile; Phase 26 removes `gstPeriod`, so this phase builds no period, no aligned windows and no label sweep, and only confirms nothing reads one). The old RV-18, RV-19 and RV-32 are renumbered RV-34, RV-35 and RV-33 (same work).
**Left this phase at 60e2d1e (2026-10-08 update):**
[US-07.2.1](../../../../requirements-board/requirements/stories/US-07.2.1.md) (the web "completed,
unbilled" marker) and owner decision **D9**'s "billed Lists stay visible" default moved to
**Phase 38a**. [OQ-31](../../../../requirements-board/requirements/questions/OQ-31.md) was answered at
the 2026-10-07 client meeting: a List **leaves** the anaesthetist's main view once the office has
finalised it and sent it to invoicing, and is found afterwards through an archive or search
([US-07.4.1](../../../../requirements-board/requirements/stories/US-07.4.1.md), now Verify,
[US-07.4.2](../../../../requirements-board/requirements/stories/US-07.4.2.md),
[FT-07.4](../../../../requirements-board/requirements/stories/FT-07.4.md)). The "Done · billed" row,
`listBillingStatus`, the web Lists Completed view, the week-strip tick and the provisional D9 captions
this phase used to build are withdrawn here; 38a builds the main view, the archive and search and the
web marker. This phase changes **no List view**. (DM-36 had already been dropped from the delta in the first plan.)
Read alongside (not closed here):
[US-08.3.5](../../../../requirements-board/requirements/stories/US-08.3.5.md) (the per-anaesthetist ledger position: owed, collected, paid out; Phase 36 builds it, this phase puts it on the dashboard),
[US-08.3.1](../../../../requirements-board/requirements/stories/US-08.3.1.md) (the linked receivable and payable, which "unpaid payables" names),
[US-10.1.2](../../../../requirements-board/requirements/stories/US-10.1.2.md) (paid in and disbursed are two states; US-12.2.2's body now links it as "payables AA actually paid them"),
[US-05.2.7](../../../../requirements-board/requirements/stories/US-05.2.7.md) (the GST component; **Confirmed** 2026-10-07: every price is held excluding GST and GST is worked out only at the foot of the invoice, so an invoice's stored GST is that foot figure),
[US-07.4.1](../../../../requirements-board/requirements/stories/US-07.4.1.md) (Verify: once a List leaves the main view "its invoices then appear as lines in the anaesthetist's outstanding balances", the list this phase reworks; the List side is 38a's),
[US-10.2.7](../../../../requirements-board/requirements/stories/US-10.2.7.md) (Proposed, Phase 39a: the weekly ISO-week payment cycle, which sets the disbursement dates this schedule reads),
[US-11.3.2](../../../../requirements-board/requirements/stories/US-11.3.2.md) (the 90-day threshold, counted from the invoice date per OQ-74 / D24, is a mild or strong patient alert in Phase 40, not an ageing view),
[OQ-59](../../../../requirements-board/requirements/questions/OQ-59.md) (answered: the flat list),
[OQ-31](../../../../requirements-board/requirements/questions/OQ-31.md) (answered 2026-10-07; 38a's),
[OQ-29](../../../../requirements-board/requirements/questions/OQ-29.md) (Open, with AA's accountant; its 2026-10-07 update records the ex-GST rule and GST treatment set on the Contract) and
[OQ-60](../../../../requirements-board/requirements/questions/OQ-60.md) (the AA fee basis, with AA's accountant; still Open, but its 2026-10-02 "Meeting update" records Greg's view that the fee never nets against payables, "under trust law it mustn't", which Phase 16 builds as a rule),
[OQ-33](../../../../requirements-board/requirements/questions/OQ-33.md),
the 2026-10-01 meeting note ([2026-10-01-aa-meeting-with-greg.md](../../../../requirements-board/requirements/notes/2026-10-01-aa-meeting-with-greg.md), points 33, 40, 41 and 66), the 2026-10-02 meeting note ([2026-10-02-aa-meeting-with-greg.md](../../../../requirements-board/requirements/notes/2026-10-02-aa-meeting-with-greg.md), point 1: the fee and trust law), and the
"Internal ledger" section of [domain-model.md](../../../../requirements-board/requirements/domain-model.md).
**Depends on:** 36 only (the internal ledger: receivable and payable legs, `LedgerDisbursement`
entries, and the per-anaesthetist position). The dependency on 28 is dropped: it existed only for the
billed-Lists work, now 38a's. By the roadmap order 14 to 36 have run before this phase, including 16
(payable equals receivable, the monthly AA fee invoice and the AA fees tab), 20a and 21 (who is
invoiced: the Contract holder's billable party or the payer on the Booking), 22 (prices held ex GST,
GST at the invoice foot and the Contract's GST treatment, which changes only how an invoice presents
GST, never its stored amounts), 26 (which removes the GST period from the profile) and 27
(the prepayment pair, generated at setup and sent on approval). 37 may run before or after this
phase. 38a, 38b, 39, 39a and 39b always run **after** it (38a depends on 38, and 38b on 38a), so
their additional invoices, credits, weekly payment cycle and event invoices reach these views through
the ledger later (handoff notes). Ben called the GST report "one of the deliverables needed very
early in the piece" (2026-10-01 note point 40): if AA needs it sooner, this phase can run straight
after 36.
**Estimated:** 2 sessions. Session 1: work items 1 to 6 (the pure report maths, the outstanding rework,
the financial position, seed removal, the dashboard and the Outstanding tab), green at the end.
Session 2: items 7 to 12 (the GST report screen with its month picker, download, print and email,
Balances, labels, triggers, the copy sweep, tests and shots), then the demo guide, the review pass
and the screenshot step.

## Goal

The web dashboard is the anaesthetist's one overview of their week, their money and who can cover
(US-12.2.3). Today its money panel is a receivables-ageing chart with invented buckets, and two of
its five panels (Productivity and Leave) are hardcoded seed constants for Dr Souter only. The
catalogue asks for the **financial position** instead: what the anaesthetist is **owed**, what has
been **collected** and what has been **paid out** (US-08.3.5), read from the engine's ledger, which
Phase 36 made the system of record. FT-12.2 gives the anaesthetist two reports of their own, both
from that ledger: a flat list of what is owed to them and a **monthly GST report** of the payments AA
passed to them. The prototype's GST view is still a list of amounts received over a GST period
(RV-33), which the catalogue has superseded; the GST period itself is gone (US-12.1.2 Retired).

This phase:

- replaces "Receivables aging" with a **Financial position** panel over Phase 36's
  per-anaesthetist ledger position, and removes the seeded **Productivity** and **Leave** panels and
  their seed slice (RV-34). The Web Dashboard mockup's layout and panel anatomy are kept for what
  remains;
- turns the Accounts **Overdue** tab into a flat **Outstanding** list on web and mobile, per owner
  decision **D8** (OQ-59, answered): one row per unpaid payable, oldest first, with no ageing
  buckets, no bucket totals, no age chips, no Overdue tab or route and no dashboard ageing panel
  (US-12.2.1, Confirmed; RV-35). A row is the **unpaid payable** (US-12.2.1's words): it stays until
  AA has paid the anaesthetist, not only until the payer has paid AA;
- turns the receipts-based **GST activity** list into the catalogue's monthly **GST report**
  (US-12.2.2, DM-29, RV-33, FT-12.2): for a calendar month chosen on a month picker (default the
  current month), each payment AA passed to the anaesthetist, from the ledger's disbursement entries,
  with the GST component of each. It lists payments, not invoices sent: a receipt alone adds nothing,
  and an invoice paid in part falls into each later month it is paid in. On the **web** it can be
  downloaded, printed and emailed to the anaesthetist ("Email to me"); the mobile peek shows the
  current month only (a web feature, so the mobile app keeps just the peek). There is no GST period.

Which Lists the anaesthetist sees, and when an invoiced List leaves the main view, is **Phase 38a**'s
(D9, answered by OQ-31: invoiced Lists leave the main view and are found by archive or search). This
phase reads only the ledger, so it leaves every List view, filter and marker exactly as it finds them.

No new stored entity and no new mutation. The money maths (the GST report) lives in
`src/domain/billing/` with Vitest tests; the UI only formats. The seed loses the `dashboards` slice,
so `PERSIST_VERSION` is bumped.

## Before you start: drift check

1. Run the drift check against the plan's catalogue snapshot (d4db277):

   ```
   node requirements-board/agent/skills/update-build-plan/tools/plan-state.mjs --diff US-12.2.3,FT-12.2,US-12.2.1,US-12.2.2,US-12.1.2,US-08.3.5,US-08.3.1,US-10.1.2,US-05.2.7,US-07.4.1,US-10.2.7,US-11.3.2,OQ-31,OQ-29,OQ-59,OQ-60,OQ-33,FT-10.3
   ```

   (It diffs the plan's baseline, d4db277, to the working tree; the tool is rename-aware, so never
   use a plain `git diff` of the catalogue folder.) Read the diff for US-12.2.3, FT-12.2,
   US-12.2.1, US-12.2.2, the context items US-08.3.5, US-08.3.1, US-10.1.2, US-05.2.7,
   US-07.4.1, US-10.2.7, US-11.3.2, and OQ-31, OQ-29, OQ-59 and OQ-60. If an item changed, re-read it and
   adjust the work items. If an item is now Retired or Future, drop its work items and record that in
   the PROGRESS entry. At plan time (d4db277) US-12.2.1 and US-05.2.7 were **Confirmed**, US-12.2.2
   (the monthly GST report, its release slot unconfirmed) and US-12.1.2 is **Retired**
   (it is in the diff list only to confirm it stayed so); OQ-59, OQ-33 and OQ-31 were answered and
   OQ-29 and OQ-60 open. The 2026-10-16 update changed US-12.2.2 (monthly report of payments,
   download, email or print; no GST period) and FT-12.2 (the same); US-12.2.1 and US-12.2.3 did not
   change in substance.
2. **Owner decisions** (the ROADMAP decisions table):
   - **D8 (ageing and an "Overdue" view): answered** at the 2026-10-01 meeting (OQ-59, "let's go with
     your recommendation for now"). Build the flat list, oldest first, no buckets, no age chips, no
     Overdue view. Nothing in the UI is labelled provisional for it. If the drift check shows OQ-59
     reopened, record it on the "For the owner's review" list and keep the flat list (the catalogue's
     US-12.2.1 is Confirmed).
   - **D9 (do billed Lists vanish): answered** 2026-10-07 by OQ-31 and owned by **38a**. Nothing to
     build here; do not touch `isListBilled`, the anaesthetist List views, the week strip or the
     dashboard's day summary.
3. **US-12.2.2 is built as written:** a monthly list of the payments AA passed to the anaesthetist,
   each with its GST component, on a cash basis (payments, not invoices: a part-paid invoice falls
   into later months), to download, email or print on web (RV-33 supersedes the RFP-era "amounts
   received" reading). Not built, with AA's accountant: whether the BCTI is one per procedure rather
   than one per receivable invoice (the plan's one provisional place; see ROADMAP "BCTI granularity")
   and GST agency treatment (OQ-29, still Open; Greg, 16 October: "It's a payment list showing the
   GST component"). The report has one row per payment, so a BCTI flip changes only the row grain.
   The AA fee never nets against payables (Greg, 2026-10-02, trust law; Phase 16's rule), so no
   fee line appears. If OQ-60 is answered the other way, do not build netting: log it on the "For the
   owner's review" list, since it contradicts FT-10.3. "Email to me" is demo-only (no mail is sent):
   built default, log it on the owner's list.
4. **Prerequisite names.** Confirm Phase 36 is DONE in PROGRESS.md and read its handoff notes:
   - from **36**: the name and shape of the per-anaesthetist position selector (planned as
     `anaesthetistLedgerPosition(state, id)` over `anaesthetistPosition(pairs, unmatched, id)`, returning
     `dueNow`, `awaitingCollection`, `owedToThem`, `collected`, `paidOut`, `theyOweAa`), and whether it
     applies the next-day rule to invoices raised today. The ledger shapes: `LedgerPair` by `kind`
     (`procedure`, `prePayment`, `aaFee`), `PayableLeg` (`amount`, `releasedAmount`,
     `disbursedAmount`, `paidOutAtISO`), `LedgerDisbursement` (`pairId`, `anaesthetistId`, `amount`,
     `atISO`, `payablesRunId`) in `billing.disbursements`, and `incomeReceiptsFor`. Also 36's renames
     (planned: `accpayInvoicesFor` to `payableRowsFor`, `outstandingAccpayInvoicesFor` to
     `outstandingPayableRowsFor`, `MirrorState` to `LedgerState`, with `BillingCase` gone by its gate
     grep), the **"Your position" strip** above the Accounts sub-tabs
     (`data-shot="web-accounts-position"`), the "Collected $X · Paid out $Y" line on mobile Balances,
     and the PWA "Office runs payables" stand-in on Balances. Also the S3 figure for AA-2026-0005
     (planned $152.38 by Phase 16; the Contract phases 18 to 25 keep every fee unchanged, but if one
     re-based it, use the recorded figure wherever this doc says $152.38). This doc uses the pre-36
     names in the code entry points below; use whatever 36 actually shipped;
   - from **26**: confirm `gstPeriod`, `GstPeriod`, `gstPeriodLabel`, `GST_OPTIONS`, the Master data
     GST column and the GST tab's local period are gone (`grep -rn "gstPeriod\|GstPeriod\|gstPeriodLabel" aa-prototype/src`),
     and the profile route and the anaesthetist's email field (the "Email to me" address). Remove any
     straggler here;
   - from **22**: where an invoice's GST lives (today `Invoice.gst` and `Invoice.total`). Per
     US-05.2.7 (Confirmed) prices are held ex GST and GST is worked out at the invoice foot; the
     Contract's GST treatment is presentation and delivery only, so the report reads the stored foot
     GST and never recomputes it;
   - from **20a** and **21**: the one "who is invoiced" selector and the label the money rows use for
     the party an invoice went to (the Contract holder's billable party, or the payer on the Booking);
     the rows read the invoice's own stored party, never re-derive it;
   - from **27**: the prepayment pair's states (generated at setup with its ledger pair and draft Xero
     pair, sent on the admin's approval), so a held (not yet sent) or withdrawn prepayment pair is
     never an Outstanding row;
   - from **14**: the ids and bodies of `payment-full` / `payment-half` and `pwa-payment-full` /
     `pwa-payment-half`;
   - from **16**: the `fees` Accounts sub-tab and the AA fee invoice (AA's own invoice to the
     anaesthetist: never income, never on the GST report, never in the outstanding list), and the one
     BCTI count function;
   - if **37** has run: disbursements detected from Xero (they must raise Paid out and add a GST row on
     their own date, through the same ledger entries).
5. Note the current `PERSIST_VERSION` (16 at plan time, after Phase 15a session 1; later phases bump
   it further).

## Reference

**Design files (convention 17):**

- `docs/design/Web Dashboard.dc.html`: the dashboard's anatomy. The greeting and day-summary line,
  "Offer cover", the week strip (unchanged here; its Tue 21 "St George's ✓" completed marker is
  38a's), the 12-column panel grid, the Receivables panel (title row with a mono total on the right, a
  top-bordered footer line with a teal text link), the Productivity stat tiles (micro-caps label, mono
  number) and "Who's free". The Financial position panel takes the Receivables slot and reuses the
  stat-tile anatomy; nothing new is invented.
- `docs/design/Mobile App.dc.html`: the mobile card list and money rows Balances extends.
- `docs/design/Design Language.dc.html`: tokens (teal action colour, crimson identity only, the
  success and warning tints, mono tabular numbers, pills).
- No mockup covers Accounts or Balances; extend the web app's panels and tables and the mobile card
  list as they stand.

**Catalogue items:** the covered and context files listed above. The US-12.2.2 images still show the
old screens ("GST activity, defaulting to the anaesthetist's GST period"; mobile "Amounts received
this month with their GST component"); the body text governs: the report lists payments, by calendar
month, not receipts and not periods. US-12.2.1's Note records that "oldest first" and "no age chips" come from the recommendation
AA accepted. US-12.2.3's image caption still reads "week calendar, receivables, productivity and
cover", and US-08.3.5's says "aged": the item text governs (calendar, financial position, locum
availability; RV-34 and D8), so Productivity and ageing go. US-07.4.1's captions ("Once invoices are
generated the List is gone from Done") are 38a's to re-state; its `invoices-in-balances` shot (the
next day the invoices appear in outstanding balances) is the one this phase's list touches.

**Analysis files:**

- `docs/prototype-build/catch-up/GAP-ANALYSIS.md`: the money-model and removals themes (remove
  ageing, GST on disbursed payables, the Productivity and Leave panels), "Remove or rework" (ageing
  RV-35, GST basis RV-33), the EP-12 table; the DM-29, RV-33, RV-34 and RV-35 rows.
- `docs/prototype-build/catch-up/epics/EP-12.md` (FT-12.2, US-12.2.1, US-12.2.2, US-12.2.3).
- `analysis/domain-model-delta.md` DM-29, and DM-22, DM-23 for the ledger this phase reads;
  `analysis/reverse-check.md` RV-33, RV-34, RV-35 (and the dropped RV-16 note).
- `analysis/prototype-map-apps-mobile-web.md` (Dashboard, Accounts, Balances, "Next-day handover",
  "Aging buckets"), `prototype-map-store-seed.md` (selectors, the `dashboards` seed, the backdrop
  disbursements), `prototype-map-shell-demo-pwa.md` (routes, the PWA).

**Code entry points** (line numbers are from the prototype at 60e2d1e, before Phases 15a session 2
to 37, which will have moved them):

- Web: `src/apps/web/screens/DashboardScreen.tsx` (`AGING_ROWS` 26, receivables 62, `daySummary`
  71, left as it is: which Lists count is 38a's, Receivables panel 183, Productivity 220, Leave 255,
  `StatTile` 347, `leaveRange` 377); `src/apps/web/useDashboardFigures.ts`;
  `src/apps/web/screens/AccountsScreen.tsx` (`AccountsSubTab` 19, `AGING_COLS` 28,
  `OverdueTable` 80, `PaymentsTable` 174, `GstReport` 272, which Phase 26 will have stripped of the
  period selector); `src/apps/web/screens/AccountsScreen.test.tsx`; `src/apps/web/routes.tsx`
  (`ACCOUNTS_SUB_TABS` 28, `onViewOverdue` 57, `WebAccountsRoute` 133) and the `/web/accounts`
  redirect in `src/router.tsx`;
- Mobile: `src/apps/mobile/screens/BalancesScreen.tsx` (outstanding 35, aging total 39, "GST this
  month" `monthStart` 43, GST section ~108, `AgeChip` 140).
- Not touched here (38a's): `ListsScreen.tsx`, `WeekStrip.tsx`, `ListDetailView.tsx`,
  `ForwardListsScreen.tsx`, `ListDetailScreen.tsx`, `ListRow.tsx` and every `isListBilled` filter.
- Store (pre-36 names; Phase 36 renames most of these and adds `src/store/ledgerSelectors.ts`):
  `src/store/selectors.ts` (`dashboardFiguresFor` 128, `AccpayInvoiceRow` 592 with
  `agingDays` and `bucket`, `accpayRowForCase` 617 (outstanding is `invoice.total - receivedAmount`
  today), `accpayInvoicesFor` 648 (36: `payableRowsFor`), `outstandingAccpayInvoicesFor` 662
  (36: `outstandingPayableRowsFor`), `overdueAccountsFor` 667, `receivablesAgingFor` 678,
  `gstActivityFor` 708 (over `billing.receipts`, receipt date), `paymentHistoryFor` 762);
  `src/store/dashboard.test.ts`; `src/store/payablesActions.ts` (`runPayables`, the disbursement writes);
  `src/store/appStore.ts` (`PERSIST_VERSION` at line 136, 16 at 60e2d1e; `AppState
  extends SeedState`, so `dashboards` comes from the seed type; there is no `partialize`, the whole
  store persists, and `migrate` reseeds on a version mismatch); `src/store/mutate.ts`
  (`resetDomainState`, which does not copy `dashboards`); `src/store/persistMigrate.test.ts`.
- Domain and seed: `src/domain/dateDays.ts` (`AgingBucketKey`, `bucketForAgingDays`);
  `src/domain/types.ts` (`Invoice` ~672 with `gst` and `total`, `BillingReceipt.gstAmount`
  758, `Disbursement` 819 with `atISO`); `src/domain/billing/`
  (pure money maths: `GST_RATE` in `invoiceBuild.ts`, 36's `ledger.ts`); `src/domain/seed/anaesthetistDashboard.ts`;
  `src/domain/seed/index.ts` (imports 64, re-exports ~75, `SeedState.dashboards` 138,
  `dashboards: ANAESTHETIST_DASHBOARD` 464; it also imports `AgingBucketKey`); `src/domain/seed/history.ts`
  (~82 to 110, the backdrop paid accounts with their `disbursedAtISO`, which give June and earlier
  months real rows);
  `src/domain/seed/billing.ts` (~218, the seeded prepayment disbursement).
- Demo: `src/shared/demoTriggers/registry.ts` (Phase 14: `payment-full` ~376, `payment-half` ~389,
  `pwa-payment-full` ~503, `pwa-payment-half` ~515),
  `src/apps/demo/DemoData.tsx` (the guard console), `src/apps/demo/DemoXero.tsx` ("Simulate payment
  and payout" ~298), `src/shared/DemoBadge.tsx`; the product "Run payables" button in
  `src/apps/admin/screens/BillingMonitorScreen.tsx` (`data-shot="billing-payables-run"`, wherever
  Phase 37's restyle left it).
- Playwright: `visual/routing.spec.ts` (50 to 52 and 85 to 86: the Overdue redirect and the dashboard link),
  `visual/web-phase05.spec.ts` (59 to 68: `w-09-overdue.png`, `w-10-gst.png`), `visual/screens.spec.ts`.

## Work items

Model, store and seed first, then UI. Keep the four commands green after each group.

### Domain and store

1. **The GST report as pure billing maths** (`src/domain/billing/gstReport.ts`, exported from the
   billing index; US-12.2.2, DM-29, RV-33, FT-12.2). It replaces the receipts-based `gstActivityFor`.
   There is no GST period: the window is one calendar month.
   - `gstReportFrom({ pairs, invoices, disbursements, anaesthetistId, monthISO })` (`monthISO` is
     `2026-07`), over 36's ledger shapes only (never `state.xero`, never receipts). **One row per
     payment**: each disbursement entry to this anaesthetist dated in the month (on `atISO`'s date).
     Select by "the pair has a payable leg to this anaesthetist", not by a list of kinds: today that
     is `procedure` and `prePayment` (27's prepayment, disbursed after the procedure), and the kinds
     later phases add (38b's additional invoice, 39's rebill, 39b's event invoices) then count with
     no change here; `aaFee` never (no payable leg, and the fee never nets against a payable).
   - Each row: `pairId`, `invoiceNumber`, `payableNumber` (36's `-P` number), `paidOnISO`,
     `paidToYou` (the payment, GST inclusive), `gst` (its share of the invoice's **own stored GST**:
     the GST of the payment is `round(invoice.gst x cumulativePaid / payable.amount)` minus the same
     for the payments before it, so a part-paid invoice's parts sum to the invoice's GST to the cent
     and the payment that completes it takes the remainder; never a flat 3/23, since per US-05.2.7
     prices are held ex GST and GST is worked out once at the invoice foot) and `paidExGst`.
     Rows sort by `paidOnISO`, then invoice number. **Totals:** `paidToYou`, `gst`, `paidExGst`.
     There is no balance check (US-12.2.2 no longer asks for one).
   - `gstReportMonths(disbursements, anaesthetistId, todayISO)` lists the months for the picker, newest
     first, from the month of the earliest payment to the demo clock's month (always including the
     current month, even with no rows). Pure date arithmetic through `date-fns`; no `Date.now()` or
     `new Date()`; today comes in from the demo clock.
   - `gstReportCsv(report)` is the download's content (a header row, one row per payment, a totals
     row; cents as plain decimals; no dashes in any heading) and `gstReportFileName(monthISO)` gives
     `gst-report-2026-07.csv`; both pure.
   - Selector `gstReportFor(state, anaesthetistId, monthISO)` in `store/ledgerSelectors.ts` adds the
     billable party label (21's) and patient name, and, only for the current month, `notYetPaid`: the
     anaesthetist's `dueNow` from 36's position (collected by AA, not yet paid out, so it falls into a
     later month).
   - Delete `gstActivityFor`, `GstActivity` and `GstActivityRow` (and `incomeReceiptsFor`'s GST
     caller; the selector itself stays for payment history and the Collected figure).
     `BillingReceipt.gstAmount` (36's `LedgerReceipt`) is then read by nothing that calls itself GST:
     keep the field, fix its comment.
   - Confirm no GST period survives (the grep in "Before you start", item 4, from 26); remove any
     straggler, including "Bi-monthly" and "Six-monthly" strings.
   - Vitest (`gstReport.test.ts` for the pure functions, `accountsViews.test.ts` for the selector):
     - a full payment received on AA-2026-0005 adds **no** row; the payables run then adds one row
       dated the run's date, paid to you Phase 16's $152.38, with the invoice's own GST;
     - a payable half paid out in July and the rest in August appears in both months, and the two GST
       parts sum to the invoice's GST to the cent;
     - a fixture invoice whose stored GST is not 3/23 of its total (for example a zero-GST fixture)
       shows its own GST, not 3/23;
     - an AA fee payment and another anaesthetist's payout add nothing;
     - the backdrop history's payouts land in the months of their disbursement dates (June 2026 has
       rows); a payment on 31 July and one on 1 August fall in different months; a leap-year February;
     - the month list starts at the earliest payment and ends at the demo month; the CSV text and file
       name are as above; two fresh stores deep-equal.

2. **Outstanding is the unpaid payable, with no ageing** (US-12.2.1, RV-35, D8).
   - **Row meaning.** 36's `outstandingPayableRowsFor` today keeps the pre-36 reading (invoice total
     minus what the payer paid), so a row vanishes once the payer pays even though AA has not yet
     paid the anaesthetist. US-12.2.1 says "unpaid payables": the row's amount becomes
     `outstandingToYou = payable.amount - payable.disbursedAmount`, and the row stays until that is 0.
     Record this reading in the Decisions log (the gap analysis flagged it as ambiguous).
   - Each row carries a `stage` from one label map, `OUTSTANDING_STAGE_LABEL`: `awaitingPayment`
     ("Awaiting payment": nothing received), `partPaidIn` ("Part paid in") and `dueToYou` ("Paid in,
     due to you": released, not yet paid out). A per-row word is not a rollup or grouping; there are
     no subtotals by stage.
   - Rows come from **issued** pairs only, exactly the set 36's `anaesthetistPosition` sums: a
     prepayment pair generated at setup but held until the admin approves and sends it (27), or
     withdrawn, is never a row, or Owed to you
     and the Outstanding total would differ.
   - The party column reads the invoice's stored billable party through 21's label (the Contract
     holder's billable party, or the payer on the Booking), never a re-derivation.
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

3. **The financial position** (US-12.2.3 with US-08.3.5; DM-23 anaesthetist scope).
   - **One definition on the web.** Phase 36 already shows these figures in its Accounts "Your
     position" strip through `anaesthetistLedgerPosition`. The dashboard panel uses the **same
     selector, the same figures and the same labels**, so the dashboard, the strip and mobile
     Balances can never disagree. Do not define a second "Owed". Only if 36's selector lacks a figure
     below, add a thin selector beside it that derives it from the ledger legs; never from
     `state.xero` (convention 9) or from `BillingCase` fields.
   - The figures (36's names in brackets), stated in a comment and in the Decisions log:
     - **Owed to you** (`owedToThem` = `awaitingCollection` + `dueNow`, that is, every payable not yet
       paid out). With work item 2's reading it **equals the Outstanding list's total to the cent**;
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
     GST report's paid to you summed over every month to date; a full payment on AA-2026-0005
     (after S3's authorise) raises Collected by $152.38 at once, and running payables raises Paid out
     by the same; another anaesthetist's figures do not move; an AA fee payment moves nothing; figures
     are deterministic across two fresh stores.

4. **Remove the seeded dashboard figures** (RV-34).
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

5. **Web dashboard** (`DashboardScreen.tsx`; US-12.2.3).
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
   - Leave `daySummary` and the week strip as they are: which Lists they count, and the completed
     marker, are 38a's (D9, OQ-31).
   - Rename the `onViewOverdue` prop to `onViewOutstanding` and add `onViewPayments` in
     `routes.tsx`. Update the component's header comment (no seeded figures remain).

6. **Web Accounts: Outstanding** (`AccountsScreen.tsx`, `routes.tsx`, `router.tsx`; US-12.2.1, RV-35).
   - `AccountsSubTab`: `'overdue'` becomes `'outstanding'` (keep `'payments'`, `'gst'` and Phase 16's
     `'fees'`). The first sub-tab reads **Outstanding**. `/web/accounts` redirects to
     `/web/accounts/outstanding` (the index `Navigate` in `router.tsx`), and `/web/accounts/overdue`
     redirects there too, so old links and bookmarked guide URLs keep working. `WebAccountsRoute` wraps
     the screen in `RequireEntity`, so once `'overdue'` leaves `ACCOUNTS_SUB_TABS` it would render
     not-found: add an explicit `<Route path="overdue" element={<Navigate to="../outstanding" replace />} />`
     before `:subTab` (keeping any `?invoice=` query), or map it inside `WebAccountsRoute`.
   - Phase 36's "Your position" strip above the sub-tabs stays, with the labels of work item 3.
   - `OutstandingTable` (`data-shot="web-accounts-outstanding"`): one row per unpaid payable, oldest
     first, no grouping. Columns: Invoice date, Invoice (mono), Patient, Billable party, Stage (the
     `OUTSTANDING_STAGE_LABEL` word, plain text), Outstanding to you (mono, right). Leave any ACC
     marker exactly as earlier phases left it (RV-20 is not this phase's; ACC is an ordinary Contract
     holder after 18). Footer: one "Total outstanding"
     row with the count ("N invoices") and the sum, equal to "Owed to you". No bucket columns or
     totals.
   - Caption: "One row per invoice not yet paid to you, oldest first. A row stays until AA pays you.
     For a question about a line, contact the office." (US-12.2.1: queries go to office staff.) No
     provisional badge: D8 is answered.
   - Empty state: "Nothing outstanding. New invoices appear here the day after billing."
   - Header subline: "Outstanding invoices, payments, your GST report and AA fees."
   - The Payments tab is unchanged (Phase 16 reshaped it); its caption's "after they leave Overdue"
     becomes "once they are paid to you".

7. **Web Accounts: GST report** (`GstReport`; US-12.2.2, DM-29, RV-33). The sub-tab reads **GST
   report**; the route stays `/web/accounts/gst`.
   - A **month picker** (`data-shot="web-gst-month-picker"`, a select over `gstReportMonths`, labelled
     "Month", default the current month, labels like "July 2026"). No "View by", no period, no
     stepper, no free date range.
   - Table (`data-shot="web-gst-report"`): Date paid, Invoice (mono), Billable party, Paid to you
     (incl. GST), GST component, Paid ex GST (mono, right). Footer: "Month total" with the three
     totals.
   - Actions in the title row, right (`data-shot="web-gst-actions"`): **Download** (CSV, a client-side
     Blob and anchor through one shared helper in `src/shared/`, file name from
     `gstReportFileName`), **Print** (`window.print()` with a print stylesheet that shows only the
     report: title, month, anaesthetist, table; no nav or harness bar) and **Email to me** (demo
     only: no mail is sent; it shows an inline "Sent to <the anaesthetist's email>" confirmation for
     the shown month; no store write). All three are teal text or outline buttons, never crimson, and
     are disabled with a hint when the month has no rows.
   - On the current month only, when `notYetPaid` is above zero: "$Y collected by AA is not yet paid
     to you. It falls into the month AA pays it in."
   - Caption states the basis and the window in words: "July 2026 · GST on a cash basis: each payment
     AA passed to you in the month, with its GST component. An invoice paid in part appears in each
     month it is paid." A footnote says AA fee invoices are on the AA fees tab.
   - Empty state: "AA has not passed you any payments in this month."

8. **Mobile Balances** (`BalancesScreen.tsx`; US-12.2.1, US-12.2.2, RV-35).
   - The total card reads `outstandingTotalFor` over the reworked rows (not `aging.total`), labelled
     "Outstanding to you"; the subline keeps "N unpaid invoices". Phase 36's "Collected $X · Paid out
     $Y" line stays and reads the same selector as the web figures.
   - Delete `AgeChip`. Each row's second line becomes "<invoice number> · <billable party> · Invoice
     date 14 Jul", with the stage word under the amount when it is not "Awaiting payment". Keep any
     ACC marker as earlier phases left it. One caption line under the list, as on web: "A row stays until AA
     pays you. For a question about a line, contact the office." (US-12.2.1 covers mobile too.)
   - The GST section is a **peek at the current month** (the catalogue's mobile screenshot; download,
     email and print are web only): the segment reads **GST this month**, the header "July 2026 ·
     paid to you" with the month's paid-to-you total, through `gstReportFor` for the demo month.
     Rows: amount paid to you, "<date paid> · <billable party>", and GST on the right. Footer: the GST
     total. Empty copy: "AA has not passed you any payments this month yet." A one-line hint: "Open
     the web app for past months, download, print or email."
   - Header comment updated (flat list of unpaid payables, no ageing, current-month cash-basis GST).

9. **No provisional labels.** D8 is answered, so the Outstanding tab carries no badge; the GST report
   carries none (OQ-29 and the BCTI grain live in the ROADMAP and the PROGRESS entry, not the UI).

10. **Demo triggers** (the registry, `src/shared/demoTriggers/registry.ts`; see the next section).
    Re-point and re-word, do not add behaviour: put the chooser payment entries on the web money
    screens, and reword the PWA "Office runs payables" result message. "Office authorises this List"
    is not touched here (its message about where the List goes is 38a's). Email, Download and Print
    are product buttons on the report, not triggers.

11. **Copy and comment sweep.** Grep `src/` for `Overdue`, `overdue`, `aging`, `Aging`,
    `Receivables`, `productivity`, `Bi-monthly`, `GST activity`, `GST schedule`, `GST period`,
    `amounts received`, `No rollup (per the RFP)` and `payer` in the anaesthetist money views; every
    user-visible string is reworded to the new vocabulary ("GST report", "Outstanding", "billable
    party"), and stale comments are fixed. "Payer" as a money-view column heading becomes "Billable
    party"; the catalogue's "payer on the Booking" (US-11.2.2, Phase 21's field and label) is a real
    term and stays wherever 21 put it. Comments about Lists vanishing on billing (`billingRun.ts`,
    `billedAtISO`, `isListBilled`) are 38a's and stay. The admin Billing monitor's "Prior balance"
    tooltip keeps its own wording (Phase 40's). Do not use "timesheet" anywhere. No en or em dashes in
    any string added or changed.

12. **Tests and shots.**
    - `AccountsScreen.test.tsx`: Outstanding renders one row per unpaid payable oldest first with a
      stage word, a single total equal to Owed to you, and no bucket headers; a received payment keeps
      the row as "Paid in, due to you"; the GST report's month picker changes the rows and totals,
      defaults to the current month, and has no View by or period control; Download produces the CSV
      (spy on the helper), Print calls `window.print`, "Email to me" shows its confirmation with the
      anaesthetist's email; a month with no rows disables the three actions.
    - A BalancesScreen test: no age chip; "GST this month" with the month label; a payment received
      adds no GST row.
    - Playwright: `visual/routing.spec.ts` (bare `/web/accounts` and `/web/accounts/overdue` both land on
      `/web/accounts/outstanding`; the dashboard's "View outstanding invoices" link goes there);
      `visual/web-phase05.spec.ts` shots renamed `w-09-outstanding.png` and `w-10-gst-report.png`
      (with the month picker and actions), plus `w-01` dashboard re-shot; a new shot of mobile
      Balances on "GST this month". `data-shot` hooks as named above. No Lists shot changes here.

## Demo triggers

Everything this phase shows is reachable by normal use in the framed build: the office authorises a
List (the billing run raises its invoices), the Xero simulator's "Simulate payment and payout" or a
payment followed by the Billing monitor's product "Run payables" button moves Collected and Paid out
and adds the GST report row on the payout date, and the demo clock's "Next morning" brings
yesterday's invoices into Outstanding. So there is **no new trigger behaviour** (the two web payment entries below reuse Phase 14's body). Existing entries are
re-pointed or re-worded so the money beat can be driven from the screen being presented:

| Label | Screen | Surface | Effect |
|---|---|---|---|
| Payment received · full / half (re-pointed) | Web · Dashboard (`/web`) and Web · Accounts (`/web/accounts/:subTab`) | bar | The URL-driven `payment-full` / `payment-half` (Admin Invoice, Xero pair) stay exactly as they are. At 60e2d1e `surfaces` and `routes` are per entry (`src/shared/demoTriggers/types.ts`), so adding `/web` patterns and `bar` to `pwa-payment-full` / `pwa-payment-half` would also put them in the bar on `/mobile/balances`: add two new entries, `web-payment-full` / `web-payment-half` (routes `/web` and `/web/accounts/:subTab`, surface `bar`), whose `choices` and `run` call the same shared body as the PWA entries (generalise `souterOpenAccRecs` / `souterPaymentChoices` / `souterPaymentDisabled` to take an anaesthetist id; `DemoTriggerCtx` carries only `pathname`, `params` and `published` at 60e2d1e, so the web entries pass the web app's persona, `APP_CONFIG.web.persona.anaesthetistId` as `WebApp.tsx` reads it, unless a later phase put the persona on `ctx`). Only if a later phase made surfaces per route, extend the PWA entries instead. The chooser lists the open ACCRECs from `openAccRecs` whose payable belongs to that persona (36's stamped `pair.anaesthetistId`, not the List join `souterOpenAccRecs` uses today), not a hardcoded Souter. The webhook lands: Collected rises at once, the Outstanding row turns "Paid in, due to you", and the GST schedule gains **no** row. Result message: "Payment received. It reaches your GST report when AA pays you". Disabled with "No open invoices yet" when empty |
| Office runs payables (re-worded) | Mobile · Balances (`/mobile/balances`) | PWA only, badged office stand-in | Phase 36's body, unchanged. Its result message now reads "Paid out $X to Dr Souter. It leaves Outstanding and shows under GST this month" |

"Run payables" in the framed build stays the Billing monitor's own product button (Phase 14's
ruling); the S3 path to show "a receipt adds no GST row, a payout does" is the web bar's "Payment
received · full", then Admin → Billing monitor → Run payables, then back to Web → Accounts → GST
report.

PWA parity: the mobile beat is Balances (flat list of unpaid payables, the current month's GST peek). The
invoices on a handset come from Phase 14's "Office authorises this List" (unchanged), the payment
from Phase 14's `pwa-payment-*` on Balances, the payout (which now changes the
mobile GST section and removes the Outstanding row) from Phase 36's "Office runs payables", and the
next-day handover from the clock on More. The Financial position is web only (US-12.2.3 is the web
dashboard). The Control Panel page gains nothing; its index picks up the re-pointed routes
automatically.

## Out of scope

- The ledger itself, the Admin whole-ledger and per-anaesthetist screens and the imbalance indicator
  (Phase 36). This phase only reads the anaesthetist's position and disbursements.
- Disbursement detected from Xero, bulk remittance and voids (Phase 37); additional invoices as
  events on a Procedure, raised by the office or the anaesthetist (Phase 38b), and pre-op and post-op
  event invoices (Phase 39b) joining the outstanding list; credit notes and rebills, including the
  anaesthetist's own, leaving or joining it (Phase 39); the weekly ISO-week payment cycle (US-10.2.7),
  the payables run record, BCTI approval for a period (US-10.2.6), negative invoices netted against
  payments and the remittance advice (Phase 39a; a negative invoice with no later payment is handled
outside the system, OQ-71). Each changes the figures through the ledger; 39a's netting must also appear in the
GST report (handoff note).
- One BCTI per procedure rather than per receivable invoice (the plan's provisional point with AA's
  accountant, beside OQ-29 and OQ-60): the report's row grain follows 16's count if it flips.
- GST agency treatment and BCTI presentation (OQ-29, Phase 22's wording).
- Netting the AA fee against payables: never (Greg, 2026-10-02, OQ-60 part 3: "under trust law it
  mustn't"; Phase 16 builds the fee as a separate invoice paid into AA's own account). No fee line
  appears on the GST report, and a fee payment moves no figure here.
- The patient unpaid alert and its 90-day threshold counted from the invoice date (Phase 40, OQ-33,
  OQ-74, US-11.3.2).
- A mobile dashboard or a mobile financial position (US-12.2.3 is the web app's dashboard); a mobile
  AA fee view (Phase 16 recorded it as a candidate; not built).
- AA fee invoices on the dashboard, the outstanding list or the GST report: they stay on Phase 16's
  Accounts AA fees tab.
- A leave request workflow or "Request leave" button (US-01.5.3, Confirmed, is an availability
  calendar the anaesthetist keeps, with no approval workflow; Phases 29 and 30 own availability and
  leave).
- A per-anaesthetist GST balance date, a GST period or any aligned window (US-12.1.2 Retired).
- A free date range on the GST report.
- Export, print or download of any accounts view other than the GST report; a real mail send (the
  "Email to me" confirmation is demo-only).
- The ~100-row scale of the outstanding list (Phase 43).
- Productivity reporting of any kind. If AA asks for it, it becomes a new catalogue item first.
- Every List view (Phase 38a; D9 answered by OQ-31): the main view starting at today, invoiced Lists
  leaving it, the web "completed, unbilled" marker (US-07.2.1), the archive and search, the
  `isListBilled` filters, the week strip's completed tick and the dashboard's day summary.

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
      provisional badge. The sub-tabs read Outstanding, Payments, GST report, AA fees.
- [ ] S3: authorise both Mon 20 Jul Lists in Admin. The anaesthetist List views behave exactly as
      before this phase (no List view, marker or filter changed; 38a owns them); after Next morning
      the new invoices are rows in Outstanding on web and mobile.
- [ ] Next morning (clock): yesterday's new invoices join Outstanding on web and mobile, and Owed to
      you still equals the Outstanding total.
- [ ] On Web → Accounts → GST report, note the July rows. Harness bar → Demo actions → "Payment
      received · full" on AA-2026-0005: Collected rises by $152.38, the Outstanding row stays as
      "Paid in, due to you", and the GST report gains **no** row; its current-month line shows
      $152.38 collected, not yet paid to you. Admin → Billing monitor → Run payables, back to the GST
      report: one new row dated today, paid to you $152.38 with the invoice's own GST component. The
      Outstanding row is gone and Paid out rose by $152.38. Nothing on the tab reads "GST activity",
      "schedule", "period" or "received" (RV-33).
- [ ] The bar's payment entries show on Web · Dashboard and Web · Accounts with a chooser of the
      current persona's open invoices; on Admin · Invoice the URL-driven entries behave as before.
      The entries do not show on Web → Lists or Availability.
- [ ] Open another pair in the Xero simulator, Simulate payment and payout, return to the web
      dashboard: Collected and Paid out have each risen by the invoice total, Owed to you has fallen
      by the same amount, and the GST report has the row.
- [ ] GST report (Dr Souter): "July 2026" is the default; the month picker lists months back to the
      first payment; June 2026 shows its backdrop payouts and totals; a month with no payments shows
      the empty state with the three actions disabled. No View by control, no period anywhere. A
      part-paid invoice (run payables after a half payment) shows in both months and its GST parts
      sum to the invoice's GST.
- [ ] Download gives `gst-report-2026-07.csv` whose rows and totals equal the screen; Print shows the
      report alone in the print preview; "Email to me" shows "Sent to" with the anaesthetist's email.
      Mobile Balances' "GST this month" shows the current month with the hint to use the web app for
      the rest.
- [ ] Admin → Master data → Anaesthetists and the profile have no GST period; "Bi-monthly" appears
      nowhere.
- [ ] Mobile → Balances: a flat list with "Invoice date <date>" on each row and no age chips; the
      total equals the web Outstanding total.
- [ ] PWA (`npm run dev:pwa`, fresh storage): submit a List, open it, Demo chip → "Office authorises
      this List" (unchanged). Next morning, then Balances → "Payment received · full": the row stays
      as paid in and GST this month does not change; "Office runs payables": the message names GST this month, the row
      leaves Outstanding and a GST row appears. No other new entries.
- [ ] No en or em dashes in any new or changed string; teal is the only action colour; crimson unused
      in the new panel and the report's actions.
- [ ] Catalogue screenshots: the recipes for US-12.2.1, US-12.2.2 and US-12.2.3, plus US-07.4.1 (`invoices-in-balances` only), US-08.3.5 and US-08.3.2 re-pointed, are created or updated, the stale captions ("GST activity", "Amounts received", "aged", "receivables, productivity") are replaced, any recipe this phase broke is re-pointed, a full `npm run capture` ends with no failed recipe and no story without a recipe, the covered items' new shots are checked by eye, and `npm run verify:board` is green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots` and `npm run verify:board` are all green.

## Demo guide updates

Patch in the same session (`docs/demo-guide/`, the same sections of `master-demo-guide.html`, and the
Control Panel scenario text if it names Overdue, ageing or GST activity). Beats about Lists leaving
the view (S3 Beat 1's aside, workflow step 10, cheat-sheet section 2, the "billed-List
disappearance" line) are **38a's**; leave them.

- `03-demo-script.md`:
  - **Direct URLs**: "Accounts, outstanding" becomes `/web/accounts/outstanding`; "Accounts, GST
    activity" becomes "Accounts, GST report" (`/web/accounts/gst`); add `/web/accounts/payments`.
  - **S3 Beat 3** (payment, balances and disbursement, as Phases 16 and 36 left it): Expected gains
    "the web dashboard's Collected and Paid out each rise by $152.38, and the GST report for July
    gains AA-2026-0005 on today's date"; "It does not remain under Overdue because it is no
    longer outstanding" becomes "It leaves Outstanding because AA has now paid Dr Souter". Add an
    optional two-step aside: a payment alone keeps the row as "Paid in, due to you" and adds no GST
    row; the payables run adds it (GST is on a cash basis of what AA pays out). Optionally show
    Download, Print and Email to me on the report. Name the dashboard's
    Financial position wherever the beat says "receivables" or "aging".
  - **S3 discovery points**: add "whether the monthly GST report (payments passed, with the GST
    component) is what AA's accountant expects (agency treatment, OQ-29), and whether a BCTI is one
    per invoice or one per procedure". Drop any "aged or Overdue
    view" question (D8 answered).
- `02-workflows-and-handoffs.md`: the balances step (step 8) names the financial position, the flat
  list of unpaid payables and the monthly GST report of the payments AA passed on; the sequence
  diagram's "Update balance and GST views" stays.
- `01-personas-and-responsibilities.md`: "GST-period activity" becomes "their monthly GST report" (lines
  35 and 105); the anaesthetist money paragraph (115 to 117, "GST activity" and the mirror wording as
  36 left it) drops "receivables aging" and the
  "GST transaction list" and names the financial position (owed, collected, paid out), the outstanding
  list and the monthly cash-basis GST report.
- `04-presenter-cheat-sheet.md`: section 11 drops the derived-ageing line; "What each app is for"
  (Anaesthetist Web) reads "Dashboard with your financial position" and "Accounts and GST report"
  ("Accounts and GST activity", line ~146).
- `README.md` (the demo guide's readiness table, line ~96): "GST activity" becomes "GST report".
- `master-demo-guide.html`: the same sections (the balances note, the Direct URLs rows, S3 Beat 3
  Expected and its discovery callout, cheat-sheet card 11, the two "GST activity" mentions).
- No S1, S2, S4 or S5 beat changes. Phase 44 rewrites S3 around the ledger and regenerates the guide.

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19),
run after the review pass and before the PROGRESS.md entry. Re-run
`node requirements-board/agent/skills/update-build-plan/tools/recipe-status.mjs 38` first: earlier phases may have
changed these recipes. Recipes live in `requirements-board/requirements/capture/recipes/`; this
phase's session edits them, this doc only says what each must show.

| Item | Recipe now | When this phase is done |
|---|---|---|
| [US-12.2.1](../../../../requirements-board/requirements/stories/US-12.2.1.md) Outstanding balances list | captured · web-outstanding, mobile-outstanding | captured. Web: re-point `start` from `/web/accounts/overdue` to `/web/accounts/outstanding`; the flat table, oldest first, with Invoice date, Stage and Outstanding to you, highlight `[data-shot=web-accounts-outstanding]`, caption "Flat list of unpaid payables, oldest first, no ageing". Mobile `/mobile/balances`: total card and rows with "Invoice date", no age chips, caption "Outstanding to you, one row per unpaid invoice". Add a web `paid-in` state after a `web-payment-full` demo step (row turns "Paid in, due to you" and stays; open an invoice first) |
| [US-12.2.2](../../../../requirements-board/requirements/stories/US-12.2.2.md) GST report | captured · web-gst-activity, mobile-gst-activity | captured. Keep the shot name `gst-activity` (files `web-gst-activity.png`, `mobile-gst-activity.png`), change the captions. Web `/web/accounts/gst`: the month's payments with the "Month total" footer and the month picker, Download, Print and Email to me, highlight `[data-shot=web-gst-actions]`, caption "GST report: the payments AA passed to you in the month, with the GST component of each; download, print or email". Add a `previous-month` state choosing June in the picker. Mobile: click text `GST this month` (unchanged), highlight the "July 2026 · paid to you" header, caption "GST this month: what AA passed to you, with its GST". Replace the stale "Amounts received ..." captions; shots show payments dated by disbursement, never receipts |
| [US-12.2.3](../../../../requirements-board/requirements/stories/US-12.2.3.md) Dashboard | captured · web-dashboard | captured. Re-shoot `/web`: the week strip, then Financial position (`[data-shot=web-financial-position]`, the highlight) beside Who's free; no Productivity, Leave or ageing panels. Caption "Web dashboard: week calendar, financial position (owed, collected, paid out) and cover", replacing "week calendar, receivables, productivity and cover". The week strip shows whatever 38a has built; it is not this phase's highlight. Add a `paid-out` state after a payment and Run payables if a step chain can stage it |
| [FT-12.2](../../../../requirements-board/requirements/stories/FT-12.2.md) Reporting for anaesthetists | no recipe of its own (its children's shots) | no change here |

**Left this phase.** US-12.1.2 is Retired (no row; Phase 26 owns its recipes' removal). US-07.2.1's
recipe is **38a**'s; this phase changes no List screen.

**Recipes this phase breaks.** Work item 12 lists the Playwright shots; the capture recipes are separate.
- `/web/accounts/overdue` is the `start` of `US-07.4.1` (shot `invoices-in-balances` only), `US-08.3.5`
  (`web-overdue`) and `US-08.3.2` (`web-accounts`). The route redirects to `/web/accounts/outstanding`,
  so they still load, but re-point each `start`. The `US-08.3.5` caption "What is still owed to the
  anaesthetist, aged" becomes "One row per unpaid payable, oldest first"; its "collected and paid out"
  shot may point at the dashboard's Financial position or 36's strip. `US-07.4.1`'s `list-drops-off`
  shots and captions are 38a's: do not touch them.
- Re-grep before capture: `grep -lE 'accounts/overdue|GST activity|Receivables|Productivity|Overdue|Six-monthly' requirements-board/requirements/capture/recipes/*.json`.

**ATLAS.md.** Routes: `/web/accounts/overdue` becomes `/web/accounts/outstanding` (note the redirect), the GST tab is the GST report; `/mobile/balances` ("Outstanding and GST this month"). Add the new `data-shot` hooks (`web-financial-position`, `web-accounts-outstanding`, `web-gst-month-picker`, `web-gst-report`, `web-gst-actions`). Seed data: the dashboards slice, Productivity and Leave panels are gone.

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
  them, and no code nets the fee against a payable. Hunt for any path where the Payments tab, the
  dashboard, the GST report and mobile Balances disagree.
- **Unpaid payables.** An Outstanding row is the payable not yet paid out, not the receivable: a
  payer's payment keeps the row (stage "Paid in, due to you"), a payout removes it, a half payout
  halves it. No subtotal by stage.
- **Cash-basis GST.** A receipt alone never adds a report row; a payment adds one on its payout date;
  a payable paid across two months appears in both and its GST parts sum to the invoice's GST to the
  cent; GST comes from the invoice's own GST, not a flat 3/23; `aaFee` pairs never appear; nothing
  reads receipts for GST any more (RV-33), and no "GST activity", "GST schedule" or "amounts received"
  copy survives. The maths lives in `src/domain/billing/` with tests; the UI only formats.
- **No ageing left behind.** No bucket, "over 60 days", age chip, "overdue" copy or `AgingBucketKey`
  survives. The old `/web/accounts/overdue` URL redirects rather than 404s. No provisional badge for
  D8.
- **Monthly, no period.** Month boundaries are right across year ends and leap years; the month list
  ends at the demo clock's month; no `gstPeriod`, GST period label or "View by" survives (26 removed
  them); the CSV equals the screen to the cent; Print shows the report alone; "Email to me" sends
  nothing and is labelled demo-only in the owner list; no `Date.now()` or `new Date()`.
- **List views untouched.** This phase changes no anaesthetist List view, marker, filter or caption
  (`isListBilled`, Forward Lists, web Lists, the week strip, List detail and the dashboard's day
  summary are 38a's, D9 answered by OQ-31); the next-day rule for Outstanding still holds.
- **Scope and triggers.** No Productivity or Leave remnants (components, seed, selectors, tests); no
  new Control Panel entry; the re-pointed payment entries show only on their routes and the PWA
  stand-ins stay PWA-only; bodies live in `src/shared` or `src/store` so `pwaPurity` holds.
- **Persistence.** `PERSIST_VERSION` bumped, the migrate test discards a stale `dashboards` key, and
  two fresh seeds deep-equal.
- **Design and copy.** The dashboard keeps the Web Dashboard mockup's panel anatomy and rhythm; stat
  tiles in mono; teal-only actions; no crimson in panels or the report's actions; "billable party" not
  "payer" (the party comes from the invoice, through 21's label); no en or em dashes.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry; ROADMAP.md "Owner review: agents test
  themselves"): the defaults built for open questions, provisional readings, anything logged
  rather than fixed, and the screens worth a look, each with its route and persona.
- **Status row** for catch-up Phase 38, and a phase entry with:
  - the drift-check result against d4db277 (items changed or not; D8 built as answered; OQ-29's and
    OQ-60's status, with the fee-never-nets rule relied on; US-12.1.2 Retired and 26's removal of
    `gstPeriod` confirmed; D9 and US-07.2.1 confirmed as 38a's, nothing List-side built here);
  - what was built, with the name map for later phases: `receivablesAgingFor`, `overdueAccountsFor`,
    `AgingBucketKey`, `bucketForAgingDays`, `gstActivityFor`, `dashboardFiguresFor`,
    `useDashboardFigures`, `SeedState.dashboards` and `anaesthetistDashboard.ts` removed;
    `gstReportFrom`, `gstReportMonths`, `gstReportCsv` in `src/domain/billing/gstReport.ts` and
    `gstReportFor`; the reworked `outstandingPayableRowsFor`
    (`outstandingToYou`, `OUTSTANDING_STAGE_LABEL`) and `outstandingTotalFor`; the Outstanding
    sub-tab and its redirects; the Phase 36 position selector actually used;
  - the `PERSIST_VERSION` bump (from and to);
  - tests added and the before and after Vitest and Playwright counts;
  - the review pass.
- **Catalogue screenshots result:** recipes created or changed (US-12.2.1, US-12.2.2, US-12.2.3 and the re-pointed US-07.4.1 `invoices-in-balances`, US-08.3.5, US-08.3.2), the `requirements-board/requirements/capture/REPORT.md` counts (captured, partial, absent, failed) before and after, and any partial reason handed to a later phase.
- **Decisions log:**
  1. **Superseded:** 2026-07-23 "Seeded anaesthetist-dashboard figures". The Productivity and Leave
     panels and their seed are removed (RV-34); the dashboard is calendar, financial position and cover.
  2. **Superseded (RV-33):** the 2026-07-22 seventh external plan review, A17/B16 ("GST report is a
     transaction list of amounts received"). Per US-12.2.2 (2026-10-16) the GST report is a monthly
     list of the payments AA passed to the anaesthetist, dated by the disbursement, each with its GST
     read from the invoice's foot (prices held ex GST, US-05.2.7); receipts no longer feed it, and
     there is no GST period or balance check.
  3. **Amended:** 2026-07-21 "Navigation structures from the design" and the Phase 05 Overdue anatomy.
     Accounts houses Outstanding (flat, no ageing: D8, answered), Payments, GST report and AA fees.
  4. **New:** an Outstanding row is the unpaid payable (`payable.amount - disbursedAmount`), so it
     stays after the payer pays until AA pays the anaesthetist (US-12.2.1 "unpaid payables"; the
     earlier receivable reading was ambiguous). The column reads "Invoice date" (note point 33).
  5. **New:** the financial position on the dashboard uses Phase 36's anaesthetist position (Owed to
     you, Awaiting collection, Collected, Paid out, Due to you now), to date, AA fees excluded, with
     the next-day rule applied so Owed to you equals the Outstanding total.
  6. **New:** the GST report is one calendar month with a month picker, one row per payment; download
     (CSV), print and "Email to me" are web only (the email is a demo confirmation); mobile peeks the
     current month.
- **Handoff notes:**
  - For **39**: a credited invoice (by the office or the anaesthetist's own credit note) must leave
    Outstanding and a rebill join it through the ledger, and a combined split's rebuilt invoices,
    which equal the credit, join it the same way; a
    credit or negative invoice paid back or netted shows on the GST report in the month it moves
    money.
  - For **39a**: the weekly ISO-week payment cycle (US-10.2.7) sets the disbursement dates this
    report reads, so a payment held out of one cycle as an anomaly lands in the month it is finally
    paid; the payables run record and BCTI approval sit before the disbursement; netting a negative
    invoice reduces what is passed on, so the report shows the netted payment as paid, and the
    remittance figures equal the month's paid to you.
  - For **37**: a disbursement detected from Xero must raise Paid out and add its GST report row on
    its own date.
  - For **38b**: an additional invoice (an event on the Procedure, to any billable party, raised by the
    office or by the anaesthetist on their own Procedure) is its own receivable and payable; it joins Outstanding from the day after it is raised and the GST
    report when AA pays it out, through `outstandingPayableRowsFor` and `gstReportFrom` with no new
    code path. 39b's pre-op and post-op event invoices follow the same rule.
  - For **40**: the anaesthetist ageing view is gone; the 90-day patient threshold is Phase 40's own
    mild or strong alert on patient invoices.
  - For **41**: a prepayment held in trust adds no GST report row until it is disbursed after the
    procedure, and a refund on cancellation adds none; a held or withdrawn prepayment pair never
    appears in Outstanding; a by-hand additional invoice or credit note on a prepaid Procedure moves
    the figures only through its own ledger pair.
  - For **43**: the flat Outstanding list must stay usable at about 100 rows per anaesthetist, and the
    GST report at a busy month's volume.
  - For **38a**: this phase changed no List view; when an invoiced List leaves the main view, its
    invoices are rows in this Outstanding list from the next day (US-07.4.1's second criterion),
    through `outstandingPayableRowsFor`. The `/web/accounts/outstanding` route is where a List's
    "Invoiced" line can link.
  - For **44**: S3 Beat 3, the Direct URLs and the discovery points were patched here; re-read them
    in the rewrite. If the BCTI grain flips to one per procedure, the report's row grain is the
    place to change.
