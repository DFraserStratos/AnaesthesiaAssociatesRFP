# Phase 39a · Payment runs: BCTI approval, netting and remittance

**Requirements covered:**
[US-10.2.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-10.2.5.md) Negative invoices netted in the payment run (Verify, new) ·
[US-10.2.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-10.2.6.md) Approve the period's BCTIs for payment (Verify, new) ·
[DM-25](../analysis/domain-model-delta.md#dm-25) Negative invoice to the anaesthetist, netted in the payment run and shown on a remittance advice; BCTIs approved per period.
Read alongside (not closed here):
[FT-10.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-10.2.md) and
[US-10.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-10.2.1.md)
(a payable is released when its receivable is paid; Phases 16 and 36 built it, and this phase's
approval sits after it),
[US-09.1.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-09.1.4.md)
(the BCTI is the ACCPAY; the catalogue now says one per procedure, the plan builds one per
receivable invoice, provisional, under the roadmap's "BCTI granularity" rule),
[US-08.6.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.6.2.md)
(credit in full and rebill; Phase 39 raises the negative invoice this phase nets),
[US-10.3.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-10.3.1.md)
(the AA fee counts BCTIs; nothing here changes that count),
[US-10.2.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-10.2.4.md)
(bulk hospital remittance stays in Xero: a different "remittance", Phase 37's),
[OQ-47](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-47.md) (payment day,
cycle and who approves: open),
[OQ-71](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-71.md) (a negative
with no later payment: open, built as its recommendation),
[OQ-42](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-42.md) (answered:
the negative invoice is netted in the next payment run),
[OQ-60](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-60.md) (whether the AA
fee nets against payables: open, not built),
[OQ-29](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-29.md) (GST agency
treatment and the BCTI's wording, which the roadmap ties to BCTI granularity), and the "Internal ledger" section and the "Negative invoice" and "Remittance advice"
glossary entries of
[domain-model.md](../../../discovery-reference/Updated%20Requirements/domain-model.md).
**Depends on:** 37 (the payables run is paid in Xero and the engine records each disbursement when
Xero reports the bill paid, through `recordDisbursement`, the webhook, the poll and the outage queue)
and 39 (credit in full and rebill, which raises the **negative invoice** to an anaesthetist already
paid). By the roadmap order 14 (the registry, `useDemoTriggerContext`, the office actors), 16 (the
payable equals the receivable, the `-P` number, `bctisFor`, and the exported
`raiseAnaesthetistInvoiceInto` path that raises an invoice from AA to an anaesthetist against their
Xero contact), 22 (supplier and agent on documents), 26 (the anaesthetist profile: bank details,
display-only, with `destinationMasked`, `missingBank` and the GST number; 26 holds no payout) and 36
(the ledger pair, its legs, `ledgerPosition`, `anaesthetistPosition`, `LedgerDisbursement`, the
Admin Ledger screen and the PWA "Office runs payables" stand-in) have also run. 38 has run (web
Accounts and the GST schedule read the ledger; it reworded that PWA stand-in).
**Estimated:** 2 sessions. Session 1 is the run record, the approval gate and netting through Xero
(work items 1 to 8), ending at a green stop point with the Billing monitor working. Session 2 is the
remittance advice in Admin and web Accounts, the carried-forward balance and its recovery invoice,
the backdrop runs, the triggers, the demo guide and the close-out (work items 9 to 16). The
recovery invoice (OQ-71's recommendation in full) is why this is two sessions, not one.

## Goal

Today the payables run is an on-demand button that pays every released payable at once, records
nothing about the run beyond an id string on each disbursement, and has no idea that an anaesthetist
can owe money back. The catalogue asks for three things (DM-25):

- **The period's BCTIs are approved before they are paid** (US-10.2.6). A **payables run** is a
  record for a payment period. The Billing monitor previews the period: every released, unpaid
  payable (BCTI) per anaesthetist, and any negative invoice waiting to be netted. The office presses
  **Approve period's BCTIs**, which writes the run with its lines frozen. **Run payables in Xero**
  (Phase 37's button) then pays only approved lines. A payable released after the approval waits
  for the next approval. Who approves, and whether this is the same step as US-10.2.1's release, is
  OQ-47: the office approves, labelled provisional. The one-click demo paths that pay out today
  (the Xero sim's "Simulate payment and payout", 39's "Stage refund after payout" and 36's PWA
  "Office runs payables") go through an approval too, so the gate has no back door.
- **Negative invoices are netted per anaesthetist** (US-10.2.5). Phase 39 raises a negative invoice
  to an anaesthetist when an invoice they were already paid for is credited, and leaves its paid-out
  part (`toNetAmount`) open "to net". At approval each
  anaesthetist's open negatives are netted against their positive payables, oldest first, so Dr
  Sharma's 19 positive BCTIs and one negative are paid as one net amount. In Xero the negative
  (an ACCPAYCREDIT against the anaesthetist's contact) is allocated against the bills and the
  batch payment is the net total. The engine records each bill's cash payment and each allocation
  when Xero reports them, as Phase 37 does for disbursements.
- **A remittance advice per anaesthetist per run** (US-10.2.5: "the anaesthetist sees the run washed
  up in their remittance advice"). It lists every BCTI paid, every negative netted, the net paid,
  the bank account it went to and any amount carried forward, in Admin (from the run) and in web
  Accounts (the anaesthetist's own advices).
- **A negative with nothing to net against** follows OQ-71's recommendation in full, labelled
  provisional. Whatever a run cannot net stays on the anaesthetist's ledger position as **carried
  forward**. Once a carried-forward negative has stayed unpaid past a set period (an app setting,
  60 days to start), **Invoice carried-forward balances** on the Billing monitor raises an invoice
  from AA to the anaesthetist for the remainder through Phase 16's anaesthetist invoice path, with
  its own ledger pair and Xero ACCREC, and the anaesthetist pays it like a fee invoice.

The state gains payables runs, a payment-run setting, an offset amount on the payable leg, netting
on the negative invoice, recovery invoices and Xero allocation records, and the seeded disbursements
are grouped into backdrop runs, so `PERSIST_VERSION` is bumped. No seeded money figure moves.

## Before you start: drift check

1. Run the drift check against the plan's catalogue snapshot:

   ```
   git diff 501b0b8 -- "docs/discovery-reference/Updated Requirements/catalogue" "docs/discovery-reference/Updated Requirements/domain-model.md"
   ```

   Read the hunks (if any) for US-10.2.5, US-10.2.6, FT-10.2, US-10.2.1, US-09.1.4, US-08.6.2,
   US-10.3.1, OQ-47, OQ-71, OQ-42, OQ-60 and OQ-29, and the domain-model lines on the internal
   ledger, the negative invoice and the remittance advice. If an item changed, re-read it and adjust
   the work items. If US-10.2.5 or US-10.2.6 is now Retired or Future, drop its work items and record
   that in the PROGRESS entry. Both were **Verify** at plan time (new on 2026-10-01, from Greg's
   remarks), so a reworded acceptance criterion is the most likely change.
2. **Open questions and their safe interims** (each built as one setting or one store action, so a
   different answer stays contained):
   - **OQ-47 (payment day and cycle; who approves).** If still open: the payment period is a setting
     (`settings.paymentRun.periodDays`, 7, and `periodAnchorISO`, `2026-07-15`, so the demo week is
     Wed 15 Jul to Tue 21 Jul, matching today's "Tuesday to Tuesday" run), never a constant in code.
     The office approves. A period may hold more than one run (a supplementary approval after a late
     release). The Billing monitor carries a "Provisional · payment cycle and approver to confirm
     with AA" chip. Copy names the period's dates, never a weekday, "weekly", "Wednesday" or "the
     20th". If OQ-47 is answered with Greg's weekly cycle, set the setting and keep the code; if it
     says the system approves on its own, make approval a scheduled system action on the same store
     action (actor system) and keep the button as its manual form; if it says US-10.2.6 is the same
     step as US-10.2.1's release, stop and tell the owner (it would remove the gate this phase adds).
   - **OQ-71 (a negative with no later payment).** If still open: its recommendation, labelled
     "Provisional · recovery to confirm with AA's accountant (OQ-71)" wherever it shows: carry
     forward, then invoice after `settings.paymentRun.negativeRecoveryDays` (60). If answered
     differently, only `carriedForwardBalances` (work item 11) and `invoiceCarriedForwardBalances`
     (work item 12) change.
   - **OQ-60 (does the AA fee net against payables).** Not built: AA fee invoices stay separate
     receivables and never enter a run. If answered "it nets", stop and tell the owner (it
     contradicts FT-10.3).
   - **OQ-29 (one BCTI per receivable invoice, provisional).** A run line is one payable leg, so the
     run follows whatever `bctiRecords` counts; nothing here counts BCTIs. If granularity flips to
     one per procedure, the run is unaffected beyond its line labels.
   - **The recovery invoice's GST** is not stated anywhere: it recovers money already paid out, so
     the interim carries **no GST** and says "GST treatment to confirm with AA's accountant" on the
     document. One constant, `RECOVERY_INVOICE_GST`, in the pure module.
3. **Prerequisite names.** Confirm Phases 36, 37 and 39 are DONE in PROGRESS.md and read their
   handoff notes. Note the exact current names (planned names first; use what shipped):
   - from **36**: `LedgerPair` (kinds `'procedure' | 'prePayment' | 'aaFee'`), `PayableLeg`
     (`amount`, `releasedAmount`, `disbursedAmount`, `paidOutAtISO`, `xeroAccPayId`),
     `LedgerDisbursement` (`payablesRunId`), the pure `domain/billing/ledger.ts` (`applyDisbursement`,
     `pairStatusLabel`, `ledgerChecks`, `ledgerPosition` and its imbalance equation,
     `anaesthetistPosition` with `theyOweAa`), `ledgerPositionOf`, `anaesthetistLedgerPosition`,
     `payablesDue` (`byAnaesthetist`, `destinationMasked` and `missingBank` from 26), the
     `LedgerScreen` routes `/admin/ledger` and `/admin/ledger/anaesthetists/:anaesthetistId`, and
     the PWA "Office runs payables" stand-in on Mobile · Balances (`runPayables` as
     `OFFICE_SIMULATION_ACTOR`, reworded by 38);
   - from **37**: `recordDisbursement` (in `store/disbursementDetection.ts`, idempotent by its
     `BILLPAY-` key, `detectedBy`), `payBillsInXero(..., { webhook: 'deliver' | 'missed' })` and the
     Xero-side bill payment, `runPayables` as "Run payables in Xero" (badged Simulated Xero) and
     `disbursePayable` behind the Xero pair's "Pay anaesthetist in Xero (payables run)" trigger
     (`xero-pay-bill`), the Xero sim pair's in-page "Simulate payment and payout" (and its
     payout-only "Pay <anaesthetist> now" state), which 37 routed through `payBillsInXero`,
     `runReconciliationPoll` re-detecting bill payments, the outage queue
     (`enqueueXeroWork`, `processXeroQueue`, kinds `handoff | paymentSync | disbursementSync |
     poll`), its ruling that the engine never performs a disbursement, and whether it shipped a
     `heldForBank` refusal (37's plan names one, but 26 builds no payout hold: bank details are
     display-only, DM-33);
   - from **39**: the **negative invoice to the anaesthetist** raised by credit in full and rebill
     on an invoice already paid out. Planned shape (confirm against the code): `NegativeInvoice` in
     `billing.negativeInvoices`, `{ id (NEG, pad 4); number (the credit note number with 16's `-P`
     suffix, for example `CN-2026-0001-P`); anaesthetistId; creditNoteId; originalInvoiceId; pairId;
     total; offsetAmount; toNetAmount; status: 'offset' | 'toNet'; issuedAtISO }`, stored positive
     and shown negative. `offsetAmount` is what 39 set against the not-yet-paid-out payable;
     **`toNetAmount` (the part already paid out) is what this phase nets**. Its Xero mirror is a
     `XeroCreditNote` of type `ACCPAYCREDIT` in `xero.creditNotes` (with `allocated`), against the
     anaesthetist's contact. On the ledger, the credited pair carries `credit: { creditNoteId;
     negativeInvoiceId; atISO; heldForPayer; toNet }` and `ledgerPosition` totals
     `creditsHeldForPayers` and `negativesToNet` in `imbalance = receiptsHeld - payablesDue -
     creditsHeldForPayers + negativesToNet`; `anaesthetistPosition` gains `negativesToNet`. (Phase
     41's plan calls these `credit.recoveryDue` and `recoveryDueFromAnaesthetists`: use what 39
     shipped.) The credit note's `cause` is `'correction' | 'split'` (41 adds its refund cause);
     the negative invoice has no cause of its own. Phase 39's handoff note says what it left for this
     phase. **If 39 recorded the amount only as a trail, with no record of its own**, add the record
     here with the fields above, created at the same point in 39's commit, and say so in the
     PROGRESS entry. Also note 39's `stage-refund-after-payout` trigger (Admin · Billing monitor and
     Admin · Invoice; it pays Sarah Mitchell's invoice in full and pays it out to Dr Sharma through
     `disbursePayable`, once 14's `stage-post-op` has run; the user then credits it with 39's
     Credit and rebill), its result copy, and 39's pure `creditInFull`, `reversalPlan` and
     `applyCredit`, which the staging fixtures below reuse;
   - from **16**: `raiseAnaesthetistInvoiceInto(draft, ...)` (the fee invoice record plus its
     ACCREC against the anaesthetist's contact, which 16 exported for this phase), `AaFeeInvoice`,
     `XeroAccRec.kind`, `recordAaFeePayment`, the guards that keep a `kind:'aaFee'` ACCREC out of
     `receivePayment`, `openAccRecs` and the poll, `bctiRecords` and `bctisFor`, the generalised
     history account builder behind "Seed a month of BCTIs", and the `/admin/billing/aa-fees` route;
   - from **26**: where bank details live, `destinationMasked` and `missingBank` (no payout is held
     by a missing account);
   - from **38**: `AccountsSubTab` (`'outstanding' | 'payments' | 'gst' | 'fees'`), how the GST
     schedule reads a payment to the anaesthetist, and the Outstanding list's selector;
   - from **14**: the registry file (`src/shared/demoTriggers/registry.ts`), `useDemoTriggerContext`,
     `OFFICE_ACTOR` and `OFFICE_SIMULATION_ACTOR` in `src/store/demoActors.ts`, and the ruling that
     "Run payables" is a product button, not a registry entry.
4. Note the current `PERSIST_VERSION`.

## Reference

**Design files (convention 17):**

- `docs/design/Design Language.dc.html`: tokens (teal `#0D6E63` the only action colour, crimson
  identity only, semantic success, warning and neutral tints, pills at radius 999, Spline Sans Mono
  with tabular-nums for every amount, number and date, the side-sheet and elevation patterns). A
  negative amount is neutral text with a leading hyphen-minus ("-$120.00"), never red, never an en
  dash or a U+2212 minus.
- `docs/design/Admin Review.dc.html` and `docs/design/Admin Day.dc.html`: the admin desktop anatomy
  (tile rows, tables, header rows, side panels, pills). No mockup covers the Billing monitor, a run
  or a remittance advice: extend the Billing monitor's panels, `InvoiceDocument`'s print sheet (for
  the remittance advice and the recovery invoice) and `tableChrome.ts` as they stand.
- `docs/design/Web Dashboard.dc.html`: the web panel and table anatomy for the new Accounts sub-tab.

**Catalogue items:** the covered and context files listed above, and the 2026-10-01 meeting note
`catalogue/notes/2026-10-01-aa-meeting-with-greg.md` points #18 (refund as a credit note plus a
negative invoice, netted, the remittance advice), #48 (the payment cycle), #63 and #66 (BCTIs
approved for payment).

**Analysis files:**

- `docs/prototype-build/catch-up/GAP-ANALYSIS.md`: theme 7 (money model), the US-10.2.5 line, the
  DM-25 row, the S4 demo-impact line and the "Demo-trigger buttons" section.
- `docs/prototype-build/catch-up/epics/EP-10.md`: the header note (the second cluster: "payables run
  reworked per anaesthetist and period with an approve-for-payment step, net negatives and
  remittance advice"), then the US-10.2.6 and US-10.2.5 sections.
- `analysis/domain-model-delta.md` DM-25 (and DM-22 for the ledger it extends, DM-21 for the trust
  hold that Phase 41 will add as a run exclusion).
- `analysis/prototype-map-admin.md` section 7 (Billing monitor) and the Master data section,
  `prototype-map-store-seed.md` sections 4 and 9 (billing slices, counters, the seeded history),
  `prototype-map-apps-mobile-web.md` (web Accounts) and `prototype-map-shell-demo-pwa.md` sections
  5.2 and 7 (the Xero sim pair detail, the clock shortcuts).

**Code entry points** (line numbers are from 501b0b8; phases 14 to 39 will have moved them, and 36
and 37 rewrote the payables code: use the names from the drift check):

- Payables: `src/store/payablesActions.ts` (`payablesDue` 36, `disbursePayables` 55, `runPayables`
  146, `disbursePayable` 160; after 36 and 37 these read the ledger and pay in Xero), 37's
  `src/store/disbursementDetection.ts` and `src/store/xeroQueue.ts`, `src/store/reconciliationPoll.ts`.
- Ledger: 36's `src/domain/billing/ledger.ts` and `ledger.test.ts`, and 36's `src/store/ledgerSelectors.ts`;
  39's `src/domain/billing/creditNote.ts`.
- Types: `src/domain/types.ts` (`Disbursement` 809 with its `payablesRunId` string, `DemoSettings`
  886 beside `contactArchiveInactivityDays`, and 36's `LedgerPair`, `PayableLeg`,
  `LedgerDisbursement`); `src/store/mutate.ts` `ID_FORMATS` (`payablesRun: { prefix: 'PR', pad: 4 }`
  92 already exists and allocates today's run ids), `allocateId`, `clockISO`, `resetDomainState`;
  `src/store/appStore.ts` (`PERSIST_VERSION` 130, the empty billing slice, `freshAppState`).
- Seed: `src/domain/seed/history.ts` (Dr Souter's backdrop; every seeded disbursement carries
  `payablesRunId: 'PR-HIST-01'`, `dsbRunId` 186, rows 316 to 317), `src/domain/seed/billing.ts`
  (`'PR-SEED-01'` 218), `src/domain/seed/cast.ts` (Dr Sharma `ANAE.sharma` 47, Dr Strand
  `ANAE.strand` 58), and 16's generalised history account builder.
- Admin: `src/apps/admin/screens/BillingMonitorScreen.tsx` (the payables panel
  `data-shot="billing-payables-run"` 121 to 143, `doRunPayables` 51), 36's
  `src/apps/admin/screens/LedgerScreen.tsx`, `src/apps/admin/screens/InvoiceDocument.tsx` (the print
  sheet to reuse), `src/apps/admin/screens/MasterData.tsx` (the settings card holding
  `contactArchiveInactivityDays`, 481), `src/apps/admin/routes.tsx` and `src/router.tsx`.
- Web: `src/apps/web/screens/AccountsScreen.tsx` (`AccountsSubTab` 19, the sub-tab buttons 62),
  `src/apps/web/routes.tsx` (`/web/accounts/:subTab` 130 to 146), `src/apps/web/WebApp.tsx`.
- Xero sim: `src/apps/demo/DemoXero.tsx` (`PairDetail`), `src/apps/demo/xeroPairView.ts`, 37's
  `xeroSimActions.ts`.
- Shared: `src/shared/format.ts` (`formatCurrency` 116, which renders a negative as "$-120.00"; add
  a signed form unless an earlier phase shipped one), `src/shared/demoClockShortcuts.ts` (`+7 days`
  59), `src/shared/audit/actionLabels.ts` (`ACTION_LABELS`), the Phase 14 registry.
- Tests to extend: `store/payablesActions.test.ts`, 37's `disbursementDetection.test.ts`,
  `ledger.test.ts`, `store/seedBilling.test.ts`, `store/persistMigrate.test.ts`,
  `store/demoScenarios.test.ts`, 14's `shared/demoTriggers/demoTriggers.test.ts`, `pwa/pwaPurity.test.ts`,
  `apps/web/screens/AccountsScreen.test.tsx`, and the Playwright specs that shoot the Billing
  monitor and the Xero pair.

## Work items

### Session 1: the run record, approval and netting

1. **Model** (`domain/types.ts`). DM-25.
   - `PaymentRunSettings`: `{ periodDays: number; periodAnchorISO: IsoDate; negativeRecoveryDays:
     number }`, stored as `settings.paymentRun` on `DemoSettings`, seeded `{ 7, '2026-07-15', 60 }`.
     Labelled provisional (OQ-47, OQ-71) in a doc comment.
   - `PayablesRun`, in a new `billing.payablesRuns` record: `{ id; periodStartISO; periodEndISO;
     sequence (1, 2 within the period); status: 'approved' | 'sentToXero' | 'paid' | 'superseded';
     approvedAtISO; approvedBy: { who; role }; lines: PayablesRunLine[]; nettings:
     PayablesRunNetting[]; carried: { negativeInvoiceId; anaesthetistId; amount }[];
     byAnaesthetist: RunAnaesthetistTotal[]; excluded: { pairId; anaesthetistId; reason:
     RunExclusionReason; amount }[]; sentAtISO?; paidAtISO?; supersededBy?; seeded?: true;
     staged?: true }`. `staged` marks a one-pair run approved by a demo stand-in (work item 5);
     `carried` records each negative (or part) the run could not net.
     - `PayablesRunLine`: `{ pairId; anaesthetistId; billNumber (the `-P` number);
       receivableInvoiceNumber; serviceDateISO; payerName; amount }`, where `amount` is what was
       approved for that leg (released less disbursed less offset less any amount already approved
       in an unsettled run).
     - `PayablesRunNetting`: `{ negativeInvoiceId; anaesthetistId; amount; allocations: { pairId;
       amount }[] }`: how much of each negative this run nets, and against which bills (oldest
       first).
     - `RunAnaesthetistTotal`: `{ anaesthetistId; positives; netted; net; carriedForward;
       destinationMasked? }`, all cents exact. `net >= 0` always.
     The run's lines and totals are frozen at approval; only the status, the dates and the derived
     detection state move afterwards.
   - `PayableLeg` gains `offsetAmount` (default 0): the part of the payable settled by netting a
     negative invoice, kept apart from `disbursedAmount` (cash) so receipts held stay true. A leg is
     settled when `disbursedAmount + offsetAmount` reaches `amount`.
   - The negative invoice (39's `NegativeInvoice`, or the record added per the drift check) gains
     `nettings: { runId; pairId; amount; atISO }[]` and `recoveryInvoiceId?`, and its `status`
     widens with `'netted' | 'carriedForward' | 'recovered'` (39's handoff: "39a adds 'netted' and
     'carriedForward' and the run it was netted in"), set in the same `mutate()` that moves the
     nettings. Its open amount is derived: `toNetAmount - sum(nettings) - (recovered amount when a
     recovery invoice exists)`; `offsetAmount` was settled by 39 and never enters a run. The
     credited pair's `credit` gains `nettedAmount` (and, in session 2, `recoveredAmount`), kept in
     step with the negative invoice in the same `mutate()`, so the pure ledger never reads the
     negative invoice records. Netting reads every open negative, whatever its credit note's
     `cause`.
   - Xero side: `XeroCreditAllocation { id; accPayCreditId (39's `XeroCreditNote` of type
     `ACCPAYCREDIT`); accPayId; amount; atISO; idempotencyKey ('CNALLOC-<id>'); payablesRunId }` in
     `xero.creditAllocations` (each one raises that credit note's `allocated`), and `XeroBatchPayment { id;
     contactId; payablesRunId; total; atISO; billPaymentIds }` in `xero.batchPayments`. The Xero
     bill payment (37's `Disbursement`) gains `batchPaymentId?`.
   - `ID_FORMATS`: `creditAllocation` (`XCA`, pad 4), `batchPayment` (`XBP`, pad 4). Session 2 adds
     the recovery kinds. Thread the new maps and the setting through `AppState`, the empty billing
     and xero slices, `freshAppState`, `resetDomainState` and `SeedBillingSlice`.
2. **Pure run maths** in a new `src/domain/billing/payablesRun.ts`, re-exported from the billing
   index, Vitest-covered (convention 9). The only place a period, a run draft or netting is
   computed.
   - `paymentPeriodFor(dateISO, settings)`: `{ startISO; endISO }` for the period containing the
     date, stepping `periodDays` from `periodAnchorISO` both ways (string date maths, no `Date`).
     `periodLabel(period)`: "15 Jul to 21 Jul 2026" (the word "to", no dash).
   - `runExclusionFor(input)`: why a leg or an anaesthetist is kept out of a run, as a
     `RunExclusionReason`. Today it excludes nothing: 26's bank details are display-only and hold no
     payout (a missing account is flagged through `missingBank` and a `null` destination, never
     excluded). If 37 shipped a `heldForBank` refusal, that refusal becomes this function's first
     reason instead, so the run and Xero agree. It is the **one exclusion point**: Phase 41 keeps a
     held prepayment's release at 0 (so a run never sees it), and any later hold that leaves a
     released amount on the leg is added here, not elsewhere; a comment says so.
   - `buildRunDraft({ legs, negatives, unsettledRuns, exclusions, period })`: per anaesthetist, the
     approvable lines (each leg's `releasedAmount - disbursedAmount - offsetAmount` less anything
     already approved in an unsettled run, positive only, sorted by service date then bill number),
     then `netNegatives` over them, then the totals. Anaesthetists with only open negatives appear
     with zero positives so their advice can show the carry forward. The legs are the ones 36's
     `payablesDue.byAnaesthetist` already sums (36's handoff: the approval sits in front of that
     figure, with no second source); the negatives are 39's open negative invoices, not negative
     legs.
   - `netNegatives(lines, negatives)`: open negatives oldest first (by `issuedAtISO`, then id), each
     netted against the remaining positives, allocating to bills oldest first; returns `{ nettings;
     carried; netted; net; carriedForward }` (`carried` per negative, for the run's record). Never nets below zero: `net = max(0, positives - open)`,
     `carriedForward = max(0, open - positives)`.
   - `remittanceAdvice(run, anaesthetistId, detection)`: the advice's rows and totals from the frozen
     run (BCTIs paid, negatives netted, net, carried forward, destination), with each line's
     detection state (`awaitingXero` or `paid` with its date) passed in. Pure; the store only
     supplies detection.
   - Tests (worked figures in cents): **US-10.2.5's acceptance criterion**, 19 positives and one
     negative give a net equal to the positives less the negative, and the advice lists all twenty;
     a negative larger than the positives nets to $0.00 with the remainder carried forward; two
     negatives, oldest first; a negative exactly equal to the positives; an anaesthetist with no
     positives; odd cents across allocations; an exclusion returned by `runExclusionFor` (stubbed)
     keeps the leg out and is reported with its amount; an anaesthetist with no bank account is in
     the run with a `null` destination; a leg already approved in an unsettled run is not approved twice; a part-released leg
     (16's half payment) approves exactly its released remainder; the period boundaries on both
     edges and across a month end; determinism (identical output on repeat).
3. **Pure ledger additions** in 36's `domain/billing/ledger.ts` (extend `ledger.test.ts`):
   - `applyOffset(pair, amount)`: adds to `payable.offsetAmount`; refused above `releasedAmount -
     disbursedAmount - offsetAmount`; stamps `paidOutAtISO` when `disbursedAmount + offsetAmount`
     reaches `amount`. `applyDisbursement`'s ceiling becomes released less disbursed less offset.
   - `ledgerPosition`: `payablesDue` subtracts `offsetAmount`; 39's `negativesToNet` becomes the sum
     of `credit.toNet - credit.nettedAmount` (less `recoveredAmount` from session 2), so every netting
     lowers it by exactly the offset it adds to a bill; a new `negativesCarriedForward` figure (open
     negatives that at least one sent run has carried forward) is shown but is part of the same
     total, not a new term. The imbalance equation 39 left does not gain a term in session 1.
     `anaesthetistPosition` keeps 39's `negativesToNet` and gains `carriedForward`.
   - `pairStatusLabel`: a leg settled partly by offset reads `paidOut` with "netted $X" detail.
   - Worked checks, pinned: before a run, positives $P released, one open negative $N (N < P) and
     the ledger in balance; after the run and detection, cash out is P - N, payables due 0, open
     negatives 0, receipts held down by exactly P - N, imbalance still 0. The same with N > P: cash
     out 0, open negatives N - P, imbalance 0.
4. **Store: approve the period's BCTIs** (a new `src/store/payablesRunActions.ts`, exported from
   `store/index.ts`). US-10.2.6.
   - Selector `payablesRunDraft(state)`: `buildRunDraft` for the period containing the demo clock's
     today, fed from the ledger alone (never `state.xero`), with `runExclusionFor` as the only
     exclusion source. A period left unapproved rolls its legs into the current one (they are still
     released and unpaid).
   - `approvePeriodBctis(api, actor)`: office only (`officeOnly`; provisional, OQ-47). A draft with
     no lines but an open negative is approvable (a carry-only run, so a departed anaesthetist's
     negative is carried by a run and its advice reads "No payment this run"). Refuses
     `nothingToApprove` ("Nothing is waiting for approval.") when the draft has no lines and no open
     negative not already carried by an unsettled run, and so a second press with nothing new
     refuses too. One `mutate()`:
     allocate the run id from the existing `payablesRun` counter and the period sequence, write the
     frozen draft. Audit `payables.runApproved` (period, sequence, line count, positives, netted,
     net, per-anaesthetist totals, exclusions) on the run.
   - **The gate.** Every path that pays a payable pays only an approved, unsettled run line:
     `runPayables`, `disbursePayable` (the Xero pair's single payout), and 37's Xero-side
     `payBillsInXero`. An unapproved released payable is refused with `notApproved` ("This payable
     is not approved for payment yet. Approve the period's BCTIs first."). This is US-10.2.6's
     acceptance criterion and the place reviewers will hunt.
   - **Stale approval.** Between approval and payment a line can go stale: its pair credited by
     Phase 39 (39 cuts a credited pair's release back to what was paid out), a new open negative
     raised for an anaesthetist in the run (it would be missed), or a new exclusion from
     `runExclusionFor`. `runPayables` re-checks the run against the ledger first; if anything changed it refuses
     `approvalStale` ("Something changed since this run was approved. Re-approve the period.") and
     the panel offers **Re-approve**, which marks the run `superseded` (with `supersededBy`) and
     approves a fresh one in one `mutate()` (audit `payables.runSuperseded` then
     `payables.runApproved`). A run is never edited in place.
   - Tests (`payablesRunActions.test.ts`): approval needs the office; a run freezes its lines; a
     payable released after approval is not in it and is in the next approval's draft; the gate
     refuses every payout path for an unapproved payable; re-approval supersedes; crediting a line's
     invoice after approval makes the run stale; a carry-only draft is approvable; approving twice
     with nothing new refuses.
5. **Store: pay an approved run in Xero, with netting** (`payablesActions.ts` and 37's
   `xeroSimActions.ts`). US-10.2.5.
   - `runPayables(api, office)` (the Billing monitor's "Run payables in Xero") takes the oldest
     approved run not yet sent and calls `payRunInXero(api, actor, runId, { webhook })`, which
     replaces 37's `payBillsInXero` for a run (keep `payBillsInXero` as its internal helper). Xero
     side only, in one `mutate()` (source demo, since it stands in for work done in Xero): per
     anaesthetist, for each netting allocation an `XeroCreditAllocation` of the ACCPAYCREDIT against
     the bill; for each bill's cash remainder a bill payment (37's `Disbursement`, `BILLPAY-` key);
     one `XeroBatchPayment` per anaesthetist for the net. The ACCPAYCREDIT's remaining credit and the
     bills' statuses move as Xero would. An anaesthetist whose net is zero gets no batch payment.
     Run status `sentToXero`, `sentAtISO`; a run with nothing to pay or allocate in Xero (carry-only)
     goes straight to `paid` in the same `mutate()`. Audit `xero.creditAllocated`, `xero.disbursed`
     (37's code) and `xero.batchPaid`.
   - Then, per webhook mode (37's rules): `deliver` with Xero available calls the engine's detection
     for each bill payment (`recordDisbursement`, unchanged) and each allocation (new, below);
     `deliver` during an outage enqueues them; `missed` does nothing and the next poll finds them.
   - **Engine detection of an allocation** (37's `disbursementDetection.ts`):
     `recordOffset(api, { accPayId, accPayCreditId, amount, atISO, idempotencyKey, detectedBy })`,
     idempotent by its `CNALLOC-` key, finds the pair by `xeroAccPayId` and the negative invoice by
     its ACCPAYCREDIT, applies the pure `applyOffset` and appends the netting to the negative invoice,
     in one `mutate()` audited `ledger.offsetRecorded` (actor "Xero webhook" or "Reconciliation
     poll", source system). The queue gains the kind `offsetSync`; `runReconciliationPoll` also
     re-detects allocations whose key the engine has not recorded, dated at the allocation's own
     `atISO`.
   - `disbursePayable(api, actor, pairId)` pays one approved line through the same path (netting
     applies only in a whole run: a single payout with an open netting allocation on that bill
     refuses `useRun`, "This bill has a negative netted against it. Pay it with its run.").
   - **The one-click demo payouts go through approval** (no back door): a store helper
     `approveAndPayPairForDemo(api, actor, pairId)` approves a one-line run for that pair only
     (`staged: true`, audit `payables.runApproved` with `staged`, actor `OFFICE_SIMULATION_ACTOR`)
     and pays it with the webhook delivered. It refuses `useRun` when the pair is already a line in
     an unsettled run and `nothingToApprove` when nothing is released and unpaid. Re-point to it:
     the Xero sim pair's in-page **Simulate payment and payout** and its payout-only "Pay
     <anaesthetist> now" (37's one click, S3 Beat 3; its message gains "the office approved it for
     payment"), and the payout half of 39's **Stage refund after payout** (which called
     `disbursePayable` and would now be refused `notApproved`). The PWA stand-in **Office runs
     payables** (36's, reworded by 38) becomes "Office approves and runs payables": one body that
     calls `approvePeriodBctis` then `runPayables` as `OFFICE_SIMULATION_ACTOR` (webhook delivered),
     disabled "Nothing due to pay out" as before. A staged run shows under Runs this period with a
     "Staged" tag. Approving part of a period stays out of scope for the office UI; this helper is
     the demo stand-ins' only form of it.
   - **Run completion** is derived: `payablesRunState(state, runId)` gives each line's detection
     (`awaitingXero` or `paid`) from the ledger, and the run becomes `paid` (with `paidAtISO`, audit
     `payables.runPaid`, source system) inside the detection `mutate()` that settles its last line.
   - Tests: 19 positives and one negative paid in one run settle every leg (cash plus offset equals
     each amount), cash out equals the net, the negative's open amount is zero, and the ledger is
     in balance; a negative larger than the positives settles the positives entirely by offset with
     no cash and leaves the remainder open; a replayed webhook, a second poll and a restored outage
     each record once; `missed` leaves the run `sentToXero` until the poll; the stale-approval
     refusal; a single payout refused on a netted bill; conservation on every pair (disbursed plus
     offset at most released); a carry-only run goes to `paid` with no Xero batch payment;
     `approveAndPayPairForDemo` pays only its pair and refuses a pair already in an unsettled run;
     Simulate payment and payout, Stage refund after payout and the PWA stand-in still pay out (S3
     Beat 3 and 39's staging unchanged in effect).
6. **Formatting.** `formatSignedCurrency(n)` in `src/shared/format.ts`: "-$120.00" with a
   hyphen-minus for negatives, "$120.00" otherwise (Vitest, including -0.005 rounding and zero).
   Every negative amount in this phase renders through it.
7. **Billing monitor: the payment period panel** (`BillingMonitorScreen.tsx`, replacing the
   payables panel; keep `data-shot="billing-payables-run"` on the run button's container).
   - Header "Payment period · 15 Jul to 21 Jul 2026" (mono dates) with the provisional chip.
   - **Awaiting approval** (`data-shot="payables-run-draft"`): a table from `payablesRunDraft`, one
     row per anaesthetist (`drSurname`), BCTIs (count), Positives, Negatives to net, Net, Carried
     forward, a "No bank account" warning pill where 26 flags a missing account (flag only, the line
     is still approved), and any exclusion with its reason; expandable to the lines. Empty state:
     "Nothing is waiting for approval." Primary teal **Approve
     period's BCTIs**, disabled with its refusal sentence. Caption: "A released payable is paid only
     once the period's BCTIs are approved. Approver to confirm with AA."
   - **Runs this period** (`data-shot="payables-runs"`): each run (id, sequence, approved by and
     when, net total, status pill: Approved neutral, Sent to Xero warning, Paid success, Superseded
     neutral, plus a neutral "Seeded" or "Staged" tag on backdrop and demo stand-in runs), linking to
     its detail. "Run payables in Xero" (37's button and `DemoBadge`) acts on
     the oldest approved run and is disabled "Nothing approved to pay" otherwise; on
     `approvalStale` it shows the sentence and a **Re-approve** button.
   - The result line reports, for example, "Run PR0003 sent to Xero: 19 BCTIs, 1 negative invoice
     netted, $X paid to 1 anaesthetist." (the run id and figures from the running app).
8. **Session 1 trigger and stop point.** Register `stage-payment-period` now (its row in the Demo
   triggers table; body as work item 15 describes, including the "with a credit after payout"
   choice and its fixture builder), so session 1's netting is demoable at the stop point; the rest
   of the triggers land in item 15. Bump `PERSIST_VERSION` by one (the new slices, setting and leg
   field).
   Extend `persistMigrate.test.ts` (a stale payload is discarded to the fresh seed). Two fresh seeds
   deep-equal. `npm run build`, `npm run build:pwa` and `npx vitest run` green, and the session 1
   part of the manual checklist passes, before session 2 starts. S4 Beat 5 already needs its new
   Approve step: patch it now if the session ends here.

### Session 2: remittance advice, carry forward and recovery

9. **Admin: the run detail and the remittance advice.**
   - Route `/admin/billing/payables-runs/:runId` (`AdminPayablesRunRoute`, a `RequireEntity` 404
     guard; the side nav keeps Billing monitor active): the run header (period, sequence, approved
     by and when, sent, paid, status pill, a "Superseded by PR0004" link where relevant), the
     per-anaesthetist totals table, the exclusions, and each anaesthetist's **Remittance advice**
     link. `data-shot="payables-run-detail"`.
   - Route `/admin/billing/payables-runs/:runId/remittance/:anaesthetistId`
     (`AdminRemittanceRoute`): the remittance advice document, reusing `InvoiceDocument`'s print
     sheet. Heading **REMITTANCE ADVICE**; from Anaesthesia Associates as agent (22's supplier and
     agent block); to the anaesthetist (name, HPI CPN, GST number from 26's profile); the run id and
     period; paid on (the batch payment date, or "Awaiting confirmation from Xero"); paid to (26's
     masked account, or "No bank account on file"). Lines: BCTI number, invoice number, service date, payer, amount (mono); then
     each negative netted, "Negative invoice CN-2026-0001-P · credit of AA-2026-0007" (the numbers
     39 shipped), as a signed amount. Totals: "BCTIs paid $P", "Negatives netted -$N", "Paid to you $P - N" (computed, shown
     as one figure), and "Carried forward to your next payment run $X" with the OQ-71 provisional
     label when non-zero. No NHI, no patient detail beyond the payer name the BCTI already carries.
     Rail: Print, the run link, and the Xero card ("Batch payment XBP0002 · $X", "Credit allocated
     $N"). `data-shot="remittance-advice"`. A remittance has a derived reference
     `RA-<runId>-<registration number>`, shown on the document.
   - The Admin Ledger's per-anaesthetist view (36) gains a **Payment runs** card (each run with net,
     netted, status and its advice link) and shows 39's **Negative invoices to net** and
     **Carried forward** with the provisional label. The whole-ledger view shows 39's "Negative
     invoices to net" total with "of which carried forward $X".
   - The Xero sim pair detail shows, on an ACCPAY, "Paid in batch XBP0002" and any credit
     allocated against it; on the ACCPAYCREDIT, its allocations and remaining credit.
10. **Web Accounts: Remittances** (US-10.2.5, the anaesthetist's side).
    - `AccountsSubTab` gains `'remittances'` (`/web/accounts/remittances`), a sub-tab button
      "Remittances" after "Payments". A table of the persona's advices, newest first: paid on, run,
      BCTIs, netted (signed), paid to you, status pill (Paid, Awaiting Xero); a row opens the advice
      in a side sheet (`useSurface`), the same content as the Admin document, read only.
      `?run=PR0003` focuses a row, as 16's `?invoice=` does.
    - When the persona has open negatives or a carried-forward balance, a panel above the table:
      "You have $X carried forward. It is netted against your next payment run." with the OQ-71
      provisional chip; once a recovery invoice exists, "AA has invoiced you $X for the carried-forward
      balance" with its number and a Paid or Unpaid pill (session 2, item 12).
    - 38's GST schedule (cash basis): confirm that a bill settled partly by offset counts at its
      full amount on its settlement date and the netted negative shows as a negative row on the
      same date, so the period's figures equal the net cash plus nothing else. Fix only the selector
      if it reads cash disbursements alone; label the treatment provisional (AA's accountant,
      OQ-29). The Payments tab shows the net cash per run.
    - Mobile Balances is not changed (the catalogue's remittance is web and Admin).
    - `data-shot` hooks: `web-remittances`, `web-remittance-sheet`, `web-carried-forward`.
11. **Pure carry forward** (`payablesRun.ts`):
    - `carriedForwardBalances({ negatives, runs, todayISO, settings })`: per anaesthetist, the open
      negatives that at least one sent or paid run (never a superseded or merely approved one) has
      carried forward (so netting has had its chance), each
      with its age in days from `issuedAtISO` to today and `dueForRecovery = age >=
      negativeRecoveryDays`. Pure, string date maths.
    - `recoveryInvoiceDraft(anaesthetist, balances)`: one line per negative recovered ("Recovery of
      negative invoice CN-2026-0001-P, issued 27 May 2026, carried forward"), subtotal, GST per
      `RECOVERY_INVOICE_GST` (none, provisional), total equal to the open amounts.
    - Tests: age at 59, 60 and 61 days; a negative never carried by a run is not due; a part-netted
      negative recovers only its remainder; two negatives for one anaesthetist give one draft with
      two lines; a changed setting changes eligibility; determinism.
12. **Store: invoice carried-forward balances** (`payablesRunActions.ts`). OQ-71's recommendation.
    - Model: `RecoveryInvoice` in a new `billing.recoveryInvoices` record: `{ id; invoiceNumber;
      anaesthetistId; negativeInvoiceIds; lines; subtotal; gst; total; raisedAtISO; raisedBy;
      ledgerPairId }`. Ledger: a receivable-only `LedgerPair` kind `'recovery'` (like 36's
      `'aaFee'`, counterparty the anaesthetist). `XeroAccRec.kind` gains `'recovery'`. `ID_FORMATS`:
      `recoveryInvoice` (`RI`, pad 4) and `recoveryInvoiceNumber` (`AA-RCV-2026-`, pad 4; numbering
      provisional).
    - `invoiceCarriedForwardBalances(api, actor)`: office only (the product button; a scheduled
      system form is not built). Refuses `nothingDue` ("Nothing has been carried forward for 60
      days.", the number read from the setting). One `mutate()`: for each anaesthetist with balances
      due, build the draft, raise it through **16's `raiseAnaesthetistInvoiceInto`** (generalised to
      take the document kind, number and lines, so the record and its ACCREC against the
      anaesthetist's existing Xero contact come from the one path; no second invoice path), create
      the `'recovery'` pair, and stamp `recoveryInvoiceId` (status `'recovered'`) on each negative
      and `credit.recoveredAmount` on its credited pair, so its open amount becomes zero. Idempotent: a negative already recovered is never invoiced twice. Audit
      `recovery.invoiceRaised` (entity `recoveryInvoice`, with the negatives and their ages) and
      `xero.recoveryAccRecCreated`.
    - Ledger equation: the recovered amount moves from the open negatives total to a new
      `recoveryInvoicesOutstanding` figure, so `ledgerPosition`'s imbalance gains `+
      recoveryInvoicesOutstanding` beside 39's `negativesToNet` term (both are money owed back by
      anaesthetists). A recovery pair is never AA fee income (`aaFees` totals exclude it), never a
      BCTI (`bctiRecords` reads procedure ACCPAYs only), never in GST activity and never in a run.
    - Payment: generalise 16's `recordAaFeePayment` into `recordAnaesthetistInvoicePayment` (or add a
      recovery branch beside it) so a payment on a `'recovery'` ACCREC lands as a `LedgerReceipt`
      on the recovery pair (`pairKind: 'recovery'`, receipts held go up, outstanding goes down).
      Extend 16's guards: `receivePayment` refuses a `kind:'recovery'` ACCREC, `openAccRecs`
      excludes it, the poll skips it.
    - `anaesthetistPosition`: `theyOweAa` stays the AA fee figure; a separate `recoveryOwed` shows
      the recovery invoices unpaid.
    - Tests: the departed-anaesthetist path end to end (negative carried forward, aged past the
      setting, invoiced once, paid), the ledger in balance at every step (pin the figures), the
      refusal before the setting, a rerun raising nothing, the guards, and that the AA fee run and
      `bctisFor` are unchanged by a recovery invoice.
13. **Admin UI for carry forward and recovery.**
    - Billing monitor: a **Carried-forward balances** panel (`data-shot="carried-forward"`), shown
      when any exist: anaesthetist, negatives, open amount, carried forward since, age in days, and
      "Due for recovery" (warning pill) past the setting. Primary teal **Invoice carried-forward
      balances**, disabled "Nothing has been carried forward for 60 days." Caption: "A negative
      invoice with no later payment to net against is carried forward, then invoiced to the
      anaesthetist after 60 days. Provisional · recovery to confirm with AA's accountant (OQ-71)."
    - The recovery invoice document: route `/admin/billing/recovery-invoices/:recoveryInvoiceId`
      (`RequireEntity`), the print sheet with heading **TAX INVOICE** only if GST applies, otherwise
      **INVOICE**, from AA (not as agent: it is AA's own claim), to the anaesthetist, its lines,
      total, the GST caption, Delivery (22's label and "Simulated send"), and the Xero card.
      `data-shot="recovery-invoice"`.
    - Admin Invoices screen: recovery invoices join with Kind **Recovery**; 16's AA fee invoices
      screen is not changed.
    - Master data settings card: a **Payment runs** group under "Xero & archiving" with period length
      (days), recovery after (days), both validated (whole days, 1 or more), saved through
      `savePaymentRunSettings(api, actor, next)` (office only, audit `settings.paymentRunChanged`),
      and the two provisional captions. The anchor date is not editable in the prototype.
14. **Backdrop runs in the seed.** The seeded disbursements (Dr Souter's history, `'PR-HIST-01'`,
    and the seeded prepayment payout, `'PR-SEED-01'`, plus any other seeded payout the earlier
    phases added) are grouped into backdrop `PayablesRun` records, one per distinct disbursement
    date, each numbered within the payment period of that date (`paymentPeriodFor` over the seed's
    setting), in the `H` id namespace (`PRH01`, `PRH02` ...), status `paid`, `seeded: true`,
    approved by "Office (seeded)" at 08:00 on the disbursement date (approval always precedes
    payment), with their lines and totals built by `buildRunDraft` from the seeded legs (never
    typed-in figures) and no negatives. 16's generalised history account builder writes a backdrop
    run the same way for every payout it builds, so "Seed a month of BCTIs" and this phase's
    fixtures leave no payment without a run. Each seeded
    `LedgerDisbursement` and Xero `Disbursement` takes its run's id, and each seeded anaesthetist
    gets a backdrop `XeroBatchPayment` per run. Dr Souter's web Remittances tab is populated on
    load. No seeded money figure moves: assert Dr Souter's ledger position, the whole-ledger
    position, the GST schedule and S3's figures are identical before and after. At plan time two
    seeded payouts fall **inside the current period** (Dr Souter's pa01 on 15 Jul and the seeded
    prepayment payout on 16 Jul; Phase 41 later removes the second by holding it in trust), so
    "Runs this period" opens with backdrop runs marked Paid and "Seeded", and the first live
    approval takes the next sequence and the next `PR` id. Earlier backdrop runs show only on the run
    detail, the Ledger and the advices.
15. **Triggers, persistence and copy.**
    - Register the remaining triggers in the table below through the Phase 14 registry and re-point
      the existing ones (`stage-payment-period` landed in session 1); bodies in `src/store` or
      `src/shared`; nothing added to the Control Panel page.
    - `stage-payment-period` (registered in session 1, work item 8) builds its 19 accounts for Dr
      Sharma with **16's generalised history account builder** in its own deterministic id
      namespace (`PP`), raised and handed off but unpaid (ledger pairs and Xero pairs created as the
      builder does). Their service dates follow 16's rule: weekdays **before the canvas horizon
      start** (`horizonFor(DEMO_TODAY).startISO`), AM and PM Lists of five Bookings, so no added List
      collides with a generated canvas List. It then records each payment at the demo clock's now
      (inside the current period) through the ordinary `receivePayment` webhook path with keys
      `STAGE-PP-n`, so release follows US-10.2.1 exactly. One audit entry for the staging, then the
      ordinary payment entries. Its `choices`: "19 BCTIs" and "19 BCTIs and a credit after payout";
      the second also builds, with the shared **credit-after-payout fixture builder** below, one
      earlier Dr Sharma invoice paid, paid out through its own backdrop run and credited in full,
      so one negative invoice with its whole total to net is open for Dr Sharma. The 19 add to Dr
      Sharma's July BCTI count (16's fee preview shows it; that is correct).
    - The **credit-after-payout fixture builder** (`domain/seed/`, pure, shared by both staging
      triggers): builds a backdrop, like the seeded history (not replayed actions), of one invoice
      raised, paid and paid out through its own backdrop run, then credited in full with 39's pure
      `creditInFull`, `reversalPlan` and `applyCredit` (credit note cause `'correction'`, the
      payer's credit held, no rebill: the payer had paid twice), giving 39's `NegativeInvoice` with
      `toNetAmount` equal to the total, its ACCPAYCREDIT and the pair's `credit.toNet`. Never a
      second credit path: if the builder cannot reuse 39's pure functions, stop and tell the owner.
    - `stage-departed-anaesthetist` uses that builder for Dr Strand in its own `PD` namespace: paid
      and paid out in May, credited with the negative's `issuedAtISO` derived as the demo clock's
      today less 55 days (27 May 2026 at the seeded clock, so the dates move with a reset clock),
      and no released payables. Dr Strand stays `active` (the trigger stands for an anaesthetist who
      has stopped working with AA; the roster is not changed).
    - Bump `PERSIST_VERSION` by one again for the recovery slices, the backdrop runs and the settings
      group (or once for the phase if both sessions ship as one change; record from and to). Extend
      `seedBilling.test.ts` (two builds deep-equal, backdrop runs reproduce the seeded disbursements
      exactly, `resetDomainState` restores them) and the migrate test.
    - Every new audit action gets a label in `ACTION_LABELS` (`src/shared/audit/actionLabels.ts`): `payables.runApproved`,
      `payables.runSuperseded`, `payables.runPaid`, `ledger.offsetRecorded`, `xero.creditAllocated`,
      `xero.batchPaid`, `recovery.invoiceRaised`, `xero.recoveryAccRecCreated`,
      `recovery.paymentRecorded`, `settings.paymentRunChanged`.
    - Copy sweep: no en or em dash in any new string; no "weekly", "Wednesday", "Tuesday" or "the
      20th" in app copy while OQ-47 is open; every negative through `formatSignedCurrency`.
16. **Tests, shots and docs close-out.** `demoTriggers.test.ts` covers the new and re-pointed entries
    (routes, surfaces, disabled states, the pinned per-screen counts, the PWA stand-in's new label
    and body) and `pwaPurity.test.ts` stays green; `demoScenarios.test.ts` drives the rewritten S4 Beat 5 and both asides at store level.
    `AccountsScreen.test.tsx` covers the Remittances tab (rows, signed amounts, focus, the
    carried-forward panel). Playwright: a new `visual/admin-phase39a.spec.ts` (the payment period
    panel before and after approval, a run detail, a remittance advice with a netted negative, the
    carried-forward panel, a recovery invoice) and a web shot of the Remittances tab and sheet;
    update any spec that shot the old payables panel. Re-point the US-10.2.1 capture recipe in
    `requirements-board/capture/recipes/` if it shoots the payables panel, add the new `data-shot`
    hooks and demo actions to `requirements-board/capture/ATLAS.md`, and run `npm run verify:board`
    from the repo root. Then the demo guide (below) and PROGRESS.

## Demo triggers

The headline actions are **product UI**, not demo triggers: **Approve period's BCTIs**, **Run
payables in Xero** (37's button, badged Simulated Xero), **Re-approve**, and **Invoice carried-forward
balances**, all on the Admin Billing monitor. The Xero sim pair's in-page **Simulate payment and
payout** stays an in-page simulator button (37's), re-pointed through `approveAndPayPairForDemo`.
What the registry gains or changes:

| Label | Screen | Surface | Effect |
|---|---|---|---|
| Stage a payment period (new, `stage-payment-period`, session 1) | Admin · Billing monitor (`/admin/billing`) | bar | `choices` "19 BCTIs" / "19 BCTIs and a credit after payout". 19 receivable invoices for Dr Sharma, each paid through the ordinary webhook, so 19 BCTIs are released and waiting for approval; the second choice also leaves one open negative invoice for Dr Sharma (the credit-after-payout fixture). Result: "19 payables released for Dr Sharma. Approve the period's BCTIs to pay them." (plus "A negative invoice of $X is waiting to be netted." for the second choice). Disabled "Already staged for this period" |
| Stage refund after payout (Phase 39's, re-pointed) | as Phase 39 registered it | bar | Its payout half now goes through `approveAndPayPairForDemo` (a one-line staged run) instead of `disbursePayable`, which the gate refuses. Its result gains "Once credited, the negative invoice is netted in Dr Sharma's next payment run." The live path for the netting aside: this trigger, then 39's Credit and rebill on the invoice, then Approve and Run |
| Stage departed anaesthetist (new, `stage-departed-anaesthetist`, session 2) | Admin · Billing monitor | bar | Backdrop for Dr Strand: a credit after payout 55 days ago, a negative invoice and no payables. Approve and run carries it forward (a carry-only run); a `+7 days` clock jump takes it past 60 days, and **Invoice carried-forward balances** invoices it. Result: "Dr Strand owes $X from a credit after payout, with no later payment to net against. Approve and run the period, then jump the clock 7 days." Disabled "Already staged" |
| Pay anaesthetist in Xero (payables run) (Phase 37's `xero-pay-bill`, re-pointed) | Xero sim pair (`/demo/xero/invoices/:accRecId`) | bar | Pays the pair's bill only when it is an approved, unsettled run line with no netting on it. Disabled "Not approved for payment yet" or "Pay this bill with its run" |
| Record fee payment (Phase 16's, re-pointed) | Xero sim pair, `kind:'aaFee'` or `kind:'recovery'` | bar | On a recovery ACCREC: "Record payment from the anaesthetist", landing on the recovery pair. Disabled "Already paid" |
| Office runs payables (Phase 36's PWA stand-in, reworded by 38, re-pointed) | Mobile · Balances (`/mobile/balances`) | PWA only, badged office stand-in | Becomes "Office approves and runs payables": `approvePeriodBctis` then `runPayables` as `OFFICE_SIMULATION_ACTOR`, webhook delivered. Message names the approval and the amount paid out to Dr Souter. Disabled "Nothing due to pay out" as before |

The `+7 days` jump is the existing clock shortcut (`src/shared/demoClockShortcuts.ts`); nothing new is
needed for the age.

PWA parity: the remittance advice is web and Admin, and the mobile Balances screen gains nothing, so
no new PWA entry is registered. The one existing PWA path that pays out, 36's "Office runs payables"
stand-in, is re-pointed above so the PWA build still pays out through an approval. Confirm no new
entry shows in the PWA sheet, the re-pointed stand-in works in `npm run build:pwa`, and
`pwaPurity.test.ts` stays green; Phase 44's audit records "no new mobile beat; the PWA payout
stand-in approves first".

## Out of scope

- **The payment day and cycle** (OQ-47): Greg's weekly accounting cycle (ISO week, Friday close,
  Monday working day, Tuesday schedule to Michael) and the separate monthly 20th cycle are not
  modelled beyond the period setting. No scheduled run and no automatic approval.
- **Approving part of a period** (per anaesthetist or per BCTI) in the office UI (the demo
  stand-ins' one-line staged run is the only exception), a second-person check on approval, and
  editing a run once approved (it is superseded, never edited).
- **Netting the AA fee** against payables (OQ-60; the fee stays a separate receivable).
- **Refunds as a live action** (cancellation refunds, the trust account and its hold): Phase 41.
  This phase nets any negative whatever its credit note's cause and leaves `runExclusionFor` as
  the one exclusion point for any later hold.
- **Collections on a recovery invoice** (reminders, interest, write-off, a payment plan) and a
  scheduled recovery job: OQ-71 says only "invoice them".
- Emailing the remittance advice, a bank file (ABA) export, and mobile remittance views.
- A real Xero batch payments API: the Xero side stays the simulation.
- Changing what a BCTI is or how many there are (OQ-29), or the AA fee count (16).

## Manual test checklist

Take run ids, sequences and figures from the running app; the ids below are examples.

Session 1 (after **Reset → Confirm reset**):

- [ ] Admin · Billing monitor shows **Payment period · 15 Jul to 21 Jul 2026** with the provisional
      chip, an empty Awaiting approval table ("Nothing is waiting for approval.") and Approve
      disabled with that sentence.
- [ ] S4 Beat 5 path: Admin · Invoice for Hemi Walker's clean St George's sibling, **Payment
      received · half**: the Billing monitor's draft shows one Dr Ropata BCTI at exactly half;
      **Run payables in Xero** is disabled "Nothing approved to pay".
- [ ] **Approve period's BCTIs**: a new run, Approved, with its frozen line. **Run payables in
      Xero**: the run goes to Paid (webhook delivered), the ledger shows half disbursed, and the Xero
      sim shows the bill payment in a batch payment.
- [ ] **Payment received · full** on the same invoice: the remaining half appears in the draft, not
      in the first run. Approve again: a second run with the next sequence in the period. Run: the
      leg is paid out in full, never more.
- [ ] On the Xero sim pair of a released but unapproved payable, "Pay anaesthetist in Xero" is
      disabled "Not approved for payment yet".
- [ ] S3 path: on AA-2026-0005's Xero sim pair, **Simulate payment and payout** still pays out in
      one click; a Staged run for that one bill shows under Runs this period as Paid, and the
      message names the approval.
- [ ] **Stage a payment period → 19 BCTIs and a credit after payout**: the draft shows Dr Sharma
      with 19 BCTIs, one negative to net and the net. Approve, then Run: the result line names 19
      BCTIs and 1 negative invoice netted; Dr Sharma's ledger position shows no negative to net; the
      whole ledger is in balance; the Xero sim shows the ACCPAYCREDIT allocated and one batch
      payment for the net.
- [ ] Live netting path: Phase 39's **Stage refund after payout** (after 14's Stage post-op
      scenario) pays out through a Staged run; credit the invoice with 39's Credit and rebill; the
      next draft shows its negative to net for Dr Sharma.
- [ ] Stale approval: after Reset, Stage a payment period (19 BCTIs) and Approve, then credit one of
      the 19 invoices with 39's Credit and rebill before running: Run payables refuses "Something
      changed since this run was approved. Re-approve the period."; Re-approve supersedes the run
      and the new one holds 18 BCTIs.
- [ ] Simulate Xero outage (37), then Run payables: the run is Sent to Xero with lines Awaiting
      Xero; Restore Xero drains the queue and the run becomes Paid with no duplicate disbursement or
      offset.
- [ ] PWA build, Mobile · Balances: Payment received · half, then **Office approves and runs
      payables**: Paid out rises by exactly what was released.
- [ ] Stop point: `npm run build`, `npm run build:pwa` and `npx vitest run` green.

Session 2 (after **Reset**):

- [ ] Admin · Billing monitor: Runs this period opens with the seeded backdrop runs for 15 and 16 Jul,
      Paid and tagged Seeded.
- [ ] Web · Accounts (Dr Souter) has a **Remittances** sub-tab listing her backdrop runs; each opens
      its advice; her Outstanding, Payments and GST schedule figures are unchanged from before this
      phase.
- [ ] Stage a payment period with the credit after payout, approve and run: Admin · run detail
      lists Dr Sharma's totals; her **Remittance advice** lists 19 BCTIs, "Negative invoice
      CN-2026-...-P · credit of AA-2026-..." as a signed amount, and "Paid to you" equal to the net;
      the paid-to account is masked. Switch to Dr Sharma on the web: the same advice under
      Remittances.
- [ ] **Stage departed anaesthetist**: the Carried-forward balances panel is empty until a run has
      carried it. Approve (a carry-only run) and run: Dr Strand's advice reads "No payment this run"
      and "Carried forward to your next payment run $X"; the panel lists him at 55 days; **Invoice
      carried-forward balances** is disabled "Nothing has been carried forward for 60 days."
- [ ] **+7 days**, then **Invoice carried-forward balances**: one AA-RCV-2026-0001 invoice to Dr
      Strand for $X with no GST and the GST caption; Dr Strand's negatives to net are zero and "AA
      has invoiced you" shows on his web Accounts; a second press is disabled.
- [ ] On the recovery invoice's Xero pair, **Record payment from the anaesthetist**: Paid; the whole
      ledger stays in balance at every step (check after stage, run, invoice and payment).
- [ ] The AA fee run preview (16) shows the same BCTI counts before and after the recovery invoice;
      the recovery invoice is not in AA fee totals.
- [ ] After Reset, Master data · Payment runs: set recovery after to 90 days and save (audited);
      then stage the departed anaesthetist, approve, run and jump +7 days: the negative is not yet
      due.
- [ ] Admin · Audit shows each new action with the right who, role and source (office for approval
      and recovery, the office stand-in for staged runs, system for detection, demo for the
      Xero-side batch payment).
- [ ] No en or em dash in any new string; no weekday, "weekly" or "20th" in app copy; negatives read
      "-$X.XX"; teal is the only action colour; crimson unused on the new screens.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots` green; `npm run
      verify:board` green.

## Demo guide updates

This is a **milestone phase** (the "After 39a" money story): end with a consistency read of
`master-demo-guide.html` against the run sheet. Take every figure, number and label from a reset
run of the built app.

- **`03-demo-script.md`:**
  - **S4 Beat 5** becomes "Beat 5: partial payment, approval and the payment run": Payment received
    half, then **Approve period's BCTIs**, then **Run payables in Xero**; Payment received full,
    approve again, run again; open the remittance advice. Say: "A payable is released when its
    receivable is paid, exactly the amount received. Before anything is paid, the office approves
    the period's BCTIs. Two runs across a part-then-balance payment never pay twice, and every run
    leaves a remittance advice." Expected: two runs, the leg paid exactly once in full, two advices.
  - Optional aside, **netting**: Stage a payment period → "19 BCTIs and a credit after payout",
    approve, run, open Dr Sharma's remittance advice. Say: "A refund or a credit after the
    anaesthetist was paid is a credit note to the payer and a negative invoice to the anaesthetist,
    netted in their next run: nineteen positives and one negative, one net payment." Note the live
    path for a longer session (39's Stage refund after payout, then Credit and rebill, then approve
    and run).
  - Optional aside, **nothing to net against**: Stage departed anaesthetist, approve and run, +7
    days, Invoice carried-forward balances. Say: "If there is no later payment, the balance is
    carried forward and, after a set period, invoiced to the anaesthetist. That is our proposal; the
    rule is AA's accountant's to confirm."
  - **S3 Beat 3** (37's one-click "Simulate payment and payout"): the click is unchanged, but it now
    approves a one-bill staged run before Xero pays it. The Say line gains "the office approves it
    for payment"; Expected gains the Staged run under the Billing monitor's Runs this period.
  - The **Direct URLs** table gains "A payables run · `/admin/billing/payables-runs/<runId>`", "A
    remittance advice · `/admin/billing/payables-runs/<runId>/remittance/<registration>`" and "Web
    remittances · `/web/accounts/remittances`".
  - The S4 discovery points gain OQ-47 (who approves, the cycle) and OQ-71 (recovery with no later
    payment), one line each.
- **`02-workflows-and-handoffs.md`:** Workflow 7 (payments and payables) gains the approval step, the
  run record and the remittance advice; the correction after payout case (39's) gains "netted in
  the next run"; a short "Negative with nothing to net against" case (carry forward, then invoice,
  provisional).
- **`04-presenter-cheat-sheet.md`:** "Built and clickable" gains BCTI approval, netting and
  remittance advice; "The money model" gains "approve, then pay; negatives net; remittance per run";
  "Strong phrases" gains "Nothing is paid until the period's BCTIs are approved"; "Statements to
  avoid" gains "we pay every Tuesday" (OQ-47 is open).
- **`01-personas-and-responsibilities.md`:** the office approves each period's BCTIs and invoices
  carried-forward balances; the anaesthetist reads their remittance advice in web Accounts.
- **`README.md`:** the readiness row for payables.
- **`master-demo-guide.html`:** the same sections (S4 Beat 5, the asides, the cheat-sheet
  equivalents, the workflows), then the milestone consistency read.
- **Control Panel scenario text:** the S3 and S4 messages, where they mention "Run payables" or the
  payout, gain the approve step. The PWA stand-in's new label, "Office approves and runs payables",
  goes wherever the guide names it.

## Adversarial review (after build)

Once the manual test checklist and `npm run build`, `npm run build:pwa`, `npx vitest run` and
`npm run shots` are green, and before writing the PROGRESS entry, run the standard **adversarial
review-and-fix pass (PROGRESS convention 18)**:

- fan out four independent Opus review subagents, for **quality**, **bugs/correctness**, **plan
  adherence** and **money integrity** (conservation and idempotency, as the Phase 08 to 10 and 36 to
  39 money phases did), each given the covered catalogue files, this doc and the diff;
- this session then independently verifies every finding against the catalogue, this doc and the
  code, fixes the confirmed ones (with a test wherever a bug had none), re-greens, and records the pass
  in the phase entry;
- do not re-raise anything already settled in the Decisions log (as amended by this phase).

**Steer this phase's reviewers at:**

- **The approval gate.** No path pays an unapproved payable: `runPayables`, `disbursePayable`, the
  Xero-side bill payment, the re-pointed Xero pair trigger, the Xero sim's Simulate payment and
  payout, 39's Stage refund after payout, the PWA stand-in, a replayed webhook, the poll and the
  outage queue. A staged run covers exactly its one pair. A run's lines never change after approval; a stale run is superseded, never edited.
- **Money conservation, in cents.** For every run: cash out per anaesthetist equals positives less
  netted, never below zero; each leg's disbursed plus offset never exceeds released; each negative's
  nettings plus any recovery never exceed its `toNetAmount`; the whole ledger and every anaesthetist's position stay in
  balance after approval, after sending, after detection and after a recovery invoice and its
  payment. Hunt for an offset counted as cash (receipts held would drift) or a negative netted twice.
- **Idempotency.** `CNALLOC-` and `BILLPAY-` keys make every detection once-only through webhook,
  poll and queue; approve, run, re-approve and invoice carried-forward balances are safe to press
  twice.
- **Carry forward and recovery (OQ-71).** Only negatives a run has carried forward, aged past the
  setting, are invoiced; each once; through 16's `raiseAnaesthetistInvoiceInto`, not a second path;
  never AA fee income, never a BCTI, never GST activity, never in a run. The rule lives in one pure
  function and one store action over one setting.
- **The period is a setting.** No weekday, cycle or 20th in code or copy; string date maths only;
  no `Date.now()`, `new Date()` or `Math.random()`.
- **Hooks left for 41.** `runExclusionFor` is the only exclusion point; netting reads every open
  negative whatever its credit note's cause; a missing bank account is flagged, never excluded.
- **Seed and persistence.** Backdrop runs reproduce the seeded disbursements exactly and move no
  figure; two fresh seeds deep-equal; `PERSIST_VERSION` bumped; the staging bodies are deterministic.
- **Design and copy.** Signed amounts through one formatter with a hyphen-minus, neutral not red;
  teal the only action colour; provisional labels for OQ-47, OQ-71 and the recovery GST; no en or em
  dashes in app copy.

## PROGRESS.md updates

- **Status row** for catch-up Phase 39a, and a phase entry with:
  - the drift-check result (US-10.2.5 and US-10.2.6 still Verify or not; OQ-47, OQ-71, OQ-60 and
    OQ-29 status; whether 39 shipped a negative invoice record or this phase added it);
  - what was built, with the name map for later phases: `PaymentRunSettings`, `PayablesRun` and its
    line, netting and total types, `paymentPeriodFor`, `periodLabel`, `runExclusionFor`,
    `buildRunDraft`, `netNegatives`, `remittanceAdvice`, `carriedForwardBalances`,
    `recoveryInvoiceDraft`, `RECOVERY_INVOICE_GST`, `applyOffset` and `PayableLeg.offsetAmount`, the
    ledger figures added, `payablesRunDraft`, `approvePeriodBctis`, `payRunInXero`, `recordOffset`,
    `payablesRunState`, `invoiceCarriedForwardBalances`, `RecoveryInvoice` and the `'recovery'` pair
    kind, `recordAnaesthetistInvoicePayment`, `savePaymentRunSettings`, `formatSignedCurrency`,
    `XeroCreditAllocation`, `XeroBatchPayment`, `approveAndPayPairForDemo`, the credit-after-payout
    fixture builder, the routes, id formats and audit actions;
  - the `PERSIST_VERSION` bump or bumps (from and to);
  - tests added and the before and after Vitest and Playwright counts;
  - the review pass.
- **Decisions log:**
  1. **Amended:** 2026-07-24 "Phase 10 build - decisions" item (5), the payables run as an
     unbadged office action, and Phase 37's "Run payables in Xero pays every due bill": a released
     payable is paid only once the period's BCTIs are approved; the run is a record per period,
     frozen at approval, superseded rather than edited. The one-click demo payouts (Simulate payment
     and payout, Stage refund after payout, the PWA stand-in) approve first, through a one-pair
     staged run or the ordinary approval.
  2. **New:** the office approves (provisional, OQ-47); the period is a setting (7 days from Wed 15
     Jul, provisional); a period may hold supplementary runs; no copy names a payment day.
  3. **New:** netting is decided by the engine at approval, executed in Xero as an ACCPAYCREDIT
     allocation and a net batch payment, and recorded by the engine at detection; the offset is
     its own leg amount, never cash.
  4. **New:** OQ-71's recommendation built in full and provisional: carry forward, then a recovery
     invoice through 16's anaesthetist invoice path after 60 days (a setting), with no GST
     (provisional), as its own receivable-only ledger pair.
  5. **New:** seeded disbursements are grouped into backdrop runs, so every payment has a run and an
     advice.
  6. If 39 recorded the payout case as a trail only: **superseded**, the negative invoice is a
     record netted in the next run (OQ-42 answered).
- **Handoff notes:**
  - For **41**: a held prepayment's release stays 0, so a run never sees it; if a hold ever leaves a
    released amount on the leg, add it to `runExclusionFor`, nowhere else. A cancellation refund
    after payout goes through 39's credit path with 41's refund cause and raises a negative invoice
    the next run nets with no change here. The seeded prepayment payout's backdrop run is rebuilt
    by `buildRunDraft` when 41 reseeds the hold; the moved prepaid Booking's payee repoint (US-06.5.4) changes the run line's
    anaesthetist through the pair, not the run.
  - For **16 / OQ-60**: if the fee is ever netted against payables, `netNegatives` is the place;
    today it never sees a fee invoice.
  - For **38**: the GST schedule's treatment of an offset-settled bill and a netted negative, as
    built and labelled.
  - For **43**: runs with many lines and many anaesthetists must stay usable at full scale.
  - For **44**: S4 Beat 5 and its two asides and S3 Beat 3 as rewritten here; the OQ-47 and OQ-71
    lines if answered later; for the PWA parity audit, "no new mobile beat; the PWA payout stand-in
    approves first".
