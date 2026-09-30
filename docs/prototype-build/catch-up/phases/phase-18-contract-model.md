# Phase 18 · Contract model

**Requirements covered:**
[US-04.1.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.1.1.md) (Contract categories),
[US-04.1.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.1.2.md) (create, edit, retire Contracts),
[US-04.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.1.md) (holder, scope and organisational reach; Verify),
[US-04.2.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.4.md) (fixed fee schedule lines),
[US-04.2.10](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.10.md) (pricing effective from a date),
[US-05.2.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.2.5.md) (fixed fee schedule pricing);
[DM-06](../analysis/domain-model-delta.md#dm-06) (Contract reshaped to category, holder, scope and pricing basis),
[DM-08](../analysis/domain-model-delta.md#dm-08) (ContractPrice becomes FeeScheduleLine);
[RV-20](../analysis/reverse-check.md#rv-20-acc-treated-as-a-visible-special-case) (ACC treated as a visible special case).
Open questions: [OQ-18](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-18.md),
[OQ-48](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-48.md).
**Depends on:** Phase 17 (the Surgeon Group record that the Surgeon Group holder points at). Phases 14
and 15 are in place: Card is now Booking, and triggers live in the screen-contextual registry.
**Estimated:** 2 sessions, at the upper limit. Session 1: work items 1 to 8 (model, seed, pricing,
store, parity green). Session 2: work items 9 to 13 (Admin Contract catalogue, office billing setup,
ACC removal, copy, demo guide), then shots, the review pass and PROGRESS. If session 1 runs long,
stop green after work item 6 (parity fixture matching) and start session 2 with work item 7; do not
start UI work before the store actions exist.

## Goal

The Contract stops being "Type 1/2/3 plus a holder" and becomes the catalogue's four-part record:

- a **category**: the six catalogue categories, with no Pre-paid category;
- a **holder**;
- **scope filters**;
- a **pricing basis**.

Each Contract gets a review date and an explicit retire. `ContractPrice` becomes a
**FeeScheduleLine**. A line has a holder code and description, GST-exclusive and GST-inclusive
prices, an optional RVG mapping, time band, add-on flag and quantity rule, and effective-dated prices
with a visible "Upcoming from <date>". Contract rates and discounts are effective-dated the same way.

`fee.ts` prices from the new shape. Every seeded fee and every existing worked example is
re-expressed as a parity test, so **the S3, S4 and S5 figures do not move**. Selection keeps
today's resolver (`resolveContractForProcedure` and the default fallback in `invoiceBuild.ts`), so
the app stays green: scope is modelled and edited here, and only narrows the picker in Phase 20.
ACC loses its special-case markers and is priced as an ordinary holder's Contract. The Admin Contract
catalogue (Master data, Contracts) is rebuilt around the new record.

This is the largest pricing ripple in the plan. Behaviour changes are for Phases 20 to 25. This phase
changes the shape and keeps the numbers.

## Before you start: drift check

1. Run the drift diff and read it for this phase's items:

   ```
   git diff 1f067a8 -- "docs/discovery-reference/Updated Requirements/catalogue" "docs/discovery-reference/Updated Requirements/domain-model.md"
   ```

   Check `US-04.1.1`, `US-04.1.2`, `US-04.2.1`, `US-04.2.4`, `US-04.2.10`, `US-05.2.5`, `OQ-18`,
   `OQ-48`, and the "Contract (recommended structure)" and "Fee schedule line" tables in
   `domain-model.md`. Also skim `US-04.2.2` (pricing basis), `US-04.4.1` (default Contract) and
   `US-05.5.1` (ACC), because this phase's shape has to fit them.
   - If an item changed, re-read it and adjust the work items below before building. For example,
     a Pre-paid category coming back, a seventh category, or a new line field.
   - If an item is now Retired or Future, drop it from this phase and say so in the PROGRESS entry.
   - A new item that touches the Contract record goes into this phase only if it is shape-only.
     Behaviour belongs in 20 to 25.
2. **US-04.2.1 is Verify.** Its one acceptance criterion (organisational by default, narrowed to
   specific anaesthetists) is already met by today's scope. If it is still Verify, build the filters
   as written and note the status in PROGRESS. No UI label is needed.
3. **OQ-48 (which date decides the price in force).** If it is still open, use the recommended
   reading: the **List date**, which is the date of the procedure. That is what the prototype
   already tests Contracts against. Add one provisional line to the Contract pricing section:
   "Provisional: the price in force is the one effective on the List date." If it is answered with
   a different date (Booking created, or invoice raised), thread that date through `pricingDateISO`
   in work item 4 instead, and update the tests.
4. **OQ-18 (holder codes vs RVG codes).** If it is still open, use the interim reading:
   - the anaesthetist still picks an RVG code, and the engine matches the schedule line through its
     RVG mapping (today's behaviour);
   - the office can pick a holder line directly in billing setup (work item 11);
   - add one provisional line under the schedule: "Provisional: lines are matched on the
     procedure's RVG code; the office can choose a holder line directly."

   If OQ-18 is answered "the anaesthetist selects the holder code", do not build that picker here.
   It belongs with the Contract picker in Phase 20; note the handoff.
5. **Read Phase 17's PROGRESS entry.** Note the surgeon-group entity it built (Phase 17's plan: type
   `SurgeonGroup`, master `masters.surgeonGroups`, seed id `SG-COS` "Canterbury Orthopaedic
   Surgeons", counter prefix `SGN`), whether it has any link to the `ORG.cos` organisation record,
   and confirm `ContractHolderOrganisation` / `masters.organisations` still exist (Phase 17 left them
   for this phase to decide). Work items 2 and 3 depend on this.
6. **Capture the parity baseline before any model change** (work item 1). This comes before any
   edit to `types.ts`.

## Reference

**Design (convention 17):**
- `docs/design/Design Language.dc.html` for tokens: status pills as tint and on-tint, mono
  tabular-nums for codes and money, 4pt spacing, radii, teal as the only action colour, and crimson
  for identity only.
- `docs/design/Admin Review.dc.html` for the admin table and detail-panel anatomy. Its CONTRACT
  field is the model for how a Contract is named on a Booking.
- `docs/design/Admin Day.dc.html` for admin chrome.

No mockup covers Master data. Extend the admin's own table, panel and pill patterns, and do not
invent a new visual language. Admin is a desktop layout, so use a wide side panel or overlay, not a
bottom sheet.

**Catalogue:** the six covered files above; `domain-model.md` §2 "Contract (recommended structure)";
[US-04.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.2.md)
(the four pricing bases);
[US-05.2.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.2.6.md)
(rate x time);
[US-05.5.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.5.1.md)
(ACC through the holder's Contract).

**Analysis:**
- [GAP-ANALYSIS.md](../GAP-ANALYSIS.md): Theme 1, and the EP-04 and EP-05 tables.
- [epics/EP-04.md](../epics/EP-04.md) and [epics/EP-05.md](../epics/EP-05.md).
- `gaps.json`: the entries for the covered IDs, DM-06, DM-08 and RV-20.
- [analysis/prototype-map-domain.md](../analysis/prototype-map-domain.md) §2 and §5.
- [analysis/prototype-map-store-seed.md](../analysis/prototype-map-store-seed.md).
- [analysis/prototype-map-admin.md](../analysis/prototype-map-admin.md).

**Code entry points** (names as at `1f067a8`; Phase 15 renamed Card to Booking, so use the Booking
names you find):
- `aa-prototype/src/domain/types.ts`: `ContractHolderType`, `ContractScope`, `ContractType2Detail`,
  `Contract`, `ContractPrice`, `Procedure.accRelated`, `CounterpartyRef`.
- `aa-prototype/src/domain/billing/contracts.ts`: `isEffectiveOn`, `selectContract`,
  `matchContractPrice`.
- `aa-prototype/src/domain/billing/fee.ts`: `FeeContext`, `feeFor`, the Type 1/2/3 branches.
- `aa-prototype/src/domain/billing/invoiceBuild.ts`: `defaultContractFor`,
  `resolveContractForProcedure`, `counterpartyForProcedure`, `HOLDER_LABEL`, `GST_RATE`.
- `aa-prototype/src/domain/billing/validateCardForBilling.ts`: `feeContextFor`,
  `CardBillingContext.contractPrices` (about line 62), `INDIVIDUAL_ARRANGEMENT_MESSAGE`, the rate x
  time gate.
- `aa-prototype/src/domain/billing/fixtures.ts`: `mkContract`, `mkProcedure`.
- `aa-prototype/src/domain/seed/contracts.ts`: `CONTRACT`, `CONTRACTS`, `CONTRACT_PRICES`.
- `aa-prototype/src/domain/seed/index.ts`: `masters.contracts` / `contractPrices`, the counters, and
  the scenario markers `cosAccContractCard` and `accRelatedCard`.
- `aa-prototype/src/domain/seed/cards.ts`: the seeded `governingContractId`s and `accRelated`
  flags.
- `aa-prototype/src/domain/seed/history.ts`: `accRelated` on seeded history rows.
- `aa-prototype/src/domain/seed/billing.ts`: its fee context.
- `aa-prototype/src/store/contractActions.ts`: `createContract`, `editContract`,
  `deleteContract`, `addContractPrice`, `editContractPrice`, `isProtectedDefault`.
- `aa-prototype/src/store/mastersActions.ts`: `createHospital` and `setInsurerDirectClaims` mint
  the protected default.
- `aa-prototype/src/store/mutate.ts`: the id spec `contractPrice: { prefix: 'CPN', pad: 3 }` (the
  allocation counter kind; it is not in the seed).
- `aa-prototype/src/store/selectors.ts`: `contractPrices` in the billing context at about line 846;
  `accRelated` on `AccpayInvoiceRow` (about line 601) and its selector (about line 634);
  `counterpartyName` (about line 827, the `organisation` case).
- `aa-prototype/src/store/index.ts`: the contract action exports.
- `aa-prototype/src/apps/admin/screens/BillingMonitorScreen.tsx`: calls `editContract(...,
  { effectiveToISO: undefined })` to restore a dated-out Contract; it must keep working.
- `aa-prototype/src/shared/audit/auditNarrative.ts`: narrates `CounterpartyRef`, `ContractScope` and
  `ContractType2Detail` values (about lines 148 to 163).
- Tests that build Contracts or read the old fields: `domain/billing/{contracts,fee,invoiceBuild,
  validateCardForBilling,prePaymentInvoice}.test.ts`, `domain/seed/seed.test.ts`,
  `store/{billingRun,mastersActions,btmCapture,intake,prepayment}.test.ts`,
  `apps/admin/reviewFlags.test.ts`.
- `aa-prototype/src/store/billingLineActions.ts`: the rate x time gate.
- `aa-prototype/src/store/lifecycle.ts`: `editProcedure` and `ProcedurePatch`.
- `aa-prototype/src/store/appStore.ts`: `PERSIST_VERSION`.
- `aa-prototype/src/shared/capture/feeContext.ts`, `shared/capture/AddBillingLineSheet.tsx`,
  `shared/card/CardDetailBody.tsx` (now the Booking detail body),
  `shared/card/OfficeBillingSetup.tsx`, `shared/flows/EditBillingSetupSheet.tsx` (the
  governing-contract select), `shared/audit/fieldLabels.ts`.
- `aa-prototype/src/apps/admin/screens/MasterData.tsx` (`ContractsView`) and
  `apps/admin/flows/ContractEditSheet.tsx` (`PriceRows`).
- ACC markers: `apps/admin/reviewFlags.ts` (flag c) and its test; `apps/mobile/screens/BalancesScreen.tsx`
  (the ACC chip); `apps/web/screens/AccountsScreen.tsx` (the ACC column).
- `apps/demo/DemoControlPanel.tsx`: scenario text that names Contracts.
- `visual/admin-phase07.spec.ts`: asserts "default Type 1" copy.

## Work items

Model, seed and pricing come first and are re-greened before any UI.

1. **Parity baseline first** (`domain/billing/feeParity.test.ts`, new). Write it **before**
   any model change, run it green, and keep its output.
   - For every seeded procedure, it records `feeFor(...).total`, `lines` (basis and amount) and
     `billableUnits`, using the same context the app builds (the List date and the stored
     governing contract).
   - For every seeded Booking, it records the `buildInvoicesForCard` (or its Phase 15 name) draft
     totals per counterparty (kind and id), so a holder remapping that changes who is billed fails
     parity.
   - It records amounts, units, bases and counterparties, not line descriptions. The fixed line's
     description changes on purpose in work item 4 ("Contract price" becomes the holder code and
     description); an existing test that asserts the old words is a copy update, not a parity
     change.
   - Keep the results in a checked-in JSON fixture (`domain/billing/__parity__/phase-18-baseline.json`,
     written with `toMatchFileSnapshot`).
   - After the reshape, the same test must match the fixture exactly. Add explicit assertions for
     the pinned demo figures: the design-day fees under SXAP at $26.50, the S3 Holt and fee figures
     as they stand when this phase starts, the $23 vs $28.50 fallback test, the bariatric $2,800 and
     second-procedure $950, and the Aria 3.0 h x $480 = $1,440 line.
   - After the reshape, only the test's context-building code changes; the fixture never does.
     Never run it with `-u`. A fixture change is a parity failure to explain, not to accept.
   - This is how "S3, S4 and S5 figures identical" is proven, not eyeballed.
2. **Types: the four-part Contract** (`domain/types.ts`). Replace `ContractHolderType`,
   `ContractScope`, `ContractType2Detail` and the `type` / `permitsIndividualArrangement` /
   `type2Detail` fields.
   - `ContractCategory` = `'rvgDefaultPostPaid' | 'rvgDefaultHospital' | 'hospital' | 'surgeonSolo' |
     'surgeonGroup' | 'insurance'`. There is no Pre-paid category and ACC is not a category
     (US-04.1.1).
   - `ContractHolder`, a discriminated union:
     - `{ kind: 'hospital'; hospitalId }`
     - `{ kind: 'surgeon'; surgeonId }`
     - `{ kind: 'surgeonGroup'; surgeonGroupId }` (Phase 17's group id)
     - `{ kind: 'insurer'; insurerId }`
     - `{ kind: 'bookingBillableParty' }`: the Booking's own billable party. It has no fixed id
       (US-04.2.1; fixes "holder is a fixed party id").
   - `FundingSource` = `'private' | 'SXAP' | 'HNZ' | 'ACC'` (domain-model.md). Export it; Phase 20
     reuses it on the Booking.
   - `ContractScope` = `{ hospitalIds, surgeonIds, insurerIds, rvgCodes, fundingSources,
     anaesthetistIds }`, all arrays. An empty array means no narrowing on that dimension, and empty
     `anaesthetistIds` means organisational (US-04.2.1 AC). RVG groups arrive with Phase 19's group
     master.
   - `ContractRateStep` = `{ effectiveFromISO, rate: { basis: 'agreedUnitRate'; unitRate } | {
     basis: 'percentDiscount'; percent } }`.
   - `PricingBasis`:
     - `{ kind: 'rvgUnitsAnaesthetistRate' }`
     - `{ kind: 'rvgUnitsContractRate'; rates: ContractRateStep[] }`
     - `{ kind: 'fixedSchedule' }`
     - `{ kind: 'rateTime' }`

     This is the DM-06 mapping: Type 1, Type 2, Type 3 and `permitsIndividualArrangement`.
   - `Contract` = `{ id, name, category, holder, scope, pricingBasis, isDefault, effectiveFromISO,
     effectiveToISO?, reviewDateISO?, retiredAtISO? }`. `isDefault` stays the protected-default
     marker. It covers the RVG Default Hospital per hospital, the insurer default for a
     direct-billing insurer, and the one RVG Default Post-paid.
   - `FeeScheduleLine` replaces `ContractPrice` (DM-08, US-04.2.4):
     - `{ id, contractId, holderCode, description, mappedRvgCodes: string[], timeBand?: {
       fromMinutes, toMinutes? }, isAddOn, quantityRule?: { unitLabel }, procedureOrdinal?, prices:
       FeeSchedulePrice[] }`;
     - `FeeSchedulePrice` = `{ effectiveFromISO, priceExGst, priceIncGst }`.
     - `procedureOrdinal` is a labelled interim that keeps the bariatric second-procedure row. It
       moves to the Contract's multi-procedure rule in Phase 23.
     - The `surgeonId` match key is dropped, because surgeon narrowing is Contract scope now. No
       seeded row used it.
   - `Procedure` (now on the Booking side) gains `feeSchedule?: { lineId?: string; quantity?:
     number; addOns?: { lineId: string; quantity: number }[] }`. `lineId` absent means auto-match
     by RVG mapping (the OQ-18 interim). This is the "Procedure records feeScheduleLineId" of DM-08.
   - Remove `Procedure.accRelated` (RV-20).
   - **Surgeon groups:** point `surgeonGroupId` at the entity Phase 17 built (`SG-COS` for COS). If
     Phase 17 left COS only as a `ContractHolderOrganisation`, use that record as the group here. Do
     **not** rename `CounterpartyKind` in this phase, because it ripples into Xero contacts,
     invoices and history.
   - **Surgeon group to counterparty.** Today COS is billed as `{ kind: 'organisation', id: ORG.cos }`
     (seed `history.ts` `ORG_COS`, Xero contact number = that id, name from `masters.organisations`).
     To keep that exactly, `SurgeonGroup` gains an optional `billingOrganisationId` (seed `SG-COS`
     = `ORG.cos`), and the surgeon-group holder bills that organisation. A group without one is a
     billing exception with a plain message, never a guessed id. `masters.organisations` stays as the
     counterparty and Xero-contact record behind a group; it is no longer offered as a Contract
     holder. The Admin Organisations view stays, relabelled only if its copy calls it a Contract
     holder. Record the choice in PROGRESS.
3. **Pure Contract helpers** (`domain/billing/contracts.ts`, with Vitest tests in `contracts.test.ts`):
   - `holderKindFor(category)` gives the allowed holder kind per category:
     - `rvgDefaultHospital`, `hospital`: hospital;
     - `surgeonSolo`: surgeon;
     - `surgeonGroup`: surgeon group;
     - `insurance`: insurer;
     - `rvgDefaultPostPaid`: the Booking's billable party.
   - `holderCounterparty(holder, surgeonGroups)` returns today's `CounterpartyRef`: a surgeon group
     maps to `{ kind: 'organisation', id: group.billingOrganisationId }` (work item 2), and it
     returns `undefined` for `bookingBillableParty` or a group with no billing organisation. Test
     that the COS holder yields exactly `{ kind: 'organisation', id: ORG.cos }`.
   - `holderMatches(contract, holder)` replaces the holderType/holderId comparisons.
   - `isEffectiveOn`: unchanged.
   - `isRetired(contract)` and `isReviewDue(contract, todayISO)`.
   - `rateInForce(contract, dateISO)`: the latest step with `effectiveFromISO <= date`, else the
     earliest step, defensively. Test the 1 April / 1 July pair from US-04.2.10's first AC.
   - `priceInForce(line, dateISO)`: undefined when no price is in force yet.
   - `priceTimeline(steps, todayISO)` gives `{ current?, upcoming[], superseded[] }` and drives
     "Upcoming from <date>" (US-04.2.10 AC 2).
   - `permitsRateTime(contract)` = `pricingBasis.kind === 'rateTime'`. It is the single source of
     the Method 3 gate that `validateCardForBilling`, `billingLineActions` and
     `AddBillingLineSheet` now read, and `INDIVIDUAL_ARRANGEMENT_MESSAGE` stays single-sourced.
   - `selectContract` keeps today's precedence. Individual scope becomes `scope.anaesthetistIds`
     non-empty: rank 2 when it contains the anaesthetist, skipped when it does not. The holder
     test uses `holderMatches`. **Today's resolver is otherwise unchanged.**
   - `matchFeeScheduleLine(lines, { contractId, rvgBaseCode, procedureOrdinal, isAdditional,
     capturedMinutes, pricingDateISO, explicitLineId? })` replaces `matchContractPrice`:
     - an explicit `lineId` wins if it is on the Contract, is not an add-on, and has a price in
       force;
     - otherwise the candidates are non-add-on lines that have a price in force, whose
       `mappedRvgCodes` include the code, whose ordinal (if set) matches, and whose time band (if
       set) contains the captured minutes. Band lines never match when times are not captured;
     - the most specific wins (ordinal and band each count once), and ties go to input order;
     - the split-billing rule stays: an additional procedure takes a line only if the line sets an
       ordinal;
     - no match returns undefined, and the Decisions log 2026-07-22 BTM fallback still applies
       (Phase 21 replaces it with the not-on-schedule flag).
   - Tests: time-band selection (59, 60, 61 and 120 minutes), a band line with no captured times,
     an ordinal row, explicit line beats auto-match, an add-on never auto-matches, a future-dated
     price not yet in force, and a line added mid-year that is absent before its first date.
4. **`fee.ts` reprices from the new shape.** Keep `FeeResult`'s shape and `feeFor`'s signature
   apart from the context.
   - `FeeContext` gains a required `pricingDateISO` (the List date, per OQ-48's interim) and
     `feeScheduleLines` in place of `contractPrices`.
   - Export the captured-minutes helper for band matching.
   - `rvgUnitsAnaesthetistRate`, or no contract: units x `anaesthetist.unitValue`.
   - `rvgUnitsContractRate`: units x `rateInForce(...)`. An agreed rate is used as is; a percent
     discount is rounded to cents here, exactly as today.
   - `fixedSchedule`:
     - the matched line's price in force, ex GST, x quantity. The quantity is
       `procedure.feeSchedule.quantity` when the line has a quantity rule, else 1;
     - the fee line reads `"<holderCode> · <description>"`, plus `" × n <unitLabel>"` when the
       quantity is not 1;
     - each office-attached add-on with a price in force adds its own fixed line at price x
       quantity;
     - B/T/M are still computed and returned (US-05.2.5);
     - no main-line match falls to the BTM path as today;
     - `FeeLine` gains an optional `feeScheduleLineId` (Phase 25 locks it).
   - `rateTime`:
     - the fee is the captured rate x time lines plus any fixed ancillary lines;
     - B/T/M are recorded but not charged;
     - labelled reading: the catalogue says a Contract sets exactly one basis. Seeded Aria
       procedures carry no RVG code, so parity holds.
   - Every existing `fee.test.ts` case is re-expressed against the new shape with **the same
     expected numbers**, including the paper spot-check of $720 and the Type 3 fallback cases.
     Add tests for band pricing, add-ons, quantity, a rate step changing across two List dates,
     and a fixed-schedule line changing price across two List dates (US-04.2.10 AC 1).
5. **Every other pure consumer** follows. Test the ripple in the existing suites:
   - `invoiceBuild.ts`:
     - `defaultContractFor` and `resolveContractForProcedure` use `holderMatches` and holder kinds.
       The fallback is still scoped to hospital and insurer holders; surgeon, surgeon-group and
       Booking-billable-party holders dated out are still exceptions (Phase 08 decision 1,
       unchanged);
     - `counterpartyForProcedure` uses `holderCounterparty`. A `bookingBillableParty` holder on
       the contract-holder route bills the Booking's billable party, or else the patient. This
       replaces the "unreachable" throw for that case, with a test;
     - pass `pricingDateISO` = List date;
     - copy that says "protected default Type 1" becomes "default Contract".
   - `validateCardForBilling.ts`:
     - `CardBillingContext.contractPrices` becomes `feeScheduleLines` (plus `surgeonGroups` for
       `holderCounterparty`), and `feeContextFor` passes the date and the lines;
     - the rate x time gate reads `permitsRateTime`;
     - new rule: a `rateTime` Contract needs at least one rate x time line to complete, so that a
       rate x time Procedure can never price $0 silently;
     - new rule: `feeSchedule` references must be lines on the governing Contract (single-sourced
       message).
   - `shared/capture/feeContext.ts`, `domain/seed/billing.ts`, the billing context built in
     `store/selectors.ts` (about line 846) and the Booking detail body's fee context all pass
     `pricingDateISO` from the List and pass `feeScheduleLines`.
   - `fixtures.ts`: `mkContract` defaults to `{ category: 'hospital', holder: hospital, scope: all
     empty, pricingBasis: rvgUnitsAnaesthetistRate }`.
6. **Seed** (`domain/seed/contracts.ts`, `seed/index.ts`, `seed/cards.ts`, `seed/history.ts`).
   Keep every existing Contract id.
   - The five hospital defaults become `rvgDefaultHospital`, holder the hospital,
     `scope.hospitalIds = [that hospital]`, `isDefault`, and are named "<Hospital> RVG Default
     Hospital".
   - nib: `insurance`, `isDefault`, `insurerIds [nib]`, named "nib insurer default".
   - SXAP: `hospital`, Southern Cross, `fundingSources ['SXAP']`, and one rate step of $26.50 from
     2024-07-01. The Decisions log 2026-07-23 figure is kept.
   - Health NZ: `hospital`, Christchurch Public, `['HNZ']`, $23 from 2023-07-01, review date
     2026-07-01, so "Review due" shows on day one.
   - St George's ACC: `hospital`, `['ACC']`, $25.
   - COS ACC: `surgeonGroup` (COS), `['ACC']`, $24.
   - Doyle bariatric: `surgeonSolo`, Mr Doyle, `fixedSchedule`.
   - Aria: `rvgDefaultPostPaid`, holder `bookingBillableParty`, `rateTime`, and `anaesthetistIds
     [Souter, Fitzgerald]`. That set covers the two seeded Aria Bookings and shows the "set of
     anaesthetists" scope. This is a labelled reading: there is no individually-arranged category,
     and patient-direct is the only category family whose holder is the Booking's billable party.
     Raise it with the owner.
   - Drop "(Type n)" and "(default Type 1)" from every name.
   - New: `CT-RVG-POSTPAID` "RVG Default Post-paid", `rvgDefaultPostPaid`, `bookingBillableParty`,
     `rvgUnitsAnaesthetistRate`, `isDefault`. It governs no seeded procedure; Phase 20 makes it
     selectable as the patient-direct default.
   - New: `CT-CES-HNZ` "Christchurch Eye Surgery HNZ schedule", `hospital`, CES, `['HNZ']`,
     `fixedSchedule`, from 2026-07-01. Its lines use labelled demo prices:
     - `HNZCATall` "Cataract, all" (42702);
     - `HNZVIT60` "Vitrectomy up to 60 min" (42725, 0 to 60);
     - `HNZVIT90` "Vitrectomy 61 to 90 min" (61 to 90);
     - `HNZVIT120` "Vitrectomy 91 to 120 min" (91 to 120);
     - `HNZVITX15` "Vitrectomy, each extra 15 min", an add-on with quantity rule "15 min block",
       $100;
     - `HNZGA` "GA add-on", add-on, $370.

     These match the catalogue's real examples. It governs no seeded procedure, so parity holds.
   - Fee schedule lines replace `CONTRACT_PRICES`. Keep the three existing row ids (`CP-BAR-1`,
     `CP-BAR-2`, `CP-BAR-3`) as the Doyle line ids, because `store/billingRun.test.ts` names
     `CP-BAR-1`; give the CES lines `CP-CES-1` to `CP-CES-6`. Doyle:
     - `BAR-BYP` "Laparoscopic gastric bypass" (20880): $2,800 ex GST from 2025-01-01 **and
       $2,950 from 2026-07-28**. This is the demo's "Upcoming" line: one "+7 days" press, or the
       "Procedure day · 28 Jul" shortcut, flips it. No seeded Doyle-schedule procedure sits on or
       after 28 Jul, and the parity test proves it;
     - `BAR-SLV` "Sleeve gastrectomy" (20882): $2,400;
     - `BAR-HER2` "Concurrent umbilical hernia repair, second procedure" (49120, ordinal 2): $950.

     `priceIncGst` = ex x 1.15, rounded to cents, using the shared `GST_RATE`.
   - Review dates: 2027-04-01 on the other negotiated Contracts (the 1 April fee cycle), 2026-07-01
     on Health NZ as above, and none on the defaults.
   - `masters.contractPrices` becomes `masters.feeScheduleLines` (the `SeedData` type in
     `seed/index.ts` too), and the id spec `contractPrice` in `store/mutate.ts` becomes
     `feeScheduleLine` (keep prefix `CPN`, so allocated ids do not collide with seeded ones).
   - Phase 17's `SG-COS` gains `billingOrganisationId: ORG.cos` (work item 2).
   - Remove `accRelated` from `seed/cards.ts` specs and `seed/history.ts` rows.
   - Rename the scenario marker `accRelatedCard` to `accContractCard` ("ACC procedure under St
     George's ACC Contract"). Update `store/prepayment.test.ts` and `store/billingRun.test.ts`, and
     reword the `cosAccContractCard` detail, dropping "Type 2".
   - **Bump `PERSIST_VERSION` by one** from the value you find, with a comment line in the history
     block.
7. **Store** (`store/contractActions.ts`, `store/mastersActions.ts`). Every action is office-only
   and goes through `mutate()`; refusals are data.
   - `createContract`:
     - the input carries category, holder, scope, pricing basis, dates and review date;
     - the store refuses a holder kind that does not fit the category (`holderKindFor`);
     - it refuses `rvgDefaultHospital` and any `isDefault`, because only `createHospital` and
       `setInsurerDirectClaims` mint defaults;
     - it refuses a contract-rate basis with no step, or whose first step starts after the
       Contract's `effectiveFromISO`.
   - `editContract`:
     - it patches the new fields. `isProtectedDefault(c)` = `c.isDefault`, which drops the `type
       === 1` test;
     - for the protected default it refuses: end-dating, forward-dating, re-holding,
       re-categorising, re-basing away from `rvgUnitsAnaesthetistRate`, and retiring. It allows
       renaming, the review date and scope edits;
     - a basis change drops stale rates.
   - `retireContract(api, actor, id, { effectiveToISO? })` is new:
     - it stamps `retiredAtISO` = demo-clock today and sets `effectiveToISO` (default today; not
       before `effectiveFromISO`). The existing effective-dating then handles billing unchanged;
     - it refuses the protected default;
     - its Outcome reports how many unbilled procedures still reference the Contract, so the UI can
       warn;
     - it is audited as `contract.retire`.
   - `deleteContract` stays for a never-used Contract (existing guards) and deletes its lines.
   - Rates: `addContractRate` and `removeUpcomingContractRate`. Steps are keyed by
     `effectiveFromISO`, unique per Contract; only a step not yet in force on demo-clock today can
     be removed. Past and current steps are never edited in place, so older prices stay (US-04.2.10).
   - Lines: `addFeeScheduleLine`, `editFeeScheduleLine` (non-price fields only), and
     `deleteFeeScheduleLine` (refused while any procedure's `feeSchedule` names it).
   - Line prices: `addFeeSchedulePrice` and `removeUpcomingFeeSchedulePrice`, with the same rule.
     Both prices must be above zero and agree with ex x 1.15 to the cent; the editor derives one
     from the other.
   - `mastersActions.ts`: `createHospital` mints a protected `rvgDefaultHospital`, and
     `setInsurerDirectClaims` mints a protected `insurance` default. Rename `defaultType1` and
     update the copy.
   - `editProcedure` accepts `feeSchedule`, with the same edit matrix as `governingContractId`
     today.
   - Tests: re-express `mastersActions.test.ts` and the contract store tests, and add tests for
     retire, the rate and line price rules, category-holder refusal and the protected-default
     refusals.
8. **Re-green session 1.** Run `npx vitest run` with the parity fixture matching unchanged,
   `npm run build` and `npm run build:pwa`. Stop here if this is the end of session 1, and leave the
   PROGRESS status as IN PROGRESS with what remains.
9. **Admin Contract catalogue rebuilt** (`apps/admin/screens/MasterData.tsx` `ContractsView`,
   covering US-04.1.1, US-04.1.2, US-04.2.1 and US-04.2.10).
   - Table columns: Name, Category, Holder, Pricing, Scope, From, To, Review, Status.
     - The protected lock icon stays on defaults.
     - Pricing reads "Anaesthetist rate", "$26.50 per unit", "10% discount", "Fee schedule · 3
       lines" or "Rate x time".
     - Scope is a short summary, for example "Southern Cross · SXAP" or "2 anaesthetists", or
       "Organisation".
     - Status pills are "Retired" (neutral), "Review due" (warning), and "Upcoming price" (info)
       when any rate or line has an upcoming step.
   - Category filter chips above the table, and a "Show retired" toggle that is off by default.
   - The header copy loses "default Type 1": protected defaults are "RVG Default Hospital and
     insurer default Contracts".
   - `data-shot="contract-catalogue"`.
10. **Contract detail** (`apps/admin/flows/ContractEditSheet.tsx`, rebuilt as a wide desktop panel
    with sections; covers US-04.1.1, 04.1.2, 04.2.1, 04.2.4 and 04.2.10):
    - **Definition:** name, then category (segmented or select), then a holder picker filtered to
      the category's holder kind (hospitals, `masters.surgeons`, `masters.surgeonGroups`,
      insurers; organisations are no longer offered). "Booking's billable party" shows as fixed
      text.
    - **Scope:** multi-select chips for hospitals, surgeons, insurers, RVG codes, funding sources
      and anaesthetists. An empty field reads "Any". Empty anaesthetists reads "Whole
      organisation".
    - **Pricing:**
      - basis selector;
      - for contract rate: a rate table (effective from, $ per unit or %, and a Current / Upcoming
        from <date> / Superseded pill from `priceTimeline` against `useToday()`), with "Add rate
        from date";
      - for a fee schedule: the line table (holder code, description, RVG mapping, time band,
        add-on, quantity rule, ex GST, inc GST, Current price, and "Upcoming from <date> · $x"), a
        per-line price history with "Add price from date", and add, edit and delete line. Entering
        ex or inc derives the other;
      - the two provisional lines from the drift check.
    - **Dates:** effective from, effective to and review date.
    - **Actions:** Save (teal primary); "Retire contract", which confirms with the unbilled-reference
      count; "Delete", only for never-used Contracts. Protected defaults show the lock notice and
      disable what the store refuses.
    - Hooks: `data-shot="contract-detail"` and `data-shot="fee-schedule-lines"`, replacing
      `contract-price-rows`.
11. **Office billing setup** (`shared/flows/EditBillingSetupSheet.tsx`, `shared/card/OfficeBillingSetup.tsx`;
    covers US-05.2.5):
    - The governing-contract select labels each option "<name> · <category>", no longer "(Type
      n)". It excludes retired Contracts unless one is already selected, in which case it shows
      "(retired)". It still lists every Contract otherwise, because scope narrowing is Phase 20.
    - When the chosen Contract is a fee schedule, show:
      - a "Schedule line" select: "Match by RVG code" (the default) or a specific holder line;
      - a quantity stepper when the line has a quantity rule;
      - an add-on list with quantities;
      - writes go to `feeSchedule` through `editProcedure`.
    - The read view shows the matched line "<holderCode> · <description>" and any add-ons.
    - Mobile and web need no new control. The fee breakdown already renders the fixed line's new
      description, and the rate x time option reads `permitsRateTime`.
12. **ACC as an ordinary holder** (RV-20):
    - delete review flag (c) "ACC should not bill the patient directly" and its test case;
    - delete the ACC chip on mobile Balances (`AgeChip`'s `accRelated` prop);
    - delete the ACC column on web Accounts;
    - delete `accRelated` from `AccpayInvoiceRow` and its selector, and from `fieldLabels`,
      `seed/audit.ts`, `cardActions.ts`, `fixtures.ts` and `store/btmCapture.test.ts`.

    ACC work is now visible only as the holder's ACC-scoped Contract (`fundingSources ['ACC']`) on
    the Booking. Keep the ACC pre-op flat-fee codes copy in `AddBillingLineSheet` (US-05.5.2 stays).
13. **Copy, labels and tests sweep.**
    - `shared/audit/fieldLabels.ts`: labels for category, holder, scope, pricing basis, rates,
      review date, retired, holder code, time band, add-on, quantity rule, prices and fee schedule.
      Remove the Type fields.
    - `shared/audit/auditNarrative.ts`: replace the `ContractScope` (`organisation` /
      `individualAnaesthetist`) and `ContractType2Detail` branches with narration for the new
      holder ("Held by Southern Cross", "Held by the Booking's billable party"), scope ("Whole
      organisation", "2 anaesthetists", filters), pricing basis, rate steps and price steps, so a
      History entry for a Contract edit never shows raw JSON. Keep the `CounterpartyRef` branch.
    - A `CONTRACT_CATEGORY_LABEL` / `PRICING_BASIS_LABEL` map in `src/shared/`, one home for the
      three apps.
    - Grep `aa-prototype/src` for "Type 1", "Type 2", "Type 3", "default Type 1" and
      "permitsIndividualArrangement" in rendered strings, and fix them. Comments that describe
      history may stay.
    - Update `DemoControlPanel.tsx` scenario text that names "Health NZ agreed rate (Type 2)" or
      "COS ACC Type 2".
    - Update the Phase 14 registry label or text for "Trigger billing failure" if it names the
      Contract.
    - Update the `visual/admin-phase07.spec.ts` assertions and screenshot. Add Playwright shots for
      the catalogue, the detail panel with the Doyle line showing "Upcoming from 28 Jul 2026", and
      the CES schedule.
    - No en or em dashes in any new copy.

## Demo triggers

This phase adds **no new button**. The US-04.2.10 beat uses the existing demo clock, which is in the
harness bar and also the PWA's More-tab clock:

| Trigger | Screen | Effect |
|---|---|---|
| Existing clock "+7 days" or "Procedure day · 28 Jul" | Admin, Master data, Contracts, "Bariatric fee schedule, Mr P. Doyle" | `BAR-BYP` flips from "$2,800.00 current · Upcoming from 28 Jul 2026 · $2,950.00" to "$2,950.00 current" with $2,800 superseded. The Tue 14 Jul bariatric Booking still prices $2,800, because the price follows the List date |

- **Check the existing trigger still works:** Phase 14's "Trigger billing failure" (dates out the
  COS ACC Contract) edits the reshaped record. Confirm it still fails the COS Booking and invoices
  its sibling, and that the Billing monitor's restore (`BillingMonitorScreen.tsx`,
  `editContract(..., { effectiveToISO: undefined })`) still clears it and the retry bills COS as
  the same organisation counterparty as before.
- **PWA equivalent:** none needed. The effect is on the Admin Contract catalogue, and the PWA has
  no Admin. The mobile fee breakdown is unchanged in value.

## Out of scope

These Contract fields and behaviours belong to later phases. Do not add fields for them here
(convention 15):

- RVG groups in scope, and base-unit overrides: 19 and 23.
- Scope-filtered picker, default hospital Contract selection, removing route and payment category,
  insurer and funding source on the Booking: 20.
- Required booking inputs, billable party, the not-on-schedule flag replacing the BTM fallback: 21.
- Covered amount, invoice layout, delivery method, GST treatment: 22.
- Multi-procedure rule, including moving `procedureOrdinal` out of the line: 23.
- `allowsAnaesthetistAdjustment`: 24.
- Contract version history and the AUTHORISED lock: 25. US-04.1.2's "version" wording is met there;
  here, rate and price steps keep old prices and the audit trail keeps old values.
- The CES "tier" (commitment vs panel price columns): in DM-08, but in no covered story's text.
- An anaesthetist-side holder-code picker (OQ-18).
- Any change to the resolver's precedence.

## Manual test checklist

- [ ] Admin, Master data, Contracts: every seeded Contract shows a category, holder, pricing and
      scope, and none shows "Type n". The five hospital defaults, nib and RVG Default Post-paid
      carry the lock. Health NZ shows "Review due". "Show retired" is off and the category chips
      filter.
- [ ] New contract: choosing "Surgeon Group" limits the holder list to surgeon groups; "RVG Default
      Post-paid" shows "Booking's billable party"; RVG Default Hospital is not offered. Scope chips
      save; an empty anaesthetists field reads "Whole organisation".
- [ ] A protected default refuses end-dating, re-basing, re-holding and retiring, with the store's
      message; renaming it and setting a review date both work.
- [ ] Health NZ: add a rate of $24.00 from 1 Oct 2026. It shows "Upcoming from 1 Oct 2026" and the
      $23 step stays Current. Remove the upcoming step. A current step cannot be removed or edited.
- [ ] Doyle bariatric: `BAR-BYP` shows $2,800.00 ex / $3,220.00 inc and "Upcoming from 28 Jul 2026
      · $2,950.00". Press harness clock "+7 days" and it flips to Current $2,950.00. The Tue 14 Jul
      bariatric Booking still shows $2,800.00 for that line and $950.00 for the hernia second
      procedure.
- [ ] CES HNZ schedule: take a vitrectomy (42725) Booking on Dr Souter's seeded Wed 22 Jul CES
      List, capture start and handover 75 minutes apart, and in office billing setup set its
      Contract to "Christchurch Eye Surgery HNZ schedule". It prices
      `HNZVIT90`, and B/T/M are still shown. Add "GA add-on" and "each extra 15 min" x 2 and the
      total adds $370 + $200. Pick `HNZCATall` explicitly and it prices that line instead.
- [ ] Retire a negotiated Contract with no unbilled references. It leaves the catalogue unless
      "Show retired" is on, and it drops out of the office governing-contract select. The audit
      shows `contract.retire`.
- [ ] Every seeded fee is unchanged: the S3 figures, the S4 Beat 3 billing failure (Phase 14's
      trigger on the COS ACC Contract still fails that Booking and invoices its sibling), and the
      S5 Beat 4 end-date on "Health NZ agreed rate" leaves the Hemi Walker invoice unchanged.
- [ ] The Aria rate x time line still adds on Souter's Mon 27 Booking under the Aria Contract, and
      a Contract that is not rate x time still refuses it with the single-sourced message.
- [ ] No "ACC" chip on mobile Balances, no ACC column on web Accounts, no ACC review flag in
      Admin Review. The ACC pre-op flat-fee help text is still in the add-billing-line sheet.
- [ ] Mobile (framed and PWA) and web Booking detail: fees unchanged. The bariatric fixed line
      reads "BAR-BYP · Laparoscopic gastric bypass".
- [ ] `npm run shots` green, with the Phase 07 spec updated and the new shots captured.
- [ ] `npm run build`, `npm run build:pwa` and `npx vitest run` green, with the parity fixture
      matched.

## Demo guide updates

Mirror each change in the same section of `docs/demo-guide/master-demo-guide.html`.

- **`04-presenter-cheat-sheet.md`:**
  - rewrite "Contracts": categories, holder, scope, the four pricing bases, fee schedule lines with
    holder codes, and effective-dated prices with "Upcoming";
  - fix the "ACC route" glossary row: ACC is priced by the holder's ACC Contract and is not a
    route or a category;
  - keep "Statements to avoid: ACC has its own billing route" and §12 (ACC pre-op codes);
  - add a one-line "show an upcoming price" tip: open the Doyle Contract, then press "+7 days".
- **`03-demo-script.md`:**
  - S5 Beat 4: the Contract is now "Health NZ agreed rate". The optional aside is the Health NZ
    "Review due" pill and the Doyle "Upcoming" price;
  - S4 Beat 3: "group-held" becomes "held by a surgeon group", with the COS Contract's new name;
  - S3 is unchanged in figures. Check its wording for "Type".
- **`01-personas-and-responsibilities.md`:** drop "ACC route warnings" from the office's review
  flags.
- **`02-workflows-and-handoffs.md`:** drop "ACC advisory flags". "Selects the governing Contract and
  rating method" becomes "and its pricing basis".
- **Control Panel scenario text** (`DemoControlPanel.tsx`) and the seed scenario-marker details:
  new Contract names, no "Type n".
- This is not a milestone phase, but re-read `master-demo-guide.html` §S4 and §S5 after patching.

## Adversarial review (after build)

After the manual test checklist and the build and tests are green, and before writing the PROGRESS
entry, run the standard **adversarial review-and-fix pass (PROGRESS convention 18)**:

- Fan out independent Opus reviewers. Scale this money-model phase to four lenses: quality,
  fee-maths and parity, store and lifecycle, and plan and catalogue adherence.
- Verify every finding against the catalogue files and the code, fix the confirmed ones, and
  re-green.
- Record the pass. Do not re-raise anything settled in the Decisions log.

**Steer this phase's reviewers at:**
- **Parity is real:** the baseline fixture was captured before the reshape and matches unchanged.
  Recompute a sample of seeded fees by hand: SXAP $26.50, Health NZ $23, St George's ACC $25, COS
  $24, the bariatric rows and Aria $1,440. No test's expected number was edited to pass.
- **Today's resolver is untouched in behaviour:**
  - the stored governing Contract is used while it is effective on the List date;
  - the fallback goes only to that hospital's or insurer's protected default, never to another
    negotiated Contract;
  - surgeon, surgeon-group and Booking-billable-party holders dated out are exceptions;
  - scope filters change no selection outcome yet, except the anaesthetist rank;
  - every seeded invoice goes to the same counterparty kind and id as before (COS stays
    `{ kind: 'organisation', id: ORG.cos }`; Aria stays the Aria clinic billable party).
- **Dates:** the price in force uses the List date everywhere: capture display, validator, invoice
  build and the seed billing slice. No path reads the demo clock, the Booking-created date or
  `Date.now()`. "Current" and "Upcoming" in the UI use the demo clock's today. Rate and price
  steps already in force cannot be edited or removed.
- **Fee schedule lines:**
  - ex GST drives pricing and inc GST agrees to the cent;
  - add-ons never auto-match;
  - band lines need captured times;
  - the additional-procedure ordinal rule survives;
  - B/T/M are still recorded under a fixed price;
  - a `rateTime` Contract cannot price $0 silently;
  - the Method 3 gate and `INDIVIDUAL_ARRANGEMENT_MESSAGE` are still single-sourced.
- **Store guards hold independently of the UI** (convention 6): category-holder fit, protected
  defaults (not end-dated, re-based, re-held or retired), only minted defaults are `isDefault`,
  retire and delete refusals, and every write goes through `mutate()` with an audit entry.
- **ACC:** no ACC special case is left anywhere (flag, chip, column, `accRelated`, or copy
  implying an ACC route). The ACC pre-op flat-fee codes survive.
- **Copy and design:**
  - no "Type 1/2/3" in rendered copy;
  - no en or em dashes;
  - teal is the only action colour, and Retire and Delete use the error treatment, not crimson;
  - pills use tint and on-tint tokens;
  - codes and money are mono tabular-nums;
  - the admin panel is a desktop layout;
  - no build-phase references in app copy ("from Phase 20" and similar).
- **Persistence and the PWA:** `PERSIST_VERSION` is bumped, and a stale persisted state reseeds
  cleanly. The PWA purity test holds, because any new shared label module imports nothing
  admin-only.

## PROGRESS.md updates

- **Status row:** add Phase 18 (Contract model) as DONE with the date, or IN PROGRESS after session 1
  with what remains.
- **Phase entry** in the template:
  - the drift-check result (items, OQ-18 and OQ-48 status, US-04.2.1 status);
  - what Phase 17's surgeon-group entity was, and how COS maps to it;
  - the parity fixture path and its result;
  - the `PERSIST_VERSION` bump;
  - the review pass;
  - the handoffs to 19 (RVG groups in scope), 20 (scope narrows the picker; RVG Default Post-paid
    becomes selectable; `FundingSource` is ready for the Booking), 21 (the BTM fallback is still in
    place), 23 (`procedureOrdinal` on the line), 25 (rate and price steps and
    `feeScheduleLineId` to lock) and 42 (the organisations master behind surgeon groups).
- **Decisions log:**
  - (a) **Supersedes the 6th review #3 and 7th review A5/B3 ACC advisory**: `accRelated` and the
    review flag, chip and column are removed (RV-20; US-05.5.1). ACC is the holder's ACC-scoped
    Contract.
  - (b) **Amends "Contract-holder placements (seed)" (2026-07-23):**
    - COS is a Surgeon Group holder;
    - Aria is `rvgDefaultPostPaid` with holder "Booking's billable party", pricing basis rate x
      time, and a two-anaesthetist scope (the labelled category reading);
    - the ACC Contracts are ordinary Hospital and Surgeon Group Contracts scoped to funding source
      ACC.
  - (c) **Protected default vocabulary:** "default Type 1" becomes "RVG Default Hospital or insurer
    default". The invariant is unchanged. RVG Default Post-paid is also protected.
  - (d) **Price in force = List date** (OQ-48 interim), for both rate steps and line prices.
  - (e) **Rate x time basis charges no RVG units** and needs a rate x time line to complete.
  - (f) **Fee-schedule matching by RVG mapping, with an office-chosen holder line** (OQ-18
    interim). Record that the 2026-07-22 Type 3 BTM fallback and the SXAP $26.50 ruling are
    **kept**.
  - (g) **Surgeon group bills through its organisation record** (interim): the Surgeon Group holder
    invoices `SurgeonGroup.billingOrganisationId`, so COS stays the `ORG.cos` counterparty and Xero
    contact. Organisations are no longer Contract holders but the master survives (Phase 42 gives it
    retire and reinstate as a surviving master); any `CounterpartyKind` change is out of scope.
