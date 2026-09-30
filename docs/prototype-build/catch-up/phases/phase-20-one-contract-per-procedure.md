# Phase 20 · One Contract per Procedure

**Requirements covered:**
[EP-04](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/EP-04.md) (the route half; billable party lands in 21, the lock in 25),
[FT-04.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-04.3.md),
[US-04.3.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.3.1.md),
[US-04.3.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.3.2.md),
[US-04.3.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.3.3.md),
[FT-03.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-03.4.md) (the flag half; office approval lands in 21),
[US-03.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.4.1.md),
[US-03.1.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.1.2.md),
[US-03.2.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.2.3.md);
[DM-09](../analysis/domain-model-delta.md#dm-09), [DM-35](../analysis/domain-model-delta.md#dm-35),
[DM-31](../analysis/domain-model-delta.md#dm-31); [RV-08](../analysis/reverse-check.md) (route and
payment category part; the Type 1/2/3 relabel landed in 18).
**Depends on:** Phase 19 (and through it 18's Contract shape: category, holder, scope filters,
pricing basis; 19's RVG groups and base-unit resolver; 15's Booking vocabulary; 14's trigger registry).
**Estimated:** 2 sessions. Session 1: work items 1 to 9 (figures pinned, model, engine, store, seed),
ending green with the UI edited only as far as it must compile. Session 2: items 10 to 18 (picker,
sheets, review, copy, shots, demo guide). Tight for an XL change: session 1 carries the seed remap
and fourteen test files. If it overruns, finish green on items 1 to 7 and 9 and open session 2 with
item 8's label sweep; never defer the parity pin or the seed remap.

## Goal

Pricing becomes one decision. `BillingRoute`, `PatientPaymentCategory` and `Procedure.insurerId`
are removed, and with them the engine's route resolution and route-based payer derivation. Every
Procedure carries exactly one Contract: the Scheduling Engine defaults it to the RVG Default
Hospital Contract for the List's hospital when the Booking is created and again when the hospital
changes, and a Booking cannot be marked complete without one. Anaesthetists (mobile and web) and the
office choose it from a picker filtered by hospital, surgeon, insurer, funding source and RVG code,
with the default always offered and no "None" option. Insurer and funding source move onto the
Booking (owner decision D2). An anaesthetist's Contract change is recorded and flagged for the office
at review.

Three interims keep the demo whole until later phases replace them, each labelled in code comments
and the Decisions log:

- **Payer = the selected Contract's holder** (a patient-direct holder bills the Procedure's guardian
  override, else the patient) until Phase 21 stores a billable party on the Booking.
- **`funderOverride` stays the two-funder split** (Prentice, S3) until Phase 22's covered amount.
- **Prepayment is an office-set flag on the Booking** (full, or split with a deposit) until Phase 27
  derives it from the anaesthetist's prepaid set. The completion gate and its override are unchanged
  (D5 is decided in 27).

S3 figures must not move, and holder-as-payer must reproduce today's payer for every seeded
Procedure.

> Names below are the July names (`Card`, `createCard`, `cardActions.ts`, `CardDetailBody`).
> Phase 15 renamed Card to Booking; use the renamed identifiers and files. Likewise use Phase 18's
> names for the Contract fields (category, holder, scope filters, pricing basis) and its
> `FundingSource` type if it defined one.

## Before you start: drift check

1. Run:

   ```
   git diff 1f067a8 -- "docs/discovery-reference/Updated Requirements/catalogue" "docs/discovery-reference/Updated Requirements/domain-model.md"
   ```

   Look for changes to EP-04, FT-04.3, US-04.3.1, US-04.3.2, US-04.3.3, FT-03.4, US-03.4.1,
   US-03.1.2, US-03.2.3, and to the items this phase leans on: US-04.1.1 (categories, especially the
   RVG Default Post-paid category and the "Booking's billable party" holder), US-04.2.1 (scope
   filters), US-04.3.4, US-07.2.2, US-11.2.2, US-11.4.2 and the domain model's Contract section.
   If an item changed, re-read it and adjust the work items. If one is now Retired or Future, drop it
   from this phase and record that in the PROGRESS entry.
2. **Owner decision D2** (insurer and funding source on the Booking or on the Patient). No linked
   OQ. If unanswered, build the default (on the Booking, DM-35) and say so in the Decisions log. If
   the answer is "on the Patient", put `insurerId` and `fundingSource` on `Patient`, edit them through
   `editPatient`, and have the picker read them through the Booking's patient; everything else in
   this plan is unchanged.
3. **Confirm what 18 and 19 actually delivered** (their PROGRESS entries): the category names, how a
   patient-direct holder ("the Booking's billable party") is modelled, the scope filter fields, the
   `FundingSource` values, RVG groups, and whether `Procedure.accRelated` and the ACC review
   advisory (RV-20) are already gone. The work items below say what to do in either case.
4. Record the result (including "no drift") in the PROGRESS entry.

There are no open questions blocking this phase. The readings this phase picks where the catalogue
is silent are listed in work item 3 and go to the Decisions log as provisional.

## Reference

- **Design** (convention 17): `docs/design/Design Language.dc.html` (tokens; neutral pills for
  Contract and category chips; teal is the only action colour, so the picker's selected tick and
  "Change" links are teal, never crimson); `docs/design/Mobile App.dc.html` (card detail anatomy:
  white cards with micro-cap headings, 14px radius, bottom-sheet rows for choices);
  `docs/design/Admin Review.dc.html` (review table; its mock ROUTE column is anaesthetic technique
  and its CONTRACT column shows who pays, which is the layout this phase moves to);
  `docs/design/Admin Day.dc.html` (drawer and card-detail chrome). No mockup covers the picker:
  extend the mobile bottom-sheet list pattern, rendered as a Dialog on web and admin.
- **Catalogue:** the covered files above, plus US-04.1.1, US-04.2.1, US-04.3.4, US-07.2.2,
  US-11.2.2, US-11.4.2 and `domain-model.md` ("Contract", "Selection", "Patient and billable party").
- **Gap analysis:** `GAP-ANALYSIS.md` (Summary, themes 1 and 5, "Structural first" step 3, the DM-09,
  DM-31, DM-35 and RV-08 rows); `epics/EP-04.md` and `epics/EP-03.md` for these items;
  `gaps.json` entries; `analysis/domain-model-delta.md` (DM-06, DM-09, DM-10, DM-24, DM-31, DM-35);
  `analysis/reverse-check.md` (RV-01, RV-08, RV-20).
- **Code entry points** (July line numbers, from `analysis/prototype-map-*.md`):
  - `src/domain/types.ts` 409 to 484 (`BillingRoute`, `PatientPaymentCategory`, `PrepaymentDetail`,
    `Procedure`), 370 (`Card`), 216 (`Contract`).
  - `src/domain/billing/invoiceBuild.ts`: `resolveContractForProcedure` 114,
    `counterpartyForProcedure` 192, `buildPrePaymentInvoiceForCard` 456;
    `validateCardForBilling.ts` (route, insurer-route, category and prepayment checks,
    `billingReferenceMissing` 49); `contracts.ts` (`selectContract`); `fixtures.ts`.
  - `src/store/cardActions.ts` (`createCard` 70, `copyCard`, `addPostOpAddendum`, `addProcedure`
    394); `lifecycle.ts` (`editCard` 415, `editProcedure` 445, `editList` 498, `reassignCard` 640);
    `integrationActions.ts` (S12 create 158, `ingestPdfRow` 472); `prepaymentActions.ts`;
    `selectors.ts` (`cardRequiresPrepayment` 307, `billingContextForCard` 837, receivable rows' ACC
    flag 634); `mastersActions.ts` (`setInsurerDirectClaims` 101, feeds item 3's direct-claims
    rule); `contractActions.ts` (the delete guard on `governingContractId` 158, unchanged);
    `billingLineActions.ts` 77 (reads the stored Contract, unchanged).
  - Phase 18 retypes the Contract (`holder` union with kinds `hospital`, `surgeon`, `surgeonGroup`,
    `insurer`, `bookingBillableParty`; `category`; `scope` arrays; `pricingBasis`) and adds
    `holderCounterparty`, `holderMatches` and `isRetired` in `domain/billing/contracts.ts`. The July
    `holderType`/`holderId` fields named in the analysis files no longer exist.
  - `src/shared/flows/EditProcedureSheet.tsx`, `EditBillingSetupSheet.tsx`, `ManualCardForm.tsx`,
    `PhotoCaptureFlow.tsx`, `sampleExtractions.ts`; `src/shared/card/OfficeBillingSetup.tsx`,
    `CardDetailBody.tsx`; `src/shared/capture/BtmCaptureBlock.tsx` (context line, `CONTEXT_FIELDS`),
    `feeContext.ts`; `src/shared/format.ts` (`ROUTE_LABELS`, `routeLabel`); `src/shared/audit/`
    (`fieldLabels.ts`, `actionLabels.ts`).
  - `src/apps/admin/reviewFlags.ts`, `screens/ReviewScreen.tsx` (Route column 78, 244),
    `screens/BillingMonitorScreen.tsx` (`resolveAndRetry` failure codes 79, unchanged),
    `screens/InvoiceDocument.tsx` (`PaymentCategoryNote` 496), `flows/PhoneAdviceBooking.tsx` (S2
    prefill 33); `src/apps/mobile/screens/ListDetailScreen.tsx`, `BalancesScreen.tsx`;
    `src/apps/web/screens/ListDetailView.tsx`, `AccountsScreen.tsx`.
  - Seed: `src/domain/seed/cards.ts` (`ProcedureSpec` 228, scenario cards 355 to 1000, filler route
    draw 1150), `contracts.ts`, `history.ts` 227, `audit.ts`, `billing.ts`, `index.ts`.
  - Tests that name routes today: `reviewFlags.test`, `invoiceBuild.test`, `prePaymentInvoice.test`,
    `validateCardForBilling.test`, `seed.test`, `billingRun.test`, `captureActions.test`,
    `cardActions.test`, `postOpAddendum.test`, `btmCapture.test`, `prepayment.test`,
    `mastersActions.test`, `auditNarrative.test`, `demoScenarios.test`.
  - Shots: `visual/mobile-interactions.spec.ts` (clicks "Billing route"), `admin-phase06.spec.ts`
    (office billing setup), `admin-phase07.spec.ts` (review table). Catalogue capture recipes:
    `requirements-board/capture/recipes/US-03.1.2.json`, `US-03.2.3`, `US-03.4.1`, `US-04.3.1` to
    `US-04.3.5`.

## Work items

**Session 1: model, engine, store, seed.**

1. **Pin the figures first.** Before changing any code, extend the parity harness Phases 18 and 19
   left (`domain/billing/__parity__/phase-18-baseline.json` and `feeParity.test.ts`, or whatever
   their PROGRESS entries name; 18's fixture already records per-Booking totals by counterparty).
   Add `src/store/contractParity.test.ts` only for what that harness does not already pin, with two
   fixtures generated from the current build:
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
     `Procedure.insurerId`, `Procedure.patientPaymentCategory` and `Procedure.prepaymentDetail`. If
     `Procedure.accRelated` survived Phase 18, delete it too; Booking funding source `ACC` replaces
     it (DM-35).
   - Booking (`Card`) gains `insurerId?`, `fundingSource?` (Phase 18's `FundingSource`, else define
     `'private' | 'SXAP' | 'HNZ' | 'ACC'`) and `prepayment?: PrepaymentDetail`. The prepayment field
     carries a comment: "INTERIM office-set flag, replaced by Phase 27's derivation". Move the
     `PrepaymentDetail` comment accordingly.
   - Procedure keeps `governingContractId`. It stays optional in the type only so that a legacy or
     moved Procedure fails validation as data; every creation path sets it. Procedure gains
     `contractSelection?: { setBy: 'default' | 'office' | 'anaesthetist'; who: string; atISO: IsoDateTime; anaesthetistChange?: { fromContractId?: ContractId; toContractId: ContractId; atISO: IsoDateTime } }`
     (DM-31). `billablePartyId` stays on the Procedure as the guardian override, INTERIM until 21.
3. **Pure Contract selection** (`domain/billing/contractSelection.ts`, exported from the billing
   index, with `contractSelection.test.ts`):
   - `ContractSelectionContext`: `hospitalId?`, `surgeonId?`, `insurerId?`, `fundingSource?`,
     `rvgCode?` (plus its Phase 19 groups), `anaesthetistId`, `dateISO` (the List date).
   - `defaultContractForBooking(contracts, ctx)` (new name: `invoiceBuild.ts` already has a private
     `defaultContractFor(holderType, holderId, ctx)` for the expiry fallback, which stays): the RVG
     Default Hospital Contract (Phase 18 category `rvgDefaultHospital`) for `hospitalId`, in effect
     on `dateISO`. With no hospital (an AA-rooms List), the RVG Default Post-paid Contract (18's
     `CT-RVG-POSTPAID`). This is a provisional reading (the catalogue names only the hospital
     default).
   - `contractOptionsFor(contracts, insurers, ctx)` returns `{ default, others }`. A Contract is
     offered when it is in effect on `dateISO`, not retired (18's `isRetired`), and for every
     non-empty scope filter (18's `ContractScope` arrays, plus 19's RVG groups) the Booking's value
     is inside it. An unset Booking value does not exclude: a surgeon-scoped fixed-price Contract is
     offered before the code is known, and an ACC-scoped Contract is offered while funding source is
     still unrecorded. That is also a provisional reading. An insurer-held Contract is not offered
     while its insurer does not accept direct claims (`Insurer.acceptsDirectClaims`): this replaces
     the validator's retired insurer-route direct-claims check (6th review #2), so a non-direct-claim
     insurer is never invoiced (US-11.4.2); provisional. The default is always offered and listed
     first (US-04.3.2). Order the others by category, then name.
   - `isContractInScope(contract, insurers, ctx)` uses the same rule, for flags and store guards.
   - Tests cover the US-04.3.2 example (a St George's Contract is never offered on a Southern Cross
     List), each filter dimension (surgeon: Doyle bariatric only on Doyle Lists; insurer: nib's
     Insurance Contract only when the Booking's insurer is nib; funding source: ACC Contracts for ACC
     or unset, never for Private, SXAP or HNZ, and Health NZ likewise only for HNZ or unset; RVG code
     or group; anaesthetist scope, Aria only for Souter and Fitzgerald), the direct-claims exclusion
     (toggle nib off with `setInsurerDirectClaims`: its Contract drops out), effective dates, the
     unset-value rule, the no-hospital default and deterministic order. Add a seed assertion: every
     hospital-held Contract lists its holder in its hospitals filter. Phase 18 set `hospitalIds`
     only on the five defaults, so expect to add it to SXAP, Health NZ, St George's ACC and the CES
     HNZ schedule in the seed.
4. **Validator** (`validateCardForBilling.ts` + test; US-04.3.1):
   - Remove the route, insurer-route and payment-category checks.
   - Add `governingContractId` failures: missing ("Choose a Contract for this procedure.") and
     dangling ("The selected Contract no longer exists. Choose another.").
   - Keep the check that `billablePartyId` resolves.
   - Pre-payment checks move to the Booking (field `prepayment`, no `procedureId`): a split needs a
     deposit above zero ("Enter the deposit amount for a split pre-payment."). A flag on a Booking
     none of whose Procedures bills the patient fails with "Pre-payment is set on this booking but no
     procedure bills the patient."
   - `billingReferenceMissing(procedure, contract)` is re-keyed from the route to the Contract
     holder (18's `holder.kind`): a `hospital`, `surgeon` or `surgeonGroup` holder expects a
     reference; an `insurer` or `bookingBillableParty` holder does not. That reproduces today's
     flags (check against the Morrison missing-reference Procedure). It is interim until Phase 21's
     required inputs, so update both callers (`OfficeBillingSetup.tsx` 47, `reviewFlags.ts` 81).
   - The Method 3 gate is unchanged.
5. **Engine** (`invoiceBuild.ts` + tests):
   - `resolveContractForProcedure` loses the "nothing stored, resolve by route" branch. Nothing
     stored is now the exception `noContract` ("No Contract is selected on this procedure. Choose one
     before rebilling."). Delete the `noBillingRoute` code and any UI copy keyed on it.
   - Keep the stored-Contract branch exactly as it is, including `contractMissing` for a dangling id
     (effective on the List date; an expired hospital- or insurer-held Contract falls back to that
     holder's default; a surgeon, surgeon-group or Booking-billable-party holder is
     `contractIneffective`). S4 Beat 3's billing-failure trigger (COS, a surgeon-group holder)
     depends on it, and so does `BillingMonitorScreen`'s `resolveAndRetry` (line 79, unchanged).
     RV-01's lock is Phase 25.
   - `counterpartyForProcedure(procedure, contract, patientId)` becomes holder-as-payer, commented
     INTERIM until Phase 21, by dropping the route switch around 18's `holderCounterparty`: a
     `bookingBillableParty` holder (RVG Default Post-paid, Aria) bills `billablePartyId`, else the
     patient; any other holder bills itself (hospital, insurer, surgeon, or the surgeon group's
     billing organisation, so COS stays `{ kind: 'organisation', id: ORG.cos }`). `funderOverride`
     lines behave as today.
   - `buildPrePaymentInvoiceForCard` reads `card.prepayment` and covers the Booking's patient-direct
     Procedures:
     - A split raises one deposit line on the first covered Procedure (keeps `prePaidByProcedure`
       keyed as today).
     - A full pre-payment raises each covered Procedure's estimated fee via `feeFor` with that
       Procedure's own Contract (the RVG Default Post-paid prices exactly as "no contract" did).
6. **Store actions** (tests in `cardActions.test`, new `contractSelectionActions.test`,
   `prepayment.test`):
   - **`setProcedureContract(api, actor, procedureId, contractId)`** (new; `store/cardActions.ts`
     or a new `contractSelectionActions.ts`):
     - Checks the rights matrix via `editRefusal` (anaesthetist: own DRAFT only; office: DRAFT and
       SUBMITTED; AUTHORISED refused).
     - Refuses `notFound`, `contractNotInEffect` and `contractOutOfScope` ("That Contract does not
       apply to this booking's hospital, surgeon, insurer or code.").
     - Records `contractSelection`. An anaesthetist actor also stamps `anaesthetistChange`
       (US-03.4.1). An office actor clears a pending `anaesthetistChange`, since the office has now
       set it; this is interim until Phase 21's explicit approval.
     - Audited `procedure.contract` with `before`/`after` of the Contract id and `setBy`.
     - Remove `governingContractId` and every deleted field from `ProcedurePatch`, so
       `editProcedure` cannot bypass it.
   - **Default at creation (US-04.3.3):**
     - `createCard` drops `billingRoute`, `insurerId` (as a Procedure field) and
       `patientPaymentCategory`.
     - It gains optional `contractId` (an explicit pick, checked like `setProcedureContract`),
       Booking `insurerId` and `fundingSource`, and `billablePartyId` (interim).
     - With no pick, it stores `defaultContractForBooking` for the List with `setBy: 'default'`.
     - This covers the manual, photo, phone-advice, HL7/FHIR S12 (`integrationActions.ts` 158) and
       PDF (`ingestPdfRow` 472) paths, and Phase 15's skeleton Copy.
     - `addPostOpAddendum` copies the original Procedure's Contract and not its pre-payment flag
       (until 39 replaces it).
   - **`addProcedure` (US-03.2.3):** the new Procedure starts on the first Procedure's Contract when
     that Contract is in scope for it, else on the default, with `setBy: 'default'`, and can then
     select its own. This is a provisional reading; inheriting stops a guardian-paid Booking's second
     Procedure silently billing the hospital.
   - **Hospital change:**
     - `editList` with `hospitalId` re-defaults every Procedure with `setBy: 'default'` on the List's
       non-cancelled Bookings, in the same commit, one `procedure.contractDefault` audit meta each.
     - Explicit picks are kept, and item 13's flag shows any that no longer apply.
     - `reassignCard` onto a List with a different hospital does the same.
   - **Booking funding:** extend `editCard`'s patch with `insurerId` and `fundingSource` (same rights
     matrix, audited `card.update`).
   - **Prepayment flag:** add `setBookingPrepayment(api, actor, cardId, detail | null)` in
     `prepaymentActions.ts`.
     - Office only; refused on AUTHORISED or billed Lists.
     - A split needs a positive deposit.
     - Changing or clearing is refused once a pre-payment invoice exists (new refusal code `prepaymentInvoiced`).
     - Audited `card.prepayment`.

     Also:
     - `cardRequiresPrepayment` reads `card.prepayment`.
     - `raisePreProcedureInvoice` refusal copy reads "This booking is not flagged for pre-payment."
     - `overridePrepaymentGate` is untouched.
   - **Selectors:**
     - `contractOptionsForProcedure(state, procedureId)` and `payerForProcedure(state, procedureId)`
       wrap the pure functions for the UI.
     - The receivable rows' ACC flag (`selectors.ts` 634) reads the Booking's funding source (only
       if `accRelated` was still there).
7. **Seed** (`seed/cards.ts`, `history.ts`, `audit.ts`, `contracts.ts`, `index.ts`):
   - `ProcedureSpec` loses the route fields and `addCard` takes `insurerId`, `fundingSource` and
     `prepayment`. If Phase 18 seeded no RVG Default Post-paid Contract, add one: protected default,
     patient-direct holder, RVG units at the anaesthetist's rate, organisational scope, effective
     2020-01-01.
   - Map every seeded Procedure:

     | Today | After this phase |
     |---|---|
     | Hospital route with a stored Contract | Same Contract. Booking funding source from it: Health NZ is HNZ, SXAP is SXAP, St George's ACC and COS ACC are ACC, otherwise private. An informational insurer moves to the Booking |
     | Insurer route, nib | nib's Insurance default Contract; Booking insurer nib, funding private |
     | Billable-party route, self-funded, no Contract | RVG Default Post-paid; guardian override stays on the Procedure |
     | Billable-party route, insured reimbursement (Webb, AIA) | RVG Default Post-paid; Booking insurer AIA, funding private |
     | Billable-party route, pre-payment (Riley split $800, Nair's rhinoplasty full) | RVG Default Post-paid; Booking `prepayment` {split, 800} and {full}; Nair's septoplasty stays on Forte's default |
     | Billable-party route under the Aria hourly Contract | Same Contract |
     | `history.ts` patient-route history | RVG Default Post-paid; the rest keep their hospital default |

   - The filler generator keeps the same `rng()` draw order and count (the route draw becomes the
     Contract and funding draw), so no other generated data shifts.
   - Seeded specific Contracts get `setBy: 'office'`; defaults get `setBy: 'default'`.
   - Run item 3's scope check over every seeded Procedure, and resolve each out-of-scope pick (check
     the Doyle bariatric Booking (Mills, Fitzgerald Tue 14 Southern Cross / Mr Doyle), the three
     SXAP picks (Ellison is on Souter Tue 21 PM), Aria's anaesthetist scope, and each ACC or Health NZ
     pick against the funding source you derive for its Booking first). Prefer
     correcting the seed's scope filter or the pick in a way that leaves item 1's figures unchanged,
     and log each call.
   - Seed one anaesthetist change for the review demo, with no figure change: on Dr Morrison's
     submitted Mon 20 St George's List, the Procedure already on St George's ACC (the 10:00
     "Ureteroscopy with lithotripsy, ACC claim", ref ACC45-118203, `morrisonSpecs` in
     `seed/cards.ts`) gets `contractSelection` `{ setBy: 'anaesthetist', who: Dr Morrison,
     anaesthetistChange: { from: St George's default, to: St George's ACC } }` stamped before the
     List's submit time, and its Booking gets funding source ACC. Its Contract, fee and payer are
     unchanged, so item 1's fixtures hold. Add a matching `procedure.contract` row to `audit.ts`.
   - Regenerate `audit.ts` histories so `procedure.create` and `procedure.update` entries carry
     Contract fields, not routes.
   - Bump `PERSIST_VERSION` by one from its post-19 value, with a comment line.
8. **Remove the retired vocabulary (RV-08):**
   - `ROUTE_LABELS` and `routeLabel` (`format.ts`); the route and category maps in
     `BtmCaptureBlock`, `OfficeBillingSetup`, `EditProcedureSheet`, `EditBillingSetupSheet`,
     `ManualCardForm` and `InvoiceDocument`.
   - The ACC-on-billable-party review advisory, if 18 left it (18 plans to remove it with
     `accRelated`; it was keyed on the route).
   - The " (direct claims)" suffix in the insurer selects of `EditProcedureSheet`,
     `EditBillingSetupSheet` and `ManualCardForm` goes with those selects; the Booking's
     `EditFundingSheet` insurer select may keep it.
   - In `shared/audit/`, add labels: fields `governingContractId` "Contract", `insurerId` "Insurer",
     `fundingSource` "Funding source", `prepayment` "Pre-payment"; actions `procedure.contract`
     "Contract changed", `procedure.contractDefault` "Contract set to the default",
     `card.prepayment` "Pre-payment flag set". Drop labels for the removed fields.
   - Gate:
     `grep -rnE "billingRoute|BillingRoute|patientPaymentCategory|PatientPaymentCategory|ROUTE_LABELS|noBillingRoute" aa-prototype/src`
     returns nothing.
9. **Session 1 exit:** fix all the listed tests (`fixtures.ts` too). Edit the UI only as far as
   compiling needs: route controls removed, and the Contract shown read-only where the route chip
   was. Run `npm run build`, `npm run build:pwa` and `npx vitest run`, all green; item 1 passes.
   Write a short "session 1 done" note in the PROGRESS entry.

**Session 2: UI, review, copy.**

10. **Shared `ContractPickerSheet`** (`src/shared/flows/`, through `useSurface().Overlay`, so a
    bottom sheet on mobile and a Dialog on web and admin; `data-shot="contract-picker"`):
    - Sections "Default for <hospital>" (or "Default for AA rooms"), then "Also applies to this
      booking".
    - Each row shows the Contract name, a neutral category pill, the pricing basis in words ("RVG
      units at your rate", "Agreed rate $26.50 per unit", "Fixed price list", "Hourly rate") and
      "Bills <holder>". These captions give US-03.1.2 its pricing-basis half.
    - The selected row carries a teal tick. Tapping a row calls `setProcedureContract` and shows any
      refusal verbatim. An empty others list reads "No other Contracts apply to this booking." There
      is no "None".
11. **Anaesthetist edit (US-03.4.1, FT-03.4)**, in `EditProcedureSheet` (mobile and web, DRAFT
    only):
    - The fields are Operation, a Contract row (name + pricing basis, teal "Change" opening the
      picker), and Billing reference (interim, optional).
    - Caption: "The office reviews Contract changes when you submit the list."
    - The route segmented control, insurer select and payment category are gone.
12. **Showing the Contract (US-03.1.2, US-04.3.3):**
    - In `BtmCaptureBlock` the route chip becomes a neutral Contract chip (for example "St George's
      default"). The context line then reads pricing basis · "Billed to <payer>" (interim, holder
      derived) · reference.
    - A pending anaesthetist change adds a small warning-tint pill "Changed by you · office to
      review" on anaesthetist views, and "Changed by anaesthetist" on the office's.
    - `CONTEXT_FIELDS` swaps the route fields for `governingContractId`.
    - List rows on mobile `ListDetailScreen` and web `ListDetailView` add the primary Procedure's
      Contract short name as a one-line mist caption, so the Contract is visible before the session.
13. **Booking funding and prepayment** (`CardDetailBody` context section; DM-35):
    - A "Funding" row shows Insurer · Funding source ("nib · Private", or "Not recorded") with Edit.
      Edit opens a new `EditFundingSheet` (`src/shared/flows/`): an insurer select including "None", and funding source as
      a Segmented control (Private / SXAP / HNZ / ACC).
    - It is editable by both roles within the rights matrix.
    - When a Procedure's Contract no longer applies after a funding or List change, it shows the
      caption "This Contract no longer applies to the booking." with a teal "Choose Contract" link.
    - The office also sees a "Pre-payment" row (None / Full / Split $x) with "Set pre-payment",
      which opens a new `PrepaymentFlagSheet` (`src/shared/flows/`, beside `PrepaymentOverrideSheet`) and calls `setBookingPrepayment`. The anaesthetist keeps the
      existing banner.
14. **Office billing setup** (`OfficeBillingSetup`, `EditBillingSetupSheet`; US-04.3.2 office side):
    - The rows become Contract (name + category), Payer (holder derived, or the guardian on a
      patient-direct Contract), Reference, Override and Funders. The Route, Category and Insurer rows
      are gone.
    - The sheet becomes "Contract and payer": a Contract row opening the picker, the guardian select
      with "New guardian" shown only on a patient-direct Contract (interim), and the billing
      reference.
    - Save calls `setProcedureContract` when the Contract changed, then `editProcedure` for the rest.
15. **Creation forms:**
    - `ManualCardForm`'s "Billing route" block becomes "Funding" (insurer, funding source) plus
      "Contract", preselected with the List hospital's default and changeable through the picker. The
      List's hospital and surgeon plus the form's insurer, funding source and RVG code feed the filter.
    - The payer select shows only for a patient-direct Contract.
    - `sampleExtractions` sample B prefills insurer nib and nib's Insurance Contract.
    - `PhoneAdviceBooking`'s S2 prefill drops the route and keeps nib as the Booking insurer, so the
      booking lands on St George's default exactly as S2 shows today.
16. **Admin review (DM-31):**
    - `ReviewScreen`'s Route column becomes "Payer" (holder derived; "Mixed" when Procedures differ).
    - The Contract column shows the primary Procedure's Contract, "+N" for more, and a marker when
      the anaesthetist changed one.
    - `reviewFlags.ts` stays pure. Its inputs gain the Contract, its in-scope result and the from/to
      names. It adds two warn flags, "Contract changed by anaesthetist · <from> to <to>" and
      "Contract does not apply to this booking", and re-keys "No billing reference".
    - Update the tests. Approving the change is Phase 21.
17. **Invoice wording:** `InvoiceDocument`'s `PaymentCategoryNote` derives its branch from the
    Booking: the pre-payment flag gives the pre-payment wording; a Booking insurer that does not
    accept direct claims, on a patient-billed Procedure, gives "You may claim this from <insurer>"
    (US-11.4.2); otherwise the post-procedure wording. Keep the branch in one small pure helper so
    Phase 21's `forwardsToInsurer` can replace it; Phase 22 rebuilds the layout.
18. **Shots and demo surfaces:**
    - Update `visual/mobile-interactions.spec.ts`, `admin-phase06.spec.ts` and
      `admin-phase07.spec.ts`, keeping `data-shot="procedure-contract"`.
    - Edit the Control Panel's existing S1 scenario text (add nothing new to that page) and the
      description of Phase 14's re-homed "Fire
      hospital message" entry.
    - Run `npm --prefix requirements-board run capture -- --only US-03.1.2,US-03.2.3,US-03.4.1,US-04.3.1,US-04.3.2,US-04.3.3 --dry`
      and list the broken recipes in PROGRESS. Re-capture (it rewrites catalogue images) only if the
      owner asks.

## Demo triggers

No new harness-bar button. Everything in this phase demos through normal use: the picker, the edit
sheets and the review screen.

- **Re-homed "Fire hospital message" (S1)**, Phase 14's `fire-hospital-message` entry (Integrations
  sim, Admin · Integrations and Mobile · Lists; bar and PWA, so S1 fires it on a handset too): the new
  Booking for Sarah Mitchell now arrives on St George's default Contract, visible on mobile, web and
  admin. Update the entry's description text only.
- **"Trigger billing failure" (S4 Beat 3)** keeps working unchanged: the COS Contract is still the
  stored pick and still dates out to `contractIneffective`. Check it after item 7.
- **PWA:** no new entry. The anaesthetist's Contract change needs no office step to demo on a
  handset. The office-approval stand-in "Office approves this Contract change" is Phase 21's. Check
  that any Phase 14 PWA entry touching pre-payment still works against the Booking flag.

## Out of scope

- Billable party and invoice email on the Booking, invoice grouping by billable party, the under-18
  check, required inputs (member number, claim reference, purchase order), the not-on-schedule flag
  (US-04.3.7), and the office's explicit approval of every Contract at review (US-07.2.2) with its
  PWA stand-in. All Phase 21.
- Covered amount replacing `funderOverride`, and Contract-driven invoice layout, delivery and GST:
  Phase 22.
- Primary Procedure, the multi-procedure rule and Contract base-unit overrides: Phase 23.
- The lock at AUTHORISED and removal of the expired-Contract fallback and re-resolution (RV-01):
  Phase 25.
- Prepayment derived from the prepaid set, the estimator and the D5 gate: Phases 26 and 27.
- A matched hospital row creating a Booking on its default: Phase 33 (it will call the same default
  rule).
- Contract master editing and categories (18), and hospital data setting the Contract (US-04.3.6).

## Manual test checklist

- [ ] Reset. Fire MSG-STG-1001 (Phase 14's re-homed trigger), then open Souter Tue 28 Jul
      St George's AM on mobile:
      Sarah Mitchell's Booking shows "St George's default" on mobile, web and the Admin card, with
      "Billed to St George's".
- [ ] Add a Booking manually on a Southern Cross List: the Contract is preselected to Southern
      Cross's default. The picker offers SXAP (when funding is SXAP) but never a St George's Contract.
      There is no "None".
- [ ] Set the Booking's insurer to nib: nib's Insurance Contract becomes offered. Pick it: "Billed to
      nib". Change the insurer to AIA: the Contract is flagged "no longer applies".
- [ ] As Dr Souter on a DRAFT List, change a Procedure's Contract on mobile and on web: the "Changed
      by you" pill shows, and the audit trail records who, when, from and to. On a SUBMITTED List the
      sheet is read-only.
- [ ] Add a second Procedure to a guardian-paid Booking: it starts on the same patient-direct
      Contract and can pick its own.
- [ ] Office: change a DRAFT List's hospital from St George's to Forte. Defaulted Procedures move to
      Forte's default, with one audit row each. An explicitly picked Contract stays and is flagged.
- [ ] Demo: Data Inspector shows every seeded Procedure with a Contract. The "Choose a Contract for
      this procedure." completion refusal is covered by the validator test, because no UI path can
      clear a Contract any more.
- [ ] Review queue, Dr Morrison Mon 20: the Payer column replaces Route, and the seeded
      ureteroscopy (ACC claim) Procedure shows "Contract changed by anaesthetist · St George's
      default to ACC elective services via St George's". Its fee and payer are as before.
- [ ] Admin Master Data: turn nib's direct claims off. nib's Insurance Contract drops out of the
      picker on a nib Booking, and a Procedure already on it shows "This Contract no longer applies
      to the booking." Turn it back on.
- [ ] S3: authorise Souter Mon 20 AM and PM. Holt, Prentice nib and Prentice St George's invoices
      match item 1's figures to the cent.
- [ ] S4 Beat 1: Riley's Booking shows the office pre-payment flag (split $800), completion is blocked
      until override, and raising the pre-invoice gives $800 + GST. Nair's full pre-payment still
      nets its balance to $0.
- [ ] S4 Beat 3: Billing monitor, Demo actions, "Trigger billing failure" still fails only the COS
      Booking, its sibling bills, and "Resolve and retry" clears it.
- [ ] Invoice document wording: the AIA reimbursement patient reads "You may claim this from AIA
      Health", and the pre-payment and post-procedure wordings are unchanged.
- [ ] No "billing route", "payment category" or "None (default pricing)" text anywhere in the three
      apps. No en or em dashes in new copy.
- [ ] The PWA build shows the Contract chip and picker as bottom sheets.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots` are all green.

## Demo guide updates

Patch these in the same session, in `docs/demo-guide/` and the matching sections of
`master-demo-guide.html`. Line numbers are July's; Phases 15, 18 and 19 edit the same files (18
drops the ACC advisory wording), so locate each passage by its text:

- `03-demo-script.md`:
  - **S1 Beat 1 Expected:** add "Sarah's Booking arrives on St George's default Contract (RVG
    units), shown on mobile, web and Admin".
  - **S2 Beat 2:** the phone booking lands on St George's default. Remove any mention of choosing a
    billing route.
  - **S2 Beat 4:** add a "Worth pointing at" line on Dr Morrison's "Contract changed by
    anaesthetist" flag (approval arrives in Phase 21).
  - **S3 Beat 1 Say:** replace "It resolves the explicit payer per Procedure, applies the governing
    Contract, and groups by counterparty" with "It reads the one Contract on each Procedure, bills
    that Contract's holder, and groups by counterparty". The figures are unchanged.
  - **S4 Beat 1 Say:** "The office flagged this booking for pre-payment" instead of "A
    patient-funded pre-payment".
- `04-presenter-cheat-sheet.md`:
  - Glossary rows "Procedure" (line 18: "each selects exactly one Contract") and "ACC route"
    (line 31: ACC is a funding source and a holder Contract).
  - Replace "Three billing routes" (line 82 on) with "One Contract per Procedure": default hospital
    Contract, filtered picker, anaesthetist change flagged.
  - Update the myths at lines 172 and 285.
- `02-workflows-and-handoffs.md` (lines 22, 125, 301 to 302, 340 to 344, 424 to 426) and
  `01-personas-and-responsibilities.md` (lines 194, 204): route wording becomes Contract wording.
- Control Panel S1 scenario text and the Phase 14 registry entry description (item 18).

## Adversarial review (after build)

After the manual test checklist and the four commands are green, and before writing the PROGRESS
entry, run the standard adversarial review-and-fix pass (PROGRESS convention 18). Fan out
independent Opus review subagents: quality, bugs/correctness and plan adherence, plus a fourth,
money-parity lens for this money phase. Then this session verifies every finding against the
catalogue, this plan and the code, fixes the confirmed ones, re-greens, and records the pass. Do not
re-raise anything settled in the Decisions log except the rulings this phase explicitly supersedes.

**Steer this phase's reviewers at:**

- **Every creation path stores a Contract:** manual, photo, phone advice, HL7/FHIR S12, PDF row,
  Copy, add procedure and addendum. The only "no Contract" outcome left is a validation failure or
  a `noContract` run exception, never a silent default at billing time.
- **The filter matches the catalogue:** no out-of-scope Contract is offered or accepted by the store
  (the UI cannot bypass `setProcedureContract`), the default is always offered, "None" is gone
  everywhere, and no insurer-held Contract is offered for an insurer that does not accept direct
  claims.
- **Parity:**
  - Item 1's fixtures pass unchanged.
  - The holder-as-payer interim reproduces every seeded payer.
  - `funderOverride` still splits Prentice.
  - The pre-payment builders give the same deposit and full amounts.
  - `rng()` draw order in the filler generator is unchanged.
- **Audit completeness:** `procedure.contract`, `procedure.contractDefault` (one per re-defaulted
  Procedure, in the same commit as the List edit), `card.prepayment` and funding edits all carry
  before and after. The anaesthetist-change record survives a reload.
- **Rights:** the anaesthetist changes Contracts only on their own DRAFT Lists; the office on DRAFT
  and SUBMITTED; nobody on AUTHORISED. `setBookingPrepayment` is office only and locked once a
  pre-invoice exists.
- **Leftovers:** no remaining route or category vocabulary in code, copy, audit labels, shots or the
  demo guide (the item 8 grep). The stored-Contract fallback and `contractIneffective` are
  deliberately kept for Phase 25.

## PROGRESS.md updates

- Status row for catch-up Phase 20, and a phase entry: drift-check result, D2 answer or default,
  what 18 and 19 were found to provide, the session 1 and session 2 split, the adversarial pass,
  the tests added (contract selection, parity, store actions), `PERSIST_VERSION` old to new, and the
  broken capture recipes.
- Decisions log:
  - **Superseded:**
    - The route model: 3rd review #1 (office route-setting and the mobile initial route); the
      Phase 08 decisions (1) and (2) on resolution by route and the contract-less billable-party
      route; 6th review #2 (insurer route direct-claims check).
    - Payment categories: 2nd review #5 and 7th review A2.
    - "The Card-level pre-payment flag is derived, never stored" (7th review B6), now an interim
      office-set flag.
    - The ACC review advisory (6th review #3), if 18 had not already removed it.
  - **New provisional readings:**
    - An unset Booking value does not exclude a Contract.
    - An insurer-held Contract is not offered while its insurer does not accept direct claims
      (replaces the 6th review #2 validator check).
    - A List with no hospital defaults to RVG Default Post-paid.
    - An added Procedure starts on the first Procedure's Contract when in scope.
    - A hospital change re-defaults only defaulted Procedures.
    - An office re-pick clears a pending anaesthetist change until Phase 21's approval.
    - Holder-as-payer and the Booking pre-payment flag are interims, with the phases that replace
      them.
