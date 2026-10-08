# Phase 39a · Payment runs: the weekly cycle, BCTI approval, netting and remittance

**Requirements covered:**
[US-10.2.7](../../../../requirements-board/requirements/stories/US-10.2.7.md) Weekly payment cycle (Proposed: built to, still to confirm with AA's accountant) ·
[US-10.2.6](../../../../requirements-board/requirements/stories/US-10.2.6.md) Approve the period's BCTIs for payment (Verify) ·
[US-10.2.5](../../../../requirements-board/requirements/stories/US-10.2.5.md) Negative invoices netted in the payment run (Confirmed) ·
[FT-10.2](../../../../requirements-board/requirements/stories/FT-10.2.md) Releasing payables (Confirmed; this phase closes its "next payables run": the weekly run replaces the ungated manual button) ·
[DM-25](../analysis/domain-model-delta.md#dm-25) Weekly payment cycle with period approval of BCTIs and a remittance advice that nets negative invoices.
Read alongside (not closed here):
[US-10.2.1](../../../../requirements-board/requirements/stories/US-10.2.1.md)
(a payable is released when its receivable is paid, for exactly the amount received, "so it enters
the next payables run (US-10.2.7)"; Phases 16 and 36 built the release, and this phase's cycle sits
after it),
[US-09.1.4](../../../../requirements-board/requirements/stories/US-09.1.4.md) (Proposed)
(the BCTI is the ACCPAY; the catalogue says one per procedure, the plan builds one per receivable
invoice, provisional, under the roadmap's "BCTI granularity" rule),
[US-08.6.2](../../../../requirements-board/requirements/stories/US-08.6.2.md) and
[US-08.6.5](../../../../requirements-board/requirements/stories/US-08.6.5.md)
(credit in full and rebill, and the credit note option, now also raised by the anaesthetist on their
own Procedure; Phase 39 raises the negative invoice this phase nets, whoever credited),
[US-10.3.1](../../../../requirements-board/requirements/stories/US-10.3.1.md)
(the AA fee counts BCTIs; nothing here changes that count),
[US-10.2.4](../../../../requirements-board/requirements/stories/US-10.2.4.md)
(bulk hospital remittance stays in Xero: a different "remittance", Phase 37's),
[OQ-47](../../../../requirements-board/requirements/questions/OQ-47.md) (**Proposed**, owner AA's
accountant: build to Greg's weekly ISO-week cycle; still for the accountant are who approves, whether
approval is the same step as US-10.2.1's release, and how the 20th-of-the-month payment fits),
[OQ-71](../../../../requirements-board/requirements/questions/OQ-71.md) (**answered**
2026-10-02, owner decision D21: a negative invoice with no later payment to net against is handled
outside the system; AA settles it with the anaesthetist, so nothing is built for it),
[OQ-42](../../../../requirements-board/requirements/questions/OQ-42.md) (answered:
the negative invoice is netted in the next payment run),
[OQ-60](../../../../requirements-board/requirements/questions/OQ-60.md) (still open on
the board; its 2026-10-02 meeting update gives Greg's view that the AA fee never nets against
payables, "under trust law it mustn't", which is what is built),
[OQ-29](../../../../requirements-board/requirements/questions/OQ-29.md) (open: GST agency
treatment and the BCTI's wording, which the roadmap ties to BCTI granularity), the meeting notes
`requirements-board/requirements/notes/2026-10-07-aa-client-meeting.md` #5 and #15 (Greg's cycle read
to the room: "52 payment cycles in a year, each identifiable by week number... Monday as a
maintenance day to make sure everything is right before payment on Tuesday"; build to it, keep it for
the accountant) and `requirements-board/requirements/notes/2026-10-02-aa-meeting-with-greg.md` #12
(OQ-71's answer), the diagrams
[AR-25](../../../../requirements-board/requirements/artifacts/AR-25.md) regions `payment-cycle`,
`payables-run` and `payable-release`,
[AR-24](../../../../requirements-board/requirements/artifacts/AR-24.md) region
`payables-approval-undecided` and
[AR-19](../../../../requirements-board/requirements/artifacts/AR-19.md) region `anaesthetist-paid`,
and the "Internal ledger" section and the "Negative invoice" and "Remittance advice" glossary entries
of [domain-model.md](../../../../requirements-board/requirements/domain-model.md).
**Depends on:** 37 (the payables run is paid in Xero and the engine records each disbursement when
Xero reports the bill paid, through `recordDisbursement`, the webhook, the poll and the outage queue)
and 39 (credit in full and rebill and the credit note option, which raise the **negative invoice**
to an anaesthetist already paid). By the roadmap order 14 (the registry, `useDemoTriggerContext`, the
office actors), 15a (the `appSettings` slice), 16 (the payable equals the receivable, the `-P`
number, `bctisFor` and the generalised history account builder), 22 (supplier and agent on
documents), 26 (the anaesthetist profile: bank details, display-only, with `destinationMasked`,
`missingBank` and the GST number; 26 holds no payout) and 36 (the ledger pair, its legs,
`ledgerPosition`, `anaesthetistPosition`, `LedgerDisbursement`, the Admin Ledger screen and the PWA
"Office runs payables" stand-in) have also run. 38 has run (web Accounts and the GST schedule read
the ledger; it reworded that PWA stand-in).
**Estimated:** 2 sessions. The weekly cycle (US-10.2.7: the ISO-week identity, the Friday close with
its snapshot and bank reconciliation, the Monday anomaly holds that roll forward, the Tuesday
schedule) joined the approval, netting and remittance work. **Session 1** is work items 1 to 9 (the
model, the pure cycle, run and ledger maths, close, holds, approval and the gate, the schedule and
paying it in Xero with netting, the one-click demo payouts through the cycle, the Billing monitor's
cycle panel and the staging trigger), ending at the green checkpoint in item 9. **Session 2** is work
items 10 to 15 (the cycle detail, the payment schedule and the remittance advice in Admin, the week
shown against every payment, web Remittances, the backdrop cycles in the seed, the bank-mismatch
trigger and the re-pointed triggers, then tests, shots, the catalogue screenshots, the demo guide and
PROGRESS).

## Goal

Today the payables run is an on-demand button that pays every released payable at once, records
nothing about the run beyond an id string on each disbursement, has no cycle and has no idea that an
anaesthetist can owe money back. The catalogue asks for four things (DM-25, FT-10.2):

- **A weekly payment cycle named by its ISO week** (US-10.2.7, Proposed; OQ-47 Proposed: built to
  as the proposed solution, still to confirm with AA's accountant). Each accounting week is a
  **payment cycle**, named by its ISO week number ("Week 30"), and the weekly run replaces the
  ungated manual "Run payables" as the way released payables are paid (FT-10.2). The office works
  it in four steps on the Admin Billing monitor:
  - **Friday: close the week.** The cycle snapshots every released, unpaid payable (BCTI) not held
    by an earlier cycle, records the ledger position at close, and reconciles the week's receipts
    against a simulated bank download. Anything released after the close waits for the next week.
  - **Monday: checks.** Each anomaly (a receipt missing from or different on the bank download, an
    anaesthetist with no bank account on file, or any line the office flags by hand) is either
    marked fixed or **held out of this run**. A held line rolls into the next cycle, tagged "Rolled
    from Week 30" (US-10.2.7's second criterion).
  - **Approve the week's BCTIs** (US-10.2.6): the run's lines are frozen.
  - **Tuesday: send the payment schedule** to the accountant: per anaesthetist, the BCTIs, the
    negatives netted, the net and the masked account. The accountant pays it in Xero (Phase 37's
    "Run payables in Xero", badged Simulated Xero), and the engine records each payment when Xero
    reports it.
  Every payment is then shown against the week of the cycle it was paid in (US-10.2.7's first
  criterion): on the Admin Ledger, the invoice's payable leg, the Xero sim pair, web Payments and the
  remittance advice. The cycle's days and its week identity are **settings**, never code, because
  the accountant may change them. The 20th-of-the-month payment is not part of this cycle (Greg,
  2026-10-01: it is the separate monthly non-trust cycle, Phase 16's AA fee invoices, with rent
  outside the system); nothing is built for it here.
- **The week's BCTIs are approved before they are paid** (US-10.2.6). Approval sits between the
  Monday checks and the Tuesday schedule, refuses while an anomaly is neither fixed nor held, and
  freezes the run. The schedule, Xero's payment and every other payout path pay only approved,
  unheld lines. Who approves, and whether this is the same step as US-10.2.1's release, is still
  part of OQ-47: the office approves (one office-only store action), logged on the owner's review
  list. The one-click demo paths that pay out today (the Xero sim's "Simulate payment and payout",
  39's "Stage refund after payout" and 36's PWA "Office runs payables") go through an approval too,
  so the gate has no back door.
- **Negative invoices are netted per anaesthetist** (US-10.2.5, Confirmed). Phase 39 raises a
  negative invoice to an anaesthetist when an invoice they were already paid for is credited (by the
  office, or by the anaesthetist on their own Procedure, US-08.6.5), and leaves its paid-out part
  (`recoveryDue`) open to net. At the close each anaesthetist's open negatives are netted against
  their positive, unheld payables, oldest first, so Dr Sharma's 19 positive BCTIs and one negative
  are paid as one net amount (the acceptance criterion). In Xero the negative (an ACCPAYCREDIT
  against the anaesthetist's contact) is allocated against the bills and the batch payment is the
  net total. The engine records each bill's cash payment and each allocation when Xero reports them,
  as Phase 37 does for disbursements.
- **A remittance advice per anaesthetist per run** (US-10.2.5: "the anaesthetist sees the run washed
  up in their remittance advice"; its second criterion: it "shows the negative invoice netted against
  the positive ones"). It names the week, lists every BCTI paid, every negative netted, the net paid
  and the bank account it went to, in Admin (from the run) and in web Accounts (the anaesthetist's
  own advices).
- **A negative with nothing to net against is handled outside the system** (OQ-71, answered). A run
  never pays below zero: when an anaesthetist's open negatives exceed their positives, the run nets
  what it can and the rest stays open, netted in a later cycle if one has positives. An anaesthetist
  with an open negative and no positives is simply not in the run. The open amount stays visible on
  the anaesthetist's ledger position (36's and 39's figures) with one caption saying AA settles it
  with the anaesthetist outside the system when no later payment comes. No carry-forward record, no
  recovery invoice, no age setting, no write-off. A cancelled prepayment is not this case (the money
  is still in trust and the anaesthetist has not been paid; Phase 41).

The state gains payment cycles (payables runs with an ISO week), a payment-cycle setting, a simulated
bank download, an offset amount on the payable leg, nettings on the negative invoice and Xero
allocation and batch payment records, and the seeded disbursements are grouped into backdrop weekly
cycles, so `PERSIST_VERSION` is bumped. No seeded money figure moves.

## Before you start: drift check

1. Run the drift check against the plan's catalogue snapshot, commit 60e2d1e (the tool diffs from
   the baseline in plan.json to the working tree, so it shows only what changed after 60e2d1e):

   ```
   node docs/prototype-build/catch-up/tools/plan-state.mjs --diff US-10.2.7,US-10.2.6,US-10.2.5,FT-10.2,US-10.2.1,US-09.1.4,US-08.6.2,US-08.6.4,US-08.6.5,US-10.3.1,US-10.2.4,OQ-47,OQ-71,OQ-42,OQ-60,OQ-29,OQ-77,FT-10.3
   ```

   (The tool is rename-aware; never use a plain git diff of the catalogue folder.) Read the hunks (if any) for US-10.2.7, US-10.2.6, US-10.2.5,
   FT-10.2, US-10.2.1, US-09.1.4, US-08.6.2, US-08.6.4, US-08.6.5, US-10.3.1, US-10.2.4, FT-10.3,
   OQ-47, OQ-71, OQ-42, OQ-60, OQ-29 and OQ-77, and the domain-model lines on the internal ledger, the negative invoice and the remittance
   advice. If an item changed, re-read it and adjust the work items. If US-10.2.5, US-10.2.6 or
   US-10.2.7 is now Retired or Future, drop its work items and record that in the PROGRESS entry. At
   60e2d1e US-10.2.7 is **Proposed** (Greg's weekly cycle, built to), US-10.2.6 is **Verify**
   (approver and its relation to the release open, OQ-47), US-10.2.5 and FT-10.2 are **Confirmed**.
2. **Questions** (each built as one setting or one store action, so a different answer stays
   contained):
   - **OQ-47 (payment day and cycle; who approves), Proposed: build to the weekly cycle.** The cycle
     is a setting, `appSettings.paymentCycle` (`weekIdentity: 'isoWeek'`, `closeWeekday: 5`
     Friday, `checkWeekday: 1` Monday, `scheduleWeekday: 2` Tuesday), never a constant in code, and
     no settings screen. The office approves (one store action, `officeOnly`). No app copy says
     "provisional" about the cycle; the open parts (approver, the 20th) go on the owner's review
     list. If the accountant has since **changed the days or the identity**, set the setting and keep
     the code. If OQ-47 now says **the system approves on its own**, make approval a system action on
     the same store action (actor system, run at the close) and keep the button as its manual form.
     If it says **US-10.2.6 is the same step as US-10.2.1's release**, stop and tell the owner (it
     would remove the gate this phase adds). If the **20th** has been folded into this cycle, stop
     and tell the owner (it would bring the AA fee into a trust run, against OQ-60 and FT-10.3).
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
     monitor this phase's panel sits beside, where the Xero sim records a **received payment** (the
     point the simulated bank download hooks into, work item 1), and confirm it shipped no bank hold
     (37's plan adds none and names this phase's `runExclusionFor` as the place for any exclusion;
     if a `heldForBank` refusal did ship, it becomes `runExclusionFor`'s first reason, work item 3);
   - from **39**: the **negative invoice to the anaesthetist** raised by every credit in full and by
     the credit note option (office or the anaesthetist's own, US-08.6.5). Planned shape (confirm
     against the code): `NegativeInvoice` in `billing.negativeInvoices`, `{ id (NEG, pad 4); number
     (the credit note number with 16's `-P` suffix, for example `CN-2026-0001-P`); anaesthetistId;
     creditNoteId; originalInvoiceId; pairId; cause: 'credit'; amount; offsetAmount; recoveryDue;
     status: 'offset' | 'toNet'; issuedAtISO; accPayCreditNoteId? }`, stored positive and shown
     negative, with `offsetAmount + recoveryDue === amount`. `offsetAmount` is what 39 set against the
     not-yet-paid-out payable; **`recoveryDue` (the part already paid out) is what this phase nets**,
     and an `'offset'` negative never enters a run. Its Xero mirror is a `XeroCreditNote` of type
     `ACCPAYCREDIT` in `xero.creditNotes` (with `allocated`), against the anaesthetist's contact,
     whose unallocated part this phase allocates against later bills. On the ledger, the credited
     pair carries `credit: { creditNoteId; negativeInvoiceId; atISO; heldForPayer; recoveryDue }` and
     `ledgerPosition` totals `creditsHeldForPayers` and `recoveryDueFromAnaesthetists` in
     `imbalance = receiptsHeld - payablesDue - creditsHeldForPayers + recoveryDueFromAnaesthetists`;
     `anaesthetistPosition` gains the anaesthetist's `recoveryDue`. The credit note's `cause` is
     `'correction' | 'split'` (41 adds its refund cause). Phase 39's handoff note says what it left
     for this phase. **If 39 recorded the amount only as a trail, with no record of its own**, add the
     record here with the fields above, created at the same point in 39's commit, and say so in the
     PROGRESS entry. Also note 39's `stage-refund-after-payout` trigger (Admin · Billing monitor and
     Admin · Invoice; it pays Sarah Mitchell's invoice in full and pays it out to Dr Sharma through
     `disbursePayable` or 37's `payBillsInXero`, once `stage-post-op` (14's, as 38b re-pointed it)
     has run; the user then credits it with 39's Credit and rebill), its result copy, and 39's pure
     `creditInFull`, `reversalPlan` and `applyCredit`, which the staging fixture below reuses;
   - from **16**: `bctiRecords` and `bctisFor`, the `-P` bill number, and the generalised history
     account builder behind "Seed a month of BCTIs", plus `appSettings.aaFee` (the pattern this
     phase's `appSettings.paymentCycle` follows);
   - from **15a**: the `appSettings` slice (`AppSettings` in `domain/warnings/types.ts`,
     `defaultAppSettings()`, the seed's `appSettings` and the persist merge's one second level for
     it in `store/appStore.ts`);
   - from **26**: where bank details live, `destinationMasked` and `missingBank` (no payout is held
     automatically by a missing account; this phase raises it as a Monday anomaly);
   - from **38**: `AccountsSubTab` (`'outstanding' | 'payments' | 'gst' | 'fees'`), how the GST
     schedule reads a payment to the anaesthetist, the Payments tab's rows, and the Outstanding
     list's selector;
   - from **14**: the registry file (`src/shared/demoTriggers/registry.ts`), `useDemoTriggerContext`,
     `OFFICE_ACTOR` and `OFFICE_SIMULATION_ACTOR` in `src/store/demoActors.ts`, the ruling that "Run
     payables" is a product button, not a registry entry, and `demoTriggers.test.ts`'s assertion
     that no trigger label matches `/payables/`, **as 36 and 37 left it**: 36 narrowed it to bar
     entries and added a companion assertion that the only "payables" label is its PWA-only stand-in;
     37 registered the bar entry "Pay anaesthetist in Xero (payables run)" (`xero-pay-bill`) and
     either renamed it or adjusted the rule (note which). The PWA stand-in's new label below avoids the
     word, so 36's companion assertion is updated to the label set as shipped (work item 15);
   - the demo clock: `src/domain/clock.ts` (`DEMO_TODAY` Tue 21 Jul 2026, ISO week 30) and the
     forward-only clock shortcuts (`src/shared/demoClockShortcuts.ts`, `store/clockActions.ts`). The
     cycle reads the clock; it never advances it.
4. Note the current `PERSIST_VERSION` (16 at 3d3a18c; later phases have raised it).

## Reference

**Design files (convention 17):**

- `docs/design/Design Language.dc.html`: tokens (teal `#0D6E63` the only action colour, crimson
  identity only, semantic success, warning and neutral tints, pills at radius 999, Spline Sans Mono
  with tabular-nums for every amount, number, week and date, the side-sheet and elevation patterns).
  A negative amount is neutral text with a leading hyphen-minus ("-$120.00"), never red, never an en
  dash or a U+2212 minus.
- `docs/design/Admin Review.dc.html` and `docs/design/Admin Day.dc.html`: the admin desktop anatomy
  (tile rows, tables, header rows, side panels, pills). No mockup covers the Billing monitor, a
  payment cycle, a payment schedule or a remittance advice: extend the Billing monitor's panels (as 37
  restyled them), `InvoiceDocument`'s print sheet (for the schedule and the remittance advice) and
  `tableChrome.ts` as they stand. The cycle's four steps read as a compact step rail (done, current,
  to come), in the existing pill and neutral tokens, not a new component language.
- `docs/design/Web Dashboard.dc.html`: the web panel and table anatomy for the new Accounts sub-tab.

**Catalogue items:** the covered and context files listed above, the 2026-10-01 meeting note
`requirements-board/requirements/notes/2026-10-01-aa-meeting-with-greg.md` points #18 (refund as a
credit note plus a negative invoice, netted, the remittance advice), #48 (trust payments weekly, the
20th a separate monthly cycle), #63 (the no-later-payment recovery question, now OQ-71) and #66 (BCTIs
approved for payment); the 2026-10-07 client meeting note #5 and #15 (Greg's cycle, the room's
"makes sense", build to it and keep it for the accountant); the 2026-10-02 note
`requirements-board/requirements/notes/2026-10-02-aa-meeting-with-greg.md` #12 (OQ-71: "an extreme
edge case... they just settle that up with the anaesthetist") and #1 (OQ-60: the fee never nets);
the 2026-09-29 client meeting note
`requirements-board/requirements/notes/2026-09-29-aa-client-meeting.md` #21 (today's run: Tuesday to
Tuesday, banked on Wednesday, the 20th handled by the accountant; US-10.2.7's note keeps it as
context only, nothing is built for it) and #22 (Greg's proposal first raised, the source US-10.2.7
cites); and the change log `requirements-board/requirements/changes/2026-10-07-requirements-update.md`
rows for US-10.2.1, US-10.2.6, US-10.2.7, US-08.6.4 and US-08.6.5 (a credit from a combined split or
from the anaesthetist's own credit note reverses the payable, OQ-77 part 2, so its paid-out part is a
negative this phase nets like any other). To read why an item says what it says, run
`npm --prefix requirements-board run source -- --item US-10.2.7 --text` (Node 22.18 or newer) and
read only the cited passages.

**Analysis files:**

- `docs/prototype-build/catch-up/GAP-ANALYSIS.md`: theme 7 (money model), the US-10.2.7 (Missing,
  L), US-10.2.6 (Partial), US-10.2.5 (Missing) and FT-10.2 (Partial) lines, the DM-25 row, the S4
  demo-impact line and the "Demo-trigger buttons" section. `gaps.json` has each item's
  `demo_trigger`; US-10.2.7's verify note flags the `demoTriggers.test.ts` "payables" assertion.
- `docs/prototype-build/catch-up/epics/EP-10.md`: the header note, then the US-10.2.7, US-10.2.6 and
  US-10.2.5 sections.
- `analysis/domain-model-delta.md` DM-25 (and DM-22 for the ledger it extends, DM-21 for the trust
  hold that Phase 41 adds as a run exclusion).
- `analysis/prototype-map-admin.md` section 7 (Billing monitor), `prototype-map-store-seed.md`
  sections 4 and 9 (billing slices, counters, the seeded history), `prototype-map-apps-mobile-web.md`
  (web Accounts) and `prototype-map-shell-demo-pwa.md` section 5.2 (the Xero sim pair detail).

**Code entry points** (line numbers are from 60e2d1e; phases 16 to
39 will have moved them, and 36 and 37 rewrote the payables code: use the names from the drift
check):

- Payables: `src/store/payablesActions.ts` (`payablesDue` 35, `disbursePayables` 55, `runPayables`
  146, `disbursePayable` 160; after 36 and 37 these read the ledger and pay in Xero), 37's
  `src/store/disbursementDetection.ts` and `src/store/xeroQueue.ts`, `src/store/reconciliationPoll.ts`,
  `src/store/paymentActions.ts` (`receivePayment`, where a received payment is recorded: the bank
  line hooks in beside the Xero-side payment).
- Ledger: 36's `src/domain/billing/ledger.ts` and `ledger.test.ts`, and 36's `src/store/ledgerSelectors.ts`;
  39's `src/domain/billing/creditNote.ts`.
- Clock: `src/domain/clock.ts` (`DEMO_TODAY` 32, date-fns helpers over given dates), `src/store/clockActions.ts`.
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
  `data-shot="billing-payables-run"` about 121 to 143, `doRunPayables` 51), 36's
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

### Session 1: the cycle, approval, netting and paying a week

1. **Model** (`domain/types.ts`, and `domain/warnings/types.ts` for the setting). DM-25, US-10.2.7.
   - `PaymentCycleSettings`: `{ weekIdentity: 'isoWeek'; closeWeekday: Weekday; checkWeekday:
     Weekday; scheduleWeekday: Weekday }` (ISO weekday numbers, Monday 1), stored as
     `appSettings.paymentCycle` beside 16's `appSettings.aaFee`, defaulted in `defaultAppSettings()`
     to `{ 'isoWeek', 5, 1, 2 }`, merged by the persist merge's existing second level. A doc comment
     says: Greg's proposed cycle (US-10.2.7, Proposed), built to; the accountant may change it
     (OQ-47); change it here, never in code. No settings screen.
   - `PayablesRun`, in a new `billing.payablesRuns` record. One run per payment cycle (the week's
     run), plus one-pair **staged** runs from the demo stand-ins (work item 7): `{ id; kind: 'week' |
     'staged'; cycleId ('2026-W30'); isoYear; isoWeek; weekStartISO; weekEndISO; status: 'closed' |
     'approved' | 'scheduled' | 'paying' | 'paid' | 'superseded'; closedAtISO; closedBy: { who; role
     }; snapshot: CycleSnapshot; anomalies: CycleAnomaly[]; lines: PayablesRunLine[]; nettings:
     PayablesRunNetting[]; byAnaesthetist: RunAnaesthetistTotal[]; excluded: { pairId;
     anaesthetistId; reason: RunExclusionReason; amount }[]; approvedAtISO?; approvedBy?;
     scheduledAtISO?; scheduledBy?; sentToXeroAtISO?; paidAtISO?; supersededBy?; seeded?: true }`.
     At most one unsuperseded `'week'` run per `cycleId`.
     - `PayablesRunLine`: `{ pairId; anaesthetistId; billNumber (the `-P` number);
       receivableInvoiceNumber; serviceDateISO; payerName; releasedAtISO; amount; heldOut?: {
       anomalyId?; reason; atISO; by }; rolledFromRunId? }`, where `amount` is what the close took for
       that leg (released less disbursed less offset less any amount in an unsettled run). A held
       line stays on the run for the record but is not approved, scheduled or paid; it rolls into the
       next close, which sets `rolledFromRunId`.
     - `CycleSnapshot`: the ledger at close, `{ atISO; receiptsHeld; payablesDue; recoveryDue;
       imbalance; byAnaesthetist: { anaesthetistId; payablesDue; recoveryDue }[] }`, from 36's
       `ledgerPosition` (never typed-in figures).
     - `CycleAnomaly`: `{ id (`<runId>-A<n>`); kind: 'receiptNotOnBank' | 'bankAmountDiffers' |
       'noBankAccount' | 'flaggedByOffice'; pairIds; anaesthetistId; detail; status: 'open' | 'fixed'
       | 'heldOut'; resolvedAtISO?; resolvedBy? }`.
     - `PayablesRunNetting`: `{ negativeInvoiceId; anaesthetistId; amount; allocations: { pairId;
       amount }[] }`: how much of each negative this run nets, and against which bills (oldest
       first).
     - `RunAnaesthetistTotal`: `{ anaesthetistId; positives; netted; net; remainingToNet;
       destinationMasked? }`, all cents exact, over unheld lines. `net >= 0` always;
       `remainingToNet` is what the run could not net because the negatives exceed the positives (it
       stays open on the negative invoice for a later cycle).
     The lines, nettings and totals are recomputed (purely) on each Monday hold or fix and frozen at
     approval; afterwards only the status, the dates and the derived detection state move.
   - **The simulated bank download**: `BankLine { id (BNK, pad 4); dateISO; amount; reference (the
     receivable invoice number); xeroPaymentId; removedByDemo?: true }` in `billing.bankLines`,
     written by the Xero sim in the same `mutate()` that records a received payment (source demo: it
     stands in for AA's daily bank download), and by the seed for every seeded receipt. The engine
     only reads it at the close.
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
     negative, whatever its credit note's `cause` and whoever raised it. No carry-forward status,
     recovery link or age is added (OQ-71).
   - Xero side: `XeroCreditAllocation { id; accPayCreditId (39's `XeroCreditNote` of type
     `ACCPAYCREDIT`, the negative's `accPayCreditNoteId`); accPayId; amount; atISO; idempotencyKey
     ('CNALLOC-<id>'); payablesRunId }` in `xero.creditAllocations` (each one raises that credit
     note's `allocated`), and `XeroBatchPayment { id; contactId; payablesRunId; cycleId; total; atISO;
     billPaymentIds }` in `xero.batchPayments`. The Xero bill payment (37's `Disbursement`) gains
     `batchPaymentId?`; its existing `payablesRunId` now always names a real run.
   - `ID_FORMATS`: `bankLine` (`BNK`, pad 4), `creditAllocation` (`XCA`, pad 4), `batchPayment`
     (`XBP`, pad 4). Thread the new maps and the setting through `AppState`, the empty billing and
     xero slices, `freshAppState`, `resetDomainState` and `SeedBillingSlice`.
2. **Pure cycle maths** in a new `src/domain/billing/paymentCycle.ts`, re-exported from the billing
   index, Vitest-covered (convention 9). The only place a week, a cycle's days or an anomaly is
   computed.
   - `isoWeekOf(dateISO)`: `{ isoYear; isoWeek }` (date-fns ISO-week helpers over the given date, as
     `clock.ts` uses date-fns; never the wall clock). `cycleFor(dateISO, settings)`: `{ cycleId
     ('2026-W30'); isoYear; isoWeek; weekStartISO (Monday); weekEndISO (Sunday); closeDateISO (that
     week's close weekday); checkDateISO and scheduleDateISO (the next check and schedule weekdays
     after the close) }`. `nextCycleId(cycleId)`. `cycleLabel(cycle)`: "Week 30" and
     `cycleRangeLabel`: "20 Jul to 26 Jul 2026" (the word "to", no dash). Weekday names in copy come
     from the setting through one `weekdayName` helper, never typed into a component.
   - `reconcileWeek({ receipts, bankLines })`: matches each ledger receipt recorded since the last
     close (the receipts that released this cycle's lines) to a bank line by reference and amount;
     returns `receiptNotOnBank` and `bankAmountDiffers` findings with the pairs they released.
   - `weekAnomalies({ lines, reconciliation, missingBank })`: the cycle's anomalies, one per finding,
     plus `noBankAccount` for each anaesthetist in the run whom 26 flags (a flag for the Monday
     check, not an automatic exclusion). Deterministic ids and order.
   - Tests: ISO weeks at year ends (2026 has 53 weeks: 2026-12-31 and 2027-01-01 are both
     2026-W53; 2026-01-01 is 2026-W01; DEMO_TODAY is 2026-W30); the cycle's close, check and schedule
     dates for Week 30 (Fri 24 Jul, Mon 27 Jul, Tue 28 Jul) and for a changed setting; a matched week
     raises nothing; a missing bank line and a different amount each raise one anomaly naming its
     pairs; a missing bank account raises one per anaesthetist; determinism.
3. **Pure run maths** in a new `src/domain/billing/payablesRun.ts`, re-exported from the billing
   index, Vitest-covered. The only place a run draft, a hold or netting is computed.
   - `runExclusionFor(input)`: why a leg or an anaesthetist is kept out of a run, as a
     `RunExclusionReason`. Today it excludes nothing: 26's bank details are display-only (a missing
     account is a Monday anomaly the office decides, never an exclusion). If 37 shipped a
     `heldForBank` refusal, that refusal becomes this function's first reason instead, so the run
     and Xero agree. It is the **one standing exclusion point**: Phase 41 adds `'heldInTrust'` here
     for a held prepayment payable, and any later standing hold is added here, not elsewhere; a
     comment says so. (A Monday hold is a per-cycle decision on the run's line, not an exclusion.)
   - `buildWeekRun({ legs, negatives, unsettledRuns, heldEarlier, exclusions, cycle })`: per
     anaesthetist, the lines (each leg's `releasedAmount - disbursedAmount - offsetAmount` less
     anything in an unsettled run, positive only, sorted by service date then bill number, with
     `rolledFromRunId` where an earlier cycle held it), then `netNegatives` over the unheld lines,
     then the totals. Only anaesthetists with at least one line appear: an anaesthetist with open
     negatives and no positives is not in the run, and their negative waits on their ledger position
     (OQ-71). The legs are the ones 36's `payablesDue.byAnaesthetist` already sums (36's handoff: the
     cycle sits in front of that figure, with no second source); the negatives are 39's open
     `'toNet'` negative invoices, not negative legs.
   - `applyHolds(run, holds)`: marks the held lines and recomputes nettings and totals over what is
     left (a negative whose positives are all held stays open for the next cycle).
   - `netNegatives(lines, negatives)`: open negatives oldest first (by `issuedAtISO`, then id), each
     netted against the remaining positives, allocating to bills oldest first; returns `{ nettings;
     netted; net; remainingToNet }`. Never nets below zero: `net = max(0, positives - open)`,
     `remainingToNet = max(0, open - positives)`.
   - `paymentSchedule(run)`: the Tuesday schedule's rows (per anaesthetist: BCTI count, positives,
     netted, net, masked account) and its total, from the frozen run. `remittanceAdvice(run,
     anaesthetistId, detection)`: the advice's rows and totals (the week, BCTIs paid, negatives
     netted, net, any amount still to net, destination), with each line's detection state
     (`awaitingXero` or `paid` with its date) passed in. Both pure; the store only supplies detection.
   - Tests (worked figures in cents): **US-10.2.5's first acceptance criterion**, 19 positives and
     one negative give a net equal to the positives less the negative, and (its second) the advice
     lists all twenty with the negative netted; a negative larger than the positives nets to $0.00
     with the rest left as `remainingToNet`; two negatives, oldest first; a negative exactly equal to
     the positives; an anaesthetist with an open negative and no positives is not in the run; odd
     cents across allocations; **US-10.2.7's second criterion**, a held line is out of this run's
     totals and schedule and is in the next cycle's run with `rolledFromRunId`; holding every
     positive leaves the negative open; an exclusion returned by `runExclusionFor` (stubbed) keeps
     the leg out and is reported with its amount; an anaesthetist with no bank account is in the run
     with a `null` destination; a leg in an unsettled run is not taken twice; a part-released leg
     (16's half payment) takes exactly its released remainder; determinism.
4. **Pure ledger additions** in 36's `domain/billing/ledger.ts` (extend `ledger.test.ts`):
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
5. **Store: close the week, the Monday checks and approval** (a new
   `src/store/paymentCycleActions.ts`, exported from `store/index.ts`). US-10.2.7, US-10.2.6. Every
   action office only (`officeOnly`), one `mutate()` each, audited on the run.
   - Selector `openCycle(state)`: the earliest ISO week, from the demo clock's week onward, with no
     unsuperseded week run (so after Week 30 is closed the open cycle is Week 31), and
     `openCycleDraft(state)`: `buildWeekRun` for it, fed from the ledger alone (never `state.xero`),
     with `runExclusionFor` as the only standing exclusion. **The demo clock does not gate the
     steps** (it is fixed on a Tuesday and forward-only): each step can be taken in order on any day,
     the panel shows each step's planned date from the setting, and the run stamps the demo clock's
     actual time ("Closed Tue 21 Jul, planned Fri 24 Jul"). A built default, logged for the owner.
   - `closeWeek(api, actor)`: refuses `nothingToClose` ("Nothing is waiting for this week's run.")
     when the draft has no lines. Allocates the run id from the existing `payablesRun` counter, writes
     the draft, the ledger snapshot and the anomalies from `reconcileWeek` and `weekAnomalies`, status
     `closed`. Audit `payments.weekClosed` (week, line count, positives, netted, net, anomalies,
     snapshot). A payable released after this point is in the next cycle.
   - `holdOutOfRun(api, actor, runId, { anomalyId? | pairId, reason })` and `markAnomalyFixed(api,
     actor, runId, anomalyId)`: only while `closed`. A hold marks the line (or the anomaly's lines)
     `heldOut`, re-applies `applyHolds`, sets the anomaly `heldOut`; the reason is required when the
     office holds a line with no anomaly (`flaggedByOffice`). Audit `payments.lineHeldOut` and
     `payments.anomalyFixed`. "Return to run" undoes a hold while `closed` (audit
     `payments.holdReleased`).
   - `approveWeekBctis(api, actor, runId)`: only while `closed`. Refuses `anomaliesOpen` ("Hold out
     or mark fixed every anomaly first.") while an anomaly is `open`, and `nothingToApprove` when every
     line is held. Freezes the run, status `approved`. Audit `payables.runApproved` (week, line count,
     held count, positives, netted, net, remaining to net, per-anaesthetist totals, exclusions).
   - `sendPaymentSchedule(api, actor, runId)`: only while `approved`; status `scheduled`, the schedule
     recorded as sent to the accountant (no email: it is a document on the run detail). Audit
     `payments.scheduleSent`.
   - **The gate.** Every path that pays a payable pays only an unheld line of an approved run that
     has been scheduled: `runPayables`, `disbursePayable` (the Xero pair's single payout), and 37's
     Xero-side `payBillsInXero`. A released payable that is not on such a line is refused with
     `notApproved` ("This payable is not in an approved payment run yet."). This is US-10.2.6's
     acceptance criterion and the place reviewers will hunt.
   - **Stale run.** Between the close and payment a line can go stale: its pair credited by Phase 39
     (39 cuts a credited pair's release back to what was paid out), a new open negative raised for an
     anaesthetist in the run (it would be missed), a line's payee changed (Phase 41's repoint of a
     moved prepaid Booking's payable, D38), or a new exclusion from `runExclusionFor`. Approve, send
     and `runPayables` re-check the run against the ledger first; if anything changed they refuse
     `runStale` ("Something changed since this week was closed. Re-close the week.") and the panel
     offers **Re-close**, which marks the run `superseded` (with `supersededBy`) and closes a fresh
     one for the same week in one `mutate()`, carrying over the holds and fixed anomalies that still
     apply (audit `payments.runSuperseded` then `payments.weekClosed`). A run is never edited in
     place.
   - Tests (`paymentCycleActions.test.ts`): every step needs the office; the steps refuse out of
     order; a run freezes its lines at approval; a payable released after the close is in the next
     cycle's draft; approval refuses with an open anomaly; a held line rolls into the next close with
     `rolledFromRunId`; the gate refuses every payout path for a line that is unapproved, held or not
     scheduled; re-close supersedes and keeps the holds; crediting a line's invoice after the close
     makes the run stale; closing with nothing waiting refuses; an anaesthetist with only an open
     negative leaves nothing to close.
6. **Store: pay a scheduled run in Xero, with netting** (`payablesActions.ts` and 37's
   `xeroSimActions.ts`). US-10.2.5, FT-10.2.
   - `runPayables(api, office)` (the Billing monitor's "Run payables in Xero": the accountant paying
     the schedule, badged Simulated Xero) takes the oldest scheduled run and calls
     `payRunInXero(api, actor, runId, { webhook })`, which replaces 37's `payBillsInXero` for a run
     (keep `payBillsInXero` as its internal helper). Xero side only, in one `mutate()` (source demo,
     since it stands in for the accountant's work in Xero): per anaesthetist, for each netting
     allocation an `XeroCreditAllocation` of the ACCPAYCREDIT against the bill; for each bill's cash
     remainder a bill payment (37's `Disbursement`, `BILLPAY-` key); one `XeroBatchPayment` per
     anaesthetist for the net, carrying the `cycleId`. Held lines are untouched. The ACCPAYCREDIT's
     remaining credit and the bills' statuses move as Xero would. An anaesthetist whose net is zero
     (negatives at least equal to positives) gets allocations and no batch payment. Run status
     `paying`, `sentToXeroAtISO`. Audit `xero.creditAllocated`, `xero.disbursed` (37's code) and
     `xero.batchPaid`.
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
   - `disbursePayable(api, actor, pairId)` pays one scheduled line through the same path (netting
     applies only in a whole run: a single payout with an open netting allocation on that bill
     refuses `useRun`, "This bill has a negative netted against it. Pay it with its run.").
   - **Run completion** is derived: `payablesRunState(state, runId)` gives each line's detection
     (`awaitingXero` or `paid`) from the ledger, and the run becomes `paid` (with `paidAtISO`, audit
     `payables.runPaid`, source system) inside the detection `mutate()` that settles its last unheld
     line. `paymentWeekFor(state, runId)` gives the week label every payment shows (work item 11).
   - Tests: 19 positives and one negative paid in one run settle every leg (cash plus offset equals
     each amount), cash out equals the net, the negative's open amount is zero and its status
     `'netted'`, and the ledger is in balance; a negative larger than the positives settles the
     positives entirely by offset with no cash and no batch payment and leaves the rest open
     (`'toNet'`), netted by the next cycle that has positives; a held line is not paid and is in the
     next cycle; a replayed webhook, a second poll and a restored outage each record once; `missed`
     leaves the run `paying` until the poll; the stale refusal; a single payout refused on a netted
     bill; conservation on every pair (disbursed plus offset at most released).
7. **The one-click demo payouts go through a run** (no back door). A store helper
   `approveAndPayPairForDemo(api, actor, pairId)` writes a one-line `kind: 'staged'` run for that pair
   only, in the demo clock's week (closed, approved and scheduled in one `mutate()`, audit
   `payables.runApproved` with `staged`, actor `OFFICE_SIMULATION_ACTOR`), and pays it with the
   webhook delivered. A staged run is not the week's cycle and does not close the week; the week's
   run never takes a pair a staged run paid. It refuses `useRun` when the pair is a line in an
   unsettled run and `nothingToApprove` when nothing is released and unpaid. Re-point to it: the Xero
   sim pair's in-page **Simulate payment and payout** and its payout-only "Pay <anaesthetist> now"
   (37's one click, S3 Beat 3; its message gains "the office approved it for payment in Week 30"),
   and the payout half of 39's **Stage refund after payout** (which called `disbursePayable`, or 37's
   `payBillsInXero` with the webhook delivered, and would now be refused `notApproved`). The PWA
   stand-in **Office runs payables** (36's, reworded by 38) becomes **"Office runs this week's
   payment cycle"** (no "payables" in the label; update 36's companion assertion that named it as the
   only "payables" label, per the drift check): one body that
   calls `closeWeek`, `approveWeekBctis`, `sendPaymentSchedule` and `runPayables` as
   `OFFICE_SIMULATION_ACTOR` (webhook delivered), disabled "Nothing due to pay out" as before and
   "An anomaly needs the office" when the close raises one (it never holds or fixes an anomaly on
   the office's behalf). A staged run shows under the week's runs with a "Staged" tag. Tests:
   `approveAndPayPairForDemo` pays only its pair and refuses a pair already in an unsettled run;
   Simulate payment and payout, Stage refund after payout and the PWA stand-in still pay out (S3 Beat
   3 and 39's staging unchanged in effect).
8. **Formatting.** `formatSignedCurrency(n)` in `src/shared/format.ts`: "-$120.00" with a
   hyphen-minus for negatives, "$120.00" otherwise (Vitest, including -0.005 rounding and zero).
   Every negative amount in this phase renders through it.
9. **Billing monitor: the payment cycle panel** (`BillingMonitorScreen.tsx`, replacing the payables
   panel beside 37's restyled processing monitor; keep `data-shot="billing-payables-run"` on the
   "Run payables in Xero" button's container). `data-shot="payment-cycle"` on the panel.
   - Header "Payment cycle · Week 30 · 20 Jul to 26 Jul 2026" (mono week and dates) and a step rail:
     **Close the week** (planned Friday 24 Jul), **Monday checks** (planned Monday 27 Jul), **Approve
     BCTIs**, **Send payment schedule** (planned Tuesday 28 Jul), each done (with its actual stamp),
     current or to come. The weekday names come from the setting. No "provisional" chip.
   - **Waiting for this week's run** (`data-shot="payables-run-draft"`), before the close: a table
     from `openCycleDraft`, one row per anaesthetist (`drSurname`), BCTIs (count), Positives,
     Negatives netted, Net, Still to net (shown only where a negative exceeds the positives), a "No
     bank account" warning pill where 26 flags a missing account, a "Rolled from Week 29" tag on
     rolled lines; expandable to the lines. Empty state: "Nothing is waiting for this week's run."
     Primary teal **Close the week**, disabled with its refusal sentence.
   - **Monday checks** (`data-shot="payment-cycle-anomalies"`), once closed: each anomaly (kind,
     detail, the BCTIs it touches, the anaesthetist) with **Hold out of this run** and **Mark fixed**;
     any line can also be held from the expanded table with a reason. Held lines move to "Rolls into
     Week 31" below the table. Then primary teal **Approve week 30's BCTIs**, disabled "Hold out or
     mark fixed every anomaly first." while one is open. Caption: "A released payable is paid only in
     an approved weekly run."
   - Once approved, **Send payment schedule** (teal); once scheduled, "Run payables in Xero" (37's
     button and `DemoBadge`, Simulated Xero: the accountant paying the schedule), disabled "Nothing
     scheduled to pay" otherwise; on `runStale` each step shows the sentence and a **Re-close**
     button.
   - **Runs** (`data-shot="payables-runs"`): this week's run and any staged runs, then the previous
     weeks' runs (week, run id, closed, approved and scheduled by and when, net total, status pill:
     Closed neutral, Approved neutral, Scheduled warning, Paying warning, Paid success, Superseded
     neutral, plus a neutral "Seeded" or "Staged" tag), each linking to its detail.
   - The result line reports, for example, "Week 30 paid in Xero: 19 BCTIs, 1 negative invoice
     netted, $X paid to 1 anaesthetist." (the figures from the running app).
   - Register the `stage-payment-week` trigger (work item 14) now: the checkpoint uses it.
   - **Session 1 checkpoint.** With items 1 to 9 in place, `npm run build`, `npm run build:pwa` and
     `npx vitest run` are green and the close, hold, approve, schedule, pay and netting items of the
     manual checklist pass. Patch S4 Beat 5 for the cycle's steps before stopping, so the guide never
     names a button that no longer exists. Session 2 starts at item 10.

### Session 2: the record, the week on every payment, remittances and the seed

10. **Admin: the run detail, the payment schedule and the remittance advice.**
    - Route `/admin/billing/payment-runs/:runId` (`AdminPaymentRunRoute`, a `RequireEntity` 404
      guard; the side nav keeps Billing monitor active): the run header (Week 30 and its dates, kind,
      closed, approved, scheduled, sent to Xero and paid, each with who and when; status pill; a
      "Superseded by PR0004" link where relevant), the **ledger at close** (the snapshot), the
      anomalies with how each was resolved, the held lines with "Rolled into Week 31" and a link to
      that run, the per-anaesthetist totals table, the exclusions, and each anaesthetist's
      **Remittance advice** link. `data-shot="payables-run-detail"`.
    - The **payment schedule** (US-10.2.7's Tuesday schedule to the accountant): a section of the
      run detail, printable through `InvoiceDocument`'s print sheet, from the pure
      `paymentSchedule`: heading "PAYMENT SCHEDULE · Week 30", per anaesthetist the BCTI count,
      positives, negatives netted, net and masked account, the total, and "Sent to the accountant
      Tue 21 Jul". `data-shot="payment-schedule"`.
    - Route `/admin/billing/payment-runs/:runId/remittance/:anaesthetistId`
      (`AdminRemittanceRoute`): the remittance advice document, reusing `InvoiceDocument`'s print
      sheet. Heading **REMITTANCE ADVICE**; from Anaesthesia Associates as agent (22's supplier and
      agent block); to the anaesthetist (name, HPI CPN, GST number from 26's profile); the week
      ("Payment run Week 30, 2026"), run id and dates; paid on (the batch payment date, or "Awaiting
      confirmation from Xero"); paid to (26's masked account, or "No bank account on file"). Lines:
      BCTI number, invoice number, service date, payer, amount (mono); then each negative netted,
      "Negative invoice CN-2026-0001-P · credit of AA-2026-0007" (the numbers 39 shipped), as a
      signed amount. Totals: "BCTIs paid $P", "Negatives netted -$N", "Paid to you $P - N" (computed,
      shown as one figure), and, only when non-zero, "Still to net in a later payment run $X". Held
      lines are not on the advice. No NHI, no patient detail beyond the payer name the BCTI already
      carries. Rail: Print, the run link, and the Xero card ("Batch payment XBP0002 · $X", "Credit
      allocated $N"). `data-shot="remittance-advice"`. A remittance has a derived reference
      `RA-<cycleId>-<registration number>`, shown on the document.
    - The Admin Ledger's per-anaesthetist view (36) gains a **Payment runs** card (each run by week,
      with net, netted, status and its advice link) and shows 39's **Negative invoices to net** (the
      open `recoveryDue`, net of nettings) with one caption: "Netted in their next payment run. If no
      later payment comes, AA settles it with the anaesthetist outside the system." The whole-ledger
      view keeps 39's total under the same caption. This caption is all OQ-71 needs.
11. **The week against every payment** (US-10.2.7's first criterion). One selector,
    `paymentWeekFor`, gives "Week 30" for any disbursement, offset or batch payment from its run.
    Show it on the Admin Ledger's disbursement rows, the Admin invoice's payable leg ("Paid out in
    Week 30"), the Xero sim pair detail (an ACCPAY reads "Paid in batch XBP0002 · Week 30" with any
    credit allocated against it; the ACCPAYCREDIT lists its allocations and remaining credit), web
    Accounts Payments (a Week column, the net cash per run) and the remittance advice.
    `data-shot="payment-week"` on the invoice's payable leg.
12. **Web Accounts: Remittances** (US-10.2.5, the anaesthetist's side).
    - `AccountsSubTab` gains `'remittances'` (`/web/accounts/remittances`), a sub-tab button
      "Remittances" after "Payments". A table of the persona's advices, newest first: week, paid on,
      BCTIs, netted (signed), paid to you, status pill (Paid, Awaiting Xero); a row opens the advice
      in a side sheet (`useSurface`), the same content as the Admin document, read only.
      `?run=PR0003` focuses a row, as 16's `?invoice=` does.
    - When the persona has an open negative, a panel above the table (`data-shot="web-still-to-net"`):
      "You have -$X still to net. It is netted against your next payment run."
    - When a line of theirs is held out of a run, a quiet row note on Payments: "Held out of Week 30,
      paid in a later run." (no anomaly detail; the anomaly is the office's).
    - 38's GST schedule (cash basis): confirm that a bill settled partly by offset counts at its full
      amount on its settlement date and the netted negative shows as a negative row on the same date,
      so the period's figures equal the net cash plus nothing else. Fix only the selector if it reads
      cash disbursements alone; label the treatment provisional on the owner's review list (AA's
      accountant, OQ-29).
    - Mobile Balances is not changed. The catalogue does not name the app that shows the advice
      (US-10.2.5: "the anaesthetist sees the run washed up in their remittance advice"; the gap
      analysis lists mobile too); the plan puts it in web Accounts, where the anaesthetist's accounts
      live, and Admin. Log this as a built default on the "For the owner's review" list.
    - `data-shot` hooks: `web-remittances`, `web-remittance-sheet`, `web-still-to-net`.
13. **Backdrop cycles in the seed.** The seeded disbursements (Dr Souter's history, `'PR-HIST-01'`,
    and the seeded prepayment payout, `'PR-SEED-01'`, plus any other seeded payout the earlier
    phases added) are grouped into backdrop `'week'` runs, **one per ISO week** of the disbursement
    dates (`cycleFor` over the seed's setting), in the `H` id namespace (`PRH01`, `PRH02` ...),
    status `paid`, `seeded: true`, closed, approved and scheduled by "Office (seeded)" at 08:00 on the
    week's first disbursement date (each step before payment), with their lines and totals built by
    `buildWeekRun` from the seeded legs (never typed-in figures), no anomalies and no negatives. Every
    seeded receipt gets its `BankLine`. 16's generalised history account builder writes a backdrop
    run and bank lines the same way for every payout it builds, so "Seed a month of BCTIs" and this
    phase's fixture leave no payment without a run or a week. Each seeded `LedgerDisbursement` and
    Xero `Disbursement` takes its run's id, and each seeded anaesthetist gets a backdrop
    `XeroBatchPayment` per run. Dr Souter's web Remittances tab is populated on load. No seeded money
    figure moves: assert Dr Souter's ledger position, the whole-ledger position, the GST schedule and
    S3's figures are identical before and after. At 60e2d1e the two seeded payouts nearest today
    (Dr Souter's pa01 on 15 Jul and the seeded prepayment payout on 16 Jul; Phase 41 later removes the
    second by holding it in trust) fall in **Week 29**, so the Billing monitor opens on Week 30 with
    no run yet and Week 29 Paid and "Seeded" at the top of the previous runs.
14. **Triggers, persistence and copy.**
    - Register the triggers in the table below through the Phase 14 registry and re-point the
      existing ones; bodies in `src/store` or `src/shared`; nothing added to the Control Panel page.
    - `stage-payment-week` builds its 19 accounts for Dr Sharma with **16's generalised history
      account builder** in its own deterministic id namespace (`PP`), raised and handed off but
      unpaid (ledger pairs and Xero pairs created as the builder does). Their service dates follow
      16's rule: weekdays **before the canvas horizon start** (`horizonFor(DEMO_TODAY).startISO`), AM
      and PM Lists of five Bookings, so no added List collides with a generated canvas List. It then
      records each payment at the demo clock's now through the ordinary `receivePayment` webhook path
      with keys `STAGE-PP-n` (so each gets its bank line, and release follows US-10.2.1 exactly), all
      inside the open cycle. One audit entry for the staging, then the ordinary payment entries. Its
      `choices`: "19 BCTIs" and "19 BCTIs and a credit after payout"; the second also builds, with the
      **credit-after-payout fixture builder** below, one earlier Dr Sharma invoice paid, paid out
      through its own backdrop run in Week 29 and credited in full, so one negative invoice with its
      whole amount to net is open for Dr Sharma. The 19 add to Dr Sharma's July BCTI count (16's fee
      preview shows it; that is correct).
    - `stage-bank-mismatch` marks the bank line of one receipt in the open cycle `removedByDemo`
      (the newest receipt that released a line, Dr Sharma's when staged), so the close raises a
      "Receipt not on the bank download" anomaly on its BCTI. Session 2 builds it; the session 1
      checkpoint tests the anomaly path with a held line by hand.
    - The **credit-after-payout fixture builder** (`domain/seed/`, pure): builds a backdrop, like the
      seeded history (not replayed actions), of one invoice raised, paid and paid out through its own
      backdrop run, then credited in full with 39's pure `creditInFull`, `reversalPlan` and
      `applyCredit` (credit note cause `'correction'`, the payer's credit held, no rebill: the payer
      had paid twice), giving 39's `NegativeInvoice` with `recoveryDue` equal to its `amount`, its
      ACCPAYCREDIT and the pair's `credit.recoveryDue`. Never a second credit path: if the builder
      cannot reuse 39's pure functions, stop and tell the owner.
    - Bump `PERSIST_VERSION` by one (the new slices, the setting, the bank lines, the leg field and
      the backdrop runs; record from and to). Extend `persistMigrate.test.ts` (a stale payload is
      discarded to the fresh seed) and `seedBilling.test.ts` (two builds deep-equal, backdrop runs
      reproduce the seeded disbursements exactly, every seeded receipt has its bank line,
      `resetDomainState` restores them).
    - Every new audit action gets a label in `ACTION_LABELS` (`src/shared/audit/actionLabels.ts`):
      `payments.weekClosed`, `payments.lineHeldOut`, `payments.holdReleased`, `payments.anomalyFixed`,
      `payables.runApproved`, `payments.scheduleSent`, `payments.runSuperseded`, `payables.runPaid`,
      `ledger.offsetRecorded`, `xero.creditAllocated`, `xero.batchPaid`.
    - Copy sweep: no en or em dash in any new string; weekday names only through `weekdayName` from
      the setting; no "the 20th", "fortnightly" or "provisional" about the cycle in app copy; every
      negative through `formatSignedCurrency`; no "carried forward", "recovery" or "write-off"
      wording (OQ-71); "Rolled from" and "Rolls into" are the only roll-forward words.
15. **Tests, shots and docs close-out.** `demoTriggers.test.ts` covers the new and re-pointed entries
    (routes, surfaces, disabled states, the pinned per-screen counts, the PWA stand-in's new label
    and body, the bar-entry "payables" rule passing as 36 and 37 left it, and 36's companion assertion
    updated now that the PWA stand-in no longer carries the word) and
    `pwaPurity.test.ts` stays green; `demoScenarios.test.ts` drives the rewritten S4 Beat 5 and its
    netting aside at store level. `AccountsScreen.test.tsx` covers the Remittances tab (rows, week,
    signed amounts, focus, the still-to-net panel) and the Payments tab's week column. Playwright: a
    new `visual/admin-phase39a.spec.ts` (the cycle panel open, closed with an anomaly, a held line,
    approved and paid; a run detail with its schedule; a remittance advice with a netted negative;
    the anaesthetist ledger caption; the invoice's "Paid out in Week 30") and a web shot of the
    Remittances tab and sheet; update any spec that shot the old payables panel. The capture
    recipes, ATLAS.md and `npm run verify:board` are the Catalogue screenshots step below. Then the
    demo guide (below) and PROGRESS.

## Demo triggers

The headline actions are **product UI**, not demo triggers, all on the Admin Billing monitor's
payment cycle panel: **Close the week**, **Hold out of this run**, **Mark fixed**, **Return to run**,
**Approve week N's BCTIs**, **Send payment schedule**, **Re-close** and **Run payables in Xero**
(37's button, badged Simulated Xero: the accountant paying the schedule). They act on the demo
clock's time; the clock does not gate them. The Xero sim pair's in-page **Simulate payment and
payout** stays an in-page simulator button (37's), re-pointed through `approveAndPayPairForDemo`.
What the registry gains or changes:

| Label | Screen | Surface | Effect |
|---|---|---|---|
| Stage a payment week (new, `stage-payment-week`) | Admin · Billing monitor (`/admin/billing`) | bar | `choices` "19 BCTIs" / "19 BCTIs and a credit after payout". 19 receivable invoices for Dr Sharma, each paid through the ordinary webhook (with its bank line), so 19 BCTIs are released into the open week's run; the second choice also leaves one open negative invoice for Dr Sharma (the credit-after-payout fixture). Result: "19 payables released for Dr Sharma into Week 30. Close the week to start the run." (plus "A negative invoice of -$X is waiting to be netted." for the second choice). Disabled "Already staged for this week" |
| Stage a bank mismatch (new, `stage-bank-mismatch`) | Admin · Billing monitor (`/admin/billing`) | bar | Removes one receipt from the simulated bank download (the newest that released a line in the open week). Result: "The bank download is missing the receipt for AA-2026-00xx. Close the week to see the anomaly." Disabled "Nothing received this week" or "This week is already closed" |
| Stage refund after payout (Phase 39's, re-pointed) | as Phase 39 registered it | bar | Its payout half now goes through `approveAndPayPairForDemo` (a one-line staged run in the demo clock's week) instead of `disbursePayable`, which the gate refuses. Its result gains "Once credited, the negative invoice is netted in Dr Sharma's next payment run." The live path for the netting aside: this trigger, then 39's Credit and rebill on the invoice, then the next week's run once Dr Sharma has a released payable |
| Pay anaesthetist in Xero (payables run) (Phase 37's `xero-pay-bill`, re-pointed) | Xero sim pair (`/demo/xero/invoices/:accRecId`) | bar | Pays the pair's bill only when it is an unheld line of a scheduled run with no netting on it. Disabled "Not in an approved payment run yet" or "Pay this bill with its run" |
| Office runs payables (Phase 36's PWA stand-in, reworded by 38, re-pointed) | Mobile · Balances (`/mobile/balances`) | PWA only, badged office stand-in | Becomes "Office runs this week's payment cycle": `closeWeek`, `approveWeekBctis`, `sendPaymentSchedule` then `runPayables` as `OFFICE_SIMULATION_ACTOR`, webhook delivered. Message names the week and the amount paid out to Dr Souter. Disabled "Nothing due to pay out" as before, and "An anomaly needs the office" when the close raises one |

No "Stage departed anaesthetist" trigger: the no-later-payment case is handled outside the system
(OQ-71), so there is no beat to stage.

PWA parity: the cycle, the schedule and the remittance advice are Admin and web, and the mobile
Balances screen gains nothing, so no new PWA entry is registered. The one existing PWA path that pays
out, 36's stand-in, is re-pointed above so the PWA build still pays out through a weekly run. Confirm
no new entry shows in the PWA sheet, the re-pointed stand-in works in `npm run build:pwa`, and
`pwaPurity.test.ts` stays green; Phase 44's audit records "no new mobile beat; the PWA payout
stand-in runs the office's weekly cycle".

## Out of scope

- **A negative with no later payment to net against** (OQ-71, answered): AA settles it with the
  anaesthetist outside the system. No carry-forward record, recovery invoice, age or recovery
  setting, write-off record, collections or "departed anaesthetist" staging. The open amount stays
  on the ledger position with its caption and nets in any later cycle that has positives.
- **The 20th-of-the-month payment** (OQ-47's open fit): Greg's separate monthly non-trust cycle is
  Phase 16's AA fee invoice run; rent is outside the system. Nothing is built for it here.
- **Timers and clock gating**: no scheduled close, approval or schedule; the office presses each
  step. The demo clock does not gate the steps, and the cycle never advances the clock.
- **A real bank feed, a bank file (ABA) export, emailing the schedule to the accountant or the
  remittance advice to the anaesthetist**, and mobile remittance views. The bank download is a
  simulated record; the schedule is a document on the run.
- **Approving part of a week** (per anaesthetist or per BCTI) other than by holding lines out (the
  demo stand-ins' one-line staged run is the only exception), a second-person check on approval, and
  editing a run once approved (it is superseded, never edited).
- **Netting the AA fee** against payables (OQ-60; Greg: never, under trust law; the fee stays a
  separate receivable).
- **Refunds as a live action** (cancellation refunds, the trust account and its hold): Phase 41. A
  cancelled prepayment is not a negative to net (the money is still in trust). This phase nets any
  open negative whatever its credit note's cause and leaves `runExclusionFor` as the one standing
  exclusion point for 41's hold.
- A real Xero batch payments API: the Xero side stays the simulation.
- Changing what a BCTI is or how many there are (OQ-29), or the AA fee count (16).

## Manual test checklist

The agent runs every item itself in the running app and reports it with evidence; none is handed
to the owner (ROADMAP.md "Owner review: agents test themselves").

Take run ids, weeks and figures from the running app; the ids below are examples. Start each group
after **Reset → Confirm reset**.

The weekly cycle and the gate:

- [ ] Admin · Billing monitor shows **Payment cycle · Week 30 · 20 Jul to 26 Jul 2026** with the step
      rail (planned Friday 24 Jul, Monday 27 Jul, Tuesday 28 Jul), no provisional chip, an empty
      "Waiting for this week's run" ("Nothing is waiting for this week's run."), Close disabled with
      that sentence, and Week 29 at the top of the previous runs, Paid and tagged Seeded.
- [ ] S4 Beat 5 path: Admin · Invoice for Hemi Walker's clean St George's sibling, **Payment
      received · half**: the waiting table shows one Dr Ropata BCTI at exactly half; on the Xero sim
      pair "Pay anaesthetist in Xero" is disabled "Not in an approved payment run yet".
- [ ] **Close the week**: the run is Closed with the actual stamp and "planned Fri 24 Jul", the
      ledger at close is recorded, there is no anomaly; **Approve week 30's BCTIs**, **Send payment
      schedule**, then **Run payables in Xero**: the run goes to Paid (webhook delivered), the ledger
      shows half disbursed, the invoice's payable leg reads "Paid out in Week 30", and the Xero sim
      shows the bill payment in a batch payment for Week 30.
- [ ] **Payment received · full** on the same invoice: the remaining half is waiting in **Week 31**,
      not in Week 30's run. Close, approve, send and run Week 31: the leg is paid out in full, never
      more, and the second payment reads Week 31.
- [ ] Anomaly and roll-forward (US-10.2.7's second criterion): Stage a payment week (19 BCTIs), then
      **Stage a bank mismatch**, then Close: one "Receipt not on the bank download" anomaly on one
      Dr Sharma BCTI; Approve is disabled "Hold out or mark fixed every anomaly first."; **Hold out of
      this run**: the line moves to "Rolls into Week 31", the totals drop by its amount; approve, send
      and run: 18 BCTIs paid. The next close (Week 31) holds the line tagged "Rolled from Week 30".
- [ ] Stale run: Stage a payment week (19 BCTIs) and Close, then credit one of the 19 invoices with
      39's Credit and rebill before approving: Approve refuses "Something changed since this week was
      closed. Re-close the week."; Re-close supersedes the run and the new one holds 18 BCTIs.
- [ ] S3 path: on AA-2026-0005's Xero sim pair, **Simulate payment and payout** still pays out in
      one click; a Staged run for that one bill shows under this week's runs as Paid, and the message
      names the approval and Week 30.
- [ ] Simulate Xero outage (37), then Run payables in Xero on a scheduled run: the run is Paying with
      lines Awaiting Xero; Restore Xero drains the queue and the run becomes Paid with no duplicate
      disbursement or offset.
- [ ] PWA build, Mobile · Balances: Payment received · half, then **Office runs this week's payment
      cycle**: Paid out rises by exactly what was released.

Netting and the remittance advice:

- [ ] **Stage a payment week → 19 BCTIs and a credit after payout**: the waiting table shows Dr
      Sharma with 19 BCTIs, one negative netted and the net. Close, approve, send, run: the result
      line names Week 30, 19 BCTIs and 1 negative invoice netted; Dr Sharma's ledger position shows
      no negative to net; the whole ledger is in balance; the Xero sim shows the ACCPAYCREDIT
      allocated and one batch payment for the net.
- [ ] Admin · run detail shows the ledger at close, the payment schedule (Dr Sharma's net and masked
      account, "Sent to the accountant") and her totals; her **Remittance advice** names Week 30,
      lists 19 BCTIs, "Negative invoice CN-2026-...-P · credit of AA-2026-..." as a signed amount,
      and "Paid to you" equal to the net; the paid-to account is masked; no "Still to net" line.
      Switch to Dr Sharma on the web: the same advice under Remittances.
- [ ] Web · Accounts (Dr Souter) has a **Remittances** sub-tab listing her backdrop weekly runs; each
      opens its advice; Payments shows a Week column; her Outstanding, Payments and GST schedule
      figures are unchanged from before this phase.
- [ ] Nothing to net against (OQ-71): Phase 39's **Stage refund after payout** (after Stage post-op
      scenario, 14's trigger as 38b re-pointed it) pays out through a Staged run; credit the invoice
      with 39's Credit and rebill. With no released payable for Dr Sharma, the waiting table does not
      list her; her Admin Ledger position shows the negative invoice to net with the "settles it with
      the anaesthetist outside the system" caption; her web Remittances shows the still-to-net panel.
      Then **Payment received · full** on one of her other invoices (or the 19-BCTI staging): the
      next close nets the negative against it.
- [ ] Admin · Audit shows each new action with the right who, role and source (office for the close,
      holds, approval and schedule, the office stand-in for staged runs, system for detection, demo
      for the Xero-side batch payment and the bank line).
- [ ] No en or em dash in any new string; weekday names only from the setting; no "20th",
      "provisional", "carried forward" or "recovery" wording; negatives read "-$X.XX"; teal is the
      only action colour; crimson unused on the new screens.
- [ ] Catalogue screenshots: the recipes for US-10.2.5, US-10.2.6 and US-10.2.7 are created, any
      recipe this phase broke is re-pointed, a full `npm run capture` ends with no failed recipe and
      no story without a recipe, the covered items' new shots are checked by eye, and `npm run
      verify:board` is green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots` green; `npm run
      verify:board` green.

## Demo guide updates

This is a **milestone phase** (the "After 39a" money story): end with a consistency read of
`master-demo-guide.html` against the run sheet. Take every figure, week, number and label from a
reset run of the built app.

- **`03-demo-script.md`:**
  - **S4 Beat 5** ("Beat 5: partial payment", today "Run payables" twice) becomes "Beat 5: partial
    payment and the weekly payment run": Payment received half, then on the Billing monitor **Close
    the week**, **Approve week 30's BCTIs**, **Send payment schedule** and **Run payables in Xero**;
    open the remittance advice. Then Payment received full: the balance waits for Week 31 (optionally
    run Week 31 the same way). Say: "A payable is released when its receivable is paid, exactly the
    amount received. Payments to anaesthetists run weekly, each run named by its ISO week: the week
    closes on Friday and is reconciled to the bank, Monday is for sorting out anything odd, the
    office approves the week's BCTIs, and on Tuesday the schedule goes to the accountant. A problem
    that can't be fixed in time is held out and rolls into next week. Every payment shows the week
    it was paid in, and every run leaves a remittance advice." Expected: Week 30 paid with half the
    leg, the balance in Week 31, never paid twice, an advice per run. Drop "pro-rata" and "only the
    increment each run" (16 already re-greened the amount; this beat now narrates the cycle).
  - Optional aside, **an anomaly held out**: Stage a payment week, Stage a bank mismatch, Close,
    Hold out of this run, then show "Rolls into Week 31".
  - Optional aside, **netting**: Stage a payment week → "19 BCTIs and a credit after payout", run the
    week, open Dr Sharma's remittance advice. Say: "A refund or a credit after the anaesthetist was
    paid is a credit note to the payer and a negative invoice to the anaesthetist, netted in their
    next weekly run: nineteen positives and one negative, one net payment." Note the live path for a
    longer session (39's Stage refund after payout, then Credit and rebill, then the next week's run
    once she has a released payable). If asked what happens with no later payment: "That is rare. AA
    settles it with the anaesthetist outside the system; the balance stays visible on their ledger
    position."
  - **S3 Beat 3** ("payment, balances and disbursement", 37's one-click "Simulate payment and
    payout"): the click is unchanged, but it now approves a one-bill staged run in Week 30 before
    Xero pays it. The Say line gains "the office approves it for payment"; Expected gains the Staged
    run under the Billing monitor's runs and "Paid out in Week 30" on the invoice.
  - The **Direct URLs** table gains "A payment run · `/admin/billing/payment-runs/<runId>`", "A
    remittance advice · `/admin/billing/payment-runs/<runId>/remittance/<registration>`" and "Web
    remittances · `/web/accounts/remittances`".
  - The S4 discovery points gain OQ-47, one line: the weekly cycle is Greg's proposal, built to and
    being confirmed with AA's accountant, with who approves and how the 20th-of-the-month payment
    fits still open. OQ-71 is answered and is not a discovery point.
- **`02-workflows-and-handoffs.md`:** Workflow 7 ("collect money and disburse it to the anaesthetist",
  step 6 "AA runs payables and disburses the authorised amount" and the "partial payment followed by
  two payables runs" demo point) gains the weekly cycle (close, Monday checks with holds, approval,
  the Tuesday schedule, the accountant paying in Xero), the run record, the week on every payment and
  the remittance advice; the correction after payout case (39's) gains "netted in the next weekly
  run; with no later payment, settled with the anaesthetist outside the system".
- **`04-presenter-cheat-sheet.md`:** "Built and clickable" (the Phase 10 payables bullet) gains the
  weekly cycle, BCTI approval, netting and remittance advice; "The money model" gains "weekly run by
  ISO week: close, check, approve, schedule; negatives net; remittance per run"; "Strong phrases"
  gains "Nothing is paid until the week's BCTIs are approved" and "Every payment carries its week
  number"; "Statements to avoid" gains "the accountant has signed off the weekly cycle" (OQ-47 is
  Proposed, still with the accountant), "the 20th is part of this run" (it is the separate monthly
  fee cycle) and "the system chases a departed anaesthetist" (OQ-71: outside the system).
- **`01-personas-and-responsibilities.md`:** Kirsty's billing persona (Core actions; the "payable
  becomes available for a payables run" line) gains closing the week, the Monday checks, approving
  the week's BCTIs and sending the schedule to the accountant; the integration operator's "payables
  run" line names the weekly run; the anaesthetist reads their remittance advice, by week, in web
  Accounts.
- **`README.md`:** the readiness row for payables (the weekly cycle and remittance).
- **`master-demo-guide.html`:** the same sections (S4 Beat 5 and its two asides, S3 Beat 3, the
  cheat-sheet equivalents, the workflows and personas), then the milestone consistency read.
- **Control Panel scenario text:** the S3 and S4 messages, where they mention "Run payables" or the
  payout, gain the weekly run's steps. The PWA stand-in's new label, "Office runs this week's payment
  cycle", goes wherever the guide names it.

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19),
run after the review pass and before the PROGRESS.md entry. Re-run
`node docs/prototype-build/catch-up/tools/recipe-status.mjs 39a` first: earlier phases may have
changed these recipes since this plan was written. FT-10.2 has stories, so it has no recipe of its
own: its children's shots cover it.

**Covered items.** When the phase is done, each recipe in `requirements-board/capture/recipes/`
matches what was built:

| Item | Recipe at plan time | When this phase is done |
|---|---|---|
| [US-10.2.5](../../../../requirements-board/requirements/stories/US-10.2.5.md) Negative invoices netted in the payment run | absent ("Not built yet: catch-up Phase 39a builds this"), no shots | captured. Replace the stub. Stage it with the `stage-payment-week` bar action, choice "19 BCTIs and a credit after payout", on `/admin/billing`, then close, approve, send and run the week. Admin shot `remittance-advice` at `/admin/billing/payment-runs/<runId>/remittance/<anaesthetistId>`, highlight `[data-shot=remittance-advice]` (the week, the 19 BCTIs, the negative invoice netted as "-$X.XX", the net paid). Admin shot `payables-run-detail`, highlight `[data-shot=payables-run-detail]`. Web shots at `/web/accounts/remittances`: `web-remittances` (the table with week and signed netted amounts) and `web-remittance-sheet` (open a row, highlight `[data-shot=web-remittance-sheet]`). No shot of the no-later-payment case (outside the system, OQ-71). Mobile Balances is unchanged (a built default, logged for the owner) and has no shot. Captions in the catalogue's words: "The payment to the anaesthetist is the net total", "The remittance advice shows the negative invoice netted against the positive ones" |
| [US-10.2.6](../../../../requirements-board/requirements/stories/US-10.2.6.md) Approve the period's BCTIs for payment | absent ("Not built yet: catch-up Phase 39a builds this"), no shots | captured. Replace the stub. Admin `/admin/billing` after `stage-payment-week` ("19 BCTIs") and Close the week: shot `approve-week` with a `closed` state highlighting `[data-shot=payment-cycle]` (the run Closed, "Approve week 30's BCTIs" enabled, "Run payables in Xero" disabled "Nothing scheduled to pay"), an `approved` state after clicking "Approve week 30's BCTIs" highlighting `[data-shot=payables-runs]` with the run's Approved pill, and a `paid` state after Send payment schedule and Run payables in Xero. Caption: "BCTIs not yet approved are not in the payment run" |
| [US-10.2.7](../../../../requirements-board/requirements/stories/US-10.2.7.md) Weekly payment cycle | none (new item at 60e2d1e; no recipe file yet) | captured. Create the recipe. Admin `/admin/billing`: shot `payment-cycle` with an `open` state (Week 30, the step rail with the planned Friday, Monday and Tuesday dates, highlight `[data-shot=payment-cycle]`), then after `stage-payment-week` ("19 BCTIs"), `stage-bank-mismatch` and Close the week an `anomaly` state highlighting `[data-shot=payment-cycle-anomalies]` (the "Receipt not on the bank download" anomaly), and a `held` state after "Hold out of this run" (the line under "Rolls into Week 31"). Admin shot `payment-schedule` on the run detail after approve and send, highlight `[data-shot=payment-schedule]`. Admin shot `payment-week` on the invoice whose payable was paid (S4 Beat 5's invoice after the week is run), highlight `[data-shot=payment-week]` ("Paid out in Week 30"). Captions in the catalogue's words: "Each accounting week is named by its ISO week number", "A payment is shown against the week number of the cycle it was paid in", "An anomaly that cannot be fixed is held out and rolled into the next cycle" |
| [US-10.2.3](../../../../requirements-board/requirements/stories/US-10.2.3.md) Reconcile back to the ledger | captured · `receipt-in-ledger` (web), `engine-link` (simulator) | no change here (Matches; FT-10.2 joins this phase only for the weekly cycle). Check in the `--dry` run that a receipt still shows against its payable once the weekly run reads the ledger |
| [US-10.2.4](../../../../requirements-board/requirements/stories/US-10.2.4.md) Bulk remittance stays in Xero | absent ("Bulk remittance and bank reconciliation stay in Xero by design ...") | Phase 37 owns it. No change here; the weekly cycle's bank-reconciliation step is shown under US-10.2.7, not here |

**Recipes this phase breaks.** Work item 9 replaces the Billing monitor's payables panel with the
payment cycle panel (close, check, approve, schedule, then run). Found at plan time, all keyed on
`[data-shot=billing-payables-run]` (kept on the "Run payables in Xero" button's container) and the
button name `Run payables`:
- `US-10.2.1` shot `payables-run` (`/admin/billing`, highlight `[data-shot=billing-payables-run]`)
  and its `paid` state in the simulator; the stale caption "Authorised payables waiting for the
  payables run" becomes "Released payables wait for this week's payment run" with the highlight on
  `[data-shot=payables-run-draft]` (shot before the close).
- `US-09.2.4` (`payables-run`, two states with a click on `[data-shot=billing-payables-run] >>
  role=button[name="Run payables"]`), `US-10.1.2` (click `role=button[name="Run payables"]`) and
  `US-08.3.4` (click `Run payables`, highlight `[data-shot=billing-payables-run]`): the button is now
  "Run payables in Xero" and is disabled until the week is closed, approved and scheduled. Insert
  clicks on "Close the week", "Approve week 30's BCTIs" and "Send payment schedule" before each run
  click; keep the shot names.
- Recipes using the PWA or Xero-sim "Simulate payment and payout" are unaffected in effect (the
  one-pair staged run approves first); the `--dry` run is the check.
- Re-grep before capture: `grep -n 'Run payables\|billing-payables-run' requirements-board/capture/recipes/*.json`.

**ATLAS.md.** Routes: `/admin/billing/payment-runs/:runId`, `.../remittance/:anaesthetistId` and
`/web/accounts/remittances`. Existing hooks: `payment-cycle`, `payment-cycle-anomalies`,
`payables-run-draft`, `payables-runs`, `payables-run-detail`, `payment-schedule`, `payment-week`,
`remittance-advice`, `web-remittances`, `web-remittance-sheet`, `web-still-to-net`. Demo control
panel: the `stage-payment-week` action and its two choices, `stage-bank-mismatch`, and the reworded
"Office runs this week's payment cycle" PWA stand-in. Seed data: the backdrop weekly runs the seeded
disbursements are grouped into (Week 29 nearest today) and the bank lines.

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

- **The approval gate.** No path pays a payable that is not an unheld line of an approved, scheduled
  run: `runPayables`, `disbursePayable`, the Xero-side bill payment, the re-pointed Xero pair
  trigger, the Xero sim's Simulate payment and payout, 39's Stage refund after payout, the PWA
  stand-in, a replayed webhook, the poll and the outage queue. A staged run covers exactly its one
  pair and never doubles with the week's run. A run's lines never change after approval; a stale run
  is superseded, never edited.
- **The cycle.** One unsuperseded week run per ISO week; a payable released after the close is in the
  next week, never the closed one; a held line is never paid in its week and appears exactly once in
  the next close, tagged rolled; approval refuses with an open anomaly; every payment resolves to
  exactly one week; ISO-week maths is right at year ends (2026-W53).
- **Money conservation, in cents.** For every run: cash out per anaesthetist equals unheld positives
  less netted, never below zero; each leg's disbursed plus offset never exceeds released; each
  negative's nettings never exceed its `recoveryDue`, and its `offsetAmount` never enters a run; the
  whole ledger and every anaesthetist's position stay in balance after the close, approval, sending
  and detection. Hunt for an offset counted as cash (receipts held would drift), a negative netted
  twice, or a negative netted against a held line.
- **Idempotency.** `CNALLOC-` and `BILLPAY-` keys make every detection once-only through webhook,
  poll and queue; close, hold, approve, send, run and re-close are safe to press twice.
- **OQ-71: nothing built.** No carry-forward record, recovery invoice, age setting, write-off or
  "departed anaesthetist" path; an anaesthetist with only negatives is not in a run; the open amount
  shows on the ledger position with its one caption and nets in a later cycle with positives.
- **The cycle is a setting.** Its days and week identity live in `appSettings.paymentCycle`; weekday
  names in copy come from it; date-fns over given dates only; no `Date.now()`, `new Date()` or
  `Math.random()`; the clock is never advanced by the cycle.
- **Hooks left for 41.** `runExclusionFor` is the only standing exclusion point; netting reads every
  open negative whatever its credit note's cause; a missing bank account is a Monday anomaly, never
  an automatic exclusion.
- **Seed and persistence.** Backdrop weekly runs reproduce the seeded disbursements exactly and move
  no figure; every seeded receipt has its bank line; two fresh seeds deep-equal; `PERSIST_VERSION`
  bumped; the staging bodies are deterministic.
- **Design and copy.** Signed amounts through one formatter with a hyphen-minus, neutral not red;
  teal the only action colour; no "provisional" or "20th" about the cycle; no en or em dashes in app
  copy.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry; ROADMAP.md "Owner review: agents test
  themselves"): the readings built for OQ-47's still-open parts (the office approves, as a step of
  its own after the Monday checks; the 20th-of-the-month payment left to Phase 16's monthly fee run),
  the cycle's built defaults (the demo clock does not gate the steps, so a week can be closed early
  and its stamp says so; a held line rolls whole into the next week; approval refuses while an
  anomaly is open; a missing bank account is a Monday anomaly, not an exclusion; staged one-pair
  demo runs sit beside the week's run), provisional readings (the GST schedule's treatment of a
  netted negative, OQ-29; the remittance advice in web Accounts and Admin only, with mobile Balances
  unchanged), anything logged rather than fixed, and the screens worth a look, each with its route
  and persona (the payment cycle panel with an anomaly held, a run detail with its schedule, a
  remittance advice, the invoice's "Paid out in Week 30", web Remittances as Dr Sharma and Dr
  Souter).
- **Status row** for catch-up Phase 39a, and a phase entry with:
  - the drift-check result (US-10.2.7 still Proposed, US-10.2.6 still Verify, US-10.2.5 and FT-10.2
    still Confirmed or not; OQ-47, OQ-71, OQ-60 and OQ-29 status; whether 39 shipped a negative
    invoice record or this phase added it);
  - what was built, with the name map for later phases: `PaymentCycleSettings` and
    `appSettings.paymentCycle`, `BankLine`, `PayablesRun` (kind, cycle, snapshot, anomalies) and its
    line, netting and total types, `isoWeekOf`, `cycleFor`, `cycleLabel`, `reconcileWeek`,
    `weekAnomalies`, `runExclusionFor`, `buildWeekRun`, `applyHolds`, `netNegatives`,
    `paymentSchedule`, `remittanceAdvice`, `applyOffset` and `PayableLeg.offsetAmount`,
    `credit.nettedAmount` and the negative invoice's `nettings` and `'netted'` status, `openCycle`,
    `openCycleDraft`, `closeWeek`, `holdOutOfRun`, `markAnomalyFixed`, `approveWeekBctis`,
    `sendPaymentSchedule`, `payRunInXero`, `recordOffset`, `payablesRunState`, `paymentWeekFor`,
    `formatSignedCurrency`, `XeroCreditAllocation`, `XeroBatchPayment`, `approveAndPayPairForDemo`,
    the credit-after-payout fixture builder, the routes, id formats and audit actions;
  - the `PERSIST_VERSION` bump (from and to);
  - tests added and the before and after Vitest and Playwright counts;
  - which session ended where (the session 1 checkpoint);
  - the review pass.
- **Catalogue screenshots result:** recipes created or changed (US-10.2.5, US-10.2.6, US-10.2.7, plus
  the re-pointed US-10.2.1, US-09.2.4, US-10.1.2 and US-08.3.4), the `capture/REPORT.md` counts
  (captured, partial, absent, failed) before and after, and any partial reason handed to a later
  phase.
- **Decisions log:**
  1. **Amended:** 2026-07-24 "Phase 10 build - decisions" item (5), the payables run as an
     unbadged office action, and Phase 37's "Run payables in Xero pays every due bill": released
     payables are paid only in a weekly run named by its ISO week (US-10.2.7), closed, checked,
     approved and scheduled by the office before the accountant pays it in Xero; the run is a record
     frozen at approval, superseded rather than edited. The one-click demo payouts (Simulate payment
     and payout, Stage refund after payout, the PWA stand-in) go through a one-pair staged run or the
     office's weekly run.
  2. **New:** the cycle is Greg's proposal (OQ-47 Proposed), built to and kept in
     `appSettings.paymentCycle` (ISO week, Friday close, Monday checks, Tuesday schedule); the office
     approves as its own step; the demo clock does not gate the steps; the 20th-of-the-month payment
     is not part of it.
  3. **New:** a Monday anomaly that cannot be fixed is held out and rolls whole into the next week's
     run; approval refuses while one is open; a missing bank account is an anomaly, not an
     exclusion.
  4. **New:** netting is decided by the engine at the close (and re-applied on each hold), executed
     in Xero as an ACCPAYCREDIT allocation and a net batch payment, and recorded by the engine at
     detection; the offset is its own leg amount, never cash.
  5. **New (OQ-71 answered, owner decision D21):** a negative invoice with no later payment to net
     against is handled outside the system. A run never pays below zero; what it cannot net stays
     open and nets in a later cycle; an anaesthetist with only negatives is not in a run; the open
     amount is shown on the ledger position with one caption. No carry-forward record or recovery
     invoice.
  6. **New:** seeded disbursements are grouped into backdrop weekly runs with bank lines, so every
     payment has a run, a week and an advice.
  7. If 39 recorded the payout case as a trail only: **superseded**, the negative invoice is a
     record netted in the next run (OQ-42 answered).
- **Handoff notes:**
  - For **41**: add `'heldInTrust'` to `runExclusionFor` for a held prepayment payable, nowhere
    else. A cancelled prepayment is not a negative to net (OQ-71's note: the money is still in trust
    and the anaesthetist has not been paid), so 41's cancellation refund normally raises nothing for
    a run; a refund that ever follows a payout goes through 39's credit path and is netted here with
    no change. The seeded prepayment payout's backdrop run (Week 29) is rebuilt by `buildWeekRun`
    when 41 reseeds the hold; the moved prepaid Booking's payee repoint (D38, OQ-80) changes the run
    line's anaesthetist through the pair, not the run, and makes an unpaid run stale (re-close). 41's
    trust account reads the same weekly cycle if it needs a trust cycle (OQ-47).
  - For **16 / OQ-60**: the fee never nets against payables (Greg, trust law); `netNegatives` never
    sees a fee invoice, and the monthly fee run is not the weekly cycle. If AA's accountant ever says
    otherwise, `netNegatives` is the place.
  - For **38**: the GST schedule's treatment of an offset-settled bill and a netted negative, and
    the Payments tab's Week column, as built.
  - For **43**: weekly runs with many lines and many anaesthetists must stay usable at full scale;
    the generator builds backdrop weekly runs and bank lines through `buildWeekRun`, never a second
    copy.
  - For **44**: S4 Beat 5 and its anomaly and netting asides and S3 Beat 3 as rewritten here; the
    OQ-47 line when the accountant answers; for the PWA parity audit, "no new mobile beat; the PWA
    payout stand-in runs the office's weekly cycle".
