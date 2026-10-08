# Phase 27 · Prepayment lifecycle

**Requirements covered:**
[EP-06](../../../../requirements-board/requirements/stories/EP-06.md) (Verify, graded Contradicts; changed at `60e2d1e`: the amount is the anaesthetist's own fixed price, nothing is calculated or raised automatically afterwards, honour system on a move. This phase builds the trigger, the amount, generation, approval, tracking, the re-check and pricing at the prepaid amount. Letters, the trust hold, refunds, the by-hand extras and credits and the payee on a move are Phase 41),
[FT-06.2](../../../../requirements-board/requirements/stories/FT-06.2.md) (Confirmed, graded Contradicts; changed: the payer is a person, the amount from the first-party Contract),
[US-06.2.1](../../../../requirements-board/requirements/stories/US-06.2.1.md) (Confirmed, graded Contradicts; a procedure or its RVG group in the prepaid set, and a person paying, never an organisation, OQ-73 answered; no price on the Contract is OQ-92),
[US-06.2.2](../../../../requirements-board/requirements/stories/US-06.2.2.md) (Confirmed, graded Contradicts; changed: the fixed price on the anaesthetist's own first-party Contract line, which the office selects, always in full, no estimate, deposit or part; OQ-04, OQ-38 and OQ-76 answered, OQ-91 answered: the office keeps those Contracts),
[US-06.3.1](../../../../requirements-board/requirements/stories/US-06.3.1.md) (Verify, graded Contradicts; generated at setup with its ledger pair and draft Xero pair, held for admin approval, not invoiced again at submit; the pair timing is OQ-80, D38's default; the letter is Phase 41),
[US-06.3.2](../../../../requirements-board/requirements/stories/US-06.3.2.md) (Confirmed, graded Partial; no block, a warning in both apps that strengthens as the date nears, part paid, every upcoming prepaid Booking listed),
[US-06.3.5](../../../../requirements-board/requirements/stories/US-06.3.5.md) (Verify, graded Partial; changed: re-check on a change of Procedures, Contract or payer, never on a move),
[FT-08.1](../../../../requirements-board/requirements/stories/FT-08.1.md) (Proposed, graded Partial; its one named exception, the prepayment invoice at setup),
[US-03.1.8](../../../../requirements-board/requirements/stories/US-03.1.8.md) (Confirmed, graded Partial; **joined at `60e2d1e`**: the anaesthetist sees the prepaid amount, and whether it is paid, on opening the Booking and where units are recorded),
[US-08.2.2](../../../../requirements-board/requirements/stories/US-08.2.2.md) (Confirmed, graded Contradicts; **joined at `60e2d1e`**: the prepayment is deducted and a prepaid Procedure, priced at the prepaid amount, leaves nothing to bill; whether its price can change is OQ-96, D30's default);
[DM-20](../analysis/domain-model-delta.md#dm-20) (prepayment lifecycle: fixed price, drafted at setup, held for approval, nothing calculated afterwards; the letter-template master is 41's);
[RV-09](../analysis/reverse-check.md) (prepayment as a payment category, a deposit or an estimated full fee netted automatically; the completion gate went in 15a, the payment category in 20).
Left this phase at `60e2d1e`: US-06.2.3, US-06.2.4 and US-06.2.5 (Retired: no estimate, no contingency units, no estimated duration) and DM-40 (dropped). US-09.1.3 (the prepayment's ACCREC and draft ACCPAY pair) Matches today and is carried across without regression.

**Depends on:** Phase 15a (session 1, built: the pure warning routine in `src/domain/warnings`,
`WARNING_RULES`, the `prepaymentUnpaid` rule with `PREPAYMENT_REQUIRED_TEXT` and
`PREPAYMENT_UNPAID_TEXT`, the `appSettings` record and its backfill, `warningClearances`, the
`store/warnings.ts` selectors and the audited `clearWarning`, the completion gate and its override
gone; session 2: the to-do list, the triangle, the warning visible on opening a Booking, no confirm
step at submit, `WARNING_SAMPLES`), Phase 21 (the payer on the Booking, `billablePartyForProcedure`,
`isPayerBilled` and `isPersonParty`, and `setBookingPayer`, where this phase hooks its payer
re-check), Phase 25 (the pricing snapshot at AUTHORISED; the run prices only from it) and Phase 26
(the anaesthetist's prepaid set of procedures and whole RVG groups, `expandPrepaidProcedures`,
`prepaidReasonFor` and `prepaidPriceRows` in `domain/billing/prepaidSet.ts`, `setPrepaidSettings`).
Through them: 18's dated Contract versions and holders, 19's procedure list and RVG groups
(`procedureTypeId`), 19a's Contract lines and the anaesthetists' own fixed-price Contracts kept by the
office (`ownPriceListFor`, `ownFixedPriceFor`; Dr Souter's price list with Rhinoplasty at $1,200),
20's one Contract per Procedure and its interim office-set `prepaymentRequired` flag with
`prepaymentDetail` on the Booking (replaced here), 20a's three-part stack (`pricingBasisFor`,
`whoIsInvoicedFor`), 22's GST rule, invoice layout, `materialiseInvoices` with its separate send
step, `InvoiceDelivery`, `supplier` and the `prepaidSplit` check, 24's price precedence
(`pricePrecedence.ts`, `PriceSource`, `adjustmentAllowed`, the office override), 15b's ACTIVE List
state, and 14's trigger registry and office stand-in.
**Estimated:** 2 sessions. Session 1: work items 1 to 9 (figures pinned, model, the pure prepayment
rules, status, the engine's sync with generation and its pair, approve and send, the warnings,
pricing at the prepaid amount, seed), ending green with the UI edited only as far as it must
compile. Session 2: items 10 to 15 (the Booking panel and the prepaid amount where units are
recorded, the admin approval and tracking surfaces, invoice wording, the review chip and audit
labels, triggers, shots and the demo guide). If session 1 overruns, items 8 and 9 open session 2;
cut nothing, and never skip the demo guide or the adversarial pass.

## Goal

Prepayment stops being something a person picks or estimates. A Booking needs prepayment when any of
its Procedures has a procedure in the anaesthetist's prepaid set, directly or through its RVG group
(Phase 26), checked across the whole Booking, and only where that Procedure is billed to the payer on
the Booking (Phase 21) and that payer is a person paying for the patient (the patient, or for
example a guardian), never an organisation (US-06.2.1, FT-06.2, owner decision D23, OQ-73 answered).
The Contract never triggers it (OQ-25). Phase 20's interim office-set flag goes, with the deposit and
split paths and the `prepaymentDetail` shape; Phase 20 already removed the payment category, and
this phase does not plan that removal again.

The prepaid amount is the fixed price on the anaesthetist's own first-party Contract line for the
procedure (US-06.2.2; OQ-04, answered by the directors on 6 October; US-04.2.14), which the office
selects for the Procedure at setup, in the version in force on the procedure date (OQ-48). It is
always the full amount: never an estimate, a deposit or a part (OQ-38 and OQ-76 answered;
US-06.2.3 to US-06.2.5 Retired, so there is no estimator, no estimated duration and no contingency
units). The office keeps those Contracts from the anaesthetist's price list (OQ-91 answered, D42). Per
OQ-92's default (D27), a prepaid procedure with no price on that Contract raises an office warning
through 15a's routine and the prepayment invoice is held (not generated) until a price is added,
never estimated. The anaesthetist sees the prepaid amount, and whether it is paid, on the Booking and
where units are recorded (US-03.1.8).

Per owner decision D6 (OQ-58, answered), the system generates the prepayment invoice at booking setup
(US-06.3.1) as soon as the requirement and its price are known. Generating it creates its linked
receivable and payable pair and the matching pair of draft records in Xero, ACCREC and DRAFT ACCPAY
(OQ-80's default, D38; US-09.1.3, which Matches today through the same handoff and must not regress).
The invoice is then held **Awaiting approval**; an admin's **Approve and send** only sends it (Phase
41 adds the letter). A later List submit never invoices it again, FT-08.1's one named exception.

Once the List is AUTHORISED, a prepaid Procedure is priced at the prepaid amount, with the BTM units
recorded on the day kept for reference only (US-06.4.1's pricing criteria), and the final invoice
deducts the prepayment already invoiced, so nothing is left to bill (US-08.2.2): no balance invoice
and no credit, in either direction. Per OQ-96's default (D30) the price on a prepaid Procedure is
locked at the prepaid amount: Phase 24's anaesthetist adjustment and the office override are not
offered there, and any difference is raised by hand (38b, 39, 41). The planned prepaid-above-final
excess path is not built, because with the price locked it no longer arises; the `negativeTotal`
guard stays for every other negative.

Per owner decision D5 (OQ-57, answered), nothing blocks: 15a removed the completion gate and made the
unpaid prepayment a warning. This phase tracks part paid and makes that warning escalate, mild from a
week out and strong from two days out, in both apps (US-06.3.2). The engine re-checks the requirement
and amount when the Booking's Procedures, Contract or payer change before the procedure
(US-06.3.5): an unsent invoice is re-priced in place or withdrawn, with its pair replaced or voided
in the same store action, and a sent one raises an office warning (corrections by hand, 39 and 41).
A move is not a change: an honour system applies, and no code detects a move or re-checks anything
on one (US-06.3.5, US-06.5.4, D20 as superseded).

**Pricing model in one place.** The prepayment rules (the requirement, the amount, the plan, the
status and the prepaid price step) live in one place in `aa-prototype/src/domain/billing` (a new
`prepayment.ts`, plus one branch each in 24's `pricePrecedence.ts`), behind types the UI reads, so a
v5 of the draft design stays a contained edit. The plain-language guide
[AR-28#prepaid-already-agreed](../../../../requirements-board/requirements/artifacts/AR-28.md) (own set,
a person pays, the full fee, invoiced at setup and sent on approval) and the first bullet of
[AR-28#prepaid-proposed](../../../../requirements-board/requirements/artifacts/AR-28.md) (the prepaid
amount is the final price, BTM for reference) hold as written; its second bullet (raise the price and
invoice the difference) was not adopted (OQ-61). The draft technical design v4
[AR-29#prepayment](../../../../requirements-board/requirements/artifacts/AR-29.md) gives the trigger and
option (a), now adopted (the first-party Contract's fixed price, no new structures); its
"adjustable fixed price" settlement was not adopted. The prepaid price step extends
[AR-29#price-precedence](../../../../requirements-board/requirements/artifacts/AR-29.md) and
[AR-29#price-validation](../../../../requirements-board/requirements/artifacts/AR-29.md), and is
recorded by [AR-29#pricing-snapshot](../../../../requirements-board/requirements/artifacts/AR-29.md);
[AR-30#booking-procedure](../../../../requirements-board/requirements/artifacts/AR-30.md) puts the
prepayment link on the booking procedure, which one selector here hides.

> Names below are today's names at `60e2d1e` (code unchanged since `b342a7d`, Phase 15a session 1).
> Use the names Phases 15a to 26 actually shipped (the warning rule and facts, the procedure list,
> Contract lines and `ownFixedPriceFor`, 20's interim flag, 21's payer and party helpers, 22's
> materialiser and send step, 24's precedence and price source, 25's snapshot, 26's prepaid set), as
> their PROGRESS entries record them.

## Before you start: drift check

1. Run the catalogue diff for this phase's items, its context and its open questions against the
   plan's baseline, catalogue commit `60e2d1e` (rename-aware; never a plain `git diff` of the
   catalogue folder):

   ```
   node docs/prototype-build/catch-up/tools/plan-state.mjs --diff EP-06,FT-06.2,US-06.2.1,US-06.2.2,US-06.3.1,US-06.3.2,US-06.3.5,FT-08.1,US-03.1.8,US-08.2.2,FT-06.1,FT-06.3,FT-06.4,FT-06.5,US-06.1.1,US-06.3.4,US-06.3.6,US-06.4.1,US-06.5.3,US-06.5.4,US-09.1.3,US-12.1.3,US-04.2.14,US-04.3.4,US-11.2.2,US-03.5.1,US-05.4.2,US-13.7.1,US-13.7.3,US-13.7.4,US-06.2.3,US-06.2.4,US-06.2.5,US-06.4.2,US-06.3.3,OQ-80,OQ-92,OQ-96,OQ-97,OQ-04,OQ-38,OQ-61,OQ-76,OQ-91,OQ-73,OQ-70,OQ-57,OQ-58,OQ-48,OQ-03
   ```

   At plan time (2026-10-08, `3d3a18c..60e2d1e`) the changes that touch this phase were: EP-06,
   FT-06.2, US-06.2.1 and US-06.2.2 were rewritten around the anaesthetist's own fixed price (US-06.2.2
   moved to Confirmed); US-06.2.3, US-06.2.4 and US-06.2.5 were retired; US-06.3.1 gained the amount
   and the payer named on the Booking, and the draft design's link on the booking procedure;
   US-06.3.5 dropped the re-check on a move (honour system) and gained the payer; US-06.4.1 became
   "no automatic invoice or credit" and absorbed the retired US-06.4.2; US-08.2.2 now leaves nothing
   to bill for a prepaid Procedure; US-06.5.4 dropped the re-check on a move and kept the payable
   update as OQ-80; US-03.1.8 was added; FT-08.1 only changed in links. OQ-04, OQ-38, OQ-61, OQ-76
   and OQ-91 were answered; OQ-92, OQ-96 and OQ-97 are new and open; OQ-80 was refreshed and is still
   open. The plan already reflects all of this; diff only for anything after `60e2d1e`.
2. If an item changed since `60e2d1e`, re-read it and adjust the work items. If one is now Retired or
   Future, drop it and record that in the PROGRESS entry. Check that US-06.2.3, US-06.2.4, US-06.2.5,
   US-06.3.3 and US-06.4.2 are still Retired and US-13.7.4 still Future.
3. **Owner decisions answered.** Build each as answered, with no provisional label:
   - **D5 / OQ-57:** no block on completing a Booking or List; a clear warning in both apps. 15a
     removed the gate; this phase escalates the warning by date (item 7).
   - **D6 / OQ-58, as superseded on 2026-10-08** (US-06.2.2, OQ-04, OQ-38, OQ-61, OQ-76): the system
     generates the prepayment invoice when a Procedure matches the prepaid list and a person pays,
     holds it until an admin approves and sends it; generating it creates the ledger pair and the
     draft Xero pair, and the approval only sends it. ~~An estimate from estimated duration, RVG time
     and two contingency modifier units~~: the amount is the fixed price on the anaesthetist's own
     first-party Contract line, always in full, shown to the anaesthetist; nothing is invoiced or
     credited automatically afterwards (items 4, 5, 8).
   - **D23 / OQ-73:** prepayment only where the payer on the Booking is billed and is a person paying
     for the patient, never an organisation. Greg: "prepayments are always patient-direct... there's
     no hospital involved". Reuse 21's `isPayerBilled` and `isPersonParty`, never a second helper
     (item 3). No caption.
   - **D20 / OQ-70, as superseded on 2026-10-08** (US-06.3.5, US-06.5.4): an honour system. No logic
     detects a List or Booking move and nothing is re-checked or recalculated on one; the
     anaesthetist who does it keeps the agreed amount and claims no more. The payee update on a move
     is OQ-80's (D38), built in Phase 41. Here: no move action calls the sync (item 4).
   - **D42 / OQ-91:** the office creates and keeps every first-party Contract from the
     anaesthetist's price list (19a); the anaesthetist never edits it. This phase only reads it.
   - **OQ-61 and OQ-76:** nothing is invoiced or credited automatically after a prepaid procedure,
     either way, no threshold; no partial prepayment. **OQ-38:** no contingency units. **OQ-04:** the
     amount is the first-party Contract's fixed price. **OQ-03**'s old "not refunded" reading is
     replaced by OQ-61's "nothing automatic". **OQ-48:** the version in force on the procedure date.
   If one has been reopened since `60e2d1e`, build the plan as written, label that point provisional
   in one place, and put it first on the "For the owner's review" list.
4. **Open questions: build the default, label it provisional in one place, log it.** If one has been
   answered since `60e2d1e`, build the answer instead and drop its provisional label:
   - **OQ-92 (D27), a prepaid procedure with no price on the anaesthetist's own Contract.** Default
     (the question's recommendation): an office warning through 15a's routine, and the prepayment
     invoice is not generated until a price is added to that Contract; never an estimate. One function,
     `prepaidAmountFor` (item 3), with a comment naming OQ-92, and one provisional caption on the
     panel's "No price" row (item 10).
   - **OQ-96 (D30), can the price on a prepaid Procedure change.** Default (the recommendation): the
     price stays the prepaid amount and is locked; any difference is an additional invoice or credit
     note raised by hand (38b, 39, 41). One branch in 24's `adjustmentAllowed` and one in the office
     override's guard (item 8), each with a comment naming OQ-96, and one provisional caption on the
     locked price row (item 10). Reading settled here: "locked" covers the office override too, since
     an override would leave a difference the netting would then bill or credit (US-06.4.1). Log it.
   - **OQ-80 (D38), when the pair is created and amended.** Default (refreshed 2026-10-08): the
     receivable and payable pair, with its draft Xero pair, is created when the prepayment invoice is
     generated, and the approval only sends it; on a move before the procedure only the payable's
     payee is repointed, one store action in Phase 41, with no recalculation and no re-check. Keep the
     timing behind one function, `generatePrepaymentInvoice` (item 4), with a comment naming OQ-80. No
     UI caption.
   - **OQ-97** (a part credit of a prepayment, D31) is Phase 41's. Build nothing for it.
   - **Readings settled here (log them, no caption):**
     - **A split Procedure is never prepaid.** 22's Split button divides a Procedure's fee between
       parties, and its `prepaidSplit` check and entry refusal key on 20's interim flag, which goes.
       From OQ-73's "always patient-direct", prepayment applies only where a person pays the whole fee:
       the requirement excludes a Procedure carrying a split (item 3), and 22's entry refusal is
       re-keyed from the flag to the derived requirement ("This procedure is prepaid, so it cannot be
       split."). The `prepaidSplit` review failure can then never fire: delete it and its test, and
       test the exclusion and the refusal instead.
     - **The requirement is the engine's, recorded on the Booking.** The 7th review B6 ruling
       ("derived, never stored") stopped a person setting the flag. The honour system now needs more:
       a requirement re-derived on every read from the List's current anaesthetist would change on a
       move, which US-06.3.5 forbids. So the engine derives it at setup and on the listed changes, and
       records the result (`Booking.prepayment`, item 2); status reads that record, the invoices and
       mirror money, never the List's current anaesthetist. Nobody sets it by hand.
     - **The basis anaesthetist.** The engine derives against the List's anaesthetist at the time it
       runs, except that once an invoice has been sent the agreed amount is that invoice's, and its
       anaesthetist (22's `supplier.anaesthetistId`) stays the basis. A held invoice whose List has
       since moved stays as generated; a later change of Procedures, Contract or payer re-derives
       against the List's anaesthetist then (that is a change, not a move).
     - **The Contract selected matters.** US-06.2.2: the amount follows when the office selects the
       anaesthetist's own first-party Contract for the procedure. A prepaid Procedure with no Contract,
       or on another Contract, is "price needed" with the same office warning as OQ-92's case and no
       invoice; the office picks her own Contract (20's picker offers it on her own Bookings).
     - **A held invoice at authorise is withdrawn** and the Procedure is billed on the final invoice
       at its Contract's fixed price (the same figure), so the patient is never billed twice and never
       left with an unsent prepayment.
     - **A prepaid Procedure cancelled after sending** is not deducted (there is nothing to net it
       against); its sent invoice reads "no longer needed" for a credit by hand (39, 41).
5. **Read what Phases 15a to 26 actually built** (their PROGRESS entries):
   - 15a: the `WarningFacts` shape and its `prepaymentStatus` field, the rule file and texts,
     `appSettings`, `warningClearances`, `warningsForBooking` / `openWarnings` / `clearWarning`, the
     clearance re-open rule, `WarningsPanel`, the to-do card, the triangle and the Booking outline,
     `WARNING_SAMPLES` and its prepayment sample (20 re-pointed it at the interim flag), and where the
     office's "Raise pre-procedure invoice" button was left. Submit has no confirm step (US-13.7.3).
   - 15b: Copy a Booking is gone; assigned Lists are ACTIVE.
   - 18 and 19a: dated versions and "in force on a date"; the first-party holder (anaesthetist set,
     holder not billed); `ownPriceListFor` and `ownFixedPriceFor`; Dr Souter's seeded price list
     (Rhinoplasty $1,200 and the others); how the office edits a line or saves a new version (the
     action the sync hooks for `contractChanged`).
   - 19: the procedure list, `procedureTypeId` on the Procedure, Rhinoplasty's id and group.
   - 20: the Booking's `prepaymentRequired` and `prepaymentDetail`, `setBookingPrepayment`, its sheet
     or row, the validator's split-deposit check, `buildPrePaymentInvoiceForBooking`'s reading of the
     flag, Riley's `{ split, 800 }` and Nair's `{ full }`, the "Needs a Contract" card, and
     `setProcedureContract`.
   - 20a: `pricingBasisFor` and `whoIsInvoicedFor`, and the stack component on each surface.
   - 21: `billablePartyForProcedure`, `isPayerBilled`, `isPersonParty`, `setBookingPayer`, the
     completion rules.
   - 22: the GST rule, `materialiseInvoices` and its separate send step, `deliveryPlanFor`,
     `InvoiceDelivery`, `supplier`, the Split action, `prepaidSplit` and the split's entry refusal.
   - 24: `pricePrecedence.ts`, `PriceSource` and its label map, `adjustmentAllowed`, the office
     override and its guard, the engine rejections, the no-charge invoice and "a group netted to $0
     only by a prepayment deduction raises none".
   - 25: the pricing snapshot's fields and `priceBookingFromLock` (or its shipped name), and whether
     `prePaidByProcedure` still threads into the locked run.
   - 26: `PrepaidSettings` (`procedureTypeIds`, `rvgGroupIds`), `expandPrepaidProcedures`,
     `prepaidReasonFor`, `prepaidPriceRows`, Souter's seeded set (Rhinoplasty, and one covered
     procedure with no price on her Contract), and the coherence test's Riley exception.
   Adjust the work items to reuse what exists instead of adding a second copy.
6. Record the result (including "no drift", the answered decisions as built and the D27, D30 and D38
   defaults) in the PROGRESS entry.

## Reference

- **Design** (convention 17):
  - `docs/design/Design Language.dc.html`: the semantic tints (warning for price needed, awaiting
    approval, unpaid and part paid; success for paid), neutral pills for status, Spline Sans Mono
    with tabular-nums for every amount, and teal as the only action colour (crimson never on the
    prepayment panel, the rail card, the approval strip or the warning).
  - `docs/design/Admin Day.dc.html`: the right rail's white cards (15a's To-do card is the pattern
    for the new "Pre-payments" card).
  - `docs/design/Mobile App.dc.html`: the Booking detail anatomy (white cards with micro-cap
    headings, 14px radius) and the capture screen's units block.
  - `docs/design/Admin Review.dc.html`: the flag chips in the review table.
  - No mockup covers the prepayment panel. Extend the mobile card-row pattern: the prepaid procedures
    as mono rows (procedure, fixed price), a rule, then the prepaid amount and its status.
- **Catalogue:** the covered files above; for context FT-06.1, FT-06.3, FT-06.4, FT-06.5, US-06.1.1,
  US-06.3.4, US-06.3.6, US-06.4.1, US-06.5.3, US-06.5.4, US-09.1.3, US-12.1.3, US-04.2.14, US-04.3.4,
  US-11.2.2, US-03.5.1, US-05.4.2, US-13.7.1 to US-13.7.3; the questions OQ-80, OQ-92, OQ-96 and OQ-97
  (open) and OQ-03, OQ-04, OQ-38, OQ-48, OQ-57, OQ-58, OQ-61, OQ-70, OQ-73, OQ-76 and OQ-91 (answered);
  and `requirements-board/requirements/domain-model.md` (§1's prepayment rows, Booking, Contract,
  Internal ledger, Warnings and §3's Prepayment paragraph). Evidence (read only the cited passages,
  `npm --prefix requirements-board run source -- --item <ID> --text`, Node 22.18 or newer):
  `notes/2026-10-06-aa-directors-meeting.md` (#4, #5, #9, #10), `notes/2026-10-07-aa-client-meeting.md`
  (#3, #8, #17, #18, #35), `notes/2026-10-07-aa-meeting-with-greg.md` (#34, #35, #36),
  `notes/2026-10-07-pricing-model-documents.md` (#1, #15, #35), and the earlier
  `notes/2026-10-01-aa-meeting-with-greg.md` (#16, #50) and `notes/2026-10-02-aa-meeting-with-greg.md`
  (#11, #47); change log `changes/2026-10-07-requirements-update.md` (EP-06 rows, section 9).
- **Pricing model (draft v4; may change):** [AR-28#prepaid-already-agreed and
  #prepaid-proposed](../../../../requirements-board/requirements/artifacts/AR-28.md) (true as written,
  except the proposed raise-the-price extra invoice, not adopted);
  [AR-29#prepayment](../../../../requirements-board/requirements/artifacts/AR-29.md) (trigger; option
  (a) adopted; the link on the booking procedure),
  [AR-29#price-precedence](../../../../requirements-board/requirements/artifacts/AR-29.md),
  [#price-validation](../../../../requirements-board/requirements/artifacts/AR-29.md),
  [#pricing-snapshot](../../../../requirements-board/requirements/artifacts/AR-29.md) and
  [#contract-behaviour](../../../../requirements-board/requirements/artifacts/AR-29.md) (a first-party
  Contract bills the payer on the Booking, and is otherwise adjustable);
  [AR-30#booking-procedure](../../../../requirements-board/requirements/artifacts/AR-30.md). The billing
  flow [AR-24](../../../../requirements-board/requirements/artifacts/AR-24.md) regions
  `prepayment-check`, `prepayment-invoicing`, `prepayment-pair-undecided`, `prepayment-payment`,
  `prepayment-recheck` and `remaining-amount`.
- **Gap analysis:** `GAP-ANALYSIS.md` (Summary, theme 6 "Prepayment replaced", "Things to remove or
  rework", "Demo impact" S4, the DM-20 and RV-09 rows); `epics/EP-06.md` (every item this phase
  covers), `epics/EP-03.md` (US-03.1.8), `epics/EP-08.md` (FT-08.1, US-08.2.2); `gaps.json` entries for
  the covered IDs, US-06.4.1 and US-09.1.3; `analysis/domain-model-delta.md` (DM-19, DM-20, DM-21,
  DM-50, DM-08); `analysis/reverse-check.md` (RV-09, RV-17).
- **Code entry points** (line numbers at `60e2d1e`; shifted by 15b to 26):
  - `src/domain/types.ts`: `Booking` 373 (20 added `prepaymentRequired` and `prepaymentDetail`),
    `PrepaymentDetail` 435, `Procedure` 453, `Invoice` 672 (`kind: 'standard' | 'prePayment'`),
    `InvoiceLine` 688, `BillingCase` 707, `XeroAccRec` 779 (`status: 'awaitingPayment' | 'paid' |
    'voided'`), `XeroAccPay` 790 (`status: 'draft' | 'authorised' | 'paid'`). 15a's `AppSettings` and
    `WarningFacts` live in `src/domain/warnings/types.ts`.
  - `src/domain/billing/`: `invoiceBuild.ts` (`buildInvoicesForBooking` 264, the
    `prepaidCounterpartyChanged` guard about 322, the deduction line "Less pre-payment deposit already
    invoiced" about 390, the `negativeTotal` belt about 417, `buildPrePaymentInvoiceForBooking` 456);
    24's `pricePrecedence.ts`; 19a's `ownFixedPriceFor`; 26's `prepaidSet.ts`;
    `validateBookingForBilling.ts` (20's split-deposit check); `prePaymentInvoice.test.ts`.
  - `src/domain/warnings/` (15a): `types.ts`, `routine.ts`, `rules/prepaymentUnpaid.ts`,
    `rules/index.ts`.
  - `src/store/`: `prepaymentActions.ts` (`raisePreProcedureInvoice` 51, 20's `setBookingPrepayment`);
    `selectors.ts` (`bookingRequiresPrepayment` 307, `prePaymentInvoicesForBooking` 316,
    `paidPrePaymentCaseForBooking` 329, `prePaidByProcedure` 345, `prepaymentStatusFor` 372);
    `lifecycle.ts` (`cancelBooking` 348, `editProcedure` 438, `reassignList` 543, `reassignBooking`
    635); `bookingActions.ts` (`createBooking` 78, `addProcedure` 422, `removeProcedure` 502); 20's
    `setProcedureContract`; 21's `setBookingPayer`; 26's `setPrepaidSettings`; 19a's line and version
    actions; `billingRun.ts`; `paymentActions.ts` (`receivePayment` 78); `clockActions.ts`
    (`advanceClockToDate` 101); `xeroHandoff.ts` (`handoffCase` 153, `handoffCasesForBooking` 291);
    15a's `warnings.ts` and `warningSamples.ts` (new in 15a session 2, so absent at `60e2d1e`);
    `officeStandIn.ts` (`authoriseAsSimulatedOffice` 28);
    `prepayment.test.ts`, `paymentActions.test.ts`, `seedBilling.test.ts`, `demoScenarios.test.ts`.
  - `src/shared/booking/BookingDetailBody.tsx` (the prepayment row about 489 to 512,
    `data-shot="booking-prepayment"`, and the raise button about 505); `src/shared/capture/`
    (`BtmCaptureBlock.tsx`, `UnitsCard.tsx`, `BookingTotalPanel.tsx`: where units are recorded);
    20a's stack component; 20's prepayment row or sheet in `src/shared/flows/`; 24's price card;
    `src/shared/audit/actionLabels.ts`, `fieldLabels.ts`, `auditNarrative.ts` (the `PrepaymentDetail`
    formatter); `src/shared/demoTriggers/` (14's registry, `types.ts`, `context.ts`);
    `src/domain/dateDays.ts` (`daysBetween`).
  - `src/apps/admin/`: `components/RightRail.tsx` (15a's To-do card), `outlet.ts`, `reviewFlags.ts`,
    `screens/ReviewScreen.tsx`, `screens/InvoicesScreen.tsx`, `screens/InvoiceDocument.tsx` (the
    prepayment and deposit wording about 496 to 530), `screens/BillingMonitorScreen.tsx`.
  - `src/apps/demo/DemoXero.tsx`, `xeroPairView.ts` (the ACCREC status pill),
    `DemoControlPanel.tsx` (the S4 scenario text).
  - Seed: `src/domain/seed/bookings.ts` (Riley on Souter Fri 24 AM about 828,
    `SEED_MARKERS.prepaymentBooking`; Nair on Souter Fri 24 PM about 896, `SEED_PREPAID_BOOKING_ID`),
    `billing.ts` (`buildSeedBillingSlice`, the paid INV0001/BC0001 prepayment about 105 to 245), 19a's
    first-party seed, 26's prepaid sets, `cast.ts`.
  - Shots: `visual/admin-phase09.spec.ts`, `admin-phase08.spec.ts`, 15a's `visual/warnings.spec.ts`.

## Work items

**Session 1: figures, model, rules, engine, pricing, seed.**

1. **Pin the figures first.** Extend the parity harness Phases 18 to 26 left
   (20's `src/store/contractParity.test.ts` and 19a's `src/domain/billing/feeParity.test.ts`, or
   their shipped names) rather than adding a second one, with
   literals from the current build: every seeded Booking's prepayment status and open warnings; the
   S3 invoice totals (Holt; Prentice nib and St George's), the S4 Beat 3 and Beat 5 figures and the S5
   figures; the balance run for Souter Fri 24 PM (Nair) as it stands after Phase 25; and **the pair
   shape of a prepayment invoice** (US-09.1.3: the ACCREC and DRAFT ACCPAY fields, contacts, the
   hidden contact number, the link between them), which Matches today and must not regress. S3, S4
   Beats 3 and 5 and S5 must not move, and the pair shape stays field for field (only the ACCREC's
   status before approval and the amounts change). The only deliberate changes are Riley's and Nair's
   prepayment figures (item 9), re-pinned there with the reason. Never update a fixture with `-u`.
2. **Types** (`domain/types.ts`; DM-20):
   - Delete `PrepaymentDetail`, 20's `Booking.prepaymentRequired` and `Booking.prepaymentDetail`, and
     their "INTERIM office-set flag" comments. Nothing anywhere can hold a deposit, a split amount or
     a typed prepaid amount.
   - `Booking` gains `prepayment?: BookingPrepayment`, written only by the engine (item 4):
     `{ anaesthetistId: AnaesthetistId; lines: PrepaidProcedure[]; atISO: IsoDateTime; cause:
     PrepaymentSyncCause }`, where `PrepaidProcedure = { procedureId; procedureTypeId; reason (26's
     prepaidReasonFor result); price: { kind: 'priced'; contractId; lineId; amount } | { kind:
     'missing'; why: 'noContract' | 'otherContract' | 'noPrice' } }`. `amount` is ex GST, the line's
     fixed price in the version in force on the procedure date. One line per prepaid Procedure keeps
     the draft design's link on the booking procedure (AR-30#booking-procedure) available behind one
     selector, `prepaymentForProcedure(state, procedureId)` (item 3); the domain model's
     `prepaymentInvoiceId` stays derived (an invoice carries its Booking, `kind: 'prePayment'` and
     each line's `procedureId`). Record both readings in the Decisions log.
   - `Invoice` gains `approval?: { status: 'awaitingApproval' | 'approved' | 'withdrawn'; by?: string;
     role?: ActorRole; atISO?: IsoDateTime; reason?: string }`, set only on `prePayment` invoices
     (US-06.3.1). 22's `InvoiceDelivery` gains `{ status: 'held' }` for an invoice not yet approved.
     Each prepayment `InvoiceLine` carries its `procedureId`.
   - `XeroAccRec.status` gains `'draft'` (US-06.3.1: "the matching pair of draft records in Xero");
     `XeroAccPay.status` gains `'voided'` for a withdrawn pair. Update `xeroPairView.ts` for both.
   - 24's `PriceSource` gains `'prepaidAmount'` (label "Prepaid amount", the one label map), and 25's
     snapshot records it like any other source.
   - Actor: `ENGINE_ACTOR: Actor = { who: 'Billing engine', role: 'system', source: 'system' }` in
     `prepaymentActions.ts`, beside the `BILLING_RUN_ACTOR` pattern in `billingRun.ts`.
   - No `estimatedDurationMin`, no contingency setting, no estimate snapshot, no `excessAboveFinal`:
     none of them exist any more.
3. **The pure prepayment rules** (`domain/billing/prepayment.ts`, exported from the billing index,
   with `prepayment.test.ts` beside it; US-06.2.1, US-06.2.2, FT-06.2; AR-29#prepayment). This file is
   the one place for the requirement, the amount and the plan; the store and every surface read it.
   - `prepaidProceduresFor(input)`: the non-cancelled Procedures whose `procedureTypeId` is in 26's
     `expandPrepaidProcedures(settings, masters)` (directly or through a ticked group), that 21's
     `isPayerBilled` says are billed to the payer on the Booking, whose payer passes 21's
     `isPersonParty` (D23: the patient or a named person, never an organisation; an organisation is
     always a holder), and that carry no 22 split. A Procedure with no Contract yet counts as billed to
     the payer (it is waiting on the office's setup, 20's "Needs a Contract"). Every Procedure counts,
     not just the primary (the hospital Booking with a cosmetic add-on is the typical case), and the
     Contract never triggers it (OQ-25). Reuse 26's helpers; never re-expand groups here.
   - `prepaidAmountFor(procedure, anaesthetistId, contracts, dateISO)` (US-06.2.2; OQ-92's default,
     D27, commented here): when the Procedure's Contract is the anaesthetist's own first-party
     Contract, 19a's `ownFixedPriceFor` for the version in force on the procedure date gives
     `{ kind: 'priced', contractId, lineId, amount }`; with no Contract, `{ kind: 'missing', why:
     'noContract' }`; on another Contract, `why: 'otherContract'`; on her own Contract with no line or
     no fixed price for the procedure, `why: 'noPrice'`. Never an estimate, never the RVG, never the
     anaesthetist's unit value, never a typed price.
   - `prepaymentPlan(input)`: from the derived prepaid Procedures and their amounts, the Booking's
     stored record and its prepayment invoices, returns one of:
     - `generate`: required, every prepaid Procedure priced, no live invoice;
     - `reprice`: required and priced, a held invoice for the same anaesthetist whose lines or amount
       differ (a Procedure, Contract, line price or payer changed): rewrite the record and the held
       invoice's lines and amount, and its draft pair, in place (it was never sent);
     - `withdraw`: a held invoice that is no longer right (the requirement has gone, a price is now
       missing, or the basis anaesthetist changed through a change of Procedures, Contract or payer),
       then `generate` again in the same call when still required and priced;
     - `record`: required but a price is missing, or the requirement changed with no live invoice:
       rewrite the record only (status "price needed");
     - `clear`: not required, a record stored, no live invoice;
     - `flagSent`: a **sent** invoice that no longer matches (the requirement has gone, or its
       Procedures, Contract or payer changed): rewrite nothing on the invoice; the status reads
       `notNeeded` or `changedAfterSending` and the office is warned (item 7);
     - `none` otherwise. A sent invoice is never rewritten: corrections are by hand (39, 41).
   - `prepaymentBasisAnaesthetist(record, invoices, list)`: the anaesthetist on a sent invoice
     (22's `supplier.anaesthetistId`) once one exists, else the List's anaesthetist; a List with no
     anaesthetist (31's Draft Lists, later) gives none, so nothing is required and nothing generated.
   - Tests: a prepaid procedure with a person payer is required; the same procedure billed to an
     insurer or hospital holder is not; a guardian payer is; a procedure in a ticked group is; the
     hospital-funded first Procedure plus a prepaid second (Nair) gives one prepaid Procedure; a split
     Procedure is never prepaid; each `missing` reason; the version in force on the procedure date
     (a later version does not move an earlier Booking's amount); each plan outcome; a sent invoice
     is never rewritten.
4. **Status, selectors and the engine's sync** (`selectors.ts`, `prepaymentActions.ts`, tests in a
   rewritten `src/store/prepayment.test.ts`; US-06.3.1, US-06.3.2, US-06.3.4, US-06.3.5, FT-08.1).
   - `prepaymentStatusFor(state, bookingId)` returns `{ status, amount?, invoiceIds, invoicedTotal,
     receivedTotal, missing? }` from the stored record, the Booking's prepayment invoices and mirror
     money only, never re-deriving from the List's current anaesthetist:
     - `none`: no record and no live invoice;
     - `priceNeeded`: required, a price missing (each Procedure's `why`), no invoice (D27);
     - `awaitingApproval`: a generated invoice is held;
     - `unpaid`, `partPaid` (received above zero and below the invoiced total, US-06.3.2), `paid`
       (received covers it, summed across the Booking's sent prepayment invoices, keyed on mirror
       money as `paidPrePaymentCaseForBooking` is today);
     - `notNeeded`: a sent invoice and the requirement has since gone; `changedAfterSending`: a sent
       invoice whose Procedures, Contract or payer have since changed (the office corrects by hand).
     Withdrawn invoices never count. A receipt re-checks it with no hook (US-06.3.4, Matches today).
   - `bookingRequiresPrepayment(state, bookingId)` reads the record; `prepaymentForProcedure(state,
     procedureId)` is the one selector that answers "is this Procedure prepaid, at what amount, on
     which invoice, paid or not" for the panel, the units block, 20a's stack and the billing run, so
     whether the link sits on the Booking or the booking procedure stays a one-file change.
   - `upcomingPrepayments(state)`: every Booking with a prepayment record or invoice on a List not yet
     AUTHORISED, across all dates, with its status and days to go from the demo clock, ordered by
     date.
   - **One engine routine, `syncPrepayment(api, bookingId, cause)`**, run as `ENGINE_ACTOR` after
     commit. It is both the generation at setup and the re-check; nothing else writes
     `Booking.prepayment` or generates a prepayment invoice. It runs `prepaymentPlan`, applies it in
     one `mutate()`, audits `booking.prepayment` with its cause, returns its outcome (`generated`,
     `repriced`, `withdrawn`, `regenerated`, `recorded`, `cleared`, `flagged`, `unchanged`) for the
     one-line confirmation item 10 shows, and is idempotent (a second call writes nothing).
   - `PrepaymentSyncCause` = `bookingCreated | procedureChanged | contractChanged | payerChanged |
     prepaidSetChanged | bookingCancelled | listAssigned | listAuthorised`. There is **no move cause**.
   - **Generation** (the old `raisePreProcedureInvoice`, reworked as the internal
     `generatePrepaymentInvoice`; OQ-80's default, D38, one comment here):
     - builds through `buildPrePaymentInvoiceForBooking`, which now reads the stored record, not a
       flag: one line per prepaid Procedure, its procedure name and "Prepaid amount", the line's fixed
       price ex GST, `procedureId` set; grouped by 21's party (normally the payer on the Booking),
       patient layout; GST by 22's rule;
     - materialises through 22's `materialiseInvoices` with its send step off,
       `approval: { status: 'awaitingApproval' }` and delivery `{ status: 'held' }`: nothing is emailed
       or queued to a portal;
     - creates the `BillingCase` and hands off the pair through `handoffCase` **at generation**, the
       ACCREC as `draft` and the ACCPAY as `draft`: the same pair shape as today (item 1's parity), so
       US-09.1.3 holds. This is the one place the pair is created; approval never hands off again;
     - refuses for a cancelled Booking, an AUTHORISED or billed List, or a live invoice;
     - audited `invoice.prePaymentGenerated` with the cause.
   - **Withdrawal:** `approval.status: 'withdrawn'` with the cause as `reason`, the draft ACCREC and
     ACCPAY `voided`, audited `invoice.prePaymentWithdrawn`. The number stays used; a withdrawn invoice
     never counts.
   - **Call `syncPrepayment` after commit from:**
     - `createBooking` (`bookingCreated`, every creation path: the anaesthetist add, phone advice,
       manual entry, integration creates);
     - `addProcedure`, `removeProcedure` and `editProcedure` (the procedure pick)
       (`procedureChanged`);
     - 20's `setProcedureContract`, and 19a's line and version saves on a first-party Contract for
       that anaesthetist's Bookings on Lists not yet AUTHORISED (`contractChanged`; a held invoice
       re-prices, a sent one is never rewritten);
     - 21's `setBookingPayer` (`payerChanged`, 21's handoff names it) and 22's Split
       (`procedureChanged`);
     - 26's `setPrepaidSettings`, for that anaesthetist's Bookings on Lists not yet AUTHORISED
       (`prepaidSetChanged`);
     - `cancelBooking` (`bookingCancelled`: a held invoice is withdrawn; a sent one is left for Phase
       41's refund);
     - `authoriseList` before the run (`listAuthorised`: a held invoice is withdrawn, item 8);
     - export it with `listAssigned` for Phase 31, whose Draft List assignment is the setup of a List
       that had no anaesthetist (not a move).
   - **Never from a move** (US-06.3.5 AC2, US-06.5.4, D20): `reassignList`, `reassignBooking`, 28's
     reassign, 32's and 32a's moves call nothing here and change nothing on the record, the invoice or
     the pair (41 adds only the payee repoint, D38). Test it: a reassign writes no engine audit row
     and leaves the status, amount, invoice and pair identical, before and after sending.
   - **Remove** 20's `setBookingPrepayment` and its sheet or row and export, the office's "Raise
     pre-procedure invoice" button and `raisePreProcedureInvoice`'s public export, 20's validator
     split-deposit check and 22's `prepaidSplit` failure (item 3's split reading), re-keying 22's
     split entry refusal to `bookingRequiresPrepayment`. Completion never validates prepayment (D5).
     Re-point 15a's `prepaymentUnpaid` input (`facts.prepaymentStatus`) from 20's flag to this status.
   - Tests: a Booking created with Rhinoplasty on Souter's own Contract and the patient paying
     generates exactly one held invoice of $1,200.00 ex GST with a draft pair, by "Billing engine";
     with no Contract it records `priceNeeded` (`noContract`) and generates nothing, and selecting her
     own Contract generates it; with no price on her Contract it is `priceNeeded` (`noPrice`), and
     adding the line price generates it; a held invoice re-prices in place when a line price changes,
     and is withdrawn (pair voided) when the prepaid Procedure is removed or its Contract becomes an
     insurer's; a payer change to a person keeps it; submitting the List never raises a second
     prepayment invoice (US-06.3.1 AC4); after sending, removing an additional prepaid Procedure, or
     re-picking a first one as a procedure off the prepaid list (`removeProcedure` refuses a
     Booking's first Procedure), rewrites nothing and reads `notNeeded`; reassigning before and after sending changes nothing; cancelling
     withdraws a held invoice and keeps a sent one; each run is idempotent.
5. **Approve and send** (`approvePrepaymentInvoice(api, actor, invoiceId)` in `prepaymentActions.ts`;
   US-06.3.1 AC3):
   - Office only; refused unless the invoice is a `prePayment` invoice in `awaitingApproval`, and on a
     cancelled Booking or an AUTHORISED or billed List.
   - Sets `approval: { status: 'approved', by, role, atISO }`, sends through 22's separate send step
     (`deliveryPlanFor`: email to 21's invoice email, or the portal) at the clock time, and moves the
     draft ACCREC to `awaitingPayment`. It hands off nothing: the pair already exists. The ACCPAY
     stays `draft`; a later receipt authorises it pro rata exactly as today (the trust hold is 41's,
     DM-21).
   - Audited `invoice.prePaymentApproved`, plus 22's `invoice.sent` or `invoice.portalQueued`.
   - `receivePayment` refuses a `draft` ACCREC ("This invoice has not been sent yet."), so a payment
     can never land on a held invoice.
   - Tests: office approves and sends once; the anaesthetist is refused; a second approve is refused;
     payment before approval is refused; after approval half a payment reads `partPaid`; after
     approval the pair equals item 1's pinned shape.
6. **The prepaid amount for the anaesthetist** (US-03.1.8): `prepaymentForProcedure` gives each
   prepaid Procedure's amount and its invoice's status (awaiting approval, unpaid, part paid, paid).
   Re-point 20a's `pricingBasisFor` (the stack's third line) so a prepaid Procedure reads "Prepaid
   amount $1,200.00" with its status, instead of the first-party Contract's "Fixed price"; this is the
   one change to 20a's selector. The surfaces are item 10's.
7. **The warnings** (15a's routine; US-06.3.2, US-13.7.1, D5, D27):
   - Widen 15a's `WarningPrepaymentStatus` and `WarningFacts.prepaymentStatus` to item 4's result
     (status, amount, totals, invoice numbers, missing reasons). Widen `store/warnings.ts`'s state
     slice to whatever the status needs (`masters` for the procedure names), and update the components
     that memoise on it. This is a catalogue change to the rule's input, not a rewrite of 15a's
     session 1.
   - **`prepaymentUnpaid` escalates by date.** One before-procedure finding while the status is
     `awaitingApproval`, `unpaid` or `partPaid` and the List is not AUTHORISED:
     `daysToGo = daysBetween(todayISO, listDateISO)`; **mild** when `daysToGo <= mildWithinDays` (7);
     **strong** when `daysToGo <= strongWithinDays` (2), including the day itself and a passed date on
     a List not yet authorised; nothing further out. Seed `{ mildWithinDays: 7, strongWithinDays: 2 }`
     in `defaultParams`; 15a's record and backfill carry them (pin the backfill in its regression
     test). No screen for them (US-13.7.4 is Future). The same rule raises one mild finding for
     `notNeeded` and `changedAfterSending`, whatever the date.
   - **A new rule, `prepaidPriceMissing`** (D27, OQ-92's default; `WarningRuleId` widens): one
     before-procedure finding per Procedure while the status is `priceNeeded`, raised at once whatever
     the date (the office has to act before an invoice can exist), mild, strong within
     `strongWithinDays`.
   - Texts (no en or em dash; names from `shared/format.ts`):
     - `noContract` / `otherContract`: "Prepayment needed. Rhinoplasty is on Dr Souter's prepaid list:
       select her own Contract to set the prepaid amount.";
     - `noPrice`: "Prepayment needed. Dr Souter's own Contract has no price for Rhinoplasty. Add one;
       the prepayment invoice is held until then.";
     - `awaitingApproval`: "Prepayment invoice {number} is awaiting approval and has not been sent.";
     - `unpaid`: "Prepayment invoice {number} unpaid. Check with the patient before surgery starts.";
     - `partPaid`: "Prepayment part paid, ${x} of ${y} received. Check with the patient before
       surgery starts.";
     - `notNeeded`: "Prepayment invoice {number} was sent, but this Booking no longer needs
       prepayment. Credit it by hand if needed.";
     - `changedAfterSending`: "Prepayment invoice {number} was sent before this Booking changed.
       Check the amount; correct it by hand if needed."
   - 15a's clearance re-opens at a higher strength, so a mild warning cleared from the to-do list
     comes back when it turns strong. `paid` and `none` raise nothing; nothing ever blocks (15a's
     "Never blocks" tests stay green).
   - **Samples** (`warningSamples.ts`; 15a's shared "Raise sample warnings"): re-point the
     prepayment sample from 20's flag to the prepaid set: through audited store actions, set a Dr
     Souter Booking on a List within the mild window to Rhinoplasty on her own Contract with the
     patient paying, which generates a held invoice (`awaitingApproval`); add a `prepaidPriceMissing`
     sample that sets a Souter Booking's procedure to the procedure 26 seeded in her set with no price
     on her Contract, on her own Contract. Unstage restores the seed values (the held invoice is
     withdrawn through the same sync; its number stays used). If 15a's pinned sample List is not
     Souter's or is outside the window, re-pin these two samples to her Fri 24 Jul Lists.
   - Tests: the thresholds at 8, 7, 3, 2, 0 and -1 days; each text; params change the windows;
     `priceNeeded` raises at once; seeded Riley reads `noContract` on Tue 21 Jul; after
     `advanceClockToDate('2026-07-22')` an outstanding warning is strong.
8. **Pricing at the prepaid amount and the deduction** (24's `pricePrecedence.ts`, `invoiceBuild.ts`,
   `billingRun.ts`, 25's snapshot; US-06.4.1's pricing criteria, US-08.2.2, D30; AR-29#price-precedence,
   #price-validation, #pricing-snapshot):
   - **The prepaid Procedure.** A non-cancelled Procedure with a line on a **sent** prepayment invoice
     is priced at that line's amount, price source `prepaidAmount`, ahead of every other step: the
     recorded BTM is kept and shown for reference only, and nothing is calculated against it (the
     Contract's later versions never move it). 25's snapshot records the source and the amount; the
     run prices only from the snapshot as before.
   - **Locked (D30, OQ-96's default, one comment each):** `adjustmentAllowed` gains the prepaid
     branch (false while `prepaymentForProcedure` reports a live prepayment), and the office override's
     guard refuses on a prepaid Procedure ("This procedure is prepaid; its price is the prepaid amount.
     Raise an additional invoice or a credit note for any difference."). The engine rejects a Procedure
     whose snapshot holds a typed price or an override together with a prepaid amount (24's rejection
     list gains `prepaidPriceEntered`). When the requirement arises on a Procedure that already holds
     a typed price, the sync clears it in the same commit, audited `procedure.adjustmentCleared` with
     the reason "prepaid".
   - **The deduction.** `prePaidByProcedure` counts only sent prepayment invoices and carries the
     invoice id and number. The deduction line reads "Less prepayment already invoiced, {number}" (the
     "deposit" wording goes), with GST matching the prepayment line under 22's rule. With the price
     locked, a prepaid Procedure nets to exactly zero: a group netted to $0 only by the deduction
     raises no invoice (24's rule, kept), and the run records it on the Booking's result as
     `settledByPrepayment: { procedureIds, prepaymentInvoiceIds }`, audited `booking.prepaidSettled`
     by "Billing engine"; the Booking reads billed, not failed. A group that also holds an unprepaid
     Procedure billed to the same party invoices that Procedure, with the prepaid Procedure's price
     and the deduction both on it.
   - **At authorise, a held invoice is withdrawn** (cause `listAuthorised`) and not netted; the
     Procedure is priced by 24's precedence (its first-party fixed price) on the final invoice.
   - **Kept guards.** The `prepaidCounterpartyChanged` failure stays for a sent prepayment whose
     Procedure is now billed to another party (the office resolves it by hand). A prepaid Procedure
     cancelled after sending is not deducted (item 3's reading of the drift check). The
     `negativeTotal` belt stays for every other negative; no excess path is built, because a locked
     price cannot fall below the prepaid amount. No balance invoice and no credit are ever raised for a
     prepaid Procedure (US-06.4.1: nothing automatic, no threshold).
   - Tests: a sent prepayment prices the Procedure at the prepaid amount whatever the recorded BTM
     (above and below), with source `prepaidAmount`, and no invoice is raised for it; a mixed group
     invoices only the unprepaid part, with the deduction line; a held invoice at authorise is
     withdrawn and the full fixed price billed; the counterparty-changed guard still fails for review;
     an adjustment or override on a prepaid Procedure is refused in the store and rejected by the
     engine; a negative price override on an unprepaid Procedure still fails `negativeTotal`;
     "Regenerate from locked data" (25) reproduces the settled result.
9. **Seed** (`seed/bookings.ts`, `billing.ts`, `index.ts`; bump `PERSIST_VERSION` by one from its
   post-26 value):
   - **Prepaid sets.** Confirm 26 seeded Souter's set to cover Rhinoplasty and one procedure with no
     price on her own Contract, and not the septoplasty. Replace 26's coherence-test Riley exception
     with real assertions: the Bookings with a prepayment record on Lists not yet AUTHORISED are
     exactly Riley and Nair; no billed or history Booking reads outstanding; no seeded invoice is
     `awaitingApproval`. If the filler hits others, narrow 26's seeded sets, never a Booking's
     procedure. Never change the filler's `rng()` draw order.
   - **Riley** (Souter Fri 24 AM, `SEED_MARKERS.prepaymentBooking`): the Procedure gets the
     Rhinoplasty procedure (19's id) and **no Contract** (the office has not set it up: she is on 20's
     "Needs a Contract" card); the flat $1,200 billing line and 20's `{ split, 800 }` go; the payer is
     the patient (21). Status `priceNeeded` (`noContract`), `prepaidPriceMissing` mild on Tue 21 Jul
     (3 days out), no invoice. S4 Beat 1 sets her own Contract live, which generates the invoice.
   - **Nair** (Souter Fri 24 PM, `SEED_PREPAID_BOOKING_ID`): the rhinoplasty moves onto Dr Souter's
     own price list (Rhinoplasty $1,200); the septoplasty stays on Forte's Contract. The engine's
     rules, run at seed time, store her record; `buildSeedBillingSlice` builds the paid INV0001/BC0001
     from it at $1,200.00 ex GST (GST by 22's rule), seeded `approval: { status: 'approved', by:
     'Kirsty W.' }` a few days before the demo date with a sent delivery, and the pair as today
     (ACCREC paid, ACCPAY as 16 left it). Authorising Fri 24 PM then raises Forte's septoplasty
     invoice unchanged and nothing for Nair (`settledByPrepayment`).
   - The invoice numbers do not move: INV0001 stays Nair's, no other prepayment invoice is seeded, so
     S3's runtime numbers (AA-2026-0002, 0005, 0006 after a Reset) hold.
   - Update `seedBilling.test.ts`, `demoScenarios.test.ts` and the markers' comments. Re-pin item 1's
     Riley and Nair figures with the reason ("prepaid amount is the anaesthetist's own fixed price,
     Phase 27").
   - **Session 1 exit:** fix the listed tests; edit the UI only as far as compiling needs (the
     prepayment row reads the new status; 20's flag row and the raise button are gone); run
     `npm run build`, `npm run build:pwa` and `npx vitest run`, all green, with item 1 passing; write a
     short "session 1 done" note in the PROGRESS entry.

**Session 2: surfaces, triggers, demo.**

10. **The Booking prepayment panel and the units block** (15a's prepayment row in `BookingDetailBody`
    rebuilt as a `PrepaymentPanel` component in `src/shared/booking/`, all three apps through
    `useSurface()`; US-06.2.2, US-06.3.2, US-03.1.8, D27, D30):
    - Title by status, as a semantic tint: "Pre-payment needed · price needed"; "Pre-payment invoice
      awaiting approval"; "Pre-payment unpaid"; "Pre-payment part paid · $x of $y received";
      "Pre-payment received"; "Pre-payment no longer needed"; "Pre-payment sent before a change".
      Amounts in mono with tabular-nums.
    - Body: which Procedures matched ("Rhinoplasty is on Dr Souter's prepaid list", from 26's
      `prepaidReasonFor`, "via group" where it applies); who pays (the payer on the Booking by name,
      from 21); one mono row per prepaid Procedure with its fixed price and the Contract it came from
      ("Dr M. Souter, own price list"); the prepaid amount; the invoice number with a link to the
      invoice document (office). A missing price shows "No price" on its row with the one
      **"Provisional (OQ-92)"** caption; the open warning stays in 15a's `WarningsPanel` above and is
      not repeated.
    - **The office** sees a teal **Approve and send** on `awaitingApproval` (calls
      `approvePrepaymentInvoice`; the confirmation names the invoice and where it went), and on
      `priceNeeded` a teal "Choose Contract" that opens 20's picker for that Procedure (`noContract`,
      `otherContract`) or a link to the anaesthetist's own Contract in Master data (`noPrice`). Nobody
      types an amount: no "Set pre-payment", no deposit input.
    - **The anaesthetist** sees the panel read-only: the prepaid amount and whether it is paid
      (US-03.1.8), with no office controls and no Contract or holder vocabulary beyond 20a's stack.
    - **Where units are recorded** (`BtmCaptureBlock`, mobile and web): a compact row
      `data-shot="capture-prepaid"`, "Prepaid $1,200.00 · paid" (or its status), above the units, and
      24's price card shows the price as "Prepaid amount, locked" with the one **"Provisional
      (OQ-96)"** caption and no typed price or discount field (D30).
    - The re-check is visible (US-06.3.5): the Contract picker's, the payer sheet's and the procedure
      edit's confirmations append the sync's outcome in one line ("Pre-payment re-checked: invoice
      generated, awaiting approval", "... amount updated", "... invoice withdrawn", "... no longer
      needed"). A reassign shows no prepayment line at all.
    - Delete the "RFP open question" and "discovery point" copy (RV-17).
    - Keep `data-shot="booking-prepayment"`; add `capture-prepaid`.
11. **Admin approval and tracking surfaces** (US-06.3.1, US-06.3.2):
    - **Right rail:** a "Pre-payments" card in `RightRail.tsx`, under 15a's To-do card, fed by
      `upcomingPrepayments` through `AdminOutletContext`: patient, anaesthetist (`drSurname`), the
      procedure date ("In 3 days"), the amount (or "Price needed"), and a status pill (price needed,
      awaiting approval, unpaid, part paid, paid, no longer needed). An `awaitingApproval` row carries
      a teal **Approve and send**; a row opens the admin Booking detail. Empty state "No upcoming
      pre-payments." `data-shot="rail-prepayments"`.
    - **Invoices screen:** an "Awaiting approval" strip above the table, one row per held prepayment
      invoice with **Approve and send**; held and withdrawn invoices carry a neutral pill in the table.
      `data-shot="invoices-awaiting-approval"`.
    - **Invoice document:** a held prepayment invoice shows "Awaiting approval. Not sent." and
      **Approve and send**; a withdrawn one shows "Withdrawn before sending" with the reason.
    - **Billing monitor and the admin Booking billing panel:** a settled Booking shows "Prepaid in
      full, nothing to bill ({number})", never an exception.
    - The day grid needs no new signal: 15a's triangle carries the warning.
12. **Invoice wording, the review chip and audit labels** (US-06.3.1, US-08.2.2):
    - The prepayment invoice's note (wherever 22 left the patient-layout note): "This invoice is the
      prepaid amount for the procedure. It is the price for the anaesthetic." No "estimate", no
      "deposit", no "may be higher or lower" (US-06.3.6's wording rule; the letters are 41's).
    - Remove the "deposit", "estimated full fee" and "discovery point for AA" sentences, here and in
      the `prepaymentActions.ts` module comment (FT-08.1's gap).
    - Review screen (`reviewFlags.ts`) chips beside 15a's triangle: "Pre-payment sent, no longer
      needed" and "Pre-payment sent before a change" (warning tint), and "Prepaid amount" on a prepaid
      Procedure's price cell (neutral).
    - Audit labels: `booking.prepayment` "Pre-payment checked", `invoice.prePaymentGenerated`
      "Pre-payment invoice generated", `invoice.prePaymentApproved` "Pre-payment invoice approved and
      sent", `invoice.prePaymentWithdrawn` "Pre-payment invoice withdrawn", `booking.prepaidSettled`
      "Prepaid in full, nothing to bill", `procedure.adjustmentCleared` "Price cleared (prepaid)".
      Give `prepayment` and `approval` narrative formatters. Drop the `prepaymentDetail` formatter and
      its test, and 20's flag label.
13. **Demo triggers** (the registry in `src/shared/demoTriggers/registry.ts`; bodies in `src/shared`
    or `src/store`, so `pwaPurity` holds; the office stand-in body beside 14's
    `authoriseAsSimulatedOffice` in `src/store/officeStandIn.ts`). See "Demo triggers" below. Registry
    tests: visibility per route; disabled reasons; the clock jump lands on the date two days before
    and never rewinds; "Add prepaid-list Booking" creates one Booking with one held invoice and its
    draft pair; the stand-in approves and sends exactly one invoice; the two warning samples stage
    and unstage. Never add anything to the Control Panel page. Update its S4 scenario text
    (`DemoControlPanel.tsx`, the S4 `blurb` and step (1) message) to the new beat.
14. **Shots:** update `visual/admin-phase09.spec.ts`, `admin-phase08.spec.ts` and 15a's
    `warnings.spec.ts` for the panel, the rail card, the approval strip and the mild-then-strong
    triangle; add a mobile shot of the panel and the units row on Nair (paid) and a PWA shot of the
    stand-in. Run
    `node requirements-board/scripts/capture.ts --only US-06.2.1,US-06.2.2,US-06.3.1,US-06.3.2,US-06.3.4,US-06.3.5,US-06.4.1,US-08.2.2 --dry`
    to see the recipes that break (the deposit shots, the Raise button clicks, the old day-grid flag
    if 15a left it, the payment-category captions). Fixing them is the "Catalogue screenshots" step,
    after the review pass. Never edit a requirement's text or status.
15. **Demo guide** (below), in the same session.

## Demo triggers

Harness bar (framed build):

| Label | Screen | Surface | Effect |
|---|---|---|---|
| Move to 2 days before procedure | Admin · Day (`/admin/day/:dateISO`) and Admin · Booking detail (`/admin/day/:dateISO/bookings/:bookingId`) | bar | On the Booking detail it acts on the Booking in the URL. On the Day view, `choices` lists the Bookings with an outstanding prepayment (price needed, awaiting approval, unpaid, part paid) from `upcomingPrepayments`, earliest first. Calls `advanceClockToDate(api, procedureDate - 2 days)`: the warning turns from mild to strong on the triangle and the to-do list, and a cleared mild warning re-opens. Disabled with "No outstanding pre-payments" or "Already 2 days or less before". The clock only moves forward, and Reset restores it |
| Add prepaid-list Booking | Admin · Day and Admin · Booking detail | bar | As the office stand-in (`OFFICE_SIMULATION_ACTOR`), creates a Booking on Dr Souter's next ACTIVE List (today or later) for a named seed demo patient, the payer the patient, with one Procedure, Rhinoplasty, on Dr Souter's own price list. The engine records the requirement and generates the invoice at $1,200.00 ex GST, "Awaiting approval", with its draft pair already in the Xero sim, so it appears on the rail card and the Invoices strip. The message names the Booking and the invoice number. Disabled with "No ACTIVE List for Dr Souter" or "Already added (Reset to repeat)" |
| Payment received · half / full (re-pointed) | Admin · Booking detail, plus the existing Admin · Invoice document and Xero sim pair routes | bar | Phase 14's re-homed webhook entries gain the Booking detail route, where `choices` are that Booking's sent prepayment ACCRECs. Half shows "Part paid · $690.00 of $1,380.00 received" (at 15% GST; use the total 22's GST rule gives) on the panel, the rail and the warning; full shows "Pre-payment received" and the warning goes. Disabled with "Awaiting approval, not sent yet" on a held invoice. Same body and idempotency keys as today |
| Raise sample warnings (15a, shared) | Admin · Day | bar | Gains the `prepaidPriceMissing` sample (a Souter Booking on a prepaid procedure with no price on her own Contract) and the re-pointed prepayment sample (a held invoice awaiting approval). Unstage restores the seed |

**Approve and send** is a product button (Booking panel, rail card, Invoices strip, invoice
document), not a trigger.

Registry ids (the capture runner's `trigger` step and ATLAS's "Demo actions by screen" table use
them): `prepayment-two-days-before` (the clock jump, bar and PWA), `add-prepaid-booking`, and
`pwa-office-approves-prepayment`. The payment entries keep Phase 14's ids (`payment-half`,
`payment-full`, `payment-replay`, `pwa-payment-half`, `pwa-payment-full`); only their routes grow.

PWA equivalents (the mobile Booking waits on the office and on the patient's payment):

| Label | Screen | Surface | Effect |
|---|---|---|---|
| Office approves and sends the prepayment invoice | Mobile · Booking (`/mobile/lists/:listId/bookings/:bookingId`) | PWA only, badge office stand-in | When the Booking needs prepayment: as the office stand-in, selects the anaesthetist's own Contract on each prepaid Procedure that has none (the office's setup), which lets the engine generate the held invoice, then `approvePrepaymentInvoice`. The message names the amount and the invoice number. Disabled with "Already sent", "This booking does not need pre-payment" or "No price on Dr Souter's own Contract for this procedure" |
| Patient pays half / full of the pre-payment | Mobile · Booking | PWA only | Phase 14's `pwa-payment-half` / `pwa-payment-full` bodies, registered on the mobile Booking route with `choices` limited to that Booking's sent prepayment ACCRECs. Disabled with "No sent pre-payment invoice yet" |
| Move to 2 days before procedure | Mobile · Booking | PWA only | The same body as the bar entry, acting on the Booking in the URL, so the handset's triangle turns strong |

## Out of scope

- Prepayment letter templates and reminders (US-06.3.6; the letter picker joins Approve and send in
  41); the trust account hold and release, refund on cancellation, the payee repoint when a prepaid
  Booking moves (D38, OQ-80, US-06.5.4) and a fresh prepayment at the new anaesthetist's own price on
  rebooking (FT-06.5, US-06.5.1 to US-06.5.4). All Phase 41.
- Additional invoices and credit notes by hand after a prepaid procedure, by the office or the
  anaesthetist (US-06.4.1's last criterion, US-08.6.3, US-08.6.5; 38b, 39, 41), a part credit of a
  prepayment (OQ-97, D31, 41), and crediting a sent prepayment that is no longer needed (39, 41). This
  phase flags it.
- The prepaid settings screens and admin edit-on-behalf (FT-06.1, US-06.1.1, US-06.1.2): Phase 26.
  Editing an anaesthetist's own Contract: 19a (office only).
- The ledger legs behind prepayment status (FT-06.3 via FT-08.3): Phase 36 re-points the status from
  `BillingCase` money to the ledger.
- Anything on a move (D20): 28's reassign, 31's return, 32's and 32a's moves call nothing here.
- A settings page for the warning windows or for switching the approval step off (US-13.7.4, Future).
- The unpaid-balance warning at booking for a patient's earlier invoices (Phase 40).
- No estimate, estimated duration, contingency units, deposit, partial prepayment, balance invoice,
  automatic credit or excess record is built, anywhere (US-06.2.3 to US-06.2.5 and US-06.4.2 Retired;
  OQ-38, OQ-61, OQ-76 answered).

## Manual test checklist

The agent runs every item itself in the running app and reports it with evidence; none is handed
to the owner (ROADMAP.md "Owner review: agents test themselves").

- [ ] Reset. Admin Day, Tue 21 Jul: the "Pre-payments" card lists Annette Riley (Souter, Fri 24 Jul,
      "Price needed", "In 3 days") and Priya Nair as paid. The To-do card shows Riley's mild warning
      "Prepayment needed. Rhinoplasty is on Dr Souter's prepaid list...". The Fri 24 AM block carries
      the amber triangle, and Riley is on 20's "Needs a Contract" card.
- [ ] Admin Booking detail for Riley: the panel says Rhinoplasty is on Dr Souter's prepaid list and
      the patient pays; no amount input, no deposit, no estimate and no "Set pre-payment" anywhere.
- [ ] Choose Contract: 20's picker offers No contract (RVG) first and Dr Souter's own price list;
      pick her own. At once the panel reads "$1,200.00", "Awaiting approval" with the invoice number;
      the confirmation reads "Pre-payment re-checked: invoice generated, awaiting approval"; the audit
      shows `booking.prepayment` and `invoice.prePaymentGenerated` by "Billing engine"; the Xero sim
      shows a draft ACCREC and a draft ACCPAY. The warning now says the invoice is awaiting approval.
- [ ] "Payment received · half" is disabled on the held invoice ("Awaiting approval, not sent yet").
- [ ] Approve and send (from the rail card): the invoice is sent to the invoice email, the ACCREC
      reads awaiting payment, the ACCPAY stays draft, no second pair appears, and the status reads
      "Pre-payment unpaid".
- [ ] "Payment received · half" from Riley's Booking detail: panel, rail row and warning text read
      "Part paid · $x of $y received". Replay is idempotent.
- [ ] Mobile, Souter Fri 24 AM, Riley: the row carries the amber triangle; opening the Booking shows
      the warning, "Prepaid $1,200.00 · part paid" read-only, and the same row in the units block;
      the price card reads "Prepaid amount, locked" with no typed price. The anaesthetist completes
      the Booking and submits the List with no confirm step (US-13.7.3): nothing blocks.
- [ ] Clear Riley's mild warning from the To-do card, then "Move to 2 days before procedure": the
      clock reads Wed 22 Jul, the warning re-opens as strong (red triangle) on Admin and mobile.
- [ ] Re-check: "Add prepaid-list Booking" creates a Booking with a held $1,200.00 invoice. Change
      the rhinoplasty's line price on Dr Souter's own Contract (Master data, a new version in force
      on the date): the held invoice re-prices in place. Change the Procedure's Contract to an
      insurer's: the invoice is withdrawn (draft pair voided), the requirement cleared, the
      confirmation says so (US-06.3.5 AC1). Back on her own Contract, a guardian as payer keeps it,
      named on the panel. A split on the prepaid Procedure is refused.
- [ ] No price (D27): on a Souter Booking, pick the procedure 26 seeded with no price on her own
      Contract: "Price needed", the "No price" row with "Provisional (OQ-92)", the office warning, no
      invoice. Add a price in Master data: the invoice is generated.
- [ ] Move (D20): reassign a Booking with a held invoice, and Riley (sent), to a colleague: no
      confirmation line about prepayment, no engine audit row, the amount, invoice, status and pair
      are unchanged, and no new invoice is raised. (Run this before the next item, which changes
      Riley.)
- [ ] Sent then changed: on Riley (sent), re-pick her rhinoplasty as a procedure not on Dr Souter's
      prepaid list (a Booking's first Procedure cannot be removed, so re-pick rather than remove):
      nothing is rewritten on the sent invoice, the status reads "Pre-payment no longer needed", and
      the review chip and the mild office warning show.
- [ ] Lock (D30): on a prepaid Procedure the anaesthetist's typed price is not offered, and the office
      override is refused with the by-hand message.
- [ ] Authorise: submit and authorise Souter Fri 24 PM (Nair). Forte's septoplasty invoice is
      unchanged; nothing is raised for Nair; the Booking reads "Prepaid in full, nothing to bill
      (AA-2026-0001)"; the rhinoplasty's price source is "Prepaid amount" with its recorded BTM shown
      for reference. Submit never raised a second prepayment invoice.
- [ ] Held at authorise: authorise a List holding a Booking whose invoice is still awaiting approval:
      the invoice is withdrawn and the fixed price billed on the final invoice.
- [ ] S3, S4 Beats 3 and 5, and S5 figures are unchanged (item 1), and the prepayment pair shape
      matches the pinned one.
- [ ] Invoice documents: the prepayment note says it is the prepaid amount, the price; no "estimate",
      "deposit", "discovery point" or "RFP open question" remains on any prepayment surface. The only
      provisional captions are OQ-92's and OQ-96's.
- [ ] PWA build: on Riley's mobile Booking, the demo-actions sheet offers "Office approves and sends
      the prepayment invoice" (office stand-in badge), then "Patient pays half" (part paid), then "Move
      to 2 days before procedure" (strong triangle). Bottom sheets, teal actions, no crimson.
- [ ] No en or em dashes in new copy; amounts in mono with tabular-nums.
- [ ] Catalogue screenshots: the recipes for the covered items below are created or updated, any recipe this phase broke is re-pointed, a full `npm run capture` ends with no failed recipe and no story without a recipe, the covered items' new shots are checked by eye, and `npm run verify:board` is green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots` and `npm run verify:board` are all green.

## Demo guide updates

Patch these in the same session (locate passages by text), in `docs/demo-guide/` and the matching
sections of `master-demo-guide.html`:

- `03-demo-script.md` **S4 Beat 1**, renamed "Pre-payment from the prepaid list" (15a left it as
  "Prepayment warning"; its "Pre-payment required" wording and the "Raise pre-procedure invoice"
  aside go):
  - **Click:**
    - Admin Day, Tue 21 Jul: point at Riley on the "Pre-payments" card ("Price needed") and her
      warning on the To-do card.
    - Open Annette Riley. Choose her Contract: Dr Souter's own price list. The prepaid amount,
      $1,200.00, and the invoice appear, "Awaiting approval"; optionally show the draft pair in the
      Xero sim.
    - Approve and send.
    - Payment received · half: part paid.
    - Mobile, Souter Fri 24 AM, Riley: the triangle, the warning on opening, "Prepaid $1,200.00 · part
      paid" on the Booking and in the units block; complete and submit, with no confirm step.
  - **Say:** "Rhinoplasty is on Dr Souter's own prepaid list and the patient pays for herself, so the
    Booking needs prepayment; an insurer or a hospital never does. The amount is not an estimate: it
    is Dr Souter's own fixed price for the procedure, from the price list the office keeps for her,
    and it is always the full amount. As soon as the office sets the Contract, the system generates
    the invoice with its pair in Xero as drafts and holds it until we approve and send it. Dr Souter
    sees what has been prepaid. Nothing blocks: the warning is the control, and it gets stronger as
    the day approaches. After the procedure the prepaid amount is the price; nothing more is invoiced
    or credited automatically. If the Booking moves to a colleague, nothing is recalculated."
  - **Expected:** the prepaid amount from her own Contract, the held then sent invoice with its draft
    pair, part paid on all three surfaces, and a submit that goes through.
- **S4 new closing Beat 6, "The date approaches"** ("Move to 2 days before procedure" on Admin Day,
  after clearing Riley's mild warning). It sits last so Beats 2 to 5 run on the seeded date: the
  clock jump advances the day. Check whether Beat 2 still finds its ACTIVE today List after a jump;
  if it does not, keep the jump last and say so in Stage it.
- S4 "Discovery points": "when the prepayment's pair is created and amended (OQ-80)", "what happens
  when the anaesthetist's own Contract has no price for a prepaid procedure (OQ-92)" and "whether the
  price on a prepaid procedure can change (OQ-96)". Drop any gate, deposit, estimate, contingency,
  partial-prepayment or move point (OQ-38, OQ-57, OQ-70, OQ-73, OQ-76 answered: say them as facts in
  Beat 1).
- `04-presenter-cheat-sheet.md` section 8 "Pre-payment": rewritten. The trigger is the anaesthetist's
  prepaid list and a person paying for the patient, never an organisation (D23); the amount is the
  anaesthetist's own fixed price from the Contract the office keeps, in full (no estimate, no
  deposit); the invoice generated at setup with its draft pair and sent on approval (D6); the
  escalating warning (D5); after the procedure the prepaid amount is the price and nothing is raised
  automatically; a move changes nothing (honour system). Drop "come later (catch-up Phase 27)".
- `02-workflows-and-handoffs.md` "Pre-payment" case: the same rewrite (no "full or split", no
  estimate), and its status table row.
- `docs/demo-guide/README.md` status row and the master guide's status table: "Pre-payment from the
  prepaid list: own fixed price, approve and send, escalating warning".
- The Control Panel S4 scenario text (item 13).
- **Milestone:** end with a consistency read of `master-demo-guide.html` against the edited Markdown:
  S4 beat numbering, figures and trigger labels agree.

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19),
run after the review pass and before the PROGRESS.md entry. Re-run
`node docs/prototype-build/catch-up/tools/recipe-status.mjs 27` first: earlier phases may have
changed these recipes since this plan was written. Item 14's `--dry` run finds what is broken; this
step fixes it and takes the final shots. Stage a held or sent prepayment invoice with real clicks
(open Riley, choose Dr Souter's own price list as the rhinoplasty's Contract, Approve and send are
product controls), and stage a payment or the clock jump with the runner's `trigger` step after a
`goto` to the entry's screen (`payment-half` / `payment-full` on the Booking detail or invoice route,
`prepayment-two-days-before` on Admin Day or the Booking detail, `add-prepaid-booking` on Admin Day;
on a :5174 shot the step opens the PWA Demo sheet). The Control Panel has no payment buttons; never
click it for one. Replace every stale caption (an estimated fee, a deposit, a balance invoice, a
payment category) with the new behaviour's words.

**Covered items.** When the phase is done, each recipe in `requirements-board/capture/recipes/`
matches what was built:

| Item | Recipe at plan time | When this phase is done |
|---|---|---|
| [US-06.1.1](../../../../requirements-board/requirements/stories/US-06.1.1.md) Tick procedures or groups | absent at plan time (Phase 26 makes it captured) | No new work. Phase 26 owns these shots. Re-run `recipe-status.mjs 27`; if captured, confirm it still passes `--dry` and that its caption matches the prepaid list now driving the Booking panel. |
| [US-06.1.2](../../../../requirements-board/requirements/stories/US-06.1.2.md) Admin can maintain on behalf | absent at plan time (Phase 26 makes it captured) | No new work, as for US-06.1.1. |
| [US-06.2.1](../../../../requirements-board/requirements/stories/US-06.2.1.md) Detect prepayment requirement | partial · mobile-prepayment-flag, web-prepayment-flag | captured. Replace the payment-category flag shots with the Booking panel on Annette Riley (Souter Fri 24 AM) on mobile (`/mobile/lists/<Souter Fri 24 AM List>/bookings/<Riley>`, take the ids from the built seed), web and admin (`/admin/day/2026-07-24` Booking detail): state `needed` ("Pre-payment needed · price needed", "Rhinoplasty is on Dr Souter's prepaid list", the patient paying), highlight `[data-shot=booking-prepayment]`. Add a Nair state (Souter Fri 24 PM): the requirement found across the whole Booking (the rhinoplasty is the second Procedure; the septoplasty on Forte's Contract raises nothing). Caption: "A Booking needs prepayment when a procedure is on the anaesthetist's prepaid list and a person pays for the patient". Drop the partial reason. |
| [US-06.2.2](../../../../requirements-board/requirements/stories/US-06.2.2.md) Set the prepaid amount | partial · admin-deposit-invoice, admin-full-fee-invoice | captured. Delete the `deposit-invoice` shot (no deposit exists; its caption "partial deposit, which is no longer allowed" goes with it). Keep `full-fee-invoice` at `/admin/invoices/INV0001` (Nair, now $1,200.00 from her own Contract) with the caption replaced: "Prepayment invoice for the anaesthetist's own fixed price, in full" (not "the estimated full fee"). Add an admin `prepaid-amount` shot of Riley's panel after choosing Dr Souter's own price list (the $1,200.00 row and "Dr M. Souter, own price list", no amount input), and a `no-price` state on a prepaid procedure with no price on her Contract ("No price", "Provisional (OQ-92)"). Caption: "The prepaid amount is the fixed price on the anaesthetist's own Contract, set when the office selects it". Drop the partial reason. |
| [US-06.3.1](../../../../requirements-board/requirements/stories/US-06.3.1.md) Raise the prepayment invoice | captured · admin-raise-prepayment-invoice, admin-prepayment-invoice, simulator-prepayment-xero-pair | captured. Re-shoot `raise-prepayment-invoice` with states `awaiting-approval` (Riley, her own Contract chosen: the held $1,200.00 invoice and a teal "Approve and send") and `sent` (after Approve and send); the old "Raise pre-procedure invoice" click and states `required`, `raised` go. Keep `prepayment-invoice` at `/admin/invoices/INV0001`. In `prepayment-xero-pair` (`/demo/xero/invoices/XRB0`) keep the sent pair and add a `held` state for the draft ACCREC and ACCPAY of Riley's held invoice (the pair created at generation). Add admin `invoices-awaiting-approval` (the Invoices strip) and `rail-prepayments` (the rail card with Approve and send). Replace the estimated-fee captions: "Prepayment invoice generated at setup at the anaesthetist's own fixed price, with its draft pair in Xero, held until the office approves and sends it". |
| [US-06.3.2](../../../../requirements-board/requirements/stories/US-06.3.2.md) Track prepayment status and alert when outstanding | partial · admin-day-grid-flag, admin-card-status | captured. Re-shoot `day-grid-flag` (15a's amber triangle and Booking outline, not the old "Pre-payment flagged" button; re-point the click) and `card-status` with states `price-needed` (Riley seeded), `awaiting-approval`, `unpaid`, `part-paid` and `received` (Nair, paid). Add admin `rail-prepayments` (every upcoming prepaid Booking with status pills, which closes the missing list), a mobile shot of Riley's row with the triangle and the opened Booking showing the warning and the panel, and state `strong` after the `trigger` step `prepayment-two-days-before` on Riley's admin Booking detail. Caption: "Prepayment status per upcoming Booking, with a warning that strengthens as the date nears". Drop the partial reason. |
| [US-06.3.4](../../../../requirements-board/requirements/stories/US-06.3.4.md) Re-check after each receipt | captured · admin-recheck-after-payment | captured. Re-shoot `recheck-after-payment`: states `part-paid` and `paid` now start from Riley's generated invoice (choose her own Contract, Approve and send, then the `trigger` step `payment-half` or `payment-full` on her admin Booking detail), not the Raise button. Highlight `[data-shot=booking-prepayment]`. Captions: "Half the prepaid amount received, pre-payment part paid" and "Prepaid amount received in full". |
| [US-06.3.5](../../../../requirements-board/requirements/stories/US-06.3.5.md) Re-check when the Booking changes | partial · admin-recheck-on-change | captured. Replace the payment-category shots and captions ("Payment category Pre-payment...", "Category changed to Self-funded..."). `recheck-on-change` states `before` (Riley, held invoice at $1,200.00, the patient paying) and `after` (the Procedure's Contract changed to an insurer's: the held invoice withdrawn, the requirement cleared, the confirmation "Pre-payment re-checked: invoice withdrawn"). Add `moved`: reassign Riley (sent) to a colleague: the panel, amount and invoice unchanged and no re-check line. Captions: "Contract changed to one billed to an insurer: prepayment no longer required" and "A move re-triggers nothing". Drop the partial reason. |
| [US-06.3.6](../../../../requirements-board/requirements/stories/US-06.3.6.md) Prepayment letter templates | absent (placeholder: Phase 41) | absent. Keep it with no shots; reason: "No prepayment letter templates; Phase 41 adds the letter picker beside Approve and send." |
| [US-06.4.1](../../../../requirements-board/requirements/stories/US-06.4.1.md) No automatic invoice or credit after a prepaid procedure | captured · admin-balance-invoice | partial. This phase breaks the shot (no balance invoice exists), so it replaces it and its stale balance-invoice caption: rename `balance-invoice` to `prepaid-price`, authorising Souter Fri 24 PM (`/admin/review/<Fri 24 PM List>`, Nair) and showing the rhinoplasty priced at the prepaid amount (price source "Prepaid amount", the recorded BTM for reference) and "Prepaid in full, nothing to bill (AA-2026-0001)". Caption: "After the procedure the prepaid amount is the price; nothing more is invoiced automatically". Reason: "No balance invoice or credit is raised automatically; the additional invoice and credit note raised by hand on a prepaid Procedure come with Phases 38b, 39 and 41." Phase 41 adds the by-hand states. |
| [US-06.5.1](../../../../requirements-board/requirements/stories/US-06.5.1.md) Trust account | absent (placeholder: Phase 41) | absent. Reason: "No trust account hold; Phase 41 holds and releases the prepayment payable." This phase leaves the ACCPAY draft until a receipt authorises it, as today. |
| [US-06.5.2](../../../../requirements-board/requirements/stories/US-06.5.2.md) Refund a prepayment on cancellation | absent (placeholder: Phase 41) | absent. Reason: "No refund path; cancelling withdraws a held prepayment invoice and keeps a sent one for Phase 41's refund." |
| [US-06.5.3](../../../../requirements-board/requirements/stories/US-06.5.3.md) Prepayment for a replacement anaesthetist | absent (placeholder: Phase 41) | absent. Reason: "A new Booking generates its own prepayment at its anaesthetist's own fixed price through the normal sync, but the cancel, refund and new-Booking sequence is Phase 41." If that is visible on a new Booking after a cancellation in the build, upgrade to partial with that shot. |
| [US-06.5.4](../../../../requirements-board/requirements/stories/US-06.5.4.md) Prepaid Booking moved to another anaesthetist | absent (placeholder: Phase 41) | partial. Fill the recipe: reassign Riley (sent) to a colleague; the panel keeps $1,200.00 and the invoice, and no new invoice is raised. Caption: "Moved to a colleague: the prepaid amount stands and the patient is not billed again". Reason: "The payable's payee is not yet repointed to the new anaesthetist (OQ-80's default, D38); Phase 41 does that." |
| [US-08.1.1](../../../../requirements-board/requirements/stories/US-08.1.1.md) Process an AUTHORISED List using each Procedure's locked Contract | captured · admin-authorise-list, admin-billing-run | captured. Keep the recipe. Re-check `billing-run` and add a state for Souter Fri 24 PM (Nair): the septoplasty invoiced, the rhinoplasty settled by its prepayment, nothing raised for it. No wording change. |
| [US-03.1.8](../../../../requirements-board/requirements/stories/US-03.1.8.md) See the prepaid amount on the Booking | none | Create it, `captured`. Mobile (`/mobile/lists/<Souter Fri 24 PM List>/bookings/<Nair>`) and web, Nair (paid): states `booking` ("Prepaid $1,200.00 · paid" on opening, highlight `[data-shot=booking-prepayment]`) and `units` (the units block, highlight `[data-shot=capture-prepaid]`). Caption: "The anaesthetist sees the prepaid amount on the Booking and when recording units". |
| [US-08.2.2](../../../../requirements-board/requirements/stories/US-08.2.2.md) Net prepayments | captured · admin-deposit-invoice, admin-balance-invoice | captured. Delete `deposit-invoice` (its caption "The pre-payment deposit invoice" describes a retired deposit). Rename `balance-invoice` (it describes a retired balance invoice) to `nothing-to-bill`: authorise Souter Fri 24 PM and show Nair's Booking "Prepaid in full, nothing to bill (AA-2026-0001)" beside Forte's unchanged septoplasty invoice. Caption: "The prepayment is deducted: a prepaid Procedure leaves nothing to bill". |

**Recipes this phase breaks.**
- The Booking panel hook stays `data-shot="booking-prepayment"` (US-06.2.1, 06.2.2, 06.3.1, 06.3.2,
  06.3.4 and 06.3.5 use it); keep it on the rebuilt panel and re-check their captions.
- Every recipe that clicks "Raise pre-procedure invoice" (button gone, the invoice is generated at
  setup): besides the covered items, `US-09.2.1` (`payment-webhook`), `US-09.2.3` (`webhook-replay`),
  `US-09.2.4` (`accpay-disbursed`, `payables-run`) and `US-09.3.4` (`archived-contact-reused`,
  `contact-unarchived`). Replace the click with: open Riley, choose Dr Souter's own price list as the
  rhinoplasty's Contract, then Approve and send, keeping each shot `name` and checking amounts in
  captions (now $1,200.00 plus GST).
- `daygrid-block-prepayment` (the old day-grid flag, used by `US-06.3.3` and the setups of the covered
  items): 15a session 2 removes the `$` corner and may already have re-pointed them; re-point any left
  to 15a's triangle hook, or open Riley by URL.
- Retired items whose screens this phase removes get `status: absent` with the ROADMAP reason:
  `US-06.2.3` (its `estimated-full-fee` shot: "Retired: removed in Phase 27"), `US-06.2.4` and
  `US-06.2.5` (placeholders: "Retired"), `US-06.4.2` ("Retired: merged into US-06.4.1"), and
  `US-06.3.3` if 15a left it showing a gate.
- `INV0001` recipes (`US-05.2.7`, `US-08.4.1`, `US-09.1.1`) and `XRB0` recipes (`US-08.3.1`,
  `US-09.1.3`, `US-10.1.1`, `US-10.3.1`, `US-15.0.6`): Nair's prepayment is now $1,200.00 ex GST from
  her own Contract, seeded approved and sent. Routes are unchanged; check captions and highlights that
  name an amount. `US-11.3.3` uses `INV0002`; confirm it is still the first runtime invoice.
- Item 14 asks for a `--dry` run of the covered recipes; the full `--dry` is the real check.

**ATLAS.md.** Seed data and Personas and IDs: Riley seeded with no Contract (price needed) and Nair's
paid INV0001 at Dr Souter's own fixed price. Existing hooks: keep `booking-prepayment`; add
`capture-prepaid`, `rail-prepayments`, `invoices-awaiting-approval`; drop `daygrid-block-prepayment`
if 15a has not. Overlays: the Approve and send confirmation. Demo control panel section: the S4
scenario text, and the "Demo actions by screen" table gains `prepayment-two-days-before` and
`add-prepaid-booking` (Admin Day and Booking detail), the payment entries on the Booking detail route,
and the PWA's `pwa-office-approves-prepayment`; the "a raised pre-procedure invoice is `XR0001`" note
becomes a generated, approved one.

## Adversarial review (after build)

After the manual test checklist and the four commands are green, and before writing the PROGRESS
entry, run the standard adversarial review-and-fix pass (PROGRESS convention 18). Fan out
independent Opus review subagents: quality, bugs/correctness and plan adherence, plus a fourth,
money lens for this money phase. Then this session verifies every finding against the catalogue, this
plan and the code, fixes the confirmed ones, re-greens, and records the pass. Do not re-raise
anything settled in the Decisions log except the rulings this phase explicitly supersedes.

**Steer this phase's reviewers at:**

- **Derivation.** Nothing reads a payment category, 20's interim flag or the Contract to decide
  whether prepayment is required. Every Procedure on the Booking counts; groups resolve through 26's
  helpers; cancelled Procedures and Bookings never trigger it; an organisation never does; a split
  Procedure never does (and `prepaidSplit` is gone); D23's rule lives in 21's helpers, reused.
- **The amount.** It comes only from 19a's `ownFixedPriceFor` on the anaesthetist's own Contract in
  the version in force on the procedure date, through `prepaidAmountFor`. No estimate, unit value,
  RVG, contingency, deposit, typed or partial amount survives anywhere: types, store, UI, seed,
  invoice wording, demo guide. A missing price generates nothing (D27, one place).
- **Generation and approval (D6, D38, FT-08.1).** `syncPrepayment` is the only writer of
  `Booking.prepayment` and the only generator; it runs as the engine with its cause and is
  idempotent. The pair is created once, in `generatePrepaymentInvoice`, with the ACCREC and ACCPAY as
  drafts; approval sends and never hands off again; the pair matches the pinned US-09.1.3 shape. A held
  invoice is never emailed, queued or payable. Submit never raises a second prepayment invoice; a held
  invoice at authorise is withdrawn.
- **No move logic (D20).** No reassign or move path calls the sync or touches the record, invoice or
  pair; status never re-derives from the List's current anaesthetist.
- **Pricing and money.** A sent prepayment prices its Procedure at the prepaid amount, source
  `prepaidAmount`, the BTM for reference; the deduction nets it to zero; no balance invoice, credit or
  excess record is created; the locked price is never altered and no adjustment or override can apply
  (D30, store and engine). Prepaid plus anything invoiced for the Booking equals the priced fees (GST
  included). A negative group without a prepayment still fails `negativeTotal`; the
  counterparty-changed guard still fails for review.
- **Status and warning (D5, D27).** Part paid is derived from mirror money summed across sent
  invoices; mild at 7 days, strong at 2, nothing further out, nothing once AUTHORISED; price needed at
  once; a cleared mild warning re-opens when strong; the demo clock only (no `Date.now()` or `new
  Date()`); nothing blocks completion, submit or authorise; no confirm step at submit.
- **Re-check (US-06.3.5).** Every listed change calls `syncPrepayment` after commit (Procedures,
  Contract including a first-party line or version edit, payer, split, prepaid set, cancel,
  authorise); a sent invoice is never rewritten.
- **One place.** The rules sit in `domain/billing/prepayment.ts` and one branch each in
  `pricePrecedence.ts`, behind `prepaymentForProcedure` and `prepaymentStatusFor`; no surface
  re-implements them; the AR-28, AR-29 and AR-30 links are in the header comments.
- **Triggers and PWA.** Each entry shows only on its routes, the clock jump never rewinds, the
  stand-in is badged and sends one invoice, `pwaPurity` passes, seed determinism and the filler
  `rng()` order are unchanged, and `PERSIST_VERSION` is bumped.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry; ROADMAP.md "Owner review: agents test
  themselves"): the defaults built for open questions, the readings settled here, anything logged
  rather than fixed, and the screens worth a look, each with its route and persona:
  - D27 (OQ-92): a prepaid procedure with no price on the anaesthetist's own Contract warns the office
    and generates nothing until a price is added; never an estimate;
  - D30 (OQ-96): the price on a prepaid Procedure is locked at the prepaid amount, for the office
    override as well as the anaesthetist; any difference by hand;
  - D38 (OQ-80): the pair is created at generation as drafts and approval only sends it; no move
    touches it (41 adds the payee repoint);
  - the readings: a split Procedure is never prepaid; the requirement is the engine's, recorded on the
    Booking so a move changes nothing; the Contract selected decides the amount (no Contract, or
    another Contract, is "price needed"); a held invoice at authorise is withdrawn and the fixed price
    billed on the final invoice; a prepaid Procedure cancelled after sending is not deducted and waits
    for a credit by hand; a held invoice whose List moved stays with the first anaesthetist until a
    change re-derives it; the 7 and 2 day windows;
  - Riley seeded with no Contract (on "Needs a Contract") so S4 Beat 1 shows the office's setup.
- Status row for catch-up Phase 27, and a phase entry covering:
  - the drift-check result against `60e2d1e`; D5, D6 (as superseded), D20 (as superseded), D23 and
    D42 built as answered; OQ-04, OQ-38, OQ-61 and OQ-76 as answered; the D27, D30 and D38 defaults
    and where each lives;
  - what 15a to 26 were found to provide;
  - the session 1 and session 2 split and the adversarial pass;
  - the tests added (the rules, status, sync, approval, pair parity, warnings, pricing at the prepaid
    amount, the deduction, the locks, no move logic);
  - `PERSIST_VERSION` old to new; Riley's and Nair's re-pinned figures;
  - the Catalogue screenshots result: the recipes created or changed, the recipes this phase broke
    and how each was re-pointed, the stale captions replaced, the REPORT.md counts (captured,
    partial, absent, failed) before and after, and the partial reasons handed to Phase 41 (letters,
    trust hold, refund, the payee on a move, the by-hand routes);
  - handoffs: for 28, 31, 32 and 32a, `syncPrepayment` has no move cause and no move path may call it
    (D20), and 31's Draft List assignment calls it with `listAssigned`; for 36, `prepaymentStatusFor`
    and `settledByPrepayment` re-point to the ledger legs; for 38b and 39, a prepaid Procedure's price
    is locked, so the by-hand additional invoice and credit note are the only routes, and a
    `notNeeded` or `changedAfterSending` prepayment is the case they serve; for 41, the `approval`
    record (the letter joins Approve and send), the `draft` ACCREC, `generatePrepaymentInvoice` as the
    one place the pair is created (OQ-80), the held ACCPAY (trust hold), cancel keeping a sent
    invoice (refund), the payee repoint on a move (D38), and `prepaidAmountFor` for a replacement
    anaesthetist's fresh prepayment; for 43, generate prepaid Bookings through the same module.
- Decisions log:
  - **Superseded:**
    - Phase 09's open-question reading (1) (the office raises the pre-invoice by hand before the
      procedure), replaced by D6: generated by the engine at setup with its draft pair, held, sent on
      approval.
    - Phase 09 build decision (4) and the 8th review's typed "full | split" ruling: split balance =
      fee - deposit, full = an estimated fee, and Riley as a flat $1,200 fee. The prepaid amount is
      now the anaesthetist's own fixed price, in full.
    - The planned prepayment estimate (estimated duration, RVG time, two contingency units) and
      deposit, never built: retired with US-06.2.3 to US-06.2.5 (OQ-04, OQ-38).
    - Phase 20's interim office-set Booking flag, closed. The 7th review B6 "derived, never stored"
      ruling is refined: derived by the engine at setup and on a change, its result recorded so a
      move changes nothing; never set by a person.
    - 15a's provisional "strong" strength for the unpaid prepayment, replaced by the date escalation.
    - The overpaid prepayment's `negativeTotal` failure ("needs a manual credit") and the balance
      invoice after a prepaid procedure: a prepaid Procedure is priced at the prepaid amount and nets
      to zero, and nothing is raised automatically either way (OQ-61, US-06.4.1). The Phase 08
      `negativeTotal` belt stays for every other negative.
    - 22's `prepaidSplit` failure, replaced by the split exclusion and the re-keyed entry refusal.
  - **Readings settled here:** listed under "For the owner's review" above, plus: one line per
    prepaid Procedure on the Booking's record, behind `prepaymentForProcedure` (AR-30's link on the
    booking procedure); the prepayment invoice's note calls the amount the price.
  - **Answered, built as answered (no caption):** D5 / OQ-57, D6 / OQ-58 (as superseded), D20 / OQ-70
    (as superseded: honour system), D23 / OQ-73, D42 / OQ-91, OQ-04, OQ-38, OQ-61, OQ-76.
  - **Provisional (open questions built as their default):** D27 / OQ-92, D30 / OQ-96, D38 / OQ-80.
