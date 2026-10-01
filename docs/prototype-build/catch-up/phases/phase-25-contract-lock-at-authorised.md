# Phase 25 · Contract versions and the AUTHORISED lock

**Requirements covered:**
[US-04.1.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.1.3.md) (Contract audit and versioning),
[US-04.3.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.3.5.md) (Contract locked at AUTHORISED; Confirmed),
[US-07.3.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-07.3.1.md) (authorise the List: the lock and snapshot half),
[US-08.1.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.1.1.md) (process an AUTHORISED List using each Procedure's locked Contract; merges the retired US-08.1.2),
[US-08.4.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.4.4.md) (invoice reproducibility),
[US-15.0.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-15.0.3.md) (enter once: the billing exception half);
[DM-08](../analysis/domain-model-delta.md#dm-08) (Contract versions and the AUTHORISED snapshot; was DM-07 before the 2026-10-01 update);
[RV-01](../analysis/reverse-check.md#rv-01-billing-engine-re-resolves-the-contract-and-payer-at-billing-time-no-contract-lock-at-authorised) (the engine re-resolves the Contract at billing time).
Touches, without closing: [DM-06](../analysis/domain-model-delta.md#dm-06) (the payee anaesthetist is
stamped on the locked record here; the doer's-List move is Phase 32 and the prepaid payee repoint
Phase 41), [US-04.2.12](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.12.md)
(Phase 22 builds the full or split payment setting; this phase locks it and the split it applied) and
[US-08.5.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.5.2.md)
(Matches; [OQ-05](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-05.md) is
answered: failure is per Booking and a List never fails as a whole, which the re-based failure beat
shows).
Nearby, not blocking: [OQ-48](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-48.md)
(which date decides the price in force; still Open, recommendation the procedure date, which Greg
leaned to on 2026-10-01) and [OQ-68](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-68.md)
(the split basis; the lock copies whatever 22 built).
**Depends on:** Phases 19, 22, 23 and 24, and through them the whole Contracts track: 18's Contract
shape (category, holder, scope, pricing basis, rate steps, fee schedule lines with dated prices,
`aaCode`), 19's RVG, modifier and master procedure lists and `resolveBaseUnits` (any base-unit value
accepted, with an after-procedure office warning when out of range), 20's one Contract per Procedure,
21's billable party, invoice email, required inputs and `authoriseBlockersFor` (the schedule miss is
its only blocker; a child billable party is a mild warning, D4), 22's Contract-driven presentation, the
payment setting (full or split) with its typed share, and the invoice's supplier snapshot, 23's primary
Procedure, multi-procedure rule, Contract base-unit override and combination Contracts, and 24's
anaesthetist adjustment. Phases 14 (trigger registry), 15 (Card is Booking) and 15a (warnings, never
blocks) are in place.
**Estimated:** 1 session on the outline, but realistically 2: sixteen work items touching the engine,
seed, three apps and the demo guide. Plan for the split after work item 9 (model, lock, engine, seed
and tests green; the UI still reads live figures) and do items 10 to 16, the demo guide and the
review pass in a second session.
**Phase 16 is not a declared dependency**, but the planned order runs it straight after 15a, before
the Contracts track, so its AA-FEE invoices and its BCTI record list (`bctiRecords`, counted only by
`bctisFor`) should exist. Confirm at the drift check. If 16 has not run, skip every clause below that
mentions them and note it in the PROGRESS entry.

## Goal

A Contract stops being one mutable record. Every committed change to a Contract or its fee schedule
appends an immutable **version**, and the Contract carries its current version number.

When the office authorises a List, `authoriseList` writes a **locked record** for every Procedure on
every non-cancelled Booking, in the same commit that flips the List to AUTHORISED. The record holds
everything the price and the invoice depend on:

- the Contract id and version, with a copy of that whole version (terms and schedule lines);
- the pricing date (the procedure date, which is the List date), and the rate used: the
  anaesthetist's unit value, the Contract rate step or discount, or the schedule line price;
- base units and their source (master procedure list, Contract override, RVG guide, chosen range
  value or manual override, including a value outside the guide range that the anaesthetist kept),
  time units and the captured times, and each modifier with its unit value;
- the schedule line and add-ons used, the primary flag, the multi-procedure rule and this
  Procedure's share of the modifier split;
- the payment setting (full or split) and, for a split, the share and the amount each party pays;
- the anaesthetist adjustment, the permission it was applied under and its before and after amounts,
  and the office override, each with its reason;
- at Booking level: the **payee anaesthetist** (the List's anaesthetist at authorise, who did its
  procedures, US-01.4.6) with the supplier details the invoice and the BCTI print (name, GST number);
  the billable party with the details printed on the invoice (name, email, address or contact as the
  invoice shows them), invoice email, required-input values, presentation (layout, delivery, GST
  treatment), the GST rate, and any pre-payment already invoiced.

The billing run then prices **only** from that record. There is no effective-date fallback, no route
or payer resolution, and no "Resolve & retry" that edits the Contract master. A Contract that is not
in force on the List date is caught before authorise, as a blocker on the Review screen, instead of
being silently swapped for a default at billing time. The payee is read from the record too: the
ACCPAY, the receipts and the anaesthetist's accounts stop joining Booking to List to find who is
paid.

Locked Bookings display from the snapshot: fees, units, rate and Contract name stop drifting when a
master changes, and carry a "Contract vN locked at authorise" badge. The Contract editor lists its
versions with the invoices raised under each. A screen-contextual **Regenerate from locked data**
button on the Admin invoice document rebuilds the invoice from the lock and proves it identical, even
after a Contract or unit-value edit.

The S4 Beat 3 billing failure no longer works (a dated-out Contract cannot fail a locked Procedure),
so the re-homed **Trigger billing failure** is re-based on a cause that still fails under a lock: a
claim reference that the locked Contract version requires and the Booking lacks. Failure stays per
Booking, as OQ-05's answer says: the List never fails as a whole, the failed Booking raises none of
its invoices, and its siblings bill. The office supplies the reference in the Billing monitor and
retries, once.

## Before you start: drift check

1. Run the drift diff and read it for this phase's items:

   ```
   git diff 501b0b8 -- "docs/discovery-reference/Updated Requirements/catalogue" "docs/discovery-reference/Updated Requirements/domain-model.md"
   ```

   - Check `US-04.1.3`, `US-04.3.5`, `US-07.3.1`, `US-08.1.1`, `US-08.4.4` and `US-15.0.3`.
   - Also check the items this phase leans on: `US-08.1.2` (Retired, merged into US-08.1.1),
     `US-12.1.1` (its technical note on copying the unit value at AUTHORISED), `US-04.2.10`,
     `US-04.2.12` (payment setting), `US-01.4.6` and `US-06.5.4` (who is paid), `US-08.5.1`,
     `US-08.5.2`, `US-13.3.2`, `OQ-48`, `OQ-68`, `OQ-70`, and the Booking ("Billing fails per
     Booking"), Procedure and "Contract (recommended structure)" sections of `domain-model.md`,
     including its "Procedure billing context" table.
   - At `501b0b8` (the 2026-10-01 update): US-04.3.5 and US-08.4.4 gained links only; US-08.5.2 was
     rewritten to OQ-05's answer (Verify, per-Booking failure, the whole Booking held back when any
     Procedure's billable party fails); US-04.2.12 is new (full or split, basis open as OQ-68);
     US-01.4.6 and DM-06 put the payee on the record at authorise. **Which fields are frozen** is
     still not named (US-04.3.5, US-07.3.1 and US-15.0.3 all say "to be determined in discovery"),
     so the whole-version snapshot stands.
   - If an item changed after `501b0b8`, re-read it and adjust the work items before building. If
     discovery names the fields to freeze, lock exactly those plus whatever the price and the payee
     need, and record the list in the Decisions log.
   - If an item is now Retired or Future, drop it from this phase and say so in the PROGRESS entry.
     US-04.3.5 is Confirmed; if it alone survives, the lock and the engine change still stand.
2. **OQ-48 (which date decides the price in force).** Still Open at `501b0b8`; its recommendation is
   the procedure date and Greg leaned to it on 2026-10-01. Build that: the price in force is the one
   effective on the **List date** (the procedure date, Phase 18's rule). The lock records it as
   `pricingDateISO`, so a different answer later changes which step is chosen at lock time, never
   what a lock holds. Phase 18 holds the one provisional label; add none here. If OQ-48 has since
   been answered with another date, use that date in `buildBookingLock` and update the tests.
3. **OQ-05 is answered** (failure per Booking; a List never fails as a whole; a Booking with any
   failed Procedure or billable party is held back whole, for a manual fix by AA admin staff). The
   prototype already isolates per Booking (the Phase 09 reading), so build nothing new for it: keep
   the isolation, test it under the lock (work item 6), including a split Booking, and record in the
   Decisions log that the Phase 09 reading is now confirmed.
4. **Confirm what Phases 16 and 18 to 24 actually delivered** (their PROGRESS entries and handoff
   lists). The lock must capture every price, invoice and payee input they added, under the names
   they gave. Write down, before touching code:
   - every store action that writes `masters.contracts` or the fee schedule (18's `editContract`,
     `retireContract`, rate and line actions, the mint in `createHospital` and
     `setInsurerDirectClaims`; 21's required inputs; 22's invoicing settings and payment setting;
     23's multi-procedure rule, base-unit overrides and combination Contracts; 24's
     allows-adjustment flag). Every one must append a version (work item 3). Grep `contracts:` and
     `feeScheduleLines:` writes under `src/store/`.
   - the Booking-level pricing entry point 23 built (`bookingFeeFor`) and its context type;
   - 19's `baseSource` vocabulary (`'captured' | 'contract' | 'procedureMaster' | 'rvgGuide' |
     'rvgRangeChosen' | 'none'`, plus 23's `'additional'`) and `outOfGuideRange`;
   - where 24 stores the anaesthetist adjustment and its before and after amounts (its handoff names
     `anaesthetistAdjustment`, `beforeAdjustment`, `afterAdjustment` and `officeOverride` per
     Procedure);
   - where 22 stores the payment setting and the split share (the plan's typed $ or % value, which
     OQ-68's recommendation sets on the Booking, defaulting from the Contract), the pure split
     function it built, `Contract.invoicing` and the `Invoice.supplier` snapshot;
   - where 21 stores required-input values (it kept the claim reference as the per-Procedure
     `billingReference`, relabelled "Claim or hospital reference"), `requiredInputValuesFor`, and that
     the COS ACC Contract declares `claimReference` required;
   - that 21's `authoriseBlockersFor` holds the schedule miss only. A child billable party is a mild
     warning in 15a's routine (D4), never a blocker. If missing required inputs block authorise, re-base
     the failure trigger on the handoff path instead (see "Demo triggers", fallback).
   - what 20 left in `resolveContractForProcedure`: it kept the stored-Contract branch and its
     expired-holder fallback and `contractIneffective` deliberately for this phase.
   - **every place that works out the payee live**: `handoffCase` in `store/xeroHandoff.ts` (~l.168,
     the ACCPAY contact from `list.anaesthetistId`), the two `anaesthetistIdForCase` helpers
     (`store/paymentActions.ts` ~l.67 for receipts, `store/selectors.ts` ~l.612 for the web accounts),
     16's `bctiRecords` (which anaesthetist a BCTI counts against) and 22's `Invoice.supplier`.
   - whether Phase 16 has run (AA-FEE invoices, `bctiRecords` and `bctisFor`).
5. Record the current `PERSIST_VERSION` (13 at `501b0b8`; 14 to 24 will have bumped it).
6. Record the result, including "no drift", in the PROGRESS entry.

## Reference

**Design (convention 17):**
- `docs/design/Admin Review.dc.html`: the authorised state is the model for the lock treatment. After
  authorise the table dims to 0.72, each row gets a small mist-stroke lock glyph, and the header pill
  reads "Authorised · locked" in the success tint. The version badge follows that anatomy: the lock
  glyph plus a mono `v2`, neutral tint, beside the Contract name in the CONTRACT column. It is not a
  seventh status colour.
- `docs/design/Design Language.dc.html` for tokens: neutral pill tint and on-tint, Spline Sans Mono
  tabular-nums for version numbers and money, 4pt spacing, radius `pill` and `card`, teal as the only
  action colour, crimson for identity only.
- No mockup covers Master data, the invoice document or the Billing monitor. Extend the admin's own
  table, rail-card and pill patterns. Admin is desktop: panels and overlays, not bottom sheets.
- `docs/design/Mobile App.dc.html` only for the badge on the shared Booking billing block (no money
  on mobile).

**Catalogue:** the six covered files above; `domain-model.md` sections "Booking" ("Billing fails
per Booking, not per List"), "Procedure" ("Exactly one Contract. Snapshot of the Contract version
taken at AUTHORISED."), "Contract (recommended structure)" (`id, aaCode, name, version, …`: "Versions
are kept so old invoices reproduce"; the `paymentSetting` row) and its "Procedure billing context"
table (`contractId + contractVersion`: "Locked at AUTHORISED");
[US-08.1.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.1.2.md)
(Retired, but its text is the confirmed departure quoted in US-08.1.1's acceptance criterion);
[US-08.5.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.5.1.md),
[US-08.5.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.5.2.md)
and [US-13.3.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.3.2.md)
(failure reporting, per-Booking isolation and the manual fix, which the re-based trigger
demonstrates);
[US-04.2.12](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.12.md)
(the payment setting the lock copies);
[US-01.4.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-01.4.6.md)
and [US-06.5.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-06.5.4.md)
(the payee follows the Booking to whoever did it; the prepaid repoint is Phase 41's);
[US-12.1.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-12.1.1.md)
(its technical note: the unit value is copied to the billing record at AUTHORISED).

**Analysis:**
- [GAP-ANALYSIS.md](../GAP-ANALYSIS.md): Theme 3 "Contract replaces the billing route" (versions and
  the payment setting), the DM-06 and DM-08 rows, the RV-01 row, "Demo impact" (S4 Beat 3, S5 Beat
  4), and the EP-04, EP-07, EP-08 and EP-15 tables.
- [epics/EP-04.md](../epics/EP-04.md), [EP-07.md](../epics/EP-07.md), [EP-08.md](../epics/EP-08.md),
  [EP-15.md](../epics/EP-15.md).
- `gaps.json`: the entries for the six covered IDs, `US-04.2.12`, `US-08.5.2`, `DM-06`, `DM-08` and
  `RV-01`.
- [analysis/domain-model-delta.md](../analysis/domain-model-delta.md) DM-08 and DM-06;
  [analysis/reverse-check.md](../analysis/reverse-check.md) RV-01.
- [analysis/prototype-map-store-seed.md](../analysis/prototype-map-store-seed.md) §2, §4, §7, §8;
  [prototype-map-domain.md](../analysis/prototype-map-domain.md) §5;
  [prototype-map-admin.md](../analysis/prototype-map-admin.md) §5 to §7 and §9;
  [prototype-map-shell-demo-pwa.md](../analysis/prototype-map-shell-demo-pwa.md) for the harness bar
  and the PWA office stand-in.

**Code entry points** (named as at `501b0b8`, where the prototype is unchanged since `501b0b8`; use
the names Phases 15 to 24 gave them, for example Booking for Card and `FeeScheduleLine` for
`ContractPrice`):
- `aa-prototype/src/domain/types.ts`: `Contract`, `FeeScheduleLine` (18), `Procedure`
  (`governingContractId`, the 19/23/24 fields), `Invoice`, `InvoiceLine`, `BillingCase`, the
  `masters` and `billing` slice shapes.
- `aa-prototype/src/domain/billing/invoiceBuild.ts`: `defaultContractFor`,
  `resolveContractForProcedure` (the fallback and `contractIneffective` branch 20 left),
  `buildInvoicesForCard` (its Booking name), `InvoiceBuildContext`, the line-description snapshot.
- `aa-prototype/src/domain/billing/fee.ts` (`feeFor`, `FeeContext`, `FeeResult`, `resolveBtm`), 19's
  `baseUnits.ts` (`resolveBaseUnits`, `BtmBreakdown.baseSource`), 23's `bookingFee.ts`
  (`bookingFeeFor`), 24's adjustment step, 22's payment-setting split and `invoicePresentation.ts`
  (`supplierFor`, `GST_RATE`).
- `aa-prototype/src/domain/billing/validateCardForBilling.ts` (`feeContextFor`), 21's
  `requiredInputs.ts` (`requiredInputsFor`, `missingRequiredInputs`).
- `aa-prototype/src/store/lifecycle.ts`: `authoriseList` (~l.277), 21's `authoriseBlockersFor`.
- `aa-prototype/src/store/billingRun.ts`: `runBillingForList` (~l.68), `retryBillingCase` (~l.285),
  `wireBillingRun`; `aa-prototype/src/store/xeroHandoff.ts`: `handoffCase` (the payee lookup at
  ~l.168); `aa-prototype/src/store/paymentActions.ts`: `anaesthetistIdForCase` (~l.67,
  `receivePayment`); 16's `bctiRecords` and `bctisFor`.
- `aa-prototype/src/domain/types.ts`: `BillingCase` (~l.697, no payee field today),
  `BillingReceipt.anaesthetistId` (~l.745), `XeroAccPay`.
- `aa-prototype/src/store/contractActions.ts` and `mastersActions.ts` (every Contract write;
  `editAnaesthetist`'s doc comment about re-pricing).
- `aa-prototype/src/store/selectors.ts`: `billingContextForCard`, `prePaidByProcedure` (~l.345),
  `billingMonitor` (~l.429), `anaesthetistIdForCase` (~l.612, the web accounts), `invoiceLinesFor`,
  `isBackdropInvoice`.
- `aa-prototype/src/shared/capture/feeContext.ts`: `procedureFee`, `cardFee` (the live display path).
- `aa-prototype/src/shared/card/CardDetailBody.tsx`, `OfficeBillingSetup.tsx`, 21's Billing block.
- `aa-prototype/src/apps/admin/screens/ReviewScreen.tsx` (tiles, CONTRACT column,
  `@ $x/unit (list rate)` at ~l.287), `InvoiceDocument.tsx` (the rail),
  `BillingMonitorScreen.tsx` (`resolveAndRetry` ~l.65), `MasterData.tsx` (Contracts table),
  `apps/admin/flows/ContractEditSheet.tsx`.
- `aa-prototype/src/shared/demoTriggers/registry.ts` (14's `billing-failure` entry) and
  `src/store/demoStaging.ts` (new here unless an earlier phase created it: 21 seeds its child case and builds no staging file).
- `aa-prototype/src/domain/seed/`: `contracts.ts`, `cards.ts` (the Ropata Thu 16 failure List and
  Losa Tuilagi's COS ACC Booking, `billingReference` at ~l.926), `history.ts` (the `L-HIST-*` AUTHORISED Lists),
  `billing.ts`, `index.ts` (`SEED_LIST_IDS.billingFailure`, markers).
- `aa-prototype/src/apps/demo/DemoControlPanel.tsx`: S4 and S5 scenario text; the S5 jump
  authorises `SEED_LIST_IDS.whitakerFri17`.
- Tests: `store/billingRun.test.ts` (the post-completion unit-value case at ~l.454),
  `store/billingRetry.test.ts`, `store/lifecycle.test.ts`, `store/demoScenarios.test.ts`,
  `domain/seed/seed.test.ts`, 18's `domain/billing/feeParity.test.ts`; Playwright
  `visual/admin-phase09.spec.ts` (billing failure), `visual/admin-phase08.spec.ts` (invoice).

## Work items

Model, lock and engine first, re-greened before any UI.

1. **Pin the figures before touching anything.** Run 18's `feeParity.test.ts` and record the S3, S4
   and S5 figures as they stand after Phase 24 (Holt, the Prentice split under 22's payment setting,
   the design-day fees, the bariatric $2,800 and second procedure, Aria's rate x time, and 24's
   adjustment and override delta lines). Add a new
   `domain/billing/__parity__/phase-25-invoices.json` fixture: for each Booking on the S3 Lists
   (Souter Mon 20 AM and PM) and the S5 List (Whitaker Fri 17), the invoice drafts the current engine
   produces (party, supplier, layout, lines, subtotal, GST, total). Written once with `toMatchFileSnapshot`,
   never run with `-u`. Every later item must keep it passing: the lock changes where the numbers
   come from, never the numbers.

2. **Types** (`domain/types.ts`):
   - `Contract.version: number`, the current version. It is 1 on creation and only ever increases.
   - `ContractVersion`:
     `{ contractId, version, atISO, by, action, contract: Contract, feeScheduleLines: FeeScheduleLine[] }`.
     `action` is the audit action code that produced it (`contract.create`, `contract.update`,
     `contract.retire`, `contractRate.add`, and so on). `contract` and `feeScheduleLines` are full
     copies of the record and all its lines after the change, which is the "snapshot the whole
     version" reading while the fields to freeze are undecided.
   - `masters.contractVersions: Record<ContractId, ContractVersion[]>`, append-only, in version order.
   - `BookingLock`, one per Booking, holding a `ProcedureLock` per Procedure (the "locked record per
     Procedure"; Booking-level fields sit once on the Booking lock because 23 prices at Booking
     level):
     - Booking level: `bookingId`, `listId`, `lockedAtISO`, `lockedBy`, `origin: 'authorise' |
       'migrated'`, `pricingDateISO`, `payee: { anaesthetistId, name, registrationNumber,
       gstNumber, unitValue }` (the payee anaesthetist: the List's anaesthetist at authorise, who did
       its procedures under US-01.4.6, with the supplier details 22's invoice and the BCTI print;
       DM-06, DM-08), the effective billable party with a copy of the details the invoice prints
       (name, email, address or contact; US-07.3.1 "party details"), invoice email (21), `gstRate`,
       required-input values keyed by input (21's `requiredInputValuesFor`; per-Procedure inputs such
       as `claimReference`, which 21 kept as the Procedure's `billingReference`, sit on the
       `ProcedureLock` instead), `presentation: { invoiceLayout, deliveryMethod, portalName?,
       gstTreatment }` (22's `Contract.invoicing`, from the version), `prePaid` (the pre-payment
       already invoiced per Procedure, today's `prePaidByProcedure` value with its counterparty), and
       `expected: { subtotal, gst, total }` as a checksum.
     - `ProcedureLock`: `procedureId`, `contract: { id, version, name, aaCode }`, `contractVersion:
       ContractVersion` (the copy), `rate: { source: 'anaesthetistUnitValue' | 'contractRate' |
       'contractDiscount' | 'feeSchedule' | 'rateTime', unitRate?, discountPercent?, stepFromISO? }`,
       `baseUnits: { units, source, outOfGuideRange, rvgCode?, procedureTypeId?, guideRange? }` (19's
       `baseSource` vocabulary plus 23's `'additional'`), `timeUnits: { units, startISO?, handoverISO?,
       overridden }`, `modifiers: { code, units }[]`, `isPrimary`, `multiProcedureRule`,
       `modifierShare` (this Procedure's units under the 3/2/2 split), `feeSchedule?: { lineId,
       holderCode, description, priceExGst, priceIncGst, priceFromISO, quantity, addOns[] }`,
       `billingLines` (copies of the non-RVG lines), `payment: { setting: 'full' | 'split', share?,
       shareSource?, parties: { party, amountExGst }[] }` (22's payment setting and the typed $ or %
       share it applied, with where the share came from, Booking or Contract default, and the amount
       each party pays; US-04.2.12), `anaesthetistAdjustment?` with `adjustmentAllowed` (the
       version's `allowsAnaesthetistAdjustment` it was applied under), `beforeAdjustment` and
       `afterAdjustment` (24's handoff), `officeOverride?` (the existing `priceOverride`), and `fee`
       (the per-Procedure result at lock, for display), plus any per-Procedure required input
       (`claimReference`).
     - Use the field names 19 to 24 used; the list above is the content, not a naming mandate. If 22
       put the share on the Contract only (not the Booking), `shareSource` is always the Contract.
   - `BillingCase.payeeAnaesthetistId`, stamped by the run from `lock.payee` (work item 6), so the
     ACCPAY, the receipts, the web accounts and 16's BCTI records stop joining Booking to List.
   - `billing.locks: Record<BookingId, BookingLock>`. `lockedAtISO` comes from the demo clock
     (`clockISO(s.clock)` inside the recipe), never `Date.now()`.
   - `Invoice.lockedFrom?: { procedureId, contractId, contractVersion }[]`, stamped by the run, so a
     version can list its invoices without walking lines (US-04.1.3 "Invoice/Procedure does not
     reference a contract version").

3. **Contract versions** (`store/contractVersions.ts`, new, exported from the store index):
   - `withContractVersion(s, contractId, action, by, atISO)`: a pure patch helper that bumps
     `Contract.version` and appends the matching `ContractVersion` built from the post-change record
     and its lines. Every Contract-writing recipe listed at drift-check step 4 calls it inside its
     existing `mutate()`, so the version and the change land in one commit. The audit entry's `after`
     gains `version`.
   - `createContract`, and the defaults minted by `createHospital` and `setInsurerDirectClaims`,
     write v1.
   - `deleteContract` (never-used Contracts only) removes the Contract and its versions; nothing can
     reference them.
   - Selectors: `contractVersionsFor(state, contractId)`, `contractVersionOf(state, contractId,
     version)`, and `invoicesByContractVersion(state, contractId)` (reads `Invoice.lockedFrom`).
   - The versioned fields include 22's payment setting and default share, `invoicing`, 23's
     multi-procedure rule and base-unit overrides, and 24's `allowsAnaesthetistAdjustment`, so each is
     per version from here on (24's handoff).
   - Tests (`contractVersions.test.ts`): each Contract-writing action appends exactly one version
     (including a payment-setting change from full to split); the latest version deep-equals the live
     Contract and lines; earlier versions never change after later edits; a refused edit appends
     nothing; `version` equals the array length.
   - Satisfies US-04.1.3 ("keeps every version of a Contract, not just the latest").

4. **The lock builder** (`domain/billing/lock.ts`, new, pure, re-exported from the billing index):
   - `buildBookingLock(input)` returns `{ kind: 'locked', lock }` or `{ kind: 'blocked', blockers }`.
     The input carries the Booking, its non-cancelled Procedures, the List, and the masters and lines
     the price reads (the List's anaesthetist, Contracts and their current versions, schedule lines,
     RVG, modifier and master procedure lists, billing lines, pre-payments, parties).
   - It resolves everything **once**, from live data, using the same pure functions the live preview
     uses (19's `resolveBaseUnits`, 18's `rateInForce` and `matchFeeScheduleLine`, 23's
     `bookingFeeFor`, 24's adjustment, 22's payment-setting split and `supplierFor`), so the lock and
     the preview cannot disagree.
   - The payee is the List's anaesthetist at authorise. Phase 32 later moves a Booking done by
     someone else to the doer's List (US-01.4.6), which can only happen before authorise, so at
     authorise the List's anaesthetist is who did the work; the lock fixes it from then on.
   - Warnings never block (15a). An out-of-range base-unit value with 19's after-procedure office
     warning open, a child billable party (21) or any other open warning locks as entered, with
     `outOfGuideRange` recorded.
   - Blockers (these replace the engine's fallback, RV-01):
     - `noContract`: a Procedure with no Contract.
     - `contractMissing`: a Contract id that no longer exists.
     - `contractNotInForce`: the selected Contract is retired or not effective on the pricing date.
       Copy: "{Contract} is not in force on {List date}. Choose a Contract in force before
       authorising." There is no fallback to a default.
   - `feeContextFromLock(procedureLock, bookingLock)` and `priceBookingFromLock(bookingLock)` feed the
     same Booking-level engine from the snapshot only, with no masters argument, so the function
     signature itself proves the engine cannot read live data.
   - `invoiceDraftsFromLock(bookingLock)`: grouping by effective party, the payment-setting split
     (one invoice per party, from `payment.parties`), 24's adjustment and override delta lines, the
     pre-payment deduction lines, the "N units at $x per unit" line descriptions, the supplier block
     from `payee`, and the presentation fields, all from the lock. This replaces the live path in
     `buildInvoicesForCard` (its Booking name).
   - `compareInvoice(stored, storedLines, draft)` returns `{ identical, differences[] }` over party,
     supplier (payee name and GST number), layout, delivery, GST treatment, invoice email, every line
     (description, units, amount), subtotal, GST and total.
   - Tests (`lock.test.ts`):
     - **Parity:** for every completed seeded Booking, `priceBookingFromLock(buildBookingLock(...))`
       equals the live price to the cent, and `invoiceDraftsFromLock` equals item 1's fixture.
     - **Immunity:** after building a lock, change every master the price, the invoice or the payee
       reads (the anaesthetist's unit value, name and GST number, a Contract rate step, a schedule line
       price, an RVG base value, a master procedure list entry, a modifier's units, the Contract's
       base-unit override and multi-procedure rule, its allows-adjustment flag switched off, its
       payment setting switched between full and split and its default share, its invoicing settings,
       the Contract name) and the lock still prices, splits and presents identically, to the same
       payee.
     - Each lock field is populated for each pricing basis (anaesthetist rate, contract rate,
       discount, fixed schedule with an add-on and a quantity, rate x time), for a full and a split
       payment setting, for a combination Contract under a parent procedure (23), and for an
       out-of-range base-unit value.
     - Each blocker, and a Contract retired after the Booking was completed.

5. **`authoriseList` writes the locks** (`store/lifecycle.ts`):
   - `lockBlockersFor(state, listId)` runs `buildBookingLock` for every non-cancelled Booking and
     returns the blockers per Booking. 21's `authoriseBlockersFor` includes them beside its schedule
     miss, so the Review UI and `authoriseList` still share one pure function. Warnings stay out of
     it (15a).
   - `authoriseList` refuses with `authoriseBlocked` when any blocker exists. Otherwise one `mutate()`
     flips the List to AUTHORISED, writes `billing.locks` for every Booking, and audits `list.authorise`
     plus one `booking.lock` per Booking (`after`: Contract ids and versions, payee, unit value,
     payment setting, pricing date, `expected.total`). Then it emits `listAuthorised`, as today.
   - A refused authorise writes nothing. A List with only cancelled Bookings locks nothing and still
     authorises.
   - Add readable labels for every new audit code (`booking.lock`, `lock.supplyInput`, and any
     version action code 18 did not already label) in `src/shared/audit/actionLabels.ts`; the label
     scan in `auditNarrative.test.ts` fails on an unlabelled `action: '<code>'` literal.
   - Everything that authorises goes through this one function (Review, 14's
     `authoriseAsSimulatedOffice` in `src/store/officeStandIn.ts`, `src/pwa/officeSimulation.ts`,
     the S3 and S5 jumps in `DemoControlPanel.tsx`, `apps/demo/DemoData.tsx`, 14's `stage-post-op`
     registry entry), so all of them lock. Check each caller handles `authoriseBlocked`.
   - Tests (`lifecycle.test.ts`): the flip and the locks are one commit; the event fires after it;
     the audit rows; a `contractNotInForce` refusal; every caller path locks.
   - Satisfies US-04.3.5, US-07.3.1 ("locks the List's Bookings, Procedures and the Contract versions
     selected for them", "reference data snapshotted at lock").

6. **The engine prices only from the lock** (`store/billingRun.ts`, `domain/billing/invoiceBuild.ts`):
   - `runBillingForList` reads `billing.locks[bookingId]` and builds with `invoiceDraftsFromLock`. It
     no longer calls `billingContextForCard`, `prePaidByProcedure` or anything that reads
     `state.masters`. A Booking with no lock fails as `lockMissing` ("This Booking has no locked
     billing record. Authorise the List again from Review.") and cannot occur after the reseed.
   - Delete the fallback: `defaultContractFor`, the stored-but-ineffective branch of
     `resolveContractForProcedure`, and the `contractIneffective` code with every UI string keyed on
     it. Whatever of `resolveContractForProcedure` 20 left for the preview becomes a plain lookup
     used by the lock builder only. Grep for `contractIneffective` and `defaultContractFor` to zero.
   - **The run re-checks required inputs against the locked version.** For each Booking, 21's
     `missingRequiredInputs` runs against each `ProcedureLock`'s
     `contractVersion.contract.requiredBookingInputs` and the locked input values (Booking-level and
     per-Procedure). A missing one fails that Booking as `requiredInputMissing` with the input
     and the version in the message: "COS ACC (v1) needs a claim reference. None was recorded when
     this List was authorised." This is the engine's backstop: 21 makes inputs a completion rule, and
     a completed Booking can still lose one on a SUBMITTED List through an office edit or a move.
   - **Failure stays per Booking (OQ-05 answered, US-08.5.2).** A failure on any Procedure or party
     of a Booking holds the whole Booking back: none of its invoices is issued, including the second
     invoice of a split payment setting, and the List's other Bookings still bill. The List itself
     never fails. Today's whole-Card exception already behaves this way; keep it under the lock and
     test it.
   - **The payee comes from the lock.** The run stamps `BillingCase.payeeAnaesthetistId` from
     `lock.payee` and builds 22's `Invoice.supplier` from it. `handoffCase` takes the ACCPAY contact
     from the case's payee (no `list.anaesthetistId` lookup); both `anaesthetistIdForCase` helpers
     (receipts in `paymentActions.ts`, web accounts in `selectors.ts`) and 16's `bctiRecords` read the
     stamped payee. Pre-payment cases, raised at setup before any lock, keep today's join until
     Phases 27 and 41 give them their own payee (41 repoints a moved prepaid Booking's payable,
     US-06.5.4); the helper's doc comment says so.
   - Stamp `Invoice.lockedFrom` on every invoice raised.
   - Tests (`billingRun.test.ts`, `billingRetry.test.ts`, `xeroHandoff.test.ts`,
     `paymentActions.test.ts`):
     - After authorise, delete or retire the Contract, change the unit value, every rate and the
       payment setting; the run and a retry produce the fixture's invoices exactly.
     - Rework the ~l.454 case: a unit-value change **after** authorise no longer affects the run; a
       change **before** authorise does (the lock is at AUTHORISED, not at completion).
     - The old "$23 vs $28.50 fallback" test becomes a `contractNotInForce` authorise blocker test.
     - `requiredInputMissing` fails exactly one Booking, bills its sibling, and records the reason on
       the case. On a split Booking it raises neither party's invoice.
     - Payee: the case, the invoice's supplier, the ACCPAY contact, the receipt's `anaesthetistId`
       and the BCTI record all name the locked payee. In a test-only state where the List's
       `anaesthetistId` is altered after authorise, every one still names the locked payee.
     - 16's `bctisFor` gives the same counts as before this phase for the seeded and S3 months.
   - Satisfies US-08.1.1's acceptance criterion ("the engine does not resolve a billing route or
     determine a payer"), RV-01, and DM-08's payee stamp (DM-06).

7. **Resolve and retry without touching the master** (`store/billingRun.ts`, new
   `store/lockActions.ts`):
   - `supplyLockedInput(api, actor, caseId, input, value, procedureId?)`: office only; only for a
     `failed` case whose code is `requiredInputMissing`; only for an input that the locked version
     requires and the lock holds blank; refuses an empty value. `procedureId` is required for a
     per-Procedure input (`claimReference`) and refused for a Booking-level one. It fills that one
     value on the lock (and the Procedure's or Booking's own field, so the Booking detail agrees),
     audited `lock.supplyInput` with before blank and after the value. The List is AUTHORISED, so
     `editRefusal` would refuse the field write: `supplyLockedInput` applies its own guards above
     instead and is the only post-authorise write to a Booking or a lock. It never changes a
     Contract, a version, a rate or any pricing field of the lock.
   - `retryBillingCase` rebuilds from the lock only. It stays idempotent: it refuses a case that is
     not `failed`, a rebuild that still fails leaves the case untouched, and the first invoice reuses
     the failed case's id.
   - Tests: supply then retry raises exactly one invoice and one Xero pair; a second retry is
     refused and raises nothing; supply is refused on a non-failed case, a non-required input, a
     filled input, and for a non-office actor; the supplied value appears on the regenerated invoice.

8. **Regenerate** (store selector, pure):
   - `regenerateInvoiceFromLock(state, invoiceId)` finds the invoice's Booking lock, runs
     `invoiceDraftsFromLock`, picks the draft for the same party, and returns `compareInvoice`'s
     result plus a summary (Contract name and version, payee, payment setting, unit value or rate,
     locked at, lines). It never writes state.
   - It returns a reason instead of a result for invoices with no Procedure lock: pre-payment
     invoices (raised at setup, before the lock; Phase 27 owns them) and, if Phase 16 has run, its
     AA-FEE invoices.
   - Tests: every invoice raised by the S3 and S5 jumps and by the failure-and-retry path regenerates
     identical, before and after a Contract edit, a payment-setting edit and a unit-value edit; both
     invoices of the Prentice split and an invoice carrying 24's two delta lines regenerate
     identical; a hand-corrupted stored line or supplier reports exactly that difference.
   - Satisfies US-08.4.4.

9. **Seed, persist, re-green** (end of the engine half):
   - Every seeded Contract gets `version: 1` and a v1 `ContractVersion` at its `effectiveFromISO`,
     by "AA office". Where 18 seeded an upcoming price or rate step (the bariatric `BAR-BYP` $2,950
     from 28 Jul), record it as v2 on that Contract, dated 2026-07-10 by Kirsty W., with v1 the lines
     before it, and seed the matching `contractRate.add` (or 18's name) audit entry so the Version
     history summary has something to read. v1 rows with no audit entry summarise as "Created". No
     figure moves, because the step is not in force for any seeded List before 28 Jul.
   - Every AUTHORISED List in the seed gets its locks at seed time. Today that is the `L-HIST-*`
     backdrop Lists in `history.ts`, whose invoices are stored totals, not priced Procedures. Give
     them `origin: 'migrated'` locks that freeze the stored lines (`HIL*`, one per `HINV*` invoice)
     as fixed lines against the Procedure's Contract v1, so regenerate reproduces them honestly and
     labels them "Migrated history: locked from the invoice as loaded". Their payee is the List's
     anaesthetist and their payment setting is full (one stored invoice per party), so the stamped
     payee on each history case matches what the live join gave before. At `501b0b8` the `HP*`
     Procedures carry no `governingContractId`; use whatever Contract Phase 20 gave them, and if 20
     left them without one, lock them to the List hospital's default Contract v1 (or, for a List with
     no hospital, the payer's default) and record the choice. Build them with a small pure helper in
     the seed, not with the live pricing path, and stamp `payeeAnaesthetistId` on their cases.
   - The failure scenario: keep Losa Tuilagi's claim reference `ACC45-118844` in the seed (the trigger
     clears it, so the pristine List still authorises cleanly), and confirm COS ACC v1 requires
     `claimReference` (21 seeded it).
   - No new RNG draws; the canvas generator's draw order is unchanged.
   - **Bump `PERSIST_VERSION` by one** from the value recorded at drift-check step 5, with a comment
     line in the history block.
   - Seed tests (`seed.test.ts`): every AUTHORISED List has a lock for every non-cancelled Booking and
     Procedure; every non-prepayment billing case has a payee equal to its List's anaesthetist; every
     Contract's `version` equals its version count; no seeded SUBMITTED List has a lock blocker (S2
     Beat 4, S3 and 21's child review List stay non-blocking); the seed is identical across two
     builds.
   - `demoScenarios.test.ts`: after each S1 to S5 jump, every AUTHORISED List is fully locked and
     every raised invoice regenerates identical.
   - `npm run build`, `npm run build:pwa`, `npx vitest run` green before any UI.

10. **Locked Bookings display from the snapshot** (`shared/capture/feeContext.ts` and callers):
    - `procedureFee` and `cardFee` (Booking names) prefer the lock: when `billing.locks` holds the
      Booking, the fee, units, rate, base-unit source and Contract name come from `priceBookingFromLock`
      and the lock, never from masters. One helper, `feeViewFor(state, booking)`, decides, and every
      fee display calls it: `CardDetailBody` (Booking detail), `BtmCaptureBlock`, `CardTotalPanel`,
      `OfficeBillingSetup`, the web Booking detail and `ReviewScreen`.
    - Test: edit the unit value and the Contract after authorise; the Booking detail and Review show
      the locked figures, and a DRAFT Booking by the same anaesthetist shows the new rate.
    - Satisfies US-15.0.3 (billing is the one exception to "entered once, current everywhere") and
      US-04.3.5's display gap.

11. **The locked badge** (shared, all three apps through `useSurface()`):
    - In 21's Billing block on the Booking detail, a neutral pill with the lock glyph: "Contract v2
      locked at authorise", with the locked time on hover or in the web and admin detail line
      ("Locked 21 Jul 10:42 by Kirsty W."). One pill per distinct Contract version on the Booking.
    - Mobile shows the same pill and no money. Web and admin show it beside the fee.
    - `OfficeBillingSetup` on a locked Booking renders read-only from the lock: Contract name as
      locked, version, rate, base-unit source per Procedure, the payment setting (and the split, office
      only) and the payee. It never offers a Contract picker or a split editor.
    - `data-shot="booking-lock-badge"`.

12. **Review screen after authorise** (`ReviewScreen.tsx`):
    - The CONTRACT column shows the locked name plus the lock glyph and mono `v2` once the List is
      AUTHORISED (the mockup's row lock glyph, placed with the Contract).
    - Tiles and the totals row read the lock. `@ $26.50/unit (list rate)` becomes
      `@ $26.50/unit (locked)` after authorise and stays "(list rate)" before it.
    - Before authorise, `contractNotInForce` shows in the action bar with 21's blocker sentence
      pattern, and the row gets an Open link to fix the Contract. Add `data-shot="authorise-lock-blocked"`.
    - A Booking whose required input is blank shows a warn flag "Claim reference missing: billing will
      hold this Booking back" (`reviewFlagsForBooking`, pure, from `missingRequiredInputs`). It is a
      Review flag like 15a's kept "no billing reference" flag, not a 15a warning and not a blocker:
      the authorise blockers stay 21's schedule miss and this phase's Contract checks.
    - After authorise, the row's detail names the payee and, for a split, "Split: {party} {share}"
      from the lock (office only).

13. **Contract version history** (`ContractEditSheet.tsx`, `MasterData.tsx`):
    - The Contracts table gains a Version column (mono `v3`).
    - The edit sheet gains a "Version history" section, newest first: version, date, who, a one-line
      change summary (from the audit `before` and `after` of the action that made it, through the
      existing `auditFieldChanges` and `summariseAuditChanges` in `src/shared/audit/auditNarrative.ts`;
      "Created" for a v1 with no field changes), "Current" on the latest, and "N invoices".
    - "N invoices" expands to invoice numbers linking to `/admin/invoices/:invoiceId`.
    - "View" opens a read-only panel of that version's terms and schedule lines (US-04.1.3: "an
      earlier version can be viewed").
    - Protected defaults show their history too.
    - `data-shot="contract-versions"`.

14. **Invoice document: the locked record** (`InvoiceDocument.tsx` rail):
    - A "Locked record" rail card: Contract name, AA code and version (linking to that version's
      panel), locked at and by, pricing date, payee ("Paid to Dr Souter, GST {number}"), payment
      setting ("Full" or "Split: {share} to {party}"), unit value or rate, and per Procedure the
      base-unit source in 19's labels ("Procedure list", "Contract override", "RVG guide", "Chosen in
      range", "Set manually", and 23's "Additional procedure"), with "Outside the guide range" where
      `outOfGuideRange` is set. Migrated invoices say "Migrated history: locked from the invoice as
      loaded".
    - The Regenerate result (from the trigger) shows here as a line under the card: "Regenerated from
      locked data: identical (4 lines, total $396.18)" in success tint, or the difference list in
      warning tint. The trigger's `run` stores the result in 14's non-persisted trigger memory
      (`src/shared/demoTriggers/memory.ts`), keyed by invoice id, and the rail reads it from there:
      no domain write, no `PERSIST_VERSION` impact, and a reload clears it.
      `data-shot="invoice-locked-record"`.
    - Pre-payment invoices (and AA-FEE invoices, if Phase 16 has run) show no locked-record card.

15. **Billing monitor: resolve without editing the master** (`BillingMonitorScreen.tsx`):
    - Remove the `editContract(... effectiveToISO: undefined)` branch from `resolveAndRetry`.
    - A `requiredInputMissing` row shows the reason, the line "Held back: none of this Booking's
      invoices was issued. The rest of the List billed." (OQ-05), and an inline field for the missing
      input ("Claim reference") with a teal "Add and retry" button: `supplyLockedInput`, then
      `retryBillingCase`, then `handoffCase`. The field shows 21's input label. This is the manual fix
      US-08.5.2 and US-13.3.2 describe.
    - Handoff failures keep today's plain "Resolve & retry" (re-invoke `handoffCase`).
    - Any other failure code shows its reason and a "Retry" that rebuilds from the lock, with the note
      "Retry rebuilds from the locked record. A wrong Contract after authorise is corrected by credit
      and rebill." (Phase 39).
    - Update the monitor's intro copy: the engine prices from each Booking's locked record.
    - `data-shot="billing-supply-input"`.

16. **Triggers, Control Panel text, shots and copy** (see "Demo triggers"):
    - Re-point 14's `billing-failure` entry; register `regenerate-invoice`. Bodies in `src/store`.
    - `DemoControlPanel.tsx`: rewrite the S4 billing-failure line and the S5 jump description (it no
      longer "raises the Health NZ contract snapshot invoices"; it authorises Whitaker's List, which
      locks Health NZ v1).
    - Vitest `src/shared/demoTriggers/demoTriggers.test.ts`: the re-based failure fails Tuilagi with `requiredInputMissing`,
      raises none of her invoices and bills Hemi Walker; its second press says "Already triggered"; `regenerate-invoice` is
      visible only on `/admin/invoices/:invoiceId`, disabled with its reason on pre-payment and AA-FEE
      invoices, and reports identical for S3 invoices.
    - Playwright: re-point `visual/admin-phase09.spec.ts` to the new failure and the inline "Add and
      retry"; extend `visual/admin-phase08.spec.ts` with the locked-record card and a regenerate run;
      add shots for `contract-versions`, `booking-lock-badge` and `authorise-lock-blocked`.
    - Capture recipes in `requirements-board/capture/recipes/` (done in the Catalogue screenshots step
      below, which owns the recipe list, the `--dry` check and the full capture):
      - Re-point the three that stage the old failure and click "Resolve & retry" (`US-08.5.1.json`
        shot `failure-reason`, `US-08.5.2.json`, `US-13.3.2.json`) to the re-based trigger and the
        inline "Add and retry" (14 will already have moved them off `/demo/control`). The
        `US-08.5.2.json` captions say a failed Booking is held back whole, none of its invoices
        issued, while the List bills (OQ-05's answer), in place of today's "A failed card blocks
        only its own invoice" and "card" wording.
      - Add shots where the gap is now closed: `US-04.1.3.json` (status `absent`) gets a
        `contract-versions` shot; `US-08.4.4.json` (status `partial`) gets the locked-record card and a
        regenerate result; `US-04.3.5.json` `locked-contract` highlights the lock badge. Update their
        `status` and `absentReason`, and the now-stale "editing changes the contract in place" sentence
        in `US-04.1.2.json`'s `absentReason`.
      - Run `npm --prefix requirements-board run capture -- --only US-04.1.2,US-04.1.3,US-04.3.5,US-08.4.4,US-08.5.1,US-08.5.2,US-13.3.2 --dry`
        while building, to find broken recipes early. The full `npm run capture` and `npm run
        verify:board` run in the Catalogue screenshots step.
    - Grep new copy for en and em dashes; teal on every new action; crimson nowhere new.

## Demo triggers

| Label | Screen (routes) | Surface | Effect |
|---|---|---|---|
| **Regenerate from locked data** (new, `regenerate-invoice`) | Admin · Invoice (`/admin/invoices/:invoiceId`) | Harness bar | `regenerateInvoiceFromLock` on the invoice in `ctx.params.invoiceId`. Read-only: the result goes to 14's trigger memory and the rail's result line says "identical" with the line count and total, or lists the differences; the bar message says the same. Works after a Contract edit, a Contract retire, a payment-setting change or a unit-value edit. Disabled with a reason on pre-payment invoices ("Raised at setup, before the lock") and, if Phase 16 has run, AA-FEE invoices ("Not priced from a Procedure") |
| **Trigger billing failure** (re-pointed `billing-failure`) | Admin · Billing monitor (`/admin/billing`) | Harness bar | `stageBillingFailure(api)` in `src/store/demoStaging.ts` (new here unless an earlier phase created it; 21 builds none), replacing the body 14 moved into `registry.ts` verbatim: on `SEED_LIST_IDS.billingFailure` (Ropata Thu 16), submit if DRAFT; as `OFFICE_ACTOR` (14's `src/store/demoActors.ts`), clear Losa Tuilagi's claim reference through the ordinary office Procedure edit (`editProcedure(api, OFFICE_ACTOR, procedureId, { billingReference: undefined })` or 21's renamed field; `editRefusal` allows it on a SUBMITTED List, and at `501b0b8` the edit does not un-complete the Booking: confirm 21 kept that); then `authoriseList`. The run holds her Booking back whole as `requiredInputMissing` (COS ACC v1 needs a claim reference), with none of its invoices issued, and bills Hemi Walker (OQ-05). Disabled "Already triggered" once the List is billed. The old body (end-dating COS ACC) is deleted |

**Existing actions that now demonstrate the lock (no new button):**
- **Master data unit-value edit** (Admin, Master data, Anaesthetists, Dr Souter): after an S3 or S5
  List is authorised, change the unit value. The locked Booking and Review keep $26.50 "(locked)",
  Regenerate says identical, and a DRAFT Booking shows the new rate.
- **S5 Beat 4 Contract edit** (Admin, Master data, Contracts, Health NZ): end-date it to 16 Jul. The
  sheet's Version history shows v2 with no invoices and v1 with Whitaker's invoices; the Hemi Walker
  invoice regenerates identical although Health NZ is no longer in force on 17 Jul. A still-unlocked
  CPH List after that date now shows the `contractNotInForce` blocker on Review, which is the
  catalogue's "no fallback" made visible.

**Fallback for the failure cause.** If drift-check step 4 finds that 21 made a missing required input
an authorise blocker, the cause above cannot reach the run. Then re-base `billing-failure` on the
handoff path instead: arm 14's handoff fault and authorise the Ropata List, so Tuilagi's pair fails and
the sibling's succeeds; retire the separate `arm-handoff-fault` entry into it, and say so in the
Decisions log. Under OQ-05 a Booking whose pairs are partly posted to Xero when another fails is part
of the manual fix (US-08.5.2), so stage the fault on a one-invoice Booking.

**PWA.** No new PWA entry. Regenerate and the Billing monitor are admin-only surfaces, and the handset
beat that waits on the office ("Office authorises this List", Phase 14) now writes locks through
`authoriseList` with nothing else to stand in for. Check in a test (14's office stand-in test
and `src/pwa/officeSimulation.test.ts`) that
`authoriseAsSimulatedOffice` and "Play the office" lock the List with the handset's anaesthetist as
payee, and that a `contractNotInForce` blocker makes them refuse quietly with nothing half-done.

## Out of scope

- Correcting a locked Booking's Contract, price or party: credit in full and rebill (Phase 39). Retry
  here never changes pricing.
- Additional invoices on a Procedure after invoicing, including splitting a combined Procedure
  (US-08.6.4, unparked into 39 now OQ-53 is answered), and pre-op and post-op event invoices (39b).
- Locks for pre-payment invoices and the prepayment estimate: the estimate is stored on the Booking in
  27; the lock only snapshots pre-payment already invoiced.
- Moving a Booking to the anaesthetist who did it (US-01.4.6, Phase 32) and repointing a moved
  prepaid Booking's payable (US-06.5.4, Phase 41). This phase only fixes the payee at authorise.
- The split basis itself (OQ-68): the lock copies whatever 22 built.
- Explicit save, change sets and as-at history of Bookings (35), which will reuse these versions.
- The internal ledger (36): it reads locked invoices and the stamped payee; nothing here changes
  BillingCase's money fields.
- The manual-fix process for failures beyond a missing input (US-08.5.2 says it is to be supported
  later) and BCTI period approval (39a).
- Temporal-table style point-in-time queries over every entity (US-08.4.4's technical discussion): the
  prototype versions Contracts and locks billing only.
- An anaesthetist-facing unit-value setting (26), hospital rename or edit (42) and surgeon CRUD (17):
  US-15.0.3's "change once, shows everywhere" gaps for those entities belong there. US-12.1.1 is
  covered here only for the snapshot of the unit value.
- Payer derivation from the billing route (RV-08, removed with route in 20 and 21): this phase only
  confirms the engine reads the party from the lock.
- Any change to per-Booking failure isolation (OQ-05 answered it as built) or to which date decides
  the price (OQ-48, built as its recommendation by Phase 18).

## Manual test checklist

The agent runs every item itself in the running app and reports it with evidence; none is handed
to the owner (ROADMAP.md "Owner review: agents test themselves").

- [ ] **S3 figures.** Jump S3, authorise Souter Mon 20 AM and PM. Invoices and totals are exactly as
      before this phase (Holt $396.18; the Prentice split). Each Booking shows "Contract vN locked at
      authorise"; Review shows the lock glyph and version in the CONTRACT column and "(locked)" on the
      rate.
- [ ] **Regenerate.** Open one of those invoices; Demo actions, **Regenerate from locked data**: the
      rail says identical, with the line count and total. The Locked record card names the Contract,
      AA code, version, payee (Dr Souter with her GST number), payment setting, rate and base-unit
      sources. Both Prentice invoices regenerate identical and their cards read "Split".
- [ ] **Payee.** In the Xero simulation, the ACCPAY behind the Holt invoice is to Dr Souter, and
      receiving a payment on it credits her web Accounts. Nothing about who is paid changes when
      masters are edited.
- [ ] **Payment setting after authorise.** Switch the Prentice Contract from split to full (or change
      its share): the authorised Booking keeps its two invoices and Regenerate says identical; the
      Version history shows the new version.
- [ ] **Unit value after authorise.** Master data, Dr Souter, change the unit value from $26.50 to
      $28.00. The authorised Bookings and Review still show $26.50 (locked) and the same totals;
      Regenerate still says identical; a DRAFT Souter Booking shows the new rate. Set it back.
- [ ] **Contract edit after authorise (S5 Beat 4).** Jump S5. End-date Health NZ to 16 Jul. The
      Version history shows v2 (current, 0 invoices) and v1 with Whitaker's invoices, each linking to
      its invoice; "View" on v1 shows the old terms. The Hemi Walker invoice regenerates identical.
- [ ] **No fallback.** With Health NZ end-dated, open Review for a submitted CPH List after 16 Jul (or
      move a Booking onto one): authorise is blocked with "Health NZ … is not in force on …", and
      there is no silent default.
- [ ] **Billing failure (S4 Beat 3).** Billing monitor, Demo actions, **Trigger billing failure**.
      Losa Tuilagi fails with "COS ACC (v1) needs a claim reference…" and "Held back: none of this
      Booking's invoices was issued"; she has no invoice; Hemi Walker is billed and the List is not
      failed. Enter
      `ACC45-118844` and **Add and retry**: one invoice and one Xero pair appear, the row clears, and
      History shows `lock.supplyInput`. Pressing the trigger again says "Already triggered". No
      Contract changed (check the COS ACC Version history).
- [ ] **Idempotent retry.** After the retry, the case offers no second retry, and the invoice count
      on the List is unchanged by any further click.
- [ ] **Version on every change.** Add an upcoming rate step, edit a schedule line, tick a required
      input, toggle allows-adjustment and change the payment setting on one Contract: five new
      versions, each with a summary. A refused edit adds none.
- [ ] **Warnings do not block the lock.** A Booking with an out-of-range base-unit value (19's office
      warning open) authorises and bills at the value entered; its Locked record card says "Outside
      the guide range".
- [ ] **Seeded history.** Open a historical backdrop invoice by URL: the Locked record card reads
      "Migrated history", and Regenerate says identical.
- [ ] **Pre-payment and AA-FEE invoices.** Regenerate is disabled with its reason on a pre-payment
      invoice, and on an AA-FEE invoice if Phase 16 has run.
- [ ] **PWA.** On the installed PWA, submit a List and use "Office authorises this List": it authorises
      and bills; the Booking (while visible) shows the locked badge with no money.
- [ ] No en or em dashes in any new UI copy; teal on every new action; crimson nowhere new.
- [ ] Catalogue screenshots: the recipes for US-04.1.3, US-04.3.5, US-07.3.1, US-08.1.1, US-08.4.4 and US-15.0.3 (plus US-04.1.2, US-08.5.1, US-08.5.2 and US-13.3.2, which this phase re-points) are created or updated, any recipe this phase broke is re-pointed, a full `npm run capture` ends with no failed recipe and no story without a recipe, the covered items' new shots are checked by eye, and `npm run verify:board` is green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots` and `npm run verify:board` all green.

## Demo guide updates

In the same session, patch `docs/demo-guide/03-demo-script.md`, `04-presenter-cheat-sheet.md`,
`02-workflows-and-handoffs.md`, the matching sections of `master-demo-guide.html`, and the Control
Panel scenario text:
- **S3 Beat 1/2 "Expected":** add that each authorised Booking now carries "Contract vN locked at
  authorise", and the billing run prices from that record, including who is paid (Dr Souter) and the
  Prentice split. Figures are unchanged.
- **S4 Beat 3 (billing failure and retry), rewritten:**
  - Click: Admin Billing monitor, Demo actions, **Trigger billing failure**; on Losa Tuilagi, enter
    the claim reference and **Add and retry**.
  - Say: "The engine prices only from what was locked at authorise, so a Contract edit can no longer
    break a run. What can still fail is data the locked Contract requires and the Booking lacks. A
    List never fails as a whole: the failed Booking is held back with none of its invoices issued,
    and the rest of the List bills. The office supplies the reference and retries once, without
    touching the Contract."
  - Expected: Tuilagi fails with the reason and has no invoice; Walker bills; retry raises exactly
    one invoice.
- **S5 staging text:** the jump authorises Whitaker's Fri 17 List, which locks Health NZ v1.
- **S5 Beat 4, renamed "Contract versions and the lock":** end-date Health NZ, show v2 in the Version
  history with v1's invoices, then **Regenerate from locked data** on the Hemi Walker invoice.
  Say: every change is a new version; an invoice is tied to the version locked at authorise and can
  be regenerated exactly, with the same payee and the same split.
- **S5, new optional beat "Unit value after authorise":** change Dr Souter's unit value; the
  authorised Booking keeps its locked rate, Regenerate says identical, a DRAFT Booking takes the new
  rate. Reset the value afterwards.
- **S4 discovery points:** replace the "billing-failure isolation" open point with the answered rule
  (OQ-05: per Booking, a List never fails, the whole Booking is held back for a manual fix) and keep
  "which fields are frozen at authorise" (US-15.0.3, still to be decided in discovery).
- **Cheat sheet:** rewrite "Billing failure isolation" to the answered rule and add a "Lock at
  authorise" entry: what is locked (Contract version, rate inputs, payment setting and split,
  adjustment, party and payee), no fallback, the authorise blocker, regenerate.
- **Workflows doc:** the authorise step writes the lock and fixes the payee; the billing run reads
  only the lock; a failed Booking is held back whole while the List bills; failure resolution
  supplies missing inputs, never edits the master.
- **Control Panel:** the S4 and S5 scenario text as above.
- **Milestone consistency read** (Phase 25 is a milestone): read `master-demo-guide.html` end to end
  against the run sheet and the cheat sheet, and fix any beat still describing contract fallback,
  "Resolve & retry restores the contract", effective-dating as the reason invoices stay fixed, or
  failure isolation as an open question.

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19),
run after the review pass and before the PROGRESS.md entry. Re-run
`node docs/prototype-build/catch-up/tools/recipe-status.mjs 25` first: earlier phases may have
changed these recipes since this plan was written. This step absorbs work item 16's "Capture recipes"
bullets; do them here, not twice.

**Covered items.** When the phase is done, each recipe in `requirements-board/capture/recipes/`
matches what was built:

| Item | Recipe at plan time | When this phase is done |
|---|---|---|
| [US-04.1.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.1.3.md) Contract audit and versioning | absent | Captured. Create a recipe: `admin-contract-versions` on `/admin/masters`, the Contract sheet's "Version history" (`contract-versions`, newest first with "Current" and "N invoices"), with states for an edit that adds v2 (end-date Health NZ to 16 Jul) and `view` opening an earlier version read-only. Caption in the catalogue's words: edits are audited and an earlier version can be viewed. |
| [US-04.3.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.3.5.md) Contract locked at AUTHORISED | captured · admin-contract-before, admin-locked-contract | Stays captured. Both start on C0012 (`/admin/day/2026-07-20/cards/C0012`) and highlight `office-billing-setup-1`. Re-shoot: `before` on a DRAFT Booking (no badge, re-prices live), `locked-contract` after authorise with the `booking-lock-badge` "Contract vN locked at authorise" highlighted. Re-check the start id after 21 and 22 seed more Bookings. |
| [US-07.3.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-07.3.1.md) Authorise the List | captured · admin-authorise (confirm, authorised) | Stays captured. Re-shoot both states on `/admin/review/L-25490-2026-07-20-AM`: `confirm` notes the lock, and `authorised` shows the banner plus the lock glyph and version in the Contract column. Add an `authorise-lock-blocked` state: with Health NZ end-dated, a CPH List's Review shows the `contractNotInForce` blocker instead of the button. Keep the shot `name`s. |
| [US-08.1.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.1.1.md) Process an AUTHORISED List using each Procedure's locked Contract | captured · admin-authorise-list (confirm, authorised), admin-billing-run | Stays captured. Re-shoot `admin-authorise-list` on `/admin/review/L-34821-2026-07-20-AM` and `admin-billing-run` on `/admin/billing` (the pipeline row now prices from the locked record). Add `admin-billing-supply-input`: the Tuilagi row with "Held back: none of this Booking's invoices was issued", the inline claim reference field and "Add and retry" (`billing-supply-input`), staged by the re-pointed `billing-failure` trigger. |
| [US-08.4.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.4.4.md) Invoice reproducibility | partial · admin-snapshot-invoice | Captured. Re-shoot `admin-snapshot-invoice` on `/admin/invoices` and add `admin-locked-record` (`invoice-locked-record`: Contract, version, payee, payment setting, rate) with a `regenerated` state after the "Regenerate from locked data" trigger ("Regenerated from locked data: identical"). Drop the partial reason (Phase 22 left it naming this phase). |
| [US-15.0.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-15.0.3.md) Enter once | captured · web-entered-by-anaesthetist, admin-seen-by-office | Stays captured. Verify both still resolve on C0009 (web and admin, `time-capture-track`). Add `admin-billing-exception`: the office supplies the missing input on the held-back Booking in the Billing monitor and the Booking bills, with no re-keying of anything else. |

**Recipes this phase breaks.** Work item 16 already names the four to re-point; they are done in this step:
- `US-08.5.1` (shot `failure-reason`), `US-08.5.2` (`card-failure`, states `failed` and `retried`) and `US-13.3.2` (`resolve-retry`, highlight `tr:has(button:has-text("Resolve & retry"))`) stage the old end-dated COS ACC failure and click "Resolve & retry". Re-point them to the re-based trigger and the inline "Add and retry". `US-08.5.2`'s captions change to a failed Booking being held back whole while the List bills (OQ-05), with "Booking" for "card".
- `US-04.1.2` (shots `contracts` and `edit-contract`): its `absentReason` still says editing changes the Contract in place; rewrite it, and re-check the `edit-contract` highlights on the date inputs and "Delete contract" in the sheet that gains Version history. Re-run `--dry` for it.
- `US-02.4.2`, `US-04.1.2` and `US-08.4.4` mention Whitaker, Tuilagi or Health NZ: re-check any seed id or row text that Phase 25's seed changes (Whitaker's List now authorises into Health NZ v1).
- Recipes on authorised Bookings that read the rate or total (`card-calculation` users) may show "(locked)" and the badge; the `--dry` run is the check.

**ATLAS.md.** Update Seed data (migrated locks on seeded AUTHORISED Lists, v1 Contract versions), Existing hooks (`contract-versions`, `booking-lock-badge`, `invoice-locked-record`, `billing-supply-input`, `authorise-lock-blocked`) and the Demo control panel section (the re-pointed "Trigger billing failure" and the new "Regenerate from locked data").

## Adversarial review (after build)

After the manual test checklist and `npm run build`, `npm run build:pwa`, `npx vitest run` and
`npm run shots` are green, and before writing the PROGRESS entry, run the standard
**adversarial review-and-fix pass (PROGRESS convention 18)**. Fan out independent Opus review
subagents for **quality**, **bugs/correctness** and **plan adherence**, plus a **money-integrity**
lens, because this phase changes where every invoice's numbers come from. This session then
independently verifies every finding against the catalogue and the code, fixes the confirmed ones
(adding a test wherever a bug had none), re-greens, and records the pass in the phase entry. Do not
re-raise anything settled in the Decisions log.

**Steer this phase's reviewers at:**
- **The engine reads no live master.** `runBillingForList`, `retryBillingCase` and
  `regenerateInvoiceFromLock` take nothing from `state.masters` or live billing lines. The
  `priceBookingFromLock` signature has no masters argument. Try to find a path that still does (a
  helper that looks up a Contract name, a party email, the GST rate, the supplier's GST number, the
  pre-payment netting).
- **Lock completeness.** Every input 18 to 24 added to the price or the invoice is in the lock: rate
  step, schedule line price and add-ons, base-unit source, out-of-range flag and Contract override,
  modifier unit values, primary flag, multi-procedure rule and 3/2/2 split, payment setting with its
  share and per-party amounts, anaesthetist adjustment with its permission and before and after
  amounts, office override, party, invoice email, required inputs, presentation, payee and supplier
  details, pre-payment deduction. The immunity test changes each one.
- **The payee is fixed at authorise.** No locked case, invoice supplier, ACCPAY contact, receipt or
  BCTI record finds its anaesthetist by joining Booking to List. Only pre-payment cases keep the join,
  and the code says why (27, 41).
- **Failure per Booking (OQ-05).** A failed Booking issues none of its invoices, both halves of a
  split included; its siblings bill; the List is never marked failed.
- **Parity.** Item 1's fixture passes unchanged. S3, S4 and S5 figures are identical to Phase 24's,
  and 16's BCTI counts are unchanged.
- **Atomicity and idempotency.** The List flip and its locks are one `mutate()`; a refused authorise
  writes nothing; the event fires after the commit. Retry never duplicates an invoice, a case or a
  Xero pair, and a second retry is refused. `supplyLockedInput` fills only a blank, required input on
  a failed case and touches no pricing field.
- **No fallback remains.** `contractIneffective` and `defaultContractFor` are gone; a Contract not in
  force is an authorise blocker with readable copy, never a silent default. No warning (15a) became a
  blocker. No seeded SUBMITTED List has a blocker; S2 Beat 4, S3 and 21's child review List stay
  non-blocking.
- **Versions.** Every Contract-writing action appends exactly one version in the same commit; earlier
  versions are immutable; `version` matches the count; the invoice counts per version are right after
  the S3 and S5 jumps.
- **Display drift.** No fee display of a locked Booking changes after a master edit, in any app. The
  DRAFT preview still re-prices.
- **Seeds and determinism.** Every AUTHORISED List is fully locked at seed time; migrated locks are
  labelled; no new RNG draws; no `Date.now()`; `PERSIST_VERSION` bumped; trigger bodies live in
  `src/store` and the PWA purity test holds.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry; ROADMAP.md "Owner review: agents test
  themselves"): the defaults built for open questions, provisional readings, anything logged
  rather than fixed, and the screens worth a look, each with its route and persona.
- Status row for catch-up Phase 25, and a phase entry: the drift-check result against `501b0b8`
  (including what 16 and 18 to 24 were found to provide, every live payee join replaced, and any
  change to the fields to freeze), the lock's field list, the tests added, `PERSIST_VERSION` old to
  new, and the adversarial pass.
- **Decisions log** (each names the July ruling it supersedes where there is one):
  - **Contract fallback at billing time is removed** (supersedes the 2026-07-23 Phase 08 build
    decision (1), "Contract resolution at billing time", and its "$23 vs $28.50 fallback" test). A
    Contract not in force on the List date is an authorise blocker; the engine reads the lock.
  - **The billing-failure demo is re-based** (supersedes the Phase 09 failure demo that end-dated COS
    ACC and restored it in "Resolve & retry"). The cause is a required input missing from the locked
    record; resolution supplies it and retries; the master is never edited from the monitor. Note the
    handoff fallback if it was used.
  - **What is locked** (US-04.3.5; discovery has not named the fields, US-15.0.3): the whole
    Contract version plus every rate input, the payment setting and split, the adjustment and
    override, party, required input, presentation field and the payee, per Procedure within a
    Booking lock.
  - **The payee is fixed at authorise** (DM-06, DM-08): the List's anaesthetist at authorise is
    stamped on the lock and the billing case; the ACCPAY, receipts, web accounts and BCTI records read
    it, not a live Booking-to-List join (pre-payment cases excepted until 27 and 41).
  - **A version is every committed Contract change**, including rate steps, schedule lines and the
    payment setting, and is held in state as append-only records (the prototype's stand-in for
    temporal tables).
  - **A second authorise blocker kind** (`contractNotInForce`, with `noContract` and
    `contractMissing`), alongside 21's schedule miss; Phase 40 adds a missing NHI. The child billable
    party is a mild warning (D4) and every 15a warning stays a warning; other Review flags stay
    advisory.
  - **Failure per Booking is confirmed** (OQ-05 answered; the Phase 09 per-Card reading stands): a
    List never fails as a whole, and a Booking with any failed Procedure or party issues none of its
    invoices.
  - **Required inputs are re-checked by the engine** against the locked version, as a backstop to
    21's completion rule; `supplyLockedInput` is the only post-authorise write to a lock, as the
    office's manual fix (US-13.3.2).
  - **Seeded history carries migrated locks** that freeze the stored lines.
  - **The pricing date** is the procedure date (the List date), OQ-48's recommendation and Greg's
    lean on 2026-10-01, and is stored on the lock.
  - Update the `editAnaesthetist` note: a unit-value change re-prices unlocked Bookings only.
- **Handoff notes:**
  - 27: the prepayment estimate and invoice at setup are not locks; the lock snapshots pre-payment
    already invoiced, so the balance invoice nets against a fixed figure. Pre-payment cases still
    find their payee by the live join; 27 stamps one when it builds the prepayment record.
  - 32: moving a Booking to the anaesthetist who did it must land before authorise; after authorise
    the payee is locked and only credit and rebill (39) changes it.
  - 35: explicit save and as-at history can show "Contract vN" on a Booking and reuse
    `contractVersionsFor`.
  - 36: the ledger's receivable legs come from locked invoices and the payable leg's payee from
    `lock.payee`; `Invoice.lockedFrom` gives the version lineage.
  - 39: credit-and-rebill is the only way to change a locked Booking's price, split or payee; the
    rebill needs a new lock (decide there whether it re-locks at the current Contract version or the
    original one).
  - 41: repointing a moved prepaid Booking's payable (US-06.5.4) changes the prepayment's payee,
    never a lock.
  - 42: loaded masters must go through the version helper, so a load appends versions.
  - 44: S4 Beat 3 and S5 Beat 4 as rewritten here.
- **Catalogue screenshots.** The step's result: recipes created (US-04.1.3) and changed (US-04.3.5,
  US-07.3.1, US-08.1.1, US-08.4.4, US-15.0.3, plus US-04.1.2, US-08.5.1, US-08.5.2, US-13.3.2 and any
  other recipe the step broke), the `capture/REPORT.md` counts (captured, partial, absent, failed)
  before and after, and any partial reason handed to a later phase.
