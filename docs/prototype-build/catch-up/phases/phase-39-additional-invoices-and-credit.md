# Phase 39 · Additional invoices and credit-and-rebill

**Requirements covered:**
[FT-08.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-08.6.md) Billing after AUTHORISED (Verify) ·
[US-08.6.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.6.1.md) Additional invoice for late billing lines (Verify) ·
[US-08.6.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.6.3.md) Create an additional invoice on a Procedure ·
[US-08.6.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.6.2.md) Credit note and re-issue (Verify) ·
[US-03.3.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.3.6.md) Other billing lines (the typed line kinds and the per-line later date; rate x time already matches) ·
[DM-20](../analysis/domain-model-delta.md#dm-20) Additional invoice on a Procedure replaces the post-op addendum Card ·
[DM-21](../analysis/domain-model-delta.md#dm-21) Wrong invoice is credited in full, then rebilled ·
[RV-10](../analysis/reverse-check.md#rv-10-post-op-addendum-is-a-new-linked-card-on-todays-free-session) Post-op addendum is a new linked Card on today's free session.
Read alongside (not closed here):
[US-07.3.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-07.3.2.md) (the Booking is immutable after AUTHORISED; nothing here may change it),
[US-08.3.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.3.1.md) (the receivable and payable pair; Phase 36 built it),
[US-08.4.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.4.3.md) (unique invoice numbers, the `-P` payable suffix),
[US-04.3.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.3.2.md) (the filtered Contract list; Phase 20 built it),
[US-13.5.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.5.2.md) (every step audited),
[US-06.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.4.1.md) (the remaining balance invoice is NOT an additional invoice),
[US-08.6.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.6.4.md) (split a combined Procedure: Parked on OQ-53, whose natural home is this phase's sheet),
[OQ-42](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-42.md),
[OQ-45](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-45.md),
[OQ-51](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-51.md),
[OQ-24](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-24.md) and
[OQ-28](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-28.md) (both Answered: the flow and the credit policy),
[OQ-53](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-53.md), and the
"What changed since the RFP" rows, the Booking section and the "Internal ledger" section of
[domain-model.md](../../../discovery-reference/Updated%20Requirements/domain-model.md).
**Depends on:** 36 (the internal ledger: a linked receivable and payable per invoice, the whole and
per-anaesthetist positions, the imbalance indicator). By the roadmap order 14 (the demo-trigger
registry, `useDemoTriggerContext`, `stage-post-op`, the payment entries, the shared actors), 15
(Booking vocabulary and routes), 16 (payable equals receivable, `invoiceNumber` and `reference` on
both Xero records, the AA-FEE invoices), 20 (one Contract per Procedure and its pure scope rule), 21
(billable party and required inputs on the Booking), 22 (`procedureIds`, `lineage`, `delivery`,
`materialiseInvoices`, `resendInvoice`), 23 and 24 (per-Procedure pricing, the adjustment), 25 (the
`BookingLock`, `priceBookingFromLock`, "Regenerate from locked data"), 27 (the prepayment and balance
invoices) and 28 (Slots and Lists) have also run. 37 and 38 may run before or after this phase.
**Estimated:** 2 sessions. Session 1 is the additional invoice, the "Tell the office" notice and
the removal of the addendum Booking (work items 1 to 10), ending at a green stop point. Session 2 is
credit in full and rebill (work items 11 to 19).

## Goal

After a List is authorised and invoiced, two things still happen in real life: a charge turns up
later (a ward review the next day, a nerve catheter day, a pain consult), and an invoice turns out to
be wrong (the wrong PO number, the wrong party, an insurer that paid twice). The catalogue settles
both without ever unlocking the original Booking (FT-08.6, US-07.3.2):

- **Late charges become additional invoices** (US-08.6.1, US-08.6.3, DM-20). An admin opens the
  invoiced Booking, picks a Procedure and presses **Create additional invoice**. The sheet offers a
  Contract from the filtered list (defaulting to the Procedure's locked Contract), free lines
  (time units, modifiers, a fixed amount, a Contract add-on fee, or rate x time where the Contract
  permits it), each with a line type and its own service date, and a billable party that defaults to
  the original invoice's party. It issues at once with **no approval step**: its own number, its own
  ledger pair, its own Xero pair and its own payable to the anaesthetist, linked to the original
  Procedure and invoice, and the original shows its additional invoices. Pricing follows owner
  decision **D10** (default: the OQ-45 recommendation, RVG time units and modifiers at the
  anaesthetist's own unit value, with the admin free to override the amount and the billable party,
  every override audited).
- **The post-op addendum Booking goes** (RV-10). `addPostOpAddendum`, the addendum Booking type and
  its banner and button are removed. On mobile and web the anaesthetist's entry on a locked Booking
  becomes **Tell the office about a later charge**: a short notice (what, when, how long, a note)
  that the office sees on the Booking and turns into an additional invoice with one press. It stands
  in for today's email and never shows the anaesthetist an amount (the 2026-09-28 ruling).
- **Other billing lines get their kind and date** (US-03.3.6). The anaesthetist's Add billing line
  sheet picks a line type (post-op ward or HDU review, nerve catheter, pain consult, medical
  transport, Contract add-on fee, other) and may carry a later service date. The same types and date
  rule serve the additional invoice, so there is one vocabulary.
- **A wrong invoice is credited in full, then rebilled** (US-08.6.2, DM-21). On the Admin invoice
  document, **Credit in full and rebill** takes a reason and the corrections (billable party,
  required inputs such as the PO number, Contract where safe, an office override with its reason),
  then in one confirmed step: issues a **credit note** for the whole amount against the receivable,
  **reverses the linked payable** (the contra), sends the credit note to the billable party, reverses
  the **Xero ACCREC and ACCPAY and creates the new pair together**, and issues the **rebill** with a
  new number, linked to the original. The trail reads debit, credit, contra, new debit, and every
  step is audited. The original invoice is never edited: its "Credited" state and its links are
  derived.
- **When the anaesthetist has already been paid**, the reversal records the amount to recover from
  them as a labelled ledger trail only (OQ-42 is open): nothing is offset or clawed back.

The state gains credit notes, late-charge notices and Xero credit notes, and loses the addendum
fields, so `PERSIST_VERSION` is bumped. No seeded figure moves.

## Before you start: drift check

1. Run the drift check against the plan's catalogue snapshot:

   ```
   git diff 1f067a8 -- "docs/discovery-reference/Updated Requirements/catalogue" "docs/discovery-reference/Updated Requirements/domain-model.md"
   ```

   Read the diff for FT-08.6, US-08.6.1, US-08.6.2, US-08.6.3, US-03.3.6, the context items US-07.3.2,
   US-08.3.1, US-08.4.3, US-04.3.2, US-06.4.1, US-08.6.4, and OQ-24, OQ-28, OQ-42, OQ-45, OQ-51,
   OQ-53. If an item changed, re-read it and adjust the work items. If an item is now Retired or
   Future, drop its work items and record that in the PROGRESS entry. At plan time FT-08.6, US-08.6.1
   and US-08.6.2 were **Verify** and US-08.6.3 and US-03.3.6 **Proposed**; a Verify item that AA has
   reworded is the most likely change, so read those three first. Note also that the US-08.6.1
   screenshots still show the old "Add post-op event" addendum UI; the text wins (admin only), and
   the images are stale.
2. **Owner decision D10 (how an additional invoice is priced, OQ-45).** Confirm with the owner (or
   the ROADMAP decisions table) whether it has been answered.
   - **Default (build this if unanswered, labelled provisional):** time-unit and modifier lines are
     priced at the **anaesthetist's own unit value** from their profile (Phase 26); a fixed line is
     the amount typed; a Contract add-on line is the add-on's price in force on the service date; a
     rate x time line is hours x rate where the chosen Contract permits it. The admin may override
     any line's amount and the billable party, each with a required reason, and every override is
     audited. The sheet shows a "Provisional · pricing rule to confirm with AA" chip.
   - **If the owner answers "follow the Contract":** units are priced through the chosen Contract's
     pricing basis at its version in force on the service date (Phase 25's version helper), exactly as
     `priceBookingFromLock` prices a Procedure; a fixed-schedule Contract with no matching line for
     the item leaves the line unpriced and the admin must type the amount (with a reason). The
     override and party rules stay. Record which branch was built. The branch lives in one constant,
     `ADDITIONAL_PRICING_RULE`, so a later answer is a one-line change plus its tests.
   - Either branch: the anaesthetist adjustment (Phase 24) is **not** offered on an additional
     invoice; the office override is the only adjustment (Phase 24's handoff asked this phase to
     decide).
3. **Open questions and their safe interims.**
   - **OQ-51 (the Solutions Plus "three" and "six" numbers).** If still open: an additional invoice
     takes the next number from the ordinary invoice sequence (`AA-2026-####`) and shows "Additional
     to AA-2026-0007" as its link; the catalogue says "we keep the idea, not the numbering". Label the
     numbering provisional in the code comment and the PROGRESS entry (no UI chip: the number itself
     is honest). If answered with a suffix scheme, build that in the id allocator only.
   - **OQ-42 (credit and rebill after the anaesthetist has been paid).** If still open: **trail
     only**. The reversal records the disbursed amount as "Recovery due from Dr X" on the ledger's
     payable leg, labelled "To be agreed · provisional"; the payables run does not offset it and no
     refund is made. If answered with the recommendation (offset in the next payment run), build the
     offset only if it fits in the session; otherwise log it for Phase 41, which already takes refunds.
   - **OQ-45** is D10 above.
   - **OQ-53** keeps US-08.6.4 Parked. Build nothing for splits, but do not block them: the sheet's
     billable party per invoice is what a split would reuse.
   - **The credit note's delivery** (US-08.6.2: "Xero raises credit notes but does not send them, so
     the mechanism is to be designed"). Interim: the engine sends the credit note through Phase 22's
     delivery plan exactly as it sends an invoice (email to the Booking's invoice email, or queued
     for the portal), badged "Simulated send", with the caption "Xero does not send credit notes; the
     engine sends it · mechanism to confirm".
4. **Prerequisite names.** Confirm Phases 36 (and 14 to 28) are DONE in PROGRESS.md and read their
   handoff notes. Note the exact current names of:
   - from **36** (planned names; use the names the code has): `LedgerPair` (a union on `kind`:
     `'procedure' | 'prePayment'` Booking pairs and `'aaFee'`), `ReceivableLeg` and `PayableLeg`
     (`releasedAmount` replaced `authorisedAmount`; `disbursedAmount`), the pure module
     `domain/billing/ledger.ts` (`newBookingPair`, `applyReceipt`, `applyDisbursement`,
     `pairStatusLabel`, `ledgerChecks`, `ledgerPosition` and its `imbalance = receiptsHeld -
     payablesDue` equation, `anaesthetistPosition`), the selectors `ledgerPositionOf` and
     `anaesthetistLedgerPosition`, the store's `applyReceiptInto`, and the renames that **delete**
     the July names this doc's code entry points still show: `BillingCase` and `billing.cases` are
     gone (a failure is a `BillingException`), `handoffCase` is `handoffPair(api, pairId)` with the
     fault on `pair.handoffFailure`, `retryBillingCase` is `retryBillingException`, the monitor's
     `resolveAndRetry` calls them, `BillingReceipt` is `LedgerReceipt`, and `payablesDue` reads the
     payable legs, not the ACCPAYs. 36 left the legs able to take a credit but added no credit path:
     this phase adds it (work item 12). This doc says "the pair", "the receivable leg" and "the
     payable leg";
   - from **25**: `BookingLock`, `ProcedureLock`, `buildBookingLock`, `priceBookingFromLock`,
     `regenerateInvoiceFromLock`, the version helper and the pricing-date rule, and the
     `regenerate-invoice` trigger. Its handoff note says: "credit-and-rebill is the only way to change
     a locked Booking's price; the rebill needs a new lock (decide there whether it re-locks at the
     current Contract version or the original one)". This doc decides that in work item 13;
   - from **22**: `materialiseInvoices`, `deliveryPlanFor`, `InvoiceDelivery`, `invoiceDeliveryLabel`,
     `resendInvoice`, the `lineage` roles, `procedureIds`, `supplier` / `agent`, and the
     `invoicePresentation.ts` helpers;
   - from **21**: the Booking's billable party and its override, the invoice email, the Contract's
     required inputs and where their values live on the Booking or Procedure (at 1f067a8 the billing
     reference is `Procedure.billingReference`);
   - from **20**: the pure Contract scope rule the picker and `setProcedureContract` share, and the
     default-Contract helper;
   - from **19** and **18**: the modifier master (`byId`), the Contract's rate x time permission
     (at 1f067a8 `permitsIndividualArrangement`; 18 replaces it with `permitsRateTime(contract)`,
     `pricingBasis.kind === 'rateTime'`, and keeps `INDIVIDUAL_ARRANGEMENT_MESSAGE` single-sourced),
     fee-schedule add-on lines (`FeeScheduleLine.isAddOn`, `priceInForce(line, dateISO)`,
     `rateInForce`) and the office-attached add-ons on `procedure.feeSchedule.addOns` (the action
     behind 18's `EditBillingSetupSheet`);
   - from **26**: where the anaesthetist's unit value is read (the profile);
   - from **16**: the `-P` rule and the `invoiceNumber` / `reference` fields on the Xero records;
   - from **15**: the renamed addendum fields (`bookingType`, `addendumOfBookingId`), the renamed
     action (`addPostOpAddendum` in `bookingActions.ts`), the Booking source value mapped for it, and
     the Booking detail body's current name;
   - from **28**: the helper that creates the addendum's List in today's open Slot (interim "until
     39"), and `stage-post-op`'s `when` on `projectedListId`;
   - from **35**: the rule that commands on the admin Booking detail are disabled while the Booking has
     unsaved changes;
   - from **14**: `stage-post-op`, `payment-full` / `payment-half` (Admin · Invoice and the Xero sim
     pair route), `regenerate-invoice` (25), `office-authorises-list` (PWA, needs a SUBMITTED List),
     and `OFFICE_ACTOR` and `OFFICE_SIMULATION_ACTOR` in `src/store/demoActors.ts` (some later
     phase docs call the latter `SIMULATED_OFFICE_ACTOR`; use the name the code has);
   - if **37** has run: its Xero-side void detector and its outage queue, which this phase's
     correction handoff must pass through (work item 15);
   - if **38** has run: that the Outstanding list and the financial position read the ledger, so a
     credit leaves Outstanding with no screen change.
5. Note the current `PERSIST_VERSION`.

## Reference

**Design files (convention 17):**

- `docs/design/Design Language.dc.html`: tokens (teal the only action colour, crimson identity only,
  the success, warning and neutral tints, mono tabular numbers, pills, the sheet and elevation
  patterns, the motion patterns). The credit note is a neutral document: no red for "credit", no
  crimson.
- `docs/design/Admin Review.dc.html` and `docs/design/Admin Day.dc.html`: the admin desktop anatomy
  (tables, header rows, side panels and drawers, pill styles). No mockup covers the invoice
  document, the Invoices table or the Billing monitor; extend `InvoiceDocument`'s print sheet and its
  264px info rail, the Invoices table and the monitor cards as they stand. The additional-invoice and
  credit sheets follow the existing admin sheets (`ContractEditSheet`, `PriceOverrideSheet`).
- `docs/design/Mobile App.dc.html`: the Booking detail and its bottom-sheet pattern, for "Tell the
  office" and the Add billing line sheet on mobile. The web app reuses the shared body.

**Catalogue items:** the covered and context files listed above. US-03.3.6's images show the Add
billing line sheet on web and mobile (fixed amount, rate x time); the new line type and date fields
extend that sheet. US-08.6.1's four images are the retired addendum flow (stale).

**Analysis files:**

- `docs/prototype-build/catch-up/GAP-ANALYSIS.md`: theme 8 (money side), the "Not represented"
  entry for US-08.6.2, the DM-20 and DM-21 rows, the RV-10 row, the S4 line under "Demo impact",
  the "Demo-trigger buttons" section, and the EP-08 table with its structural note (point 3: credit
  and additional invoices are new entities; point 5: most 08.6.x buttons are product actions).
- `docs/prototype-build/catch-up/epics/EP-08.md` (FT-08.6, US-08.6.1, US-08.6.2, US-08.6.3) and
  `epics/EP-03.md` (US-03.3.6).
- `analysis/domain-model-delta.md` DM-20, DM-21 (and DM-18, DM-23 for the ledger and invoice
  entities this phase extends); `analysis/reverse-check.md` RV-10.
- `analysis/prototype-map-admin.md` (sections 6 Invoices and 7 Billing monitor),
  `prototype-map-shared.md` (the shared Booking detail body and capture sheets),
  `prototype-map-store-seed.md` (billing slices, counters, selectors),
  `prototype-map-domain.md` (invoice build, time units, modifiers) and
  `prototype-map-shell-demo-pwa.md` (the Control Panel's "Stage post-op scenario", the Xero sim pair
  detail, the PWA).

**Code entry points** (line numbers are from 1f067a8; phases 14 to 38 will have moved them, and
36 deleted or renamed `BillingCase`, `BillingReceipt`, `retryBillingCase`, `handoffCase` and
`casesForList`: see the drift check's name list, and use the current names):

- The addendum to remove: `src/store/cardActions.ts` `addPostOpAddendum` 252 to 370 (after 15,
  `bookingActions.ts`), exported at `src/store/index.ts:73`; its test `src/store/postOpAddendum.test.ts`;
  `src/domain/types.ts` `Card.cardType` / `addendumOfCardId` 382 to 389; `src/shared/audit/fieldLabels.ts:29`;
  `src/domain/seed/audit.ts:123`; `src/shared/card/CardDetailBody.tsx` (import 11, `postOpMsg` 156,
  `doAddPostOp` 462 to 470, the addendum banner 490 and 507 to 511, the "Add post-op event" block
  720 to 737); `src/shared/surface/context.ts` 86 and 92 (comments); the Control Panel's staging card
  `src/apps/demo/DemoControlPanel.tsx` 148, 177 to 192, 297 to 313 and the S4 scenario text 415 to
  421 (re-homed by 14 to `stage-post-op` in `src/shared/demoTriggers/registry.ts`).
- Billing lines: `src/domain/types.ts` `BillingLine` 518 to 530, `ChargeBasis` 508;
  `src/store/billingLineActions.ts` `addBillingLine` 46; `src/shared/capture/AddBillingLineSheet.tsx`
  (whole file) and `BillingLinesCard.tsx`; `src/domain/billing/timeUnits.ts`
  `timeUnitsFromMinutes` 26; `src/domain/billing/modifierCodes.ts`.
- Invoices and the run: `src/domain/types.ts` `Invoice` 662, `InvoiceLine` 678, `BillingCase` 697,
  `BillingReceipt` 742, `XeroAccRec` 769 (the unused `'voided'` status 777), `XeroAccPay` 780;
  `src/store/billingRun.ts` (`runBillingForList` 68, `retryBillingCase` 285, 22's
  `materialiseInvoices`, 22's `resendInvoice` replacing `markInvoiceEmailed` 398);
  `src/domain/billing/invoiceBuild.ts` (the `negativeTotal` belt 408 to 420, which stays);
  `src/store/mutate.ts` `ID_FORMATS` 61 to 95 and `allocateId`.
- Xero and money: `src/store/xeroHandoff.ts` `handoffCase` 153 (the fault path 173, the pair
  creation 207 to 280); `src/store/paymentActions.ts` `receivePayment` 78;
  `src/store/payablesActions.ts` `payablesDue` 35, `runPayables` 146, `disbursePayable` 160;
  `src/apps/demo/xeroPairView.ts` 23; `src/apps/demo/DemoXero.tsx` (`PairDetail` 222, the "Voided"
  label 647).
- Admin screens: `src/apps/admin/screens/InvoiceDocument.tsx` (the document, `InvoiceInfoRail` 232
  to 320, `RailCard`, `XeroReference`); `src/apps/admin/screens/InvoicesScreen.tsx`;
  `src/apps/admin/screens/AdminCardDetail.tsx` (after 15, the admin Booking detail);
  `src/apps/admin/screens/BillingMonitorScreen.tsx`; `src/apps/admin/routes.tsx` (`AdminInvoicesRoute`
  169) and `src/apps/admin/AdminApp.tsx` (section mapping 32, nav paths 229).
- Mobile and web: `src/apps/mobile/screens/CardDetailScreen.tsx` and
  `src/apps/web/screens/CardDetailView.tsx` (after 15, the Booking detail screens), both over the
  shared body.
- Store plumbing: `src/store/appStore.ts` (`PERSIST_VERSION` 130, `AppState` billing and xero
  slices), `src/store/persistMigrate.test.ts`, `src/store/selectors.ts` (`invoicesForList`,
  `casesForList`, the monitor selector ~429, `isBackdropInvoice` 144), `src/store/index.ts`.
- Seed: `src/domain/seed/cards.ts` 763 to 780 (Sarah Mitchell's first episode on Dr Sharma's Tue 14
  Jul AM List, Christchurch Public, Health NZ, `HNZ-2026-3102`), `src/domain/seed/cast.ts:47` (Dr
  Sharma, unit value $30.00), `src/domain/seed/history.ts` and `billing.ts` (no change expected).
- Tests to extend or replace: `store/billingRun.test.ts`, `store/xeroHandoff.test.ts`,
  `store/xeroNhi.test.ts`, `store/paymentActions.test.ts`, `store/payablesActions.test.ts`,
  `store/persistMigrate.test.ts`, `store/demoScenarios.test.ts`, 14's
  `shared/demoTriggers/demoTriggers.test.ts`, 25's lock and regenerate tests, and the Playwright
  specs under `visual/` (`admin-phase08.spec.ts`, `admin-phase09.spec.ts`, `xero-pair.spec.ts`).

## Work items

### Session 1: the additional invoice

1. **Model** (`domain/types.ts`). DM-20, the US-03.3.6 line kinds.
   - `OtherLineType = 'postOpReview' | 'nerveCatheter' | 'painConsult' | 'medicalTransport' |
     'contractAddOn' | 'other'`. The "what" of a line; `ChargeBasis` stays the "how".
   - `BillingLine` gains `lineType?: OtherLineType` and `serviceDateISO?: IsoDate` (absent means the
     List date). US-03.3.6 ("a billing line can carry its own later date").
   - `Invoice.kind` widens to include `'additional'`. `Invoice.lineage` roles gain `'additionalTo'`
     (an additional invoice points at the original invoice). Add
     `additionalOf?: { bookingId; procedureId; originalInvoiceId }` only if 22's `procedureIds` plus
     the lineage entry do not already carry all three; prefer the lineage entry and `procedureIds`.
   - `AdditionalInvoiceBasis`, stored on the additional invoice (it is its own lock, so Phase 25's
     Regenerate can reproduce it): `{ rule: 'unitValue' | 'contract'; contract: { id; version; name };
     unitValue; lines: AdditionalLineBasis[]; party: CounterpartyRef; partyOverride?: { reason };
     createdBy: { who; role }; fromNoticeId? }`, where each `AdditionalLineBasis` records `lineType`,
     `serviceDateISO`, `basis` (`'timeUnits' | 'modifier' | 'fixed' | 'contractAddOn' | 'rateTime'`),
     its inputs (`minutes` or `units`, `modifierCode`, `feeScheduleLineId` and `quantity`, `hours` and
     `rate`), the computed `amount`, and `override?: { amount; reason }`.
   - `LateChargeNotice`: `{ id; bookingId; procedureId; anaesthetistId; lineType; serviceDateISO;
     minutes?; note; status: 'open' | 'raised' | 'dismissed'; raisedInvoiceId?; dismissReason?;
     createdAtISO; createdBy: { who; role } }`, in a new `billing.lateChargeNotices` record.
   - Remove `bookingType` and `addendumOfBookingId` from the Booking (work item 6 deletes the users).
   - `ID_FORMATS` (`store/mutate.ts`): `lateChargeNotice` (`LCN`, pad 4). Session 2 adds the credit
     kinds.
2. **Pure line rules** in a new `src/domain/billing/otherLines.ts`, re-exported from the billing
   index, Vitest-covered (convention 9):
   - `OTHER_LINE_TYPES` (ordered) and `OTHER_LINE_TYPE_LABEL`: "Post-op ward or HDU review", "Nerve
     catheter", "Pain consult", "Medical transport", "Contract add-on fee", "Other". The only place
     these words live; both sheets and the invoice line text read them.
   - `serviceDateRefusal(serviceDateISO, listDateISO, todayISO)`: refuses a date before the List date
     ("The service date cannot be before the List date.") or after the demo clock's today ("The
     service date cannot be in the future."); otherwise `null`. A labelled reading: the catalogue says
     "a later date" and "dated after the List was invoiced" without bounding it.
   - `describeOtherLine(line)`: the invoice line text, "Post-op ward or HDU review · Wed 15 Jul · 15
     min" (the date only when it differs from the List date; a middot joiner, no dashes).
   - Tests: labels are dash-free and cover every type; the date bounds at both edges; the description
     with and without a later date and minutes.
3. **Pure additional-invoice pricing** in a new `src/domain/billing/additionalInvoice.ts`:
   - `ADDITIONAL_PRICING_RULE: 'unitValue' | 'contract'`, the D10 constant (default `'unitValue'`,
     commented "provisional, OQ-45").
   - `priceAdditionalInvoice(input, ctx)` where `ctx` carries the rule, the anaesthetist's unit value,
     the chosen Contract at its version in force on each line's service date, the modifier master and
     the list date and today. Per line:
     - `timeUnits`: units from `minutes` via `timeUnitsFromMinutes` (15 min gives 1 unit), or the
       units typed; amount `units x unitValue` under `'unitValue'`, or through the Contract's pricing
       basis under `'contract'`;
     - `modifier`: the code's units from the master, priced the same way (US-08.6.1: "built from time
       units and/or modifiers");
     - `fixed`: the amount typed, with a description;
     - `contractAddOn`: an add-on line of the chosen Contract with a price in force on the service
       date, times its quantity (Phase 18's fee-schedule add-on);
     - `rateTime`: hours x rate, refused unless the Contract permits an individually arranged rate
       (the same sentence as `INDIVIDUAL_ARRANGEMENT_MESSAGE`);
     - `override`: replaces the computed amount; a reason is required; the computed amount is kept
       beside it for the audit and the rail.
   - Returns `{ kind: 'priced'; lines; subtotal; gst; total }` (GST by Phase 22's presentation rules
     and the Contract's GST treatment, amounts held GST exclusive) or `{ kind: 'refused'; code;
     message; lineIndex? }` for: no lines, a non-positive amount, a missing reason, a date refusal, an
     unknown modifier or add-on, rate x time not permitted, and (branch `'contract'`) a unit line the
     Contract cannot price without an override.
   - Tests (worked figures): a 15 minute ward review for Dr Sharma is 1 unit x $30.00 = $30.00 ex GST;
     a 40 minute pain consult is 3 units; a modifier line; a fixed $120.00 medical transport; an
     add-on priced on its effective date, and a different price across an effective-date step; rate x
     time refused on a Contract without the permission; an override with and without a reason; every
     refusal; determinism (identical output on repeat); and, for the `'contract'` branch, one RVG
     Contract and one fixed-schedule Contract with no matching line.
4. **Store: create an additional invoice** (a new `src/store/additionalInvoiceActions.ts`, exported
   from `store/index.ts`). US-08.6.1, US-08.6.3.
   - `createAdditionalInvoice(api, actor, { bookingId, procedureId, contractId, party, partyReason?,
     lines, fromNoticeId? })`. Office only (`officeOnly`). Refusals, each with a plain sentence:
     `notInvoiced` (the Booking's List is not AUTHORISED and billed, or the Procedure has no live
     invoice: "This Procedure has no invoice yet. Resolve its billing first."), `bookingCancelled`,
     `procedureCancelled`, `contractOutOfScope` (Phase 20's pure scope rule for this Booking and
     Procedure; the default is the Procedure's locked Contract from the `BookingLock`),
     `partyReasonRequired` when `party` differs from the original invoice's party, and every pricing
     refusal from item 3.
   - **The original invoice** is `liveInvoiceForProcedure(state, procedureId)`: the live (not
     credited) standard, balance or additional invoice whose `procedureIds` include it, preferring
     the standard or balance invoice, else the Procedure's prepayment invoice when that is its only
     invoice (a fully prepaid Booking). After a credit and rebill it is the rebill.
   - **No approval step and no List event.** One `mutate()` (actor the office user, source office):
     allocate the invoice through 22's `materialiseInvoices` (so id, number, `supplier`, `agent`,
     `gstTreatment`, `procedureIds: [procedureId]`, the `additionalTo` lineage and `delivery` stamped
     from `deliveryPlanFor` are identical to a run-raised invoice), store `additionalBasis`, create
     36's Booking pair through `newBookingPair` (kind `'procedure'`; receivable from the party,
     payable to the List's anaesthetist for the same total, per 16; no `BillingCase`, which 36
     deleted), and, when `fromNoticeId` is given, mark that notice
     `raised` with `raisedInvoiceId`. Audit entries: `invoice.additionalCreated` (after: number,
     original invoice number, Procedure, Contract and version, party, lines, totals, rule) on the
     invoice; one `invoice.lineOverridden` per overridden line and `invoice.partyOverridden` for a
     party change (each with the reason, the computed and the final value); 22's
     `invoice.sent` / `invoice.portalQueued` / `invoice.notSent`; 36's `ledger.pairCreated`; and
     `lateCharge.raised` on the notice. The Booking, its Procedures, its lock and the original invoice
     are not written (US-07.3.2).
   - After the commit, call 36's `handoffPair` for the new pair (the Xero pair, 16's `invoiceNumber`
     and `-P`), as the billing run does. A handoff fault leaves the invoice and its pair valid
     (`pair.handoffFailure`, "Not yet in Xero") and the monitor's Resolve and retry picks it up.
   - **Derived back-links** (selectors, never stored on the original): `additionalInvoicesFor(state,
     invoiceId)`, `additionalInvoicesForProcedure(state, procedureId)`, `originalInvoiceFor(state,
     invoiceId)`.
   - Tests (`additionalInvoiceActions.test.ts`): raised on Sarah Mitchell's staged original with the
     right number, links, ledger pair and Xero pair; the original invoice, Booking, Procedures and
     lock are deep-equal before and after; refused for a non-office actor, a DRAFT or SUBMITTED
     List, an open billing exception with no invoice, a cancelled Booking or Procedure, an
     out-of-scope Contract,
     a party change without a reason; two additional invoices on one Procedure both link back; an
     additional invoice on a prepaid-only Procedure links to the prepayment invoice; the audit trail
     has every entry above; Regenerate (Phase 25's `regenerateInvoiceFromLock`, extended in item 8)
     reproduces it identically.
5. **Store: "Tell the office" notices** (same file). US-08.6.1 ("The anaesthetist tells the office").
   - `tellOfficeLateCharge(api, actor, { bookingId, procedureId, lineType, serviceDateISO, minutes?,
     note })`: the Booking's own anaesthetist (or the office), on an AUTHORISED and billed Booking
     only; `serviceDateRefusal` applies; a note is required for `other`. Audited
     `lateCharge.notice` (source anaesthetist). Writes nothing on the Booking.
   - `dismissLateChargeNotice(api, actor, noticeId, reason)`: office only, reason required, audited
     `lateCharge.dismissed`.
   - `additionalInvoiceDraftFromNotice(state, noticeId)` (pure selector): the sheet's prefill, one
     `timeUnits` line from the notice's type, date and minutes (or an empty `fixed` line when there
     are no minutes), the default Contract and the original's party.
   - `raiseAdditionalInvoiceFromNotice(api, actor, noticeId)`: `createAdditionalInvoice` on that
     prefill with no overrides. It is the body of the PWA stand-in (work item 10) and the sheet's
     "Raise as told" shortcut.
   - Selectors: `lateChargeNoticesForBooking`, `openLateChargeNotices` (for the monitor count).
   - Tests: rights (another anaesthetist is refused), state (DRAFT refused), the date rule, dismiss
     needs a reason, raising from a notice closes it and links the invoice, a raised notice cannot be
     raised twice, no Booking write.
6. **Remove the addendum Booking** (RV-10, retired behaviour). Delete, do not hide:
   - `addPostOpAddendum` and its export; `postOpAddendum.test.ts` (its immutability assertions move
     into item 4's tests); `bookingType` and `addendumOfBookingId` everywhere (types, `fieldLabels.ts`,
     `seed/audit.ts`, the Booking source mapping 15 added for the addendum path, 20's Contract copy
     for the addendum, 28's "create the addendum's List in today's open Slot" helper if nothing else
     uses it);
   - the addendum banner and the "Add post-op event" block in the shared Booking detail body, the
     `Stethoscope` import if unused, and the `postOpMsg` state;
   - the comments in `shared/surface/context.ts` that name the addendum.
   - Grep `src` and `visual` for `addendum|postOp|PostOp|post-op event|Add post-op`: the only hits
     left are the modifier labels if Phase 19 kept any, and this phase's new copy. Zero hits of
     `addPostOpAddendum`.
7. **Anaesthetist other billing lines** (US-03.3.6, the missing parts: line kinds and the later date).
   - `addBillingLine` accepts `lineType` (required for new lines; default `other` for any caller that
     still omits it) and `serviceDateISO` (optional; `serviceDateRefusal` against the List date and
     today). Audited as today, with the two new fields.
   - `AddBillingLineSheet`: a line type picker (segmented chips on mobile, per convention 16) above
     the existing description, fixed amount and rate x time fields; a "Different date" toggle that
     reveals a date field bounded by the rule. Picking **Contract add-on fee** lists the Procedure's
     Contract add-on lines with a price in force and writes through Phase 18's add-on setter on
     `procedure.feeSchedule.addOns` (one pricing path, not a second line), available to the
     anaesthetist on a DRAFT Booking; if Phase 18 kept that setter office only, keep the option
     office only and say so in the PROGRESS entry.
   - `BillingLinesCard` shows the type label and the date when it differs from the List date, with no
     amount on the anaesthetist surfaces (the 2026-09-28 ruling), as today.
   - The engine: the invoice line text for a billing line comes from `describeOtherLine`. Phase 25's
     lock snapshot of billing lines carries `lineType` and `serviceDateISO`; extend its parity test so
     every seeded invoice still regenerates identically (seeded lines carry no type, so their text is
     unchanged).
   - Tests: the action's new validation; a dated line's invoice text; lock parity unchanged.
8. **Admin UI for the additional invoice.**
   - **Booking detail** (the shared body, office-gated as `OfficeBillingSetup` is): on each Procedure
     of an invoiced Booking, a secondary teal **Create additional invoice** button, with the
     Procedure's additional invoices listed under it ("AA-2026-0012 · Post-op ward or HDU review ·
     $34.50 · Emailed", each a link to the document). Disabled with the refusal sentence when
     `createAdditionalInvoice` would refuse for state reasons, and disabled while the Booking has
     unsaved changes (Phase 35). Open notices show above it: "Dr Sharma told the office · Post-op ward
     or HDU review · Wed 15 Jul · 15 min · 'Ward review day 1'", with **Create additional invoice**
     (prefilled from the notice) and **Dismiss** (reason).
   - **`AdditionalInvoiceSheet`** (new, `src/shared/flows/`, office only): header "Additional invoice
     · {patient} · {Procedure}", "Additional to AA-2026-0007"; the Contract picker (Phase 20's
     filtered list, default the locked Contract, with its pricing basis shown); the billable party
     (default the original's, a change reveals a required reason); the lines editor (type, service
     date, basis, the basis inputs, the computed amount in mono, an "Override" link revealing amount
     and reason); the live total from `priceAdditionalInvoice`; the "Provisional · pricing rule to
     confirm with AA" chip while D10 is on its default; and one primary teal **Issue additional
     invoice** button with the note "Issued now. No approval step; it is audited." Refusals show
     inline against the line or field. On success, navigate to the new invoice's document.
   - **Invoice document** (`InvoiceDocument.tsx`): on an additional invoice, the heading keeps "TAX
     INVOICE" and a line under the number reads "Additional invoice · relates to AA-2026-0007 ·
     {Procedure}" (a link); each line shows its service date. On any invoice with additional
     invoices, a rail card **Additional invoices** lists them (derived). Phase 25's Regenerate entry
     reads `additionalBasis` for an additional invoice: extend `regenerateInvoiceFromLock` (or add
     `regenerateAdditionalInvoice` and route to it) so it reports "identical" or the differences.
   - **Invoices screen**: a **Kind** column (Standard, Balance, Prepayment, Additional; credit notes
     join in session 2) and, for an additional invoice, "Additional to AA-2026-0007" under its number.
   - **Billing monitor**: the Booking row detail adds "+1 additional invoice" when one exists; a small
     header count **Late charges told · N** lists open notices with links to their Bookings (read only;
     the action lives on the Booking).
   - `data-shot` hooks: `additional-invoice-button`, `additional-invoice-sheet`,
     `invoice-additional-links`, `late-charge-notices`.
9. **Mobile and web: Tell the office** (the shared Booking detail body, anaesthetist side).
   - On an AUTHORISED and billed Booking, the old "Add post-op event" place holds a secondary teal
     **Tell the office about a later charge** button and the caption "For a charge after this List
     was invoiced, such as a ward review or a pain consult. The office raises it as an additional
     invoice; this Booking stays locked."
   - **`TellOfficeSheet`** (new, `src/shared/flows/`, a bottom sheet on mobile, a side sheet on web
     via `useSurface`): the Procedure (when more than one), the line type chips, the service date
     (default today, bounded by the rule), minutes (optional stepper in 5s), a note, and **Send to the
     office**. Result: "Sent. The office will raise it as an additional invoice."
   - Below the button, the Booking's notices: "Told the office {date} · Post-op ward or HDU review ·
     Wed 15 Jul · 15 min" with a status pill: **Waiting for the office**, **Invoiced by the office**
     (when raised; no number or amount), **Not billed** with the office's reason (when dismissed).
   - `data-shot` hooks: `tell-office-button`, `tell-office-sheet`, `late-charge-status`.
10. **Session 1 triggers, persistence and the stop point.**
    - Re-point 14's `stage-post-op`: unchanged routes and body (it authorises Dr Sharma's Tue 14 Jul
      AM List through `authoriseList`, so 25's lock is written and the run bills it); new
      description "Authorises Dr Sharma's Tue 14 Jul AM List so its invoiced Bookings can take an
      additional invoice"; result "Authorised and billed. Open Sarah Mitchell's Booking and use Create
      additional invoice on the Procedure."; disabled label "Already staged: use Create additional
      invoice on the Procedure".
    - Register `pwa-office-raises-additional-invoice` (work item "Demo triggers" below): body in
      `src/store` or `src/shared`, calling `raiseAdditionalInvoiceFromNotice` as
      `OFFICE_SIMULATION_ACTOR` on the oldest open notice of the Booking in the URL.
    - Bump `PERSIST_VERSION` by one (the Booking loses two fields, `billing.lateChargeNotices` and a
      counter kind appear). Extend `persistMigrate.test.ts`: a stale payload with an addendum Booking
      is discarded to the fresh seed. Two fresh seeds deep-equal. No seeded figure moves: S3's
      scripted invoices (AA-2026-0002, AA-2026-0005, AA-2026-0006 as 22 left them) are unchanged.
    - **Stop point:** `npm run build`, `npm run build:pwa`, `npx vitest run` green, and the session 1
      part of the manual checklist passes, before session 2 starts.

### Session 2: credit in full and rebill

11. **Model** (`domain/types.ts`). DM-21.
    - `CreditNote`, in a new `billing.creditNotes` record: `{ id; creditNoteNumber; originalInvoiceId;
      bookingId; procedureIds; counterparty; supplier; agent; gstTreatment; lines: { description;
      units?; amount }[]; subtotal; gst; total; reason; cause: 'correction'; rebillInvoiceIds;
      issuedAtISO; issuedBy: { who; role }; delivery: InvoiceDelivery; reversal: ReversalPlan; xero?:
      { accRecCreditNoteId; accPayCreditNoteId?; accPayVoided: boolean }; xeroFailure?: { code;
      message } }`. Amounts are stored positive and equal the original's; the document says "Credit".
      `cause` leaves room for Phase 41's overpaid-prepayment credit and cancellation refund. A credit
      note is its own record, not an `Invoice` kind, so no invoice sum, count or selector can pick it
      up by accident (Decisions-log entry below).
    - `Invoice.lineage` roles gain `'rebillOf'` (a rebill points at the invoice it replaces).
      `RebillBasis`, stored on each rebill: `{ creditNoteId; corrections: RebillCorrections; lock:
      BookingLock }` (the corrected lock the rebill was priced from; see item 13) or, for a rebilled
      additional invoice, a corrected `AdditionalInvoiceBasis`.
    - `RebillCorrections`: `{ party?; partyReason?; invoiceEmail?; requiredInputs?: Record<string,
      string>; contractId?; officeOverride?: { procedureId; amount; reason }[]; lines? (additional
      invoices only) }`.
    - Xero: `XeroCreditNote { id; type: 'ACCRECCREDIT' | 'ACCPAYCREDIT'; creditNoteNumber; againstId;
      contactId; total; allocated; status: 'authorised' }` in a new `xero.creditNotes`;
      `XeroAccRec.status` gains `'credited'` (the unused `'voided'` stays for 37's Xero-side void
      detection); `XeroAccPay.status` gains `'voided'` and `'credited'`.
    - `ID_FORMATS`: `creditNote` (`CRN`, pad 4), `creditNoteNumber` (`CN-2026-`, pad 4; the payable
      side's number is `${creditNoteNumber}-P`, by 16's rule), `xeroCreditNote` (`XCN`, pad 4).
12. **Pure credit rules** in a new `src/domain/billing/creditNote.ts`, Vitest-covered:
    - `creditInFull(invoice, lines)`: the credit note's lines, subtotal, GST and total, mirroring the
      original exactly (same descriptions prefixed "Credit:", same amounts, same GST treatment). Full,
      even when one line was wrong (AC "Credit in full").
    - `reversalPlan({ total, received, released, disbursed })` (36's leg fields: `receivedAmount`,
      `releasedAmount`, `disbursedAmount`) returns `{ receivableCredited: total; payableReversed:
      total; releaseCancelled: released - disbursed; heldForPayer: received; recoveryDue: disbursed }`,
      all cents exact. The four cases, test-pinned:

      | Original's money | Receivable leg | Payable leg | Left over |
      |---|---|---|---|
      | Unpaid | credited to zero | reversed (contra); nothing was released | nothing |
      | Part or fully paid, not paid out | credited; a credit of `received` is held for the payer | reversed; the released amount is cancelled, so the payables run skips it | `heldForPayer` (refund or reuse is Phase 41) |
      | Paid out, partly or fully | as above | reversed; `recoveryDue = disbursed` recorded against the anaesthetist | `recoveryDue`, trail only (OQ-42) |
      | Handed off or not | as above | as above | the Xero plan (next bullet) differs, the ledger does not |

    - `xeroCorrectionPlan(accRec, accPay)`: an ACCRECCREDIT for the total, `allocated =
      min(total, amountDue - amountReceived)` (the rest stays unallocated, matching `heldForPayer`),
      the ACCREC becomes `credited`; a draft ACCPAY with nothing authorised is `voided`; an authorised
      or paid ACCPAY gets an ACCPAYCREDIT for the total and becomes `credited`. No NHI anywhere.
    - **The credit path in 36's pure ledger module** (`domain/billing/ledger.ts`, which 36 left able
      to take a credit but with no credit path; extend its tests in `ledger.test.ts`):
      - `applyCredit(pair, plan, { creditNoteId, atISO })` returns the new pair: the receivable leg
        gains `creditedAmount = total`; the payable leg gains `reversedAmount = total` and its
        `releasedAmount` is cut to `disbursedAmount` (money already paid out cannot be un-released);
        the pair gains `credit: { creditNoteId; atISO; heldForPayer; recoveryDue }`. Refused on a
        pair already credited and on an `aaFee` pair.
      - `applyReceipt` and `applyDisbursement` refuse a credited pair (`pairCredited`).
      - `pairStatusLabel` gains `credited`.
      - `ledgerPosition`: `receivablesOutstanding` subtracts `creditedAmount`; two new totals,
        `creditsHeldForPayers` (sum of `credit.heldForPayer` not yet refunded) and
        `recoveryDueFromAnaesthetists` (sum of `credit.recoveryDue`); and the equation becomes
        `imbalance = receiptsHeld - payablesDue - creditsHeldForPayers + recoveryDueFromAnaesthetists`.
        Both new terms are zero on an uncredited ledger, so 36's pinned figures do not move.
        `anaesthetistPosition` gains the anaesthetist's `recoveryDue`.
      - `ledgerChecks`: `releasedNotReceived` and `receivedAboveAmount` read a credited pair against
        its credit (released equals disbursed; received may exceed the credited remainder), so a
        healthy credited pair raises no check.
      - Worked checks, one per case: half paid (received 50, released 50, disbursed 0: held 50,
        payables due 0, imbalance 0); fully paid, part paid out (received 100, released 100,
        disbursed 40: receipts held 60, held 100, recovery 40, imbalance 0); fully paid out (receipts
        held 0, held 100, recovery 100, imbalance 0).
    - Tests: the four cases in cents, including odd cents and a half payment; `heldForPayer +
      (total - received) === total`; the plan for a draft, an authorised and a paid ACCPAY; the
      lines mirror the original for 1, 2 and 7 lines and for a GST-inclusive Contract; the ledger
      checks above; determinism.
13. **Pure rebill pricing** in a new `src/domain/billing/rebill.ts`:
    - `correctedLock(lock, corrections, ctx)`: a copy of the Booking's lock with the corrections
      applied. **The decision Phase 25 left open:** every field the admin did not change keeps the
      original's locked value, including the Contract version; a changed Contract is locked at its
      version in force on the List date (25's pricing-date rule), so a rebill never silently picks up
      a later price change. Labelled reading, recorded in the Decisions log.
    - `rebillDrafts(originalInvoice, correctedLock)`: runs 25's `priceBookingFromLock` and keeps only
      the drafts for the credited invoice's `procedureIds` and `portion`. A party correction moves
      those drafts to the new party.
    - Guards, each a refusal with a sentence: a Contract change when another live invoice shares the
      credited invoice's Procedures ("Another live invoice covers these Procedures. Credit and rebill
      each one."); a party change on the covered portion of a covered split (22: the cover is the
      holder's); a lock the corrections make un-priceable (25's blockers, passed through); an office
      override without a reason.
    - For a credited **additional** invoice the rebill re-runs `priceAdditionalInvoice` on the
      corrected basis instead.
    - Tests: an identical re-issue prices to the same total; a corrected PO number changes only the
      reference; a party change re-addresses the rebill; an office override with its reason; a
      Contract change locks the List-date version, not a later one; each guard; an additional
      invoice rebill.
14. **Store: credit in full and rebill** (a new `src/store/creditActions.ts`, exported from
    `store/index.ts`). US-08.6.2.
    - `creditAndRebill(api, actor, invoiceId, { reason, corrections })`. Office only (a labelled
      reading: US-08.6.2 leaves "who may action it" to work through). Refusals:
      `reasonRequired`; `alreadyCredited`; `kindNotCreditable` for a prepayment invoice ("Crediting a
      prepayment invoice is not in this prototype yet.", Phase 41) and an AA-FEE invoice ("AA fee
      invoices are not credited here."); a balance invoice is creditable only if 27's balance builder
      is callable from the lock (else refuse it with the same sentence as a prepayment and record it);
      every guard from item 13.
    - **One engine commit** (one `mutate()`, actor the office user): allocate the credit note
      (`creditInFull`, `reversalPlan`, the delivery plan from 22 addressed to the original's party and
      invoice email), apply `applyCredit` to the original pair (the receivable credit, the payable
      contra that also cancels the undisbursed release, and the recovery due when `disbursed > 0`,
      labelled provisional), materialise the rebill through `materialiseInvoices` with the
      `rebillOf` lineage and its `RebillBasis`, and create its pair through `newBookingPair`
      (audited `ledger.pairCreated`). Audit, each its own entry (US-13.5.2, "every step audited"): `invoice.credited` (office:
      reason, credit note number) on the original; `creditNote.create` (lines, totals, reversal
      plan); `creditNote.sent` / `creditNote.portalQueued` / `creditNote.notSent`;
      `ledger.receivableCredited`; `ledger.payableReversed`; `ledger.recoveryRecorded` (when
      applicable, with "to be agreed, OQ-42"); `invoice.rebilled` (the new number, the corrections
      with before and after, the reason) on the rebill; 22's `invoice.sent` for the rebill.
    - The original invoice record, its lines and the Booking are not written. "Credited", "Credited by
      CN-2026-0001" and "Rebilled as AA-2026-0013" are derived: `creditNoteForInvoice(state,
      invoiceId)`, `rebillsOf(state, invoiceId)`, `rebillOriginFor(state, invoiceId)`,
      `invoiceStanding(state, invoiceId): 'live' | 'credited'`. `liveInvoiceForProcedure` (item 4)
      skips credited invoices.
    - After the commit, `handoffCorrection(api, creditNoteId)` (item 15).
    - Tests (`creditActions.test.ts`), one per `reversalPlan` case, driven through the real payment
      and payables actions: unpaid; half paid; fully paid and not paid out; fully paid and paid out by
      `runPayables`. In each: the credit note equals the original; the ledger's whole position is in
      balance afterwards (36's imbalance figure is zero, with held credits and recovery shown as their
      own lines, not as imbalance); the anaesthetist's position moves by exactly the reversal; the
      rebill is a new number with a new pair; the original invoice is deep-equal before and after; a
      second credit of the same invoice refuses; the rebill itself can be credited and rebilled (a
      chain of two); every audit entry is present with source office or system as stated.
15. **Store: the Xero correction, together** (`store/xeroHandoff.ts`).
    - `handoffCorrection(api, creditNoteId)`: one `mutate()` (actor "Xero handoff", source system)
      that applies `xeroCorrectionPlan` to the original pair (the ACCRECCREDIT, the ACCPAY void or
      ACCPAYCREDIT, the statuses) **and** creates the rebill's pair by the same code path as
      36's `handoffPair` (extract its mirror-creation body into a shared helper rather than calling a
      second mutate), so the reversal and the re-creation land together (AC "Both sides move"). Audit
      `xero.creditNoteCreated` (numbers, allocated and unallocated amounts), `xero.accPayVoided` or
      `xero.accPayCredited`, and `xero.pairCreated` for the rebill.
    - The fault path: `settings.failNextHandoff` faults the whole correction (nothing is reversed or
      created in Xero), records `xeroFailure` on the credit note and `handoffFailure` on the rebill's
      pair, clears the flag, and the Billing monitor's `resolveAndRetry` routes a pair whose failure
      belongs to a correction to `handoffCorrection` (not `handoffPair`), so the retry reverses and
      re-creates together and is idempotent. A credit whose original was never handed off has nothing to reverse:
      it only creates the rebill's pair.
    - Guards elsewhere: `handoffPair` refuses a credited pair (`invoiceCredited`), so a pending
      handoff can never create a Xero pair after the credit; `receivePayment` (through
      `applyReceiptInto`) refuses a payment on a credited pair or `credited` ACCREC
      (`invoiceCredited`, "This invoice was credited. Record the payment against the rebill."), as
      Xero refuses payment on a fully credited invoice, and never turns it into an unmatched
      receipt; `payablesDue` reads the legs, so the cut release already drops the reversed payable,
      and `runPayables` / `disbursePayable` skip or refuse a credited pair through `applyDisbursement`.
    - If Phase 37 has run: engine-made credits and voids carry their credit note id, so 37's
      Xero-side void detector does not flag them; a correction made while 37's outage is simulated
      goes through its queue and backoff like any handoff.
    - Tests: the correction and the new pair in one commit; the fault path and its retry; the payment
      and payables guards; `xeroNhi.test.ts` extended so no credit note or ACCPAYCREDIT carries an
      NHI or a patient name beyond what 22's invoice already shows.
16. **Ledger views** (Phase 36's screens; extend, do not rebuild).
    - The whole-ledger view (36's `LedgerScreen`, `/admin/ledger`) shows the two new totals from
      item 12: **Credits held for payers** and **Recovery due from anaesthetists** ("To be agreed ·
      provisional"), with the equation line extended to match. Neither counts as an imbalance.
      A credited pair's row shows the `credited` status label.
    - The per-anaesthetist view (`/admin/ledger/anaesthetists/:anaesthetistId`) lists the credit note and the rebill in the trail in order (debit,
      credit, contra, new debit) and shows any recovery due with the provisional label.
    - The web financial position (38) needs no change: a credited invoice leaves Outstanding and the
      rebill joins it through the ledger (38's handoff note). Verify it; fix only a selector that
      reads invoices instead of the ledger.
17. **Admin UI for credit and rebill.**
    - **Invoice rail**: a new rail card **Correct this invoice** on a live standard, balance or
      additional invoice, with a secondary teal **Credit in full and rebill** button and the caption
      "The invoice is never edited. It is credited in full and a corrected invoice is issued." Hidden
      on prepayment and AA-FEE invoices with the refusal sentence as a caption instead.
    - **`CreditAndRebillSheet`** (new, `src/apps/admin/flows/`): step 1 **Credit**: the original's
      number, party and total; the reason (required; quick chips "Wrong PO or reference", "Wrong
      billable party", "Wrong Contract", "Paid twice", plus free text); the money state from
      `reversalPlan` in plain words ("Unpaid: nothing to refund", "Paid $x: $x will be held for
      {payer}", "Dr X was paid $x: recovery to be agreed with AA"). Step 2 **Rebill**: the
      corrections, prefilled from the original's lock (party with reason, invoice email, the
      Contract's required inputs such as the PO number, the Contract where allowed, an office
      override with reason); the rebill total live from `rebillDrafts`; the trail preview "AA-2026-0007
      debit $x · CN-2026-0001 credit $x · payable reversed $x · AA-2026-0013 debit $y". One primary
      teal **Credit and rebill** button with a confirm step naming both numbers. On success, navigate
      to the credit note.
    - **Credited original**: a neutral "Credited" pill beside the number, a line "Credited in full by
      CN-2026-0001 on {date} · rebilled as AA-2026-0013" (links), and the money chips (paid in,
      disbursed) kept as they were at the time of the credit. Payment triggers on this invoice show
      their "Invoice credited" disabled state.
    - **Credit note document**: route `/admin/credit-notes/:creditNoteId` (`AdminCreditNoteRoute`,
      a `RequireEntity` 404 guard; the side nav keeps Invoices active). It reuses `InvoiceDocument`'s
      sheet with the heading **CREDIT NOTE**, "Credits AA-2026-0007 in full", the reason, the mirrored
      lines, "Total credited", the supplier and agent block from 22, and a rail with Delivery (22's
      label and the "Simulated send" badge, plus the caption "Xero does not send credit notes; the
      engine sends it · mechanism to confirm"), Print, and a Xero card ("ACCRECCREDIT CN-2026-0001",
      "ACCPAYCREDIT CN-2026-0001-P" or "Draft ACCPAY voided", or "Xero correction failed · retry in
      Billing monitor"). No NHI.
    - **Rebill document**: a line under the number "Rebills AA-2026-0007 (credited by CN-2026-0001)".
    - **Invoices screen**: credit notes join the table as rows of kind **Credit note** ("Credits
      AA-2026-0007"), linking to their document; the original's Status shows "Credited".
    - **Billing monitor**: a failed Xero correction shows on the Booking's row with Resolve and retry.
    - **Xero sim** (`DemoXero.tsx`, `xeroPairView.ts`): the pair detail shows the ACCRECCREDIT and
      ACCPAYCREDIT (or the void) with allocated and unallocated amounts, and a link to the rebill's
      pair. The Invoices tab status reads "Credited".
    - `data-shot` hooks: `credit-rebill-button`, `credit-rebill-sheet`, `credit-note-document`,
      `invoice-credited-banner`, `xero-credit-note`.
18. **Session 2 triggers, persistence and copy.**
    - Re-point 14's `payment-full` / `payment-half` on Admin · Invoice and the Xero sim pair route:
      disabled "Invoice credited" on a credited invoice (the store guard backs it). 14's PWA
      `pwa-payment-full` / `pwa-payment-half` on Mobile · Balances read `openAccRecs`: confirm a
      credited ACCREC drops out of its choices.
    - Re-point 25's `regenerate-invoice`: a rebill regenerates from its `RebillBasis`; not registered
      on the credit-note route.
    - Bump `PERSIST_VERSION` by one again (new slices `billing.creditNotes`, `xero.creditNotes`, new
      counter kinds, widened statuses), and extend the migrate test. If session 1 and session 2 ship
      as one change, one bump for the phase is enough; record the from and to.
    - Copy sweep of `src` for "addendum", "post-op event", "credit note is out of scope" and any em
      or en dash in the new strings. Leave the `negativeTotal` message ("an overpaid pre-payment
      needs a manual credit") as it is: that credit is the overpaid-prepayment credit, which Phase 41
      builds, and this phase refuses to credit prepayment invoices.
    - Playwright: a new `visual/admin-phase39.spec.ts` (the Booking detail with the button and a
      notice, the additional-invoice sheet, an additional invoice document with its link, the
      credit-and-rebill sheet, a credit note document, a credited original, the Xero pair with its
      credit note) and a mobile shot of the Tell the office sheet and status. Update any spec that
      shot the addendum.
19. **Tests and docs close-out.** 14's `demoTriggers.test.ts` covers the new PWA entry and the
    re-pointed ones (routes, surfaces, disabled states, `pwaPurity`); `demoScenarios.test.ts` covers
    the rewritten S4 Beat 2 end to end at store level (stage, additional invoice, credit and rebill,
    and the paid-out variant); then the demo guide (below) and PROGRESS.

## Demo triggers

The two headline actions are **product UI**, not demo triggers (the ROADMAP names them): **Create
additional invoice** on a Procedure of an invoiced Booking in Admin, and **Credit in full and
rebill** on the Admin invoice document. The already-paid variant uses the existing payment and
payables entries. What the registry gains or changes:

| Label | Screen | Surface | Effect |
|---|---|---|---|
| Stage post-op scenario (re-pointed, `stage-post-op`) | Admin · Review and Admin · Booking detail, Dr Sharma's Tue 14 Jul AM List only | bar | Kept only to authorise and bill the seeded original. Result: "Authorised and billed. Open Sarah Mitchell's Booking and use Create additional invoice on the Procedure." Disabled "Already staged: use Create additional invoice on the Procedure" |
| Office raises the additional invoice (new, `pwa-office-raises-additional-invoice`) | Mobile · Booking (`/mobile/lists/:listId/bookings/:bookingId`) | PWA only (`surfaces: ['pwa']`, `badge: 'office-stand-in'`) | `raiseAdditionalInvoiceFromNotice` as `OFFICE_SIMULATION_ACTOR` on the oldest open notice for the Booking in the URL, at the D10 default price. Result: "The office raised AA-2026-00NN for the post-op ward or HDU review. The Booking shows Invoiced by the office." Disabled "No charge told to the office yet" |
| Payment received · full / half (re-pointed) | Admin · Invoice and the Xero sim pair (`/demo/xero/invoices/:accRecId`) | bar | Disabled "Invoice credited" on a credited invoice; unchanged otherwise. With Run payables on the Billing monitor it stages the paid-out case before a credit |
| Regenerate from locked data (re-pointed, `regenerate-invoice`) | Admin · Invoice | bar | Also regenerates an additional invoice from its basis and a rebill from its corrected lock; reports "identical" or the differences |

PWA parity: the mobile beat is "Tell the office about a later charge" on an authorised Booking, then
the office's side. On a handset the Booking must first be authorised, which 14's "Office authorises
this List" does (for example on Dr Souter's Mon 20 AM List), then "Tell the office", then "Office
raises the additional invoice"; the status pill moves to "Invoiced by the office". Credit and rebill
has no mobile side (the anaesthetist sees no amounts and no credit statement while OQ-42 is open), so
no PWA entry is needed for it. The framed build has no bar stand-in for the office: the presenter
plays the office in Admin. The Control Panel page gains nothing; its index lists the new PWA entry
under its screen automatically.

## Out of scope

- **US-08.6.4, splitting a combined Procedure** into additional invoices: Parked on OQ-53. Nothing
  here models a combined Procedure.
- **Refunding or reusing a held credit** (money a payer paid on a credited invoice), applying it to
  the rebill, and any trust-account movement: Phase 41. This phase records `heldForPayer` only.
- **Recovering money from an anaesthetist already paid** (an offset in the next payables run, a
  carried-forward balance, an anaesthetist statement line): OQ-42. Trail only, unless the drift check
  finds it answered and it fits.
- Crediting a **prepayment** invoice (Phase 41: overpaid-prepayment credit and refund on cancellation)
  or an **AA-FEE** invoice (a follow-up to 16; no catalogue item asks for it yet).
- **Partial credits** and editing or voiding an issued invoice in place: never, by policy (OQ-28).
- **Credit without rebill.** The catalogue's rule is credit in full, then rebill. If AA asks for a
  credit-only path (for example both the patient and the insurer paid and one invoice should simply
  go), it becomes a catalogue item first.
- An **approval step** for either action (US-08.6.3: none), and a second-person check.
- The **anaesthetist adjustment** on an additional invoice (D10: the office override only).
- The Solutions Plus "three" and "six" numbers (OQ-51): the link is reproduced, not the numbering.
- A real email, portal upload or Xero API; the Xero side stays the simulation.
- A credit or additional-invoice view for the anaesthetist beyond the notice status (no amounts,
  per the 2026-09-28 ruling), and the web Accounts statement for a credit (OQ-42).
- Changing the AA fee basis for credited or refunded collections (the fee reads receipts, which a
  credit does not move; refunds are 41's).
- A mailto email for "Tell the office": the in-app notice stands in for today's email.

## Manual test checklist

Session 1 (after **Reset → Confirm reset**):

- [ ] Admin · Review for Dr Sharma's Tue 14 Jul AM List: Demo actions shows **Stage post-op
      scenario**; it authorises and bills the List, and a second press says "Already staged". On any
      other List it does not appear.
- [ ] Admin · Booking detail for Sarah Mitchell (Tue 14): the Procedure shows **Create additional
      invoice**. On a DRAFT or SUBMITTED Booking it is absent; on a Booking whose billing failed it is
      disabled with the refusal sentence.
- [ ] The sheet defaults the Contract to the locked Health NZ Contract and the party to the original
      invoice's party. Add a **Post-op ward or HDU review**, Wed 15 Jul, 15 minutes: 1 unit x $30.00 =
      $30.00 ex GST shows live, with the provisional pricing chip. A date before 14 Jul or after
      today is refused inline.
- [ ] Override the amount without a reason: refused. With a reason: accepted, the computed and final
      amounts both visible. Change the party without a reason: refused.
- [ ] **Issue additional invoice**: it lands on a new invoice document with a new `AA-2026-` number,
      "Additional invoice · relates to AA-2026-...", the dated line, and Xero "ACCREC and ACCPAY
      created" with the `-P` payable. No approval step was asked for.
- [ ] The original invoice shows an **Additional invoices** rail card listing it; the original's
      lines, total and number are unchanged; the Booking is still locked and unchanged in its
      History.
- [ ] Admin · Invoices shows the new row with Kind **Additional** and "Additional to AA-2026-...".
      The Billing monitor row says "+1 additional invoice". Phase 36's ledger shows its own pair.
- [ ] Demo actions on the additional invoice, **Regenerate from locked data**: "identical".
- [ ] Nowhere in the three apps is there "Add post-op event" or an addendum banner.
- [ ] Mobile, Dr Souter: authorise a List (Admin, or the PWA "Office authorises this List"), open a
      Booking on it: **Tell the office about a later charge** is there; on a DRAFT Booking it is not.
      Send a 15 minute pain consult for yesterday: the status reads **Waiting for the office**, with
      no amount anywhere. The web Booking detail shows the same.
- [ ] Admin · that Booking shows the notice; **Create additional invoice** opens prefilled; issuing it
      turns the mobile status to **Invoiced by the office**. A second notice **Dismissed** with a
      reason shows "Not billed" and the reason on mobile. The Billing monitor's "Late charges told"
      count follows.
- [ ] Add billing line (mobile and web, DRAFT Booking): the line type chips and "Different date" work;
      a nerve catheter dated the day after the List shows its type and date on the Booking; Contract
      add-on fee lists the Contract's add-ons only when it has any.
- [ ] PWA (`npm run build:pwa`, then preview): on an authorised Souter Booking with an open notice,
      the demo-actions sheet shows **Office raises the additional invoice**; it raises the invoice
      and the status moves. With no open notice it is disabled with its reason. It never appears in
      the framed harness bar.
- [ ] Stop point: `npm run build`, `npm run build:pwa` and `npx vitest run` green.

Session 2 (after **Reset**, stage, and one additional invoice as above):

- [ ] On Sarah Mitchell's original invoice, **Credit in full and rebill**: step 1 needs a reason and
      says "Unpaid: nothing to refund". Step 2: correct the PO number; the rebill total equals the
      original; the trail preview names four entries.
- [ ] Confirm: it lands on the **CREDIT NOTE** `CN-2026-0001`, "Credits AA-2026-... in full", the
      mirrored lines and total, Delivery "Emailed to ..." with "Simulated send" and the Xero caption,
      and Xero "ACCRECCREDIT CN-2026-0001" and "Draft ACCPAY voided".
- [ ] The original shows **Credited**, "Credited in full by CN-2026-0001 · rebilled as AA-2026-...",
      its number and lines unchanged; the rebill shows "Rebills AA-2026-..." and the corrected PO
      number, with its own pair. Admin · Invoices shows all three rows with their kinds.
- [ ] Phase 36's whole ledger stays in balance; the per-anaesthetist trail for Dr Sharma reads debit,
      credit, contra, new debit. The Audit viewer shows every step as its own entry.
- [ ] Payment received on the credited original is disabled "Invoice credited".
- [ ] Paid-out case: on the rebill, **Payment received · full**, then Billing monitor **Run
      payables**, then **Credit in full and rebill** with "Paid twice": step 1 shows the held credit
      and "Dr Sharma was paid $x: recovery to be agreed with AA". After confirming, the ledger shows
      "Credits held for payers" and "Recovery due from anaesthetists · To be agreed · provisional",
      the Xero sim shows the ACCPAYCREDIT, and the next **Run payables** pays nothing for it.
- [ ] Arm handoff failure, then credit and rebill another invoice: the credit note shows "Xero
      correction failed"; the Billing monitor's Resolve and retry completes both the reversal and the
      new pair.
- [ ] Credit the rebill again (a chain): refused on the original ("already credited"), allowed on the
      rebill.
- [ ] A prepayment invoice and an AA-FEE invoice show no Credit button, with the reason.
- [ ] Web Accounts (Dr Souter, after crediting one of her S3 invoices): the credited invoice leaves
      Outstanding and the rebill joins it next day; no amounts moved elsewhere.
- [ ] Xero sim: no NHI on any credit note; pair detail shows allocated and unallocated amounts.
- [ ] No en or em dash in any new app string; teal is the only action colour on the new sheets and
      rails; no crimson on the credit note.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots` green.

## Demo guide updates

S4 Beat 2 is rewritten here (the ROADMAP gives it to this phase), and this is a **milestone phase**:
end with a consistency read of `master-demo-guide.html` against the run sheet.

- **`03-demo-script.md`:**
  - **S4 Beat 2** becomes "Beat 2: additional invoice, then credit in full and rebill":
    - Click: on Admin Review (or the Booking) for Dr Sharma's Tue 14 Jul AM List, **Demo actions →
      Stage post-op scenario**; open **Sarah Mitchell → Create additional invoice**; add a **Post-op
      ward or HDU review, Wed 15 Jul, 15 minutes**; **Issue additional invoice**; show the link on the
      original. Then on the original invoice, **Credit in full and rebill**, reason **Wrong PO or
      reference**, correct the PO number, confirm; show the credit note, the credited original and
      the rebill, then the Xero sim pair.
    - Say: "A ward review the day after surgery does not reopen the Booking. The office raises an
      additional invoice on the Procedure: its own number, its own receivable and payable, its own
      Xero pair, linked both ways, no approval step. And when an invoice is wrong, we never edit it:
      we credit it in full and rebill, and both sides move, receivable and payable, in our ledger and
      in Xero."
    - Expected: the additional invoice with its link, the original unchanged; the credit note, the
      Credited original, the rebill with a new number; the ledger in balance.
    - Optional aside (paid-out case): Payment received, Run payables, then credit: "Once the
      anaesthetist has been paid, we record what is to be recovered; how it is recovered is AA's
      call (OQ-42)."
    - Optional handset aside: "Tell the office about a later charge" on Dr Souter's authorised
      Booking, then the PWA "Office raises the additional invoice".
    - Fill in the actual invoice and credit note numbers from a reset run.
  - The **Direct URLs** table gains "One credit note · `/admin/credit-notes/<creditNoteId>`".
  - The S4 discovery points gain OQ-45 (pricing, D10 as built), OQ-51 (numbering) and OQ-42
    (recovery after payout), each one line.
- **`02-workflows-and-handoffs.md`:** the "Post-operative addition" case is rewritten (the
  anaesthetist tells the office; the office raises an additional invoice; the original stays locked);
  a new "Correction after invoicing" case (credit in full, then rebill; both sides move; recovery
  after payout open); the readiness table row "Pre-payment, addendum, billing monitor/retry" is
  reworded to "additional invoices, credit and rebill".
- **`04-presenter-cheat-sheet.md`:** "Built and clickable" (line ~190) loses "post-op addendum" and
  gains additional invoices and credit and rebill; "The money model" gains one line on the trail
  (debit, credit, contra, new debit); "Strong phrases" gains "We never edit an issued invoice; we
  credit it in full and rebill"; "Statements to avoid" gains "the anaesthetist raises a post-op
  Booking".
- **`01-personas-and-responsibilities.md`:** the office's responsibilities gain raising additional
  invoices and credit notes; the anaesthetist's gain telling the office about a later charge.
- **`README.md`:** the readiness row (line ~95) is reworded.
- **`master-demo-guide.html`:** the same sections (the readiness row ~527, the exceptions paragraph
  ~733, S4 Beat 2 ~918 to 921, the cheat-sheet equivalents), then the milestone consistency read.
- **Control Panel scenario text:** the S4 scenario's message (re-homed by 14) replaces "stage
  post-op ... Add post-op event" with "stage post-op, then Create additional invoice and Credit in
  full and rebill on Sarah Mitchell".

## Adversarial review (after build)

Once the manual test checklist and `npm run build`, `npm run build:pwa`, `npx vitest run` and
`npm run shots` are green, and before writing the PROGRESS entry, run the standard **adversarial
review-and-fix pass (PROGRESS convention 18)**:

- fan out three independent Opus review subagents, one each for **quality**, **bugs/correctness** and
  **plan adherence** (scale to four or five, adding **money integrity**, as the Phase 08 to 10 money
  phases did, given the ledger and Xero reversal), each given the covered catalogue files, this doc
  and the diff;
- this session then independently verifies every finding against the catalogue, this doc and the
  code, fixes the confirmed ones (with a test wherever a bug had none), re-greens, and records the pass
  in the phase entry;
- do not re-raise anything already settled in the Decisions log (as amended by this phase).

**Steer this phase's reviewers at:**

- **Immutability.** Neither action writes the original Booking, its Procedures, its lock or the
  original invoice record and lines. Every back-link and the "Credited" state are derived. Hunt for
  any spread-and-overwrite of `billing.invoices[originalId]` or `billing.locks[bookingId]`.
- **Money conservation.** For every `reversalPlan` case, in cents: credit note total equals the
  original's; the payable reversal equals the payable; `heldForPayer` equals what was received;
  `recoveryDue` equals what was disbursed; 36's whole ledger shows zero imbalance afterwards; the
  anaesthetist's position moves by exactly the reversal and then the rebill. A payment on a credited
  ACCREC, a payables run over a reversed ACCPAY, and a late handoff of a credited invoice are all
  refused. The AA fee (16) and GST activity (38) do not move on a credit.
- **Both sides together.** The Xero reversal and the rebill's pair land in one commit or neither
  does; the fault path leaves a retryable, visible state; the retry is idempotent; no NHI reaches a
  credit note.
- **Additional invoice rules.** Admin only; no approval step; no List event and no billing-run
  re-entry; the Contract comes only from 20's scope rule; the party change and every amount
  override need a reason and are audited with computed and final values; the D10 branch is one
  constant; its number comes from the ordinary sequence; Regenerate reproduces it; the anaesthetist
  adjustment is not offered.
- **Rebill rules.** Unchanged fields keep the original's locked values and Contract version; a
  changed Contract locks at the List-date version; the Contract-change and covered-split guards hold;
  a rebill can itself be credited; a prepayment or AA-FEE invoice cannot be.
- **Retired behaviour gone.** No `addPostOpAddendum`, `bookingType`, `addendumOfBookingId`, addendum
  banner, "Add post-op event", addendum Booking source, or addendum List helper remains; the
  stage trigger authorises only.
- **Tell the office.** Anaesthetist surfaces show no amount or invoice number; only the Booking's own
  anaesthetist can send a notice; a notice never writes the Booking; the PWA stand-in is PWA only,
  acts on the URL's Booking, and its body lives in `src/store` or `src/shared` so `pwaPurity` holds.
- **Determinism and persistence.** No `Date.now()`, `new Date()` or `Math.random()`; dates from the
  demo clock; `PERSIST_VERSION` bumped and the migrate test discards a stale addendum payload; two
  fresh seeds deep-equal; S3's scripted figures unchanged.
- **Design and copy.** The sheets and rails follow the admin patterns and tokens; teal is the only
  action colour; the credit note is neutral, not red, and never crimson; provisional labels present
  for D10, OQ-42 and the credit-note delivery; no en or em dashes in app copy.

## PROGRESS.md updates

- **Status row** for catch-up Phase 39, and a phase entry with:
  - the drift-check result (items changed or not; FT-08.6, US-08.6.1, US-08.6.2 still Verify or not;
    OQ-42, OQ-45, OQ-51 and OQ-53 status; D10 answered or built as the provisional default, and which
    branch);
  - what was built, with the name map for later phases: `OtherLineType`, `OTHER_LINE_TYPE_LABEL`,
    `serviceDateRefusal`, `describeOtherLine`, `ADDITIONAL_PRICING_RULE`, `priceAdditionalInvoice`,
    `AdditionalInvoiceBasis`, `createAdditionalInvoice`, `LateChargeNotice` and its actions,
    `liveInvoiceForProcedure`, `CreditNote`, `creditInFull`, `reversalPlan`, `xeroCorrectionPlan`,
    `applyCredit` and the extended `ledgerPosition` equation, `correctedLock`, `rebillDrafts`,
    `RebillBasis`, `creditAndRebill`, `handoffCorrection`,
    `XeroCreditNote`, the derived back-link selectors, the new lineage roles, id formats, audit
    actions and route; and the removed `addPostOpAddendum`, `bookingType`, `addendumOfBookingId`;
  - the `PERSIST_VERSION` bump or bumps (from and to);
  - tests added and the before and after Vitest and Playwright counts;
  - the review pass.
- **Decisions log:**
  1. **Superseded:** 2026-07-24 "Phase 09, the four open-question readings", reading (3), the
     post-op addendum as a new linked Card with its own capture, submit, authorise and bill cycle.
     Late charges are admin-raised additional invoices on the Procedure with no approval step
     (OQ-24); the anaesthetist tells the office (RV-10).
  2. **Amended:** the Phase 08 and 09 rulings that "a negative invoice is never raised; a real
     practice issues a credit note" and "the over-prepaid full case fails to the monitor (no
     credit-note issuance, out of scope)". The `negativeTotal` belt stays for drafts; corrections are
     now credit notes, and the overpaid-prepayment credit is Phase 41's.
  3. **New:** D10 as built (the OQ-45 recommendation by default, one constant); the anaesthetist
     adjustment is not offered on additional invoices.
  4. **New:** a credit note is its own record, not an invoice kind, so no invoice sum or count can
     include it; the original invoice is never written, and "Credited" and every link are derived.
  5. **New:** a rebill keeps every uncorrected locked value, including the Contract version; a
     changed Contract locks at its version in force on the List date (the question Phase 25 left).
  6. **New:** after payout, credit and rebill records the recovery due as a provisional trail only
     (OQ-42); a paid credited invoice leaves a credit held for the payer, refunded or reused in 41.
  7. **New:** the engine sends the credit note to the billable party through the invoice delivery
     plan (Xero does not send credit notes; mechanism to confirm); a payment on a credited ACCREC is
     refused.
  8. **New:** additional invoices take the ordinary number sequence while OQ-51 is open; the
     in-app "Tell the office" notice stands in for today's email.
- **Handoff notes:**
  - For **41**: reuse `CreditNote` (`cause` widens to the overpaid-prepayment credit and the
    cancellation refund), `creditInFull` and `reversalPlan`; `heldForPayer` is the balance a refund
    or trust-account movement settles; prepayment invoices are still refused by `creditAndRebill`.
  - For **40**: the patient view lists additional invoices, credit notes and rebills with their
    standing; a credited invoice is not unpaid for the unpaid-patient alert.
  - For **37**: engine credits and voids carry their credit note id and must not be flagged as
    Xero-side voids; corrections go through the outage queue.
  - For **38**: confirm (or note, if 38 ran first) that Outstanding drops a credited invoice and
    takes the rebill through the ledger.
  - For **43**: the credit and additional-invoice rows must stay usable at full scale.
  - For **44**: S4 Beat 2 as rewritten here; the OQ-42, OQ-45 and OQ-51 lines if answered later; the
    stale US-08.6.1 screenshots need re-shooting by the owner.
  - **US-08.6.4 (Parked):** when OQ-53 is answered, the split is a second use of
    `AdditionalInvoiceSheet` with a party per invoice.
