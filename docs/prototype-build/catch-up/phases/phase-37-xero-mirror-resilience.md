# Phase 37 · Xero mirror resilience

**Requirements covered:**
[EP-09](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/EP-09.md)
(the epic's resilience and divergence discussion: durable queue, retry with exponential backoff,
idempotency, alerting, a void made directly in Xero),
[US-09.2.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-09.2.4.md)
(detect disbursement),
[US-10.2.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-10.2.4.md)
(bulk remittance stays in Xero).
Context only, must stay green:
[FT-09.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-09.2.md),
[US-09.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-09.2.1.md),
[US-09.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-09.2.2.md)
(its technical discussion is where the void and amendment check lives),
[US-09.2.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-09.2.3.md),
[US-10.1.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-10.1.2.md),
[US-10.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-10.2.1.md),
[US-10.2.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-10.2.3.md),
[US-08.3.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.3.2.md).
No DM or RV item is owned here. The phase builds on
[DM-18](../analysis/domain-model-delta.md#dm-18) (the ledger pair, Phase 36); no
[reverse-check](../analysis/reverse-check.md) finding covers Xero resilience.
Open question for context: [OQ-47](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-47.md)
(payment day and cycle). No owner decision (D1 to D11) gates this phase.
**Depends on:** Phase 36 (the internal ledger: linked receivable and payable legs as the system of
record, the Admin Ledger screen). Through it, Phase 14 (the demo-trigger registry and the re-homed
payment, poll and handoff-fault triggers; "Run payables" was deliberately **not** registered and stays
the Billing monitor's own product button), Phase 15 (Booking names), Phase 16 (the payable equals the
receivable; `invoiceNumber` and `reference` stored on both Xero records, which the remittance matcher
keys on; `XeroAccRec.kind`) and Phase 26 (the payables run's destination account and bank hold).
Runs in any order with 38 and 39.

**Terminology.** After Phase 36 a "ledger pair" is the engine's record (`LedgerPair`, with a
receivable leg and a payable leg). This doc says **Xero pair** for the ACCREC plus ACCPAY that mirror
it, and "handoff" for the call that creates the Xero pair and stamps the legs' mirror ids.
**Estimated:** 1 session (a full one, at the upper bound). If it runs long, stop green after work
item 8 (outage queue and disbursement detection, with their triggers registered, the Billing monitor
queue panel and payables copy from item 11, and the PROGRESS entry marked part 1) and finish the void
and amendment, the remittance, the rest of the UI and the demo guide in a second session.

## Goal

The Xero mirror behaves like a real, fallible integration, while the ledger stays the system of
record.

- **Disbursement is detected, not performed.** The engine no longer pays the anaesthetist itself.
  An ACCPAY is paid in Xero (the payables run happens there), and the engine learns it through a
  "bill paid" webhook, or at the next reconciliation poll if the webhook goes missing. Only then does
  it record the disbursement against the payable leg, so "paid into AA" and "disbursed" stay two
  separately tracked states (US-09.2.4, US-10.1.2). The Admin Billing monitor's payables panel stays
  as the office's view of what is due and what has gone out.
- **Bulk remittance is left in Xero.** One hospital remittance pays several receivables in one action.
  Xero's (simulated) remittance add-on matches the lines by InvoiceNumber, and the engine learns each
  matched payment through the ordinary webhook. One line cannot be matched and stays in a "Xero bank
  reconciliation" list for the office to handle in Xero. The engine has no bulk-matching code at all
  (US-10.2.4).
- **An outage does not stop the office.** While Xero's API is unavailable, every engine-to-Xero call
  (pair handoffs, payment syncs, disbursement syncs, the poll) goes into a visible durable queue with an
  attempt count and an exponential-backoff next-attempt time on the demo clock, and alerts after
  repeated failures. Authorising a List carries on as normal. Restoring Xero drains the queue in order,
  with no duplicate pair, contact, receipt or disbursement. The one-shot "Arm handoff failure" becomes
  one failed attempt that the queue retries by itself.
- **Drift is noticed.** An invoice voided or amended directly in Xero is invisible to the engine until
  the next poll compares Xero with what the engine issued; the poll then flags it for the office to
  resolve.
  The policy for resolving it is AA's to agree (EP-09), so the resolution is recorded, labelled
  provisional, and moves no money.

## Before you start: drift check

1. Run:

   ```
   git diff 1f067a8 -- "docs/discovery-reference/Updated Requirements/catalogue" "docs/discovery-reference/Updated Requirements/domain-model.md"
   ```

   Read the hunks for EP-09, FT-09.2, US-09.2.1, US-09.2.2, US-09.2.3, US-09.2.4, US-10.1.2,
   US-10.2.1, US-10.2.3, US-10.2.4, US-08.3.2, OQ-47 and the domain-model lines on Xero, the payables
   run and bank reconciliation.
2. If an item changed, re-read it in full and adjust the work items before building. If an item is
   now Retired or Future, drop its work and say so in the PROGRESS entry:
   - **EP-09's technical discussion** no longer proposes a durable queue with backoff: drop work items
     1, 5, 6 and 7 and the queue panel in 11 (keep the divergence check if divergence is still named).
     If it no longer names voids or amendments made in Xero, drop that kind from work items 2 and 9
     unless US-09.2.2's technical discussion still asks for it.
   - **US-09.2.4** now has the engine initiate the payables run (for example through Xero's batch
     payment API): keep the detection path, but keep today's engine-side run as the trigger and say so.
   - **US-10.2.4** Retired or moved to Future: drop work items 3 and 10 and the Bank reconciliation tab.
   - A new small, Confirmed story on this surface (for example payment against a credited invoice)
     joins only if it fits the session; otherwise record it for Phase 44's handoff.
3. **Open questions.** None blocks this phase. OQ-47 (payment day and cycle) stays open: the payables
   run stays an on-demand action, and no copy names Tuesday, Wednesday, the 20th or a weekly cycle. If
   OQ-47 is answered with a cycle, still do not model it here; note it for Phase 38 or 44. The divergence
   resolution policy is not an OQ but is explicitly "to be worked through with AA": build the
   provisional recorded resolution in work item 9 and label it.
4. **Confirm the base.** Read the Phase 36 PROGRESS entry and confirm its exact names. Its plan
   (`phase-36-internal-ledger.md` work items 2, 5, 7 and 8) names, and this doc uses: `LedgerPair`
   (kinds `procedure`, `prePayment`, `aaFee`) in `billing.ledger`, legs `receivable` (`amount`,
   `receivedAmount`, `xeroAccRecId`) and `payable` (`amount`, `releasedAmount`, `disbursedAmount`,
   `paidOutAtISO`, `xeroAccPayId`); `LedgerDisbursement` (`LD`, with `payablesRunId`, `destination`,
   `xeroDisbursementId`) in `billing.disbursements`; the pure `applyReceipt` / `applyDisbursement` and
   `pairStatusLabel` in `domain/billing/ledger.ts`; `LedgerPair.handoffFailure` (the fault shown as
   "Not yet in Xero"); `handoffPair`, `handoffPairsForBooking`, `handoffListPairs`; selectors
   `pairsNotInXero`, `openBillingExceptions`, `billingAttentionCount` (exceptions plus pairs not in
   Xero); audit codes `ledger.disbursed` and `xero.disbursed`; `BillingException` for billing-run
   failures. Use whatever Phase 36 actually shipped where it differs. Note whether AA fee receivables
   are handed off through `handoffPair` (Phase 36 says they are). Read the Phase 14 entry for the
   registry file and entry ids (`run-reconciliation-poll`, `arm-handoff-fault`, `payment-full`,
   `payment-half`, `payment-replay`, `pwa-payment-full`, `pwa-payment-half`, and its ruling that "Run
   payables" is not a bar entry), the Phase 16 entry for the stored `invoiceNumber` / `reference`
   fields, and the Phase 26 entry for `heldForBank`. Check whether Phase 39 (credit and rebill) has
   landed, because an engine-initiated void or credit must never be flagged as drift (work items 2 and
   9). Note the current `PERSIST_VERSION`.
5. Record the result (changed items, the Phase 36 names used, whether 39 has landed) in the PROGRESS
   entry.

## Reference

**Design (convention 17).** No mockup covers the Billing monitor, the Admin invoice rail or the Xero
simulator, so extend their existing patterns; do not invent a new visual language.
- [Design Language.dc.html](../../../design/Design%20Language.dc.html): teal `#0D6E63` for the only
  actions ("Retry now", "Resolve", "Match in Xero"); semantic warning tint and on-tint for "Waiting
  for Xero" and "Retrying"; semantic danger for "Alert raised" and "Voided in Xero"; success for
  "Sent" and "Disbursement recorded"; pills at radius 999; Spline Sans Mono with tabular-nums for
  every amount, id, attempt count and time; card radius 14; crimson nowhere new. The six schedule
  status colours are never reused for queue or money states.
- [Admin Review.dc.html](../../../design/Admin%20Review.dc.html) and
  [Admin Day.dc.html](../../../design/Admin%20Day.dc.html): the admin panel, table and side-sheet
  anatomy the new Billing monitor panels and the Resolve sheet follow.

**Catalogue.** The covered items above. EP-09's "Technical discussion" is the resilience brief;
US-09.2.2's is the void and amendment check; US-10.2.4 is short and states the scope fence.

**Analysis.**
- [GAP-ANALYSIS.md](../GAP-ANALYSIS.md): "Demo-trigger buttons" (the Money cluster), the EP-09 and
  EP-10 tables; per-gap detail in [epics/EP-09.md](../epics/EP-09.md) (header note themes 1, 3 and 5;
  sections EP-09 and US-09.2.4) and [epics/EP-10.md](../epics/EP-10.md) (US-10.2.4).
- [analysis/prototype-map-store-seed.md](../analysis/prototype-map-store-seed.md) sections 4 (money
  pipeline) and 9 (clock-coupled behaviour);
  [prototype-map-admin.md](../analysis/prototype-map-admin.md) section 7 (Billing monitor);
  [prototype-map-shell-demo-pwa.md](../analysis/prototype-map-shell-demo-pwa.md) sections 5.2 (Xero
  simulation), 7 (PWA wiring) and 9 (extension points).
- [analysis/domain-model-delta.md](../analysis/domain-model-delta.md#dm-18) DM-18 (what Phase 36 built).

**Code entry points** (paths under `aa-prototype/src/` unless stated, names and lines as at the
snapshot; Phase 36 renames most of them (see drift check step 4), so re-read them after Phases 14 to
36):
- Handoff: `store/xeroHandoff.ts` `handoffCase` (becomes `handoffPair`; fault path on
  `settings.failNextHandoff` at ~174, pair creation ~198 to 286), `handoffCasesForCard` (becomes
  `handoffPairsForBooking`); `store/billingRun.ts` `handoffListCases` (becomes `handoffListPairs`),
  `wireBillingRun`; `store/prepaymentActions.ts` (the prepayment raise); Phase 14's office stand-in
  (`officeStandIn.ts`, `authoriseAsSimulatedOffice`) and `pwa/officeSimulation.ts`, both of which hand
  off through `handoffListPairs`, so the PWA's authorise path goes through the gate automatically;
  `store/demoSettingsActions.ts` `armHandoffFault`.
- The only retry precedent today is `store/integrationActions.ts` `wireIntegrationRetry`, which uses a
  wall-clock `setTimeout`. Do **not** copy it: the Xero queue retries on the demo clock only.
- Payments: `store/paymentActions.ts` `receivePayment` (webhook and poll share it; idempotent by the
  receipts key-set; appends `PaymentIn` unless Xero already holds it, the seeded missed-webhook shape).
- Payables: `store/payablesActions.ts` `payablesDue`, `disbursePayables` (writes the Xero
  `Disbursement` row, the ACCPAY and the case in one mutate today; after Phase 36 it applies
  `applyDisbursement`, writes a `LedgerDisbursement` and mirrors the Xero row, audited `ledger.disbursed`
  then `xero.disbursed`), `runPayables`, `disbursePayable(api, actor, pairId)`, Phase 26's
  `heldForBank`.
- Poll and jobs: `store/reconciliationPoll.ts` `runReconciliationPoll` (PaymentIn only),
  `wireReconciliationPoll`; `store/archiveActions.ts`; `store/events.ts` (`listAuthorised`,
  `dayAdvanced` only); `store/clockActions.ts` `applyClock` (clock writes go straight to state, then
  emit `dayAdvanced`); `domain/clock.ts` (`advanceMinutes`, `now`); `store/mutate.ts` `ID_FORMATS`,
  `clockISO`, `resetDomainState`; `store/appStore.ts` `BillingSlice`, `XeroSlice`, `freshAppState`,
  `PERSIST_VERSION`; `main.tsx` and `aa-prototype/pwa/main.tsx` (the `wire*` bootstrap calls).
- Types: `domain/types.ts` `BillingCase` (`handoffFailure`; deleted by Phase 36 in favour of
  `LedgerPair`), `XeroAccRec` (`status: 'voided'` is typed and rendered but never set), `XeroAccPay`,
  `PaymentIn`, `Disbursement`, `DemoSettings`.
- Selectors: `store/selectors.ts` `handoffFailedCases` (Phase 36: `pairsNotInXero`),
  `billingAttentionCount` (read by `apps/admin/AdminApp.tsx` for the nav badge), `openAccRecs`,
  `billingMonitor` (the `xero` stage ~531); Phase 36's `store/ledgerSelectors.ts`.
- UI: `apps/admin/screens/BillingMonitorScreen.tsx` (`resolveAndRetry` ~65, payables panel
  `data-shot="billing-payables-run"` with its product "Run payables" button calling `runPayables`
  ~52, `CardStatusPill` "Handoff failed");
  `apps/admin/screens/InvoiceDocument.tsx` (rail "Xero handoff" `RailCard` ~297, `XeroReference`);
  `apps/demo/DemoXero.tsx` (tabs and `TabLink` ~71, `InvoicesTable`, `PairDetail` and `settleInvoice`
  ~230, whose state-aware button reads "Simulate payment and payout" or, on a paid but undisbursed
  pair, "Pay <anaesthetist> now" ~299 and calls `disbursePayable`; `AccPayCard`, `RecordStatus`
  renders Voided, `StatusChip`), `apps/demo/xeroPairView.ts`; `router.tsx` (`demo/xero` routes ~124).
- Seed: `domain/seed/history.ts` (Dr Souter's backdrop; open St George's receivables `oa01`
  $845.00, `oa03` $520.50, `oa04` $980.00 and `oa07` $610.00 Mitchell, which is the prior-balance and
  Phase 40 unpaid-alert story and must not be touched; the missed-webhook `oa02`); invoice numbers
  `AA-2026-H<n>`.
- Audit labels: `shared/audit/actionLabels.ts`; `auditNarrative.test.ts` enforces a label for every
  emitted action code.
- Tests today: `store/xeroHandoff.test.ts`, `store/paymentActions.test.ts`,
  `store/payablesActions.test.ts`, `store/seedBilling.test.ts`, `store/persistMigrate.test.ts`,
  `store/xeroNhi.test.ts`, `apps/demo/DemoXero.test.tsx`, `apps/demo/xeroPairView.test.ts`,
  `domain/domainPurity.test.ts` (covers the new `domain/xero/` and `domain/xeroSim/` folders),
  `pwa/pwaPurity.test.ts`, Phase 14's `shared/demoTriggers/demoTriggers.test.ts`; Playwright specs in
  `aa-prototype/visual/` (not under `src/`): `xero-pair.spec.ts`, `admin-phase08.spec.ts` (handoff
  failure), `admin-phase09.spec.ts`.
- Outside the app: `requirements-board/capture/recipes/US-09.2.4.json` (its four captures walk the old
  engine-side payout) and `requirements-board/capture/ATLAS.md` (sections "Existing hooks" and "Demo
  control panel", as Phase 14 left them).

## Work items

Model, rules and store first, then UI, then triggers, tests and docs. Every write goes through
`mutate()` with an audit entry; every new action code gets a label in `ACTION_LABELS`. Time comes
only from the demo clock (`clockISO`, `advanceMinutes`); no `Date.now()`, `new Date()` or
`Math.random()`.

1. **Pure queue rules** (`src/domain/xero/queue.ts`, exported from `src/domain`):
   `XERO_RETRY_BASE_MINUTES = 2`, `XERO_RETRY_CAP_MINUTES = 60`, `XERO_ALERT_AFTER_ATTEMPTS = 5`
   (one labelled block: "demo values; production timings are a Scoping decision"),
   `retryDelayMinutes(attempts)` = `min(base * 2^(attempts - 1), cap)` (2, 4, 8, 16, 32, 60, 60),
   `nextAttemptISO(fromISO, attempts)` built on `domain/clock.ts` minute arithmetic, `isDue(item,
   nowISO)`, `isAlerted(attempts)`. Vitest: the sequence, the cap, attempt 0 guarded, `isDue` at,
   before and after the boundary, identical output for identical input. Satisfies EP-09 "a failed
   call retries automatically with exponential backoff".
2. **Pure divergence rule** (`src/domain/xero/divergence.ts`):
   `detectXeroDivergences(engineReceivables, xeroAccRecs, existingFlags)` returns new findings of two
   kinds: `voidedInXero`, per ACCREC that Xero shows `voided` while the engine's receivable leg is
   still open and the engine did not itself void or credit it (Phase 39's credit note, if landed, is
   the engine's own marker); and `amendedInXero`, per ACCREC whose Xero total differs from the
   receivable leg's `amount` (the engine issued one figure, Xero now holds another). None for an
   ACCREC already flagged with an open finding of that kind. Vitest: each kind flags once; never
   re-flags; an engine-initiated credit or void is not drift; a paid receivable is never flagged as
   voided; an unchanged total is never flagged as amended; order is stable (by ACCREC id, then kind).
   Satisfies EP-09 divergence ("an invoice voided or amended directly in Xero ... invisible to the
   engine unless something is looking for it") and US-09.2.2's technical discussion ("confirms that
   authorised invoices in Xero still match what the engine issued").
3. **Pure remittance matcher, on the Xero side only** (`src/domain/xeroSim/remittance.ts`, header
   comment: "Simulates Xero's bank reconciliation and remittance add-on. The Billing Engine never calls
   this; see US-10.2.4."): `matchRemittanceLines(lines, accRecsForContact)` matches each line on an
   exact stored `invoiceNumber` (Phase 16) with an amount at or below that ACCREC's balance, and
   returns `{ matched: {lineId, accRecId, amount}[], unmatched: lineId[] }`. A line matches at most one
   ACCREC and an ACCREC at most one line per remittance. Vitest: exact match; unknown or mistyped
   number unmatched; amount above balance unmatched; a voided ACCREC never matched; deterministic.
   Add a source-scan test (`src/domain/xeroSim/scopeFence.test.ts`, like `pwaPurity.test.ts`):
   nothing under `src/domain/billing/` or `src/domain/xero/`, and no engine store module
   (`xeroHandoff.ts`, `paymentActions.ts`, `payablesActions.ts`, `reconciliationPoll.ts`,
   `disbursementDetection.ts`, `xeroQueue.ts`, `billingRun.ts`, the Phase 36 ledger modules and
   `ledgerSelectors.ts`) imports `domain/xeroSim/`; only `store/xeroSimActions.ts` and the Xero
   simulator UI may. This is the "bulk matching stays out of the engine" fence the risk note asks for.
4. **Types and slices** (`domain/types.ts`, `store/appStore.ts`, `store/mutate.ts`,
   `domain/seed/billing.ts`):
   - `XeroQueueItem`: `id` (`XQ####`), `kind: 'handoff' | 'paymentSync' | 'disbursementSync' |
     'poll'`, `idempotencyKey` (`HANDOFF-<case or pair id>`, the payment's key, the bill payment's
     key, `POLL-<dateISO>`), `target` (`{ caseId?, accRecId?, accPayId?, xeroPaymentId? }`, using
     Phase 36's pair id where it replaced the case), `enqueuedAtISO`, `attempts`, `nextAttemptAtISO`,
     `lastError?`, `status: 'waiting' | 'alerted' | 'sent'`, `sentAtISO?`. Held engine-side in the
     billing (ledger) slice as `billing.xeroQueue`, because the durable queue belongs to the engine.
     Sent items stay (the panel shows what drained and when; tests assert no duplicates).
   - `XeroDivergence`: `id` (`XD####`), `kind: 'voidedInXero' | 'amendedInXero'`, `accRecId`, the
     ledger pair id, `invoiceId`, `xeroShows` (`{ status, total }`), `engineHolds` (`{ amount,
     outstanding }`), `detectedAtISO`, `status: 'open' | 'resolved'`, `resolution?: { outcome:
     'reissueInXero' | 'creditInEngine' | 'noAction', note, who, atISO }`. Engine-side,
     `billing.xeroDivergences`.
   - Engine-side disbursements: extend Phase 36's `LedgerDisbursement` (`billing.disbursements`, `LD`)
     with `idempotencyKey` (the Xero bill payment's `BILLPAY-` key) and `detectedBy: 'webhook' |
     'poll'`, and make `xeroDisbursementId` set on every detected entry; `payablesRunId` carries the
     Xero payables run id. Do not add a second disbursement map. The key-set makes detection idempotent
     exactly as receipts do for payments. Seeded `LD` entries (Phase 36's backdrop) get their key and
     `detectedBy: 'poll'` so replaying a seeded bill payment is a no-op.
   - Xero side: `Disbursement` (the Xero bill payment) gains `idempotencyKey` (`BILLPAY-<id>`);
     `XeroAccRec` gains `voidedAtISO?` and `amendedAtISO?` (with the engine-issued total kept on the
     leg, so Xero's `total` is free to drift); new `XeroRemittance` (`RMT####`: `payerContactId`,
     `receivedAtISO`, `reference`, `lineIds`) and `XeroBankLine` (`BKL####`: `remittanceId`,
     `quotedReference`, `amount`, `status: 'matchedByAddOn' | 'unmatched' | 'matchedByOffice'`,
     `accRecId?`, `paymentInId?`) in `xero.remittances` and `xero.bankLines`.
   - `DemoSettings.xeroOutage?: { sinceISO }` (demo state, like `failNextHandoff`).
   - **Remove `LedgerPair.handoffFailure`** (Phase 36's carry-over of `BillingCase.handoffFailure`): a
     failed handoff is now a queue item. `pairStatusLabel`'s `handoffFailed` becomes `waitingForXero`
     (derived from an open queue item for the pair, passed in; the pure label function stays pure and
     tested). `pairsNotInXero` stays (a pair with no mirror ids is still not in Xero); the monitor's
     handoff-fault list is replaced by `xeroQueueView` (work item 9).
   - `ID_FORMATS`: `xeroQueueItem` `XQ`, `xeroDivergence` `XD`, `remittance` `RMT`, `bankLine` `BKL`,
     each pad 4. Thread every new map through `freshAppState`, `resetDomainState` and
     `SeedBillingSlice` (empty maps; the seed ships no queue, flag or remittance). **Bump
     `PERSIST_VERSION`** by one. `seedBilling.test.ts`: two builds deep-equal; `resetDomainState`
     restores empty maps and clears `xeroOutage`. `persistMigrate.test.ts` stays green.
5. **A clock tick event.** `store/events.ts` gains `{ type: 'clockAdvanced'; fromISO; toISO }`;
   `applyClock` emits it on every clock change, after `dayAdvanced` when both fire, so a day advance
   polls first and then works the queue. Vitest: `+15 min` emits one `clockAdvanced` and no
   `dayAdvanced`; `Next day` emits both in that order.
6. **The outage and the queue** (new `src/store/xeroQueue.ts`, exported from `src/store`):
   - `xeroAvailable(state)`: false while `settings.xeroOutage` is set.
   - `setXeroOutage(api, actor, on)`: sets or clears the flag (audit `xero.outageStarted` /
     `xero.outageEnded`, source demo). Clearing it calls `processXeroQueue(api, { force: true })` in
     the same call, so "Restore Xero" drains at once.
   - `enqueueXeroWork(...)` (module-internal): idempotent by `idempotencyKey` (an open item with that
     key is returned, never duplicated); records attempt 1 with `lastError` and `nextAttemptAtISO`.
     Audit `xero.queued`, source system.
   - `processXeroQueue(api, { force?, itemId? })`: takes the due (or forced) open items in id order,
     at most one attempt per item per call (a `+7 days` jump is one more attempt, not a catch-up
     burst). While Xero is unavailable each attempt fails: `attempts + 1`, new backoff, `status:
     'alerted'` from `XERO_ALERT_AFTER_ATTEMPTS` on (audit `xero.retryFailed`, and `xero.retryAlert`
     once). When available, each item runs its own idempotent handler (`handoff` creates the Xero pair,
     `paymentSync` calls `receivePayment` with the stored key, `disbursementSync` calls
     `recordDisbursement`, `poll` calls `runReconciliationPoll`) and becomes `sent` (audit
     `xero.queueSent`). No mutation and no audit when nothing is due.
   - `retryXeroItemNow(api, actor, itemId)`: the office's product action; refuses anaesthetists.
   - `wireXeroQueue(api)`: subscribes to `clockAdvanced` and calls `processXeroQueue`. Wire it in
     `main.tsx` and `pwa/main.tsx` beside the other `wire*` calls.
   Satisfies EP-09 "durable queue: every financial event is written to a queue before it is sent to
   Xero ... nothing is lost", "asynchronous processing ... does not block workflow progression",
   "idempotency: retries never result in duplicate invoices", and "retry and alerting".
7. **Route every engine-to-Xero call through the gate** (the whole of EP-09's "Xero calls are handled
   outside the main request cycle"):
   - `handoffPair` (Phase 36's name) splits into an internal `createXeroPair` (Phase 36's handoff
     mutate: create the ACCREC and ACCPAY, stamp the legs' mirror ids; unchanged in behaviour and
     idempotency) and the public gate: Xero unavailable, enqueue `handoff` with `lastError` "Xero API
     unavailable (simulated outage)"; `settings.failNextHandoff` set, clear it and enqueue with "Xero
     rejected the call (simulated fault)" (the armed fault is now one failed attempt that the queue
     retries on the next due tick, no manual step); otherwise create the Xero pair.
     `handoffListPairs`, `handoffPairsForBooking`, the prepayment raise and the AA fee run keep calling
     the gate, so authorising a List during an outage succeeds, bills, and queues its handoffs. The
     ledger pair exists either way (Phase 36), so every money view keeps working. If an AA fee ACCREC
     is created outside `handoffPair`, route it through the same gate.
   - Payment webhooks: add `deliverPaymentWebhook(api, input)` in `paymentActions.ts`. Available, it is
     today's `receivePayment` with `source: 'webhook'`. Unavailable, it records the Xero-side `PaymentIn`
     only (the money has landed in Xero; the same shape as the seeded missed webhook) and enqueues a
     `paymentSync` with the payment's key. Every webhook-style caller (the Phase 14 payment triggers and
     their PWA twins, `settleInvoice`, the remittance and "Match in Xero" in work item 10) uses it.
     `receivePayment` also refuses a voided ACCREC with code `voidedInXero`.
   - `runReconciliationPoll` during an outage enqueues one `poll` item (key `POLL-<todayISO>`) and
     returns without reading Xero. The archive job during an outage skips with the reason "Xero
     unavailable; the next nightly run catches up" and no mutation.
   Vitest (`xeroQueue.test.ts`): outage on, authorise two Lists, both bill (ledger pairs exist) and
   queue one handoff per ledger pair, no Xero pair exists; `+15 min` twice raises attempts and pushes
   `nextAttemptAtISO` out by the backoff; five failures alert once; restore drains in id order, each
   ledger pair gets exactly one Xero pair, the payer contact is resolved once (no duplicate contact),
   and a second restore or a forced retry is a no-op; the armed fault fails once and the Xero pair
   appears on the next due tick; a half payment during the outage adds one `PaymentIn`, no receipt, and
   after restore exactly one receipt and a payable leg released (and a Xero ACCPAY authorised) for
   exactly the amount received; the poll catching that same payment first then the queue draining is
   still one receipt; `setXeroOutage` and `retryXeroItemNow` actor guards; determinism.
8. **Disbursement detected from Xero** (US-09.2.4):
   - New `src/store/xeroSimActions.ts` holds the Xero-side simulated actions, each audited with a Xero
     actor (`{ who: 'Xero payables run (simulated)', role: 'office', source: 'demo' }` and similar):
     `payBillsInXero(api, actor, accPayIds, { webhook: 'deliver' | 'missed' })` pays
     `amountAuthorised - amountDisbursed` on each ACCPAY in Xero: it appends the Xero `Disbursement`
     row (with its `BILLPAY-` key and a payables-run id) and updates the ACCPAY's `amountDisbursed` and
     status, and nothing engine-side (audit `xero.disbursed`, Phase 36's code, now Xero side only). Then, per bill payment: `deliver` and Xero
     available calls `recordDisbursement` as the webhook; `deliver` during an outage enqueues a
     `disbursementSync`; `missed` does nothing, so the next poll finds it. It pays only what the Xero
     ACCPAY shows authorised, and it refuses an ACCPAY whose anaesthetist Phase 26 holds for missing
     bank details (`heldForBank`), so the hold still bites.
   - New `src/store/disbursementDetection.ts`: `recordDisbursement(api, { accPayId, xeroDisbursementId,
     amount, atISO, idempotencyKey, detectedBy })`, idempotent by key, finds the ledger pair by the
     payable leg's `xeroAccPayId`, applies Phase 36's pure `applyDisbursement` (cumulative disbursed,
     `paidOutAtISO` when full) and writes the `LedgerDisbursement` with Phase 26's destination snapshot,
     in one mutate audited `ledger.disbursed` (the Phase 36 code, so the Ledger screen and audit
     narrative keep working) with `detectedBy` in the `after`, actor "Xero webhook" or "Reconciliation
     poll", source system. It refuses an unknown ACCPAY and an amount above released minus disbursed
     (`applyDisbursement`'s own refusal; log and skip in the poll rather than throw).
   - `runReconciliationPoll` also re-detects every Xero bill payment whose key the engine has not
     recorded, dated at the payment's own `atISO` (as Phase 10 did for receipts), and returns
     `{ payments, disbursements, divergences }` (update the Phase 14 poll trigger's message).
   - `runPayables(api, office)` (the Billing monitor's own product button; Phase 14 did not register
     it) and `disbursePayable(api, actor, pairId)` (the Xero pair's in-page payout) become the payables
     run in Xero: `payBillsInXero(..., { webhook: 'deliver' })` over every released and undisbursed
     payable leg from `payablesDue` (or the one pair). `payablesDue` is unchanged and still reads the
     ledger alone. The run no longer writes the payable leg or the `LedgerDisbursement` directly; the
     Phase 36 `xero.disbursed` code now labels the Xero-side bill payment only.
   - Vitest (`disbursementDetection.test.ts`, updated `payablesActions.test.ts`): a bill paid in Xero
     with the webhook flips the payable leg to disbursed; with `missed`, Xero shows paid and the engine
     shows released, undisbursed, until the poll, which records it once with the bill payment's date;
     a replayed webhook or a second poll is a no-op; part-then-balance payments disburse exactly each
     increment and never more than authorised; an outage queues the sync and restore records it once;
     conservation on every ledger pair (disbursed at most released, released at most received) and the Phase 36 ledger position in balance.
9. **Void or amendment made in Xero, flagged at the next poll** (EP-09 divergence):
   - `voidAccRecInXero(api, actor, accRecId)` in `xeroSimActions.ts`: sets the ACCREC `voided` with
     `voidedAtISO`, Xero side only (audit `xero.voidedInXero`, source demo). It refuses: not found,
     already voided, an AA fee ACCREC ("Fee invoices are outside this check"), and any ACCREC with a
     payment applied ("Xero cannot void an invoice with payments applied; remove the payment in Xero
     first", Xero's own rule).
   - `amendAccRecInXero(api, actor, accRecId)` in `xeroSimActions.ts`: AA staff edit a line in Xero,
     lowering the ACCREC's `total` by a fixed demo $20.00 (one labelled constant) and stamping
     `amendedAtISO`, Xero side only (audit `xero.amendedInXero`, source demo). It refuses: not found,
     voided, an AA fee ACCREC, a payment applied, an amount that would reach zero, and a second
     amendment on the same ACCREC ("Already amended in Xero"). The receivable leg keeps the
     engine-issued amount. Payment triggers keep reading what Xero shows, so a "full" payment of the
     amended total leaves the ledger receivable $20.00 open, which is exactly the drift the flag
     explains; nothing auto-corrects it.
   - `runReconciliationPoll` runs `detectXeroDivergences` after payments and bill payments and records
     each finding (audit `xero.divergenceFlagged`, source system). Nothing else changes: the
     receivable leg stays as issued because the ledger, not Xero, is the system of record (US-08.3.2).
   - `resolveXeroDivergence(api, office, id, { outcome, note })`: office only, note required, records
     the resolution (audit `xero.divergenceResolved`) and moves no money. If Phase 39 has landed, the
     `creditInEngine` outcome links to that invoice's "Credit in full and rebill"; otherwise it is only
     recorded.
   - Selectors: `xeroQueueView(state)` (open items first, then the last sent, with target labels and
     `nextAttemptAtISO`), `openXeroDivergences(state)`, and `billingAttentionCount` = open billing
     exceptions + alerted queue items + open divergences (a Xero pair merely waiting in the queue does
     not raise the nav badge until it alerts). `openAccRecs` excludes voided ACCRECs, so no
     payment picker offers one. The `billingMonitor` Xero stage gains a waiting state ("N waiting for
     Xero · next try HH:mm", warning) and a flagged detail for a voided or amended Xero pair.
   - Vitest: a void or an amendment is invisible until the poll; the poll flags each once; a second
     poll does not re-flag; a payment trigger on a voided ACCREC refuses; a full payment on an amended
     ACCREC leaves the receivable leg open by exactly the difference; resolving records the outcome
     and changes no amount; an engine-initiated credit (if 39 landed) is never flagged.
   - If Phase 39 has landed, also detect EP-09's other named case, a payment recorded in Xero against
     an invoice the engine has since credited (`paidAfterCredit`: the receipt is held, never applied to
     the credited leg, and flagged); if not, record it in the handoff for Phase 39 or 44.
10. **Bulk hospital remittance, left in Xero** (US-10.2.4):
    - Fixture `ST_GEORGES_REMITTANCE` in `src/domain/xeroSim/remittanceFixtures.ts`: one St George's
      remittance advice (reference "St George's remittance 21 Jul") with three lines, resolved from the
      seed by stable history ids, not typed amounts: the `oa01` and `oa03` receivables quoted by their
      exact InvoiceNumber and amount, and a third line for the `oa04` amount ($980.00) quoting a
      mistyped number (the session picks the typo, for example the digits transposed). `oa07`
      (Mitchell) is deliberately not on it. The two matched receivables are part of Dr Souter's seeded
      backdrop, which Phase 10 kept out of the payment picker (Decisions log, 2026-07-24 Phase 10
      decision 7); this trigger pays them on purpose, because a hospital settling aged invoices in one
      deposit is exactly what the backdrop models. Record that in the Decisions log. Resolve the three
      lines at run time and assert (in the fixture's test) that all three receivables share the St
      George's contact and are still open: if Phases 18 to 22 re-billed `oa04` (an ACC-related row) to
      another payer, use the next open St George's backdrop receivable other than `oa07` and say so.
      The remittance lowers Dr Souter's seeded outstanding by the two matched amounts, which is why the
      demo guide runs it after the scripted money beats.
    - `receiveBulkRemittance(api, fixture)` in `xeroSimActions.ts`: once only (a second call refuses
      "Already received"). It records the remittance and its bank lines, runs `matchRemittanceLines`,
      then for each matched line creates the Xero-side payment through `deliverPaymentWebhook` with key
      `REMIT-<remittanceId>-<lineId>` (so the engine learns each one as an ordinary webhook, or through
      the queue in an outage), and leaves the rest `unmatched` (audits `xero.remittanceReceived`,
      `xero.bankLineUnmatched`). The unmatched line is money sitting in Xero's bank reconciliation: it
      never reaches the engine, and it is **not** a Phase 36 `UnmatchedReceipt` (that is money the
      engine received and holds). Say so in one line of the Bank reconciliation tab's copy.
    - `matchBankLineInXero(api, officeActor, bankLineId, accRecId)`: the office handling the item in
      Xero. It refuses a different contact, a voided ACCREC or an amount above the balance; it marks the
      line `matchedByOffice` and delivers the payment through `deliverPaymentWebhook` (audit
      `xero.bankLineMatched`).
    - Vitest: the fixture resolves to the three seeded receivables; two receipts with the remittance
      keys, one unmatched line, Mitchell untouched; repeat refused; the office match then pays `oa04` by
      webhook exactly once; outage queues the syncs; the scope-fence test from work item 3 passes.
11. **Admin Billing monitor** (`BillingMonitorScreen.tsx`, proposed product UI, unbadged except the
    simulation button):
    - A **Xero connection** line at the top: "Connected" (success) or "Xero unavailable since HH:mm ·
      N waiting" (warning), read from the queue and the engine's view, not from the demo flag's label.
    - A **Xero sync queue** panel (`data-shot="billing-xero-queue"`): one row per open item (what: "Hand
      off AA-2026-0012", "Sync payment on AA-2026-0006", "Record disbursement on AA-2026-0005-P",
      "Reconciliation poll"; attempts; next try; last error; status pill Waiting, Retrying or Alert
      raised) with a teal **Retry now** (office action), and a collapsed "Sent after the outage" list.
      Empty state: "Nothing is waiting for Xero." One sentence of copy: "Every call to Xero is written
      here first and retried automatically with increasing gaps, so an outage never loses a financial
      event or blocks authorising." An alerted item raises a banner: "Xero has not answered for N
      attempts. In production this alerts AA's support team (simulated)."
    - A **Xero divergence** panel (`data-shot="billing-xero-divergence"`), shown when a flag exists:
      invoice, payer, what Xero shows ("Voided in Xero HH:mm" or "Amended in Xero HH:mm · total $Y"),
      what the engine holds ("Receivable open, $X"), detected at, and a teal **Resolve** opening a side sheet with the three outcomes, a required
      note and a "Provisional: the policy for each mismatch is to be agreed with AA" caption.
    - The **payables panel** keeps its due count and total and becomes "Run payables in Xero", with a
      `DemoBadge label="Simulated Xero"` beside the button (it now stands in for work done in Xero) and
      the copy: "The payables run is paid in Xero. The Billing Engine records each disbursement when
      Xero reports the bill paid, by webhook or at the daily poll." Its result line reports bills paid
      and disbursements recorded.
    - Remove "Resolve & retry" for handoff faults (it stays for Phase 36's billing exceptions);
      `CardStatusPill` shows "Waiting for Xero" instead of "Handoff failed".
12. **Admin invoice rail** (`InvoiceDocument.tsx`): the "Xero handoff" card shows Waiting for Xero with
    attempt count and next try while queued; "Voided in Xero · flagged" or "Amended in Xero ·
    flagged" (danger) with a link to the Billing monitor when a divergence is open; the Xero ids once paired. The money-state chips read the
    ledger, so "Disbursed" appears only after detection.
13. **Xero simulation** (`DemoXero.tsx`, `xeroPairView.ts`, `router.tsx`):
    - An outage banner on every tab while on: "Xero API unavailable to the Billing Engine (simulated).
      Payments and bill payments still land here; the engine's calls wait in its queue."
    - Pair detail: the ACCPAY card separates "Paid in Xero" (bill payment id, amount, time) from
      "Billing Engine: disbursement recorded HH:mm by webhook" or "not yet detected; the next poll picks
      it up". A voided ACCREC renders its Voided status and `voidedAtISO`; an amended one shows "Amended
      in Xero HH:mm" beside its new total. The in-page "Simulate payment and payout" keeps its label and
      one click, but its payout half now calls `payBillsInXero` with the webhook delivered, and its
      message names the two Xero events and the bill-paid webhook. Its payout-only state ("Pay
      <anaesthetist> now", on a paid but undisbursed pair) does the same. Hidden on a voided pair.
    - New **Bank reconciliation** tab at `/demo/xero/bank` (add the route; `TabLink` "Bank
      reconciliation (N unmatched)"), `data-shot="xero-bank-reconciliation"`: each remittance with its
      lines (quoted reference, amount, "Matched by the remittance add-on" or "Unmatched"), and an
      "Unmatched items · for office staff, handled in Xero" list where each line has a teal **Match in
      Xero** with a picker of that contact's open ACCRECs. A scope callout: "The Billing Engine does not
      match bulk remittances. Xero's bank reconciliation and remittance add-on do, keyed on the unique
      InvoiceNumber; the engine learns each matched payment through the normal payment webhook
      (US-10.2.4)." Update the Phase 10 duplicate-number callout to point here.
    - Every copy line free of en and em dashes.
14. **Register and re-point the demo triggers** in the Phase 14 registry (see Demo triggers), bodies in
    `src/store` or `src/shared`. Update `demoTriggers.test.ts` (Phase 14 pinned exactly four
    `/admin/billing` entries; this phase adds two there, and later phases may have added more, so
    update the pinned counts for the Billing monitor and the Xero sim routes to what is actually
    registered; route scoping of each new entry; disabled reasons; every new label and description free
    of en and em dashes) and keep `pwaPurity.test.ts` green.
15. **Tests, shots and capture.** Component tests: the queue panel (rows, Retry now, empty state,
    alert banner), the divergence panel and Resolve sheet, the Bank reconciliation tab. Update
    `DemoXero.test.tsx`, `xeroPairView.test.ts`, `xeroHandoff.test.ts` (no `handoffFailure`),
    `visual/admin-phase08.spec.ts` (the handoff fault now shows as Waiting for Xero and clears on the
    next tick) and `visual/xero-pair.spec.ts` (S3 still settles in one click; "Disbursed" appears after
    the webhook). New `visual/xero-resilience.spec.ts`: outage from the Billing monitor, authorise a
    List, the queue row, `+15 min`, restore, one Xero pair; void from a pair then the poll, the flag;
    amend another then the poll, the flag; the bulk remittance and the unmatched item; with `data-shot`
    hooks. Re-point `requirements-board/capture/recipes/US-09.2.4.json` to "Pay anaesthetist in Xero
    (payables run)" and the Billing monitor's "Run payables in Xero"; add the new hooks
    (`billing-xero-queue`, `billing-xero-divergence`, `xero-bank-reconciliation`, `demo-action-<id>` for
    the six new entries) to `requirements-board/capture/ATLAS.md` "Existing hooks", and in its "Demo
    control panel" section replace the handoff-failure and payables wording with the queue and the
    Xero-side payables run; run `npm run verify:board`. Grep `aa-prototype/src` and
    `aa-prototype/visual` for `handoffFailure`: zero hits.
16. **Docs inside the app:** `aa-prototype/README.md` store map gains `xeroQueue.ts`,
    `xeroSimActions.ts`, `disbursementDetection.ts`, `domain/xero/` and `domain/xeroSim/` (with the
    scope-fence rule).

## Demo triggers

All are registered through the Phase 14 registry with `surfaces: ['bar']`, a `run(api, ctx)` on the
entity in the URL, a disabled state with its reason, and a `DemoBadge`. None is added to the Control
Panel page, which lists them under their screens automatically.

| id | Label | Screen (routes) | Effect | Disabled when |
|---|---|---|---|---|
| `xero-outage-start` | Simulate Xero outage | Xero sim (`/demo/xero`, `/demo/xero/invoices`, `/demo/xero/invoices/:accRecId`, `/demo/xero/bank`) and Admin · Billing monitor (`/admin/billing`) | `setXeroOutage(on)`: Xero's API stops answering the engine; new handoffs, payment syncs, disbursement syncs and the poll queue with backoff | an outage is already on ("Xero is already unavailable") |
| `xero-outage-restore` | Restore Xero | same screens | `setXeroOutage(off)`: drains the queue in order; the message reports how many items were sent | no outage ("Xero is connected") |
| `xero-amend-invoice` | Edit this invoice's total in Xero | Xero sim pair (`/demo/xero/invoices/:accRecId`) | `amendAccRecInXero` on the pair in the URL: AA staff edit a line in Xero and the total drops by $20.00; the message says the engine keeps the issued amount and will not know until the next poll | voided; already amended; a payment applied; an AA fee pair |
| `xero-void-invoice` | Void this invoice in Xero | Xero sim pair (`/demo/xero/invoices/:accRecId`) | `voidAccRecInXero` on the pair in the URL, as AA staff would directly in Xero; the message says the engine will not know until the next poll ("Run reconciliation poll" or Next day) | already voided; a payment applied; an AA fee pair |
| `xero-pay-bill` | Pay anaesthetist in Xero (payables run) | Xero sim pair | `choices`: "Bill-paid webhook delivers" / "Webhook missed (the poll catches it)"; `payBillsInXero` for this pair's ACCPAY | no ACCPAY; nothing authorised and undisbursed ("Nothing authorised to pay yet"); held for bank details (Phase 26); voided pair; AA fee pair |
| `xero-bulk-remittance` | Simulate bulk hospital remittance | Xero sim Invoices list (`/demo/xero/invoices`) and Bank reconciliation (`/demo/xero/bank`) | `receiveBulkRemittance(ST_GEORGES_REMITTANCE)`: two St George's invoices paid by one deposit and learned by webhook; one line left unmatched in Bank reconciliation | already received; a fixture receivable already paid or voided |

**Re-pointed (Phase 14 entries):**
- `arm-handoff-fault` (Billing monitor): same label; the description becomes "The next Xero call
  fails once. The queue retries it automatically after a short backoff; advance the clock to see it
  land."
- `run-reconciliation-poll` (Billing monitor, Xero sim; add `/demo/xero/bank`): also detects bill
  payments, voids and amendments; during an outage it queues; its message reports the three counts.
- "Run payables" is **not** a registry entry (Phase 14's ruling, kept by Phase 36): it stays the
  Billing monitor's own product button, re-labelled and re-bodied in work item 11. Do not register it.
- `payment-full`, `payment-half`, `payment-replay`, `pwa-payment-full`, `pwa-payment-half`: call
  `deliverPaymentWebhook`, so during an outage the payment lands in Xero and the engine sync queues.
  Each gains the disabled reason "Voided in Xero" on a voided ACCREC (`receivePayment` refuses it too);
  on an amended ACCREC they keep paying what Xero shows.

**Product actions, not demo triggers:** "Retry now" (queue row), "Resolve" (divergence), "Match in
Xero" (inside the Xero simulator's own surface) and "Run payables in Xero" (badged Simulated Xero, like
"Simulate payment and payout" on the pair).

**PWA equivalent:** none needed. Every screen this phase touches (Billing monitor, invoice rail, Xero
simulator) is Admin or demo-only and does not exist in the PWA, and no mobile beat waits on a
disbursement (Mobile Balances shows outstanding receivables, not payouts). The PWA's Phase 14 payment
entries on Balances pick up the outage-aware body automatically; an outage cannot be switched on in the
PWA (it has its own storage and no harness bar), so they behave exactly as before. Phase 14's
"Office authorises this List" and "Play the office" hand off through `handoffListPairs`, so they reach
the gate and, with Xero always available in the PWA, create the Xero pair at once as today; nothing in
the PWA runs payables, so no PWA path depends on disbursement detection. `wireXeroQueue` is wired in
`pwa/main.tsx` for parity. Confirm the six new entries declare `surfaces: ['bar']`, that the PWA
sheet lists none of them, and that Phase 44's parity audit lists this phase as "no PWA stand-in
required".

## Out of scope

- Real Xero APIs, webhooks, signing keys or queues; real alerting (the alert is a banner and an audit
  row).
- A payment day or weekly cycle (OQ-47): the payables run stays on demand.
- A payment recorded against an invoice the engine has since credited (EP-09's ordering case), unless
  Phase 39 has already landed (work item 9): it needs Phase 39's credit notes; record it in the
  handoff for 39 or 44. Amendments beyond the one demo edit (a lowered total) are not modelled: no
  line-level diff, no raised total, no amended due date.
- Any automatic resolution of a divergence (re-issue, credit, write-off): the resolution is recorded,
  labelled provisional, and moves no money.
- Bulk matching in the engine, a bank-feed import, or a statement upload: the remittance is one seeded
  fixture on the Xero side.
- Voids or outages on AA fee invoices beyond routing their ACCREC creation through the queue.
- Buyer-created ACCPAY wording (Phase 22), the Ledger screen and its imbalance indicator (Phase 36;
  this phase must not break them), web Accounts rework (Phase 38).
- Re-capturing the catalogue screenshots for US-09.2.4 (`admin-payables-run-*.png` show the old
  engine-side run); list them in the handoff.

## Manual test checklist

- [ ] Reset. Admin Billing monitor shows "Connected", an empty Xero sync queue and no divergence panel;
      Demo actions lists Simulate Xero outage (enabled) and Restore Xero (disabled, "Xero is connected").
- [ ] Simulate Xero outage. Authorise a SUBMITTED List from the Review queue: it authorises and bills
      with no error; the queue shows one "Hand off" row per invoice, attempt 1, next try about 2 minutes
      on; the Xero sim Invoices tab has no new pair and shows the outage banner; the invoice rail says
      Waiting for Xero.
- [ ] Clock +15 min, twice: attempts rise and next try moves out by the backoff (2, 4, 8 ... minutes);
      `+7 days` adds one attempt, not a flood. After five failures the row shows Alert raised, the
      banner appears and the nav badge counts it.
- [ ] Restore Xero: every queued row becomes Sent in order; each invoice has exactly one pair in the
      Xero sim; the payer contact exists once; restoring again or Retry now changes nothing.
- [ ] During an outage, "Payment received · half" on an open invoice: the Xero pair shows the payment
      landed, the engine shows nothing received and a "Sync payment" row queues; Restore: one receipt,
      the ACCPAY authorised for exactly the amount received. Run reconciliation poll first instead:
      still exactly one receipt.
- [ ] Arm handoff failure, then authorise a List: the pair is not created, the queue shows one failed
      attempt; after the backoff (clock +15 min) the pair appears with no manual step. No "Resolve &
      retry" for handoffs remains.
- [ ] S3 path: authorise both Mon 20 Jul Lists, open AA-2026-0005, Simulate payment and payout: one
      click still settles it; the ACCPAY card shows the Xero bill payment and "disbursement recorded by
      webhook"; web Accounts Payments shows Paid to you.
- [ ] On another paid-in pair, "Pay anaesthetist in Xero" with "Webhook missed": Xero shows the bill
      paid, the Admin invoice chip still reads released and not disbursed, web shows Released to you;
      Run reconciliation poll: the disbursement is recorded once, dated at the bill payment.
- [ ] Billing monitor "Run payables in Xero" (badged Simulated Xero) pays every due bill and reports the
      disbursements recorded; its due total then reads zero.
- [ ] Open an unpaid pair and "Void this invoice in Xero": the Xero sim shows Voided; the Admin invoice
      and Billing monitor show nothing yet. Run reconciliation poll: the divergence panel flags it, the
      invoice rail shows "Voided in Xero · flagged", the payment pickers no longer offer it. Resolve with
      a note: the outcome is recorded in the audit and no amount changes. A pair with a payment cannot
      be voided (the reason shows).
- [ ] On another unpaid pair, "Edit this invoice's total in Xero": Xero shows the total $20.00 lower
      and "Amended in Xero"; the engine still holds the issued amount. Run reconciliation poll: the
      divergence panel shows "Amended in Xero · total $Y" against "Receivable open, $X". "Payment
      received · full" then pays Xero's total, and the ledger receivable stays $20.00 open. A second
      poll adds no second flag.
- [ ] Xero sim Invoices: "Simulate bulk hospital remittance": two St George's backdrop invoices become
      paid via webhook receipts; Bank reconciliation lists the remittance and one unmatched $980.00 line
      "for office staff, handled in Xero" with the scope callout; Mitchell's $610.00 is untouched. Match
      in Xero to the right invoice: it is paid through the webhook once. A second remittance is refused.
- [ ] Admin Audit shows the new rows with the right who, role and source (Xero simulated actions as
      demo, engine detection and queue work as system, office resolutions as office).
- [ ] The Admin Ledger screen (Phase 36) stays in balance through every path above; the PWA sheet lists
      none of the new triggers.
- [ ] No new app copy contains an en or em dash; teal is the only action colour; crimson unchanged.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots` green;
      `npm run verify:board` green after the recipe edit.

## Demo guide updates

Patch in the same session, in `docs/demo-guide/` and the matching sections of
`master-demo-guide.html` (read the text as Phases 16 and 36 left it; do not restore older figures):

- `03-demo-script.md`:
  - **S3 Beat 3:** the one-click path stays. Say: "One demo action stands in for three real events:
    nib pays into AA's Xero, the engine learns it by webhook and releases the payable, then Xero's
    payables run pays Dr Souter and a bill-paid webhook tells the engine, which records the
    disbursement." Expected: the ACCPAY card shows the Xero bill payment and the recorded disbursement.
  - **S4 Beat 5:** "Run payables" becomes "Run payables in Xero" on the Billing monitor; Expected: each
    run's disbursements are recorded as Xero reports the bills paid.
  - **New optional S4 asides** (Phase 44 folds them into the rewrite), each naming its screen and Demo
    actions entry: "Xero outage" (Billing monitor, Simulate Xero outage, authorise a List, clock +15
    min, Restore Xero; name the List the session used), "A void or edit made in Xero" (a pair, Void
    this invoice in Xero or Edit this invoice's total in Xero, Run reconciliation poll, Resolve), "Bulk
    hospital remittance" (Xero sim Invoices, Simulate bulk hospital remittance, Bank reconciliation,
    Match in Xero). Each with Say and Expected lines. The remittance aside says to run it after the S3
    and S4 money beats (or reset afterwards), because it pays two of Dr Souter's seeded backdrop
    invoices and lowers the outstanding figures those beats quote.
- `04-presenter-cheat-sheet.md`: the money-flow lines say the payables run happens in Xero and the
  engine detects each disbursement by webhook or poll; "Present but honestly demo-only" gains the
  outage, void, bill-payment and remittance triggers and "Run payables in Xero"; add a talking point
  "Bulk remittances are matched in Xero, not by the engine".
- `02-workflows-and-handoffs.md` Workflow 7: step 6 becomes "AA runs payables in Xero; a bill-paid
  webhook, or the daily poll, tells the Billing Engine, which records the disbursement"; add a short
  "Xero resilience" workflow (queue and backoff, restore, void flagged at the poll) and a bulk-remittance
  note.
- `master-demo-guide.html`: the same S3, S4, cheat-sheet and workflow passages.
- Control Panel scenario text: S3 and S4 messages if they mention the payout or "Run payables".

Not a milestone phase; no full consistency read is required, but re-read every passage touched against
the running app.

## Adversarial review (after build)

After the manual test checklist and `npm run build` / `npm run build:pwa` / `npx vitest run` /
`npm run shots` are green, and before writing the PROGRESS entry, run the standard adversarial
review-and-fix pass (PROGRESS convention 18): fan out independent Opus review subagents for
**quality**, **bugs/correctness** and **plan adherence**, plus a fourth on **money conservation and
idempotency** (this is a money phase). This session then verifies every finding against the catalogue
and the code, fixes the confirmed ones with a test where a bug had none, re-greens, and records the
pass. Do not re-raise anything settled in the Decisions log, except the rulings this phase explicitly
amends (listed below).

**Steer this phase's reviewers at:**
- No duplicates under any interleaving: outage on and off repeatedly, forced retries, a poll racing
  the queue, webhook replays and remittance repeats never produce a second pair, contact, receipt or
  disbursement record; every queue item and handler is keyed.
- Conservation on every pair, seeded and live, through outage, void and remittance paths: disbursed at
  most released, released at most received, received at most due; a voided receivable takes no
  payment; the Phase 36 ledger stays in balance.
- Detection, not performance: no engine code path writes the payable leg's disbursement except
  `recordDisbursement`; the Admin payables button pays in Xero and the engine only learns; "missed"
  really leaves the engine behind until the poll, with the payment's own date.
- The scope fence: nothing in the engine imports `domain/xeroSim`; the engine has no remittance
  matching; Mitchell's `oa07` is untouched.
- Demo-clock backoff: no timers, no `Date.now()`; one attempt per item per clock change; nothing
  mutates or audits when no item is due; a reset clears the outage and the queue.
- Authorising is never blocked by Xero: the billing run and every lifecycle guard behave the same with
  the outage on; queued handoffs show on the monitor and rail, not as billing failures.
- Divergence honesty: flagged only by the poll, once; engine-initiated voids or credits never flagged;
  the resolution is labelled provisional and moves no money.
- Triggers: the six entries show only on their screens, `surfaces: ['bar']`, working disabled states,
  bodies in `src/store` / `src/shared` (PWA purity); the re-pointed Phase 14 entries still pass their
  tests; every audit code has a label.
- Design and copy: teal-only actions, semantic tokens for queue and void states, mono times and ids,
  no en or em dashes, badges on every simulated control.

## PROGRESS.md updates

- A catch-up status row for Phase 37 and an entry `### Catch-up Phase 37 · Xero mirror resilience
  (date)`: the drift-check result, the Phase 36 names used, whether 39 had landed, the checklist item by
  item, test counts, and the review pass.
- **Decisions log:**
  - "The payables run happens in Xero; the engine detects each disbursement by bill-paid webhook or
    poll" (US-09.2.4). Amends the 2026-07-24 Phase 10 decision (5) (payables run as an unbadged office
    action): the Billing monitor keeps the panel as the office view, and its button is badged Simulated
    Xero. The 2026-07-29 "S3 invoice-local settlement" shortcut keeps its one click but now uses the
    Xero-side bill payment.
  - "Every engine-to-Xero call goes through a durable queue with exponential backoff on the demo clock"
    (demo values 2 to 60 minutes, alert after five attempts). Amends Phase 10 D-handoff: a handoff fault
    is a queued failed attempt retried automatically; `handoffFailure` and the handoff "Resolve & retry"
    are removed.
  - "A void or amendment made in Xero is flagged at the next poll; its resolution is recorded and
    provisional; the ledger keeps the issued amount" (EP-09, US-09.2.2 technical discussion). The demo
    amendment is one fixed $20.00 reduction.
  - "Bulk remittance is simulated on the Xero side only; the engine learns each matched payment by
    webhook", including why the fixture pays two seeded backdrop receivables (amends Phase 10 decision
    7's picker exclusion for this trigger only).
  - The payment asymmetry, stated once: during an outage a payment records only the Xero `PaymentIn`
    (the seeded missed-webhook shape, so `receivePayment` is not reworked), while a bill payment updates
    the Xero ACCPAY at once, because the demo needs Xero to show it paid before the engine knows.
- **Handoff notes:** the payment-against-credited-invoice divergence case for Phase 39 or 44 (unless
  39 had landed and it was built here), and richer amendments (line-level diffs, raised totals); the stale US-09.2.4 catalogue screenshots; Phase 44 parity audit: no PWA stand-in required for
  this phase.
