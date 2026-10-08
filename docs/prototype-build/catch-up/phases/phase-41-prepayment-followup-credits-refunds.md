# Phase 41 · Prepayment letters, settlement by hand, trust account and refunds

**Requirements covered:**
[US-06.3.6](../../../../requirements-board/requirements/stories/US-06.3.6.md) (Proposed, graded Missing; changed at `60e2d1e`: every template states the prepaid amount as the price payable before the procedure, not an estimate, and may say a further invoice or a credit is possible; picked when an admin approves the generated prepayment invoice, plus the reminder that follows it up),
[FT-06.4](../../../../requirements-board/requirements/stories/FT-06.4.md) (Confirmed, graded Contradicts; changed: after a prepaid procedure the prepaid amount is the price, the recorded BTM is for reference, nothing is calculated or raised automatically in either direction and there is no threshold, the same for every fixed-price Contract; OQ-61 and OQ-76 answered. Phase 27 builds the pricing; this phase builds the by-hand routes on a prepaid Procedure and removes what is left of the July settlement model),
[US-06.4.1](../../../../requirements-board/requirements/stories/US-06.4.1.md) (Confirmed, graded Contradicts; retitled "No automatic invoice or credit after a prepaid procedure" and merged with the retired US-06.4.2: its pricing criteria are Phase 27's, its last criterion, an additional invoice or a credit note raised by hand and traceable to the Procedure, is closed here, with OQ-97's part credit as D31's default),
[FT-06.5](../../../../requirements-board/requirements/stories/FT-06.5.md) (Verify, graded Contradicts; changed: a moved Booking keeps its prepayment on an honour system, no logic detects the move, the payable update is OQ-80),
[US-06.5.1](../../../../requirements-board/requirements/stories/US-06.5.1.md) (Verify, graded Contradicts; held in trust until the procedure, payments out made from the system),
[US-06.5.2](../../../../requirements-board/requirements/stories/US-06.5.2.md) (Verify, graded Missing; refunded in full on cancellation, a credit linked to the prepayment invoice),
[US-06.5.3](../../../../requirements-board/requirements/stories/US-06.5.3.md) (Verify, graded Partial; changed: a true cancellation rebooked with another anaesthetist starts a fresh prepayment at **their own fixed price from their first-party Contract**, not an estimate at their unit value),
[US-06.5.4](../../../../requirements-board/requirements/stories/US-06.5.4.md) (Verify, graded Contradicts; changed: an honour system, the new anaesthetist claims no more than was prepaid and nothing detects the move or re-triggers a calculation; only the payable half of the draft pair is updated to the new anaesthetist, the receivable unchanged, and whether that update survives "no logic" is OQ-80, D38's default);
[DM-21](../analysis/domain-model-delta.md#dm-21) (trust account: prepayment held pending, refunded in
full on cancellation, kept when the Booking moves, only the payable's payee repointed).
Also builds, without closing them: the letter-template master part of
[DM-20](../analysis/domain-model-delta.md#dm-20) (the prepayment lifecycle, counted under Phase 27),
and the prepayment half of [DM-42](../analysis/domain-model-delta.md#dm-42) (which absorbed DM-06 at
`60e2d1e`: "its payable and any prepayment payee follow, with no recalculation"; counted under Phase
32a, which leaves the prepayment payee to this phase through one named hook). This finishes EP-06's
letters, settlement-by-hand, trust account, refund and move half. No reverse finding is closed here
([reverse check](../analysis/reverse-check.md)): RV-09 is Phase 27's.
**Left this phase at `60e2d1e`:** US-06.4.2 (Retired: merged into US-06.4.1, which now covers both
directions; Phase 27 marks its recipe Retired). Gone with it, and with OQ-61's and OQ-76's answers:
the planned balance invoice that cites the prepayment invoice, the "overpaid prepayment accepted"
surfaces, the `prepaidAboveFinal` / `prepaymentExcess` record, the fixed estimate notice in letters
and the agreed-rate settlement of a moved prepaid Procedure (`settlementUnitValueFor`). None was built.

**Owner decisions built as answered (no provisional label):**
- **D20, superseded 2026-10-08** (OQ-70, US-06.3.5, US-06.5.4): an honour system. A prepaid Booking
  moved to another anaesthetist, by a whole List or a single Booking, keeps the agreed amount; the
  anaesthetist who does it claims no more and wears or benefits from any difference in price. No
  logic detects the move, nothing is re-checked and nothing is recalculated: Phase 27 prices a
  prepaid Procedure at the prepaid amount, locked, whoever does it, so the old agreed-rate settlement
  is not needed. ~~The move re-checks the prepayment and only the payable half is updated~~.
- **D6, superseded 2026-10-08** (Phase 27): the prepaid amount is the anaesthetist's own fixed price
  from their first-party Contract, in full; generating the invoice creates its ledger pair and draft
  Xero pair; the admin's **Approve and send** only sends it (this phase adds the letter to that step);
  nothing is raised automatically after the procedure. ~~An estimate~~.
- **OQ-61 and OQ-76, answered 2026-10-06:** after a prepaid procedure the system raises nothing, in
  either direction, with no threshold; the anaesthetist or the office raises an additional invoice or
  a credit note by hand. This replaces OQ-03's "an overpayment is kept, never refunded" (OQ-03 is
  Answered with the same update). OQ-76's "all or nothing" stands: there is no partial prepayment.
- **D5** (no prepayment gate, a warning; 15a and 27), **D7** (the anaesthetist moves their own List or
  a single Booking with no confirmation; 32 and 32a), **D10** and **D13** (the free-form additional
  invoice, an event on the Procedure with one review step, also raised by the anaesthetist on their own
  Procedure; 38b), **D21** (OQ-71: a negative invoice with no later payment is handled outside the
  system; a cancelled prepayment is not that case, because the money is still in trust), **D22**
  (OQ-72 and OQ-77 parts 1 and 2: 39's credit note option to any party, the credit reversing the
  linked payable, paying no refund), **D23** (OQ-73: prepayment only where a person pays for the
  patient, so a refund always goes back to a person) and **D42** (OQ-91: the office keeps every
  first-party Contract; the rebook reads the replacement's). OQ-40 (held in trust until the procedure,
  refunded in full on cancellation), OQ-42 (a refund after payout is a credit note plus a negative
  invoice) and OQ-21 (its credit-and-re-prepay reading survives only as the rebook after a true
  cancellation) are answered too.

**Open, built as the default, labelled provisional and kept in one place each:**
- **D38** ([OQ-80](../../../../requirements-board/requirements/questions/OQ-80.md), refreshed
  2026-10-08): the pair, with its draft Xero pair, is created when the prepayment invoice is generated
  (Phase 27's `generatePrepaymentInvoice`); on a move before the procedure only the payable's payee is
  repointed, by one store action (item 12's `repointPrepaymentPayable`), with no recalculation and no
  re-check. Its doc comment names OQ-80 and D38; one "Provisional (OQ-80)" caption on the panel's
  "payee now" line.
- **D31** ([OQ-97](../../../../requirements-board/requirements/questions/OQ-97.md)): a credit note can
  be for a stated part of a prepayment invoice, reversing the same amount of the linked payable;
  credit in full and rebill (39) stays the route for corrections. One pure function (item 7's
  `statedCreditFor`) with a comment naming OQ-97 and D31; one "Provisional (OQ-97)" caption beside the
  part-credit amount field.
- [OQ-47](../../../../requirements-board/requirements/questions/OQ-47.md) (Proposed: Greg's weekly
  ISO-week cycle; trust payments to anaesthetists go out weekly): no separate trust payment cycle. A
  released prepayment payable joins 39a's next weekly run like any other; 39a holds the OQ-47 reading
  and its provisional chip. The trust account itself keeps one "To verify with AA" pill because
  FT-06.5 and US-06.5.x are Verify.
- **D30** ([OQ-96](../../../../requirements-board/requirements/questions/OQ-96.md), Phase 27's): the
  price on a prepaid Procedure is locked at the prepaid amount; any difference is raised by hand. This
  phase relies on it and builds nothing for it.

**Depends on:** Phase 27 (rebuilt 2026-10-08: the derived requirement and the stored record; the
prepaid amount from the anaesthetist's own first-party Contract (`prepaidAmountFor`, `ownFixedPriceFor`
through 19a); `syncPrepayment(api, bookingId, cause)` with the causes `bookingCreated |
procedureChanged | contractChanged | payerChanged | prepaidSetChanged | bookingCancelled |
listAssigned | listAuthorised` and **no move cause**; `generatePrepaymentInvoice`, the one place the
pair and its draft Xero pair are created (OQ-80); `approvePrepaymentInvoice` ("Approve and send") and
every surface that calls it; `prepaymentBasisAnaesthetist`; `prepaymentStatusFor` with part paid,
`notNeeded` and `changedAfterSending`; `prepaymentForProcedure`; the prepaid Procedure priced at the
prepaid amount, source `prepaidAmount`, locked (D30), with the recorded BTM for reference; the
deduction line "Less prepayment already invoiced, {number}" and `settledByPrepayment`; cancel keeping
a sent invoice for this phase's refund), Phase 32a (`moveBookingToAnaesthetist`, its
`booking.movedToAnaesthetist` audit, and **the one named after-commit hook it left for this phase**,
32's own or `afterAnaesthetistMove(api, bookingIds, cause)` in `listMoveActions.ts`, called from its
move and from 32's List moves `moveListToOffice`, `pushListToSlot` and `markUnavailableAndMoveList`
(`list.ownerMove`), with one store test pinning the original payee "until 41 fills the hook"),
Phase 39 (credit notes: `submitCredit` with its `kindNotCreditable` refusal on prepayment invoices
"Phase 41 with OQ-97", the credit event on 38b's element, `issueCreditInto`, pure `creditInFull`,
`reversalPlan` with the credited amount as an explicit input "so Phase 41's part credit adds a stated
amount without reshaping the plan", `applyCredit`, `heldForPayer`, the `NegativeInvoice`,
`handoffCorrection`, the credit-note document, the shared `CreditForm` (`src/shared/booking/`, the
anaesthetist's mobile and web wrappers; its "Crediting a prepayment invoice is not in this prototype
yet." refusal) and the
`canSplitCombined` prepaid refusal) and Phase 39a (the weekly `PayablesRun` record with its
approve-for-payment step, and `runExclusionFor`, the one exclusion point it left for this phase's
`'heldInTrust'`; `buildWeekRun` and the backdrop weekly runs it built from the seeded disbursements,
including Week 29 with Dr Souter's pa01 on 15 Jul and the seeded prepayment payout on 16 Jul,
formerly `PR-SEED-01`).
Through them: 38b's event element, review step, `runEventInvoicing`, the additional invoice
(`liveInvoiceForProcedure` falls back to the prepayment invoice on a fully prepaid Booking) and its
anaesthetist entry; 38a's archive and search (the anaesthetist reaches an invoiced Booking only
there); 36's `LedgerPair` (`kind: 'prePayment'`), `applyReceipt`, `ledgerPosition`, `ledgerChecks`
and the Admin Ledger screen; 25's pricing snapshot and lock payee; 22's delivery, `supplier`,
`lineage` and the Related invoices rail card; 21's payer on the Booking and `invoiceEmail`; 26's
prepaid sets; 19a's first-party Contracts; 17's not-preferred warning helper; 16's
`payableReleasedFor`; 15a's warning routine; 14's trigger registry, actors and office stand-ins.
**Also uses, by build order rather than as formal dependencies** (numbered before 41 but not reached
through 27, 32a, 39 or 39a, so confirm in PROGRESS that each is DONE): 35's admin save path (the
"Stage longer prepaid procedure" trigger commits through it if admin edits are change sets), 31's
`assignDraftList` and 28's `reassignList` / `moveListToSlot` (office moves that also repoint), and
40's patient follow-up log. If 40 is not done, skip item 6's follow-up bullet and record it.
**Estimated:** 2 sessions. Session 1: work items 1 to 10 (figures pinned, letters end to end, the
reminder, settlement by hand on a prepaid Procedure with the part credit, the trust hold with its
release at authorise, and the reseed), ending green with shots. Session 2: items 11 to 21 (the payee
repoint on every move, the trust account view, refund on cancellation, the payout, the rebook, the
Xero sim, triggers, PWA stand-ins and the demo guide). If session 2 runs long, land the repoint (item
12) and the refund and payout (items 14 and 15) green first, and build the rebook (item 16) last.

## Goal

Finish the prepayment story. Most of it is Verify, so keep it thin, and build what the catalogue now
says: nothing about a prepayment is calculated or raised automatically after it is sent.

- **Letters (US-06.3.6).** When an admin approves a generated prepayment invoice to send (27's
  "Approve and send"), they pick one of a small set of standard letter templates and see a preview.
  The letter goes out with the invoice. Every template states the prepaid amount as **the price
  payable before the procedure, never as an estimate** (no "estimate", "deposit" or "may be higher or
  lower"), and may say that if the procedure turns out very different from what was planned, the
  anaesthetist may raise a further invoice or a credit. Merge fields: patient, procedure, the prepaid
  amount, anaesthetist (plus the date, the invoice number and, for a reminder, the amount still
  owed). Admins maintain the templates in Master data. "Send prepayment reminder" on the Booking sends
  a reminder letter for an unpaid or part-paid prepayment.
- **Settlement with nothing automatic (FT-06.4, US-06.4.1; OQ-61 and OQ-76 answered).** Phase 27
  prices a prepaid Procedure at the prepaid amount, locked, and its deduction leaves nothing to bill.
  This phase makes that visible and offers the routes by hand. On a prepaid Procedure the Booking (all
  three apps) shows the prepaid amount as the price, the BTM units recorded on the day for reference
  only, and "Nothing is invoiced or credited automatically", with two by-hand actions for the
  anaesthetist (own Procedure) and the office, each recorded as an event on the Procedure and traceable
  to it: Phase 38b's **Create additional invoice** and Phase 39's **Credit note**, which now accepts a
  prepayment invoice. Per OQ-97's default (D31) that credit note may be for a stated part of the
  prepayment invoice, reversing the same amount of the linked payable. There is no threshold, no
  balance invoice and no "overpaid" state, and the same holds for every fixed-price Contract (24 and
  27 price them; nothing here computes a difference). The last July wording ("deposit", "estimate",
  "balance", "remaining", "top-up", "manual credit") goes from the prepayment surfaces.
- **Held in trust until the procedure (OQ-40 answered, US-06.5.1).** Prepayment money received sits in
  AA's trust account as a pending payment. Its payable is not released, and so never reaches a weekly
  payment run, until the Booking's List is AUTHORISED. It is then released to whoever did the
  procedure (25's lock payee) and paid in the next weekly run (39a). The trust account view shows
  prepayments held, released, credited, refunds due and refunds paid.
- **Refund on cancellation (US-06.5.2).** Cancelling a Booking with a paid prepayment refunds it in
  full from the trust account: a credit against the prepayment invoice through 39's credit path
  (linked in the ledger to the original invoice), a refund due, and the payout recorded from the
  system (US-06.5.1: payments out of the trust account are made from the system). Because the money
  was held, the anaesthetist was never paid, so there is nothing to recover. This is not 39's credit
  note option, which pays no refund (US-08.6.5: "One's cash, one's not").
- **Moved prepaid Booking (US-06.5.4, D20, D38).** A prepaid Booking moved to another anaesthetist
  before the procedure, as a whole List (32, or the office's reassign) or a single Booking (32a, or
  the office's Booking move), is not billed again and nothing is recalculated. Per OQ-80's default,
  only the payee of the prepayment's payable (the ledger's payable leg and the draft Xero ACCPAY) is
  repointed to the anaesthetist who now holds it, by one store action called from the move paths'
  one hook; the receivable leg, the prepayment invoice and the draft ACCREC are unchanged, so the Xero
  trust account balances. At authorise the Procedure is priced at the prepaid amount (27), so the
  anaesthetist who does it is paid the prepaid amount and wears or benefits from any difference.
- **Rebook after a true cancellation (US-06.5.3).** "Rebook with another anaesthetist" on a cancelled
  Booking creates a new Booking under the replacement. Phase 27's engine generates a fresh prepayment
  at **their own fixed price from their first-party Contract**, held for Approve and send. The
  original is refunded, never transferred, and both amounts are visible.
- **No pricing structure is built here.** The prepaid amount, the price step and the deduction live
  in Phase 27's `domain/billing/prepayment.ts` and 24's `pricePrecedence.ts`, the one place the
  draft technical design v4 shapes ([AR-29](../../../../requirements-board/requirements/artifacts/AR-29.md)
  `#prepayment`, `#price-precedence`); this phase reads them through 27's selectors and adds no second
  price rule, so a v5 of the design stays a contained edit there. The plain-language guide
  [AR-28](../../../../requirements-board/requirements/artifacts/AR-28.md) `#prepaid-already-agreed`
  (held in trust) and the first bullet of `#prepaid-proposed` (the prepaid amount is the price, BTM
  for reference) hold as written; its second bullet (invoice the difference) was not adopted (OQ-61).

> Names below are the names Phases 15 to 39a planned (`Booking`, `bookingId`, `BookingDetailBody`,
> `CancelBookingSheet`, `createBooking` in `store/bookingActions.ts`, `syncPrepayment`,
> `approvePrepaymentInvoice`, `prepaymentStatusFor`, `prepaymentForProcedure`, `LedgerPair`,
> `ledgerPosition`, `moveBookingToAnaesthetist`, `moveListToOffice`, `pushListToSlot`,
> `markUnavailableAndMoveList`, `afterAnaesthetistMove`). Phase 39 planned its credit as a 38b event
> of kind `'credit'` (`CreditEventDetail`, with a `cause: 'correction' | 'split'`) raised by
> `submitCredit`, reviewed through 38b's standard step and issued by the in-commit helper
> `issueCreditInto(draft, creditEventId, atISO)` from 38b's `runEventInvoicing`, producing a
> `CreditNote` record in `billing.creditNotes` (`originalInvoiceId`) and a `NegativeInvoice` (`status:
> 'offset' | 'toNet'`); pure `creditInFull`, `reversalPlan` and `xeroCorrectionPlan` in
> `domain/billing/creditNote.ts`; `applyCredit` in 36's `ledger.ts` (the pair gains `credit: {
> creditNoteId; atISO; heldForPayer; recoveryDue }`); `ledgerPosition` totals `creditsHeldForPayers`
> and `recoveryDueFromAnaesthetists`; `handoffCorrection(api, creditNoteId)` for the Xero mirror; and
> the credit-note document at `/admin/credit-notes/:creditNoteId`. Phase 39a planned the
> `PayablesRun` record, its approval step and netting. Use what their PROGRESS entries record where it
> differs. Where this plan says "39's credit path" it means that single path, which this phase widens
> (prepayment invoices, a stated amount, a new `cause`) and never copies.

## Before you start: drift check

1. Run the catalogue diff for this phase's items, its context and its open questions against the
   plan's baseline, catalogue commit `60e2d1e` (rename-aware; never a plain `git diff` of the
   catalogue folder):

   ```
   node docs/prototype-build/catch-up/tools/plan-state.mjs --diff US-06.3.6,FT-06.4,US-06.4.1,FT-06.5,US-06.5.1,US-06.5.2,US-06.5.3,US-06.5.4,US-06.4.2,US-06.2.2,US-06.3.1,US-06.3.2,US-06.3.5,US-03.1.8,US-08.2.2,US-08.6.2,US-08.6.3,US-08.6.5,US-04.2.14,US-09.1.3,US-10.2.1,US-10.2.6,US-10.2.7,US-01.4.6,US-01.4.7,US-01.4.3,US-01.5.5,US-02.5.3,FT-08.3,OQ-03,OQ-21,OQ-40,OQ-42,OQ-47,OQ-61,OQ-70,OQ-71,OQ-73,OQ-76,OQ-80,OQ-96,OQ-97
   ```

   At plan time (2026-10-08, `3d3a18c..60e2d1e`) the changes that touch this phase were: US-06.3.6's
   templates now state the prepaid amount as the price, not an estimate, and may mention a further
   invoice or credit; FT-06.4 and US-06.4.1 were rewritten to "nothing automatic, by hand, no
   threshold" (both now Confirmed) and US-06.4.2 was retired into US-06.4.1; FT-06.5 and US-06.5.4
   moved to an honour system with no move detection and kept the payable update as OQ-80; US-06.5.3's
   fresh prepayment is now the replacement's own fixed price from their first-party Contract;
   US-06.5.1 and US-06.5.2 changed only in links. Around them: US-06.2.3 to US-06.2.5 retired (no
   estimate), US-06.2.2 became the first-party fixed price, US-06.3.5 dropped the re-check on a move,
   US-08.6.3 and US-08.6.5 gained the anaesthetist's own by-hand invoice and credit, US-10.2.7 added
   the weekly cycle. OQ-61, OQ-76 and OQ-91 were answered, OQ-03 updated; OQ-96 and OQ-97 are new and
   open; OQ-80 was refreshed and is still open; OQ-47 is Proposed. The plan already reflects all of
   this; diff only for anything after `60e2d1e`.
2. If an item changed since `60e2d1e`, re-read it and adjust the work items. If one is now Retired or
   Future, drop it and record that in the PROGRESS entry. Check that US-06.4.2 is still Retired.
   **Stop and tell the owner** if US-06.5.4 or US-06.3.5 brings back a re-check or a recalculation on
   a move, or if OQ-61 or OQ-76 is reopened toward an automatic balance invoice or credit: either
   reverses this phase's shape.
3. **Owner decisions** (ROADMAP.md table). D5, D6 (as superseded), D7, D10, D13, D20 (as superseded),
   D21, D22, D23 and D42 are built as answered. Confirm from the PROGRESS entries that:
   - 27's "Approve and send" is the single send path (the letter picker joins it here), and the
     engine generates a held invoice for any new Booking that needs prepayment, at the anaesthetist's
     own fixed price (the rebook relies on it);
   - no move path calls 27's `syncPrepayment` (it has no move cause) and none writes the prepayment
     record, invoice or pair (D20); 32a's store test pins the original payee after a move;
   - 32a left **one** named after-commit hook (32's own or `afterAnaesthetistMove`) called once per
     move from `moveBookingToAnaesthetist` (`'bookingMoved'`) and from 32's `moveListToOffice`,
     `pushListToSlot` and `markUnavailableAndMoveList` (`'listMoved'`). Item 12 fills it and routes
     the office's moves (`reassignBooking`, `reassignList` / 28's `moveListToSlot`, 31's
     `assignDraftList`) through the same hook. A path that skips the hook is fixed in that path, never
     given a second trigger.
4. **Open questions.** OQ-03, OQ-21, OQ-40, OQ-42, OQ-61, OQ-70, OQ-71, OQ-73 and OQ-76 are Answered
   at `60e2d1e`; build the answers with no label. If one has been reopened since, build the plan as
   written, label that point provisional in one place, and put it first on the "For the owner's
   review" list. Still open, build the default, label it provisional in one place, log it:

   | OQ | Build (default, kept in one place) | If answered differently |
   |---|---|---|
   | **OQ-80** (D38: when the pair is created and amended) | Created at generation (27's `generatePrepaymentInvoice`); on a move before the procedure only the payable's payee is repointed (item 12's `repointPrepaymentPayable`, one doc comment naming OQ-80 and D38, one provisional caption). A cancellation credits both halves (item 14); the release at authorise stamps the lock payee (item 8) | "No update on a move" (the honour system read strictly): empty the hook body and drop the caption; the release at authorise still pays the doer. "Create the pair when the money is received": 27's generation and item 12 both move to the receipt. Change the two functions, not the callers |
   | **OQ-97** (D31: a credit note for part of a prepayment) | Allowed for a stated amount against a prepayment invoice, reversing the same amount of the linked payable (item 7's `statedCreditFor`, one comment, one provisional caption); credit in full and rebill stays the route for corrections | "Full credit and a new invoice for the lower amount": `statedCreditFor` refuses any amount but the total, the field goes, and the anaesthetist uses 39's credit with an added invoice. Nothing else moves |
   | **OQ-47** (payment day and cycle; Proposed) | No separate trust payment cycle. A released prepayment payable joins 39a's next weekly run; 39a holds the reading | A separate trust cycle: a run setting on 39a's record, not a change here |
   | **OQ-96** (D30, 27's) | The price on a prepaid Procedure is locked at the prepaid amount (27) | 27's lock changes; this phase's by-hand routes stay |

5. **Read what Phases 14, 15, 15a, 15b, 16, 22, 25, 26, 27, 28, 31, 32, 32a, 35, 36, 38a, 38b, 39,
   39a and 40 actually built** (their PROGRESS entries):
   - 14: the registry entry shape (`id`, `routes`, `surfaces`, `badge`, `choices`, `disabledReason`),
     `OFFICE_ACTOR` and `OFFICE_SIMULATION_ACTOR` in `store/demoActors.ts`, and `officeStandIn.ts`.
   - 15 and 15b: `store/bookingActions.ts` with `createBooking`, `shared/booking/`,
     `AdminBookingDetail`, `seed/bookings.ts`, `BookingCancellation`, `BookingSource`; Copy a Booking
     is gone (the rebook never copies) and assigned Lists are ACTIVE.
   - 16: `payableReleasedFor` (`domain/billing/payableRelease.ts`), the one release rule the hold
     extends.
   - 22: `InvoiceDelivery` and sends, the invoice `supplier` (the anaesthetist in whose name it is
     issued), `lineage`, and the Related invoices rail card.
   - 25: the lock's `payee` (the anaesthetist who did it), which item 8's release stamps.
   - 26 and 19a: which anaesthetists have prepaid sets and first-party Contracts (Dr Souter's own price
     list, Rhinoplasty $1,200; whether any colleague has one), `ownFixedPriceFor`.
   - 27: the `BookingPrepayment` shape, `syncPrepayment` and its causes and outcomes,
     `approvePrepaymentInvoice` and every surface that calls it (panel, rail card, Invoices strip,
     invoice document, the PWA stand-in), `Invoice.approval`, the status set (including `notNeeded`
     and `changedAfterSending`), `PrepaymentPanel` and its prepaid amount line,
     `prepaymentForProcedure`, `prepaymentBasisAnaesthetist`, where the recorded BTM is shown "for
     reference", the price source `prepaidAmount`, `settledByPrepayment`, the deduction line, which
     invoices count as live (withdrawn never counts), the copy spelling it shipped ("prepayment" or
     "pre-payment": this phase follows it), and the seeded Riley and Nair figures.
   - 28 and 31: `moveListToSlot`, `reassignList` over it, `assignDraftList`, which ACTIVE Lists exist
     on Fri 24 Jul and later.
   - 32 and 32a: the hook's name and callers, its doc comment, `booking.movedToAnaesthetist`,
     `list.ownerMove`, the move sheets on mobile and web and their confirm lines, the PWA colleague
     stand-ins, and the store test that pins the original payee.
   - 35: whether admin edits commit through a draft-then-save change set, which the "Stage longer
     prepaid procedure" trigger must then use instead of calling `editProcedure` directly.
   - 36: `PayableLeg`, `applyReceipt`, `ledgerChecks` (`releasedNotReceived`), `ledgerPosition`,
     `anaesthetistPosition`, whether the pair carries its own `anaesthetistId` beside the payable leg's,
     the Ledger routes and the footnote that says receipts held include prepayments.
   - 38a: how the anaesthetist reaches an invoiced Booking (archive, search), where the by-hand
     actions sit on it.
   - 38b and 39: the event element, `runEventInvoicing`, the additional invoice on a fully prepaid
     Booking (`liveInvoiceForProcedure`), the anaesthetist's entry, `submitCredit` and its refusals
     (`kindNotCreditable`, `alreadyCredited`, `notOwnProcedure`), `creditInFull`, `reversalPlan`'s
     explicit credited amount, `applyCredit`, `heldForPayer`, the `NegativeInvoice`,
     `xeroCorrectionPlan` (a draft ACCPAY with nothing authorised is voided), whether `issueCreditInto`
     can be called from another commit, `handoffCorrection`, the credit-note document, the
     shared `CreditForm` with its mobile and web wrappers, and the PWA stand-ins "Office reviews this additional invoice" and
     "Office reviews this credit".
   - 39a: the `PayablesRun` record, `buildWeekRun` and how a run selects payables, `runExclusionFor`,
     the period approval step, the remittance advice, the backdrop weekly runs (Week 29 holds the
     seeded prepayment payout, formerly `PR-SEED-01`) and
     the payables screen's run table.
   - 40: the patient follow-up log (`PatientFollowUp`, `logPatientFollowUp`) and the patient's credit
     balance (a part credit held for the payer shows there).
   Adjust the work items to reuse what exists instead of adding a second copy.
6. Note the current `PERSIST_VERSION` (16 after 15a session 1; 15b to 40 will have raised it).
7. Record the result (including "no drift", the OQ states, what 27, 32, 32a, 36, 38b, 39 and 39a
   provide and the hook's callers) in the PROGRESS entry.

## Reference

- **Design** (convention 17):
  - `docs/design/Design Language.dc.html`: semantic tints (success for refunded, released and paid,
    warning for refund due and awaiting bank, info or neutral for held in trust and the "for
    reference" BTM line), neutral pills for letter, credit and refund states, Spline Sans Mono with
    tabular-nums for every amount, unit count and every invoice, credit-note and refund number,
    radius 14 cards, and teal as the only action colour. Crimson appears only in the side nav's
    active state and avatars, never on the letter preview, the settlement block, the refund section,
    the trust tiles or any button.
  - `docs/design/Admin Review.dc.html`: the stat-tile row (the trust account tiles), the table (the
    trust movements and the letter template list) and the flag chips.
  - `docs/design/Admin Day.dc.html`: the right-rail white cards (27's "Prepayments" rows gain a
    "Reminded" line) and the dark side nav (the Ledger badge counts refunds to action).
  - `docs/design/Mobile App.dc.html`: the Booking detail white cards and the bottom-sheet pattern
    (the settlement block, the anaesthetist's cancel sheet note, 32's and 32a's move sheets, the
    trust and refund lines on the panel, the part-credit field in 39's credit sheet).
  - No mockup covers a letter, a template editor or a trust account. Extend the Admin Review tiles and
    table and the invoice document's paper layout; do not invent a new visual language.
- **Catalogue:** the covered files above, plus US-06.4.2 (Retired), US-06.2.2, US-06.3.1, US-06.3.2,
  US-06.3.5, US-03.1.8, US-08.2.2, US-08.6.2, US-08.6.3, US-08.6.5, US-04.2.14, US-09.1.3, US-10.2.1,
  US-10.2.7, US-01.4.6, US-01.4.7, US-02.5.3; OQ-03, OQ-21, OQ-40, OQ-42, OQ-61, OQ-70, OQ-71, OQ-73
  and OQ-76 (answered), OQ-80, OQ-96 and OQ-97 (open) and OQ-47 (Proposed); the evidence notes
  `requirements-board/requirements/notes/2026-10-01-aa-meeting-with-greg.md` (points #2, #16, #18,
  #32 (the templated letter at approval) and #57),
  `requirements-board/requirements/notes/2026-10-02-aa-meeting-with-greg.md` (points #11 (OQ-70: only
  one half moves; "the trust account in Xero always has to balance"), #12 (OQ-71), #33 (a credit note
  is not a refund) and #47 (OQ-80)), the 2026-10-06 directors' meeting note (#1, #2, #10: nothing
  automatic, the honour system, "no logic to detect any of these flows") and the 2026-10-07 pricing
  model documents note (#15) (read the cited passages with
  `npm --prefix requirements-board run source -- --item US-06.4.1 --text` and the same for US-06.5.4
  and US-06.3.6); and `domain-model.md` (Prepayment, and the glossary rows "Prepayment" and "Trust
  account"). Artifacts the items link: [AR-04](../../../../requirements-board/requirements/artifacts/AR-04.md)
  `#reassignment-difference` (a replacement anaesthetist wears the difference, US-06.5.4),
  [AR-24](../../../../requirements-board/requirements/artifacts/AR-24.md) `#prepayment-payment`
  (approved, sent, paid into trust and reconciled, US-06.3.6) and `#prepayment-pair-undecided` (OQ-80),
  [AR-28](../../../../requirements-board/requirements/artifacts/AR-28.md) `#prepaid-already-agreed` and
  `#prepaid-proposed`, [AR-29](../../../../requirements-board/requirements/artifacts/AR-29.md)
  `#prepayment` (US-06.4.1).
- **Gap analysis:**
  - `GAP-ANALYSIS.md`: Summary, theme 5 ("Prepayment reversed"), "Structural first" (DM-22 before
    DM-21), the Prepayment trigger cluster, and the Uncertainty bullets on OQ-80 and OQ-97.
  - `epics/EP-06.md`: EP-06, US-06.3.6, FT-06.4, US-06.4.1, FT-06.5, US-06.5.1 to US-06.5.4.
  - `gaps.json` entries (re-graded at `60e2d1e`):
    - US-06.3.6 is Missing (no letter or template concept);
    - FT-06.4 and US-06.4.1 are Contradicts: the run bills the BTM-priced fee less the prepayment, so a
      difference is invoiced or goes negative, and no additional invoice or credit note exists (27
      makes the prepaid Procedure price at the prepaid amount; 38b and 39 build the routes; this
      phase closes the last criterion on a prepaid Procedure);
    - FT-06.5 and US-06.5.1 are Contradicts: the prepayment payable is authorised on receipt and paid
      out before the procedure (seeded disbursement 16 Jul for a 24 Jul procedure);
    - US-06.5.2 is Missing; US-06.5.3 is Partial (a new Booking gets its own prepayment, but at an
      estimate, not the replacement's first-party fixed price, and nothing refunds the original);
    - US-06.5.4 is Contradicts: the payable is not repointed, and the balance run re-prices a moved
      Booking at the new anaesthetist's fee and bills the difference, breaking the honour system (27's
      pricing at the prepaid amount answers the second half; item 12 the first).
  - `analysis/domain-model-delta.md`: DM-20, DM-21, DM-22 (the ledger), DM-24 (credit and rebill) and
    DM-42 (the single-Booking move, which now holds DM-06's "the payable follows the doer").
- **Code entry points** (line numbers from `analysis/prototype-map-*.md` and the code at 15a session
  1; every file has moved through 15b to 40):
  - `src/domain/types.ts`: `Booking` (27's `prepayment`, 15's `BookingSource`),
    `BookingCancellation`, `Invoice` (27's `approval`, 22's `delivery`, `supplier` and `lineage`), the
    Xero types (`XeroAccPay.amountAuthorised`), 36's `LedgerPair`, `PayableLeg`, `LedgerReceipt`,
    `LedgerDisbursement`, 38b's event types, 39's `CreditEventDetail`, `CreditNote` and
    `XeroCreditNote`, 39a's `PayablesRun`, `DemoSettings`.
  - `src/domain/billing/`: 16's `payableRelease.ts`, `invoiceBuild.ts` (27's deduction line and the
    `negativeTotal` message, about 418 at 15a, which said "an overpaid pre-payment needs a manual
    credit"), 27's `prepayment.ts`, 24's `pricePrecedence.ts`, 36's `ledger.ts`, 39's
    `creditNote.ts`, 22's `invoicePresentation.ts`, `money.ts`, `index.ts`.
  - `src/store/`:
    - `lifecycle.ts`: `cancelBooking` 348, `reassignList` 543, `reassignBooking` 635, `authoriseList`
      262;
    - 28's `slotActions.ts` (`moveListToSlot`), 31's Draft List actions (`assignDraftList`), 32's
      `listMoveActions.ts` (the hook, `ownMoveCore`) and 32a's `moveBookingToAnaesthetist`;
    - `paymentActions.ts` (header 1 to 30: the ACCPAY authorised pro rata on receipt, which the hold
      stops for prepayment pairs); `payablesActions.ts` (`runPayables`; 39a's run);
    - `prepaymentActions.ts` (27's actions and `syncPrepayment`); `billingRun.ts`
      (`runBillingForList`, 27's `settledByPrepayment`);
    - 38b's event actions, 39's `creditActions.ts`; 36's `ledgerActions.ts` and `ledgerSelectors.ts`;
    - `xeroHandoff.ts` (the ACCPAY contact fixed to the original anaesthetist at handoff, 168 to 202;
      39's `handoffCorrection`);
    - `bookingActions.ts` (`createBooking`); `mastersActions.ts`; `mutate.ts` (`ID_FORMATS`,
      `resetDomainState`);
    - `officeStandIn.ts` and `demoActors.ts` (14); `selectors.ts` (`prepaymentStatusFor`).
  - `src/shared/booking/`: `BookingDetailBody` and 27's `PrepaymentPanel`; 38b's events list and
    additional-invoice entry; `src/shared/flows/CancelBookingSheet.tsx`, 39's
    `CreditForm` (with its mobile and web wrappers), `flows/index.ts`; `src/shared/audit/actionLabels.ts`, `fieldLabels.ts`,
    `auditNarrative.ts`; `src/shared/format.ts` (`drSurname`, `nameWithoutTitle`, the money
    formatter); `src/shared/demoTriggers/` (`registry.ts`, `types.ts`, `context.ts`).
  - `src/apps/admin/`: `screens/AdminBookingDetail.tsx`, `screens/MasterData.tsx` (left sub-nav; 27's
    "Prepayment" section), `screens/InvoiceDocument.tsx` (any leftover balance note: "This procedure
    was pre-paid; this invoice covers any remaining balance." and the split-deposit branch at 513 to
    514 at 15a), 39's `CreditSheet` and credit-note document, `screens/ReviewScreen.tsx`,
    `reviewFlags.ts`, 39a's payables screen, 36's `screens/LedgerScreen.tsx`,
    `components/SideNav.tsx`, `components/RightRail.tsx`, `flows/ReassignListFlow.tsx`,
    `flows/MoveBookingFlow.tsx`, `routes.tsx`, `src/router.tsx`.
  - `src/apps/mobile/` and `src/apps/web/`: 32's List move sheet and 32a's "Move to a colleague"
    sheet, 38a's archive Booking view, web Accounts and mobile Balances (the anaesthetist's held
    prepayments line).
  - `src/apps/demo/DemoXero.tsx` (`PairDetail`, 39's credit-note panel), `xeroPairView.ts`,
    `DemoControlPanel.tsx` (the S4 scenario text).
  - Seed: `src/domain/seed/bookings.ts` (Riley on Souter Fri 24 AM, Nair on Souter Fri 24 PM),
    `index.ts` (`SEED_MARKERS`), `billing.ts` (`buildSeedBillingSlice`, the paid INV0001 / BC0001
    prepayment, $1,200.00 ex GST since 27, disbursed by `SEED_PREPAYMENT_DISBURSED_ISO =
    '2026-07-16T09:00:00'` at 65, 218 and 245 at 15a, backdrop run `PR-SEED-01`), `cast.ts` (26's
    prepaid sets), 19a's first-party Contract seed (Dr Souter's own price list).
  - Tests: `prepayment.test.ts`, `prePaymentInvoice.test.ts`, `billingRun.test.ts`, 38b's event tests,
    39's credit tests, `ledger.test.ts`, `lifecycle.test.ts`, 32's `listMoveActions.test.ts` and 32a's
    move tests (the pinned payee), `seedBilling.test.ts`, `seed.test.ts`, `demoScenarios.test.ts`,
    `persistMigrate.test.ts`, `pwaPurity`, `xeroPairView.test.ts`, `DemoXero.test.tsx`,
    `mastersActions.test.ts`, `ReassignListFlow.test.tsx`. Shots: 27's prepayment specs, 36's
    `admin-ledger.spec.ts`, `xero-pair.spec.ts`, 38b's and 39's event and credit specs. Capture
    recipes: see "Catalogue screenshots".

## Work items

**Session 1: letters, the reminder, settlement by hand and the trust hold.**

1. **Pin the figures first.** Before changing code, add `src/store/prepaymentFollowupParity.test.ts`,
   keyed on invoice numbers and Booking ids, never on pair or credit ids. From the current build,
   capture:
   - the S3 invoice totals, the S4 beats' figures, 38b's additional invoice and 39's credit-and-rebill
     figures, and 39a's weekly run figures;
   - Riley's and Nair's prepayment statuses and amounts (27: Riley `priceNeeded` until S4 Beat 1
     sets her own Contract, then $1,200.00; Nair's INV0001 paid, $1,200.00 ex GST), and Nair's
     `settledByPrepayment` after authorising Souter Fri 24 PM with the seeded times (nothing billed for
     the rhinoplasty; Forte's septoplasty invoice);
   - `ledgerPosition` of the seed and of each seeded anaesthetist with money (36), including
     `imbalance` 0 and no checks;
   - every seeded Booking's `prepaymentStatusFor`.
   Item 9's reseed (Nair's prepayment no longer disbursed on 16 Jul) moves Souter's paid-out total, the
   seeded Week 29 backdrop run and its remittance, and the ledger's prepayment totals on purpose. Re-pin those there, with the
   reason; everything else must pass unchanged at the end of session 1.
2. **Types, session 1 part** (`domain/types.ts`; DM-20's letter master, DM-21's hold, D31):
   - `LetterMergeField = 'patientName' | 'procedure' | 'procedureDate' | 'prepaidAmount' |
     'anaesthetist' | 'invoiceNumber' | 'amountOutstanding'`. The catalogue's four (patient, procedure,
     prepaid amount, anaesthetist) plus the date; `invoiceNumber` and `amountOutstanding` exist because
     the letter goes out with the invoice and the reminder names what is still owed.
   - `PrepaymentLetterTemplate = { id; kind: 'request' | 'reminder'; name; body; isDefault: boolean;
     active: boolean; updatedBy?; updatedAtISO? }`, held in `masters.prepaymentLetterTemplates`.
     `body` is plain text with `{{field}}` placeholders; no HTML, no rich text.
   - `RenderedLetter = { templateId; templateName; kind; body; renderedAtISO }`: a snapshot, so a later
     template edit never changes a letter already sent.
   - `Invoice` gains `letter?: RenderedLetter` (set on a prepayment invoice when approved and sent) and
     `prepaymentReminders?: { atISO; by; to; letter: RenderedLetter; amountOutstanding }[]`.
   - 39's credit input and records gain the stated amount (D31): `CreditEventDetail.amount?` and
     `CreditNote.partOf?: { invoiceTotal; creditedAmount }` (absent means credited in full). Only a
     prepayment invoice may carry a stated amount (item 7).
   - 36's `prePayment` `LedgerPair` gains `trustRelease?: { atISO; payeeAnaesthetistId; cause:
     'authorised' }`. An issued (approved and sent) prepayment pair with no `trustRelease` and not
     credited in full is **held in trust**. Derive it; never store a second "held" flag. Keep the
     words apart in code and copy: 27's "Awaiting approval" invoice is not in trust and never summed;
     "held in trust" is a sent one.
   - `ID_FORMATS` (`mutate.ts`): `letterTemplate` (`LT`, pad 3). Thread the new master through the
     empty slices, `freshAppState`, `resetDomainState` and the seed slice types.
3. **Pure letter module** (`domain/billing/prepaymentLetter.ts`, exported from the billing index,
   with `prepaymentLetter.test.ts`; US-06.3.6):
   - `LETTER_MERGE_FIELDS`: the field list with a label each ("Patient name", "Procedure", "Procedure
     date", "Prepaid amount", "Anaesthetist", "Invoice number", "Amount outstanding").
   - `validateLetterTemplate(t)`: refusals `emptyName`, `nameTooLong` (60), `emptyBody`, `bodyTooLong`
     (2,000 characters), `unknownMergeField` (names the field, for example `{{estimate}}`),
     `missingPrepaidAmount` (a request template must contain `{{prepaidAmount}}`),
     `missingAmountOutstanding` (a reminder must contain `{{amountOutstanding}}`), and
     `estimateWording` (the body contains "estimate", "estimated", "deposit" or "may be higher or
     lower", case-insensitive: "State the prepaid amount as the price payable, not an estimate."). This
     one rule is what makes every template state the amount as the price (US-06.3.6 paragraph 2); there
     is no fixed paragraph appended, so a template may, but need not, say a further invoice or credit
     is possible.
   - `renderPrepaymentLetter(template, data: Record<LetterMergeField, string>)`: replaces every
     placeholder and returns the body. Missing data renders as a visible "[not set]" rather than an
     empty gap. Pure, no clock: the caller stamps `renderedAtISO`.
   - The store builds `data` in a selector `letterMergeDataFor(state, bookingId, invoiceId?)`:
     - patient name only, never the NHI;
     - the prepaid Procedures' procedure names (27's `prepaymentForProcedure`), joined with "and";
     - the List date in the invoice document's date format;
     - the prepayment invoice total as the invoice shows it (GST by 22's rule);
     - the anaesthetist on the invoice (22's `supplier`, 27's basis anaesthetist) through
       `shared/format.ts` (names have one home; if importing it into the store makes a cycle, move the
       helper, never copy it);
     - the invoice number, and the outstanding amount from 36's receivable leg.
   - Tests: every field replaced; unknown and missing fields refused; `estimateWording` refused for
     each phrase; "[not set]" for missing data; no NHI anywhere in the output for a seeded Booking;
     the same input gives the same output.
4. **Template maintenance** (`mastersActions.ts`, tests in `mastersActions.test.ts`):
   - `createLetterTemplate(api, actor, { kind, name, body })`, `editLetterTemplate(api, actor, id,
     patch)` (name and body; kind is fixed once created), `setLetterTemplateActive(api, actor, id,
     active)` and `setDefaultLetterTemplate(api, actor, id)` (one default per kind).
   - Office only. Validation through `validateLetterTemplate`, plus `nameTaken` (per kind),
     `lastActiveTemplate` (a kind always keeps one active template) and `defaultInactive` (the default
     cannot be deactivated; make another the default first).
   - Audited `letterTemplate.create`, `letterTemplate.update`, `letterTemplate.activate` or
     `letterTemplate.deactivate`, and `letterTemplate.setDefault`, each with before and after.
   - A selector `defaultLetterTemplate(state, kind)`.
5. **The letter in Approve and send** (`prepaymentActions.ts`; US-06.3.6, US-06.3.1):
   - 27's `approvePrepaymentInvoice(api, actor, invoiceId)` gains an optional `{ letterTemplateId }`.
     It renders the letter from the chosen active request template (the default when none is passed)
     and stamps `invoice.letter` in the same `mutate` that approves and sends. The engine's generation
     never renders a letter: a held invoice has none until an admin approves it.
   - The letter travels with 22's delivery: an email send records "with letter" (a flag on the send,
     not a second send). A portal or `noAddress` delivery keeps the letter on the invoice for printing.
   - Refusals: `templateInactive`, `templateWrongKind`.
   - 27's PWA stand-in "Office approves and sends the prepayment invoice" passes nothing, so it sends
     the default letter.
   - Tests: the default is used when none is chosen; the chosen one is snapshotted; editing the
     template afterwards leaves `invoice.letter` unchanged; a held invoice has no letter; 27's
     approval tests, its pair-parity test (US-09.1.3) and the guardian-payer addressee test still pass.
6. **Send prepayment reminder** (`sendPrepaymentReminder(api, actor, bookingId, templateId?)` in
   `prepaymentActions.ts`; US-06.3.6, US-06.3.2's "follow up"):
   - Office only (plus 14's `OFFICE_SIMULATION_ACTOR` for the PWA stand-in).
   - Allowed while 27's status is `unpaid` or `partPaid` (a sent invoice) and the List is not
     AUTHORISED.
   - Refusals: `noOutstandingPrepayment` ("There is no unpaid prepayment on this booking."),
     `noInvoiceEmail` ("Add an invoice email for the payer to send a reminder.", when 22's delivery
     has no address), `templateInactive`, `templateWrongKind`.
   - Renders the reminder with `amountOutstanding` from the receivable leg, appends to the
     prepayment invoice's `prepaymentReminders`, and audits `invoice.prepaymentReminder` (after:
     template, to, amount outstanding). It never changes the prepayment status or 15a's warning.
   - A selector `lastPrepaymentReminder(state, bookingId)` for the panel and the rail row.
   - Phase 40's patient follow-up log: in the same `mutate`, append a done `PatientFollowUp` (`kind`
     widened with `'prepaymentReminder'`, text "Prepayment reminder sent for {invoice number}",
     `invoiceId`) through 40's helper. If 40 shipped no follow-up log, skip this bullet and record it.
   - Tests: rights; refusals (including an invoice awaiting approval); two reminders append two
     entries; the amount outstanding reflects a half payment; nothing else changes.
7. **Settlement after a prepaid procedure: nothing automatic, by hand** (FT-06.4, US-06.4.1; OQ-61
   and OQ-76 answered; D30 as 27 built it; D31's default):
   - **Confirm what 27 built, and pin it end to end.** A prepaid Procedure is priced at the prepaid
     amount (source `prepaidAmount`), locked; its deduction nets it to zero; `settledByPrepayment` is
     recorded; nothing else is raised. Add parity tests over the whole AUTHORISED path (authorise, the
     billing run, 36's ledger, 38b's next `runEventInvoicing`, 39a's next weekly run) for a recorded
     BTM equal to, far above and far below what the prepaid amount would buy (US-06.4.1 AC1 to AC4):
     zero invoices, credit notes, negative invoices and refunds are created for the difference, by any
     run, now or later; the locked price is unchanged; a sibling hospital Procedure on the same Booking
     bills normally; replaying the run is a no-op. If anything computes or raises a difference, fix it
     in its one place (27's `prepayment.ts`, 24's precedence or the run); never add a threshold or a
     second rule. A fixed-price Contract that is not a prepayment is 24's and is not touched here.
   - **One read for the settlement block.** A selector `prepaidSettlementFor(state, procedureId)`
     returning `{ prepaidAmount; prepaymentInvoice: { id; number; status }; recordedBtmUnits?;
     additionalInvoices: EventRef[]; credits: CreditRef[]; refunds: TrustRefundRef[] }` (refunds fill
     in session 2), from 27's `prepaymentForProcedure`, the snapshot's recorded units and 38b's events
     list. The BTM is units only, labelled "for reference": no dollar figure is ever computed from it
     against the prepaid amount.
   - **The additional invoice by hand** (38b, US-08.6.3). Confirm 38b's **Create additional invoice**
     works on a prepaid Procedure, office and the anaesthetist on their own, through the review step
     and the next run: its original is the prepayment invoice (`liveInvoiceForProcedure`'s fallback),
     the prepayment invoice is unchanged, the event shows on the Procedure, and the new invoice has its
     own number, pair, Xero pair and payable to the doer. It is not a prepayment and is never held in
     trust (item 8). Add a test; fix in 38b's one place if it refuses.
   - **The credit note by hand on a prepayment invoice** (39, US-08.6.5, US-06.4.1 AC5):
     - In 39's one `submitCredit`, lift `kindNotCreditable` for `prePayment` invoices (it stays for
       AA-FEE invoices). Office on any Procedure, the anaesthetist on their own (39's own-Procedure
       rule), through 38b's review and `issueCreditInto`, exactly as 39 issues any credit. New refusals:
       `bookingCancelled` on a cancelled Booking ("A cancelled booking's prepayment is refunded from the
       trust account.", item 14 is the route), `prepaymentNotSent` (awaiting approval or withdrawn: 27's
       withdrawal is the route), and `cause: 'split'` on a prepayment invoice stays refused (the prepaid
       combination split is out of scope).
     - **Part credit (D31, OQ-97's default).** `submitCredit` accepts an optional `amount` for a
       prepayment invoice only. A pure `statedCreditFor(invoice, amount)` in 39's `creditNote.ts` (one
       comment naming OQ-97 and D31, provisional) returns the credit note's one line ("Credit: part of
       prepayment {number}") with GST under the original's treatment (22's rule, rounding to the cent
       as 39's split does), or refuses `creditAmountInvalid` (not above zero, more than the invoice
       total, or not whole cents). Omitted, the credit is in full through `creditInFull`. 39's
       `reversalPlan` takes the credited amount (its explicit input), so the payable is reversed by the
       same amount: offset against a payable still held in trust, cancelled from a released one, and
       any disbursed part becomes `recoveryDue` netted by 39a, all as 39 built it. One credit per
       prepayment invoice (39's `alreadyCredited` stands); log that reading.
     - **Before authorise.** A credit of a sent prepayment invoice is allowed before the List is
       AUTHORISED, for 27's `notNeeded` and `changedAfterSending` cases (27 hands them to "39, 41"). A
       prepayment invoice credited **in full** stops counting as live in 27's one live test (beside
       "withdrawn never counts"), so the Procedure is then priced by 24's precedence and billed
       normally at authorise; a part-credited one still counts, and the Procedure stays at the prepaid
       amount (D30), the part credit being the separate correction. Test both.
     - **No refund from the credit note option** (US-08.6.5 AC "No refund", note #33). Money already
       received on a credited prepayment becomes 39's `heldForPayer` (Phase 40's credit balance), and
       its refund happens outside the system. Only the cancellation refund (item 14) is paid out of
       the trust account. Log the tension with US-06.5.1 ("payments out of the trust account are made
       from the system") for the owner.
     - Audited as 39 audits a credit, plus the stated amount; recorded as an event on the Procedure.
   - **Remove the July model's leftovers.** No "deposit", "estimate", "estimated", "remaining
     balance", "balance invoice", "top-up", "overpaid" or "manual credit" wording on any prepayment
     surface, invoice note or rendered string: drop the invoice document's balance notes if 27 left
     them, and reword the `negativeTotal` message (kept for every other negative) to "The lines billed
     to one counterparty add up to a negative amount ($X). Review the price override before
     rebilling." if 27 did not. Gates: `grep -rniE "deposit|estimated? (fee|amount)|remaining balance|balance invoice|top-up|overpaid|manual credit" aa-prototype/src/apps aa-prototype/src/shared aa-prototype/src/domain/billing`
     returns only test names and comments that say the thing is gone, and a test over every seeded and
     built invoice's lines and notes finds none of these words.
   - Tests as above, plus: an anaesthetist's part credit of $600.00 on Nair's INV0001 after authorise
     (through review and the run) gives a credit note of $600.00 plus GST linked to INV0001, a negative
     invoice to the payee for the same amount, the event on the Procedure, the ledger in balance, and
     the prepayment invoice itself unchanged; a full credit before authorise of a `notNeeded` invoice;
     each refusal; an anaesthetist on a colleague's prepaid Procedure refused.
8. **The trust hold and its release at authorise** (16's `payableRelease.ts`, 36's `ledger.ts`,
   `paymentActions.ts`, `lifecycle.ts`; US-06.5.1, FT-06.5, DM-21; OQ-40 answered):
   - **Pure rule.** `payableReleasedFor(received, amount, { heldInTrust })` (16's one rule, extended,
     never copied): 0 while `heldInTrust`, otherwise as today. A pure `isHeldInTrust(pair)` in
     `ledger.ts`: a `prePayment` pair, issued, with no `trustRelease` and not credited in full.
   - **Receipts.** 36's `applyReceipt` on a held pair records the receipt and leaves `releasedAmount`
     at 0; the Xero ACCPAY stays `draft` (the payment path in `paymentActions.ts` no longer authorises
     it pro rata for a held pair). 36's `ledgerChecks.releasedNotReceived` uses the same rule, so a
     held pair is not a check.
   - **Release.** `releaseTrustHeldPrepayments(api, listId)`, called inside `authoriseList`'s commit
     (with 27's settlement, so one AUTHORISED transition settles and releases together), for each held
     prepayment pair on the List's non-cancelled Bookings:
     - set the payee to 25's lock payee (the anaesthetist who did it, US-01.4.6) through the pure
       `withPayablePayee(pair, anaesthetistId)` that item 12 also uses. It changes the payable leg's
       payee (and any pair-level payee field 36 derives from it) and never the receivable leg, the
       invoice's supplier or the ACCREC;
     - set `trustRelease` and `releasedAmount = payableReleasedFor(received, amount)` (now not held),
       less any part already credited (39's `releaseCancelled`), and authorise the Xero ACCPAY for that
       amount;
     - audit `ledgerPair.trustReleased` (after: payee, amount released) as the "Billing run" actor.
     A receipt after release releases at once, as any procedure pair does.
   - **Weekly runs.** A held pair's released amount is 0, so 39a's `buildWeekRun` has nothing to pay
     on it. Also add `'heldInTrust'` (from `isHeldInTrust`) to 39a's `runExclusionFor`, the one
     exclusion point 39a left for this hold, so the run draft and the payables view can say why the
     row is out ("Held in trust until the procedure"). Add a test that a run on a period holding a
     received, held prepayment pays nothing for it, lists it as excluded, and pays it in the first
     weekly run after authorise.
   - **Ledger position.** 36's (and 39's) equation gains one term:
     `heldInTrust = sum(receivable.receivedAmount on held prepayment pairs, less any credit held for
     the payer on them)`, and
     `imbalance = receiptsHeld - payablesDue - heldInTrust - creditsHeldForPayers + recoveryDueFromAnaesthetists`.
     `ledgerPosition` and `anaesthetistPosition` return `heldInTrust` (per anaesthetist: held for the
     current payee, labelled "held until the procedure", never in `owedToThem`).
   - Tests, each asserting the ledger is in balance to the cent at every step:
     - the US-06.5.1 AC: a paid prepayment, procedure not done, nothing released or paid to the
       anaesthetist, and a weekly run pays nothing for it;
     - authorise releases it to the lock payee; the next weekly run pays it;
     - part paid before, the rest after authorise;
     - a part credit before authorise, then authorise: the release is the rest;
     - an invoice awaiting approval at authorise is withdrawn by 27, not released;
     - idempotent: authorising twice (or a retry) never releases twice.
9. **Seed, session 1** (wherever 18 to 26 keep masters, `seed/billing.ts`; bump `PERSIST_VERSION` by
   one):
   - Three templates, bodies with no en or em dashes and no estimate wording:
     - `LT001` "Standard prepayment letter" (request, default): "Dear {{patientName}}, thank you for
       booking your {{procedure}} with {{anaesthetist}} on {{procedureDate}}. The anaesthetic fee is
       {{prepaidAmount}}, payable before your procedure. Please pay invoice {{invoiceNumber}} using
       the details it shows. If your procedure turns out very different from what was planned, your
       anaesthetist may send a further invoice or a credit."
     - `LT002` "Cosmetic procedure prepayment" (request): the same facts, adding that cosmetic
       procedures are not publicly funded or covered by ACC, and that payment is needed three working
       days before the procedure.
     - `LT003` "Prepayment reminder" (reminder, default): "Dear {{patientName}}, our records show
       {{amountOutstanding}} of the anaesthetic fee for your {{procedure}} on {{procedureDate}} is
       still to pay. Please pay invoice {{invoiceNumber}} before your procedure, or contact the AA
       office if you have any questions."
   - The seeded approved INV0001 (Nair) gets `LT001`'s rendered letter, stamped at its seeded approval
     time, built with the same renderer (never a hand-typed body).
   - **Reseed the hold.** INV0001 stays paid, but its payable is held in trust: no disbursement on
     16 Jul, `releasedAmount` 0, the Xero ACCPAY `draft`, and INV0001-P out of the seeded backdrop
     run. 39a groups the seeded payouts into one backdrop run per ISO week, and Week 29 holds both
     Dr Souter's pa01 (15 Jul) and this payout (16 Jul): `buildWeekRun` rebuilds that run, its
     remittance advice and Dr Souter's backdrop batch payment from the remaining disbursements, so
     Week 29's run total and her remittance drop by INV0001-P's amount (re-pin with the reason) and
     no other run or remittance figure moves. If 39a built a run, Xero disbursement or batch payment
     that held only INV0001-P, it goes with it (no empty seeded run). Retire `SEED_PREPAYMENT_DISBURSED_ISO` if nothing else uses it. Any billed history Booking
     with a prepayment is seeded released at its List's authorise time. Never change the filler
     generator's `rng()` draw order.
   - `seed.test`: every template validates; exactly one active default per kind; no prepayment pair is
     released or disbursed before its List is AUTHORISED; the seed ledger is in balance with
     `heldInTrust` equal to INV0001's total; two builds are deep-equal. Update `seedBilling.test.ts`,
     `demoScenarios.test.ts` and `persistMigrate.test.ts`. Re-pin item 1's moved figures with the
     reason.
10. **Session 1 surfaces, triggers and exit:**
    - **Master data, "Prepayment letters"** (`MasterData.tsx`, a new left sub-nav view after 27's
      "Prepayment" section; `data-shot="letter-templates"`):
      - a table: Name, Kind (Request or Reminder), Default (a neutral pill), Active, Updated;
      - "New template" and a row "Edit" open a Dialog: name, kind (new only, Segmented), a body
        TextArea, a row of merge-field chips that insert `{{field}}` at the cursor, and a live preview
        beside it rendered with the renderer against a named sample (`LETTER_PREVIEW_SAMPLE`: a
        fictional patient, Rhinoplasty, Dr Souter, the prepaid amount as her own price list gives it);
        a refusal such as `estimateWording` renders verbatim under the body;
      - "Make default" and "Deactivate" row actions; refusals render verbatim.
    - **Approve and send with a letter.** Every surface where 27 put **Approve and send** (the panel,
      the rail card, the Invoices strip, the invoice document) now opens one short Dialog
      (`data-shot="prepayment-letter-picker"`): a "Letter" select of active request templates (default
      first), a "Preview letter" disclosure rendered for this Booking, the recipient, and "Approve and
      send". One shared component; the rail and strip keep a single click to open it. The
      anaesthetist's panel shows "The AA office sends the prepayment letter."
    - **Invoice document** (`InvoiceDocument.tsx`): a sent prepayment invoice with a letter renders
      the letter as a cover section above the invoice, on the same paper and print stylesheet
      (`data-shot="prepayment-letter"`), with "Letter: Standard prepayment letter · sent with this
      invoice" in the rail. Reminders list under it (date, to, amount outstanding), each expandable to
      its snapshot.
    - **"Send prepayment reminder"** on 27's `PrepaymentPanel`, office surface, while `unpaid` or
      `partPaid` (`data-shot="prepayment-reminder"`): a teal action opening a Dialog with the reminder
      template select, the preview, the recipient address and "Send reminder". The panel then shows
      "Reminder sent 21 Jul 10:04 to {address}". On mobile and web the anaesthetist sees the same line
      read-only. 27's "Prepayments" rail row adds "Reminded 21 Jul" when one exists.
    - **The prepaid settlement block** (`shared/booking/`, one component used by Admin, mobile and web
      on a prepaid Procedure once its List is AUTHORISED; `data-shot="prepaid-settlement"`):
      - "Prepaid $1,200.00 · the price for this procedure" (mono, with the invoice number linking to
        it), "Recorded BTM 13 units · for reference only" (neutral), and "Nothing is invoiced or
        credited automatically.";
      - two actions: 38b's **Create additional invoice** and 39's **Credit note**, the same entries
        those phases put on any invoiced Procedure, here placed in the block (office on any prepaid
        Procedure; the anaesthetist on their own, reached through 38a's archive or search; hidden on a
        colleague's). No new sheet: 39's `CreditSheet` and shared `CreditForm` (whose "Crediting a prepayment invoice
        is not in this prototype yet." refusal goes) gain, for a
        prepayment invoice only, a Segmented "In full · Part of it" and an amount field
        (`data-shot="prepayment-part-credit"`) with the caption "Provisional (OQ-97)", the sentence
        "Your payment for this prepayment is reduced by the same amount." and 39's "A credit note is
        not a refund.";
      - under the actions, the Procedure's by-hand events from 38b's events list (additional invoice or
        credit, number, amount, status).
      Before authorise, on a sent prepayment that 27 reads `notNeeded` or `changedAfterSending`, the
      office panel offers **Credit note** with the same sheet; the anaesthetist sees 27's status line.
    - **Held in trust on screen:**
      - the panel, on a received prepayment before authorise: "Held in the AA trust account until the
        procedure · $X" (neutral), and after authorise "Released to Dr Souter · $X · paid in the next
        weekly payment run" (success);
      - the payables view (39a's run screen): a held prepayment row reads "Held in trust until the
        procedure" with no amount due, and is never offered to a run (`data-shot="payables-trust-held"`);
      - web Accounts and mobile Balances (36's `anaesthetistPosition`): "Prepayments held in trust ·
        $X · paid after the procedure", separate from what is owed now.
    - **Demo trigger** "Stage longer prepaid procedure" (see "Demo triggers"), with registry tests for
      route visibility, the disabled reasons, and that authorising after staging creates no invoice,
      credit or refund for the difference.
    - Audit labels: `letterTemplate.*` ("Prepayment letter template created", "updated", "activated",
      "deactivated", "made default"), `invoice.prepaymentReminder` "Prepayment reminder sent",
      `ledgerPair.trustReleased` "Prepayment released from trust", and the stated amount in 39's credit
      narrative ("Credited $600.00 of INV0001"); entity type `letterTemplate` in the Audit viewer
      filter; narrative formatters for `letter` (the template name, never the whole body) and
      `trustRelease`.
    - Shots: add `visual/admin-prepayment-followup.spec.ts` (the template view, the picker, the letter
      on the invoice, the reminder, the settlement block with both actions, the part-credit sheet, the
      held and released panel lines, the payables row) and mobile and web shots of the settlement
      block on Nair's Booking reached through 38a's archive.
    - **Session 1 exit:** `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots` all
      green; item 1 passes with only the re-pinned figures moved; the item 7 greps are clean. Write a
      short "session 1 done" note in the PROGRESS entry.

**Session 2: the payee on a move, refund on cancellation, the payout and the rebook.**

11. **Types, session 2 part** (`domain/types.ts`; DM-21):
    - `TrustRefund = { id; bookingId; prepaymentInvoiceId; creditNoteId; counterparty (the payer on
      the Booking that paid, a person under D23); anaesthetistId (the payable leg's payee when
      refunded); amount; status: 'due' | 'instructed' | 'paid'; createdAtISO; instructed?: { atISO; by;
      reference }; paidAtISO?; xeroRefundId? }`, held in `billing.trustRefunds`. The amount equals the
      `heldForPayer` on 39's pair `credit`; it is never stored a second way.
    - `AA_TRUST_ACCOUNT = { name: 'AA trust account', bankAccount: '99-0100-0000001-00' }`, a named
      constant on the non-issued bank code 99, plainly fictional (as 26's bank numbers are).
    - `Booking` gains `rebookedFromBookingId?`, and 15's Booking `source` gains `'rebook'`.
    - The Xero slice gains `refunds: Record<string, XeroRefund>`, where `XeroRefund = { id;
      creditNoteId (39's Xero credit note); amount; bankAccount: 'trust'; status: 'authorised' |
      'paid'; createdAtISO; paidAtISO?; reference }`.
    - 39's `cause` union (on `CreditEventDetail` and `CreditNote`) widens with `'prepaymentRefund'`;
      38b's one label place gains its label ("Prepayment refund").
    - `ID_FORMATS`: `trustRefund` (`TR`, pad 4) and `xeroRefund` (`XRF`, pad 4).
12. **A moved prepaid Booking keeps its amount; only the payable's payee moves** (US-06.5.4, FT-06.5,
    DM-42's prepayment payee, D20's honour system, D38 = OQ-80's default; a new `trustActions.ts`):
    - **One store action**, `repointPrepaymentPayable(api, bookingIds, cause)`, run as `ENGINE_ACTOR`
      from **the one after-commit hook** 32 and 32a left (its built name), so it covers, through that
      one call:
      - the anaesthetist's whole-List moves (32): `moveListToOffice`, `pushListToSlot` and
        `markUnavailableAndMoveList`, keyed on `list.ownerMove`;
      - the anaesthetist's single-Booking move (32a): `moveBookingToAnaesthetist`, keyed on
        `booking.movedToAnaesthetist`;
      - the office's moves, routed through the same hook here: `reassignBooking` (Admin
        `MoveBookingFlow`), `reassignList` / 28's `moveListToSlot` (`ReassignListFlow`) and 31's
        `assignDraftList` (a returned List gets its new payee when the office assigns it).
      It is the only code that changes a prepayment payable's payee before authorise. It is not a
      re-check and runs no prepayment logic: it never calls `syncPrepayment`, never reads the prepaid
      set or a price and never writes `Booking.prepayment`, an invoice or the receivable (the honour
      system). One doc comment names D38 and OQ-80 (provisional: whether a payable update survives "no
      logic to detect these flows" is open) and D20. If OQ-80 is answered "no update on a move", the
      body empties and nothing else changes.
    - For each sent prepayment pair on the Booking that is held in trust: when the Booking's List now
      has an anaesthetist other than the payable's payee, apply item 8's `withPayablePayee` and move
      the draft Xero ACCPAY's contact to the new anaesthetist in the same `mutate`. **The receivable
      half is unchanged:** the receivable leg, the prepayment invoice (its number, amount, supplier and
      letter), the draft or sent ACCREC and 27's stored record never change, no new prepayment invoice
      is raised, and the patient is not billed again (AC1, AC2). Audit `ledgerPair.payableRepointed`
      (before and after payee, cause, the move's audit code). An invoice still awaiting approval has
      no payee to repoint here (27's basis anaesthetist rules stand; nothing is re-checked).
    - A List moved to the office (a Draft List with no anaesthetist) keeps the payee until it is
      assigned; `assignDraftList` then repoints it. After AUTHORISED nothing changes here: item 8's
      release stamps the lock payee, so a path that missed the hook still pays the doer (a test proves
      the two agree). Flip 32a's pinned-payee store test. A held pair is never on a weekly run line
      (item 8's `'heldInTrust'` exclusion), so the repoint changes no run and never makes one stale
      (39a's handoff allowed for that case; under the hold it cannot arise: assert it).
    - **Settled at the prepaid amount** (AC3). Confirm with a test that the moved prepaid Procedure,
      still on Dr Souter's own first-party Contract, authorised on Dr Beaumont's List, is priced at
      the prepaid amount (27's `prepaidAmount` source ahead of every step), bills nothing more, and
      releases the payable to Dr Beaumont for the prepaid amount: the doer wears or benefits from the
      difference, with no rate logic anywhere. If 20's or 25's checks reject another anaesthetist's
      first-party Contract on a List, fix that check in its one place for a prepaid Procedure (the
      honour system keeps the Contract as it was) and log it.
    - Tests (the three ACs):
      - an office move of Riley's Booking (sent, part paid) from Souter to Beaumont before the
        procedure: no new invoice, the payable leg and the draft ACCPAY point to Beaumont, the
        receivable leg and the ACCREC are deep-equal to before, no prepayment audit row is written, and
        after authorise the payable is to Beaumont for the prepaid amount with nothing billed;
      - the same through 32a's `moveBookingToAnaesthetist` and through 32's `pushListToSlot`: one
        repoint each;
      - a List returned to the office (`moveListToOffice`) keeps the payee; `assignDraftList` to
        Beaumont then repoints it once;
      - moving back repoints back; replay is a no-op; the ledger stays in balance; 27's prepaid amount
        line stays;
      - a Booking that was never prepaid, moved: the action writes nothing.
13. **Pure trust account view** (`domain/billing/trustAccount.ts`, exported, with
    `trustAccount.test.ts`; US-06.5.1):
    - `trustAccountView({ pairs, receipts, credits, refunds })`, over `prePayment` pairs and refunds
      only:
      ```
      prepaymentsReceived     = sum(receipts on prePayment pairs)
      heldInTrust             = item 8's term
      releasedToAnaesthetists = sum(releasedAmount on released prepayment pairs)
      creditedHeldForPayers   = sum(heldForPayer on credits of prepayment invoices not refunded here)
      refundsDue              = sum(refunds due or instructed)
      refundsPaid             = sum(refunds paid)
      ```
      with the identity `prepaymentsReceived = heldInTrust + releasedToAnaesthetists +
      creditedHeldForPayers + refundsDue + refundsPaid` checked to the cent (a failure is a
      `ledgerChecks` entry, `trustUnbalanced`).
    - `held`: one row per held prepayment (Booking, patient name, procedure date, payee, received,
      "Held until the procedure").
    - `movements`: one row per receipt (Prepayment received), payee change (Payee changed after a move,
      amount 0), release (Released to the anaesthetist), credit by hand (Credited, held for the payer),
      refund created (Refund due) and refund paid (Refund paid), each with date, Booking, patient name,
      anaesthetist, invoice or credit number and a signed amount, oldest first.
    - Tests: the sums from a hand-built fixture; a held, a moved, a released, a part-credited and a
      refunded prepayment in one view; movements ordered and signed; a payee change moves no money;
      `heldInTrust` equals the ledger's term; the identity holds; same input gives deep-equal output.
14. **Refund a prepayment on cancellation** (`trustActions.ts`, exported from the store index;
    US-06.5.2, FT-06.5):
    - **Status.** 27's `prepaymentStatusFor` result gains `refund?: { amount; status: 'toAction' |
      'due' | 'instructed' | 'paid'; creditNumbers }`. `toAction` means the Booking is cancelled and
      has a sent prepayment invoice not yet credited. A cancelled Booking never warns (27 holds this).
    - **`refundPrepaymentOnCancellation(api, actor, bookingId)`**, office only:
      - refusals: `notCancelled` ("Cancel the booking first."), `noPrepayment`, `alreadyRefunded`,
        `listAuthorised` ("This booking's List is authorised, so its prepayment has been settled.");
      - in one `mutate`: credit **every** sent prepayment invoice on the Booking in full through 39's
        credit path, whether paid, part paid or unpaid, so the patient is never chased for a cancelled
        Booking. For each, record 39's credit event (kind `'credit'`, `cause: 'prepaymentRefund'`,
        `originalInvoiceId` the prepayment invoice, the original's party, zero replacements) already
        approved by the refunding office actor, and issue it in the same commit through 39's
        `issueCreditInto` (`creditInFull`, `reversalPlan`, `applyCredit`, the negative invoice), not
        left for 38b's next run: the confirmed refund dialog is its one review step, there is no List
        to review on a cancelled Booking, and the patient's money is waiting. If 39 left the issue core
        callable only from `runEventInvoicing`, export it; never copy it. Then create one
        `TrustRefund` (status `due`) for the `heldForPayer` (the amount actually received, less any
        part credit already held for the payer), when above zero. Log this reading (immediate issue,
        the refund as its review) for the owner;
      - a prepayment invoice already part-credited by hand (item 7) is credited for its remaining
        amount through `statedCreditFor`, and the earlier credit's held money joins the refund, so the
        refund is always the full amount received;
      - the money was held (item 8), so `released` and `disbursed` are 0: 39's path records its
        negative invoice wholly offset against the never-released payable (`status: 'offset'`,
        `recoveryDue` 0, nothing for 39a to net) and `xeroCorrectionPlan` voids the draft ACCPAY. 39's
        `reversalPlan` always reverses the payable (OQ-77 part 2, answered), so both halves of the pair
        close and the trust account balances with no second path. Nothing is recovered from the
        anaesthetist, and D21's outside-the-system case never arises. Assert it in a test; if a
        disbursed prepayment were ever reached, 39's path and 39a's netting apply unchanged;
      - the refund's credit is an event on the Procedure, as every 39 credit is; add nothing;
      - 39's `submitCredit` refuses a cancelled Booking's prepayment invoice (item 7's
        `bookingCancelled`); the refund's credit event is created by this action, never through
        `submitCredit`;
      - `anaesthetistId` on the refund is the payable leg's payee at refund time (after any item 12
        repoint), so the refund names "whichever anaesthetist held it";
      - audits `booking.prepaymentRefund` (after: credit numbers, refund amount, holder); Xero
        credit-note mirror after commit through 39's `handoffCorrection`.
    - **`cancelBooking` with a refund.** `cancelBooking(api, actor, bookingId, reason, { refundPrepayment?:
      true })`: for an office actor with `refundPrepayment`, the cancel and the refund commit in the
      same `mutate` (audit metas `booking.cancel` then `booking.prepaymentRefund`). Without the
      option, or for an anaesthetist or any other non-office actor, the cancel is unchanged and the
      refund reads `toAction` for the office. A cancel is never refused because of a prepayment. 27
      still withdraws an unsent invoice on cancel. (Automated cancellations from an integration are
      Future Work, US-02.5.3; the rule above already covers them.)
    - Tests:
      - the ACs: a paid prepayment, cancelled before the procedure, is refunded in full, whichever
        anaesthetist held it; the ledger credit links to the original prepayment invoice
        (`prepaidSettlementFor` and the lineage);
      - the same after item 12 moved it to Dr Beaumont: the refund names Dr Beaumont as holder and
        nothing was ever paid to either anaesthetist;
      - unpaid: credit in full, no refund; part paid: credit in full, refund of what was received;
        part-credited first: the refund is still the full amount received;
      - an anaesthetist cancel on mobile leaves `toAction`, and the office refund then completes it;
      - idempotency: a second refund refuses `alreadyRefunded`; the ledger never double-credits;
      - the ledger and the trust view balance after each step.
15. **The payout** (US-06.5.1: "payments out of the trust account are made from the system"):
    - **`recordTrustRefundPayout(api, actor, refundId, { reference })`**, office only ("Record refund
      payout"): refused unless `due`; reference required (default offered: "Refund {credit number}").
      Sets `instructed`, creates the `XeroRefund` (status `authorised`, trust bank account) against
      39's Xero credit note in the same `mutate`, audits `trustRefund.instructed`.
    - **`settleTrustRefundPayout(api, refundId)`**, the bank side, actor "Xero bank feed" (new: a
      `BANK_FEED_ACTOR` system actor in `demoActors.ts`, unless 37 already added one), called by the
      Xero sim trigger ("Pay out trust refund"): refused unless `instructed`; sets `paid` and
      `paidAtISO` from the demo clock, the `XeroRefund` to `paid`, and the money-out entry the ledger
      reads: `receiptsHeld` gains `- refundsPaid`, and 39's held credit is marked refunded, so
      `creditsHeldForPayers` drops by the same amount and the imbalance never moves. Audits
      `trustRefund.paid`. Idempotent by refund id.
    - This payout is only for `prepaymentRefund` credits. A credit raised by hand through 39's credit
      note option, including a part credit of a prepayment, stays a credit held for the payer with no
      refund paid from the system (US-08.6.5, note #33).
    - Tests: order enforced; replay is a no-op; the ledger and the trust view stay in balance at each
      step; no anaesthetist position changes on a payout; a 39 credit note with another cause cannot
      be paid out here.
16. **Rebook with another anaesthetist** (`rebookWithAnotherAnaesthetist(api, actor, bookingId,
    targetListId)` in `trustActions.ts`; US-06.5.3, a true cancellation only):
    - Office only. The source must be cancelled. Refusals:
      - `refundToAction` ("Refund the original prepayment first.") while the refund is `toAction`;
      - `sameAnaesthetist` ("Choose a different anaesthetist. To keep the prepayment, move the booking
        instead of cancelling it.");
      - `listLocked` (the target List must be ACTIVE), `pastDate` (before the demo today);
      - `alreadyRebooked`.
    - In one `mutate`, creates a new Booking on the target List through `createBooking` (15's one
      create path, with its Procedures through the existing Procedure create path; never a second
      create; Copy a Booking is gone):
      - patient, the payer on the Booking and `invoiceEmail` (21);
      - each non-cancelled Procedure as a skeleton: the procedure (19's id) and its RVG code, primary
        flag (23) and source wording (20a); no times, modifiers, typed prices or overrides;
      - the Contract: the replacement's own first-party Contract when it has a line for the procedure
        (19a's `ownFixedPriceFor`, D42), else none, so 20's "Needs a Contract" list and 27's
        `priceNeeded` take over; never the original anaesthetist's own Contract;
      - `source: 'rebook'`, `rebookedFromBookingId`; audits `booking.rebooked` on both Bookings.
    - After commit, 27's `syncPrepayment` (cause `bookingCreated`) derives the requirement from the
      **new** anaesthetist's prepaid set. If required and priced, the engine generates a fresh
      invoice at the new anaesthetist's own fixed price, with its pair and draft Xero pair, held for
      "Approve and send" (D6), where the office picks the letter. Nothing from the original prepayment
      is moved or reused. If the replacement does not take prepayment for this procedure, the result
      says so ("Dr Beaumont does not take prepayment for this procedure.").
    - 17's not-preferred warning shows in the dialog when the target List's surgeon and the
      replacement are a not-preferred pairing (reuse the office helper; never block).
    - A selector `prepaymentHistoryFor(state, bookingId)` walks `rebookedFromBookingId` both ways and
      returns each prepayment with its anaesthetist, amount and state (refunded, current).
    - Tests: the AC (a refunded prepayment and a replacement with a different fixed price for the same
      procedure: a new prepayment at their price); the original invoice untouched; no prepayment when
      the replacement's set lacks the procedure; `priceNeeded` when they have no price for it; each
      refusal; the history both ways.
17. **Seed, session 2** (`seed/bookings.ts`, `seed/billing.ts`, `cast.ts`, 19a's first-party Contract
    seed, 26's prepaid sets; bump `PERSIST_VERSION` by one):
    - **The refund Booking** (`SEED_MARKERS.prepaymentRefund`): a new fictional patient with a valid
      new-format NHI from the seed's patient helpers, the patient as payer, on a Souter ACTIVE List
      after Fri 24 Jul that no scripted beat uses (check the seed map; add a List on an existing Slot
      only if none is free). One Rhinoplasty Procedure on Dr Souter's own price list, so 27's engine,
      run at seed time, stores a $1,200.00 prepayment.
    - Its prepayment invoice is approved and sent with `LT001`'s rendered letter, and **received in
      full and held in trust** (item 8): nothing released or disbursed. Its invoice number is
      allocated after every existing seeded invoice, so no scripted invoice number moves.
    - **The replacement.** Seed Dr Beaumont's own price list through 19a's seed (a first-party
      holder, "Dr B. Beaumont, own price list", in force from 2026-01-01, Rhinoplasty at $1,350.00,
      demo-plausible and commented as such) and a prepaid set covering Rhinoplasty (26), and make sure
      she has an ACTIVE List on the refund Booking's date at the same hospital, and an available
      session or ACTIVE List on Fri 24 Jul for the move beat (so 32a's receiver rule offers her too).
      Run 26's and 27's coherence tests: if any other seeded Beaumont Booking now derives prepayment,
      pick a different colleague; never change a Booking's procedure.
    - Never change the filler generator's `rng()` draw order.
    - `seed.test`: the refund Booking reads paid and held in trust; `ledgerPosition` of the seed is in
      balance with no checks; the trust view of the seed has two held prepayments, no refunds, and its
      identity holds; Riley and Nair are unchanged. Re-pin item 1's ledger totals with the reason.
      Update `seedBilling.test.ts`, `demoScenarios.test.ts` and `persistMigrate.test.ts`.
18. **Session 2 surfaces:**
    - **Moves** (US-06.5.4): the confirm steps of the admin Booking move (`MoveBookingFlow.tsx`) and
      `ReassignListFlow.tsx`, 32's List move sheet (both choices, and the return-or-assign sheet when a
      booked session is marked unavailable) and 32a's "Move to a colleague" sheet, on mobile and web,
      use one shared line from `shared/booking/`: "The prepayment keeps its agreed amount of $X. Dr
      Beaumont is paid it after the procedure." (one line per List with a count when several; on a
      return to the office: "The prepayment keeps its agreed amount. Whoever the office assigns is
      paid it."). On the anaesthetist's own move sheets no not-preferred warning appears (D44); the
      line is information, not a prompt. After the move, the panel reads "Prepayment kept at the
      agreed amount · payee now Dr Beaumont" with the caption "Provisional (OQ-80)", and "Invoice
      INV00xx unchanged" under it (`data-shot="prepayment-repointed"`). The Xero sim pair shows the
      draft ACCPAY's new contact and the unchanged ACCREC.
    - **Cancel dialog** (`CancelBookingSheet`, all three apps through `useSurface()`;
      `data-shot="cancel-prepayment-refund"`):
      - office, with a received prepayment: a section "Prepayment refund": "Prepayment received · $X
        on {invoice number}, held in the AA trust account. Cancelling refunds it in full to the patient
        and credits the prepayment invoice." Primary: "Cancel and refund prepayment";
      - office, with a sent unpaid invoice: "The prepayment invoice {number} is unpaid. Cancelling
        credits it in full so the patient is not chased." Primary: "Cancel and credit prepayment";
      - anaesthetist: one note, "The patient has paid a prepayment of $X. The AA office refunds it in
        full from the trust account." The cancel proceeds as today.
    - **Booking panel** (27's `PrepaymentPanel`) on a cancelled Booking:
      - `toAction` (office): "Prepayment to refund" and the teal action "Refund prepayment from trust
        account", through a short confirm;
      - `due`, `instructed`, `paid`: "Refund due · $X", "Refund payout sent · awaiting bank", "Refunded
        to the patient from the AA trust account · $X on 21 Jul", each with the credit number linking
        to 39's credit-note document;
      - the anaesthetist sees the same lines read-only (mobile and web);
      - office, on a cancelled Booking whose refund is not `toAction`: "Rebook with another
        anaesthetist";
      - the prepayment history block when `prepaymentHistoryFor` has more than one entry: "Earlier
        prepayment · Dr Souter · $1,200.00 · refunded" and "This prepayment · Dr Beaumont · $1,350.00"
        (`data-shot="prepayment-history"`), on both Bookings, labelled "ex GST"; the cancel dialog and
        invoices show what was invoiced and received.
    - **Rebook dialog** (admin Dialog, `data-shot="rebook-dialog"`): an anaesthetist select (roster
      order, the original excluded, `drSurname`), then their ACTIVE Lists from the demo today (date,
      session, hospital, surgeon; never "slot"), defaulting to the source Booking's date; 17's
      not-preferred warning inline; a preview line "New prepayment at Dr Beaumont's own price:
      $1,350.00" from 19a's `ownFixedPriceFor` (or "Dr Beaumont has no price for this procedure; the
      office adds it to her price list."), and "It is generated for approval, as any new booking's
      is."; "Rebook". On success, navigate to the new Booking.
    - **Admin trust account** (`LedgerScreen.tsx` gains a third scope; route `/admin/ledger/trust`,
      wrappers in `routes.tsx` and `router.tsx`; `data-shot="trust-account"`):
      - 36's scope Segmented becomes "Whole ledger · One anaesthetist · Trust account";
      - header note: "Prepayments are held here until the procedure is done, then released to the
        anaesthetist who did it and paid in the next weekly payment run. Cancellation refunds are paid
        from here." with a neutral "To verify with AA" pill (FT-06.5 is Verify);
      - tiles (the Admin Review tile row): Prepayments received, Held in trust, Released to
        anaesthetists, Credited (held for payers), Refunds due, Refunds paid;
      - **Held card**: the held rows (patient name, never the NHI; anaesthetist surname, the current
        payee after any move; procedure date; amount in mono);
      - **Refunds card** (`data-shot="trust-refunds"`): "To action" rows ("Refund prepayment from
        trust account"), "Due" rows ("Record refund payout", a Dialog with the reference, "Pay to: the
        patient's nominated account (bank details are not held in the prototype)" and "Record
        payout"), "Awaiting bank" rows, and paid rows, each with holder surname, credit number, amount
        and a status pill;
      - **Movements table** from `trustAccountView`, with a totals row;
      - 36's footnote about receipts held changes to "Prepayments held until the procedure are shown
        on the trust account.";
      - 36's Ledger nav badge adds refunds to action and refunds due.
    - Audit labels: `ledgerPair.payableRepointed` "Prepayment payee changed after a move",
      `booking.prepaymentRefund` "Prepayment refunded from trust account", `trustRefund.instructed`
      "Refund payout recorded", `trustRefund.paid` "Refund paid from trust account",
      `booking.rebooked` "Rebooked with another anaesthetist"; entity type `trustRefund` in the Audit
      viewer filter.
19. **Xero simulation** (`DemoXero.tsx`, `xeroPairView.ts`): the pair detail shows a held prepayment's
    ACCPAY as "Draft · held in trust until the procedure" with its contact (which changes after a move
    while the ACCREC beside it does not) and, once refunded, 39's "Draft ACCPAY voided", and, on 39's
    credit-note panel, a "Refund from trust account" row per `XeroRefund`: amount (mono), bank account
    "AA trust account", reference, status ("Authorised · awaiting payment" or "Paid 21 Jul")
    (`data-shot="xero-trust-refund"`). A part credit shows as 39's credit note with its stated amount
    and no refund row. `xeroPairView` gains the hold state and the refunds; update
    `xeroPairView.test.ts` and `DemoXero.test.tsx`. No NHI anywhere (convention 8).
20. **Demo triggers** (the registry in `src/shared/demoTriggers/registry.ts`; bodies in `src/store` or
    `src/shared`, so `pwaPurity` holds). See "Demo triggers" below. Registry tests:
    - route visibility per entry, and the PWA entries on `pwa` only;
    - every disabled reason;
    - "Pay out trust refund" settles exactly one refund and is then disabled for it;
    - the PWA refund stand-in ends with the refund paid and the ledger in balance;
    - the PWA reminder stand-in appends exactly one reminder.
    Never add anything to the Control Panel page. Update the Control Panel S4 scenario text
    (`DemoControlPanel.tsx`) for the new beats.
21. **Shots, recipes and the demo guide:**
    - Extend `visual/admin-prepayment-followup.spec.ts`: the move line and the updated panel, the
      cancel dialog, the trust account (held, then after a refund and a payout), the rebook dialog, the
      prepayment history. Update `xero-pair.spec.ts` (the held ACCPAY, its contact after a move, and
      the refund row) and 36's `admin-ledger.spec.ts` (the third scope). Add a mobile shot of a
      refunded cancelled Booking, mobile shots of 32's List move sheet and 32a's single-Booking move
      sheet with the prepayment line, and a PWA shot of each stand-in.
    - The recipes are the "Catalogue screenshots" step below. Do not edit catalogue files' text or
      status; the capture runner writes their `images`.
    - Patch the demo guide (below).
    - Run `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots`, all green.

## Demo triggers

Harness bar (framed build):

| Label | Screen | Surface | Effect |
|---|---|---|---|
| Stage longer prepaid procedure (`stage-longer-prepaid-procedure`) | Admin · Review (`/admin/review/:listId`) | bar | For a SUBMITTED List. `choices` are its Bookings with a sent prepayment. As `OFFICE_ACTOR`, it lengthens the prepaid Procedure's recorded anaesthetic time to `STAGE_LONGER_DURATION_MIN` (240 minutes, a named constant) through the guarded `editProcedure` (or 35's save path, if admin edits commit through a change set), so the recorded BTM is well above what the prepaid amount buys ("surgery took far longer than planned"). The message: "Recorded BTM now {n} units, for reference only. Authorise bills nothing more for the prepaid procedure; raise an additional invoice by hand if one is needed." Disabled with "Submit this List first", "No sent prepayment on this List" or "Already staged". Authorise then raises nothing for the difference; the settlement block shows Create additional invoice as the route |
| Pay out trust refund (`pay-out-trust-refund`) | Xero sim (`/demo/xero`, `/demo/xero/invoices`, `/demo/xero/invoices/:accRecId`) | bar | The bank pays an instructed refund from the trust account. `choices` are the instructed refunds (on a pair detail, only those on that ACCREC's credit notes). Calls `settleTrustRefundPayout`: the Xero refund reads Paid, the trust account moves it from Refunds due to Refunds paid, and the Booking panel reads "Refunded to the patient". Disabled with "No refund payout recorded yet. Record it on the Admin trust account first." |

Product actions (in the product UI, not the bar, unbadged):

| Label | Screen | Effect |
|---|---|---|
| Letter picker and Preview letter | 27's "Approve and send" Dialog (Booking panel, rail card, Invoices strip, invoice document) | Chooses and previews the letter that goes out with the prepayment invoice |
| Send prepayment reminder | Admin · Booking detail (`/admin/day/:dateISO/bookings/:bookingId`) | `sendPrepaymentReminder`; the panel and rail row show "Reminder sent" |
| Authorise the List | Admin · Review | 27 settles the prepaid Procedure at the prepaid amount (nothing billed for it); this phase releases the held prepayment to the lock payee ("Released to Dr X") |
| Create additional invoice / Credit note (in full or part of the prepayment) | The prepaid settlement block on an authorised prepaid Procedure: Admin Booking detail, and mobile and web for the anaesthetist's own Procedure (through 38a's archive or search) | 38b's additional invoice and 39's credit note, by hand, through the review step and the next run; recorded as events on the Procedure |
| Move a prepaid Booking or List to another anaesthetist | Admin Booking move (`MoveBookingFlow`) and Reassign List; 32's List move sheet and 32a's "Move to a colleague" sheet on mobile and web | The hook runs `repointPrepaymentPayable`: "Prepayment kept at the agreed amount · payee now Dr B", the invoice unchanged, and the Xero sim's draft ACCPAY shows Dr B while the ACCREC is unchanged |
| Cancel and refund prepayment / Refund prepayment from trust account | Admin cancel dialog; the Booking panel and the trust account's "To action" rows | `cancelBooking({ refundPrepayment: true })` or `refundPrepaymentOnCancellation`: credit in full, refund due |
| Record refund payout | Admin · Trust account (`/admin/ledger/trust`) | `recordTrustRefundPayout`: instructed, a Xero refund awaiting payment |
| Rebook with another anaesthetist | Admin · Booking detail of a cancelled Booking | `rebookWithAnotherAnaesthetist`: a new Booking whose fresh prepayment is generated at the replacement's own fixed price, held for approval |
| New template, Edit, Make default, Deactivate | Admin · Master data · Prepayment letters | Template maintenance |

PWA equivalents (the mobile Booking waits on the office; route
`/mobile/lists/:listId/bookings/:bookingId`):

| Label | Surface | Effect |
|---|---|---|
| Office sends a prepayment reminder (`pwa-office-sends-prepayment-reminder`) | PWA only (`surfaces: ['pwa']`), badge office stand-in | While the status is unpaid or part paid: `sendPrepaymentReminder(OFFICE_SIMULATION_ACTOR, bookingId)` with the default reminder. The panel shows "Reminder sent by the AA office". Disabled with "No unpaid prepayment on this booking" or "No invoice email for the payer" |
| Office refunds this prepayment from the trust account (`pwa-office-refunds-prepayment`) | PWA only (`surfaces: ['pwa']`), badge office stand-in | After Dr Souter cancels a prepaid Booking on the handset: `refundAndPayOutAsSimulatedOffice(api, bookingId)` (new, in 14's `officeStandIn.ts`) runs item 14's refund and item 15's record and settle as `OFFICE_SIMULATION_ACTOR` and the "Xero bank feed" actor, three audited commits in order. The panel reads "Refunded to the patient from the AA trust account". Disabled with "Cancel the booking first" or "Nothing to refund" |

No new PWA entry for the anaesthetist's own additional invoice or credit note on a prepaid Procedure:
they wait on the office's review, which 38b's "Office reviews this additional invoice" and 39's
"Office reviews this credit" stand-ins already cover (confirm each takes a prepayment credit). None for
the move (the anaesthetist moves their own List through 32's sheet, or a single Booking through 32a's,
on the handset as normal use, and the panel shows the payee change; a colleague moving work to Dr
Souter is 32's and 32a's existing stand-ins), the release (14's "Office authorises this List" already
authorises) or the rebook (the replacement is not the handset persona). 27's "Office approves and
sends the prepayment invoice" now sends the default letter.

## Out of scope

- Anything calculated or raised automatically after a prepaid procedure, in either direction: no
  balance invoice, no automatic credit or refund, no threshold, no "overpaid" state (OQ-61 and OQ-76
  answered). A partial prepayment (OQ-76: all or nothing).
- A dollar figure computed from the recorded BTM against the prepaid amount: the BTM is units for
  reference only.
- More than one credit per prepayment invoice, and a stated-amount credit on any invoice but a
  prepayment invoice (OQ-97 is about the prepayment; 39 credits other invoices in full).
- Recovering money from an anaesthetist for a prepayment: the hold means a prepayment is never paid
  out before the procedure. After authorise, a correction is 39's credit, with its negative invoice
  netted by 39a; with no later payment it is handled outside the system (D21).
- Refunding a credit raised through 39's credit note option, including a part credit of a prepayment:
  a credit note is not a refund, and that refund happens outside the system (US-08.6.5, note #33).
  Only the cancellation refund is paid from the trust account here.
- A separate trust payment cycle (OQ-47): released prepayment payables join 39a's weekly run.
- Any re-check, recalculation or detection on a move (D20's honour system), and crediting and
  prepaying again when a prepaid Booking moves (OQ-21's reading, "out of date" per OQ-70): it survives
  only as the rebook after a true cancellation (item 16).
- Changing the receivable half on a move (the prepayment invoice's supplier, number or amount, or the
  ACCREC): OQ-70 moves only the payable.
- Lifting `canSplitCombined`'s refusal for a prepaid combination (39's handoff, US-08.6.4): not this
  phase's scope; Phase 44 records it as an open gap against US-08.6.4 unless the owner adds it.
- Real bank details for patients, a bank-feed match for refunds, and any trust-account reconciliation
  beyond the derived view. The trust account is not a general ledger.
- Letter templates for anything but prepayment requests and reminders; rich text, attachments,
  per-anaesthetist letters, and an outbox. Phase 35's update email and its templates stay separate.
- Automatic or scheduled reminders. The reminder is an office action; 27's escalating warning stays
  the control.
- Patient-screen views of refunds beyond what Phase 40's patient position already reads from the
  ledger.

## Manual test checklist

The agent runs every item itself in the running app and reports it with evidence; none is handed
to the owner (ROADMAP.md "Owner review: agents test themselves").

- [ ] Reset. Master data, Prepayment letters: three templates, one default per kind. Edit
      "Cosmetic procedure prepayment", insert `{{estimate}}`: refused "unknown merge field". Type
      "estimated fee" into the body: refused with "State the prepaid amount as the price payable, not
      an estimate." Remove `{{prepaidAmount}}`: refused.
- [ ] S4 Beat 1 as 27 left it (Riley): set Dr Souter's own price list on the Procedure; the invoice
      reads "Awaiting approval" with no letter. "Approve and send", pick "Cosmetic procedure
      prepayment", open "Preview letter" (patient name, Rhinoplasty, Fri 24 Jul, the prepaid amount as
      the price, Dr Melanie Souter, no NHI, no "estimate"). Send. The invoice document shows the letter
      as a cover section and the rail names it.
- [ ] Edit that template's body. Riley's invoice letter is unchanged.
- [ ] "Send prepayment reminder" on Riley: the reminder names the amount outstanding; after "Payment
      received · half" a second reminder names the smaller amount. The panel, the rail row and the
      mobile Booking show "Reminder sent". The audit shows `invoice.prepaymentReminder`, and, if Phase
      40 built its follow-up log, Riley's patient record shows the reminder there.
- [ ] Held in trust: Nair's INV0001 is paid. Her panel reads "Held in the AA trust account until the
      procedure"; the payables view shows INV0001-P "Held in trust until the procedure" and the weekly
      run pays nothing for it; Dr Souter's web Accounts shows it as held, not owed now. The Xero sim
      shows the ACCPAY as Draft.
- [ ] Release and settlement: complete, submit and authorise Souter Fri 24 PM. Nothing is billed for
      Nair's rhinoplasty (27's "nothing to bill"); Forte's septoplasty invoice is unchanged. The panel
      reads "Released to Dr Souter"; the next weekly run pays INV0001-P. The settlement block on the
      rhinoplasty shows "Prepaid $1,200.00 · the price", the recorded BTM for reference and "Nothing
      is invoiced or credited automatically". Ledger in balance.
- [ ] Longer than planned: reset, complete and submit Souter Fri 24 PM, open it in Review, "Stage
      longer prepaid procedure". Authorise: no invoice, credit or failure for the difference. On the
      Booking, "Create additional invoice" for $300.00 by hand; approve it in the Events tab; the next
      run raises it with its own number, linked to INV0001, and the event shows on the Procedure.
- [ ] Part credit: as Dr Souter on web, open Nair's Booking through the archive, "Credit note", "Part
      of it", $600.00, with the "Provisional (OQ-97)" caption; submit; the office approves it; the
      run issues a credit note of $600.00 plus GST against INV0001, the negative invoice to Dr Souter
      for the same amount, the event on the Procedure, INV0001 itself unchanged, no refund row. Ledger
      and trust view in balance.
- [ ] The item 7 greps are clean; no "deposit", "estimate", "balance invoice" or "overpaid" anywhere in
      the prepayment surfaces.
- [ ] Office move: on Riley (sent, part paid), move the Booking to Dr Beaumont's Fri 24 Jul List. The
      confirm step says the prepayment keeps its agreed amount and Dr Beaumont is paid it. No new
      invoice; the panel reads "payee now Dr Beaumont" with "Provisional (OQ-80)" and "Invoice
      unchanged"; the Xero sim's draft ACCPAY contact is Dr Beaumont and the ACCREC is unchanged (Dr
      Souter's invoice, same amount). Move it back: repointed back, one audit row each way, no
      prepayment re-check row.
- [ ] Anaesthetist moves: reset; on mobile as Dr Souter, move Riley alone to Dr Beaumont through 32a's
      "Move to a colleague": the sheet shows the prepayment line, no preference prompt, and the payee
      changes. Reset; move the whole Fri 24 AM List to a colleague's free session through 32's sheet:
      one payee change per prepaid Booking. Reset; return the List to the office: the payee stays
      until the office assigns the Draft List, then changes once.
- [ ] Honour system at authorise: after the office move to Dr Beaumont, complete, submit and authorise
      her Fri 24 Jul List: Riley's rhinoplasty is priced at the prepaid amount, nothing is billed for
      it, and the payable to Dr Beaumont equals the prepaid amount.
- [ ] Cancel: open the refund Booking in Admin, Cancel. The dialog shows "Prepayment received · $X ...
      held in the AA trust account". "Cancel and refund prepayment": a credit in full against the
      prepayment invoice, Refund due, the draft ACCPAY voided, and nothing to net or recover from Dr
      Souter (39's negative invoice wholly offset). The credit number opens the credit-note document,
      which names the original prepayment invoice. Ledger in balance. 39's credit note option on that
      cancelled Booking's prepayment invoice is refused with "A cancelled booking's prepayment is
      refunded from the trust account."
- [ ] Trust account (`/admin/ledger/trust`): tiles, the held rows, the part credit under "Credited",
      the refund in "Due", the movements. "Record refund payout" with the default reference: "Awaiting
      bank". The Xero sim pair shows the refund row "Authorised · awaiting payment". "Pay out trust
      refund": Paid. The trust identity and the Ledger stay in balance.
- [ ] Rebook: on the cancelled Booking, "Rebook with another anaesthetist", Dr Beaumont, her List on
      the same date. The preview says "New prepayment at Dr Beaumont's own price: $1,350.00". Rebook:
      the new Booking is on her own price list and its fresh prepayment invoice is generated at
      $1,350.00, "Awaiting approval"; Approve and send with the default letter; the original invoice
      is untouched; both Bookings show the two prepayments.
- [ ] Rebook refusals: before refunding (`toAction`), and choosing Dr Souter again.
- [ ] Unpaid path: reset, approve and send Riley's invoice (nothing paid), then cancel Riley as the
      office: "Cancel and credit prepayment"; credit in full, no refund, nothing to pay out.
- [ ] Anaesthetist cancel path: reset, then on mobile cancel the refund Booking as Dr Souter: the sheet
      notes the office refunds it; the Booking reads "Prepayment to refund" for the office, appears
      under "To action" on the trust account, and the Ledger badge counts it. "Refund prepayment from
      trust account" there completes it.
- [ ] Labels: only the trust account's "To verify with AA" pill and the two provisional captions
      (OQ-80 on the payee line, OQ-97 on the part-credit field) remain; no OQ-03, OQ-40, OQ-42, OQ-61,
      OQ-70 or OQ-76 label anywhere.
- [ ] S3, the S4 beats, 38b's, 39's and 39a's figures match item 1 (with only the re-pinned figures
      moved, each with its reason).
- [ ] PWA build, the refund Booking on the handset: cancel it, open the demo-actions sheet, "Office
      refunds this prepayment from the trust account" (office stand-in badge): the panel reads
      "Refunded to the patient". On Riley: "Office sends a prepayment reminder". Move a prepaid Booking
      through 32a's sheet and a prepaid List through 32's: the prepayment line shows. On Nair after
      authorise, raise a part credit and use 39's "Office reviews this credit": issued. Bottom sheets,
      teal actions, no crimson, and no "slot" in any copy.
- [ ] Teal is the only action colour, crimson only in the nav, amounts and numbers in mono with
      tabular-nums, no NHI in letters or the Xero sim, and no en or em dashes in any new copy or
      seeded template.
- [ ] Catalogue screenshots: the recipes for the covered items (US-06.3.6, US-06.4.1 and US-06.5.1 to
      US-06.5.4) are filled or updated, any recipe this phase broke is re-pointed, a full `npm run
      capture` ends with no failed recipe and no story without a recipe, the covered items' new shots
      are checked by eye, and `npm run verify:board` is green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots` and `npm run verify:board`
      are all green.

## Demo guide updates

Patch these in the same session, in `docs/demo-guide/` and the matching sections of
`master-demo-guide.html` (S4 and the cheat sheet's "Prepayment" and "The money model" sections, as
Phases 27, 32a, 36, 38b, 39 and 39a left them):

- `03-demo-script.md` **S4 Beat 1** (27's "Prepayment from the prepaid list"): Click becomes "Approve
  and send, pick the Cosmetic procedure prepayment letter and preview it"; Say adds "The letter states
  the prepaid amount as the price, and says the anaesthetist may send a further invoice or a credit if
  the procedure turns out very different."
- The S4 beat where Fri 24 PM is authorised (27's "nothing to bill"): add "Nair's prepayment was held
  in AA's trust account until now; authorising releases it to Dr Souter, paid in the next weekly
  run", and show the settlement block: the prepaid amount as the price, the recorded BTM for
  reference, nothing raised automatically.
- **S4 new beat, "Raised by hand, if at all"** (after the authorise beat): Stage it with "Stage
  longer prepaid procedure", Authorise (nothing raised), then "Create additional invoice" by hand; and
  on another reset, as Dr Souter on web, a "Credit note" for part of the prepayment. Say: "After a
  prepaid procedure the prepaid amount is the price. The system never invoices or credits the
  difference by itself, however large. If the work turned out very different, the anaesthetist or the
  office raises an additional invoice or a credit note by hand, and it shows on the procedure."
- **S4 new beat, "Held in trust, moved, refunded and rebooked"** (after that; check the numbering
  38b, 39 and 39a left):
  - **Click:**
    - Admin, Ledger, Trust account: the held prepayments.
    - Riley: "Send prepayment reminder"; then move her Booking to Dr Beaumont's Fri 24 Jul List:
      "payee now Dr Beaumont", the invoice unchanged, and in the Xero sim the draft ACCPAY's new
      contact beside the unchanged ACCREC.
    - The refund Booking: Cancel, "Cancel and refund prepayment".
    - Trust account: the refund due; "Record refund payout".
    - Xero sim, the pair: Demo actions, "Pay out trust refund".
    - Back on the cancelled Booking: "Rebook with another anaesthetist", Dr Beaumont.
  - **Say:** "Prepayment money sits in AA's trust account until the procedure is done, so nobody is
    paid for work that has not happened. If the booking moves, it works on trust: the patient is not
    billed again, the agreed amount stands and the anaesthetist who does it claims no more. Only who
    gets paid changes. If it is cancelled, the patient is refunded in full from the trust account, as
    a credit against the original invoice. A true rebook starts a fresh prepayment at the new
    anaesthetist's own price, so the patient may see two amounts."
  - **Expected:** the held rows; the payee change with no new invoice and the receivable unchanged;
    credit in full, refund due, instructed, paid; the new Booking with its own prepayment awaiting
    approval; both amounts visible.
- Any S4 beat, discovery point or cheat-sheet line that still narrates a balance invoice, a top-up, an
  overpaid prepayment kept or an estimate becomes "nothing automatic, raised by hand" (27 rewrote most;
  sweep what is left).
- S4 "Discovery points": OQ-80 (whether the payee is still updated on a move under the honour system,
  and when the pair is created), OQ-97 (a credit for part of a prepayment) and OQ-47 (the weekly
  cycle, as 39a words it). Drop any OQ-03, OQ-40, OQ-42, OQ-61, OQ-70 or OQ-76 point (answered: say
  them as built).
- `04-presenter-cheat-sheet.md` "Prepayment" (27's rewrite) and "The money model": add letters that
  state the price and reminders, nothing automatic after the procedure with the by-hand additional
  invoice and part credit, held in trust until the procedure, refund on cancellation, the move rule
  (the honour system; only the payee moves) and the rebook at the new anaesthetist's own price.
  "Prototype readiness" moves these from "Still upcoming" to "Built and clickable".
- `02-workflows-and-handoffs.md`: the cancellation workflow adds "a paid prepayment is refunded in full
  from the trust account"; the "Prepayment" case adds letters, settlement by hand, the trust hold and
  release, the move rule and the refund; the anaesthetist's move workflows (32's List move and 32a's
  single-Booking move) add the payee line.
- `01-personas-and-responsibilities.md`: the office persona "maintains the prepayment letters, sends
  reminders, and handles prepayment refunds from the trust account"; the anaesthetist persona "raises
  an additional invoice or a credit note by hand on their own prepaid procedure when the work turned
  out very different".
- `docs/demo-guide/README.md` status row and the master guide's status table: "Prepayment letters,
  settlement by hand, trust account hold and refunds, move and rebook".
- The Control Panel S4 scenario text (item 20).
- This is not a milestone phase. Still reread the S4 section of `master-demo-guide.html` against the
  edited Markdown so beat numbers, figures and trigger labels agree.

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19),
run after the review pass and before the PROGRESS.md entry. Re-run
`node docs/prototype-build/catch-up/tools/recipe-status.mjs 41` first: earlier phases (27, 38b and 39
in particular) will have changed these recipes since this plan was written. US-06.4.2 has left this
phase (Retired); Phase 27 marks its recipe "Retired: merged into US-06.4.1": confirm it.

**Covered items.** When the phase is done, each recipe in `requirements-board/capture/recipes/`
matches what was built:

| Item | Recipe at plan time | When this phase is done |
|---|---|---|
| [US-06.3.6](../../../../requirements-board/requirements/stories/US-06.3.6.md) Prepayment letter templates | absent · stub ("Not built yet: catch-up Phase 41 builds this."; 27 keeps it absent with "Phase 41 adds the letter picker beside Approve and send") | captured; empty `absentReason`. Admin shots: `letter-templates` (Master data, Prepayment letters, `data-shot=letter-templates`: three templates, one default per kind), `letter-picker` (27's Approve and send Dialog on Riley's Fri 24 Jul AM Booking after her own price list is set, `prepayment-letter-picker`, with the preview open, showing the prepaid amount stated as the price), `letter-on-invoice` (the invoice document with the letter as its cover section, `prepayment-letter`) and `reminder` (the Send prepayment reminder dialog and the "Reminder sent" line, `prepayment-reminder`). Caption: "Prepayment letter, stating the prepaid amount as the price, chosen when the invoice is approved" |
| [US-06.4.1](../../../../requirements-board/requirements/stories/US-06.4.1.md) No automatic invoice or credit after a prepaid procedure | captured · admin-balance-invoice (caption "Balance invoice after the procedure, final fee less the paid prepayment", stale); Phase 27 renames the shot `prepaid-price` and leaves it partial ("the additional invoice and credit note raised by hand on a prepaid Procedure come with Phases 38b, 39 and 41") | captured; drop the partial reason and confirm no balance-invoice caption survives. Keep 27's `prepaid-price` (Nair authorised: priced at the prepaid amount, the BTM for reference). Add admin `by-hand` with states `settlement` (the settlement block, `[data-shot=prepaid-settlement]`: "Prepaid $1,200.00 · the price", the BTM for reference, "Nothing is invoiced or credited automatically", the two actions), `longer` (after the `trigger` step `stage-longer-prepaid-procedure` and Authorise: still nothing raised) and `additional-invoice` (the additional invoice raised by hand, its event on the Procedure); and web `part-credit` (Dr Souter's credit sheet on Nair through the archive, `[data-shot=prepayment-part-credit]`, "Part of it", $600.00) with a mobile state of the same block. Captions: "After a prepaid procedure the prepaid amount is the price; nothing is invoiced or credited automatically" and "An additional invoice or a credit note, raised by hand, on a prepaid procedure" |
| [US-06.5.1](../../../../requirements-board/requirements/stories/US-06.5.1.md) Trust account | absent · stub (27: "No trust account hold; Phase 41 holds and releases the prepayment payable.") | captured; empty `absentReason`. Admin shots `trust-account` at `/admin/ledger/trust` (tiles and the held rows, Nair's INV0001 held until Fri 24 PM is authorised; highlight `trust-account`) and `payables-trust-held` (39a's weekly run row "Held in trust until the procedure", never offered to a run). Web Accounts and mobile Balances shot `held-in-trust` for Dr Souter: "Prepayments held in trust · $X · paid after the procedure". Caption: "Prepayment held in trust until the procedure" |
| [US-06.5.2](../../../../requirements-board/requirements/stories/US-06.5.2.md) Refund a prepayment on cancellation | absent · stub (27: "No refund path; cancelling withdraws a held prepayment invoice and keeps a sent one for Phase 41's refund.") | captured; empty `absentReason`. Admin shots `cancel-prepayment-refund` (the cancel dialog's "Prepayment refund" section with "Cancel and refund prepayment") and `trust-refunds` with states `to-action`, `due` (after the refund), `awaiting-bank` (after Record refund payout) and `paid` (after "Pay out trust refund" from the Xero sim bar entry, a `trigger` step); a simulator shot `xero-refund` at `/demo/xero/invoices/:accRecId` for the refund row; a mobile shot `cancel-note` (Dr Souter cancelling a prepaid Booking sees "The AA office refunds it in full from the trust account"). Highlights on the refund section and rows. Caption: "Prepayment refunded in full from the trust account on cancellation" |
| [US-06.5.3](../../../../requirements-board/requirements/stories/US-06.5.3.md) Prepayment for a replacement anaesthetist | absent · stub (27 may upgrade it to partial with a new Booking's own prepayment) | captured; empty `absentReason`, no OQ caption. Admin shots `rebook-dialog` (`rebook-dialog`: Dr Beaumont, her List on the same date, "New prepayment at Dr Beaumont's own price: $1,350.00") and `prepayment-history` (both Bookings: "Earlier prepayment · Dr Souter · $1,200.00 · refunded" and "This prepayment · Dr Beaumont · $1,350.00"). Caption: "Rebooked with another anaesthetist after a cancellation, with a fresh prepayment at their own price" (not "their own rate" or "estimate") |
| [US-06.5.4](../../../../requirements-board/requirements/stories/US-06.5.4.md) Prepaid Booking moved to another anaesthetist | absent · stub; Phase 27 makes it partial (`moved`: "the prepaid amount stands and the patient is not billed again"; reason "the payable's payee is not yet repointed; Phase 41 does that") | captured; empty reason. Keep 27's shot and add admin `move-confirm` (the Booking move confirm step: "The prepayment keeps its agreed amount of $X. Dr Beaumont is paid it after the procedure.") and `prepayment-repointed` (the panel "Prepayment kept at the agreed amount · payee now Dr Beaumont" with the "Provisional (OQ-80)" caption and "Invoice unchanged"); a simulator shot `xero-payee` (the draft ACCPAY contact Dr Beaumont beside the unchanged ACCREC); web and mobile shots `move-sheet` of 32a's "Move to a colleague" sheet with the prepayment line, and a mobile state of 32's List move sheet. Caption: "Moved prepaid Booking: on trust, the agreed amount stands and only the payee moves to the new anaesthetist" |

**Recipes this phase breaks.**

- Every recipe that clicks 27's "Approve and send" (27 re-points the ten that clicked "Raise
  pre-procedure invoice": `US-06.2.2`, `US-06.3.1`, `US-06.3.2`, `US-06.3.4`, `US-06.4.1`,
  `US-08.2.2`, `US-09.2.1`, `US-09.2.3`, `US-09.2.4`, `US-09.3.4`, plus any 27 added such as
  `US-06.3.5` and `US-03.1.8`): this phase puts that button behind the letter picker, so each needs the
  picker's own "Approve and send" click added, keeping shot names.
- Nair's INV0001 is no longer disbursed on 16 Jul (held in trust until Fri 24 PM is authorised):
  re-check `US-05.2.7`, `US-06.2.2`, `US-06.3.1`, `US-08.4.1` and `US-09.1.1` (all name INV0001;
  `US-06.2.3`'s recipe is Retired since 27), and the Xero-sim pair shots that show its ACCPAY.
- The weekly runs exclude held prepayments: re-check the run recipes `US-08.3.4`, `US-09.2.4` and
  `US-10.1.2` (and 39a's `US-10.2.7`), and the payment recipes on XR0001 (`US-06.3.4`, `US-06.4.1`,
  `US-09.2.1`, `US-09.2.3` and `US-09.2.4`). If XR0001 is a prepayment pair, a receipt no longer
  authorises its ACCPAY and no run pays it before authorise, so `US-09.2.1`'s "ACCPAY authorised"
  state and `US-09.2.4`'s disbursement need a non-prepayment pair (or an authorise step first); keep
  their shot names and captions true.
- 39's credit recipes (`US-08.6.5`, `US-08.6.2`) that showed the prepayment invoice refused: re-check
  their captions now that a prepayment invoice is creditable; 38b's `US-08.6.3` keeps its shots.
- The move confirm steps and sheets gain the payee line: re-check `US-06.3.5` (27's `moved` state),
  32's and 32a's move recipes (`US-01.4.3`, `US-01.4.6`, `US-01.4.7`) and `US-01.4.1`.
- `US-02.5.3.json` (cancelled Booking; the story's automated criterion is Future Work) opens the
  cancelled-Booking view; confirm it still resolves with the cancel dialog and panel changes.

**ATLAS.md.** Update "Routes" (`/admin/ledger/trust`, the Master data Prepayment letters view),
"Personas and IDs" (Riley, Nair and Dr Beaumont's Fri 24 Jul Lists, Dr Beaumont's own price list, the
refund Booking and their invoice ids), "Seed data worth shooting" (the held and released prepayments,
the refund Booking), "Overlays that need clicks" (the letter picker, the credit sheet's part option,
the cancel dialog, the rebook dialog, the move confirm and the 32 and 32a move sheets) and "Existing
hooks" (the new `data-shot` hooks listed in work items 10 and 18, and the new demo-action rows).

## Adversarial review (after build)

After the manual test checklist and the four commands are green, and before writing the PROGRESS
entry, run the standard adversarial review-and-fix pass (PROGRESS convention 18). Fan out independent
Opus review subagents: quality, bugs/correctness and plan adherence, plus a fourth, money lens,
because this phase holds and moves patient money. Then this session verifies every finding against the
catalogue, this plan and the code, fixes the confirmed ones (with a test where a bug had none),
re-greens, and records the pass. Do not re-raise anything settled in the Decisions log except the
readings this phase explicitly supersedes.

**Steer this phase's reviewers at:**

- **Nothing automatic.** No code path, run, retry or seed computes a difference between the recorded
  BTM and the prepaid amount, or raises an invoice, credit, negative invoice or refund for it, in
  either direction, with no threshold anywhere. The only invoices and credits after a prepaid
  procedure are those a person raised through 38b's and 39's actions, each an event on the Procedure.
  No "deposit", "estimate", "balance invoice" or "overpaid" wording survives.
- **Money conservation.**
  - The ledger equation (item 8, with item 15's `refundsPaid`) and the trust identity (item 13) hold
    to the cent after every step: receipt, release, payee change, part credit, refund, payout, rebook.
  - A held prepayment is never released, approved for payment or paid before its List is AUTHORISED,
    by any path (receipt, weekly run, retry, seed).
  - A refund never exceeds what was received; a credit never exceeds what was invoiced; a part credit
    reverses exactly its amount of the payable.
  - The locked prepaid price (27) is never altered; a negative group without a prepayment line still
    fails with `negativeTotal`.
- **Honour system on a move (D20, D38).** Every move path (office Booking move, reassign List, 31's
  assign, 32's three moves, 32a's single-Booking move) reaches `repointPrepaymentPayable` exactly once
  through the one hook, repoints only the payable's payee, never raises an invoice, never runs a
  re-check or reads a price, and never touches the receivable leg, the prepayment invoice or the
  ACCREC. The release payee always equals the lock payee. A moved prepaid Procedure is priced at the
  prepaid amount like any other, with no rate logic.
- **One path each.** Every credit goes through 39's credit path and Xero mirror (the part credit
  through `statedCreditFor` and 39's `reversalPlan` input); every payee change before authorise
  through `repointPrepaymentPayable`; every release through 16's extended rule; every exclusion
  through 39a's `runExclusionFor`. No second credit type, release rule, payee writer or run filter.
- **Refund rules.** Always the full amount received on cancellation; paid, part-paid and unpaid
  invoices all credited; office only; refused on an AUTHORISED List; idempotent; nothing ever netted
  or recovered from an anaesthetist (39's negative invoice wholly offset). A cancel is never refused
  because of a prepayment; non-office cancels leave `toAction`. Only `prepaymentRefund` credits are
  paid out of the trust account; 39's credit note option, part or full, never pays a refund.
- **Rebook rules.** Nothing transfers between anaesthetists. The fresh prepayment comes from 27's
  engine, at the replacement's own fixed price from their first-party Contract, held for approval. The
  Booking create path is reused; the original anaesthetist's own Contract is never copied across.
- **Letters.** Every template states the prepaid amount as the price (the `estimateWording` and
  `missingPrepaidAmount` rules); no NHI in any letter; the snapshot is immutable after a template
  edit; merge fields validate; names come from `shared/format.ts`; a letter is rendered only at
  approval.
- **Labels.** Only the trust account's Verify pill and the two provisional captions (OQ-80, OQ-97),
  each in one place; no OQ-03, OQ-40, OQ-42, OQ-61, OQ-70 or OQ-76 label survives. No gold-plating:
  no bank matching, scheduled reminders, rich-text letters, trust cycle or BTM dollar comparison.
- **Rights, audit and determinism.** Every action audits before and after through `mutate()`, with the
  right actor (office, the anaesthetist on their own Procedure, "Billing run", "Billing engine", "Xero
  bank feed", the simulated office). Clock from state only; no `Date.now()`, `new Date()` or
  `Math.random()`. Seed determinism and the filler `rng()` order are unchanged, and `PERSIST_VERSION`
  is bumped once per session that changed the seed.
- **Triggers and PWA.** Each entry shows only on its routes and surface; the stand-ins are badged; the
  bodies live in `src/store` or `src/shared`; `pwaPurity` passes.
- **Design and vocabulary.** Teal the only action colour, crimson never on the new surfaces, tints from
  the tokens, mono with tabular-nums for money and numbers, no en or em dashes in any copy or seeded
  template, "move" (never "swap"), no "slot" in app copy, and the prepaid amount never called an
  estimate or a deposit.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry; ROADMAP.md "Owner review: agents test
  themselves"): the defaults built for open questions (D38 / OQ-80's repoint of the payee only, on any
  move before the procedure, despite "no logic to detect these flows"; D31 / OQ-97's stated-amount
  part credit, one per prepayment invoice; OQ-47's no separate trust cycle, as 39a built it); the
  readings below (the payable as the half that moves; the prepayment invoice keeping the first
  anaesthetist as its named supplier after a move; a credit of a prepayment by hand pays no refund
  from the trust account although US-06.5.1 says payments out of trust are made from the system; the
  refund's credit issued at once with the refund dialog as its review step rather than through 38b's
  queue and next run; a credit in full before authorise making the Procedure bill normally; another
  anaesthetist's first-party Contract kept on a moved prepaid Procedure), anything logged rather than
  fixed, and the screens worth a look, each with its route and persona.
- Status row for catch-up Phase 41, and a phase entry covering:
  - the drift-check result and the OQ states (OQ-03, OQ-21, OQ-40, OQ-42, OQ-61, OQ-70, OQ-71, OQ-73
    and OQ-76 built as answered; OQ-80 and OQ-97 built as defaults and labelled; OQ-47 left in 39a's
    place);
  - what 27, 32, 32a, 36, 38b, 39 and 39a were found to provide, the hook's name and every move path
    that reaches it, how 16's release rule was extended for the hold, and how 39's `submitCredit`,
    `cause` and `reversalPlan` were widened (prepayment invoices, the stated amount,
    `'prepaymentRefund'`);
  - the session 1 and session 2 split and the adversarial pass;
  - the tests added (letter renderer and wording rule, template actions, approval letter, reminder,
    nothing-automatic parity, the by-hand additional invoice and part credit on a prepaid Procedure,
    hold and release, the repoint per move path, trust view, refund, payout, rebook, triggers,
    parity);
  - `PERSIST_VERSION` old to new (each bump);
  - the re-pinned figures after items 9 and 17 (Nair's prepayment no longer disbursed on 16 Jul, the
    seeded backdrop run, the ledger's held total), and the refund Booking's and the rebook's figures;
  - the handoff for Phase 44: US-08.6.4's prepaid-combination split is still refused (39's handoff,
    not picked up here).
- **Catalogue screenshots:** the recipes created or changed (by ID), the `capture/REPORT.md` counts
  before and after (captured, partial, absent, failed), the recipes this phase broke and how they were
  re-pointed, the stale US-06.4.1 balance-invoice caption confirmed gone, and any partial reason
  handed to a later phase.
- Decisions log:
  - **Superseded:**
    - The Phase 10 payment rule that a received prepayment authorises its ACCPAY pro rata at once:
      a prepayment is held in trust until its List is AUTHORISED (OQ-40), then released to the lock
      payee.
    - The Phase 08 run's `negativeTotal` belt for an overpaid prepayment, and its "manual credit"
      wording: with the price locked at the prepaid amount (27) the case no longer arises; the belt
      stays for every other negative (record here only if 27 did not).
    - The earlier plan readings of this phase, never built: the balance invoice citing the prepayment,
      the overpaid prepayment kept (OQ-03's old answer), the estimate notice in every letter, the
      agreed-rate settlement of a moved prepaid Procedure, and the payee repoint run from 27's re-check
      on a move cause. All replaced by "nothing automatic, by hand" (OQ-61, OQ-76) and the honour
      system (D20).
  - **Extended, not superseded:** the 7th review B23 audited soft-cancel stands (a cancelled Booking is
    retained, visible and excluded from billing); cancelling a prepaid Booking now also refunds its
    prepayment from the trust account.
  - **New readings:**
    - A prepayment payable's payee before authorise changes only through `repointPrepaymentPayable`,
      called from the one move hook; the agreed amount stands, nothing is re-checked, and the
      receivable half (the prepayment invoice and the ACCREC) never changes (US-06.5.4, D20). The
      payable is our reading of which half moves; that it moves at all is OQ-80's default (D38).
    - After a prepaid procedure nothing is raised automatically; a prepayment invoice is creditable
      by hand through 39's credit note option, in full or, per OQ-97's default (D31), for a stated
      part, reversing the same amount of the payable; such a credit pays no refund from the system.
    - A cancellation refunds only money actually received; sent unpaid prepayment invoices are
      credited, not refunded; under the hold 39's negative invoice is wholly offset against the
      never-released payable, so no recovery from an anaesthetist arises.
    - The trust account is a derived view over prepayment pairs, credits and refund records; released
      prepayment payables are paid in 39a's weekly run (no separate trust cycle while OQ-47 is open).
    - The payout is two steps: recorded in the system, then paid by the bank (the Xero sim trigger).
      Only cancellation refunds are paid out of the trust account.
    - Rebooking after a true cancellation creates a new Booking on the replacement's own price list;
      its fresh prepayment comes from 27's engine at their own fixed price, and nothing moves between
      anaesthetists.
    - Letters are plain-text templates that must state the prepaid amount as the price (no estimate
      wording), rendered at approval and snapshotted on the invoice; reminders are office actions,
      never scheduled.
