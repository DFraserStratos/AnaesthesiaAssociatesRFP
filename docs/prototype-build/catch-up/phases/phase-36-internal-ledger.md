# Phase 36 · Internal ledger and balance views

**Requirements covered:**
[EP-08](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/EP-08.md) (the ledger half: linked pairs as the system of record, the parallel-run constraint as an optional narrated panel; the lock, invoices and credit are Phases 25, 22 and 39),
[FT-08.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-08.3.md) (including history that survives Xero contact archiving),
[US-08.3.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.3.2.md),
[US-08.3.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.3.4.md),
[US-08.3.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.3.5.md) (Proposed),
[US-13.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.2.1.md);
[DM-22](../analysis/domain-model-delta.md#dm-22) (BillingCase promoted to a ledger pair, with the payee
anaesthetist stamped at authorisation);
[DM-23](../analysis/domain-model-delta.md#dm-23) (derived positions: the whole ledger, each anaesthetist
and each patient; the patient screen is Phase 40, and the flat outstanding list with no ageing is
Phase 38).
**Kept, not rebuilt:** [US-08.3.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.3.1.md)
was re-graded **Matches** at `501b0b8`: the handoff already creates the ACCREC and ACCPAY together,
links them, and a fault creates neither. This phase keeps that pairing and makes the pair the engine's
own record, the source the admin views and the payables run read. It adds no reversal (Phase 39).
No reverse finding is closed here. The "mirror" wording the EP-08 gap names (code and Xero-sim copy
calling the engine a copy of Xero) is removed as part of the work.
**Answered and built:**
[OQ-02](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-02.md) (D1: AA's fee is
a monthly invoice to each anaesthetist from settings, built by Phase 16; here it becomes an `aaFee` pair
with a receivable and no payable),
[OQ-03](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-03.md) (a prepayment
above the final fee is kept, not refunded or credited: 27's excess is an informational figure outside
the imbalance),
[OQ-05](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-05.md) (a List never
fails; a Booking with any failed billable party fails whole, so a billing exception holds back every
pair of that Booking),
[OQ-30](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-30.md) (no personal
information in Xero, only a unique id: the pair id is the Xero reference),
[OQ-40](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-40.md) (prepaid money is
held in trust until the procedure and refunded in full on cancellation: Phase 41's trust account and
hold, so "receipts held" here says only that it includes prepayments received) and
[OQ-42](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-42.md) (a refund after
payout is a credit note plus a negative invoice netted in the next run: Phases 39 and 39a; the leg
entries here accept a signed amount).
**Still open, built as noted:**
[OQ-29](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-29.md) (BCTI
granularity and wording: **one payable leg per receivable invoice**, the same value as its
receivable, as Phases 16 and 22 built it; the one-place note stays beside 16's `bctisFor`),
[OQ-47](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-47.md) (payment day and
cycle, and whether period BCTI approval is the release: the payables run stays an on-demand office
action; Phase 39a adds the run record and approval),
[OQ-60](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-60.md) (what the
per-BCTI charge counts: unchanged, 16's count function is only re-fed) and
[OQ-71](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-71.md) (recovering a
negative with nothing to net against: Phase 39a).
**Depends on:**
- **Phase 16:** the payable equals the receivable and `payableReleasedFor`; the stored
  `invoiceNumber`/`reference` on Xero records; the monthly AA fee invoices (`billing.aaFeeInvoices`,
  `runMonthlyFeeInvoices`, `raiseAnaesthetistInvoiceInto`, `recordAaFeePayment`, `aaFeeRunPreview`),
  which this phase folds into the ledger; and the one BCTI count, `bctisFor` over `bctiRecords(state)`,
  which this phase re-feeds from the payable legs.
- **Phase 22:** `Invoice.procedureIds`, `lineage`, `supplier` and `delivery`, which the legs link to,
  and the Contract payment setting (OQ-23): a Split gives two invoices, so two pairs and two BCTIs.
- **Phase 25:** invoices are built only from the AUTHORISED lock (`Invoice.lockedFrom`), and the payee
  anaesthetist is stamped at authorise (`BillingCase.payeeAnaesthetistId` from `lock.payee`), which
  becomes the pair's payee.
- **Phase 27:** the prepayment invoice generated at setup and held for admin approval
  (`generatePrepaymentInvoice`, `approvePrepaymentInvoice`, withdrawal), the payee helper
  `prepaymentBasisAnaesthetist`, the reworked `prepaymentStatusFor` with part paid, and
  `excessAboveFinal`.
- Through them: 14's trigger registry and actors, 15's Booking vocabulary, 15a's warning routine (27's
  prepayment warning reads the status re-pointed here), 23's per-Procedure units on invoice lines, 24's
  layered total and 26's disbursement destination and `missingBank` flag (display only: 26 holds no
  payment back).

**Estimated:** 2 sessions. Session 1: work items 1 to 11 (figures pinned, model, pure ledger module,
every creator with the stamped payee, payments, payables, handoff, the AA fee fold, selectors and the
BCTI re-read, seed), ending green with the UI edited only as far as it must compile. Session 2: items
12 to 19 (the Admin Ledger screen, the re-pointed surfaces, the Xero sim, copy, triggers, shots and
the demo guide). This is a full two sessions. If session 1 runs long, move item 10 (audit labels) to
the start of session 2; item 18 is the first thing cut from session 2. Do not cut the parity test,
the BCTI parity assertions or the seed-balance assertions.

## Goal

`BillingCase` becomes a **ledger pair**, and the ledger becomes AA's system of record. Every invoice
the engine raises creates one pair in the same `mutate()` that raises the invoice, before and
independent of the Xero handoff. The pair has a **receivable leg** (from the billable party) and a
**payable leg** (to the anaesthetist: the BCTI, one per receivable invoice and the same value, as
Phases 16 and 22 built it; never split per Procedure). Each leg has its own number (the invoice
number, and the same number with `-P`), its own amount, its dated money entries (receipts in,
disbursements out) and its Xero mirror id. The pair links to the Booking, the List, the patient's
hidden id and the Procedures it bills, and names the **payee anaesthetist stamped at authorise**
(Phase 25's lock; for a prepayment, Phase 27's basis anaesthetist). A payment moves both legs
together, and a payable can never be disbursed beyond what its receivable has received.

Xero becomes what the catalogue says it is: a receivables and banking service that mirrors the
ledger. The handoff reads the legs and stamps their mirror ids. A handoff fault leaves the pair in the
ledger, marked "Not yet in Xero". Payables due and the payables run are computed from payable legs,
not from `state.xero.accPays`. Code and copy stop calling the engine's records a mirror of Xero.
Phase 16's BCTI count re-reads from the payable legs, with a parity test, so the monthly fee run
charges exactly what it charged before (Dr Rutherford's $500 + $5 x 40 = $700 still reproduces).

From the ledger come derived positions at three scopes:
- **The whole ledger:** receivables outstanding, receipts held, payables due, amounts disbursed, and
  the imbalance between receipts held and payables due, with the checks that explain it.
- **One anaesthetist:** what is owed to them, collected for them and paid out to them, and what
  they owe AA (their unpaid monthly AA fee invoices).
- **One patient:** every invoice across every anaesthetist, as paid, part paid or unpaid. This is a
  selector only; Phase 40 builds the patient screen.

A new **Admin Ledger** screen shows the whole ledger and any one anaesthetist, with an in-balance or
out-of-balance indicator. A demo trigger injects a receipt that matches no receivable, so the
indicator goes out of balance, and the office clears it by allocating or refunding the receipt.
Web Accounts, mobile Balances, the dashboard feed, prepayment status, the AA fee invoices and the BCTI
count, the Billing monitor, the invoice document and the Xero simulation all read the ledger.

This evolves `BillingCase`; it is not a second ledger. Every money figure a presenter shows today must
read the same after the change, and a parity test proves it.

> Names below are the July names where later phases have not renamed them (`cardId`, `casesForCard`,
> `handoffCasesForCard`). Phase 15 renamed Card to Booking; use the renamed identifiers. Likewise use
> what Phases 16 to 27 actually shipped (the AA fee actions and `bctiRecords`, 22's invoice fields,
> 25's lock and stamped payee, 26's payables destination, 27's prepayment approval, status and
> excess), as recorded in their PROGRESS entries.

## Before you start: drift check

1. Run:

   ```
   git diff 501b0b8 -- "docs/discovery-reference/Updated Requirements/catalogue" "docs/discovery-reference/Updated Requirements/domain-model.md"
   ```

   Look for changes to EP-08, FT-08.3, US-08.3.2, US-08.3.4, US-08.3.5 and US-13.2.1, and to the items
   this phase leans on: US-08.3.1 (Matches; the pairing kept), US-08.3.3 (history survives archiving),
   US-08.4.3 (unique numbers, the `-P` payable), US-09.1.1, US-09.1.4 (the BCTI note: "one per
   procedure" beside "the same value as its receivable"), US-09.2.1, US-10.1.2, US-10.2.1, US-10.2.5
   and US-10.2.6 (negative invoices and period approval, Phase 39a), FT-10.3, US-10.3.1, US-10.3.2,
   US-10.3.3, FT-13.2, US-13.2.2, US-11.3.1, US-05.3.5, FT-06.3, US-06.3.1, US-06.5.4, and the domain
   model's "Internal ledger" section and glossary. Check that US-13.2.3 is still Retired (merged into
   US-13.2.1). If an item changed, re-read it and adjust the work items. If one is now Retired or
   Future, drop it from this phase and record that in the PROGRESS entry.
2. **Answers and open questions.** None blocks this phase.
   - **Answered, build the answer:** OQ-02 (the fee is a monthly invoice; "what they owe AA" is the
     anaesthetist's unpaid fee invoices, with no new fee maths here), OQ-03 (excess prepayment kept:
     no credit, no refund, no "credit due" copy), OQ-05 (one exception per Booking, none of its pairs
     until it is resolved), OQ-30 (no personal data in any Xero field), OQ-40 (prepaid money is held in
     trust until the procedure: Phase 41 builds that account; here "receipts held" includes
     prepayments received, and the footnote says so) and OQ-42 (credit note plus a negative invoice:
     Phases 39 and 39a; leave the leg entry arrays able to take a negative entry, but add no credit or
     netting path).
   - **Still open:** OQ-29 (one payable leg per receivable invoice; the payable leg carries no
     tax-invoice wording of its own, 22's wording stays on the Xero ACCPAY), OQ-47 (the payables run
     stays an on-demand office action: no weekly close, no period approval, and no "Tuesday",
     "Wednesday" or "20th" in any copy), OQ-60 (16's `bctisFor` rule unchanged) and OQ-71 (not
     touched).
   - **If OQ-29 or AA's accountant has settled "one BCTI per procedure"** since `501b0b8`, stop and
     tell the owner before item 2: the payable leg would need per-Procedure parts (the
     `procedureShares` below are the start), and the plan re-baselines `bctiRecords`, the $700 seed
     and the S3 and S4 figures in one place. If OQ-47 has been answered, do not build it here; record
     it for Phase 39a.
   - US-13.2.1 still says "Detailed requirements to be worked out later": the Ledger screen carries a
     one-line note saying the detail is to be worked out with AA (item 12).
3. **Read what Phases 16 to 27 actually built** (their PROGRESS entries):
   - 16: `AaFeeInvoice`'s money fields (`accRecId`, `amountReceived`, `paidAtISO`),
     `runMonthlyFeeInvoices`, `raiseAnaesthetistInvoiceInto`, `recordAaFeePayment`,
     `aaFeeRunPreview`, `bctiRecords` and `bctisFor` (`domain/billing/bcti.ts`), the
     "Seed a month of BCTIs" builder, the `XeroAccRec.kind` values and the guards on `receivePayment`,
     `openAccRecs` and the poll.
   - 22: `procedureIds`, `lineage`, `portion`, `supplier` and `delivery` on `Invoice`, and how a Split
     payment setting raises its second invoice.
   - 23 and 24: what invoice lines carry per Procedure (units, the layered total).
   - 25: `Invoice.lockedFrom`, `BillingCase.payeeAnaesthetistId`, the payee readers it re-pointed
     (`anaesthetistIdForCase` in `paymentActions.ts` and `selectors.ts`, `bctiRecords`), and how
     `retryBillingCase` rebuilds from the lock.
   - 26: `payablesDue.byAnaesthetist` (with `destinationMasked`), `missingBank` and
     `Disbursement.destination`.
   - 27: `Invoice.approval`, the held and withdrawn prepayment handoff (draft and voided Xero records),
     `prepaymentBasisAnaesthetist`, the reworked `prepaymentStatusFor`, and `excessAboveFinal` on the
     prepayment case.
   Adjust the work items to reuse what exists instead of adding a second copy.
4. Note the current `PERSIST_VERSION` (13 at the snapshot; 14 to 35 will have raised it).
5. Record the result (including "no drift") in the PROGRESS entry.

## Reference

- **Design** (convention 17):
  - `docs/design/Design Language.dc.html`:
    - semantic tints for the balance indicator: success for "In balance", error for "Out of
      balance", warning for a held unmatched receipt;
    - neutral pills for leg states;
    - Spline Sans Mono with tabular-nums for every amount and every invoice or payable number;
    - card radius 14 and elevation e-1 for tiles;
    - teal as the only action colour. Crimson appears only in the side nav's active state and avatars,
      never on the indicator, tiles or buttons.
  - `docs/design/Admin Review.dc.html`: the stat-tile row (Cards, Units, Fee, Flags) is the pattern
    for the ledger tiles. Its table is the pattern for the pairs table.
  - `docs/design/Admin Day.dc.html`: the dark side nav (the new "Ledger" item and its amber badge)
    and the right-rail white cards (the unmatched-receipts card).
  - `docs/design/Mobile App.dc.html`: the Balances header card (white, radius 20) that gains the
    collected and paid-out line.
  - `docs/design/Web Dashboard.dc.html`: panel anatomy for the web Accounts position strip.
  - No mockup covers a ledger screen. Extend the Admin Review tiles and table and the Billing monitor
    panels; do not invent a new visual language.
- **Catalogue:** the covered files above, plus US-08.3.1, US-08.3.3, US-08.4.3, US-09.1.1, US-09.1.4,
  US-09.2.1, US-10.1.2, US-10.2.1, US-10.2.5, US-10.2.6, FT-10.3, US-10.3.1, US-10.3.2, US-10.3.3,
  FT-13.2, US-13.2.2, US-11.3.1, US-05.3.5, US-06.3.1, US-06.5.4; OQ-02, OQ-03, OQ-05, OQ-29, OQ-30,
  OQ-40, OQ-42, OQ-47, OQ-60 and OQ-71; the 2026-10-01 note
  (`catalogue/notes/2026-10-01-aa-meeting-with-greg.md`, points #1, #18 and #41 on the fee and the
  BCTI); and `domain-model.md` ("Internal ledger" and the glossary rows "Internal ledger", "ACCREC /
  ACCPAY", "AA fee", "Trust account" and "Negative invoice").
- **Gap analysis:**
  - `GAP-ANALYSIS.md`: Summary sizing, themes 7 (money model) and 10 (patients), the "Structural
    first" bullet "DM-26 fee removal and DM-22 ledger pair", the Money corrections trigger cluster,
    the Uncertainty note on DM-22 (BCTI cardinality), and the DM-22 and DM-23 rows.
  - `epics/EP-08.md`: the header note, and the EP-08, FT-08.3, US-08.3.1 (Matches), US-08.3.2,
    US-08.3.4 and US-08.3.5 sections.
  - `epics/EP-13.md`: US-13.2.1.
  - `gaps.json` entries for the covered IDs, US-08.3.1, DM-22 and DM-23.
  - `analysis/domain-model-delta.md`: DM-22, DM-23, and DM-26 (the AA fee as a separate ledger item);
    DM-21 and DM-25 for what Phases 41 and 39a build on these legs.
- **Code entry points** (July line numbers, from `analysis/prototype-map-*.md`; shifted by 14 to 27):
  - `src/domain/types.ts`:
    - billing types: `Invoice` 662, `InvoiceLine` 678, `BillingPipelineStatus` 687, `BillingCase`
      697, `BillingReceipt` 742;
    - Xero types: `XeroAccRec` 769, `XeroAccPay` 780, `PaymentIn` 799, `Disbursement` 809;
    - 16's `AaFeeInvoice`.
  - `src/domain/billing/`: `money.ts` (`roundToCents`, `toCents`), 16's `payableReleasedFor`
    (`payableRelease.ts`) and `aaFee.ts`, `invoiceBuild.ts` (`GST_RATE`), `index.ts`;
    `src/domain/dateDays.ts` (`epochDayOf`, `bucketForAgingDays`).
  - `src/store/`:
    - `appStore.ts`: `AppState.billing` 43 to 50, the empty billing slice about 133, `freshAppState`
      about 160, `PERSIST_VERSION`, `backfillMerge`;
    - `mutate.ts`: `ID_FORMATS` about 61 (`billingCase` BC, `receipt` RCT, `disbursement` DSB),
      `resetDomainState` about 218;
    - `billingRun.ts`: `runBillingForList` 68 (case creation about 141 to 230), `retryBillingCase`
      285, `handoffListCases` 444, `wireBillingRun` 457;
    - `prepaymentActions.ts` (27's `generatePrepaymentInvoice`, `approvePrepaymentInvoice`, the
      withdrawal, `prepaymentBasisAnaesthetist`; case creation about 112 to 146 in July);
    - 16's `aaFeeActions.ts` (`runMonthlyFeeInvoices`, `raiseAnaesthetistInvoiceInto`,
      `recordAaFeePayment`) and `domain/billing/bcti.ts` (`BctiRecord`, `bctisFor`);
    - 25's lock (`lock.payee`) and where it stamps `BillingCase.payeeAnaesthetistId`;
    - `xeroHandoff.ts` (`handoffCase` 153, `resolveContactInto`, `handoffCasesForCard`);
    - `paymentActions.ts` (`receivePayment` 78, `gstComponentOf`);
    - `payablesActions.ts` (`payablesDue` 36, `disbursePayables`, `runPayables`, `disbursePayable`);
    - `reconciliationPoll.ts`; `archiveActions.ts` (reads Xero only; check it still does).
  - `src/store/selectors.ts`:
    - cases and failures: `casesForCard` 190, `casesForList` 197, `failedCases` 205,
      `handoffFailedCases` 212, `billingAttentionCount` 219;
    - the webhook picker and balances: `openAccRecs` 240, `caseOutstandingAmount` 272,
      `patientHasOutstandingPriorEpisode` 285;
    - prepayment: `prePaymentInvoicesForCard` 316, `paidPrePaymentCaseForCard` 329,
      `prePaidByProcedure` 345, `prepaymentStatusFor` 372;
    - `billingMonitor` 429;
    - anaesthetist money views: `anaesthetistIdForCase` 612, `accpayRowForCase` 618,
      `accpayInvoicesFor` 649, `outstandingAccpayInvoicesFor` 663, `overdueAccountsFor` 668,
      `receivablesAgingFor` 679, `gstActivityFor` 709, `paymentHistoryFor` 763;
    - `billingContextForCard` 837, `entityCounts` 874, the `MirrorState` type;
    - 16's `aaFeeInvoicesFor`, `allAaFeeInvoices`, `aaFeeRunPreview` and `bctiRecords`.
  - `src/domain/seed/`: `history.ts` (`buildHistory` 145, the `HBC` cases about 286, `RCTH` receipts,
    `DSBH` disbursements, the missed-webhook `PaymentIn`); `billing.ts` (`SeedBillingSlice` 48,
    `buildSeedBillingSlice` 114, BC0001 about 234); 16's seeded AA fee history.
  - `src/apps/admin/`:
    - shell: `AdminApp.tsx` (section from path 28 to 41, outlet context), `components/SideNav.tsx`
      (`NavSection`, items), `routes.tsx`, `src/router.tsx` 88 to 106;
    - screens: `screens/BillingMonitorScreen.tsx` (payables panel about 128, `resolveAndRetry` 65,
      `payablesDue({ xero })` 50), `screens/InvoiceDocument.tsx` (money chips 188 to 209, the Xero
      rail), `screens/InvoicesScreen.tsx` (the failed banner), `screens/ReviewScreen.tsx` (the invoice
      count banner), `tableChrome.ts`.
  - `src/apps/web/screens/AccountsScreen.tsx` (header 51, `OverdueTable`, `PaymentsTable`,
    `GstReport`, 16's `AaFeesTable`); `src/apps/web/screens/DashboardScreen.tsx` 61;
    `src/apps/mobile/screens/BalancesScreen.tsx` 21 to 75.
  - `src/apps/demo/DemoXero.tsx` (subtitle 54, `PairDetail` 222, the "Linked Billing Engine case"
    callout 348, `data-shot="xero-engine-link"`), `apps/demo/xeroPairView.ts` (`engine` 44,
    `xeroInvoicePairViews` 74), `apps/demo/DemoControlPanel.tsx` (the S3 scenario text).
  - `src/shared/demoTriggers/` (14's `registry.ts`, `types.ts`, `memory.ts`), 14's new
    `src/store/demoActors.ts` (`OFFICE_ACTOR`, `OFFICE_SIMULATION_ACTOR`) and `src/store/officeStandIn.ts`
    (`authoriseAsSimulatedOffice`, which calls `handoffListCases`), `src/pwa/officeSimulation.ts`
    (also a `handoffListCases` caller at July), `src/shared/audit/actionLabels.ts`, `fieldLabels.ts`,
    `auditNarrative.ts`.
  - `src/apps/admin/screens/MasterData.tsx` `XeroArchivingView` (about 476) reads `s.xero` for
    contact archiving through `eligibleArchiveContactIds`. That is a Xero administration view, not a
    money view, and it stays on Xero.
  - Tests: `xeroHandoff.test.ts`, `paymentActions.test.ts`, `payablesActions.test.ts`,
    `billingRun.test.ts`, `billingRetry.test.ts`, `prepayment.test.ts`, `seedBilling.test.ts`,
    `dashboard.test.ts`, `archiveActions.test.ts`, `xeroNhi.test.ts`, `demoScenarios.test.ts`,
    `mutate.test.ts` (`storeDiscipline`), `persistMigrate.test.ts`, `apps/demo/xeroPairView.test.ts`,
    `DemoXero.test.tsx`, `AccountsScreen.test.tsx`, 16's `aaFeeActions.test.ts`; shots
    `visual/xero-pair.spec.ts`, `admin-phase09.spec.ts`, `web-phase05.spec.ts`,
    `mobile-phase04.spec.ts` (Balances). Capture recipes:
    `requirements-board/capture/recipes/US-08.3.1.json`, `US-08.3.2`, `US-08.3.4`, `US-08.3.5`,
    `US-13.2.1` (status "absent"), `US-13.2.2`, `US-09.1.4` (the simulator ACCPAY record).
  - 16's tests `aaFeeActions.test.ts` and the `bcti.ts` tests, 25's lock tests and 27's
    `prepayment.test.ts` and `prepaymentParity.test.ts`, which this phase's re-pointing must keep
    green.

## Work items

**Session 1: figures, model, ledger maths, store, seed.**

1. **Pin the figures first.** Before changing any code, add `src/store/ledgerParity.test.ts`, keyed on
   invoice numbers and Booking ids, never on case ids (the case-id sequence may shift, item 4). From
   the current build, capture:
   - for every seeded anaesthetist with money: the outstanding rows (`accpayInvoicesFor`: number,
     total, received, outstanding, aging bucket), `receivablesAgingFor` totals, `paymentHistoryFor`
     rows (received, released, paid out, status), and `gstActivityFor` totals for July 2026 and for
     the seeded history months;
   - `payablesDue` (count, total, and 26's `byAnaesthetist` and `missingBank`);
   - every seeded Booking's `prepaymentStatusFor`;
   - 16's `aaFeeInvoicesFor` statuses, `allAaFeeInvoices`, and `aaFeeRunPreview` for July 2026 and the
     seeded fee months (May and June 2026);
   - **the BCTI records:** `bctiRecords(state)` in full (every record's ACCPAY id, bill number,
     receivable invoice number, anaesthetist, issued date and voided flag), and `bctisFor` per
     anaesthetist for each of those months;
   - `billingMonitor` status per row for the seeded authorised Lists;
   - the `openAccRecs` picker list.

   Also capture five scripted flows, pinning every figure at each step:
   - **S3:** authorise Souter Mon 20 AM and PM. Pin the invoice numbers, totals and payees. Then pay
     half the nib invoice, run payables, pay the rest, and run payables again.
   - **S4 Beat 3:** the billing failure, then resolve and retry.
   - **S4 Beat 5:** the Hemi Walker part-then-balance payment with two payables runs.
   - **27's prepayment flows:** "Add prepaid-list Booking" (held, awaiting approval), Approve and send,
     a half payment (part paid), then the Nair balance run.
   - **16's fee run:** "Seed a month of BCTIs" then "Run monthly fee invoices" for July 2026: Dr
     Rutherford's fee invoice is $700.00 at seed settings, then "Record fee payment".

   This test must pass unchanged at the end of the phase. The only permitted edits are selector
   renames in its imports, and the two deliberate BCTI differences named in item 8, only if they
   apply.
2. **Types** (`domain/types.ts`; DM-22). Delete `BillingCase` and `BillingPipelineStatus`, so the
   compiler finds every reader. Add:
   - `ReceivableLeg = { number; counterparty: CounterpartyRef; amount; receivedAmount; paidInAtISO?;
     xeroAccRecId? }`. `amount` is the invoice total, GST inclusive, and `number` is the invoice
     number.
   - `PayableLeg = { number; anaesthetistId; amount; releasedAmount; disbursedAmount; issuedAtISO;
     paidOutAtISO?; xeroAccPayId? }`. This leg **is the BCTI**: one per receivable invoice, never one
     per Procedure (OQ-29 open; the plan's rule, kept in 16's one place):
     - `number` is `${invoiceNumber}-P` (US-08.4.3), stored, never derived at view time;
     - `anaesthetistId` is the **payee**, stamped when the pair is created: from 25's lock
       (`lock.payee`, today `BillingCase.payeeAnaesthetistId`) on a procedure pair, from 27's
       `prepaymentBasisAnaesthetist` on a prepayment pair. It is never re-derived from the List.
       Phase 41 repoints it, through one action, when a prepaid Booking moves (US-06.5.4);
     - `amount` equals the receivable's amount (FT-10.3, Phase 16);
     - `releasedAmount` replaces `authorisedAmount`;
     - `issuedAtISO` is the date the BCTI counts in for the monthly fee (16's `bctisFor`), taken from
       the same source 16's records used, so the counted month does not move.
     Amounts and entries are signed numbers, so Phases 39 and 39a can add a credit or a negative
     entry; this phase writes only positive ones.
   - `LedgerPair`, a discriminated union on `kind`, so every consumer must say which kinds it reads:
     - `kind: 'procedure' | 'prePayment'`: `{ id; kind; invoiceId; bookingId; listId; anaesthetistId;
       patientId; procedureIds; procedureShares; createdAtISO; issue; receivable; payable;
       prepaidAboveFinal?; handoffFailure? }`.
       - `anaesthetistId` is the payee, the same id as `payable.anaesthetistId` (one field to read in
         filters; the seed test asserts they agree).
       - `patientId` is the hidden internal id, so patient history is ledger data, not a join through
         the Booking (FT-08.3, US-08.3.3). `procedureIds` come from 22's `Invoice.procedureIds`.
       - `procedureShares: { procedureId; units?; amountExGst }[]` comes from the invoice lines, which
         closes Phase 23's US-05.3.5 handoff. It is information about the one payable, not a split of
         it.
       - `issue: 'held' | 'issued' | 'withdrawn'`. Billing-run pairs are `issued` at creation. A
         prepayment pair is `held` while 27's invoice awaits approval, `issued` when approved and sent,
         and `withdrawn` when 27 withdraws it. Held and withdrawn pairs count in no position, no
         payables total and no BCTI count.
       - `prepaidAboveFinal` (ex-GST) moves 27's `excessAboveFinal` onto the prepayment pair. It is
         kept, never refunded or credited (OQ-03), and is informational only.
     - `kind: 'aaFee'`: `{ id; kind; aaFeeInvoiceId; anaesthetistId; createdAtISO; receivable;
       handoffFailure? }`. It has **no payable leg**: AA is charging its own fee, not passing money
       through (FT-10.3, DM-26). The receivable's counterparty is the anaesthetist.
   - `LedgerReceipt` renames `BillingReceipt`:
     - `caseId` becomes `pairId`, and it gains `pairKind`, so an AA fee payment is money in without
       ever becoming the anaesthetist's income;
     - `source` becomes `'webhook' | 'poll' | 'allocation'`.
   - `LedgerDisbursement = { id; pairId; anaesthetistId; amount; atISO; payablesRunId; destination?
     (26); xeroDisbursementId? }`: money out as a ledger entry, not only a Xero row.
   - `UnmatchedReceipt = { id; amount; reference; atISO; idempotencyKey; source: 'webhook' | 'poll';
     status: 'held' | 'allocated' | 'refunded'; allocatedToPairId?; resolvedAtISO?; resolvedBy?;
     note? }`.
   - `BillingException = { id; bookingId; listId; code; message; procedureId?; atISO; resolvedAtISO?;
     resolvedPairIds? }`. A billing-run failure raises no invoice, so it is no longer a pair (see
     item 4). One per Booking: the Booking fails whole and the List never fails (OQ-05).
   - `AaFeeInvoice` keeps its document fields (`invoiceNumber`, `reference`, `anaesthetistId`,
     `monthISO`, the `settings` snapshot, `lines`, the counted `bctis` snapshot and `bctiCount`,
     `subtotal`, `gst`, `total`, `raisedAtISO`, `raisedBy`) and loses its money fields (`accRecId`,
     `amountReceived`, `paidAtISO`). It gains `ledgerPairId`. Its `bctis` snapshot is a record of
     what was counted at the time, not a second count.
   - `PaymentIn.source` gains `'allocation'`. `XeroAccRec` and `XeroAccPay` get doc comments saying
     each mirrors one ledger leg. `XeroAccRec.kind` stays as 16 left it.
   - `AppState.billing` becomes `{ invoices, invoiceLines, ledger: Record<string, LedgerPair>,
     receipts: Record<string, LedgerReceipt>, disbursements: Record<string, LedgerDisbursement>,
     unmatchedReceipts, exceptions, aaFeeInvoices, contactIdCache }`. `cases` goes.
   - `ID_FORMATS`: rename kind `billingCase` to `ledgerPair`, keeping prefix `BC` and pad 4 so every
     seeded and printed case reference (`BC0001`, `HBC..`) stays valid. Add `billingException` (`BX`),
     `unmatchedReceipt` (`UR`) and `ledgerDisbursement` (`LD`). `DSB` stays the Xero disbursement id.
   - Thread the new slices through the empty billing slice and `freshAppState` in `appStore.ts`,
     `resetDomainState` in `mutate.ts`, and `SeedBillingSlice`.
3. **The pure ledger module** (`domain/billing/ledger.ts`, exported from the billing index, with
   `ledger.test.ts`; convention 9):
   - Constructors:
     - `newBookingPair({ id, kind, invoice, lines, bookingId, listId, payeeAnaesthetistId,
       patientId, issue, atISO })` builds both legs, with the payable amount equal to the receivable
       amount, the payee on the pair and the payable leg, and the shares via
       `procedureSharesFrom(lines)`: per Procedure, summed amounts ex-GST and units. Deduction lines
       count. It builds exactly one payable leg whatever the number of Procedures.
     - `newAaFeePair({ id, aaFeeInvoice, atISO })`.
     - `setPairIssue(pair, issue)`: `held` to `issued` or `withdrawn` only; anything else refused.
     - `reamountHeldPair(pair, invoice, lines)`: on a `held` pair only, rewrites both legs' amounts
       (still equal) and the shares when 27 re-estimates the held invoice in place; refused on an
       issued or withdrawn pair (a sent invoice is never rewritten, OQ-70).
   - Movements, each returning the new pair and the increments:
     - `applyReceipt(pair, amount)`: clamps to the receivable balance. On a Booking pair it sets
       `releasedAmount = payableReleasedFor(received, payable.amount)` (16's rule; never a second
       copy), and it stamps `paidInAtISO` at full.
     - `applyDisbursement(pair, amount)`: refused above `releasedAmount - disbursedAmount`, and it
       stamps `paidOutAtISO` when disbursed reaches the payable amount.
   - `pairStatusLabel(pair)`, the derived label the monitor showed before:
     - `invoiced`: no Xero ids yet;
     - `handedOff`: mirrored, nothing received;
     - `handoffFailed`;
     - `partPaid`, `paid`;
     - `partPaidOut`, `disbursed`.
   - `ledgerChecks(pairs, unmatched)` returns the imbalance explanations, each with an amount and a
     target:
     - `unmatchedReceiptHeld`;
     - `pairAmountMismatch` (payable amount differs from receivable amount);
     - `releasedNotReceived` (released differs from `payableReleasedFor(received, amount)`);
     - `disbursedAboveReleased`;
     - `receivedAboveAmount`.
     A healthy ledger returns none.
   - `ledgerPosition(pairs, unmatched)`, over **issued** Booking pairs only (held and withdrawn
     prepayment pairs are listed but never summed):

     ```
     receivablesOutstanding = sum(max(0, receivable.amount - receivable.receivedAmount))
     received               = sum(receivable.receivedAmount)
     unmatchedHeld          = sum(unmatched held amounts)
     disbursed              = sum(payable.disbursedAmount)
     receiptsHeld           = received + unmatchedHeld - disbursed
     payablesDue            = sum(payable.releasedAmount - payable.disbursedAmount)
     awaitingCollection     = sum(payable.amount - payable.releasedAmount)
     imbalance              = receiptsHeld - payablesDue
     inBalance              = imbalance is 0 to the cent and there are no checks
     ```

     It also returns `aaFees: { invoiced, received, outstanding }` from the `aaFee` pairs. These are
     AA's own income, so they are **never** part of `receiptsHeld` or `imbalance`. It returns
     `prepaidAboveFinal` (the sum of 27's kept excess, OQ-03), informational and never part of
     `imbalance`, and `awaitingApproval` (the count and total of held prepayment pairs). And it returns
     `checks`, and `notInXero` (the count of pairs without mirror ids).
   - `anaesthetistPosition(pairs, anaesthetistId)`, the same maths scoped (US-13.2.1 "the same balance
     view, scoped"):
     - `dueNow` (released, not paid out) and `awaitingCollection`;
     - `owedToThem = dueNow + awaitingCollection`;
     - `collected`, `paidOut`;
     - `theyOweAa` (their unpaid monthly AA fee invoices, the `aaFee` receivables);
     - `imbalance` and the `checks` for their pairs (unmatched receipts belong to no anaesthetist
       until allocated).
   - `patientPosition(pairs, patientId)`: rows across every anaesthetist (pair id, invoice id and
     number, payee anaesthetist, Booking, billable party, raised date, total, outstanding, and status
     `paid | partPaid | unpaid`), plus `outstandingTotal` and the oldest unpaid raised date (DM-23;
     Phase 40 builds the screen and the mild or strong balance warning on it, OQ-41).
   - `bctiRecordsOf(pairs)`: 16's `BctiRecord[]` read from the payable legs, one record per payable
     leg of an issued or withdrawn Booking pair (a withdrawn pair's record is `voided: true`, so
     `bctisFor` drops it), with `accPayId` the leg's mirror id where it has one and the pair id
     otherwise, `billNumber` the leg number, `receivableInvoiceNumber` the receivable number,
     `anaesthetistId` the payee and `issuedAtISO` the leg's. `aaFee` pairs have no payable, so they
     are never counted. This is the only list `bctisFor` reads after this phase.
   - Tests:
     - the equation is exact to the cent;
     - a clean paid, part-paid and disbursed mix is in balance;
     - a $120.00 unmatched receipt gives imbalance $120.00 and one check; allocating it to a pair
       returns the ledger to balance, and so does refunding it;
     - a fee pair paid or unpaid never moves `imbalance`;
     - the per-anaesthetist positions sum to the whole ledger (the partition property);
     - a patient with invoices under two anaesthetists gets both rows;
     - a half receipt releases exactly half (16's rule);
     - a disbursement above released is refused;
     - the shares sum to the invoice subtotal, and a three-Procedure invoice still has one payable
       leg;
     - a held prepayment pair counts in no total and gives no BCTI; approving it adds it to
       receivables outstanding; a withdrawn one never counts;
     - `reamountHeldPair` keeps both legs equal to the new invoice total, and refuses an issued pair;
     - `prepaidAboveFinal` never moves `imbalance`;
     - `bctiRecordsOf` gives one record per issued payable leg, none for a fee pair;
     - same input gives deep-equal output.
4. **Pairs are created at invoice time** (store; FT-08.3, keeping US-08.3.1's pairing):
   - `runBillingForList` and `retryBillingCase` (`billingRun.ts`) create one pair per raised invoice,
     in the run's single `mutate`, through `newBookingPair`, with `issue: 'issued'`. A Split payment
     setting (22, OQ-23) raises two invoices, so two pairs, each with its own payable leg. The pair
     takes the Booking, List and patient from the Booking at run time, and the **payee from 25's
     lock** (`lock.payee.anaesthetistId`), never from the List: the field 25 stamped on the case
     (`payeeAnaesthetistId`) becomes `pair.anaesthetistId` and `payable.anaesthetistId`. Each pair
     audits `ledger.pairCreated` (entity `ledgerPair`, after: both numbers, amounts, kind, bookingId,
     payee).
   - A billing-run failure writes a `BillingException` instead of a failed case. The audit stays
     `booking.billingException` (15's name). The Booking fails whole (OQ-05): none of its invoices,
     including a Split's second, gets a pair until the exception is resolved, and the List's other
     Bookings still bill.
   - `retryBillingCase` becomes `retryBillingException(api, actor, exceptionId)`, office only. On
     success it creates the pairs, stamps `resolvedAtISO` and `resolvedPairIds`, and audits
     `billing.exceptionResolved`. It still rebuilds only from 25's lock (payee included) and stays
     idempotent: a resolved exception refuses with `alreadyResolved`.
   - **Prepayment pairs** (27's `prepaymentActions.ts`):
     - `generatePrepaymentInvoice` creates a `prePayment` pair in its `mutate` with `issue: 'held'`
       and the payee from `prepaymentBasisAnaesthetist`;
     - 27's `reestimate` path in `syncPrepayment` (the held invoice's lines and amount rewritten in
       place) calls `reamountHeldPair` in the same `mutate`, so the held pair never differs from its
       invoice;
     - `approvePrepaymentInvoice` sets it `issued` in the same `mutate` that sends the invoice;
     - the withdrawal (a change that removes the requirement, or "List authorised before approval")
       sets it `withdrawn`. The number stays used and the pair stays in the ledger for history.
   - 16's `runMonthlyFeeInvoices` creates an `aaFee` pair per fee invoice, inside
     `raiseAnaesthetistInvoiceInto`, so every invoice from AA to an anaesthetist (including 39a's later
     carried-forward negative) gets its pair on the one path. It no longer creates the fee ACCREC
     itself; the handoff does (item 5).
   - 27's prepaid-above-final excess: 27 recorded it as `excessAboveFinal` on the prepayment case. It
     raises no invoice, so it creates no pair; the run writes it as `prepaidAboveFinal` on the
     prepayment pair it came from. It is kept (OQ-03: not refunded, not credited) and never counted in
     `imbalance`. Phase 41 builds its surfaces.
   - The case-id sequence may shift, because failures no longer consume `BC` ids. Invoice numbers do
     not shift. Record any change in scripted case references.
   - Tests: the payee is the lock's in a test-only state where the List's `anaesthetistId` is changed
     after authorise; a Split gives two pairs and two payable legs; a failed Booking gives no pairs
     while a sibling bills; a held, approved and withdrawn prepayment moves `issue` exactly once each;
   changing the estimated duration of a held prepayment rewrites its pair's amounts with the invoice.
5. **The handoff reads the ledger** (`xeroHandoff.ts`; US-09.1.1, FT-09.1):
   - `handoffCase(api, caseId)` becomes `handoffPair(api, pairId)`:
     - the ACCREC is built from the receivable leg (amount, `invoiceNumber = receivable.number`,
       `reference` = the pair id), and the ACCPAY from the payable leg (`amountPayable =
       payable.amount`, `invoiceNumber = payable.number`);
     - it stamps `xeroAccRecId` and `xeroAccPayId` on the legs in the same `mutate`;
     - the ACCPAY contact is the pair's stamped payee (as 25 left it), never a List lookup;
     - a held prepayment pair hands off as drafts (ACCREC `draft`, ACCPAY `draft`), as 27 built it;
       approval moves the ACCREC on, and a withdrawal voids both mirrors;
     - an `aaFee` pair gets its 16-style `kind: 'aaFee'` ACCREC against the anaesthetist's existing
       contact, and no ACCPAY;
     - the `reference` carries only the pair id: no name, NHI or other personal data (OQ-30).
   - Idempotency keys on the leg ids. The fault path records `pair.handoffFailure` and creates no Xero
     records, but the pair and its money state stand. The monitor and Ledger show "Not yet in Xero".
   - The handoff never creates, amends or deletes a ledger record, other than stamping the mirror
     ids and clearing `handoffFailure`.
   - Rename `handoffCasesForCard` to `handoffPairsForBooking` and `handoffListCases` to
     `handoffListPairs`, updating every caller (`billingRun.ts`, `prepaymentActions.ts`, 14's
     `officeStandIn.ts`, `src/pwa/officeSimulation.ts` if it still calls it, `BillingMonitorScreen.tsx`
     and `store/index.ts`). Wire the AA fee run to hand off its new pairs after commit, as the billing
     run does.
   - Tests:
     - the Xero records copy the leg numbers and amounts;
     - a fault leaves the pair with no mirror ids, and a retry stamps them;
     - replaying the handoff is a no-op;
     - `xeroNhi.test.ts` still passes.
6. **Payments are recorded in the ledger first** (`paymentActions.ts`; US-08.3.2, US-10.2.1,
   US-09.2.1):
   - Extract an internal `applyReceiptInto(draft, pair, amount, key, source, atISO)` used by every
     path. It writes, in one `mutate`:
     - the ledger: `applyReceipt`, then a `LedgerReceipt`, audited `ledger.receiptRecorded` (entity
       `ledgerPair`: amount, cumulative, released);
     - the Xero mirror: a `PaymentIn` (unless Xero already holds it), the ACCREC's received and
       status, and `ACCPAY.amountAuthorised = releasedAmount`, audited as today
       (`xero.paymentReceived`, `xero.accpayAuthorised`).
   - `receivePayment` finds the pair by `receivable.xeroAccRecId`, and keeps its idempotency key-set
     and its clamp.
   - A payment on an ACCREC that no pair links is no longer refused `noCase`. It is recorded as an
     `UnmatchedReceipt` (status `held`), audited `ledger.unmatchedReceipt`.
   - 16's `recordAaFeePayment` writes a `LedgerReceipt` with `pairKind: 'aaFee'` on the fee pair.
     Add `incomeReceiptsFor(state, anaesthetistId)`, which excludes `aaFee`, and use it everywhere a
     receipt means income (GST activity, payment history). Fee money never reaches the BCTI count
     either: that reads payable legs, and a fee pair has none.
   - A payment on a held prepayment ACCREC is refused as 27 refuses it (not sent yet).
   - New store actions in `store/ledgerActions.ts`:
     - **`recordUnmatchedReceipt(api, { amount, reference, idempotencyKey, source, atISO? })`**: a
       system actor (`Xero webhook`, the existing `paymentActions.ts` system actor); idempotent by key.
       `atISO` defaults to the demo clock's now, never `new Date()`.
     - **`allocateUnmatchedReceipt(api, actor, unmatchedId, pairId)`**: office only. Refuses:
       - `notHeld`;
       - `notReceivable` (an `aaFee` or fully paid pair);
       - `overAllocation`, when the amount exceeds the pair's balance: "This receipt is more than the
         invoice's balance. Choose another invoice or mark it refunded."
       On success it applies the receipt through `applyReceiptInto` with key `ALLOC-<id>` and source
       `allocation`, dated the receipt's own `atISO` (so GST lands in the right period), mirrors a
       `PaymentIn` on that pair's ACCREC, sets status `allocated`, and audits
       `ledger.unmatchedAllocated`.
     - **`markUnmatchedRefunded(api, actor, unmatchedId, note)`**: office only, note required. Sets
       status `refunded` and audits `ledger.unmatchedRefunded`. It is money out, but not a
       disbursement to an anaesthetist.
   - Tests:
     - a half payment then the rest moves both legs exactly (to 16's figures);
     - a replay and a poll re-detect are no-ops;
     - an ACCREC with no pair becomes one held receipt, and a replay does not add a second;
     - allocation refusals, and a successful allocation returning the ledger to balance;
     - a refund returning it to balance;
     - fee payments never reach GST activity, payment history or the BCTI count.
7. **Payables are computed from the ledger** (`payablesActions.ts`; US-08.3.2, US-10.1.2):
   - `payablesDue(state)` reads the payable legs of issued pairs (`releasedAmount - disbursedAmount`)
     and drops its `Pick<AppState, 'xero'>` signature (the internal `caseByAccPay` map goes). It keeps
     26's `byAnaesthetist` (keyed on the stamped payee), `destinationMasked` and `missingBank`. Keep
     `byAnaesthetist` a signed sum per payee over legs: Phase 39a adds negative legs, nets them per
     anaesthetist and puts its period approval (US-10.2.6) in front of this same figure, with no second
     source.
   - Prepayment pairs release on receipt by 16's rule, as 27 left them. Holding prepaid money in trust
     until the procedure (OQ-40) is Phase 41's; do not add a hold here.
   - `runPayables` and `disbursePayable(api, actor, pairId)` iterate the pairs and apply
     `applyDisbursement`. Each writes a `LedgerDisbursement` (with 26's destination) and mirrors a
     Xero `Disbursement` plus the ACCPAY's `amountDisbursed` and status, audited `ledger.disbursed`
     then `xero.disbursed`.
   - A pair with a released amount but no ACCPAY mirror cannot occur (a receipt needs an ACCREC);
     guard it anyway with `notInXero`, skip, and count.
   - 26's destination snapshot and `missingBank` flag are unchanged (a payee with no bank account on
     file is still paid, with a `null` destination, as 26 built it).
   - The run stays an on-demand office action (OQ-47 open): no payment day, no weekly close.
   - Tests: two partial runs never double-pay; `payablesDue` is identical whether or not `state.xero`
     is present in the input (prove the ledger alone drives it); the run pays each payee what their
     legs release, and mirrors exactly what it disbursed.
8. **Selectors re-point** (a new `store/ledgerSelectors.ts`, re-exported from the store index;
   `selectors.ts` updated in place). Every app money view reads the ledger, never `state.xero`
   (US-08.3.2). Only the Xero simulation and the webhook picker read Xero.
   - Renames:
     - `casesForCard` becomes `pairsForBooking`, and `casesForList` becomes `pairsForList`;
     - `failedCases` becomes `openBillingExceptions`;
     - `handoffFailedCases` becomes `pairsNotInXero`;
     - `caseOutstandingAmount` becomes `receivableOutstanding`;
     - `billingAttentionCount` becomes exceptions plus pairs not in Xero;
     - `MirrorState` becomes `LedgerState`.
   - `patientHasOutstandingPriorEpisode` reads `patientPosition`, excluding the current Booking. Its
     boolean result is unchanged; Phase 40 builds on the position.
   - Prepayment (27's `prepaymentStatusFor`, `prePaymentInvoicesForBooking`, `prePaidByProcedure`):
     invoiced and received totals come from the Booking's `prePayment` receivable legs.
   - `prepaymentStatusFor`'s `awaitingApproval`, `unpaid`, `partPaid` and `paid` read the pair's
     `issue` and receivable leg; withdrawn pairs never count (27's rule). 27's prepayment warning
     (15a's routine) reads this status, so its mild and strong text does not change.
   - `billingMonitor` reads `pairStatusLabel` and the exceptions. It keeps counting run output only
     (not prepayment pairs), per the Phase 09 ruling.
   - The anaesthetist views:
     - `accpayInvoicesFor` becomes `payableRowsFor`, and `outstandingPayableRowsFor`,
       `overdueAccountsFor` and `receivablesAgingFor` follow; `paymentHistoryFor` reads the legs;
     - rows select on the stamped payee (`pair.anaesthetistId`); `anaesthetistIdForCase` (both
       copies, which 25 pointed at the stamped payee) is deleted, not kept as a List join;
     - a row no longer needs the Xero mirror to be visible. The ledger says the money is owed, so a
       handoff fault no longer hides it from the anaesthetist. The next-day rule stays;
     - the aging logic is only re-pointed: Phase 38 replaces it with the flat outstanding list with
       no ageing (D8).
   - 16's `aaFeeInvoicesFor`, `allAaFeeInvoices` and `aaFeeRunPreview` take their status and amounts
     from the fee pair.
   - **The BCTI count re-reads from the ledger** (FT-10.3, US-10.3.1; the critic's point kept):
     - `bctiRecords(state)` becomes `bctiRecordsOf(Object.values(state.billing.ledger))` and stops
       reading `state.xero.accPays`. `bctisFor` and `aaFeeFor` are untouched: one count, one list.
     - Update the comment beside `bctiRecords` (16's one place): one BCTI per receivable invoice (its
       payable leg), counted against the stamped payee, issued legs only. Do not restate it anywhere
       else.
     - **Parity test** (in `ledgerParity.test.ts`, item 1): on the seed and at every step of the five
       scripted flows, the records equal the pre-change `bctiRecords` output (compared on bill number,
       receivable invoice number, anaesthetist, issued date and voided; the `accPayId` may be the leg's
       mirror id), and `aaFeeRunPreview` and every raised fee invoice's `bctiCount`, lines and total
       are unchanged. Dr Rutherford's July fee is still $700.00.
     - Two deliberate differences, each with its own test and a Decisions-log line: a pair whose
       handoff failed now counts (the BCTI was issued when the invoice was raised, not when Xero got
       it), and a held prepayment pair does not (nothing has been sent). If 16 and 27 shipped either
       of these the other way, only that flow step is re-pinned, with the reason.
   - `openAccRecs` excludes any ACCREC no pair links.
   - New:
     - `ledgerPositionOf(state)`, `anaesthetistLedgerPosition(state, id)` and
       `patientLedgerPosition(state, patientId)`;
     - `ledgerRows(state, { scope, anaesthetistId?, openOnly })` for the table;
     - `heldUnmatchedReceipts(state)`, and `ledgerAttentionCount(state)` (held receipts plus checks).
   - **Gate:** this grep returns nothing:
     `grep -rnE "billing\.cases|BillingCase\b|BillingReceipt\b|MirrorState|billing mirror|Engine's own mirror|Billing Engine MIRROR|retryBillingCase|handoffCase\(|anaesthetistIdForCase|excessAboveFinal" aa-prototype/src aa-prototype/visual`
     And `grep -rn "accPays" aa-prototype/src/store/selectors.ts aa-prototype/src/store/ledgerSelectors.ts`
     finds no BCTI or money read.
     Also check that no file under `src/apps/web`, `src/apps/mobile`, `src/apps/admin` or
     `src/shared` reads `s.xero` or `state.xero` for a money figure. Two reads are allowed and stay:
     `MasterData.tsx`'s `XeroArchivingView` (contact archiving), and the demo-trigger entries in
     `src/shared/demoTriggers/` that pick ACCRECs through `openAccRecs` (14's documented demo-surface
     exemption). Run
     `grep -rnE "state\.xero|s\.xero|\{ ?xero ?\}" aa-prototype/src/apps aa-prototype/src/shared --include='*.ts' --include='*.tsx'`
     and account for every hit outside `src/apps/demo`.
9. **Seed** (`seed/history.ts`, `seed/billing.ts`, 16's AA fee seed; bump `PERSIST_VERSION` by one):
   - Every seeded case becomes a pair with the same id (`HBC..`, `BC0001`), both legs, and the leg
     numbers from its invoice and `-P`.
   - The seeded receipts become `LedgerReceipt` rows (`pairId`, `pairKind`).
   - Each seeded Xero `Disbursement` gets a matching `LedgerDisbursement` (`LD` ids in the `H`
     namespace for history, for example `LDH01`), with 26's destination.
   - Every seeded pair carries its payee (Dr Souter for the history; the seeded prepayment's basis
     anaesthetist for `BC0001`) and `issue: 'issued'` (27's seeded prepayment is approved and sent).
   - 16's fee history becomes two `aaFee` pairs: H01 paid (with its fee receipt entry) and H02
     unpaid, created through `raiseAnaesthetistInvoiceInto`'s pair constructor.
   - 16's "Seed a month of BCTIs" builder (Dr Rutherford's 40 paid and disbursed July accounts) builds
     pairs, receipts and ledger disbursements through the same constructors, so after it the ledger is
     still in balance and `bctisFor` still counts 40.
   - The seeded missed-webhook `PaymentIn` stays Xero-only. The ledger does not know it until the
     poll runs, which is the point of that beat.
   - The seed is **in balance.** Add these `seedBilling.test.ts` assertions:
     - `ledgerPositionOf(seed).imbalance === 0` and `checks` is empty;
     - every Booking pair has `payable.amount === receivable.amount`, exactly one payable leg, and
       `pair.anaesthetistId === payable.anaesthetistId`;
     - `bctiRecords(seed)` equals the pinned pre-change records (item 1);
     - every leg's cumulative amounts equal the sums of its entries;
     - every Xero ACCREC and ACCPAY maps to exactly one leg, except the missed-webhook payment's
       unmirrored receipt;
     - two builds are deep-equal, and `resetDomainState` restores every new slice.
   - Never change the filler generator's `rng()` draw order. Update `persistMigrate.test.ts` for the
     new version.
10. **Audit and narrative** (`shared/audit/actionLabels.ts`, `fieldLabels.ts`, `auditNarrative.ts`):
    - Action labels:
      - `ledger.pairCreated` "Ledger pair created";
      - `ledger.receiptRecorded` "Receipt recorded in the ledger";
      - `ledger.disbursed` "Paid out to the anaesthetist";
      - `ledger.unmatchedReceipt` "Receipt with no matching invoice";
      - `ledger.unmatchedAllocated` "Unmatched receipt allocated";
      - `ledger.unmatchedRefunded` "Unmatched receipt refunded";
      - `billing.exceptionResolved` "Billing exception resolved".
    - Entity types `ledgerPair`, `unmatchedReceipt` and `billingException` in the Audit viewer's
      filter.
    - Remove the stale `billingCase` labels.
11. **Session 1 exit:**
    - Fix every listed test.
    - Edit the UI only as far as compiling needs (renamed selectors; the monitor's retry calls
      `retryBillingException` and `handoffPair`).
    - Run `npm run build`, `npm run build:pwa` and `npx vitest run`, all green, with item 1 passing
      unchanged (including the BCTI and fee-run parity).
    - Write a short "session 1 done" note in the PROGRESS entry.

**Session 2: the Ledger screen, the surfaces, triggers and the demo.**

12. **Admin Ledger screen** (`apps/admin/screens/LedgerScreen.tsx`; US-13.2.1, US-08.3.4, US-08.3.5).
    - **Routes and nav:**
      - routes `/admin/ledger` (whole ledger) and `/admin/ledger/anaesthetists/:anaesthetistId` (one
        anaesthetist), with wrappers in `routes.tsx` and `router.tsx`; an unknown anaesthetist
        redirects to `/admin/ledger`;
      - `NavSection` gains `'ledger'`, and `AdminApp` derives it from the path;
      - `SideNav` gets "Ledger" after "Billing monitor", with an amber `ledgerAttentionCount`
        badge.
    - **Header:** h1 "Ledger", and the intro: "The Billing Engine's own ledger is AA's system of
      record. Every invoice is a receivable from the billable party and a linked payable to the
      anaesthetist. Xero mirrors it for receivables and banking." A small neutral note: "The detail of
      these views is still to be worked out with AA." (US-13.2.1's own note; it is not an open
      question.)
    - **Scope:** a Segmented control, "Whole ledger" or "One anaesthetist", with a select (roster
      order, `drSurname` from `shared/format.ts`). It is URL-driven, so the browser Back button
      works.
    - **Balance indicator** (`data-shot="ledger-balance"`):
      - In balance: success tint, a check icon, "In balance · receipts held equal payables due".
      - Out of balance: error tint, "Out of balance by $120.00".
      - Beneath, the equation in mono: "Receipts held $X less payables due $Y = $Z".
      - When out of balance, one line per check with its amount and a link (the unmatched receipt
        row, or the pair's invoice).
    - **Tiles** (the Admin Review tile row, `data-shot="ledger-tiles"`):
      - Whole ledger: Receivables outstanding, Receipts held, Payables due (with a teal text link,
        "Run payables in the Billing monitor", to `/admin/billing`, whose own product button runs
        them), Disbursed. A secondary row shows Awaiting collection (payables not yet released), AA
        fees outstanding (unpaid monthly fee invoices, linking to 16's `/admin/billing/aa-fees`), Not
        yet in Xero (count), Pre-payments awaiting approval (count and total, linking to 27's Invoices
        strip; not yet owed, so outside every other figure), and, when 27 recorded any, "Pre-paid
        above final fee" with the caption "Kept, not refunded" (OQ-03). None of these four enters the
        equation.
      - One anaesthetist: Owed to them (with "due now $X · awaiting collection $Y"), Collected,
        Paid out, They owe AA (unpaid monthly fee invoices), and the scoped balance indicator.
    - **Unmatched receipts card** (`data-shot="ledger-unmatched"`, whole-ledger scope, only when any
      exist):
      - rows show Received, Reference, Amount (mono) and a status pill (Held warning, Allocated
        success with the invoice number, Refunded neutral with the note);
      - two teal actions per held row:
        - **"Allocate to invoice"**: a Dialog listing the open Booking receivables whose balance
          covers the amount (number, payer, anaesthetist surname, balance). It calls
          `allocateUnmatchedReceipt`.
        - **"Mark refunded"**: a Dialog with a required note. It calls `markUnmatchedRefunded`.
      These are product office actions, unbadged.
    - **Pairs table** (`data-shot="ledger-pairs"`, `tableChrome` cells):
      - columns: Receivable (mono number), Payable (mono, `-P`, "None" for an AA fee), Kind
        (Procedure, Pre-payment, AA fee), Patient (name only, never the NHI), Payer, Payee (surname;
        hidden in the anaesthetist scope), Amount, Received, Released, Paid out, Xero ("Mirrored", or
        a "Not yet in Xero" warning pill; a neutral "Contact archived in Xero" note when the payer's
        Xero contact is archived, because the pair does not depend on it, FT-08.3 and US-08.3.3);
      - a held prepayment pair shows a neutral "Awaiting approval" pill and blank money columns; a
        withdrawn one shows only under All, with a neutral "Withdrawn" pill;
      - filter chips: Open (default: anything outstanding or not fully paid out) and All;
      - a row opens `/admin/invoices/:invoiceId`, or `/admin/billing` for an AA fee;
      - excludes nothing: the seeded history is ledger data. Totals row in mono.
    - **Footnotes:** "Receipts held is the money AA holds for anaesthetists, including pre-payments
      received." (OQ-40. Do not claim a trust hold here: until Phase 41 a prepayment still releases on
      receipt, as 27 left it. Phase 41 adds the trust account and its hold, and changes this line.)
      "One payable per invoice, for the same amount." (The buyer-created tax invoice wording is Phase
      22's, on the Xero ACCPAY, OQ-29.) And one line on scale: at 28,000 invoices a year this table
      pages.
    - Empty and zero states read calmly ("No payables due").
13. **Re-point the office surfaces.**
    - **Billing monitor:**
      - the payables panel reads `payablesDue(state)`, with a link "Open the ledger";
      - `resolveAndRetry` calls `retryBillingException` then `handoffPair`, or `handoffPair` alone for
        a pair not in Xero;
      - rows read `pairStatusLabel`;
      - the intro copy gains: "Money in and out is recorded in the ledger first; Xero mirrors it."
    - **Invoice document:**
      - the money chips read the pair's legs and show whether or not Xero has the pair (the gate on
        `accRecId` goes);
      - the rail's Xero card becomes a "Ledger" card: receivable and payable numbers in mono, each
        with its Xero id or "Not yet in Xero", and a link to the ledger row
        (`/admin/ledger?pair=<id>` highlights it).
    - **Invoices screen:** the failed-case banner reads `openBillingExceptions`.
    - **Review:** the post-authorise banner counts the pairs created.
    - **Booking prepayment panel, rail card and Invoices "Awaiting approval" strip (27):** check that
      they read the re-pointed status and that nothing changed on screen.
    - **AA fee invoices (16):** the fee table's status and paid date come from the fee pair, and each
      expanded row's counted BCTIs list the payable leg numbers (`-P`). No visual change.
14. **The anaesthetist surfaces** (US-08.3.5 "a single place", US-08.3.2):
    - **Web Accounts:** a "Your position" strip above the sub-tabs (`data-shot="web-accounts-position"`,
      Web Dashboard panel anatomy): Owed to you (due now and awaiting collection), Collected, Paid out
      to you, and You owe AA (unpaid monthly fee invoices, linking to 16's AA fees tab). It uses
      `anaesthetistLedgerPosition`, the one definition Phase 38's dashboard panel reuses.
    - **Mobile Balances:** the header card keeps "Outstanding to you" and adds one mono line,
      "Collected $X · Paid out $Y", plus "You owe AA $Z" when above zero (one line only; the fee
      invoice list stays on web, as Phase 16 placed it).
    - **Dashboard:** the aging panel reads the re-pointed selector. No visual change; Phase 38
      replaces it with the financial position and the flat outstanding list (D8).
    - Copy: replace "from the billing MIRROR", the "Unpaid ACCPAY invoices appear here the day after
      they are billed" empty states and the "One row per outstanding ACCPAY invoice" caption with
      ledger wording, for example "Invoices appear here the day after they are billed." and "One row
      per outstanding invoice, ordered by date raised."
15. **Xero simulation** (`DemoXero.tsx`, `xeroPairView.ts`; the direction of FT-09.1):
    - Subtitle: "The simulated Xero organisation that mirrors the Billing Engine's ledger:
      contacts, the ACCREC and ACCPAY pairs and their payment state. All fake and in-browser. The
      apps read the ledger, AA's system of record; Xero is the receivables and banking service behind
      it."
    - The "Linked Billing Engine case" callout becomes "Ledger pair (the system of record)". It shows
      the receivable and payable numbers, the ledger's received, released and paid-out amounts beside
      Xero's, and a read-only chip: "Matches the ledger" (success) or "Differs from the ledger"
      (warning). Keep `data-shot="xero-engine-link"` and add `data-shot="xero-ledger-pair"`. Phase 37
      acts on differences; this phase only shows them.
    - `xeroPairView.ts`'s `engine` block becomes `ledger` (`pairId`, `receivableNumber`,
      `payableNumber`, the ledger amounts, `matches`). Update `xeroPairView.test.ts` and
      `DemoXero.test.tsx`.
16. **Copy sweep.** No app copy calls the ledger a mirror, and no anaesthetist screen names
    ACCREC or ACCPAY. Run
    `grep -rniE "mirror" aa-prototype/src --include='*.tsx' --include='*.ts'` (quote the globs; zsh
    fails on a bare `*.tsx`). The only hits allowed are Xero mirroring
    the ledger and unrelated layout comments. No en or em dashes in any new string.
17. **Demo triggers** (the registry in `src/shared/demoTriggers/registry.ts`; bodies in `src/store`
    or `src/shared`, so `pwaPurity` holds). See "Demo triggers" below. Registry tests:
    - route visibility for each entry;
    - disabled reasons;
    - the inject body creates exactly one held receipt, and a second press is disabled;
    - the re-pointed payment entries move the ledger and Xero together;
    - 16's re-pointed "Seed a month of BCTIs" and "Record fee payment" write pairs and fee receipts,
      and the fee run after them still gives $700.00;
    - the PWA stand-in disburses only what is due.
    Never add anything to the Control Panel page. Update the Control Panel S3 scenario text
    (`DemoControlPanel.tsx`) for the new closing beat.
18. **Optional, cut first if session 2 runs long: the parallel-run variance panel** (EP-08's
    delivery constraint; narrated, not a real reconciliation):
    - Add `seed/parallelRun.ts` with `LEGACY_TOTALS`: per anaesthetist, per hospital and per Contract,
      the seeded history's receivable totals as the legacy system would report them, with one
      deliberate variance (one Contract's total $0.01 high, from per-line GST rounding).
    - A pure `parallelRunComparison(ledgerTotals, legacyTotals)` in `domain/billing/ledger.ts`, with
      a test.
    - A badged panel on the Billing monitor (`DemoBadge` "Parallel run · simulated legacy totals",
      `data-shot="billing-parallel-run"`) lists the three groupings with the variance highlighted. It
      is shown only while 14's non-persisted `memory.ts` flag is on (no `PERSIST_VERSION` change).
19. **Shots, recipes and the demo guide:**
    - Add `visual/admin-ledger.spec.ts`: the whole ledger in balance, out of balance after the
      trigger, back in balance after allocation, and the anaesthetist scope.
    - Update `xero-pair.spec.ts` (the ledger pair callout), `admin-phase09.spec.ts` (the monitor and
      invoice rail), the web Accounts shot (position strip) and the mobile Balances shot.
    - Run (from `requirements-board/`)
      `node scripts/capture.ts --only US-08.3.1,US-08.3.2,US-08.3.4,US-08.3.5,US-13.2.1,US-09.1.4 --dry`
      to see which recipes this phase breaks. Fixing them and moving US-13.2.1 from "absent" to real
      shots is the Catalogue screenshots section below, run after the review pass (the capture runner
      writes the items' `images`; never edit a requirement's text or status).
    - Patch the demo guide (below).

## Demo triggers

Harness bar (framed build):

| Label | Screen | Surface | Effect |
|---|---|---|---|
| Inject unmatched receipt | Admin · Ledger (`/admin/ledger`, `/admin/ledger/anaesthetists/:anaesthetistId`) | bar | A bank-feed notification arrives for $120.00 with reference "Bank deposit · SOUTER JULY" that matches no invoice number. Calls `recordUnmatchedReceipt` (named seed constant `UNMATCHED_RECEIPT_DEMO`, key `UNMATCHED-DEMO-<n>`, where n is one more than the unmatched receipts already in the ledger, so a reload never reuses a key; source webhook). The indicator turns "Out of balance by $120.00" with one check, and the nav badge shows 1. Disabled with "Resolve the held receipt first" while one is held. The office clears it with the screen's own "Allocate to invoice" or "Mark refunded" |
| Payment received · full / half, Replay last payment event (re-pointed) | 14's routes (Admin · Invoice document, Xero sim pair detail), plus Admin · Ledger | bar | Same bodies and idempotency keys as 14 and 16. On the Ledger, `choices` are the open Booking receivables that have a Xero ACCREC (number, payer, balance). The receipt lands in the ledger first, then Xero; tiles and indicator update in place and stay in balance |
| Run archive job (re-pointed) | 14's routes (Admin · Billing monitor, Xero sim), plus Admin · Ledger | bar | 14's `run-archive-job`, unchanged body (it archives Xero contacts only). On the Ledger, the archived payer's pairs stay listed with their money, and the Xero column notes "Contact archived in Xero" (FT-08.3, US-08.3.3) |
| Seed a month of BCTIs, Record fee payment (re-pointed) | 16's routes (`/admin/billing/aa-fees`; Xero sim fee pair) | bar | 16's entries, same labels and disabled reasons. The seeded July accounts are now pairs with ledger receipts and disbursements, so the ledger stays in balance; "Run monthly fee invoices" still gives Dr Rutherford $700.00. "Record fee payment" writes the fee pair's receipt, so They owe AA falls and nothing else moves |
| Add prepaid-list Booking (re-pointed) | 27's routes (Admin · Day, Admin · Booking detail) | bar | 27's entry, same body. The generated invoice now also creates a held Pre-payment pair, shown on the Ledger as "Awaiting approval" and counted in no total until Approve and send |
| Parallel run variance (optional, item 18) | Admin · Billing monitor (`/admin/billing`) | bar | Toggles the badged legacy-versus-ledger panel. Label reads "Hide parallel run variance" while shown. Never disabled |

"Run payables" is **not** a bar entry. Phase 14 ruled that its home is the Billing monitor's own
product button (an office action done through normal use), and this phase keeps that: the button now
runs over payable legs, and the Ledger's Payables due tile links to it.

PWA equivalents (the mobile Balances "paid out" figure waits on the office's payables run):

| Label | Screen | Surface | Effect |
|---|---|---|---|
| Office runs payables | Mobile · Balances (`/mobile/balances`) | PWA only, badge office stand-in | `runPayables(OFFICE_SIMULATION_ACTOR)` (14's actor, `badge: 'office-stand-in'`, `surfaces: ['pwa']`). The header card's "Paid out" rises by what was due. Message names the amount paid out to Dr Souter. Disabled with "Nothing due to pay out" when Dr Souter's `dueNow` is zero |
| Payment received · full / half | Mobile · Balances | PWA only | 14's `pwa-payment-full` / `pwa-payment-half`, unchanged bodies. Now "Collected" moves as well as "Outstanding to you" |

14's PWA-only "Office authorises this List" is unchanged in body: the billing run it triggers now
creates the pairs, with the payee stamped from the lock, so Balances reads them the next day.

There is no Ledger screen on the PWA and no mobile beat waits on the ledger itself, so no further
PWA entry is needed. The office-only allocation and refund are product actions in Admin.

## Out of scope

- Disbursement detected from Xero, bulk hospital remittance left in Xero, the outage queue with
  backoff, and voids made in Xero: Phase 37. This phase only shows a read-only "Matches the ledger"
  chip in the Xero sim.
- The dashboard's financial-position panel, removing Productivity and Leave, the flat outstanding
  list without ageing (RV-19, D8), the GST-period activity summary aligned to the profile, and
  billed Lists that stay visible (D9): Phase 38. This phase only re-points the reads and adds the
  Accounts position strip.
- The cash-basis GST schedule over the ledger's disbursement entries: Phase 38.
- Credit legs, reversing a pair (US-08.3.1's "reversed" clause), credit-and-rebill (OQ-19, OQ-28)
  and free-form additional invoices (D10): Phase 39.
- The payables run record, period approval of BCTIs (US-10.2.6), negative invoices netted in the run
  (US-10.2.5, OQ-42), the remittance advice and the carried-forward negative (OQ-71): Phase 39a.
- The patient screen, US-13.2.2 and US-11.3.1's invoice view, the missing-NHI list and the mild or
  strong unpaid-patient warning (OQ-41): Phase 40. This phase supplies `patientLedgerPosition` only.
- The trust account holding prepayments until the procedure (OQ-40), refunds on cancellation, the
  overpaid-prepayment surfaces (OQ-03: kept, no credit) and repointing a moved prepaid Booking's
  payee (US-06.5.4): Phase 41.
- Splitting a payable per Procedure ("one BCTI per procedure", OQ-29): not built; raise it with AA's
  accountant beside OQ-29 and OQ-60.
- A real parallel-run reconciliation, a payment day or weekly cycle (OQ-47), bank feeds, and a
  general ledger. Xero is not AA's general ledger, and neither is this.
- Mobile or web views of the ledger beyond the position figures.

## Manual test checklist

- [ ] Reset. Admin side nav shows "Ledger" with no badge. The whole ledger reads "In balance · receipts
      held equal payables due", and the equation reads $0.00 imbalance.
- [ ] The tiles show Receivables outstanding (the seeded unpaid history), Receipts held equal to
      Payables due, and Disbursed (the seeded paid accounts and BC0001). AA fees outstanding shows
      Dr Souter's unpaid June fee invoice (H02).
- [ ] One anaesthetist, Dr Souter: Owed to her (due now and awaiting collection), Collected, Paid out
      and She owes AA agree with web Accounts (Overdue total, Payments, AA fees) for the persona.
- [ ] S3 flow: authorise Souter Mon 20 AM and PM. The Ledger gains one pair per invoice, each with
      one `-P` payable number (one even for a multi-Procedure invoice), Payee Souter and Xero
      "Mirrored". Every figure in item 1 is unchanged.
- [ ] Demo actions on the nib invoice, Payment received · half. The Ledger shows Received and
      Released up by exactly the half, and Payables due up by the same. It stays in balance. The
      invoice document chips and the Xero sim agree ("Matches the ledger").
- [ ] Run payables with the Billing monitor's own button (the Ledger's Payables due tile links there). Payables due returns to $0.00, and Disbursed and Dr Souter's
      Paid out rise by the same amount.
- [ ] "Inject unmatched receipt" on the Ledger. The indicator reads "Out of balance by $120.00", the
      check line names the held receipt, the nav badge reads 1, and the trigger is disabled. The
      audit shows `ledger.unmatchedReceipt` by "Xero webhook".
- [ ] "Allocate to invoice" lists only receivables whose balance covers $120.00. Allocating returns
      the ledger to balance. The chosen invoice's received rises by $120.00, and a `PaymentIn` appears
      on its ACCREC in the Xero sim.
- [ ] Inject again, then "Mark refunded" with a note. Back in balance, and the row reads Refunded with
      the note.
- [ ] Arm handoff failure, then authorise a List. The new pairs appear in the Ledger with "Not yet in
      Xero", and the invoice rail shows the ledger numbers without Xero ids. The anaesthetist sees the
      invoice the next day regardless. Resolve and retry mirrors it.
- [ ] S4 Beat 3: the billing failure shows as an exception in the monitor, not as a ledger row.
      Resolve and retry creates the pair.
- [ ] 27's prepayment: "Add prepaid-list Booking". A Pre-payment pair appears as "Awaiting approval",
      and no tile moves. Approve and send: Receivables outstanding rises by its total. "Payment
      received · half" shows part paid on the Booking panel, its warning text and the Ledger, which
      stays in balance.
- [ ] AA fee invoices: "Seed a month of BCTIs", then "Run monthly fee invoices" for July 2026. Dr
      Rutherford's fee invoice is $700.00 ($500.00 + $5.00 x 40), its counted BCTIs list `-P`
      numbers, and the Ledger gains an AA fee pair (Payable "None") under AA fees outstanding, with
      the imbalance unchanged. "Record fee payment" clears it.
- [ ] "Run archive job" on the Ledger: the archived contact's pairs stay listed with their money, and
      the Xero column notes the archived contact.
- [ ] Web Accounts shows the "Your position" strip. Mobile Balances shows "Collected $X · Paid out
      $Y". Neither says "ACCPAY" or "mirror".
- [ ] Xero sim pair detail shows "Ledger pair (the system of record)" with both numbers and the
      success chip. The subtitle no longer calls the engine a mirror.
- [ ] (If item 18 was built) "Parallel run variance" shows the badged panel with the one-cent variance.
- [ ] PWA build, Mobile · Balances: "Payment received · half", then "Office runs payables" (office
      stand-in badge). Collected, then Paid out, move. The stand-in is disabled when nothing is due.
- [ ] Grep gates in items 8 and 16 are clean. Teal is the only action colour, crimson appears only in
      the nav, amounts are in mono with tabular-nums, and there are no en or em dashes in new copy.
- [ ] Catalogue screenshots: the recipes for US-13.2.1, US-08.3.1 to US-08.3.5 and the other EP-08 items listed in the Catalogue screenshots section are created or updated, any recipe this phase broke is re-pointed, a full `npm run capture` ends with no failed recipe and no story without a recipe, the covered items' new shots are checked by eye, and `npm run verify:board` is green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots` and `npm run verify:board` are all green.

## Demo guide updates

Patch these in the same session, in `docs/demo-guide/` and the matching sections of
`master-demo-guide.html` (lines about 573, 726, 901 and 1046 in July, moved by 16 and 27):

- `03-demo-script.md` **S3 Beat 3** (as Phase 16 left it): the Say line "The anaesthetist app reads the
  Billing Engine's mirror; it never queries Xero directly" becomes "The anaesthetist app reads the
  Billing Engine's own ledger, AA's system of record. Xero mirrors it for receivables and banking."
- **S3 new closing Beat 5, "The ledger balances"** (after 16's Beat 4):
  - **Click:**
    - Admin, Ledger: point at "In balance" and the four tiles.
    - Switch to Dr Souter: owed to her, collected, paid out, and what she owes AA.
    - Demo actions, Inject unmatched receipt: out of balance by $120.00.
    - Allocate to invoice (a Souter receivable): back in balance.
  - **Say:** "Every invoice is a pair in AA's own ledger: a receivable from whoever pays and a payable
    to the anaesthetist, created the moment the invoice is raised. Money in and money out are
    recorded here first, so the office can see at a glance that every dollar held is owed to
    someone. A receipt nobody can match shows up as an imbalance, not a mystery in Xero."
  - **Expected:** in balance; the $120.00 imbalance with its explanation; back in balance after
    allocation.
- S3 Beat 4 (the monthly AA fee, as Phase 16 left it): no figure changes; add to Expected "the fee
  invoice is an AA fee pair on the Ledger, with no payable, outside the balance".
- S4 Beat 5 (partial payment): add to Expected "the Ledger's Payables due rises with each part payment
  and returns to $0.00 after each run".
- S3 "Discovery points": add "how AA wants unmatched receipts handled (allocate, refund, or hold for
  investigation), the detail of the balance views (US-13.2.1 says it is to be worked out), and
  whether a buyer-created tax invoice is one per invoice, as built, or one per procedure (OQ-29, with
  AA's accountant)".
- `04-presenter-cheat-sheet.md`: line 124 ("reads the Billing Engine's mirror") becomes the ledger
  wording, plus a short "Internal ledger" section (pairs, the equation, the trigger and where it
  lives).
- `02-workflows-and-handoffs.md` (about 393 to 405): the money section says balances come from the
  ledger, the payables run pays from payable legs, and Xero mirrors both.
- `01-personas-and-responsibilities.md` (about 114 and 263 to 270): the office persona gains "checks
  the ledger is in balance on the Ledger screen", and the mirror wording goes.
- `docs/demo-guide/README.md` status row and the master guide's status table: "Internal ledger with
  in-balance view".
- The Control Panel S3 scenario text (item 17).
- This is not a milestone phase. Still reread the S3 section of `master-demo-guide.html` against the
  edited Markdown so beat numbers and trigger labels agree.

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19),
run after the review pass and before the PROGRESS.md entry. Re-run
`node docs/prototype-build/catch-up/tools/recipe-status.mjs 36` first: earlier phases may have
changed these recipes since this plan was written (Phases 22, 25 and 27 change several of the
invoice and billing shots below, and other agents may have left placeholder `absent` recipes). Work item 19 holds the
short list; this section is its full form and replaces its "do not edit" wording. The harness bar is hidden
in shots, so "Inject unmatched receipt" and the payment entries are staged from the matching
`/demo/control` entries in `setup` (ATLAS.md, Shell). The Xero rows below overlap Phase 37's: that phase
re-shoots the Xero simulator shots again.

**Covered items.** When the phase is done, each recipe in `requirements-board/capture/recipes/`
matches what was built. Most EP-08 stories belong to other phases; this phase only re-checks them,
because the ledger changes what the monitor, invoice rail and balance screens read:

| Item | Recipe at plan time | When this phase is done |
|---|---|---|
| [US-08.1.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.1.1.md) Authorise a List for billing | captured · admin-authorise-list[confirm,authorised], admin-billing-run | unchanged here (Phase 25 owns it). `billing-run` stays: the monitor now reads the ledger and shows an Open the ledger link, so re-shoot and check the `billing-pipeline-<listId>` highlight still lands. Keep the shot `name`s |
| [US-08.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.2.1.md) Invoice by billable party | captured · admin-invoices-by-party, admin-grouped-invoice | unchanged here. Re-shoot only if the invoice document's money chips or rail changed what the highlight shows (the Xero card becomes a Ledger card); check `invoice-lines` still lands |
| [US-08.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.2.2.md) Deposit and balance invoices | captured · admin-deposit-invoice, admin-balance-invoice | unchanged here. Check only (as US-08.2.1) |
| [US-08.2.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.2.3.md) Split one Procedure's fee between two payers | partial · admin-split-invoices, admin-insured-portion, admin-remaining-portion | stays partial; Phase 22 owns the split basis. This phase adds two pairs for a split in the ledger but changes nothing the shots show. Check only |
| [US-08.3.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.3.1.md) Linked receivable and payable | captured · simulator-xero-pair, admin-invoice-handoff | captured, re-shot. `xero-pair` (`/demo/xero/invoices/XRB0`): the callout is now "Ledger pair (the system of record)" with the "Matches the ledger" chip; highlight `xero-ledger-pair` beside `xero-engine-link`. `invoice-handoff`: the rail's "Xero handoff" section is now the Ledger card; re-point the highlight to it (add a `data-shot="invoice-ledger-card"` rather than the `h2:text-is("Xero handoff")` selector). Caption: "Receivable and payable created together and linked in the ledger" |
| [US-08.3.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.3.2.md) Ledger is the system of record | captured · web-web-accounts, mobile-mobile-balances | captured, re-shot with highlights (both have none today): web `web-accounts` on `/web/accounts/overdue` with `web-accounts-position` boxed; mobile `mobile-balances` with the "Collected $X · Paid out $Y" line boxed (add a `data-shot` for it). Add an admin shot `ledger-system-of-record` (`/admin/ledger` header and `ledger-pairs`). Caption: "Balances come from the ledger, not from Xero" |
| [US-08.3.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.3.3.md) Patient-linked history survives Xero archiving | partial · simulator-archived-contacts, web-history-kept | stays partial. Add admin `ledger-archived-contact` (`/admin/ledger`, All filter: a pair whose payer's Xero contact is archived keeps its row, with the neutral "Contact archived in Xero" note). `absentReason` keeps only: "Purging a contact is not shown." Keep the two existing shots |
| [US-08.3.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.3.4.md) Money in and money out | partial · admin-money-in-out | captured for AA overall and per anaesthetist (admin): `ledger-balance` and `ledger-tiles` on `/admin/ledger` (In balance, receivables outstanding, receipts held, payables due, disbursed), `ledger-out-of-balance` (after Inject unmatched receipt from the matching `/demo/control` entry: "Out of balance by $120.00" with `ledger-unmatched`) and `ledger-allocated` (back in balance after Allocate to invoice). Keep `money-in-out`. The per-patient position is Phase 40's patient screen: if the story's per-patient drill-down is still judged missing, leave `partial` with "Per-patient position arrives with the patient screen (Phase 40)" |
| [US-08.3.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.3.5.md) Per-anaesthetist ledger position | partial · web-web-overdue, web-web-payments, mobile-mobile-balances | captured. Admin `anaesthetist-ledger` (`/admin/ledger/anaesthetists/<id>`: owed to them, collected, paid out, they owe AA, scoped balance indicator); web `web-overdue` and `web-payments` with the "Your position" strip boxed (`web-accounts-position`); mobile `mobile-balances` with the Collected and Paid out line. Drop the partial reason |
| [US-08.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.4.1.md) Invoice layout by party | captured · admin-patient-layout, admin-contract-holder-layout | unchanged here (Phase 22). Re-shoot only: the invoice rail's Xero card becomes a Ledger card. Check only |
| [US-08.4.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.4.2.md) Send to the invoice email | partial · admin-email-invoice[ready,emailed], admin-portal-upload | stays as it is; Phase 22 owns the invoice email address. The `Delivery` rail section is not touched. Check only |
| [US-08.4.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.4.3.md) Xero invoice numbers | captured · simulator-xero-numbers | unchanged. Check only: the Xero numbers are still the ledger legs' numbers |
| [US-08.4.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.4.4.md) Invoice reproducibility | partial · admin-snapshot-invoice | unchanged here (Phase 25). Check only |
| [US-08.4.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.4.5.md) Anaesthetist as supplier, AA as agent | partial · admin-agent-line | unchanged here (Phase 22). Check only |
| [US-08.5.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.5.1.md) Billing processing status | captured · admin-processing-status, admin-failure-reason | captured, re-shot: the monitor reads `pairStatusLabel` and the exceptions, adds the Open the ledger link and the intro line "Money in and out is recorded in the ledger first; Xero mirrors it." Keep the `billing-pipeline-<listId>` highlights |
| [US-08.5.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.5.2.md) Retry a failed billing | captured · admin-card-failure[failed,retried] | captured, re-shot: the Resolve & retry button now calls `retryBillingException` then `handoffPair`. Check the `retried` state still clears the exception |
| [US-08.6.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.6.1.md) Post-op charge after invoicing | partial · web-post-op-event, mobile-post-op-event, admin-post-op-addendum[locked,added] | unchanged here (Phase 39 builds the additional invoice). Check only |
| [US-08.6.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.6.2.md) Credit and re-issue | absent | stays absent: "Built in Phase 39." Nothing visible here |
| [US-08.6.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.6.3.md) Create an additional invoice on a Procedure | none (create it); a placeholder `absent` may exist | create it if missing, else keep the placeholder, as absent: "Built in Phase 39." No shots |
| [US-08.6.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.6.4.md) Split a combined Procedure into additional invoices | none (create it); a placeholder `absent` may exist | create it if missing, else keep the placeholder, as absent: "Built in Phase 39." No shots |
| [US-13.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.2.1.md) Ledger balance views | absent | captured (admin). Shots: `whole-ledger` (`/admin/ledger`, `ledger-balance` and `ledger-tiles` in balance, `ledger-pairs` open), `anaesthetist-scope` (`/admin/ledger/anaesthetists/<id>`, the same balance view scoped) and `imbalance` (after Inject unmatched receipt, `ledger-unmatched` held). Caption: "The ledger's position at the whole-ledger and single-anaesthetist scopes". Remove the absent reason |

**Recipes this phase breaks.** Found at plan time:
- `US-08.3.1` `invoice-handoff` and `US-13.3.1` (both select the invoice rail's `h2` "Xero handoff"): the rail card is now the Ledger card. Re-point both to a `data-shot` hook on it.
- `US-09.1.1` (`xero-handoff-status`, `xero-accrec-reference`, `xero-accpay-reference`): the invoice rail's Xero ids now sit in the Ledger card; keep the `data-testid`s on the same values if the card keeps them, otherwise re-point.
- `US-09.1.2`, `US-10.2.3` (`xero-engine-link`): the hook stays, but the callout is renamed and shows the ledger amounts; re-shoot and fix captions that say "engine" or "mirror".
- `US-08.3.4`, `US-09.2.4`, `US-10.2.1` (`billing-payables-run`, "Run payables") and `US-10.1.2`: the payables panel reads `payablesDue(state)` and gains the Open the ledger link; the button and hook are kept, so check only.
- `US-08.5.2`, `US-13.3.2` ("Resolve & retry"): behaviour as before; check only.
- Web Accounts and Mobile Balances recipes: `US-07.4.1`, `US-10.3.2`, `US-12.1.2`, `US-12.2.1`, `US-12.2.2` (and `US-10.2.3`): the "Your position" strip sits above the Accounts sub-tabs, the aging panel is re-pointed, and the empty-state wording changes ("from the billing MIRROR" and the ACCPAY captions are removed). Re-shoot and fix captions or highlights that quote the old words. Phase 38 later replaces the aging panel.
- Any caption that says the Billing Engine is a mirror of Xero or names ACCREC or ACCPAY on an anaesthetist screen: sweep the recipes with `grep -il mirror requirements-board/capture/recipes/*.json`.

**ATLAS.md.** Update Routes (`/admin/ledger`, `/admin/ledger/anaesthetists/:anaesthetistId`, the Ledger nav item and its amber badge), Existing hooks (`ledger-balance`, `ledger-tiles`, `ledger-unmatched`, `ledger-pairs`, `web-accounts-position`, `xero-ledger-pair`, the invoice Ledger card hook), the Xero simulator and Control Panel notes (Inject unmatched receipt, the re-pointed payment entries) and Seed data (the seeded ledger is in balance; the $120.00 unmatched receipt reference).

## Adversarial review (after build)

After the manual test checklist and the four commands are green, and before writing the PROGRESS
entry, run the standard adversarial review-and-fix pass (PROGRESS convention 18). Fan out independent
Opus review subagents: quality, bugs/correctness and plan adherence, plus a fourth, money lens, because
this phase re-points every money read. Then this session verifies every finding against the catalogue,
this plan and the code, fixes the confirmed ones (with a test where a bug had none), re-greens, and
records the pass. Do not re-raise anything settled in the Decisions log except the rulings this phase
explicitly supersedes.

**Steer this phase's reviewers at:**

- **Parity.** `ledgerParity.test.ts` passes with only import renames (and item 8's two named BCTI
  differences, if they applied). No presenter-visible figure in S3, S4 or S5 moved. Any
  case-reference shift is recorded.
- **The BCTI count.** `bctiRecords` reads payable legs only, never `state.xero.accPays`; `bctisFor`
  is still the only count; the fee run preview and every fee invoice match the pinned figures, and
  Dr Rutherford's July fee is $700.00.
- **One payable leg per receivable invoice.** No code splits a payable per Procedure; `procedureShares`
  is information, not a second payable. A Split payment setting gives two pairs, not one pair with two
  payables.
- **The payee.** Every procedure pair's payee comes from 25's lock, and every prepayment pair's from
  `prepaymentBasisAnaesthetist`. Nothing re-derives it from the List (grep for the deleted
  `anaesthetistIdForCase`), and a test proves a List change after authorise does not move it.
- **Prepayment approval.** A held pair counts in no total, no payables figure and no BCTI count; a
  withdrawn pair never counts; approval issues it exactly once; a re-estimate rewrites the held pair
  with its invoice and never touches a sent one.
- **One ledger, not two.** `BillingCase` is gone, not wrapped. No code keeps money state both on a pair
  and somewhere else (16's `AaFeeInvoice` money fields are deleted, not left stale). Xero records hold
  only mirrored copies.
- **Created at invoice time.** Every invoice creator (billing run, retry, prepayment raise, AA fee run)
  creates its pair in the same `mutate`. The handoff only stamps mirror ids and never creates or
  changes ledger money. A handoff fault leaves a complete pair.
- **Both legs move together.**
  - A receipt always updates received and released in one commit.
  - Released always equals `payableReleasedFor(received, amount)`.
  - Nothing disburses above released.
  - An AA fee pair never has or gains a payable.
  - Cumulative leg amounts always equal the sums of their entries.
- **The equation.**
  - The imbalance is `receiptsHeld - payablesDue`, exact to the cent.
  - AA fee money, held prepayments and 27's kept excess (OQ-03) are never counted in it.
  - The per-anaesthetist positions partition the whole ledger.
  - The seed is in balance.
  - An unmatched receipt is the only way the demo goes out of balance, and allocating or refunding it
    is the only way back.
- **Unmatched receipts.**
  - Idempotent by key.
  - Allocation refuses over-allocation, AA fee pairs and fully paid pairs.
  - Allocation dates the receipt at its own `atISO` for GST.
  - Allocation mirrors a `PaymentIn` on the right ACCREC.
  - A receipt can never be allocated twice or allocated after it is refunded.
  - Only the office resolves one.
- **The system of record is honoured.**
  - No app money view (web, mobile, admin, shared) reads `state.xero`.
  - `payablesDue` and the run work from the ledger alone.
  - An invoice not yet in Xero is still owed and still visible to the anaesthetist the next day.
  - Fee payments never reach GST activity, payment history or the BCTI count.
- **Patient data.** The pair's `patientId` is the hidden internal id. The NHI never appears in the
  ledger table, the Xero sim or any new Xero field (`xeroNhi.test.ts`).
- **Copy, design, triggers.**
  - The mirror and ACCPAY wording is gone from app screens.
  - The indicator uses semantic tints, never the six status colours and never crimson.
  - Each trigger shows only on its routes.
  - The inject entry disables while a receipt is held.
  - The PWA stand-in is badged.
  - `pwaPurity` passes, `PERSIST_VERSION` is bumped by one, and the filler `rng()` order is
    unchanged.

## PROGRESS.md updates

- Status row for catch-up Phase 36, and a phase entry covering:
  - the drift-check result; the answers built (OQ-02, OQ-03, OQ-05, OQ-30, OQ-40, OQ-42) and how the
    open questions were handled (OQ-29, OQ-47, OQ-60, OQ-71);
  - what 16 to 27 were found to provide, and the renames made (the selector and store names in item
    8);
  - the session split and the adversarial pass;
  - the tests added (the ledger module, parity, the BCTI and fee-run parity, the stamped payee,
    prepayment approval states, unmatched receipts, payables from the ledger, seed balance,
    triggers), and whether either of item 8's deliberate BCTI differences applied;
  - `PERSIST_VERSION` old to new;
  - any shift in case references;
  - whether item 18 was built;
  - the Catalogue screenshots result: recipes created or changed (US-13.2.1 now shot; US-08.3.1,
    US-08.3.2, US-08.3.4, US-08.3.5 and the Xero and Accounts recipes re-pointed), the REPORT.md counts
    (captured, partial, absent, failed) before and after, and any partial reason handed to a later
    phase (US-08.3.3 purge; per-patient position to Phase 40).
- Decisions log:
  - **Superseded:**
    - The 2026-07-24 Phase 10 build decision (1): money source of truth as three cumulative amounts on
      `BillingCase`. They now live on the ledger pair's legs, with dated entries.
    - The 2026-07-24 Phase 10 build decision (2), where a handoff fault left "no pair". The ledger
      pair always exists; only the Xero mirror is missing.
    - The 2026-07-24 Phase 09 build decision (1) wording "pre-paid paid-state = the billing mirror".
      It is now read from the prepayment receivable leg.
    - Phase 16's reading that the AA fee invoice sits outside `billing.cases`. It is now an `aaFee`
      ledger pair with a receivable leg and no payable.
    - Phase 16's `bctiRecords` source (`state.xero.accPays`). It now reads the payable legs; the count
      rule beside it is unchanged.
    - Phase 25's `BillingCase.payeeAnaesthetistId` and Phase 27's `excessAboveFinal` on the case. The
      payee lives on the pair and its payable leg; the excess is `prepaidAboveFinal` on the prepayment
      pair.
    - The Phase 10 phrasing "apps read the Billing Engine's mirror, never Xero". It becomes "apps read
      the ledger, the system of record".
  - **New readings:**
    - The imbalance equation, and that AA fee money, held prepayments and the kept prepaid excess
      (OQ-03) sit outside it.
    - An unmatched receipt is held in the ledger and cleared only by office allocation or refund.
    - A billing-run failure is a `BillingException`, not a ledger pair; one per Booking, which fails
      whole (OQ-05).
    - An invoice's visibility to the anaesthetist no longer depends on the Xero mirror.
    - A BCTI is issued when its invoice is raised (counted even before Xero has it) and not while a
      prepayment awaits approval.
    - A prepayment pair is created at generation and held until approval; withdrawal keeps it for
      history and out of every total.
    - Case references keep the `BC` prefix as pair ids.
    - "Receipts held" includes prepayments received; the trust account that holds them until the
      procedure (OQ-40) is Phase 41's.
    - One payable leg per receivable invoice stays the plan's reading of OQ-29, in 16's one place
      (still open with AA's accountant).
    - The Ledger screen's detail is to be worked out with AA (US-13.2.1's own note).
- **Handoff notes:**
  - 37 builds Xero-detected disbursement, remittance and void flags on the "Matches the ledger"
    comparison and the leg mirror ids.
  - 38 builds the dashboard position panel on `anaesthetistLedgerPosition`, the flat outstanding list
    (D8) on the receivable and payable legs, and the cash-basis GST schedule on the
    `LedgerDisbursement` entries.
  - 39 adds credit entries to both legs and reverses pairs; its additional invoices create pairs
    through `newBookingPair`, so they feed `bctiRecords` with no other change.
  - 39a builds the payables run record, period BCTI approval and negative-invoice netting on
    `payablesDue.byAnaesthetist` and signed payable legs, and its carried-forward negative invoice
    through `raiseAnaesthetistInvoiceInto`, which already creates the pair.
  - 39b's event invoices create pairs through the same constructor and feed `bctiRecords`.
  - 40 builds the patient view and the unpaid-patient warning on `patientLedgerPosition` (rows carry
    the oldest unpaid raised date).
  - 41 adds the trust account beside "receipts held" (and changes the footnote), surfaces
    `prepaidAboveFinal` as kept (no credit, OQ-03), and repoints a moved prepaid Booking's payee on
    the pair and payable leg through one action (US-06.5.4).
  - 43 loads full-scale pairs through the same constructors.
