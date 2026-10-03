# Phase 20 · One Contract per Procedure

**Requirements covered:**
[EP-04](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/EP-04.md) (the route half; the Contract-defined billable party lands in 21, the lock in 25),
[FT-04.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-04.3.md) (Verify),
[US-04.3.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.3.1.md),
[US-04.3.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.3.2.md) (Verify; filtered by procedure then hospital, the default RVG Contract always offered, AA-code and holder-code search, OQ-66 answered),
[US-04.3.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.3.3.md),
[US-04.3.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.3.4.md) (the office sets the Contract at booking setup, on every creation form; matching a hospital row is 33's),
[FT-03.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-03.4.md) (Contradicts; the change-and-flag half, office approval lands in 21),
[US-03.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.4.1.md),
[US-03.1.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.1.2.md),
[US-03.2.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.2.3.md);
[DM-10](../analysis/domain-model-delta.md#dm-10) (one Contract per Procedure, procedure first,
narrowed by hospital, the default RVG Contract always offered, code search), [DM-12](../analysis/domain-model-delta.md#dm-12) (insurer and funding source
on neither Booking nor Patient; replaces the old DM-35 "on the Booking"),
[DM-37](../analysis/domain-model-delta.md#dm-37) (anaesthetist Contract change flagged, derived from
audit); [RV-08](../analysis/reverse-check.md) (route and payment category part; the Type 1/2/3
relabel landed in 18); [RV-27](../analysis/reverse-check.md) (feed- and PDF-created Bookings stop
being stamped with the hospital route).
**Leans on, not covered:** [US-15.0.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-15.0.1.md)
(keep the anaesthetist's view free of Contract complexity: this phase builds its picker and Contract
row to that rule; the wider sweep is 43a), [US-04.1.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.1.4.md)
(18's short AA code, shown in the picker and searched), [US-04.4.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.4.2.md)
and [FT-04.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-04.4.md)
(19a's per-procedure default RVG Contracts, which hold the base units and which the picker always
offers), [US-04.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.1.md)
(18's scope, with 19a's procedure scope on every Contract, is what the picker filters on),
[US-04.2.11](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.11.md)
(combination Contracts: the picker rule offers them, 23 seeds them).
**Depends on:** Phase 19a (and through it 19's master procedure list, `procedureTypeId`,
`scopeCoversProcedure`, `pickProcedure` and the procedure-first capture picker; 19a's
per-procedure default RVG Contracts, its base-unit resolver reading the Contract, its Contract
base-unit override and the procedure scope it set on every existing Contract; 18's Contract shape:
category, holder, scope filters, pricing basis, `aaCode`, fee-schedule lines with holder codes,
`contractSearch`; 15a's warning routine; 15's Booking vocabulary; 14's trigger registry).
**Answered, build the answer:** [OQ-66](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-66.md)
(D16: a short structured AA code, searchable; the picker filtered by procedure then hospital, the
default RVG Contract always offered, code search), [OQ-55](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-55.md)
(D2), [OQ-67](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-67.md)
(D17: the Contract always defines the billable party; 21 builds it) and
[OQ-73](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-73.md) (D23:
prepayment only where a person pays for the patient, which the interim flag obeys).
**Blocked by (open, build the recommendation):** [OQ-78](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-78.md)
(default Contracts, or the hospital holding every Contract: Greg floated no default Contracts; keep
the catalogue's model).
**Estimated:** 2 sessions. Session 1: work items 1 to 9 (figures pinned, model, engine, store, seed),
ending green with the UI edited only as far as it must compile. Session 2: items 10 to 18 (picker,
sheets and creation forms, review, copy, shots, demo guide). Tight for an XL change: session 1
carries the seed remap and fourteen test files. If it overruns, finish green on items 1 to 7 and 9
and open session 2 with item 8's label sweep; never defer the parity pin or the seed remap.

## Goal

Pricing becomes one decision. `BillingRoute`, `PatientPaymentCategory` and `Procedure.insurerId`
are removed, and with them the engine's route resolution and route-based payer derivation. Per
owner decision D2 (OQ-55, answered 2026-10-01), insurer and funding source are held on **neither the
Booking nor the Patient**: the Procedure's Contract says who pays (OQ-67: the Contract always
defines the billable party), one Booking can have Procedures on different Contracts, and nothing
replaces `insurerId`.

Every Procedure carries exactly one Contract, set at booking setup (US-04.3.4). The Scheduling
Engine defaults it to the RVG Default Hospital Contract for the List's hospital when the Booking is
created, on every creation path (anaesthetist add, office phone advice and manual entry, and the
integration and PDF creates, which stop stamping the hospital route, RV-27), and again when the
hospital changes; a Booking cannot be marked complete without one. The office sees and can change
the Contract on the creation form itself, so it is checked well before the day.

After the procedure pick (Phase 19), anaesthetists (mobile and web) and the office choose the
Contract from a picker built to OQ-66's answer (D16): filtered by the picked procedure (the procedure
scope 19a set on every Contract, its RVG code or group), then by the List's hospital, with the
default RVG Contract always offered first and no "None". Typing a Contract's AA code, or a holder's
own code (the catalogue's example is `8942`; in the seed, Phase 18's CES HNZ codes such as
`HNZCATall`), filters the list to that Contract, and each row shows the Contract's AA code.
Contracts will number in the thousands, so the picker is filtered and searchable, never a flat
select. The picked Contract seeds the Procedure's base units through 19a's resolver (its override
for the procedure, code or group, else the procedure's default RVG Contract).

The anaesthetist's view stays simple (US-15.0.1): the Contract shows as a plain name and its AA
code with a teal "Change", with no route chip, insurer, payer or pricing basis. The office sees the full detail. An
anaesthetist's Contract change is recorded and flagged for the office at review, derived from the
audit trail (DM-37).

Three interims keep the demo whole until later phases replace them, each labelled in code comments
and the Decisions log:

- **Payer = the selected Contract's holder** (a patient-direct holder bills the Procedure's guardian
  override, else the patient) until Phase 21 builds OQ-67's answer: the billable party defined by
  the Contract, with the payer's name and email captured when a default or patient-direct Contract
  is picked, and the guardian override gone.
- **`funderOverride` stays the two-funder split** (Prentice, S3) until Phase 22's Contract payment
  setting (full or split, typed $ or % shares) replaces it.
- **Prepayment is an office-set flag on the Booking** until Phase 27 derives it from the
  anaesthetist's prepaid set. The office sets it on or off (all or nothing, US-06.2.2), only where a
  Procedure's Contract bills a person paying for the patient, never an organisation (OQ-73, D23);
  the seeded Riley $800 deposit stays as data so S4's figures hold until 27 retires deposits. The
  flag feeds 15a's unpaid-prepayment warning, never a completion gate (D5).

The default-Contract model itself is still open (OQ-78: Greg floated no default Contracts, the
hospital holding every Contract). Build the catalogue's model, labelled provisional in one place
(item 10).

S3 figures must not move, and holder-as-payer must reproduce today's payer for every seeded
Procedure.

> Names below are the current names at `3d3a18c` (Phase 15 renamed Card to Booking:
> `createBooking`, `bookingActions.ts`, `BookingDetailBody`, `ManualBookingForm`,
> `validateBookingForBilling`, `seed/bookings.ts`). Use Phase 18's names for the Contract fields
> (category, holder, scope filters, pricing basis, `aaCode`, fee schedule lines), Phase 19's for the
> master procedure list and the Procedure's link to it (planned as `ProcedureType` and
> `procedureTypeId`), and Phase 19a's for the per-procedure default RVG Contracts and the base-unit
> resolver, as their PROGRESS entries record them.

## Before you start: drift check

1. Run:

   ```
   git diff 3d3a18c -- "docs/discovery-reference/Updated Requirements/catalogue" "docs/discovery-reference/Updated Requirements/domain-model.md"
   ```

   Look for changes to EP-04, FT-04.3, US-04.3.1, US-04.3.2, US-04.3.3, US-04.3.4, FT-03.4,
   US-03.4.1, US-03.1.2, US-03.2.3, and to the items this phase leans on: US-04.1.1 (categories,
   Verify: Greg is reviewing them), US-04.1.4, US-04.2.1 (scope filters, including procedures),
   US-04.2.11, US-04.4.2 and FT-04.4 (the per-procedure default RVG Contracts and how they relate
   to the hospital default), US-05.1.6, US-07.2.2, US-11.2.2, US-11.4.2, US-15.0.1, OQ-55, OQ-66,
   OQ-67, OQ-73, OQ-78 and the domain model's Contract and "Selection" sections. If an item
   changed, re-read it and adjust the work items. If one is now Retired or Future, drop it from this
   phase and record that in the PROGRESS entry.
2. **Owner decisions D2, D16, D17 and D23 are answered** (OQ-55, OQ-66, OQ-67, OQ-73): neither the
   Booking nor the Patient holds an insurer or funding source; the picker filters by procedure then
   hospital, always offers the default RVG Contract and searches by AA code and holder code; the
   Contract defines who pays (this phase keeps holder-as-payer as the interim; 21 builds the
   captured billable party); prepayment only for a person paying for the patient. Build those.
3. **OQ-78 is open.** Build its recommendation: the catalogue's model, in which every hospital keeps
   its RVG Default Hospital Contract, every procedure has 19a's default RVG Contracts, and both are
   offered as defaults. Label it provisional in one place only (the office picker's Default section
   caption, item 10) and in the Decisions log. If OQ-78 is answered (for example no default
   Contracts, the hospital holding every Contract), stop and record it: it changes items 3, 6 and
   10, and the plan needs re-cutting before building.
4. **Confirm what 15a, 15b, 18, 19 and 19a actually delivered** (their PROGRESS entries):
   - 15a and 15b: the warning routine; whether session 2 built `WARNING_SAMPLES` and its
     prepayment sample (planned to stage the condition through the route and payment-category
     fields this phase deletes); that the prepayment completion gate, `overridePrepaymentGate` and
     `PrepaymentOverrideSheet` are gone (D5); that Copy a Booking (`copyBooking`) is gone and what
     15b left of photo capture (at most a badged Future-scope demo).
   - 18: the category names; how a patient-direct holder ("the Booking's billable party") is
     modelled; the scope fields; `SCOPE_NARROWING_DIMENSIONS` and `contractSearch`; `aaCode` and its
     format; holder codes on the fee schedule lines; whether `accRelated` and the route-keyed ACC
     review advisory survived.
   - 19: `scope.rvgGroups`, `scopeCoversProcedure`, the master procedure list, the Procedure's link
     to it, `pickProcedure` and the procedure-first capture picker (`ProcedurePickerSheet`).
   - 19a: the per-procedure default RVG Contracts (their category, holder, hospital scope and how
     they link to their procedure), the base-unit resolver reading the Contract (its name and
     inputs), the Contract base-unit override, and that every existing Contract now carries its
     master procedures in `scope.procedureTypeIds` (derived from its schedule lines' RVG mapping).
     If the procedure scope is missing, stop and record it: this phase's procedure filter needs it
     and does not build it.

   The work items below say what to do in each case.
5. Record the result (including "no drift") in the PROGRESS entry.

## Reference

- **Design** (convention 17): `docs/design/Design Language.dc.html` (tokens; neutral pills for
  Contract and category chips; teal is the only action colour, so the picker's selected tick and
  "Change" links are teal, never crimson); `docs/design/Mobile App.dc.html` (Booking detail anatomy:
  white cards with micro-cap headings, 14px radius, bottom-sheet rows for choices, the code picker
  sheet's search field); `docs/design/Admin Review.dc.html` (review table; its mock ROUTE column is
  anaesthetic technique and its CONTRACT column shows who pays, which is the layout this phase moves
  to); `docs/design/Admin Day.dc.html` (drawer and Booking-detail chrome). No mockup covers the
  Contract picker: extend the mobile bottom-sheet list pattern with the code picker's search field,
  rendered as a Dialog on web and admin.
- **Catalogue:** the covered files above, plus US-04.1.1, US-04.1.4, US-04.2.1, US-04.2.11,
  US-04.4.2, FT-04.4, US-05.1.6, US-07.2.2, US-11.2.2, US-11.4.2, US-15.0.1, OQ-55, OQ-66, OQ-67,
  OQ-73, OQ-78, the notes `catalogue/notes/2026-10-01-aa-meeting-with-greg.md` (#10, #27, #29, #51),
  `catalogue/notes/2026-10-02-aa-meeting-with-greg.md` (#4, #7, #8, #14, #37, #41) and
  `catalogue/notes/2026-10-02-aa-booking-and-pricing-review-with-greg.md` (#38, #49: Greg revisiting
  the default RVG Contract; one default with a range or a per-kind pair), and
  `domain-model.md` ("Contract", "Selection", "Patient and billable party").
- **Gap analysis:** `GAP-ANALYSIS.md` (Summary, themes 1 and 5, "Structural first" step 3, the DM-10,
  DM-12, DM-37, RV-08 and RV-27 rows); `epics/EP-04.md` and `epics/EP-03.md` for these items;
  `gaps.json` entries (FT-03.4 is Contradicts: the anaesthetist cannot change the Contract at all
  today; US-04.3.4 is Partial: no creation form sets a Contract); `analysis/domain-model-delta.md`
  (DM-07, DM-10, DM-11, DM-12, DM-13, DM-20, DM-31, DM-37, DM-43); `analysis/reverse-check.md`
  (RV-01, RV-08, RV-20, RV-27).
- **Code entry points** (line numbers at `3d3a18c`, before Phases 15b to 19a edit these files;
  locate by name):
  - `src/domain/types.ts` 418 to 486 (`BillingRoute` 418, `PatientPaymentCategory` 425,
    `PrepaymentDetail` 435, `Procedure` 453 with `insurerId` 469, `prepaymentDetail` 479 and
    `accRelated` 486), 373 (`Booking`), `List` (`hospitalId` optional), 216 (`Contract`),
    `AuditEntry` (who, role, before, after, atISO).
  - `src/domain/billing/invoiceBuild.ts`: `defaultContractFor` 86 (private, the expiry fallback),
    `resolveContractForProcedure` 114 (the `noBillingRoute` code 66 and its branch),
    `counterpartyForProcedure` 192, `buildPrePaymentInvoiceForBooking` 456;
    `validateBookingForBilling.ts` (`billingReferenceMissing` 49, the insurer-route direct-claims
    check around 166 to 181, category 188, prepayment 204 to 215); `contracts.ts`
    (`selectContract`); `fixtures.ts`.
  - `src/store/bookingActions.ts` (`createBooking` 78, `addPostOpAddendum` 290, `addProcedure`
    422; `copyBooking` 196 is 15b's to delete); `lifecycle.ts` (`editRefusal` 48, `editBooking`
    402, `editProcedure` 438, `editList` 491, `reassignBooking` 635); `integrationActions.ts` (S12
    `createBooking` 150 with `billingRoute: 'hospital'` 158, `ingestPdfRow` 434, its `createBooking`
    467 with the same stamp 475); `prepaymentActions.ts`; `selectors.ts`
    (`bookingRequiresPrepayment` 307, receivable rows' ACC flag, `billingContextForBooking` 836);
    15a's `warningSamples.ts` (`WARNING_SAMPLES`, if session 2 built it) and
    `domain/warnings/rules/prepaymentUnpaid.ts`; `mastersActions.ts` (`setInsurerDirectClaims` 102,
    feeds item 3's direct-claims rule); `contractActions.ts` (the delete guard on
    `governingContractId` 158, unchanged); `billingLineActions.ts` (reads the stored Contract,
    unchanged).
  - Phase 18 retypes the Contract (`holder` union with kinds `hospital`, `surgeon`, `surgeonGroup`,
    `insurer`, `bookingBillableParty`; `category`; `scope` arrays; `pricingBasis`; `aaCode`; fee
    schedule lines with `holderCode`) and adds `holderCounterparty`, `holderMatches`, `isRetired`,
    `contractSearch` and `SCOPE_NARROWING_DIMENSIONS` in `domain/billing/contracts.ts` (and
    `types.ts`). The July `holderType`/`holderId` fields in the analysis files no longer exist.
    Phase 19 adds the master procedure list (`ProcedureType`, `Procedure.procedureTypeId`),
    `scope.rvgGroups`, `scopeCoversProcedure(scope, procedure, masters)`, the `pickProcedure` store
    action and the procedure-first capture picker (`ProcedurePickerSheet`). Phase 19a adds the
    per-procedure default RVG Contracts, the base-unit override on a Contract, the resolver reading
    the Contract, and `scope.procedureTypeIds` on every existing Contract.
  - `src/shared/flows/EditProcedureSheet.tsx`, `EditBillingSetupSheet.tsx`, `ManualBookingForm.tsx`
    (route state 67, the prefill 92), `PhotoCaptureFlow.tsx` and `sampleExtractions.ts` (samples A
    31 and B 45, if 15b kept photo capture as a badged demo); `src/shared/booking/OfficeBillingSetup.tsx`
    (category map 20, `billingReferenceMissing` 47, the Category row 70), `BookingDetailBody.tsx`;
    `src/shared/capture/BtmCaptureBlock.tsx` (`ROUTE_LABEL` 17, `CONTEXT_FIELDS` 24, the
    `procedure-contract` line 189), `feeContext.ts`; `src/shared/format.ts` (`ROUTE_LABELS` 37,
    `routeLabel` 43); `src/shared/audit/` (`fieldLabels.ts`, `actionLabels.ts`).
  - `src/apps/admin/reviewFlags.ts` (reference flag, ACC advisory 83), `screens/ReviewScreen.tsx`
    (route set 78, the "Route" header 244), `screens/BillingMonitorScreen.tsx` (`resolveAndRetry`
    failure codes, unchanged), `screens/InvoiceDocument.tsx` (`PaymentCategoryNote` 149 and 496),
    `flows/PhoneAdviceBooking.tsx` (S2 prefill 33 and 34: route and `I-NIB`);
    `src/apps/mobile/screens/ListDetailScreen.tsx`, `BalancesScreen.tsx`;
    `src/apps/web/screens/ListDetailView.tsx`, `AccountsScreen.tsx`.
  - Seed: `src/domain/seed/bookings.ts` (`ProcedureSpec` 248, `morrisonSpecs` 441, the two-funder
    Prentice `funderOverride` 634, the Doyle bariatric case 685, the filler route draw 1154; locate
    the Marsh nib insurer route, Aria, the Webb AIA reimbursement, Riley's split $800 and Nair's full
    pre-payment by text), `contracts.ts`, `cast.ts` 122 (nib direct claims, AIA not), `history.ts`,
    `audit.ts`, `billing.ts`, `index.ts` (scenario marker `insuredReimbursementBooking` 657).
  - Tests that name routes today: `reviewFlags.test`, `invoiceBuild.test`, `prePaymentInvoice.test`,
    `validateBookingForBilling.test`, `seed.test`, `billingRun.test` (222), `captureActions.test`,
    `bookingActions.test`, `postOpAddendum.test`, `btmCapture.test`, `prepayment.test`,
    `mastersActions.test`, `auditNarrative.test`, `demoScenarios.test`, `integrationActions.test`.
  - Shots: `visual/mobile-interactions.spec.ts` (clicks "Billing route"),
    `admin-phase06.spec.ts` (office billing setup), `admin-phase07.spec.ts` (review table).
    Catalogue capture recipes: `requirements-board/capture/recipes/US-03.1.2.json`, `US-03.2.3`,
    `US-03.4.1`, `US-04.3.1` to `US-04.3.5`.

## Work items

**Session 1: model, engine, store, seed.**

1. **Pin the figures first.** Before changing any code, extend the parity harness Phases 18, 19 and
   19a left (`domain/billing/__parity__/` and `feeParity.test.ts`, or whatever their PROGRESS
   entries name; 18's fixture already records per-Booking totals by counterparty, and 19a's pins the
   base units its resolver reads). Add `src/store/contractParity.test.ts` only for what that harness
   does not already pin, with two fixtures generated from the current build:
   - the counterparty (`kind:id`) of every seeded non-cancelled Procedure, as computed by today's
     `resolveContractForProcedure` + `counterpartyForProcedure`;
   - the invoice totals and counterparties the billing run produces for the scripted Lists: Souter
     Mon 20 AM and PM (S3: Holt, Prentice nib + St George's), Whitaker Fri 17 (S5), Ropata Thu 16
     (S4 Beat 3: COS failure isolated, sibling billed), Fitzgerald rate x time, the Doyle bariatric
     case, and the pre-payment builds (Riley $800 deposit, Nair full pre-payment netting its balance
     to $0).

   Write the expected values into the test as literals (do not commit; the owner does). They must
   pass unchanged at the end of the phase, with no exception: the seeded Morrison change in item 7
   reuses a Procedure already on the ACC Contract, so no figure moves. Only the harness's
   context-building code may change; never update a fixture with `-u`.
2. **Types** (`domain/types.ts`):
   - Delete `BillingRoute`, `PatientPaymentCategory`, `Procedure.billingRoute`,
     `Procedure.insurerId`, `Procedure.patientPaymentCategory` and `Procedure.prepaymentDetail`.
     Nothing replaces `insurerId`: no `insurerId` or `fundingSource` goes onto the Booking or the
     Patient (D2). Leave `accRelated` as Phase 18 left it; it is not this phase's business.
   - `Booking` gains `prepayment?: PrepaymentDetail`, commented "INTERIM office-set flag, replaced
     by Phase 27's derivation". Keep today's `PrepaymentDetail` shape (full, or split with a
     deposit) only so the seeded Riley deposit keeps its figures; Phase 27 removes the split. Move
     the `PrepaymentDetail` comment accordingly.
   - Procedure keeps `governingContractId`. It stays optional in the type only so that a legacy or
     moved Procedure fails validation as data; every creation path sets it. Procedure gains
     `contractSetBy?: 'default' | 'office' | 'anaesthetist'`, which only tells a re-default which
     Procedures to move. Who changed it, when, and from what is **not** stored: it comes from the
     audit trail (DM-37). `billablePartyId` stays on the Procedure as the guardian override, INTERIM
     until 21 removes it (OQ-67: no per-Booking override).
   - **Contract procedure scope** is 19a's (`scope.procedureTypeIds` on every Contract, empty = every
     procedure). This phase reads it and adds nothing to the Contract type.
3. **Pure Contract selection** (`domain/billing/contractSelection.ts`, exported from the billing
   index, with `contractSelection.test.ts`):
   - `ContractSelectionContext`: `hospitalId?` (the List's), `procedure` (its `procedureTypeId`,
     19's master link, and `rvgBaseCode`), `anaesthetistId`, `dateISO` (the List date). No insurer,
     funding source or surgeon: neither the Booking nor the Patient holds the first two (OQ-55), and
     surgeon narrowing is not settled (US-04.3.2). 18's `SCOPE_NARROWING_DIMENSIONS` lists surgeons;
     remove `surgeons` from it here, with a comment citing US-04.3.2, so the constant and the picker
     agree (log it).
   - `defaultContractForBooking(contracts, ctx)` (new name: `invoiceBuild.ts` already has a private
     `defaultContractFor` for the expiry fallback, which stays): the RVG Default Hospital Contract
     (18's category `rvgDefaultHospital`) for `hospitalId`, in effect on `dateISO` (US-04.3.3). The
     catalogue says the hospital is always known; the prototype still has Lists with no hospital, so
     for those use the procedure's first default RVG Contract (19a), else 18's `CT-RVG-POSTPAID`, and
     log the reading.
     This is what every creation path stores.
   - `contractOptionsFor({ contracts, feeScheduleLines, insurers, masters, holderNameOf }, ctx, query?)`
     returns `{ defaults, others, total }`. The filter runs in the catalogue's order (US-04.3.2 AC):
     **procedure first, then hospital**, then the remaining scope. A Contract is offered when:
     - it is in effect on `dateISO` and not retired (18's `isRetired`);
     - **procedure, code and group:** 19's `scopeCoversProcedure(scope, procedure, masters)` is true,
       over the procedure scope 19a filled (all three arrays empty, or the Procedure's master entry
       listed, or its RVG code listed, or its code in a listed group). A Procedure with no master
       entry and no code sees only Contracts with all three empty. A Contract set against several
       procedures is offered for each (this is how 23's combination Contracts appear, US-04.2.11).
       Do not write a second procedure or code matcher;
     - **hospital:** its hospital scope is empty or lists the List's hospital; on a List with no
       hospital, only hospital-unscoped Contracts;
     - **anaesthetist:** its anaesthetist scope is empty or lists the List's anaesthetist (US-04.2.1);
     - an insurer-held Contract is not offered while its insurer does not accept direct claims
       (`Insurer.acceptsDirectClaims`). This replaces the validator's retired insurer-route check
       (6th review #2), so a non-direct-claim insurer is never invoiced.

     The scope's insurer, funding-source and surgeon arrays are kept on the Contract (they describe
     it; US-04.2.1 keeps them as scope filters) but do not narrow the picker.
   - **The defaults, always offered** (US-04.3.2 AC "the default RVG Contract always offered"):
     `defaults` holds, in this order, the List hospital's RVG Default Hospital Contract (the stored
     default, US-04.3.3) and the picked procedure's default RVG Contract or Contracts (19a, one or
     two, US-04.4.2). They are listed first and stay in the result even when a query is typed or
     matches nothing. The catalogue has not settled which of the two the picker must offer (US-04.4.2
     note, OQ-78), so offering both is the reading: log it. Read the procedure's defaults through
     19a's `defaultRvgContractsFor(procedureTypeId, contracts)` (by `kindOrder`); a per-kind pair
     lists both, each with its kind label ("Simple", "Complex"), and picking one is how 19a's
     `defaultRvgContractForProcedure` step 1 ("the Procedure's own Contract") gets its kind. On a
     Procedure with no master entry, `defaults` holds the hospital default and then 18's
     organisation-wide `CT-RVG-POSTPAID` (19a keeps it as the fallback for an unlinked Procedure).
     `others` never repeats a default, and `CT-RVG-POSTPAID` is never in `others`. Order the others
     by category, then name.
   - **Search** (US-04.3.2 ACs, OQ-66 answered): reuse 18's `contractSearch` (AA code, name, holder
     name, each line's holder code and description); do not add a second matcher.
     `contractOptionsFor` runs it over the in-scope set only, never across every Contract. A
     Contract whose AA code or a line's holder code equals the trimmed query (case-insensitive)
     sorts first among the others, and each result carries what matched (`"AA code HOS-0004"` or
     `"HNZCATall · Cataract, all"`, using 18's real AA code format, a category prefix and a
     four-digit number) so the UI can show why it matched.
   - `isContractInScope(contract, { insurers, masters }, ctx)` uses the same rule (no query), for
     flags and store guards. Both defaults are in scope by definition.
   - Tests cover: the US-04.3.2 example (a St George's Contract is never offered on a Southern Cross
     List); the filter order (a Contract out of the procedure scope is never offered, whatever its
     hospital); each dimension (procedure: Doyle's bariatric Contract only for its bariatric entries,
     and a three-procedure fixture Contract offered for each of the three; hospital; RVG code and
     group; anaesthetist, Aria only for Souter and Fitzgerald; surgeon scope never narrows); nib's
     insurer Contract offered at any hospital with no patient input; the direct-claims exclusion
     (toggle nib off with `setInsurerDirectClaims`: its Contract drops out); effective dates and
     retired; the no-master-entry rule; the no-hospital default; both defaults present under a query
     and under a miss; AA-code search (typing a Contract's `aaCode` returns it first, with its match
     label); holder-code search on a Christchurch Eye Surgery context (`HNZCATall` filters to the
     CES HNZ schedule with its matched line, a miss returns only the defaults, and the same code on a
     Southern Cross List finds nothing because search stays in scope); deterministic order. Add a
     seed assertion: every hospital-held Contract lists its holder in its hospitals scope. Phase 18's
     plan already sets `hospitalIds` on the five defaults, SXAP, Health NZ, St George's ACC and the
     CES HNZ schedule, so this should pass as seeded; if 18's PROGRESS entry says otherwise, add the
     missing ones in the seed (procedure scope stays as 19a set it).
4. **Validator** (`validateBookingForBilling.ts` + test; US-04.3.1):
   - Remove the route, insurer-route and payment-category checks.
   - Add `governingContractId` failures: missing ("Choose a Contract for this procedure.") and
     dangling ("The selected Contract no longer exists. Choose another.").
   - Keep the check that `billablePartyId` resolves.
   - The pre-payment check moves to the Booking (field `prepayment`, no `procedureId`) and is only
     the split-deposit check that guards the seeded data ("Enter the deposit amount for a split
     pre-payment.").
   - `billingReferenceMissing(procedure, contract)` is re-keyed from the route to the Contract
     holder (18's `holder.kind`): a `hospital`, `surgeon` or `surgeonGroup` holder expects a
     reference; an `insurer` or `bookingBillableParty` holder does not. That reproduces today's
     flags (check against the Morrison missing-reference Procedure). It is interim until Phase 21's
     required inputs, so update both callers (`OfficeBillingSetup.tsx`, `reviewFlags.ts`).
   - The Method 3 gate is unchanged (Phase 24 replaces the hourly line).
5. **Engine** (`invoiceBuild.ts` + tests):
   - `resolveContractForProcedure` loses the "nothing stored, resolve by route" branch. Nothing
     stored is now the exception `noContract` ("No Contract is selected on this procedure. Choose one
     before rebilling."). Delete the `noBillingRoute` code and any UI copy keyed on it.
   - Keep the stored-Contract branch exactly as it is, including `contractMissing` for a dangling id
     (effective on the List date; an expired hospital- or insurer-held Contract falls back to that
     holder's default; a surgeon, surgeon-group or Booking-billable-party holder is
     `contractIneffective`). S4 Beat 3's billing-failure trigger (COS, a surgeon-group holder)
     depends on it, and so does `BillingMonitorScreen`'s `resolveAndRetry` (unchanged). RV-01's lock
     is Phase 25.
   - 19a made `selectContract`, `resolveContractForProcedure` and `defaultContractFor` skip
     `isDefaultRvgContract` Contracts so the route path could not pick them. A stored pick is now
     the only path, so the stored branch must honour a stored default RVG Contract (keep the skip
     only inside the private expiry fallback `defaultContractFor`). Test it.
   - `counterpartyForProcedure(procedure, contract, patientId)` becomes holder-as-payer, commented
     INTERIM until Phase 21, by dropping the route switch around 18's `holderCounterparty`: a
     `bookingBillableParty` holder (`CT-RVG-POSTPAID`, Aria, and 19a's per-procedure default RVG
     Contracts, which 19a gave that holder) bills `billablePartyId`, else the patient; any other
     holder bills itself (hospital, insurer, surgeon, or the surgeon group's billing organisation, so
     COS stays `{ kind: 'organisation', id: ORG.cos }`). `funderOverride` lines behave as today.
   - `buildPrePaymentInvoiceForBooking` reads the Booking's `prepayment` and covers the Booking's
     Procedures whose Contract bills a person (the patient or the guardian override; OQ-73):
     - A split raises one deposit line on the first covered Procedure (keeps `prePaidByProcedure`
       keyed as today).
     - A full pre-payment raises each covered Procedure's estimated fee via `feeFor` with that
       Procedure's own Contract and 19a's base units (a default RVG Contract, category RVG Default
       Post-paid, prices exactly as "no contract" did).
6. **Store actions** (tests in `bookingActions.test`, new `contractSelectionActions.test`,
   `prepayment.test`):
   - **`setProcedureContract(api, actor, procedureId, contractId)`** (new; `store/bookingActions.ts`
     or a new `contractSelectionActions.ts`):
     - Checks the rights matrix via `editRefusal` (anaesthetist: own DRAFT only; office: DRAFT and
       SUBMITTED; AUTHORISED refused).
     - Refuses `notFound`, `contractNotInEffect` and `contractOutOfScope` ("That Contract does not
       apply to this procedure at this hospital.").
     - Sets `contractSetBy` from the actor's role and writes an audited `procedure.contract` entry
       with `before`/`after` Contract ids. The audit entry's role is what flags the change (the
       selector below); nothing else is stored.
     - **Base units follow the Contract** (D12, US-04.4.2): in the same commit, re-run 19a's
       base-unit resolver for the new Contract. A value the anaesthetist typed (19's captured
       override, any value accepted, D3) is kept; a seeded value follows the new Contract, so a
       Contract with a base-unit override for this procedure, code or group changes it and any other
       Contract leaves it as the procedure's default RVG Contract gave it. The audit entry carries the
       base-unit before and after when they differ.
     - Remove `governingContractId`, `contractSetBy` and every deleted field from `ProcedurePatch`,
       so `editProcedure` cannot bypass it.
   - **Default at creation (US-04.3.3, US-04.3.4):**
     - `createBooking` drops `billingRoute`, `insurerId` and `patientPaymentCategory`.
     - It gains optional `contractId` (an explicit pick from the creation form, checked like
       `setProcedureContract`, with `contractSetBy: 'office'` or `'anaesthetist'`) and
       `billablePartyId` (interim).
     - With no pick, it stores `defaultContractForBooking` for the List with
       `contractSetBy: 'default'`, and seeds base units through 19a's resolver.
     - This covers the manual, phone-advice, HL7/FHIR S12 (`integrationActions.ts`) and PDF
       (`ingestPdfRow`) paths, and the photo path if 15b kept it as a badged demo. **RV-27:** the S12
       and PDF creates drop their `billingRoute: 'hospital'` stamp and pass no Contract, so they land
       on the List hospital's default by the same rule as every other path. A hospital message never
       names a Contract (hospital data setting the Contract is US-04.3.6, Future); log the reading.
     - Copy a Booking is gone (15b). If `copyBooking` survived, stop and record it rather than give
       it a Contract rule.
     - `addPostOpAddendum` copies the original Procedure's Contract and not the Booking's
       pre-payment flag (until 38b replaces the addendum with an additional invoice).
   - **`addProcedure` (US-03.2.3):** the new Procedure starts on the first Procedure's Contract when
     that Contract is in scope for it, else on the default, with `contractSetBy: 'default'`, and can
     then select its own. Inheriting stops a guardian-paid Booking's second Procedure silently
     billing the hospital; log the reading.
   - **Hospital or procedure change:**
     - `editList` with `hospitalId` re-defaults every Procedure with `contractSetBy: 'default'` on
       the List's non-cancelled Bookings, in the same commit, one `procedure.contractDefault` audit
       meta each. `reassignBooking` onto a List with a different hospital does the same.
     - 19's `pickProcedure`, and `editProcedure` when it changes `rvgBaseCode`, do the same for that
       one Procedure, in the same commit, with the base units re-seeded as above.
     - Explicit picks are kept, and item 13's caption shows any that no longer apply.
   - **Prepayment flag:** add `setBookingPrepayment(api, actor, bookingId, on: boolean)` in
     `prepaymentActions.ts`.
     - Office only; refused on AUTHORISED or billed Lists.
     - On sets `{ type: 'full' }` (all or nothing, US-06.2.2); off clears it. There is no deposit
       input.
     - Refused when no Procedure's Contract bills a person paying for the patient (OQ-73, D23:
       never an organisation; under the interim, a `bookingBillableParty` holder), code
       `noPersonBilled`, "Pre-payment applies only when a person pays for the patient."
     - Changing or clearing is refused once a pre-payment invoice exists (`prepaymentInvoiced`).
     - Audited `booking.prepayment`.

     Also:
     - `bookingRequiresPrepayment` reads the Booking's `prepayment`, and so does 15a's
       unpaid-prepayment warning rule (repoint its input; its wording and strength do not change).
     - `raisePreProcedureInvoice` refusal copy reads "This booking is not flagged for pre-payment."
     - If 15a's session 2 built `WARNING_SAMPLES`, re-point its prepayment entry
       (`warningSamples.ts`), which stages the condition through the route and payment-category
       fields deleted here: `stage` sets the primary Procedure to its procedure's default RVG
       Contract (else `CT-RVG-POSTPAID`) with `setProcedureContract` and then calls `setBookingPrepayment(on)`, both as the demo trigger
       actor; `unstage` restores the Booking's `prepayment` and the Procedure's Contract fields from
       the pristine seed, as 15a's unstage already does. Phase 27 re-points it at the prepaid set.
       Update its test.
     - 15a deleted the completion gate, `overridePrepaymentGate` and `PrepaymentOverrideSheet` (D5).
       Do not re-introduce a gate. If any of them survived, stop and record it rather than build
       on it.
   - **Selectors:**
     - `contractOptionsForProcedure(state, procedureId, query?)` and
       `payerForProcedure(state, procedureId)` wrap the pure functions for the UI.
       `contractOptionsForNewBooking(state, listId, procedurePick, query?)` does the same for the
       creation forms, before a Procedure exists.
     - `anaesthetistContractChange(entries, procedureId)` (pure, in `contractSelection.ts`) reads the
       audit trail: when the latest `procedure.contract` entry for that Procedure has the
       anaesthetist role, it returns `{ who, atISO, fromContractId, toContractId }`, else nothing.
       An office pick after it clears it (interim until Phase 21's explicit approval). The store's
       `pendingContractChange(state, procedureId)` wraps it.
7. **Seed** (`seed/bookings.ts`, `history.ts`, `audit.ts`, `contracts.ts`, `index.ts`):
   - `ProcedureSpec` loses the route, insurer and category fields, and `addBooking` (or 15's name)
     takes `prepayment`. If Phase 18 seeded no RVG Default Post-paid Contract, add one: protected
     default, patient-direct holder, RVG units at the anaesthetist's rate, organisational scope,
     effective 2020-01-01.
   - Map every seeded Procedure. "Default RVG" below means the Procedure's own procedure's default
     RVG Contract (19a, category RVG Default Post-paid, holder `bookingBillableParty`), else
     `CT-RVG-POSTPAID` for a Procedure with no master entry (19a keeps it as that fallback). Both
     bill the Procedure's guardian override, else the patient, and price RVG units at the
     anaesthetist's rate with the same base units, so item 1's figures hold either way; log the
     reading.

     | Today | After this phase |
     |---|---|
     | Hospital route with a stored Contract | Same Contract. Any informational insurer is dropped |
     | Insurer route, nib (Marsh, filler) | nib's insurer Contract |
     | Billable-party route, self-funded, no Contract | Default RVG; guardian override stays on the Procedure (interim) |
     | Billable-party route, insured reimbursement (Webb, AIA) | Default RVG; AIA stays only in the description |
     | Billable-party route, pre-payment (Riley split $800, Nair's rhinoplasty full) | Default RVG; Booking `prepayment` {split, 800} and {full}; Nair's septoplasty stays on Forte's default |
     | Billable-party route under the Aria hourly Contract | Same Contract |
     | `history.ts` patient-route history | Default RVG; the rest keep their hospital default |

   - The filler generator keeps the same `rng()` draw order and count (the route draw becomes the
     Contract draw), so no other generated data shifts.
   - Seeded specific Contracts get `contractSetBy: 'office'`; defaults get `'default'`.
   - Procedure scope is 19a's (derived from each Contract's schedule lines). Check that Doyle's
     bariatric Contract covers the bariatric master entries and Aria's its laser entry; change a
     scope only where item 3's check below demands it.
   - Run item 3's scope check over every seeded Procedure, and resolve each out-of-scope pick: the
     Doyle bariatric Booking (Mills, Fitzgerald Tue 14 Southern Cross / Mr Doyle) needs its
     Procedures linked to those master entries; check the three SXAP picks (Ellison is on Souter
     Tue 21 PM), Aria's anaesthetist scope, and each ACC and Health NZ pick against its List's
     hospital. Prefer correcting the seed's hospital scope or the master link in a way that leaves
     item 1's figures and 19a's base units unchanged, and log each call.
   - Seed one anaesthetist change for the review demo, with no figure change: on Dr Morrison's
     submitted Mon 20 St George's List, the Procedure already on St George's ACC (the 10:00
     "Ureteroscopy with lithotripsy, ACC claim", ref ACC45-118203, `morrisonSpecs`) gets
     `contractSetBy: 'anaesthetist'` and a `procedure.contract` audit row by Dr Kate Morrison
     (anaesthetist role) from St George's default to St George's ACC, timed before the List's
     13:10 submit. Its Contract, base units, fee and payer are unchanged, so item 1's fixtures hold.
   - Regenerate `audit.ts` histories so `procedure.create` and `procedure.update` entries carry
     Contract fields, not routes.
   - Rename the scenario marker `insuredReimbursementBooking` (`index.ts`, `billingRun.test`) to
     `aiaClaimBooking`.
   - Bump `PERSIST_VERSION` by one from its post-19a value, with a comment line.
8. **Remove the retired vocabulary (RV-08):**
   - `ROUTE_LABELS` and `routeLabel` (`format.ts`); the route and category maps in
     `BtmCaptureBlock`, `OfficeBillingSetup`, `EditProcedureSheet`, `EditBillingSetupSheet`,
     `ManualBookingForm` and `InvoiceDocument`; the insurer selects and their " (direct claims)"
     suffix in `EditProcedureSheet`, `EditBillingSetupSheet` and `ManualBookingForm`.
   - The ACC-on-billable-party review advisory (`reviewFlags.ts`), if 18 left it: it is keyed on
     the route and goes with it.
   - In `shared/audit/`, add labels: fields `governingContractId` "Contract", `contractSetBy`
     "Contract set by", `prepayment` "Pre-payment"; actions `procedure.contract` "Contract changed",
     `procedure.contractDefault` "Contract set to the default", `booking.prepayment` "Pre-payment flag
     set". Drop labels for the removed fields.
   - Gates:
     `grep -rnE "billingRoute|BillingRoute|patientPaymentCategory|PatientPaymentCategory|ROUTE_LABELS?|routeLabel|noBillingRoute|insuredReimbursement|selfFundedPrepayment|selfFundedPostProcedure" aa-prototype/src`
     returns nothing, and every remaining `insurerId` hit in `aa-prototype/src` is the Insurer
     master, a Contract holder or scope, or a `funderOverride`.
9. **Session 1 exit:** fix all the listed tests (`fixtures.ts` too, and 15a's warning-sample test
   if it exists). Edit the UI only as far as compiling needs: route, insurer and category controls
   removed, and the Contract shown read-only where the route chip was. Run `npm run build`,
   `npm run build:pwa` and `npx vitest run`, all green; item 1 passes. Write a short "session 1
   done" note in the PROGRESS entry.

**Session 2: UI, creation forms, review, copy.**

10. **Shared `ContractPickerSheet`** (`src/shared/flows/`, through `useSurface().Overlay`, so a
    bottom sheet on mobile and a Dialog on web and admin; `data-shot="contract-picker"`):
    - A search field at the top, "Search by name, AA code or holder code", feeding
      `contractOptionsForProcedure`'s (or `contractOptionsForNewBooking`'s) query.
    - Sections "Default" (the hospital's default, labelled "Default for <hospital>" or "Default for
      AA rooms", then the procedure's standard RVG Contract or Contracts, a per-kind pair showing each
      kind label, or `CT-RVG-POSTPAID` on a Procedure with no master entry), then "For <procedure> at
      <hospital>". The second heading reads "Other Contracts at <hospital>" while the Procedure has
      no master entry. The Default section stays visible under any query.
    - Rows by viewer:
      - **anaesthetist** (US-15.0.1): the Contract name and its AA code, nothing else;
      - **office**: also a neutral category pill, the pricing basis in words ("RVG units at your
        rate", "Agreed rate $26.50 per unit", "Fixed price list", "Hourly rate") and "Bills
        <holder>".
      - A code match adds what matched as a mist caption ("AA code <code>", or "HNZCATall · Cataract,
        all") for both viewers.
    - Render at most 50 rows, with "Showing 50 of <n>. Type to narrow." below.
    - **The one provisional label (OQ-78):** on the office view only, a mist caption under the
      Default section: "Provisional · whether every hospital and procedure keeps a default Contract
      is still to confirm with AA (OQ-78)". Nowhere else. OQ-66 is answered, so the filter and search
      carry no provisional label.
    - The selected row carries a teal tick. Tapping a row calls `setProcedureContract` (or sets the
      creation form's pick) and shows any refusal verbatim. Empty states: "No other Contracts for
      this procedure at <hospital>." and "No Contract matches "<query>"." (the defaults stay
      above it). There is no "None".
11. **Anaesthetist edit (US-03.4.1, FT-03.4)**, in `EditProcedureSheet` (mobile and web, DRAFT
    only):
    - The fields are 19's procedure pick, a Contract row (plain name, teal "Change" opening the
      picker), and Billing reference (interim, optional).
    - Caption: "The office checks Contract changes when you submit the list."
    - The route segmented control, insurer select and payment category are gone.
    - A Contract change that moves the base units shows the new value in the units card as usual;
      no pricing detail is added to the anaesthetist's sheet.
12. **Showing the Contract (US-03.1.2, US-04.3.3):**
    - In `BtmCaptureBlock` the route chip becomes a neutral Contract chip (for example "St George's
      RVG Default Hospital", 18's name).
      - On anaesthetist views (mobile and web) the line is that chip with the Contract's AA code, a
        teal "Change" on a DRAFT List and the billing reference. No route, insurer, payer or pricing basis (US-15.0.1).
      - On the office's view the line reads chip · AA code · pricing basis · "Billed to <payer>"
        (interim, holder derived) · reference.
    - A pending anaesthetist change (item 6's selector) adds a small warning-tint pill "Changed by
      you · office to check" on anaesthetist views, and "Changed by anaesthetist" on the office's.
    - `CONTEXT_FIELDS` swaps the route and insurer fields for `governingContractId`.
    - List rows on mobile `ListDetailScreen` and web `ListDetailView` add the primary Procedure's
      Contract name as a one-line mist caption, so the Contract is visible before the session.
13. **Booking Contract checks and pre-payment** (`BookingDetailBody`):
    - When a Procedure's stored Contract no longer applies (after a hospital or procedure change, or
      the insurer's direct claims turned off), it shows "This Contract no longer applies to this
      procedure." with a teal "Choose Contract" link, on every editor's view.
    - The office sees a "Pre-payment" row ("Not required", "Full estimate" or, for the seeded Riley
      Booking only, "Deposit $800 · seeded") with "Set pre-payment", which opens a new
      `PrepaymentFlagSheet` (`src/shared/flows/`): one switch, "Pre-payment required", and the line
      "The full estimate is invoiced before the procedure." It calls `setBookingPrepayment`. On a
      Booking billed only to organisations the switch is disabled with the refusal line beneath it.
      The anaesthetist keeps 15a's warning triangle and the warning shown on opening the Booking.
14. **Office billing setup** (`OfficeBillingSetup`, `EditBillingSetupSheet`; US-04.3.2 office side):
    - The rows become Contract (name, AA code, category), Payer (holder derived, or the guardian on
      a patient-direct Contract), Reference, Override and Funders. The Route, Category and Insurer
      rows are gone.
    - The sheet becomes "Contract and payer": a Contract row opening the picker, the guardian select
      with "New guardian" shown only on a patient-direct Contract (interim until 21), and the billing
      reference.
    - Save calls `setProcedureContract` when the Contract changed, then `editProcedure` for the rest.
    - The section's button keeps its name "Edit billing setup" (six capture recipes and the visual
      specs click it); only the sheet's title becomes "Contract and payer".
15. **Creation forms: the Contract at booking setup (US-04.3.4):**
    - `ManualBookingForm`'s "Billing route" block becomes a "Contract" row after 19's procedure pick,
      preselected with the List hospital's default and changeable through the picker (the List's
      hospital and anaesthetist plus the picked procedure feed `contractOptionsForNewBooking`). No
      insurer or funding field. Submit passes the pick to `createBooking` as `contractId` only when
      it differs from the default.
    - `PhoneAdviceBooking` (office, S2) gets the same Contract row after its procedure field. Its S2
      prefill drops `billingRoute` and `insurerId`, so the booking lands on St George's default
      exactly as S2 shows today, with the Contract visible on the form before saving.
    - The payer select shows only for a patient-direct Contract (office; interim until 21).
    - If 15b kept photo capture as a badged demo, `sampleExtractions` sample B prefills nib's
      insurer Contract instead of insurer nib and sample A drops its route; if 15b removed it, there
      is nothing to change.
    - The anaesthetist's add-a-booking path (mobile and web) gets the same Contract row with the
      anaesthetist's row rules (name and AA code only).
16. **Admin review (DM-37):**
    - `ReviewScreen`'s Route column becomes "Payer" (holder derived; "Mixed" when Procedures differ).
    - The Contract column shows the primary Procedure's Contract, "+N" for more, and a marker when
      the anaesthetist changed one.
    - `reviewFlags.ts` stays pure. Its inputs gain the Contract, its in-scope result and the pending
      change (from item 6's selector, with from and to names). It adds two warn flags, "Contract
      changed by anaesthetist · <from> to <to>" and "Contract does not apply to this procedure", and
      re-keys "No billing reference".
    - Update the tests. Approving the change is Phase 21.
17. **Invoice wording:** `InvoiceDocument`'s `PaymentCategoryNote` becomes a note chosen by one small
    pure helper, `patientInvoiceNote(booking, invoiceKind)`: the Booking's pre-payment flag gives
    today's pre-payment wording (full or the seeded deposit); otherwise "Payment is due on receipt of
    this invoice." The insured-reimbursement wording has no trigger once the category and insurer
    go, so it is retired until Phase 21's Contract-holder flag for US-11.4.2 brings it back; the AIA
    Booking reads the standard wording meanwhile. Phase 22 rebuilds the layout.
18. **Shots and demo surfaces:**
    - Update `visual/mobile-interactions.spec.ts`, `admin-phase06.spec.ts` and
      `admin-phase07.spec.ts`, keeping `data-shot="procedure-contract"`; add shots of the picker
      with an AA code and a holder code typed, and of the phone-advice form's Contract row.
    - Edit the Control Panel's existing S1 scenario text (add nothing new to that page) and the
      description of Phase 14's re-homed "Fire hospital message" entry.
    - The catalogue screenshots, including re-capturing the recipes this phase breaks, are the
      standing "Catalogue screenshots" step below: run it after the review pass and list the
      recipes it re-pointed in PROGRESS.

## Demo triggers

No new harness-bar button. Everything in this phase demos through normal use: the picker, the
creation forms, the edit sheets and the review screen. This phase adds no warning rule, so 15a's
"Raise sample warnings" needs no new sample, but its existing prepayment sample (if 15a built it) is
re-pointed at the Booking flag (item 6) and must still stage and clear on Admin Day and Booking
detail.

- **Re-homed "Fire hospital message" (S1)**, Phase 14's `fire-hospital-message` entry (Integrations
  sim, Admin · Integrations and Mobile · Lists; bar and PWA, so S1 fires it on a handset too): the new
  Booking for Sarah Mitchell now arrives on St George's default Contract by the general default rule,
  not a feed stamp (RV-27), visible on mobile, web and admin. Update the entry's description text
  only.
- **"Trigger billing failure" (S4 Beat 3)** keeps working unchanged: the COS Contract is still the
  stored pick and still dates out to `contractIneffective`. Check it after item 7.
- **PWA:** no new entry. The anaesthetist's Contract change needs no office step to demo on a
  handset. The office-approval stand-in "Office approves this Contract change" is Phase 21's. Check
  that any Phase 14 or 15a PWA entry touching pre-payment still works against the Booking flag.

## Out of scope

- The billable party defined by the Contract with the payer's name and email captured on a default
  or patient-direct pick, removing the guardian override, invoice grouping by billable party, the
  child billable-party warning, required inputs (member number, claim reference, purchase order),
  the not-on-schedule flag (US-04.3.7), the office's explicit approval of every Contract at review
  (US-07.2.2) with its PWA stand-in, and the Contract-holder flag that brings back US-11.4.2's
  "claim from your insurer" wording. All Phase 21.
- Insurer or funding source as a picker input, or held on the Booking or the Patient (OQ-55).
- Narrowing the picker by surgeon (raised in passing, not settled).
- The Contract payment setting replacing `funderOverride`, and Contract-driven invoice layout,
  delivery and GST: Phase 22.
- Seeding combination Contracts, the primary Procedure and the multi-procedure rule: Phase 23.
  The Contract base-unit override and the per-procedure default RVG Contracts are 19a's, already
  built.
- The lock at AUTHORISED and removal of the expired-Contract fallback and re-resolution (RV-01):
  Phase 25.
- Prepayment derived from the prepaid set, the estimator, removing deposits, and the setup-time
  invoice held for approval: Phases 26 and 27.
- A matched hospital row creating a Booking on its default (the "matched" half of US-04.3.4): Phase
  33, calling the same default rule.
- Contract master editing, categories and the AA code format (18), the master procedure list and
  procedure-first picker (19), procedure scope and base units in Contracts (19a), and hospital data
  setting the Contract (US-04.3.6, Future).
- The wider sweep of Contract and fee detail from anaesthetist screens (for example "FIXED CONTRACT
  PRICE"): Phase 43a.

## Manual test checklist

The agent runs every item itself in the running app and reports it with evidence; none is handed
to the owner (ROADMAP.md "Owner review: agents test themselves").

- [ ] Reset. Fire MSG-STG-1001 (Phase 14's re-homed trigger), then open Souter Tue 28 Jul
      St George's AM on mobile: Sarah Mitchell's Booking shows "St George's RVG Default Hospital" on
      mobile, web and the Admin Booking; Admin also shows "Billed to St George's".
- [ ] Admin phone advice (S2): the form shows a Contract row preselected to St George's default
      after the procedure; save, and the Booking carries it. Change it on the form before saving: the
      Booking carries the pick, audited as the office.
- [ ] Add a Booking manually on a Southern Cross List: pick the procedure, and the Contract is
      preselected to Southern Cross's default. The picker offers SXAP and nib's Contract but never a
      St George's Contract, and there is no "None". The Default section also lists the procedure's
      standard RVG Contract (19a), and the office sees the one OQ-78 caption under it.
- [ ] On Dr Souter's seeded Wed 22 Jul Christchurch Eye Surgery List, open the picker on a cataract
      (42702) or vitrectomy (42725) Booking and type HNZCAT: the list narrows to "Christchurch Eye Surgery HNZ schedule"
      with "HNZCATall · Cataract, all" shown, and the defaults stay at the top. Type that Contract's
      AA code: it is listed first with "AA code <code>". Type nonsense: "No Contract matches" with
      the defaults still offered. On the Southern Cross List, HNZCAT finds nothing (search stays in
      scope).
- [ ] On Fitzgerald Tue 14 (Southern Cross / Mr Doyle), the bariatric procedure offers Doyle's
      fixed-price Contract; a non-bariatric procedure on the same List does not.
- [ ] Pick a Contract that carries a 19a base-unit override for the Procedure's procedure, code or
      group: the base units follow it; pick the default back: they return. A base-unit value typed by
      the anaesthetist survives a Contract change.
- [ ] As Dr Souter on a DRAFT List, change a Procedure's Contract on mobile and on web: the rows show
      only the name and AA code, the "Changed by you" pill shows, and the audit trail records who,
      when, from and to. No route, insurer, payer or pricing basis appears on the anaesthetist's
      Booking. On a SUBMITTED List the sheet is read-only.
- [ ] Add a second Procedure to a guardian-paid Booking: it starts on the same patient-direct
      Contract and can pick its own.
- [ ] Office: change a DRAFT List's hospital from St George's to Forte. Defaulted Procedures move to
      Forte's default, with one audit row each. An explicitly picked Contract stays and shows "This
      Contract no longer applies to this procedure."
- [ ] Demo: Data Inspector shows every seeded Procedure with a Contract, and no Booking or Patient
      with an insurer or funding source. The "Choose a Contract for this procedure." completion
      refusal is covered by the validator test, because no UI path can clear a Contract any more.
- [ ] Review queue, Dr Morrison Mon 20: the Payer column replaces Route, and the seeded ureteroscopy
      (ACC claim) Procedure shows "Contract changed by anaesthetist · St George's RVG Default
      Hospital to ACC elective services via St George's". Its fee and payer are as before. Re-pick it
      as the office: the flag clears. Reload: the record survives.
- [ ] Admin Master Data: turn nib's direct claims off. nib's Contract drops out of the picker, and
      Marsh's Procedure on it shows the "no longer applies" caption. Turn it back on.
- [ ] Office: set pre-payment on a Booking billed to a hospital: refused ("Pre-payment applies only
      when a person pays for the patient."). On a patient-billed Booking the switch sets "Full
      estimate", and 15a's unpaid-prepayment warning appears in both apps, visible on opening the
      Booking. If 15a built them, Admin Day Tue 21 "Raise sample warnings" still stages the
      prepayment sample and "Clear sample warnings" restores it.
- [ ] S3: authorise Souter Mon 20 AM and PM. Holt, Prentice nib and Prentice St George's invoices
      match item 1's figures to the cent.
- [ ] S4 Beat 1: Riley's Booking shows the office flag ("Deposit $800 · seeded"), 15a's warning shows
      and completion is not blocked, and raising the pre-invoice gives $800 + GST. Nair's full
      pre-payment still nets its balance to $0.
- [ ] S4 Beat 3: Billing monitor, Demo actions, "Trigger billing failure" still fails only the COS
      Booking, its sibling bills, and "Resolve and retry" clears it.
- [ ] Invoice document wording: pre-payment and post-procedure wordings are unchanged; the AIA
      Booking reads the post-procedure wording (logged for Phase 21).
- [ ] No "billing route", "payment category", "Reimbursement" category, "None (default pricing)" or
      "Copy booking" text anywhere in the three apps. No en or em dashes in new copy.
- [ ] The PWA build shows the Contract chip and picker as bottom sheets, search included.
- [ ] Catalogue screenshots: the recipes for the covered items above (US-04.3.1, US-04.3.2,
      US-04.3.3, US-04.3.4, US-03.4.1, US-03.1.2 and US-03.2.3 re-shot, US-04.2.1 given its
      `narrows-picker` state, the rest of the EP-04 table checked) are created or updated, any recipe
      this phase broke is re-pointed, a full `npm run capture` ends with no failed recipe and no
      story without a recipe, the covered items' new shots are checked by eye, and
      `npm run verify:board` is green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots` and `npm run verify:board` are all green.

## Demo guide updates

Patch these in the same session, in `docs/demo-guide/` and the matching sections of
`master-demo-guide.html`. Line numbers are July's; Phases 15, 15a, 15b, 18, 19 and 19a edit the same
files (18 drops the ACC advisory wording, 15a rewrites S4 Beat 1's gate as a warning with no confirm
step, 15b drops the Copy lines), so locate each passage by its text:

- `03-demo-script.md`:
  - **S1 Beat 1 Expected:** add "Sarah's Booking arrives on St George's default Contract, shown on
    mobile, web and Admin".
  - **S2 Beat 2:** the phone booking form shows the Contract row on St George's default before
    saving. Remove any mention of choosing a billing route or an insurer.
  - **S2 Beat 4:** add a "Worth pointing at" line on Dr Morrison's "Contract changed by
    anaesthetist" flag (approval arrives in Phase 21).
  - **S3 Beat 1 Say**: replace "It resolves the explicit payer per Procedure, applies the governing
    Contract, and groups by counterparty" with "It reads the one Contract on each Procedure, bills
    that Contract's holder, and groups by counterparty". The figures are unchanged.
  - **S4 Beat 1 Say** (as 15a left it): "The office flagged this booking for pre-payment" instead of
    "A patient-funded pre-payment", keeping 15a's warning wording.
  - Add one "Worth pointing at" line where the picker is shown: "Pick the procedure, then its
    Contract. The list holds only the Contracts set against that procedure at this hospital, the
    default is always there, and typing an AA code or a holder's own code finds one among
    thousands. The anaesthetist sees only the name."
- `04-presenter-cheat-sheet.md`:
  - Glossary rows "Procedure" ("each selects exactly one Contract") and "ACC route" (ACC is a
    Contract held by a hospital or other holder, not a route).
  - Replace "Three billing routes" (including the direct-insurer and insured-reimbursement bullets)
    with "One Contract per Procedure": set at booking setup on the hospital's default Contract, a
    picker filtered by procedure then hospital with the default always offered and AA-code and
    holder-code search, the Contract says who pays, insurer and funding source held on neither
    Booking nor Patient, anaesthetist change flagged.
  - Update the myths ("Every insured patient is billed to an insurer": the Contract decides).
- `02-workflows-and-handoffs.md` and `01-personas-and-responsibilities.md`: route and insurer
  wording becomes Contract wording; the office's booking-setup step now includes the Contract.
- Control Panel S1 scenario text and the Phase 14 registry entry description (item 18).

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19),
run after the review pass and before the PROGRESS.md entry. Re-run
`node docs/prototype-build/catch-up/tools/recipe-status.mjs 20` first: earlier phases may have
changed these recipes since this plan was written.

**Covered items.** When the phase is done, each recipe in `requirements-board/capture/recipes/`
matches what was built. The tool lists every story under EP-04 and FT-03.4, so the table also holds
the stories whose recipe belongs to Phases 18, 19a, 21, 22, 23, 24 or 25; for those the cell says
what this phase leaves alone. Shots are Admin unless an app is named; the anaesthetist apps get the
Contract row, chip and picker. Seeded Bookings are `BK` ids (`BK0009`, `BK0001`):

| Item | Recipe at plan time | When this phase is done |
|---|---|---|
| [US-04.1.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.1.1.md) Contract categories | partial · admin-contract-types | Phase 18 owns it and expects `captured`. No new screen here: leave the recipe, and let the `--dry` run catch any selector this phase moved |
| [US-04.1.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.1.2.md) Create, edit, retire Contracts | partial · admin-contracts, admin-edit-contract | Phase 18 owns it; versioning is built in Phase 25, so it stays `partial` with that reason. No change here beyond `--dry` |
| [US-04.1.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.1.3.md) Contract audit and versioning | absent | Stays `absent`. Phase 25 builds versions and the lock; the reason keeps saying so. No change here |
| [US-04.1.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.1.4.md) AA identifier for every Contract | absent · placeholder (Phase 18 fills it) | Phase 18 owns the recipe. This phase shows and searches the AA code on every picker row, which US-04.3.2's `aa-code` state covers, so nothing is added here |
| [US-04.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.1.md) Holder, scope and organisational reach | partial · admin-contract-holder | Phase 18 owns the editor shot. Add a `narrows-picker` state: a Contract scoped to Christchurch Eye Surgery and to its procedures offered on its own List's eye Booking and absent from another hospital's List. Highlight the scope chips, then the picker. Caption that insurer and funding-source scope describe the Contract but do not narrow the picker (OQ-55). Leave the status to 18 |
| [US-04.2.10](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.10.md) Pricing effective from a date | absent · placeholder (Phase 18 fills it) | Phase 18 owns the recipe. No change here |
| [US-04.2.11](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.11.md) Combination Contracts | absent | Stays `absent` with the reason "Phase 23 builds this". The picker rule already offers a Contract set against several procedures, but no combination Contract is seeded until Phase 23, so there is nothing to shoot here |
| [US-04.2.12](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.12.md) Payment setting: full payment or split | absent | Stays `absent`. Phase 22 builds the payment setting; `funderOverride` stays the split here. No change |
| [US-04.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.2.md) Contract pricing and adjustment rules | captured · admin-pricing-basis[type-1,type-2,type-3,rate-time] | Stays `captured` for the pricing basis; Phase 24 closes the defined rate and adjustment. Nothing here changes the screen, but the Contract list it clicks through changes names, so re-check it with `--dry` |
| [US-04.2.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.4.md) Fixed fee schedule lines | partial · admin-price-rows | Phase 18 owns it and expects `captured`. No change here |
| [US-04.2.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.5.md) Multi-procedure rule per Contract | partial · admin-ordinal-rows | Stays `partial`; Phase 23 builds the per-Contract rule. No change here beyond `--dry` |
| [US-04.2.7](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.7.md) Required booking inputs | absent | Stays `absent`. Phase 21 builds required inputs; the reason names it. No change |
| [US-04.2.8](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.8.md) Invoice presentation and delivery | absent | Stays `absent`. Phase 22 builds layout, delivery and GST on the Contract; the reason names it. No change |
| [US-04.3.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.3.1.md) Exactly one Contract per Procedure | partial · admin-procedure-contract | `captured`. Re-shoot `admin-procedure-contract` on the office Booking detail (`BK0009`): the Contract row with name, AA code and category, "Billed to" the holder, and no Route, Category or Insurer rows and no "None". The completion refusal ("Choose a Contract for this procedure.") has no UI path, so it is not shot. Highlight the Contract row. Caption "Every Procedure carries exactly one Contract". Drop the partial reason |
| [US-04.3.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.3.2.md) Filtered Contract list | partial · admin-contract-picker | `captured`. Re-shoot `admin-contract-picker` on `ContractPickerSheet` (`data-shot="contract-picker"`) with states `default` (the Default section with the hospital default and the procedure's standard RVG Contract, then "For <procedure> at <hospital>", AA codes, category pills, and the OQ-78 caption under the Default section), `aa-code` (a Contract's AA code typed: that Contract first with its "AA code" match line, the defaults still above) and `holder-code` (HNZCAT typed on a Christchurch Eye Surgery eye Booking: "HNZCATall · Cataract, all" as the matched line, the defaults still first). Add `web-contract-picker` and `mobile-contract-picker` for the anaesthetist view (name and AA code only, a Dialog on web and a bottom sheet on mobile) on a DRAFT List. Highlight the search field, then the matched row. Caption "Filtered by procedure, then hospital, with the default always offered". Drop the partial reason |
| [US-04.3.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.3.3.md) Default hospital Contract derived from location | partial · admin-default-contract, web-default-contract, mobile-default-contract | `captured`. Re-shoot all three (`BK0001`, St George's default) with the Contract chip, and add an `added` state to each app showing a new Booking landing on the List hospital's default: for example the S1 "Fire hospital message" Booking for Sarah Mitchell on Souter Tue 28 Jul St George's AM, or a manual add on a Southern Cross List. Caption "Defaulted from the List's hospital". Drop the partial reason |
| [US-04.3.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.3.4.md) Admin sets Contracts at booking setup | captured · admin-billing-setup[summary,edit] | Stays `captured`. Keep `summary` and `edit`: re-caption `edit` ("Contract and payer", no route or insurer) and re-point its highlights (the Route, Category and Insurer rows are gone). Add a `setup` state on the Admin phone-advice form (Admin Day, a St George's List) showing the Contract row preselected to the hospital's default before the Booking is saved. Caption "The Contract is set when the Booking is created" |
| [US-04.3.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.3.5.md) Contract locked at AUTHORISED | captured · admin-contract-before, admin-locked-contract | Stays `captured`; Phase 25 re-points the lock. Only the billing setup rows change here, so re-check the `office-billing-setup-1` highlights with `--dry` |
| [US-04.3.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.3.6.md) Hospital data sets the Contract | absent | Stays `absent`: Future Work, no phase builds it (OQ-22). This phase builds nothing visible for it; feed-created Bookings take the general default (RV-27) |
| [US-04.3.7](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.3.7.md) Procedure not on the Contract's schedule | absent | Stays `absent` with the reason "Phase 21 builds this". This phase builds only the "no longer applies" caption, not the to-confirm flag |
| [US-04.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.4.1.md) Mandatory default Contract | captured · admin-add-hospital[added,contracts] | Stays `captured`; no change expected. The new default Contract's name comes from Phase 18, so check the `contracts` state caption with `--dry` |
| [US-04.4.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.4.2.md) Default RVG Contract for every procedure | none · Phase 19a creates it | Phase 19a owns the recipe. This phase offers the procedure's default RVG Contract in the picker's Default section, which US-04.3.2's `default` state shows, so nothing is added here; check 19a's recipe with `--dry` |
| [US-03.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.4.1.md) Anaesthetist can change the Contract | partial · web-edit-operation, mobile-edit-operation | `captured`. Re-shoot `edit-operation` on web and mobile (`BK0009`, DRAFT): the Contract row with a teal "Change", the reference field, and the caption "The office checks Contract changes when you submit the list". Add a `changed` state after a pick with the "Changed by you" pill. Add an Admin shot `contract-changed-flag` on the Review queue for Dr Morrison Mon 20 showing "Contract changed by anaesthetist" with the from and to names. Caption "Every change is audited and flagged for the office". Office approval is Phase 21 |
| [US-03.1.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.1.2.md) See the Contract on each Procedure | partial · web-procedure-contract, mobile-procedure-contract | `captured`. Re-shoot `procedure-contract` on web and mobile (the Contract name and AA code only, no route or payer) and add a `list` state on the List view (web `ListDetailView`, mobile `ListDetailScreen`) showing the one-line Contract caption before the session. Highlight the Contract caption. Drop the partial reason |
| [US-03.2.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.2.3.md) Add additional Procedures | partial · web-add-procedure[before,copy,added], mobile-add-procedure[before,added] | `captured`. Re-shoot `add-procedure` on both apps; in `added`, procedure 2 shows its own Contract row starting on procedure 1's Contract and changeable by its own "Change". Keep `before` and `added`. The web `copy` state is 15b's to drop with Copy; if it is still there, drop it here (no "Copy booking" button exists). The Admin add path stays unshot (the admin Booking screen covers it). Drop the partial reason |

**Recipes this phase breaks.**
- `US-06.3.5` (pre-payment re-checked): its `after` state clicks `role=button[name="Edit billing
  setup"]` then `[role=dialog] >> role=button[name="Self-funded"]` and "Save billing setup", and its
  captions say "Payment category". The payment category is gone (work items 2 and 13). Re-point it at
  the office "Set pre-payment" switch in `PrepaymentFlagSheet` (turn "Pre-payment required" off) and
  re-caption it, keeping the shot name `recheck-on-change` and the `booking-prepayment` hook.
- `US-07.2.2` (office review): the `edit` state is captioned "choosing the route and Contract" and
  the review table's Route column becomes "Payer" (work item 16). The `Edit billing setup` button
  keeps its name (item 14). Re-caption and re-point.
- `US-11.4.2` (insured reimbursement): the insured-reimbursement invoice wording is retired until
  Phase 21 (work item 17), and the AIA Booking reads the standard wording. Re-point the shot at what
  now shows, or set the recipe `partial` with the reason "The reimbursement wording returns with
  Phase 21's Contract-holder flag".
- `US-03.4.1`, `US-04.3.1`, `US-04.3.2`, `US-04.3.3`, `US-04.3.4`, `US-04.3.5`: they use
  `[data-shot=office-billing-setup-1]`, `Edit billing setup`, `label:has-text("Governing contract")`
  and `[data-testid=procedure-header] >> text="Edit"`. The sheet becomes "Contract and payer" with a
  Contract row that opens the picker, so `US-04.3.2`'s highlight must move to the picker, and captions
  naming the "billing route, insurer and governing contract" must change. Reconcile with the recipes
  already listed in the Reference section above.
- `US-03.1.2`, `US-03.2.3`: keep `data-shot="procedure-contract"` (work item 18 does) and check
  `procedure-additional-note`.
- `US-02.5.5` (Booking history captioned "including billing route and contract"): re-caption without
  the route.
- Recipes that highlight or open the office billing setup (`US-05.4.2`, `US-05.5.1`, `US-07.2.3`,
  `US-11.2.1`, `US-11.2.2`): its rows change (item 14). Check them with `--dry` and re-point the
  highlights. `US-11.2.2`'s `edit` state scrolls to the first select in the dialog, which becomes the
  guardian select on the Grace Park Booking's patient-direct Contract; keep its caption (Phase 21
  re-shoots it for the captured payer).
- Absent and partial reasons that name the billing route (`US-04.2.7`, `US-04.2.8`, `US-15.0.5`, and
  `US-04.3.1`'s, `US-03.4.1`'s and `US-03.2.3`'s partial reasons, dropped above): reword them without
  the route ("Completion checks come from fixed validator rules", "The invoice recipient follows the
  Contract holder", "fee, unit, Contract and split logic"); their status is unchanged.
- Pre-payment recipes (`US-06.2.1`, `US-06.2.2`, `US-06.2.3`, `US-06.3.1` to `US-06.3.4`, `US-06.4.1`):
  they click `daygrid-block-prepayment` and read the pre-payment banner, now driven by the Booking
  flag rather than the category. The seed keeps the same Bookings flagged, so they should still
  match; the `--dry` run is the check.
- `US-04.2.1`, `US-04.2.2`, `US-04.2.5`, `US-05.5.1`, and 19a's `US-04.4.2`: they click Contracts by
  name and read the office billing setup or the base units. Phases 18 and 19a already re-pointed the
  names; check them again after the seed remap.

**ATLAS.md.** Seed data and Personas and IDs (how each seeded Booking's Contract, payer and
pre-payment flag now read, and the notes that say "nib insurer route" or "billing route"), Overlays
(the Contract picker, the "Contract and payer" sheet, `PrepaymentFlagSheet` and the phone-advice
Contract row), Existing hooks (`contract-picker` and any moved `office-billing-setup-*` hooks) and
the button-text list for the billing setup. Routes are unchanged.

## Adversarial review (after build)

After the manual test checklist and the four commands are green, and before writing the PROGRESS
entry, run the standard adversarial review-and-fix pass (PROGRESS convention 18). Fan out
independent Opus review subagents: quality, bugs/correctness and plan adherence, plus a fourth,
money-parity lens for this money phase. Then this session verifies every finding against the
catalogue, this plan and the code, fixes the confirmed ones, re-greens, and records the pass. Do not
re-raise anything settled in the Decisions log except the rulings this phase explicitly supersedes.

**Steer this phase's reviewers at:**

- **Every creation path stores a Contract at setup:** manual, phone advice, HL7/FHIR S12, PDF row,
  photo (if 15b kept it), add procedure and addendum, with the office able to see and change it on
  the creation form (US-04.3.4). The feed and PDF creates carry no route stamp and no feed-specific
  Contract (RV-27). The only "no Contract" outcome left is a validation failure or a `noContract`
  run exception, never a silent default at billing time. No Copy path survives (15b).
- **The filter matches OQ-66's answer:** procedure first (19a's scope, through
  `scopeCoversProcedure`), then hospital, then code and anaesthetist scope; no insurer,
  funding-source or surgeon input anywhere; no out-of-scope Contract offered or accepted by the
  store (the UI cannot bypass `setProcedureContract`); the defaults (the hospital's and the
  procedure's default RVG Contracts) always offered, also under a search and a miss; "None" gone
  everywhere; AA-code and holder-code search both work and stay inside the in-scope set; no
  insurer-held Contract offered for an insurer that does not accept direct claims; no flat select of
  every Contract.
- **Base units follow the Contract:** a Contract change re-runs 19a's resolver in the same commit; a
  typed value survives; no second base-unit source appears in this phase's code.
- **D2 held:** no `insurerId` or `fundingSource` on the Booking or the Patient, in types, seed, store
  patches or UI.
- **Simple anaesthetist view:** the anaesthetist's picker rows, Contract row and capture line show
  name, AA code and Change only; pricing basis, payer and category appear only to the office.
- **Parity:**
  - Item 1's fixtures pass unchanged.
  - The holder-as-payer interim reproduces every seeded payer.
  - `funderOverride` still splits Prentice.
  - The pre-payment builders give the same deposit and full amounts.
  - `rng()` draw order in the filler generator is unchanged.
- **Audit completeness:** `procedure.contract` (with role), `procedure.contractDefault` (one per
  re-defaulted Procedure, in the same commit as the List edit) and `booking.prepayment` all carry
  before and after. The anaesthetist-change flag is derived from audit only and survives a reload.
- **Rights:** the anaesthetist changes Contracts only on their own DRAFT Lists; the office on DRAFT
  and SUBMITTED; nobody on AUTHORISED. `setBookingPrepayment` is office only, all or nothing, only
  where a person pays for the patient (OQ-73), and locked once a pre-invoice exists. No completion
  gate returns.
- **One provisional label:** the OQ-78 caption under the office picker's Default section, nowhere
  else; no OQ-66 provisional text remains.
- **Leftovers:** no remaining route, category or insurer-on-Procedure vocabulary in code, copy,
  audit labels, shots or the demo guide (the item 8 greps). The stored-Contract fallback and
  `contractIneffective` are deliberately kept for Phase 25.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry; ROADMAP.md "Owner review: agents test
  themselves"): the OQ-78 recommendation built (both defaults offered), the readings and interims
  below, anything logged rather than fixed, and the screens worth a look, each with its route and
  persona (the picker on Admin, web and mobile; the phone-advice Contract row; the Morrison review
  flag).
- **Catalogue screenshots result:** the recipes changed (the seven re-shot items, US-04.2.1's new
  state and the broken ones: US-06.3.5, US-07.2.2, US-11.4.2, US-02.5.5), the
  `requirements-board/capture/REPORT.md` counts (captured, partial, absent, failed) before and after,
  and the reasons handed on: US-11.4.2 to Phase 21 (reimbursement wording), US-04.3.7 and US-04.2.7
  to Phase 21, US-04.2.12 and US-04.2.8 to Phase 22, US-04.2.11 and US-04.2.5 to Phase 23, US-04.1.3
  and US-04.1.2 to Phase 25.
- Status row for catch-up Phase 20, and a phase entry: drift-check result against `3d3a18c`, D2,
  D16 (OQ-66) and D23 (OQ-73) built as answered, OQ-78 built as its recommendation, what 15a, 15b,
  18, 19 and 19a were found to provide, the session 1 and session 2 split, the adversarial pass, the
  tests added (contract selection and search, parity, store actions, base units following the
  Contract, audit-derived flag), `PERSIST_VERSION` old to new, the broken capture recipes, and the
  handoff to 21 (the Contract-defined billable party replacing holder-as-payer and the guardian
  override; US-11.4.2's Contract-holder flag and wording).
- Decisions log:
  - **Superseded:**
    - The route model: 3rd review #1 (office route-setting and the mobile initial route); the
      Phase 08 decisions (1) and (2) on resolution by route and the contract-less billable-party
      route; 6th review #2 (insurer route direct-claims check).
    - Payment categories: 2nd review #5 and 7th review A2.
    - "The Card-level pre-payment flag is derived, never stored" (7th review B6), now an interim
      office-set flag.
    - The ACC review advisory (6th review #3), if 18 had not already removed it.
    - The catch-up plan's earlier default of insurer and funding source on the Booking (old DM-35):
      withdrawn by D2 before it was built.
  - **Readings this phase picks where the catalogue is silent:**
    - Insurer, funding-source and surgeon scope arrays do not narrow the picker (OQ-55; surgeon not
      settled), so `surgeons` leaves 18's `SCOPE_NARROWING_DIMENSIONS`.
    - "The default RVG Contract always offered" means both the List hospital's RVG Default Hospital
      Contract (the stored default) and the procedure's default RVG Contracts (19a); the catalogue
      has not settled which (US-04.4.2 note, OQ-78).
    - A Procedure with no master entry and no code sees only Contracts with no procedure, code or
      group scope, and the hospital default then `CT-RVG-POSTPAID` as its defaults.
    - Seeded patient-paid Procedures move onto their procedure's default RVG Contract (19a), else
      `CT-RVG-POSTPAID`; a stored default RVG Contract is honoured by the stored branch of
      `resolveContractForProcedure`.
    - A Contract change re-seeds base units through 19a's resolver unless the anaesthetist typed
      them.
    - Feed- and PDF-created Bookings take the general default; no hospital message names a Contract
      (RV-27; US-04.3.6 is Future).
    - US-03.1.2 ("how a Procedure will be billed") is met on anaesthetist views by the Contract's
      name and AA code; pricing basis, payer and category stay office-only (US-15.0.1).
    - An insurer-held Contract is not offered while its insurer does not accept direct claims
      (replaces the 6th review #2 validator check).
    - A List with no hospital defaults to RVG Default Post-paid.
    - An added Procedure starts on the first Procedure's Contract when in scope.
    - A hospital or procedure change re-defaults only defaulted Procedures.
    - The anaesthetist-change flag is derived from the audit trail; an office re-pick clears it
      until Phase 21's approval.
    - The insured-reimbursement invoice wording is retired until Phase 21's Contract-holder flag.
  - **Built as answered (OQ-66, D16):** the picker filtered by procedure then hospital, the defaults
    always offered, search by AA code and holder code inside the in-scope set, a 50-row cap. No
    provisional label.
  - **Provisional (OQ-78, one place):** the catalogue's default-Contract model, with the caption
    under the office picker's Default section.
  - **Interims, with the phases that replace them:** holder-as-payer and the guardian override (21),
    `funderOverride` as the split (22), the office-set Booking pre-payment flag and the seeded
    deposit (27).
