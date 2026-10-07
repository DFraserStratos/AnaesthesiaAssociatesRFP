# Phase 39a · Payment runs: BCTI approval, netting and remittance

**Requirements covered:**
[US-10.2.5](../../../../requirements-board/requirements/stories/US-10.2.5.md) Negative invoices netted in the payment run (Confirmed) ·
[US-10.2.6](../../../../requirements-board/requirements/stories/US-10.2.6.md) Approve the period's BCTIs for payment (Verify) ·
[DM-25](../analysis/domain-model-delta.md#dm-25) Negative invoice to the anaesthetist, netted in the payment run and shown on a remittance advice; BCTIs approved per period.
Read alongside (not closed here):
[FT-10.2](../../../../requirements-board/requirements/stories/FT-10.2.md) and
[US-10.2.1](../../../../requirements-board/requirements/stories/US-10.2.1.md)
(a payable is released when its receivable is paid; Phases 16 and 36 built it, and this phase's
approval sits after it),
[US-09.1.4](../../../../requirements-board/requirements/stories/US-09.1.4.md)
(the BCTI is the ACCPAY; the catalogue says one per procedure, the plan builds one per receivable
invoice, provisional, under the roadmap's "BCTI granularity" rule),
[US-08.6.2](../../../../requirements-board/requirements/stories/US-08.6.2.md)
(credit in full and rebill; Phase 39 raises the negative invoice this phase nets),
[US-10.3.1](../../../../requirements-board/requirements/stories/US-10.3.1.md)
(the AA fee counts BCTIs; nothing here changes that count),
[US-10.2.4](../../../../requirements-board/requirements/stories/US-10.2.4.md)
(bulk hospital remittance stays in Xero: a different "remittance", Phase 37's),
[OQ-47](../../../../requirements-board/requirements/questions/OQ-47.md) (payment day,
cycle and who approves: open),
[OQ-71](../../../../requirements-board/requirements/questions/OQ-71.md) (**answered**
2026-10-02, owner decision D21: a negative invoice with no later payment to net against is handled
outside the system; AA settles it with the anaesthetist, so nothing is built for it),
[OQ-42](../../../../requirements-board/requirements/questions/OQ-42.md) (answered:
the negative invoice is netted in the next payment run),
[OQ-60](../../../../requirements-board/requirements/questions/OQ-60.md) (still open on
the board; its 2026-10-02 meeting update gives Greg's view that the AA fee never nets against
payables, "under trust law it mustn't", which is what is built),
[OQ-29](../../../../requirements-board/requirements/questions/OQ-29.md) (GST agency
treatment and the BCTI's wording, which the roadmap ties to BCTI granularity), the 2026-10-02 meeting
note `requirements-board/requirements/notes/2026-10-02-aa-meeting-with-greg.md` #12 (OQ-71's answer), and the "Internal
ledger" section and the "Negative invoice" and "Remittance advice" glossary entries of
[domain-model.md](../../../../requirements-board/requirements/domain-model.md).
**Depends on:** 37 (the payables run is paid in Xero and the engine records each disbursement when
Xero reports the bill paid, through `recordDisbursement`, the webhook, the poll and the outage queue)
and 39 (credit in full and rebill, which raises the **negative invoice** to an anaesthetist already
paid). By the roadmap order 14 (the registry, `useDemoTriggerContext`, the office actors), 15a (the
`appSettings` slice), 16 (the payable equals the receivable, the `-P` number, `bctisFor` and the
generalised history account builder), 22 (supplier and agent on documents), 26 (the anaesthetist
profile: bank details, display-only, with `destinationMasked`, `missingBank` and the GST number; 26
holds no payout) and 36 (the ledger pair, its legs, `ledgerPosition`, `anaesthetistPosition`,
`LedgerDisbursement`, the Admin Ledger screen and the PWA "Office runs payables" stand-in) have also
run. 38 has run (web Accounts and the GST schedule read the ledger; it reworded that PWA stand-in).
**Estimated:** 1 session. OQ-71's answer removed the carry-forward recovery, the recovery invoice,
its settings and the "Stage departed anaesthetist" trigger, which were the second session. A green
checkpoint after work item 7 (the Billing monitor working end to end) splits the session if it runs
long.

## Goal

Today the payables run is an on-demand button that pays every released payable at once, records
nothing about the run beyond an id string on each disbursement, and has no idea that an anaesthetist
can owe money back. The catalogue asks for three things (DM-25):

- **The period's BCTIs are approved before they are paid** (US-10.2.6). A **payables run** is a
  record for a payment period. The Billing monitor previews the period: every released, unpaid
  payable (BCTI) per anaesthetist, and any negative invoice waiting to be netted against it. The
  office presses **Approve period's BCTIs**, which writes the run with its lines frozen. **Run
  payables in Xero** (Phase 37's button) then pays only approved lines. A payable released after the
  approval waits for the next approval. Who approves, and whether this is the same step as
  US-10.2.1's release, is OQ-47 (still open): the office approves, labelled provisional. The
  one-click demo paths that pay out today (the Xero sim's "Simulate payment and payout", 39's "Stage
  refund after payout" and 36's PWA "Office runs payables") go through an approval too, so the gate
  has no back door.
- **Negative invoices are netted per anaesthetist** (US-10.2.5, Confirmed). Phase 39 raises a
  negative invoice to an anaesthetist when an invoice they were already paid for is credited, and
  leaves its paid-out part (`recoveryDue`) open to net. At approval each anaesthetist's open
  negatives are netted against their positive payables, oldest first, so Dr Sharma's 19 positive
  BCTIs and one negative are paid as one net amount (the acceptance criterion). In Xero the negative
  (an ACCPAYCREDIT against the anaesthetist's contact) is allocated against the bills and the batch
  payment is the net total. The engine records each bill's cash payment and each allocation when
  Xero reports them, as Phase 37 does for disbursements.
- **A remittance advice per anaesthetist per run** (US-10.2.5: "the anaesthetist sees the run washed
  up in their remittance advice"; its second criterion: it "shows the negative invoice netted against
  the positive ones"). It lists every BCTI paid, every negative netted, the net paid and the bank
  account it went to, in Admin (from the run) and in web Accounts (the anaesthetist's own advices).
- **A negative with nothing to net against is handled outside the system** (OQ-71, answered). A run
  never pays below zero: when an anaesthetist's open negatives exceed their positives, the run nets
  what it can and the rest stays open, netted in a later run if one has positives. An anaesthetist
  with an open negative and no positives is simply not in the run. The open amount stays visible on
  the anaesthetist's ledger position (36's and 39's figures) with one caption saying AA settles it
  with the anaesthetist outside the system when no later payment comes. No carry-forward record, no
  recovery invoice, no age setting, no write-off. A cancelled prepayment is not this case (the money
  is still in trust and the anaesthetist has not been paid; Phase 41).

The state gains payables runs, a payment-run setting, an offset amount on the payable leg, nettings
on the negative invoice and Xero allocation and batch payment records, and the seeded disbursements
are grouped into backdrop runs, so `PERSIST_VERSION` is bumped. No seeded money figure moves.

## Before you start: drift check

1. Run the drift check against the plan's catalogue snapshot:

   ```
   node docs/prototype-build/catch-up/tools/plan-state.mjs --diff US-10.2.5,US-10.2.6,FT-10.2,US-10.2.1,US-09.1.4,US-08.6.2,US-10.3.1,OQ-47,OQ-71,OQ-42,OQ-60,OQ-29,FT-10.3
   ```

   Read the hunks (if any) for US-10.2.5, US-10.2.6, FT-10.2, US-10.2.1, US-09.1.4, US-08.6.2,
   US-10.3.1, OQ-47, OQ-71, OQ-42, OQ-60 and OQ-29, and the domain-model lines on the internal
   ledger, the negative invoice and the remittance advice. If an item changed, re-read it and adjust
   the work items. If US-10.2.5 or US-10.2.6 is now Retired or Future, drop its work items and record
   that in the PROGRESS entry. At 3d3a18c US-10.2.5 is **Confirmed** (its note now says nothing is
   built for the no-later-payment case) and US-10.2.6 is **Verify** (approver and cycle open, OQ-47).
2. **Open and answered questions** (each built as one setting or one store action, so a different
   answer stays contained):
   - **OQ-47 (payment day and cycle; who approves), open.** The payment period is a setting
     (`appSettings.paymentRun.periodDays`, 7, and `periodAnchorISO`, `2026-07-15`, so the demo week
     is Wed 15 Jul to Tue 21 Jul, matching today's "Tuesday to Tuesday" run), never a constant in
     code. The office approves. A period may hold more than one run (a supplementary approval after a
     late release). The Billing monitor carries a "Provisional · payment cycle and approver to confirm
     with AA" chip. Copy names the period's dates, never a weekday, "weekly", "Wednesday" or "the
     20th". If OQ-47 has been answered with Greg's weekly cycle, set the setting and keep the code; if
     it says the system approves on its own, make approval a scheduled system action on the same
     store action (actor system) and keep the button as its manual form; if it says US-10.2.6 is the
     same step as US-10.2.1's release, stop and tell the owner (it would remove the gate this phase
     adds).
   - **OQ-71 (a negative with no later payment), answered: outside the system.** Build nothing for
     it beyond the open amount staying on the ledger position with its caption. If the catalogue has
     reopened it, do not build a recovery path here: record it in the PROGRESS entry for a later
     phase.
   - **OQ-60 (does the AA fee net against payables), open, Greg's view "never".** Not built: AA fee
     invoices stay separate receivables, paid into a separate bank account, and never enter a run. If
     it is now answered "it nets", stop and tell the owner (it contradicts FT-10.3 and Greg's trust
     law point).
   - **OQ-29 (one BCTI per receivable invoice, provisional).** A run line is one payable leg, so the
     run follows whatever `bctiRecords` counts; nothing here counts BCTIs. If granularity flips to
     one per procedure, the run is unaffected beyond its line labels.
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
     poll`), its ruling that the engine never performs a disbursement, the restyled processing
     monitor this phase's panel sits beside, and confirm it shipped no bank hold (37's plan adds none
     and names this phase's `runExclusionFor` as the place for any exclusion; 26's bank details are
     display-only, DM-33; if a `heldForBank` refusal did ship, it becomes `runExclusionFor`'s first
     reason, work item 2);
   - from **39**: the **negative invoice to the anaesthetist** raised by every credit in full. Planned
     shape (confirm against the code): `NegativeInvoice` in `billing.negativeInvoices`, `{ id (NEG,
     pad 4); number (the credit note number with 16's `-P` suffix, for example `CN-2026-0001-P`);
     anaesthetistId; creditNoteId; originalInvoiceId; pairId; cause: 'credit'; amount; offsetAmount;
     recoveryDue; status: 'offset' | 'toNet'; issuedAtISO; accPayCreditNoteId? }`, stored positive
     and shown negative, with `offsetAmount + recoveryDue === amount`. `offsetAmount` is what 39 set
     against the not-yet-paid-out payable; **`recoveryDue` (the part already paid out) is what this
     phase nets**, and an `'offset'` negative never enters a run. Its Xero mirror is a
     `XeroCreditNote` of type `ACCPAYCREDIT` in `xero.creditNotes` (with `allocated`), against the
     anaesthetist's contact, whose unallocated part this phase allocates against later bills. On the
     ledger, the credited pair carries `credit: { creditNoteId; negativeInvoiceId; atISO;
     heldForPayer; recoveryDue }` and `ledgerPosition` totals `creditsHeldForPayers` and
     `recoveryDueFromAnaesthetists` in `imbalance = receiptsHeld - payablesDue -
     creditsHeldForPayers + recoveryDueFromAnaesthetists`; `anaesthetistPosition` gains the
     anaesthetist's `recoveryDue`. The credit note's `cause` is `'correction' | 'split'` (41 adds its
     refund cause). Phase 39's handoff note says what it left for this phase. **If 39 recorded the
     amount only as a trail, with no record of its own**, add the record here with the fields above,
     created at the same point in 39's commit, and say so in the PROGRESS entry. Also note 39's
     `stage-refund-after-payout` trigger (Admin · Billing monitor and Admin · Invoice; it pays Sarah
     Mitchell's invoice in full and pays it out to Dr Sharma through `disbursePayable` or 37's
     `payBillsInXero`, once `stage-post-op` (14's, as 38b re-pointed it) has run; the user then credits it with 39's Credit and rebill), its result copy,
     and 39's pure `creditInFull`, `reversalPlan` and `applyCredit`, which the staging fixture below
     reuses;
   - from **16**: `bctiRecords` and `bctisFor`, the `-P` bill number, and the generalised history
     account builder behind "Seed a month of BCTIs", plus `appSettings.aaFee` (the pattern this
     phase's `appSettings.paymentRun` follows);
   - from **15a**: the `appSettings` slice (`AppSettings` in `domain/warnings/types.ts`,
     `defaultAppSettings()`, the seed's `appSettings` and the persist merge's one second level for
     it in `store/appStore.ts`);
   - from **26**: where bank details live, `destinationMasked` and `missingBank` (no payout is held
     by a missing account);
   - from **38**: `AccountsSubTab` (`'outstanding' | 'payments' | 'gst' | 'fees'`), how the GST
     schedule reads a payment to the anaesthetist, and the Outstanding list's selector;
   - from **14**: the registry file (`src/shared/demoTriggers/registry.ts`), `useDemoTriggerContext`,
     `OFFICE_ACTOR` and `OFFICE_SIMULATION_ACTOR` in `src/store/demoActors.ts`, and the ruling that
     "Run payables" is a product button, not a registry entry.
4. Note the current `PERSIST_VERSION` (16 at 3d3a18c; later phases have raised it).

## Reference

**Design files (convention 17):**

- `docs/design/Design Language.dc.html`: tokens (teal `#0D6E63` the only action colour, crimson
  identity only, semantic success, warning and neutral tints, pills at radius 999, Spline Sans Mono
  with tabular-nums for every amount, number and date, the side-sheet and elevation patterns). A
  negative amount is neutral text with a leading hyphen-minus ("-$120.00"), never red, never an en
  dash or a U+2212 minus.
- `docs/design/Admin Review.dc.html` and `docs/design/Admin Day.dc.html`: the admin desktop anatomy
  (tile rows, tables, header rows, side panels, pills). No mockup covers the Billing monitor, a run
  or a remittance advice: extend the Billing monitor's panels (as 37 restyled them),
  `InvoiceDocument`'s print sheet (for the remittance advice) and `tableChrome.ts` as they stand.
- `docs/design/Web Dashboard.dc.html`: the web panel and table anatomy for the new Accounts sub-tab.

**Catalogue items:** the covered and context files listed above, the 2026-10-01 meeting note
`requirements-board/requirements/notes/2026-10-01-aa-meeting-with-greg.md` points #18 (refund as a credit note plus a
negative invoice, netted, the remittance advice), #48 (the payment cycle), #63 (the no-later-payment
recovery question, now OQ-71) and #66 (BCTIs approved for payment), and the 2026-10-02 note `requirements-board/requirements/notes/2026-10-02-aa-meeting-with-greg.md`
#12 (OQ-71: "an extreme edge case... they just settle that up with the anaesthetist") and #1 (OQ-60:
the fee never nets).

**Analysis files:**

- `docs/prototype-build/catch-up/GAP-ANALYSIS.md`: theme 7 (money model), the US-10.2.5 and
  US-10.2.6 lines, the DM-25 row, the S4 demo-impact line and the "Demo-trigger buttons" section.
- `docs/prototype-build/catch-up/epics/EP-10.md`: the header note (the second cluster: "payables run
  reworked per anaesthetist and period with an approve-for-payment step, net negatives and
  remittance advice"), then the US-10.2.6 and US-10.2.5 sections.
- `analysis/domain-model-delta.md` DM-25 (and DM-22 for the ledger it extends, DM-21 for the trust
  hold that Phase 41 adds as a run exclusion).
- `analysis/prototype-map-admin.md` section 7 (Billing monitor), `prototype-map-store-seed.md`
  sections 4 and 9 (billing slices, counters, the seeded history), `prototype-map-apps-mobile-web.md`
  (web Accounts) and `prototype-map-shell-demo-pwa.md` section 5.2 (the Xero sim pair detail).

**Code entry points** (line numbers are from 3d3a18c; phases 16 to 39 will have moved them, and 36
and 37 rewrote the payables code: use the names from the drift check):

- Payables: `src/store/payablesActions.ts` (`payablesDue` 35, `disbursePayables` 55, `runPayables`
  146, `disbursePayable` 160; after 36 and 37 these read the ledger and pay in Xero), 37's
  `src/store/disbursementDetection.ts` and `src/store/xeroQueue.ts`, `src/store/reconciliationPoll.ts`.
- Ledger: 36's `src/domain/billing/ledger.ts` and `ledger.test.ts`, and 36's `src/store/ledgerSelectors.ts`;
  39's `src/domain/billing/creditNote.ts`.
- Types and settings: `src/domain/types.ts` (`Disbursement` 819 with its `payablesRunId` string 824,
  and 36's `LedgerPair`, `PayableLeg`, `LedgerDisbursement`); `src/domain/warnings/types.ts`
  (`AppSettings` 88, 15a's slice, which 16 extended with `aaFee`); `src/store/mutate.ts`
  `ID_FORMATS` (`payablesRun: { prefix: 'PR', pad: 4 }` 93 already exists and allocates today's run
  ids), `allocateId`, `clockISO`, `resetDomainState`; `src/store/appStore.ts` (`PERSIST_VERSION`
  136, the `appSettings` persist merge about 205, the empty billing slice, `freshAppState`).
- Seed: `src/domain/seed/history.ts` (Dr Souter's backdrop; every seeded disbursement carries
  `payablesRunId: 'PR-HIST-01'`, `dsbRunId` 186, the disbursement row 317, pa01 paid out on 15 Jul
  at row 110), `src/domain/seed/billing.ts` (`SEED_PREPAYMENT_DISBURSED_ISO` 65, 16 Jul, and
  `'PR-SEED-01'` 218), `src/domain/seed/cast.ts` (Dr Sharma `ANAE.sharma`, row 47), and 16's
  generalised history account builder.
- Admin: `src/apps/admin/screens/BillingMonitorScreen.tsx` (the payables panel
  `data-shot="billing-payables-run"` 121 to 143, `doRunPayables` 51), 36's
  `src/apps/admin/screens/LedgerScreen.tsx`, `src/apps/admin/screens/InvoiceDocument.tsx` (the print
  sheet to reuse), `src/apps/admin/routes.tsx` and `src/router.tsx`.
- Web: `src/apps/web/screens/AccountsScreen.tsx` (`AccountsSubTab` 19, today `'overdue' | 'payments'
  | 'gst'`; 16 and 38 change it), `src/apps/web/routes.tsx` (`WebAccountsRoute`, `/web/accounts/:subTab`
  130 to 146), `src/apps/web/WebApp.tsx`.
- Xero sim: `src/apps/demo/DemoXero.tsx` (`PairDetail`), `src/apps/demo/xeroPairView.ts`, 37's
  `xeroSimActions.ts`.
- Shared: `src/shared/format.ts` (`formatCurrency` 116, which renders a negative as "$-120.00"; add
  a signed form unless an earlier phase shipped one), `src/shared/audit/actionLabels.ts`
  (`ACTION_LABELS`), the Phase 14 registry (`src/shared/demoTriggers/registry.ts`).
- Tests to extend: `store/payablesActions.test.ts`, 37's `disbursementDetection.test.ts`,
  `ledger.test.ts`, `store/seedBilling.test.ts`, `store/persistMigrate.test.ts`,
  `store/demoScenarios.test.ts`, `shared/demoTriggers/demoTriggers.test.ts`, `pwa/pwaPurity.test.ts`,
  `apps/web/screens/AccountsScreen.test.tsx`, and the Playwright specs that shoot the Billing
  monitor and the Xero pair.

## Work items

1. **Model** (`domain/types.ts`, and `domain/warnings/types.ts` for the setting). DM-25.
   - `PaymentRunSettings`: `{ periodDays: number; periodAnchorISO: IsoDate }`, stored as
     `appSettings.paymentRun` beside 16's `appSettings.aaFee`, defaulted in `defaultAppSettings()` to
     `{ 7, '2026-07-15' }`, merged by the persist merge's existing second level. Labelled provisional
     (OQ-47) in a doc comment. No settings field in the prototype: it is one value until OQ-47 is
     answered.
   - `PayablesRun`, in a new `billing.payablesRuns` record: `{ id; periodStartISO; periodEndISO;
     sequence (1, 2 within the period); status: 'approved' | 'sentToXero' | 'paid' | 'superseded';
     approvedAtISO; approvedBy: { who; role }; lines: PayablesRunLine[]; nettings:
     PayablesRunNetting[]; byAnaesthetist: RunAnaesthetistTotal[]; excluded: { pairId;
     anaesthetistId; reason: RunExclusionReason; amount }[]; sentAtISO?; paidAtISO?; supersededBy?;
     seeded?: true; staged?: true }`. `staged` marks a one-pair run approved by a demo stand-in
     (work item 5).
     - `PayablesRunLine`: `{ pairId; anaesthetistId; billNumber (the `-P` number);
       receivableInvoiceNumber; serviceDateISO; payerName; amount }`, where `amount` is what was
       approved for that leg (released less disbursed less offset less any amount already approved
       in an unsettled run).
     - `PayablesRunNetting`: `{ negativeInvoiceId; anaesthetistId; amount; allocations: { pairId;
       amount }[] }`: how much of each negative this run nets, and against which bills (oldest
       first).
     - `RunAnaesthetistTotal`: `{ anaesthetistId; positives; netted; net; remainingToNet;
       destinationMasked? }`, all cents exact. `net >= 0` always; `remainingToNet` is what the run
       could not net because the negatives exceed the positives (it stays open on the negative
       invoice for a later run).
     The run's lines and totals are frozen at approval; only the status, the dates and the derived
     detection state move afterwards.
   - `PayableLeg` gains `offsetAmount` (default 0): the part of the payable settled by netting a
     negative invoice, kept apart from `disbursedAmount` (cash) so receipts held stay true. A leg is
     settled when `disbursedAmount + offsetAmount` reaches `amount`.
   - The negative invoice (39's `NegativeInvoice`, or the record added per the drift check) gains
     `nettings: { runId; pairId; amount; atISO }[]`, and its `status` widens with `'netted'` (39's
     handoff: "add the nettings"), set when its open amount reaches zero, in the same `mutate()` that
     moves the nettings; a part-netted negative stays `'toNet'`. Its open amount is derived:
     `recoveryDue - sum(nettings)`; `offsetAmount` was settled by 39 and never enters a run. The
     credited pair's `credit` gains `nettedAmount`, kept in step with the negative invoice in the same
     `mutate()`, so the pure ledger never reads the negative invoice records. Netting reads every open
     negative, whatever its credit note's `cause`. No carry-forward status, recovery link or age is
     added (OQ-71).
   - Xero side: `XeroCreditAllocation { id; accPayCreditId (39's `XeroCreditNote` of type
     `ACCPAYCREDIT`, the negative's `accPayCreditNoteId`); accPayId; amount; atISO; idempotencyKey
     ('CNALLOC-<id>'); payablesRunId }` in `xero.creditAllocations` (each one raises that credit
     note's `allocated`), and `XeroBatchPayment { id; contactId; payablesRunId; total; atISO;
     billPaymentIds }` in `xero.batchPayments`. The Xero bill payment (37's `Disbursement`) gains
     `batchPaymentId?`.
   - `ID_FORMATS`: `creditAllocation` (`XCA`, pad 4), `batchPayment` (`XBP`, pad 4). Thread the new
     maps and the setting through `AppState`, the empty billing and xero slices, `freshAppState`,
     `resetDomainState` and `SeedBillingSlice`.
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
     reason instead, so the run and Xero agree. It is the **one exclusion point**: Phase 41 adds
     `'heldInTrust'` here for a held prepayment payable, and any later hold is added here, not
     elsewhere; a comment says so.
   - `buildRunDraft({ legs, negatives, unsettledRuns, exclusions, period })`: per anaesthetist, the
     approvable lines (each leg's `releasedAmount - disbursedAmount - offsetAmount` less anything
     already approved in an unsettled run, positive only, sorted by service date then bill number),
     then `netNegatives` over them, then the totals. Only anaesthetists with at least one approvable
     line appear: an anaesthetist with open negatives and no positives is not in the run, and their
     negative waits on their ledger position (OQ-71). The legs are the ones 36's
     `payablesDue.byAnaesthetist` already sums (36's handoff: the approval sits in front of that
     figure, with no second source); the negatives are 39's open `'toNet'` negative invoices, not
     negative legs.
   - `netNegatives(lines, negatives)`: open negatives oldest first (by `issuedAtISO`, then id), each
     netted against the remaining positives, allocating to bills oldest first; returns `{ nettings;
     netted; net; remainingToNet }`. Never nets below zero: `net = max(0, positives - open)`,
     `remainingToNet = max(0, open - positives)`.
   - `remittanceAdvice(run, anaesthetistId, detection)`: the advice's rows and totals from the frozen
     run (BCTIs paid, negatives netted, net, any amount still to net, destination), with each line's
     detection state (`awaitingXero` or `paid` with its date) passed in. Pure; the store only
     supplies detection.
   - Tests (worked figures in cents): **US-10.2.5's first acceptance criterion**, 19 positives and
     one negative give a net equal to the positives less the negative, and (its second) the advice
     lists all twenty with the negative netted; a negative larger than the positives nets to $0.00
     with the rest left as `remainingToNet`; two negatives, oldest first; a negative exactly equal to
     the positives; an anaesthetist with an open negative and no positives is not in the draft; odd
     cents across allocations; an exclusion returned by `runExclusionFor` (stubbed) keeps the leg out
     and is reported with its amount; an anaesthetist with no bank account is in the run with a
     `null` destination; a leg already approved in an unsettled run is not approved twice; a
     part-released leg (16's half payment) approves exactly its released remainder; the period
     boundaries on both edges and across a month end; determinism (identical output on repeat).
3. **Pure ledger additions** in 36's `domain/billing/ledger.ts` (extend `ledger.test.ts`):
   - `applyOffset(pair, amount)`: adds to `payable.offsetAmount`; refused above `releasedAmount -
     disbursedAmount - offsetAmount`; stamps `paidOutAtISO` when `disbursedAmount + offsetAmount`
     reaches `amount`. `applyDisbursement`'s ceiling becomes released less disbursed less offset.
   - `ledgerPosition`: `payablesDue` subtracts `offsetAmount`; 39's `recoveryDueFromAnaesthetists`
     becomes the sum of `credit.recoveryDue - credit.nettedAmount`, so every netting lowers it by
     exactly the offset it adds to a bill. The imbalance equation 39 left gains no term.
     `anaesthetistPosition` keeps 39's `recoveryDue`, now net of nettings: that figure is the "still
     to net" balance OQ-71 leaves visible.
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
   - `approvePeriodBctis(api, actor)`: office only (`officeOnly`; provisional, OQ-47). Refuses
     `nothingToApprove` ("Nothing is waiting for approval.") when the draft has no lines, so a second
     press with nothing new refuses too. One `mutate()`: allocate the run id from the existing
     `payablesRun` counter and the period sequence, write the frozen draft. Audit
     `payables.runApproved` (period, sequence, line count, positives, netted, net, remaining to net,
     per-anaesthetist totals, exclusions) on the run.
   - **The gate.** Every path that pays a payable pays only an approved, unsettled run line:
     `runPayables`, `disbursePayable` (the Xero pair's single payout), and 37's Xero-side
     `payBillsInXero`. An unapproved released payable is refused with `notApproved` ("This payable
     is not approved for payment yet. Approve the period's BCTIs first."). This is US-10.2.6's
     acceptance criterion and the place reviewers will hunt.
   - **Stale approval.** Between approval and payment a line can go stale: its pair credited by
     Phase 39 (39 cuts a credited pair's release back to what was paid out), a new open negative
     raised for an anaesthetist in the run (it would be missed), a line's payee changed (a prepaid
     Booking moved by 32 or 32a repoints its pair's payable, D20), or a new exclusion from
     `runExclusionFor`. `runPayables` re-checks the run against the ledger first; if anything changed
     it refuses `approvalStale` ("Something changed since this run was approved. Re-approve the
     period.") and the panel offers **Re-approve**, which marks the run `superseded` (with
     `supersededBy`) and approves a fresh one in one `mutate()` (audit `payables.runSuperseded` then
     `payables.runApproved`). A run is never edited in place.
   - Tests (`payablesRunActions.test.ts`): approval needs the office; a run freezes its lines; a
     payable released after approval is not in it and is in the next approval's draft; the gate
     refuses every payout path for an unapproved payable; re-approval supersedes; crediting a line's
     invoice after approval makes the run stale; approving with nothing new refuses; an anaesthetist
     with only an open negative leaves nothing to approve.
5. **Store: pay an approved run in Xero, with netting** (`payablesActions.ts` and 37's
   `xeroSimActions.ts`). US-10.2.5.
   - `runPayables(api, office)` (the Billing monitor's "Run payables in Xero") takes the oldest
     approved run not yet sent and calls `payRunInXero(api, actor, runId, { webhook })`, which
     replaces 37's `payBillsInXero` for a run (keep `payBillsInXero` as its internal helper). Xero
     side only, in one `mutate()` (source demo, since it stands in for work done in Xero): per
     anaesthetist, for each netting allocation an `XeroCreditAllocation` of the ACCPAYCREDIT against
     the bill; for each bill's cash remainder a bill payment (37's `Disbursement`, `BILLPAY-` key);
     one `XeroBatchPayment` per anaesthetist for the net. The ACCPAYCREDIT's remaining credit and the
     bills' statuses move as Xero would. An anaesthetist whose net is zero (negatives at least equal
     to positives) gets allocations and no batch payment. Run status `sentToXero`, `sentAtISO`.
     Audit `xero.creditAllocated`, `xero.disbursed` (37's code) and `xero.batchPaid`.
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
     payment"), and the payout half of 39's **Stage refund after payout** (which called `disbursePayable`, or
     37's `payBillsInXero` with the webhook delivered, and would now be refused `notApproved`). The PWA stand-in **Office runs
     payables** (36's, reworded by 38) becomes "Office approves and runs payables": one body that
     calls `approvePeriodBctis` then `runPayables` as `OFFICE_SIMULATION_ACTOR` (webhook delivered),
     disabled "Nothing due to pay out" as before. A staged run shows under Runs this period with a
     "Staged" tag. Approving part of a period stays out of scope for the office UI; this helper is
     the demo stand-ins' only form of it.
   - **Run completion** is derived: `payablesRunState(state, runId)` gives each line's detection
     (`awaitingXero` or `paid`) from the ledger, and the run becomes `paid` (with `paidAtISO`, audit
     `payables.runPaid`, source system) inside the detection `mutate()` that settles its last line.
   - Tests: 19 positives and one negative paid in one run settle every leg (cash plus offset equals
     each amount), cash out equals the net, the negative's open amount is zero and its status
     `'netted'`, and the ledger is in balance; a negative larger than the positives settles the
     positives entirely by offset with no cash and no batch payment and leaves the rest open
     (`'toNet'`), netted by the next run that has positives; a replayed webhook, a second poll and a
     restored outage each record once; `missed` leaves the run `sentToXero` until the poll; the
     stale-approval refusal; a single payout refused on a netted bill; conservation on every pair
     (disbursed plus offset at most released); `approveAndPayPairForDemo` pays only its pair and
     refuses a pair already in an unsettled run; Simulate payment and payout, Stage refund after
     payout and the PWA stand-in still pay out (S3 Beat 3 and 39's staging unchanged in effect).
6. **Formatting.** `formatSignedCurrency(n)` in `src/shared/format.ts`: "-$120.00" with a
   hyphen-minus for negatives, "$120.00" otherwise (Vitest, including -0.005 rounding and zero).
   Every negative amount in this phase renders through it.
7. **Billing monitor: the payment period panel** (`BillingMonitorScreen.tsx`, replacing the
   payables panel beside 37's restyled processing monitor; keep `data-shot="billing-payables-run"`
   on the run button's container).
   - Header "Payment period · 15 Jul to 21 Jul 2026" (mono dates) with the OQ-47 provisional chip.
   - **Awaiting approval** (`data-shot="payables-run-draft"`): a table from `payablesRunDraft`, one
     row per anaesthetist (`drSurname`), BCTIs (count), Positives, Negatives netted, Net, Still to
     net (shown only where a negative exceeds the positives), a "No bank account" warning pill where
     26 flags a missing account (flag only, the line is still approved), and any exclusion with its
     reason; expandable to the lines. Empty state: "Nothing is waiting for approval." Primary teal
     **Approve period's BCTIs**, disabled with its refusal sentence. Caption: "A released payable is
     paid only once the period's BCTIs are approved. Approver to confirm with AA."
   - **Runs this period** (`data-shot="payables-runs"`): each run (id, sequence, approved by and
     when, net total, status pill: Approved neutral, Sent to Xero warning, Paid success, Superseded
     neutral, plus a neutral "Seeded" or "Staged" tag on backdrop and demo stand-in runs), linking to
     its detail. "Run payables in Xero" (37's button and `DemoBadge`) acts on the oldest approved run
     and is disabled "Nothing approved to pay" otherwise; on `approvalStale` it shows the sentence
     and a **Re-approve** button.
   - The result line reports, for example, "Run PR0003 sent to Xero: 19 BCTIs, 1 negative invoice
     netted, $X paid to 1 anaesthetist." (the run id and figures from the running app).
   - **Checkpoint.** With items 1 to 7 and the `stage-payment-period` trigger (item 11) in place,
     `npm run build`, `npm run build:pwa` and `npx vitest run` are green and the approve, run and
     netting items of the manual checklist pass. If the session must split, stop here and patch S4
     Beat 5 for its new Approve step first.
8. **Admin: the run detail, the remittance advice and the open balance.**
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
     masked account, or "No bank account on file"). Lines: BCTI number, invoice number, service
     date, payer, amount (mono); then each negative netted, "Negative invoice CN-2026-0001-P · credit
     of AA-2026-0007" (the numbers 39 shipped), as a signed amount. Totals: "BCTIs paid $P",
     "Negatives netted -$N", "Paid to you $P - N" (computed, shown as one figure), and, only when
     non-zero, "Still to net in a later payment run $X". No NHI, no patient detail beyond the payer
     name the BCTI already carries. Rail: Print, the run link, and the Xero card ("Batch payment
     XBP0002 · $X", "Credit allocated $N"). `data-shot="remittance-advice"`. A remittance has a
     derived reference `RA-<runId>-<registration number>`, shown on the document.
   - The Admin Ledger's per-anaesthetist view (36) gains a **Payment runs** card (each run with net,
     netted, status and its advice link) and shows 39's **Negative invoices to net** (the open
     `recoveryDue`, net of nettings) with one caption: "Netted in their next payment run. If no later
     payment comes, AA settles it with the anaesthetist outside the system." The whole-ledger view
     keeps 39's total under the same caption. This caption is all OQ-71 needs.
   - The Xero sim pair detail shows, on an ACCPAY, "Paid in batch XBP0002" and any credit
     allocated against it; on the ACCPAYCREDIT, its allocations and remaining credit.
9. **Web Accounts: Remittances** (US-10.2.5, the anaesthetist's side).
   - `AccountsSubTab` gains `'remittances'` (`/web/accounts/remittances`), a sub-tab button
     "Remittances" after "Payments". A table of the persona's advices, newest first: paid on, run,
     BCTIs, netted (signed), paid to you, status pill (Paid, Awaiting Xero); a row opens the advice
     in a side sheet (`useSurface`), the same content as the Admin document, read only.
     `?run=PR0003` focuses a row, as 16's `?invoice=` does.
   - When the persona has an open negative, a panel above the table (`data-shot="web-still-to-net"`):
     "You have -$X still to net. It is netted against your next payment run." No provisional chip.
   - 38's GST schedule (cash basis): confirm that a bill settled partly by offset counts at its
     full amount on its settlement date and the netted negative shows as a negative row on the
     same date, so the period's figures equal the net cash plus nothing else. Fix only the selector
     if it reads cash disbursements alone; label the treatment provisional (AA's accountant,
     OQ-29). The Payments tab shows the net cash per run.
   - Mobile Balances is not changed. The catalogue does not name the app that shows the advice
     (US-10.2.5: "the anaesthetist sees the run washed up in their remittance advice"; the gap
     analysis lists mobile too); the plan puts it in web Accounts, where the anaesthetist's accounts
     live, and Admin. Log this as a built default on the "For the owner's review" list.
   - `data-shot` hooks: `web-remittances`, `web-remittance-sheet`, `web-still-to-net`.
10. **Backdrop runs in the seed.** The seeded disbursements (Dr Souter's history, `'PR-HIST-01'`,
    and the seeded prepayment payout, `'PR-SEED-01'`, plus any other seeded payout the earlier
    phases added) are grouped into backdrop `PayablesRun` records, one per distinct disbursement
    date, each numbered within the payment period of that date (`paymentPeriodFor` over the seed's
    setting), in the `H` id namespace (`PRH01`, `PRH02` ...), status `paid`, `seeded: true`,
    approved by "Office (seeded)" at 08:00 on the disbursement date (approval always precedes
    payment), with their lines and totals built by `buildRunDraft` from the seeded legs (never
    typed-in figures) and no negatives. 16's generalised history account builder writes a backdrop
    run the same way for every payout it builds, so "Seed a month of BCTIs" and this phase's
    fixture leave no payment without a run. Each seeded `LedgerDisbursement` and Xero
    `Disbursement` takes its run's id, and each seeded anaesthetist gets a backdrop
    `XeroBatchPayment` per run. Dr Souter's web Remittances tab is populated on load. No seeded
    money figure moves: assert Dr Souter's ledger position, the whole-ledger position, the GST
    schedule and S3's figures are identical before and after. At 3d3a18c two seeded payouts fall
    **inside the current period** (Dr Souter's pa01 on 15 Jul and the seeded prepayment payout on
    16 Jul; Phase 41 later removes the second by holding it in trust), so "Runs this period" opens
    with backdrop runs marked Paid and "Seeded", and the first live approval takes the next
    sequence and the next `PR` id. Earlier backdrop runs show only on the run detail, the Ledger and
    the advices.
11. **Triggers, persistence and copy.**
    - Register the trigger in the table below through the Phase 14 registry and re-point the
      existing ones; bodies in `src/store` or `src/shared`; nothing added to the Control Panel page.
    - `stage-payment-period` builds its 19 accounts for Dr Sharma with **16's generalised history
      account builder** in its own deterministic id namespace (`PP`), raised and handed off but
      unpaid (ledger pairs and Xero pairs created as the builder does). Their service dates follow
      16's rule: weekdays **before the canvas horizon start** (`horizonFor(DEMO_TODAY).startISO`), AM
      and PM Lists of five Bookings, so no added List collides with a generated canvas List. It then
      records each payment at the demo clock's now (inside the current period) through the ordinary
      `receivePayment` webhook path with keys `STAGE-PP-n`, so release follows US-10.2.1 exactly.
      One audit entry for the staging, then the ordinary payment entries. Its `choices`: "19 BCTIs"
      and "19 BCTIs and a credit after payout"; the second also builds, with the **credit-after-payout
      fixture builder** below, one earlier Dr Sharma invoice paid, paid out through its own backdrop
      run and credited in full, so one negative invoice with its whole amount to net is open for Dr
      Sharma. The 19 add to Dr Sharma's July BCTI count (16's fee preview shows it; that is correct).
    - The **credit-after-payout fixture builder** (`domain/seed/`, pure): builds a backdrop, like the
      seeded history (not replayed actions), of one invoice raised, paid and paid out through its own
      backdrop run, then credited in full with 39's pure `creditInFull`, `reversalPlan` and
      `applyCredit` (credit note cause `'correction'`, the payer's credit held, no rebill: the payer
      had paid twice), giving 39's `NegativeInvoice` with `recoveryDue` equal to its `amount`, its
      ACCPAYCREDIT and the pair's `credit.recoveryDue`. Never a second credit path: if the builder
      cannot reuse 39's pure functions, stop and tell the owner.
    - Bump `PERSIST_VERSION` by one (the new slices, the setting, the leg field and the backdrop
      runs; record from and to). Extend `persistMigrate.test.ts` (a stale payload is discarded to the
      fresh seed) and `seedBilling.test.ts` (two builds deep-equal, backdrop runs reproduce the
      seeded disbursements exactly, `resetDomainState` restores them).
    - Every new audit action gets a label in `ACTION_LABELS` (`src/shared/audit/actionLabels.ts`):
      `payables.runApproved`, `payables.runSuperseded`, `payables.runPaid`, `ledger.offsetRecorded`,
      `xero.creditAllocated`, `xero.batchPaid`.
    - Copy sweep: no en or em dash in any new string; no "weekly", "Wednesday", "Tuesday" or "the
      20th" in app copy while OQ-47 is open; every negative through `formatSignedCurrency`; no
      "carried forward", "recovery" or "write-off" wording (OQ-71).
12. **Tests, shots and docs close-out.** `demoTriggers.test.ts` covers the new and re-pointed entries
    (routes, surfaces, disabled states, the pinned per-screen counts, the PWA stand-in's new label
    and body) and `pwaPurity.test.ts` stays green; `demoScenarios.test.ts` drives the rewritten S4
    Beat 5 and its netting aside at store level. `AccountsScreen.test.tsx` covers the Remittances
    tab (rows, signed amounts, focus, the still-to-net panel). Playwright: a new
    `visual/admin-phase39a.spec.ts` (the payment period panel before and after approval, a run
    detail, a remittance advice with a netted negative, the anaesthetist ledger caption) and a web
    shot of the Remittances tab and sheet; update any spec that shot the old payables panel. The
    capture recipes, ATLAS.md and `npm run verify:board` are the Catalogue screenshots step below.
    Then the demo guide (below) and PROGRESS.

## Demo triggers

The headline actions are **product UI**, not demo triggers: **Approve period's BCTIs**, **Run
payables in Xero** (37's button, badged Simulated Xero) and **Re-approve**, all on the Admin Billing
monitor. The Xero sim pair's in-page **Simulate payment and payout** stays an in-page simulator
button (37's), re-pointed through `approveAndPayPairForDemo`. What the registry gains or changes:

| Label | Screen | Surface | Effect |
|---|---|---|---|
| Stage a payment period (new, `stage-payment-period`) | Admin · Billing monitor (`/admin/billing`) | bar | `choices` "19 BCTIs" / "19 BCTIs and a credit after payout". 19 receivable invoices for Dr Sharma, each paid through the ordinary webhook, so 19 BCTIs are released and waiting for approval; the second choice also leaves one open negative invoice for Dr Sharma (the credit-after-payout fixture). Result: "19 payables released for Dr Sharma. Approve the period's BCTIs to pay them." (plus "A negative invoice of -$X is waiting to be netted." for the second choice). Disabled "Already staged for this period" |
| Stage refund after payout (Phase 39's, re-pointed) | as Phase 39 registered it | bar | Its payout half now goes through `approveAndPayPairForDemo` (a one-line staged run) instead of `disbursePayable`, which the gate refuses. Its result gains "Once credited, the negative invoice is netted in Dr Sharma's next payment run." The live path for the netting aside: this trigger, then 39's Credit and rebill on the invoice, then Approve and Run once Dr Sharma has a released payable |
| Pay anaesthetist in Xero (payables run) (Phase 37's `xero-pay-bill`, re-pointed) | Xero sim pair (`/demo/xero/invoices/:accRecId`) | bar | Pays the pair's bill only when it is an approved, unsettled run line with no netting on it. Disabled "Not approved for payment yet" or "Pay this bill with its run" |
| Office runs payables (Phase 36's PWA stand-in, reworded by 38, re-pointed) | Mobile · Balances (`/mobile/balances`) | PWA only, badged office stand-in | Becomes "Office approves and runs payables": `approvePeriodBctis` then `runPayables` as `OFFICE_SIMULATION_ACTOR`, webhook delivered. Message names the approval and the amount paid out to Dr Souter. Disabled "Nothing due to pay out" as before |

No "Stage departed anaesthetist" trigger: the no-later-payment case is handled outside the system
(OQ-71), so there is no beat to stage.

PWA parity: the remittance advice is web and Admin, and the mobile Balances screen gains nothing, so
no new PWA entry is registered. The one existing PWA path that pays out, 36's "Office runs payables"
stand-in, is re-pointed above so the PWA build still pays out through an approval. Confirm no new
entry shows in the PWA sheet, the re-pointed stand-in works in `npm run build:pwa`, and
`pwaPurity.test.ts` stays green; Phase 44's audit records "no new mobile beat; the PWA payout
stand-in approves first".

## Out of scope

- **A negative with no later payment to net against** (OQ-71, answered): AA settles it with the
  anaesthetist outside the system. No carry-forward record, recovery invoice, age or recovery
  setting, write-off record, collections or "departed anaesthetist" staging. The open amount stays
  on the ledger position with its caption and nets in any later run that has positives.
- **The payment day and cycle** (OQ-47): Greg's weekly accounting cycle (ISO week, Friday close,
  Monday working day, Tuesday schedule to Michael) and the separate monthly 20th cycle are not
  modelled beyond the period setting, which has no settings field. No scheduled run and no automatic
  approval.
- **Approving part of a period** (per anaesthetist or per BCTI) in the office UI (the demo
  stand-ins' one-line staged run is the only exception), a second-person check on approval, and
  editing a run once approved (it is superseded, never edited).
- **Netting the AA fee** against payables (OQ-60; Greg: never, under trust law; the fee stays a
  separate receivable).
- **Refunds as a live action** (cancellation refunds, the trust account and its hold): Phase 41. A
  cancelled prepayment is not a negative to net (the money is still in trust). This phase nets any
  open negative whatever its credit note's cause and leaves `runExclusionFor` as the one exclusion
  point for 41's hold.
- Emailing the remittance advice, a bank file (ABA) export, and mobile remittance views.
- A real Xero batch payments API: the Xero side stays the simulation.
- Changing what a BCTI is or how many there are (OQ-29), or the AA fee count (16).

## Manual test checklist

The agent runs every item itself in the running app and reports it with evidence; none is handed
to the owner (ROADMAP.md "Owner review: agents test themselves").

Take run ids, sequences and figures from the running app; the ids below are examples. Start each
group after **Reset → Confirm reset**.

Approval and the gate:

- [ ] Admin · Billing monitor shows **Payment period · 15 Jul to 21 Jul 2026** with the provisional
      chip, an empty Awaiting approval table ("Nothing is waiting for approval."), Approve disabled
      with that sentence, and Runs this period opening with the seeded backdrop runs for 15 and 16
      Jul, Paid and tagged Seeded.
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
- [ ] Stale approval: Stage a payment period (19 BCTIs) and Approve, then credit one of the 19
      invoices with 39's Credit and rebill before running: Run payables refuses "Something changed
      since this run was approved. Re-approve the period."; Re-approve supersedes the run and the new
      one holds 18 BCTIs.
- [ ] Simulate Xero outage (37), then Run payables: the run is Sent to Xero with lines Awaiting
      Xero; Restore Xero drains the queue and the run becomes Paid with no duplicate disbursement or
      offset.
- [ ] PWA build, Mobile · Balances: Payment received · half, then **Office approves and runs
      payables**: Paid out rises by exactly what was released.

Netting and the remittance advice:

- [ ] **Stage a payment period → 19 BCTIs and a credit after payout**: the draft shows Dr Sharma
      with 19 BCTIs, one negative netted and the net. Approve, then Run: the result line names 19
      BCTIs and 1 negative invoice netted; Dr Sharma's ledger position shows no negative to net; the
      whole ledger is in balance; the Xero sim shows the ACCPAYCREDIT allocated and one batch
      payment for the net.
- [ ] Admin · run detail lists Dr Sharma's totals; her **Remittance advice** lists 19 BCTIs,
      "Negative invoice CN-2026-...-P · credit of AA-2026-..." as a signed amount, and "Paid to you"
      equal to the net; the paid-to account is masked; no "Still to net" line. Switch to Dr Sharma on
      the web: the same advice under Remittances.
- [ ] Web · Accounts (Dr Souter) has a **Remittances** sub-tab listing her backdrop runs; each opens
      its advice; her Outstanding, Payments and GST schedule figures are unchanged from before this
      phase.
- [ ] Nothing to net against (OQ-71): Phase 39's **Stage refund after payout** (after Stage post-op
      scenario, 14's trigger as 38b re-pointed it) pays out through a Staged run; credit the invoice with 39's Credit and
      rebill. With no released payable for Dr Sharma, the draft does not list her and Approve stays
      disabled if nothing else is due; her Admin Ledger position shows the negative invoice to net
      with the "settles it with the anaesthetist outside the system" caption; her web Remittances
      shows the still-to-net panel. Then **Payment received · full** on one of her other invoices
      (or the 19-BCTI staging): the next draft nets the negative against it.
- [ ] Admin · Audit shows each new action with the right who, role and source (office for approval,
      the office stand-in for staged runs, system for detection, demo for the Xero-side batch
      payment).
- [ ] No en or em dash in any new string; no weekday, "weekly" or "20th" in app copy; no "carried
      forward" or "recovery" wording; negatives read "-$X.XX"; teal is the only action colour;
      crimson unused on the new screens.
- [ ] Catalogue screenshots: the recipes for US-10.2.5 and US-10.2.6 are created, any recipe this
      phase broke is re-pointed, a full `npm run capture` ends with no failed recipe and no story
      without a recipe, the covered items' new shots are checked by eye, and `npm run verify:board`
      is green.
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
    and run once she has a released payable). If asked what happens with no later payment: "That is
    rare. AA settles it with the anaesthetist outside the system; the balance stays visible on
    their ledger position."
  - **S3 Beat 3** (37's one-click "Simulate payment and payout"): the click is unchanged, but it now
    approves a one-bill staged run before Xero pays it. The Say line gains "the office approves it
    for payment"; Expected gains the Staged run under the Billing monitor's Runs this period.
  - The **Direct URLs** table gains "A payables run · `/admin/billing/payables-runs/<runId>`", "A
    remittance advice · `/admin/billing/payables-runs/<runId>/remittance/<registration>`" and "Web
    remittances · `/web/accounts/remittances`".
  - The S4 discovery points gain OQ-47 (who approves, the cycle), one line; OQ-71 is answered and
    is not a discovery point.
- **`02-workflows-and-handoffs.md`:** Workflow 7 (payments and payables) gains the approval step, the
  run record and the remittance advice; the correction after payout case (39's) gains "netted in
  the next run; with no later payment, settled with the anaesthetist outside the system".
- **`04-presenter-cheat-sheet.md`:** "Built and clickable" gains BCTI approval, netting and
  remittance advice; "The money model" gains "approve, then pay; negatives net; remittance per run";
  "Strong phrases" gains "Nothing is paid until the period's BCTIs are approved"; "Statements to
  avoid" gains "we pay every Tuesday" (OQ-47 is open) and "the system chases a departed
  anaesthetist" (OQ-71: outside the system).
- **`01-personas-and-responsibilities.md`:** the office approves each period's BCTIs; the
  anaesthetist reads their remittance advice in web Accounts.
- **`README.md`:** the readiness row for payables.
- **`master-demo-guide.html`:** the same sections (S4 Beat 5, the netting aside, the cheat-sheet
  equivalents, the workflows), then the milestone consistency read.
- **Control Panel scenario text:** the S3 and S4 messages, where they mention "Run payables" or the
  payout, gain the approve step. The PWA stand-in's new label, "Office approves and runs payables",
  goes wherever the guide names it.

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19),
run after the review pass and before the PROGRESS.md entry. Re-run
`node docs/prototype-build/catch-up/tools/recipe-status.mjs 39a` first: earlier phases may have
changed these recipes since this plan was written.

**Covered items.** When the phase is done, each recipe in `requirements-board/capture/recipes/`
matches what was built:

| Item | Recipe at plan time | When this phase is done |
|---|---|---|
| [US-10.2.5](../../../../requirements-board/requirements/stories/US-10.2.5.md) Negative invoices netted in the payment run | absent ("Not built yet: catch-up Phase 39a builds this"), no shots | captured. Replace the stub. Stage it with the `stage-payment-period` bar action, choice "19 BCTIs and a credit after payout", on `/admin/billing`, then approve and run. Admin shot `remittance-advice` at `/admin/billing/payables-runs/<runId>/remittance/<anaesthetistId>`, highlight `[data-shot=remittance-advice]` (the 19 BCTIs, the negative invoice netted as "-$X.XX", the net paid). Admin shot `payables-run-detail`, highlight `[data-shot=payables-run-detail]`. Web shots at `/web/accounts/remittances`: `web-remittances` (the table with signed netted amounts) and `web-remittance-sheet` (open a row, highlight `[data-shot=web-remittance-sheet]`). No shot of the no-later-payment case (outside the system, OQ-71). Mobile Balances is unchanged (a built default, logged for the owner) and has no shot. Captions in the catalogue's words: "The payment to the anaesthetist is the net total", "The remittance advice shows the negative invoice netted against the positive ones" |
| [US-10.2.6](../../../../requirements-board/requirements/stories/US-10.2.6.md) Approve the period's BCTIs for payment | absent ("Not built yet: catch-up Phase 39a builds this"), no shots | captured. Replace the stub. Admin `/admin/billing` after `stage-payment-period` ("19 BCTIs"): shot `approve-period` with `before` state highlighting `[data-shot=payables-run-draft]` and the disabled "Run payables in Xero" ("Nothing approved to pay"), `approved` state after clicking "Approve period's BCTIs" highlighting `[data-shot=payables-runs]` with the run's Approved pill, and `paid` state after the run. Caption: "BCTIs not yet approved are not in the payment run" |

**Recipes this phase breaks.** Work item 7 replaces the Billing monitor's payables panel with the payment period panel (approve, then run). Found at plan time, all keyed on `[data-shot=billing-payables-run]` (kept on the run button's container) and the button name `Run payables`:
- `US-10.2.1` shot `payables-run` (`/admin/billing`, highlight `[data-shot=billing-payables-run]`) and its `paid` state in the simulator; the caption "Authorised payables waiting for the payables run" becomes "Released payables wait for the period's approval" with the highlight on `[data-shot=payables-run-draft]`.
- `US-09.2.4` (`payables-run`, two states with a click on `[data-shot=billing-payables-run] >> role=button[name="Run payables"]`), `US-10.1.2` (click `role=button[name="Run payables"]`) and `US-08.3.4` (click `Run payables`, highlight `[data-shot=billing-payables-run]`): the button is now "Run payables in Xero" and is disabled until the period is approved. Insert a click on "Approve period's BCTIs" before each run click; keep the shot names.
- Recipes using the PWA or Xero-sim "Simulate payment and payout" are unaffected in effect (the one-pair staged run approves first); the `--dry` run is the check.
- Re-grep before capture: `grep -n 'Run payables\|billing-payables-run' requirements-board/capture/recipes/*.json`.

**ATLAS.md.** Routes: `/admin/billing/payables-runs/:runId`, `.../remittance/:anaesthetistId` and `/web/accounts/remittances`. Existing hooks: `payables-run-draft`, `payables-runs`, `payables-run-detail`, `remittance-advice`, `web-remittances`, `web-remittance-sheet`, `web-still-to-net`. Demo control panel: the `stage-payment-period` action and its two choices, and the reworded "Office approves and runs payables" PWA stand-in. Seed data: the backdrop runs the seeded disbursements are grouped into.

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
  outage queue. A staged run covers exactly its one pair. A run's lines never change after
  approval; a stale run is superseded, never edited.
- **Money conservation, in cents.** For every run: cash out per anaesthetist equals positives less
  netted, never below zero; each leg's disbursed plus offset never exceeds released; each negative's
  nettings never exceed its `recoveryDue`, and its `offsetAmount` never enters a run; the whole
  ledger and every anaesthetist's position stay in balance after approval, after sending and after
  detection. Hunt for an offset counted as cash (receipts held would drift) or a negative netted
  twice.
- **Idempotency.** `CNALLOC-` and `BILLPAY-` keys make every detection once-only through webhook,
  poll and queue; approve, run and re-approve are safe to press twice.
- **OQ-71: nothing built.** No carry-forward record, recovery invoice, age setting, write-off or
  "departed anaesthetist" path; an anaesthetist with only negatives is not in a run; the open amount
  shows on the ledger position with its one caption and nets in a later run with positives.
- **The period is a setting.** It lives in `appSettings.paymentRun`; no weekday, cycle or 20th in
  code or copy; string date maths only; no `Date.now()`, `new Date()` or `Math.random()`.
- **Hooks left for 41.** `runExclusionFor` is the only exclusion point; netting reads every open
  negative whatever its credit note's cause; a missing bank account is flagged, never excluded.
- **Seed and persistence.** Backdrop runs reproduce the seeded disbursements exactly and move no
  figure; two fresh seeds deep-equal; `PERSIST_VERSION` bumped; the staging body is deterministic.
- **Design and copy.** Signed amounts through one formatter with a hyphen-minus, neutral not red;
  teal the only action colour; the OQ-47 provisional label; no en or em dashes in app copy.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry; ROADMAP.md "Owner review: agents test
  themselves"): the defaults built for open questions (OQ-47's period setting and office approver),
  provisional readings (the GST schedule's treatment of a netted negative, OQ-29; the remittance
  advice in web Accounts and Admin only, with mobile Balances unchanged), anything logged
  rather than fixed, and the screens worth a look, each with its route and persona (the payment
  period panel, a run detail, a remittance advice, web Remittances as Dr Sharma and Dr Souter).
- **Status row** for catch-up Phase 39a, and a phase entry with:
  - the drift-check result (US-10.2.5 still Confirmed and US-10.2.6 still Verify or not; OQ-47,
    OQ-71, OQ-60 and OQ-29 status; whether 39 shipped a negative invoice record or this phase added
    it);
  - what was built, with the name map for later phases: `PaymentRunSettings` and
    `appSettings.paymentRun`, `PayablesRun` and its line, netting and total types, `paymentPeriodFor`,
    `periodLabel`, `runExclusionFor`, `buildRunDraft`, `netNegatives`, `remittanceAdvice`,
    `applyOffset` and `PayableLeg.offsetAmount`, `credit.nettedAmount` and the negative invoice's
    `nettings` and `'netted'` status, `payablesRunDraft`, `approvePeriodBctis`, `payRunInXero`,
    `recordOffset`, `payablesRunState`, `formatSignedCurrency`, `XeroCreditAllocation`,
    `XeroBatchPayment`, `approveAndPayPairForDemo`, the credit-after-payout fixture builder, the
    routes, id formats and audit actions;
  - the `PERSIST_VERSION` bump (from and to);
  - tests added and the before and after Vitest and Playwright counts;
  - the review pass.
- **Catalogue screenshots result:** recipes created or changed (US-10.2.5, US-10.2.6, plus the re-pointed US-10.2.1, US-09.2.4, US-10.1.2 and US-08.3.4), the `capture/REPORT.md` counts (captured, partial, absent, failed) before and after, and any partial reason handed to a later phase.
- **Decisions log:**
  1. **Amended:** 2026-07-24 "Phase 10 build - decisions" item (5), the payables run as an
     unbadged office action, and Phase 37's "Run payables in Xero pays every due bill": a released
     payable is paid only once the period's BCTIs are approved; the run is a record per period,
     frozen at approval, superseded rather than edited. The one-click demo payouts (Simulate payment
     and payout, Stage refund after payout, the PWA stand-in) approve first, through a one-pair
     staged run or the ordinary approval.
  2. **New:** the office approves (provisional, OQ-47); the period is a setting in
     `appSettings.paymentRun` (7 days from Wed 15 Jul, provisional); a period may hold supplementary
     runs; no copy names a payment day.
  3. **New:** netting is decided by the engine at approval, executed in Xero as an ACCPAYCREDIT
     allocation and a net batch payment, and recorded by the engine at detection; the offset is
     its own leg amount, never cash.
  4. **New (OQ-71 answered, owner decision D21):** a negative invoice with no later payment to net
     against is handled outside the system. A run never pays below zero; what it cannot net stays
     open and nets in a later run; an anaesthetist with only negatives is not in a run; the open
     amount is shown on the ledger position with one caption. No carry-forward record or recovery
     invoice.
  5. **New:** seeded disbursements are grouped into backdrop runs, so every payment has a run and an
     advice.
  6. If 39 recorded the payout case as a trail only: **superseded**, the negative invoice is a
     record netted in the next run (OQ-42 answered).
- **Handoff notes:**
  - For **41**: add `'heldInTrust'` to `runExclusionFor` for a held prepayment payable, nowhere
    else. A cancelled prepayment is not a negative to net (OQ-71's note: the money is still in trust
    and the anaesthetist has not been paid), so 41's cancellation refund normally raises nothing for
    a run; a refund that ever follows a payout goes through 39's credit path and is netted here with
    no change. The seeded prepayment payout's backdrop run is rebuilt by `buildRunDraft` when 41
    reseeds the hold; the moved prepaid Booking's payee repoint (US-06.5.4) changes the run line's
    anaesthetist through the pair, not the run.
  - For **16 / OQ-60**: the fee never nets against payables (Greg, trust law); `netNegatives` never
    sees a fee invoice. If AA's accountant ever says otherwise, `netNegatives` is the place.
  - For **38**: the GST schedule's treatment of an offset-settled bill and a netted negative, as
    built and labelled.
  - For **43**: runs with many lines and many anaesthetists must stay usable at full scale.
  - For **44**: S4 Beat 5 and its netting aside and S3 Beat 3 as rewritten here; the OQ-47 line if
    answered later; for the PWA parity audit, "no new mobile beat; the PWA payout stand-in approves
    first".
