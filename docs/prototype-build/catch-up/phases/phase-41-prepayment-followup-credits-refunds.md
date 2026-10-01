# Phase 41 · Prepayment letters, trust account and refunds

**Requirements covered:**
[US-06.3.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.3.6.md) (Proposed; letter templates picked when an admin approves the generated prepayment invoice, and the reminder that follows them up),
[FT-06.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-06.4.md) (Verify, OQ-61; the overpaid half: Phase 27 built the balance half and the excess record),
[US-06.4.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.4.2.md) (Verify, OQ-61; no refund and no credit when prepaid exceeds final),
[FT-06.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-06.5.md) (Verify, OQ-70),
[US-06.5.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.5.1.md) (Verify; held in trust until the procedure),
[US-06.5.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.5.2.md) (Verify; refunded in full on cancellation),
[US-06.5.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.5.3.md) (Verify, OQ-70; a true cancellation rebooked with another anaesthetist),
[US-06.5.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.5.4.md) (Verify, OQ-70; a moved prepaid Booking keeps the agreed amount, payee repointed);
[DM-21](../analysis/domain-model-delta.md#dm-21) (trust account: prepayment held pending, refunded in
full on cancellation, kept when the Booking moves).
Also builds, without closing it (it is counted under Phase 27), the letter-template master part of
[DM-20](../analysis/domain-model-delta.md#dm-20) (the prepayment lifecycle). This finishes EP-06's
letters, overpaid, trust account, refund and move half. No reverse finding is closed here
([reverse check](../analysis/reverse-check.md)): RV-09 is Phase 27's; its "overpayment becomes a
credit" clause is superseded by OQ-03's answer, which this phase builds.
**Depends on:** Phase 27 (the derived requirement, the stored `BookingPrepayment` with its estimate
snapshot, the engine's `syncPrepayment` re-check (an earlier plan called it `recheckPrepayment`; use
the name 27's PROGRESS records) with its move causes `bookingMoved` and `listMoved`, `generatePrepaymentInvoice` held for approval, `approvePrepaymentInvoice` ("Approve
and send"), `prepaymentBasisAnaesthetist`, the reworked `prepaymentStatusFor` with part paid,
`PrepaymentPanel`, and the prepaid-above-final `prepaymentExcess` record), Phase 39 (credit notes: the
pure `creditInFull` and `reversalPlan`, `applyCredit` on the ledger pair, the payable reversal, the
negative invoice to an anaesthetist already paid, the Xero credit-note mirror `handoffCorrection` and
the credit-note document) and Phase 39a (the payables run record per period with its
approve-for-payment step, which the trust hold keeps prepayment payables out of until the procedure).
Through them: 36's `LedgerPair` (with `prepaidAboveFinal` on the prepayment pair), `applyReceipt`,
`ledgerPosition`, `ledgerChecks` and the Admin Ledger screen; 25's lock and its stamped payee; 22's
delivery and lineage; 21's billable party and `invoiceEmail`; 26's unit values and prepaid sets; 17's
soft blacklist warning helper; 16's `payableReleasedFor`; 15's Booking vocabulary; 15a's warning
routine; 14's trigger registry, actors and office stand-ins; and 39a's `runExclusionFor`, the one run
exclusion point it left for this phase's hold.
**Also uses, by build order rather than as formal dependencies** (they are numbered before 41 but not
reached through 27, 39 or 39a, so confirm in PROGRESS that each is DONE): 28's Lists with their own
ids and `reassignList` / `reassignBooking`; 31's Draft List assign; 32's own moves
(`moveBookingToDoer`, `pushListToSlot`, the move to the office) and their move sheets; 35's admin save
path; 40's patient follow-up log. If 32 or 31 is not done, hook the repoint (item 12) onto the move
paths that exist, and record the missing ones in the PROGRESS entry for that phase to wire; if 40 is
not done, skip item 6's follow-up bullet.
**Estimated:** 2 sessions. Session 1: work items 1 to 10 (figures pinned, letters end to end, the
reminder, the overpaid prepayment accepted, and the trust hold with its release at authorise and the
reseed), ending green with shots. Session 2: items 11 to 21 (the payee repoint on a move, the trust
account view, refund on cancellation, the payout, the rebook, the Xero sim, triggers, PWA stand-ins and
the demo guide). If session 2 runs long, land the refund and payout (items 14 and 15) green first,
then the repoint (item 12), and build the rebook (item 16) last.

## Goal

Finish the prepayment story. Most of it is Verify, so keep it thin, but build the answers given on
2026-10-01, not defaults.

- **Letters.** When an admin approves a generated prepayment invoice to send (27's "Approve and
  send"), they pick one of a small set of standard letter templates and see a preview. The letter goes
  out with the invoice. Templates carry merge fields (patient, procedure, estimate, anaesthetist) and
  always word the amount as an estimate that may come out higher or lower. Admins maintain the
  templates in Master data. "Send pre-payment reminder" on the Booking sends a reminder letter for an
  unpaid or part-paid prepayment.
- **Overpaid prepayment accepted (OQ-03 answered).** When the final fee at authorise is below what
  was prepaid, nothing is credited and nothing is refunded. Billing proceeds: no balance invoice, no
  failure, and the prepayment's payable is released in full to the anaesthetist who did the procedure.
  The excess Phase 27 records shows as information only. Every positive balance is still invoiced
  (OQ-61's recommendation, kept in 27's one place).
- **Held in trust until the procedure (OQ-40 answered).** Prepayment money received sits in AA's trust
  account as a pending payment. Its payable is not released, and so never reaches a payables run,
  until the Booking's List is AUTHORISED. It is then released to whoever did the procedure (25's lock
  payee) and paid on the next payment run. The trust account view shows prepayments held, released,
  refunds due and refunds paid.
- **Refund on cancellation.** Cancelling a Booking with a paid prepayment refunds it in full from the
  trust account: a credit against the prepayment invoice through 39's credit path (linked in the
  ledger to the original invoice), a refund due, and the payout recorded from the system. Because the
  money was held, the anaesthetist was never paid, so there is nothing to recover.
- **Moved prepaid Booking (US-06.5.4, OQ-70's recommendation).** A prepaid Booking moved to another
  anaesthetist before the procedure is not billed again. The agreed amount stands, and the
  prepayment's draft payable is repointed to the anaesthetist who now holds it, who wears or benefits
  from the rate difference. One store action does it, called from every move path.
- **Rebook after a true cancellation (US-06.5.3).** "Rebook with another anaesthetist" on a cancelled
  Booking creates a new Booking under the replacement. The engine generates a fresh prepayment at
  their own unit value, held for approval as 27 does. The original is refunded, never transferred,
  and both estimates are visible.

> Names below are the names Phases 15 to 39a planned (`Booking`, `bookingId`, `BookingDetailBody`,
> `CancelBookingSheet`, `createBooking` in `store/bookingActions.ts`, `syncPrepayment`,
> `approvePrepaymentInvoice`, `prepaymentStatusFor`, `LedgerPair`, `ledgerPosition`). Phase 39
> planned its credit as a `CreditNote` record in `billing.creditNotes` with a `cause` union and
> `originalInvoiceId`; pure `creditInFull`, `reversalPlan` and `xeroCorrectionPlan` in
> `domain/billing/creditNote.ts`; `applyCredit` in 36's `ledger.ts` (the pair gains
> `credit: { creditNoteId; atISO; heldForPayer; recoveryDue }`); `ledgerPosition` totals
> `creditsHeldForPayers` and `recoveryDueFromAnaesthetists`; `handoffCorrection(api, creditNoteId)`
> for the Xero mirror; and the credit-note document at `/admin/credit-notes/:creditNoteId`. Phase 39a
> planned the `PayablesRun` record, its approval step and netting. Use what their PROGRESS entries
> record where it differs. Where this plan says "39's credit path" it means that single path, which
> this phase widens (a new `cause`) and never copies.

## Before you start: drift check

1. From the repo root, run:

   ```
   git diff 501b0b8 -- "docs/discovery-reference/Updated Requirements/catalogue" "docs/discovery-reference/Updated Requirements/domain-model.md"
   ```

   Look for changes to US-06.3.6, FT-06.4, US-06.4.2, FT-06.5, US-06.5.1 to US-06.5.4, and to the
   items this phase leans on: US-06.2.3 (the estimate wording), US-06.2.4, US-06.3.1 (generated and
   approved), US-06.3.2, US-06.3.5 (the re-check on a move), US-06.4.1, US-08.6.2 (credit and rebill),
   US-10.2.1 (payment release), US-10.2.5 and US-10.2.6 (39a's run), US-01.4.6 (the doer rule),
   US-02.5.3 (record a cancellation), US-12.1.1 (own unit value), FT-08.3, and the domain model's
   Prepayment section and glossary rows "Prepayment" and "Trust account". If an item changed, re-read
   it and adjust the work items. If one is now Retired or Future, drop it from this phase and record
   that in the PROGRESS entry.
2. **Owner decisions.** D5 (no prepayment gate, a warning, 15a and 27), D6 (generated at setup, sent on
   admin approval, 27) and D7 (the anaesthetist moves their own List with no confirmation, 32) were
   answered on 2026-10-01 and are built. Confirm from the PROGRESS entries that:
   - 27's "Approve and send" is the single send path (the letter picker joins it here), and the
     engine generates a held invoice for any new Booking that needs prepayment (the rebook relies on
     it);
   - 32's moves (`moveBookingToDoer`, `pushListToSlot`, a List moved to the office) and 28's and the
     office's moves (`reassignBooking`, `reassignList`, 31's Draft List assign) all call 27's re-check
     after commit with a move cause. Item 12 hooks the repoint onto that one call.
3. **Open questions.** OQ-03, OQ-40 and OQ-42 are Answered at `501b0b8`; build the answers with no
   label. Three linked questions are still Open:

   | OQ | Build (recommendation, kept in one place) | If answered differently |
   |---|---|---|
   | **OQ-70** (a prepaid Booking moved to another anaesthetist) | The agreed amount stands and the prepayment's draft payable is repointed to the anaesthetist who now holds the Booking (item 12, one store action `repointPrepaymentPayee`). The panel line carries "To confirm with AA (OQ-70)" | "Credit and prepay again at the new rate" (OQ-21's reading, which Ben disagreed with): replace the repoint's body with item 14's refund plus 27's generation at the new unit value; the rebook path already has every piece |
   | **OQ-61** (always invoice a positive balance?) | Every positive balance is invoiced. That rule is 27's balance run; this phase does not touch it | A threshold: change 27's balance run in its one place; nothing here moves |
   | **OQ-47** (payment day and cycle) | No separate trust payment cycle. A released prepayment payable joins 39a's next payables run like any other; 39a holds the OQ-47 label | A weekly trust cycle: a run setting on 39a's record, not a change here |

4. **Read what Phases 14, 15, 15a, 16, 22, 25, 26, 27, 28, 31, 32, 35, 36, 39, 39a and 40 actually
   built** (their PROGRESS entries):
   - 14: the registry entry shape (`id`, `routes`, `surfaces`, `badge`, `choices`, `disabledReason`),
     `OFFICE_ACTOR` and `OFFICE_SIMULATION_ACTOR` in `store/demoActors.ts`, and `officeStandIn.ts`.
   - 15: the renamed files and ids (`store/bookingActions.ts` with `createBooking`, `shared/booking/`,
     `AdminBookingDetail`, `seed/bookings.ts`, `BookingCancellation`, `BookingSource`).
   - 16: `payableReleasedFor` (`domain/billing/payableRelease.ts`), the one release rule the hold
     extends.
   - 25: the lock's `payee` and where 36 reads it as the pair's payee.
   - 27: the `BookingPrepayment` shape, `syncPrepayment` and its causes, `approvePrepaymentInvoice`
     and every surface that calls it (panel, rail card, Invoices strip, invoice document, the PWA
     stand-in), `Invoice.approval`, the status set, `PrepaymentPanel`, the prepayment warning text, the
     `prepaymentExcess` build result and 27's Review chip "Pre-paid more than the final fee: $X", the
     balance invoice's `balanceOfPrepayment` lineage, and the seeded Riley and Nair figures.
   - 32: the move actions, their audit metas (`booking.movedToDoer`, `list.ownerMove`), the move
     sheets on mobile and web and their prepayment line ("Any prepayment keeps its agreed amount").
   - 35: whether admin edits commit through a draft-then-save change set, which the "Stage overpaid
     prepayment" trigger must then use instead of calling `editProcedure` directly.
   - 36: `PayableLeg`, `applyReceipt`, `ledgerChecks` (`releasedNotReceived`), `ledgerPosition`,
     `anaesthetistPosition`, `prepaidAboveFinal` on the prepayment pair, the Ledger routes and the
     footnote that says receipts held include prepayments.
   - 39: the credit-note type and its `cause` union, `creditInFull`, `reversalPlan` and `applyCredit`,
     the `NegativeInvoice` record (39 raises one for every credit, wholly offset against the payable
     when nothing was paid out, so `toNet` is 0), `xeroCorrectionPlan` (a draft ACCPAY with nothing
     authorised is voided), `creditsHeldForPayers` and how a held credit is marked refunded, the
     `kindNotCreditable` refusal on prepayment invoices in `creditAndRebill`, `handoffCorrection`, the
     credit-note document route and how the Xero sim shows credit notes.
   - 39a: the `PayablesRun` record, `buildRunDraft` and how a run selects payables (released minus
     disbursed minus offset), `runExclusionFor` (the hook where this phase adds `'heldInTrust'`), the
     period approval step, the remittance advice, the backdrop runs it grouped the seeded
     disbursements into (including the seeded prepayment payout `PR-SEED-01`), and the payables
     screen's run table.
   - 40: the patient follow-up log (`PatientFollowUp`, `logPatientFollowUp`).
   - 22, 26, 28, 31: `InvoiceDelivery` and sends; which colleagues have prepaid sets and unit values;
     how a List is created on a Slot and which DRAFT Lists exist on Fri 24 Jul and later; 31's assign.
   Adjust the work items to reuse what exists instead of adding a second copy.
5. Note the current `PERSIST_VERSION` (13 at the snapshot; 14 to 40 will have raised it).
6. Record the result (including "no drift", the OQ states and what 27, 36, 39 and 39a provide) in the
   PROGRESS entry.

## Reference

- **Design** (convention 17):
  - `docs/design/Design Language.dc.html`: semantic tints (success for refunded, released and paid,
    warning for refund due and awaiting bank, info or neutral for held in trust), neutral pills for
    letter and refund states, Spline Sans Mono with tabular-nums for every amount and every invoice,
    credit-note and refund number, radius 14 cards, and teal as the only action colour. Crimson
    appears only in the side nav's active state and avatars, never on the letter preview, the refund
    section, the trust tiles or any button.
  - `docs/design/Admin Review.dc.html`: the stat-tile row (the trust account tiles), the table (the
    trust movements and the letter template list) and the flag chips.
  - `docs/design/Admin Day.dc.html`: the right-rail white cards (27's "Pre-payments" rows gain a
    "Reminded" line) and the dark side nav (the Ledger badge counts refunds to action).
  - `docs/design/Mobile App.dc.html`: the Booking detail white cards and the bottom-sheet pattern
    (the anaesthetist's cancel sheet note, the trust and refund lines on the panel).
  - No mockup covers a letter, a template editor or a trust account. Extend the Admin Review tiles and
    table and the invoice document's paper layout; do not invent a new visual language.
- **Catalogue:** the covered files above, plus US-06.2.3, US-06.2.4, US-06.3.1, US-06.3.2, US-06.3.5,
  US-06.4.1, US-08.6.2, US-10.2.1, US-10.2.5, US-01.4.6, US-02.5.3, US-12.1.1; OQ-03, OQ-40 and
  OQ-42 (answered), OQ-61, OQ-70 and OQ-47 (open); the evidence note
  `catalogue/notes/2026-10-01-aa-meeting-with-greg.md` (points #2, #16, #18 and #57); and
  `domain-model.md` (Prepayment, and the glossary rows "Prepayment" and "Trust account").
- **Gap analysis:**
  - `GAP-ANALYSIS.md`: Summary, theme 5 ("Prepayment reversed"), "Structural first" (DM-22 before
    DM-21), the Prepayment trigger cluster, and the Uncertainty bullets on OQ-70 and OQ-61.
  - `epics/EP-06.md`: EP-06, US-06.3.6, FT-06.4, US-06.4.1, US-06.4.2, FT-06.5, US-06.5.1 to
    US-06.5.4.
  - `gaps.json` entries for the covered IDs, DM-20 and DM-21. FT-06.5, US-06.5.1 and US-06.5.4 are
    Contradicts: today the prepayment payable is authorised on receipt and paid out before the
    procedure (seeded disbursement 16 Jul for a 24 Jul procedure), and the payee stays on the first
    anaesthetist after a move.
  - `analysis/domain-model-delta.md`: DM-20, DM-21, DM-22 (the ledger), DM-24 (credit and rebill) and
    DM-06 (the payable follows the doer).
- **Code entry points** (July line numbers, from `analysis/prototype-map-*.md`; every file has moved
  through 15 to 39a):
  - `src/domain/types.ts`: `Card` 370 (now `Booking`, with 27's `prepayment` and 15's `BookingSource`),
    `CardCancellation` 343 (now `BookingCancellation`), `Invoice` 662 (27's `approval`, 22's
    `delivery` and `lineage`), the Xero types 769 to 815 (`XeroAccPay.amountAuthorised` 780), 36's
    `LedgerPair`, `PayableLeg`, `LedgerReceipt`, `LedgerDisbursement`, 39's `CreditNote` and
    `XeroCreditNote`, 39a's `PayablesRun`, `DemoSettings` 886.
  - `src/domain/billing/`: 16's `payableRelease.ts`, `invoiceBuild.ts` (the `negativeTotal` message
    about 418, which still says "an overpaid pre-payment needs a manual credit"),
    27's `prepayment.ts` and `prepaymentEstimate.ts`, 36's `ledger.ts`, 39's `creditNote.ts`, 22's
    `invoicePresentation.ts`, `money.ts`, `index.ts`.
  - `src/store/`:
    - `lifecycle.ts`: `cancelCard` 363 (now `cancelBooking`), `reassignList` 550, `reassignCard` 640
      (now `reassignBooking`), `authoriseList`;
    - `paymentActions.ts` (header 1 to 30: the ACCPAY authorised pro rata on receipt, which the hold
      stops for prepayment pairs); `payablesActions.ts` (`runPayables` 146; 39a's run);
    - `prepaymentActions.ts` (27's actions and `syncPrepayment`);
    - `billingRun.ts` (`runBillingForList` 68, where 27 records the excess);
    - 39's `creditActions.ts`; 36's `ledgerActions.ts` and `ledgerSelectors.ts`;
    - `xeroHandoff.ts` (payee resolved from the List at handoff, 166 to 171; 39's `handoffCorrection`);
    - `bookingActions.ts` (`createBooking`); 32's move actions;
    - `mastersActions.ts`; `mutate.ts` (`ID_FORMATS` 61, `resetDomainState` 218);
    - `officeStandIn.ts` and `demoActors.ts` (14); `selectors.ts` (`prepaymentStatusFor`).
  - `src/shared/booking/`: `BookingDetailBody` and 27's `PrepaymentPanel`;
    `src/shared/flows/CancelBookingSheet.tsx`, `flows/index.ts`; `src/shared/audit/actionLabels.ts`,
    `fieldLabels.ts`, `auditNarrative.ts`; `src/shared/format.ts` (`drSurname`, `nameWithoutTitle`,
    the money formatter); `src/shared/demoTriggers/` (`registry.ts`, `types.ts`, `context.ts`).
  - `src/apps/admin/`: `screens/AdminCardDetail.tsx` (now `AdminBookingDetail`),
    `screens/MasterData.tsx` (left sub-nav; 27's "Pre-payment" section), `screens/InvoiceDocument.tsx`,
    39's credit-note document, `screens/ReviewScreen.tsx`, `reviewFlags.ts`,
    `screens/BillingMonitorScreen.tsx` ("Run payables" 141, or 39a's payables screen), 36's
    `screens/LedgerScreen.tsx`, `components/SideNav.tsx`, `components/RightRail.tsx`,
    `flows/ReassignListFlow.tsx`, `flows/MoveCardFlow.tsx` (now the Booking move), `routes.tsx`,
    `src/router.tsx` 88 to 106.
  - `src/apps/web/` Accounts (the anaesthetist's held prepayments line) and 32's move sheets on
    mobile and web.
  - `src/apps/demo/DemoXero.tsx` (`PairDetail` 222, 39's credit-note panel), `xeroPairView.ts`,
    `DemoControlPanel.tsx` (the S4 scenario text).
  - Seed: `src/domain/seed/cards.ts` (now `bookings.ts`; Riley on Souter Fri 24 AM, Nair on Souter
    Fri 24 PM), `index.ts` (`SEED_MARKERS` 706), `billing.ts` (`buildSeedBillingSlice`, the paid
    INV0001 / BC0001 prepayment disbursed by `SEED_PREPAYMENT_DISBURSED_ISO = '2026-07-16T09:00:00'`
    at 65 and 218 to 245, payables run `PR-SEED-01`), `cast.ts` (Souter $26.50, Beaumont $31.00, 26's
    prepaid sets), `rvgCodes.ts` (41800 Rhinoplasty, 5 base units).
  - Tests: `prepayment.test.ts`, `prePaymentInvoice.test.ts`, `billingRun.test.ts`, 39's credit
    tests, `ledger.test.ts`, `lifecycle.test.ts`, `seedBilling.test.ts`, `seed.test.ts`,
    `demoScenarios.test.ts`, `persistMigrate.test.ts`, `pwaPurity`, `xeroPairView.test.ts`,
    `DemoXero.test.tsx`, `mastersActions.test.ts`, `ReassignListFlow.test.tsx`. Shots:
    `visual/admin-phase09.spec.ts` and 27's prepayment specs, 36's `admin-ledger.spec.ts`,
    `xero-pair.spec.ts`. Capture recipes: `requirements-board/capture/recipes/US-06.4.1.json`,
    `US-06.4.2.json`, `US-02.5.3.json` (no recipe exists for US-06.3.6 or US-06.5.x).

## Work items

**Session 1: letters, the reminder, the overpaid prepayment and the trust hold.**

1. **Pin the figures first.** Before changing code, add `src/store/prepaymentFollowupParity.test.ts`,
   keyed on invoice numbers and Booking ids, never on pair or credit ids. From the current build,
   capture:
   - the S3 invoice totals, the S4 beats' figures and 39's credit-and-rebill and 39a's payables run
     figures;
   - Riley's and Nair's prepayment statuses, stored amounts and, for Nair, the balance invoice after
     authorising Souter Fri 24 PM with the seeded times (27's top-up);
   - `ledgerPosition` of the seed and of each seeded anaesthetist with money (36), including
     `imbalance` 0 and no checks;
   - every seeded Booking's `prepaymentStatusFor`.
   Item 9's reseed (Nair's prepayment no longer disbursed on 16 Jul) moves Souter's paid-out total,
   the seeded payables run and the ledger's prepayment totals on purpose. Re-pin those there, with
   the reason; everything else must pass unchanged at the end of session 1.
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
     letter words the amount as an estimate (US-06.3.6 paragraph 2).
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
     - the anaesthetist's name through `shared/format.ts` (names have one home; if importing it into
       the store makes a cycle, move the helper, never copy it);
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
7. **The overpaid prepayment is accepted** (`billingRun.ts`, `invoiceBuild.ts`, 36's pair; US-06.4.2,
   FT-06.4; OQ-03 answered):
   - **Confirm what 27 and 36 built.** A counterparty group negative only because of prepayment
     deduction lines raises no invoice and no failure; 27 records `prepaymentExcess`, and 36 keeps it
     as `prepaidAboveFinal` on the prepayment pair, outside `imbalance`. If either still fails the
     Booking or raises anything, fix it there, in its one place.
   - **No credit, no refund.** Add tests that, for a prepaid amount above the final at authorise:
     zero credit notes, zero trust refunds and zero balance invoices are created; the Booking reads
     billed; the prepayment payable is released in full (the prepaid amount, not the final) to the
     payee by item 8; the ledger stays in balance; the locked price (25) is not altered; a sibling
     hospital group on the same Booking bills normally; replaying the run is a no-op.
   - **The message.** A negative group with no prepayment line still fails with `negativeTotal`. Drop
     "an overpaid pre-payment needs a manual credit" from its message (39 left it for this phase):
     "The lines billed to one counterparty add up to a negative amount ($X). Review the price override
     before rebilling." Gate:
     `grep -rnE "manual credit|Credit handled in a later release" aa-prototype/src aa-prototype/visual`
     returns nothing.
   - **One read.** A selector `prepaymentSettlementFor(state, bookingId)` returning
     `{ prepaymentInvoices, balanceInvoice?, prepaidAboveFinal?, credits[], refunds[] }` (credits and
     refunds fill in session 2), used by the panel, the invoice document and the Ledger row. It
     confirms 27's balance invoice still names its prepayment.
   - Tests as above, plus: an estimate exactly equal to the final raises nothing; an estimate below
     the final still bills the positive balance (OQ-61's recommendation, 27's rule, unchanged).
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
       `withPayee(pair, anaesthetistId)` that item 12 also uses (it sets `pair.anaesthetistId` and
       `payable.anaesthetistId` together);
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
9. **Seed, session 1** (`seed/masters` or wherever 18 to 26 keep masters, `seed/billing.ts`; bump
   `PERSIST_VERSION` by one):
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
     remittance figure moves. Retire `SEED_PREPAYMENT_DISBURSED_ISO` if nothing else uses it. Any billed history Booking with a prepayment is seeded released at its List's authorise
     time. Never change the filler generator's `rng()` draw order.
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
      on the invoice, the reminder, the held and released panel lines, the payables row, the overpaid
      line).
    - **Session 1 exit:** `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots` all
      green; item 1 passes with only the re-pinned figures moved; the item 7 grep is empty. Write a
      short "session 1 done" note in the PROGRESS entry.

**Session 2: the payee repoint, refund on cancellation, the payout and the rebook.**

11. **Types, session 2 part** (`domain/types.ts`; DM-21):
    - `TrustRefund = { id; bookingId; prepaymentInvoiceId; creditNoteId; counterparty (the billable
      party that paid); anaesthetistId (the prepayment pair's payee when refunded); amount; status:
      'due' | 'instructed' | 'paid'; createdAtISO; instructed?: { atISO; by; reference }; paidAtISO?;
      xeroRefundId? }`, held in `billing.trustRefunds`. The amount equals the `heldForPayer` on 39's
      pair `credit`; it is never stored a second way. There is no overpayment reason (OQ-03).
    - `AA_TRUST_ACCOUNT = { name: 'AA trust account', bankAccount: '99-0100-0000001-00' }`, a named
      constant on the non-issued bank code 99, plainly fictional (as 26's bank numbers are).
    - `Booking` gains `rebookedFromBookingId?`, and 15's Booking `source` gains `'rebook'`.
    - The Xero slice gains `refunds: Record<string, XeroRefund>`, where `XeroRefund = { id;
      creditNoteId (39's Xero credit note); amount; bankAccount: 'trust'; status: 'authorised' |
      'paid'; createdAtISO; paidAtISO?; reference }`.
    - 39's `CreditNote.cause` widens with `'prepaymentRefund'`.
    - `ID_FORMATS`: `trustRefund` (`TR`, pad 4) and `xeroRefund` (`XRF`, pad 4).
12. **A moved prepaid Booking keeps its amount; the payee is repointed** (US-06.5.4, OQ-70's
    recommendation; `prepaymentActions.ts` or a new `trustActions.ts`):
    - **One store action**, `repointPrepaymentPayee(api, bookingId, cause)`, run as `ENGINE_ACTOR`
      from 27's re-check whenever its cause is a move (`bookingMoved` or `listMoved`, which 28's
      `reassignBooking` and `reassignList`, 32's `moveBookingToDoer`, `pushListToSlot` and move to the
      office, and 31's Draft List assign pass). If the drift check finds a move path that skips the
      re-check or passes another cause, fix that path's call rather than adding a second trigger. It
      is the only code that changes a prepayment payee before authorise.
    - For each sent prepayment pair on the Booking that is held in trust: when the Booking's List now
      has an anaesthetist other than the pair's payee, apply item 8's `withPayee` and move the draft
      Xero ACCPAY's contact to the new anaesthetist in the same `mutate`. The amount, the invoice and
      27's stored estimate never change, no new prepayment invoice is raised, and the patient is not
      billed again (AC1). Audit `ledgerPair.payeeRepointed` (before and after payee, cause).
    - A List moved to the office (32's Draft List, no anaesthetist) keeps the payee until it is
      assigned; the assign repoints. A held invoice not yet sent is 27's (withdraw and regenerate at
      the new rate), not this action's. After AUTHORISED nothing repoints: the lock decides.
    - Item 8's release still stamps the lock payee, so a Booking moved to the doer at submit (32,
      US-01.4.6) lands with the right payee even if a path missed the call; a test proves the two agree.
    - Tests (the three ACs): moved from Souter to Beaumont before the procedure: no new invoice, the
      draft payable points to Beaumont, and after authorise the payable is to Beaumont for the
      prepaid amount; moving back repoints back; a List moved to the office then assigned repoints
      once; replay is a no-op; the ledger stays in balance; 27's "Agreed with Dr Souter" line stays.
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
    - `movements`: one row per receipt (Pre-payment received), release (Released to the anaesthetist),
      refund created (Refund due) and refund paid (Refund paid), each with date, Booking, patient name,
      anaesthetist, invoice or credit number and a signed amount, oldest first.
    - Tests: the sums from a hand-built fixture; a held, a released and a refunded prepayment in one
      view; movements ordered and signed; `heldInTrust` equals the ledger's term; the identity holds;
      same input gives deep-equal output.
14. **Refund a prepayment on cancellation** (`trustActions.ts`, exported from the store index;
    US-06.5.2, FT-06.5):
    - **Status.** 27's `prepaymentStatusFor` result gains `refund?: { amount; status: 'toAction' |
      'due' | 'instructed' | 'paid'; creditNumbers }`. `toAction` means the Booking is cancelled and
      has a sent prepayment invoice not yet credited. A cancelled Booking never warns (27 holds this).
    - **`refundPrepaymentOnCancellation(api, actor, bookingId)`**, office only:
      - refusals: `notCancelled` ("Cancel the booking first."), `noPrepayment`, `alreadyRefunded`,
        `listAuthorised` ("This booking was billed. Use credit and rebill instead.");
      - in one `mutate`: credit **every** sent prepayment invoice on the Booking in full through 39's
        credit path (`creditInFull`, `cause: 'prepaymentRefund'`, `originalInvoiceId` the prepayment
        invoice), whether paid, part paid or unpaid, so the patient is never chased for a cancelled
        Booking; apply it to both ledger legs with 39's `reversalPlan` and `applyCredit`; and create
        one `TrustRefund` (status `due`) for the `heldForPayer` (the amount actually received), when
        above zero;
      - the money was held (item 8), so `released` and `disbursed` are 0: 39's path records its
        negative invoice wholly offset against the never-released payable (`toNet` 0,
        `recoveryDue` 0, nothing for 39a to net) and `xeroCorrectionPlan` voids the draft ACCPAY.
        Nothing is recovered from the anaesthetist. Assert it in a test rather than adding a second
        recovery path or skipping 39's negative invoice; if a disbursed prepayment were ever reached,
        39's path and 39a's netting apply unchanged;
      - 39's `creditAndRebill` keeps refusing a prepayment invoice (`kindNotCreditable`). Reword its
        sentence to "A pre-payment invoice is credited by a refund on cancellation, not by credit and
        rebill.";
      - `anaesthetistId` on the refund is the pair's payee at refund time (after any item 12 repoint),
        so the refund names "whichever anaesthetist held it";
      - audits `booking.prepaymentRefund` (after: credit numbers, refund amount, holder); Xero
        credit-note mirror after commit through 39's `handoffCorrection`.
    - **`cancelBooking` with a refund.** `cancelBooking(api, actor, bookingId, reason, { refundPrepayment?:
      true })`: for an office actor with `refundPrepayment`, the cancel and the refund commit in the
      same `mutate` (audit metas `booking.cancel` then `booking.prepaymentRefund`). Without the
      option, or for an anaesthetist or integration actor, the cancel is unchanged and the refund
      reads `toAction` for the office. A cancel is never refused because of a prepayment. 27 still
      withdraws a held (unsent) invoice on cancel.
    - Tests:
      - the ACs: a paid prepayment, cancelled before the procedure, is refunded in full, whichever
        anaesthetist held it; the ledger credit links to the original prepayment invoice
        (`prepaymentSettlementFor` and the lineage);
      - the same after item 12 moved it to Dr Beaumont: the refund names Dr Beaumont as holder and
        nothing was ever paid to either anaesthetist;
      - unpaid: credit in full, no refund; part paid: credit in full, refund of what was received;
      - an anaesthetist cancel on mobile leaves `toAction`, and the office refund then completes it;
      - an integration cancel leaves `toAction`;
      - idempotency: a second refund refuses `alreadyRefunded`; the ledger never double-credits;
      - the ledger and the trust view balance after each step.
15. **The payout** (US-06.5.1: "payments out of the trust account are made from the system"):
    - **`recordTrustRefundPayout(api, actor, refundId, { reference })`**, office only ("Record refund
      payout"): refused unless `due`; reference required (default offered: "Refund {credit number}").
      Sets `instructed`, creates the `XeroRefund` (status `authorised`, trust bank account) against
      39's Xero credit note in the same `mutate`, audits `trustRefund.instructed`.
    - **`settleTrustRefundPayout(api, refundId)`**, the bank side, actor "Xero bank feed" (new: a
      `BANK_FEED_ACTOR` system actor in `demoActors.ts`, unless 37 already added one), called by the Xero sim trigger ("Pay out trust refund"): refused
      unless `instructed`; sets `paid` and `paidAtISO` from the demo clock, the `XeroRefund` to `paid`,
      and the money-out entry the ledger reads: `receiptsHeld` gains `- refundsPaid`, and 39's held
      credit is marked refunded, so `creditsHeldForPayers` drops by the same amount and the imbalance
      never moves. Audits `trustRefund.paid`. Idempotent by refund id.
    - Tests: order enforced; replay is a no-op; the ledger and the trust view stay in balance at each
      step; no anaesthetist position changes on a payout.
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
      create, and not `copyBooking`, which stays on the same List):
      - patient, billable party and `invoiceEmail` (21), and each Procedure's estimated duration (27);
      - each non-cancelled Procedure as a skeleton: description, RVG code and chosen base units for a
        ranged code, primary flag (23); no times, modifiers, overrides or adjustments;
      - the Contract: the source Procedure's Contract when 20's filtered picker still offers it for
        the new anaesthetist and List, else 20's default for the List;
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
      41800 Rhinoplasty Procedure on the patient-layout default Contract, estimated duration 90
      minutes, and a stored estimate computed by 27's estimator at seed time (at July values,
      (5 + 6 + 2) x $26.50 = $344.50 ex-GST, $396.18 with GST; pin what the build computes).
    - Its prepayment invoice is approved and sent with `LT001`'s rendered letter, and **received in
      full and held in trust** (item 8): nothing released or disbursed. Its invoice number is
      allocated after every existing seeded invoice, so no scripted invoice number moves.
    - **The replacement.** Make sure Dr Beaumont's prepaid set (26) covers 41800 (add the group that
      holds it if needed) and that she has a DRAFT List on the refund Booking's date at the same
      hospital, and one on Fri 24 Jul for the move beat. Run 26's coherence test: if any other seeded
      Beaumont Booking now derives prepayment, pick a different colleague with a different unit value;
      never change a Booking's code.
    - Never change the filler generator's `rng()` draw order.
    - `seed.test`: the refund Booking reads paid and held in trust; `ledgerPosition` of the seed is in
      balance with no checks; the trust view of the seed has two held prepayments, no refunds, and its
      identity holds; Riley and Nair are unchanged. Re-pin item 1's ledger totals with the reason.
      Update `seedBilling.test.ts`, `demoScenarios.test.ts` and `persistMigrate.test.ts`.
18. **Session 2 surfaces:**
    - **Moves** (US-06.5.4): the admin Booking move (`MoveCardFlow.tsx`, now the Booking move) and
      `ReassignListFlow.tsx` confirm steps, and 32's move sheets on mobile and web, replace 32's
      prepayment line with "The pre-payment keeps its agreed amount of $X. Dr Beaumont becomes the
      payee." (one line per List with a count when several). After the move, the panel reads
      "Pre-payment kept at the agreed amount · payee now Dr Beaumont" with "To confirm with AA
      (OQ-70)" (`data-shot="prepayment-repointed"`). The Xero sim pair shows the draft ACCPAY's new
      contact.
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
      session, hospital, surgeon), defaulting to the source Booking's date; 17's warning inline; a
      preview line "New pre-payment estimate at Dr Beaumont's unit value: $403.00" from the pure
      estimator, and "It is generated for approval, as any new booking's is."; "Rebook". On success,
      navigate to the new Booking.
    - **Admin trust account** (`LedgerScreen.tsx` gains a third scope; route `/admin/ledger/trust`,
      wrappers in `routes.tsx` and `router.tsx`; `data-shot="trust-account"`):
      - 36's scope Segmented becomes "Whole ledger · One anaesthetist · Trust account";
      - header note: "Pre-payments are held here until the procedure is done, then released to the
        anaesthetist who did it and paid in the next payment run. Refunds are paid from here." with a
        neutral "To verify with AA" pill (FT-06.5 is Verify);
      - tiles (the Admin Review tile row): Pre-payments received, Held in trust, Released to
        anaesthetists, Refunds due, Refunds paid;
      - **Held card**: the held rows (patient name, never the NHI; anaesthetist surname; procedure
        date; amount in mono);
      - **Refunds card** (`data-shot="trust-refunds"`): "To action" rows ("Refund pre-payment from
        trust account"), "Due" rows ("Record refund payout", a Dialog with the reference, "Pay to: the
        patient's nominated account (bank details are not held in the prototype)" and "Record
        payout"), "Awaiting bank" rows, and paid rows, each with holder surname, credit number, amount
        and a status pill;
      - **Movements table** from `trustAccountView`, with a totals row;
      - 36's footnote about receipts held changes to "Pre-payments held until the procedure are shown
        on the trust account.";
      - 36's Ledger nav badge adds refunds to action and refunds due.
    - Audit labels: `ledgerPair.payeeRepointed` "Pre-payment payee changed after a move",
      `booking.prepaymentRefund` "Pre-payment refunded from trust account", `trustRefund.instructed`
      "Refund payout recorded", `trustRefund.paid` "Refund paid from trust account",
      `booking.rebooked` "Rebooked with another anaesthetist"; entity type `trustRefund` in the Audit
      viewer filter.
19. **Xero simulation** (`DemoXero.tsx`, `xeroPairView.ts`): the pair detail shows a held prepayment's
    ACCPAY as "Draft · held in trust until the procedure" with its contact (which changes after a
    repoint) and, once refunded, 39's "Draft ACCPAY voided", and, on 39's credit-note panel, a
    "Refund from trust account" row per `XeroRefund`:
    amount (mono), bank account "AA trust account", reference, status ("Authorised · awaiting payment"
    or "Paid 21 Jul") (`data-shot="xero-trust-refund"`). `xeroPairView` gains the hold state and the
    refunds; update `xeroPairView.test.ts` and `DemoXero.test.tsx`. No NHI anywhere (convention 8).
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
    - Extend `visual/admin-prepayment-followup.spec.ts`: the move line and repointed panel, the cancel
      dialog, the trust account (held, then after a refund and a payout), the rebook dialog, the
      prepayment history. Update `xero-pair.spec.ts` (the held ACCPAY and the refund row) and 36's
      `admin-ledger.spec.ts` (the third scope). Add a mobile shot of a refunded cancelled Booking, a
      mobile shot of 32's move sheet with the prepayment line, and a PWA shot of each stand-in.
    - Run
      `node requirements-board/scripts/capture.ts --only US-02.5.3,US-06.4.1,US-06.4.2 --dry`
      and record which recipes break or can now show real shots (US-06.4.2's recipe may still stage a
      credit, which no longer exists). Note that US-06.3.6 and US-06.5.1 to US-06.5.4 have no recipe.
      Do not edit catalogue files or add recipes.
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
| Move a prepaid Booking or List to another anaesthetist | Admin Booking move and Reassign List; 32's move sheets on mobile and web | The re-check runs `repointPrepaymentPayee`: "Pre-payment kept at the agreed amount · payee now Dr B", and the Xero sim's draft ACCPAY shows Dr B |
| Authorise the List | Admin · Review | Releases a held prepayment to the lock payee ("Released to Dr X") |
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

No PWA entry for the move (the anaesthetist moves their own List on the handset through 32's sheet,
normal use, and the panel shows the repoint), the release (14's "Office authorises this List" already
authorises), the overpaid case (it waits on nothing once authorised) or the rebook (the replacement is
not the handset persona). 27's "Office approves and sends the prepayment invoice" now sends the default
letter.

## Out of scope

- Any credit, refund, credit on account or write-off of a prepaid amount above the final (OQ-03
  answered: it is kept). A shortfall threshold (OQ-61): 27's balance run.
- Recovering money from an anaesthetist for a prepayment: the hold means a prepayment is never paid
  out before the procedure. After authorise, a correction is 39's credit and rebill, with its negative
  invoice netted by 39a.
- A separate weekly trust payment cycle (OQ-47): released prepayment payables join 39a's run.
- Crediting and prepaying again when a prepaid Booking moves (OQ-21's reading): the repoint is built;
  a different OQ-70 answer replaces item 12's body.
- Real bank details for patients, a bank-feed match for refunds, and any trust-account reconciliation
  beyond the derived view. The trust account is not a general ledger.
- Letter templates for anything but prepayment requests and reminders; rich text, attachments,
  per-anaesthetist letters, and an outbox. Phase 35's mailto update email stays separate.
- Automatic or scheduled reminders. The reminder is an office action; 15a's escalating warning stays
  the control.
- A sent prepayment no longer needed on a live Booking (27's `notNeeded`): the balance run at
  authorise deducts it, and an amount above the final is kept (item 7). No separate refund action.
- Patient-screen views of refunds beyond what Phase 40's patient position already reads from the
  ledger.

## Manual test checklist

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
- [ ] Release: complete, submit and authorise Souter Fri 24 PM. The balance invoice names INV0001;
      the panel reads "Released to Dr Souter"; the next payables run pays INV0001-P. Ledger in balance.
- [ ] Overpaid: reset, complete and submit Souter Fri 24 PM, open it in Review, "Stage overpaid
      prepayment". Authorise: no balance invoice, no credit note, no refund, no failure; the
      septoplasty's hospital invoice bills normally; the panel reads "Pre-paid more than the final fee
      · $X kept. No refund or credit."; INV0001-P is released in full. Ledger in balance.
- [ ] The item 7 grep is empty.
- [ ] Move: on Riley (sent, part paid), move the Booking to Dr Beaumont's Fri 24 Jul List. The confirm
      step says the pre-payment keeps its agreed amount and Dr Beaumont becomes the payee. No new
      invoice; the panel reads "payee now Dr Beaumont" with the OQ-70 caption; the Xero sim's draft
      ACCPAY contact is Dr Beaumont. Move it back: repointed back, one audit row each way.
- [ ] Cancel: open the refund Booking in Admin, Cancel. The dialog shows "Pre-payment received ·
      $396.18 ... held in the AA trust account". "Cancel and refund pre-payment": a credit in full
      against the prepayment invoice, Refund due $396.18, the draft ACCPAY voided, and nothing to net
      or recover from Dr Souter (39's negative invoice wholly offset). The
      credit number opens the credit-note document, which names the original prepayment invoice.
      Ledger in balance. Credit and rebill on that prepayment invoice is still refused, with the
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
- [ ] Anaesthetist path: reset, then on mobile cancel the refund Booking as Dr Souter: the sheet notes
      the office refunds it; the Booking reads "Pre-payment to refund" for the office, appears under
      "To action" on the trust account, and the Ledger badge counts it. "Refund pre-payment from trust
      account" there completes it.
- [ ] Only the OQ-70 caption and the trust account's "To verify with AA" pill remain; no OQ-03, OQ-40
      or OQ-42 label anywhere.
- [ ] S3, the S4 beats, 39's credit-and-rebill and 39a's figures match item 1 (with only the re-pinned
      figures moved, each with its reason).
- [ ] PWA build, the refund Booking on the handset: cancel it, open the demo-actions sheet, "Office
      refunds this pre-payment from the trust account" (office stand-in badge): the panel reads
      "Refunded to the patient". On Riley: "Office sends a pre-payment reminder". Move a prepaid List
      through 32's sheet: the prepayment line shows. Bottom sheets, teal actions, no crimson.
- [ ] Teal is the only action colour, crimson only in the nav, amounts and numbers in mono with
      tabular-nums, no NHI in letters or the Xero sim, and no en or em dashes in any new copy or
      seeded template.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots` are all green.

## Demo guide updates

Patch these in the same session, in `docs/demo-guide/` and the matching sections of
`master-demo-guide.html` (S4 and the cheat sheet's "Pre-payment" and "The money model" sections, as
Phases 27, 36, 39 and 39a left them):

- `03-demo-script.md` **S4 Beat 1** (27's "Pre-payment from the prepaid list"): Click becomes "Approve
  and send, pick the Cosmetic procedure pre-payment letter and preview it"; Say adds "The letter always
  words it as an estimate, because the final fee may be higher or lower."
- The S4 beat where Fri 24 PM is authorised (27's balance top-up): add "Nair's pre-payment was held in
  AA's trust account until now; authorising releases it to Dr Souter, paid in the next payment run."
- **S4 new beat, "Held in trust, moved, refunded and rebooked"** (after 27's closing beat; check the
  numbering 39 and 39a left):
  - **Click:**
    - Admin, Ledger, Trust account: the held pre-payments.
    - Riley: "Send pre-payment reminder"; then move her Booking to Dr Beaumont's Fri 24 Jul List:
      "payee now Dr Beaumont", and the Xero sim's draft ACCPAY.
    - The refund Booking: Cancel, "Cancel and refund pre-payment".
    - Trust account: the refund due; "Record refund payout".
    - Xero sim, the pair: Demo actions, "Pay out trust refund".
    - Back on the cancelled Booking: "Rebook with another anaesthetist", Dr Beaumont.
  - **Say:** "Pre-payment money sits in AA's trust account until the procedure is done, so nobody is
    paid for work that has not happened. If the booking moves, the patient is not billed again: the
    agreed amount stands and the anaesthetist who does it is paid. If it is cancelled, the patient is
    refunded in full from the trust account, as a credit against the original invoice. A true rebook
    starts a fresh pre-payment at the new anaesthetist's own rate, so the patient may see two
    estimates."
  - **Expected:** the held rows; the repoint with no new invoice; credit in full, refund due,
    instructed, paid; the new Booking with its own estimate awaiting approval; both estimates visible.
- **S4 optional beat, "Pre-paid more than the final fee"**: Stage it (complete and submit Souter Fri
  24 PM), Review, "Stage overpaid prepayment", Authorise; Say "When the procedure comes in under the
  estimate, the difference is kept. AA does not refund or credit it, and nothing more is billed."
- S4 "Discovery points": OQ-70 (a moved prepaid Booking keeps the agreed amount, to confirm with Ben)
  and OQ-61 (whether a small shortfall is let go). Drop any OQ-03, OQ-40 or OQ-42 point (answered).
- `04-presenter-cheat-sheet.md` "Pre-payment" (27's rewrite) and "The money model": add letters and
  reminders, held in trust until the procedure, an overpayment kept, refund on cancellation, the move
  rule and the rebook. "Prototype readiness" moves these from "Still upcoming" to "Built and
  clickable".
- `02-workflows-and-handoffs.md`: the cancellation workflow adds "a paid pre-payment is refunded in
  full from the trust account"; the "Pre-payment" case adds letters, the trust hold and release, the
  move rule and the refund; the anaesthetist's move workflow (32's) adds the payee line.
- `01-personas-and-responsibilities.md`: the office persona "maintains the pre-payment letters, sends
  reminders, and handles pre-payment refunds from the trust account".
- `docs/demo-guide/README.md` status row and the master guide's status table: "Pre-payment letters,
  trust account hold and refunds, move and rebook".
- The Control Panel S4 scenario text (item 20).
- This is not a milestone phase. Still reread the S4 section of `master-demo-guide.html` against the
  edited Markdown so beat numbers, figures and trigger labels agree.

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
    to the cent after every step: receipt, release, repoint, refund, payout, rebook.
  - A held prepayment is never released, approved for payment or paid before its List is AUTHORISED,
    by any path (receipt, payables run, retry, seed).
  - A refund never exceeds what was received; a credit never exceeds what was invoiced.
  - A prepaid amount above the final creates no credit, no refund, no invoice and no failure, and is
    released in full; the locked price (25) is never altered; a negative group without a prepayment
    line still fails with `negativeTotal`.
- **One path each.** Every credit goes through 39's credit path and Xero mirror; every payee change
  before authorise goes through `repointPrepaymentPayee`; every release through 16's extended rule. No
  second credit type, release rule or payee writer.
- **Move rule.** Every move path (admin move, reassign List, 32's moves, 31's assign) repoints exactly
  once and never raises an invoice or changes the agreed amount; the release payee always equals the
  lock payee.
- **Refund rules.** Always in full on cancellation; paid, part-paid and unpaid invoices all credited;
  office only; refused on an AUTHORISED List; idempotent; nothing ever netted or recovered from an
  anaesthetist (39's negative invoice wholly offset, never a second recovery path). A cancel is never
  refused because of a prepayment; the anaesthetist and integration paths leave `toAction`.
- **Rebook rules.** Nothing transfers between anaesthetists. The fresh prepayment comes from 27's
  engine, at the replacement's unit value, held for approval. The Booking create path is reused.
- **Letters.** Every letter carries the fixed estimate notice, which promises no refund; no NHI in any
  letter; the snapshot is immutable after a template edit; merge fields validate; names come from
  `shared/format.ts`; a letter is rendered only at approval.
- **Labels.** Only OQ-70's caption and the trust account's Verify pill; no OQ-03, OQ-40 or OQ-42 label
  survives. No gold-plating: no bank matching, scheduled reminders, rich-text letters or trust cycle.
- **Rights, audit and determinism.** Every action audits before and after through `mutate()`, with the
  right actor (office, "Billing run", "Billing engine", "Xero bank feed", the simulated office). Clock
  from state only; no `Date.now()`, `new Date()` or `Math.random()`. Seed determinism and the filler
  `rng()` order are unchanged, and `PERSIST_VERSION` is bumped once per session that changed the seed.
- **Triggers and PWA.** Each entry shows only on its routes and surface; the stand-ins are badged; the
  bodies live in `src/store` or `src/shared`; `pwaPurity` passes.
- **Design.** Teal the only action colour, crimson never on the new surfaces, tints from the tokens,
  mono with tabular-nums for money and numbers, no en or em dashes in any copy or seeded template.

## PROGRESS.md updates

- Status row for catch-up Phase 41, and a phase entry covering:
  - the drift-check result and the OQ states (OQ-03, OQ-40 and OQ-42 built as answered; OQ-70 built
    as its recommendation; OQ-61 and OQ-47 left in 27's and 39a's places);
  - what 27, 32, 36, 39 and 39a were found to provide, how 16's release rule was extended for the hold,
    and how 39's `cause` was widened;
  - the session 1 and session 2 split and the adversarial pass;
  - the tests added (letter renderer, template actions, approval letter, reminder, overpaid accepted,
    hold and release, repoint, trust view, refund, payout, rebook, triggers, parity);
  - `PERSIST_VERSION` old to new (each bump);
  - the re-pinned figures after items 9 and 17 (Nair's prepayment no longer disbursed on 16 Jul, the
    seeded payables run, the ledger's held total), and the refund Booking's and the rebook's figures;
  - the capture recipes checked, and the missing recipes for US-06.3.6 and US-06.5.x, for the owner.
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
  - **Extended, not superseded:** the 7th review B23 audited soft-cancel stands (a cancelled Booking is
    retained, visible and excluded from billing); cancelling a prepaid Booking now also refunds its
    prepayment from the trust account.
  - **New readings:**
    - A prepayment payable's payee before authorise changes only through `repointPrepaymentPayee`, run
      from 27's re-check on every move; the agreed amount stands (US-06.5.4, OQ-70's recommendation,
      to confirm with Ben).
    - A cancellation refunds only money actually received; sent unpaid prepayment invoices are
      credited, not refunded; under the hold 39's negative invoice is wholly offset against the
      never-released payable, so no recovery from an anaesthetist arises.
    - The trust account is a derived view over prepayment pairs and refund records; released
      prepayment payables are paid on 39a's normal run (no separate trust cycle while OQ-47 is open).
    - The payout is two steps: recorded in the system, then paid by the bank (the Xero sim trigger).
    - Rebooking after a true cancellation creates a new Booking; its fresh prepayment comes from 27's
      engine for the replacement, and nothing moves between anaesthetists.
    - Letters are plain-text templates with a fixed, non-removable estimate notice, rendered at
      approval and snapshotted on the invoice; reminders are office actions, never scheduled.
