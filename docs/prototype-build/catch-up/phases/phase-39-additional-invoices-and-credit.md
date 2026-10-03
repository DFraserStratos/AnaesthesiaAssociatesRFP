# Phase 39 · Credit notes, credit-and-rebill and the combined split

**Requirements covered:**
[FT-08.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-08.6.md) Billing after AUTHORISED (Verify; this phase closes it: the credit half, after 38b built the events and the additional invoice; the anaesthetist's post-op event route is FT-03.7, Phase 39b) ·
[US-08.6.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.6.2.md) Credit note and re-issue (Verify) ·
[US-08.6.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.6.4.md) Split a combined Procedure into additional invoices (Verify; rewritten 2026-10-02: a split after invoicing is a credit, then one additional invoice per component) ·
[US-08.6.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.6.5.md) Credit note option on additional invoices (Verify; new 2026-10-02) ·
[US-08.6.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.6.6.md) Start a rebill from a copy of the original lines (Proposed; new 2026-10-02) ·
[US-13.5.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.5.2.md) Audit trail of all actions (Confirmed; Partial only because credit notes are not audited, as none exist) ·
[DM-24](../analysis/domain-model-delta.md#dm-24) A wrong invoice is credited in full, then rebilled (credit note to any party, payable reversal, new invoice), recorded as events ·
[DM-45](../analysis/domain-model-delta.md#dm-45) Audit covers invoices and credit notes, not disbursements, payments or receipts.
**Moved to Phase 38b** (no longer built here): DM-17 (the event element and its review step), DM-18,
RV-10, US-08.6.1 and US-08.6.3 (the free-form admin additional invoice and the removal of the post-op
addendum Booking). This phase builds on all of them.
Read alongside (not closed here):
[US-08.6.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.6.3.md) and
[US-08.6.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.6.1.md) (the additional invoice: Phase 38b),
[FT-03.7](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-03.7.md) and
[US-03.7.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.7.3.md) (events on a Procedure and the Procedure's events list: 38b; a credit is an event kind),
[US-07.3.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-07.3.2.md) (the Booking is immutable after AUTHORISED; nothing here may change it),
[US-08.3.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.3.1.md) (the receivable and payable pair; Phase 36 made it the ledger's record),
[US-08.4.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.4.3.md) (unique invoice numbers, the `-P` payable suffix),
[US-09.1.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-09.1.1.md) (the Xero ACCREC and ACCPAY pair the credit reverses),
[US-04.2.11](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.11.md) (combination Contracts; Phase 23 built them; its note now points at this phase's split),
[US-10.2.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-10.2.5.md) (negative invoices netted in the payment run, now Confirmed: Phase 39a nets what this phase raises),
[DM-25](../analysis/domain-model-delta.md#dm-25) (negative invoice and remittance: 39a),
[FT-13.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-13.5.md) (roles and audit; Matches, kept on built Phase 14),
[US-06.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.4.1.md) (the balance invoice after a prepayment is NOT an additional invoice; Phase 41),
[OQ-19](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-19.md) (Answered: an AA-side error is credited and reissued),
[OQ-28](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-28.md) (Answered: the credit policy),
[OQ-42](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-42.md) (Answered: credit note plus negative invoice),
[OQ-45](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-45.md) (Answered, D10: free form),
[OQ-53](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-53.md) (Answered: a combination is a Contract under each parent procedure),
[OQ-63](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-63.md) (Answered, D13: additional invoices and credits are events, one review step),
[OQ-71](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-71.md) (Answered, D21: a negative with no later payment is handled outside the system),
[OQ-72](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-72.md) (Answered, D22: description, any billable party, a credit note option then new additional invoices),
[OQ-77](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-77.md) (Open, with a recommendation: the rebill total, whether the credit reverses the payable, a split before the invoice is sent),
[OQ-60](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-60.md) (Open: what the AA fee's per-BCTI charge counts), and the
"What changed since the RFP" rows, the Booking section and the "Internal ledger" section of
[domain-model.md](../../../discovery-reference/Updated%20Requirements/domain-model.md).
**Depends on:** 23 (combination Contracts: `Contract.isCombination`, `combinationParts`, and the
seeded "Southern Cross cosmetic combination" Contract no Booking uses yet) and 38b (the event element
on a Procedure, its one standard review step and next-run invoicing, the Procedure's events list in
all three apps, and the free-form admin additional invoice with its lines editor, party field and
sheet; a credit is a new event kind on that element, and every rebill or split component is a 38b
additional invoice). Through 38b, 36 (the internal ledger: a linked receivable and payable per
invoice, the whole and per-anaesthetist positions, the imbalance indicator) has run. By the roadmap
order 14 (the demo-trigger registry, the payment entries, the shared actors), 15 (Booking vocabulary
and routes), 16 (`invoiceNumber` and `reference` on both Xero records, the `-P` rule, the BCTI count:
`bctiRecords` and `bctisFor`), 21 (the Contract-defined billable party, the invoice email, required
inputs), 22 (`procedureIds`, `lineage`, `delivery`, `materialiseInvoices`, the payment setting), 25
(the `BookingLock`, the payee, "Regenerate from locked data") and 27 (prepayment and balance
invoices) have also run. 37 and 38 may run before or after this phase. 39a (netting) runs after it;
40 (a patient credit balance) and 41 (prepayment credits and refunds) reuse its credit notes.
**Estimated:** 2 sessions. Session 1 is the credit note option and credit in full and rebill, with
the ledger and Xero reversal and the negative invoice, ending at a green stop point (work items 1 to
8). Session 2 is the rebill draft from a copy of the original's lines, the combined split, the ledger
and simulator views, the staged triggers, tests and docs (work items 9 to 15).

## Goal

Once a List is authorised and invoiced, Phase 38b lets the office add a free-form additional invoice
to a Procedure, recorded as an event. This phase gives the office the credit tools beside it, so a
wrong or unwanted invoice is fixed without ever editing it or unlocking the Booking (FT-08.6,
US-07.3.2). OQ-72 is answered (D22) and OQ-63 makes a credit an event (D13), so these are built as
the answer:

- **The credit note option** (US-08.6.5). From the Procedure's additional-invoice area (38b) and the
  Admin invoice document, **Credit note** credits the original invoice in full to the party the admin
  picks, the original billable party included, with a reason. In the same sheet the admin adds the
  new additional invoices that replace it (zero or more, each 38b's free-form lines and party). A
  credit note is not a refund ("One's cash, one's not"): no money moves, and a resulting refund
  happens outside the system.
- **Credit in full and rebill** (US-08.6.2, DM-24, OQ-19: an AA-side error is credited and reissued).
  The same flow with one replacement prefilled. In session 2 that replacement is a **draft additional
  invoice holding a copy of the original's lines** and its reference values, such as the PO number
  (US-08.6.6), so the admin corrects what was wrong instead of retyping it. The rebill gets a new
  number, linked to the original.
- **Recorded as events, through the one review step.** The credit and its replacements are events on
  the Procedure (OQ-63), shown in the Procedure's events list in all three apps (38b's list, US-03.7.3).
  They go through 38b's standard review step together as one correction and are issued together by
  the next run, so the ledger and Xero reverse and re-create in step (US-08.6.2 "Both sides move").
- **The money is reversed on both sides.** On issue: a **credit note** for the whole amount against
  the receivable, sent to the chosen party by the engine (Xero raises credit notes but does not send
  them); the linked payable reversed by a **negative invoice to the anaesthetist** (OQ-42; never
  called a BCTI credit); the **Xero ACCREC and ACCPAY reversed and the new pairs created together**.
  The trail reads debit, credit, contra, new debit. When the anaesthetist has already been paid, the
  paid-out part stays on the negative invoice to net in their next payment run (Phase 39a); a case
  with no later payment to net against is handled outside the system (OQ-71, D21: nothing is built).
- **A combined Procedure can be split** (US-08.6.4, OQ-53). On a Procedure on a combination Contract
  (Phase 23), **Split into additional invoices** is the same credit flow with one replacement per
  component prefilled from `combinationParts`, each with its own party and amount, **no forced
  total** against the bundle price.
- **Credit notes are audited** (US-13.5.2, DM-45): every step of a correction is its own audit entry
  with `entityType` `creditNote` where it concerns the credit note, so the Audit viewer filters to
  them. The existing money-event audit (receipts, payables, disbursements) stays in place, harmless in
  a prototype; the policy point (Greg: those are done in Xero) is logged for the owner.

OQ-77 is still open, so its recommendation is built and labelled provisional in one constant,
`CREDIT_RULES`: no forced total on the replacements, the credit reverses the linked payable, and one
credit-and-rebill flow also when a split is asked for before the combined invoice is sent.

The original invoice is never written: "Credited" and every link are derived. The state gains credit
notes, negative invoices, Xero credit notes and a credit event kind, so `PERSIST_VERSION` is bumped.
No seeded figure moves. FT-08.6 closes here.

## Before you start: drift check

1. Run the drift check against the plan's catalogue snapshot:

   ```
   git diff 3d3a18c -- "docs/discovery-reference/Updated Requirements/catalogue" "docs/discovery-reference/Updated Requirements/domain-model.md"
   ```

   Read the diff for FT-08.6, US-08.6.2, US-08.6.4, US-08.6.5, US-08.6.6, US-13.5.2, the context
   items US-08.6.1, US-08.6.3, FT-03.7, US-03.7.3, US-07.3.2, US-08.3.1, US-08.4.3, US-09.1.1,
   US-04.2.11, US-10.2.5, US-06.4.1, and OQ-19, OQ-28, OQ-42, OQ-45, OQ-53, OQ-60, OQ-63, OQ-71,
   OQ-72, OQ-77. If an item changed, re-read it and adjust the work items. If an item is now Retired
   or Future, drop its work items and record that in the PROGRESS entry. At plan time (`3d3a18c`)
   FT-08.6, US-08.6.2, US-08.6.4 and US-08.6.5 were **Verify**, US-08.6.6 **Proposed**, US-13.5.2
   **Confirmed**.
2. **Answered, build the answer, no provisional label.**
   - **OQ-72 (D22):** "Desc" is description; an additional invoice can go to any billable party (38b
     built both); the credit note option credits the original to any party, the original billable
     party included, then new additional invoices are raised. Built here.
   - **OQ-63 (D13):** a credit is an event on the Procedure, its own element beside 38b's
     additional-invoice events, through the same standard review step; raised after the Procedure's
     invoice is approved, it is issued in the next run.
   - **OQ-42:** the payable is reversed by a negative invoice to the anaesthetist, netted in their
     next payment run and shown on the remittance advice (39a nets it and shows it).
   - **OQ-19:** an AA-side error is credited and reissued; otherwise the invoice stays outstanding (no
     fallback to the patient).
   - **OQ-53:** a combination is a Contract under each of its parent procedures (built by 23).
   - **OQ-71 (D21):** a negative with no later payment is settled outside the system. Nothing is built:
     no carry-forward, no recovery invoice. This phase only leaves the paid-out part on the negative
     invoice as "to net".
   - **OQ-45 (D10):** every replacement is a free-form additional invoice (38b's pricing), with no
     Contract pricing, unit rules or anaesthetist adjustment.
3. **Open questions, built as their recommendation and labelled provisional in one place.**
   - **OQ-77** (the rebill total, the payable reversal, the before-sending case). Recommendation: (1)
     no forced total, because a bundle can carry a discount; (2) yes, the credit reverses the linked
     payable, as a full credit and rebill does; (3) one flow: the same credit and rebill is offered as
     soon as the combined invoice exists, sent or not. One constant, `CREDIT_RULES` in
     `domain/billing/creditNote.ts` (`{ forceReplacementTotal: false; reversesPayable: true;
     sameFlowBeforeSend: true }`), commented "OQ-77 recommendation, provisional". The split sheet's
     total row and the credit sheet's negative-invoice line show a small neutral "Provisional · to
     confirm with AA" chip. If AA answers "must come to the same amount", `forceReplacementTotal`
     turns on a refusal in the pure module only.
   - **OQ-60** (what the per-BCTI charge counts). 16's rule stands (each BCTI once against the
     anaesthetist who did it, and the paid-only switch Greg favoured on 2026-10-02). This phase decides
     only what its new records are, inside 16's `bctiRecords`: each replacement's ACCPAY is a BCTI
     record (it is a 38b additional invoice, so 38b's feed already counts it); a credit note and a
     negative invoice are not (the catalogue: "not called a BCTI credit"); a credited original keeps
     its record, because it was issued. Comment it "OQ-60, provisional" beside `bctiRecords`; no UI
     chip.
   - **Labelled readings, not OQs** (in the code comment and the PROGRESS entry, no chip):
     - *Who may credit* (US-08.6.2: "who may action it ... remain to work through"): office only.
     - *A credit to another party*: the ledger credits the original receivable in full whoever the
       party is; the chosen party is the credit note's addressee and its delivery. In the Xero sim the
       ACCRECCREDIT is allocated against the original ACCREC either way (the sim does not model a
       contact mismatch). The practical tooling is "partly a question for Vanessa" (US-08.6.5 note).
     - *The credit note's delivery* (US-08.6.2: "the mechanism is to be designed"): the engine sends
       it through Phase 22's delivery plan exactly as it sends an invoice, badged "Simulated send",
       with the caption "Xero does not send credit notes; the engine sends it".
     - *The rebill's basis* (the question Phase 25's handoff left): a rebill is a 38b additional
       invoice with its own stored basis (the copied or typed lines, the party, the reference
       values). The Booking's lock is never rewritten and no new Booking lock is made; the rebill's
       payable goes to the Procedure's locked payee. Re-pricing a rebill from a corrected Contract is
       not built: the admin edits the copied lines (US-08.6.6).
4. **Prerequisite names.** Confirm Phases 23, 36 and 38b (and 14 to 38) are DONE in PROGRESS.md and
   read their handoff notes. Note the exact current names of:
   - from **38b** (planned names in its doc; use the names the code has): the event record
     `ProcedureEvent` (`kind`, `procedureId`, `EventParty` "same as" or a named party, the review
     state, `invoiceId`), `ProcedureEventKind`, the `ProcedureEventDetail` union (`{ kind:
     'additionalInvoice'; lines: FreeFormLine[] }`), `FreeFormLine = { description; quantity;
     unitAmount }` (ex GST), `EVENT_KINDS` (`addedBy`, `tick`, `reviewed`, `mayBundle`,
     `needsInvoicedProcedure`), the copy map `src/shared/procedureEventCopy.ts` (`EVENT_KIND_LABEL`,
     `EVENT_STATUS_LABEL`: the one place the "event" words live), the store actions in
     `store/procedureEventActions.ts` (`addProcedureEvent`, `updateProcedureEvent`,
     `removeProcedureEvent`, `approveProcedureEvent`, `declineProcedureEvent` with its reason, and
     `runEventInvoicing`, the next run, one `mutate()` then `handoffPair` for each new pair), the
     review queue (Admin Review's Events tab, `/admin/review?tab=events`, and `EventReviewSheet`),
     `ProcedureEventsList` on every Procedure, `priceFreeFormInvoice(lines, { gstTreatment })` in
     `domain/billing/additionalInvoice.ts` (it refuses a zero or negative unit amount),
     `liveInvoiceForProcedure` and the other derived selectors (`additionalInvoicesFor`,
     `originalInvoiceFor`, `eventForInvoice`), the `Invoice.kind` `'additional'`, the `additionalTo`
     lineage role and `Invoice.eventId`, the lines editor and party field components inside
     `AdditionalInvoiceSheet`, its `data-shot` hooks (`additional-invoice-button`,
     `additional-invoice-sheet`, `procedure-events`, `admin-events-queue`, `event-review-sheet`), and
     the `stage-post-op` and `run-next-billing-run` triggers and their result copy;
   - from **36**: `LedgerPair` (a union on `kind`: `'procedure' | 'prePayment'` Booking pairs and
     `'aaFee'`), `ReceivableLeg` and `PayableLeg` (`releasedAmount`, `disbursedAmount`), the pure
     module `domain/billing/ledger.ts` (`newBookingPair`, `applyReceipt`, `applyDisbursement`,
     `pairStatusLabel`, `ledgerChecks`, `ledgerPosition` and its `imbalance = receiptsHeld -
     payablesDue` equation, `anaesthetistPosition`), the selectors `ledgerPositionOf` and
     `anaesthetistLedgerPosition`, the store's `applyReceiptInto`, `LedgerScreen`, `handoffPair(api,
     pairId)` with the fault on `pair.handoffFailure`, `retryBillingException`, the monitor's
     `resolveAndRetry`, `LedgerReceipt`, and `payablesDue` reading the payable legs. At `3d3a18c` the
     code still has `BillingCase`, `handoffCase` and `retryBillingCase`: 36 renamed or deleted them.
     36 left the legs' amounts signed and able to take a credit but added no credit path: this phase
     adds it (work item 3);
   - from **23**: `Contract.isCombination`, `combinationParts(contract, masters)`, and the seeded
     "Southern Cross cosmetic combination" Contract (holder code `SX-COMBO-ABL`, three parents:
     abdominoplasty 31340, breast lift, liposuction; the Booking records only the Contract);
   - from **25**: `BookingLock`, the locked payee, `regenerateInvoiceFromLock` and the
     `regenerate-invoice` trigger (38b extended it to additional invoices);
   - from **22**: `materialiseInvoices`, `deliveryPlanFor`, `InvoiceDelivery`, `invoiceDeliveryLabel`,
     `resendInvoice`, the `lineage` roles, `procedureIds`, `supplier` / `agent`, `gstTreatment`, the
     payment setting's second invoice, and the `invoicePresentation.ts` helpers;
   - from **21**: the billable-party picker, the invoice email, the Contract's required inputs and
     where their values live (at `3d3a18c` the billing reference is `Procedure.billingReference`);
   - from **16**: the `-P` rule, the `invoiceNumber` / `reference` fields on the Xero records,
     `bctiRecords(state)`, `bctisFor` and its paid-only switch;
   - from **14**: `payment-full` / `payment-half` (Admin · Invoice and the Xero sim pair route),
     `pwa-payment-full` / `pwa-payment-half`, and `OFFICE_ACTOR` and `OFFICE_SIMULATION_ACTOR` in
     `src/store/demoActors.ts`;
   - from **35**: the rule that commands on the admin Booking detail are disabled while the Booking
     has unsaved changes;
   - if **37** has run: `payBillsInXero` (which `runPayables` and `disbursePayable` became), its
     Xero-side void detector and its outage queue, which this phase's correction handoff must pass
     through (work item 6), and whether it left the payment-against-a-credited-invoice divergence case
     to 39;
   - if **38** has run: that the Outstanding list and the financial position read the ledger, so a
     credit leaves Outstanding with no screen change.
5. Pick the List the "Stage combined procedure" trigger uses (work item 13): a past Southern Cross
   Slot or List that no S1 to S5 beat uses, found with a one-off seed query. Name it in the PROGRESS
   entry.
6. Note the current `PERSIST_VERSION` (16 at `3d3a18c`; later phases bump it).

## Reference

**Design files (convention 17):**

- `docs/design/Design Language.dc.html`: tokens (teal the only action colour, crimson identity only,
  the success, warning and neutral tints, mono tabular numbers, pills, the sheet and elevation
  patterns, the motion patterns). The credit note and the negative invoice are neutral documents: no
  red for "credit", no crimson.
- `docs/design/Admin Review.dc.html` and `docs/design/Admin Day.dc.html`: the admin desktop anatomy
  (tables, header rows, side panels and drawers, pill styles). No mockup covers the invoice
  document, the Invoices table or the Billing monitor; extend `InvoiceDocument`'s print sheet and its
  264px info rail, the Invoices table and the monitor cards as they stand. The credit sheet reuses
  38b's `AdditionalInvoiceSheet` lines editor and party field and follows the existing admin sheets
  (`ContractEditSheet`, `PriceOverrideSheet`).
- `docs/design/Mobile App.dc.html`: the Booking detail, only to check that a credit event reads
  correctly in 38b's events list on mobile and web (no new mobile UI).

**Catalogue items:** the covered and context files listed above. None of the covered items has
images yet except US-13.5.2 (the audit viewer and the sign-in attempts).

**Analysis files:**

- `docs/prototype-build/catch-up/GAP-ANALYSIS.md`: theme 5 (events, additional invoices, credit and
  rebill), the US-08.6.2, US-08.6.4, US-08.6.5 and US-08.6.6 entries, the DM-24, DM-25 and DM-45 rows,
  the S4 line under "Demo impact", the "Demo-trigger buttons" section, and the EP-08 table with its
  structural note; the EP-13 row for US-13.5.2.
- `docs/prototype-build/catch-up/epics/EP-08.md` (#ft-08.6, #us-08.6.2, #us-08.6.4, #us-08.6.5,
  #us-08.6.6) and `epics/EP-13.md` (#us-13.5.2).
- `analysis/domain-model-delta.md` DM-24 and DM-45 (and DM-17 and DM-18 for 38b's element, DM-22 and
  DM-27 for the ledger and invoice entities this phase extends, DM-07 for combination Contracts,
  DM-25 for what 39a does with the negative invoice).
- `analysis/prototype-map-admin.md` (sections 6 Invoices and 7 Billing monitor, and the Audit viewer),
  `prototype-map-store-seed.md` (billing slices, counters, selectors), `prototype-map-domain.md`
  (invoice build) and `prototype-map-shell-demo-pwa.md` (the Xero sim pair detail).

**Code entry points** (line numbers are from `3d3a18c`; phases 14 to 38b will have moved them, and 36
deleted or renamed `BillingCase`, `BillingReceipt`, `retryBillingCase`, `handoffCase` and
`casesForList`: see the drift check's name list, and use the current names):

- Invoices and the run: `src/domain/types.ts` `Invoice` 672 (`kind: 'standard' | 'prePayment'` at
  plan time; 22, 27 and 38b widen it), `InvoiceLine` 688, `BillingCase` 707, `BillingReceipt` 752,
  `XeroAccRec` 779 (the unused `'voided'` status 787), `XeroAccPay` 790; `src/store/billingRun.ts`
  (`runBillingForList`, 22's `materialiseInvoices`, 22's `resendInvoice`);
  `src/domain/billing/invoiceBuild.ts` (the `negativeTotal` belt around 405 to 425, which stays);
  `src/store/mutate.ts` `ID_FORMATS` 61 and `allocateId` 100.
- Xero and money: `src/store/xeroHandoff.ts` `handoffCase` 153 (36's `handoffPair`);
  `src/store/paymentActions.ts` `receivePayment` 78; `src/store/payablesActions.ts` `payablesDue` 35,
  `runPayables` 146, `disbursePayable` 160; `src/apps/demo/xeroPairView.ts`;
  `src/apps/demo/DemoXero.tsx` (`PairDetail` 220, the "Voided" label 645).
- Admin screens: `src/apps/admin/screens/InvoiceDocument.tsx` (the document 29, `InvoiceInfoRail`
  232, `RailCard` 328, `XeroReference` 386); `src/apps/admin/screens/InvoicesScreen.tsx`;
  `src/apps/admin/screens/AdminBookingDetail.tsx` over the shared Booking
  detail body, where 38b's additional-invoice area and events list sit;
  `src/apps/admin/screens/BillingMonitorScreen.tsx`; `src/apps/admin/screens/AuditViewer.tsx` (the
  entity filter is derived from the audit entries' `entityType`, so a `creditNote` entity appears
  with no screen change); `src/apps/admin/routes.tsx` (`AdminInvoicesRoute` 174) and
  `src/apps/admin/AdminApp.tsx` (section mapping, nav paths).
- Audit labels: `src/shared/audit/actionLabels.ts` (`invoice.create` 83, the `xero.*` labels 92 to
  99) and `src/shared/audit/fieldLabels.ts`.
- Store plumbing: `src/store/appStore.ts` (`PERSIST_VERSION` 136, 16 at `3d3a18c`; `AppState`
  billing and xero slices), `src/store/persistMigrate.test.ts`, `src/store/selectors.ts`
  (`invoicesForList`, the monitor selector, `isBackdropInvoice`, 16's `bctiRecords`),
  `src/store/index.ts`, `src/store/demoActors.ts` (`OFFICE_ACTOR` 13, `OFFICE_SIMULATION_ACTOR` 30).
- Triggers: `src/shared/demoTriggers/registry.ts` (`stage-post-op` 312 as 38b left it,
  `payment-full` 376, `payment-half` 389, `pwa-payment-full` 503, `pwa-payment-half` 515).
- Seed: `src/domain/seed/cards.ts` (Sarah Mitchell's first episode on Dr Sharma's Tue 14 Jul AM List,
  Christchurch Public, Health NZ, `HNZ-2026-3102`), `src/domain/seed/cast.ts` (Dr Sharma; Southern
  Cross), 23's combination Contract in `src/domain/seed/contracts.ts` (no change expected).
- Tests to extend: `store/billingRun.test.ts`, `store/xeroHandoff.test.ts`, `store/xeroNhi.test.ts`,
  `store/paymentActions.test.ts`, `store/payablesActions.test.ts`, `store/persistMigrate.test.ts`,
  `store/demoScenarios.test.ts`, `shared/audit/auditNarrative.test.ts`, 14's
  `shared/demoTriggers/demoTriggers.test.ts`, 16's BCTI count tests, 36's `ledger.test.ts`, 38b's
  event and additional-invoice tests, and the Playwright specs under `aa-prototype/visual/`
  (`admin-phase08.spec.ts`, `admin-phase09.spec.ts`, 38b's spec).

## Work items

### Session 1: the credit note option and credit in full and rebill

1. **Model** (`domain/types.ts`). DM-24, and the negative invoice DM-25 nets.
   - **The credit event.** 38b's `ProcedureEventKind` gains `'credit'`, and its `ProcedureEventDetail`
     union a member `{ kind: 'credit'; credit: CreditEventDetail }` with `CreditEventDetail {
     originalInvoiceId; reason; cause: 'correction' | 'split'; replacementEventIds: string[];
     creditNoteId?; negativeInvoiceId? }`; the credit's party and invoice email sit in the event's
     own `EventParty` field ("same as" the original's, or a named party). `EVENT_KINDS.credit` is `{
     addedBy: ['office'], tick: 'fixedOn', reviewed: true, mayBundle: false, needsInvoicedProcedure:
     true }` (D13: every event goes through the one review step; 38b's handoff asked this phase to
     decide it). The replacements are ordinary 38b additional-invoice events, each gaining `replaces?:
     { creditEventId; originalInvoiceId; componentIndex? }`. The credit event and its replacements are
     reviewed and issued as one unit (work item 4). Add the kind's label to 38b's `EVENT_KIND_LABEL`
     in `procedureEventCopy.ts` ("Credit"), never inline.
   - `CreditNote`, in a new `billing.creditNotes` record: `{ id; creditNoteNumber; originalInvoiceId;
     creditEventId; bookingId; procedureIds; counterparty; supplier; agent; gstTreatment; lines: {
     description; quantity?; amount }[]; subtotal; gst; total; reason; cause: 'correction' | 'split';
     replacementInvoiceIds; negativeInvoiceId?; issuedAtISO; issuedBy: { who; role }; delivery:
     InvoiceDelivery; reversal: ReversalPlan; xero?: { accRecCreditNoteId; accPayCreditNoteId?;
     accPayVoided: boolean }; xeroFailure?: { code; message } }`. Amounts are stored positive and equal
     the original's; the document says "Credit". `cause` leaves room for Phase 41's cancellation
     refund. A credit note is its own record, not an `Invoice` kind, so no invoice sum, count or
     selector can pick it up by accident (Decisions-log entry below).
   - `NegativeInvoice`, in a new `billing.negativeInvoices` record: the reversal of the payable, to
     the anaesthetist (US-08.6.2: "a negative invoice to the anaesthetist, not called a BCTI credit").
     `{ id; number; anaesthetistId; creditNoteId; originalInvoiceId; pairId; cause: 'credit'; amount;
     offsetAmount; recoveryDue; status: 'offset' | 'toNet'; issuedAtISO; accPayCreditNoteId? }`.
     `number` is the credit note number with 16's `-P` suffix; `amount` is the whole payable reversed
     (stored positive, shown negative); `offsetAmount` is what was set against the payable it reverses
     (the part not yet paid out); `recoveryDue` is the part already paid out, left for the next
     payment run (`offsetAmount + recoveryDue === amount`); `accPayCreditNoteId` is its Xero mirror,
     the ACCPAYCREDIT (absent when the draft ACCPAY was voided). Phases 39a and 41 plan against these
     names (`amount`, `cause`, `recoveryDue`, `recoveryDueFromAnaesthetists`): keep them. 39a adds its
     nettings; its open amount is `recoveryDue` less its nettings, never `amount`. There is no
     carry-forward (D21). A negative invoice is raised on **every** credit while
     `CREDIT_RULES.reversesPayable`; when nothing was paid out it is settled at once (`status:
     'offset'`) and never reaches 39a's run.
   - `Invoice.lineage` roles gain `'rebillOf'` (a replacement points at the invoice it replaces).
   - Xero: `XeroCreditNote { id; type: 'ACCRECCREDIT' | 'ACCPAYCREDIT'; creditNoteNumber; againstId;
     contactId; total; allocated; status: 'authorised' }` in a new `xero.creditNotes`;
     `XeroAccRec.status` gains `'credited'` (the unused `'voided'` stays for 37's Xero-side void
     detection); `XeroAccPay.status` gains `'voided'` and `'credited'`.
   - `ID_FORMATS`: `creditNote` (`CRN`, pad 4), `creditNoteNumber` (`CN-2026-`, pad 4),
     `negativeInvoice` (`NEG`, pad 4), `xeroCreditNote` (`XCN`, pad 4).
2. **Pure credit rules** in a new `src/domain/billing/creditNote.ts`, re-exported from the billing
   index, Vitest-covered (convention 9):
   - `CREDIT_RULES`, the one OQ-77 constant (drift check step 3), commented "OQ-77 recommendation,
     provisional".
   - `creditInFull(invoice, lines)`: the credit note's lines, subtotal, GST and total, mirroring the
     original exactly (same descriptions prefixed "Credit:", same amounts, same GST treatment). Full,
     even when one line was wrong (AC "Credit in full").
   - `reversalPlan({ total, received, released, disbursed }, rules)` (36's leg fields) returns `{
     receivableCredited: total; negativeInvoiceTotal; offsetAgainstPayable; releaseCancelled;
     heldForPayer: received; recoveryDue }`, all cents exact. With `reversesPayable` (the built path):
     `negativeInvoiceTotal = total`, `offsetAgainstPayable = total - disbursed`, `releaseCancelled =
     released - disbursed`, `recoveryDue = disbursed`. With it off (pure branch only, no UI copy): no
     negative invoice, the payable leg is untouched, and the replacements carry receivables whose
     payable legs are zero, so the anaesthetist is paid once; tested for ledger balance. The cases,
     test-pinned:

     | Original's money | Receivable leg | Payable leg and negative invoice | Left over |
     |---|---|---|---|
     | Unpaid | credited to zero | negative invoice for the total, all offset against the payable; nothing was released | nothing |
     | Part or fully paid, not paid out | credited; a credit of `received` is held for the payer | negative invoice all offset; the released amount is cancelled, so the payables run skips it | `heldForPayer` (a refund happens outside the system, US-08.6.5; Phase 41 handles prepayment refunds) |
     | Paid out, partly or fully | as above | the undisbursed part offset, `recoveryDue = disbursed` left for the anaesthetist's next payment run | `heldForPayer`, and `recoveryDue` (netted by 39a) |
     | Handed off or not | as above | as above | the Xero plan (next bullet) differs, the ledger does not |

   - `replacementTotalCheck(creditTotal, replacementTotals, rules)`: passes while
     `forceReplacementTotal` is false; when true, refuses with "The new invoices must add up to the
     credited total." (pure, tested both ways).
   - `xeroCorrectionPlan(accRec, accPay)`: an ACCRECCREDIT for the total, `allocated = min(total,
     amountDue - amountReceived)` (the rest unallocated, matching `heldForPayer`), the ACCREC becomes
     `credited`; a draft ACCPAY with nothing authorised is `voided`; an authorised or paid ACCPAY gets
     an ACCPAYCREDIT numbered `${creditNoteNumber}-P` for the total, allocated against what is still
     unpaid (the rest unallocated, matching `recoveryDue`), and becomes `credited`. No NHI, patient
     name or other personal information, only the hidden unique ID (OQ-30).
   - Tests: the cases in cents, including odd cents and a half payment; `offsetAgainstPayable +
     recoveryDue === total`; `heldForPayer + (total - received) === total`; the plan for a draft, an
     authorised and a paid ACCPAY; lines mirror the original for 1, 2 and 7 lines and for a
     GST-inclusive Contract; both `CREDIT_RULES` branches; determinism.
3. **The credit path in 36's pure ledger module** (`domain/billing/ledger.ts`; extend
   `ledger.test.ts`):
   - `applyCredit(pair, plan, { creditNoteId, negativeInvoiceId, atISO })` returns the new pair: the
     receivable leg gains `creditedAmount = total`; the payable leg gains `reversedAmount =
     negativeInvoiceTotal` and its `releasedAmount` is cut to `disbursedAmount` (money already paid
     out cannot be un-released); the pair gains `credit: { creditNoteId; negativeInvoiceId; atISO;
     heldForPayer; recoveryDue }`. Refused on a pair already credited and on an `aaFee` pair.
   - `applyReceipt` and `applyDisbursement` refuse a credited pair (`pairCredited`).
   - `pairStatusLabel` gains `credited`.
   - `ledgerPosition`: `receivablesOutstanding` subtracts `creditedAmount`; two new totals,
     `creditsHeldForPayers` (sum of `credit.heldForPayer`) and `recoveryDueFromAnaesthetists` (sum of
     `credit.recoveryDue` not yet netted); and the equation becomes `imbalance = receiptsHeld -
     payablesDue - creditsHeldForPayers + recoveryDueFromAnaesthetists` (the equation 41 extends with
     its trust hold). Both new terms are zero on an uncredited ledger, so 36's pinned figures do not
     move. `anaesthetistPosition` gains the anaesthetist's `recoveryDue`.
   - `ledgerChecks`: `releasedNotReceived` and `receivedAboveAmount` read a credited pair against its
     credit, so a healthy credited pair raises no check.
   - Worked checks, one per case: half paid (received 50, released 50, disbursed 0: held 50, payables
     due 0, imbalance 0); fully paid, part paid out (received 100, released 100, disbursed 40: receipts
     held 60, held 100, to net 40, imbalance 0); fully paid out (receipts held 0, held 100, to net 100,
     imbalance 0).
4. **Store: the correction** (a new `src/store/creditActions.ts`, exported from `store/index.ts`).
   US-08.6.5, US-08.6.2, OQ-19, OQ-42, OQ-63.
   - `submitCredit(api, actor, { invoiceId, party?, invoiceEmail?, reason, cause, replacements })`,
     each replacement 38b's additional-invoice input (`FreeFormLine[]`, its `EventParty` and invoice
     email, the date of the charge) plus, for a rebill, the reference values. Office only (labelled reading). One `mutate()` that writes the credit event
     and one 38b additional-invoice event per replacement, all in 38b's review state, linked both
     ways, and audits `credit.submitted` on the credit event (`entityType: 'creditNote'`, the event
     id; after: original invoice number, reason, party, replacement count and totals). Refusals, each with a plain sentence:
     `reasonRequired`; `alreadyCredited`; `correctionPending` ("A credit for this invoice is waiting
     for review."); `kindNotCreditable` for a prepayment invoice ("Crediting a prepayment invoice is
     not in this prototype yet.", Phase 41) and an AA-FEE invoice ("AA fee invoices are not credited
     here."); a balance invoice is creditable only if 27's balance builder left it a plain receivable
     with a pair (else the prepayment sentence, recorded); a party with email delivery and no invoice
     email ("Add an invoice email for this billable party."); every 38b pricing refusal per
     replacement; `replacementTotalCheck`. The party defaults to the original's; any billable party is
     accepted and audited (`credit.partyChanged`), no reason beyond the credit's own.
   - **Review.** The credit event and its replacements pass 38b's one standard review step together
     (Admin Review's Events tab): `approveProcedureEvent` on the credit approves its replacements
     (re-running `submitCredit`'s refusals, as 38b re-validates on approval), `declineProcedureEvent`
     on it (reason required) declines them all, and a replacement cannot be approved or declined on
     its own. A declined correction is edited and resubmitted through `CreditSheet`, or removed, as
     38b handles a declined event. Extend 38b's review actions for the `'credit'` kind rather than
     adding a second queue. Audit as 38b audits a review.
   - **Issue** (`issueCreditInto(draft, creditEventId, atISO)`, an in-commit helper called by 38b's
     `runEventInvoicing` for each approved credit, never by the UI directly). It runs inside
     `runEventInvoicing`'s one engine commit (source system), so the credit and its replacements land
     in the same commit; the run's generic loop skips any event with `replaces` (a replacement is
     issued only through its credit, never on its own). Inside that commit: compute
     `reversalPlan` from the legs **at issue time** (a payment recorded while the credit waited is
     included); allocate the credit note (`creditInFull`, the delivery plan from 22 addressed to the
     chosen party and invoice email); allocate the negative invoice to the original's payee (`offset`
     when `recoveryDue` is 0, else `toNet`); `applyCredit` to the original pair; issue each
     replacement through 38b's additional-invoice issue path (so each gets its own number, pair,
     payable to the locked payee and BCTI) with the `rebillOf` lineage; stamp `creditNoteId`,
     `negativeInvoiceId` and the invoice ids on the events. Audit, each its own entry (US-13.5.2,
     "every step audited"), with `entityType: 'creditNote'` for the credit note's own entries:
     `invoice.credited` (reason, credit note number) on the original; `creditNote.create` (lines,
     totals, reversal plan, party); `creditNote.sent` / `creditNote.portalQueued` /
     `creditNote.notSent`; `ledger.receivableCredited`; `negativeInvoice.create` (number, anaesthetist,
     total, offset, to net); `ledger.payableReversed`; 38b's entries for each replacement, plus
     `invoice.rebilled` (the new number and the reason).
   - The original invoice record, its lines, the Booking, its Procedures and its lock are not written.
     "Credited", "Credit waiting for review", "Credited by CN-2026-0001" and "Rebilled as AA-2026-0013"
     are derived: `creditEventForInvoice(state, invoiceId)`, `creditNoteForInvoice(state, invoiceId)`,
     `replacementsOf(state, invoiceId)`, `rebillOriginFor(state, invoiceId)`, `invoiceStanding(state,
     invoiceId): 'live' | 'creditPending' | 'credited'`, `negativeInvoicesFor(state, anaesthetistId)`.
   - After the commit, `runEventInvoicing`'s handoff loop calls `handoffCorrection(api,
     creditNoteId)` (item 6) for each issued credit and `handoffPair` only for plain additional
     invoices, so no replacement pair is handed off twice.
   - `liveInvoiceForProcedure` skips a credited invoice and returns its first live replacement on
     that Procedure (by number), so a later 38b additional invoice on a credited Procedure still finds
     its original; with no live replacement (a credit with zero replacements) it returns none and 38b's
     own refusal applies.
   - Tests (`creditActions.test.ts`), one per `reversalPlan` case, driven through the real payment and
     payables actions and 38b's review and next run: unpaid; half paid; fully paid and not paid out;
     fully paid and paid out by `runPayables`; a payment recorded while the credit waits for review. In
     each: the credit note equals the original; the negative invoice equals the payable, with offset
     and to-net as the plan says; the whole ledger is in balance afterwards (36's imbalance figure is
     zero, with held credits and negatives to net as their own lines); the anaesthetist's position
     moves by exactly the reversal and then the replacements; the original invoice, Booking,
     Procedures and lock are deep-equal before and after; a second credit refuses while one is pending
     and after one is issued; a replacement can itself be credited (a chain of two); a credit to
     another party is accepted and audited; a credit with zero replacements issues the credit only;
     every audit entry is present with its source.
5. **BCTI feed** (16's count). Each replacement's ACCPAY counts through 38b's rule; a credit note and
   a negative invoice add nothing; the credited original keeps its record (the OQ-60 reading, beside
   `bctiRecords`). Extend 16's count test: a credit with one rebill adds exactly one BCTI for the
   month; a credit with no replacement adds none.
6. **Store: the Xero correction, together** (`store/xeroHandoff.ts`).
   - `handoffCorrection(api, creditNoteId)`: one `mutate()` (actor "Xero handoff", source system)
     that applies `xeroCorrectionPlan` to the original pair (the ACCRECCREDIT, the ACCPAY void or
     ACCPAYCREDIT, the statuses) **and** creates every replacement's pair by the same code path as
     36's `handoffPair` (extract its mirror-creation body into a shared helper rather than calling a
     second mutate), so the reversal and the re-creation land together (AC "Both sides move"). Audit
     `xero.creditNoteCreated` (numbers, allocated and unallocated amounts), `xero.accPayVoided` or
     `xero.accPayCredited`, and `xero.pairCreated` for each new pair. 38b's own handoff for an
     additional invoice must not run a second time for a replacement: route replacements here.
   - The fault path: `settings.failNextHandoff` faults the whole correction (nothing is reversed or
     created in Xero), records `xeroFailure` on the credit note and `handoffFailure` on each new pair,
     clears the flag, and the Billing monitor's `resolveAndRetry` routes a pair whose failure belongs
     to a correction to `handoffCorrection` (not `handoffPair`), so the retry reverses and re-creates
     together and is idempotent. A credit whose original was never handed off has nothing to reverse:
     it only creates the new pairs.
   - Guards elsewhere: `handoffPair` refuses a credited pair (`invoiceCredited`); `receivePayment`
     (through `applyReceiptInto`) refuses a payment on a credited pair or `credited` ACCREC
     (`invoiceCredited`, "This invoice was credited. Record the payment against the new invoice."), as
     Xero refuses payment on a fully credited invoice, and never turns it into an unmatched receipt;
     `payablesDue` reads the legs, so the cut release already drops the reversed payable, and
     `runPayables` / `disbursePayable` skip or refuse a credited pair through `applyDisbursement`.
     `runPayables` does **not** net a `toNet` negative invoice: Phase 39a does.
   - If Phase 37 has run: engine-made credits and voids carry their credit note id, so 37's
     Xero-side void detector does not flag them; a correction made during 37's simulated outage goes
     through its queue and backoff like any handoff; 37's `payBillsInXero` refuses or skips a credited
     pair and a voided or credited ACCPAY. If 37 left the payment-against-a-credited-invoice
     divergence case (EP-09) to 39, add it to 37's detector here (flagged on the pair, never applied
     to the ledger); otherwise confirm it reads this phase's `credited` status.
   - Tests: the correction and the new pairs in one commit (one rebill; three replacements); the fault
     path and its retry; the payment and payables guards; a `toNet` negative invoice left untouched by
     `runPayables`; `xeroNhi.test.ts` extended so no ACCRECCREDIT or ACCPAYCREDIT carries an NHI, a
     patient name or any other personal information (OQ-30).
7. **Admin UI for the credit** (shared admin flows; invoke the frontend-design skill first).
   - **`CreditSheet`** (new, `src/apps/admin/flows/`, office only), opened by **Credit note** and by
     **Credit in full and rebill**. Step 1 **Credit**: the original's number, party and total; the
     party the credit goes to (21's billable-party picker, default the original's, with the invoice
     email); the reason (required; quick chips "Wrong PO or reference", "Wrong billable party", "Wrong
     amount", "Split requested", "Paid twice", plus free text); the money state from `reversalPlan`
     on the current legs in plain words ("Unpaid: nothing held", "Paid $x: $x will be held for
     {payer}", "Dr X was paid $x: a negative invoice for $x nets in their next payment run", with the
     OQ-77 chip on the negative-invoice line); the caption "A credit note is not a refund." Step 2
     **New invoices**: zero or more replacement cards, each 38b's lines editor and party field (the
     component, not a copy); **Credit note** opens with none and an **Add an invoice** button,
     **Credit in full and rebill** opens with one card addressed to the original's party (blank lines
     in session 1; the copy in item 9). The trail preview "AA-2026-0007 debit $x · CN credit $x ·
     negative invoice -P $x · new invoice debit $y" (numbers shown as "on issue"). One primary teal
     **Submit for review** button with the note "Goes through the standard review step and is issued
     in the next run." On success, return to the invoice document, now showing the pending state.
   - **Entry points.** The invoice rail gains a card **Correct this invoice** on a live standard,
     balance or additional invoice, with secondary teal **Credit note** and **Credit in full and
     rebill** buttons and the caption "For an AA-side error or a split requested by the billable
     party. The invoice is never edited: it is credited in full and new invoices are issued. A
     disputed invoice with no AA error stays outstanding." Hidden on prepayment and AA-FEE invoices
     with the refusal sentence as a caption instead. 38b's additional-invoice area on each Procedure of
     an invoiced Booking gains the **Credit note** option beside **Create additional invoice** (US-08.6.5:
     "the additional invoice function has a credit note option"), disabled with its sentence while a
     credit is pending, and while the Booking has unsaved changes (Phase 35).
   - **Review.** 38b's review queue shows a credit as one row ("Credit AA-2026-0007 in full, 1 new
     invoice") with its replacements nested; Approve for billing and Decline act on the whole correction.
   - **Pending and credited original.** A neutral "Credit waiting for review" pill while pending; once
     issued, a neutral "Credited" pill beside the number, a line "Credited in full by CN-2026-0001 on
     {date} · rebilled as AA-2026-0013" (or "· replaced by AA-2026-0014, 0015, 0016"), all links, and
     the money chips (paid in, disbursed) kept as they were at the time of the credit. Payment
     triggers on this invoice show their "Invoice credited" disabled state.
   - **Credit note document**: route `/admin/credit-notes/:creditNoteId` (`AdminCreditNoteRoute`, a
     `RequireEntity` 404 guard; the side nav keeps Invoices active). It reuses `InvoiceDocument`'s
     sheet with the heading **CREDIT NOTE**, "Credits AA-2026-0007 in full", the party, the reason, the
     mirrored lines, "Total credited", the supplier and agent block from 22, and a rail with Delivery
     (22's label, the "Simulated send" badge and the caption "Xero does not send credit notes; the
     engine sends it"), **Negative invoice** ("CN-2026-0001-P to Dr Sharma · $x · offset against the
     unpaid payable", or "· $x nets in the next payment run"), **New invoices** (links), Print, and a
     Xero card ("ACCRECCREDIT CN-2026-0001", "ACCPAYCREDIT CN-2026-0001-P" or "Draft ACCPAY voided", or
     "Xero correction failed · retry in Billing monitor"). No NHI.
   - **Replacement document**: a line under the number "Rebills AA-2026-0007 (credited by
     CN-2026-0001)".
   - **Events list.** 38b's list on the Procedure shows the credit event with its kind label, date,
     state and (in Admin) the credit note link, in all three apps; the anaesthetist apps show it as 38b
     shows any event (no amounts beyond what 38b's list shows). No new mobile or web UI.
   - **Audit labels** (`actionLabels.ts`): a label for every new action above, so the Audit viewer and
     History read in words; extend `auditNarrative.test.ts` so no new action falls back to its raw key.
   - `data-shot` hooks: `credit-note-button`, `credit-rebill-button`, `credit-sheet`,
     `credit-note-document`, `negative-invoice-card`, `invoice-credited-banner`,
     `procedure-credit-event`.
8. **Session 1 persistence and the stop point.**
   - Bump `PERSIST_VERSION` by one (new slices `billing.creditNotes`, `billing.negativeInvoices`,
     `xero.creditNotes`, the credit event kind, new counter kinds, widened statuses). Extend
     `persistMigrate.test.ts`: a stale payload is discarded to the fresh seed. Two fresh seeds
     deep-equal. No seeded figure moves: S3's scripted invoices and 16's BCTI counts are unchanged.
   - **Stop point:** `npm run build`, `npm run build:pwa` and `npx vitest run` green, and the session 1
     part of the manual checklist passes, before session 2 starts.

### Session 2: the rebill from a copy, the combined split, views, triggers and docs

9. **Rebill from a copy of the original's lines** (US-08.6.6).
   - Pure `rebillDraftFrom(invoice, lines, referenceValues)` in `creditNote.ts` (or 38b's
     additional-invoice module if it reads better): a 38b additional-invoice draft holding the
     original's lines as `FreeFormLine`s, the original's party and invoice email, and the original's
     reference values (21's required inputs such as the PO number). Each positive line copies as
     quantity 1 at `unitAmount` = the line's stored (ex GST) amount, its description unchanged (any
     units stay in the description), so no per-unit division can lose a cent. 38b's
     `priceFreeFormInvoice` refuses a zero or negative unit amount, but an original can carry negative
     lines (24's "Anaesthetist adjustment" or "Price override" delta when it lowers the fee, 22's
     "Less paid by {holder}" line, 27's prepayment deduction on a balance invoice): a zero line is
     dropped, and each negative line is folded into the positive line it follows, its description
     appended (", less {its description}"), so every copied line is positive and the draft totals the
     original exactly; if folding would leave a line at zero or below, the draft is one line "Rebill
     of {original number}" at the original's subtotal. Tested: the draft prices through
     `priceFreeFormInvoice` to the original's total exactly for 1, 2 and 7 lines and a GST-inclusive
     invoice; a negative adjustment delta, a "Less paid by" line and a prepayment deduction fold to
     the exact total; a positive delta copies as its own line; determinism.
   - **Credit in full and rebill** now opens step 2 with that draft as its one card, editable;
     **Credit note** offers "Start from a copy of the original's lines" on any card it adds. The
     reference values are editable on the card (so a wrong PO number is corrected there) and stored on
     the replacement event (a `referenceValues?` field on 38b's additional-invoice detail, copied to
     the issued invoice by the run), so 25's Regenerate (as 38b extended it) reproduces the replacement
     exactly.
   - Tests: an unedited copy rebills to the same total; a corrected PO number changes only the
     reference; a party change re-addresses the rebill; Regenerate reports "identical" on the rebill.
10. **Split a combined Procedure** (US-08.6.4, OQ-53, OQ-77).
    - `splitCombinedProcedure` is `submitCredit` with `cause: 'split'`, reached through a guard
      `canSplitCombined(state, procedureId)`: refusals `notCombination` (the Procedure's locked
      Contract is not `isCombination`: "This Procedure is not on a combination Contract."), fewer than
      two replacements ("A split needs at least two invoices."), the original is a prepayment invoice
      ("Splitting a prepaid combination is not in this prototype yet.", Phase 41), the original already
      credited or pending.
    - The sheet prefills one replacement per part from `combinationParts(contract, masters)`: one
      line per part, quantity 1, amount blank, party the original's. The store does not prefill. The
      component totals are **not** checked against the bundle while `forceReplacementTotal` is false
      (AC "No forced total"). Audit `invoice.split` (component count, the bundle total and the
      component totals side by side) plus the credit entries.
    - Per OQ-77 (3), the same flow is offered as soon as the combined invoice exists, whether or not
      it has been sent (`sameFlowBeforeSend`); there is no separate before-sending path.
    - BCTI feed: each component's ACCPAY is one BCTI (a three-way split adds three; the credited
      original keeps its record).
    - Tests: a three-way split of the staged combination raises three linked replacements with their
      own pairs once reviewed and run, credits the original in full with its negative invoice, and
      leaves the ledger in balance; component totals above and below the bundle both accepted; with
      `forceReplacementTotal` true, a mismatch refused; each refusal; the Booking, Procedures, lock and
      original are deep-equal before and after.
    - **`SplitCombinedSheet`**: `CreditSheet` in split mode, opened from **Split into additional
      invoices** on a Procedure whose locked Contract is a combination (Booking detail and the original
      invoice's rail), shown only there. Header "{Contract name} · split into additional invoices";
      one card per component; add or remove a component; the bundle total and the components' sum side
      by side with the neutral note "Components need not add up to the bundle price." and the OQ-77
      chip; the note "The original invoice is credited in full"; one primary teal **Submit N invoices
      for review** button. `data-shot` hook `split-combined-sheet`; a split component's document line
      reads "Additional invoice · part 2 of 3 · replaces AA-2026-0007 · {Procedure}".
11. **Ledger views** (Phase 36's screens; extend, do not rebuild).
    - The whole-ledger view (36's `LedgerScreen`, `/admin/ledger`) shows the two new totals from
      item 3: **Credits held for payers** and **Negative invoices to net**, with the equation line
      extended to match. Neither counts as an imbalance. A credited pair's row shows the `credited`
      status label.
    - The per-anaesthetist view lists the credit note, the negative invoice and the replacements in the
      trail in order (debit, credit, contra, new debit), and shows any amount to net with the caption
      "Nets in the next payment run".
    - The web financial position (38) needs no change: a credited invoice leaves Outstanding and the
      replacement joins it through the ledger. Verify it; fix only a selector that reads invoices
      instead of the ledger. The anaesthetist sees the negative invoice on 39a's remittance advice.
12. **Invoices, monitor and simulator.**
    - **Invoices screen**: credit notes join the table as rows of kind **Credit note** ("Credits
      AA-2026-0007"), linking to their document; the original's Status shows "Credited" (or "Credit
      waiting for review"); 38b's Kind column reads "Additional" for replacements, with "Rebills
      AA-2026-0007" under the number.
    - **Billing monitor**: a failed Xero correction shows on the Booking's row with Resolve and retry.
    - **Xero sim** (`DemoXero.tsx`, `xeroPairView.ts`): the pair detail shows the ACCRECCREDIT and
      ACCPAYCREDIT (or the void) with allocated and unallocated amounts, and links to the new pairs.
      The Invoices tab status reads "Credited". `data-shot` hook `xero-credit-note`.
13. **Session 2 triggers.**
    - **Stage combined procedure** (new, `stage-combined-procedure`, Admin · Invoices, bar; body in
      `src/store`): on the List picked at the drift check, creates one Booking for a fixed patient
      with an explicit id (never from the generated pool) and one Procedure, abdominoplasty, on 23's
      "Southern Cross cosmetic combination" Contract, post-paid (not prepaid; 21's Contract-defined
      billable party), then authorises and bills it through the real actions (`authoriseList`, the
      run, `handoffPair`) as `OFFICE_SIMULATION_ACTOR`. Result "Staged: a billed Southern Cross
      cosmetic combination. Open its invoice and use Split into additional invoices." with a link.
      Disabled "Already staged" once present. Deterministic ids through `allocateId`.
    - **Stage refund after payout** (new, `stage-refund-after-payout`, Admin · Billing monitor and
      Admin · Invoice, bar; body in `src/store`): on Admin · Invoice it acts on the invoice in the URL,
      on the Billing monitor on Sarah Mitchell's live invoice once 38b's `stage-post-op` has run. It
      records a full payment through 14's payment body and disburses that pair's payable through 36's
      `disbursePayable` path (or, if 37 has run, `payBillsInXero` with the webhook delivered), so a
      following credit raises a negative invoice with an amount to net. Result "Paid in full and paid
      out to Dr Sharma. Credit it to see the negative invoice." Disabled: "Stage post-op scenario
      first", "Invoice credited", "Credit waiting for review", "Already paid out", or "AA fee and
      prepayment invoices are not credited here".
    - Re-point 14's `payment-full` / `payment-half` on Admin · Invoice and the Xero sim pair route:
      disabled "Invoice credited" on a credited invoice (the store guard backs it). 14's
      `pwa-payment-full` / `pwa-payment-half` read `openAccRecs`: confirm a credited ACCREC drops out.
    - 25's `regenerate-invoice` (as 38b re-pointed it) covers replacements, which are additional
      invoices; do not register it on the credit-note route.
    - 38b's `run-next-billing-run` (Admin · Billing monitor and Admin · Review) runs
      `runEventInvoicing`, which now issues credits too: use it in the checklist and recipes, and
      check its result copy counts a correction sensibly (for example "1 credit note and 1 additional
      invoice raised"); its handoff loop routes a correction to `handoffCorrection` (work item 4). Add
      no run trigger of your own.
14. **Copy and Playwright.**
    - Copy sweep of the new strings for "BCTI credit", "refund" used for a credit note, "slot", and any
      em or en dash. Leave the `negativeTotal` message as it is unless 27 or 41 already reworded it.
    - Playwright: a new `aa-prototype/visual/admin-phase39.spec.ts` (the Correct this invoice rail,
      the credit sheet in both modes, the copy draft, the pending original, a credit note document
      with its negative invoice card, a credited original, the split sheet and one split component,
      the Xero pair with its credit note, the Audit viewer filtered to `creditNote`) and a mobile shot
      of a credit event in 38b's events list. Update any spec that shot the rail or the Invoices
      table by position.
15. **Tests and docs close-out.** 14's `demoTriggers.test.ts` covers the two new entries and the
    re-pointed ones (routes, surfaces, disabled states, `pwaPurity`); `demoScenarios.test.ts` covers
    the new S4 beat end to end at store level (stage, 38b's additional invoice, credit in full and
    rebill from a copy through review and the next run, the paid-out variant with its negative
    invoice, and the split); 16's count test covers every new record; then the demo guide (below) and
    PROGRESS.

## Demo triggers

The headline actions are **product UI**, not demo triggers (the ROADMAP names "Credit note" and
"Credit in full and rebill"): **Credit note** (with its party picker) and **Credit in full and
rebill** (opening a draft that holds a copy of the original's lines) on the Admin invoice document and
in the Procedure's additional-invoice area, **Split into additional invoices** on a Procedure on a
combination Contract, and the approve step in 38b's review queue. What the registry gains or changes:

| Label | Screen | Surface | Effect |
|---|---|---|---|
| Stage combined procedure (new, `stage-combined-procedure`) | Admin · Invoices | bar | A billed, post-paid Southern Cross cosmetic combination (abdominoplasty on 23's combination Contract), so its invoice can be credited and rebilled three ways. Disabled "Already staged" |
| Stage refund after payout (new, `stage-refund-after-payout`) | Admin · Billing monitor (Sarah Mitchell's live invoice) and Admin · Invoice (the URL's invoice) | bar | Marks the invoice paid in full and its payable disbursed, so its credit raises a negative invoice with an amount to net. Disabled with the reasons in work item 13 |
| Payment received · full / half (re-pointed) | Admin · Invoice and the Xero sim pair (`/demo/xero/invoices/:accRecId`) | bar | Disabled "Invoice credited" on a credited invoice; unchanged otherwise |

38b's `stage-post-op` provides the invoiced original for the S4 beat and is not changed here; 25's
`regenerate-invoice` (as 38b left it) already covers replacements.

PWA parity: this phase has no mobile beat. A credit is an office action in Admin; on the handset the
anaesthetist only sees the credit event in 38b's events list, which waits on nothing. The negative
invoice reaches the anaesthetist on Phase 39a's remittance advice. The Control Panel page gains
nothing; its index lists the two new entries under their screens automatically.

## Out of scope

- **The additional invoice itself, the event element, its review step, next-run invoicing and the
  events list**: Phase 38b. This phase adds the credit kind and the replacement link only.
- **Pre-op and post-op events**: Phase 39b.
- **Netting the negative invoice** in the payment run, the remittance advice and period BCTI approval
  (US-10.2.5, US-10.2.6): Phase 39a. A negative with no later payment is settled outside the system
  (OQ-71, D21): nothing is built, here or in 39a.
- **Refunding a held credit** (money a payer paid on a credited invoice): outside the system
  (US-08.6.5, "a credit note is not a refund"). This phase records `heldForPayer` only. Phase 41's
  refund on cancellation of a prepayment is a separate path that reuses `CreditNote`.
- Crediting a **prepayment** invoice (Phase 41), splitting a **prepaid** combination (US-08.6.4's usual
  case: it needs 41's credit of a prepayment invoice, so it is handed to 41 and recorded as a known
  gap; the post-paid combination is built here), or crediting an **AA-FEE** invoice (no catalogue item
  asks for it).
- **Partial credits** and editing or voiding an issued invoice in place: never, by policy (OQ-28).
- **Re-pricing a rebill from a corrected Contract** or re-locking the Booking: a rebill is a free-form
  copy the admin edits (US-08.6.6); the Booking's lock is never rewritten. A **payee correction** after
  authorise is not offered (no catalogue item asks for one).
- **A fallback to the patient** when a hospital or holder disputes an invoice with no AA error
  (OQ-19: it stays an outstanding invoice).
- **Stopping the money-event audit** (receipts, payments, disbursements; DM-45): left in place and
  logged as a policy point for the owner. How deep the audit goes is a developer discussion.
- A real email, portal upload or Xero API; the Xero side stays the simulation.
- A credit or negative-invoice view with amounts for the anaesthetist (the 2026-09-28 ruling); 39a's
  remittance advice is where the anaesthetist sees a negative invoice.

## Manual test checklist

The agent runs every item itself in the running app and reports it with evidence; none is handed
to the owner (ROADMAP.md "Owner review: agents test themselves").

Session 1 (after **Reset → Confirm reset**, 38b's **Stage post-op scenario** on Dr Sharma's Tue 14
Jul AM List, and one 38b additional invoice on Sarah Mitchell's Procedure, reviewed and invoiced):

- [ ] Sarah Mitchell's original invoice shows the **Correct this invoice** rail card with **Credit
      note** and **Credit in full and rebill**; the Procedure's additional-invoice area shows **Credit
      note** beside **Create additional invoice**. A prepayment and an AA-FEE invoice show the refusal
      caption instead.
- [ ] **Credit note**: step 1 needs a reason, shows "Unpaid: nothing held", defaults the party to the
      original's and accepts another billable party (asking for its invoice email). Step 2 starts
      empty; add one invoice with a typed line. **Submit for review**: the original shows "Credit
      waiting for review"; a second credit is refused; the Procedure's events list shows the credit
      event and its replacement as waiting for review, in Admin, web and mobile.
- [ ] In 38b's review queue (Admin Review, Events tab) the credit is one row with its replacement
      nested; **Approve for billing**, then **Demo actions → Run the next billing run**: the credit note `CN-2026-0001` opens with "Credits AA-2026-... in full", the
      mirrored lines and total, Delivery with "Simulated send" and the Xero caption, the **Negative
      invoice** card "CN-2026-0001-P to Dr Sharma · offset against the unpaid payable", and Xero
      "ACCRECCREDIT CN-2026-0001" and "Draft ACCPAY voided".
- [ ] The original shows **Credited** and its links, its number and lines unchanged; the replacement
      shows "Rebills AA-2026-..." with its own pair; Admin · Invoices shows the original, the credit
      note and the replacement with their kinds.
- [ ] Phase 36's whole ledger stays in balance; the Audit viewer filtered to `creditNote` shows each
      step as its own labelled entry, and the original invoice's History shows the credit.
- [ ] Payment received on the credited original is disabled "Invoice credited".
- [ ] **Credit in full and rebill** on another invoice opens with one card to the original's party
      (blank lines in session 1).
- [ ] Arm handoff failure, then credit and rebill another invoice through review and the run: the
      credit note shows "Xero correction failed"; the Billing monitor's Resolve and retry completes
      both the reversal and the new pair.
- [ ] Stop point: `npm run build`, `npm run build:pwa` and `npx vitest run` green.

Session 2 (after **Reset** and the same staging):

- [ ] **Credit in full and rebill** on Sarah Mitchell's original: the card holds a copy of the
      original's lines and its PO number. Correct the PO number, submit, approve, run: the rebill
      totals the original exactly and carries the corrected PO number; **Regenerate from locked data**
      on it says "identical".
- [ ] Paid-out case: on the rebill, Billing monitor **Demo actions → Stage refund after payout**, then
      **Credit in full and rebill** with "Paid twice": step 1 shows the held credit and "Dr Sharma was
      paid $x: a negative invoice for $x nets in their next payment run" with the provisional chip.
      After review and the run, the ledger shows "Credits held for payers" and "Negative invoices to
      net" with zero imbalance, the credit note's card says "nets in the next payment run", the Xero
      sim shows the ACCPAYCREDIT, and the next **Run payables** pays nothing for the credited pair and
      leaves the negative invoice open.
- [ ] Admin · Invoices, **Demo actions → Stage combined procedure**: a billed Southern Cross cosmetic
      combination appears. **Split into additional invoices** prefills three components
      (abdominoplasty, breast lift, liposuction); give amounts that do not add up to the bundle and
      Southern Cross as one party: accepted with the "need not add up" note and the chip. After review
      and the run: three replacements, each linked to the original and with its own Xero pair; the
      original credited in full; the ledger in balance; the AA fee count up by three.
- [ ] Credit a replacement again (a chain): refused on the credited original, allowed on the
      replacement. A non-combination Procedure shows no Split button.
- [ ] The per-anaesthetist ledger trail for Dr Sharma reads debit, credit, contra, new debit.
- [ ] Web Accounts (Dr Souter, after crediting one of her S3 invoices): the credited invoice leaves
      Outstanding and the replacement joins it; no amounts moved elsewhere.
- [ ] Xero sim: no NHI on any credit note; pair detail shows allocated and unallocated amounts.
- [ ] No en or em dash and no "slot" in any new app string; "negative invoice", never "BCTI credit";
      teal is the only action colour on the new sheets and rails; no crimson and no red on the credit
      note or negative invoice.
- [ ] Catalogue screenshots: the recipes for US-08.6.2, US-08.6.4, US-08.6.5, US-08.6.6 and US-13.5.2
      are created or updated, 38b's US-08.6.1 and US-08.6.3 recipes still pass, any recipe this phase
      broke is re-pointed, a full `npm run capture` ends with no failed recipe and no story without a
      recipe, the covered items' new shots are checked by eye, and `npm run verify:board` is green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots` and `npm run verify:board`
      green.

## Demo guide updates

S4 gains a credit-and-rebill beat after 38b's additional-invoice beat (the ROADMAP gives it to this
phase). This is not a milestone phase (39a is, and runs the consistency read of
`master-demo-guide.html` after the payment runs land), so patch the sections below and spot-check that
the master guide's S4 matches the run sheet.

- **`03-demo-script.md`:**
  - **S4 Beat 2b** (new, after 38b's Beat 2) "Credit in full and rebill":
    - Click: on Sarah Mitchell's original invoice, **Credit in full and rebill**, reason **Wrong PO or
      reference**; the draft already holds the original's lines; correct the PO number; **Submit for
      review**; approve it in the review queue and run the next run; show the credit note with its
      negative invoice, the credited original, the rebill and the Procedure's events list, then the
      Xero sim pair.
    - Say: "We never edit an issued invoice. We credit it in full, to whichever party needs it, and
      rebill, starting from a copy of the original lines. The credit is an event on the Procedure like
      any other, through the same review step. The anaesthetist's side is reversed by a negative
      invoice, and both sides move together, in our ledger and in Xero."
    - Expected: the credit note, the Credited original, the rebill with a new number; the ledger in
      balance.
    - Optional aside (paid-out case): **Stage refund after payout** on the Billing monitor, then
      credit: "Once the anaesthetist has been paid, the negative invoice is netted in their next
      payment run." (39a adds the netting beat.)
    - Optional aside (split): **Stage combined procedure** on Admin · Invoices, then **Split into
      additional invoices** three ways: "Southern Cross wants it in three pieces. We credit the
      bundle and raise three invoices, any amounts."
    - Fill in the actual invoice and credit note numbers from a reset run.
  - The **Direct URLs** table gains "One credit note · `/admin/credit-notes/<creditNoteId>`".
  - The S4 discovery points gain OQ-77 (must the rebill come to the same amount; does the credit
    reverse the payable; a split before the invoice is sent), one line; drop any OQ-42, OQ-71 or
    OQ-72 line (answered).
- **`02-workflows-and-handoffs.md`:** a new "Correction after invoicing" case (an AA-side error is
  credited in full to any party, then rebilled from a copy; the credit is an event through the review
  step; the payable is reversed by a negative invoice netted in the next payment run); a new
  "Splitting a combined procedure" case; the readiness table row 38b reworded gains "credit and rebill,
  split".
- **`04-presenter-cheat-sheet.md`:** "Built and clickable" gains credit note, credit and rebill and the
  split; "The money model" gains one line on the trail (debit, credit, contra, new debit) and one on the
  negative invoice; "Strong phrases" gains "We never edit an issued invoice; we credit it in full and
  rebill"; "Statements to avoid" gains "a BCTI credit" and "a credit note is a refund".
- **`01-personas-and-responsibilities.md`:** the office's responsibilities gain credit notes and splits.
- **`README.md`:** the readiness row is reworded.
- **`master-demo-guide.html`:** the same sections (the readiness row, the exceptions paragraph, S4 Beat
  2b, the cheat-sheet equivalents).
- **Control Panel scenario text:** the S4 scenario's message (as 38b left it) gains "then Credit in
  full and rebill on Sarah Mitchell's original".

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19),
run after the review pass and before the PROGRESS.md entry. Re-run
`node docs/prototype-build/catch-up/tools/recipe-status.mjs 39` first: earlier phases (38b above all)
may have changed these recipes since this plan was written. FT-08.6 is covered, so the tool lists
every story under it, 38b's included.

**Covered items.** When the phase is done, each recipe in `requirements-board/capture/recipes/`
matches what was built:

| Item | Recipe at plan time | When this phase is done |
|---|---|---|
| [US-08.6.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.6.1.md) Additional invoice for late billing lines | partial · web-post-op-event, mobile-post-op-event, admin-post-op-addendum[locked,added] (the retired addendum) | Phase 38b's: it rebuilds these shots for the additional invoice. Check only: the recipe still passes with the new rail card and the Credit note option beside Create additional invoice; fix by text, not position |
| [US-08.6.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.6.2.md) Credit note and re-issue | absent | captured. Replace the absent reason. Admin `/admin/invoices/<id>` for a live invoice: shot `credit-rebill`, `rail` state highlights `[data-shot=credit-rebill-button]`, `sheet` state fills `[data-shot=credit-sheet]` (reason chip "Wrong PO or reference", the copied lines, the trail preview), `credit-note` state (after Approve for billing in `/admin/review?tab=events` and the `run-next-billing-run` bar action) opens `/admin/credit-notes/<id>` highlighting `[data-shot=negative-invoice-card]`, `credited` state shows the original's `[data-shot=invoice-credited-banner]`. Use the `stage-refund-after-payout` bar action to show the paid-out variant with an amount to net. Simulator: `/demo/xero/invoices/<accRecId>` shot `xero-credit-note` highlighting `[data-shot=xero-credit-note]`. Captions in the catalogue's words: "Credit in full, then rebill", "The payable is reversed by a negative invoice to the anaesthetist" |
| [US-08.6.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.6.3.md) Create an additional invoice on a Procedure | absent · stub, no shots (38b captures it) | Phase 38b's. Check only: its shots still pass with the Credit note option added to the additional-invoice area |
| [US-08.6.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.6.4.md) Split a combined Procedure into additional invoices | absent · stub, no shots | captured. Replace the stub. Run the `stage-combined-procedure` bar action on Admin · Invoices, open its invoice, shot `split-combined`: `sheet` state highlights `[data-shot=split-combined-sheet]` with three component cards and the note "Components need not add up to the bundle price"; `result` state (after review and the run) shows one component invoice linking back to the original and the Procedure. Caption "A split after invoicing credits the original, then raises one additional invoice per component". Every acceptance criterion is met on the post-paid combination, so the recipe is `captured`; the prepaid-combination split (handed to 41) is a PROGRESS known gap, not a caption or a reason |
| [US-08.6.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.6.5.md) Credit note option on additional invoices | none (create it) | captured. New recipe. Admin Booking detail for Sarah Mitchell (after 38b's `stage-post-op`): shot `credit-note-option`, `option` state highlights `[data-shot=credit-note-button]` beside 38b's Create additional invoice; `party` state fills `[data-shot=credit-sheet]` with another billable party picked; `event` state highlights `[data-shot=procedure-credit-event]` in the Procedure's events list. Captions: "The additional invoice function has a credit note option", "The credit can go to any party", "The credit is recorded as an event on the Procedure" |
| [US-08.6.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.6.6.md) Start a rebill from a copy of the original lines | none (create it) | captured. New recipe. Admin `/admin/invoices/<id>` for Sarah Mitchell's original: shot `rebill-from-copy`, one state that presses `[data-shot=credit-rebill-button]` and highlights the prefilled card in `[data-shot=credit-sheet]` holding the original's lines. Caption "After a credit note, the rebill starts from a copy of the original's lines" |
| [US-13.5.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.5.2.md) Audit trail of all actions | captured · audit-viewer, sign-in-attempts | captured, one shot added. Keep `audit-viewer` and `sign-in-attempts` unchanged (re-check they pass). Add shot `credit-note-audit`: the recipe's own steps make one credit first (38b's `stage-post-op` trigger, Credit in full and rebill on Sarah Mitchell's original, Approve for billing in `/admin/review?tab=events` and the `run-next-billing-run` bar action), then open `/admin/audit`, select the entity filter `creditNote`, highlight the credit note rows. Caption "Credit notes are audited, every step with who, role, source and what changed" |

**Recipes this phase breaks.** The capture recipes found at plan time:
- Any recipe that opens the admin invoice document or the Invoices table by column position or rail
  order (the new Correct this invoice card, the Credit note row kind): re-run `--dry` and fix by text,
  not position.
- 38b's recipes for US-08.6.1, US-08.6.3 and US-03.7.3 if the Credit note option shifts the
  additional-invoice area or the events list layout.
- US-13.5.2's `sign-in-attempts` selects the entity filter with `select >> nth=0`: a new
  `creditNote` entity changes the option list, not the select's position; confirm it still picks
  `account`.

**ATLAS.md.** Routes: add `/admin/credit-notes/:creditNoteId`. Seed data and Personas and IDs: the
`stage-combined-procedure` and `stage-refund-after-payout` results and the invoice and credit note
numbers a reset run gives. Existing hooks: the `data-shot` hooks named in work items 7, 10 and 12.
Overlays: `CreditSheet` and `SplitCombinedSheet`.

## Adversarial review (after build)

Once the manual test checklist and `npm run build`, `npm run build:pwa`, `npx vitest run` and
`npm run shots` are green, and before writing the PROGRESS entry, run the standard **adversarial
review-and-fix pass (PROGRESS convention 18)**:

- fan out three independent Opus review subagents, one each for **quality**, **bugs/correctness** and
  **plan adherence**, plus a fourth for **money integrity** (the ledger, the negative invoice and the
  Xero reversal), each given the covered catalogue files, this doc and the diff;
- this session then independently verifies every finding against the catalogue, this doc and the
  code, fixes the confirmed ones (with a test wherever a bug had none), re-greens, and records the pass
  in the phase entry;
- do not re-raise anything already settled in the Decisions log (as amended by this phase).

**Steer this phase's reviewers at:**

- **Immutability.** No action writes the original Booking, its Procedures, its lock or the original
  invoice record and lines. Every back-link, "Credit waiting for review" and "Credited" are derived.
  Hunt for any spread-and-overwrite of `billing.invoices[originalId]` or `billing.locks[bookingId]`.
- **One correction, one review, one issue.** The credit event and its replacements are submitted,
  reviewed and issued as one unit through 38b's review step and next run; no replacement issues
  without its credit or the other way round; no second review queue; the reversal plan is computed at
  issue time.
- **Money conservation.** For every `reversalPlan` case, in cents: credit note total equals the
  original's; the negative invoice equals the payable and `offsetAmount + recoveryDue` equals it;
  `heldForPayer` equals what was received; `recoveryDue` equals what was disbursed; 36's whole ledger
  shows zero imbalance afterwards; the anaesthetist's position moves by exactly the reversal and then
  the replacements. A payment on a credited ACCREC, a payables run over a reversed ACCPAY, and a late
  handoff of a credited invoice are all refused; `runPayables` leaves a `toNet` negative invoice open
  (39a nets it). GST activity (38) does not move on a credit.
- **Not a refund.** No credit moves money; nothing pays a held credit out; no copy calls a credit
  note a refund.
- **BCTI count.** Every replacement adds exactly one record to 16's `bctiRecords`; a credit note and a
  negative invoice add none; nothing else counts BCTIs.
- **Both sides together.** The Xero reversal and every new pair land in one commit or none does; 38b's
  own additional-invoice handoff never runs a second time for a replacement; the fault path leaves a
  retryable, visible state; the retry is idempotent; no NHI reaches a credit note.
- **Provisional in one place.** The OQ-77 readings live only in `CREDIT_RULES`, both branches tested;
  the chip appears only on the split total and the negative-invoice line; nothing answered (OQ-72,
  OQ-71, OQ-63) carries a provisional label.
- **Split rules.** Only on a combination Contract; at least two components; no forced total while the
  constant says so; the original credited in full; each component its own number, pair and payable,
  linked to the Procedure and the original; a prepaid combination refused.
- **Rebill from a copy.** The copy reproduces the original's total exactly; reference values carry
  over and are editable; Regenerate reproduces the replacement; the Booking lock is untouched.
- **Audit.** Every step of a correction is its own entry with a label (no raw keys in the viewer);
  credit-note entries carry `entityType: 'creditNote'`; the money-event audit is unchanged.
- **Triggers.** The two new staging entries act on the URL's entity or the staged one, are bar only,
  are disabled with reasons, and keep their bodies in `src/store` so `pwaPurity` holds.
- **Determinism and persistence.** No `Date.now()`, `new Date()` or `Math.random()`; dates from the
  demo clock; `PERSIST_VERSION` bumped and the migrate test discards a stale payload; two fresh seeds
  deep-equal; S3's scripted figures unchanged.
- **Design and copy.** The sheets and rails follow the admin patterns and tokens and reuse 38b's lines
  editor; teal is the only action colour; the credit note and negative invoice are neutral, never red
  or crimson; "negative invoice", never "BCTI credit"; the event labels come from 38b's one place; no
  "slot" and no en or em dashes in app copy.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry; ROADMAP.md "Owner review: agents test
  themselves"): the OQ-77 recommendation as built (no forced total, the credit reverses the payable,
  one flow before and after sending) and where it lives; the labelled readings (office only; a credit
  to another party is the addressee only and the Xero sim allocates it to the original; the engine
  sends the credit note; a rebill is a free-form copy with no re-pricing and no payee correction); the
  credit going through the review step with its replacements; the DM-45 policy point (money events
  still audited); the prepaid-combination split left refused for 41; the OQ-60 reading; and the
  screens worth a look, each with its route and persona (the credit sheet, a credit note, a credited
  original, the split sheet, the review row, the Audit viewer filtered to credit notes).
- **Status row** for catch-up Phase 39, and a phase entry with:
  - the drift-check result (items changed or not since `3d3a18c`; FT-08.6, US-08.6.2, US-08.6.4,
    US-08.6.5 still Verify, US-08.6.6 Proposed, or not; OQ-60 and OQ-77 status; the List the
    combined-procedure trigger uses; the prepaid-combination split left refused, as a known gap
    against US-08.6.4 handed to 41);
  - what was built, with the name map for later phases: `CREDIT_RULES`, the credit event kind and
    `CreditEventDetail`, `EVENT_KINDS.credit`, `replaces`, `submitCredit`, `issueCreditInto`, `CreditNote`, `NegativeInvoice`,
    `creditInFull`, `reversalPlan`, `replacementTotalCheck`, `xeroCorrectionPlan`, `applyCredit` and
    the extended `ledgerPosition` equation (`creditsHeldForPayers`, `recoveryDueFromAnaesthetists`),
    `rebillDraftFrom`, `canSplitCombined`, `handoffCorrection`, `XeroCreditNote`, the derived
    selectors, the `rebillOf` lineage role, id formats, audit actions, route and triggers;
  - the `PERSIST_VERSION` bump (from and to);
  - tests added and the before and after Vitest and Playwright counts;
  - the review pass.
- **Catalogue screenshots result:** recipes created or changed (US-08.6.2, US-08.6.4, US-08.6.5,
  US-08.6.6, US-13.5.2, plus any recipe this phase broke), the `capture/REPORT.md` counts (captured,
  partial, absent, failed) before and after, and any partial reason handed to a later phase.
- **Decisions log:**
  1. **Amended:** the Phase 08 and 09 rulings that "a negative invoice is never raised; a real
     practice issues a credit note" and "the over-prepaid full case fails to the monitor (no
     credit-note issuance, out of scope)". The `negativeTotal` belt stays for drafts; corrections are
     now credit notes with a negative invoice to the anaesthetist (OQ-42); the overpaid prepayment is
     accepted with no credit (OQ-03, Phases 27 and 41).
  2. **New:** a credit note is its own record, not an invoice kind, so no invoice sum or count can
     include it; the original invoice is never written, and "Credited" and every link are derived.
  3. **New:** a credit is an event on the Procedure (OQ-63); it and its replacements are one
     correction, reviewed once through 38b's standard step and issued together by the next run, so
     the ledger and Xero reverse and re-create together; the reversal is computed at issue.
  4. **New:** the credit note option (OQ-72, D22) credits the original in full to any party, the
     original's included; the ledger credits the original receivable whoever the party is; zero or
     more replacements follow; a credit note is not a refund.
  5. **New:** a rebill is a 38b additional invoice, started from a copy of the original's lines and
     reference values (US-08.6.6) and edited; the Booking's lock is never rewritten and no new lock is
     made (the question Phase 25 left); its payable goes to the locked payee.
  6. **New:** the payable is reversed by a negative invoice to the anaesthetist on every credit
     (OQ-42, US-08.6.2): the part not yet paid out is offset at once, the part paid out
     (`recoveryDue`) is left to net in the next payment run (39a); a case with no later payment is
     settled outside the system (OQ-71, D21).
  7. **New:** the engine sends the credit note through the invoice delivery plan (Xero does not send
     credit notes); a payment on a credited ACCREC is refused; credit is office only (labelled
     reading) and is the AA-error and split path (OQ-19, OQ-72).
  8. **New (provisional, OQ-77):** no forced total, the credit reverses the payable, one flow before
     and after sending, in `CREDIT_RULES`.
  9. **New (provisional, OQ-60):** replacements each add one BCTI; credit notes and negative invoices
     are not BCTIs; a credited original keeps its count.
  10. **New:** credit notes join the audited set (US-13.5.2, DM-45); the money-event audit is left in
      place in the prototype, a policy point for the owner.
- **Handoff notes:**
  - For **39a**: a `NegativeInvoice` with `status: 'toNet'` is what the payment run nets, for its
    `recoveryDue` (not its `amount`; an `'offset'` negative never enters a run);
    `recoveryDueFromAnaesthetists` and the anaesthetist's `recoveryDue` fall as it nets; its Xero
    mirror is the ACCPAYCREDIT `accPayCreditNoteId`, whose unallocated part 39a allocates against later
    bills; no carry-forward (D21). Name the stage trigger (`stage-refund-after-payout`, Dr Sharma) and
    its result copy.
  - For **39b**: the credit kind sits beside its pre-op and post-op kinds on 38b's element; nothing
    else to reuse.
  - For **40**: the patient view lists credit notes and replacements with their standing; a credited
    invoice is not unpaid for the balance warning; a patient's `heldForPayer` credits are the credit
    balance D24's mild warning reads.
  - For **41**: reuse `CreditNote` (`cause` widens to the cancellation refund), `creditInFull`,
    `reversalPlan` and `NegativeInvoice`; prepayment invoices and prepaid combinations are still
    refused by `submitCredit` and `canSplitCombined`. US-08.6.4 says combinations are usually prepaid,
    so once 41's credit path takes a prepayment invoice, lift the prepaid refusal. If 41 does not pick
    it up, 44 records it as an open gap against US-08.6.4.
  - For **37**: engine credits and voids carry their credit note id and must not be flagged as
    Xero-side voids; corrections go through the outage queue.
  - For **38**: confirm (or note, if 38 ran first) that Outstanding drops a credited invoice and takes
    the replacement through the ledger.
  - For **43**: the credit rows must stay usable at full scale.
  - For **44**: S4 Beat 2b as written here; the OQ-60 and OQ-77 lines if answered later; the
    US-08.6.2, US-08.6.4, US-08.6.5, US-08.6.6 and US-13.5.2 screenshots were shot here.
