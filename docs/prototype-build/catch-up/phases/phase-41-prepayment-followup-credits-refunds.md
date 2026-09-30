# Phase 41 · Prepayment letters, credits and refunds

**Requirements covered:**
[US-06.3.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.3.6.md) (Proposed; letter templates, and the reminder that follows them up),
[FT-06.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-06.4.md) (the credit half; Phase 27 built the balance half),
[US-06.4.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.4.2.md) (Open, OQ-03),
[FT-06.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-06.5.md) (Proposed),
[US-06.5.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.5.1.md) (Proposed, OQ-40),
[US-06.5.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.5.2.md) (Proposed, OQ-40, OQ-42),
[US-06.5.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.5.3.md) (Proposed, OQ-40);
[DM-17](../analysis/domain-model-delta.md#dm-17) (trust account and central prepayment refunds).
Also builds, without closing it (it is counted under Phase 27), the two parts of
[DM-16](../analysis/domain-model-delta.md#dm-16) that Phase 27 left here (the
letter-template master and the overpayment credit). This finishes EP-06's letters, credit, trust
account and refund half. No reverse finding is closed here
([reverse check](../analysis/reverse-check.md): none of RV-01 to RV-22 touches refunds or letters).
**Depends on:** Phase 27 (the derived prepayment requirement, the stored `BookingPrepayment` with
its estimate snapshot, `setPrepaymentAmount`, `raisePrepaymentInvoice`, the reworked
`prepaymentStatusFor`, the balance invoice that names its prepayment, and the interim
prepaid-above-final excess record this phase turns into a credit) and Phase 39 (credit notes: the
pure credit construction, the credit leg on the ledger pair, the payable reversal, the Xero
credit-note mirror and the `Invoice.lineage` credit role). Through them: 36's ledger pairs,
`ledgerPosition` and the Admin Ledger screen; 22's delivery (`InvoiceDelivery`, sends) and lineage;
21's billable party and `invoiceEmail`; 26's unit values and prepaid sets; 25's lock; 28's Lists with
their own ids (the rebook target); 17's soft blacklist warning helper; 16's payable release rule;
15's Booking vocabulary; 14's trigger registry, actors and office stand-ins.
**Estimated:** 2 sessions. Session 1: work items 1 to 9 (figures pinned, letters end to end, the
reminder, and the overpaid-prepayment credit with its surfaces), ending green with shots. Session 2:
items 10 to 19 (the trust account, refund on cancellation, the payout, the rebook with a replacement
anaesthetist, the Xero sim, triggers, PWA stand-ins and the demo guide). This is at the upper edge of
two sessions. Keep to the order: if session 2 runs long, land items 10 to 13 and the refund parts of
15 to 19 green first, and build the rebook (item 14, its dialog and the history block) last.

## Goal

Finish the prepayment story where rework is cheapest, and keep it thin: almost everything here is
Proposed or Open, so every surface is labelled provisional.

- **Letters.** When the office sets a prepayment, it picks one of a small set of standard letter
  templates, sees a preview, and the letter goes out with the prepayment invoice. Templates carry
  merge fields (patient, procedure, estimate, anaesthetist) and always word the amount as an estimate
  that may come out higher or lower. Admins maintain the templates in Master data. "Send pre-payment
  reminder" on the Booking sends a reminder letter for an unpaid or part-paid prepayment.
- **Overpaid prepayment.** When the final fee at authorise is below what was prepaid, the billing run
  settles it with a credit against the prepayment invoice instead of Phase 27's interim flag. The
  settlement is traceable both ways: a positive balance invoice names its prepayment (27), and so does
  the credit.
- **Trust account.** A thin, provisional trust account view shows prepayments received, what was paid
  on to anaesthetists, refunds due and refunds paid, and records refund payouts from the system.
- **Refund on cancellation.** Cancelling a Booking with a paid prepayment offers "Refund pre-payment
  from trust account". That credits the prepayment invoice in full (linked in the ledger to the
  original invoice, whichever anaesthetist held it), records the refund due, and the office then
  records the payout. Where the anaesthetist was already paid, the amount to recover is shown, not
  settled (OQ-42).
- **Replacement anaesthetist.** "Rebook with another anaesthetist" on the cancelled Booking creates a
  new Booking under the replacement, and raises a fresh prepayment at their own unit value. The
  original is never transferred, and both estimates are visible.

> Names below are the names Phases 15 to 39 planned (`Booking`, `bookingId`, `BookingDetailBody`,
> `CancelBookingSheet`, `createBooking` in `store/bookingActions.ts`, `prepaymentStatusFor`,
> `setPrepaymentAmount`, `raisePrepaymentInvoice`, `LedgerPair`, `ledgerPosition`). Phase 39 planned
> its credit as: a `CreditNote` record in `billing.creditNotes` (not an `Invoice` kind) with
> `cause: 'correction'` and `originalInvoiceId`; pure `creditInFull`, `reversalPlan` and
> `xeroCorrectionPlan` in `domain/billing/creditNote.ts`; `applyCredit` in 36's `ledger.ts` (the pair
> gains `credit: { creditNoteId; atISO; heldForPayer; recoveryDue }`); `ledgerPosition` totals
> `creditsHeldForPayers` and `recoveryDueFromAnaesthetists`; `creditAndRebill` in
> `store/creditActions.ts`; `handoffCorrection(api, creditNoteId)` for the Xero mirror
> (`xero.creditNotes`, `XeroCreditNote`); and the credit-note document at
> `/admin/credit-notes/:creditNoteId`. Use what 39's PROGRESS entry records where it differs. Where
> this plan says "39's credit builder" it means that single credit path, which this phase extends
> (a wider `cause`, an amount for a settlement credit) and never copies.

## Before you start: drift check

1. From the repo root, run:

   ```
   git diff 1f067a8 -- "docs/discovery-reference/Updated Requirements/catalogue" "docs/discovery-reference/Updated Requirements/domain-model.md"
   ```

   Look for changes to US-06.3.6, FT-06.4, US-06.4.2, FT-06.5, US-06.5.1, US-06.5.2 and US-06.5.3, and
   to the items this phase leans on: US-06.2.3 (the estimate wording), US-06.2.4, US-06.3.1, US-06.3.2,
   US-06.4.1, US-08.2.2, US-08.6.2 and US-08.6.3 (credit and rebill, additional invoices), US-02.5.3
   (record a cancellation), US-12.1.1 (own unit value), US-10.2.1 (payment release), FT-08.3, and the
   domain model's Prepayment section and glossary rows "Prepayment" and "Trust account". If an item
   changed, re-read it and adjust the work items. If one is now Retired or Future, drop it from this
   phase and record that in the PROGRESS entry. If FT-06.5 as a whole is Retired (OQ-40 answered "not
   acceptable"), stop after session 1 and ask the owner what replaces the refund path.
2. **Owner decisions.** None gates this phase directly. Confirm how D6 (who raises the prepayment
   invoice, Phase 27) and D10 (additional-invoice pricing, Phase 39) were built, because both change
   where the letter picker and the rebook's fresh prepayment land:
   - D6 default (the engine raises when the amount is set): the letter is picked in 27's "Set
     pre-payment" sheet, and a rebook raises the fresh prepayment at once.
   - D6 office branch: the letter is picked in the "Raise pre-payment invoice" dialog, and a rebook
     stops at "Pre-payment to invoice" with that prompt.
3. **Open questions.** All three are Open at `1f067a8`. If still open, build the interim and label it
   in the UI.

   | OQ | Interim to build (labelled "Provisional · to confirm with AA (OQ-nn)") | If answered differently |
   |---|---|---|
   | **OQ-03** (prepaid above final: refund, credit on account, or write off?) | The engine credits the excess against the prepayment invoice at authorise, and any excess that was actually received becomes a trust refund due, through the same refund path as a cancellation (OQ-40 asks exactly this) | "Held as credit": raise the credit note, create no refund; the patient's position shows an unapplied credit. "Written off": no credit note; record a written-off excess on the Booking and in the audit only. Either way the billing run still never raises a negative invoice |
   | **OQ-40** (trust account process and timing) | The process as written. Money timing: prepayment money reaches the anaesthetist on the normal payment run once received (16's release rule, unchanged), held as one named constant `PREPAYMENT_RELEASE_TIMING = 'onReceipt'`. The trust account view is derived from the ledger plus refund records. Reassigning a List with prepaid Bookings does not trigger a refund; it shows an advisory only (item 16) | "Held until the procedure is done": prepayment payables are released only when the List is AUTHORISED (a guard in 16's release path for `prePayment` pairs), and the view's "Held in trust" becomes the unreleased total. "Reassign follows the refund path": make the advisory a prompt that runs item 12's refund per Booking. "Not acceptable": see step 1 |
   | **OQ-42** (recovering money already paid to the anaesthetist) | Reuse whatever Phase 39 built for a credit after disbursement. If 39 modelled the trail only, do the same: the payable reversal records a recovery due from the anaesthetist, shown as "To recover from Dr X: $Y, offset against a later payment (provisional, OQ-42)", and nothing nets it in the payables run | If answered with the recommendation (offset in the next run, remainder carried forward) and 39 did not build it, raise it with the owner as its own small phase rather than growing this one |

4. **Read what Phases 14, 15, 22, 26, 27, 28, 35, 36, 39 and 40 actually built** (their PROGRESS
   entries):
   - 14: the registry entry shape (`id`, `routes`, `surfaces`, `badge`, `choices`, `disabledReason`),
     `OFFICE_ACTOR` and `OFFICE_SIMULATION_ACTOR` in `store/demoActors.ts`, and `officeStandIn.ts`.
   - 15: the renamed files and ids (`store/bookingActions.ts` with `createBooking` and `copyBooking`,
     `shared/booking/`, `AdminBookingDetail`, `seed/bookings.ts`, `BookingCancellation`, `BookingSource`).
   - 35: whether admin edits now commit through a draft-then-save change set, which the "Stage overpaid
     prepayment" trigger must then use instead of calling `editProcedure` directly.
   - 40: the patient follow-up log (`PatientFollowUp`, `logPatientFollowUp`) and whether the patient
     record reads credits and refunds from the ledger.
   - 27: the `BookingPrepayment` shape, the name and storage of the prepaid-above-final excess
     (`prepaymentExcess` on the build result, `creditDue` or similar on the Booking), the status set,
     `prepaymentsDue`, `PrepaymentPanel`, `PrepaymentAmountSheet`, the office stand-in, and the
     balance invoice's link (`settlesPrepaymentInvoiceIds`, the deduction line's
     `prepaymentInvoiceId`, or a `lineage` role).
   - 39: the credit-note type and builder (planned full-only: "Partial credits: never, by policy
     (OQ-28)" is its out-of-scope line for corrections), the `cause` union, `reversalPlan` and
     `applyCredit` (planned full-only; `applyCredit` refuses a pair already credited), what it does
     once the payable is disbursed (OQ-42, `recoveryDue`), how `creditsHeldForPayers` marks a held
     credit "refunded", its Xero credit-note mirror (`handoffCorrection`), the `kindNotCreditable`
     refusal on prepayment invoices in `creditAndRebill`, how the AA fee and GST activity treat a
     credited invoice, and how credit notes render (the credit-note document route and the Xero sim).
   - 36: `ledgerPosition`, `ledgerChecks`, `LedgerReceipt`, `LedgerDisbursement`, the Ledger routes and
     the footnote that points at this phase; whether 36 or 39 left a `creditDuePending` tile.
   - 22: `InvoiceDelivery` and `sends`, and whether prepayment invoices are delivered by email.
   - 26: which colleagues have prepaid sets, and which group holds 41800 Rhinoplasty.
   - 28: how a List is created on a Slot, and which DRAFT Lists exist on Fri 24 Jul and later.
   Adjust the work items to reuse what exists instead of adding a second copy.
5. Note the current `PERSIST_VERSION` (13 at the snapshot; 14 to 40 will have raised it).
6. Record the result (including "no drift", the three OQ states and what 27 and 39 provide) in the
   PROGRESS entry.

## Reference

- **Design** (convention 17):
  - `docs/design/Design Language.dc.html`: semantic tints (success for refunded and paid, warning for
    refund due and awaiting bank, error for a negative trust balance), neutral pills for letter and
    refund states, Spline Sans Mono with tabular-nums for every amount and every invoice, credit-note
    and refund number, radius 14 cards, and teal as the only action colour. Crimson appears only in the
    side nav's active state and avatars, never on the letter preview, the refund section, the trust
    tiles or any button.
  - `docs/design/Admin Review.dc.html`: the stat-tile row (the trust account tiles), the table (the
    trust movements and the letter template list) and the flag chips (the excess credit flag).
  - `docs/design/Admin Day.dc.html`: the right-rail white cards (27's "Pre-payments due" rows gain a
    "Reminded" line) and the dark side nav (the Ledger badge counts refunds to action).
  - `docs/design/Mobile App.dc.html`: the Booking detail white cards and the bottom-sheet pattern
    (the anaesthetist's cancel sheet note and the refund lines on the panel).
  - No mockup covers a letter, a template editor or a trust account. Extend the Admin Review tiles and
    table and the invoice document's paper layout; do not invent a new visual language.
- **Catalogue:** the covered files above, plus US-06.2.3, US-06.2.4, US-06.3.1, US-06.3.2, US-06.4.1,
  US-08.2.2, US-08.6.2, US-02.5.3, US-12.1.1, OQ-03, OQ-40, OQ-42, and `domain-model.md` (Prepayment,
  and the glossary rows "Prepayment" and "Trust account").
- **Gap analysis:**
  - `GAP-ANALYSIS.md`: Summary, theme 7 ("Trust-account items are Proposed; schedule last"),
    "Structural first" step 5 (DM-18 before DM-17), the Money and Prepayment/patients trigger
    clusters, and the Uncertainty bullet on OQ-03, OQ-40 and OQ-42.
  - `epics/EP-06.md`: EP-06, US-06.3.6, FT-06.4, US-06.4.1, US-06.4.2, FT-06.5, US-06.5.1 to US-06.5.3.
  - `gaps.json` entries for the covered IDs, DM-16 and DM-17.
  - `analysis/domain-model-delta.md`: DM-16 (the letter master and credit), DM-17, DM-18 and DM-21.
- **Code entry points** (July line numbers, from `analysis/prototype-map-*.md`; every file has moved
  through 15 to 39):
  - `src/domain/types.ts`: `Card` 370 (now `Booking`, with 27's `prepayment` and
    `estimatedDurationMin`, and 15's `BookingSource` union), `CardCancellation` 343 (now
    `BookingCancellation`), `Invoice` 662 (27's settlement link, 22's
    `delivery` and `lineage`, 39's credit fields), `InvoiceLine` 678, the Xero types 769 to 815, 36's
    `LedgerPair`, `LedgerReceipt`, `LedgerDisbursement`, 39's `CreditNote`, `ReversalPlan` and
    `XeroCreditNote`, `DemoSettings` 886.
  - `src/domain/billing/`: `invoiceBuild.ts` (27's excess return, `buildPrePaymentInvoiceForBooking` since 15),
    27's `prepayment.ts` and `prepaymentEstimate.ts`, 36's `ledger.ts` (39's `applyCredit`), 39's
    `creditNote.ts` (`creditInFull`, `reversalPlan`, `xeroCorrectionPlan`), 22's
    `invoicePresentation.ts`, `money.ts`, `index.ts`.
  - `src/store/`:
    - `lifecycle.ts`: `cancelCard` 363 (now `cancelBooking`), `editRefusal` 48, `reassignList` 550;
    - `prepaymentActions.ts` (27's actions and re-check);
    - `billingRun.ts` (`runBillingForList` 68, where 27 records the excess);
    - 39's `creditActions.ts` (`creditAndRebill`, its `kindNotCreditable` refusal); 36's
      `ledgerActions.ts` and `ledgerSelectors.ts`;
    - `xeroHandoff.ts` (39's `handoffCorrection`); `paymentActions.ts`; `payablesActions.ts`;
    - `cardActions.ts` (`createCard` 70, `copyCard` 179, `addProcedure` 394), renamed by 15 to
      `bookingActions.ts` (`createBooking`, `copyBooking`, `addProcedure`): `createBooking` is the one
      Booking create path;
    - `mastersActions.ts`; `mutate.ts` (`ID_FORMATS` 61, `resetDomainState` 218);
    - `officeStandIn.ts` and `demoActors.ts` (14); `selectors.ts` (`prepaymentStatusFor`).
  - `src/shared/card/` (now `src/shared/booking/`): `CardDetailBody.tsx` (now `BookingDetailBody`) and 27's
    `PrepaymentPanel`; `src/shared/flows/CancelCardSheet.tsx` (now `CancelBookingSheet`), 27's
    `PrepaymentAmountSheet.tsx`, `flows/index.ts`; `src/shared/audit/actionLabels.ts`,
    `fieldLabels.ts`, `auditNarrative.ts`; `src/shared/format.ts` (`drSurname`, `nameWithoutTitle`,
    the money formatter); `src/shared/demoTriggers/` (`registry.ts`, `types.ts`, `context.ts`).
  - `src/apps/admin/`: `screens/AdminCardDetail.tsx` (now `AdminBookingDetail`),
    `screens/MasterData.tsx` (left sub-nav; 27's "Pre-payment" section), `screens/InvoiceDocument.tsx`
    (27's prepayment wording), 39's credit-note document (`/admin/credit-notes/:creditNoteId`), `screens/ReviewScreen.tsx`,
    `reviewFlags.ts`, `screens/BillingMonitorScreen.tsx`, 36's `screens/LedgerScreen.tsx`,
    `components/SideNav.tsx`, `components/RightRail.tsx`, `flows/ReassignListFlow.tsx`, `routes.tsx`,
    `src/router.tsx` 88 to 106.
  - `src/apps/demo/DemoXero.tsx` (`PairDetail` 222, 39's credit-note panel), `xeroPairView.ts`,
    `DemoControlPanel.tsx` (the S4 scenario text).
  - Seed: `src/domain/seed/cards.ts` (now `bookings.ts`; Riley on Souter Fri 24 AM, Nair on Souter
    Fri 24 PM, the scenario id object about 1200 to 1240), `index.ts` (`SEED_MARKERS` 706, built by
    `buildMarkers`), `billing.ts` (`buildSeedBillingSlice`, the paid and disbursed INV0001 /
    BC0001 prepayment, disbursed 16 Jul, `SEED_PREPAYMENT_DISBURSED_ISO`), `cast.ts` (Souter $26.50,
    Beaumont $31.00, 26's prepaid sets), `rvgCodes.ts` (41800 Rhinoplasty, 5 base units), 19's RVG
    groups.
  - Tests: `prepayment.test.ts`, `prePaymentInvoice.test.ts`, `billingRun.test.ts`, 39's credit tests,
    `ledger.test.ts`, `lifecycle.test.ts`, `seedBilling.test.ts`, `seed.test.ts`,
    `demoScenarios.test.ts`, `persistMigrate.test.ts`, `pwaPurity`, `xeroPairView.test.ts`,
    `DemoXero.test.tsx`, `mastersActions.test.ts` (all exist today). Shots: `visual/admin-phase09.spec.ts` and 27's prepayment specs,
    36's `admin-ledger.spec.ts`, `xero-pair.spec.ts`. Capture recipes:
    `requirements-board/capture/recipes/US-06.4.1.json`, `US-06.4.2.json`, `US-02.5.3.json` (no recipe
    exists for US-06.3.6 or US-06.5.x).

## Work items

**Session 1: letters, the reminder and the overpaid-prepayment credit.**

1. **Pin the figures first.** Before changing code, add `src/store/prepaymentFollowupParity.test.ts`,
   keyed on invoice numbers and Booking ids, never on case, pair or credit ids. From the current
   build, capture:
   - the S3 invoice totals, S4 Beats 3 and 5, and 39's credit-and-rebill beat figures;
   - Riley's and Nair's prepayment statuses, stored amounts and, for Nair, the balance run after
     authorising Souter Fri 24 PM with the seeded times (27's top-up);
   - `ledgerPosition` of the seed and of each seeded anaesthetist with money (36), including
     `imbalance` 0 and no checks;
   - every seeded Booking's `prepaymentStatusFor`.
   This test must pass unchanged at the end of session 1. Session 2's seed additions (item 15) move
   the ledger totals on purpose; re-pin them there, with the reason.
2. **Types, session 1 part** (`domain/types.ts`; DM-16 letter master, DM-17 refund record):
   - `LetterMergeField = 'patientName' | 'procedure' | 'procedureDate' | 'estimate' | 'anaesthetist'
     | 'invoiceNumber' | 'amountOutstanding'`. The first five are the catalogue's (patient, procedure,
     estimated amount, anaesthetist) plus the date; `invoiceNumber` and `amountOutstanding` exist
     because the letter goes out with the invoice and the reminder names what is still owed.
   - `PrepaymentLetterTemplate = { id; kind: 'request' | 'reminder'; name; body; isDefault: boolean;
     active: boolean; updatedBy?; updatedAtISO? }`, held in `masters.prepaymentLetterTemplates`.
     `body` is plain text with `{{field}}` placeholders; no HTML, no rich text.
   - `RenderedLetter = { templateId; templateName; kind; body; renderedAtISO }`: a snapshot, so a later
     template edit never changes a letter already sent.
   - `BookingPrepayment` (27) gains `letterTemplateId?`.
   - `Invoice` gains `letter?: RenderedLetter` (set on a prepayment invoice when raised) and
     `prepaymentReminders?: { atISO; by; to; letter: RenderedLetter; amountOutstanding }[]`.
   - `TrustRefund = { id; bookingId; prepaymentInvoiceId; creditNoteId; counterparty (the billable
     party that paid); anaesthetistId (who held the prepayment: the payable leg's anaesthetist);
     reason: 'overpayment' | 'cancellation'; amount; status: 'due' | 'instructed' | 'paid';
     createdAtISO; instructed?: { atISO; by; reference }; paidAtISO?; xeroRefundId? }`, held in
     `billing.trustRefunds`. The amount equals the `heldForPayer` on 39's pair `credit` for that
     prepayment invoice; the recovery due is read from that pair `credit.recoveryDue`, never stored a
     second time on the refund. Session 1 only ever creates `due`
     overpayment refunds; session 2 adds the rest.
   - `ID_FORMATS` (`mutate.ts`): `letterTemplate` (`LT`, pad 3) and `trustRefund` (`TR`, pad 4). Thread
     the new slices through the empty slices, `freshAppState`, `resetDomainState` and the seed slice
     types.
3. **Pure letter module** (`domain/billing/prepaymentLetter.ts`, exported from the billing index,
   with `prepaymentLetter.test.ts`; US-06.3.6, US-06.2.3):
   - `LETTER_MERGE_FIELDS`: the field list with a label each ("Patient name", "Procedure", "Procedure
     date", "Estimated amount", "Anaesthetist", "Invoice number", "Amount outstanding").
   - `PREPAYMENT_ESTIMATE_NOTICE`: one fixed paragraph the renderer always appends, whatever the
     template says: "This amount is an estimate. The final anaesthetic fee is calculated after your
     procedure and may be higher or lower. Any balance is invoiced after the procedure, and any
     overpayment is credited." A template cannot remove it, so every letter words the amount as an
     estimate (US-06.3.6 paragraph 2).
   - `validateLetterTemplate(t)`: refusals `emptyName`, `nameTooLong` (60), `emptyBody`, `bodyTooLong`
     (2,000 characters), `unknownMergeField` (names the field, for example `{{patient}}`),
     `missingEstimate` (a request template must contain `{{estimate}}`), `missingAmountOutstanding` (a
     reminder must contain `{{amountOutstanding}}`).
   - `renderPrepaymentLetter(template, data: Record<LetterMergeField, string>)`: replaces every
     placeholder, appends the notice, and returns the body. Missing data renders as a visible "[not
     set]" rather than an empty gap. Pure, no clock: the caller stamps `renderedAtISO`.
   - The store builds `data` in a selector `letterMergeDataFor(state, bookingId, invoiceId?)`:
     - patient name only, never the NHI;
     - the prepaid Procedures' descriptions (27's `prepaidProceduresFor`), joined with "and";
     - the List date in the invoice document's date format;
     - the prepayment invoice total, GST inclusive as the invoice shows it, or the stored amount with
       GST by 22's rule before the invoice exists (the preview);
     - the anaesthetist's name through `shared/format.ts` (names have one home; if importing it into
       the store makes a cycle, move the helper, never copy it);
     - the invoice number, and the outstanding amount from 36's receivable leg.
   - Tests: every field replaced; unknown and missing fields refused; the notice always present and
     last; "[not set]" for missing data; no NHI anywhere in the output for a seeded Booking; the same
     input gives the same output.
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
5. **The letter in the raise flow** (`prepaymentActions.ts`; US-06.3.6, US-06.3.1):
   - 27's `setPrepaymentAmount` choice gains `letterTemplateId?`. It is stored on the
     `BookingPrepayment`. An office actor may pick any active request template; the anaesthetist and
     the engine never pick, and get the default.
   - `raisePrepaymentInvoice` renders the letter from the stored template (or the default, if the
     stored one has since been deactivated) and stamps `invoice.letter` in the same `mutate` that
     raises the invoice. Under the D6 office branch its dialog passes the template.
   - The letter travels with 22's delivery: an email send records "with letter" (a flag on the send,
     not a second send). A portal or `noAddress` delivery keeps the letter on the invoice for printing.
   - Refusals: `templateInactive`, `templateWrongKind`.
   - Tests: the default is used when none is chosen; the chosen one is snapshotted; editing the
     template afterwards leaves `invoice.letter` unchanged; the engine raise (D6 default) carries a
     letter; the $800 deposit test and the guardian addressee test from 27 still pass.
6. **Send pre-payment reminder** (`sendPrepaymentReminder(api, actor, bookingId, templateId?)` in
   `prepaymentActions.ts`; US-06.3.6, US-06.3.2's "follow up"):
   - Office only (plus 14's `OFFICE_SIMULATION_ACTOR` for the PWA stand-in).
   - Allowed while 27's status is `unpaid` or `partPaid` and the List is not AUTHORISED.
   - Refusals: `noOutstandingPrepayment` ("There is no unpaid pre-payment on this booking."),
     `noInvoiceEmail` ("Add an invoice email for the payer to send a reminder.", when 22's delivery
     has no address), `templateInactive`, `templateWrongKind`.
   - Renders the reminder with `amountOutstanding` from the receivable leg, appends to the
     prepayment invoice's `prepaymentReminders`, and audits `invoice.prepaymentReminder` (after:
     template, to, amount outstanding). It never changes the prepayment status or 27's alert level.
   - A selector `lastPrepaymentReminder(state, bookingId)` for the panel and the rail row.
   - Phase 40's patient follow-up log (its hand-off note for 41): in the same `mutate`, append a done
     `PatientFollowUp` (`kind` widened with `'prepaymentReminder'`, text "Pre-payment reminder sent
     for {invoice number}", `invoiceId`) through 40's helper, so the patient record shows it. Keep it
     to that one entry; if 40 shipped no follow-up log, skip this bullet and record it.
   - Tests: rights; refusals; two reminders append two entries; the amount outstanding reflects a
     half payment; nothing else changes.
7. **The overpaid prepayment settles by credit at authorise** (`billingRun.ts`, 39's credit builder,
   36's `ledger.ts`; US-06.4.2, FT-06.4, US-06.4.1's traceability):
   - **Pure settlement maths** (`domain/billing/prepaymentCredit.ts`, with tests):
     `prepaymentExcessSettlement({ excessExGst, prepaymentInvoices, received })` returns, per
     prepayment invoice (newest first, so an older invoice keeps its full credit trail):
     - `creditAmount` (GST inclusive, GST by the prepayment invoice's own treatment, rounded to cents
       so the credits sum exactly to the excess plus its GST);
     - `refundAmount = max(0, received - (invoiced - credited))`: only money actually received above
       what the final fee needs is refunded. An unpaid or part-paid prepayment invoice is credited
       down first, so the patient is not chased for money they no longer owe.
   - **Extend 39's pure credit rules for an amount** (`domain/billing/creditNote.ts`, extend its tests;
     39 planned full credits only):
     - `CreditNote.cause` widens to `'correction' | 'prepaymentExcess' | 'prepaymentRefund'`;
     - a `settlementCredit(invoice, creditAmount)` beside `creditInFull`: one line "Credit: pre-paid
       more than the final fee", GST by the original's treatment, refused above the invoice total. A
       correction still only ever uses `creditInFull`;
     - `reversalPlan` takes an optional `creditAmount` (default the total, so 39's four cases are
       unchanged): `receivableCredited = payableReversed = creditAmount`,
       `heldForPayer = max(0, received - (total - creditAmount))`,
       `recoveryDue = max(0, disbursed - (total - creditAmount))`, and `releaseCancelled` bounded the
       same way; `xeroCorrectionPlan` credits the same amount;
     - `applyCredit` accepts the partial plan (the receivable leg's `creditedAmount` and the payable
       leg's `reversedAmount` become the credit amount, not the total). It still refuses a second
       credit on the same pair; replaying the run is therefore a no-op, not a second credit.
   - **The run.** Where 27 records a prepaid-above-final excess, the run now, in its one `mutate`:
     - allocates a `CreditNote` through 39's builder (`settlementCredit`, `cause: 'prepaymentExcess'`,
       `originalInvoiceId` the prepayment invoice, `bookingId` the Booking) against each prepayment
       invoice for its `creditAmount`. Never a second credit path. Record in the Decisions log that
       US-08.6.2's "credit in full" (and 39's "no partial credits") governs corrections, not a
       settlement credit;
     - applies the credit to both legs of the prepayment pair through `applyCredit` with the partial
       `reversalPlan`. If the payable was already disbursed, the pair credit records the recovery due
       (OQ-42, the interim above);
     - creates a `TrustRefund` (`reason: 'overpayment'`, status `due`) when `refundAmount > 0`;
     - audits `invoice.creditPrepaymentExcess` (after: the credit number, amount, prepayment invoice
       number, refund amount, recovery due) as the "Billing run" actor.
     The Xero credit-note mirror goes through 39's `handoffCorrection` after commit, as the run's
     other pairs do. A negative group with no prepayment deduction line still fails with
     `negativeTotal`, as today; its message drops "an overpaid pre-payment needs a manual credit"
     (39 left it for this phase), because that case is now credited.
   - **Links both ways.** Confirm 27's balance invoice names its prepayment (deduction line and
     `settlesPrepaymentInvoiceIds` or lineage). Add a selector `prepaymentSettlementFor(state,
     bookingId)` returning `{ prepaymentInvoices, balanceInvoice?, excessCredits[], refunds[] }`, used
     by the panel, the invoice document and the Ledger row.
   - **Retire the interim.** Remove 27's stored excess record (`creditDue` or whatever 27 named it) and
     its "Credit handled in a later release" copy, and 36's `creditDuePending` total and tile. Gate:
     `grep -rnE "Credit handled in a later release|creditDuePending|creditDue\b" aa-prototype/src aa-prototype/visual`
     returns nothing.
   - **Ledger position** (36's `ledgerPosition` and `anaesthetistPosition`, as 39 extended them):
     reuse 39's `creditsHeldForPayers` (a refund due or instructed is exactly a held credit) and
     `recoveryDueFromAnaesthetists`; do not add parallel `refundsDue` or `recoveriesDue` terms. This
     phase adds only `refundsPaid` (session 2's payouts), which leaves the held credit ("refunded", the
     state 39 left for this phase) and leaves `receiptsHeld`:
     `receiptsHeld = received + unmatchedHeld - disbursed - refundsPaid`, and 39's
     `imbalance = receiptsHeld - payablesDue - creditsHeldForPayers + recoveryDueFromAnaesthetists`
     is unchanged, so a payout never moves the imbalance. Add checks `refundAboveReceived` and
     `refundWithoutCredit`.
   - Tests, each asserting the ledger stays in balance to the cent at every step:
     - (A) a paid, undisbursed prepayment of $920.00 (800 + 120 GST) against a final of $600.00
       ex-GST: a credit of $230.00 (200 + 30 GST), a refund due of $230.00, then (session 2) paid;
     - (B) the same, already disbursed: credit, refund due and a recovery due of the credited amount;
     - (C) an unpaid prepayment above final: credit only, no refund;
     - (D) a part-paid prepayment where the received part exceeds the final: credit and a partial
       refund;
     - two prepayment invoices on one Booking; a sibling hospital group on the same Booking bills
       normally; the locked price (25) is never altered; replaying the run is a no-op.
8. **Seed, session 1** (`seed/masters` or wherever 18 to 26 keep masters, `seed/billing.ts`; bump
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
   - The seeded paid INV0001 (Nair) gets `LT001`'s rendered letter, stamped at its seeded raise time,
     built with the same renderer (never a hand-typed body).
   - Still no seeded Booking with prepaid above final (27's assertion stays).
   - `seed.test`: every template validates; exactly one active default per kind; two builds are
     deep-equal. Update `persistMigrate.test.ts`.
9. **Session 1 surfaces, triggers and exit:**
   - **Master data, "Pre-payment letters"** (`MasterData.tsx`, a new left sub-nav view after 27's
     "Pre-payment" section; `data-shot="letter-templates"`):
     - a table: Name, Kind (Request or Reminder), Default (a neutral pill), Active, Updated;
     - "New template" and a row "Edit" open a Dialog: name, kind (new only, Segmented), a body
       TextArea, a row of merge-field chips that insert `{{field}}` at the cursor, and a live preview
       beside it rendered with the renderer against a named sample (`LETTER_PREVIEW_SAMPLE`: a
       fictional patient, 41800 Rhinoplasty, Dr Souter, an estimate of $396.18). The fixed notice
       shows in the preview in a neutral box headed "Always included";
     - "Make default" and "Deactivate" row actions; refusals render verbatim;
     - a note: "Provisional. A small set of standard letters, as the office asked for (US-06.3.6)."
   - **Letter picker and preview** in 27's `PrepaymentAmountSheet` (office only; under the D6 office
     branch in the raise dialog instead): a "Letter" select of active request templates (default
     first) and a "Preview letter" disclosure that renders it for this Booking
     (`data-shot="prepayment-letter-picker"`). The anaesthetist's sheet shows one line: "The AA office
     sends the pre-payment letter."
   - **Invoice document** (`InvoiceDocument.tsx`): a prepayment invoice with a letter renders the
     letter as a cover section above the invoice, on the same paper and print stylesheet
     (`data-shot="prepayment-letter"`), with "Letter: Standard pre-payment estimate · sent with this
     invoice" in the rail. Reminders list under it (date, to, amount outstanding), each expandable to
     its snapshot. 39's credit-note document, for `cause: 'prepaymentExcess'`, reads "Credit for pre-payment
     {number}: the final fee was less than the estimate" (39 renders the rest; session 2 adds
     `cause: 'prepaymentRefund'`: "Credit for pre-payment {number}: booking cancelled, refunded from
     the AA trust account").
   - **"Send pre-payment reminder"** on 27's `PrepaymentPanel`, office surface, while `unpaid` or
     `partPaid` (`data-shot="prepayment-reminder"`): a teal action opening a Dialog with the reminder
     template select, the preview, the recipient address and "Send reminder". The panel then shows
     "Reminder sent 21 Jul 10:04 to {address}". On mobile and web the anaesthetist sees the same line
     read-only. 27's "Pre-payments due" rail row adds "Reminded 21 Jul" when one exists.
   - **The credit on screen:**
     - the panel, after authorise: "Pre-paid more than the final fee · $121.90 credited ({credit
       number}, linking to 39's credit-note document)" (figures illustrative; pin what the build
       computes), then "Refund due to the patient · $121.90" (warning tint) and, when a recovery is
       due, "To recover from Dr Souter: $121.90 (provisional, OQ-42)"; the OQ-03 label under it;
     - Review: 27's "Pre-paid more than the final fee" flag now reads "Pre-paid more than the final
       fee, credit of $X at authorise" before authorising;
     - the Billing monitor's row detail: "Credit {number} · refund due";
     - `data-shot="prepayment-excess-credit"`.
   - **Demo trigger** "Stage overpaid prepayment" (see "Demo triggers"), with registry tests for route
     visibility, the disabled reasons, and that authorising after staging raises exactly one credit.
   - Audit labels: `letterTemplate.*` ("Pre-payment letter template created", "updated", "activated",
     "deactivated", "made default"), `invoice.prepaymentReminder` "Pre-payment reminder sent",
     `invoice.creditPrepaymentExcess` "Pre-paid more than the final fee, credited"; entity type
     `letterTemplate` in the Audit viewer filter; narrative formatters for `letterTemplateId` and
     `letter` (the template name, never the whole body).
   - Shots: add `visual/admin-prepayment-followup.spec.ts` (the template view, the picker, the letter
     on the invoice, the reminder, the credit panel).
   - **Session 1 exit:** `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots` all
     green; item 1 passes unchanged; the item 7 grep is empty. Write a short "session 1 done" note in
     the PROGRESS entry.

**Session 2: the trust account, refund on cancellation, the payout and the rebook.**

10. **Types, session 2 part** (`domain/types.ts`; DM-17):
    - `TrustRefund` gains its full lifecycle (item 2's fields are all used now).
    - `AA_TRUST_ACCOUNT = { name: 'AA trust account', bankAccount: '99-0100-0000001-00' }`, a named
      constant on the non-issued bank code 99, plainly fictional (as 26's bank numbers are).
    - `Booking` gains `rebookedFromBookingId?`, and 15's Booking `source` gains `'rebook'`.
    - The Xero slice gains `refunds: Record<string, XeroRefund>`, where `XeroRefund = { id;
      creditNoteId (39's Xero credit note); amount; bankAccount: 'trust'; status: 'authorised' |
      'paid'; createdAtISO; paidAtISO?; reference }`: the simulated Xero refund of a credit note, paid
      from the trust bank account.
    - `ID_FORMATS`: `xeroRefund` (`XRF`, pad 4).
11. **Pure trust account view** (`domain/billing/trustAccount.ts`, exported, with
    `trustAccount.test.ts`; US-06.5.1):
    - `trustAccountView({ pairs, receipts, disbursements, refunds })`, over `prePayment` pairs and
      refunds only:
      ```
      prepaymentsReceived = sum(receipts on prePayment pairs)
      paidOnToAnaesthetists = sum(disbursements on prePayment payable legs)
      refundsDue           = sum(refunds due or instructed)
      refundsPaid          = sum(refunds paid)
      recoveriesDue        = sum(39's pair credit.recoveryDue on prePayment pairs)
      heldInTrust          = prepaymentsReceived - paidOnToAnaesthetists - refundsPaid
      ```
      plus `movements`: one row per receipt (Pre-payment received), disbursement (Paid on to the
      anaesthetist), refund created (Refund due) and refund paid (Refund paid), each with date,
      Booking, patient id, anaesthetist, invoice or credit number and a signed amount, oldest first.
    - A negative `heldInTrust` is possible when a refund was paid for money already paid on. It is not
      hidden: the view returns `shortfall` and the screen explains it against `recoveriesDue`. That is
      OQ-42 in plain sight, and a discovery point.
    - Under the OQ-40 "held until the procedure" answer, `paidOnToAnaesthetists` only counts
      disbursements made after the List was AUTHORISED; the constant in step 3 switches it.
    - Tests: the sums from a hand-built fixture; an overpayment refund and a cancellation refund in
      one view; the shortfall case; movements ordered and signed; `heldInTrust` agrees with the ledger's
      receipts held on prepayment pairs; same input gives deep-equal output.
12. **Refund a prepayment on cancellation** (`prepaymentActions.ts` or a new `trustActions.ts`,
    exported from the store index; US-06.5.2, FT-06.5):
    - **Status.** 27's `prepaymentStatusFor` result gains `refund?: { reason; amount; status: 'toAction'
      | 'due' | 'instructed' | 'paid'; creditNumbers; recoveryDue? }`. `toAction` means the Booking
      is cancelled and has a prepayment invoice not yet credited. A cancelled Booking never alerts
      (27 already holds this).
    - **`refundPrepaymentOnCancellation(api, actor, bookingId)`**, office only:
      - refusals: `notCancelled` ("Cancel the booking first."), `noPrepayment`, `alreadyRefunded`,
        `listAuthorised` ("This booking was billed. Use credit and rebill instead.");
      - in one `mutate`: credit **every** prepayment invoice on the Booking in full through 39's credit
        builder (`creditInFull`, `cause: 'prepaymentRefund'`, `originalInvoiceId` the original
        prepayment invoice), whether it was paid, part paid or unpaid, so the patient is never chased
        for a cancelled Booking; apply it to both ledger legs with 39's `reversalPlan` and
        `applyCredit`, recording the recovery due where the payable was disbursed (OQ-42); and create
        one `TrustRefund` (`reason: 'cancellation'`, status `due`) for the `heldForPayer` (the amount
        actually received), when above zero;
      - 39's `creditAndRebill` keeps refusing a prepayment invoice (`kindNotCreditable`: a prepayment
        is credited by this refund or at authorise, never corrected and rebilled). Reword its sentence
        to "A pre-payment invoice is credited by a refund or at authorise, not by credit and rebill.";
      - `anaesthetistId` on the refund is the prepayment pair's payable anaesthetist, not the
        Booking's current one, so a Booking reassigned after its prepayment was raised still refunds
        the original invoice in full (the "whichever anaesthetist held it" AC);
      - audits `booking.prepaymentRefund` (after: credit numbers, refund amount, holder, recovery due);
        Xero credit-note mirror after commit through 39's `handoffCorrection`.
    - **`cancelBooking` with a refund.** `cancelBooking(api, actor, bookingId, reason, { refundPrepayment?:
      true })`: for an office actor with `refundPrepayment`, the cancel and the refund commit in the
      same `mutate` (the audit metas `booking.cancel` then `booking.prepaymentRefund`). Without the
      option, or for an anaesthetist or integration actor (S15), the cancel is unchanged and the
      refund reads `toAction` for the office. A cancel is never refused because of a prepayment.
    - Tests:
      - the AC: a paid prepayment, cancelled before the procedure, is refunded in full; the ledger
        credit links to the original prepayment invoice (`prepaymentSettlementFor` and the lineage);
      - the same after `reassignBooking` to Dr Beaumont: the refund names Dr Souter as holder;
      - paid and disbursed (Nair's seeded shape): credit, refund due, recovery due, ledger in balance;
      - unpaid (Riley after 27's beat): credit in full, no refund;
      - part paid: credit in full, refund of what was received;
      - an anaesthetist cancel on mobile leaves `toAction`, and the office refund then completes it;
      - an S15 integration cancel leaves `toAction`;
      - idempotency: a second refund refuses `alreadyRefunded`; the ledger never double-credits.
13. **The payout** (US-06.5.1 "payments out of the trust account are made from the system"):
    - **`recordTrustRefundPayout(api, actor, refundId, { reference })`**, office only ("Record refund
      payout"): refused unless `due`; reference required (default offered: "Refund {credit number}").
      Sets `instructed`, creates the `XeroRefund` (status `authorised`, trust bank account) against
      39's Xero credit note in the same `mutate`, audits `trustRefund.instructed`.
    - **`settleTrustRefundPayout(api, refundId)`**, the bank side, actor "Xero bank feed" (a system
      actor in `demoActors.ts`), called by the Xero sim trigger ("Pay out trust refund"): refused
      unless `instructed`; sets `paid` and `paidAtISO` from the demo clock, the `XeroRefund` to `paid`,
      and writes the money-out entry the ledger reads (`refundsPaid`); audits `trustRefund.paid`.
      Idempotent by refund id.
    - Tests: order enforced; replay is a no-op; the ledger and the trust view stay in balance at each
      step (items 7 and 11 equations); the anaesthetist's payables due never changes on a payout.
14. **Rebook with another anaesthetist** (`rebookWithAnotherAnaesthetist(api, actor, bookingId,
    targetListId)` in `cardActions.ts` or `trustActions.ts`; US-06.5.3):
    - Office only. The source must be cancelled. Refusals:
      - `refundToAction` ("Refund the original pre-payment first.") while the refund is `toAction`;
      - `sameAnaesthetist` ("Choose a different anaesthetist, or move the booking instead.");
      - `listLocked` (the target List must be DRAFT; 28's List), `pastDate` (before the demo today);
      - `alreadyRebooked`.
    - In one `mutate`, creates a new Booking on the target List through the existing Booking create
      path (`createBooking` in 15's `store/bookingActions.ts`, with its Procedures through the existing
      Procedure create path; never a second create, and not `copyBooking`, which stays on the same
      List with one empty Procedure):
      - patient, billable party and `invoiceEmail` (21), and `estimatedDurationMin` (27);
      - each non-cancelled Procedure as a skeleton: description, RVG code and chosen base units for a
        ranged code, primary flag (23); no times, modifiers, overrides or adjustments;
      - the Contract: the source Procedure's Contract when 20's filtered picker still offers it for
        the new anaesthetist and List, else 20's default for the List;
      - `source: 'rebook'`, `rebookedFromBookingId`;
      - audits `booking.rebooked` on both Bookings.
    - After commit, 27's re-check derives the requirement from the **new** anaesthetist's prepaid set.
      If it is required and the estimate is complete, `setPrepaymentAmount({ kind: 'estimate' })` runs
      as the engine at the new anaesthetist's unit value, with the default letter; under the D6 default
      that raises the fresh prepayment invoice at once. Nothing from the original prepayment is moved
      or reused. If the replacement does not take prepayment for this code, the result says so ("Dr
      Beaumont does not take pre-payment for this procedure.").
    - 17's soft blacklist warning shows in the dialog when the target List's surgeon has blacklisted
      the replacement (reuse the helper; never block).
    - A selector `prepaymentHistoryFor(state, bookingId)` walks `rebookedFromBookingId` both ways and
      returns each estimate with its anaesthetist, unit value, amount and state (refunded, current).
    - Tests: the AC (a refunded prepayment and a replacement with a different unit value: a new
      prepayment at their rate, identical units, different dollars); the original invoice untouched;
      no pre-payment when the replacement's set lacks the code; each refusal; the history both ways.
15. **Seed, session 2** (`seed/cards.ts`, `seed/billing.ts`, `cast.ts`; bump `PERSIST_VERSION` by one):
    - **The refund Booking** (`SEED_MARKERS.prepaymentRefund`): a new fictional patient with a valid
      new-format NHI from the seed's patient helpers, on a Souter DRAFT List after Fri 24 Jul that no
      scripted beat uses (check the seed map; add a List on an existing Slot only if none is free). One
      41800 Rhinoplasty Procedure on the patient-layout default Contract, `estimatedDurationMin: 90`,
      and a stored estimate computed by 27's estimator at seed time (at July values, (5 + 6 + 2) x
      $26.50 = $344.50 ex-GST, $396.18 with GST; pin what the build computes).
    - Its prepayment invoice is raised, rendered with `LT001`, **received in full and disbursed to
      Dr Souter** in the seeded payables run, so cancelling it exercises the "already paid" path. Its
      invoice number is allocated after every existing seeded invoice, so no scripted invoice number
      moves. The pair, receipt and disbursement follow 36's seeded shapes.
    - **The replacement.** Make sure Dr Beaumont's prepaid set (26) covers 41800 (add the group that
      holds it if needed) and that she has a DRAFT List on the refund Booking's date at the same
      hospital. Run 26's coherence test: if any other seeded Beaumont Booking now hits, pick a
      different colleague with a different unit value, never change a Booking's code.
    - Never change the filler generator's `rng()` draw order.
    - `seed.test`: the refund Booking reads paid and disbursed; `ledgerPosition` of the seed is still
      in balance with no checks; the trust view of the seed has no refunds and a zero shortfall; Riley
      and Nair are unchanged. Re-pin item 1's ledger totals with the reason. Update
      `seedBilling.test.ts`, `demoScenarios.test.ts` and `persistMigrate.test.ts`.
16. **Session 2 surfaces:**
    - **Cancel dialog** (`CancelBookingSheet`, all three apps through `useSurface()`;
      `data-shot="cancel-prepayment-refund"`):
      - office, with a received prepayment: a section "Pre-payment refund": "Pre-payment received ·
        $396.18 on {invoice number}. Cancelling refunds it in full to the patient from the AA trust
        account, and credits the pre-payment invoice." When a recovery will be due: "Dr Souter has
        already been paid this pre-payment. The amount to recover is shown on the trust account
        (provisional, OQ-42)." The primary button reads "Cancel and refund pre-payment";
      - office, with an unpaid invoice: "The pre-payment invoice {number} is unpaid. Cancelling
        credits it in full so the patient is not chased." Primary: "Cancel and credit pre-payment";
      - anaesthetist: one note, "The patient has paid a pre-payment of $X. The AA office refunds it in
        full from the trust account." The cancel proceeds as today;
      - the provisional label (OQ-40) under the section.
    - **Booking panel** (27's `PrepaymentPanel`) on a cancelled Booking:
      - `toAction` (office): "Pre-payment to refund" and the teal action "Refund pre-payment from trust
        account", which calls item 12's action through a short confirm;
      - `due`, `instructed`, `paid`: "Refund due · $X", "Refund payout sent · awaiting bank", "Refunded
        to the patient from the AA trust account · $X on 21 Jul", each with the credit number linking to
        39's credit-note document (`/admin/credit-notes/:creditNoteId`), and the recovery line when due;
      - the anaesthetist sees the same lines read-only (mobile and web), plus "The AA office will
        recover $X from a later payment (provisional)" when a recovery is due;
      - office, on a cancelled Booking whose refund is not `toAction`: "Rebook with another
        anaesthetist" (below);
      - the prepayment history block when `prepaymentHistoryFor` has more than one entry: "Earlier
        estimate · Dr Souter · $344.50 · refunded" and "This estimate · Dr Beaumont · $403.00"
        (`data-shot="prepayment-history"`), on both the cancelled and the new Booking. These are the
        stored estimates ex GST, labelled "ex GST"; the cancel dialog and invoices show GST inclusive.
    - **Rebook dialog** (admin Dialog, `data-shot="rebook-dialog"`): an anaesthetist select (roster
      order, the original excluded, `drSurname`), then their DRAFT Lists from the demo today (date,
      session, hospital, surgeon), defaulting to the source Booking's date; 17's warning inline; a
      preview line "New pre-payment estimate at Dr Beaumont's unit value: $403.00" from the pure
      estimator; "Rebook". On success, navigate to the new Booking.
    - **Admin trust account** (`LedgerScreen.tsx` gains a third scope; route
      `/admin/ledger/trust`, wrappers in `routes.tsx` and `router.tsx`; `data-shot="trust-account"`):
      - 36's scope Segmented becomes "Whole ledger · One anaesthetist · Trust account";
      - header note: "Provisional. The trust account process is a proposal to confirm with AA's
        financial authority (OQ-40). Money reaches the anaesthetist on the normal payment run once
        received.";
      - tiles (the Admin Review tile row): Pre-payments received, Paid on to anaesthetists, Refunds due,
        Refunds paid, and Held in trust. A shortfall shows in the error tint as "Short by $X ·
        awaiting recovery of $Y from anaesthetists (OQ-42)";
      - **Refunds card** (`data-shot="trust-refunds"`): "To action" rows (cancelled Bookings with a
        prepayment not yet credited: "Refund pre-payment from trust account"), "Due" rows ("Record
        refund payout", a Dialog with the reference, "Pay to: the patient's nominated account (bank
        details are not held in the prototype)" and "Record payout"), "Awaiting bank" rows, and paid
        rows. Each row: patient name (never the NHI), reason (Cancellation or Overpayment), holder
        surname, credit number, amount in mono, status pill;
      - **Movements table** from `trustAccountView`, with a totals row;
      - 36's footnote about receipts held changes to point here ("Pre-payment money and refunds are
        shown on the trust account.");
      - 36's Ledger nav badge adds refunds to action and refunds due.
    - **Reassign List advisory** (`ReassignListFlow.tsx`, OQ-40 bullet 3): when the List holds
      Bookings with a received prepayment, the confirm step adds a neutral note: "2 bookings on this
      List have paid pre-payments under Dr Souter. Reassigning does not refund them. Whether it should
      is to confirm with AA (OQ-40)." No money moves.
    - Audit labels: `booking.prepaymentRefund` "Pre-payment refunded from trust account",
      `trustRefund.instructed` "Refund payout recorded", `trustRefund.paid` "Refund paid from trust
      account", `booking.rebooked` "Rebooked with another anaesthetist"; entity type `trustRefund` in the
      Audit viewer filter.
17. **Xero simulation** (`DemoXero.tsx`, `xeroPairView.ts`): on 39's credit-note panel in the pair
    detail, a "Refund from trust account" row per `XeroRefund`: amount (mono), bank account "AA trust
    account", reference, status ("Authorised · awaiting payment" or "Paid 21 Jul")
    (`data-shot="xero-trust-refund"`). `xeroPairView` gains the refunds; update `xeroPairView.test.ts`
    and `DemoXero.test.tsx`. No NHI anywhere (convention 8).
18. **Demo triggers** (the registry in `src/shared/demoTriggers/registry.ts`; bodies in `src/store` or
    `src/shared`, so `pwaPurity` holds). See "Demo triggers" below. Registry tests:
    - route visibility per entry, and the PWA entries on `pwa` only;
    - every disabled reason;
    - "Pay out trust refund" settles exactly one refund and is then disabled for it;
    - the PWA refund stand-in ends with the refund paid and the ledger in balance;
    - the PWA reminder stand-in appends exactly one reminder.
    Never add anything to the Control Panel page. Update the Control Panel S4 scenario text
    (`DemoControlPanel.tsx`) for the new beats.
19. **Shots, recipes and the demo guide:**
    - Extend `visual/admin-prepayment-followup.spec.ts`: the cancel dialog, the trust account (before
      and after a payout, and the shortfall), the rebook dialog, the prepayment history. Update
      `xero-pair.spec.ts` (the refund row) and 36's `admin-ledger.spec.ts` (the third scope). Add a
      mobile shot of a refunded cancelled Booking and a PWA shot of each stand-in.
    - Run
      `node requirements-board/scripts/capture.ts --only US-02.5.3,US-06.4.1,US-06.4.2 --dry`
      and record which recipes break or can now show real shots. Note that US-06.3.6 and US-06.5.1 to
      US-06.5.3 have no recipe. Do not edit catalogue files or add recipes.
    - Patch the demo guide (below).
    - Run `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots`, all green.

## Demo triggers

Harness bar (framed build):

| Label | Screen | Surface | Effect |
|---|---|---|---|
| Stage overpaid prepayment (`stage-overpaid-prepayment`) | Admin · Review (`/admin/review/:listId`) | bar | For a SUBMITTED List. `choices` are its Bookings with a received prepayment. As `OFFICE_ACTOR`, it shortens the prepaid Procedure's recorded anaesthetic time to `STAGE_OVERPAID_DURATION_MIN` (30 minutes, a named constant) through the guarded `editProcedure` (or 35's save path, if admin edits now commit through a change set), so the Review fee drops below the prepaid amount ("surgery was quicker than estimated"). The message names the prepaid amount, the new final and the credit Authorise will raise. Disabled with "Submit this List first", "No paid pre-payment on this List", "Already below the pre-paid amount", or "Shortening the time cannot bring the fee below the pre-paid amount". Authorise then shows the credit |
| Pay out trust refund (`pay-out-trust-refund`) | Xero sim (`/demo/xero`, `/demo/xero/invoices`, `/demo/xero/invoices/:accRecId`) | bar | The bank pays an instructed refund from the trust account. `choices` are the instructed refunds (on a pair detail, only those on that ACCREC's credit notes). Calls `settleTrustRefundPayout`: the Xero refund reads Paid, the trust account moves it from Refunds due to Refunds paid, and the Booking panel reads "Refunded to the patient". Disabled with "No refund payout recorded yet. Record it on the Admin trust account first." |

Product actions (in the product UI, not the bar, unbadged):

| Label | Screen | Effect |
|---|---|---|
| Letter picker and Preview letter | Set pre-payment sheet (or the D6 office raise dialog) | Chooses and previews the letter that goes out with the prepayment invoice |
| Send pre-payment reminder | Admin · Booking detail (`/admin/day/:dateISO/bookings/:bookingId`) | `sendPrepaymentReminder`; the panel and rail row show "Reminder sent" |
| Cancel and refund pre-payment / Refund pre-payment from trust account | Admin cancel dialog; the Booking panel and the trust account's "To action" rows | `cancelBooking({ refundPrepayment: true })` or `refundPrepaymentOnCancellation`: credit in full, refund due |
| Record refund payout | Admin · Trust account (`/admin/ledger/trust`) | `recordTrustRefundPayout`: instructed, a Xero refund awaiting payment |
| Rebook with another anaesthetist | Admin · Booking detail of a cancelled Booking | `rebookWithAnotherAnaesthetist`: a new Booking and a fresh prepayment at the replacement's unit value |
| New template, Edit, Make default, Deactivate | Admin · Master data · Pre-payment letters | Template maintenance |

PWA equivalents (the mobile Booking waits on the office; route
`/mobile/lists/:listId/bookings/:bookingId`):

| Label | Surface | Effect |
|---|---|---|
| Office sends a pre-payment reminder (`pwa-office-sends-prepayment-reminder`) | PWA only (`surfaces: ['pwa']`), badge office stand-in | While the status is unpaid or part paid: `sendPrepaymentReminder(OFFICE_SIMULATION_ACTOR, bookingId)` with the default reminder. The panel shows "Reminder sent by the AA office". Disabled with "No unpaid pre-payment on this booking" or "No invoice email for the payer" |
| Office refunds this pre-payment from the trust account (`pwa-office-refunds-prepayment`) | PWA only (`surfaces: ['pwa']`), badge office stand-in | After Dr Souter cancels a prepaid Booking on the handset: `refundAndPayOutAsSimulatedOffice(api, bookingId)` (new, in 14's `officeStandIn.ts`) runs item 12's refund and item 13's record and settle as `OFFICE_SIMULATION_ACTOR` and the "Xero bank feed" actor, three audited commits in order. The panel reads "Refunded to the patient from the AA trust account", with the recovery line. Disabled with "Cancel the booking first" or "Nothing to refund" |

No PWA entry for the overpaid credit (the handset beat waits on nothing once the List is authorised;
27's and 14's stand-ins already authorise) or the rebook (the replacement is not the handset persona).

## Out of scope

- Settling a recovery from an anaesthetist (offsetting it in a later payables run, a remainder carried
  forward, the anaesthetist's statement lines), unless Phase 39 built it (OQ-42). This phase shows the
  amount due only.
- Real bank details for patients, a bank-feed match for refunds, and any trust-account reconciliation
  beyond the derived view. The trust account is not a general ledger.
- Refund or re-prepay on List reassignment (OQ-40 bullet 3): an advisory only.
- Credit on account or write-off of an excess (OQ-03 alternatives), unless OQ-03 is answered that way.
- Letter templates for anything but prepayment requests and reminders; rich text, attachments,
  per-anaesthetist letters, and an outbox. Phase 35's mailto update email stays separate.
- Automatic or scheduled reminders. The reminder is an office action; 27's alert stays the control.
- Voiding a prepayment invoice whose amount changed before the procedure (27 settles the difference on
  the balance invoice; a correction is 39's credit and rebill).
- A prepayment raised but no longer needed on a live Booking (27's `notNeeded`): the balance run at
  authorise deducts it, and if that makes the group negative, item 7's credit handles it. No separate
  refund action.
- Patient-screen views of credits and refunds beyond what Phase 40's patient position already reads
  from the ledger.

## Manual test checklist

- [ ] Reset. Master data, Pre-payment letters: three templates, one default per kind. Edit
      "Cosmetic procedure pre-payment", insert `{{patient}}`: refused "unknown merge field". Remove
      `{{estimate}}`: refused. The preview always ends with the fixed estimate notice.
- [ ] S4 Beat 1 as 27 left it (Riley): "Set pre-payment", pick "Cosmetic procedure pre-payment", open
      "Preview letter" (patient name, Rhinoplasty, Fri 24 Jul, the estimate, Dr Melanie Souter, no
      NHI). Save. The invoice document shows the letter as a cover section and the rail names it.
- [ ] Edit that template's body. Riley's invoice letter is unchanged.
- [ ] "Send pre-payment reminder" on Riley: the reminder names the amount outstanding; after
      "Payment received · half" a second reminder names the smaller amount. The panel, the rail row and
      the mobile Booking show "Reminder sent". The audit shows `invoice.prepaymentReminder`, and
      Riley's patient record (Phase 40) shows the reminder in its follow-up log.
- [ ] Overpaid: complete and submit Souter Fri 24 PM (Nair), open it in Review, "Stage overpaid
      prepayment". The Review fee falls below the prepaid amount and the flag reads "credit of $X at
      authorise". Authorise: no negative invoice; a credit note against INV0001 with its lineage; the
      septoplasty's hospital invoice bills normally; the panel reads "credited", "Refund due" and "To
      recover from Dr Souter" (INV0001 was disbursed on 16 Jul). The Ledger stays in balance.
- [ ] The item 7 grep is empty; no "Credit handled in a later release" anywhere.
- [ ] Cancel: open the refund Booking in Admin, Cancel. The dialog shows "Pre-payment received ·
      $396.18" and the already-paid note. "Cancel and refund pre-payment": a credit in full against the
      prepayment invoice, Refund due $396.18, recovery due from Dr Souter. The credit number opens
      the credit-note document, which names the original prepayment invoice. Ledger in balance.
      Credit and rebill on that prepayment invoice is still refused, with the reworded sentence.
- [ ] Trust account (`/admin/ledger/trust`): tiles, the refund in "Due", the movements. "Record refund
      payout" with the default reference: "Awaiting bank". The Xero sim pair shows the refund row
      "Authorised · awaiting payment". "Pay out trust refund": Paid. Back on the trust account the
      refund is paid and "Short by $X · awaiting recovery" explains the shortfall. Ledger in balance.
- [ ] Rebook: on the cancelled Booking, "Rebook with another anaesthetist", Dr Beaumont, her List on
      the same date. The preview says $403.00 at July values. Rebook: the new Booking has a fresh
      prepayment invoice at Dr Beaumont's unit value with the default letter; the original invoice is
      untouched; both Bookings show the two estimates.
- [ ] Rebook refusals: before refunding (`toAction`), and choosing Dr Souter again.
- [ ] Unpaid path: reset, set Riley's pre-payment (invoice raised, nothing paid), then cancel Riley as
      the office: "Cancel and credit pre-payment"; credit in full, no refund, nothing to pay out.
- [ ] Anaesthetist path: reset, then on mobile cancel the refund Booking as Dr Souter: the sheet notes
      the office refunds it; the Booking reads "Pre-payment to refund" for the office, appears under
      "To action" on the trust account, and the Ledger badge counts it. "Refund pre-payment from trust
      account" there completes it.
- [ ] Reassign Souter's List holding a paid prepaid Booking: the confirm step shows the OQ-40 advisory
      and no money moves.
- [ ] Every new surface carries its OQ label (OQ-03 on the excess credit, OQ-40 on the trust account
      and cancel section, OQ-42 on recoveries).
- [ ] S3, S4 Beats 3 and 5, and 39's credit-and-rebill figures are unchanged (item 1).
- [ ] PWA build, the refund Booking on the handset: cancel it, open the demo-actions sheet, "Office
      refunds this pre-payment from the trust account" (office stand-in badge): the panel reads
      "Refunded to the patient". On Riley: "Office sends a pre-payment reminder". Bottom sheets, teal
      actions, no crimson.
- [ ] Teal is the only action colour, crimson only in the nav, amounts and numbers in mono with
      tabular-nums, no NHI in letters or the Xero sim, and no en or em dashes in any new copy or
      seeded template.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots` are all green.

## Demo guide updates

Patch these in the same session, in `docs/demo-guide/` and the matching sections of
`master-demo-guide.html` (S4 and the cheat-sheet "Pre-payment" card, as Phases 27 and 39 left them;
about 913 to 938 and 1102 in July):

- `03-demo-script.md` **S4 Beat 1** (27's "Pre-payment from the prepaid list"): add to Click "pick the
  Cosmetic procedure pre-payment letter and preview it" before Save, and to Say "The letter always
  words it as an estimate, because the final fee may be higher or lower."
- **S4 new Beat 7, "Follow up, refund and rebook"** (after 27's Beat 6; check the numbering 39 left):
  - **Click:**
    - Riley: "Send pre-payment reminder".
    - The refund Booking: Cancel, "Cancel and refund pre-payment".
    - Admin, Ledger, Trust account: the refund due; "Record refund payout".
    - Xero sim, the pair: Demo actions, "Pay out trust refund".
    - Back on the cancelled Booking: "Rebook with another anaesthetist", Dr Beaumont.
  - **Say:** "A cancelled pre-paid booking is always refunded in full, centrally, from AA's trust
    account, whoever held it and even if the anaesthetist was already paid. The refund is a credit
    against the original invoice, so the trail stays visible. The replacement starts a fresh
    pre-payment at her own rate, so the patient may see two estimates. This is Greg's proposal, and
    how the money moves is still to confirm with AA."
  - **Expected:** credit in full, refund due, instructed, paid; the shortfall and recovery line; the
    new Booking with its own estimate; both estimates visible.
- **S4 new Beat 8 (optional), "Pre-paid more than the final fee"**: Stage it (complete and submit
  Souter Fri 24 PM), Review, "Stage overpaid prepayment", Authorise; Say "When the procedure comes in
  under the estimate, the engine credits the difference against the pre-payment and the refund goes
  through the same trust account path."
- S4 "Discovery points": add OQ-03 (refund, credit on account or write off), OQ-40 (the trust account
  process and when money leaves it), and OQ-42 (recovering money already paid to the anaesthetist,
  shown by the shortfall).
- `04-presenter-cheat-sheet.md` section 8 "Pre-payment" (27's rewrite): add letters and reminders, the
  overpayment credit, the trust account, refund on cancellation and the replacement's fresh
  prepayment, each marked Proposed or Open. "Prototype readiness" moves these from "Still upcoming" to
  "Built and clickable", with the provisional caveat.
- `02-workflows-and-handoffs.md`: Workflow 2 steps 6 and 7 (cancellation) add "a paid pre-payment is
  refunded in full from the trust account"; Workflow 8 "Pre-payment" case adds letters, the credit and
  the refund.
- `01-personas-and-responsibilities.md`: the office persona "maintains the pre-payment letters, sends
  reminders, and handles pre-payment refunds from the trust account".
- `docs/demo-guide/README.md` status row and the master guide's status table: "Pre-payment letters,
  credits, trust account refunds and rebook (provisional)".
- The Control Panel S4 scenario text (item 18).
- This is not a milestone phase. Still reread the S4 section of `master-demo-guide.html` against the
  edited Markdown so beat numbers, figures and trigger labels agree.

## Adversarial review (after build)

After the manual test checklist and the four commands are green, and before writing the PROGRESS
entry, run the standard adversarial review-and-fix pass (PROGRESS convention 18). Fan out independent
Opus review subagents: quality, bugs/correctness and plan adherence, plus a fourth, money lens,
because this phase moves money out of AA. Then this session verifies every finding against the
catalogue, this plan and the code, fixes the confirmed ones (with a test where a bug had none),
re-greens, and records the pass. Do not re-raise anything settled in the Decisions log except the
readings this phase explicitly supersedes.

**Steer this phase's reviewers at:**

- **Money conservation.**
  - The ledger equation (item 7) holds to the cent after every step of cases A to D, a cancellation
    refund, a payout and a rebook.
  - A refund never exceeds what was received; a credit never exceeds what was invoiced.
  - The excess credits sum exactly to the excess plus its GST.
  - The locked price (25) is never altered; no negative invoice is ever raised.
  - A negative group without a prepayment line still fails with `negativeTotal`.
  - The trust view's "held in trust" agrees with the ledger's prepayment receipts.
- **One credit path.** Every credit goes through 39's builder, its ledger credit entry and its Xero
  mirror. No second credit note type, no hand-built reversal, no copy of the payable reversal.
- **Traceability.** Every credit and refund links to the original prepayment invoice
  (`prepaymentSettlementFor`, the lineage, the Ledger row, the invoice document). The balance invoice
  still names its prepayment. The refund holder is the payable anaesthetist, whoever holds the Booking
  now.
- **Refund rules.** Always in full on cancellation; paid, part-paid and unpaid invoices all credited;
  office only; refused on an AUTHORISED List; idempotent. A cancel is never refused because of a
  prepayment; the anaesthetist and integration paths leave `toAction`.
- **Rebook rules.** Nothing is transferred between anaesthetists. The fresh prepayment is derived from
  the replacement's prepaid set and priced at their unit value by 27's estimator; identical units,
  different dollars. The Booking create path is reused, not copied.
- **Letters.** Every letter carries the fixed estimate notice; no NHI in any letter; the snapshot is
  immutable after a template edit; merge fields validate; names come from `shared/format.ts`.
- **Provisional labels.** OQ-03, OQ-40 and OQ-42 labels show wherever their interim decides behaviour,
  and nothing claims a settled process. No gold-plating: no recovery settlement, bank matching,
  scheduled reminders or rich-text letters.
- **Rights, audit and determinism.** Every action audits before and after through `mutate()`, with the
  right actor (office, "Billing run", "Xero bank feed", the simulated office). Clock from state only; no
  `Date.now()`, `new Date()` or `Math.random()`. Seed determinism and the filler `rng()` order are
  unchanged, and `PERSIST_VERSION` is bumped once per session that changed the seed.
- **Triggers and PWA.** Each entry shows only on its routes and surface; the stand-ins are badged; the
  bodies live in `src/store` or `src/shared`; `pwaPurity` passes.
- **Design.** Teal the only action colour, crimson never on the new surfaces, tints from the tokens,
  mono with tabular-nums for money and numbers, no en or em dashes in any copy or seeded template.

## PROGRESS.md updates

- Status row for catch-up Phase 41, and a phase entry covering:
  - the drift-check result, the OQ-03, OQ-40 and OQ-42 states and the interims built;
  - how D6 was built in 27 and where the letter picker landed;
  - what 27, 36 and 39 were found to provide, and how 39's builder was extended (`settlementCredit`, the partial `reversalPlan`, the wider `cause`);
  - the session 1 and session 2 split and the adversarial pass;
  - the tests added (letter renderer, template actions, reminder, settlement maths, the ledger
    equation cases A to D, refund, payout, trust view, rebook, triggers, parity);
  - `PERSIST_VERSION` old to new (each bump);
  - the re-pinned ledger totals after item 15, and the refund Booking's and the rebook's figures;
  - the capture recipes checked, and the missing recipes for US-06.3.6 and US-06.5.x, for the owner.
- Decisions log:
  - **Superseded:**
    - Phase 27's interim prepaid-above-final excess flag ("Credit handled in a later release") and
      36's `creditDuePending` tile, replaced by the settlement credit.
    - The Phase 08 run's `negativeTotal` belt now applies only to a group without a prepayment
      deduction line (27 began this; recorded here as closed).
  - **Extended, not superseded:** the 7th review B23 audited soft-cancel stands (a cancelled Booking is
    retained, visible and excluded from billing); cancelling a prepaid Booking now also settles its
    prepayment money.
  - **New provisional readings:**
    - A settlement credit for a prepaid-above-final excess is not a correction, so US-08.6.2's "credit
      in full" and Phase 39's "no partial credits" do not apply to it (OQ-03). 39's builder gained an
      amount (`settlementCredit`, a partial `reversalPlan`) and a wider `cause`; corrections still
      credit in full, and `creditAndRebill` still refuses prepayment invoices.
    - An excess or a cancellation refunds only money actually received; unpaid prepayment invoices are
      credited, not refunded.
    - The trust account is a derived view over prepayment pairs and refund records; prepayment money
      reaches the anaesthetist on the normal run once received (`PREPAYMENT_RELEASE_TIMING`, OQ-40).
    - A refund's holder is the prepayment's payable anaesthetist; a recovery already paid out is shown,
      not settled (OQ-42).
    - The payout is two steps: recorded in the system, then paid by the bank (the Xero sim trigger).
    - Rebooking creates a new Booking; the fresh prepayment is derived and estimated for the
      replacement, and nothing moves between anaesthetists. List reassignment shows an advisory only.
    - Letters are plain-text templates with a fixed, non-removable estimate notice, snapshotted on the
      invoice; reminders are office actions, never scheduled.
