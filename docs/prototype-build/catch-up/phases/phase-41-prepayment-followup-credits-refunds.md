# Phase 41 · Prepayment letters, settlement, trust account and refunds

**Requirements covered:**
[US-06.3.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.3.6.md) (Proposed; letter templates picked when an admin approves the generated prepayment invoice, and the reminder that follows them up),
[FT-06.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-06.4.md) (Verify, OQ-61, OQ-76; settlement after the procedure: Phase 27 built the balance run and the excess record, this phase builds the citation, the overpaid surfaces and the wording),
[US-06.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.4.1.md) (Verify, OQ-61, OQ-76; moved here from Phase 27 in the 2026-10-03 re-plan: the balance invoice deducts the prepayment and cites the prepayment invoice by number and link, worded "prepayment", never "deposit"),
[US-06.4.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.4.2.md) (Verify, OQ-76; no refund and no credit when prepaid exceeds final),
[FT-06.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-06.5.md) (Verify, OQ-70 answered),
[US-06.5.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.5.1.md) (Verify; held in trust until the procedure),
[US-06.5.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.5.2.md) (Verify; refunded in full on cancellation),
[US-06.5.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.5.3.md) (Verify; a true cancellation rebooked with another anaesthetist, the only place the OQ-21 reading survives),
[US-06.5.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.5.4.md) (Verify, OQ-70 answered, OQ-80 open; a moved prepaid Booking keeps the agreed amount and only the payable half of its draft pair is updated, the receivable unchanged);
[DM-21](../analysis/domain-model-delta.md#dm-21) (trust account: prepayment held pending, refunded in
full on cancellation, kept when the Booking moves, only the payable half amended).
Also builds, without closing them: the letter-template master part of
[DM-20](../analysis/domain-model-delta.md#dm-20) (the prepayment lifecycle, counted under Phase 27),
and the prepayment half of [DM-06](../analysis/domain-model-delta.md#dm-06) (the payable follows the
doer; counted under Phase 32a, which leaves "the prepayment payable must be repointed explicitly" to
this phase). This finishes EP-06's letters, settlement, trust account, refund and move half. No
reverse finding is closed here ([reverse check](../analysis/reverse-check.md)): RV-09 is Phase 27's;
its "overpayment becomes a credit" clause is superseded by OQ-03's answer, which this phase builds.

**Owner decisions built as answered (no provisional label):** D20 (OQ-70, 2026-10-02): a prepaid
Booking moved to another anaesthetist keeps the agreed amount, the anaesthetist who does it wears or
benefits from the difference, and only the payable half of the draft pair is updated to them; the
receivable from the patient is unchanged, because the trust account in Xero always has to balance.
D5, D6 and D7 (27 and 32 built them), D21 (OQ-71: a negative invoice with no later payment is handled
outside the system; a cancelled prepayment is not that case, because the money is still in trust),
D22 (OQ-72: 39's credit note option, which pays no refund) and D23 (OQ-73: prepayment only for a
person paying for the patient, so a refund always goes back to a person). OQ-03 (an overpayment is
kept), OQ-40 (held in trust until the procedure, refunded in full on cancellation) and OQ-42 (a
refund after payout is a credit note plus a negative invoice) are answered too.

**Open, built as the recommendation and kept in one place each:**
[OQ-80](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-80.md) (when the
pair is created and amended: Phase 27 creates it at generation; this phase amends only the payable,
on any move before the procedure; one doc comment on `repointPrepaymentPayable`),
[OQ-76](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-76.md) (all or
nothing, over-runs and under-runs: all or nothing, an over-run is the positive balance 27's balance run
invoices, an under-run is the excess 27's excess path accepts; 27's comment, untouched here),
[OQ-61](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-61.md) (every
positive balance is invoiced; 27's balance run) and
[OQ-47](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-47.md) (no separate
trust payment cycle; 39a's run). None of these carries a UI caption; the trust account keeps one "To
verify with AA" pill because FT-06.5 is Verify and its payment cycle (OQ-47) is open.

**Depends on:** Phase 27 (the derived requirement, the stored `BookingPrepayment` with its estimate
snapshot, the engine's `syncPrepayment(api, bookingId, cause)` re-check with its move causes
`bookingMoved` and `listMoved` and its outcome `agreedAmountKept`, `generatePrepaymentInvoice` (the one
place the draft pair is created, OQ-80) held for approval, `approvePrepaymentInvoice` ("Approve and
send"), `prepaymentBasisAnaesthetist` (D20: once sent, the anaesthetist on the invoice), the reworked
`prepaymentStatusFor` with part paid, `PrepaymentPanel` with its "Agreed with Dr X" line,
`prePaidByProcedure` carrying the invoice id, the "Less pre-payment already invoiced" deduction line
and the prepaid-above-final `prepaymentExcess` record), Phase 32a (`moveBookingToAnaesthetist`, the
anaesthetist's single-Booking move to a colleague with its `booking.movedToAnaesthetist` audit and the
cause `bookingMoved`, its mobile and web move sheet with the line "A prepayment already sent keeps its
agreed amount.", and, through 32a, Phase 32's own List moves `moveListToOffice`, `pushListToSlot` and
`markUnavailableAndMoveList` in `store/listMoveActions.ts` with `list.ownerMove` and the cause
`listMoved`, 31's `assignDraftList`, 28's `moveListToSlot` with `reassignList` over it, and 15's
office `reassignBooking` behind the Admin `MoveBookingFlow`), Phase 39 (credit notes: the pure
`creditInFull` and `reversalPlan`, `applyCredit` on the ledger pair, the payable reversal, the negative
invoice to an anaesthetist already paid, the Xero credit-note mirror `handoffCorrection`, the
credit-note document, and credits recorded as events on Phase 38b's element) and Phase 39a (the
payables run record per period with its approve-for-payment step, which the trust hold keeps
prepayment payables out of until the procedure, and `runExclusionFor`, the one run exclusion point it
left for this phase's hold).
Through them: 36's `LedgerPair` (with `prepaidAboveFinal` on the prepayment pair), `applyReceipt`,
`ledgerPosition`, `ledgerChecks` and the Admin Ledger screen; 25's lock (the rate, the payee and the
pre-payment already invoiced); 22's delivery, supplier and `lineage` (`balanceOfPrepayment`) and the
Related invoices rail card; 21's billable party and `invoiceEmail`; 26's unit values and prepaid sets;
17's soft blacklist warning helper; 16's `payableReleasedFor`; 15's Booking vocabulary; 15a's warning
routine; and 14's trigger registry, actors and office stand-ins.
**Also uses, by build order rather than as formal dependencies** (numbered before 41 but not reached
through 27, 32a, 39 or 39a, so confirm in PROGRESS that each is DONE): 35's admin save path (the
"Stage overpaid prepayment" trigger commits through it if admin edits are change sets) and 40's
patient follow-up log. If 40 is not done, skip item 6's follow-up bullet and record it.
**Estimated:** 2 sessions. Session 1: work items 1 to 10 (figures pinned, letters end to end, the
reminder, settlement (the balance invoice's citation and the overpaid prepayment accepted), and the
trust hold with its release at authorise and the reseed), ending green with shots. Session 2: items 11
to 21 (the payable-half update on every move and the agreed-rate settlement, the trust account view,
refund on cancellation, the payout, the rebook, the Xero sim, triggers, PWA stand-ins and the demo
guide). If session 2 runs long, land the payable-half update (item 12) and the refund and payout
(items 14 and 15) green first, and build the rebook (item 16) last.

## Goal

Finish the prepayment story. Most of it is Verify, so keep it thin, but build the answers given on
2026-10-01 and 2026-10-02, not defaults.

- **Letters.** When an admin approves a generated prepayment invoice to send (27's "Approve and
  send"), they pick one of a small set of standard letter templates and see a preview. The letter goes
  out with the invoice. Templates carry merge fields (patient, procedure, estimate, anaesthetist) and
  always word the amount as an estimate that may come out higher or lower. Admins maintain the
  templates in Master data. "Send pre-payment reminder" on the Booking sends a reminder letter for an
  unpaid or part-paid prepayment.
- **Settlement after the procedure (FT-06.4, US-06.4.1).** At authorise, 27's balance run deducts the
  prepayment already invoiced from the final fee and invoices any positive balance (OQ-61's
  recommendation; an over-run is that balance, OQ-76). The balance invoice now cites the prepayment
  invoice by number on the deduction line and in its note, and links to it through 22's lineage both
  ways. It says "prepayment", never "deposit".
- **Overpaid prepayment accepted (OQ-03 answered, US-06.4.2).** When the final fee at authorise is
  below what was prepaid, nothing is credited and nothing is refunded. Billing proceeds: no balance
  invoice, no failure, and the prepayment's payable is released in full to the anaesthetist who did
  the procedure. The excess Phase 27 records shows as accepted, on Review, the prepayment panel and the
  Billing monitor. The `negativeTotal` message, kept for other negatives, drops its "manual credit"
  wording.
- **Held in trust until the procedure (OQ-40 answered).** Prepayment money received sits in AA's trust
  account as a pending payment. Its payable is not released, and so never reaches a payables run,
  until the Booking's List is AUTHORISED. It is then released to whoever did the procedure (25's lock
  payee) and paid on the next payment run. The trust account view shows prepayments held, released,
  refunds due and refunds paid.
- **Refund on cancellation.** Cancelling a Booking with a paid prepayment refunds it in full from the
  trust account: a credit against the prepayment invoice through 39's credit path (linked in the
  ledger to the original invoice), a refund due, and the payout recorded from the system (US-06.5.1:
  payments out of the trust account are made from the system). Because the money was held, the
  anaesthetist was never paid, so there is nothing to recover. This is not 39's credit note option,
  which pays no refund (US-08.6.5, D22: "One's cash, one's not").
- **Moved prepaid Booking (US-06.5.4, D20).** A prepaid Booking moved to another anaesthetist before
  the procedure, as a whole List (28, 31, 32) or as a single Booking (the office's move, or the
  anaesthetist's own through 32a), is not billed again. The agreed amount stands. Only the payable half
  of the prepayment's draft pair is updated to the anaesthetist who now holds it: the ledger's payable
  leg and the draft Xero ACCPAY. The receivable leg, the prepayment invoice and the draft ACCREC are
  unchanged, so the Xero trust account balances. One store action does it, called from 27's re-check on
  every move. At authorise, the moved Booking is settled at the agreed rate, so the new anaesthetist
  wears or benefits from the rate difference and the patient never pays it.
- **Rebook after a true cancellation (US-06.5.3).** "Rebook with another anaesthetist" on a cancelled
  Booking creates a new Booking under the replacement. The engine generates a fresh prepayment at
  their own unit value, held for approval as 27 does. The original is refunded, never transferred,
  and both estimates are visible.

> Names below are the names Phases 15 to 39a planned (`Booking`, `bookingId`, `BookingDetailBody`,
> `CancelBookingSheet`, `createBooking` in `store/bookingActions.ts`, `syncPrepayment`,
> `approvePrepaymentInvoice`, `prepaymentStatusFor`, `LedgerPair`, `ledgerPosition`,
> `moveBookingToAnaesthetist`, `moveListToOffice`, `pushListToSlot`, `markUnavailableAndMoveList`).
> Phase 39 planned its credit as a 38b event of kind `'credit'` (`CreditEventDetail`, with a `cause`)
> raised by `submitCredit`, reviewed through 38b's standard step and issued by the in-commit helper
> `issueCreditInto(draft, creditEventId, atISO)` from 38b's `runEventInvoicing`, producing a
> `CreditNote` record in `billing.creditNotes` (`cause: 'correction' | 'split'`, `originalInvoiceId`)
> and a `NegativeInvoice` (`status: 'offset' | 'toNet'`); pure `creditInFull`, `reversalPlan` and `xeroCorrectionPlan` in
> `domain/billing/creditNote.ts`; `applyCredit` in 36's `ledger.ts` (the pair gains
> `credit: { creditNoteId; atISO; heldForPayer; recoveryDue }`); `ledgerPosition` totals
> `creditsHeldForPayers` and `recoveryDueFromAnaesthetists`; `handoffCorrection(api, creditNoteId)`
> for the Xero mirror; and the credit-note document at `/admin/credit-notes/:creditNoteId`. Phase 39a
> planned the `PayablesRun` record, its approval step and netting. An earlier plan named a
> `moveBookingToDoer` action: it does not exist; 32a's `moveBookingToAnaesthetist` is the doer move.
> Use what their PROGRESS entries record where it differs. Where this plan says "39's credit path" it
> means that single path, which this phase widens (a new `cause`) and never copies.

## Before you start: drift check

1. From the repo root, run:

   ```
   git diff 3d3a18c -- "docs/discovery-reference/Updated Requirements/catalogue" "docs/discovery-reference/Updated Requirements/domain-model.md"
   ```

   Look for changes to US-06.3.6, FT-06.4, US-06.4.1, US-06.4.2, FT-06.5, US-06.5.1 to US-06.5.4, and
   to the items this phase leans on: US-06.2.3 (the estimate wording), US-06.2.4, US-06.3.1 (generated
   and approved, its pair), US-06.3.2, US-06.3.5 (the re-check on a move), US-08.6.2 (credit and
   rebill), US-08.6.5 (the credit note option, no refund), US-10.2.1 (payment release), US-10.2.5 and
   US-10.2.6 (39a's run), US-01.4.6 (the doer rule), US-01.4.7 (the single-Booking move), US-01.4.3 and
   US-01.5.5 (32's moves), US-02.5.3 (record a cancellation; its automated criterion is Future Work),
   US-12.1.1 (own unit value), FT-08.3, and the domain model's Prepayment section and glossary rows
   "Prepayment" and "Trust account". If an item changed, re-read it and adjust the work items. If one is
   now Retired or Future, drop it from this phase and record that in the PROGRESS entry.
2. **Owner decisions.** D5 (no prepayment gate, a warning, 15a and 27), D6 (generated at setup, sent on
   admin approval, 27), D7 (the anaesthetist moves their own List or a single Booking with no
   confirmation, 32 and 32a) and D20 (the moved prepaid Booking, 27 and 32a keep the amount, this phase
   updates the payable half) are answered and built. Confirm from the PROGRESS entries that:
   - 27's "Approve and send" is the single send path (the letter picker joins it here), and the
     engine generates a held invoice for any new Booking that needs prepayment (the rebook relies on
     it);
   - every move path calls 27's `syncPrepayment` after commit with a move cause: the office's
     `reassignBooking` (`bookingMoved`) and `reassignList` / `moveListToSlot` (`listMoved`), 31's
     `assignDraftList` (`listMoved`), 32's `moveListToOffice`, `pushListToSlot` and
     `markUnavailableAndMoveList` (`listMoved`), and 32a's `moveBookingToAnaesthetist`
     (`bookingMoved`). Item 12 hooks the payable-half update onto that one call. A path that skips the
     call or passes another cause is fixed in that path, never given a second trigger.
3. **Open questions.** OQ-03, OQ-40, OQ-42, OQ-70, OQ-71 and OQ-73 are Answered at `3d3a18c`; build
   the answers with no label. Four linked questions are still Open:

   | OQ | Build (recommendation, kept in one place) | If answered differently |
   |---|---|---|
   | **OQ-80** (when the prepayment pair is created and amended) | Created at generation (27's `generatePrepaymentInvoice`); amended only on the payable side, on any move before the procedure (item 12's `repointPrepaymentPayable`, one doc comment naming OQ-80). A cancellation credits both halves (item 14); the release at authorise stamps the lock payee (item 8) | "Create the pair when the money is received": 27's generation and item 12 both move to the receipt, and the update has nothing to amend before payment. Change the two functions, not the callers |
   | **OQ-76** (all or nothing, over-runs and under-runs) | All or nothing; an over-run is the positive balance 27's balance run invoices; an under-run is the excess 27's excess path accepts (item 7). 27's one comment on the amount rule names OQ-76 | A partial share is a percentage on 27's estimator; "no bill for an over-run" is a change to 27's balance run. Nothing here moves except the settlement copy |
   | **OQ-61** (always invoice a positive balance?) | Every positive balance is invoiced. That rule is 27's balance run; this phase only cites the prepayment on it | A threshold: change 27's balance run in its one place |
   | **OQ-47** (payment day and cycle) | No separate trust payment cycle. A released prepayment payable joins 39a's next payables run like any other; 39a holds the OQ-47 reading | A weekly trust cycle: a run setting on 39a's record, not a change here |

4. **Read what Phases 14, 15, 15a, 16, 22, 25, 26, 27, 28, 31, 32, 32a, 35, 36, 38b, 39, 39a and 40
   actually built** (their PROGRESS entries):
   - 14: the registry entry shape (`id`, `routes`, `surfaces`, `badge`, `choices`, `disabledReason`),
     `OFFICE_ACTOR` and `OFFICE_SIMULATION_ACTOR` in `store/demoActors.ts`, and `officeStandIn.ts`.
   - 15: the renamed files and ids (`store/bookingActions.ts` with `createBooking`, `shared/booking/`,
     `AdminBookingDetail`, `seed/bookings.ts`, `BookingCancellation`, `BookingSource`). 15b removed
     Copy a Booking: the rebook never copies.
   - 16: `payableReleasedFor` (`domain/billing/payableRelease.ts`), the one release rule the hold
     extends.
   - 22: `InvoiceDelivery` and sends, the invoice `supplier` (the anaesthetist in whose name it is
     issued), `lineage` with the role `balanceOfPrepayment`, and the Related invoices rail card.
   - 25: the lock's `payee` and its per-Procedure rate (the unit value and where it came from), which
     36 reads as the pair's payee and item 12's agreed-rate settlement feeds.
   - 26: which colleagues have prepaid sets and unit values (Souter $26.50, Beaumont $31.00).
   - 27: the `BookingPrepayment` shape, `syncPrepayment` and its causes and outcomes,
     `approvePrepaymentInvoice` and every surface that calls it (panel, rail card, Invoices strip,
     invoice document, the PWA stand-in), `Invoice.approval`, the status set, `PrepaymentPanel` and its
     "Agreed with Dr X" line, `prepaymentBasisAnaesthetist`, the prepayment warning text, the
     `prepaymentExcess` build result and 27's Review chip "Pre-paid more than the final fee: $X", the
     deduction line "Less pre-payment already invoiced" and the balance note 27 left as it was, the
     OQ-76 comment on the amount rule, and the seeded Riley and Nair figures.
   - 28 and 31: how a List is created on a Slot, `moveListToSlot`, which DRAFT Lists exist on Fri 24
     Jul and later, and `assignDraftList`.
   - 32: `moveListToOffice`, `pushListToSlot`, `markUnavailableAndMoveList`, their `list.ownerMove`
     audit, where each calls `syncPrepayment` (inside the shared core or after it), and the move sheets
     on mobile and web with their prepayment line.
   - 32a: `moveBookingToAnaesthetist`, `booking.movedToAnaesthetist`, its doc comment naming D20 and
     OQ-80 (this phase's hook), the receiver search sheet and its confirm step ("Dr Hughes is paid for
     it." and "A prepayment already sent keeps its agreed amount."), and the PWA colleague stand-in.
   - 35: whether admin edits commit through a draft-then-save change set, which the "Stage overpaid
     prepayment" trigger must then use instead of calling `editProcedure` directly.
   - 36: `PayableLeg`, `applyReceipt`, `ledgerChecks` (`releasedNotReceived`), `ledgerPosition`,
     `anaesthetistPosition`, `prepaidAboveFinal` on the prepayment pair, whether the pair carries its
     own `anaesthetistId` beside the payable leg's, the Ledger routes and the footnote that says
     receipts held include prepayments.
   - 38b and 39: the credit-note type and its `cause` union, whether a credit is recorded as an event on
     the Procedure (38b's element), `creditInFull`, `reversalPlan` and `applyCredit`, how 39 built
     OQ-77 (whether a credit reverses the payable), the `NegativeInvoice` record (39 raises one for
     every credit, wholly offset against the payable when nothing was paid out, so `toNet` is 0),
     `xeroCorrectionPlan` (a draft ACCPAY with nothing authorised is voided), `creditsHeldForPayers`
     and how a held credit is marked refunded, the `kindNotCreditable` refusal on prepayment invoices in
     `submitCredit`, whether `issueCreditInto` can be called from another commit, `handoffCorrection`, the credit-note document route and how the Xero sim shows
     credit notes.
   - 39a: the `PayablesRun` record, `buildRunDraft` and how a run selects payables (released minus
     disbursed minus offset), `runExclusionFor` (the hook where this phase adds `'heldInTrust'`), the
     period approval step, the remittance advice, the backdrop runs it grouped the seeded
     disbursements into (including the seeded prepayment payout `PR-SEED-01`), and the payables
     screen's run table.
   - 40: the patient follow-up log (`PatientFollowUp`, `logPatientFollowUp`).
   Adjust the work items to reuse what exists instead of adding a second copy.
5. Note the current `PERSIST_VERSION` (16 after 15a session 1; 15b to 40 will have raised it).
6. Record the result (including "no drift", the OQ states and what 27, 32, 32a, 36, 39 and 39a
   provide) in the PROGRESS entry.

## Reference

- **Design** (convention 17):
  - `docs/design/Design Language.dc.html`: semantic tints (success for refunded, released and paid,
    warning for refund due and awaiting bank, info or neutral for held in trust and the accepted
    overpayment), neutral pills for letter and refund states, Spline Sans Mono with tabular-nums for
    every amount and every invoice, credit-note and refund number, radius 14 cards, and teal as the
    only action colour. Crimson appears only in the side nav's active state and avatars, never on the
    letter preview, the refund section, the trust tiles or any button.
  - `docs/design/Admin Review.dc.html`: the stat-tile row (the trust account tiles), the table (the
    trust movements and the letter template list) and the flag chips.
  - `docs/design/Admin Day.dc.html`: the right-rail white cards (27's "Pre-payments" rows gain a
    "Reminded" line) and the dark side nav (the Ledger badge counts refunds to action).
  - `docs/design/Mobile App.dc.html`: the Booking detail white cards and the bottom-sheet pattern
    (the anaesthetist's cancel sheet note, 32's and 32a's move sheets, the trust and refund lines on
    the panel).
  - No mockup covers a letter, a template editor or a trust account. Extend the Admin Review tiles and
    table and the invoice document's paper layout; do not invent a new visual language.
- **Catalogue:** the covered files above, plus US-06.2.3, US-06.2.4, US-06.3.1, US-06.3.2, US-06.3.5,
  US-08.6.2, US-08.6.5, US-10.2.1, US-10.2.5, US-01.4.6, US-01.4.7, US-02.5.3, US-12.1.1; OQ-03, OQ-21,
  OQ-40, OQ-42, OQ-70, OQ-71 and OQ-73 (answered), OQ-61, OQ-76, OQ-80 and OQ-47 (open); the evidence
  notes `catalogue/notes/2026-10-01-aa-meeting-with-greg.md` (points #2, #16, #18, #32 (the templated
  letter at approval) and #57) and
  `catalogue/notes/2026-10-02-aa-meeting-with-greg.md` (points #2 (OQ-61 still open), #11 (OQ-70: only
  one half moves; "the trust account in Xero always has to balance"), #12 (OQ-71), #21 (the prepayment
  is an estimate), #33 (a credit note is not a refund), #42 (all or nothing, over-runs) and #47
  (OQ-80)); and `domain-model.md` (Prepayment, and the glossary rows
  "Prepayment" and "Trust account").
- **Gap analysis:**
  - `GAP-ANALYSIS.md`: Summary, theme 5 ("Prepayment reversed"), "Structural first" (DM-22 before
    DM-21), the Prepayment trigger cluster, and the Uncertainty bullets on OQ-61, OQ-76 and OQ-80.
  - `epics/EP-06.md`: EP-06, US-06.3.6, FT-06.4, US-06.4.1, US-06.4.2, FT-06.5, US-06.5.1 to
    US-06.5.4.
  - `gaps.json` entries for the covered IDs, DM-06, DM-20, DM-21 and DM-42:
    - FT-06.4 and US-06.4.2 are Contradicts: the overpaid case fails with `negativeTotal` "needs a
      manual credit" (27 makes it bill cleanly; this phase builds its surfaces and wording);
    - US-06.4.1 is Partial: the balance is invoiced, but the deduction line and the note cite no
      prepayment invoice number and nothing links the two invoices;
    - FT-06.5 and US-06.5.1 are Contradicts: today the prepayment payable is authorised on receipt and
      paid out before the procedure (seeded disbursement 16 Jul for a 24 Jul procedure);
    - US-06.5.2 is Missing; US-06.5.3 is Partial (a new Booking prices at its anaesthetist's unit
      value, but nothing refunds or links);
    - US-06.5.4 is Partial: nothing updates the payable half on a move, the Xero payee stays the first
      anaesthetist while mirror lookups follow the new List, and a final at the new anaesthetist's
      rate less the first anaesthetist's prepayment would bill the patient the rate difference, against
      "wears or benefits" (item 12's agreed-rate settlement answers this).
  - `analysis/domain-model-delta.md`: DM-20, DM-21, DM-22 (the ledger), DM-24 (credit and rebill),
    DM-06 (the payable follows the doer) and DM-42 (the single-Booking move).
- **Code entry points** (line numbers from `analysis/prototype-map-*.md` and the code at 15a session
  1; every file has moved through 15b to 40):
  - `src/domain/types.ts`: `Booking` (with 27's `prepayment` and 15's `BookingSource`),
    `BookingCancellation`, `Invoice` (27's `approval`, 22's `delivery`, `supplier` and `lineage`), the
    Xero types (`XeroAccPay.amountAuthorised`), 36's `LedgerPair`, `PayableLeg`, `LedgerReceipt`,
    `LedgerDisbursement`, 39's `CreditNote` and `XeroCreditNote`, 39a's `PayablesRun`, `DemoSettings`.
  - `src/domain/billing/`: 16's `payableRelease.ts`, `invoiceBuild.ts` (the deduction line about 390,
    which 27 rewords to "Less pre-payment already invoiced", and the `negativeTotal` message about
    418, which still says "an overpaid pre-payment needs a manual credit"), 27's `prepayment.ts` and
    `prepaymentEstimate.ts`, 36's `ledger.ts`, 39's `creditNote.ts`, 22's `invoicePresentation.ts`,
    `money.ts`, `index.ts`.
  - `src/store/`:
    - `lifecycle.ts`: `cancelBooking` 348, `reassignList` 543, `reassignBooking` 635, `authoriseList`
      262;
    - 28's `slotActions.ts` (`moveListToSlot`), 31's Draft List actions (`assignDraftList`), 32's
      `listMoveActions.ts` and 32a's `moveBookingToAnaesthetist`;
    - `paymentActions.ts` (header 1 to 30: the ACCPAY authorised pro rata on receipt, which the hold
      stops for prepayment pairs); `payablesActions.ts` (`runPayables` about 146; 39a's run);
    - `prepaymentActions.ts` (27's actions and `syncPrepayment`);
    - `billingRun.ts` (`runBillingForList` about 68, where 27 records the excess);
    - 39's `creditActions.ts`; 36's `ledgerActions.ts` and `ledgerSelectors.ts`;
    - `xeroHandoff.ts` (the ACCPAY contact fixed to the original anaesthetist at handoff, 168 to 202;
      39's `handoffCorrection`);
    - `bookingActions.ts` (`createBooking`); `mastersActions.ts`; `mutate.ts` (`ID_FORMATS`,
      `resetDomainState`);
    - `officeStandIn.ts` and `demoActors.ts` (14); `selectors.ts` (`prepaymentStatusFor`).
  - `src/shared/booking/`: `BookingDetailBody` and 27's `PrepaymentPanel`;
    `src/shared/flows/CancelBookingSheet.tsx`, `flows/index.ts`; `src/shared/audit/actionLabels.ts`,
    `fieldLabels.ts`, `auditNarrative.ts`; `src/shared/format.ts` (`drSurname`, `nameWithoutTitle`,
    the money formatter); `src/shared/demoTriggers/` (`registry.ts`, `types.ts`, `context.ts`).
  - `src/apps/admin/`: `screens/AdminBookingDetail.tsx`, `screens/MasterData.tsx` (left sub-nav; 27's
    "Pre-payment" section), `screens/InvoiceDocument.tsx` (the balance notes at 513 to 514: the
    split-deposit branch "A pre-payment deposit has already been invoiced ..." and "This procedure was
    pre-paid; this invoice covers any remaining balance."), 39's credit-note document,
    `screens/ReviewScreen.tsx`, `reviewFlags.ts`, `screens/BillingMonitorScreen.tsx` (or 39a's
    payables screen), 36's `screens/LedgerScreen.tsx`, `components/SideNav.tsx`,
    `components/RightRail.tsx`, `flows/ReassignListFlow.tsx`, `flows/MoveBookingFlow.tsx`,
    `routes.tsx`, `src/router.tsx`.
  - `src/apps/mobile/` and `src/apps/web/`: 32's List move sheet and 32a's "Move to a colleague"
    sheet, and web Accounts and mobile Balances (the anaesthetist's held prepayments line).
  - `src/apps/demo/DemoXero.tsx` (`PairDetail`, 39's credit-note panel), `xeroPairView.ts`,
    `DemoControlPanel.tsx` (the S4 scenario text).
  - Seed: `src/domain/seed/bookings.ts` (Riley on Souter Fri 24 AM, Nair on Souter Fri 24 PM),
    `index.ts` (`SEED_MARKERS`), `billing.ts` (`buildSeedBillingSlice`, the paid INV0001 / BC0001
    prepayment disbursed by `SEED_PREPAYMENT_DISBURSED_ISO = '2026-07-16T09:00:00'` at 65, 218 and 245,
    payables run `PR-SEED-01`), `cast.ts` (Souter $26.50, Beaumont $31.00, 26's prepaid sets),
    `rvgCodes.ts` (41800 Rhinoplasty, 5 base units, held by 19a's default RVG Contract).
  - Tests: `prepayment.test.ts`, `prePaymentInvoice.test.ts` (182 to 186 enshrine `negativeTotal` for
    an overpaid prepayment; 27 changes them), `billingRun.test.ts`, 39's credit tests,
    `ledger.test.ts`, `lifecycle.test.ts`, 32's `listMoveActions.test.ts` and 32a's move tests,
    `seedBilling.test.ts`, `seed.test.ts`, `demoScenarios.test.ts`, `persistMigrate.test.ts`,
    `pwaPurity`, `xeroPairView.test.ts`, `DemoXero.test.tsx`, `mastersActions.test.ts`,
    `ReassignListFlow.test.tsx`. Shots: `visual/admin-phase09.spec.ts` and 27's prepayment specs, 36's
    `admin-ledger.spec.ts`, `xero-pair.spec.ts`. Capture recipes: see "Catalogue screenshots".

## Work items

**Session 1: letters, the reminder, settlement and the trust hold.**

1. **Pin the figures first.** Before changing code, add `src/store/prepaymentFollowupParity.test.ts`,
   keyed on invoice numbers and Booking ids, never on pair or credit ids. From the current build,
   capture:
   - the S3 invoice totals, the S4 beats' figures and 39's credit-and-rebill and 39a's payables run
     figures;
   - Riley's and Nair's prepayment statuses, stored amounts and, for Nair, the balance invoice after
     authorising Souter Fri 24 PM with the seeded times (27's top-up) and its total;
   - `ledgerPosition` of the seed and of each seeded anaesthetist with money (36), including
     `imbalance` 0 and no checks;
   - every seeded Booking's `prepaymentStatusFor`.
   Item 7's citation changes only the deduction line's description and the balance note, never an
   amount. Item 9's reseed (Nair's prepayment no longer disbursed on 16 Jul) moves Souter's paid-out
   total, the seeded payables run and the ledger's prepayment totals on purpose. Re-pin those there,
   with the reason; everything else must pass unchanged at the end of session 1.
2. **Types, session 1 part** (`domain/types.ts`; DM-20's letter master, DM-21's hold):
   - `LetterMergeField = 'patientName' | 'procedure' | 'procedureDate' | 'estimate' | 'anaesthetist'
     | 'invoiceNumber' | 'amountOutstanding'`. The first five are the catalogue's (patient, procedure,
     estimated amount, anaesthetist) plus the date; `invoiceNumber` and `amountOutstanding` exist
     because the letter goes out with the invoice and the reminder names what is still owed.
   - `PrepaymentLetterTemplate = { id; kind: 'request' | 'reminder'; name; body; isDefault: boolean;
     active: boolean; updatedBy?; updatedAtISO? }`, held in `masters.prepaymentLetterTemplates`.
     `body` is plain text with `{{field}}` placeholders; no HTML, no rich text.
   - `RenderedLetter = { templateId; templateName; kind; body; renderedAtISO }`: a snapshot, so a later
     template edit never changes a letter already sent.
   - `Invoice` gains `letter?: RenderedLetter` (set on a prepayment invoice when approved and sent) and
     `prepaymentReminders?: { atISO; by; to; letter: RenderedLetter; amountOutstanding }[]`.
   - 36's `prePayment` `LedgerPair` gains `trustRelease?: { atISO; payeeAnaesthetistId; cause:
     'authorised' }`. An issued (approved and sent) prepayment pair with no `trustRelease` and no
     `credit` is **held in trust**. Derive it; never store a second "held" flag. Keep the words apart
     in code and copy: 27's and 36's "held" pair is an invoice awaiting approval (never summed, never
     in trust); "held in trust" is a sent one.
   - `ID_FORMATS` (`mutate.ts`): `letterTemplate` (`LT`, pad 3). Thread the new master through the
     empty slices, `freshAppState`, `resetDomainState` and the seed slice types.
3. **Pure letter module** (`domain/billing/prepaymentLetter.ts`, exported from the billing index,
   with `prepaymentLetter.test.ts`; US-06.3.6, US-06.2.3):
   - `LETTER_MERGE_FIELDS`: the field list with a label each ("Patient name", "Procedure", "Procedure
     date", "Estimated amount", "Anaesthetist", "Invoice number", "Amount outstanding").
   - `PREPAYMENT_ESTIMATE_NOTICE`: one fixed paragraph the renderer always appends, whatever the
     template says: "This amount is an estimate. The final anaesthetic fee is calculated after your
     procedure and may be higher or lower. Any balance is invoiced after the procedure." It must not
     promise a refund or credit of an overpayment (OQ-03). A template cannot remove it, so every
     letter words the amount as an estimate (US-06.3.6 paragraph 2, US-06.2.3).
   - `validateLetterTemplate(t)`: refusals `emptyName`, `nameTooLong` (60), `emptyBody`, `bodyTooLong`
     (2,000 characters), `unknownMergeField` (names the field, for example `{{patient}}`),
     `missingEstimate` (a request template must contain `{{estimate}}`), `missingAmountOutstanding` (a
     reminder must contain `{{amountOutstanding}}`).
   - `renderPrepaymentLetter(template, data: Record<LetterMergeField, string>)`: replaces every
     placeholder, appends the notice, and returns the body. Missing data renders as a visible "[not
     set]" rather than an empty gap. Pure, no clock: the caller stamps `renderedAtISO`.
   - The store builds `data` in a selector `letterMergeDataFor(state, bookingId, invoiceId?)`:
     - patient name only, never the NHI;
     - the prepaid Procedures' descriptions (27's prepaid-Procedure selector), joined with "and";
     - the List date in the invoice document's date format;
     - the prepayment invoice total, GST inclusive as the invoice shows it;
     - the anaesthetist on the invoice (22's `supplier`, 27's basis anaesthetist) through
       `shared/format.ts` (names have one home; if importing it into the store makes a cycle, move the
       helper, never copy it);
     - the invoice number, and the outstanding amount from 36's receivable leg.
   - Tests: every field replaced; unknown and missing fields refused; the notice always present and
     last; "[not set]" for missing data; no NHI anywhere in the output for a seeded Booking; the
     notice never contains "refund" or "credit"; the same input gives the same output.
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
     approval tests and the guardian addressee test still pass.
6. **Send pre-payment reminder** (`sendPrepaymentReminder(api, actor, bookingId, templateId?)` in
   `prepaymentActions.ts`; US-06.3.6, US-06.3.2's "follow up"):
   - Office only (plus 14's `OFFICE_SIMULATION_ACTOR` for the PWA stand-in).
   - Allowed while 27's status is `unpaid` or `partPaid` (a sent invoice) and the List is not
     AUTHORISED.
   - Refusals: `noOutstandingPrepayment` ("There is no unpaid pre-payment on this booking."),
     `noInvoiceEmail` ("Add an invoice email for the payer to send a reminder.", when 22's delivery
     has no address), `templateInactive`, `templateWrongKind`.
   - Renders the reminder with `amountOutstanding` from the receivable leg, appends to the
     prepayment invoice's `prepaymentReminders`, and audits `invoice.prepaymentReminder` (after:
     template, to, amount outstanding). It never changes the prepayment status or 15a's warning.
   - A selector `lastPrepaymentReminder(state, bookingId)` for the panel and the rail row.
   - Phase 40's patient follow-up log: in the same `mutate`, append a done `PatientFollowUp` (`kind`
     widened with `'prepaymentReminder'`, text "Pre-payment reminder sent for {invoice number}",
     `invoiceId`) through 40's helper. If 40 shipped no follow-up log, skip this bullet and record it.
   - Tests: rights; refusals (including a held invoice); two reminders append two entries; the
     amount outstanding reflects a half payment; nothing else changes.
7. **Settlement after the procedure** (`invoiceBuild.ts`, `billingRun.ts`, `InvoiceDocument.tsx`, 36's
   pair; FT-06.4, US-06.4.1, US-06.4.2; OQ-03 answered, OQ-61 and OQ-76 as 27 built them):
   - **Confirm what 27 and 36 built.** The balance run deducts only sent prepayment invoices and
     invoices any positive balance (OQ-61's recommendation; an over-run is this balance, OQ-76). A
     counterparty group negative only because of prepayment deduction lines raises no invoice and no
     failure; 27 records `prepaymentExcess`, and 36 keeps it as `prepaidAboveFinal` on the prepayment
     pair, outside `imbalance`. If either still fails the Booking or raises anything, fix it there, in
     its one place. Do not add a threshold or a second balance rule.
   - **The balance invoice cites the prepayment (US-06.4.1).**
     - The deduction line names the invoice it deducts: "Less pre-payment already invoiced on
       INV0001". `prePaidByProcedure` already carries the invoice id; thread the number into the pure
       build (one line per prepayment invoice when a Procedure has more than one), so the description
       is built in `invoiceBuild.ts` and tested there. Amounts never change.
     - The balance invoice records 22's `lineage` `{ role: 'balanceOfPrepayment', invoiceId }` for
       every prepayment invoice it deducts, set by the run, never typed.
     - The balance note on the invoice document becomes "This procedure was pre-paid on invoice
       INV0001. This invoice is for the remaining balance after the procedure." (one invoice number per
       prepayment). No "deposit" anywhere: drop the split-deposit branch of the note if 27 left it, and
       the prepayment invoice's own note keeps 27's estimate wording.
     - 22's Related invoices rail card shows the link both ways: on the balance invoice "Pre-payment
       invoice INV0001" and on the prepayment invoice "Balance invoice INV00xx", each linking to the
       other document. 36's Ledger row and the Billing monitor's row detail name the prepayment
       invoice on the balance line.
     - Tests: the deduction line carries the number; two prepayment invoices give two lines and two
       lineage entries; the lineage resolves to real invoice ids; no "deposit" in any built invoice line,
       note or rendered string (a test over the seeded and built invoices, plus
       `grep -rni "deposit" aa-prototype/src/apps aa-prototype/src/shared` returning nothing); the
       figures pinned in item 1 do not move.
   - **No credit, no refund (US-06.4.2).** Add tests that, for a prepaid amount above the final at
     authorise: zero credit notes, zero trust refunds and zero balance invoices are created; the
     Booking reads billed; the prepayment payable is released in full (the prepaid amount, not the
     final) to the payee by item 8; the ledger stays in balance; the locked price (25) is not altered;
     a sibling hospital group on the same Booking bills normally; replaying the run is a no-op.
   - **The message.** A negative group with no prepayment line still fails with `negativeTotal`. Drop
     "an overpaid pre-payment needs a manual credit" from its message (39 left it for this phase):
     "The lines billed to one counterparty add up to a negative amount ($X). Review the price override
     before rebilling." Gate:
     `grep -rnE "manual credit|Credit handled in a later release" aa-prototype/src aa-prototype/visual`
     returns nothing.
   - **One read.** A selector `prepaymentSettlementFor(state, bookingId)` returning
     `{ prepaymentInvoices, balanceInvoice?, prepaidAboveFinal?, credits[], refunds[] }` (credits and
     refunds fill in session 2), used by the panel, the invoice document and the Ledger row. It reads
     the balance invoice through the lineage, never by guessing from dates.
   - Tests as above, plus: an estimate exactly equal to the final raises nothing; an estimate below
     the final still bills the positive balance with the cited deduction line (OQ-61's recommendation,
     27's rule, unchanged).
8. **The trust hold and its release at authorise** (16's `payableRelease.ts`, 36's `ledger.ts`,
   `paymentActions.ts`, `lifecycle.ts`; US-06.5.1, FT-06.5, DM-21; OQ-40 answered):
   - **Pure rule.** `payableReleasedFor(received, amount, { heldInTrust })` (16's one rule, extended,
     never copied): 0 while `heldInTrust`, otherwise as today. A pure `isHeldInTrust(pair)` in
     `ledger.ts`: a `prePayment` pair, issued, with no `trustRelease` and no `credit`.
   - **Receipts.** 36's `applyReceipt` on a held pair records the receipt and leaves `releasedAmount`
     at 0; the Xero ACCPAY stays `draft` (the payment path in `paymentActions.ts` no longer authorises
     it pro rata for a held pair). 36's `ledgerChecks.releasedNotReceived` uses the same rule, so a
     held pair is not a check.
   - **Release.** `releaseTrustHeldPrepayments(api, listId)`, called inside `authoriseList`'s commit
     (before or within 27's balance run, so one AUTHORISED transition releases and bills together),
     for each held prepayment pair on the List's non-cancelled Bookings:
     - set the payee to 25's lock payee (the anaesthetist who did it, US-01.4.6) through the pure
       `withPayablePayee(pair, anaesthetistId)` that item 12 also uses. It changes the payable leg's
       payee (and any pair-level payee field 36 derives from it) and never the receivable leg, the
       invoice's supplier or the ACCREC;
     - set `trustRelease` and `releasedAmount = payableReleasedFor(received, amount)` (now not held),
       and authorise the Xero ACCPAY for that amount;
     - audit `ledgerPair.trustReleased` (after: payee, amount released) as the "Billing run" actor.
     A receipt after release releases at once, as any procedure pair does. A prepaid amount above the
     final is released in full (item 7).
   - **Payables runs.** A held pair's released amount is 0, so 39a's `buildRunDraft` has nothing to
     pay on it. Also add `'heldInTrust'` (from `isHeldInTrust`) to 39a's `runExclusionFor`, the one
     exclusion point 39a left for this hold, so the run draft and the payables view can say why the
     row is out ("Held in trust until the procedure"). Add a test that a run on a period holding a
     received, held prepayment pays nothing for it, lists it as excluded, and pays it after authorise.
   - **Ledger position.** 36's (and 39's) equation gains one term:
     `heldInTrust = sum(receivable.receivedAmount on held prepayment pairs)`, and
     `imbalance = receiptsHeld - payablesDue - heldInTrust - creditsHeldForPayers + recoveryDueFromAnaesthetists`.
     `ledgerPosition` and `anaesthetistPosition` return `heldInTrust` (per anaesthetist: held for
     the current payee, labelled "held until the procedure", never in `owedToThem`).
   - Tests, each asserting the ledger is in balance to the cent at every step:
     - the US-06.5.1 AC: a paid prepayment, procedure not done, nothing released or paid to the
       anaesthetist, and a payables run pays nothing for it;
     - authorise releases it to the lock payee; the next run pays it;
     - part paid before, the rest after authorise;
     - a prepayment above final released in full;
     - a held invoice (27's awaiting approval) at authorise is withdrawn by 27, not released;
     - idempotent: authorising twice (or a retry) never releases twice.
9. **Seed, session 1** (wherever 18 to 26 keep masters, `seed/billing.ts`; bump `PERSIST_VERSION` by
   one):
   - Three templates, bodies with no en or em dashes:
     - `LT001` "Standard pre-payment estimate" (request, default): "Dear {{patientName}}, thank you for
       booking your {{procedure}} with {{anaesthetist}} on {{procedureDate}}. The estimated anaesthetic
       fee is {{estimate}}, payable before your procedure. Please pay invoice {{invoiceNumber}} using
       the details it shows."
     - `LT002` "Cosmetic procedure pre-payment" (request): the same facts, adding that cosmetic
       procedures are not publicly funded or covered by ACC, and that payment is needed three working
       days before the procedure.
     - `LT003` "Pre-payment reminder" (reminder, default): "Dear {{patientName}}, our records show
       {{amountOutstanding}} of the estimated anaesthetic fee for your {{procedure}} on
       {{procedureDate}} is still to pay. Please pay invoice {{invoiceNumber}} before your procedure,
       or contact the AA office if you have any questions."
   - The seeded approved INV0001 (Nair) gets `LT001`'s rendered letter, stamped at its seeded approval
     time, built with the same renderer (never a hand-typed body).
   - **Reseed the hold.** INV0001 stays paid, but its payable is held in trust: no disbursement on
     16 Jul, `releasedAmount` 0, the Xero ACCPAY `draft`, and INV0001-P out of the seeded payables run
     (`PR-SEED-01` and 39a's backdrop `PayablesRun` built from it). If that backdrop run, its Xero
     disbursement and its batch payment held only INV0001-P, they go with it (no empty seeded run);
     39a's backdrop builder regenerates the rest from the remaining disbursements, so no other run or
     remittance figure moves. Retire `SEED_PREPAYMENT_DISBURSED_ISO` if nothing else uses it. Any
     billed history Booking with a prepayment is seeded released at its List's authorise time, and any
     seeded balance invoice carries the citation and lineage of item 7. Never change the filler
     generator's `rng()` draw order.
   - Still no seeded Booking with prepaid above final (27's assertion stays).
   - `seed.test`: every template validates; exactly one active default per kind; no prepayment pair is
     released or disbursed before its List is AUTHORISED; the seed ledger is in balance with
     `heldInTrust` equal to INV0001's total; two builds are deep-equal. Update `seedBilling.test.ts`,
     `demoScenarios.test.ts` and `persistMigrate.test.ts`. Re-pin item 1's moved figures with the
     reason.
10. **Session 1 surfaces, triggers and exit:**
    - **Master data, "Pre-payment letters"** (`MasterData.tsx`, a new left sub-nav view after 27's
      "Pre-payment" section; `data-shot="letter-templates"`):
      - a table: Name, Kind (Request or Reminder), Default (a neutral pill), Active, Updated;
      - "New template" and a row "Edit" open a Dialog: name, kind (new only, Segmented), a body
        TextArea, a row of merge-field chips that insert `{{field}}` at the cursor, and a live preview
        beside it rendered with the renderer against a named sample (`LETTER_PREVIEW_SAMPLE`: a
        fictional patient, 41800 Rhinoplasty, Dr Souter, an estimate of $396.18). The fixed notice
        shows in the preview in a neutral box headed "Always included";
      - "Make default" and "Deactivate" row actions; refusals render verbatim.
    - **Approve and send with a letter.** Every surface where 27 put **Approve and send** (the panel,
      the rail card, the Invoices strip, the invoice document) now opens one short Dialog
      (`data-shot="prepayment-letter-picker"`): a "Letter" select of active request templates (default
      first), a "Preview letter" disclosure rendered for this Booking, the recipient, and "Approve and
      send". One shared component; the rail and strip keep a single click to open it. The
      anaesthetist's panel shows "The AA office sends the pre-payment letter."
    - **Invoice document** (`InvoiceDocument.tsx`): a sent prepayment invoice with a letter renders
      the letter as a cover section above the invoice, on the same paper and print stylesheet
      (`data-shot="prepayment-letter"`), with "Letter: Standard pre-payment estimate · sent with this
      invoice" in the rail. Reminders list under it (date, to, amount outstanding), each expandable to
      its snapshot.
    - **Balance invoice citation** (`data-shot="balance-cites-prepayment"` on the deduction line and
      note): the cited deduction line, the reworded note and the Related invoices links from item 7, on
      the invoice document and in 27's panel ("Balance invoice INV00xx · cites INV0001").
    - **"Send pre-payment reminder"** on 27's `PrepaymentPanel`, office surface, while `unpaid` or
      `partPaid` (`data-shot="prepayment-reminder"`): a teal action opening a Dialog with the reminder
      template select, the preview, the recipient address and "Send reminder". The panel then shows
      "Reminder sent 21 Jul 10:04 to {address}". On mobile and web the anaesthetist sees the same line
      read-only. 27's "Pre-payments" rail row adds "Reminded 21 Jul" when one exists.
    - **Held in trust on screen:**
      - the panel, on a received prepayment before authorise: "Held in the AA trust account until the
        procedure · $X" (neutral), and after authorise "Released to Dr Souter · $X · paid in the next
        payment run" (success);
      - the payables view (39a's run screen or the Billing monitor's payables table): a held
        prepayment row reads "Held in trust until the procedure" with no amount due, and is never
        offered to "Run payables" (`data-shot="payables-trust-held"`);
      - web Accounts and mobile Balances (36's `anaesthetistPosition`): "Pre-payments held in trust ·
        $X · paid after the procedure", separate from what is owed now.
    - **Overpaid on screen:** after authorise the panel reads "Pre-paid more than the final fee · $X
      kept. No refund or credit." (neutral), and the Billing monitor's row detail and 27's Review chip
      keep their wording without any "credit" promise (`data-shot="prepayment-overpaid"`).
    - **Demo trigger** "Stage overpaid prepayment" (see "Demo triggers"), with registry tests for route
      visibility, the disabled reasons, and that authorising after staging creates no credit note, no
      refund and no balance invoice.
    - Audit labels: `letterTemplate.*` ("Pre-payment letter template created", "updated", "activated",
      "deactivated", "made default"), `invoice.prepaymentReminder` "Pre-payment reminder sent",
      `ledgerPair.trustReleased` "Pre-payment released from trust"; entity type `letterTemplate` in the
      Audit viewer filter; narrative formatters for `letter` (the template name, never the whole body)
      and `trustRelease`.
    - Shots: add `visual/admin-prepayment-followup.spec.ts` (the template view, the picker, the letter
      on the invoice, the balance invoice citation, the reminder, the held and released panel lines,
      the payables row, the overpaid line).
    - **Session 1 exit:** `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots` all
      green; item 1 passes with only the re-pinned figures moved; the item 7 greps are clean. Write a
      short "session 1 done" note in the PROGRESS entry.

**Session 2: the payable half on a move, refund on cancellation, the payout and the rebook.**

11. **Types, session 2 part** (`domain/types.ts`; DM-21):
    - `TrustRefund = { id; bookingId; prepaymentInvoiceId; creditNoteId; counterparty (the billable
      party that paid, a person under D23); anaesthetistId (the payable leg's payee when refunded);
      amount; status: 'due' | 'instructed' | 'paid'; createdAtISO; instructed?: { atISO; by; reference
      }; paidAtISO?; xeroRefundId? }`, held in `billing.trustRefunds`. The amount equals the
      `heldForPayer` on 39's pair `credit`; it is never stored a second way. There is no overpayment
      reason (OQ-03).
    - `AA_TRUST_ACCOUNT = { name: 'AA trust account', bankAccount: '99-0100-0000001-00' }`, a named
      constant on the non-issued bank code 99, plainly fictional (as 26's bank numbers are).
    - `Booking` gains `rebookedFromBookingId?`, and 15's Booking `source` gains `'rebook'`.
    - The Xero slice gains `refunds: Record<string, XeroRefund>`, where `XeroRefund = { id;
      creditNoteId (39's Xero credit note); amount; bankAccount: 'trust'; status: 'authorised' |
      'paid'; createdAtISO; paidAtISO?; reference }`.
    - 39's `cause` union (on `CreditEventDetail` and `CreditNote`) widens with `'prepaymentRefund'`;
      38b's one label place gains its label ("Pre-payment refund").
    - `ID_FORMATS`: `trustRefund` (`TR`, pad 4) and `xeroRefund` (`XRF`, pad 4).
12. **A moved prepaid Booking keeps its amount; only the payable half moves** (US-06.5.4, FT-06.5,
    US-01.4.6's "any prepayment payee follows the Booking", DM-06, D20; OQ-80's recommendation;
    `prepaymentActions.ts` or a new `trustActions.ts`):
    - **One store action**, `repointPrepaymentPayable(api, bookingId, cause)`, run as `ENGINE_ACTOR`
      from 27's `syncPrepayment` whenever its cause is a move (`bookingMoved` or `listMoved`), so it
      covers, through that one call:
      - the office: `reassignBooking` (Admin `MoveBookingFlow`), `reassignList` / `moveListToSlot`
        (`ReassignListFlow`) and 31's `assignDraftList`;
      - the anaesthetist's whole-List moves (32): `moveListToOffice`, `pushListToSlot` and
        `markUnavailableAndMoveList` (return to the office or assign to a colleague);
      - the anaesthetist's single-Booking move (32a): `moveBookingToAnaesthetist`.
      It is the only code that changes a prepayment payable's payee before authorise. One doc comment
      names D20 and OQ-80 (when the pair is amended: on any move before the procedure, payable only).
      If the drift check finds a move path that skips the re-check or passes another cause, fix that
      path's call rather than adding a second trigger.
    - For each sent prepayment pair on the Booking that is held in trust: when the Booking's List now
      has an anaesthetist other than the payable's payee, apply item 8's `withPayablePayee` and move
      the draft Xero ACCPAY's contact to the new anaesthetist in the same `mutate`. **The receivable
      half is unchanged:** the receivable leg, the prepayment invoice (its number, amount, supplier and
      letter), the draft ACCREC and 27's stored estimate never change, no new prepayment invoice is
      raised, and the patient is not billed again (AC1, AC2). Audit `ledgerPair.payableRepointed`
      (before and after payee, cause, the move's audit code: `booking.reassign`, `list.reassign`, 28's
      `moveListToSlot` and 31's `assignDraftList` codes as built, `list.ownerMove` or
      `booking.movedToAnaesthetist`).
    - A List moved to the office (32's `moveListToOffice`, or the return-to-office choice of
      `markUnavailableAndMoveList`: a Draft List with no anaesthetist) keeps the payee until it is
      assigned; 31's assign then updates it. A held invoice not yet sent is 27's (withdraw and
      regenerate at the new rate), not this action's. After AUTHORISED nothing changes here: the lock
      decides.
    - Item 8's release still stamps the lock payee, so a Booking moved to the doer before submit (32a,
      US-01.4.6) lands with the right payee even if a path missed the call; a test proves the two agree.
    - **Settled at the agreed rate** (D20's "wears or benefits"; the gap the re-grade found on
      US-06.5.4). A pure `settlementUnitValueFor(state, bookingId, procedureId)` decides the unit value
      25's lock records for a prepaid Procedure: the lock payee's own unit value as today, except a
      Procedure deducted against a sent prepayment invoice whose basis anaesthetist (27's
      `prepaymentBasisAnaesthetist`) differs from the payee, where it is the basis anaesthetist's unit
      value (the agreed rate). Only unit-value pricing is affected; a Contract rate, schedule line or
      24's defined unit rate is the Contract's and never changes. 25's lock builder calls it in its one
      rate step; the engine still prices only from the lock. So the balance run invoices only a true
      over-run in units (OQ-76, OQ-61 as 27 built them), an under-run is 27's accepted excess, the
      receivable is what the patient agreed to, and the payable to the doer equals it: the doer wears
      or benefits from the rate difference. Log the reading for the owner; no caption.
    - Tests (the three ACs and the settlement):
      - an office move of Riley's Booking from Souter to Beaumont before the procedure: no new
        invoice, the payable leg and the draft ACCPAY point to Beaumont, the receivable leg and the
        ACCREC are deep-equal to before, and after authorise the payable is to Beaumont for the
        prepaid amount (the lock's rate is Souter's $26.50, so with the estimated times the balance is
        0 and nothing is invoiced);
      - the same through 32a's `moveBookingToAnaesthetist` and through 32's `pushListToSlot`: one
        update each;
      - a List returned to the office (`moveListToOffice`) keeps the payee; `assignDraftList` to
        Beaumont then updates it once;
      - moving back updates back; replay is a no-op; the ledger stays in balance; 27's "Agreed with Dr
        Souter" line stays;
      - an over-run after a move: the balance is invoiced at Souter's rate on the units over the
        estimate, never at Beaumont's, and cites the prepayment invoice (item 7);
      - a Booking that was never prepaid, moved: `settlementUnitValueFor` returns the doer's own unit
        value and the lock is unchanged from today.
13. **Pure trust account view** (`domain/billing/trustAccount.ts`, exported, with
    `trustAccount.test.ts`; US-06.5.1):
    - `trustAccountView({ pairs, receipts, refunds })`, over `prePayment` pairs and refunds only:
      ```
      prepaymentsReceived = sum(receipts on prePayment pairs)
      heldInTrust         = sum(received on held prepayment pairs)        (item 8's term)
      releasedToAnaesthetists = sum(releasedAmount on released prepayment pairs)
      refundsDue          = sum(refunds due or instructed)
      refundsPaid         = sum(refunds paid)
      ```
      with the identity `prepaymentsReceived = heldInTrust + releasedToAnaesthetists + refundsDue +
      refundsPaid` checked to the cent (a failure is a `ledgerChecks` entry, `trustUnbalanced`).
    - `held`: one row per held prepayment (Booking, patient name, procedure date, payee, received,
      "Held until the procedure").
    - `movements`: one row per receipt (Pre-payment received), payee change (Payee changed after a
      move, amount 0), release (Released to the anaesthetist), refund created (Refund due) and refund
      paid (Refund paid), each with date, Booking, patient name, anaesthetist, invoice or credit number
      and a signed amount, oldest first.
    - Tests: the sums from a hand-built fixture; a held, a moved, a released and a refunded prepayment
      in one view; movements ordered and signed; a payee change moves no money; `heldInTrust` equals
      the ledger's term; the identity holds; same input gives deep-equal output.
14. **Refund a prepayment on cancellation** (`trustActions.ts`, exported from the store index;
    US-06.5.2, FT-06.5):
    - **Status.** 27's `prepaymentStatusFor` result gains `refund?: { amount; status: 'toAction' |
      'due' | 'instructed' | 'paid'; creditNumbers }`. `toAction` means the Booking is cancelled and
      has a sent prepayment invoice not yet credited. A cancelled Booking never warns (27 holds this).
    - **`refundPrepaymentOnCancellation(api, actor, bookingId)`**, office only:
      - refusals: `notCancelled` ("Cancel the booking first."), `noPrepayment`, `alreadyRefunded`,
        `listAuthorised` ("This booking's List is authorised, so its pre-payment was settled in the
        balance run.");
      - in one `mutate`: credit **every** sent prepayment invoice on the Booking in full through 39's
        credit path, whether paid, part paid or unpaid, so the patient is never chased for a cancelled
        Booking. For each, record 39's credit event (kind `'credit'`, `cause: 'prepaymentRefund'`,
        `originalInvoiceId` the prepayment invoice, the original's party, zero replacements) already
        approved by the refunding office actor, and issue it in the same commit through 39's
        `issueCreditInto` (`creditInFull`, `reversalPlan`, `applyCredit`, the negative invoice), not
        left for 38b's next run: the confirmed refund dialog is its one review step, there is no List
        to review on a cancelled Booking, and the patient's money is waiting. If 39 left the issue
        core callable only from `runEventInvoicing`, export it; never copy it. Then create one
        `TrustRefund` (status `due`) for the `heldForPayer` (the amount actually received), when above
        zero. Log this reading (immediate issue, the refund as its review) for the owner;
      - the money was held (item 8), so `released` and `disbursed` are 0: 39's path records its
        negative invoice wholly offset against the never-released payable (`status: 'offset'`,
        `recoveryDue` 0, nothing for 39a to net) and `xeroCorrectionPlan` voids the draft ACCPAY.
        Whatever 39 built for OQ-77 (whether a credit reverses the payable), the `prepaymentRefund`
        cause always reverses the never-released payable, so both halves of the pair are closed and
        the trust account balances; add that to 39's one `reversalPlan`, keyed on the cause, never a
        second path. Nothing is recovered from the anaesthetist, and D21's outside-the-system case
        never arises. Assert it in a test; if a disbursed prepayment were ever reached, 39's path and
        39a's netting apply unchanged;
      - if 39 records each credit as an event on the Procedure (38b's element), the refund's credit is
        one too, through the same path; add nothing;
      - 39's `submitCredit` (credit and rebill, and the credit note option) keeps refusing a prepayment
        invoice (`kindNotCreditable`); the refund's credit event is created by this action, never
        through `submitCredit`. Reword its sentence to "A pre-payment invoice is credited by a refund on
        cancellation, not by credit and rebill.";
      - `anaesthetistId` on the refund is the payable leg's payee at refund time (after any item 12
        update), so the refund names "whichever anaesthetist held it";
      - audits `booking.prepaymentRefund` (after: credit numbers, refund amount, holder); Xero
        credit-note mirror after commit through 39's `handoffCorrection`.
    - **`cancelBooking` with a refund.** `cancelBooking(api, actor, bookingId, reason, { refundPrepayment?:
      true })`: for an office actor with `refundPrepayment`, the cancel and the refund commit in the
      same `mutate` (audit metas `booking.cancel` then `booking.prepaymentRefund`). Without the
      option, or for an anaesthetist or any other non-office actor, the cancel is unchanged and the
      refund reads `toAction` for the office. A cancel is never refused because of a prepayment. 27
      still withdraws a held (unsent) invoice on cancel. (Automated cancellations from an integration
      are Future Work, US-02.5.3; the rule above already covers them.)
    - Tests:
      - the ACs: a paid prepayment, cancelled before the procedure, is refunded in full, whichever
        anaesthetist held it; the ledger credit links to the original prepayment invoice
        (`prepaymentSettlementFor` and the lineage);
      - the same after item 12 moved it to Dr Beaumont: the refund names Dr Beaumont as holder and
        nothing was ever paid to either anaesthetist;
      - unpaid: credit in full, no refund; part paid: credit in full, refund of what was received;
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
    - This payout is only for `prepaymentRefund` credits. A credit raised through 39's credit note
      option stays a credit with no refund paid from the system (US-08.6.5, note #33).
    - Tests: order enforced; replay is a no-op; the ledger and the trust view stay in balance at each
      step; no anaesthetist position changes on a payout; a 39 credit note with another cause cannot
      be paid out here.
16. **Rebook with another anaesthetist** (`rebookWithAnotherAnaesthetist(api, actor, bookingId,
    targetListId)` in `bookingActions.ts` or `trustActions.ts`; US-06.5.3, a true cancellation only):
    - Office only. The source must be cancelled. Refusals:
      - `refundToAction` ("Refund the original pre-payment first.") while the refund is `toAction`;
      - `sameAnaesthetist` ("Choose a different anaesthetist. To keep the pre-payment, move the
        booking instead of cancelling it.");
      - `listLocked` (the target List must be DRAFT; 28's List), `pastDate` (before the demo today);
      - `alreadyRebooked`.
    - In one `mutate`, creates a new Booking on the target List through `createBooking` (15's one
      create path, with its Procedures through the existing Procedure create path; never a second
      create; Copy a Booking was removed by 15b):
      - patient, billable party and `invoiceEmail` (21), and each Procedure's estimated duration (27);
      - each non-cancelled Procedure as a skeleton: description, master procedure and RVG code (19),
        chosen base units for a ranged code, primary flag (23); no times, modifiers, overrides or
        adjustments;
      - the Contract: the source Procedure's Contract when 20's filtered picker still offers it for
        the new anaesthetist and List, else 20's default RVG Contract for the procedure;
      - `source: 'rebook'`, `rebookedFromBookingId`; audits `booking.rebooked` on both Bookings.
    - After commit, 27's `syncPrepayment` (cause `bookingCreated`) derives the requirement from the
      **new** anaesthetist's prepaid set. If required and the estimate is complete, the engine
      generates a fresh invoice at the new anaesthetist's unit value, held for "Approve and send" (D6),
      where the office picks the letter. Nothing from the original prepayment is moved or reused. If
      the replacement does not take prepayment for this code, the result says so ("Dr Beaumont does
      not take pre-payment for this procedure.").
    - 17's soft blacklist warning shows in the dialog when the target List's surgeon has blacklisted
      the replacement (reuse the helper; never block).
    - A selector `prepaymentHistoryFor(state, bookingId)` walks `rebookedFromBookingId` both ways and
      returns each estimate with its anaesthetist, unit value, amount and state (refunded, current).
    - Tests: the AC (a refunded prepayment and a replacement with a different unit value: a new
      prepayment at their rate, identical units, different dollars); the original invoice untouched;
      no prepayment when the replacement's set lacks the code; each refusal; the history both ways.
17. **Seed, session 2** (`seed/bookings.ts`, `seed/billing.ts`, `cast.ts`; bump `PERSIST_VERSION` by
    one):
    - **The refund Booking** (`SEED_MARKERS.prepaymentRefund`): a new fictional patient with a valid
      new-format NHI from the seed's patient helpers, on a Souter DRAFT List after Fri 24 Jul that no
      scripted beat uses (check the seed map; add a List on an existing Slot only if none is free). One
      41800 Rhinoplasty Procedure on its default RVG Contract (19a), estimated duration 90 minutes, and
      a stored estimate computed by 27's estimator at seed time (at July values, (5 + 6 + 2) x $26.50 =
      $344.50 ex-GST, $396.18 with GST; pin what the build computes).
    - Its prepayment invoice is approved and sent with `LT001`'s rendered letter, and **received in
      full and held in trust** (item 8): nothing released or disbursed. Its invoice number is
      allocated after every existing seeded invoice, so no scripted invoice number moves.
    - **The replacement.** Make sure Dr Beaumont's prepaid set (26) covers 41800 (add the group that
      holds it if needed) and that she has a DRAFT List on the refund Booking's date at the same
      hospital, and one on Fri 24 Jul for the move beat (an available session, so 32a's receiver rule
      offers her too). Run 26's coherence test: if any other seeded Beaumont Booking now derives
      prepayment, pick a different colleague with a different unit value; never change a Booking's
      code.
    - Never change the filler generator's `rng()` draw order.
    - `seed.test`: the refund Booking reads paid and held in trust; `ledgerPosition` of the seed is in
      balance with no checks; the trust view of the seed has two held prepayments, no refunds, and its
      identity holds; Riley and Nair are unchanged. Re-pin item 1's ledger totals with the reason.
      Update `seedBilling.test.ts`, `demoScenarios.test.ts` and `persistMigrate.test.ts`.
18. **Session 2 surfaces:**
    - **Moves** (US-06.5.4): the confirm steps of the admin Booking move (`MoveBookingFlow.tsx`) and
      `ReassignListFlow.tsx`, 32's List move sheet (both choices, and the return-or-assign sheet when a
      booked session is marked unavailable) and 32a's "Move to a colleague" sheet, on mobile and web,
      replace their prepayment line with one shared line from `shared/booking/`: "The pre-payment
      keeps its agreed amount of $X. Dr Beaumont is paid it after the procedure." (one line per List
      with a count when several; on a return to the office: "The pre-payment keeps its agreed amount.
      Whoever the office assigns is paid it."). After the move, the panel reads "Pre-payment kept at
      the agreed amount · payee now Dr Beaumont", with "Invoice INV00xx unchanged" under it
      (`data-shot="prepayment-repointed"`). No OQ caption. The Xero sim pair shows the draft ACCPAY's
      new contact and the unchanged ACCREC.
    - **Cancel dialog** (`CancelBookingSheet`, all three apps through `useSurface()`;
      `data-shot="cancel-prepayment-refund"`):
      - office, with a received prepayment: a section "Pre-payment refund": "Pre-payment received ·
        $396.18 on {invoice number}, held in the AA trust account. Cancelling refunds it in full to the
        patient and credits the pre-payment invoice." Primary: "Cancel and refund pre-payment";
      - office, with a sent unpaid invoice: "The pre-payment invoice {number} is unpaid. Cancelling
        credits it in full so the patient is not chased." Primary: "Cancel and credit pre-payment";
      - anaesthetist: one note, "The patient has paid a pre-payment of $X. The AA office refunds it in
        full from the trust account." The cancel proceeds as today.
    - **Booking panel** (27's `PrepaymentPanel`) on a cancelled Booking:
      - `toAction` (office): "Pre-payment to refund" and the teal action "Refund pre-payment from trust
        account", through a short confirm;
      - `due`, `instructed`, `paid`: "Refund due · $X", "Refund payout sent · awaiting bank", "Refunded
        to the patient from the AA trust account · $X on 21 Jul", each with the credit number linking
        to 39's credit-note document;
      - the anaesthetist sees the same lines read-only (mobile and web);
      - office, on a cancelled Booking whose refund is not `toAction`: "Rebook with another
        anaesthetist";
      - the prepayment history block when `prepaymentHistoryFor` has more than one entry: "Earlier
        estimate · Dr Souter · $344.50 · refunded" and "This estimate · Dr Beaumont · $403.00"
        (`data-shot="prepayment-history"`), on both Bookings, labelled "ex GST"; the cancel dialog and
        invoices show GST inclusive.
    - **Rebook dialog** (admin Dialog, `data-shot="rebook-dialog"`): an anaesthetist select (roster
      order, the original excluded, `drSurname`), then their DRAFT Lists from the demo today (date,
      session, hospital, surgeon; never "slot"), defaulting to the source Booking's date; 17's warning
      inline; a preview line "New pre-payment estimate at Dr Beaumont's unit value: $403.00" from the
      pure estimator, and "It is generated for approval, as any new booking's is."; "Rebook". On
      success, navigate to the new Booking.
    - **Admin trust account** (`LedgerScreen.tsx` gains a third scope; route `/admin/ledger/trust`,
      wrappers in `routes.tsx` and `router.tsx`; `data-shot="trust-account"`):
      - 36's scope Segmented becomes "Whole ledger · One anaesthetist · Trust account";
      - header note: "Pre-payments are held here until the procedure is done, then released to the
        anaesthetist who did it and paid in the next payment run. Refunds are paid from here." with a
        neutral "To verify with AA" pill (FT-06.5 is Verify; the payment cycle is OQ-47);
      - tiles (the Admin Review tile row): Pre-payments received, Held in trust, Released to
        anaesthetists, Refunds due, Refunds paid;
      - **Held card**: the held rows (patient name, never the NHI; anaesthetist surname, the current
        payee after any move; procedure date; amount in mono);
      - **Refunds card** (`data-shot="trust-refunds"`): "To action" rows ("Refund pre-payment from
        trust account"), "Due" rows ("Record refund payout", a Dialog with the reference, "Pay to: the
        patient's nominated account (bank details are not held in the prototype)" and "Record
        payout"), "Awaiting bank" rows, and paid rows, each with holder surname, credit number, amount
        and a status pill;
      - **Movements table** from `trustAccountView`, with a totals row;
      - 36's footnote about receipts held changes to "Pre-payments held until the procedure are shown
        on the trust account.";
      - 36's Ledger nav badge adds refunds to action and refunds due.
    - Audit labels: `ledgerPair.payableRepointed` "Pre-payment payee changed after a move",
      `booking.prepaymentRefund` "Pre-payment refunded from trust account", `trustRefund.instructed`
      "Refund payout recorded", `trustRefund.paid` "Refund paid from trust account",
      `booking.rebooked` "Rebooked with another anaesthetist"; entity type `trustRefund` in the Audit
      viewer filter.
19. **Xero simulation** (`DemoXero.tsx`, `xeroPairView.ts`): the pair detail shows a held prepayment's
    ACCPAY as "Draft · held in trust until the procedure" with its contact (which changes after a move
    while the ACCREC beside it does not) and, once refunded, 39's "Draft ACCPAY voided", and, on 39's
    credit-note panel, a "Refund from trust account" row per `XeroRefund`: amount (mono), bank account
    "AA trust account", reference, status ("Authorised · awaiting payment" or "Paid 21 Jul")
    (`data-shot="xero-trust-refund"`). `xeroPairView` gains the hold state and the refunds; update
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
    - The recipes are the "Catalogue screenshots" step below (fill the stubs for US-06.3.6 and
      US-06.5.1 to US-06.5.4, rewrite US-06.4.2's, finish US-06.4.1's, re-point the ones this phase
      breaks). Do not edit catalogue files' text or status; the capture runner writes their `images`.
    - Patch the demo guide (below).
    - Run `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots`, all green.

## Demo triggers

Harness bar (framed build):

| Label | Screen | Surface | Effect |
|---|---|---|---|
| Stage overpaid prepayment (`stage-overpaid-prepayment`) | Admin · Review (`/admin/review/:listId`) | bar | For a SUBMITTED List. `choices` are its Bookings with a sent prepayment. As `OFFICE_ACTOR`, it shortens the prepaid Procedure's recorded anaesthetic time to `STAGE_OVERPAID_DURATION_MIN` (30 minutes, a named constant) through the guarded `editProcedure` (or 35's save path, if admin edits commit through a change set), so the Review fee drops below the prepaid amount ("surgery was quicker than estimated"). The message names the prepaid amount and the new final, and says Authorise will bill nothing more and credit nothing. Disabled with "Submit this List first", "No sent pre-payment on this List", "Already below the pre-paid amount", or "Shortening the time cannot bring the fee below the pre-paid amount". Authorise then bills cleanly: no balance invoice, no credit, the payable released in full |
| Pay out trust refund (`pay-out-trust-refund`) | Xero sim (`/demo/xero`, `/demo/xero/invoices`, `/demo/xero/invoices/:accRecId`) | bar | The bank pays an instructed refund from the trust account. `choices` are the instructed refunds (on a pair detail, only those on that ACCREC's credit notes). Calls `settleTrustRefundPayout`: the Xero refund reads Paid, the trust account moves it from Refunds due to Refunds paid, and the Booking panel reads "Refunded to the patient". Disabled with "No refund payout recorded yet. Record it on the Admin trust account first." |

Product actions (in the product UI, not the bar, unbadged):

| Label | Screen | Effect |
|---|---|---|
| Letter picker and Preview letter | 27's "Approve and send" Dialog (Booking panel, rail card, Invoices strip, invoice document) | Chooses and previews the letter that goes out with the prepayment invoice |
| Send pre-payment reminder | Admin · Booking detail (`/admin/day/:dateISO/bookings/:bookingId`) | `sendPrepaymentReminder`; the panel and rail row show "Reminder sent" |
| Authorise the List | Admin · Review | Releases a held prepayment to the lock payee ("Released to Dr X") and raises any balance invoice citing the prepayment invoice |
| Move a prepaid Booking or List to another anaesthetist | Admin Booking move (`MoveBookingFlow`) and Reassign List; 32's List move sheet and 32a's "Move to a colleague" sheet on mobile and web | 27's re-check runs `repointPrepaymentPayable`: "Pre-payment kept at the agreed amount · payee now Dr B", the invoice unchanged, and the Xero sim's draft ACCPAY shows Dr B while the ACCREC is unchanged |
| Cancel and refund pre-payment / Refund pre-payment from trust account | Admin cancel dialog; the Booking panel and the trust account's "To action" rows | `cancelBooking({ refundPrepayment: true })` or `refundPrepaymentOnCancellation`: credit in full, refund due |
| Record refund payout | Admin · Trust account (`/admin/ledger/trust`) | `recordTrustRefundPayout`: instructed, a Xero refund awaiting payment |
| Rebook with another anaesthetist | Admin · Booking detail of a cancelled Booking | `rebookWithAnotherAnaesthetist`: a new Booking whose fresh prepayment is generated at the replacement's unit value, held for approval |
| New template, Edit, Make default, Deactivate | Admin · Master data · Pre-payment letters | Template maintenance |

PWA equivalents (the mobile Booking waits on the office; route
`/mobile/lists/:listId/bookings/:bookingId`):

| Label | Surface | Effect |
|---|---|---|
| Office sends a pre-payment reminder (`pwa-office-sends-prepayment-reminder`) | PWA only (`surfaces: ['pwa']`), badge office stand-in | While the status is unpaid or part paid: `sendPrepaymentReminder(OFFICE_SIMULATION_ACTOR, bookingId)` with the default reminder. The panel shows "Reminder sent by the AA office". Disabled with "No unpaid pre-payment on this booking" or "No invoice email for the payer" |
| Office refunds this pre-payment from the trust account (`pwa-office-refunds-prepayment`) | PWA only (`surfaces: ['pwa']`), badge office stand-in | After Dr Souter cancels a prepaid Booking on the handset: `refundAndPayOutAsSimulatedOffice(api, bookingId)` (new, in 14's `officeStandIn.ts`) runs item 14's refund and item 15's record and settle as `OFFICE_SIMULATION_ACTOR` and the "Xero bank feed" actor, three audited commits in order. The panel reads "Refunded to the patient from the AA trust account". Disabled with "Cancel the booking first" or "Nothing to refund" |

No PWA entry for the move (the anaesthetist moves their own List through 32's sheet, or a single
Booking through 32a's, on the handset as normal use, and the panel shows the payee change; a colleague
moving work to Dr Souter is 32's and 32a's existing stand-ins), the release (14's "Office authorises
this List" already authorises), the overpaid case (it waits on nothing once authorised) or the rebook
(the replacement is not the handset persona). 27's "Office approves and sends the prepayment invoice"
now sends the default letter.

## Out of scope

- Any credit, refund, credit on account or write-off of a prepaid amount above the final (OQ-03
  answered: it is kept). A shortfall threshold (OQ-61) or a partial prepayment (OQ-76): 27's balance
  run and estimator.
- Recovering money from an anaesthetist for a prepayment: the hold means a prepayment is never paid
  out before the procedure. After authorise, a correction is 39's credit and rebill, with its negative
  invoice netted by 39a; with no later payment it is handled outside the system (D21).
- Refunding a credit raised through 39's credit note option: a credit note is not a refund, and that
  refund happens outside the system (US-08.6.5, note #33). Only the cancellation refund is paid from
  the trust account here.
- A separate weekly trust payment cycle (OQ-47): released prepayment payables join 39a's run.
- Crediting and prepaying again when a prepaid Booking moves (OQ-21's reading, "out of date" per
  OQ-70): never built. It survives only as the rebook after a true cancellation (item 16).
- Changing the receivable half on a move (the prepayment invoice's supplier, number or amount, or the
  ACCREC): OQ-70 moves only the payable.
- Lifting `splitCombinedProcedure`'s refusal for a prepaid combination (39's handoff, US-08.6.4): not
  this phase's scope; Phase 44 records it as an open gap against US-08.6.4 unless the owner adds it.
- Real bank details for patients, a bank-feed match for refunds, and any trust-account reconciliation
  beyond the derived view. The trust account is not a general ledger.
- Letter templates for anything but prepayment requests and reminders; rich text, attachments,
  per-anaesthetist letters, and an outbox. Phase 35's update email and its templates stay separate.
- Automatic or scheduled reminders. The reminder is an office action; 27's escalating warning stays
  the control.
- A sent prepayment no longer needed on a live Booking (27's `notNeeded`): the balance run at
  authorise deducts it, and an amount above the final is kept (item 7). No separate refund action.
- Patient-screen views of refunds beyond what Phase 40's patient position already reads from the
  ledger.

## Manual test checklist

The agent runs every item itself in the running app and reports it with evidence; none is handed
to the owner (ROADMAP.md "Owner review: agents test themselves").

- [ ] Reset. Master data, Pre-payment letters: three templates, one default per kind. Edit
      "Cosmetic procedure pre-payment", insert `{{patient}}`: refused "unknown merge field". Remove
      `{{estimate}}`: refused. The preview always ends with the fixed estimate notice, which promises
      no refund.
- [ ] S4 Beat 1 as 27 left it (Riley): record the duration; the invoice reads "Awaiting approval" with
      no letter. "Approve and send", pick "Cosmetic procedure pre-payment", open "Preview letter"
      (patient name, Rhinoplasty, Fri 24 Jul, the estimate, Dr Melanie Souter, no NHI). Send. The
      invoice document shows the letter as a cover section and the rail names it.
- [ ] Edit that template's body. Riley's invoice letter is unchanged.
- [ ] "Send pre-payment reminder" on Riley: the reminder names the amount outstanding; after
      "Payment received · half" a second reminder names the smaller amount. The panel, the rail row and
      the mobile Booking show "Reminder sent". The audit shows `invoice.prepaymentReminder`, and,
      if Phase 40 built its follow-up log, Riley's patient record shows the reminder there.
- [ ] Held in trust: Nair's INV0001 is paid. Her panel reads "Held in the AA trust account until the
      procedure"; the payables view shows INV0001-P "Held in trust until the procedure" and "Run
      payables" pays nothing for it; Dr Souter's web Accounts shows it as held, not owed now. The
      Xero sim shows the ACCPAY as Draft.
- [ ] Release and settlement: complete, submit and authorise Souter Fri 24 PM. The balance invoice's
      deduction line reads "Less pre-payment already invoiced on INV0001", its note names INV0001,
      and Related invoices links both ways; no "deposit" anywhere. The panel reads "Released to Dr
      Souter"; the next payables run pays INV0001-P. Ledger in balance.
- [ ] Overpaid: reset, complete and submit Souter Fri 24 PM, open it in Review, "Stage overpaid
      prepayment". Authorise: no balance invoice, no credit note, no refund, no failure; the
      septoplasty's hospital invoice bills normally; the panel reads "Pre-paid more than the final fee
      · $X kept. No refund or credit."; INV0001-P is released in full. Ledger in balance.
- [ ] The item 7 greps are clean.
- [ ] Office move: on Riley (sent, part paid), move the Booking to Dr Beaumont's Fri 24 Jul List. The
      confirm step says the pre-payment keeps its agreed amount and Dr Beaumont is paid it. No new
      invoice; the panel reads "payee now Dr Beaumont" and "Invoice unchanged", with no OQ caption;
      the Xero sim's draft ACCPAY contact is Dr Beaumont and the ACCREC is unchanged (Dr Souter's
      invoice, same amount). Move it back: updated back, one audit row each way.
- [ ] Anaesthetist moves: reset; on mobile as Dr Souter, move Riley alone to Dr Beaumont through 32a's
      "Move to a colleague": the sheet shows the prepayment line and the payee changes. Reset; move
      the whole Fri 24 AM List to a colleague's free session through 32's sheet: one payee change per
      prepaid Booking. Reset; return the List to the office: the payee stays until the office assigns
      the Draft List, then changes once.
- [ ] Settled at the agreed rate: after the office move to Dr Beaumont, complete, submit and authorise
      her Fri 24 Jul List with the estimated time: no balance invoice (the lock uses Dr Souter's unit
      value for the prepaid Rhinoplasty); the payable to Dr Beaumont equals the prepaid amount. With a
      longer time, the balance is the over-run at Dr Souter's rate and cites the prepayment invoice.
- [ ] Cancel: open the refund Booking in Admin, Cancel. The dialog shows "Pre-payment received ·
      $396.18 ... held in the AA trust account". "Cancel and refund pre-payment": a credit in full
      against the prepayment invoice, Refund due $396.18, the draft ACCPAY voided, and nothing to net
      or recover from Dr Souter (39's negative invoice wholly offset). The credit number opens the
      credit-note document, which names the original prepayment invoice. Ledger in balance. Credit and
      rebill and the credit note option on that prepayment invoice are still refused, with the
      reworded sentence.
- [ ] Trust account (`/admin/ledger/trust`): tiles, the held rows, the refund in "Due", the movements.
      "Record refund payout" with the default reference: "Awaiting bank". The Xero sim pair shows the
      refund row "Authorised · awaiting payment". "Pay out trust refund": Paid. The trust identity and
      the Ledger stay in balance.
- [ ] Rebook: on the cancelled Booking, "Rebook with another anaesthetist", Dr Beaumont, her List on
      the same date. The preview says $403.00 at July values. Rebook: the new Booking's fresh
      prepayment invoice is generated at Dr Beaumont's unit value, "Awaiting approval"; Approve and
      send with the default letter; the original invoice is untouched; both Bookings show the two
      estimates.
- [ ] Rebook refusals: before refunding (`toAction`), and choosing Dr Souter again.
- [ ] Unpaid path: reset, approve and send Riley's invoice (nothing paid), then cancel Riley as the
      office: "Cancel and credit pre-payment"; credit in full, no refund, nothing to pay out.
- [ ] Anaesthetist cancel path: reset, then on mobile cancel the refund Booking as Dr Souter: the sheet
      notes the office refunds it; the Booking reads "Pre-payment to refund" for the office, appears
      under "To action" on the trust account, and the Ledger badge counts it. "Refund pre-payment from
      trust account" there completes it.
- [ ] Only the trust account's "To verify with AA" pill remains; no OQ-03, OQ-40, OQ-42 or OQ-70
      label, and no "To confirm with AA" caption, anywhere.
- [ ] S3, the S4 beats, 39's credit-and-rebill and 39a's figures match item 1 (with only the re-pinned
      figures moved, each with its reason).
- [ ] PWA build, the refund Booking on the handset: cancel it, open the demo-actions sheet, "Office
      refunds this pre-payment from the trust account" (office stand-in badge): the panel reads
      "Refunded to the patient". On Riley: "Office sends a pre-payment reminder". Move a prepaid
      Booking through 32a's sheet and a prepaid List through 32's: the prepayment line shows. Bottom
      sheets, teal actions, no crimson, and no "slot" in any copy.
- [ ] Teal is the only action colour, crimson only in the nav, amounts and numbers in mono with
      tabular-nums, no NHI in letters or the Xero sim, and no en or em dashes in any new copy or
      seeded template.
- [ ] Catalogue screenshots: the recipes for the covered items above (US-06.3.6, US-06.4.1, US-06.4.2 and US-06.5.1 to US-06.5.4) are filled or updated, any recipe this phase broke is re-pointed, a full `npm run capture` ends with no failed recipe and no story without a recipe, the covered items' new shots are checked by eye, and `npm run verify:board` is green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots` and `npm run verify:board` are all green.

## Demo guide updates

Patch these in the same session, in `docs/demo-guide/` and the matching sections of
`master-demo-guide.html` (S4 and the cheat sheet's "Pre-payment" and "The money model" sections, as
Phases 27, 32a, 36, 38b, 39 and 39a left them):

- `03-demo-script.md` **S4 Beat 1** (27's "Pre-payment from the prepaid list"): Click becomes "Approve
  and send, pick the Cosmetic procedure pre-payment letter and preview it"; Say adds "The letter always
  words it as an estimate, because the final fee may be higher or lower."
- The S4 beat where Fri 24 PM is authorised (27's balance top-up): add "Nair's pre-payment was held in
  AA's trust account until now; authorising releases it to Dr Souter, paid in the next payment run",
  and show the balance invoice citing INV0001 by number with a link back.
- **S4 new beat, "Held in trust, moved, refunded and rebooked"** (after 27's closing beat; check the
  numbering 38b, 39 and 39a left):
  - **Click:**
    - Admin, Ledger, Trust account: the held pre-payments.
    - Riley: "Send pre-payment reminder"; then move her Booking to Dr Beaumont's Fri 24 Jul List:
      "payee now Dr Beaumont", the invoice unchanged, and in the Xero sim the draft ACCPAY's new
      contact beside the unchanged ACCREC.
    - The refund Booking: Cancel, "Cancel and refund pre-payment".
    - Trust account: the refund due; "Record refund payout".
    - Xero sim, the pair: Demo actions, "Pay out trust refund".
    - Back on the cancelled Booking: "Rebook with another anaesthetist", Dr Beaumont.
  - **Say:** "Pre-payment money sits in AA's trust account until the procedure is done, so nobody is
    paid for work that has not happened. If the booking moves, the patient is not billed again: the
    agreed amount stands, only the anaesthetist's side of the pair moves, and the anaesthetist who
    does it wears or benefits from the difference in rate. The same happens when an anaesthetist
    hands on a whole List or one booking from their phone. If it is cancelled, the patient is refunded
    in full from the trust account, as a credit against the original invoice. A true rebook starts a
    fresh pre-payment at the new anaesthetist's own rate, so the patient may see two estimates."
  - **Expected:** the held rows; the payee change with no new invoice and the receivable unchanged;
    credit in full, refund due, instructed, paid; the new Booking with its own estimate awaiting
    approval; both estimates visible.
- **S4 optional beat, "Pre-paid more than the final fee"**: Stage it (complete and submit Souter Fri
  24 PM), Review, "Stage overpaid prepayment", Authorise; Say "When the procedure comes in under the
  estimate, the difference is kept. AA does not refund or credit it, and nothing more is billed."
- S4 "Discovery points": OQ-61 (whether a small shortfall is let go), OQ-76 (all or nothing, and an
  over-run, with Ben) and OQ-80 (when the prepayment pair is created and amended). Drop any OQ-03,
  OQ-40, OQ-42 or OQ-70 point (answered: say them as built).
- `04-presenter-cheat-sheet.md` "Pre-payment" (27's rewrite) and "The money model": add letters and
  reminders, the balance invoice that cites the prepayment, held in trust until the procedure, an
  overpayment kept, refund on cancellation, the move rule (only the payable moves, the doer wears the
  difference) and the rebook. "Prototype readiness" moves these from "Still upcoming" to "Built and
  clickable".
- `02-workflows-and-handoffs.md`: the cancellation workflow adds "a paid pre-payment is refunded in
  full from the trust account"; the "Pre-payment" case adds letters, settlement with the citation, the
  trust hold and release, the move rule and the refund; the anaesthetist's move workflows (32's List
  move and 32a's single-Booking move) add the payee line.
- `01-personas-and-responsibilities.md`: the office persona "maintains the pre-payment letters, sends
  reminders, and handles pre-payment refunds from the trust account".
- `docs/demo-guide/README.md` status row and the master guide's status table: "Pre-payment letters,
  settlement, trust account hold and refunds, move and rebook".
- The Control Panel S4 scenario text (item 20).
- This is not a milestone phase. Still reread the S4 section of `master-demo-guide.html` against the
  edited Markdown so beat numbers, figures and trigger labels agree.

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19),
run after the review pass and before the PROGRESS.md entry. Re-run
`node docs/prototype-build/catch-up/tools/recipe-status.mjs 41` first: earlier phases (27 in
particular) will have changed these recipes since this plan was written.

**Covered items.** When the phase is done, each recipe in `requirements-board/capture/recipes/`
matches what was built:

| Item | Recipe at plan time | When this phase is done |
|---|---|---|
| [US-06.3.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.3.6.md) Prepayment letter templates | absent · stub ("Not built yet: catch-up Phase 41 builds this.") | captured; empty `absentReason`. Admin shots: `letter-templates` (Master data, Pre-payment letters, `data-shot=letter-templates`: three templates, one default per kind), `letter-picker` (27's Approve and send Dialog on Riley's Fri 24 Jul AM Booking, `prepayment-letter-picker`, with the preview open), `letter-on-invoice` (the invoice document with the letter as its cover section, `prepayment-letter`) and `reminder` (the Send pre-payment reminder dialog and the "Reminder sent" line, `prepayment-reminder`). Caption: "Prepayment letter chosen when the invoice is approved" |
| [US-06.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.4.1.md) Invoice the remaining balance | captured · admin-balance-invoice (Phase 27 re-shoots it from authorising Souter Fri 24 PM and leaves it partial: "the balance invoice does not yet cite the prepayment invoice") | captured; drop the partial reason. Keep the shot `name` `balance-invoice` and re-point any Approve and send click to go through the letter picker. State `cited`: the balance invoice document with "Less pre-payment already invoiced on INV0001", the note naming INV0001 and the Related invoices link (highlight `[data-shot=balance-cites-prepayment]`). State `released`: the Booking panel "Released to Dr Souter". Caption: "Balance invoice after the procedure: the final fee less the prepayment, citing the prepayment invoice" |
| [US-06.4.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.4.2.md) No refund when prepaid exceeds final | absent ("No credit or refund path exists ... The refund mechanism is open (OQ-03).") | captured; empty `absentReason`. Admin shot `overpaid-kept` reusing the US-06.4.1 setup to a SUBMITTED List, then the "Stage overpaid prepayment" entry (`[data-shot=demo-actions]`, then its `demo-action-stage-overpaid-prepayment` row) on `/admin/review/:listId` and Authorise: the panel reads "Pre-paid more than the final fee · $X kept. No refund or credit." (`prepayment-overpaid`), with no balance invoice. Caption: "Prepaid amount above the final fee is kept; no refund or credit" |
| [US-06.5.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.5.1.md) Trust account | absent · stub ("Not built yet: catch-up Phase 41 builds this.") | captured; empty `absentReason`. Admin shots `trust-account` at `/admin/ledger/trust` (tiles and the held rows, Nair's INV0001 held until Fri 24 PM is authorised; highlight `trust-account`) and `payables-trust-held` (the payables view row "Held in trust until the procedure", never offered to Run payables). Web Accounts and mobile Balances shot `held-in-trust` for Dr Souter: "Pre-payments held in trust · $X · paid after the procedure". Caption: "Prepayment held in trust until the procedure" |
| [US-06.5.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.5.2.md) Refund a prepayment on cancellation | absent · stub ("Not built yet: catch-up Phase 41 builds this.") | captured; empty `absentReason`. Admin shots `cancel-prepayment-refund` (the cancel dialog's "Pre-payment refund" section with "Cancel and refund pre-payment") and `trust-refunds` with states `to-action`, `due` (after the refund), `awaiting-bank` (after Record refund payout) and `paid` (after "Pay out trust refund" from the Xero sim bar entry); a simulator shot `xero-refund` at `/demo/xero/invoices/:accRecId` for the refund row; a mobile shot `cancel-note` (Dr Souter cancelling a prepaid Booking sees "The AA office refunds it in full from the trust account"). Highlights on the refund section and rows. Caption: "Prepayment refunded in full from the trust account on cancellation" |
| [US-06.5.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.5.3.md) Prepayment for a replacement anaesthetist | absent · stub ("Not built yet: catch-up Phase 41 builds this.") | captured; empty `absentReason`, no OQ caption. Admin shots `rebook-dialog` (`rebook-dialog`: Dr Beaumont, her List on the same date, "New pre-payment estimate at Dr Beaumont's unit value: $403.00") and `prepayment-history` (both Bookings: "Earlier estimate · Dr Souter · $344.50 · refunded" and "This estimate · Dr Beaumont · $403.00"). Caption: "Rebooked with another anaesthetist after a cancellation, with a fresh prepayment at their own rate" |
| [US-06.5.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.5.4.md) Prepaid Booking moved to another anaesthetist | absent · stub ("Not built yet: catch-up Phase 41 builds this."; Phase 27 may have made it partial with "the payable half ... is not yet updated; Phase 41 does that") | captured; empty reason, no OQ caption. Admin shots `move-confirm` (the Booking move confirm step: "The pre-payment keeps its agreed amount of $X. Dr Beaumont is paid it after the procedure.") and `prepayment-repointed` (the panel "Pre-payment kept at the agreed amount · payee now Dr Beaumont" with "Invoice unchanged"); a simulator shot `xero-payee` (the draft ACCPAY contact Dr Beaumont beside the unchanged ACCREC); web and mobile shots `move-sheet` of 32a's "Move to a colleague" sheet with the prepayment line, and a mobile state of 32's List move sheet. Caption: "Moved prepaid Booking keeps the agreed amount; only the payable moves to the new anaesthetist" |

**Recipes this phase breaks.**

- Ten recipes click "Raise pre-procedure invoice" in their setup (grep `Raise pre-procedure`):
  `US-06.2.2`, `US-06.3.1`, `US-06.3.2`, `US-06.3.4`, `US-06.4.1`, `US-08.2.2`, `US-09.2.1`,
  `US-09.2.3`, `US-09.2.4` and `US-09.3.4`. Phase 27 re-points them to "Approve and send"; this phase
  puts that button behind the letter picker, so each needs the picker's own "Approve and send" click
  added, keeping shot names.
- Nair's INV0001 is no longer disbursed on 16 Jul (held in trust until Fri 24 PM is authorised):
  re-check `US-05.2.7`, `US-06.2.2`, `US-06.2.3`, `US-06.3.1`, `US-08.4.1` and `US-09.1.1` (all name
  INV0001), and the Xero-sim pair shots that show its ACCPAY.
- The payables run excludes held prepayments: re-check the "Run payables" recipes `US-08.3.4`,
  `US-09.2.4` and `US-10.1.2`, and the payment-webhook recipes on XR0001 (`US-06.3.4`, `US-06.4.1`,
  `US-09.2.1`, `US-09.2.3` and `US-09.2.4`). If XR0001 is a prepayment pair, a receipt no longer
  authorises its ACCPAY and no run pays it before authorise, so `US-09.2.1`'s "ACCPAY authorised"
  state and `US-09.2.4`'s disbursement need a non-prepayment pair (or an authorise step first);
  keep their shot names and captions true.
- The balance invoice's deduction line and note change wording: re-check `US-08.2.2`
  (`balance-invoice`) and any recipe whose caption quotes the old note.
- The move confirm steps and sheets gain the payee line: re-check `US-06.3.5` (27's `moved` state),
  32's and 32a's move recipes (`US-01.4.3`, `US-01.4.6`, `US-01.4.7`) and `US-01.4.1`.
- `US-02.5.3.json` (cancelled Booking; the story's automated criterion is Future Work) opens the
  cancelled-Booking view; confirm it still resolves with the cancel dialog and panel changes.

**ATLAS.md.** Update "Routes" (`/admin/ledger/trust`, the Master data Pre-payment letters view),
"Personas and IDs" (Riley, Nair and Dr Beaumont's Fri 24 Jul Bookings and Lists, the refund Booking
and their invoice ids), "Seed data worth shooting" (the held and released prepayments, the refund
Booking), "Overlays that need clicks" (the letter picker, cancel dialog, rebook dialog, move confirm
and the 32 and 32a move sheets) and "Existing hooks" (the new `data-shot` hooks listed in work items
10 and 18, and the two new demo-action rows).

## Adversarial review (after build)

After the manual test checklist and the four commands are green, and before writing the PROGRESS
entry, run the standard adversarial review-and-fix pass (PROGRESS convention 18). Fan out independent
Opus review subagents: quality, bugs/correctness and plan adherence, plus a fourth, money lens,
because this phase holds and moves patient money. Then this session verifies every finding against the
catalogue, this plan and the code, fixes the confirmed ones (with a test where a bug had none),
re-greens, and records the pass. Do not re-raise anything settled in the Decisions log except the
readings this phase explicitly supersedes.

**Steer this phase's reviewers at:**

- **Money conservation.**
  - The ledger equation (item 8, with item 15's `refundsPaid`) and the trust identity (item 13) hold
    to the cent after every step: receipt, release, payee change, refund, payout, rebook.
  - A held prepayment is never released, approved for payment or paid before its List is AUTHORISED,
    by any path (receipt, payables run, retry, seed).
  - A refund never exceeds what was received; a credit never exceeds what was invoiced.
  - A prepaid amount above the final creates no credit, no refund, no invoice and no failure, and is
    released in full; the locked price (25) is never altered after the lock; a negative group without
    a prepayment line still fails with `negativeTotal`.
- **Settlement.** Every balance invoice cites each prepayment invoice it deducts, by number and
  lineage, and no "deposit" survives. Amounts are unchanged by the citation.
- **Move rule (D20).** Every move path (office Booking move, reassign List, 31's assign, 32's three
  moves, 32a's single-Booking move) updates the payable half exactly once, never raises an invoice,
  never changes the agreed amount and never touches the receivable leg, the prepayment invoice or the
  ACCREC. The release payee always equals the lock payee. A moved prepaid Procedure is locked at the
  agreed (basis) unit value, so the patient never pays a rate difference, and an unmoved or unprepaid
  one is locked exactly as before.
- **One path each.** Every credit goes through 39's credit path and Xero mirror; every payee change
  before authorise goes through `repointPrepaymentPayable`; every release through 16's extended rule;
  the agreed rate through `settlementUnitValueFor` in 25's one rate step. No second credit type,
  release rule, payee writer or rate rule.
- **Refund rules.** Always in full on cancellation; paid, part-paid and unpaid invoices all credited;
  office only; refused on an AUTHORISED List; idempotent; nothing ever netted or recovered from an
  anaesthetist (39's negative invoice wholly offset, never a second recovery path). A cancel is never
  refused because of a prepayment; non-office cancels leave `toAction`. Only `prepaymentRefund`
  credits are paid out of the trust account; 39's credit note option never pays a refund.
- **Rebook rules.** Nothing transfers between anaesthetists. The fresh prepayment comes from 27's
  engine, at the replacement's unit value, held for approval. The Booking create path is reused.
- **Letters.** Every letter carries the fixed estimate notice, which promises no refund; no NHI in any
  letter; the snapshot is immutable after a template edit; merge fields validate; names come from
  `shared/format.ts`; a letter is rendered only at approval.
- **Labels.** Only the trust account's Verify pill; no OQ-03, OQ-40, OQ-42 or OQ-70 label survives,
  and OQ-80, OQ-76, OQ-61 and OQ-47 each live in one code place with no UI caption. No gold-plating:
  no bank matching, scheduled reminders, rich-text letters or trust cycle.
- **Rights, audit and determinism.** Every action audits before and after through `mutate()`, with the
  right actor (office, "Billing run", "Billing engine", "Xero bank feed", the simulated office). Clock
  from state only; no `Date.now()`, `new Date()` or `Math.random()`. Seed determinism and the filler
  `rng()` order are unchanged, and `PERSIST_VERSION` is bumped once per session that changed the seed.
- **Triggers and PWA.** Each entry shows only on its routes and surface; the stand-ins are badged; the
  bodies live in `src/store` or `src/shared`; `pwaPurity` passes.
- **Design and vocabulary.** Teal the only action colour, crimson never on the new surfaces, tints from
  the tokens, mono with tabular-nums for money and numbers, no en or em dashes in any copy or seeded
  template, "move" (never "swap"), and no "slot" in app copy.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry; ROADMAP.md "Owner review: agents test
  themselves"): the recommendations built for open questions (OQ-80's amend-the-payable-on-a-move,
  OQ-76 and OQ-61 as 27 built them, OQ-47's no separate cycle), the readings below (the payable as the
  half that moves, the prepayment invoice keeping the first anaesthetist as its named supplier after a
  move, the agreed-rate settlement of a moved prepaid Procedure, the cancellation refund always
  closing both halves whatever OQ-77 says, the refund's credit issued at once with the refund
  dialog as its review step rather than through 38b's queue and next run), anything logged rather than fixed, and the screens worth a
  look, each with its route and persona.
- Status row for catch-up Phase 41, and a phase entry covering:
  - the drift-check result and the OQ states (OQ-03, OQ-40, OQ-42, OQ-70, OQ-71 and OQ-73 built as
    answered; OQ-80 built as its recommendation; OQ-76, OQ-61 and OQ-47 left in 27's and 39a's
    places);
  - what 27, 32, 32a, 36, 39 and 39a were found to provide, every move path and the cause it passes,
    how 16's release rule was extended for the hold, how 25's rate step calls
    `settlementUnitValueFor`, and how 39's `cause` and `reversalPlan` were widened;
  - the session 1 and session 2 split and the adversarial pass;
  - the tests added (letter renderer, template actions, approval letter, reminder, balance citation,
    overpaid accepted, hold and release, payable-half update per move path, agreed-rate settlement,
    trust view, refund, payout, rebook, triggers, parity);
  - `PERSIST_VERSION` old to new (each bump);
  - the re-pinned figures after items 9 and 17 (Nair's prepayment no longer disbursed on 16 Jul, the
    seeded payables run, the ledger's held total), and the refund Booking's and the rebook's figures;
  - the recipes filled for US-06.3.6 and US-06.5.x, finished for US-06.4.1, rewritten for US-06.4.2
    and re-pointed elsewhere (see the Catalogue screenshots bullet);
  - the handoff for Phase 44: US-08.6.4's prepaid-combination split is still refused (39's handoff,
    not picked up here).
- **Catalogue screenshots:** the recipes created or changed (by ID), the `capture/REPORT.md` counts before and after (captured, partial, absent, failed), the recipes this phase broke and how they were re-pointed, and any partial reason handed to a later phase.
- Decisions log:
  - **Superseded:**
    - The Phase 10 payment rule that a received prepayment authorises its ACCPAY pro rata at once:
      a prepayment is held in trust until its List is AUTHORISED (OQ-40), then released to the lock
      payee.
    - The plan's earlier reading that an overpaid prepayment is credited and refunded at authorise:
      it is kept, with no credit or refund (OQ-03). The `negativeTotal` message no longer mentions a
      manual credit.
    - The Phase 08 run's `negativeTotal` belt now applies only to a group without a prepayment
      deduction line (27 began this; recorded here as closed).
    - The earlier plan reading that a moved prepaid Booking's draft pair is "repointed" with a "To
      confirm with AA (OQ-70)" caption: OQ-70 is answered; only the payable half is updated and no
      caption shows.
  - **Extended, not superseded:** the 7th review B23 audited soft-cancel stands (a cancelled Booking is
    retained, visible and excluded from billing); cancelling a prepaid Booking now also refunds its
    prepayment from the trust account.
  - **New readings:**
    - A prepayment payable's payee before authorise changes only through `repointPrepaymentPayable`,
      run from 27's re-check on every move; the agreed amount stands and the receivable half (the
      prepayment invoice and the ACCREC) never changes (US-06.5.4, D20). The payable is our reading of
      which half moves; when it is amended is OQ-80's recommendation.
    - A moved prepaid Procedure is locked at the agreed (basis) anaesthetist's unit value through
      `settlementUnitValueFor`, so the doer wears or benefits from the rate difference and the patient
      is billed only a true over-run.
    - The balance invoice cites each prepayment invoice it deducts on the deduction line, in its note
      and through 22's `balanceOfPrepayment` lineage.
    - A cancellation refunds only money actually received; sent unpaid prepayment invoices are
      credited, not refunded; under the hold 39's negative invoice is wholly offset against the
      never-released payable, so no recovery from an anaesthetist arises.
    - The trust account is a derived view over prepayment pairs and refund records; released
      prepayment payables are paid on 39a's normal run (no separate trust cycle while OQ-47 is open).
    - The payout is two steps: recorded in the system, then paid by the bank (the Xero sim trigger).
      Only cancellation refunds are paid out of the trust account; 39's credit note option pays none.
    - Rebooking after a true cancellation creates a new Booking; its fresh prepayment comes from 27's
      engine for the replacement, and nothing moves between anaesthetists.
    - Letters are plain-text templates with a fixed, non-removable estimate notice, rendered at
      approval and snapshotted on the invoice; reminders are office actions, never scheduled.
