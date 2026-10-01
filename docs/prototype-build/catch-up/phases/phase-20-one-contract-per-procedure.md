# Phase 20 · One Contract per Procedure

**Requirements covered:**
[EP-04](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/EP-04.md) (the route half; billable party lands in 21, the lock in 25),
[FT-04.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-04.3.md) (Verify),
[US-04.3.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.3.1.md),
[US-04.3.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.3.2.md) (Verify; holder-code search AC),
[US-04.3.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.3.3.md),
[FT-03.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-03.4.md) (Contradicts; the change-and-flag half, office approval lands in 21),
[US-03.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.4.1.md),
[US-03.1.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.1.2.md),
[US-03.2.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.2.3.md);
[DM-10](../analysis/domain-model-delta.md#dm-10) (one Contract per Procedure, procedure first,
narrowed by hospital), [DM-12](../analysis/domain-model-delta.md#dm-12) (insurer and funding source
on neither Booking nor Patient; replaces the old DM-35 "on the Booking"),
[DM-37](../analysis/domain-model-delta.md#dm-37) (anaesthetist Contract change flagged, derived from
audit); [RV-08](../analysis/reverse-check.md) (route and payment category part; the Type 1/2/3
relabel landed in 18).
**Leans on, not covered:** [US-15.0.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-15.0.1.md)
(keep the anaesthetist's view free of Contract complexity: this phase builds its picker and Contract
row to that rule; the wider sweep is 43a), [US-04.1.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.1.4.md)
(18's AA identifier, shown in the picker), [US-04.2.11](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.11.md)
(combination Contracts: the picker rule offers them, 23 seeds them).
**Depends on:** Phase 19 (and through it 18's Contract shape: category, holder, scope filters,
pricing basis, `aaCode`, fee-schedule lines with holder codes; 19's master procedure list,
procedure-first capture picker, RVG groups and base-unit resolver; 15a's warning routine; 15's
Booking vocabulary; 14's trigger registry).
**Blocked by (open, build the recommendation):** [OQ-66](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-66.md)
(how thousands of Contracts are coded and found).
**Estimated:** 2 sessions. Session 1: work items 1 to 9 (figures pinned, model, engine, store, seed),
ending green with the UI edited only as far as it must compile. Session 2: items 10 to 18 (picker,
sheets, review, copy, shots, demo guide). Tight for an XL change: session 1 carries the seed remap
and fourteen test files. If it overruns, finish green on items 1 to 7 and 9 and open session 2 with
item 8's label sweep; never defer the parity pin or the seed remap.

## Goal

Pricing becomes one decision. `BillingRoute`, `PatientPaymentCategory` and `Procedure.insurerId`
are removed, and with them the engine's route resolution and route-based payer derivation. Per
owner decision D2 (OQ-55, answered 2026-10-01), insurer and funding source are held on **neither the
Booking nor the Patient**: the Procedure's Contract says who pays, one Booking can have Procedures on
different Contracts, and nothing replaces `insurerId`.

Every Procedure carries exactly one Contract. The Scheduling Engine defaults it to the RVG Default
Hospital Contract for the List's hospital when the Booking is created and again when the hospital
changes, and a Booking cannot be marked complete without one. After the procedure pick (Phase 19),
anaesthetists (mobile and web) and the office choose the Contract from a picker that shows the
Contracts set against that procedure, narrowed by the List's hospital, with the default always
offered first and no "None". A typed holder code (the catalogue's example is `8942`; in the seed,
Phase 18's CES HNZ codes such as `HNZCATall`) filters the list, and each row shows the Contract's AA
identifier. Contracts will number in the
thousands (OQ-66), so the picker is filtered and searchable, never a flat select.

The anaesthetist's view stays simple (US-15.0.1): the Contract shows as a plain name with a teal
"Change", with no route chip, insurer, payer or pricing basis. The office sees the full detail. An
anaesthetist's Contract change is recorded and flagged for the office at review, derived from the
audit trail (DM-37).

Three interims keep the demo whole until later phases replace them, each labelled in code comments
and the Decisions log:

- **Payer = the selected Contract's holder** (a patient-direct holder bills the Procedure's guardian
  override, else the patient) until Phase 21 stores a billable party with its override.
- **`funderOverride` stays the two-funder split** (Prentice, S3) until Phase 22's Contract payment
  setting (full or split) replaces it.
- **Prepayment is an office-set flag on the Booking** until Phase 27 derives it from the
  anaesthetist's prepaid set. The office sets it on or off (all or nothing, US-06.2.2); the seeded Riley
  $800 deposit stays as data so S4's figures hold until 27 retires deposits. The flag feeds 15a's
  unpaid-prepayment warning, never a completion gate (D5).

S3 figures must not move, and holder-as-payer must reproduce today's payer for every seeded
Procedure.

> Names below are the July names (`Card`, `createCard`, `cardActions.ts`, `CardDetailBody`).
> Phase 15 renamed Card to Booking; use the renamed identifiers and files. Likewise use Phase 18's
> names for the Contract fields (category, holder, scope filters, pricing basis, `aaCode`, fee
> schedule lines) and Phase 19's names for the master procedure list and the Procedure's link to it
> (planned as `ProcedureType` and `procedureTypeId`).

## Before you start: drift check

1. Run:

   ```
   git diff 501b0b8 -- "docs/discovery-reference/Updated Requirements/catalogue" "docs/discovery-reference/Updated Requirements/domain-model.md"
   ```

   Look for changes to EP-04, FT-04.3, US-04.3.1, US-04.3.2, US-04.3.3, FT-03.4, US-03.4.1,
   US-03.1.2, US-03.2.3, and to the items this phase leans on: US-04.1.1 (categories, especially the
   RVG Default Post-paid category and the "Booking's billable party" holder), US-04.1.4, US-04.2.1
   (scope filters, including procedures), US-04.2.11, US-04.3.4, US-05.1.6, US-07.2.2, US-11.2.2,
   US-11.4.2, US-15.0.1, OQ-55, OQ-66, OQ-67 and the domain model's Contract and "Selection"
   sections. If an item changed, re-read it and adjust the work items. If one is now Retired or
   Future, drop it from this phase and record that in the PROGRESS entry.
2. **Owner decision D2 is answered** (OQ-55): neither the Booking nor the Patient holds an insurer or
   funding source. Build that. If OQ-67 (who a Contract belongs to, the fall-through for who pays)
   has been answered since, read it: an answer that makes insurer or funding source a picker input
   again changes item 3; record it in the PROGRESS entry.
3. **OQ-66 is open.** Build its recommendation: the picker filtered by procedure and hospital, with
   search by AA code and holder code. Label it provisional in one place only (the office picker's
   footer caption, item 10) and in the Decisions log. If OQ-66 is answered, build the answer instead.
4. **Confirm what 15a, 18 and 19 actually delivered** (their PROGRESS entries): the category names;
   how a patient-direct holder ("the Booking's billable party") is modelled; the scope fields and
   whether a procedure filter exists yet (US-04.2.1 now lists procedures; planned as 18's
   `scope.procedureTypeIds`, typed by 19, empty meaning all procedures); 18's
   `SCOPE_NARROWING_DIMENSIONS` constant and its `contractSearch` helper; `aaCode`; holder codes on
   the fee schedule lines; 19's `scope.rvgGroups` and `scopeCoversProcedure`; the master procedure
   list, the Procedure's link to it, 19's `pickProcedure` action and the procedure-first capture
   picker (`ProcedurePickerSheet`); 15a's warning routine, its `WARNING_SAMPLES` prepayment sample
   (planned to stage the condition through the route and payment-category fields this phase
   deletes), and that the prepayment completion gate, `overridePrepaymentGate` and
   `PrepaymentOverrideSheet` are gone (15a deletes them, D5); and whether `accRelated` and the
   route-keyed ACC review advisory survived 18. The work items below say what to do in either case.
5. Record the result (including "no drift") in the PROGRESS entry.

## Reference

- **Design** (convention 17): `docs/design/Design Language.dc.html` (tokens; neutral pills for
  Contract and category chips; teal is the only action colour, so the picker's selected tick and
  "Change" links are teal, never crimson); `docs/design/Mobile App.dc.html` (card detail anatomy:
  white cards with micro-cap headings, 14px radius, bottom-sheet rows for choices, the code picker
  sheet's search field); `docs/design/Admin Review.dc.html` (review table; its mock ROUTE column is
  anaesthetic technique and its CONTRACT column shows who pays, which is the layout this phase moves
  to); `docs/design/Admin Day.dc.html` (drawer and card-detail chrome). No mockup covers the
  Contract picker: extend the mobile bottom-sheet list pattern with the code picker's search field,
  rendered as a Dialog on web and admin.
- **Catalogue:** the covered files above, plus US-04.1.1, US-04.1.4, US-04.2.1, US-04.2.11,
  US-04.3.4, US-05.1.6, US-07.2.2, US-11.2.2, US-11.4.2, US-15.0.1, OQ-55, OQ-66, OQ-67, the note
  `catalogue/notes/2026-10-01-aa-meeting-with-greg.md` (#10, #27, #29, #51) and `domain-model.md`
  ("Contract", "Selection", "Patient and billable party").
- **Gap analysis:** `GAP-ANALYSIS.md` (Summary, themes 1 and 5, "Structural first" step 3, the DM-10,
  DM-12, DM-37 and RV-08 rows); `epics/EP-04.md` and `epics/EP-03.md` for these items;
  `gaps.json` entries (FT-03.4 is now Contradicts: the anaesthetist cannot change the Contract at
  all today); `analysis/domain-model-delta.md` (DM-07, DM-10, DM-11, DM-12, DM-13, DM-20, DM-31,
  DM-37); `analysis/reverse-check.md` (RV-01, RV-08, RV-20).
- **Code entry points** (July line numbers, from `analysis/prototype-map-*.md`, re-checked):
  - `src/domain/types.ts` 409 to 484 (`BillingRoute` 409, `PatientPaymentCategory` 416,
    `PrepaymentDetail`, `Procedure` 444 with `insurerId` 460 and `accRelated` 477), 370 (`Card`),
    300 (`List`, `hospitalId` optional), 216 (`Contract`), 645 (`AuditEntry`: who, role, before,
    after, atISO).
  - `src/domain/billing/invoiceBuild.ts`: `defaultContractFor` 86 (private, the expiry fallback),
    `resolveContractForProcedure` 114 (the `noBillingRoute` exception 180), `counterpartyForProcedure`
    192, `buildPrePaymentInvoiceForCard` 456; `validateCardForBilling.ts` (`billingReferenceMissing`
    49, the insurer-route direct-claims check 166 to 181, category 188, prepayment 204 to 215);
    `contracts.ts` (`selectContract`); `fixtures.ts`.
  - `src/store/cardActions.ts` (`createCard` 70, `copyCard` 179, `addPostOpAddendum` 270,
    `addProcedure` 394); `lifecycle.ts` (`editRefusal` 48, `editCard` 415, `editProcedure` 445,
    `editList` 498, `reassignCard` 640); `integrationActions.ts` (S12 create 150, `ingestPdfRow` 431,
    its `createCard` 464); `prepaymentActions.ts`; `selectors.ts` (`cardRequiresPrepayment` 307,
    receivable rows' ACC flag 634, `billingContextForCard` 837); 15a's `warningSamples.ts`
    (`WARNING_SAMPLES`, the prepayment sample); `mastersActions.ts`
    (`setInsurerDirectClaims` 102, feeds item 3's direct-claims rule); `contractActions.ts` (the
    delete guard on `governingContractId` 158, unchanged); `billingLineActions.ts` 77 (reads the
    stored Contract, unchanged).
  - Phase 18 retypes the Contract (`holder` union with kinds `hospital`, `surgeon`, `surgeonGroup`,
    `insurer`, `bookingBillableParty`; `category`; `scope` arrays; `pricingBasis`; `aaCode`; fee
    schedule lines with `holderCode`) and adds `holderCounterparty`, `holderMatches`, `isRetired`,
    `contractSearch` and `SCOPE_NARROWING_DIMENSIONS` in `domain/billing/contracts.ts` (and
    `types.ts`). The July `holderType`/`holderId` fields in the analysis files no longer exist.
    Phase 19 adds the master procedure list (`ProcedureType`, `Procedure.procedureTypeId`),
    `scope.rvgGroups`, `scopeCoversProcedure(scope, procedure, masters)`, the `pickProcedure` store
    action and the procedure-first capture picker (`ProcedurePickerSheet`).
  - `src/shared/flows/EditProcedureSheet.tsx`, `EditBillingSetupSheet.tsx`, `ManualCardForm.tsx`
    (route state 65, submit 120), `PhotoCaptureFlow.tsx`, `sampleExtractions.ts` (sample B 45);
    `src/shared/card/OfficeBillingSetup.tsx` (category map 23,
    `billingReferenceMissing` 47), `CardDetailBody.tsx`; `src/shared/capture/BtmCaptureBlock.tsx`
    (`ROUTE_LABEL` 17, `CONTEXT_FIELDS` 24, context line 111 to 115 and 186 to 206), `feeContext.ts`;
    `src/shared/format.ts` (`ROUTE_LABELS`, `routeLabel`); `src/shared/audit/` (`fieldLabels.ts`,
    `actionLabels.ts`).
  - `src/apps/admin/reviewFlags.ts` (reference flag 81, ACC advisory 84), `screens/ReviewScreen.tsx`
    (Route column 78, `routeText` 97), `screens/BillingMonitorScreen.tsx` (`resolveAndRetry` failure
    codes, unchanged), `screens/InvoiceDocument.tsx` (`PaymentCategoryNote` 149 and 496),
    `flows/PhoneAdviceBooking.tsx` (S2 prefill 33: route and `I-NIB`);
    `src/apps/mobile/screens/ListDetailScreen.tsx`, `BalancesScreen.tsx`;
    `src/apps/web/screens/ListDetailView.tsx`, `AccountsScreen.tsx`.
  - Seed: `src/domain/seed/cards.ts` (`ProcedureSpec` 228, Marsh nib insurer route 371, two-funder
    Prentice 606, Doyle bariatric 682 and 692, Aria 712 and 865, Webb AIA reimbursement 722, Riley
    split $800 816, Nair full 899, Morrison 417 to 475, filler route draw 1150), `contracts.ts`,
    `cast.ts` 122 (nib direct claims, AIA not), `history.ts`, `audit.ts`, `billing.ts`, `index.ts`
    (scenario marker `insuredReimbursementCard` 624).
  - Tests that name routes today: `reviewFlags.test`, `invoiceBuild.test` (176), `prePaymentInvoice.test`,
    `validateCardForBilling.test`, `seed.test`, `billingRun.test` (222), `captureActions.test`,
    `cardActions.test`, `postOpAddendum.test`, `btmCapture.test`, `prepayment.test`,
    `mastersActions.test`, `auditNarrative.test`, `demoScenarios.test`.
  - Shots: `visual/mobile-interactions.spec.ts` (146 clicks "Billing route"),
    `admin-phase06.spec.ts` (office billing setup), `admin-phase07.spec.ts` (review table).
    Catalogue capture recipes: `requirements-board/capture/recipes/US-03.1.2.json`, `US-03.2.3`,
    `US-03.4.1`, `US-04.3.1` to `US-04.3.5`.

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
     `Procedure.insurerId`, `Procedure.patientPaymentCategory` and `Procedure.prepaymentDetail`.
     Nothing replaces `insurerId`: no `insurerId` or `fundingSource` goes onto the Booking or the
     Patient (D2). Leave `accRelated` as Phase 18 left it; it is not this phase's business.
   - Booking (`Card`) gains `prepayment?: PrepaymentDetail`, commented "INTERIM office-set flag,
     replaced by Phase 27's derivation". Keep today's `PrepaymentDetail` shape (full, or split with a
     deposit) only so the seeded Riley deposit keeps its figures; Phase 27 removes the split. Move the
     `PrepaymentDetail` comment accordingly.
   - Procedure keeps `governingContractId`. It stays optional in the type only so that a legacy or
     moved Procedure fails validation as data; every creation path sets it. Procedure gains
     `contractSetBy?: 'default' | 'office' | 'anaesthetist'`, which only tells a re-default which
     Procedures to move. Who changed it, when, and from what is **not** stored: it comes from the
     audit trail (DM-37). `billablePartyId` stays on the Procedure as the guardian override, INTERIM
     until 21.
   - **Contract procedure scope.** 18 planned `scope.procedureTypeIds` and 19 its type, editor chips
     and `scopeCoversProcedure`. If the drift check finds either missing, add it here
     (`ProcedureTypeId[]`, empty = every procedure), with a chip select in 18's Contract editor beside
     RVG codes and groups, and an audit label. It stays empty on every Contract except where item 7
     sets it.
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
     (18's category `rvgDefaultHospital`) for `hospitalId`, in effect on `dateISO`. The catalogue
     says the hospital is always known; the prototype still has Lists with no hospital, so for those
     use the RVG Default Post-paid Contract (18's `CT-RVG-POSTPAID`) and log the reading.
   - `contractOptionsFor({ contracts, feeScheduleLines, insurers, masters, holderNameOf }, ctx, query?)`
     returns `{ default, others, total }`. A Contract is offered when:
     - it is in effect on `dateISO` and not retired (18's `isRetired`);
     - **procedure, code and group:** 19's `scopeCoversProcedure(scope, procedure, masters)` is true
       (all three arrays empty, or the Procedure's master entry listed, or its RVG code listed, or
       its code in a listed group). A Procedure with no master entry and no code sees only Contracts
       with all three empty. A Contract set against several procedures is offered for each (this is
       how 23's combination Contracts appear, US-04.2.11 AC). Do not write a second procedure or
       code matcher;
     - **hospital:** its hospital scope is empty or lists the List's hospital; on a List with no
       hospital, only hospital-unscoped Contracts;
     - **anaesthetist:** its anaesthetist scope is empty or lists the List's anaesthetist (US-04.2.1);
     - an insurer-held Contract is not offered while its insurer does not accept direct claims
       (`Insurer.acceptsDirectClaims`). This replaces the validator's retired insurer-route check
       (6th review #2), so a non-direct-claim insurer is never invoiced.

     The scope's insurer, funding-source and surgeon arrays are kept on the Contract (they describe
     it, OQ-67) but do not narrow the picker. The default is always offered and listed first
     (US-04.3.2), even when a query is typed. Order the others by category, then name.
   - **Search** (US-04.3.2 AC, OQ-66): reuse 18's `contractSearch` (AA code, name, holder name,
     each line's holder code and description), as 18's handoff says; do not add a second matcher.
     `contractOptionsFor` runs it over the in-scope set only, never across every Contract. A Contract
     whose holder code equals the trimmed query (case-insensitive) sorts first, and each result
     carries the matched line (`"HNZCATall · Cataract, all"`) so the UI can show why it matched.
   - `isContractInScope(contract, { insurers, masters }, ctx)` uses the same rule (no query), for flags and store
     guards.
   - Tests cover: the US-04.3.2 example (a St George's Contract is never offered on a Southern Cross
     List); each dimension (procedure: Doyle's bariatric Contract only for its bariatric entries, and
     a three-procedure fixture Contract offered for each of the three; hospital; RVG code and group;
     anaesthetist, Aria only for Souter and Fitzgerald; surgeon scope never narrows); nib's insurer
     Contract offered at any hospital with no patient input; the direct-claims exclusion (toggle nib
     off with `setInsurerDirectClaims`: its Contract drops out); effective dates and retired; the
     no-master-entry rule; the no-hospital default; holder-code search on a Christchurch Eye Surgery
     context (`HNZCATall` filters to the CES HNZ schedule with its matched line, its `aaCode` too, a
     miss returns only the default, and the same code on a Southern Cross List finds nothing because
     search stays in scope); deterministic order. Add a
     seed assertion: every hospital-held Contract lists its holder in its hospitals scope. Phase 18
     set `hospitalIds` only on the five defaults, so expect to add it to SXAP, Health NZ, St George's
     ACC and the CES HNZ schedule in the seed.
4. **Validator** (`validateCardForBilling.ts` + test; US-04.3.1):
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
     depends on it, and so does `BillingMonitorScreen`'s `resolveAndRetry` (unchanged). RV-01's lock
     is Phase 25.
   - `counterpartyForProcedure(procedure, contract, patientId)` becomes holder-as-payer, commented
     INTERIM until Phase 21, by dropping the route switch around 18's `holderCounterparty`: a
     `bookingBillableParty` holder (RVG Default Post-paid, Aria) bills `billablePartyId`, else the
     patient; any other holder bills itself (hospital, insurer, surgeon, or the surgeon group's
     billing organisation, so COS stays `{ kind: 'organisation', id: ORG.cos }`). `funderOverride`
     lines behave as today.
   - `buildPrePaymentInvoiceForCard` reads the Booking's `prepayment` and covers the Booking's
     Procedures that bill the patient (OQ-73: patient billable only):
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
       apply to this procedure at this hospital.").
     - Sets `contractSetBy` from the actor's role and writes an audited `procedure.contract` entry
       with `before`/`after` Contract ids. The audit entry's role is what flags the change (item 6's
       selector); nothing else is stored.
     - Remove `governingContractId`, `contractSetBy` and every deleted field from `ProcedurePatch`,
       so `editProcedure` cannot bypass it.
   - **Default at creation (US-04.3.3):**
     - `createCard` drops `billingRoute`, `insurerId` and `patientPaymentCategory`.
     - It gains optional `contractId` (an explicit pick, checked like `setProcedureContract`) and
       `billablePartyId` (interim).
     - With no pick, it stores `defaultContractForBooking` for the List with
       `contractSetBy: 'default'`.
     - This covers the manual, photo, phone-advice, HL7/FHIR S12 (`integrationActions.ts` 150) and
       PDF (`ingestPdfRow` 431) paths, and Phase 15's skeleton Copy.
     - `addPostOpAddendum` copies the original Procedure's Contract and not the Booking's
       pre-payment flag (until 39 replaces it).
   - **`addProcedure` (US-03.2.3):** the new Procedure starts on the first Procedure's Contract when
     that Contract is in scope for it, else on the default, with `contractSetBy: 'default'`, and can
     then select its own. Inheriting stops a guardian-paid Booking's second Procedure silently
     billing the hospital; log the reading.
   - **Hospital or procedure change:**
     - `editList` with `hospitalId` re-defaults every Procedure with `contractSetBy: 'default'` on
       the List's non-cancelled Bookings, in the same commit, one `procedure.contractDefault` audit
       meta each. `reassignCard` onto a List with a different hospital does the same.
     - 19's `pickProcedure`, and `editProcedure` when it changes `rvgBaseCode`, do the same for that
       one Procedure, in the same commit.
     - Explicit picks are kept, and item 13's caption shows any that no longer apply.
   - **Prepayment flag:** add `setBookingPrepayment(api, actor, bookingId, on: boolean)` in
     `prepaymentActions.ts`.
     - Office only; refused on AUTHORISED or billed Lists.
     - On sets `{ type: 'full' }` (all or nothing, US-06.2.2); off clears it. There is no deposit
       input.
     - Refused when no Procedure on the Booking bills the patient (`noPatientBilled`, "No procedure
       on this booking bills the patient.").
     - Changing or clearing is refused once a pre-payment invoice exists (`prepaymentInvoiced`).
     - Audited `booking.prepayment` (Phase 15 renamed every `card.*` action to `booking.*`).

     Also:
     - `cardRequiresPrepayment` (15's name) reads the Booking's `prepayment`, and so does 15a's
       unpaid-prepayment warning rule (repoint its input; its wording and strength do not change).
     - `raisePreProcedureInvoice` refusal copy reads "This booking is not flagged for pre-payment."
     - Re-point 15a's prepayment entry in `WARNING_SAMPLES` (`warningSamples.ts`), which stages the
       condition through the route and payment-category fields deleted here: `stage` sets the
       primary Procedure to the RVG Default Post-paid Contract with `setProcedureContract` and then
       calls `setBookingPrepayment(on)`, both as the demo office actor; `unstage` restores the
       Booking's `prepayment` and the Procedure's Contract fields from the pristine seed, as 15a's
       unstage already does. Phase 27 re-points it at the prepaid set. Update its test.
     - 15a deleted the completion gate, `overridePrepaymentGate` and `PrepaymentOverrideSheet` (D5).
       Do not re-introduce a gate. If any of them survived, stop and record it rather than build
       on it.
   - **Selectors:**
     - `contractOptionsForProcedure(state, procedureId, query?)` and
       `payerForProcedure(state, procedureId)` wrap the pure functions for the UI.
     - `anaesthetistContractChange(entries, procedureId)` (pure, in `contractSelection.ts`) reads the
       audit trail: when the latest `procedure.contract` entry for that Procedure has the
       anaesthetist role, it returns `{ who, atISO, fromContractId, toContractId }`, else nothing.
       An office pick after it clears it (interim until Phase 21's explicit approval). The store's
       `pendingContractChange(state, procedureId)` wraps it.
7. **Seed** (`seed/cards.ts`, `history.ts`, `audit.ts`, `contracts.ts`, `index.ts`):
   - `ProcedureSpec` loses the route, insurer and category fields, and `addCard` takes `prepayment`.
     If Phase 18 seeded no RVG Default Post-paid Contract, add one: protected default, patient-direct
     holder, RVG units at the anaesthetist's rate, organisational scope, effective 2020-01-01.
   - Map every seeded Procedure:

     | Today | After this phase |
     |---|---|
     | Hospital route with a stored Contract | Same Contract. Any informational insurer is dropped |
     | Insurer route, nib (Marsh, filler) | nib's insurer Contract |
     | Billable-party route, self-funded, no Contract | RVG Default Post-paid; guardian override stays on the Procedure |
     | Billable-party route, insured reimbursement (Webb, AIA) | RVG Default Post-paid; AIA stays only in the description |
     | Billable-party route, pre-payment (Riley split $800, Nair's rhinoplasty full) | RVG Default Post-paid; Booking `prepayment` {split, 800} and {full}; Nair's septoplasty stays on Forte's default |
     | Billable-party route under the Aria hourly Contract | Same Contract |
     | `history.ts` patient-route history | RVG Default Post-paid; the rest keep their hospital default |

   - The filler generator keeps the same `rng()` draw order and count (the route draw becomes the
     Contract draw), so no other generated data shifts.
   - Seeded specific Contracts get `contractSetBy: 'office'`; defaults get `'default'`.
   - Set the procedure scope where the seed needs it: Doyle's bariatric Contract against the
     bariatric master entries 19 seeded (add one if none fits), and Aria's against its laser entry if
     19 seeded one. Leave every other Contract procedure-unscoped.
   - Run item 3's scope check over every seeded Procedure, and resolve each out-of-scope pick: the
     Doyle bariatric Booking (Mills, Fitzgerald Tue 14 Southern Cross / Mr Doyle) needs its
     Procedures linked to those master entries; check the three SXAP picks (Ellison is on Souter
     Tue 21 PM), Aria's anaesthetist scope, and each ACC and Health NZ pick against its List's
     hospital. Prefer correcting the seed's scope or the master link in a way that leaves item 1's
     figures unchanged, and log each call.
   - Seed one anaesthetist change for the review demo, with no figure change: on Dr Morrison's
     submitted Mon 20 St George's List, the Procedure already on St George's ACC (the 10:00
     "Ureteroscopy with lithotripsy, ACC claim", ref ACC45-118203, `morrisonSpecs`) gets
     `contractSetBy: 'anaesthetist'` and a `procedure.contract` audit row by Dr Kate Morrison
     (anaesthetist role) from St George's default to St George's ACC, timed before the List's
     13:10 submit. Its Contract, fee and payer are unchanged, so item 1's fixtures hold.
   - Regenerate `audit.ts` histories so `procedure.create` and `procedure.update` entries carry
     Contract fields, not routes.
   - Rename the scenario marker `insuredReimbursementCard` (`index.ts` 624, `billingRun.test` 222;
     Phase 15 may have renamed it) to `aiaClaimBooking`.
   - Bump `PERSIST_VERSION` by one from its post-19 value, with a comment line.
8. **Remove the retired vocabulary (RV-08):**
   - `ROUTE_LABELS` and `routeLabel` (`format.ts`); the route and category maps in
     `BtmCaptureBlock`, `OfficeBillingSetup`, `EditProcedureSheet`, `EditBillingSetupSheet`,
     `ManualCardForm` and `InvoiceDocument`; the insurer selects and their " (direct claims)" suffix
     in `EditProcedureSheet`, `EditBillingSetupSheet` and `ManualCardForm`.
   - The ACC-on-billable-party review advisory (`reviewFlags.ts` 84), if 18 left it: it is keyed on
     the route and goes with it.
   - In `shared/audit/`, add labels: fields `governingContractId` "Contract", `contractSetBy`
     "Contract set by", `prepayment` "Pre-payment"; actions `procedure.contract` "Contract changed",
     `procedure.contractDefault` "Contract set to the default", `booking.prepayment` "Pre-payment flag
     set". Drop labels for the removed fields.
   - Gates:
     `grep -rnE "billingRoute|BillingRoute|patientPaymentCategory|PatientPaymentCategory|ROUTE_LABELS?|routeLabel|noBillingRoute|insuredReimbursement|selfFundedPrepayment|selfFundedPostProcedure" aa-prototype/src`
     returns nothing, and every remaining `insurerId` hit in `aa-prototype/src` is the Insurer
     master, a Contract holder or scope, or a `funderOverride`.
9. **Session 1 exit:** fix all the listed tests (`fixtures.ts` too, and 15a's warning-sample test).
   Edit the UI only as far as
   compiling needs: route, insurer and category controls removed, and the Contract shown read-only
   where the route chip was. Run `npm run build`, `npm run build:pwa` and `npx vitest run`, all
   green; item 1 passes. Write a short "session 1 done" note in the PROGRESS entry.

**Session 2: UI, review, copy.**

10. **Shared `ContractPickerSheet`** (`src/shared/flows/`, through `useSurface().Overlay`, so a
    bottom sheet on mobile and a Dialog on web and admin; `data-shot="contract-picker"`):
    - A search field at the top, "Search by name, AA code or holder code", feeding
      `contractOptionsForProcedure`'s query.
    - Sections "Default for <hospital>" (or "Default for AA rooms"), then "For <procedure> at
      <hospital>". The heading reads "Other Contracts at <hospital>" while the Procedure has no
      master entry.
    - Rows by viewer:
      - **anaesthetist** (US-15.0.1): the Contract name and its AA code, nothing else;
      - **office**: also a neutral category pill, the pricing basis in words ("RVG units at your
        rate", "Agreed rate $26.50 per unit", "Fixed price list", "Hourly rate") and "Bills
        <holder>".
      - A holder-code match adds the matched line as a mist caption ("HNZCATall · Cataract, all")
        for both viewers.
    - Render at most 50 rows, with "Showing 50 of <n>. Type to narrow." below. The office footer
      carries the one provisional caption: "Provisional · how Contracts are coded and found is still
      to confirm (OQ-66)".
    - The selected row carries a teal tick. Tapping a row calls `setProcedureContract` and shows any
      refusal verbatim. Empty states: "No other Contracts for this procedure at <hospital>." and
      "No Contract matches "<query>"." There is no "None".
11. **Anaesthetist edit (US-03.4.1, FT-03.4)**, in `EditProcedureSheet` (mobile and web, DRAFT
    only):
    - The fields are 19's procedure pick, a Contract row (plain name, teal "Change" opening the
      picker), and Billing reference (interim, optional).
    - Caption: "The office checks Contract changes when you submit the list."
    - The route segmented control, insurer select and payment category are gone.
12. **Showing the Contract (US-03.1.2, US-04.3.3):**
    - In `BtmCaptureBlock` the route chip becomes a neutral Contract chip (for example "St George's
      RVG Default Hospital", 18's name).
      - On anaesthetist views (mobile and web) the line is that chip, a teal "Change" on a DRAFT List
        and the billing reference. No route, insurer, payer or pricing basis (US-15.0.1).
      - On the office's view the line reads chip · AA code · pricing basis · "Billed to <payer>"
        (interim, holder derived) · reference.
    - A pending anaesthetist change (item 6's selector) adds a small warning-tint pill "Changed by
      you · office to check" on anaesthetist views, and "Changed by anaesthetist" on the office's.
    - `CONTEXT_FIELDS` swaps the route and insurer fields for `governingContractId`.
    - List rows on mobile `ListDetailScreen` and web `ListDetailView` add the primary Procedure's
      Contract name as a one-line mist caption, so the Contract is visible before the session.
13. **Booking Contract checks and pre-payment** (`CardDetailBody`):
    - When a Procedure's stored Contract no longer applies (after a hospital or procedure change, or
      the insurer's direct claims turned off), it shows "This Contract no longer applies to this
      procedure." with a teal "Choose Contract" link, on every editor's view.
    - The office sees a "Pre-payment" row ("Not required", "Full estimate" or, for the seeded Riley
      Booking only, "Deposit $800 · seeded") with "Set pre-payment", which opens a new
      `PrepaymentFlagSheet` (`src/shared/flows/`): one switch, "Pre-payment required", and the line
      "The full estimate is invoiced before the procedure." It calls `setBookingPrepayment`. The
      anaesthetist keeps 15a's warning triangle and today's banner.
14. **Office billing setup** (`OfficeBillingSetup`, `EditBillingSetupSheet`; US-04.3.2 office side):
    - The rows become Contract (name, AA code, category), Payer (holder derived, or the guardian on
      a patient-direct Contract), Reference, Override and Funders. The Route, Category and Insurer
      rows are gone.
    - The sheet becomes "Contract and payer": a Contract row opening the picker, the guardian select
      with "New guardian" shown only on a patient-direct Contract (interim), and the billing
      reference.
    - Save calls `setProcedureContract` when the Contract changed, then `editProcedure` for the rest.
15. **Creation forms:**
    - `ManualCardForm`'s "Billing route" block becomes a "Contract" row after 19's procedure pick,
      preselected with the List hospital's default and changeable through the picker (the List's
      hospital and anaesthetist plus the picked procedure feed the filter). No insurer or funding
      field.
    - The payer select shows only for a patient-direct Contract (office; interim).
    - `sampleExtractions` sample B prefills nib's insurer Contract instead of insurer nib.
    - `PhoneAdviceBooking`'s S2 prefill drops `billingRoute` and `insurerId`, so the booking lands
      on St George's default exactly as S2 shows today.
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
      `admin-phase07.spec.ts`, keeping `data-shot="procedure-contract"`; add a shot of the picker
      with a holder-code query typed.
    - Edit the Control Panel's existing S1 scenario text (add nothing new to that page) and the
      description of Phase 14's re-homed "Fire hospital message" entry.
    - The catalogue screenshots, including re-capturing the recipes this phase breaks, are the
      standing "Catalogue screenshots" step below: run it after the review pass and list the
      recipes it re-pointed in PROGRESS.

## Demo triggers

No new harness-bar button. Everything in this phase demos through normal use: the picker, the edit
sheets and the review screen. This phase adds no warning rule, so 15a's "Raise sample warnings"
needs no new sample, but its existing prepayment sample is re-pointed at the Booking flag (item 6) and
must still stage and clear on Admin Day and Booking detail.

- **Re-homed "Fire hospital message" (S1)**, Phase 14's `fire-hospital-message` entry (Integrations
  sim, Admin · Integrations and Mobile · Lists; bar and PWA, so S1 fires it on a handset too): the new
  Booking for Sarah Mitchell now arrives on St George's default Contract, visible on mobile, web and
  admin. Update the entry's description text only.
- **"Trigger billing failure" (S4 Beat 3)** keeps working unchanged: the COS Contract is still the
  stored pick and still dates out to `contractIneffective`. Check it after item 7.
- **PWA:** no new entry. The anaesthetist's Contract change needs no office step to demo on a
  handset. The office-approval stand-in "Office approves this Contract change" is Phase 21's. Check
  that any Phase 14 or 15a PWA entry touching pre-payment still works against the Booking flag.

## Out of scope

- Billable party and invoice email on the Booking, invoice grouping by billable party, the child
  billable-party warning, required inputs (member number, claim reference, purchase order), the
  not-on-schedule flag (US-04.3.7), the office's explicit approval of every Contract at review
  (US-07.2.2) with its PWA stand-in, and the Contract-holder flag that brings back US-11.4.2's
  "claim from your insurer" wording. All Phase 21.
- Insurer or funding source as a picker input, or held on the Booking or the Patient (OQ-55 says
  neither; OQ-67 is open on who a Contract belongs to).
- Narrowing the picker by surgeon (raised in passing, not settled).
- The Contract payment setting replacing `funderOverride`, and Contract-driven invoice layout,
  delivery and GST: Phase 22.
- Seeding combination Contracts, the primary Procedure, the multi-procedure rule and Contract
  base-unit overrides: Phase 23.
- The lock at AUTHORISED and removal of the expired-Contract fallback and re-resolution (RV-01):
  Phase 25.
- Prepayment derived from the prepaid set, the estimator, removing deposits, and the setup-time
  invoice held for approval: Phases 26 and 27.
- A matched hospital row creating a Booking on its default: Phase 33 (it will call the same default
  rule).
- Contract master editing, categories and the AA code scheme (18), the master procedure list and
  procedure-first picker (19), and hospital data setting the Contract (US-04.3.6).
- The wider sweep of Contract and fee detail from anaesthetist screens (for example "FIXED CONTRACT
  PRICE"): Phase 43a.

## Manual test checklist

The agent runs every item itself in the running app and reports it with evidence; none is handed
to the owner (ROADMAP.md "Owner review: agents test themselves").

- [ ] Reset. Fire MSG-STG-1001 (Phase 14's re-homed trigger), then open Souter Tue 28 Jul
      St George's AM on mobile: Sarah Mitchell's Booking shows "St George's RVG Default Hospital" on
      mobile, web and the Admin card; Admin also shows "Billed to St George's".
- [ ] Add a Booking manually on a Southern Cross List: pick the procedure, and the Contract is
      preselected to Southern Cross's default. The picker offers SXAP and nib's Contract but never a
      St George's Contract, and there is no "None".
- [ ] On a Christchurch Eye Surgery List (Souter's Wednesday AM recurring List), open the picker on
      an eye Booking and type HNZCAT: the list narrows to "Christchurch Eye Surgery HNZ schedule"
      with "HNZCATall · Cataract, all" shown, and the CES default stays at the top. Type that
      Contract's AA code: same. Type nonsense: "No Contract matches" with the default still offered.
      On the Southern Cross List, HNZCAT finds nothing (search stays in scope).
- [ ] On Fitzgerald Tue 14 (Southern Cross / Mr Doyle), the bariatric procedure offers Doyle's
      fixed-price Contract; a non-bariatric procedure on the same List does not.
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
      Hospital to ACC elective services via St George's". Its fee and payer are as before. Re-pick it as the office:
      the flag clears. Reload: the record survives.
- [ ] Admin Master Data: turn nib's direct claims off. nib's Contract drops out of the picker, and
      Marsh's Procedure on it shows the "no longer applies" caption. Turn it back on.
- [ ] Office: set pre-payment on a Booking billed to a hospital: refused ("No procedure on this
      booking bills the patient."). On a patient-billed Booking the switch sets "Full estimate", and
      15a's unpaid-prepayment warning appears in both apps. Admin Day Tue 21: "Raise sample
      warnings" still stages the prepayment sample, and "Clear sample warnings" restores it.
- [ ] S3: authorise Souter Mon 20 AM and PM. Holt, Prentice nib and Prentice St George's invoices
      match item 1's figures to the cent.
- [ ] S4 Beat 1: Riley's Booking shows the office flag ("Deposit $800 · seeded"), 15a's warning shows
      and completion is not blocked, and raising the pre-invoice gives $800 + GST. Nair's full
      pre-payment still nets its balance to $0.
- [ ] S4 Beat 3: Billing monitor, Demo actions, "Trigger billing failure" still fails only the COS
      Booking, its sibling bills, and "Resolve and retry" clears it.
- [ ] Invoice document wording: pre-payment and post-procedure wordings are unchanged; the AIA
      Booking reads the post-procedure wording (logged for Phase 21).
- [ ] No "billing route", "payment category", "Reimbursement" category or "None (default pricing)"
      text anywhere in the three apps. No en or em dashes in new copy.
- [ ] The PWA build shows the Contract chip and picker as bottom sheets, search included.
- [ ] Catalogue screenshots: the recipes for the covered items above (US-04.2.1, US-04.3.1, US-04.3.2, US-04.3.3, US-03.4.1, US-03.1.2 and US-03.2.3 re-shot, the rest of the EP-04 table checked) are created or updated, any recipe this phase broke is re-pointed, a full `npm run capture` ends with no failed recipe and no story without a recipe, the covered items' new shots are checked by eye, and `npm run verify:board` is green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots` and `npm run verify:board` are all green.

## Demo guide updates

Patch these in the same session, in `docs/demo-guide/` and the matching sections of
`master-demo-guide.html`. Line numbers are July's; Phases 15, 15a, 18 and 19 edit the same files (18
drops the ACC advisory wording, 15a rewrites S4 Beat 1's gate as a warning), so locate each passage
by its text:

- `03-demo-script.md`:
  - **S1 Beat 1 Expected:** add "Sarah's Booking arrives on St George's default Contract, shown on
    mobile, web and Admin".
  - **S2 Beat 2:** the phone booking lands on St George's default. Remove any mention of choosing a
    billing route or an insurer.
  - **S2 Beat 4:** add a "Worth pointing at" line on Dr Morrison's "Contract changed by
    anaesthetist" flag (approval arrives in Phase 21).
  - **S3 Beat 1 Say** (line 237): replace "It resolves the explicit payer per Procedure, applies the
    governing Contract, and groups by counterparty" with "It reads the one Contract on each
    Procedure, bills that Contract's holder, and groups by counterparty". The figures are unchanged.
  - **S4 Beat 1 Say** (line 297, as 15a left it): "The office flagged this booking for pre-payment"
    instead of "A patient-funded pre-payment", keeping 15a's warning wording.
  - Add one "Worth pointing at" line where the picker is shown: "Pick the procedure, then its
    Contract. The hospital narrows the list, and typing a holder's own code finds it among
    thousands. The anaesthetist sees only the name."
- `04-presenter-cheat-sheet.md`:
  - Glossary rows "Procedure" (line 18: "each selects exactly one Contract") and "ACC route"
    (line 31: ACC is a Contract held by a hospital or other holder, not a route).
  - Replace "Three billing routes" (line 82 on, including the direct-insurer and insured
    reimbursement bullets 92 to 94) with "One Contract per Procedure": the hospital's default
    Contract, a picker filtered by procedure and hospital with holder-code search, the Contract
    says who pays, insurer and funding source held on neither Booking nor Patient, anaesthetist
    change flagged.
  - Update the myths at lines 172 and 173 ("Every insured patient is billed to an insurer": the
    Contract decides) and 285.
- `02-workflows-and-handoffs.md` (lines 22, 125, 301 to 303, 340 to 344) and
  `01-personas-and-responsibilities.md` (lines 194, 204): route and insurer wording becomes Contract
  wording.
- Control Panel S1 scenario text and the Phase 14 registry entry description (item 18).

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19),
run after the review pass and before the PROGRESS.md entry. Re-run
`node docs/prototype-build/catch-up/tools/recipe-status.mjs 20` first: earlier phases may have
changed these recipes since this plan was written.

**Covered items.** When the phase is done, each recipe in `requirements-board/capture/recipes/`
matches what was built. The tool lists every story under EP-04 and FT-03.4, so the table also holds
the stories whose recipe belongs to Phases 18, 21, 22, 23, 24 or 25; for those the cell says what this
phase leaves alone. Shots are Admin unless an app is named; the anaesthetist apps get the Contract
row, chip and picker:

| Item | Recipe at plan time | When this phase is done |
|---|---|---|
| [US-04.1.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.1.1.md) Contract categories | partial · admin-contract-types | Phase 18 owns it and expects `captured`. No new screen here: leave the recipe, and let the `--dry` run catch any selector this phase moved. "RVG Default Post-paid" is now offered as a Contract the picker can choose, so no caption change is needed |
| [US-04.1.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.1.2.md) Create, edit, retire Contracts | partial · admin-contracts, admin-edit-contract | Phase 18 owns it; versioning is built in Phase 25, so it stays `partial` with that reason. No change here beyond `--dry` |
| [US-04.1.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.1.3.md) Contract audit and versioning | absent | Stays `absent`. Phase 25 builds versions and the lock; the reason keeps saying so. No change here |
| [US-04.1.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.1.4.md) AA identifier for every Contract | absent · placeholder (Phase 18 fills it) | Phase 18 owns the recipe. This phase shows the AA code on every picker row, which the new `contract-picker` shots (US-04.3.2) cover, so nothing is added here |
| [US-04.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.1.md) Holder, scope and organisational reach | partial · admin-contract-holder | `captured`. Scope now narrows the picker, so re-shoot `admin-contract-holder` and add a `narrows-picker` state: a Contract scoped to Christchurch Eye Surgery (or to specific anaesthetists) offered on its own List and absent from another hospital's List. Highlight the scope chips, then the picker. Insurer and funding-source scope stay descriptive (OQ-55, OQ-67), so say that in the caption. Drop the partial reason |
| [US-04.2.10](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.10.md) Pricing effective from a date | absent · placeholder (Phase 18 fills it) | Phase 18 owns the recipe. No change here |
| [US-04.2.11](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.11.md) Combination Contracts | absent | Stays `absent` with the reason "Phase 23 builds this". The picker rule already offers a Contract set against several procedures, but no combination Contract is seeded until Phase 23, so there is nothing to shoot here |
| [US-04.2.12](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.12.md) Payment setting: full payment or split | absent | Stays `absent`. Phase 22 builds the payment setting; `funderOverride` stays the split here. No change |
| [US-04.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.2.md) Contract pricing and adjustment rules | captured · admin-pricing-basis[type-1,type-2,type-3,rate-time] | Stays `captured` for the pricing basis; Phase 24 closes the adjustment half. Nothing here changes the screen, but the Contract list it clicks through changes names, so re-check it with `--dry` (see the broken recipes) |
| [US-04.2.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.4.md) Fixed fee schedule lines | partial · admin-price-rows | Phase 18 owns it and expects `captured`. No change here |
| [US-04.2.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.5.md) Multi-procedure rule per Contract | partial · admin-ordinal-rows | Stays `partial`; Phase 23 builds the per-Contract rule. No change here beyond `--dry` |
| [US-04.2.7](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.7.md) Required booking inputs | absent | Stays `absent`. Phase 21 builds required inputs; the reason names it. No change |
| [US-04.2.8](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.8.md) Invoice presentation and delivery | absent | Stays `absent`. Phase 22 builds layout, delivery and GST on the Contract; the reason names it. No change |
| [US-04.3.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.3.1.md) Exactly one Contract per Procedure | partial · admin-procedure-contract | `captured`. Re-shoot `admin-procedure-contract` on the office Booking detail (`C0009`): the Contract row with name, AA code and category, "Billed to" the holder, and no Route, Category or Insurer rows and no "None". The completion refusal ("Choose a Contract for this procedure.") has no UI path, so it is not shot. Highlight the Contract row. Caption "Every Procedure carries exactly one Contract". Drop the partial reason |
| [US-04.3.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.3.2.md) Filtered Contract list | partial · admin-contract-picker | `captured`. Re-shoot `admin-contract-picker` on `ContractPickerSheet` (`data-shot="contract-picker"`) with states `default` (sections "Default for <hospital>" and "For <procedure> at <hospital>", AA codes, category pills, and the office footer caption with the OQ-66 provisional note) and `holder-code` (type HNZCAT on a Christchurch Eye Surgery eye Booking: "HNZCATall · Cataract, all" as the matched line, the CES default still first). Add `web-contract-picker` and `mobile-contract-picker` for the anaesthetist view (name and AA code only, a Dialog on web and a bottom sheet on mobile) on a DRAFT List. Highlight the search field, then the matched row. Caption "Only the Contracts relevant to this Procedure". Drop the partial reason |
| [US-04.3.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.3.3.md) Default hospital Contract derived from location | partial · admin-default-contract, web-default-contract, mobile-default-contract | `captured`. Re-shoot all three (`C0001`, St George's default) with the Contract chip, and add an `added` state to each app showing a new Booking landing on the List hospital's default: for example the S1 "Fire hospital message" Booking for Sarah Mitchell on Souter Tue 28 Jul St George's AM, or a manual add on a Southern Cross List. Caption "Defaulted from the List's hospital". Drop the partial reason |
| [US-04.3.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.3.4.md) Admin sets Contracts at booking setup | captured · admin-billing-setup[summary,edit] | Stays `captured`. Keep the shot and state names; re-caption `edit` ("Contract and payer", no route or insurer) and re-point the highlights (the Route, Category and Insurer rows are gone) |
| [US-04.3.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.3.5.md) Contract locked at AUTHORISED | captured · admin-contract-before, admin-locked-contract | Stays `captured`; Phase 25 re-points the lock. Only the billing setup rows change here, so re-check the `office-billing-setup-1` highlights with `--dry` |
| [US-04.3.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.3.6.md) Hospital data sets the Contract | absent | Stays `absent`: Future Work, no phase builds it (OQ-22). This phase builds nothing visible for it |
| [US-04.3.7](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.3.7.md) Procedure not on the Contract's schedule | absent | Stays `absent` with the reason "Phase 21 builds this". This phase builds only the "no longer applies" caption, not the to-confirm flag |
| [US-04.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.4.1.md) Mandatory default Contract | captured · admin-add-hospital[added,contracts] | Stays `captured`; no change expected. The new default Contract's name comes from Phase 18, so check the `contracts` state caption with `--dry` |
| [US-03.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.4.1.md) Anaesthetist can change the Contract | partial · web-edit-operation, mobile-edit-operation | `captured`. Re-shoot `edit-operation` on web and mobile (`C0009`, DRAFT): the Contract row with a teal "Change", the reference field, and the caption "The office checks Contract changes when you submit the list". Add a `changed` state after a pick with the "Changed by you" pill. Add an Admin shot `contract-changed-flag` on the Review queue for Dr Morrison Mon 20 showing "Contract changed by anaesthetist" with the from and to names. Caption "Every change is audited and flagged for the office". Office approval is Phase 21 |
| [US-03.1.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.1.2.md) See the Contract on each Procedure | partial · web-procedure-contract, mobile-procedure-contract | `captured`. Re-shoot `procedure-contract` on web and mobile (the Contract name and AA code only, no route or payer) and add a `list` state on the List view (web `ListDetailView`, mobile `ListDetailScreen`) showing the one-line Contract caption before the session. Highlight the Contract caption. Drop the partial reason |
| [US-03.2.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.2.3.md) Add additional Procedures | partial · web-add-procedure[before,copy,added], mobile-add-procedure[before,added] | `captured`. Re-shoot `add-procedure` on both apps; in `added`, procedure 2 shows its own Contract row starting on procedure 1's Contract and changeable by its own "Change". Keep the state names. The Admin add path stays unshot (the admin Booking screen covers it). Drop the partial reason |

**Recipes this phase breaks.**
- `US-06.3.5` (pre-payment re-checked): its `after` state clicks `role=button[name="Edit billing
  setup"]` then `[role=dialog] >> role=button[name="Self-funded"]` and "Save billing setup", and its
  captions say "Payment category". The payment category is gone (work items 2 and 13). Re-point it at
  the office "Set pre-payment" switch in `PrepaymentFlagSheet` (turn "Pre-payment required" off) and
  re-caption it, keeping the shot name `recheck-on-change` and the `card-prepayment` hook.
- `US-07.2.2` (office review): the `edit` state is captioned "choosing the route and Contract", the
  review table's Route column becomes "Payer" (work item 16) and the `Edit billing setup` button keeps
  its name only if the sheet keeps it. Re-caption and re-point.
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
- Pre-payment recipes (`US-06.2.1`, `US-06.2.2`, `US-06.2.3`, `US-06.3.1` to `US-06.3.4`, `US-06.4.1`):
  they click `daygrid-block-prepayment` and read the pre-payment banner, now driven by the Booking
  flag rather than the category. The seed keeps the same Bookings flagged, so they should still
  match; the `--dry` run is the check.
- `US-04.2.1`, `US-04.2.2`, `US-04.2.5`, `US-05.5.1`: they click Contracts by name and read the
  office billing setup. Phase 18 already re-pointed the names; check them again after the seed
  remap.

**ATLAS.md.** Seed data and Personas and IDs (how each seeded Booking's Contract, payer and
pre-payment flag now read, and the notes that say "nib insurer route" or "billing route"), Overlays
(the Contract picker, the "Contract and payer" sheet and `PrepaymentFlagSheet`), Existing hooks
(`contract-picker` and any moved `office-billing-setup-*` hooks) and the button-text list for the
billing setup. Routes are unchanged.

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
- **The filter matches the catalogue:** procedure, then hospital, then code and anaesthetist scope;
  no insurer, funding-source or surgeon input anywhere; no out-of-scope Contract offered or accepted
  by the store (the UI cannot bypass `setProcedureContract`); the default always offered, also under
  a search; "None" gone everywhere; no insurer-held Contract offered for an insurer that does not
  accept direct claims; search confined to the in-scope set; no flat select of every Contract.
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
  and SUBMITTED; nobody on AUTHORISED. `setBookingPrepayment` is office only, all or nothing,
  patient-billed Bookings only, and locked once a pre-invoice exists. No completion gate returns.
- **Leftovers:** no remaining route, category or insurer-on-Procedure vocabulary in code, copy,
  audit labels, shots or the demo guide (the item 8 greps). The stored-Contract fallback and
  `contractIneffective` are deliberately kept for Phase 25.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry; ROADMAP.md "Owner review: agents test
  themselves"): the defaults built for open questions, provisional readings, anything logged
  rather than fixed, and the screens worth a look, each with its route and persona.
- **Catalogue screenshots result:** the recipes changed (the seven re-shot items and the broken ones: US-06.3.5, US-07.2.2, US-11.4.2, US-02.5.5), the `requirements-board/capture/REPORT.md` counts (captured, partial, absent, failed) before and after, and the reasons handed on: US-11.4.2 to Phase 21 (reimbursement wording), US-04.3.7 and US-04.2.7 to Phase 21, US-04.2.12 and US-04.2.8 to Phase 22, US-04.2.11 and US-04.2.5 to Phase 23, US-04.1.3 and US-04.1.2 to Phase 25.
- Status row for catch-up Phase 20, and a phase entry: drift-check result against 501b0b8, D2 built
  as answered, OQ-66 built as its recommendation, what 15a, 18 and 19 were found to provide, the
  session 1 and session 2 split, the adversarial pass, the tests added (contract selection and
  search, parity, store actions, audit-derived flag), `PERSIST_VERSION` old to new, the broken
  capture recipes, and the handoff to 21 (US-11.4.2's Contract-holder flag and wording).
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
    - A Procedure with no master entry and no code sees only Contracts with no procedure, code or
      group scope.
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
  - **Provisional (OQ-66, one place):** the picker filtered by procedure and hospital, search by AA
    code and holder code inside the in-scope set, a 50-row cap.
  - **Interims, with the phases that replace them:** holder-as-payer (21), `funderOverride` as the
    split (22), the office-set Booking pre-payment flag and the seeded deposit (27).
