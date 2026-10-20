# Phase 27 · Prepayment lifecycle

**Requirements covered:**
[EP-06](../../../../requirements-board/requirements/stories/EP-06.md) (status 3, graded Contradicts; changed at `d4db277`: a Contract flagged prepaid triggers it, the line's price in full, the invoice generated on admin approval, the money held in the prepay holding account, nothing calculated afterwards, a move changes nothing. This phase builds the trigger, the amount, approval with generation and the pair, tracking, the re-check and pricing at the prepaid amount. The holding account and the second pair are 27a; letters, refunds and by-hand settlement are 41),
[FT-06.2](../../../../requirements-board/requirements/stories/FT-06.2.md) (status 4, graded Contradicts; changed: the trigger is the prepaid Contract the office picks, the amount its line's price),
[US-06.2.1](../../../../requirements-board/requirements/stories/US-06.2.1.md) (status 4, graded Contradicts; changed: any Procedure on a Contract flagged prepaid, across the whole Booking; always from a person, OQ-73),
[US-06.2.2](../../../../requirements-board/requirements/stories/US-06.2.2.md) (status 4, graded Contradicts; changed: the fixed price on the prepaid Contract's line, which always carries one, in full; OQ-92 answered),
[US-06.3.1](../../../../requirements-board/requirements/stories/US-06.3.1.md) (status 4, graded Contradicts; changed: generated when an admin approves it on the outgoing-invoices screen, not at setup; its pair a receivable from the payer and a payable to the prepay holding account; OQ-80 answered),
[US-06.3.2](../../../../requirements-board/requirements/stories/US-06.3.2.md) (Confirmed, graded Partial; unchanged: a warning in both apps that strengthens as the date nears, part paid, every upcoming prepaid Booking listed),
[US-06.3.5](../../../../requirements-board/requirements/stories/US-06.3.5.md) (status 3, graded Partial; changed: cleared when the Procedure's Contract is no longer prepaid; a move changes nothing in the ledger),
[FT-08.1](../../../../requirements-board/requirements/stories/FT-08.1.md) (status 1, graded Contradicts; its one exception, the prepayment invoice generated on admin approval before AUTHORISED),
[US-03.1.8](../../../../requirements-board/requirements/stories/US-03.1.8.md) (status 4, graded Partial; the prepaid amount, the price on its issued invoice, on opening the Booking and where units are recorded),
[US-08.2.2](../../../../requirements-board/requirements/stories/US-08.2.2.md) (status 4, graded Contradicts; the deduction leaves nothing to bill; the anaesthetist is paid from the holding account, 27a; OQ-96 still open);
[DM-20](../analysis/domain-model-delta.md) (started by a prepaid Contract, the line's price, generated on approval with its pair to the holding account, nothing calculated afterwards; the letter-template master is 41's);
[RV-05](../analysis/reverse-check.md) (**joined at `d4db277`**: prepayment as a payment category with a split deposit or an estimated full fee, netted automatically).
**Left at `d4db277`:** RV-09 (the reverse check was renumbered: the prepayment finding this phase closed is now RV-05, and RV-09 is a P1 modifier finding, Phase 19b's). No item work leaves with it.

**Depends on:** Phase 15a (session 1, built: the pure warning routine in `src/domain/warnings`,
`WARNING_RULES`, the `prepaymentUnpaid` rule and its texts, `appSettings` and its backfill,
`warningClearances`, `store/warnings.ts` and the audited `clearWarning`, the completion gate gone;
session 2: the to-do list, the triangle, the warning on opening a Booking, no confirm step at submit,
`WARNING_SAMPLES`), Phase 21 (the payer on the Booking, `billablePartyForProcedure`, `isPayerBilled`,
`isPersonParty`, `setBookingPayer`) and Phase 25 (the pricing snapshot at AUTHORISED, the relink
with its `PREPAID_KEEPS_PRICE` bucket, the version review dashboard). Through them: 18's Contract
settings (`prepaid`, `editable`) and dated versions; 19a's lines and Dr Souter's prepay price list
(prepaid on, Rhinoplasty $1,200); 20's one Contract and line per Procedure, its picker and "Needs a
Contract" card, and its interim (the prepaid-Contract requirement with `prepaymentDetail`, replaced
here); 20a's `pricingBasisFor`; 22's GST rule, `materialiseInvoices` with its separate send step,
`deliveryPlanFor`, the Split action and `prepaidSplit`; 24's one price rule (`procedurePrice.ts`,
`anaesthetistMayChangePricing`); 15b's ACTIVE state; 14's trigger registry and office stand-in.
**No longer on Phase 26**: prepaid is a Contract setting (D64), so 26 builds no prepaid settings.
**Run 27a straight after**: from here the prepayment's payable goes to the holding account, which
the payables run skips, and only 27a's second pair pays the anaesthetist again.
**Estimated:** 2 sessions. Session 1: items 1 to 9 (figures pinned, model, the pure rules, status,
approve and send with its pair, the warnings, pricing at the prepaid amount, seed), ending green with
the UI edited only as far as it must compile. Session 2: items 10 to 15 (the Booking panel and the
units row, the admin surfaces, wording, triggers, shots and the demo guide). If session 1 overruns,
items 8 and 9 open session 2; cut nothing, and never skip the demo guide or the adversarial pass.

## Goal

Prepayment stops being something a person picks or estimates. A Booking needs prepayment when the
office has picked, for any of its non-cancelled Procedures, a Contract whose version in force on the
procedure date is flagged prepaid (18's setting; D64, OQ-25 answered), normally the anaesthetist's
own prepay price list (19a), checked across the whole Booking (US-06.2.1, FT-06.2). Nothing on the
anaesthetist's profile triggers it. The payer on the Booking (21) prepays, always a person paying
for the patient, never an organisation (D23, OQ-73). Phase 20's interim goes: the deposit and split
paths and `prepaymentDetail` (RV-05).

The prepaid amount is the fixed price on that Procedure's Contract line, which always carries one
(US-06.2.2; OQ-92 answered, D27): the full amount, never an estimate, a deposit or a part (OQ-38,
OQ-76). No warning rule is built for a missing price. The anaesthetist sees it on the Booking and
where units are recorded (US-03.1.8).

Nothing is invoiced at setup. While required and not yet invoiced, the prepayment is listed
**Awaiting approval** on the admin Invoices screen, where outgoing invoices are approved (US-06.3.1,
FT-08.1; OQ-80 answered, D38; D6 superseded). An admin's **Approve and send** generates the invoice,
its pair (a receivable from the payer on the Booking and a payable to the **prepay holding
account**) and the matching draft Xero pair (US-09.1.3's shape), and sends it through 22's send
step (the letter is 41's). Here the holding account is a minimal ledger payee and Xero contact that
the payables run never pays; 27a builds the account itself and the second pair at authorisation. A
later List submit never invoices it again.

A prepaid Procedure keeps the price on its issued invoice through a later Contract version (OQ-104's
default, D47: 25's relink skips it). Once the List is AUTHORISED it is priced at that amount, its
recorded BTM for reference only, and the final invoice deducts the prepayment, so nothing is left to
bill: no balance invoice, no credit, either way (US-08.2.2, US-06.4.1's pricing criteria; on a
Booking mixing prepaid and other Procedures the deduction line shows, OQ-116's default, D57). Its
price is locked (OQ-96's default, D30); any difference is raised by hand (38b, 39, 41).

Nothing blocks (D5). This phase tracks part paid and makes 15a's unpaid warning escalate, mild from a
week out and strong from two days out, in both apps (US-06.3.2). The requirement is derived, so a
change of Procedures, Contract or payer before the procedure re-checks it at once (US-06.3.5): an
unapproved prepayment simply leaves the Awaiting approval list when no longer on a prepaid Contract;
an approved one is never rewritten and raises an office warning. A move is not a change: no code
detects it, and the ledger needs nothing because the payable is the holding account (US-06.5.4, D38).

**Pricing model in one place.** The rules (the requirement, the amount, the status) live in
`aa-prototype/src/domain/billing/prepayment.ts`, plus one branch in 24's
`anaesthetistMayChangePricing`, behind `prepaymentForProcedure` and `prepaymentStatusFor`, so a later
design change stays a contained edit. Link
[AR-28#prepayment](../../../../requirements-board/requirements/artifacts/AR-28.md),
[AR-29#prepayment](../../../../requirements-board/requirements/artifacts/AR-29.md) (v6: a Contract
with `is_prepay` starts it; its editable prepaid price is not adopted, D30),
[AR-24#prepayment-pair](../../../../requirements-board/requirements/artifacts/AR-24.md) (renamed from
`#prepayment-pair-undecided`) and
[AR-30#booking-procedure](../../../../requirements-board/requirements/artifacts/AR-30.md) (the link
on the booking procedure, which `prepaymentForProcedure` hides) in the header comments.

> Names below are today's names (code unchanged since `b342a7d`, Phase 15a session 1). Use the names
> Phases 15a to 25 actually shipped, as their PROGRESS entries record them.

## Before you start: drift check

1. Run the catalogue diff against the plan's baseline, catalogue commit `d4db277` (rename-aware;
   never a plain `git diff` of the catalogue folder):

   ```
   node requirements-board/agent/skills/update-build-plan/tools/plan-state.mjs --diff EP-06,FT-06.2,US-06.2.1,US-06.2.2,US-06.3.1,US-06.3.2,US-06.3.5,FT-08.1,US-03.1.8,US-08.2.2,FT-06.3,FT-06.4,FT-06.5,US-06.3.4,US-06.3.6,US-06.4.1,US-06.5.1,US-06.5.4,US-09.1.3,US-04.2.14,US-04.3.4,US-11.2.2,US-13.7.1,US-13.7.3,US-13.7.4,OQ-25,OQ-73,OQ-80,OQ-92,OQ-96,OQ-97,OQ-104,OQ-116,OQ-04,OQ-38,OQ-48,OQ-61,OQ-70,OQ-76,OQ-91
   ```

   At the 2026-10-20 plan update (`60e2d1e..d4db277`; change logs `2026-10-16-requirements-update.md`
   and the 19 October notes) the changes touching this phase were: the trigger moved to a Contract
   flagged prepaid (EP-06, FT-06.2, US-06.2.1, US-06.3.5, FT-08.1; FT-06.1, US-06.1.1, US-06.1.2 and
   US-12.1.3 Retired); the amount is the prepaid Contract line's price, always present (US-06.2.2,
   OQ-92); the invoice and its pair are generated on admin approval, the payable to the prepay
   holding account (US-06.3.1, OQ-80, US-06.5.1); a prepaid Procedure keeps its price through a
   Contract change (OQ-104, open); OQ-116 (mixed Bookings) new and open; OQ-96 widened. The plan
   reflects all of this; diff only for anything after `d4db277`.
2. If an item changed since `d4db277`, re-read it and adjust the work items; if one is now Retired or
   Future, drop it and say so in PROGRESS. Check US-06.2.3 to US-06.2.5, US-06.3.3, US-06.4.2 and
   US-06.1.1 are still Retired and US-13.7.4 still Future.
3. **Answered: build as answered, no provisional label.**
   - **D64 / OQ-25:** prepaid is the Contract's setting, placed by the office; nothing on the profile.
   - **D27 / OQ-92:** the prepay line always carries a price. No price-missing warning.
   - **D6 as superseded and D38 / OQ-80:** generated when an admin approves it, with its pair (to the
     prepay holding account) and draft Xero pair, then sent; never at setup; a move changes nothing.
     This replaces OQ-70's payee update on a move (D20): no phase builds a repoint.
   - **D23 / OQ-73:** always a person paying for the patient; the payer on the Booking prepays.
   - **D5 / OQ-57:** no block; a warning in both apps.
   - **D42 / OQ-91:** the office keeps the price lists; this phase only reads them.
   - **OQ-04, OQ-38, OQ-61, OQ-76:** no estimate, no contingency, no part payment, nothing invoiced or
     credited automatically afterwards. **OQ-48:** the version in force on the procedure date.
   If one has been reopened since `d4db277`, build the plan as written and put it first on "For the
   owner's review".
4. **Open: build the default, one code comment naming the question, log it.** If answered since
   `d4db277`, build the answer instead.
   - **OQ-96 (D30, wider since 19 October):** the price on a prepaid Procedure is locked at the
     prepaid amount for the anaesthetist and the office; any difference by hand. One branch in
     `anaesthetistMayChangePricing`, one in the office price guard (item 8), and one provisional
     caption on the locked price row (item 10).
   - **OQ-104 (D47; Donald 2026-10-20: the build assumes it):** a prepaid Procedure keeps the price on
     its issued invoice; a new Contract version does not relink it, and 25's dashboard lists it.
     Re-point 25's `PREPAID_KEEPS_PRICE` bucket to "has an issued prepayment invoice" (item 8). No
     caption.
   - **OQ-116 (D57):** keep the visible deduction line on a Booking that mixes prepaid and other
     Procedures; an all-prepaid Booking has nothing left to bill. One comment in the deduction. No
     caption.
   - **OQ-97** (part credit) is 41's. Build nothing for it.
   - **Readings settled here (log them, no caption):**
     - **Derived, never stored.** The trigger is the Procedure's Contract, which a move does not
       change, so the requirement is derived on every read (the 7th review B6 ruling stands again,
       20's interim retired). The issued invoice is the record of the price once approved.
     - **The payer.** The prepayment invoice is always addressed to the payer on the Booking (21:
       always a person), whatever the prepaid Contract's holder; 21's `isPersonParty` is the guard.
     - **A prepaid Procedure cannot be split.** 22's split entry refusal and `prepaidSplit` re-key from
       20's interim to `prepaymentForProcedure`.
     - **No line yet.** A Procedure on a prepaid Contract with no line picked lists as awaiting
       approval with Approve disabled ("Pick the Contract line first"); no warning rule.
     - **Unapproved at authorise.** Nothing was invoiced, so the Procedure is billed on the final
       invoice at its line's price.
     - **Cancelled after sending.** Not deducted; the status reads "no longer needed", for 41's
       refund from the holding account.
5. **Read what Phases 15a to 25 actually built** (their PROGRESS entries): 15a's `WarningFacts` and
   `prepaymentStatus`, the rule file and texts, `appSettings`, the clearance re-open rule,
   `WARNING_SAMPLES` and its prepayment sample; 18's `prepaid` setting and "in force on a date"; 19a's
   lines and Souter's price list and how its starting values fill the Procedure; 20's interim
   requirement, `prepaymentDetail`, its validator checks, `setProcedureContract` and Riley's and Nair's
   seeded lines; 20a's `pricingBasisFor`; 21's payer helpers and `setBookingPayer`; 22's
   `materialiseInvoices`, send step, `supplier`, Split and `prepaidSplit`; 24's `procedurePrice.ts`,
   `anaesthetistMayChangePricing` and the office price edit; 25's snapshot, relink buckets and
   `priceBookingFromLock`. Reuse what exists.
6. Record the result (including "no drift", the answers as built and the D30, D47 and D57 defaults)
   in the PROGRESS entry.

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
- **Catalogue:** the covered files above; for context FT-06.3, FT-06.4, FT-06.5, US-06.3.4,
  US-06.3.6, US-06.4.1, US-06.5.1, US-06.5.4, US-09.1.3, US-04.2.14, US-04.3.4, US-11.2.2, US-13.7.1
  to US-13.7.4; the questions OQ-96, OQ-97, OQ-104 and OQ-116 (open) and OQ-25, OQ-73, OQ-80, OQ-92,
  OQ-04, OQ-38, OQ-48, OQ-57, OQ-61, OQ-70, OQ-76 and OQ-91 (answered); and
  `requirements-board/requirements/domain-model.md` (the prepayment rows, Booking, Contract, Internal
  ledger, Warnings and the Prepayment paragraph). Evidence (cited passages only,
  `npm --prefix requirements-board run source -- --item <ID> --text`, Node 22.18 or newer): notes
  2026-10-16 "AA meeting with Greg" (#20, #22, #25, #34), 2026-10-16 "Pricing model documents v6"
  (#4, #19, #28) and 2026-10-19 "AA meeting with Greg" (#4, #15).
- **Pricing model (v6):** [AR-28#prepayment](../../../../requirements-board/requirements/artifacts/AR-28.md);
  [AR-29](../../../../requirements-board/requirements/artifacts/AR-29.md) regions `prepayment`,
  `price-validation`, `pricing-snapshot`, `contract-behaviour`;
  [AR-30#booking-procedure](../../../../requirements-board/requirements/artifacts/AR-30.md); the
  billing flow [AR-24](../../../../requirements-board/requirements/artifacts/AR-24.md) regions
  `prepayment-check`, `prepayment-invoicing`, `prepayment-pair`, `prepayment-payment`,
  `prepayment-recheck`, `prepayment-move` and `remaining-amount` (`prepayment-settlement` is 27a's).
- **Gap analysis:** `GAP-ANALYSIS.md` (theme 6 "Prepayment replaced", "Things to remove or rework",
  "Demo impact" S4, the DM-20 and RV-05 rows); `epics/EP-06.md`, `epics/EP-03.md` (US-03.1.8),
  `epics/EP-08.md` (FT-08.1, US-08.2.2); `gaps.json` for the covered IDs;
  `analysis/domain-model-delta.md` (DM-20, DM-21, DM-07); `analysis/reverse-check.md` (RV-05).
- **Code entry points** (line numbers as the gap analysis cites them; shifted by 15b to 25):
  - `src/domain/types.ts`: `PatientPaymentCategory` 794 and `PrepaymentDetail` 804 (20 removes the
    category), `Procedure.prepaymentDetail` 848, `Invoice` (`kind: 'standard' | 'prePayment'`),
    `InvoiceLine`, `BillingCase`, `XeroAccRec`, `XeroAccPay`. 15a's `WarningFacts` live in
    `src/domain/warnings/types.ts`.
  - `src/domain/billing/`: `invoiceBuild.ts` (the deduction and `prepaidCounterpartyChanged` about 296
    to 345, "Less pre-payment deposit already invoiced" about 390, `negativeTotal` about 417,
    `buildPrePaymentInvoiceForBooking` 456 to 521); 24's `procedurePrice.ts`;
    `validateBookingForBilling.ts` (204 to 221, the full or split checks); `prePaymentInvoice.test.ts`.
  - `src/domain/warnings/`: `types.ts`, `routine.ts`, `rules/prepaymentUnpaid.ts`, `rules/index.ts`.
  - `src/store/`: `prepaymentActions.ts` (`raisePreProcedureInvoice` 52 to 170); `selectors.ts`
    (`bookingRequiresPrepayment` 574, `prePaidByProcedure` 612, `prepaymentStatusFor` 639);
    `billingRun.ts` (69 to 105); `paymentActions.ts` (`receivePayment`, the payable release 99 to
    110); `xeroHandoff.ts` (`handoffCase`, the ACCPAY contact 194 to 221, `handoffCasesForBooking`);
    the payables run; `listMoveActions.ts` (17 to 19, 141 to 143: the stale payee-repoint comments);
    `clockActions.ts` (`advanceClockToDate`); 15a's `warnings.ts` and `warningSamples.ts`;
    `officeStandIn.ts`; `prepayment.test.ts`, `paymentActions.test.ts`, `seedBilling.test.ts`,
    `demoScenarios.test.ts`.
  - `src/shared/booking/BookingDetailBody.tsx` (the prepayment rows 426 to 511,
    `data-shot="booking-prepayment"`, the raise button); `src/shared/capture/` (`BtmCaptureBlock.tsx`,
    `UnitsCard.tsx`, `BookingTotalPanel.tsx`); 20a's stack; `src/shared/flows/EditBillingSetupSheet.tsx`;
    `src/shared/audit/` (`actionLabels.ts`, `fieldLabels.ts`, `auditNarrative.ts`);
    `src/shared/demoTriggers/`; `src/domain/dateDays.ts` (`daysBetween`).
  - `src/apps/admin/`: `components/RightRail.tsx`, `components/DayGrid.tsx`, `outlet.ts`,
    `reviewFlags.ts`, `screens/InvoicesScreen.tsx`, `screens/InvoiceDocument.tsx` (the deposit and
    estimate wording about 496 to 530), `screens/BillingMonitorScreen.tsx`.
  - `src/apps/demo/DemoXero.tsx`, `xeroPairView.ts`, `DemoControlPanel.tsx` (the S4 scenario text).
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
   and DRAFT ACCPAY fields, the link between them). S3, S4 Beat 3 and S5 must not move. The
   deliberate changes, re-pinned in item 9 with the reason, are Riley's and Nair's prepayment
   figures, the ACCPAY contact (now "Prepay holding account") and Souter's payables due (Nair's
   prepayment payable is held, not paid out, until 27a). Never update a fixture with `-u`.
2. **Types** (`domain/types.ts`; DM-20):
   - Delete `PrepaymentDetail`, `Procedure.prepaymentDetail` and 20's interim fields and comments.
     Nothing can hold a deposit, a split amount or a typed prepaid amount. No `Booking.prepayment`
     record: the requirement is derived (drift check 4).
   - A prepayment `Invoice` gains `approval: { by: string; role: ActorRole; atISO: IsoDateTime }`;
     each of its `InvoiceLine`s carries `procedureId`, `contractId`, the version id and `lineId`, so
     the issued price (D47) and the re-check read the invoice.
   - The payable side (`XeroAccPay`, and `BillingCase`'s payable) gains a payee that is an
     anaesthetist or the holding account: `PREPAY_HOLDING_ACCOUNT`, one constant with the Xero contact
     "Prepay holding account", in the shape 27a and 36 extend. `xeroPairView.ts` shows it.
   - No estimate, contingency, excess record, held or withdrawn invoice state, or draft ACCREC status.
3. **The pure rules** (`domain/billing/prepayment.ts`, exported from the billing index, with
   `prepayment.test.ts`; US-06.2.1, US-06.2.2, FT-06.2; AR-29#prepayment):
   - `prepaidProceduresFor(booking, procedures, contracts, dateISO)`: every non-cancelled Procedure
     whose Contract's version in force on the procedure date has 18's `prepaid` on. The whole
     Booking, not just the primary (the hospital Booking with a cosmetic add-on is the typical case).
   - `prepaidAmountFor(procedure, contracts, dateISO)` (D27 answered): `{ kind: 'priced', contractId,
     versionId, lineId, description, amount }` from the line's fixed price (ex GST), or `{ kind:
     'noLine' }`. Never an estimate, the RVG, a unit value or a typed price.
   - `prepaymentState(derived, issuedInvoices, payer)`: `none`; `awaitingApproval` (required, nothing
     issued; `ready` false on `noLine`); or `issued` with `match`, `notNeeded` (no longer on a prepaid
     Contract, or cancelled) or `changedAfterSending` (its Procedures, Contract or payer differ from
     the invoice's lines and addressee). An issued invoice is never rewritten.
   - Tests: a Procedure on Souter's prepaid list is required; on a Contract not flagged prepaid it is
     not; Nair (hospital-funded first Procedure plus a prepaid second) gives one prepaid Procedure;
     cancelled never counts; `noLine`; the version in force on the procedure date; each state.
4. **Status and selectors** (`selectors.ts`, tests in a rewritten `src/store/prepayment.test.ts`;
   US-06.3.2, US-06.3.4, US-06.3.5):
   - `prepaymentStatusFor(state, bookingId)` returns `{ status, amount, invoiceIds, invoicedTotal,
     receivedTotal, ready }` with status `none`, `awaitingApproval`, `unpaid`, `partPaid` (received
     above zero and below the invoiced total), `paid` (mirror money, as `paidPrePaymentCaseForBooking`
     reads today), `notNeeded` or `changedAfterSending`. A receipt re-checks it with no hook (US-06.3.4).
   - `bookingRequiresPrepayment` reads it; `prepaymentForProcedure(state, procedureId)` is the one
     selector answering "is this Procedure prepaid, at what amount, on which invoice, paid or not" for
     the panel, the units row, 20a's stack, 24's lock, 25's relink and the run.
   - `pendingPrepayments(state)`: every `awaitingApproval` Booking on a List not yet AUTHORISED, by
     date. `upcomingPrepayments(state)`: every prepaid Booking on such a List with its status and days
     to go from the demo clock.
   - **The re-check is the derivation** (US-06.3.5): a change of Procedures, Contract (including 25's
     relink) or payer changes the status at once; nothing to call. `setProcedureContract`,
     `setBookingPayer` and the procedure edit return the status change for item 10's one-line
     confirmation. No move path reads or writes anything here; delete the stale payee-repoint comments
     in `listMoveActions.ts`. Test: a reassign leaves the status, amount, invoice and pair identical.
   - **Remove** `raisePreProcedureInvoice`'s public export and the office's raise button, 20's interim
     requirement and its prepayment row or sheet, the validator's full or split checks; re-key 22's
     split refusal and `prepaidSplit` to `prepaymentForProcedure`. Completion never validates
     prepayment (D5). Re-point 15a's `facts.prepaymentStatus` to this status.
5. **Approve and send** (`approvePrepayment(api, actor, bookingId)` in `prepaymentActions.ts`;
   US-06.3.1, FT-08.1; OQ-80 answered, D38):
   - Office only; refused unless the status is `awaitingApproval` and `ready`, and on a cancelled
     Booking or an AUTHORISED or billed List.
   - One `mutate()`, through the internal `generatePrepaymentInvoice` (the one place the pair is
     created; comment naming OQ-80): `buildPrePaymentInvoiceForBooking` reads `prepaidProceduresFor`,
     one line per prepaid Procedure (the line's description, "Prepaid amount", its fixed price ex
     GST), addressed to the payer on the Booking, patient layout, GST by 22's rule; 22's
     `materialiseInvoices` with `approval` stamped; the `BillingCase` and `handoffCase`: an ACCREC to
     the payer and a DRAFT ACCPAY to `PREPAY_HOLDING_ACCOUNT`; then 22's send step
     (`deliveryPlanFor`) at the clock time. Audited `invoice.prePaymentApproved` plus 22's
     `invoice.sent` or `invoice.portalQueued`.
   - A receipt authorises the ACCPAY pro rata as today; the payables run (and its due list) skips
     every payable to the holding account (27a releases it with the second pair).
   - Submit never invoices it again (US-06.3.1 AC5).
   - Tests: office approves once and the invoice, pair and send exist; the anaesthetist is refused;
     a second approve is refused; `noLine` is refused; half a payment reads `partPaid`; the pair
     equals item 1's shape with the holding-account contact; the payables run pays nothing to it.
6. **The prepaid amount for the anaesthetist** (US-03.1.8): `prepaymentForProcedure` gives the amount
   (the issued invoice's line once approved, else the Contract line's) and the status. Re-point 20a's
   `pricingBasisFor` so a prepaid Procedure reads "Prepaid amount $1,200.00" with its status. The
   surfaces are item 10's.
7. **The warnings** (15a's routine; US-06.3.2, US-13.7.1, D5):
   - Widen `WarningFacts.prepaymentStatus` to item 4's result and `store/warnings.ts`'s slice to what
     it needs; update the components that memoise on it.
   - **`prepaymentUnpaid` escalates by date.** One finding while the status is `awaitingApproval`,
     `unpaid` or `partPaid` and the List is not AUTHORISED: `daysToGo = daysBetween(todayISO,
     listDateISO)`; **mild** at `<= mildWithinDays` (7), **strong** at `<= strongWithinDays` (2),
     including the day and a passed date; nothing further out. Seed both in `defaultParams` (15a's
     backfill carries them; pin it). The same rule raises one mild finding for `notNeeded` and
     `changedAfterSending`, whatever the date. No `prepaidPriceMissing` rule (D27 answered).
   - Texts (no en or em dash): `awaitingApproval` "Prepayment of {amount} is awaiting approval on
     Invoices and has not been sent."; `unpaid` "Prepayment invoice {number} unpaid. Check with the
     patient before surgery starts."; `partPaid` "Prepayment part paid, {x} of {y} received. Check
     with the patient before surgery starts."; `notNeeded` "Prepayment invoice {number} was sent, but
     this Booking no longer needs prepayment. Credit it by hand if needed."; `changedAfterSending`
     "Prepayment invoice {number} was sent before this Booking changed. Check the amount; correct it
     by hand if needed."
   - A cleared mild warning re-opens when strong (15a's rule); nothing ever blocks.
   - **Samples** (`warningSamples.ts`): re-point the prepayment sample to a Dr Souter Booking within
     the mild window set, through audited store actions, to her prepay price list's Rhinoplasty line
     with the patient paying (`awaitingApproval`). Unstage restores the seed.
   - Tests: thresholds at 8, 7, 3, 2, 0 and -1 days; each text; params move the windows; seeded Riley
     mild on Tue 21 Jul; strong after `advanceClockToDate('2026-07-22')`.
8. **Pricing at the prepaid amount and the deduction** (24's `procedurePrice.ts`, `invoiceBuild.ts`,
   `billingRun.ts`, 25's relink and snapshot; US-06.4.1's pricing criteria, US-08.2.2):
   - **The price.** A prepaid Procedure's held price is the prepaid amount (24's rule: a held price is
     the price, BTM for reference). Once issued it is the invoice line's amount; 25's snapshot
     records it.
   - **Kept through a Contract change (D47, OQ-104's default):** 25's `PREPAID_KEEPS_PRICE` bucket
     reads `prepaymentForProcedure` (an issued prepayment invoice): not relinked, listed on the
     dashboard. Before issue the relink refreshes it like any Procedure.
   - **Locked (D30, OQ-96's default, one comment each):** `anaesthetistMayChangePricing` returns false
     while `prepaymentForProcedure` reports a prepayment, and the office price edit refuses ("This
     procedure is prepaid; its price is the prepaid amount. Raise an additional invoice or a credit
     note for any difference.").
   - **The deduction (D57, OQ-116's default):** `prePaidByProcedure` counts issued prepayment invoices
     with id and number; the line reads "Less prepayment already invoiced, {number}" (the "deposit"
     wording goes), GST matching under 22's rule. A group netted to $0 raises no invoice (24's rule);
     the run records `settledByPrepayment: { procedureIds, prepaymentInvoiceIds }` on the Booking's
     result, audited `booking.prepaidSettled`, and the Booking reads billed (27a's second pair reads
     it). A mixed group invoices the unprepaid Procedure with the prepaid one's price and the
     deduction both shown.
   - **Unapproved at authorise:** billed on the final invoice at its line's price; it leaves the
     Awaiting approval list.
   - **Kept guards.** `prepaidCounterpartyChanged` stays for an issued prepayment now billed to
     another party. `negativeTotal` stays for every other negative; no excess path, no balance
     invoice, no credit.
   - Tests: an issued prepayment prices the Procedure at its amount whatever the BTM, no invoice
     raised for it; a new Contract version leaves it; a mixed group shows the deduction; unapproved at
     authorise bills the line's price; the lock refuses in the store; "Regenerate from locked data"
     reproduces the settled result.
9. **Seed** (`seed/bookings.ts`, `billing.ts`; bump `PERSIST_VERSION` by one):
   - **Riley** (Souter Fri 24 AM, `SEED_MARKERS.prepaymentBooking`): on Dr Souter's prepay price list's
     Rhinoplasty line (20), `prepaymentDetail` gone, the patient paying. Status `awaitingApproval` at
     $1,200.00 ex GST, mild warning on Tue 21 Jul (3 days out), no invoice. S4 Beat 1 approves it.
   - **Nair** (Souter Fri 24 PM, `SEED_PREPAID_BOOKING_ID`): the rhinoplasty on the price list's
     Rhinoplasty $1,200 line (replacing any demo line 20 added); the septoplasty stays on Forte's
     Contract. INV0001/BC0001 at $1,200.00 ex GST, `approval` by "Kirsty W." a few days before the
     demo date, sent and paid; the ACCPAY to the holding account, not disbursed. Authorising Fri 24
     PM raises Forte's septoplasty invoice unchanged and nothing for Nair.
   - Coherence test: the Bookings with a prepayment on Lists not yet AUTHORISED are exactly Riley and
     Nair; no other seeded Procedure sits on a prepaid Contract; no billed Booking reads outstanding.
     INV0001 stays Nair's, so S3's runtime numbers hold. Never change the filler's `rng()` draw order.
   - Update `seedBilling.test.ts`, `demoScenarios.test.ts` and the markers' comments; re-pin item 1's
     deliberate figures with the reason ("prepaid amount is the prepay Contract line's price; payable
     to the holding account, Phase 27").
   - **Session 1 exit:** UI edited only as far as compiling needs; `npm run build`, `npm run build:pwa`
     and `npx vitest run` green with item 1 passing; a "session 1 done" note in PROGRESS.

**Session 2: surfaces, triggers, demo.**

10. **The Booking prepayment panel and the units row** (a `PrepaymentPanel` in `src/shared/booking/`,
    all three apps through `useSurface()`; US-06.2.2, US-06.3.2, US-03.1.8, D30):
    - Title by status, as a semantic tint: "Pre-payment awaiting approval"; "Pre-payment unpaid";
      "Pre-payment part paid · $x of $y received"; "Pre-payment received"; "Pre-payment no longer
      needed"; "Pre-payment sent before a change". Amounts in mono, tabular-nums.
    - Body: one mono row per prepaid Procedure (the line, its fixed price, the Contract "Dr M. Souter,
      prepay price list"); who pays (the payer by name); the prepaid amount; the invoice number with a
      link (office). The warning stays in 15a's `WarningsPanel` above, not repeated.
    - **The office** sees, on `awaitingApproval`, a teal link "Approve on Invoices" to item 11's strip
      (or "Pick the Contract line first" opening 20's picker on `noLine`). Nobody types an amount.
    - **The anaesthetist** sees it read-only: the amount and whether it is paid.
    - **Where units are recorded** (`BtmCaptureBlock`, mobile and web): a compact row
      `data-shot="capture-prepaid"`, "Prepaid $1,200.00 · paid" (or its status); 24's price card reads
      "Prepaid amount, locked" with the one **"Provisional (OQ-96)"** caption and no price field.
    - The re-check is visible (US-06.3.5): the Contract picker's, payer sheet's and procedure edit's
      confirmations append one line when the status changes ("Pre-payment now needed: awaiting
      approval", "Pre-payment no longer needed", "Pre-payment invoice sent before this change"). A
      reassign shows none.
    - Delete the "RFP open question" and "discovery point" copy. Keep `data-shot="booking-prepayment"`.
11. **Admin surfaces** (US-06.3.1, US-06.3.2):
    - **Invoices screen:** an "Awaiting approval" strip above the table, one row per
      `pendingPrepayments` entry (patient, anaesthetist, procedure date, payer, amount, Contract) with
      a teal **Approve and send** (disabled "Pick the Contract line first" when not ready); the
      confirmation names the invoice, where it went and the holding-account pair.
      `data-shot="invoices-awaiting-approval"`.
    - **Right rail:** a "Pre-payments" card under 15a's To-do card, fed by `upcomingPrepayments`:
      patient, `drSurname`, "In 3 days", the amount, a status pill; an awaiting row links to the strip,
      others open the Booking. Empty state "No upcoming pre-payments." `data-shot="rail-prepayments"`.
    - **Billing monitor and the admin Booking billing panel:** a settled Booking shows "Prepaid in
      full, nothing to bill ({number})", never an exception.
    - **Xero sim:** the prepayment ACCPAY's contact reads "Prepay holding account".
    - The day grid needs no new signal: 15a's triangle carries the warning.
12. **Invoice wording, the review chip and audit labels:**
    - The prepayment invoice's note: "This invoice is the prepaid amount for the procedure. It is the
      price for the anaesthetic." No "estimate", "deposit" or "may be higher or lower" (the letters
      are 41's). Remove the deposit, estimated-fee and discovery-point sentences, here and in the
      `prepaymentActions.ts` module comment.
    - Review chips (`reviewFlags.ts`): "Pre-payment sent, no longer needed" and "Pre-payment sent
      before a change" (warning tint), "Prepaid amount" on a prepaid Procedure's price cell (neutral).
    - Audit labels: `invoice.prePaymentApproved` "Pre-payment invoice approved and sent",
      `booking.prepaidSettled` "Prepaid in full, nothing to bill"; an `approval` narrative formatter.
      Drop the `prepaymentDetail` formatter, its test and 20's interim label.
13. **Demo triggers** (the registry in `src/shared/demoTriggers/registry.ts`; bodies in `src/shared` or
    `src/store`, the office stand-in beside `authoriseAsSimulatedOffice` in `src/store/officeStandIn.ts`,
    so `pwaPurity` holds). See "Demo triggers" below. Registry tests: visibility per route; disabled
    reasons; the clock jump never rewinds; "Add prepaid Booking" creates one Booking awaiting approval;
    the stand-in approves exactly one. Never add anything to the Control Panel page; update its S4
    scenario text (`DemoControlPanel.tsx`).
14. **Shots:** update `admin-phase09.spec.ts`, `admin-phase08.spec.ts` and `warnings.spec.ts` for the
    panel, the rail card, the approval strip and the mild-then-strong triangle; add a mobile shot of
    the panel and units row on Nair (paid) and a PWA shot of the stand-in. Run
    `node requirements-board/scripts/capture.ts --only US-06.2.1,US-06.2.2,US-06.3.1,US-06.3.2,US-06.3.4,US-06.3.5,US-06.4.1,US-08.2.2 --dry`
    to see what breaks; fixing it is the "Catalogue screenshots" step. Never edit a requirement.
15. **Demo guide** (below), in the same session.

## Demo triggers

Harness bar (framed build):

| Label | Screen | Surface | Effect |
|---|---|---|---|
| Move to 2 days before procedure | Admin · Day (`/admin/day/:dateISO`) and Admin · Booking detail (`/admin/day/:dateISO/bookings/:bookingId`) | bar | On the Booking detail it acts on that Booking; on the Day view `choices` lists the outstanding prepayments (awaiting approval, unpaid, part paid) from `upcomingPrepayments`, earliest first. Calls `advanceClockToDate(api, procedureDate - 2 days)`: the warning turns strong and a cleared mild one re-opens. Disabled with "No outstanding pre-payments" or "Already 2 days or less before". Forward only; Reset restores |
| Add prepaid Booking | Admin · Day and Admin · Booking detail | bar | As the office stand-in, creates a Booking on Dr Souter's next ACTIVE List for a seed demo patient, the patient paying, with one Procedure on her prepay price list's Rhinoplasty line. It appears "Awaiting approval" at $1,200.00 on the Invoices strip and the rail card. Disabled with "No ACTIVE List for Dr Souter" or "Already added (Reset to repeat)" |
| Payment received · half / full (re-pointed) | Admin · Booking detail, plus Phase 14's invoice and Xero routes | bar | `choices` are that Booking's sent prepayment ACCRECs. Half shows "Part paid · $690.00 of $1,380.00 received" (use 22's GST total) on the panel, rail and warning; full shows "Pre-payment received" and the warning goes. Disabled with "Not approved yet" while awaiting approval. Same bodies and idempotency keys |
| Raise sample warnings (15a, shared) | Admin · Day | bar | Its prepayment sample is re-pointed to Souter's prepay price list (awaiting approval) |

**Approve and send** is a product button on the Invoices strip, not a trigger.

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

- The prepay holding account itself (its balance, entries and Admin card) and the second pair at
  authorisation paying whoever did the List (DM-21, FT-06.5, US-06.5.1, US-09.1.3's settlement):
  Phase 27a, straight after. This phase only names the payee and keeps the payables run off it.
- Prepayment letters and reminders (US-06.3.6; the letter joins Approve and send in 41); refund from
  the holding account on cancellation, a fresh prepayment on rebooking, and by-hand additional
  invoices and credit notes on a prepaid Procedure, a part credit (OQ-97): Phases 38b, 39 and 41.
- Any payee repoint on a move: none is built by any phase (D38). Anything on a move (28, 31, 32, 32a).
- The ledger legs behind prepayment status: Phase 36.
- A switch to turn the approval step off, or a settings page for the warning windows (US-13.7.4,
  Future). The unpaid-balance warning at booking (Phase 40).
- No estimate, deposit, partial prepayment, price-missing warning, balance invoice, automatic credit
  or excess record is built, anywhere.

## Manual test checklist

The agent runs every item itself in the running app and reports it with evidence; none is handed
to the owner (ROADMAP.md "Owner review: agents test themselves").

- [ ] Reset. Admin Day, Tue 21 Jul: the "Pre-payments" card lists Annette Riley (Souter, Fri 24 Jul,
      "Awaiting approval", $1,200.00, "In 3 days") and Priya Nair as paid. The To-do card shows Riley's
      mild warning; the Fri 24 AM block carries the amber triangle.
- [ ] Admin Booking detail for Riley: the panel names Rhinoplasty on "Dr M. Souter, prepay price
      list" at $1,200.00 and the patient paying, with "Approve on Invoices"; no amount input, deposit,
      estimate or raise button anywhere. No invoice exists yet.
- [ ] Invoices: the "Awaiting approval" strip lists Riley. "Payment received · half" on her Booking is
      disabled ("Not approved yet").
- [ ] Approve and send: one invoice is generated and sent to the invoice email; the audit shows
      `invoice.prePaymentApproved` by the office user; the Xero sim shows the ACCREC to the patient and
      a draft ACCPAY to "Prepay holding account"; the status reads "Pre-payment unpaid"; Riley leaves
      the strip.
- [ ] "Payment received · half": panel, rail row and warning read part paid. Replay is idempotent.
      Run payables pays nothing to the holding account.
- [ ] Mobile, Souter Fri 24 AM, Riley: the triangle, the warning on opening, "Prepaid $1,200.00 · part
      paid" read-only on the Booking and in the units block; the price card reads "Prepaid amount,
      locked". Complete and submit with no confirm step: nothing blocks, no second invoice.
- [ ] Clear Riley's mild warning, then "Move to 2 days before procedure": Wed 22 Jul, strong on Admin
      and mobile.
- [ ] Re-check: "Add prepaid Booking" lists a new Booking awaiting approval. Change its Procedure's
      Contract to one not flagged prepaid: it leaves the strip and the confirmation says "Pre-payment
      no longer needed" (US-06.3.5 AC1). Back on the price list, a guardian as payer is named on the
      panel. A split on the prepaid Procedure is refused.
- [ ] Price kept (D47): on Riley (sent), save a new version of Dr Souter's price list with Rhinoplasty
      at a new price: Riley keeps $1,200.00 and the dashboard lists her as prepaid; the new Booking
      (unapproved) follows the new price.
- [ ] Move: reassign Riley (sent) to a colleague: no confirmation line, the amount, invoice, status
      and pair unchanged, no new invoice. Run this before the next item.
- [ ] Sent then changed: on Riley, change the rhinoplasty to a Contract not flagged prepaid: nothing
      is rewritten on the invoice, the status reads "Pre-payment no longer needed", and the review chip
      and the mild office warning show.
- [ ] Lock (D30): on a prepaid Procedure the anaesthetist has no price field and the office price
      edit is refused with the by-hand message.
- [ ] Authorise Souter Fri 24 PM (Nair): Forte's septoplasty invoice unchanged; nothing raised for
      Nair; "Prepaid in full, nothing to bill (AA-2026-0001)"; the rhinoplasty priced at the prepaid
      amount with its BTM shown for reference.
- [ ] Unapproved at authorise: authorise a List with a Booking still awaiting approval: its Procedure
      is billed on the final invoice at the line's price and it leaves the strip.
- [ ] S3, S4 Beat 3 and S5 figures unchanged (item 1); the pair shape matches the pinned one with the
      holding-account contact.
- [ ] No "estimate", "deposit", "discovery point" or "RFP open question" on any prepayment surface; the
      only provisional caption is OQ-96's.
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
    the patient paying. Invoices: the "Awaiting approval" strip, **Approve and send**; optionally the
    Xero sim pair (to the patient, and to the Prepay holding account). Payment received · half: part
    paid. Mobile, Souter Fri 24 AM, Riley: the triangle, the warning, "Prepaid $1,200.00 · part paid"
    on the Booking and in the units block; complete and submit, no confirm step.
  - **Say:** "The office set this procedure up on Dr Souter's own price list, which is flagged as
    prepaid, so the Booking needs prepayment. The amount is her price for the procedure, in full; not
    an estimate. Nothing is invoiced until we approve it here; approving generates the invoice, sends
    it to the patient, and books the money to a prepay holding account, not to Dr Souter. Nothing
    blocks: the warning is the control, and it gets stronger as the day approaches. After the
    procedure the prepaid amount is the price; nothing more is invoiced or credited automatically. If
    the Booking moves to a colleague, nothing changes in the books."
  - **Expected:** awaiting approval, then the sent invoice with its pair to the holding account, part
    paid on all three surfaces, and a submit that goes through.
- **S4 new closing Beat 6, "The date approaches"** ("Move to 2 days before procedure" on Admin Day,
  after clearing Riley's mild warning). It sits last so Beats 2 to 5 run on the seeded date; if Beat 2
  loses its ACTIVE today List after a jump, keep the jump last and say so in Stage it.
- S4 "Discovery points": "whether the price on a prepaid procedure can change (OQ-96)", "a prepaid
  price when the Contract changes (OQ-104)" and "mixed Bookings and the deduction (OQ-116)". Drop any
  gate, deposit, estimate, missing-price, setup-generation or move point (say them as facts).
- `04-presenter-cheat-sheet.md` section 8 "Pre-payment": rewritten to the trigger (a Contract flagged
  prepaid, picked by the office), the amount (the line's price, in full), approve and send with the
  holding account, the escalating warning (D5), nothing automatic afterwards, a move changes nothing.
  Drop "come later (catch-up Phase 27)".
- `02-workflows-and-handoffs.md` "Pre-payment" case and its status row: the same rewrite.
- `docs/demo-guide/README.md` status row and the master guide's status table: "Pre-payment from a
  prepaid Contract: approve and send, holding account, escalating warning".
- The Control Panel S4 scenario text (item 13).
- **Milestone:** end with a consistency read of `master-demo-guide.html` against the edited Markdown:
  S4 beat numbering, figures and trigger labels agree.

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19),
run after the review pass and before the PROGRESS.md entry. Re-run
`node requirements-board/agent/skills/update-build-plan/tools/recipe-status.mjs 27` first. Stage the strip and the sent
invoice with real clicks (Approve and send is a product control), and a payment or the clock jump
with the runner's `trigger` step after a `goto` to the entry's screen. The Control Panel has no
payment buttons. Replace every stale caption (an estimated fee, a deposit, a balance invoice, a
payment category, a payable to the anaesthetist).

| Item | Recipe now | When this phase is done |
|---|---|---|
| [US-06.2.1](../../../../requirements-board/requirements/stories/US-06.2.1.md) | partial · mobile-prepayment-flag, web-prepayment-flag | captured. Riley's panel on mobile, web and admin, highlight `[data-shot=booking-prepayment]`, plus a Nair state (the prepaid second Procedure found across the Booking). Caption: "A Booking needs prepayment when a Procedure is on a Contract flagged prepaid". |
| [US-06.2.2](../../../../requirements-board/requirements/stories/US-06.2.2.md) | partial · admin-deposit-invoice, admin-full-fee-invoice | captured. Delete `deposit-invoice`; `full-fee-invoice` at `/admin/invoices/INV0001` captioned "Prepayment invoice for the prepay Contract line's price, in full"; add admin `prepaid-amount` (Riley's panel, the line row, no amount input). |
| [US-06.3.1](../../../../requirements-board/requirements/stories/US-06.3.1.md) | captured · admin-raise-prepayment-invoice, admin-prepayment-invoice, simulator-prepayment-xero-pair | captured. Rename `raise-prepayment-invoice` to `approve-and-send`, states `awaiting-approval` (the Invoices strip) and `sent`; keep `prepayment-invoice`; `prepayment-xero-pair` shows the payable to "Prepay holding account". Caption: "Generated when an admin approves it, with its pair to the prepay holding account". |
| [US-06.3.2](../../../../requirements-board/requirements/stories/US-06.3.2.md) | partial · admin-day-grid-flag, admin-card-status | captured. `day-grid-flag` on 15a's triangle; `card-status` states `awaiting-approval`, `unpaid`, `part-paid`, `received`; add `rail-prepayments`, a mobile Riley shot, and `strong` after the `prepayment-two-days-before` trigger. Caption: "Prepayment status per upcoming Booking, with a warning that strengthens as the date nears". |
| [US-06.3.5](../../../../requirements-board/requirements/stories/US-06.3.5.md) | partial · admin-recheck-on-change | captured. `recheck-on-change` states `before` (awaiting approval) and `after` (Contract changed to one not flagged prepaid: off the strip, "no longer needed"); add `moved` (Riley sent, reassigned: unchanged). Captions: "Contract no longer prepaid: prepayment cleared" and "A move changes nothing". |
| [US-03.1.8](../../../../requirements-board/requirements/stories/US-03.1.8.md) | none | Create, captured. Mobile and web, Nair (paid): `booking` (highlight `[data-shot=booking-prepayment]`) and `units` (`[data-shot=capture-prepaid]`). Caption: "The anaesthetist sees the prepaid amount on the Booking and when recording units". |
| [US-08.2.2](../../../../requirements-board/requirements/stories/US-08.2.2.md) | captured · admin-deposit-invoice, admin-balance-invoice | captured. Delete `deposit-invoice`; rename `balance-invoice` to `nothing-to-bill` (authorise Souter Fri 24 PM: "Prepaid in full, nothing to bill (AA-2026-0001)" beside Forte's septoplasty). Caption: "The prepayment is deducted: a prepaid Procedure leaves nothing to bill". |
| [FT-06.2](../../../../requirements-board/requirements/stories/FT-06.2.md) | none | Create, captured: admin Riley panel (trigger and amount from the prepaid Contract). Caption: "A prepaid Contract starts prepayment at its line's price". |
| [FT-08.1](../../../../requirements-board/requirements/stories/FT-08.1.md) | none | Create, captured: the Invoices "Awaiting approval" strip. Caption: "The one invoice before AUTHORISED: a prepayment, generated on approval". |
| [EP-06](../../../../requirements-board/requirements/stories/EP-06.md) | none | No recipe (epics carry none); its stories' shots cover it. |
| US-06.3.4 | captured · admin-recheck-after-payment | Re-stage only: Approve and send on the strip, then `payment-half` / `payment-full`, not the Raise button. |
| US-06.4.1 | captured · admin-balance-invoice | No change here beyond the break (Phase 41 owns it): rename to `prepaid-price` (Nair priced at the prepaid amount, nothing to bill). |
| US-06.1.1, US-06.1.2 | absent | Retired (D64): keep `absent`, reason "Retired: prepaid is a Contract setting". |
| US-06.3.6, US-06.5.2 to US-06.5.4 | absent | No change here (Phase 41 owns them). |
| US-06.5.1 | absent | No change here (Phase 27a owns it). |
| US-08.1.1 | captured | No change here; add a Nair state to `billing-run` only if it still passes `--dry`. |
| [US-06.5.3](../../../../requirements-board/requirements/stories/US-06.5.3.md) | see Phase 41 | no change here (Phase 41 owns it) |

**Recipes this phase breaks.** Every recipe that clicks "Raise pre-procedure invoice" (`US-09.2.1`,
`US-09.2.3`, `US-09.2.4`, `US-09.3.4` and the covered ones): replace the click with Approve and send on
Riley's strip row, keeping each shot `name`, amounts now $1,200.00 plus GST. `daygrid-block-prepayment`
leftovers: re-point to 15a's triangle or open Riley by URL. Retired items' recipes (`US-06.2.3` to
`US-06.2.5`, `US-06.4.2`, `US-06.3.3` if it still shows a gate) get `status: absent` with the reason.
`INV0001` and `XRB0` recipes (`US-05.2.7`, `US-08.4.1`, `US-09.1.1`, `US-08.3.1`, `US-09.1.3`,
`US-10.1.1`, `US-10.3.1`, `US-15.0.6`): Nair's prepayment is $1,200.00 ex GST and its ACCPAY is to the
holding account; check amounts and payees in captions.

**ATLAS.md.** Seed: Riley awaiting approval, Nair's paid INV0001 at the price list's price with its
payable to the holding account. Hooks: keep `booking-prepayment`; add `capture-prepaid`,
`rail-prepayments`, `invoices-awaiting-approval`. The S4 scenario text, and "Demo actions by screen"
gains `prepayment-two-days-before`, `add-prepaid-booking`, the payment entries on the Booking detail,
and `pwa-office-approves-prepayment`.

## Adversarial review (after build)

After the manual test checklist and the four commands are green, and before writing the PROGRESS
entry, run the standard adversarial review-and-fix pass (PROGRESS convention 18). Fan out
independent Opus review subagents: quality, bugs/correctness and plan adherence, plus a fourth,
money lens for this money phase. Then this session verifies every finding against the catalogue, this
plan and the code, fixes the confirmed ones, re-greens, and records the pass. Do not re-raise
anything settled in the Decisions log except the rulings this phase explicitly supersedes.

**Steer this phase's reviewers at:**

- **Derivation.** Only a Contract flagged prepaid (18's setting, the version in force) triggers it;
  nothing reads a payment category, the profile or 20's interim. Every Procedure on the Booking
  counts; cancelled ones never; the invoice is addressed to the payer on the Booking.
- **The amount.** Only the prepaid Contract line's fixed price, through `prepaidAmountFor`. No
  estimate, unit value, RVG, deposit, typed or partial amount anywhere, and no price-missing warning.
- **Approval and the pair (D38, FT-08.1).** Nothing is generated before an admin approves; the pair
  is created once, in `generatePrepaymentInvoice`, its payable to the holding account; the payables
  run never pays it; submit never invoices it again.
- **No move logic.** No reassign or move path touches the status, invoice or pair; no payee repoint.
- **Pricing and money.** An issued prepayment prices its Procedure at its amount, kept through a new
  Contract version (D47) and locked (D30, store); the deduction nets it to zero (D57's line on a
  mixed Booking); no balance invoice, credit or excess. Prepaid plus anything invoiced equals the
  priced fees (GST included). `negativeTotal` and `prepaidCounterpartyChanged` still fire.
- **Status and warning (D5).** Part paid from mirror money; mild at 7, strong at 2, nothing once
  AUTHORISED; a cleared mild warning re-opens; the demo clock only; nothing blocks.
- **One place.** The rules in `prepayment.ts`, one branch in 24's lock, behind
  `prepaymentForProcedure` and `prepaymentStatusFor`; the AR links in the header comments.
- **Triggers and PWA.** Each entry on its routes only, the clock never rewinds, the stand-in badged,
  `pwaPurity` passes, seed determinism and the filler `rng()` order unchanged, `PERSIST_VERSION`
  bumped.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry), each with its route and persona:
  - D30 (OQ-96): the price on a prepaid Procedure locked for the office as well as the anaesthetist;
  - D47 (OQ-104): an issued prepayment keeps its price through a new Contract version;
  - D57 (OQ-116): a mixed Booking shows the deduction line;
  - the readings: derived, never stored; the invoice always to the payer on the Booking; no split on a
    prepaid Procedure; "Pick the Contract line first"; unapproved at authorise billed at the line's
    price; cancelled after sending waits for 41; the 7 and 2 day windows;
  - Souter's payables due fall by Nair's held prepayment until 27a.
- Status row and a phase entry: the drift check against `d4db277`; the answers built (D64, D27, D6 as
  superseded, D38, D23, D5, D42, OQ-04, OQ-38, OQ-61, OQ-76) and the D30, D47 and D57 defaults and
  where each lives; what 15a to 25 provided; the sessions and the adversarial pass; the tests added;
  `PERSIST_VERSION` old to new and the re-pinned figures; the Catalogue screenshots result (recipes
  created or changed, broken ones re-pointed, REPORT.md counts before and after); handoffs: **27a**
  (`PREPAY_HOLDING_ACCOUNT`, the payables skip, `settledByPrepayment` for the second pair), **28, 31,
  32, 32a** (no move path touches prepayment), **36** (`prepaymentStatusFor` and `settledByPrepayment`
  to the ledger legs), **38b, 39** (the lock leaves by-hand routes only; `notNeeded` and
  `changedAfterSending` are their cases), **41** (the letter joins Approve and send, the refund from
  the holding account, `prepaidAmountFor` for a fresh prepayment), **43** (generate prepaid Bookings
  on prepaid Contracts through the same module).
- Decisions log:
  - **Superseded:** Phase 09's office raise by hand and its build decision (4) and the 8th review's
    "full | split" (split balance = fee - deposit, full = an estimated fee); the planned estimate and
    deposit (retired with US-06.2.3 to US-06.2.5); generation at setup with a held invoice (this
    plan's earlier D6 reading); the profile prepaid set as trigger (D64); the pair to the anaesthetist
    and the payee repoint on a move (D38); Phase 20's interim; 15a's flat "strong" strength; the
    overpaid prepayment's `negativeTotal` failure and the balance invoice (the Phase 08 belt stays for
    every other negative); 22's `prepaidSplit` keyed on 20's interim (re-keyed).
  - **Readings settled here:** as listed under "For the owner's review".
  - **Answered, built as answered:** D64 / OQ-25, D27 / OQ-92, D6 as superseded and D38 / OQ-80, D23 /
    OQ-73, D5 / OQ-57, D42 / OQ-91, OQ-04, OQ-38, OQ-61, OQ-76.
  - **Defaults for open questions:** D30 / OQ-96, D47 / OQ-104, D57 / OQ-116.
