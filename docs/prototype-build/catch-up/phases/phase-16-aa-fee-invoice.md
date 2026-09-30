# Phase 16 · AA fee as its own invoice

**Requirements covered:**
[EP-10](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/EP-10.md),
[FT-10.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-10.3.md),
[US-10.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-10.2.1.md),
[US-10.3.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-10.3.1.md),
[US-10.3.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-10.3.2.md),
[US-09.1.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-09.1.1.md),
[US-09.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-09.2.1.md);
[DM-22](../analysis/domain-model-delta.md#dm-22);
[RV-07](../analysis/reverse-check.md) (AA service fee netted from the payable).
Open questions: [OQ-02](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-02.md),
[OQ-47](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-47.md),
[OQ-19](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-19.md).
Owner decision: **D1** (fee netting and basis).
**Depends on:** Phase 14 (the screen-contextual trigger registry, `useDemoTriggerContext`, and the
re-homed "Payment received (webhook)" trigger) and Phase 15 (Card becomes Booking: every `cardId`,
`casesForCard`, "Card" string and audit entity type named below is its post-15 Booking equivalent).
**Estimated:** 2 sessions. Session 1 is step 1 (fee removal), re-greened and handed back on its own.
Session 2 is step 2 (the AA fee invoice) plus the review pass and the PROGRESS entry. Session 2 is
the heavier one. Work item 9 (InvoiceNumber and Reference stored on the Xero records) does not depend
on the fee invoice and touches the same handoff, seed, `xeroPairView` and `DemoXero` code as step 1,
so if session 1 has room, build it there under step 1's `PERSIST_VERSION` bump; otherwise it opens
session 2.

## Goal

The money story the catalogue now tells, in two steps that each leave the app green and demoable.

**Step 1: the payable is the gross amount.** Stop netting the illustrative 5% AA fee off the ACCPAY.
The payable equals the receivable, and a payment releases a payable for exactly the amount received
(US-10.2.1, which merged US-10.2.2): a half payment of $152.38 releases $76.19, not 95% of it. The
seeded billing history is rebuilt on that basis, the web Payments table loses its "AA fee" and "Net
to you" columns, and the S3 figures are re-baselined ($152.38 is now what Dr Souter is paid).

**Step 2: AA's fee is its own invoice.** An office action on the Admin Billing monitor, "Generate AA
fee invoices", raises one AA fee invoice per anaesthetist from AA to the anaesthetist (FT-10.3,
US-10.3.1): its own `AA-FEE-2026-####` number, its own billing case, and a simulated Xero ACCREC
against the anaesthetist's existing Xero contact. There is no ACCPAY behind it, because it is AA
charging its own fee, not money passing through. The fee basis is the D1 default, held in one
labelled constant and shown as a demo assumption wherever the fee appears, because OQ-02 is still
open. The Admin Billing monitor and a new web **Accounts → AA fees** tab show each fee invoice paid or
unpaid (US-10.3.2). Alongside, every Xero record carries the engine's invoice number in
`InvoiceNumber` and the case reference in `Reference`, stored on the record rather than derived at
view time (US-09.1.1).

This is the corrected payables story for the "After 16" milestone.

## Before you start: drift check

1. Run the catalogue diff for this phase's items and open questions:

   ```
   git diff 1f067a8 -- "docs/discovery-reference/Updated Requirements/catalogue" "docs/discovery-reference/Updated Requirements/domain-model.md"
   ```

   Read the hunks for EP-10, FT-10.3, FT-10.2, US-10.2.1, US-10.2.2 (retired, merged into
   US-10.2.1), US-10.3.1, US-10.3.2, US-09.1.1, US-09.1.2 (retired, merged into US-09.1.1),
   US-09.2.1, US-08.4.3 (the `-P` suffix rule this phase relies on), US-08.3.1 (ledger pair),
   OQ-02, OQ-47, OQ-19, and the domain-model lines on the AA fee (the "Payment to anaesthetist
   implied a fee deducted" row, "AA fee invoices ... are separate ledger items", and the glossary
   entry).
2. If an item changed, re-read it in full and adjust the work items before building. If an item is
   now Retired or Future, drop it from this phase and say so in the PROGRESS entry. A new item on
   this surface (for example a fee-payment cycle story) joins this phase only if it is small and
   Confirmed; otherwise record it for Phase 36.
3. **Confirm D1 with the owner (ROADMAP "Owner decisions").** Then:
   - **No answer yet:** build the default. The payable equals the receivable; the AA fee is a
     separate AA-FEE invoice at 5% of amounts collected for the anaesthetist since their last fee
     invoice, treated as GST inclusive, raised when the office runs fee invoicing. The UI labels it
     "Demo assumption (OQ-02 open)".
   - **Answered with a different basis or frequency** (per invoice, per procedure, a flat monthly
     amount, fee plus GST): step 1 is unchanged. In step 2 change only the basis constant in
     `aaFee.ts` and the coverage rule in `aaFeeActions.ts` (work items 11 and 12), and reword the label to state the agreed basis
     without "assumption".
   - **Answered "the fee nets against payables":** that contradicts FT-10.3 (Confirmed). Stop, tell
     the owner, and do not build either step until the catalogue text and D1 agree.
4. **Open questions still open are safe as follows.** OQ-02: the labelled constant above. OQ-47
   (payment day and cycle): not modelled; the payables run and fee run stay on-demand office actions,
   and nothing in the copy names Tuesday, Wednesday or a weekly cycle. OQ-19 (hospital dispute
   fallback): no behaviour; a disputed or unpaid receivable simply stays outstanding and releases
   nothing.
5. Confirm Phases 14 and 15 are done: the registry (`src/shared/demoTriggers/`, entries in
   `registry.ts`) and `useDemoTriggerContext` exist, the Control Panel's "Payment received (webhook)"
   and "Automated jobs" triggers have been re-homed (Phase 14 plans them as `payment-full`,
   `payment-half` and `payment-replay` on `/admin/invoices/:invoiceId` and
   `/demo/xero/invoices/:accRecId`, and `run-reconciliation-poll` / `run-archive-job` on the Billing
   monitor and Xero sim; note any difference),
   and the Booking rename has landed. Note the current `PERSIST_VERSION` (13 at the snapshot; 14
   and 15 may have bumped it).
6. Record the result (changed items, D1 status, where 14 re-homed the webhook trigger) in the
   PROGRESS entry.

## Reference

**Design (convention 17).** [Design Language.dc.html](../../../design/Design%20Language.dc.html) is
the token source: teal `#0D6E63` for the "Generate AA fee invoices" and "Record fee payment" actions,
pill radius 999 for Paid and Unpaid pills (semantic success and neutral tokens, never the six
schedule status colours), Spline Sans Mono with tabular-nums for every amount and number, crimson
nowhere except the existing nav and avatars.
[Web Dashboard.dc.html](../../../design/Web%20Dashboard.dc.html) is the layout reference for the web
app's panels and tables; the Accounts sub-tabs extend its anatomy (no mockup covers Accounts, the
Billing monitor or the Xero simulator, so extend the existing screens' own patterns, do not invent a
new visual language).

**Catalogue and analysis.**
- Catalogue items above, plus [US-08.4.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.4.3.md)
  (unique numbers; the payable carries the receivable's number with `-P`) and
  [domain-model.md](../../../discovery-reference/Updated%20Requirements/domain-model.md) (AA fee rows).
- [GAP-ANALYSIS.md](../GAP-ANALYSIS.md): Summary theme 8 ("Money side"), the Uncertainty bullet on
  OQ-02 and OQ-47, and the S3 and S4 demo-impact bullets; per-gap detail in
  [epics/EP-10.md](../epics/EP-10.md) (the header note plans exactly these two work packages) and
  [epics/EP-09.md](../epics/EP-09.md) (US-09.1.1, US-09.2.1).
- [analysis/domain-model-delta.md](../analysis/domain-model-delta.md#dm-22) DM-22;
  [analysis/reverse-check.md](../analysis/reverse-check.md) RV-07.
- [analysis/prototype-map-store-seed.md](../analysis/prototype-map-store-seed.md) section 4 (money
  pipeline), [prototype-map-admin.md](../analysis/prototype-map-admin.md) section 7 (Billing
  monitor), [prototype-map-apps-mobile-web.md](../analysis/prototype-map-apps-mobile-web.md)
  (Accounts), [prototype-map-shell-demo-pwa.md](../analysis/prototype-map-shell-demo-pwa.md) 5.1 and
  5.2 (Control Panel payment card, Xero simulation).
- PROGRESS.md Decisions log: **2026-07-29 "Xero money flow and illustrative AA service fee"** (this
  phase supersedes it) and 2026-07-24 Phase 10 reading (2) `D-payee-amount` (payable equals the
  collection; this phase restores it as the catalogue rule, not a reading).

**Code entry points (paths under `aa-prototype/src/`, names as at the snapshot).**
- Fee maths to remove: `domain/billing/agencyFee.ts` (`AA_SERVICE_FEE_RATE`, `aaServiceFeeFor`),
  `agencyFee.test.ts`, the re-export in `domain/billing/index.ts:7`.
- Types: `domain/types.ts` `BillingCase` (~699), `BillingReceipt`, `XeroAccRec` (~770), `XeroAccPay`
  (~780, `grossAmount`, `serviceFeeRate`, `serviceFeeAmount`, net `amountPayable`), `PaymentIn`.
- Store: `store/xeroHandoff.ts` `handoffCase` (ACCPAY built from `aaServiceFeeFor` at ~234, audit
  `xero.pairCreated` ~270, `resolveContactInto` ~81, payee key `anaesthetist:<reg>`);
  `store/paymentActions.ts` `receivePayment` (pro-rata `proRataAuthorised` ~41, applied ~101-104;
  re-exported from `store/index.ts:123`); `PaymentIn.source` is `'webhook' | 'poll'` today;
  `store/payablesActions.ts` `payablesDue`, `runPayables`, `disbursePayable` (`fullyPaidOut` against
  `amountPayable`); `store/reconciliationPoll.ts` (re-detects every `xero.payments` row whose
  idempotency key no receipt carries); `store/archiveActions.ts`; `store/mutate.ts`
  `ID_FORMATS` (~61) and `resetDomainState` (~218, composes the billing slice field by field);
  `store/appStore.ts` `AppState.billing`, `freshAppState`, `PERSIST_VERSION`.
- Selectors: `store/selectors.ts` `openAccRecs` (~241), `accpayInvoicesFor` (~649),
  `gstActivityFor`, `paymentHistoryFor` (~763, `serviceFeeAmount = received - authorised` at ~804).
- Seed: `domain/seed/history.ts` `buildHistory` (payee contact `XCH01`, ACCPAY at net ~265,
  disbursements), `domain/seed/billing.ts` `buildSeedBillingSlice` (seeded pre-payment pair at net
  ~204, `SeedBillingSlice`).
- UI: `apps/admin/screens/BillingMonitorScreen.tsx` (Payables run panel, `data-shot
  billing-payables-run`); `apps/admin/screens/InvoiceDocument.tsx` (money-state chips ~188, Xero
  rail `XeroReference` ~319); `apps/web/screens/AccountsScreen.tsx` (`AccountsSubTab`,
  `PaymentsTable` ~165-235) and `apps/web/routes.tsx` (`ACCOUNTS_SUB_TABS` ~28, `WebAccountsRoute`);
  `apps/demo/DemoXero.tsx` (`PairDetail` "Simulate payment and payout", `AccRecCard`, `AccPayCard`
  fee box `data-testid aa-service-fee`, `MoneyFlowCard` copy), `apps/demo/xeroPairView.ts`
  (`billNumber` derived as `${invoiceNumber}-P`, fee fields), `apps/demo/DemoControlPanel.tsx`
  (S3 and S4 scenario text; the payment and jobs cards as re-homed by Phase 14).
- Triggers: `src/shared/demoTriggers/registry.ts` (Phase 14). It imports from `src/store` and
  `src/domain` only, never `src/apps/*` or `src/shell/*`, so it cannot read the web persona from
  `shell/appConfig.ts` (`APP_CONFIG.web.persona`, fixed to Dr Souter); use the seed constant
  `ANAE.souter` instead.
- `store/xeroHandoff.ts` `resolveContactInto` (~81) is module-private today; step 2 exports it.
- Tests that assert the fee today: `domain/billing/agencyFee.test.ts`, `store/xeroHandoff.test.ts`
  (~70), `store/paymentActions.test.ts`, `store/payablesActions.test.ts`, `store/dashboard.test.ts`
  (~117-122), `store/seedBilling.test.ts`, `apps/demo/xeroPairView.test.ts` (~52-58),
  `apps/demo/DemoXero.test.tsx` (~45, ~85 `$144.76`), `apps/web/screens/AccountsScreen.test.tsx`,
  `visual/xero-pair.spec.ts` (~61 fee box, ~85 payment row).

## Work items

### Step 1 · the payable is the gross amount (session 1)

1. **A pure payable-release rule** (convention 9). Add `src/domain/billing/payableRelease.ts` with
   `payableReleasedFor(receivedCumulative, amountPayable)` returning
   `roundToCents(min(receivedCumulative, amountPayable))`, guarding zero and negative input. Export it
   from `domain/billing/index.ts`. Vitest: full payment releases the whole payable; half of $152.38
   releases exactly $76.19; three partials ($50.00, $50.00, $52.38) release exactly each amount
   cumulatively; an over-receipt clamps at the payable; zero releases zero. Satisfies US-10.2.1
   ("a part payment releases a payable for exactly the amount received; the remainder stays
   outstanding on the receivable").
2. **Remove the netting.** Delete `domain/billing/agencyFee.ts` and `agencyFee.test.ts` and the
   re-export. In `domain/types.ts` drop `grossAmount`, `serviceFeeRate` and `serviceFeeAmount` from
   `XeroAccPay` and re-document `amountPayable` as "equals the paired ACCREC's amountDue (FT-10.3:
   AA's fee is never deducted here)". In `store/xeroHandoff.ts` build the ACCPAY with
   `amountPayable: invoice.total` and drop the fee fields from the `xero.pairCreated` audit `after`.
   Rewrite the module comments in `xeroHandoff.ts`, `paymentActions.ts` and `payablesActions.ts` that
   describe the fee. Satisfies EP-10 ("paying a receivable in full releases the matching payable in
   full") and the RV-07 rework.
3. **Release exactly the amount received.** In `receivePayment` replace the `proRataAuthorised`
   call with `payableReleasedFor(newReceived, accPay.amountPayable)`, keeping the cumulative model,
   the idempotency key-set, the ACCPAY DRAFT to AUTHORISED flip and the `xero.accpayAuthorised`
   audit. Remove `proRataAuthorised` and its `store/index.ts` re-export (update its test imports in
   `paymentActions.test.ts` and `payablesActions.test.ts`). `runPayables` and `disbursePayable`
   keep paying `amountAuthorised - amountDisbursed`; `fullyPaidOut` now compares against the gross
   payable, which is correct as is. Satisfies US-09.2.1 (the webhook sets the linked ACCPAY to
   AUTHORISED for the US-10.2.1 amount) and US-10.2.1.
4. **Reseed the billing history.** In `domain/seed/history.ts` and `domain/seed/billing.ts` build
   every seeded ACCPAY with `amountPayable = total`; paid accounts authorise and disburse the full
   total, and their `Disbursement` rows carry the full total. The seeded pre-payment pair (BC0001)
   likewise. **Bump `PERSIST_VERSION`** by one. Update `store/seedBilling.test.ts` and add an
   invariant test: for every seeded pair, `accPay.amountPayable === accRec.amountDue` and
   `case.authorisedAmount === min(case.receivedAmount, amountPayable)`.
5. **Payment history without a fee.** In `store/selectors.ts` `paymentHistoryFor`, drop
   `serviceFeeAmount`, rename `netPayable` to `releasedAmount` (the case's `authorisedAmount`), keep
   the status logic. Update `store/dashboard.test.ts` so the invariant becomes
   `releasedAmount === grossReceived` for a fully paid row.
6. **UI and copy, step 1.**
   - `apps/web/screens/AccountsScreen.tsx` `PaymentsTable`: columns become Date received, Invoice,
     Patient, Payer, **Received by AA**, **Released to you**, **Paid to you**, Status. Replace the
     "illustrative AA service fee is deducted" caption with: "Everything AA receives for an invoice is
     released to you in full. AA's own fee is invoiced separately." (step 2 turns "invoiced
     separately" into a link to the AA fees tab).
   - `apps/demo/DemoXero.tsx`: remove the `aa-service-fee` box from `AccPayCard`; the ACCPAY money
     flow card reads "Simulated payable to the anaesthetist. This record tracks the full amount AA will
     disburse."; the `MoneyStat` "Net payable" becomes "Payable". `apps/demo/xeroPairView.ts` drops
     the fee fields from `accPay`.
   - The re-homed "Payment received (webhook)" triggers (`payment-full` / `payment-half` in
     `src/shared/demoTriggers/registry.ts`, or wherever Phase 14 put them): the result message
     narrates the US-09.2.1 steps in one line, for example "Webhook for XR0003: engine fetched the
     invoice, confirmed $76.19 received, found case BC0004 by its stored Xero ID and authorised the
     paired ACCPAY for exactly $76.19." (the gap's optional "visible fetch-and-check step"), and the
     description drops "proportionally".
   - `BillingMonitorScreen` Payables run copy: "A payable authorises for exactly what its ACCREC has
     received."
   - `apps/admin/screens/InvoiceDocument.tsx` money-state chips are unchanged (they already read the
     case), but check the "Part disbursed" chip against a half payment.
7. **Tests and shots for step 1.** Update `xeroHandoff.test.ts` (payable equals amount due, no fee
   fields), `paymentActions.test.ts` (a half payment authorises exactly half; two partials sum to the
   receivable; webhook then poll is still a no-op), `payablesActions.test.ts` (successive partials pay
   exactly what was received each run; fully paid out at the gross), `xeroPairView.test.ts` (S3 nib
   pair: `totalPayable` 152.38, no fee), `DemoXero.test.tsx` (the settlement message shows $152.38; no
   fee box), `AccountsScreen.test.tsx` (new columns), and `visual/xero-pair.spec.ts` (remove the fee
   box assertion; the payment row shows $152.38 received, released and paid). Case-insensitive grep
   of `src` and `visual` (`grep -riE`) for
   `serviceFee|agencyFee|AA_SERVICE_FEE|proRata|net to you|net payable|illustrative AA|authorised proportionally`:
   zero hits (`apps/admin/util.ts`'s unrelated "proportional grid" is why the bare word is not in
   the pattern).
8. **Re-green step 1 and patch the step-1 beats.** `npm run build`, `npm run build:pwa`,
   `npx vitest run`, `npm run shots`, all green. Patch the demo guide for step 1 (see "Demo guide
   updates", step-1 rows) so the guide is never stale if the phase pauses here. **Stop point:** tell
   the user step 1 is green so they can commit it before session 2.

### Step 2 · the AA fee invoice (session 2)

9. **InvoiceNumber and Reference on every Xero record** (US-09.1.1 acceptance criterion "Invoice
   identifiers"). Add `invoiceNumber` and `reference` to `XeroAccRec` and `XeroAccPay`. At handoff,
   the ACCREC gets `invoiceNumber = invoice.invoiceNumber` and the ACCPAY `${invoiceNumber}-P`
   (US-08.4.3); both get `reference = invoice.caseReference`. Seeds set the same fields.
   `xeroPairView.ts` reads the stored fields instead of deriving them. In `DemoXero.tsx`, both record
   cards show labelled **InvoiceNumber** and **Reference** meta items, with one caption on the pair:
   "InvoiceNumber is the unique key hospitals and insurers quote on remittances, so automated
   remittance matching keys on it. Reference is for internal tracing only; Xero does not enforce its
   uniqueness." The Admin invoice rail (`InvoiceDocument.tsx` `XeroReference`) shows the two stored
   Xero IDs (Xero InvoiceID and BillID) beside the numbers, matching the catalogue's
   admin-invoice-xero-ids image. Tests: handoff stores both fields; the `-P` suffix; Reference equals
   the case reference; `xeroNhi.test.ts` still passes.
10. **The fee model** (DM-22). In `domain/types.ts` add `AaFeeInvoice`: `id`, `invoiceNumber`,
    `reference` (its own id, the fee invoice's case reference), `anaesthetistId`, a `basis` snapshot
    (`rate`, `label`), `periodFromISO`, `periodToISO`, `lines` (a snapshot per covered collection:
    `receiptId`, the procedure `invoiceNumber`, `receivedAtISO`, `collectedAmount`),
    `collectedTotal`, `subtotal`, `gst`, `total`, `raisedAtISO`, `raisedBy` (`office` or
    `scheduled`), `accRecId`, `amountReceived`, `paidAtISO?`. It **is its own billing case**: it
    carries the ACCREC link and its money state itself, and lives in a new
    `billing.aaFeeInvoices` map, deliberately outside `billing.cases`. Every consumer of
    `billing.cases` (payables, GST activity, Overdue and aging, the monitor pipeline, `casesForList`,
    `openAccRecs`, the Invoices screen) assumes a Booking behind the case, and FT-10.3 says the fee is
    distinct from any procedure receivable and payable; Phase 36 folds both into ledger legs. Add
    `kind: 'procedure' | 'aaFee'` to `XeroAccRec` (required, so the compiler finds every creator);
    for `aaFee` the record's `invoiceId` holds the `AaFeeInvoice` id. Add `ID_FORMATS` kinds
    `aaFeeInvoice` (`AF`, pad 4) and `aaFeeInvoiceNumber` (`AA-FEE-2026-`, pad 4). Thread the new
    map through `AppState.billing` and the empty slice in `appStore.ts`, `freshAppState`,
    `resetDomainState` in `mutate.ts` and `SeedBillingSlice` in `seed/billing.ts`.
11. **Pure fee maths** (convention 9). Add `src/domain/billing/aaFee.ts`:
    - `AA_FEE_BASIS`: `{ rate: 0.05, collectedBasis: true, gstInclusive: true, label }`, the **only**
      place the rate lives, with `label` = "Demo assumption (OQ-02 open): 5% of the amounts AA
      collected for you since your last fee invoice, GST inclusive." (D1 default; change here only
      if D1 answers otherwise.)
    - `aaFeeFor(collectedTotal, basis)` returning `{ total, gst, subtotal }` with `total =
      roundToCents(collectedTotal * rate)` computed once on the sum (never per line), `gst = total
      * 3 / 23` rounded, `subtotal = total - gst`.
    - `draftAaFeeInvoice(receipts, basis)` over one anaesthetist's uncovered receipts: lines sorted by
      date then id, period from the earliest to the latest receipt, or `undefined` when empty.
    Vitest: 5% of $152.38 is $7.62; the fee is taken on the sum (three receipts whose per-line fees
    would round differently); GST split conserves to the cent; empty input gives `undefined`; same
    input gives identical output.
12. **Store actions** in new `src/store/aaFeeActions.ts`, every write through `mutate()`:
    - `uncoveredCollectionsFor(state)`: per anaesthetist, the `BillingReceipt` rows at or before the
      demo clock that no `AaFeeInvoice.lines` covers. Fee payments never create receipts, so they can
      never be fee-invoiced. Coverage is by receipt id, not by date window: a receipt the
      reconciliation poll mirrors late with a backdated `atISO` (the seeded Marsh missed webhook,
      dated 2026-06-24) lands on the next run even though an earlier fee invoice's period spans that
      date.
    - `generateAaFeeInvoices(api, actor)`: office actor (the product button) or the system actor
      `{ who: 'AA fee run (scheduled)', role: 'system', source: 'system' }` (the scheduled form);
      anaesthetists refuse. In one mutate, for each anaesthetist with uncovered collections: allocate
      the id and number, snapshot the draft, resolve the anaesthetist's existing Xero contact through
      the `anaesthetist:<reg>` cache key (reuse `resolveContactInto`, newly exported from
      `xeroHandoff.ts`, with the same payee `ContactSpec` shape `handoffCase` builds, so no duplicate
      contact), and create a `kind:'aaFee'` ACCREC (`amountDue = total`, stored
      `invoiceNumber` and `reference`) with no ACCPAY. Audit per invoice: `aaFee.invoiceRaised`
      (entity `aaFeeInvoice`) and `xero.feeAccRecCreated`. Idempotent: a second run with nothing new
      raises nothing and returns `{ raisedCount: 0 }` without mutating. Satisfies US-10.3.1 ("generates
      AA's fee invoice to each anaesthetist and tracks it") and FT-10.3.
    - `recordAaFeePayment(api, actor, { aaFeeInvoiceId, idempotencyKey })`: the anaesthetist pays AA
      in full (Xero side: a `PaymentIn` on the fee ACCREC, ACCREC `paid`; mirror: `amountReceived`,
      `paidAtISO`). Idempotent by key. No `BillingReceipt` (it is not the anaesthetist's income, so
      GST activity and future fee runs never see it). Widen `PaymentIn.source` with `'aaFee'` so the
      row is distinguishable from a procedure webhook. Actor
      `{ who: 'Xero payment (AA fee)', role: 'system', source: 'system' }`; audit
      `aaFee.paymentRecorded` (entity `aaFeeInvoice`). Time from the demo clock (`clockISO`).
    - Guards on the existing money paths: `receivePayment` refuses a `kind:'aaFee'` ACCREC with code
      `aaFeeInvoice`; `openAccRecs` excludes them (so the Control Panel's payment `indexPath` never lands on one);
      `runReconciliationPoll` skips payments on them before calling `receivePayment` (a fee
      `PaymentIn` never has a receipt, so without the skip every day advance would re-detect it); the
      archive job is unaffected (anaesthetist
      contacts are organisation type). Vitest for every guard, for one-receipt-one-fee-invoice,
      per-anaesthetist grouping, a receipt after a run landing on the next run, and the office,
      system and anaesthetist actors.
13. **Selectors.** `aaFeeInvoicesFor(state, anaesthetistId)` (newest first, with a derived status
    `unpaid | paid`) and `allAaFeeInvoices(state)` read the billing mirror only, never `state.xero`
    (the Phase 10 convention 9 rule for app money views). `pendingAaFeeSummary(state)` gives the
    Billing monitor's preview: anaesthetists with uncovered collections, their collected total and
    the fee the next run would raise.
14. **Seed** (determinism, convention 5). Add Dr Souter's fee history in `domain/seed/history.ts`
    (or a sibling `seed/aaFees.ts` called from `buildSeedBillingSlice`), in the `H` id namespace:
    `AA-FEE-2026-H01` covering the May collections (Riley $900.00 and the guardian account $540.00,
    fee $72.00), raised 2026-06-01 and **paid** 2026-06-05, and `AA-FEE-2026-H02` covering the June
    collection (Mills $480.00, fee $24.00), raised 2026-07-01 and **unpaid**. Each gets a
    `kind:'aaFee'` ACCREC against payee contact `XCH01`; H01 gets its `PaymentIn`. The July
    collections (the two paid July accounts and the BC0001 pre-payment) stay uncovered, so the first
    live run has something to raise. Counters continue past the seeded ids. **Bump
    `PERSIST_VERSION`** again. Extend `seedBilling.test.ts`: two builds deep-equal, no seeded receipt
    covered twice, `resetDomainState` restores the fee map.
15. **Admin Billing monitor: "AA fee invoices" panel** (`BillingMonitorScreen.tsx`, beneath Payables
    run, `data-shot="billing-aa-fee-invoices"`). A header and the preview line from
    `pendingAaFeeSummary` ("N anaesthetist(s) have $X collected since their last fee invoice. The
    next run raises $Y in fees.", pluralised from the count; at seed only Dr Souter has uncovered
    collections), the basis label as a small neutral "Demo assumption" pill with the label
    text, and a teal **Generate AA fee invoices** button (an unbadged product office action, like Run
    payables; disabled with the reason when nothing is uncovered). A result line after a run. A table
    of every fee invoice: Number (mono), Anaesthetist (`drSurname` from `shared/format.ts`), Period,
    Collected, Fee (incl GST), Raised, Status pill (Paid with date on success tint, Unpaid neutral).
    A row expands inline to its covered collections (procedure invoice number, date received, amount).
    The Billing monitor intro copy gains one sentence: "AA's own fee is invoiced to each anaesthetist
    separately; it is never deducted from a payable." Satisfies US-10.3.1 and "Admin shows it paid or
    unpaid".
16. **Web Accounts: "AA fees" sub-tab** (US-10.3.2). Add `'fees'` to `AccountsSubTab` and
    `ACCOUNTS_SUB_TABS` (`/web/accounts/fees`), a fourth `SubTabButton` "AA fees", and an
    `AaFeesTable` (`data-shot="web-accounts-aa-fees"`): Invoice (mono), Raised, Period, Collections
    (count), Collected, Fee, GST, Status pill (Paid with date, or Unpaid). Footer: total unpaid fees.
    A caption carries the basis label. `?invoice=AA-FEE-...` highlights a row as the Payments tab
    does. Fee invoices show as soon as they are raised (the next-day rule applies only to procedure
    ACCPAY rows). The Payments caption from item 6 now links "invoiced separately" to this tab.
    Mobile Balances is unchanged (see Out of scope).
17. **Xero simulation: the fee pair.** `xeroInvoicePairViews` gains a `kind` and an `aaFee` branch:
    lines from the fee invoice snapshot, no `accPay`, engine context `aaFeeInvoiceId` and
    `anaesthetistId`, and `incomplete` false when the fee invoice and contact exist. `InvoicesTable`
    shows an "AA fee" chip and `·` in the ACCPAY columns. `PairDetail` for a fee ACCREC: one money
    flow card "ACCREC · AA FEE" from the anaesthetist to **Anaesthesia Associates**, the ACCREC card
    with InvoiceNumber and Reference, and in place of the ACCPAY card a short note: "No payable. This
    is AA invoicing its own fee to the anaesthetist, separate from any procedure receivable and
    payable." The "Simulate payment and payout" button is hidden; a teal **Record fee payment**
    button (the trigger body from Demo triggers, item 2) takes its place, disabled once paid, and a
    "View in Dr Souter's account" link opens `/web/accounts/fees?invoice=<number>` for the persona.
    `data-shot="xero-aa-fee-pair"`.
18. **Register the demo triggers** in the Phase 14 registry (see Demo triggers), with bodies in
    `src/store` or `src/shared` so the PWA purity test holds, and add the `when` guard to the
    re-homed payment triggers. Vitest in the registry's test: each new entry matches only its
    routes, "Record fee payment" is invisible on a procedure pair, the payment triggers are invisible
    on a fee pair, and every disabled reason fires.
19. **Tests and shots for step 2.** Vitest for items 9 to 14 as listed, plus a component test for
    the AA fees tab (rows, pills, focus highlight) and the Billing monitor panel (button disabled
    state, a run adds rows). Playwright: extend `visual/xero-pair.spec.ts` (or add
    `visual/aa-fee.spec.ts`) through generate, the fee pair, Record fee payment and the web AA fees
    tab, with the three `data-shot` hooks. Copy sweep: no en or em dashes in any new string, and
    grep confirms `0.05` appears only in `aaFee.ts` and its test.
20. **Re-green step 2:** `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots`.

## Demo triggers

All three are registered through the Phase 14 registry with `surfaces: bar`, a `run(api, ctx)` that
acts on the entity in the URL or the published context, and a disabled state. None is added to the
Control Panel page; it lists them under their screens automatically.

1. **"Run scheduled AA fee invoicing"** · screen `/admin/billing` · runs `generateAaFeeInvoices` as the
   scheduled system actor, the stand-in for the unscheduled (OQ-02, OQ-47) fee run. Disabled when
   `pendingAaFeeSummary` is empty. The product form of the same action is the in-page teal
   **Generate AA fee invoices** button on the Billing monitor (office actor, unbadged, not a demo
   trigger).
2. **"Record fee payment"** · screen `/demo/xero/invoices/:accRecId`, with a `when` that shows it
   only when that ACCREC is `kind:'aaFee'` (it never appears on a procedure pair) · calls
   `recordAaFeePayment` for its fee invoice (Dr Souter's bank transfer lands in AA's Xero). Disabled
   when the fee invoice is paid ("Already paid"). The fee pair detail's in-page button uses the same
   body.
3. **"Dr Souter pays this AA fee invoice"** · screen `/web/accounts/fees` · pays the `?invoice=`
   focused fee invoice, else the oldest unpaid one for `ANAE.souter` (the web persona is fixed to Dr
   Souter, and the registry may not import `shell/appConfig.ts`), so the paid and unpaid pills can be
   shown without leaving the web app. The Phase 14 `ctx` carries the pathname and route params but
   not the query string, so the AA fees tab publishes its focused number with
   `useDemoTriggerContext` under a new `'webAccounts.focusInvoice'` key (add it to
   `DemoContextValues`). Disabled when none is unpaid.

**Re-pointed:** the `payment-full`, `payment-half` and `payment-replay` triggers Phase 14 re-homed now
release exactly the amount received. On `/demo/xero/invoices/:accRecId` they gain a `when` that hides
them on a `kind:'aaFee'` pair (a fee payment is "Record fee payment", never a procedure webhook), and
`receivePayment`'s `aaFeeInvoice` refusal backs that up. The Control Panel's `indexPath` for them uses
`openAccRecs`, which already excludes fee ACCRECs.

**PWA equivalent:** none needed. This phase changes no mobile screen, and no mobile beat waits on the
office or a backend event; the fee view is web-only (US-10.3.2's screenshot and the verifier put it on
web). Confirm the three entries declare `surfaces: bar` so the PWA demo-actions sheet does not list
them, and that `npm run build:pwa` still passes the purity check.

## Out of scope

- The internal ledger (DM-18, Phase 36). `AaFeeInvoice` stays a self-contained case beside
  `billing.cases`; Phase 36's ledger promotion must carry `billing.aaFeeInvoices` into its receivable
  legs and the imbalance indicator.
- A payment day or weekly accounting cycle (OQ-47): no "Close accounting week" action; the payables
  and fee runs stay on demand.
- Hospital dispute fallback (OQ-19): no behaviour.
- Part payment of a fee invoice, fee credit notes or fee voids (Phase 39 builds credit and rebill for
  procedure invoices), and netting a fee against a payout.
- A printable AA fee invoice document and fee invoices on the Admin Invoices screen; the Billing
  monitor panel is the Admin home for now.
- A mobile fee view on Balances (US-10.3.2 lists "mobile + web" but its only screenshot and the
  verified gap are web); record it as an open handoff item for the owner (no later phase plans it;
  Phase 38 is web only).
- Invoice presentation (Phase 22): procedure invoices move to "issued in the anaesthetist's name
  with AA as agent". The AA fee invoice is AA's own invoice in AA's name; leave its wording alone and
  note it in the handoff so Phase 22 exempts it.
- Buyer-created ACCPAY wording (US-09.1.4, Phase 22), the Xero outage queue and voids made in Xero
  (Phase 37), bulk remittance (US-10.2.4, Phase 37).
- The stale catalogue screenshots (US-10.3.1 `simulator-service-fee.png`, US-10.3.2
  `web-fee-in-payments.png`, US-10.2.1's part-payment image): the catalogue is not edited here; list
  them in the PROGRESS handoff for the owner to re-shoot.

## Manual test checklist

- [ ] Reset. Xero simulation → Invoices → any seeded procedure pair: the ACCPAY payable equals the
      ACCREC amount due; no fee box anywhere; both cards show InvoiceNumber and Reference, the ACCPAY
      number ends `-P`.
- [ ] S3: authorise both Mon 20 Jul Lists, open AA-2026-0005 (nib, $152.38): the payable to Dr
      Souter is $152.38. Simulate payment and payout: $152.38 disbursed; web Accounts → Payments shows
      $152.38 received, released and paid to you, with no AA fee or Net to you column.
- [ ] S4 Beat 5: pay half of Hemi Walker's St George's invoice via the re-homed webhook trigger: the
      ACCPAY authorises exactly half the amount received to the cent; Run payables disburses exactly
      that; pay the balance and run again: the total disbursed equals the invoice total, never more.
- [ ] Replay the last webhook: no change. Advance the day: the seeded missed webhook is caught by
      the poll and releases its full amount.
- [ ] Admin → Billing monitor: the AA fee invoices panel shows AA-FEE-2026-H01 Paid and H02 Unpaid,
      the demo-assumption label, and a preview of the next run. Generate AA fee invoices raises one
      AA-FEE-2026-0001 for Dr Souter covering the July collections (including AA-2026-0005 if S3 was
      paid); a second click is disabled with its reason.
- [ ] The harness bar on the Billing monitor shows "Run scheduled AA fee invoicing" only there; after
      a new payment it raises the next fee invoice, audited as the scheduled system actor.
- [ ] Xero simulation: the fee ACCREC is listed with an AA fee chip against Dr Souter's existing
      contact (no duplicate contact), no ACCPAY; on the fee pair the bar shows "Record fee payment"
      and none of the Payment received triggers; Record fee payment marks it paid; on a procedure pair
      "Record fee payment" is absent. Advance the day: the poll does not touch the fee payment.
- [ ] Web → Accounts → AA fees: the new invoice shows Unpaid, then Paid with its date after the
      payment; "Dr Souter pays this AA fee invoice" in the bar works on this tab only; the
      `?invoice=` link from the Xero sim highlights the row.
- [ ] GST activity and Overdue do not change when a fee invoice is raised or paid.
- [ ] Admin → Audit shows `aaFee.invoiceRaised`, `xero.feeAccRecCreated` and `aaFee.paymentRecorded`
      with the right who, role and source.
- [ ] The admin invoice rail for AA-2026-0005 shows the stored Xero InvoiceID and BillID.
- [ ] The PWA demo-actions sheet lists none of this phase's triggers.
- [ ] No new app copy contains an en or em dash; the only action colour is teal.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots` green.

## Demo guide updates

- **Step 1 (patched in session 1):**
  - `docs/demo-guide/03-demo-script.md` S3 Beat 2: the ACCPAY tracks the full amount AA will pay Dr
    Souter; nib owes $152.38 and the payable to Dr Souter is $152.38; drop the illustrative-fee lines.
    S3 Beat 3: "nib pays $152.38 into AA, then AA pays the same $152.38 to Dr Souter"; the Payments row
    shows $152.38 received, released and paid to you. S4 Beat 5: "A partial payment authorises a
    payable for exactly the amount received"; Expected: each run pays exactly what arrived.
  - `04-presenter-cheat-sheet.md` (~116-123): the flow line becomes "Payer -> ACCREC -> AA account
    -> ACCPAY (full amount) -> Anaesthetist"; replace the 5% and proportional bullets.
  - `02-workflows-and-handoffs.md` (~384-389): ACCPAY is the full amount; step 5 "for exactly the
    amount received".
  - `master-demo-guide.html`: the same sections (~724-725 money flow, ~888-902 S3, ~935-936 S4 Beat 5,
    ~1040-1045 cheat sheet).
  - `DemoControlPanel.tsx` S3 and S4 scenario messages if they mention the fee or proportional
    payment.
- **Step 2 (patched in session 2):**
  - S3 gains **Beat 4: AA's own fee** (Admin → Billing monitor → Generate AA fee invoices → the new
    AA-FEE invoice for Dr Souter, noting AA-2026-0005's $152.38 is one of its covered collections
    (about $7.62 of fee at the assumed 5%; the fee is taken once on the sum) →
    Xero simulation fee pair → Record fee payment → web Accounts → AA fees shows Paid). Say: the fee
    is AA invoicing the anaesthetist, never a deduction; the basis is a demo assumption pending AA
    (OQ-02). Read the fee invoice's actual total from the built app, do not compute it by hand.
  - The cheat sheet gains a one-line AA fee flow ("AA -> AA-FEE invoice (ACCREC) -> Anaesthetist
    pays AA") and the basis caveat; the workflows doc gains a short "AA fee invoicing" workflow
    (trigger, steps, what the anaesthetist sees); `01-personas-and-responsibilities.md` adds "raise AA
    fee invoices" to the office's money duties.
  - `master-demo-guide.html` mirrors all of the above; the S3 Control Panel scenario message mentions
    Beat 4.
  - **Milestone consistency read** (16 is a milestone phase): read `master-demo-guide.html` end to
    end against the run sheet, cheat sheet and workflows; every figure and button label matches the
    built app.

## Adversarial review (after build)

After the manual test checklist and `npm run build` / `npm run build:pwa` / `npx vitest run` /
`npm run shots` are green, and before writing the PROGRESS entry, run the standard adversarial
review-and-fix pass (PROGRESS convention 18): fan out independent Opus review subagents for
**quality**, **bugs/correctness** and **plan adherence** (scale up, this is a money phase: add a
fourth on **money conservation and seed determinism**). This session then verifies every finding
against the catalogue and the code, fixes the confirmed ones with a test where a bug had none,
re-greens, and records the pass. Do not re-raise anything settled in the Decisions log, except the
2026-07-29 fee ruling this phase explicitly supersedes.

**Steer this phase's reviewers at:**
- Money conservation on every procedure pair, seeded and live: `amountPayable === amountDue`;
  `authorised === min(received, payable)` to the cent after any sequence of partials, replays and
  poll catches; `disbursed <= authorised`; no residual fee maths anywhere (grep `serviceFee`,
  `agencyFee`, `0.95`, `proRata`).
- Fee isolation: a fee invoice or its ACCREC never reaches payables, GST activity, Overdue or aging,
  the monitor pipeline rows, the payment webhook triggers, the reconciliation poll, the archive job, `casesForList` or the Invoices
  screen; `receivePayment` refuses a fee ACCREC; a fee payment creates no `BillingReceipt`.
- Coverage: each receipt lands on at most one fee invoice; a rerun is a no-op; grouping is per
  anaesthetist; only receipts at or before the demo clock; the fee is computed on the sum, once.
- The basis lives in one labelled constant (`AA_FEE_BASIS`), its label shows on every surface that
  shows a fee (Admin panel, web AA fees, Xero sim), and D1's status is reflected honestly.
- US-09.1.1: `invoiceNumber` and `reference` are stored on both Xero records (not derived), the
  ACCPAY number carries `-P`, the fee ACCREC carries its AA-FEE number, and no NHI reaches any Xero
  record (`xeroNhi.test.ts`).
- Determinism and persistence: seed builds deep-equal, `PERSIST_VERSION` bumped for each seed change,
  `resetDomainState` and `freshAppState` both carry `aaFeeInvoices`; audit entries carry the right
  actor (office button vs scheduled system run vs Xero payment).
- Triggers: the three entries show only on their screens, declare `surfaces: bar`, have working
  disabled states, and their bodies live in `src/store` or `src/shared` (PWA purity).
- Design and copy: teal-only actions, pills on semantic tokens not status colours, mono tabular
  amounts, no en or em dashes, the demo guide figures match the running app.

## PROGRESS.md updates

- Catch-up status row for Phase 16 and a phase entry (template in PROGRESS.md), recording the drift
  check result, D1's status, where Phase 14 had re-homed the webhook trigger, the step-1 stop point,
  the manual checklist item by item, and the review pass.
- **Decisions log:**
  - Supersede **2026-07-29 "Xero money flow and illustrative AA service fee"**: the payable equals
    the receivable and a payment releases exactly the amount received (FT-10.3, US-10.2.1). Note that
    it restores the 2026-07-24 `D-payee-amount` outcome as a catalogue rule.
  - The AA fee basis: the D1 default (or the owner's answer), held in `AA_FEE_BASIS` and labelled in
    the UI while OQ-02 is open.
  - Why `AaFeeInvoice` is its own case outside `billing.cases`, and the `XeroAccRec.kind`
    discriminator.
  - Fee payments are not the anaesthetist's income: no `BillingReceipt`, never in GST activity.
- **Handoff notes:** Phase 36 must fold `billing.aaFeeInvoices` into the ledger; the stale
  catalogue screenshots listed under Out of scope; the mobile fee view as an open item for the owner;
  Phase 22 must exempt the AA fee invoice from the "anaesthetist's name, AA as agent" wording; add a
  one-line "superseded by catch-up Phase 16" note where `docs/prototype-build/REQUIREMENTS.md`,
  `prototype-review/08-xero-integration.md` and `prototype-review/12-RFP-CONFLICTS-AND-CHOICES.md`
  still state the 5% deduction.
