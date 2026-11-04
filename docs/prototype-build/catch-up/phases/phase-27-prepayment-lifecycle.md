# Phase 27 · Prepayment lifecycle

**Requirements covered:**
[EP-06](../../../../requirements-board/requirements/stories/EP-06.md) (status 4, graded Contradicts; changed at `7cd7802`: the approval a step AA can switch off, the line priced above zero, the money credited to the AA Holding account, OQ-96 and OQ-104 answered. This phase builds the trigger, the amount, approval (and its switch) with generation and the pair, tracking, the re-check, and pricing at the prepaid amount with the Procedure left off the final invoice. The account and the transfer are 27a; letters, cancellation and by-hand differences are 41),
[FT-06.2](../../../../requirements-board/requirements/stories/FT-06.2.md) (status 4, graded Contradicts; changed: the line's price mandatory and above zero; a surgeon's price list can be the prepaid Contract, by practitioner ID),
[FT-06.3](../../../../requirements-board/requirements/stories/FT-06.3.md) (**joined at `7cd7802`**; status 4, graded Contradicts: the one difference from other invoices, the payable credits the AA Holding account, not the anaesthetist; [AR-52#pp-pair](../../../../requirements-board/requirements/artifacts/AR-52.md)),
[US-06.2.1](../../../../requirements-board/requirements/stories/US-06.2.1.md) (status 4, graded Contradicts; changed: detected per Procedure, only the Procedure on the prepaid Contract needs prepayment (new criterion); invoiced to whoever the Contract bills, OQ-73 revised),
[US-06.2.2](../../../../requirements-board/requirements/stories/US-06.2.2.md) (status 4, graded Contradicts; changed: a surgeon's list too; a prepaid line saved without a price or at 0 is refused (new criterion); OQ-104 and OQ-105 answered),
[US-06.3.1](../../../../requirements-board/requirements/stories/US-06.3.1.md) (status 4, graded Contradicts; changed: approval switchable (new criterion), addressed to whoever the Contract bills, payable to the AA Holding account; OQ-120 open),
[US-06.3.2](../../../../requirements-board/requirements/stories/US-06.3.2.md) (Confirmed, graded Partial; unchanged: a warning in both apps that strengthens as the date nears, part paid, every upcoming prepaid Booking listed),
[US-06.3.5](../../../../requirements-board/requirements/stories/US-06.3.5.md) (**now status 3, Verify**, graded Partial; changed at `a68f09b`: a new paragraph and a "Sent or paid" criterion: after the prepayment invoice is sent or paid, a Contract changed off prepaid is handled as a cancellation of the prepayment, [US-06.3.7](../../../../requirements-board/requirements/stories/US-06.3.7.md), which 41 builds; OQ-119 answered, D67),
[FT-08.1](../../../../requirements-board/requirements/stories/FT-08.1.md) (status 1, graded Contradicts; its one exception, the prepayment invoice generated before AUTHORISED),
[US-03.1.8](../../../../requirements-board/requirements/stories/US-03.1.8.md) (status 4, graded Partial; the prepaid amount on opening the Booking and where units are recorded),
[US-08.2.2](../../../../requirements-board/requirements/stories/US-08.2.2.md) (status 4, graded Contradicts; **rewritten** as "Prepaid Procedures left off the final invoice", OQ-116 answered: nothing deducted, a mixed Booking invoices only its not-prepaid Procedures, still ranked across all, and an all-prepaid Booking has no final invoice);
[DM-20](../analysis/domain-model-delta.md) (started by a prepaid Contract per Procedure, the line's price above zero, generated on approval (optional) with its pair to the AA Holding account, left off the final invoice with nothing deducted; the letter-template master is 41's);
[RV-05](../analysis/reverse-check.md) (prepayment as a payment category with a split deposit or an estimated full fee, netted from the final invoice).
**Left at `7cd7802`:** none. At `a68f09b`: OQ-119 answered (D67), US-06.3.5 now Verify; OQ-120 stays open (D68). At `d436947`: US-08.2.2 re-dated OQ-116's answer to 23 October and records that a mixed Booking's final invoice is unconfirmed with Vanessa (build as answered, D57); D37 answered: the prepayment invoice line prints the Procedure's invoice description.

**Depends on:** Phase 15a (the warning routine, `WARNING_RULES`, `prepaymentUnpaid` and its texts,
`appSettings` and its backfill, `warningClearances` and `clearWarning`, the to-do list, the triangle,
no confirm step at submit, `WARNING_SAMPLES`), Phase 21 (the payer, `billablePartyForProcedure`,
`isPayerBilled`, `setBookingPayer`) and Phase 25 (the snapshot at AUTHORISED, the relink with its
`PREPAID_KEEPS_PRICE` bucket, the version dashboard). Through them: 18's `prepaid` and `editable`
settings (never both) and dated versions; 19a's lines (a prepaid line refused at or below zero), Dr
Souter's prepay price list (Rhinoplasty $1,200) and surgeons' lists by practitioner ID; 20's one
Contract and line per Procedure, its picker and its interim (`prepaymentDetail`, replaced here); 20a's
`pricingBasisFor`; 22's GST rule, `materialiseInvoices`, send step, `deliveryPlanFor`, Split and
`prepaidSplit`; 23's ranking of every Procedure, prepaid or not (D26, D57); 24's `procedurePrice.ts`,
`anaesthetistMayChangePricing` and office price edit; 15b's ACTIVE; 14's trigger registry and office
stand-in.
**Run 27a straight after**: from here the prepayment's payable credits the AA Holding account, which
the payables run skips, and only 27a's transfer pays the anaesthetist again.
**Estimated:** 2 sessions. Session 1: items 1 to 9 (figures pinned, model, the pure rules, status,
approve and send with its pair and the switch, the warnings, pricing and leaving prepaid Procedures
off, seed), ending green with the UI edited only as far as it must compile. Session 2: items 10 to 15
(the Booking panel and the units row, the admin surfaces, wording, triggers, shots and the demo
guide). If session 1 overruns, items 8 and 9 open session 2; cut nothing, and never skip the demo
guide or the adversarial pass.

## Goal

Prepayment stops being something a person picks or estimates. A Procedure needs prepayment when the
office has picked for it a Contract whose version in force on the procedure date is flagged prepaid
(18's setting; D64), an anaesthetist's own prepay price list or a surgeon's, by practitioner ID (19a).
Detection is per Procedure: only the Procedure on the prepaid Contract needs it (US-06.2.1, FT-06.2).
The invoice goes to whoever the Contract bills (21's `billablePartyForProcedure`), normally the payer
on the Booking; a prepaid Contract that bills its holder is not forbidden (D23 revised, OQ-73). The
amount is that line's fixed price, mandatory and above zero (19a's guard; US-06.2.2, D27): in full,
never an estimate, deposit or part, shown to the anaesthetist on the Booking and where units are
recorded (US-03.1.8). Phase 20's interim, the deposit and split paths and `prepaymentDetail` go (RV-05).

Nothing is invoiced at setup. By default a pending prepayment is listed **Awaiting approval** on the
admin Invoices screen (US-06.3.1, FT-08.1; D38, D6). **Approve and send** generates the invoice, its
pair (a receivable from the party billed and a payable crediting the **AA Holding account**, the one
difference from other invoices, FT-06.3) and the draft Xero pair (US-09.1.3's shape), and sends it
through 22's send step (the letter is 41's). Approval is a step AA can switch off (D6 extended): a
**Prepayment approval** setting, on by default; off, each invoice is generated and sent as soon as
its Booking is ready. The account is a minimal payee and Xero contact the payables run never pays
(27a builds it and the transfer). The invoice names the anaesthetist from one field (OQ-120's
default, D68). Submit never invoices it again.

A prepaid Procedure keeps its issued price through a later Contract version (D47: 25's relink skips
it). At AUTHORISED it is priced at that amount, BTM for reference, and **left off the final invoice
with nothing deducted** (D57; US-08.2.2): a mixed Booking's final invoice carries only its
not-prepaid Procedures, still ranked across every Procedure (23, US-05.3.1), and an all-prepaid
Booking raises none. The deduction line and the `prepaidFunderOverride`, `prepaidCounterpartyChanged`
and prepayment `negativeTotal` exceptions go. The anaesthetist never changes a prepaid price (D30;
24's gate); the office can, raising nothing; differences are raised by hand (38b, 39, 41).

Nothing blocks (D5). Part paid is tracked and 15a's unpaid warning escalates, mild from a week out
and strong from two days out, in both apps (US-06.3.2). The requirement is derived, so a change of
Procedures, Contract or payer re-checks it at once (US-06.3.5, Verify: built as written): before
generation an unapproved prepayment leaves the list; after sending or payment a Contract changed off
prepaid is a cancellation of the prepayment (US-06.3.7, OQ-119 answered, D67), which 41 builds: until
then the invoice is never rewritten and an office warning is the interim, with no provisional caption. A move is not
a change: no code detects it, and the payable is the AA Holding account (US-06.5.4, D38).

**Pricing model in one place.** The rules (the requirement, the party, the amount, the status, the
approval switch) live in `aa-prototype/src/domain/billing/prepayment.ts`, plus one branch in 24's
`anaesthetistMayChangePricing`, behind `prepaymentForProcedure` and `prepaymentStatusFor`, so a later
design change stays a contained edit. Link
[AR-28#prepayment](../../../../requirements-board/requirements/artifacts/AR-28.md),
[AR-29#prepayment](../../../../requirements-board/requirements/artifacts/AR-29.md) (v6: a Contract
with `is_prepay` starts it; its editable prepaid price is not adopted, D30),
[AR-24](../../../../requirements-board/requirements/artifacts/AR-24.md) (`#prepayment-invoicing`,
`#prepayment-pair`, `#prepaid-left-off`),
[AR-52](../../../../requirements-board/requirements/artifacts/AR-52.md) (`#pp-approved`, `#pp-pair`)
and [AR-30#booking-procedure](../../../../requirements-board/requirements/artifacts/AR-30.md) (the
link on the booking procedure, which `prepaymentForProcedure` hides) in the header comments.

> Names below are today's names. Use the names Phases 15a to 25 actually shipped, as their PROGRESS
> entries record them.

## Before you start: drift check

1. Run the catalogue diff against the plan's baseline, catalogue commit `a68f09b` (rename-aware;
   never a plain `git diff` of the catalogue folder):

   ```
   node requirements-board/agent/skills/update-build-plan/tools/plan-state.mjs --diff EP-06,FT-06.2,FT-06.3,US-06.2.1,US-06.2.2,US-06.3.1,US-06.3.2,US-06.3.5,FT-08.1,US-03.1.8,US-08.2.2,FT-06.5,US-05.3.1,US-06.3.4,US-06.3.6,US-06.3.7,US-06.4.1,US-06.5.1,US-06.5.4,US-09.1.3,US-04.2.14,US-04.3.4,US-11.2.2,US-13.7.1,US-13.7.3,US-13.7.4,OQ-25,OQ-73,OQ-80,OQ-92,OQ-96,OQ-97,OQ-104,OQ-105,OQ-116,OQ-120,OQ-04,OQ-38,OQ-48,OQ-61,OQ-70,OQ-76,OQ-91
   ```

   The plan updates through `a68f09b` folded in the 27 and 28 October notes, the 29 October typed
   decision, the 23 October re-dating and the 4 November answers (summarised under "Requirements
   covered"); diff only for anything after `a68f09b`.
2. If an item changed since `a68f09b`, re-read it and adjust the work items; if one is now Retired or
   Future, drop it and say so in PROGRESS. Check US-06.2.3 to US-06.2.5, US-06.3.3, US-06.4.2,
   US-06.1.1 and FT-06.4 are still Retired and US-13.7.4 still Future.
3. **Answered: build as answered, no provisional label** (each as the Goal states it): D64 / OQ-25
   (prepaid is the Contract's setting); D27 / OQ-92 (a price above zero, no price-missing warning);
   D6 extended and D38 / OQ-80 (generated on approval, a switchable step, payable to the AA Holding
   account, no payee repoint); D23 revised / OQ-73 (whoever the Contract bills); D30 / OQ-96 (never
   the anaesthetist; the office can, raising nothing); D47 / OQ-104 (the issued price kept); D57 /
   OQ-116 (left off, nothing deducted, ranked across all); D5 / OQ-57 (no block); D42 / OQ-91 (the
   office keeps the lists); D67 / OQ-119 (before generation the re-check clears the requirement; after sending or paid, a Contract changed off prepaid is a cancellation of the prepayment, 41's: here the status reads `notNeeded` with an office warning, the interim, no provisional caption); US-06.3.5 (Verify, as written); OQ-04, OQ-38, OQ-61, OQ-76 (no estimate, contingency or part payment,
   nothing automatic afterwards); OQ-48 (the version in force on the procedure date); D37 / OQ-103 (the invoice line prints the Procedure's invoice description from 20a's chain, never the Contract line's description directly). If one has been
   reopened since `a68f09b`, build the plan as written and put it first on "For the owner's review".
4. **Open: build the default, one code comment naming the question, log it.** If answered since
   `a68f09b`, build the answer instead.
   - **OQ-120 (D68):** the prepayment invoice names the anaesthetist as other AA invoices do, from one
     constant (`PREPAYMENT_NAMES_ANAESTHETIST`, comment naming OQ-120), so dropping it is one line. No
     caption.
   - **OQ-97** (part credit) is 41's. Build nothing for it.
   - **Readings settled here (log them, no caption):** **derived, never stored** (the trigger is the
     Procedure's Contract, which a move does not change; the 7th review B6 ruling stands again; the
     issued invoice records the price); **one invoice per party billed** (normally one, the payer);
     **approval off** sends at each action that can make a Booking ready (Booking create, procedure
     add or edit, Contract or line picked, payer set), and switching off sends every pending ready
     one, confirmed with the count; **no split** on a prepaid Procedure (22's refusal and
     `prepaidSplit` re-keyed to `prepaymentForProcedure`); **no line yet** lists as awaiting approval
     with Approve disabled ("Pick the Contract line first"), never auto-sent; **unapproved at
     authorise** is billed on the final invoice at its line's price; **the office's price change** on
     a prepaid Procedure is for reference only, rewriting no invoice; **cancelled after sending** reads
     "no longer needed", for 41.
5. **Read what Phases 15a to 25 actually built** (their PROGRESS entries): 15a's `WarningFacts` and
   `prepaymentStatus`, the rule file and texts, `appSettings` and its backfill, the clearance re-open
   rule, `WARNING_SAMPLES` and its prepayment sample; 18's `prepaid` setting and "in force on a date";
   19a's lines, the prepaid-line price guard, Souter's price list and surgeons' lists; 20's interim
   requirement, `prepaymentDetail`, its validator checks, `setProcedureContract` and Riley's and Nair's
   seeded lines; 20a's `pricingBasisFor`; 21's payer helpers, `billablePartyForProcedure` and
   `setBookingPayer`; 22's `materialiseInvoices`, send step, `supplier`, Split and `prepaidSplit`;
   23's allocation; 24's `procedurePrice.ts`, `anaesthetistMayChangePricing` and the office price
   edit; 25's snapshot, relink buckets and `priceBookingFromLock`. Reuse what exists.
6. Record the result (including "no drift", the answers as built and the D68 default) in the PROGRESS entry.

## Reference

- **Design** (convention 17):
  - `docs/design/Design Language.dc.html`: the semantic tints (warning for awaiting approval, unpaid
    and part paid; success for paid), neutral pills for status, Spline Sans Mono with tabular-nums
    for every amount, and teal as the only action colour (crimson never on the prepayment panel, the
    rail card, the approval strip or the warning).
  - `docs/design/Admin Day.dc.html`: the right rail's white cards (15a's To-do card is the pattern
    for the new "Pre-payments" card).
  - `docs/design/Mobile App.dc.html`: the Booking detail anatomy (white cards with micro-cap
    headings, 14px radius) and the capture screen's units block.
  - `docs/design/Admin Review.dc.html`: the flag chips in the review table.
  - No mockup covers the prepayment panel. Extend the mobile card-row pattern: the prepaid procedures
    as mono rows (line, fixed price), a rule, then the prepaid amount and its status.
- **Catalogue:** the covered files above; for context FT-06.5, US-05.3.1, US-06.3.4, US-06.3.6,
  US-06.3.7, US-06.4.1, US-06.5.1, US-06.5.4, US-09.1.3, US-04.2.14, US-04.3.4, US-11.2.2, US-13.7.1
  to US-13.7.4; the questions OQ-97 and OQ-120 (open) and OQ-119, OQ-25, OQ-73, OQ-80, OQ-92, OQ-96,
  OQ-104, OQ-105, OQ-116, OQ-04, OQ-38, OQ-48, OQ-57, OQ-61, OQ-70, OQ-76 and OQ-91 (answered); and
  `requirements-board/requirements/domain-model.md` (the prepayment rows, Booking, Contract, Internal
  ledger, Warnings and the Prepayment paragraph). Evidence (cited passages only,
  `npm --prefix requirements-board run source -- --item <ID> --text`, Node 22.18 or newer): notes
  2026-10-16 "Pricing model documents v6" (#4, #19, #28), 2026-10-19 "AA meeting with Greg" (#4),
  2026-10-27 "AA meeting with Ben and Vanessa" (#1), 2026-10-28 "AA meeting with Greg" (#1, #5 to #7,
  #43 to #47, #49, #54, #56, #63, #87) and the typed decision of 2026-10-29.
- **Pricing model (v6):** [AR-28#prepayment](../../../../requirements-board/requirements/artifacts/AR-28.md);
  [AR-29](../../../../requirements-board/requirements/artifacts/AR-29.md) regions `prepayment`,
  `price-validation`, `pricing-snapshot`, `contract-behaviour`;
  [AR-30#booking-procedure](../../../../requirements-board/requirements/artifacts/AR-30.md); the
  billing flow [AR-24](../../../../requirements-board/requirements/artifacts/AR-24.md) regions
  `prepayment-check`, `prepayment-invoicing`, `prepayment-pair`, `prepayment-payment`,
  `prepayment-recheck`, `prepayment-move` and `prepaid-left-off` (`prepayment-settlement` is 27a's);
  [AR-52](../../../../requirements-board/requirements/artifacts/AR-52.md) regions `pp-approved` and
  `pp-pair`.
- **Gap analysis:** `GAP-ANALYSIS.md` (theme 6 "Prepayment replaced", "Things to remove or rework",
  "Demo impact" S4, the DM-20 and RV-05 rows); `epics/EP-06.md`, `epics/EP-03.md` (US-03.1.8),
  `epics/EP-08.md` (FT-08.1, US-08.2.2); `gaps.json` for the covered IDs;
  `analysis/domain-model-delta.md` (DM-20, DM-21, DM-07); `analysis/reverse-check.md` (RV-05).
- **Code entry points** (line numbers as the gap analysis cites them; shifted since):
  - `src/domain/types.ts` (`PrepaymentDetail`, `Procedure.prepaymentDetail`, `Invoice`, `InvoiceLine`,
    `BillingCase`, `XeroAccRec`, `XeroAccPay`); `src/domain/warnings/` (`types.ts` with `WarningFacts`
    and `AppSettings`, `routine.ts`, `rules/prepaymentUnpaid.ts`, `rules/index.ts`).
  - `src/domain/billing/`: `invoiceBuild.ts` (to remove: the deduction, `prepaidFunderOverride` and
    `prepaidCounterpartyChanged` about 296 to 345, the deduction line about 390, the prepayment
    `negativeTotal` about 417; `buildPrePaymentInvoiceForBooking` 456 to 521); 24's
    `procedurePrice.ts`; `validateBookingForBilling.ts` (204 to 221, the full or split checks);
    `prePaymentInvoice.test.ts`.
  - `src/store/`: `prepaymentActions.ts` (`raisePreProcedureInvoice` 52 to 170); `selectors.ts`
    (`bookingRequiresPrepayment`, `prePaidByProcedure`, `prepaymentStatusFor`); `billingRun.ts`;
    `paymentActions.ts` (the payable release); `xeroHandoff.ts` (`handoffCase`, the ACCPAY contact);
    the payables run; `listMoveActions.ts` (the stale payee-repoint comments); `clockActions.ts`;
    15a's `warnings.ts` and `warningSamples.ts`; `officeStandIn.ts`; their tests.
  - `src/shared/booking/BookingDetailBody.tsx` (the prepayment rows, `data-shot="booking-prepayment"`,
    the raise button); `src/shared/capture/` (`BtmCaptureBlock.tsx`, `UnitsCard.tsx`,
    `BookingTotalPanel.tsx`); 20a's stack; `src/shared/flows/EditBillingSetupSheet.tsx`;
    `src/shared/audit/`; `src/shared/demoTriggers/`; `src/domain/dateDays.ts` (`daysBetween`).
  - `src/apps/admin/`: `components/RightRail.tsx`, `outlet.ts`, `reviewFlags.ts`,
    `screens/InvoicesScreen.tsx`, `screens/InvoiceDocument.tsx` (the deposit, estimate and deduction
    wording), `screens/BillingMonitorScreen.tsx`; `src/apps/demo/DemoXero.tsx`, `xeroPairView.ts`,
    `DemoControlPanel.tsx` (the S4 scenario text).
  - Seed: `src/domain/seed/bookings.ts` (Riley on Souter Fri 24 AM, `SEED_MARKERS.prepaymentBooking`;
    Nair on Souter Fri 24 PM, `SEED_PREPAID_BOOKING_ID`), `billing.ts` (the paid INV0001/BC0001).
  - Shots: `visual/admin-phase09.spec.ts`, `admin-phase08.spec.ts`, 15a's `visual/warnings.spec.ts`.

## Work items

**Session 1: figures, model, rules, approval, pricing, seed.**

1. **Pin the figures first.** Extend the parity harness Phases 18 to 25 left (20's
   `contractParity.test.ts`, 19a's `feeParity.test.ts`, or their shipped names), with literals from
   the current build: every seeded Booking's prepayment status and open warnings; the S3 invoice
   totals, the S4 Beat 3 and Beat 5 figures and the S5 figures; Souter Fri 24 PM's run (Nair); the
   payables due per anaesthetist; and **the pair shape of a prepayment invoice** (US-09.1.3: ACCREC
   and DRAFT ACCPAY fields, the link between them). S3, S4 Beat 3, S5 and Forte's septoplasty invoice
   on Nair must not move. The deliberate changes, re-pinned in item 9 with the reason, are Riley's and
   Nair's prepayment figures, the ACCPAY contact (now "AA Holding account"), the deduction line gone
   from Nair's run and Souter's payables due (Nair's prepayment payable is held, not paid out, until
   27a). Never update a fixture with `-u`.
2. **Types** (`domain/types.ts`; DM-20):
   - Delete `PrepaymentDetail`, `Procedure.prepaymentDetail` and 20's interim fields and comments.
     Nothing can hold a deposit, a split amount or a typed prepaid amount. No `Booking.prepayment`
     record: the requirement is derived (drift check 4).
   - A prepayment `Invoice` gains `approval: { mode: 'approved' | 'automatic'; by: string; role:
     ActorRole; atISO: IsoDateTime }`; each of its `InvoiceLine`s carries `procedureId`, `contractId`,
     the version id and `lineId`, so the issued price (D47) and the re-check read the invoice.
   - The payable side (`XeroAccPay`, and `BillingCase`'s payable) gains a payee that is an
     anaesthetist or the holding account: `AA_HOLDING_ACCOUNT`, one constant with the Xero contact
     "AA Holding account", in the shape 27a and 36 extend. `xeroPairView.ts` shows it.
   - `AppSettings.prepayment: { approvalRequired: boolean }`, `true` in the seed and in 15a's backfill
     (pin it).
   - No estimate, contingency, excess record, held or withdrawn invoice state, or draft ACCREC status.
3. **The pure rules** (`domain/billing/prepayment.ts`, exported from the billing index, with
   `prepayment.test.ts`; US-06.2.1, US-06.2.2, FT-06.2; AR-29#prepayment):
   - `prepaidProceduresFor(booking, procedures, contracts, dateISO)`: every non-cancelled Procedure
     whose Contract's version in force on the procedure date has 18's `prepaid` on, an anaesthetist's
     or a surgeon's list alike. Per Procedure: the others on the Booking need nothing.
   - `prepaidAmountFor(procedure, contracts, dateISO)` (D27): `{ kind: 'priced', contractId,
     versionId, lineId, amount }` (no description: the invoice line reads the Procedure's, D37) from the line's fixed price (ex GST, above zero by
     19a's guard), or `{ kind: 'noLine' }`. Never an estimate, the RVG, a unit value or a typed price.
   - `prepaymentPartyFor(...)`: 21's `billablePartyForProcedure` for each prepaid Procedure (whoever
     the Contract bills; D23 revised). No person-only guard.
   - `prepaymentState(derived, issuedInvoices)`: `none`; `awaitingApproval` (required, nothing issued;
     `ready` false on `noLine` or an incomplete party); or `issued` with `match`, `notNeeded` (no
     longer on a prepaid Contract, or cancelled; after sending or payment, the interim until 41's
     cancellation handling of US-06.3.7, one comment) or `changedAfterSending`
     (its Procedures, Contract or party differ from the invoice's lines and addressee). An issued
     invoice is never rewritten.
   - `PREPAYMENT_NAMES_ANAESTHETIST = true` (OQ-120's default, D68, comment).
   - Tests: Souter's list and a surgeon's (fixture) are required, a Contract not flagged prepaid is
     not; Nair gives exactly one prepaid Procedure; a holder-billing prepaid Contract addresses the
     holder's party; cancelled never counts; `noLine`; no seeded prepaid line at or below zero; the
     version in force; each state.
4. **Status and selectors** (`selectors.ts`, tests in a rewritten `src/store/prepayment.test.ts`;
   US-06.3.2, US-06.3.4, US-06.3.5):
   - `prepaymentStatusFor(state, bookingId)` returns `{ status, amount, invoiceIds, invoicedTotal,
     receivedTotal, ready }` with status `none`, `awaitingApproval`, `unpaid`, `partPaid` (received
     above zero and below the invoiced total), `paid` (mirror money, as `paidPrePaymentCaseForBooking`
     reads today), `notNeeded` or `changedAfterSending`. A receipt re-checks it with no hook (US-06.3.4).
   - `bookingRequiresPrepayment` reads it; `prepaymentForProcedure(state, procedureId)` is the one
     selector answering "is this Procedure prepaid, at what amount, on which invoice, paid or not" for
     the panel, the units row, 20a's stack, 24's gate, 25's relink and the run.
   - `pendingPrepayments(state)`: every `awaitingApproval` Booking on a List not yet AUTHORISED, by
     date. `upcomingPrepayments(state)`: every prepaid Booking on such a List with its status and days
     to go from the demo clock.
   - **The re-check is the derivation** (US-06.3.5, Verify): a change of Procedures, Contract
     (including 25's relink) or party changes the status at once; nothing to call.
     `setProcedureContract`, `setBookingPayer` and the procedure edit return the status change for
     item 10's one-line confirmation. No move path reads or writes anything here; delete the stale
     payee-repoint comments in `listMoveActions.ts`. Test: a reassign leaves the status, amount,
     invoice and pair identical.
   - **Remove** `raisePreProcedureInvoice`'s public export and the office's raise button, 20's interim
     requirement and its prepayment row or sheet, the validator's full or split checks, and any
     `isPersonParty` prepayment guard; re-key 22's split refusal and `prepaidSplit` to
     `prepaymentForProcedure`. Completion never validates prepayment (D5). Re-point 15a's
     `facts.prepaymentStatus` to this status.
5. **Approve and send, and the switch** (`prepaymentActions.ts`; US-06.3.1, FT-06.3, FT-08.1; D6, D38):
   - `approvePrepayment(api, actor, bookingId)`: office only; refused unless the status is
     `awaitingApproval` and `ready`, and on a cancelled Booking or an AUTHORISED or billed List.
   - One `mutate()`, through the internal `generatePrepaymentInvoice` (the one place the pair is
     created; comment naming OQ-80): `buildPrePaymentInvoiceForBooking` reads `prepaidProceduresFor`,
     one invoice per party billed with one line per prepaid Procedure (the Procedure's invoice
     description read through 20a's chain helper, so an admin's edit shows and a blank Contract line
     description falls through; "Prepaid amount"; its fixed price ex GST), patient layout, GST by 22's rule, the anaesthetist
     named through `PREPAYMENT_NAMES_ANAESTHETIST`; 22's `materialiseInvoices` with `approval`
     stamped; the `BillingCase` and `handoffCase`: an ACCREC to the party billed and a DRAFT ACCPAY to
     `AA_HOLDING_ACCOUNT`; then 22's send step (`deliveryPlanFor`) at the clock time. Audited
     `invoice.prePaymentApproved` plus 22's `invoice.sent` or `invoice.portalQueued`.
   - **The switch** (US-06.3.1's new criterion): `setPrepaymentApprovalRequired(api, actor, on)`,
     office only, audited `settings.prepaymentApprovalChanged`. While off, `autoSendPrepayments(api,
     bookingId?)` runs at the end of each action that can make a Booking ready (drift check 4) and on
     switching off: the same `generatePrepaymentInvoice` with `approval.mode` `automatic` (by
     "System"), audited `invoice.prePaymentAutoSent`. Nothing is generated for one not `ready`.
   - A receipt authorises the ACCPAY pro rata as today; the payables run (and its due list) skips
     every payable to the holding account (27a releases it with the transfer).
   - Submit never invoices it again (US-06.3.1's criterion).
   - Tests: office approves once (invoice, pair, send); the anaesthetist, a second approve and
     `noLine` are refused; the line prints the Procedure's invoice description (an admin's edit shows, a
     blank line description falls through to the hospital's or rooms' text; D37); half a payment reads `partPaid`; the pair equals item 1's shape with the
     holding-account contact; the payables run pays nothing to it; off, picking the prepaid line sends
     at once and switching off sends the pending ready ones (not a `noLine` one); on again, the next
     waits.
6. **The prepaid amount for the anaesthetist** (US-03.1.8): `prepaymentForProcedure` gives the amount
   (the issued invoice's line once generated, else the Contract line's) and the status. Re-point 20a's
   `pricingBasisFor` so a prepaid Procedure reads "Prepaid amount $1,200.00" with its status. The
   surfaces are item 10's.
7. **The warnings** (15a's routine; US-06.3.2, US-13.7.1, D5):
   - Widen `WarningFacts.prepaymentStatus` to item 4's result and `store/warnings.ts`'s slice to what
     it needs; update the components that memoise on it.
   - **`prepaymentUnpaid` escalates by date.** One finding while the status is `awaitingApproval`,
     `unpaid` or `partPaid` and the List is not AUTHORISED: `daysToGo = daysBetween(todayISO,
     listDateISO)`; **mild** at `<= mildWithinDays` (7), **strong** at `<= strongWithinDays` (2),
     including the day and a passed date; nothing further out. Seed both in `defaultParams` (15a's
     backfill carries them; pin it). The same rule raises one mild office finding for `notNeeded` and
     `changedAfterSending`, whatever the date (the interim until 41, US-06.3.7). No price-missing rule (D27).
   - Texts (no en or em dash): `awaitingApproval` "Prepayment of {amount} is awaiting approval on
     Invoices and has not been sent."; `unpaid` "Prepayment invoice {number} unpaid. Check with the
     patient before surgery starts."; `partPaid` "Prepayment part paid, {x} of {y} received. Check
     with the patient before surgery starts."; `notNeeded` "Prepayment invoice {number} was sent, but
     this Booking no longer needs prepayment. Settle it by hand for now."; `changedAfterSending`
     "Prepayment invoice {number} was sent before this Booking changed. Check the amount; settle any
     difference by hand."
   - A cleared mild warning re-opens when strong (15a's rule); nothing ever blocks.
   - **Samples** (`warningSamples.ts`): re-point the prepayment sample to a Dr Souter Booking within
     the mild window set, through audited store actions, to her prepay price list's Rhinoplasty line
     with the patient paying (`awaitingApproval`). Unstage restores the seed.
   - Tests: thresholds at 8, 7, 3, 2, 0 and -1 days; each text; params move the windows; seeded Riley
     mild on Tue 21 Jul; strong after `advanceClockToDate('2026-07-22')`.
8. **Pricing at the prepaid amount, left off the final invoice** (24's `procedurePrice.ts`,
   `invoiceBuild.ts`, `billingRun.ts`, 25's relink and snapshot; US-08.2.2, US-05.3.1, US-06.4.1's
   pricing criteria; AR-24#prepaid-left-off):
   - **The price.** A prepaid Procedure's held price is the prepaid amount (24's rule: a held price is
     the price, BTM for reference). Once issued it is the invoice line's amount; 25's snapshot
     records it (27a's transfer reads it).
   - **Kept through a Contract change (D47):** 25's `PREPAID_KEEPS_PRICE` bucket reads
     `prepaymentForProcedure` (an issued prepayment invoice): not relinked, listed on the dashboard.
     Before issue the relink refreshes it like any Procedure.
   - **Who may change it (D30):** `anaesthetistMayChangePricing` returns false while
     `prepaymentForProcedure` reports a prepayment (one branch). The office price edit is allowed
     (24's office rule): it rewrites no invoice and raises nothing.
   - **Left off (D57):** the run builds no line for a Procedure with an issued prepayment. 23's
     allocation still ranks every Procedure on the Booking, so the not-prepaid ones keep the price
     they would have had with the prepaid one invoiced. A Booking whose Procedures are all left off
     raises no invoice; the run records `settledByPrepayment: { procedureIds, prepaymentInvoiceIds }`
     on the Booking's result for every Booking with one left off, audited `booking.prepaidSettled`,
     and an all-prepaid Booking reads billed (27a's transfer reads it).
   - **Remove** `prePaidByProcedure`, the "Less pre-payment deposit already invoiced" line and its
     GST matching, and the `prepaidFunderOverride`, `prepaidCounterpartyChanged` and prepayment
     `negativeTotal` exceptions with their tests. `negativeTotal` stays for every other negative; no
     excess path, balance invoice or credit.
   - **Unapproved at authorise:** billed on the final invoice at its line's price; it leaves the
     Awaiting approval list.
   - Tests (US-08.2.2's four criteria and more): issued, the Procedure is priced at its amount whatever
     the BTM, on no invoice, nothing deducted; mixed, only the not-prepaid Procedure is invoiced; a
     prepaid primary left off leaves the additional at the price it had with the primary invoiced;
     all-prepaid raises no invoice; a new version leaves an issued one; unapproved bills the line's
     price; the store refuses the anaesthetist, not the office; "Regenerate from locked data" matches.
9. **Seed** (`seed/bookings.ts`, `billing.ts`; bump `PERSIST_VERSION` by one):
   - **Riley** (Souter Fri 24 AM, `SEED_MARKERS.prepaymentBooking`): on Dr Souter's prepay price list's
     Rhinoplasty line (20), `prepaymentDetail` gone, the patient paying. Status `awaitingApproval` at
     $1,200.00 ex GST, mild warning on Tue 21 Jul (3 days out), no invoice. S4 Beat 1 approves it;
     once approved she is the all-prepaid case.
   - **Nair** (Souter Fri 24 PM, `SEED_PREPAID_BOOKING_ID`), the mixed case: the rhinoplasty on the
     price list's Rhinoplasty $1,200 line (replacing any demo line 20 added); the septoplasty stays on
     Forte's Contract. INV0001/BC0001 at $1,200.00 ex GST, `approval` by "Kirsty W." (`approved`) a few
     days before the demo date, sent and paid; the ACCPAY to the holding account, not disbursed.
     Authorising Fri 24 PM raises Forte's septoplasty invoice unchanged and nothing for the rhinoplasty.
   - `appSettings.prepayment.approvalRequired` is `true`.
   - Coherence test: the Bookings with a prepayment on Lists not yet AUTHORISED are exactly Riley and
     Nair; no other seeded Procedure sits on a prepaid Contract; no billed Booking reads outstanding.
     INV0001 stays Nair's, so S3's runtime numbers hold. Never change the filler's `rng()` draw order.
   - Update `seedBilling.test.ts`, `demoScenarios.test.ts` and the markers' comments; re-pin item 1's
     deliberate figures with the reason ("prepaid amount is the prepay Contract line's price; payable
     to the AA Holding account; prepaid Procedures left off, Phase 27").
   - **Session 1 exit:** UI edited only as far as compiling needs; `npm run build`, `npm run build:pwa`
     and `npx vitest run` green with item 1 passing; a "session 1 done" note in PROGRESS.

**Session 2: surfaces, triggers, demo.**

10. **The Booking prepayment panel and the units row** (a `PrepaymentPanel` in `src/shared/booking/`,
    all three apps through `useSurface()`; US-06.2.2, US-06.3.2, US-03.1.8, D30):
    - Title by status, as a semantic tint: "Pre-payment awaiting approval"; "Pre-payment unpaid";
      "Pre-payment part paid · $x of $y received"; "Pre-payment received"; "Pre-payment no longer
      needed"; "Pre-payment sent before a change". No caption (OQ-119 is answered).
      Amounts in mono, tabular-nums.
    - Body: one mono row per prepaid Procedure (the line, its fixed price, the Contract "Dr M. Souter,
      prepay price list"); who is invoiced (the party by name); the prepaid amount; the invoice number
      with a link (office). Other Procedures on the Booking are not listed. The warning stays in 15a's
      `WarningsPanel` above, not repeated.
    - **The office** sees, on `awaitingApproval`, a teal link "Approve on Invoices" to item 11's strip
      (or "Pick the Contract line first" opening 20's picker on `noLine`). Nobody types an amount.
    - **The anaesthetist** sees it read-only: the amount and whether it is paid.
    - **Where units are recorded** (`BtmCaptureBlock`, mobile and web): a compact row
      `data-shot="capture-prepaid"`, "Prepaid $1,200.00 · paid" (or its status); 24's price card reads
      "Prepaid amount" with no price field for the anaesthetist (no caption: D30 is answered).
    - The re-check is visible (US-06.3.5): the Contract picker's, payer sheet's and procedure edit's
      confirmations append one line when the status changes ("Pre-payment now needed: awaiting
      approval", or "sent" with approval off; "Pre-payment no longer needed"; "Pre-payment invoice sent
      before this change"), with no caption. A reassign shows none.
    - Delete the "RFP open question" and "discovery point" copy. Keep `data-shot="booking-prepayment"`.
11. **Admin surfaces** (US-06.3.1, US-06.3.2, US-08.2.2):
    - **Invoices screen:** an "Awaiting approval" strip above the table, one row per
      `pendingPrepayments` entry (patient, anaesthetist, procedure date, party invoiced, amount,
      Contract) with a teal **Approve and send** (disabled "Pick the Contract line first" when not
      ready); the confirmation names the invoice, where it went and the AA Holding account pair. The
      strip's header carries the **Prepayment approval** switch (office): "On · each prepayment invoice
      waits here for approval" or "Off · prepayment invoices are generated and sent at once"; switching
      off confirms how many pending invoices go now. `data-shot="invoices-awaiting-approval"`.
    - **Right rail:** a "Pre-payments" card under 15a's To-do card, fed by `upcomingPrepayments`:
      patient, `drSurname`, "In 3 days", the amount, a status pill; an awaiting row links to the strip,
      others open the Booking. Empty state "No upcoming pre-payments." `data-shot="rail-prepayments"`.
    - **Billing monitor and the admin Booking billing panel:** a Booking with a Procedure left off
      shows "Prepaid, left off the final invoice ({number})"; an all-prepaid one "Prepaid in full, no
      final invoice ({number})"; never an exception.
    - **Xero sim:** the prepayment ACCPAY's contact reads "AA Holding account".
    - The day grid needs no new signal: 15a's triangle carries the warning.
12. **Invoice wording, the review chip and audit labels:**
    - The prepayment invoice's note: "This invoice is the prepaid amount for the procedure. It is the
      price for the anaesthetic." No "estimate", "deposit" or "may be higher or lower" (the letters
      are 41's). Remove the deposit, estimated-fee and discovery-point sentences, here and in the
      `prepaymentActions.ts` module comment, and the deduction wording in `InvoiceDocument.tsx`.
    - Review chips (`reviewFlags.ts`): "Pre-payment sent, no longer needed" and "Pre-payment sent
      before a change" (warning tint), "Prepaid, left off" on a prepaid Procedure's price cell
      (neutral).
    - Audit labels: `invoice.prePaymentApproved` "Pre-payment invoice approved and sent",
      `invoice.prePaymentAutoSent` "Pre-payment invoice sent, approval off",
      `settings.prepaymentApprovalChanged` "Pre-payment approval switched on" or "off",
      `booking.prepaidSettled` "Prepaid, left off the final invoice"; an `approval` narrative
      formatter. Drop the `prepaymentDetail` formatter, its test and 20's interim label.
13. **Demo triggers** (the registry in `src/shared/demoTriggers/registry.ts`; bodies in `src/shared` or
    `src/store`, the office stand-in beside `authoriseAsSimulatedOffice` in `src/store/officeStandIn.ts`,
    so `pwaPurity` holds). See "Demo triggers" below. Registry tests: visibility per route; disabled
    reasons; the clock jump never rewinds; "Add prepaid Booking" creates one Booking awaiting approval
    (already sent with approval off); the stand-in approves exactly one. Never add anything to the
    Control Panel page; update its S4 scenario text (`DemoControlPanel.tsx`).
14. **Shots:** update `admin-phase09.spec.ts`, `admin-phase08.spec.ts` and `warnings.spec.ts` for the
    panel, the rail card, the approval strip with its switch and the mild-then-strong triangle; add a
    mobile shot of the panel and units row on Nair (paid) and a PWA shot of the stand-in. Run
    `node requirements-board/scripts/capture.ts --only US-06.2.1,US-06.2.2,US-06.3.1,US-06.3.2,US-06.3.4,US-06.3.5,US-06.4.1,US-08.2.2,US-03.1.8 --dry`
    to see what breaks; fixing it is the "Catalogue screenshots" step. Never edit a requirement.
15. **Demo guide** (below), in the same session.

## Demo triggers

Harness bar (framed build):

| Label | Screen | Surface | Effect |
|---|---|---|---|
| Move to 2 days before procedure | Admin · Day (`/admin/day/:dateISO`) and Admin · Booking detail (`/admin/day/:dateISO/bookings/:bookingId`) | bar | On the Booking detail it acts on that Booking; on the Day view `choices` lists the outstanding prepayments (awaiting approval, unpaid, part paid) from `upcomingPrepayments`, earliest first. Calls `advanceClockToDate(api, procedureDate - 2 days)`: the warning turns strong and a cleared mild one re-opens. Disabled with "No outstanding pre-payments" or "Already 2 days or less before". Forward only; Reset restores |
| Add prepaid Booking | Admin · Day and Admin · Booking detail | bar | As the office stand-in, creates a Booking on Dr Souter's next ACTIVE List for a seed demo patient, the patient paying, with one Procedure on her prepay price list's Rhinoplasty line. It appears "Awaiting approval" at $1,200.00 on the Invoices strip and the rail card, or already sent with approval off. Disabled with "No ACTIVE List for Dr Souter" or "Already added (Reset to repeat)" |
| Payment received · half / full (re-pointed) | Admin · Booking detail, plus Phase 14's invoice and Xero routes | bar | `choices` are that Booking's sent prepayment ACCRECs. Half shows "Part paid · $690.00 of $1,380.00 received" (use 22's GST total) on the panel, rail and warning; full shows "Pre-payment received" and the warning goes. Disabled with "Not approved yet" while awaiting approval. Same bodies and idempotency keys |
| Raise sample warnings (15a, shared) | Admin · Day | bar | Its prepayment sample is re-pointed to Souter's prepay price list (awaiting approval) |

**Approve and send** and the **Prepayment approval** switch are product controls on the Invoices
screen, not triggers. The mixed and all-prepaid cases need no button: Nair (seeded, mixed) and Riley
once approved (all-prepaid), then "Authorise for billing".

Registry ids (the capture runner's `trigger` step and ATLAS use them): `prepayment-two-days-before`
(bar and PWA), `add-prepaid-booking` and `pwa-office-approves-prepayment`. The payment entries keep
Phase 14's ids (`payment-half`, `payment-full`, `payment-replay`, `pwa-payment-half`,
`pwa-payment-full`); only their routes grow.

PWA equivalents (the mobile Booking waits on the office and on the patient):

| Label | Screen | Surface | Effect |
|---|---|---|---|
| Office approves and sends the prepayment invoice | Mobile · Booking (`/mobile/lists/:listId/bookings/:bookingId`) | PWA only, badge office stand-in | Calls `approvePrepayment` on this Booking. The message names the amount and invoice number. Disabled with "Already sent", "This booking does not need pre-payment" or "Pick the Contract line first" |
| Patient pays half / full of the pre-payment | Mobile · Booking | PWA only | Phase 14's `pwa-payment-half` / `pwa-payment-full` bodies, `choices` limited to this Booking's sent prepayment ACCRECs. Disabled with "No sent pre-payment invoice yet" |
| Move to 2 days before procedure | Mobile · Booking | PWA only | The bar entry's body on this Booking, so the handset's triangle turns strong |

## Out of scope

- The AA Holding account itself (its balance, entries and Admin card) and the transfer at
  authorisation to whoever did the List (DM-21, FT-06.5, US-06.5.1, US-09.1.3's settlement): Phase
  27a, straight after. This phase only names the payee and keeps the payables run off it.
- Prepayment letters and reminders (US-06.3.6; the letter joins Approve and send in 41); the credit
  or refund on cancellation, a fresh prepayment on rebooking, settling a Contract changed off prepaid
  after sending (US-06.3.7, OQ-119 answered, D67: 41 builds it; here only the office warning), by-hand additional invoices and
  credit notes on a prepaid Procedure, a part credit (OQ-97): Phases 38b, 39 and 41.
- Any payee repoint on a move: none is built by any phase (D38). Anything on a move (28, 31, 32, 32a).
- The ledger legs behind prepayment status: Phase 36.
- A settings page for the warning windows (US-13.7.4, Future). The unpaid-balance warning at booking
  (Phase 40).
- No estimate, deposit, partial prepayment, price-missing warning, deduction line, balance invoice,
  automatic credit or excess record is built, anywhere.

## Manual test checklist

The agent runs every item itself in the running app and reports it with evidence; none is handed
to the owner (ROADMAP.md "Owner review: agents test themselves").

- [ ] Reset. Admin Day, Tue 21 Jul: the "Pre-payments" card lists Annette Riley (Souter, Fri 24 Jul,
      "Awaiting approval", $1,200.00, "In 3 days") and Priya Nair as paid. The To-do card shows Riley's
      mild warning; the Fri 24 AM block carries the amber triangle.
- [ ] Admin Booking detail for Riley: the panel names Rhinoplasty on "Dr M. Souter, prepay price
      list" at $1,200.00 and the patient invoiced, with "Approve on Invoices"; no amount input, deposit,
      estimate or raise button anywhere. No invoice exists yet. Nair's panel lists only the
      rhinoplasty, not Forte's septoplasty.
- [ ] Invoices: the "Awaiting approval" strip lists Riley; the switch reads "On". "Payment received ·
      half" on her Booking is disabled ("Not approved yet").
- [ ] Approve and send: one invoice is generated and sent to the invoice email, naming Dr Souter; the
      audit shows `invoice.prePaymentApproved` by the office user; the Xero sim shows the ACCREC to the
      patient and a draft ACCPAY to "AA Holding account"; the status reads "Pre-payment unpaid"; Riley
      leaves the strip.
- [ ] "Payment received · half": panel, rail row and warning read part paid. Replay is idempotent.
      Run payables pays nothing to the holding account.
- [ ] Mobile, Souter Fri 24 AM, Riley: the triangle, the warning on opening, "Prepaid $1,200.00 · part
      paid" read-only on the Booking and in the units block; the price card reads "Prepaid amount" with
      no price field. Complete and submit with no confirm step: nothing blocks, no second invoice.
- [ ] Clear Riley's mild warning, then "Move to 2 days before procedure": Wed 22 Jul, strong on Admin
      and mobile.
- [ ] Switch off: on Invoices switch "Prepayment approval" off; "Add prepaid Booking" creates a Booking
      whose invoice is generated and sent at once (audit `invoice.prePaymentAutoSent`, pair to the AA
      Holding account), never on the strip. Switch it back on.
- [ ] Re-check: "Add prepaid Booking" (approval on), then change its Procedure's Contract to one not
      flagged prepaid: it leaves the strip, the confirmation says "Pre-payment no longer needed"
      (US-06.3.5, no caption). Back on the price list, a guardian as payer is named on the
      panel. A split on the prepaid Procedure is refused.
- [ ] Price kept (D47): on Riley (sent), save a new version of Dr Souter's price list with Rhinoplasty
      at a new price: Riley keeps $1,200.00 and the dashboard lists her as prepaid; the new Booking
      (unapproved) follows the new price.
- [ ] Move: reassign Riley (sent) to a colleague: no confirmation line, the amount, invoice, status
      and pair unchanged, no new invoice. Run this before the next item.
- [ ] Sent then changed: on a sent prepayment, change the Procedure to a Contract not flagged prepaid:
      nothing is rewritten on the invoice, the status reads "Pre-payment no longer needed", and the review chip and the mild office warning show. Reset after.
- [ ] Who may change it (D30): the anaesthetist has no price field on a prepaid Procedure and the
      store refuses; the office price edit saves, raises no invoice or credit and the issued invoice is
      unchanged.
- [ ] Authorise Souter Fri 24 PM (Nair, mixed): Forte's septoplasty invoice unchanged; no invoice line
      or deduction for the rhinoplasty; "Prepaid, left off the final invoice (AA-2026-0001)"; the
      rhinoplasty priced at the prepaid amount with its BTM for reference. Before authorising, "Make
      primary" on the rhinoplasty: the septoplasty is then invoiced at its additional-procedure price.
- [ ] All prepaid: approve Riley, authorise Souter Fri 24 AM: no final invoice for Riley ("Prepaid in
      full, no final invoice"). Unapproved: authorise a List with a Booking still awaiting approval:
      it is billed at the line's price and leaves the strip.
- [ ] S3, S4 Beat 3 and S5 figures unchanged (item 1); the pair shape matches the pinned one with the
      holding-account contact.
- [ ] No "estimate", "deposit", "Less pre-payment", "discovery point" or "RFP open question" on any
      prepayment surface, and no "Provisional" caption (OQ-119 is answered).
- [ ] PWA build, Riley's mobile Booking (Reset first): "Office approves and sends the prepayment
      invoice" (badged), then "Patient pays half", then "Move to 2 days before procedure". Bottom
      sheets, teal actions, no crimson.
- [ ] No en or em dashes in new copy; amounts in mono with tabular-nums.
- [ ] Catalogue screenshots: the recipes below created or updated, broken ones re-pointed, a full `npm run capture` with no failed recipe, the covered items' shots checked by eye, `npm run verify:board` green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots` and `npm run verify:board` are all green.

## Demo guide updates

Patch these in the same session (locate passages by text), in `docs/demo-guide/` and the matching
sections of `master-demo-guide.html`:

- `03-demo-script.md` **S4 Beat 1**, renamed "Pre-payment from a prepaid Contract" (its "Pre-payment
  required" wording and the "Raise pre-procedure invoice" aside go):
  - **Click:** Admin Day, Tue 21 Jul: Riley on the "Pre-payments" card ("Awaiting approval") and her
    warning on the To-do card. Open Riley: Rhinoplasty on Dr Souter's prepay price list, $1,200.00,
    the patient paying. Invoices: the "Awaiting approval" strip and its "Prepayment approval" switch,
    **Approve and send**; optionally the Xero sim pair (to the patient, and to the AA Holding
    account). Payment received · half: part paid. Mobile, Souter Fri 24 AM, Riley: the triangle, the
    warning, "Prepaid $1,200.00 · part paid" on the Booking and in the units block; complete and
    submit, no confirm step.
  - **Say:** "The office put this procedure on Dr Souter's own price list, flagged prepaid, so it
    needs prepayment: her price, in full, not an estimate. By default we approve it here, and AA can
    switch that step off. Approving sends it to the patient and credits the AA Holding account, not
    Dr Souter. Nothing blocks: the warning strengthens as the day approaches. After the procedure it
    is left off the final invoice, nothing deducted, nothing more automatic. A move to a colleague
    changes nothing in the books."
  - **Expected:** awaiting approval, then the sent invoice with its pair to the AA Holding account,
    part paid on all three surfaces, and a submit that goes through.
- **S4 new closing Beat 6, "The date approaches"** ("Move to 2 days before procedure" on Admin Day,
  after clearing Riley's mild warning). It sits last so Beats 2 to 5 run on the seeded date; if Beat 2
  loses its ACTIVE today List after a jump, keep the jump last and say so in Stage it.
- S4 "Discovery points": "whether the prepayment invoice names the anaesthetist (OQ-120)" only. Say OQ-96,
  OQ-104, OQ-116 and OQ-119 as facts (never editable by the anaesthetist, the prepaid price kept, left
  off the final invoice, a Contract changed after sending handled as a cancellation, built in 41);
  drop any gate, deposit, estimate, missing-price, setup-generation, deduction or move point.
- `04-presenter-cheat-sheet.md` section 8 "Pre-payment": rewritten to the trigger (a Contract flagged
  prepaid, picked by the office, per Procedure), the amount (the line's price, in full), approve and
  send (a switchable step) with the AA Holding account, the escalating warning (D5), left off the
  final invoice with nothing automatic afterwards, a move changes nothing. Drop "come later (catch-up
  Phase 27)".
- `02-workflows-and-handoffs.md` "Pre-payment" case and its status row: the same rewrite.
- `docs/demo-guide/README.md` status row and the master guide's status table: "Pre-payment from a
  prepaid Contract: approve and send (switchable), AA Holding account, escalating warning, left off the
  final invoice".
- The Control Panel S4 scenario text (item 13).
- **Milestone:** end with a consistency read of `master-demo-guide.html` against the edited Markdown:
  S4 beat numbering, figures and trigger labels agree.

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19),
run after the review pass and before the PROGRESS.md entry. Re-run
`node requirements-board/agent/skills/update-build-plan/tools/recipe-status.mjs 27` first. Stage the
strip, the switch and the sent invoice with real clicks (product controls), and a payment or the clock
jump with the runner's `trigger` step after a `goto` to the entry's screen. The Control Panel has no
payment buttons. Replace every stale caption (an estimated fee, a deposit, a balance invoice, a
deduction, a payment category, a payable to the anaesthetist, the "prepay holding account").

| Item | Recipe now | When this phase is done |
|---|---|---|
| [US-06.2.1](../../../../requirements-board/requirements/stories/US-06.2.1.md) | partial · mobile-prepayment-flag, web-prepayment-flag | captured. Riley's panel on mobile, web and admin, highlight `[data-shot=booking-prepayment]`, plus a Nair state (only the prepaid Procedure listed). Caption: "Each Procedure on a Contract flagged prepaid needs prepayment". |
| [US-06.2.2](../../../../requirements-board/requirements/stories/US-06.2.2.md) | partial · admin-deposit-invoice, admin-full-fee-invoice | captured. Delete `deposit-invoice`; `full-fee-invoice` at `/admin/invoices/INV0001` captioned "Prepayment invoice for the prepay Contract line's price, in full"; add admin `prepaid-amount` (Riley's panel, the line row, no amount input). |
| [US-06.3.1](../../../../requirements-board/requirements/stories/US-06.3.1.md) | captured · admin-raise-prepayment-invoice, admin-prepayment-invoice, simulator-prepayment-xero-pair | captured. Rename `raise-prepayment-invoice` to `approve-and-send`, states `awaiting-approval` (the strip, switch on), `sent` and `approval-off` (switch off, the added Booking sent at once); keep `prepayment-invoice`; `prepayment-xero-pair` shows the payable to "AA Holding account". Caption: "Generated when an admin approves it (a step AA can switch off), its payable to the AA Holding account". |
| [US-06.3.2](../../../../requirements-board/requirements/stories/US-06.3.2.md) | partial · admin-day-grid-flag, admin-card-status | captured. `day-grid-flag` on 15a's triangle; `card-status` states `awaiting-approval`, `unpaid`, `part-paid`, `received`; add `rail-prepayments`, a mobile Riley shot, and `strong` after the `prepayment-two-days-before` trigger. Caption: "Prepayment status per upcoming Booking, with a warning that strengthens as the date nears". |
| [US-06.3.5](../../../../requirements-board/requirements/stories/US-06.3.5.md) | partial · admin-recheck-on-change | captured (the story is Verify). `recheck-on-change` states `before` (awaiting approval) and `after` (Contract changed off prepaid before generation: off the strip, "no longer needed"); add `moved` (Riley sent, reassigned: unchanged). Captions: "Before the invoice is generated, a Contract no longer prepaid clears it" and "A move changes nothing". No caption for the sent-or-paid criterion (41 builds it and re-stages). |
| [US-03.1.8](../../../../requirements-board/requirements/stories/US-03.1.8.md) | none | Create, captured. Mobile and web, Nair (paid): `booking` (highlight `[data-shot=booking-prepayment]`) and `units` (`[data-shot=capture-prepaid]`). Caption: "The anaesthetist sees the prepaid amount on the Booking and when recording units". |
| [US-08.2.2](../../../../requirements-board/requirements/stories/US-08.2.2.md) | captured · admin-deposit-invoice, admin-balance-invoice | captured. Delete `deposit-invoice`; rename `balance-invoice` to `left-off`: authorise Souter Fri 24 PM, Forte's septoplasty invoice with no rhinoplasty line or deduction and "Prepaid, left off the final invoice (AA-2026-0001)", highlight the billing panel. Caption: "Prepaid Procedures are left off the final invoice; nothing is deducted". |
| [FT-06.2](../../../../requirements-board/requirements/stories/FT-06.2.md) | none | Create, captured: admin Riley panel (trigger and amount from the prepaid Contract). Caption: "A prepaid Contract starts prepayment at its line's price". |
| [FT-06.3](../../../../requirements-board/requirements/stories/FT-06.3.md) | none | Create, captured: the Xero sim pair for INV0001, highlight the ACCPAY contact. Caption: "A prepayment's payable credits the AA Holding account, not the anaesthetist". |
| [FT-08.1](../../../../requirements-board/requirements/stories/FT-08.1.md) | none | Create, captured: the Invoices "Awaiting approval" strip. Caption: "The one invoice before AUTHORISED: a prepayment, generated on approval". |
| [EP-06](../../../../requirements-board/requirements/stories/EP-06.md) | none | No recipe (epics carry none); its stories' shots cover it. |
| US-06.3.4 | captured · admin-recheck-after-payment | Re-stage only: Approve and send on the strip, then `payment-half` / `payment-full`, not the Raise button. |
| US-06.4.1 | captured · admin-balance-invoice | No change here beyond the break (Phase 41 owns it): rename to `prepaid-price` (Nair priced at the prepaid amount, left off). |
| US-06.3.6, US-06.3.7, US-06.5.2, US-06.5.3, US-06.5.4 | absent or none | No change here (Phase 41 owns them). |
| US-06.5.1 | absent | No change here (Phase 27a owns it). |
| US-08.1.1 | captured | No change here; add a Nair state to `billing-run` only if it still passes `--dry`. |

**Recipes this phase breaks.** Every recipe that clicks "Raise pre-procedure invoice" (`US-09.2.1`,
`US-09.2.3`, `US-09.2.4`, `US-09.3.4` and the covered ones): replace the click with Approve and send on
Riley's strip row, keeping each shot `name`, amounts now $1,200.00 plus GST. `daygrid-block-prepayment`
leftovers: re-point to 15a's triangle or open Riley by URL. Retired items' recipes (`US-06.2.3` to
`US-06.2.5`, `US-06.4.2`, `US-06.3.3` if it still shows a gate) get `status: absent` with the reason.
`INV0001` and `XRB0` recipes (`US-05.2.7`, `US-08.4.1`, `US-09.1.1`, `US-08.3.1`, `US-09.1.3`,
`US-10.1.1`, `US-10.3.1`, `US-15.0.6`): Nair's prepayment is $1,200.00 ex GST and its ACCPAY is to the
AA Holding account; check amounts, payees and any deduction line in captions.

**ATLAS.md.** Seed: Riley awaiting approval, Nair's paid INV0001 at the price list's price with its
payable to the AA Holding account, approval on. Hooks: keep `booking-prepayment`; add
`capture-prepaid`, `rail-prepayments`, `invoices-awaiting-approval`. The S4 scenario text, and "Demo
actions by screen" gains `prepayment-two-days-before`, `add-prepaid-booking`, the payment entries on
the Booking detail, and `pwa-office-approves-prepayment`.

## Adversarial review (after build)

After the manual test checklist and the four commands are green, and before writing the PROGRESS
entry, run the standard adversarial review-and-fix pass (PROGRESS convention 18). Fan out
independent Opus review subagents: quality, bugs/correctness and plan adherence, plus a fourth,
money lens for this money phase. Then this session verifies every finding against the catalogue, this
plan and the code, fixes the confirmed ones, re-greens, and records the pass. Do not re-raise
anything settled in the Decisions log except the rulings this phase explicitly supersedes.

**Steer this phase's reviewers at:**

- **Derivation.** Only a Contract flagged prepaid (18's setting, the version in force) triggers it,
  per Procedure, an anaesthetist's or a surgeon's list; nothing reads a payment category, the profile
  or 20's interim. Cancelled Procedures never count; the invoice goes to whoever the Contract bills,
  with no person-only guard.
- **The amount.** Only the prepaid Contract line's fixed price, through `prepaidAmountFor`. No
  estimate, unit value, RVG, deposit, typed or partial amount anywhere, and no price-missing warning.
- **Approval and the pair (D6, D38, FT-06.3, FT-08.1).** With approval on, nothing is generated before
  an admin approves; with it off, only `ready` Bookings are sent, once. The pair is created once, in
  `generatePrepaymentInvoice`, its payable to the AA Holding account; the payables run never pays it;
  submit never invoices it again.
- **No move logic.** No reassign or move path touches the status, invoice or pair; no payee repoint.
- **Pricing and money (D57, D47, D30).** An issued prepayment prices its Procedure at its amount, kept
  through a new version, never the anaesthetist's to change; on no final invoice, nothing deducted;
  mixed Bookings keep 23's ranking across every Procedure; all-prepaid raises nothing. Prepaid plus
  invoiced equals the priced fees (GST included). No deduction line, `prepaidFunderOverride` or
  `prepaidCounterpartyChanged` remains; `negativeTotal` fires for every other negative.
- **Status and warning (D5, D67).** Part paid from mirror money; mild at 7, strong at 2, nothing
  once AUTHORISED; a cleared mild warning re-opens; `notNeeded` and `changedAfterSending` never rewrite
  the invoice; the demo clock only; nothing blocks.
- **One place.** The rules in `prepayment.ts` (with the switch and `PREPAYMENT_NAMES_ANAESTHETIST`),
  one branch in 24's gate, behind `prepaymentForProcedure` and `prepaymentStatusFor`; the AR links in
  the header comments.
- **Triggers and PWA.** Each entry on its routes only, the clock never rewinds, the stand-in badged,
  `pwaPurity` passes, seed determinism and the filler `rng()` order unchanged, `PERSIST_VERSION`
  bumped.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry), each with its route and persona:
  - D67 (OQ-119, answered): after sending, a Contract changed off prepaid is 41's cancellation; here
    it rewrites nothing and an office warning is the interim (Donald's answer, AA has not seen it);
  - D68 (OQ-120): the prepayment invoice names the anaesthetist, from one constant;
  - the readings in drift check 4, and the 7 and 2 day windows;
  - Souter's payables due fall by Nair's held prepayment until 27a.
- Status row and a phase entry: the drift check against `a68f09b`; the answers built (D64, D27, D6
  extended, D38, D23 revised, D30, D47, D57, D67, D5, D42, OQ-04, OQ-38, OQ-61, OQ-76, US-06.3.5 as written) and the D68 default and
  where each lives; what 15a to 25 provided; the sessions and the adversarial
  pass; the tests added; `PERSIST_VERSION` old to new and the re-pinned figures; the Catalogue
  screenshots result (recipes created or changed, broken ones re-pointed, REPORT.md counts before and
  after); handoffs: **27a** (`AA_HOLDING_ACCOUNT`, the payables skip, `settledByPrepayment` and the
  snapshot price for the transfer), **28, 31, 32, 32a** (no move path touches prepayment), **36**
  (`prepaymentStatusFor` and `settledByPrepayment` to the ledger legs), **38b, 39** (by-hand routes
  only; no deduction line to credit; `notNeeded` and `changedAfterSending` are their cases), **41**
  (the letter joins Approve and send and the automatic send, the credit or refund, OQ-119's
  settlement, `prepaidAmountFor` for a fresh prepayment, `PREPAYMENT_NAMES_ANAESTHETIST` for the
  letter), **43** (generate prepaid Bookings on prepaid Contracts through the same module).
- Decisions log:
  - **Superseded:** Phase 09's office raise by hand and its build decision (4) and the 8th review's
    "full | split" (split balance = fee - deposit, full = an estimated fee); the planned estimate and
    deposit (retired with US-06.2.3 to US-06.2.5); generation at setup with a held invoice (this
    plan's earlier D6 reading); approval as a fixed step (D6 extended); "always a person, never an
    organisation" (D23 revised); the profile prepaid set as trigger (D64); the pair to the anaesthetist
    and the payee repoint on a move (D38); Phase 20's interim; 15a's flat "strong" strength; the
    netting deduction line with `prepaidFunderOverride`, `prepaidCounterpartyChanged` and the
    prepayment `negativeTotal` (D57; the Phase 08 belt stays for every other negative); the office
    price lock (OQ-96's former default); 22's `prepaidSplit` keyed on 20's interim (re-keyed).
  - **Readings settled here:** as listed under "For the owner's review".
  - **Answered, built as answered:** D64 / OQ-25, D27 / OQ-92, D6 and D38 / OQ-80, D23 / OQ-73, D30 /
    OQ-96, D47 / OQ-104, D57 / OQ-116, D67 / OQ-119 (interim warning), D5 / OQ-57, D42 / OQ-91, OQ-04,
    OQ-38, OQ-61, OQ-76.
  - **Default for an open question:** D68 / OQ-120.
