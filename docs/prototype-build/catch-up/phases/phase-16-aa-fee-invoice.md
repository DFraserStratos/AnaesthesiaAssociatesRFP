# Phase 16 · AA fee as its own monthly invoice

**Requirements covered:**
[EP-10](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/EP-10.md),
[FT-10.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-10.3.md) (Verify),
[US-10.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-10.2.1.md),
[US-10.3.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-10.3.1.md) (Verify),
[US-10.3.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-10.3.2.md),
[US-10.3.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-10.3.3.md) (Verify, new),
[US-09.1.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-09.1.1.md),
[US-09.3.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-09.3.1.md) (now Confirmed);
[DM-26](../analysis/domain-model-delta.md#dm-26);
[RV-07](../analysis/reverse-check.md) (AA service fee netted from the payable).
Answered and built: [OQ-02](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-02.md)
(owner decision **D1**: a monthly fee invoice per anaesthetist, fixed charges plus $ per BCTI) and
[OQ-30](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-30.md) (no personal
information in Xero).
Still open, built as noted: [OQ-60](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-60.md)
(what the per-BCTI charge counts, the fixed schedule, how the fee is paid: its recommendation, labelled
provisional), [OQ-29](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-29.md)
(BCTI granularity: one per receivable invoice, labelled provisional),
[OQ-47](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-47.md) (payment day
and cycle: not modelled).
Left this phase: US-09.2.1 (re-graded Matches; the webhook amounts still change with step 1, but no
work is planned against it) and OQ-19 (answered: an AA-side error is credited and reissued, which is
Phase 39's concern; anything else stays outstanding, which is today's behaviour).
**Depends on:** Phase 15a, and through it Phases 14 and 15: the screen-contextual trigger registry,
`useDemoTriggerContext` and the re-homed "Payment received (webhook)" triggers (14); Card becomes
Booking, so every `cardId`, `casesForCard`, "Card" string and audit entity type named below is its
post-15 Booking equivalent (15); and the warning routine (15a), which runs first so the "After 16"
milestone includes warnings. This phase registers no warning rule.
**Estimated:** 2 sessions. Session 1 is step 1 (fee removal), plus the two small Xero simulator items
that share its files (work items 9 and 10: InvoiceNumber and Reference stored on both records, and the
settled NHI callout), re-greened and handed back on its own. Session 2 is step 2 (fee settings, the
BCTI count and the monthly fee invoice run) plus the review pass and the PROGRESS entry. Session 2 is
the heavier one; if session 1 runs out of room, items 9 and 10 open session 2.

## Goal

The money story the catalogue now tells, in two steps that each leave the app green and demoable.

**Step 1: the payable is the gross amount.** Stop netting the illustrative 5% AA fee off the ACCPAY.
The payable equals the receivable, and a payment releases a payable for exactly the amount received
(US-10.2.1, which merged US-10.2.2): a half payment of $152.38 releases $76.19, not 95% of it. The
seeded billing history is rebuilt on that basis, the Xero simulator loses its fee block, the web
Payments table loses its "AA fee" and "Net to you" columns, and the S3 figures are re-baselined
($152.38 is now what Dr Souter is paid; the $7.62 and $144.76 figures disappear). While the Xero
simulator is open, every Xero record stores the engine's invoice number in `InvoiceNumber` and the
case reference in `Reference` (US-09.1.1), and the simulator's NHI callout is rewritten as the settled
rule (US-09.3.1, OQ-30 answered: no personal information in Xero, only the hidden ID that links back).

**Step 2: AA's fee is its own monthly invoice (D1, OQ-02 answered).** An Admin **AA fee settings**
page holds the fixed fee items (several may make up the fixed fee) and the charge per BCTI
(US-10.3.3). An Admin **AA fee invoices** screen has a month picker and a **Run monthly fee
invoices** button that raises one AA-FEE invoice to each active anaesthetist for the month (FT-10.3,
US-10.3.1): the fixed items plus the per-BCTI charge times the number of BCTIs issued to them that
month, for example $500 + $5 x 40 = $700. Each fee invoice has its own `AA-FEE-2026-####` number,
is its own billing case, and has a simulated Xero ACCREC against the anaesthetist's existing Xero
contact, with no ACCPAY behind it (it is AA charging its own fee, not money passing through). The
invoice snapshots the settings it used, so a rate change applies to the next run only.

**The BCTI count has one home.** BCTIs for an anaesthetist in a month are counted by one pure,
tested function over one list of BCTI records, and nothing else counts them. The plan's provisional
granularity is one BCTI per receivable invoice (its ACCPAY, the same value as the receivable: the
transcript's "per transaction"), counted once against the anaesthetist who did the procedure
(OQ-60's recommendation). The catalogue also says "one BCTI per procedure" (US-09.1.4 note, OQ-29),
which cannot hold together with "the same value as its receivable" for an invoice with several
Procedures; both points are labelled provisional in that one place. Later phases that add invoices
(22, 36, 39, 39b) feed the same record list and keep this function the only count.

Admin and a new web **Accounts → AA fees** tab show each fee invoice paid or unpaid (US-10.3.2).
This is the corrected payables story for the "After 16" milestone.

## Before you start: drift check

1. Run the catalogue diff for this phase's items and open questions against the plan's baseline:

   ```
   git diff 501b0b8 -- "docs/discovery-reference/Updated Requirements/catalogue" "docs/discovery-reference/Updated Requirements/domain-model.md"
   ```

   Read the hunks (if any) for EP-10, FT-10.3, FT-10.2, US-10.2.1, US-10.3.1, US-10.3.2, US-10.3.3,
   US-09.1.1, US-09.1.4 (the BCTI note), US-09.3.1, US-08.4.3 (the `-P` suffix rule this phase
   relies on), US-08.3.1 (ledger pair), US-10.2.6 (period BCTI approval, Phase 39a), OQ-02, OQ-60,
   OQ-29, OQ-30, OQ-47, and the domain-model lines on the AA fee (the "Payment to anaesthetist
   implied a fee deducted" row, "AA fee invoices ... are separate ledger items, raised by a monthly
   fee invoice run", the BCTI line above it, and the glossary entry).
2. If an item changed, re-read it in full and adjust the work items before building. If an item is
   now Retired or Future, drop it from this phase and say so in the PROGRESS entry. A new item on
   this surface joins this phase only if it is small and Confirmed; otherwise record it for Phase 36
   or 39a.
3. **If OQ-60 has been answered since 501b0b8**, build the answer in place of the recommendation.
   Only three places change: the BCTI record rule (`bctiRecords`, work item 13), the count function
   (`bctisFor`, work item 12) and the settings shape (work item 11, for example fixed items per
   anaesthetist). If the answer is "the fee nets against payables", stop and tell the owner: that
   contradicts FT-10.3 ("distinct from any procedure's receivable and payable") and step 1. If
   OQ-29 or AA's accountant has settled BCTI granularity as **one per procedure**, change only
   `bctiRecords` and re-baseline the `$700` seed trigger, S3 Beat 4 and the cheat sheet in the same
   session.
4. **Open questions still open are safe as follows.** OQ-60: the recommendation (each BCTI counted
   once, against the anaesthetist who did the procedure; the fee is a separate receivable the
   anaesthetist pays), plus the plan's reading of its paid-only point: issued BCTIs count, paid or
   not, because counting each once against the doer already stops a moved Booking being charged
   twice (the recommendation does not say paid only). Labelled provisional in the Admin fee screen's
   caption and in one code comment beside `bctisFor`. The fixed schedule is unknown: seed
   demo-plausible items labelled as a sample (work item 15). OQ-29: one BCTI per receivable invoice,
   labelled provisional beside `bctiRecords`. OQ-47: not modelled; the fee run is a monthly office
   action for a chosen month, and nothing in the copy names Tuesday, Wednesday, the 20th or a weekly
   cycle.
5. Confirm Phases 14, 15 and 15a are done: the registry (`src/shared/demoTriggers/`, entries in
   `registry.ts`) and `useDemoTriggerContext` exist, the Control Panel's "Payment received (webhook)"
   and "Automated jobs" triggers have been re-homed (Phase 14 plans them as `payment-full`,
   `payment-half` and `payment-replay` on `/admin/invoices/:invoiceId` and
   `/demo/xero/invoices/:accRecId`, and `run-reconciliation-poll` / `run-archive-job` on the Billing
   monitor and Xero sim; note any difference), the Booking rename has landed, and 15a's warning
   routine and Admin to-do list are in place. Note the current `PERSIST_VERSION` (13 at the snapshot;
   14, 15 and 15a may have bumped it).
6. Record the result (changed items, OQ-60 and OQ-29 status, where 14 re-homed the webhook trigger)
   in the PROGRESS entry.

## Reference

**Design (convention 17).** [Design Language.dc.html](../../../design/Design%20Language.dc.html) is
the token source: teal `#0D6E63` for "Run monthly fee invoices", "Save settings" and "Record fee
payment", pill radius 999 for Paid and Unpaid pills (semantic success and neutral tokens, never the
six schedule status colours), Spline Sans Mono with tabular-nums for every amount, count and number,
crimson nowhere except the existing nav and avatars.
[Web Dashboard.dc.html](../../../design/Web%20Dashboard.dc.html) is the layout reference for the web
app's panels and tables; the Accounts sub-tab extends its anatomy. No mockup covers Accounts, the
Billing monitor, the new Admin fee screens or the Xero simulator, so extend the existing screens' own
patterns (the Billing monitor's panels and `tableChrome.ts`, Master data's "Xero & archiving"
settings card), do not invent a new visual language.

**Catalogue and analysis.**
- Catalogue items above, plus [US-08.4.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.4.3.md)
  (unique numbers; the payable carries the receivable's number with `-P`),
  [US-09.1.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-09.1.4.md)
  (the BCTI note), the meeting note
  `catalogue/notes/2026-10-01-aa-meeting-with-greg.md` (#1, #14, #41, #54) and
  [domain-model.md](../../../discovery-reference/Updated%20Requirements/domain-model.md) (AA fee rows).
- [GAP-ANALYSIS.md](../GAP-ANALYSIS.md): Summary theme 7 ("Money model: ledger, fee, corrections"),
  the open-question bullet on OQ-42, OQ-47, OQ-60, OQ-71, OQ-72 and OQ-29, and the S3 and S4
  demo-impact bullets; per-gap detail in [epics/EP-10.md](../epics/EP-10.md) (read the header note
  first; FT-10.3, US-10.2.1, US-10.3.1 to US-10.3.3) and [epics/EP-09.md](../epics/EP-09.md)
  (US-09.1.1, US-09.3.1).
- [analysis/domain-model-delta.md](../analysis/domain-model-delta.md#dm-26) DM-26 (and DM-22 for the
  BCTI cardinality note and the ledger this phase does not build);
  [analysis/reverse-check.md](../analysis/reverse-check.md) RV-07.
- [analysis/prototype-map-store-seed.md](../analysis/prototype-map-store-seed.md) section 4 (money
  pipeline), [prototype-map-admin.md](../analysis/prototype-map-admin.md) section 7 (Billing
  monitor) and the Master data section, [prototype-map-apps-mobile-web.md](../analysis/prototype-map-apps-mobile-web.md)
  (Accounts), [prototype-map-shell-demo-pwa.md](../analysis/prototype-map-shell-demo-pwa.md) 5.1 and
  5.2 (Control Panel payment card, Xero simulation).
- PROGRESS.md Decisions log: **2026-07-29 "Xero money flow and illustrative AA service fee"** (this
  phase supersedes it) and 2026-07-24 Phase 10 reading (2) `D-payee-amount` (payable equals the
  collection; this phase restores it as the catalogue rule, not a reading).

**Code entry points (paths under `aa-prototype/src/`, names as at the snapshot).**
- Fee maths to remove: `domain/billing/agencyFee.ts` (`AA_SERVICE_FEE_RATE`, `aaServiceFeeFor`),
  `agencyFee.test.ts`, the re-export in `domain/billing/index.ts:7`.
- Types: `domain/types.ts` `Invoice` (~662, `raisedAtISO`), `BillingCase` (~697), `BillingReceipt`
  (~742), `XeroAccRec` (~769, no number, reference or kind today), `XeroAccPay` (~780,
  `grossAmount`, `serviceFeeRate`, `serviceFeeAmount`, net `amountPayable`), `PaymentIn`
  (`source: 'webhook' | 'poll'`), `DemoSettings` (~886, home of `contactArchiveInactivityDays`).
- Store: `store/xeroHandoff.ts` `handoffCase` (~153; ACCPAY built from `aaServiceFeeFor` at ~234,
  audit `xero.pairCreated` ~270, module-private `resolveContactInto` ~81, payee key
  `anaesthetist:<reg>`); `store/paymentActions.ts` `receivePayment` (~78; pro-rata
  `proRataAuthorised`, re-exported from `store/index.ts`); `store/payablesActions.ts`
  `payablesDue`, `runPayables`, `disbursePayable`; `store/reconciliationPoll.ts`;
  `store/archiveActions.ts`; `store/demoSettingsActions.ts` (`setArchiveWindowDays`, the pattern for
  an audited settings write); `store/mutate.ts` `ID_FORMATS` (~61) and `resetDomainState` (~218);
  `store/appStore.ts` `AppState.billing`, `freshAppState`, `PERSIST_VERSION` (~130).
- Selectors: `store/selectors.ts` `openAccRecs` (~241), `accpayInvoicesFor` (~649),
  `gstActivityFor`, `paymentHistoryFor` (~763, `serviceFeeAmount = received - authorised` at ~804).
- Seed: `domain/seed/history.ts` `buildHistory` (Dr Souter only, `H` id namespace, payee contact
  `XCH01`, ACCPAY at net ~265, raised dates per row ~101-118), `domain/seed/billing.ts`
  `buildSeedBillingSlice` (pre-payment pair BC0001), `domain/seed/cast.ts` `ANAE` (14 anaesthetists).
- UI: `apps/admin/screens/BillingMonitorScreen.tsx` (Payables run panel ~124,
  `data-shot billing-payables-run`); `apps/admin/screens/InvoiceDocument.tsx` (money-state chips
  ~188, Xero rail `XeroReference` ~319); `apps/admin/screens/MasterData.tsx` (`XeroArchivingView`
  ~476, the settings-card pattern; its entity nav is local state, not a URL, which is why the fee
  settings get their own route); `apps/admin/AdminApp.tsx` (`sectionForPath`: any
  `/admin/billing/...` path keeps the Billing nav active); `apps/admin/routes.tsx`
  (`AdminBillingRoute` ~193) and `router.tsx` (~102, `<Route path="billing">`);
  `apps/web/screens/AccountsScreen.tsx` (`AccountsSubTab`, `PaymentsTable` ~165-235) and
  `apps/web/routes.tsx` (`ACCOUNTS_SUB_TABS` ~28, `WebAccountsRoute` ~130);
  `apps/demo/DemoXero.tsx` (NHI `Callout` ~56-61 `shot="xero-nhi-policy"`, `PairDetail` "Simulate
  payment and payout", `AccRecCard`, `AccPayCard` fee box `data-testid aa-service-fee`,
  `MoneyFlowCard` copy, `Callout` tones `warn | info` ~657), `apps/demo/xeroPairView.ts`
  (`billNumber` derived as `${invoiceNumber}-P` ~133, fee fields), `apps/demo/DemoControlPanel.tsx`
  (S3, S4 and S5 scenario text).
- Triggers: `src/shared/demoTriggers/registry.ts` (Phase 14). It imports from `src/store` and
  `src/domain` only, never `src/apps/*` or `src/shell/*`; use seed constants (`ANAE.rutherford`,
  `ANAE.souter`) where an entry is seed-scoped.
- Tests that assert the fee today: `domain/billing/agencyFee.test.ts`, `store/xeroHandoff.test.ts`
  (~70), `store/paymentActions.test.ts`, `store/payablesActions.test.ts`, `store/dashboard.test.ts`
  (~117-122), `store/seedBilling.test.ts`, `store/xeroNhi.test.ts` (must keep passing),
  `apps/demo/xeroPairView.test.ts` (~52-58), `apps/demo/DemoXero.test.tsx` (~45, ~85 `$144.76`),
  `apps/web/screens/AccountsScreen.test.tsx`, `visual/xero-pair.spec.ts` (~61 fee box, ~85 payment
  row).

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
   AA's fee is its own monthly invoice, never deducted here)". In `store/xeroHandoff.ts` build the
   ACCPAY with `amountPayable: invoice.total` and drop the fee fields from the `xero.pairCreated`
   audit `after`. Rewrite the module comments in `xeroHandoff.ts`, `paymentActions.ts` and
   `payablesActions.ts` that describe the fee. Satisfies EP-10 ("paying a receivable in full
   releases the matching payable in full") and the RV-07 rework.
3. **Release exactly the amount received.** In `receivePayment` replace the `proRataAuthorised`
   call with `payableReleasedFor(newReceived, accPay.amountPayable)`, keeping the cumulative model,
   the idempotency key-set, the ACCPAY DRAFT to AUTHORISED flip and the `xero.accpayAuthorised`
   audit. Remove `proRataAuthorised` and its `store/index.ts` re-export (update its test imports in
   `paymentActions.test.ts` and `payablesActions.test.ts`). `runPayables` and `disbursePayable`
   keep paying `amountAuthorised - amountDisbursed`; `fullyPaidOut` now compares against the gross
   payable, which is correct as is. Satisfies US-10.2.1.
4. **Reseed the billing history.** In `domain/seed/history.ts` and `domain/seed/billing.ts` build
   every seeded ACCPAY with `amountPayable = total`; paid accounts authorise and disburse the full
   total, and their `Disbursement` rows carry the full total. The seeded pre-payment pair (BC0001)
   likewise. **Bump `PERSIST_VERSION`** by one (this bump also covers items 9 and 10 if they land in
   session 1). Update `store/seedBilling.test.ts` and add an invariant test: for every seeded pair,
   `accPay.amountPayable === accRec.amountDue` and
   `case.authorisedAmount === min(case.receivedAmount, amountPayable)`.
5. **Payment history without a fee.** In `store/selectors.ts` `paymentHistoryFor`, drop
   `serviceFeeAmount`, rename `netPayable` to `releasedAmount` (the case's `authorisedAmount`), keep
   the status logic. Update `store/dashboard.test.ts` so the invariant becomes
   `releasedAmount === grossReceived` for a fully paid row.
6. **UI and copy, step 1.**
   - `apps/web/screens/AccountsScreen.tsx` `PaymentsTable`: columns become Date received, Invoice,
     Patient, Payer, **Received by AA**, **Released to you**, **Paid to you**, Status. Replace the
     "illustrative AA service fee is deducted" caption with: "Everything AA receives for an invoice is
     released to you in full. AA's own fee is invoiced to you monthly." (step 2 turns "invoiced to you
     monthly" into a link to the AA fees tab).
   - `apps/demo/DemoXero.tsx`: remove the `aa-service-fee` box from `AccPayCard`; the ACCPAY money
     flow card reads "Simulated payable to the anaesthetist. This record tracks the full amount AA will
     disburse."; the `MoneyStat` "Net payable" becomes "Payable". `apps/demo/xeroPairView.ts` drops
     the fee fields from `accPay`.
   - The re-homed "Payment received (webhook)" triggers (`payment-full` / `payment-half` in
     `src/shared/demoTriggers/registry.ts`, or wherever Phase 14 put them): the result message states
     the released amount in one line, for example "Webhook for XR0003: $76.19 received, the paired
     ACCPAY is authorised for exactly $76.19.", and the description drops "proportionally".
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
8. **Re-green step 1 and patch the step-1 beats** (after items 9 and 10 if they fit in session 1).
   `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots`, all green. Patch the demo
   guide for step 1 (see "Demo guide updates", step-1 rows) so the guide is never stale if the phase
   pauses here. **Stop point:** tell the user step 1 is green so they can commit it before session 2.

### Xero records: identifiers and the settled NHI rule (session 1 if room, else opens session 2)

9. **InvoiceNumber, Reference and issue date on every Xero record** (US-09.1.1 acceptance criterion
   "Invoice identifiers"). Add `invoiceNumber`, `reference` and `issuedAtISO` to `XeroAccRec` and
   `XeroAccPay`, and `anaesthetistId` to `XeroAccPay` (the payee at handoff: today the List's
   anaesthetist; Phase 32's doer rule re-points it before handoff, never after, so a moved Booking
   is never counted twice). Add `kind: 'procedure' | 'aaFee'` to `XeroAccRec` (required, so the
   compiler finds every creator; step 2 adds the `aaFee` creator). At handoff the ACCREC gets
   `invoiceNumber = invoice.invoiceNumber` and the ACCPAY `${invoiceNumber}-P` (US-08.4.3); both get
   `reference = invoice.caseReference` and `issuedAtISO` from the demo clock (`clockISO`). Seeds set
   the same fields (history rows use their `raisedISO`). `xeroPairView.ts` reads the stored fields
   instead of deriving them. In `DemoXero.tsx`, both record cards show labelled **InvoiceNumber** and
   **Reference** meta items, with one caption on the pair: "InvoiceNumber is the unique key hospitals
   and insurers quote on remittances, so automated remittance matching keys on it. Reference is for
   internal tracing only; Xero does not enforce its uniqueness." The Admin invoice rail
   (`InvoiceDocument.tsx` `XeroReference`) shows the two stored Xero IDs (Xero InvoiceID and BillID)
   beside the numbers, matching the catalogue's admin-invoice-xero-ids image. Tests: handoff stores
   every field; the `-P` suffix; Reference equals the case reference; `issuedAtISO` equals the clock;
   `xeroNhi.test.ts` still passes.
10. **The settled NHI rule in the Xero simulator** (US-09.3.1, Confirmed; OQ-30 answered). Replace the
    `warn` callout "NHI never resides in Xero (Appendix 2 vs Appendix 1)" in `DemoXero.tsx` with an
    `info` callout (keep `shot="xero-nhi-policy"`) titled "No personal information in Xero" and the
    body: "Xero holds no NHI and no other personal information about a patient. Each contact is known
    to Xero only by a hidden internal ID in ContactNumber, and Xero's own ContactID, which link each
    transaction back to its invoice in the billing system. NHI lookup happens in the billing system,
    never in Xero. Confirmed with AA." No behaviour changes: the hidden-ID ContactNumber, the cached
    ContactID and the no-NHI rule are already built and tested. Update any `DemoXero.test.tsx` or
    shot assertion on the old title. Satisfies US-09.3.1's remaining gap (stale presenter copy).

### Step 2 · fee settings and the monthly fee invoice (session 2)

11. **The fee model** (DM-26). In `domain/types.ts` add:
    - `AaFeeSettings`: `fixedItems: { id, description, amount }[]` (several allowed),
      `perBctiCharge: number`, `amountsIncludeGst: boolean`. Stored as `settings.aaFee` on
      `DemoSettings`, beside `contactArchiveInactivityDays` (the existing home for
      office-configurable parameters). One schedule for every anaesthetist: whether the fixed items
      vary by anaesthetist is OQ-60, so keep the shape easy to key by anaesthetist later.
    - `AaFeeInvoice`: `id`, `invoiceNumber`, `reference` (the fee invoice's own case reference),
      `anaesthetistId`, `monthISO` (`YYYY-MM`), a `settings` snapshot (the `AaFeeSettings` used),
      `lines` (one per fixed item, plus one "BCTIs issued in <Month YYYY>: N x $rate" line),
      `bctis` (a snapshot of the counted BCTI records: ACCPAY id and number, procedure invoice number,
      issued date), `bctiCount`, `subtotal`, `gst`, `total`, `raisedAtISO`, `raisedBy` (`office` or
      `scheduled`), `accRecId`, `amountReceived`, `paidAtISO?`. It **is its own billing case**: it
      carries the ACCREC link and its money state itself, and lives in a new
      `billing.aaFeeInvoices` map, deliberately outside `billing.cases`. Every consumer of
      `billing.cases` (payables, GST activity, Overdue and aging, the monitor pipeline,
      `casesForList`, `openAccRecs`, the Invoices screen) assumes a Booking behind the case, and
      FT-10.3 says the fee is distinct from any procedure receivable and payable; Phase 36 folds both
      into ledger legs. For `kind:'aaFee'` the ACCREC's `invoiceId` holds the `AaFeeInvoice` id.
    - `ID_FORMATS` kinds `aaFeeInvoice` (`AF`, pad 4) and `aaFeeInvoiceNumber` (`AA-FEE-2026-`, pad 4).
      Thread the new map and settings through `AppState`, the empty slice in `appStore.ts`,
      `freshAppState`, `resetDomainState` in `mutate.ts` and `SeedBillingSlice` in `seed/billing.ts`.
12. **Pure BCTI count and fee maths** (convention 9).
    - `src/domain/billing/bcti.ts`: the `BctiRecord` type (`accPayId`, `billNumber`,
      `receivableInvoiceNumber`, `anaesthetistId`, `issuedAtISO`, `voided`) and
      **`bctisFor(records, anaesthetistId, monthISO)`**, the only place BCTIs are counted: the
      records for that anaesthetist issued in that calendar month (by the date part of `issuedAtISO`),
      voided ones excluded, each `accPayId` counted once, sorted by date then id. A comment beside it
      states the provisional rules in one place: one BCTI per receivable invoice (OQ-29, "one per
      procedure" unresolved); each counted once against the anaesthetist who did the procedure
      (OQ-60's recommendation); issued BCTIs count whether paid or not (the plan's reading of
      OQ-60's open paid-only point).
    - `src/domain/billing/aaFee.ts`: `aaFeeFor(settings, bctiCount)` returning `{ lines, subtotal,
      gst, total }`: the fixed items summed plus `perBctiCharge x bctiCount`, rounded once on the
      total; when `amountsIncludeGst` the total is the sum and `gst = total x 3 / 23` rounded,
      otherwise GST is added at 15% (`GST_RATE`). `validateAaFeeSettings(settings)` (description
      required, amounts finite, zero or more, to the cent).
    - Vitest: **the US-10.3.1 acceptance criterion**: fixed items of $500 (two items, $350 and $150)
      and $5 per BCTI with 40 BCTIs give $700; **US-10.3.3's**: the total is the sum of the fixed items
      plus rate times count, and a changed rate gives the new total; zero BCTIs give the fixed items
      only; GST split conserves to the cent both ways; `bctisFor` counts by anaesthetist and month
      (a BCTI on 31 Jul and one on 1 Aug land in different months), drops voided records, counts a
      duplicated record once, and is deterministic.
13. **The BCTI record list: `bctiRecords(state)`** in `store/selectors.ts`, the only source
    `bctisFor` is fed from: one record per procedure ACCPAY in `state.xero.accPays` (the ACCPAY is
    the BCTI), carrying its stored `invoiceNumber`, `anaesthetistId` and `issuedAtISO` (item 9).
    Fee ACCRECs have no ACCPAY, so they are never counted. Later phases that add invoices feed this
    list and nothing else: 22 (a Split Contract gives two receivable invoices, so two BCTIs), 36 (the
    ledger's payable legs, with a parity test against this selector), 39 (additional invoices) and
    39b (event invoices). Say so in a comment.
14. **Store actions** in new `src/store/aaFeeActions.ts`, every write through `mutate()`:
    - `saveAaFeeSettings(api, actor, next)`: office only; refuses invalid settings with the
      validator's reason; audit `aaFee.settingsChanged` (entity `settings`, before and after).
      Raised fee invoices keep their snapshot, so a change applies from the next run (US-10.3.3).
    - `aaFeeRunPreview(state, monthISO)` (selector): one row per active anaesthetist with BCTI count,
      fixed total, per-BCTI total and fee total from `bctisFor` and `aaFeeFor`, and whether they
      already have a fee invoice for that month.
    - `runMonthlyFeeInvoices(api, actor, { monthISO })`: office actor (the product button) or the
      system actor `{ who: 'AA fee run (scheduled)', role: 'system', source: 'system' }` (the
      scheduled form); anaesthetists refuse. Refuses a month after the demo clock's month. In one
      mutate, for each active anaesthetist with no fee invoice for that month (FT-10.3: "one fee
      invoice to each anaesthetist", so an anaesthetist with no BCTIs is charged the fixed items):
      allocate the id and number, snapshot the settings and the counted BCTIs, resolve the
      anaesthetist's existing Xero contact through the `anaesthetist:<reg>` cache key (reuse
      `resolveContactInto`, newly exported from `xeroHandoff.ts`, with the same payee `ContactSpec`
      shape `handoffCase` builds, so no duplicate contact; anaesthetists with no contact yet get one
      created once), and create a `kind:'aaFee'` ACCREC (`amountDue = total`, stored
      `invoiceNumber`, `reference` and `issuedAtISO`) with no ACCPAY. Audit per invoice
      `aaFee.invoiceRaised` (entity `aaFeeInvoice`) and `xero.feeAccRecCreated`. Idempotent: a rerun
      for a month already invoiced raises nothing for those anaesthetists and returns
      `{ raisedCount: 0 }` without mutating. Build the raise step as an exported
      `raiseAnaesthetistInvoiceInto(draft, ...)` helper (fee invoice record plus its ACCREC against
      the anaesthetist's contact), so Phase 39a's carried-forward negative invoice to an anaesthetist
      reuses this path rather than building a second one. Satisfies US-10.3.1 and FT-10.3.
    - `recordAaFeePayment(api, actor, { aaFeeInvoiceId, idempotencyKey })`: the anaesthetist pays AA
      in full (Xero side: a `PaymentIn` on the fee ACCREC, ACCREC `paid`; mirror: `amountReceived`,
      `paidAtISO`). Idempotent by key. No `BillingReceipt` (it is not the anaesthetist's income, so
      GST activity never sees it). Widen `PaymentIn.source` with `'aaFee'`. Actor
      `{ who: 'Xero payment (AA fee)', role: 'system', source: 'system' }`; audit
      `aaFee.paymentRecorded` (entity `aaFeeInvoice`). Time from the demo clock (`clockISO`). A fee
      that nets against payables is OQ-60 and is not built (the recommendation keeps it separate).
    - Guards on the existing money paths: `receivePayment` refuses a `kind:'aaFee'` ACCREC with code
      `aaFeeInvoice`; `openAccRecs` excludes them (so the Control Panel's payment `indexPath` never
      lands on one); `runReconciliationPoll` skips payments on them before calling `receivePayment` (a
      fee `PaymentIn` never has a receipt, so without the skip every day advance would re-detect it);
      the archive job is unaffected (anaesthetist contacts are organisation type). Vitest for every
      guard, for one fee invoice per anaesthetist per month, a rerun being a no-op, the
      anaesthetist with no BCTIs (fixed items only), a settings change applying to the next run and
      not to a raised invoice, the future-month refusal, and the office, system and anaesthetist
      actors.
15. **Selectors and seed.** `aaFeeInvoicesFor(state, anaesthetistId)` (newest first, with a derived
    status `unpaid | paid`) and `allAaFeeInvoices(state)` read the billing mirror only, never
    `state.xero` (the Phase 10 convention 9 rule for app money views). Seed (determinism, convention 5):
    - `settings.aaFee`: two sample fixed items, "Practice management" $350.00 and "Office and
      reception" $150.00 ($500 in all), $5.00 per BCTI, amounts include GST. Labelled in the UI as a
      sample schedule: AA's real fixed charges come from its accountant (OQ-60).
    - Dr Souter's fee history in the `H` id namespace, computed through `bctiRecords`, `bctisFor` and
      `aaFeeFor` over the seeded history (never typed-in totals): `AA-FEE-2026-H01` for May 2026,
      raised 2026-06-01 and **paid** 2026-06-05 (with its `PaymentIn`), and `AA-FEE-2026-H02` for June
      2026, raised 2026-07-01 and **unpaid**, each with a `kind:'aaFee'` ACCREC against payee contact
      `XCH01`. July stays uninvoiced so the first live run has a month to raise. Only Dr Souter has
      seeded billing history, so only she has fee history. Counters continue past the seeded ids.
    - **Bump `PERSIST_VERSION`** again (this bump also covers items 9 and 10 if they slipped to
      session 2). Extend `seedBilling.test.ts`: two builds deep-equal, the
      seeded fee totals equal `aaFeeFor` over `bctisFor` for their month, `resetDomainState`
      restores the fee map and settings.
16. **Admin: AA fee invoices and AA fee settings.** Two routes under the Billing section (so
    `sectionForPath` keeps Billing active): `/admin/billing/aa-fees` and
    `/admin/billing/aa-fees/settings`, two sub-tabs of one `AaFeesScreen` ("Fee invoices", "Fee
    settings"), wired in `router.tsx` and `apps/admin/routes.tsx`.
    - **Fee invoices** (`data-shot="admin-aa-fee-invoices"`): a month picker (months up to the demo
      month, default the demo month, July 2026, with the caption "The real run is made at month end;
      in the demo, running the current month invoices it to date."), the preview table from
      `aaFeeRunPreview` (Anaesthetist via `drSurname`, BCTIs, Fixed, Per-BCTI, Total, and "Invoiced"
      where one exists), and a teal **Run monthly fee invoices** button (an unbadged product office
      action, disabled with the reason when every active anaesthetist already has one for the month).
      A result line after a run. Below, every fee invoice: Number (mono), Anaesthetist, Month, BCTIs,
      Total (incl GST), Raised, Status pill (Paid with date on success tint, Unpaid neutral). A row
      expands inline to its lines and its counted BCTIs (ACCPAY number, procedure invoice number,
      issued date). One caption carries the provisional points: "Counts one BCTI per receivable
      invoice, once, against the anaesthetist who did the procedure. Provisional until AA's
      accountant confirms (OQ-60, OQ-29)."
    - **Fee settings** (`data-shot="admin-aa-fee-settings"`, US-10.3.3): the fixed items as editable
      rows (description, amount, remove) with "Add item", the per-BCTI charge, the "Amounts include
      GST" toggle, a live worked example ("With 40 BCTIs: $500.00 + $5.00 x 40 = $700.00"), the sample
      schedule label, and a teal **Save settings** button calling `saveAaFeeSettings`, with the
      validator's reason inline. Copy: "Changes apply from the next monthly run. Raised fee invoices
      keep the settings they were raised with."
    - The Billing monitor gains a compact **AA fee invoices** panel beneath Payables run
      (`data-shot="billing-aa-fee-invoices"`): the latest fee month, unpaid fee invoices and their
      total, and an "Open AA fee invoices" link. Its intro copy gains one sentence: "AA's own fee is
      invoiced to each anaesthetist monthly; it is never deducted from a payable."
    Satisfies US-10.3.1, US-10.3.3 and "Admin shows it paid or unpaid".
17. **Web Accounts: "AA fees" sub-tab** (US-10.3.2). Add `'fees'` to `AccountsSubTab` and
    `ACCOUNTS_SUB_TABS` (`/web/accounts/fees`), a fourth `SubTabButton` "AA fees", and an
    `AaFeesTable` (`data-shot="web-accounts-aa-fees"`): Invoice (mono), Month, BCTIs, Fixed charges,
    Per-BCTI charge, Total, GST, Status pill (Paid with date, or Unpaid). Footer: total unpaid fees.
    Caption: "AA invoices its fee monthly: fixed charges plus a charge for each buyer-created tax
    invoice (BCTI) AA issued for your work that month. It is never deducted from your payments."
    `?invoice=AA-FEE-...` highlights a row as the Payments tab does. Fee invoices show as soon as they
    are raised (the next-day rule applies only to procedure ACCPAY rows). The Payments caption from
    item 6 now links "invoiced to you monthly" to this tab. Mobile Balances is unchanged (see Out of
    scope).
18. **Xero simulation: the fee pair.** `xeroInvoicePairViews` gains the `kind` and an `aaFee` branch:
    lines from the fee invoice snapshot, no `accPay`, engine context `aaFeeInvoiceId` and
    `anaesthetistId`, and `incomplete` false when the fee invoice and contact exist. `InvoicesTable`
    shows an "AA fee" chip and `·` in the ACCPAY columns. `PairDetail` for a fee ACCREC: one money
    flow card "ACCREC · AA FEE" from the anaesthetist to **Anaesthesia Associates**, the ACCREC card
    with InvoiceNumber and Reference, and in place of the ACCPAY card a short note: "No payable. This
    is AA invoicing its own monthly fee to the anaesthetist, separate from any procedure receivable
    and payable." The "Simulate payment and payout" button is hidden; a teal **Record fee payment**
    button (the same body as the trigger) takes its place, disabled once paid, and for Dr Souter's
    fee invoices a "View in Dr Souter's account" link opens `/web/accounts/fees?invoice=<number>`.
    `data-shot="xero-aa-fee-pair"`.
19. **Register the demo triggers** in the Phase 14 registry (see Demo triggers), with bodies in
    `src/store` or `src/shared` so the PWA purity test holds, and add the `when` guard to the
    re-homed payment triggers. Vitest in the registry's test: each new entry matches only its
    routes, "Record fee payment" is invisible on a procedure pair, the payment triggers are invisible
    on a fee pair, every disabled reason fires, and "Seed a month of BCTIs" then "Run monthly fee
    invoices" gives Dr Rutherford a July fee invoice of exactly $700.00 at seed settings.
20. **Tests and shots for step 2.** Vitest for items 11 to 15 as listed, plus component tests for the
    AA fees tab (rows, pills, focus highlight), the Fee invoices screen (preview, button disabled
    state, a run adds rows) and the Fee settings screen (add and remove an item, invalid amount
    refused, save audited). Playwright: add `visual/aa-fee.spec.ts` through settings, seed BCTIs,
    run, the fee pair, Record fee payment and the web AA fees tab, with the five new `data-shot`
    hooks. Copy sweep: no en or em dashes in any new string; grep confirms `0.05` appears nowhere in
    `src`, and `350`, `150` and the `5` per-BCTI charge appear only in the settings seed and tests.
21. **Re-green step 2:** `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots`.

## Demo triggers

All are registered through the Phase 14 registry with `surfaces: bar`, a `run(api, ctx)` that acts on
the entity in the URL, the published context or a named seed constant, and a disabled state. None is
added to the Control Panel page; it lists them under their screens automatically.

1. **"Run scheduled month-end fee run"** · screen `/admin/billing/aa-fees` · runs
   `runMonthlyFeeInvoices` as the scheduled system actor for the month shown in the picker (the
   screen publishes it with `useDemoTriggerContext` under a new `'aaFees.month'` key in
   `DemoContextValues`; default the demo month). The stand-in for the month-end job, whose day is
   not settled (OQ-47). Disabled when every active anaesthetist already has a fee invoice for that
   month. The product form of the same action is the in-page teal **Run monthly fee invoices** button
   (office actor, unbadged, not a demo trigger). `indexPath`: `/admin/billing/aa-fees`.
2. **"Seed a month of BCTIs"** · screen `/admin/billing/aa-fees` · seed-scoped to `ANAE.rutherford`
   (named in the entry and gated with `when`): tops Dr Rutherford up to exactly 40 BCTIs issued in
   July 2026 (the seed's demo month; it adds 40 minus his current July count from `bctisFor` over
   `bctiRecords`, never a count of its own), so the $500 + $5 x 40 = $700 example reproduces on the
   next run. Build them with a generalised history account builder (`domain/seed/`, the same graph
   `buildHistory` builds for Dr Souter: billed List, Booking, Procedure, invoice, case, ACCREC and
   ACCPAY with stored numbers and `issuedAtISO`), dated on the July weekdays **before the canvas
   horizon start** (`horizonFor(DEMO_TODAY).startISO`, 2026-07-07: so 1, 2, 3 and 6 July, an AM and
   a PM List each day, five Bookings per List), the rule `history.ts` already follows so no added
   List collides with a generated canvas List. All paid and disbursed so they add nothing to Overdue
   or the payables run, in their own deterministic id namespace, through one `mutate()` with one
   audit entry. Disabled when `bctisFor` already gives Dr Rutherford 40 or more July BCTIs
   ("Already 40 BCTIs in July 2026"), or he has a July fee invoice ("Already invoiced for July
   2026"). `indexPath`: `/admin/billing/aa-fees`.
3. **"Record fee payment"** · screen `/demo/xero/invoices/:accRecId`, with a `when` that shows it
   only when that ACCREC is `kind:'aaFee'` (never on a procedure pair) · calls `recordAaFeePayment`
   for its fee invoice (the anaesthetist's bank transfer lands in AA's Xero). Disabled when paid
   ("Already paid"). The fee pair detail's in-page button uses the same body. `indexPath`: the pair
   of the oldest unpaid fee invoice (on the pristine seed, Dr Souter's `AA-FEE-2026-H02`), or `null`
   when every fee invoice is paid.
4. **Re-pointed:** the `payment-full`, `payment-half` and `payment-replay` triggers Phase 14 re-homed
   now release exactly the amount received (Full and Half alike). On `/demo/xero/invoices/:accRecId`
   they gain a `when` that hides them on a `kind:'aaFee'` pair (a fee payment is "Record fee
   payment", never a procedure webhook), and `receivePayment`'s `aaFeeInvoice` refusal backs that up.
   The Control Panel's `indexPath` for them uses `openAccRecs`, which already excludes fee ACCRECs.
   Phase 14's PWA `pwa-payment-full` / `pwa-payment-half` (Mobile · Balances) share the same body, so
   they release exactly the amount received too; their `choices` come from `openAccRecs`, so a fee
   ACCREC is never offered; their result message and description get the same no-fee wording.

The fee settings page needs no trigger (it is a normal office screen). The web AA fees tab is shown
paid through "Record fee payment" and the pair's "View in Dr Souter's account" link.

**PWA equivalent:** no new PWA entry. This phase changes no mobile screen, and no mobile beat waits
on the office or a backend event; the fee view is web only (US-10.3.2's screenshot and the verified
gap put it on web). The only PWA change is the shared payment body and copy behind
`pwa-payment-full` / `pwa-payment-half` (item 4 above). Confirm this phase's new entries declare
`surfaces: bar` so the PWA demo-actions sheet does not list them, and that `npm run build:pwa` still
passes the purity check.

## Out of scope

- The internal ledger (DM-22, Phase 36). `AaFeeInvoice` stays a self-contained case beside
  `billing.cases`; Phase 36's ledger promotion must carry `billing.aaFeeInvoices` into its receivable
  legs and the imbalance indicator, and re-read `bctiRecords` from its payable legs with a parity
  test.
- Period approval of BCTIs (US-10.2.6), negative invoices netted against payments (US-10.2.5) and the
  carried-forward negative invoiced to an anaesthetist: Phase 39a, which reuses
  `raiseAnaesthetistInvoiceInto`.
- A payment day, the weekly trust cycle or the separate monthly cycle on the 20th (OQ-47): the fee
  run is an office action for a chosen month; no "Close accounting week".
- Netting the fee against payables, counting only paid BCTIs, and fixed items per anaesthetist
  (OQ-60): not built; the recommendation is.
- Part payment of a fee invoice, fee credit notes or fee voids, and AA-side corrections generally
  (OQ-19's credit and reissue is Phase 39).
- A printable AA fee invoice document and fee invoices on the Admin Invoices screen; the AA fee
  invoices screen is the Admin home for now.
- A mobile fee view on Balances (US-10.3.2 lists "mobile + web" but its only screenshot and the
  verified gap are web); record it as an open handoff item for the owner (no later phase plans it;
  Phase 38 is web only).
- Invoice presentation (Phase 22): procedure invoices move to "issued in the anaesthetist's name
  with AA as agent", and the ACCPAY gets its BCTI wording. The AA fee invoice is AA's own invoice in
  AA's name; leave its wording alone and note it in the handoff so Phase 22 exempts it.
- The Xero outage queue and voids made in Xero (Phase 37), bulk remittance (US-10.2.4, Phase 37).
- Any edit to a catalogue requirement's text or status. The stale screenshots (US-10.3.1
  `simulator-service-fee.png`, US-10.3.2 `web-fee-in-payments.png`, US-10.2.1's part-payment image,
  US-09.3.1's and US-09.3.2's NHI callout) are re-shot by the Catalogue screenshots step.

## Manual test checklist

The agent runs every item itself in the running app and reports it with evidence; none is handed
to the owner (ROADMAP.md "Owner review: agents test themselves").

- [ ] Reset. Xero simulation: the NHI callout is a neutral info callout, "No personal information in
      Xero", with no mention of an unresolved contradiction. Invoices → any seeded procedure pair:
      the ACCPAY payable equals the ACCREC amount due; no fee box anywhere; both cards show
      InvoiceNumber and Reference, the ACCPAY number ends `-P`.
- [ ] S3: authorise both Mon 20 Jul Lists, open AA-2026-0005 (nib, $152.38): the payable to Dr
      Souter is $152.38. Simulate payment and payout: $152.38 disbursed; web Accounts → Payments shows
      $152.38 received, released and paid to you, with no AA fee or Net to you column.
- [ ] S4 Beat 5: pay half of Hemi Walker's St George's invoice via the re-homed webhook trigger: the
      ACCPAY authorises exactly the amount received to the cent; Run payables disburses exactly
      that; pay the balance and run again: the total disbursed equals the invoice total, never more.
- [ ] Replay the last webhook: no change. Advance the day: the seeded missed webhook is caught by
      the poll and releases its full amount.
- [ ] The admin invoice rail for AA-2026-0005 shows the stored Xero InvoiceID and BillID.
- [ ] Admin → Billing → AA fee invoices → Fee settings: two sample items ($350, $150), $5.00 per
      BCTI, the worked example reads $700.00 for 40 BCTIs; add an item, save, the example updates;
      an empty description or negative amount is refused with a reason; remove it again and save.
- [ ] Fee invoices: AA-FEE-2026-H01 (May) Paid and H02 (June) Unpaid for Dr Souter, their totals
      matching $500 plus $5 per BCTI shown in the row. July preview lists every active anaesthetist.
      "Seed a month of BCTIs" in the bar: Dr Rutherford shows 40 BCTIs and $700.00, and the Day view
      for 7 to 20 July shows no doubled Rutherford List. Run monthly fee
      invoices: one July fee invoice per active anaesthetist, Dr Rutherford's $700.00, Dr Souter's
      $500 plus $5 times her July BCTIs (including AA-2026-0005's if S3 ran), the others $500.00; a
      second click is disabled with its reason. Expand Dr Rutherford's row: 40 counted BCTIs, each
      once.
- [ ] Change the per-BCTI charge to $6.00 and save: the raised July invoices and the seeded H01 and
      H02 do not change; pick June in the month picker: the preview for the anaesthetists with no
      June fee invoice (everyone but Dr Souter) uses $6.00. Set it back to $5.00.
- [ ] "Run scheduled month-end fee run" shows only on the AA fee invoices screen; on a fresh reset it
      raises July's invoices audited as the scheduled system actor.
- [ ] Xero simulation: each fee ACCREC is listed with an AA fee chip against the anaesthetist's
      contact (no duplicate for Dr Souter), no ACCPAY; on a fee pair the bar shows "Record fee
      payment" and none of the Payment received triggers; Record fee payment marks it paid; on a
      procedure pair "Record fee payment" is absent. Advance the day: the poll does not touch the fee
      payment.
- [ ] Web → Accounts → AA fees: H01 Paid, H02 Unpaid, the July invoice Unpaid, then Paid with its
      date after Record fee payment; the `?invoice=` link from the Xero sim highlights the row; the
      Payments caption links here.
- [ ] GST activity, Overdue, the payables run and the Billing monitor pipeline do not change when a
      fee invoice is raised or paid, or when settings change.
- [ ] Admin → Audit shows `aaFee.settingsChanged`, `aaFee.invoiceRaised`, `xero.feeAccRecCreated`
      and `aaFee.paymentRecorded` with the right who, role and source.
- [ ] The PWA demo-actions sheet lists none of this phase's new triggers; on Mobile · Balances,
      "Payment received · half" releases exactly the amount received, its message carries no fee
      wording, and no fee invoice is offered as a choice.
- [ ] No new app copy contains an en or em dash; the only action colour is teal.
- [ ] Catalogue screenshots: the recipes for the covered items above (US-10.3.1, US-10.3.2, US-10.3.3 and the re-shot ones) are created or updated, every recipe this phase broke is re-pointed, a full `npm run capture` ends with no failed recipe and no story without a recipe, the covered items' new shots are checked by eye, and `npm run verify:board` is green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots` and `npm run verify:board` green.

## Demo guide updates

- **Step 1 (patched in session 1):**
  - `docs/demo-guide/03-demo-script.md` S3 Beat 2: the ACCPAY tracks the full amount AA will pay Dr
    Souter; nib owes $152.38 and the payable to Dr Souter is $152.38; drop the illustrative-fee lines
    ($7.62, $144.76) and the "rate and GST need confirmation" line. S3 Beat 3: "nib pays $152.38 into
    AA, then AA pays the same $152.38 to Dr Souter"; the Payments row shows $152.38 received, released
    and paid to you. S4 Beat 5: "A partial payment authorises a payable for exactly the amount
    received"; Expected: each run pays exactly what arrived.
  - S5 Beat 3 (no NHI in Xero): Say "No personal information goes into Xero, only a hidden internal
    ID that links each transaction back to the billing system. AA confirmed this rule."; Expected:
    the callout states the confirmed rule (no RFP-contradiction callout).
  - `04-presenter-cheat-sheet.md` (~116-123): the flow line becomes "Payer -> ACCREC -> AA account
    -> ACCPAY (full amount) -> Anaesthetist"; replace the 5% and proportional bullets. RFP
    ambiguities §1 (NHI in Xero, ~208-214) becomes settled: "Confirmed with AA: no NHI or other
    personal information in Xero."
  - `02-workflows-and-handoffs.md` (~384-389): ACCPAY is the full amount; step 5 "for exactly the
    amount received". Compliance (~454-455): drop "contradict each other ... must be confirmed";
    state the confirmed rule.
  - `master-demo-guide.html`: the same sections (~724-727 money flow, ~895-902 S3, ~935-936 S4
    Beat 5, ~959 S5 Beat 3, ~1040-1045 cheat sheet, ~1084-1086 RFP ambiguity card 1).
  - `DemoControlPanel.tsx` S3, S4 and S5 scenario messages if they mention the fee, proportional
    payment or the NHI contradiction.
- **Step 2 (patched in session 2):**
  - S3 gains **Beat 4: AA's monthly fee** (Admin → Billing → AA fee invoices → Fee settings: the
    fixed items and $5 per BCTI → Fee invoices → "Seed a month of BCTIs" → Run monthly fee invoices →
    Dr Rutherford's $700.00 ($500 + $5 x 40) and Dr Souter's July invoice, which counts AA-2026-0005's
    BCTI → Xero simulation fee pair → Record fee payment → web Accounts → AA fees shows Paid). Say: the
    fee is AA invoicing the anaesthetist monthly from settings the office maintains, never a
    deduction; what counts as a BCTI and the real fixed schedule are being confirmed with AA's
    accountant. Read Dr Souter's figures from the built app, do not compute them by hand.
  - The cheat sheet gains a one-line AA fee flow ("Month end: fee settings + BCTI count -> AA-FEE
    invoice (ACCREC) -> Anaesthetist pays AA") and the provisional-count caveat; the workflows doc
    gains a short "Monthly AA fee invoicing" workflow (settings, trigger, steps, what the anaesthetist
    sees); `01-personas-and-responsibilities.md` adds "maintain AA fee settings and run the monthly fee
    invoices" to the office's money duties.
  - `master-demo-guide.html` mirrors all of the above; the S3 Control Panel scenario message mentions
    Beat 4.
  - **Milestone consistency read** (16 is a milestone phase, and the first: it includes 14, 15 and
    15a): read `master-demo-guide.html` end to end against the run sheet, cheat sheet and workflows;
    every figure and button label matches the built app.

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19),
run after the review pass and before the PROGRESS.md entry. Re-run
`node docs/prototype-build/catch-up/tools/recipe-status.mjs 16` first: earlier phases may have
changed these recipes since this plan was written.

**Covered items.** When the phase is done, each recipe in `requirements-board/capture/recipes/`
matches what was built:

| Item | Recipe at plan time | When this phase is done |
|---|---|---|
| [US-10.1.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-10.1.1.md) All payments into AA | captured · simulator-money-path | stays captured. Re-shoot `money-path` (the money-flow card now has no fee line: the payable equals the receivable). Caption unchanged |
| [US-10.1.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-10.1.2.md) Two payment states | captured · admin-two-states[paid-in,disbursed], admin-invoice-states | stays captured. Re-shoot both shots: the disbursed amount now equals the amount received. Captions unchanged |
| [US-10.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-10.2.1.md) Payable released to match the amount received | captured · simulator-full-payment[unpaid,paid], admin-payables-run | stays captured. Re-shoot `full-payment` and `payables-run` at the gross amount. Add a simulator shot `part-payment` on Hemi Walker's St George's pair (S4 Beat 5): Demo actions, "Payment received · half", highlight the money-flow grid, caption "Part paid: the payable is released for exactly the amount received, the rest stays outstanding" |
| [US-10.2.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-10.2.3.md) Reconcile back to the ledger | captured · web-receipt-in-ledger, simulator-engine-link | stays captured. Re-shoot `receipt-in-ledger` at `/web/accounts/payments?invoice=AA-2026-0002`: received, released and paid to you, with no AA fee or Net to you column. `engine-link` re-shot as is |
| [US-10.2.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-10.2.4.md) Bulk remittance stays in Xero | absent | stays absent (by design; Phase 37 may revisit). Nothing to do beyond the capture run |
| [US-10.2.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-10.2.5.md) Negative invoices netted in the payment run | none (Phase 14 adds an `absent` placeholder, "Not built yet: catch-up Phase 39a builds this") | stays that placeholder; Phase 39a builds it. This phase builds nothing visible for it |
| [US-10.2.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-10.2.6.md) Approve the period's BCTIs for payment | none (Phase 14 placeholder, Phase 39a) | stays that placeholder; Phase 39a builds it |
| [US-10.3.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-10.3.1.md) Generate AA fee invoices | partial · simulator-service-fee | captured; drop the partial reason. Replace `service-fee` (the fee box is gone) with admin shot `fee-run` at `/admin/billing/aa-fees`: states `preview` and `run` (Demo actions, "Seed a month of BCTIs", then the teal "Run monthly fee invoices"), highlight `[data-shot=admin-aa-fee-invoices]`, caption "One run raises every anaesthetist's fee invoice for the month: Dr Rutherford, 40 BCTIs, $700.00". Add simulator shot `fee-pair` on the fee ACCREC (`[data-shot=xero-aa-fee-pair]`, "AA fee ACCREC to the anaesthetist, with no payable") |
| [US-10.3.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-10.3.2.md) AA fee visible to the anaesthetist | partial · web-fee-in-payments | stays partial. The web AA fees tab is built; the mobile app has no fee view (open owner item, no phase plans it), so the reason reads "Web shows AA fee invoices and their status; the mobile app does not show them". Replace `fee-in-payments` with web shot `aa-fees` at `/web/accounts/fees` (highlight `[data-shot=web-accounts-aa-fees]`, caption "AA's monthly fee invoices and whether each is paid", H01 paid and H02 unpaid in one state) |
| [US-10.3.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-10.3.3.md) AA fee settings | none (create it) | create. Status captured (provisional sample schedule). Admin shot `fee-settings` at `/admin/billing/aa-fees/settings`, highlight `[data-shot=admin-aa-fee-settings]`, states `schedule` (two fixed items, $5.00 per BCTI, the worked example $700.00 for 40 BCTIs) and `edited` (add an item, the example updates). Caption "Fixed items plus a charge per BCTI, kept in settings and not in code" |
| [US-09.1.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-09.1.1.md) Invoice pair creation and identification | captured · simulator-invoice-pairs, simulator-pair-detail, admin-invoice-xero-ids | stays captured. Re-shoot `pair-detail` highlighting the new InvoiceNumber and Reference items (caption "One pair: both records carry InvoiceNumber and Reference"), and `invoice-xero-ids` with the stored Xero InvoiceID and BillID on the Admin invoice rail |
| [US-09.3.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-09.3.1.md) Contact identification without NHI | captured · simulator-contacts, simulator-pair-contact-ids | stays captured. Add a simulator shot `no-personal-info` at `/demo/xero`, highlight `[data-shot=xero-nhi-policy]` (now the info callout "No personal information in Xero"), caption "Xero holds no NHI or other personal information, only the hidden internal ID". Re-shoot the other two unchanged |

**Recipes this phase breaks.** The AA fee box, the Net to you and AA fee columns and the fee wording
go; the Xero NHI callout and the pair cards change; the payment webhook entries release exactly the
amount received:
- `US-09.3.2` and `US-15.0.6`: highlight `[data-testid=xero-nhi-policy]`, whose title and tone change.
  Re-shoot; reword the captions only if they call it a contradiction.
- `US-09.1.4`: its `absentReason` says the ACCPAY carries "the AA service fee"; drop that wording.
- `US-08.3.3` and `US-08.3.5` (`/web/accounts/payments`): the table loses its AA fee and Net to you
  columns. Re-shoot; fix any caption or highlight that names them.
- `US-09.1.1`, `US-09.1.3`, `US-06.3.1` and `US-10.1.1`: scroll to or highlight
  `[data-testid=xero-money-flow-grid]`, whose card loses the fee line. Confirm each still finds it.
- `US-09.2.1` to `US-09.2.4`, `US-10.2.2`, `US-10.1.2` and the other recipes that run "Payment received"
  or "Simulate payment and payout": figures are now gross. Re-shoot, and fix any caption that quotes
  a net-of-fee amount. The button "Simulate payment and payout" stays on procedure pairs.
- The old `aa-service-fee` hook and every recipe highlighting it (`US-10.3.1`, replaced above).

**ATLAS.md.** Routes (`/admin/billing/aa-fees`, `/admin/billing/aa-fees/settings`,
`/web/accounts/fees`), Seed data worth shooting (the fee invoices AA-FEE-2026-H01 paid and H02 unpaid
for Dr Souter, and "Seed a month of BCTIs" giving Dr Rutherford 40 BCTIs and $700.00), Demo control
panel (the fee triggers are on their screens), and Existing hooks (`admin-aa-fee-invoices`,
`admin-aa-fee-settings`, `billing-aa-fee-invoices`, `web-accounts-aa-fees`, `xero-aa-fee-pair`; remove
`aa-service-fee`).

## Adversarial review (after build)

After the manual test checklist and `npm run build` / `npm run build:pwa` / `npx vitest run` /
`npm run shots` are green, and before writing the PROGRESS entry, run the standard adversarial
review-and-fix pass (PROGRESS convention 18): fan out independent Opus review subagents for
**quality**, **bugs/correctness** and **plan adherence** (scale up, this is a money phase: add a
fourth on **money conservation, the BCTI count and seed determinism**). This session then verifies
every finding against the catalogue and the code, fixes the confirmed ones with a test where a bug had
none, re-greens, and records the pass. Do not re-raise anything settled in the Decisions log, except
the 2026-07-29 fee ruling this phase explicitly supersedes.

**Steer this phase's reviewers at:**
- Money conservation on every procedure pair, seeded and live: `amountPayable === amountDue`;
  `authorised === min(received, payable)` to the cent after any sequence of partials, replays and
  poll catches; `disbursed <= authorised`; no residual fee maths anywhere (grep `serviceFee`,
  `agencyFee`, `0.95`, `0.05`, `proRata`).
- The BCTI count: `bctisFor` is the only function that counts BCTIs and `bctiRecords` the only list
  it reads (grep for any other `accPays` count or `.length` used as a BCTI count); each ACCPAY counted
  once, against its stored `anaesthetistId`, by issue month; voided excluded; fee ACCRECs never
  counted; the provisional rules (one per receivable invoice, OQ-29; OQ-60's recommendation) are
  stated in one place and on the Admin caption.
- The fee: $500 + $5 x 40 = $700 at seed settings; the total is fixed items plus rate times count,
  rounded once; GST conserves; a settings change never alters a raised invoice; one fee invoice per
  active anaesthetist per month; a rerun is a no-op; no future month.
- Settings, not code: no fee amount or rate appears outside the settings seed and tests; the settings
  write is office-only, validated, audited and restored by reset.
- Fee isolation: a fee invoice or its ACCREC never reaches payables, GST activity, Overdue or aging,
  the monitor pipeline rows, the payment webhook triggers, the reconciliation poll, the archive job,
  `casesForList` or the Invoices screen; `receivePayment` refuses a fee ACCREC; a fee payment creates
  no `BillingReceipt`.
- US-09.1.1: `invoiceNumber`, `reference` and `issuedAtISO` are stored on both Xero records (not
  derived), the ACCPAY number carries `-P`, the fee ACCREC carries its AA-FEE number. US-09.3.1: the
  callout states the confirmed rule, and no NHI reaches any Xero record (`xeroNhi.test.ts`).
- Determinism and persistence: seed builds deep-equal (including the "Seed a month of BCTIs" body,
  which uses no clock or randomness beyond the demo clock and seeded RNG), `PERSIST_VERSION` bumped
  for each seed change, `resetDomainState` and `freshAppState` carry `aaFeeInvoices` and
  `settings.aaFee`; audit entries carry the right actor (office button vs scheduled system run vs Xero
  payment vs settings save).
- Triggers: each entry shows only on its screen, declares `surfaces: bar`, has working disabled
  states, and its body lives in `src/store` or `src/shared` (PWA purity).
- Design and copy: teal-only actions, pills on semantic tokens not status colours, mono tabular
  amounts, no en or em dashes, the demo guide figures match the running app.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry; ROADMAP.md "Owner review: agents test
  themselves"): the defaults built for open questions, provisional readings, anything logged
  rather than fixed, and the screens worth a look, each with its route and persona.
- Catch-up status row for Phase 16 and a phase entry (template in PROGRESS.md), recording the drift
  check result, the OQ-60 and OQ-29 status, where Phase 14 had re-homed the webhook trigger, the
  step-1 stop point, the manual checklist item by item, and the review pass. Note that FT-10.3,
  US-10.3.1 and US-10.3.3 are Verify in the catalogue and were built as written.
- **Decisions log:**
  - Supersede **2026-07-29 "Xero money flow and illustrative AA service fee"**: the payable equals
    the receivable and a payment releases exactly the amount received (FT-10.3, US-10.2.1); AA's fee
    is a monthly invoice from settings (D1, OQ-02 answered). Note that it restores the 2026-07-24
    `D-payee-amount` outcome as a catalogue rule.
  - The BCTI count: one BCTI per receivable invoice, counted once against the anaesthetist who did
    the procedure, issued BCTIs counted paid or not, through `bctisFor` over `bctiRecords` only.
    Provisional (OQ-29, OQ-60); if "one per procedure" is confirmed, `bctiRecords`, the "Seed a month
    of BCTIs" trigger and S3 Beat 4 are re-baselined in one place.
  - Every active anaesthetist gets a monthly fee invoice, fixed items only when they have no BCTIs
    (FT-10.3's "each anaesthetist"); the sample fixed schedule is labelled until AA's accountant
    supplies it.
  - Why `AaFeeInvoice` is its own case outside `billing.cases`, the `XeroAccRec.kind` discriminator,
    and `raiseAnaesthetistInvoiceInto` as the one path for invoices from AA to an anaesthetist.
  - Fee payments are not the anaesthetist's income: no `BillingReceipt`, never in GST activity.
  - The Xero NHI rule (Appendix 2 reading) is confirmed by AA (OQ-30); the simulator no longer calls
    it a contradiction.
- **Catalogue screenshots:** recipes created or changed (US-10.3.3 created; US-10.3.1 and US-10.3.2
  rebuilt; the re-shot and re-pointed ones), the `REPORT.md` counts before and after (captured, partial,
  absent, failed), and the partial reason on US-10.3.2 (no mobile fee view) handed to the owner.
- **Handoff notes:** Phase 36 must fold `billing.aaFeeInvoices` into the ledger and re-read
  `bctiRecords` from its payable legs with a parity test; Phases 22, 39 and 39b feed `bctiRecords` and
  never count BCTIs elsewhere; Phase 39a reuses `raiseAnaesthetistInvoiceInto`; Phase 22 must exempt
  the AA fee invoice from the "anaesthetist's name, AA as agent" wording; the mobile fee view as an
  open item for the owner; add a one-line
  "superseded by catch-up Phase 16" note where `docs/prototype-build/REQUIREMENTS.md`,
  `prototype-review/08-xero-integration.md` and `prototype-review/12-RFP-CONFLICTS-AND-CHOICES.md`
  still state the 5% deduction or the open NHI contradiction.
