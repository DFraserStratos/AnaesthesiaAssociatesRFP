# Phase 39 · Additional invoices and credit-and-rebill

**Requirements covered:**
[FT-08.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-08.6.md) Billing after AUTHORISED (Verify; the admin half: additional invoices and credit-and-rebill) ·
[US-08.6.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.6.1.md) Additional invoice for late billing lines (Verify) ·
[US-08.6.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.6.3.md) Create an additional invoice on a Procedure (Verify) ·
[US-08.6.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.6.2.md) Credit note and re-issue (Verify) ·
[US-08.6.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.6.4.md) Split a combined Procedure into additional invoices (Verify; unparked, OQ-53 answered) ·
[DM-18](../analysis/domain-model-delta.md#dm-18) Additional invoice is a free-form admin invoice on a Procedure; it replaces the post-op addendum Card ·
[DM-24](../analysis/domain-model-delta.md#dm-24) A wrong invoice is credited in full, then rebilled ·
[RV-10](../analysis/reverse-check.md#rv-10-post-op-addendum-is-a-new-linked-card-on-todays-free-session) Post-op addendum is a new linked Card on today's free session.
Read alongside (not closed here):
[US-07.3.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-07.3.2.md) (the Booking is immutable after AUTHORISED; nothing here may change it),
[US-08.3.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.3.1.md) (the receivable and payable pair; Phase 36 built it),
[US-08.4.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.4.3.md) (unique invoice numbers, the `-P` payable suffix),
[US-04.2.11](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.11.md) (combination Contracts; Phase 23 built them),
[US-04.3.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.3.2.md) (the filtered Contract list; Phase 20 built it; a rebill's Contract correction uses it, an additional invoice does not),
[US-10.2.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-10.2.5.md) (negative invoices netted in the payment run: Phase 39a nets what this phase raises),
[DM-25](../analysis/domain-model-delta.md#dm-25) (negative invoice and remittance: 39a),
[US-13.5.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.5.2.md) (every step audited),
[US-06.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.4.1.md) (the remaining balance invoice is NOT an additional invoice),
[FT-03.7](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-03.7.md) and
[US-03.3.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.3.6.md) (the anaesthetist's post-op events and dated billing lines: Phase 39b, not here),
[OQ-19](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-19.md) (Answered: an AA-side error is credited and reissued),
[OQ-42](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-42.md) (Answered: credit note plus negative invoice),
[OQ-45](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-45.md) (Answered: free form, owner decision D10),
[OQ-53](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-53.md) (Answered: a combination is a Contract under each parent procedure),
[OQ-72](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-72.md) (Open: description or discount, any billable party, credit the original on a split),
[OQ-71](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-71.md) (Open: no later payment to net against; Phase 39a),
[OQ-60](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-60.md) (Open: what the AA fee's per-BCTI charge counts),
[OQ-24](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-24.md) and
[OQ-28](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-28.md) (both Answered: the flow and the credit policy), and the
"What changed since the RFP" rows, the Booking section and the "Internal ledger" section of
[domain-model.md](../../../discovery-reference/Updated%20Requirements/domain-model.md).
**Depends on:** 23 (combination Contracts: `Contract.isCombination`, `combinationParts`, and the
seeded "Southern Cross cosmetic combination" Contract no Booking uses yet) and 36 (the internal
ledger: a linked receivable and payable per invoice, the whole and per-anaesthetist positions, the
imbalance indicator). By the roadmap order 14 (the demo-trigger registry, `useDemoTriggerContext`,
`stage-post-op`, the payment entries, the shared actors), 15 (Booking vocabulary and routes), 16
(payable equals receivable, `invoiceNumber` and `reference` on both Xero records, the AA-FEE invoices,
and the BCTI count: `bctiRecords` and `bctisFor`), 20 (one Contract per Procedure and its pure scope
rule), 21 (billable party, invoice email and required inputs on the Booking), 22 (`procedureIds`,
`lineage`, `delivery`, `materialiseInvoices`, `resendInvoice`, the payment setting), 24 (the
adjustment), 25 (the `BookingLock`, `priceBookingFromLock`, "Regenerate from locked data", the
payee), 27 (the prepayment and balance invoices) and 28 (Slots and Lists) have also run. 37 and 38
may run before or after this phase. 39a (netting) and 39b (the anaesthetist's post-op events) run
after it; run 39b soon after, because this phase withdraws the anaesthetist's post-op Card flow.
**Estimated:** 2 sessions. Session 1 is the free-form additional invoice and the removal of the
addendum Booking (work items 1 to 6), ending at a green stop point. Session 2 is credit in full and
rebill with the negative invoice, then the split of a combined Procedure that reuses both (work
items 7 to 16).

## Goal

After a List is authorised and invoiced, two things still happen in real life: a charge turns up
later (a ward review the next day, a pain consult) or a billable party wants a combined price broken
into parts, and an invoice turns out to be wrong (the wrong PO number, the wrong party, an insurer
that paid twice). The catalogue settles all three without ever unlocking the original Booking
(FT-08.6, US-07.3.2):

- **Late charges become free-form additional invoices** (US-08.6.1, US-08.6.3, DM-18; owner
  decision **D10**, OQ-45 answered). An admin opens the invoiced Booking, picks a Procedure and
  presses **Create additional invoice**. The sheet takes free-form lines, each a **description, a
  quantity and an amount**, with **no Contract pricing and no unit rules**, and a billable party
  that defaults to the original invoice's party. It issues at once with **no approval step**: its
  own number, its own ledger pair, its own Xero pair and its own payable to the anaesthetist, linked
  to the original Procedure and invoice, and the original shows its additional invoices. Each one is
  its own receivable with its own BCTI, so it feeds Phase 16's count function. OQ-72's open details
  are built as its recommendation and labelled provisional in one constant: "Desc" is a description
  (not a discount), the invoice may go to any billable party, and a split credits the original.
- **The post-op addendum Booking goes** (RV-10). `addPostOpAddendum`, the addendum Booking type and
  its banner and button are removed. The anaesthetist's own late-charge path comes back in Phase 39b
  as a post-op event on the Procedure (FT-03.7); until then the locked Booking carries a one-line
  caption that the office raises later charges, as AA works today (US-08.6.1: "today the anaesthetist
  tells the office by email"). No in-app notice is built: 39b's events replace the "Tell the office"
  interim the first plan had.
- **A wrong invoice is credited in full, then rebilled** (US-08.6.2, DM-24, OQ-19 answered: an
  AA-side error is credited and reissued). On the Admin invoice document, **Credit in full and
  rebill** takes a reason and the corrections (billable party, invoice email, required inputs such
  as the PO number, the Contract where safe, an office override with its reason), then in one
  confirmed step: issues a **credit note** for the whole amount against the receivable, sends it to
  the billable party, reverses the linked payable with a **negative invoice to the anaesthetist**
  (OQ-42 answered; it is not called a BCTI credit), reverses the **Xero ACCREC and ACCPAY and creates
  the new pair together**, and issues the **rebill** with a new number, linked to the original. The
  trail reads debit, credit, contra, new debit, and every step is audited. The original invoice is
  never edited: its "Credited" state and its links are derived.
- **When the anaesthetist has already been paid,** the part already paid out stays on the negative
  invoice as an amount to net in their next payment run; Phase 39a nets it, shows it on the
  remittance advice and builds OQ-71's carry-forward. The part not yet paid out is offset at once
  against the payable it reverses.
- **A combined Procedure can be split** (US-08.6.4, OQ-53 answered). On a Procedure whose locked
  Contract is a combination Contract (Phase 23), **Split into additional invoices** raises one
  free-form additional invoice per component, each with its own amount and billable party, with **no
  forced total** against the bundle price, all linked back to the Procedure. Per OQ-72's
  recommendation (provisional), the original combined invoice is credited in full in the same step.

The state gains credit notes, negative invoices and Xero credit notes, and loses the addendum fields,
so `PERSIST_VERSION` is bumped. No seeded figure moves.

## Before you start: drift check

1. Run the drift check against the plan's catalogue snapshot:

   ```
   git diff 501b0b8 -- "docs/discovery-reference/Updated Requirements/catalogue" "docs/discovery-reference/Updated Requirements/domain-model.md"
   ```

   Read the diff for FT-08.6, US-08.6.1, US-08.6.2, US-08.6.3, US-08.6.4, the context items US-07.3.2,
   US-08.3.1, US-08.4.3, US-04.2.11, US-04.3.2, US-10.2.5, US-06.4.1, FT-03.7, and OQ-19, OQ-24,
   OQ-28, OQ-42, OQ-45, OQ-53, OQ-60, OQ-71, OQ-72. If an item changed, re-read it and adjust the
   work items. If an item is now Retired or Future, drop its work items and record that in the PROGRESS
   entry. At plan time (501b0b8) FT-08.6 and US-08.6.1 to US-08.6.4 were all **Verify**; a Verify
   item that AA has reworded is the most likely change. The US-08.6.1 screenshots still show the old
   "Add post-op event" addendum UI: the text wins (admin free-form invoice; the anaesthetist's events
   are 39b's), and this phase's Catalogue screenshots step re-shoots them.
2. **Owner decision D10 (OQ-45) is answered: build the answer, no provisional label.** An additional
   invoice is a free-form invoice: each line is a description, a quantity and an amount, with no
   Contract pricing or unit rules, admin only, no approval step, audited. It is not a split of a
   Contract's line between parties (that is 22's payment setting, US-04.2.12). The anaesthetist
   adjustment (Phase 24) is not offered on it; the admin types the amount.
3. **Answered questions this phase builds, no provisional label.**
   - **OQ-42:** the payable is reversed by a negative invoice to the anaesthetist, netted in their
     next payment run and shown on the remittance advice. This phase raises the negative invoice and
     offsets whatever of the payable is not yet paid out; Phase 39a nets the rest.
   - **OQ-19:** an AA-side error is credited and reissued; otherwise the invoice stays outstanding
     (no fallback to the patient). Credit in full and rebill is the AA-error path.
   - **OQ-53:** a combination is a Contract under each of its parent procedures (built by 23); a split
     is additional invoices raised against the Procedure.
   - **Numbering** (OQ-51 was deleted; US-08.6.3 now says "we keep the idea, not the numbering"): an
     additional invoice takes the next number from the ordinary invoice sequence (`AA-2026-####`) and
     shows "Additional to AA-2026-0007" as its link.
4. **Open questions, built as their recommendation and labelled provisional in one place.**
   - **OQ-72** (additional invoice details). Recommendation: "Desc" is a description, the invoice may
     go to any billable party, and the original combined invoice is credited in full when it is split.
     One constant, `ADDITIONAL_INVOICE_RULES` in `domain/billing/additionalInvoice.ts` (`{ lineText:
     'description'; anyBillableParty: true; splitCreditsOriginal: true }`), commented "OQ-72
     recommendation, provisional"; the party field and the split sheet show a small neutral
     "Provisional · to confirm with AA" chip. If AA answers "discount", a discount line is added in
     that module only.
   - **OQ-71** (no later payment to net against): Phase 39a's. This phase only leaves the paid-out part
     on the negative invoice as "to net".
   - **OQ-60** (what the per-BCTI charge counts): 16's recommendation stands (issued BCTIs count once,
     against the anaesthetist who did it). This phase decides only what its new records are, inside
     16's `bctiRecords`: an additional invoice's ACCPAY and a rebill's ACCPAY are BCTI records; a
     credit note and a negative invoice are not (the catalogue: "not called a BCTI credit"); a
     credited original keeps its record, because it was issued. Comment it "OQ-60, provisional"
     beside `bctiRecords`; no UI chip.
   - **The credit note's delivery** (US-08.6.2: "Xero raises credit notes but does not send them, so
     the mechanism is to be designed"; not an OQ). The engine sends the credit note through Phase 22's
     delivery plan exactly as it sends an invoice (email to the invoice email, or queued for the
     portal), badged "Simulated send", with the caption "Xero does not send credit notes; the engine
     sends it".
   - **Who may credit** (US-08.6.2: "who may action it ... remain to work through"): office only, a
     labelled reading in the code comment and the PROGRESS entry.
5. **Prerequisite names.** Confirm Phases 23 and 36 (and 14 to 28) are DONE in PROGRESS.md and read
   their handoff notes. Note the exact current names of:
   - from **36** (planned names; use the names the code has): `LedgerPair` (a union on `kind`:
     `'procedure' | 'prePayment'` Booking pairs and `'aaFee'`), `ReceivableLeg` and `PayableLeg`
     (`releasedAmount` replaced `authorisedAmount`; `disbursedAmount`), the pure module
     `domain/billing/ledger.ts` (`newBookingPair`, `applyReceipt`, `applyDisbursement`,
     `pairStatusLabel`, `ledgerChecks`, `ledgerPosition` and its `imbalance = receiptsHeld -
     payablesDue` equation, `anaesthetistPosition`), the selectors `ledgerPositionOf` and
     `anaesthetistLedgerPosition`, the store's `applyReceiptInto`, `LedgerScreen`, and the renames
     that **delete** the July names this doc's code entry points still show: `BillingCase` and
     `billing.cases` are gone (a failure is a `BillingException`), `handoffCase` is
     `handoffPair(api, pairId)` with the fault on `pair.handoffFailure`, `retryBillingCase` is
     `retryBillingException`, the monitor's `resolveAndRetry` calls them, `BillingReceipt` is
     `LedgerReceipt`, and `payablesDue` reads the payable legs, not the ACCPAYs. 36 left the legs able
     to take a credit but added no credit path: this phase adds it (work item 8). This doc says "the
     pair", "the receivable leg" and "the payable leg";
   - from **23**: `Contract.isCombination`, `combinationParts(contract, masters)`, the seeded
     "Southern Cross cosmetic combination" Contract (holder code `SX-COMBO-ABL`, three parents:
     abdominoplasty 31340, breast lift, liposuction), and where the Booking records only the Contract;
   - from **25**: `BookingLock`, `ProcedureLock`, `buildBookingLock`, `priceBookingFromLock`,
     `regenerateInvoiceFromLock`, the version helper and the pricing-date rule, the locked payee, and
     the `regenerate-invoice` trigger. Its handoff note says: "credit-and-rebill is the only way to
     change a locked Booking's price; the rebill needs a new lock (decide there whether it re-locks at
     the current Contract version or the original one)". This doc decides that in work item 9;
   - from **22**: `materialiseInvoices`, `deliveryPlanFor`, `InvoiceDelivery`, `invoiceDeliveryLabel`,
     `resendInvoice`, the `lineage` roles, `procedureIds`, `supplier` / `agent`, `gstTreatment`, the
     payment setting's second invoice, and the `invoicePresentation.ts` helpers;
   - from **21**: the Booking's billable party and its override, the billable-party picker, the
     invoice email, the Contract's required inputs and where their values live on the Booking or
     Procedure (at 501b0b8 the billing reference is `Procedure.billingReference`);
   - from **20**: the pure Contract scope rule the picker and `setProcedureContract` share (used only by
     a rebill's Contract correction);
   - from **16**: the `-P` rule, the `invoiceNumber` / `reference` fields on the Xero records,
     `bctiRecords(state)` and `bctisFor` (36 may have re-pointed `bctiRecords` to the payable legs);
   - from **15**: the renamed addendum fields (`bookingType`, `addendumOfBookingId`), the renamed
     action (`addPostOpAddendum` in `bookingActions.ts`), the Booking source value mapped for it, and
     the Booking detail body's current name;
   - from **28**: the helper that creates the addendum's List in today's open Slot (interim "until
     39"), and `stage-post-op`'s `when` on `projectedListId`;
   - from **35**: the rule that commands on the admin Booking detail are disabled while the Booking has
     unsaved changes;
   - from **14**: `stage-post-op`, `payment-full` / `payment-half` (Admin · Invoice and the Xero sim
     pair route), `regenerate-invoice` (25), and `OFFICE_ACTOR` and `OFFICE_SIMULATION_ACTOR` in
     `src/store/demoActors.ts` (some later phase docs call the latter `SIMULATED_OFFICE_ACTOR`; use the
     name the code has);
   - if **37** has run: its Xero-side void detector and its outage queue, which this phase's
     correction handoff must pass through (work item 12);
   - if **38** has run: that the Outstanding list and the financial position read the ledger, so a
     credit leaves Outstanding with no screen change.
6. Pick the List the "Stage combined procedure" trigger uses (work item 15): a past Southern Cross
   Slot or List that no S1 to S5 beat uses, found with a one-off seed query. Name it in the PROGRESS
   entry.
7. Note the current `PERSIST_VERSION`.

## Reference

**Design files (convention 17):**

- `docs/design/Design Language.dc.html`: tokens (teal the only action colour, crimson identity only,
  the success, warning and neutral tints, mono tabular numbers, pills, the sheet and elevation
  patterns, the motion patterns). The credit note and the negative invoice are neutral documents: no
  red for "credit", no crimson.
- `docs/design/Admin Review.dc.html` and `docs/design/Admin Day.dc.html`: the admin desktop anatomy
  (tables, header rows, side panels and drawers, pill styles). No mockup covers the invoice
  document, the Invoices table or the Billing monitor; extend `InvoiceDocument`'s print sheet and its
  264px info rail, the Invoices table and the monitor cards as they stand. The additional-invoice,
  split and credit sheets follow the existing admin sheets (`ContractEditSheet`, `PriceOverrideSheet`).
- `docs/design/Mobile App.dc.html`: the Booking detail, for the one-line caption that replaces "Add
  post-op event" on a locked Booking. The web app reuses the shared body.

**Catalogue items:** the covered and context files listed above. US-08.6.1's four images are the
retired addendum flow (stale).

**Analysis files:**

- `docs/prototype-build/catch-up/GAP-ANALYSIS.md`: theme 8 (money side), the US-08.6.2 and US-08.6.3
  entries, the DM-18 and DM-24 rows, the RV-10 row, the S4 line under "Demo impact", the
  "Demo-trigger buttons" section, and the EP-08 table with its structural note.
- `docs/prototype-build/catch-up/epics/EP-08.md` (FT-08.6, US-08.6.1 to US-08.6.4).
- `analysis/domain-model-delta.md` DM-18, DM-24 (and DM-22 and DM-27 for the ledger and invoice
  entities this phase extends, DM-07 for combination Contracts, DM-25 for what 39a does with the
  negative invoice); `analysis/reverse-check.md` RV-10.
- `analysis/prototype-map-admin.md` (sections 6 Invoices and 7 Billing monitor),
  `prototype-map-shared.md` (the shared Booking detail body), `prototype-map-store-seed.md` (billing
  slices, counters, selectors), `prototype-map-domain.md` (invoice build) and
  `prototype-map-shell-demo-pwa.md` (the Control Panel's "Stage post-op scenario", the Xero sim pair
  detail).

**Code entry points** (line numbers are from 501b0b8 and still held at 501b0b8; phases 14 to 38
will have moved them, and 36 deleted or renamed `BillingCase`, `BillingReceipt`, `retryBillingCase`,
`handoffCase` and `casesForList`: see the drift check's name list, and use the current names):

- The addendum to remove: `src/store/cardActions.ts` `addPostOpAddendum` 252 to 380 (after 15,
  `bookingActions.ts`), exported at `src/store/index.ts:73`; its test `src/store/postOpAddendum.test.ts`;
  `src/domain/types.ts` `Card.cardType` / `addendumOfCardId` 382 to 389; `src/shared/audit/fieldLabels.ts:28`
  and 29; `src/domain/seed/audit.ts:122` and 123; `src/shared/card/CardDetailBody.tsx` (import 11,
  `Stethoscope` in the import on line 2, `postOpMsg` 156, `doAddPostOp` 462 to 470, the addendum
  banner around 509, the "Add post-op event" block 720 to 737); `src/shared/surface/context.ts` 86
  and 92 (comments); the Control Panel's staging card `src/apps/demo/DemoControlPanel.tsx` 177 to 192,
  297 to 313 and the S4 scenario text 415 to 421 (re-homed by 14 to `stage-post-op` in
  `src/shared/demoTriggers/registry.ts`).
- Invoices and the run: `src/domain/types.ts` `Invoice` 662, `InvoiceLine` 678, `BillingCase` 697,
  `BillingReceipt` 742, `XeroAccRec` 769 (the unused `'voided'` status 777), `XeroAccPay` 780;
  `src/store/billingRun.ts` (`runBillingForList`, `retryBillingCase` 285, 22's `materialiseInvoices`,
  22's `resendInvoice`); `src/domain/billing/invoiceBuild.ts` (the `negativeTotal` belt 408 to 420,
  which stays); `src/store/mutate.ts` `ID_FORMATS` 61 and `allocateId` 99.
- Xero and money: `src/store/xeroHandoff.ts` `handoffCase` 153 (the fault path 174, the pair
  creation after it); `src/store/paymentActions.ts` `receivePayment` 78;
  `src/store/payablesActions.ts` `payablesDue` 35, `runPayables` 146, `disbursePayable` 160;
  `src/apps/demo/xeroPairView.ts`; `src/apps/demo/DemoXero.tsx` (`PairDetail` 222, the "Voided"
  label 647).
- Admin screens: `src/apps/admin/screens/InvoiceDocument.tsx` (the document, `InvoiceInfoRail` 232,
  `RailCard` 328, `XeroReference` 386); `src/apps/admin/screens/InvoicesScreen.tsx`;
  `src/apps/admin/screens/AdminCardDetail.tsx` (after 15, the admin Booking detail);
  `src/apps/admin/screens/BillingMonitorScreen.tsx`; `src/apps/admin/routes.tsx`
  (`AdminInvoicesRoute` 172) and `src/apps/admin/AdminApp.tsx` (section mapping, nav paths).
- Mobile and web: `src/apps/mobile/screens/CardDetailScreen.tsx` and
  `src/apps/web/screens/CardDetailView.tsx` (after 15, the Booking detail screens), both over the
  shared body (only the caption changes there).
- Store plumbing: `src/store/appStore.ts` (`PERSIST_VERSION` 130, at 13 at plan time; `AppState`
  billing and xero slices), `src/store/persistMigrate.test.ts`, `src/store/selectors.ts`
  (`invoicesForList`, `casesForList`, the monitor selector, `isBackdropInvoice`, 16's `bctiRecords`),
  `src/store/index.ts`.
- Seed: `src/domain/seed/cards.ts` 763 to 780 (Sarah Mitchell's first episode on Dr Sharma's Tue 14
  Jul AM List, Christchurch Public, Health NZ, `HNZ-2026-3102`), `src/domain/seed/cast.ts` (Dr Sharma;
  Southern Cross `HOSP.sx` at 105), 23's combination Contract in `src/domain/seed/contracts.ts`,
  `src/domain/seed/history.ts` and `billing.ts` (no change expected).
- Tests to extend or replace: `store/billingRun.test.ts`, `store/xeroHandoff.test.ts`,
  `store/xeroNhi.test.ts`, `store/paymentActions.test.ts`, `store/payablesActions.test.ts`,
  `store/persistMigrate.test.ts`, `store/demoScenarios.test.ts`, 14's
  `shared/demoTriggers/demoTriggers.test.ts`, 16's BCTI count tests, 25's lock and regenerate tests,
  36's `ledger.test.ts`, and the Playwright specs under `visual/` (`admin-phase08.spec.ts`,
  `admin-phase09.spec.ts`, `xero-pair.spec.ts`).

## Work items

### Session 1: the free-form additional invoice

1. **Model** (`domain/types.ts`). DM-18.
   - `Invoice.kind` widens to include `'additional'`. `Invoice.lineage` roles gain `'additionalTo'`
     (an additional invoice points at the original invoice). Add `additionalOf?: { bookingId;
     procedureId; originalInvoiceId }` only if 22's `procedureIds` plus the lineage entry do not
     already carry all three; prefer the lineage entry and `procedureIds`.
   - `FreeFormLine { description; quantity; unitAmount; amount }`: amounts in cents, GST exclusive
     like every stored price; `amount = round(quantity x unitAmount)`.
   - `AdditionalInvoiceBasis`, stored on the additional invoice (it is its own record of what was
     billed, so Phase 25's Regenerate can reproduce it): `{ lines: FreeFormLine[]; party:
     CounterpartyRef; invoiceEmail; partyChangedFrom?: CounterpartyRef; createdBy: { who; role };
     split?: { creditNoteId; componentIndex } }` (`split` is set in session 2).
   - Remove `bookingType` and `addendumOfBookingId` from the Booking (work item 4 deletes the users).
2. **Pure free-form pricing** in a new `src/domain/billing/additionalInvoice.ts`, re-exported from
   the billing index, Vitest-covered (convention 9):
   - `ADDITIONAL_INVOICE_RULES`, the one OQ-72 constant (drift check step 4), commented
     "OQ-72 recommendation, provisional".
   - `priceFreeFormInvoice(lines, { gstTreatment })`: per line `amount = round(quantity x
     unitAmount)`; `subtotal`, `gst` and `total` by Phase 22's presentation rules for the original
     invoice's `gstTreatment`. No Contract, unit value, modifier or RVG input: there is no pricing rule
     to apply (D10). Returns `{ kind: 'priced'; lines; subtotal; gst; total }` or `{ kind: 'refused';
     code; message; lineIndex? }` for: no lines ("Add at least one line."), an empty description
     ("Each line needs a description."), a quantity of zero or less, a unit amount of zero or less (a
     discount line is not offered while `lineText` is `'description'`), and a total of zero.
   - Tests (worked figures): one line "Post-op ward review, Wed 15 Jul, 15 min", quantity 1 at $30.00
     is $30.00 ex GST; quantity 2.5 at $12.34 rounds to the cent; three lines sum exactly; GST
     inclusive and exclusive treatments; every refusal; determinism (identical output on repeat);
     and a guard that the module imports nothing from the fee, Contract or RVG modules.
3. **Store: create an additional invoice** (a new `src/store/additionalInvoiceActions.ts`, exported
   from `store/index.ts`). US-08.6.1, US-08.6.3.
   - `createAdditionalInvoice(api, actor, { bookingId, procedureId, party?, invoiceEmail?, lines })`.
     Office only (`officeOnly`). Refusals, each with a plain sentence: `notInvoiced` (the Booking's
     List is not AUTHORISED and billed, or the Procedure has no live invoice: "This Procedure has no
     invoice yet. Resolve its billing first."), `bookingCancelled`, `procedureCancelled`, a party
     whose delivery (22's `deliveryPlanFor`) is email but who has no invoice email ("Add an invoice
     email for this billable party."), and every pricing
     refusal from item 2. A party other than the original's is allowed (`anyBillableParty`), recorded
     as `partyChangedFrom` and audited; no reason is required (free form: "AA staff can bill whatever
     the case needs").
   - **The original invoice** is `liveInvoiceForProcedure(state, procedureId)`: the live (not
     credited) standard, balance or additional invoice whose `procedureIds` include it, preferring
     the standard or balance invoice, else the Procedure's prepayment invoice when that is its only
     invoice (a fully prepaid Booking). After a credit and rebill it is the rebill. Where 22's payment
     setting split the Procedure across two invoices, the original is the one for the chosen party,
     else the first by number.
   - **No approval step, no List event, no billing-run re-entry.** One `mutate()` (actor the office
     user, source office): allocate the invoice through 22's `materialiseInvoices` (so id, number,
     `supplier`, `agent`, `gstTreatment` and `delivery` stamped from `deliveryPlanFor` are identical to
     a run-raised invoice; the layout, delivery and GST treatment come from the original invoice, never
     its prices), `procedureIds: [procedureId]`, the `additionalTo` lineage, the `additionalBasis`;
     create 36's Booking pair through `newBookingPair` (kind `'procedure'`; receivable from the party,
     payable to the Procedure's locked payee from 25 for the same total, per 16; no `BillingCase`,
     which 36 deleted). Audit entries: `invoice.additionalCreated` (after: number, original invoice
     number, Procedure, party, lines, totals) on the invoice; `invoice.partyChanged` (before and
     after) when the party differs; 22's `invoice.sent` / `invoice.portalQueued` / `invoice.notSent`;
     36's `ledger.pairCreated`. The Booking, its Procedures, its lock and the original invoice are not
     written (US-07.3.2).
   - After the commit, call 36's `handoffPair` for the new pair (the Xero pair, 16's `invoiceNumber`
     and `-P`), as the billing run does. A handoff fault leaves the invoice and its pair valid
     (`pair.handoffFailure`, "Not yet in Xero") and the monitor's Resolve and retry picks it up.
   - **Derived back-links** (selectors, never stored on the original): `additionalInvoicesFor(state,
     invoiceId)`, `additionalInvoicesForProcedure(state, procedureId)`, `originalInvoiceFor(state,
     invoiceId)`.
   - **BCTI feed** (16's count): the additional invoice's ACCPAY appears in `bctiRecords` through the
     same rule as any ACCPAY (or payable leg, if 36 re-pointed it), counted once against the payee.
     Extend 16's count test: one additional invoice adds exactly one BCTI for its month; nothing else
     counts it.
   - Tests (`additionalInvoiceActions.test.ts`): raised on Sarah Mitchell's staged original with the
     right number, links, ledger pair and Xero pair; the original invoice, Booking, Procedures and
     lock are deep-equal before and after; refused for a non-office actor, a DRAFT or SUBMITTED List,
     an open billing exception with no invoice, a cancelled Booking or Procedure, a party without an
     invoice email; a different party is accepted and audited; two additional invoices on one
     Procedure both link back; an additional invoice on a prepaid-only Procedure links to the
     prepayment invoice; the audit trail has every entry above; Regenerate (Phase 25's
     `regenerateInvoiceFromLock`, extended in item 5) reproduces it identically; the BCTI count above.
4. **Remove the addendum Booking** (RV-10, retired behaviour). Delete, do not hide:
   - `addPostOpAddendum` and its export; `postOpAddendum.test.ts` (its immutability assertions move
     into item 3's tests); `bookingType` and `addendumOfBookingId` everywhere (types, `fieldLabels.ts`,
     `seed/audit.ts`, the Booking source mapping 15 added for the addendum path, 20's Contract copy
     for the addendum, 28's "create the addendum's List in today's open Slot" helper if nothing else
     uses it);
   - the addendum banner and the "Add post-op event" block in the shared Booking detail body, the
     `Stethoscope` import if unused, and the `postOpMsg` state. In the block's place, on an AUTHORISED
     and billed Booking on the anaesthetist surfaces only, one muted caption: "Charges after this List
     was invoiced are raised by the office as an additional invoice. This Booking stays locked."
     (Phase 39b replaces it with its "Add post-op event" on the Procedure.) No button, no record, no
     amount;
   - the comments in `shared/surface/context.ts` that name the addendum.
   - Grep `src` and `visual` for `addendum|postOp|PostOp|post-op event|Add post-op`: the only hits
     left are the modifier labels if Phase 19 kept any, and this phase's caption. Zero hits of
     `addPostOpAddendum`.
5. **Admin UI for the additional invoice.**
   - **Booking detail** (the shared body, office-gated as `OfficeBillingSetup` is): on each Procedure
     of an invoiced Booking, a secondary teal **Create additional invoice** button, with the
     Procedure's additional invoices listed under it ("AA-2026-0012 · Post-op ward review · $34.50 ·
     Emailed", each a link to the document). Disabled with the refusal sentence when
     `createAdditionalInvoice` would refuse for state reasons, and disabled while the Booking has
     unsaved changes (Phase 35).
   - **`AdditionalInvoiceSheet`** (new, `src/apps/admin/flows/`, office only): header "Additional
     invoice · {patient} · {Procedure}", "Additional to AA-2026-0007"; the billable party (default the
     original's, 21's billable-party picker for any other, with the invoice email; the "Provisional ·
     to confirm with AA" chip beside it); the lines editor (description, quantity, amount, the line
     total in mono; add and remove rows); the live subtotal, GST and total from
     `priceFreeFormInvoice`; and one primary teal **Issue additional invoice** button with the note
     "Issued now. No approval step; it is audited." Refusals show inline against the line or field. On
     success, navigate to the new invoice's document. The sheet is reused by the split (item 14) with
     one card per component, so build the lines editor and party field as one component.
   - **Invoice document** (`InvoiceDocument.tsx`): on an additional invoice, the heading keeps "TAX
     INVOICE" and a line under the number reads "Additional invoice · relates to AA-2026-0007 ·
     {Procedure}" (a link); the lines show description, quantity, unit amount and amount. On any
     invoice with additional invoices, a rail card **Additional invoices** lists them (derived), with
     a **Create additional invoice** button that opens the same sheet. Phase 25's Regenerate entry
     reads `additionalBasis` for an additional invoice: extend `regenerateInvoiceFromLock` (or add
     `regenerateAdditionalInvoice` and route to it) so it reports "identical" or the differences.
   - **Invoices screen**: a **Kind** column (Standard, Balance, Prepayment, Additional; credit notes
     join in session 2) and, for an additional invoice, "Additional to AA-2026-0007" under its number.
   - **Billing monitor**: the Booking row detail adds "+1 additional invoice" when one exists.
   - `data-shot` hooks: `additional-invoice-button`, `additional-invoice-sheet`,
     `invoice-additional-links`, `locked-booking-late-charge-caption`.
6. **Session 1 triggers, persistence and the stop point.**
   - Re-point 14's `stage-post-op`: unchanged routes and body (it authorises Dr Sharma's Tue 14 Jul
     AM List through `authoriseList`, so 25's lock is written and the run bills it); drop any part of
     the body that makes a free Slot for the addendum; new description "Authorises Dr Sharma's Tue 14
     Jul AM List so its invoiced Bookings can take an additional invoice"; result "Authorised and
     billed. Open Sarah Mitchell's Booking and use Create additional invoice on the Procedure.";
     disabled label "Already staged: use Create additional invoice on the Procedure".
   - Bump `PERSIST_VERSION` by one (the Booking loses two fields; invoices gain a kind and a basis).
     Extend `persistMigrate.test.ts`: a stale payload with an addendum Booking is discarded to the
     fresh seed. Two fresh seeds deep-equal. No seeded figure moves: S3's scripted invoices
     (AA-2026-0002, AA-2026-0005, AA-2026-0006 as 22 left them) and 16's BCTI counts are unchanged.
   - **Stop point:** `npm run build`, `npm run build:pwa`, `npx vitest run` green, and the session 1
     part of the manual checklist passes, before session 2 starts.

### Session 2: credit in full and rebill, the negative invoice, and the split

7. **Model** (`domain/types.ts`). DM-24, and the negative invoice that DM-25 nets.
   - `CreditNote`, in a new `billing.creditNotes` record: `{ id; creditNoteNumber; originalInvoiceId;
     bookingId; procedureIds; counterparty; supplier; agent; gstTreatment; lines: { description;
     quantity?; amount }[]; subtotal; gst; total; reason; cause: 'correction' | 'split';
     rebillInvoiceIds; negativeInvoiceId; issuedAtISO; issuedBy: { who; role }; delivery:
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
     the ACCPAYCREDIT (absent when the draft ACCPAY was voided). These names are the ones Phases 39a
     and 41 already plan against (`amount`, `cause`, `credit.recoveryDue`,
     `recoveryDueFromAnaesthetists`): keep them. Phase 39a adds its `nettings` and the carried-forward
     recovery (OQ-71); its open amount is `recoveryDue` less its nettings, never `amount`, because the
     offset part was settled at issue. 39a and 41 widen `cause`.
     A negative invoice is raised on **every** credit, not only after payout: US-08.6.2 makes the
     payable's reversal a negative invoice, and the domain model's glossary describes the after-payout
     case, where it has something left to net. When nothing was paid out it is settled at once
     (`status: 'offset'`) and never reaches 39a's run (a labelled reading, Decisions-log entry 6).
   - `Invoice.lineage` roles gain `'rebillOf'` (a rebill points at the invoice it replaces).
     `RebillBasis`, stored on each rebill: `{ creditNoteId; corrections: RebillCorrections; lock:
     BookingLock }` (the corrected lock the rebill was priced from; see item 9) or, for a rebilled
     additional invoice, a corrected `AdditionalInvoiceBasis`.
   - `RebillCorrections`: `{ party?; partyReason?; invoiceEmail?; requiredInputs?: Record<string,
     string>; contractId?; officeOverride?: { procedureId; amount; reason }[]; lines? (additional
     invoices only) }`.
   - Xero: `XeroCreditNote { id; type: 'ACCRECCREDIT' | 'ACCPAYCREDIT'; creditNoteNumber; againstId;
     contactId; total; allocated; status: 'authorised' }` in a new `xero.creditNotes`;
     `XeroAccRec.status` gains `'credited'` (the unused `'voided'` stays for 37's Xero-side void
     detection); `XeroAccPay.status` gains `'voided'` and `'credited'`.
   - `ID_FORMATS`: `creditNote` (`CRN`, pad 4), `creditNoteNumber` (`CN-2026-`, pad 4),
     `negativeInvoice` (`NEG`, pad 4), `xeroCreditNote` (`XCN`, pad 4).
8. **Pure credit rules** in a new `src/domain/billing/creditNote.ts`, Vitest-covered:
   - `creditInFull(invoice)`: the credit note's lines, subtotal, GST and total, mirroring the original
     exactly (same descriptions prefixed "Credit:", same amounts, same GST treatment). Full, even when
     one line was wrong (AC "Credit in full").
   - `reversalPlan({ total, received, released, disbursed })` (36's leg fields: `receivedAmount`,
     `releasedAmount`, `disbursedAmount`) returns `{ receivableCredited: total; negativeInvoiceTotal:
     total; offsetAgainstPayable: total - disbursed; releaseCancelled: released - disbursed;
     heldForPayer: received; recoveryDue: disbursed }`, all cents exact. The cases, test-pinned:

     | Original's money | Receivable leg | Payable leg and negative invoice | Left over |
     |---|---|---|---|
     | Unpaid | credited to zero | negative invoice for the total, all offset against the payable; nothing was released | nothing |
     | Part or fully paid, not paid out | credited; a credit of `received` is held for the payer | negative invoice all offset; the released amount is cancelled, so the payables run skips it | `heldForPayer` (refund or reuse is Phase 41) |
     | Paid out, partly or fully | as above | negative invoice: the undisbursed part offset, `recoveryDue = disbursed` left for the anaesthetist's next payment run | `heldForPayer`, and `recoveryDue` (netted by 39a) |
     | Handed off or not | as above | as above | the Xero plan (next bullet) differs, the ledger does not |

   - `xeroCorrectionPlan(accRec, accPay)`: an ACCRECCREDIT for the total, `allocated =
     min(total, amountDue - amountReceived)` (the rest stays unallocated, matching `heldForPayer`),
     the ACCREC becomes `credited`; a draft ACCPAY with nothing authorised is `voided`; an authorised
     or paid ACCPAY gets an ACCPAYCREDIT numbered `${creditNoteNumber}-P` for the total, allocated
     against what is still unpaid (the rest unallocated, matching `recoveryDue`, which 39a allocates against
     later bills), and becomes `credited`. No NHI, patient name or other personal information, only
     the hidden unique ID (OQ-30).
   - **The credit path in 36's pure ledger module** (`domain/billing/ledger.ts`, which 36 left able
     to take a credit but with no credit path; extend its tests in `ledger.test.ts`):
     - `applyCredit(pair, plan, { creditNoteId, negativeInvoiceId, atISO })` returns the new pair: the
       receivable leg gains `creditedAmount = total`; the payable leg gains `reversedAmount = total`
       and its `releasedAmount` is cut to `disbursedAmount` (money already paid out cannot be
       un-released); the pair gains `credit: { creditNoteId; negativeInvoiceId; atISO; heldForPayer;
       recoveryDue }`. Refused on a pair already credited and on an `aaFee` pair.
     - `applyReceipt` and `applyDisbursement` refuse a credited pair (`pairCredited`).
     - `pairStatusLabel` gains `credited`.
     - `ledgerPosition`: `receivablesOutstanding` subtracts `creditedAmount`; two new totals,
       `creditsHeldForPayers` (sum of `credit.heldForPayer` not yet refunded) and
       `recoveryDueFromAnaesthetists` (sum of `credit.recoveryDue` not yet netted); and the equation
       becomes `imbalance = receiptsHeld - payablesDue - creditsHeldForPayers +
       recoveryDueFromAnaesthetists` (the equation 41 extends with its trust hold). Both new terms are
       zero on an uncredited ledger, so 36's pinned figures do not move. `anaesthetistPosition` gains
       the anaesthetist's `recoveryDue`. 39a's netting reduces `recoveryDueFromAnaesthetists` as it
       nets.
     - `ledgerChecks`: `releasedNotReceived` and `receivedAboveAmount` read a credited pair against
       its credit (released equals disbursed; received may exceed the credited remainder), so a
       healthy credited pair raises no check.
     - Worked checks, one per case: half paid (received 50, released 50, disbursed 0: held 50,
       payables due 0, imbalance 0); fully paid, part paid out (received 100, released 100, disbursed
       40: receipts held 60, held 100, to net 40, imbalance 0); fully paid out (receipts held 0, held
       100, to net 100, imbalance 0).
   - Tests: the cases in cents, including odd cents and a half payment; `offsetAgainstPayable + recoveryDue
     === total`; `heldForPayer + (total - received) === total`; the plan for a draft, an authorised
     and a paid ACCPAY; the lines mirror the original for 1, 2 and 7 lines and for a GST-inclusive
     Contract; the ledger checks above; determinism.
9. **Pure rebill pricing** in a new `src/domain/billing/rebill.ts`:
   - `correctedLock(lock, corrections, ctx)`: a copy of the Booking's lock with the corrections
     applied. **The decision Phase 25 left open:** every field the admin did not change keeps the
     original's locked value, including the Contract version and the payee; a changed Contract is
     locked at its version in force on the List date (25's pricing-date rule), so a rebill never
     silently picks up a later price change. Labelled reading, recorded in the Decisions log.
   - `rebillDrafts(originalInvoice, correctedLock)`: runs 25's `priceBookingFromLock` and keeps only
     the drafts for the credited invoice's `procedureIds` and portion (22's payment setting). A party
     correction moves those drafts to the new party.
   - Guards, each a refusal with a sentence: a Contract change when another live invoice shares the
     credited invoice's Procedures ("Another live invoice covers these Procedures. Credit and rebill
     each one."); a Contract change outside 20's scope rule; a party change on one portion of a SPLIT
     payment setting (22: the portions are the Contract's); a lock the corrections make un-priceable
     (25's blockers, passed through); an office override without a reason.
   - For a credited **additional** invoice the rebill re-runs `priceFreeFormInvoice` on the corrected
     lines and party instead.
   - Tests: an identical re-issue prices to the same total; a corrected PO number changes only the
     reference; a party change re-addresses the rebill; an office override with its reason; a
     Contract change locks the List-date version, not a later one; each guard; an additional invoice
     rebill.
10. **Store: credit in full and rebill** (a new `src/store/creditActions.ts`, exported from
    `store/index.ts`). US-08.6.2, OQ-19, OQ-42.
    - `creditAndRebill(api, actor, invoiceId, { reason, corrections })`. Office only (labelled
      reading). Refusals: `reasonRequired`; `alreadyCredited`; `kindNotCreditable` for a prepayment
      invoice ("Crediting a prepayment invoice is not in this prototype yet.", Phase 41) and an AA-FEE
      invoice ("AA fee invoices are not credited here."); a balance invoice is creditable only if 27's
      balance builder is callable from the lock (else refuse it with the same sentence as a prepayment
      and record it); every guard from item 9.
    - **One engine commit** (one `mutate()`, actor the office user): allocate the credit note
      (`creditInFull`, `reversalPlan`, the delivery plan from 22 addressed to the original's party
      and invoice email), allocate the negative invoice to the original's payee (`offset` when
      `recoveryDue` is 0, else `toNet`), apply `applyCredit` to the original pair, materialise the rebill
      through `materialiseInvoices` with the `rebillOf` lineage and its `RebillBasis`, and create its
      pair through `newBookingPair` (audited `ledger.pairCreated`). Audit, each its own entry
      (US-13.5.2, "every step audited"): `invoice.credited` (office: reason, credit note number) on
      the original; `creditNote.create` (lines, totals, reversal plan); `creditNote.sent` /
      `creditNote.portalQueued` / `creditNote.notSent`; `ledger.receivableCredited`;
      `negativeInvoice.create` (number, anaesthetist, total, offset, to net);
      `ledger.payableReversed`; `invoice.rebilled` (the new number, the corrections with before and
      after, the reason) on the rebill; 22's `invoice.sent` for the rebill.
    - The original invoice record, its lines and the Booking are not written. "Credited", "Credited
      by CN-2026-0001" and "Rebilled as AA-2026-0013" are derived: `creditNoteForInvoice(state,
      invoiceId)`, `rebillsOf(state, invoiceId)`, `rebillOriginFor(state, invoiceId)`,
      `invoiceStanding(state, invoiceId): 'live' | 'credited'`, `negativeInvoicesFor(state,
      anaesthetistId)`. `liveInvoiceForProcedure` (item 3) skips credited invoices.
    - **BCTI feed:** the rebill's ACCPAY is a BCTI record; the credit note and the negative invoice
      are not; the original keeps its record (OQ-60 reading, beside `bctiRecords`). Extend 16's count
      test: a credit and rebill adds one BCTI.
    - After the commit, `handoffCorrection(api, creditNoteId)` (item 12).
    - Tests (`creditActions.test.ts`), one per `reversalPlan` case, driven through the real payment
      and payables actions: unpaid; half paid; fully paid and not paid out; fully paid and paid out by
      `runPayables`. In each: the credit note equals the original; the negative invoice equals the
      payable, with offset and to-net as the plan says; the ledger's whole position is in balance
      afterwards (36's imbalance figure is zero, with held credits and negatives to net shown as their
      own lines, not as imbalance); the anaesthetist's position moves by exactly the reversal; the
      rebill is a new number with a new pair; the original invoice is deep-equal before and after; a
      second credit of the same invoice refuses; the rebill itself can be credited and rebilled (a
      chain of two); every audit entry is present with source office or system as stated.
11. **Store: split a combined Procedure** (same file, or `additionalInvoiceActions.ts` if it reads
    better). US-08.6.4, OQ-53, OQ-72.
    - `splitCombinedProcedure(api, actor, { bookingId, procedureId, reason?, components: { party?;
      invoiceEmail?; lines }[] })`. Office only. Refusals: `notCombination` (the Procedure's locked
      Contract is not `isCombination`: "This Procedure is not on a combination Contract."), fewer than
      two components ("A split needs at least two invoices."), the original is a prepayment invoice
      ("Splitting a prepaid combination is not in this prototype yet.", Phase 41), the original
      already credited, and every refusal from items 2 and 3 per component.
    - **One engine commit**: when `ADDITIONAL_INVOICE_RULES.splitCreditsOriginal` (provisional, OQ-72),
      the original is credited in full exactly as item 10 does it (`cause: 'split'`, the negative
      invoice, `applyCredit`) but with **no rebill**; then one additional invoice per component through
      item 3's path (each with the `additionalTo` lineage to the original, `additionalBasis.split =
      { creditNoteId, componentIndex }`, its own number, pair and payable to the locked payee). The
      component totals are **not** checked against the bundle (AC "No forced total"). Audit
      `invoice.split` (component count, the bundle total and the component totals side by side) plus
      the credit and per-invoice entries above. If the constant is false, only the additional invoices
      are raised and the original stays live.
    - The component lines are prefilled by the sheet (item 14) from `combinationParts(contract,
      masters)`: one line per part, quantity 1, amount blank. The store does not prefill.
    - BCTI feed: each component's ACCPAY is one BCTI (a three-way split adds three; the credited
      original keeps its record).
    - Tests: a three-way split of the staged combination raises three linked additional invoices with
      their own pairs, credits the original in full with its negative invoice, and leaves the ledger in
      balance; component totals above and below the bundle both accepted; each refusal; with the
      constant false, no credit note; the Booking, Procedures, lock and original are deep-equal before
      and after.
12. **Store: the Xero correction, together** (`store/xeroHandoff.ts`).
    - `handoffCorrection(api, creditNoteId)`: one `mutate()` (actor "Xero handoff", source system)
      that applies `xeroCorrectionPlan` to the original pair (the ACCRECCREDIT, the ACCPAY void or
      ACCPAYCREDIT, the statuses) **and** creates every new pair the credit note names (the rebill's,
      or each split component's) by the same code path as 36's `handoffPair` (extract its
      mirror-creation body into a shared helper rather than calling a second mutate), so the reversal
      and the re-creation land together (AC "Both sides move"). Audit `xero.creditNoteCreated`
      (numbers, allocated and unallocated amounts), `xero.accPayVoided` or `xero.accPayCredited`, and
      `xero.pairCreated` for each new pair.
    - The fault path: `settings.failNextHandoff` faults the whole correction (nothing is reversed or
      created in Xero), records `xeroFailure` on the credit note and `handoffFailure` on each new pair,
      clears the flag, and the Billing monitor's `resolveAndRetry` routes a pair whose failure belongs
      to a correction to `handoffCorrection` (not `handoffPair`), so the retry reverses and re-creates
      together and is idempotent. A credit whose original was never handed off has nothing to reverse:
      it only creates the new pairs.
    - Guards elsewhere: `handoffPair` refuses a credited pair (`invoiceCredited`), so a pending
      handoff can never create a Xero pair after the credit; `receivePayment` (through
      `applyReceiptInto`) refuses a payment on a credited pair or `credited` ACCREC
      (`invoiceCredited`, "This invoice was credited. Record the payment against the rebill."), as
      Xero refuses payment on a fully credited invoice, and never turns it into an unmatched receipt;
      `payablesDue` reads the legs, so the cut release already drops the reversed payable, and
      `runPayables` / `disbursePayable` skip or refuse a credited pair through `applyDisbursement`.
      `runPayables` does **not** net a `toNet` negative invoice: it stays open for Phase 39a, which
      nets it in the next payment run.
    - If Phase 37 has run: engine-made credits and voids carry their credit note id, so 37's
      Xero-side void detector does not flag them; a correction made while 37's outage is simulated
      goes through its queue and backoff like any handoff; 37's `payBillsInXero` (which `runPayables`
      and `disbursePayable` became) refuses or skips a credited pair and a voided or credited ACCPAY,
      as its `xero-pay-bill` trigger already does for a voided pair. If 37's handoff note left its
      payment-against-a-credited-invoice divergence case (EP-09) to 39, add it to 37's detector here:
      a payment recorded in Xero against a `credited` ACCREC is flagged on the pair, never applied to
      the ledger. Otherwise 37 built it; confirm it reads this phase's `credited` status.
    - Tests: the correction and the new pairs in one commit (one rebill; three split components); the
      fault path and its retry; the payment and payables guards; a `toNet` negative invoice is left
      untouched by `runPayables`; `xeroNhi.test.ts` extended so no Xero credit note (ACCRECCREDIT or
      ACCPAYCREDIT) carries an NHI, a patient name or any other personal information, only the hidden
      unique ID (OQ-30, as 16 and 22 left the ACCREC and ACCPAY).
13. **Ledger views** (Phase 36's screens; extend, do not rebuild).
    - The whole-ledger view (36's `LedgerScreen`, `/admin/ledger`) shows the two new totals from
      item 8: **Credits held for payers** and **Negative invoices to net**, with the equation line
      extended to match. Neither counts as an imbalance. A credited pair's row shows the `credited`
      status label.
    - The per-anaesthetist view (`/admin/ledger/anaesthetists/:anaesthetistId`) lists the credit note,
      the negative invoice and the rebill in the trail in order (debit, credit, contra, new debit), and
      shows any amount to net with the caption "Nets in the next payment run".
    - The web financial position (38) needs no change: a credited invoice leaves Outstanding and the
      rebill joins it through the ledger (38's handoff note). Verify it; fix only a selector that reads
      invoices instead of the ledger. The anaesthetist sees the negative invoice on 39a's remittance
      advice, not here.
14. **Admin UI for credit and rebill, the split and the documents.**
    - **Invoice rail**: a new rail card **Correct this invoice** on a live standard, balance or
      additional invoice, with a secondary teal **Credit in full and rebill** button and the caption
      "For an AA-side error. The invoice is never edited: it is credited in full and a corrected
      invoice is issued. A disputed invoice with no AA error stays outstanding." Hidden on prepayment
      and AA-FEE invoices with the refusal sentence as a caption instead.
    - **`CreditAndRebillSheet`** (new, `src/apps/admin/flows/`): step 1 **Credit**: the original's
      number, party and total; the reason (required; quick chips "Wrong PO or reference", "Wrong
      billable party", "Wrong Contract", "Paid twice", plus free text); the money state from
      `reversalPlan` in plain words ("Unpaid: nothing to refund", "Paid $x: $x will be held for
      {payer}", "Dr X was paid $x: a negative invoice for $x nets in their next payment run"). Step 2
      **Rebill**: the corrections, prefilled from the original's lock (party with reason, invoice
      email, the Contract's required inputs such as the PO number, the Contract where allowed, an
      office override with reason; for an additional invoice, its free-form lines); the rebill total
      live from `rebillDrafts`; the trail preview "AA-2026-0007 debit $x · CN-2026-0001 credit $x ·
      negative invoice CN-2026-0001-P $x · AA-2026-0013 debit $y". One primary teal **Credit and
      rebill** button with a confirm step naming both numbers. On success, navigate to the credit
      note.
    - **`SplitCombinedSheet`** (new, `src/apps/admin/flows/`, reusing item 5's lines editor and party
      field): opened from **Split into additional invoices** on a Procedure whose locked Contract is a
      combination (Booking detail and the original invoice's rail), shown only there. Header
      "{Contract name} · split into additional invoices"; one card per component, prefilled from
      `combinationParts`, each with its party (default the original's) and lines; add or remove a
      component; the bundle total and the components' sum side by side with the neutral note
      "Components need not add up to the bundle price."; the note "The original invoice is credited in
      full" with the "Provisional · to confirm with AA" chip; one primary teal **Issue N invoices**
      button with a confirm step. On success, navigate to the credit note (or, with the constant false,
      the first component).
    - **Credited original**: a neutral "Credited" pill beside the number, a line "Credited in full by
      CN-2026-0001 on {date} · rebilled as AA-2026-0013" (or "· split into AA-2026-0014, 0015, 0016"),
      all links, and the money chips (paid in, disbursed) kept as they were at the time of the credit.
      Payment triggers on this invoice show their "Invoice credited" disabled state.
    - **Credit note document**: route `/admin/credit-notes/:creditNoteId` (`AdminCreditNoteRoute`,
      a `RequireEntity` 404 guard; the side nav keeps Invoices active). It reuses `InvoiceDocument`'s
      sheet with the heading **CREDIT NOTE**, "Credits AA-2026-0007 in full", the reason, the mirrored
      lines, "Total credited", the supplier and agent block from 22, and a rail with Delivery (22's
      label and the "Simulated send" badge, plus the caption "Xero does not send credit notes; the
      engine sends it"), **Negative invoice** ("CN-2026-0001-P to Dr Sharma · $x · offset against the
      unpaid payable", or "· $x nets in the next payment run"), Print, and a Xero card ("ACCRECCREDIT
      CN-2026-0001", "ACCPAYCREDIT CN-2026-0001-P" or "Draft ACCPAY voided", or "Xero correction
      failed · retry in Billing monitor"). No NHI.
    - **Rebill document**: a line under the number "Rebills AA-2026-0007 (credited by CN-2026-0001)".
      A split component's line reads "Additional invoice · part 2 of 3 of AA-2026-0007 · {Procedure}".
    - **Invoices screen**: credit notes join the table as rows of kind **Credit note** ("Credits
      AA-2026-0007"), linking to their document; the original's Status shows "Credited".
    - **Billing monitor**: a failed Xero correction shows on the Booking's row with Resolve and retry.
    - **Xero sim** (`DemoXero.tsx`, `xeroPairView.ts`): the pair detail shows the ACCRECCREDIT and
      ACCPAYCREDIT (or the void) with allocated and unallocated amounts, and links to the new pairs.
      The Invoices tab status reads "Credited".
    - `data-shot` hooks: `credit-rebill-button`, `credit-rebill-sheet`, `split-combined-sheet`,
      `credit-note-document`, `negative-invoice-card`, `invoice-credited-banner`, `xero-credit-note`.
15. **Session 2 triggers, persistence and copy.**
    - **Stage combined procedure** (new, `stage-combined-procedure`, Admin · Invoices, bar; body in
      `src/store`): on the List picked at the drift check, creates one Booking for a fixed patient
      with an explicit id (never from the generated pool) and one Procedure, abdominoplasty, on 23's
      "Southern Cross cosmetic combination" Contract, the patient the billable party, post-paid (not
      prepaid), then authorises and bills it through the real actions (`authoriseList`, the run,
      `handoffPair`) as `OFFICE_SIMULATION_ACTOR`. Result "Staged: a billed Southern Cross cosmetic
      combination. Open its invoice and use Split into additional invoices." with a link. Disabled
      "Already staged" once present. Deterministic ids through `allocateId`.
    - **Stage refund after payout** (new, `stage-refund-after-payout`, Admin · Billing monitor and
      Admin · Invoice, bar; body in `src/store`): on Admin · Invoice it acts on the invoice in the URL,
      on the Billing monitor on Sarah Mitchell's live invoice once `stage-post-op` has run. It records a
      full payment through 14's payment body and disburses that pair's payable through 36's
      `disbursePayable` path (or, if 37 has run, 37's `payBillsInXero` with the webhook delivered, so
      the payout is detected as 37 records it), so a following credit raises a negative invoice with an amount to net.
      Result "Paid in full and paid out to Dr Sharma. Credit it to see the negative invoice."
      Disabled: "Stage post-op scenario first", "Invoice credited", "Already paid out", or "AA fee and
      prepayment invoices are not credited here".
    - Re-point 14's `payment-full` / `payment-half` on Admin · Invoice and the Xero sim pair route:
      disabled "Invoice credited" on a credited invoice (the store guard backs it). 14's PWA
      `pwa-payment-full` / `pwa-payment-half` on Mobile · Balances read `openAccRecs`: confirm a
      credited ACCREC drops out of its choices.
    - Re-point 25's `regenerate-invoice`: an additional invoice regenerates from its basis, a rebill
      from its `RebillBasis`; not registered on the credit-note route.
    - Bump `PERSIST_VERSION` by one again (new slices `billing.creditNotes`, `billing.negativeInvoices`,
      `xero.creditNotes`, new counter kinds, widened statuses), and extend the migrate test. If session
      1 and session 2 ship as one change, one bump for the phase is enough; record the from and to.
    - Copy sweep of `src` for "addendum", "post-op event" (only 39b brings it back), "credit note is
      out of scope", "BCTI credit" and any em or en dash in the new strings. Leave the `negativeTotal`
      message as it is unless 27 or 41 already reworded it (OQ-03: an overpaid prepayment is accepted
      with no credit; Phase 41 owns that copy).
    - Playwright: a new `visual/admin-phase39.spec.ts` (the Booking detail with the button, the
      additional-invoice sheet, an additional invoice document with its link, the credit-and-rebill
      sheet, a credit note document with its negative invoice card, a credited original, the split
      sheet and one split component, the Xero pair with its credit note) and a mobile shot of the
      locked Booking caption. Update any spec that shot the addendum.
16. **Tests and docs close-out.** 14's `demoTriggers.test.ts` covers the two new entries and the
    re-pointed ones (routes, surfaces, disabled states, `pwaPurity`); `demoScenarios.test.ts` covers
    the rewritten S4 Beat 2 end to end at store level (stage, additional invoice, credit and rebill,
    the paid-out variant with its negative invoice, and the split); 16's count test covers every new
    record; then the demo guide (below) and PROGRESS.

## Demo triggers

The three headline actions are **product UI**, not demo triggers (the ROADMAP names the first two):
**Create additional invoice** on a Procedure of an invoiced Booking in Admin (Booking detail and the
invoice document), **Credit in full and rebill** on the Admin invoice document, and **Split into
additional invoices** on a Procedure on a combination Contract. What the registry gains or changes:

| Label | Screen | Surface | Effect |
|---|---|---|---|
| Stage post-op scenario (re-homed, `stage-post-op`) | Admin · Review and Admin · Booking detail, Dr Sharma's Tue 14 Jul AM List only | bar | Kept only to authorise and bill the seeded original. Result: "Authorised and billed. Open Sarah Mitchell's Booking and use Create additional invoice on the Procedure." Disabled "Already staged: use Create additional invoice on the Procedure" |
| Stage combined procedure (new, `stage-combined-procedure`) | Admin · Invoices | bar | A billed, post-paid Southern Cross cosmetic combination (abdominoplasty on 23's combination Contract, patient billable), so its invoice can be split three ways. Disabled "Already staged" |
| Stage refund after payout (new, `stage-refund-after-payout`) | Admin · Billing monitor (Sarah Mitchell's live invoice) and Admin · Invoice (the URL's invoice) | bar | Marks the invoice paid in full and its payable disbursed, so its credit raises a negative invoice with an amount to net. Disabled with the reasons in work item 15 |
| Payment received · full / half (re-pointed) | Admin · Invoice and the Xero sim pair (`/demo/xero/invoices/:accRecId`) | bar | Disabled "Invoice credited" on a credited invoice; unchanged otherwise |
| Regenerate from locked data (re-pointed, `regenerate-invoice`) | Admin · Invoice | bar | Also regenerates an additional invoice from its basis and a rebill from its corrected lock; reports "identical" or the differences |

PWA parity: this phase has no mobile beat. The anaesthetist's late-charge path is Phase 39b's post-op
event (with its "Office approves this event" stand-in), and the negative invoice reaches the
anaesthetist on Phase 39a's remittance advice. The only mobile change is the locked Booking's
caption, which needs no trigger. Credit, rebill and the split are office actions in Admin; in the
framed build the presenter plays the office there. The Control Panel page gains nothing; its index
lists the two new entries under their screens automatically.

## Out of scope

- **The anaesthetist's own late charges** (post-op events, dated and typed billing lines, Contract
  add-on fee lines; FT-03.7, US-03.3.6): Phase 39b. This phase only removes the addendum and leaves a
  caption.
- **Netting the negative invoice** in the payment run, the remittance advice, period BCTI approval
  and the no-later-payment case (US-10.2.5, US-10.2.6, OQ-71): Phase 39a. This phase raises the
  negative invoice and leaves its `recoveryDue` part open.
- **Refunding or reusing a held credit** (money a payer paid on a credited invoice), applying it to
  the rebill, and any trust-account movement: Phase 41. This phase records `heldForPayer` only.
- Crediting a **prepayment** invoice (Phase 41: refund on cancellation), splitting a **prepaid**
  combination (US-08.6.4's usual case: it needs 41's credit of a prepayment invoice, so it is handed
  to 41 in the handoff notes and recorded in the PROGRESS entry as a known gap until then; the
  post-paid fixed-price combination is built here), or crediting an **AA-FEE** invoice (a follow-up to 16; no catalogue item
  asks for it yet).
- **Partial credits** and editing or voiding an issued invoice in place: never, by policy (OQ-28).
- **Credit without rebill** as a standalone action. The catalogue's rule is credit in full, then
  rebill; the split's credit of the original (OQ-72's recommendation) is the only credit with no
  rebill, because its components replace it. If AA asks for a credit-only path, it becomes a
  catalogue item first.
- **A fallback to the patient** when a hospital or holder disputes an invoice with no AA error
  (OQ-19: it stays an outstanding invoice).
- An **approval step** for any of the three actions (US-08.6.3: none), and a second-person check.
- **Contract pricing, unit rules or the anaesthetist adjustment** on an additional invoice (D10:
  free form).
- A **discount line** on an additional invoice, unless OQ-72 is answered "discount".
- A real email, portal upload or Xero API; the Xero side stays the simulation.
- A credit, negative-invoice or additional-invoice view for the anaesthetist (no amounts, per the
  2026-09-28 ruling); 39a's remittance advice is where the anaesthetist sees a negative invoice.
- Changing the AA fee for credited collections: the fee reads BCTIs per 16, and the OQ-60 reading
  above is the only change.

## Manual test checklist

Session 1 (after **Reset → Confirm reset**):

- [ ] Admin · Review for Dr Sharma's Tue 14 Jul AM List: Demo actions shows **Stage post-op
      scenario**; it authorises and bills the List, and a second press says "Already staged". On any
      other List it does not appear.
- [ ] Admin · Booking detail for Sarah Mitchell (Tue 14): the Procedure shows **Create additional
      invoice**. On a DRAFT or SUBMITTED Booking it is absent; on a Booking whose billing failed it is
      disabled with the refusal sentence.
- [ ] The sheet defaults the party to the original invoice's party and shows no Contract, unit or
      modifier field. Add a line "Post-op ward review, Wed 15 Jul, 15 min", quantity 1, $30.00: $30.00
      ex GST shows live, with GST as on the original. An empty description, a zero quantity or a zero
      amount is refused inline.
- [ ] Change the party to another billable party: the invoice email is asked for, the provisional
      chip shows, and no reason is demanded.
- [ ] **Issue additional invoice**: it lands on a new invoice document with a new `AA-2026-` number,
      "Additional invoice · relates to AA-2026-...", the free-form line, and Xero "ACCREC and ACCPAY
      created" with the `-P` payable. No approval step was asked for.
- [ ] The original invoice shows an **Additional invoices** rail card listing it; the original's
      lines, total and number are unchanged; the Booking is still locked and unchanged in its
      History.
- [ ] Admin · Invoices shows the new row with Kind **Additional** and "Additional to AA-2026-...".
      The Billing monitor row says "+1 additional invoice". Phase 36's ledger shows its own pair. 16's
      AA fee screen counts one more BCTI for Dr Sharma for the month.
- [ ] Demo actions on the additional invoice, **Regenerate from locked data**: "identical".
- [ ] Nowhere in the three apps is there "Add post-op event" or an addendum banner; mobile and web on
      an authorised Booking show the one-line caption, with no amount and no button.
- [ ] Stop point: `npm run build`, `npm run build:pwa` and `npx vitest run` green.

Session 2 (after **Reset**, stage, and one additional invoice as above):

- [ ] On Sarah Mitchell's original invoice, **Credit in full and rebill**: step 1 needs a reason and
      says "Unpaid: nothing to refund". Step 2: correct the PO number; the rebill total equals the
      original; the trail preview names four entries.
- [ ] Confirm: it lands on the **CREDIT NOTE** `CN-2026-0001`, "Credits AA-2026-... in full", the
      mirrored lines and total, Delivery "Emailed to ..." with "Simulated send" and the Xero caption,
      the **Negative invoice** card "CN-2026-0001-P to Dr Sharma · offset against the unpaid
      payable", and Xero "ACCRECCREDIT CN-2026-0001" and "Draft ACCPAY voided".
- [ ] The original shows **Credited**, "Credited in full by CN-2026-0001 · rebilled as AA-2026-...",
      its number and lines unchanged; the rebill shows "Rebills AA-2026-..." and the corrected PO
      number, with its own pair. Admin · Invoices shows all three rows with their kinds.
- [ ] Phase 36's whole ledger stays in balance; the per-anaesthetist trail for Dr Sharma reads debit,
      credit, contra, new debit. The Audit viewer shows every step as its own entry.
- [ ] Payment received on the credited original is disabled "Invoice credited".
- [ ] Paid-out case: on the rebill, Billing monitor **Demo actions → Stage refund after payout**
      (or **Payment received · full**, then **Run payables**), then **Credit in full and rebill**
      with "Paid twice": step 1 shows the held credit and "Dr Sharma was paid $x: a negative invoice
      for $x nets in their next payment run". After confirming, the ledger shows "Credits held for
      payers" and "Negative invoices to net" with zero imbalance, the credit note's Negative invoice
      card says "nets in the next payment run", the Xero sim shows the ACCPAYCREDIT, and the next
      **Run payables** pays nothing for the credited pair and leaves the negative invoice open.
- [ ] Admin · Invoices, **Demo actions → Stage combined procedure**: a billed Southern Cross cosmetic
      combination appears. On its Procedure, **Split into additional invoices** prefills three
      components (abdominoplasty, breast lift, liposuction); give amounts that do not add up to the
      bundle and Southern Cross as one party: accepted with the "need not add up" note. Confirm:
      three additional invoices, each linked to the original and with its own Xero pair; the original
      is credited in full by a credit note with no rebill; the ledger stays in balance; the AA fee
      count rises by three.
- [ ] Arm handoff failure, then credit and rebill another invoice: the credit note shows "Xero
      correction failed"; the Billing monitor's Resolve and retry completes both the reversal and the
      new pair.
- [ ] Credit the rebill again (a chain): refused on the original ("already credited"), allowed on the
      rebill.
- [ ] A prepayment invoice and an AA-FEE invoice show no Credit button, with the reason; a
      non-combination Procedure shows no Split button.
- [ ] Web Accounts (Dr Souter, after crediting one of her S3 invoices): the credited invoice leaves
      Outstanding and the rebill joins it; no amounts moved elsewhere.
- [ ] Xero sim: no NHI on any credit note; pair detail shows allocated and unallocated amounts.
- [ ] No en or em dash in any new app string; teal is the only action colour on the new sheets and
      rails; no crimson and no red on the credit note or negative invoice.
- [ ] Catalogue screenshots: the recipes for US-08.6.1, US-08.6.2, US-08.6.3 and US-08.6.4 are created or updated, any recipe this phase broke is re-pointed, a full `npm run capture` ends with no failed recipe and no story without a recipe, the covered items' new shots are checked by eye, and `npm run verify:board` is green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots` and `npm run verify:board` green.

## Demo guide updates

S4 Beat 2 is rewritten here (the ROADMAP gives it to this phase). This is not a milestone phase
(39a is, and runs the consistency read of `master-demo-guide.html` after the payment runs land), so
patch the sections below and spot-check that the master guide's S4 Beat 2 matches the run sheet.

- **`03-demo-script.md`:**
  - **S4 Beat 2** becomes "Beat 2: additional invoice, then credit in full and rebill":
    - Click: on Admin Review (or the Booking) for Dr Sharma's Tue 14 Jul AM List, **Demo actions →
      Stage post-op scenario**; open **Sarah Mitchell → Create additional invoice**; add "Post-op
      ward review, Wed 15 Jul, 15 min", 1 x $30.00; **Issue additional invoice**; show the link on the
      original. Then on the original invoice, **Credit in full and rebill**, reason **Wrong PO or
      reference**, correct the PO number, confirm; show the credit note with its negative invoice, the
      credited original and the rebill, then the Xero sim pair.
    - Say: "A ward review the day after surgery does not reopen the Booking. The office raises an
      additional invoice on the Procedure: free form, its own number, its own receivable and payable,
      its own Xero pair, linked both ways, no approval step. And when we got an invoice wrong, we never
      edit it: we credit it in full and rebill. The anaesthetist's side is reversed by a negative
      invoice, and both sides move, in our ledger and in Xero."
    - Expected: the additional invoice with its link, the original unchanged; the credit note, the
      Credited original, the rebill with a new number; the ledger in balance.
    - Optional aside (paid-out case): **Stage refund after payout** on the Billing monitor, then
      credit: "Once the anaesthetist has been paid, the negative invoice is netted in their next
      payment run." (39a adds the netting beat.)
    - Optional aside (split): **Stage combined procedure** on Admin · Invoices, then **Split into
      additional invoices** three ways: "Southern Cross wants it in three pieces. Three invoices, any
      amounts, the bundle credited."
    - Fill in the actual invoice and credit note numbers from a reset run.
  - The **Direct URLs** table gains "One credit note · `/admin/credit-notes/<creditNoteId>`".
  - The S4 discovery points gain OQ-72 (description or discount, any billable party, credit the
    original on a split) and OQ-71 (no later payment to net against), each one line; drop any OQ-42,
    OQ-45 or OQ-51 line (answered or deleted).
- **`02-workflows-and-handoffs.md`:** the "Post-operative addition" case is rewritten (the office
  raises a free-form additional invoice; the original stays locked; the anaesthetist's own post-op
  events come with 39b); a new "Correction after invoicing" case (an AA-side error is credited in
  full, then rebilled; the payable is reversed by a negative invoice netted in the next payment run);
  a new "Splitting a combined procedure" case; the readiness table row "Pre-payment, addendum,
  billing monitor/retry" is reworded to "additional invoices, credit and rebill, split".
- **`04-presenter-cheat-sheet.md`:** "Built and clickable" loses "post-op addendum" and gains
  additional invoices, credit and rebill and the split; "The money model" gains one line on the trail
  (debit, credit, contra, new debit) and one on the negative invoice; "Strong phrases" gains "We never
  edit an issued invoice; we credit it in full and rebill"; "Statements to avoid" gains "the
  anaesthetist raises a post-op Booking" and "a BCTI credit".
- **`01-personas-and-responsibilities.md`:** the office's responsibilities gain raising additional
  invoices, splits and credit notes.
- **`README.md`:** the readiness row is reworded.
- **`master-demo-guide.html`:** the same sections (the readiness row, the exceptions paragraph, S4
  Beat 2, the cheat-sheet equivalents).
- **Control Panel scenario text:** the S4 scenario's message (re-homed by 14) replaces "stage
  post-op ... Add post-op event" with "stage post-op, then Create additional invoice and Credit in
  full and rebill on Sarah Mitchell".

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19),
run after the review pass and before the PROGRESS.md entry. Re-run
`node docs/prototype-build/catch-up/tools/recipe-status.mjs 39` first: earlier phases may have
changed these recipes since this plan was written.

**Covered items.** When the phase is done, each recipe in `requirements-board/capture/recipes/`
matches what was built:

| Item | Recipe at plan time | When this phase is done |
|---|---|---|
| [US-08.6.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.6.1.md) Additional invoice for late billing lines | partial · web-post-op-event, mobile-post-op-event, admin-post-op-addendum[locked,added] | captured (admin half). The old shots show the retired "Add post-op event" addendum, so rebuild them. Admin `post-op-addendum` becomes the Create additional invoice flow: start at the invoiced Booking's Procedure on Dr Sharma's Tue 14 Jul AM List (run the `stage-post-op` bar action first, then open Sarah Mitchell's Booking), `locked` state highlights `[data-shot=additional-invoice-button]`, `added` state fills `[data-shot=additional-invoice-sheet]` with "Post-op ward review, Wed 15 Jul, 15 min" at $30.00 and issues it, highlighting `[data-shot=invoice-additional-links]`. Keep the shot names `post-op-event` (web, mobile) and `post-op-addendum` (admin). Web and mobile `post-op-event` now show the locked Booking's one-line late-charge caption (`[data-shot=locked-booking-late-charge-caption]`); Phase 39b swaps it for the anaesthetist's Add post-op event. Caption wording: "The office raises an additional invoice on a Procedure after the List is invoiced". Drop the "addendum card" partial reason; any anaesthetist-side remainder is handed to 39b |
| [US-08.6.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.6.2.md) Credit note and re-issue | absent | captured. Replace the absent reason. Admin `/admin/invoices/<id>` for a live invoice: shot `credit-rebill`, `rail` state highlights `[data-shot=credit-rebill-button]`, `sheet` state fills `[data-shot=credit-rebill-sheet]` (reason chip "Wrong PO or reference", the trail preview), `credit-note` state opens `/admin/credit-notes/<id>` highlighting `[data-shot=negative-invoice-card]`, `credited` state shows the original's `[data-shot=invoice-credited-banner]`. Use the `stage-refund-after-payout` bar action to show the paid-out variant with an amount to net. Simulator: `/demo/xero/invoices/<accRecId>` shot `xero-credit-note` highlighting `[data-shot=xero-credit-note]`. Captions in the catalogue's words: "Credit in full, then rebill", "The payable is reversed by a negative invoice to the anaesthetist" |
| [US-08.6.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.6.3.md) Create an additional invoice on a Procedure | absent · stub, no shots | captured. Replace the stub. Admin Booking detail (shared body) on an invoiced Booking: shot `additional-invoice-button` highlighting `[data-shot=additional-invoice-button]`; shot `additional-invoice-document` on the new invoice with `[data-shot=invoice-additional-links]` showing the link both ways (original lists its additional invoices, the new one links back). Caption "A Procedure on an invoiced Booking has a Create additional invoice button" |
| [US-08.6.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.6.4.md) Split a combined Procedure into additional invoices | absent · stub, no shots | captured. Replace the stub. Run the `stage-combined-procedure` bar action on Admin · Invoices, open its invoice, shot `split-combined`: `sheet` state highlights `[data-shot=split-combined-sheet]` with three component cards and the note "Components need not add up to the bundle price"; `result` state shows one split invoice linking back to the Procedure. If the prepaid-combination split stays refused (handed to 41), say so in the caption, not as a reason |

**Recipes this phase breaks.** Work item 4 and the Playwright note in item 15 cover the specs; the capture recipes found at plan time:
- `US-08.6.1` itself (all three shots click or scroll to the retired "Add post-op event" button and the text "A post-op charge (an HDU review ..."); rebuilt above.
- `US-03.3.6` and `US-05.1.5` mention post-op or addendum text in their recipes: grep `recipes/` for `post-op|Post-op|addendum|stage-post` and re-point any hit to the locked Booking caption or drop the step. Phase 39b owns `US-03.3.6`'s own shots.
- Any recipe that opens the admin invoice document or the Invoices table by column position (the new Kind column, the rail's Correct this invoice card): re-run `--dry` and fix by text, not position.
- Any recipe that opens Dr Sharma's Tue 14 Jul AM List and relies on the old `stage-post-op` freeing a Slot for the addendum (the trigger now only authorises the List).

**ATLAS.md.** Routes: add `/admin/credit-notes/:creditNoteId`. Seed data and Personas and IDs: the staged scenario (Sarah Mitchell's Booking after `stage-post-op`, the `stage-combined-procedure` and `stage-refund-after-payout` results and the invoice and credit note numbers they give). Existing hooks: the `data-shot` hooks named in work items 5 and 14. Overlays: the three new sheets.

## Adversarial review (after build)

Once the manual test checklist and `npm run build`, `npm run build:pwa`, `npx vitest run` and
`npm run shots` are green, and before writing the PROGRESS entry, run the standard **adversarial
review-and-fix pass (PROGRESS convention 18)**:

- fan out three independent Opus review subagents, one each for **quality**, **bugs/correctness** and
  **plan adherence** (scale to four, adding **money integrity**, as the Phase 08 to 10 money phases
  did, given the ledger, the negative invoice and the Xero reversal), each given the covered catalogue
  files, this doc and the diff;
- this session then independently verifies every finding against the catalogue, this doc and the
  code, fixes the confirmed ones (with a test wherever a bug had none), re-greens, and records the pass
  in the phase entry;
- do not re-raise anything already settled in the Decisions log (as amended by this phase).

**Steer this phase's reviewers at:**

- **Immutability.** No action writes the original Booking, its Procedures, its lock or the original
  invoice record and lines. Every back-link and the "Credited" state are derived. Hunt for any
  spread-and-overwrite of `billing.invoices[originalId]` or `billing.locks[bookingId]`.
- **Free form means free form.** `additionalInvoice.ts` imports no fee, Contract, unit or RVG module;
  the sheet shows no Contract picker; the amount is description x quantity x amount and nothing else;
  the OQ-72 readings live only in `ADDITIONAL_INVOICE_RULES`.
- **Money conservation.** For every `reversalPlan` case, in cents: credit note total equals the
  original's; the negative invoice equals the payable and `offsetAmount + recoveryDue` equals it;
  `heldForPayer` equals what was received; `recoveryDue` equals what was disbursed; 36's whole ledger shows zero imbalance
  afterwards; the anaesthetist's position moves by exactly the reversal and then the rebill. A
  payment on a credited ACCREC, a payables run over a reversed ACCPAY, and a late handoff of a
  credited invoice are all refused; `runPayables` leaves a `toNet` negative invoice open (39a nets
  it). GST activity (38) does not move on a credit.
- **BCTI count.** Every additional invoice, rebill and split component adds exactly one record to 16's
  `bctiRecords`; a credit note and a negative invoice add none; nothing else counts BCTIs.
- **Both sides together.** The Xero reversal and every new pair (rebill or split components) land in
  one commit or none does; the fault path leaves a retryable, visible state; the retry is idempotent;
  no NHI reaches a credit note.
- **Additional invoice rules.** Admin only; no approval step; no List event and no billing-run
  re-entry; any billable party, audited; its number comes from the ordinary sequence; Regenerate
  reproduces it; the anaesthetist adjustment is not offered.
- **Split rules.** Only on a combination Contract; at least two components; no forced total; the
  original credited in full with no rebill (while the constant says so); each component its own
  number, pair and payable, linked to the Procedure and the original.
- **Rebill rules.** Unchanged fields keep the original's locked values, Contract version and payee; a
  changed Contract locks at the List-date version and stays inside 20's scope rule; the
  Contract-change and payment-setting guards hold; a rebill can itself be credited; a prepayment or
  AA-FEE invoice cannot be.
- **Retired behaviour gone.** No `addPostOpAddendum`, `bookingType`, `addendumOfBookingId`, addendum
  banner, "Add post-op event", addendum Booking source, or addendum List helper remains; the stage
  trigger authorises only; the anaesthetist caption shows no amount or button.
- **Triggers.** The two new staging entries act on the URL's entity or the staged one, are bar only,
  are disabled with reasons, and keep their bodies in `src/store` so `pwaPurity` holds.
- **Determinism and persistence.** No `Date.now()`, `new Date()` or `Math.random()`; dates from the
  demo clock; `PERSIST_VERSION` bumped and the migrate test discards a stale addendum payload; two
  fresh seeds deep-equal; S3's scripted figures unchanged.
- **Design and copy.** The sheets and rails follow the admin patterns and tokens; teal is the only
  action colour; the credit note and negative invoice are neutral, never red or crimson; provisional
  labels only for OQ-72 (party and split credit); "negative invoice", never "BCTI credit"; no en or
  em dashes in app copy.

## PROGRESS.md updates

- **Status row** for catch-up Phase 39, and a phase entry with:
  - the drift-check result (items changed or not since 501b0b8; FT-08.6 and US-08.6.1 to US-08.6.4
    still Verify or not; OQ-60, OQ-71 and OQ-72 status; the List the combined-procedure trigger uses;
    the prepaid-combination split left refused, as a known gap against US-08.6.4 handed to 41);
  - what was built, with the name map for later phases: `FreeFormLine`, `ADDITIONAL_INVOICE_RULES`,
    `priceFreeFormInvoice`, `AdditionalInvoiceBasis`, `createAdditionalInvoice`,
    `liveInvoiceForProcedure`, `splitCombinedProcedure`, `CreditNote`, `NegativeInvoice`,
    `creditInFull`, `reversalPlan`, `xeroCorrectionPlan`, `applyCredit` and the extended
    `ledgerPosition` equation (`creditsHeldForPayers`, `recoveryDueFromAnaesthetists`), `correctedLock`,
    `rebillDrafts`, `RebillBasis`, `creditAndRebill`, `handoffCorrection`, `XeroCreditNote`, the
    derived back-link selectors, the new lineage roles, id formats, audit actions, route and
    triggers; and the removed `addPostOpAddendum`, `bookingType`, `addendumOfBookingId`;
  - the `PERSIST_VERSION` bump or bumps (from and to);
  - tests added and the before and after Vitest and Playwright counts;
  - the review pass.
- **Catalogue screenshots result:** recipes created or changed (US-08.6.1 to US-08.6.4, plus any recipe the addendum removal broke), the `capture/REPORT.md` counts (captured, partial, absent, failed) before and after, and any partial reason handed to a later phase.
- **Decisions log:**
  1. **Superseded:** 2026-07-24 "Phase 09, the four open-question readings", reading (3), the
     post-op addendum as a new linked Card with its own capture, submit, authorise and bill cycle.
     Late charges are admin free-form additional invoices on the Procedure with no approval step
     (OQ-24, OQ-45); the anaesthetist's own path is Phase 39b's post-op events (RV-10).
  2. **Amended:** the Phase 08 and 09 rulings that "a negative invoice is never raised; a real
     practice issues a credit note" and "the over-prepaid full case fails to the monitor (no
     credit-note issuance, out of scope)". The `negativeTotal` belt stays for drafts; corrections are
     now credit notes to the billable party with a negative invoice to the anaesthetist (OQ-42); the
     overpaid prepayment is accepted with no credit (OQ-03, Phase 41).
  3. **New:** D10 as built: an additional invoice is free form (description, quantity, amount) with
     no Contract pricing, unit rules or anaesthetist adjustment, numbered from the ordinary sequence.
     OQ-72's recommendation (description, any billable party, a split credits the original) is
     provisional and lives in `ADDITIONAL_INVOICE_RULES`.
  4. **New:** a credit note is its own record, not an invoice kind, so no invoice sum or count can
     include it; the original invoice is never written, and "Credited" and every link are derived.
  5. **New:** a rebill keeps every uncorrected locked value, including the Contract version and the
     payee; a changed Contract locks at its version in force on the List date (the question Phase 25
     left).
  6. **New:** the payable is reversed by a negative invoice to the anaesthetist on every credit
     (OQ-42, US-08.6.2; labelled reading: the domain-model glossary describes only the after-payout
     case): the part not yet paid out is offset at once, the part paid out (`recoveryDue`) is left to
     net in the next payment run (Phase 39a); a paid credited invoice leaves a credit held for the
     payer, refunded or reused in 41.
  7. **New:** the engine sends the credit note to the billable party through the invoice delivery
     plan (Xero does not send credit notes); a payment on a credited ACCREC is refused; credit and
     rebill is office only (labelled reading) and is the AA-error path (OQ-19).
  8. **New (provisional, OQ-60):** additional invoices, rebills and split components each add one BCTI
     to 16's count; credit notes and negative invoices are not BCTIs; a credited original keeps its
     count because it was issued.
- **Handoff notes:**
  - For **39a**: a `NegativeInvoice` with `status: 'toNet'` is what the payment run nets, for its
    `recoveryDue` (not its `amount`: the `offsetAmount` part was settled at issue, and an `'offset'`
    negative never enters a run); `recoveryDueFromAnaesthetists` in `ledgerPosition` and the
    anaesthetist's `recoveryDue` in `anaesthetistPosition` fall as it nets; its Xero mirror is the
    ACCPAYCREDIT `accPayCreditNoteId`, whose unallocated part is what 39a allocates against later
    bills; add the nettings and the carry-forward (OQ-71) and widen `cause`; the remittance advice
    lists them. Name the stage trigger (`stage-refund-after-payout`, Dr Sharma) and its result copy.
  - For **39b**: the locked Booking's caption is the place for "Add post-op event"; an event invoice
    reuses `materialiseInvoices`, a lineage role to the Procedure and the BCTI feed rule above; the
    additional invoice stays the admin's free-form path.
  - For **41**: reuse `CreditNote` (`cause` widens to the cancellation refund), `creditInFull`,
    `reversalPlan` and `NegativeInvoice`; `heldForPayer` is the balance a refund or trust-account
    movement settles; prepayment invoices and prepaid combinations are still refused by
    `creditAndRebill` and `splitCombinedProcedure`. US-08.6.4 says combinations are usually
    prepaid, so once 41's credit path takes a prepayment invoice, lift `splitCombinedProcedure`'s
    prepaid refusal (the split credits the prepayment invoice through that path, then raises the
    components). 41's plan does not list this yet: if 41 does not pick it up, 44 records it as an
    open gap against US-08.6.4.
  - For **40**: the patient view lists additional invoices, credit notes and rebills with their
    standing; a credited invoice is not unpaid for the unpaid-patient alert.
  - For **37**: engine credits and voids carry their credit note id and must not be flagged as
    Xero-side voids; corrections go through the outage queue.
  - For **38**: confirm (or note, if 38 ran first) that Outstanding drops a credited invoice and
    takes the rebill through the ledger.
  - For **43**: the credit and additional-invoice rows must stay usable at full scale.
  - For **44**: S4 Beat 2 as rewritten here; the OQ-60, OQ-71 and OQ-72 lines if answered later; the
    US-08.6.1 to US-08.6.4 screenshots were re-shot here (see the Catalogue screenshots result in PROGRESS).
